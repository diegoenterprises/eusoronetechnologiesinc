/**
 * REWARDS ROUTER
 * tRPC procedures for rewards and loyalty program
 * Powered by gamification tables: gamificationProfiles, badges, userBadges, rewardCrates
 */

import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { gamificationProfiles, badges, userBadges, rewardCrates } from "../../drizzle/schema";

export const rewardsRouter = router({
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const fallback = { points: 0, tier: "bronze", nextTier: "silver", pointsToNextTier: 1000, lifetimeEarnings: 0, totalEarned: 0, redeemed: 0, rank: 0, nextTierPoints: 1000, tierProgress: 0 };
    if (!db) return fallback;
    try {
      const userId = ctx.user?.id || 0;
      const [profile] = await db.select().from(gamificationProfiles).where(eq(gamificationProfiles.userId, userId)).limit(1);
      if (!profile) return fallback;
      const currentMiles = parseFloat(profile.currentMiles || '0');
      const totalMiles = parseFloat(profile.totalMilesEarned || '0');
      const tiers = [
        { name: "bronze", threshold: 0 },
        { name: "silver", threshold: 1000 },
        { name: "gold", threshold: 5000 },
        { name: "platinum", threshold: 15000 },
        { name: "diamond", threshold: 50000 },
      ];
      const currentTierIdx = tiers.reduce((acc, t, i) => profile.totalXp >= t.threshold ? i : acc, 0);
      const currentTier = tiers[currentTierIdx].name;
      const nextTier = currentTierIdx < tiers.length - 1 ? tiers[currentTierIdx + 1].name : currentTier;
      const nextThreshold = currentTierIdx < tiers.length - 1 ? tiers[currentTierIdx + 1].threshold : tiers[currentTierIdx].threshold;
      const currentThreshold = tiers[currentTierIdx].threshold;
      const tierProgress = nextThreshold > currentThreshold ? Math.round(((profile.totalXp - currentThreshold) / (nextThreshold - currentThreshold)) * 100) : 100;
      return {
        points: Math.round(currentMiles),
        tier: currentTier,
        nextTier,
        pointsToNextTier: nextThreshold - profile.totalXp,
        lifetimeEarnings: Math.round(totalMiles),
        totalEarned: profile.totalXp,
        redeemed: Math.round(totalMiles - currentMiles),
        rank: profile.rank || 0,
        nextTierPoints: nextThreshold,
        tierProgress,
      };
    } catch (e) { return fallback; }
  }),

  getAvailable: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) return [];
    try {
      const userId = ctx.user?.id || 0;
      const earnedBadgeIds = await db.select({ badgeId: userBadges.badgeId }).from(userBadges).where(eq(userBadges.userId, userId));
      const earnedIds = new Set(earnedBadgeIds.map(b => b.badgeId));
      const allBadges = await db.select().from(badges).where(eq(badges.isActive, true)).limit(input?.limit || 20);
      return allBadges
        .filter(b => !earnedIds.has(b.id))
        .map(b => ({
          id: String(b.id),
          code: b.code,
          name: b.name,
          description: b.description || '',
          category: b.category,
          tier: b.tier || 'bronze',
          xpValue: b.xpValue || 0,
          isRare: b.isRare || false,
          earned: false,
        }));
    } catch (e) { return []; }
  }),

  getHistory: protectedProcedure.input(z.object({ limit: z.number().optional() })).query(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) return [];
    try {
      const userId = ctx.user?.id || 0;
      const earned = await db.select({
        id: userBadges.id,
        badgeId: userBadges.badgeId,
        earnedAt: userBadges.earnedAt,
        badgeName: badges.name,
        badgeCategory: badges.category,
        badgeTier: badges.tier,
        xpValue: badges.xpValue,
      }).from(userBadges)
        .leftJoin(badges, eq(userBadges.badgeId, badges.id))
        .where(eq(userBadges.userId, userId))
        .orderBy(desc(userBadges.earnedAt))
        .limit(input.limit || 20);
      return earned.map(e => ({
        id: String(e.id),
        type: 'badge_earned',
        name: e.badgeName || '',
        category: e.badgeCategory || '',
        tier: e.badgeTier || 'bronze',
        xpEarned: e.xpValue || 0,
        earnedAt: e.earnedAt?.toISOString() || '',
      }));
    } catch (e) { return []; }
  }),
});
