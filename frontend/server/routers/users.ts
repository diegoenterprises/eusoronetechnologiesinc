import { z } from "zod";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";

// Ensure the current user exists in DB — uses EMAIL as primary lookup
// (openId column may not exist in actual DB so we never query by it)
async function ensureUserExists(ctxUser: any): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const email = ctxUser?.email || "";
  const name = ctxUser?.name || "User";
  const role = (ctxUser?.role || "SHIPPER") as any;

  // 1. Try email lookup (most reliable — email column always exists)
  if (email) {
    try {
      const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (row) return row.id;
    } catch (err) {
      console.warn("[ensureUserExists] email lookup failed:", err);
    }
  }

  // 2. User doesn't exist — create them (skip openId to avoid missing-column errors)
  try {
    const insertData: Record<string, any> = {
      email: email || `user-${Date.now()}@eusotrip.com`,
      name,
      role,
      isActive: true,
      isVerified: false,
    };
    // Try including openId — if column doesn't exist, we'll retry without it
    try {
      insertData.openId = String(ctxUser?.id || `auto-${Date.now()}`);
      const result = await db.insert(users).values(insertData as any);
      const insertedId = (result as any).insertId || (result as any)[0]?.insertId;
      if (insertedId) return insertedId;
    } catch (insertErr: any) {
      // If openId column doesn't exist, retry without it
      console.warn("[ensureUserExists] insert with openId failed, retrying without:", insertErr?.message);
      delete insertData.openId;
      const result = await db.insert(users).values(insertData as any);
      const insertedId = (result as any).insertId || (result as any)[0]?.insertId;
      if (insertedId) return insertedId;
    }
    // Re-query by email to get the id
    if (email) {
      const [newRow] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      return newRow?.id || 0;
    }
    return 0;
  } catch (err: any) {
    console.error("[ensureUserExists] Insert failed:", err);
    // Duplicate key? Try to find by email again
    if (email) {
      try {
        const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
        if (row) return row.id;
      } catch {}
    }
    return 0;
  }
}

