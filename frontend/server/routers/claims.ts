/**
 * CLAIMS ROUTER
 * tRPC procedures for cargo claims and disputes management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const claimTypeSchema = z.enum([
  "damage", "shortage", "loss", "delay", "contamination", "other"
]);
const claimStatusSchema = z.enum([
  "draft", "submitted", "under_review", "investigating", "approved", "denied", "settled", "closed"
]);

export const claimsRouter = router({
  /**
   * List claims
   */
  list: protectedProcedure
    .input(z.object({
      status: claimStatusSchema.optional(),
      type: claimTypeSchema.optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const claims = [
        {
          id: "claim_001",
          claimNumber: "CLM-2025-00123",
          type: "damage",
          status: "under_review",
          loadNumber: "LOAD-45850",
          shipper: "Shell Oil Company",
          carrier: "ABC Transport LLC",
          amount: 2500.00,
          filedDate: "2025-01-18",
          description: "Product contamination during transport",
        },
        {
          id: "claim_002",
          claimNumber: "CLM-2025-00120",
          type: "shortage",
          status: "investigating",
          loadNumber: "LOAD-45820",
          shipper: "ExxonMobil",
          carrier: "FastHaul LLC",
          amount: 1200.00,
          filedDate: "2025-01-15",
          description: "Reported shortage of 150 gallons at delivery",
        },
        {
          id: "claim_003",
          claimNumber: "CLM-2025-00115",
          type: "delay",
          status: "settled",
          loadNumber: "LOAD-45800",
          shipper: "Valero",
          carrier: "ABC Transport LLC",
          amount: 500.00,
          filedDate: "2025-01-10",
          settledAmount: 350.00,
          settledDate: "2025-01-20",
          description: "Delivery delayed by 4 hours",
        },
      ];

      let filtered = claims;
      if (input.status) filtered = filtered.filter(c => c.status === input.status);
      if (input.type) filtered = filtered.filter(c => c.type === input.type);

      return {
        claims: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
        summary: {
          totalOpen: claims.filter(c => !["settled", "closed", "denied"].includes(c.status)).length,
          totalAmount: claims.reduce((sum, c) => sum + c.amount, 0),
        },
      };
    }),

  /**
   * Get claim by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        claimNumber: "CLM-2025-00123",
        type: "damage",
        status: "under_review",
        load: {
          loadNumber: "LOAD-45850",
          product: "Unleaded Gasoline",
          quantity: 8500,
          unit: "gallons",
          origin: "Shell Houston Terminal",
          destination: "7-Eleven Distribution Center, Dallas",
          pickupDate: "2025-01-17",
          deliveryDate: "2025-01-17",
        },
        shipper: {
          id: "ship_001",
          name: "Shell Oil Company",
          contact: "Sarah Shipper",
          email: "claims@shell.com",
          phone: "555-0200",
        },
        carrier: {
          id: "car_001",
          name: "ABC Transport LLC",
          contact: "John Manager",
          email: "claims@abctransport.com",
          phone: "555-0100",
        },
        driver: {
          id: "d1",
          name: "Mike Johnson",
        },
        amount: 2500.00,
        description: "Product contamination detected at delivery. Fuel sample tested positive for water contamination exceeding acceptable limits.",
        evidence: [
          { id: "ev_001", type: "photo", name: "Fuel sample test results.jpg", uploadedAt: "2025-01-18T10:00:00Z" },
          { id: "ev_002", type: "document", name: "Lab analysis report.pdf", uploadedAt: "2025-01-18T14:00:00Z" },
          { id: "ev_003", type: "photo", name: "Tank inspection photos.zip", uploadedAt: "2025-01-18T11:00:00Z" },
        ],
        timeline: [
          { timestamp: "2025-01-17T16:00:00Z", action: "Delivery completed", user: "Mike Johnson" },
          { timestamp: "2025-01-17T16:30:00Z", action: "Quality issue reported by receiver", user: "7-Eleven Receiving" },
          { timestamp: "2025-01-18T09:00:00Z", action: "Claim filed by shipper", user: "Sarah Shipper" },
          { timestamp: "2025-01-18T10:00:00Z", action: "Evidence uploaded", user: "Sarah Shipper" },
          { timestamp: "2025-01-19T09:00:00Z", action: "Claim under review", user: "Claims Team" },
        ],
        notes: [
          { id: "note_001", content: "Driver states tank was sealed properly during transport", author: "Claims Adjuster", createdAt: "2025-01-19T10:00:00Z" },
        ],
        filedDate: "2025-01-18",
        filedBy: { id: "u5", name: "Sarah Shipper" },
      };
    }),

  /**
   * File new claim
   */
  file: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      type: claimTypeSchema,
      amount: z.number().positive(),
      description: z.string(),
      evidenceIds: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const claimNumber = `CLM-2025-${String(Date.now()).slice(-5)}`;
      
      return {
        id: `claim_${Date.now()}`,
        claimNumber,
        status: "submitted",
        filedBy: ctx.user?.id,
        filedAt: new Date().toISOString(),
      };
    }),

  /**
   * Update claim
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      amount: z.number().positive().optional(),
      description: z.string().optional(),
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
   * Update claim status
   */
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: claimStatusSchema,
      notes: z.string().optional(),
      settledAmount: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        id: input.id,
        newStatus: input.status,
        updatedBy: ctx.user?.id,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Add evidence to claim
   */
  addEvidence: protectedProcedure
    .input(z.object({
      claimId: z.string(),
      type: z.enum(["photo", "document", "video", "other"]),
      name: z.string(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `ev_${Date.now()}`,
        claimId: input.claimId,
        uploadUrl: `/api/claims/${input.claimId}/evidence/upload`,
        uploadedBy: ctx.user?.id,
        uploadedAt: new Date().toISOString(),
      };
    }),

  /**
   * Add note to claim
   */
  addNote: protectedProcedure
    .input(z.object({
      claimId: z.string(),
      content: z.string(),
      internal: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `note_${Date.now()}`,
        claimId: input.claimId,
        content: input.content,
        author: ctx.user?.id,
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Respond to claim (carrier)
   */
  respond: protectedProcedure
    .input(z.object({
      claimId: z.string(),
      response: z.enum(["accept", "dispute", "counter"]),
      counterAmount: z.number().optional(),
      explanation: z.string(),
      evidenceIds: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        claimId: input.claimId,
        response: input.response,
        respondedBy: ctx.user?.id,
        respondedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get claims statistics
   */
  getStatistics: protectedProcedure
    .input(z.object({
      period: z.enum(["month", "quarter", "year"]).default("year"),
    }))
    .query(async ({ input }) => {
      return {
        period: input.period,
        total: 24,
        byStatus: {
          submitted: 2,
          under_review: 3,
          investigating: 2,
          approved: 5,
          denied: 4,
          settled: 6,
          closed: 2,
        },
        byType: {
          damage: 8,
          shortage: 6,
          loss: 2,
          delay: 5,
          contamination: 2,
          other: 1,
        },
        financials: {
          totalClaimed: 125000,
          totalSettled: 85000,
          avgSettlementRate: 0.68,
          avgResolutionDays: 12,
        },
      };
    }),

  /**
   * Settle claim
   */
  settle: protectedProcedure
    .input(z.object({
      claimId: z.string(),
      settledAmount: z.number(),
      settlementNotes: z.string(),
      paymentMethod: z.enum(["deduct_from_payment", "separate_payment", "credit"]),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        claimId: input.claimId,
        settledAmount: input.settledAmount,
        settledBy: ctx.user?.id,
        settledAt: new Date().toISOString(),
      };
    }),

  /**
   * Export claims report
   */
  exportReport: protectedProcedure
    .input(z.object({
      format: z.enum(["pdf", "csv", "xlsx"]),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      status: claimStatusSchema.optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        reportId: `report_${Date.now()}`,
        downloadUrl: `/api/claims/reports/${Date.now()}.${input.format}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };
    }),
});
