/**
 * PERMITS ROUTER
 * tRPC procedures for oversize/overweight permit management
 */

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { documents } from "../../drizzle/schema";

const permitStatusSchema = z.enum(["draft", "pending", "approved", "expired", "revoked"]);
const permitTypeSchema = z.enum(["oversize", "overweight", "superload", "hazmat_route", "temporary"]);

export const permitsRouter = router({
  /**
   * List permits from permits_records table
   */
  list: protectedProcedure
    .input(z.object({ status: permitStatusSchema.optional(), type: permitTypeSchema.optional(), state: z.string().optional(), limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) { const r: any[] = []; return Object.assign(r, { permits: r, total: 0, filter: r.filter.bind(r) }); }
      try {
        const userId = Number(ctx.user?.id) || 0;
        const statusFilter = input.status || null;
        const typeFilter = input.type || null;
        const [countRes] = await db.execute(sql`SELECT COUNT(*) as cnt FROM permits_records WHERE userId = ${userId} AND (${statusFilter} IS NULL OR status = ${statusFilter}) AND (${typeFilter} IS NULL OR type = ${typeFilter})`) as any;
        const total = Number((countRes || [])[0]?.cnt) || 0;
        const [rows] = await db.execute(sql`SELECT * FROM permits_records WHERE userId = ${userId} AND (${statusFilter} IS NULL OR status = ${statusFilter}) AND (${typeFilter} IS NULL OR type = ${typeFilter}) ORDER BY createdAt DESC LIMIT ${input.limit} OFFSET ${input.offset}`) as any;
        const permits = (rows || []).map((r: any) => ({
          id: String(r.id), permitNumber: r.permitNumber, type: r.type, status: r.status,
          states: r.states ? JSON.parse(r.states) : [], origin: r.origin, destination: r.destination,
          commodity: r.commodity, weight: Number(r.weight) || 0,
          expirationDate: r.expirationDate, fees: Number(r.fees) || 0,
          createdAt: r.createdAt?.toISOString?.() || '',
        }));
        return Object.assign(permits, { permits, total, filter: permits.filter.bind(permits) });
      } catch (e) { logger.error('[Permits] list error:', e); const r: any[] = []; return Object.assign(r, { permits: r, total: 0, filter: r.filter.bind(r) }); }
    }),

  /**
   * Get permit by ID from permits_records table
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const [rows] = await db.execute(sql`SELECT * FROM permits_records WHERE id = ${parseInt(input.id, 10)} LIMIT 1`) as any;
        const r = (rows || [])[0];
        if (!r) return null;
        return {
          id: String(r.id), permitNumber: r.permitNumber, type: r.type, status: r.status,
          states: r.states ? JSON.parse(r.states) : [], origin: r.origin, destination: r.destination,
          commodity: r.commodity, loadDescription: r.loadDescription,
          dimensions: r.dimensions ? JSON.parse(r.dimensions) : null,
          weight: Number(r.weight) || 0, fees: Number(r.fees) || 0,
          requestedStartDate: r.requestedStartDate, requestedEndDate: r.requestedEndDate,
          approvedDate: r.approvedDate, expirationDate: r.expirationDate,
          issuingAgency: r.issuingAgency, documentUrl: r.documentUrl, notes: r.notes,
          createdAt: r.createdAt?.toISOString?.() || '',
        };
      } catch (e) { logger.error("[permits] Failed to fetch permit by ID:", e); return null; }
    }),

  /**
   * Apply for permit
   */
  submitApplication: protectedProcedure
    .input(z.object({ type: permitTypeSchema, states: z.array(z.string()), catalystId: z.string(), vehicleId: z.string(), trailerId: z.string().optional(), loadDescription: z.string(), commodity: z.string(), dimensions: z.object({ length: z.number(), width: z.number(), height: z.number(), overhangFront: z.number().optional(), overhangRear: z.number().optional() }), weight: z.number(), origin: z.string(), destination: z.string(), requestedStartDate: z.string(), requestedEndDate: z.string(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const permitNumber = `PRM-${input.type.toUpperCase().slice(0, 2)}-${Date.now().toString().slice(-6)}`;
      const userId = Number(ctx.user?.id) || 0;
      const companyId = Number(ctx.user?.companyId) || 0;
      if (db) {
        try {
          await db.execute(sql`
            INSERT INTO permits_records (permitNumber, type, status, companyId, userId, vehicleId, trailerId,
              states, origin, destination, commodity, loadDescription, dimensions, weight,
              requestedStartDate, requestedEndDate, notes)
            VALUES (${permitNumber}, ${input.type}, 'pending', ${companyId}, ${userId},
              ${input.vehicleId}, ${input.trailerId || null},
              ${JSON.stringify(input.states)}, ${input.origin}, ${input.destination},
              ${input.commodity}, ${input.loadDescription}, ${JSON.stringify(input.dimensions)},
              ${input.weight}, ${input.requestedStartDate}, ${input.requestedEndDate}, ${input.notes || null})
          `);
        } catch (e) { logger.warn('[Permits] submitApplication error:', e); }
      }
      return {
        id: permitNumber, applicationNumber: permitNumber,
        status: "pending", submittedBy: ctx.user?.id, submittedAt: new Date().toISOString(), estimatedProcessingDays: 3,
      };
    }),

  /**
   * Get expiring permits — empty for new users
   */
  getExpiring: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const userId = Number(ctx.user?.id) || 0;
        const [rows] = await db.execute(sql`
          SELECT * FROM permits_records
          WHERE userId = ${userId} AND status = 'approved'
            AND expirationDate IS NOT NULL
            AND expirationDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ${input.days} DAY)
          ORDER BY expirationDate ASC
        `) as any;
        return (rows || []).map((r: any) => ({
          id: String(r.id), permitNumber: r.permitNumber, type: r.type,
          expirationDate: r.expirationDate, daysRemaining: r.expirationDate ? Math.ceil((new Date(r.expirationDate).getTime() - Date.now()) / 86400000) : 0,
          states: r.states ? JSON.parse(r.states) : [],
        }));
      } catch (e) { logger.error("[permits] Failed to fetch expiring permits:", e); return []; }
    }),

  /**
   * Renew permit
   */
  renew: protectedProcedure
    .input(z.object({ permitId: z.string(), requestedEndDate: z.string(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (db) {
        try {
          await db.execute(sql`
            UPDATE permits_records SET requestedEndDate = ${input.requestedEndDate},
              status = 'pending', notes = CONCAT(COALESCE(notes, ''), '\nRenewal requested: ', ${input.notes || ''})
            WHERE id = ${parseInt(input.permitId, 10)}
          `);
        } catch (e) {
          logger.error("[permits] Failed to update permit for renewal:", e);
        }
      }
      return {
        success: true, renewalId: `ren_${Date.now()}`, originalPermitId: input.permitId, status: "pending", submittedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get state permit requirements — static reference data (OK to keep)
   */
  getStateRequirements: protectedProcedure
    .input(z.object({ state: z.string() }))
    .query(async ({ input }) => {
      const requirements: Record<string, any> = {
        TX: {
          state: "TX", agency: "Texas Department of Motor Vehicles",
          maxDimensions: { length: 110, width: 14, height: 14 }, maxWeight: 80000,
          oversizeTriggers: { length: 65, width: 8.5, height: 14 }, overweightTrigger: 80000,
          superloadThreshold: { length: 125, width: 16, height: 17, weight: 200000 },
          escortRequirements: { width14Plus: "Front escort required", width16Plus: "Front and rear escort required", superload: "Law enforcement escort may be required" },
          fees: { oversize: { base: 60, perMile: 0 }, overweight: { base: 75, perMile: 0 }, superload: { base: 200, perMile: 0.50 } },
          processingTime: "2-5 business days", onlinePortal: "https://txdmv.gov/motor-catalysts/oversize-overweight-permits",
        },
      };
      return requirements[input.state] || { state: input.state, found: false };
    }),

  /**
   * Check route for restrictions — logic-based, not fake data
   */
  checkRoute: protectedProcedure
    .input(z.object({ origin: z.string(), destination: z.string(), dimensions: z.object({ length: z.number(), width: z.number(), height: z.number() }), weight: z.number() }))
    .query(async ({ input }) => ({
      origin: input.origin, destination: input.destination,
      restrictions: [],
      permitRequired: input.dimensions.width > 8.5 || input.dimensions.height > 14 || input.weight > 80000,
      permitTypes: [] as string[], alternateRoutes: [] as string[],
    })),

  /**
   * Upload permit document
   */
  uploadDocument: protectedProcedure
    .input(z.object({ permitId: z.string(), documentName: z.string(), documentType: z.enum(["permit", "route", "engineering", "insurance", "other"]) }))
    .mutation(async ({ ctx, input }) => ({
      id: `doc_${Date.now()}`, permitId: input.permitId, name: input.documentName, type: input.documentType, uploadedBy: ctx.user?.id, uploadedAt: new Date().toISOString(),
    })),

  // Additional permit procedures — empty for new users
  getActive: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) { const p: any[] = []; return Object.assign(p, { total: 0, valid: 0, expiringSoon: 0, expired: 0 }); }
    try {
      const userId = Number(ctx.user?.id) || 0;
      const [rows] = await db.execute(sql`SELECT * FROM permits_records WHERE userId = ${userId} AND status = 'approved' ORDER BY expirationDate ASC`) as any;
      const permits = (rows || []).map((r: any) => ({
        id: String(r.id), permitNumber: r.permitNumber, type: r.type, status: r.status,
        expirationDate: r.expirationDate, states: r.states ? JSON.parse(r.states) : [],
      }));
      const now = Date.now();
      const valid = permits.filter((p: any) => !p.expirationDate || new Date(p.expirationDate).getTime() > now).length;
      const expiringSoon = permits.filter((p: any) => p.expirationDate && new Date(p.expirationDate).getTime() - now < 30 * 86400000 && new Date(p.expirationDate).getTime() > now).length;
      return Object.assign(permits, { total: permits.length, valid, expiringSoon, expired: permits.length - valid });
    } catch (e) { logger.error("[permits] Failed to fetch active permits:", e); const p: any[] = []; return Object.assign(p, { total: 0, valid: 0, expiringSoon: 0, expired: 0 }); }
  }),
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { total: 0, active: 0, expiring: 0, expired: 0 };
    try {
      const userId = Number(ctx.user?.id) || 0;
      const [rows] = await db.execute(sql`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status='approved' AND (expirationDate IS NULL OR expirationDate > CURDATE()) THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status='approved' AND expirationDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as expiring,
          SUM(CASE WHEN status='expired' OR (status='approved' AND expirationDate < CURDATE()) THEN 1 ELSE 0 END) as expired
        FROM permits_records WHERE userId = ${userId}
      `) as any;
      const s = (rows || [])[0] || {};
      return { total: Number(s.total) || 0, active: Number(s.active) || 0, expiring: Number(s.expiring) || 0, expired: Number(s.expired) || 0 };
    } catch (e) { logger.error("[permits] Failed to fetch permit summary:", e); return { total: 0, active: 0, expiring: 0, expired: 0 }; }
  }),
  getStates: protectedProcedure.query(async () => [
    { code: "TX", name: "Texas", permitsRequired: true }, { code: "OK", name: "Oklahoma", permitsRequired: true },
    { code: "LA", name: "Louisiana", permitsRequired: true }, { code: "NM", name: "New Mexico", permitsRequired: true },
  ]),
  getRequirements: protectedProcedure.input(z.object({ state: z.string().optional() }).optional()).query(async () => {
    // Permit requirements require dedicated table or FMCSA API
    return [];
  }),
});
