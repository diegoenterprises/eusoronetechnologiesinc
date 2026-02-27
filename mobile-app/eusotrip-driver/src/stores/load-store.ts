import { create } from 'zustand';
import { database, collections } from '@/database';
import { syncEngine } from '@/services/offline/sync-engine';
import { Q } from '@nozbe/watermelondb';

// ═══════════════════════════════════════════════════════════════════════════════
// LOAD STORE
// Local state management for the active load.
// All state changes happen locally first, then queue for server sync.
// ═══════════════════════════════════════════════════════════════════════════════

interface DetentionState {
  loadId: string;
  facilityType: 'PICKUP' | 'DELIVERY';
  startedAt: Date;
  isBillable: boolean;
}

interface LoadState {
  activeLoadId: string | null;
  activeLoadStatus: string | null;
  detentionTimers: Map<string, DetentionState>;

  // Actions
  setActiveLoad: (loadId: string, status: string) => void;
  updateLocalStatus: (loadId: string, newStatus: string) => void;
  startDetentionTimer: (loadId: string, facilityType: 'PICKUP' | 'DELIVERY', timestamp: Date) => void;
  stopDetentionTimer: (loadId: string, facilityType: 'PICKUP' | 'DELIVERY', timestamp: Date) => void;
  markDetentionBillable: (loadId: string, facilityType: 'PICKUP' | 'DELIVERY') => void;
  clearActiveLoad: () => void;
}

export const useLoadStore = create<LoadState>((set, get) => ({
  activeLoadId: null,
  activeLoadStatus: null,
  detentionTimers: new Map(),

  setActiveLoad: (loadId: string, status: string) => {
    set({ activeLoadId: loadId, activeLoadStatus: status });
  },

  updateLocalStatus: (loadId: string, newStatus: string) => {
    const state = get();
    const oldStatus = state.activeLoadStatus;

    // Update local state immediately
    if (state.activeLoadId === loadId) {
      set({ activeLoadStatus: newStatus });
    }

    // Store state transition locally
    database.write(async () => {
      await collections.stateTransitions.create((record: any) => {
        record.loadId = loadId;
        record.fromState = oldStatus || 'UNKNOWN';
        record.toState = newStatus;
        record.trigger = 'GEOFENCE';
        record.triggerEvent = `AUTO_${newStatus}`;
        record.timestamp = Date.now();
        record.syncStatus = 'PENDING';
      });

      // Update local load record
      const loads = await collections.loads
        .query(Q.where('server_id', loadId))
        .fetch();
      if (loads[0]) {
        await loads[0].update((record: any) => {
          record.status = newStatus;
          record.statusUpdatedAt = Date.now();
        });
      }
    });

    // Queue for server sync
    syncEngine.queueAction({
      actionType: 'STATE_TRANSITION',
      payload: {
        loadId,
        fromState: oldStatus,
        toState: newStatus,
        trigger: 'GEOFENCE',
        triggerEvent: `AUTO_${newStatus}`,
        timestamp: new Date().toISOString(),
      },
      priority: 'CRITICAL',
      requiresOrder: true,
    });

    console.log(`[LoadStore] Status: ${oldStatus} → ${newStatus} for load ${loadId}`);
  },

  startDetentionTimer: (loadId: string, facilityType: 'PICKUP' | 'DELIVERY', timestamp: Date) => {
    const key = `${loadId}_${facilityType}`;
    const timers = new Map(get().detentionTimers);
    timers.set(key, {
      loadId,
      facilityType,
      startedAt: timestamp,
      isBillable: false,
    });
    set({ detentionTimers: timers });

    // Store in local DB
    database.write(async () => {
      await collections.detentionTimers.create((record: any) => {
        record.loadId = loadId;
        record.facilityType = facilityType;
        record.startedAt = timestamp.getTime();
        record.freeTimeMinutes = 60; // Default 1 hour free time
        record.billableMinutes = 0;
        record.ratePerHour = 85; // Default $85/hr
        record.isActive = true;
        record.syncStatus = 'PENDING';
      });
    });

    console.log(`[LoadStore] Detention timer started: ${facilityType} for load ${loadId}`);
  },

  stopDetentionTimer: (loadId: string, facilityType: 'PICKUP' | 'DELIVERY', timestamp: Date) => {
    const key = `${loadId}_${facilityType}`;
    const timers = new Map(get().detentionTimers);
    const timer = timers.get(key);

    if (timer) {
      const durationMs = timestamp.getTime() - timer.startedAt.getTime();
      const durationMinutes = Math.round(durationMs / 60000);

      timers.delete(key);
      set({ detentionTimers: timers });

      // Update local DB
      database.write(async () => {
        const records = await collections.detentionTimers
          .query(
            Q.where('load_id', loadId),
            Q.where('facility_type', facilityType),
            Q.where('is_active', true)
          )
          .fetch();

        if (records[0]) {
          await records[0].update((record: any) => {
            record.stoppedAt = timestamp.getTime();
            record.billableMinutes = Math.max(0, durationMinutes - record.freeTimeMinutes);
            record.isActive = false;
          });
        }
      });

      console.log(`[LoadStore] Detention timer stopped: ${facilityType} — ${durationMinutes}min total`);
    }
  },

  markDetentionBillable: (loadId: string, facilityType: 'PICKUP' | 'DELIVERY') => {
    const key = `${loadId}_${facilityType}`;
    const timers = new Map(get().detentionTimers);
    const timer = timers.get(key);

    if (timer) {
      timer.isBillable = true;
      timers.set(key, timer);
      set({ detentionTimers: timers });
      console.log(`[LoadStore] Detention now billable: ${facilityType} for load ${loadId}`);
    }
  },

  clearActiveLoad: () => {
    set({
      activeLoadId: null,
      activeLoadStatus: null,
      detentionTimers: new Map(),
    });
  },
}));
