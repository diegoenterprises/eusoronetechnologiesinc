/**
 * Smart Cache — Stale-while-revalidate + refresh-ahead implementation
 * Wraps the existing NodeCache with intelligent freshness management
 */
import NodeCache from "node-cache";
import { CACHE_TYPE_CONFIG, getFreshnessStatus, shouldRefreshAhead } from "./cacheConfig";

interface CacheEntry<T> {
  value: T;
  storedAt: number;
  dataType: string;
}

// Internal cache stores entries with metadata
const smartStore = new NodeCache({
  stdTTL: 0,          // We manage TTL ourselves
  checkperiod: 60,
  useClones: false,
});

// Track pending background refreshes to avoid duplicates
const pendingRefreshes = new Set<string>();

// Refresh callbacks registered by data type
const refreshCallbacks = new Map<string, () => Promise<void>>();

/**
 * Register a refresh callback for a data type.
 * Called when stale-while-revalidate needs to refresh in background.
 */
export function registerRefreshCallback(dataType: string, callback: () => Promise<void>): void {
  refreshCallbacks.set(dataType, callback);
}

/**
 * Get from smart cache with stale-while-revalidate semantics.
 * Returns data even if stale (triggers background refresh).
 * Returns undefined only if expired or missing.
 */
export function smartGet<T>(key: string, dataType: string): { value: T; fresh: boolean; age: number } | undefined {
  if (process.env.CACHE_ENABLED === "false") return undefined;

  const entry = smartStore.get<CacheEntry<T>>(key);
  if (!entry) return undefined;

  const ageSeconds = Math.floor((Date.now() - entry.storedAt) / 1000);
  const status = getFreshnessStatus(dataType, ageSeconds);

  if (status === "expired") {
    smartStore.del(key);
    return undefined;
  }

  // If refresh-ahead threshold reached, trigger background refresh
  if (shouldRefreshAhead(dataType, ageSeconds) && !pendingRefreshes.has(dataType)) {
    triggerBackgroundRefresh(dataType);
  }

  return {
    value: entry.value,
    fresh: status === "fresh",
    age: ageSeconds,
  };
}

/**
 * Set value in smart cache with data type metadata.
 */
export function smartSet<T>(key: string, value: T, dataType: string): void {
  if (process.env.CACHE_ENABLED === "false") return;

  const config = CACHE_TYPE_CONFIG[dataType];
  const maxTtl = config ? config.ttl + config.staleTtl : 600;

  smartStore.set<CacheEntry<T>>(key, {
    value,
    storedAt: Date.now(),
    dataType,
  }, maxTtl);
}

/**
 * Invalidate cache entries by pattern.
 */
export function smartInvalidate(pattern: string): number {
  const keys = smartStore.keys();
  let count = 0;
  for (const key of keys) {
    if (key.includes(pattern)) {
      smartStore.del(key);
      count++;
    }
  }
  return count;
}

/**
 * Invalidate all entries of a specific data type.
 */
export function smartInvalidateByType(dataType: string): number {
  const keys = smartStore.keys();
  let count = 0;
  for (const key of keys) {
    const entry = smartStore.get<CacheEntry<unknown>>(key);
    if (entry && entry.dataType === dataType) {
      smartStore.del(key);
      count++;
    }
  }
  return count;
}

/**
 * Trigger a background refresh for a data type (non-blocking).
 */
function triggerBackgroundRefresh(dataType: string): void {
  const callback = refreshCallbacks.get(dataType);
  if (!callback) return;

  pendingRefreshes.add(dataType);
  callback()
    .catch((err) => console.error(`[SmartCache] Background refresh failed for ${dataType}:`, err))
    .finally(() => pendingRefreshes.delete(dataType));
}

/**
 * Force refresh a specific data type (blocking).
 */
export async function smartForceRefresh(dataType: string): Promise<boolean> {
  const callback = refreshCallbacks.get(dataType);
  if (!callback) return false;

  try {
    await callback();
    return true;
  } catch (err) {
    console.error(`[SmartCache] Force refresh failed for ${dataType}:`, err);
    return false;
  }
}

/**
 * Get cache statistics for monitoring.
 */
export function getSmartCacheStats(): {
  totalKeys: number;
  freshKeys: number;
  staleKeys: number;
  pendingRefreshes: string[];
  byType: Record<string, { count: number; avgAge: number }>;
} {
  const keys = smartStore.keys();
  let freshKeys = 0;
  let staleKeys = 0;
  const byType: Record<string, { count: number; totalAge: number }> = {};

  for (const key of keys) {
    const entry = smartStore.get<CacheEntry<unknown>>(key);
    if (!entry) continue;

    const age = Math.floor((Date.now() - entry.storedAt) / 1000);
    const status = getFreshnessStatus(entry.dataType, age);
    if (status === "fresh") freshKeys++;
    else staleKeys++;

    if (!byType[entry.dataType]) byType[entry.dataType] = { count: 0, totalAge: 0 };
    byType[entry.dataType].count++;
    byType[entry.dataType].totalAge += age;
  }

  const result: Record<string, { count: number; avgAge: number }> = {};
  for (const [type, stats] of Object.entries(byType)) {
    result[type] = { count: stats.count, avgAge: stats.count > 0 ? Math.round(stats.totalAge / stats.count) : 0 };
  }

  return {
    totalKeys: keys.length,
    freshKeys,
    staleKeys,
    pendingRefreshes: Array.from(pendingRefreshes),
    byType: result,
  };
}
