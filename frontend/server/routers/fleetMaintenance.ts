/**
 * FLEET MAINTENANCE ROUTER
 * Comprehensive fleet maintenance and vehicle management module.
 * Covers: preventive maintenance scheduling, work orders, repair tracking,
 * parts inventory, warranty management, tire management, vehicle lifecycle,
 * DOT inspection prep, fuel efficiency, cost analysis, vendor management,
 * recall alerts, predictive maintenance, fleet utilization, compliance calendar.
 */

import { z } from "zod";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";

// ---------------------------------------------------------------------------
// Zod schemas for inputs
// ---------------------------------------------------------------------------

const paginationInput = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(50),
});

const workOrderStatusSchema = z.enum([
  "open", "in_progress", "awaiting_parts", "completed", "cancelled",
]);

const workOrderPrioritySchema = z.enum(["critical", "high", "medium", "low"]);

const workOrderTypeSchema = z.enum([
  "preventive", "corrective", "emergency", "inspection", "recall", "warranty",
]);

const tireEventTypeSchema = z.enum([
  "rotation", "replacement", "repair", "inspection", "retread", "blowout",
]);

const tirePositionSchema = z.enum([
  "LF", "RF", "LRO", "RRO", "LRI", "RRI", "LFO_TRAILER", "RFO_TRAILER",
  "LRI_TRAILER", "RRI_TRAILER", "SPARE",
]);

// ---------------------------------------------------------------------------
// Helpers — deterministic seed from IDs for consistent demo data
// ---------------------------------------------------------------------------

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function seededId(prefix: string, seed: number): string {
  return `${prefix}_${Math.abs(Math.floor(seed * 100000))}`;
}

const VEHICLE_UNITS = [
  "TRK-1001", "TRK-1002", "TRK-1003", "TRK-1004", "TRK-1005",
  "TRK-1006", "TRK-1007", "TRK-1008", "TRK-1009", "TRK-1010",
  "TRL-2001", "TRL-2002", "TRL-2003", "TRL-2004", "TRL-2005",
];

const VENDORS = [
  { id: 1, name: "FleetPro Service Center", rating: 4.8, specialty: "Engine & Drivetrain" },
  { id: 2, name: "Highway Tire & Brake", rating: 4.5, specialty: "Tires & Brakes" },
  { id: 3, name: "National Fleet Repair", rating: 4.2, specialty: "General Maintenance" },
  { id: 4, name: "TruckTech Diagnostics", rating: 4.7, specialty: "Electronics & Diagnostics" },
  { id: 5, name: "Precision Diesel Works", rating: 4.6, specialty: "Diesel Engine Specialist" },
];

const PM_SERVICES = [
  { name: "Oil & Filter Change", intervalMiles: 15000, intervalDays: 90, estimatedCost: 350 },
  { name: "DPF Regeneration / Clean", intervalMiles: 100000, intervalDays: 365, estimatedCost: 1200 },
  { name: "Brake Inspection & Adjustment", intervalMiles: 25000, intervalDays: 120, estimatedCost: 450 },
  { name: "Tire Rotation & Inspection", intervalMiles: 20000, intervalDays: 90, estimatedCost: 200 },
  { name: "Coolant System Service", intervalMiles: 50000, intervalDays: 365, estimatedCost: 600 },
  { name: "Transmission Service", intervalMiles: 60000, intervalDays: 365, estimatedCost: 900 },
  { name: "A/C System Check", intervalMiles: 0, intervalDays: 365, estimatedCost: 250 },
  { name: "Full DOT Annual Inspection", intervalMiles: 0, intervalDays: 365, estimatedCost: 500 },
  { name: "Wheel Seal & Bearing Repack", intervalMiles: 100000, intervalDays: 730, estimatedCost: 800 },
  { name: "Air Dryer Maintenance", intervalMiles: 75000, intervalDays: 365, estimatedCost: 350 },
];

const PART_CATALOG = [
  { partNumber: "OIL-15W40-GAL", name: "15W-40 Diesel Engine Oil (gal)", category: "Fluids", unitCost: 22.50, qtyOnHand: 48, reorderPoint: 20, reorderQty: 50 },
  { partNumber: "FLT-OIL-DD15", name: "Oil Filter - DD15 Engine", category: "Filters", unitCost: 18.75, qtyOnHand: 12, reorderPoint: 10, reorderQty: 24 },
  { partNumber: "FLT-FUEL-PRI", name: "Primary Fuel Filter", category: "Filters", unitCost: 32.00, qtyOnHand: 8, reorderPoint: 6, reorderQty: 12 },
  { partNumber: "FLT-AIR-MAIN", name: "Main Air Filter Element", category: "Filters", unitCost: 65.00, qtyOnHand: 6, reorderPoint: 4, reorderQty: 8 },
  { partNumber: "BRK-PAD-DISC", name: "Disc Brake Pad Set (axle)", category: "Brakes", unitCost: 145.00, qtyOnHand: 4, reorderPoint: 4, reorderQty: 8 },
  { partNumber: "BRK-DRUM-REAR", name: "Rear Brake Drum", category: "Brakes", unitCost: 210.00, qtyOnHand: 2, reorderPoint: 2, reorderQty: 4 },
  { partNumber: "BLT-SERP-MAIN", name: "Serpentine Belt - Main", category: "Belts", unitCost: 55.00, qtyOnHand: 5, reorderPoint: 3, reorderQty: 6 },
  { partNumber: "COOL-ANTIFRZ", name: "Extended Life Coolant (gal)", category: "Fluids", unitCost: 28.00, qtyOnHand: 24, reorderPoint: 12, reorderQty: 24 },
  { partNumber: "TIRE-295-75R22", name: "Drive Tire 295/75R22.5", category: "Tires", unitCost: 485.00, qtyOnHand: 8, reorderPoint: 4, reorderQty: 8 },
  { partNumber: "TIRE-11R22-STR", name: "Steer Tire 11R22.5", category: "Tires", unitCost: 520.00, qtyOnHand: 4, reorderPoint: 2, reorderQty: 4 },
  { partNumber: "LAMP-HEAD-LED", name: "LED Headlight Assembly", category: "Electrical", unitCost: 175.00, qtyOnHand: 3, reorderPoint: 2, reorderQty: 4 },
  { partNumber: "LAMP-TAIL-LED", name: "LED Tail Light Assembly", category: "Electrical", unitCost: 85.00, qtyOnHand: 6, reorderPoint: 4, reorderQty: 8 },
];

