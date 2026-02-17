/**
 * NAVIGATION ROUTER - Route calculation, directions, ETA, waypoints
 */

import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { auditedProtectedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { routes, routeWaypoints, etaHistory, loads } from "../../drizzle/schema";

const vehicleProfileSchema = z.object({
  height: z.number().optional(),
  width: z.number().optional(),
  length: z.number().optional(),
  weight: z.number().optional(),
  axles: z.number().optional(),
  hazmatClass: z.string().optional(),
  isOversize: z.boolean().default(false),
  isOverweight: z.boolean().default(false),
});

export const navigationRouter = router({
  // Calculate a route for a load
  calculateRoute: protectedProcedure.input(z.object({
    loadId: z.number(),
    originLat: z.number(),
    originLng: z.number(),
    destLat: z.number(),
    destLng: z.number(),
    vehicleProfile: vehicleProfileSchema.optional(),
    avoidTolls: z.boolean().default(false),
    avoidHighways: z.boolean().default(false),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Calculate distance using Haversine formula (will be replaced by API)
    const R = 3959; // Earth radius in miles
    const dLat = (input.destLat - input.originLat) * Math.PI / 180;
    const dLng = (input.destLng - input.originLng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(input.originLat * Math.PI / 180) * Math.cos(input.destLat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    const distanceMiles = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.3; // 1.3 factor for road distance
    const durationMinutes = Math.round(distanceMiles / 55 * 60); // Avg 55 mph

    // Create encoded polyline (simplified - just origin and destination)
    const polyline = `${input.originLat},${input.originLng};${input.destLat},${input.destLng}`;

    const [route] = await db.insert(routes).values({
      loadId: input.loadId,
      distanceMiles: String(distanceMiles.toFixed(2)),
      durationMinutes,
      durationInTraffic: Math.round(durationMinutes * 1.15),
      polyline,
      vehicleProfile: input.vehicleProfile || null,
      estimatedFuelCost: String((distanceMiles / 6.5 * 4.2).toFixed(2)),
      status: "planned",
    }).$returningId();

    // Create origin and destination waypoints
    await db.insert(routeWaypoints).values([
      { routeId: route.id, sequence: 0, type: "origin", name: "Origin", latitude: String(input.originLat), longitude: String(input.originLng), status: "upcoming" },
      { routeId: route.id, sequence: 1, type: "destination", name: "Destination", latitude: String(input.destLat), longitude: String(input.destLng), status: "upcoming" },
    ]);

    // Record initial ETA
    const eta = new Date(Date.now() + durationMinutes * 60 * 1000);
    await db.insert(etaHistory).values({
      loadId: input.loadId,
      destination: "Final Destination",
      predictedEta: eta,
      remainingMiles: String(distanceMiles.toFixed(2)),
      remainingMinutes: durationMinutes,
      confidence: "medium",
      changeReason: "initial",
    });

    return { success: true, routeId: route.id, distanceMiles: Number(distanceMiles.toFixed(2)), durationMinutes, eta: eta.toISOString() };
  }),

  // Get route details
  getRoute: protectedProcedure.input(z.object({ routeId: z.number().optional(), loadId: z.number().optional() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;

    let route;
    if (input.routeId) {
      [route] = await db.select().from(routes).where(eq(routes.id, input.routeId)).limit(1);
    } else if (input.loadId) {
      [route] = await db.select().from(routes).where(eq(routes.loadId, input.loadId)).orderBy(desc(routes.createdAt)).limit(1);
    }

    if (!route) return null;

    const waypoints = await db.select().from(routeWaypoints).where(eq(routeWaypoints.routeId, route.id)).orderBy(routeWaypoints.sequence);

    return {
      id: route.id,
      loadId: route.loadId,
      distanceMiles: Number(route.distanceMiles),
      durationMinutes: route.durationMinutes,
      durationInTraffic: route.durationInTraffic,
      polyline: route.polyline,
      vehicleProfile: route.vehicleProfile,
      estimatedFuelCost: route.estimatedFuelCost ? Number(route.estimatedFuelCost) : null,
      tollCost: route.tollCost ? Number(route.tollCost) : null,
      status: route.status,
      waypoints: waypoints.map(w => ({
        id: w.id,
        sequence: w.sequence,
        type: w.type,
        name: w.name,
        address: w.address,
        lat: Number(w.latitude),
        lng: Number(w.longitude),
        plannedArrival: w.plannedArrival?.toISOString(),
        actualArrival: w.actualArrival?.toISOString(),
        status: w.status,
      })),
    };
  }),

  // Get current ETA
  getETA: protectedProcedure.input(z.object({ loadId: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;

    const [eta] = await db.select().from(etaHistory).where(eq(etaHistory.loadId, input.loadId)).orderBy(desc(etaHistory.createdAt)).limit(1);

    if (!eta) return null;

    return {
      loadId: eta.loadId,
      predictedEta: eta.predictedEta?.toISOString(),
      remainingMiles: eta.remainingMiles ? Number(eta.remainingMiles) : null,
      remainingMinutes: eta.remainingMinutes,
      confidence: eta.confidence,
      changeMinutes: eta.changeMinutes,
      changeReason: eta.changeReason,
      updatedAt: eta.createdAt?.toISOString(),
    };
  }),

  // Update ETA based on current position
  updateETA: protectedProcedure.input(z.object({ loadId: z.number(), currentLat: z.number(), currentLng: z.number(), destLat: z.number().optional(), destLng: z.number().optional() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Get previous ETA
    const [prevEta] = await db.select().from(etaHistory).where(eq(etaHistory.loadId, input.loadId)).orderBy(desc(etaHistory.createdAt)).limit(1);

    // Get route for destination
    const [route] = await db.select().from(routes).where(eq(routes.loadId, input.loadId)).orderBy(desc(routes.createdAt)).limit(1);

    let destLat = input.destLat;
    let destLng = input.destLng;

    if (!destLat || !destLng) {
      // Get destination from waypoints
      if (route) {
        const [dest] = await db.select().from(routeWaypoints).where(and(eq(routeWaypoints.routeId, route.id), eq(routeWaypoints.type, "destination"))).limit(1);
        if (dest) {
          destLat = Number(dest.latitude);
          destLng = Number(dest.longitude);
        }
      }
    }

    if (!destLat || !destLng) throw new Error("Destination not found");

    // Calculate new ETA
    const R = 3959;
    const dLat = (destLat - input.currentLat) * Math.PI / 180;
    const dLng = (destLng - input.currentLng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(input.currentLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    const remainingMiles = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.3;
    const remainingMinutes = Math.round(remainingMiles / 55 * 60);

    const newEta = new Date(Date.now() + remainingMinutes * 60 * 1000);
    const changeMinutes = prevEta ? Math.round((newEta.getTime() - new Date(prevEta.predictedEta!).getTime()) / 60000) : 0;

    await db.insert(etaHistory).values({
      loadId: input.loadId,
      predictedEta: newEta,
      remainingMiles: String(remainingMiles.toFixed(2)),
      remainingMinutes,
      confidence: remainingMiles < 50 ? "high" : remainingMiles < 200 ? "medium" : "low",
      previousEta: prevEta?.predictedEta,
      changeMinutes: Math.abs(changeMinutes) > 5 ? changeMinutes : null,
      changeReason: Math.abs(changeMinutes) > 5 ? "recalculation" : null,
      currentLat: String(input.currentLat),
      currentLng: String(input.currentLng),
    });

    return { success: true, eta: newEta.toISOString(), remainingMiles: Number(remainingMiles.toFixed(2)), remainingMinutes, changeMinutes };
  }),

  // Get ETA history
  getETAHistory: protectedProcedure.input(z.object({ loadId: z.number(), limit: z.number().default(50) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];

    const history = await db.select().from(etaHistory).where(eq(etaHistory.loadId, input.loadId)).orderBy(desc(etaHistory.createdAt)).limit(input.limit);

    return history.map(h => ({
      predictedEta: h.predictedEta?.toISOString(),
      remainingMiles: h.remainingMiles ? Number(h.remainingMiles) : null,
      remainingMinutes: h.remainingMinutes,
      confidence: h.confidence,
      changeMinutes: h.changeMinutes,
      changeReason: h.changeReason,
      timestamp: h.createdAt?.toISOString(),
    }));
  }),

  // Update waypoint status
  updateWaypointStatus: protectedProcedure.input(z.object({ waypointId: z.number(), status: z.enum(["upcoming", "approaching", "arrived", "departed", "skipped"]), actualArrival: z.string().optional(), actualDeparture: z.string().optional() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    await db.update(routeWaypoints).set({
      status: input.status,
      ...(input.actualArrival && { actualArrival: new Date(input.actualArrival) }),
      ...(input.actualDeparture && { actualDeparture: new Date(input.actualDeparture) }),
    }).where(eq(routeWaypoints.id, input.waypointId));

    return { success: true };
  }),

  // Activate route
  activateRoute: protectedProcedure.input(z.object({ routeId: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.update(routes).set({ status: "active" }).where(eq(routes.id, input.routeId));
    return { success: true };
  }),

  // Complete route
  completeRoute: protectedProcedure.input(z.object({ routeId: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.update(routes).set({ status: "completed" }).where(eq(routes.id, input.routeId));
    return { success: true };
  }),
});
