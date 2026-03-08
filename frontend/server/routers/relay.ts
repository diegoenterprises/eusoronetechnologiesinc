/**
 * RELAY MODE ROUTER — Multi-Driver Load Handoff (GAP-128)
 * Manages relay legs: splitting a load into sequential driver segments,
 * assigning drivers to each leg, tracking handoffs, and seal verification.
 *
 * Roles:
 *   Dispatcher/Fleet: create relay plan, assign drivers, monitor handoffs
 *   Driver:           view assigned legs, confirm handoff, verify seals
 *   Shipper:          view relay progress for their loads
 *   Admin:            full access
 */

import { z } from "zod";
import { eq, and, asc, desc, sql, count } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loadRelayLegs, loads, users } from "../../drizzle/schema";

const handoffTypeEnum = z.enum(["drop_and_hook", "live_transfer", "yard_relay", "terminal_swap"]);

const legStatusEnum = z.enum([
  "planned", "driver_assigned", "en_route", "at_handoff",
  "handed_off", "completed", "cancelled",
]);

const legInput = z.object({
  originFacility: z.string().max(255).optional(),
  originAddress: z.string().max(500).optional(),
  originCity: z.string().max(100).optional(),
  originState: z.string().max(50).optional(),
  originLat: z.number().optional(),
  originLng: z.number().optional(),
  destFacility: z.string().max(255).optional(),
  destAddress: z.string().max(500).optional(),
  destCity: z.string().max(100).optional(),
  destState: z.string().max(50).optional(),
  destLat: z.number().optional(),
  destLng: z.number().optional(),
  plannedStartAt: z.string().optional(),
  plannedEndAt: z.string().optional(),
  handoffType: handoffTypeEnum.optional(),
  legDistance: z.number().optional(),
  legRate: z.number().optional(),
  sealNumber: z.string().max(50).optional(),
  notes: z.string().optional(),
});