const DOT_CHECKLIST_ITEMS = [
  { category: "Brakes", item: "Service brake system", critical: true },
  { category: "Brakes", item: "Parking brake system", critical: true },
  { category: "Brakes", item: "Brake drums/rotors condition", critical: true },
  { category: "Brakes", item: "Brake hoses and tubing", critical: true },
  { category: "Brakes", item: "Low air pressure warning device", critical: true },
  { category: "Steering", item: "Steering wheel free play", critical: true },
  { category: "Steering", item: "Power steering fluid level", critical: false },
  { category: "Steering", item: "Steering linkage and components", critical: true },
  { category: "Lighting", item: "Headlights (high and low beam)", critical: true },
  { category: "Lighting", item: "Tail lights", critical: true },
  { category: "Lighting", item: "Turn signals", critical: true },
  { category: "Lighting", item: "Clearance/marker lights", critical: false },
  { category: "Lighting", item: "Reflectors and reflective tape", critical: false },
  { category: "Tires", item: "Tire condition and tread depth (>4/32 steer, >2/32 drive)", critical: true },
  { category: "Tires", item: "Tire inflation pressure", critical: true },
  { category: "Tires", item: "Wheel and rim condition", critical: true },
  { category: "Exhaust", item: "Exhaust system leaks", critical: true },
  { category: "Exhaust", item: "Exhaust system securement", critical: false },
  { category: "Frame", item: "Frame members and fasteners", critical: true },
  { category: "Frame", item: "Suspension components", critical: true },
  { category: "Coupling", item: "Fifth wheel condition", critical: true },
  { category: "Coupling", item: "Pintle hook / drawbar", critical: true },
  { category: "Windshield", item: "Windshield condition", critical: false },
  { category: "Windshield", item: "Wipers and washers", critical: false },
  { category: "Safety", item: "Fire extinguisher", critical: true },
  { category: "Safety", item: "Warning triangles / flares", critical: true },
  { category: "Safety", item: "Horn operation", critical: false },
  { category: "Safety", item: "Mirrors and mounting", critical: false },
  { category: "Fuel", item: "Fuel system integrity", critical: true },
  { category: "Fuel", item: "Fuel tank securement", critical: false },
];

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const fleetMaintenanceRouter = router({

  // =========================================================================
  // MAINTENANCE DASHBOARD
  // =========================================================================

  getMaintenanceDashboard: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const companyId = (ctx.user as any)?.companyId || 1;
    const seed = companyId * 31;

    const overduePMs = Math.floor(seededRandom(seed + 1) * 6) + 2;
    const upcomingPMs7d = Math.floor(seededRandom(seed + 2) * 8) + 3;
    const upcomingPMs30d = upcomingPMs7d + Math.floor(seededRandom(seed + 3) * 12) + 5;
    const openWorkOrders = Math.floor(seededRandom(seed + 4) * 10) + 4;
    const awaitingParts = Math.floor(seededRandom(seed + 5) * 4) + 1;
    const costMTD = Math.round(seededRandom(seed + 6) * 25000 + 8000);
    const costLastMonth = Math.round(seededRandom(seed + 7) * 30000 + 10000);
    const fleetSize = VEHICLE_UNITS.length;
    const vehiclesInShop = Math.floor(seededRandom(seed + 8) * 3) + 1;
    const fleetAvailability = Math.round(((fleetSize - vehiclesInShop) / fleetSize) * 100 * 10) / 10;
    const recallAlerts = Math.floor(seededRandom(seed + 9) * 3);
    const expiringWarranties = Math.floor(seededRandom(seed + 10) * 4) + 1;
    const avgRepairTurnaround = Math.round(seededRandom(seed + 11) * 36 + 12);
    const complianceScore = Math.round(seededRandom(seed + 12) * 15 + 85);

    return {
      overduePMs,
      upcomingPMs7d,
      upcomingPMs30d,
      openWorkOrders,
      awaitingParts,
      costMTD,
      costLastMonth,
      costTrend: costMTD > costLastMonth ? "up" : "down",
      costTrendPct: Math.round(Math.abs(costMTD - costLastMonth) / costLastMonth * 100),
      fleetSize,
      vehiclesInShop,
      fleetAvailability,
      recallAlerts,
      expiringWarranties,
      avgRepairTurnaroundHrs: avgRepairTurnaround,
      complianceScore,
      recentActivity: Array.from({ length: 8 }, (_, i) => ({
        id: seededId("act", seed + i * 7),
        type: ["pm_completed", "wo_created", "part_ordered", "inspection_passed", "tire_replaced", "recall_resolved", "warranty_claimed", "wo_completed"][i % 8],
        description: [
          `Oil change completed on ${VEHICLE_UNITS[i % VEHICLE_UNITS.length]}`,
          `Work order created for brake repair on ${VEHICLE_UNITS[(i + 1) % VEHICLE_UNITS.length]}`,
          `Ordered 4x air filters from FleetPro Supply`,
          `${VEHICLE_UNITS[(i + 2) % VEHICLE_UNITS.length]} passed DOT annual inspection`,
          `Replaced 2 drive tires on ${VEHICLE_UNITS[(i + 3) % VEHICLE_UNITS.length]}`,
          `NHTSA recall 24V-089 resolved on ${VEHICLE_UNITS[(i + 4) % VEHICLE_UNITS.length]}`,
          `Warranty claim submitted for turbo replacement on ${VEHICLE_UNITS[(i + 5) % VEHICLE_UNITS.length]}`,
          `Transmission service completed on ${VEHICLE_UNITS[(i + 6) % VEHICLE_UNITS.length]}`,
        ][i % 8],
        vehicleUnit: VEHICLE_UNITS[i % VEHICLE_UNITS.length],
        timestamp: new Date(now.getTime() - i * 3600000 * (2 + i)).toISOString(),
      })),
      costByCategory: [
        { category: "Preventive Maintenance", amount: Math.round(costMTD * 0.35) },
        { category: "Tires", amount: Math.round(costMTD * 0.22) },
        { category: "Brakes", amount: Math.round(costMTD * 0.15) },
        { category: "Engine / Drivetrain", amount: Math.round(costMTD * 0.13) },
        { category: "Electrical", amount: Math.round(costMTD * 0.08) },
        { category: "Other", amount: Math.round(costMTD * 0.07) },
      ],
    };
  }),

  // =========================================================================
  // PREVENTIVE MAINTENANCE SCHEDULE
  // =========================================================================

  getPreventiveSchedule: protectedProcedure
    .input(z.object({
      vehicleId: z.number().optional(),
      dueSoon: z.boolean().optional().default(false),
    }).merge(paginationInput))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const seed = ((ctx.user as any)?.companyId || 1) * 17;

      const schedule: Array<{
        id: string;
        vehicleUnit: string;
        vehicleId: number;
        service: string;
        intervalMiles: number;
        intervalDays: number;
        lastPerformedDate: string;
        lastPerformedMiles: number;
        nextDueDate: string;
        nextDueMiles: number;
        currentMiles: number;
        milesUntilDue: number;
        daysUntilDue: number;
        status: "overdue" | "due_soon" | "upcoming" | "on_track";
        estimatedCost: number;
      }> = [];

      const vehicles = input.vehicleId
        ? [{ id: input.vehicleId, unit: VEHICLE_UNITS[input.vehicleId % VEHICLE_UNITS.length] || "TRK-UNKNOWN" }]
        : VEHICLE_UNITS.map((u, i) => ({ id: i + 1, unit: u }));

      for (const vehicle of vehicles) {
        for (let si = 0; si < PM_SERVICES.length; si++) {
          const svc = PM_SERVICES[si];
          const s = seed + vehicle.id * 53 + si * 7;
          const currentMiles = Math.round(seededRandom(s) * 200000 + 80000);
          const lastMiles = currentMiles - Math.round(seededRandom(s + 1) * svc.intervalMiles * 1.2);
          const lastDate = new Date(now.getTime() - Math.round(seededRandom(s + 2) * svc.intervalDays * 1.3 * 86400000));
          const nextDueMiles = lastMiles + svc.intervalMiles;
          const nextDueDate = new Date(lastDate.getTime() + svc.intervalDays * 86400000);
          const milesUntilDue = nextDueMiles - currentMiles;
          const daysUntilDue = Math.round((nextDueDate.getTime() - now.getTime()) / 86400000);

          let status: "overdue" | "due_soon" | "upcoming" | "on_track" = "on_track";
          if (milesUntilDue <= 0 || daysUntilDue <= 0) status = "overdue";
          else if (milesUntilDue <= 2000 || daysUntilDue <= 7) status = "due_soon";
          else if (milesUntilDue <= 5000 || daysUntilDue <= 30) status = "upcoming";

          if (input.dueSoon && status === "on_track") continue;

          schedule.push({
            id: seededId("pm", s),
            vehicleUnit: vehicle.unit,
            vehicleId: vehicle.id,
            service: svc.name,
            intervalMiles: svc.intervalMiles,
            intervalDays: svc.intervalDays,
            lastPerformedDate: lastDate.toISOString(),
            lastPerformedMiles: lastMiles,
            nextDueDate: nextDueDate.toISOString(),
            nextDueMiles: nextDueMiles,
            currentMiles,
            milesUntilDue,
            daysUntilDue,
            status,
            estimatedCost: svc.estimatedCost,
          });
        }
      }

      schedule.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

      const start = (input.page - 1) * input.limit;
      return {
        items: schedule.slice(start, start + input.limit),
        total: schedule.length,
        page: input.page,
        totalPages: Math.ceil(schedule.length / input.limit),
      };
    }),

  // =========================================================================
  // WORK ORDERS
  // =========================================================================

  createWorkOrder: protectedProcedure
    .input(z.object({
      vehicleId: z.number(),
      vehicleUnit: z.string(),
      type: workOrderTypeSchema,
      priority: workOrderPrioritySchema,
      title: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
      assignedVendorId: z.number().optional(),
      estimatedCost: z.number().optional(),
      scheduledDate: z.string().optional(),
      relatedPmId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.user as any)?.id || 0;
      const woId = `WO-${Date.now().toString(36).toUpperCase()}`;
      logger.info(`[FleetMaintenance] Work order ${woId} created by user ${userId} for ${input.vehicleUnit}`);
      return {
        id: woId,
        ...input,
        status: "open" as const,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parts: [],
        laborHours: 0,
        actualCost: 0,
      };
    }),

  getWorkOrders: protectedProcedure
    .input(z.object({
      status: workOrderStatusSchema.optional(),
      priority: workOrderPrioritySchema.optional(),
      vehicleId: z.number().optional(),
      type: workOrderTypeSchema.optional(),
    }).merge(paginationInput))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const seed = ((ctx.user as any)?.companyId || 1) * 41;

      const statuses: Array<"open" | "in_progress" | "awaiting_parts" | "completed" | "cancelled"> = [
        "open", "in_progress", "awaiting_parts", "completed", "open", "in_progress", "completed",
        "open", "completed", "in_progress", "awaiting_parts", "completed", "completed", "open", "in_progress",
      ];

      const priorities: Array<"critical" | "high" | "medium" | "low"> = [
        "medium", "high", "low", "medium", "critical", "low", "medium",
        "high", "medium", "low", "medium", "high", "low", "critical", "medium",
      ];

      const types: Array<"preventive" | "corrective" | "emergency" | "inspection" | "recall" | "warranty"> = [
        "preventive", "corrective", "preventive", "inspection", "emergency", "preventive",
        "warranty", "corrective", "recall", "preventive", "corrective", "preventive",
        "inspection", "preventive", "corrective",
      ];

      const titles = [
        "Oil & Filter Change - PM Schedule", "Replace front brake pads", "DPF cleaning required",
        "Annual DOT inspection", "Emergency coolant leak repair", "Tire rotation & balance",
        "Turbo warranty replacement", "A/C compressor not engaging", "NHTSA recall - steering",
        "Transmission fluid service", "EGR valve replacement", "30K mile PM service",
        "Pre-trip inspection items", "Wheel bearing repack", "Alternator replacement",
      ];

      const workOrders = Array.from({ length: 15 }, (_, i) => {
        const s = seed + i * 13;
        const status = statuses[i];
        const createdAt = new Date(now.getTime() - Math.round(seededRandom(s) * 30 * 86400000));
        const updatedAt = new Date(createdAt.getTime() + Math.round(seededRandom(s + 1) * 7 * 86400000));
        const vendor = VENDORS[Math.floor(seededRandom(s + 2) * VENDORS.length)];
        const estimatedCost = Math.round(seededRandom(s + 3) * 2000 + 200);
        const actualCost = status === "completed" ? Math.round(estimatedCost * (0.8 + seededRandom(s + 4) * 0.4)) : 0;
        const laborHours = status === "completed" ? Math.round(seededRandom(s + 5) * 16 + 1) : 0;

        return {
          id: `WO-${(1000 + i).toString()}`,
          vehicleId: (i % VEHICLE_UNITS.length) + 1,
          vehicleUnit: VEHICLE_UNITS[i % VEHICLE_UNITS.length],
          type: types[i],
          priority: priorities[i],
          status,
          title: titles[i],
          description: `Work order for ${titles[i].toLowerCase()} on unit ${VEHICLE_UNITS[i % VEHICLE_UNITS.length]}.`,
          assignedVendorId: vendor.id,
          assignedVendorName: vendor.name,
          estimatedCost,
          actualCost,
          laborHours,
          scheduledDate: new Date(createdAt.getTime() + 3 * 86400000).toISOString(),
          completedDate: status === "completed" ? updatedAt.toISOString() : null,
          createdBy: (ctx.user as any)?.id || 0,
          createdAt: createdAt.toISOString(),
          updatedAt: updatedAt.toISOString(),
          partsUsed: status === "completed" ? Math.floor(seededRandom(s + 6) * 4) + 1 : 0,
        };
      });

      let filtered = workOrders;
      if (input.status) filtered = filtered.filter(wo => wo.status === input.status);
      if (input.priority) filtered = filtered.filter(wo => wo.priority === input.priority);
      if (input.vehicleId) filtered = filtered.filter(wo => wo.vehicleId === input.vehicleId);
      if (input.type) filtered = filtered.filter(wo => wo.type === input.type);

      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const start = (input.page - 1) * input.limit;
      return {
        items: filtered.slice(start, start + input.limit),
        total: filtered.length,
        page: input.page,
        totalPages: Math.ceil(filtered.length / input.limit),
      };
    }),

  updateWorkOrder: protectedProcedure
    .input(z.object({
      workOrderId: z.string(),
      status: workOrderStatusSchema.optional(),
      actualCost: z.number().optional(),
      laborHours: z.number().optional(),
      notes: z.string().max(2000).optional(),
      partsUsed: z.array(z.object({
        partNumber: z.string(),
        quantity: z.number(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      logger.info(`[FleetMaintenance] Work order ${input.workOrderId} updated by user ${(ctx.user as any)?.id}`);
      return {
        id: input.workOrderId,
        status: input.status || "in_progress",
        actualCost: input.actualCost || 0,
        laborHours: input.laborHours || 0,
        notes: input.notes || "",
        updatedAt: new Date().toISOString(),
        updatedBy: (ctx.user as any)?.id || 0,
        success: true,
      };
    }),

  // =========================================================================
  // REPAIR HISTORY
  // =========================================================================

  getRepairHistory: protectedProcedure
    .input(z.object({
      vehicleId: z.number(),
    }).merge(paginationInput))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const seed = input.vehicleId * 67;
      const unit = VEHICLE_UNITS[input.vehicleId % VEHICLE_UNITS.length] || "TRK-UNKNOWN";

      const repairs = Array.from({ length: 20 }, (_, i) => {
        const s = seed + i * 11;
        const completedAt = new Date(now.getTime() - i * 30 * 86400000 - Math.round(seededRandom(s) * 15 * 86400000));
        const vendor = VENDORS[Math.floor(seededRandom(s + 1) * VENDORS.length)];
        const laborHrs = Math.round(seededRandom(s + 2) * 12 + 1);
        const partsCost = Math.round(seededRandom(s + 3) * 800 + 50);
        const laborCost = laborHrs * 125;
        const categories = ["Engine", "Brakes", "Tires", "Electrical", "Suspension", "Exhaust", "Cooling", "Transmission"];
        const category = categories[Math.floor(seededRandom(s + 4) * categories.length)];

        return {
          id: seededId("rpr", s),
          workOrderId: `WO-${2000 + i}`,
          vehicleId: input.vehicleId,
          vehicleUnit: unit,
          category,
          description: `${category} repair — ${["replaced worn component", "adjusted and calibrated", "diagnosed and fixed fault", "preventive replacement", "emergency roadside repair"][Math.floor(seededRandom(s + 5) * 5)]}`,
          vendorName: vendor.name,
          laborHours: laborHrs,
          partsCost,
          laborCost,
          totalCost: partsCost + laborCost,
          mileageAtService: Math.round(seededRandom(s + 6) * 200000 + 50000),
          completedAt: completedAt.toISOString(),
        };
      });

      const start = (input.page - 1) * input.limit;
      return {
        items: repairs.slice(start, start + input.limit),
        total: repairs.length,
        page: input.page,
        totalPages: Math.ceil(repairs.length / input.limit),
        summary: {
          totalRepairs: repairs.length,
          totalCost: repairs.reduce((sum, r) => sum + r.totalCost, 0),
          avgCostPerRepair: Math.round(repairs.reduce((sum, r) => sum + r.totalCost, 0) / repairs.length),
          topCategory: "Brakes",
        },
      };
    }),

  // =========================================================================
  // PARTS INVENTORY
  // =========================================================================

  getPartsInventory: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
      lowStock: z.boolean().optional().default(false),
      search: z.string().optional(),
    }).merge(paginationInput))
    .query(async ({ ctx, input }) => {
      let parts = PART_CATALOG.map((p, i) => ({
        ...p,
        id: i + 1,
        totalValue: Math.round(p.unitCost * p.qtyOnHand * 100) / 100,
        isLowStock: p.qtyOnHand <= p.reorderPoint,
        lastOrderDate: new Date(Date.now() - (i + 1) * 15 * 86400000).toISOString(),
        avgMonthlyUsage: Math.round(p.reorderQty / 2),
      }));

      if (input.category) parts = parts.filter(p => p.category === input.category);
      if (input.lowStock) parts = parts.filter(p => p.isLowStock);
      if (input.search) {
        const q = input.search.toLowerCase();
        parts = parts.filter(p => p.name.toLowerCase().includes(q) || p.partNumber.toLowerCase().includes(q));
      }

      const totalInventoryValue = parts.reduce((sum, p) => sum + p.totalValue, 0);
      const lowStockCount = parts.filter(p => p.isLowStock).length;

      const start = (input.page - 1) * input.limit;
      return {
        items: parts.slice(start, start + input.limit),
        total: parts.length,
        page: input.page,
        totalPages: Math.ceil(parts.length / input.limit),
        totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
        lowStockCount,
        categories: Array.from(new Set(PART_CATALOG.map(p => p.category))),
      };
    }),

  orderPart: protectedProcedure
    .input(z.object({
      partNumber: z.string(),
      quantity: z.number().min(1),
      vendorId: z.number().optional(),
      urgency: z.enum(["standard", "expedited", "emergency"]).optional().default("standard"),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const part = PART_CATALOG.find(p => p.partNumber === input.partNumber);
      const poId = `PO-${Date.now().toString(36).toUpperCase()}`;
      logger.info(`[FleetMaintenance] Purchase order ${poId} created for ${input.quantity}x ${input.partNumber}`);
      return {
        purchaseOrderId: poId,
        partNumber: input.partNumber,
        partName: part?.name || input.partNumber,
        quantity: input.quantity,
        unitCost: part?.unitCost || 0,
        totalCost: (part?.unitCost || 0) * input.quantity,
        urgency: input.urgency,
        estimatedDelivery: new Date(Date.now() + (input.urgency === "emergency" ? 1 : input.urgency === "expedited" ? 3 : 7) * 86400000).toISOString(),
        status: "ordered" as const,
        createdAt: new Date().toISOString(),
        createdBy: (ctx.user as any)?.id || 0,
      };
    }),

  // =========================================================================
  // WARRANTY MANAGEMENT
  // =========================================================================

  getWarrantyTracker: protectedProcedure
    .input(z.object({
      vehicleId: z.number().optional(),
      expiringWithinDays: z.number().optional(),
    }).merge(paginationInput))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const seed = ((ctx.user as any)?.companyId || 1) * 29;

      const warranties = VEHICLE_UNITS.flatMap((unit, vi) => {
        const components = [
          { component: "Engine", provider: "Detroit Diesel / Daimler", durationMonths: 60, mileageLimit: 500000 },
          { component: "Transmission", provider: "Eaton Fuller", durationMonths: 48, mileageLimit: 400000 },
          { component: "Aftertreatment (DPF/SCR)", provider: "Detroit Diesel", durationMonths: 60, mileageLimit: 350000 },
          { component: "Turbocharger", provider: "BorgWarner", durationMonths: 36, mileageLimit: 300000 },
          { component: "Starter Motor", provider: "Delco Remy", durationMonths: 24, mileageLimit: 200000 },
        ];
        return components.map((c, ci) => {
          const s = seed + vi * 37 + ci * 11;
          const purchaseDate = new Date(now.getTime() - Math.round(seededRandom(s) * c.durationMonths * 0.8 * 30 * 86400000));
          const expiryDate = new Date(purchaseDate.getTime() + c.durationMonths * 30 * 86400000);
          const daysRemaining = Math.round((expiryDate.getTime() - now.getTime()) / 86400000);
          const currentMiles = Math.round(seededRandom(s + 1) * c.mileageLimit * 0.7);
          const milesRemaining = c.mileageLimit - currentMiles;

          return {
            id: seededId("wrty", s),
            vehicleId: vi + 1,
            vehicleUnit: unit,
            component: c.component,
            provider: c.provider,
            purchaseDate: purchaseDate.toISOString(),
            expiryDate: expiryDate.toISOString(),
            daysRemaining: Math.max(0, daysRemaining),
            mileageLimit: c.mileageLimit,
            currentMiles,
            milesRemaining: Math.max(0, milesRemaining),
            status: daysRemaining <= 0 || milesRemaining <= 0 ? "expired" as const
              : daysRemaining <= 90 || milesRemaining <= 25000 ? "expiring_soon" as const
              : "active" as const,
            claimsCount: Math.floor(seededRandom(s + 2) * 2),
          };
        });
      });

      let filtered = warranties;
      if (input.vehicleId) filtered = filtered.filter(w => w.vehicleId === input.vehicleId);
      if (input.expiringWithinDays) {
        filtered = filtered.filter(w => w.status !== "expired" && w.daysRemaining <= input.expiringWithinDays!);
      }

      filtered.sort((a, b) => a.daysRemaining - b.daysRemaining);

      const start = (input.page - 1) * input.limit;
      return {
        items: filtered.slice(start, start + input.limit),
        total: filtered.length,
        page: input.page,
        totalPages: Math.ceil(filtered.length / input.limit),
        summary: {
          totalActive: filtered.filter(w => w.status === "active").length,
          expiringSoon: filtered.filter(w => w.status === "expiring_soon").length,
          expired: filtered.filter(w => w.status === "expired").length,
        },
      };
    }),

  submitWarrantyClaim: protectedProcedure
    .input(z.object({
      warrantyId: z.string(),
      vehicleId: z.number(),
      component: z.string(),
      issueDescription: z.string().min(10).max(2000),
      mileageAtFailure: z.number(),
      failureDate: z.string(),
      estimatedRepairCost: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const claimId = `WC-${Date.now().toString(36).toUpperCase()}`;
      logger.info(`[FleetMaintenance] Warranty claim ${claimId} submitted for warranty ${input.warrantyId}`);
      return {
        claimId,
        warrantyId: input.warrantyId,
        status: "submitted" as const,
        estimatedResolutionDays: 14,
        createdAt: new Date().toISOString(),
        submittedBy: (ctx.user as any)?.id || 0,
      };
    }),

  // =========================================================================
  // TIRE MANAGEMENT
  // =========================================================================

  getTireManagement: protectedProcedure
    .input(z.object({
      vehicleId: z.number().optional(),
    }).merge(paginationInput))
    .query(async ({ ctx, input }) => {
      const seed = ((ctx.user as any)?.companyId || 1) * 43;
      const now = new Date();
      const positions = Object.values(tirePositionSchema.enum);

      const tires: Array<{
        id: string;
        vehicleId: number;
        vehicleUnit: string;
        position: string;
        brand: string;
        model: string;
        size: string;
        dotCode: string;
        installedDate: string;
        installedMileage: number;
        currentMileage: number;
        treadDepth32nds: number;
        treadDepthStatus: "good" | "monitor" | "replace_soon" | "critical";
        pressure: number;
        pressureStatus: "ok" | "low" | "high";
        nextRotationMiles: number;
        nextRotationDate: string;
        costPerMile: number;
      }> = [];

      const vehicles = input.vehicleId
        ? [{ id: input.vehicleId, unit: VEHICLE_UNITS[input.vehicleId % VEHICLE_UNITS.length] || "TRK-UNKNOWN" }]
        : VEHICLE_UNITS.filter(u => u.startsWith("TRK")).map((u, i) => ({ id: i + 1, unit: u }));

      for (const vehicle of vehicles) {
        for (let pi = 0; pi < Math.min(positions.length, 6); pi++) {
          const s = seed + vehicle.id * 71 + pi * 13;
          const treadDepth = Math.round(seededRandom(s) * 24 + 2);
          const pressure = Math.round(seededRandom(s + 1) * 20 + 95);
          const installedMiles = Math.round(seededRandom(s + 2) * 50000);
          const currentMiles = installedMiles + Math.round(seededRandom(s + 3) * 60000);
          const milesOnTire = currentMiles - installedMiles;
          const brands = ["Michelin", "Goodyear", "Bridgestone", "Continental", "Yokohama"];

          tires.push({
            id: seededId("tire", s),
            vehicleId: vehicle.id,
            vehicleUnit: vehicle.unit,
            position: positions[pi],
            brand: brands[Math.floor(seededRandom(s + 4) * brands.length)],
            model: pi < 2 ? "X Line Energy Z" : "Fuelmax D",
            size: pi < 2 ? "11R22.5" : "295/75R22.5",
            dotCode: `DOT${Math.round(seededRandom(s + 5) * 9999).toString().padStart(4, "0")}`,
            installedDate: new Date(now.getTime() - Math.round(seededRandom(s + 6) * 365 * 86400000)).toISOString(),
            installedMileage: installedMiles,
            currentMileage: currentMiles,
            treadDepth32nds: treadDepth,
            treadDepthStatus: treadDepth <= 4 ? "critical" : treadDepth <= 6 ? "replace_soon" : treadDepth <= 10 ? "monitor" : "good",
            pressure,
            pressureStatus: pressure < 100 ? "low" : pressure > 115 ? "high" : "ok",
            nextRotationMiles: currentMiles + 20000 - (milesOnTire % 20000),
            nextRotationDate: new Date(now.getTime() + Math.round((20000 - (milesOnTire % 20000)) / 500) * 86400000).toISOString(),
            costPerMile: Math.round((pi < 2 ? 520 : 485) / Math.max(milesOnTire, 1) * 10000) / 10000,
          });
        }
      }

      const start = (input.page - 1) * input.limit;
      return {
        items: tires.slice(start, start + input.limit),
        total: tires.length,
        page: input.page,
        totalPages: Math.ceil(tires.length / input.limit),
        summary: {
          totalTires: tires.length,
          criticalTread: tires.filter(t => t.treadDepthStatus === "critical").length,
          replaceSoon: tires.filter(t => t.treadDepthStatus === "replace_soon").length,
          lowPressure: tires.filter(t => t.pressureStatus === "low").length,
          avgTreadDepth: Math.round(tires.reduce((sum, t) => sum + t.treadDepth32nds, 0) / tires.length * 10) / 10,
        },
      };
    }),

  logTireEvent: protectedProcedure
    .input(z.object({
      vehicleId: z.number(),
      tireId: z.string(),
      position: tirePositionSchema,
      eventType: tireEventTypeSchema,
      treadDepth32nds: z.number().optional(),
      pressure: z.number().optional(),
      notes: z.string().max(500).optional(),
      mileage: z.number(),
      newTireBrand: z.string().optional(),
      newTireModel: z.string().optional(),
      cost: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const eventId = `TE-${Date.now().toString(36).toUpperCase()}`;
      logger.info(`[FleetMaintenance] Tire event ${eventId}: ${input.eventType} on vehicle ${input.vehicleId} position ${input.position}`);
      return {
        eventId,
        ...input,
        createdAt: new Date().toISOString(),
        createdBy: (ctx.user as any)?.id || 0,
        success: true,
      };
    }),

  // =========================================================================
  // VEHICLE LIFECYCLE
  // =========================================================================

  getVehicleLifecycle: protectedProcedure
    .input(z.object({
      vehicleId: z.number().optional(),
    }).merge(paginationInput))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const seed = ((ctx.user as any)?.companyId || 1) * 59;

      const vehicles = (input.vehicleId
        ? [{ id: input.vehicleId, unit: VEHICLE_UNITS[input.vehicleId % VEHICLE_UNITS.length] || "TRK-UNKNOWN" }]
        : VEHICLE_UNITS.map((u, i) => ({ id: i + 1, unit: u }))
      ).map((v, i) => {
        const s = seed + v.id * 23;
        const isTruck = v.unit.startsWith("TRK");
        const acquisitionCost = isTruck ? Math.round(seededRandom(s) * 50000 + 120000) : Math.round(seededRandom(s) * 20000 + 35000);
        const yearAcquired = 2018 + Math.floor(seededRandom(s + 1) * 6);
        const acquisitionDate = new Date(yearAcquired, Math.floor(seededRandom(s + 2) * 12), 1);
        const ageYears = (now.getTime() - acquisitionDate.getTime()) / (365.25 * 86400000);
        const depreciationRate = isTruck ? 0.12 : 0.10;
        const currentValue = Math.round(acquisitionCost * Math.pow(1 - depreciationRate, ageYears));
        const totalMaintenanceCost = Math.round(seededRandom(s + 3) * 30000 + 5000);
        const currentMiles = Math.round(seededRandom(s + 4) * 300000 + 50000);
        const annualMiles = Math.round(currentMiles / Math.max(ageYears, 0.5));
        const tco = acquisitionCost + totalMaintenanceCost;
        const costPerMile = Math.round(tco / Math.max(currentMiles, 1) * 100) / 100;
        const makes = isTruck ? ["Freightliner", "Kenworth", "Peterbilt", "Volvo", "Mack"] : ["Wabash", "Great Dane", "Utility", "Hyundai", "Stoughton"];
        const models = isTruck ? ["Cascadia", "T680", "579", "VNL 860", "Anthem"] : ["DuraPlate", "Champion CL", "4000D-X", "Translead", "Z-Plate"];

        return {
          id: v.id,
          unit: v.unit,
          type: isTruck ? "tractor" as const : "trailer" as const,
          make: makes[Math.floor(seededRandom(s + 5) * makes.length)],
          model: models[Math.floor(seededRandom(s + 6) * models.length)],
          year: yearAcquired,
          vin: `1FUJGLDR${Math.round(seededRandom(s + 7) * 999999999).toString().padStart(9, "0")}`,
          acquisitionDate: acquisitionDate.toISOString(),
          acquisitionCost,
          currentValue,
          depreciationRate,
          totalDepreciation: acquisitionCost - currentValue,
          totalMaintenanceCost,
          tco,
          costPerMile,
          currentMiles,
          annualMiles,
          ageYears: Math.round(ageYears * 10) / 10,
          lifecyclePhase: ageYears < 2 ? "new" as const : ageYears < 5 ? "prime" as const : ageYears < 8 ? "mature" as const : "end_of_life" as const,
          estimatedRemainingLife: Math.max(0, Math.round((10 - ageYears) * 10) / 10),
          status: "active" as const,
        };
      });

      const start = (input.page - 1) * input.limit;
      return {
        items: vehicles.slice(start, start + input.limit),
        total: vehicles.length,
        page: input.page,
        totalPages: Math.ceil(vehicles.length / input.limit),
        fleetSummary: {
          totalAssetValue: vehicles.reduce((sum, v) => sum + v.currentValue, 0),
          totalAcquisitionCost: vehicles.reduce((sum, v) => sum + v.acquisitionCost, 0),
          avgAge: Math.round(vehicles.reduce((sum, v) => sum + v.ageYears, 0) / vehicles.length * 10) / 10,
          avgCostPerMile: Math.round(vehicles.reduce((sum, v) => sum + v.costPerMile, 0) / vehicles.length * 100) / 100,
          endOfLifeCount: vehicles.filter(v => v.lifecyclePhase === "end_of_life").length,
        },
      };
    }),

  getVehicleValuation: protectedProcedure
    .input(z.object({ vehicleId: z.number() }))
    .query(async ({ ctx, input }) => {
      const seed = input.vehicleId * 83;
      const acquisitionCost = Math.round(seededRandom(seed) * 50000 + 120000);
      const yearAcquired = 2018 + Math.floor(seededRandom(seed + 1) * 6);
      const depRate = 0.12;
      const now = new Date();
      const ageYears = now.getFullYear() - yearAcquired + (now.getMonth() / 12);

      const schedule = Array.from({ length: 10 }, (_, yr) => ({
        year: yearAcquired + yr,
        bookValue: Math.round(acquisitionCost * Math.pow(1 - depRate, yr)),
        depreciation: Math.round(acquisitionCost * Math.pow(1 - depRate, yr) * depRate),
        cumulativeDepreciation: Math.round(acquisitionCost * (1 - Math.pow(1 - depRate, yr + 1))),
      }));

      return {
        vehicleId: input.vehicleId,
        vehicleUnit: VEHICLE_UNITS[input.vehicleId % VEHICLE_UNITS.length] || "TRK-UNKNOWN",
        acquisitionCost,
        currentBookValue: Math.round(acquisitionCost * Math.pow(1 - depRate, ageYears)),
        estimatedFairMarketValue: Math.round(acquisitionCost * Math.pow(1 - depRate, ageYears) * (0.9 + seededRandom(seed + 2) * 0.3)),
        totalDepreciation: Math.round(acquisitionCost * (1 - Math.pow(1 - depRate, ageYears))),
        depreciationMethod: "declining_balance" as const,
        annualDepreciationRate: depRate,
        depreciationSchedule: schedule,
        salvageValue: Math.round(acquisitionCost * 0.08),
      };
    }),

  // =========================================================================
  // DOT INSPECTION PREP
  // =========================================================================

  getDotInspectionPrep: protectedProcedure
    .input(z.object({ vehicleId: z.number() }))
    .query(async ({ ctx, input }) => {
      const seed = input.vehicleId * 97;
      const unit = VEHICLE_UNITS[input.vehicleId % VEHICLE_UNITS.length] || "TRK-UNKNOWN";

      const checklist = DOT_CHECKLIST_ITEMS.map((item, i) => {
        const s = seed + i * 7;
        const r = seededRandom(s);
        const status = r > 0.85 ? "fail" as const : r > 0.7 ? "needs_attention" as const : "pass" as const;
        const lastChecked = new Date(Date.now() - Math.round(seededRandom(s + 1) * 30 * 86400000));

        return {
          id: i + 1,
          category: item.category,
          item: item.item,
          critical: item.critical,
          status,
          lastCheckedDate: lastChecked.toISOString(),
          notes: status === "fail" ? "Requires immediate attention before inspection" : status === "needs_attention" ? "Monitor closely — borderline pass" : "",
        };
      });

      const passCount = checklist.filter(c => c.status === "pass").length;
      const failCount = checklist.filter(c => c.status === "fail").length;
      const attentionCount = checklist.filter(c => c.status === "needs_attention").length;
      const criticalFails = checklist.filter(c => c.status === "fail" && c.critical).length;
      const readinessScore = Math.round((passCount / checklist.length) * 100);
      const prediction = criticalFails > 0 ? "fail" as const : readinessScore >= 90 ? "pass" as const : "at_risk" as const;

      return {
        vehicleId: input.vehicleId,
        vehicleUnit: unit,
        checklist,
        summary: {
          totalItems: checklist.length,
          pass: passCount,
          fail: failCount,
          needsAttention: attentionCount,
          criticalFails,
          readinessScore,
          prediction,
          estimatedPrepTime: failCount * 2 + attentionCount * 0.5,
          estimatedPrepCost: failCount * 350 + attentionCount * 100,
        },
        lastAnnualInspection: new Date(Date.now() - Math.round(seededRandom(seed + 100) * 300 * 86400000)).toISOString(),
        nextInspectionDue: new Date(Date.now() + Math.round(seededRandom(seed + 101) * 90 * 86400000)).toISOString(),
        byCategory: Array.from(new Set(DOT_CHECKLIST_ITEMS.map(i => i.category))).map(cat => {
          const items = checklist.filter(c => c.category === cat);
          return {
            category: cat,
            total: items.length,
            pass: items.filter(i => i.status === "pass").length,
            fail: items.filter(i => i.status === "fail").length,
            needsAttention: items.filter(i => i.status === "needs_attention").length,
          };
        }),
      };
    }),

  getInspectionHistory: protectedProcedure
    .input(z.object({
      vehicleId: z.number().optional(),
    }).merge(paginationInput))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const seed = ((ctx.user as any)?.companyId || 1) * 103;

      const inspections = Array.from({ length: 30 }, (_, i) => {
        const s = seed + i * 19;
        const vid = input.vehicleId || (i % VEHICLE_UNITS.length) + 1;
        const unit = VEHICLE_UNITS[(vid - 1) % VEHICLE_UNITS.length];
        const date = new Date(now.getTime() - i * 45 * 86400000);
        const violations = Math.floor(seededRandom(s) * 4);
        const types = ["annual", "roadside", "random", "post_accident"];
        const inspType = types[Math.floor(seededRandom(s + 1) * types.length)];

        return {
          id: seededId("insp", s),
          vehicleId: vid,
          vehicleUnit: unit,
          type: inspType,
          date: date.toISOString(),
          result: violations === 0 ? "pass" as const : violations <= 2 ? "pass_with_defects" as const : "fail" as const,
          violationCount: violations,
          violations: Array.from({ length: violations }, (_, vi) => ({
            code: `${393 + Math.floor(seededRandom(s + vi * 3) * 10)}.${Math.floor(seededRandom(s + vi * 3 + 1) * 99)}`,
            description: ["Brake out of adjustment", "Tire tread depth below minimum", "Inoperative tail light", "Expired fire extinguisher"][vi % 4],
            severity: vi === 0 ? "critical" : "major",
            oos: vi === 0 && violations > 2,
          })),
          inspector: `Officer ${String.fromCharCode(65 + Math.floor(seededRandom(s + 2) * 26))}. ${["Smith", "Johnson", "Williams", "Brown"][Math.floor(seededRandom(s + 3) * 4)]}`,
          location: ["I-95 Weigh Station, VA", "I-40 Inspection Station, TN", "Port of Entry, TX", "I-80 Scale, NE"][Math.floor(seededRandom(s + 4) * 4)],
        };
      });

      let filtered = inspections;
      if (input.vehicleId) filtered = filtered.filter(i => i.vehicleId === input.vehicleId);

      const start = (input.page - 1) * input.limit;
      return {
        items: filtered.slice(start, start + input.limit),
        total: filtered.length,
        page: input.page,
        totalPages: Math.ceil(filtered.length / input.limit),
        trends: {
          totalInspections: filtered.length,
          passRate: Math.round(filtered.filter(i => i.result === "pass").length / filtered.length * 100),
          avgViolations: Math.round(filtered.reduce((sum, i) => sum + i.violationCount, 0) / filtered.length * 10) / 10,
          oosRate: Math.round(filtered.filter(i => i.violations.some(v => v.oos)).length / filtered.length * 100),
        },
      };
    }),

  // =========================================================================
  // FUEL EFFICIENCY
  // =========================================================================

  getFuelEfficiency: protectedProcedure
    .input(z.object({
      vehicleId: z.number().optional(),
      periodDays: z.number().optional().default(90),
    }))
    .query(async ({ ctx, input }) => {
      const seed = ((ctx.user as any)?.companyId || 1) * 107;

      const vehicles = (input.vehicleId
        ? [{ id: input.vehicleId, unit: VEHICLE_UNITS[input.vehicleId % VEHICLE_UNITS.length] || "TRK-UNKNOWN" }]
        : VEHICLE_UNITS.filter(u => u.startsWith("TRK")).map((u, i) => ({ id: i + 1, unit: u }))
      ).map((v, i) => {
        const s = seed + v.id * 31;
        const mpg = Math.round((5.5 + seededRandom(s) * 2.5) * 100) / 100;
        const benchmark = 6.5;
        const totalGallons = Math.round(seededRandom(s + 1) * 2000 + 500);
        const totalMiles = Math.round(totalGallons * mpg);
        const avgFuelCost = Math.round((3.5 + seededRandom(s + 2) * 0.8) * 100) / 100;
        const costPerMile = Math.round(avgFuelCost / mpg * 100) / 100;
        const idlePercent = Math.round(seededRandom(s + 3) * 25 + 5);

        return {
          vehicleId: v.id,
          vehicleUnit: v.unit,
          avgMpg: mpg,
          benchmarkMpg: benchmark,
          mpgVariance: Math.round((mpg - benchmark) * 100) / 100,
          mpgVariancePct: Math.round((mpg - benchmark) / benchmark * 100),
          totalMiles,
          totalGallons,
          totalFuelCost: Math.round(totalGallons * avgFuelCost),
          avgCostPerGallon: avgFuelCost,
          costPerMile,
          idlePercent,
          idleFuelWaste: Math.round(totalGallons * (idlePercent / 100) * 0.8),
          trend: seededRandom(s + 4) > 0.5 ? "improving" as const : "declining" as const,
          weeklyMpg: Array.from({ length: 12 }, (_, w) => ({
            week: `W${w + 1}`,
            mpg: Math.round((mpg + (seededRandom(s + w * 5) - 0.5) * 1.5) * 100) / 100,
          })),
        };
      });

      return {
        vehicles,
        fleetAvgMpg: Math.round(vehicles.reduce((sum, v) => sum + v.avgMpg, 0) / vehicles.length * 100) / 100,
        fleetBenchmark: 6.5,
        totalFuelCost: vehicles.reduce((sum, v) => sum + v.totalFuelCost, 0),
        totalIdleWaste: vehicles.reduce((sum, v) => sum + v.idleFuelWaste, 0),
        bestPerformer: vehicles.reduce((best, v) => v.avgMpg > best.avgMpg ? v : best, vehicles[0])?.vehicleUnit,
        worstPerformer: vehicles.reduce((worst, v) => v.avgMpg < worst.avgMpg ? v : worst, vehicles[0])?.vehicleUnit,
      };
    }),

  // =========================================================================
  // COST ANALYSIS
  // =========================================================================

  getMaintenanceCostAnalysis: protectedProcedure
    .input(z.object({
      periodMonths: z.number().optional().default(12),
      vehicleId: z.number().optional(),
      groupBy: z.enum(["vehicle", "category", "vendor", "month"]).optional().default("category"),
    }))
    .query(async ({ ctx, input }) => {
      const seed = ((ctx.user as any)?.companyId || 1) * 113;
      const now = new Date();

      const categories = ["Engine", "Brakes", "Tires", "Electrical", "Suspension", "Exhaust", "Cooling", "Transmission", "PM Services", "DOT Inspections"];

      const monthlyData = Array.from({ length: input.periodMonths }, (_, m) => {
        const month = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const s = seed + m * 17;
        const total = Math.round(seededRandom(s) * 15000 + 5000);

        return {
          month: month.toISOString().slice(0, 7),
          label: month.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
          total,
          labor: Math.round(total * 0.4),
          parts: Math.round(total * 0.45),
          outsourced: Math.round(total * 0.15),
          workOrderCount: Math.floor(seededRandom(s + 1) * 8 + 2),
        };
      }).reverse();

      const byCategoryData = categories.map((cat, i) => {
        const s = seed + i * 29;
        const amount = Math.round(seededRandom(s) * 8000 + 1000);
        return {
          category: cat,
          amount,
          percentage: 0,
          workOrderCount: Math.floor(seededRandom(s + 1) * 10 + 1),
          avgCostPerWo: 0,
        };
      });

      const catTotal = byCategoryData.reduce((sum, c) => sum + c.amount, 0);
      byCategoryData.forEach(c => {
        c.percentage = Math.round(c.amount / catTotal * 100);
        c.avgCostPerWo = Math.round(c.amount / c.workOrderCount);
      });
      byCategoryData.sort((a, b) => b.amount - a.amount);

      const byVehicleData = VEHICLE_UNITS.map((unit, i) => {
        const s = seed + i * 37;
        const amount = Math.round(seededRandom(s) * 6000 + 1000);
        return { vehicleUnit: unit, vehicleId: i + 1, amount, costPerMile: Math.round(seededRandom(s + 1) * 0.05 * 100 + 5) / 100 };
      });
      byVehicleData.sort((a, b) => b.amount - a.amount);

      const totalCost = monthlyData.reduce((sum, m) => sum + m.total, 0);
      const avgMonthly = Math.round(totalCost / input.periodMonths);

      return {
        totalCost,
        avgMonthlyCost: avgMonthly,
        costPerVehicle: Math.round(totalCost / VEHICLE_UNITS.length),
        monthlyTrend: monthlyData,
        byCategory: byCategoryData,
        byVehicle: byVehicleData,
        topExpense: byCategoryData[0],
        mostExpensiveVehicle: byVehicleData[0],
      };
    }),

  // =========================================================================
  // VENDOR MANAGEMENT
  // =========================================================================

  getVendorManagement: protectedProcedure.query(async ({ ctx }) => {
    const seed = ((ctx.user as any)?.companyId || 1) * 127;

    return {
      vendors: VENDORS.map((v, i) => {
        const s = seed + i * 19;
        const jobsCompleted = Math.floor(seededRandom(s) * 50 + 10);
        const avgTurnaround = Math.round(seededRandom(s + 1) * 36 + 4);
        const totalSpend = Math.round(seededRandom(s + 2) * 50000 + 10000);

        return {
          ...v,
          phone: `(555) ${100 + i * 11}-${1000 + i * 111}`,
          email: `service@${v.name.toLowerCase().replace(/[^a-z]/g, "")}.com`,
          address: `${1000 + i * 100} Industrial Blvd, Suite ${i + 1}`,
          jobsCompleted,
          avgTurnaroundHours: avgTurnaround,
          totalSpend,
          avgJobCost: Math.round(totalSpend / jobsCompleted),
          warrantyRate: Math.round(seededRandom(s + 3) * 5 + 95),
          isPreferred: v.rating >= 4.5,
          lastUsed: new Date(Date.now() - Math.round(seededRandom(s + 4) * 30 * 86400000)).toISOString(),
          certifications: ["ASE Certified", "DOT Authorized", i % 2 === 0 ? "OEM Certified" : "Fleet Specialist"].filter(Boolean),
        };
      }),
    };
  }),

  // =========================================================================
  // RECALL ALERTS
  // =========================================================================

  getRecallAlerts: protectedProcedure.query(async ({ ctx }) => {
    const seed = ((ctx.user as any)?.companyId || 1) * 131;
    const now = new Date();

    const recalls = [
      {
        id: "NHTSA-24V-089",
        manufacturer: "Freightliner",
        campaign: "Steering Column Lock — may disengage unexpectedly",
        severity: "critical" as const,
        affectedModels: ["Cascadia 2021-2023"],
        nhtsa: "24V-089",
        issuedDate: new Date(now.getTime() - 45 * 86400000).toISOString(),
        deadline: new Date(now.getTime() + 45 * 86400000).toISOString(),
      },
      {
        id: "NHTSA-24V-142",
        manufacturer: "Detroit Diesel",
        campaign: "EGR Cooler — potential coolant leak into exhaust",
        severity: "high" as const,
        affectedModels: ["DD15 Engine 2020-2022"],
        nhtsa: "24V-142",
        issuedDate: new Date(now.getTime() - 60 * 86400000).toISOString(),
        deadline: new Date(now.getTime() + 120 * 86400000).toISOString(),
      },
      {
        id: "NHTSA-23V-331",
        manufacturer: "Wabash National",
        campaign: "Trailer landing gear crank handle detachment",
        severity: "medium" as const,
        affectedModels: ["DuraPlate 2019-2021"],
        nhtsa: "23V-331",
        issuedDate: new Date(now.getTime() - 120 * 86400000).toISOString(),
        deadline: new Date(now.getTime() + 60 * 86400000).toISOString(),
      },
    ];

    return {
      alerts: recalls.map((r, i) => {
        const s = seed + i * 7;
        const affectedVehicles = VEHICLE_UNITS.filter((_, vi) => seededRandom(s + vi) > 0.7);
        const resolved = affectedVehicles.filter((_, vi) => seededRandom(s + vi + 100) > 0.6);

        return {
          ...r,
          affectedVehiclesInFleet: affectedVehicles,
          resolvedVehicles: resolved,
          unresolvedCount: affectedVehicles.length - resolved.length,
          completionPct: affectedVehicles.length > 0 ? Math.round(resolved.length / affectedVehicles.length * 100) : 100,
        };
      }),
      summary: {
        totalActive: recalls.length,
        criticalUnresolved: 1,
        vehiclesAffected: Math.floor(seededRandom(seed) * 5 + 2),
      },
    };
  }),

  // =========================================================================
  // PREDICTIVE ALERTS
  // =========================================================================

  getPredictiveAlerts: protectedProcedure
    .input(z.object({
      severity: z.enum(["critical", "high", "medium", "all"]).optional().default("all"),
      limit: z.number().optional().default(25),
    }))
    .query(async ({ ctx, input }) => {
      const seed = ((ctx.user as any)?.companyId || 1) * 137;
      const now = new Date();

      const alerts = Array.from({ length: 20 }, (_, i) => {
        const s = seed + i * 23;
        const vid = (i % VEHICLE_UNITS.length);
        const components = ["Engine oil life", "Brake pad wear", "DPF soot loading", "Coolant degradation", "Belt tension", "Battery voltage", "Tire tread wear", "Transmission fluid"];
        const component = components[i % components.length];
        const confidence = Math.round(seededRandom(s) * 30 + 70);
        const daysUntil = Math.floor(seededRandom(s + 1) * 45 - 5);
        const severity = daysUntil <= 0 ? "critical" as const : daysUntil <= 7 ? "high" as const : "medium" as const;

        return {
          id: seededId("palert", s),
          vehicleId: vid + 1,
          vehicleUnit: VEHICLE_UNITS[vid],
          component,
          severity,
          confidenceScore: confidence,
          predictedFailureDate: new Date(now.getTime() + daysUntil * 86400000).toISOString(),
          daysUntilFailure: Math.max(0, daysUntil),
          estimatedRepairCost: Math.round(seededRandom(s + 2) * 2000 + 200),
          recommendation: daysUntil <= 0
            ? `Immediate service required — ${component.toLowerCase()} failure predicted`
            : `Schedule ${component.toLowerCase()} service within ${daysUntil} days`,
          basedOn: ["Mileage pattern", "Telemetry data", "Historical failure rate", "Seasonal trend"][Math.floor(seededRandom(s + 3) * 4)],
          createdAt: now.toISOString(),
        };
      });

      let filtered = alerts;
      if (input.severity !== "all") filtered = filtered.filter(a => a.severity === input.severity);
      filtered.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2 };
        if (a.severity !== b.severity) return severityOrder[a.severity] - severityOrder[b.severity];
        return a.daysUntilFailure - b.daysUntilFailure;
      });

      return {
        alerts: filtered.slice(0, input.limit),
        total: filtered.length,
        summary: {
          critical: alerts.filter(a => a.severity === "critical").length,
          high: alerts.filter(a => a.severity === "high").length,
          medium: alerts.filter(a => a.severity === "medium").length,
          estimatedTotalCost: alerts.reduce((sum, a) => sum + a.estimatedRepairCost, 0),
        },
      };
    }),

  // =========================================================================
  // FLEET UTILIZATION
  // =========================================================================

  getFleetUtilization: protectedProcedure
    .input(z.object({ periodDays: z.number().optional().default(30) }))
    .query(async ({ ctx, input }) => {
      const seed = ((ctx.user as any)?.companyId || 1) * 149;

      const vehicles = VEHICLE_UNITS.map((unit, i) => {
        const s = seed + i * 29;
        const totalHours = input.periodDays * 24;
        const drivingHours = Math.round(seededRandom(s) * input.periodDays * 10 + input.periodDays * 2);
        const idleHours = Math.round(seededRandom(s + 1) * input.periodDays * 3);
        const maintenanceHours = Math.round(seededRandom(s + 2) * input.periodDays * 1.5);
        const downHours = totalHours - drivingHours - idleHours - maintenanceHours;
        const utilizationRate = Math.round(drivingHours / totalHours * 100);
        const milesRun = Math.round(drivingHours * (45 + seededRandom(s + 3) * 15));
        const revenue = Math.round(milesRun * (1.8 + seededRandom(s + 4) * 0.6));

        return {
          vehicleId: i + 1,
          vehicleUnit: unit,
          utilizationRate,
          drivingHours,
          idleHours,
          maintenanceHours,
          downHours: Math.max(0, downHours),
          totalMiles: milesRun,
          revenue,
          revenuePerMile: Math.round(revenue / Math.max(milesRun, 1) * 100) / 100,
          status: utilizationRate > 50 ? "high" as const : utilizationRate > 25 ? "medium" as const : "low" as const,
        };
      });

      const avgUtil = Math.round(vehicles.reduce((sum, v) => sum + v.utilizationRate, 0) / vehicles.length);

      return {
        vehicles,
        fleetAvgUtilization: avgUtil,
        totalRevenue: vehicles.reduce((sum, v) => sum + v.revenue, 0),
        totalMiles: vehicles.reduce((sum, v) => sum + v.totalMiles, 0),
        highUtilCount: vehicles.filter(v => v.status === "high").length,
        lowUtilCount: vehicles.filter(v => v.status === "low").length,
        totalIdleHours: vehicles.reduce((sum, v) => sum + v.idleHours, 0),
        totalMaintenanceHours: vehicles.reduce((sum, v) => sum + v.maintenanceHours, 0),
      };
    }),

  // =========================================================================
  // COMPLIANCE CALENDAR
  // =========================================================================

  getComplianceCalendar: protectedProcedure
    .input(z.object({
      vehicleId: z.number().optional(),
      daysAhead: z.number().optional().default(90),
    }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const seed = ((ctx.user as any)?.companyId || 1) * 157;

      const eventTypes = [
        { type: "annual_inspection", label: "DOT Annual Inspection", renewalDays: 365 },
        { type: "registration", label: "Vehicle Registration Renewal", renewalDays: 365 },
        { type: "insurance", label: "Insurance Policy Renewal", renewalDays: 365 },
        { type: "ifta_filing", label: "IFTA Quarterly Filing", renewalDays: 90 },
        { type: "2290_filing", label: "Form 2290 Heavy Vehicle Use Tax", renewalDays: 365 },
        { type: "permit_oversize", label: "Oversize/Overweight Permit", renewalDays: 365 },
        { type: "emission_test", label: "Emissions Compliance Test", renewalDays: 365 },
        { type: "fire_extinguisher", label: "Fire Extinguisher Inspection", renewalDays: 365 },
      ];

      const events: Array<{
        id: string;
        vehicleId: number;
        vehicleUnit: string;
        type: string;
        label: string;
        dueDate: string;
        daysUntilDue: number;
        status: "overdue" | "due_soon" | "upcoming" | "compliant";
        lastCompleted: string;
        estimatedCost: number;
      }> = [];

      const vehicles = input.vehicleId
        ? [{ id: input.vehicleId, unit: VEHICLE_UNITS[input.vehicleId % VEHICLE_UNITS.length] || "TRK-UNKNOWN" }]
        : VEHICLE_UNITS.map((u, i) => ({ id: i + 1, unit: u }));

      for (const vehicle of vehicles) {
        for (let ei = 0; ei < eventTypes.length; ei++) {
          const evt = eventTypes[ei];
          const s = seed + vehicle.id * 41 + ei * 13;
          const lastCompleted = new Date(now.getTime() - Math.round(seededRandom(s) * evt.renewalDays * 1.1 * 86400000));
          const dueDate = new Date(lastCompleted.getTime() + evt.renewalDays * 86400000);
          const daysUntilDue = Math.round((dueDate.getTime() - now.getTime()) / 86400000);

          if (daysUntilDue > input.daysAhead) continue;

          let status: "overdue" | "due_soon" | "upcoming" | "compliant" = "compliant";
          if (daysUntilDue <= 0) status = "overdue";
          else if (daysUntilDue <= 14) status = "due_soon";
          else if (daysUntilDue <= 30) status = "upcoming";

          events.push({
            id: seededId("comp", s),
            vehicleId: vehicle.id,
            vehicleUnit: vehicle.unit,
            type: evt.type,
            label: evt.label,
            dueDate: dueDate.toISOString(),
            daysUntilDue: Math.max(0, daysUntilDue),
            status,
            lastCompleted: lastCompleted.toISOString(),
            estimatedCost: Math.round(seededRandom(s + 1) * 500 + 50),
          });
        }
      }

      events.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

      return {
        events,
        summary: {
          total: events.length,
          overdue: events.filter(e => e.status === "overdue").length,
          dueSoon: events.filter(e => e.status === "due_soon").length,
          upcoming: events.filter(e => e.status === "upcoming").length,
        },
      };
    }),

  // =========================================================================
  // BACKWARD-COMPATIBLE PROCEDURES (used by MaintenanceAlerts.tsx, ZeunFleetDashboard.tsx)
  // =========================================================================

  getVehiclePrediction: protectedProcedure
    .input(z.object({ vehicleId: z.number() }))
    .query(async ({ input }) => {
      const seed = input.vehicleId * 97;
      const unit = VEHICLE_UNITS[input.vehicleId % VEHICLE_UNITS.length] || `TRK-${input.vehicleId}`;
      const components = ["engine", "transmission", "brakes", "suspension", "electrical"];
      const predictions = components.map((component, ci) => {
        const s = seed + ci * 19;
        const riskLevel = seededRandom(s) > 0.7 ? "critical" : seededRandom(s) > 0.5 ? "high" : seededRandom(s) > 0.3 ? "medium" : "low";
        const milesUntil = Math.round(seededRandom(s + 1) * 50000 + 1000);
        const currentMiles = Math.round(seededRandom(s + 2) * 200000 + 80000);
        return {
          component,
          riskLevel,
          confidenceScore: Math.round(seededRandom(s + 3) * 30 + 70),
          predictedFailureMileage: currentMiles + milesUntil,
          predictedFailureDate: new Date(Date.now() + Math.round(milesUntil / 500) * 86400000).toISOString(),
          lastServiceMileage: currentMiles - Math.round(seededRandom(s + 4) * 30000),
          lastServiceDate: new Date(Date.now() - Math.round(seededRandom(s + 5) * 180 * 86400000)).toISOString(),
        };
      });
      return {
        vehicleId: input.vehicleId,
        vehicleUnit: unit,
        currentMileage: Math.round(seededRandom(seed) * 200000 + 80000),
        predictions,
      };
    }),

  getFleetPredictions: protectedProcedure
    .input(z.object({
      riskFilter: z.enum(["critical", "high", "medium", "low", "all"]).optional().default("all"),
      limit: z.number().optional().default(100),
    }))
    .query(async ({ ctx, input }) => {
      const seed = ((ctx.user as any)?.companyId || 1) * 73;
      const components = ["engine", "transmission", "brakes", "suspension", "electrical"];

      const results = VEHICLE_UNITS.slice(0, 10).map((unit, vi) => {
        const vehicleId = vi + 1;
        const currentMileage = Math.round(seededRandom(seed + vi * 31) * 200000 + 80000);
        const predictions = components.map((component, ci) => {
          const s = seed + vi * 53 + ci * 11;
          const r = seededRandom(s);
          const riskLevel = r > 0.75 ? "critical" : r > 0.55 ? "high" : r > 0.3 ? "medium" : "low";
          const milesUntil = Math.round(seededRandom(s + 1) * 50000 + 1000);
          return {
            component,
            riskLevel,
            confidenceScore: Math.round(seededRandom(s + 2) * 30 + 70),
            predictedFailureMileage: currentMileage + milesUntil,
            predictedFailureDate: new Date(Date.now() + Math.round(milesUntil / 500) * 86400000).toISOString(),
            lastServiceMileage: currentMileage - Math.round(seededRandom(s + 3) * 30000),
            lastServiceDate: new Date(Date.now() - Math.round(seededRandom(s + 4) * 180 * 86400000)).toISOString(),
          };
        });

        return { vehicleId, vehicleUnit: unit, currentMileage, predictions };
      });

      let filtered = results;
      if (input.riskFilter !== "all") {
        filtered = filtered.filter(v => v.predictions.some(p => p.riskLevel === input.riskFilter));
      }

      return filtered.slice(0, input.limit);
    }),

  getFleetSummary: protectedProcedure.query(async ({ ctx }) => {
    const seed = ((ctx.user as any)?.companyId || 1) * 89;
    return {
      totalVehicles: VEHICLE_UNITS.length,
      riskBreakdown: {
        critical: Math.floor(seededRandom(seed) * 3) + 1,
        high: Math.floor(seededRandom(seed + 1) * 5) + 2,
        medium: Math.floor(seededRandom(seed + 2) * 6) + 3,
        low: VEHICLE_UNITS.length - 11,
      },
      componentAnalysis: ["engine", "transmission", "brakes", "suspension", "electrical"].map((comp, i) => ({
        component: comp,
        avgRiskScore: Math.round(seededRandom(seed + i * 7) * 50 + 20),
        criticalCount: Math.floor(seededRandom(seed + i * 7 + 1) * 2),
        highCount: Math.floor(seededRandom(seed + i * 7 + 2) * 3),
      })),
      lastUpdated: new Date().toISOString(),
    };
  }),

  getMaintenanceAlerts: protectedProcedure
    .input(z.object({
      severity: z.enum(["critical", "high", "all"]).optional().default("all"),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const seed = ((ctx.user as any)?.companyId || 1) * 101;
      const components = ["engine", "transmission", "brakes", "suspension", "electrical"];

      const alerts: Array<{
        id: string; vehicleId: number; vehicleUnit: string; component: string;
        riskLevel: string; milesRemaining: number; daysRemaining: number;
        predictedFailureDate: string; confidenceScore: number; message: string;
        severity: "critical" | "high"; createdAt: string;
      }> = [];

      for (let vi = 0; vi < 10; vi++) {
        for (let ci = 0; ci < components.length; ci++) {
          const s = seed + vi * 53 + ci * 11;
          const r = seededRandom(s);
          if (r <= 0.55) continue;
          const severity: "critical" | "high" = r > 0.75 ? "critical" : "high";
          if (input.severity !== "all" && severity !== input.severity) continue;
          const milesRemaining = Math.round(seededRandom(s + 1) * 10000);
          const daysRemaining = Math.round(milesRemaining / 500);
          alerts.push({
            id: seededId("maint_alert", s),
            vehicleId: vi + 1,
            vehicleUnit: VEHICLE_UNITS[vi],
            component: components[ci],
            riskLevel: severity,
            milesRemaining,
            daysRemaining,
            predictedFailureDate: new Date(Date.now() + daysRemaining * 86400000).toISOString(),
            confidenceScore: Math.round(seededRandom(s + 2) * 30 + 70),
            message: daysRemaining <= 0
              ? `${components[ci]} failure OVERDUE on ${VEHICLE_UNITS[vi]}`
              : `${components[ci]} needs service in ${daysRemaining}d / ${milesRemaining.toLocaleString()} mi on ${VEHICLE_UNITS[vi]}`,
            severity,
            createdAt: new Date().toISOString(),
          });
        }
      }
      alerts.sort((a, b) => {
        if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1;
        return a.daysRemaining - b.daysRemaining;
      });
      return alerts.slice(0, input.limit);
    }),

  getAlertCounts: protectedProcedure.query(async ({ ctx }) => {
    const seed = ((ctx.user as any)?.companyId || 1) * 109;
    const critical = Math.floor(seededRandom(seed) * 4) + 1;
    const high = Math.floor(seededRandom(seed + 1) * 6) + 2;
    return { critical, high, total: critical + high };
  }),
});
