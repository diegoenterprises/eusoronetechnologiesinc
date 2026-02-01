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
    .query(async ({ input }) => {
      const contracts = [
        {
          id: "contract_001",
          contractNumber: "CTR-2025-00045",
          type: "volume",
          customer: { id: "cust_001", name: "Shell Oil Company" },
          status: "active",
          startDate: "2025-01-01",
          endDate: "2025-12-31",
          value: 500000,
          volumeCommitment: 400,
          volumeDelivered: 38,
          completionRate: 0.095,
        },
        {
          id: "contract_002",
          contractNumber: "CTR-2024-00089",
          type: "dedicated",
          customer: { id: "cust_002", name: "ExxonMobil" },
          status: "active",
          startDate: "2024-07-01",
          endDate: "2025-06-30",
          value: 750000,
          vehiclesCommitted: 5,
          vehiclesAssigned: 5,
        },
        {
          id: "contract_003",
          contractNumber: "CTR-2024-00075",
          type: "lane_commitment",
          customer: { id: "cust_004", name: "Valero" },
          status: "active",
          startDate: "2024-10-01",
          endDate: "2025-09-30",
          lanes: [
            { origin: "Houston, TX", destination: "Dallas, TX", weeklyVolume: 10 },
            { origin: "Houston, TX", destination: "San Antonio, TX", weeklyVolume: 8 },
          ],
        },
      ];

      let filtered = contracts;
      if (input.type) filtered = filtered.filter(c => c.type === input.type);
      if (input.status) filtered = filtered.filter(c => c.status === input.status);
      if (input.customerId) filtered = filtered.filter(c => c.customer.id === input.customerId);

      return {
        contracts: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
      };
    }),

  /**
   * Get contract by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        contractNumber: "CTR-2025-00045",
        type: "volume",
        status: "active",
        customer: {
          id: "cust_001",
          name: "Shell Oil Company",
          contact: "Sarah Shipper",
          email: "contracts@shell.com",
        },
        terms: {
          startDate: "2025-01-01",
          endDate: "2025-12-31",
          autoRenew: true,
          renewalNotice: 60,
          terminationNotice: 90,
        },
        pricing: {
          rateType: "per_mile",
          baseRate: 3.15,
          fuelSurcharge: "DOE Index",
          accessorials: [
            { type: "detention", rate: 75, unit: "per_hour", freeTime: 2 },
            { type: "layover", rate: 350, unit: "per_day" },
            { type: "hazmat", rate: 150, unit: "flat" },
          ],
        },
        volume: {
          commitment: 400,
          delivered: 38,
          remaining: 362,
          completionRate: 0.095,
          projectedCompletion: "on_track",
        },
        lanes: [
          { origin: "Houston, TX", destination: "Dallas, TX", rate: 3.15, volume: 180 },
          { origin: "Houston, TX", destination: "San Antonio, TX", rate: 2.95, volume: 120 },
          { origin: "Baytown, TX", destination: "Austin, TX", rate: 3.05, volume: 100 },
        ],
        performance: {
          onTimePickup: 0.96,
          onTimeDelivery: 0.94,
          claimsRate: 0.01,
          avgTransitTime: 4.2,
        },
        documents: [
          { id: "doc_001", name: "Signed Contract", type: "contract", uploadedAt: "2024-12-15" },
          { id: "doc_002", name: "Insurance Certificate", type: "insurance", uploadedAt: "2025-01-01" },
          { id: "doc_003", name: "Rate Confirmation", type: "rate_con", uploadedAt: "2024-12-20" },
        ],
        history: [
          { action: "created", date: "2024-12-01", user: "John Broker" },
          { action: "sent_for_approval", date: "2024-12-10", user: "John Broker" },
          { action: "approved", date: "2024-12-15", user: "Sarah Shipper" },
          { action: "activated", date: "2025-01-01", user: "System" },
        ],
        notes: "Volume commitment based on previous year plus 10% growth.",
        createdAt: "2024-12-01",
        createdBy: { id: "u1", name: "John Broker" },
      };
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
    .input(z.object({
      contractId: z.string(),
      period: z.enum(["month", "quarter", "ytd"]).default("quarter"),
    }))
    .query(async ({ input }) => {
      return {
        contractId: input.contractId,
        period: input.period,
        volume: {
          committed: 100,
          delivered: 38,
          remaining: 62,
          onTrack: true,
        },
        revenue: {
          total: 47500,
          projected: 125000,
          avgPerLoad: 1250,
        },
        performance: {
          onTimePickup: 0.96,
          onTimeDelivery: 0.94,
          claimsRate: 0.01,
          customerSatisfaction: 4.7,
        },
        byLane: [
          { lane: "Houston to Dallas", loads: 18, revenue: 22500, onTime: 0.95 },
          { lane: "Houston to San Antonio", loads: 12, revenue: 14000, onTime: 0.92 },
          { lane: "Baytown to Austin", loads: 8, revenue: 11000, onTime: 0.96 },
        ],
      };
    }),

  /**
   * Get expiring contracts
   */
  getExpiring: protectedProcedure
    .input(z.object({
      daysAhead: z.number().default(90),
    }))
    .query(async ({ input }) => {
      return [
        {
          id: "contract_002",
          contractNumber: "CTR-2024-00089",
          customer: "ExxonMobil",
          type: "dedicated",
          endDate: "2025-06-30",
          daysRemaining: 158,
          value: 750000,
          autoRenew: false,
        },
      ];
    }),

  /**
   * Get contract analytics
   */
  getAnalytics: protectedProcedure
    .input(z.object({
      period: z.enum(["month", "quarter", "year"]).default("quarter"),
    }))
    .query(async ({ input }) => {
      return {
        period: input.period,
        summary: {
          activeContracts: 12,
          totalValue: 2500000,
          avgContractValue: 208333,
          renewalRate: 0.85,
        },
        byType: [
          { type: "volume", count: 5, value: 1200000 },
          { type: "dedicated", count: 3, value: 900000 },
          { type: "lane_commitment", count: 4, value: 400000 },
        ],
        performance: {
          avgOnTimeDelivery: 0.94,
          avgClaimsRate: 0.015,
          avgCustomerSatisfaction: 4.6,
        },
        upcoming: {
          expiring30Days: 1,
          expiring90Days: 3,
          pendingApproval: 2,
        },
      };
    }),
});
