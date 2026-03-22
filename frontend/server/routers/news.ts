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

  // ═══════════════════════════════════════════════════════════════
  // ESANG MORNING BRIEF — AI-generated daily digest per role
  // ═══════════════════════════════════════════════════════════════
  getMorningBrief: protectedProcedure.query(async ({ ctx }) => {
    const role = ((ctx.user as any)?.role || "SHIPPER").toUpperCase();
    const result = await rssService.getArticles({ limit: 200 });
    const articles = result.articles;

    // Role-priority categories
    const ROLE_CATEGORIES: Record<string, string[]> = {
      SHIPPER: ["oil_gas", "trucking", "chemical", "bulk", "energy"],
      CATALYST: ["trucking", "logistics", "government", "hazmat", "bulk"],
      BROKER: ["trucking", "logistics", "supply_chain", "marine", "rail"],
      DRIVER: ["trucking", "government", "hazmat", "energy"],
      DISPATCH: ["trucking", "logistics", "supply_chain"],
      TERMINAL_MANAGER: ["oil_gas", "chemical", "bulk", "hazmat", "energy"],
      VESSEL_SHIPPER: ["marine", "logistics", "oil_gas"],
      VESSEL_OPERATOR: ["marine", "oil_gas", "government"],
      RAIL_SHIPPER: ["rail", "logistics", "oil_gas", "bulk"],
      RAIL_CATALYST: ["rail", "government", "logistics"],
      COMPLIANCE_OFFICER: ["government", "hazmat", "chemical"],
      SAFETY_MANAGER: ["government", "hazmat", "trucking"],
      ADMIN: ["trucking", "logistics", "government", "energy"],
      SUPER_ADMIN: ["trucking", "logistics", "government", "energy"],
    };
    const priorityCats = ROLE_CATEGORIES[role] || ROLE_CATEGORIES.SHIPPER;

    // Get today's most relevant articles for this role (last 24h, prioritized by tier + category relevance)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentArticles = articles.filter(a => new Date(a.publishedAt) > oneDayAgo);

    // Score each article for this role
    const scored = recentArticles.map(a => {
      let score = 0;
      const catIdx = priorityCats.indexOf(a.category);
      if (catIdx !== -1) score += (priorityCats.length - catIdx) * 10; // Higher rank = higher score
      // Tier 1 sources get boost (source name indicates tier via our feed data)
      const tier1Sources = ["FreightWaves", "Transport Topics", "Journal of Commerce", "Oil & Gas Journal", "S&P Global Commodity Insights", "gCaptain", "Maritime Executive", "Railway Age"];
      if (tier1Sources.some(s => a.source.includes(s))) score += 20;
      return { ...a, relevanceScore: score };
    });

    // Sort by relevance, take top 8
    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const briefArticles = scored.slice(0, 8);

    // Generate brief bullets from top articles
    const bullets = briefArticles.map(a => ({
      title: a.title,
      source: a.source,
      category: a.category,
      link: a.link,
      publishedAt: a.publishedAt,
      relevanceScore: a.relevanceScore,
    }));

    return {
      role,
      date: new Date().toISOString().split('T')[0],
      briefCount: bullets.length,
      articles: bullets,
      totalToday: recentArticles.length,
    };
  }),

  // ═══════════════════════════════════════════════════════════════
  // SHARE TO TEAM — Send article to a conversation
  // ═══════════════════════════════════════════════════════════════
  shareArticle: protectedProcedure
    .input(z.object({
      articleId: z.string(),
      recipientId: z.number(),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const senderId = Number(ctx.user?.id) || 0;
      if (!senderId) throw new Error("Auth required");

      // Find the article
      const result = await rssService.getArticles({ limit: 1000 });
      const article = result.articles.find(a => a.id === input.articleId);
      if (!article) throw new Error("Article not found");

      // Find or create direct conversation
      const { conversations, messages } = await import("../../drizzle/schema");
      const [existing] = await db.select({ id: conversations.id }).from(conversations)
        .where(and(
          eq(conversations.type, 'direct'),
          sql`JSON_CONTAINS(${conversations.participants}, CAST(${senderId} AS JSON))`,
          sql`JSON_CONTAINS(${conversations.participants}, CAST(${input.recipientId} AS JSON))`
        )).limit(1);

      let convId: number;
      if (existing) {
        convId = existing.id;
      } else {
        const [newConv] = await db.insert(conversations).values({
          type: 'direct',
          participants: [senderId, input.recipientId],
          lastMessageAt: new Date(),
        } as never).$returningId();
        convId = newConv.id;
      }

      // Send the article as a message
      const shareContent = `${input.note ? input.note + '\n\n' : ''}${article.title}\n${article.source} | ${article.category}\n${article.link}`;

      await db.insert(messages).values({
        conversationId: convId,
        senderId,
        messageType: "text" as any,
        content: shareContent,
        readBy: [senderId],
        metadata: { type: "shared_article", articleId: article.id, articleTitle: article.title, articleLink: article.link, articleSource: article.source },
      });

      await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, convId));

      return { success: true, conversationId: convId };
    }),

  // ═══════════════════════════════════════════════════════════════
  // FOLLOW TOPICS — User topic preferences
  // ═══════════════════════════════════════════════════════════════
  getFollowedTopics: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id || "anonymous";
    const db = await getDb();
    if (!db) return { topics: [] };
    try {
      const rows = await db.select({ action: auditLogs.action }).from(auditLogs)
        .where(and(
          eq(auditLogs.entityType, "followed_topic"),
          sql`JSON_EXTRACT(${auditLogs.metadata}, '$.userId') = ${userId}`,
        ));
      return { topics: rows.map(r => r.action) };
    } catch { return { topics: [] }; }
  }),

  followTopic: protectedProcedure
    .input(z.object({ topic: z.string().min(2).max(50) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id || "anonymous";
      const db = await getDb();
      if (!db) return { success: false };
      try {
        const [existing] = await db.select({ id: auditLogs.id }).from(auditLogs)
          .where(and(
            eq(auditLogs.entityType, "followed_topic"),
            eq(auditLogs.action, input.topic.toLowerCase()),
            sql`JSON_EXTRACT(${auditLogs.metadata}, '$.userId') = ${userId}`,
          )).limit(1);
        if (!existing) {
          await db.insert(auditLogs).values({
            action: input.topic.toLowerCase(),
            entityType: "followed_topic",
            metadata: { userId, topic: input.topic.toLowerCase(), followedAt: new Date().toISOString() },
            severity: "LOW",
          } as never);
        }
      } catch {}
      return { success: true, topic: input.topic.toLowerCase() };
    }),

  unfollowTopic: protectedProcedure
    .input(z.object({ topic: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id || "anonymous";
      const db = await getDb();
      if (!db) return { success: false };
      try {
        await db.delete(auditLogs).where(and(
          eq(auditLogs.entityType, "followed_topic"),
          eq(auditLogs.action, input.topic.toLowerCase()),
          sql`JSON_EXTRACT(${auditLogs.metadata}, '$.userId') = ${userId}`,
        ));
      } catch {}
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════════
  // BREAKING NEWS DETECTION — Cluster similar articles
  // ═══════════════════════════════════════════════════════════════
  getBreakingNews: protectedProcedure.query(async () => {
    const result = await rssService.getArticles({ limit: 300 });
    const articles = result.articles;

    // Find articles from the last 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const recent = articles.filter(a => new Date(a.publishedAt) > twoHoursAgo);

    if (recent.length < 3) return { breaking: [], clusters: [] };

    // Simple keyword clustering: extract significant words from titles and group
    const wordCounts: Map<string, { count: number; articles: typeof recent }> = new Map();
    const stopWords = new Set(["the", "a", "an", "in", "on", "at", "to", "for", "of", "and", "is", "are", "was", "were", "be", "been", "by", "with", "from", "as", "that", "this", "it", "its", "has", "have", "had", "will", "would", "could", "should", "may", "can", "but", "or", "not", "no", "new", "says", "said", "report", "reports", "more", "than", "after", "over", "into"]);

    for (const article of recent) {
      const words = article.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
      // Use 2-word phrases for better clustering
      for (let i = 0; i < words.length - 1; i++) {
        const phrase = `${words[i]} ${words[i + 1]}`;
        if (!wordCounts.has(phrase)) wordCounts.set(phrase, { count: 0, articles: [] });
        const entry = wordCounts.get(phrase)!;
        entry.count++;
        if (!entry.articles.find(a => a.id === article.id)) entry.articles.push(article);
      }
    }

    // Find phrases mentioned by 3+ different sources (indicates breaking story)
    const clusters = Array.from(wordCounts.entries())
      .filter(([, v]) => {
        const uniqueSources = new Set(v.articles.map(a => a.source));
        return uniqueSources.size >= 3;
      })
      .sort((a, b) => b[1].articles.length - a[1].articles.length)
      .slice(0, 3)
      .map(([phrase, data]) => ({
        topic: phrase,
        sourceCount: new Set(data.articles.map(a => a.source)).size,
        articles: data.articles.slice(0, 5).map(a => ({
          id: a.id, title: a.title, source: a.source, link: a.link, publishedAt: a.publishedAt,
        })),
      }));

    return {
      breaking: clusters.length > 0 ? clusters[0].articles : [],
      clusters,
      detectedAt: new Date().toISOString(),
    };
  }),

  // ═══════════════════════════════════════════════════════════════
  // SOURCE INFO — Tier and quality data for UI indicators
  // ═══════════════════════════════════════════════════════════════
  getSourceTiers: protectedProcedure.query(() => {
    const { ALL_FEEDS } = require("../services/rssFeedData");
    const tiers: Record<string, { tier: number; country: string; topics: string[] }> = {};
    for (const feed of ALL_FEEDS) {
      tiers[feed.name] = { tier: feed.tier || 2, country: feed.country || "US", topics: feed.topics || [] };
    }
    return tiers;
  }),
});
