import { database, collections } from '@/database';
import { Q } from '@nozbe/watermelondb';
import { syncEngine } from './sync-engine';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface GPSPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
}

interface GeofenceEventData {
  geofenceId: string;
  loadId: string;
  geofenceType: string;
  eventType: 'ENTER' | 'EXIT' | 'DWELL';
  latitude: number;
  longitude: number;
  timestamp: Date;
  dwellDurationMs?: number;
}

interface CachedGeofence {
  id: string;
  serverId: string;
  loadId: string;
  type: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  polygon?: { lat: number; lng: number }[];
  isActive: boolean;
  dwellThresholdSeconds?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOCAL GEOFENCE SERVICE
// All geofence processing runs on-device — no internet required.
// Geofences are downloaded when a load is assigned and cached in WatermelonDB.
// ═══════════════════════════════════════════════════════════════════════════════

class LocalGeofenceService {
  // In-memory state for fast lookups
  private geofences: Map<string, CachedGeofence> = new Map();
  private currentStates: Map<string, 'INSIDE' | 'OUTSIDE'> = new Map();
  private dwellTimers: Map<string, number> = new Map(); // geofenceId -> entry timestamp
  private dwellEmitted: Set<string> = new Set(); // Track which dwell events we've emitted
  private lastPosition: GPSPoint | null = null;

  /**
   * Load geofences for a load into memory
   */
  async loadGeofencesForLoad(loadId: string): Promise<void> {
    const geofences = await collections.geofences
      .query(Q.where('load_id', loadId), Q.where('is_active', true))
      .fetch();

    for (const gf of geofences) {
      const cached: CachedGeofence = {
        id: gf.id,
        serverId: gf.serverId,
        loadId: gf.loadId,
        type: gf.type,
        latitude: gf.latitude,
        longitude: gf.longitude,
        radiusMeters: gf.radiusMeters,
        polygon: gf.polygon,
        isActive: gf.isActive,
        dwellThresholdSeconds: gf.dwellThresholdSeconds,
      };

      this.geofences.set(gf.id, cached);
      this.currentStates.set(gf.id, 'OUTSIDE'); // Assume outside initially
    }

    console.log(`[LocalGeofence] Loaded ${geofences.length} geofences for load ${loadId}`);
  }

  /**
   * Check a GPS point against all active geofences
   * This is called for EVERY GPS update and runs LOCALLY
   */
  async checkPoint(point: GPSPoint): Promise<GeofenceEventData[]> {
    const events: GeofenceEventData[] = [];

    for (const [id, geofence] of this.geofences) {
      if (!geofence.isActive) continue;

      const isInside = this.isPointInGeofence(point, geofence);
      const wasInside = this.currentStates.get(id) === 'INSIDE';

      // ENTER event
      if (isInside && !wasInside) {
        const event: GeofenceEventData = {
          geofenceId: id,
          loadId: geofence.loadId,
          geofenceType: geofence.type,
          eventType: 'ENTER',
          latitude: point.latitude,
          longitude: point.longitude,
          timestamp: point.timestamp,
        };

        events.push(event);
        this.currentStates.set(id, 'INSIDE');
        this.dwellTimers.set(id, point.timestamp.getTime());
        this.dwellEmitted.delete(id); // Reset dwell emission

        console.log(`[LocalGeofence] ENTER: ${geofence.type} for load ${geofence.loadId}`);
      }

      // EXIT event
      else if (!isInside && wasInside) {
        const entryTime = this.dwellTimers.get(id);
        const dwellDuration = entryTime ? point.timestamp.getTime() - entryTime : 0;

        const event: GeofenceEventData = {
          geofenceId: id,
          loadId: geofence.loadId,
          geofenceType: geofence.type,
          eventType: 'EXIT',
          latitude: point.latitude,
          longitude: point.longitude,
          timestamp: point.timestamp,
          dwellDurationMs: dwellDuration,
        };

        events.push(event);
        this.currentStates.set(id, 'OUTSIDE');
        this.dwellTimers.delete(id);

        console.log(`[LocalGeofence] EXIT: ${geofence.type} after ${Math.round(dwellDuration / 60000)}min`);
      }

      // DWELL event (still inside, check threshold)
      else if (isInside && wasInside) {
        const entryTime = this.dwellTimers.get(id);
        const dwellThreshold = (geofence.dwellThresholdSeconds || 7200) * 1000; // Default 2 hours

        if (entryTime && !this.dwellEmitted.has(id)) {
          const dwellDuration = point.timestamp.getTime() - entryTime;

          if (dwellDuration >= dwellThreshold) {
            const event: GeofenceEventData = {
              geofenceId: id,
              loadId: geofence.loadId,
              geofenceType: geofence.type,
              eventType: 'DWELL',
              latitude: point.latitude,
              longitude: point.longitude,
              timestamp: point.timestamp,
              dwellDurationMs: dwellDuration,
            };

            events.push(event);
            this.dwellEmitted.add(id);

            console.log(`[LocalGeofence] DWELL: ${geofence.type} exceeded ${geofence.dwellThresholdSeconds}s`);
          }
        }
      }
    }

    // Process events locally AND queue for sync
    for (const event of events) {
      await this.processEventLocally(event);
      await this.queueEventForSync(event);
    }

    this.lastPosition = point;
    return events;
  }

