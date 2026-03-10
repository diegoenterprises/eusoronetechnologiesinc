/**
 * REAL-TIME TANK LEVEL MONITORING ROUTER (GAP-310)
 * tRPC procedures for tank readings, alerts, trends, forecasts, and terminal summaries.
 */

import { z } from "zod";
import { eq, sql, and } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { terminals } from "../../drizzle/schema";
import {
  generateTankReading,
  generateTankAlerts,
  generateTankTrend,
  generateTankForecast,
  generateTerminalSummary,
} from "../services/TankLevelMonitor";
import { unsafeCast } from "../_core/types/unsafe";

export const tankMonitorRouter = router({
  /**
   * Get real-time tank readings for a terminal
   */
  getTankReadings: protectedProcedure
    .input(z.object({
      terminalId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { readings: [], summary: null };
      try {
        const [terminal] = await db.select().from(terminals)
          .where(eq(terminals.id, input.terminalId)).limit(1);
        if (!terminal) return { readings: [], summary: null };

        const tankCount = terminal.tankCount || 0;
        if (tankCount === 0) return { readings: [], summary: null };

        // Get dispatched gallons from SCADA transactions for level calculation
        let dispatchedGallons = 0;
        try {
          const [vol] = await db.execute(sql`
            SELECT COALESCE(SUM(actualGallons), 0) as dispatched
            FROM scada_transactions WHERE terminalId = ${input.terminalId} AND status = 'completed'
          `);
          dispatchedGallons = Number(unsafeCast(vol || [])[0]?.dispatched) || 0;
        } catch { /* scada_transactions may not exist */ }

        const readings = [];
        for (let i = 1; i <= tankCount; i++) {
          readings.push(generateTankReading(
            input.terminalId,
            terminal.name,
            i,
            terminal.productsHandled || null,
            dispatchedGallons,
            tankCount,
          ));
        }

        const summary = generateTerminalSummary(input.terminalId, terminal.name, readings);
        return { readings, summary };
      } catch (e) {
        logger.error("[TankMonitor] getTankReadings error:", e);
        return { readings: [], summary: null };
      }
    }),

  /**
   * Get tank alerts across terminals
   */
  getTankAlerts: protectedProcedure
    .input(z.object({
      terminalId: z.number().optional(),
      severityFilter: z.enum(["all", "emergency", "critical", "warning", "info"]).default("all"),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const companyId = ctx.user!.companyId;
        let terminalRows: any[] = [];

        if (input.terminalId) {
          terminalRows = await db.select().from(terminals)
            .where(eq(terminals.id, input.terminalId)).limit(1);
        } else if (companyId) {
          terminalRows = await db.select().from(terminals)
            .where(eq(terminals.companyId, companyId)).limit(20);
        } else {
          terminalRows = await db.select().from(terminals)
            .where(eq(terminals.status, "active")).limit(20);
        }

        const allAlerts: any[] = [];
        for (const t of terminalRows) {
          const tankCount = t.tankCount || 0;
          const readings = [];
          for (let i = 1; i <= tankCount; i++) {
            readings.push(generateTankReading(t.id, t.name, i, t.productsHandled, 0, tankCount));
          }
          const alerts = generateTankAlerts(readings);
          allAlerts.push(...alerts);
        }

        if (input.severityFilter !== "all") {
          return allAlerts.filter(a => a.severity === input.severityFilter);
        }
        return allAlerts;
      } catch (e) {
        logger.error("[TankMonitor] getTankAlerts error:", e);
        return [];
      }
    }),

  /**
   * Get historical trend for a specific tank
   */
  getTankTrend: protectedProcedure
    .input(z.object({
      terminalId: z.number(),
      tankNumber: z.number(),
      hours: z.number().min(1).max(720).default(24),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const [terminal] = await db.select().from(terminals)
          .where(eq(terminals.id, input.terminalId)).limit(1);
        if (!terminal) return null;

        const reading = generateTankReading(
          input.terminalId, terminal.name, input.tankNumber,
          terminal.productsHandled, 0, terminal.tankCount || 1,
        );
        const trend = generateTankTrend(reading, input.hours);

        return { reading, trend };
      } catch (e) {
        logger.error("[TankMonitor] getTankTrend error:", e);
        return null;
      }
    }),

  /**
   * Get demand forecast for a terminal's tanks
   */
  getTankForecasts: protectedProcedure
    .input(z.object({
      terminalId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const [terminal] = await db.select().from(terminals)
          .where(eq(terminals.id, input.terminalId)).limit(1);
        if (!terminal) return [];

        const tankCount = terminal.tankCount || 0;
        const forecasts = [];
        for (let i = 1; i <= tankCount; i++) {
          const reading = generateTankReading(
            input.terminalId, terminal.name, i,
            terminal.productsHandled, 0, tankCount,
          );
          forecasts.push(generateTankForecast(reading));
        }

        return forecasts;
      } catch (e) {
        logger.error("[TankMonitor] getTankForecasts error:", e);
        return [];
      }
    }),

  /**
   * Get multi-terminal dashboard overview
   */
  getMultiTerminalOverview: protectedProcedure
    .input(z.object({
      terminalIds: z.array(z.number()).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { terminals: [], totals: { totalTanks: 0, totalCapacity: 0, totalInventory: 0, overallUtilization: 0, alerts: { critical: 0, warning: 0, info: 0 } } };
      try {
        const companyId = ctx.user!.companyId;
        let terminalRows: any[] = [];

        if (input?.terminalIds && input.terminalIds.length > 0) {
          for (const tid of input.terminalIds) {
            const [t] = await db.select().from(terminals).where(eq(terminals.id, tid)).limit(1);
            if (t) terminalRows.push(t);
          }
        } else if (companyId) {
          terminalRows = await db.select().from(terminals)
            .where(and(eq(terminals.companyId, companyId), eq(terminals.status, "active"))).limit(20);
        } else {
          terminalRows = await db.select().from(terminals)
            .where(eq(terminals.status, "active")).limit(20);
        }

        const terminalSummaries = [];
        let totalTanks = 0, totalCap = 0, totalInv = 0;
        const totalAlerts = { critical: 0, warning: 0, info: 0 };

        for (const t of terminalRows) {
          const tankCount = t.tankCount || 0;
          const readings = [];
          for (let i = 1; i <= tankCount; i++) {
            readings.push(generateTankReading(t.id, t.name, i, t.productsHandled, 0, tankCount));
          }
          const summary = generateTerminalSummary(t.id, t.name, readings);
          terminalSummaries.push(summary);

          totalTanks += summary.totalTanks;
          totalCap += summary.totalCapacity;
          totalInv += summary.totalInventory;
          totalAlerts.critical += summary.alerts.critical;
          totalAlerts.warning += summary.alerts.warning;
          totalAlerts.info += summary.alerts.info;
        }

        return {
          terminals: terminalSummaries,
          totals: {
            totalTanks,
            totalCapacity: totalCap,
            totalInventory: totalInv,
            overallUtilization: totalCap > 0 ? Math.round((totalInv / totalCap) * 100) : 0,
            alerts: totalAlerts,
          },
        };
      } catch (e) {
        logger.error("[TankMonitor] getMultiTerminalOverview error:", e);
        return { terminals: [], totals: { totalTanks: 0, totalCapacity: 0, totalInventory: 0, overallUtilization: 0, alerts: { critical: 0, warning: 0, info: 0 } } };
      }
    }),
});
