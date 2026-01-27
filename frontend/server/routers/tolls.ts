/**
 * TOLLS ROUTER
 * tRPC procedures for toll calculation
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const tollsRouter = router({
  /**
   * Get recent routes for TollCalculator page
   */
  getRecentRoutes: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(5) }))
    .query(async () => {
      return [
        { id: "r1", origin: "Houston, TX", destination: "Dallas, TX", tollCost: 24.50, lastUsed: "2025-01-22" },
        { id: "r2", origin: "Austin, TX", destination: "San Antonio, TX", tollCost: 8.75, lastUsed: "2025-01-20" },
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
        distance: 240,
        tollCost: 24.50,
        tollPlazas: [
          { name: "Hardy Toll Road", cost: 8.50 },
          { name: "SH 130", cost: 12.00 },
          { name: "NTTA", cost: 4.00 },
        ],
        estimatedTime: "3h 45m", totalTolls: 24.50, tollBreakdown: [{ name: "Hardy Toll Road", cost: 8.50 }, { name: "SH 130", cost: 12.00 }, { name: "NTTA", cost: 4.00 }],
      };
    }),
});
