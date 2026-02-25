/**
 * NOTIFICATION SERVICE
 * Business logic for notifications, push tokens, and preferences
 */

import { eq, and, desc, gte, isNull } from "drizzle-orm";
import { getDb } from "../db";
import {
  notifications,
  notificationPreferences,
  pushTokens,
  users,
} from "../../drizzle/schema";

export interface NotificationPayload {
  userId: number;
  type: "load_update" | "bid_received" | "payment_received" | "message" | "geofence_alert" | "weather_alert" | "maintenance_due" | "compliance_expiring" | "system";
  title: string;
  message: string;
  data?: Record<string, unknown>;
  priority?: "low" | "normal" | "high" | "urgent";
}

export interface NotificationResult {
  sent: boolean;
  notificationId: number | null;
  channels: string[];
  errors?: string[];
}

export class NotificationService {
  /**
   * Send a notification to a user
   */
  async sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
    const db = await getDb();
    if (!db) {
      return { sent: false, notificationId: null, channels: [], errors: ["Database not available"] };
    }

    const result: NotificationResult = {
      sent: false,
      notificationId: null,
      channels: [],
      errors: [],
    };

    // Get user preferences
    const preferences = await this.getUserPreferences(payload.userId);

    // Check if notification type is enabled
    if (!this.isNotificationTypeEnabled(payload.type, preferences)) {
      return { sent: false, notificationId: null, channels: [], errors: ["Notification type disabled by user"] };
    }

    // Check quiet hours
    if (this.isInQuietHours(preferences)) {
      // Queue for later or skip based on priority
      if (payload.priority !== "urgent") {
        return { sent: false, notificationId: null, channels: [], errors: ["User is in quiet hours"] };
      }
    }

    // Create in-app notification
    if (preferences.inAppNotifications) {
      try {
        const [notifResult] = await db.insert(notifications).values({
          userId: payload.userId,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          data: payload.data,
          isRead: false,
        });

        result.notificationId = notifResult.insertId;
        result.channels.push("in_app");
      } catch (error) {
        result.errors?.push(`In-app notification failed: ${error}`);
      }
    }

    // Send push notification
    if (preferences.pushNotifications) {
      const pushSent = await this.sendPushNotification(payload);
      if (pushSent) {
        result.channels.push("push");
      }
    }

    // Send email notification (for important notifications)
    if (preferences.emailNotifications && this.shouldSendEmail(payload.type, payload.priority)) {
      const emailSent = await this.sendEmailNotification(payload);
      if (emailSent) {
        result.channels.push("email");
      }
    }

    // Send SMS notification (for urgent notifications)
    if (preferences.smsNotifications && payload.priority === "urgent") {
      const smsSent = await this.sendSmsNotification(payload);
      if (smsSent) {
        result.channels.push("sms");
      }
    }

