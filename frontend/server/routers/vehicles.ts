/**
 * VEHICLES ROUTER
 * tRPC procedures for vehicle management
 * ALL data from database — scoped by companyId
 */

import { z } from "zod";
import { eq, and, desc, lte, gte, sql } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { vehicles, users, inspections, documents, drivers } from "../../drizzle/schema";

async function resolveCompanyId(ctxUser: any): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const userId = typeof ctxUser?.id === "string" ? parseInt(ctxUser.id, 10) : (ctxUser?.id || 0);
  try { const [r] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1); return r?.companyId || 0; } catch { return 0; }
}

export const vehiclesRouter = router({
  // ═══════════════════════════════════════════════════════════════════════════
  // LIST — paginated, filterable vehicle list
  // ═══════════════════════════════════════════════════════════════════════════
  list: protectedProcedure.input(z.object({ status: z.string().optional(), type: z.string().optional(), search: z.string().optional(), limit: z.number().optional(), offset: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const companyId = await resolveCompanyId(ctx.user);
    if (!companyId) return [];
    try {
      const filters: any[] = [eq(vehicles.companyId, companyId), eq(vehicles.isActive, true)];
      if (input?.status) filters.push(eq(vehicles.status, input.status as any));
      if (input?.type) filters.push(eq(vehicles.vehicleType, input.type as any));
      if (input?.search) {
        const q = `%${input.search}%`;
        filters.push(sql`(${vehicles.vin} LIKE ${q} OR ${vehicles.make} LIKE ${q} OR ${vehicles.model} LIKE ${q} OR ${vehicles.licensePlate} LIKE ${q})`);
      }
      const results = await db.select().from(vehicles).where(and(...filters)).orderBy(desc(vehicles.createdAt)).limit(input?.limit || 50).offset(input?.offset || 0);
      return results.map(v => ({
        id: String(v.id), unit: `${v.make || ""} ${v.model || ""}`.trim() || String(v.id),
        vin: v.vin, type: v.vehicleType, status: v.status,
        make: v.make, model: v.model, year: v.year,
        licensePlate: v.licensePlate, capacity: v.capacity,
        driver: v.currentDriverId ? String(v.currentDriverId) : "",
        location: v.currentLocation, lastGPSUpdate: v.lastGPSUpdate?.toISOString() || null,
        nextMaintenanceDate: v.nextMaintenanceDate?.toISOString().split("T")[0] || null,
        nextInspectionDate: v.nextInspectionDate?.toISOString().split("T")[0] || null,
        createdAt: v.createdAt.toISOString(),
      }));
    } catch (e) { console.error("[vehicles.list]", e); return []; }
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // GET — single vehicle by ID
  // ═══════════════════════════════════════════════════════════════════════════
  get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return null;
    const companyId = await resolveCompanyId(ctx.user);
    try {
      const vid = parseInt(input.id, 10);
      const [v] = await db.select().from(vehicles).where(and(eq(vehicles.id, vid), eq(vehicles.companyId, companyId))).limit(1);
      if (!v) return null;
      let driverName = null;
      if (v.currentDriverId) {
        const [d] = await db.select({ userId: drivers.userId }).from(drivers).where(eq(drivers.id, v.currentDriverId)).limit(1);
        if (d?.userId) { const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, d.userId)).limit(1); driverName = u?.name || null; }
      }
      return {
        id: String(v.id), vin: v.vin, make: v.make, model: v.model, year: v.year,
        licensePlate: v.licensePlate, vehicleType: v.vehicleType, capacity: v.capacity,
        status: v.status, currentDriverId: v.currentDriverId ? String(v.currentDriverId) : null,
        driverName, location: v.currentLocation, lastGPSUpdate: v.lastGPSUpdate?.toISOString() || null,
        nextMaintenanceDate: v.nextMaintenanceDate?.toISOString().split("T")[0] || null,
        nextInspectionDate: v.nextInspectionDate?.toISOString().split("T")[0] || null,
        createdAt: v.createdAt.toISOString(), updatedAt: v.updatedAt.toISOString(),
      };
    } catch (e) { console.error("[vehicles.get]", e); return null; }
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE — register new vehicle
  // ═══════════════════════════════════════════════════════════════════════════
  create: protectedProcedure.input(z.object({
    vin: z.string().min(1).max(17),
    make: z.string().optional(),
    model: z.string().optional(),
    year: z.number().optional(),
    licensePlate: z.string().optional(),
    vehicleType: z.enum(["tractor", "trailer", "tanker", "flatbed", "refrigerated", "dry_van", "lowboy", "step_deck"]),
    capacity: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { success: false, error: "DB unavailable" };
    const companyId = await resolveCompanyId(ctx.user);
    if (!companyId) return { success: false, error: "No company" };
    try {
      const result = await db.insert(vehicles).values({
        companyId, vin: input.vin, make: input.make || null, model: input.model || null,
        year: input.year || null, licensePlate: input.licensePlate || null,
        vehicleType: input.vehicleType, capacity: input.capacity || null,
        status: "available", isActive: true,
      });
      return { success: true, id: String(result[0].insertId) };
    } catch (e: any) {
      if (e?.code === "ER_DUP_ENTRY") return { success: false, error: "VIN already exists" };
      console.error("[vehicles.create]", e); return { success: false, error: "Failed to create vehicle" };
    }
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE — modify vehicle details
  // ═══════════════════════════════════════════════════════════════════════════
  update: protectedProcedure.input(z.object({
    id: z.string(),
    make: z.string().optional(),
    model: z.string().optional(),
    year: z.number().optional(),
    licensePlate: z.string().optional(),
    vehicleType: z.enum(["tractor", "trailer", "tanker", "flatbed", "refrigerated", "dry_van", "lowboy", "step_deck"]).optional(),
    capacity: z.string().optional(),
    nextMaintenanceDate: z.string().optional(),
    nextInspectionDate: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    const companyId = await resolveCompanyId(ctx.user);
    try {
      const vid = parseInt(input.id, 10);
      const updates: any = {};
      if (input.make !== undefined) updates.make = input.make;
      if (input.model !== undefined) updates.model = input.model;
      if (input.year !== undefined) updates.year = input.year;
      if (input.licensePlate !== undefined) updates.licensePlate = input.licensePlate;
      if (input.vehicleType !== undefined) updates.vehicleType = input.vehicleType;
      if (input.capacity !== undefined) updates.capacity = input.capacity;
      if (input.nextMaintenanceDate) updates.nextMaintenanceDate = new Date(input.nextMaintenanceDate);
      if (input.nextInspectionDate) updates.nextInspectionDate = new Date(input.nextInspectionDate);
      if (Object.keys(updates).length === 0) return { success: true };
      await db.update(vehicles).set(updates).where(and(eq(vehicles.id, vid), eq(vehicles.companyId, companyId)));
      return { success: true };
    } catch (e) { console.error("[vehicles.update]", e); return { success: false }; }
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // DELETE — soft-delete vehicle
  // ═══════════════════════════════════════════════════════════════════════════
  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    const companyId = await resolveCompanyId(ctx.user);
    try {
      const vid = parseInt(input.id, 10);
      await db.update(vehicles).set({ isActive: false, deletedAt: new Date() }).where(and(eq(vehicles.id, vid), eq(vehicles.companyId, companyId)));
      return { success: true };
    } catch (e) { console.error("[vehicles.delete]", e); return { success: false }; }
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE STATUS — change vehicle operational status
  // ═══════════════════════════════════════════════════════════════════════════
  updateStatus: protectedProcedure.input(z.object({
    id: z.string(),
    status: z.enum(["available", "in_use", "maintenance", "out_of_service"]),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    const companyId = await resolveCompanyId(ctx.user);
    try {
      const vid = parseInt(input.id, 10);
      await db.update(vehicles).set({ status: input.status }).where(and(eq(vehicles.id, vid), eq(vehicles.companyId, companyId)));
      return { success: true };
    } catch (e) { console.error("[vehicles.updateStatus]", e); return { success: false }; }
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // ASSIGN DRIVER — assign a driver to this vehicle
  // ═══════════════════════════════════════════════════════════════════════════
  assignDriver: protectedProcedure.input(z.object({
    vehicleId: z.string(),
    driverId: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    const companyId = await resolveCompanyId(ctx.user);
    try {
      const vid = parseInt(input.vehicleId, 10);
      const did = parseInt(input.driverId, 10);
      // Verify driver belongs to same company
      const [d] = await db.select({ companyId: drivers.companyId }).from(drivers).where(eq(drivers.id, did)).limit(1);
      if (!d || d.companyId !== companyId) return { success: false, error: "Driver not found or different company" };
      await db.update(vehicles).set({ currentDriverId: did, status: "in_use" }).where(and(eq(vehicles.id, vid), eq(vehicles.companyId, companyId)));
      return { success: true };
    } catch (e) { console.error("[vehicles.assignDriver]", e); return { success: false }; }
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // UNASSIGN DRIVER — remove driver from vehicle
  // ═══════════════════════════════════════════════════════════════════════════
  unassignDriver: protectedProcedure.input(z.object({
    vehicleId: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    const companyId = await resolveCompanyId(ctx.user);
    try {
      const vid = parseInt(input.vehicleId, 10);
      await db.update(vehicles).set({ currentDriverId: null, status: "available" }).where(and(eq(vehicles.id, vid), eq(vehicles.companyId, companyId)));
      return { success: true };
    } catch (e) { console.error("[vehicles.unassignDriver]", e); return { success: false }; }
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // GET INSPECTIONS — inspections for a specific vehicle
  // ═══════════════════════════════════════════════════════════════════════════
  getInspections: protectedProcedure.input(z.object({ vehicleId: z.string(), limit: z.number().optional() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const companyId = await resolveCompanyId(ctx.user);
    try {
      const vid = parseInt(input.vehicleId, 10);
      const rows = await db.select().from(inspections).where(and(eq(inspections.vehicleId, vid), eq(inspections.companyId, companyId))).orderBy(desc(inspections.completedAt)).limit(input.limit || 20);
      return rows.map(i => ({
        id: String(i.id), type: i.type, status: i.status,
        defectsFound: i.defectsFound || 0, oosViolation: !!i.oosViolation,
        location: i.location || "", completedAt: i.completedAt?.toISOString().split("T")[0] || "",
        createdAt: i.createdAt.toISOString(),
      }));
    } catch (e) { console.error("[vehicles.getInspections]", e); return []; }
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // ADD INSPECTION — record a new inspection for a vehicle
  // ═══════════════════════════════════════════════════════════════════════════
  addInspection: protectedProcedure.input(z.object({
    vehicleId: z.string(),
    driverId: z.string().optional(),
    type: z.enum(["pre_trip", "post_trip", "roadside", "annual", "dot"]),
    status: z.enum(["passed", "failed", "pending"]).optional(),
    defectsFound: z.number().optional(),
    oosViolation: z.boolean().optional(),
    location: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { success: false };
    const companyId = await resolveCompanyId(ctx.user);
    try {
      const vid = parseInt(input.vehicleId, 10);
      const did = input.driverId ? parseInt(input.driverId, 10) : 0;
      const result = await db.insert(inspections).values({
        vehicleId: vid, driverId: did, companyId,
        type: input.type, status: input.status || "pending",
        defectsFound: input.defectsFound || 0,
        oosViolation: input.oosViolation || false,
        location: input.location || null,
        completedAt: input.status !== "pending" ? new Date() : null,
      });
      return { success: true, id: String(result[0].insertId) };
    } catch (e) { console.error("[vehicles.addInspection]", e); return { success: false }; }
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // GET DOCUMENTS — documents associated with a vehicle
  // ═══════════════════════════════════════════════════════════════════════════
  getDocuments: protectedProcedure.input(z.object({ vehicleId: z.string(), limit: z.number().optional() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const companyId = await resolveCompanyId(ctx.user);
    try {
      // Vehicle documents are stored at company level with type hints
      const docs = await db.select({ id: documents.id, name: documents.name, type: documents.type, expiryDate: documents.expiryDate, status: documents.status, fileUrl: documents.fileUrl, createdAt: documents.createdAt })
        .from(documents).where(eq(documents.companyId, companyId)).orderBy(desc(documents.createdAt)).limit(input.limit || 20);
      const now = new Date();
      return docs.map(d => ({
        id: String(d.id), name: d.name, type: d.type,
        status: d.expiryDate && new Date(d.expiryDate) < now ? "expired" : d.status || "active",
        expiresAt: d.expiryDate?.toISOString().split("T")[0] || "",
        fileUrl: d.fileUrl || "", createdAt: d.createdAt.toISOString(),
      }));
    } catch (e) { console.error("[vehicles.getDocuments]", e); return []; }
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // GET LOCATION — current GPS location of vehicle
  // ═══════════════════════════════════════════════════════════════════════════
  getLocation: protectedProcedure.input(z.object({ vehicleId: z.string() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return null;
    const companyId = await resolveCompanyId(ctx.user);
    try {
      const vid = parseInt(input.vehicleId, 10);
      const [v] = await db.select({ currentLocation: vehicles.currentLocation, lastGPSUpdate: vehicles.lastGPSUpdate, status: vehicles.status })
        .from(vehicles).where(and(eq(vehicles.id, vid), eq(vehicles.companyId, companyId))).limit(1);
      if (!v) return null;
      return { location: v.currentLocation, lastUpdate: v.lastGPSUpdate?.toISOString() || null, status: v.status };
    } catch (e) { console.error("[vehicles.getLocation]", e); return null; }
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // GET SUMMARY — fleet-level vehicle stats
  // ═══════════════════════════════════════════════════════════════════════════
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { total: 0, active: 0, maintenance: 0, outOfService: 0, available: 0, inUse: 0 };
    const companyId = await resolveCompanyId(ctx.user);
    if (!companyId) return { total: 0, active: 0, maintenance: 0, outOfService: 0, available: 0, inUse: 0 };
    try {
      const [total] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true)));
      const [available] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true), eq(vehicles.status, "available")));
      const [inUse] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true), eq(vehicles.status, "in_use")));
      const [maint] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true), eq(vehicles.status, "maintenance")));
      const [oos] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true), eq(vehicles.status, "out_of_service")));
      return { total: total?.count || 0, active: (available?.count || 0) + (inUse?.count || 0), available: available?.count || 0, inUse: inUse?.count || 0, maintenance: maint?.count || 0, outOfService: oos?.count || 0 };
    } catch { return { total: 0, active: 0, maintenance: 0, outOfService: 0, available: 0, inUse: 0 }; }
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // GET MAINTENANCE DUE — vehicles with upcoming maintenance
  // ═══════════════════════════════════════════════════════════════════════════
  getMaintenanceDue: protectedProcedure.input(z.object({ days: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const companyId = await resolveCompanyId(ctx.user);
    try {
      const cutoff = new Date(Date.now() + (input?.days || 30) * 86400000);
      const rows = await db.select({
        id: vehicles.id, vin: vehicles.vin, make: vehicles.make, model: vehicles.model,
        licensePlate: vehicles.licensePlate, nextMaintenanceDate: vehicles.nextMaintenanceDate,
      }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true), sql`${vehicles.nextMaintenanceDate} IS NOT NULL`, lte(vehicles.nextMaintenanceDate, cutoff))).orderBy(vehicles.nextMaintenanceDate).limit(20);
      const now = new Date();
      return rows.map(v => ({
        id: String(v.id), unit: `${v.make || ""} ${v.model || ""}`.trim(), vin: v.vin, licensePlate: v.licensePlate,
        dueDate: v.nextMaintenanceDate?.toISOString().split("T")[0] || "",
        overdue: v.nextMaintenanceDate ? new Date(v.nextMaintenanceDate) < now : false,
      }));
    } catch (e) { console.error("[vehicles.getMaintenanceDue]", e); return []; }
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // GET INSPECTIONS DUE — vehicles with upcoming inspections
  // ═══════════════════════════════════════════════════════════════════════════
  getInspectionsDue: protectedProcedure.input(z.object({ days: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const companyId = await resolveCompanyId(ctx.user);
    try {
      const cutoff = new Date(Date.now() + (input?.days || 30) * 86400000);
      const rows = await db.select({
        id: vehicles.id, vin: vehicles.vin, make: vehicles.make, model: vehicles.model,
        licensePlate: vehicles.licensePlate, nextInspectionDate: vehicles.nextInspectionDate,
      }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true), sql`${vehicles.nextInspectionDate} IS NOT NULL`, lte(vehicles.nextInspectionDate, cutoff))).orderBy(vehicles.nextInspectionDate).limit(20);
      const now = new Date();
      return rows.map(v => ({
        id: String(v.id), unit: `${v.make || ""} ${v.model || ""}`.trim(), vin: v.vin, licensePlate: v.licensePlate,
        dueDate: v.nextInspectionDate?.toISOString().split("T")[0] || "",
        overdue: v.nextInspectionDate ? new Date(v.nextInspectionDate) < now : false,
      }));
    } catch (e) { console.error("[vehicles.getInspectionsDue]", e); return []; }
  }),

  updateLocation: protectedProcedure
    .input(z.object({ vehicleId: z.string(), lat: z.number(), lng: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const vid = parseInt(input.vehicleId, 10);
      await db.update(vehicles).set({ currentLocation: { lat: input.lat, lng: input.lng }, lastGPSUpdate: new Date() }).where(eq(vehicles.id, vid));
      return { success: true };
    }),

  getMaintenanceHistory: protectedProcedure
    .input(z.object({ vehicleId: z.string(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const vid = parseInt(input.vehicleId, 10);
        const rows = await db.select({ id: inspections.id, type: inspections.type, status: inspections.status, location: inspections.location, defectsFound: inspections.defectsFound, completedAt: inspections.completedAt, createdAt: inspections.createdAt }).from(inspections).where(eq(inspections.vehicleId, vid)).orderBy(desc(inspections.createdAt)).limit(input.limit);
        return rows.map(r => ({ id: String(r.id), type: r.type, status: r.status || 'pending', location: r.location || '', defectsFound: r.defectsFound || 0, completedAt: r.completedAt?.toISOString() || '', createdAt: r.createdAt?.toISOString() || '' }));
      } catch (e) { return []; }
    }),

  scheduleMaintenance: protectedProcedure
    .input(z.object({ vehicleId: z.string(), scheduledDate: z.string(), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const vid = parseInt(input.vehicleId, 10);
      await db.update(vehicles).set({ nextMaintenanceDate: new Date(input.scheduledDate), updatedAt: new Date() }).where(eq(vehicles.id, vid));
      return { success: true };
    }),
});
