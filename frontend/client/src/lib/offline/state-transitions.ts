/**
 * WEB STATE TRANSITIONS — Offline load status changes + detention timers
 *
 * All state changes are recorded locally first, then synced.
 * Detention timers run client-side and sync billable minutes.
 */

import { offlineDB } from "./db-api";
import { webSyncEngine } from "./sync-engine";
import type { OfflineStateTransition, OfflineDetentionTimer } from "./types";

// Valid state machine transitions for crude oil loads
const VALID_TRANSITIONS: Record<string, string[]> = {
  assigned: ["accepted", "rejected"],
  accepted: ["en_route_pickup"],
  en_route_pickup: ["arrived_pickup"],
  arrived_pickup: ["loading"],
  loading: ["loaded", "rejected_at_pickup"],
  loaded: ["en_route_delivery"],
  en_route_delivery: ["arrived_delivery"],
  arrived_delivery: ["unloading"],
  unloading: ["delivered", "rejected_at_delivery"],
  delivered: ["completed"],
  rejected: [],
  rejected_at_pickup: [],
  rejected_at_delivery: [],
  completed: [],
};

async function getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
  if (!navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  });
}

export const webStateTransitions = {
  /**
   * Transition a load to a new state — works fully offline
   */
  async transition(
    loadId: string,
    fromState: string,
    toState: string,
    trigger: string,
    metadata?: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> {
    // Validate transition
    const allowed = VALID_TRANSITIONS[fromState];
    if (!allowed || !allowed.includes(toState)) {
      return { success: false, error: `Invalid transition: ${fromState} → ${toState}` };
    }

    const pos = await getCurrentPosition();
    const timestamp = Date.now();

    // Store locally
    await offlineDB.stateTransitions.add({
      loadId,
      fromState,
      toState,
      trigger,
      triggerEvent: `${fromState}_to_${toState}`,
      latitude: pos?.lat,
      longitude: pos?.lng,
      timestamp,
      metadataJson: metadata ? JSON.stringify(metadata) : undefined,
      syncStatus: "PENDING",
    });

    // Update local load cache
    const load = await offlineDB.loads.get(loadId);
    if (load) {
      await offlineDB.loads.put({ ...load, status: toState, statusUpdatedAt: timestamp });
    }

    // Enqueue for sync (CRITICAL priority — state changes must sync ASAP)
    await webSyncEngine.enqueueStateTransition(
      loadId, fromState, toState, trigger, pos?.lat, pos?.lng, metadata
    );

    // Auto-manage detention timers
    if (toState === "arrived_pickup" || toState === "arrived_delivery") {
      await this.startDetention(loadId, toState === "arrived_pickup" ? "pickup" : "delivery", load?.detentionRate);
    }
    if (toState === "loading" || toState === "unloading" || toState === "en_route_delivery" || toState === "delivered") {
      await this.stopDetention(loadId);
    }

    return { success: true };
  },

  /**
   * Get transition history for a load
   */
  async getHistory(loadId: string): Promise<OfflineStateTransition[]> {
    return offlineDB.stateTransitions.getByLoad(loadId);
  },

  /**
   * Start a detention timer
   */
  async startDetention(loadId: string, facilityType: string, ratePerHour?: number): Promise<number> {
    const id = await offlineDB.detentionTimers.add({
      loadId,
      facilityType,
      startedAt: Date.now(),
      freeTimeMinutes: 60, // industry standard 1hr free
      billableMinutes: 0,
      ratePerHour: ratePerHour || 75,
      isActive: true,
      syncStatus: "PENDING",
    });
    return id as number;
  },

  /**
   * Stop a detention timer
   */
  async stopDetention(loadId: string): Promise<void> {
    const timers = await offlineDB.detentionTimers.getByLoad(loadId);
    for (const timer of timers) {
      if (timer.isActive && timer.id) {
        const elapsed = Math.floor((Date.now() - timer.startedAt) / 60_000);
        const billable = Math.max(0, elapsed - timer.freeTimeMinutes);
        await offlineDB.detentionTimers.update(timer.id, (t) => ({
          ...t,
          isActive: false,
          stoppedAt: Date.now(),
          billableMinutes: billable,
        }));
      }
    }
  },

  /**
   * Get current detention info for a load
   */
  async getDetention(loadId: string): Promise<{
    isActive: boolean;
    elapsedMinutes: number;
    billableMinutes: number;
    estimatedCharge: number;
  }> {
    const timers = await offlineDB.detentionTimers.getByLoad(loadId);
    const active = timers.find((t) => t.isActive);
    if (active) {
      const elapsed = Math.floor((Date.now() - active.startedAt) / 60_000);
      const billable = Math.max(0, elapsed - active.freeTimeMinutes);
      return {
        isActive: true,
        elapsedMinutes: elapsed,
        billableMinutes: billable,
        estimatedCharge: (billable / 60) * active.ratePerHour,
      };
    }
    // Sum completed timers
    const totalBillable = timers.reduce((sum, t) => sum + t.billableMinutes, 0);
    const rate = timers[0]?.ratePerHour || 75;
    return {
      isActive: false,
      elapsedMinutes: 0,
      billableMinutes: totalBillable,
      estimatedCharge: (totalBillable / 60) * rate,
    };
  },

  /**
   * Check if a transition is valid
   */
  isValidTransition(fromState: string, toState: string): boolean {
    return VALID_TRANSITIONS[fromState]?.includes(toState) ?? false;
  },

  /**
   * Get allowed next states
   */
  getNextStates(currentState: string): string[] {
    return VALID_TRANSITIONS[currentState] || [];
  },
};
