/**
 * GEOLOCATION ROUTER
 * tRPC procedures for GPS tracking and geofencing
 */

import { z } from "zod";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { vehicles, users, geofences, geofenceEvents, locationHistory, gpsTracking } from "../../drizzle/schema";

export const geolocationRouter = router({
  /**
   * Get fleet locations
   */
  getFleetLocations: protectedProcedure
    .input(z.object({
      vehicleIds: z.array(z.string()).optional(),
      status: z.enum(["all", "moving", "stopped", "idle"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const companyId = ctx.user?.companyId || 0;
        const rows = await db.select({
          id: vehicles.id, vehicleType: vehicles.vehicleType, make: vehicles.make, model: vehicles.model,
          status: vehicles.status, currentLocation: vehicles.currentLocation, lastGPSUpdate: vehicles.lastGPSUpdate,
          currentDriverId: vehicles.currentDriverId, licensePlate: vehicles.licensePlate,
        }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true)));
        return rows.map(v => {
          const loc = v.currentLocation as { lat: number; lng: number } | null;
          return {
            vehicleId: String(v.id), vehicleType: v.vehicleType, make: v.make, model: v.model,
            licensePlate: v.licensePlate, status: v.status, driverId: v.currentDriverId ? String(v.currentDriverId) : null,
            location: loc ? { lat: loc.lat, lng: loc.lng } : null,
            lastUpdate: v.lastGPSUpdate?.toISOString() || null,
          };
        });
      } catch (e) { console.error('[Geolocation] getFleetLocations error:', e); return []; }
    }),

  /**
   * Get vehicle location history
   */
  getLocationHistory: protectedProcedure
    .input(z.object({
      vehicleId: z.string(),
      startTime: z.string(),
      endTime: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return { vehicleId: input.vehicleId, points: [], summary: { totalMiles: 0, movingTime: 0, stoppedTime: 0, avgSpeed: 0, maxSpeed: 0 } };
      try {
        const vid = parseInt(input.vehicleId);
        const startDate = new Date(input.startTime);
        const endDate = input.endTime ? new Date(input.endTime) : new Date();
        const rows = await db.select().from(gpsTracking).where(and(
          eq(gpsTracking.vehicleId, vid),
          gte(gpsTracking.timestamp, startDate),
          sql`${gpsTracking.timestamp} <= ${endDate}`,
        )).orderBy(gpsTracking.timestamp).limit(500);
        const points = rows.map(r => ({
          timestamp: r.timestamp?.toISOString() || '',
          lat: parseFloat(String(r.latitude)),
          lng: parseFloat(String(r.longitude)),
          speed: r.speed ? parseFloat(String(r.speed)) : 0,
          heading: r.heading ? parseFloat(String(r.heading)) : null,
          event: null,
        }));
        const speeds = points.map(p => p.speed).filter(s => s > 0);
        const avgSpeed = speeds.length > 0 ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length * 10) / 10 : 0;
        const maxSpeed = speeds.length > 0 ? Math.round(Math.max(...speeds) * 10) / 10 : 0;
        return {
          vehicleId: input.vehicleId, points,
          summary: { totalMiles: 0, movingTime: 0, stoppedTime: 0, avgSpeed, maxSpeed },
        };
      } catch (e) { console.error('[Geolocation] getLocationHistory error:', e); return { vehicleId: input.vehicleId, points: [], summary: { totalMiles: 0, movingTime: 0, stoppedTime: 0, avgSpeed: 0, maxSpeed: 0 } }; }
    }),

  /**
   * Update vehicle location (from ELD/GPS device)
   */
  updateLocation: protectedProcedure
    .input(z.object({
      vehicleId: z.string(),
      location: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
      heading: z.number().optional(),
      speed: z.number().optional(),
      odometer: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return { success: false, vehicleId: input.vehicleId, timestamp: new Date().toISOString() };
      try {
        const vid = parseInt(input.vehicleId);
        const now = new Date();
        await db.update(vehicles).set({
          currentLocation: { lat: input.location.lat, lng: input.location.lng },
          lastGPSUpdate: now,
        }).where(eq(vehicles.id, vid));
        await db.insert(gpsTracking).values({
          vehicleId: vid, driverId: ctx.user?.id || 0,
          latitude: String(input.location.lat), longitude: String(input.location.lng),
          speed: input.speed !== undefined ? String(input.speed) : null,
          heading: input.heading !== undefined ? String(input.heading) : null,
          timestamp: now,
        });
        return { success: true, vehicleId: input.vehicleId, timestamp: now.toISOString() };
      } catch (e) { console.error('[Geolocation] updateLocation error:', e); return { success: false, vehicleId: input.vehicleId, timestamp: new Date().toISOString() }; }
    }),

  /**
   * Get geofences
   */
  getGeofences: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const companyId = ctx.user?.companyId || 0;
        const rows = await db.select().from(geofences).where(and(
          eq(geofences.companyId, companyId), eq(geofences.isActive, true),
        )).orderBy(desc(geofences.createdAt));
        return rows.map(g => {
          const center = g.center as { lat: number; lng: number } | null;
          const alerts: string[] = [];
          if (g.alertOnEnter) alerts.push('entry');
          if (g.alertOnExit) alerts.push('exit');
          if (g.alertOnDwell) alerts.push('dwell');
          return {
            id: String(g.id), name: g.name, type: g.type, description: g.description || '',
            center: center || { lat: 0, lng: 0 },
            radius: g.radius ? parseFloat(String(g.radius)) : g.radiusMeters || 0,
            alerts, active: g.isActive,
            createdAt: g.createdAt?.toISOString() || '',
          };
        });
      } catch (e) { console.error('[Geolocation] getGeofences error:', e); return []; }
    }),

  /**
   * Create geofence
   */
  createGeofence: protectedProcedure
    .input(z.object({
      name: z.string(),
      type: z.enum(["terminal", "yard", "customer", "restricted", "custom"]),
      center: z.object({ lat: z.number(), lng: z.number() }),
      radius: z.number(),
      alerts: z.array(z.enum(["entry", "exit", "dwell"])),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error('Database unavailable');
      const typeMap: Record<string, string> = { terminal: 'terminal', yard: 'warehouse', customer: 'customer_site', restricted: 'hazmat_restricted', custom: 'custom' };
      const [result] = await db.insert(geofences).values({
        name: input.name,
        type: (typeMap[input.type] || 'custom') as any,
        center: input.center,
        radius: String(input.radius),
        radiusMeters: Math.round(input.radius),
        companyId: ctx.user?.companyId || 0,
        createdBy: ctx.user?.id || 0,
        alertOnEnter: input.alerts.includes('entry'),
        alertOnExit: input.alerts.includes('exit'),
        alertOnDwell: input.alerts.includes('dwell'),
      }).$returningId();
      return {
        id: String(result.id), name: input.name, type: input.type,
        center: input.center, radius: input.radius, alerts: input.alerts,
        createdBy: ctx.user?.id, createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Get geofence events
   */
  getGeofenceEvents: protectedProcedure
    .input(z.object({
      geofenceId: z.string().optional(),
      vehicleId: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const conds: any[] = [];
        if (input.geofenceId) conds.push(eq(geofenceEvents.geofenceId, parseInt(input.geofenceId)));
        if (input.vehicleId) conds.push(eq(geofenceEvents.userId, parseInt(input.vehicleId)));
        const rows = await db.select({
          id: geofenceEvents.id, geofenceId: geofenceEvents.geofenceId,
          userId: geofenceEvents.userId, eventType: geofenceEvents.eventType,
          lat: geofenceEvents.latitude, lng: geofenceEvents.longitude,
          dwellSeconds: geofenceEvents.dwellSeconds,
          eventTimestamp: geofenceEvents.eventTimestamp,
          geofenceName: geofences.name,
        }).from(geofenceEvents)
          .leftJoin(geofences, eq(geofenceEvents.geofenceId, geofences.id))
          .where(conds.length > 0 ? and(...conds) : undefined)
          .orderBy(desc(geofenceEvents.eventTimestamp))
          .limit(input.limit);
        return rows.map(r => ({
          id: String(r.id), geofenceId: String(r.geofenceId), geofenceName: r.geofenceName || '',
          userId: r.userId, eventType: r.eventType,
          location: { lat: parseFloat(String(r.lat)), lng: parseFloat(String(r.lng)) },
          dwellSeconds: r.dwellSeconds || 0,
          timestamp: r.eventTimestamp?.toISOString() || '',
        }));
      } catch (e) { console.error('[Geolocation] getGeofenceEvents error:', e); return []; }
    }),

  /**
   * Get ETA for vehicle
   */
  getETA: protectedProcedure
    .input(z.object({
      vehicleId: z.string(),
      destination: z.object({
        lat: z.number(),
        lng: z.number(),
      }).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return null;
      try {
        const vid = parseInt(input.vehicleId);
        const [vehicle] = await db.select({ currentLocation: vehicles.currentLocation, lastGPSUpdate: vehicles.lastGPSUpdate })
          .from(vehicles).where(eq(vehicles.id, vid)).limit(1);
        if (!vehicle?.currentLocation) return null;
        const loc = vehicle.currentLocation as { lat: number; lng: number };
        const dest = input.destination || { lat: 0, lng: 0 };
        const R = 3959;
        const dLat = (dest.lat - loc.lat) * Math.PI / 180;
        const dLng = (dest.lng - loc.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(loc.lat * Math.PI / 180) * Math.cos(dest.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        const straightLine = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const roadDistance = Math.round(straightLine * 1.3);
        const etaMinutes = Math.round(roadDistance / 55 * 60);
        return {
          vehicleId: input.vehicleId,
          currentLocation: { lat: loc.lat, lng: loc.lng },
          destination: dest,
          distanceRemaining: roadDistance,
          estimatedArrival: new Date(Date.now() + etaMinutes * 60000).toISOString(),
          etaMinutes,
          lastUpdate: vehicle.lastGPSUpdate?.toISOString() || null,
          confidence: vehicle.lastGPSUpdate && (Date.now() - vehicle.lastGPSUpdate.getTime()) < 600000 ? 0.9 : 0.6,
        };
      } catch (e) { console.error('[Geolocation] getETA error:', e); return null; }
    }),

  /**
   * Calculate route distance
   */
  calculateDistance: protectedProcedure
    .input(z.object({
      origin: z.object({ lat: z.number(), lng: z.number() }),
      destination: z.object({ lat: z.number(), lng: z.number() }),
      waypoints: z.array(z.object({ lat: z.number(), lng: z.number() })).optional(),
    }))
    .query(async ({ input }) => {
      const R = 3959;
      let totalStraight = 0;
      const pts = [input.origin, ...(input.waypoints || []), input.destination];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i]; const b = pts[i + 1];
        const dLat = (b.lat - a.lat) * Math.PI / 180;
        const dLng = (b.lng - a.lng) * Math.PI / 180;
        const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        totalStraight += R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
      }
      const roadDistance = Math.round(totalStraight * 1.3);
      const durationMinutes = Math.round(roadDistance / 55 * 60);
      return {
        origin: input.origin, destination: input.destination,
        distance: roadDistance, duration: durationMinutes,
        waypointCount: input.waypoints?.length || 0,
      };
    }),

  /**
   * Find nearest trucks to location
   */
  findNearestTrucks: protectedProcedure
    .input(z.object({
      location: z.object({ lat: z.number(), lng: z.number() }),
      radius: z.number().default(100),
      available: z.boolean().default(true),
    }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const conds: any[] = [eq(vehicles.isActive, true)];
        if (input.available) conds.push(eq(vehicles.status, 'available'));
        const rows = await db.select({
          id: vehicles.id, vehicleType: vehicles.vehicleType, make: vehicles.make, model: vehicles.model,
          status: vehicles.status, currentLocation: vehicles.currentLocation, lastGPSUpdate: vehicles.lastGPSUpdate,
          companyId: vehicles.companyId, licensePlate: vehicles.licensePlate,
        }).from(vehicles).where(and(...conds)).limit(200);
        const R = 3959;
        const results = rows.map(v => {
          const loc = v.currentLocation as { lat: number; lng: number } | null;
          if (!loc) return null;
          const dLat = (loc.lat - input.location.lat) * Math.PI / 180;
          const dLng = (loc.lng - input.location.lng) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(input.location.lat * Math.PI / 180) * Math.cos(loc.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
          const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          if (dist > input.radius) return null;
          return { vehicleId: String(v.id), vehicleType: v.vehicleType, make: v.make, model: v.model, licensePlate: v.licensePlate, status: v.status, location: loc, distanceMiles: Math.round(dist * 10) / 10, lastUpdate: v.lastGPSUpdate?.toISOString() || null };
        }).filter(Boolean);
        return results.sort((a: any, b: any) => a.distanceMiles - b.distanceMiles).slice(0, 20);
      } catch (e) { console.error('[Geolocation] findNearestTrucks error:', e); return []; }
    }),

  /**
   * Update authenticated user's GPS location (persisted to DB)
   * Called continuously from browser watchPosition
   */
  updateMyLocation: protectedProcedure
    .input(z.object({
      lat: z.number(),
      lng: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user?.id;
      if (!db || !userId) return { success: false };

      try {
        await db.update(users)
          .set({
            currentLocation: { lat: input.lat, lng: input.lng },
            lastGPSUpdate: new Date(),
          })
          .where(eq(users.id, userId));

        return { success: true, lat: input.lat, lng: input.lng, timestamp: new Date().toISOString() };
      } catch (err) {
        console.error("[Geo] updateMyLocation error:", err);
        return { success: true, lat: input.lat, lng: input.lng, timestamp: new Date().toISOString() };
      }
    }),

  /**
   * Get authenticated user's last known location
   */
  getMyLocation: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      const userId = ctx.user?.id;
      if (!db || !userId) return null;

      try {
        const [user] = await db.select({
          currentLocation: users.currentLocation,
          lastGPSUpdate: users.lastGPSUpdate,
        }).from(users).where(eq(users.id, userId));

        return user?.currentLocation ? {
          lat: (user.currentLocation as any).lat,
          lng: (user.currentLocation as any).lng,
          city: (user.currentLocation as any).city,
          state: (user.currentLocation as any).state,
          lastUpdated: user.lastGPSUpdate?.toISOString() || null,
        } : null;
      } catch {
        return null;
      }
    }),
});
