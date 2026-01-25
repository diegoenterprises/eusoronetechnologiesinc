/**
 * EARNINGS ROUTER
 * tRPC procedures for driver and carrier earnings tracking
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const earningStatusSchema = z.enum(["pending", "approved", "paid"]);

export const earningsRouter = router({
  /**
   * Get earnings summary for current user
   */
  getSummary: protectedProcedure
    .input(z.object({
      period: z.enum(["week", "month", "quarter", "year"]).default("week"),
    }))
    .query(async ({ ctx, input }) => {
      return {
        period: input.period,
        totalEarnings: 6776.75,
        totalLoads: 5,
        totalMiles: 1795,
        avgPerMile: 3.78,
        avgPerLoad: 1355.35,
        pendingAmount: 876.00,
        approvedAmount: 1243.00,
        paidAmount: 4657.75,
        comparison: {
          previousPeriod: 6125.50,
          percentChange: 10.6,
          trend: "up" as const,
        },
      };
    }),

  /**
   * Get earnings for DriverEarnings page
   */
  getEarnings: protectedProcedure
    .input(z.object({ period: z.string().optional(), offset: z.number().optional().default(0) }))
    .query(async () => {
      return [
        { id: "e1", loadNumber: "LOAD-45920", date: "2025-01-23", origin: "Houston, TX", destination: "Dallas, TX", miles: 240, pay: 876, status: "pending" },
        { id: "e2", loadNumber: "LOAD-45918", date: "2025-01-22", origin: "Beaumont, TX", destination: "San Antonio, TX", miles: 320, pay: 1243, status: "approved" },
        { id: "e3", loadNumber: "LOAD-45915", date: "2025-01-21", origin: "Port Arthur, TX", destination: "Austin, TX", miles: 280, pay: 1015, status: "paid" },
      ];
    }),

  /**
   * Get weekly summary for DriverEarnings page
   */
  getWeeklySummary: protectedProcedure
    .input(z.object({ offset: z.number().optional().default(0) }))
    .query(async ({ input }) => {
      return {
        weekStart: "2025-01-20",
        weekEnd: "2025-01-26",
        totalEarnings: 3134,
        totalMiles: 840,
        totalLoads: 3,
        avgPerMile: 3.73,
      };
    }),

  /**
   * List earnings entries
   */
  list: protectedProcedure
    .input(z.object({
      status: earningStatusSchema.optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const entries = [
        {
          id: "e1",
          loadNumber: "LOAD-45920",
          date: "2025-01-23",
          origin: "Houston, TX",
          destination: "Dallas, TX",
          miles: 240,
          basePay: 720,
          fuelBonus: 48,
          hazmatPremium: 108,
          detentionPay: 0,
          totalPay: 876,
          status: "pending",
        },
        {
          id: "e2",
          loadNumber: "LOAD-45918",
          date: "2025-01-22",
          origin: "Beaumont, TX",
          destination: "San Antonio, TX",
          miles: 320,
          basePay: 960,
          fuelBonus: 64,
          hazmatPremium: 144,
          detentionPay: 75,
          totalPay: 1243,
          status: "approved",
        },
        {
          id: "e3",
          loadNumber: "LOAD-45915",
          date: "2025-01-21",
          origin: "Port Arthur, TX",
          destination: "Austin, TX",
          miles: 280,
          basePay: 840,
          fuelBonus: 56,
          hazmatPremium: 126,
          detentionPay: 0,
          totalPay: 1022,
          status: "paid",
        },
      ];

      let filtered = entries;
      if (input.status) {
        filtered = filtered.filter(e => e.status === input.status);
      }

      return {
        entries: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
        totals: {
          totalPay: filtered.reduce((sum, e) => sum + e.totalPay, 0),
          totalMiles: filtered.reduce((sum, e) => sum + e.miles, 0),
        },
      };
    }),

  /**
   * Get weekly summaries
   */
  getWeeklySummaries: protectedProcedure
    .input(z.object({ weeks: z.number().default(8) }))
    .query(async ({ input }) => {
      const summaries = [];
      const today = new Date();
      
      for (let i = 0; i < input.weeks; i++) {
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        
        summaries.push({
          weekStart: weekStart.toISOString().split('T')[0],
          weekEnd: weekEnd.toISOString().split('T')[0],
          totalLoads: 4 + Math.floor(Math.random() * 3),
          totalMiles: 1500 + Math.floor(Math.random() * 700),
          totalEarnings: 5500 + Math.floor(Math.random() * 2500),
          avgPerMile: 3.75 + Math.random() * 0.15,
          avgPerLoad: 1200 + Math.floor(Math.random() * 300),
        });
      }
      
      return summaries;
    }),

  /**
   * Get pay statement
   */
  getPayStatement: protectedProcedure
    .input(z.object({
      statementId: z.string().optional(),
      weekEnding: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return {
        id: input.statementId || "stmt_001",
        weekEnding: input.weekEnding || "2025-01-26",
        driverId: ctx.user?.id,
        driverName: ctx.user?.name || "Driver",
        entries: [
          { loadNumber: "LOAD-45920", date: "2025-01-23", miles: 240, gross: 876 },
          { loadNumber: "LOAD-45918", date: "2025-01-22", miles: 320, gross: 1243 },
          { loadNumber: "LOAD-45915", date: "2025-01-21", miles: 280, gross: 1022 },
        ],
        summary: {
          grossPay: 3141,
          deductions: {
            fuelAdvance: 0,
            insurance: 125,
            other: 0,
          },
          netPay: 3016,
        },
        paymentMethod: "Direct Deposit",
        paymentDate: "2025-01-31",
      };
    }),

  /**
   * Get year-to-date summary
   */
  getYTDSummary: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        year: 2025,
        totalEarnings: 26604.25,
        totalLoads: 20,
        totalMiles: 7045,
        avgPerMile: 3.78,
        avgPerLoad: 1330.21,
        monthlyBreakdown: [
          { month: "January", earnings: 26604.25, loads: 20, miles: 7045 },
        ],
        projectedAnnual: 319251.00,
      };
    }),

  // Additional earnings procedures
  getHistory: protectedProcedure.input(z.object({ limit: z.number().optional() })).query(async () => [{ id: "e1", date: "2025-01-22", amount: 2500, type: "settlement" }]),
  getSettlementHistory: protectedProcedure.input(z.object({ status: z.string().optional() })).query(async () => [{ id: "s1", period: "Week 3", grossPay: 2850, netPay: 2100, status: "paid" }]),
  getSettlementById: protectedProcedure.input(z.object({ settlementId: z.string() })).query(async ({ input }) => ({ 
    id: input.settlementId, 
    settlementNumber: "SET-2025-003",
    period: "Week 3", 
    periodStart: "2025-01-13",
    periodEnd: "2025-01-19",
    driverId: "d1",
    driverName: "Mike Johnson",
    grossPay: 2850, 
    deductions: 750, 
    netPay: 2100,
    status: "paid",
    paidDate: "2025-01-22",
    loads: [{ loadNumber: "LOAD-45918", amount: 1425 }, { loadNumber: "LOAD-45919", amount: 1425 }],
    deductionDetails: [{ type: "fuel_advance", amount: 500 }, { type: "insurance", amount: 250 }],
    breakdown: { lineHaul: 2400, fuelSurcharge: 300, accessorials: 150 }
  })),
  approveSettlement: protectedProcedure.input(z.object({ settlementId: z.string() })).mutation(async ({ input }) => ({ success: true, settlementId: input.settlementId })),
  processPayment: protectedProcedure.input(z.object({ settlementId: z.string() })).mutation(async ({ input }) => ({ success: true, paymentId: "pay_123" })),
  getEarningsSummary: protectedProcedure.query(async () => ({ total: 125000, pending: 8500, paid: 116500, avgPerLoad: 2850, breakdown: { lineHaul: 95000, fuelSurcharge: 18000, accessorials: 12000 } })),
});
