/**
 * useOfflineSync — React hook for the web sync engine
 *
 * Provides reactive sync state, force sync, and auto-starts the engine.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { webSyncEngine, type SyncState } from "@/lib/offline/sync-engine";

export interface UseOfflineSyncReturn extends SyncState {
  forceSync: () => Promise<void>;
  enqueueAction: typeof webSyncEngine.enqueue;
}

export function useOfflineSync(serverUrl?: string): UseOfflineSyncReturn {
  const [state, setState] = useState<SyncState>(webSyncEngine.getState());
  const startedRef = useRef(false);

  useEffect(() => {
    if (!startedRef.current) {
      const url = serverUrl || window.location.origin;
      webSyncEngine.start(url);
      startedRef.current = true;
    }

    const unsub = webSyncEngine.subscribe((newState) => {
      setState(newState);
    });

    return unsub;
  }, [serverUrl]);

  const forceSync = useCallback(async () => {
    await webSyncEngine.forceSync();
  }, []);

  const enqueueAction = useCallback(
    (...args: Parameters<typeof webSyncEngine.enqueue>) => webSyncEngine.enqueue(...args),
    []
  );

  return {
    ...state,
    forceSync,
    enqueueAction,
  };
}
