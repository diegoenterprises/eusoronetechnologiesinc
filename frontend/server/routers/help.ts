/**
 * HELP ROUTER
 * tRPC procedures for help center and documentation
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const helpRouter = router({
  getCategories: publicProcedure.query(async () => [
    { id: "c1", name: "Getting Started", articleCount: 12 },
    { id: "c2", name: "Loads & Dispatch", articleCount: 25 },
  ]),

  getArticles: publicProcedure.input(z.object({ categoryId: z.string().optional(), search: z.string().optional() })).query(async () => [
    { id: "a1", title: "How to create a load", category: "Getting Started", views: 1500 },
  ]),

  getStats: protectedProcedure.query(async () => ({ totalArticles: 150, categories: 12, recentSearches: ["loads", "HOS"] })),
});
