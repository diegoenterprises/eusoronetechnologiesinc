/**
 * SEARCH ROUTER
 * tRPC procedures for global search
 */

import { z } from "zod";
import { eq, like, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loads, drivers, users } from "../../drizzle/schema";

export const searchRouter = router({
  global: protectedProcedure.input(z.object({ query: z.string(), type: z.string().optional(), filters: z.any().optional() }).optional()).query(async ({ input }) => ({
    loads: [{ id: "l1", loadNumber: "LOAD-45920", match: 95 }],
    drivers: [{ id: "d1", name: "Mike Johnson", match: 85 }],
    carriers: [],
    invoices: [],
    total: 2,
    counts: { loads: 1, drivers: 1, carriers: 0, invoices: 0 },
    results: [
      { id: "l1", type: "load", title: "LOAD-45920", subtitle: "Houston to Dallas", match: 95 },
      { id: "d1", type: "driver", title: "Mike Johnson", subtitle: "CDL-A Driver", match: 85 },
    ],
  })),

  getRecent: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async () => [
    { query: "LOAD-45920", type: "load", timestamp: "2025-01-23 10:00" },
  ]),
});
