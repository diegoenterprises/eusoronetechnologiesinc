/**
 * HOS ROUTER
 * tRPC procedures for Hours of Service tracking
 * Per 49 CFR 395 ELD compliance
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

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
   * Get current HOS status and remaining time
   */
  getCurrentStatus: protectedProcedure
    .input(z.object({ driverId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const driverId = input.driverId || ctx.user?.id;
      
      return {
        driverId,
        currentStatus: "driving" as const,
        statusStartTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        limits: {
          driving: { used: 420, limit: 660, remaining: 240 },
          onDuty: { used: 480, limit: 840, remaining: 360 },
          cycle: { used: 3600, limit: 4200, remaining: 600 },
        },
        breakRequired: false,
        nextBreakDue: null,
        lastRestartDate: "2025-01-17",
        violations: [],
      };
    }),

  /**
   * Change duty status
   */
  changeStatus: protectedProcedure
    .input(z.object({
      newStatus: dutyStatusSchema,
      location: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        previousStatus: "on_duty",
        newStatus: input.newStatus,
        timestamp: new Date().toISOString(),
        location: input.location,
      };
    }),

  /**
   * Get daily log for a specific date
   */
  getDailyLog: protectedProcedure
    .input(z.object({
      driverId: z.string().optional(),
      date: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return {
        date: input.date,
        driverId: input.driverId || ctx.user?.id,
        entries: [
          { id: "e1", status: "off_duty", startTime: "00:00", endTime: "06:00", duration: 360, location: "Houston, TX" },
          { id: "e2", status: "on_duty", startTime: "06:00", endTime: "06:30", duration: 30, location: "Houston, TX", notes: "Pre-trip inspection" },
          { id: "e3", status: "driving", startTime: "06:30", endTime: "10:30", duration: 240, location: "En route to Dallas" },
          { id: "e4", status: "on_duty", startTime: "10:30", endTime: "11:00", duration: 30, location: "Rest Area I-45", notes: "30-min break" },
          { id: "e5", status: "driving", startTime: "11:00", endTime: "14:00", duration: 180, location: "En route to Dallas" },
        ],
        totals: {
          driving: 420,
          onDuty: 480,
          offDuty: 360,
          sleeper: 0,
        },
        violations: [],
        certified: false,
      };
    }),

  /**
   * Get log history for past 8 days (for 70-hour cycle)
   */
  getLogHistory: protectedProcedure
    .input(z.object({
      driverId: z.string().optional(),
      days: z.number().default(8),
    }))
    .query(async ({ ctx, input }) => {
      const logs = [];
      const today = new Date();
      
      for (let i = 0; i < input.days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        logs.push({
          date: date.toISOString().split('T')[0],
          totalDriving: i === 0 ? 420 : 480,
          totalOnDuty: i === 0 ? 480 : 540,
          violations: i === 3 ? ["Exceeded 11-hour driving limit"] : [],
          certified: i > 0,
        });
      }
      
      return logs;
    }),

  /**
   * Certify daily log
   */
  certifyLog: protectedProcedure
    .input(z.object({
      date: z.string(),
      signature: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        date: input.date,
        certifiedAt: new Date().toISOString(),
        certifiedBy: ctx.user?.id,
      };
    }),

  /**
   * Add remark to log
   */
  addRemark: protectedProcedure
    .input(z.object({
      date: z.string(),
      time: z.string(),
      remark: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        remarkId: `RMK-${Date.now()}`,
        addedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get violations for a driver
   */
  getViolations: protectedProcedure
    .input(z.object({
      driverId: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return [
        {
          id: "VIO-001",
          date: "2025-01-20",
          type: "driving_limit",
          description: "Exceeded 11-hour driving limit by 15 minutes",
          severity: "minor",
          acknowledged: true,
        },
      ];
    }),
});
