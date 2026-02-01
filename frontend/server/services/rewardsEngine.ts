/**
 * REWARDS ENGINE SERVICE
 * Business logic for gamification rewards, missions, badges, and XP
 */

import { eq, and, gte, lte, desc } from "drizzle-orm";
import { getDb } from "../db";
import {
  missions,
  missionProgress,
  badges,
  userBadges,
  gamificationProfiles,
  rewardCrates,
  rewards,
  users,
  loads,
} from "../../drizzle/schema";

export interface MissionEvent {
  userId: number;
  eventType: "load_completed" | "delivery_on_time" | "rating_received" | "miles_driven" | "earnings_received" | "streak_maintained";
  value: number;
  metadata?: Record<string, unknown>;
}

export interface RewardResult {
  xpEarned: number;
  milesEarned: number;
  missionsCompleted: string[];
  badgesEarned: string[];
  cratesAwarded: string[];
  leveledUp: boolean;
  newLevel?: number;
}

export class RewardsEngine {
  /**
   * Process an event and update mission progress
   */
  async processEvent(event: MissionEvent): Promise<RewardResult> {
    const db = await getDb();
    if (!db) {
      return this.getEmptyResult();
    }

    const result: RewardResult = {
      xpEarned: 0,
      milesEarned: 0,
      missionsCompleted: [],
      badgesEarned: [],
      cratesAwarded: [],
      leveledUp: false,
    };

    // Get user's active missions
    const activeMissions = await this.getActiveMissions(event.userId);
    
    // Update progress for relevant missions
    for (const mission of activeMissions) {
      const progressMade = await this.checkMissionProgress(mission, event);
      
      if (progressMade > 0) {
        const completed = await this.updateMissionProgress(event.userId, mission.id, progressMade);
        
        if (completed) {
          result.missionsCompleted.push(mission.name);
          result.xpEarned += mission.xpReward || 0;
          
          // Award crate if mission reward type is crate
          if (mission.rewardType === "crate" && mission.rewardData?.crateType) {
            const crateId = await this.awardCrate(event.userId, mission.rewardData.crateType as string, "mission", mission.id);
            if (crateId) result.cratesAwarded.push(mission.rewardData.crateType as string);
          }
          
          // Award miles if reward type is miles
          if (mission.rewardType === "miles" && mission.rewardValue) {
            result.milesEarned += parseFloat(mission.rewardValue);
          }
        }
      }
    }

    // Check for badge eligibility
    const newBadges = await this.checkBadgeEligibility(event.userId, event);
    result.badgesEarned = newBadges;
    
    // Award XP for badges
    for (const badgeName of newBadges) {
      const badge = await this.getBadgeByName(badgeName);
      if (badge) result.xpEarned += badge.xpValue || 0;
    }

    // Update gamification profile
    if (result.xpEarned > 0 || result.milesEarned > 0) {
      const levelUp = await this.updateGamificationProfile(
        event.userId,
        result.xpEarned,
        result.milesEarned
      );
      
      if (levelUp) {
        result.leveledUp = true;
        result.newLevel = levelUp.newLevel;
        
        // Award level-up crate
        const crateType = this.getLevelUpCrateType(levelUp.newLevel);
        const crateId = await this.awardCrate(event.userId, crateType, "level_up", levelUp.newLevel);
        if (crateId) result.cratesAwarded.push(crateType);
      }
    }

    // Check for random drop (completed loads only)
    if (event.eventType === "load_completed") {
      const randomDrop = await this.checkRandomDrop(event.userId);
      if (randomDrop) {
        result.cratesAwarded.push(randomDrop);
      }
    }

    return result;
  }

  /**
   * Get user's active missions
   */
  private async getActiveMissions(userId: number) {
    const db = await getDb();
    if (!db) return [];

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const userRole = user?.role || "DRIVER";

    const now = new Date();
    const allMissions = await db.select()
      .from(missions)
      .where(eq(missions.isActive, true));

    // Filter missions by role and time
    return allMissions.filter(m => {
      // Check role restriction
      if (m.applicableRoles && m.applicableRoles.length > 0) {
        if (!m.applicableRoles.includes(userRole)) return false;
      }
      
      // Check time bounds
      if (m.startsAt && new Date(m.startsAt) > now) return false;
      if (m.endsAt && new Date(m.endsAt) < now) return false;
      
      return true;
    });
  }

  /**
   * Check mission progress based on event
   */
  private async checkMissionProgress(mission: any, event: MissionEvent): Promise<number> {
    // Map event types to mission target types
    const eventToTargetMap: Record<string, string[]> = {
      load_completed: ["count"],
      delivery_on_time: ["count", "streak"],
      rating_received: ["rating", "count"],
      miles_driven: ["distance"],
      earnings_received: ["amount"],
      streak_maintained: ["streak"],
    };

    const validTargets = eventToTargetMap[event.eventType] || [];
    
    if (!validTargets.includes(mission.targetType)) {
      return 0;
    }

    // Check category match
    const eventCategoryMap: Record<string, string[]> = {
      load_completed: ["deliveries", "special"],
      delivery_on_time: ["deliveries", "efficiency"],
      rating_received: ["social", "performance"],
      miles_driven: ["deliveries"],
      earnings_received: ["earnings"],
      streak_maintained: ["safety", "efficiency"],
    };

    const validCategories = eventCategoryMap[event.eventType] || [];
    if (!validCategories.includes(mission.category)) {
      return 0;
    }

    return event.value;
  }

