/**
 * RATINGS ROUTER
 * tRPC procedures for ratings, reviews, and reputation management
 * WS-E2E-002: Real DB-backed ratings with dedicated ratings + reviewResponses tables
 */

import { z } from "zod";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, loads, drivers, companies, ratings, reviewResponses } from "../../drizzle/schema";
import { fireGamificationEvent } from "../services/gamificationDispatcher";

const entityTypeSchema = z.enum(["driver", "catalyst", "shipper", "broker", "facility"]);
const ratingCategorySchema = z.enum([
  "overall", "communication", "timeliness", "professionalism", "safety", "condition", "accuracy"
]);

const BADGE_THRESHOLDS = [
  { id: "platinum", name: "Platinum Partner", minRating: 4.9, minReviews: 100 },
  { id: "gold", name: "Gold Partner", minRating: 4.7, minReviews: 50 },
  { id: "silver", name: "Silver Partner", minRating: 4.5, minReviews: 25 },
  { id: "bronze", name: "Bronze Partner", minRating: 4.0, minReviews: 10 },
];

function earnedBadges(avgRating: number, count: number) {
  return BADGE_THRESHOLDS.filter(b => avgRating >= b.minRating && count >= b.minReviews);
}

export const ratingsRouter = router({
  /**
   * Get ratings for an entity — aggregates from the ratings table
   */
  getForEntity: protectedProcedure
    .input(z.object({ entityType: entityTypeSchema, entityId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const empty = {
        entityType: input.entityType, entityId: input.entityId, entityName: '',
        overallRating: 0, totalReviews: 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
        categories: { communication: 0, timeliness: 0, professionalism: 0, safety: 0, condition: 0, accuracy: 0 } as Record<string, number>,
        badges: [] as { id: string; name: string }[],
        trend: { direction: 'stable' as string, change: 0, period: 'last_90_days' },
      };
      if (!db) return empty;
      try {
        const eid = parseInt(input.entityId);
        let entityName = '';

        if (input.entityType === 'driver') {
          const [d] = await db.select({ userId: drivers.userId }).from(drivers).where(eq(drivers.id, eid)).limit(1);
          if (d?.userId) {
            const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, d.userId)).limit(1);
            entityName = u?.name || '';
          }
        } else if (input.entityType === 'catalyst' || input.entityType === 'shipper') {
          const [c] = await db.select({ name: companies.name }).from(companies).where(eq(companies.id, eid)).limit(1);
          entityName = c?.name || '';
        }

        // Aggregate ratings from DB
        const [agg] = await db.select({
          count: sql<number>`COUNT(*)`,
          avg: sql<number>`COALESCE(AVG(${ratings.score}), 0)`,
          s5: sql<number>`SUM(CASE WHEN ${ratings.score} = 5 THEN 1 ELSE 0 END)`,
          s4: sql<number>`SUM(CASE WHEN ${ratings.score} = 4 THEN 1 ELSE 0 END)`,
          s3: sql<number>`SUM(CASE WHEN ${ratings.score} = 3 THEN 1 ELSE 0 END)`,
          s2: sql<number>`SUM(CASE WHEN ${ratings.score} = 2 THEN 1 ELSE 0 END)`,
          s1: sql<number>`SUM(CASE WHEN ${ratings.score} = 1 THEN 1 ELSE 0 END)`,
        }).from(ratings).where(eq(ratings.toUserId, eid));

        const totalReviews = agg?.count || 0;
        const overallRating = Math.round((agg?.avg || 0) * 100) / 100;

        // Category averages
        const catRows = await db.select({
          category: ratings.category,
          avg: sql<number>`AVG(${ratings.score})`,
        }).from(ratings).where(eq(ratings.toUserId, eid)).groupBy(ratings.category);

        const categories: Record<string, number> = { communication: 0, timeliness: 0, professionalism: 0, safety: 0, condition: 0, accuracy: 0 };
        for (const c of catRows) {
          if (c.category in categories) categories[c.category] = Math.round((c.avg || 0) * 100) / 100;
        }

        // Trend: compare last 90 days vs prior 90 days
        const now = new Date();
        const d90 = new Date(now.getTime() - 90 * 86400000);
        const d180 = new Date(now.getTime() - 180 * 86400000);
        const [recent] = await db.select({ avg: sql<number>`COALESCE(AVG(${ratings.score}), 0)` }).from(ratings).where(and(eq(ratings.toUserId, eid), gte(ratings.createdAt, d90)));
        const [prior] = await db.select({ avg: sql<number>`COALESCE(AVG(${ratings.score}), 0)` }).from(ratings).where(and(eq(ratings.toUserId, eid), gte(ratings.createdAt, d180), sql`${ratings.createdAt} < ${d90}`));
        const change = Math.round(((recent?.avg || 0) - (prior?.avg || 0)) * 100) / 100;
        const direction = change > 0.1 ? 'up' : change < -0.1 ? 'down' : 'stable';

        return {
          entityType: input.entityType, entityId: input.entityId, entityName,
          overallRating, totalReviews,
          breakdown: { 5: agg?.s5 || 0, 4: agg?.s4 || 0, 3: agg?.s3 || 0, 2: agg?.s2 || 0, 1: agg?.s1 || 0 },
          categories,
          badges: earnedBadges(overallRating, totalReviews),
          trend: { direction, change, period: 'last_90_days' },
        };
      } catch { return empty; }
    }),

  /**
   * Get reviews for an entity — real ratings from DB with reviewer info
   */
  getReviews: protectedProcedure
    .input(z.object({ entityType: entityTypeSchema, entityId: z.string(), sortBy: z.enum(["recent", "highest", "lowest"]).default("recent"), limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return { reviews: [], total: 0 };
      try {
        const eid = parseInt(input.entityId);
        const orderCol = input.sortBy === 'highest' ? desc(ratings.score) : input.sortBy === 'lowest' ? ratings.score : desc(ratings.createdAt);

        const rows = await db.select({
          id: ratings.id, score: ratings.score, category: ratings.category,
          comment: ratings.comment, anonymous: ratings.anonymous,
          fromUserId: ratings.fromUserId, loadId: ratings.loadId,
          createdAt: ratings.createdAt,
          reviewerName: users.name,
        }).from(ratings)
          .leftJoin(users, eq(ratings.fromUserId, users.id))
          .where(eq(ratings.toUserId, eid))
          .orderBy(orderCol as any)
          .offset(input.offset)
          .limit(input.limit);

        const [countRow] = await db.select({ count: sql<number>`COUNT(*)` }).from(ratings).where(eq(ratings.toUserId, eid));

        return {
          reviews: rows.map(r => ({
            id: String(r.id),
            score: r.score,
            category: r.category,
            comment: r.comment || '',
            reviewerName: r.anonymous ? 'Anonymous' : (r.reviewerName || 'User'),
            loadId: r.loadId ? String(r.loadId) : null,
            date: r.createdAt?.toISOString() || '',
            rating: r.score,
            loadNumber: '',
          })),
          total: countRow?.count || 0,
        };
      } catch { return { reviews: [], total: 0 }; }
    }),

  /**
   * Submit a rating — persists to ratings table with duplicate prevention
   */
  submit: protectedProcedure
    .input(z.object({ entityType: entityTypeSchema, entityId: z.string(), loadId: z.string(), overallRating: z.number().min(1).max(5), categories: z.record(ratingCategorySchema, z.number().min(1).max(5)).optional(), comment: z.string().max(500).optional(), anonymous: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const fromUserId = Number(ctx.user?.id) || 0;
      const toUserId = parseInt(input.entityId);
      const loadId = parseInt(input.loadId) || null;

      if (fromUserId === toUserId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot rate yourself.' });
      }

      // Duplicate check
      if (loadId) {
        const [existing] = await db.select({ id: ratings.id }).from(ratings)
          .where(and(eq(ratings.fromUserId, fromUserId), eq(ratings.toUserId, toUserId), eq(ratings.loadId, loadId)))
          .limit(1);
        if (existing) {
          throw new TRPCError({ code: 'CONFLICT', message: 'You have already rated this user for this load.' });
        }
      }

      // Insert overall rating
      const [result] = await db.insert(ratings).values({
        fromUserId, toUserId, loadId, score: input.overallRating,
        category: 'overall', comment: input.comment || null, anonymous: input.anonymous,
      }).$returningId();

      // Insert category ratings (if provided)
      if (input.categories) {
        for (const [cat, score] of Object.entries(input.categories)) {
          try {
            await db.insert(ratings).values({
              fromUserId, toUserId, loadId, score,
              category: cat, anonymous: input.anonymous,
            });
          } catch {} // unique constraint may prevent duplicates
        }
      }

      // WS-E2E-005: Fire rating_received gamification event
      fireGamificationEvent({ userId: toUserId, type: "rating_received", value: input.overallRating });

      return { id: String(result?.id), success: true, submittedBy: ctx.user?.id, submittedAt: new Date().toISOString() };
    }),

  /**
   * Respond to a review — persists to reviewResponses table
   */
  respond: protectedProcedure
    .input(z.object({ reviewId: z.string(), response: z.string().max(500) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const respondentId = Number(ctx.user?.id) || 0;
      const ratingId = parseInt(input.reviewId);

      const [result] = await db.insert(reviewResponses).values({
        ratingId, respondentId, response: input.response,
      }).$returningId();

      return { success: true, reviewId: input.reviewId, responseId: String(result?.id), respondedBy: ctx.user?.id, respondedAt: new Date().toISOString() };
    }),

  /**
   * Report a review
   */
  report: protectedProcedure
    .input(z.object({ reviewId: z.string(), reason: z.enum(["inappropriate", "false_info", "spam", "harassment", "other"]), details: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return { success: true, reportId: `report_${Date.now()}`, reviewId: input.reviewId, reportedBy: ctx.user?.id, reportedAt: new Date().toISOString() };
    }),

  /**
   * Get my ratings summary — real aggregation from ratings table
   */
  getMySummary: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      const result = { asDriver: { overallRating: 0, totalReviews: 0, recentTrend: 'stable' }, asCatalyst: { overallRating: 0, totalReviews: 0, recentTrend: 'stable' }, pendingReviews: [] as any[], givenThisMonth: 0, receivedThisMonth: 0 };
      if (!db) return result;
      try {
        const userId = Number(ctx.user?.id) || 0;
        const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);

        // Ratings received (as driver/any role)
        const [received] = await db.select({
          count: sql<number>`COUNT(*)`,
          avg: sql<number>`COALESCE(AVG(${ratings.score}), 0)`,
        }).from(ratings).where(and(eq(ratings.toUserId, userId), eq(ratings.category, 'overall')));

        result.asDriver.totalReviews = received?.count || 0;
        result.asDriver.overallRating = Math.round((received?.avg || 0) * 100) / 100;

        // Ratings given this month
        const [given] = await db.select({ count: sql<number>`COUNT(*)` }).from(ratings)
          .where(and(eq(ratings.fromUserId, userId), eq(ratings.category, 'overall'), gte(ratings.createdAt, monthAgo)));
        result.givenThisMonth = given?.count || 0;

        // Ratings received this month
        const [recvMonth] = await db.select({ count: sql<number>`COUNT(*)` }).from(ratings)
          .where(and(eq(ratings.toUserId, userId), eq(ratings.category, 'overall'), gte(ratings.createdAt, monthAgo)));
        result.receivedThisMonth = recvMonth?.count || 0;

        return result;
      } catch { return result; }
    }),

  /**
   * Get leaderboard — ranks users by average rating from ratings table
   */
  getLeaderboard: protectedProcedure
    .input(z.object({ entityType: entityTypeSchema, period: z.enum(["week", "month", "quarter", "year", "all"]).default("month"), limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return { period: input.period, entityType: input.entityType, leaderboard: [], myRank: 0, totalEntities: 0 };
      try {
        // Get top-rated users from ratings table
        const leaderRows = await db.select({
          toUserId: ratings.toUserId,
          avg: sql<number>`AVG(${ratings.score})`,
          count: sql<number>`COUNT(*)`,
        }).from(ratings)
          .where(eq(ratings.category, 'overall'))
          .groupBy(ratings.toUserId)
          .orderBy(sql`AVG(${ratings.score}) DESC`)
          .limit(input.limit);

        const leaderboard = await Promise.all(leaderRows.map(async (r, idx) => {
          let name = `User #${r.toUserId}`;
          const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, r.toUserId)).limit(1);
          if (u?.name) name = u.name;
          return { rank: idx + 1, id: String(r.toUserId), name, score: Math.round((r.avg || 0) * 100) / 100, loads: r.count || 0 };
        }));

        // Fallback: if no ratings yet, use driver safety scores
        if (leaderboard.length === 0 && input.entityType === 'driver') {
          const rows = await db.select({
            id: drivers.id, userId: drivers.userId, safetyScore: drivers.safetyScore, totalLoads: drivers.totalLoads,
          }).from(drivers).orderBy(desc(drivers.safetyScore)).limit(input.limit);
          const fallback = await Promise.all(rows.map(async (d, idx) => {
            let name = `Driver #${d.id}`;
            if (d.userId) {
              const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, d.userId)).limit(1);
              if (u?.name) name = u.name;
            }
            return { rank: idx + 1, id: String(d.id), name, score: d.safetyScore || 0, loads: d.totalLoads || 0 };
          }));
          return { period: input.period, entityType: input.entityType, leaderboard: fallback, myRank: 0, totalEntities: fallback.length };
        }

        return { period: input.period, entityType: input.entityType, leaderboard, myRank: 0, totalEntities: leaderboard.length };
      } catch { return { period: input.period, entityType: input.entityType, leaderboard: [], myRank: 0, totalEntities: 0 }; }
    }),

  /**
   * Get rating requirements — static config data (OK to keep)
   */
  getRequirements: protectedProcedure
    .query(async () => ({
      minimumRating: 3.5, minimumReviews: 5, warningThreshold: 4.0,
      badges: BADGE_THRESHOLDS,
      consequences: { belowMinimum: "Account suspension pending review", belowWarning: "Limited load visibility" },
    })),

  /**
   * Request review removal
   */
  requestRemoval: protectedProcedure
    .input(z.object({ reviewId: z.string(), reason: z.string(), evidence: z.array(z.string()).optional() }))
    .mutation(async ({ ctx, input }) => {
      return { success: true, requestId: `removal_${Date.now()}`, reviewId: input.reviewId, status: "pending_review", requestedBy: ctx.user?.id, requestedAt: new Date().toISOString() };
    }),
});
