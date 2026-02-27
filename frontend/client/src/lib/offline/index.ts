/**
 * OFFLINE MODULE — Barrel export for the web offline-first system
 */

// Database
export { offlineDB } from "./db-api";
export { openDB, STORES } from "./db";

// Sync Engine
export { webSyncEngine, type SyncState } from "./sync-engine";

// GPS Tracking + Anti-Spoofing
export { webGPSTracking, type GPSState } from "./gps-tracking";

// Document Capture
export { webDocumentCapture } from "./document-capture";

// Cache Manager
export { webCacheManager, WebCacheManager } from "./cache-manager";

// State Transitions + Detention Timers
export { webStateTransitions } from "./state-transitions";

// Types
export type {
  OfflineLoad, OfflineGPSBreadcrumb, OfflinePendingAction,
  OfflineLocalDocument, OfflineStateTransition, OfflineFacility,
  OfflineInspection, OfflineDetentionTimer, OfflineEmergencyContact,
  OfflineGeofenceEvent, ActionType, Priority, SyncStatus,
} from "./types";
