/**
 * FACTORING ROUTER
 * tRPC procedures for freight factoring and quick pay services
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const invoiceStatusSchema = z.enum([
  "pending", "submitted", "approved", "funded", "paid", "rejected", "disputed"
]);

export const factoringRouter = router({
  /**
   * Get factoring account overview
   */
  getOverview: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        account: {
          status: "active",
          creditLimit: 100000,
          availableCredit: 75000,
          usedCredit: 25000,
          reserveBalance: 5000,
          factoringRate: 0.025,
          advanceRate: 0.95,
        },
        currentPeriod: {
          invoicesSubmitted: 12,
          totalFactored: 45000,
          feesCharged: 1125,
          pendingPayments: 15000,
        },
        recentActivity: [
          { date: "2025-01-23", type: "advance", amount: 4750, invoice: "INV-2025-00450" },
          { date: "2025-01-22", type: "payment_received", amount: 5000, invoice: "INV-2025-00440" },
          { date: "2025-01-20", type: "advance", amount: 3800, invoice: "INV-2025-00445" },
        ],
      };
    }),

  /**
   * Get factored invoices
   */
  getInvoices: protectedProcedure
    .input(z.object({
      status: invoiceStatusSchema.optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const invoices = [
        {
          id: "fact_001",
          invoiceNumber: "INV-2025-00450",
          customer: "Shell Oil Company",
          loadNumber: "LOAD-45850",
          invoiceAmount: 5000,
          advanceAmount: 4750,
          feeAmount: 125,
          status: "funded",
          submittedAt: "2025-01-23T10:00:00Z",
          fundedAt: "2025-01-23T14:00:00Z",
          expectedPayment: "2025-02-22",
        },
        {
          id: "fact_002",
          invoiceNumber: "INV-2025-00445",
          customer: "ExxonMobil",
          loadNumber: "LOAD-45820",
          invoiceAmount: 4000,
          advanceAmount: 3800,
          feeAmount: 100,
          status: "funded",
          submittedAt: "2025-01-20T09:00:00Z",
          fundedAt: "2025-01-20T12:00:00Z",
          expectedPayment: "2025-02-19",
        },
        {
          id: "fact_003",
          invoiceNumber: "INV-2025-00440",
          customer: "Valero",
          loadNumber: "LOAD-45800",
          invoiceAmount: 5000,
          advanceAmount: 4750,
          feeAmount: 125,
          status: "paid",
          submittedAt: "2025-01-15T11:00:00Z",
          fundedAt: "2025-01-15T15:00:00Z",
          paidAt: "2025-01-22T10:00:00Z",
          reserveReleased: 250,
        },
      ];

      let filtered = invoices;
      if (input.status) filtered = filtered.filter(i => i.status === input.status);

      return {
        invoices: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
      };
    }),

  /**
   * Submit invoice for factoring
   */
  submitInvoice: protectedProcedure
    .input(z.object({
      invoiceId: z.string(),
      loadId: z.string(),
      customerId: z.string(),
      invoiceAmount: z.number().positive(),
      documents: z.array(z.object({
        type: z.enum(["invoice", "bol", "pod", "rate_con"]),
        documentId: z.string(),
      })),
      quickPay: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const advanceRate = input.quickPay ? 0.97 : 0.95;
      const feeRate = input.quickPay ? 0.03 : 0.025;
      
      return {
        factoringId: `fact_${Date.now()}`,
        invoiceAmount: input.invoiceAmount,
        advanceAmount: input.invoiceAmount * advanceRate,
        estimatedFee: input.invoiceAmount * feeRate,
        status: "submitted",
        estimatedFundingTime: input.quickPay ? "4 hours" : "24 hours",
        submittedBy: ctx.user?.id,
        submittedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get invoice status
   */
  getInvoiceStatus: protectedProcedure
    .input(z.object({
      factoringId: z.string(),
    }))
    .query(async ({ input }) => {
      return {
        factoringId: input.factoringId,
        invoiceNumber: "INV-2025-00450",
        status: "funded",
        timeline: [
          { step: "submitted", completedAt: "2025-01-23T10:00:00Z", status: "complete" },
          { step: "documents_verified", completedAt: "2025-01-23T11:00:00Z", status: "complete" },
          { step: "customer_verified", completedAt: "2025-01-23T12:00:00Z", status: "complete" },
          { step: "approved", completedAt: "2025-01-23T13:00:00Z", status: "complete" },
          { step: "funded", completedAt: "2025-01-23T14:00:00Z", status: "complete" },
          { step: "payment_received", completedAt: null, status: "pending" },
          { step: "reserve_released", completedAt: null, status: "pending" },
        ],
        payment: {
          method: "ach",
          bankAccount: "****4567",
          amount: 4750,
          fundedAt: "2025-01-23T14:00:00Z",
        },
      };
    }),

  /**
   * Get approved customers
   */
  getApprovedCustomers: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          id: "cust_001",
          name: "Shell Oil Company",
          creditLimit: 50000,
          availableCredit: 35000,
          paymentTerms: 30,
          avgDaysToPayment: 28,
          status: "approved",
        },
        {
          id: "cust_002",
          name: "ExxonMobil",
          creditLimit: 40000,
          availableCredit: 32000,
          paymentTerms: 30,
          avgDaysToPayment: 25,
          status: "approved",
        },
        {
          id: "cust_004",
          name: "Valero",
          creditLimit: 35000,
          availableCredit: 30000,
          paymentTerms: 45,
          avgDaysToPayment: 42,
          status: "approved",
        },
      ];
    }),

  /**
   * Request customer credit check
   */
  requestCreditCheck: protectedProcedure
    .input(z.object({
      customerName: z.string(),
      customerAddress: z.string(),
      taxId: z.string().optional(),
      mcNumber: z.string().optional(),
      requestedLimit: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        requestId: `credit_${Date.now()}`,
        customerName: input.customerName,
        status: "pending",
        estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        requestedBy: ctx.user?.id,
        requestedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get reserve balance
   */
  getReserveBalance: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        currentBalance: 5000,
        pendingRelease: 500,
        history: [
          { date: "2025-01-22", type: "release", amount: 250, invoice: "INV-2025-00440" },
          { date: "2025-01-20", type: "hold", amount: 200, invoice: "INV-2025-00445" },
          { date: "2025-01-18", type: "release", amount: 300, invoice: "INV-2025-00430" },
        ],
      };
    }),

  /**
   * Request reserve withdrawal
   */
  requestReserveWithdrawal: protectedProcedure
    .input(z.object({
      amount: z.number().positive(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        requestId: `withdraw_${Date.now()}`,
        amount: input.amount,
        status: "pending_approval",
        requestedBy: ctx.user?.id,
        requestedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get factoring reports
   */
  getReports: protectedProcedure
    .input(z.object({
      period: z.enum(["month", "quarter", "year"]).default("month"),
    }))
    .query(async ({ input }) => {
      return {
        period: input.period,
        summary: {
          totalFactored: 125000,
          totalFees: 3125,
          effectiveRate: 0.025,
          avgDaysToPayment: 28,
          invoicesFactored: 32,
        },
        byCustomer: [
          { customer: "Shell Oil Company", factored: 50000, fees: 1250, invoices: 12 },
          { customer: "ExxonMobil", factored: 40000, fees: 1000, invoices: 10 },
          { customer: "Valero", factored: 35000, fees: 875, invoices: 10 },
        ],
        savingsVsTraditional: {
          traditionalWaitDays: 45,
          actualWaitDays: 1,
          cashFlowImprovement: 118750,
        },
      };
    }),

  /**
   * Get fee schedule
   */
  getFeeSchedule: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        standardFactoring: {
          advanceRate: 0.95,
          feeRate: 0.025,
          additionalDaysFee: 0.0005,
          processingTime: "24 hours",
        },
        quickPay: {
          advanceRate: 0.97,
          feeRate: 0.03,
          processingTime: "4 hours",
        },
        nonRecourse: {
          available: true,
          additionalFee: 0.005,
          coverageLimit: 50000,
        },
        minimums: {
          invoiceMinimum: 500,
          monthlyMinimum: 2500,
        },
      };
    }),

  /**
   * Upload supporting documents
   */
  uploadDocument: protectedProcedure
    .input(z.object({
      factoringId: z.string(),
      documentType: z.enum(["invoice", "bol", "pod", "rate_con", "other"]),
      fileName: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        documentId: `doc_${Date.now()}`,
        uploadUrl: `/api/factoring/${input.factoringId}/documents/upload`,
        uploadedBy: ctx.user?.id,
      };
    }),

  /**
   * Dispute invoice
   */
  disputeInvoice: protectedProcedure
    .input(z.object({
      factoringId: z.string(),
      reason: z.string(),
      supportingDocs: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        disputeId: `disp_${Date.now()}`,
        factoringId: input.factoringId,
        status: "opened",
        openedBy: ctx.user?.id,
        openedAt: new Date().toISOString(),
      };
    }),

  getSummary: protectedProcedure.query(async () => ({ totalFactored: 125000, pendingPayments: 15000, availableCredit: 75000 })),
  getRates: protectedProcedure.query(async () => ({ standard: 0.025, quickPay: 0.035, sameDay: 0.045 })),
});
