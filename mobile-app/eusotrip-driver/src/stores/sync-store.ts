import { create } from 'zustand';
import { syncEngine } from '@/services/offline/sync-engine';
import NetInfo from '@react-native-community/netinfo';

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncedAt: Date | null;

  // Actions
  updateStatus: () => Promise<void>;
  forceSync: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  failedCount: 0,
  lastSyncedAt: null,

  updateStatus: async () => {
    const [pendingCount, failedCount] = await Promise.all([
      syncEngine.getPendingCount(),
      syncEngine.getFailedCount(),
    ]);

    set({
      isOnline: syncEngine.getIsOnline(),
      isSyncing: syncEngine.getIsSyncing(),
      pendingCount,
      failedCount,
    });
  },

  forceSync: async () => {
    set({ isSyncing: true });
    try {
      await syncEngine.forceSync();
      set({ lastSyncedAt: new Date() });
    } finally {
      await get().updateStatus();
    }
  },
}));

// Initialize listeners
NetInfo.addEventListener(() => {
  useSyncStore.getState().updateStatus();
});

syncEngine.subscribe(() => {
  useSyncStore.getState().updateStatus();
});

// Poll pending count every 2 seconds
setInterval(() => {
  useSyncStore.getState().updateStatus();
}, 2000);
