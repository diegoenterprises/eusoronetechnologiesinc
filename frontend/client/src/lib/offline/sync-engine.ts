/**
 * WEB SYNC ENGINE — Priority-based offline action queue with exponential backoff
 *
 * Features:
 *   - Priority lanes: CRITICAL → HIGH → NORMAL → LOW
 *   - Batching by action type (GPS breadcrumbs batched, state transitions sequential)
 *   - Exponential backoff with jitter (1s → 2s → 4s → 8s → 16s → 32s max)
 *   - Connection quality awareness (adjusts batch size)
 *   - Dead-letter queue after 10 retries
 *   - Deduplication via syncedActions store
 *   - Auto-sync on connectivity restore
 *   - Periodic sync every 15s when online
 */

import { dbAdd, dbGetByIndex, dbUpdate, dbDelete, dbGet, dbPut, dbCount, STORES } from "./db";
import type { OfflinePendingAction, ActionType, Priority } from "./types";

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const SYNC_INTERVAL_MS = 15_000;
const MAX_RETRIES = 10;
const BASE_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 32_000;
const MAX_BATCH_SIZE_GOOD = 50;
const MAX_BATCH_SIZE_SLOW = 10;
const MAX_BATCH_SIZE_POOR = 3;

const PRIORITY_ORDER: Priority[] = ["CRITICAL", "HIGH", "NORMAL", "LOW"];

const BATCHABLE_ACTIONS = new Set<ActionType>([
  "GPS_BREADCRUMBS",
  "GEOFENCE_EVENT",
]);

type SyncListener = (state: SyncState) => void;

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncedAt: Date | null;
  connectionQuality: "good" | "slow" | "poor" | "offline";
  syncProgress: number;
  totalToSync: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

class WebSyncEngine {
  private state: SyncState = {
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0,
    failedCount: 0,
    lastSyncedAt: null,
    connectionQuality: "good",
    syncProgress: 0,
    totalToSync: 0,
  };

  private listeners: Set<SyncListener> = new Set();
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private serverUrl: string = "";
  private authToken: string = "";
  private started = false;

  // ── Lifecycle ──────────────────────────────────────────────────────────

  start(serverUrl: string, authToken?: string) {
    if (this.started) return;
    this.started = true;
    this.serverUrl = serverUrl;
    if (authToken) this.authToken = authToken;

    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);

