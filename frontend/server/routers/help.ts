/**
 * HELP ROUTER
 * tRPC procedures for help center and documentation
 */

import { z } from "zod";
import { sql } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

export const helpRouter = router({
  // No help_categories table exists yet
  getCategories: publicProcedure.query(async () => []),

  // No help_articles table exists yet
  getArticles: publicProcedure.input(z.object({ categoryId: z.string().optional(), search: z.string().optional() })).query(async () => []),

  // No help content tables exist yet — all counts are derived
  getStats: protectedProcedure.query(async () => ({ totalArticles: 0, categories: 0, recentSearches: [] as string[], articles: 0, guides: 0, videos: 0, faqs: 0 })),
});
