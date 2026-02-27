// ═══════════════════════════════════════════════════════════════════════════════
// OFFLINE SERVICES — Barrel Export
// All offline-first services for the EusoTrip Driver mobile app
// ═══════════════════════════════════════════════════════════════════════════════

export { syncEngine } from './sync-engine';
export type { DetailedSyncState } from './sync-engine';
export { localGeofence } from './local-geofence.service';
export { gpsTracking } from './gps-tracking.service';
export { antiSpoofing } from './anti-spoofing.service';
export { documentCapture } from './document-capture.service';
export { cacheManager } from './cache-manager.service';
export { hosTracking } from './hos-tracking.service';
export type { HOSState, DutyStatus, HOSViolation } from './hos-tracking.service';
export { hazmatInspection } from './hazmat-inspection.service';
export type { InspectionState, ChecklistItem, InspectionType } from './hazmat-inspection.service';
export { routeCache } from './route-cache.service';
export type { CachedRoute, HazmatRestriction } from './route-cache.service';