    this.syncTimer = setInterval(() => this.tick(), SYNC_INTERVAL_MS);
    this.pingTimer = setInterval(() => this.measureConnection(), 60_000);
    this.measureConnection();
    this.refreshCounts();
    console.log("[SyncEngine] Started — interval:", SYNC_INTERVAL_MS, "ms");
  }

  stop() {
    this.started = false;
    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);
    if (this.syncTimer) clearInterval(this.syncTimer);
    if (this.pingTimer) clearInterval(this.pingTimer);
  }

  setAuth(token: string) {
    this.authToken = token;
  }

  // ── Subscribe ──────────────────────────────────────────────────────────

  subscribe(fn: SyncListener): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    this.listeners.forEach((fn) => fn({ ...this.state }));
  }

  private patch(partial: Partial<SyncState>) {
    Object.assign(this.state, partial);
    this.emit();
  }

  // ── Queue Actions ──────────────────────────────────────────────────────

  async enqueue(actionType: ActionType, payload: Record<string, unknown>, priority: Priority = "NORMAL", requiresOrder = false): Promise<number> {
    const action: Omit<OfflinePendingAction, "id"> = {
      actionType,
      payloadJson: JSON.stringify(payload),
      createdAt: Date.now(),
      priority,
      requiresOrder,
      attempts: 0,
      syncStatus: "PENDING",
    };
    const id = (await dbAdd(STORES.pendingActions, action)) as number;
    await this.refreshCounts();

    // Immediate sync for critical actions
    if (priority === "CRITICAL" && this.state.isOnline) {
      this.tick();
    }
    return id;
  }

  async enqueueGPS(loadId: string, lat: number, lng: number, accuracy: number, speed?: number, heading?: number, altitude?: number, isMock = false) {
    return this.enqueue("GPS_BREADCRUMBS", { loadId, latitude: lat, longitude: lng, accuracy, speed, heading, altitude, isMock, timestamp: Date.now() }, "LOW");
  }

  async enqueueStateTransition(loadId: string, fromState: string, toState: string, trigger: string, lat?: number, lng?: number, metadata?: Record<string, unknown>) {
    return this.enqueue("STATE_TRANSITION", { loadId, fromState, toState, trigger, latitude: lat, longitude: lng, timestamp: Date.now(), metadata }, "CRITICAL", true);
  }

  async enqueueDocument(loadId: string, docType: string, fileBase64: string, mimeType: string, lat?: number, lng?: number) {
    return this.enqueue("DOCUMENT_CAPTURE", { loadId, documentType: docType, fileBase64, mimeType, latitude: lat, longitude: lng, capturedAt: Date.now() }, "HIGH");
  }

  async enqueueInspection(inspectionData: Record<string, unknown>) {
    return this.enqueue("INSPECTION", { ...inspectionData, timestamp: Date.now() }, "HIGH", true);
  }

  async enqueueGeofenceEvent(geofenceId: string, loadId: string, eventType: string, lat: number, lng: number, dwellMs?: number) {
    return this.enqueue("GEOFENCE_EVENT", { geofenceId, loadId, eventType, latitude: lat, longitude: lng, dwellDurationMs: dwellMs, timestamp: Date.now() }, "HIGH");
  }

  async enqueueHOSUpdate(driverId: string, status: string, location?: { lat: number; lng: number }) {
    return this.enqueue("HOS_UPDATE", { driverId, status, latitude: location?.lat, longitude: location?.lng, timestamp: Date.now() }, "CRITICAL", true);
  }

  // ── Force Sync ─────────────────────────────────────────────────────────

  async forceSync() {
    if (!this.state.isOnline) return;
    await this.processBatch();
  }

  // ── Tick ────────────────────────────────────────────────────────────────

  private async tick() {
    if (!this.state.isOnline || this.state.isSyncing) return;
    await this.processBatch();
  }

  // ── Process Batch ──────────────────────────────────────────────────────

  private async processBatch() {
    this.patch({ isSyncing: true });
    try {
      const pending = await dbGetByIndex<OfflinePendingAction>(STORES.pendingActions, "by_syncStatus", "PENDING");
      if (pending.length === 0) {
        this.patch({ isSyncing: false });
        return;
      }

      // Sort by priority then createdAt
      pending.sort((a, b) => {
        const pa = PRIORITY_ORDER.indexOf(a.priority);
        const pb = PRIORITY_ORDER.indexOf(b.priority);
        if (pa !== pb) return pa - pb;
        return a.createdAt - b.createdAt;
      });

      const batchSize = this.getBatchSize();
      const batch = pending.slice(0, batchSize);

      this.patch({ totalToSync: pending.length, syncProgress: 0 });

      // Group batchable vs sequential
      const batchable: OfflinePendingAction[] = [];
      const sequential: OfflinePendingAction[] = [];
      for (const action of batch) {
        if (BATCHABLE_ACTIONS.has(action.actionType as ActionType) && !action.requiresOrder) {
          batchable.push(action);
        } else {
          sequential.push(action);
        }
      }

      // Process sequential first (order matters)
      let processed = 0;
      for (const action of sequential) {
        await this.syncAction(action);
        processed++;
        this.patch({ syncProgress: processed });
      }

      // Then batch the batchable ones
      if (batchable.length > 0) {
        await this.syncBatch(batchable);
        processed += batchable.length;
        this.patch({ syncProgress: processed });
      }

      this.patch({ lastSyncedAt: new Date() });
    } catch (err) {
      console.error("[SyncEngine] Batch error:", err);
    } finally {
      await this.refreshCounts();
      this.patch({ isSyncing: false });
    }
  }

  private async syncAction(action: OfflinePendingAction): Promise<void> {
    if (!action.id) return;

    // Check backoff
    if (action.attempts > 0 && action.lastAttemptAt) {
      const backoff = Math.min(BASE_BACKOFF_MS * Math.pow(2, action.attempts - 1), MAX_BACKOFF_MS);
      const jitter = Math.random() * backoff * 0.3;
      const waitUntil = action.lastAttemptAt + backoff + jitter;
      if (Date.now() < waitUntil) return;
    }

    // Mark syncing
    await dbUpdate<OfflinePendingAction>(STORES.pendingActions, action.id, (a) => ({ ...a, syncStatus: "SYNCING" }));

    try {
      const resp = await this.sendToServer([{
        clientId: `${action.id}-${action.createdAt}`,
        actionType: action.actionType,
        payload: JSON.parse(action.payloadJson),
        timestamp: action.createdAt,
        priority: action.priority,
      }]);

      if (resp.ok) {
        await dbDelete(STORES.pendingActions, action.id);
        // Track in synced actions for dedup
        await dbPut(STORES.syncedActions, { clientId: `${action.id}-${action.createdAt}`, syncedAt: Date.now() });
      } else {
        throw new Error(`Server responded ${resp.status}`);
      }
    } catch (err: any) {
      const newAttempts = action.attempts + 1;
      if (newAttempts >= MAX_RETRIES) {
        await dbUpdate<OfflinePendingAction>(STORES.pendingActions, action.id, (a) => ({
          ...a, syncStatus: "FAILED", attempts: newAttempts, lastAttemptAt: Date.now(),
          errorMessage: err.message || "Max retries exceeded",
        }));
      } else {
        await dbUpdate<OfflinePendingAction>(STORES.pendingActions, action.id, (a) => ({
          ...a, syncStatus: "PENDING", attempts: newAttempts, lastAttemptAt: Date.now(),
          errorMessage: err.message,
        }));
      }
    }
  }

  private async syncBatch(actions: OfflinePendingAction[]): Promise<void> {
    const items = actions.filter(a => a.id).map(a => ({
      clientId: `${a.id}-${a.createdAt}`,
      actionType: a.actionType,
      payload: JSON.parse(a.payloadJson),
      timestamp: a.createdAt,
      priority: a.priority,
    }));

    try {
      const resp = await this.sendToServer(items);
      if (resp.ok) {
        for (const action of actions) {
          if (action.id) {
            await dbDelete(STORES.pendingActions, action.id);
            await dbPut(STORES.syncedActions, { clientId: `${action.id}-${action.createdAt}`, syncedAt: Date.now() });
          }
        }
      } else {
        // Fall back to individual sync
        for (const action of actions) await this.syncAction(action);
      }
    } catch {
      for (const action of actions) await this.syncAction(action);
    }
  }

  // ── HTTP ───────────────────────────────────────────────────────────────

  private async sendToServer(actions: unknown[]): Promise<Response> {
    const url = `${this.serverUrl}/api/trpc/sync.processBatch`;
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
      },
      credentials: "include",
      body: JSON.stringify({ json: { actions, deviceId: this.getDeviceId(), clientTimestamp: Date.now() } }),
    });
  }

  // ── Connection Quality ─────────────────────────────────────────────────

  private async measureConnection() {
    if (!navigator.onLine) {
      this.patch({ connectionQuality: "offline", isOnline: false });
      return;
    }
    try {
      const start = performance.now();
      await fetch(`${this.serverUrl}/api/health`, { method: "HEAD", cache: "no-store" });
      const latency = performance.now() - start;
      const quality = latency < 200 ? "good" : latency < 1000 ? "slow" : "poor";
      this.patch({ connectionQuality: quality, isOnline: true });
    } catch {
      this.patch({ connectionQuality: "poor" });
    }
  }

  private getBatchSize(): number {
    switch (this.state.connectionQuality) {
      case "good": return MAX_BATCH_SIZE_GOOD;
      case "slow": return MAX_BATCH_SIZE_SLOW;
      case "poor": return MAX_BATCH_SIZE_POOR;
      default: return MAX_BATCH_SIZE_SLOW;
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private handleOnline = () => {
    this.patch({ isOnline: true });
    this.measureConnection();
    setTimeout(() => this.tick(), 1_000);
    console.log("[SyncEngine] Back online — triggering sync");
  };

  private handleOffline = () => {
    this.patch({ isOnline: false, connectionQuality: "offline" });
    console.log("[SyncEngine] Went offline");
  };

  private async refreshCounts() {
    const [pendingCount, failedCount] = await Promise.all([
      dbCount(STORES.pendingActions, "by_syncStatus", "PENDING"),
      dbCount(STORES.pendingActions, "by_syncStatus", "FAILED"),
    ]);
    this.patch({ pendingCount, failedCount });
  }

  private getDeviceId(): string {
    let id = localStorage.getItem("eusotrip_device_id");
    if (!id) {
      id = `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem("eusotrip_device_id", id);
    }
    return id;
  }

  getState(): SyncState {
    return { ...this.state };
  }
}

export const webSyncEngine = new WebSyncEngine();
