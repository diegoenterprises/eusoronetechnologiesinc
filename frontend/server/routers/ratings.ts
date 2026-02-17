/**
 * RATINGS ROUTER
 * tRPC procedures for ratings, reviews, and reputation management
 */

import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, loads, drivers, companies } from "../../drizzle/schema";

const entityTypeSchema = z.enum(["driver", "catalyst", "shipper", "broker", "facility"]);
const ratingCategorySchema = z.enum([
  "overall", "communication", "timeliness", "professionalism", "safety", "condition", "accuracy"
]);

export const ratingsRouter = router({
  /**
   * Get ratings for an entity — empty for new users (no ratings table yet)
   */
  getForEntity: protectedProcedure
    .input(z.object({ entityType: entityTypeSchema, entityId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      let totalLoads = 0;
      let entityName = '';
      if (db) {
        try {
          const eid = parseInt(input.entityId);
          if (input.entityType === 'driver') {
            const [d] = await db.select({ totalLoads: drivers.totalLoads, safetyScore: drivers.safetyScore, userId: drivers.userId })
              .from(drivers).where(eq(drivers.id, eid)).limit(1);
            totalLoads = d?.totalLoads || 0;
            if (d?.userId) {
              const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, d.userId)).limit(1);
              entityName = u?.name || '';
            }
          } else if (input.entityType === 'catalyst' || input.entityType === 'shipper') {
            const [c] = await db.select({ name: companies.name }).from(companies).where(eq(companies.id, eid)).limit(1);
            entityName = c?.name || '';
            const [lc] = await db.select({ count: sql<number>`COUNT(*)` }).from(loads)
              .where(eq(input.entityType === 'shipper' ? loads.shipperId : loads.catalystId, eid));
            totalLoads = lc?.count || 0;
          }
        } catch {}
      }
      return {
        entityType: input.entityType, entityId: input.entityId, entityName,
        overallRating: 0, totalReviews: totalLoads,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        categories: { communication: 0, timeliness: 0, professionalism: 0, safety: 0, condition: 0, accuracy: 0 },
        badges: [], trend: { direction: 'stable', change: 0, period: 'last_90_days' },
      };
    }),

  /**
   * Get reviews for an entity — empty for new users
   */
  getReviews: protectedProcedure
    .input(z.object({ entityType: entityTypeSchema, entityId: z.string(), sortBy: z.enum(["recent", "highest", "lowest"]).default("recent"), limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return { reviews: [], total: 0 };
      try {
        // Use completed loads as proxy for reviews
        const eid = parseInt(input.entityId);
        const col = input.entityType === 'shipper' ? loads.shipperId : input.entityType === 'driver' ? loads.driverId : loads.catalystId;
        const rows = await db.select({ id: loads.id, loadNumber: loads.loadNumber, status: loads.status, createdAt: loads.createdAt })
          .from(loads).where(and(eq(col, eid), eq(loads.status, 'delivered'))).orderBy(desc(loads.createdAt)).limit(input.limit);
        const [countRow] = await db.select({ count: sql<number>`COUNT(*)` }).from(loads).where(and(eq(col, eid), eq(loads.status, 'delivered')));
        return {
          reviews: rows.map(l => ({ id: String(l.id), loadNumber: l.loadNumber, date: l.createdAt?.toISOString() || '', rating: 0, comment: '' })),
          total: countRow?.count || 0,
        };
      } catch { return { reviews: [], total: 0 }; }
    }),

  /**
   * Submit a rating
   */
  submit: protectedProcedure
    .input(z.object({ entityType: entityTypeSchema, entityId: z.string(), loadId: z.string(), overallRating: z.number().min(1).max(5), categories: z.record(ratingCategorySchema, z.number().min(1).max(5)).optional(), comment: z.string().optional(), anonymous: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      return { id: `rev_${Date.now()}`, success: true, submittedBy: ctx.user?.id, submittedAt: new Date().toISOString() };
    }),

  /**
   * Respond to a review
   */
  respond: protectedProcedure
    .input(z.object({ reviewId: z.string(), response: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return { success: true, reviewId: input.reviewId, respondedBy: ctx.user?.id, respondedAt: new Date().toISOString() };
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
   * Get my ratings summary — empty for new users
   */
  getMySummary: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      const result = { asDriver: { overallRating: 0, totalReviews: 0, recentTrend: 'stable' }, asCatalyst: { overallRating: 0, totalReviews: 0, recentTrend: 'stable' }, pendingReviews: [] as any[], givenThisMonth: 0, receivedThisMonth: 0 };
      if (!db) return result;
      try {
        const userId = ctx.user?.id || 0;
        const companyId = ctx.user?.companyId || 0;
        // Driver delivered loads
        const [driverLoads] = await db.select({ count: sql<number>`COUNT(*)` }).from(loads).where(and(eq(loads.driverId, userId), eq(loads.status, 'delivered')));
        result.asDriver.totalReviews = driverLoads?.count || 0;
        // Catalyst delivered loads
        const [catalystLoads] = await db.select({ count: sql<number>`COUNT(*)` }).from(loads).where(and(eq(loads.catalystId, companyId), eq(loads.status, 'delivered')));
        result.asCatalyst.totalReviews = catalystLoads?.count || 0;
        return result;
      } catch { return result; }
    }),

  /**
   * Get leaderboard — empty for new users
   */
  getLeaderboard: protectedProcedure
    .input(z.object({ entityType: entityTypeSchema, period: z.enum(["week", "month", "quarter", "year", "all"]).default("month"), limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return { period: input.period, entityType: input.entityType, leaderboard: [], myRank: 0, totalEntities: 0 };
      try {
        if (input.entityType === 'driver') {
          const rows = await db.select({
            id: drivers.id, userId: drivers.userId, safetyScore: drivers.safetyScore, totalLoads: drivers.totalLoads,
          }).from(drivers).orderBy(desc(drivers.safetyScore)).limit(input.limit);
          const leaderboard = await Promise.all(rows.map(async (d, idx) => {
            let name = `Driver #${d.id}`;
            if (d.userId) {
              const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, d.userId)).limit(1);
              if (u?.name) name = u.name;
            }
            return { rank: idx + 1, id: String(d.id), name, score: d.safetyScore || 0, loads: d.totalLoads || 0 };
          }));
          return { period: input.period, entityType: input.entityType, leaderboard, myRank: 0, totalEntities: leaderboard.length };
        }
        return { period: input.period, entityType: input.entityType, leaderboard: [], myRank: 0, totalEntities: 0 };
      } catch { return { period: input.period, entityType: input.entityType, leaderboard: [], myRank: 0, totalEntities: 0 }; }
    }),

  /**
   * Get rating requirements — static config data (OK to keep)
   */
  getRequirements: protectedProcedure
    .query(async () => ({
      minimumRating: 3.5, minimumReviews: 5, warningThreshold: 4.0,
      badges: [
        { id: "platinum", name: "Platinum Partner", minRating: 4.9, minReviews: 100 },
        { id: "gold", name: "Gold Partner", minRating: 4.7, minReviews: 50 },
        { id: "silver", name: "Silver Partner", minRating: 4.5, minReviews: 25 },
        { id: "bronze", name: "Bronze Partner", minRating: 4.0, minReviews: 10 },
      ],
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
