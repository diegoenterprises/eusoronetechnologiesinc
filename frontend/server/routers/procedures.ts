/**
 * PROCEDURES ROUTER
 * tRPC procedures for standard operating procedures
 */

import { z } from "zod";
import { sql } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

export const proceduresRouter = router({
  getAll: protectedProcedure.input(z.object({ category: z.string().optional() })).query(async () => []),

  getChecklists: protectedProcedure.query(async () => []),
});
