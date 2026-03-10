/**
 * NEWS ROUTER — REAL-TIME RSS FEED API
 * Cheap polling via cacheStatus, auto-refetch on generation change
 */

import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import * as rssService from "../services/rssService";
import { getDb } from "../db";
import { auditLogs } from "../../drizzle/schema";

const feedCategorySchema = z.enum([
  "all", "chemical", "oil_gas", "bulk", "refrigerated", "logistics",
  "supply_chain", "hazmat", "marine", "energy", "equipment", "trucking", "government",
]);

export const newsRouter = router({
  /**
   * Get articles — returns generation so frontend knows when data changed
   */
  getArticles: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    }))
    .query(async ({ input }) => {
      const result = await rssService.getArticles({
        category: input.category,
        search: input.search,
        limit: input.limit,
        offset: input.offset,
      });
      return {
        articles: result.articles,
        total: result.total,
        lastUpdated: result.lastUpdated,
        generation: result.generation,
      };
    }),

  /**
   * Cheap poll endpoint — frontend calls this every 15s to detect new data.
   * Returns only metadata (no article payloads). If generation changed,
   * frontend refetches getArticles.
   */
  cacheStatus: protectedProcedure.query(() => {
    return rssService.getCacheStatus();
  }),

  /**
   * Trending articles (one per source for variety)
   */
  getTrending: protectedProcedure.query(async () => {
    const articles = await rssService.getTrendingArticles(10);
    return articles.map((a) => ({
      id: a.id,
      title: a.title,
      source: a.source,
      category: a.category,
      publishedAt: a.publishedAt,
      link: a.link,
    }));
  }),

  /**
   * Feed sources with health data
   */
  getFeedSources: protectedProcedure.query(() => {
    return rssService.getAllFeedSources();
  }),

  addFeedSource: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      url: z.string().url(),
      category: feedCategorySchema,
      enabled: z.boolean().default(true),
    }))
    .mutation(({ input }) => rssService.addFeedSource(input)),

  updateFeedSource: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      url: z.string().url().optional(),
      category: feedCategorySchema.optional(),
      enabled: z.boolean().optional(),
    }))
    .mutation(({ input }) => {
      const { id, ...updates } = input;
      return rssService.updateFeedSource(id, updates);
    }),

  deleteFeedSource: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => ({ success: rssService.deleteFeedSource(input.id) })),

  toggleFeedSource: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => rssService.toggleFeedSource(input.id)),

  resetFeedHealth: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => ({ success: rssService.resetFeedHealth(input.id) })),

  /**
   * Force refresh — returns timing + generation
   */
  refreshFeeds: protectedProcedure.mutation(async () => {
    return rssService.refreshCache();
  }),

  /**
   * Feed statistics with health overview
   */
  getFeedStats: protectedProcedure.query(async () => {
    const sources = rssService.getAllFeedSources();
    const result = await rssService.getArticles({ limit: 1000 });
    const status = rssService.getCacheStatus();

    const byCategory: Record<string, number> = {};
    for (const article of result.articles) {
      byCategory[article.category] = (byCategory[article.category] || 0) + 1;
    }

    return {
      totalSources: sources.length,
      enabledSources: sources.filter((s) => s.enabled).length,
      healthyFeeds: status.healthyFeeds,
      unhealthyFeeds: status.unhealthyFeeds,
      totalArticles: result.total,
      lastUpdated: result.lastUpdated,
      generation: status.generation,
      byCategory,
    };
  }),

  /**
   * Save/bookmark an article
   */
  saveArticle: protectedProcedure
    .input(z.object({ articleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!?.id || "anonymous";
      const db = await getDb();
      const now = new Date().toISOString();
      if (db) {
        try {
          // Check if already saved
          const [existing] = await db
            .select({ id: auditLogs.id })
            .from(auditLogs)
            .where(
              and(
                eq(auditLogs.entityType, "saved_article"),
                eq(auditLogs.action, input.articleId),
                sql`JSON_EXTRACT(${auditLogs.metadata}, '$.userId') = ${userId}`,
              )
            )
            .limit(1);
          if (!existing) {
            await db.insert(auditLogs).values({
              action: input.articleId,
              entityType: "saved_article",
              metadata: { userId, articleId: input.articleId, savedAt: now },
              severity: "LOW",
            } as never);
          }
        } catch { /* non-critical */ }
      }
      return { success: true, articleId: input.articleId, savedAt: now };
    }),

  /**
   * Unsave/unbookmark an article
   */
  unsaveArticle: protectedProcedure
    .input(z.object({ articleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user!?.id || "anonymous";
      const db = await getDb();
      if (db) {
        try {
          await db.delete(auditLogs).where(
            and(
              eq(auditLogs.entityType, "saved_article"),
              eq(auditLogs.action, input.articleId),
              sql`JSON_EXTRACT(${auditLogs.metadata}, '$.userId') = ${userId}`,
            )
          );
        } catch { /* non-critical */ }
      }
      return { success: true, articleId: input.articleId };
    }),

  /**
   * Get saved article IDs for current user (lightweight)
   */
  getSavedArticleIds: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user!?.id || "anonymous";
    const db = await getDb();
    if (db) {
      try {
        const rows = await db
          .select({ action: auditLogs.action })
          .from(auditLogs)
          .where(
            and(
              eq(auditLogs.entityType, "saved_article"),
              sql`JSON_EXTRACT(${auditLogs.metadata}, '$.userId') = ${userId}`,
            )
          );
        return { ids: rows.map((r) => r.action) };
      } catch { /* fallback */ }
    }
    return { ids: [] };
  }),

  /**
   * Get full saved articles for current user
   */
  getSavedArticles: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user!?.id || "anonymous";
    const db = await getDb();
    let savedIds: Set<string> = new Set();
    if (db) {
      try {
        const rows = await db
          .select({ action: auditLogs.action })
          .from(auditLogs)
          .where(
            and(
              eq(auditLogs.entityType, "saved_article"),
              sql`JSON_EXTRACT(${auditLogs.metadata}, '$.userId') = ${userId}`,
            )
          );
        savedIds = new Set(rows.map((r) => r.action));
      } catch { /* fallback */ }
    }
    if (savedIds.size === 0) return { articles: [] };
    const result = await rssService.getArticles({ limit: 1000 });
    const saved = result.articles.filter((a) => savedIds.has(a.id));
    return { articles: saved };
  }),
});
