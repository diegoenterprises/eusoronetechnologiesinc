/**
 * REST STOPS ROUTER
 * tRPC procedures for rest stop information
 */

import { z } from "zod";
import { sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

export const restStopsRouter = router({
  list: protectedProcedure.input(z.object({ route: z.string().optional(), limit: z.number().optional() }).optional()).query(async () => [
    { id: "rs1", name: "Texas Rest Area I-45", mile: 125, amenities: ["restrooms", "parking", "wifi"] },
  ]),

  getNearby: protectedProcedure.input(z.object({ lat: z.number().optional(), lng: z.number().optional(), limit: z.number().optional() })).query(async () => [
    { id: "rs1", name: "Pilot Flying J", distance: 5.2, parking: 50 },
  ]),
});
