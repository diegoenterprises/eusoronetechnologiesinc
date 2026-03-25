/**
 * NEWSFEED ROUTER
 * tRPC procedures for industry news and platform updates
 */

import { z } from "zod";
import { sql } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

const articleCategorySchema = z.enum([
  "industry", "regulations", "safety", "technology", "market", "platform", "tips"
]);

export const newsfeedRouter = router({
  /**
   * Get news feed
   */
  getFeed: protectedProcedure
    .input(z.object({
      category: articleCategorySchema.optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async () => {
      // No newsfeed articles table exists yet
      return { articles: [], total: 0 };
    }),

  /**
   * Get featured articles
   */
  getFeatured: publicProcedure
    .query(async () => {
      // No featured articles table exists yet
      return [];
    }),

  /**
   * Get article by ID
   */
  getArticle: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async () => {
      // No newsfeed articles table exists yet
      return null;
    }),

  /**
   * Get platform announcements
   */
  getAnnouncements: protectedProcedure
    .query(async () => {
      // No announcements table exists yet
      return [];
    }),

  /**
   * Mark announcement as read
   */
  markAnnouncementRead: protectedProcedure
    .input(z.object({ announcementId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        announcementId: input.announcementId,
        readAt: new Date().toISOString(),
      };
    }),

  /**
   * Get market rates
   */
  getMarketRates: protectedProcedure
    .input(z.object({
      region: z.string().optional(),
    }))
    .query(async () => {
      const db = await getDb();
      const averages: Record<string, number> = { general: 0, hazmat: 0, refrigerated: 0, liquid: 0 };

      if (db) {
        try {
          const rows = await db.select({
            cargoType: sql<string>`cargoType`,
            avgRate: sql<number>`AVG(CAST(rate AS DECIMAL(10,2)))`,
          })
            .from(sql`loads`)
            .where(sql`rate IS NOT NULL AND rate > 0 AND distance IS NOT NULL AND distance > 0 AND status NOT IN ('draft','cancelled')`)
            .groupBy(sql`cargoType`);

          for (const row of rows) {
            const ct = String(row.cargoType || "").toLowerCase();
            if (ct in averages) averages[ct] = Number(row.avgRate) || 0;
          }
        } catch { /* loads table may not exist */ }
      }

      return {
        lastUpdated: new Date().toISOString(),
        nationalAverage: {
          flatbed: averages.general,
          van: averages.general,
          reefer: averages.refrigerated,
          tanker: averages.liquid,
        },
        byRegion: [],
        trends: {
          flatbed: { change: 0, direction: "stable" as const },
          van: { change: 0, direction: "stable" as const },
          reefer: { change: 0, direction: "stable" as const },
          tanker: { change: 0, direction: "stable" as const },
        },
      };
    }),

  /**
   * Get diesel prices
   */
  getDieselPrices: publicProcedure
    .query(async () => {
      const db = await getDb();
      let nationalAverage = 0;
      let weeklyChange = 0;
      let lastUpdated = new Date().toISOString();
      const byRegion: { region: string; price: number }[] = [];

      if (db) {
        try {
          // Query latest diesel prices from hz_fuel_prices table
          const [avgRow] = await db.select({
            avg: sql<number>`AVG(CAST(diesel_retail AS DECIMAL(6,3)))`,
            latest: sql<string>`MAX(report_date)`,
          })
            .from(sql`hz_fuel_prices`)
            .where(sql`diesel_retail IS NOT NULL AND report_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)`);

          nationalAverage = Number(avgRow?.avg) || 0;
          if (avgRow?.latest) lastUpdated = String(avgRow.latest);

          // Weekly change: compare current avg vs 7 days prior
          const [prevRow] = await db.select({
            avg: sql<number>`AVG(CAST(diesel_retail AS DECIMAL(6,3)))`,
          })
            .from(sql`hz_fuel_prices`)
            .where(sql`diesel_retail IS NOT NULL AND report_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 21 DAY) AND DATE_SUB(CURDATE(), INTERVAL 7 DAY)`);

          const prevAvg = Number(prevRow?.avg) || 0;
          if (prevAvg > 0) weeklyChange = nationalAverage - prevAvg;

          // By PADD region
          const regionRows = await db.select({
            region: sql<string>`padd_region`,
            price: sql<number>`AVG(CAST(diesel_retail AS DECIMAL(6,3)))`,
          })
            .from(sql`hz_fuel_prices`)
            .where(sql`diesel_retail IS NOT NULL AND padd_region IS NOT NULL AND report_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)`)
            .groupBy(sql`padd_region`);

          for (const r of regionRows) {
            byRegion.push({ region: String(r.region), price: Number(r.price) || 0 });
          }
        } catch { /* hz_fuel_prices table may not exist */ }
      }

      return {
        lastUpdated,
        nationalAverage,
        byRegion,
        weeklyChange,
        yearOverYear: 0,
      };
    }),

  /**
   * Subscribe to newsletter
   */
  subscribeNewsletter: protectedProcedure
    .input(z.object({
      categories: z.array(articleCategorySchema),
      frequency: z.enum(["daily", "weekly", "monthly"]),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        subscribedAt: new Date().toISOString(),
        categories: input.categories,
        frequency: input.frequency,
      };
    }),

  /**
   * Save article for later
   */
  saveArticle: protectedProcedure
    .input(z.object({ articleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        articleId: input.articleId,
        savedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get saved articles
   */
  getSavedArticles: protectedProcedure
    .query(async ({ ctx }) => {
      return [];
    }),
});
