import { z } from "zod";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";

export const usersRouter = router({
  // Get current user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return {
      id: ctx.user?.id || "usr_001",
      firstName: ctx.user?.name?.split(" ")[0] || "John",
      lastName: ctx.user?.name?.split(" ")[1] || "Doe",
      email: ctx.user?.email || "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      company: "ABC Trucking LLC",
      location: "Houston, TX",
      role: ctx.user?.role || "shipper",
      verified: true,
      createdAt: "January 2024",
      loadsCreated: 156,
      loadsCompleted: 142,
      rating: "4.8",
      daysActive: 385,
    };
  }),

  // Get user preferences
  getPreferences: protectedProcedure.query(async () => {
    return {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      language: "en",
      timezone: "America/Chicago",
      theme: "dark",
    };
  }),

  // Get user settings
  getSettings: protectedProcedure.query(async () => {
    return {
      twoFactorEnabled: false,
      loginAlerts: true,
      sessionTimeout: 30,
      apiAccess: true,
    };
  }),

  // Get user achievements
  getAchievements: protectedProcedure.query(async () => {
    return [
      { id: "ach_001", name: "First Load", description: "Complete your first load", earned: true, earnedAt: "2024-01-15" },
      { id: "ach_002", name: "100 Loads", description: "Complete 100 loads", earned: true, earnedAt: "2024-08-22" },
      { id: "ach_003", name: "Perfect Rating", description: "Maintain 5.0 rating for 30 days", earned: false, progress: 75 },
    ];
  }),

  // Get user badges
  getBadges: protectedProcedure.query(async () => {
    return [
      { id: "badge_001", name: "Verified Shipper", icon: "shield", color: "blue" },
      { id: "badge_002", name: "Top Rated", icon: "star", color: "gold" },
      { id: "badge_003", name: "HazMat Certified", icon: "alert-triangle", color: "orange" },
    ];
  }),

  // Get achievement stats
  getAchievementStats: protectedProcedure.query(async () => {
    return {
      totalAchievements: 25,
      earned: 12,
      inProgress: 5,
      points: 1250,
    };
  }),

  // Get leaderboard for Leaderboard page
  getLeaderboard: protectedProcedure
    .input(z.object({ timeRange: z.string().optional(), category: z.string().optional(), limit: z.number().optional() }))
    .query(async () => {
      return [
        { rank: 1, name: "Mike Johnson", points: 2450, loads: 45, rating: 4.9, change: 0 },
        { rank: 2, name: "Sarah Williams", points: 2280, loads: 42, rating: 4.8, change: 1 },
        { rank: 3, name: "Tom Brown", points: 2150, loads: 38, rating: 4.7, change: -1 },
        { rank: 4, name: "Lisa Chen", points: 1980, loads: 35, rating: 4.9, change: 2 },
        { rank: 5, name: "James Wilson", points: 1850, loads: 32, rating: 4.6, change: 0 },
      ];
    }),

  // Get my rank for Leaderboard page
  getMyRank: protectedProcedure
    .input(z.object({ timeRange: z.string().optional(), category: z.string().optional() }))
    .query(async () => {
      return { rank: 8, points: 1650, percentile: 85 };
    }),

  // Get activity feed for ActivityFeed page
  getActivityFeed: protectedProcedure
    .input(z.object({ filter: z.string().optional(), limit: z.number().optional() }))
    .query(async () => {
      return [
        { id: "act_001", type: "load", title: "Load Delivered", description: "LOAD-45920 delivered to Dallas, TX", time: "2h ago" },
        { id: "act_002", type: "bid", title: "Bid Accepted", description: "Your bid on LOAD-45925 was accepted", time: "4h ago" },
        { id: "act_003", type: "document", title: "Document Uploaded", description: "Insurance certificate uploaded", time: "1d ago" },
      ];
    }),

  // Get activity stats for ActivityFeed page
  getActivityStats: protectedProcedure
    .query(async () => {
      return { totalActivities: 156, todayActivities: 12, weekActivities: 45 };
    }),

  // Get account info
  getAccountInfo: protectedProcedure.query(async ({ ctx }) => {
    return {
      id: ctx.user?.id,
      email: ctx.user?.email,
      createdAt: "2024-01-10",
      lastLogin: new Date().toISOString(),
      status: "active",
    };
  }),

  // Request account deletion
  requestAccountDeletion: protectedProcedure
    .input(z.object({ reason: z.string().optional() }))
    .mutation(async () => {
      return { success: true, scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() };
    }),

  // Cancel account deletion
  cancelAccountDeletion: protectedProcedure.mutation(async () => {
    return { success: true };
  }),

  // Get connected apps
  getConnectedApps: protectedProcedure.query(async () => {
    return [
      { id: "app_001", name: "QuickBooks", connected: true, lastSync: "2025-01-24" },
      { id: "app_002", name: "Stripe", connected: true, lastSync: "2025-01-24" },
      { id: "app_003", name: "Google Maps", connected: false },
    ];
  }),

  // Disconnect app
  disconnectApp: protectedProcedure
    .input(z.object({ appId: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, appId: input.appId };
    }),

  // Refresh app connection
  refreshAppConnection: protectedProcedure
    .input(z.object({ appId: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, appId: input.appId, lastSync: new Date().toISOString() };
    }),

  // Get referral info
  getReferralInfo: protectedProcedure.query(async () => {
    return {
      referralCode: "JOHN2024",
      referralUrl: "https://eusotrip.com/ref/JOHN2024",
      totalReferrals: 5,
      pendingRewards: 250,
      earnedRewards: 500,
    };
  }),

  // Get sessions for SessionManagement page
  getSessions: protectedProcedure
    .query(async () => {
      return [
        { id: "s1", device: "Chrome on Windows", ip: "192.168.1.1", location: "Houston, TX", lastActive: "2025-01-23 10:30", current: true },
        { id: "s2", device: "Safari on iPhone", ip: "192.168.1.50", location: "Houston, TX", lastActive: "2025-01-22 18:45", current: false },
        { id: "s3", device: "Firefox on Mac", ip: "10.0.0.15", location: "Dallas, TX", lastActive: "2025-01-20 14:20", current: false },
      ];
    }),

  // Get session summary for SessionManagement page
  getSessionSummary: protectedProcedure
    .query(async () => {
      return { activeSessions: 3, devicesUsed: 3, lastLogin: "2025-01-23 10:30" };
    }),

  // Terminate session mutation
  terminateSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, terminatedId: input.sessionId };
    }),

  // Terminate all other sessions mutation
  terminateAllSessions: protectedProcedure
    .mutation(async () => {
      return { success: true, terminatedCount: 2 };
    }),

  // Get login history for LoginHistory page
  getLoginHistory: protectedProcedure
    .input(z.object({ status: z.string().optional(), limit: z.number().optional().default(50) }))
    .query(async ({ input }) => {
      const history = [
        { id: "l1", timestamp: "2025-01-23 10:30", ip: "192.168.1.1", location: "Houston, TX", device: "Chrome/Windows", status: "success" },
        { id: "l2", timestamp: "2025-01-22 18:45", ip: "192.168.1.50", location: "Houston, TX", device: "Safari/iPhone", status: "success" },
        { id: "l3", timestamp: "2025-01-21 09:15", ip: "10.0.0.100", location: "Unknown", device: "Firefox/Linux", status: "failed" },
      ];
      if (input.status) return history.filter(h => h.status === input.status);
      return history;
    }),

  // Get login summary for LoginHistory page
  getLoginSummary: protectedProcedure
    .query(async () => {
      return { totalLogins: 45, successfulLogins: 42, failedAttempts: 3, lastLogin: "2025-01-23 10:30" };
    }),

  // Get referrals list
  getReferrals: protectedProcedure.query(async () => {
    return [
      { id: "ref_001", name: "Jane Smith", status: "active", reward: 100, joinedAt: "2024-12-15" },
      { id: "ref_002", name: "Bob Wilson", status: "pending", reward: 50, joinedAt: "2025-01-10" },
    ];
  }),

  // Get leaderboard (detailed version)
  getLeaderboardDetailed: protectedProcedure
    .input(z.object({ timeRange: z.string().optional(), category: z.string().optional(), limit: z.number().optional() }))
    .query(async () => {
      return [
        { rank: 1, userId: "usr_001", name: "Mike Trucking", score: 15420, avatar: null },
        { rank: 2, userId: "usr_002", name: "Fast Freight", score: 14850, avatar: null },
        { rank: 3, userId: "usr_003", name: "ABC Logistics", score: 13200, avatar: null },
      ];
    }),

  // Get my rank (detailed version)
  getMyRankDetailed: protectedProcedure
    .input(z.object({ timeRange: z.string().optional(), category: z.string().optional() }))
    .query(async () => {
      return { rank: 12, score: 8450, percentile: 88 };
    }),

  // Get activity feed (detailed version)
  getActivityFeedDetailed: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async () => {
      return [
        { id: "act_001", type: "load_created", message: "You created load #45921", timestamp: new Date().toISOString() },
        { id: "act_002", type: "bid_received", message: "New bid on load #45920", timestamp: new Date(Date.now() - 3600000).toISOString() },
      ];
    }),

  // Get activity stats (detailed version)
  getActivityStatsDetailed: protectedProcedure.query(async () => {
    return { today: 12, thisWeek: 45, thisMonth: 156 };
  }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(users)
        .set({
          name: input.name,
          email: input.email,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return { success: true };
    }),

  // Update notification preferences
  updateNotifications: protectedProcedure
    .input(
      z.object({
        emailNotifications: z.boolean().optional(),
        smsNotifications: z.boolean().optional(),
        pushNotifications: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Store notification preferences in database
      // For now, just return success
      return { success: true, preferences: input };
    }),

  // Update security settings
  updateSecurity: protectedProcedure
    .input(
      z.object({
        twoFactorEnabled: z.boolean().optional(),
        currentPassword: z.string().optional(),
        newPassword: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement password change and 2FA
      // For now, just return success
      return { success: true };
    }),
});
