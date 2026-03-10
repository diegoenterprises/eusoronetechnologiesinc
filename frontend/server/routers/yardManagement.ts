/**
 * YARD MANAGEMENT ROUTER
 * Comprehensive yard operations: dock scheduling, trailer pool, cross-dock,
 * warehouse ops, container/chassis tracking, gate log, detention, analytics.
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const trailerStatusSchema = z.enum([
  "available", "loaded", "empty", "in_repair", "reserved", "in_transit", "detained",
]);

const dockStatusSchema = z.enum([
  "available", "occupied", "reserved", "out_of_service", "cleaning",
]);

const yardMoveStatusSchema = z.enum([
  "pending", "assigned", "in_progress", "completed", "cancelled",
]);

const containerStatusSchema = z.enum([
  "on_chassis", "grounded", "loaded", "empty", "in_transit", "at_port",
]);

const chassisStatusSchema = z.enum([
  "available", "in_use", "maintenance", "out_of_service",
]);

// ─── Helper: generate mock IDs ─────────────────────────────────────────────

let _seqId = 1000;
function nextId(): string {
  return `YM-${++_seqId}`;
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600_000).toISOString();
}

function hoursFromNow(h: number): string {
  return new Date(Date.now() + h * 3600_000).toISOString();
}

// ─── Router ─────────────────────────────────────────────────────────────────

export const yardManagementRouter = router({

  // ────────────────────────────────────────────────────────────────────────
  // DASHBOARD
  // ────────────────────────────────────────────────────────────────────────

  getYardDashboard: protectedProcedure
    .input(z.object({ locationId: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const locationId = input?.locationId || "default";
      return {
        locationId,
        capacity: { total: 120, occupied: 87, available: 33, utilizationPct: 72.5 },
        trailerSummary: { total: 87, loaded: 42, empty: 25, inRepair: 8, reserved: 12 },
        dockSummary: { total: 24, occupied: 14, available: 8, outOfService: 2 },
        activeMoves: 6,
        pendingCheckIns: 4,
        pendingCheckOuts: 3,
        avgDwellTimeHours: 8.3,
        avgTurnTimeMinutes: 42,
        todayGateEntries: 34,
        todayGateExits: 29,
        detentionAlerts: 2,
        crossDockActive: 3,
        lastUpdated: new Date().toISOString(),
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // YARD LOCATIONS
  // ────────────────────────────────────────────────────────────────────────

  getYardLocations: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(["active", "inactive", "all"]).default("active"),
    }).optional())
    .query(async () => {
      return {
        locations: [
          { id: "LOC-1", name: "Main Terminal Yard", address: "1200 Industrial Blvd, Houston, TX 77001", type: "terminal", capacity: 120, occupied: 87, dockDoors: 24, status: "active", lat: 29.7604, lng: -95.3698 },
          { id: "LOC-2", name: "North Drop Yard", address: "4500 N Freeway, Dallas, TX 75247", type: "drop_yard", capacity: 60, occupied: 38, dockDoors: 0, status: "active", lat: 32.7767, lng: -96.797 },
          { id: "LOC-3", name: "Cross-Dock Facility A", address: "800 Logistics Pkwy, Memphis, TN 38118", type: "cross_dock", capacity: 80, occupied: 52, dockDoors: 32, status: "active", lat: 35.1495, lng: -90.049 },
          { id: "LOC-4", name: "Warehouse East", address: "3200 Commerce Dr, Atlanta, GA 30336", type: "warehouse", capacity: 40, occupied: 28, dockDoors: 16, status: "active", lat: 33.749, lng: -84.388 },
        ],
        total: 4,
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // YARD MAP
  // ────────────────────────────────────────────────────────────────────────

  getYardMap: protectedProcedure
    .input(z.object({ locationId: z.string() }))
    .query(async ({ input }) => {
      const rows = 10;
      const cols = 12;
      const spots: Array<{
        id: string; row: number; col: number; label: string;
        status: "empty" | "occupied" | "reserved" | "maintenance";
        trailerId: string | null; trailerNumber: string | null;
        type: "parking" | "dock" | "staging" | "repair";
      }> = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const isDock = r === 0 && c < 8;
          const isRepair = r === 9 && c >= 10;
          const isStaging = r >= 8 && c < 4;
          const occupied = Math.random() > 0.35;
          spots.push({
            id: `${input.locationId}-${r}-${c}`,
            row: r, col: c,
            label: isDock ? `D${c + 1}` : isRepair ? "RPR" : isStaging ? "STG" : `${String.fromCharCode(65 + r)}${c + 1}`,
            status: isRepair && Math.random() > 0.5 ? "maintenance" : occupied ? "occupied" : Math.random() > 0.8 ? "reserved" : "empty",
            trailerId: occupied ? `TRL-${1000 + idx}` : null,
            trailerNumber: occupied ? `TR-${4000 + idx}` : null,
            type: isDock ? "dock" : isRepair ? "repair" : isStaging ? "staging" : "parking",
          });
        }
      }

      return { locationId: input.locationId, rows, cols, spots, lastUpdated: new Date().toISOString() };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // UPDATE TRAILER POSITION
  // ────────────────────────────────────────────────────────────────────────

  updateTrailerPosition: protectedProcedure
    .input(z.object({
      trailerId: z.string(),
      spotId: z.string(),
      locationId: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        trailerId: input.trailerId,
        newSpotId: input.spotId,
        locationId: input.locationId,
        movedAt: new Date().toISOString(),
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // DOCK SCHEDULE
  // ────────────────────────────────────────────────────────────────────────

  getDockSchedule: protectedProcedure
    .input(z.object({
      locationId: z.string(),
      date: z.string().optional(),
      dockId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const date = input.date || new Date().toISOString().split("T")[0];
      const docks = Array.from({ length: 8 }, (_, i) => {
        const appointments = Array.from({ length: Math.floor(Math.random() * 4) + 1 }, (_, j) => ({
          id: `APT-${i}-${j}`,
          dockId: `D${i + 1}`,
          carrierId: `CAR-${100 + j}`,
          carrierName: ["Swift Transport", "XPO Logistics", "J.B. Hunt", "Werner", "Schneider"][j % 5],
          loadId: `LD-${5000 + i * 10 + j}`,
          type: j % 2 === 0 ? "inbound" as const : "outbound" as const,
          scheduledStart: `${date}T${String(8 + j * 2).padStart(2, "0")}:00:00Z`,
          scheduledEnd: `${date}T${String(9 + j * 2).padStart(2, "0")}:30:00Z`,
          actualArrival: j < 2 ? `${date}T${String(8 + j * 2).padStart(2, "0")}:${String(Math.floor(Math.random() * 20)).padStart(2, "0")}:00Z` : null,
          status: j === 0 ? "completed" as const : j === 1 ? "in_progress" as const : "scheduled" as const,
          trailerNumber: `TR-${4000 + i * 10 + j}`,
        }));

        return {
          dockId: `D${i + 1}`,
          dockName: `Dock Door ${i + 1}`,
          type: i < 4 ? "inbound" as const : i < 7 ? "outbound" as const : "flex" as const,
          status: (i === 6 ? "out_of_service" : i < 5 ? "occupied" : "available") as "available" | "occupied" | "out_of_service",
          appointments,
        };
      });

      return { locationId: input.locationId, date, docks };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // SCHEDULE DOCK APPOINTMENT
  // ────────────────────────────────────────────────────────────────────────

  scheduleDockAppointment: protectedProcedure
    .input(z.object({
      locationId: z.string(),
      dockId: z.string(),
      carrierId: z.string().optional(),
      carrierName: z.string().optional(),
      loadId: z.string().optional(),
      type: z.enum(["inbound", "outbound"]),
      scheduledStart: z.string(),
      scheduledEnd: z.string(),
      trailerNumber: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        appointmentId: nextId(),
        dockId: input.dockId,
        scheduledStart: input.scheduledStart,
        scheduledEnd: input.scheduledEnd,
        createdAt: new Date().toISOString(),
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // CHECK-IN / CHECK-OUT
  // ────────────────────────────────────────────────────────────────────────

  checkInTrailer: protectedProcedure
    .input(z.object({
      locationId: z.string(),
      trailerNumber: z.string(),
      carrierName: z.string().optional(),
      driverName: z.string().optional(),
      driverPhone: z.string().optional(),
      sealNumber: z.string().optional(),
      loadId: z.string().optional(),
      type: z.enum(["inbound", "outbound", "drop", "bobtail"]).default("inbound"),
      condition: z.enum(["good", "damaged", "needs_inspection"]).default("good"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        checkInId: nextId(),
        trailerNumber: input.trailerNumber,
        assignedSpot: `A${Math.floor(Math.random() * 12) + 1}`,
        assignedDock: input.type === "inbound" ? `D${Math.floor(Math.random() * 4) + 1}` : null,
        checkInTime: new Date().toISOString(),
        estimatedUnloadTime: input.type === "inbound" ? hoursFromNow(1.5) : null,
      };
    }),

  checkOutTrailer: protectedProcedure
    .input(z.object({
      locationId: z.string(),
      trailerNumber: z.string(),
      checkInId: z.string().optional(),
      sealNumber: z.string().optional(),
      loadId: z.string().optional(),
      driverName: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        checkOutId: nextId(),
        trailerNumber: input.trailerNumber,
        checkOutTime: new Date().toISOString(),
        dwellTimeMinutes: Math.floor(Math.random() * 300) + 60,
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // TRAILER POOL
  // ────────────────────────────────────────────────────────────────────────

  getTrailerPool: protectedProcedure
    .input(z.object({
      locationId: z.string().optional(),
      status: trailerStatusSchema.optional(),
      type: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }).optional())
    .query(async () => {
      const trailers = Array.from({ length: 24 }, (_, i) => {
        const statuses: Array<"available" | "loaded" | "empty" | "in_repair" | "reserved"> = ["available", "loaded", "empty", "in_repair", "reserved"];
        const types = ["dry_van", "reefer", "flatbed", "tanker", "container"];
        const st = statuses[i % statuses.length];
        return {
          id: `TRL-${2000 + i}`,
          trailerNumber: `TR-${4000 + i}`,
          type: types[i % types.length],
          status: st,
          locationId: "LOC-1",
          spotId: `A${(i % 12) + 1}`,
          condition: i % 7 === 0 ? "needs_inspection" : "good",
          lastInspection: hoursAgo(24 * (i + 1)),
          loadId: st === "loaded" ? `LD-${6000 + i}` : null,
          reservedFor: st === "reserved" ? `LD-${7000 + i}` : null,
          length: 53,
          make: ["Wabash", "Great Dane", "Utility", "Hyundai", "Stoughton"][i % 5],
          year: 2019 + (i % 5),
          lastMoveTime: hoursAgo(i * 2),
        };
      });

      const summary = {
        total: trailers.length,
        available: trailers.filter(t => t.status === "available").length,
        loaded: trailers.filter(t => t.status === "loaded").length,
        empty: trailers.filter(t => t.status === "empty").length,
        inRepair: trailers.filter(t => t.status === "in_repair").length,
        reserved: trailers.filter(t => t.status === "reserved").length,
      };

      return { trailers, summary };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // TRAILER DETAILS
  // ────────────────────────────────────────────────────────────────────────

  getTrailerDetails: protectedProcedure
    .input(z.object({ trailerId: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.trailerId,
        trailerNumber: `TR-${input.trailerId.replace(/\D/g, "") || "4001"}`,
        type: "dry_van",
        status: "available" as const,
        condition: "good",
        make: "Wabash",
        model: "DuraPlate",
        year: 2022,
        vin: "1JJV532D5NL123456",
        length: 53,
        locationId: "LOC-1",
        spotId: "A5",
        lastInspection: hoursAgo(72),
        nextInspection: hoursFromNow(720),
        tireCondition: "good",
        brakeCondition: "good",
        lightStatus: "operational",
        floorCondition: "good",
        documents: [
          { type: "registration", expiresAt: hoursFromNow(4320), status: "valid" },
          { type: "annual_inspection", expiresAt: hoursFromNow(6480), status: "valid" },
        ],
        moveHistory: [
          { from: "D2", to: "A5", movedBy: "Hostler Mike", movedAt: hoursAgo(4) },
          { from: "Gate", to: "D2", movedBy: "Hostler Dave", movedAt: hoursAgo(8) },
        ],
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // ASSIGN TRAILER
  // ────────────────────────────────────────────────────────────────────────

  assignTrailer: protectedProcedure
    .input(z.object({
      trailerId: z.string(),
      loadId: z.string().optional(),
      driverId: z.string().optional(),
      driverName: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        trailerId: input.trailerId,
        loadId: input.loadId || null,
        driverId: input.driverId || null,
        assignedAt: new Date().toISOString(),
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // CONTAINER TRACKING
  // ────────────────────────────────────────────────────────────────────────

  getContainerTracking: protectedProcedure
    .input(z.object({
      locationId: z.string().optional(),
      status: containerStatusSchema.optional(),
      search: z.string().optional(),
    }).optional())
    .query(async () => {
      const containers = Array.from({ length: 12 }, (_, i) => {
        const statuses: Array<"on_chassis" | "grounded" | "loaded" | "empty" | "in_transit" | "at_port"> =
          ["on_chassis", "grounded", "loaded", "empty", "in_transit", "at_port"];
        return {
          id: `CTR-${3000 + i}`,
          containerNumber: `MSCU${String(7000000 + i).padStart(7, "0")}`,
          size: i % 3 === 0 ? "20ft" : i % 3 === 1 ? "40ft" : "45ft",
          type: i % 4 === 0 ? "standard" : i % 4 === 1 ? "high_cube" : i % 4 === 2 ? "reefer" : "open_top",
          status: statuses[i % statuses.length],
          chassisId: i % 2 === 0 ? `CHS-${500 + i}` : null,
          locationId: "LOC-1",
          spotId: `C${i + 1}`,
          steamshipLine: ["Maersk", "MSC", "CMA CGM", "Hapag-Lloyd", "ONE"][i % 5],
          bookingNumber: `BK-${8000 + i}`,
          sealNumber: `SL-${9000 + i}`,
          weight: Math.floor(Math.random() * 30000) + 10000,
          lastFreeDay: hoursFromNow(48 + i * 24),
          demurrageRate: 150,
          arrivalTime: hoursAgo(24 + i * 6),
        };
      });

      return {
        containers,
        summary: {
          total: containers.length,
          onChassis: containers.filter(c => c.status === "on_chassis").length,
          grounded: containers.filter(c => c.status === "grounded").length,
          loaded: containers.filter(c => c.status === "loaded").length,
          empty: containers.filter(c => c.status === "empty").length,
        },
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // CHASSIS INVENTORY
  // ────────────────────────────────────────────────────────────────────────

  getChassisInventory: protectedProcedure
    .input(z.object({
      locationId: z.string().optional(),
      status: chassisStatusSchema.optional(),
    }).optional())
    .query(async () => {
      const chassis = Array.from({ length: 16 }, (_, i) => {
        const statuses: Array<"available" | "in_use" | "maintenance" | "out_of_service"> =
          ["available", "in_use", "maintenance", "out_of_service"];
        return {
          id: `CHS-${500 + i}`,
          chassisNumber: `CH-${700 + i}`,
          type: i % 2 === 0 ? "20/40" : "40/45",
          status: statuses[i % statuses.length],
          owner: ["DCLI", "TRAC", "Flexi-Van", "Pool Owner"][i % 4],
          containerId: statuses[i % statuses.length] === "in_use" ? `CTR-${3000 + i}` : null,
          locationId: "LOC-1",
          condition: i % 5 === 0 ? "needs_repair" : "good",
          lastInspection: hoursAgo(48 * (i + 1)),
          tireCondition: i % 6 === 0 ? "worn" : "good",
          lightStatus: "operational",
        };
      });

      return {
        chassis,
        summary: {
          total: chassis.length,
          available: chassis.filter(c => c.status === "available").length,
          inUse: chassis.filter(c => c.status === "in_use").length,
          maintenance: chassis.filter(c => c.status === "maintenance").length,
          outOfService: chassis.filter(c => c.status === "out_of_service").length,
        },
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // CROSS-DOCK OPERATIONS
  // ────────────────────────────────────────────────────────────────────────

  getCrossDockOperations: protectedProcedure
    .input(z.object({ locationId: z.string().optional() }).optional())
    .query(async () => {
      const operations = Array.from({ length: 6 }, (_, i) => ({
        id: `XD-${100 + i}`,
        status: (["in_progress", "planned", "completed", "in_progress", "planned", "completed"] as const)[i],
        inboundDock: `D${i + 1}`,
        outboundDock: `D${i + 5}`,
        inboundTrailer: `TR-${4100 + i}`,
        outboundTrailer: `TR-${4200 + i}`,
        inboundCarrier: ["Swift", "XPO", "J.B. Hunt", "Werner", "Schneider", "Old Dominion"][i],
        outboundCarrier: ["FedEx Freight", "UPS Freight", "Estes", "SAIA", "ABF", "YRC"][i],
        palletCount: Math.floor(Math.random() * 20) + 5,
        palletsTransferred: i < 3 ? Math.floor(Math.random() * 15) + 3 : 0,
        startTime: hoursAgo(i * 2),
        estimatedCompletion: hoursFromNow(2 - i * 0.5),
        priority: i < 2 ? "high" as const : "normal" as const,
      }));

      return {
        operations,
        summary: {
          total: operations.length,
          inProgress: operations.filter(o => o.status === "in_progress").length,
          planned: operations.filter(o => o.status === "planned").length,
          completed: operations.filter(o => o.status === "completed").length,
          avgTransferTimeMinutes: 45,
        },
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // CREATE CROSS-DOCK PLAN
  // ────────────────────────────────────────────────────────────────────────

  createCrossDockPlan: protectedProcedure
    .input(z.object({
      locationId: z.string(),
      inboundTrailerId: z.string(),
      outboundTrailerId: z.string(),
      inboundDockId: z.string(),
      outboundDockId: z.string(),
      palletCount: z.number(),
      scheduledStart: z.string(),
      priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        operationId: nextId(),
        scheduledStart: input.scheduledStart,
        estimatedCompletion: hoursFromNow(1.5),
        createdAt: new Date().toISOString(),
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // WAREHOUSE INVENTORY
  // ────────────────────────────────────────────────────────────────────────

  getWarehouseInventory: protectedProcedure
    .input(z.object({
      locationId: z.string().optional(),
      search: z.string().optional(),
      category: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }).optional())
    .query(async () => {
      const items = Array.from({ length: 18 }, (_, i) => ({
        id: `INV-${4000 + i}`,
        sku: `SKU-${String(10000 + i * 111).padStart(8, "0")}`,
        name: [
          "Industrial Valve Assembly", "Steel Pipe 6in", "Hydraulic Pump Unit",
          "Electrical Panel Box", "Safety Harness Set", "Drill Bit Kit",
          "Welding Wire Spool", "Pressure Gauge", "Ball Bearing Set",
          "Conveyor Belt Section", "Air Compressor Filter", "Forklift Tire",
          "Pallet Jack Wheel", "Stretch Wrap Roll", "Corrugated Box 24x18",
          "Label Printer Ribbon", "Dock Plate", "Loading Ramp",
        ][i],
        category: ["Parts", "Raw Materials", "Equipment", "Supplies", "Packaging", "Safety"][i % 6],
        quantity: Math.floor(Math.random() * 500) + 10,
        unit: i % 3 === 0 ? "each" : i % 3 === 1 ? "box" : "pallet",
        location: `WH-${String.fromCharCode(65 + (i % 4))}-${Math.floor(i / 4) + 1}-${(i % 3) + 1}`,
        minLevel: Math.floor(Math.random() * 20) + 5,
        maxLevel: Math.floor(Math.random() * 1000) + 100,
        lastReceived: hoursAgo(24 * (i + 1)),
        lastShipped: hoursAgo(12 * (i + 1)),
        value: Math.floor(Math.random() * 10000) + 500,
      }));

      const lowStock = items.filter(it => it.quantity <= it.minLevel);
      return {
        items,
        summary: {
          totalItems: items.length,
          totalValue: items.reduce((s, it) => s + it.value * it.quantity, 0),
          lowStockAlerts: lowStock.length,
          categories: 6,
        },
        lowStockAlerts: lowStock,
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // PROCESS WAREHOUSE RECEIPT
  // ────────────────────────────────────────────────────────────────────────

  processWarehouseReceipt: protectedProcedure
    .input(z.object({
      locationId: z.string(),
      trailerNumber: z.string().optional(),
      poNumber: z.string().optional(),
      items: z.array(z.object({
        sku: z.string(),
        quantity: z.number(),
        description: z.string().optional(),
        lotNumber: z.string().optional(),
      })),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        receiptId: nextId(),
        itemsReceived: input.items.length,
        totalQuantity: input.items.reduce((s, it) => s + it.quantity, 0),
        processedAt: new Date().toISOString(),
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // PROCESS WAREHOUSE SHIPMENT
  // ────────────────────────────────────────────────────────────────────────

  processWarehouseShipment: protectedProcedure
    .input(z.object({
      locationId: z.string(),
      trailerNumber: z.string().optional(),
      orderId: z.string().optional(),
      items: z.array(z.object({
        sku: z.string(),
        quantity: z.number(),
        description: z.string().optional(),
      })),
      destination: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        shipmentId: nextId(),
        itemsShipped: input.items.length,
        totalQuantity: input.items.reduce((s, it) => s + it.quantity, 0),
        processedAt: new Date().toISOString(),
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // DROP YARD OPERATIONS
  // ────────────────────────────────────────────────────────────────────────

  getDropYardOperations: protectedProcedure
    .input(z.object({ locationId: z.string().optional() }).optional())
    .query(async () => {
      const trailers = Array.from({ length: 14 }, (_, i) => ({
        id: `DY-${600 + i}`,
        trailerNumber: `TR-${5000 + i}`,
        status: (["dropped", "awaiting_pickup", "loaded_waiting", "empty_waiting"] as const)[i % 4],
        droppedBy: `Driver ${["Johnson", "Smith", "Williams", "Brown", "Jones", "Garcia", "Miller"][i % 7]}`,
        droppedAt: hoursAgo(i * 6 + 2),
        pickupScheduled: i % 3 === 0 ? hoursFromNow(i * 4) : null,
        pickupDriver: i % 3 === 0 ? `Driver ${["Lee", "Davis", "Wilson"][i % 3]}` : null,
        loadId: i % 2 === 0 ? `LD-${8000 + i}` : null,
        dwellTimeHours: i * 6 + 2,
        spotId: `DY-${String.fromCharCode(65 + (i % 3))}-${i + 1}`,
        sealIntact: i % 5 !== 0,
        notes: i % 5 === 0 ? "Seal broken - requires inspection" : null,
      }));

      return {
        trailers,
        summary: {
          total: trailers.length,
          dropped: trailers.filter(t => t.status === "dropped").length,
          awaitingPickup: trailers.filter(t => t.status === "awaiting_pickup").length,
          avgDwellHours: Math.round(trailers.reduce((s, t) => s + t.dwellTimeHours, 0) / trailers.length),
          sealIssues: trailers.filter(t => !t.sealIntact).length,
        },
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // GATE LOG
  // ────────────────────────────────────────────────────────────────────────

  getGateLog: protectedProcedure
    .input(z.object({
      locationId: z.string().optional(),
      date: z.string().optional(),
      type: z.enum(["entry", "exit", "all"]).default("all"),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }).optional())
    .query(async () => {
      const entries = Array.from({ length: 30 }, (_, i) => ({
        id: `GL-${900 + i}`,
        type: i % 2 === 0 ? "entry" as const : "exit" as const,
        timestamp: hoursAgo(i * 0.5),
        trailerNumber: `TR-${4000 + (i % 20)}`,
        tractorNumber: i % 3 === 0 ? null : `TK-${3000 + i}`,
        driverName: `Driver ${["Adams", "Baker", "Clark", "Davis", "Evans", "Foster", "Green"][i % 7]}`,
        carrierName: ["Swift", "XPO", "J.B. Hunt", "Werner", "Schneider"][i % 5],
        sealNumber: i % 2 === 0 ? `SL-${9000 + i}` : null,
        loadId: `LD-${6000 + i}`,
        gate: i % 2 === 0 ? "Gate A" : "Gate B",
        purpose: (["delivery", "pickup", "drop", "bobtail", "vendor"] as const)[i % 5],
        notes: null as string | null,
      }));

      return {
        entries,
        summary: {
          totalEntries: entries.filter(e => e.type === "entry").length,
          totalExits: entries.filter(e => e.type === "exit").length,
          uniqueCarriers: 5,
          peakHour: "10:00 AM",
        },
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // YARD MOVE QUEUE
  // ────────────────────────────────────────────────────────────────────────

  getYardMoveQueue: protectedProcedure
    .input(z.object({
      locationId: z.string().optional(),
      status: yardMoveStatusSchema.optional(),
    }).optional())
    .query(async () => {
      const moves = Array.from({ length: 10 }, (_, i) => ({
        id: `YM-${200 + i}`,
        status: (["pending", "assigned", "in_progress", "pending", "completed", "pending", "assigned", "pending", "in_progress", "completed"] as const)[i],
        trailerNumber: `TR-${4000 + i}`,
        fromSpot: `${String.fromCharCode(65 + (i % 5))}${(i % 8) + 1}`,
        toSpot: i % 3 === 0 ? `D${(i % 8) + 1}` : `${String.fromCharCode(65 + ((i + 2) % 5))}${(i % 8) + 1}`,
        priority: i < 3 ? "urgent" as const : i < 6 ? "high" as const : "normal" as const,
        requestedAt: hoursAgo(i * 0.5),
        assignedTo: i % 3 !== 0 ? `Hostler ${["Mike", "Dave", "Sam", "Joe"][i % 4]}` : null,
        hostlerId: i % 3 !== 0 ? `HST-${i % 4 + 1}` : null,
        reason: (["dock_assignment", "reposition", "outbound_staging", "repair_move", "gate_staging"] as const)[i % 5],
        estimatedMinutes: Math.floor(Math.random() * 15) + 5,
        startedAt: i === 2 || i === 8 ? hoursAgo(0.1) : null,
        completedAt: i === 4 || i === 9 ? hoursAgo(0.05) : null,
      }));

      return {
        moves,
        summary: {
          total: moves.length,
          pending: moves.filter(m => m.status === "pending").length,
          assigned: moves.filter(m => m.status === "assigned").length,
          inProgress: moves.filter(m => m.status === "in_progress").length,
          completed: moves.filter(m => m.status === "completed").length,
          avgCompletionMinutes: 12,
        },
        hostlers: [
          { id: "HST-1", name: "Hostler Mike", status: "busy", currentMove: "YM-202", movesCompleted: 14 },
          { id: "HST-2", name: "Hostler Dave", status: "available", currentMove: null, movesCompleted: 11 },
          { id: "HST-3", name: "Hostler Sam", status: "busy", currentMove: "YM-208", movesCompleted: 9 },
          { id: "HST-4", name: "Hostler Joe", status: "break", currentMove: null, movesCompleted: 7 },
        ],
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // ASSIGN YARD MOVE
  // ────────────────────────────────────────────────────────────────────────

  assignYardMove: protectedProcedure
    .input(z.object({
      moveId: z.string(),
      hostlerId: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        moveId: input.moveId,
        hostlerId: input.hostlerId,
        assignedAt: new Date().toISOString(),
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // DETENTION TRACKING
  // ────────────────────────────────────────────────────────────────────────

  getDetentionTracking: protectedProcedure
    .input(z.object({
      locationId: z.string().optional(),
      onlyActive: z.boolean().default(true),
    }).optional())
    .query(async () => {
      const records = Array.from({ length: 8 }, (_, i) => {
        const freeTimeHours = 2;
        const totalHours = freeTimeHours + (i + 1) * 1.5;
        const detentionHours = Math.max(0, totalHours - freeTimeHours);
        const rate = 75;
        return {
          id: `DET-${300 + i}`,
          trailerNumber: `TR-${4050 + i}`,
          carrierName: ["Swift", "XPO", "J.B. Hunt", "Werner", "Schneider", "Old Dominion", "Estes", "SAIA"][i],
          loadId: `LD-${6050 + i}`,
          arrivalTime: hoursAgo(totalHours),
          freeTimeHours,
          totalTimeHours: Math.round(totalHours * 10) / 10,
          detentionHours: Math.round(detentionHours * 10) / 10,
          rate,
          accruedCharge: Math.round(detentionHours * rate * 100) / 100,
          status: detentionHours > 4 ? "critical" as const : detentionHours > 2 ? "warning" as const : "normal" as const,
          type: i % 2 === 0 ? "loading" as const : "unloading" as const,
        };
      });

      return {
        records,
        summary: {
          activeDetentions: records.length,
          totalAccruedCharges: records.reduce((s, r) => s + r.accruedCharge, 0),
          avgDetentionHours: Math.round(records.reduce((s, r) => s + r.detentionHours, 0) / records.length * 10) / 10,
          criticalCount: records.filter(r => r.status === "critical").length,
        },
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // YARD ANALYTICS
  // ────────────────────────────────────────────────────────────────────────

  getYardAnalytics: protectedProcedure
    .input(z.object({
      locationId: z.string().optional(),
      period: z.enum(["today", "week", "month"]).default("week"),
    }).optional())
    .query(async () => {
      const daysInPeriod = 7;
      const dailyMetrics = Array.from({ length: daysInPeriod }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (daysInPeriod - 1 - i));
        return {
          date: date.toISOString().split("T")[0],
          gateEntries: Math.floor(Math.random() * 20) + 25,
          gateExits: Math.floor(Math.random() * 20) + 23,
          avgDwellTimeMinutes: Math.floor(Math.random() * 120) + 180,
          avgTurnTimeMinutes: Math.floor(Math.random() * 30) + 30,
          yardUtilizationPct: Math.floor(Math.random() * 25) + 60,
          dockUtilizationPct: Math.floor(Math.random() * 30) + 55,
          yardMoves: Math.floor(Math.random() * 15) + 20,
          detentionIncidents: Math.floor(Math.random() * 5),
          crossDockOps: Math.floor(Math.random() * 6) + 2,
          onTimeAppointmentPct: Math.floor(Math.random() * 15) + 80,
        };
      });

      return {
        period: "week",
        dailyMetrics,
        aggregated: {
          avgDwellTimeMinutes: Math.round(dailyMetrics.reduce((s, d) => s + d.avgDwellTimeMinutes, 0) / daysInPeriod),
          avgTurnTimeMinutes: Math.round(dailyMetrics.reduce((s, d) => s + d.avgTurnTimeMinutes, 0) / daysInPeriod),
          avgYardUtilization: Math.round(dailyMetrics.reduce((s, d) => s + d.yardUtilizationPct, 0) / daysInPeriod),
          avgDockUtilization: Math.round(dailyMetrics.reduce((s, d) => s + d.dockUtilizationPct, 0) / daysInPeriod),
          totalGateEntries: dailyMetrics.reduce((s, d) => s + d.gateEntries, 0),
          totalGateExits: dailyMetrics.reduce((s, d) => s + d.gateExits, 0),
          totalYardMoves: dailyMetrics.reduce((s, d) => s + d.yardMoves, 0),
          totalDetentionIncidents: dailyMetrics.reduce((s, d) => s + d.detentionIncidents, 0),
          avgOnTimeAppointmentPct: Math.round(dailyMetrics.reduce((s, d) => s + d.onTimeAppointmentPct, 0) / daysInPeriod),
        },
      };
    }),

  // ────────────────────────────────────────────────────────────────────────
  // APPOINTMENT COMPLIANCE
  // ────────────────────────────────────────────────────────────────────────

  getAppointmentCompliance: protectedProcedure
    .input(z.object({
      locationId: z.string().optional(),
      period: z.enum(["today", "week", "month"]).default("week"),
    }).optional())
    .query(async () => {
      const carriers = [
        { carrierName: "Swift Transport", scheduled: 42, onTime: 38, early: 2, late: 2, noShow: 0, compliancePct: 90.5 },
        { carrierName: "XPO Logistics", scheduled: 35, onTime: 30, early: 3, late: 1, noShow: 1, compliancePct: 85.7 },
        { carrierName: "J.B. Hunt", scheduled: 28, onTime: 26, early: 1, late: 1, noShow: 0, compliancePct: 92.9 },
        { carrierName: "Werner Enterprises", scheduled: 22, onTime: 18, early: 1, late: 2, noShow: 1, compliancePct: 81.8 },
        { carrierName: "Schneider National", scheduled: 18, onTime: 17, early: 0, late: 1, noShow: 0, compliancePct: 94.4 },
      ];

      const totalScheduled = carriers.reduce((s, c) => s + c.scheduled, 0);
      const totalOnTime = carriers.reduce((s, c) => s + c.onTime, 0);

      return {
        overallCompliancePct: Math.round((totalOnTime / totalScheduled) * 1000) / 10,
        totalScheduled,
        totalOnTime,
        totalEarly: carriers.reduce((s, c) => s + c.early, 0),
        totalLate: carriers.reduce((s, c) => s + c.late, 0),
        totalNoShow: carriers.reduce((s, c) => s + c.noShow, 0),
        carrierBreakdown: carriers,
        peakHours: [
          { hour: "06:00-08:00", count: 18 },
          { hour: "08:00-10:00", count: 32 },
          { hour: "10:00-12:00", count: 28 },
          { hour: "12:00-14:00", count: 15 },
          { hour: "14:00-16:00", count: 22 },
          { hour: "16:00-18:00", count: 12 },
        ],
      };
    }),
});
