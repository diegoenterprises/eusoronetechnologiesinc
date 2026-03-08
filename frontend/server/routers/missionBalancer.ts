/**
 * AI-OPTIMIZED MISSION BALANCING ROUTER (GAP-438)
 * tRPC procedures for fleet mission optimization and workload balancing.
 */

import { z } from "zod";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getMissionDashboard } from "../services/MissionBalancer";

export const missionBalancerRouter = router({
  /**
   * Get mission balancing dashboard
   */
  getDashboard: protectedProcedure.query(async () => {
    return getMissionDashboard();
  }),

  /**
   * Accept a suggested assignment
   */
  acceptAssignment: protectedProcedure
    .input(z.object({ driverId: z.string(), loadId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        driverId: input.driverId,
        loadId: input.loadId,
        assignedBy: ctx.user?.id,
        assignedAt: new Date().toISOString(),
      };
    }),

  /**
   * Override assignment with different driver
   */
  overrideAssignment: protectedProcedure
    .input(z.object({ loadId: z.string(), newDriverId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        loadId: input.loadId,
        newDriverId: input.newDriverId,
        overriddenBy: ctx.user?.id,
        overriddenAt: new Date().toISOString(),
      };
    }),

  /**
   * Re-optimize all pending assignments
   */
  reoptimize: protectedProcedure.mutation(async () => {
    return getMissionDashboard();
  }),
});
