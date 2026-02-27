import { Model } from '@nozbe/watermelondb';
import { field, json, children } from '@nozbe/watermelondb/decorators';

// ═══════════════════════════════════════════════════════════════════════════════
// LOAD MODEL
// ═══════════════════════════════════════════════════════════════════════════════

export class Load extends Model {
  static table = 'loads';
  static associations = {
    geofences: { type: 'has_many' as const, foreignKey: 'load_id' },
    gps_breadcrumbs: { type: 'has_many' as const, foreignKey: 'load_id' },
    local_documents: { type: 'has_many' as const, foreignKey: 'load_id' },
    state_transitions: { type: 'has_many' as const, foreignKey: 'load_id' },
  };

  @field('server_id') serverId!: string;
  @field('status') status!: string;
  @field('status_updated_at') statusUpdatedAt!: number;

  // Pickup
  @field('pickup_facility_id') pickupFacilityId!: string;
  @field('pickup_facility_name') pickupFacilityName!: string;
  @field('pickup_address') pickupAddress!: string;
  @field('pickup_latitude') pickupLatitude!: number;
  @field('pickup_longitude') pickupLongitude!: number;
  @field('pickup_window_start') pickupWindowStart!: number;
  @field('pickup_window_end') pickupWindowEnd!: number;

  // Delivery
  @field('delivery_facility_id') deliveryFacilityId!: string;
  @field('delivery_facility_name') deliveryFacilityName!: string;
  @field('delivery_address') deliveryAddress!: string;
  @field('delivery_latitude') deliveryLatitude!: number;
  @field('delivery_longitude') deliveryLongitude!: number;
  @field('delivery_window_start') deliveryWindowStart!: number;
  @field('delivery_window_end') deliveryWindowEnd!: number;

  // Cargo
  @field('commodity') commodity!: string;
  @field('hazmat_class') hazmatClass?: string;
  @field('un_number') unNumber?: string;
  @field('weight') weight?: number;

  // Financials
  @field('rate') rate!: number;
  @field('detention_rate') detentionRate?: number;

  // Route
  @field('route_polyline') routePolyline?: string;
  @field('estimated_miles') estimatedMiles?: number;
  @field('estimated_duration') estimatedDuration?: number;

  // JSON fields
  @json('shipper_json', (json: any) => json) shipper?: any;
  @json('broker_json', (json: any) => json) broker?: any;
  @json('requirements_json', (json: any) => json) requirements?: any;

  // Sync
  @field('cached_at') cachedAt!: number;
  @field('last_synced_at') lastSyncedAt?: number;

  // Relations
  @children('geofences') geofences!: any;
  @children('local_documents') documents!: any;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GEOFENCE MODEL
// ═══════════════════════════════════════════════════════════════════════════════

export class Geofence extends Model {
  static table = 'geofences';

  @field('server_id') serverId!: string;
  @field('load_id') loadId!: string;
  @field('type') type!: string;
  @field('latitude') latitude!: number;
  @field('longitude') longitude!: number;
  @field('radius_meters') radiusMeters!: number;
  @json('polygon_json', (json: any) => json) polygon?: { lat: number; lng: number }[];
  @field('is_active') isActive!: boolean;
  @field('dwell_threshold_seconds') dwellThresholdSeconds?: number;
  @field('cached_at') cachedAt!: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GPS BREADCRUMB MODEL
// ═══════════════════════════════════════════════════════════════════════════════

export class GPSBreadcrumb extends Model {
  static table = 'gps_breadcrumbs';

  @field('load_id') loadId!: string;
  @field('latitude') latitude!: number;
  @field('longitude') longitude!: number;
  @field('altitude') altitude?: number;
  @field('accuracy') accuracy!: number;
  @field('speed') speed?: number;
  @field('heading') heading?: number;
  @field('timestamp') timestamp!: number;
  @field('is_mock') isMock!: boolean;
  @json('spoof_flags_json', (json: any) => json) spoofFlags?: string[];
  @field('sync_status') syncStatus!: string;
  @field('synced_at') syncedAt?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GEOFENCE EVENT MODEL
// ═══════════════════════════════════════════════════════════════════════════════

export class GeofenceEvent extends Model {
  static table = 'geofence_events';

  @field('geofence_id') geofenceId!: string;
  @field('load_id') loadId!: string;
  @field('geofence_type') geofenceType!: string;
  @field('event_type') eventType!: string;
  @field('latitude') latitude!: number;
  @field('longitude') longitude!: number;
  @field('timestamp') timestamp!: number;
  @field('dwell_duration_ms') dwellDurationMs?: number;
  @field('sync_status') syncStatus!: string;
  @field('synced_at') syncedAt?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PENDING ACTION MODEL
// ═══════════════════════════════════════════════════════════════════════════════

export class PendingAction extends Model {
  static table = 'pending_actions';

