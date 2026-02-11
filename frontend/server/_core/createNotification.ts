/**
 * NOTIFICATION HELPER — Creates DB notification records
 * Import from any router to fire notifications for any user type.
 * All notifications are user-scoped via userId — no cross-contamination.
 */

import { getDb } from "../db";
import { notifications } from "../../drizzle/schema";

type NotificationType =
  | "load_update"
  | "bid_received"
  | "payment_received"
  | "message"
  | "geofence_alert"
  | "weather_alert"
  | "maintenance_due"
  | "compliance_expiring"
  | "system";

interface CreateNotificationParams {
  userId: number;
  type: NotificationType;
  title: string;
  message?: string;
  data?: Record<string, any>;
}

/**
 * Insert a notification row for a specific user.
 * Safe to call from any router — fails silently with console.warn.
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const db = await getDb();
    if (!db || !params.userId) return;

    await db.insert(notifications).values({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message || "",
      data: params.data || {},
      isRead: false,
    });
  } catch (err) {
    console.warn("[Notifications] Failed to create notification:", err);
  }
}
