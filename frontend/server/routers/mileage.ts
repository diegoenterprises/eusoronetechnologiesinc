/**
 * MILEAGE ROUTER
 * tRPC procedures for mileage tracking and calculation
 */

import { z } from "zod";
import { sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

export const mileageRouter = router({
  calculate: protectedProcedure.input(z.object({ origin: z.string().optional(), destination: z.string().optional(), stops: z.array(z.string()).optional() })).mutation(async ({ input }) => ({
    origin: input.origin,
    destination: input.destination,
    miles: 0, totalMiles: 0, estimatedTime: "", estimatedFuel: 0, legs: [],
  })),

  getRecent: protectedProcedure.input(z.object({ limit: z.number().optional() })).query(async () => []),
});
