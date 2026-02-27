import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { database, collections } from '@/database';
import { localGeofence } from './local-geofence.service';
import { syncEngine } from './sync-engine';
import { antiSpoofing } from './anti-spoofing.service';

const GPS_TASK_NAME = 'EUSOTRIP_GPS_TRACKING';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface GPSConfig {
  accuracy: Location.Accuracy;
  distanceInterval: number; // meters
  timeInterval: number; // milliseconds
  foregroundService?: {
    notificationTitle: string;
    notificationBody: string;
  };
}

const TRACKING_CONFIGS: Record<string, GPSConfig> = {
  IDLE: {
    accuracy: Location.Accuracy.Balanced,
    distanceInterval: 500,
    timeInterval: 60000, // 1 minute
  },
  APPROACHING: {
    accuracy: Location.Accuracy.High,
    distanceInterval: 100,
    timeInterval: 15000, // 15 seconds
  },
  AT_FACILITY: {
    accuracy: Location.Accuracy.Highest,
    distanceInterval: 20,
    timeInterval: 10000, // 10 seconds
  },
  IN_TRANSIT: {
    accuracy: Location.Accuracy.High,
    distanceInterval: 200,
    timeInterval: 30000, // 30 seconds
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// GPS TRACKING SERVICE
// Background GPS tracking that works fully offline.
// Stores breadcrumbs locally in WatermelonDB, syncs in batches when online.
// ═══════════════════════════════════════════════════════════════════════════════

class GPSTrackingService {
  private currentLoadId: string | null = null;
  private currentConfig: string = 'IDLE';
  private lastLocation: Location.LocationObject | null = null;
  private breadcrumbBuffer: any[] = [];
  private bufferFlushInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Start GPS tracking for a load
   */
  async startTracking(loadId: string): Promise<void> {
    this.currentLoadId = loadId;

    // Request permissions
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      throw new Error('Foreground location permission required');
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.warn('Background location permission not granted - tracking may stop when app is backgrounded');
    }

    // Load geofences for this load
    await localGeofence.loadGeofencesForLoad(loadId);

    // Start background location updates
    await Location.startLocationUpdatesAsync(GPS_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      distanceInterval: 100,
      timeInterval: 15000,
      foregroundService: {
        notificationTitle: 'EusoTrip Active',
        notificationBody: 'Tracking your trip',
        notificationColor: '#1a73e8',
      },
      pausesUpdatesAutomatically: false,
      activityType: Location.ActivityType.AutomotiveNavigation,
    });

    // Start buffer flush interval (sync GPS points in batches)
    this.bufferFlushInterval = setInterval(() => {
      this.flushBreadcrumbBuffer();
    }, 30000); // Every 30 seconds

    console.log(`[GPS] Started tracking for load ${loadId}`);
  }

  /**
   * Stop GPS tracking
   */
  async stopTracking(): Promise<void> {
    await Location.stopLocationUpdatesAsync(GPS_TASK_NAME);

    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
    }

    // Flush any remaining breadcrumbs
    await this.flushBreadcrumbBuffer();

    // Clear geofences
    if (this.currentLoadId) {
      localGeofence.clearGeofencesForLoad(this.currentLoadId);
    }

    this.currentLoadId = null;
    console.log('[GPS] Stopped tracking');
  }

  /**
   * Process incoming GPS location (called by TaskManager)
   */
  async processLocation(location: Location.LocationObject): Promise<void> {
    if (!this.currentLoadId) return;

    const point = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude,
      accuracy: location.coords.accuracy || 0,
      speed: location.coords.speed,
      heading: location.coords.heading,
      timestamp: new Date(location.timestamp),
    };

    // Run anti-spoofing checks
    const previousPoint = this.lastLocation ? {
      latitude: this.lastLocation.coords.latitude,
      longitude: this.lastLocation.coords.longitude,
      altitude: this.lastLocation.coords.altitude ?? undefined,
      accuracy: this.lastLocation.coords.accuracy || 0,
      speed: this.lastLocation.coords.speed ?? undefined,
      timestamp: new Date(this.lastLocation.timestamp),
    } : null;

    const spoofResult = antiSpoofing.checkLocation(point, previousPoint);

    // Store breadcrumb locally
    await this.storeBreadcrumb(point, spoofResult);

    // Check geofences (runs locally, no internet needed)
    if (!spoofResult.isMock) {
      await localGeofence.checkPoint(point);
    }

    this.lastLocation = location;
  }

  /**
   * Store breadcrumb in local database
   */
  private async storeBreadcrumb(
    point: any,
    spoofResult: { isMock: boolean; flags: string[] }
  ): Promise<void> {
    // Add to buffer
    this.breadcrumbBuffer.push({
      loadId: this.currentLoadId,
      ...point,
      timestamp: point.timestamp.getTime(),
      isMock: spoofResult.isMock,
      spoofFlags: spoofResult.flags,
      syncStatus: 'PENDING',
    });

    // Store immediately in local DB
    await database.write(async () => {
      await collections.gpsBreadcrumbs.create((record: any) => {
        record.loadId = this.currentLoadId!;
        record.latitude = point.latitude;
        record.longitude = point.longitude;
        record.altitude = point.altitude;
        record.accuracy = point.accuracy;
        record.speed = point.speed;
        record.heading = point.heading;
        record.timestamp = point.timestamp.getTime();
        record.isMock = spoofResult.isMock;
        record.spoofFlags = spoofResult.flags;
        record.syncStatus = 'PENDING';
      });
    });

    // Flush buffer if it's getting large
    if (this.breadcrumbBuffer.length >= 50) {
      await this.flushBreadcrumbBuffer();
    }
  }

  /**
   * Flush breadcrumb buffer to sync queue
   */
  private async flushBreadcrumbBuffer(): Promise<void> {
    if (this.breadcrumbBuffer.length === 0) return;

    const points = [...this.breadcrumbBuffer];
    this.breadcrumbBuffer = [];

    await syncEngine.queueAction({
      actionType: 'GPS_BREADCRUMBS',
      payload: {
        loadId: this.currentLoadId,
        points: points.map(p => ({
          ...p,
          timestamp: new Date(p.timestamp).toISOString(),
        })),
      },
      priority: 'NORMAL',
      requiresOrder: false,
    });

    console.log(`[GPS] Queued ${points.length} breadcrumbs for sync`);
  }

  /**
   * Update tracking configuration based on current state
   */
  async updateTrackingConfig(state: string): Promise<void> {
    let configKey = 'IN_TRANSIT';

    if (state.includes('APPROACH')) {
      configKey = 'APPROACHING';
    } else if (state.includes('AT_') || state.includes('LOADING') || state.includes('UNLOADING')) {
      configKey = 'AT_FACILITY';
    }

    if (configKey !== this.currentConfig) {
      this.currentConfig = configKey;
      // Note: Expo Location doesn't allow changing config while running
      // We'd need to stop and restart, which we avoid to prevent gaps
      console.log(`[GPS] Would update config to ${configKey}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BACKGROUND TASK HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

TaskManager.defineTask(GPS_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('[GPS Task] Error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };

    for (const location of locations) {
      await gpsTracking.processLocation(location);
    }
  }
});

export const gpsTracking = new GPSTrackingService();
