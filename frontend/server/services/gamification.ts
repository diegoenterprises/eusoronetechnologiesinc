/**
 * GAMIFICATION SYSTEM
 * Points, badges, leaderboards, achievements, and tier management
 */

import { getDb } from "../db";
import { gamificationProfiles, userBadges, badges as badgesTable, rewards, users } from "../../drizzle/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";

export interface UserPoints {
  userId: number;
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";
  level: number;
  rank: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "SAFETY" | "PERFORMANCE" | "MILESTONE" | "SPECIAL";
  points: number;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
}

export interface Achievement {
  id: string;
  userId: number;
  badgeId: string;
  earnedAt: Date;
  progress: number;
  completed: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  userName: string;
  userRole: string;
  points: number;
  tier: string;
  badge?: string;
}

// Point values for different activities
export const POINT_VALUES = {
  // Load/Job completion
  LOAD_COMPLETED: 100,
  LOAD_ON_TIME: 50,
  LOAD_EARLY: 75,
  HAZMAT_LOAD_COMPLETED: 150,
  
  // Safety
  NO_VIOLATIONS_WEEK: 200,
  NO_VIOLATIONS_MONTH: 500,
  PERFECT_INSPECTION: 100,
  SAFETY_TRAINING_COMPLETED: 150,
  
  // Performance
  FIVE_STAR_RATING: 50,
  CUSTOMER_COMPLIMENT: 100,
  FUEL_EFFICIENCY_BONUS: 75,
  ZERO_DETENTION: 50,
  
  // Platform engagement
  PROFILE_COMPLETED: 50,
  DOCUMENT_UPLOADED: 25,
  REFERRAL_SIGNUP: 300,
  DAILY_LOGIN: 10,
  WEEKLY_STREAK: 100,
  
  // Communication
  QUICK_RESPONSE: 25,
  MESSAGE_SENT: 5,
  LOAD_POSTED: 50,
  BID_PLACED: 25,
};

// Badge definitions
export const BADGES: Badge[] = [
  // Safety Badges
  {
    id: "safety_champion",
    name: "Safety Champion",
    description: "Complete 100 loads with zero safety violations",
    icon: "shield-check",
    category: "SAFETY",
    points: 1000,
    rarity: "LEGENDARY",
  },
  {
    id: "perfect_inspector",
    name: "Perfect Inspector",
    description: "Pass 50 consecutive vehicle inspections",
    icon: "clipboard-check",
    category: "SAFETY",
    points: 500,
    rarity: "EPIC",
  },
  {
    id: "hazmat_expert",
    name: "HazMat Expert",
    description: "Complete 50 hazmat loads safely",
    icon: "alert-triangle",
    category: "SAFETY",
    points: 750,
    rarity: "EPIC",
  },
  
  // Performance Badges
  {
    id: "speed_demon",
    name: "Speed Demon",
    description: "Complete 100 loads ahead of schedule",
    icon: "zap",
    category: "PERFORMANCE",
    points: 800,
    rarity: "EPIC",
  },
  {
    id: "five_star_pro",
    name: "Five Star Pro",
    description: "Maintain 5-star rating for 30 days",
    icon: "star",
    category: "PERFORMANCE",
    points: 600,
    rarity: "RARE",
  },
  {
    id: "fuel_master",
    name: "Fuel Master",
    description: "Achieve top 10% fuel efficiency for 3 months",
    icon: "droplet",
    category: "PERFORMANCE",
    points: 700,
    rarity: "EPIC",
  },
  
  // Milestone Badges
  {
    id: "first_load",
    name: "First Load",
    description: "Complete your first load",
    icon: "truck",
    category: "MILESTONE",
    points: 100,
    rarity: "COMMON",
  },
  {
    id: "century_club",
    name: "Century Club",
    description: "Complete 100 loads",
    icon: "award",
    category: "MILESTONE",
    points: 1000,
    rarity: "RARE",
  },
  {
    id: "thousand_miles",
    name: "Thousand Miles",
    description: "Drive 1,000 miles",
    icon: "map",
    category: "MILESTONE",
    points: 500,
    rarity: "RARE",
  },
  {
    id: "veteran",
    name: "Veteran",
    description: "1 year on the platform",
    icon: "calendar",
    category: "MILESTONE",
    points: 2000,
    rarity: "LEGENDARY",
  },
  
  // Special Badges
  {
    id: "early_adopter",
    name: "Early Adopter",
    description: "Joined EusoTrip in the first month",
    icon: "rocket",
    category: "SPECIAL",
    points: 500,
    rarity: "LEGENDARY",
  },
  {
    id: "referral_master",
    name: "Referral Master",
    description: "Refer 10 active users",
    icon: "users",
    category: "SPECIAL",
    points: 1500,
    rarity: "EPIC",
  },
  {
    id: "community_helper",
    name: "Community Helper",
    description: "Help 50 users through messages",
    icon: "heart",
    category: "SPECIAL",
    points: 800,
    rarity: "RARE",
  },
];

