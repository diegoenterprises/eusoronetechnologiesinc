/**
 * INFINITE SCROLL HOOK (Task 19.1)
 * ═══════════════════════════════════════════════════════════════
 *
 * Drop-in replacement for traditional pagination. Automatically
 * loads more items when the user scrolls near the bottom of a list.
 *
 * Features:
 * - IntersectionObserver-based (zero scroll listeners)
 * - Configurable threshold distance from bottom
 * - Deduplication guard — won't fire duplicate fetches
 * - Works with tRPC useInfiniteQuery or any cursor-based API
 * - Returns a sentinel ref to attach to a "load more" element
 *
 * Usage:
 *   const { sentinelRef, items, isLoadingMore, hasMore } = useInfiniteScroll({
 *     queryResult: trpc.loadBoard.search.useInfiniteQuery(...),
 *     getItems: (page) => page.loads,
 *   });
 *   // Render items, then place <div ref={sentinelRef} /> at the bottom
 */

import { useCallback, useEffect, useRef, useMemo } from "react";

interface UseInfiniteScrollOptions<TPage, TItem> {
  /** The result from useInfiniteQuery (or compatible shape) */
  queryResult: {
    data?: { pages: TPage[] };
    fetchNextPage: () => void;
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    isLoading?: boolean;
  };
  /** Extract items array from each page */
  getItems: (page: TPage) => TItem[];
  /** IntersectionObserver rootMargin — how far before bottom to trigger (default "400px") */
  rootMargin?: string;
  /** Whether infinite scroll is enabled (default true) */
  enabled?: boolean;
}

interface UseInfiniteScrollReturn<TItem> {
  /** Attach this ref to a sentinel element at the bottom of the list */
  sentinelRef: (node: HTMLElement | null) => void;
  /** Flattened items from all loaded pages */
  items: TItem[];
  /** True while a new page is being fetched */
  isLoadingMore: boolean;
  /** True if there are more pages to load */
  hasMore: boolean;
  /** True on initial load (no pages yet) */
  isLoading: boolean;
  /** Total number of pages loaded */
  pageCount: number;
}

export function useInfiniteScroll<TPage, TItem>(
  options: UseInfiniteScrollOptions<TPage, TItem>
): UseInfiniteScrollReturn<TItem> {
  const {
    queryResult,
    getItems,
    rootMargin = "400px",
    enabled = true,
  } = options;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelNodeRef = useRef<HTMLElement | null>(null);

  // Flatten all pages into a single items array
  const items = useMemo(() => {
    if (!queryResult.data?.pages) return [];
    return queryResult.data.pages.flatMap(getItems);
  }, [queryResult.data?.pages, getItems]);

  const hasMore = queryResult.hasNextPage ?? false;
  const isLoadingMore = queryResult.isFetchingNextPage ?? false;
  const isLoading = queryResult.isLoading ?? false;
  const pageCount = queryResult.data?.pages?.length ?? 0;

  // Callback when sentinel enters viewport
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry?.isIntersecting && hasMore && !isLoadingMore && enabled) {
        queryResult.fetchNextPage();
      }
    },
    [hasMore, isLoadingMore, enabled, queryResult]
  );

  // Sentinel ref callback — sets up / tears down observer
  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      // Disconnect previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      sentinelNodeRef.current = node;

      if (node && enabled) {
        observerRef.current = new IntersectionObserver(handleIntersect, {
          rootMargin,
        });
        observerRef.current.observe(node);
      }
    },
    [handleIntersect, rootMargin, enabled]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    sentinelRef,
    items,
    isLoadingMore,
    hasMore,
    isLoading,
    pageCount,
  };
}

/**
 * Simpler version for non-tRPC use cases.
 * Just triggers a callback when scroll sentinel is visible.
 */
export function useScrollTrigger(
  onTrigger: () => void,
  options?: { enabled?: boolean; rootMargin?: string }
) {
  const enabled = options?.enabled ?? true;
  const rootMargin = options?.rootMargin ?? "400px";
  const observerRef = useRef<IntersectionObserver | null>(null);

  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (node && enabled) {
        observerRef.current = new IntersectionObserver(
          ([entry]) => { if (entry?.isIntersecting) onTrigger(); },
          { rootMargin }
        );
        observerRef.current.observe(node);
      }
    },
    [onTrigger, rootMargin, enabled]
  );

  useEffect(() => {
    return () => { observerRef.current?.disconnect(); };
  }, []);

  return { sentinelRef };
}
