/**
 * useOfflineLoad — React hook for offline load state management
 *
 * Provides:
 *   - Load data from IndexedDB (works offline)
 *   - State transition actions (queue locally, sync later)
 *   - Live detention timer with auto-updating billable minutes
 *   - Transition history
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { offlineDB } from "@/lib/offline/db-api";
import { webStateTransitions } from "@/lib/offline/state-transitions";
import type { OfflineLoad, OfflineStateTransition } from "@/lib/offline/types";

export interface DetentionInfo {
  isActive: boolean;
  elapsedMinutes: number;
  billableMinutes: number;
  estimatedCharge: number;
}

export interface UseOfflineLoadReturn {
  load: OfflineLoad | null;
  isLoading: boolean;
  status: string;
  nextStates: string[];
  history: OfflineStateTransition[];
  detention: DetentionInfo;
  transition: (toState: string, trigger: string, metadata?: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  refresh: () => Promise<void>;
}

export function useOfflineLoad(loadId: string | null): UseOfflineLoadReturn {
  const [load, setLoad] = useState<OfflineLoad | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<OfflineStateTransition[]>([]);
  const [detention, setDetention] = useState<DetentionInfo>({
    isActive: false, elapsedMinutes: 0, billableMinutes: 0, estimatedCharge: 0,
  });
  const detentionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch load from IndexedDB
  const refresh = useCallback(async () => {
    if (!loadId) { setLoad(null); setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const cached = await offlineDB.loads.get(loadId);
      setLoad(cached || null);
      const hist = await offlineDB.stateTransitions.getByLoad(loadId);
      setHistory(hist.sort((a, b) => b.timestamp - a.timestamp));
      const det = await webStateTransitions.getDetention(loadId);
      setDetention(det);
    } catch (e) {
      console.warn("[useOfflineLoad] Error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [loadId]);

  useEffect(() => { refresh(); }, [refresh]);

  // Live detention timer (updates every 30s if active)
  useEffect(() => {
    if (!loadId || !detention.isActive) {
      if (detentionTimerRef.current) clearInterval(detentionTimerRef.current);
      return;
    }
    detentionTimerRef.current = setInterval(async () => {
      const det = await webStateTransitions.getDetention(loadId);
      setDetention(det);
    }, 30_000);
    return () => { if (detentionTimerRef.current) clearInterval(detentionTimerRef.current); };
  }, [loadId, detention.isActive]);

  // Transition action
  const transition = useCallback(async (
    toState: string,
    trigger: string,
    metadata?: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!load) return { success: false, error: "No load loaded" };
    const result = await webStateTransitions.transition(load.serverId, load.status, toState, trigger, metadata);
    if (result.success) {
      await refresh();
    }
    return result;
  }, [load, refresh]);

  const status = load?.status || "unknown";
  const nextStates = webStateTransitions.getNextStates(status);

  return {
    load,
    isLoading,
    status,
    nextStates,
    history,
    detention,
    transition,
    refresh,
  };
}
