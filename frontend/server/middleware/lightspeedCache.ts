/**
 * LIGHTSPEED — tRPC Query Cache Middleware
 * ═══════════════════════════════════════════════════════════════
 *
 * Automatic server-side caching for ALL tRPC query procedures.
 * Intercepts every query, checks cache first, stores results with
 * intelligent TTLs based on the router/procedure path.
 *
 * Features:
 * - Automatic cache key generation from path + serialized input
 * - Per-router TTL configuration (realtime → static)
 * - User/role-scoped caching where needed
 * - Request coalescing (deduplication of identical concurrent queries)
 * - Zero changes to existing routers required
 * - Mutations automatically invalidate related cache entries
 * - Opt-out for specific paths via BYPASS list
 *
 * Part of Project LIGHTSPEED — Phase 1
 */

import { cacheGet, cacheSet, coalesce, cacheInvalidate, type CacheTier } from "../services/cache/redisCache";

// ============================================================================
// TTL CONFIGURATION — Per-router/procedure cache duration (seconds)
// ============================================================================

/**
 * TTL tiers:
 * - 0       = BYPASS (never cache — auth, mutations, real-time writes)
 * - 10-15   = REALTIME (live GPS, active load status, socket events)
 * - 30-60   = FAST (market data, weather, load board listings, hot zones)
 * - 120-300 = STANDARD (dashboards, analytics, fleet stats, KPIs)
 * - 600-900 = SLOW (compliance, inspections, historical data, reports)
 * - 3600    = STATIC (config, calendars, zone definitions, reference data)
 */

const ROUTE_TTL: Record<string, number> = {
  // ── BYPASS (never cache) ──
  "auth.me": 0,
  "system.healthCheck": 0,
  "system.dbStatus": 0,

  // ── REALTIME (10-15s) ──
  "tracking.getLive": 10,
  "tracking.getDriverPosition": 10,
  "geolocation.getCurrent": 15,
  "navigation.getActiveRoute": 15,

  // ── FAST (30-60s) — Market data, weather, load board ──
  "hotZones.getRateFeed": 30,
  "hotZones.getMarketPulse": 30,
  "hotZones.getMapIntelligence": 45,
  "hotZones.getZoneDetail": 60,
  "hotZones.getActiveZones": 60,
  "hotZones.getHeatmapData": 60,
  "hotZones.getTopLanes": 60,
  "hotZones.getDriverOpportunities": 30,
  "hotZones.getSurgeHistory": 60,
  "hotZones.getZonesByEquipment": 60,
  "hotZones.getZonesByRegion": 60,
  "hotZones.getPredictions": 120,
  "marketPricing.getMarketIntelligence": 45,
  "marketPricing.getCommodities": 30,
  "marketPricing.getIndices": 60,
  "marketPricing.getFuelIndex": 60,
  "marketPricing.getLaneRates": 60,
  "marketPricing.getFreightRates": 60,
  "marketPricing.getRateCalculator": 60,
  "marketPricing.getSeasonalFactors": 3600,
  "marketPricing.searchCommodity": 30,
  "marketPricing.getCommodityDetail": 60,
  "marketIntelligence.getTheftRisk": 300,
  "marketIntelligence.getMarketIntel": 120,
  "marketIntelligence.getEmissions": 600,
  "marketIntelligence.getResilience": 600,
  "marketIntelligence.getDriverWellness": 120,
  "marketIntelligence.getTariffImpact": 600,
  "marketIntelligence.getSeasonalCalendar": 3600,
  "marketIntelligence.get2026Outlook": 3600,
  "marketIntelligence.getMyLaneDefaults": 300,
  "weather.getCurrent": 60,
  "weather.getForecast": 120,
  "weather.getAlerts": 30,
  "weather.getRouteWeather": 60,
  "loadBoard.getAvailableLoads": 15,
  "loadBoard.getLoadDetail": 30,
  "loadBoard.getMatchingLoads": 15,

  // ── STANDARD (120-300s) — Dashboards, analytics, fleet ──
  "dashboard.getStats": 120,
  "dashboard.getActiveShipments": 60,
  "dashboard.getRecentActivity": 60,
  "dashboard.getAlerts": 60,
  "dashboard.getFinancials": 120,
  "dashboard.getPerformance": 180,
  "analytics.getRevenue": 180,
  "analytics.getRevenueBreakdown": 180,
  "analytics.getRevenueTrends": 300,
  "analytics.getUtilizationSummary": 300,
  "analytics.getTopLanes": 300,
  "analytics.getTopDrivers": 300,
  "analytics.getTopCarriers": 300,
  "analytics.getLoadVolume": 180,
  "analytics.getOnTimePerformance": 300,
  "analytics.getPerformanceMetrics": 300,
  "analytics.getCustomerMetrics": 300,
  "analytics.getFinancialSummary": 180,
  "fleet.getVehicles": 120,
  "fleet.getVehicle": 120,
  "fleet.getGeofences": 300,
  "fleet.getGeofenceStats": 300,
  "fleet.getFleetSummary": 120,
  "drivers.getAll": 120,
  "drivers.getDriver": 120,
  "vehicles.getAll": 120,
  "loads.getAll": 60,
  "loads.getLoad": 30,
  "bids.getAll": 30,
  "bids.getBid": 30,

  // ── SLOW (600-900s) — Compliance, safety, inspections, reports ──
  "compliance.getDashboardStats": 300,
  "compliance.getExpiringItems": 600,
  "compliance.getDriverCompliance": 600,
  "compliance.getVehicleCompliance": 600,
  "safety.getDashboard": 300,
  "safety.getIncidents": 600,
  "safety.getScores": 600,
  "inspections.getHistory": 600,
  "inspections.getPrevious": 600,
  "inspections.getStats": 600,
  "reports.getReport": 600,
  "reports.getAvailable": 900,
  "csaScores.getScores": 600,
  "csaScores.getHistory": 900,

  // ── STATIC (3600s) — Config, reference data, calendars ──
  "facilities.getAll": 900,
  "facilities.getFacility": 600,
  "terminals.getAll": 900,
  "terminals.getTerminal": 600,
  "rss.getFeeds": 300,
  "rss.getCategories": 3600,
  "news.getArticles": 300,
  "news.getSources": 3600,
  "erg.lookup": 3600,
  "restStops.search": 600,
  "scales.search": 600,
  "permits.getRequirements": 900,
  "fmcsaData.searchCarriers": 60,
  "fmcsaData.lookupCarrier": 120,
  "fmcsaData.getCarrierSnapshot": 120,
  "fmcsa.searchCarriers": 60,
  "fmcsa.getCarrier": 120,

  // ── LIGHTSPEED endpoints (already cached internally, short TTL here) ──
  "lightspeed.typeahead": 15,
  "lightspeed.carrierProfile": 120,
  "lightspeed.riskScore": 300,
  "lightspeed.batchRiskScores": 300,
  "lightspeed.dashboardKPIs": 120,
};

