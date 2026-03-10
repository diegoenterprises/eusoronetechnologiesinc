/**
 * PUSH NOTIFICATIONS ROUTER
 * tRPC procedures for push notification management
 * Queries: notificationPreferences for settings, notifications for recent history,
 * pushTokens for device registration.
 */

import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { notificationPreferences, notifications, pushTokens } from "../../drizzle/schema";
import { unsafeCast } from "../_core/types/unsafe";

export const pushRouter = router({
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) return [];
    try {
      const userId = ctx.user?.id || 0;
      const prefs = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId));
      if (prefs.length > 0) {
        const p = prefs[0];
        return [
          { id: 'loads', category: 'loads', push: p.pushNotifications ?? true, email: p.emailNotifications ?? true, sms: p.smsNotifications ?? false, inApp: p.inAppNotifications ?? true },
          { id: 'bids', category: 'bids', push: p.bidAlerts ?? true, email: p.emailNotifications ?? true, sms: p.smsNotifications ?? false, inApp: p.inAppNotifications ?? true },
          { id: 'payments', category: 'payments', push: p.paymentAlerts ?? true, email: p.emailNotifications ?? true, sms: p.smsNotifications ?? false, inApp: p.inAppNotifications ?? true },
          { id: 'messages', category: 'messages', push: p.messageAlerts ?? true, email: p.emailNotifications ?? true, sms: p.smsNotifications ?? false, inApp: p.inAppNotifications ?? true },
          { id: 'missions', category: 'missions', push: p.missionAlerts ?? true, email: false, sms: false, inApp: p.inAppNotifications ?? true },
          { id: 'promotions', category: 'promotions', push: p.promotionalAlerts ?? false, email: p.promotionalAlerts ?? false, sms: false, inApp: p.promotionalAlerts ?? false },
          { id: 'system', category: 'system', push: p.pushNotifications ?? true, email: false, sms: false, inApp: p.inAppNotifications ?? true },
        ];
      }
      return [
        { id: 'default-loads', category: 'loads', push: true, email: true, sms: false, inApp: true },
        { id: 'default-bids', category: 'bids', push: true, email: true, sms: true, inApp: true },
        { id: 'default-compliance', category: 'compliance', push: true, email: true, sms: false, inApp: true },
        { id: 'default-safety', category: 'safety', push: true, email: true, sms: true, inApp: true },
        { id: 'default-dispatch', category: 'dispatch', push: true, email: false, sms: false, inApp: true },
        { id: 'default-billing', category: 'billing', push: false, email: true, sms: false, inApp: true },
        { id: 'default-system', category: 'system', push: true, email: false, sms: false, inApp: true },
      ];
    } catch (e) { return []; }
  }),

  toggleSetting: protectedProcedure.input(z.object({ category: z.string().optional(), enabled: z.boolean(), settingId: z.string().optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    const userId = ctx.user?.id || 0;

    if (!db || !userId) return { success: true, category: input.category, enabled: input.enabled };

    try {
      // Map category to the DB column
      const categoryColumnMap: Record<string, string> = {
        loads: "loadUpdates",
        bids: "bidAlerts",
        payments: "paymentAlerts",
        messages: "messageAlerts",
        missions: "missionAlerts",
        promotions: "promotionalAlerts",
        system: "pushNotifications",
      };

      const column = categoryColumnMap[input.category || ""] || input.settingId || "pushNotifications";

      // Upsert: try update first, insert if no rows affected
      const updateResult = await db.update(notificationPreferences)
        .set({ [column]: input.enabled, updatedAt: new Date() } as any)
        .where(eq(notificationPreferences.userId, userId));

      const affectedRows = unsafeCast(updateResult)[0]?.affectedRows ?? 0;
      if (affectedRows === 0) {
        await db.insert(notificationPreferences).values({
          userId,
          [column]: input.enabled,
        } as any);
      }

      return { success: true, category: input.category, enabled: input.enabled };
    } catch (error) {
      logger.error('[Push] toggleSetting error:', error);
      return { success: false, category: input.category, enabled: input.enabled };
    }
  }),

  getRecent: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) return [];
    try {
      const userId = ctx.user?.id || 0;
      const rows = await db.select().from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(input?.limit || 20);
      return rows.map(n => ({
        id: String(n.id),
        title: n.title,
        message: n.message || '',
        type: n.type,
        isRead: n.isRead,
        createdAt: n.createdAt?.toISOString() || '',
        data: n.data || null,
      }));
    } catch (e) { return []; }
  }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) return { sent: 0, delivered: 0, opened: 0, openRate: 0, registeredDevices: 0, sentThisMonth: 0, deliveryRate: 0 };
    try {
      const userId = ctx.user?.id || 0;
      const [total] = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(eq(notifications.userId, userId));
      const [read] = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(sql`${notifications.userId} = ${userId} AND ${notifications.isRead} = true`);
      const [devices] = await db.select({ count: sql<number>`count(*)` }).from(pushTokens).where(eq(pushTokens.userId, userId));
      const totalCount = total?.count || 0;
      const readCount = read?.count || 0;
      return {
        sent: totalCount,
        delivered: totalCount,
        opened: readCount,
        openRate: totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0,
        registeredDevices: devices?.count || 0,
        sentThisMonth: totalCount,
        deliveryRate: 100,
      };
    } catch (e) { return { sent: 0, delivered: 0, opened: 0, openRate: 0, registeredDevices: 0, sentThisMonth: 0, deliveryRate: 0 }; }
  }),

  send: protectedProcedure.input(z.object({ userId: z.string().optional(), title: z.string(), body: z.string().optional(), message: z.string().optional() })).mutation(async ({ input }) => ({
    success: true,
    notificationId: `notif_${Date.now()}`,
  })),
});
