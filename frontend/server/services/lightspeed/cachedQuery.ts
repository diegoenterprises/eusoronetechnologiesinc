/**
 * LIGHTSPEED — Universal Cached Query Wrapper
 * ═══════════════════════════════════════════════════════════════
 *
 * Drop-in wrapper for any tRPC query procedure to add server-side caching.
 * Handles: cache-through, request coalescing, TTL management, user-scoped keys.
 *
 * Usage in any router:
 *   import { cachedQuery } from "../services/lightspeed/cachedQuery";
 *   
 *   getMarketData: protectedProcedure.query(cachedQuery("market", "intel", 120, async ({ ctx }) => {
 *     // original query logic
 *   })),
 *
 * TTL Presets by data type:
 *   - "realtime"  → 15s   (live pricing, GPS, active loads)
 *   - "fast"      → 60s   (market data, weather alerts, load board)  
 *   - "standard"  → 300s  (dashboards, analytics, fleet stats)
 *   - "slow"      → 900s  (compliance, inspections, historical)
 *   - "static"    → 3600s (zone definitions, seasonal calendars, config)
 *
 * Part of Project LIGHTSPEED — Phase 1
 */

import { cacheGet, cacheSet, coalesce, type CacheTier } from "../cache/redisCache";

// ============================================================================
// TTL PRESETS
// ============================================================================

export type TTLPreset = "realtime" | "fast" | "standard" | "slow" | "static";

const TTL_MAP: Record<TTLPreset, number> = {
  realtime: 15,
  fast: 60,
  standard: 300,
  slow: 900,
  static: 3600,
};

// ============================================================================
// UNIVERSAL CACHED QUERY
// ============================================================================

/**
 * Wraps any async function with LIGHTSPEED caching + request coalescing.
 * 
 * @param namespace - Router namespace (e.g., "market", "hotZones", "fleet")
 * @param method - Method name (e.g., "getIntel", "getRateFeed") 
 * @param ttl - TTL in seconds OR a preset name
 * @param fn - The original query function
 * @param options - Additional options
 */
export function cachedQuery<TInput, TResult>(
  namespace: string,
  method: string,
  ttl: number | TTLPreset,
  fn: (opts: { ctx: any; input: TInput }) => Promise<TResult>,
  options?: {
    tier?: CacheTier;
    /** Generate a unique cache key from input. Defaults to JSON.stringify(input) */
    keyFn?: (input: TInput, ctx: any) => string;
    /** If true, include user ID in cache key (per-user caching) */
    perUser?: boolean;
    /** If true, include company ID in cache key */
    perCompany?: boolean;
    /** Bypass cache for this request */
    bypassFn?: (input: TInput, ctx: any) => boolean;
  }
): (opts: { ctx: any; input: TInput }) => Promise<TResult> {
  const resolvedTtl = typeof ttl === "string" ? TTL_MAP[ttl] : ttl;
  const tier: CacheTier = options?.tier ?? "WARM";

  return async (opts: { ctx: any; input: TInput }): Promise<TResult> => {
    // Check for bypass
    if (options?.bypassFn?.(opts.input, opts.ctx)) {
      return fn(opts);
    }

    // Build cache key
    const inputKey = options?.keyFn
      ? options.keyFn(opts.input, opts.ctx)
      : stableStringify(opts.input);
    
    const userSegment = options?.perUser && opts.ctx?.user?.id ? `:u${opts.ctx.user.id}` : "";
    const companySegment = options?.perCompany && opts.ctx?.user?.companyId ? `:c${opts.ctx.user.companyId}` : "";
    const cacheKey = `${namespace}:${method}${userSegment}${companySegment}:${inputKey}`;

    // Try cache
    try {
      const cached = await cacheGet<TResult>(tier, cacheKey);
      if (cached !== null) return cached;
    } catch {}

    // Compute with request coalescing
    const fullCoalesceKey = `${tier}:${cacheKey}`;
    const result = await coalesce(fullCoalesceKey, () => fn(opts));

    // Store in cache (fire-and-forget)
    cacheSet(tier, cacheKey, result, resolvedTtl).catch(() => {});

    return result;
  };
}

/**
 * Batch-wrap multiple query results into cache.
 * Useful for pre-warming during startup or after ETL.
 */
export async function prewarmQueries(
  entries: Array<{ namespace: string; method: string; key: string; value: any; ttl: number }>
): Promise<number> {
  let cached = 0;
  for (const e of entries) {
    try {
      await cacheSet("WARM", `${e.namespace}:${e.method}:${e.key}`, e.value, e.ttl);
      cached++;
    } catch {}
  }
  return cached;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Deterministic JSON stringification for cache keys.
 * Handles undefined, sorts object keys for consistency.
 */
function stableStringify(obj: any): string {
  if (obj === undefined || obj === null) return "_";
  if (typeof obj !== "object") return String(obj);
  try {
    const sorted = Object.keys(obj).sort().reduce((acc: any, key) => {
      if (obj[key] !== undefined) acc[key] = obj[key];
      return acc;
    }, {});
    return JSON.stringify(sorted);
  } catch {
    return "_";
  }
}
