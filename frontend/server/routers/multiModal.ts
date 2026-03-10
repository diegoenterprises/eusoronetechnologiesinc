/**
 * MULTI-MODAL & INTERMODAL TRANSPORTATION ROUTER
 * tRPC procedures for intermodal operations, rail coordination, port operations,
 * drayage management, transloading, container tracking, chassis management,
 * per diem/demurrage tracking, and mode optimization.
 */

import { z } from "zod";
import { eq, sql, and, desc } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { loads, vehicles, detentionRecords } from "../../drizzle/schema";
import { unsafeCast } from "../_core/types/unsafe";

// ── Shared Zod schemas ──────────────────────────────────────────────

const transportModeSchema = z.enum(["truck", "rail", "ocean", "air", "barge", "intermodal"]);
const containerSizeSchema = z.enum(["20ft", "40ft", "40ft_hc", "45ft", "53ft"]);
const containerTypeSchema = z.enum(["dry", "reefer", "flat_rack", "open_top", "tank", "bulk"]);
const chassisTypeSchema = z.enum(["standard", "tri_axle", "gooseneck", "extendable", "bomb_cart"]);
const railCarrierSchema = z.enum(["BNSF", "UP", "NS", "CSX", "CN", "CP", "KCS"]);
const bookingStatusSchema = z.enum(["draft", "pending", "confirmed", "in_transit", "completed", "cancelled"]);
const drayageTypeSchema = z.enum(["import", "export", "pier_pass", "shuttle", "repositioning"]);
const customsStatusSchema = z.enum(["not_filed", "filed", "under_review", "cleared", "hold", "rejected"]);

const paginationInput = z.object({
  page: z.number().default(1),
  limit: z.number().default(25),
  search: z.string().optional(),
});

const dateRangeInput = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// ── Helper: generate deterministic demo data from a seed ─────────

function seededId(prefix: string, i: number): string {
  return `${prefix}_${String(i).padStart(5, "0")}`;
}

const PORTS = [
  { code: "USLAX", name: "Port of Los Angeles", city: "Los Angeles", state: "CA" },
  { code: "USLGB", name: "Port of Long Beach", city: "Long Beach", state: "CA" },
  { code: "USSAV", name: "Port of Savannah", city: "Savannah", state: "GA" },
  { code: "USNWK", name: "Port Newark", city: "Newark", state: "NJ" },
  { code: "USHOU", name: "Port of Houston", city: "Houston", state: "TX" },
  { code: "USCHA", name: "Port of Charleston", city: "Charleston", state: "SC" },
  { code: "USSEA", name: "Port of Seattle/Tacoma", city: "Seattle", state: "WA" },
  { code: "USOAK", name: "Port of Oakland", city: "Oakland", state: "CA" },
];

const RAMPS = [
  { code: "CHIR", name: "Chicago Logistics Park", city: "Chicago", state: "IL", railroad: "BNSF" as const },
  { code: "KCMO", name: "Kansas City Intermodal", city: "Kansas City", state: "MO", railroad: "UP" as const },
  { code: "MEMP", name: "Memphis Intermodal", city: "Memphis", state: "TN", railroad: "NS" as const },
  { code: "ATLA", name: "Atlanta Fairburn", city: "Atlanta", state: "GA", railroad: "CSX" as const },
  { code: "DALL", name: "Dallas Alliance Terminal", city: "Dallas", state: "TX", railroad: "BNSF" as const },
  { code: "ELPA", name: "El Paso Intermodal", city: "El Paso", state: "TX", railroad: "UP" as const },
];

const SHIPPING_LINES = [
  "Maersk", "MSC", "CMA CGM", "COSCO", "Hapag-Lloyd", "ONE", "Evergreen", "Yang Ming", "ZIM",
];

// ── Router ───────────────────────────────────────────────────────────

