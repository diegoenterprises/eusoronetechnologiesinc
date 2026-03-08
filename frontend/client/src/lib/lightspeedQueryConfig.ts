/**
 * LIGHTSPEED — Client-side Query Configuration
 * ═══════════════════════════════════════════════════════════════
 *
 * Centralized staleTime + refetchInterval presets for all page types.
 * Import these presets in page components for consistent caching behavior.
 *
 * How it works with the server-side cache:
 * 1. Server-side (Express cache): Caches HTTP responses with per-route TTLs
 * 2. Client-side (React Query): SWR caching with staleTime prevents refetches
 * 3. Combined: Data serves instantly from React Query cache, background
 *    revalidation hits the Express cache (sub-5ms), actual DB hit only
 *    happens when both caches expire.
 *
 * Part of Project LIGHTSPEED — Phase 1
 */

/**
 * Query option presets by page type.
 * Each returns { staleTime, gcTime, refetchInterval, refetchOnWindowFocus }
 */
export const LIGHTSPEED = {
  /**
   * REALTIME pages: Live tracking, GPS, active loads, dispatch board
   * - staleTime: 10s (show cached, refetch quickly)
   * - refetchInterval: 15s (auto-poll)
   */
  realtime: {
    staleTime: 10_000,
    gcTime: 60_000,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  },

  /**
   * FAST pages: HotZones, Market Pricing, Load Board, Weather
   * - staleTime: 30s (cache for half a minute)
   * - refetchInterval: 30s
   */
  fast: {
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  },

  /**
   * DASHBOARD pages: Main dashboard, analytics, fleet overview
   * - staleTime: 2min (dashboards don't need second-by-second updates)
   * - refetchInterval: 60s
   */
  dashboard: {
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  },

  /**
   * STANDARD pages: Fleet details, driver profiles, vehicle pages
   * - staleTime: 5min (data changes infrequently)
   * - refetchInterval: 2min
   */
  standard: {
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    refetchInterval: 2 * 60_000,
    refetchOnWindowFocus: true,
  },

  /**
   * SLOW pages: Compliance, safety, inspections, reports, history
   * - staleTime: 10min (rarely changing data)
   * - refetchInterval: 5min
   */
  slow: {
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    refetchInterval: 5 * 60_000,
    refetchOnWindowFocus: false,
  },

  /**
   * STATIC pages: Settings, legal, help articles, reference data
   * - staleTime: 30min (almost never changes)
   * - No auto-refetch
   */
  static: {
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    refetchInterval: false as const,
    refetchOnWindowFocus: false,
  },

  /**
   * BACKGROUND: Map layers, secondary data, enrichment data
   * - staleTime: 2min
   * - refetchInterval: 2min
   * - Won't refetch on focus
   */
  background: {
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
    refetchInterval: 2 * 60_000,
    refetchOnWindowFocus: false,
  },
} as const;

/**
 * Helper: merge LIGHTSPEED preset with custom overrides.
 * Usage: trpc.hotZones.getRateFeed.useQuery(input, ls("fast", { refetchInterval: 20_000 }))
 */
export function ls(
  preset: keyof typeof LIGHTSPEED,
  overrides?: Record<string, any>
) {
  return { ...LIGHTSPEED[preset], ...overrides };
}
