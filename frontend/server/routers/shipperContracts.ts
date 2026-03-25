/**
 * SHIPPER CONTRACTS ROUTER
 * tRPC procedures for shipper contract management
 */

import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { isolatedApprovedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { companies, agreements } from "../../drizzle/schema";
import { unsafeCast } from "../_core/types/unsafe";

export const shipperContractsRouter = router({
  /**
   * List contracts for ShipperContracts page
   */
  list: protectedProcedure
    .input(z.object({ status: z.string().optional(), limit: z.number().optional().default(50) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const userId = Number(ctx.user?.id) || 0;
        const conds: any[] = [sql`${agreements.partyAUserId} = ${userId} OR ${agreements.partyBUserId} = ${userId}`];
        if (input.status) conds.push(eq(agreements.status, unsafeCast(input.status)));
        const rows = await db.select().from(agreements).where(and(...conds)).orderBy(desc(agreements.createdAt)).limit(input.limit);
        return rows.map(a => ({
          id: String(a.id),
          number: a.agreementNumber,
          shipper: a.notes || '',
          status: a.status,
          startDate: a.effectiveDate?.toISOString()?.split('T')[0] || '',
          endDate: a.expirationDate?.toISOString()?.split('T')[0] || '',
          value: a.baseRate ? parseFloat(String(a.baseRate)) : 0,
          terms: a.clauses || '',
          lanes: a.lanes ? (() => { try { return JSON.parse(a.lanes); } catch { return []; } })() : [],
        }));
      } catch { return []; }
    }),

  /**
   * Get summary for ShipperContracts page
   */
  getSummary: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb(); if (!db) return { total: 0, active: 0, pending: 0, expired: 0, expiringSoon: 0, totalValue: 0 };
      try {
        const userId = Number(ctx.user?.id) || 0;
        const userFilter = sql`${agreements.partyAUserId} = ${userId} OR ${agreements.partyBUserId} = ${userId}`;
        const [total] = await db.select({ count: sql<number>`COUNT(*)` }).from(agreements).where(userFilter);
        const [active] = await db.select({ count: sql<number>`COUNT(*)` }).from(agreements).where(and(userFilter, eq(agreements.status, 'active')));
        const [pending] = await db.select({ count: sql<number>`COUNT(*)` }).from(agreements).where(and(userFilter, eq(agreements.status, 'pending_review')));
        const [expired] = await db.select({ count: sql<number>`COUNT(*)` }).from(agreements).where(and(userFilter, eq(agreements.status, 'expired')));
        const thirtyDays = new Date(Date.now() + 30 * 86400000);
        const [expiring] = await db.select({ count: sql<number>`COUNT(*)` }).from(agreements).where(and(userFilter, eq(agreements.status, 'active'), sql`${agreements.expirationDate} IS NOT NULL AND ${agreements.expirationDate} <= ${thirtyDays}`));
        const [value] = await db.select({ total: sql<number>`COALESCE(SUM(CAST(${agreements.baseRate} AS DECIMAL)), 0)` }).from(agreements).where(and(userFilter, eq(agreements.status, 'active')));
        return {
          total: total?.count || 0,
          active: active?.count || 0,
          pending: pending?.count || 0,
          expired: expired?.count || 0,
          expiringSoon: expiring?.count || 0,
          totalValue: Math.round(value?.total || 0),
        };
      } catch { return { total: 0, active: 0, pending: 0, expired: 0, expiringSoon: 0, totalValue: 0 }; }
    }),

  /**
   * Get contract by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const numId = parseInt(input.id, 10);
      if (db && numId) {
        try {
          const [a] = await db.select().from(agreements).where(eq(agreements.id, numId)).limit(1);
          if (a) return {
            id: String(a.id),
            number: a.agreementNumber,
            shipper: a.notes || '',
            status: a.status,
            startDate: a.effectiveDate?.toISOString()?.split('T')[0] || '',
            endDate: a.expirationDate?.toISOString()?.split('T')[0] || '',
            value: a.baseRate ? parseFloat(String(a.baseRate)) : 0,
            terms: a.clauses || '',
            lanes: a.lanes ? (() => { try { return JSON.parse(a.lanes); } catch { return []; } })() : [],
          };
        } catch { /* fall through */ }
      }
      return {
        id: input.id, number: "", shipper: "", status: "draft",
        startDate: "", endDate: "", value: 0, terms: "", lanes: [],
      };
    }),
});
