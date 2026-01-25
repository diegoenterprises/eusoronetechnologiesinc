/**
 * ALERTS ROUTER
 * tRPC procedures for system alerts and notifications
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const severitySchema = z.enum(["info", "warning", "critical", "error"]);

export const alertsRouter = router({
  /**
   * List alerts
   */
  list: protectedProcedure
    .input(z.object({
      severity: severitySchema.optional(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ input }) => {
      return [
        {
          id: "alert_001",
          type: "system",
          severity: "warning",
          title: "Driver HOS Approaching Limit",
          message: "Driver Mike Johnson has 2 hours remaining on 11-hour drive time",
          createdAt: new Date().toISOString(),
          acknowledged: false,
          dismissedAt: null,
        },
        {
          id: "alert_002",
          type: "compliance",
          severity: "critical",
          title: "Medical Certificate Expiring",
          message: "3 driver medical certificates expire within 30 days",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          acknowledged: true,
          dismissedAt: null,
        },
        {
          id: "alert_003",
          type: "safety",
          severity: "info",
          title: "CSA Score Updated",
          message: "FMCSA has updated your CSA scores. No alerts detected.",
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          acknowledged: true,
          dismissedAt: null,
        },
      ].filter(a => !input.severity || a.severity === input.severity);
    }),

  /**
   * Get all alerts (alias for list)
   */
  getAll: protectedProcedure
    .input(z.object({
      filter: z.string().optional(),
    }))
    .query(async () => {
      return [
        {
          id: "alert_001",
          type: "system",
          severity: "warning",
          title: "Driver HOS Approaching Limit",
          message: "Driver Mike Johnson has 2 hours remaining on 11-hour drive time",
          createdAt: new Date().toISOString(),
          acknowledged: false,
        },
        {
          id: "alert_002",
          type: "compliance",
          severity: "critical",
          title: "Medical Certificate Expiring",
          message: "3 driver medical certificates expire within 30 days",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          acknowledged: true,
        },
      ];
    }),

  /**
   * Get alerts summary
   */
  getSummary: protectedProcedure
    .query(async () => {
      return {
        total: 12,
        critical: 2,
        warning: 5,
        info: 5,
        unacknowledged: 4,
      };
    }),

  /**
   * Acknowledge an alert
   */
  acknowledge: protectedProcedure
    .input(z.object({
      alertId: z.string(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        alertId: input.alertId,
        acknowledgedAt: new Date().toISOString(),
      };
    }),

  /**
   * Dismiss an alert
   */
  dismiss: protectedProcedure
    .input(z.object({
      alertId: z.string(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        alertId: input.alertId,
        dismissedAt: new Date().toISOString(),
      };
    }),

  /**
   * Dismiss all alerts
   */
  dismissAll: protectedProcedure
    .mutation(async () => {
      return {
        success: true,
        count: 12,
        dismissedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get alert stats
   */
  getStats: protectedProcedure
    .query(async () => {
      return {
        total: 12,
        critical: 2,
        warning: 5,
        info: 5,
        resolvedToday: 3,
      };
    }),
});
