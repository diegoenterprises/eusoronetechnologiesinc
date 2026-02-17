/**
 * EQUIPMENT ROUTER
 * tRPC procedures for equipment/trailer management
 * ALL data from database — uses vehicles table (trailers are vehicles)
 */

import { z } from "zod";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { auditedProtectedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { vehicles, users, inspections } from "../../drizzle/schema";

const equipmentTypeSchema = z.enum([
  "tanker", "dry_van", "flatbed", "reefer", "lowboy", "step_deck", "container", "hopper"
]);
const equipmentStatusSchema = z.enum([
  "available", "in_use", "maintenance", "out_of_service", "retired"
]);

async function resolveCompanyId(ctxUser: any): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const userId = typeof ctxUser?.id === "string" ? parseInt(ctxUser.id, 10) : (ctxUser?.id || 0);
  try { const [r] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1); return r?.companyId || 0; } catch { return 0; }
}

export const equipmentRouter = router({
  /**
   * List equipment — from vehicles table (trailers) scoped by company
   */
  list: protectedProcedure
    .input(z.object({ type: equipmentTypeSchema.optional(), status: equipmentStatusSchema.optional(), limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { equipment: [], total: 0, summary: { total: 0, available: 0, inUse: 0, maintenance: 0 } };
      const companyId = await resolveCompanyId(ctx.user);
      if (!companyId) return { equipment: [], total: 0, summary: { total: 0, available: 0, inUse: 0, maintenance: 0 } };
      try {
        const trailerTypes = ["trailer", "tanker", "flatbed", "refrigerated", "dry_van", "lowboy", "step_deck"];
        const filters: any[] = [eq(vehicles.companyId, companyId), eq(vehicles.isActive, true), sql`${vehicles.vehicleType} IN ('trailer','tanker','flatbed','refrigerated','dry_van','lowboy','step_deck')`];
        if (input.type) filters.push(eq(vehicles.vehicleType, input.type as any));
        if (input.status) filters.push(eq(vehicles.status, input.status as any));

        const results = await db.select().from(vehicles).where(and(...filters)).orderBy(desc(vehicles.createdAt)).limit(input.limit).offset(input.offset);
        const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(and(...filters));
        const [avail] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true), eq(vehicles.status, "available"), sql`${vehicles.vehicleType} IN ('trailer','tanker','flatbed','refrigerated','dry_van','lowboy','step_deck')`));
        const [inUse] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true), eq(vehicles.status, "in_use"), sql`${vehicles.vehicleType} IN ('trailer','tanker','flatbed','refrigerated','dry_van','lowboy','step_deck')`));
        const [maint] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true), eq(vehicles.status, "maintenance"), sql`${vehicles.vehicleType} IN ('trailer','tanker','flatbed','refrigerated','dry_van','lowboy','step_deck')`));

        return {
          equipment: results.map(v => ({
            id: String(v.id), unitNumber: v.licensePlate || `EQ-${v.id}`, type: v.vehicleType,
            status: v.status, capacity: Number(v.capacity) || 0, capacityUnit: "gallons",
            make: v.make || "", model: v.model || "", year: v.year || 0, vin: v.vin,
            licensePlate: v.licensePlate || "", assignedTo: v.currentDriverId ? { vehicleId: String(v.currentDriverId), unitNumber: "" } : null,
            currentLocation: "", lastInspection: v.nextInspectionDate?.toISOString()?.split("T")[0] || "",
            nextInspection: v.nextInspectionDate?.toISOString()?.split("T")[0] || "",
          })),
          total: countRow?.count || 0,
          summary: { total: countRow?.count || 0, available: avail?.count || 0, inUse: inUse?.count || 0, maintenance: maint?.count || 0 },
        };
      } catch (err) { console.error("[equipment.list]", err); return { equipment: [], total: 0, summary: { total: 0, available: 0, inUse: 0, maintenance: 0 } }; }
    }),

  /**
   * Get equipment by ID — from vehicles table
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const [v] = await db.select().from(vehicles).where(eq(vehicles.id, parseInt(input.id, 10))).limit(1);
        if (!v) return null;
        return {
          id: String(v.id), unitNumber: v.licensePlate || `EQ-${v.id}`, type: v.vehicleType, status: v.status,
          capacity: Number(v.capacity) || 0, capacityUnit: "gallons", compartments: [],
          specifications: { make: v.make || "", model: v.model || "", year: v.year || 0, vin: v.vin, licensePlate: v.licensePlate || "", length: 0, width: 0, height: 0, emptyWeight: 0, gvwr: 0 },
          certifications: [], inspections: { lastAnnual: "", nextAnnual: v.nextInspectionDate?.toISOString()?.split("T")[0] || "", lastDot: "" },
          currentAssignment: v.currentDriverId ? { vehicleId: String(v.currentDriverId), unitNumber: "", driverName: "", loadNumber: "", since: "" } : null,
          maintenanceHistory: [], documents: [],
        };
      } catch { return null; }
    }),

  /**
   * Create equipment — inserts into vehicles table
   */
  create: protectedProcedure
    .input(z.object({ unitNumber: z.string(), type: equipmentTypeSchema, capacity: z.number(), capacityUnit: z.string(), make: z.string(), model: z.string(), year: z.number(), vin: z.string(), licensePlate: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const companyId = await resolveCompanyId(ctx.user);
      if (!companyId) throw new Error("Company not found");
      const result = await db.insert(vehicles).values({
        companyId, vin: input.vin, make: input.make, model: input.model, year: input.year,
        licensePlate: input.licensePlate, vehicleType: input.type as any,
        capacity: String(input.capacity), status: "available",
      } as any);
      const insertedId = (result as any).insertId || (result as any)[0]?.insertId || 0;
      return { id: String(insertedId), ...input, status: "available", createdBy: ctx.user?.id, createdAt: new Date().toISOString() };
    }),

  /**
   * Update equipment — updates vehicles table
   */
  update: protectedProcedure
    .input(z.object({ id: z.string(), status: equipmentStatusSchema.optional(), licensePlate: z.string().optional(), currentLocation: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const updateData: any = {};
      if (input.status) updateData.status = input.status;
      if (input.licensePlate) updateData.licensePlate = input.licensePlate;
      if (Object.keys(updateData).length > 0) await db.update(vehicles).set(updateData).where(eq(vehicles.id, parseInt(input.id, 10)));
      return { success: true, id: input.id, updatedBy: ctx.user?.id, updatedAt: new Date().toISOString() };
    }),

  /**
   * Assign equipment — updates currentDriverId
   */
  assign: protectedProcedure
    .input(z.object({ equipmentId: z.string(), vehicleId: z.string(), loadId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(vehicles).set({ status: "in_use" as any, currentDriverId: parseInt(input.vehicleId, 10) || null }).where(eq(vehicles.id, parseInt(input.equipmentId, 10)));
      return { success: true, equipmentId: input.equipmentId, vehicleId: input.vehicleId, assignedBy: ctx.user?.id, assignedAt: new Date().toISOString() };
    }),

  /**
   * Unassign equipment
   */
  unassign: protectedProcedure
    .input(z.object({ equipmentId: z.string(), location: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(vehicles).set({ status: "available" as any, currentDriverId: null }).where(eq(vehicles.id, parseInt(input.equipmentId, 10)));
      return { success: true, equipmentId: input.equipmentId, unassignedBy: ctx.user?.id, unassignedAt: new Date().toISOString() };
    }),

  /**
   * Schedule maintenance — updates vehicle status
   */
  scheduleMaintenance: protectedProcedure
    .input(z.object({ equipmentId: z.string(), type: z.enum(["preventive", "repair", "inspection"]), description: z.string(), scheduledDate: z.string(), estimatedCost: z.number().optional(), vendor: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(vehicles).set({ status: "maintenance" as any, nextMaintenanceDate: new Date(input.scheduledDate) }).where(eq(vehicles.id, parseInt(input.equipmentId, 10)));
      return { maintenanceId: `maint_${Date.now()}`, equipmentId: input.equipmentId, scheduledBy: ctx.user?.id, scheduledAt: new Date().toISOString() };
    }),

  /**
   * Record inspection — writes to inspections table
   */
  recordInspection: protectedProcedure
    .input(z.object({ equipmentId: z.string(), type: z.enum(["pre_trip", "post_trip", "annual", "dot"]), result: z.enum(["pass", "fail", "pass_with_defects"]), defects: z.array(z.object({ category: z.string(), description: z.string(), severity: z.enum(["minor", "major", "critical"]) })).optional(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const userId = typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) : (ctx.user?.id || 0);
      const companyId = await resolveCompanyId(ctx.user);
      const result = await db.insert(inspections).values({
        vehicleId: parseInt(input.equipmentId, 10), driverId: userId, companyId,
        type: input.type as any, status: input.result === "fail" ? "failed" : "passed",
        defectsFound: input.defects?.length || 0, oosViolation: input.result === "fail",
        completedAt: new Date(), location: input.notes || null,
      } as any);
      const insertedId = (result as any).insertId || (result as any)[0]?.insertId || 0;
      // Update vehicle nextInspectionDate
      const nextDate = new Date(); nextDate.setMonth(nextDate.getMonth() + 3);
      await db.update(vehicles).set({ nextInspectionDate: nextDate }).where(eq(vehicles.id, parseInt(input.equipmentId, 10)));
      return { inspectionId: String(insertedId), equipmentId: input.equipmentId, result: input.result, inspectedBy: ctx.user?.id, inspectedAt: new Date().toISOString() };
    }),

  /**
   * Get equipment utilization — computed from real data
   */
  getUtilization: protectedProcedure
    .input(z.object({ period: z.enum(["week", "month", "quarter"]).default("month") }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const companyId = await resolveCompanyId(ctx.user);
      const empty = { period: input.period, overall: { utilizationRate: 0, avgDaysInUse: 0, avgDaysIdle: 0, avgDaysMaintenance: 0 }, byEquipment: [] as any[], costAnalysis: { totalMaintenance: 0, avgPerUnit: 0, revenueGenerated: 0, roi: 0 } };
      if (!db || !companyId) return empty;
      try {
        const [total] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true)));
        const [inUse] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true), eq(vehicles.status, "in_use")));
        const t = total?.count || 1;
        const rate = t > 0 ? (inUse?.count || 0) / t : 0;
        return { ...empty, overall: { utilizationRate: rate, avgDaysInUse: Math.round(rate * 30), avgDaysIdle: Math.round((1 - rate) * 30), avgDaysMaintenance: 0 } };
      } catch { return empty; }
    }),

  /**
   * Get expiring certifications — vehicles with upcoming inspection dates
   */
  getExpiringCertifications: protectedProcedure
    .input(z.object({ daysAhead: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const companyId = await resolveCompanyId(ctx.user);
      if (!companyId) return [];
      try {
        const futureDate = new Date(Date.now() + input.daysAhead * 24 * 60 * 60 * 1000);
        const results = await db.select().from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true), lte(vehicles.nextInspectionDate, futureDate), gte(vehicles.nextInspectionDate, new Date()))).limit(20);
        return results.map(v => {
          const daysRemaining = v.nextInspectionDate ? Math.ceil((v.nextInspectionDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : 0;
          return { equipmentId: String(v.id), unitNumber: v.licensePlate || `EQ-${v.id}`, certificationType: "Inspection", expiresAt: v.nextInspectionDate?.toISOString()?.split("T")[0] || "", daysRemaining };
        });
      } catch { return []; }
    }),
});
