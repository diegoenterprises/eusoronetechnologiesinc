/**
 * WEB CACHE MANAGER — Pre-cache loads, facilities, geofences, emergency contacts
 *
 * Downloads all data needed for offline operation before a trip begins.
 * Uses the existing tRPC API to fetch, then stores in IndexedDB.
 */

import { offlineDB } from "./db-api";
import type { OfflineLoad, OfflineFacility, OfflineEmergencyContact } from "./types";

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

type FetchFn = (url: string) => Promise<any>;

export class WebCacheManager {
  private fetchFn: FetchFn;
  private serverUrl: string;

  constructor(serverUrl: string, fetchFn?: FetchFn) {
    this.serverUrl = serverUrl;
    this.fetchFn = fetchFn || (async (url: string) => {
      const resp = await fetch(url, { credentials: "include" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return resp.json();
    });
  }

  /**
   * Pre-cache everything for a load — call before going offline
   */
  async preCacheForLoad(loadId: string): Promise<{ loads: number; facilities: number; geofences: number; contacts: number }> {
    const results = { loads: 0, facilities: 0, geofences: 0, contacts: 0 };

    try {
      // 1. Cache load details
      const loadData = await this.fetchTRPC("loads.getById", { id: loadId });
      if (loadData?.result?.data) {
        const l = loadData.result.data;
        await offlineDB.loads.put(this.mapLoad(l));
        results.loads = 1;
      }
    } catch (e) { console.warn("[CacheManager] Load cache failed:", e); }

    try {
      // 2. Cache facilities
      const facilitiesData = await this.fetchTRPC("facilities.getAll", {});
      if (facilitiesData?.result?.data) {
        const facilities = facilitiesData.result.data.map((f: any) => this.mapFacility(f));
        await offlineDB.facilities.batchPut(facilities);
        results.facilities = facilities.length;
      }
    } catch (e) { console.warn("[CacheManager] Facilities cache failed:", e); }

    try {
      // 3. Cache geofences for this load
      const gfData = await this.fetchTRPC("geofencing.getByLoadId", { loadId });
      if (gfData?.result?.data) {
        results.geofences = gfData.result.data.length;
      }
    } catch (e) { console.warn("[CacheManager] Geofences cache failed:", e); }

    try {
      // 4. Cache emergency contacts
      const contacts = await this.fetchTRPC("contacts.getEmergency", {});
      if (contacts?.result?.data) {
        const mapped = contacts.result.data.map((c: any) => this.mapContact(c));
        await offlineDB.emergencyContacts.batchPut(mapped);
        results.contacts = mapped.length;
      }
    } catch (e) { console.warn("[CacheManager] Contacts cache failed:", e); }

    console.log("[CacheManager] Pre-cached:", results);
    return results;
  }

  /**
   * Pre-cache all active loads for the current driver
   */
  async preCacheActiveLoads(): Promise<number> {
    try {
      const data = await this.fetchTRPC("loads.getMyLoads", { status: "active" });
      if (!data?.result?.data) return 0;
      const loads = data.result.data.map((l: any) => this.mapLoad(l));
      await offlineDB.loads.batchPut(loads);
      return loads.length;
    } catch (e) {
      console.warn("[CacheManager] Active loads cache failed:", e);
      return 0;
    }
  }

  /**
   * Check if cache is stale for a given load
   */
  async isCacheStale(loadId: string): Promise<boolean> {
    const load = await offlineDB.loads.get(loadId);
    if (!load) return true;
    return Date.now() - load.cachedAt > CACHE_TTL_MS;
  }

  /**
   * Clear all cached data
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      offlineDB.loads.clear(),
      offlineDB.facilities.clear(),
      offlineDB.emergencyContacts.clear(),
    ]);
  }

  /**
   * Get offline stats
   */
  async getStats(): Promise<{ loads: number; facilities: number; contacts: number }> {
    const [loads, facilities, contacts] = await Promise.all([
      offlineDB.loads.getAll(),
      offlineDB.facilities.getAll(),
      offlineDB.emergencyContacts.getAll(),
    ]);
    return { loads: loads.length, facilities: facilities.length, contacts: contacts.length };
  }

  // ── Private helpers ────────────────────────────────────────────────────

  private async fetchTRPC(procedure: string, input: Record<string, any>) {
    const url = `${this.serverUrl}/api/trpc/${procedure}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`;
    return this.fetchFn(url);
  }

  private mapLoad(l: any): OfflineLoad {
    return {
      serverId: String(l.id),
      status: l.status || "unknown",
      statusUpdatedAt: l.statusUpdatedAt ? new Date(l.statusUpdatedAt).getTime() : Date.now(),
      pickupFacilityId: String(l.pickupFacilityId || ""),
      pickupFacilityName: l.pickupFacilityName || l.pickupLocation || "",
      pickupAddress: l.pickupAddress || "",
      pickupLatitude: l.pickupLatitude || 0,
      pickupLongitude: l.pickupLongitude || 0,
      pickupWindowStart: l.pickupWindowStart ? new Date(l.pickupWindowStart).getTime() : 0,
      pickupWindowEnd: l.pickupWindowEnd ? new Date(l.pickupWindowEnd).getTime() : 0,
      deliveryFacilityId: String(l.deliveryFacilityId || ""),
      deliveryFacilityName: l.deliveryFacilityName || l.deliveryLocation || "",
      deliveryAddress: l.deliveryAddress || "",
      deliveryLatitude: l.deliveryLatitude || 0,
      deliveryLongitude: l.deliveryLongitude || 0,
      deliveryWindowStart: l.deliveryWindowStart ? new Date(l.deliveryWindowStart).getTime() : 0,
      deliveryWindowEnd: l.deliveryWindowEnd ? new Date(l.deliveryWindowEnd).getTime() : 0,
      commodity: l.commodity || "",
      hazmatClass: l.hazmatClass,
      unNumber: l.unNumber,
      weight: l.weight,
      rate: l.rate || 0,
      detentionRate: l.detentionRate,
      routePolyline: l.routePolyline,
      estimatedMiles: l.estimatedMiles || l.miles,
      estimatedDuration: l.estimatedDuration,
      shipperJson: l.shipper ? JSON.stringify(l.shipper) : undefined,
      brokerJson: l.broker ? JSON.stringify(l.broker) : undefined,
      requirementsJson: l.requirements ? JSON.stringify(l.requirements) : undefined,
      cachedAt: Date.now(),
    };
  }

  private mapFacility(f: any): OfflineFacility {
    return {
      serverId: String(f.id),
      name: f.name || "",
      address: f.address || "",
      latitude: f.latitude || 0,
      longitude: f.longitude || 0,
      phone: f.phone,
      contactName: f.contactName,
      hoursJson: f.hours ? JSON.stringify(f.hours) : undefined,
      instructions: f.instructions,
      cachedAt: Date.now(),
    };
  }

  private mapContact(c: any): OfflineEmergencyContact {
    return {
      type: c.type || "general",
      name: c.name || "",
      phone: c.phone || "",
      available24_7: c.available24_7 ?? true,
      notes: c.notes,
      cachedAt: Date.now(),
    };
  }
}

export const webCacheManager = new WebCacheManager(
  typeof window !== "undefined" ? window.location.origin : ""
);
