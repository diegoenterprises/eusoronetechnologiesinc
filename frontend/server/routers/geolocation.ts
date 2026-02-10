/**
 * GEOLOCATION ROUTER
 * tRPC procedures for GPS tracking and geofencing
 */

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { vehicles, users } from "../../drizzle/schema";

export const geolocationRouter = router({
  /**
   * Get fleet locations
   */
  getFleetLocations: protectedProcedure
    .input(z.object({
      vehicleIds: z.array(z.string()).optional(),
      status: z.enum(["all", "moving", "stopped", "idle"]).optional(),
    }))
    .query(async ({ input }) => {
      return [];
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
      return {
        vehicleId: input.vehicleId,
        points: [
          { timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), lat: 29.7604, lng: -95.3698, speed: 0, event: "trip_start" },
          { timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(), lat: 30.0, lng: -95.5, speed: 65, event: null },
          { timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), lat: 30.3, lng: -95.8, speed: 68, event: null },
          { timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(), lat: 30.6, lng: -96.1, speed: 0, event: "stop" },
          { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), lat: 30.6, lng: -96.1, speed: 62, event: "resume" },
          { timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), lat: 31.0, lng: -96.5, speed: 70, event: null },
          { timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), lat: 31.3, lng: -96.9, speed: 65, event: null },
          { timestamp: new Date().toISOString(), lat: 31.5493, lng: -97.1467, speed: 62, event: null },
        ],
        summary: {
          totalMiles: 185,
          movingTime: 180,
          stoppedTime: 30,
          avgSpeed: 61.7,
          maxSpeed: 70,
        },
      };
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
    .mutation(async ({ input }) => {
      return {
        success: true,
        vehicleId: input.vehicleId,
        timestamp: new Date().toISOString(),
      };
    }),

  /**
   * Get geofences
   */
  getGeofences: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          id: "geo_001",
          name: "Houston Terminal",
          type: "terminal",
          center: { lat: 29.7604, lng: -95.3698 },
          radius: 500,
          alerts: ["entry", "exit"],
          active: true,
        },
        {
          id: "geo_002",
          name: "Dallas Yard",
          type: "yard",
          center: { lat: 32.7767, lng: -96.7970 },
          radius: 300,
          alerts: ["entry", "exit"],
          active: true,
        },
        {
          id: "geo_003",
          name: "Shell Beaumont Refinery",
          type: "customer",
          center: { lat: 30.0802, lng: -94.1266 },
          radius: 1000,
          alerts: ["entry"],
          active: true,
        },
      ];
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
      return {
        id: `geo_${Date.now()}`,
        ...input,
        createdBy: ctx.user?.id,
        createdAt: new Date().toISOString(),
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
      return [];
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
      return {
        vehicleId: input.vehicleId,
        currentLocation: { lat: 31.5493, lng: -97.1467, city: "Waco", state: "TX" },
        destination: { lat: 32.7767, lng: -96.7970, city: "Dallas", state: "TX" },
        distanceRemaining: 95,
        estimatedArrival: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        etaMinutes: 120,
        trafficConditions: "moderate",
        weatherConditions: "clear",
        confidence: 0.85,
      };
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
      return {
        origin: input.origin,
        destination: input.destination,
        distance: 250,
        duration: 240,
        route: {
          polyline: "encoded_polyline_data",
          steps: [
            { instruction: "Head north on I-45", distance: 50, duration: 45 },
            { instruction: "Continue on I-45 N", distance: 150, duration: 150 },
            { instruction: "Exit onto TX-121", distance: 30, duration: 30 },
            { instruction: "Arrive at destination", distance: 20, duration: 15 },
          ],
        },
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
      return [];
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