  @field('action_type') actionType!: string;
  @json('payload_json', (json: any) => json) payload!: any;
  @field('created_at') createdAt!: number;
  @field('priority') priority!: string;
  @field('requires_order') requiresOrder!: boolean;
  @field('attempts') attempts!: number;
  @field('last_attempt_at') lastAttemptAt?: number;
  @field('error_message') errorMessage?: string;
  @field('sync_status') syncStatus!: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOCAL DOCUMENT MODEL
// ═══════════════════════════════════════════════════════════════════════════════

export class LocalDocument extends Model {
  static table = 'local_documents';

  @field('load_id') loadId!: string;
  @field('document_type') documentType!: string;
  @field('purpose') purpose?: string;
  @field('local_path') localPath!: string;
  @field('file_size') fileSize!: number;
  @field('mime_type') mimeType!: string;
  @field('latitude') latitude?: number;
  @field('longitude') longitude?: number;
  @field('captured_at') capturedAt!: number;
  @field('captured_by') capturedBy!: string;
  @json('metadata_json', (json: any) => json) metadata?: any;
  @field('sync_status') syncStatus!: string;
  @field('server_id') serverId?: string;
  @field('synced_at') syncedAt?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATE TRANSITION MODEL
// ═══════════════════════════════════════════════════════════════════════════════

export class StateTransition extends Model {
  static table = 'state_transitions';

  @field('load_id') loadId!: string;
  @field('from_state') fromState!: string;
  @field('to_state') toState!: string;
  @field('trigger') trigger!: string;
  @field('trigger_event') triggerEvent!: string;
  @field('latitude') latitude?: number;
  @field('longitude') longitude?: number;
  @field('timestamp') timestamp!: number;
  @json('metadata_json', (json: any) => json) metadata?: any;
  @field('sync_status') syncStatus!: string;
  @field('synced_at') syncedAt?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACILITY MODEL
// ═══════════════════════════════════════════════════════════════════════════════

export class Facility extends Model {
  static table = 'facilities';

  @field('server_id') serverId!: string;
  @field('name') name!: string;
  @field('address') address!: string;
  @field('latitude') latitude!: number;
  @field('longitude') longitude!: number;
  @field('phone') phone?: string;
  @field('contact_name') contactName?: string;
  @json('hours_json', (json: any) => json) hours?: any;
  @field('instructions') instructions?: string;
  @field('cached_at') cachedAt!: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSPECTION MODEL
// ═══════════════════════════════════════════════════════════════════════════════

export class Inspection extends Model {
  static table = 'inspections';

  @field('load_id') loadId?: string;
  @field('vehicle_id') vehicleId!: string;
  @field('inspection_type') inspectionType!: string;
  @field('status') status!: string;
  @field('started_at') startedAt!: number;
  @field('completed_at') completedAt?: number;
  @field('latitude') latitude?: number;
  @field('longitude') longitude?: number;
  @json('checklist_json', (json: any) => json) checklist!: any;
  @json('defects_json', (json: any) => json) defects?: any[];
  @json('photos_json', (json: any) => json) photos?: string[];
  @field('signature_path') signaturePath?: string;
  @field('sync_status') syncStatus!: string;
  @field('synced_at') syncedAt?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETENTION TIMER MODEL
// ═══════════════════════════════════════════════════════════════════════════════

export class DetentionTimer extends Model {
  static table = 'detention_timers';

  @field('load_id') loadId!: string;
  @field('facility_type') facilityType!: string;
  @field('started_at') startedAt!: number;
  @field('stopped_at') stoppedAt?: number;
  @field('free_time_minutes') freeTimeMinutes!: number;
  @field('billable_minutes') billableMinutes!: number;
  @field('rate_per_hour') ratePerHour!: number;
  @field('is_active') isActive!: boolean;
  @field('sync_status') syncStatus!: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMERGENCY CONTACT MODEL
// ═══════════════════════════════════════════════════════════════════════════════

export class EmergencyContact extends Model {
  static table = 'emergency_contacts';

  @field('type') type!: string;
  @field('name') name!: string;
  @field('phone') phone!: string;
  @field('available_24_7') available24_7!: boolean;
  @field('notes') notes?: string;
  @field('cached_at') cachedAt!: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYNCED ACTION MODEL
// ═══════════════════════════════════════════════════════════════════════════════

export class SyncedAction extends Model {
  static table = 'synced_actions';

  @field('client_id') clientId!: string;
  @field('synced_at') syncedAt!: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT ALL MODELS
// ═══════════════════════════════════════════════════════════════════════════════

export const models = [
  Load,
  Geofence,
  GPSBreadcrumb,
  GeofenceEvent,
  PendingAction,
  LocalDocument,
  StateTransition,
  Facility,
  Inspection,
  DetentionTimer,
  EmergencyContact,
  SyncedAction,
];
