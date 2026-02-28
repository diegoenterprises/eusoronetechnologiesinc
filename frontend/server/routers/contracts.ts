/**
 * CONTRACTS ROUTER
 * tRPC procedures for freight contracts and agreements
 */

import { z } from "zod";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { isolatedApprovedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { companies, agreements, loads } from "../../drizzle/schema";

const contractTypeSchema = z.enum([
  "dedicated", "spot", "volume", "master", "lane_commitment", "equipment_lease"
]);
const contractStatusSchema = z.enum([
  "draft", "pending_approval", "active", "expired", "terminated", "renewed"
]);

export const contractsRouter = router({
  /**
   * Get all contracts for ContractManagement page
   */
  getAll: protectedProcedure
    .input(z.object({ search: z.string().optional(), status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const userId = Number(ctx.user?.id) || 0;
        const conds: any[] = [sql`${agreements.partyAUserId} = ${userId} OR ${agreements.partyBUserId} = ${userId}`];
        if (input.status) conds.push(eq(agreements.status, input.status as any));
        const rows = await db.select().from(agreements).where(and(...conds)).orderBy(desc(agreements.createdAt)).limit(30);
        let results = rows.map(a => ({
          id: String(a.id), number: a.agreementNumber, customer: a.notes || '',
          type: a.agreementType, status: a.status,
          value: a.baseRate ? parseFloat(String(a.baseRate)) : 0,
          endDate: a.expirationDate?.toISOString()?.split('T')[0] || '',
        }));
        if (input.search) { const q = input.search.toLowerCase(); results = results.filter(r => r.number.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q)); }
        return results;
      } catch (e) { return []; }
    }),

  /**
   * Get contract stats for ContractManagement page
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { total: 0, active: 0, expiring: 0, expired: 0, totalValue: 0 };
      try {
        const userId = Number(ctx.user?.id) || 0;
        const userFilter = sql`${agreements.partyAUserId} = ${userId} OR ${agreements.partyBUserId} = ${userId}`;
        const [total] = await db.select({ count: sql<number>`count(*)` }).from(agreements).where(userFilter);
        const [active] = await db.select({ count: sql<number>`count(*)` }).from(agreements).where(and(userFilter, eq(agreements.status, 'active')));
        const [expired] = await db.select({ count: sql<number>`count(*)` }).from(agreements).where(and(userFilter, eq(agreements.status, 'expired')));
        const thirtyDays = new Date(Date.now() + 30 * 86400000);
        const [expiring] = await db.select({ count: sql<number>`count(*)` }).from(agreements).where(and(userFilter, eq(agreements.status, 'active'), sql`${agreements.expirationDate} IS NOT NULL AND ${agreements.expirationDate} <= ${thirtyDays}`));
        const [value] = await db.select({ total: sql<number>`COALESCE(SUM(CAST(${agreements.baseRate} AS DECIMAL)), 0)` }).from(agreements).where(and(userFilter, eq(agreements.status, 'active')));
        return { total: total?.count || 0, active: active?.count || 0, expiring: expiring?.count || 0, expired: expired?.count || 0, totalValue: value?.total || 0 };
      } catch (e) { return { total: 0, active: 0, expiring: 0, expired: 0, totalValue: 0 }; }
    }),

  /**
   * List contracts
   */
  list: protectedProcedure
    .input(z.object({
      type: contractTypeSchema.optional(),
      status: contractStatusSchema.optional(),
      customerId: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return { contracts: [], total: 0 };
      try {
        const userId = Number(ctx.user?.id) || 0;
        const conds: any[] = [sql`${agreements.partyAUserId} = ${userId} OR ${agreements.partyBUserId} = ${userId}`];
        if (input.status) conds.push(eq(agreements.status, input.status === 'pending_approval' ? 'pending_review' : input.status as any));
        const rows = await db.select().from(agreements).where(and(...conds)).orderBy(desc(agreements.createdAt)).limit(input.limit).offset(input.offset);
        const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(agreements).where(and(...conds));
        return {
          contracts: rows.map(a => ({ id: String(a.id), contractNumber: a.agreementNumber, type: a.agreementType, status: a.status, startDate: a.effectiveDate?.toISOString()?.split('T')[0] || '', endDate: a.expirationDate?.toISOString()?.split('T')[0] || '', baseRate: a.baseRate ? parseFloat(String(a.baseRate)) : 0 })),
          total: countRow?.count || 0,
        };
      } catch { return { contracts: [], total: 0 }; }
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
            id: String(a.id), contractNumber: a.agreementNumber, type: a.agreementType, status: a.status,
            customer: null, terms: { startDate: a.effectiveDate?.toISOString()?.split('T')[0] || '', endDate: a.expirationDate?.toISOString()?.split('T')[0] || '', autoRenew: a.autoRenew || false },
            pricing: { rateType: a.rateType || '', baseRate: a.baseRate ? parseFloat(String(a.baseRate)) : 0, fuelSurcharge: a.fuelSurchargeType || 'none' },
            volume: { commitment: a.volumeCommitmentTotal || 0, period: a.volumeCommitmentPeriod || '' },
            lanes: [], performance: null, documents: [], history: [],
            notes: a.notes || '', createdAt: a.createdAt?.toISOString() || '', createdBy: a.partyAUserId,
          };
        } catch { /* fall through */ }
      }
      return { id: input.id, contractNumber: '', type: '', status: 'draft', customer: null, terms: null, pricing: null, volume: null, lanes: [], performance: null, documents: [], history: [], notes: '', createdAt: '', createdBy: null };
    }),

  /**
   * Create contract
   */
  create: protectedProcedure
    .input(z.object({
      customerId: z.string(),
      type: contractTypeSchema,
      terms: z.object({
        startDate: z.string(),
        endDate: z.string(),
        autoRenew: z.boolean().default(false),
      }),
      pricing: z.object({
        rateType: z.enum(["per_mile", "flat", "percentage"]),
        baseRate: z.number(),
        fuelSurcharge: z.string().optional(),
      }),
      volumeCommitment: z.number().optional(),
      lanes: z.array(z.object({
        origin: z.string(),
        destination: z.string(),
        rate: z.number(),
      })).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const userId = Number(ctx.user?.id) || 0;
      const agrNum = `CTR-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
      const typeMap: Record<string, string> = { dedicated: 'master_service', spot: 'catalyst_shipper', volume: 'lane_commitment', master: 'master_service', lane_commitment: 'lane_commitment', equipment_lease: 'custom' };
      const rateMap: Record<string, string> = { per_mile: 'per_mile', flat: 'flat_rate', percentage: 'percentage' };
      const [result] = await db.insert(agreements).values({
        agreementNumber: agrNum,
        agreementType: (typeMap[input.type] || 'custom') as any,
        contractDuration: 'long_term' as any,
        partyAUserId: userId, partyARole: 'shipper',
        partyBUserId: parseInt(input.customerId, 10) || 0, partyBRole: 'catalyst',
        rateType: (rateMap[input.pricing.rateType] || 'per_mile') as any,
        baseRate: String(input.pricing.baseRate),
        effectiveDate: new Date(input.terms.startDate),
        expirationDate: new Date(input.terms.endDate),
        autoRenew: input.terms.autoRenew,
        volumeCommitmentTotal: input.volumeCommitment || null,
        lanes: input.lanes ? JSON.stringify(input.lanes) : null,
        notes: input.notes || `Contract ${agrNum}`,
        status: 'draft' as any,
      } as any).$returningId();
      // Auto-index contract for AI semantic search (fire-and-forget)
      try {
        const { indexAgreement } = await import("../services/embeddings/aiTurbocharge");
        indexAgreement({ id: result.id, title: `Contract ${agrNum}`, type: input.type, parties: `Party A: user ${userId}, Party B: ${input.customerId}`, terms: `Rate: $${input.pricing.baseRate}/${input.pricing.rateType}. ${input.terms.startDate} to ${input.terms.endDate}` });
      } catch {}

      return {
        id: String(result.id),
        contractNumber: agrNum,
        status: "draft",
        createdBy: ctx.user?.id,
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Update contract
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      pricing: z.object({
        baseRate: z.number(),
      }).optional(),
      volumeCommitment: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const numId = parseInt(input.id, 10);
      const updates: any = {};
      if (input.pricing?.baseRate) updates.baseRate = String(input.pricing.baseRate);
      if (input.volumeCommitment) updates.volumeCommitmentTotal = input.volumeCommitment;
      if (input.notes) updates.notes = input.notes;
      if (Object.keys(updates).length > 0) {
        await db.update(agreements).set(updates).where(eq(agreements.id, numId));
      }
      return { success: true, id: input.id, updatedBy: ctx.user?.id, updatedAt: new Date().toISOString() };
    }),

  /**
   * Submit for approval
   */
  submitForApproval: protectedProcedure
    .input(z.object({
      contractId: z.string(),
      approverEmail: z.string().email(),
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (db) {
        const numId = parseInt(input.contractId, 10);
        await db.update(agreements).set({ status: 'pending_review' as any }).where(eq(agreements.id, numId));
      }
      return { success: true, contractId: input.contractId, status: "pending_approval", sentTo: input.approverEmail, sentBy: ctx.user?.id, sentAt: new Date().toISOString() };
    }),

  /**
   * Approve contract
   */
  approve: protectedProcedure
    .input(z.object({
      contractId: z.string(),
      signature: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (db) {
        const numId = parseInt(input.contractId, 10);
        await db.update(agreements).set({ status: 'active' as any, effectiveDate: new Date() }).where(eq(agreements.id, numId));
      }
      return { success: true, contractId: input.contractId, status: "active", approvedBy: ctx.user?.id, approvedAt: new Date().toISOString() };
    }),

  /**
   * Renew contract
   */
  renew: protectedProcedure
    .input(z.object({
      contractId: z.string(),
      newEndDate: z.string(),
      rateAdjustment: z.number().optional(),
      volumeAdjustment: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const numId = parseInt(input.contractId, 10);
      // Mark old as renewed
      await db.update(agreements).set({ status: 'renewed' as any }).where(eq(agreements.id, numId));
      // Clone into new contract
      const [orig] = await db.select().from(agreements).where(eq(agreements.id, numId)).limit(1);
      if (!orig) throw new Error("Contract not found");
      const newNum = `CTR-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
      const newRate = input.rateAdjustment && orig.baseRate ? String(parseFloat(String(orig.baseRate)) + input.rateAdjustment) : orig.baseRate;
      const [result] = await db.insert(agreements).values({
        agreementNumber: newNum, agreementType: orig.agreementType, contractDuration: orig.contractDuration,
        partyAUserId: orig.partyAUserId, partyARole: orig.partyARole,
        partyBUserId: orig.partyBUserId, partyBRole: orig.partyBRole,
        notes: `Renewal of ${orig.agreementNumber}`, rateType: orig.rateType, baseRate: newRate,
        effectiveDate: new Date(), expirationDate: new Date(input.newEndDate),
        autoRenew: orig.autoRenew, volumeCommitmentTotal: input.volumeAdjustment || orig.volumeCommitmentTotal,
        status: 'active' as any,
      } as any).$returningId();
      return { success: true, originalContractId: input.contractId, newContractId: String(result.id), newContractNumber: newNum, renewedBy: ctx.user?.id, renewedAt: new Date().toISOString() };
    }),

  /**
   * Terminate contract
   */
  terminate: protectedProcedure
    .input(z.object({
      contractId: z.string(),
      reason: z.string(),
      effectiveDate: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (db) {
        const numId = parseInt(input.contractId, 10);
        await db.update(agreements).set({ status: 'terminated' as any, terminationDate: new Date(input.effectiveDate), notes: sql`CONCAT(COALESCE(${agreements.notes}, ''), '\nTerminated: ${input.reason}')` }).where(eq(agreements.id, numId));
      }
      return { success: true, contractId: input.contractId, status: "terminated", terminatedBy: ctx.user?.id, terminatedAt: new Date().toISOString() };
    }),

  /**
   * Get contract performance
   */
  getPerformance: protectedProcedure
    .input(z.object({ contractId: z.string(), period: z.enum(["month", "quarter", "ytd"]).default("quarter") }))
    .query(async ({ input }) => {
      const db = await getDb();
      const numId = parseInt(input.contractId, 10);
      if (db && numId) {
        try {
          const [agr] = await db.select({ partyAUserId: agreements.partyAUserId, partyBUserId: agreements.partyBUserId, volumeCommitmentTotal: agreements.volumeCommitmentTotal }).from(agreements).where(eq(agreements.id, numId)).limit(1);
          if (agr) {
            const daysMap: Record<string, number> = { month: 30, quarter: 90, ytd: 365 };
            const since = new Date(Date.now() - (daysMap[input.period] || 90) * 86400000);
            const [stats] = await db.select({ count: sql<number>`count(*)`, revenue: sql<number>`COALESCE(SUM(CAST(${loads.rate} AS DECIMAL)), 0)` }).from(loads).where(and(eq(loads.shipperId, agr.partyAUserId), gte(loads.createdAt, since)));
            const delivered = stats?.count || 0;
            const committed = agr.volumeCommitmentTotal || 0;
            return {
              contractId: input.contractId, period: input.period,
              volume: { committed, delivered, remaining: Math.max(0, committed - delivered), onTrack: committed === 0 || delivered >= committed * 0.8 },
              revenue: { total: stats?.revenue || 0, projected: 0, avgPerLoad: delivered > 0 ? Math.round((stats?.revenue || 0) / delivered) : 0 },
              performance: { onTimePickup: 0, onTimeDelivery: 0, claimsRate: 0, customerSatisfaction: 0 }, byLane: [],
            };
          }
        } catch { /* fall through */ }
      }
      return { contractId: input.contractId, period: input.period, volume: { committed: 0, delivered: 0, remaining: 0, onTrack: false }, revenue: { total: 0, projected: 0, avgPerLoad: 0 }, performance: { onTimePickup: 0, onTimeDelivery: 0, claimsRate: 0, customerSatisfaction: 0 }, byLane: [] };
    }),

  /**
   * Get expiring contracts
   */
  getExpiring: protectedProcedure
    .input(z.object({ daysAhead: z.number().default(90) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const userId = Number(ctx.user?.id) || 0;
        const futureDate = new Date(Date.now() + input.daysAhead * 86400000);
        const rows = await db.select().from(agreements).where(and(
          sql`${agreements.partyAUserId} = ${userId} OR ${agreements.partyBUserId} = ${userId}`,
          eq(agreements.status, 'active'),
          sql`${agreements.expirationDate} IS NOT NULL AND ${agreements.expirationDate} <= ${futureDate}`,
        )).orderBy(agreements.expirationDate).limit(20);
        return rows.map(a => ({ id: String(a.id), contractNumber: a.agreementNumber, type: a.agreementType, expirationDate: a.expirationDate?.toISOString()?.split('T')[0] || '', autoRenew: a.autoRenew || false }));
      } catch { return []; }
    }),

  /**
   * Get contract analytics
   */
  getAnalytics: protectedProcedure
    .input(z.object({ period: z.enum(["month", "quarter", "year"]).default("quarter") }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { period: input.period, summary: { activeContracts: 0, totalValue: 0, avgContractValue: 0, renewalRate: 0 }, byType: [], performance: { avgOnTimeDelivery: 0, avgClaimsRate: 0, avgCustomerSatisfaction: 0 }, upcoming: { expiring30Days: 0, expiring90Days: 0, pendingApproval: 0 } };
      try {
        const userId = Number(ctx.user?.id) || 0;
        const userFilter = sql`${agreements.partyAUserId} = ${userId} OR ${agreements.partyBUserId} = ${userId}`;
        const [active] = await db.select({ count: sql<number>`count(*)`, totalValue: sql<number>`COALESCE(SUM(CAST(${agreements.baseRate} AS DECIMAL)), 0)` }).from(agreements).where(and(userFilter, eq(agreements.status, 'active')));
        const [pending] = await db.select({ count: sql<number>`count(*)` }).from(agreements).where(and(userFilter, eq(agreements.status, 'pending_review')));
        const activeCount = active?.count || 0;
        return {
          period: input.period,
          summary: { activeContracts: activeCount, totalValue: active?.totalValue || 0, avgContractValue: activeCount > 0 ? Math.round((active?.totalValue || 0) / activeCount) : 0, renewalRate: 0 },
          byType: [], performance: { avgOnTimeDelivery: 0, avgClaimsRate: 0, avgCustomerSatisfaction: 0 },
          upcoming: { expiring30Days: 0, expiring90Days: 0, pendingApproval: pending?.count || 0 },
        };
      } catch { return { period: input.period, summary: { activeContracts: 0, totalValue: 0, avgContractValue: 0, renewalRate: 0 }, byType: [], performance: { avgOnTimeDelivery: 0, avgClaimsRate: 0, avgCustomerSatisfaction: 0 }, upcoming: { expiring30Days: 0, expiring90Days: 0, pendingApproval: 0 } }; }
    }),
});