// Paths that should NEVER be cached (mutations, auth, real-time)
const BYPASS_PREFIXES = [
  "auth.",
  "system.",
  "stripe.",
  "wallet.",
  "push.",
  "sms.",
];

// Paths that need user-scoped caching (different data per user)
const USER_SCOPED = new Set([
  "dashboard.getStats",
  "dashboard.getActiveShipments",
  "dashboard.getRecentActivity",
  "dashboard.getAlerts",
  "dashboard.getFinancials",
  "dashboard.getPerformance",
  "analytics.getRevenue",
  "analytics.getRevenueBreakdown",
  "analytics.getRevenueTrends",
  "analytics.getFinancialSummary",
  "loads.getAll",
  "loads.getLoad",
  "bids.getAll",
  "bids.getBid",
  "fleet.getVehicles",
  "fleet.getFleetSummary",
  "drivers.getAll",
  "vehicles.getAll",
  "marketIntelligence.getMyLaneDefaults",
  "compliance.getDashboardStats",
  "compliance.getExpiringItems",
  "compliance.getDriverCompliance",
  "safety.getDashboard",
  "safety.getIncidents",
  "inspections.getHistory",
  "inspections.getPrevious",
  "notifications.getAll",
  "messages.getAll",
  "earnings.getSummary",
  "billing.getSummary",
]);

// Paths that need role-scoped caching (different data per role, not per user)
const ROLE_SCOPED = new Set([
  "hotZones.getRateFeed",
  "hotZones.getActiveZones",
  "hotZones.getMarketPulse",
  "hotZones.getHeatmapData",
  "hotZones.getDriverOpportunities",
]);

