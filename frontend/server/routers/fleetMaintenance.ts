/**
 * FLEET MAINTENANCE ROUTER (GAP-101)
 * tRPC procedures for predictive maintenance analytics.
 * Exposes vehicle-level and fleet-level failure predictions.
 */

import { z } from "zod";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import {
  getVehiclePredictions,
  getFleetPredictions,
  getFleetMaintenanceSummary,
} from "../services/MaintenanceAnalytics";

export const fleetMaintenanceRouter = router({
  /**
   * Get predicted maintenance for a single vehicle.
   * Returns component-level failure predictions (engine, transmission, brakes, suspension, electrical).
   */
  getVehiclePrediction: protectedProcedure
    .input(z.object({ vehicleId: z.number() }))
    .query(async ({ input }) => {
      const result = await getVehiclePredictions(input.vehicleId);
      return result;
    }),

  /**
   * Get predicted maintenance for all vehicles in the fleet.
   * Optional riskFilter: 'critical' | 'high' | 'medium' | 'low' | 'all'
   */
  getFleetPredictions: protectedProcedure
    .input(z.object({
      riskFilter: z.enum(["critical", "high", "medium", "low", "all"]).optional().default("all"),
      limit: z.number().optional().default(100),
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.user?.companyId || 0;
      return getFleetPredictions(companyId, {
        riskFilter: input.riskFilter,
        limit: input.limit,
      });
    }),

  /**
   * Get fleet-wide maintenance summary with risk breakdown and component analysis.
   */
  getFleetSummary: protectedProcedure.query(async ({ ctx }) => {
    const companyId = ctx.user?.companyId || 0;
    return getFleetMaintenanceSummary(companyId);
  }),

  /**
   * Get maintenance alerts — vehicles with critical/high risk predictions.
   * Returns actionable alerts sorted by urgency.
   */
  getMaintenanceAlerts: protectedProcedure
    .input(z.object({
      severity: z.enum(["critical", "high", "all"]).optional().default("all"),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.user?.companyId || 0;
      const predictions = await getFleetPredictions(companyId, { limit: input.limit });

      const alerts: Array<{
        id: string;
        vehicleId: number;
        vehicleUnit: string;
        component: string;
        riskLevel: string;
        milesRemaining: number;
        daysRemaining: number;
        predictedFailureDate: string;
        confidenceScore: number;
        message: string;
        severity: "critical" | "high";
        createdAt: string;
      }> = [];

      for (const v of predictions) {
        for (const p of v.predictions) {
          if (p.riskLevel !== "critical" && p.riskLevel !== "high") continue;
          if (input.severity !== "all" && p.riskLevel !== input.severity) continue;

          const milesRemaining = Math.max(0, p.predictedFailureMileage - v.currentMileage);
          const daysRemaining = Math.max(0, Math.round(
            (new Date(p.predictedFailureDate).getTime() - Date.now()) / 86400000
          ));

          alerts.push({
            id: `maint_alert_${v.vehicleId}_${p.component}`,
            vehicleId: v.vehicleId,
            vehicleUnit: v.vehicleUnit,
            component: p.component,
            riskLevel: p.riskLevel,
            milesRemaining,
            daysRemaining,
            predictedFailureDate: p.predictedFailureDate,
            confidenceScore: p.confidenceScore,
            message: daysRemaining <= 0
              ? `${p.component} failure OVERDUE on ${v.vehicleUnit} — schedule service immediately`
              : `${p.component} predicted to need service in ${daysRemaining}d / ${milesRemaining.toLocaleString()} mi on ${v.vehicleUnit}`,
            severity: p.riskLevel as "critical" | "high",
            createdAt: new Date().toISOString(),
          });
        }
      }

      // Sort: critical first, then by days remaining ascending
      alerts.sort((a, b) => {
        if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1;
        return a.daysRemaining - b.daysRemaining;
      });

      return alerts.slice(0, input.limit);
    }),

  /**
   * Get alert counts for badge display.
   */
  getAlertCounts: protectedProcedure.query(async ({ ctx }) => {
    const companyId = ctx.user?.companyId || 0;
    const predictions = await getFleetPredictions(companyId);
    let critical = 0;
    let high = 0;
    for (const v of predictions) {
      for (const p of v.predictions) {
        if (p.riskLevel === "critical") critical++;
        else if (p.riskLevel === "high") high++;
      }
    }
    return { critical, high, total: critical + high };
  }),
});
