/**
 * LOCATION ROUTER — Complete GPS, Navigation, Geofencing & Location Intelligence
 * tRPC router implementing Section 14 of the EusoMap spec.
 *
 * Sub-routers:
 *   telemetry  — GPS ingestion, fleet positions, breadcrumb trails
 *   geofences  — CRUD, auto-creation for loads, event queries
 *   geotags    — Immutable audit trail creation + queries
 *   navigation — Route calculation, ETA, hazmat compliance, deviation
 *   tracking   — Consumer-facing: active loads, load tracking, fleet/dispatch/terminal maps
 *   detention  — Detention clock records, billable detention
 *   compliance — State crossings, IFTA reports, route deviations, hazmat zone logs
 */

import { z } from "zod";
import { eq, and, desc, sql, gt, lt } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import {
  locationBreadcrumbs, geotags, loadRoutes, detentionRecords, stateCrossings,
  geofences, geofenceEvents, loads, users, vehicles, gpsTracking, etaHistory,
} from "../../drizzle/schema";
import {
  ingestBreadcrumbs, getBreadcrumbs, createGeotag, getGeotagsForLoad,
  getGeotagsForDriver, createGeofencesForLoad, deactivateGeofencesForLoad,
  processGeofenceEvent, calculateETA, calculateCompliantRoute,
  checkRouteDeviation, getDetentionForLoad, getBillableDetention,
  getStateCrossingsForLoad, getIFTAReport, haversineDistance,
  getChannelsForUser, googleMapsConfig, detectSpoofing,
  requiresTunnelAvoidance, pruneStaleSignalLossEntries,
} from "../_core/locationEngine";
import type { GeofenceAction, TriggerResult } from "../_core/locationEngine";

// ═══════════════════════════════════════════════════════════════════════════
// INPUT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

const latLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const locationPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  timestamp: z.string(),
  speed: z.number().optional(),
  heading: z.number().optional(),
  accuracy: z.number().optional(),
  altitude: z.number().optional(),
  batteryLevel: z.number().optional(),
  isCharging: z.boolean().optional(),
  odometer: z.number().optional(),
  activity: z.string().optional(),
  isMock: z.boolean().optional(),
});

// ═══════════════════════════════════════════════════════════════════════════
// GEOFENCE TRIGGER NOTIFICATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const TRIGGER_TITLES: Record<string, string> = {
  DRIVER_APPROACHING: "Driver Approaching",
  DRIVER_AT_GATE: "Driver at Gate",
  ARRIVED_PICKUP: "Arrived at Pickup",
  ARRIVED_DELIVERY: "Arrived at Delivery",
  DEPARTED_PICKUP: "Departed Pickup",
  DEPARTED_DELIVERY: "Departed Delivery",
  IN_TRANSIT: "Load In Transit",
  DELIVERY_COMPLETE: "Delivery Complete",
  APPROACHING_PICKUP: "Approaching Pickup",
  APPROACHING_DELIVERY: "Approaching Delivery",
  DETENTION_STARTED: "Detention Started",
  DETAINED_ALERT: "Detention Alert",
  POD_AVAILABLE: "POD Available",
  COMPLIANCE_ALERT: "Compliance Alert",
};

function formatTriggerTitle(eventName: string, loadNumber: string): string {
  const base = TRIGGER_TITLES[eventName] || eventName.replace(/_/g, " ");
  return loadNumber ? `${base} — ${loadNumber}` : base;
}

