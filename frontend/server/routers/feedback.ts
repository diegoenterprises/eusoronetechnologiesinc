/**
 * FEEDBACK ROUTER
 * tRPC procedures for user feedback management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const feedbackRouter = router({
  list: protectedProcedure.input(z.object({ status: z.string().optional(), rating: z.number().optional(), limit: z.number().optional() }).optional()).query(async () => [
    { id: "f1", type: "suggestion", subject: "Add dark mode", status: "open", createdAt: "2025-01-22", rating: 4 },
  ]),

  getSummary: protectedProcedure.query(async () => ({ total: 45, open: 12, resolved: 33, avgResponseTime: 24, avgRating: 4.5, totalReviews: 125, positiveRate: 92, nps: 72 })),

  respond: protectedProcedure.input(z.object({ feedbackId: z.string(), response: z.string() })).mutation(async ({ input }) => ({
    success: true, feedbackId: input.feedbackId,
  })),
});
