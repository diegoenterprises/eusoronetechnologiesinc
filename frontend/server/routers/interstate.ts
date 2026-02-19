/**
 * INTERSTATE COMPLIANCE + SOS EMERGENCY ROUTER
 * ═══════════════════════════════════════════════════════════════
 * 
 * tRPC procedures for:
 * - Route compliance analysis (pre-trip)
 * - Active trip data (driver dashboard)
 * - State crossing events
 * - SOS emergency alerts (create, acknowledge, resolve)
 * - IFTA mileage reports
 * - Trip compliance event log
 */

import { z } from "zod";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { adminProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { sosAlerts, tripComplianceEvents, tripStateMiles, loads, users } from "../../drizzle/schema";
import { getIO } from "../services/socketService";
import {
  analyzeRouteCompliance,
  getActiveTripData,
  handleStateCrossing,
  generateIFTAReport,
} from "../services/interstateCompliance";

export const interstateRouter = router({
  // ═══════════════════════════════════════════════════════════════
  // ROUTE COMPLIANCE ANALYSIS
  // ═══════════════════════════════════════════════════════════════

  analyzeRoute: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => {
      return analyzeRouteCompliance(input.loadId);
    }),

  // ═══════════════════════════════════════════════════════════════
  // ACTIVE TRIP DATA — Driver's real-time dashboard
  // ═══════════════════════════════════════════════════════════════

  getActiveTrip: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => {
      return getActiveTripData(input.loadId);
    }),

  // Get driver's current active load (for auto-detecting active trip)
  getMyActiveLoad: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const userId = Number(ctx.user?.id) || 0;
      if (!userId) return null;

      // Find load where this user is the driver and status is in-transit
      const activeStatuses = [
        "en_route_pickup", "at_pickup", "loading", "loaded",
        "in_transit", "at_delivery", "unloading",
      ] as const;

      const [load] = await db.select({
        id: loads.id,
        loadNumber: loads.loadNumber,
        status: loads.status,
        pickupLocation: loads.pickupLocation,
        deliveryLocation: loads.deliveryLocation,
        cargoType: loads.cargoType,
        weight: loads.weight,
        hazmatClass: loads.hazmatClass,
        distance: loads.distance,
        rate: loads.rate,
      }).from(loads)
        .where(and(
          eq(loads.driverId, userId),
          inArray(loads.status, activeStatuses),
        ))
        .orderBy(desc(loads.updatedAt))
        .limit(1);

      return load || null;
    }),

  // ═══════════════════════════════════════════════════════════════
  // COMPLIANCE EVENT LOG
  // ═══════════════════════════════════════════════════════════════

  getComplianceEvents: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select().from(tripComplianceEvents)
        .where(eq(tripComplianceEvents.loadId, input.loadId))
        .orderBy(desc(tripComplianceEvents.createdAt))
        .limit(input.limit);
      return rows;
    }),

  // ═══════════════════════════════════════════════════════════════
  // IFTA REPORT
  // ═══════════════════════════════════════════════════════════════

  getIFTAReport: protectedProcedure
    .input(z.object({
      vehicleId: z.number().optional(),
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      return generateIFTAReport({
        vehicleId: input.vehicleId,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
      });
    }),

  // Get state miles for a specific load
  getStateMiles: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(tripStateMiles)
        .where(eq(tripStateMiles.loadId, input.loadId))
        .orderBy(tripStateMiles.stateCode);
    }),

  // ═══════════════════════════════════════════════════════════════
  // SOS EMERGENCY SYSTEM
  // ═══════════════════════════════════════════════════════════════

  createSOS: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      alertType: z.enum(["medical", "mechanical", "hazmat_spill", "accident", "threat", "weather", "other"]),
      severity: z.enum(["low", "medium", "high", "critical"]).optional().default("high"),
      latitude: z.number(),
      longitude: z.number(),
      description: z.string().optional(),
      stateCode: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const driverId = Number(ctx.user?.id) || 0;

      // Get load details for context
      const [load] = await db.select().from(loads).where(eq(loads.id, input.loadId)).limit(1);
      if (!load) throw new Error("Load not found");

      // Determine all users involved in this load transaction
      const involvedUserIds: number[] = [];
      if (load.shipperId) involvedUserIds.push(load.shipperId);
      if (load.catalystId) involvedUserIds.push(load.catalystId);
      if (load.driverId && load.driverId !== driverId) involvedUserIds.push(load.driverId);

      // Get dispatch/admin users to also notify
      const admins = await db.select({ id: users.id }).from(users)
        .where(inArray(users.role, ["ADMIN", "SUPER_ADMIN", "DISPATCH", "SAFETY_MANAGER"]));
      for (const a of admins) {
        if (!involvedUserIds.includes(a.id)) involvedUserIds.push(a.id);
      }

      // Insert SOS alert
      const [result] = await db.insert(sosAlerts).values({
        loadId: input.loadId,
        driverId,
        vehicleId: load.vehicleId,
        alertType: input.alertType,
        severity: input.severity,
        latitude: String(input.latitude),
        longitude: String(input.longitude),
        description: input.description || null,
        stateCode: input.stateCode || null,
        notifiedUsers: involvedUserIds,
      }).$returningId();

      const sosId = result.id;

      // Get driver name
      const [driver] = await db.select({ name: users.name }).from(users).where(eq(users.id, driverId)).limit(1);

      // Broadcast SOS to ALL involved parties via WebSocket
      const io = getIO();
      if (io) {
        const sosPayload = {
          sosId,
          loadId: input.loadId,
          loadNumber: load.loadNumber,
          driverId,
          driverName: driver?.name || "Driver",
          alertType: input.alertType,
          severity: input.severity,
          latitude: input.latitude,
          longitude: input.longitude,
          description: input.description,
          stateCode: input.stateCode,
          status: "active",
          timestamp: new Date().toISOString(),
        };

        // Broadcast to load room
        io.to(`load:${input.loadId}`).emit("sos:alert", sosPayload);

        // Broadcast to each involved user's personal room
        for (const uid of involvedUserIds) {
          io.to(`user:${uid}`).emit("sos:alert", sosPayload);
        }

        // Broadcast to role rooms for maximum visibility
        io.to("role:dispatch").emit("sos:alert", sosPayload);
        io.to("role:admin").emit("sos:alert", sosPayload);
        io.to("role:super_admin").emit("sos:alert", sosPayload);
        io.to("role:safety_manager").emit("sos:alert", sosPayload);
        io.to("role:compliance_officer").emit("sos:alert", sosPayload);

        // If it's a catalyst/shipper involved, notify their roles too
        io.to("role:catalyst").emit("sos:alert", sosPayload);
        io.to("role:shipper").emit("sos:alert", sosPayload);
        io.to("role:broker").emit("sos:alert", sosPayload);
      }

      return { sosId, notifiedCount: involvedUserIds.length };
    }),

  acknowledgeSOS: protectedProcedure
    .input(z.object({ sosId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = Number(ctx.user?.id) || 0;

      await db.update(sosAlerts)
        .set({
          status: "acknowledged",
          acknowledgedBy: userId,
          acknowledgedAt: new Date(),
        })
        .where(eq(sosAlerts.id, input.sosId));

      // Get alert for broadcast
      const [alert] = await db.select().from(sosAlerts).where(eq(sosAlerts.id, input.sosId)).limit(1);
      const [acker] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);

      const io = getIO();
      if (io && alert) {
        const payload = {
          sosId: input.sosId,
          loadId: alert.loadId,
          status: "acknowledged",
          acknowledgedBy: userId,
          acknowledgedByName: acker?.name || "User",
          timestamp: new Date().toISOString(),
        };
        io.to(`load:${alert.loadId}`).emit("sos:update", payload);
        io.to("role:dispatch").emit("sos:update", payload);
        io.to("role:admin").emit("sos:update", payload);
        // Notify driver directly
        if (alert.driverId) io.to(`user:${alert.driverId}`).emit("sos:update", payload);
      }

      return { success: true };
    }),

  resolveSOS: protectedProcedure
    .input(z.object({
      sosId: z.number(),
      resolutionNotes: z.string().optional(),
      isFalseAlarm: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = Number(ctx.user?.id) || 0;

      await db.update(sosAlerts)
        .set({
          status: input.isFalseAlarm ? "false_alarm" : "resolved",
          resolvedBy: userId,
          resolvedAt: new Date(),
          resolutionNotes: input.resolutionNotes || null,
        })
        .where(eq(sosAlerts.id, input.sosId));

      const [alert] = await db.select().from(sosAlerts).where(eq(sosAlerts.id, input.sosId)).limit(1);
      const [resolver] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);

      const io = getIO();
      if (io && alert) {
        const payload = {
          sosId: input.sosId,
          loadId: alert.loadId,
          status: input.isFalseAlarm ? "false_alarm" : "resolved",
          resolvedBy: userId,
          resolvedByName: resolver?.name || "User",
          resolutionNotes: input.resolutionNotes,
          timestamp: new Date().toISOString(),
        };
        io.to(`load:${alert.loadId}`).emit("sos:resolved", payload);
        io.to("role:dispatch").emit("sos:resolved", payload);
        io.to("role:admin").emit("sos:resolved", payload);
        if (alert.driverId) io.to(`user:${alert.driverId}`).emit("sos:resolved", payload);
      }

      return { success: true };
    }),

  getActiveSOSAlerts: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];

      const alerts = await db.select({
        id: sosAlerts.id,
        loadId: sosAlerts.loadId,
        driverId: sosAlerts.driverId,
        alertType: sosAlerts.alertType,
        severity: sosAlerts.severity,
        status: sosAlerts.status,
        latitude: sosAlerts.latitude,
        longitude: sosAlerts.longitude,
        description: sosAlerts.description,
        stateCode: sosAlerts.stateCode,
        createdAt: sosAlerts.createdAt,
      }).from(sosAlerts)
        .where(inArray(sosAlerts.status, ["active", "acknowledged", "responding"]))
        .orderBy(desc(sosAlerts.createdAt));

      return alerts;
    }),

  getSOSForLoad: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(sosAlerts)
        .where(eq(sosAlerts.loadId, input.loadId))
        .orderBy(desc(sosAlerts.createdAt));
    }),
});
