/**
 * INSPECTION FORMS ROUTER
 * tRPC procedures for DVIR and inspection form management
 */

import { z } from "zod";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { vehicles, drivers, inspections } from "../../drizzle/schema";

const inspectionTypeSchema = z.enum(["pre_trip", "post_trip", "en_route", "dot", "annual"]);
const defectSeveritySchema = z.enum(["minor", "major", "critical", "oos"]);

export const inspectionFormsRouter = router({
  /**
   * List inspections
   */
  list: protectedProcedure
    .input(z.object({
      vehicleId: z.string().optional(),
      driverId: z.string().optional(),
      type: inspectionTypeSchema.optional(),
      hasDefects: z.boolean().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return { inspections: [], total: 0 };
      try {
        const companyId = ctx.user?.companyId || 0;
        const conds: any[] = [eq(inspections.companyId, companyId)];
        if (input.vehicleId) conds.push(eq(inspections.vehicleId, parseInt(input.vehicleId)));
        if (input.driverId) conds.push(eq(inspections.driverId, parseInt(input.driverId)));
        if (input.type) {
          const typeMap: Record<string, string> = { pre_trip: 'pre_trip', post_trip: 'post_trip', en_route: 'roadside', dot: 'dot', annual: 'annual' };
          conds.push(eq(inspections.type, (typeMap[input.type] || input.type) as any));
        }
        if (input.hasDefects === true) conds.push(sql`${inspections.defectsFound} > 0`);
        if (input.startDate) conds.push(gte(inspections.createdAt, new Date(input.startDate)));
        const rows = await db.select().from(inspections).where(and(...conds)).orderBy(desc(inspections.createdAt)).limit(input.limit);
        const [countRow] = await db.select({ count: sql<number>`COUNT(*)` }).from(inspections).where(and(...conds));
        return {
          inspections: rows.map(i => ({
            id: String(i.id), type: i.type, vehicleId: String(i.vehicleId), driverId: String(i.driverId),
            status: i.status, location: i.location || '', defectsFound: i.defectsFound || 0,
            oosViolation: i.oosViolation || false, completedAt: i.completedAt?.toISOString() || null,
            createdAt: i.createdAt?.toISOString() || '',
          })),
          total: countRow?.count || 0,
        };
      } catch (e) { console.error('[InspectionForms] list error:', e); return { inspections: [], total: 0 }; }
    }),

  /**
   * Get inspection by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return null;
      try {
        const [row] = await db.select().from(inspections).where(eq(inspections.id, parseInt(input.id))).limit(1);
        if (!row) return null;
        return {
          id: String(row.id), type: row.type, vehicleId: String(row.vehicleId), driverId: String(row.driverId),
          status: row.status, location: row.location || '', defectsFound: row.defectsFound || 0,
          oosViolation: row.oosViolation || false, completedAt: row.completedAt?.toISOString() || null,
          createdAt: row.createdAt?.toISOString() || '',
          certificationStatement: 'I certify that this vehicle has been inspected in accordance with 49 CFR 396.11-396.13',
          result: row.defectsFound && row.defectsFound > 0 ? 'defects_noted' : row.status === 'passed' ? 'satisfactory' : 'pending',
        };
      } catch (e) { console.error('[InspectionForms] getById error:', e); return null; }
    }),

  /**
   * Submit inspection
   */
  submit: protectedProcedure
    .input(z.object({
      type: inspectionTypeSchema,
      vehicleId: z.string(),
      trailerId: z.string().optional(),
      odometer: z.number(),
      location: z.string(),
      items: z.array(z.object({
        category: z.string(),
        item: z.string(),
        status: z.enum(["ok", "defect", "na"]),
        defectNote: z.string().optional(),
        defectSeverity: defectSeveritySchema.optional(),
      })),
      remarks: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error('Database unavailable');
      const defects = input.items.filter(i => i.status === 'defect');
      const hasOOS = defects.some(d => d.defectSeverity === 'oos');
      const typeMap: Record<string, string> = { pre_trip: 'pre_trip', post_trip: 'post_trip', en_route: 'roadside', dot: 'dot', annual: 'annual' };
      const [result] = await db.insert(inspections).values({
        vehicleId: parseInt(input.vehicleId),
        driverId: ctx.user?.id || 0,
        companyId: ctx.user?.companyId || 0,
        type: (typeMap[input.type] || 'pre_trip') as any,
        status: hasOOS ? 'failed' : defects.length > 0 ? 'failed' : 'passed',
        location: input.location,
        defectsFound: defects.length,
        oosViolation: hasOOS,
        completedAt: new Date(),
      }).$returningId();
      return {
        id: String(result.id), type: input.type,
        result: defects.length > 0 ? 'defects_noted' : 'satisfactory',
        defectsFound: defects.length, outOfService: hasOOS,
        submittedBy: ctx.user?.id, submittedAt: new Date().toISOString(),
      };
    }),

  /**
   * Report defect
   */
  reportDefect: protectedProcedure
    .input(z.object({
      inspectionId: z.string(),
      category: z.string(),
      item: z.string(),
      severity: defectSeveritySchema,
      description: z.string(),
      photos: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (db) {
        const inspId = parseInt(input.inspectionId);
        // Increment defect count on the inspection
        await db.update(inspections).set({
          defectsFound: sql`${inspections.defectsFound} + 1`,
          status: 'failed',
          oosViolation: input.severity === 'oos' ? true : undefined,
        }).where(eq(inspections.id, inspId));
      }
      return {
        defectId: `def_${Date.now()}`, inspectionId: input.inspectionId,
        requiresImmediate: input.severity === 'oos' || input.severity === 'critical',
        reportedBy: ctx.user?.id, reportedAt: new Date().toISOString(),
      };
    }),

  /**
   * Correct defect
   */
  correctDefect: protectedProcedure
    .input(z.object({
      defectId: z.string(),
      correctionNotes: z.string(),
      partsUsed: z.array(z.object({
        partNumber: z.string(),
        description: z.string(),
        quantity: z.number(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Log correction via audit trail
      console.log(`[InspectionForms] Defect ${input.defectId} corrected by user ${ctx.user?.id}: ${input.correctionNotes}`);
      return {
        success: true, defectId: input.defectId,
        correctedBy: ctx.user?.id, correctedAt: new Date().toISOString(),
        partsUsed: input.partsUsed?.length || 0,
      };
    }),

  /**
   * Review inspection
   */
  review: protectedProcedure
    .input(z.object({
      inspectionId: z.string(),
      approved: z.boolean(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (db) {
        const inspId = parseInt(input.inspectionId);
        await db.update(inspections).set({
          status: input.approved ? 'passed' : 'failed',
        }).where(eq(inspections.id, inspId));
      }
      return {
        success: true, inspectionId: input.inspectionId,
        approved: input.approved, reviewedBy: ctx.user?.id, reviewedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get inspection templates
   */
  getTemplates: protectedProcedure
    .input(z.object({
      vehicleType: z.enum(["tractor", "tanker", "trailer", "combination"]).optional(),
    }))
    .query(async ({ input }) => {
      return [
        {
          id: "tmpl_001",
          name: "Tanker Pre-Trip",
          vehicleType: "tanker",
          categories: [
            { name: "Cab/Controls", items: ["Gauges", "Wipers", "Mirrors", "Horn", "Heater", "Emergency Equipment"] },
            { name: "Lights", items: ["Headlights", "Turn Signals", "Brake Lights", "Markers", "Reflectors"] },
            { name: "Brakes", items: ["Service Brakes", "Parking Brake", "Drums/Linings", "Air Lines"] },
            { name: "Tires/Wheels", items: ["Tread Depth", "Condition", "Rims", "Lug Nuts"] },
            { name: "Coupling", items: ["Fifth Wheel", "Safety Chains"] },
            { name: "Tanker", items: ["Valves", "Vapor Recovery", "Grounding", "Placards"] },
          ],
        },
        {
          id: "tmpl_002",
          name: "Standard Pre-Trip",
          vehicleType: "tractor",
          categories: [
            { name: "Cab/Controls", items: ["Gauges", "Wipers", "Mirrors", "Horn", "Heater", "Emergency Equipment"] },
            { name: "Lights", items: ["Headlights", "Turn Signals", "Brake Lights", "Markers"] },
            { name: "Brakes", items: ["Service Brakes", "Parking Brake", "Drums/Linings"] },
            { name: "Tires/Wheels", items: ["Tread Depth", "Condition", "Rims", "Lug Nuts"] },
          ],
        },
      ];
    }),

  /**
   * Get open defects
   */
  getOpenDefects: protectedProcedure
    .input(z.object({ vehicleId: z.string().optional(), severity: defectSeveritySchema.optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const companyId = ctx.user?.companyId || 0;
        const conds: any[] = [eq(inspections.companyId, companyId), eq(inspections.status, 'failed'), sql`${inspections.defectsFound} > 0`];
        if (input.vehicleId) conds.push(eq(inspections.vehicleId, parseInt(input.vehicleId)));
        const rows = await db.select().from(inspections).where(and(...conds)).orderBy(desc(inspections.createdAt)).limit(50);
        return rows.map(i => ({
          id: String(i.id), vehicleId: String(i.vehicleId), type: i.type,
          defectsFound: i.defectsFound || 0, oosViolation: i.oosViolation || false,
          location: i.location || '', createdAt: i.createdAt?.toISOString() || '',
        }));
      } catch { return []; }
    }),

  /**
   * Get inspection statistics
   */
  getStatistics: protectedProcedure
    .input(z.object({ period: z.enum(["week", "month", "quarter"]).default("month") }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const empty = { period: input.period, summary: { totalInspections: 0, satisfactory: 0, withDefects: 0, defectRate: 0 }, byType: { pre_trip: 0, post_trip: 0, en_route: 0, dot: 0 }, defectsByCategory: [], compliance: { inspectionsRequired: 0, inspectionsCompleted: 0, complianceRate: 0 } };
      if (!db) return empty;
      try {
        const companyId = ctx.user?.companyId || 0;
        const daysMap: Record<string, number> = { week: 7, month: 30, quarter: 90 };
        const since = new Date(Date.now() - (daysMap[input.period] || 30) * 86400000);
        const [stats] = await db.select({
          total: sql<number>`COUNT(*)`,
          passed: sql<number>`SUM(CASE WHEN ${inspections.status} = 'passed' THEN 1 ELSE 0 END)`,
          failed: sql<number>`SUM(CASE WHEN ${inspections.status} = 'failed' THEN 1 ELSE 0 END)`,
          preTrip: sql<number>`SUM(CASE WHEN ${inspections.type} = 'pre_trip' THEN 1 ELSE 0 END)`,
          postTrip: sql<number>`SUM(CASE WHEN ${inspections.type} = 'post_trip' THEN 1 ELSE 0 END)`,
          roadside: sql<number>`SUM(CASE WHEN ${inspections.type} = 'roadside' THEN 1 ELSE 0 END)`,
          dot: sql<number>`SUM(CASE WHEN ${inspections.type} = 'dot' THEN 1 ELSE 0 END)`,
        }).from(inspections).where(and(eq(inspections.companyId, companyId), gte(inspections.createdAt, since)));
        const total = stats?.total || 0;
        const withDefects = stats?.failed || 0;
        return {
          period: input.period,
          summary: { totalInspections: total, satisfactory: stats?.passed || 0, withDefects, defectRate: total > 0 ? Math.round((withDefects / total) * 100) : 0 },
          byType: { pre_trip: stats?.preTrip || 0, post_trip: stats?.postTrip || 0, en_route: stats?.roadside || 0, dot: stats?.dot || 0 },
          defectsByCategory: [],
          compliance: { inspectionsRequired: 0, inspectionsCompleted: total, complianceRate: 0 },
        };
      } catch { return empty; }
    }),
});
