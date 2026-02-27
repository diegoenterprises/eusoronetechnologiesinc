import { database, collections } from '@/database';
import { api } from '@/lib/api';
import { Q } from '@nozbe/watermelondb';
import * as FileSystem from 'expo-file-system';

// ═══════════════════════════════════════════════════════════════════════════════
// CACHE MANAGER SERVICE
// Pre-caches everything needed for a load so the driver can work fully offline.
// Called when a load is assigned — downloads load details, geofences, facilities,
// and emergency contacts into WatermelonDB.
// ═══════════════════════════════════════════════════════════════════════════════

class CacheManagerService {
  /**
   * Pre-cache everything needed for a load (call when load is assigned)
   * This downloads all data needed to work offline for this load
   */
  async cacheLoadForOffline(loadId: string): Promise<{
    success: boolean;
    cachedItems: string[];
    errors: string[];
  }> {
    const cachedItems: string[] = [];
    const errors: string[] = [];

    try {
      // 1. Cache load details
      const load = await api.get(`/loads/${loadId}`);
      await database.write(async () => {
        await collections.loads.create((record: any) => {
          record.serverId = load.id;
          record.status = load.status;
          record.statusUpdatedAt = new Date(load.statusUpdatedAt).getTime();
          record.pickupFacilityId = load.pickupFacility.id;
          record.pickupFacilityName = load.pickupFacility.name;
          record.pickupAddress = load.pickupFacility.address;
          record.pickupLatitude = load.pickupFacility.latitude;
          record.pickupLongitude = load.pickupFacility.longitude;
          record.pickupWindowStart = new Date(load.pickupWindow.start).getTime();
          record.pickupWindowEnd = new Date(load.pickupWindow.end).getTime();
          record.deliveryFacilityId = load.deliveryFacility.id;
          record.deliveryFacilityName = load.deliveryFacility.name;
          record.deliveryAddress = load.deliveryFacility.address;
          record.deliveryLatitude = load.deliveryFacility.latitude;
          record.deliveryLongitude = load.deliveryFacility.longitude;
          record.deliveryWindowStart = new Date(load.deliveryWindow.start).getTime();
          record.deliveryWindowEnd = new Date(load.deliveryWindow.end).getTime();
          record.commodity = load.commodity;
          record.hazmatClass = load.hazmatClass;
          record.unNumber = load.unNumber;
          record.weight = load.weight;
          record.rate = load.rate;
          record.detentionRate = load.detentionRate;
          record.routePolyline = load.route?.polyline;
          record.estimatedMiles = load.route?.miles;
          record.estimatedDuration = load.route?.duration;
          record.shipper = load.shipper;
          record.broker = load.broker;
          record.requirements = load.requirements;
          record.cachedAt = Date.now();
        });
      });
      cachedItems.push('load_details');
    } catch (e: any) {
      errors.push(`load_details: ${e.message}`);
    }

    try {
      // 2. Cache geofences
      const geofences = await api.get(`/loads/${loadId}/geofences`);
      await database.write(async () => {
        for (const gf of geofences) {
          await collections.geofences.create((record: any) => {
            record.serverId = gf.id;
            record.loadId = loadId;
            record.type = gf.type;
            record.latitude = gf.latitude;
            record.longitude = gf.longitude;
            record.radiusMeters = gf.radiusMeters;
            record.polygon = gf.polygon;
            record.isActive = gf.isActive;
            record.dwellThresholdSeconds = gf.dwellThresholdSeconds;
            record.cachedAt = Date.now();
          });
        }
      });
      cachedItems.push(`geofences (${geofences.length})`);
    } catch (e: any) {
      errors.push(`geofences: ${e.message}`);
    }

    try {
      // 3. Cache facilities
      const loadRecords = await collections.loads
        .query(Q.where('server_id', loadId))
        .fetch();

      if (loadRecords[0]) {
        const facilityIds = [
          loadRecords[0].pickupFacilityId,
          loadRecords[0].deliveryFacilityId,
        ];

        for (const facilityId of facilityIds) {
          const facility = await api.get(`/facilities/${facilityId}`);
          await database.write(async () => {
            await collections.facilities.create((record: any) => {
              record.serverId = facility.id;
              record.name = facility.name;
              record.address = facility.address;
              record.latitude = facility.latitude;
              record.longitude = facility.longitude;
              record.phone = facility.phone;
              record.contactName = facility.contactName;
              record.hours = facility.hours;
              record.instructions = facility.instructions;
              record.cachedAt = Date.now();
            });
          });
        }
        cachedItems.push('facilities');
      }
    } catch (e: any) {
      errors.push(`facilities: ${e.message}`);
    }

    try {
      // 4. Cache emergency contacts
      const contacts = await api.get('/emergency-contacts');
      await database.write(async () => {
        // Clear old contacts
        const existing = await collections.emergencyContacts.query().fetch();
        for (const c of existing) {
          await c.destroyPermanently();
        }

        // Add new contacts
        for (const contact of contacts) {
          await collections.emergencyContacts.create((record: any) => {
            record.type = contact.type;
            record.name = contact.name;
            record.phone = contact.phone;
            record.available24_7 = contact.available24_7;
            record.notes = contact.notes;
            record.cachedAt = Date.now();
          });
        }
      });
      cachedItems.push('emergency_contacts');
    } catch (e: any) {
      errors.push(`emergency_contacts: ${e.message}`);
    }

    console.log(`[CacheManager] Cached for load ${loadId}:`, cachedItems);
    if (errors.length > 0) {
      console.warn(`[CacheManager] Errors:`, errors);
    }

    return {
      success: errors.length === 0,
      cachedItems,
      errors,
    };
  }