export const multiModalRouter = router({

  // ────────────────────────────────────────────────────────────────────
  // 1. DASHBOARD
  // ────────────────────────────────────────────────────────────────────

  getMultiModalDashboard: protectedProcedure
    .input(z.object({ companyId: z.number().optional() }).optional())
    .query(async () => {
      // Default summary in case DB is unavailable
      let summary = {
        activeShipments: 247,
        byMode: { truck: 142, rail: 58, ocean: 32, intermodal: 15 } as Record<string, number>,
        containersTracked: 189,
        chassisInUse: 94,
        drayageOrders: 37,
        transloadOrders: 12,
        pendingCustomsClearance: 8,
        alertCount: 14,
      };

      try {
        const db = await getDb();
        if (db) {
          // Active intermodal/multimodal loads by cargo type
          const activeStatuses = [
            "posted", "bidding", "awarded", "accepted", "assigned", "confirmed",
            "en_route_pickup", "at_pickup", "loading", "loaded",
            "in_transit", "at_delivery", "unloading",
          ];
          const statusPlaceholders = activeStatuses.map(s => `'${s}'`).join(",");

          const [modeRows] = await db.execute(sql.raw(
            `SELECT cargoType, COUNT(*) as cnt FROM loads WHERE status IN (${statusPlaceholders}) AND deletedAt IS NULL GROUP BY cargoType`
          ));
          const modeMap: Record<string, number> = { truck: 0, rail: 0, ocean: 0, intermodal: 0 };
          let total = 0;
          for (const row of unsafeCast(modeRows)) {
            const ct = row.cargoType as string;
            const count = Number(row.cnt);
            total += count;
            if (ct === "intermodal") modeMap.intermodal += count;
            else modeMap.truck += count; // default non-intermodal to truck
          }

          if (total > 0) {
            summary.activeShipments = total;
            summary.byMode = modeMap;
          }

          // Container chassis vehicles in use
          const [chassisRows] = await db.execute(
            sql`SELECT COUNT(*) as cnt FROM vehicles WHERE vehicleType = 'container_chassis' AND status = 'active'`
          );
          const chassisCount = Number(unsafeCast(chassisRows)[0]?.cnt ?? 0);
          if (chassisCount > 0) summary.chassisInUse = chassisCount;
        }
      } catch (e) {
        logger.warn("[MultiModal] Dashboard DB query failed, using fallback:", e);
      }

      return {
        summary,
        recentActivity: [
          { id: "act_001", type: "booking_confirmed", mode: "intermodal", ref: "IMB-20260310-001", timestamp: new Date().toISOString(), detail: "BNSF Chicago to LA confirmed" },
          { id: "act_002", type: "container_gated_in", mode: "drayage", ref: "DRY-001", timestamp: new Date(Date.now() - 3600000).toISOString(), detail: "MSCU1234567 gated in at Port of LA" },
          { id: "act_003", type: "last_free_day_alert", mode: "ocean", ref: "CNT-003", timestamp: new Date(Date.now() - 7200000).toISOString(), detail: "CMAU7654321 LFD tomorrow at Long Beach" },
          { id: "act_004", type: "rail_departed", mode: "rail", ref: "RAIL-012", timestamp: new Date(Date.now() - 10800000).toISOString(), detail: "Train BNSF Q-LACHG departed Los Angeles" },
          { id: "act_005", type: "chassis_returned", mode: "chassis", ref: "CHS-045", timestamp: new Date(Date.now() - 14400000).toISOString(), detail: "DCLI chassis returned to LBCT pool" },
        ],
        kpis: {
          avgTransitDays: { truck: 2.3, rail: 4.8, ocean: 18.5, intermodal: 5.1 },
          costPerMile: { truck: 2.85, rail: 0.95, ocean: 0.12, intermodal: 1.45 },
          onTimeRate: { truck: 94.2, rail: 87.5, ocean: 82.1, intermodal: 89.3 },
          avgDwellHours: { port: 48.2, ramp: 12.4, terminal: 6.8 },
        },
      };
    }),

  // ────────────────────────────────────────────────────────────────────
  // 2. INTERMODAL BOOKING
  // ────────────────────────────────────────────────────────────────────

  getIntermodalBooking: protectedProcedure
    .input(paginationInput.merge(z.object({
      status: bookingStatusSchema.optional(),
      mode: transportModeSchema.optional(),
    })))
    .query(async ({ input }) => {
      const statuses: Array<z.infer<typeof bookingStatusSchema>> = ["confirmed", "in_transit", "pending", "draft", "completed"];
      const bookings = Array.from({ length: 18 }, (_, i) => ({
        id: seededId("IMB", i + 1),
        bookingNumber: `IMB-2026${String(3).padStart(2, "0")}${String(10 + i).padStart(2, "0")}-${String(i + 1).padStart(3, "0")}`,
        status: statuses[i % statuses.length],
        mode: (i % 2 === 0 ? "intermodal" : "rail") as z.infer<typeof transportModeSchema>,
        origin: { city: RAMPS[i % RAMPS.length].city, state: RAMPS[i % RAMPS.length].state, ramp: RAMPS[i % RAMPS.length].name },
        destination: { city: RAMPS[(i + 3) % RAMPS.length].city, state: RAMPS[(i + 3) % RAMPS.length].state, ramp: RAMPS[(i + 3) % RAMPS.length].name },
        railroad: RAMPS[i % RAMPS.length].railroad,
        containerNumber: `MSCU${String(1000000 + i * 111)}`,
        containerSize: (i % 2 === 0 ? "53ft" : "40ft") as z.infer<typeof containerSizeSchema>,
        weight: 38000 + i * 500,
        commodity: ["Electronics", "Auto Parts", "Consumer Goods", "Paper Products", "Food & Beverage"][i % 5],
        pickupDate: new Date(Date.now() + i * 86400000).toISOString().split("T")[0],
        deliveryDate: new Date(Date.now() + (i + 5) * 86400000).toISOString().split("T")[0],
        rate: 2800 + i * 150,
        drayageOrigin: i % 3 === 0,
        drayageDestination: i % 4 === 0,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      }));

      let filtered = bookings;
      if (input.status) filtered = filtered.filter(b => b.status === input.status);
      if (input.mode) filtered = filtered.filter(b => b.mode === input.mode);
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(b =>
          b.bookingNumber.toLowerCase().includes(q) ||
          b.containerNumber.toLowerCase().includes(q) ||
          b.origin.city.toLowerCase().includes(q) ||
          b.destination.city.toLowerCase().includes(q)
        );
      }

      const start = (input.page - 1) * input.limit;
      return {
        bookings: filtered.slice(start, start + input.limit),
        total: filtered.length,
        page: input.page,
        totalPages: Math.ceil(filtered.length / input.limit),
      };
    }),

  createIntermodalBooking: protectedProcedure
    .input(z.object({
      mode: transportModeSchema,
      railroad: railCarrierSchema.optional(),
      origin: z.object({ city: z.string(), state: z.string(), ramp: z.string().optional(), port: z.string().optional() }),
      destination: z.object({ city: z.string(), state: z.string(), ramp: z.string().optional(), port: z.string().optional() }),
      containerSize: containerSizeSchema,
      containerType: containerTypeSchema.default("dry"),
      weight: z.number(),
      commodity: z.string(),
      pickupDate: z.string(),
      deliveryDate: z.string(),
      drayageOrigin: z.boolean().default(false),
      drayageDestination: z.boolean().default(false),
      hazmat: z.boolean().default(false),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = `IMB-${Date.now()}`;
      logger.info(`[MultiModal] createIntermodalBooking by user ${ctx.user?.id}: ${id}`);
      return {
        id,
        bookingNumber: id,
        status: "pending" as const,
        ...input,
        rate: input.mode === "rail" ? 2400 : input.mode === "ocean" ? 3800 : 3200,
        estimatedTransitDays: input.mode === "rail" ? 5 : input.mode === "ocean" ? 18 : 3,
        createdAt: new Date().toISOString(),
        createdBy: ctx.user?.id,
      };
    }),

  // ────────────────────────────────────────────────────────────────────
  // 3. RAIL OPERATIONS
  // ────────────────────────────────────────────────────────────────────

  getRailOperations: protectedProcedure
    .input(paginationInput.merge(z.object({
      railroad: railCarrierSchema.optional(),
      status: z.enum(["en_route", "at_ramp", "loaded", "empty_return", "delayed"]).optional(),
    })))
    .query(async ({ input }) => {
      const railStatuses = ["en_route", "at_ramp", "loaded", "empty_return", "delayed"] as const;
      const trains = Array.from({ length: 24 }, (_, i) => {
        const rr = (["BNSF", "UP", "NS", "CSX"] as const)[i % 4];
        const status = railStatuses[i % railStatuses.length];
        return {
          id: seededId("RAIL", i + 1),
          trainId: `${rr}-Q${String(100 + i)}`,
          railroad: rr,
          status,
          origin: RAMPS[i % RAMPS.length],
          destination: RAMPS[(i + 2) % RAMPS.length],
          departureTime: new Date(Date.now() - i * 3600000 * 6).toISOString(),
          estimatedArrival: new Date(Date.now() + (5 - i % 5) * 86400000).toISOString(),
          containerCount: 120 + i * 10,
          currentLocation: { lat: 34.05 + i * 0.5, lng: -118.25 + i * 0.8 },
          milesRemaining: 200 + i * 50,
          speedMph: status === "en_route" ? 45 + i % 20 : 0,
          delayHours: status === "delayed" ? 4 + i % 8 : 0,
          delayReason: status === "delayed" ? ["Weather", "Congestion", "Mechanical", "Crew change"][i % 4] : null,
          lastUpdate: new Date(Date.now() - i * 1800000).toISOString(),
        };
      });

      let filtered = trains;
      if (input.railroad) filtered = filtered.filter(t => t.railroad === input.railroad);
      if (input.status) filtered = filtered.filter(t => t.status === input.status);
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(t =>
          t.trainId.toLowerCase().includes(q) ||
          t.origin.city.toLowerCase().includes(q) ||
          t.destination.city.toLowerCase().includes(q)
        );
      }

      const start = (input.page - 1) * input.limit;
      return {
        shipments: filtered.slice(start, start + input.limit),
        total: filtered.length,
        page: input.page,
        totalPages: Math.ceil(filtered.length / input.limit),
        stats: {
          enRoute: trains.filter(t => t.status === "en_route").length,
          atRamp: trains.filter(t => t.status === "at_ramp").length,
          delayed: trains.filter(t => t.status === "delayed").length,
          avgTransitDays: 4.8,
        },
      };
    }),

  getRailSchedules: protectedProcedure
    .input(z.object({
      railroad: railCarrierSchema.optional(),
      originRamp: z.string().optional(),
      destinationRamp: z.string().optional(),
      date: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const railroads: Array<z.infer<typeof railCarrierSchema>> = ["BNSF", "UP", "NS", "CSX"];
      const schedules = [];
      for (const rr of (input.railroad ? [input.railroad] : railroads)) {
        for (let i = 0; i < 6; i++) {
          const origin = RAMPS[i % RAMPS.length];
          const dest = RAMPS[(i + 2) % RAMPS.length];
          schedules.push({
            id: `SCH-${rr}-${i}`,
            railroad: rr,
            serviceCode: `${rr}-${String.fromCharCode(65 + i % 4)}${100 + i}`,
            origin,
            destination: dest,
            frequency: (["Daily", "Mon-Fri", "Tue/Thu/Sat", "Mon/Wed/Fri"] as const)[i % 4],
            departureTime: `${6 + (i * 3) % 18}:00`,
            transitDays: 3 + i % 4,
            cutoffHours: 12 + i % 12,
            capacity: { available: 40 + i * 5, total: 200 },
            reliabilityScore: 85 + i % 12,
          });
        }
      }

      let filtered = schedules;
      if (input.originRamp) {
        const q = input.originRamp.toLowerCase();
        filtered = filtered.filter(s => s.origin.city.toLowerCase().includes(q) || s.origin.code.toLowerCase().includes(q));
      }
      if (input.destinationRamp) {
        const q = input.destinationRamp.toLowerCase();
        filtered = filtered.filter(s => s.destination.city.toLowerCase().includes(q) || s.destination.code.toLowerCase().includes(q));
      }

      return { schedules: filtered, total: filtered.length };
    }),

  // ────────────────────────────────────────────────────────────────────
  // 4. PORT OPERATIONS
  // ────────────────────────────────────────────────────────────────────

  getPortOperations: protectedProcedure
    .input(z.object({ portCode: z.string().optional() }))
    .query(async ({ input }) => {
      const ports = (input.portCode ? PORTS.filter(p => p.code === input.portCode) : PORTS).map((p, i) => ({
        ...p,
        status: i % 6 === 0 ? "congested" as const : "operational" as const,
        vesselCount: 8 + i * 2,
        containersAvailable: 450 + i * 100,
        avgDwellHours: 36 + i * 6,
        gateStatus: i % 3 === 0 ? "restricted" as const : "open" as const,
        truckTurnTime: 55 + i * 8,
        appointments: { available: 120 + i * 20, total: 200 + i * 30 },
        terminals: [
          { name: `${p.name} Terminal ${i + 1}`, code: `${p.code}T${i + 1}`, operator: ["APM", "SSA", "TraPac", "ITS"][i % 4], status: "operational" },
          { name: `${p.name} Terminal ${i + 2}`, code: `${p.code}T${i + 2}`, operator: ["Everport", "LBCT", "PCT", "GCT"][i % 4], status: "operational" },
        ],
      }));

      return {
        ports,
        total: ports.length,
        alerts: [
          { id: "pa_1", port: "USLAX", type: "congestion", message: "Extended gate hours Fri-Sat", severity: "warning" },
          { id: "pa_2", port: "USLGB", type: "weather", message: "Fog advisory — potential delays", severity: "info" },
        ],
      };
    }),

  getVesselSchedules: protectedProcedure
    .input(z.object({
      portCode: z.string().optional(),
      shippingLine: z.string().optional(),
      dateRange: dateRangeInput.optional(),
    }))
    .query(async ({ input }) => {
      const vessels = Array.from({ length: 20 }, (_, i) => {
        const port = PORTS[i % PORTS.length];
        const line = SHIPPING_LINES[i % SHIPPING_LINES.length];
        return {
          id: seededId("VSL", i + 1),
          vesselName: `${line} ${["Horizon", "Pacific", "Atlantic", "Global", "Star"][i % 5]} ${i + 1}`,
          imo: `IMO${9000000 + i}`,
          shippingLine: line,
          port: port,
          eta: new Date(Date.now() + i * 86400000 * 2).toISOString(),
          etd: new Date(Date.now() + (i * 2 + 3) * 86400000).toISOString(),
          status: (["approaching", "at_berth", "loading", "departed"] as const)[i % 4],
          containerCapacity: 8000 + i * 500,
          containersToDischarge: 800 + i * 50,
          containersToLoad: 600 + i * 40,
          berthAssignment: `Berth ${(i % 8) + 1}`,
          service: `${["TP", "AE", "GC", "PA"][i % 4]}${i + 1}`,
          voyage: `${String.fromCharCode(65 + i % 26)}${200 + i}`,
        };
      });

      let filtered = vessels;
      if (input.portCode) filtered = filtered.filter(v => v.port.code === input.portCode);
      if (input.shippingLine) filtered = filtered.filter(v => v.shippingLine === input.shippingLine);

      return { vessels: filtered, total: filtered.length, shippingLines: SHIPPING_LINES };
    }),

  // ────────────────────────────────────────────────────────────────────
  // 5. DRAYAGE MANAGEMENT
  // ────────────────────────────────────────────────────────────────────

  getDrayageManagement: protectedProcedure
    .input(paginationInput.merge(z.object({
      type: drayageTypeSchema.optional(),
      status: z.enum(["pending", "dispatched", "in_transit", "at_port", "completed"]).optional(),
      portCode: z.string().optional(),
    })))
    .query(async ({ input }) => {
      const drayStatuses = ["pending", "dispatched", "in_transit", "at_port", "completed"] as const;
      const drayTypes: Array<z.infer<typeof drayageTypeSchema>> = ["import", "export", "pier_pass", "shuttle", "repositioning"];
      const orders = Array.from({ length: 30 }, (_, i) => {
        const port = PORTS[i % PORTS.length];
        return {
          id: seededId("DRY", i + 1),
          orderNumber: `DRY-${20260310 + i}-${String(i + 1).padStart(3, "0")}`,
          type: drayTypes[i % drayTypes.length],
          status: drayStatuses[i % drayStatuses.length],
          port,
          terminal: `${port.code}T${(i % 2) + 1}`,
          containerNumber: `${["MSCU", "CMAU", "HLXU", "OOLU"][i % 4]}${String(1000000 + i * 123)}`,
          containerSize: (i % 2 === 0 ? "40ft" : "20ft") as z.infer<typeof containerSizeSchema>,
          chassisNumber: `DCLI-${String(50000 + i)}`,
          driver: { id: `drv_${i}`, name: `Driver ${i + 1}` },
          truck: { id: `trk_${i}`, number: `TRK-${1000 + i}` },
          pickupLocation: port.name,
          deliveryLocation: `Warehouse ${String.fromCharCode(65 + i % 8)}, ${["City of Industry", "Commerce", "Vernon", "Carson"][i % 4]}, CA`,
          appointmentTime: new Date(Date.now() + i * 3600000 * 4).toISOString(),
          lastFreeDay: new Date(Date.now() + (3 - i % 5) * 86400000).toISOString(),
          perDiemDays: Math.max(0, i % 5 - 2),
          rate: 350 + i * 25,
          weight: 35000 + i * 500,
          seal: `SL${String(100000 + i)}`,
          createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        };
      });

      let filtered = orders;
      if (input.type) filtered = filtered.filter(o => o.type === input.type);
      if (input.status) filtered = filtered.filter(o => o.status === input.status);
      if (input.portCode) filtered = filtered.filter(o => o.port.code === input.portCode);
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(o =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.containerNumber.toLowerCase().includes(q) ||
          o.deliveryLocation.toLowerCase().includes(q)
        );
      }

      const start = (input.page - 1) * input.limit;
      return {
        orders: filtered.slice(start, start + input.limit),
        total: filtered.length,
        page: input.page,
        totalPages: Math.ceil(filtered.length / input.limit),
        stats: {
          pending: orders.filter(o => o.status === "pending").length,
          dispatched: orders.filter(o => o.status === "dispatched").length,
          inTransit: orders.filter(o => o.status === "in_transit").length,
          completed: orders.filter(o => o.status === "completed").length,
          avgTurnTime: 68,
        },
      };
    }),

  createDrayageOrder: protectedProcedure
    .input(z.object({
      type: drayageTypeSchema,
      portCode: z.string(),
      terminal: z.string(),
      containerNumber: z.string(),
      containerSize: containerSizeSchema,
      deliveryLocation: z.string(),
      appointmentTime: z.string(),
      weight: z.number().optional(),
      hazmat: z.boolean().default(false),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = `DRY-${Date.now()}`;
      logger.info(`[MultiModal] createDrayageOrder by user ${ctx.user?.id}: ${id}`);
      return {
        id,
        orderNumber: id,
        status: "pending" as const,
        ...input,
        rate: input.type === "import" ? 450 : input.type === "export" ? 425 : 375,
        createdAt: new Date().toISOString(),
        createdBy: ctx.user?.id,
      };
    }),

  // ────────────────────────────────────────────────────────────────────
  // 6. TRANSLOADING
  // ────────────────────────────────────────────────────────────────────

  getTransloading: protectedProcedure
    .input(paginationInput.merge(z.object({
      status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
    })))
    .query(async ({ input }) => {
      const tlStatuses = ["scheduled", "in_progress", "completed", "cancelled"] as const;
      const orders = Array.from({ length: 14 }, (_, i) => ({
        id: seededId("TL", i + 1),
        orderNumber: `TL-${20260310 + i}-${String(i + 1).padStart(3, "0")}`,
        status: tlStatuses[i % tlStatuses.length],
        inboundMode: (i % 2 === 0 ? "rail" : "ocean") as z.infer<typeof transportModeSchema>,
        outboundMode: "truck" as z.infer<typeof transportModeSchema>,
        inboundContainer: `MSCU${String(2000000 + i * 111)}`,
        outboundTrailers: Array.from({ length: 1 + i % 3 }, (_, j) => `TRL-${2000 + i * 10 + j}`),
        facility: { name: `Transload Facility ${String.fromCharCode(65 + i % 5)}`, city: ["Chicago", "Memphis", "Dallas", "Atlanta", "Kansas City"][i % 5], state: ["IL", "TN", "TX", "GA", "MO"][i % 5] },
        commodity: ["Paper Products", "Beverages", "Electronics", "Building Materials", "Agricultural"][i % 5],
        weight: 40000 + i * 1000,
        palletCount: 20 + i * 2,
        scheduledDate: new Date(Date.now() + i * 86400000).toISOString().split("T")[0],
        completedDate: tlStatuses[i % tlStatuses.length] === "completed" ? new Date(Date.now() - 86400000).toISOString().split("T")[0] : null,
        laborHours: 4 + i % 6,
        cost: 1200 + i * 100,
        notes: i % 3 === 0 ? "Floor-loaded — requires manual unload" : null,
        createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
      }));

      let filtered = orders;
      if (input.status) filtered = filtered.filter(o => o.status === input.status);
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(o =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.inboundContainer.toLowerCase().includes(q) ||
          o.commodity.toLowerCase().includes(q)
        );
      }

      const start = (input.page - 1) * input.limit;
      return {
        orders: filtered.slice(start, start + input.limit),
        total: filtered.length,
        page: input.page,
        totalPages: Math.ceil(filtered.length / input.limit),
      };
    }),

  createTransloadOrder: protectedProcedure
    .input(z.object({
      inboundMode: transportModeSchema,
      outboundMode: transportModeSchema.default("truck"),
      inboundContainer: z.string(),
      facility: z.string(),
      commodity: z.string(),
      weight: z.number(),
      palletCount: z.number().optional(),
      scheduledDate: z.string(),
      specialInstructions: z.string().optional(),
      floorLoaded: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = `TL-${Date.now()}`;
      logger.info(`[MultiModal] createTransloadOrder by user ${ctx.user?.id}: ${id}`);
      return {
        id,
        orderNumber: id,
        status: "scheduled" as const,
        ...input,
        estimatedLaborHours: input.floorLoaded ? 8 : 4,
        estimatedCost: input.floorLoaded ? 2400 : 1400,
        createdAt: new Date().toISOString(),
        createdBy: ctx.user?.id,
      };
    }),

  // ────────────────────────────────────────────────────────────────────
  // 7. CONTAINER MANAGEMENT
  // ────────────────────────────────────────────────────────────────────

  getContainerManagement: protectedProcedure
    .input(paginationInput.merge(z.object({
      status: z.enum(["in_transit", "at_port", "at_ramp", "at_customer", "empty", "returned"]).optional(),
      size: containerSizeSchema.optional(),
      shippingLine: z.string().optional(),
    })))
    .query(async ({ input }) => {
      // Try to pull real container chassis vehicles from DB
      let dbContainers: Array<{
        id: string;
        containerNumber: string;
        size: string;
        type: string;
        shippingLine: string;
        status: string;
        currentLocation: string;
        lastFreeDay: string | null;
        perDiemAccrued: number;
        bookingRef: string | null;
        seal: string;
        weight: number;
        lastEvent: { type: string; timestamp: string };
      }> | null = null;

      try {
        const db = await getDb();
        if (db) {
          const chassisVehicles = await db
            .select({
              id: vehicles.id,
              vin: vehicles.vin,
              licensePlate: vehicles.licensePlate,
              make: vehicles.make,
              model: vehicles.model,
              vehicleType: vehicles.vehicleType,
              capacity: vehicles.capacity,
              mileage: vehicles.mileage,
            })
            .from(vehicles)
            .where(
              eq(vehicles.vehicleType, "container_chassis")
            )
            .limit(100);

          if (chassisVehicles.length > 0) {
            dbContainers = chassisVehicles.map((v, i) => {
              const cStatuses = ["in_transit", "at_port", "at_ramp", "at_customer", "empty", "returned"] as const;
              const statusIdx = i % cStatuses.length;
              const st = cStatuses[statusIdx];
              return {
                id: `CNT-DB-${v.id}`,
                containerNumber: v.licensePlate || v.vin || `CNT-${v.id}`,
                size: (["20ft", "40ft", "40ft_hc", "45ft"] as const)[i % 4],
                type: "dry",
                shippingLine: SHIPPING_LINES[i % SHIPPING_LINES.length],
                status: st,
                currentLocation: st === "at_port" ? PORTS[i % PORTS.length].name : st === "at_ramp" ? RAMPS[i % RAMPS.length].name : `Yard, ${["Chicago", "LA", "Atlanta"][i % 3]}`,
                lastFreeDay: (st === "at_port" || st === "at_customer") ? new Date(Date.now() + (2 - i % 5) * 86400000).toISOString().split("T")[0] : null,
                perDiemAccrued: Math.max(0, (i % 5) - 2) * 150,
                bookingRef: null,
                seal: `SL${String(200000 + v.id)}`,
                weight: Number(v.capacity) || (st === "empty" ? 4500 : 38000),
                lastEvent: { type: ["gate_in", "gate_out", "loaded", "discharged", "returned"][i % 5], timestamp: new Date(Date.now() - i * 3600000 * 3).toISOString() },
              };
            });
          }
        }
      } catch (e) {
        logger.warn("[MultiModal] Container DB query failed, using fallback:", e);
      }

      // Fallback: seeded data
      const cStatuses = ["in_transit", "at_port", "at_ramp", "at_customer", "empty", "returned"] as const;
      const containers = dbContainers ?? Array.from({ length: 40 }, (_, i) => {
        const prefix = ["MSCU", "CMAU", "HLXU", "OOLU", "TEMU", "EGLV"][i % 6];
        const line = SHIPPING_LINES[i % SHIPPING_LINES.length];
        const status = cStatuses[i % cStatuses.length];
        return {
          id: seededId("CNT", i + 1),
          containerNumber: `${prefix}${String(1000000 + i * 77)}`,
          size: (["20ft", "40ft", "40ft_hc", "45ft"] as const)[i % 4],
          type: (["dry", "reefer", "flat_rack"] as const)[i % 3],
          shippingLine: line,
          status,
          currentLocation: status === "at_port" ? PORTS[i % PORTS.length].name : status === "at_ramp" ? RAMPS[i % RAMPS.length].name : `${["Warehouse A", "Customer DC", "Yard 7"][i % 3]}, ${["Chicago", "LA", "Atlanta"][i % 3]}`,
          lastFreeDay: status === "at_port" || status === "at_customer" ? new Date(Date.now() + (2 - i % 5) * 86400000).toISOString().split("T")[0] : null,
          perDiemAccrued: Math.max(0, (i % 5) - 2) * 150,
          bookingRef: i % 3 === 0 ? `IMB-${20260301 + i}` : null,
          seal: `SL${String(200000 + i)}`,
          weight: status === "empty" ? 4500 : 35000 + i * 300,
          lastEvent: { type: ["gate_in", "gate_out", "loaded", "discharged", "returned"][i % 5], timestamp: new Date(Date.now() - i * 3600000 * 3).toISOString() },
        };
      });

      let filtered = containers;
      if (input.status) filtered = filtered.filter(c => c.status === input.status);
      if (input.size) filtered = filtered.filter(c => c.size === input.size);
      if (input.shippingLine) filtered = filtered.filter(c => c.shippingLine === input.shippingLine);
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(c =>
          c.containerNumber.toLowerCase().includes(q) ||
          c.currentLocation.toLowerCase().includes(q)
        );
      }

      const start = (input.page - 1) * input.limit;
      return {
        containers: filtered.slice(start, start + input.limit),
        total: filtered.length,
        page: input.page,
        totalPages: Math.ceil(filtered.length / input.limit),
        stats: {
          inTransit: containers.filter(c => c.status === "in_transit").length,
          atPort: containers.filter(c => c.status === "at_port").length,
          atCustomer: containers.filter(c => c.status === "at_customer").length,
          empty: containers.filter(c => c.status === "empty").length,
          totalPerDiem: containers.reduce((sum, c) => sum + c.perDiemAccrued, 0),
        },
      };
    }),

  getContainerBooking: protectedProcedure
    .input(z.object({
      shippingLine: z.string().optional(),
      size: containerSizeSchema.optional(),
      type: containerTypeSchema.optional(),
      portCode: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const availability = SHIPPING_LINES.map((line, i) => ({
        shippingLine: line,
        allocations: [
          { size: "20ft" as const, available: 30 + i * 5, total: 100, rate: 1800 + i * 100 },
          { size: "40ft" as const, available: 50 + i * 8, total: 200, rate: 2200 + i * 120 },
          { size: "40ft_hc" as const, available: 20 + i * 3, total: 80, rate: 2400 + i * 130 },
        ],
        depots: PORTS.slice(0, 4).map(p => ({ port: p, containersAvailable: 15 + i * 3 })),
      }));

      let filtered = availability;
      if (input.shippingLine) filtered = filtered.filter(a => a.shippingLine === input.shippingLine);

      return { availability: filtered, shippingLines: SHIPPING_LINES, ports: PORTS };
    }),

  // ────────────────────────────────────────────────────────────────────
  // 8. CHASSIS MANAGEMENT
  // ────────────────────────────────────────────────────────────────────

  getChassisManagement: protectedProcedure
    .input(paginationInput.merge(z.object({
      pool: z.string().optional(),
      status: z.enum(["available", "in_use", "maintenance", "out_of_service"]).optional(),
      type: chassisTypeSchema.optional(),
    })))
    .query(async ({ input }) => {
      const pools = ["DCLI", "TRAC", "Flexi-Van", "Direct ChassisLink"];
      const chStatuses = ["available", "in_use", "maintenance", "out_of_service"] as const;
      const chassis = Array.from({ length: 50 }, (_, i) => {
        const pool = pools[i % pools.length];
        const status = chStatuses[i % chStatuses.length];
        return {
          id: seededId("CHS", i + 1),
          chassisNumber: `${pool.substring(0, 4).toUpperCase()}-${String(50000 + i)}`,
          pool,
          type: (["standard", "tri_axle", "gooseneck", "extendable"] as const)[i % 4],
          size: (["20ft", "40ft", "45ft", "53ft"] as const)[i % 4],
          status,
          location: status === "in_use" ? `In transit - ${RAMPS[i % RAMPS.length].city}` : PORTS[i % PORTS.length].name,
          lastInspection: new Date(Date.now() - i * 86400000 * 15).toISOString().split("T")[0],
          nextInspection: new Date(Date.now() + (90 - i * 3) * 86400000).toISOString().split("T")[0],
          iepCompliant: i % 5 !== 4,
          uiiaCompliant: i % 7 !== 6,
          licensePlate: `CH-${String(10000 + i)}`,
          tireCondition: (["good", "fair", "needs_replacement"] as const)[i % 3],
          daysOut: status === "in_use" ? 1 + i % 10 : 0,
          perDiemRate: 25,
        };
      });

      let filtered = chassis;
      if (input.pool) filtered = filtered.filter(c => c.pool === input.pool);
      if (input.status) filtered = filtered.filter(c => c.status === input.status);
      if (input.type) filtered = filtered.filter(c => c.type === input.type);
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(c =>
          c.chassisNumber.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q)
        );
      }

      const start = (input.page - 1) * input.limit;
      return {
        chassis: filtered.slice(start, start + input.limit),
        total: filtered.length,
        page: input.page,
        totalPages: Math.ceil(filtered.length / input.limit),
        pools,
        stats: {
          available: chassis.filter(c => c.status === "available").length,
          inUse: chassis.filter(c => c.status === "in_use").length,
          maintenance: chassis.filter(c => c.status === "maintenance").length,
          iepNonCompliant: chassis.filter(c => !c.iepCompliant).length,
          uiiaNonCompliant: chassis.filter(c => !c.uiiaCompliant).length,
        },
      };
    }),

  getChassisAvailability: protectedProcedure
    .input(z.object({
      location: z.string().optional(),
      type: chassisTypeSchema.optional(),
      size: containerSizeSchema.optional(),
    }))
    .query(async () => {
      const locations = [...PORTS.slice(0, 5), ...RAMPS.slice(0, 4)];
      return {
        locations: locations.map((loc, i) => ({
          location: loc,
          pools: [
            { name: "DCLI", available: 20 + i * 3, total: 80, standard: 15 + i * 2, triAxle: 5 + i },
            { name: "TRAC", available: 15 + i * 2, total: 60, standard: 10 + i, triAxle: 5 + i },
            { name: "Flexi-Van", available: 10 + i, total: 40, standard: 8 + i, triAxle: 2 },
          ],
          totalAvailable: 45 + i * 6,
          totalCapacity: 180,
          utilizationPct: Math.round(((180 - 45 - i * 6) / 180) * 100),
        })),
      };
    }),

  // ────────────────────────────────────────────────────────────────────
  // 9. PER DIEM, DEMURRAGE & FREE TIME
  // ────────────────────────────────────────────────────────────────────

  getPerDiemTracking: protectedProcedure
    .input(paginationInput.merge(z.object({
      status: z.enum(["accruing", "paid", "disputed", "waived"]).optional(),
    })))
    .query(async ({ input }) => {
      const pdStatuses = ["accruing", "paid", "disputed", "waived"] as const;
      const records = Array.from({ length: 22 }, (_, i) => ({
        id: seededId("PD", i + 1),
        containerNumber: `${["MSCU", "CMAU", "HLXU"][i % 3]}${String(3000000 + i * 99)}`,
        shippingLine: SHIPPING_LINES[i % SHIPPING_LINES.length],
        status: pdStatuses[i % pdStatuses.length],
        lastFreeDay: new Date(Date.now() - (i % 8) * 86400000).toISOString().split("T")[0],
        daysAccrued: Math.max(0, (i % 8) - 2),
        dailyRate: 150 + (i % 3) * 50,
        totalCharges: Math.max(0, ((i % 8) - 2)) * (150 + (i % 3) * 50),
        location: PORTS[i % PORTS.length].name,
        bookingRef: `IMB-${20260301 + i}`,
        returnLocation: `${["Pier A", "Pier E", "Terminal 3", "ITS"][i % 4]}`,
      }));

      let filtered = records;
      if (input.status) filtered = filtered.filter(r => r.status === input.status);
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(r => r.containerNumber.toLowerCase().includes(q));
      }

      const start = (input.page - 1) * input.limit;
      return {
        records: filtered.slice(start, start + input.limit),
        total: filtered.length,
        page: input.page,
        totalPages: Math.ceil(filtered.length / input.limit),
        summary: {
          totalAccruing: records.filter(r => r.status === "accruing").length,
          totalCharges: records.reduce((s, r) => s + r.totalCharges, 0),
          avgDaysOver: 2.4,
        },
      };
    }),

  getDemurrageDetention: protectedProcedure
    .input(paginationInput.merge(z.object({
      type: z.enum(["demurrage", "detention"]).optional(),
      portCode: z.string().optional(),
    })))
    .query(async ({ input }) => {
      // Try real detention records from DB first
      let dbRecords: Array<{
        id: string;
        type: "demurrage" | "detention";
        containerNumber: string;
        shippingLine: string;
        port: typeof PORTS[number];
        terminal: string;
        freeTimeDays: number;
        daysUsed: number;
        daysOver: number;
        dailyRate: number;
        totalCharges: number;
        status: string;
        dischargeDate: string;
        lastFreeDay: string;
        returnDate: string | null;
      }> | null = null;

      try {
        const db = await getDb();
        if (db) {
          const dbRows = await db
            .select({
              id: detentionRecords.id,
              loadId: detentionRecords.loadId,
              locationType: detentionRecords.locationType,
              freeTimeMinutes: detentionRecords.freeTimeMinutes,
              totalDwellMinutes: detentionRecords.totalDwellMinutes,
              detentionMinutes: detentionRecords.detentionMinutes,
              detentionRatePerHour: detentionRecords.detentionRatePerHour,
              detentionCharge: detentionRecords.detentionCharge,
              isBillable: detentionRecords.isBillable,
              isPaid: detentionRecords.isPaid,
              geofenceEnterAt: detentionRecords.geofenceEnterAt,
              geofenceExitAt: detentionRecords.geofenceExitAt,
              createdAt: detentionRecords.createdAt,
            })
            .from(detentionRecords)
            .orderBy(desc(detentionRecords.createdAt))
            .limit(100);

          if (dbRows.length > 0) {
            dbRecords = dbRows.map((r, i) => {
              const freeTimeDays = Math.round((r.freeTimeMinutes ?? 120) / 60 / 24) || 4;
              const dwellDays = Math.round((r.totalDwellMinutes ?? 0) / 60 / 24);
              const overDays = Math.max(0, dwellDays - freeTimeDays);
              const rate = Number(r.detentionRatePerHour ?? 0) * 24 || 175;
              const charge = Number(r.detentionCharge ?? 0) || overDays * rate;
              const recType = r.locationType === "pickup" ? "demurrage" as const : "detention" as const;
              const port = PORTS[i % PORTS.length];
              return {
                id: `DD-DB-${r.id}`,
                type: recType,
                containerNumber: `LD-${r.loadId}`,
                shippingLine: SHIPPING_LINES[i % SHIPPING_LINES.length],
                port,
                terminal: `${port.code}T${(i % 2) + 1}`,
                freeTimeDays,
                daysUsed: dwellDays,
                daysOver: overDays,
                dailyRate: rate,
                totalCharges: charge,
                status: r.isPaid ? "paid" : r.isBillable ? "invoiced" : "accruing",
                dischargeDate: r.geofenceEnterAt ? r.geofenceEnterAt.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                lastFreeDay: r.geofenceEnterAt
                  ? new Date(r.geofenceEnterAt.getTime() + freeTimeDays * 86400000).toISOString().split("T")[0]
                  : new Date().toISOString().split("T")[0],
                returnDate: r.geofenceExitAt ? r.geofenceExitAt.toISOString().split("T")[0] : null,
              };
            });
          }
        }
      } catch (e) {
        logger.warn("[MultiModal] Detention DB query failed, using fallback:", e);
      }

      // Fallback seeded data
      const types = ["demurrage", "detention"] as const;
      const records = dbRecords ?? Array.from({ length: 18 }, (_, i) => {
        const port = PORTS[i % PORTS.length];
        const type = types[i % 2];
        const freeTimeDays = type === "demurrage" ? 4 : 5;
        const daysUsed = 4 + i % 6;
        const daysOver = Math.max(0, daysUsed - freeTimeDays);
        const dailyRate = type === "demurrage" ? 200 + i * 25 : 150 + i * 20;
        return {
          id: seededId("DD", i + 1),
          type,
          containerNumber: `${["MSCU", "CMAU", "HLXU"][i % 3]}${String(4000000 + i * 88)}`,
          shippingLine: SHIPPING_LINES[i % SHIPPING_LINES.length],
          port,
          terminal: `${port.code}T${(i % 2) + 1}`,
          freeTimeDays,
          daysUsed,
          daysOver,
          dailyRate,
          totalCharges: daysOver * dailyRate,
          status: (["accruing", "invoiced", "paid", "disputed"] as const)[i % 4],
          dischargeDate: new Date(Date.now() - (10 + i) * 86400000).toISOString().split("T")[0],
          lastFreeDay: new Date(Date.now() - (6 + i) * 86400000).toISOString().split("T")[0],
          returnDate: i % 3 === 0 ? new Date(Date.now() - i * 86400000).toISOString().split("T")[0] : null,
        };
      });

      let filtered = records;
      if (input.type) filtered = filtered.filter(r => r.type === input.type);
      if (input.portCode) filtered = filtered.filter(r => r.port.code === input.portCode);
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(r => r.containerNumber.toLowerCase().includes(q));
      }

      const start = (input.page - 1) * input.limit;
      return {
        records: filtered.slice(start, start + input.limit),
        total: filtered.length,
        page: input.page,
        totalPages: Math.ceil(filtered.length / input.limit),
        summary: {
          totalDemurrage: records.filter(r => r.type === "demurrage").reduce((s, r) => s + r.totalCharges, 0),
          totalDetention: records.filter(r => r.type === "detention").reduce((s, r) => s + r.totalCharges, 0),
          containersAtRisk: records.filter(r => r.daysOver > 0).length,
        },
      };
    }),

  getFreeTimeManagement: protectedProcedure
    .input(z.object({ portCode: z.string().optional(), shippingLine: z.string().optional() }))
    .query(async () => {
      return {
        freeTimeSchedules: SHIPPING_LINES.slice(0, 6).map((line, i) => ({
          shippingLine: line,
          import: {
            demurrageFreeTime: 4 + i % 3,
            detentionFreeTime: 4 + i % 2,
            combinedFreeTime: null as number | null,
            demurrageRate: [150, 200, 275, 350],
            detentionRate: [100, 150, 225, 300],
          },
          export: {
            demurrageFreeTime: 5 + i % 2,
            detentionFreeTime: 5,
            combinedFreeTime: null as number | null,
            demurrageRate: [125, 175, 250],
            detentionRate: [100, 150, 200],
          },
          notes: i % 2 === 0 ? "Weekends/holidays excluded from free time" : null,
        })),
        portSpecific: PORTS.slice(0, 4).map((port, i) => ({
          port,
          terminalFreeTime: 3 + i,
          pierPassHours: "18:00-08:00 Mon-Thu",
          cleanTruckFee: 10 + i * 5,
        })),
      };
    }),

  getLastFreeDayAlerts: protectedProcedure
    .input(z.object({ daysAhead: z.number().default(3) }))
    .query(async ({ input }) => {
      const alerts = Array.from({ length: 12 }, (_, i) => {
        const daysUntilLFD = -1 + i % (input.daysAhead + 2);
        return {
          id: seededId("LFD", i + 1),
          containerNumber: `${["MSCU", "CMAU", "HLXU", "OOLU"][i % 4]}${String(5000000 + i * 66)}`,
          shippingLine: SHIPPING_LINES[i % SHIPPING_LINES.length],
          port: PORTS[i % PORTS.length],
          terminal: `${PORTS[i % PORTS.length].code}T${(i % 2) + 1}`,
          lastFreeDay: new Date(Date.now() + daysUntilLFD * 86400000).toISOString().split("T")[0],
          daysUntilLFD,
          severity: daysUntilLFD < 0 ? "critical" as const : daysUntilLFD === 0 ? "urgent" as const : "warning" as const,
          estimatedPerDiem: daysUntilLFD < 0 ? Math.abs(daysUntilLFD) * 175 : 0,
          bookingRef: `IMB-${20260301 + i}`,
          actionRequired: daysUntilLFD <= 0 ? "Immediate pickup required" : `Schedule pickup within ${daysUntilLFD} day(s)`,
        };
      }).sort((a, b) => a.daysUntilLFD - b.daysUntilLFD);

      return {
        alerts,
        total: alerts.length,
        critical: alerts.filter(a => a.severity === "critical").length,
        urgent: alerts.filter(a => a.severity === "urgent").length,
        warning: alerts.filter(a => a.severity === "warning").length,
      };
    }),

  // ────────────────────────────────────────────────────────────────────
  // 10. CUSTOMS CLEARANCE
  // ────────────────────────────────────────────────────────────────────

  getCustomsClearance: protectedProcedure
    .input(paginationInput.merge(z.object({
      status: customsStatusSchema.optional(),
    })))
    .query(async ({ input }) => {
      const cStatuses: Array<z.infer<typeof customsStatusSchema>> = ["not_filed", "filed", "under_review", "cleared", "hold", "rejected"];
      const entries = Array.from({ length: 20 }, (_, i) => ({
        id: seededId("CUST", i + 1),
        entryNumber: `ENT-${20260310 + i}-${String(i + 1).padStart(4, "0")}`,
        containerNumber: `${["MSCU", "CMAU", "HLXU"][i % 3]}${String(6000000 + i * 55)}`,
        status: cStatuses[i % cStatuses.length],
        importerOfRecord: `Importer ${String.fromCharCode(65 + i % 10)} Corp`,
        customsBroker: `Broker ${["Alpha", "Beta", "Gamma", "Delta"][i % 4]} Inc`,
        hsCode: `${8400 + i * 11}.${10 + i}.${i * 5}`,
        declaredValue: 25000 + i * 5000,
        dutyAmount: (25000 + i * 5000) * (0.04 + (i % 5) * 0.01),
        port: PORTS[i % PORTS.length],
        filedDate: cStatuses[i % cStatuses.length] !== "not_filed" ? new Date(Date.now() - i * 86400000).toISOString().split("T")[0] : null,
        clearedDate: cStatuses[i % cStatuses.length] === "cleared" ? new Date(Date.now() - (i - 2) * 86400000).toISOString().split("T")[0] : null,
        holdReason: cStatuses[i % cStatuses.length] === "hold" ? ["Exam Required", "FDA Hold", "USDA Hold", "Valuation Review"][i % 4] : null,
        examType: cStatuses[i % cStatuses.length] === "hold" ? (["VACIS", "Intensive", "Tailgate", "CET"][i % 4]) : null,
      }));

      let filtered = entries;
      if (input.status) filtered = filtered.filter(e => e.status === input.status);
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(e =>
          e.entryNumber.toLowerCase().includes(q) ||
          e.containerNumber.toLowerCase().includes(q) ||
          e.importerOfRecord.toLowerCase().includes(q)
        );
      }

      const start = (input.page - 1) * input.limit;
      return {
        entries: filtered.slice(start, start + input.limit),
        total: filtered.length,
        page: input.page,
        totalPages: Math.ceil(filtered.length / input.limit),
        stats: {
          cleared: entries.filter(e => e.status === "cleared").length,
          pending: entries.filter(e => e.status === "filed" || e.status === "under_review").length,
          onHold: entries.filter(e => e.status === "hold").length,
          avgClearanceHours: 36,
        },
      };
    }),

  // ────────────────────────────────────────────────────────────────────
  // 11. MODE OPTIMIZATION & ANALYTICS
  // ────────────────────────────────────────────────────────────────────

  getModeOptimization: protectedProcedure
    .input(z.object({
      origin: z.object({ city: z.string(), state: z.string() }),
      destination: z.object({ city: z.string(), state: z.string() }),
      weight: z.number(),
      commodity: z.string().optional(),
      urgency: z.enum(["standard", "expedited", "critical"]).default("standard"),
    }))
    .query(async ({ input }) => {
      const distance = 800 + Math.abs(input.weight % 2000);
      return {
        recommendations: [
          {
            rank: 1,
            mode: "intermodal" as const,
            score: 92,
            reason: "Best cost-to-transit balance for this lane",
            cost: Math.round(distance * 1.45),
            transitDays: Math.round(distance / 500) + 2,
            co2Reduction: "62% vs truck-only",
            reliability: 89,
            details: { railroad: "BNSF", originRamp: RAMPS[0].name, destRamp: RAMPS[2].name, drayageMiles: { origin: 35, destination: 42 } },
          },
          {
            rank: 2,
            mode: "truck" as const,
            score: input.urgency === "critical" ? 95 : 78,
            reason: input.urgency === "critical" ? "Fastest transit for critical shipment" : "Direct but higher cost",
            cost: Math.round(distance * 2.85),
            transitDays: Math.round(distance / 500) + 1,
            co2Reduction: "baseline",
            reliability: 94,
            details: null,
          },
          {
            rank: 3,
            mode: "rail" as const,
            score: 85,
            reason: "Lowest cost option, longer transit",
            cost: Math.round(distance * 0.95),
            transitDays: Math.round(distance / 350) + 2,
            co2Reduction: "75% vs truck-only",
            reliability: 87,
            details: { railroad: "UP", originRamp: RAMPS[1].name, destRamp: RAMPS[3].name, drayageMiles: null },
          },
        ],
        laneData: {
          distance,
          historicalVolume: 340,
          seasonalFactor: 1.05,
        },
      };
    }),

  getCostByMode: protectedProcedure
    .input(z.object({
      origin: z.string().optional(),
      destination: z.string().optional(),
      weight: z.number().optional(),
      dateRange: dateRangeInput.optional(),
    }))
    .query(async () => {
      return {
        costComparison: [
          { mode: "truck", avgCostPerMile: 2.85, avgTotalCost: 4275, volume: 142, trend: +2.1 },
          { mode: "rail", avgCostPerMile: 0.95, avgTotalCost: 2400, volume: 58, trend: -0.8 },
          { mode: "intermodal", avgCostPerMile: 1.45, avgTotalCost: 3200, volume: 15, trend: +0.5 },
          { mode: "ocean", avgCostPerMile: 0.12, avgTotalCost: 3800, volume: 32, trend: -1.2 },
        ],
        monthlyCosts: Array.from({ length: 6 }, (_, i) => ({
          month: new Date(2026, 9 - i, 1).toISOString().split("T")[0],
          truck: 285000 + i * 12000,
          rail: 95000 + i * 5000,
          intermodal: 48000 + i * 3000,
          ocean: 120000 + i * 8000,
        })).reverse(),
      };
    }),

  getTransitTimeComparison: protectedProcedure
    .input(z.object({
      origin: z.string().optional(),
      destination: z.string().optional(),
    }))
    .query(async () => {
      return {
        comparison: [
          { mode: "truck", avgDays: 2.3, minDays: 1, maxDays: 4, reliability: 94.2, samples: 142 },
          { mode: "rail", avgDays: 4.8, minDays: 3, maxDays: 8, reliability: 87.5, samples: 58 },
          { mode: "intermodal", avgDays: 5.1, minDays: 4, maxDays: 8, reliability: 89.3, samples: 15 },
          { mode: "ocean", avgDays: 18.5, minDays: 14, maxDays: 28, reliability: 82.1, samples: 32 },
        ],
        topLanes: [
          { origin: "Los Angeles, CA", destination: "Chicago, IL", truck: 2.5, rail: 4.2, intermodal: 4.8 },
          { origin: "Savannah, GA", destination: "Atlanta, GA", truck: 0.5, rail: 1.5, intermodal: 1.8 },
          { origin: "Newark, NJ", destination: "Chicago, IL", truck: 1.8, rail: 3.5, intermodal: 4.0 },
          { origin: "Houston, TX", destination: "Dallas, TX", truck: 0.5, rail: 2.0, intermodal: 2.2 },
          { origin: "Seattle, WA", destination: "Chicago, IL", truck: 3.0, rail: 5.5, intermodal: 5.8 },
        ],
      };
    }),

  getMultiModalAnalytics: protectedProcedure
    .input(dateRangeInput.optional())
    .query(async () => {
      // Default analytics
      let kpis = {
        totalShipments: 247,
        totalRevenue: 1_845_000,
        avgCostPerShipment: 3_250,
        onTimeDelivery: 91.2,
        avgDwellTime: 28.4,
        emptyMilesRatio: 12.8,
        intermodalConversionRate: 18.5,
        co2Saved: 142_000,
      };
      let modeBreakdown = [
        { mode: "truck", shipments: 142, revenue: 985000, avgCost: 4275, onTime: 94.2, co2PerShipment: 2450 },
        { mode: "rail", shipments: 58, revenue: 412000, avgCost: 2400, onTime: 87.5, co2PerShipment: 620 },
        { mode: "ocean", shipments: 32, revenue: 298000, avgCost: 3800, onTime: 82.1, co2PerShipment: 180 },
        { mode: "intermodal", shipments: 15, revenue: 150000, avgCost: 3200, onTime: 89.3, co2PerShipment: 940 },
      ];

      try {
        const db = await getDb();
        if (db) {
          // Total shipments and revenue from loads
          const [totals] = await db.execute(
            sql`SELECT COUNT(*) as cnt, COALESCE(SUM(rate), 0) as revenue FROM loads WHERE deletedAt IS NULL`
          );
          const row = unsafeCast(totals)[0];
          const totalCount = Number(row?.cnt ?? 0);
          const totalRev = Number(row?.revenue ?? 0);

          if (totalCount > 0) {
            kpis.totalShipments = totalCount;
            kpis.totalRevenue = totalRev;
            kpis.avgCostPerShipment = totalCount > 0 ? Math.round(totalRev / totalCount) : 0;
          }

          // Intermodal vs total for conversion rate
          const [interRows] = await db.execute(
            sql`SELECT COUNT(*) as cnt, COALESCE(SUM(rate), 0) as revenue FROM loads WHERE cargoType = 'intermodal' AND deletedAt IS NULL`
          );
          const interRow = unsafeCast(interRows)[0];
          const intermodalCount = Number(interRow?.cnt ?? 0);
          const intermodalRev = Number(interRow?.revenue ?? 0);

          if (totalCount > 0) {
            kpis.intermodalConversionRate = Math.round((intermodalCount / totalCount) * 1000) / 10;
            // Update mode breakdown with real intermodal data
            const truckCount = totalCount - intermodalCount;
            modeBreakdown = [
              { mode: "truck", shipments: truckCount, revenue: totalRev - intermodalRev, avgCost: truckCount > 0 ? Math.round((totalRev - intermodalRev) / truckCount) : 0, onTime: 94.2, co2PerShipment: 2450 },
              { mode: "rail", shipments: 0, revenue: 0, avgCost: 0, onTime: 87.5, co2PerShipment: 620 },
              { mode: "ocean", shipments: 0, revenue: 0, avgCost: 0, onTime: 82.1, co2PerShipment: 180 },
              { mode: "intermodal", shipments: intermodalCount, revenue: intermodalRev, avgCost: intermodalCount > 0 ? Math.round(intermodalRev / intermodalCount) : 0, onTime: 89.3, co2PerShipment: 940 },
            ];
          }
        }
      } catch (e) {
        logger.warn("[MultiModal] Analytics DB query failed, using fallback:", e);
      }

      return {
        kpis,
        modeBreakdown,
        monthlyTrend: Array.from({ length: 6 }, (_, i) => ({
          month: new Date(2026, 9 - i, 1).toISOString().split("T")[0],
          truck: 120 + i * 4,
          rail: 48 + i * 2,
          ocean: 26 + i * 1,
          intermodal: 10 + i * 1,
          totalCost: 420000 + i * 25000,
          onTimeRate: 89 + i * 0.5,
        })).reverse(),
        portPerformance: PORTS.slice(0, 5).map((p, i) => ({
          port: p,
          throughput: 800 + i * 150,
          avgDwell: 36 + i * 4,
          turnTime: 55 + i * 8,
          onTime: 85 + i * 2,
        })),
      };
    }),
});
