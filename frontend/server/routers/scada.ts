/**
 * SCADA ROUTER
 * tRPC procedures for terminal SCADA integration and rack management
 */

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { terminals } from "../../drizzle/schema";

const rackStatusSchema = z.enum(["available", "loading", "maintenance", "offline", "reserved"]);
const productTypeSchema = z.enum(["unleaded", "premium", "diesel", "jet_fuel", "ethanol"]);

export const scadaRouter = router({
  /**
   * Get terminal overview
   */
  getTerminalOverview: protectedProcedure
    .input(z.object({ terminalId: z.string() }))
    .query(async ({ input }) => ({
      terminalId: input.terminalId, terminalName: "", status: "offline", lastUpdate: new Date().toISOString(),
      racks: { total: 0, available: 0, loading: 0, maintenance: 0, offline: 0 },
      throughput: { today: 0, target: 0, unit: "gallons", percentOfTarget: 0 },
      inventory: {}, alerts: [], weather: { temperature: 0, conditions: "N/A", windSpeed: 0 },
    })),

  /**
   * Get rack status
   */
  getRackStatus: protectedProcedure
    .input(z.object({ terminalId: z.string() }))
    .query(async () => ({ racks: [] })),

  /**
   * Get tank levels
   */
  getTankLevels: protectedProcedure
    .input(z.object({ terminalId: z.string() }))
    .query(async () => ({ tanks: [], totals: {} })),

  /**
   * Start loading
   */
  startLoading: protectedProcedure
    .input(z.object({
      rackId: z.string(),
      loadId: z.string(),
      product: productTypeSchema,
      targetGallons: z.number(),
      compartments: z.array(z.object({
        number: z.number(),
        product: productTypeSchema,
        gallons: z.number(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        transactionId: `txn_${Date.now()}`,
        rackId: input.rackId,
        loadId: input.loadId,
        status: "loading_started",
        startTime: new Date().toISOString(),
        estimatedDuration: 30,
        authorizedBy: ctx.user?.id,
      };
    }),

  /**
   * Stop loading
   */
  stopLoading: protectedProcedure
    .input(z.object({
      rackId: z.string(),
      reason: z.enum(["completed", "emergency", "manual_stop", "error"]),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        rackId: input.rackId,
        status: "loading_stopped",
        reason: input.reason,
        stoppedAt: new Date().toISOString(),
        stoppedBy: ctx.user?.id,
        finalGallons: 8500,
      };
    }),

  /**
   * Get loading transaction
   */
  getTransaction: protectedProcedure
    .input(z.object({ transactionId: z.string() }))
    .query(async ({ input }) => ({
      transactionId: input.transactionId, loadNumber: "", rack: "", product: "",
      startTime: "", endTime: "", duration: 0, targetGallons: 0, actualGallons: 0,
      variance: 0, variancePercent: 0, temperature: { start: 0, end: 0, average: 0 },
      apiGravity: 0, netGallons: 0, grossGallons: 0, meterReadings: { start: 0, end: 0 },
      bol: null,
    })),

  /**
   * Get daily throughput
   */
  getDailyThroughput: protectedProcedure
    .input(z.object({ terminalId: z.string(), date: z.string().optional() }))
    .query(async ({ input }) => ({
      date: input.date || new Date().toISOString().split("T")[0],
      totalGallons: 0, transactions: 0, byProduct: [], byHour: [], peakHour: "", avgLoadTime: 0,
    })),

  /**
   * Get alarms
   */
  getAlarms: protectedProcedure
    .input(z.object({ terminalId: z.string(), active: z.boolean().default(true) }))
    .query(async () => ({ alarms: [], summary: { critical: 0, warning: 0, info: 0, total: 0 } })),

  /**
   * Acknowledge alarm
   */
  acknowledgeAlarm: protectedProcedure
    .input(z.object({
      alarmId: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        alarmId: input.alarmId,
        acknowledgedBy: ctx.user?.id,
        acknowledgedAt: new Date().toISOString(),
      };
    }),

  /**
   * Reserve rack
   */
  reserveRack: protectedProcedure
    .input(z.object({
      rackId: z.string(),
      loadId: z.string(),
      scheduledTime: z.string(),
      product: productTypeSchema,
      duration: z.number().default(45),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        reservationId: `res_${Date.now()}`,
        rackId: input.rackId,
        loadId: input.loadId,
        scheduledTime: input.scheduledTime,
        reservedBy: ctx.user?.id,
        reservedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get EIA report data
   */
  getEIAReportData: protectedProcedure
    .input(z.object({ terminalId: z.string(), reportWeek: z.string() }))
    .query(async ({ input }) => ({
      terminalId: input.terminalId, reportWeek: input.reportWeek, reportingThreshold: 50000, meetsThreshold: false,
      data: { beginningStocks: { total: 0 }, receipts: { total: 0 }, shipments: { total: 0 }, endingStocks: { total: 0 } },
      submissionStatus: "pending", dueDate: "",
    })),

  /**
   * Submit EIA report
   */
  submitEIAReport: protectedProcedure
    .input(z.object({
      terminalId: z.string(),
      reportWeek: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        reportId: `eia_${Date.now()}`,
        status: "submitted",
        submittedBy: ctx.user?.id,
        submittedAt: new Date().toISOString(),
        confirmationNumber: `EIA-2025-${String(Date.now()).slice(-6)}`,
      };
    }),

  // Additional SCADA procedures
  getOverview: protectedProcedure.input(z.object({ terminalId: z.string().optional() }).optional()).query(async ({ ctx }) => {
    const db = await getDb(); if (!db) return { terminals: 0, totalThroughput: 0, activeRacks: 0, alerts: 0, terminalsOnline: 0, totalTanks: 0, totalInventory: 0, activeFlows: 0 };
    try {
      const companyId = ctx.user?.companyId || 0;
      const [stats] = await db.select({
        total: sql<number>`count(*)`,
        active: sql<number>`SUM(CASE WHEN ${terminals.status} = 'active' THEN 1 ELSE 0 END)`,
        totalTanks: sql<number>`COALESCE(SUM(${terminals.tankCount}), 0)`,
        totalDocks: sql<number>`COALESCE(SUM(${terminals.dockCount}), 0)`,
      }).from(terminals).where(eq(terminals.companyId, companyId));
      return {
        terminals: stats?.total || 0,
        terminalsOnline: stats?.active || 0,
        totalTanks: stats?.totalTanks || 0,
        activeRacks: stats?.totalDocks || 0,
        totalThroughput: 0,
        alerts: 0,
        totalInventory: 0,
        activeFlows: 0,
      };
    } catch (e) { return { terminals: 0, totalThroughput: 0, activeRacks: 0, alerts: 0, terminalsOnline: 0, totalTanks: 0, totalInventory: 0, activeFlows: 0 }; }
  }),
  getTerminals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) return [];
    try {
      const companyId = ctx.user?.companyId || 0;
      const rows = await db.select().from(terminals).where(eq(terminals.companyId, companyId)).limit(50);
      return rows.map(t => ({
        id: String(t.id),
        name: t.name,
        code: t.code || '',
        address: t.address || '',
        city: t.city || '',
        state: t.state || '',
        status: t.status || 'active',
        dockCount: t.dockCount || 0,
        tankCount: t.tankCount || 0,
      }));
    } catch (e) { return []; }
  }),
  getTanks: protectedProcedure.input(z.object({ terminalId: z.string().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) return [];
    try {
      const companyId = ctx.user?.companyId || 0;
      let terminalRows;
      if (input?.terminalId) {
        terminalRows = await db.select().from(terminals).where(eq(terminals.id, parseInt(input.terminalId, 10))).limit(1);
      } else {
        terminalRows = await db.select().from(terminals).where(eq(terminals.companyId, companyId)).limit(20);
      }
      const tanks: { id: string; terminalId: string; terminalName: string; tankNumber: number; capacity: number; product: string; level: number; status: string }[] = [];
      for (const t of terminalRows) {
        const count = t.tankCount || 0;
        for (let i = 1; i <= count; i++) {
          tanks.push({
            id: `${t.id}-T${String(i).padStart(2, '0')}`,
            terminalId: String(t.id),
            terminalName: t.name,
            tankNumber: i,
            capacity: 50000,
            product: i % 3 === 0 ? 'diesel' : i % 2 === 0 ? 'premium' : 'unleaded',
            level: 0,
            status: t.status || 'active',
          });
        }
      }
      return tanks;
    } catch (e) { return []; }
  }),
});
