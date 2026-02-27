/**
 * OFFLINE TYPES — Shared types for the web offline-first system
 */

export interface OfflineLoad {
  serverId: string;
  status: string;
  statusUpdatedAt: number;
  pickupFacilityId: string;
  pickupFacilityName: string;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  pickupWindowStart: number;
  pickupWindowEnd: number;
  deliveryFacilityId: string;
  deliveryFacilityName: string;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  deliveryWindowStart: number;
  deliveryWindowEnd: number;
  commodity: string;
  hazmatClass?: string;
  unNumber?: string;
  weight?: number;
  rate: number;
  detentionRate?: number;
  routePolyline?: string;
  estimatedMiles?: number;
  estimatedDuration?: number;
  shipperJson?: string;
  brokerJson?: string;
  requirementsJson?: string;
  cachedAt: number;
  lastSyncedAt?: number;
}

export interface OfflineGPSBreadcrumb {
  id?: number;
  loadId: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  timestamp: number;
  isMock: boolean;
  spoofFlagsJson?: string;
  syncStatus: "PENDING" | "SYNCED";
  syncedAt?: number;
}

export interface OfflinePendingAction {
  id?: number;
  actionType: string;
  payloadJson: string;
  createdAt: number;
  priority: "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
  requiresOrder: boolean;
  attempts: number;
  lastAttemptAt?: number;
  errorMessage?: string;
  syncStatus: "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
}

export interface OfflineLocalDocument {
  id?: number;
  loadId: string;
  documentType: string;
  purpose?: string;
  localBlob?: Blob;
  localUrl?: string;
  fileSize: number;
  mimeType: string;
  latitude?: number;
  longitude?: number;
  capturedAt: number;
  capturedBy: string;
  metadataJson?: string;
  syncStatus: "PENDING" | "SYNCED";
  serverId?: string;
  syncedAt?: number;
}

export interface OfflineStateTransition {
  id?: number;
  loadId: string;
  fromState: string;
  toState: string;
  trigger: string;
  triggerEvent: string;
  latitude?: number;
  longitude?: number;
  timestamp: number;
  metadataJson?: string;
  syncStatus: "PENDING" | "SYNCED";
  syncedAt?: number;
}

export interface OfflineFacility {
  serverId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  contactName?: string;
  hoursJson?: string;
  instructions?: string;
  cachedAt: number;
}

export interface OfflineInspection {
  id?: number;
  loadId?: string;
  vehicleId: string;
  inspectionType: string;
  status: string;
  startedAt: number;
  completedAt?: number;
  latitude?: number;
  longitude?: number;
  checklistJson: string;
  defectsJson?: string;
  photosJson?: string;
  signatureBlob?: Blob;
  syncStatus: "PENDING" | "SYNCED";
  syncedAt?: number;
}

export interface OfflineDetentionTimer {
  id?: number;
  loadId: string;
  facilityType: string;
  startedAt: number;
  stoppedAt?: number;
  freeTimeMinutes: number;
  billableMinutes: number;
  ratePerHour: number;
  isActive: boolean;
  syncStatus: "PENDING" | "SYNCED";
}

export interface OfflineEmergencyContact {
  id?: number;
  type: string;
  name: string;
  phone: string;
  available24_7: boolean;
  notes?: string;
  cachedAt: number;
}

export interface OfflineGeofenceEvent {
  id?: number;
  geofenceId: string;
  loadId: string;
  geofenceType: string;
  eventType: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  dwellDurationMs?: number;
  syncStatus: "PENDING" | "SYNCED";
  syncedAt?: number;
}

export type ActionType =
  | "GPS_BREADCRUMBS"
  | "GEOFENCE_EVENT"
  | "STATE_TRANSITION"
  | "DOCUMENT_CAPTURE"
  | "INSPECTION"
  | "SIGNATURE"
  | "CHECKIN"
  | "HOS_UPDATE";

export type Priority = "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
export type SyncStatus = "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