function formatTriggerMessage(eventName: string, loadNumber: string, facilityName?: string): string {
  const facility = facilityName ? ` at ${facilityName}` : "";
  switch (eventName) {
    case "DRIVER_APPROACHING": return `Driver is approaching${facility} for load ${loadNumber}.`;
    case "DRIVER_AT_GATE": return `Driver has arrived at the gate${facility} for load ${loadNumber}.`;
    case "ARRIVED_PICKUP": return `Driver arrived at pickup${facility} for load ${loadNumber}.`;
    case "ARRIVED_DELIVERY": return `Driver arrived at delivery${facility} for load ${loadNumber}.`;
    case "DEPARTED_PICKUP": return `Load ${loadNumber} departed pickup${facility} and is now in transit.`;
    case "DEPARTED_DELIVERY": return `Load ${loadNumber} departed delivery${facility}.`;
    case "DELIVERY_COMPLETE": return `Load ${loadNumber} has been delivered${facility}.`;
    case "APPROACHING_PICKUP": return `Driver approaching pickup${facility} for load ${loadNumber}.`;
    case "APPROACHING_DELIVERY": return `Driver approaching delivery${facility} for load ${loadNumber}.`;
    case "DETENTION_STARTED": return `Detention billing has started${facility} for load ${loadNumber}.`;
    case "DETAINED_ALERT": return `Detention alert${facility} for load ${loadNumber} — free time expiring.`;
    case "IN_TRANSIT": return `Load ${loadNumber} is now in transit.`;
    case "POD_AVAILABLE": return `Proof of delivery is available for load ${loadNumber}.`;
    case "COMPLIANCE_ALERT": return `Compliance alert for load ${loadNumber}.`;
    default: return `Geofence event "${eventName}" for load ${loadNumber}${facility}.`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PER-DRIVER GPS BATCH RATE LIMITING
// ═══════════════════════════════════════════════════════════════════════════

/** Track last batch timestamp per driverId for rate limiting (2s cooldown) */
const _gpsBatchLastTs = new Map<number, number>();
const GPS_BATCH_COOLDOWN_MS = 2_000;
const GPS_BATCH_STALE_MS = 60_000;

/** Piggyback cleanup: remove entries older than 60s on each request */
function _pruneGpsBatchRateMap() {
  const cutoff = Date.now() - GPS_BATCH_STALE_MS;
  for (const [key, ts] of Array.from(_gpsBatchLastTs)) {
    if (ts < cutoff) _gpsBatchLastTs.delete(key);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TELEMETRY SUB-ROUTER (GPS ingestion, fleet positions, breadcrumb trails)
// ═══════════════════════════════════════════════════════════════════════════

const telemetrySubRouter = router({
  // Batch GPS point ingestion — called by mobile/ELD devices
  locationBatch: protectedProcedure
    .input(z.object({
      locations: z.array(locationPointSchema).min(1).max(200),
      loadId: z.number().optional(),
      vehicleId: z.number().optional(),
      loadState: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const driverId = ctx.user?.id;
      if (!driverId) throw new Error("Not authenticated");

      // Per-driver rate limiting: skip if batch submitted within last 2s
      const numericDriverId = Number(driverId);
      const now = Date.now();
      _pruneGpsBatchRateMap();
      const lastTs = _gpsBatchLastTs.get(numericDriverId);
      if (lastTs && now - lastTs < GPS_BATCH_COOLDOWN_MS) {
        // Silently skip — GPS clients retry anyway
        return { inserted: 0, skipped: input.locations.length, rateLimited: true };
      }
      _gpsBatchLastTs.set(numericDriverId, now);

      const result = await ingestBreadcrumbs(
        Number(driverId), input.locations,
        input.loadId, input.vehicleId, input.loadState,
      );

      // Prune stale signalLossMap entries to prevent memory leaks (throttled to once/hour)
      pruneStaleSignalLossEntries();

      // P0 Blocker 8: Emit real-time GPS tracking event after storing
      try {
        const { emitTrackingEvent } = await import("../_core/websocket");
        const companyId = (ctx.user as any)?.companyId ? Number((ctx.user as any).companyId) : undefined;
        emitTrackingEvent({
          driverId: Number(driverId),
          companyId,
          vehicleId: input.vehicleId,
          loadId: input.loadId,
          positions: input.locations.map(loc => ({
            lat: loc.lat, lng: loc.lng,
            speed: loc.speed, heading: loc.heading,
            timestamp: loc.timestamp,
          })),
        });
      } catch (wsErr) {
        logger.warn("[Location] GPS tracking event emit failed:", (wsErr as any)?.message);
      }

      return result;
    }),

  // Single geofence event from mobile device
  geofenceEvent: protectedProcedure
    .input(z.object({
      geofenceId: z.number(),
      action: z.enum(["ENTER", "EXIT", "DWELL"]),
      location: latLngSchema,
      timestamp: z.string(),
      loadId: z.number().optional(),
      dwellTimeSeconds: z.number().optional(),
      geofenceType: z.string().optional(),
      facilityName: z.string().optional(),
      fromState: z.string().optional(),
      toState: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const driverId = ctx.user?.id;
      if (!driverId) throw new Error("Not authenticated");

      const triggers = await processGeofenceEvent({
        geofenceId: input.geofenceId,
        geofenceType: input.geofenceType || "CUSTOM",
        action: input.action as GeofenceAction,
        loadId: input.loadId,
        driverId: Number(driverId),
        location: input.location,
        timestamp: new Date(input.timestamp),
        dwellTimeSeconds: input.dwellTimeSeconds,
        facilityName: input.facilityName,
        fromState: input.fromState,
        toState: input.toState,
      });

      // Standard load:geofence_enter / load:geofence_exit events
      if (input.loadId && (input.action === "ENTER" || input.action === "EXIT")) {
        try {
          const { wsService, WS_EVENTS, WS_CHANNELS } = await import("../_core/websocket");
          const ch = WS_CHANNELS.LOAD(String(input.loadId));
          const evtType = input.action === "ENTER" ? WS_EVENTS.LOAD_GEOFENCE_ENTER : WS_EVENTS.LOAD_GEOFENCE_EXIT;
          wsService.broadcastToChannel(ch, { type: evtType, data: { loadId: String(input.loadId), geofenceId: input.geofenceId, geofenceType: input.geofenceType || "CUSTOM", facilityName: input.facilityName, lat: input.location.lat, lng: input.location.lng, timestamp: input.timestamp }, timestamp: input.timestamp });
        } catch { /* non-critical */ }
      }

      // ─── Consume TriggerResult[] → dispatch WebSocket notifications ───
      if (triggers.length > 0) {
        try {
          const { wsService, emitLoadStatusChange, emitNotification, WS_EVENTS, WS_CHANNELS } = await import("../_core/websocket");
          const now = new Date().toISOString();

          // Fetch load context (shipperId, catalystId, loadNumber) for routing notifications
          let shipperId: number | null = null;
          let catalystId: number | null = null;
          let loadNumber: string | null = null;
          if (input.loadId) {
            try {
              const db = await getDb();
              if (db) {
                const [loadRow] = await db.select({
                  shipperId: loads.shipperId,
                  catalystId: loads.catalystId,
                  loadNumber: loads.loadNumber,
                }).from(loads).where(eq(loads.id, input.loadId)).limit(1);
                if (loadRow) {
                  shipperId = loadRow.shipperId;
                  catalystId = loadRow.catalystId;
                  loadNumber = loadRow.loadNumber;
                }
              }
            } catch { /* non-critical — we'll still emit what we can */ }
          }

          const loadIdStr = input.loadId ? String(input.loadId) : "";
          const loadNumStr = loadNumber || loadIdStr;

          for (const trigger of triggers) {
            const eventName = String(trigger.data?.event || trigger.type);

            // ── load_status triggers → emitLoadStatusChange ──
            if (trigger.type === "load_status" && input.loadId) {
              const newStatus = String(trigger.data?.status || "");
              emitLoadStatusChange({
                loadId: loadIdStr,
                loadNumber: loadNumStr,
                previousStatus: "",
                newStatus,
                location: { lat: input.location.lat, lng: input.location.lng },
                timestamp: now,
                updatedBy: String(driverId),
              });
              continue;
            }

            // ── notification triggers → route to appropriate channels ──
            if (trigger.type === "notification") {
              const priority = (
                eventName === "DETENTION_STARTED" || eventName === "DETAINED_ALERT"
              ) ? "critical" as const : (
                eventName === "ARRIVED_PICKUP" || eventName === "ARRIVED_DELIVERY"
                || eventName === "DELIVERY_COMPLETE"
              ) ? "high" as const : "medium" as const;

              const notifPayload = {
                id: `geo-${input.geofenceId}-${Date.now()}`,
                type: eventName,
                title: formatTriggerTitle(eventName, loadNumStr),
                message: formatTriggerMessage(eventName, loadNumStr, input.facilityName),
                priority,
                data: { ...trigger.data, loadId: loadIdStr, geofenceType: input.geofenceType },
                actionUrl: input.loadId ? `/loads/${input.loadId}` : undefined,
                timestamp: now,
              };

              // DRIVER_APPROACHING → dispatch only
              if (eventName === "DRIVER_APPROACHING" || eventName === "DRIVER_AT_GATE") {
                if (catalystId) {
                  wsService.broadcastToChannel(
                    WS_CHANNELS.DISPATCH(String(catalystId)),
                    { type: WS_EVENTS.NOTIFICATION_NEW, data: notifPayload, timestamp: now },
                  );
                }
                wsService.broadcastToChannel(
                  WS_CHANNELS.DISPATCH_UPDATES,
                  { type: WS_EVENTS.NOTIFICATION_NEW, data: notifPayload, timestamp: now },
                );
              }

              // ARRIVED_PICKUP / ARRIVED_DELIVERY → load room + dispatch
              if (eventName === "ARRIVED_PICKUP" || eventName === "ARRIVED_DELIVERY") {
                if (input.loadId) {
                  wsService.broadcastToChannel(
                    WS_CHANNELS.LOAD(loadIdStr),
                    { type: WS_EVENTS.NOTIFICATION_NEW, data: notifPayload, timestamp: now },
                  );
                }
                if (catalystId) {
                  wsService.broadcastToChannel(
                    WS_CHANNELS.DISPATCH(String(catalystId)),
                    { type: WS_EVENTS.NOTIFICATION_NEW, data: notifPayload, timestamp: now },
                  );
                }
              }

              // DETENTION_STARTED / DETAINED_ALERT → load room + dispatch + shipper
              if (eventName === "DETENTION_STARTED" || eventName === "DETAINED_ALERT") {
                if (input.loadId) {
                  wsService.broadcastToChannel(
                    WS_CHANNELS.LOAD(loadIdStr),
                    { type: WS_EVENTS.NOTIFICATION_NEW, data: notifPayload, timestamp: now },
                  );
                }
                if (catalystId) {
                  wsService.broadcastToChannel(
                    WS_CHANNELS.DISPATCH(String(catalystId)),
                    { type: WS_EVENTS.NOTIFICATION_NEW, data: notifPayload, timestamp: now },
                  );
                }
                if (shipperId) {
                  wsService.broadcastToChannel(
                    WS_CHANNELS.COMPANY(String(shipperId)),
                    { type: WS_EVENTS.NOTIFICATION_NEW, data: notifPayload, timestamp: now },
                  );
                }
              }

              // DEPARTED_PICKUP / IN_TRANSIT / DEPARTED_DELIVERY / DELIVERY_COMPLETE
              // APPROACHING_PICKUP / APPROACHING_DELIVERY → load room + shipper + dispatch
              if (
                eventName === "DEPARTED_PICKUP" || eventName === "IN_TRANSIT"
                || eventName === "DEPARTED_DELIVERY" || eventName === "DELIVERY_COMPLETE"
                || eventName === "APPROACHING_PICKUP" || eventName === "APPROACHING_DELIVERY"
              ) {
                if (input.loadId) {
                  wsService.broadcastToChannel(
                    WS_CHANNELS.LOAD(loadIdStr),
                    { type: WS_EVENTS.NOTIFICATION_NEW, data: notifPayload, timestamp: now },
                  );
                }
                if (shipperId) {
                  wsService.broadcastToChannel(
                    WS_CHANNELS.COMPANY(String(shipperId)),
                    { type: WS_EVENTS.NOTIFICATION_NEW, data: notifPayload, timestamp: now },
                  );
                }
                if (catalystId) {
                  wsService.broadcastToChannel(
                    WS_CHANNELS.DISPATCH(String(catalystId)),
                    { type: WS_EVENTS.NOTIFICATION_NEW, data: notifPayload, timestamp: now },
                  );
                }
              }

              // POD_AVAILABLE → target is factoring, broadcast to load channel
              if (eventName === "POD_AVAILABLE" && input.loadId) {
                wsService.broadcastToChannel(
                  WS_CHANNELS.LOAD(loadIdStr),
                  { type: WS_EVENTS.NOTIFICATION_NEW, data: notifPayload, timestamp: now },
                );
              }

              // COMPLIANCE_ALERT → driver + dispatch
              if (eventName === "COMPLIANCE_ALERT") {
                emitNotification(String(driverId), notifPayload);
                if (catalystId) {
                  wsService.broadcastToChannel(
                    WS_CHANNELS.DISPATCH(String(catalystId)),
                    { type: WS_EVENTS.NOTIFICATION_NEW, data: notifPayload, timestamp: now },
                  );
                }
              }

              // target=all → load room + dispatch + shipper
              if (trigger.target === "all" && input.loadId) {
                wsService.broadcastToChannel(
                  WS_CHANNELS.LOAD(loadIdStr),
                  { type: WS_EVENTS.NOTIFICATION_NEW, data: notifPayload, timestamp: now },
                );
                if (catalystId) {
                  wsService.broadcastToChannel(
                    WS_CHANNELS.DISPATCH(String(catalystId)),
                    { type: WS_EVENTS.NOTIFICATION_NEW, data: notifPayload, timestamp: now },
                  );
                }
                if (shipperId) {
                  wsService.broadcastToChannel(
                    WS_CHANNELS.COMPANY(String(shipperId)),
                    { type: WS_EVENTS.NOTIFICATION_NEW, data: notifPayload, timestamp: now },
                  );
                }
              }

              continue;
            }

            // ── websocket triggers → broadcast to load room ──
            if (trigger.type === "websocket" && input.loadId) {
              wsService.broadcastToChannel(
                WS_CHANNELS.LOAD(loadIdStr),
                {
                  type: String(trigger.data?.event || "load:geofence_event") as import("@shared/websocket-events").WSEventType,
                  data: { loadId: loadIdStr, ...trigger.data },
                  timestamp: now,
                },
              );
              continue;
            }

            // ── compliance triggers → compliance alerts channel ──
            if (trigger.type === "compliance" && input.loadId) {
              wsService.broadcastToChannel(
                WS_CHANNELS.COMPLIANCE_ALERTS,
                {
                  type: WS_EVENTS.COMPLIANCE_ALERT,
                  data: { loadId: loadIdStr, ...trigger.data },
                  timestamp: now,
                },
              );
              continue;
            }

            // ── detention_billing triggers → dispatch + shipper ──
            if (trigger.type === "detention_billing" && input.loadId) {
              const detentionPayload = {
                type: WS_EVENTS.DISPATCH_EXCEPTION,
                data: {
                  exception: "detention_billing",
                  loadId: loadIdStr,
                  loadNumber: loadNumStr,
                  ...trigger.data,
                },
                timestamp: now,
              };
              if (catalystId) {
                wsService.broadcastToChannel(
                  WS_CHANNELS.DISPATCH(String(catalystId)),
                  detentionPayload,
                );
              }
              if (shipperId) {
                wsService.broadcastToChannel(
                  WS_CHANNELS.COMPANY(String(shipperId)),
                  detentionPayload,
                );
              }
              continue;
            }

            // Other trigger types (geotag_created, tracking_profile, gamification,
            // financial, signal_loss_suppressed, detention_start/stop) are internal —
            // no WebSocket dispatch needed for these.
          }
        } catch (triggerErr) {
          logger.warn("[Location] Geofence trigger dispatch failed:", (triggerErr as any)?.message);
        }
      }

      return { success: true, triggersCount: triggers.length, triggers };
    }),

  // Get fleet locations (all active vehicles for company)
  getFleetLocations: protectedProcedure
    .input(z.object({ companyId: z.number().optional() }).optional())
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const companyId = ctx.user?.companyId;
      if (!companyId) return [];

      const vehicleList = await db.select().from(vehicles)
        .where(eq(vehicles.companyId, companyId)).limit(100);

      const positions: Array<{
        vehicleId: number; driverId: number | null; lat: number; lng: number;
        speed: number; heading: number; loadId: number | null; loadNumber: string | null;
        driverName: string; status: string; updatedAt: string;
      }> = [];

      for (const v of vehicleList) {
        const [gps] = await db.select().from(gpsTracking)
          .where(eq(gpsTracking.vehicleId, v.id))
          .orderBy(desc(gpsTracking.timestamp)).limit(1);
        if (!gps) continue;

        let driverName = "Unassigned";
        let loadNumber: string | null = null;
        let loadId: number | null = null;

        const [activeLoad] = await db.select({
          id: loads.id, loadNumber: loads.loadNumber, driverId: loads.driverId,
        }).from(loads)
          .where(and(eq(loads.vehicleId, v.id), eq(loads.status, "in_transit" as any)))
          .limit(1);

        if (activeLoad?.driverId) {
          const [driver] = await db.select({ name: users.name }).from(users)
            .where(eq(users.id, activeLoad.driverId)).limit(1);
          if (driver) driverName = driver.name || "Driver";
          loadNumber = activeLoad.loadNumber;
          loadId = activeLoad.id;
        }

        positions.push({
          vehicleId: v.id,
          driverId: gps.driverId,
          lat: Number(gps.latitude),
          lng: Number(gps.longitude),
          speed: Number(gps.speed) || 0,
          heading: Number(gps.heading) || 0,
          loadId,
          loadNumber,
          driverName,
          status: Number(gps.speed) > 5 ? "moving" : "stopped",
          updatedAt: gps.timestamp?.toISOString() || "",
        });
      }
      return positions;
    }),

  // Get current location for a specific load
  getLoadLocation: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [load] = await db.select({ driverId: loads.driverId, status: loads.status })
        .from(loads).where(eq(loads.id, input.loadId)).limit(1);
      if (!load?.driverId) return null;

      const [gps] = await db.select().from(gpsTracking)
        .where(eq(gpsTracking.driverId, load.driverId))
        .orderBy(desc(gpsTracking.timestamp)).limit(1);
      if (!gps) return null;

      return {
        lat: Number(gps.latitude),
        lng: Number(gps.longitude),
        speed: Number(gps.speed) || 0,
        heading: Number(gps.heading) || 0,
        updatedAt: gps.timestamp?.toISOString() || "",
        loadStatus: load.status,
      };
    }),

  // Get full breadcrumb trail for a load
  getLoadBreadcrumbs: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      since: z.string().optional(),
      limit: z.number().default(1000),
    }))
    .query(async ({ input }) => {
      return getBreadcrumbs({
        loadId: input.loadId,
        since: input.since ? new Date(input.since) : undefined,
        limit: input.limit,
      });
    }),

  // Get current driver position
  getDriverLocation: protectedProcedure
    .input(z.object({ driverId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [gps] = await db.select().from(gpsTracking)
        .where(eq(gpsTracking.driverId, input.driverId))
        .orderBy(desc(gpsTracking.timestamp)).limit(1);
      if (!gps) return null;
      return {
        lat: Number(gps.latitude),
        lng: Number(gps.longitude),
        speed: Number(gps.speed) || 0,
        heading: Number(gps.heading) || 0,
        updatedAt: gps.timestamp?.toISOString() || "",
      };
    }),

  // Anti-spoof check
  checkSpoofing: protectedProcedure
    .input(z.object({
      current: locationPointSchema,
      previous: locationPointSchema.optional(),
      isMockLocation: z.boolean().optional(),
    }))
    .query(({ input }) => {
      return detectSpoofing(input.current, input.previous || null, input.isMockLocation);
    }),
});