  /**
   * Update mission progress
   */
  private async updateMissionProgress(
    userId: number,
    missionId: number,
    progressAmount: number
  ): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;

    // Get or create progress record
    let [progress] = await db.select()
      .from(missionProgress)
      .where(and(
        eq(missionProgress.userId, userId),
        eq(missionProgress.missionId, missionId)
      ))
      .limit(1);

    const [mission] = await db.select()
      .from(missions)
      .where(eq(missions.id, missionId))
      .limit(1);

    if (!mission) return false;

    const targetValue = parseFloat(mission.targetValue);

    if (!progress) {
      // Create new progress
      await db.insert(missionProgress).values({
        userId,
        missionId,
        currentProgress: progressAmount.toString(),
        targetProgress: mission.targetValue,
        status: progressAmount >= targetValue ? "completed" : "in_progress",
        completedAt: progressAmount >= targetValue ? new Date() : undefined,
        lastProgressAt: new Date(),
      });

      return progressAmount >= targetValue;
    }

    // Update existing progress
    const currentProgress = parseFloat(progress.currentProgress || "0");
    const newProgress = currentProgress + progressAmount;
    const isCompleted = newProgress >= targetValue && progress.status !== "completed" && progress.status !== "claimed";

    await db.update(missionProgress)
      .set({
        currentProgress: newProgress.toString(),
        status: isCompleted ? "completed" : progress.status === "not_started" ? "in_progress" : progress.status,
        completedAt: isCompleted ? new Date() : progress.completedAt,
        lastProgressAt: new Date(),
      })
      .where(eq(missionProgress.id, progress.id));

