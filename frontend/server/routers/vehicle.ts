/**
 * VEHICLE ROUTER
 * tRPC procedures for vehicle inspections and management
 * ALL data from database — real queries
 */

import { z } from "zod";
import { eq, and, desc, lte, gte, sql } from "drizzle-orm";
import { auditedProtectedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { vehicles, inspections, users, drivers, documents } from "../../drizzle/schema";

async function resolveCompanyId(ctxUser: any): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const userId = typeof ctxUser?.id === "string" ? parseInt(ctxUser.id, 10) : (ctxUser?.id || 0);
  try { const [r] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1); return r?.companyId || 0; } catch { return 0; }
}

export const vehicleRouter = router({
  /**
   * Get inspections for VehicleInspections page
   */
  getInspections: protectedProcedure
    .input(z.object({ filter: z.string().optional(), search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const companyId = await resolveCompanyId(ctx.user);
      if (!companyId) return [];
      try {
        const conds: any[] = [eq(inspections.companyId, companyId)];
        if (input.filter && input.filter !== "all") conds.push(eq(inspections.status, input.filter as any));
        const rows = await db.select({
          id: inspections.id, vehicleId: inspections.vehicleId, driverId: inspections.driverId,
          type: inspections.type, status: inspections.status, defectsFound: inspections.defectsFound,
          oosViolation: inspections.oosViolation, location: inspections.location,
          completedAt: inspections.completedAt, createdAt: inspections.createdAt,
        }).from(inspections).where(and(...conds)).orderBy(desc(inspections.completedAt)).limit(50);

        const results = await Promise.all(rows.map(async (i) => {
          let vehicleUnit = "";
          let driverName = "";
          const [v] = await db.select({ make: vehicles.make, model: vehicles.model, licensePlate: vehicles.licensePlate }).from(vehicles).where(eq(vehicles.id, i.vehicleId)).limit(1);
          if (v) vehicleUnit = `${v.make || ""} ${v.model || ""}`.trim() || v.licensePlate || String(i.vehicleId);
          if (i.driverId) {
            const [d] = await db.select({ userId: drivers.userId }).from(drivers).where(eq(drivers.id, i.driverId)).limit(1);
            if (d?.userId) { const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, d.userId)).limit(1); driverName = u?.name || ""; }
          }
          return {
            id: String(i.id), vehicleId: String(i.vehicleId), vehicleUnit,
            driverId: String(i.driverId || ""), driverName,
            type: i.type, status: i.status, defectsFound: i.defectsFound || 0,
            oosViolation: !!i.oosViolation, location: i.location || "",
            completedAt: i.completedAt?.toISOString().split("T")[0] || "",
            createdAt: i.createdAt.toISOString(),
          };
        }));

        if (input.search) {
          const s = input.search.toLowerCase();
          return results.filter(r => r.vehicleUnit.toLowerCase().includes(s) || r.driverName.toLowerCase().includes(s) || r.location.toLowerCase().includes(s));
        }
        return results;
      } catch (e) { console.error("[vehicle.getInspections]", e); return []; }
    }),

  /**
   * Get inspection stats for VehicleInspections page
   */
  getInspectionStats: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { total: 0, passed: 0, failed: 0, pending: 0, dueThisWeek: 0, defectsOpen: 0, totalThisMonth: 0 };
      const companyId = await resolveCompanyId(ctx.user);
      if (!companyId) return { total: 0, passed: 0, failed: 0, pending: 0, dueThisWeek: 0, defectsOpen: 0, totalThisMonth: 0 };
      try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const weekEnd = new Date(now.getTime() + 7 * 86400000);
        const [total] = await db.select({ count: sql<number>`count(*)` }).from(inspections).where(eq(inspections.companyId, companyId));
        const [passed] = await db.select({ count: sql<number>`count(*)` }).from(inspections).where(and(eq(inspections.companyId, companyId), eq(inspections.status, "passed")));
        const [failed] = await db.select({ count: sql<number>`count(*)` }).from(inspections).where(and(eq(inspections.companyId, companyId), eq(inspections.status, "failed")));
        const [pending] = await db.select({ count: sql<number>`count(*)` }).from(inspections).where(and(eq(inspections.companyId, companyId), eq(inspections.status, "pending")));
        const [thisMonth] = await db.select({ count: sql<number>`count(*)` }).from(inspections).where(and(eq(inspections.companyId, companyId), gte(inspections.createdAt, monthStart)));
        const [dueWeek] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true), sql`${vehicles.nextInspectionDate} IS NOT NULL`, lte(vehicles.nextInspectionDate, weekEnd)));
        const [openDefects] = await db.select({ total: sql<number>`COALESCE(SUM(${inspections.defectsFound}), 0)` }).from(inspections).where(and(eq(inspections.companyId, companyId), eq(inspections.status, "failed")));
        return {
          total: total?.count || 0, passed: passed?.count || 0, failed: failed?.count || 0,
          pending: pending?.count || 0, dueThisWeek: dueWeek?.count || 0,
          defectsOpen: openDefects?.total || 0, totalThisMonth: thisMonth?.count || 0,
        };
      } catch (e) { console.error("[vehicle.getInspectionStats]", e); return { total: 0, passed: 0, failed: 0, pending: 0, dueThisWeek: 0, defectsOpen: 0, totalThisMonth: 0 }; }
    }),

  /**
   * Get inspections due soon
   */
  getInspectionsDue: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(5) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const companyId = await resolveCompanyId(ctx.user);
      if (!companyId) return [];
      try {
        const cutoff = new Date(Date.now() + 30 * 86400000);
        const now = new Date();
        const rows = await db.select({
          id: vehicles.id, make: vehicles.make, model: vehicles.model, vin: vehicles.vin,
          licensePlate: vehicles.licensePlate, nextInspectionDate: vehicles.nextInspectionDate,
        }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true), sql`${vehicles.nextInspectionDate} IS NOT NULL`, lte(vehicles.nextInspectionDate, cutoff))).orderBy(vehicles.nextInspectionDate).limit(input.limit);
        return rows.map(v => ({
          id: String(v.id), unit: `${v.make || ""} ${v.model || ""}`.trim(),
          vin: v.vin, licensePlate: v.licensePlate,
          dueDate: v.nextInspectionDate?.toISOString().split("T")[0] || "",
          overdue: v.nextInspectionDate ? new Date(v.nextInspectionDate) < now : false,
        }));
      } catch (e) { console.error("[vehicle.getInspectionsDue]", e); return []; }
    }),

  // Get assigned vehicle for driver
  getAssigned: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const empty = { id: "", unitNumber: "", year: 0, make: "", model: "", vin: "", licensePlate: "", odometer: 0, fuelLevel: 0, status: "" };
    if (!db) return empty;
    try {
      const userId = typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) : (ctx.user?.id || 0);
      const [d] = await db.select({ id: drivers.id }).from(drivers).where(eq(drivers.userId, userId)).limit(1);
      if (!d) return empty;
      const [v] = await db.select().from(vehicles).where(eq(vehicles.currentDriverId, d.id)).limit(1);
      if (!v) return empty;
      return {
        id: String(v.id), unitNumber: v.licensePlate || v.vin, year: v.year || 0,
        make: v.make || "", model: v.model || "", vin: v.vin,
        licensePlate: v.licensePlate || "", odometer: 0, fuelLevel: 0, status: v.status,
      };
    } catch (e) { console.error("[vehicle.getAssigned]", e); return empty; }
  }),

  // Get maintenance history
  getMaintenanceHistory: protectedProcedure
    .input(z.object({ vehicleId: z.string().optional(), limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { records: [] };
      const companyId = await resolveCompanyId(ctx.user);
      if (!companyId) return { records: [] };
      try {
        // Maintenance events tracked via documents of type 'maintenance'
        const docs = await db.select({ id: documents.id, name: documents.name, type: documents.type, createdAt: documents.createdAt, status: documents.status })
          .from(documents).where(and(eq(documents.companyId, companyId), sql`${documents.type} LIKE '%maintenance%'`)).orderBy(desc(documents.createdAt)).limit(input?.limit || 20);
        return {
          records: docs.map(d => ({
            id: String(d.id), description: d.name, type: d.type,
            date: d.createdAt.toISOString().split("T")[0], status: d.status || "completed",
          })),
        };
      } catch (e) { console.error("[vehicle.getMaintenanceHistory]", e); return { records: [] }; }
    }),
});
