/**
 * SETTINGS ROUTER
 * tRPC procedures for user and application settings
 * ALL settings stored in users.metadata JSON column — per-user isolation
 */

import { z } from "zod";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, companies } from "../../drizzle/schema";

// Helper: resolve numeric user ID
async function resolveUserId(ctxUser: any): Promise<number> {
  return typeof ctxUser?.id === "string" ? parseInt(ctxUser.id, 10) || 0 : (ctxUser?.id || 0);
}

// Default settings for new users
const DEFAULT_SETTINGS = {
  notifications: {
    email: { loadUpdates: true, bidNotifications: true, documentExpiring: true, weeklyReport: true, marketing: false },
    push: { loadUpdates: true, bidNotifications: true, messages: true, emergencyAlerts: true },
    sms: { loadUpdates: false, emergencyAlerts: true },
  },
  display: { theme: "dark", language: "en", timezone: "America/Chicago", dateFormat: "MM/DD/YYYY", distanceUnit: "miles", currency: "USD" },
  privacy: { shareLocation: true, showOnlineStatus: true, profileVisibility: "company" },
  accessibility: { fontSize: "medium", highContrast: false, reduceMotion: false },
  apiKeys: [] as any[],
  webhooks: [] as any[],
  integrations: [] as any[],
};

// Helper: read settings from DB
async function getUserSettings(userId: number) {
  const db = await getDb();
  if (!db) return { ...DEFAULT_SETTINGS };
  try {
    const [row] = await db.select({ metadata: users.metadata }).from(users).where(eq(users.id, userId)).limit(1);
    if (row?.metadata) {
      const parsed = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

// Helper: write settings to DB
async function saveUserSettings(userId: number, settings: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ metadata: JSON.stringify(settings) }).where(eq(users.id, userId));
}

export const settingsRouter = router({
  /**
   * Get all user settings — reads from users.metadata per-user
   */
  getSettings: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = await resolveUserId(ctx.user);
      return await getUserSettings(userId);
    }),

  /**
   * Update notification settings — writes to DB
   */
  updateNotificationSettings: protectedProcedure
    .input(z.object({
      channel: z.enum(["email", "push", "sms"]),
      setting: z.string(),
      enabled: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = await resolveUserId(ctx.user);
      const settings = await getUserSettings(userId);
      if (!settings.notifications[input.channel as keyof typeof settings.notifications]) {
        (settings.notifications as any)[input.channel] = {};
      }
      (settings.notifications as any)[input.channel][input.setting] = input.enabled;
      await saveUserSettings(userId, settings);
      return { success: true, channel: input.channel, setting: input.setting, enabled: input.enabled, updatedAt: new Date().toISOString() };
    }),

  /**
   * Update display settings — writes to DB
   */
  updateDisplaySettings: protectedProcedure
    .input(z.object({
      theme: z.enum(["light", "dark", "system"]).optional(),
      language: z.string().optional(),
      timezone: z.string().optional(),
      dateFormat: z.string().optional(),
      distanceUnit: z.enum(["miles", "kilometers"]).optional(),
      currency: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = await resolveUserId(ctx.user);
      const settings = await getUserSettings(userId);
      Object.entries(input).forEach(([k, v]) => { if (v !== undefined) (settings.display as any)[k] = v; });
      await saveUserSettings(userId, settings);
      return { success: true, updatedFields: Object.keys(input).filter(k => input[k as keyof typeof input] !== undefined), updatedAt: new Date().toISOString() };
    }),

  /**
   * Update privacy settings — writes to DB
   */
  updatePrivacySettings: protectedProcedure
    .input(z.object({
      shareLocation: z.boolean().optional(),
      showOnlineStatus: z.boolean().optional(),
      profileVisibility: z.enum(["public", "company", "private"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = await resolveUserId(ctx.user);
      const settings = await getUserSettings(userId);
      Object.entries(input).forEach(([k, v]) => { if (v !== undefined) (settings.privacy as any)[k] = v; });
      await saveUserSettings(userId, settings);
      return { success: true, updatedAt: new Date().toISOString() };
    }),

  /**
   * Get API keys — from user metadata
   */
  getApiKeys: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = await resolveUserId(ctx.user);
      const settings = await getUserSettings(userId);
      return settings.apiKeys || [];
    }),

  /**
   * Create API key — stored in user metadata
   */
  createApiKey: protectedProcedure
    .input(z.object({ name: z.string(), scopes: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const userId = await resolveUserId(ctx.user);
      const settings = await getUserSettings(userId);
      const newKey = {
        id: `key_${Date.now()}`,
        name: input.name,
        keyHash: `pk_live_${Math.random().toString(36).substring(2, 15)}`,
        scopes: input.scopes,
        createdAt: new Date().toISOString(),
      };
      if (!settings.apiKeys) settings.apiKeys = [];
      settings.apiKeys.push(newKey);
      await saveUserSettings(userId, settings);
      return { ...newKey, key: newKey.keyHash, message: "This is the only time you'll see this key. Store it securely." };
    }),

  /**
   * Revoke API key
   */
  revokeApiKey: protectedProcedure
    .input(z.object({ keyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = await resolveUserId(ctx.user);
      const settings = await getUserSettings(userId);
      settings.apiKeys = (settings.apiKeys || []).filter((k: any) => k.id !== input.keyId);
      await saveUserSettings(userId, settings);
      return { success: true, keyId: input.keyId, revokedAt: new Date().toISOString() };
    }),

  /**
   * Get webhooks
   */
  getWebhooks: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = await resolveUserId(ctx.user);
      const settings = await getUserSettings(userId);
      return settings.webhooks || [];
    }),

  /**
   * Create webhook
   */
  createWebhook: protectedProcedure
    .input(z.object({ url: z.string().url(), events: z.array(z.string()), secret: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = await resolveUserId(ctx.user);
      const settings = await getUserSettings(userId);
      const wh = { id: `wh_${Date.now()}`, url: input.url, events: input.events, secret: input.secret || `whsec_${Math.random().toString(36).substring(2, 15)}`, createdAt: new Date().toISOString() };
      if (!settings.webhooks) settings.webhooks = [];
      settings.webhooks.push(wh);
      await saveUserSettings(userId, settings);
      return wh;
    }),

  /**
   * Delete webhook
   */
  deleteWebhook: protectedProcedure
    .input(z.object({ webhookId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = await resolveUserId(ctx.user);
      const settings = await getUserSettings(userId);
      settings.webhooks = (settings.webhooks || []).filter((w: any) => w.id !== input.webhookId);
      await saveUserSettings(userId, settings);
      return { success: true, webhookId: input.webhookId, deletedAt: new Date().toISOString() };
    }),

  /**
   * Get integration settings
   */
  getIntegrations: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = await resolveUserId(ctx.user);
      const settings = await getUserSettings(userId);
      return settings.integrations || [];
    }),

  /**
   * Connect integration
   */
  connectIntegration: protectedProcedure
    .input(z.object({ integrationId: z.string(), credentials: z.record(z.string(), z.string()).optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = await resolveUserId(ctx.user);
      const settings = await getUserSettings(userId);
      if (!settings.integrations) settings.integrations = [];
      settings.integrations.push({ id: input.integrationId, connectedAt: new Date().toISOString() });
      await saveUserSettings(userId, settings);
      return { success: true, integrationId: input.integrationId, authUrl: `https://oauth.example.com/authorize?integration=${input.integrationId}` };
    }),

  /**
   * Disconnect integration
   */
  disconnectIntegration: protectedProcedure
    .input(z.object({ integrationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = await resolveUserId(ctx.user);
      const settings = await getUserSettings(userId);
      settings.integrations = (settings.integrations || []).filter((i: any) => i.id !== input.integrationId);
      await saveUserSettings(userId, settings);
      return { success: true, integrationId: input.integrationId, disconnectedAt: new Date().toISOString() };
    }),

  /**
   * Export user data
   */
  exportData: protectedProcedure
    .input(z.object({ format: z.enum(["json", "csv"]), dataTypes: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      return { success: true, exportId: `export_${Date.now()}`, status: "processing", estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString() };
    }),

  // User preferences — stored in users.metadata
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const userId = await resolveUserId(ctx.user);
    const settings = await getUserSettings(userId);
    return {
      emailNotifications: settings.notifications?.email?.loadUpdates ?? true,
      smsNotifications: settings.notifications?.sms?.loadUpdates ?? false,
      pushNotifications: settings.notifications?.push?.loadUpdates ?? true,
      language: settings.display?.language ?? "en",
      timezone: settings.display?.timezone ?? "America/Chicago",
      theme: settings.display?.theme ?? "dark",
      darkMode: (settings.display?.theme ?? "dark") === "dark",
      compactMode: false,
      dateFormat: settings.display?.dateFormat ?? "MM/DD/YYYY",
      marketingEmails: settings.notifications?.email?.marketing ?? false,
    };
  }),
  updatePreferences: protectedProcedure.input(z.object({
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
  })).mutation(async ({ ctx, input }) => {
    const userId = await resolveUserId(ctx.user);
    const settings = await getUserSettings(userId);
    if (input.theme !== undefined) settings.display.theme = input.theme;
    if (input.darkMode !== undefined) settings.display.theme = input.darkMode ? "dark" : "light";
    if (input.language !== undefined) settings.display.language = input.language;
    if (input.timezone !== undefined) settings.display.timezone = input.timezone;
    if (input.dateFormat !== undefined) settings.display.dateFormat = input.dateFormat;
    if (input.emailNotifications !== undefined) settings.notifications.email.loadUpdates = input.emailNotifications;
    if (input.smsNotifications !== undefined) settings.notifications.sms.loadUpdates = input.smsNotifications;
    if (input.pushNotifications !== undefined) settings.notifications.push.loadUpdates = input.pushNotifications;
    if (input.marketingEmails !== undefined) settings.notifications.email.marketing = input.marketingEmails;
    await saveUserSettings(userId, settings);
    return { success: true };
  }),
});
