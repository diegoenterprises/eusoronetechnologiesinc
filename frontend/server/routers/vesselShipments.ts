/**
 * VESSEL SHIPMENTS tRPC ROUTER
 * V5 Multi-Modal Expansion — 20 procedures for maritime/vessel operations
 * ALL procedures use vesselProcedure to enforce VESSEL mode access
 */

import { z } from "zod";
import { eq, and, desc, sql, gte, lte, inArray, count } from "drizzle-orm";
import { vesselProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { marineTrafficService } from "../services/integrations/MarineTrafficService";
import { inttraService } from "../services/integrations/INTTRAService";
import { descartesABIService } from "../services/integrations/DescartesABIService";
import { dtnMarineWeatherService } from "../services/integrations/DTNMarineWeatherService";
import { oilPriceMarineService } from "../services/integrations/OilPriceMarineService";
import { avalaraHTSService } from "../services/integrations/AvalaraHTSService";
import { logger } from "../_core/logger";
import { cacheThrough as lsCacheThrough } from "../services/cache/redisCache";
import {
  vesselShipments,
  vessels,
  ports,
  portBerths,
  vesselVoyages,
  vesselBerthAssignments,
  billsOfLading,
  customsDeclarations,
  shippingContainers,
  containerTracking,
  vesselShipmentEvents,
  vesselFreightRates,
  vesselDemurrage,
  vesselInspections,
  vesselISPSRecords,
  vesselInsurance,
  vesselPortCharges,
  users,
  wallets,
  settlements,
} from "../../drizzle/schema";

function generateBookingNumber(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `VS-${num}`;
}

function generateBOLNumber(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `BOL-${num}`;
}

export const vesselShipmentsRouter = router({
  // 1. createVesselBooking
  createVesselBooking: vesselProcedure
    .input(z.object({
      originPortId: z.number(),
      destinationPortId: z.number(),
      vesselId: z.number().optional(),
      cargoType: z.enum(["container", "bulk_dry", "bulk_liquid", "breakbulk", "ro_ro", "reefer", "project_cargo"]).optional(),
      commodity: z.string().optional(),
      numberOfContainers: z.number().optional(),
      totalWeightKg: z.number().optional(),
      totalVolumeCBM: z.number().optional(),
      hazmatClass: z.string().optional(),
      imdgCode: z.string().optional(),
      incoterms: z.string().optional(),
      freightTerms: z.enum(["prepaid", "collect", "third_party"]).optional(),
      etd: z.string().optional(),
      eta: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = Number((ctx.user as any)?.id);
      const companyId = Number((ctx.user as any)?.companyId) || null;
      const bookingNumber = generateBookingNumber();

      const [result] = await db.insert(vesselShipments).values({
        bookingNumber,
        shipperId: userId,
        originPortId: input.originPortId,
        destinationPortId: input.destinationPortId,
        vesselId: input.vesselId,
        cargoType: input.cargoType as any,
        commodity: input.commodity,
        numberOfContainers: input.numberOfContainers,
        totalWeightKg: input.totalWeightKg ? String(input.totalWeightKg) : undefined,
        totalVolumeCBM: input.totalVolumeCBM ? String(input.totalVolumeCBM) : undefined,
        hazmatClass: input.hazmatClass,
        imdgCode: input.imdgCode,
        incoterms: input.incoterms,
        freightTerms: input.freightTerms as any,
        etd: input.etd ? new Date(input.etd) : undefined,
        eta: input.eta ? new Date(input.eta) : undefined,
        status: "booking_requested" as any,
        transportMode: "VESSEL",
        companyId,
      });

      await db.insert(vesselShipmentEvents).values({
        shipmentId: (result as any).insertId,
        eventType: "booking_created",
        description: `Vessel booking ${bookingNumber} created`,
      });

      return { id: (result as any).insertId, bookingNumber, status: "booking_requested" };
    }),

  // 2. getVesselShipments
  getVesselShipments: vesselProcedure
    .input(z.object({
      status: z.string().optional(),
      originPortId: z.number().optional(),
      destinationPortId: z.number().optional(),
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
        conditions.push(eq(vesselShipments.shipperId, userId));
      }
      if (input.status) conditions.push(eq(vesselShipments.status, input.status as any));
      if (input.originPortId) conditions.push(eq(vesselShipments.originPortId, input.originPortId));
      if (input.destinationPortId) conditions.push(eq(vesselShipments.destinationPortId, input.destinationPortId));
      if (input.startDate) conditions.push(gte(vesselShipments.createdAt, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(vesselShipments.createdAt, new Date(input.endDate)));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const shipments = await db.select()
        .from(vesselShipments)
        .where(where)
        .orderBy(desc(vesselShipments.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [totalResult] = await db.select({ count: count() }).from(vesselShipments).where(where);

      return { shipments, total: totalResult?.count || 0 };
    }),

  // 3. getVesselShipmentDetail
  getVesselShipmentDetail: vesselProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [shipment] = await db.select().from(vesselShipments).where(eq(vesselShipments.id, input.id)).limit(1);
      if (!shipment) return null;

      const bols = await db.select().from(billsOfLading).where(eq(billsOfLading.shipmentId, input.id));
      const customs = await db.select().from(customsDeclarations).where(eq(customsDeclarations.shipmentId, input.id));
      const events = await db.select().from(vesselShipmentEvents).where(eq(vesselShipmentEvents.shipmentId, input.id)).orderBy(desc(vesselShipmentEvents.timestamp));
      const demurrage = await db.select().from(vesselDemurrage).where(eq(vesselDemurrage.shipmentId, input.id));
      const containers = await db.select().from(shippingContainers).where(eq(shippingContainers.assignedShipmentId, input.id));

      let originPort = null;
      let destinationPort = null;
      if (shipment.originPortId) {
        const [op] = await db.select().from(ports).where(eq(ports.id, shipment.originPortId)).limit(1);
        originPort = op;
      }
      if (shipment.destinationPortId) {
        const [dp] = await db.select().from(ports).where(eq(ports.id, shipment.destinationPortId)).limit(1);
        destinationPort = dp;
      }

      return { ...shipment, bols, customs, events, demurrage, containers, originPort, destinationPort };
    }),

  // 4. updateVesselShipmentStatus
  updateVesselShipmentStatus: vesselProcedure
    .input(z.object({
      id: z.number(),
      newStatus: z.string(),
      notes: z.string().optional(),
      location: z.object({ lat: z.number(), lng: z.number(), description: z.string().optional() }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [shipment] = await db.select({ status: vesselShipments.status }).from(vesselShipments).where(eq(vesselShipments.id, input.id)).limit(1);
      if (!shipment) throw new Error("Booking not found");

      const VALID_TRANSITIONS: Record<string, string[]> = {
        booking_requested: ["booking_confirmed", "cancelled"],
        booking_confirmed: ["documentation", "container_released", "cancelled"],
        documentation: ["container_released", "cancelled"],
        container_released: ["gate_in", "cancelled"],
        gate_in: ["loaded_on_vessel", "cancelled"],
        loaded_on_vessel: ["departed", "cancelled"],
        departed: ["in_transit", "cancelled"],
        in_transit: ["transshipment", "arrived", "cancelled"],
        transshipment: ["in_transit", "cancelled"],
        arrived: ["customs_hold", "customs_cleared", "discharged", "cancelled"],
        customs_hold: ["customs_cleared", "cancelled"],
        customs_cleared: ["discharged", "cancelled"],
        discharged: ["gate_out", "cancelled"],
        gate_out: ["delivered", "cancelled"],
        delivered: ["invoiced"],
        invoiced: ["settled"],
      };

      const currentStatus = shipment.status || "booking_requested";
      const allowed = VALID_TRANSITIONS[currentStatus] || ["cancelled"];
      if (!allowed.includes(input.newStatus)) {
        throw new Error(`Cannot transition from '${currentStatus}' to '${input.newStatus}'`);
      }

      await db.update(vesselShipments)
        .set({ status: input.newStatus as any })
        .where(eq(vesselShipments.id, input.id));

      await db.insert(vesselShipmentEvents).values({
        shipmentId: input.id,
        eventType: `status_${input.newStatus}`,
        description: input.notes || `Status changed to ${input.newStatus}`,
        location: input.location as any,
      });

      // Auto-create settlement for vessel bookings transitioning to 'settled'
      if (input.newStatus === 'settled' || input.newStatus === 'delivered') {
        try {
          const [booking] = await db.select().from(vesselShipments).where(eq(vesselShipments.id, input.id)).limit(1);
          if (booking && input.newStatus === 'settled') {
            const rate = Number(booking.rate || 0);
            const platformFeePercent = 5;
            const platformFee = Math.round(rate * platformFeePercent / 100 * 100) / 100;
            const carrierPayment = rate - platformFee;

            await db.execute(sql`INSERT IGNORE INTO settlements
              (loadId, shipperId, carrierId, loadRate, platformFeePercent, platformFeeAmount, carrierPayment, totalShipperCharge, status, createdAt)
              VALUES (${booking.id}, ${booking.shipperId}, ${booking.operatorId || 0}, ${String(rate)}, '${platformFeePercent}.00', ${String(platformFee)}, ${String(carrierPayment)}, ${String(rate)}, 'pending', NOW())`);

            logger.info(`[VesselSettlement] Created settlement for booking ${booking.bookingNumber}: $${rate}`);

            // Credit carrier/operator wallet
            try {
              const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, booking.operatorId || booking.shipperId)).limit(1);
              if (wallet) {
                await db.execute(sql`UPDATE wallets SET availableBalance = availableBalance + ${carrierPayment}, totalReceived = totalReceived + ${carrierPayment} WHERE id = ${wallet.id}`);
                logger.info(`[VesselSettlement] Credited wallet ${wallet.id} with $${carrierPayment}`);
              }
            } catch {}
          }
        } catch (settleErr) {
          logger.warn('[VesselSettlement] Settlement creation failed:', settleErr);
        }
      }

      // WebSocket real-time notification
      try {
        const io = (global as any).io;
        if (io) {
          io.to(`vessel:booking:${input.id}`).emit('vessel:status_changed', {
            shipmentId: input.id, newStatus: input.newStatus, timestamp: new Date().toISOString(),
          });
        }
      } catch {}

      return { success: true, newStatus: input.newStatus };
    }),

  // 5. createBOL
  createBOL: vesselProcedure
    .input(z.object({
      shipmentId: z.number(),
      bolType: z.enum(["master", "house", "express", "seaway"]),
      shipperId: z.number().optional(),
      consigneeId: z.number().optional(),
      notifyParty: z.object({ name: z.string(), address: z.string(), contact: z.string() }).optional(),
      originPort: z.string().optional(),
      destinationPort: z.string().optional(),
      vesselName: z.string().optional(),
      voyageNumber: z.string().optional(),
      cargoDescription: z.string().optional(),
      numberOfPackages: z.number().optional(),
      grossWeightKg: z.number().optional(),
      volumeCBM: z.number().optional(),
      freightTerms: z.enum(["prepaid", "collect"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const bolNumber = generateBOLNumber();
      const userId = Number((ctx.user as any)?.id);

      const [result] = await db.insert(billsOfLading).values({
        bolNumber,
        shipmentId: input.shipmentId,
        bolType: input.bolType as any,
        shipperId: input.shipperId || userId,
        consigneeId: input.consigneeId,
        notifyParty: input.notifyParty as any,
        originPort: input.originPort,
        destinationPort: input.destinationPort,
        vesselName: input.vesselName,
        voyageNumber: input.voyageNumber,
        cargoDescription: input.cargoDescription,
        numberOfPackages: input.numberOfPackages,
        grossWeightKg: input.grossWeightKg ? String(input.grossWeightKg) : undefined,
        volumeCBM: input.volumeCBM ? String(input.volumeCBM) : undefined,
        freightTerms: input.freightTerms as any,
        status: "draft" as any,
      });

      return { id: (result as any).insertId, bolNumber, status: "draft" };
    }),

  // 6. getBOL
  getBOL: vesselProcedure
    .input(z.object({ bolNumber: z.string().optional(), id: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      if (input.bolNumber) {
        const [bol] = await db.select().from(billsOfLading).where(eq(billsOfLading.bolNumber, input.bolNumber)).limit(1);
        return bol || null;
      }
      if (input.id) {
        const [bol] = await db.select().from(billsOfLading).where(eq(billsOfLading.id, input.id)).limit(1);
        return bol || null;
      }
      return null;
    }),

  // 7. createCustomsEntry
  createCustomsEntry: vesselProcedure
    .input(z.object({
      shipmentId: z.number(),
      declarationType: z.enum(["import", "export", "transit", "temporary_import"]),
      htsCode: z.string().optional(),
      countryOfOrigin: z.string().optional(),
      declaredValue: z.number().optional(),
      currency: z.string().default("USD"),
      dutyRate: z.number().optional(),
      brokerId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const dutyAmount = (input.declaredValue && input.dutyRate) ? input.declaredValue * input.dutyRate : undefined;

      const [result] = await db.insert(customsDeclarations).values({
        shipmentId: input.shipmentId,
        declarationType: input.declarationType as any,
        htsCode: input.htsCode,
        countryOfOrigin: input.countryOfOrigin,
        declaredValue: input.declaredValue ? String(input.declaredValue) : undefined,
        currency: input.currency,
        dutyRate: input.dutyRate ? String(input.dutyRate) : undefined,
        dutyAmount: dutyAmount ? String(dutyAmount) : undefined,
        brokerId: input.brokerId || Number((ctx.user as any)?.id),
        status: "draft" as any,
      });

      return { id: (result as any).insertId, status: "draft" };
    }),

  // 8. updateCustomsStatus
  updateCustomsStatus: vesselProcedure
    .input(z.object({
      id: z.number(),
      newStatus: z.enum(["draft", "filed", "under_review", "cleared", "held", "rejected"]),
      holdReasons: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const updateData: any = { status: input.newStatus };
      if (input.newStatus === "filed") updateData.filedDate = new Date();
      if (input.newStatus === "cleared") updateData.clearedDate = new Date();
      if (input.holdReasons) updateData.holdReasons = input.holdReasons;

      await db.update(customsDeclarations).set(updateData).where(eq(customsDeclarations.id, input.id));
      return { success: true, newStatus: input.newStatus };
    }),

  // 9. getContainerTracking
  getContainerTracking: vesselProcedure
    .input(z.object({ containerNumber: z.string().optional(), containerId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { container: null, movements: [] };

      let container = null;
      if (input.containerNumber) {
        const [c] = await db.select().from(shippingContainers).where(eq(shippingContainers.containerNumber, input.containerNumber)).limit(1);
        container = c;
      } else if (input.containerId) {
        const [c] = await db.select().from(shippingContainers).where(eq(shippingContainers.id, input.containerId)).limit(1);
        container = c;
      }

      if (!container) return { container: null, movements: [] };

      const movements = await db.select()
        .from(containerTracking)
        .where(eq(containerTracking.containerId, (container as any).id))
        .orderBy(desc(containerTracking.timestamp));

      return { container, movements };
    }),

  // 10. recordContainerMovement
  recordContainerMovement: vesselProcedure
    .input(z.object({
      containerId: z.number(),
      shipmentId: z.number().optional(),
      eventType: z.string(),
      portId: z.number().optional(),
      location: z.object({ lat: z.number(), lng: z.number(), description: z.string().optional() }).optional(),
      temperature: z.number().optional(),
      humidity: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.insert(containerTracking).values({
        containerId: input.containerId,
        shipmentId: input.shipmentId,
        eventType: input.eventType,
        portId: input.portId,
        location: input.location as any,
        temperature: input.temperature ? String(input.temperature) : undefined,
        humidity: input.humidity ? String(input.humidity) : undefined,
      });

      return { success: true };
    }),

  // 11. getVesselSchedules
  getVesselSchedules: vesselProcedure
    .input(z.object({
      vesselId: z.number().optional(),
      departurePortId: z.number().optional(),
      arrivalPortId: z.number().optional(),
      status: z.string().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let conditions: any[] = [];
      if (input.vesselId) conditions.push(eq(vesselVoyages.vesselId, input.vesselId));
      if (input.departurePortId) conditions.push(eq(vesselVoyages.departurePortId, input.departurePortId));
      if (input.arrivalPortId) conditions.push(eq(vesselVoyages.arrivalPortId, input.arrivalPortId));
      if (input.status) conditions.push(eq(vesselVoyages.status, input.status as any));

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      return db.select().from(vesselVoyages).where(where).orderBy(desc(vesselVoyages.scheduledDeparture)).limit(input.limit);
    }),

  // 12. searchRates
  searchRates: vesselProcedure
    .input(z.object({
      originPortId: z.number().optional(),
      destinationPortId: z.number().optional(),
      containerSize: z.enum(["20ft", "40ft", "40ft_hc", "45ft"]).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let conditions: any[] = [];
      if (input.originPortId) conditions.push(eq(vesselFreightRates.originPortId, input.originPortId));
      if (input.destinationPortId) conditions.push(eq(vesselFreightRates.destinationPortId, input.destinationPortId));
      if (input.containerSize) conditions.push(eq(vesselFreightRates.containerSize, input.containerSize as any));

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      return db.select().from(vesselFreightRates).where(where);
    }),

  // 13. createVesselBid
  createVesselBid: vesselProcedure
    .input(z.object({
      shipmentId: z.number(),
      amount: z.number(),
      rateType: z.enum(["per_teu", "per_ton", "per_cbm", "lump_sum"]).optional(),
      transitDays: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = Number((ctx.user as any)?.id);

      await db.insert(vesselShipmentEvents).values({
        shipmentId: input.shipmentId,
        eventType: "bid_submitted",
        description: `Bid of $${input.amount} submitted (${input.rateType || "lump_sum"}, ${input.transitDays || "N/A"} days)`,
        metadata: { bidderId: userId, amount: input.amount, rateType: input.rateType, transitDays: input.transitDays, notes: input.notes },
      });

      return { success: true };
    }),

  // 14. getVesselDemurrage
  getVesselDemurrage: vesselProcedure
    .input(z.object({ shipmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(vesselDemurrage).where(eq(vesselDemurrage.shipmentId, input.shipmentId));
    }),

  // 15. getVesselSettlement
  getVesselSettlement: vesselProcedure
    .input(z.object({ shipmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [shipment] = await db.select().from(vesselShipments).where(eq(vesselShipments.id, input.shipmentId)).limit(1);
      if (!shipment) return null;

      const demurrageCharges = await db.select().from(vesselDemurrage).where(eq(vesselDemurrage.shipmentId, input.shipmentId));
      const portCharges = await db.select().from(vesselPortCharges).where(eq(vesselPortCharges.voyageId, input.shipmentId));

      const totalDemurrage = demurrageCharges.reduce((sum: number, d: any) => sum + parseFloat(d.totalCharge || "0"), 0);
      const totalPortCharges = portCharges.reduce((sum: number, p: any) => sum + parseFloat(p.amount || "0"), 0);
      const freight = parseFloat((shipment as any).rate || "0");

      return {
        shipmentId: input.shipmentId,
        bookingNumber: shipment.bookingNumber,
        status: shipment.status,
        freight,
        demurrage: totalDemurrage,
        portCharges: totalPortCharges,
        total: freight + totalDemurrage + totalPortCharges,
        currency: "USD",
      };
    }),

  // 16. getPortDetails
  getPortDetails: vesselProcedure
    .input(z.object({ portId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [port] = await db.select().from(ports).where(eq(ports.id, input.portId)).limit(1);
      if (!port) return null;

      const berths = await db.select().from(portBerths).where(eq(portBerths.portId, input.portId));

      return { ...port, berths };
    }),

  // 17. getBerthSchedule
  getBerthSchedule: vesselProcedure
    .input(z.object({ portId: z.number(), berthId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const berths = await db.select().from(portBerths).where(eq(portBerths.portId, input.portId));
      const berthIds = berths.map((b: any) => b.id);

      if (berthIds.length === 0) return [];

      let conditions: any[] = [inArray(vesselBerthAssignments.berthId, berthIds)];
      if (input.berthId) conditions = [eq(vesselBerthAssignments.berthId, input.berthId)];

      return db.select().from(vesselBerthAssignments).where(and(...conditions));
    }),

  // 18. getVesselDashboard
  getVesselDashboard: vesselProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return { activeBookings: 0, containersInTransit: 0, revenue: 0 };

      const activeStatuses = ["booking_requested", "booking_confirmed", "documentation", "container_released", "gate_in", "loaded_on_vessel", "departed", "in_transit", "transshipment", "arrived", "customs_hold", "discharged", "gate_out"];

      const [activeResult] = await db.select({ count: count() })
        .from(vesselShipments)
        .where(inArray(vesselShipments.status, activeStatuses as any));

      const [containerResult] = await db.select({ count: count() })
        .from(shippingContainers)
        .where(eq(shippingContainers.status, "in_transit" as any));

      const [revenueResult] = await db.select({ total: sql<string>`COALESCE(SUM(rate), 0)` })
        .from(vesselShipments)
        .where(eq(vesselShipments.status, "settled" as any));

      return {
        activeBookings: activeResult?.count || 0,
        containersInTransit: containerResult?.count || 0,
        revenue: parseFloat(revenueResult?.total || "0"),
      };
    }),

  // 19. getVesselCompliance
  getVesselCompliance: vesselProcedure
    .input(z.object({ vesselId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { inspections: [], ispsRecords: [], insurance: [], status: "unknown" };

      let inspections: any[] = [];
      let ispsRecords: any[] = [];
      let insurance: any[] = [];

      if (input.vesselId) {
        inspections = await db.select().from(vesselInspections).where(eq(vesselInspections.vesselId, input.vesselId)).orderBy(desc(vesselInspections.inspectionDate)).limit(20);
        ispsRecords = await db.select().from(vesselISPSRecords).where(eq(vesselISPSRecords.vesselId, input.vesselId)).limit(10);
        insurance = await db.select().from(vesselInsurance).where(eq(vesselInsurance.vesselId, input.vesselId));
      } else {
        inspections = await db.select().from(vesselInspections).orderBy(desc(vesselInspections.inspectionDate)).limit(20);
        ispsRecords = await db.select().from(vesselISPSRecords).limit(10);
      }

      const failedInspections = inspections.filter((i: any) => i.result === "fail" || i.result === "detention");
      const expiredInsurance = insurance.filter((i: any) => i.status === "expired");

      return {
        inspections,
        ispsRecords,
        insurance,
        status: (failedInspections.length > 0 || expiredInsurance.length > 0) ? "non_compliant" : "compliant",
        totalInspections: inspections.length,
        failedCount: failedInspections.length,
      };
    }),

  // 20. getISFStatus
  getISFStatus: vesselProcedure
    .input(z.object({ shipmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [shipment] = await db.select().from(vesselShipments).where(eq(vesselShipments.id, input.shipmentId)).limit(1);
      if (!shipment) return null;

      const customs = await db.select().from(customsDeclarations).where(
        and(eq(customsDeclarations.shipmentId, input.shipmentId), eq(customsDeclarations.declarationType, "import" as any))
      );

      const isfFiled = customs.length > 0;
      const isfCleared = customs.some((c: any) => c.status === "cleared");

      return {
        shipmentId: input.shipmentId,
        bookingNumber: shipment.bookingNumber,
        isfFiled,
        isfCleared,
        entries: customs,
        deadline: shipment.etd ? new Date(new Date(shipment.etd).getTime() - 24 * 60 * 60 * 1000) : null,
      };
    }),

  // 21. getVesselFleet — vessel registry with current positions for map
  getVesselFleet: vesselProcedure
    .input(z.object({
      vesselType: z.string().optional(),
      status: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { vessels: [], total: 0 };

      let conditions: any[] = [];
      if (input.vesselType) conditions.push(eq(vessels.vesselType, input.vesselType as any));
      if (input.status) conditions.push(eq(vessels.status, input.status as any));
      if (input.search) conditions.push(sql`(${vessels.name} LIKE ${'%' + input.search + '%'} OR ${vessels.imoNumber} LIKE ${'%' + input.search + '%'})`);

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const fleet = await db.select().from(vessels).where(where)
        .orderBy(desc(vessels.updatedAt))
        .limit(input.limit).offset(input.offset);
      const [totalResult] = await db.select({ count: count() }).from(vessels).where(where);

      return { vessels: fleet, total: totalResult?.count || 0 };
    }),

  // 22. getContainerPositions — all containers with locations for map
  getContainerPositions: vesselProcedure
    .input(z.object({
      status: z.string().optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { containers: [], total: 0 };

      let conditions: any[] = [];
      if (input.status) conditions.push(eq(shippingContainers.status, input.status as any));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const containers = await db.select().from(shippingContainers).where(where)
        .orderBy(desc(shippingContainers.updatedAt))
        .limit(input.limit);
      const [totalResult] = await db.select({ count: count() }).from(shippingContainers).where(where);

      return { containers, total: totalResult?.count || 0 };
    }),

  // 23. calculateVesselDemurrage — compute container demurrage charges
  calculateVesselDemurrage: vesselProcedure
    .input(z.object({ shipmentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Check existing demurrage records
      const existing = await db.select().from(vesselDemurrage).where(eq(vesselDemurrage.shipmentId, input.shipmentId));

      // Query vessel shipment events for discharge and gate_out to compute dwell
      const events = await db.select()
        .from(vesselShipmentEvents)
        .where(eq(vesselShipmentEvents.shipmentId, input.shipmentId))
        .orderBy(vesselShipmentEvents.timestamp);

      const discharged = events.find((e: any) => e.eventType === "status_discharged" || e.eventType === "discharged");
      const gateOut = events.find((e: any) => e.eventType === "status_gate_out" || e.eventType === "gate_out");

      if (!discharged) {
        return { demurrage: 0, dwellDays: 0, freeTimeDays: 4, message: "No discharge event found" };
      }

      const startTime = new Date(discharged.timestamp!);
      const endTime = gateOut ? new Date(gateOut.timestamp!) : new Date();
      const dwellMs = endTime.getTime() - startTime.getTime();
      const dwellDays = Math.max(0, dwellMs / (1000 * 60 * 60 * 24));
      const freeTimeDays = 4; // industry standard
      const chargeableDays = Math.max(0, dwellDays - freeTimeDays);
      const ratePerDay = 150; // container demurrage rate
      const [shipment] = await db.select().from(vesselShipments).where(eq(vesselShipments.id, input.shipmentId)).limit(1);
      const containerCount = shipment?.numberOfContainers || 1;
      const demurrageAmount = Math.round(chargeableDays * ratePerDay * containerCount * 100) / 100;

      if (demurrageAmount > 0) {
        await db.insert(vesselDemurrage).values({
          shipmentId: input.shipmentId,
          chargeType: "demurrage" as any,
          startDate: startTime,
          endDate: endTime,
          freeTimeDays: String(freeTimeDays),
          chargeableDays: String(chargeableDays),
          ratePerDay: String(ratePerDay),
          totalCharge: String(demurrageAmount),
          containerCount,
          status: "pending" as any,
        });

        logger.info(`[VesselDemurrage] Shipment ${input.shipmentId}: ${chargeableDays.toFixed(1)} days x ${containerCount} containers @ $${ratePerDay}/day = $${demurrageAmount}`);
      }

      return { demurrage: demurrageAmount, dwellDays: Math.round(dwellDays * 10) / 10, freeTimeDays, chargeableDays: Math.round(chargeableDays * 10) / 10, containerCount };
    }),

  // ═══════════════════════════════════════════════════════════════
  // INTEGRATION-POWERED PROCEDURES — Live External API Data
  // ═══════════════════════════════════════════════════════════════

  /**
   * MarineTraffic/Kpler — Live AIS vessel position
   */
  liveVesselPosition: vesselProcedure
    .input(z.object({ imoNumber: z.string() }))
    .query(async ({ input }) => {
      const cacheKey = `vessel:ais:${input.imoNumber}`;
      try {
        return await lsCacheThrough("WARM", cacheKey, async () => {
          return await marineTrafficService.getVesselPosition(input.imoNumber);
        }, 120); // 2min — AIS updates frequently
      } catch (e) { logger.error("[Vessel] liveVesselPosition error:", e); return null; }
    }),

  /**
   * MarineTraffic — Vessel particulars & specs
   */
  getVesselParticulars: vesselProcedure
    .input(z.object({ imoNumber: z.string() }))
    .query(async ({ input }) => {
      const cacheKey = `vessel:particulars:${input.imoNumber}`;
      try {
        return await lsCacheThrough("WARM", cacheKey, async () => {
          return await marineTrafficService.getVesselParticulars(input.imoNumber);
        }, 86400); // 24h — specs don't change
      } catch (e) { logger.error("[Vessel] getVesselParticulars error:", e); return null; }
    }),

  /**
   * MarineTraffic — Port call history
   */
  getVesselPortCalls: vesselProcedure
    .input(z.object({ imoNumber: z.string(), days: z.number().default(30) }))
    .query(async ({ input }) => {
      try {
        return await marineTrafficService.getPortCalls(input.imoNumber, input.days);
      } catch (e) { logger.error("[Vessel] getVesselPortCalls error:", e); return null; }
    }),

  /**
   * MarineTraffic — Vessels in/near port
   */
  getVesselsAtPort: vesselProcedure
    .input(z.object({ portId: z.string() }))
    .query(async ({ input }) => {
      const cacheKey = `vessel:port:${input.portId}`;
      try {
        return await lsCacheThrough("AGGREGATE", cacheKey, async () => {
          return await marineTrafficService.getVesselsByPort(input.portId);
        }, 300);
      } catch (e) { logger.error("[Vessel] getVesselsAtPort error:", e); return null; }
    }),

  /**
   * MarineTraffic — Vessel route (historical track for map plotting)
   */
  getVesselTrack: vesselProcedure
    .input(z.object({ imoNumber: z.string() }))
    .query(async ({ input }) => {
      try {
        return await marineTrafficService.getVesselRoute(input.imoNumber);
      } catch (e) { logger.error("[Vessel] getVesselTrack error:", e); return null; }
    }),

  /**
   * INTTRA/E2open — Search carrier schedules
   */
  searchCarrierSchedules: vesselProcedure
    .input(z.object({
      originPort: z.string(),
      destPort: z.string(),
      departureDate: z.string(),
    }))
    .query(async ({ input }) => {
      const cacheKey = `vessel:schedules:${input.originPort}:${input.destPort}:${input.departureDate}`;
      try {
        return await lsCacheThrough("WARM", cacheKey, async () => {
          return await inttraService.searchSchedules(input.originPort, input.destPort, input.departureDate);
        }, 900);
      } catch (e) { logger.error("[Vessel] searchCarrierSchedules error:", e); return null; }
    }),

  /**
   * INTTRA/E2open — Get carrier rate quotes
   */
  getCarrierRates: vesselProcedure
    .input(z.object({
      originPort: z.string(),
      destPort: z.string(),
      containerSize: z.string(),
    }))
    .query(async ({ input }) => {
      const cacheKey = `vessel:rates:${input.originPort}:${input.destPort}:${input.containerSize}`;
      try {
        return await lsCacheThrough("WARM", cacheKey, async () => {
          return await inttraService.getCarrierRates(input.originPort, input.destPort, input.containerSize);
        }, 900);
      } catch (e) { logger.error("[Vessel] getCarrierRates error:", e); return null; }
    }),

  /**
   * INTTRA/E2open — Track shipment across carriers
   */
  liveTrackOceanShipment: vesselProcedure
    .input(z.object({ referenceNumber: z.string() }))
    .query(async ({ input }) => {
      const cacheKey = `vessel:inttra:track:${input.referenceNumber}`;
      try {
        return await lsCacheThrough("WARM", cacheKey, async () => {
          return await inttraService.trackShipment(input.referenceNumber);
        }, 300);
      } catch (e) { logger.error("[Vessel] liveTrackOceanShipment error:", e); return null; }
    }),

  /**
   * Descartes ABI — File ISF (Importer Security Filing 10+2)
   */
  fileISF: vesselProcedure
    .input(z.object({
      importer: z.string(),
      seller: z.string(),
      buyer: z.string(),
      shipTo: z.string(),
      containerStuffing: z.string(),
      consolidator: z.string(),
      htsNumbers: z.array(z.string()),
      manufacturer: z.string(),
      countryOfOrigin: z.string(),
      vessel: z.string(),
      voyageNumber: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        return await descartesABIService.fileISF(input);
      } catch (e) { logger.error("[Vessel] fileISF error:", e); return null; }
    }),

  /**
   * Descartes ABI — Get CBP entry status
   */
  getCBPEntryStatus: vesselProcedure
    .input(z.object({ entryNumber: z.string() }))
    .query(async ({ input }) => {
      try {
        return await descartesABIService.getEntryStatus(input.entryNumber);
      } catch (e) { logger.error("[Vessel] getCBPEntryStatus error:", e); return null; }
    }),

  /**
   * Descartes ABI — Get CBP holds & alerts
   */
  getCBPAlerts: vesselProcedure
    .input(z.object({ importerId: z.string() }))
    .query(async ({ input }) => {
      try {
        return await descartesABIService.getCBPAlerts(input.importerId);
      } catch (e) { logger.error("[Vessel] getCBPAlerts error:", e); return null; }
    }),

  /**
   * DTN — Marine weather forecast
   */
  getMarineWeather: vesselProcedure
    .input(z.object({ lat: z.number(), lng: z.number() }))
    .query(async ({ input }) => {
      const cacheKey = `vessel:weather:${input.lat.toFixed(1)}:${input.lng.toFixed(1)}`;
      try {
        return await lsCacheThrough("AGGREGATE", cacheKey, async () => {
          return await dtnMarineWeatherService.getMarineForecast(input.lat, input.lng);
        }, 600);
      } catch (e) { logger.error("[Vessel] getMarineWeather error:", e); return null; }
    }),

  /**
   * DTN — Weather along route (for voyage planning)
   */
  getRouteWeather: vesselProcedure
    .input(z.object({ waypoints: z.array(z.object({ lat: z.number(), lng: z.number() })) }))
    .query(async ({ input }) => {
      try {
        return await dtnMarineWeatherService.getRouteWeather(input.waypoints);
      } catch (e) { logger.error("[Vessel] getRouteWeather error:", e); return null; }
    }),

  /**
   * DTN — Port conditions (wind, tide, visibility)
   */
  getPortWeather: vesselProcedure
    .input(z.object({ portId: z.string() }))
    .query(async ({ input }) => {
      const cacheKey = `vessel:portweather:${input.portId}`;
      try {
        return await lsCacheThrough("AGGREGATE", cacheKey, async () => {
          return await dtnMarineWeatherService.getPortConditions(input.portId);
        }, 600);
      } catch (e) { logger.error("[Vessel] getPortWeather error:", e); return null; }
    }),

  /**
   * OilPriceAPI — Bunker fuel prices at port
   */
  getBunkerPrices: vesselProcedure
    .input(z.object({ port: z.string(), fuelTypes: z.array(z.string()).optional() }))
    .query(async ({ input }) => {
      const cacheKey = `vessel:bunker:${input.port}`;
      try {
        return await lsCacheThrough("AGGREGATE", cacheKey, async () => {
          return await oilPriceMarineService.getBunkerPrices(input.port, input.fuelTypes);
        }, 900); // 15min — fuel prices update periodically
      } catch (e) { logger.error("[Vessel] getBunkerPrices error:", e); return null; }
    }),

  /**
   * OilPriceAPI — Global bunker prices (major hubs)
   */
  getGlobalBunkerPrices: vesselProcedure
    .query(async () => {
      try {
        return await lsCacheThrough("AGGREGATE", "vessel:bunker:global", async () => {
          return await oilPriceMarineService.getGlobalBunkerPrices();
        }, 900);
      } catch (e) { logger.error("[Vessel] getGlobalBunkerPrices error:", e); return null; }
    }),

  /**
   * Avalara — HTS tariff code classification
   */
  classifyHTS: vesselProcedure
    .input(z.object({
      description: z.string(),
      countryOfOrigin: z.string().optional(),
      destinationCountry: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        return await avalaraHTSService.classifyProduct(input.description, input.countryOfOrigin, input.destinationCountry);
      } catch (e) { logger.error("[Vessel] classifyHTS error:", e); return null; }
    }),

  /**
   * Avalara — Duty estimate calculator
   */
  getDutyEstimate: vesselProcedure
    .input(z.object({
      htsCode: z.string(),
      declaredValue: z.number(),
      countryOfOrigin: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        return await avalaraHTSService.getDutyEstimate(input.htsCode, input.declaredValue, input.countryOfOrigin);
      } catch (e) { logger.error("[Vessel] getDutyEstimate error:", e); return null; }
    }),

  /**
   * Avalara — Trade agreement lookup
   */
  getTradeAgreements: vesselProcedure
    .input(z.object({ htsCode: z.string(), originCountry: z.string() }))
    .query(async ({ input }) => {
      try {
        return await avalaraHTSService.getTradeAgreements(input.htsCode, input.originCountry);
      } catch (e) { logger.error("[Vessel] getTradeAgreements error:", e); return null; }
    }),

  getCustomsEntries: vesselProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      try {
        return await db.select().from(customsDeclarations).orderBy(desc(customsDeclarations.id)).limit(50);
      } catch { return []; }
    }),

  getVesselFinancialSummary: vesselProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return { settlements: [], demurrage: [] };
      try {
        const s = await db.select().from(settlements).limit(20);
        const d = await db.select().from(vesselDemurrage).limit(20);
        return { settlements: s, demurrage: d };
      } catch { return { settlements: [], demurrage: [] }; }
    }),
});
