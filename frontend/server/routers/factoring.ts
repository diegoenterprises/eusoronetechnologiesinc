/**
 * FACTORING ROUTER
 * tRPC procedures for freight factoring and quick pay services
 */

import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { adminProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { factoringInvoices, loads, users, companies, hzCarrierSafety, settlements, platformFeeConfigs, userFeeOverrides } from "../../drizzle/schema";
import { like } from "drizzle-orm";
import { unsafeCast } from "../_core/types/unsafe";

/**
 * Query a factoring-related rate from platformFeeConfigs, with optional user override.
 * Falls back to provided default if no row exists.
 */
async function getFactoringConfig(
  db: any,
  feeCode: string,
  defaults: { baseRate: number; flatAmount?: number },
  userId?: number
): Promise<{ baseRate: number; flatAmount: number }> {
  try {
    const now = new Date();
    const [cfg] = await db.select({
      baseRate: platformFeeConfigs.baseRate,
      flatAmount: platformFeeConfigs.flatAmount,
    }).from(platformFeeConfigs)
      .where(and(
        eq(platformFeeConfigs.feeCode, feeCode),
        eq(platformFeeConfigs.isActive, true),
        sql`${platformFeeConfigs.effectiveFrom} <= ${now}`,
        sql`(${platformFeeConfigs.effectiveTo} IS NULL OR ${platformFeeConfigs.effectiveTo} > ${now})`,
      ))
      .limit(1);

    let rate = cfg ? parseFloat(String(cfg.baseRate)) || defaults.baseRate : defaults.baseRate;
    const flat = cfg ? parseFloat(String(cfg.flatAmount)) || (defaults.flatAmount ?? 0) : (defaults.flatAmount ?? 0);

    // Check for user-level override
    if (userId && cfg) {
      try {
        const [cfgRow] = await db.select({ id: platformFeeConfigs.id })
          .from(platformFeeConfigs)
          .where(eq(platformFeeConfigs.feeCode, feeCode))
          .limit(1);
        if (cfgRow) {
          const [override] = await db.select({
            overrideType: userFeeOverrides.overrideType,
            overrideValue: userFeeOverrides.overrideValue,
          }).from(userFeeOverrides)
            .where(and(
              eq(userFeeOverrides.userId, userId),
              eq(userFeeOverrides.feeConfigId, cfgRow.id),
              eq(userFeeOverrides.isActive, true),
              sql`${userFeeOverrides.effectiveFrom} <= ${now}`,
              sql`(${userFeeOverrides.effectiveTo} IS NULL OR ${userFeeOverrides.effectiveTo} > ${now})`,
            ))
            .limit(1);
          if (override) {
            const ov = parseFloat(String(override.overrideValue)) || 0;
            if (override.overrideType === 'flat_override') rate = ov;
            else if (override.overrideType === 'rate_adjustment') rate += ov;
            else if (override.overrideType === 'percentage_off') rate *= (1 - ov / 100);
            else if (override.overrideType === 'waived') rate = 0;
          }
        }
      } catch { /* no override table — skip */ }
    }

    return { baseRate: rate, flatAmount: flat };
  } catch {
    return { baseRate: defaults.baseRate, flatAmount: defaults.flatAmount ?? 0 };
  }
}

/**
 * Query credit limit from platformFeeConfigs (stored as flatAmount on FACTORING_CREDIT_LIMIT config).
 */
async function getCreditLimit(db: any, userId?: number): Promise<number> {
  const DEFAULT_CREDIT_LIMIT = 100000;
  try {
    const now = new Date();
    const [cfg] = await db.select({ flatAmount: platformFeeConfigs.flatAmount })
      .from(platformFeeConfigs)
      .where(and(
        eq(platformFeeConfigs.feeCode, 'FACTORING_CREDIT_LIMIT'),
        eq(platformFeeConfigs.isActive, true),
        sql`${platformFeeConfigs.effectiveFrom} <= ${now}`,
        sql`(${platformFeeConfigs.effectiveTo} IS NULL OR ${platformFeeConfigs.effectiveTo} > ${now})`,
      ))
      .limit(1);
    let limit = cfg ? parseFloat(String(cfg.flatAmount)) || DEFAULT_CREDIT_LIMIT : DEFAULT_CREDIT_LIMIT;

    // Check user override
    if (userId && cfg) {
      try {
        const [cfgFull] = await db.select({ id: platformFeeConfigs.id })
          .from(platformFeeConfigs)
          .where(eq(platformFeeConfigs.feeCode, 'FACTORING_CREDIT_LIMIT'))
          .limit(1);
        if (cfgFull) {
          const [override] = await db.select({
            overrideType: userFeeOverrides.overrideType,
            overrideValue: userFeeOverrides.overrideValue,
          }).from(userFeeOverrides)
            .where(and(
              eq(userFeeOverrides.userId, userId),
              eq(userFeeOverrides.feeConfigId, cfgFull.id),
              eq(userFeeOverrides.isActive, true),
            ))
            .limit(1);
          if (override) {
            const ov = parseFloat(String(override.overrideValue)) || 0;
            if (override.overrideType === 'flat_override') limit = ov;
            else if (override.overrideType === 'rate_adjustment') limit += ov;
          }
        }
      } catch { /* skip */ }
    }
    return limit;
  } catch {
    return DEFAULT_CREDIT_LIMIT;
  }
}

/**
 * Platform-internal credit scoring algorithm.
 * Computes a 300-850 score based on:
 *   - FMCSA carrier safety data (if DOT/MC available)
 *   - Platform payment history (loads delivered, factoring invoices paid)
 *   - Company registration age
 *   - Debtor payment behavior
 * Returns score, rating (AAA-D), avgDaysToPay, yearsInBusiness, recommendation.
 */
async function computeCreditScore(db: any, entityName: string, mcNumber?: string | null, dotNumber?: string | null): Promise<{
  creditScore: number;
  creditRating: string;
  avgDaysToPay: number | null;
  yearsInBusiness: number | null;
  publicRecords: number;
  recommendation: "approve" | "review" | "decline";
  resultData: Record<string, any>;
}> {
  let score = 550; // baseline
  const factors: Record<string, any> = { source: "platform_internal", checkedAt: new Date().toISOString(), breakdown: {} };

  // ── 1. FMCSA Safety Data (up to ±120 points) ──
  let fmcsaData: any = null;
  if (dotNumber) {
    const [row] = await db.select().from(hzCarrierSafety).where(eq(hzCarrierSafety.dotNumber, dotNumber)).limit(1);
    fmcsaData = row || null;
  }
  if (!fmcsaData && mcNumber) {
    // hzCarrierSafety has no mcNumber column; look up DOT via companies table
    const [comp] = await db.select({ dotNumber: companies.dotNumber }).from(companies).where(like(companies.mcNumber, `%${mcNumber.replace(/\D/g, '')}%`)).limit(1);
    if (comp?.dotNumber) {
      const [row] = await db.select().from(hzCarrierSafety).where(eq(hzCarrierSafety.dotNumber, comp.dotNumber)).limit(1);
      fmcsaData = row || null;
    }
  }
  if (fmcsaData) {
    const rating = (fmcsaData.safetyRating || '').toLowerCase();
    if (rating === 'satisfactory') score += 60;
    else if (rating === 'conditional') score += 20;
    else if (rating === 'unsatisfactory') score -= 80;
    else score += 30; // rated but unknown category

    // BASICs — penalize high scores
    const basics = [
      fmcsaData.unsafeDrivingScore, fmcsaData.hosComplianceScore, fmcsaData.driverFitnessScore,
      fmcsaData.controlledSubstancesScore, fmcsaData.vehicleMaintenanceScore,
      fmcsaData.hazmatComplianceScore, fmcsaData.crashIndicatorScore,
    ].filter(Boolean).map(Number);
    if (basics.length > 0) {
      const maxBasic = Math.max(...basics);
      const avgBasic = basics.reduce((a, b) => a + b, 0) / basics.length;
      if (maxBasic >= 80) score -= 60;
      else if (maxBasic >= 60) score -= 30;
      else if (avgBasic < 30) score += 40;
      else score += 10;
    }
    factors.breakdown.fmcsa = { found: true, safetyRating: fmcsaData.safetyRating, basicsCount: basics.length };
  } else {
    // No FMCSA data — slight penalty for unknown
    score -= 20;
    factors.breakdown.fmcsa = { found: false };
  }

  // ── 2. Platform Payment History (up to ±80 points) ──
  let avgDaysToPay: number | null = null;
  try {
    // Check if entity appears as shipper in completed loads
    const [loadStats] = await db.execute(
      sql`SELECT COUNT(*) as total,
            SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
            MIN(createdAt) as firstLoad
          FROM loads WHERE shipperName LIKE ${`%${entityName}%`} OR pickupCompany LIKE ${`%${entityName}%`}`
    );
    const ls = Array.isArray(loadStats) ? unsafeCast(loadStats)[0] : loadStats;
    const totalLoads = Number(ls?.total || 0);
    const deliveredLoads = Number(ls?.delivered || 0);
    if (totalLoads > 0) {
      const completionRate = deliveredLoads / totalLoads;
      if (completionRate >= 0.95) score += 40;
      else if (completionRate >= 0.8) score += 20;
      else if (completionRate < 0.5) score -= 30;
      factors.breakdown.platformLoads = { total: totalLoads, delivered: deliveredLoads, completionRate: Math.round(completionRate * 100) };
    }

    // Check factoring invoice payment speed
    const [payStats] = await db.execute(
      sql`SELECT COUNT(*) as total,
            AVG(DATEDIFF(COALESCE(collectedAt, fundedAt, NOW()), submittedAt)) as avgDays,
            SUM(CASE WHEN status IN ('collected', 'closed') THEN 1 ELSE 0 END) as paid,
            SUM(CASE WHEN status IN ('chargedback', 'disputed', 'short_paid') THEN 1 ELSE 0 END) as problems
          FROM factoring_invoices WHERE shipperName LIKE ${`%${entityName}%`}`
    );
    const ps = Array.isArray(payStats) ? unsafeCast(payStats)[0] : payStats;
    const invoiceTotal = Number(ps?.total || 0);
    if (invoiceTotal > 0) {
      avgDaysToPay = Math.round(Number(ps?.avgDays || 30));
      const problems = Number(ps?.problems || 0);
      if (avgDaysToPay <= 15) score += 40;
      else if (avgDaysToPay <= 30) score += 20;
      else if (avgDaysToPay <= 45) score += 0;
      else if (avgDaysToPay <= 60) score -= 20;
      else score -= 40;
      if (problems > 0) score -= Math.min(problems * 15, 60);
      factors.breakdown.paymentHistory = { invoices: invoiceTotal, avgDaysToPay, problems };
    }
  } catch { /* tables may not have matching columns — graceful skip */ }

  // ── 3. Company Age (up to +50 points) ──
  let yearsInBusiness: number | null = null;
  try {
    const [comp] = await db.select({ createdAt: companies.createdAt }).from(companies)
      .where(like(companies.name, `%${entityName}%`)).limit(1);
    if (comp?.createdAt) {
      yearsInBusiness = Math.max(0, Math.round((Date.now() - comp.createdAt.getTime()) / (365.25 * 86400000)));
      if (yearsInBusiness >= 5) score += 50;
      else if (yearsInBusiness >= 3) score += 35;
      else if (yearsInBusiness >= 1) score += 15;
      else score -= 10;
      factors.breakdown.companyAge = { yearsInBusiness };
    }
  } catch {}

  // ── Clamp score to 300-850 ──
  score = Math.max(300, Math.min(850, score));

  // ── Derive rating and recommendation ──
  let creditRating: string;
  let recommendation: "approve" | "review" | "decline";
  if (score >= 750) { creditRating = "AAA"; recommendation = "approve"; }
  else if (score >= 700) { creditRating = "AA"; recommendation = "approve"; }
  else if (score >= 650) { creditRating = "A"; recommendation = "approve"; }
  else if (score >= 600) { creditRating = "BBB"; recommendation = "review"; }
  else if (score >= 550) { creditRating = "BB"; recommendation = "review"; }
  else if (score >= 500) { creditRating = "B"; recommendation = "review"; }
  else if (score >= 400) { creditRating = "C"; recommendation = "decline"; }
  else { creditRating = "D"; recommendation = "decline"; }

  return { creditScore: score, creditRating, avgDaysToPay, yearsInBusiness, publicRecords: 0, recommendation, resultData: factors };
}

const invoiceStatusSchema = z.enum([
  "submitted", "under_review", "approved", "funded", "collection",
  "collected", "short_paid", "disputed", "chargedback", "closed"
]);

export const factoringRouter = router({
  create: protectedProcedure
    .input(z.object({
      loadId: z.number().optional(),
      railShipmentId: z.number().optional(),
      vesselShipmentId: z.number().optional(),
      invoiceAmount: z.number(),
      advanceRate: z.number().optional(),
      factoringFeePercent: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      if (!input.loadId && !input.railShipmentId && !input.vesselShipmentId) throw new Error("A shipment ID is required");
      const userId = Number(ctx.user?.id) || 0;
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
      const advRate = input.advanceRate || 97;
      const feePercent = input.factoringFeePercent || 3;

      // Use net-after-platform-fee amount from settlement if available (supports all modes)
      let netInvoiceAmount = Number(input.invoiceAmount);
      try {
        const settlementCondition = input.loadId
          ? eq(settlements.loadId, input.loadId)
          : input.railShipmentId
            ? eq(settlements.railShipmentId, input.railShipmentId)
            : eq(settlements.vesselShipmentId, input.vesselShipmentId!);
        const [settlement] = await db.select().from(settlements).where(settlementCondition).limit(1);
        if (settlement) {
          netInvoiceAmount = Number(settlement.totalShipperCharge || input.invoiceAmount) - Number(settlement.platformFeeAmount || 0);
        }
      } catch {}

      const feeAmount = Math.round(netInvoiceAmount * (feePercent / 100) * 100) / 100;
      const advanceAmount = Math.round(netInvoiceAmount * (advRate / 100) * 100) / 100;
      const reserveAmount = Math.round((netInvoiceAmount - advanceAmount - feeAmount) * 100) / 100;
      const shipmentId = input.loadId || input.railShipmentId || input.vesselShipmentId || 0;
      const [result] = await db.insert(factoringInvoices).values({
        loadId: shipmentId,
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

      // Record factoring fee in platform revenue when invoice is funded
      if (input.status === "funded") {
        try {
          const [invoice] = await db.select().from(factoringInvoices).where(eq(factoringInvoices.id, input.id)).limit(1);
          if (invoice) {
            const { platformRevenue } = await import("../../drizzle/schema");
            const invoiceAmount = Number(invoice.invoiceAmount || 0);
            const feeAmt = Number(invoice.factoringFeeAmount || 0);
            await db.insert(platformRevenue).values({
              transactionType: 'factoring_advance',
              transactionId: invoice.id,
              userId: invoice.catalystUserId,
              grossAmount: String(invoiceAmount),
              feeAmount: String(feeAmt),
              netAmount: String(invoiceAmount - feeAmt),
              description: `Factoring fee — Invoice #${invoice.invoiceNumber}`,
            });
            logger.info(`[Factoring] Platform revenue recorded: $${feeAmt.toFixed(2)} for invoice ${invoice.invoiceNumber}`);
          }
        } catch (err) {
          logger.error('[Factoring] Failed to record platform revenue:', err);
        }
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

        // Query rates and credit limit from platformFeeConfigs
        const stdCfg = await getFactoringConfig(db, 'FACTORING_STANDARD', { baseRate: 0.025 }, userId);
        const creditLimit = await getCreditLimit(db, userId);
        const advanceRate = 1 - stdCfg.baseRate; // advance = 1 - fee rate

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
          account: { status: hasActivity ? 'active' : 'inactive', creditLimit, availableCredit: creditLimit - Math.round(stats?.totalFactored || 0), usedCredit: Math.round(stats?.totalFactored || 0), reserveBalance: Math.round(stats?.totalReserve || 0), factoringRate: stdCfg.baseRate, advanceRate },
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
        if (input.status) conds.push(eq(factoringInvoices.status, unsafeCast(input.status)));
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
      // Query rates from platformFeeConfigs
      const stdCfg = await getFactoringConfig(db, 'FACTORING_STANDARD', { baseRate: 0.025 }, userId);
      const qpCfg = await getFactoringConfig(db, 'FACTORING_QUICKPAY', { baseRate: 0.03 }, userId);
      const feeRate = input.quickPay ? (qpCfg.baseRate * 100) : (stdCfg.baseRate * 100);
      const advanceRate = input.quickPay ? (100 - qpCfg.baseRate * 100) : (100 - stdCfg.baseRate * 100);
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
      } as never).$returningId();
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
      const { creditChecks } = await import("../../drizzle/schema");
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const userId = Number(ctx.user?.id) || 0;
      // Compute credit score using platform data
      const scored = await computeCreditScore(db, input.customerName, input.mcNumber, null);
      scored.resultData.address = input.customerAddress;
      scored.resultData.taxId = input.taxId;
      scored.resultData.requestedLimit = input.requestedLimit;

      const [result] = await db.insert(creditChecks).values({
        requestedBy: userId,
        entityName: input.customerName,
        entityType: "shipper",
        mcNumber: input.mcNumber || null,
        dotNumber: null,
        creditScore: scored.creditScore,
        creditRating: scored.creditRating,
        avgDaysToPay: scored.avgDaysToPay,
        yearsInBusiness: scored.yearsInBusiness,
        publicRecords: scored.publicRecords,
        recommendation: unsafeCast(scored.recommendation),
        resultData: JSON.stringify(scored.resultData),
      }).$returningId();
      return {
        requestId: `credit_${result.id}`,
        customerName: input.customerName,
        status: "completed",
        score: scored.creditScore,
        rating: scored.creditRating,
        recommendation: scored.recommendation,
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
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const userId = Number(ctx.user?.id) || 0;
      // Verify reserve balance is sufficient
      const [stats] = await db.select({
        currentReserve: sql<number>`COALESCE(SUM(CAST(${factoringInvoices.reserveAmount} AS DECIMAL)), 0)`,
      }).from(factoringInvoices).where(eq(factoringInvoices.catalystUserId, userId));
      const reserve = Math.round((stats?.currentReserve || 0) * 100) / 100;
      if (input.amount > reserve) throw new Error(`Insufficient reserve balance. Available: $${reserve.toFixed(2)}`);
      // Record withdrawal as a pending factoring invoice note
      const invoiceNumber = `RW-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const [result] = await db.insert(factoringInvoices).values({
        loadId: 0,
        catalystUserId: userId,
        invoiceNumber,
        invoiceAmount: String(0),
        reserveAmount: String(-input.amount),
        advanceAmount: String(input.amount),
        factoringFeeAmount: String(0),
        status: "submitted",
        notes: `Reserve withdrawal request: ${input.reason || "No reason provided"}`,
        dueDate: new Date(Date.now() + 7 * 86400000),
      }).$returningId();
      return {
        requestId: `withdraw_${result.id}`,
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
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { period: input.period, summary: { totalFactored: 0, totalFees: 0, effectiveRate: 0, avgDaysToPayment: 0, invoicesFactored: 0 }, byCustomer: [], savingsVsTraditional: { traditionalWaitDays: 0, actualWaitDays: 0, cashFlowImprovement: 0 } };
      try {
        const userId = Number(ctx.user?.id) || 0;
        const now = new Date();
        let startDate = new Date();
        if (input.period === "month") startDate.setMonth(now.getMonth() - 1);
        else if (input.period === "quarter") startDate.setMonth(now.getMonth() - 3);
        else startDate.setFullYear(now.getFullYear() - 1);
        const rows = await db.select().from(factoringInvoices).where(and(eq(factoringInvoices.catalystUserId, userId), sql`${factoringInvoices.submittedAt} >= ${startDate}`));
        const totalFactored = rows.reduce((s, r) => s + (parseFloat(String(r.invoiceAmount)) || 0), 0);
        const totalFees = rows.reduce((s, r) => s + (parseFloat(String(r.factoringFeeAmount)) || 0), 0);
        const funded = rows.filter(r => r.fundedAt && r.submittedAt);
        const avgDays = funded.length > 0 ? Math.round(funded.reduce((s, r) => s + ((r.fundedAt!.getTime() - r.submittedAt!.getTime()) / 86400000), 0) / funded.length) : 0;
        const effectiveRate = totalFactored > 0 ? Math.round((totalFees / totalFactored) * 10000) / 100 : 0;
        // Group by customer
        const customerMap = new Map<number, { name: string; total: number; count: number }>();
        for (const r of rows) {
          if (r.shipperUserId) {
            const existing = customerMap.get(r.shipperUserId);
            if (existing) { existing.total += parseFloat(String(r.invoiceAmount)) || 0; existing.count++; }
            else customerMap.set(r.shipperUserId, { name: `Customer #${r.shipperUserId}`, total: parseFloat(String(r.invoiceAmount)) || 0, count: 1 });
          }
        }
        const byCustomer = Array.from(customerMap.entries()).map(([id, data]) => ({ customerId: String(id), name: data.name, totalFactored: Math.round(data.total), invoiceCount: data.count }));
        return {
          period: input.period,
          summary: { totalFactored: Math.round(totalFactored), totalFees: Math.round(totalFees), effectiveRate, avgDaysToPayment: avgDays, invoicesFactored: rows.length },
          byCustomer,
          savingsVsTraditional: { traditionalWaitDays: 45, actualWaitDays: avgDays || 1, cashFlowImprovement: Math.round(totalFactored * ((45 - (avgDays || 1)) / 365) * 0.05) },
        };
      } catch (e) { return { period: input.period, summary: { totalFactored: 0, totalFees: 0, effectiveRate: 0, avgDaysToPayment: 0, invoicesFactored: 0 }, byCustomer: [], savingsVsTraditional: { traditionalWaitDays: 0, actualWaitDays: 0, cashFlowImprovement: 0 } }; }
    }),

  /**
   * Get fee schedule
   */
  getFeeSchedule: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      const userId = Number(ctx.user?.id) || 0;

      // Defaults used when DB is unavailable or no config rows exist
      let stdRate = 0.025, qpRate = 0.03, sdRate = 0.045, nrRate = 0.005;
      let nrCoverage = 50000, invoiceMin = 500, monthlyMin = 2500, addlDaysFee = 0.0005;

      if (db) {
        try {
          const stdCfg = await getFactoringConfig(db, 'FACTORING_STANDARD', { baseRate: stdRate }, userId);
          const qpCfg = await getFactoringConfig(db, 'FACTORING_QUICKPAY', { baseRate: qpRate }, userId);
          const sdCfg = await getFactoringConfig(db, 'FACTORING_SAMEDAY', { baseRate: sdRate }, userId);
          const nrCfg = await getFactoringConfig(db, 'FACTORING_NONRECOURSE', { baseRate: nrRate, flatAmount: nrCoverage }, userId);
          stdRate = stdCfg.baseRate;
          qpRate = qpCfg.baseRate;
          sdRate = sdCfg.baseRate;
          nrRate = nrCfg.baseRate;
          nrCoverage = nrCfg.flatAmount || nrCoverage;

          // Query minimums from config
          const minCfg = await getFactoringConfig(db, 'FACTORING_MINIMUMS', { baseRate: addlDaysFee, flatAmount: invoiceMin }, userId);
          addlDaysFee = minCfg.baseRate;
          invoiceMin = minCfg.flatAmount || invoiceMin;
        } catch { /* use defaults */ }
      }

      return {
        standardFactoring: {
          advanceRate: 1 - stdRate,
          feeRate: stdRate,
          additionalDaysFee: addlDaysFee,
          processingTime: "24 hours",
        },
        quickPay: {
          advanceRate: 1 - qpRate,
          feeRate: qpRate,
          processingTime: "4 hours",
        },
        nonRecourse: {
          available: true,
          additionalFee: nrRate,
          coverageLimit: nrCoverage,
        },
        minimums: {
          invoiceMinimum: invoiceMin,
          monthlyMinimum: monthlyMin,
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
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const id = parseInt(input.factoringId, 10);
      if (!id) throw new Error("Invalid factoring ID");
      const [inv] = await db.select({ id: factoringInvoices.id, supportingDocs: factoringInvoices.supportingDocs }).from(factoringInvoices).where(eq(factoringInvoices.id, id)).limit(1);
      if (!inv) throw new Error("Factoring invoice not found");
      const docs = (Array.isArray(inv.supportingDocs) ? inv.supportingDocs : []) as Array<{ type: string; url: string; name: string }>;
      const docId = `doc_${Date.now()}`;
      docs.push({ type: input.documentType, url: `/api/factoring/${input.factoringId}/documents/${docId}`, name: input.fileName });
      await db.update(factoringInvoices).set({ supportingDocs: docs } as never).where(eq(factoringInvoices.id, id));
      return {
        documentId: docId,
        uploadUrl: `/api/factoring/${input.factoringId}/documents/${docId}`,
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
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const id = parseInt(input.factoringId, 10);
      if (!id) throw new Error("Invalid factoring ID");
      const [inv] = await db.select().from(factoringInvoices).where(eq(factoringInvoices.id, id)).limit(1);
      if (!inv) throw new Error("Factoring invoice not found");
      await db.update(factoringInvoices).set({
        status: unsafeCast("disputed"),
        notes: sql`CONCAT(COALESCE(${factoringInvoices.notes}, ''), '\n[DISPUTE] ', ${input.reason})`,
      }).where(eq(factoringInvoices.id, id));
      return {
        disputeId: `disp_${id}`,
        factoringId: input.factoringId,
        status: "opened",
        openedBy: ctx.user?.id,
        openedAt: new Date().toISOString(),
      };
    }),

  // ============================================================================
  // QUICK PAY — Instant funding (4hr) with higher fee. Platform revenue stream.
  // Platform earns spread between advance rate and fee: ~1% of invoice value
  // ============================================================================
  quickPay: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      invoiceAmount: z.number().positive(),
      documents: z.array(z.object({
        type: z.enum(["invoice", "bol", "pod", "rate_con"]),
        documentId: z.string(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = Number(ctx.user?.id) || 0;
      if (!userId) throw new Error("Authentication required");

      // Query quick pay rates from platformFeeConfigs
      const qpCfg = await getFactoringConfig(db, 'FACTORING_QUICKPAY', { baseRate: 0.035 }, userId);
      const QUICK_PAY_FEE_RATE = qpCfg.baseRate * 100; // e.g. 3.5
      const QUICK_PAY_ADVANCE_RATE = 100 - QUICK_PAY_FEE_RATE; // e.g. 96.5
      const PLATFORM_SPREAD = 1.0; // Platform keeps 1% of invoice value

      const feeAmount = input.invoiceAmount * (QUICK_PAY_FEE_RATE / 100);
      const advanceAmount = input.invoiceAmount * (QUICK_PAY_ADVANCE_RATE / 100);
      const reserveAmount = input.invoiceAmount - advanceAmount - feeAmount;
      const platformRevShare = input.invoiceAmount * (PLATFORM_SPREAD / 100);
      const invoiceNumber = `QP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      const [result] = await db.insert(factoringInvoices).values({
        loadId: input.loadId,
        catalystUserId: userId,
        invoiceNumber,
        invoiceAmount: String(input.invoiceAmount),
        advanceRate: String(QUICK_PAY_ADVANCE_RATE),
        factoringFeePercent: String(QUICK_PAY_FEE_RATE),
        factoringFeeAmount: String(feeAmount.toFixed(2)),
        advanceAmount: String(advanceAmount.toFixed(2)),
        reserveAmount: String(reserveAmount.toFixed(2)),
        status: "approved",
        approvedAt: new Date(),
        notes: "[QUICK_PAY] Instant funding — 4hr target",
        dueDate: new Date(Date.now() + 30 * 86400000),
      }).$returningId();

      // Record platform revenue
      try {
        const { platformRevenue } = await import("../../drizzle/schema");
        await db.insert(platformRevenue).values({
          transactionId: result.id,
          transactionType: "quickpay_fee",
          userId,
          grossAmount: String(feeAmount.toFixed(2)),
          feeAmount: String(platformRevShare.toFixed(2)),
          netAmount: String((feeAmount - platformRevShare).toFixed(2)),
          platformShare: String(platformRevShare.toFixed(2)),
          processorShare: String((feeAmount - platformRevShare).toFixed(2)),
          discountApplied: "0.00",
          metadata: { type: "quick_pay", loadId: input.loadId, invoiceNumber },
        });
      } catch (e) {
        logger.error("[Factoring] QuickPay revenue recording error:", e);
      }

      return {
        factoringId: String(result.id),
        invoiceNumber,
        type: "quick_pay",
        invoiceAmount: input.invoiceAmount,
        advanceAmount,
        feeAmount,
        platformFee: platformRevShare,
        reserveAmount: Math.max(0, reserveAmount),
        status: "approved",
        estimatedFundingTime: "4 hours",
        fundingDeadline: new Date(Date.now() + 4 * 3600000).toISOString(),
      };
    }),

  // ============================================================================
  // FACTORING REVENUE DASHBOARD — Platform admin view of factoring revenue
  // ============================================================================
  getRevenueStats: protectedProcedure
    .input(z.object({ period: z.enum(["7d", "30d", "90d", "ytd"]).optional().default("30d") }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const empty = { totalVolume: 0, totalFees: 0, platformRevenue: 0, quickPayVolume: 0, standardVolume: 0, invoiceCount: 0, avgInvoiceSize: 0, avgFeeRate: 0 };
      if (!db) return empty;
      try {
        const days = (input?.period || "30d") === "7d" ? 7 : (input?.period || "30d") === "90d" ? 90 : (input?.period || "30d") === "ytd" ? 365 : 30;
        const since = new Date(Date.now() - days * 86400000);
        const rows = await db.select({
          invoiceAmount: factoringInvoices.invoiceAmount,
          factoringFeeAmount: factoringInvoices.factoringFeeAmount,
          notes: factoringInvoices.notes,
        }).from(factoringInvoices).where(sql`${factoringInvoices.submittedAt} >= ${since}`);

        let totalVolume = 0, totalFees = 0, quickPayVolume = 0;
        for (const r of rows) {
          const amt = r.invoiceAmount ? parseFloat(String(r.invoiceAmount)) : 0;
          const fee = r.factoringFeeAmount ? parseFloat(String(r.factoringFeeAmount)) : 0;
          totalVolume += amt;
          totalFees += fee;
          if (r.notes?.includes("[QUICK_PAY]")) quickPayVolume += amt;
        }
        const platformRevenue = totalVolume * 0.01; // 1% platform spread

        return {
          totalVolume: Math.round(totalVolume),
          totalFees: Math.round(totalFees * 100) / 100,
          platformRevenue: Math.round(platformRevenue * 100) / 100,
          quickPayVolume: Math.round(quickPayVolume),
          standardVolume: Math.round(totalVolume - quickPayVolume),
          invoiceCount: rows.length,
          avgInvoiceSize: rows.length > 0 ? Math.round(totalVolume / rows.length) : 0,
          avgFeeRate: totalVolume > 0 ? Math.round((totalFees / totalVolume) * 10000) / 100 : 0,
        };
      } catch (e) {
        logger.error("[Factoring] getRevenueStats error:", e);
        return empty;
      }
    }),

  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) return { totalFactored: 0, pendingPayments: 0, availableCredit: 0, totalFunded: 0, pending: 0, invoicesFactored: 0 };
    try {
      const userId = Number(ctx.user?.id) || 0;
      const creditLimit = await getCreditLimit(db, userId);
      const [s] = await db.select({
        total: sql<number>`COUNT(*)`,
        totalFactored: sql<number>`COALESCE(SUM(CAST(${factoringInvoices.invoiceAmount} AS DECIMAL)), 0)`,
        totalFunded: sql<number>`COALESCE(SUM(CAST(${factoringInvoices.advanceAmount} AS DECIMAL)), 0)`,
        pending: sql<number>`SUM(CASE WHEN ${factoringInvoices.status} IN ('submitted','under_review','approved') THEN 1 ELSE 0 END)`,
      }).from(factoringInvoices).where(eq(factoringInvoices.catalystUserId, userId));
      return { totalFactored: Math.round(s?.totalFactored || 0), pendingPayments: s?.pending || 0, availableCredit: Math.max(0, creditLimit - Math.round(s?.totalFactored || 0)), totalFunded: Math.round(s?.totalFunded || 0), pending: s?.pending || 0, invoicesFactored: s?.total || 0 };
    } catch (e) { return { totalFactored: 0, pendingPayments: 0, availableCredit: 0, totalFunded: 0, pending: 0, invoicesFactored: 0 }; }
  }),
  getRates: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const userId = Number(ctx.user?.id) || 0;
    // Defaults
    let standard = 0.025, quickPay = 0.035, sameDay = 0.045;
    if (db) {
      try {
        const stdCfg = await getFactoringConfig(db, 'FACTORING_STANDARD', { baseRate: standard }, userId);
        const qpCfg = await getFactoringConfig(db, 'FACTORING_QUICKPAY', { baseRate: quickPay }, userId);
        const sdCfg = await getFactoringConfig(db, 'FACTORING_SAMEDAY', { baseRate: sameDay }, userId);
        standard = stdCfg.baseRate;
        quickPay = qpCfg.baseRate;
        sameDay = sdCfg.baseRate;
      } catch { /* use defaults */ }
    }
    return { standard, quickPay, sameDay, currentRate: standard, advanceRate: 1 - standard };
  }),

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
        logger.error("[Factoring] getDebtors error:", e);
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
        logger.error("[Factoring] getDebtorStats error:", e);
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

      // Compute credit score using platform data
      const result = await computeCreditScore(db, input.entityName, input.mcNumber, input.dotNumber);

      await db.insert(creditChecks).values({
        requestedBy: userId,
        entityName: input.entityName,
        entityType: "shipper",
        mcNumber: input.mcNumber || null,
        dotNumber: input.dotNumber || null,
        creditScore: result.creditScore,
        creditRating: result.creditRating,
        avgDaysToPay: result.avgDaysToPay,
        yearsInBusiness: result.yearsInBusiness,
        publicRecords: result.publicRecords,
        recommendation: unsafeCast(result.recommendation),
        resultData: JSON.stringify(result.resultData),
      });

      return {
        name: input.entityName,
        score: result.creditScore,
        rating: result.creditRating,
        avgDaysToPay: result.avgDaysToPay,
        yearsInBusiness: result.yearsInBusiness,
        publicRecords: result.publicRecords,
        recommendation: result.recommendation,
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
        logger.error("[Factoring] getCreditCheckHistory error:", e);
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
