/**
 * SEARCH ROUTER
 * tRPC procedures for global search
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const searchRouter = router({
  global: protectedProcedure.input(z.object({ query: z.string() })).query(async ({ input }) => ({
    loads: [{ id: "l1", loadNumber: "LOAD-45920", match: 95 }],
    drivers: [{ id: "d1", name: "Mike Johnson", match: 85 }],
    carriers: [],
  })),

  getRecent: protectedProcedure.query(async () => [
    { query: "LOAD-45920", type: "load", timestamp: "2025-01-23 10:00" },
  ]),
});
