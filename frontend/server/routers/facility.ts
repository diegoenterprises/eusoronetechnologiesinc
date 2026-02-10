/**
 * FACILITY ROUTER
 * tRPC procedures for facility management
 */

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { terminals, loads } from "../../drizzle/schema";

export const facilityRouter = router({
  getStats: protectedProcedure.query(async () => ({ totalBays: 0, availableBays: 0, todayShipments: 0, staffOnDuty: 0 })),

  getBays: protectedProcedure.query(async () => []),

  getShipments: protectedProcedure.input(z.object({ status: z.string().optional() })).query(async () => []),

  getStaff: protectedProcedure.query(async () => []),
});
