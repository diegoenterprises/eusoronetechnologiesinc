/**
 * TOLLS ROUTER
 * tRPC procedures for toll calculation
 */

import { z } from "zod";
import { sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

export const tollsRouter = router({
  /**
   * Get recent routes for TollCalculator page
   */
  getRecentRoutes: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(5) }))
    .query(async () => {
      return [
      ];
    }),

  /**
   * Calculate tolls mutation
   */
  calculate: protectedProcedure
    .input(z.object({
      origin: z.string(),
      destination: z.string(),
      vehicleType: z.string().optional().default("5_axle"),
    }))
    .mutation(async ({ input }) => {
      return {
        origin: input.origin,
        destination: input.destination,
        vehicleType: input.vehicleType,
        distance: 0, tollCost: 0, tollPlazas: [],
        estimatedTime: "", totalTolls: 0, tollBreakdown: [],
      };
    }),
});
