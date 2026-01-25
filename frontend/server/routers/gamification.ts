/**
 * GAMIFICATION ROUTER
 * tRPC procedures for driver achievements, points, and rewards
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const gamificationRouter = router({
  /**
   * Get user profile
   */
  getProfile: protectedProcedure
    .input(z.object({
      userId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return {
        userId: input.userId || ctx.user?.id,
        name: "Mike Johnson",
        level: 12,
        title: "Road Warrior",
        totalPoints: 4850,
        pointsToNextLevel: 150,
        nextLevelAt: 5000,
        rank: 15,
        totalUsers: 450,
        percentile: 96.7,
        memberSince: "2022-03-15",
        streaks: {
          currentOnTime: 28,
          longestOnTime: 45,
          currentSafe: 156,
          longestSafe: 156,
        },
        stats: {
          loadsCompleted: 342,
          milesDriver: 125000,
          onTimeRate: 0.96,
          safetyScore: 98,
          customerRating: 4.8,
        },
      };
    }),

  /**
   * Get achievements
   */
  getAchievements: protectedProcedure
    .input(z.object({
      userId: z.string().optional(),
      category: z.enum(["all", "safety", "performance", "milestones", "special"]).default("all"),
    }))
    .query(async ({ ctx, input }) => {
      const achievements = [
        {
          id: "ach_001",
          name: "First Load",
          description: "Complete your first load",
          category: "milestones",
          icon: "truck",
          points: 100,
          earnedAt: "2022-03-20",
          rarity: "common",
        },
        {
          id: "ach_002",
          name: "Century Club",
          description: "Complete 100 loads",
          category: "milestones",
          icon: "award",
          points: 500,
          earnedAt: "2023-05-15",
          rarity: "uncommon",
        },
        {
          id: "ach_003",
          name: "Safety First",
          description: "30 days without incidents",
          category: "safety",
          icon: "shield",
          points: 250,
          earnedAt: "2022-04-20",
          rarity: "uncommon",
        },
        {
          id: "ach_004",
          name: "Road Warrior",
          description: "Drive 100,000 miles",
          category: "milestones",
          icon: "map",
          points: 1000,
          earnedAt: "2024-08-10",
          rarity: "rare",
        },
        {
          id: "ach_005",
          name: "Perfect Week",
          description: "100% on-time deliveries for a week",
          category: "performance",
          icon: "clock",
          points: 200,
          earnedAt: "2025-01-15",
          rarity: "uncommon",
        },
        {
          id: "ach_006",
          name: "Customer Favorite",
          description: "Receive 50 five-star ratings",
          category: "performance",
          icon: "star",
          points: 750,
          earnedAt: "2024-11-20",
          rarity: "rare",
        },
      ];

      const locked = [
        {
          id: "ach_007",
          name: "Legend",
          description: "Complete 1,000 loads",
          category: "milestones",
          icon: "trophy",
          points: 2500,
          progress: 342,
          target: 1000,
          rarity: "legendary",
        },
        {
          id: "ach_008",
          name: "Safety Champion",
          description: "One full year without incidents",
          category: "safety",
          icon: "shield-check",
          points: 2000,
          progress: 156,
          target: 365,
          rarity: "epic",
        },
      ];

      return {
        earned: achievements,
        locked: locked,
        totalEarned: achievements.length,
        totalAvailable: achievements.length + locked.length,
        totalPoints: achievements.reduce((sum, a) => sum + a.points, 0),
      };
    }),

  /**
   * Get leaderboard
   */
  getLeaderboard: protectedProcedure
    .input(z.object({
      period: z.enum(["week", "month", "quarter", "year", "all"]).default("month"),
      category: z.enum(["points", "loads", "miles", "safety", "rating"]).default("points"),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      return {
        period: input.period,
        category: input.category,
        leaders: [
          { rank: 1, userId: "d5", name: "James Wilson", value: 5200, avatar: null, badge: "champion" },
          { rank: 2, userId: "d8", name: "Emily Martinez", value: 5150, avatar: null, badge: "gold" },
          { rank: 3, userId: "d2", name: "Sarah Williams", value: 5050, avatar: null, badge: "silver" },
          { rank: 4, userId: "d10", name: "Robert Davis", value: 4950, avatar: null, badge: "bronze" },
          { rank: 5, userId: "d1", name: "Mike Johnson", value: 4850, avatar: null, badge: null },
          { rank: 6, userId: "d3", name: "Tom Brown", value: 4700, avatar: null, badge: null },
          { rank: 7, userId: "d4", name: "Lisa Chen", value: 4600, avatar: null, badge: null },
          { rank: 8, userId: "d6", name: "David Lee", value: 4500, avatar: null, badge: null },
          { rank: 9, userId: "d7", name: "Anna Kim", value: 4400, avatar: null, badge: null },
          { rank: 10, userId: "d9", name: "Chris Taylor", value: 4300, avatar: null, badge: null },
        ],
        myRank: 5,
        totalParticipants: 450,
      };
    }),

  /**
   * Get rewards catalog
   */
  getRewardsCatalog: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        availablePoints: 4850,
        rewards: [
          {
            id: "reward_001",
            name: "EusoTrip Cap",
            description: "Official EusoTrip branded cap",
            category: "merchandise",
            pointsCost: 500,
            available: true,
            image: null,
          },
          {
            id: "reward_002",
            name: "$25 Fuel Card",
            description: "Gift card for fuel purchases",
            category: "gift_cards",
            pointsCost: 2500,
            available: true,
            image: null,
          },
          {
            id: "reward_003",
            name: "$50 Amazon Gift Card",
            description: "Amazon gift card",
            category: "gift_cards",
            pointsCost: 5000,
            available: true,
            image: null,
          },
          {
            id: "reward_004",
            name: "Priority Dispatch",
            description: "Priority access to premium loads for 1 week",
            category: "perks",
            pointsCost: 1000,
            available: true,
            image: null,
          },
          {
            id: "reward_005",
            name: "EusoTrip Jacket",
            description: "Premium branded jacket",
            category: "merchandise",
            pointsCost: 3000,
            available: true,
            image: null,
          },
        ],
        categories: ["merchandise", "gift_cards", "perks", "experiences"],
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
      return {
        redemptionId: `redeem_${Date.now()}`,
        rewardId: input.rewardId,
        pointsDeducted: 500,
        remainingPoints: 4350,
        status: "processing",
        estimatedDelivery: "3-5 business days",
        redeemedBy: ctx.user?.id,
        redeemedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get points history
   */
  getPointsHistory: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      return {
        transactions: [
          { id: "pt_001", type: "earned", amount: 50, reason: "On-time delivery bonus", loadNumber: "LOAD-45850", date: "2025-01-23" },
          { id: "pt_002", type: "earned", amount: 25, reason: "Customer 5-star rating", loadNumber: "LOAD-45845", date: "2025-01-22" },
          { id: "pt_003", type: "earned", amount: 100, reason: "Weekly streak bonus", date: "2025-01-21" },
          { id: "pt_004", type: "redeemed", amount: -500, reason: "Reward: EusoTrip Cap", date: "2025-01-20" },
          { id: "pt_005", type: "earned", amount: 50, reason: "On-time delivery bonus", loadNumber: "LOAD-45820", date: "2025-01-19" },
        ],
        total: 125,
        summary: {
          earnedThisMonth: 450,
          redeemedThisMonth: 500,
          netThisMonth: -50,
        },
      };
    }),

  /**
   * Get challenges
   */
  getChallenges: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        active: [
          {
            id: "challenge_001",
            name: "January Sprint",
            description: "Complete 20 loads in January",
            type: "monthly",
            reward: 500,
            progress: 15,
            target: 20,
            endsAt: "2025-01-31T23:59:59Z",
            participants: 245,
          },
          {
            id: "challenge_002",
            name: "Perfect Week",
            description: "100% on-time for 7 consecutive days",
            type: "weekly",
            reward: 200,
            progress: 5,
            target: 7,
            endsAt: "2025-01-26T23:59:59Z",
            participants: 180,
          },
        ],
        upcoming: [
          {
            id: "challenge_003",
            name: "Safety Month",
            description: "Zero incidents in February",
            type: "monthly",
            reward: 1000,
            startsAt: "2025-02-01T00:00:00Z",
            endsAt: "2025-02-28T23:59:59Z",
          },
        ],
        completed: [
          {
            id: "challenge_004",
            name: "Holiday Hustle",
            description: "Complete 25 loads in December",
            type: "monthly",
            reward: 750,
            completed: true,
            completedAt: "2024-12-28",
          },
        ],
      };
    }),

  /**
   * Get badges
   */
  getBadges: protectedProcedure
    .input(z.object({
      userId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return {
        displayBadges: [
          { id: "badge_001", name: "Safety Star", icon: "shield", tier: "gold" },
          { id: "badge_002", name: "On-Time Pro", icon: "clock", tier: "platinum" },
          { id: "badge_003", name: "Road Warrior", icon: "truck", tier: "gold" },
        ],
        allBadges: [
          { id: "badge_001", name: "Safety Star", icon: "shield", tier: "gold", earned: true },
          { id: "badge_002", name: "On-Time Pro", icon: "clock", tier: "platinum", earned: true },
          { id: "badge_003", name: "Road Warrior", icon: "truck", tier: "gold", earned: true },
          { id: "badge_004", name: "Fuel Saver", icon: "fuel", tier: "silver", earned: true },
          { id: "badge_005", name: "Customer Champion", icon: "star", tier: "gold", earned: true },
          { id: "badge_006", name: "Legend", icon: "trophy", tier: "legendary", earned: false, progress: 34.2 },
        ],
      };
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
        teamName: "ABC Transport Elite",
        members: 12,
        totalPoints: 52000,
        rank: 3,
        totalTeams: 45,
        weeklyProgress: {
          loadsCompleted: 85,
          target: 100,
          onTimeRate: 0.94,
          safetyScore: 97,
        },
        topPerformers: [
          { name: "Mike Johnson", points: 4850 },
          { name: "Sarah Williams", points: 5050 },
          { name: "Tom Brown", points: 4700 },
        ],
      };
    }),

  getMyAchievements: protectedProcedure.query(async () => [{ id: "a1", name: "Road Warrior", earned: true, earnedAt: "2025-01-15" }]),
});