// Tier thresholds
export const TIER_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 1000,
  GOLD: 5000,
  PLATINUM: 15000,
  DIAMOND: 50000,
};

// Tier benefits
export const TIER_BENEFITS = {
  BRONZE: {
    name: "Bronze",
    color: "#CD7F32",
    benefits: ["Basic platform access", "Standard support"],
  },
  SILVER: {
    name: "Silver",
    color: "#C0C0C0",
    benefits: ["Priority load matching", "Email support", "5% QuickPay discount"],
  },
  GOLD: {
    name: "Gold",
    color: "#FFD700",
    benefits: ["Premium load matching", "Phone support", "10% QuickPay discount", "Featured profile"],
  },
  PLATINUM: {
    name: "Platinum",
    color: "#E5E4E2",
    benefits: ["AI-powered recommendations", "24/7 support", "15% QuickPay discount", "Priority bidding", "Dedicated account manager"],
  },
  DIAMOND: {
    name: "Diamond",
    color: "#B9F2FF",
    benefits: ["All Platinum benefits", "20% QuickPay discount", "Exclusive loads", "Annual bonus", "VIP events"],
  },
};

/**
 * Calculate user tier based on total points
 */
export function calculateTier(totalPoints: number): keyof typeof TIER_THRESHOLDS {
  if (totalPoints >= TIER_THRESHOLDS.DIAMOND) return "DIAMOND";
  if (totalPoints >= TIER_THRESHOLDS.PLATINUM) return "PLATINUM";
  if (totalPoints >= TIER_THRESHOLDS.GOLD) return "GOLD";
  if (totalPoints >= TIER_THRESHOLDS.SILVER) return "SILVER";
  return "BRONZE";
}

/**
 * Calculate user level based on total points
 * Each level requires 500 points
 */
export function calculateLevel(totalPoints: number): number {
  return Math.floor(totalPoints / 500) + 1;
}

/**
 * Calculate points needed for next tier
 */
export function pointsToNextTier(totalPoints: number): { nextTier: string; pointsNeeded: number } {
  const currentTier = calculateTier(totalPoints);
  
  const tiers = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"] as const;
  const currentIndex = tiers.indexOf(currentTier);
  
  if (currentIndex === tiers.length - 1) {
    return { nextTier: "MAX", pointsNeeded: 0 };
  }
  
  const nextTier = tiers[currentIndex + 1];
  const pointsNeeded = TIER_THRESHOLDS[nextTier] - totalPoints;
  
  return { nextTier, pointsNeeded };
}

/**
 * Award points to a user
 */
export async function awardPoints(
  userId: number,
  points: number,
  reason: string,
  db: any
): Promise<{ success: boolean; newTotal: number; tierUp?: boolean }> {
  const database = db || await getDb();
  if (!database) return { success: false, newTotal: 0, tierUp: false };
  try {
    // Upsert gamification profile
    const [existing] = await database.select().from(gamificationProfiles).where(eq(gamificationProfiles.userId, userId)).limit(1);
    const oldTotal = existing?.totalXp || 0;
    const newTotal = oldTotal + points;
    const oldTier = calculateTier(oldTotal);
    const newTier = calculateTier(newTotal);

    if (existing) {
      await database.update(gamificationProfiles).set({
        totalXp: newTotal,
        currentXp: (existing.currentXp || 0) + points,
        level: calculateLevel(newTotal),
        lastActivityAt: new Date(),
      }).where(eq(gamificationProfiles.userId, userId));
    } else {
      await database.insert(gamificationProfiles).values({
        userId,
        totalXp: newTotal,
        currentXp: points,
        level: calculateLevel(newTotal),
        lastActivityAt: new Date(),
      });
    }

    // Record as reward
    await database.insert(rewards).values({
      userId,
      type: "bonus" as any,
      rewardType: "xp" as any,
      amount: String(points),
      description: reason,
      status: "claimed" as any,
      claimedAt: new Date(),
    });

    return { success: true, newTotal, tierUp: oldTier !== newTier };
  } catch (e) {
    console.error("[Gamification] awardPoints error:", e);
    return { success: false, newTotal: 0, tierUp: false };
  }
}

/**
 * Check and award badge if criteria met
 */
