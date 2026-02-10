/**
 * QUICK ACTIONS ROUTER
 * tRPC procedures for quick action shortcuts
 */

import { z } from "zod";
import { sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

export const quickActionsRouter = router({
  list: protectedProcedure.query(async () => []),

  getFavorites: protectedProcedure.query(async () => []),

  getRecent: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async () => []),
});
