/**
 * ADVANCED FINANCIALS ROUTER
 * Multi-currency, 1099 generation, revenue recognition, collections,
 * factoring, fuel card integration, advanced billing, profitability analytics.
 */

import { z } from "zod";
import { router, isolatedApprovedProcedure as protectedProcedure } from "../_core/trpc";

// ── Currency helpers ──

const CURRENCY_CODES = ["USD", "CAD", "MXN"] as const;
type CurrencyCode = (typeof CURRENCY_CODES)[number];

const BASE_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  CAD: 1.3642,
  MXN: 17.1485,
};

function getMarginRate(from: CurrencyCode, to: CurrencyCode, margin: number): number {
  const raw = BASE_RATES[to] / BASE_RATES[from];
  return from === to ? 1 : raw * (1 + margin);
}

function formatUSD(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

// ── Seed helpers for realistic data ──

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

const LANE_DATA = [
  { origin: "Chicago, IL", destination: "Dallas, TX", miles: 920 },
  { origin: "Atlanta, GA", destination: "Miami, FL", miles: 662 },
  { origin: "Los Angeles, CA", destination: "Phoenix, AZ", miles: 373 },
  { origin: "Houston, TX", destination: "New Orleans, LA", miles: 348 },
  { origin: "Memphis, TN", destination: "Nashville, TN", miles: 212 },
  { origin: "Kansas City, MO", destination: "Denver, CO", miles: 606 },
  { origin: "Charlotte, NC", destination: "Richmond, VA", miles: 330 },
  { origin: "Detroit, MI", destination: "Columbus, OH", miles: 263 },
  { origin: "Seattle, WA", destination: "Portland, OR", miles: 174 },
  { origin: "Jacksonville, FL", destination: "Savannah, GA", miles: 139 },
];

const CUSTOMER_NAMES = [
  "Werner Logistics", "Sysco Corp", "Target Distribution", "Amazon Freight",
  "Home Depot Supply", "FedEx Freight", "Walmart Transport", "XPO Logistics",
  "Schneider National", "J.B. Hunt", "Tyson Foods", "PepsiCo Logistics",
];

const CONTRACTOR_NAMES = [
  "Rodriguez Transport LLC", "Smith Hauling Inc", "Johnson Freight Co",
  "Williams Trucking LLC", "Davis Express Inc", "Martinez Logistics Corp",
  "Anderson Carriers LLC", "Taylor Transport Inc", "Thomas Freight LLC",
  "Garcia Haulers Inc",
];

// ── Router ──

export const advancedFinancialsRouter = router({

  // ─────────── MULTI-CURRENCY ───────────

  getMultiCurrencyRates: protectedProcedure
    .input(z.object({ margin: z.number().min(0).max(0.05).optional().default(0.015) }).optional())
    .query(({ input }) => {
      const margin = input?.margin ?? 0.015;
      const now = new Date().toISOString();
      const rates = CURRENCY_CODES.flatMap((from) =>
        CURRENCY_CODES.filter((to) => to !== from).map((to) => ({
          from,
          to,
          midMarketRate: +(BASE_RATES[to] / BASE_RATES[from]).toFixed(6),
          appliedRate: +getMarginRate(from, to, margin).toFixed(6),
          margin,
          spreadBps: Math.round(margin * 10000),
          updatedAt: now,
        }))
      );
      return { rates, baseCurrency: "USD" as CurrencyCode, lastRefreshed: now };
    }),

  convertCurrency: protectedProcedure
    .input(z.object({
      amount: z.number().positive(),
      from: z.enum(CURRENCY_CODES),
      to: z.enum(CURRENCY_CODES),
      margin: z.number().min(0).max(0.05).optional().default(0.015),
    }))
    .mutation(({ input }) => {
      const rate = getMarginRate(input.from, input.to, input.margin);
      const converted = +(input.amount * rate).toFixed(2);
      return {
        originalAmount: input.amount,
        originalCurrency: input.from,
        convertedAmount: converted,
        targetCurrency: input.to,
        appliedRate: +rate.toFixed(6),
        midMarketRate: +(BASE_RATES[input.to] / BASE_RATES[input.from]).toFixed(6),
        marginApplied: input.margin,
        auditId: `FX-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
      };
    }),

  // ─────────── 1099 GENERATION ───────────

  generate1099: protectedProcedure
    .input(z.object({
      taxYear: z.number().int().min(2020).max(2030),
      contractorId: z.string().optional(),
      formType: z.enum(["1099-NEC", "1099-MISC"]).optional().default("1099-NEC"),
    }))
    .mutation(({ input }) => {
      const rng = seededRandom(input.taxYear * 100 + (input.contractorId ? parseInt(input.contractorId, 36) : 1));
      const contractors = CONTRACTOR_NAMES.map((name, i) => {
        const totalPaid = Math.round((rng() * 120000 + 15000) * 100) / 100;
        const meetsThreshold = totalPaid >= 600;
        const tin = `**-***${String(1000 + i).slice(-4)}`;
        return {
          contractorId: `CTR-${1000 + i}`,
          name,
          tin,
          tinValidated: rng() > 0.1,
          address: `${1000 + Math.floor(rng() * 9000)} Main St, Suite ${100 + i}`,
          totalNonemployeeCompensation: totalPaid,
          meetsThreshold,
          formType: input.formType,
          status: meetsThreshold ? (rng() > 0.3 ? "generated" : "pending") : "below_threshold",
        };
      });
      return {
        taxYear: input.taxYear,
        formType: input.formType,
        threshold: 600,
        contractors,
        totalForms: contractors.filter((c) => c.meetsThreshold).length,
        totalAmount: Math.round(contractors.reduce((s, c) => s + c.totalNonemployeeCompensation, 0) * 100) / 100,
        generatedAt: new Date().toISOString(),
      };
    }),

  get1099Summary: protectedProcedure
    .input(z.object({ taxYear: z.number().int().min(2020).max(2030) }))
    .query(({ input }) => {
      const rng = seededRandom(input.taxYear * 77);
      const totalContractors = 10 + Math.floor(rng() * 15);
      const aboveThreshold = Math.floor(totalContractors * (0.6 + rng() * 0.3));
      const totalPaid = Math.round((rng() * 800000 + 200000) * 100) / 100;
      return {
        taxYear: input.taxYear,
        totalContractors,
        contractorsAboveThreshold: aboveThreshold,
        contractorsBelowThreshold: totalContractors - aboveThreshold,
        totalAmountPaid: totalPaid,
        formsGenerated: Math.floor(aboveThreshold * 0.85),
        formsPending: Math.ceil(aboveThreshold * 0.15),
        formsWithTINIssues: Math.floor(rng() * 3),
        filingDeadline: `${input.taxYear + 1}-01-31`,
        electronicFilingDeadline: `${input.taxYear + 1}-03-31`,
        status: rng() > 0.5 ? "in_progress" : "pending_review",
      };
    }),

  // ─────────── REVENUE RECOGNITION (ASC 606) ───────────

  getRevenueRecognition: protectedProcedure
    .input(z.object({ period: z.string().optional() }))
    .query(({ input }) => {
      const rng = seededRandom(42);
      const obligations = [
        { id: "PO-001", description: "Freight Transportation — Origin to Destination", percentage: 70, recognitionTrigger: "delivery_completion", status: "satisfied" },
        { id: "PO-002", description: "Loading / Unloading Services", percentage: 10, recognitionTrigger: "service_rendered", status: "satisfied" },
        { id: "PO-003", description: "Accessorial — Detention Time", percentage: 8, recognitionTrigger: "time_elapsed", status: "partially_satisfied" },
        { id: "PO-004", description: "Fuel Surcharge", percentage: 7, recognitionTrigger: "delivery_completion", status: "satisfied" },
        { id: "PO-005", description: "Insurance & Compliance", percentage: 5, recognitionTrigger: "period_based", status: "in_progress" },
      ];
      const totalContractValue = 2845000;
      return {
        period: input.period || new Date().toISOString().slice(0, 7),
        standard: "ASC 606",
        totalContractValue,
        recognizedRevenue: Math.round(totalContractValue * 0.82),
        deferredRevenue: Math.round(totalContractValue * 0.18),
        performanceObligations: obligations.map((o) => ({
          ...o,
          allocatedValue: Math.round(totalContractValue * o.percentage / 100),
          recognizedAmount: Math.round(totalContractValue * o.percentage / 100 * (o.status === "satisfied" ? 1 : o.status === "partially_satisfied" ? 0.6 : 0.3)),
        })),
        contractModifications: [
          { id: "MOD-001", date: "2026-01-15", type: "rate_adjustment", impact: 12500, description: "Fuel surcharge index update" },
          { id: "MOD-002", date: "2026-02-20", type: "scope_change", impact: -8200, description: "Lane reduction — discontinued ATL-MIA route" },
        ],
      };
    }),

  getRevenueSchedule: protectedProcedure
    .input(z.object({ months: z.number().int().min(1).max(24).optional().default(12) }))
    .query(({ input }) => {
      const months = input.months;
      const schedule: Array<{ month: string; recognized: number; deferred: number; cumulative: number }> = [];
      let cumulative = 0;
      const rng = seededRandom(2026);
      for (let i = 0; i < months; i++) {
        const d = new Date(2026, i, 1);
        const recognized = Math.round((180000 + rng() * 80000) * 100) / 100;
        const deferred = Math.round((25000 + rng() * 15000) * 100) / 100;
        cumulative += recognized;
        schedule.push({
          month: d.toISOString().slice(0, 7),
          recognized,
          deferred,
          cumulative: Math.round(cumulative * 100) / 100,
        });
      }
      return { schedule, totalRecognized: Math.round(cumulative * 100) / 100 };
    }),

  // ─────────── COLLECTIONS ───────────

  getCollectionsQueue: protectedProcedure
    .input(z.object({ sortBy: z.enum(["priority", "amount", "age"]).optional().default("priority") }))
    .query(({ input }) => {
      const rng = seededRandom(999);
      const items = CUSTOMER_NAMES.slice(0, 8).map((customer, i) => {
        const invoiceAmount = Math.round((5000 + rng() * 45000) * 100) / 100;
        const daysOverdue = Math.floor(rng() * 150);
        const bucket = daysOverdue <= 30 ? "0-30" : daysOverdue <= 60 ? "31-60" : daysOverdue <= 90 ? "61-90" : "120+";
        const priorityScore = Math.min(100, Math.round(daysOverdue * 0.4 + (invoiceAmount / 500) * 0.3 + rng() * 20));
        return {
          id: `INV-${2000 + i}`,
          customer,
          invoiceAmount,
          amountPaid: Math.round(invoiceAmount * rng() * 0.4 * 100) / 100,
          balance: 0,
          daysOverdue,
          agingBucket: bucket,
          priorityScore,
          lastContactDate: new Date(Date.now() - Math.floor(rng() * 30) * 86400000).toISOString().slice(0, 10),
          contactAttempts: Math.floor(rng() * 6),
          status: daysOverdue > 90 ? "escalated" : daysOverdue > 60 ? "at_risk" : daysOverdue > 30 ? "follow_up" : "current",
        };
      }).map((item) => ({ ...item, balance: Math.round((item.invoiceAmount - item.amountPaid) * 100) / 100 }));

      if (input.sortBy === "priority") items.sort((a, b) => b.priorityScore - a.priorityScore);
      else if (input.sortBy === "amount") items.sort((a, b) => b.balance - a.balance);
      else items.sort((a, b) => b.daysOverdue - a.daysOverdue);

      return { items, totalOutstanding: Math.round(items.reduce((s, i) => s + i.balance, 0) * 100) / 100 };
    }),

  recordCollectionAction: protectedProcedure
    .input(z.object({
      invoiceId: z.string(),
      actionType: z.enum(["call", "email", "letter", "legal", "payment_plan"]),
      notes: z.string().optional(),
      followUpDate: z.string().optional(),
    }))
    .mutation(({ input }) => ({
      actionId: `CA-${Date.now()}`,
      invoiceId: input.invoiceId,
      actionType: input.actionType,
      notes: input.notes || "",
      followUpDate: input.followUpDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      recordedAt: new Date().toISOString(),
      recordedBy: "current_user",
      status: "logged",
    })),

  getCollectionsAnalytics: protectedProcedure.query(() => {
    return {
      dso: 38.4,
      dsoTrend: -2.1,
      totalOutstanding: 347820.50,
      agingBuckets: [
        { label: "Current", amount: 125400, count: 34, percentage: 36.1 },
        { label: "1-30 days", amount: 89200, count: 18, percentage: 25.6 },
        { label: "31-60 days", amount: 62450, count: 11, percentage: 18.0 },
        { label: "61-90 days", amount: 41300, count: 7, percentage: 11.9 },
        { label: "90-120 days", amount: 18970, count: 4, percentage: 5.4 },
        { label: "120+ days", amount: 10500, count: 2, percentage: 3.0 },
      ],
      recoveryRate: 94.2,
      avgCollectionPeriod: 34,
      badDebtWriteOff: 8450,
      collectionEfficiencyIndex: 87.6,
    };
  }),

  // ─────────── FACTORING ───────────

  getFactoringOffers: protectedProcedure
    .input(z.object({ invoiceId: z.string().optional() }))
    .query(() => {
      return {
        offers: [
          { provider: "OTR Solutions", advanceRate: 0.97, fee: 0.025, maxDays: 30, minInvoice: 500, maxInvoice: 250000, rating: 4.5, recourse: false },
          { provider: "RTS Financial", advanceRate: 0.95, fee: 0.03, maxDays: 45, minInvoice: 250, maxInvoice: 500000, rating: 4.3, recourse: false },
          { provider: "Apex Capital", advanceRate: 0.93, fee: 0.02, maxDays: 60, minInvoice: 100, maxInvoice: 1000000, rating: 4.7, recourse: true },
          { provider: "Triumph Pay", advanceRate: 0.96, fee: 0.028, maxDays: 35, minInvoice: 1000, maxInvoice: 300000, rating: 4.1, recourse: false },
        ],
        eligibleInvoices: 24,
        totalEligibleAmount: 186400,
      };
    }),

  submitForFactoring: protectedProcedure
    .input(z.object({
      invoiceId: z.string(),
      provider: z.string(),
      amount: z.number().positive(),
    }))
    .mutation(({ input }) => ({
      factoringId: `FAC-${Date.now()}`,
      invoiceId: input.invoiceId,
      provider: input.provider,
      originalAmount: input.amount,
      advanceAmount: Math.round(input.amount * 0.96 * 100) / 100,
      fee: Math.round(input.amount * 0.025 * 100) / 100,
      reserveAmount: Math.round(input.amount * 0.015 * 100) / 100,
      status: "submitted",
      estimatedFundingDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      submittedAt: new Date().toISOString(),
    })),

  // ─────────── FUEL CARDS ───────────

  getFuelCardTransactions: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(25), driverFilter: z.string().optional() }))
    .query(({ input }) => {
      const rng = seededRandom(777);
      const drivers = ["Mike Johnson", "Sarah Davis", "Carlos Martinez", "Emily Chen", "James Wilson"];
      const stations = ["Pilot Flying J", "Love's Travel Stops", "TA/Petro", "Casey's", "QuikTrip"];
      const txns = Array.from({ length: input.limit }, (_, i) => {
        const driverName = drivers[Math.floor(rng() * drivers.length)];
        const gallons = Math.round((40 + rng() * 180) * 10) / 10;
        const pricePerGallon = Math.round((3.20 + rng() * 1.40) * 1000) / 1000;
        const totalAmount = Math.round(gallons * pricePerGallon * 100) / 100;
        const avgMpg = 5.5 + rng() * 2;
        const expectedGallons = (200 + rng() * 400) / avgMpg;
        const fraudScore = gallons > expectedGallons * 1.4 ? Math.round(60 + rng() * 40) : Math.round(rng() * 25);
        return {
          id: `FC-${3000 + i}`,
          cardLast4: String(1000 + Math.floor(rng() * 9000)),
          driverName,
          station: stations[Math.floor(rng() * stations.length)],
          location: `${["Houston, TX", "Memphis, TN", "Atlanta, GA", "Dallas, TX", "Phoenix, AZ"][Math.floor(rng() * 5)]}`,
          gallons,
          pricePerGallon,
          totalAmount,
          fuelType: rng() > 0.15 ? "diesel" : "def",
          date: new Date(Date.now() - Math.floor(rng() * 30) * 86400000).toISOString(),
          fraudScore,
          flagged: fraudScore > 50,
          reconciled: rng() > 0.35,
          loadId: rng() > 0.2 ? `LD-${4000 + Math.floor(rng() * 500)}` : null,
        };
      });
      return {
        transactions: txns,
        totalSpend: Math.round(txns.reduce((s, t) => s + t.totalAmount, 0) * 100) / 100,
        flaggedCount: txns.filter((t) => t.flagged).length,
        unreconciledCount: txns.filter((t) => !t.reconciled).length,
      };
    }),

  reconcileFuelCards: protectedProcedure
    .input(z.object({
      transactionIds: z.array(z.string()),
      loadId: z.string().optional(),
      driverId: z.string().optional(),
    }))
    .mutation(({ input }) => ({
      reconciled: input.transactionIds.length,
      loadId: input.loadId || null,
      driverId: input.driverId || null,
      reconciledAt: new Date().toISOString(),
      status: "completed",
    })),

  // ─────────── ADVANCED BILLING ───────────

  getAdvancedBilling: protectedProcedure
    .input(z.object({ loadId: z.string().optional() }))
    .query(() => {
      return {
        lineItems: [
          { type: "linehaul", description: "Linehaul — CHI to DAL", amount: 3200.00, rateType: "flat", quantity: 1 },
          { type: "fuel_surcharge", description: "Fuel Surcharge (18.5%)", amount: 592.00, rateType: "percentage", quantity: 1 },
          { type: "detention", description: "Detention — 3.5 hrs @ $75/hr", amount: 262.50, rateType: "hourly", quantity: 3.5 },
          { type: "layover", description: "Layover — 1 day", amount: 350.00, rateType: "daily", quantity: 1 },
          { type: "accessorial", description: "Liftgate Service", amount: 150.00, rateType: "flat", quantity: 1 },
          { type: "accessorial", description: "Inside Delivery", amount: 125.00, rateType: "flat", quantity: 1 },
          { type: "tonu", description: "Truck Ordered Not Used (partial)", amount: 0, rateType: "flat", quantity: 0 },
          { type: "deadhead", description: "Deadhead — 45 miles @ $2.50/mi", amount: 112.50, rateType: "per_mile", quantity: 45 },
        ],
        subtotal: 4792.00,
        tax: 0,
        total: 4792.00,
        currency: "USD",
      };
    }),

  generateInvoiceBatch: protectedProcedure
    .input(z.object({
      invoiceIds: z.array(z.string()).optional(),
      dateRange: z.object({ from: z.string(), to: z.string() }).optional(),
      template: z.enum(["standard", "detailed", "summary"]).optional().default("standard"),
    }))
    .mutation(({ input }) => {
      const count = input.invoiceIds?.length || 12;
      return {
        batchId: `BATCH-${Date.now()}`,
        invoicesGenerated: count,
        totalAmount: Math.round(count * 4250 * 100) / 100,
        template: input.template,
        generatedAt: new Date().toISOString(),
        status: "completed",
        downloadUrl: `/api/invoices/batch/BATCH-${Date.now()}.pdf`,
      };
    }),

  // ─────────── FINANCIAL DASHBOARD & ANALYTICS ───────────

  getFinancialDashboard: protectedProcedure.query(() => {
    return {
      revenue: { mtd: 487250, ytd: 2845000, lastMonth: 512800, yoyGrowth: 0.124 },
      expenses: { mtd: 362100, ytd: 2118400, lastMonth: 389200 },
      grossMargin: { mtd: 0.257, ytd: 0.255, lastMonth: 0.241 },
      netMargin: { mtd: 0.148, ytd: 0.152, lastMonth: 0.139 },
      cashFlow: { operating: 89400, investing: -22500, financing: -15800, netChange: 51100, cashOnHand: 342800 },
      receivables: { total: 347820, current: 225400, overdue: 122420 },
      payables: { total: 218600, current: 176200, overdue: 42400 },
      loadMetrics: { totalLoads: 342, avgRevenuePerLoad: 1424.85, avgCostPerMile: 2.18, avgRevenuePerMile: 2.92 },
      projections: {
        nextMonth: { revenue: 498500, expenses: 371200, margin: 0.255 },
        nextQuarter: { revenue: 1520000, expenses: 1132000, margin: 0.255 },
      },
      trends: [
        { month: "2025-10", revenue: 468200, expenses: 351100, margin: 0.25 },
        { month: "2025-11", revenue: 491500, expenses: 370800, margin: 0.246 },
        { month: "2025-12", revenue: 512800, expenses: 389200, margin: 0.241 },
        { month: "2026-01", revenue: 478600, expenses: 358200, margin: 0.252 },
        { month: "2026-02", revenue: 487250, expenses: 362100, margin: 0.257 },
      ],
    };
  }),

  getProfitabilityByLane: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(({ input }) => {
      const rng = seededRandom(456);
      return {
        lanes: LANE_DATA.slice(0, input.limit).map((lane, i) => {
          const rpm = 2.40 + rng() * 1.20;
          const cpm = 1.60 + rng() * 0.80;
          const revenue = Math.round(lane.miles * rpm * 100) / 100;
          const cost = Math.round(lane.miles * cpm * 100) / 100;
          const margin = +((revenue - cost) / revenue).toFixed(4);
          return {
            ...lane,
            loadsCount: 8 + Math.floor(rng() * 40),
            avgRevenue: revenue,
            avgCost: cost,
            avgMargin: margin,
            revenuePerMile: +rpm.toFixed(2),
            costPerMile: +cpm.toFixed(2),
            profitPerMile: +(rpm - cpm).toFixed(2),
            trend: rng() > 0.5 ? "up" : rng() > 0.3 ? "stable" : "down",
          };
        }).sort((a, b) => b.avgMargin - a.avgMargin),
      };
    }),

  getProfitabilityByCustomer: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(({ input }) => {
      const rng = seededRandom(789);
      return {
        customers: CUSTOMER_NAMES.slice(0, input.limit).map((name, i) => {
          const totalRevenue = Math.round((50000 + rng() * 450000) * 100) / 100;
          const totalCost = Math.round(totalRevenue * (0.65 + rng() * 0.2) * 100) / 100;
          const loadsCompleted = 10 + Math.floor(rng() * 80);
          const avgPayDays = 20 + Math.floor(rng() * 45);
          const ltv = Math.round(totalRevenue * (2 + rng() * 4) * 100) / 100;
          return {
            id: `CUST-${100 + i}`,
            name,
            totalRevenue,
            totalCost,
            grossProfit: Math.round((totalRevenue - totalCost) * 100) / 100,
            margin: +((totalRevenue - totalCost) / totalRevenue).toFixed(4),
            loadsCompleted,
            avgRevenuePerLoad: Math.round(totalRevenue / loadsCompleted * 100) / 100,
            avgPayDays,
            lifetimeValue: ltv,
            riskScore: avgPayDays > 45 ? "high" : avgPayDays > 30 ? "medium" : "low",
            retentionYears: +(1 + rng() * 6).toFixed(1),
          };
        }).sort((a, b) => b.grossProfit - a.grossProfit),
      };
    }),

  getPaymentTermsOptimization: protectedProcedure.query(() => {
    return {
      recommendations: [
        { customerId: "CUST-101", customer: "Sysco Corp", currentTerms: "Net 45", suggestedTerms: "Net 30", reason: "Consistently pays early (avg 22 days). Offer 2% early pay discount.", projectedImpact: 4200 },
        { customerId: "CUST-103", customer: "Amazon Freight", currentTerms: "Net 30", suggestedTerms: "Net 15 (2/10 Net 30)", reason: "High volume customer, strong payment history. Early pay discount incentive.", projectedImpact: 8100 },
        { customerId: "CUST-106", customer: "Walmart Transport", currentTerms: "Net 60", suggestedTerms: "Net 45", reason: "Large balance aging. Reducing terms improves cash flow by ~$12K/month.", projectedImpact: 12000 },
        { customerId: "CUST-109", customer: "J.B. Hunt", currentTerms: "Net 30", suggestedTerms: "Factor eligible", reason: "Consistent payer but terms tie up capital. Factoring frees $18K avg.", projectedImpact: 18000 },
      ],
      totalProjectedCashFlowImprovement: 42300,
      avgDSOImpact: -6.2,
    };
  }),

  getCashFlowForecast: protectedProcedure
    .input(z.object({ days: z.enum(["30", "60", "90"]).optional().default("90") }))
    .query(({ input }) => {
      const daysNum = parseInt(input.days, 10);
      const rng = seededRandom(2026);
      const daily: Array<{ date: string; inflow: number; outflow: number; netCash: number; balance: number }> = [];
      let balance = 342800;
      for (let i = 0; i < daysNum; i++) {
        const d = new Date(Date.now() + i * 86400000);
        const dayOfWeek = d.getDay();
        const isWeekday = dayOfWeek > 0 && dayOfWeek < 6;
        const inflow = isWeekday ? Math.round((8000 + rng() * 12000) * 100) / 100 : Math.round(rng() * 2000 * 100) / 100;
        const outflow = isWeekday ? Math.round((6000 + rng() * 9000) * 100) / 100 : Math.round(rng() * 1500 * 100) / 100;
        const net = Math.round((inflow - outflow) * 100) / 100;
        balance = Math.round((balance + net) * 100) / 100;
        daily.push({ date: d.toISOString().slice(0, 10), inflow, outflow, netCash: net, balance });
      }
      return {
        startingBalance: 342800,
        endingBalance: daily[daily.length - 1]?.balance || 342800,
        totalInflows: Math.round(daily.reduce((s, d) => s + d.inflow, 0) * 100) / 100,
        totalOutflows: Math.round(daily.reduce((s, d) => s + d.outflow, 0) * 100) / 100,
        netChange: Math.round((daily[daily.length - 1]?.balance || 342800) - 342800),
        forecast: daily,
        minimumBalance: Math.min(...daily.map((d) => d.balance)),
        minimumBalanceDate: daily.reduce((min, d) => d.balance < min.balance ? d : min, daily[0]).date,
      };
    }),

  getExpenseCategories: protectedProcedure
    .input(z.object({ period: z.string().optional() }))
    .query(() => {
      return {
        categories: [
          { category: "Fuel", amount: 148200, percentage: 40.9, trend: 0.032, budgeted: 142000 },
          { category: "Driver Pay", amount: 98500, percentage: 27.2, trend: 0.015, budgeted: 96000 },
          { category: "Insurance", amount: 32400, percentage: 8.9, trend: 0.005, budgeted: 33000 },
          { category: "Maintenance & Repairs", amount: 28600, percentage: 7.9, trend: -0.012, budgeted: 30000 },
          { category: "Tolls", amount: 14800, percentage: 4.1, trend: 0.008, budgeted: 14500 },
          { category: "Permits & Licenses", amount: 9200, percentage: 2.5, trend: 0.0, budgeted: 9200 },
          { category: "Equipment Lease", amount: 18400, percentage: 5.1, trend: 0.0, budgeted: 18400 },
          { category: "Office & Admin", amount: 12000, percentage: 3.3, trend: -0.005, budgeted: 12500 },
        ],
        totalExpenses: 362100,
        totalBudgeted: 355600,
        varianceAmount: 6500,
        variancePercentage: 0.018,
      };
    }),

  getBudgetVsActual: protectedProcedure
    .input(z.object({ year: z.number().optional().default(2026) }))
    .query(({ input }) => {
      const rng = seededRandom(input.year);
      const months = Array.from({ length: 12 }, (_, i) => {
        const m = new Date(input.year, i, 1);
        const budgetRevenue = 450000 + Math.round(rng() * 100000);
        const actualRevenue = i < 2 ? Math.round(budgetRevenue * (0.92 + rng() * 0.16)) : null;
        const budgetExpenses = 340000 + Math.round(rng() * 60000);
        const actualExpenses = i < 2 ? Math.round(budgetExpenses * (0.95 + rng() * 0.12)) : null;
        return {
          month: m.toISOString().slice(0, 7),
          budgetRevenue,
          actualRevenue,
          revenueVariance: actualRevenue != null ? actualRevenue - budgetRevenue : null,
          budgetExpenses,
          actualExpenses,
          expenseVariance: actualExpenses != null ? actualExpenses - budgetExpenses : null,
          budgetProfit: budgetRevenue - budgetExpenses,
          actualProfit: actualRevenue != null && actualExpenses != null ? actualRevenue - actualExpenses : null,
        };
      });
      return {
        year: input.year,
        months,
        ytdBudgetRevenue: months.slice(0, 2).reduce((s, m) => s + m.budgetRevenue, 0),
        ytdActualRevenue: months.slice(0, 2).reduce((s, m) => s + (m.actualRevenue || 0), 0),
        ytdBudgetExpenses: months.slice(0, 2).reduce((s, m) => s + m.budgetExpenses, 0),
        ytdActualExpenses: months.slice(0, 2).reduce((s, m) => s + (m.actualExpenses || 0), 0),
      };
    }),
});
