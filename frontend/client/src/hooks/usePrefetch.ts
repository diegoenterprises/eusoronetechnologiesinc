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
/**
 * Generic hover-to-prefetch hook.
 * Prefetches any URL or tRPC query key after a configurable hover delay.
 * Deduplicates — each key is only prefetched once per session.
 *
 * Usage:
 *   const { onMouseEnter, onMouseLeave } = useHoverPrefetch({
 *     getKey: (id) => id,
 *     prefetch: (id) => queryClient.prefetchQuery({ queryKey: ['loads', id], queryFn: ... }),
 *   });
 *   <div onMouseEnter={() => onMouseEnter(load.id)} onMouseLeave={onMouseLeave}>...</div>
 */
export function useHoverPrefetch<T extends string | number>(options: {
  prefetch: (key: T) => void;
  delay?: number;
}) {
  const { prefetch, delay = 150 } = options;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const done = useRef(new Set<T>());

  const onMouseEnter = useCallback((key: T) => {
    if (done.current.has(key)) return;
    timer.current = setTimeout(() => {
      done.current.add(key);
      prefetch(key);
    }, delay);
  }, [prefetch, delay]);

  const onMouseLeave = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
  }, []);

  return { onMouseEnter, onMouseLeave, prefetchedCount: done.current.size };
}

/**
 * Viewport-based prefetch hook.
 * Prefetches data when an element scrolls into view.
 * Uses IntersectionObserver — zero scroll listeners.
 *
 * Usage:
 *   const ref = useViewportPrefetch(() => {
 *     queryClient.prefetchQuery({ queryKey: ['load', id], queryFn: ... });
 *   });
 *   <div ref={ref}>...</div>
 */
export function useViewportPrefetch(
  prefetch: () => void,
  options?: { rootMargin?: string; enabled?: boolean }
) {
  const called = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const enabled = options?.enabled ?? true;
  const rootMargin = options?.rootMargin ?? "200px";

  const ref = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) { observerRef.current.disconnect(); observerRef.current = null; }
      if (!node || !enabled || called.current) return;
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting && !called.current) {
            called.current = true;
            prefetch();
            observerRef.current?.disconnect();
          }
        },
        { rootMargin }
      );
      observerRef.current.observe(node);
    },
    [prefetch, rootMargin, enabled]
  );

  return ref;
}

/**
 * Route-level prefetch on link hover.
 * Prefetches a page's data when user hovers over a navigation link.
 *
 * Usage:
 *   const prefetchProps = useRoutePrefetch('/loads/123', () => {
 *     utils.loads.getById.prefetch({ id: '123' });
 *   });
 *   <Link {...prefetchProps} href="/loads/123">View Load</Link>
 */
export function useRoutePrefetch(route: string, prefetchFn: () => void, delay = 100) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const done = useRef(new Set<string>());

  const onMouseEnter = useCallback(() => {
    if (done.current.has(route)) return;
    timer.current = setTimeout(() => {
      done.current.add(route);
      prefetchFn();
    }, delay);
  }, [route, prefetchFn, delay]);

  const onMouseLeave = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
  }, []);

  return { onMouseEnter, onMouseLeave };
}

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
