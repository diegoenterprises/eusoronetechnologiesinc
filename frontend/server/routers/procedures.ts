/**
 * PROCEDURES ROUTER
 * tRPC procedures for standard operating procedures
 */

import { z } from "zod";
import { sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

export const proceduresRouter = router({
  getAll: protectedProcedure.input(z.object({ category: z.string().optional() })).query(async () => [
    { id: "p1", title: "Pre-Trip Inspection", category: "safety", version: "2.1" },
  ]),

  getChecklists: protectedProcedure.query(async () => [
    { id: "c1", name: "Daily Pre-Trip", items: 25, category: "safety" },
  ]),
});
