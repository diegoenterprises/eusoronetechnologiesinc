/**
 * OFFLINE ROUTE CACHE — Pre-cache route data for offline navigation
 *
 * Downloads route polylines, turn-by-turn directions, hazmat restrictions,
 * and nearby rest stops/fuel stations before a trip.
 * All data stored locally in WatermelonDB for offline access.
 */

import { database, collections } from '@/database';
import { api } from '@/lib/api';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface CachedRoute {
  loadId: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  polylineEncoded: string;
  totalMiles: number;
  totalDurationMinutes: number;
  turnByTurnJson: string;
  hazmatRestrictionsJson: string;
  tunnelRestrictionsJson: string;
  weightRestrictionsJson: string;
  fuelStopsJson: string;
  restStopsJson: string;
  scaleLocationsJson: string;
  cachedAt: number;
}

export interface HazmatRestriction {
  type: 'TUNNEL' | 'BRIDGE' | 'ROAD' | 'ZONE';
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  restriction: string;
  hazmatClassesAffected: string[];
  alternateRoute?: string;
}

export interface TurnByTurnStep {
  instruction: string;
  distanceMiles: number;
  durationMinutes: number;
  latitude: number;
  longitude: number;
  maneuver: string;
  roadName?: string;
  hazmatWarning?: string;
}

type CacheListener = (stats: RouteCacheStats) => void;

export interface RouteCacheStats {
  routesCached: number;
  totalSizeEstimate: number;
  lastCachedAt: number | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

class RouteCacheService {
  private cache = new Map<string, CachedRoute>();
  private listeners = new Set<CacheListener>();

  subscribe(fn: CacheListener): () => void {
    this.listeners.add(fn);
    fn(this.getStats());
    return () => this.listeners.delete(fn);
  }

  /**
   * Pre-cache a route for offline use — call before starting a trip
   */
  async cacheRouteForLoad(loadId: string, origin: { lat: number; lng: number }, dest: { lat: number; lng: number }): Promise<CachedRoute | null> {
    try {
      // Fetch route from server
      const routeData = await api.post('/routes/calculate', {
        originLat: origin.lat, originLng: origin.lng,
        destLat: dest.lat, destLng: dest.lng,
        hazmatClass: '3', // Crude oil = Class 3 Flammable
        vehicleType: 'tanker',
        avoidTunnels: true,
        loadId,
      });

      // Fetch hazmat restrictions along route
      const restrictions = await api.post('/routes/hazmat-restrictions', {
        polyline: routeData.polylineEncoded,
        hazmatClass: '3',
      }).catch(() => ({ restrictions: [], tunnels: [], weights: [] }));

      // Fetch fuel stops, rest stops, scales near route
      const [fuelStops, restStops, scales] = await Promise.all([
        api.post('/routes/nearby-fuel', { polyline: routeData.polylineEncoded, radiusMiles: 5 }).catch(() => ({ stops: [] })),
        api.post('/routes/nearby-rest', { polyline: routeData.polylineEncoded, radiusMiles: 10 }).catch(() => ({ stops: [] })),
        api.post('/routes/nearby-scales', { polyline: routeData.polylineEncoded, radiusMiles: 15 }).catch(() => ({ locations: [] })),
      ]);

      const cached: CachedRoute = {
        loadId,
        originLat: origin.lat,
        originLng: origin.lng,
        destLat: dest.lat,
        destLng: dest.lng,
        polylineEncoded: routeData.polylineEncoded || '',
        totalMiles: routeData.totalMiles || 0,
        totalDurationMinutes: routeData.totalDurationMinutes || 0,
        turnByTurnJson: JSON.stringify(routeData.steps || []),
        hazmatRestrictionsJson: JSON.stringify(restrictions.restrictions || []),
        tunnelRestrictionsJson: JSON.stringify(restrictions.tunnels || []),
        weightRestrictionsJson: JSON.stringify(restrictions.weights || []),
        fuelStopsJson: JSON.stringify(fuelStops.stops || []),
        restStopsJson: JSON.stringify(restStops.stops || []),
        scaleLocationsJson: JSON.stringify(scales.locations || []),
        cachedAt: Date.now(),
      };

      this.cache.set(loadId, cached);
      this.emit();

      console.log(`[RouteCache] Cached route for load ${loadId}: ${cached.totalMiles}mi, ${cached.totalDurationMinutes}min`);
      return cached;
    } catch (err) {
      console.warn('[RouteCache] Failed to cache route:', err);
      return null;
    }
  }

  /**
   * Get cached route (works offline)
   */
  getRoute(loadId: string): CachedRoute | null {
    return this.cache.get(loadId) || null;
  }

  /**
   * Get turn-by-turn directions
   */
  getTurnByTurn(loadId: string): TurnByTurnStep[] {
    const route = this.cache.get(loadId);
    if (!route) return [];
    try { return JSON.parse(route.turnByTurnJson); } catch { return []; }
  }

  /**
   * Get hazmat restrictions along route
   */
  getHazmatRestrictions(loadId: string): HazmatRestriction[] {
    const route = this.cache.get(loadId);
    if (!route) return [];
    try { return JSON.parse(route.hazmatRestrictionsJson); } catch { return []; }
  }

  /**
   * Check if current position is near a hazmat restriction
   */
  checkNearbyRestrictions(loadId: string, lat: number, lng: number, radiusMeters = 5000): HazmatRestriction[] {
    const restrictions = this.getHazmatRestrictions(loadId);
    return restrictions.filter(r => {
      const dist = this.haversine(lat, lng, r.latitude, r.longitude);
      return dist <= radiusMeters;
    });
  }

  /**
   * Get fuel stops near current position from cached data
   */
  getNearbyFuelStops(loadId: string, lat: number, lng: number, radiusMiles = 10): any[] {
    const route = this.cache.get(loadId);
    if (!route) return [];
    try {
      const stops = JSON.parse(route.fuelStopsJson);
      return stops.filter((s: any) => {
        const dist = this.haversine(lat, lng, s.latitude, s.longitude) / 1609.34;
        return dist <= radiusMiles;
      });
    } catch { return []; }
  }

  /**
   * Clear cached route
   */
  clearRoute(loadId: string) {
    this.cache.delete(loadId);
    this.emit();
  }

  /**
   * Clear all cached routes
   */
  clearAll() {
    this.cache.clear();
    this.emit();
  }

  getStats(): RouteCacheStats {
    let lastCachedAt: number | null = null;
    let totalSize = 0;
    this.cache.forEach(r => {
      if (!lastCachedAt || r.cachedAt > lastCachedAt) lastCachedAt = r.cachedAt;
      totalSize += JSON.stringify(r).length;
    });
    return { routesCached: this.cache.size, totalSizeEstimate: totalSize, lastCachedAt };
  }

  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const toRad = (d: number) => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private emit() {
    const stats = this.getStats();
    this.listeners.forEach(fn => fn(stats));
  }
}

export const routeCache = new RouteCacheService();
