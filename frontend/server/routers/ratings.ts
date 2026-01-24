/**
 * RATINGS ROUTER
 * tRPC procedures for ratings, reviews, and reputation management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const entityTypeSchema = z.enum(["driver", "carrier", "shipper", "broker", "facility"]);
const ratingCategorySchema = z.enum([
  "overall", "communication", "timeliness", "professionalism", "safety", "condition", "accuracy"
]);

export const ratingsRouter = router({
  /**
   * Get ratings for an entity
   */
  getForEntity: protectedProcedure
    .input(z.object({
      entityType: entityTypeSchema,
      entityId: z.string(),
    }))
    .query(async ({ input }) => {
      return {
        entityType: input.entityType,
        entityId: input.entityId,
        overallRating: 4.7,
        totalReviews: 156,
        breakdown: {
          5: 98,
          4: 42,
          3: 12,
          2: 3,
          1: 1,
        },
        categories: {
          communication: 4.8,
          timeliness: 4.6,
          professionalism: 4.9,
          safety: 4.7,
          condition: 4.5,
          accuracy: 4.8,
        },
        badges: [
          { id: "top_rated", name: "Top Rated", icon: "star", earnedAt: "2024-06-15" },
          { id: "on_time_champion", name: "On-Time Champion", icon: "clock", earnedAt: "2024-09-01" },
          { id: "safety_first", name: "Safety First", icon: "shield", earnedAt: "2024-11-20" },
        ],
        trend: {
          direction: "up",
          change: 0.2,
          period: "last_90_days",
        },
      };
    }),

  /**
   * Get reviews for an entity
   */
  getReviews: protectedProcedure
    .input(z.object({
      entityType: entityTypeSchema,
      entityId: z.string(),
      sortBy: z.enum(["recent", "highest", "lowest"]).default("recent"),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const reviews = [
        {
          id: "rev_001",
          rating: 5,
          categories: { communication: 5, timeliness: 5, professionalism: 5 },
          comment: "Excellent service! Delivery was on time and the driver was very professional.",
          loadNumber: "LOAD-45800",
          reviewer: { id: "u10", name: "Shell Oil Company", type: "shipper" },
          createdAt: "2025-01-20T14:00:00Z",
          response: null,
        },
        {
          id: "rev_002",
          rating: 4,
          categories: { communication: 4, timeliness: 4, professionalism: 5 },
          comment: "Good service overall. Minor delay due to traffic but kept us informed.",
          loadNumber: "LOAD-45750",
          reviewer: { id: "u11", name: "ExxonMobil", type: "shipper" },
          createdAt: "2025-01-18T10:00:00Z",
          response: {
            content: "Thank you for the feedback. We appreciate your understanding regarding the traffic delay.",
            respondedAt: "2025-01-18T16:00:00Z",
          },
        },
        {
          id: "rev_003",
          rating: 5,
          categories: { communication: 5, timeliness: 5, professionalism: 5, safety: 5 },
          comment: "Outstanding! Driver followed all safety protocols perfectly.",
          loadNumber: "LOAD-45700",
          reviewer: { id: "u12", name: "Valero", type: "shipper" },
          createdAt: "2025-01-15T09:00:00Z",
          response: null,
        },
      ];

      return {
        reviews: reviews.slice(input.offset, input.offset + input.limit),
        total: reviews.length,
      };
    }),

  /**
   * Submit a rating
   */
  submit: protectedProcedure
    .input(z.object({
      entityType: entityTypeSchema,
      entityId: z.string(),
      loadId: z.string(),
      overallRating: z.number().min(1).max(5),
      categories: z.record(ratingCategorySchema, z.number().min(1).max(5)).optional(),
      comment: z.string().optional(),
      anonymous: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `rev_${Date.now()}`,
        success: true,
        submittedBy: ctx.user?.id,
        submittedAt: new Date().toISOString(),
      };
    }),

  /**
   * Respond to a review
   */
  respond: protectedProcedure
    .input(z.object({
      reviewId: z.string(),
      response: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        reviewId: input.reviewId,
        respondedBy: ctx.user?.id,
        respondedAt: new Date().toISOString(),
      };
    }),

  /**
   * Report a review
   */
  report: protectedProcedure
    .input(z.object({
      reviewId: z.string(),
      reason: z.enum(["inappropriate", "false_info", "spam", "harassment", "other"]),
      details: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        reportId: `report_${Date.now()}`,
        reviewId: input.reviewId,
        reportedBy: ctx.user?.id,
        reportedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get my ratings summary
   */
  getMySummary: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        asDriver: {
          overallRating: 4.8,
          totalReviews: 89,
          recentTrend: "up",
        },
        asCarrier: {
          overallRating: 4.7,
          totalReviews: 156,
          recentTrend: "stable",
        },
        pendingReviews: [
          { loadId: "load_001", loadNumber: "LOAD-45850", entityType: "shipper", entityName: "Shell Oil Company", completedAt: "2025-01-22" },
          { loadId: "load_002", loadNumber: "LOAD-45830", entityType: "facility", entityName: "Houston Terminal", completedAt: "2025-01-21" },
        ],
        givenThisMonth: 12,
        receivedThisMonth: 8,
      };
    }),

  /**
   * Get leaderboard
   */
  getLeaderboard: protectedProcedure
    .input(z.object({
      entityType: entityTypeSchema,
      period: z.enum(["week", "month", "quarter", "year", "all"]).default("month"),
      limit: z.number().default(10),
    }))
    .query(async ({ input }) => {
      const leaderboard = [
        { rank: 1, entityId: "car_001", name: "ABC Transport LLC", rating: 4.95, reviews: 234, badge: "platinum" },
        { rank: 2, entityId: "car_002", name: "FastHaul LLC", rating: 4.92, reviews: 189, badge: "gold" },
        { rank: 3, entityId: "car_003", name: "SafeLoad Carriers", rating: 4.89, reviews: 156, badge: "gold" },
        { rank: 4, entityId: "car_004", name: "Premier Trucking", rating: 4.85, reviews: 201, badge: "silver" },
        { rank: 5, entityId: "car_005", name: "Reliable Transport", rating: 4.82, reviews: 178, badge: "silver" },
      ];

      return {
        period: input.period,
        entityType: input.entityType,
        leaderboard: leaderboard.slice(0, input.limit),
        myRank: 12,
        totalEntities: 450,
      };
    }),

  /**
   * Get rating requirements
   */
  getRequirements: protectedProcedure
    .query(async () => {
      return {
        minimumRating: 3.5,
        minimumReviews: 5,
        warningThreshold: 4.0,
        badges: [
          { id: "platinum", name: "Platinum Partner", minRating: 4.9, minReviews: 100 },
          { id: "gold", name: "Gold Partner", minRating: 4.7, minReviews: 50 },
          { id: "silver", name: "Silver Partner", minRating: 4.5, minReviews: 25 },
          { id: "bronze", name: "Bronze Partner", minRating: 4.0, minReviews: 10 },
        ],
        consequences: {
          belowMinimum: "Account suspension pending review",
          belowWarning: "Limited load visibility",
        },
      };
    }),

  /**
   * Request review removal
   */
  requestRemoval: protectedProcedure
    .input(z.object({
      reviewId: z.string(),
      reason: z.string(),
      evidence: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        requestId: `removal_${Date.now()}`,
        reviewId: input.reviewId,
        status: "pending_review",
        requestedBy: ctx.user?.id,
        requestedAt: new Date().toISOString(),
      };
    }),
});
