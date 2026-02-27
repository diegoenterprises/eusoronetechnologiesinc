import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import {
  models,
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
} from './models';

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'eusotrip_offline',
  jsi: true, // Use JSI for better performance
  onSetUpError: (error: any) => {
    console.error('Database setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: models,
});

// Helper to get typed collections
export const collections = {
  loads: database.get<Load>('loads'),
  geofences: database.get<Geofence>('geofences'),
  gpsBreadcrumbs: database.get<GPSBreadcrumb>('gps_breadcrumbs'),
  geofenceEvents: database.get<GeofenceEvent>('geofence_events'),
  pendingActions: database.get<PendingAction>('pending_actions'),
  localDocuments: database.get<LocalDocument>('local_documents'),
  stateTransitions: database.get<StateTransition>('state_transitions'),
  facilities: database.get<Facility>('facilities'),
  inspections: database.get<Inspection>('inspections'),
  detentionTimers: database.get<DetentionTimer>('detention_timers'),
  emergencyContacts: database.get<EmergencyContact>('emergency_contacts'),
  syncedActions: database.get<SyncedAction>('synced_actions'),
};
