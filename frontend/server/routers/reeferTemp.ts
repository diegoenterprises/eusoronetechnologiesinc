/**
 * REEFER TEMPERATURE ROUTER
 * tRPC procedures for FSMA-compliant reefer temperature monitoring
 * Handles readings, alerts, stats, and manual entries
 * PRODUCTION-READY: All data from database
 */

import { z } from "zod";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { adminProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { reeferReadings, reeferAlerts } from "../../drizzle/schema";

export const reeferTempRouter = router({
  /**
   * Get temperature readings for current driver/load
   */
  getReadings: protectedProcedure
    .input(z.object({
      loadId: z.number().optional(),
      hours: z.number().default(24),
      limit: z.number().default(200),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const userId = Number(ctx.user?.id) || 0;
        const since = new Date(Date.now() - input.hours * 3600000);
        const conds: any[] = [
          eq(reeferReadings.driverId, userId),
          gte(reeferReadings.recordedAt, since),
        ];
        if (input.loadId) conds.push(eq(reeferReadings.loadId, input.loadId));

        const rows = await db.select().from(reeferReadings)
          .where(and(...conds))
          .orderBy(desc(reeferReadings.recordedAt))
          .limit(input.limit);

        return rows.map(r => ({
          id: String(r.id),
          zone: r.zone,
          tempF: r.tempF ? parseFloat(String(r.tempF)) : 0,
          tempC: r.tempC ? parseFloat(String(r.tempC)) : 0,
          status: r.status,
          source: r.source,
          notes: r.notes,
          recordedAt: r.recordedAt?.toISOString() || '',
        }));
      } catch (e) {
        console.error("[ReeferTemp] getReadings error:", e);
        return [];
      }
    }),

  /**
   * Get latest reading per zone
   */
  getLatestByZone: protectedProcedure
    .input(z.object({ loadId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return {};
      try {
        const userId = Number(ctx.user?.id) || 0;
        const zones = ["front", "center", "rear"] as const;
        const result: Record<string, any> = {};

        for (const zone of zones) {
          const conds: any[] = [
            eq(reeferReadings.driverId, userId),
            eq(reeferReadings.zone, zone),
          ];
          if (input?.loadId) conds.push(eq(reeferReadings.loadId, input.loadId));

          const [row] = await db.select().from(reeferReadings)
            .where(and(...conds))
            .orderBy(desc(reeferReadings.recordedAt))
            .limit(1);

          if (row) {
            result[zone] = {
              tempF: row.tempF ? parseFloat(String(row.tempF)) : 0,
              tempC: row.tempC ? parseFloat(String(row.tempC)) : 0,
              status: row.status,
              recordedAt: row.recordedAt?.toISOString() || '',
            };
          }
        }
        return result;
      } catch (e) {
        console.error("[ReeferTemp] getLatestByZone error:", e);
        return {};
      }
    }),

  /**
   * Get session statistics
   */
  getStats: protectedProcedure
    .input(z.object({
      loadId: z.number().optional(),
      hours: z.number().default(24),
      targetMin: z.number().default(33),
      targetMax: z.number().default(40),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const fallback = { min: 0, max: 0, avg: 0, totalReadings: 0, excursions: 0 };
      if (!db) return fallback;
      try {
        const userId = Number(ctx.user?.id) || 0;
        const since = new Date(Date.now() - input.hours * 3600000);
        const conds: any[] = [
          eq(reeferReadings.driverId, userId),
          gte(reeferReadings.recordedAt, since),
        ];
        if (input.loadId) conds.push(eq(reeferReadings.loadId, input.loadId));

        const [stats] = await db.select({
          minTemp: sql<number>`MIN(CAST(${reeferReadings.tempF} AS DECIMAL))`,
          maxTemp: sql<number>`MAX(CAST(${reeferReadings.tempF} AS DECIMAL))`,
          avgTemp: sql<number>`ROUND(AVG(CAST(${reeferReadings.tempF} AS DECIMAL)), 1)`,
          total: sql<number>`COUNT(*)`,
          excursions: sql<number>`SUM(CASE WHEN CAST(${reeferReadings.tempF} AS DECIMAL) > ${input.targetMax} OR CAST(${reeferReadings.tempF} AS DECIMAL) < ${input.targetMin} THEN 1 ELSE 0 END)`,
        }).from(reeferReadings).where(and(...conds));

        return {
          min: stats?.minTemp || 0,
          max: stats?.maxTemp || 0,
          avg: stats?.avgTemp || 0,
          totalReadings: stats?.total || 0,
          excursions: stats?.excursions || 0,
        };
      } catch (e) {
        console.error("[ReeferTemp] getStats error:", e);
        return fallback;
      }
    }),

  /**
   * Get hourly averages for chart
   */
  getHourlyAvgs: protectedProcedure
    .input(z.object({ loadId: z.number().optional(), hours: z.number().default(24) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const userId = Number(ctx.user?.id) || 0;
        const since = new Date(Date.now() - input.hours * 3600000);
        const conds: any[] = [
          eq(reeferReadings.driverId, userId),
          gte(reeferReadings.recordedAt, since),
        ];
        if (input.loadId) conds.push(eq(reeferReadings.loadId, input.loadId));

        const rows = await db.select({
          hour: sql<number>`HOUR(${reeferReadings.recordedAt})`,
          avg: sql<number>`ROUND(AVG(CAST(${reeferReadings.tempF} AS DECIMAL)), 1)`,
        }).from(reeferReadings)
          .where(and(...conds))
          .groupBy(sql`HOUR(${reeferReadings.recordedAt})`)
          .orderBy(sql`HOUR(${reeferReadings.recordedAt})`);

        return rows.map(r => ({ hour: r.hour, avg: r.avg }));
      } catch (e) {
        console.error("[ReeferTemp] getHourlyAvgs error:", e);
        return [];
      }
    }),

  /**
   * Add manual temperature reading
   */
  addReading: protectedProcedure
    .input(z.object({
      tempF: z.number(),
      zone: z.enum(["front", "center", "rear"]),
      loadId: z.number().optional(),
      vehicleId: z.number().optional(),
      targetMin: z.number().default(33),
      targetMax: z.number().default(40),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = Number(ctx.user?.id) || 0;
      const companyId = Number(ctx.user?.companyId) || 0;
      const tempC = Math.round(((input.tempF - 32) * 5 / 9) * 100) / 100;
      const status = input.tempF > input.targetMax ? "critical" : input.tempF > (input.targetMax - 2) ? "warning" : "normal";

      await db.insert(reeferReadings).values({
        driverId: userId,
        companyId,
        loadId: input.loadId || null,
        vehicleId: input.vehicleId || null,
        zone: input.zone,
        tempF: String(input.tempF),
        tempC: String(tempC),
        targetMinF: String(input.targetMin),
        targetMaxF: String(input.targetMax),
        status,
        source: "manual",
        notes: input.notes || null,
      });

      // Auto-create alert if out of range
      if (status === "critical") {
        await db.insert(reeferAlerts).values({
          driverId: userId,
          companyId,
          loadId: input.loadId || null,
          vehicleId: input.vehicleId || null,
          severity: "critical",
          message: `${input.zone.charAt(0).toUpperCase() + input.zone.slice(1)} zone at ${input.tempF}°F — exceeds ${input.targetMax}°F limit`,
          zone: input.zone,
          tempF: String(input.tempF),
        });
      }

      return { success: true, status };
    }),

  /**
   * Get alerts
   */
  getAlerts: protectedProcedure
    .input(z.object({ loadId: z.number().optional(), limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const userId = Number(ctx.user?.id) || 0;
        const conds: any[] = [eq(reeferAlerts.driverId, userId)];
        if (input.loadId) conds.push(eq(reeferAlerts.loadId, input.loadId));

        const rows = await db.select().from(reeferAlerts)
          .where(and(...conds))
          .orderBy(desc(reeferAlerts.createdAt))
          .limit(input.limit);

        return rows.map(a => ({
          id: String(a.id),
          severity: a.severity,
          message: a.message,
          zone: a.zone,
          tempF: a.tempF ? parseFloat(String(a.tempF)) : null,
          acknowledged: a.acknowledged,
          createdAt: a.createdAt?.toISOString() || '',
        }));
      } catch (e) {
        console.error("[ReeferTemp] getAlerts error:", e);
        return [];
      }
    }),

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = Number(ctx.user?.id) || 0;

      await db.update(reeferAlerts).set({
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: userId,
      }).where(and(
        eq(reeferAlerts.id, input.alertId),
        eq(reeferAlerts.driverId, userId),
      ));

      return { success: true };
    }),
});
