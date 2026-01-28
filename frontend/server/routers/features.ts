/**
 * FEATURES ROUTER
 * tRPC procedures for feature requests management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const featuresRouter = router({
  /**
   * List feature requests for FeatureRequests page
   */
  list: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(50) }))
    .query(async () => {
      return [
        { id: "f1", title: "Mobile app dark mode", status: "under_review", votes: 45, createdAt: "2025-01-15", category: "mobile" },
        { id: "f2", title: "Bulk load import", status: "planned", votes: 32, createdAt: "2025-01-10", category: "loads" },
        { id: "f3", title: "Driver chat feature", status: "in_progress", votes: 28, createdAt: "2025-01-05", category: "communication" },
      ];
    }),

  /**
   * Get feature summary for FeatureRequests page
   */
  getSummary: protectedProcedure
    .query(async () => {
      return { total: 45, underReview: 12, planned: 8, inProgress: 5, completed: 20, totalVotes: 256 };
    }),

  /**
   * Submit feature request mutation
   */
  submit: protectedProcedure
    .input(z.object({ title: z.string(), description: z.string(), category: z.string().optional() }))
    .mutation(async ({ input }) => {
      return { success: true, featureId: `feat_${Date.now()}`, title: input.title };
    }),

  /**
   * Vote for feature mutation
   */
  vote: protectedProcedure
    .input(z.object({ featureId: z.string(), requestId: z.string().optional() }))
    .mutation(async ({ input }) => {
      return { success: true, featureId: input.featureId, voted: true };
    }),
});
