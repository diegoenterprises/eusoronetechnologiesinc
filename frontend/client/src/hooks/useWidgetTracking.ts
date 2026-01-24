import { useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Widget Event Tracking Hook
 * Automatically tracks widget interactions and sends events to backend for analytics
 * 
 * Usage:
 * const { trackOpen, trackClose, trackCustomize, trackResize, trackRefresh } = useWidgetTracking("revenue-forecasting");
 * 
 * useEffect(() => {
 *   trackOpen();
 *   return () => trackClose();
 * }, []);
 */

export type WidgetEventType = "open" | "close" | "customize" | "resize" | "refresh" | "export";

interface UseWidgetTrackingOptions {
  batchSize?: number;
  flushInterval?: number;
}

export function useWidgetTracking(
  widgetId: string,
  options: UseWidgetTrackingOptions = {}
) {
  const { batchSize = 5, flushInterval = 30000 } = options;
  
  // TODO: Re-enable when widgets router is added to backend
  // const trackEventMutation = trpc.widgets.analytics.trackEvent.useMutation();
  const sessionStartRef = useRef<number>(Date.now());
  const eventQueueRef = useRef<Array<{ eventType: WidgetEventType; metadata?: Record<string, unknown> }>>([]);
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Flush queued events to backend
   * TODO: Re-enable when widgets analytics router is added
   */
  const flushEvents = useCallback(async () => {
    if (eventQueueRef.current.length === 0) return;

    const events = [...eventQueueRef.current];
    eventQueueRef.current = [];

    // Log events for development (backend integration pending)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Widget Tracking] ${widgetId}:`, events.map(e => e.eventType).join(', '));
    }
  }, [widgetId]);

  /**
   * Queue event for batch submission
   */
  const queueEvent = useCallback(
    (eventType: WidgetEventType, metadata?: Record<string, unknown>) => {
      eventQueueRef.current.push({ eventType, metadata });

      // Flush if batch size reached
      if (eventQueueRef.current.length >= batchSize) {
        flushEvents();
      } else if (!batchTimerRef.current) {
        // Set timer to flush after interval
        batchTimerRef.current = setTimeout(() => {
          flushEvents();
          batchTimerRef.current = null;
        }, flushInterval);
      }
    },
    [batchSize, flushInterval, flushEvents]
  );

  /**
   * Track widget open event
   */
  const trackOpen = useCallback(() => {
    sessionStartRef.current = Date.now();
    queueEvent("open", {
      timestamp: new Date().toISOString(),
    });
  }, [queueEvent]);

  /**
   * Track widget close event
   */
  const trackClose = useCallback(() => {
    queueEvent("close", {
      sessionDuration: Math.round((Date.now() - sessionStartRef.current) / 1000),
      timestamp: new Date().toISOString(),
    });
  }, [queueEvent]);

  /**
   * Track widget customization event
   */
  const trackCustomize = useCallback(
    (customizationType: string, changes?: Record<string, unknown>) => {
      queueEvent("customize", {
        customizationType,
        changes,
        timestamp: new Date().toISOString(),
      });
    },
    [queueEvent]
  );

  /**
   * Track widget resize event
   */
  const trackResize = useCallback(
    (newWidth: number, newHeight: number) => {
      queueEvent("resize", {
        newWidth,
        newHeight,
        timestamp: new Date().toISOString(),
      });
    },
    [queueEvent]
  );

  /**
   * Track widget refresh event
   */
  const trackRefresh = useCallback(
    (reason?: string) => {
      queueEvent("refresh", {
        reason,
        timestamp: new Date().toISOString(),
      });
    },
    [queueEvent]
  );

  /**
   * Track widget export event
   */
  const trackExport = useCallback(
    (format: string) => {
      queueEvent("export", {
        format,
        timestamp: new Date().toISOString(),
      });
    },
    [queueEvent]
  );

  /**
   * Cleanup: flush remaining events on unmount
   */
  useEffect(() => {
    return () => {
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
      }
      // Flush any remaining events
      flushEvents();
    };
  }, [flushEvents]);

  return {
    trackOpen,
    trackClose,
    trackCustomize,
    trackResize,
    trackRefresh,
    trackExport,
    flushEvents,
  };
}

/**
 * Hook to track widget lifecycle (open/close automatically)
 */
export function useWidgetLifecycle(widgetId: string) {
  const { trackOpen, trackClose } = useWidgetTracking(widgetId);

  useEffect(() => {
    trackOpen();
    return () => {
      trackClose();
    };
  }, [trackOpen, trackClose]);

  return { trackOpen, trackClose };
}

/**
 * Hook to track widget interactions (customize, resize, refresh)
 */
export function useWidgetInteractions(widgetId: string) {
  const { trackCustomize, trackResize, trackRefresh, trackExport } = useWidgetTracking(widgetId);

  return {
    trackCustomize,
    trackResize,
    trackRefresh,
    trackExport,
  };
}
