/**
 * HELP ROUTER
 * tRPC procedures for help center and documentation
 */

import { z } from "zod";
import { sql } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

export const helpRouter = router({
  getCategories: publicProcedure.query(async () => []),

  getArticles: publicProcedure.input(z.object({ categoryId: z.string().optional(), search: z.string().optional() })).query(async () => []),

  getStats: protectedProcedure.query(async () => ({ totalArticles: 0, categories: 0, recentSearches: [], articles: 0, guides: 0, videos: 0, faqs: 0 })),
});