  /**
   * Check if a load is fully cached for offline
   */
  async isLoadCached(loadId: string): Promise<boolean> {
    const [load, geofences] = await Promise.all([
      collections.loads.query(Q.where('server_id', loadId)).fetchCount(),
      collections.geofences.query(Q.where('load_id', loadId)).fetchCount(),
    ]);

    return load > 0 && geofences > 0;
  }

  /**
   * Get cache status for a load
   */
  async getCacheStatus(loadId: string): Promise<{
    isCached: boolean;
    loadCached: boolean;
    geofenceCount: number;
    facilitiesCached: number;
    lastUpdated: Date | null;
  }> {
    const [loads, geofences, facilities] = await Promise.all([
      collections.loads.query(Q.where('server_id', loadId)).fetch(),
      collections.geofences.query(Q.where('load_id', loadId)).fetchCount(),
      collections.facilities.query().fetchCount(),
    ]);

    const load = loads[0];

    return {
      isCached: !!load && geofences > 0,
      loadCached: !!load,
      geofenceCount: geofences,
      facilitiesCached: facilities,
      lastUpdated: load ? new Date(load.cachedAt) : null,
    };
  }

  /**
   * Clear cache for a completed load
   */
  async clearLoadCache(loadId: string): Promise<void> {
    await database.write(async () => {
      // Clear geofences
      const geofences = await collections.geofences
        .query(Q.where('load_id', loadId))
        .fetch();
      for (const gf of geofences) {
        await gf.destroyPermanently();
      }

      // Clear synced breadcrumbs
      const breadcrumbs = await collections.gpsBreadcrumbs
        .query(Q.where('load_id', loadId), Q.where('sync_status', 'SYNCED'))
        .fetch();
      for (const bc of breadcrumbs) {
        await bc.destroyPermanently();
      }

      // Clear synced documents
      const docs = await collections.localDocuments
        .query(Q.where('load_id', loadId), Q.where('sync_status', 'SYNCED'))
        .fetch();
      for (const doc of docs) {
        // Delete file
        try {
          await FileSystem.deleteAsync(doc.localPath, { idempotent: true });
        } catch (e) {}
        await doc.destroyPermanently();
      }

      // Keep load record for history
    });

    console.log(`[CacheManager] Cleared cache for load ${loadId}`);
  }

  /**
   * Get total cache size
   */
  async getCacheSize(): Promise<number> {
    const docsDir = `${FileSystem.documentDirectory}eusotrip_docs/`;
    const info = await FileSystem.getInfoAsync(docsDir);

    if (info.exists) {
      // Note: Expo doesn't provide directory size, would need to iterate
      return 0; // Placeholder
    }

    return 0;
  }

  /**
   * Clear all expired cache
   */
  async clearExpiredCache(): Promise<void> {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    await database.write(async () => {
      const oldLoads = await collections.loads
        .query(Q.where('cached_at', Q.lt(thirtyDaysAgo)))
        .fetch();

      for (const load of oldLoads) {
        await this.clearLoadCache(load.serverId);
        await load.destroyPermanently();
      }
    });
  }
}

export const cacheManager = new CacheManagerService();
