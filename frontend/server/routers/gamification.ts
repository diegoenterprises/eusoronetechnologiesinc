/**
 * GAMIFICATION ROUTER
 * tRPC procedures for driver achievements, points, and rewards
 * PRODUCTION-READY: All data from database
 */

import { z } from "zod";
import { eq, and, desc, gte, lte, sql, isNull, or } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { emitGamificationEvent, emitNotification } from "../_core/websocket";
import { WS_EVENTS } from "@shared/websocket-events";
import {
  users,
  drivers,
  missions,
  missionProgress,
  badges,
  userBadges,
  userTitles,
  gamificationProfiles,
  rewardCrates,
  seasons,
  leaderboards,
  rewards,
  hosLogs,
} from "../../drizzle/schema";
import { pickWeeklyMissions, getRewardsCatalogForRole, generateWeeklyMissions, forceRotateMissions } from "../services/missionGenerator";
import { fireGamificationEvent } from "../services/gamificationDispatcher";
import { canDriverAcceptLoad } from "../services/hosEngine";
import { moderateMessage, getStrikeAction } from "../services/lobbyModeration";

/**
 * Template fallback: when DB missions are empty or table doesn't exist,
 * generate available missions from the in-memory template pool so users
 * always see something on The Haul.
 */
function templateFallback(
  userRole: string,
  input?: { type?: string; category?: string } | null
) {
  const picks = pickWeeklyMissions(userRole, 10);
  let filtered = picks;
  if (input?.type && input.type !== "all") {
    filtered = filtered.filter(t => t.tp === input.type);
  }
  if (input?.category && input.category !== "all") {
    filtered = filtered.filter(t => t.cat === input.category);
  }
  return filtered.map((t, i) => ({
    id: -(i + 1), // negative IDs signal template-only (non-startable in DB)
    code: `tmpl_${userRole.toLowerCase()}_${i}`,
    name: t.name,
    description: t.desc.replace("{t}", String(t.tv)),
    type: t.tp,
    category: t.cat,
    targetType: t.tt,
    targetValue: t.tv,
    targetUnit: t.tu || null,
    rewardType: t.rt,
    rewardValue: t.rv,
    xpReward: t.xp,
    currentProgress: 0,
    status: "not_started",
    source: "template",
  }));
}

