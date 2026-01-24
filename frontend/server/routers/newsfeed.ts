/**
 * NEWSFEED ROUTER
 * tRPC procedures for industry news and platform updates
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

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
    .query(async ({ input }) => {
      const articles = [
        {
          id: "news_001",
          title: "FMCSA Announces New HOS Flexibility Rules for 2025",
          summary: "The Federal Motor Carrier Safety Administration has released updated Hours of Service regulations with increased flexibility for short-haul drivers.",
          category: "regulations",
          author: "EusoTrip Editorial",
          publishedAt: "2025-01-22T14:00:00Z",
          readTime: 5,
          imageUrl: "/images/news/fmcsa-update.jpg",
          featured: true,
        },
        {
          id: "news_002",
          title: "Fuel Prices Expected to Stabilize in Q1 2025",
          summary: "Industry analysts predict diesel prices will remain stable through the first quarter, offering relief to carriers.",
          category: "market",
          author: "Market Watch",
          publishedAt: "2025-01-21T10:00:00Z",
          readTime: 3,
          imageUrl: "/images/news/fuel-prices.jpg",
          featured: false,
        },
        {
          id: "news_003",
          title: "New EusoTrip Feature: AI-Powered Load Matching",
          summary: "ESANG AI now provides intelligent load recommendations based on your preferences, location, and historical performance.",
          category: "platform",
          author: "EusoTrip Product Team",
          publishedAt: "2025-01-20T09:00:00Z",
          readTime: 4,
          imageUrl: "/images/news/ai-matching.jpg",
          featured: true,
        },
        {
          id: "news_004",
          title: "Winter Driving Safety Tips for Hazmat Carriers",
          summary: "Essential safety tips for transporting hazardous materials during winter weather conditions.",
          category: "safety",
          author: "Safety First Team",
          publishedAt: "2025-01-19T11:00:00Z",
          readTime: 6,
          imageUrl: "/images/news/winter-safety.jpg",
          featured: false,
        },
        {
          id: "news_005",
          title: "Understanding CSA Score Changes in 2025",
          summary: "FMCSA has updated the Compliance, Safety, Accountability program. Learn what these changes mean for your fleet.",
          category: "regulations",
          author: "Compliance Corner",
          publishedAt: "2025-01-18T08:00:00Z",
          readTime: 7,
          imageUrl: "/images/news/csa-scores.jpg",
          featured: false,
        },
      ];

      let filtered = articles;
      if (input.category) filtered = filtered.filter(a => a.category === input.category);

      return {
        articles: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
      };
    }),

  /**
   * Get featured articles
   */
  getFeatured: publicProcedure
    .query(async () => {
      return [
        {
          id: "news_001",
          title: "FMCSA Announces New HOS Flexibility Rules for 2025",
          summary: "Updated Hours of Service regulations with increased flexibility for short-haul drivers.",
          category: "regulations",
          publishedAt: "2025-01-22T14:00:00Z",
          imageUrl: "/images/news/fmcsa-update.jpg",
        },
        {
          id: "news_003",
          title: "New EusoTrip Feature: AI-Powered Load Matching",
          summary: "ESANG AI now provides intelligent load recommendations.",
          category: "platform",
          publishedAt: "2025-01-20T09:00:00Z",
          imageUrl: "/images/news/ai-matching.jpg",
        },
      ];
    }),

  /**
   * Get article by ID
   */
  getArticle: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        title: "FMCSA Announces New HOS Flexibility Rules for 2025",
        content: `
# FMCSA Announces New HOS Flexibility Rules for 2025

The Federal Motor Carrier Safety Administration (FMCSA) has released significant updates to the Hours of Service (HOS) regulations, effective March 1, 2025.

## Key Changes

### 1. Extended Short-Haul Radius
The short-haul radius has been extended from 150 to 175 air miles, providing greater flexibility for regional operations.

### 2. Split Sleeper Berth Provision
Drivers can now split their required 10-hour off-duty time into two periods:
- One period of at least 7 consecutive hours in the sleeper berth
- One period of at least 2 consecutive hours either off-duty or in the sleeper berth

### 3. Adverse Driving Conditions Exception
The adverse driving conditions exception now allows for up to 3 additional hours of driving time when unforeseen conditions occur.

## What This Means for Carriers

These changes are designed to provide drivers with more flexibility while maintaining safety standards. Carriers should:

1. Update their ELD systems to reflect the new regulations
2. Train drivers on the updated rules
3. Revise company policies and driver handbooks

## Implementation Timeline

- **January 2025**: Final rule published
- **March 1, 2025**: New regulations take effect
- **June 2025**: Full enforcement begins

For more information, visit the FMCSA website or consult with your compliance team.
        `,
        category: "regulations",
        author: "EusoTrip Editorial",
        publishedAt: "2025-01-22T14:00:00Z",
        readTime: 5,
        imageUrl: "/images/news/fmcsa-update.jpg",
        tags: ["FMCSA", "HOS", "Regulations", "Compliance"],
        relatedArticles: ["news_005", "news_004"],
      };
    }),

  /**
   * Get platform announcements
   */
  getAnnouncements: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          id: "ann_001",
          title: "Scheduled Maintenance - January 25",
          message: "EusoTrip will undergo scheduled maintenance on January 25, 2025 from 2:00 AM to 4:00 AM CST. During this time, the platform may be temporarily unavailable.",
          type: "maintenance",
          priority: "normal",
          publishedAt: "2025-01-22T12:00:00Z",
          expiresAt: "2025-01-26T00:00:00Z",
        },
        {
          id: "ann_002",
          title: "New Feature: Instant Payouts",
          message: "You can now request instant payouts to your linked debit card for a small fee. Check your wallet settings to enable this feature.",
          type: "feature",
          priority: "normal",
          publishedAt: "2025-01-20T10:00:00Z",
          expiresAt: null,
        },
      ];
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
    .query(async ({ input }) => {
      return {
        lastUpdated: new Date().toISOString(),
        nationalAverage: {
          flatbed: 2.85,
          van: 2.45,
          reefer: 2.65,
          tanker: 3.45,
        },
        byRegion: [
          { region: "Southwest", flatbed: 2.75, van: 2.35, reefer: 2.55, tanker: 3.35 },
          { region: "Southeast", flatbed: 2.80, van: 2.40, reefer: 2.60, tanker: 3.40 },
          { region: "Midwest", flatbed: 2.70, van: 2.30, reefer: 2.50, tanker: 3.30 },
          { region: "Northeast", flatbed: 3.00, van: 2.60, reefer: 2.80, tanker: 3.60 },
          { region: "West", flatbed: 2.90, van: 2.50, reefer: 2.70, tanker: 3.50 },
        ],
        trends: {
          flatbed: { change: 2.5, direction: "up" },
          van: { change: -1.2, direction: "down" },
          reefer: { change: 0.5, direction: "up" },
          tanker: { change: 1.8, direction: "up" },
        },
      };
    }),

  /**
   * Get diesel prices
   */
  getDieselPrices: publicProcedure
    .query(async () => {
      return {
        lastUpdated: new Date().toISOString(),
        nationalAverage: 3.89,
        byRegion: [
          { region: "Gulf Coast", price: 3.65, change: -0.05 },
          { region: "Midwest", price: 3.78, change: 0.02 },
          { region: "East Coast", price: 4.05, change: -0.03 },
          { region: "West Coast", price: 4.25, change: 0.00 },
          { region: "Rocky Mountain", price: 3.95, change: -0.02 },
        ],
        weeklyChange: -0.02,
        yearOverYear: -0.45,
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
      return [
        { id: "news_001", title: "FMCSA Announces New HOS Flexibility Rules for 2025", savedAt: "2025-01-22T15:00:00Z" },
        { id: "news_004", title: "Winter Driving Safety Tips for Hazmat Carriers", savedAt: "2025-01-19T12:00:00Z" },
      ];
    }),
});