  /**
   * Process event locally (store in local database)
   */
  private async processEventLocally(event: GeofenceEventData): Promise<void> {
    // Store event in local database
    await database.write(async () => {
      await collections.geofenceEvents.create((record: any) => {
        record.geofenceId = event.geofenceId;
        record.loadId = event.loadId;
        record.geofenceType = event.geofenceType;
        record.eventType = event.eventType;
        record.latitude = event.latitude;
        record.longitude = event.longitude;
        record.timestamp = event.timestamp.getTime();
        record.dwellDurationMs = event.dwellDurationMs;
        record.syncStatus = 'PENDING';
      });
    });
  }

  /**
   * Queue event for server sync
   */
  private async queueEventForSync(event: GeofenceEventData): Promise<void> {
    await syncEngine.queueAction({
      actionType: 'GEOFENCE_EVENT',
      payload: {
        ...event,
        timestamp: event.timestamp.toISOString(),
      },
      priority: 'CRITICAL',
      requiresOrder: true,
    });
  }

  /**
   * Check if point is inside geofence (circle or polygon)
   */
  private isPointInGeofence(point: GPSPoint, geofence: CachedGeofence): boolean {
    if (geofence.polygon && geofence.polygon.length > 0) {
      return this.isPointInPolygon(point, geofence.polygon);
    }

    const distance = this.haversineDistance(
      point.latitude,
      point.longitude,
      geofence.latitude,
      geofence.longitude
    );

    return distance <= geofence.radiusMeters;
  }

  /**
   * Haversine distance formula (meters)
   */
  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Point-in-polygon using ray casting
   */
  private isPointInPolygon(
    point: GPSPoint,
    polygon: { lat: number; lng: number }[]
  ): boolean {
    let inside = false;
    const x = point.longitude;
    const y = point.latitude;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng;
      const yi = polygon[i].lat;
      const xj = polygon[j].lng;
      const yj = polygon[j].lat;

      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }

    return inside;
  }

  /**
   * Clear geofences for a load (when load is complete)
   */
  clearGeofencesForLoad(loadId: string): void {
    for (const [id, gf] of this.geofences) {
      if (gf.loadId === loadId) {
        this.geofences.delete(id);
        this.currentStates.delete(id);
        this.dwellTimers.delete(id);
        this.dwellEmitted.delete(id);
      }
    }
  }

  /**
   * Check if currently inside a specific geofence type
   */
  isInsideGeofenceType(loadId: string, type: string): boolean {
    for (const [id, gf] of this.geofences) {
      if (gf.loadId === loadId && gf.type === type) {
        return this.currentStates.get(id) === 'INSIDE';
      }
    }
    return false;
  }
}

export const localGeofence = new LocalGeofenceService();
