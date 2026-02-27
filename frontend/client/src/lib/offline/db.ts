/**
 * OFFLINE DATABASE — IndexedDB with 12 object stores
 */
import type {
  OfflineLoad, OfflineGPSBreadcrumb, OfflinePendingAction,
  OfflineLocalDocument, OfflineStateTransition, OfflineFacility,
  OfflineInspection, OfflineDetentionTimer, OfflineEmergencyContact,
  OfflineGeofenceEvent,
} from "./types";

const DB_NAME = "eusotrip_offline_v2";
const DB_VERSION = 2;

export const STORES = {
  loads: "loads", geofences: "geofences", gpsBreadcrumbs: "gpsBreadcrumbs",
  geofenceEvents: "geofenceEvents", pendingActions: "pendingActions",
  localDocuments: "localDocuments", stateTransitions: "stateTransitions",
  facilities: "facilities", inspections: "inspections",
  detentionTimers: "detentionTimers", emergencyContacts: "emergencyContacts",
  syncedActions: "syncedActions",
} as const;

type StoreName = (typeof STORES)[keyof typeof STORES];

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      const make = (n: string, opts: IDBObjectStoreParameters, indexes?: [string, string][]) => {
        if (db.objectStoreNames.contains(n)) return;
        const s = db.createObjectStore(n, opts);
        indexes?.forEach(([iName, iKey]) => s.createIndex(iName, iKey));
      };
      make(STORES.loads, { keyPath: "serverId" });
      make(STORES.geofences, { keyPath: "id", autoIncrement: true }, [["by_loadId","loadId"],["by_serverId","serverId"]]);
      make(STORES.gpsBreadcrumbs, { keyPath: "id", autoIncrement: true }, [["by_loadId","loadId"],["by_syncStatus","syncStatus"],["by_timestamp","timestamp"]]);
      make(STORES.geofenceEvents, { keyPath: "id", autoIncrement: true }, [["by_loadId","loadId"],["by_syncStatus","syncStatus"]]);
      make(STORES.pendingActions, { keyPath: "id", autoIncrement: true }, [["by_syncStatus","syncStatus"],["by_priority","priority"],["by_createdAt","createdAt"]]);
      make(STORES.localDocuments, { keyPath: "id", autoIncrement: true }, [["by_loadId","loadId"],["by_syncStatus","syncStatus"]]);
      make(STORES.stateTransitions, { keyPath: "id", autoIncrement: true }, [["by_loadId","loadId"],["by_syncStatus","syncStatus"]]);
      make(STORES.facilities, { keyPath: "serverId" });
      make(STORES.inspections, { keyPath: "id", autoIncrement: true }, [["by_loadId","loadId"],["by_syncStatus","syncStatus"]]);
      make(STORES.detentionTimers, { keyPath: "id", autoIncrement: true }, [["by_loadId","loadId"],["by_isActive","isActive"]]);
      make(STORES.emergencyContacts, { keyPath: "id", autoIncrement: true });
      make(STORES.syncedActions, { keyPath: "clientId" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Generic helpers
async function tx<R>(store: StoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<R> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const r = fn(t.objectStore(store));
    r.onsuccess = () => { db.close(); resolve(r.result as R); };
    t.onerror = () => { db.close(); reject(t.error); };
  });
}

export const dbPut = <T>(s: StoreName, v: T) => tx<IDBValidKey>(s, "readwrite", o => o.put(v));
export const dbAdd = <T>(s: StoreName, v: T) => tx<IDBValidKey>(s, "readwrite", o => o.add(v));
export const dbGet = <T>(s: StoreName, k: IDBValidKey) => tx<T | undefined>(s, "readonly", o => o.get(k));
export const dbGetAll = <T>(s: StoreName) => tx<T[]>(s, "readonly", o => o.getAll());
export const dbDelete = (s: StoreName, k: IDBValidKey) => tx<undefined>(s, "readwrite", o => o.delete(k));

export async function dbGetByIndex<T>(store: StoreName, idx: string, val: IDBValidKey): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, "readonly");
    const r = t.objectStore(store).index(idx).getAll(val);
    r.onsuccess = () => { db.close(); resolve(r.result as T[]); };
    t.onerror = () => { db.close(); reject(t.error); };
  });
}

export async function dbCount(store: StoreName, idx?: string, val?: IDBValidKey): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, "readonly");
    const target = idx ? t.objectStore(store).index(idx) : t.objectStore(store);
    const r = val !== undefined ? target.count(val) : target.count();
    r.onsuccess = () => { db.close(); resolve(r.result); };
    t.onerror = () => { db.close(); reject(t.error); };
  });
}

export async function dbClear(store: StoreName): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, "readwrite");
    t.objectStore(store).clear();
    t.oncomplete = () => { db.close(); resolve(); };
    t.onerror = () => { db.close(); reject(t.error); };
  });
}

export async function dbUpdate<T>(store: StoreName, key: IDBValidKey, fn: (v: T) => T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, "readwrite");
    const s = t.objectStore(store);
    const r = s.get(key);
    r.onsuccess = () => { if (r.result) s.put(fn(r.result)); };
    t.oncomplete = () => { db.close(); resolve(); };
    t.onerror = () => { db.close(); reject(t.error); };
  });
}

export async function dbBatchPut<T>(store: StoreName, items: T[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, "readwrite");
    const s = t.objectStore(store);
    for (const item of items) s.put(item);
    t.oncomplete = () => { db.close(); resolve(); };
    t.onerror = () => { db.close(); reject(t.error); };
  });
}