    result.sent = result.channels.length > 0;
    return result;
  }

  /**
   * Send notification to multiple users
   */
  async sendBulkNotification(
    userIds: number[],
    notification: Omit<NotificationPayload, "userId">
  ): Promise<{ successful: number; failed: number }> {
    let successful = 0;
    let failed = 0;

    for (const userId of userIds) {
      const result = await this.sendNotification({ ...notification, userId });
      if (result.sent) {
        successful++;
      } else {
        failed++;
      }
    }

    return { successful, failed };
  }

  /**
   * Get user's notification preferences
   */
  async getUserPreferences(userId: number) {
    const db = await getDb();
    if (!db) {
      return this.getDefaultPreferences();
    }

    const [prefs] = await db.select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    if (!prefs) {
      // Create default preferences
      await db.insert(notificationPreferences).values({
        userId,
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        inAppNotifications: true,
        loadUpdates: true,
        bidAlerts: true,
        paymentAlerts: true,
        messageAlerts: true,
        missionAlerts: true,
        promotionalAlerts: false,
        weeklyDigest: true,
        quietHoursEnabled: false,
      });

      return this.getDefaultPreferences();
    }

    return prefs;
  }

  /**
   * Update user's notification preferences
   */
  async updatePreferences(
    userId: number,
    updates: Partial<{
      emailNotifications: boolean;
      pushNotifications: boolean;
      smsNotifications: boolean;
      inAppNotifications: boolean;
      loadUpdates: boolean;
      bidAlerts: boolean;
      paymentAlerts: boolean;
      messageAlerts: boolean;
      missionAlerts: boolean;
      promotionalAlerts: boolean;
      weeklyDigest: boolean;
      quietHoursEnabled: boolean;
      quietHoursStart: string;
      quietHoursEnd: string;
    }>
  ): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;

    const [existing] = await db.select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    if (!existing) {
      await db.insert(notificationPreferences).values({
        userId,
        ...updates,
      });
    } else {
      await db.update(notificationPreferences)
        .set(updates)
        .where(eq(notificationPreferences.userId, userId));
    }

    return true;
  }

  /**
   * Register push token
   */
  async registerPushToken(
    userId: number,
    token: string,
    platform: "ios" | "android" | "web",
    deviceId?: string,
    deviceName?: string
  ): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;

    // Check if token already exists
    const [existing] = await db.select()
      .from(pushTokens)
      .where(and(
        eq(pushTokens.userId, userId),
        eq(pushTokens.platform, platform)
      ))
      .limit(1);

    if (existing) {
      await db.update(pushTokens)
        .set({
          token,
          deviceId,
          deviceName,
          isActive: true,
          lastUsedAt: new Date(),
        })
        .where(eq(pushTokens.id, existing.id));
    } else {
      await db.insert(pushTokens).values({
        userId,
        token,
        platform,
        deviceId,
        deviceName,
        isActive: true,
      });
    }

    return true;
  }

  /**
   * Unregister push token
   */
  async unregisterPushToken(userId: number, token: string): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;

    await db.update(pushTokens)
      .set({ isActive: false })
      .where(and(
        eq(pushTokens.userId, userId),
        eq(pushTokens.token as any, token)
      ));

    return true;
  }

  /**
   * Get user's notifications
   */
  async getNotifications(
    userId: number,
    options: {
      unreadOnly?: boolean;
      type?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const db = await getDb();
    if (!db) return [];

    let query = db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(options.limit || 50)
      .offset(options.offset || 0);

    let results = await query;

    if (options.unreadOnly) {
      results = results.filter(n => !n.isRead);
    }

    if (options.type) {
      results = results.filter(n => n.type === options.type);
    }

    return results.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data,
      isRead: n.isRead,
      createdAt: n.createdAt?.toISOString(),
    }));
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number, userId: number): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;

    await db.update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ));

    return true;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: number): Promise<number> {
    const db = await getDb();
    if (!db) return 0;

    const unread = await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));

    await db.update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));

    return unread.length;
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: number): Promise<number> {
    const db = await getDb();
    if (!db) return 0;

    const unread = await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));

    return unread.length;
  }

  /**
   * Delete old notifications
   */
  async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    const db = await getDb();
    if (!db) return 0;

    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    // In a real implementation, you would delete notifications
    // For now, we'll just count them
    const old = await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.isRead, true),
        gte(notifications.createdAt, cutoffDate)
      ));

    return old.length;
  }

  // Private helper methods

  private getDefaultPreferences() {
    return {
      id: 0,
      userId: 0,
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      inAppNotifications: true,
      loadUpdates: true,
      bidAlerts: true,
      paymentAlerts: true,
      messageAlerts: true,
      missionAlerts: true,
      promotionalAlerts: false,
      weeklyDigest: true,
      quietHoursEnabled: false,
      quietHoursStart: null,
      quietHoursEnd: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private isNotificationTypeEnabled(type: string, preferences: any): boolean {
    const typeToPreference: Record<string, string> = {
      load_update: "loadUpdates",
      bid_received: "bidAlerts",
      payment_received: "paymentAlerts",
      message: "messageAlerts",
      geofence_alert: "loadUpdates",
      weather_alert: "loadUpdates",
      maintenance_due: "loadUpdates",
      compliance_expiring: "loadUpdates",
      system: "inAppNotifications",
    };

    const prefKey = typeToPreference[type];
    return prefKey ? (preferences[prefKey] !== false) : true;
  }

  private isInQuietHours(preferences: any): boolean {
    if (!preferences.quietHoursEnabled) return false;
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = preferences.quietHoursStart.split(":").map(Number);
    const [endHour, endMin] = preferences.quietHoursEnd.split(":").map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime < endTime;
    }
  }

  private shouldSendEmail(type: string, priority?: string): boolean {
    const emailTypes = ["payment_received", "compliance_expiring", "maintenance_due"];
    return emailTypes.includes(type) || priority === "high" || priority === "urgent";
  }

  private async sendPushNotification(payload: NotificationPayload): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;

    // Get user's push tokens
    const tokens = await db.select()
      .from(pushTokens)
      .where(and(
        eq(pushTokens.userId, payload.userId),
        eq(pushTokens.isActive, true)
      ));

    if (tokens.length === 0) return false;

    // In production, this would integrate with FCM, APNS, etc.
    // For now, we'll just simulate success
    console.log(`[Push] Sending to ${tokens.length} devices for user ${payload.userId}: ${payload.title}`);

    // Update last used timestamp
    for (const token of tokens) {
      await db.update(pushTokens)
        .set({ lastUsedAt: new Date() })
        .where(eq(pushTokens.id, token.id));
    }

    return true;
  }

  private async sendEmailNotification(payload: NotificationPayload): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;

    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user?.email) return false;

    try {
      const { emailService } = await import("../_core/email");
      const sent = await emailService.send({
        to: user.email,
        subject: `${payload.title} - EusoTrip`,
        html: `<div style="font-family:sans-serif;padding:20px"><h2>${payload.title}</h2><p>${payload.message}</p></div>`,
        text: `${payload.title}: ${payload.message}`,
      });
      return sent;
    } catch (err) {
      console.error(`[NotificationService] Email send failed for user ${payload.userId}:`, err);
      return false;
    }
  }

  private async sendSmsNotification(payload: NotificationPayload): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;

    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user?.phone) return false;

    try {
      const { sendSms } = await import("./eusosms");
      const result = await sendSms({
        to: user.phone,
        message: `EusoTrip: ${payload.title} — ${payload.message}`.slice(0, 160),
        userId: payload.userId,
      });
      return result.status !== "FAILED";
    } catch (err) {
      console.error(`[NotificationService] SMS send failed for user ${payload.userId}:`, err);
      return false;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
