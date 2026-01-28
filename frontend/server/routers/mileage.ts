/**
 * MILEAGE ROUTER
 * tRPC procedures for mileage tracking and calculation
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const mileageRouter = router({
  calculate: protectedProcedure.input(z.object({ origin: z.string(), destination: z.string(), stops: z.array(z.string()).optional() })).mutation(async ({ input }) => ({
    origin: input.origin,
    destination: input.destination,
    miles: 240,
    totalMiles: 240,
    estimatedTime: "4h 15m",
    estimatedFuel: 40,
    legs: [
      { from: input.origin, to: input.destination, miles: 240, time: "4h 15m" },
    ],
  })),

  getRecent: protectedProcedure.input(z.object({ limit: z.number().optional() })).query(async () => [
    { id: "m1", route: "Houston to Dallas", miles: 240, date: "2025-01-23" },
  ]),
});
