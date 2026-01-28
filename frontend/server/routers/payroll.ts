/**
 * PAYROLL ROUTER
 * tRPC procedures for payroll management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const payrollRouter = router({
  /**
   * Get driver payroll records
   */
  getDriverPayroll: protectedProcedure
    .input(z.object({
      period: z.string().optional(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ input }) => {
      return [
        {
          id: "pay_001",
          driverName: "Mike Johnson",
          driverId: "drv_001",
          period: input.period || "2025-01",
          grossPay: 5250.00,
          deductions: 1050.00,
          netPay: 4200.00,
          miles: 4200,
          loads: 12,
          status: "pending",
          payDate: "2025-01-31",
        },
        {
          id: "pay_002",
          driverName: "Sarah Williams",
          driverId: "drv_002",
          period: input.period || "2025-01",
          grossPay: 4800.00,
          deductions: 960.00,
          netPay: 3840.00,
          miles: 3800,
          loads: 10,
          status: "processed",
          payDate: "2025-01-31",
        },
      ];
    }),

  /**
   * Get payroll summary
   */
  getSummary: protectedProcedure
    .input(z.object({
      period: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return {
        totalGross: 52500.00,
        totalDeductions: 10500.00,
        totalNet: 42000.00,
        totalDrivers: 10,
        pendingPayments: 3,
        processedPayments: 7,
        averagePay: 4200.00,
        period: input.period || "2025-01",
        totalPayroll: 52500.00,
        driversCount: 10,
        avgPay: 4200.00,
        paidCount: 7,
        periodStart: "2025-01-01",
        periodEnd: "2025-01-15",
        payDate: "2025-01-20",
        status: "pending",
      };
    }),

  /**
   * Process payroll
   */
  process: protectedProcedure
    .input(z.object({ driverIds: z.array(z.string()).optional(), period: z.string().optional() }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        processedCount: input.driverIds?.length || 10,
        processedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get payroll records
   */
  getPayroll: protectedProcedure
    .input(z.object({
      period: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return [
        {
          id: "batch_001",
          period: input.period || "2025-01",
          status: "pending",
          totalAmount: 52500.00,
          driverCount: 10,
          createdAt: "2025-01-24",
        },
      ];
    }),

  /**
   * Get payroll stats
   */
  getStats: protectedProcedure
    .input(z.object({
      period: z.string().optional(),
    }))
    .query(async () => {
      return {
        currentPeriod: 52500.00,
        previousPeriod: 48000.00,
        change: 9.4,
        avgPerDriver: 4200.00,
        pendingCount: 3,
        employees: 25,
        totalGross: 52500,
        totalNet: 42000,
        pending: 3,
      };
    }),

  /**
   * Process payroll for PayrollManagement page
   */
  processPayroll: protectedProcedure
    .input(z.object({ period: z.string().optional() }))
    .mutation(async ({ input }) => {
      return { success: true, processedAt: new Date().toISOString(), period: input.period || "current" };
    }),

  /**
   * Process payroll batch (by IDs)
   */
  processBatch: protectedProcedure
    .input(z.object({
      payrollIds: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        processedCount: input.payrollIds.length,
        message: `Processed ${input.payrollIds.length} payroll records`,
      };
    }),

  /**
   * Get time off requests for TimeOffRequests page
   */
  getTimeOffRequests: protectedProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ input }) => {
      const requests = [
        { id: "to1", driver: "Mike Johnson", type: "vacation", startDate: "2025-02-01", endDate: "2025-02-05", status: "pending", requestedAt: "2025-01-20" },
        { id: "to2", driver: "Sarah Williams", type: "sick", startDate: "2025-01-25", endDate: "2025-01-26", status: "approved", requestedAt: "2025-01-22" },
      ];
      if (input.status && input.status !== "all") return requests.filter(r => r.status === input.status);
      return requests;
    }),

  /**
   * Get time off stats for TimeOffRequests page
   */
  getTimeOffStats: protectedProcedure
    .query(async () => {
      return { pending: 3, approved: 12, denied: 2, thisMonth: 8, total: 17, daysUsed: 45 };
    }),

  /**
   * Approve time off mutation
   */
  approveTimeOff: protectedProcedure
    .input(z.object({ requestId: z.string().optional(), id: z.string().optional() }))
    .mutation(async ({ input }) => {
      return { success: true, requestId: input.requestId || input.id, status: "approved" };
    }),

  /**
   * Deny time off mutation
   */
  denyTimeOff: protectedProcedure
    .input(z.object({ requestId: z.string().optional(), id: z.string().optional(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      return { success: true, requestId: input.requestId || input.id, status: "denied" };
    }),

  /**
   * Get tax documents for TaxDocuments page
   */
  getTaxDocuments: protectedProcedure
    .input(z.object({ year: z.string() }))
    .query(async ({ input }) => {
      return [
        { id: "td1", type: "W-2", year: input.year, status: "available", downloadUrl: "/docs/w2-2024.pdf" },
        { id: "td2", type: "1099", year: input.year, status: "available", downloadUrl: "/docs/1099-2024.pdf" },
        { id: "td3", type: "Pay Stubs", year: input.year, status: "available", downloadUrl: "/docs/paystubs-2024.pdf" },
      ];
    }),

  /**
   * Get tax document stats for TaxDocuments page
   */
  getTaxDocStats: protectedProcedure
    .input(z.object({ year: z.string() }))
    .query(async () => {
      return { totalDocuments: 15, available: 12, pending: 3, downloadedCount: 8, total: 15, downloaded: 8 };
    }),

  // Settlements
  getSettlements: protectedProcedure.input(z.object({ status: z.string().optional(), period: z.string().optional() }).optional()).query(async () => [{ id: "s1", driverId: "d1", period: "Week 3", grossPay: 2850, netPay: 2100, status: "paid" }]),
  getSettlementStats: protectedProcedure.input(z.object({ period: z.string().optional() }).optional()).query(async () => ({ totalPaid: 125000, pending: 15000, thisWeek: 28500, total: 45, totalRevenue: 140000, totalSettled: 125000 })),

  // Expenses
  getExpenseReports: protectedProcedure.input(z.object({ status: z.string().optional() })).query(async () => [{ id: "e1", driverId: "d1", amount: 250, category: "fuel", status: "pending" }]),
  getExpenseStats: protectedProcedure.query(async () => ({ total: 8500, approved: 7200, pending: 1300, denied: 0, pendingAmount: 1300, approvedAmount: 7200, reimbursedAmount: 6500 })),
  approveExpense: protectedProcedure.input(z.object({ expenseId: z.string().optional(), id: z.string().optional() })).mutation(async ({ input }) => ({ success: true, expenseId: input.expenseId || input.id })),

  // Benefits
  getBenefits: protectedProcedure.input(z.object({ search: z.string().optional() }).optional()).query(async () => [{ id: "b1", type: "health", provider: "BlueCross", status: "active", monthlyCost: 450 }]),
  getBenefitStats: protectedProcedure.query(async () => ({ enrolled: 85, pending: 5, totalMonthlyCost: 38250, totalEmployees: 100, plans: 4, monthlyCost: 38250 })),
});
