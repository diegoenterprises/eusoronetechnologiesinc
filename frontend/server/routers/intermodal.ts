/**
 * INTERMODAL tRPC ROUTER
 * V5 Multi-Modal Expansion — 8 procedures for intermodal operations
 * Uses protectedProcedure (accessible to users of ANY mode)
 */

import { z } from "zod";
import { eq, and, desc, sql, count, inArray } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  intermodalShipments,
  intermodalSegments,
  intermodalTransfers,
  intermodalContainers,
  intermodalChassisTracking,
  containerTracking,
  railShipments,
  vesselShipments,
  users,
} from "../../drizzle/schema";

function generateIntermodalNumber(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `IM-${num}`;
}

export const intermodalRouter = router({
  // 1. createIntermodalShipment
  createIntermodalShipment: protectedProcedure
    .input(z.object({
      originDescription: z.string(),
      destinationDescription: z.string(),
      originType: z.enum(["TRUCK", "RAIL", "VESSEL"]),
      destinationType: z.enum(["TRUCK", "RAIL", "VESSEL"]),
      originLocation: z.object({ lat: z.number(), lng: z.number(), description: z.string() }).optional(),
      destinationLocation: z.object({ lat: z.number(), lng: z.number(), description: z.string() }).optional(),
      commodity: z.string().optional(),
      hazmatClass: z.string().optional(),
      totalWeight: z.number().optional(),
      totalVolume: z.number().optional(),
      segments: z.array(z.object({
        legNumber: z.number(),
        mode: z.enum(["TRUCK", "RAIL", "VESSEL"]),
        originDescription: z.string().optional(),
        destinationDescription: z.string().optional(),
        carrierId: z.number().optional(),
        rate: z.number().optional(),
        estimatedHours: z.number().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = Number((ctx.user as any)?.id);
      const companyId = Number((ctx.user as any)?.companyId) || null;
      const intermodalNumber = generateIntermodalNumber();

      const totalRate = input.segments.reduce((sum, s) => sum + (s.rate || 0), 0);

      const [result] = await db.insert(intermodalShipments).values({
        intermodalNumber,
        shipperId: userId,
        originType: input.originType as any,
        destinationType: input.destinationType as any,
        originLocation: input.originLocation as any,
        destinationLocation: input.destinationLocation as any,
        commodity: input.commodity,
        hazmatClass: input.hazmatClass,
        totalWeight: input.totalWeight ? String(input.totalWeight) : undefined,
        totalVolume: input.totalVolume ? String(input.totalVolume) : undefined,
        numberOfSegments: input.segments.length,
        totalRate: String(totalRate),
        status: "planning" as any,
        companyId,
      });

      const shipmentId = (result as any).insertId;

      for (const seg of input.segments) {
        let railShipmentId = null;
        let vesselShipmentId = null;

        if (seg.mode === "RAIL") {
          const rsNum = `RS-${Math.floor(10000 + Math.random() * 90000)}`;
          const [rs] = await db.insert(railShipments).values({
            shipmentNumber: rsNum,
            shipperId: userId,
            carrierId: seg.carrierId,
            commodity: input.commodity,
            status: "requested" as any,
            transportMode: "RAIL",
            companyId,
          });
          railShipmentId = (rs as any).insertId;
        } else if (seg.mode === "VESSEL") {
          const vsNum = `VS-${Math.floor(10000 + Math.random() * 90000)}`;
          const [vs] = await db.insert(vesselShipments).values({
            bookingNumber: vsNum,
            shipperId: userId,
            commodity: input.commodity,
            status: "booking_requested" as any,
            transportMode: "VESSEL",
            companyId,
          });
          vesselShipmentId = (vs as any).insertId;
        }

        await db.insert(intermodalSegments).values({
          intermodalShipmentId: shipmentId,
          legNumber: seg.legNumber,
          mode: seg.mode as any,
          railShipmentId,
          vesselShipmentId,
          originDescription: seg.originDescription,
          destinationDescription: seg.destinationDescription,
          carrierId: seg.carrierId,
          rate: seg.rate ? String(seg.rate) : undefined,
          estimatedHours: seg.estimatedHours ? String(seg.estimatedHours) : undefined,
          status: seg.legNumber === 1 ? "booked" as any : "pending" as any,
        });
      }

      return { id: shipmentId, intermodalNumber, numberOfSegments: input.segments.length, totalRate };
    }),

  // 2. getIntermodalShipments
  getIntermodalShipments: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { shipments: [], total: 0 };
      const userId = Number((ctx.user as any)?.id);
      const role = (ctx.user as any)?.role;

      let conditions: any[] = [];
      if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
        conditions.push(eq(intermodalShipments.shipperId, userId));
      }
      if (input.status) conditions.push(eq(intermodalShipments.status, input.status as any));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const shipments = await db.select()
        .from(intermodalShipments)
        .where(where)
        .orderBy(desc(intermodalShipments.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [totalResult] = await db.select({ count: count() }).from(intermodalShipments).where(where);

      return { shipments, total: totalResult?.count || 0 };
    }),

  // 3. getIntermodalShipmentDetail
  getIntermodalShipmentDetail: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [shipment] = await db.select().from(intermodalShipments).where(eq(intermodalShipments.id, input.id)).limit(1);
      if (!shipment) return null;

      const segments = await db.select().from(intermodalSegments)
        .where(eq(intermodalSegments.intermodalShipmentId, input.id))
        .orderBy(intermodalSegments.legNumber);

      const transfers = await db.select().from(intermodalTransfers)
        .where(eq(intermodalTransfers.intermodalShipmentId, input.id));

      const containers = await db.select().from(intermodalContainers)
        .where(eq(intermodalContainers.intermodalShipmentId, input.id));

      return { ...shipment, segments, transfers, containers };
    }),

  // 4. advanceSegment
  advanceSegment: protectedProcedure
    .input(z.object({
      intermodalShipmentId: z.number(),
      completedSegmentId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.update(intermodalSegments)
        .set({ status: "completed" as any, arrivedAt: new Date() })
        .where(eq(intermodalSegments.id, input.completedSegmentId));

      const allSegments = await db.select()
        .from(intermodalSegments)
        .where(eq(intermodalSegments.intermodalShipmentId, input.intermodalShipmentId))
        .orderBy(intermodalSegments.legNumber);

      const completedSeg = allSegments.find((s: any) => s.id === input.completedSegmentId);
      const nextSeg = allSegments.find((s: any) => completedSeg && s.legNumber === (completedSeg as any).legNumber + 1);

      if (nextSeg) {
        await db.update(intermodalSegments)
          .set({ status: "booked" as any })
          .where(eq(intermodalSegments.id, (nextSeg as any).id));

        await db.insert(intermodalTransfers).values({
          intermodalShipmentId: input.intermodalShipmentId,
          fromSegmentId: input.completedSegmentId,
          toSegmentId: (nextSeg as any).id,
          transferType: `${(completedSeg as any).mode.toLowerCase()}_to_${(nextSeg as any).mode.toLowerCase()}` as any,
          status: "scheduled" as any,
        });

        const statusMap: Record<number, string> = { 2: "second_leg_active", 3: "third_leg_active" };
        const newStatus = statusMap[(nextSeg as any).legNumber] || "at_transfer";
        await db.update(intermodalShipments)
          .set({ status: newStatus as any })
          .where(eq(intermodalShipments.id, input.intermodalShipmentId));

        return { success: true, nextSegmentId: (nextSeg as any).id, newStatus };
      } else {
        await db.update(intermodalShipments)
          .set({ status: "delivered" as any })
          .where(eq(intermodalShipments.id, input.intermodalShipmentId));

        return { success: true, nextSegmentId: null, newStatus: "delivered" };
      }
    }),

  // 5. recordTransfer
  recordTransfer: protectedProcedure
    .input(z.object({
      intermodalShipmentId: z.number(),
      fromSegmentId: z.number(),
      toSegmentId: z.number(),
      transferType: z.enum(["truck_to_rail", "rail_to_truck", "truck_to_vessel", "vessel_to_truck", "rail_to_vessel", "vessel_to_rail"]),
      facilityName: z.string().optional(),
      facilityType: z.enum(["intermodal_ramp", "port_terminal", "cross_dock", "rail_yard", "container_depot"]).optional(),
      location: z.object({ lat: z.number(), lng: z.number(), description: z.string().optional() }).optional(),
      transferCost: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [result] = await db.insert(intermodalTransfers).values({
        intermodalShipmentId: input.intermodalShipmentId,
        fromSegmentId: input.fromSegmentId,
        toSegmentId: input.toSegmentId,
        transferType: input.transferType as any,
        facilityName: input.facilityName,
        facilityType: input.facilityType as any,
        location: input.location as any,
        transferCost: input.transferCost ? String(input.transferCost) : undefined,
        status: "in_progress" as any,
        startedAt: new Date(),
        notes: input.notes,
      });

      return { id: (result as any).insertId, success: true };
    }),

  // 6. getIntermodalTracking
  getIntermodalTracking: protectedProcedure
    .input(z.object({ intermodalShipmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { segments: [], containers: [], currentMode: null };

      const segments = await db.select()
        .from(intermodalSegments)
        .where(eq(intermodalSegments.intermodalShipmentId, input.intermodalShipmentId))
        .orderBy(intermodalSegments.legNumber);

      const containers = await db.select()
        .from(intermodalContainers)
        .where(eq(intermodalContainers.intermodalShipmentId, input.intermodalShipmentId));

      const activeSegment = segments.find((s: any) => ["booked", "in_transit"].includes(s.status));

      return {
        segments,
        containers,
        currentMode: activeSegment ? (activeSegment as any).mode : null,
        activeSegmentId: activeSegment ? (activeSegment as any).id : null,
      };
    }),

  // 7. getIntermodalCostBreakdown
  getIntermodalCostBreakdown: protectedProcedure
    .input(z.object({ intermodalShipmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [shipment] = await db.select().from(intermodalShipments).where(eq(intermodalShipments.id, input.intermodalShipmentId)).limit(1);
      if (!shipment) return null;

      const segments = await db.select()
        .from(intermodalSegments)
        .where(eq(intermodalSegments.intermodalShipmentId, input.intermodalShipmentId))
        .orderBy(intermodalSegments.legNumber);

      const transfers = await db.select()
        .from(intermodalTransfers)
        .where(eq(intermodalTransfers.intermodalShipmentId, input.intermodalShipmentId));

      const segmentCosts = segments.map((s: any) => ({
        legNumber: s.legNumber,
        mode: s.mode,
        rate: parseFloat(s.rate || "0"),
        status: s.status,
      }));

      const transferCosts = transfers.map((t: any) => ({
        transferType: t.transferType,
        cost: parseFloat(t.transferCost || "0"),
        facilityName: t.facilityName,
      }));

      const totalSegment = segmentCosts.reduce((sum: number, s: any) => sum + s.rate, 0);
      const totalTransfer = transferCosts.reduce((sum: number, t: any) => sum + t.cost, 0);

      return {
        intermodalNumber: shipment.intermodalNumber,
        segments: segmentCosts,
        transfers: transferCosts,
        totalSegmentCost: totalSegment,
        totalTransferCost: totalTransfer,
        grandTotal: totalSegment + totalTransfer,
        currency: "USD",
      };
    }),

  // 8. getIntermodalDashboard
  getIntermodalDashboard: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return { activeShipments: 0, avgTransitDays: 0, modeSplit: {}, totalRevenue: 0 };

      const activeStatuses = ["planning", "booked", "first_leg_active", "at_transfer", "second_leg_active", "third_leg_active"];

      const [activeResult] = await db.select({ count: count() })
        .from(intermodalShipments)
        .where(inArray(intermodalShipments.status, activeStatuses as any));

      const [revenueResult] = await db.select({ total: sql<string>`COALESCE(SUM(totalRate), 0)` })
        .from(intermodalShipments)
        .where(eq(intermodalShipments.status, "settled" as any));

      const modeSplitResult = await db.select({
        mode: intermodalSegments.mode,
        count: count(),
      })
        .from(intermodalSegments)
        .groupBy(intermodalSegments.mode);

      const modeSplit: Record<string, number> = {};
      for (const row of modeSplitResult) {
        modeSplit[(row as any).mode] = (row as any).count;
      }

      return {
        activeShipments: activeResult?.count || 0,
        avgTransitDays: 0,
        modeSplit,
        totalRevenue: parseFloat(revenueResult?.total || "0"),
      };
    }),

  getTransfers: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        return await db.select().from(intermodalTransfers).orderBy(desc(intermodalTransfers.id)).limit(input.limit);
      } catch { return []; }
    }),
});
