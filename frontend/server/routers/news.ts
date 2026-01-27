/**
 * NEWS ROUTER
 * tRPC procedures for news articles (alias for newsfeed)
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const newsRouter = router({
  /**
   * Get articles for NewsFeed page
   */
  getArticles: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().optional().default(20),
    }))
    .query(async ({ input }) => {
      const articles = [
        { id: "news_001", title: "FMCSA Announces New HOS Rules", category: "regulations", author: "EusoTrip", publishedAt: "2025-01-22", readTime: 5, imageUrl: "/images/news/hos-rules.jpg", summary: "New Hours of Service regulations to take effect next month.", source: "FMCSA" },
        { id: "news_002", title: "Fuel Prices Expected to Stabilize", category: "market", author: "Market Watch", publishedAt: "2025-01-21", readTime: 3, imageUrl: "/images/news/fuel-prices.jpg", summary: "Industry analysts predict fuel prices will stabilize in Q2.", source: "Market Watch" },
        { id: "news_003", title: "AI-Powered Load Matching", category: "platform", author: "Product Team", publishedAt: "2025-01-20", readTime: 4, imageUrl: "/images/news/ai-matching.jpg", summary: "EusoTrip launches new AI-powered load matching feature.", source: "EusoTrip" },
        { id: "news_004", title: "Winter Driving Safety Tips", category: "safety", author: "Safety Team", publishedAt: "2025-01-19", readTime: 6, imageUrl: "/images/news/winter-safety.jpg", summary: "Essential tips for safe winter driving conditions.", source: "Safety Team" },
      ];
      let filtered = articles;
      if (input.category) filtered = filtered.filter(a => a.category === input.category);
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(a => a.title.toLowerCase().includes(q));
      }
      return filtered;
    }),

  /**
   * Get trending articles
   */
  getTrending: protectedProcedure
    .query(async () => {
      return [
        { id: "news_001", title: "FMCSA Announces New HOS Rules", views: 1250 },
        { id: "news_003", title: "AI-Powered Load Matching", views: 980 },
        { id: "news_004", title: "Winter Driving Safety Tips", views: 750 },
      ];
    }),
});
