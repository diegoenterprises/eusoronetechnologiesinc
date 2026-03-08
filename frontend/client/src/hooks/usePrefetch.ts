/**
 * LIGHTSPEED — Prefetch Hooks
 * ═══════════════════════════════════════════════════════════════
 *
 * Predictive data loading based on user intent signals:
 * - Hover: prefetch carrier profile when hovering over a row (>150ms)
 * - Viewport: prefetch when element scrolls into view
 * - Navigation: prefetch when user navigates to a page
 *
 * Part of Project LIGHTSPEED — Phase 1
 */

import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";

/**
 * Hook that returns onMouseEnter/onMouseLeave handlers for carrier rows.
 * When user hovers over a carrier row for >150ms, prefetch the full profile.
 * By the time they click, data is already in React Query cache.
 */
export function useCarrierPrefetch() {
  const queryClient = useQueryClient();
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefetchedDots = useRef(new Set<string>());

  const onHoverStart = useCallback((dotNumber: string) => {
    if (prefetchedDots.current.has(dotNumber)) return;

    hoverTimer.current = setTimeout(() => {
      prefetchedDots.current.add(dotNumber);

      // Prefetch carrier profile from LIGHTSPEED MV
      queryClient.prefetchQuery({
        queryKey: [["lightspeed", "carrierProfile"], { input: { dotNumber }, type: "query" }],
        queryFn: () => fetch(`/api/trpc/lightspeed.carrierProfile?input=${encodeURIComponent(JSON.stringify({ dotNumber }))}`).then(r => r.json()),
        staleTime: 5 * 60 * 1000,
      });

      // Prefetch risk score from HOT cache
      queryClient.prefetchQuery({
        queryKey: [["lightspeed", "riskScore"], { input: { dotNumber }, type: "query" }],
        queryFn: () => fetch(`/api/trpc/lightspeed.riskScore?input=${encodeURIComponent(JSON.stringify({ dotNumber }))}`).then(r => r.json()),
        staleTime: 30 * 60 * 1000,
      });
    }, 150); // 150ms hover delay — fast enough to feel instant, slow enough to avoid wasteful prefetches
  }, [queryClient]);

  const onHoverEnd = useCallback(() => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  }, []);

  return {
    /** Attach to onMouseEnter on carrier rows */
    onHoverStart,
    /** Attach to onMouseLeave on carrier rows */
    onHoverEnd,
    /** Number of prefetched carriers in this session */
    prefetchedCount: prefetchedDots.current.size,
  };
}

/**
 * Hook for prefetching a list of carrier risk scores in batch.
 * Used when a list of carriers is rendered (e.g., search results, load board).
 */
export function useBatchRiskPrefetch() {
  const queryClient = useQueryClient();
  const prefetched = useRef(false);

  const prefetchBatch = useCallback((dotNumbers: string[]) => {
    if (prefetched.current || dotNumbers.length === 0) return;
    prefetched.current = true;

    queryClient.prefetchQuery({
      queryKey: [["lightspeed", "batchRiskScores"], { input: { dotNumbers }, type: "query" }],
      queryFn: () => fetch(`/api/trpc/lightspeed.batchRiskScores?input=${encodeURIComponent(JSON.stringify({ dotNumbers }))}`).then(r => r.json()),
      staleTime: 30 * 60 * 1000,
    });
  }, [queryClient]);

  return { prefetchBatch };
}