export async function checkBadgeEligibility(
  userId: number,
  badgeId: string,
  db: any
): Promise<{ eligible: boolean; awarded: boolean }> {
  const database = db || await getDb();
  if (!database) return { eligible: false, awarded: false };
  try {
    // Check if user already has this badge
    const [badge] = await database.select().from(badgesTable).where(eq(badgesTable.code, badgeId)).limit(1);
    if (!badge) return { eligible: false, awarded: false };

    const [existing] = await database.select().from(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badge.id))).limit(1);
    if (existing) return { eligible: true, awarded: true };

    // Check criteria if defined on the badge
    const criteria = badge.criteria as { type?: string; value?: number } | null;
    if (!criteria?.type) return { eligible: false, awarded: false };

    // Award badge if eligible (criteria met by caller)
    await database.insert(userBadges).values({ userId, badgeId: badge.id });
    await database.insert(rewards).values({
      userId,
      type: "badge_earned" as any,
      sourceType: "badge",
      sourceId: badge.id,
      rewardType: "xp" as any,
      amount: String(badge.xpValue || 0),
      description: `Earned badge: ${badge.name}`,
      status: "claimed" as any,
      claimedAt: new Date(),
    });

    return { eligible: true, awarded: true };
  } catch (e) {
    console.error("[Gamification] checkBadgeEligibility error:", e);
    return { eligible: false, awarded: false };
  }
}

/**
 * Get leaderboard for a specific time period
 */
export async function getLeaderboard(
  period: "daily" | "weekly" | "monthly" | "all-time",
  role?: string,
  limit: number = 100
): Promise<LeaderboardEntry[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    // For period-based filtering, use rewards table with date ranges
    // For all-time, use gamification profiles directly
    let rows;
    if (period === "all-time") {
      rows = await db.select({
        userId: gamificationProfiles.userId,
        userName: users.name,
        userRole: users.role,
        points: gamificationProfiles.totalXp,
        level: gamificationProfiles.level,
      })
        .from(gamificationProfiles)
        .leftJoin(users, eq(gamificationProfiles.userId, users.id))
        .orderBy(desc(gamificationProfiles.totalXp))
        .limit(limit);
    } else {
      const cutoff = new Date();
      if (period === "daily") cutoff.setDate(cutoff.getDate() - 1);
      else if (period === "weekly") cutoff.setDate(cutoff.getDate() - 7);
      else cutoff.setMonth(cutoff.getMonth() - 1);

      rows = await db.select({
        userId: rewards.userId,
        userName: users.name,
        userRole: users.role,
        points: sql<number>`SUM(CAST(${rewards.amount} AS UNSIGNED))`,
      })
        .from(rewards)
        .leftJoin(users, eq(rewards.userId, users.id))
        .where(and(eq(rewards.rewardType, "xp" as any), gte(rewards.createdAt, cutoff)))
        .groupBy(rewards.userId, users.name, users.role)
        .orderBy(sql`SUM(CAST(${rewards.amount} AS UNSIGNED)) DESC`)
        .limit(limit);
    }

    return rows.map((r, i) => ({
      rank: i + 1,
      userId: r.userId,
      userName: r.userName || "Unknown",
      userRole: r.userRole || "DRIVER",
      points: Number(r.points) || 0,
      tier: calculateTier(Number(r.points) || 0),
    }));
  } catch (e) {
    console.error("[Gamification] getLeaderboard error:", e);
    return [];
  }
}

/**
 * Get user's achievements and progress
 */
export async function getUserAchievements(userId: number, db: any): Promise<Achievement[]> {
  const database = db || await getDb();
  if (!database) return [];
  try {
    const rows = await database.select({
      id: userBadges.id,
      userId: userBadges.userId,
      badgeId: badgesTable.code,
      earnedAt: userBadges.earnedAt,
    })
      .from(userBadges)
      .leftJoin(badgesTable, eq(userBadges.badgeId, badgesTable.id))
      .where(eq(userBadges.userId, userId));

    return rows.map((r: { id: number; userId: number; badgeId: string | null; earnedAt: Date }) => ({
      id: String(r.id),
      userId: r.userId,
      badgeId: r.badgeId || "",
      earnedAt: r.earnedAt,
      progress: 100,
      completed: true,
    }));
  } catch (e) {
    console.error("[Gamification] getUserAchievements error:", e);
    return [];
  }
}

/**
 * Get user's rank among all users (or within role)
 */
export async function getUserRank(userId: number, db: any, role?: string): Promise<number> {
  const database = db || await getDb();
  if (!database) return 0;
  try {
    const [profile] = await database.select({ totalXp: gamificationProfiles.totalXp })
      .from(gamificationProfiles).where(eq(gamificationProfiles.userId, userId)).limit(1);
    if (!profile) return 0;

    const [countResult] = await database.select({ count: sql<number>`count(*)` })
      .from(gamificationProfiles)
      .where(sql`${gamificationProfiles.totalXp} > ${profile.totalXp}`);

    return (countResult?.count || 0) + 1;
  } catch (e) {
    console.error("[Gamification] getUserRank error:", e);
    return 0;
  }
}