// ═══════════════════════════════════════════════════════════════════════════
// GEOFENCES SUB-ROUTER (CRUD, auto-creation, events)
// ═══════════════════════════════════════════════════════════════════════════

const geofencesSubRouter = router({
  // Auto-create all geofences for a load (Section 4.4)
  createForLoad: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      pickupLat: z.number(),
      pickupLng: z.number(),
      pickupFacilityName: z.string().optional(),
      deliveryLat: z.number(),
      deliveryLng: z.number(),
      deliveryFacilityName: z.string().optional(),
      waypoints: z.array(z.object({
        lat: z.number(), lng: z.number(), name: z.string().optional(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const fenceIds = await createGeofencesForLoad({
        id: input.loadId,
        pickupLat: input.pickupLat,
        pickupLng: input.pickupLng,
        pickupFacilityName: input.pickupFacilityName,
        deliveryLat: input.deliveryLat,
        deliveryLng: input.deliveryLng,
        deliveryFacilityName: input.deliveryFacilityName,
        waypoints: input.waypoints,
        createdBy: ctx.user?.id ? Number(ctx.user.id) : undefined,
      });
      return { success: true, geofenceIds: fenceIds, count: fenceIds.length };
    }),

  // Deactivate all geofences for a completed load
  deactivateForLoad: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .mutation(async ({ input }) => {
      await deactivateGeofencesForLoad(input.loadId);
      return { success: true };
    }),

  // Get active geofences for a load
  getForLoad: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const gfs = await db.select().from(geofences)
        .where(and(eq(geofences.loadId, input.loadId), eq(geofences.isActive, true)))
        .orderBy(geofences.createdAt);
      return gfs.map(g => ({
        id: g.id,
        name: g.name,
        type: g.type,
        shape: g.shape,
        center: g.center,
        radiusMeters: g.radiusMeters,
        polygon: g.polygon,
        alertOnEnter: g.alertOnEnter,
        alertOnExit: g.alertOnExit,
        alertOnDwell: g.alertOnDwell,
        dwellThresholdSeconds: g.dwellThresholdSeconds,
        actions: g.actions,
      }));
    }),

  // Get geofence event log for a load
  getEventsForLoad: protectedProcedure
    .input(z.object({ loadId: z.number(), limit: z.number().default(100) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const events = await db.select().from(geofenceEvents)
        .where(eq(geofenceEvents.loadId, input.loadId))
        .orderBy(desc(geofenceEvents.eventTimestamp))
        .limit(input.limit);
      return events.map(e => ({
        id: e.id,
        geofenceId: e.geofenceId,
        eventType: e.eventType,
        latitude: Number(e.latitude),
        longitude: Number(e.longitude),
        dwellSeconds: e.dwellSeconds,
        timestamp: e.eventTimestamp?.toISOString(),
      }));
    }),

  // Create a custom geofence (carrier yard, customer site)
  createCustom: protectedProcedure
    .input(z.object({
      name: z.string(),
      type: z.string().default("custom"),
      center: latLngSchema,
      radiusMeters: z.number().default(500),
      alertOnEnter: z.boolean().default(true),
      alertOnExit: z.boolean().default(true),
      alertOnDwell: z.boolean().default(false),
      dwellThresholdSeconds: z.number().default(300),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [gf] = await db.insert(geofences).values({
        name: input.name,
        type: input.type as any,
        shape: "circle",
        center: input.center,
        radiusMeters: input.radiusMeters,
        createdBy: ctx.user?.id ? Number(ctx.user.id) : null,
        alertOnEnter: input.alertOnEnter,
        alertOnExit: input.alertOnExit,
        alertOnDwell: input.alertOnDwell,
        dwellThresholdSeconds: input.dwellThresholdSeconds,
        isActive: true,
      }).$returningId();
      return { success: true, geofenceId: gf.id };
    }),
});

// ═══════════════════════════════════════════════════════════════════════════
// GEOTAGS SUB-ROUTER (Immutable audit trail)
// ═══════════════════════════════════════════════════════════════════════════

const geotagsSubRouter = router({
  // Create a manual geotag (driver tap, photo, signature)
  create: protectedProcedure
    .input(z.object({
      loadId: z.number().optional(),
      eventType: z.string(),
      eventCategory: z.enum(["load_lifecycle", "compliance", "safety", "operational", "photo", "document"]),
      lat: z.number(),
      lng: z.number(),
      accuracy: z.number().optional(),
      altitude: z.number().optional(),
      photoUrls: z.array(z.string()).optional(),
      signatureUrl: z.string().optional(),
      documentUrls: z.array(z.string()).optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
      loadState: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("Not authenticated");
      const geotagId = await createGeotag({
        ...input,
        userId: Number(userId),
        userRole: ctx.user?.role || "driver",
        driverId: Number(userId),
        timestamp: new Date(),
        source: "driver_manual",
      });
      return { success: true, geotagId };
    }),

  // Get all geotags for a load (timeline)
  getForLoad: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => getGeotagsForLoad(input.loadId)),

  // Get driver's recent geotags
  getForDriver: protectedProcedure
    .input(z.object({ driverId: z.number(), limit: z.number().default(50) }))
    .query(async ({ input }) => getGeotagsForDriver(input.driverId, input.limit)),

  // Verify a geotag (admin/compliance)
  verify: protectedProcedure
    .input(z.object({ geotagId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.update(geotags).set({
        isVerified: true,
        verifiedBy: ctx.user?.id ? Number(ctx.user.id) : null,
      }).where(eq(geotags.id, input.geotagId));
      return { success: true };
    }),
});

// ═══════════════════════════════════════════════════════════════════════════
// NAVIGATION SUB-ROUTER (Route calc, ETA, hazmat, deviation)
// ═══════════════════════════════════════════════════════════════════════════

const navigationSubRouter = router({
  // Calculate a full hazmat-compliant route
  calculateRoute: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      originLat: z.number(),
      originLng: z.number(),
      destLat: z.number(),
      destLng: z.number(),
      hazmatClass: z.string().optional(),
      vehicleHeight: z.number().optional(),
      vehicleWeight: z.number().optional(),
      vehicleLength: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return calculateCompliantRoute(input);
    }),

  // Recalculate ETA from current position
  recalculateETA: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      currentLat: z.number(),
      currentLng: z.number(),
      destLat: z.number(),
      destLng: z.number(),
    }))
    .query(async ({ input }) => {
      const etaResult = await calculateETA(
        input.loadId,
        { lat: input.currentLat, lng: input.currentLng },
        { lat: input.destLat, lng: input.destLng },
      );
      // Standard load:eta_updated event
      try {
        const { wsService, WS_EVENTS, WS_CHANNELS } = await import("../_core/websocket");
        const ch = WS_CHANNELS.LOAD(String(input.loadId));
        wsService.broadcastToChannel(ch, { type: WS_EVENTS.LOAD_ETA_UPDATED, data: { loadId: String(input.loadId), newEta: (etaResult as any)?.eta || (etaResult as any)?.estimatedArrival, confidence: (etaResult as any)?.confidence, timestamp: new Date().toISOString() }, timestamp: new Date().toISOString() });
      } catch { /* non-critical */ }
      return etaResult;
    }),

  // Get active route for a load
  getActiveRoute: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [route] = await db.select().from(loadRoutes)
        .where(and(eq(loadRoutes.loadId, input.loadId), eq(loadRoutes.isActive, true)))
        .limit(1);
      if (!route) return null;
      return {
        id: route.id,
        loadId: route.loadId,
        polyline: route.polyline,
        distanceMiles: Number(route.distanceMiles),
        durationSeconds: route.durationSeconds,
        isHazmatCompliant: route.isHazmatCompliant,
        hazmatRestrictions: route.hazmatRestrictions,
        tunnelRestrictions: route.tunnelRestrictions,
        stateCrossings: route.stateCrossings,
        suggestedStops: route.suggestedStops,
        weighStations: route.weighStations,
        weatherAlerts: route.weatherAlerts,
        fuelStops: route.fuelStops,
        bounds: route.boundsNeLat ? {
          ne: { lat: Number(route.boundsNeLat), lng: Number(route.boundsNeLng) },
          sw: { lat: Number(route.boundsSwLat), lng: Number(route.boundsSwLng) },
        } : null,
        tollEstimate: route.tollEstimate ? Number(route.tollEstimate) : null,
        fuelEstimate: route.fuelEstimate ? Number(route.fuelEstimate) : null,
        calculatedAt: route.calculatedAt?.toISOString(),
      };
    }),

  // Check if driver is off-route
  checkRouteDeviation: protectedProcedure
    .input(z.object({ loadId: z.number(), lat: z.number(), lng: z.number() }))
    .query(async ({ input }) => {
      const devResult = await checkRouteDeviation(input.loadId, { lat: input.lat, lng: input.lng });
      // Standard load:route_deviation event when deviation detected
      if ((devResult as any)?.isDeviated || (devResult as any)?.deviated) {
        try {
          const { wsService, WS_EVENTS, WS_CHANNELS } = await import("../_core/websocket");
          const ch = WS_CHANNELS.LOAD(String(input.loadId));
          wsService.broadcastToChannel(ch, { type: WS_EVENTS.LOAD_ROUTE_DEVIATION, data: { loadId: String(input.loadId), deviation_miles: (devResult as any)?.deviationMiles || (devResult as any)?.distanceFromRoute, location: { lat: input.lat, lng: input.lng }, timestamp: new Date().toISOString() }, timestamp: new Date().toISOString() });
        } catch { /* non-critical */ }
      }
      return devResult;
    }),

  // Get ETA history for a load
  getETAHistory: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select().from(etaHistory)
        .where(eq(etaHistory.loadId, input.loadId))
        .orderBy(desc(etaHistory.createdAt))
        .limit(50);
      return rows.map(r => ({
        id: r.id,
        predictedEta: r.predictedEta?.toISOString(),
        remainingMiles: r.remainingMiles ? Number(r.remainingMiles) : null,
        remainingMinutes: r.remainingMinutes,
        confidence: r.confidence,
        changeReason: r.changeReason,
        createdAt: r.createdAt?.toISOString(),
      }));
    }),

  // Check if hazmat class requires tunnel avoidance
  checkHazmatTunnels: protectedProcedure
    .input(z.object({ hazmatClass: z.string() }))
    .query(({ input }) => ({
      requiresTunnelAvoidance: requiresTunnelAvoidance(input.hazmatClass),
      hazmatClass: input.hazmatClass,
    })),
});

