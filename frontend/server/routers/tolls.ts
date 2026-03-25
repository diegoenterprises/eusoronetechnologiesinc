/**
 * TOLLS ROUTER
 * tRPC procedures for toll calculation
 */

import { z } from "zod";
import { sql } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

export const tollsRouter = router({
  /**
   * Get recent routes for TollCalculator page
   */
  getRecentRoutes: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(5) }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return [];
        const { loads } = await import("../../drizzle/schema");

        const recentLoads = await db.select({
          id: loads.id,
          pickupLocation: loads.pickupLocation,
          deliveryLocation: loads.deliveryLocation,
          completedAt: loads.actualDeliveryDate,
        })
          .from(loads)
          .where(sql`${loads.status} IN ('delivered', 'complete')`)
          .orderBy(sql`${loads.actualDeliveryDate} DESC`)
          .limit(input.limit);

        return recentLoads.map(l => {
          const p = l.pickupLocation as any;
          const d = l.deliveryLocation as any;
          return {
            id: l.id,
            origin: p ? `${p.city || "Unknown"}, ${p.state || ""}`.trim() : "Unknown",
            destination: d ? `${d.city || "Unknown"}, ${d.state || ""}`.trim() : "Unknown",
            completedAt: l.completedAt?.toISOString() || null,
          };
        });
      } catch {
        return [];
      }
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
      // Requires external toll API integration (e.g. HERE Toll Cost, TollGuru)
      return {
        origin: input.origin,
        destination: input.destination,
        vehicleType: input.vehicleType,
        distance: 0, tollCost: 0, tollPlazas: [],
        estimatedTime: "", totalTolls: 0, tollBreakdown: [],
      };
    }),
});
