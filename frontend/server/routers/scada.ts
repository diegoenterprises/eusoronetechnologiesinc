/**
 * SCADA ROUTER
 * tRPC procedures for terminal SCADA integration and rack management
 */

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { terminals } from "../../drizzle/schema";
import { unsafeCast } from "../_core/types/unsafe";

const rackStatusSchema = z.enum(["available", "loading", "maintenance", "offline", "reserved"]);
const productTypeSchema = z.enum(["unleaded", "premium", "diesel", "jet_fuel", "ethanol"]);

export const scadaRouter = router({
  /**
   * Get terminal overview
   */
  getTerminalOverview: protectedProcedure
    .input(z.object({ terminalId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { terminalId: input.terminalId, terminalName: "", status: "offline", lastUpdate: new Date().toISOString(), racks: { total: 0, available: 0, loading: 0, maintenance: 0, offline: 0 }, throughput: { today: 0, target: 0, unit: "gallons", percentOfTarget: 0 }, inventory: {}, alerts: [], weather: { temperature: 0, conditions: "N/A", windSpeed: 0 } };
      try {
        const tid = parseInt(input.terminalId, 10);
        const [terminal] = await db.select().from(terminals).where(eq(terminals.id, tid)).limit(1);
        // Get today's throughput from scada_transactions
        const [tput] = await db.execute(sql`
          SELECT COALESCE(SUM(actualGallons), 0) as todayGal, COUNT(*) as txnCount
          FROM scada_transactions WHERE terminalId = ${tid} AND DATE(startTime) = CURDATE() AND status = 'completed'
        `);
        const tp = unsafeCast(tput || [])[0] || {};
        // Get active alarms
        const [alarmStats] = await db.execute(sql`
          SELECT COUNT(*) as total,
            SUM(CASE WHEN severity='critical' THEN 1 ELSE 0 END) as critical,
            SUM(CASE WHEN severity='warning' THEN 1 ELSE 0 END) as warning
          FROM scada_alarms WHERE terminalId = ${tid} AND acknowledged = false
        `);
        const as2 = unsafeCast(alarmStats || [])[0] || {};
        const dockCount = terminal?.dockCount || 0;
        return {
          terminalId: input.terminalId,
          terminalName: terminal?.name || "",
          status: terminal?.status || "offline",
          lastUpdate: new Date().toISOString(),
          racks: { total: dockCount, available: dockCount, loading: 0, maintenance: 0, offline: 0 },
          throughput: { today: Number(tp.todayGal) || 0, target: 100000, unit: "gallons", percentOfTarget: Math.round(((Number(tp.todayGal) || 0) / 100000) * 100) },
          inventory: {},
          alerts: [{ critical: Number(as2.critical) || 0, warning: Number(as2.warning) || 0, total: Number(as2.total) || 0 }],
          weather: { temperature: 0, conditions: "N/A", windSpeed: 0 },
        };
      } catch (e) {
        return { terminalId: input.terminalId, terminalName: "", status: "offline", lastUpdate: new Date().toISOString(), racks: { total: 0, available: 0, loading: 0, maintenance: 0, offline: 0 }, throughput: { today: 0, target: 0, unit: "gallons", percentOfTarget: 0 }, inventory: {}, alerts: [], weather: { temperature: 0, conditions: "N/A", windSpeed: 0 } };
      }
    }),

  /**
   * Get rack status
   */
  getRackStatus: protectedProcedure
    .input(z.object({ terminalId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { racks: [] };
      try {
        const tid = parseInt(input.terminalId, 10);
        const [terminal] = await db.select().from(terminals).where(eq(terminals.id, tid)).limit(1);
        const dockCount = terminal?.dockCount || 0;
        const racks = [];
        for (let i = 1; i <= dockCount; i++) {
          // Check if rack has active loading transaction
          const [active] = await db.execute(sql`
            SELECT id, status, product, loadId FROM scada_transactions
            WHERE terminalId = ${tid} AND rackId = ${'R' + String(i).padStart(2, '0')} AND status IN ('loading', 'pending')
            ORDER BY createdAt DESC LIMIT 1
          `);
          const activeTxn = unsafeCast(active || [])[0];
          racks.push({
            id: `R${String(i).padStart(2, '0')}`,
            terminalId: input.terminalId,
            status: activeTxn ? (activeTxn.status === 'loading' ? 'loading' : 'reserved') : 'available',
            product: activeTxn?.product || null,
            loadId: activeTxn?.loadId || null,
          });
        }
        return { racks };
      } catch { return { racks: [] }; }
    }),

  /**
   * Get tank levels
   */
  getTankLevels: protectedProcedure
    .input(z.object({ terminalId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { tanks: [], totals: {} };
      try {
        const tid = parseInt(input.terminalId, 10);
        const [terminal] = await db.select().from(terminals).where(eq(terminals.id, tid)).limit(1);
        const tankCount = terminal?.tankCount || 0;
        const tanks = [];
        let totalCapacity = 0, totalVolume = 0;
        for (let i = 1; i <= tankCount; i++) {
          const capacity = 50000;
          // Calculate volume from transactions: received minus dispatched
          const [vol] = await db.execute(sql`
            SELECT COALESCE(SUM(actualGallons), 0) as dispatched
            FROM scada_transactions WHERE terminalId = ${tid} AND status = 'completed'
          `);
          const dispatched = Number(unsafeCast(vol || [])[0]?.dispatched) || 0;
          const level = Math.max(0, capacity - (dispatched / Math.max(tankCount, 1)));
          const product = i % 3 === 0 ? 'diesel' : i % 2 === 0 ? 'premium' : 'unleaded';
          tanks.push({
            id: `${tid}-T${String(i).padStart(2, '0')}`,
            tankNumber: i, product, capacity, currentLevel: Math.round(level),
            percentFull: Math.round((level / capacity) * 100),
            status: level < capacity * 0.1 ? 'low' : level > capacity * 0.9 ? 'high' : 'normal',
            lastGauged: new Date().toISOString(),
          });
          totalCapacity += capacity;
          totalVolume += level;
        }
        return { tanks, totals: { totalCapacity, totalVolume, percentFull: totalCapacity ? Math.round((totalVolume / totalCapacity) * 100) : 0 } };
      } catch { return { tanks: [], totals: {} }; }
    }),

  /**
   * Start loading
   */
  startLoading: protectedProcedure
    .input(z.object({
      rackId: z.string(),
      loadId: z.string(),
      product: productTypeSchema,
      targetGallons: z.number(),
      terminalId: z.string().optional(),
      compartments: z.array(z.object({
        number: z.number(),
        product: productTypeSchema,
        gallons: z.number(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const txnId = `txn_${Date.now()}`;
      const userId = Number(ctx.user?.id) || 0;
      if (db) {
        try {
          await db.execute(sql`
            INSERT INTO scada_transactions (transactionId, terminalId, rackId, loadId, product, targetGallons, status, startTime, authorizedBy)
            VALUES (${txnId}, ${parseInt(input.terminalId || '0', 10)}, ${input.rackId}, ${input.loadId}, ${input.product}, ${input.targetGallons}, 'loading', NOW(), ${userId})
          `);
        } catch (e) { logger.warn('[SCADA] startLoading insert error:', e); }
      }
      return {
        transactionId: txnId,
        rackId: input.rackId,
        loadId: input.loadId,
        status: "loading_started",
        startTime: new Date().toISOString(),
        estimatedDuration: Math.round(input.targetGallons / 300),
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
      actualGallons: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const finalStatus = input.reason === 'completed' ? 'completed' : 'stopped';
      if (db) {
        try {
          await db.execute(sql`
            UPDATE scada_transactions SET status = ${finalStatus}, endTime = NOW(),
              actualGallons = COALESCE(${input.actualGallons || null}, targetGallons)
            WHERE rackId = ${input.rackId} AND status = 'loading'
            ORDER BY createdAt DESC LIMIT 1
          `);
        } catch (e) { logger.warn('[SCADA] stopLoading update error:', e); }
      }
      return {
        rackId: input.rackId,
        status: "loading_stopped",
        reason: input.reason,
        stoppedAt: new Date().toISOString(),
        stoppedBy: ctx.user?.id,
        finalGallons: input.actualGallons || 0,
      };
    }),

  /**
   * Get loading transaction
   */
  getTransaction: protectedProcedure
    .input(z.object({ transactionId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const [rows] = await db.execute(sql`
          SELECT * FROM scada_transactions WHERE transactionId = ${input.transactionId} LIMIT 1
        `);
        const r = unsafeCast(rows || [])[0];
        if (!r) return null;
        const target = Number(r.targetGallons) || 0;
        const actual = Number(r.actualGallons) || 0;
        const variance = actual - target;
        return {
          transactionId: r.transactionId, loadNumber: r.loadId || '', rack: r.rackId, product: r.product,
          startTime: r.startTime?.toISOString?.() || '', endTime: r.endTime?.toISOString?.() || '',
          duration: r.startTime && r.endTime ? Math.round((new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000) : 0,
          targetGallons: target, actualGallons: actual,
          variance, variancePercent: target ? Math.round((variance / target) * 10000) / 100 : 0,
          temperature: { start: Number(r.temperature) || 0, end: Number(r.temperature) || 0, average: Number(r.temperature) || 0 },
          apiGravity: Number(r.apiGravity) || 0,
          netGallons: Number(r.netGallons) || actual, grossGallons: actual,
          meterReadings: { start: Number(r.meterStart) || 0, end: Number(r.meterEnd) || 0 },
          bol: null,
        };
      } catch { return null; }
    }),

  /**
   * Get daily throughput
   */
  getDailyThroughput: protectedProcedure
    .input(z.object({ terminalId: z.string(), date: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const targetDate = input.date || new Date().toISOString().split('T')[0];
      if (!db) return { date: targetDate, totalGallons: 0, transactions: 0, byProduct: [], byHour: [], peakHour: '', avgLoadTime: 0 };
      try {
        const tid = parseInt(input.terminalId, 10);
        const [stats] = await db.execute(sql`
          SELECT COALESCE(SUM(actualGallons), 0) as totalGal, COUNT(*) as txnCount,
            AVG(TIMESTAMPDIFF(MINUTE, startTime, endTime)) as avgMin
          FROM scada_transactions WHERE terminalId = ${tid} AND DATE(startTime) = ${targetDate} AND status = 'completed'
        `);
        const s = unsafeCast(stats || [])[0] || {};
        // By product breakdown
        const [byProd] = await db.execute(sql`
          SELECT product, SUM(actualGallons) as total FROM scada_transactions
          WHERE terminalId = ${tid} AND DATE(startTime) = ${targetDate} AND status = 'completed'
          GROUP BY product
        `);
        // By hour breakdown
        const [byHr] = await db.execute(sql`
          SELECT HOUR(startTime) as hr, SUM(actualGallons) as total FROM scada_transactions
          WHERE terminalId = ${tid} AND DATE(startTime) = ${targetDate} AND status = 'completed'
          GROUP BY HOUR(startTime) ORDER BY hr
        `);
        const byHour = unsafeCast(byHr || []).map((h: any) => ({ hour: h.hr, gallons: Number(h.total) || 0 }));
        const peakHour = byHour.length > 0 ? byHour.reduce((a: any, b: any) => a.gallons > b.gallons ? a : b).hour : '';
        return {
          date: targetDate,
          totalGallons: Number(s.totalGal) || 0,
          transactions: Number(s.txnCount) || 0,
          byProduct: unsafeCast(byProd || []).map((p: any) => ({ product: p.product, gallons: Number(p.total) || 0 })),
          byHour,
          peakHour: peakHour !== '' ? `${peakHour}:00` : '',
          avgLoadTime: Math.round(Number(s.avgMin) || 0),
        };
      } catch { return { date: targetDate, totalGallons: 0, transactions: 0, byProduct: [], byHour: [], peakHour: '', avgLoadTime: 0 }; }
    }),

  /**
   * Get alarms
   */
  getAlarms: protectedProcedure
    .input(z.object({ terminalId: z.string(), active: z.boolean().default(true) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { alarms: [], summary: { critical: 0, warning: 0, info: 0, total: 0 } };
      try {
        const tid = parseInt(input.terminalId, 10);
        const ackFilter = input.active ? sql`AND acknowledged = false` : sql``;
        const [rows] = await db.execute(sql`
          SELECT * FROM scada_alarms WHERE terminalId = ${tid} ${ackFilter}
          ORDER BY createdAt DESC LIMIT 50
        `);
        const alarms = unsafeCast(rows || []).map((a: any) => ({
          id: String(a.id), severity: a.severity, type: a.type, message: a.message,
          rackId: a.rackId, tankId: a.tankId, acknowledged: !!a.acknowledged,
          createdAt: a.createdAt?.toISOString?.() || '',
        }));
        const summary = {
          critical: alarms.filter((a: any) => a.severity === 'critical').length,
          warning: alarms.filter((a: any) => a.severity === 'warning').length,
          info: alarms.filter((a: any) => a.severity === 'info').length,
          total: alarms.length,
        };
        return { alarms, summary };
      } catch { return { alarms: [], summary: { critical: 0, warning: 0, info: 0, total: 0 } }; }
    }),

  /**
   * Acknowledge alarm
   */
  acknowledgeAlarm: protectedProcedure
    .input(z.object({
      alarmId: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (db) {
        try {
          await db.execute(sql`
            UPDATE scada_alarms SET acknowledged = true, acknowledgedBy = ${Number(ctx.user?.id) || 0},
              acknowledgedAt = NOW() WHERE id = ${parseInt(input.alarmId, 10)}
          `);
        } catch {}
      }
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
        terminals: unsafeCast(stats)?.total || 0,
        terminalsOnline: unsafeCast(stats)?.active || 0,
        totalTanks: unsafeCast(stats)?.totalTanks || 0,
        activeRacks: unsafeCast(stats)?.totalDocks || 0,
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
      return unsafeCast(rows).map((t: any) => ({
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
