/**
 * TELEMETRY ROUTER - GPS tracking, geofencing, navigation
 */

import { z } from "zod";
import { eq, desc, sql, and } from "drizzle-orm";
import { adminProcedure as protectedProcedure, router } from "../_core/trpc";
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
  create: protectedProcedure
    .input(locationSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const userId = Number(ctx.user?.id) || 0;
      const [result] = await db.insert(locationHistory).values({
        userId,
        latitude: String(input.latitude),
        longitude: String(input.longitude),
        horizontalAccuracy: input.horizontalAccuracy ? String(input.horizontalAccuracy) : undefined,
        speed: input.speed ? String(input.speed) : undefined,
        heading: input.heading ? String(input.heading) : undefined,
        altitude: input.altitude ? String(input.altitude) : undefined,
        loadId: input.loadId,
        deviceId: input.deviceId,
        deviceTimestamp: new Date(input.deviceTimestamp),
      }).$returningId();
      return { success: true, id: result.id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const updates: Record<string, any> = {};
      if (input.latitude !== undefined) updates.latitude = String(input.latitude);
      if (input.longitude !== undefined) updates.longitude = String(input.longitude);
      if (Object.keys(updates).length > 0) {
        await db.update(locationHistory).set(updates).where(eq(locationHistory.id, input.id));
      }
      return { success: true, id: input.id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      await db.delete(locationHistory).where(eq(locationHistory.id, input.id));
      return { success: true, id: input.id };
    }),

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

  // ═══ ROUTE INTELLIGENCE ("In-House LIDAR") ═══

  // Grid heat — crowd-sourced driver density heatmap for HotZoneMap
  getGridHeat: protectedProcedure.input(z.object({
    hours: z.number().min(1).max(72).default(6),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    try {
      const since = new Date(Date.now() - input.hours * 3600000);
      const rows = await db.execute(sql`
        SELECT grid_lat as lat, grid_lng as lng,
               SUM(ping_count) as density,
               AVG(avg_speed_mph) as avgSpeed,
               MAX(unique_drivers) as drivers
        FROM hz_grid_heat
        WHERE period_start >= ${since}
        GROUP BY grid_lat, grid_lng
        HAVING density > 2
        ORDER BY density DESC
        LIMIT 500
      `);
      return ((rows as any)[0] || []).map((r: any) => ({
        lat: Number(r.lat), lng: Number(r.lng),
        density: Number(r.density), avgSpeed: Number(r.avgSpeed || 0), drivers: Number(r.drivers || 0),
      }));
    } catch { return []; }
  }),

  // Lane intelligence — crowd-sourced lane performance metrics
  getLaneIntelligence: protectedProcedure.input(z.object({
    originState: z.string().length(2).optional(),
    destState: z.string().length(2).optional(),
    hazmatOnly: z.boolean().default(false),
    limit: z.number().min(1).max(100).default(50),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    try {
      const conditions: string[] = ["trip_count >= 1"];
      if (input.originState) conditions.push(`origin_state = '${input.originState}'`);
      if (input.destState) conditions.push(`dest_state = '${input.destState}'`);
      if (input.hazmatOnly) conditions.push("is_hazmat = 1");
      const rows = await db.execute(sql.raw(`
        SELECT origin_city, origin_state, dest_city, dest_state,
               is_hazmat, trip_count, avg_rate_per_mile, avg_total_rate,
               avg_distance_miles, avg_transit_hours, on_time_pct,
               avg_dwell_mins_pickup, avg_dwell_mins_delivery,
               best_day_of_week, best_hour_depart, last_trip_at
        FROM hz_lane_learning
        WHERE ${conditions.join(" AND ")}
        ORDER BY trip_count DESC
        LIMIT ${input.limit}
      `));
      return (rows as any)[0] || [];
    } catch { return []; }
  }),

  // Report completed route — driver submits trip data for ML learning
  reportRouteComplete: protectedProcedure.input(z.object({
    loadId: z.number().optional(),
    originLat: z.number(), originLng: z.number(),
    destLat: z.number(), destLng: z.number(),
    originCity: z.string().optional(), originState: z.string().optional(),
    destCity: z.string().optional(), destState: z.string().optional(),
    distanceMiles: z.number().optional(),
    transitMinutes: z.number().optional(),
    avgSpeedMph: z.number().optional(),
    maxSpeedMph: z.number().optional(),
    stopCount: z.number().default(0),
    fuelStops: z.number().default(0),
    isHazmat: z.boolean().default(false),
    equipmentType: z.string().optional(),
    weatherConditions: z.string().optional(),
    roadQualityScore: z.number().min(1).max(5).optional(),
    congestionScore: z.number().min(1).max(5).optional(),
    routePolyline: z.string().optional(),
    startedAt: z.string(),
    completedAt: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const driverId = Number(ctx.user?.id) || 0;
    try {
      await db.execute(sql`
        INSERT INTO hz_driver_route_reports
        (driver_id, load_id, origin_lat, origin_lng, dest_lat, dest_lng,
         origin_city, origin_state, dest_city, dest_state,
         distance_miles, transit_minutes, avg_speed_mph, max_speed_mph,
         stop_count, fuel_stops, is_hazmat, equipment_type,
         weather_conditions, road_quality_score, congestion_score,
         route_polyline, started_at, completed_at)
        VALUES (${driverId}, ${input.loadId || null},
                ${input.originLat}, ${input.originLng}, ${input.destLat}, ${input.destLng},
                ${input.originCity || null}, ${input.originState || null},
                ${input.destCity || null}, ${input.destState || null},
                ${input.distanceMiles || null}, ${input.transitMinutes || null},
                ${input.avgSpeedMph || null}, ${input.maxSpeedMph || null},
                ${input.stopCount}, ${input.fuelStops},
                ${input.isHazmat ? 1 : 0}, ${input.equipmentType || null},
                ${input.weatherConditions || null}, ${input.roadQualityScore || null},
                ${input.congestionScore || null}, ${input.routePolyline || null},
                ${input.startedAt}, ${input.completedAt})
      `);
      return { success: true };
    } catch (err) {
      console.error("[Telemetry] Route report error:", err);
      return { success: false };
    }
  }),

  // Corridor stats — zone-to-zone aggregate intelligence
  getCorridorStats: protectedProcedure.input(z.object({
    limit: z.number().min(1).max(100).default(25),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    try {
      const rows = await db.execute(sql`
        SELECT origin_zone, dest_zone, corridor_name,
               avg_speed_mph, avg_travel_time_mins, avg_distance_miles,
               trip_count, unique_drivers, congestion_score, reliability_score,
               hazmat_trip_count, last_trip_at
        FROM hz_route_intelligence
        WHERE trip_count >= 1
        ORDER BY trip_count DESC
        LIMIT ${input.limit}
      `);
      return (rows as any)[0] || [];
    } catch { return []; }
  }),

  // Driver mapping stats — how much data this driver has contributed
  getMyMappingStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { totalPings: 0, totalRoutes: 0, totalMiles: 0, avgRoadQuality: 0, firstPing: null, lastPing: null };
    const driverId = Number(ctx.user?.id) || 0;
    try {
      const [pingStats] = await db.execute(sql`
        SELECT COUNT(*) as total, MIN(server_timestamp) as firstPing, MAX(server_timestamp) as lastPing
        FROM location_history WHERE user_id = ${driverId}
      `);
      const [routeStats] = await db.execute(sql`
        SELECT COUNT(*) as routes, SUM(distance_miles) as miles, AVG(road_quality_score) as avgQuality
        FROM hz_driver_route_reports WHERE driver_id = ${driverId}
      `);
      const ps = (pingStats as any)[0] || {};
      const rs = (routeStats as any)[0] || {};
      return {
        totalPings: Number(ps.total || 0),
        totalRoutes: Number(rs.routes || 0),
        totalMiles: Math.round(Number(rs.miles || 0)),
        avgRoadQuality: Number(rs.avgQuality || 0),
        firstPing: ps.firstPing,
        lastPing: ps.lastPing,
      };
    } catch { return { totalPings: 0, totalRoutes: 0, totalMiles: 0, avgRoadQuality: 0, firstPing: null, lastPing: null }; }
  }),

  // Platform-wide mapping intelligence summary
  getMappingIntelligenceSummary: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { totalPings: 0, uniqueDrivers: 0, gridCells: 0, learnedLanes: 0, routeReports: 0, totalMilesMapped: 0 };
    try {
      const [pings] = await db.execute(sql`SELECT COUNT(*) as cnt, COUNT(DISTINCT user_id) as drivers FROM location_history`);
      const [grid] = await db.execute(sql`SELECT COUNT(DISTINCT CONCAT(grid_lat, ',', grid_lng)) as cells FROM hz_grid_heat`);
      const [lanes] = await db.execute(sql`SELECT COUNT(*) as cnt FROM hz_lane_learning WHERE trip_count >= 1`);
      const [routes] = await db.execute(sql`SELECT COUNT(*) as cnt, SUM(distance_miles) as miles FROM hz_driver_route_reports`);
      const p = (pings as any)[0] || {};
      const g = (grid as any)[0] || {};
      const l = (lanes as any)[0] || {};
      const r = (routes as any)[0] || {};
      return {
        totalPings: Number(p.cnt || 0),
        uniqueDrivers: Number(p.drivers || 0),
        gridCells: Number(g.cells || 0),
        learnedLanes: Number(l.cnt || 0),
        routeReports: Number(r.cnt || 0),
        totalMilesMapped: Math.round(Number(r.miles || 0)),
      };
    } catch { return { totalPings: 0, uniqueDrivers: 0, gridCells: 0, learnedLanes: 0, routeReports: 0, totalMilesMapped: 0 }; }
  }),
});
