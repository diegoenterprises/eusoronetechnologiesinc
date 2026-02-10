/**
 * REST STOPS ROUTER
 * tRPC procedures for rest stop information
 */

import { z } from "zod";
import { sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

export const restStopsRouter = router({
  list: protectedProcedure.input(z.object({ route: z.string().optional(), limit: z.number().optional() }).optional()).query(async () => []),

  getNearby: protectedProcedure.input(z.object({ lat: z.number().optional(), lng: z.number().optional(), limit: z.number().optional() })).query(async () => []),
});
