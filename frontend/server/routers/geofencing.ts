/**
 * GEOFENCING ROUTER - Zone management, triggers, and events
 */

import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { geofences, geofenceEvents, locationHistory, detentionRecords, loads } from "../../drizzle/schema";
import { unsafeCast } from "../_core/types/unsafe";
import { logger } from "../_core/logger";

const geofenceSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(["terminal", "warehouse", "rest_area", "custom", "pickup", "delivery", "waypoint", "state_boundary", "hazmat_restricted", "weight_restricted", "height_restricted", "customer_site", "no_go", "speed_zone"]),
  shape: z.enum(["circle", "polygon"]).default("circle"),
  center: z.object({ lat: z.number(), lng: z.number() }).optional(),
  radius: z.number().optional(),
  radiusMeters: z.number().optional(),
  polygon: z.array(z.object({ lat: z.number(), lng: z.number() })).optional(),
  loadId: z.number().optional(),
  terminalId: z.number().optional(),
  alertOnEnter: z.boolean().default(true),
  alertOnExit: z.boolean().default(true),
  alertOnDwell: z.boolean().default(false),
  dwellThresholdSeconds: z.number().default(300),
  actions: z.array(z.object({ type: z.string(), config: z.record(z.string(), z.unknown()) })).optional(),
  expiresAt: z.string().optional(),
});

