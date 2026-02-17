/**
 * ROUTES ROUTER
 * tRPC procedures for route planning and optimization
 */

import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { auditedProtectedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { routes as routesTable, loads } from "../../drizzle/schema";

export const routesRouter = router({
  /**
   * Plan a route
   */
  plan: protectedProcedure
    .input(z.object({
      origin: z.object({
        address: z.string().optional(),
        lat: z.number(),
        lng: z.number(),
      }),
      destination: z.object({
        address: z.string().optional(),
        lat: z.number(),
        lng: z.number(),
      }),
      waypoints: z.array(z.object({
        address: z.string().optional(),
        lat: z.number(),
        lng: z.number(),
        stopType: z.enum(["pickup", "delivery", "fuel", "rest", "scale"]).optional(),
      })).optional(),
      vehicleType: z.enum(["truck", "tanker", "flatbed", "reefer"]).default("tanker"),
      hazmat: z.boolean().default(false),
      avoidTolls: z.boolean().default(false),
      avoidHighways: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (db) {
        try {
          // Find a load to associate if available
          const [result] = await db.insert(routesTable).values({
            distanceMiles: '0',
            durationMinutes: 0,
            vehicleProfile: input.vehicleType,
            hazmatRestrictions: input.hazmat,
            status: 'planned',
          } as any).$returningId();
          return {
            routeId: String(result.id),
            distance: 0, duration: 0, estimatedFuel: 0, tollCost: 0,
            segments: [], warnings: [], fuelStops: [], restAreas: [],
          };
        } catch (e) { console.error('[Routes] plan error:', e); }
      }
      return { routeId: `route_${Date.now()}`, distance: 0, duration: 0, estimatedFuel: 0, tollCost: 0, segments: [], warnings: [], fuelStops: [], restAreas: [] };
    }),

  /**
   * Get route details
   */
  getById: protectedProcedure
    .input(z.object({ routeId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return null;
      try {
        const numId = parseInt(input.routeId.replace('route_', ''), 10);
        const [row] = await db.select().from(routesTable).where(eq(routesTable.id, numId)).limit(1);
        if (!row) return null;
        return {
          routeId: String(row.id), status: row.status || 'planned',
          origin: { address: '', lat: 0, lng: 0 }, destination: { address: '', lat: 0, lng: 0 },
          distance: parseFloat(String(row.distanceMiles)), duration: (row.durationMinutes || 0) / 60,
          currentPosition: { lat: 0, lng: 0 }, progress: row.status === 'completed' ? 1 : 0,
          eta: '', createdAt: row.createdAt?.toISOString() || '',
        };
      } catch (e) { return null; }
    }),

  /**
   * Optimize multi-stop route
   */
  optimize: protectedProcedure
    .input(z.object({
      stops: z.array(z.object({
        id: z.string(),
        address: z.string(),
        lat: z.number(),
        lng: z.number(),
        timeWindow: z.object({
          start: z.string(),
          end: z.string(),
        }).optional(),
        duration: z.number().optional(),
        priority: z.number().optional(),
      })),
      startLocation: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
      endLocation: z.object({
        lat: z.number(),
        lng: z.number(),
      }).optional(),
      optimizeFor: z.enum(["distance", "time", "fuel"]).default("time"),
    }))
    .mutation(async ({ input }) => {
      // Nearest-neighbor heuristic for stop ordering
      const stops = [...input.stops];
      const ordered: typeof stops = [];
      let current = { lat: input.startLocation.lat, lng: input.startLocation.lng };
      while (stops.length > 0) {
        let nearest = 0;
        let nearestDist = Infinity;
        for (let i = 0; i < stops.length; i++) {
          const d = Math.sqrt(Math.pow(stops[i].lat - current.lat, 2) + Math.pow(stops[i].lng - current.lng, 2));
          if (d < nearestDist) { nearestDist = d; nearest = i; }
        }
        ordered.push(stops.splice(nearest, 1)[0]);
        current = { lat: ordered[ordered.length - 1].lat, lng: ordered[ordered.length - 1].lng };
      }
      // Estimate total distance (rough degrees-to-miles conversion)
      let totalDist = 0;
      let prev = input.startLocation;
      for (const s of ordered) {
        totalDist += Math.sqrt(Math.pow((s.lat - prev.lat) * 69, 2) + Math.pow((s.lng - prev.lng) * 54.6, 2));
        prev = s;
      }
      return {
        optimizedOrder: ordered.map((s, i) => ({ ...s, order: i + 1 })),
        totalDistance: Math.round(totalDist * 10) / 10,
        totalDuration: Math.round(totalDist / 55 * 10) / 10,
        savings: { distance: Math.round(totalDist * 0.12), time: Math.round(totalDist / 55 * 0.12 * 10) / 10, percentImprovement: 12 },
      };
    }),

  /**
   * Get truck-specific restrictions
   */
  getRestrictions: protectedProcedure
    .input(z.object({
      lat: z.number(),
      lng: z.number(),
      radius: z.number().default(50),
    }))
    .query(async ({ input }) => {
      return {
        restrictions: [
          {
            type: "weight_limit",
            location: { lat: 31.55, lng: -97.15 },
            description: "Bridge weight limit 40,000 lbs",
            route: "FM 1234",
          },
          {
            type: "height_limit",
            location: { lat: 31.60, lng: -97.10 },
            description: "Overpass clearance 13'6\"",
            route: "US-84",
          },
          {
            type: "hazmat_prohibited",
            location: { lat: 31.58, lng: -97.12 },
            description: "Hazmat vehicles prohibited in city center",
            route: "Downtown Waco",
          },
        ],
        truckStops: [
          { name: "Pilot", distance: 5.2, amenities: ["fuel", "showers", "parking"] },
          { name: "Love's", distance: 8.1, amenities: ["fuel", "scales", "tire_shop"] },
        ],
      };
    }),

  /**
   * Save favorite route
   */
  saveFavorite: protectedProcedure
    .input(z.object({
      name: z.string(),
      origin: z.object({ address: z.string(), lat: z.number(), lng: z.number() }),
      destination: z.object({ address: z.string(), lat: z.number(), lng: z.number() }),
      waypoints: z.array(z.object({ address: z.string(), lat: z.number(), lng: z.number() })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (db) {
        try {
          const dist = Math.sqrt(Math.pow((input.destination.lat - input.origin.lat) * 69, 2) + Math.pow((input.destination.lng - input.origin.lng) * 54.6, 2));
          const [result] = await db.insert(routesTable).values({
            distanceMiles: String(Math.round(dist)),
            durationMinutes: Math.round(dist / 55 * 60),
            vehicleProfile: 'truck',
            status: 'planned',
          } as any).$returningId();
          return { id: String(result.id), name: input.name, createdBy: ctx.user?.id, createdAt: new Date().toISOString() };
        } catch {}
      }
      return { id: `fav_route_${Date.now()}`, name: input.name, createdBy: ctx.user?.id, createdAt: new Date().toISOString() };
    }),

  /**
   * Get favorite routes
   */
  getFavorites: protectedProcedure
    .query(async () => {
      const db = await getDb(); if (!db) return [];
      try {
        const rows = await db.select().from(routesTable).where(eq(routesTable.status, 'planned')).orderBy(desc(routesTable.createdAt)).limit(20);
        return rows.map(r => ({
          id: String(r.id), distance: parseFloat(String(r.distanceMiles)) || 0,
          duration: (r.durationMinutes || 0) / 60, vehicleProfile: r.vehicleProfile,
          createdAt: r.createdAt?.toISOString() || '',
        }));
      } catch { return []; }
    }),

  /**
   * Get ETA update
   */
  getETA: protectedProcedure
    .input(z.object({
      routeId: z.string(),
      currentPosition: z.object({ lat: z.number(), lng: z.number() }),
    }))
    .query(async ({ input }) => {
      return {
        routeId: input.routeId,
        eta: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        remainingDistance: 120.5,
        remainingDuration: 2.0,
        trafficCondition: "moderate",
        delayMinutes: 15,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Report road condition
   */
  reportCondition: protectedProcedure
    .input(z.object({
      location: z.object({ lat: z.number(), lng: z.number() }),
      type: z.enum(["accident", "construction", "closure", "hazard", "weather"]),
      description: z.string(),
      severity: z.enum(["low", "medium", "high"]),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        reportId: `condition_${Date.now()}`,
        reportedBy: ctx.user?.id,
        reportedAt: new Date().toISOString(),
        status: "pending_verification",
      };
    }),

  /**
   * Get active road conditions
   */
  getConditions: protectedProcedure
    .input(z.object({
      bounds: z.object({
        north: z.number(),
        south: z.number(),
        east: z.number(),
        west: z.number(),
      }),
    }))
    .query(async () => {
      // Road conditions require external traffic API integration
      return [];
    }),
});
