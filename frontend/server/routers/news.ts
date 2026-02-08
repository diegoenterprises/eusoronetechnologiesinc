/**
 * NEWS ROUTER — REAL-TIME RSS FEED API
 * Cheap polling via cacheStatus, auto-refetch on generation change
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as rssService from "../services/rssService";

const feedCategorySchema = z.enum([
  "all", "chemical", "oil_gas", "bulk", "refrigerated", "logistics",
  "supply_chain", "hazmat", "marine", "energy", "equipment",
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
});