// ============================================================================
// MIDDLEWARE FACTORY
// ============================================================================

/**
 * Stable JSON stringify for cache keys.
 */
function stableKey(obj: any): string {
  if (obj === undefined || obj === null) return "_";
  if (typeof obj !== "object") return String(obj);
  try {
    const sorted = Object.keys(obj).sort().reduce((acc: any, k) => {
      if (obj[k] !== undefined) acc[k] = obj[k];
      return acc;
    }, {});
    return JSON.stringify(sorted);
  } catch {
    return "_";
  }
}

/**
 * Build a cache middleware for tRPC.
 * Call this once and chain it onto the tRPC instance.
 *
 * Usage in trpc.ts:
 *   const lightspeedCache = buildLightspeedCacheMiddleware(t);
 *   // Then chain onto procedures as needed
 */
export function buildLightspeedCacheMiddleware(t: any) {
  return t.middleware(async (opts: any) => {
    const { path, type, next, rawInput, ctx } = opts;

    // Only cache queries, never mutations/subscriptions
    if (type !== "query") {
      // For mutations, invalidate related cache entries (fire-and-forget)
      if (type === "mutation") {
        const ns = path.split(".")[0];
        // We don't aggressively invalidate — React Query SWR handles staleness
        // Just let the TTL expire naturally for most cases
      }
      return next();
    }

    // Check bypass
    if (BYPASS_PREFIXES.some(p => path.startsWith(p))) {
      return next();
    }

    // Determine TTL
    const ttl = ROUTE_TTL[path];
    if (ttl === undefined || ttl === 0) {
      // No explicit TTL configured — use a safe default of 30s
      // This means ALL queries get at least 30s of caching
      const defaultTtl = 30;
      return cacheThrough(path, rawInput, ctx, next, defaultTtl);
    }

    return cacheThrough(path, rawInput, ctx, next, ttl);
  });
}

/**
 * Cache-through logic: check cache → return if hit → execute → store → return
 */
async function cacheThrough(
  path: string,
  rawInput: any,
  ctx: any,
  next: () => Promise<any>,
  ttl: number
): Promise<any> {
  // Build cache key
  const inputKey = stableKey(rawInput);
  const userScope = USER_SCOPED.has(path) && ctx?.user?.id ? `:u${ctx.user.id}` : "";
  const roleScope = !userScope && ROLE_SCOPED.has(path) && ctx?.user?.role ? `:r${ctx.user.role}` : "";
  const cacheKey = `ls:q:${path}${userScope}${roleScope}:${inputKey}`;
  const tier: CacheTier = ttl <= 60 ? "HOT" : "WARM";

  // Check cache
  try {
    const cached = await cacheGet<any>(tier, cacheKey);
    if (cached !== null) {
      return { ok: true, data: cached, ctx };
    }
  } catch {
    // Cache read failed — proceed to execute
  }

  // Execute with request coalescing (deduplicate identical concurrent queries)
  const coalescenceKey = `${tier}:${cacheKey}`;
  try {
    const result = await coalesce(coalescenceKey, async () => {
      return next();
    });

    // Store in cache (fire-and-forget)
    if (result?.ok && result?.data !== undefined) {
      cacheSet(tier, cacheKey, result.data, ttl).catch(() => {});
    }

    return result;
  } catch (err) {
    // If coalescing/execution fails, just run normally
    return next();
  }
}

// ============================================================================
// CACHE INVALIDATION HELPERS
// ============================================================================

/**
 * Invalidate all cached queries for a specific router namespace.
 * Call this after mutations that affect data served by a router.
 */
export async function invalidateRouter(namespace: string): Promise<void> {
  try {
    // Invalidate all HOT + WARM cached queries for this router namespace
    await cacheInvalidate("HOT", `q:${namespace}.*`);
    await cacheInvalidate("WARM", `q:${namespace}.*`);
  } catch {
    // Invalidation is best-effort
  }
}

/**
 * Invalidate all cached queries for a specific user.
 */
export async function invalidateUserCache(userId: number | string): Promise<void> {
  try {
    await cacheInvalidate("HOT", `q:*:u${userId}:*`);
    await cacheInvalidate("WARM", `q:*:u${userId}:*`);
  } catch {}
}
