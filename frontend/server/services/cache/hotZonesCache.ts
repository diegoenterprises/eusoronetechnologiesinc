/**
 * Hot Zones Cache Layer — NodeCache with TTLs per data type
 */
import NodeCache from "node-cache";
import { getDb } from "../../db";
import { hzZoneIntelligence, hzWeatherAlerts, hzFuelPrices } from "../../../drizzle/schema";
import { sql } from "drizzle-orm";

const memoryCache = new NodeCache({
  stdTTL: 60,
  checkperiod: 30,
  useClones: false,
});

const CACHE_TTL: Record<string, number> = {
  ZONE_INTELLIGENCE: 300,
  WEATHER_ALERTS: 300,
  FUEL_PRICES: 3600,
  CARRIER_SAFETY: 86400,
  HAZMAT_INCIDENTS: 86400,
  SEISMIC_EVENTS: 60,
  WILDFIRES: 900,
  FEMA_DISASTERS: 21600,
  RATE_INDICES: 3600,
  LOCK_STATUS: 1800,
};

export function getFromCache<T>(key: string): T | undefined {
  if (process.env.CACHE_ENABLED === "false") return undefined;
  return memoryCache.get<T>(key);
}

export function setInCache<T>(key: string, value: T, ttlKey: keyof typeof CACHE_TTL): void {
  if (process.env.CACHE_ENABLED === "false") return;
  memoryCache.set(key, value, CACHE_TTL[ttlKey] || 60);
}

export function invalidateCache(pattern: string): void {
  const keys = memoryCache.keys();
  for (const key of keys) {
    if (key.includes(pattern)) {
      memoryCache.del(key);
    }
  }
}

export function getCacheStats(): { keys: number; hits: number; misses: number } {
  const stats = memoryCache.getStats();
  return { keys: memoryCache.keys().length, hits: stats.hits, misses: stats.misses };
}

export async function warmCache(): Promise<void> {
  console.log("[Cache] Warming cache...");

  try {
    const db = await getDb();
    if (!db) return;

    // Pre-fetch all zone intelligence
    const zones = await db.select().from(hzZoneIntelligence);
    for (const zone of zones) {
      setInCache(`zone:${zone.zoneId}`, zone, "ZONE_INTELLIGENCE");
    }

    // Pre-fetch active weather alerts
    const weather = await db
      .select()
      .from(hzWeatherAlerts)
      .where(sql`expires_at > NOW() OR expires_at IS NULL`);
    setInCache("weather:active", weather, "WEATHER_ALERTS");

    // Pre-fetch current fuel prices
    const fuel = await db
      .select()
      .from(hzFuelPrices)
      .orderBy(sql`report_date DESC`);
    setInCache("fuel:current", fuel, "FUEL_PRICES");

    console.log(`[Cache] Warmed with ${memoryCache.keys().length} keys`);
  } catch (e) {
    console.error("[Cache] Failed to warm cache:", e);
  }
}
