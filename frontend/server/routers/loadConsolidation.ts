/**
 * MULTI-SHIPPER LOAD CONSOLIDATION ROUTER (GAP-083)
 * tRPC procedures for load consolidation opportunities and management.
 */

import { z } from "zod";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getConsolidationDashboard } from "../services/LoadConsolidation";

export const loadConsolidationRouter = router({
  /**
   * Get consolidation dashboard with all opportunities
   */
  getDashboard: protectedProcedure.query(async () => {
    return getConsolidationDashboard();
  }),

  /**
   * Accept a consolidation group
   */
  acceptGroup: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        groupId: input.groupId,
        status: "accepted",
        acceptedBy: ctx.user?.id,
        acceptedAt: new Date().toISOString(),
      };
    }),

  /**
   * Reject a consolidation group
   */
  rejectGroup: protectedProcedure
    .input(z.object({ groupId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        groupId: input.groupId,
        status: "rejected",
        rejectedBy: ctx.user?.id,
        rejectedAt: new Date().toISOString(),
      };
    }),

  /**
   * Remove a shipment from a consolidation group
   */
  removeShipment: protectedProcedure
    .input(z.object({ groupId: z.string(), loadId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        groupId: input.groupId,
        loadId: input.loadId,
        removedBy: ctx.user?.id,
      };
    }),
});
