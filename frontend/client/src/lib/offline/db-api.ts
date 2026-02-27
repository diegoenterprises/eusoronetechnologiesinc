/**
 * OFFLINE DB API — Domain-specific convenience layer over IndexedDB
 */

import {
  dbPut, dbAdd, dbGet, dbGetAll, dbGetByIndex,
  dbCount, dbDelete, dbClear, dbUpdate, dbBatchPut, STORES,
} from "./db";
import type {
  OfflineLoad, OfflineGPSBreadcrumb, OfflinePendingAction,
  OfflineLocalDocument, OfflineStateTransition, OfflineFacility,
  OfflineInspection, OfflineDetentionTimer, OfflineEmergencyContact,
  OfflineGeofenceEvent,
} from "./types";

export const offlineDB = {
  loads: {
    put: (v: OfflineLoad) => dbPut(STORES.loads, v),
    get: (id: string) => dbGet<OfflineLoad>(STORES.loads, id),
    getAll: () => dbGetAll<OfflineLoad>(STORES.loads),
    delete: (id: string) => dbDelete(STORES.loads, id),
    clear: () => dbClear(STORES.loads),
    batchPut: (items: OfflineLoad[]) => dbBatchPut(STORES.loads, items),
  },

  gpsBreadcrumbs: {
    add: (v: Omit<OfflineGPSBreadcrumb, "id">) => dbAdd(STORES.gpsBreadcrumbs, v),
    getPending: () => dbGetByIndex<OfflineGPSBreadcrumb>(STORES.gpsBreadcrumbs, "by_syncStatus", "PENDING"),
    getByLoad: (id: string) => dbGetByIndex<OfflineGPSBreadcrumb>(STORES.gpsBreadcrumbs, "by_loadId", id),
    markSynced: (id: number) => dbUpdate<OfflineGPSBreadcrumb>(STORES.gpsBreadcrumbs, id, v => ({ ...v, syncStatus: "SYNCED", syncedAt: Date.now() })),
    pendingCount: () => dbCount(STORES.gpsBreadcrumbs, "by_syncStatus", "PENDING"),
  },

  geofenceEvents: {
    add: (v: Omit<OfflineGeofenceEvent, "id">) => dbAdd(STORES.geofenceEvents, v),
    getPending: () => dbGetByIndex<OfflineGeofenceEvent>(STORES.geofenceEvents, "by_syncStatus", "PENDING"),
    getByLoad: (id: string) => dbGetByIndex<OfflineGeofenceEvent>(STORES.geofenceEvents, "by_loadId", id),
    markSynced: (id: number) => dbUpdate<OfflineGeofenceEvent>(STORES.geofenceEvents, id, v => ({ ...v, syncStatus: "SYNCED", syncedAt: Date.now() })),
    pendingCount: () => dbCount(STORES.geofenceEvents, "by_syncStatus", "PENDING"),
  },

  pendingActions: {
    add: (v: Omit<OfflinePendingAction, "id">) => dbAdd(STORES.pendingActions, v),
    getAll: () => dbGetAll<OfflinePendingAction>(STORES.pendingActions),
    getPending: () => dbGetByIndex<OfflinePendingAction>(STORES.pendingActions, "by_syncStatus", "PENDING"),
    getFailed: () => dbGetByIndex<OfflinePendingAction>(STORES.pendingActions, "by_syncStatus", "FAILED"),
    update: (id: number, fn: (v: OfflinePendingAction) => OfflinePendingAction) => dbUpdate(STORES.pendingActions, id, fn),
    delete: (id: number) => dbDelete(STORES.pendingActions, id),
    pendingCount: () => dbCount(STORES.pendingActions, "by_syncStatus", "PENDING"),
    failedCount: () => dbCount(STORES.pendingActions, "by_syncStatus", "FAILED"),
  },

  localDocuments: {
    add: (v: Omit<OfflineLocalDocument, "id">) => dbAdd(STORES.localDocuments, v),
    getPending: () => dbGetByIndex<OfflineLocalDocument>(STORES.localDocuments, "by_syncStatus", "PENDING"),
    getByLoad: (id: string) => dbGetByIndex<OfflineLocalDocument>(STORES.localDocuments, "by_loadId", id),
    markSynced: (id: number) => dbUpdate<OfflineLocalDocument>(STORES.localDocuments, id, v => ({ ...v, syncStatus: "SYNCED", syncedAt: Date.now() })),
    pendingCount: () => dbCount(STORES.localDocuments, "by_syncStatus", "PENDING"),
  },

  stateTransitions: {
    add: (v: Omit<OfflineStateTransition, "id">) => dbAdd(STORES.stateTransitions, v),
    getPending: () => dbGetByIndex<OfflineStateTransition>(STORES.stateTransitions, "by_syncStatus", "PENDING"),
    getByLoad: (id: string) => dbGetByIndex<OfflineStateTransition>(STORES.stateTransitions, "by_loadId", id),
    markSynced: (id: number) => dbUpdate<OfflineStateTransition>(STORES.stateTransitions, id, v => ({ ...v, syncStatus: "SYNCED", syncedAt: Date.now() })),
    pendingCount: () => dbCount(STORES.stateTransitions, "by_syncStatus", "PENDING"),
  },

  facilities: {
    put: (v: OfflineFacility) => dbPut(STORES.facilities, v),
    get: (id: string) => dbGet<OfflineFacility>(STORES.facilities, id),
    getAll: () => dbGetAll<OfflineFacility>(STORES.facilities),
    clear: () => dbClear(STORES.facilities),
    batchPut: (items: OfflineFacility[]) => dbBatchPut(STORES.facilities, items),
  },

  inspections: {
    add: (v: Omit<OfflineInspection, "id">) => dbAdd(STORES.inspections, v),
    getPending: () => dbGetByIndex<OfflineInspection>(STORES.inspections, "by_syncStatus", "PENDING"),
    getByLoad: (id: string) => dbGetByIndex<OfflineInspection>(STORES.inspections, "by_loadId", id),
    markSynced: (id: number) => dbUpdate<OfflineInspection>(STORES.inspections, id, v => ({ ...v, syncStatus: "SYNCED", syncedAt: Date.now() })),
    pendingCount: () => dbCount(STORES.inspections, "by_syncStatus", "PENDING"),
  },

  detentionTimers: {
    add: (v: Omit<OfflineDetentionTimer, "id">) => dbAdd(STORES.detentionTimers, v),
    getByLoad: (id: string) => dbGetByIndex<OfflineDetentionTimer>(STORES.detentionTimers, "by_loadId", id),
    getActive: () => dbGetByIndex<OfflineDetentionTimer>(STORES.detentionTimers, "by_isActive", 1 as unknown as IDBValidKey),
    update: (id: number, fn: (v: OfflineDetentionTimer) => OfflineDetentionTimer) => dbUpdate(STORES.detentionTimers, id, fn),
    pendingCount: () => dbCount(STORES.detentionTimers, "by_loadId"),
  },

  emergencyContacts: {
    add: (v: Omit<OfflineEmergencyContact, "id">) => dbAdd(STORES.emergencyContacts, v),
    getAll: () => dbGetAll<OfflineEmergencyContact>(STORES.emergencyContacts),
    clear: () => dbClear(STORES.emergencyContacts),
    batchPut: (items: OfflineEmergencyContact[]) => dbBatchPut(STORES.emergencyContacts, items),
  },

  syncedActions: {
    put: (clientId: string) => dbPut(STORES.syncedActions, { clientId, syncedAt: Date.now() }),
    has: async (clientId: string) => !!(await dbGet(STORES.syncedActions, clientId)),
  },
};
