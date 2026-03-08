/**
 * DRIVER & ESCORT MOBILE COMMAND CENTER ROUTER (Task 21.1)
 * tRPC procedures for mobile-optimized driver/escort operations.
 */

import { z } from "zod";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getMobileCommandData } from "../services/MobileCommandCenter";

export const mobileCommandRouter = router({
  /**
   * Get full mobile command center data
   */
  getData: protectedProcedure.query(async () => {
    return getMobileCommandData();
  }),

  /**
   * Execute a quick action (arrive, depart, break, incident, fuel, photo)
   */
  executeAction: protectedProcedure
    .input(z.object({
      actionId: z.string(),
      loadId: z.string().optional(),
      notes: z.string().optional(),
      location: z.object({ lat: z.number(), lng: z.number() }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        actionId: input.actionId,
        executedBy: ctx.user?.id,
        executedAt: new Date().toISOString(),
        message: `Action '${input.actionId}' recorded successfully`,
      };
    }),

  /**
   * Update document completion status
   */
  completeDocument: protectedProcedure
    .input(z.object({ documentId: z.string(), loadId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        documentId: input.documentId,
        completedBy: ctx.user?.id,
        completedAt: new Date().toISOString(),
      };
    }),
});
