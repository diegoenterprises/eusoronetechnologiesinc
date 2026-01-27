/**
 * ROUTING ROUTER
 * tRPC procedures for route planning and optimization
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const routingRouter = router({
  /**
   * Calculate route for RoutePlanning page
   */
  calculateRoute: protectedProcedure
    .input(z.object({
      origin: z.string(),
      destination: z.string(),
      stops: z.array(z.string()).optional(),
    }))
    .query(async ({ input }) => {
      return {
        distance: 285.4,
        duration: "4h 30m",
        fuelEstimate: 46.2,
        tollCost: 12.50,
        fuelCost: 168.63,
        segments: [
          { from: input.origin, to: input.destination, distance: 285.4, duration: "4h 30m" },
        ],
        warnings: [],
        fuelStops: [
          { name: "Pilot Travel Center", location: "Waco, TX", distance: 180, price: 3.65 },
        ],
      };
    }),

  /**
   * Get saved routes for RoutePlanning page
   */
  getSavedRoutes: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async () => {
      return [
        { id: "r1", name: "Houston to Dallas", origin: "Houston, TX", destination: "Dallas, TX", distance: 240, savedAt: "2025-01-20" },
        { id: "r2", name: "Austin Loop", origin: "Austin, TX", destination: "Austin, TX", distance: 85, savedAt: "2025-01-18" },
      ];
    }),

  /**
   * Save route mutation
   */
  saveRoute: protectedProcedure
    .input(z.object({ name: z.string(), origin: z.string(), destination: z.string(), stops: z.array(z.string()).optional() }))
    .mutation(async ({ input }) => {
      return { success: true, routeId: `route_${Date.now()}`, name: input.name };
    }),
});
