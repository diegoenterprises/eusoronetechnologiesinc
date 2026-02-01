/**
 * TELEMETRY ROUTER - GPS tracking, geofencing, navigation
 */

import { z } from "zod";
import { eq, desc, sql, and } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { locationHistory, geofences, geofenceEvents, routes, routeWaypoints, convoys, etaHistory, speedEvents, safetyAlerts, users } from "../../drizzle/schema";

const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  altitude: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().optional(),
  horizontalAccuracy: z.number().optional(),
  activityType: z.enum(["driving", "stationary", "walking", "unknown"]).optional(),
  isMoving: z.boolean().optional(),
  batteryLevel: z.number().optional(),
  provider: z.enum(["gps", "network", "fused", "passive"]).optional(),
  deviceId: z.string().optional(),
  loadId: z.number().optional(),
  convoyId: z.number().optional(),
  deviceTimestamp: z.string(),
});

export const telemetryRouter = router({
  // Submit location update
  submitLocation: protectedProcedure.input(locationSchema).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const userId = ctx.user?.id;
    if (!userId) throw new Error("Not authenticated");

    if (input.latitude === 0 && input.longitude === 0) throw new Error("Invalid coordinates");
    if (input.speed && input.speed > 150) throw new Error("Speed too high");

    const [loc] = await db.insert(locationHistory).values({
      userId: Number(userId),
      deviceId: input.deviceId,
      loadId: input.loadId,
      convoyId: input.convoyId,
      latitude: String(input.latitude),
      longitude: String(input.longitude),
      altitude: input.altitude ? String(input.altitude) : null,
      speed: input.speed ? String(input.speed) : null,
      heading: input.heading ? String(input.heading) : null,
      horizontalAccuracy: input.horizontalAccuracy ? String(input.horizontalAccuracy) : null,
      activityType: input.activityType || "unknown",
      isMoving: input.isMoving || false,
      batteryLevel: input.batteryLevel,
      provider: input.provider || "fused",
      isMocked: false,
      deviceTimestamp: new Date(input.deviceTimestamp),
    }).$returningId();

    return { success: true, locationId: loc.id };
  }),

  // Get live location
  getLiveLocation: protectedProcedure.input(z.object({ userId: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const [loc] = await db.select().from(locationHistory).where(eq(locationHistory.userId, input.userId)).orderBy(desc(locationHistory.serverTimestamp)).limit(1);
    if (!loc) return null;
    return { userId: loc.userId, latitude: Number(loc.latitude), longitude: Number(loc.longitude), speed: loc.speed ? Number(loc.speed) : 0, heading: loc.heading ? Number(loc.heading) : 0, activityType: loc.activityType, isMoving: loc.isMoving, batteryLevel: loc.batteryLevel, timestamp: loc.serverTimestamp?.toISOString() };
  }),

  // Get location trail/history
  getTrail: protectedProcedure.input(z.object({ userId: z.number(), hours: z.number().default(24), limit: z.number().default(500) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const since = new Date(Date.now() - input.hours * 60 * 60 * 1000);
    const trail = await db.select({ lat: locationHistory.latitude, lng: locationHistory.longitude, speed: locationHistory.speed, ts: locationHistory.deviceTimestamp }).from(locationHistory).where(and(eq(locationHistory.userId, input.userId), sql`${locationHistory.deviceTimestamp} >= ${since}`)).orderBy(desc(locationHistory.deviceTimestamp)).limit(input.limit);
    return trail.map(p => ({ lat: Number(p.lat), lng: Number(p.lng), speed: p.speed ? Number(p.speed) : 0, timestamp: p.ts?.toISOString() }));
  }),

  // Get fleet locations
  getFleetLocations: protectedProcedure.input(z.object({ companyId: z.number().optional() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const locs = await db.select({ userId: locationHistory.userId, lat: locationHistory.latitude, lng: locationHistory.longitude, speed: locationHistory.speed, heading: locationHistory.heading, isMoving: locationHistory.isMoving, ts: locationHistory.serverTimestamp, loadId: locationHistory.loadId, name: users.name }).from(locationHistory).leftJoin(users, eq(locationHistory.userId, users.id)).orderBy(desc(locationHistory.serverTimestamp)).limit(100);
    const seen = new Set();
    return locs.filter(l => { if (seen.has(l.userId)) return false; seen.add(l.userId); return true; }).map(l => ({ userId: l.userId, name: l.name || "Driver", lat: Number(l.lat), lng: Number(l.lng), speed: l.speed ? Number(l.speed) : 0, heading: l.heading ? Number(l.heading) : 0, isMoving: l.isMoving, loadId: l.loadId, timestamp: l.ts?.toISOString() }));
  }),

  // Get load location history
  getLoadLocationHistory: protectedProcedure.input(z.object({ loadId: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const trail = await db.select({ lat: locationHistory.latitude, lng: locationHistory.longitude, ts: locationHistory.deviceTimestamp }).from(locationHistory).where(eq(locationHistory.loadId, input.loadId)).orderBy(locationHistory.deviceTimestamp).limit(1000);
    return trail.map(p => ({ lat: Number(p.lat), lng: Number(p.lng), timestamp: p.ts?.toISOString() }));
  }),

  // Get nearby drivers
  getNearbyDrivers: protectedProcedure.input(z.object({ lat: z.number(), lng: z.number(), radiusMiles: z.number().default(50) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const degPerMile = 1 / 69;
    const latDelta = input.radiusMiles * degPerMile;
    const lngDelta = input.radiusMiles * degPerMile / Math.cos(input.lat * Math.PI / 180);
    const locs = await db.select({ userId: locationHistory.userId, lat: locationHistory.latitude, lng: locationHistory.longitude, name: users.name }).from(locationHistory).leftJoin(users, eq(locationHistory.userId, users.id)).where(and(sql`${locationHistory.latitude} BETWEEN ${input.lat - latDelta} AND ${input.lat + latDelta}`, sql`${locationHistory.longitude} BETWEEN ${input.lng - lngDelta} AND ${input.lng + lngDelta}`)).orderBy(desc(locationHistory.serverTimestamp)).limit(50);
    const seen = new Set();
    return locs.filter(l => { if (seen.has(l.userId)) return false; seen.add(l.userId); return true; }).map(l => ({ userId: l.userId, name: l.name || "Driver", lat: Number(l.lat), lng: Number(l.lng), distanceMiles: Math.sqrt(Math.pow((Number(l.lat) - input.lat) * 69, 2) + Math.pow((Number(l.lng) - input.lng) * 69 * Math.cos(input.lat * Math.PI / 180), 2)) }));
  }),
});