// ═══════════════════════════════════════════════════════════════════════════
// TRACKING SUB-ROUTER (Consumer-facing: active loads, fleet/dispatch/terminal maps)
// ═══════════════════════════════════════════════════════════════════════════

const trackingSubRouter = router({
  // Get all active loads with positions for the current user (Section 10 role matrix)
  getActiveLoads: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const role = (ctx.user?.role || "").toUpperCase();
      const userId = ctx.user?.id;
      const companyId = ctx.user?.companyId;

      let conditions: any;
      if (role === "DRIVER" && userId) {
        conditions = eq(loads.driverId, userId);
      } else if (role === "SHIPPER" && companyId) {
        conditions = eq(loads.shipperId, companyId);
      } else if ((role === "CATALYST" || role === "DISPATCH") && companyId) {
        conditions = eq(loads.catalystId, companyId);
      } else if (role === "BROKER" && companyId) {
        conditions = eq(loads.catalystId, companyId);
      }

      const activeLoads = await db.select({
        id: loads.id, loadNumber: loads.loadNumber, status: loads.status,
        driverId: loads.driverId, pickupLocation: loads.pickupLocation,
        deliveryLocation: loads.deliveryLocation,
      }).from(loads)
        .where(conditions)
        .limit(50);

      const result = [];
      for (const load of activeLoads) {
        let position = null;
        if (load.driverId) {
          const [gps] = await db.select().from(gpsTracking)
            .where(eq(gpsTracking.driverId, load.driverId))
            .orderBy(desc(gpsTracking.timestamp)).limit(1);
          if (gps) {
            position = {
              lat: Number(gps.latitude), lng: Number(gps.longitude),
              speed: Number(gps.speed) || 0, heading: Number(gps.heading) || 0,
              updatedAt: gps.timestamp?.toISOString(),
            };
          }
        }
        const pickup = load.pickupLocation as any || {};
        const delivery = load.deliveryLocation as any || {};
        result.push({
          loadId: load.id,
          loadNumber: load.loadNumber,
          status: load.status,
          origin: pickup.city ? `${pickup.city}, ${pickup.state}` : "Origin",
          destination: delivery.city ? `${delivery.city}, ${delivery.state}` : "Destination",
          position,
        });
      }
      return result;
    }),

  // Full tracking view for a single load
  getLoadTracking: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [load] = await db.select().from(loads)
        .where(eq(loads.id, input.loadId)).limit(1);
      if (!load) return null;

      // Current position
      let position = null;
      if (load.driverId) {
        const [gps] = await db.select().from(gpsTracking)
          .where(eq(gpsTracking.driverId, load.driverId))
          .orderBy(desc(gpsTracking.timestamp)).limit(1);
        if (gps) position = {
          lat: Number(gps.latitude), lng: Number(gps.longitude),
          speed: Number(gps.speed) || 0, heading: Number(gps.heading) || 0,
          updatedAt: gps.timestamp?.toISOString(),
        };
      }

      // Route
      const [route] = await db.select().from(loadRoutes)
        .where(and(eq(loadRoutes.loadId, input.loadId), eq(loadRoutes.isActive, true)))
        .limit(1);

      // Geotags (timeline)
      const tags = await getGeotagsForLoad(input.loadId);

      // Geofences
      const fences = await db.select().from(geofences)
        .where(and(eq(geofences.loadId, input.loadId), eq(geofences.isActive, true)));

      // Detention
      const detention = await getDetentionForLoad(input.loadId);

      // ETA
      const [latestEta] = await db.select().from(etaHistory)
        .where(eq(etaHistory.loadId, input.loadId))
        .orderBy(desc(etaHistory.createdAt)).limit(1);

      const pickup = load.pickupLocation as any || {};
      const delivery = load.deliveryLocation as any || {};

      return {
        loadId: load.id,
        loadNumber: load.loadNumber,
        status: load.status,
        origin: { lat: pickup.lat, lng: pickup.lng, address: pickup.address, city: pickup.city, state: pickup.state },
        destination: { lat: delivery.lat, lng: delivery.lng, address: delivery.address, city: delivery.city, state: delivery.state },
        position,
        route: route ? {
          polyline: route.polyline,
          distanceMiles: Number(route.distanceMiles),
          durationSeconds: route.durationSeconds,
          isHazmatCompliant: route.isHazmatCompliant,
        } : null,
        geotags: tags,
        geofences: fences.map(g => ({
          id: g.id, name: g.name, type: g.type, shape: g.shape,
          center: g.center, radiusMeters: g.radiusMeters,
        })),
        detention,
        eta: latestEta ? {
          predictedEta: latestEta.predictedEta?.toISOString(),
          remainingMiles: latestEta.remainingMiles ? Number(latestEta.remainingMiles) : null,
          remainingMinutes: latestEta.remainingMinutes,
          confidence: latestEta.confidence,
        } : null,
      };
    }),

  // Fleet map data (carrier / catalyst view)
  getFleetMap: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { vehicles: [], lastUpdated: new Date().toISOString() };
      const companyId = ctx.user?.companyId;
      if (!companyId) return { vehicles: [], lastUpdated: new Date().toISOString() };

      const vehicleList = await db.select().from(vehicles)
        .where(eq(vehicles.companyId, companyId)).limit(100);

      const mapped = [];
      for (const v of vehicleList) {
        const [gps] = await db.select().from(gpsTracking)
          .where(eq(gpsTracking.vehicleId, v.id))
          .orderBy(desc(gpsTracking.timestamp)).limit(1);
        if (!gps) continue;

        let driverName = "Unassigned";
        let loadNumber: string | null = null;
        let destination: string | null = null;

        const [activeLoad] = await db.select({
          loadNumber: loads.loadNumber, driverId: loads.driverId,
          deliveryLocation: loads.deliveryLocation,
        }).from(loads)
          .where(and(eq(loads.vehicleId, v.id), eq(loads.status, "in_transit" as any)))
          .limit(1);

        if (activeLoad?.driverId) {
          const [driver] = await db.select({ name: users.name }).from(users)
            .where(eq(users.id, activeLoad.driverId)).limit(1);
          if (driver) driverName = driver.name || "Driver";
          loadNumber = activeLoad.loadNumber;
          const del = activeLoad.deliveryLocation as any || {};
          destination = del.city ? `${del.city}, ${del.state}` : null;
        }

        mapped.push({
          vehicleId: v.id,
          unitNumber: v.licensePlate || `TRK-${v.id}`,
          lat: Number(gps.latitude),
          lng: Number(gps.longitude),
          speed: Number(gps.speed) || 0,
          heading: Number(gps.heading) || 0,
          status: Number(gps.speed) > 5 ? "moving" : "stopped",
          driverName,
          loadNumber,
          destination,
          updatedAt: gps.timestamp?.toISOString(),
        });
      }

      return { vehicles: mapped, lastUpdated: new Date().toISOString() };
    }),

  // Dispatch map (catalyst view) — all dispatched loads
  getDispatchMap: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const companyId = ctx.user?.companyId;
      if (!companyId) return [];

      const dispatchedLoads = await db.select({
        id: loads.id, loadNumber: loads.loadNumber, status: loads.status,
        driverId: loads.driverId, pickupLocation: loads.pickupLocation,
        deliveryLocation: loads.deliveryLocation,
      }).from(loads)
        .where(eq(loads.catalystId, companyId))
        .limit(100);

      const result = [];
      for (const load of dispatchedLoads) {
        let position = null;
        if (load.driverId) {
          const [gps] = await db.select().from(gpsTracking)
            .where(eq(gpsTracking.driverId, load.driverId))
            .orderBy(desc(gpsTracking.timestamp)).limit(1);
          if (gps) position = {
            lat: Number(gps.latitude), lng: Number(gps.longitude),
            speed: Number(gps.speed) || 0,
          };
        }
        const pickup = load.pickupLocation as any || {};
        const delivery = load.deliveryLocation as any || {};
        result.push({
          loadId: load.id,
          loadNumber: load.loadNumber,
          status: load.status,
          origin: pickup.city ? `${pickup.city}, ${pickup.state}` : "Origin",
          destination: delivery.city ? `${delivery.city}, ${delivery.state}` : "Destination",
          position,
        });
      }
      return result;
    }),

  // Terminal queue — trucks approaching and at facility
  getTerminalQueue: protectedProcedure
    .input(z.object({ facilityLat: z.number(), facilityLng: z.number(), radiusMiles: z.number().default(30) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      // Get all active loads with GPS positions
      const activeLoads = await db.select({
        id: loads.id, loadNumber: loads.loadNumber, status: loads.status,
        driverId: loads.driverId,
      }).from(loads)
        .where(sql`${loads.status} IN ('in_transit', 'approaching_delivery', 'approaching_pickup')`)
        .limit(200);

      const nearby = [];
      for (const load of activeLoads) {
        if (!load.driverId) continue;
        const [gps] = await db.select().from(gpsTracking)
          .where(eq(gpsTracking.driverId, load.driverId))
          .orderBy(desc(gpsTracking.timestamp)).limit(1);
        if (!gps) continue;

        const dist = haversineDistance(
          { lat: input.facilityLat, lng: input.facilityLng },
          { lat: Number(gps.latitude), lng: Number(gps.longitude) },
        );

        if (dist <= input.radiusMiles) {
          const [driver] = await db.select({ name: users.name }).from(users)
            .where(eq(users.id, load.driverId)).limit(1);
          const etaMinutes = Math.round((dist / 55) * 60);
          nearby.push({
            loadId: load.id,
            loadNumber: load.loadNumber,
            driverName: driver?.name || "Driver",
            distanceMiles: Math.round(dist * 10) / 10,
            etaMinutes,
            lat: Number(gps.latitude),
            lng: Number(gps.longitude),
            speed: Number(gps.speed) || 0,
            status: load.status,
          });
        }
      }

      return nearby.sort((a, b) => a.distanceMiles - b.distanceMiles);
    }),

  // Get ETA for a specific load
  getETAForLoad: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [eta] = await db.select().from(etaHistory)
        .where(eq(etaHistory.loadId, input.loadId))
        .orderBy(desc(etaHistory.createdAt)).limit(1);
      if (!eta) return null;
      return {
        predictedEta: eta.predictedEta?.toISOString(),
        remainingMiles: eta.remainingMiles ? Number(eta.remainingMiles) : null,
        remainingMinutes: eta.remainingMinutes,
        confidence: eta.confidence,
        updatedAt: eta.createdAt?.toISOString(),
      };
    }),

  // Get WebSocket channels for current user (Section 11.1)
  getMyChannels: protectedProcedure
    .query(({ ctx }) => {
      if (!ctx.user?.id) return [];
      return getChannelsForUser({
        id: Number(ctx.user.id),
        role: ctx.user.role || "driver",
        companyId: ctx.user.companyId || undefined,
      });
    }),

  // Get Google Maps web client key (domain-restricted, safe for frontend)
  getMapConfig: protectedProcedure
    .query(() => ({
      webApiKey: googleMapsConfig.webClient.apiKey,
      hasServerKey: !!googleMapsConfig.server.apiKey,
    })),
});

