import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    // ═══════════════════════════════════════════════════════════════════
    // LOADS (Cached from server)
    // ═══════════════════════════════════════════════════════════════════
    tableSchema({
      name: 'loads',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'status', type: 'string', isIndexed: true },
        { name: 'status_updated_at', type: 'number' },
        
        // Pickup
        { name: 'pickup_facility_id', type: 'string' },
        { name: 'pickup_facility_name', type: 'string' },
        { name: 'pickup_address', type: 'string' },
        { name: 'pickup_latitude', type: 'number' },
        { name: 'pickup_longitude', type: 'number' },
        { name: 'pickup_window_start', type: 'number' },
        { name: 'pickup_window_end', type: 'number' },
        
        // Delivery
        { name: 'delivery_facility_id', type: 'string' },
        { name: 'delivery_facility_name', type: 'string' },
        { name: 'delivery_address', type: 'string' },
        { name: 'delivery_latitude', type: 'number' },
        { name: 'delivery_longitude', type: 'number' },
        { name: 'delivery_window_start', type: 'number' },
        { name: 'delivery_window_end', type: 'number' },
        
        // Cargo
        { name: 'commodity', type: 'string' },
        { name: 'hazmat_class', type: 'string', isOptional: true },
        { name: 'un_number', type: 'string', isOptional: true },
        { name: 'weight', type: 'number', isOptional: true },
        
        // Financials
        { name: 'rate', type: 'number' },
        { name: 'detention_rate', type: 'number', isOptional: true },
        
        // Route
        { name: 'route_polyline', type: 'string', isOptional: true },
        { name: 'estimated_miles', type: 'number', isOptional: true },
        { name: 'estimated_duration', type: 'number', isOptional: true },
        
        // Sync
        { name: 'cached_at', type: 'number' },
        { name: 'last_synced_at', type: 'number', isOptional: true },
        
        // JSON blobs for complex data
        { name: 'shipper_json', type: 'string', isOptional: true },
        { name: 'broker_json', type: 'string', isOptional: true },
        { name: 'requirements_json', type: 'string', isOptional: true },
      ],
    }),
    
    // ═══════════════════════════════════════════════════════════════════
    // GEOFENCES (Downloaded for offline checking)
    // ═══════════════════════════════════════════════════════════════════
    tableSchema({
      name: 'geofences',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'load_id', type: 'string', isIndexed: true },
        { name: 'type', type: 'string' }, // PICKUP_APPROACH, PICKUP_FACILITY, etc.
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        { name: 'radius_meters', type: 'number' },
        { name: 'polygon_json', type: 'string', isOptional: true },
        { name: 'is_active', type: 'boolean' },
        { name: 'dwell_threshold_seconds', type: 'number', isOptional: true },
        { name: 'cached_at', type: 'number' },
      ],
    }),
    
    // ═══════════════════════════════════════════════════════════════════
    // GPS BREADCRUMBS (Stored locally, synced in batches)
    // ═══════════════════════════════════════════════════════════════════
    tableSchema({
      name: 'gps_breadcrumbs',
      columns: [
        { name: 'load_id', type: 'string', isIndexed: true },
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        { name: 'altitude', type: 'number', isOptional: true },
        { name: 'accuracy', type: 'number' },
        { name: 'speed', type: 'number', isOptional: true },
        { name: 'heading', type: 'number', isOptional: true },
        { name: 'timestamp', type: 'number', isIndexed: true },
        { name: 'is_mock', type: 'boolean' },
        { name: 'spoof_flags_json', type: 'string', isOptional: true },
        { name: 'sync_status', type: 'string', isIndexed: true }, // PENDING, SYNCED
        { name: 'synced_at', type: 'number', isOptional: true },
      ],
    }),
    
    // ═══════════════════════════════════════════════════════════════════
    // GEOFENCE EVENTS (Local detections, queued for sync)
    // ═══════════════════════════════════════════════════════════════════
    tableSchema({
      name: 'geofence_events',
      columns: [
        { name: 'geofence_id', type: 'string', isIndexed: true },
        { name: 'load_id', type: 'string', isIndexed: true },
        { name: 'geofence_type', type: 'string' },
        { name: 'event_type', type: 'string' }, // ENTER, EXIT, DWELL
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        { name: 'timestamp', type: 'number', isIndexed: true },
        { name: 'dwell_duration_ms', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string', isIndexed: true },
        { name: 'synced_at', type: 'number', isOptional: true },
      ],
    }),
    
    // ═══════════════════════════════════════════════════════════════════
    // PENDING ACTIONS (Offline action queue)
    // ═══════════════════════════════════════════════════════════════════
    tableSchema({
      name: 'pending_actions',
      columns: [
        { name: 'action_type', type: 'string', isIndexed: true },
        { name: 'payload_json', type: 'string' },
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'priority', type: 'string' }, // CRITICAL, HIGH, NORMAL, LOW
        { name: 'requires_order', type: 'boolean' },
        { name: 'attempts', type: 'number' },
        { name: 'last_attempt_at', type: 'number', isOptional: true },
        { name: 'error_message', type: 'string', isOptional: true },
        { name: 'sync_status', type: 'string', isIndexed: true },
      ],
    }),
    
    // ═══════════════════════════════════════════════════════════════════
    // LOCAL DOCUMENTS (Photos, signatures captured offline)
    // ═══════════════════════════════════════════════════════════════════
    tableSchema({
      name: 'local_documents',
      columns: [
        { name: 'load_id', type: 'string', isIndexed: true },
        { name: 'document_type', type: 'string' }, // BOL, POD, PHOTO, SIGNATURE, INSPECTION
        { name: 'purpose', type: 'string', isOptional: true }, // DAMAGE, SEAL, PLACARD, etc.
        { name: 'local_path', type: 'string' },
        { name: 'file_size', type: 'number' },
        { name: 'mime_type', type: 'string' },
        { name: 'latitude', type: 'number', isOptional: true },
        { name: 'longitude', type: 'number', isOptional: true },
        { name: 'captured_at', type: 'number', isIndexed: true },
        { name: 'captured_by', type: 'string' },
        { name: 'metadata_json', type: 'string', isOptional: true },
        { name: 'sync_status', type: 'string', isIndexed: true },
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'synced_at', type: 'number', isOptional: true },
      ],
    }),
    
    // ═══════════════════════════════════════════════════════════════════
    // LOCAL STATE TRANSITIONS (Load status changes made offline)
    // ═══════════════════════════════════════════════════════════════════
    tableSchema({
      name: 'state_transitions',
      columns: [
        { name: 'load_id', type: 'string', isIndexed: true },
        { name: 'from_state', type: 'string' },
        { name: 'to_state', type: 'string' },
        { name: 'trigger', type: 'string' }, // USER_ACTION, GEOFENCE, TIMER
        { name: 'trigger_event', type: 'string' },
        { name: 'latitude', type: 'number', isOptional: true },
        { name: 'longitude', type: 'number', isOptional: true },
        { name: 'timestamp', type: 'number', isIndexed: true },
        { name: 'metadata_json', type: 'string', isOptional: true },
        { name: 'sync_status', type: 'string', isIndexed: true },
        { name: 'synced_at', type: 'number', isOptional: true },
      ],
    }),
    
    // ═══════════════════════════════════════════════════════════════════
    // FACILITIES (Cached for offline reference)
    // ═══════════════════════════════════════════════════════════════════
    tableSchema({
      name: 'facilities',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'address', type: 'string' },
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        { name: 'phone', type: 'string', isOptional: true },
        { name: 'contact_name', type: 'string', isOptional: true },
        { name: 'hours_json', type: 'string', isOptional: true },
        { name: 'instructions', type: 'string', isOptional: true },
        { name: 'cached_at', type: 'number' },
      ],
    }),
    
    // ═══════════════════════════════════════════════════════════════════
    // INSPECTIONS (Pre-trip, post-trip completed offline)
    // ═══════════════════════════════════════════════════════════════════
    tableSchema({
      name: 'inspections',
      columns: [
        { name: 'load_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'vehicle_id', type: 'string', isIndexed: true },
        { name: 'inspection_type', type: 'string' }, // PRE_TRIP, POST_TRIP, TANKER
        { name: 'status', type: 'string' }, // IN_PROGRESS, PASSED, FAILED
        { name: 'started_at', type: 'number' },
        { name: 'completed_at', type: 'number', isOptional: true },
        { name: 'latitude', type: 'number', isOptional: true },
        { name: 'longitude', type: 'number', isOptional: true },
        { name: 'checklist_json', type: 'string' },
        { name: 'defects_json', type: 'string', isOptional: true },
        { name: 'photos_json', type: 'string', isOptional: true },
        { name: 'signature_path', type: 'string', isOptional: true },
        { name: 'sync_status', type: 'string', isIndexed: true },
        { name: 'synced_at', type: 'number', isOptional: true },
      ],
    }),
    
    // ═══════════════════════════════════════════════════════════════════
    // DETENTION TIMERS (Local tracking of detention time)
    // ═══════════════════════════════════════════════════════════════════
    tableSchema({
      name: 'detention_timers',
      columns: [
        { name: 'load_id', type: 'string', isIndexed: true },
        { name: 'facility_type', type: 'string' }, // PICKUP, DELIVERY
        { name: 'started_at', type: 'number' },
        { name: 'stopped_at', type: 'number', isOptional: true },
        { name: 'free_time_minutes', type: 'number' },
        { name: 'billable_minutes', type: 'number' },
        { name: 'rate_per_hour', type: 'number' },
        { name: 'is_active', type: 'boolean' },
        { name: 'sync_status', type: 'string', isIndexed: true },
      ],
    }),
    
    // ═══════════════════════════════════════════════════════════════════
    // EMERGENCY CONTACTS (Always available offline)
    // ═══════════════════════════════════════════════════════════════════
    tableSchema({
      name: 'emergency_contacts',
      columns: [
        { name: 'type', type: 'string' }, // DISPATCH, SAFETY, HAZMAT, BREAKDOWN
        { name: 'name', type: 'string' },
        { name: 'phone', type: 'string' },
        { name: 'available_24_7', type: 'boolean' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'cached_at', type: 'number' },
      ],
    }),
    
    // ═══════════════════════════════════════════════════════════════════
    // SYNCED ACTIONS (Deduplication tracking)
    // ═══════════════════════════════════════════════════════════════════
    tableSchema({
      name: 'synced_actions',
      columns: [
        { name: 'client_id', type: 'string', isIndexed: true },
        { name: 'synced_at', type: 'number' },
      ],
    }),
  ],
});
