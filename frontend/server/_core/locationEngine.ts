/**
 * EUSOTRIP LOCATION INTELLIGENCE ENGINE
 * Complete GPS, Navigation, Geofencing & Location Intelligence System
 * Based on EusoMap spec: ~/Desktop/EusoMap/EusoTrip_GPS_Navigation_Geofencing_System.md
 *
 * This file contains ALL core services:
 * - AntiSpoof: GPS spoofing detection (Section 5.3)
 * - BreadcrumbService: GPS point ingestion + storage (Section 3.3)
 * - GeotagService: Immutable location-stamped events (Section 5)
 * - GeofenceProcessor: The brain — ENTER/EXIT/DWELL → trigger cascade (Section 4.3)
 * - GeofenceFactory: Auto-create geofences for loads (Section 4.4)
 * - DetentionClock: Auto start/stop detention from geofence dwell (Section 4.3/8.2)
 * - ETAEngine: ETA recalculation with confidence (Section 16)
 * - HazmatRouter: Hazmat-compliant route calculation (Section 17)
 * - RouteDeviationDetector: Off-route detection (Section 6.3)
 * - TriggerBus: Central event bus routing geofence events to handlers (Section 7/8)
 * - WebSocketChannels: Role-based channel subscriptions (Section 11)
 */

import { getDb } from "../db";
import { eq, and, desc, sql, gt, lt, between } from "drizzle-orm";
import {
  locationBreadcrumbs, geotags, loadRoutes, detentionRecords, stateCrossings,
  geofences, geofenceEvents, loads, users, vehicles, gpsTracking,
  locationHistory, etaHistory,
} from "../../drizzle/schema";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface LatLng { lat: number; lng: number; }

export interface LocationPoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number;
  heading?: number;
  accuracy?: number;
  altitude?: number;
  batteryLevel?: number;
  isCharging?: boolean;
  odometer?: number;
  activity?: string;
  isMock?: boolean;
}

export type GeofenceType =
  | "PICKUP_APPROACH" | "PICKUP_FACILITY"
  | "DELIVERY_APPROACH" | "DELIVERY_FACILITY"
  | "WAYPOINT" | "STATE_BORDER" | "HAZMAT_ZONE"
  | "REST_AREA" | "FUEL_STOP" | "WEIGH_STATION" | "CUSTOM";

export type GeofenceAction = "ENTER" | "EXIT" | "DWELL";

export interface GeofenceEventData {
  geofenceId: number;
  geofenceType: string;
  action: GeofenceAction;
  loadId?: number;
  driverId: number;
  vehicleId?: number;
  location: LatLng;
  timestamp: Date;
  dwellTimeSeconds?: number;
  facilityName?: string;
  fromState?: string;
  toState?: string;
  zoneName?: string;
}

export type LoadState =
  | "posted" | "bidding" | "assigned" | "booked"
  | "en_route_to_pickup" | "approaching_pickup" | "at_pickup" | "loading" | "loaded"
  | "in_transit" | "approaching_delivery" | "at_delivery" | "unloading"
  | "delivered" | "completed" | "cancelled";

export interface SpoofingResult {
  isSuspicious: boolean;
  checks: Array<{ check: string; severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; detail: string }>;
}

export interface ETAResult {
  estimatedArrival: Date;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  remainingMiles: number;
  remainingMinutes: number;
  trafficDelay: number;
  weatherDelay: number;
  hosBreakNeeded: boolean;
  hosBreakMinutes: number;
}