// ═══════════════════════════════════════════════════════════════════════════
// DETENTION SUB-ROUTER
// ═══════════════════════════════════════════════════════════════════════════

const detentionSubRouter = router({
  // Get detention records for a load
  getForLoad: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => getDetentionForLoad(input.loadId)),

  // Get all billable (unpaid) detention records
  getBillable: protectedProcedure
    .query(async ({ ctx }) => getBillableDetention(ctx.user?.companyId || undefined)),

  // Get detention for a facility
  getForFacility: protectedProcedure
    .input(z.object({ facilityId: z.number(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const records = await db.select().from(detentionRecords)
        .where(eq(detentionRecords.facilityId as any, input.facilityId))
        .orderBy(desc(detentionRecords.createdAt))
        .limit(input.limit);
      return records.map(r => ({
        id: r.id,
        loadId: r.loadId,
        locationType: r.locationType,
        totalDwellMinutes: r.totalDwellMinutes,
        detentionMinutes: r.detentionMinutes,
        detentionCharge: r.detentionCharge ? Number(r.detentionCharge) : 0,
        isBillable: r.isBillable,
        enterAt: r.geofenceEnterAt?.toISOString(),
        exitAt: r.geofenceExitAt?.toISOString(),
      }));
    }),
});

// ═══════════════════════════════════════════════════════════════════════════
// COMPLIANCE SUB-ROUTER (State crossings, IFTA, route deviations, hazmat zones)
// ═══════════════════════════════════════════════════════════════════════════

const complianceSubRouter = router({
  // State crossings for a load
  getStateCrossings: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => getStateCrossingsForLoad(input.loadId)),

  // IFTA mileage report by state
  getIFTAReport: protectedProcedure
    .input(z.object({
      vehicleId: z.number().optional(),
      driverId: z.number().optional(),
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => getIFTAReport({
      vehicleId: input.vehicleId,
      driverId: input.driverId,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
    })),

  // Route deviation events for a load
  getRouteDeviations: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const tags = await db.select().from(geotags)
        .where(and(eq(geotags.loadId, input.loadId), eq(geotags.eventType, "route_deviation")))
        .orderBy(geotags.eventTimestamp);
      return tags.map(t => ({
        id: t.id,
        lat: Number(t.lat),
        lng: Number(t.lng),
        timestamp: t.eventTimestamp?.toISOString(),
        metadata: t.metadata,
      }));
    }),

  // Speed alert events
  getSpeedAlerts: protectedProcedure
    .input(z.object({ driverId: z.number().optional(), loadId: z.number().optional(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions: any[] = [eq(geotags.eventType, "speed_alert")];
      if (input.driverId) conditions.push(eq(geotags.driverId, input.driverId));
      if (input.loadId) conditions.push(eq(geotags.loadId, input.loadId));
      const tags = await db.select().from(geotags)
        .where(and(...conditions))
        .orderBy(desc(geotags.eventTimestamp))
        .limit(input.limit);
      return tags.map(t => ({
        id: t.id,
        lat: Number(t.lat),
        lng: Number(t.lng),
        timestamp: t.eventTimestamp?.toISOString(),
        metadata: t.metadata,
      }));
    }),

  // Hazmat zone entry events
  getHazmatZoneEntries: protectedProcedure
    .input(z.object({ loadId: z.number().optional(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions: any[] = [eq(geotags.eventType, "hazmat_zone_entry")];
      if (input.loadId) conditions.push(eq(geotags.loadId, input.loadId));
      const tags = await db.select().from(geotags)
        .where(and(...conditions))
        .orderBy(desc(geotags.eventTimestamp))
        .limit(input.limit);
      return tags.map(t => ({
        id: t.id,
        lat: Number(t.lat),
        lng: Number(t.lng),
        timestamp: t.eventTimestamp?.toISOString(),
        metadata: t.metadata,
        tamperedFlag: t.tamperedFlag,
      }));
    }),
});

// ═══════════════════════════════════════════════════════════════════════════
// MERGED LOCATION ROUTER (Section 14)
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// PREDICTIVE ETA SUB-ROUTER (Task 2.4.1)
// ═══════════════════════════════════════════════════════════════════════════

const predictiveETASubRouter = router({
  calculate: protectedProcedure
    .input(z.object({
      loadId: z.number().optional(),
      originLat: z.number(),
      originLng: z.number(),
      destLat: z.number(),
      destLng: z.number(),
      distanceMiles: z.number().min(1),
      departureTime: z.string().optional(),
      isHazmat: z.boolean().optional(),
      isOversize: z.boolean().optional(),
      driverHoursRemaining: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const { calculatePredictiveETA } = await import("../services/logistics/predictiveETA");
      return calculatePredictiveETA(input);
    }),
});

export const locationRouter = router({
  telemetry: telemetrySubRouter,
  geofences: geofencesSubRouter,
  geotags: geotagsSubRouter,
  navigation: navigationSubRouter,
  tracking: trackingSubRouter,
  detention: detentionSubRouter,
  compliance: complianceSubRouter,
  predictiveETA: predictiveETASubRouter,
});
