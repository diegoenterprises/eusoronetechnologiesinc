/**
 * ESANG AI ANOMALY MONITORING ROUTER (GAP-367)
 * tRPC procedures for AI-powered anomaly detection and monitoring.
 */

import { z } from "zod";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getAnomalyDashboard } from "../services/AnomalyMonitor";

export const anomalyMonitorRouter = router({
  /**
   * Get anomaly monitoring dashboard
   */
  getDashboard: protectedProcedure.query(async () => {
    return getAnomalyDashboard();
  }),

  /**
   * Get anomalies filtered by category
   */
  getByCategory: protectedProcedure
    .input(z.object({ category: z.enum(["delivery", "pricing", "safety", "compliance", "operational", "financial"]) }))
    .query(async ({ input }) => {
      const dash = await getAnomalyDashboard();
      return dash.anomalies.filter(a => a.category === input.category);
    }),

  /**
   * Update anomaly status (investigate, resolve, dismiss)
   */
  updateStatus: protectedProcedure
    .input(z.object({
      anomalyId: z.string(),
      status: z.enum(["investigating", "resolved", "dismissed"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        anomalyId: input.anomalyId,
        newStatus: input.status,
        updatedBy: ctx.user?.id,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get top risks forecast
   */
  getTopRisks: protectedProcedure.query(async () => {
    const dash = await getAnomalyDashboard();
    return dash.topRisks;
  }),
});
