/**
 * NEWS ROUTER
 * tRPC procedures for real-time RSS news feed
 */

import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import * as rssService from "../services/rssService";

const feedCategorySchema = z.enum([
  "all", "chemical", "oil_gas", "bulk", "refrigerated", "logistics", 
  "supply_chain", "hazmat", "marine", "energy", "equipment"
]);

export const newsRouter = router({
  /**
   * Get articles from RSS feeds
   */
  getArticles: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().optional().default(20),
      offset: z.number().optional().default(0),
    }))
    .query(async ({ input }) => {
      const result = await rssService.getArticles({
        category: input.category,
        search: input.search,
        limit: input.limit,
        offset: input.offset,
      });
      return result.articles;
    }),

  /**
   * Get trending articles
   */
  getTrending: protectedProcedure
    .query(async () => {
      const articles = await rssService.getTrendingArticles(10);
      return articles.map((a, idx) => ({
        id: a.id,
        title: a.title,
        views: Math.floor(Math.random() * 1000) + 500, // Simulated view count
        source: a.source,
      }));
    }),

  /**
   * Get all RSS feed sources (admin)
   */
  getFeedSources: protectedProcedure
    .query(async () => {
      return rssService.getAllFeedSources();
    }),

  /**
   * Add new RSS feed source (admin)
   */
  addFeedSource: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      url: z.string().url(),
      category: feedCategorySchema,
      enabled: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      return rssService.addFeedSource(input);
    }),

  /**
   * Update RSS feed source (admin)
   */
  updateFeedSource: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      url: z.string().url().optional(),
      category: feedCategorySchema.optional(),
      enabled: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      return rssService.updateFeedSource(id, updates);
    }),

  /**
   * Delete RSS feed source (admin)
   */
  deleteFeedSource: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return { success: rssService.deleteFeedSource(input.id) };
    }),

  /**
   * Toggle RSS feed enabled/disabled (admin)
   */
  toggleFeedSource: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return rssService.toggleFeedSource(input.id);
    }),

  /**
   * Force refresh RSS cache
   */
  refreshFeeds: protectedProcedure
    .mutation(async () => {
      return rssService.refreshCache();
    }),

  /**
   * Get feed statistics
   */
  getFeedStats: protectedProcedure
    .query(async () => {
      const sources = rssService.getAllFeedSources();
      const result = await rssService.getArticles({ limit: 1000 });
      
      const byCategory: Record<string, number> = {};
      for (const article of result.articles) {
        byCategory[article.category] = (byCategory[article.category] || 0) + 1;
      }
      
      return {
        totalSources: sources.length,
        enabledSources: sources.filter(s => s.enabled).length,
        totalArticles: result.total,
        lastUpdated: result.lastUpdated,
        byCategory,
      };
    }),
});
