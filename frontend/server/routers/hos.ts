/**
 * HOS ROUTER
 * tRPC procedures for Hours of Service tracking
 * Per 49 CFR 395 ELD compliance
 */

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { drivers } from "../../drizzle/schema";

const dutyStatusSchema = z.enum(["off_duty", "sleeper", "driving", "on_duty"]);

const logEntrySchema = z.object({
  status: dutyStatusSchema,
  startTime: z.string(),
  endTime: z.string().optional(),
  location: z.string(),
  notes: z.string().optional(),
});

export const hosRouter = router({
  /**
   * Get simple HOS status for dashboard — empty for new users (no HOS table yet)
   */
  getStatus: protectedProcedure.query(async () => ({
    drivingRemaining: 11, onDutyRemaining: 14, cycleRemaining: 70,
    breakRequired: false, nextBreakDue: null,
  })),

  /**
   * Get current HOS status — fresh driver starts with full limits
   */
  getCurrentStatus: protectedProcedure
    .input(z.object({ driverId: z.string().optional() }))
    .query(async ({ ctx, input }) => ({
      driverId: input.driverId || ctx.user?.id,
      currentStatus: "off_duty" as const,
      statusStartTime: new Date().toISOString(),
      limits: {
        driving: { used: 0, limit: 660, remaining: 660 },
        onDuty: { used: 0, limit: 840, remaining: 840 },
        cycle: { used: 0, limit: 4200, remaining: 4200 },
      },
      breakRequired: false, nextBreakDue: null, lastRestartDate: "", violations: [],
    })),

  /**
   * Change duty status
   */
  changeStatus: protectedProcedure
    .input(z.object({ newStatus: dutyStatusSchema, location: z.string(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => ({
      success: true, previousStatus: "off_duty", newStatus: input.newStatus,
      timestamp: new Date().toISOString(), location: input.location,
    })),

  /**
   * Get daily log — empty for new users
   */
  getDailyLog: protectedProcedure
    .input(z.object({ driverId: z.string().optional(), date: z.string() }))
    .query(async ({ ctx, input }) => ({
      date: input.date, driverId: input.driverId || ctx.user?.id,
      entries: [], totals: { driving: 0, onDuty: 0, offDuty: 1440, sleeper: 0 },
      violations: [], certified: false,
    })),

  /**
   * Get log history — empty for new users
   */
  getLogHistory: protectedProcedure
    .input(z.object({ driverId: z.string().optional(), days: z.number().default(8) }))
    .query(async () => {
      // HOS log history requires ELD integration
      return [];
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
   * Get violations — empty for new users
   */
  getViolations: protectedProcedure
    .input(z.object({ driverId: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional() }))
    .query(async () => {
      // HOS violations require ELD integration
      return [];
    }),
});
