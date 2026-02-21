/**
 * EUSOSMS - IN-HOUSE SMS GATEWAY
 * 
 * Uses Azure Communication Services SMS
 * Same connection string as the email service (AZURE_EMAIL_CONNECTION_STRING)
 * 
 * Features:
 * - SMS sending and receiving
 * - Delivery tracking
 * - Opt-out management
 * - Bulk SMS
 * - Cost tracking
 */

import { getDb } from "../db";
import { smsMessages, smsOptOuts } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

const ACS_CONNECTION_STRING = process.env.AZURE_EMAIL_CONNECTION_STRING || "";
const ACS_SMS_FROM = process.env.ACS_SMS_FROM_NUMBER || "";

let smsClient: any = null;
let smsConfigured = false;
let smsInitPromise: Promise<void> | null = null;

async function initSmsClient() {
  if (!ACS_CONNECTION_STRING || !ACS_SMS_FROM) {
    if (!ACS_SMS_FROM) console.warn("[EusoSMS] ACS_SMS_FROM_NUMBER not set — SMS will be logged only");
    if (!ACS_CONNECTION_STRING) console.warn("[EusoSMS] AZURE_EMAIL_CONNECTION_STRING not set — SMS will be logged only");
    return;
  }
  try {
    const { SmsClient } = await import("@azure/communication-sms");
    smsClient = new SmsClient(ACS_CONNECTION_STRING);
    smsConfigured = true;
    console.log("[EusoSMS] Azure Communication Services SMS configured, from:", ACS_SMS_FROM);
  } catch (err) {
    console.warn("[EusoSMS] @azure/communication-sms not available — SMS will be logged only");
  }
}

// Lazy init on first import
smsInitPromise = initSmsClient();

export interface SendSmsParams {
  to: string;
  message: string;
  userId?: number;
}

export interface SmsStatus {
  id: number;
  status: string;
  sentAt?: Date;
  deliveredAt?: Date;
  errorMessage?: string;
}

/**
 * Send an SMS message
 */
export async function sendSms(params: SendSmsParams): Promise<{ id: number; status: string }> {
  if (smsInitPromise) await smsInitPromise;

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if number has opted out
  const [optOut] = await db
    .select()
    .from(smsOptOuts)
    .where(eq(smsOptOuts.phoneNumber, params.to))
    .limit(1);

  if (optOut) {
    throw new Error("Phone number has opted out of SMS");
  }

  // Validate phone number format
  const cleanNumber = cleanPhoneNumber(params.to);
  if (!isValidPhoneNumber(cleanNumber)) {
    throw new Error("Invalid phone number format");
  }

  const fromNumber = ACS_SMS_FROM || "+10000000000";

  // Insert SMS record
  const [result] = await db
    .insert(smsMessages)
    .values({
      from: fromNumber,
      to: cleanNumber,
      message: params.message,
      status: "QUEUED",
      direction: "OUTBOUND",
      userId: params.userId,
      cost: "0.0075", // $0.0075 per SMS
    })
    .$returningId();

  // Actually send via Azure Communication Services SMS
  if (smsConfigured && smsClient) {
    try {
      const sendResults = await smsClient.send({
        from: fromNumber,
        to: [cleanNumber],
        message: params.message,
      });
      const sr = sendResults[0];
      if (sr?.successful) {
        await db.update(smsMessages).set({ status: "SENT", sentAt: new Date() }).where(eq(smsMessages.id, result.id));
        console.log("[EusoSMS] Sent to:", cleanNumber, "MessageId:", sr.messageId);
        return { id: result.id, status: "SENT" };
      } else {
        const errMsg = sr?.errorMessage || "Unknown ACS error";
        await db.update(smsMessages).set({ status: "FAILED", errorMessage: errMsg }).where(eq(smsMessages.id, result.id));
        console.error("[EusoSMS] Failed to send to:", cleanNumber, "Error:", errMsg);
        return { id: result.id, status: "FAILED" };
      }
    } catch (err: any) {
      const errMsg = err?.message || "ACS SMS exception";
      await db.update(smsMessages).set({ status: "FAILED", errorMessage: errMsg }).where(eq(smsMessages.id, result.id));
      console.error("[EusoSMS] Exception sending to:", cleanNumber, err);
      return { id: result.id, status: "FAILED" };
    }
  } else {
    // Not configured — log but do NOT mark as sent
    console.warn("[EusoSMS] SMS not configured. Would send to:", cleanNumber, "Message:", params.message.slice(0, 80) + "...");
    await db.update(smsMessages).set({ status: "FAILED", errorMessage: "SMS gateway not configured" }).where(eq(smsMessages.id, result.id));
    return { id: result.id, status: "NOT_CONFIGURED" };
  }
}

/**
 * Send bulk SMS messages
 */