export const relayRouter = router({
  // ══════════════════════════════════════════════════════════════════
  // 1. GET RELAY LEGS — All legs for a load, ordered by leg number
  // ══════════════════════════════════════════════════════════════════
  getLegs: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const rows = await db
          .select({
            id: loadRelayLegs.id,
            loadId: loadRelayLegs.loadId,
            legNumber: loadRelayLegs.legNumber,
            driverId: loadRelayLegs.driverId,
            vehicleId: loadRelayLegs.vehicleId,
            status: loadRelayLegs.status,
            originFacility: loadRelayLegs.originFacility,
            originAddress: loadRelayLegs.originAddress,
            originCity: loadRelayLegs.originCity,
            originState: loadRelayLegs.originState,
            originLat: loadRelayLegs.originLat,
            originLng: loadRelayLegs.originLng,
            destFacility: loadRelayLegs.destFacility,
            destAddress: loadRelayLegs.destAddress,
            destCity: loadRelayLegs.destCity,
            destState: loadRelayLegs.destState,
            destLat: loadRelayLegs.destLat,
            destLng: loadRelayLegs.destLng,
            plannedStartAt: loadRelayLegs.plannedStartAt,
            plannedEndAt: loadRelayLegs.plannedEndAt,
            actualStartAt: loadRelayLegs.actualStartAt,
            actualEndAt: loadRelayLegs.actualEndAt,
            handoffType: loadRelayLegs.handoffType,
            handoffNotes: loadRelayLegs.handoffNotes,
            handoffConfirmedByDriverId: loadRelayLegs.handoffConfirmedByDriverId,
            handoffConfirmedAt: loadRelayLegs.handoffConfirmedAt,
            legDistance: loadRelayLegs.legDistance,
            legRate: loadRelayLegs.legRate,
            sealNumber: loadRelayLegs.sealNumber,
            sealVerified: loadRelayLegs.sealVerified,
            notes: loadRelayLegs.notes,
            createdAt: loadRelayLegs.createdAt,
            driverName: users.name,
          })
          .from(loadRelayLegs)
          .leftJoin(users, eq(loadRelayLegs.driverId, users.id))
          .where(eq(loadRelayLegs.loadId, input.loadId))
          .orderBy(asc(loadRelayLegs.legNumber));

        return rows.map((r) => ({
          ...r,
          legDistance: r.legDistance ? parseFloat(r.legDistance) : null,
          legRate: r.legRate ? parseFloat(r.legRate) : null,
          originLat: r.originLat ? parseFloat(r.originLat) : null,
          originLng: r.originLng ? parseFloat(r.originLng) : null,
          destLat: r.destLat ? parseFloat(r.destLat) : null,
          destLng: r.destLng ? parseFloat(r.destLng) : null,
        }));
      } catch (error) {
        console.error("[Relay] getLegs error:", error);
        return [];
      }
    }),

  // ══════════════════════════════════════════════════════════════════
  // 2. CREATE RELAY PLAN — Split a load into N relay legs
  // ══════════════════════════════════════════════════════════════════
  createPlan: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      legs: z.array(legInput).min(2, "Relay requires at least 2 legs"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Verify load exists
      const [load] = await db.select({ id: loads.id, loadNumber: loads.loadNumber })
        .from(loads).where(eq(loads.id, input.loadId)).limit(1);
      if (!load) throw new Error("Load not found");

      // Delete any existing relay legs for this load
      await db.delete(loadRelayLegs).where(eq(loadRelayLegs.loadId, input.loadId));

      // Insert new legs
      const insertedIds: number[] = [];
      for (let i = 0; i < input.legs.length; i++) {
        const leg = input.legs[i];
        const [result] = await db.insert(loadRelayLegs).values({
          loadId: input.loadId,
          legNumber: i + 1,
          status: "planned",
          originFacility: leg.originFacility || null,
          originAddress: leg.originAddress || null,
          originCity: leg.originCity || null,
          originState: leg.originState || null,
          originLat: leg.originLat !== undefined ? String(leg.originLat) as any : null,
          originLng: leg.originLng !== undefined ? String(leg.originLng) as any : null,
          destFacility: leg.destFacility || null,
          destAddress: leg.destAddress || null,
          destCity: leg.destCity || null,
          destState: leg.destState || null,
          destLat: leg.destLat !== undefined ? String(leg.destLat) as any : null,
          destLng: leg.destLng !== undefined ? String(leg.destLng) as any : null,
          plannedStartAt: leg.plannedStartAt ? new Date(leg.plannedStartAt) : null,
          plannedEndAt: leg.plannedEndAt ? new Date(leg.plannedEndAt) : null,
          handoffType: (leg.handoffType as any) || "drop_and_hook",
          legDistance: leg.legDistance !== undefined ? String(leg.legDistance) as any : null,
          legRate: leg.legRate !== undefined ? String(leg.legRate) as any : null,
          sealNumber: leg.sealNumber || null,
          notes: leg.notes || null,
        }).$returningId();
        insertedIds.push(result.id);
      }

      console.log(`[Relay] Created ${input.legs.length}-leg relay plan for load ${load.loadNumber}`);
      return { success: true, loadId: input.loadId, legCount: input.legs.length, legIds: insertedIds };
    }),

  // ══════════════════════════════════════════════════════════════════
  // 3. ASSIGN DRIVER — Assign a driver (and optionally vehicle) to a leg
  // ══════════════════════════════════════════════════════════════════
  assignDriver: protectedProcedure
    .input(z.object({
      legId: z.number(),
      driverId: z.number(),
      vehicleId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.update(loadRelayLegs).set({
        driverId: input.driverId,
        vehicleId: input.vehicleId || null,
        status: "driver_assigned" as any,
      }).where(eq(loadRelayLegs.id, input.legId));

      return { success: true, legId: input.legId, driverId: input.driverId };
    }),

  // ══════════════════════════════════════════════════════════════════
  // 4. UPDATE LEG STATUS — Advance a leg through the lifecycle
  // ══════════════════════════════════════════════════════════════════
  updateLegStatus: protectedProcedure
    .input(z.object({
      legId: z.number(),
      status: legStatusEnum,
      sealNumber: z.string().optional(),
      sealVerified: z.boolean().optional(),
      handoffNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const updates: Record<string, any> = { status: input.status };

      if (input.status === "en_route") {
        updates.actualStartAt = new Date();
      }
      if (input.status === "completed" || input.status === "handed_off") {
        updates.actualEndAt = new Date();
      }
      if (input.status === "handed_off" || input.status === "at_handoff") {
        updates.handoffConfirmedByDriverId = ctx.user?.id || null;
        updates.handoffConfirmedAt = new Date();
        if (input.handoffNotes) updates.handoffNotes = input.handoffNotes;
      }
      if (input.sealNumber !== undefined) updates.sealNumber = input.sealNumber;
      if (input.sealVerified !== undefined) updates.sealVerified = input.sealVerified;

      await db.update(loadRelayLegs).set(updates).where(eq(loadRelayLegs.id, input.legId));

      return { success: true, legId: input.legId, newStatus: input.status };
    }),

  // ══════════════════════════════════════════════════════════════════
  // 5. CONFIRM HANDOFF — Driver confirms receiving cargo from prev driver
  // ══════════════════════════════════════════════════════════════════
  confirmHandoff: protectedProcedure
    .input(z.object({
      legId: z.number(),
      sealNumber: z.string().optional(),
      sealVerified: z.boolean().default(false),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = ctx.user?.id;

      // Get the leg
      const [leg] = await db.select().from(loadRelayLegs)
        .where(eq(loadRelayLegs.id, input.legId)).limit(1);
      if (!leg) throw new Error("Relay leg not found");

      // Mark previous leg as handed_off
      if (leg.legNumber > 1) {
        const [prevLeg] = await db.select({ id: loadRelayLegs.id })
          .from(loadRelayLegs)
          .where(and(
            eq(loadRelayLegs.loadId, leg.loadId),
            eq(loadRelayLegs.legNumber, leg.legNumber - 1),
          ))
          .limit(1);
        if (prevLeg) {
          await db.update(loadRelayLegs).set({
            status: "handed_off" as any,
            actualEndAt: new Date(),
            handoffConfirmedByDriverId: userId || null,
            handoffConfirmedAt: new Date(),
            handoffNotes: input.notes || null,
          }).where(eq(loadRelayLegs.id, prevLeg.id));
        }
      }

      // Mark this leg as en_route
      await db.update(loadRelayLegs).set({
        status: "en_route" as any,
        actualStartAt: new Date(),
        sealNumber: input.sealNumber || leg.sealNumber,
        sealVerified: input.sealVerified,
      }).where(eq(loadRelayLegs.id, input.legId));

      return { success: true, legId: input.legId, message: "Handoff confirmed, leg now en route" };
    }),

  // ══════════════════════════════════════════════════════════════════
  // 6. GET MY RELAY LEGS — Legs assigned to the current driver
  // ══════════════════════════════════════════════════════════════════
  getMyLegs: protectedProcedure
    .input(z.object({
      status: legStatusEnum.optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const userId = ctx.user?.id;
      if (!userId) return [];

      try {
        const conditions = [eq(loadRelayLegs.driverId, userId)];
        if (input?.status) conditions.push(eq(loadRelayLegs.status, input.status as any));

        const rows = await db
          .select({
            id: loadRelayLegs.id,
            loadId: loadRelayLegs.loadId,
            legNumber: loadRelayLegs.legNumber,
            status: loadRelayLegs.status,
            originFacility: loadRelayLegs.originFacility,
            originCity: loadRelayLegs.originCity,
            originState: loadRelayLegs.originState,
            destFacility: loadRelayLegs.destFacility,
            destCity: loadRelayLegs.destCity,
            destState: loadRelayLegs.destState,
            plannedStartAt: loadRelayLegs.plannedStartAt,
            plannedEndAt: loadRelayLegs.plannedEndAt,
            actualStartAt: loadRelayLegs.actualStartAt,
            actualEndAt: loadRelayLegs.actualEndAt,
            handoffType: loadRelayLegs.handoffType,
            legDistance: loadRelayLegs.legDistance,
            legRate: loadRelayLegs.legRate,
            sealNumber: loadRelayLegs.sealNumber,
            sealVerified: loadRelayLegs.sealVerified,
            notes: loadRelayLegs.notes,
            loadNumber: loads.loadNumber,
            loadStatus: loads.status,
          })
          .from(loadRelayLegs)
          .leftJoin(loads, eq(loadRelayLegs.loadId, loads.id))
          .where(and(...conditions))
          .orderBy(desc(loadRelayLegs.plannedStartAt));

        return rows.map((r) => ({
          ...r,
          legDistance: r.legDistance ? parseFloat(r.legDistance) : null,
          legRate: r.legRate ? parseFloat(r.legRate) : null,
        }));
      } catch (error) {
        console.error("[Relay] getMyLegs error:", error);
        return [];
      }
    }),

  // ══════════════════════════════════════════════════════════════════
  // 7. GET RELAY STATS — Summary statistics
  // ══════════════════════════════════════════════════════════════════
  getStats: protectedProcedure
    .query(async () => {
      const db = await getDb();
      const empty = { totalRelays: 0, activeLegs: 0, completedLegs: 0, pendingHandoffs: 0, totalDistance: 0, totalRevenue: 0 };
      if (!db) return empty;

      try {
        const allLegs = await db.select({
          status: loadRelayLegs.status,
          legDistance: loadRelayLegs.legDistance,
          legRate: loadRelayLegs.legRate,
        }).from(loadRelayLegs);

        let activeLegs = 0, completedLegs = 0, pendingHandoffs = 0, totalDistance = 0, totalRevenue = 0;
        const loadIds = new Set<number>();

        for (const leg of allLegs) {
          if (leg.status === "en_route" || leg.status === "driver_assigned") activeLegs++;
          if (leg.status === "completed" || leg.status === "handed_off") completedLegs++;
          if (leg.status === "at_handoff") pendingHandoffs++;
          if (leg.legDistance) totalDistance += parseFloat(leg.legDistance);
          if (leg.legRate) totalRevenue += parseFloat(leg.legRate);
        }

        // Count distinct loads with relay legs
        const [relayCount] = await db.select({ count: sql<number>`COUNT(DISTINCT ${loadRelayLegs.loadId})` })
          .from(loadRelayLegs);

        return {
          totalRelays: relayCount?.count || 0,
          activeLegs,
          completedLegs,
          pendingHandoffs,
          totalDistance: Math.round(totalDistance),
          totalRevenue: Math.round(totalRevenue * 100) / 100,
        };
      } catch (error) {
        console.error("[Relay] getStats error:", error);
        return empty;
      }
    }),

  // ══════════════════════════════════════════════════════════════════
  // 8. UPDATE LEG — Edit leg details (facility, schedule, distance, rate)
  // ══════════════════════════════════════════════════════════════════
  updateLeg: protectedProcedure
    .input(z.object({
      legId: z.number(),
      ...legInput.shape,
      driverId: z.number().optional(),
      vehicleId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const { legId, ...data } = input;
      const updates: Record<string, any> = {};

      if (data.originFacility !== undefined) updates.originFacility = data.originFacility;
      if (data.originAddress !== undefined) updates.originAddress = data.originAddress;
      if (data.originCity !== undefined) updates.originCity = data.originCity;
      if (data.originState !== undefined) updates.originState = data.originState;
      if (data.originLat !== undefined) updates.originLat = String(data.originLat);
      if (data.originLng !== undefined) updates.originLng = String(data.originLng);
      if (data.destFacility !== undefined) updates.destFacility = data.destFacility;
      if (data.destAddress !== undefined) updates.destAddress = data.destAddress;
      if (data.destCity !== undefined) updates.destCity = data.destCity;
      if (data.destState !== undefined) updates.destState = data.destState;
      if (data.destLat !== undefined) updates.destLat = String(data.destLat);
      if (data.destLng !== undefined) updates.destLng = String(data.destLng);
      if (data.plannedStartAt !== undefined) updates.plannedStartAt = new Date(data.plannedStartAt);
      if (data.plannedEndAt !== undefined) updates.plannedEndAt = new Date(data.plannedEndAt);
      if (data.handoffType !== undefined) updates.handoffType = data.handoffType;
      if (data.legDistance !== undefined) updates.legDistance = String(data.legDistance);
      if (data.legRate !== undefined) updates.legRate = String(data.legRate);
      if (data.sealNumber !== undefined) updates.sealNumber = data.sealNumber;
      if (data.notes !== undefined) updates.notes = data.notes;
      if (data.driverId !== undefined) {
        updates.driverId = data.driverId;
        updates.status = "driver_assigned";
      }
      if (data.vehicleId !== undefined) updates.vehicleId = data.vehicleId;

      if (Object.keys(updates).length === 0) return { success: true, legId };

      await db.update(loadRelayLegs).set(updates).where(eq(loadRelayLegs.id, legId));
      return { success: true, legId };
    }),

  // ══════════════════════════════════════════════════════════════════
  // 9. DELETE RELAY PLAN — Remove all relay legs for a load
  // ══════════════════════════════════════════════════════════════════
  deletePlan: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.delete(loadRelayLegs).where(eq(loadRelayLegs.loadId, input.loadId));
      return { success: true, loadId: input.loadId };
    }),
});
