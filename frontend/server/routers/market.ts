/**
 * MARKET ROUTER
 * tRPC procedures for market intelligence and rates
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const marketRouter = router({
  /**
   * Get market intelligence for MarketIntelligence page
   */
  getIntelligence: protectedProcedure
    .input(z.object({ region: z.string().optional(), timeframe: z.string().optional() }))
    .query(async () => {
      return {
        avgRate: 3.45,
        rateChange: 2.5,
        volume: 45000,
        volumeChange: 8.2,
        capacityIndex: 72,
        demandIndex: 85,
      };
    }),

  /**
   * Get market trends
   */
  getTrends: protectedProcedure
    .input(z.object({ region: z.string().optional(), timeframe: z.string().optional() }))
    .query(async () => {
      return [
        { date: "2025-01-20", rate: 3.35, volume: 42000 },
        { date: "2025-01-21", rate: 3.40, volume: 43500 },
        { date: "2025-01-22", rate: 3.42, volume: 44200 },
        { date: "2025-01-23", rate: 3.45, volume: 45000 },
      ];
    }),

  /**
   * Get hot lanes
   */
  getHotLanes: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async () => {
      return [
        { origin: "Houston, TX", destination: "Dallas, TX", rate: 3.65, demand: "high", change: 5.2 },
        { origin: "Los Angeles, CA", destination: "Phoenix, AZ", rate: 3.45, demand: "high", change: 3.8 },
        { origin: "Chicago, IL", destination: "Detroit, MI", rate: 3.25, demand: "medium", change: 1.5 },
      ];
    }),

  /**
   * Get capacity by region
   */
  getCapacity: protectedProcedure
    .input(z.object({ region: z.string().optional() }))
    .query(async () => {
      return {
        available: 1250,
        inUse: 3450,
        utilization: 73,
        trend: "up",
      };
    }),
});
