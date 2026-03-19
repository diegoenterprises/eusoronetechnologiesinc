/**
 * RAIL SHIPMENTS tRPC ROUTER
 * V5 Multi-Modal Expansion — 16 procedures for rail freight operations
 * ALL procedures use railProcedure to enforce RAIL mode access
 */

import { z } from "zod";
import { eq, and, desc, sql, gte, lte, inArray, count } from "drizzle-orm";
import { railProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { railincService } from "../services/integrations/RailincService";
import { fraService } from "../services/integrations/FRAService";
import { classIRailroadService } from "../services/integrations/ClassIRailroadService";
import { vizionRailService } from "../services/integrations/VizionRailService";
import { cloudMoyoCrewService } from "../services/integrations/CloudMoyoCrewService";
import { railRateService } from "../services/integrations/RailRateService";
import { logger } from "../_core/logger";
import { cacheThrough as lsCacheThrough } from "../services/cache/redisCache";
import {
  railShipments,
  railCarriers,
  railYards,
  railcars,
  trainConsists,
  consistCars,
  railWaybills,
  railDemurrage,
  railShipmentEvents,
  railInspections,
  railHazmatPermits,
  railCrewAssignments,
  users,
  wallets,
  settlements,
} from "../../drizzle/schema";

function generateShipmentNumber(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `RS-${num}`;
}

export const railShipmentsRouter = router({
  // 1. createRailShipment
  createRailShipment: railProcedure
    .input(z.object({
      originYardId: z.number(),
      destinationYardId: z.number(),
      carrierId: z.number().optional(),
      carType: z.enum(["boxcar", "gondola", "hopper", "tank_car", "flat_car", "refrigerated", "autorack", "intermodal_well", "centerbeam", "covered_hopper"]).optional(),
      commodity: z.string().optional(),
      hazmatClass: z.string().optional(),
      stccCode: z.string().optional(),
      weightLbs: z.number().optional(),
      numberOfCars: z.number().default(1),
      specialInstructions: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = Number((ctx.user as any)?.id);
      const companyId = Number((ctx.user as any)?.companyId) || null;
      const shipmentNumber = generateShipmentNumber();

      const [result] = await db.insert(railShipments).values({
        shipmentNumber,
        shipperId: userId,
        carrierId: input.carrierId,
        originYardId: input.originYardId,
        destinationYardId: input.destinationYardId,
        carType: input.carType as any,
        commodity: input.commodity,
        hazmatClass: input.hazmatClass,
        stccCode: input.stccCode,
        weightLbs: input.weightLbs ? String(input.weightLbs) : undefined,
        numberOfCars: input.numberOfCars,
        specialInstructions: input.specialInstructions,
        status: "requested" as any,
        transportMode: "RAIL",
        companyId,
      });

      await db.insert(railShipmentEvents).values({
        shipmentId: (result as any).insertId,
        eventType: "shipment_created",
        description: `Rail shipment ${shipmentNumber} created`,
      });

      return { id: (result as any).insertId, shipmentNumber, status: "requested" };
    }),

  // 2. getRailShipments
  getRailShipments: railProcedure
    .input(z.object({
      status: z.string().optional(),
      carrierId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
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
        conditions.push(eq(railShipments.shipperId, userId));
      }
      if (input.status) conditions.push(eq(railShipments.status, input.status as any));
      if (input.carrierId) conditions.push(eq(railShipments.carrierId, input.carrierId));
      if (input.startDate) conditions.push(gte(railShipments.createdAt, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(railShipments.createdAt, new Date(input.endDate)));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const shipments = await db.select()
        .from(railShipments)
        .where(where)
        .orderBy(desc(railShipments.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [totalResult] = await db.select({ count: count() })
        .from(railShipments)
        .where(where);

      return { shipments, total: totalResult?.count || 0 };
    }),

  // 3. getRailShipmentDetail
  getRailShipmentDetail: railProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [shipment] = await db.select().from(railShipments).where(eq(railShipments.id, input.id)).limit(1);
      if (!shipment) return null;

      const waybills = await db.select().from(railWaybills).where(eq(railWaybills.shipmentId, input.id));
      const events = await db.select().from(railShipmentEvents).where(eq(railShipmentEvents.shipmentId, input.id)).orderBy(desc(railShipmentEvents.timestamp));
      const demurrage = await db.select().from(railDemurrage).where(eq(railDemurrage.shipmentId, input.id));

      let originYard = null;
      let destinationYard = null;
      if (shipment.originYardId) {
        const [oy] = await db.select().from(railYards).where(eq(railYards.id, shipment.originYardId)).limit(1);
        originYard = oy;
      }
      if (shipment.destinationYardId) {
        const [dy] = await db.select().from(railYards).where(eq(railYards.id, shipment.destinationYardId)).limit(1);
        destinationYard = dy;
      }

      return { ...shipment, waybills, events, demurrage, originYard, destinationYard };
    }),

  // 4. updateRailShipmentStatus
  updateRailShipmentStatus: railProcedure
    .input(z.object({
      id: z.number(),
      newStatus: z.string(),
      notes: z.string().optional(),
      location: z.object({ lat: z.number(), lng: z.number(), description: z.string().optional() }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [shipment] = await db.select({ status: railShipments.status }).from(railShipments).where(eq(railShipments.id, input.id)).limit(1);
      if (!shipment) throw new Error("Shipment not found");

      const VALID_RAIL_TRANSITIONS: Record<string, string[]> = {
        requested: ["car_ordered", "cancelled", "on_hold"],
        car_ordered: ["car_placed", "cancelled", "on_hold"],
        car_placed: ["loading", "cancelled", "on_hold"],
        loading: ["loaded", "cancelled", "on_hold"],
        loaded: ["in_consist", "cancelled", "on_hold"],
        in_consist: ["departed", "cancelled", "on_hold"],
        departed: ["in_transit", "cancelled", "on_hold"],
        in_transit: ["at_interchange", "in_yard", "spotted", "cancelled", "on_hold"],
        at_interchange: ["in_transit", "in_yard", "cancelled", "on_hold"],
        in_yard: ["spotted", "in_transit", "cancelled", "on_hold"],
        spotted: ["unloading", "cancelled", "on_hold"],
        unloading: ["unloaded", "cancelled", "on_hold"],
        unloaded: ["empty_returned", "cancelled", "on_hold"],
        empty_returned: ["invoiced", "cancelled", "on_hold"],
        invoiced: ["settled", "cancelled", "on_hold"],
        on_hold: ["requested", "car_ordered", "car_placed", "loading", "loaded", "in_consist", "departed", "in_transit", "cancelled"],
      };

      const currentStatus = shipment.status || "requested";
      const allowed = VALID_RAIL_TRANSITIONS[currentStatus] || ["cancelled", "on_hold"];
      if (!allowed.includes(input.newStatus)) {
        throw new Error(`Cannot transition from '${currentStatus}' to '${input.newStatus}'`);
      }

      await db.update(railShipments)
        .set({ status: input.newStatus as any })
        .where(eq(railShipments.id, input.id));

      await db.insert(railShipmentEvents).values({
        shipmentId: input.id,
        eventType: `status_${input.newStatus}`,
        description: input.notes || `Status changed to ${input.newStatus}`,
        location: input.location as any,
      });

      // Auto-create settlement for rail shipments transitioning to 'settled'
      if (input.newStatus === 'settled' || input.newStatus === 'invoiced') {
        try {
          const [shipment] = await db.select().from(railShipments).where(eq(railShipments.id, input.id)).limit(1);
          if (shipment && input.newStatus === 'settled') {
            const rate = Number(shipment.rate || 0);
            const platformFeePercent = 5;
            const platformFee = Math.round(rate * platformFeePercent / 100 * 100) / 100;
            const carrierPayment = rate - platformFee;

            await db.execute(sql`INSERT IGNORE INTO settlements
              (loadId, shipperId, carrierId, loadRate, platformFeePercent, platformFeeAmount, carrierPayment, totalShipperCharge, status, createdAt)
              VALUES (${shipment.id}, ${shipment.shipperId}, ${shipment.carrierId || 0}, ${String(rate)}, '${platformFeePercent}.00', ${String(platformFee)}, ${String(carrierPayment)}, ${String(rate)}, 'pending', NOW())`);

            logger.info(`[RailSettlement] Created settlement for rail shipment ${shipment.shipmentNumber}: $${rate}`);

            // Credit carrier wallet
            try {
              const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, shipment.carrierId || shipment.shipperId)).limit(1);
              if (wallet) {
                await db.execute(sql`UPDATE wallets SET availableBalance = availableBalance + ${carrierPayment}, totalReceived = totalReceived + ${carrierPayment} WHERE id = ${wallet.id}`);
                logger.info(`[RailSettlement] Credited wallet ${wallet.id} with $${carrierPayment}`);
              }
            } catch {}
          }
        } catch (settleErr) {
          logger.warn('[RailSettlement] Settlement creation failed:', settleErr);
        }
      }

      // WebSocket real-time notification
      try {
        const io = (global as any).io;
        if (io) {
          io.to(`rail:shipment:${input.id}`).emit('rail:status_changed', {
            shipmentId: input.id, newStatus: input.newStatus, timestamp: new Date().toISOString(),
          });
        }
      } catch {}

      return { success: true, newStatus: input.newStatus };
    }),

  // 5. createRailBid
  createRailBid: railProcedure
    .input(z.object({
      shipmentId: z.number(),
      amount: z.number(),
      rateType: z.enum(["per_car", "per_ton", "per_mile", "flat"]).optional(),
      transitDays: z.number().optional(),
      route: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = Number((ctx.user as any)?.id);

      await db.insert(railShipmentEvents).values({
        shipmentId: input.shipmentId,
        eventType: "bid_submitted",
        description: `Bid of $${input.amount} submitted (${input.rateType || "flat"}, ${input.transitDays || "N/A"} days)`,
        metadata: { bidderId: userId, amount: input.amount, rateType: input.rateType, transitDays: input.transitDays, route: input.route, notes: input.notes },
      });

      return { success: true, message: "Bid submitted" };
    }),

  // 6. getRailBids
  getRailBids: railProcedure
    .input(z.object({ shipmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const bids = await db.select()
        .from(railShipmentEvents)
        .where(and(
          eq(railShipmentEvents.shipmentId, input.shipmentId),
          eq(railShipmentEvents.eventType, "bid_submitted"),
        ))
        .orderBy(desc(railShipmentEvents.timestamp));

      return bids.map((b: any) => ({
        id: b.id,
        metadata: b.metadata,
        timestamp: b.timestamp,
      }));
    }),

  // 7. acceptRailBid
  acceptRailBid: railProcedure
    .input(z.object({
      shipmentId: z.number(),
      bidEventId: z.number(),
      carrierId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.update(railShipments)
        .set({ carrierId: input.carrierId, status: "car_ordered" as any })
        .where(eq(railShipments.id, input.shipmentId));

      await db.insert(railShipmentEvents).values({
        shipmentId: input.shipmentId,
        eventType: "bid_accepted",
        description: `Bid accepted, carrier assigned`,
        metadata: { bidEventId: input.bidEventId, carrierId: input.carrierId },
      });

      return { success: true };
    }),

  // 8. getRailcars
  getRailcars: railProcedure
    .input(z.object({
      carType: z.string().optional(),
      status: z.string().optional(),
      yardId: z.number().optional(),
      carrierId: z.number().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { railcars: [], total: 0 };

      let conditions: any[] = [];
      if (input.carType) conditions.push(eq(railcars.carType, input.carType as any));
      if (input.status) conditions.push(eq(railcars.status, input.status as any));
      if (input.yardId) conditions.push(eq(railcars.currentYardId, input.yardId));
      if (input.carrierId) conditions.push(eq(railcars.ownerCarrierId, input.carrierId));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const cars = await db.select().from(railcars).where(where).limit(input.limit).offset(input.offset);
      const [totalResult] = await db.select({ count: count() }).from(railcars).where(where);

      return { railcars: cars, total: totalResult?.count || 0 };
    }),

  // 9. getTrainConsists
  getTrainConsists: railProcedure
    .input(z.object({
      status: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { consists: [], total: 0 };

      let conditions: any[] = [];
      if (input.status) conditions.push(eq(trainConsists.status, input.status as any));
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const consists = await db.select().from(trainConsists).where(where)
        .orderBy(desc(trainConsists.createdAt))
        .limit(input.limit).offset(input.offset);
      const [totalResult] = await db.select({ count: count() }).from(trainConsists).where(where);

      return { consists, total: totalResult?.count || 0 };
    }),

  // 10. createConsist
  createConsist: railProcedure
    .input(z.object({
      trainId: z.string(),
      carrierId: z.number(),
      originYardId: z.number(),
      destinationYardId: z.number(),
      railcarIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [result] = await db.insert(trainConsists).values({
        trainId: input.trainId,
        carrierId: input.carrierId,
        originYardId: input.originYardId,
        destinationYardId: input.destinationYardId,
        totalCars: input.railcarIds.length,
        status: "building" as any,
      });

      const consistId = (result as any).insertId;

      for (let i = 0; i < input.railcarIds.length; i++) {
        await db.insert(consistCars).values({
          consistId,
          railcarId: input.railcarIds[i],
          position: i + 1,
        });
      }

      return { id: consistId, trainId: input.trainId, totalCars: input.railcarIds.length };
    }),

  // 11. getRailYards
  getRailYards: railProcedure
    .input(z.object({
      railroadId: z.number().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      yardType: z.string().optional(),
      hasIntermodal: z.boolean().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let conditions: any[] = [eq(railYards.isActive, true)];
      if (input.railroadId) conditions.push(eq(railYards.ownerRailroadId, input.railroadId));
      if (input.state) conditions.push(eq(railYards.state, input.state));
      if (input.country) conditions.push(eq(railYards.country, input.country as any));
      if (input.yardType) conditions.push(eq(railYards.yardType, input.yardType as any));
      if (input.hasIntermodal !== undefined) conditions.push(eq(railYards.hasIntermodal, input.hasIntermodal));

      return db.select().from(railYards).where(and(...conditions)).limit(input.limit);
    }),

  // 12. getRailTracking
  getRailTracking: railProcedure
    .input(z.object({ shipmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { events: [], currentLocation: null };

      const events = await db.select()
        .from(railShipmentEvents)
        .where(eq(railShipmentEvents.shipmentId, input.shipmentId))
        .orderBy(desc(railShipmentEvents.timestamp));

      const latestWithLocation = events.find((e: any) => e.location);

      return {
        events,
        currentLocation: latestWithLocation ? (latestWithLocation as any).location : null,
      };
    }),

  // 13. getRailDemurrage
  getRailDemurrage: railProcedure
    .input(z.object({ shipmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(railDemurrage).where(eq(railDemurrage.shipmentId, input.shipmentId));
    }),

  // 14. getRailSettlement
  getRailSettlement: railProcedure
    .input(z.object({ shipmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [shipment] = await db.select().from(railShipments).where(eq(railShipments.id, input.shipmentId)).limit(1);
      if (!shipment) return null;

      const demurrageCharges = await db.select().from(railDemurrage).where(eq(railDemurrage.shipmentId, input.shipmentId));

      const totalDemurrage = demurrageCharges.reduce((sum: number, d: any) => sum + (parseFloat(d.totalCharge || "0")), 0);
      const linehaul = parseFloat((shipment as any).rate || "0");

      return {
        shipmentId: input.shipmentId,
        shipmentNumber: shipment.shipmentNumber,
        status: shipment.status,
        linehaul,
        demurrage: totalDemurrage,
        total: linehaul + totalDemurrage,
        currency: "USD",
      };
    }),

  // 15. getRailDashboardStats
  getRailDashboardStats: railProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { activeShipments: 0, carsInTransit: 0, avgTransitDays: 0, revenue: 0 };

      const activeStatuses = ["requested", "car_ordered", "car_placed", "loading", "loaded", "in_consist", "departed", "in_transit", "at_interchange", "in_yard", "spotted", "unloading"];

      const [activeResult] = await db.select({ count: count() })
        .from(railShipments)
        .where(inArray(railShipments.status, activeStatuses as any));

      const [transitResult] = await db.select({ count: count() })
        .from(railShipments)
        .where(inArray(railShipments.status, ["in_transit", "departed", "at_interchange"] as any));

      const [revenueResult] = await db.select({ total: sql<string>`COALESCE(SUM(rate), 0)` })
        .from(railShipments)
        .where(eq(railShipments.status, "settled" as any));

      return {
        activeShipments: activeResult?.count || 0,
        carsInTransit: transitResult?.count || 0,
        avgTransitDays: 0,
        revenue: parseFloat(revenueResult?.total || "0"),
      };
    }),

  // 16. getRailCompliance
  getRailCompliance: railProcedure
    .input(z.object({ companyId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { inspections: [], hazmatPermits: [], status: "unknown" };

      const companyId = input.companyId || Number((ctx.user as any)?.companyId);

      const inspections = await db.select()
        .from(railInspections)
        .orderBy(desc(railInspections.inspectionDate))
        .limit(20);

      const hazmatPermits = await db.select()
        .from(railHazmatPermits)
        .limit(20);

      const failedInspections = inspections.filter((i: any) => i.result === "fail" || i.result === "out_of_service");

      return {
        inspections,
        hazmatPermits,
        status: failedInspections.length > 0 ? "non_compliant" : "compliant",
        totalInspections: inspections.length,
        failedCount: failedInspections.length,
      };
    }),

  // 17. calculateRailDemurrage — compute dwell-based demurrage charges
  calculateRailDemurrage: railProcedure
    .input(z.object({ shipmentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Find car_placed and loading events to compute dwell time
      const events = await db.select()
        .from(railShipmentEvents)
        .where(eq(railShipmentEvents.shipmentId, input.shipmentId))
        .orderBy(railShipmentEvents.timestamp);

      const carPlaced = events.find((e: any) => e.eventType === "status_car_placed" || e.eventType === "car_placed");
      const loadingStart = events.find((e: any) => e.eventType === "status_loading" || e.eventType === "loading");

      if (!carPlaced) {
        return { demurrage: 0, dwellHours: 0, freeTimeHours: 24, message: "No car_placed event found" };
      }

      const endTime = loadingStart ? new Date(loadingStart.timestamp!) : new Date();
      const startTime = new Date(carPlaced.timestamp!);
      const dwellMs = endTime.getTime() - startTime.getTime();
      const dwellHours = Math.max(0, dwellMs / (1000 * 60 * 60));
      const freeTimeHours = 24;
      const chargeableHours = Math.max(0, dwellHours - freeTimeHours);
      const ratePerHour = 35;
      const demurrageAmount = Math.round(chargeableHours * ratePerHour * 100) / 100;

      if (demurrageAmount > 0) {
        await db.insert(railDemurrage).values({
          shipmentId: input.shipmentId,
          chargeType: "demurrage" as any,
          startDate: startTime,
          endDate: endTime,
          freeTimeHours: String(freeTimeHours),
          chargeableHours: String(chargeableHours),
          ratePerHour: String(ratePerHour),
          totalCharge: String(demurrageAmount),
          status: "pending" as any,
        });

        logger.info(`[RailDemurrage] Shipment ${input.shipmentId}: ${chargeableHours.toFixed(1)}h chargeable @ $${ratePerHour}/hr = $${demurrageAmount}`);
      }

      return { demurrage: demurrageAmount, dwellHours: Math.round(dwellHours * 10) / 10, freeTimeHours, chargeableHours: Math.round(chargeableHours * 10) / 10 };
    }),

  // ═══════════════════════════════════════════════════════════════
  // INTEGRATION-POWERED PROCEDURES — Live External API Data
  // ═══════════════════════════════════════════════════════════════

  /**
   * Railinc RailSight — Live railcar position tracking
   */
  liveTrackRailcar: railProcedure
    .input(z.object({ railcarNumber: z.string() }))
    .query(async ({ input }) => {
      const cacheKey = `rail:track:${input.railcarNumber}`;
      try {
        return await lsCacheThrough("WARM", cacheKey, async () => {
          return await railincService.trackRailcar(input.railcarNumber);
        }, 300);
      } catch (e) { logger.error("[Rail] liveTrackRailcar error:", e); return null; }
    }),

  /**
   * Railinc UMLER — Equipment specifications
   */
  getEquipmentSpecs: railProcedure
    .input(z.object({ railcarNumber: z.string() }))
    .query(async ({ input }) => {
      const cacheKey = `rail:umler:${input.railcarNumber}`;
      try {
        return await lsCacheThrough("WARM", cacheKey, async () => {
          return await railincService.getEquipmentSpecs(input.railcarNumber);
        }, 900);
      } catch (e) { logger.error("[Rail] getEquipmentSpecs error:", e); return null; }
    }),

  /**
   * Railinc Asset Health — Mechanical condition & maintenance alerts
   */
  getAssetHealth: railProcedure
    .input(z.object({ railcarNumber: z.string() }))
    .query(async ({ input }) => {
      try {
        return await railincService.getAssetHealth(input.railcarNumber);
      } catch (e) { logger.error("[Rail] getAssetHealth error:", e); return null; }
    }),

  /**
   * FRA Safety Data — Accident reports (free government API)
   */
  getFRAAccidentReports: railProcedure
    .input(z.object({
      state: z.string().optional(),
      railroad: z.string().optional(),
      year: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      try {
        return await fraService.getAccidentReports(input || {});
      } catch (e) { logger.error("[Rail] getFRAAccidentReports error:", e); return null; }
    }),

  /**
   * FRA — Safety compliance metrics
   */
  getFRASafetyCompliance: railProcedure
    .input(z.object({ railroadCode: z.string() }))
    .query(async ({ input }) => {
      const cacheKey = `rail:fra:safety:${input.railroadCode}`;
      try {
        return await lsCacheThrough("AGGREGATE", cacheKey, async () => {
          return await fraService.getSafetyCompliance(input.railroadCode);
        }, 3600);
      } catch (e) { logger.error("[Rail] getFRASafetyCompliance error:", e); return null; }
    }),

  /**
   * Class I Railroad — Live shipment tracking (BNSF, UP, NS, CSX, CPKC, CN)
   */
  liveTrackShipment: railProcedure
    .input(z.object({ railroad: z.string(), shipmentId: z.string() }))
    .query(async ({ input }) => {
      const cacheKey = `rail:classI:${input.railroad}:${input.shipmentId}`;
      try {
        return await lsCacheThrough("WARM", cacheKey, async () => {
          return await classIRailroadService.trackShipment(input.railroad, input.shipmentId);
        }, 300);
      } catch (e) { logger.error("[Rail] liveTrackShipment error:", e); return null; }
    }),

  /**
   * Class I Railroad — Facility/yard status
   */
  getFacilityStatus: railProcedure
    .input(z.object({ railroad: z.string(), facilityCode: z.string() }))
    .query(async ({ input }) => {
      try {
        return await classIRailroadService.getFacilityStatus(input.railroad, input.facilityCode);
      } catch (e) { logger.error("[Rail] getFacilityStatus error:", e); return null; }
    }),

  /**
   * Class I Railroad — Live demurrage charges
   */
  getLiveDemurrage: railProcedure
    .input(z.object({ railroad: z.string(), equipmentId: z.string() }))
    .query(async ({ input }) => {
      try {
        return await classIRailroadService.getDemurrageCharges(input.railroad, input.equipmentId);
      } catch (e) { logger.error("[Rail] getLiveDemurrage error:", e); return null; }
    }),

  /**
   * Vizion — Unified intermodal container tracking (ocean→rail seamless)
   */
  trackIntermodalContainer: railProcedure
    .input(z.object({ containerNumber: z.string() }))
    .query(async ({ input }) => {
      const cacheKey = `rail:vizion:${input.containerNumber}`;
      try {
        return await lsCacheThrough("WARM", cacheKey, async () => {
          return await vizionRailService.trackContainer(input.containerNumber);
        }, 300);
      } catch (e) { logger.error("[Rail] trackIntermodalContainer error:", e); return null; }
    }),

  /**
   * CloudMoyo — Crew HOS compliance (FRA 49 CFR Part 228)
   */
  getCrewHOS: railProcedure
    .input(z.object({ crewMemberId: z.string() }))
    .query(async ({ input }) => {
      try {
        return await cloudMoyoCrewService.getCrewHOS(input.crewMemberId);
      } catch (e) { logger.error("[Rail] getCrewHOS error:", e); return null; }
    }),

  /**
   * CloudMoyo — Crew availability by yard
   */
  getCrewAvailability: railProcedure
    .input(z.object({ yardId: z.string() }))
    .query(async ({ input }) => {
      try {
        return await cloudMoyoCrewService.getCrewAvailability(input.yardId);
      } catch (e) { logger.error("[Rail] getCrewAvailability error:", e); return null; }
    }),

  /**
   * Create a rail waybill for a shipment
   */
  createRailWaybill: railProcedure
    .input(z.object({
      shipmentId: z.number(),
      waybillNumber: z.string().optional(),
      commodity: z.string(),
      weight: z.number().optional(),
      hazmatClass: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const waybillNum = input.waybillNumber || `WB-${Date.now().toString(36).toUpperCase()}`;

      const [shipment] = await db.select().from(railShipments).where(eq(railShipments.id, input.shipmentId)).limit(1);
      if (!shipment) throw new Error("Shipment not found");

      await db.insert(railWaybills).values({
        shipmentId: input.shipmentId,
        waybillNumber: waybillNum,
        shipperId: shipment.shipperId,
        commodity: input.commodity,
        weightPounds: input.weight || null,
        hazmatInfo: input.hazmatClass ? { class: input.hazmatClass, un: "", name: "" } : null,
      });

      return { waybillNumber: waybillNum };
    }),

  /**
   * Rail Rate Service — Tariff rate quotes
   */
  getTariffRate: railProcedure
    .input(z.object({
      originStation: z.string(),
      destStation: z.string(),
      carType: z.string(),
      commodity: z.string(),
    }))
    .query(async ({ input }) => {
      const cacheKey = `rail:rate:${input.originStation}:${input.destStation}:${input.carType}:${input.commodity}`;
      try {
        return await lsCacheThrough("WARM", cacheKey, async () => {
          return await railRateService.getTariffRate(input.originStation, input.destStation, input.carType, input.commodity);
        }, 900);
      } catch (e) { logger.error("[Rail] getTariffRate error:", e); return null; }
    }),

  getRailCrew: railProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        return await db.select().from(railCrewAssignments).limit(input.limit);
      } catch { return []; }
    }),

  getRailCrewHOS: railProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      try {
        return await db.select().from(railCrewAssignments).limit(50);
      } catch { return []; }
    }),

  getRailFinancialSummary: railProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return { settlements: [], demurrage: [] };
      try {
        const s = await db.select().from(settlements).limit(20);
        const d = await db.select().from(railDemurrage).limit(20);
        return { settlements: s, demurrage: d };
      } catch { return { settlements: [], demurrage: [] }; }
    }),
});
