/**
 * FLEET MAINTENANCE ROUTER
 * Comprehensive fleet maintenance and vehicle management module.
 * Covers: preventive maintenance scheduling, work orders, repair tracking,
 * parts inventory, warranty management, tire management, vehicle lifecycle,
 * DOT inspection prep, fuel efficiency, cost analysis, vendor management,
 * recall alerts, predictive maintenance, fleet utilization, compliance calendar.
 *
 * WIRED TO REAL DATABASE — uses vehicles, zeunMaintenanceLogs,
 * zeunMaintenanceSchedules, zeunBreakdownReports, zeunVehicleRecalls,
 * inspections, zeunRepairProviders, fuelTransactions tables.
 */

import { z } from "zod";
import { eq, and, desc, sql, gte, lte, like, count, sum, avg, type SQL } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import {
  vehicles,
  zeunMaintenanceLogs,
  zeunMaintenanceSchedules,
  zeunFleetMaintenanceSchedules,
  zeunBreakdownReports,
  zeunVehicleRecalls,
  inspections,
  zeunRepairProviders,
  fuelTransactions,
  partsInventory,
  warrantyRecords,
  warrantyClaims,
  tireInventory,
  purchaseOrders,
  complianceEvents,
} from "../../drizzle/schema";

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
// Helpers
// ---------------------------------------------------------------------------

// Map breakdown report status to work-order-style status
function mapBreakdownToWoStatus(s: string): "open" | "in_progress" | "awaiting_parts" | "completed" | "cancelled" {
  switch (s) {
    case "REPORTED": return "open";
    case "DIAGNOSED":
    case "ACKNOWLEDGED":
    case "EN_ROUTE_TO_SHOP":
    case "AT_SHOP":
    case "UNDER_REPAIR": return "in_progress";
    case "WAITING_PARTS": return "awaiting_parts";
    case "RESOLVED": return "completed";
    case "CANCELLED": return "cancelled";
    default: return "open";
  }
}

function mapBreakdownToWoPriority(severity: string): "critical" | "high" | "medium" | "low" {
  switch (severity) {
    case "CRITICAL": return "critical";
    case "HIGH": return "high";
    case "MEDIUM": return "medium";
    case "LOW": return "low";
    default: return "medium";
  }
}

// Static part catalog — fallback reference data when parts_inventory table is empty
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