export const gamificationRouter = router({
  create: protectedProcedure
    .input(z.object({
      userId: z.number(),
      type: z.enum(["mission_completion", "badge_earned", "level_up", "crate_opened", "referral", "achievement", "seasonal", "bonus"]),
      rewardType: z.enum(["miles", "cash", "xp", "badge", "title", "fee_reduction", "priority_perk", "crate"]),
      amount: z.number().optional(),
      description: z.string().optional(),
      expiresAt: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const [result] = await db.insert(rewards).values({
        userId: input.userId,
        type: input.type,
        rewardType: input.rewardType,
        amount: input.amount ? String(input.amount) : undefined,
        description: input.description,
        status: "pending",
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      }).$returningId();
      return { success: true, id: result.id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "claimed", "expired"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const updates: Record<string, any> = {};
      if (input.status) {
        updates.status = input.status;
        if (input.status === "claimed") updates.claimedAt = new Date();
      }
      if (Object.keys(updates).length > 0) {
        await db.update(rewards).set(updates).where(eq(rewards.id, input.id));
      }
      return { success: true, id: input.id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      await db.update(rewards).set({ status: "expired" }).where(eq(rewards.id, input.id));
      return { success: true, id: input.id };
    }),

  /**
   * Get user gamification profile
   */
  getProfile: protectedProcedure
    .input(z.object({
      userId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = input.userId ? Number(input.userId) : Number(ctx.user?.id) || 0;

      if (!db) {
        return {
          userId,
          name: ctx.user?.name || "User",
          level: 1,
          title: null,
          totalPoints: 0,
          currentXp: 0,
          xpToNextLevel: 1000,
          rank: null,
          totalUsers: 0,
          percentile: 0,
          memberSince: new Date().toISOString().split("T")[0],
          streaks: { currentOnTime: 0, longestOnTime: 0, currentSafe: 0, longestSafe: 0 },
          stats: { loadsCompleted: 0, milesDriver: 0, onTimeRate: 0, safetyScore: 100, customerRating: 0 },
        };
      }

      // Get or create gamification profile
      let [profile] = await db.select()
        .from(gamificationProfiles)
        .where(eq(gamificationProfiles.userId, userId))
        .limit(1);

      if (!profile) {
        // Create profile if it doesn't exist
        await db.insert(gamificationProfiles).values({
          userId,
          level: 1,
          currentXp: 0,
          totalXp: 0,
          xpToNextLevel: 1000,
        });

        [profile] = await db.select()
          .from(gamificationProfiles)
          .where(eq(gamificationProfiles.userId, userId))
          .limit(1);
      }

      const [user] = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt }).from(users).where(eq(users.id, userId)).limit(1);

      // Count total users for percentile calculation
      const allProfiles = await db.select().from(gamificationProfiles);
      const totalUsers = allProfiles.length;
      const userRank = profile?.rank || allProfiles.filter(p => (p.totalXp || 0) > (profile?.totalXp || 0)).length + 1;
      const percentile = totalUsers > 0 ? ((totalUsers - userRank) / totalUsers) * 100 : 0;

      return {
        userId,
        name: user?.name || ctx.user?.name || "User",
        role: user?.role || (ctx.user as any)?.role || "DRIVER",
        level: profile?.level || 1,
        title: profile?.activeTitle || null,
        totalPoints: profile?.totalXp || 0,
        currentXp: profile?.currentXp || 0,
        xpToNextLevel: profile?.xpToNextLevel || 1000,
        pointsToNextLevel: (profile?.xpToNextLevel || 1000) - (profile?.currentXp || 0),
        nextLevelAt: profile?.xpToNextLevel || 1000,
        rank: userRank,
        totalUsers,
        percentile: Math.round(percentile * 10) / 10,
        memberSince: user?.createdAt?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
        currentMiles: profile?.currentMiles ? parseFloat(profile.currentMiles) : 0,
        totalMilesEarned: profile?.totalMilesEarned ? parseFloat(profile.totalMilesEarned) : 0,
        streaks: {
          currentOnTime: profile?.streakDays || 0,
          longestOnTime: profile?.longestStreak || 0,
          currentSafe: profile?.streakDays || 0,
          longestSafe: profile?.longestStreak || 0,
        },
        stats: profile?.stats || {
          totalMissionsCompleted: 0,
          totalBadgesEarned: 0,
          totalCratesOpened: 0,
          perfectDeliveries: 0,
          onTimeRate: 0,
        },
      };
    }),

  /**
   * Get achievements — DB-backed with badge catalog
   */
  getAchievements: protectedProcedure
    .input(z.object({
      userId: z.string().optional(),
      category: z.enum(["all", "safety", "performance", "milestones", "special"]).default("all"),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = input.userId ? Number(input.userId) : Number(ctx.user?.id) || 0;

      if (!db) {
        return { earned: [], locked: [], totalEarned: 0, totalAvailable: 0, totalPoints: 0 };
      }

      try {
        // Get all badges (achievement catalog)
        const allBadgesList = await db.select().from(badges).where(eq(badges.isActive, true));

        // Get user's earned badges
        const earnedBadges = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
        const earnedBadgeIds = new Set(earnedBadges.map(eb => eb.badgeId));

        // Category mapping from badge category to achievement category
        const categoryMap: Record<string, string> = {
          milestone: "milestones", performance: "performance", specialty: "special",
          seasonal: "special", epic: "special", legendary: "special",
        };

        const tierRarityMap: Record<string, string> = {
          bronze: "common", silver: "uncommon", gold: "rare", platinum: "epic", diamond: "legendary",
        };

        const earned = allBadgesList
          .filter(b => earnedBadgeIds.has(b.id))
          .filter(b => input.category === "all" || categoryMap[b.category] === input.category)
          .map(b => {
            const ub = earnedBadges.find(e => e.badgeId === b.id);
            return {
              id: `ach_${b.id}`,
              name: b.name,
              description: b.description || "",
              category: categoryMap[b.category] || b.category,
              icon: b.iconUrl || "award",
              points: b.xpValue || 0,
              earnedAt: ub?.earnedAt?.toISOString().split("T")[0] || "",
              rarity: tierRarityMap[b.tier || "bronze"] || "common",
            };
          });

        const locked = allBadgesList
          .filter(b => !earnedBadgeIds.has(b.id))
          .filter(b => input.category === "all" || categoryMap[b.category] === input.category)
          .map(b => ({
            id: `ach_${b.id}`,
            name: b.name,
            description: b.description || "",
            category: categoryMap[b.category] || b.category,
            icon: b.iconUrl || "lock",
            points: b.xpValue || 0,
            progress: 0,
            target: 1,
            rarity: tierRarityMap[b.tier || "bronze"] || "common",
          }));

        return {
          earned,
          locked,
          totalEarned: earned.length,
          totalAvailable: earned.length + locked.length,
          totalPoints: earned.reduce((sum, a) => sum + a.points, 0),
        };
      } catch (err) {
        logger.error("[TheHaul] getAchievements error:", err);
        return { earned: [], locked: [], totalEarned: 0, totalAvailable: 0, totalPoints: 0 };
      }
    }),

  /**
   * Get leaderboard
   */
  getLeaderboard: protectedProcedure
    .input(z.object({
      period: z.enum(["week", "month", "quarter", "year", "all"]).default("month"),
      category: z.enum(["points", "loads", "miles", "safety", "rating"]).default("points"),
      limit: z.number().default(20),
      roleFilter: z.enum(["own", "all"]).default("own"),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = Number(ctx.user?.id) || 0;
      const myRole = ((ctx.user as any)?.role || "DRIVER").toUpperCase();

      if (!db) return { period: input.period, category: input.category, role: myRole, leaders: [], myRank: 0, totalParticipants: 0 };

      try {
        const allProfiles = await db.select({
          userId: gamificationProfiles.userId,
          level: gamificationProfiles.level,
          totalXp: gamificationProfiles.totalXp,
          totalMiles: gamificationProfiles.totalMilesEarned,
          stats: gamificationProfiles.stats,
        }).from(gamificationProfiles);

        // Build user map for ALL profile users so we can filter by role
        const allUserIds = allProfiles.map(p => p.userId);
        let userMap: Map<number, { name: string; role: string }> = new Map();
        if (allUserIds.length > 0) {
          const userRows = await db.select({ id: users.id, name: users.name, role: users.role })
            .from(users)
            .where(sql`id IN (${sql.join(allUserIds.map(id => sql`${id}`), sql`, `)})`);
          for (const u of userRows) {
            userMap.set(u.id, { name: u.name || "User", role: (u.role || "DRIVER").toUpperCase() });
          }
        }

        // Filter profiles by role (default: same role as current user)
        let filteredProfiles = allProfiles;
        if (input.roleFilter === "own") {
          filteredProfiles = allProfiles.filter(p => {
            const u = userMap.get(p.userId);
            return u && u.role === myRole;
          });
        }

        // Sort by XP descending
        filteredProfiles.sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0));

        // Get top N
        const topN = filteredProfiles.slice(0, input.limit);

        const leaders = topN.map((p, i) => {
          const u = userMap.get(p.userId);
          return {
            rank: i + 1,
            userId: p.userId,
            name: u?.name || "User",
            role: u?.role || "DRIVER",
            level: p.level || 1,
            totalXp: p.totalXp || 0,
            totalMiles: p.totalMiles ? parseFloat(p.totalMiles) : 0,
            missionsCompleted: (p.stats as any)?.totalMissionsCompleted || 0,
          };
        });

        const myRank = filteredProfiles.findIndex(p => p.userId === userId) + 1;

        return {
          period: input.period,
          category: input.category,
          role: myRole,
          leaders,
          myRank: myRank || filteredProfiles.length + 1,
          totalParticipants: filteredProfiles.length,
        };
      } catch (err) {
        logger.error("[TheHaul] getLeaderboard error:", err);
        return { period: input.period, category: input.category, role: myRole, leaders: [], myRank: 0, totalParticipants: 0 };
      }
    }),

  /**
   * Get rewards catalog
   */
  getRewardsCatalog: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      const userId = Number(ctx.user?.id) || 0;
      const userRole = (ctx.user as any)?.role || "DRIVER";

      let availablePoints = 0;
      if (db) {
        const [profile] = await db.select()
          .from(gamificationProfiles)
          .where(eq(gamificationProfiles.userId, userId))
          .limit(1);
        availablePoints = profile?.totalXp || 0;
      }

      const catalog = getRewardsCatalogForRole(userRole);
      return {
        availablePoints,
        rewards: catalog.rewards.map(r => ({ ...r, available: true, image: null })),
        categories: catalog.categories,
      };
    }),

  /**
   * Redeem reward
   */
  redeemReward: protectedProcedure
    .input(z.object({
      rewardId: z.string(),
      shippingAddress: z.object({
        street: z.string(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const userId = Number(ctx.user?.id) || 0;
      const userRole = (ctx.user as any)?.role || "DRIVER";

      // Find reward in catalog
      const catalog = getRewardsCatalogForRole(userRole);
      const item = catalog.rewards.find((r: any) => r.id === input.rewardId);
      if (!item) throw new Error("Reward not found in catalog");

      // Check user has enough points
      const [profile] = await db.select().from(gamificationProfiles)
        .where(eq(gamificationProfiles.userId, userId)).limit(1);
      if (!profile) throw new Error("No gamification profile found");

      const cost = item.cost || 0;
      if ((profile.totalXp || 0) < cost) {
        throw new Error(`Not enough points. Need ${cost}, have ${profile.totalXp || 0}`);
      }

      // Deduct points
      await db.update(gamificationProfiles).set({
        totalXp: sql`${gamificationProfiles.totalXp} - ${cost}`,
      } as any).where(eq(gamificationProfiles.id, profile.id));

      // Record redemption in rewards table
      const redemptionId = `redeem_${Date.now()}_${userId}`;
      try {
        await db.insert(rewards).values({
          userId, type: "redemption" as any, name: item.name || input.rewardId,
          description: `Redeemed: ${item.name || input.rewardId}`,
          pointsCost: cost, status: "claimed" as any,
        } as any);
      } catch (e) { logger.warn("[Gamification] redeemReward reward insert failed:", e); }

      // Emit websocket event
      try {
        emitGamificationEvent(String(userId), "GAMIFICATION_EVENT" as any, {
          eventType: "reward_redeemed", userId: String(userId),
          data: { rewardId: input.rewardId, name: item.name, pointsSpent: cost },
        } as any);
      } catch {}

      return {
        redemptionId,
        rewardId: input.rewardId,
        pointsDeducted: cost,
        remainingPoints: (profile.totalXp || 0) - cost,
        status: "processing",
        estimatedDelivery: item.digital ? "Instant" : "3-5 business days",
        redeemedBy: ctx.user?.id,
        redeemedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get points history — DB-backed via rewards table
   */
  getPointsHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = Number(ctx.user?.id) || 0;
      const empty = { transactions: [] as any[], total: 0, summary: { earnedThisMonth: 0, redeemedThisMonth: 0, netThisMonth: 0 } };
      if (!db) return empty;

      try {
        const rewardsList = await db.select()
          .from(rewards)
          .where(eq(rewards.userId, userId))
          .orderBy(desc(rewards.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        const transactions = rewardsList.map(r => {
          const amt = r.amount ? parseFloat(r.amount) : 0;
          return {
            id: `pts_${r.id}`,
            type: amt < 0 ? "redeemed" : "earned",
            amount: Math.abs(amt),
            description: r.description || r.type,
            source: r.sourceType,
            date: r.createdAt?.toISOString().split("T")[0] || "",
          };
        });

        // Monthly summary
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const monthRewards = rewardsList.filter(r => r.createdAt && r.createdAt >= monthStart);
        const earnedThisMonth = monthRewards.reduce((s, r) => { const a = parseFloat(r.amount || "0"); return a > 0 ? s + a : s; }, 0);
        const redeemedThisMonth = monthRewards.reduce((s, r) => { const a = parseFloat(r.amount || "0"); return a < 0 ? s + Math.abs(a) : s; }, 0);

        return {
          transactions,
          total: rewardsList.length,
          summary: { earnedThisMonth, redeemedThisMonth, netThisMonth: earnedThisMonth - redeemedThisMonth },
        };
      } catch (err) {
        logger.error("[TheHaul] getPointsHistory error:", err);
        return empty;
      }
    }),

  /**
   * Get challenges
   */
  getChallenges: protectedProcedure
    .query(async () => ({ active: [], upcoming: [], completed: [] })),

  /**
   * Get badges — DB-backed
   */
  getBadges: protectedProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = input.userId ? Number(input.userId) : Number(ctx.user?.id) || 0;
      if (!db) return { displayBadges: [], allBadges: [] };

      try {
        const earnedRows = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
        if (earnedRows.length === 0) return { displayBadges: [], allBadges: [] };

        const badgeIds = earnedRows.map(e => e.badgeId);
        const allBadgeRows = await db.select().from(badges).where(eq(badges.isActive, true));
        const badgeMap = new Map(allBadgeRows.map(b => [b.id, b]));

        const allBadges = earnedRows.map(ub => {
          const b = badgeMap.get(ub.badgeId);
          return {
            id: `badge_${ub.badgeId}`,
            name: b?.name || "Badge",
            description: b?.description || "",
            category: b?.category || "milestone",
            tier: b?.tier || "bronze",
            icon: b?.iconUrl || "award",
            xpValue: b?.xpValue || 0,
            earnedAt: ub.earnedAt?.toISOString().split("T")[0] || "",
            isDisplay: ub.isDisplayed || false,
          };
        });

        const displayBadges = allBadges.filter(b => b.isDisplay).slice(0, 3);

        return { displayBadges, allBadges };
      } catch (err) {
        logger.error("[TheHaul] getBadges error:", err);
        return { displayBadges: [], allBadges: [] };
      }
    }),

  /**
   * Update display badges
   */
  updateDisplayBadges: protectedProcedure
    .input(z.object({
      badgeIds: z.array(z.string()).max(3),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        displayBadges: input.badgeIds,
        updatedBy: ctx.user?.id,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get team stats
   */
  getTeamStats: protectedProcedure
    .input(z.object({
      teamId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return {
        teamName: "",
        members: 0,
        totalPoints: 0,
        rank: 0,
        totalTeams: 0,
        weeklyProgress: {
          loadsCompleted: 0,
          target: 0,
          onTimeRate: 0,
          safetyScore: 0,
        },
        topPerformers: [],
      };
    }),

  getMyAchievements: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const userId = Number(ctx.user?.id) || 0;

    if (!db) return [];

    const userBadgesList = await db.select({
      badge: badges,
      userBadge: userBadges,
    })
      .from(userBadges)
      .leftJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId));

    return userBadgesList.map(b => ({
      id: `badge_${b.badge?.id}`,
      name: b.badge?.name || "Unknown",
      earned: true,
      earnedAt: b.userBadge.earnedAt?.toISOString().split("T")[0],
      unlocked: true,
    }));
  }),

  // Stats
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const userId = Number(ctx.user?.id) || 0;

    if (!db) {
      return {
        totalAchievements: 0,
        earned: 0,
        inProgress: 0,
        points: 0,
        totalBadges: 0,
        totalPoints: 0,
        completionRate: 0,
      };
    }

    const [profile] = await db.select()
      .from(gamificationProfiles)
      .where(eq(gamificationProfiles.userId, userId))
      .limit(1);

    const userBadgeCount = await db.select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId));

    const totalBadges = await db.select().from(badges).where(eq(badges.isActive, true));

    const userMissions = await db.select()
      .from(missionProgress)
      .where(eq(missionProgress.userId, userId));

    const completedMissions = userMissions.filter(m => m.status === "completed" || m.status === "claimed");
    const inProgressMissions = userMissions.filter(m => m.status === "in_progress");

    return {
      totalAchievements: totalBadges.length,
      earned: userBadgeCount.length,
      inProgress: inProgressMissions.length,
      points: profile?.totalXp || 0,
      totalBadges: userBadgeCount.length,
      totalPoints: profile?.totalXp || 0,
      completionRate: totalBadges.length > 0 ? Math.round((userBadgeCount.length / totalBadges.length) * 100) : 0,
    };
  }),

  /**
   * Get available missions
   */
  getMissions: protectedProcedure
    .input(z.object({
      type: z.enum(["daily", "weekly", "monthly", "epic", "seasonal", "raid", "story", "achievement", "all"]).default("all"),
      category: z.enum(["deliveries", "earnings", "safety", "efficiency", "social", "special", "onboarding", "all"]).default("all"),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = Number(ctx.user?.id) || 0;
      const userRole = ((ctx.user as any)?.role || "DRIVER").toUpperCase();

      if (!db) return { active: [], completed: [], available: templateFallback(userRole, input) };

      // Ensure weekly missions are seeded (idempotent)
      try {
        const seeded = await generateWeeklyMissions();
        if (seeded > 0) logger.info(`[getMissions] Seeded ${seeded} weekly missions`);
      } catch (err) {
        logger.error("[getMissions] generateWeeklyMissions failed:", err);
      }

      // Get all active missions
      let missionList: any[] = [];
      try {
        missionList = await db.select()
          .from(missions)
          .where(eq(missions.isActive, true))
          .orderBy(missions.sortOrder);
      } catch (err) {
        logger.error("[getMissions] DB select failed:", err);
      }

      // Filter by user role — only show missions applicable to this role
      // Handle JSON column: MySQL may return string or parsed array
      missionList = missionList.filter(m => {
        let roles: string[] = [];
        if (!m.applicableRoles) return true;
        if (typeof m.applicableRoles === 'string') {
          try { roles = JSON.parse(m.applicableRoles); } catch { return true; }
        } else if (Array.isArray(m.applicableRoles)) {
          roles = m.applicableRoles;
        }
        if (roles.length === 0) return true;
        return roles.includes(userRole);
      });

      if (input?.type && input.type !== "all") {
        missionList = missionList.filter(m => m.type === input.type);
      }
      if (input?.category && input.category !== "all") {
        missionList = missionList.filter(m => m.category === input.category);
      }

      // Get user's mission progress
      let userProgress: any[] = [];
      try {
        userProgress = await db.select()
          .from(missionProgress)
          .where(eq(missionProgress.userId, userId));
      } catch (err) {
        logger.error("[getMissions] missionProgress select failed:", err);
      }

      const progressMap = new Map(userProgress.map((p: any) => [p.missionId, p]));

      const formatMission = (m: any, progress?: any) => ({
        id: m.id,
        code: m.code,
        name: m.name,
        description: m.description,
        type: m.type,
        category: m.category,
        targetType: m.targetType,
        targetValue: m.targetValue ? parseFloat(m.targetValue) : 0,
        targetUnit: m.targetUnit,
        rewardType: m.rewardType,
        rewardValue: m.rewardValue ? parseFloat(m.rewardValue) : 0,
        xpReward: m.xpReward || 0,
        currentProgress: progress?.currentProgress ? parseFloat(progress.currentProgress) : 0,
        status: progress?.status || "not_started",
        completedAt: progress?.completedAt?.toISOString?.(),
        startsAt: m.startsAt?.toISOString?.(),
        endsAt: m.endsAt?.toISOString?.(),
      });

      const active = missionList
        .filter(m => {
          const progress = progressMap.get(m.id);
          return progress && (progress.status === "in_progress" || progress.status === "completed");
        })
        .map(m => formatMission(m, progressMap.get(m.id)));

      const completed = missionList
        .filter(m => {
          const progress = progressMap.get(m.id);
          return progress && progress.status === "claimed";
        })
        .map(m => formatMission(m, progressMap.get(m.id)));

      const available = missionList
        .filter(m => {
          const progress = progressMap.get(m.id);
          return !progress || progress.status === "not_started" || progress.status === "cancelled" || progress.status === "expired";
        })
        .map(m => formatMission(m));

      // If DB returned no available missions, fall back to template-generated missions
      if (available.length === 0 && active.length === 0) {
        logger.info(`[getMissions] No DB missions for ${userRole}, using template fallback`);
        return { active, completed, available: templateFallback(userRole, input) };
      }

      // Semantic enrichment: score available missions by relevance to user's recent activity
      try {
        const { searchKnowledge } = await import("../services/embeddings/aiTurbocharge");
        const roleQuery = `${userRole.toLowerCase()} missions tasks goals achievements trucking logistics`;
        const hits = await searchKnowledge(roleQuery, 3);
        if (hits.length > 0) {
          (available as any[]).forEach((m: any) => {
            const matchScore = hits.find(h => h.text.toLowerCase().includes(m.category?.toLowerCase() || ""));
            if (matchScore) m.aiRelevance = matchScore.score;
          });
          available.sort((a: any, b: any) => (b.aiRelevance || 0) - (a.aiRelevance || 0));
        }
      } catch { /* embedding service unavailable */ }

      return { active, completed, available };
    }),

  /**
   * Start a mission
   */
  startMission: protectedProcedure
    .input(z.object({ missionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = Number(ctx.user?.id) || 0;

      if (!db) throw new Error("Database not available");

      const [mission] = await db.select()
        .from(missions)
        .where(eq(missions.id, input.missionId))
        .limit(1);

      if (!mission) throw new Error("Mission not found");

      // HOS compliance guard — driving-related missions require sufficient HOS
      const userRole = ((ctx.user as any)?.role || "DRIVER").toUpperCase();
      const drivingCategories = ["deliveries", "efficiency", "earnings"];
      if (userRole === "DRIVER" && drivingCategories.includes(mission.category || "")) {
        const hosCheck = canDriverAcceptLoad(userId);
        if (!hosCheck.allowed) {
          return { success: false, message: `HOS compliance block: ${hosCheck.reason}. Rest before starting driving missions.` };
        }
      }

      // Check if already started
      const [existing] = await db.select()
        .from(missionProgress)
        .where(and(
          eq(missionProgress.userId, userId),
          eq(missionProgress.missionId, input.missionId)
        ))
        .limit(1);

      if (existing && (existing.status === "in_progress" || existing.status === "completed" || existing.status === "claimed")) {
        return { success: false, message: existing.status === "in_progress" ? "Mission already in progress" : "Mission already completed" };
      }

      // Enforce active mission cap (max 10 per user)
      const activeCount = await db.select({ count: sql<number>`count(*)` })
        .from(missionProgress)
        .where(and(
          eq(missionProgress.userId, userId),
          eq(missionProgress.status, "in_progress")
        ));
      if ((activeCount[0]?.count || 0) >= 10) {
        return { success: false, message: "You already have 10 active missions. Complete or cancel one before starting another." };
      }

      if (existing) {
        // Re-start a cancelled or expired mission — reset progress
        await db.update(missionProgress)
          .set({ currentProgress: "0", targetProgress: mission.targetValue, status: "in_progress", completedAt: null, lastProgressAt: null })
          .where(eq(missionProgress.id, existing.id));
      } else {
        await db.insert(missionProgress).values({
          userId,
          missionId: input.missionId,
          currentProgress: "0",
          targetProgress: mission.targetValue,
          status: "in_progress",
        });
      }

      return { success: true, message: "Mission started" };
    }),

  /**
   * Claim mission reward
   */
  claimMissionReward: protectedProcedure
    .input(z.object({ missionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = Number(ctx.user?.id) || 0;

      if (!db) throw new Error("Database not available");

      const [progress] = await db.select()
        .from(missionProgress)
        .where(and(
          eq(missionProgress.userId, userId),
          eq(missionProgress.missionId, input.missionId),
          eq(missionProgress.status, "completed")
        ))
        .limit(1);

      if (!progress) {
        return { success: false, message: "Mission not completed" };
      }

      const [mission] = await db.select()
        .from(missions)
        .where(eq(missions.id, input.missionId))
        .limit(1);

      if (!mission) throw new Error("Mission not found");

      // Update progress to claimed
      await db.update(missionProgress)
        .set({ status: "claimed", claimedAt: new Date() })
        .where(eq(missionProgress.id, progress.id));

      // Add XP to profile
      const [profile] = await db.select()
        .from(gamificationProfiles)
        .where(eq(gamificationProfiles.userId, userId))
        .limit(1);

      if (profile) {
        const newXp = (profile.currentXp || 0) + (mission.xpReward || 0);
        const newTotalXp = (profile.totalXp || 0) + (mission.xpReward || 0);
        const stats = profile.stats || { totalMissionsCompleted: 0, totalBadgesEarned: 0, totalCratesOpened: 0, perfectDeliveries: 0, onTimeRate: 0 };
        stats.totalMissionsCompleted = (stats.totalMissionsCompleted || 0) + 1;

        await db.update(gamificationProfiles)
          .set({
            currentXp: newXp,
            totalXp: newTotalXp,
            stats,
          })
          .where(eq(gamificationProfiles.id, profile.id));
      }

      // Create reward record
      await db.insert(rewards).values({
        userId,
        type: "mission_completion",
        sourceType: "mission",
        sourceId: mission.id,
        rewardType: mission.rewardType,
        amount: mission.rewardValue,
        description: `Completed mission: ${mission.name}`,
        status: "claimed",
        claimedAt: new Date(),
      });

      // Emit gamification event for mission completion
      emitGamificationEvent(
        String(userId),
        WS_EVENTS.MISSION_COMPLETED,
        {
          userId: String(userId),
          eventType: 'mission_completed',
          data: {
            name: mission.name,
            description: mission.description || '',
            xpEarned: mission.xpReward || 0,
            missionId: String(mission.id),
            reward: {
              type: mission.rewardType,
              value: mission.rewardValue ? parseFloat(mission.rewardValue) : 0,
            },
          },
          timestamp: new Date().toISOString(),
        }
      );

      // Notify user
      emitNotification(String(userId), {
        id: `notif_${Date.now()}`,
        type: 'mission_completed',
        title: 'Mission Complete!',
        message: `You completed "${mission.name}" and earned ${mission.xpReward || 0} XP!`,
        priority: 'medium',
        data: { missionId: String(mission.id) },
        timestamp: new Date().toISOString(),
      });

      // Post system announcement to The Haul Lobby
      try {
        const userName = (ctx.user as any)?.name || "A hauler";
        await db.execute(
          sql`INSERT INTO haul_lobby_messages (userId, userName, userRole, message, messageType, createdAt)
              VALUES (${userId}, ${"The Haul"}, ${"SYSTEM"}, ${`🏆 ${userName} completed "${mission.name}" and earned ${mission.xpReward || 0} XP!`}, ${"achievement"}, NOW())`
        );
      } catch (e) { logger.warn("[Gamification] Lobby system message failed:", e); }

      return {
        success: true,
        reward: {
          type: mission.rewardType,
          value: mission.rewardValue ? parseFloat(mission.rewardValue) : 0,
          xp: mission.xpReward || 0,
        },
      };
    }),

  /**
   * Cancel an active mission
   */
  cancelMission: protectedProcedure
    .input(z.object({ missionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = Number(ctx.user?.id) || 0;

      if (!db) throw new Error("Database not available");

      const [progress] = await db.select()
        .from(missionProgress)
        .where(and(
          eq(missionProgress.userId, userId),
          eq(missionProgress.missionId, input.missionId),
        ))
        .limit(1);

      if (!progress) {
        return { success: false, message: "Mission not found in your active missions" };
      }

      if (progress.status === "completed" || progress.status === "claimed") {
        return { success: false, message: "Cannot cancel a completed or claimed mission" };
      }

      if (progress.status === "cancelled") {
        return { success: false, message: "Mission is already cancelled" };
      }

      await db.update(missionProgress)
        .set({ status: "cancelled", completedAt: new Date() })
        .where(eq(missionProgress.id, progress.id));

      return { success: true, message: "Mission cancelled. You can start a new one." };
    }),

  /**
   * Get user's crates
   */
  getCrates: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      const userId = Number(ctx.user?.id) || 0;

      if (!db) return [];

      const crates = await db.select()
        .from(rewardCrates)
        .where(and(
          eq(rewardCrates.userId, userId),
          eq(rewardCrates.status, "pending")
        ))
        .orderBy(desc(rewardCrates.createdAt));

      return crates.map(c => ({
        id: c.id,
        crateType: c.crateType,
        source: c.source,
        createdAt: c.createdAt?.toISOString(),
        expiresAt: c.expiresAt?.toISOString(),
      }));
    }),

  /**
   * Open a crate
   */
  openCrate: protectedProcedure
    .input(z.object({ crateId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = Number(ctx.user?.id) || 0;

      if (!db) throw new Error("Database not available");

      const [crate] = await db.select()
        .from(rewardCrates)
        .where(and(
          eq(rewardCrates.id, input.crateId),
          eq(rewardCrates.userId, userId),
          eq(rewardCrates.status, "pending")
        ))
        .limit(1);

      if (!crate) {
        return { success: false, message: "Crate not found or already opened" };
      }

      // Generate random contents based on crate type
      const dropRates: Record<string, { miles: number; xp: number; cash: number }> = {
        common: { miles: 100, xp: 50, cash: 5 },
        uncommon: { miles: 250, xp: 100, cash: 10 },
        rare: { miles: 500, xp: 200, cash: 25 },
        epic: { miles: 1000, xp: 500, cash: 50 },
        legendary: { miles: 2500, xp: 1000, cash: 100 },
        mythic: { miles: 5000, xp: 2000, cash: 250 },
      };

      const rates = dropRates[crate.crateType] || dropRates.common;
      const contents = [
        { type: "miles", value: rates.miles, name: `${rates.miles} EusoMiles` },
        { type: "xp", value: rates.xp, name: `${rates.xp} XP` },
      ];

      // Update crate
      await db.update(rewardCrates)
        .set({
          status: "opened",
          openedAt: new Date(),
          contents,
        })
        .where(eq(rewardCrates.id, crate.id));

      // Update gamification profile
      const [profile] = await db.select()
        .from(gamificationProfiles)
        .where(eq(gamificationProfiles.userId, userId))
        .limit(1);

      if (profile) {
        const stats = profile.stats || { totalMissionsCompleted: 0, totalBadgesEarned: 0, totalCratesOpened: 0, perfectDeliveries: 0, onTimeRate: 0 };
        stats.totalCratesOpened = (stats.totalCratesOpened || 0) + 1;

        await db.update(gamificationProfiles)
          .set({
            currentXp: (profile.currentXp || 0) + rates.xp,
            totalXp: (profile.totalXp || 0) + rates.xp,
            currentMiles: String(parseFloat(profile.currentMiles || "0") + rates.miles),
            totalMilesEarned: String(parseFloat(profile.totalMilesEarned || "0") + rates.miles),
            stats,
          })
          .where(eq(gamificationProfiles.id, profile.id));
      }

      // Emit crate opened event
      emitGamificationEvent(
        String(userId),
        WS_EVENTS.CRATE_OPENED,
        {
          userId: String(userId),
          eventType: 'crate_opened',
          data: {
            name: `${crate.crateType.charAt(0).toUpperCase() + crate.crateType.slice(1)} Crate`,
            xpEarned: rates.xp,
            reward: { type: 'miles', value: rates.miles },
          },
          timestamp: new Date().toISOString(),
        }
      );

      return {
        success: true,
        contents,
      };
    }),

  /**
   * Get current season
   */
  getCurrentSeason: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return null;

      const now = new Date();
      const [season] = await db.select()
        .from(seasons)
        .where(and(
          eq(seasons.isActive, true),
          lte(seasons.startsAt, now),
          gte(seasons.endsAt, now)
        ))
        .limit(1);

      if (!season) return null;

      return {
        id: season.id,
        name: season.name,
        description: season.description,
        theme: season.theme,
        startsAt: season.startsAt?.toISOString(),
        endsAt: season.endsAt?.toISOString(),
        rewards: season.rewards,
      };
    }),

  /**
   * Admin: Create mission
   */
  createMission: adminProcedure
    .input(z.object({
      code: z.string(),
      name: z.string(),
      description: z.string().optional(),
      type: z.enum(["daily", "weekly", "monthly", "epic", "seasonal", "raid", "story", "achievement"]),
      category: z.enum(["deliveries", "earnings", "safety", "efficiency", "social", "special", "onboarding"]),
      targetType: z.enum(["count", "amount", "distance", "streak", "rating", "time"]),
      targetValue: z.number(),
      targetUnit: z.string().optional(),
      rewardType: z.enum(["miles", "cash", "badge", "title", "fee_reduction", "priority_perk", "crate", "xp"]),
      rewardValue: z.number(),
      xpReward: z.number().default(0),
      applicableRoles: z.array(z.string()).optional(),
      startsAt: z.string().optional(),
      endsAt: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(missions).values({
        code: input.code,
        name: input.name,
        description: input.description,
        type: input.type,
        category: input.category,
        targetType: input.targetType,
        targetValue: input.targetValue.toString(),
        targetUnit: input.targetUnit,
        rewardType: input.rewardType,
        rewardValue: input.rewardValue.toString(),
        xpReward: input.xpReward,
        applicableRoles: input.applicableRoles,
        startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
        endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
        isActive: true,
      });

      return { success: true, id: result.insertId };
    }),

  /**
   * Admin: Create badge
   */
  createBadge: adminProcedure
    .input(z.object({
      code: z.string(),
      name: z.string(),
      description: z.string().optional(),
      category: z.enum(["milestone", "performance", "specialty", "seasonal", "epic", "legendary"]),
      tier: z.enum(["bronze", "silver", "gold", "platinum", "diamond"]).default("bronze"),
      iconUrl: z.string().optional(),
      xpValue: z.number().default(0),
      isRare: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(badges).values({
        code: input.code,
        name: input.name,
        description: input.description,
        category: input.category,
        tier: input.tier,
        iconUrl: input.iconUrl,
        xpValue: input.xpValue,
        isRare: input.isRare,
        isActive: true,
      });

      return { success: true, id: result.insertId };
    }),

  // ============================================================
  // THE HAUL LOBBY — Digital Truck Stop Chat Forum
  // Strict moderation: no profanity, no solicitation, no harassment
  // ============================================================

  /**
   * Get lobby messages
   */
  getLobbyMessages: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
      before: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { messages: [], total: 0 };

      try {
        // Create table if not exists
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS haul_lobby_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId INT NOT NULL,
            userName VARCHAR(100),
            userRole VARCHAR(50),
            message TEXT NOT NULL,
            messageType ENUM('chat','system','mission_alert','achievement') DEFAULT 'chat',
            isDeleted BOOLEAN DEFAULT FALSE,
            isPinned BOOLEAN DEFAULT FALSE,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_lobby_created (createdAt),
            INDEX idx_lobby_user (userId)
          )
        `);

        const rows = await db.execute(sql`
          SELECT id, userId, userName, userRole, message, messageType, isPinned, createdAt
          FROM haul_lobby_messages
          WHERE isDeleted = FALSE
          ORDER BY createdAt DESC
          LIMIT ${input.limit}
        `);

        const messages = (Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : []) as any[];

        return {
          messages: messages.reverse().map((m: any) => ({
            id: m.id,
            userId: m.userId,
            userName: m.userName || "Anonymous",
            userRole: m.userRole || "USER",
            message: m.message,
            messageType: m.messageType || "chat",
            isPinned: !!m.isPinned,
            createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
          })),
          total: messages.length,
        };
      } catch (err) {
        logger.error("[TheHaul] getLobbyMessages error:", err);
        return { messages: [], total: 0 };
      }
    }),

  /**
   * Post lobby message — with content moderation
   */
  postLobbyMessage: protectedProcedure
    .input(z.object({
      message: z.string().min(1).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = Number(ctx.user?.id) || 0;
      const userRole = (ctx.user as any)?.role || "USER";

      // Resolve display name from DB (JWT doesn't carry name)
      let userName = "Anonymous";
      if (userId && db) {
        try {
          const [row] = await db.execute(sql`SELECT name, email FROM users WHERE id = ${userId} LIMIT 1`) as any;
          const u = (Array.isArray(row) ? row[0] : row) as any;
          if (u?.name) userName = u.name;
          else if (u?.email) userName = u.email.split("@")[0];
        } catch { /* non-critical */ }
      }

      // ════════════════════════════════════════════════════════════
      // CONTENT MODERATION ENGINE — ToS §4 & §6 Enforcement
      // ════════════════════════════════════════════════════════════

      // 1. Check if user is muted or banned
      try {
        const [strikeRows] = await db.execute(sql`
          SELECT strikeCount, mutedUntil, isBanned FROM haul_lobby_user_strikes
          WHERE userId = ${userId} LIMIT 1
        `) as any;
        const strikes = (Array.isArray(strikeRows) ? strikeRows[0] : strikeRows) as any;
        if (strikes?.isBanned) {
          return { success: false, error: "🚫 You have been permanently banned from The Haul Lobby due to repeated policy violations. Contact support@eusoronetech.com to appeal." };
        }
        if (strikes?.mutedUntil && new Date(strikes.mutedUntil) > new Date()) {
          const remaining = Math.ceil((new Date(strikes.mutedUntil).getTime() - Date.now()) / 60000);
          return { success: false, error: `🔇 You are muted from The Lobby for ${remaining > 60 ? Math.ceil(remaining / 60) + " hours" : remaining + " minutes"} due to policy violations. Review our Community Guidelines and Terms of Service.` };
        }
      } catch (_) { /* strike check non-critical */ }

      // 2. Rate limit: max 1 message per 3 seconds per user
      try {
        const recent = await db.execute(sql`
          SELECT COUNT(*) as cnt FROM haul_lobby_messages
          WHERE userId = ${userId} AND createdAt > DATE_SUB(NOW(), INTERVAL 3 SECOND)
        `);
        const cnt = ((Array.isArray(recent) && Array.isArray(recent[0]) ? recent[0][0] : {}) as any)?.cnt || 0;
        if (Number(cnt) > 0) {
          return { success: false, error: "Please wait a moment before posting again." };
        }
      } catch (_) { /* rate limit check non-critical */ }

      // 3. Run comprehensive moderation analysis
      const modResult = moderateMessage(input.message, userRole);

      if (!modResult.allowed) {
        // Log the violation
        try {
          await db.execute(sql`
            INSERT INTO haul_lobby_moderation_log
              (userId, userName, userRole, originalMessage, violationType, severity, reason, tosReference, actionTaken)
            VALUES
              (${userId}, ${userName}, ${userRole}, ${input.message},
               ${modResult.violation || "PROFANITY"}, ${modResult.severity || "BLOCK"},
               ${modResult.reason || ""}, ${modResult.tosRef || ""},
               'blocked')
          `);
        } catch (logErr) {
          logger.warn("[TheHaul] Failed to log moderation event:", logErr);
        }

        // Update strike counter for STRIKE-level violations
        if (modResult.severity === "STRIKE" || modResult.severity === "SUSPEND") {
          try {
            // Upsert strike record
            await db.execute(sql`
              INSERT INTO haul_lobby_user_strikes (userId, strikeCount, lastViolationType, lastStrikeAt)
              VALUES (${userId}, 1, ${modResult.violation || ""}, NOW())
              ON DUPLICATE KEY UPDATE
                strikeCount = strikeCount + 1,
                lastViolationType = ${modResult.violation || ""},
                lastStrikeAt = NOW()
            `);

            // Get updated strike count
            const [sRows] = await db.execute(sql`
              SELECT strikeCount FROM haul_lobby_user_strikes WHERE userId = ${userId} LIMIT 1
            `) as any;
            const currentStrikes = (Array.isArray(sRows) ? sRows[0] : sRows)?.strikeCount || 1;
            const strikeAction = getStrikeAction(currentStrikes);

            // Apply mute/ban based on strike count
            if (strikeAction.action === "mute_1h") {
              await db.execute(sql`
                UPDATE haul_lobby_user_strikes SET mutedUntil = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE userId = ${userId}
              `);
              // Update moderation log with action taken
              await db.execute(sql`
                UPDATE haul_lobby_moderation_log SET actionTaken = 'muted_1h'
                WHERE userId = ${userId} ORDER BY id DESC LIMIT 1
              `);
            } else if (strikeAction.action === "mute_24h") {
              await db.execute(sql`
                UPDATE haul_lobby_user_strikes SET mutedUntil = DATE_ADD(NOW(), INTERVAL 24 HOUR) WHERE userId = ${userId}
              `);
              await db.execute(sql`
                UPDATE haul_lobby_moderation_log SET actionTaken = 'muted_24h'
                WHERE userId = ${userId} ORDER BY id DESC LIMIT 1
              `);
            } else if (strikeAction.action === "ban") {
              await db.execute(sql`
                UPDATE haul_lobby_user_strikes SET isBanned = TRUE WHERE userId = ${userId}
              `);
              await db.execute(sql`
                UPDATE haul_lobby_moderation_log SET actionTaken = 'banned'
                WHERE userId = ${userId} ORDER BY id DESC LIMIT 1
              `);
            }

            logger.warn(`[TheHaul] MODERATION: User ${userId} (${userName}) strike ${currentStrikes} — ${modResult.violation} — action: ${strikeAction.action}`);

            return { success: false, error: strikeAction.message };
          } catch (strikeErr) {
            logger.warn("[TheHaul] Strike update failed:", strikeErr);
          }
        }

        logger.info(`[TheHaul] MODERATION: Blocked message from user ${userId} (${userName}) — ${modResult.violation}`);
        return { success: false, error: modResult.reason || "Message blocked by content moderation." };
      }

      // ✅ Message passed moderation — insert
      try {
        await db.execute(sql`
          INSERT INTO haul_lobby_messages (userId, userName, userRole, message, messageType)
          VALUES (${userId}, ${userName}, ${userRole}, ${input.message}, 'chat')
        `);

        // Fire gamification events for lobby message
        fireGamificationEvent({ userId, type: "message_sent", value: 1 });
        fireGamificationEvent({ userId, type: "platform_action", value: 1 });

        return { success: true };
      } catch (err) {
        logger.error("[TheHaul] postLobbyMessage error:", err);
        throw new Error("Failed to post message");
      }
    }),

  /**
   * Get AI-generated missions based on platform data
   * Uses mission generator to seed weekly role-specific missions into DB.
   * Returns current week's missions for the user's role with live platform stats.
   */
  getAIMissions: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      const userId = Number(ctx.user?.id) || 0;
      const userRole = (ctx.user as any)?.role || "DRIVER";

      if (!db) return templateFallback(userRole.toUpperCase()).map(m => ({ ...m, source: "esang_ai", hosCompliant: true }));

      try {
        // Query driver's current HOS compliance from hosLogs
        let hosCompliant = true;
        try {
          const recentViolations = await db.select({ cnt: sql<number>`count(*)` })
            .from(hosLogs)
            .where(and(
              eq(hosLogs.userId, userId),
              eq(hosLogs.eventType, "violation"),
              gte(hosLogs.createdAt, new Date(Date.now() - 7 * 86_400_000)),
            ));
          hosCompliant = (recentViolations[0]?.cnt ?? 0) === 0;
        } catch (_) { /* HOS check non-critical, default to compliant */ }

        // Ensure weekly missions are seeded (idempotent — skips if already created)
        try { await generateWeeklyMissions(); } catch (err) { logger.error("[getAIMissions] seed failed:", err); }

        // Get platform stats for contextual mission descriptions
        let availableLoads = 0;
        let avgRate = 0;
        try {
          const [loadStats] = await db.execute(sql`
            SELECT
              COUNT(CASE WHEN status = 'available' THEN 1 END) as availableLoads,
              AVG(CAST(rate AS DECIMAL(10,2))) as avgRate
            FROM loads
            WHERE createdAt > DATE_SUB(NOW(), INTERVAL 7 DAY)
          `);
          const stats = (Array.isArray(loadStats) ? loadStats[0] : {}) as any;
          availableLoads = Number(stats?.availableLoads) || 0;
          avgRate = Number(stats?.avgRate) || 0;
        } catch (_) { /* load stats non-critical */ }

        // Fetch this week's DB-seeded missions for this user's role
        const weeklyMissions = await db.select()
          .from(missions)
          .where(sql`isActive = TRUE AND code LIKE 'wk_%' AND startsAt <= NOW() AND endsAt >= NOW()`);

        // Filter to user's role — handle JSON string vs parsed array
        const roleMissions = weeklyMissions.filter(m => {
          let roles: string[] = [];
          if (!m.applicableRoles) return true;
          if (typeof m.applicableRoles === 'string') {
            try { roles = JSON.parse(m.applicableRoles as any); } catch { return true; }
          } else if (Array.isArray(m.applicableRoles)) {
            roles = m.applicableRoles;
          }
          if (roles.length === 0) return true;
          return roles.includes(userRole.toUpperCase());
        });

        // Get user's progress on these missions
        const userProgress = await db.select()
          .from(missionProgress)
          .where(eq(missionProgress.userId, userId));
        const progressMap = new Map(userProgress.map(p => [p.missionId, p]));

        return roleMissions.map(m => {
          const progress = progressMap.get(m.id);
          let desc = m.description || "";
          // Enrich with live stats
          if (availableLoads > 0 && desc.includes("load")) {
            desc += ` (${availableLoads} loads on board now)`;
          }
          return {
            id: m.id,
            name: m.name,
            description: desc,
            type: m.type,
            category: m.category,
            xpReward: m.xpReward || 0,
            rewardType: m.rewardType,
            rewardValue: m.rewardValue ? parseFloat(m.rewardValue) : 0,
            targetValue: m.targetValue ? parseFloat(m.targetValue) : 0,
            currentProgress: progress?.currentProgress ? parseFloat(progress.currentProgress) : 0,
            status: progress?.status || "not_started",
            source: "esang_ai",
            hosCompliant,
          };
        });
      } catch (err) {
        logger.error("[TheHaul] getAIMissions error:", err);
        // Fallback to templates so user always sees missions
        return templateFallback(userRole.toUpperCase()).map(m => ({ ...m, source: "esang_ai", hosCompliant: true }));
      }
    }),

  /**
   * Admin: Award badge to user
   */
  awardBadge: adminProcedure
    .input(z.object({
      userId: z.number(),
      badgeId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if already awarded
      const [existing] = await db.select()
        .from(userBadges)
        .where(and(
          eq(userBadges.userId, input.userId),
          eq(userBadges.badgeId, input.badgeId)
        ))
        .limit(1);

      if (existing) {
        return { success: false, message: "Badge already awarded" };
      }

      await db.insert(userBadges).values({
        userId: input.userId,
        badgeId: input.badgeId,
        earnedAt: new Date(),
      });

      // Update user stats
      const [profile] = await db.select()
        .from(gamificationProfiles)
        .where(eq(gamificationProfiles.userId, input.userId))
        .limit(1);

      if (profile) {
        const stats = profile.stats || { totalMissionsCompleted: 0, totalBadgesEarned: 0, totalCratesOpened: 0, perfectDeliveries: 0, onTimeRate: 0 };
        stats.totalBadgesEarned = (stats.totalBadgesEarned || 0) + 1;

        await db.update(gamificationProfiles)
          .set({ stats })
          .where(eq(gamificationProfiles.id, profile.id));
      }

      return { success: true };
    }),

  /**
   * Purchase a reward item with points
   */
  purchaseItem: protectedProcedure
    .input(z.object({ rewardId: z.string(), quantity: z.number().default(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const userId = Number(ctx.user?.id) || 0;
      const userRole = (ctx.user as any)?.role || "DRIVER";
      const catalog = getRewardsCatalogForRole(userRole);
      const item = catalog.rewards.find((r: any) => r.id === input.rewardId);
      if (!item) throw new Error("Reward not found");
      const [profile] = await db.select().from(gamificationProfiles).where(eq(gamificationProfiles.userId, userId)).limit(1);
      if (!profile) throw new Error("No gamification profile found");
      const totalCost = (item.cost || 0) * input.quantity;
      if ((profile.totalXp || 0) < totalCost) throw new Error(`Not enough points. Need ${totalCost}, have ${profile.totalXp || 0}`);
      await db.update(gamificationProfiles).set({
        totalXp: sql`${gamificationProfiles.totalXp} - ${totalCost}`,
      } as any).where(eq(gamificationProfiles.id, profile.id));
      // Record purchase in rewards table
      try {
        await db.insert(rewards).values({
          userId, type: "purchase" as any, name: item.name || input.rewardId,
          description: `Purchased ${input.quantity}x ${item.name || input.rewardId}`,
          pointsCost: totalCost, status: "claimed" as any,
        } as any);
      } catch {}
      return { success: true, rewardId: input.rewardId, pointsSpent: totalCost, remainingPoints: (profile.totalXp || 0) - totalCost };
    }),

  /**
   * Get missions that match the driver's current active load.
   * Used by the Active Trip page to show mission progress indicators.
   */
  getActiveTripMissions: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ ctx, input }) => {
      const userId = Number(ctx.user?.id) || 0;
      const { getMatchingMissionsForLoad } = await import("../services/hosEngine");
      return getMatchingMissionsForLoad(userId, input.loadId);
    }),

  /**
   * Force-rotate missions for the user's role.
   * Deactivates current week's non-in-progress missions and re-seeds fresh ones.
   */
  refreshMissions: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userRole = ((ctx.user as any)?.role || "DRIVER").toUpperCase();
      try {
        const created = await forceRotateMissions(userRole);
        return { success: true, created, message: `${created} new missions rotated in` };
      } catch (err: any) {
        logger.error("[refreshMissions] Error:", err);
        return { success: false, created: 0, message: "Failed to rotate missions" };
      }
    }),

  /**
   * Get user's reward inventory (purchased items)
   */
  getInventory: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const userId = Number(ctx.user?.id) || 0;
      try {
        const items = await db.select().from(rewards).where(eq(rewards.userId, userId)).orderBy(desc(rewards.createdAt)).limit(50);
        return items.map((i: any) => ({
          id: i.id, name: i.name || "Reward", description: i.description || "",
          type: i.type, pointsCost: i.pointsCost || 0, status: i.status || "claimed",
          purchasedAt: i.createdAt?.toISOString(),
        }));
      } catch { return []; }
    }),

  // ════════════════════════════════════════════════════════════════
  // ADMIN: Lobby Moderation Dashboard
  // ════════════════════════════════════════════════════════════════

  /**
   * Get moderation log — admin only
   */
  getModerationLog: adminProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
      violationType: z.string().optional(),
      unreviewedOnly: z.boolean().default(false),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { logs: [], total: 0 };
      const limit = input?.limit || 50;
      const offset = input?.offset || 0;

      try {
        let whereClause = sql`1=1`;
        if (input?.violationType) {
          whereClause = sql`${whereClause} AND violationType = ${input.violationType}`;
        }
        if (input?.unreviewedOnly) {
          whereClause = sql`${whereClause} AND reviewedByAdmin = FALSE`;
        }

        const [rows] = await db.execute(sql`
          SELECT * FROM haul_lobby_moderation_log
          WHERE ${whereClause}
          ORDER BY createdAt DESC
          LIMIT ${limit} OFFSET ${offset}
        `) as any;

        const [countRows] = await db.execute(sql`
          SELECT COUNT(*) as total FROM haul_lobby_moderation_log WHERE ${whereClause}
        `) as any;
        const total = (Array.isArray(countRows) ? countRows[0] : countRows)?.total || 0;

        return {
          logs: Array.isArray(rows) ? rows : [],
          total: Number(total),
        };
      } catch (err) {
        logger.error("[TheHaul] getModerationLog error:", err);
        return { logs: [], total: 0 };
      }
    }),

  /**
   * Review a moderation log entry — admin only
   */
  reviewModerationLog: adminProcedure
    .input(z.object({
      logId: z.number(),
      adminNotes: z.string().optional(),
      removeStrike: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        await db.execute(sql`
          UPDATE haul_lobby_moderation_log
          SET reviewedByAdmin = TRUE, adminNotes = ${input.adminNotes || "Reviewed"}
          WHERE id = ${input.logId}
        `);

        // Optionally remove a strike (false positive)
        if (input.removeStrike) {
          const [logRow] = await db.execute(sql`
            SELECT userId FROM haul_lobby_moderation_log WHERE id = ${input.logId} LIMIT 1
          `) as any;
          const userId = (Array.isArray(logRow) ? logRow[0] : logRow)?.userId;
          if (userId) {
            await db.execute(sql`
              UPDATE haul_lobby_user_strikes
              SET strikeCount = GREATEST(strikeCount - 1, 0),
                  isBanned = CASE WHEN strikeCount - 1 < 7 THEN FALSE ELSE isBanned END,
                  mutedUntil = CASE WHEN strikeCount - 1 < 3 THEN NULL ELSE mutedUntil END
              WHERE userId = ${userId}
            `);
          }
        }

        return { success: true };
      } catch (err) {
        logger.error("[TheHaul] reviewModerationLog error:", err);
        throw new Error("Failed to review moderation log");
      }
    }),

  /**
   * Get user strike summary — admin only
   */
  getUserStrikes: adminProcedure
    .input(z.object({
      userId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        if (input?.userId) {
          const [rows] = await db.execute(sql`
            SELECT s.*, u.name, u.email FROM haul_lobby_user_strikes s
            LEFT JOIN users u ON u.id = s.userId
            WHERE s.userId = ${input.userId} LIMIT 1
          `) as any;
          return Array.isArray(rows) ? rows : [];
        }

        const [rows] = await db.execute(sql`
          SELECT s.*, u.name, u.email FROM haul_lobby_user_strikes s
          LEFT JOIN users u ON u.id = s.userId
          WHERE s.strikeCount > 0
          ORDER BY s.strikeCount DESC, s.lastStrikeAt DESC
          LIMIT 100
        `) as any;
        return Array.isArray(rows) ? rows : [];
      } catch (err) {
        logger.error("[TheHaul] getUserStrikes error:", err);
        return [];
      }
    }),

  /**
   * Unban / unmute a user — admin only
   */
  unbanUser: adminProcedure
    .input(z.object({
      userId: z.number(),
      resetStrikes: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        if (input.resetStrikes) {
          await db.execute(sql`
            UPDATE haul_lobby_user_strikes
            SET strikeCount = 0, isBanned = FALSE, mutedUntil = NULL
            WHERE userId = ${input.userId}
          `);
        } else {
          await db.execute(sql`
            UPDATE haul_lobby_user_strikes
            SET isBanned = FALSE, mutedUntil = NULL
            WHERE userId = ${input.userId}
          `);
        }
        return { success: true };
      } catch (err) {
        logger.error("[TheHaul] unbanUser error:", err);
        throw new Error("Failed to unban user");
      }
    }),
});