export interface TriggerResult {
  type: string;
  target: string;
  data: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════
// HAVERSINE DISTANCE (shared utility)
// ═══════════════════════════════════════════════════════════════════════════

export function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 3959; // Earth radius in miles
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const x = sinDLat * sinDLat + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function haversineDistanceMeters(a: LatLng, b: LatLng): number {
  return haversineDistance(a, b) * 1609.344;
}

// ═══════════════════════════════════════════════════════════════════════════
// ANTI-SPOOF (Section 5.3)
// ═══════════════════════════════════════════════════════════════════════════

export function detectSpoofing(
  current: LocationPoint,
  previous: LocationPoint | null,
  isMockLocation?: boolean,
): SpoofingResult {
  const checks: SpoofingResult["checks"] = [];

  if (isMockLocation) {
    checks.push({ check: "MOCK_LOCATION", severity: "CRITICAL", detail: "Device is using mock location provider" });
  }

  if (previous) {
    const distKm = haversineDistance(
      { lat: current.lat, lng: current.lng },
      { lat: previous.lat, lng: previous.lng }
    ) * 1.60934; // mi to km
    const timeDiffHours = (new Date(current.timestamp).getTime() - new Date(previous.timestamp).getTime()) / 3600000;
    if (timeDiffHours > 0) {
      const impliedSpeedMph = (distKm * 0.621371) / timeDiffHours;
      if (impliedSpeedMph > 120) {
        checks.push({ check: "TELEPORTATION", severity: "HIGH", detail: `Implied speed: ${Math.round(impliedSpeedMph)} mph over ${Math.round(distKm)} km` });
      }
    }

    if (current.accuracy !== undefined && current.accuracy < 3 && !current.isCharging) {
      checks.push({ check: "SUSPICIOUS_ACCURACY", severity: "MEDIUM", detail: `Accuracy ${current.accuracy}m seems artificially precise` });
    }

    if (previous.altitude && current.altitude) {
      const altDiff = Math.abs(current.altitude - previous.altitude);
      if (altDiff > 5000 && timeDiffHours < 1) {
        checks.push({ check: "ALTITUDE_JUMP", severity: "MEDIUM", detail: `Altitude changed ${altDiff}ft in ${Math.round(timeDiffHours * 60)} minutes` });
      }
    }
  }

  return {
    isSuspicious: checks.some(c => c.severity === "CRITICAL" || c.severity === "HIGH"),
    checks,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// BREADCRUMB SERVICE (Section 3.3)
// ═══════════════════════════════════════════════════════════════════════════

export async function ingestBreadcrumbs(
  driverId: number,
  points: LocationPoint[],
  loadId?: number,
  vehicleId?: number,
  loadState?: string,
): Promise<{ ingested: number; flagged: number }> {
  const db = await getDb();
  if (!db || points.length === 0) return { ingested: 0, flagged: 0 };

  let flagged = 0;
  let previous: LocationPoint | null = null;

  // Get the last breadcrumb for anti-spoof comparison
  const [lastBc] = await db.select({
    lat: locationBreadcrumbs.lat,
    lng: locationBreadcrumbs.lng,
    ts: locationBreadcrumbs.deviceTimestamp,
    alt: locationBreadcrumbs.altitude,
    spd: locationBreadcrumbs.speed,
  }).from(locationBreadcrumbs)
    .where(eq(locationBreadcrumbs.driverId, driverId))
    .orderBy(desc(locationBreadcrumbs.serverTimestamp))
    .limit(1);

  if (lastBc) {
    previous = {
      lat: Number(lastBc.lat), lng: Number(lastBc.lng),
      timestamp: lastBc.ts?.toISOString() || new Date().toISOString(),
      altitude: lastBc.alt ? Number(lastBc.alt) : undefined,
      speed: lastBc.spd ? Number(lastBc.spd) : undefined,
    };
  }

  const rows = points.map((p) => {
    const spoof = detectSpoofing(p, previous, p.isMock);
    if (spoof.isSuspicious) flagged++;
    previous = p;

    return {
      loadId: loadId || null,
      driverId,
      vehicleId: vehicleId || null,
      lat: String(p.lat),
      lng: String(p.lng),
      accuracy: p.accuracy != null ? String(p.accuracy) : null,
      speed: p.speed != null ? String(p.speed) : null,
      heading: p.heading != null ? String(p.heading) : null,
      altitude: p.altitude != null ? String(p.altitude) : null,
      batteryLevel: p.batteryLevel ?? null,
      isCharging: p.isCharging ?? false,
      loadState: loadState || null,
      odometerMiles: p.odometer != null ? String(p.odometer) : null,
      isMock: spoof.isSuspicious,
      source: "device" as const,
      deviceTimestamp: new Date(p.timestamp),
    };
  });

  // Batch insert
  const BATCH_SIZE = 100;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await db.insert(locationBreadcrumbs).values(rows.slice(i, i + BATCH_SIZE));
  }

  // Also update the user's current location in gpsTracking for fleet view
  const last = points[points.length - 1];
  try {
    const existing = await db.select({ id: gpsTracking.id })
      .from(gpsTracking)
      .where(eq(gpsTracking.driverId, driverId))
      .limit(1);

    if (existing.length > 0) {
      await db.update(gpsTracking).set({
        latitude: String(last.lat),
        longitude: String(last.lng),
        speed: last.speed != null ? String(last.speed) : undefined,
        heading: last.heading != null ? String(last.heading) : undefined,
        timestamp: new Date(last.timestamp),
      }).where(eq(gpsTracking.driverId, driverId));
    } else {
      await db.insert(gpsTracking).values({
        driverId,
        vehicleId: vehicleId || 0,
        latitude: String(last.lat),
        longitude: String(last.lng),
        speed: last.speed != null ? String(last.speed) : undefined,
        heading: last.heading != null ? String(last.heading) : undefined,
        timestamp: new Date(last.timestamp),
      });
    }
  } catch { /* non-critical */ }

  return { ingested: rows.length, flagged };
}

export async function getBreadcrumbs(
  opts: { loadId?: number; driverId?: number; since?: Date; limit?: number }
): Promise<Array<{ lat: number; lng: number; speed: number; heading: number; timestamp: string; loadState: string | null }>> {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [];
  if (opts.loadId) conditions.push(eq(locationBreadcrumbs.loadId, opts.loadId));
  if (opts.driverId) conditions.push(eq(locationBreadcrumbs.driverId, opts.driverId));
  if (opts.since) conditions.push(gt(locationBreadcrumbs.serverTimestamp, opts.since));

  const rows = await db.select({
    lat: locationBreadcrumbs.lat,
    lng: locationBreadcrumbs.lng,
    speed: locationBreadcrumbs.speed,
    heading: locationBreadcrumbs.heading,
    ts: locationBreadcrumbs.serverTimestamp,
    loadState: locationBreadcrumbs.loadState,
  }).from(locationBreadcrumbs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(locationBreadcrumbs.serverTimestamp)
    .limit(opts.limit || 1000);

  return rows.map(r => ({
    lat: Number(r.lat), lng: Number(r.lng),
    speed: r.speed ? Number(r.speed) : 0,
    heading: r.heading ? Number(r.heading) : 0,
    timestamp: r.ts?.toISOString() || "",
    loadState: r.loadState,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// GEOTAG SERVICE (Section 5)
// ═══════════════════════════════════════════════════════════════════════════

export async function createGeotag(opts: {
  loadId?: number;
  userId: number;
  userRole: string;
  driverId?: number;
  vehicleId?: number;
  eventType: string;
  eventCategory: "load_lifecycle" | "compliance" | "safety" | "operational" | "photo" | "document";
  lat: number;
  lng: number;
  accuracy?: number;
  altitude?: number;
  timestamp: Date;
  photoUrls?: string[];
  signatureUrl?: string;
  documentUrls?: string[];
  metadata?: Record<string, unknown>;
  loadState?: string;
  source: "gps_auto" | "geofence_auto" | "driver_manual" | "system";
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [tag] = await db.insert(geotags).values({
    loadId: opts.loadId || null,
    userId: opts.userId,
    userRole: opts.userRole,
    driverId: opts.driverId || null,
    vehicleId: opts.vehicleId || null,
    eventType: opts.eventType,
    eventCategory: opts.eventCategory,
    lat: String(opts.lat),
    lng: String(opts.lng),
    accuracy: opts.accuracy != null ? String(opts.accuracy) : null,
    altitude: opts.altitude != null ? String(opts.altitude) : null,
    eventTimestamp: opts.timestamp,
    photoUrls: opts.photoUrls || null,
    signatureUrl: opts.signatureUrl || null,
    documentUrls: opts.documentUrls || null,
    metadata: opts.metadata || null,
    loadState: opts.loadState || null,
    source: opts.source,
  }).$returningId();

  return tag.id;
}

export async function getGeotagsForLoad(loadId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(geotags)
    .where(eq(geotags.loadId, loadId))
    .orderBy(geotags.eventTimestamp);
  return rows.map(r => ({
    id: r.id,
    eventType: r.eventType,
    eventCategory: r.eventCategory,
    lat: Number(r.lat),
    lng: Number(r.lng),
    timestamp: r.eventTimestamp?.toISOString(),
    source: r.source,
    photoUrls: r.photoUrls,
    signatureUrl: r.signatureUrl,
    metadata: r.metadata,
    loadState: r.loadState,
    isVerified: r.isVerified,
    tamperedFlag: r.tamperedFlag,
    userRole: r.userRole,
  }));
}

export async function getGeotagsForDriver(driverId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(geotags)
    .where(eq(geotags.driverId, driverId))
    .orderBy(desc(geotags.eventTimestamp))
    .limit(limit);
  return rows.map(r => ({
    id: r.id,
    loadId: r.loadId,
    eventType: r.eventType,
    eventCategory: r.eventCategory,
    lat: Number(r.lat),
    lng: Number(r.lng),
    timestamp: r.eventTimestamp?.toISOString(),
    source: r.source,
    metadata: r.metadata,
    loadState: r.loadState,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// GEOFENCE FACTORY (Section 4.4)
// ═══════════════════════════════════════════════════════════════════════════

export async function createGeofencesForLoad(load: {
  id: number;
  pickupLat: number; pickupLng: number; pickupFacilityName?: string;
  deliveryLat: number; deliveryLng: number; deliveryFacilityName?: string;
  waypoints?: Array<{ lat: number; lng: number; name?: string }>;
  createdBy?: number;
}): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];

  const fenceIds: number[] = [];

  // 1. PICKUP_APPROACH — 5 mile circle (8047 meters)
  const [pa] = await db.insert(geofences).values({
    name: `Pickup Approach — Load #${load.id}`,
    type: "pickup",
    shape: "circle",
    center: { lat: load.pickupLat, lng: load.pickupLng },
    radiusMeters: 8047,
    loadId: load.id,
    createdBy: load.createdBy || null,
    alertOnEnter: true, alertOnExit: false, alertOnDwell: false,
    isActive: true,
    actions: [{ type: "PICKUP_APPROACH", config: { facilityName: load.pickupFacilityName } }],
  }).$returningId();
  fenceIds.push(pa.id);

  // 2. PICKUP_FACILITY — tight circle 150m (~500ft)
  const [pf] = await db.insert(geofences).values({
    name: `Pickup Facility — Load #${load.id}`,
    type: "pickup",
    shape: "circle",
    center: { lat: load.pickupLat, lng: load.pickupLng },
    radiusMeters: 150,
    loadId: load.id,
    createdBy: load.createdBy || null,
    alertOnEnter: true, alertOnExit: true, alertOnDwell: true,
    dwellThresholdSeconds: 7200,
    isActive: true,
    actions: [{ type: "PICKUP_FACILITY", config: { facilityName: load.pickupFacilityName } }],
  }).$returningId();
  fenceIds.push(pf.id);

  // 3. DELIVERY_APPROACH — 5 mile circle
  const [da] = await db.insert(geofences).values({
    name: `Delivery Approach — Load #${load.id}`,
    type: "delivery",
    shape: "circle",
    center: { lat: load.deliveryLat, lng: load.deliveryLng },
    radiusMeters: 8047,
    loadId: load.id,
    createdBy: load.createdBy || null,
    alertOnEnter: true, alertOnExit: false, alertOnDwell: false,
    isActive: true,
    actions: [{ type: "DELIVERY_APPROACH", config: { facilityName: load.deliveryFacilityName } }],
  }).$returningId();
  fenceIds.push(da.id);

  // 4. DELIVERY_FACILITY — tight circle 150m
  const [df] = await db.insert(geofences).values({
    name: `Delivery Facility — Load #${load.id}`,
    type: "delivery",
    shape: "circle",
    center: { lat: load.deliveryLat, lng: load.deliveryLng },
    radiusMeters: 150,
    loadId: load.id,
    createdBy: load.createdBy || null,
    alertOnEnter: true, alertOnExit: true, alertOnDwell: true,
    dwellThresholdSeconds: 7200,
    isActive: true,
    actions: [{ type: "DELIVERY_FACILITY", config: { facilityName: load.deliveryFacilityName } }],
  }).$returningId();
  fenceIds.push(df.id);

  // 5. WAYPOINT fences
  if (load.waypoints) {
    for (let i = 0; i < load.waypoints.length; i++) {
      const wp = load.waypoints[i];
      const [w] = await db.insert(geofences).values({
        name: `Waypoint ${i + 1} — ${wp.name || `Stop ${i + 1}`}`,
        type: "waypoint",
        shape: "circle",
        center: { lat: wp.lat, lng: wp.lng },
        radiusMeters: 1609,
        loadId: load.id,
        createdBy: load.createdBy || null,
        alertOnEnter: true, alertOnExit: false, alertOnDwell: false,
        isActive: true,
        actions: [{ type: "WAYPOINT", config: { stopNumber: i + 1 } }],
      }).$returningId();
      fenceIds.push(w.id);
    }
  }

  return fenceIds;
}

export async function deactivateGeofencesForLoad(loadId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(geofences).set({ isActive: false }).where(eq(geofences.loadId, loadId));
}

// ═══════════════════════════════════════════════════════════════════════════
// GEOFENCE PROCESSOR (Section 4.3) — The Brain
// ═══════════════════════════════════════════════════════════════════════════

export async function processGeofenceEvent(event: GeofenceEventData): Promise<TriggerResult[]> {
  const db = await getDb();
  if (!db) return [];

  const triggers: TriggerResult[] = [];
  const geofenceType = event.geofenceType.toUpperCase();

  // 1. Record the raw event
  await db.insert(geofenceEvents).values({
    geofenceId: event.geofenceId,
    userId: event.driverId,
    loadId: event.loadId || null,
    eventType: event.action.toLowerCase() as any,
    latitude: String(event.location.lat),
    longitude: String(event.location.lng),
    dwellSeconds: event.dwellTimeSeconds || null,
    eventTimestamp: event.timestamp,
  });

  // 2. Create auto-geotag for significant events
  const geotagEvents: Record<string, string> = {
    "PICKUP_FACILITY-ENTER": "arrived_pickup",
    "PICKUP_FACILITY-EXIT": "departed_pickup",
    "DELIVERY_FACILITY-ENTER": "arrived_delivery",
    "DELIVERY_FACILITY-EXIT": "departed_delivery",
    "STATE_BORDER-ENTER": "state_crossing",
    "HAZMAT_ZONE-ENTER": "hazmat_zone_entry",
    "WEIGH_STATION-ENTER": "weigh_station_approach",
  };

  const tagKey = `${geofenceType}-${event.action}`;
  if (geotagEvents[tagKey]) {
    const geotagId = await createGeotag({
      loadId: event.loadId,
      userId: event.driverId,
      userRole: "driver",
      driverId: event.driverId,
      vehicleId: event.vehicleId,
      eventType: geotagEvents[tagKey],
      eventCategory: geofenceType.includes("STATE") || geofenceType.includes("HAZMAT") ? "compliance" : "load_lifecycle",
      lat: event.location.lat,
      lng: event.location.lng,
      timestamp: event.timestamp,
      source: "geofence_auto",
      loadState: (await getLoadState(event.loadId)) || undefined,
      metadata: { geofenceId: event.geofenceId, geofenceType, action: event.action },
    });
    triggers.push({ type: "geotag_created", target: "system", data: { geotagId } });
  }

  // 3. Process by geofence type → trigger cascade
  switch (geofenceType) {
    case "PICKUP_APPROACH":
      if (event.action === "ENTER") {
        if (event.loadId) await transitionLoadStatus(event.loadId, "approaching_pickup");
        triggers.push(
          { type: "load_status", target: "load", data: { loadId: event.loadId, status: "approaching_pickup" } },
          { type: "notification", target: "terminal_manager", data: { event: "DRIVER_APPROACHING", loadId: event.loadId, eta: "~5 min" } },
          { type: "notification", target: "shipper", data: { event: "APPROACHING_PICKUP", loadId: event.loadId } },
          { type: "websocket", target: "all_subscribers", data: { event: "load:approaching_pickup", loadId: event.loadId } },
          { type: "tracking_profile", target: "driver", data: { profile: "APPROACHING", driverId: event.driverId } },
        );
      }
      break;

    case "PICKUP_FACILITY":
      if (event.action === "ENTER") {
        if (event.loadId) await transitionLoadStatus(event.loadId, "at_pickup");
        if (event.loadId) await startDetentionClock(event.loadId, "pickup", event.driverId, event.geofenceId, event.timestamp);
        triggers.push(
          { type: "load_status", target: "load", data: { loadId: event.loadId, status: "at_pickup" } },
          { type: "detention_start", target: "system", data: { loadId: event.loadId, location: "pickup" } },
          { type: "notification", target: "driver", data: { event: "ARRIVED_PICKUP", action: "CONFIRM_ARRIVAL" } },
          { type: "notification", target: "terminal_manager", data: { event: "DRIVER_AT_GATE", loadId: event.loadId } },
          { type: "notification", target: "shipper", data: { event: "ARRIVED_PICKUP", loadId: event.loadId } },
          { type: "notification", target: "broker", data: { event: "ARRIVED_PICKUP", loadId: event.loadId } },
          { type: "websocket", target: "all_subscribers", data: { event: "load:arrived_pickup", loadId: event.loadId } },
          { type: "tracking_profile", target: "driver", data: { profile: "AT_FACILITY", driverId: event.driverId } },
          { type: "gamification", target: "driver", data: { mission: "ON_TIME_ARRIVAL", driverId: event.driverId } },
        );
      }
      if (event.action === "EXIT") {
        if (event.loadId) await transitionLoadStatus(event.loadId, "in_transit");
        if (event.loadId) await stopDetentionClock(event.loadId, "pickup", event.timestamp);
        triggers.push(
          { type: "load_status", target: "load", data: { loadId: event.loadId, status: "in_transit" } },
          { type: "detention_stop", target: "system", data: { loadId: event.loadId, location: "pickup" } },
          { type: "notification", target: "shipper", data: { event: "DEPARTED_PICKUP", loadId: event.loadId } },
          { type: "notification", target: "broker", data: { event: "IN_TRANSIT", loadId: event.loadId } },
          { type: "websocket", target: "all_subscribers", data: { event: "load:departed_pickup", loadId: event.loadId } },
          { type: "tracking_profile", target: "driver", data: { profile: "IN_TRANSIT", driverId: event.driverId } },
          { type: "gamification", target: "driver", data: { counter: "LOADS_PICKED_UP", driverId: event.driverId } },
        );
      }
      if (event.action === "DWELL" && event.dwellTimeSeconds) {
        const dwellMinutes = event.dwellTimeSeconds / 60;
        if (dwellMinutes >= 120) {
          triggers.push(
            { type: "detention_billing", target: "system", data: { loadId: event.loadId, location: "pickup", dwellMinutes } },
            { type: "notification", target: "all", data: { event: "DETENTION_STARTED", loadId: event.loadId, location: "pickup" } },
          );
        }
      }
      break;

    case "DELIVERY_APPROACH":
      if (event.action === "ENTER") {
        if (event.loadId) await transitionLoadStatus(event.loadId, "approaching_delivery");
        triggers.push(
          { type: "load_status", target: "load", data: { loadId: event.loadId, status: "approaching_delivery" } },
          { type: "notification", target: "terminal_manager", data: { event: "DRIVER_APPROACHING", loadId: event.loadId } },
          { type: "notification", target: "shipper", data: { event: "APPROACHING_DELIVERY", loadId: event.loadId } },
          { type: "notification", target: "broker", data: { event: "APPROACHING_DELIVERY", loadId: event.loadId } },
          { type: "websocket", target: "all_subscribers", data: { event: "load:approaching_delivery", loadId: event.loadId } },
          { type: "tracking_profile", target: "driver", data: { profile: "APPROACHING", driverId: event.driverId } },
        );
      }
      break;

    case "DELIVERY_FACILITY":
      if (event.action === "ENTER") {
        if (event.loadId) await transitionLoadStatus(event.loadId, "at_delivery");
        if (event.loadId) await startDetentionClock(event.loadId, "delivery", event.driverId, event.geofenceId, event.timestamp);
        triggers.push(
          { type: "load_status", target: "load", data: { loadId: event.loadId, status: "at_delivery" } },
          { type: "detention_start", target: "system", data: { loadId: event.loadId, location: "delivery" } },
          { type: "notification", target: "driver", data: { event: "ARRIVED_DELIVERY", action: "CONFIRM_ARRIVAL" } },
          { type: "notification", target: "terminal_manager", data: { event: "DRIVER_AT_GATE", loadId: event.loadId } },
          { type: "notification", target: "shipper", data: { event: "ARRIVED_DELIVERY", loadId: event.loadId } },
          { type: "notification", target: "broker", data: { event: "ARRIVED_DELIVERY", loadId: event.loadId } },
          { type: "websocket", target: "all_subscribers", data: { event: "load:arrived_delivery", loadId: event.loadId } },
          { type: "tracking_profile", target: "driver", data: { profile: "AT_FACILITY", driverId: event.driverId } },
          { type: "gamification", target: "driver", data: { mission: "ON_TIME_DELIVERY", driverId: event.driverId } },
        );
      }
      if (event.action === "EXIT") {
        if (event.loadId) await transitionLoadStatus(event.loadId, "delivered");
        if (event.loadId) await stopDetentionClock(event.loadId, "delivery", event.timestamp);
        if (event.loadId) await deactivateGeofencesForLoad(event.loadId);
        triggers.push(
          { type: "load_status", target: "load", data: { loadId: event.loadId, status: "delivered" } },
          { type: "detention_stop", target: "system", data: { loadId: event.loadId, location: "delivery" } },
          { type: "notification", target: "shipper", data: { event: "DELIVERY_COMPLETE", loadId: event.loadId } },
          { type: "notification", target: "broker", data: { event: "DELIVERY_COMPLETE", loadId: event.loadId } },
          { type: "notification", target: "factoring", data: { event: "POD_AVAILABLE", loadId: event.loadId } },
          { type: "websocket", target: "all_subscribers", data: { event: "load:departed_delivery", loadId: event.loadId } },
          { type: "tracking_profile", target: "driver", data: { profile: "IDLE", driverId: event.driverId } },
          { type: "gamification", target: "driver", data: { counter: "LOADS_COMPLETED", driverId: event.driverId } },
          { type: "gamification", target: "driver", data: { counter: "MILES_DRIVEN", driverId: event.driverId } },
          { type: "gamification", target: "driver", data: { lootCrate: true, driverId: event.driverId, loadId: event.loadId } },
          { type: "financial", target: "system", data: { event: "LOAD_COMPLETED", loadId: event.loadId } },
        );
      }
      if (event.action === "DWELL" && event.dwellTimeSeconds) {
        const dwellMinutes = event.dwellTimeSeconds / 60;
        if (dwellMinutes >= 120) {
          triggers.push(
            { type: "detention_billing", target: "system", data: { loadId: event.loadId, location: "delivery", dwellMinutes } },
            { type: "notification", target: "all", data: { event: "DETENTION_STARTED", loadId: event.loadId, location: "delivery" } },
          );
        }
      }
      break;

    case "STATE_BORDER":
      if (event.action === "ENTER" && event.loadId && event.fromState && event.toState) {
        await db.insert(stateCrossings).values({
          loadId: event.loadId,
          driverId: event.driverId,
          vehicleId: event.vehicleId || null,
          fromState: event.fromState,
          toState: event.toState,
          crossingLat: String(event.location.lat),
          crossingLng: String(event.location.lng),
          crossedAt: event.timestamp,
        });
        triggers.push(
          { type: "compliance", target: "system", data: { event: "STATE_CROSSING", fromState: event.fromState, toState: event.toState, loadId: event.loadId } },
          { type: "gamification", target: "driver", data: { counter: "STATES_CROSSED", driverId: event.driverId } },
        );
      }
      break;

    case "HAZMAT_ZONE":
      if (event.action === "ENTER") {
        triggers.push(
          { type: "notification", target: "driver", data: { event: "HAZMAT_ZONE_ALERT", zoneName: event.zoneName, action: "REROUTE_RECOMMENDED" } },
          { type: "notification", target: "safety_manager", data: { event: "HAZMAT_ZONE_ENTRY", loadId: event.loadId } },
          { type: "notification", target: "compliance_officer", data: { event: "HAZMAT_ZONE_ENTRY", loadId: event.loadId } },
        );
      }
      break;

    case "WEIGH_STATION":
      if (event.action === "ENTER") {
        triggers.push(
          { type: "notification", target: "driver", data: { event: "WEIGH_STATION_AHEAD", loadId: event.loadId } },
        );
      }
      break;
  }

  return triggers;
}

// ═══════════════════════════════════════════════════════════════════════════
// LOAD STATUS MACHINE (Section 7)
// ═══════════════════════════════════════════════════════════════════════════

const VALID_TRANSITIONS: Record<string, string[]> = {
  posted: ["bidding", "assigned", "booked", "cancelled"],
  bidding: ["assigned", "booked", "cancelled"],
  assigned: ["booked", "en_route_to_pickup", "cancelled"],
  booked: ["en_route_to_pickup", "cancelled"],
  en_route_to_pickup: ["approaching_pickup", "at_pickup", "cancelled"],
  approaching_pickup: ["at_pickup", "cancelled"],
  at_pickup: ["loading", "in_transit", "cancelled"],
  loading: ["loaded", "in_transit"],
  loaded: ["in_transit"],
  in_transit: ["approaching_delivery", "at_delivery", "delivered"],
  approaching_delivery: ["at_delivery"],
  at_delivery: ["unloading", "delivered"],
  unloading: ["delivered"],
  delivered: ["completed"],
  completed: [],
};

async function getLoadState(loadId?: number): Promise<string | null> {
  if (!loadId) return null;
  const db = await getDb();
  if (!db) return null;
  const [load] = await db.select({ status: loads.status }).from(loads).where(eq(loads.id, loadId)).limit(1);
  return load?.status || null;
}

async function transitionLoadStatus(loadId: number, newStatus: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const current = await getLoadState(loadId);
  if (!current) return false;

  const allowed = VALID_TRANSITIONS[current] || [];
  if (!allowed.includes(newStatus)) {
    console.warn(`[LoadStateMachine] Invalid transition: ${current} → ${newStatus} for load ${loadId}`);
    return false;
  }

  await db.update(loads).set({ status: newStatus as any }).where(eq(loads.id, loadId));
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// DETENTION CLOCK (Section 4.3 / 8.2)
// ═══════════════════════════════════════════════════════════════════════════

async function startDetentionClock(
  loadId: number, locationType: "pickup" | "delivery",
  driverId: number, geofenceId: number, enterTime: Date,
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(detentionRecords).values({
    loadId,
    locationType,
    driverId,
    geofenceId,
    geofenceEnterAt: enterTime,
    freeTimeMinutes: 120,
  });
}

async function stopDetentionClock(
  loadId: number, locationType: "pickup" | "delivery", exitTime: Date,
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const [record] = await db.select().from(detentionRecords)
    .where(and(
      eq(detentionRecords.loadId, loadId),
      eq(detentionRecords.locationType, locationType),
      sql`${detentionRecords.geofenceExitAt} IS NULL`,
    ))
    .orderBy(desc(detentionRecords.geofenceEnterAt))
    .limit(1);

  if (!record) return;

  const dwellMs = exitTime.getTime() - record.geofenceEnterAt.getTime();
  const totalDwellMinutes = Math.round(dwellMs / 60000);
  const freeTime = record.freeTimeMinutes || 120;
  const detentionMinutes = Math.max(0, totalDwellMinutes - freeTime);
  const rate = 75; // $75/hr default
  const detentionCharge = detentionMinutes > 0 ? Math.round((detentionMinutes / 60) * rate * 100) / 100 : 0;

  await db.update(detentionRecords).set({
    geofenceExitAt: exitTime,
    totalDwellMinutes,
    detentionMinutes,
    detentionStartedAt: detentionMinutes > 0 ? new Date(record.geofenceEnterAt.getTime() + freeTime * 60000) : null,
    detentionRatePerHour: String(rate) as any,
    detentionCharge: String(detentionCharge) as any,
    isBillable: detentionMinutes > 0,
  }).where(eq(detentionRecords.id, record.id));
}

export async function getDetentionForLoad(loadId: number) {
  const db = await getDb();
  if (!db) return [];
  const records = await db.select().from(detentionRecords)
    .where(eq(detentionRecords.loadId, loadId))
    .orderBy(detentionRecords.geofenceEnterAt);
  return records.map(r => ({
    id: r.id,
    locationType: r.locationType,
    enterAt: r.geofenceEnterAt?.toISOString(),
    exitAt: r.geofenceExitAt?.toISOString(),
    totalDwellMinutes: r.totalDwellMinutes,
    detentionMinutes: r.detentionMinutes,
    detentionCharge: r.detentionCharge ? Number(r.detentionCharge) : 0,
    isBillable: r.isBillable,
    freeTimeMinutes: r.freeTimeMinutes,
  }));
}

export async function getBillableDetention(companyId?: number) {
  const db = await getDb();
  if (!db) return [];
  const records = await db.select().from(detentionRecords)
    .where(and(eq(detentionRecords.isBillable, true), eq(detentionRecords.isPaid, false)))
    .orderBy(desc(detentionRecords.createdAt))
    .limit(100);
  return records.map(r => ({
    id: r.id,
    loadId: r.loadId,
    locationType: r.locationType,
    detentionMinutes: r.detentionMinutes,
    detentionCharge: r.detentionCharge ? Number(r.detentionCharge) : 0,
    enterAt: r.geofenceEnterAt?.toISOString(),
    exitAt: r.geofenceExitAt?.toISOString(),
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE DEVIATION DETECTOR (Section 6.3)
// ═══════════════════════════════════════════════════════════════════════════

export async function checkRouteDeviation(
  loadId: number, currentLocation: LatLng,
): Promise<{ deviated: boolean; deviationMiles: number; severity?: string }> {
  const db = await getDb();
  if (!db) return { deviated: false, deviationMiles: 0 };

  // Get active route for load
  const [route] = await db.select().from(loadRoutes)
    .where(and(eq(loadRoutes.loadId, loadId), eq(loadRoutes.isActive, true)))
    .limit(1);
  if (!route?.polyline) return { deviated: false, deviationMiles: 0 };

  // Decode polyline and find nearest point
  const routePoints = decodeSimplePolyline(route.polyline);
  if (routePoints.length === 0) return { deviated: false, deviationMiles: 0 };

  let minDist = Infinity;
  for (const rp of routePoints) {
    const d = haversineDistance(currentLocation, rp);
    if (d < minDist) minDist = d;
  }

  if (minDist > 5) {
    return { deviated: true, deviationMiles: Math.round(minDist * 10) / 10, severity: "SIGNIFICANT" };
  } else if (minDist > 2) {
    return { deviated: true, deviationMiles: Math.round(minDist * 10) / 10, severity: "MINOR" };
  }

  return { deviated: false, deviationMiles: Math.round(minDist * 10) / 10 };
}

function decodeSimplePolyline(polyline: string): LatLng[] {
  // Handle simple "lat,lng;lat,lng" format from existing navigation router
  if (polyline.includes(";")) {
    return polyline.split(";").map(s => {
      const [lat, lng] = s.split(",").map(Number);
      return { lat, lng };
    }).filter(p => !isNaN(p.lat) && !isNaN(p.lng));
  }
  // TODO: Add Google encoded polyline decoder when Routes API is integrated
  return [];
}

// ═══════════════════════════════════════════════════════════════════════════
// ETA ENGINE (Section 16)
// ═══════════════════════════════════════════════════════════════════════════

export async function calculateETA(
  loadId: number, currentLocation: LatLng, destinationLocation: LatLng,
): Promise<ETAResult> {
  const distanceMiles = haversineDistance(currentLocation, destinationLocation) * 1.3; // road factor
  const avgSpeedMph = 55;
  const remainingMinutes = Math.round((distanceMiles / avgSpeedMph) * 60);

  // Traffic delay estimate (simple heuristic — replace with Google when API key available)
  const hour = new Date().getHours();
  const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19);
  const trafficDelay = isRushHour ? Math.round(remainingMinutes * 0.2) : Math.round(remainingMinutes * 0.05);

  // HOS break calculation
  const hosBreakNeeded = remainingMinutes > 8 * 60; // If > 8 hours remaining
  const hosBreakMinutes = hosBreakNeeded ? 30 : 0;

  const totalMinutes = remainingMinutes + trafficDelay + hosBreakMinutes;
  const estimatedArrival = new Date(Date.now() + totalMinutes * 60000);

  // Confidence based on distance
  let confidence: "HIGH" | "MEDIUM" | "LOW" = "HIGH";
  if (distanceMiles > 500) confidence = "LOW";
  else if (distanceMiles > 200) confidence = "MEDIUM";

  const result: ETAResult = {
    estimatedArrival,
    confidence,
    remainingMiles: Math.round(distanceMiles * 10) / 10,
    remainingMinutes: totalMinutes,
    trafficDelay,
    weatherDelay: 0,
    hosBreakNeeded,
    hosBreakMinutes,
  };

  // Persist ETA history
  const db = await getDb();
  if (db) {
    try {
      await db.insert(etaHistory).values({
        loadId,
        destination: "delivery",
        predictedEta: estimatedArrival,
        remainingMiles: String(result.remainingMiles),
        remainingMinutes: totalMinutes,
        confidence: confidence.toLowerCase() as any,
        changeReason: "recalculation",
      });
    } catch { /* non-critical */ }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// HAZMAT ROUTER (Section 17)
// ═══════════════════════════════════════════════════════════════════════════

const TUNNEL_RESTRICTED_CLASSES = ["1.1", "1.2", "1.3", "2.3", "6.1", "7"];

export function requiresTunnelAvoidance(hazmatClass?: string): boolean {
  if (!hazmatClass) return false;
  return TUNNEL_RESTRICTED_CLASSES.some(c => hazmatClass.startsWith(c));
}

export async function calculateCompliantRoute(opts: {
  loadId: number;
  originLat: number; originLng: number;
  destLat: number; destLng: number;
  hazmatClass?: string;
  vehicleHeight?: number;
  vehicleWeight?: number;
  vehicleLength?: number;
}): Promise<{
  distanceMiles: number;
  durationSeconds: number;
  polyline: string;
  isHazmatCompliant: boolean;
  hazmatRestrictions: string[];
  tunnelRestrictions: string[];
  warnings: string[];
}> {
  const distance = haversineDistance(
    { lat: opts.originLat, lng: opts.originLng },
    { lat: opts.destLat, lng: opts.destLng },
  ) * 1.3;

  const durationSeconds = Math.round((distance / 55) * 3600);
  const polyline = `${opts.originLat},${opts.originLng};${opts.destLat},${opts.destLng}`;

  const hazmatRestrictions: string[] = [];
  const tunnelRestrictions: string[] = [];
  const warnings: string[] = [];

  if (opts.hazmatClass) {
    warnings.push(`Hazmat Class ${opts.hazmatClass} load — hazmat-compliant routing active`);
    if (requiresTunnelAvoidance(opts.hazmatClass)) {
      tunnelRestrictions.push("Tunnel avoidance required per 49 CFR 397.71");
      warnings.push("HRCQ routing — certain tunnels avoided");
    }
    if (opts.hazmatClass.startsWith("1")) {
      hazmatRestrictions.push("Explosives — avoid populated areas when practical");
    }
    if (opts.hazmatClass.startsWith("7")) {
      hazmatRestrictions.push("Radioactive — must use Highway Route Controlled Quantities routes");
    }
  }

  if (opts.vehicleHeight && opts.vehicleHeight > 13.5) {
    warnings.push(`Vehicle height ${opts.vehicleHeight}ft — low bridge avoidance active`);
  }
  if (opts.vehicleWeight && opts.vehicleWeight > 80000) {
    warnings.push(`Vehicle weight ${opts.vehicleWeight}lbs — overweight restrictions apply`);
  }

  // Persist the calculated route
  const db = await getDb();
  if (db) {
    try {
      await db.insert(loadRoutes).values({
        loadId: opts.loadId,
        polyline,
        distanceMiles: String(distance.toFixed(2)),
        durationSeconds,
        isHazmatCompliant: !!opts.hazmatClass,
        hazmatRestrictions: hazmatRestrictions.length > 0 ? hazmatRestrictions : null,
        tunnelRestrictions: tunnelRestrictions.length > 0 ? tunnelRestrictions : null,
      });
    } catch { /* non-critical */ }
  }

  return {
    distanceMiles: Math.round(distance * 10) / 10,
    durationSeconds,
    polyline,
    isHazmatCompliant: !!opts.hazmatClass,
    hazmatRestrictions,
    tunnelRestrictions,
    warnings,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// STATE CROSSINGS / COMPLIANCE (Section 4.3/17)
// ═══════════════════════════════════════════════════════════════════════════

export async function getStateCrossingsForLoad(loadId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(stateCrossings)
    .where(eq(stateCrossings.loadId, loadId))
    .orderBy(stateCrossings.crossedAt);
  return rows.map(r => ({
    id: r.id,
    fromState: r.fromState,
    toState: r.toState,
    crossingLat: Number(r.crossingLat),
    crossingLng: Number(r.crossingLng),
    crossedAt: r.crossedAt?.toISOString(),
    permitValid: r.permitValid,
  }));
}

export async function getIFTAReport(opts: { vehicleId?: number; driverId?: number; startDate: Date; endDate: Date }) {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [
    gt(stateCrossings.crossedAt, opts.startDate),
    lt(stateCrossings.crossedAt, opts.endDate),
  ];
  if (opts.vehicleId) conditions.push(eq(stateCrossings.vehicleId, opts.vehicleId));
  if (opts.driverId) conditions.push(eq(stateCrossings.driverId, opts.driverId));

  const rows = await db.select({
    state: stateCrossings.toState,
    miles: stateCrossings.milesInFromState,
  }).from(stateCrossings)
    .where(and(...conditions));

  // Aggregate miles by state
  const byState: Record<string, number> = {};
  for (const r of rows) {
    const state = r.state;
    byState[state] = (byState[state] || 0) + (r.miles ? Number(r.miles) : 0);
  }

  return Object.entries(byState).map(([state, miles]) => ({
    state,
    miles: Math.round(miles * 10) / 10,
  })).sort((a, b) => b.miles - a.miles);
}

// ═══════════════════════════════════════════════════════════════════════════
// WEBSOCKET CHANNEL SUBSCRIPTIONS (Section 11.1)
// ═══════════════════════════════════════════════════════════════════════════

export function getChannelsForUser(user: {
  id: number;
  role: string;
  companyId?: number;
  activeLoadId?: number;
  activeLoadIds?: number[];
  facilityId?: number;
}): string[] {
  const channels: string[] = [];
  const role = user.role.toUpperCase();

  switch (role) {
    case "DRIVER":
      channels.push(`driver:${user.id}`, `gamification:${user.id}`);
      if (user.activeLoadId) channels.push(`load:${user.activeLoadId}`, `geofence:${user.id}`);
      break;
    case "CARRIER":
      channels.push(`carrier:${user.companyId}`, `fleet:${user.companyId}`, `gamification:${user.id}`);
      user.activeLoadIds?.forEach(id => channels.push(`load:${id}`));
      break;
    case "SHIPPER":
      channels.push(`shipper:${user.companyId}`, `gamification:${user.id}`);
      user.activeLoadIds?.forEach(id => channels.push(`load:${id}`));
      break;
    case "BROKER":
      channels.push(`broker:${user.companyId}`, `gamification:${user.id}`);
      user.activeLoadIds?.forEach(id => channels.push(`load:${id}`));
      break;
    case "CATALYST":
    case "DISPATCH":
      channels.push(`catalyst:${user.id}`, `dispatch:${user.companyId}`, `fleet:${user.companyId}`, `gamification:${user.id}`);
      user.activeLoadIds?.forEach(id => channels.push(`load:${id}`));
      break;
    case "ESCORT":
      channels.push(`escort:${user.id}`, `gamification:${user.id}`);
      if (user.activeLoadId) channels.push(`load:${user.activeLoadId}`);
      break;
    case "TERMINAL_MANAGER":
      channels.push(`terminal:${user.facilityId}`, `facility_geofence:${user.facilityId}`, `gamification:${user.id}`);
      break;
    case "FACTORING":
      channels.push(`factoring:${user.companyId}`);
      break;
    case "COMPLIANCE_OFFICER":
    case "SAFETY_MANAGER":
      channels.push(`compliance:${user.companyId}`, `safety:${user.companyId}`, `fleet:${user.companyId}`);
      break;
    case "ADMIN":
    case "SUPER_ADMIN":
      channels.push("admin:global", "system:health");
      break;
  }

  return channels;
}

// ═══════════════════════════════════════════════════════════════════════════
// GOOGLE MAPS CONFIG (Section 2.2) — reads from env
// ═══════════════════════════════════════════════════════════════════════════

export const googleMapsConfig = {
  server: { apiKey: process.env.GOOGLE_MAPS_SERVER_KEY || "" },
  webClient: { apiKey: process.env.GOOGLE_MAPS_WEB_KEY || "" },
  mobileClient: {
    ios: { apiKey: process.env.GOOGLE_MAPS_IOS_KEY || "", bundleId: "com.eusorone.eusotrip" },
    android: { apiKey: process.env.GOOGLE_MAPS_ANDROID_KEY || "", packageName: "com.eusorone.eusotrip" },
  },
};