    return isCompleted;
  }

  /**
   * Check badge eligibility
   */
  private async checkBadgeEligibility(userId: number, event: MissionEvent): Promise<string[]> {
    const db = await getDb();
    if (!db) return [];

    const earnedBadges: string[] = [];

    // Get all badges
    const allBadges = await db.select()
      .from(badges)
      .where(eq(badges.isActive, true));

    // Get user's existing badges
    const userBadgeList = await db.select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId));

    const existingBadgeIds = new Set(userBadgeList.map(ub => ub.badgeId));

    // Get user profile for stats
    const [profile] = await db.select()
      .from(gamificationProfiles)
      .where(eq(gamificationProfiles.userId, userId))
      .limit(1);

    for (const badge of allBadges) {
      if (existingBadgeIds.has(badge.id)) continue;

      const earned = await this.evaluateBadgeCriteria(badge, event, profile);
      
      if (earned) {
        await db.insert(userBadges).values({
          userId,
          badgeId: badge.id,
          earnedAt: new Date(),
        });

        earnedBadges.push(badge.name);

        // Create reward record
        await db.insert(rewards).values({
          userId,
          type: "badge_earned",
          sourceType: "badge",
          sourceId: badge.id,
          rewardType: "xp",
          amount: badge.xpValue?.toString() || "0",
          description: `Earned badge: ${badge.name}`,
          status: "claimed",
          claimedAt: new Date(),
        });
      }
    }

    return earnedBadges;
  }

  /**
   * Evaluate badge criteria
   */
  private async evaluateBadgeCriteria(badge: any, event: MissionEvent, profile: any): Promise<boolean> {
    if (!badge.criteria) return false;

    const { type, value, condition } = badge.criteria;
    const stats = profile?.stats || {};

    switch (type) {
      case "loads_completed":
        return (stats.totalMissionsCompleted || 0) >= value;
      
      case "perfect_deliveries":
        return (stats.perfectDeliveries || 0) >= value;
      
      case "on_time_rate":
        return (stats.onTimeRate || 0) >= value;
      
      case "level_reached":
        return (profile?.level || 1) >= value;
      
      case "streak_days":
        return (profile?.streakDays || 0) >= value;
      
      case "badges_earned":
        return (stats.totalBadgesEarned || 0) >= value;
      
      default:
        return false;
    }
  }

  /**
   * Update gamification profile
   */
  private async updateGamificationProfile(
    userId: number,
    xpEarned: number,
    milesEarned: number
  ): Promise<{ newLevel: number } | null> {
    const db = await getDb();
    if (!db) return null;

    let [profile] = await db.select()
      .from(gamificationProfiles)
      .where(eq(gamificationProfiles.userId, userId))
      .limit(1);

    if (!profile) {
      await db.insert(gamificationProfiles).values({
        userId,
        level: 1,
        currentXp: xpEarned,
        totalXp: xpEarned,
        xpToNextLevel: 1000,
        currentMiles: milesEarned.toString(),
        totalMilesEarned: milesEarned.toString(),
      });
      return null;
    }

    const newCurrentXp = (profile.currentXp || 0) + xpEarned;
    const newTotalXp = (profile.totalXp || 0) + xpEarned;
    const newCurrentMiles = parseFloat(profile.currentMiles || "0") + milesEarned;
    const newTotalMiles = parseFloat(profile.totalMilesEarned || "0") + milesEarned;

    // Check for level up
    let newLevel = profile.level || 1;
    let xpToNextLevel = profile.xpToNextLevel || 1000;
    let currentXpForLevel = newCurrentXp;
    let leveledUp = false;

    while (currentXpForLevel >= xpToNextLevel) {
      currentXpForLevel -= xpToNextLevel;
      newLevel++;
      xpToNextLevel = this.calculateXpForLevel(newLevel);
      leveledUp = true;
    }

    await db.update(gamificationProfiles)
      .set({
        level: newLevel,
        currentXp: currentXpForLevel,
        totalXp: newTotalXp,
        xpToNextLevel,
        currentMiles: newCurrentMiles.toString(),
        totalMilesEarned: newTotalMiles.toString(),
        lastActivityAt: new Date(),
      })
      .where(eq(gamificationProfiles.id, profile.id));

    if (leveledUp) {
      // Create level up reward
      await db.insert(rewards).values({
        userId,
        type: "level_up",
        sourceType: "level",
        sourceId: newLevel,
        rewardType: "crate",
        description: `Reached level ${newLevel}`,
        status: "claimed",
        claimedAt: new Date(),
      });

      return { newLevel };
    }

    return null;
  }

  /**
   * Calculate XP required for a level
   */
  private calculateXpForLevel(level: number): number {
    // Exponential growth: 1000 * 1.2^(level-1)
    return Math.floor(1000 * Math.pow(1.2, level - 1));
  }

  /**
   * Get level-up crate type based on level
   */
  private getLevelUpCrateType(level: number): string {
    if (level >= 50) return "mythic";
    if (level >= 40) return "legendary";
    if (level >= 30) return "epic";
    if (level >= 20) return "rare";
    if (level >= 10) return "uncommon";
    return "common";
  }

  /**
   * Award a crate to user
   */
  private async awardCrate(
    userId: number,
    crateType: string,
    source: string,
    sourceId: number
  ): Promise<number | null> {
    const db = await getDb();
    if (!db) return null;

    const [result] = await db.insert(rewardCrates).values({
      userId,
      crateType: crateType as any,
      source,
      sourceId,
      status: "pending",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    return result.insertId;
  }

  /**
   * Check for random drop on load completion
   */
  private async checkRandomDrop(userId: number): Promise<string | null> {
    // Base drop chances
    const dropChances = {
      common: 0.15,      // 15%
      uncommon: 0.08,    // 8%
      rare: 0.03,        // 3%
      epic: 0.01,        // 1%
      legendary: 0.002,  // 0.2%
      mythic: 0.0005,    // 0.05%
    };

    const random = Math.random();
    let cumulative = 0;

    for (const [crateType, chance] of Object.entries(dropChances)) {
      cumulative += chance;
      if (random < cumulative) {
        const crateId = await this.awardCrate(userId, crateType, "random_drop", 0);
        return crateId ? crateType : null;
      }
    }

    return null;
  }

  /**
   * Get badge by name
   */
  private async getBadgeByName(name: string) {
    const db = await getDb();
    if (!db) return null;

    const [badge] = await db.select()
      .from(badges)
      .where(eq(badges.name, name))
      .limit(1);

    return badge;
  }

  /**
   * Update user streak
   */
  async updateStreak(userId: number): Promise<{ currentStreak: number; longestStreak: number }> {
    const db = await getDb();
    if (!db) return { currentStreak: 0, longestStreak: 0 };

    const [profile] = await db.select()
      .from(gamificationProfiles)
      .where(eq(gamificationProfiles.userId, userId))
      .limit(1);

    if (!profile) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const lastActivity = profile.lastActivityAt;
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    let newStreakDays = profile.streakDays || 0;
    let longestStreak = profile.longestStreak || 0;

    if (lastActivity && lastActivity > oneDayAgo) {
      // Activity within last 24 hours, streak continues
      newStreakDays++;
    } else if (lastActivity && lastActivity > twoDaysAgo) {
      // Activity within 24-48 hours, streak resets to 1
      newStreakDays = 1;
    } else {
      // No recent activity, streak resets
      newStreakDays = 1;
    }

    longestStreak = Math.max(longestStreak, newStreakDays);

    await db.update(gamificationProfiles)
      .set({
        streakDays: newStreakDays,
        longestStreak,
        lastActivityAt: now,
      })
      .where(eq(gamificationProfiles.id, profile.id));

    return { currentStreak: newStreakDays, longestStreak };
  }

  /**
   * Get empty result
   */
  private getEmptyResult(): RewardResult {
    return {
      xpEarned: 0,
      milesEarned: 0,
      missionsCompleted: [],
      badgesEarned: [],
      cratesAwarded: [],
      leveledUp: false,
    };
  }
}

// Export singleton instance
export const rewardsEngine = new RewardsEngine();