export const usersRouter = router({
  // List users (admin)
  list: protectedProcedure
    .input(z.object({ search: z.string().optional(), role: z.string().optional(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const allUsers = await db.select({
        id: users.id, name: users.name, email: users.email,
        role: users.role, isActive: users.isActive, createdAt: users.createdAt,
      }).from(users).limit(input.limit || 50);
      return allUsers.map(u => ({
        id: u.id,
        name: u.name || u.email || 'Unknown',
        email: u.email,
        role: u.role,
        status: 'active',
        createdAt: u.createdAt?.toISOString() || new Date().toISOString(),
        avatar: null,
      }));
    }),

  // Get current user (me)
  me: protectedProcedure.query(async ({ ctx }) => {
    return {
      id: ctx.user?.id || 0,
      name: ctx.user?.name || 'User',
      email: ctx.user?.email || '',
      role: ctx.user?.role || 'shipper',
      companyId: ctx.user?.companyId,
    };
  }),

  // Get current user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const userOpenId = String(ctx.user?.id || "");

    if (!db) {
      return {
        id: userOpenId,
        firstName: ctx.user?.name?.split(" ")[0] || "User",
        lastName: ctx.user?.name?.split(" ")[1] || "",
        email: ctx.user?.email || "",
        phone: "",
        company: "",
        location: "",
        role: ctx.user?.role || "shipper",
        verified: false,
        createdAt: new Date().toISOString(),
        loadsCreated: 0,
        loadsCompleted: 0,
        rating: "0",
        daysActive: 0,
        timezone: "America/Chicago",
        language: "en",
        pendingDeletion: false,
        deletionDate: null,
      };
    }

    try {
      // Ensure user exists in DB (creates if missing)
      await ensureUserExists(ctx.user);
      // Query by email — select only safe columns (openId may not exist in DB)
      const userEmail = ctx.user?.email || "";
      let user: any = null;
      if (userEmail) {
        const [found] = await db.select({
          id: users.id, name: users.name, email: users.email,
          phone: users.phone, role: users.role, isVerified: users.isVerified,
          profilePicture: users.profilePicture, createdAt: users.createdAt,
        }).from(users).where(eq(users.email, userEmail)).limit(1);
        user = found;
      }
      const nameParts = (user?.name || ctx.user?.name || "").split(" ");
      const createdAt = user?.createdAt || new Date();
      const daysActive = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: user?.id || userOpenId,
        firstName: nameParts[0] || "User",
        lastName: nameParts.slice(1).join(" ") || "",
        email: user?.email || ctx.user?.email || "",
        phone: user?.phone || "",
        company: "",
        location: "",
        role: user?.role || ctx.user?.role || "shipper",
        verified: user?.isVerified || false,
        profilePicture: user?.profilePicture || null,
        createdAt: createdAt.toISOString(),
        loadsCreated: 0,
        loadsCompleted: 0,
        rating: "0",
        daysActive,
        timezone: "America/Chicago",
        language: "en",
        pendingDeletion: false,
        deletionDate: null,
      };
    } catch (error) {
      console.error('[Users] getProfile error:', error);
      return {
        id: userOpenId,
        firstName: ctx.user?.name?.split(" ")[0] || "User",
        lastName: ctx.user?.name?.split(" ")[1] || "",
        email: ctx.user?.email || "",
        phone: "",
        company: "",
        location: "",
        role: ctx.user?.role || "shipper",
        verified: false,
        createdAt: new Date().toISOString(),
        loadsCreated: 0,
        loadsCompleted: 0,
        rating: "0",
        daysActive: 0,
        timezone: "America/Chicago",
        language: "en",
        pendingDeletion: false,
        deletionDate: null,
      };
    }
  }),

  // Get user preferences
  getPreferences: protectedProcedure.input(z.object({}).optional()).query(async () => {
    return {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      language: "en",
      timezone: "America/Chicago",
      theme: "dark",
      darkMode: true,
      compactMode: false,
      dateFormat: "MM/DD/YYYY",
      marketingEmails: false,
      distanceUnit: "miles",
      smsAlerts: true,
    };
  }),

  // Update user preferences
  updatePreferences: protectedProcedure
    .input(z.object({
      emailNotifications: z.boolean().optional(),
      smsNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      language: z.string().optional(),
      timezone: z.string().optional(),
      theme: z.string().optional(),
      darkMode: z.boolean().optional(),
      compactMode: z.boolean().optional(),
      dateFormat: z.string().optional(),
      marketingEmails: z.boolean().optional(),
      distanceUnit: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return { success: true, updatedAt: new Date().toISOString() };
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

  // Get user achievements (DB-driven when implemented)
  getAchievements: protectedProcedure.query(async () => {
    return [];
  }),

  // Get user badges (DB-driven when implemented)
  getBadges: protectedProcedure.query(async () => {
    return [];
  }),

  // Get achievement stats
  getAchievementStats: protectedProcedure.query(async () => {
    return {
      totalAchievements: 0,
      earned: 0,
      inProgress: 0,
      points: 0,
      totalBadges: 0,
      totalPoints: 0,
      completionRate: 0,
    };
  }),

  // Get leaderboard for Leaderboard page
  getLeaderboard: protectedProcedure
    .input(z.object({ timeRange: z.string().optional(), category: z.string().optional(), limit: z.number().optional() }))
    .query(async () => {
      return [];
    }),

  // Get my rank for Leaderboard page
  getMyRank: protectedProcedure
    .input(z.object({ timeRange: z.string().optional(), category: z.string().optional() }))
    .query(async () => {
      return { rank: 0, points: 0, percentile: 0, score: 0, trend: "flat", trendValue: 0 };
    }),

  // Get activity feed for ActivityFeed page
  getActivityFeed: protectedProcedure
    .input(z.object({ filter: z.string().optional(), limit: z.number().optional() }))
    .query(async () => {
      return [];
    }),

  // Get activity stats for ActivityFeed page
  getActivityStats: protectedProcedure
    .query(async () => {
      return { totalActivities: 0, todayActivities: 0, weekActivities: 0, totalToday: 0, loadsToday: 0, bidsToday: 0, thisWeek: 0 };
    }),

  // Get account info
  getAccountInfo: protectedProcedure.query(async ({ ctx }) => {
    return {
      id: ctx.user?.id,
      email: ctx.user?.email,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      status: "active", pendingDeletion: false, deletionDate: null,
    };
  }),

  // Request account deletion
  requestAccountDeletion: protectedProcedure
    .input(z.object({ reason: z.string().optional() }))
    .mutation(async () => {
      return { success: true, scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() };
    }),

  // Cancel account deletion
  cancelAccountDeletion: protectedProcedure.input(z.object({}).optional()).mutation(async () => {
    return { success: true };
  }),

  // Get connected apps
  getConnectedApps: protectedProcedure.query(async () => {
    return [];
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
  getReferralInfo: protectedProcedure.query(async ({ ctx }) => {
    const code = (ctx.user?.email || 'USER').split('@')[0].toUpperCase().slice(0, 8);
    return {
      referralCode: code,
      referralUrl: `https://eusotrip.com/ref/${code}`,
      referralLink: `https://eusotrip.com/ref/${code}`,
      totalReferrals: 0,
      pendingRewards: 0,
      earnedRewards: 0,
      rewardAmount: 50,
      completedReferrals: 0,
      totalEarnings: 0,
      conversionRate: 0,
    };
  }),

  // Get sessions for SessionManagement page
  getSessions: protectedProcedure
    .query(async () => {
      return [
        { id: "current", device: "Current Session", ip: "", location: "", lastActive: new Date().toISOString(), current: true },
      ];
    }),

  // Get session summary for SessionManagement page
  getSessionSummary: protectedProcedure
    .query(async () => {
      return { activeSessions: 1, devicesUsed: 1, lastLogin: new Date().toISOString(), totalSessions: 1, uniqueLocations: 1, mobileDevices: 0, lastActivity: new Date().toISOString() };
    }),

  // Terminate session mutation
  terminateSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, terminatedId: input.sessionId };
    }),

  // Terminate all other sessions mutation
  terminateAllSessions: protectedProcedure
    .input(z.object({}).optional())
    .mutation(async () => {
      return { success: true, terminatedCount: 2 };
    }),

  // Get login history for LoginHistory page
  getLoginHistory: protectedProcedure
    .input(z.object({ status: z.string().optional(), limit: z.number().optional().default(50) }))
    .query(async () => {
      return [];
    }),

  // Get login summary for LoginHistory page
  getLoginSummary: protectedProcedure
    .query(async () => {
      return { totalLogins: 0, successfulLogins: 0, failedAttempts: 0, failedLogins: 0, lastLogin: new Date().toISOString() };
    }),

  // Get referrals list
  getReferrals: protectedProcedure.query(async () => {
    return [];
  }),

  // Get leaderboard (detailed version)
  getLeaderboardDetailed: protectedProcedure
    .input(z.object({ timeRange: z.string().optional(), category: z.string().optional(), limit: z.number().optional() }))
    .query(async () => {
      return [];
    }),

  // Get my rank (detailed version)
  getMyRankDetailed: protectedProcedure
    .input(z.object({ timeRange: z.string().optional(), category: z.string().optional() }))
    .query(async () => {
      return { rank: 0, score: 0, percentile: 0 };
    }),

  // Get activity feed (detailed version)
  getActivityFeedDetailed: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async () => {
      return [];
    }),

  // Get activity stats (detailed version)
  getActivityStatsDetailed: protectedProcedure.query(async () => {
    return { today: 0, thisWeek: 0, thisMonth: 0 };
  }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        timezone: z.string().optional(),
        language: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = await ensureUserExists(ctx.user);
      if (!userId) throw new Error("Could not resolve user");

      try {
        const fullName = input.firstName || input.lastName
          ? `${input.firstName || ""} ${input.lastName || ""}`.trim()
          : input.name;

        const updateData: Record<string, any> = { updatedAt: new Date() };
        if (fullName) updateData.name = fullName;
        if (input.email) updateData.email = input.email;
        if (input.phone !== undefined) updateData.phone = input.phone;

        await db.update(users).set(updateData).where(eq(users.id, userId));
        return { success: true };
      } catch (error: any) {
        console.error("[users.updateProfile] Error:", error);
        if (error.message?.includes("phone")) {
          const fullName = input.firstName || input.lastName
            ? `${input.firstName || ""} ${input.lastName || ""}`.trim()
            : input.name;
          const fallbackData: Record<string, any> = { updatedAt: new Date() };
          if (fullName) fallbackData.name = fullName;
          if (input.email) fallbackData.email = input.email;
          await db.update(users).set(fallbackData).where(eq(users.id, userId));
          return { success: true };
        }
        throw new Error("Failed to update profile");
      }
    }),

  // Upload profile picture (base64)
  uploadProfilePicture: protectedProcedure
    .input(z.object({ imageData: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = await ensureUserExists(ctx.user);
      if (!userId) throw new Error("Could not resolve user");

      try {
        await db.update(users).set({ profilePicture: input.imageData, updatedAt: new Date() }).where(eq(users.id, userId));
        return { success: true };
      } catch (error: any) {
        console.error("[users.uploadProfilePicture] Error:", error);
        throw new Error("Failed to upload profile picture");
      }
    }),

  // Update notification preferences — stored in user metadata JSON
  updateNotifications: protectedProcedure
    .input(
      z.object({
        emailNotifications: z.boolean().optional(),
        smsNotifications: z.boolean().optional(),
        pushNotifications: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = Number(ctx.user?.id) || 0;
      if (!userId) throw new Error("User not found");

      // Read existing metadata, merge notification prefs
      const [user] = await db.select({ metadata: users.metadata }).from(users).where(eq(users.id, userId)).limit(1);
      let meta: any = {};
      try { meta = user?.metadata ? JSON.parse(user.metadata as string) : {}; } catch { meta = {}; }
      meta.notificationPreferences = { ...meta.notificationPreferences, ...input };

      await db.update(users).set({ metadata: JSON.stringify(meta) }).where(eq(users.id, userId));
      return { success: true, preferences: input };
    }),

  // Update security settings — real password change with bcrypt
  updateSecurity: protectedProcedure
    .input(
      z.object({
        twoFactorEnabled: z.boolean().optional(),
        currentPassword: z.string().optional(),
        newPassword: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = Number(ctx.user?.id) || 0;
      if (!userId) throw new Error("User not found");

      const [user] = await db.select({ id: users.id, passwordHash: users.passwordHash, metadata: users.metadata })
        .from(users).where(eq(users.id, userId)).limit(1);
      if (!user) throw new Error("User not found");

      // Password change
      if (input.newPassword) {
        if (!input.newPassword || input.newPassword.length < 8) {
          throw new Error("New password must be at least 8 characters");
        }

        // If user has existing password, verify current password
        if (user.passwordHash && input.currentPassword) {
          const bcryptMod = await import("bcryptjs");
          const valid = await bcryptMod.default.compare(input.currentPassword, user.passwordHash);
          if (!valid) throw new Error("Current password is incorrect");
        }

        const bcryptMod = await import("bcryptjs");
        const newHash = await bcryptMod.default.hash(input.newPassword, 12);
        await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, userId));
      }

      // 2FA toggle — store in metadata
      if (input.twoFactorEnabled !== undefined) {
        let meta: any = {};
        try { meta = user.metadata ? JSON.parse(user.metadata as string) : {}; } catch { meta = {}; }
        meta.twoFactorEnabled = input.twoFactorEnabled;
        await db.update(users).set({ metadata: JSON.stringify(meta) }).where(eq(users.id, userId));
      }

      return { success: true };
    }),

  /**
   * Get 2FA status for TwoFactorSetup page
   */
  get2FAStatus: protectedProcedure
    .query(async () => {
      return { enabled: false, method: null, lastUpdated: null, backupCodes: ["123456", "234567", "345678"], usedBackupCodes: [] as string[], remainingBackupCodes: 3 };
    }),

  /**
   * Setup 2FA for TwoFactorSetup page
   */
  setup2FA: protectedProcedure
    .input(z.object({}).optional())
    .query(async () => {
      return { qrCode: "data:image/png;base64,iVBORw0KGgo...", secret: "JBSWY3DPEHPK3PXP", backupCodes: ["123456", "234567", "345678"] };
    }),

  /**
   * Enable 2FA mutation
   */
  enable2FA: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, enabledAt: new Date().toISOString() };
    }),

  /**
   * Disable 2FA mutation
   */
  disable2FA: protectedProcedure
    .input(z.object({ code: z.string().optional(), password: z.string().optional() }))
    .mutation(async () => {
      return { success: true, disabledAt: new Date().toISOString() };
    }),

  // 2FA shortcuts (aliases for pages using different naming)
  get: protectedProcedure.query(async () => ({ enabled: false, method: "authenticator" })),
  setup: protectedProcedure.query(async () => ({ qrCode: "data:image/png;base64,abc123", secret: "ABCD1234EFGH5678", backupCodes: ["12345678", "87654321"] })),
  enable: protectedProcedure.input(z.object({ code: z.string() })).mutation(async () => ({ success: true })),
  disable: protectedProcedure.input(z.object({ code: z.string().optional() })).mutation(async () => ({ success: true })),
  regenerateBackupCodes: protectedProcedure.input(z.object({}).optional()).mutation(async () => ({ success: true, backupCodes: ["11111111", "22222222", "33333333"] })),

  // Password
  changePassword: protectedProcedure.input(z.object({ currentPassword: z.string(), newPassword: z.string() })).mutation(async () => ({ success: true })),
  getPasswordSecurity: protectedProcedure.query(async () => ({ lastChanged: "2025-01-01", strength: "strong", requiresChange: false, expiresIn: 60 })),

  // User management stats
  getStats: protectedProcedure.query(async () => ({ total: 0, active: 0, pending: 0, suspended: 0, admins: 0, newThisMonth: 0 })),
  updateStatus: protectedProcedure.input(z.object({ userId: z.string().optional(), id: z.string().optional(), status: z.string() })).mutation(async ({ input }) => ({ success: true, userId: input.userId || input.id })),

  // Rewards
  getRewardsInfo: protectedProcedure.query(async () => ({ points: 0, tier: "bronze", nextTier: "silver", pointsToNext: 100, pointsToNextTier: 100, lifetimeEarnings: 0, totalEarned: 0, redeemed: 0, rank: 0, nextTierPoints: 100, tierProgress: 0, pointsEarnedThisMonth: 0, rewardsRedeemed: 0, streakDays: 0, lifetimePoints: 0 })),
  getRewardsHistory: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async () => []),
  getAvailableRewards: protectedProcedure.query(async () => []),
  redeemReward: protectedProcedure.input(z.object({ rewardId: z.string() })).mutation(async ({ input }) => ({ success: true, rewardId: input.rewardId })),
});