function isPointInCircle(lat: number, lng: number, centerLat: number, centerLng: number, radiusMeters: number): boolean {
  const R = 6371000;
  const dLat = (lat - centerLat) * Math.PI / 180;
  const dLng = (lng - centerLng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(centerLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return distance <= radiusMeters;
}

function isPointInPolygon(lat: number, lng: number, polygon: { lat: number; lng: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

export const geofencingRouter = router({
  // Create a geofence
  createGeofence: protectedProcedure.input(geofenceSchema).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const userId = ctx.user?.id;

    const [gf] = await db.insert(geofences).values({
      name: input.name,
      description: input.description,
      type: input.type,
      shape: input.shape,
      center: input.center,
      radius: input.radius ? String(input.radius) : null,
      radiusMeters: input.radiusMeters,
      polygon: input.polygon,
      loadId: input.loadId,
      terminalId: input.terminalId,
      createdBy: userId ? Number(userId) : null,
      alertOnEnter: input.alertOnEnter,
      alertOnExit: input.alertOnExit,
      alertOnDwell: input.alertOnDwell,
      dwellThresholdSeconds: input.dwellThresholdSeconds,
      actions: input.actions || [],
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      isActive: true,
    }).$returningId();

    return { success: true, geofenceId: gf.id };
  }),

  // Update a geofence
  updateGeofence: protectedProcedure.input(z.object({ id: z.number() }).merge(geofenceSchema.partial())).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    await db.update(geofences).set({
      ...(input.name && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.type && { type: input.type }),
      ...(input.center && { center: input.center }),
      ...(input.radius && { radius: String(input.radius) }),
      ...(input.radiusMeters && { radiusMeters: input.radiusMeters }),
      ...(input.polygon && { polygon: input.polygon }),
      ...(input.alertOnEnter !== undefined && { alertOnEnter: input.alertOnEnter }),
      ...(input.alertOnExit !== undefined && { alertOnExit: input.alertOnExit }),
      ...(input.alertOnDwell !== undefined && { alertOnDwell: input.alertOnDwell }),
      ...(input.actions && { actions: input.actions }),
    }).where(eq(geofences.id, input.id));

    return { success: true };
  }),

  // Delete a geofence
  deleteGeofence: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.update(geofences).set({ isActive: false }).where(eq(geofences.id, input.id));
    return { success: true };
  }),

  // Get geofences
  getGeofences: protectedProcedure.input(z.object({ type: z.string().optional(), companyId: z.number().optional(), loadId: z.number().optional(), activeOnly: z.boolean().default(true) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];

    let conditions = [];
    if (input.activeOnly) conditions.push(eq(geofences.isActive, true));
    if (input.type) conditions.push(eq(geofences.type, unsafeCast(input.type)));
    if (input.companyId) conditions.push(eq(geofences.companyId, input.companyId));
    if (input.loadId) conditions.push(eq(geofences.loadId, input.loadId));

    const gfs = await db.select().from(geofences).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(geofences.createdAt)).limit(200);

    return gfs.map(g => ({
      id: g.id,
      name: g.name,
      description: g.description,
      type: g.type,
      shape: g.shape,
      center: g.center,
      radius: g.radius ? Number(g.radius) : null,
      radiusMeters: g.radiusMeters,
      polygon: g.polygon,
      loadId: g.loadId,
      terminalId: g.terminalId,
      alertOnEnter: g.alertOnEnter,
      alertOnExit: g.alertOnExit,
      alertOnDwell: g.alertOnDwell,
      isActive: g.isActive,
      createdAt: g.createdAt?.toISOString(),
    }));
  }),

  // Check if a point is inside any geofences
  checkLocation: protectedProcedure.input(z.object({ lat: z.number(), lng: z.number(), userId: z.number().optional() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];

    const gfs = await db.select().from(geofences).where(eq(geofences.isActive, true)).limit(500);
    const matches: { id: number; name: string; type: string }[] = [];

    for (const gf of gfs) {
      let inside = false;
      if (gf.shape === "circle" && gf.center) {
        const c = gf.center as { lat: number; lng: number };
        const radius = gf.radiusMeters || (gf.radius ? Number(gf.radius) * 1609.34 : 500);
        inside = isPointInCircle(input.lat, input.lng, c.lat, c.lng, radius);
      } else if (gf.shape === "polygon" && gf.polygon) {
        inside = isPointInPolygon(input.lat, input.lng, gf.polygon as { lat: number; lng: number }[]);
      }
      if (inside) matches.push({ id: gf.id, name: gf.name, type: gf.type });
    }

    return matches;
  }),

  // Get geofence events
  getGeofenceEvents: protectedProcedure.input(z.object({ geofenceId: z.number().optional(), userId: z.number().optional(), loadId: z.number().optional(), limit: z.number().default(100) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];

    let conditions = [];
    if (input.geofenceId) conditions.push(eq(geofenceEvents.geofenceId, input.geofenceId));
    if (input.userId) conditions.push(eq(geofenceEvents.userId, input.userId));
    if (input.loadId) conditions.push(eq(geofenceEvents.loadId, input.loadId));

    const events = await db.select().from(geofenceEvents).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(geofenceEvents.eventTimestamp)).limit(input.limit);

    return events.map(e => ({
      id: e.id,
      geofenceId: e.geofenceId,
      userId: e.userId,
      loadId: e.loadId,
      eventType: e.eventType,
      latitude: Number(e.latitude),
      longitude: Number(e.longitude),
      dwellSeconds: e.dwellSeconds,
      timestamp: e.eventTimestamp?.toISOString(),
    }));
  }),

  // Record a geofence event
  recordEvent: protectedProcedure.input(z.object({ geofenceId: z.number(), eventType: z.enum(["enter", "exit", "dwell", "approach"]), latitude: z.number(), longitude: z.number(), loadId: z.number().optional(), dwellSeconds: z.number().optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const userId = ctx.user?.id;
    if (!userId) throw new Error("Not authenticated");

    const [event] = await db.insert(geofenceEvents).values({
      geofenceId: input.geofenceId,
      userId: Number(userId),
      loadId: input.loadId,
      eventType: input.eventType,
      latitude: String(input.latitude),
      longitude: String(input.longitude),
      dwellSeconds: input.dwellSeconds,
      eventTimestamp: new Date(),
    }).$returningId();

    // ── AUTO-CREATE DETENTION TIMER on geofence entry at pickup/delivery for active loads ──
    if (input.eventType === "enter") {
      try {
        // Look up the geofence to check if it's a pickup/delivery zone with an associated load
        const [gf] = await db.select().from(geofences)
          .where(and(eq(geofences.id, input.geofenceId), eq(geofences.isActive, true)))
          .limit(1);

        if (gf && (gf.type === "pickup" || gf.type === "delivery") && gf.loadId) {
          // Verify the load is in an active status (assigned through in_transit)
          const [load] = await db.select({ id: loads.id, status: loads.status, driverId: loads.driverId })
            .from(loads).where(eq(loads.id, gf.loadId)).limit(1);

          const activeStatuses = ["assigned", "confirmed", "en_route_pickup", "at_pickup", "loading", "loaded", "in_transit", "at_delivery", "unloading"];
          if (load && activeStatuses.includes(load.status || "")) {
            // Check if there's already an open detention record for this load + location type
            const existingRows = await db.select({ id: detentionRecords.id })
              .from(detentionRecords)
              .where(and(
                eq(detentionRecords.loadId, gf.loadId),
                eq(detentionRecords.locationType, unsafeCast(gf.type)),
                sql`${detentionRecords.geofenceExitAt} IS NULL`
              ))
              .limit(1);

            if (existingRows.length === 0) {
              await db.insert(detentionRecords).values({
                loadId: gf.loadId,
                locationType: gf.type as "pickup" | "delivery",
                geofenceId: gf.id,
                driverId: load.driverId || Number(userId),
                geofenceEnterAt: new Date(),
                freeTimeMinutes: 120, // standard 2-hour free time
                enterGeotagId: event.id,
              });
              logger.info(`[Geofencing] Auto-created detention timer for load #${gf.loadId} at ${gf.type} zone (geofence #${gf.id})`);
            }
          }
        }
      } catch (detErr) {
        // Non-critical — log and continue; the geofence event itself was already recorded
        logger.warn("[Geofencing] Failed to auto-create detention record:", (detErr as Error).message);
      }
    }

    // ── AUTO-CLOSE DETENTION TIMER on geofence exit ──
    if (input.eventType === "exit") {
      try {
        const [gf] = await db.select().from(geofences)
          .where(and(eq(geofences.id, input.geofenceId), eq(geofences.isActive, true)))
          .limit(1);

        if (gf && (gf.type === "pickup" || gf.type === "delivery") && gf.loadId) {
          // Find the open detention record and close it
          const openRecords = await db.select()
            .from(detentionRecords)
            .where(and(
              eq(detentionRecords.loadId, gf.loadId),
              eq(detentionRecords.locationType, unsafeCast(gf.type)),
              sql`${detentionRecords.geofenceExitAt} IS NULL`
            ))
            .limit(1);

          if (openRecords.length > 0) {
            const rec = openRecords[0];
            const enterTime = rec.geofenceEnterAt.getTime();
            const exitTime = Date.now();
            const totalDwellMinutes = Math.round((exitTime - enterTime) / 60000);
            const freeTime = rec.freeTimeMinutes ?? 120;
            const detentionMinutes = Math.max(0, totalDwellMinutes - freeTime);
            const isBillable = detentionMinutes > 0;
            const ratePerHour = 75; // standard detention rate $/hr
            const detentionCharge = isBillable ? Math.round(detentionMinutes / 60 * ratePerHour * 100) / 100 : 0;

            await db.update(detentionRecords).set({
              geofenceExitAt: new Date(),
              totalDwellMinutes,
              detentionStartedAt: isBillable ? new Date(enterTime + freeTime * 60000) : null,
              detentionMinutes,
              detentionRatePerHour: String(ratePerHour),
              detentionCharge: String(detentionCharge),
              isBillable,
              exitGeotagId: event.id,
            }).where(eq(detentionRecords.id, rec.id));

            logger.info(`[Geofencing] Closed detention timer for load #${gf.loadId} at ${gf.type}: ${totalDwellMinutes}min dwell, ${detentionMinutes}min billable ($${detentionCharge})`);
          }
        }
      } catch (detErr) {
        logger.warn("[Geofencing] Failed to close detention record:", (detErr as Error).message);
      }
    }

    return { success: true, eventId: event.id };
  }),

  // Create geofences for a load (pickup & delivery zones)
  createLoadGeofences: protectedProcedure.input(z.object({ loadId: z.number(), pickupLat: z.number(), pickupLng: z.number(), deliveryLat: z.number(), deliveryLng: z.number(), radiusMeters: z.number().default(800) })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const userId = ctx.user?.id;

    const [pickup] = await db.insert(geofences).values({
      name: `Pickup Zone - Load #${input.loadId}`,
      type: "pickup",
      shape: "circle",
      center: { lat: input.pickupLat, lng: input.pickupLng },
      radiusMeters: input.radiusMeters,
      loadId: input.loadId,
      createdBy: userId ? Number(userId) : null,
      alertOnEnter: true,
      alertOnExit: true,
      alertOnDwell: true,
      dwellThresholdSeconds: 300,
      actions: [{ type: "load_status", config: { autoUpdate: true } }],
      isActive: true,
    }).$returningId();

    const [delivery] = await db.insert(geofences).values({
      name: `Delivery Zone - Load #${input.loadId}`,
      type: "delivery",
      shape: "circle",
      center: { lat: input.deliveryLat, lng: input.deliveryLng },
      radiusMeters: input.radiusMeters,
      loadId: input.loadId,
      createdBy: userId ? Number(userId) : null,
      alertOnEnter: true,
      alertOnExit: true,
      alertOnDwell: true,
      dwellThresholdSeconds: 300,
      actions: [{ type: "load_status", config: { autoUpdate: true } }],
      isActive: true,
    }).$returningId();

    return { success: true, pickupGeofenceId: pickup.id, deliveryGeofenceId: delivery.id };
  }),

  // Download geofences near a point for offline caching
  getNearbyGeofences: protectedProcedure.input(z.object({
    lat: z.number(),
    lng: z.number(),
    radiusMeters: z.number().default(5000),
    loadId: z.number().optional(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];

    let conditions: any[] = [eq(geofences.isActive, true)];
    if (input.loadId) conditions.push(eq(geofences.loadId, input.loadId));

    const gfs = await db.select().from(geofences)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .limit(500);

    // Filter by distance client-side (MySQL doesn't have native geo queries)
    const nearby = gfs.filter(g => {
      if (!g.center) return true; // keep polygon geofences
      const c = g.center as { lat: number; lng: number };
      return isPointInCircle(input.lat, input.lng, c.lat, c.lng, input.radiusMeters);
    });

    return nearby.map(g => ({
      id: g.id,
      name: g.name,
      type: g.type,
      shape: g.shape,
      center: g.center,
      radiusMeters: g.radiusMeters || (g.radius ? Number(g.radius) * 1609.34 : 200),
      polygon: g.polygon,
      loadId: g.loadId,
      alertOnEnter: g.alertOnEnter,
      alertOnExit: g.alertOnExit,
      alertOnDwell: g.alertOnDwell,
      dwellThresholdSeconds: g.dwellThresholdSeconds,
    }));
  }),
});
