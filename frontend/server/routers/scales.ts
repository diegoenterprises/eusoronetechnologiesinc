/**
 * SCALES ROUTER
 * tRPC procedures for weigh station information
 */

import { z } from "zod";
import { sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

export const scalesRouter = router({
  list: protectedProcedure.input(z.object({ state: z.string().optional(), limit: z.number().optional() }).optional()).query(async () => []),

  getNearby: protectedProcedure.input(z.object({ lat: z.number().optional(), lng: z.number().optional(), limit: z.number().optional() })).query(async () => []),
});
