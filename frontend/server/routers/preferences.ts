/**
 * PREFERENCES ROUTER
 * tRPC procedures for user preferences
 */

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, notificationPreferences } from "../../drizzle/schema";

const DEFAULTS = {
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
};

export const preferencesRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) || 0 : (ctx.user?.id || 0);
    const db = await getDb();

    if (db && userId) {
      try {
        const [row] = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
        if (row) {
          return {
            emailNotifications: row.emailNotifications ?? DEFAULTS.emailNotifications,
            smsNotifications: row.smsNotifications ?? DEFAULTS.smsNotifications,
            pushNotifications: row.pushNotifications ?? DEFAULTS.pushNotifications,
            language: DEFAULTS.language,
            timezone: DEFAULTS.timezone,
            theme: DEFAULTS.theme,
            darkMode: DEFAULTS.darkMode,
            compactMode: DEFAULTS.compactMode,
            dateFormat: DEFAULTS.dateFormat,
            marketingEmails: row.promotionalAlerts ?? DEFAULTS.marketingEmails,
            distanceUnit: DEFAULTS.distanceUnit,
          };
        }
      } catch { /* table may not exist yet */ }
    }

    return { ...DEFAULTS };
  }),

  update: protectedProcedure.input(z.object({
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
  }).optional()).mutation(async ({ ctx, input }) => {
    const userId = typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) || 0 : (ctx.user?.id || 0);
    const db = await getDb();

    if (db && userId && input) {
      try {
        const updates: Record<string, boolean | undefined> = {};
        if (input.emailNotifications !== undefined) updates.emailNotifications = input.emailNotifications;
        if (input.smsNotifications !== undefined) updates.smsNotifications = input.smsNotifications;
        if (input.pushNotifications !== undefined) updates.pushNotifications = input.pushNotifications;
        if (input.marketingEmails !== undefined) updates.promotionalAlerts = input.marketingEmails;

        if (Object.keys(updates).length > 0) {
          const [existing] = await db.select({ id: notificationPreferences.id }).from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
          if (existing) {
            await db.update(notificationPreferences).set(updates).where(eq(notificationPreferences.userId, userId));
          } else {
            await db.insert(notificationPreferences).values({ userId, ...updates } as any);
          }
        }
      } catch { /* table may not exist yet */ }
    }

    return { success: true };
  }),

  reset: protectedProcedure.input(z.object({}).optional()).mutation(async ({ ctx }) => {
    const userId = typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) || 0 : (ctx.user?.id || 0);
    const db = await getDb();

    if (db && userId) {
      try {
        await db.delete(notificationPreferences).where(eq(notificationPreferences.userId, userId));
      } catch { /* table may not exist yet */ }
    }

    return { success: true };
  }),
});
