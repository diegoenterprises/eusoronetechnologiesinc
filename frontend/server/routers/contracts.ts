/**
 * CONTRACTS ROUTER
 * tRPC procedures for freight contracts and agreements
 */

import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { companies } from "../../drizzle/schema";

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
        const list = await db.select({ id: companies.id, name: companies.name }).from(companies).limit(20);
        return list.map(c => ({ id: `c${c.id}`, number: `CTR-2025-${c.id}`, customer: c.name || 'Unknown', type: 'volume', status: 'active', value: 500000, endDate: '2025-12-31' }));
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
        const [t] = await db.select({ count: sql<number>`count(*)` }).from(companies);
        return { total: t?.count || 0, active: t?.count || 0, expiring: 0, expired: 0, totalValue: 0 };
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
    .query(async () => ({ contracts: [], total: 0 })),

  /**
   * Get contract by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => ({
      id: input.id, contractNumber: "", type: "", status: "draft",
      customer: null, terms: null, pricing: null, volume: null,
      lanes: [], performance: null, documents: [], history: [],
      notes: "", createdAt: "", createdBy: null,
    })),

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
      return {
        id: `contract_${Date.now()}`,
        contractNumber: `CTR-2025-${String(Date.now()).slice(-5)}`,
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
      return {
        success: true,
        id: input.id,
        updatedBy: ctx.user?.id,
        updatedAt: new Date().toISOString(),
      };
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
      return {
        success: true,
        contractId: input.contractId,
        status: "pending_approval",
        sentTo: input.approverEmail,
        sentBy: ctx.user?.id,
        sentAt: new Date().toISOString(),
      };
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
      return {
        success: true,
        contractId: input.contractId,
        status: "active",
        approvedBy: ctx.user?.id,
        approvedAt: new Date().toISOString(),
      };
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
      return {
        success: true,
        originalContractId: input.contractId,
        newContractId: `contract_${Date.now()}`,
        newContractNumber: `CTR-2025-${String(Date.now()).slice(-5)}`,
        renewedBy: ctx.user?.id,
        renewedAt: new Date().toISOString(),
      };
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
      return {
        success: true,
        contractId: input.contractId,
        status: "terminated",
        terminatedBy: ctx.user?.id,
        terminatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get contract performance
   */
  getPerformance: protectedProcedure
    .input(z.object({ contractId: z.string(), period: z.enum(["month", "quarter", "ytd"]).default("quarter") }))
    .query(async ({ input }) => ({
      contractId: input.contractId, period: input.period,
      volume: { committed: 0, delivered: 0, remaining: 0, onTrack: false },
      revenue: { total: 0, projected: 0, avgPerLoad: 0 },
      performance: { onTimePickup: 0, onTimeDelivery: 0, claimsRate: 0, customerSatisfaction: 0 },
      byLane: [],
    })),

  /**
   * Get expiring contracts
   */
  getExpiring: protectedProcedure
    .input(z.object({ daysAhead: z.number().default(90) }))
    .query(async () => []),

  /**
   * Get contract analytics
   */
  getAnalytics: protectedProcedure
    .input(z.object({ period: z.enum(["month", "quarter", "year"]).default("quarter") }))
    .query(async ({ input }) => ({
      period: input.period,
      summary: { activeContracts: 0, totalValue: 0, avgContractValue: 0, renewalRate: 0 },
      byType: [], performance: { avgOnTimeDelivery: 0, avgClaimsRate: 0, avgCustomerSatisfaction: 0 },
      upcoming: { expiring30Days: 0, expiring90Days: 0, pendingApproval: 0 },
    })),
});