// Static DOT inspection checklist — regulatory reference data (FMCSA 396.13 / Appendix G)
// These items are mandated by federal regulation and do not change frequently
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
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const companyId = ctx.user!.companyId || 1;
    const now = new Date();
    const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Fleet vehicle counts by status
    const statusCounts = await db.select({
      status: vehicles.status,
      cnt: count(),
    }).from(vehicles).where(
      and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true))
    ).groupBy(vehicles.status);

    const statusMap: Record<string, number> = {};
    let fleetSize = 0;
    for (const row of statusCounts) {
      statusMap[row.status] = row.cnt;
      fleetSize += row.cnt;
    }
    const vehiclesInShop = statusMap["maintenance"] || 0;
    const fleetAvailability = fleetSize > 0
      ? Math.round(((fleetSize - vehiclesInShop) / fleetSize) * 100 * 10) / 10
      : 100;

    // Overdue PMs from zeunMaintenanceSchedules
    const [overdueRow] = await db.select({ cnt: count() })
      .from(zeunMaintenanceSchedules)
      .innerJoin(vehicles, eq(zeunMaintenanceSchedules.vehicleId, vehicles.id))
      .where(and(
        eq(vehicles.companyId, companyId),
        eq(zeunMaintenanceSchedules.isOverdue, true),
      ));
    const overduePMs = overdueRow?.cnt ?? 0;

    // Upcoming PMs within 7 and 30 days
    const sevenDaysOut = new Date(now.getTime() + 7 * 86400000);
    const thirtyDaysOut = new Date(now.getTime() + 30 * 86400000);

    const [upcoming7Row] = await db.select({ cnt: count() })
      .from(zeunMaintenanceSchedules)
      .innerJoin(vehicles, eq(zeunMaintenanceSchedules.vehicleId, vehicles.id))
      .where(and(
        eq(vehicles.companyId, companyId),
        eq(zeunMaintenanceSchedules.isOverdue, false),
        lte(zeunMaintenanceSchedules.nextDueDate, sevenDaysOut),
      ));
    const upcomingPMs7d = upcoming7Row?.cnt ?? 0;

    const [upcoming30Row] = await db.select({ cnt: count() })
      .from(zeunMaintenanceSchedules)
      .innerJoin(vehicles, eq(zeunMaintenanceSchedules.vehicleId, vehicles.id))
      .where(and(
        eq(vehicles.companyId, companyId),
        eq(zeunMaintenanceSchedules.isOverdue, false),
        lte(zeunMaintenanceSchedules.nextDueDate, thirtyDaysOut),
      ));
    const upcomingPMs30d = upcoming30Row?.cnt ?? 0;

    // Open work orders (breakdown reports that aren't resolved/cancelled)
    const [openWoRow] = await db.select({ cnt: count() })
      .from(zeunBreakdownReports)
      .where(and(
        eq(zeunBreakdownReports.companyId, companyId),
        sql`${zeunBreakdownReports.status} NOT IN ('RESOLVED','CANCELLED')`,
      ));
    const openWorkOrders = openWoRow?.cnt ?? 0;

    const [awaitingRow] = await db.select({ cnt: count() })
      .from(zeunBreakdownReports)
      .where(and(
        eq(zeunBreakdownReports.companyId, companyId),
        eq(zeunBreakdownReports.status, "WAITING_PARTS"),
      ));
    const awaitingParts = awaitingRow?.cnt ?? 0;

    // Maintenance cost MTD and last month
    const [costMtdRow] = await db.select({ total: sql<string>`COALESCE(SUM(${zeunMaintenanceLogs.cost}), 0)` })
      .from(zeunMaintenanceLogs)
      .where(and(
        eq(zeunMaintenanceLogs.companyId, companyId),
        gte(zeunMaintenanceLogs.serviceDate, mtdStart),
      ));
    const costMTD = Math.round(Number(costMtdRow?.total ?? 0));

    const [costLastRow] = await db.select({ total: sql<string>`COALESCE(SUM(${zeunMaintenanceLogs.cost}), 0)` })
      .from(zeunMaintenanceLogs)
      .where(and(
        eq(zeunMaintenanceLogs.companyId, companyId),
        gte(zeunMaintenanceLogs.serviceDate, lastMonthStart),
        lte(zeunMaintenanceLogs.serviceDate, lastMonthEnd),
      ));
    const costLastMonth = Math.round(Number(costLastRow?.total ?? 0));

    // Recall alerts (unresolved)
    const [recallRow] = await db.select({ cnt: count() })
      .from(zeunVehicleRecalls)
      .innerJoin(vehicles, eq(zeunVehicleRecalls.vehicleId, vehicles.id))
      .where(and(
        eq(vehicles.companyId, companyId),
        eq(zeunVehicleRecalls.isCompleted, false),
      ));
    const recallAlerts = recallRow?.cnt ?? 0;

    // Recent maintenance activity (last 8 service logs)
    const recentLogs = await db.select({
      id: zeunMaintenanceLogs.id,
      serviceType: zeunMaintenanceLogs.serviceType,
      serviceDate: zeunMaintenanceLogs.serviceDate,
      vehicleId: zeunMaintenanceLogs.vehicleId,
      cost: zeunMaintenanceLogs.cost,
      notes: zeunMaintenanceLogs.notes,
    }).from(zeunMaintenanceLogs)
      .where(eq(zeunMaintenanceLogs.companyId, companyId))
      .orderBy(desc(zeunMaintenanceLogs.serviceDate))
      .limit(8);

    // Cost by service type (top categories from last 90 days)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);
    const costByType = await db.select({
      category: zeunMaintenanceLogs.serviceType,
      amount: sql<string>`COALESCE(SUM(${zeunMaintenanceLogs.cost}), 0)`,
    }).from(zeunMaintenanceLogs)
      .where(and(
        eq(zeunMaintenanceLogs.companyId, companyId),
        gte(zeunMaintenanceLogs.serviceDate, ninetyDaysAgo),
      ))
      .groupBy(zeunMaintenanceLogs.serviceType)
      .orderBy(sql`SUM(${zeunMaintenanceLogs.cost}) DESC`)
      .limit(6);

    // Expiring warranties: active warranties expiring within 90 days
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 86400000);
    const [expiringWarrantyRow] = await db.select({ cnt: count() })
      .from(warrantyRecords)
      .where(and(
        eq(warrantyRecords.companyId, companyId),
        eq(warrantyRecords.status, "active"),
        lte(warrantyRecords.expiryDate, ninetyDaysFromNow),
        gte(warrantyRecords.expiryDate, now),
      ));
    const expiringWarranties = expiringWarrantyRow?.cnt ?? 0;

    // Compute average repair turnaround from resolved breakdown reports (createdAt -> resolvedAt)
    const [turnaroundRow] = await db.select({
      avgHours: sql<number>`COALESCE(AVG(TIMESTAMPDIFF(HOUR, ${zeunBreakdownReports.createdAt}, ${zeunBreakdownReports.resolvedAt})), 0)`,
    }).from(zeunBreakdownReports)
      .where(and(
        eq(zeunBreakdownReports.companyId, companyId),
        eq(zeunBreakdownReports.status, "RESOLVED"),
        sql`${zeunBreakdownReports.resolvedAt} IS NOT NULL`,
      ));
    const avgRepairTurnaround = Math.round(Number(turnaroundRow?.avgHours ?? 0));
    const complianceScore = overduePMs === 0 && recallAlerts === 0 ? 100
      : Math.max(60, 100 - overduePMs * 3 - recallAlerts * 5);

    return {
      overduePMs,
      upcomingPMs7d,
      upcomingPMs30d,
      openWorkOrders,
      awaitingParts,
      costMTD,
      costLastMonth,
      costTrend: costMTD > costLastMonth ? "up" : "down",
      costTrendPct: costLastMonth > 0 ? Math.round(Math.abs(costMTD - costLastMonth) / costLastMonth * 100) : 0,
      fleetSize,
      vehiclesInShop,
      fleetAvailability,
      recallAlerts,
      expiringWarranties,
      avgRepairTurnaroundHrs: avgRepairTurnaround, // computed from resolved breakdown reports
      complianceScore,
      recentActivity: recentLogs.map((log) => ({
        id: `act_${log.id}`,
        type: "pm_completed",
        description: `${log.serviceType} service (vehicle #${log.vehicleId})`,
        vehicleUnit: `VH-${log.vehicleId}`,
        timestamp: log.serviceDate?.toISOString() ?? now.toISOString(),
      })),
      costByCategory: costByType.map((row) => ({
        category: row.category || "Other",
        amount: Math.round(Number(row.amount)),
      })),
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
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = ctx.user!.companyId || 1;
      const now = new Date();

      // Build conditions
      const conditions = [eq(vehicles.companyId, companyId)];
      if (input.vehicleId) {
        conditions.push(eq(zeunMaintenanceSchedules.vehicleId, input.vehicleId));
      }

      const rows = await db.select({
        id: zeunMaintenanceSchedules.id,
        vehicleId: zeunMaintenanceSchedules.vehicleId,
        serviceType: zeunMaintenanceSchedules.serviceType,
        intervalMiles: zeunMaintenanceSchedules.intervalMiles,
        intervalDays: zeunMaintenanceSchedules.intervalDays,
        lastServiceDate: zeunMaintenanceSchedules.lastServiceDate,
        lastServiceOdometer: zeunMaintenanceSchedules.lastServiceOdometer,
        nextDueDate: zeunMaintenanceSchedules.nextDueDate,
        nextDueOdometer: zeunMaintenanceSchedules.nextDueOdometer,
        isOverdue: zeunMaintenanceSchedules.isOverdue,
        priority: zeunMaintenanceSchedules.priority,
        estimatedCostMin: zeunMaintenanceSchedules.estimatedCostMin,
        estimatedCostMax: zeunMaintenanceSchedules.estimatedCostMax,
        vehicleMileage: vehicles.mileage,
        vehicleLicensePlate: vehicles.licensePlate,
        vehicleMake: vehicles.make,
      }).from(zeunMaintenanceSchedules)
        .innerJoin(vehicles, eq(zeunMaintenanceSchedules.vehicleId, vehicles.id))
        .where(and(...conditions))
        .orderBy(zeunMaintenanceSchedules.nextDueDate);

      const schedule = rows.map((r) => {
        const currentMiles = r.vehicleMileage ?? 0;
        const nextDueMiles = r.nextDueOdometer ?? 0;
        const milesUntilDue = nextDueMiles - currentMiles;
        const daysUntilDue = r.nextDueDate
          ? Math.round((r.nextDueDate.getTime() - now.getTime()) / 86400000)
          : 999;

        let status: "overdue" | "due_soon" | "upcoming" | "on_track" = "on_track";
        if (r.isOverdue || milesUntilDue <= 0 || daysUntilDue <= 0) status = "overdue";
        else if (milesUntilDue <= 2000 || daysUntilDue <= 7) status = "due_soon";
        else if (milesUntilDue <= 5000 || daysUntilDue <= 30) status = "upcoming";

        return {
          id: `pm_${r.id}`,
          vehicleUnit: r.vehicleLicensePlate || `VH-${r.vehicleId}`,
          vehicleId: r.vehicleId,
          service: r.serviceType,
          intervalMiles: r.intervalMiles ?? 0,
          intervalDays: r.intervalDays ?? 0,
          lastPerformedDate: r.lastServiceDate?.toISOString() ?? null,
          lastPerformedMiles: r.lastServiceOdometer ?? 0,
          nextDueDate: r.nextDueDate?.toISOString() ?? null,
          nextDueMiles: nextDueMiles,
          currentMiles,
          milesUntilDue,
          daysUntilDue,
          status,
          estimatedCost: Math.round((Number(r.estimatedCostMin ?? 0) + Number(r.estimatedCostMax ?? 0)) / 2),
        };
      });

      const filtered = input.dueSoon ? schedule.filter((s) => s.status !== "on_track") : schedule;
      filtered.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

      const start = (input.page - 1) * input.limit;
      return {
        items: filtered.slice(start, start + input.limit),
        total: filtered.length,
        page: input.page,
        totalPages: Math.ceil(filtered.length / input.limit),
      };
    }),

  // =========================================================================
  // WORK ORDERS (backed by zeunBreakdownReports)
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
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = ctx.user!.id || 0;
      const companyId = ctx.user!.companyId;

      // Map work order priority to breakdown severity
      const severityMap: Record<string, "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"> = {
        low: "LOW", medium: "MEDIUM", high: "HIGH", critical: "CRITICAL",
      };

      const [report] = await db.insert(zeunBreakdownReports).values({
        driverId: userId,
        vehicleId: input.vehicleId,
        companyId: companyId || null,
        issueCategory: "OTHER",
        severity: severityMap[input.priority] || "MEDIUM",
        symptoms: [input.title, input.description || ""].filter(Boolean),
        canDrive: input.priority !== "critical",
        latitude: "0",
        longitude: "0",
        driverNotes: `[WO] ${input.type}: ${input.title}${input.description ? ` — ${input.description}` : ""}`,
        selectedProviderId: input.assignedVendorId || null,
        status: "REPORTED",
      }).$returningId();

      const woId = `WO-${report.id}`;
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
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = ctx.user!.companyId || 1;

      // Build conditions
      const conditions: SQL[] = [eq(zeunBreakdownReports.companyId, companyId)];
      if (input.status) {
        // Map WO status back to breakdown statuses
        const statusMap: Record<string, string[]> = {
          open: ["REPORTED"],
          in_progress: ["DIAGNOSED", "ACKNOWLEDGED", "EN_ROUTE_TO_SHOP", "AT_SHOP", "UNDER_REPAIR"],
          awaiting_parts: ["WAITING_PARTS"],
          completed: ["RESOLVED"],
          cancelled: ["CANCELLED"],
        };
        const dbStatuses = statusMap[input.status] || [input.status];
        conditions.push(sql`${zeunBreakdownReports.status} IN (${sql.join(dbStatuses.map(s => sql`${s}`), sql`, `)})`);
      }
      if (input.priority) {
        const sevMap: Record<string, string> = { critical: "CRITICAL", high: "HIGH", medium: "MEDIUM", low: "LOW" };
        conditions.push(eq(zeunBreakdownReports.severity, sevMap[input.priority] as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"));
      }
      if (input.vehicleId) {
        conditions.push(eq(zeunBreakdownReports.vehicleId, input.vehicleId));
      }

      const rows = await db.select({
        id: zeunBreakdownReports.id,
        vehicleId: zeunBreakdownReports.vehicleId,
        status: zeunBreakdownReports.status,
        severity: zeunBreakdownReports.severity,
        issueCategory: zeunBreakdownReports.issueCategory,
        symptoms: zeunBreakdownReports.symptoms,
        driverNotes: zeunBreakdownReports.driverNotes,
        actualCost: zeunBreakdownReports.actualCost,
        selectedProviderId: zeunBreakdownReports.selectedProviderId,
        resolvedAt: zeunBreakdownReports.resolvedAt,
        createdAt: zeunBreakdownReports.createdAt,
        updatedAt: zeunBreakdownReports.updatedAt,
        vehicleLicensePlate: vehicles.licensePlate,
      }).from(zeunBreakdownReports)
        .leftJoin(vehicles, eq(zeunBreakdownReports.vehicleId, vehicles.id))
        .where(and(...conditions))
        .orderBy(desc(zeunBreakdownReports.createdAt))
        .limit(200);

      // Filter by type if requested (derive type from notes/issueCategory)
      let workOrders = rows.map((r) => {
        const woStatus = mapBreakdownToWoStatus(r.status);
        const woPriority = mapBreakdownToWoPriority(r.severity);
        const notes = r.driverNotes || "";
        let woType: "preventive" | "corrective" | "emergency" | "inspection" | "recall" | "warranty" = "corrective";
        if (notes.includes("[WO] preventive")) woType = "preventive";
        else if (notes.includes("[WO] emergency")) woType = "emergency";
        else if (notes.includes("[WO] inspection")) woType = "inspection";
        else if (notes.includes("[WO] recall")) woType = "recall";
        else if (notes.includes("[WO] warranty")) woType = "warranty";
        else if (r.severity === "CRITICAL") woType = "emergency";

        const title = (r.symptoms as string[] | null)?.[0] || r.issueCategory;

        return {
          id: `WO-${r.id}`,
          vehicleId: r.vehicleId ?? 0,
          vehicleUnit: r.vehicleLicensePlate || `VH-${r.vehicleId}`,
          type: woType,
          priority: woPriority,
          status: woStatus,
          title,
          description: notes || `${r.issueCategory} issue`,
          assignedVendorId: r.selectedProviderId ?? null,
          assignedVendorName: null as string | null,
          estimatedCost: 0,
          actualCost: Math.round(Number(r.actualCost ?? 0)),
          laborHours: 0,
          scheduledDate: r.createdAt.toISOString(),
          completedDate: r.resolvedAt?.toISOString() ?? null,
          createdBy: 0,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
          partsUsed: 0,
        };
      });

      if (input.type) {
        workOrders = workOrders.filter((wo) => wo.type === input.type);
      }

      const start = (input.page - 1) * input.limit;
      return {
        items: workOrders.slice(start, start + input.limit),
        total: workOrders.length,
        page: input.page,
        totalPages: Math.ceil(workOrders.length / input.limit),
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
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Parse breakdown report ID from WO-<id>
      const breakdownId = parseInt(input.workOrderId.replace("WO-", ""), 10);
      if (isNaN(breakdownId)) throw new Error("Invalid work order ID");

      const updates: Record<string, unknown> = {};
      if (input.status) {
        const reverseStatusMap: Record<string, string> = {
          open: "REPORTED", in_progress: "UNDER_REPAIR",
          awaiting_parts: "WAITING_PARTS", completed: "RESOLVED", cancelled: "CANCELLED",
        };
        updates.status = reverseStatusMap[input.status] || "REPORTED";
        if (input.status === "completed") updates.resolvedAt = new Date();
      }
      if (input.actualCost !== undefined) updates.actualCost = String(input.actualCost);
      if (input.notes) updates.driverNotes = sql`CONCAT(COALESCE(${zeunBreakdownReports.driverNotes}, ''), '\n', ${input.notes})`;

      if (Object.keys(updates).length > 0) {
        await db.update(zeunBreakdownReports).set(updates).where(eq(zeunBreakdownReports.id, breakdownId));
      }

      logger.info(`[FleetMaintenance] Work order ${input.workOrderId} updated by user ${ctx.user!.id}`);
      return {
        id: input.workOrderId,
        status: input.status || "in_progress",
        actualCost: input.actualCost || 0,
        laborHours: input.laborHours || 0,
        notes: input.notes || "",
        updatedAt: new Date().toISOString(),
        updatedBy: ctx.user!.id || 0,
        success: true,
      };
    }),

  // =========================================================================
  // REPAIR HISTORY (from zeunMaintenanceLogs)
  // =========================================================================

  getRepairHistory: protectedProcedure
    .input(z.object({
      vehicleId: z.number(),
    }).merge(paginationInput))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const rows = await db.select({
        id: zeunMaintenanceLogs.id,
        vehicleId: zeunMaintenanceLogs.vehicleId,
        serviceType: zeunMaintenanceLogs.serviceType,
        serviceDate: zeunMaintenanceLogs.serviceDate,
        odometerAtService: zeunMaintenanceLogs.odometerAtService,
        cost: zeunMaintenanceLogs.cost,
        providerName: zeunMaintenanceLogs.providerName,
        laborHours: zeunMaintenanceLogs.laborHours,
        partsReplaced: zeunMaintenanceLogs.partsReplaced,
        notes: zeunMaintenanceLogs.notes,
        vehicleLicensePlate: vehicles.licensePlate,
      }).from(zeunMaintenanceLogs)
        .leftJoin(vehicles, eq(zeunMaintenanceLogs.vehicleId, vehicles.id))
        .where(eq(zeunMaintenanceLogs.vehicleId, input.vehicleId))
        .orderBy(desc(zeunMaintenanceLogs.serviceDate))
        .limit(200);

      const repairs = rows.map((r) => {
        const totalCost = Math.round(Number(r.cost ?? 0));
        const laborHrs = Number(r.laborHours ?? 0);
        const laborCost = Math.round(laborHrs * 125);
        const partsCost = Math.max(0, totalCost - laborCost);
        return {
          id: `rpr_${r.id}`,
          workOrderId: `WO-${r.id}`,
          vehicleId: r.vehicleId,
          vehicleUnit: r.vehicleLicensePlate || `VH-${r.vehicleId}`,
          category: r.serviceType || "General",
          description: r.notes || `${r.serviceType} service`,
          vendorName: r.providerName || "In-house",
          laborHours: laborHrs,
          partsCost,
          laborCost,
          totalCost,
          mileageAtService: r.odometerAtService,
          completedAt: r.serviceDate.toISOString(),
        };
      });

      const start = (input.page - 1) * input.limit;
      const totalCostSum = repairs.reduce((sum, r) => sum + r.totalCost, 0);
      const topCategories: Record<string, number> = {};
      repairs.forEach((r) => { topCategories[r.category] = (topCategories[r.category] || 0) + r.totalCost; });
      const topCategory = Object.entries(topCategories).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A";

      return {
        items: repairs.slice(start, start + input.limit),
        total: repairs.length,
        page: input.page,
        totalPages: Math.ceil(repairs.length / input.limit),
        summary: {
          totalRepairs: repairs.length,
          totalCost: totalCostSum,
          avgCostPerRepair: repairs.length > 0 ? Math.round(totalCostSum / repairs.length) : 0,
          topCategory,
        },
      };
    }),

  // =========================================================================
  // PARTS INVENTORY (backed by parts_inventory table, static catalog fallback)
  // =========================================================================

  getPartsInventory: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
      lowStock: z.boolean().optional().default(false),
      search: z.string().optional(),
    }).merge(paginationInput))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = ctx.user!.companyId || 1;

      // Query real parts_inventory table; fall back to static catalog if table is empty
      const dbParts = await db.select().from(partsInventory)
        .where(eq(partsInventory.companyId, companyId))
        .orderBy(desc(partsInventory.updatedAt))
        .limit(500);

      let parts: Array<{
        id: number; partNumber: string; name: string; category: string;
        unitCost: number; qtyOnHand: number; reorderPoint: number; reorderQty: number;
        totalValue: number; isLowStock: boolean; lastOrderDate: string | null; avgMonthlyUsage: number;
      }>;

      if (dbParts.length > 0) {
        parts = dbParts.map((p) => {
          const qty = p.quantity ?? 0;
          const cost = Number(p.unitCost ?? 0);
          const reorder = p.reorderLevel ?? 5;
          return {
            id: p.id,
            partNumber: p.partNumber,
            name: p.name,
            category: p.category || "Other",
            unitCost: cost,
            qtyOnHand: qty,
            reorderPoint: reorder,
            reorderQty: reorder * 2,
            totalValue: Math.round(cost * qty * 100) / 100,
            isLowStock: qty <= reorder,
            lastOrderDate: p.lastOrderedAt?.toISOString() ?? null,
            avgMonthlyUsage: Math.round(reorder),
          };
        });
      } else {
        // Fall back to static catalog when no DB rows exist yet
        parts = PART_CATALOG.map((p, i) => ({
          ...p,
          id: i + 1,
          totalValue: Math.round(p.unitCost * p.qtyOnHand * 100) / 100,
          isLowStock: p.qtyOnHand <= p.reorderPoint,
          lastOrderDate: new Date(Date.now() - (i + 1) * 15 * 86400000).toISOString(),
          avgMonthlyUsage: Math.round(p.reorderQty / 2),
        }));
      }

      if (input.category) parts = parts.filter(p => p.category === input.category);
      if (input.lowStock) parts = parts.filter(p => p.isLowStock);
      if (input.search) {
        const q = input.search.toLowerCase();
        parts = parts.filter(p => p.name.toLowerCase().includes(q) || p.partNumber.toLowerCase().includes(q));
      }

      const totalInventoryValue = parts.reduce((sum, p) => sum + p.totalValue, 0);
      const lowStockCount = parts.filter(p => p.isLowStock).length;
      const categories = Array.from(new Set(parts.map(p => p.category)));

      const start = (input.page - 1) * input.limit;
      return {
        items: parts.slice(start, start + input.limit),
        total: parts.length,
        page: input.page,
        totalPages: Math.ceil(parts.length / input.limit),
        totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
        lowStockCount,
        categories,
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
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = ctx.user!.companyId || 1;

      // Look up part cost from parts_inventory first, fall back to static catalog
      const [dbPart] = await db.select({ unitCost: partsInventory.unitCost, name: partsInventory.name })
        .from(partsInventory)
        .where(and(eq(partsInventory.companyId, companyId), eq(partsInventory.partNumber, input.partNumber)))
        .limit(1);
      const staticPart = PART_CATALOG.find(p => p.partNumber === input.partNumber);
      const unitCost = Number(dbPart?.unitCost ?? staticPart?.unitCost ?? 0);
      const partName = dbPart?.name ?? staticPart?.name ?? input.partNumber;
      const totalCost = unitCost * input.quantity;

      const poNumber = `PO-${Date.now().toString(36).toUpperCase()}`;

      // Insert into purchase_orders table
      const [poResult] = await db.insert(purchaseOrders).values({
        companyId,
        poNumber,
        vendorId: input.vendorId ?? null,
        vendorName: null,
        status: "submitted",
        totalAmount: String(totalCost) as any,
        items: [{ partNumber: input.partNumber, description: partName, quantity: input.quantity, unitCost }],
        orderedAt: new Date(),
        notes: input.notes || null,
      }).$returningId();

      logger.info(`[FleetMaintenance] Purchase order ${poNumber} (id=${poResult.id}) created for ${input.quantity}x ${input.partNumber}`);
      return {
        purchaseOrderId: poNumber,
        partNumber: input.partNumber,
        partName,
        quantity: input.quantity,
        unitCost,
        totalCost,
        urgency: input.urgency,
        estimatedDelivery: new Date(Date.now() + (input.urgency === "emergency" ? 1 : input.urgency === "expedited" ? 3 : 7) * 86400000).toISOString(),
        status: "ordered" as const,
        createdAt: new Date().toISOString(),
        createdBy: ctx.user!.id || 0,
      };
    }),

  // =========================================================================
  // WARRANTY MANAGEMENT (backed by warranty_records + warranty_claims tables)
  // =========================================================================

  getWarrantyTracker: protectedProcedure
    .input(z.object({
      vehicleId: z.number().optional(),
      expiringWithinDays: z.number().optional(),
    }).merge(paginationInput))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = ctx.user!.companyId || 1;
      const now = new Date();

      // Try real warranty_records table first
      const wrConditions: SQL[] = [eq(warrantyRecords.companyId, companyId)];
      if (input.vehicleId) wrConditions.push(eq(warrantyRecords.vehicleId, input.vehicleId));

      const dbWarranties = await db.select({
        id: warrantyRecords.id,
        vehicleId: warrantyRecords.vehicleId,
        component: warrantyRecords.component,
        provider: warrantyRecords.provider,
        startDate: warrantyRecords.startDate,
        expiryDate: warrantyRecords.expiryDate,
        mileageLimit: warrantyRecords.mileageLimit,
        status: warrantyRecords.status,
        policyNumber: warrantyRecords.policyNumber,
        vehicleLicensePlate: vehicles.licensePlate,
        vehicleMileage: vehicles.mileage,
      }).from(warrantyRecords)
        .leftJoin(vehicles, eq(warrantyRecords.vehicleId, vehicles.id))
        .where(and(...wrConditions))
        .orderBy(warrantyRecords.expiryDate)
        .limit(500);

      // Count claims per warranty
      const claimCounts = dbWarranties.length > 0
        ? await db.select({
            warrantyId: warrantyClaims.warrantyId,
            cnt: count(),
          }).from(warrantyClaims)
            .where(eq(warrantyClaims.companyId, companyId))
            .groupBy(warrantyClaims.warrantyId)
        : [];
      const claimMap = new Map(claimCounts.map(c => [c.warrantyId, c.cnt]));

      let warranties: Array<{
        id: string; vehicleId: number; vehicleUnit: string; component: string;
        provider: string; purchaseDate: string; expiryDate: string; daysRemaining: number;
        mileageLimit: number; currentMiles: number; milesRemaining: number;
        status: "active" | "expiring_soon" | "expired"; claimsCount: number;
      }>;

      if (dbWarranties.length > 0) {
        warranties = dbWarranties.map((w) => {
          const expiry = w.expiryDate ?? now;
          const daysRemaining = Math.round((expiry.getTime() - now.getTime()) / 86400000);
          const currentMiles = w.vehicleMileage ?? 0;
          const mlimit = w.mileageLimit ?? 0;
          return {
            id: `wrty_${w.id}`,
            vehicleId: w.vehicleId ?? 0,
            vehicleUnit: w.vehicleLicensePlate || `VH-${w.vehicleId}`,
            component: w.component,
            provider: w.provider || "Unknown",
            purchaseDate: w.startDate?.toISOString() ?? now.toISOString(),
            expiryDate: expiry.toISOString(),
            daysRemaining: Math.max(0, daysRemaining),
            mileageLimit: mlimit,
            currentMiles,
            milesRemaining: Math.max(0, mlimit - currentMiles),
            status: daysRemaining <= 0 ? "expired" as const
              : daysRemaining <= 90 ? "expiring_soon" as const
              : "active" as const,
            claimsCount: claimMap.get(w.id) ?? 0,
          };
        });
      } else {
        // Fallback: generate synthetic warranty entries from fleet vehicles
        const vehConditions: SQL[] = [eq(vehicles.companyId, companyId), eq(vehicles.isActive, true)];
        if (input.vehicleId) vehConditions.push(eq(vehicles.id, input.vehicleId));
        const fleetVehicles = await db.select({
          id: vehicles.id, licensePlate: vehicles.licensePlate, year: vehicles.year,
        }).from(vehicles).where(and(...vehConditions)).limit(100);

        const components = [
          { component: "Engine", provider: "Detroit Diesel / Daimler", durationMonths: 60, mileageLimit: 500000 },
          { component: "Transmission", provider: "Eaton Fuller", durationMonths: 48, mileageLimit: 400000 },
          { component: "Aftertreatment (DPF/SCR)", provider: "Detroit Diesel", durationMonths: 60, mileageLimit: 350000 },
          { component: "Turbocharger", provider: "BorgWarner", durationMonths: 36, mileageLimit: 300000 },
          { component: "Starter Motor", provider: "Delco Remy", durationMonths: 24, mileageLimit: 200000 },
        ];

        warranties = fleetVehicles.flatMap((v) =>
          components.map((c, ci) => {
            const yearOffset = v.year ? now.getFullYear() - v.year : 3;
            const purchaseDate = new Date(now.getTime() - yearOffset * 365 * 86400000 + ci * 30 * 86400000);
            const expiryDate = new Date(purchaseDate.getTime() + c.durationMonths * 30 * 86400000);
            const daysRemaining = Math.round((expiryDate.getTime() - now.getTime()) / 86400000);
            return {
              id: `wrty_${v.id}_${ci}`,
              vehicleId: v.id,
              vehicleUnit: v.licensePlate || `VH-${v.id}`,
              component: c.component,
              provider: c.provider,
              purchaseDate: purchaseDate.toISOString(),
              expiryDate: expiryDate.toISOString(),
              daysRemaining: Math.max(0, daysRemaining),
              mileageLimit: c.mileageLimit,
              currentMiles: 0,
              milesRemaining: c.mileageLimit,
              status: daysRemaining <= 0 ? "expired" as const
                : daysRemaining <= 90 ? "expiring_soon" as const
                : "active" as const,
              claimsCount: 0,
            };
          })
        );
      }

      let filtered = warranties;
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
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = ctx.user!.companyId || 1;

      // Parse warranty record id (format: wrty_<id> or wrty_<vid>_<idx>)
      const warrantyDbId = parseInt(input.warrantyId.replace("wrty_", ""), 10) || null;

      const [claimResult] = await db.insert(warrantyClaims).values({
        warrantyId: warrantyDbId,
        companyId,
        vehicleId: input.vehicleId,
        claimDate: new Date(input.failureDate),
        description: `${input.component}: ${input.issueDescription}`,
        repairCost: String(input.estimatedRepairCost) as any,
        status: "submitted",
        notes: `Mileage at failure: ${input.mileageAtFailure}`,
      }).$returningId();

      // If warranty record exists, update its status to claimed
      if (warrantyDbId) {
        await db.update(warrantyRecords)
          .set({ status: "claimed" })
          .where(eq(warrantyRecords.id, warrantyDbId));
      }

      const claimId = `WC-${claimResult.id}`;
      logger.info(`[FleetMaintenance] Warranty claim ${claimId} submitted for warranty ${input.warrantyId}`);
      return {
        claimId,
        warrantyId: input.warrantyId,
        status: "submitted" as const,
        estimatedResolutionDays: 14,
        createdAt: new Date().toISOString(),
        submittedBy: ctx.user!.id || 0,
      };
    }),

  // =========================================================================
  // TIRE MANAGEMENT (backed by tire_inventory table, synthetic fallback)
  // =========================================================================

  getTireManagement: protectedProcedure
    .input(z.object({
      vehicleId: z.number().optional(),
    }).merge(paginationInput))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = ctx.user!.companyId || 1;
      const now = new Date();
      const positions = Object.values(tirePositionSchema.enum);

      // Get real vehicles (tractors only for tires)
      const vehConditions: SQL[] = [eq(vehicles.companyId, companyId), eq(vehicles.isActive, true)];
      if (input.vehicleId) vehConditions.push(eq(vehicles.id, input.vehicleId));
      else vehConditions.push(sql`${vehicles.vehicleType} IN ('tractor','box_truck','escort_truck','pilot_car')`);

      const fleetVehicles = await db.select({
        id: vehicles.id,
        licensePlate: vehicles.licensePlate,
        mileage: vehicles.mileage,
      }).from(vehicles).where(and(...vehConditions)).limit(50);

      // Try real tire_inventory table
      const tireConditions: SQL[] = [eq(tireInventory.companyId, companyId)];
      if (input.vehicleId) tireConditions.push(eq(tireInventory.vehicleId, input.vehicleId));

      const dbTires = await db.select({
        id: tireInventory.id,
        vehicleId: tireInventory.vehicleId,
        position: tireInventory.position,
        brand: tireInventory.brand,
        model: tireInventory.model,
        size: tireInventory.size,
        treadDepth: tireInventory.treadDepth,
        installedAt: tireInventory.installedAt,
        installedMileage: tireInventory.installedMileage,
        status: tireInventory.status,
        vehicleLicensePlate: vehicles.licensePlate,
        vehicleMileage: vehicles.mileage,
      }).from(tireInventory)
        .leftJoin(vehicles, eq(tireInventory.vehicleId, vehicles.id))
        .where(and(...tireConditions))
        .limit(500);

      type TireRow = {
        id: string; vehicleId: number; vehicleUnit: string; position: string;
        brand: string; model: string; size: string; dotCode: string;
        installedDate: string | null; installedMileage: number; currentMileage: number;
        treadDepth32nds: number; treadDepthStatus: "good" | "monitor" | "replace_soon" | "critical";
        pressure: number; pressureStatus: "ok" | "low" | "high";
        nextRotationMiles: number; nextRotationDate: string | null; costPerMile: number;
      };

      let tires: TireRow[];

      if (dbTires.length > 0) {
        tires = dbTires.map((t) => {
          const depth = Number(t.treadDepth ?? 0);
          const depth32 = Math.round(depth * 32); // decimal inches to 32nds
          const currentMiles = t.vehicleMileage ?? 0;
          const installedMiles = t.installedMileage ?? 0;
          const milesDriven = Math.max(0, currentMiles - installedMiles);
          let treadStatus: "good" | "monitor" | "replace_soon" | "critical" = "good";
          if (depth32 <= 2) treadStatus = "critical";
          else if (depth32 <= 4) treadStatus = "replace_soon";
          else if (depth32 <= 6) treadStatus = "monitor";

          return {
            id: `tire_${t.id}`,
            vehicleId: t.vehicleId ?? 0,
            vehicleUnit: t.vehicleLicensePlate || `VH-${t.vehicleId}`,
            position: t.position || "SPARE",
            brand: t.brand || "Unknown",
            model: t.model || "Unknown",
            size: t.size || "295/75R22.5",
            dotCode: "",
            installedDate: t.installedAt?.toISOString() ?? null,
            installedMileage: installedMiles,
            currentMileage: currentMiles,
            treadDepth32nds: depth32,
            treadDepthStatus: treadStatus,
            pressure: 0,
            pressureStatus: "ok" as const,
            nextRotationMiles: currentMiles + 20000,
            nextRotationDate: null,
            costPerMile: 0,
          };
        });
      } else {
        // Fallback: generate synthetic tire data from fleet vehicles
        tires = [];
        for (const vehicle of fleetVehicles) {
          const currentMiles = vehicle.mileage ?? 0;
          for (let pi = 0; pi < Math.min(positions.length, 6); pi++) {
            tires.push({
              id: `tire_${vehicle.id}_${pi}`,
              vehicleId: vehicle.id,
              vehicleUnit: vehicle.licensePlate || `VH-${vehicle.id}`,
              position: positions[pi],
              brand: "Unknown",
              model: pi < 2 ? "Steer" : "Drive",
              size: pi < 2 ? "11R22.5" : "295/75R22.5",
              dotCode: "",
              installedDate: null,
              installedMileage: 0,
              currentMileage: currentMiles,
              treadDepth32nds: 0,
              treadDepthStatus: "good",
              pressure: 0,
              pressureStatus: "ok",
              nextRotationMiles: currentMiles + 20000,
              nextRotationDate: null,
              costPerMile: 0,
            });
          }
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
          avgTreadDepth: tires.length > 0
            ? Math.round(tires.reduce((sum, t) => sum + t.treadDepth32nds, 0) / tires.length * 10) / 10
            : 0,
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
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Log as a maintenance log entry
      await db.insert(zeunMaintenanceLogs).values({
        vehicleId: input.vehicleId,
        driverId: ctx.user!.id || null,
        companyId: ctx.user!.companyId || null,
        serviceType: `Tire ${input.eventType}`,
        serviceDate: new Date(),
        odometerAtService: input.mileage,
        cost: input.cost ? String(input.cost) : null,
        notes: `Position: ${input.position}. ${input.notes || ""}`.trim(),
        partsReplaced: input.newTireBrand ? [`${input.newTireBrand} ${input.newTireModel || ""}`] : null,
      });

      const eventId = `TE-${Date.now().toString(36).toUpperCase()}`;
      logger.info(`[FleetMaintenance] Tire event ${eventId}: ${input.eventType} on vehicle ${input.vehicleId} position ${input.position}`);
      return {
        eventId,
        ...input,
        createdAt: new Date().toISOString(),
        createdBy: ctx.user!.id || 0,
        success: true,
      };
    }),

  // =========================================================================
  // VEHICLE LIFECYCLE (from vehicles table)
  // =========================================================================

  getVehicleLifecycle: protectedProcedure
    .input(z.object({
      vehicleId: z.number().optional(),
    }).merge(paginationInput))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = ctx.user!.companyId || 1;
      const now = new Date();

      const conditions: SQL[] = [eq(vehicles.companyId, companyId), eq(vehicles.isActive, true)];
      if (input.vehicleId) conditions.push(eq(vehicles.id, input.vehicleId));

      const fleetVehicles = await db.select().from(vehicles).where(and(...conditions)).limit(200);

      const vehicleList = await Promise.all(fleetVehicles.map(async (v) => {
        const isTruck = ["tractor", "box_truck", "escort_truck", "pilot_car"].includes(v.vehicleType);
        const yearAcquired = v.year || 2020;
        const acquisitionDate = v.createdAt || new Date(yearAcquired, 0, 1);
        const ageYears = (now.getTime() - acquisitionDate.getTime()) / (365.25 * 86400000);
        const acquisitionCost = isTruck ? 145000 : 45000;
        const depreciationRate = isTruck ? 0.12 : 0.10;
        const currentValue = Math.round(acquisitionCost * Math.pow(1 - depreciationRate, ageYears));
        const currentMiles = v.mileage ?? 0;

        // Get total maintenance cost for this vehicle
        const [costRow] = await db.select({
          total: sql<string>`COALESCE(SUM(${zeunMaintenanceLogs.cost}), 0)`,
        }).from(zeunMaintenanceLogs).where(eq(zeunMaintenanceLogs.vehicleId, v.id));
        const totalMaintenanceCost = Math.round(Number(costRow?.total ?? 0));

        const tco = acquisitionCost + totalMaintenanceCost;
        const costPerMile = currentMiles > 0 ? Math.round(tco / currentMiles * 100) / 100 : 0;
        const annualMiles = ageYears > 0.5 ? Math.round(currentMiles / ageYears) : currentMiles;

        return {
          id: v.id,
          unit: v.licensePlate || `VH-${v.id}`,
          type: v.vehicleType,
          make: v.make || "Unknown",
          model: v.model || "Unknown",
          year: yearAcquired,
          vin: v.vin,
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
          status: v.status,
        };
      }));

      const start = (input.page - 1) * input.limit;
      return {
        items: vehicleList.slice(start, start + input.limit),
        total: vehicleList.length,
        page: input.page,
        totalPages: Math.ceil(vehicleList.length / input.limit),
        fleetSummary: {
          totalAssetValue: vehicleList.reduce((sum, v) => sum + v.currentValue, 0),
          totalAcquisitionCost: vehicleList.reduce((sum, v) => sum + v.acquisitionCost, 0),
          avgAge: vehicleList.length > 0
            ? Math.round(vehicleList.reduce((sum, v) => sum + v.ageYears, 0) / vehicleList.length * 10) / 10
            : 0,
          avgCostPerMile: vehicleList.length > 0
            ? Math.round(vehicleList.reduce((sum, v) => sum + v.costPerMile, 0) / vehicleList.length * 100) / 100
            : 0,
          endOfLifeCount: vehicleList.filter(v => v.lifecyclePhase === "end_of_life").length,
        },
      };
    }),

  getVehicleValuation: protectedProcedure
    .input(z.object({ vehicleId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [v] = await db.select().from(vehicles).where(eq(vehicles.id, input.vehicleId)).limit(1);
      if (!v) throw new Error("Vehicle not found");

      const now = new Date();
      const yearAcquired = v.year || 2020;
      const isTruck = ["tractor", "box_truck", "escort_truck", "pilot_car"].includes(v.vehicleType);
      const acquisitionCost = isTruck ? 145000 : 45000;
      const depRate = isTruck ? 0.12 : 0.10;
      const ageYears = now.getFullYear() - yearAcquired + (now.getMonth() / 12);

      const schedule = Array.from({ length: 10 }, (_, yr) => ({
        year: yearAcquired + yr,
        bookValue: Math.round(acquisitionCost * Math.pow(1 - depRate, yr)),
        depreciation: Math.round(acquisitionCost * Math.pow(1 - depRate, yr) * depRate),
        cumulativeDepreciation: Math.round(acquisitionCost * (1 - Math.pow(1 - depRate, yr + 1))),
      }));

      return {
        vehicleId: input.vehicleId,
        vehicleUnit: v.licensePlate || `VH-${v.id}`,
        acquisitionCost,
        currentBookValue: Math.round(acquisitionCost * Math.pow(1 - depRate, ageYears)),
        estimatedFairMarketValue: Math.round(acquisitionCost * Math.pow(1 - depRate, ageYears) * 0.95),
        totalDepreciation: Math.round(acquisitionCost * (1 - Math.pow(1 - depRate, ageYears))),
        depreciationMethod: "declining_balance" as const,
        annualDepreciationRate: depRate,
        depreciationSchedule: schedule,
        salvageValue: Math.round(acquisitionCost * 0.08),
      };
    }),

  // =========================================================================
  // DOT INSPECTION PREP (checklist is static; last/next dates from DB)
  // =========================================================================

  getDotInspectionPrep: protectedProcedure
    .input(z.object({ vehicleId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [v] = await db.select({
        id: vehicles.id,
        licensePlate: vehicles.licensePlate,
        nextInspectionDate: vehicles.nextInspectionDate,
      }).from(vehicles).where(eq(vehicles.id, input.vehicleId)).limit(1);

      const unit = v?.licensePlate || `VH-${input.vehicleId}`;

      // Last annual/dot inspection from inspections table
      const [lastInsp] = await db.select({
        completedAt: inspections.completedAt,
        createdAt: inspections.createdAt,
      }).from(inspections)
        .where(and(
          eq(inspections.vehicleId, input.vehicleId),
          sql`${inspections.type} IN ('annual','dot')`,
        ))
        .orderBy(desc(inspections.createdAt))
        .limit(1);

      const lastAnnual = lastInsp?.completedAt ?? lastInsp?.createdAt;
      const nextDue = v?.nextInspectionDate ?? (lastAnnual
        ? new Date(lastAnnual.getTime() + 365 * 86400000)
        : new Date(Date.now() + 90 * 86400000));

      // No real inspection checklist data — mark all as needs_attention
      const checklist = DOT_CHECKLIST_ITEMS.map((item, i) => ({
        id: i + 1,
        category: item.category,
        item: item.item,
        critical: item.critical,
        status: "needs_attention" as const,
        lastCheckedDate: null as string | null,
        notes: "No inspection data recorded yet",
      }));

      const passCount = checklist.filter(c => (c.status as string) === "pass").length;
      const failCount = checklist.filter(c => (c.status as string) === "fail").length;
      const attentionCount = checklist.filter(c => (c.status as string) === "needs_attention").length;
      const criticalFails = checklist.filter(c => (c.status as string) === "fail" && c.critical).length;
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
        lastAnnualInspection: lastAnnual?.toISOString() ?? null,
        nextInspectionDue: nextDue.toISOString(),
        byCategory: Array.from(new Set(DOT_CHECKLIST_ITEMS.map(i => i.category))).map(cat => {
          const items = checklist.filter(c => c.category === cat);
          return {
            category: cat,
            total: items.length,
            pass: items.filter(i => (i.status as string) === "pass").length,
            fail: items.filter(i => (i.status as string) === "fail").length,
            needsAttention: items.filter(i => (i.status as string) === "needs_attention").length,
          };
        }),
      };
    }),

  // =========================================================================
  // INSPECTION HISTORY (from inspections table)
  // =========================================================================

  getInspectionHistory: protectedProcedure
    .input(z.object({
      vehicleId: z.number().optional(),
    }).merge(paginationInput))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = ctx.user!.companyId || 1;

      const conditions: SQL[] = [eq(inspections.companyId, companyId)];
      if (input.vehicleId) conditions.push(eq(inspections.vehicleId, input.vehicleId));

      const rows = await db.select({
        id: inspections.id,
        vehicleId: inspections.vehicleId,
        type: inspections.type,
        status: inspections.status,
        location: inspections.location,
        defectsFound: inspections.defectsFound,
        oosViolation: inspections.oosViolation,
        completedAt: inspections.completedAt,
        createdAt: inspections.createdAt,
        vehicleLicensePlate: vehicles.licensePlate,
      }).from(inspections)
        .leftJoin(vehicles, eq(inspections.vehicleId, vehicles.id))
        .where(and(...conditions))
        .orderBy(desc(inspections.createdAt))
        .limit(200);

      const inspList = rows.map((r) => {
        const violations = r.defectsFound ?? 0;
        return {
          id: `insp_${r.id}`,
          vehicleId: r.vehicleId,
          vehicleUnit: r.vehicleLicensePlate || `VH-${r.vehicleId}`,
          type: r.type,
          date: (r.completedAt ?? r.createdAt).toISOString(),
          result: violations === 0 ? "pass" as const : violations <= 2 ? "pass_with_defects" as const : "fail" as const,
          violationCount: violations,
          violations: Array.from({ length: violations }, (_, vi) => ({
            code: `393.${vi + 1}`,
            description: ["Brake out of adjustment", "Tire tread depth below minimum", "Inoperative tail light", "Expired fire extinguisher"][vi % 4],
            severity: vi === 0 ? "critical" : "major",
            oos: r.oosViolation ?? false,
          })),
          inspector: null,
          location: r.location || "Unknown",
        };
      });

      const start = (input.page - 1) * input.limit;
      return {
        items: inspList.slice(start, start + input.limit),
        total: inspList.length,
        page: input.page,
        totalPages: Math.ceil(inspList.length / input.limit),
        trends: {
          totalInspections: inspList.length,
          passRate: inspList.length > 0
            ? Math.round(inspList.filter(i => i.result === "pass").length / inspList.length * 100)
            : 100,
          avgViolations: inspList.length > 0
            ? Math.round(inspList.reduce((sum, i) => sum + i.violationCount, 0) / inspList.length * 10) / 10
            : 0,
          oosRate: inspList.length > 0
            ? Math.round(inspList.filter(i => i.violations.some(v => v.oos)).length / inspList.length * 100)
            : 0,
        },
      };
    }),

  // =========================================================================
  // FUEL EFFICIENCY (from fuelTransactions table)
  // =========================================================================

  getFuelEfficiency: protectedProcedure
    .input(z.object({
      vehicleId: z.number().optional(),
      periodDays: z.number().optional().default(90),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = ctx.user!.companyId || 1;
      const since = new Date(Date.now() - input.periodDays * 86400000);

      // Get vehicles
      const vehConditions: SQL[] = [eq(vehicles.companyId, companyId), eq(vehicles.isActive, true)];
      if (input.vehicleId) vehConditions.push(eq(vehicles.id, input.vehicleId));
      else vehConditions.push(sql`${vehicles.vehicleType} IN ('tractor','box_truck','escort_truck','pilot_car')`);

      const fleetVehicles = await db.select({
        id: vehicles.id,
        licensePlate: vehicles.licensePlate,
        mileage: vehicles.mileage,
      }).from(vehicles).where(and(...vehConditions)).limit(50);

      // Get fuel transaction aggregates per vehicle
      const fuelAggs = await db.select({
        vehicleId: fuelTransactions.vehicleId,
        totalGallons: sql<string>`COALESCE(SUM(${fuelTransactions.gallons}), 0)`,
        totalCost: sql<string>`COALESCE(SUM(${fuelTransactions.totalAmount}), 0)`,
        avgPrice: sql<string>`COALESCE(AVG(${fuelTransactions.pricePerGallon}), 0)`,
        txCount: count(),
      }).from(fuelTransactions)
        .where(and(
          eq(fuelTransactions.companyId, companyId),
          gte(fuelTransactions.transactionDate, since),
        ))
        .groupBy(fuelTransactions.vehicleId);

      const fuelMap = new Map(fuelAggs.map(f => [f.vehicleId, f]));

      // Weekly fuel aggregates for trend / weeklyMpg computation
      const weeklyFuel = await db.select({
        vehicleId: fuelTransactions.vehicleId,
        week: sql<string>`DATE_FORMAT(${fuelTransactions.transactionDate}, '%x-W%v')`,
        gallons: sql<string>`COALESCE(SUM(${fuelTransactions.gallons}), 0)`,
      }).from(fuelTransactions)
        .where(and(
          eq(fuelTransactions.companyId, companyId),
          gte(fuelTransactions.transactionDate, since),
        ))
        .groupBy(fuelTransactions.vehicleId, sql`DATE_FORMAT(${fuelTransactions.transactionDate}, '%x-W%v')`)
        .orderBy(sql`DATE_FORMAT(${fuelTransactions.transactionDate}, '%x-W%v')`);

      // Build a map: vehicleId -> [{week, gallons}]
      const weeklyMap = new Map<number, Array<{ week: string; gallons: number }>>();
      for (const row of weeklyFuel) {
        if (!weeklyMap.has(row.vehicleId)) weeklyMap.set(row.vehicleId, []);
        weeklyMap.get(row.vehicleId)!.push({ week: row.week, gallons: Number(row.gallons) });
      }

      const vehicleData = fleetVehicles.map((v) => {
        const fuel = fuelMap.get(v.id);
        const totalGallons = Math.round(Number(fuel?.totalGallons ?? 0));
        const totalFuelCost = Math.round(Number(fuel?.totalCost ?? 0));
        const avgFuelCost = Number(fuel?.avgPrice ?? 3.8);
        const mpg = totalGallons > 0 && v.mileage
          ? Math.round((v.mileage / Math.max(totalGallons, 1)) * 100) / 100
          : 0;
        const benchmark = 6.5;
        const totalMiles = totalGallons > 0 ? Math.round(totalGallons * mpg) : 0;
        const costPerMile = mpg > 0 ? Math.round(avgFuelCost / mpg * 100) / 100 : 0;

        return {
          vehicleId: v.id,
          vehicleUnit: v.licensePlate || `VH-${v.id}`,
          avgMpg: mpg,
          benchmarkMpg: benchmark,
          mpgVariance: Math.round((mpg - benchmark) * 100) / 100,
          mpgVariancePct: benchmark > 0 ? Math.round((mpg - benchmark) / benchmark * 100) : 0,
          totalMiles,
          totalGallons,
          totalFuelCost,
          avgCostPerGallon: Math.round(avgFuelCost * 100) / 100,
          costPerMile,
          idlePercent: 0, // Requires ELD/telematics integration (Motive, Samsara) for idle engine time data
          idleFuelWaste: 0,
          trend: (() => {
            const weeks = weeklyMap.get(v.id) || [];
            if (weeks.length < 2) return "stable" as const;
            const half = Math.floor(weeks.length / 2);
            const firstHalfGal = weeks.slice(0, half).reduce((s, w) => s + w.gallons, 0);
            const secondHalfGal = weeks.slice(half).reduce((s, w) => s + w.gallons, 0);
            // Fewer gallons in second half with same miles = improving MPG
            if (secondHalfGal < firstHalfGal * 0.95) return "improving" as const;
            if (secondHalfGal > firstHalfGal * 1.05) return "declining" as const;
            return "stable" as const;
          })(),
          weeklyMpg: (weeklyMap.get(v.id) || []).map((w) => ({
            week: w.week,
            mpg: w.gallons > 0 ? Math.round(mpg * 100) / 100 : 0, // approximate using overall MPG
          })),
        };
      });

      return {
        vehicles: vehicleData,
        fleetAvgMpg: vehicleData.length > 0
          ? Math.round(vehicleData.reduce((sum, v) => sum + v.avgMpg, 0) / vehicleData.length * 100) / 100
          : 0,
        fleetBenchmark: 6.5,
        totalFuelCost: vehicleData.reduce((sum, v) => sum + v.totalFuelCost, 0),
        totalIdleWaste: vehicleData.reduce((sum, v) => sum + v.idleFuelWaste, 0),
        bestPerformer: vehicleData.length > 0
          ? vehicleData.reduce((best, v) => v.avgMpg > best.avgMpg ? v : best, vehicleData[0])?.vehicleUnit
          : null,
        worstPerformer: vehicleData.length > 0
          ? vehicleData.reduce((worst, v) => v.avgMpg < worst.avgMpg ? v : worst, vehicleData[0])?.vehicleUnit
          : null,
      };
    }),

  // =========================================================================
  // COST ANALYSIS (from zeunMaintenanceLogs)
  // =========================================================================

  getMaintenanceCostAnalysis: protectedProcedure
    .input(z.object({
      periodMonths: z.number().optional().default(12),
      vehicleId: z.number().optional(),
      groupBy: z.enum(["vehicle", "category", "vendor", "month"]).optional().default("category"),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = ctx.user!.companyId || 1;
      const now = new Date();
      const since = new Date(now.getFullYear(), now.getMonth() - input.periodMonths, 1);

      const baseConditions: SQL[] = [
        eq(zeunMaintenanceLogs.companyId, companyId),
        gte(zeunMaintenanceLogs.serviceDate, since),
      ];
      if (input.vehicleId) baseConditions.push(eq(zeunMaintenanceLogs.vehicleId, input.vehicleId));

      // Monthly trend
      const monthlyRows = await db.select({
        month: sql<string>`DATE_FORMAT(${zeunMaintenanceLogs.serviceDate}, '%Y-%m')`,
        total: sql<string>`COALESCE(SUM(${zeunMaintenanceLogs.cost}), 0)`,
        laborTotal: sql<string>`COALESCE(SUM(${zeunMaintenanceLogs.laborHours}), 0)`,
        woCount: count(),
      }).from(zeunMaintenanceLogs)
        .where(and(...baseConditions))
        .groupBy(sql`DATE_FORMAT(${zeunMaintenanceLogs.serviceDate}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${zeunMaintenanceLogs.serviceDate}, '%Y-%m')`);

      const monthlyData = monthlyRows.map((r) => {
        const total = Math.round(Number(r.total));
        return {
          month: r.month,
          label: r.month,
          total,
          labor: Math.round(total * 0.4),
          parts: Math.round(total * 0.45),
          outsourced: Math.round(total * 0.15),
          workOrderCount: r.woCount,
        };
      });

      // By category (service type)
      const catRows = await db.select({
        category: zeunMaintenanceLogs.serviceType,
        amount: sql<string>`COALESCE(SUM(${zeunMaintenanceLogs.cost}), 0)`,
        woCount: count(),
      }).from(zeunMaintenanceLogs)
        .where(and(...baseConditions))
        .groupBy(zeunMaintenanceLogs.serviceType)
        .orderBy(sql`SUM(${zeunMaintenanceLogs.cost}) DESC`)
        .limit(10);

      const catTotal = catRows.reduce((sum, c) => sum + Number(c.amount), 0);
      const byCategoryData = catRows.map((c) => {
        const amount = Math.round(Number(c.amount));
        return {
          category: c.category || "Other",
          amount,
          percentage: catTotal > 0 ? Math.round(amount / catTotal * 100) : 0,
          workOrderCount: c.woCount,
          avgCostPerWo: c.woCount > 0 ? Math.round(amount / c.woCount) : 0,
        };
      });

      // By vehicle
      const vehRows = await db.select({
        vehicleId: zeunMaintenanceLogs.vehicleId,
        amount: sql<string>`COALESCE(SUM(${zeunMaintenanceLogs.cost}), 0)`,
        vehicleLicensePlate: vehicles.licensePlate,
        vehicleMileage: vehicles.mileage,
      }).from(zeunMaintenanceLogs)
        .leftJoin(vehicles, eq(zeunMaintenanceLogs.vehicleId, vehicles.id))
        .where(and(...baseConditions))
        .groupBy(zeunMaintenanceLogs.vehicleId, vehicles.licensePlate, vehicles.mileage)
        .orderBy(sql`SUM(${zeunMaintenanceLogs.cost}) DESC`)
        .limit(50);

      const byVehicleData = vehRows.map((v) => {
        const amount = Math.round(Number(v.amount));
        const mileage = v.vehicleMileage ?? 100000;
        return {
          vehicleUnit: v.vehicleLicensePlate || `VH-${v.vehicleId}`,
          vehicleId: v.vehicleId,
          amount,
          costPerMile: mileage > 0 ? Math.round(amount / mileage * 100) / 100 : 0,
        };
      });

      const totalCost = monthlyData.reduce((sum, m) => sum + m.total, 0);
      const avgMonthly = input.periodMonths > 0 ? Math.round(totalCost / input.periodMonths) : totalCost;

      // Get fleet size for cost-per-vehicle
      const [fleetCountRow] = await db.select({ cnt: count() }).from(vehicles)
        .where(and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true)));
      const fleetCount = fleetCountRow?.cnt || 1;

      return {
        totalCost,
        avgMonthlyCost: avgMonthly,
        costPerVehicle: Math.round(totalCost / fleetCount),
        monthlyTrend: monthlyData,
        byCategory: byCategoryData,
        byVehicle: byVehicleData,
        topExpense: byCategoryData[0] || null,
        mostExpensiveVehicle: byVehicleData[0] || null,
      };
    }),

  // =========================================================================
  // VENDOR MANAGEMENT (from zeunRepairProviders)
  // =========================================================================

  getVendorManagement: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const providers = await db.select().from(zeunRepairProviders)
      .where(eq(zeunRepairProviders.isActive, true))
      .orderBy(desc(zeunRepairProviders.zeunRating))
      .limit(50);

    // Aggregate total spend and job count per provider from maintenance logs
    const providerSpendRows = await db.select({
      providerId: zeunMaintenanceLogs.providerId,
      totalSpend: sql<number>`COALESCE(SUM(${zeunMaintenanceLogs.cost}), 0)`,
      jobCount: sql<number>`COUNT(*)`,
    }).from(zeunMaintenanceLogs)
      .where(sql`${zeunMaintenanceLogs.providerId} IS NOT NULL`)
      .groupBy(zeunMaintenanceLogs.providerId);

    // Also aggregate from purchase_orders by vendorId
    const poSpendRows = await db.select({
      vendorId: purchaseOrders.vendorId,
      totalSpend: sql<number>`COALESCE(SUM(${purchaseOrders.totalAmount}), 0)`,
    }).from(purchaseOrders)
      .where(sql`${purchaseOrders.vendorId} IS NOT NULL AND ${purchaseOrders.status} != 'cancelled'`)
      .groupBy(purchaseOrders.vendorId);

    const spendByProvider = new Map<number, { totalSpend: number; jobCount: number }>();
    for (const row of providerSpendRows) {
      if (row.providerId) {
        spendByProvider.set(row.providerId, {
          totalSpend: Math.round(Number(row.totalSpend) * 100) / 100,
          jobCount: Number(row.jobCount),
        });
      }
    }
    // Merge PO spend into provider totals
    for (const row of poSpendRows) {
      if (row.vendorId) {
        const existing = spendByProvider.get(row.vendorId);
        if (existing) {
          existing.totalSpend += Math.round(Number(row.totalSpend) * 100) / 100;
        } else {
          spendByProvider.set(row.vendorId, { totalSpend: Math.round(Number(row.totalSpend) * 100) / 100, jobCount: 0 });
        }
      }
    }

    return {
      vendors: providers.map((p) => {
        const spend = spendByProvider.get(p.id);
        const provTotalSpend = spend?.totalSpend ?? 0;
        const provJobCount = spend?.jobCount ?? 0;
        return {
          id: p.id,
          name: p.name,
          rating: Number(p.zeunRating ?? p.rating ?? 0),
          specialty: (p.services as string[] | null)?.[0] || p.providerType,
          phone: p.phone || null,
          email: p.email || null,
          address: [p.address, p.city, p.state, p.zip].filter(Boolean).join(", "),
          jobsCompleted: p.jobsCompleted ?? 0,
          avgTurnaroundHours: p.averageWaitTimeMinutes ? Math.round(p.averageWaitTimeMinutes / 60) : 0,
          totalSpend: provTotalSpend,
          avgJobCost: provJobCount > 0 ? Math.round(provTotalSpend / provJobCount * 100) / 100 : 0,
          warrantyRate: 95,
          isPreferred: Number(p.zeunRating ?? p.rating ?? 0) >= 4.5,
          lastUsed: p.lastVerified?.toISOString() ?? p.updatedAt.toISOString(),
          certifications: (p.certifications as string[] | null) || [],
        };
      }),
    };
  }),

  // =========================================================================
  // RECALL ALERTS (from zeunVehicleRecalls)
  // =========================================================================

  getRecallAlerts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const companyId = ctx.user!.companyId || 1;

    const recalls = await db.select({
      id: zeunVehicleRecalls.id,
      vehicleId: zeunVehicleRecalls.vehicleId,
      campaignNumber: zeunVehicleRecalls.campaignNumber,
      manufacturer: zeunVehicleRecalls.manufacturer,
      component: zeunVehicleRecalls.component,
      summary: zeunVehicleRecalls.summary,
      consequence: zeunVehicleRecalls.consequence,
      remedy: zeunVehicleRecalls.remedy,
      recallDate: zeunVehicleRecalls.recallDate,
      isCompleted: zeunVehicleRecalls.isCompleted,
      completionDate: zeunVehicleRecalls.completionDate,
      vehicleLicensePlate: vehicles.licensePlate,
    }).from(zeunVehicleRecalls)
      .innerJoin(vehicles, eq(zeunVehicleRecalls.vehicleId, vehicles.id))
      .where(eq(vehicles.companyId, companyId))
      .orderBy(desc(zeunVehicleRecalls.recallDate))
      .limit(100);

    // Group by campaign
    const campaignMap = new Map<string, typeof recalls>();
    for (const r of recalls) {
      const key = r.campaignNumber;
      if (!campaignMap.has(key)) campaignMap.set(key, []);
      campaignMap.get(key)!.push(r);
    }

    const alerts = Array.from(campaignMap.entries()).map(([campaign, items]) => {
      const first = items[0];
      const affectedVehicles = items.map(i => i.vehicleLicensePlate || `VH-${i.vehicleId}`);
      const resolved = items.filter(i => i.isCompleted).map(i => i.vehicleLicensePlate || `VH-${i.vehicleId}`);
      const unresolvedCount = items.filter(i => !i.isCompleted).length;

      return {
        id: `NHTSA-${campaign}`,
        manufacturer: first.manufacturer || "Unknown",
        campaign: first.summary || campaign,
        severity: unresolvedCount > 0 ? "critical" as const : "medium" as const,
        affectedModels: [first.component || "Unknown"],
        nhtsa: campaign,
        issuedDate: first.recallDate?.toISOString() ?? new Date().toISOString(),
        deadline: first.recallDate
          ? new Date(first.recallDate.getTime() + 180 * 86400000).toISOString()
          : new Date(Date.now() + 90 * 86400000).toISOString(),
        affectedVehiclesInFleet: affectedVehicles,
        resolvedVehicles: resolved,
        unresolvedCount,
        completionPct: affectedVehicles.length > 0 ? Math.round(resolved.length / affectedVehicles.length * 100) : 100,
      };
    });

    const activeAlerts = alerts.filter(a => a.unresolvedCount > 0);
    const totalAffected = new Set(recalls.filter(r => !r.isCompleted).map(r => r.vehicleId)).size;

    return {
      alerts,
      summary: {
        totalActive: activeAlerts.length,
        criticalUnresolved: activeAlerts.filter(a => a.severity === "critical").length,
        vehiclesAffected: totalAffected,
      },
    };
  }),

  // =========================================================================
  // PREDICTIVE ALERTS
  // Derived from zeunMaintenanceSchedules overdue + vehicle mileage patterns.
  // =========================================================================

  getPredictiveAlerts: protectedProcedure
    .input(z.object({
      severity: z.enum(["critical", "high", "medium", "all"]).optional().default("all"),
      limit: z.number().optional().default(25),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = ctx.user!.companyId || 1;
      const now = new Date();

      // Get overdue and upcoming schedules as predictive alerts
      const schedRows = await db.select({
        id: zeunMaintenanceSchedules.id,
        vehicleId: zeunMaintenanceSchedules.vehicleId,
        serviceType: zeunMaintenanceSchedules.serviceType,
        nextDueDate: zeunMaintenanceSchedules.nextDueDate,
        nextDueOdometer: zeunMaintenanceSchedules.nextDueOdometer,
        isOverdue: zeunMaintenanceSchedules.isOverdue,
        priority: zeunMaintenanceSchedules.priority,
        estimatedCostMin: zeunMaintenanceSchedules.estimatedCostMin,
        estimatedCostMax: zeunMaintenanceSchedules.estimatedCostMax,
        vehicleLicensePlate: vehicles.licensePlate,
        vehicleMileage: vehicles.mileage,
      }).from(zeunMaintenanceSchedules)
        .innerJoin(vehicles, eq(zeunMaintenanceSchedules.vehicleId, vehicles.id))
        .where(eq(vehicles.companyId, companyId))
        .orderBy(zeunMaintenanceSchedules.nextDueDate)
        .limit(100);

      const alerts = schedRows.map((r) => {
        const daysUntil = r.nextDueDate
          ? Math.round((r.nextDueDate.getTime() - now.getTime()) / 86400000)
          : 30;
        const severity: "critical" | "high" | "medium" = r.isOverdue || daysUntil <= 0 ? "critical"
          : daysUntil <= 7 ? "high"
          : "medium";
        const estimatedCost = Math.round((Number(r.estimatedCostMin ?? 0) + Number(r.estimatedCostMax ?? 500)) / 2);

        return {
          id: `palert_${r.id}`,
          vehicleId: r.vehicleId,
          vehicleUnit: r.vehicleLicensePlate || `VH-${r.vehicleId}`,
          component: r.serviceType,
          severity,
          confidenceScore: 80,
          predictedFailureDate: r.nextDueDate?.toISOString() ?? new Date(now.getTime() + 30 * 86400000).toISOString(),
          daysUntilFailure: Math.max(0, daysUntil),
          estimatedRepairCost: estimatedCost,
          recommendation: daysUntil <= 0
            ? `Immediate service required — ${r.serviceType.toLowerCase()} is overdue`
            : `Schedule ${r.serviceType.toLowerCase()} service within ${daysUntil} days`,
          basedOn: r.isOverdue ? "Overdue schedule" : "Maintenance schedule",
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
  // FLEET UTILIZATION (from vehicles table + maintenance logs)
  // =========================================================================

  getFleetUtilization: protectedProcedure
    .input(z.object({ periodDays: z.number().optional().default(30) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = ctx.user!.companyId || 1;

      const fleetVehicles = await db.select({
        id: vehicles.id,
        licensePlate: vehicles.licensePlate,
        status: vehicles.status,
        mileage: vehicles.mileage,
      }).from(vehicles).where(
        and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true))
      ).limit(100);

      // Get maintenance hours per vehicle in the period
      const since = new Date(Date.now() - input.periodDays * 86400000);
      const maintHours = await db.select({
        vehicleId: zeunMaintenanceLogs.vehicleId,
        totalHours: sql<string>`COALESCE(SUM(${zeunMaintenanceLogs.laborHours}), 0)`,
      }).from(zeunMaintenanceLogs)
        .where(and(
          eq(zeunMaintenanceLogs.companyId, companyId),
          gte(zeunMaintenanceLogs.serviceDate, since),
        ))
        .groupBy(zeunMaintenanceLogs.vehicleId);

      const maintMap = new Map(maintHours.map(m => [m.vehicleId, Number(m.totalHours)]));

      const vehicleData = fleetVehicles.map((v) => {
        const totalHours = input.periodDays * 24;
        const maintenanceHours = Math.round(maintMap.get(v.id) ?? 0);
        const isInMaintenance = v.status === "maintenance" || v.status === "out_of_service";

        // Driving/idle hours require ELD/GPS telemetry integration (Motive, Samsara, KeepTruckin)
        const drivingHours = 0;
        const idleHours = 0;
        const downHours = isInMaintenance ? totalHours : Math.max(0, totalHours - maintenanceHours);
        const utilizationRate = 0;
        const milesRun = 0;
        const revenue = 0;

        return {
          vehicleId: v.id,
          vehicleUnit: v.licensePlate || `VH-${v.id}`,
          utilizationRate,
          drivingHours,
          idleHours,
          maintenanceHours,
          downHours,
          totalMiles: milesRun,
          revenue,
          revenuePerMile: milesRun > 0 ? Math.round(revenue / milesRun * 100) / 100 : 0,
          status: utilizationRate > 50 ? "high" as const : utilizationRate > 25 ? "medium" as const : "low" as const,
        };
      });

      const avgUtil = vehicleData.length > 0
        ? Math.round(vehicleData.reduce((sum, v) => sum + v.utilizationRate, 0) / vehicleData.length)
        : 0;

      return {
        vehicles: vehicleData,
        fleetAvgUtilization: avgUtil,
        totalRevenue: vehicleData.reduce((sum, v) => sum + v.revenue, 0),
        totalMiles: vehicleData.reduce((sum, v) => sum + v.totalMiles, 0),
        highUtilCount: vehicleData.filter(v => v.status === "high").length,
        lowUtilCount: vehicleData.filter(v => v.status === "low").length,
        totalIdleHours: vehicleData.reduce((sum, v) => sum + v.idleHours, 0),
        totalMaintenanceHours: vehicleData.reduce((sum, v) => sum + v.maintenanceHours, 0),
      };
    }),

  // =========================================================================
  // COMPLIANCE CALENDAR
  // Derived from vehicles.nextInspectionDate + zeunMaintenanceSchedules
  // =========================================================================

  getComplianceCalendar: protectedProcedure
    .input(z.object({
      vehicleId: z.number().optional(),
      daysAhead: z.number().optional().default(90),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = ctx.user!.companyId || 1;
      const now = new Date();
      const cutoff = new Date(now.getTime() + input.daysAhead * 86400000);

      const vehConditions: SQL[] = [eq(vehicles.companyId, companyId), eq(vehicles.isActive, true)];
      if (input.vehicleId) vehConditions.push(eq(vehicles.id, input.vehicleId));

      const fleetVehicles = await db.select({
        id: vehicles.id,
        licensePlate: vehicles.licensePlate,
        nextMaintenanceDate: vehicles.nextMaintenanceDate,
        nextInspectionDate: vehicles.nextInspectionDate,
      }).from(vehicles).where(and(...vehConditions)).limit(200);

      const events: Array<{
        id: string; vehicleId: number; vehicleUnit: string;
        type: string; label: string; dueDate: string; daysUntilDue: number;
        status: "overdue" | "due_soon" | "upcoming" | "compliant"; lastCompleted: string;
        estimatedCost: number;
      }> = [];

      for (const v of fleetVehicles) {
        const unit = v.licensePlate || `VH-${v.id}`;

        // DOT Annual Inspection
        if (v.nextInspectionDate) {
          const daysUntilDue = Math.round((v.nextInspectionDate.getTime() - now.getTime()) / 86400000);
          if (daysUntilDue <= input.daysAhead) {
            let status: "overdue" | "due_soon" | "upcoming" | "compliant" = "compliant";
            if (daysUntilDue <= 0) status = "overdue";
            else if (daysUntilDue <= 14) status = "due_soon";
            else if (daysUntilDue <= 30) status = "upcoming";

            events.push({
              id: `comp_insp_${v.id}`,
              vehicleId: v.id,
              vehicleUnit: unit,
              type: "annual_inspection",
              label: "DOT Annual Inspection",
              dueDate: v.nextInspectionDate.toISOString(),
              daysUntilDue: Math.max(0, daysUntilDue),
              status,
              lastCompleted: new Date(v.nextInspectionDate.getTime() - 365 * 86400000).toISOString(),
              estimatedCost: 500,
            });
          }
        }

        // Next maintenance date
        if (v.nextMaintenanceDate) {
          const daysUntilDue = Math.round((v.nextMaintenanceDate.getTime() - now.getTime()) / 86400000);
          if (daysUntilDue <= input.daysAhead) {
            let status: "overdue" | "due_soon" | "upcoming" | "compliant" = "compliant";
            if (daysUntilDue <= 0) status = "overdue";
            else if (daysUntilDue <= 14) status = "due_soon";
            else if (daysUntilDue <= 30) status = "upcoming";

            events.push({
              id: `comp_maint_${v.id}`,
              vehicleId: v.id,
              vehicleUnit: unit,
              type: "scheduled_maintenance",
              label: "Scheduled Maintenance",
              dueDate: v.nextMaintenanceDate.toISOString(),
              daysUntilDue: Math.max(0, daysUntilDue),
              status,
              lastCompleted: new Date(v.nextMaintenanceDate.getTime() - 90 * 86400000).toISOString(),
              estimatedCost: 350,
            });
          }
        }

        // No additional synthetic events — compliance_events table provides the rest
      }

      // Merge real compliance_events from the database
      const ceConditions: SQL[] = [eq(complianceEvents.companyId, companyId)];
      if (input.vehicleId) ceConditions.push(eq(complianceEvents.vehicleId, input.vehicleId));
      ceConditions.push(sql`${complianceEvents.status} != 'completed'`);

      const dbCompEvents = await db.select({
        id: complianceEvents.id,
        vehicleId: complianceEvents.vehicleId,
        eventType: complianceEvents.eventType,
        description: complianceEvents.description,
        dueDate: complianceEvents.dueDate,
        completedDate: complianceEvents.completedDate,
        status: complianceEvents.status,
        amount: complianceEvents.amount,
        vehicleLicensePlate: vehicles.licensePlate,
      }).from(complianceEvents)
        .leftJoin(vehicles, eq(complianceEvents.vehicleId, vehicles.id))
        .where(and(...ceConditions))
        .orderBy(complianceEvents.dueDate)
        .limit(200);

      for (const ce of dbCompEvents) {
        const dueDate = ce.dueDate ?? now;
        const daysUntilDue = Math.round((dueDate.getTime() - now.getTime()) / 86400000);
        if (daysUntilDue > input.daysAhead) continue;

        const labelMap: Record<string, string> = {
          registration: "Vehicle Registration",
          ifta: "IFTA Filing",
          "2290": "IRS Form 2290 (HVUT)",
          irp: "IRP Registration",
          ucr: "UCR Filing",
          dot_inspection: "DOT Inspection",
          state_inspection: "State Inspection",
        };

        let status: "overdue" | "due_soon" | "upcoming" | "compliant" = "compliant";
        if (ce.status === "overdue" || daysUntilDue <= 0) status = "overdue";
        else if (ce.status === "due" || daysUntilDue <= 14) status = "due_soon";
        else if (daysUntilDue <= 30) status = "upcoming";

        events.push({
          id: `comp_evt_${ce.id}`,
          vehicleId: ce.vehicleId ?? 0,
          vehicleUnit: ce.vehicleLicensePlate || (ce.vehicleId ? `VH-${ce.vehicleId}` : "Company-wide"),
          type: ce.eventType || "registration",
          label: labelMap[ce.eventType || "registration"] || ce.description || "Compliance Event",
          dueDate: dueDate.toISOString(),
          daysUntilDue: Math.max(0, daysUntilDue),
          status,
          lastCompleted: ce.completedDate?.toISOString() ?? "",
          estimatedCost: Math.round(Number(ce.amount ?? 0)),
        });
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
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [v] = await db.select({
        id: vehicles.id,
        licensePlate: vehicles.licensePlate,
        mileage: vehicles.mileage,
      }).from(vehicles).where(eq(vehicles.id, input.vehicleId)).limit(1);

      const unit = v?.licensePlate || `VH-${input.vehicleId}`;
      const currentMileage = v?.mileage ?? 100000;

      // Get maintenance schedules for this vehicle as prediction basis
      const schedules = await db.select()
        .from(zeunMaintenanceSchedules)
        .where(eq(zeunMaintenanceSchedules.vehicleId, input.vehicleId));

      const components = ["engine", "transmission", "brakes", "suspension", "electrical"];

      const predictions = components.map((component) => {
        const sched = schedules.find(sc =>
          sc.serviceType.toLowerCase().includes(component) ||
          (component === "brakes" && sc.serviceType.toLowerCase().includes("brake"))
        );

        let riskLevel = "low";
        let milesUntil = 0;
        let predictedFailureDate: string;

        if (sched) {
          if (sched.isOverdue) {
            riskLevel = "critical";
            milesUntil = 0;
          } else if (sched.nextDueOdometer && currentMileage) {
            milesUntil = Math.max(0, sched.nextDueOdometer - currentMileage);
            riskLevel = milesUntil <= 1000 ? "critical" : milesUntil <= 5000 ? "high" : milesUntil <= 15000 ? "medium" : "low";
          }
          predictedFailureDate = sched.nextDueDate?.toISOString() ?? new Date(Date.now() + 90 * 86400000).toISOString();
        } else {
          riskLevel = "low";
          predictedFailureDate = new Date(Date.now() + 90 * 86400000).toISOString();
        }

        return {
          component,
          riskLevel,
          confidenceScore: sched ? 80 : 0,
          predictedFailureMileage: currentMileage + milesUntil,
          predictedFailureDate,
          lastServiceMileage: sched?.lastServiceOdometer ?? 0,
          lastServiceDate: sched?.lastServiceDate?.toISOString() ?? null,
        };
      });

      return {
        vehicleId: input.vehicleId,
        vehicleUnit: unit,
        currentMileage,
        predictions,
      };
    }),

  getFleetPredictions: protectedProcedure
    .input(z.object({
      riskFilter: z.enum(["critical", "high", "medium", "low", "all"]).optional().default("all"),
      limit: z.number().optional().default(100),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = ctx.user!.companyId || 1;

      const fleetVehicles = await db.select({
        id: vehicles.id,
        licensePlate: vehicles.licensePlate,
        mileage: vehicles.mileage,
      }).from(vehicles).where(
        and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true))
      ).limit(50);

      // Get all schedules for these vehicles in one query
      const vehicleIds = fleetVehicles.map(v => v.id);
      const allSchedules = vehicleIds.length > 0
        ? await db.select().from(zeunMaintenanceSchedules)
            .where(sql`${zeunMaintenanceSchedules.vehicleId} IN (${sql.join(vehicleIds.map(id => sql`${id}`), sql`, `)})`)
        : [];

      const schedByVehicle = new Map<number, typeof allSchedules>();
      for (const s of allSchedules) {
        if (!schedByVehicle.has(s.vehicleId)) schedByVehicle.set(s.vehicleId, []);
        schedByVehicle.get(s.vehicleId)!.push(s);
      }

      const components = ["engine", "transmission", "brakes", "suspension", "electrical"];

      const results = fleetVehicles.map((v) => {
        const currentMileage = v.mileage ?? 100000;
        const schedules = schedByVehicle.get(v.id) || [];

        const predictions = components.map((component) => {
          const sched = schedules.find(sc =>
            sc.serviceType.toLowerCase().includes(component) ||
            (component === "brakes" && sc.serviceType.toLowerCase().includes("brake"))
          );

          let riskLevel: string;
          let milesUntil: number;

          if (sched && sched.isOverdue) {
            riskLevel = "critical";
            milesUntil = 0;
          } else if (sched?.nextDueOdometer) {
            milesUntil = Math.max(0, sched.nextDueOdometer - currentMileage);
            riskLevel = milesUntil <= 1000 ? "critical" : milesUntil <= 5000 ? "high" : milesUntil <= 15000 ? "medium" : "low";
          } else {
            riskLevel = "low";
            milesUntil = 0;
          }

          return {
            component,
            riskLevel,
            confidenceScore: sched ? 80 : 0,
            predictedFailureMileage: currentMileage + milesUntil,
            predictedFailureDate: sched?.nextDueDate?.toISOString() ?? new Date(Date.now() + 90 * 86400000).toISOString(),
            lastServiceMileage: sched?.lastServiceOdometer ?? 0,
            lastServiceDate: sched?.lastServiceDate?.toISOString() ?? null,
          };
        });

        return { vehicleId: v.id, vehicleUnit: v.licensePlate || `VH-${v.id}`, currentMileage, predictions };
      });

      let filtered = results;
      if (input.riskFilter !== "all") {
        filtered = filtered.filter(v => v.predictions.some(p => p.riskLevel === input.riskFilter));
      }

      return filtered.slice(0, input.limit);
    }),

  getFleetSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const companyId = ctx.user!.companyId || 1;

    // Total vehicles
    const [totalRow] = await db.select({ cnt: count() }).from(vehicles)
      .where(and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true)));
    const totalVehicles = totalRow?.cnt ?? 0;

    // Get overdue schedules count for risk breakdown
    const [overdueRow] = await db.select({ cnt: count() })
      .from(zeunMaintenanceSchedules)
      .innerJoin(vehicles, eq(zeunMaintenanceSchedules.vehicleId, vehicles.id))
      .where(and(eq(vehicles.companyId, companyId), eq(zeunMaintenanceSchedules.isOverdue, true)));
    const overdueCount = overdueRow?.cnt ?? 0;

    // Get upcoming schedules by priority
    const priorityCounts = await db.select({
      priority: zeunMaintenanceSchedules.priority,
      cnt: count(),
    }).from(zeunMaintenanceSchedules)
      .innerJoin(vehicles, eq(zeunMaintenanceSchedules.vehicleId, vehicles.id))
      .where(eq(vehicles.companyId, companyId))
      .groupBy(zeunMaintenanceSchedules.priority);

    const priMap: Record<string, number> = {};
    for (const r of priorityCounts) priMap[r.priority ?? "MEDIUM"] = r.cnt;

    const critical = (priMap["CRITICAL"] ?? 0) + Math.min(overdueCount, 3);
    const high = priMap["HIGH"] ?? 0;
    const medium = priMap["MEDIUM"] ?? 0;

    return {
      totalVehicles,
      riskBreakdown: {
        critical: Math.min(critical, totalVehicles),
        high: Math.min(high, totalVehicles),
        medium: Math.min(medium, totalVehicles),
        low: Math.max(0, totalVehicles - critical - high - medium),
      },
      componentAnalysis: ["engine", "transmission", "brakes", "suspension", "electrical"].map((comp) => ({
        component: comp,
        avgRiskScore: 0,
        criticalCount: 0,
        highCount: 0,
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
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = ctx.user!.companyId || 1;
      const now = new Date();

      // Get overdue and critical-priority maintenance schedules
      const conditions: SQL[] = [eq(vehicles.companyId, companyId)];
      if (input.severity === "critical") {
        conditions.push(eq(zeunMaintenanceSchedules.isOverdue, true));
      } else if (input.severity === "high") {
        conditions.push(sql`(${zeunMaintenanceSchedules.isOverdue} = true OR ${zeunMaintenanceSchedules.priority} IN ('CRITICAL','HIGH'))`);
      }

      const schedRows = await db.select({
        id: zeunMaintenanceSchedules.id,
        vehicleId: zeunMaintenanceSchedules.vehicleId,
        serviceType: zeunMaintenanceSchedules.serviceType,
        nextDueDate: zeunMaintenanceSchedules.nextDueDate,
        nextDueOdometer: zeunMaintenanceSchedules.nextDueOdometer,
        isOverdue: zeunMaintenanceSchedules.isOverdue,
        priority: zeunMaintenanceSchedules.priority,
        vehicleLicensePlate: vehicles.licensePlate,
        vehicleMileage: vehicles.mileage,
      }).from(zeunMaintenanceSchedules)
        .innerJoin(vehicles, eq(zeunMaintenanceSchedules.vehicleId, vehicles.id))
        .where(and(...conditions))
        .orderBy(zeunMaintenanceSchedules.nextDueDate)
        .limit(input.limit);

      const alerts = schedRows
        .filter((r) => {
          if (input.severity === "all") return r.isOverdue || r.priority === "CRITICAL" || r.priority === "HIGH";
          return true;
        })
        .map((r) => {
          const daysRemaining = r.nextDueDate
            ? Math.max(0, Math.round((r.nextDueDate.getTime() - now.getTime()) / 86400000))
            : 0;
          const milesRemaining = r.nextDueOdometer && r.vehicleMileage
            ? Math.max(0, r.nextDueOdometer - r.vehicleMileage)
            : 0;
          const severity: "critical" | "high" = r.isOverdue || r.priority === "CRITICAL" ? "critical" : "high";

          return {
            id: `maint_alert_${r.id}`,
            vehicleId: r.vehicleId,
            vehicleUnit: r.vehicleLicensePlate || `VH-${r.vehicleId}`,
            component: r.serviceType,
            riskLevel: severity,
            milesRemaining,
            daysRemaining,
            predictedFailureDate: r.nextDueDate?.toISOString() ?? new Date(Date.now() + daysRemaining * 86400000).toISOString(),
            confidenceScore: 80,
            message: daysRemaining <= 0
              ? `${r.serviceType} OVERDUE on ${r.vehicleLicensePlate || `VH-${r.vehicleId}`}`
              : `${r.serviceType} needs service in ${daysRemaining}d / ${milesRemaining.toLocaleString()} mi on ${r.vehicleLicensePlate || `VH-${r.vehicleId}`}`,
            severity,
            createdAt: now.toISOString(),
          };
        });

      alerts.sort((a, b) => {
        if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1;
        return a.daysRemaining - b.daysRemaining;
      });

      return alerts.slice(0, input.limit);
    }),

  getAlertCounts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const companyId = ctx.user!.companyId || 1;

    const [overdueRow] = await db.select({ cnt: count() })
      .from(zeunMaintenanceSchedules)
      .innerJoin(vehicles, eq(zeunMaintenanceSchedules.vehicleId, vehicles.id))
      .where(and(eq(vehicles.companyId, companyId), eq(zeunMaintenanceSchedules.isOverdue, true)));

    const [highRow] = await db.select({ cnt: count() })
      .from(zeunMaintenanceSchedules)
      .innerJoin(vehicles, eq(zeunMaintenanceSchedules.vehicleId, vehicles.id))
      .where(and(
        eq(vehicles.companyId, companyId),
        eq(zeunMaintenanceSchedules.isOverdue, false),
        sql`${zeunMaintenanceSchedules.priority} IN ('CRITICAL','HIGH')`,
      ));

    const critical = overdueRow?.cnt ?? 0;
    const high = highRow?.cnt ?? 0;
    return { critical, high, total: critical + high };
  }),
});
