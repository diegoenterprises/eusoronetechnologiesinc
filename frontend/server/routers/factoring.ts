/**
 * FACTORING ROUTER
 * tRPC procedures for freight factoring and quick pay services
 */

import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { adminProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { factoringInvoices, loads, users, companies } from "../../drizzle/schema";

const invoiceStatusSchema = z.enum([
  "submitted", "under_review", "approved", "funded", "collection",
  "collected", "short_paid", "disputed", "chargedback", "closed"
]);

export const factoringRouter = router({
  create: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      invoiceAmount: z.number(),
      advanceRate: z.number().optional(),
      factoringFeePercent: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const userId = Number(ctx.user?.id) || 0;
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
      const advRate = input.advanceRate || 97;
      const feePercent = input.factoringFeePercent || 3;
      const feeAmount = Math.round(input.invoiceAmount * (feePercent / 100) * 100) / 100;
      const advanceAmount = Math.round(input.invoiceAmount * (advRate / 100) * 100) / 100;
      const reserveAmount = Math.round((input.invoiceAmount - advanceAmount - feeAmount) * 100) / 100;
      const [result] = await db.insert(factoringInvoices).values({
        loadId: input.loadId,
        catalystUserId: userId,
        invoiceNumber,
        invoiceAmount: String(input.invoiceAmount),
        advanceRate: String(advRate),
        factoringFeePercent: String(feePercent),
        factoringFeeAmount: String(feeAmount),
        advanceAmount: String(advanceAmount),
        reserveAmount: String(reserveAmount),
        notes: input.notes,
        status: "submitted",
        dueDate: new Date(Date.now() + 30 * 86400000),
      }).$returningId();
      return { success: true, id: result.id, invoiceNumber };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: invoiceStatusSchema.optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const updates: Record<string, any> = {};
      if (input.status) {
        updates.status = input.status;
        if (input.status === "approved") updates.approvedAt = new Date();
        if (input.status === "funded") updates.fundedAt = new Date();
        if (input.status === "collected") updates.collectedAt = new Date();
      }
      if (input.notes) updates.notes = input.notes;
      if (Object.keys(updates).length > 0) {
        await db.update(factoringInvoices).set(updates).where(eq(factoringInvoices.id, input.id));
      }
      return { success: true, id: input.id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      await db.update(factoringInvoices).set({ status: "closed" }).where(eq(factoringInvoices.id, input.id));
      return { success: true, id: input.id };
    }),

  /**
   * Get factoring account overview from real DB data
   */
  getOverview: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { account: { status: 'inactive', creditLimit: 0, availableCredit: 0, usedCredit: 0, reserveBalance: 0, factoringRate: 0.025, advanceRate: 0.95 }, currentPeriod: { invoicesSubmitted: 0, totalFactored: 0, feesCharged: 0, pendingPayments: 0 }, recentActivity: [] };
      try {
        const userId = Number(ctx.user?.id) || 0;
        const [stats] = await db.select({
          total: sql<number>`COUNT(*)`,
          totalFactored: sql<number>`COALESCE(SUM(CAST(${factoringInvoices.invoiceAmount} AS DECIMAL)), 0)`,
          totalFees: sql<number>`COALESCE(SUM(CAST(${factoringInvoices.factoringFeeAmount} AS DECIMAL)), 0)`,
          totalReserve: sql<number>`COALESCE(SUM(CAST(${factoringInvoices.reserveAmount} AS DECIMAL)), 0)`,
          pending: sql<number>`SUM(CASE WHEN ${factoringInvoices.status} IN ('submitted','under_review') THEN 1 ELSE 0 END)`,
        }).from(factoringInvoices).where(eq(factoringInvoices.catalystUserId, userId));
        const hasActivity = (stats?.total || 0) > 0;
        const recent = await db.select({ id: factoringInvoices.id, invoiceNumber: factoringInvoices.invoiceNumber, status: factoringInvoices.status, invoiceAmount: factoringInvoices.invoiceAmount, submittedAt: factoringInvoices.submittedAt }).from(factoringInvoices).where(eq(factoringInvoices.catalystUserId, userId)).orderBy(desc(factoringInvoices.submittedAt)).limit(5);
        return {
          account: { status: hasActivity ? 'active' : 'inactive', creditLimit: 100000, availableCredit: 100000 - Math.round(stats?.totalFactored || 0), usedCredit: Math.round(stats?.totalFactored || 0), reserveBalance: Math.round(stats?.totalReserve || 0), factoringRate: 0.03, advanceRate: 0.97 },
          currentPeriod: { invoicesSubmitted: stats?.total || 0, totalFactored: Math.round(stats?.totalFactored || 0), feesCharged: Math.round(stats?.totalFees || 0), pendingPayments: stats?.pending || 0 },
          recentActivity: recent.map(r => ({ id: String(r.id), invoiceNumber: r.invoiceNumber, status: r.status, amount: r.invoiceAmount ? parseFloat(String(r.invoiceAmount)) : 0, date: r.submittedAt?.toISOString() || '' })),
        };
      } catch (e) { return { account: { status: 'inactive', creditLimit: 0, availableCredit: 0, usedCredit: 0, reserveBalance: 0, factoringRate: 0.025, advanceRate: 0.95 }, currentPeriod: { invoicesSubmitted: 0, totalFactored: 0, feesCharged: 0, pendingPayments: 0 }, recentActivity: [] }; }
    }),

  /**
   * Get factored invoices — empty for new users
   */
  getInvoices: protectedProcedure
    .input(z.object({ status: invoiceStatusSchema.optional(), limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const userId = Number(ctx.user?.id) || 0;
        const conds: any[] = [eq(factoringInvoices.catalystUserId, userId)];
        if (input.status) conds.push(eq(factoringInvoices.status, input.status as any));
        const rows = await db.select().from(factoringInvoices).where(and(...conds)).orderBy(desc(factoringInvoices.submittedAt)).limit(input.limit);
        return rows.map(r => ({
          id: String(r.id), invoiceNumber: r.invoiceNumber, loadId: r.loadId,
          invoiceAmount: r.invoiceAmount ? parseFloat(String(r.invoiceAmount)) : 0,
          advanceAmount: r.advanceAmount ? parseFloat(String(r.advanceAmount)) : 0,
          factoringFee: r.factoringFeeAmount ? parseFloat(String(r.factoringFeeAmount)) : 0,
          status: r.status, submittedAt: r.submittedAt?.toISOString() || '',
          fundedAt: r.fundedAt?.toISOString() || null,
          collectedAt: r.collectedAt?.toISOString() || null,
        }));
      } catch (e) { return []; }
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
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const userId = Number(ctx.user?.id) || 0;
      const advanceRate = input.quickPay ? 97 : 95;
      const feeRate = input.quickPay ? 3 : 2.5;
      const feeAmount = input.invoiceAmount * (feeRate / 100);
      const advanceAmount = input.invoiceAmount * (advanceRate / 100);
      const reserveAmount = input.invoiceAmount - advanceAmount - feeAmount;
      const invoiceNumber = `FI-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const result = await db.insert(factoringInvoices).values({
        loadId: parseInt(input.loadId, 10),
        catalystUserId: userId,
        shipperUserId: parseInt(input.customerId, 10) || null,
        invoiceNumber,
        invoiceAmount: String(input.invoiceAmount),
        advanceRate: String(advanceRate),
        factoringFeePercent: String(feeRate),
        factoringFeeAmount: String(feeAmount.toFixed(2)),
        advanceAmount: String(advanceAmount.toFixed(2)),
        reserveAmount: String(reserveAmount.toFixed(2)),
        status: 'submitted',
        supportingDocs: input.documents.map(d => ({ type: d.type, url: '', name: d.documentId })),
      } as any).$returningId();
      return {
        factoringId: String(result[0]?.id), invoiceNumber,
        invoiceAmount: input.invoiceAmount, advanceAmount, estimatedFee: feeAmount,
        status: 'submitted', estimatedFundingTime: input.quickPay ? '4 hours' : '24 hours',
        submittedBy: userId, submittedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get invoice status
   */
  getInvoiceStatus: protectedProcedure
    .input(z.object({ factoringId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return null;
      try {
        const id = parseInt(input.factoringId, 10);
        const [inv] = await db.select().from(factoringInvoices).where(eq(factoringInvoices.id, id)).limit(1);
        if (!inv) return null;
        const timeline = [
          { event: 'Submitted', date: inv.submittedAt?.toISOString() || '', status: 'completed' },
          ...(inv.approvedAt ? [{ event: 'Approved', date: inv.approvedAt.toISOString(), status: 'completed' as const }] : []),
          ...(inv.fundedAt ? [{ event: 'Funded', date: inv.fundedAt.toISOString(), status: 'completed' as const }] : []),
          ...(inv.collectedAt ? [{ event: 'Collected', date: inv.collectedAt.toISOString(), status: 'completed' as const }] : []),
        ];
        return {
          factoringId: String(inv.id), invoiceNumber: inv.invoiceNumber, status: inv.status,
          invoiceAmount: inv.invoiceAmount ? parseFloat(String(inv.invoiceAmount)) : 0,
          advanceAmount: inv.advanceAmount ? parseFloat(String(inv.advanceAmount)) : 0,
          timeline, payment: inv.fundedAt ? { amount: inv.advanceAmount ? parseFloat(String(inv.advanceAmount)) : 0, date: inv.fundedAt.toISOString() } : null,
        };
      } catch (e) { return null; }
    }),

  /**
   * Get approved customers
   */
  getApprovedCustomers: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const userId = Number(ctx.user?.id) || 0;
        const rows = await db.select({ shipperUserId: factoringInvoices.shipperUserId }).from(factoringInvoices).where(and(eq(factoringInvoices.catalystUserId, userId), sql`${factoringInvoices.shipperUserId} IS NOT NULL`)).groupBy(factoringInvoices.shipperUserId).limit(50);
        if (rows.length === 0) return [];
        const customerIds = rows.map(r => r.shipperUserId!).filter(Boolean);
        const customers: any[] = [];
        for (const cid of customerIds) {
          const [u] = await db.select({ id: users.id, name: users.name, email: users.email, companyId: users.companyId }).from(users).where(eq(users.id, cid)).limit(1);
          if (u) customers.push({ id: String(u.id), name: u.name || '', email: u.email || '' });
        }
        return customers;
      } catch (e) { return []; }
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
      const db = await getDb(); if (!db) return { currentBalance: 0, pendingRelease: 0, history: [] };
      try {
        const userId = Number(ctx.user?.id) || 0;
        const [stats] = await db.select({
          currentBalance: sql<number>`COALESCE(SUM(CAST(${factoringInvoices.reserveAmount} AS DECIMAL)), 0)`,
          pendingRelease: sql<number>`COALESCE(SUM(CASE WHEN ${factoringInvoices.status} = 'collected' THEN CAST(${factoringInvoices.reserveAmount} AS DECIMAL) ELSE 0 END), 0)`,
        }).from(factoringInvoices).where(eq(factoringInvoices.catalystUserId, userId));
        return { currentBalance: Math.round((stats?.currentBalance || 0) * 100) / 100, pendingRelease: Math.round((stats?.pendingRelease || 0) * 100) / 100, history: [] };
      } catch (e) { return { currentBalance: 0, pendingRelease: 0, history: [] }; }
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
    .input(z.object({ period: z.enum(["month", "quarter", "year"]).default("month") }))
    .query(async ({ input }) => ({
      period: input.period,
      summary: { totalFactored: 0, totalFees: 0, effectiveRate: 0, avgDaysToPayment: 0, invoicesFactored: 0 },
      byCustomer: [], savingsVsTraditional: { traditionalWaitDays: 0, actualWaitDays: 0, cashFlowImprovement: 0 },
    })),

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

  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) return { totalFactored: 0, pendingPayments: 0, availableCredit: 0, totalFunded: 0, pending: 0, invoicesFactored: 0 };
    try {
      const userId = Number(ctx.user?.id) || 0;
      const [s] = await db.select({
        total: sql<number>`COUNT(*)`,
        totalFactored: sql<number>`COALESCE(SUM(CAST(${factoringInvoices.invoiceAmount} AS DECIMAL)), 0)`,
        totalFunded: sql<number>`COALESCE(SUM(CAST(${factoringInvoices.advanceAmount} AS DECIMAL)), 0)`,
        pending: sql<number>`SUM(CASE WHEN ${factoringInvoices.status} IN ('submitted','under_review','approved') THEN 1 ELSE 0 END)`,
      }).from(factoringInvoices).where(eq(factoringInvoices.catalystUserId, userId));
      return { totalFactored: Math.round(s?.totalFactored || 0), pendingPayments: s?.pending || 0, availableCredit: 100000, totalFunded: Math.round(s?.totalFunded || 0), pending: s?.pending || 0, invoicesFactored: s?.total || 0 };
    } catch (e) { return { totalFactored: 0, pendingPayments: 0, availableCredit: 0, totalFunded: 0, pending: 0, invoicesFactored: 0 }; }
  }),
  getRates: protectedProcedure.query(async () => ({ standard: 0.025, quickPay: 0.035, sameDay: 0.045, currentRate: 0.025, advanceRate: 0.95 })),

  // ============================================================================
  // DEBTORS & CREDIT CHECK (B-042)
  // ============================================================================

  /**
   * Get debtors list for factoring user
   */
  getDebtors: protectedProcedure
    .input(z.object({ search: z.string().optional(), limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      const { debtors } = await import("../../drizzle/schema");
      const db = await getDb();
      if (!db) return [];
      try {
        const userId = Number(ctx.user?.id) || 0;
        const conds: any[] = [eq(debtors.factoringUserId, userId), eq(debtors.isActive, true)];
        if (input.search) {
          conds.push(sql`${debtors.name} LIKE ${'%' + input.search + '%'}`);
        }

        const rows = await db.select().from(debtors)
          .where(and(...conds))
          .orderBy(desc(sql`CAST(${debtors.outstanding} AS DECIMAL)`))
          .limit(input.limit);

        return rows.map(d => ({
          id: String(d.id),
          name: d.name,
          type: d.type,
          mcNumber: d.mcNumber,
          dotNumber: d.dotNumber,
          creditScore: d.creditScore || 0,
          creditRating: d.creditRating || "N/A",
          totalFactored: d.totalFactored ? parseFloat(String(d.totalFactored)) : 0,
          outstanding: d.outstanding ? parseFloat(String(d.outstanding)) : 0,
          avgDaysToPay: d.avgDaysToPay || 0,
          invoiceCount: d.invoiceCount || 0,
          lastPayment: d.lastPaymentAt ? getRelativeTime(d.lastPaymentAt) : "N/A",
          riskLevel: d.riskLevel,
          trend: d.trend || "stable",
        }));
      } catch (e) {
        console.error("[Factoring] getDebtors error:", e);
        return [];
      }
    }),

  /**
   * Get debtor totals/stats
   */
  getDebtorStats: protectedProcedure
    .query(async ({ ctx }) => {
      const { debtors } = await import("../../drizzle/schema");
      const db = await getDb();
      if (!db) return { outstanding: 0, factored: 0, avgDays: 0, highRisk: 0, totalDebtors: 0 };
      try {
        const userId = Number(ctx.user?.id) || 0;
        const [stats] = await db.select({
          total: sql<number>`COUNT(*)`,
          outstanding: sql<number>`COALESCE(SUM(CAST(${debtors.outstanding} AS DECIMAL)), 0)`,
          factored: sql<number>`COALESCE(SUM(CAST(${debtors.totalFactored} AS DECIMAL)), 0)`,
          avgDays: sql<number>`ROUND(AVG(${debtors.avgDaysToPay}), 0)`,
          highRisk: sql<number>`SUM(CASE WHEN ${debtors.riskLevel} = 'high' THEN 1 ELSE 0 END)`,
        }).from(debtors)
          .where(and(eq(debtors.factoringUserId, userId), eq(debtors.isActive, true)));

        return {
          outstanding: Math.round(stats?.outstanding || 0),
          factored: Math.round(stats?.factored || 0),
          avgDays: stats?.avgDays || 0,
          highRisk: stats?.highRisk || 0,
          totalDebtors: stats?.total || 0,
        };
      } catch (e) {
        console.error("[Factoring] getDebtorStats error:", e);
        return { outstanding: 0, factored: 0, avgDays: 0, highRisk: 0, totalDebtors: 0 };
      }
    }),

  /**
   * Run credit check on a shipper/broker entity
   */
  runCreditCheck: protectedProcedure
    .input(z.object({
      entityName: z.string().min(1),
      mcNumber: z.string().optional(),
      dotNumber: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { creditChecks } = await import("../../drizzle/schema");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const userId = Number(ctx.user?.id) || 0;

      // Simulate credit bureau lookup (in production, integrate with Ansonia, TranzAct, etc.)
      const score = Math.floor(Math.random() * 40) + 55;
      const rating = score >= 85 ? "A" : score >= 75 ? "B+" : score >= 65 ? "B" : "C";
      const avgDays = Math.floor(Math.random() * 30) + 15;
      const years = Math.floor(Math.random() * 15) + 2;
      const records = Math.floor(Math.random() * 3);
      const recommendation = score >= 70 ? "approve" : score >= 55 ? "review" : "decline";

      await db.insert(creditChecks).values({
        requestedBy: userId,
        entityName: input.entityName,
        entityType: "shipper",
        mcNumber: input.mcNumber || null,
        dotNumber: input.dotNumber || null,
        creditScore: score,
        creditRating: rating,
        avgDaysToPay: avgDays,
        yearsInBusiness: years,
        publicRecords: records,
        recommendation: recommendation as any,
        resultData: JSON.stringify({ source: "eusotrip_credit_engine", checkedAt: new Date().toISOString() }),
      });

      return {
        name: input.entityName,
        score,
        rating,
        avgDaysToPay: avgDays,
        yearsInBusiness: years,
        publicRecords: records,
        recommendation,
      };
    }),

  /**
   * Get credit check history
   */
  getCreditCheckHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const { creditChecks } = await import("../../drizzle/schema");
      const db = await getDb();
      if (!db) return [];
      try {
        const userId = Number(ctx.user?.id) || 0;
        const rows = await db.select().from(creditChecks)
          .where(eq(creditChecks.requestedBy, userId))
          .orderBy(desc(creditChecks.createdAt))
          .limit(input.limit);

        return rows.map(r => ({
          id: String(r.id),
          entityName: r.entityName,
          entityType: r.entityType,
          creditScore: r.creditScore,
          creditRating: r.creditRating,
          avgDaysToPay: r.avgDaysToPay,
          yearsInBusiness: r.yearsInBusiness,
          publicRecords: r.publicRecords,
          recommendation: r.recommendation,
          checkedAt: r.createdAt?.toISOString() || '',
        }));
      } catch (e) {
        console.error("[Factoring] getCreditCheckHistory error:", e);
        return [];
      }
    }),
});

function getRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}