export async function sendBulkSms(
  phoneNumbers: string[],
  message: string,
  userId?: number
): Promise<{ sent: number; failed: number; results: Array<{ to: string; success: boolean; error?: string }> }> {
  const results: Array<{ to: string; success: boolean; error?: string }> = [];
  let sent = 0;
  let failed = 0;

  for (const phoneNumber of phoneNumbers) {
    try {
      await sendSms({ to: phoneNumber, message, userId });
      results.push({ to: phoneNumber, success: true });
      sent++;
    } catch (error) {
      results.push({
        to: phoneNumber,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      failed++;
    }
  }

  return { sent, failed, results };
}

/**
 * Get SMS delivery status
 */
export async function getSmsStatus(smsId: number): Promise<SmsStatus> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [sms] = await db
    .select()
    .from(smsMessages)
    .where(eq(smsMessages.id, smsId))
    .limit(1);

  if (!sms) {
    throw new Error("SMS not found");
  }

  return {
    id: sms.id,
    status: sms.status,
    sentAt: sms.sentAt || undefined,
    deliveredAt: sms.deliveredAt || undefined,
    errorMessage: sms.errorMessage || undefined,
  };
}

/**
 * Receive incoming SMS (webhook handler)
 */
export async function receiveIncomingSms(from: string, to: string, message: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check for opt-out keywords
  const normalizedMessage = message.trim().toLowerCase();
  if (["stop", "unsubscribe", "cancel", "end", "quit"].includes(normalizedMessage)) {
    await optOutPhoneNumber(from);
    
    // Send confirmation
    await sendSms({
      to: from,
      message: "You have been unsubscribed from SMS notifications. Reply START to resubscribe.",
    });
    
    return { action: "opted_out" };
  }

  // Check for opt-in keywords
  if (["start", "subscribe", "yes"].includes(normalizedMessage)) {
    await optInPhoneNumber(from);
    
    // Send confirmation
    await sendSms({
      to: from,
      message: "You have been subscribed to SMS notifications. Reply STOP to unsubscribe.",
    });
    
    return { action: "opted_in" };
  }

  // Store incoming message
  await db.insert(smsMessages).values({
    from,
    to,
    message,
    status: "DELIVERED",
    direction: "INBOUND",
    deliveredAt: new Date(),
  });

  return { action: "received" };
}

/**
 * Opt out a phone number
 */
export async function optOutPhoneNumber(phoneNumber: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const cleanNumber = cleanPhoneNumber(phoneNumber);

  // Check if already opted out
  const [existing] = await db
    .select()
    .from(smsOptOuts)
    .where(eq(smsOptOuts.phoneNumber, cleanNumber))
    .limit(1);

  if (!existing) {
    await db.insert(smsOptOuts).values({
      phoneNumber: cleanNumber,
    });
  }

  return { success: true };
}

/**
 * Opt in a phone number (remove from opt-out list)
 */
export async function optInPhoneNumber(phoneNumber: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const cleanNumber = cleanPhoneNumber(phoneNumber);

  await db.delete(smsOptOuts).where(eq(smsOptOuts.phoneNumber, cleanNumber));

  return { success: true };
}

/**
 * Get SMS history for a phone number
 */
export async function getSmsHistory(phoneNumber: string, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const cleanNumber = cleanPhoneNumber(phoneNumber);

  const history = await db
    .select()
    .from(smsMessages)
    .where(
      and(
        eq(smsMessages.to, cleanNumber),
        eq(smsMessages.direction, "OUTBOUND")
      )
    )
    .orderBy(desc(smsMessages.createdAt))
    .limit(limit);

  return history;
}

/**
 * Get SMS cost summary
 */
export async function getSmsCostSummary(userId?: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // TODO: Add date filtering
  const messages = await db
    .select()
    .from(smsMessages)
    .where(
      and(
        eq(smsMessages.direction, "OUTBOUND"),
        userId ? eq(smsMessages.userId, userId) : undefined
      )
    );

  const totalCost = messages.reduce((sum, msg) => {
    return sum + (msg.cost ? parseFloat(msg.cost) : 0);
  }, 0);

  return {
    totalMessages: messages.length,
    totalCost: totalCost.toFixed(4),
    averageCostPerMessage: messages.length > 0 ? (totalCost / messages.length).toFixed(4) : "0.0000",
  };
}

/**
 * Clean phone number to E.164 format
 */
function cleanPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, "");

  // Add +1 for US numbers if not present
  if (cleaned.length === 10) {
    cleaned = "1" + cleaned;
  }

  // Add + prefix
  if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }

  return cleaned;
}

/**
 * Validate phone number format
 */
function isValidPhoneNumber(phoneNumber: string): boolean {
  // Basic E.164 validation
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

/**
 * Mark SMS as delivered (webhook callback)
 */
export async function markSmsDelivered(smsId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(smsMessages)
    .set({
      status: "DELIVERED",
      deliveredAt: new Date(),
    })
    .where(eq(smsMessages.id, smsId));

  return { success: true };
}

/**
 * Mark SMS as failed
 */
export async function markSmsFailed(smsId: number, errorCode: string, errorMessage: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(smsMessages)
    .set({
      status: "FAILED",
      errorCode,
      errorMessage,
    })
    .where(eq(smsMessages.id, smsId));

  return { success: true };
}

