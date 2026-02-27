import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { database, collections } from '@/database';
import { Q } from '@nozbe/watermelondb';
import { api } from '@/lib/api';
import { PendingAction } from '@/database/models';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type ActionType =
  | 'GPS_BREADCRUMBS'
  | 'GEOFENCE_EVENT'
  | 'STATE_TRANSITION'
  | 'DOCUMENT_CAPTURE'
  | 'INSPECTION'
  | 'SIGNATURE'
  | 'CHECKIN'
  | 'HOS_UPDATE';

type Priority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
type ConnectionQuality = 'good' | 'slow' | 'poor' | 'offline';

const SYNC_INTERVAL_MS = 15_000;
const MAX_RETRIES = 10;
const BASE_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 32_000;
const BATCH_SIZE_GOOD = 100;
const BATCH_SIZE_SLOW = 25;
const BATCH_SIZE_POOR = 5;

export interface DetailedSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  connectionQuality: ConnectionQuality;
  lastSyncedAt: Date | null;
  syncProgress: number;
  totalToSync: number;
}

interface SyncResult {
  processed: string[];
  failed: string[];
  conflicts: Conflict[];
}

interface Conflict {
  clientId: string;
  type: string;
  serverValue: any;
  clientValue: any;
  resolution: 'SERVER_WINS' | 'CLIENT_WINS' | 'MANUAL';
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYNC ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

class SyncEngine {
  private isOnline: boolean = false;
  private isSyncing: boolean = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private connCheckInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private stateListeners: Set<(state: DetailedSyncState) => void> = new Set();
  private connectionQuality: ConnectionQuality = 'offline';
  private lastSyncedAt: Date | null = null;
  private syncProgress: number = 0;
  private totalToSync: number = 0;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the sync engine
   */
  private async initialize(): Promise<void> {
    // Listen for connectivity changes
    NetInfo.addEventListener(this.handleConnectivityChange.bind(this));

    // Check initial state
    const state = await NetInfo.fetch();
    this.isOnline = !!(state.isConnected && state.isInternetReachable);

    // Start periodic sync
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.processQueue();
      }
    }, SYNC_INTERVAL_MS);

    // Connection quality probe every 60s
    this.connCheckInterval = setInterval(() => this.measureConnectionQuality(), 60_000);

    // Initial sync attempt
    if (this.isOnline) {
      this.measureConnectionQuality();
      this.processQueue();
    }
  }

  /**
   * Handle connectivity changes
   */
  private handleConnectivityChange(state: NetInfoState): void {
    const wasOnline = this.isOnline;
    this.isOnline = !!(state.isConnected && state.isInternetReachable);

    if (!this.isOnline) {
      this.connectionQuality = 'offline';
      this.emitState();
    }

    // Just came online - measure quality then sync
    if (!wasOnline && this.isOnline) {
      console.log('[SyncEngine] Connection restored, measuring quality...');
      this.measureConnectionQuality().then(() => this.processQueue());
    }
  }

  /**
   * Measure connection quality via lightweight ping
   */
  private async measureConnectionQuality(): Promise<void> {
    if (!this.isOnline) { this.connectionQuality = 'offline'; this.emitState(); return; }
    try {
      const start = Date.now();
      await api.get('/health');
      const latency = Date.now() - start;
      this.connectionQuality = latency < 200 ? 'good' : latency < 1000 ? 'slow' : 'poor';
    } catch {
      this.connectionQuality = 'poor';
    }
    this.emitState();
  }

  /**
   * Get adaptive batch size based on connection quality
   */
  private getAdaptiveBatchSize(): number {
    switch (this.connectionQuality) {
      case 'good': return BATCH_SIZE_GOOD;
      case 'slow': return BATCH_SIZE_SLOW;
      case 'poor': return BATCH_SIZE_POOR;
      default: return BATCH_SIZE_SLOW;
    }
  }

  /**
   * Exponential backoff with jitter
   */
  private getBackoffMs(attempts: number): number {
    const base = Math.min(BASE_BACKOFF_MS * Math.pow(2, attempts - 1), MAX_BACKOFF_MS);
    return base + Math.random() * base * 0.3;
  }

  /**
   * Emit detailed state to all state listeners
   */
  private emitState(): void {
    const state: DetailedSyncState = {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      connectionQuality: this.connectionQuality,
      lastSyncedAt: this.lastSyncedAt,
      syncProgress: this.syncProgress,
      totalToSync: this.totalToSync,
    };
    this.stateListeners.forEach(fn => fn(state));
  }

  /**
   * Subscribe to detailed sync state updates
   */
  subscribeState(listener: (state: DetailedSyncState) => void): () => void {
    this.stateListeners.add(listener);
    this.emitState();
    return () => this.stateListeners.delete(listener);
  }

  /**
   * Get current detailed state
   */
  getDetailedState(): DetailedSyncState {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      connectionQuality: this.connectionQuality,
      lastSyncedAt: this.lastSyncedAt,
      syncProgress: this.syncProgress,
      totalToSync: this.totalToSync,
    };
  }

  /**
   * Queue an action for sync
   * This is the main entry point for all offline actions
   */
  async queueAction(params: {
    actionType: ActionType;
    payload: any;
    priority?: Priority;
    requiresOrder?: boolean;
  }): Promise<string> {
    const { actionType, payload, priority = 'NORMAL', requiresOrder = false } = params;

    // Create pending action in database
    const action = await database.write(async () => {
      return collections.pendingActions.create((record: any) => {
        record.actionType = actionType;
        record.payload = payload;
        record.createdAt = Date.now();
        record.priority = priority;
        record.requiresOrder = requiresOrder;
        record.attempts = 0;
        record.syncStatus = 'PENDING';
      });
    });

    console.log(`[SyncEngine] Queued action: ${actionType} (${action.id})`);

    // Try to sync immediately if online
    if (this.isOnline && !this.isSyncing) {
      this.processQueue();
    }

    return action.id;
  }

  /**
   * Process the sync queue
   */
  async processQueue(): Promise<SyncResult> {
    if (this.isSyncing || !this.isOnline) {
      return { processed: [], failed: [], conflicts: [] };
    }

    this.isSyncing = true;
    this.notifyListeners('SYNCING');

    const result: SyncResult = {
      processed: [],
      failed: [],
      conflicts: [],
    };

    try {
      // Get all pending actions, sorted by priority then timestamp
      const pendingActions = await collections.pendingActions
        .query(
          Q.where('sync_status', 'PENDING'),
          Q.sortBy('priority', Q.asc), // CRITICAL < HIGH < NORMAL < LOW
          Q.sortBy('created_at', Q.asc)
        )
        .fetch();

      if (pendingActions.length === 0) {
        return result;
      }

      console.log(`[SyncEngine] Processing ${pendingActions.length} pending actions...`);

      // Group actions for batching
      const batches = this.createBatches(pendingActions);

      for (const batch of batches) {
        if (!this.isOnline) {
          console.log('[SyncEngine] Lost connection, stopping sync');
          break;
        }

        try {
          const batchResult = await this.syncBatch(batch);
          result.processed.push(...batchResult.processed);
          result.conflicts.push(...batchResult.conflicts);

          // Mark successful actions as synced
          await database.write(async () => {
            for (const id of batchResult.processed) {
              const action = await collections.pendingActions.find(id);
              await action.update((record: any) => {
                record.syncStatus = 'SYNCED';
              });
            }
          });

        } catch (error: any) {
          console.error('[SyncEngine] Batch sync failed:', error);

          // Update attempt count for failed actions
          await database.write(async () => {
            for (const action of batch) {
              await action.update((record: any) => {
                record.attempts = record.attempts + 1;
                record.lastAttemptAt = Date.now();
                record.errorMessage = error.message;

                // Move to dead letter after 5 attempts
                if (record.attempts >= 5) {
                  record.syncStatus = 'FAILED';
                  result.failed.push(action.id);
                }
              });
            }
          });
        }
      }

      // Clean up synced actions older than 24 hours
      await this.cleanupSyncedActions();

      return result;

    } finally {
      this.isSyncing = false;
      this.notifyListeners(result.failed.length > 0 ? 'FAILED' : 'SYNCED');
    }
  }

  /**
   * Create batches for efficient syncing
   */
  private createBatches(actions: PendingAction[]): PendingAction[][] {
    const batches: PendingAction[][] = [];

    // GPS breadcrumbs - batch up to 100
    const gpsActions = actions.filter(a => a.actionType === 'GPS_BREADCRUMBS');
    for (let i = 0; i < gpsActions.length; i += 100) {
      batches.push(gpsActions.slice(i, i + 100));
    }

    // State transitions - MUST be in order, one at a time
    const stateActions = actions
      .filter(a => a.actionType === 'STATE_TRANSITION' && a.requiresOrder)
      .sort((a, b) => a.createdAt - b.createdAt);
    for (const action of stateActions) {
      batches.push([action]); // Each state transition is its own batch
    }

    // Geofence events - batch together but maintain order
    const geofenceActions = actions
      .filter(a => a.actionType === 'GEOFENCE_EVENT')
      .sort((a, b) => a.createdAt - b.createdAt);
    if (geofenceActions.length > 0) {
      batches.push(geofenceActions);
    }

    // Documents - batch together
    const documentActions = actions.filter(a =>
      a.actionType === 'DOCUMENT_CAPTURE' || a.actionType === 'SIGNATURE'
    );
    if (documentActions.length > 0) {
      batches.push(documentActions);
    }

    // Everything else
    const otherActions = actions.filter(a =>
      !['GPS_BREADCRUMBS', 'STATE_TRANSITION', 'GEOFENCE_EVENT', 'DOCUMENT_CAPTURE', 'SIGNATURE']
        .includes(a.actionType)
    );
    if (otherActions.length > 0) {
      batches.push(otherActions);
    }

    return batches;
  }

  /**
   * Sync a batch of actions to the server
   */
  private async syncBatch(actions: PendingAction[]): Promise<{
    processed: string[];
    conflicts: Conflict[];
  }> {
    const response = await api.post('/sync/batch', {
      actions: actions.map(action => ({
        clientId: action.id,
        type: action.actionType,
        payload: action.payload,
        clientTimestamp: new Date(action.createdAt).toISOString(),
      })),
    });

    return {
      processed: response.processed || [],
      conflicts: response.conflicts || [],
    };
  }

  /**
   * Clean up old synced actions
   */
  private async cleanupSyncedActions(): Promise<void> {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

    await database.write(async () => {
      const oldActions = await collections.pendingActions
        .query(
          Q.where('sync_status', 'SYNCED'),
          Q.where('created_at', Q.lt(oneDayAgo))
        )
        .fetch();

      for (const action of oldActions) {
        await action.destroyPermanently();
      }
    });
  }

  /**
   * Get pending action count (for UI)
   */
  async getPendingCount(): Promise<number> {
    return collections.pendingActions
      .query(Q.where('sync_status', 'PENDING'))
      .fetchCount();
  }

  /**
   * Get failed action count
   */
  async getFailedCount(): Promise<number> {
    return collections.pendingActions
      .query(Q.where('sync_status', 'FAILED'))
      .fetchCount();
  }

  /**
   * Subscribe to sync status changes
   */
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(status: SyncStatus): void {
    this.listeners.forEach(listener => listener(status));
  }

  /**
   * Force a sync attempt
   */
  async forceSync(): Promise<SyncResult> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }
    return this.processQueue();
  }

  /**
   * Get current online status
   */
  getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Get current syncing status
   */
  getIsSyncing(): boolean {
    return this.isSyncing;
  }

  /**
   * Cleanup on app termination
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

// Singleton instance
export const syncEngine = new SyncEngine();
