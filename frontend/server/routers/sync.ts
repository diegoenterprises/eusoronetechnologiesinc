import { z } from "zod";
import { isolatedApprovedProcedure as protectedProcedure, router } from "../_core/trpc";
import { syncProcessor } from "../services/sync/sync-processor.service";

// ═══════════════════════════════════════════════════════════════════════════════
// SYNC ROUTER
// Handles offline action batches from the mobile driver app.
// The mobile client queues all actions locally and syncs them here when online.
// ═══════════════════════════════════════════════════════════════════════════════

export const syncRouter = router({
  /**
   * Process a batch of offline actions
   */
  processBatch: protectedProcedure
    .input(z.object({
      actions: z.array(z.object({
        clientId: z.string(),
        type: z.string(),
        payload: z.any(),
        clientTimestamp: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const carrierId = String(ctx.user?.id || '0');
      const driverId = String(ctx.user?.id || '0');

      const result = await syncProcessor.processBatch(
        carrierId,
        driverId,
        input
      );

      return result;
    }),

  /**
   * Get sync status for debugging
   */
  getStatus: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        userId: ctx.user?.id,
        serverTime: new Date().toISOString(),
        status: 'ready',
      };
    }),
});
