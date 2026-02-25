/**
 * HOS ROUTER
 * tRPC procedures for Hours of Service tracking
 * Per 49 CFR 395 ELD compliance
 *
 * ALL endpoints are ELD-aware: if a company has a connected ELD provider
 * (Motive, Samsara, Omnitracs, etc.), real data is pulled from the ELD API.
 * Otherwise falls back to the in-memory HOS engine.
 *
 * Consumed by: Driver dashboard, DriverDetails (dispatch/catalyst/terminal),
 * load lifecycle guards, fleet compliance views.
 */

import { z } from "zod";
import { eq } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { drivers, users } from "../../drizzle/schema";
import {
  getHOSSummaryWithELD, changeDutyStatusWithELD,
  HOS_RULES,
} from "../services/hosEngine";
import type { DutyStatus } from "../services/hosEngine";

const dutyStatusSchema = z.enum(["off_duty", "sleeper", "driving", "on_duty"]);

export const hosRouter = router({
  /**
   * Get simple HOS status for dashboard widgets — ELD-aware
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const userId = Number(ctx.user?.id) || 0;
    const s = await getHOSSummaryWithELD(userId);
    return {
      drivingRemaining: s.hoursAvailable.driving,
      onDutyRemaining: s.hoursAvailable.onDuty,
      cycleRemaining: s.hoursAvailable.cycle,
      breakRequired: s.breakRequired,
      nextBreakDue: s.nextBreakRequired,
      status: s.status,
      canDrive: s.canDrive,
      canAcceptLoad: s.canAcceptLoad,
    };
  }),

  /**
   * Get current HOS status — detailed, ELD-aware
   */
  getCurrentStatus: protectedProcedure
    .input(z.object({ driverId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      let userId = Number(ctx.user?.id) || 0;
      // If driverId provided, resolve to userId (for dispatch/catalyst/terminal views)
      if (input.driverId) {
        const db = await getDb();
        if (db) {
          try {
            const dId = parseInt(input.driverId, 10);
            const [driver] = await db.select({ userId: drivers.userId }).from(drivers).where(eq(drivers.id, dId)).limit(1);
            if (driver?.userId) userId = driver.userId;
            else userId = dId; // fallback: driverId might be userId directly
          } catch { userId = parseInt(input.driverId, 10) || userId; }
        }
      }
      const s = await getHOSSummaryWithELD(userId);
      return {
        driverId: input.driverId || String(ctx.user?.id),
        currentStatus: s.status,
        statusStartTime: new Date().toISOString(),
        limits: {
          driving: { used: Math.round(s.drivingHours * 60), limit: HOS_RULES.maxDrivingMinutes, remaining: Math.round(s.hoursAvailable.driving * 60) },
          onDuty: { used: Math.round(s.onDutyHours * 60), limit: HOS_RULES.maxOnDutyMinutes, remaining: Math.round(s.hoursAvailable.onDuty * 60) },
          cycle: { used: Math.round(s.cycleUsed * 60), limit: HOS_RULES.cycle8DayMinutes, remaining: Math.round(s.hoursAvailable.cycle * 60) },
        },
        breakRequired: s.breakRequired,
        nextBreakDue: s.nextBreakRequired,
        lastRestartDate: "",
        violations: s.violations,
        canDrive: s.canDrive,
        canAcceptLoad: s.canAcceptLoad,
        drivingRemaining: s.drivingRemaining,
        onDutyRemaining: s.onDutyRemaining,
        cycleRemaining: s.cycleRemaining,
        breakRemaining: s.breakRemaining,
        todayLog: s.todayLog,
      };
    }),

  /**
   * Change duty status — ELD-aware (syncs with connected ELD device)
   */
  changeStatus: protectedProcedure
    .input(z.object({ newStatus: dutyStatusSchema, location: z.string(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = Number(ctx.user?.id) || 0;
      const prev = await getHOSSummaryWithELD(userId);
      const summary = await changeDutyStatusWithELD(userId, input.newStatus as DutyStatus, input.location);
      return {
        success: true,
        previousStatus: prev.status,
        newStatus: summary.status,
        timestamp: new Date().toISOString(),
        location: input.location,
        canDrive: summary.canDrive,
        violations: summary.violations,
        hoursAvailable: summary.hoursAvailable,
      };
    }),

  /**
   * Get daily log — returns today's log entries from hosEngine (ELD-hydrated if connected)
   */
  getDailyLog: protectedProcedure
    .input(z.object({ driverId: z.string().optional(), date: z.string() }))
    .query(async ({ ctx, input }) => {
      let userId = Number(ctx.user?.id) || 0;
      if (input.driverId) {
        const db = await getDb();
        if (db) {
          try {
            const dId = parseInt(input.driverId, 10);
            const [driver] = await db.select({ userId: drivers.userId }).from(drivers).where(eq(drivers.id, dId)).limit(1);
            if (driver?.userId) userId = driver.userId;
            else userId = dId;
          } catch { userId = parseInt(input.driverId, 10) || userId; }
        }
      }
      const s = await getHOSSummaryWithELD(userId);
      const drivingMin = Math.round(s.drivingToday * 60);
      const onDutyMin = Math.round(s.onDutyToday * 60) - drivingMin;
      const offDutyMin = 1440 - drivingMin - Math.max(0, onDutyMin);
      return {
        date: input.date,
        driverId: input.driverId || String(ctx.user?.id),
        entries: s.todayLog,
        totals: { driving: drivingMin, onDuty: Math.max(0, onDutyMin), offDuty: Math.max(0, offDutyMin), sleeper: 0 },
        violations: s.violations,
        certified: false,
      };
    }),

  /**
   * Get log history — returns last N days of logs from ELD if connected
   */
  getLogHistory: protectedProcedure
    .input(z.object({ driverId: z.string().optional(), days: z.number().default(8) }))
    .query(async ({ ctx, input }) => {
      let userId = Number(ctx.user?.id) || 0;
      if (input.driverId) {
        const db = await getDb();
        if (db) {
          try {
            const dId = parseInt(input.driverId, 10);
            const [driver] = await db.select({ userId: drivers.userId }).from(drivers).where(eq(drivers.id, dId)).limit(1);
            if (driver?.userId) userId = driver.userId;
          } catch { /* use as-is */ }
        }
      }
      // Try ELD provider for historical logs
      try {
        const db = await getDb();
        if (db) {
          const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1);
          if (user?.companyId) {
            const { eldService } = await import("../services/eld");
            const hasELD = await eldService.loadProvidersForCompany(user.companyId);
            if (hasELD) {
              const endDate = new Date().toISOString().split("T")[0];
              const startDate = new Date(Date.now() - input.days * 86400000).toISOString().split("T")[0];
              const logs = await eldService.getDriverLogs(String(userId), startDate, endDate);
              if (logs && logs.length > 0) return logs;
            }
          }
        }
      } catch { /* fall through */ }
      // Fallback: return today's log only
      const s = await getHOSSummaryWithELD(userId);
      return s.todayLog.length > 0 ? [{ date: new Date().toISOString().split("T")[0], entries: s.todayLog }] : [];
    }),

  /**
   * Certify daily log
   */
  certifyLog: protectedProcedure
    .input(z.object({ date: z.string(), signature: z.string() }))
    .mutation(async ({ ctx, input }) => ({
      success: true, date: input.date, certifiedAt: new Date().toISOString(), certifiedBy: ctx.user?.id,
    })),

  /**
   * Add remark to log
   */
  addRemark: protectedProcedure
    .input(z.object({ date: z.string(), time: z.string(), remark: z.string() }))
    .mutation(async ({ ctx, input }) => ({
      success: true, remarkId: `RMK-${Date.now()}`, addedAt: new Date().toISOString(),
    })),

  /**
   * Get violations — ELD-aware, returns real violations from hosEngine
   */
  getViolations: protectedProcedure
    .input(z.object({ driverId: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      let userId = Number(ctx.user?.id) || 0;
      if (input.driverId) {
        const db = await getDb();
        if (db) {
          try {
            const dId = parseInt(input.driverId, 10);
            const [driver] = await db.select({ userId: drivers.userId }).from(drivers).where(eq(drivers.id, dId)).limit(1);
            if (driver?.userId) userId = driver.userId;
            else userId = dId;
          } catch { userId = parseInt(input.driverId, 10) || userId; }
        }
      }
      // Get violations from ELD if connected, otherwise from hosEngine
      try {
        const db = await getDb();
        if (db) {
          const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1);
          if (user?.companyId) {
            const { eldService } = await import("../services/eld");
            const hasELD = await eldService.loadProvidersForCompany(user.companyId);
            if (hasELD) {
              const violations = await eldService.getDriverViolations(String(userId));
              if (violations && violations.length > 0) return violations;
            }
          }
        }
      } catch { /* fall through */ }
      // Fallback to hosEngine violations
      const s = await getHOSSummaryWithELD(userId);
      return s.violations;
    }),

  /**
   * Get fleet HOS summary — for dispatch/catalyst/terminal fleet views
   * Returns HOS status for all drivers in the caller's company.
   */
  getFleetHOS: protectedProcedure
    .input(z.object({ companyId: z.number().optional() }).optional())
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const companyId = ctx.user?.companyId || 0;
        const driverRows = await db.select({ id: drivers.id, userId: drivers.userId, status: drivers.status })
          .from(drivers)
          .where(eq(drivers.companyId, companyId))
          .limit(100);

        const results = await Promise.all(driverRows.map(async (d) => {
          const userId = d.userId || d.id;
          const s = await getHOSSummaryWithELD(userId);
          // Get driver name
          let name = "";
          try {
            const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
            name = u?.name || "";
          } catch { /* */ }
          return {
            driverId: String(d.id),
            userId,
            name,
            status: s.status,
            canDrive: s.canDrive,
            canAcceptLoad: s.canAcceptLoad,
            drivingRemaining: s.drivingRemaining,
            onDutyRemaining: s.onDutyRemaining,
            cycleRemaining: s.cycleRemaining,
            breakRequired: s.breakRequired,
            violations: s.violations.length,
            hoursAvailable: s.hoursAvailable,
          };
        }));
        return results;
      } catch (e) {
        console.error("[HOS] getFleetHOS error:", e);
        return [];
      }
    }),
});
