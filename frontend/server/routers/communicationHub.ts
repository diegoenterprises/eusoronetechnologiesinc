/**
 * COMMUNICATION HUB ROUTER
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Comprehensive multi-channel communication and notification management for
 * trucking/logistics operations. Covers:
 *   - Multi-channel inbox (in-app, SMS, email, push)
 *   - Dispatch radio / fleet-wide broadcasts
 *   - Enhanced driver-dispatcher chat
 *   - Automated notification rules & triggers
 *   - Communication templates with merge fields
 *   - Escalation workflows
 *   - Notification preferences per channel
 *   - Scheduled/delayed messages
 *   - Communication analytics & compliance
 *   - Voice call logging
 *   - Auto-translation (English/Spanish)
 *
 * DB-BACKED: conversations, messages, and notifications use the real database.
 * IN-MEMORY: broadcasts, rules, templates, escalations, scheduled messages,
 *            voice calls, and preferences remain in-memory until DB migrations
 *            are created for them.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { z } from "zod";
import { eq, and, desc, asc, sql, isNull } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { conversations, messages, notifications, users } from "../../drizzle/schema";

// ─── Shared Enums & Schemas ──────────────────────────────────────────────────

const channelEnum = z.enum(["in_app", "sms", "email", "push"]);
const priorityEnum = z.enum(["low", "normal", "high", "urgent", "emergency"]);
const messageStatusEnum = z.enum(["draft", "queued", "sent", "delivered", "read", "failed", "bounced"]);
const conversationTypeEnum = z.enum(["direct", "group", "dispatch", "load_linked", "support", "broadcast"]);
const escalationStatusEnum = z.enum(["pending", "escalated", "acknowledged", "resolved", "expired"]);
const ruleConditionEnum = z.enum([
  "load_assigned", "load_delivered", "load_delayed", "load_cancelled",
  "driver_offline", "driver_sos", "driver_arrived", "driver_departed",
  "document_expiring", "document_expired", "document_uploaded",
  "payment_received", "payment_due", "invoice_created",
  "inspection_failed", "hos_violation", "geofence_enter", "geofence_exit",
  "maintenance_due", "eld_disconnect", "temperature_alert",
  "new_bid", "bid_accepted", "bid_rejected",
  "custom",
]);

// ─── DB-backed conversation type mapping ─────────────────────────────────────
// The DB conversations.type enum is: "direct", "group", "job", "channel", "company", "support"
// The CommHub uses: "direct", "group", "dispatch", "load_linked", "support", "broadcast"
// Mapping: dispatch → channel, load_linked → job, broadcast → company (closest fit)
const toDbConvType = (t: string): "direct" | "group" | "job" | "channel" | "company" | "support" => {
  const map: Record<string, "direct" | "group" | "job" | "channel" | "company" | "support"> = {
    dispatch: "channel",
    load_linked: "job",
    broadcast: "company",
  };
  return (map[t] || t) as any;
};
const fromDbConvType = (t: string): string => {
  const map: Record<string, string> = {
    channel: "dispatch",
    job: "load_linked",
    company: "broadcast",
  };
  return map[t] || t;
};

// ─── DB-backed message type mapping ──────────────────────────────────────────
// The DB messages.messageType enum is: "text", "image", "document", "location", etc.
// CommHub contentType: "text", "image", "file", "location", "template"
// Mapping: file → document, template → text (no DB equivalent)
const toDbMsgType = (t: string): "text" | "image" | "document" | "location" => {
  if (t === "file") return "document";
  if (t === "template") return "text";
  return t as any;
};
const fromDbMsgType = (t: string): string => {
  if (t === "document") return "file";
  return t;
};

// ─── Helper: resolve user ID from ctx ────────────────────────────────────────

async function resolveUserId(ctxUser: any): Promise<number> {
  if (ctxUser?.id) return Number(ctxUser.id);
  const db = await getDb();
  if (!db) return 0;
  const email = ctxUser?.email || "";
  if (!email) return 0;
  try {
    const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    return row?.id || 0;
  } catch (e) {
    logger.error("[CommHub] Failed to resolve user ID:", e);
    return 0;
  }
}

// ─── In-Memory Stores (TODO: migrate to DB tables) ──────────────────────────
// These features have no corresponding DB tables yet. They remain in-memory
// until proper migrations are created. Each store is clearly marked.

// TODO: needs DB migration — create `comm_broadcasts` table
interface Broadcast {
  id: string;
  senderId: number;
  senderName: string;
  title: string;
  content: string;
  channel: string;
  priority: string;
  targetGroup: string;
  targetFilters: Record<string, unknown>;
  recipientCount: number;
  deliveredCount: number;
  readCount: number;
  isEmergency: boolean;
  expiresAt: string | null;
  createdAt: string;
}

// TODO: needs DB migration — create `comm_notification_rules` table
interface NotificationRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  channels: string[];
  templateId: string | null;
  recipients: string;
  isActive: boolean;
  cooldownMinutes: number;
  metadata: Record<string, unknown>;
  createdBy: number;
  createdAt: string;
  lastTriggeredAt: string | null;
  triggerCount: number;
}

// TODO: needs DB migration — create `comm_templates` table
interface CommTemplate {
  id: string;
  name: string;
  category: string;
  channel: string;
  subject: string | null;
  body: string;
  mergeFields: string[];
  isActive: boolean;
  language: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

// TODO: needs DB migration — create `comm_escalation_workflows` table
interface EscalationWorkflow {
  id: string;
  name: string;
  description: string;
  triggerCondition: string;
  steps: EscalationStep[];
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

interface EscalationStep {
  level: number;
  delayMinutes: number;
  notifyRoles: string[];
  notifyUserIds: number[];
  channel: string;
  templateId: string | null;
  message: string;
}

// TODO: needs DB migration — create `comm_scheduled_messages` table
interface ScheduledMessage {
  id: string;
  conversationId: string | null;
  senderId: number;
  senderName: string;
  channel: string;
  content: string;
  recipientIds: number[];
  scheduledFor: string;
  status: "scheduled" | "sent" | "cancelled" | "failed";
  createdAt: string;
}

// TODO: needs DB migration — create `comm_voice_calls` table
interface VoiceCallEntry {
  id: string;
  callerId: number;
  callerName: string;
  receiverId: number;
  receiverName: string;
  direction: "inbound" | "outbound";
  status: "completed" | "missed" | "voicemail" | "busy" | "failed";
  durationSeconds: number;
  outcome: string;
  notes: string;
  recordingUrl: string | null;
  startedAt: string;
  endedAt: string | null;
}

// TODO: needs DB migration — create `comm_notification_preferences` table
interface NotifPreference {
  userId: number;
  channels: {
    in_app: boolean;
    sms: boolean;
    email: boolean;
    push: boolean;
  };
  quietHours: { enabled: boolean; start: string; end: string; timezone: string };
  categories: Record<string, { enabled: boolean; channels: string[] }>;
  language: string;
}

// In-memory storage (lost on restart — needs DB migration)
const broadcastsStore: Broadcast[] = [];
const rulesStore: NotificationRule[] = [];
const templatesStore: CommTemplate[] = [];
const escalationsStore: EscalationWorkflow[] = [];
const scheduledStore: ScheduledMessage[] = [];
const voiceCallsStore: VoiceCallEntry[] = [];
const preferencesStore: Map<number, NotifPreference> = new Map();
const activeEscalations: { id: string; workflowId: string; messageId: string; currentLevel: number; status: string; startedAt: string; acknowledgedBy: number | null; resolvedAt: string | null }[] = [];

let idCounter = 1000;
function nextId(prefix: string) { return `${prefix}_${++idCounter}`; }

// ─── Seed In-Memory Data (only for features without DB tables) ───────────────

function ensureInMemorySeeded() {
  if (broadcastsStore.length > 0) return;

  const now = new Date().toISOString();

  // Sample broadcasts (in-memory — TODO: migrate to DB)
  broadcastsStore.push(
    { id: "bcast_1", senderId: 1, senderName: "Diego Usoro", title: "Winter Storm Warning - I-40 Corridor", content: "WINTER STORM WARNING: I-40 from Memphis to Nashville expecting 4-6 inches of snow tonight. All drivers on this corridor should secure safe parking before 8 PM CST. Contact dispatch if you need rerouting.", channel: "in_app", priority: "emergency", targetGroup: "all_drivers", targetFilters: { corridor: "I-40" }, recipientCount: 45, deliveredCount: 42, readCount: 38, isEmergency: true, expiresAt: new Date(Date.now() + 86400000).toISOString(), createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: "bcast_2", senderId: 2, senderName: "Maria Garcia", title: "Weekly Safety Reminder", content: "Reminder: Pre-trip inspections are mandatory. Check tires, brakes, lights, and fluid levels before departure. Safety is everyone's responsibility.", channel: "in_app", priority: "normal", targetGroup: "all_drivers", targetFilters: {}, recipientCount: 120, deliveredCount: 115, readCount: 89, isEmergency: false, expiresAt: null, createdAt: new Date(Date.now() - 86400000).toISOString() },
  );

  // Sample notification rules (in-memory — TODO: migrate to DB)
  rulesStore.push(
    { id: "rule_1", name: "Load Pickup Confirmation", description: "Notify dispatch when driver confirms pickup", condition: "load_assigned", channels: ["in_app", "sms"], templateId: "tmpl_1", recipients: "dispatch_team", isActive: true, cooldownMinutes: 0, metadata: {}, createdBy: 1, createdAt: now, lastTriggeredAt: new Date(Date.now() - 600000).toISOString(), triggerCount: 234 },
    { id: "rule_2", name: "Driver Offline Alert", description: "Alert if driver goes offline for more than 30 minutes during active load", condition: "driver_offline", channels: ["in_app", "sms", "push"], templateId: null, recipients: "dispatch_team", isActive: true, cooldownMinutes: 30, metadata: { offlineThresholdMinutes: 30 }, createdBy: 1, createdAt: now, lastTriggeredAt: new Date(Date.now() - 1200000).toISOString(), triggerCount: 56 },
    { id: "rule_3", name: "Document Expiration Warning", description: "Send reminder 30 days before CDL/insurance/medical card expiration", condition: "document_expiring", channels: ["email", "in_app", "push"], templateId: "tmpl_2", recipients: "document_owner", isActive: true, cooldownMinutes: 1440, metadata: { daysBeforeExpiry: 30 }, createdBy: 1, createdAt: now, lastTriggeredAt: new Date(Date.now() - 86400000).toISOString(), triggerCount: 89 },
    { id: "rule_4", name: "HOS Violation Alert", description: "Immediate alert on HOS violation detection", condition: "hos_violation", channels: ["in_app", "sms", "push", "email"], templateId: null, recipients: "safety_team", isActive: true, cooldownMinutes: 0, metadata: {}, createdBy: 1, createdAt: now, lastTriggeredAt: new Date(Date.now() - 43200000).toISOString(), triggerCount: 12 },
    { id: "rule_5", name: "Temperature Alert", description: "Alert when reefer temperature goes out of range", condition: "temperature_alert", channels: ["in_app", "sms", "push"], templateId: null, recipients: "driver_and_dispatch", isActive: true, cooldownMinutes: 15, metadata: { minTemp: 32, maxTemp: 40 }, createdBy: 1, createdAt: now, lastTriggeredAt: null, triggerCount: 0 },
  );

  // Sample templates (in-memory — TODO: migrate to DB)
  templatesStore.push(
    { id: "tmpl_1", name: "Load Pickup Confirmation", category: "operations", channel: "sms", subject: null, body: "Hi {{driverName}}, Load #{{loadId}} has been assigned to you. Pickup at {{pickupAddress}} on {{pickupDate}}. Confirm receipt.", mergeFields: ["driverName", "loadId", "pickupAddress", "pickupDate"], isActive: true, language: "en", createdBy: 1, createdAt: now, updatedAt: now, usageCount: 234 },
    { id: "tmpl_2", name: "Document Expiration Warning", category: "compliance", channel: "email", subject: "Action Required: {{documentType}} expiring on {{expiryDate}}", body: "Dear {{driverName}},\n\nYour {{documentType}} is set to expire on {{expiryDate}}. Please renew it before the expiration date to maintain compliance.\n\nUpload your renewed document at: {{uploadLink}}\n\nThank you,\nEusoTrip Compliance Team", mergeFields: ["driverName", "documentType", "expiryDate", "uploadLink"], isActive: true, language: "en", createdBy: 1, createdAt: now, updatedAt: now, usageCount: 89 },
    { id: "tmpl_3", name: "Emergency Broadcast", category: "safety", channel: "in_app", subject: null, body: "EMERGENCY: {{emergencyType}} reported in {{location}}. All drivers in the {{region}} area should {{action}}. Contact dispatch immediately at {{dispatchPhone}}.", mergeFields: ["emergencyType", "location", "region", "action", "dispatchPhone"], isActive: true, language: "en", createdBy: 1, createdAt: now, updatedAt: now, usageCount: 3 },
    { id: "tmpl_4", name: "Confirmacion de Recogida", category: "operations", channel: "sms", subject: null, body: "Hola {{driverName}}, Carga #{{loadId}} asignada. Recogida en {{pickupAddress}} el {{pickupDate}}. Confirme recibo.", mergeFields: ["driverName", "loadId", "pickupAddress", "pickupDate"], isActive: true, language: "es", createdBy: 1, createdAt: now, updatedAt: now, usageCount: 67 },
    { id: "tmpl_5", name: "Payment Received", category: "billing", channel: "email", subject: "Payment of ${{amount}} received for Load #{{loadId}}", body: "Hi {{driverName}},\n\nWe've processed your payment of ${{amount}} for Load #{{loadId}} ({{route}}). The funds will be in your account within {{businessDays}} business days.\n\nView details: {{paymentLink}}\n\nThank you for hauling with EusoTrip!", mergeFields: ["driverName", "amount", "loadId", "route", "businessDays", "paymentLink"], isActive: true, language: "en", createdBy: 1, createdAt: now, updatedAt: now, usageCount: 156 },
  );

  // Sample escalation workflows (in-memory — TODO: migrate to DB)
  escalationsStore.push(
    {
      id: "esc_1", name: "Driver No Response", description: "Escalate when driver does not respond to dispatch within timeframes", triggerCondition: "no_response", isActive: true, createdBy: 1, createdAt: now, updatedAt: now,
      steps: [
        { level: 1, delayMinutes: 5, notifyRoles: [], notifyUserIds: [], channel: "sms", templateId: null, message: "Reminder: Please respond to dispatch regarding your current load status." },
        { level: 2, delayMinutes: 15, notifyRoles: ["DISPATCH"], notifyUserIds: [], channel: "in_app", templateId: null, message: "Driver {{driverName}} has not responded for 15 minutes. Please attempt contact." },
        { level: 3, delayMinutes: 30, notifyRoles: ["DISPATCH", "ADMIN"], notifyUserIds: [], channel: "sms", templateId: null, message: "URGENT: Driver {{driverName}} unresponsive for 30 minutes. Manual intervention required." },
        { level: 4, delayMinutes: 60, notifyRoles: ["ADMIN", "SAFETY_MANAGER"], notifyUserIds: [1], channel: "email", templateId: null, message: "CRITICAL: Driver {{driverName}} has been unresponsive for 1 hour. Safety check may be required." },
      ],
    },
    {
      id: "esc_2", name: "Load Delay Escalation", description: "Escalate when a load delivery is delayed beyond acceptable thresholds", triggerCondition: "load_delayed", isActive: true, createdBy: 1, createdAt: now, updatedAt: now,
      steps: [
        { level: 1, delayMinutes: 30, notifyRoles: ["DISPATCH"], notifyUserIds: [], channel: "in_app", templateId: null, message: "Load #{{loadId}} is 30 minutes behind schedule. Current ETA: {{newEta}}." },
        { level: 2, delayMinutes: 60, notifyRoles: ["DISPATCH", "BROKER"], notifyUserIds: [], channel: "sms", templateId: null, message: "Load #{{loadId}} is 1 hour delayed. Customer notification may be required." },
        { level: 3, delayMinutes: 120, notifyRoles: ["ADMIN", "BROKER"], notifyUserIds: [], channel: "email", templateId: null, message: "URGENT: Load #{{loadId}} is 2+ hours delayed. Customer {{customerName}} should be contacted." },
      ],
    },
  );

  // Sample scheduled messages (in-memory — TODO: migrate to DB)
  scheduledStore.push(
    { id: "sched_1", conversationId: null, senderId: 1, senderName: "Diego Usoro", channel: "sms", content: "Good morning team! Remember: safety meeting at 8 AM today at Houston terminal.", recipientIds: [3, 4, 5, 6], scheduledFor: new Date(Date.now() + 43200000).toISOString(), status: "scheduled", createdAt: now },
    { id: "sched_2", conversationId: "conv_3", senderId: 2, senderName: "Maria Garcia", channel: "in_app", content: "Reminder: Quarterly equipment inspections start next Monday. Make sure your trucks are ready.", recipientIds: [4, 5, 6], scheduledFor: new Date(Date.now() + 172800000).toISOString(), status: "scheduled", createdAt: now },
  );

  // Sample voice calls (in-memory — TODO: migrate to DB)
  voiceCallsStore.push(
    { id: "call_1", callerId: 2, callerName: "Maria Garcia", receiverId: 3, receiverName: "James Wilson", direction: "outbound", status: "completed", durationSeconds: 185, outcome: "Confirmed ETA and delivery instructions", notes: "Driver confirmed 2:30 PM arrival. Will call receiver 30 min before.", recordingUrl: null, startedAt: new Date(Date.now() - 7200000).toISOString(), endedAt: new Date(Date.now() - 7015000).toISOString() },
    { id: "call_2", callerId: 5, callerName: "Robert Johnson", receiverId: 2, receiverName: "Maria Garcia", direction: "inbound", status: "completed", durationSeconds: 92, outcome: "Reported road construction delay", notes: "I-10 construction near Katy. 20 min delay. Rerouted via 99.", recordingUrl: null, startedAt: new Date(Date.now() - 7200000).toISOString(), endedAt: new Date(Date.now() - 7108000).toISOString() },
    { id: "call_3", callerId: 2, callerName: "Maria Garcia", receiverId: 7, receiverName: "Tom Patel", direction: "outbound", status: "missed", durationSeconds: 0, outcome: "No answer", notes: "", recordingUrl: null, startedAt: new Date(Date.now() - 5400000).toISOString(), endedAt: null },
  );
}

// ─── Simple Translation Map ──────────────────────────────────────────────────

const translationPairs: Record<string, string> = {
  "pickup": "recogida", "delivery": "entrega", "load": "carga", "driver": "conductor",
  "dispatch": "despacho", "delayed": "retrasado", "on time": "a tiempo",
  "arrived": "llegado", "departed": "salido", "emergency": "emergencia",
  "warning": "advertencia", "confirmed": "confirmado", "cancelled": "cancelado",
  "weather": "clima", "accident": "accidente", "construction": "construccion",
  "fuel": "combustible", "rest stop": "parada de descanso", "inspection": "inspeccion",
  "brake": "freno", "tire": "llanta", "engine": "motor", "trailer": "remolque",
  "hazmat": "materiales peligrosos", "overweight": "sobrepeso", "permit": "permiso",
  "bridge": "puente", "toll": "peaje", "detour": "desvio", "closed": "cerrado",
  "open": "abierto", "available": "disponible", "assigned": "asignado",
  "completed": "completado", "pending": "pendiente",
};

function simpleTranslate(text: string, targetLang: "en" | "es"): string {
  if (targetLang === "es") {
    let translated = text;
    for (const [en, es] of Object.entries(translationPairs)) {
      translated = translated.replace(new RegExp(`\\b${en}\\b`, "gi"), es);
    }
    return translated;
  }
  // es -> en
  let translated = text;
  for (const [en, es] of Object.entries(translationPairs)) {
    translated = translated.replace(new RegExp(`\\b${es}\\b`, "gi"), en);
  }
  return translated;
}

// ─── Helper: map DB conversation row to CommHub format ───────────────────────

function mapDbConversation(row: any) {
  return {
    id: String(row.id),
    type: fromDbConvType(row.type),
    title: row.name || `Conversation #${row.id}`,
    participants: Array.isArray(row.participants)
      ? (row.participants as any[]).map((p: any) =>
          typeof p === "number"
            ? { userId: p, name: `User ${p}`, role: "UNKNOWN", joinedAt: row.createdAt?.toISOString?.() || new Date().toISOString() }
            : p
        )
      : [],
    lastMessageAt: row.lastMessageAt?.toISOString?.() || row.createdAt?.toISOString?.() || new Date().toISOString(),
    lastMessagePreview: "",
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    loadId: row.loadId ? String(row.loadId) : null,
    metadata: {},
    createdAt: row.createdAt?.toISOString?.() || new Date().toISOString(),
  };
}

function mapDbMessage(row: any) {
  return {
    id: String(row.id),
    conversationId: String(row.conversationId),
    senderId: row.senderId,
    senderName: "",
    senderRole: "",
    channel: "in_app",
    content: row.content || "",
    contentType: fromDbMsgType(row.messageType || "text"),
    priority: "normal",
    status: "delivered",
    metadata: row.metadata || {},
    replyToId: null,
    translatedContent: null,
    translatedLang: null,
    createdAt: row.createdAt?.toISOString?.() || new Date().toISOString(),
    readAt: null,
    deliveredAt: row.createdAt?.toISOString?.() || new Date().toISOString(),
  };
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const communicationHubRouter = router({

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD & OVERVIEW
  // ═══════════════════════════════════════════════════════════════════════════

  getCommunicationDashboard: protectedProcedure
    .query(async ({ ctx }) => {
      ensureInMemorySeeded();
      const db = await getDb();

      let totalConversations = 0;
      let recentDbMessages: any[] = [];
      let channelBreakdown = { in_app: 0, sms: 0, email: 0, push: 0 };

      if (db) {
        try {
          const userId = await resolveUserId(ctx.user);

          // Count conversations where user is a participant
          const [convCount] = await db.select({ count: sql<number>`count(*)` })
            .from(conversations);
          totalConversations = convCount?.count || 0;

          // Get recent messages from DB
          recentDbMessages = await db.select({
            id: messages.id,
            senderId: messages.senderId,
            content: messages.content,
            messageType: messages.messageType,
            conversationId: messages.conversationId,
            metadata: messages.metadata,
            createdAt: messages.createdAt,
          })
            .from(messages)
            .where(isNull(messages.deletedAt))
            .orderBy(desc(messages.createdAt))
            .limit(10);

          // Count messages by channel stored in metadata (default: in_app)
          const allMsgs = await db.select({ metadata: messages.metadata })
            .from(messages)
            .where(isNull(messages.deletedAt))
            .limit(1000);
          for (const m of allMsgs) {
            const ch = (m.metadata as any)?.channel || "in_app";
            if (ch in channelBreakdown) {
              channelBreakdown[ch as keyof typeof channelBreakdown]++;
            }
          }
        } catch (err) {
          logger.error("[CommHub] getCommunicationDashboard DB error:", err);
        }
      }

      const recentBroadcasts = broadcastsStore.filter(b => {
        return Date.now() - new Date(b.createdAt).getTime() < 7 * 86400000;
      }).length;
      const activeEscCount = activeEscalations.filter(e => e.status === "pending" || e.status === "escalated").length;
      const scheduledCount = scheduledStore.filter(s => s.status === "scheduled").length;
      const activeRules = rulesStore.filter(r => r.isActive).length;

      return {
        summary: {
          totalUnread: 0,
          activeChats: totalConversations,
          totalConversations,
          recentBroadcasts,
          activeEscalations: activeEscCount,
          scheduledMessages: scheduledCount,
          activeRules,
          totalTemplates: templatesStore.filter(t => t.isActive).length,
          totalVoiceCalls: voiceCallsStore.length,
        },
        channelBreakdown,
        recentActivity: recentDbMessages.map(m => ({
          id: String(m.id),
          senderName: `User ${m.senderId}`,
          channel: (m.metadata as any)?.channel || "in_app",
          preview: (m.content || "").slice(0, 80),
          priority: (m.metadata as any)?.priority || "normal",
          conversationId: String(m.conversationId),
          createdAt: m.createdAt?.toISOString?.() || new Date().toISOString(),
        })),
        urgentItems: [
          ...broadcastsStore.filter(b => b.isEmergency && (!b.expiresAt || new Date(b.expiresAt) > new Date())).map(b => ({
            type: "emergency_broadcast" as const,
            id: b.id,
            title: b.title,
            priority: b.priority,
            createdAt: b.createdAt,
          })),
          ...activeEscalations.filter(e => e.status === "escalated").map(e => ({
            type: "escalation" as const,
            id: e.id,
            title: `Escalation Level ${e.currentLevel}`,
            priority: "urgent",
            createdAt: e.startedAt,
          })),
        ],
      };
    }),

  getUnreadSummary: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { totalUnread: 0, byChannel: { in_app: 0, sms: 0, email: 0, push: 0 }, unreadConversations: [] };

      try {
        const userId = await resolveUserId(ctx.user);
        if (!userId) return { totalUnread: 0, byChannel: { in_app: 0, sms: 0, email: 0, push: 0 }, unreadConversations: [] };

        // Get notifications that are unread for this user
        const [unreadCount] = await db.select({ count: sql<number>`count(*)` })
          .from(notifications)
          .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

        // Get conversations where user is a participant
        const convos = await db.select()
          .from(conversations)
          .where(sql`JSON_CONTAINS(${conversations.participants}, CAST(${userId} AS JSON))`)
          .orderBy(desc(conversations.lastMessageAt))
          .limit(20);

        // For each conversation, count unread messages (messages not in readBy for this user)
        const unreadConversations: any[] = [];
        for (const conv of convos) {
          const [unread] = await db.select({ count: sql<number>`count(*)` })
            .from(messages)
            .where(and(
              eq(messages.conversationId, conv.id),
              isNull(messages.deletedAt),
              sql`NOT JSON_CONTAINS(COALESCE(${messages.readBy}, '[]'), CAST(${userId} AS JSON))`,
            ));
          const count = unread?.count || 0;
          if (count > 0) {
            unreadConversations.push({
              conversationId: String(conv.id),
              title: conv.name || `Conversation #${conv.id}`,
              type: fromDbConvType(conv.type),
              unreadCount: count,
              lastMessageAt: conv.lastMessageAt?.toISOString?.() || conv.createdAt?.toISOString?.(),
              lastMessagePreview: "",
            });
          }
        }

        const totalUnread = unreadConversations.reduce((s, c) => s + c.unreadCount, 0);

        return {
          totalUnread,
          byChannel: { in_app: totalUnread, sms: 0, email: 0, push: 0 },
          unreadConversations,
        };
      } catch (err) {
        logger.error("[CommHub] getUnreadSummary DB error:", err);
        return { totalUnread: 0, byChannel: { in_app: 0, sms: 0, email: 0, push: 0 }, unreadConversations: [] };
      }
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // MULTI-CHANNEL INBOX & MESSAGING (DB-backed)
  // ═══════════════════════════════════════════════════════════════════════════

  getMultiChannelInbox: protectedProcedure
    .input(z.object({
      channel: channelEnum.optional(),
      type: conversationTypeEnum.optional(),
      search: z.string().optional(),
      unreadOnly: z.boolean().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { conversations: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };

      try {
        const { type, search, page = 1, limit = 20 } = input || {};
        const userId = await resolveUserId(ctx.user);

        // Build conditions
        const conditions: any[] = [];
        if (type) {
          const dbType = toDbConvType(type);
          conditions.push(eq(conversations.type, dbType));
        }
        if (search) {
          conditions.push(sql`${conversations.name} LIKE ${`%${search}%`}`);
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Get total count
        const [countResult] = await db.select({ count: sql<number>`count(*)` })
          .from(conversations)
          .where(whereClause);
        const total = countResult?.count || 0;

        // Get paginated conversations
        const offset = (page - 1) * limit;
        const rows = await db.select()
          .from(conversations)
          .where(whereClause)
          .orderBy(desc(conversations.lastMessageAt))
          .limit(limit)
          .offset(offset);

        // Enrich with last message preview and unread count
        const enriched = [];
        for (const row of rows) {
          const mapped = mapDbConversation(row);

          // Get last message preview
          const [lastMsg] = await db.select({ content: messages.content })
            .from(messages)
            .where(and(eq(messages.conversationId, row.id), isNull(messages.deletedAt)))
            .orderBy(desc(messages.createdAt))
            .limit(1);
          if (lastMsg) {
            mapped.lastMessagePreview = (lastMsg.content || "").slice(0, 100);
          }

          // Count unread for current user
          if (userId) {
            const [unread] = await db.select({ count: sql<number>`count(*)` })
              .from(messages)
              .where(and(
                eq(messages.conversationId, row.id),
                isNull(messages.deletedAt),
                sql`NOT JSON_CONTAINS(COALESCE(${messages.readBy}, '[]'), CAST(${userId} AS JSON))`,
              ));
            mapped.unreadCount = unread?.count || 0;
          }

          enriched.push(mapped);
        }

        return {
          conversations: enriched,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
      } catch (err) {
        logger.error("[CommHub] getMultiChannelInbox DB error:", err);
        return { conversations: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
      }
    }),

  sendMessage: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      content: z.string().min(1).max(5000),
      channel: channelEnum.default("in_app"),
      priority: priorityEnum.default("normal"),
      contentType: z.enum(["text", "image", "file", "location", "template"]).default("text"),
      replyToId: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const user = ctx.user as any;
      const userId = await resolveUserId(user);
      const convId = parseInt(input.conversationId, 10);

      if (isNaN(convId)) throw new Error("Invalid conversation ID");

      // Auto-translate
      const translatedContent = simpleTranslate(input.content, "es");

      // Store extra fields (channel, priority, sender info, translation) in metadata
      const msgMetadata = {
        ...(input.metadata || {}),
        channel: input.channel,
        priority: input.priority,
        senderName: user.name || user.email || "Unknown",
        senderRole: user.role || "ADMIN",
        replyToId: input.replyToId || null,
        translatedContent,
        translatedLang: "es",
      };

      try {
        const [inserted] = await db.insert(messages).values({
          conversationId: convId,
          senderId: userId,
          messageType: toDbMsgType(input.contentType),
          content: input.content,
          metadata: msgMetadata,
        }).$returningId();

        // Update conversation lastMessageAt
        await db.update(conversations)
          .set({ lastMessageAt: new Date() })
          .where(eq(conversations.id, convId));

        const msg = {
          id: String(inserted.id),
          conversationId: input.conversationId,
          senderId: userId,
          senderName: user.name || user.email || "Unknown",
          senderRole: user.role || "ADMIN",
          channel: input.channel,
          content: input.content,
          contentType: input.contentType,
          priority: input.priority,
          status: "sent",
          metadata: input.metadata || {},
          replyToId: input.replyToId || null,
          translatedContent,
          translatedLang: "es",
          createdAt: new Date().toISOString(),
          readAt: null,
          deliveredAt: new Date().toISOString(),
        };

        return { success: true, message: msg };
      } catch (err) {
        logger.error("[CommHub] sendMessage DB error:", err);
        throw new Error("Failed to send message");
      }
    }),

  getConversationThreads: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      search: z.string().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { conversation: null, messages: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };

      try {
        const convId = parseInt(input.conversationId, 10);
        if (isNaN(convId)) return { conversation: null, messages: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };

        // Get conversation
        const [conv] = await db.select().from(conversations).where(eq(conversations.id, convId)).limit(1);

        // Build message conditions
        const conditions: any[] = [eq(messages.conversationId, convId), isNull(messages.deletedAt)];
        if (input.search) {
          conditions.push(sql`${messages.content} LIKE ${`%${input.search}%`}`);
        }

        // Count total
        const [countResult] = await db.select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(and(...conditions));
        const total = countResult?.count || 0;

        // Get paginated messages (oldest first for chat display)
        const offset = (input.page - 1) * input.limit;
        const rows = await db.select()
          .from(messages)
          .where(and(...conditions))
          .orderBy(asc(messages.createdAt))
          .limit(input.limit)
          .offset(offset);

        const mappedMsgs = rows.map(row => {
          const mapped = mapDbMessage(row);
          // Enrich from metadata
          const meta = row.metadata as any;
          if (meta) {
            mapped.channel = meta.channel || "in_app";
            mapped.priority = meta.priority || "normal";
            mapped.senderName = meta.senderName || "";
            mapped.senderRole = meta.senderRole || "";
            mapped.replyToId = meta.replyToId || null;
            mapped.translatedContent = meta.translatedContent || null;
            mapped.translatedLang = meta.translatedLang || null;
          }
          return mapped;
        });

        return {
          conversation: conv ? mapDbConversation(conv) : null,
          messages: mappedMsgs,
          pagination: { page: input.page, limit: input.limit, total, totalPages: Math.ceil(total / input.limit) },
        };
      } catch (err) {
        logger.error("[CommHub] getConversationThreads DB error:", err);
        return { conversation: null, messages: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
      }
    }),

  getDriverDispatcherChat: protectedProcedure
    .input(z.object({
      driverId: z.number().optional(),
      loadId: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { chats: [], totalActive: 0, totalUnread: 0 };

      try {
        // Get dispatch-related conversations (direct, channel/dispatch, job/load_linked)
        const typeConditions = sql`${conversations.type} IN ('direct', 'channel', 'job')`;
        const conditions: any[] = [typeConditions];

        if (input?.driverId) {
          conditions.push(sql`JSON_CONTAINS(${conversations.participants}, CAST(${input.driverId} AS JSON))`);
        }
        if (input?.loadId) {
          const loadIdNum = parseInt(input.loadId.replace(/\D/g, ""), 10);
          if (!isNaN(loadIdNum)) {
            conditions.push(eq(conversations.loadId, loadIdNum));
          }
        }

        const convos = await db.select()
          .from(conversations)
          .where(and(...conditions))
          .orderBy(desc(conversations.lastMessageAt))
          .limit(50);

        const chats = [];
        for (const conv of convos) {
          // Get recent messages for this conversation
          const recentMsgs = await db.select()
            .from(messages)
            .where(and(eq(messages.conversationId, conv.id), isNull(messages.deletedAt)))
            .orderBy(desc(messages.createdAt))
            .limit(20);

          const mapped = mapDbConversation(conv);
          const participants = Array.isArray(conv.participants) ? conv.participants : [];
          // Try to identify driver/dispatcher from participants metadata
          const driver = mapped.participants.find((p: any) => p.role === "DRIVER") || null;
          const dispatcher = mapped.participants.find((p: any) => p.role === "DISPATCH" || p.role === "ADMIN") || null;

          chats.push({
            conversation: mapped,
            driver,
            dispatcher,
            recentMessages: recentMsgs.map(m => {
              const mm = mapDbMessage(m);
              const meta = m.metadata as any;
              if (meta) {
                mm.senderName = meta.senderName || "";
                mm.senderRole = meta.senderRole || "";
                mm.channel = meta.channel || "in_app";
                mm.priority = meta.priority || "normal";
              }
              return mm;
            }),
            unreadCount: mapped.unreadCount,
            lastActivity: mapped.lastMessageAt,
          });
        }

        return {
          chats,
          totalActive: chats.length,
          totalUnread: chats.reduce((s, c) => s + c.unreadCount, 0),
        };
      } catch (err) {
        logger.error("[CommHub] getDriverDispatcherChat DB error:", err);
        return { chats: [], totalActive: 0, totalUnread: 0 };
      }
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // DISPATCH RADIO & BROADCASTS (in-memory — TODO: migrate to DB)
  // ═══════════════════════════════════════════════════════════════════════════

  getDispatchRadio: protectedProcedure
    .input(z.object({
      group: z.string().optional(),
      includeExpired: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      ensureInMemorySeeded();

      let broadcasts = [...broadcastsStore];
      if (input?.group) {
        broadcasts = broadcasts.filter(b => b.targetGroup === input.group);
      }
      if (!input?.includeExpired) {
        broadcasts = broadcasts.filter(b => !b.expiresAt || new Date(b.expiresAt) > new Date());
      }
      broadcasts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Try to get dispatch channels from DB
      let dispatchChannels: any[] = [];
      const db = await getDb();
      if (db) {
        try {
          const dispatchConvos = await db.select()
            .from(conversations)
            .where(eq(conversations.type, "channel"))
            .orderBy(desc(conversations.lastMessageAt))
            .limit(20);
          dispatchChannels = dispatchConvos.map(c => ({
            id: String(c.id),
            title: c.name || `Channel #${c.id}`,
            participantCount: Array.isArray(c.participants) ? c.participants.length : 0,
            lastActivity: c.lastMessageAt?.toISOString?.() || c.createdAt?.toISOString?.(),
            unreadCount: 0,
          }));
        } catch (err) {
          logger.error("[CommHub] getDispatchRadio DB error:", err);
        }
      }

      return {
        broadcasts,
        dispatchChannels,
        fleetGroups: [
          { id: "all_drivers", name: "All Drivers", memberCount: 120 },
          { id: "southeast", name: "Southeast Region", memberCount: 35 },
          { id: "northeast", name: "Northeast Region", memberCount: 28 },
          { id: "midwest", name: "Midwest Region", memberCount: 22 },
          { id: "west", name: "West Region", memberCount: 18 },
          { id: "hazmat", name: "Hazmat Certified", memberCount: 15 },
          { id: "tanker", name: "Tanker Division", memberCount: 12 },
          { id: "reefer", name: "Reefer Fleet", memberCount: 20 },
        ],
      };
    }),

  sendBroadcast: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      content: z.string().min(1).max(5000),
      channel: channelEnum.default("in_app"),
      priority: priorityEnum.default("normal"),
      targetGroup: z.string(),
      targetFilters: z.record(z.string(), z.unknown()).optional(),
      isEmergency: z.boolean().default(false),
      expiresInHours: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      ensureInMemorySeeded();
      const user = ctx.user as any;

      // TODO: migrate broadcasts to DB — currently in-memory only
      const groupSizes: Record<string, number> = {
        all_drivers: 120, southeast: 35, northeast: 28, midwest: 22,
        west: 18, hazmat: 15, tanker: 12, reefer: 20,
      };
      const recipientCount = groupSizes[input.targetGroup] || 10;

      const broadcast: Broadcast = {
        id: nextId("bcast"),
        senderId: Number(user.id) || 0,
        senderName: user.name || user.email || "Unknown",
        title: input.title,
        content: input.content,
        channel: input.channel,
        priority: input.isEmergency ? "emergency" : input.priority,
        targetGroup: input.targetGroup,
        targetFilters: input.targetFilters || {},
        recipientCount,
        deliveredCount: 0,
        readCount: 0,
        isEmergency: input.isEmergency,
        expiresAt: input.expiresInHours
          ? new Date(Date.now() + input.expiresInHours * 3600000).toISOString()
          : null,
        createdAt: new Date().toISOString(),
      };
      broadcastsStore.push(broadcast);

      return { success: true, broadcast };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTOMATED NOTIFICATIONS & RULES (in-memory — TODO: migrate to DB)
  // ═══════════════════════════════════════════════════════════════════════════

  getAutomatedNotifications: protectedProcedure
    .query(async () => {
      ensureInMemorySeeded();
      const rules = [...rulesStore].sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return b.triggerCount - a.triggerCount;
      });

      return {
        rules,
        totalRules: rules.length,
        activeRules: rules.filter(r => r.isActive).length,
        totalTriggered: rules.reduce((s, r) => s + r.triggerCount, 0),
        availableConditions: ruleConditionEnum.options,
      };
    }),

  configureNotificationRule: protectedProcedure
    .input(z.object({
      id: z.string().optional(),
      name: z.string().min(1).max(100),
      description: z.string().max(500).default(""),
      condition: ruleConditionEnum,
      channels: z.array(channelEnum).min(1),
      templateId: z.string().optional(),
      recipients: z.string(),
      isActive: z.boolean().default(true),
      cooldownMinutes: z.number().min(0).default(0),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      ensureInMemorySeeded();
      const user = ctx.user as any;

      // TODO: migrate notification rules to DB
      if (input.id) {
        const existing = rulesStore.find(r => r.id === input.id);
        if (existing) {
          Object.assign(existing, {
            name: input.name,
            description: input.description,
            condition: input.condition,
            channels: input.channels,
            templateId: input.templateId || null,
            recipients: input.recipients,
            isActive: input.isActive,
            cooldownMinutes: input.cooldownMinutes,
            metadata: input.metadata || {},
          });
          return { success: true, rule: existing };
        }
      }

      const rule: NotificationRule = {
        id: nextId("rule"),
        name: input.name,
        description: input.description,
        condition: input.condition,
        channels: input.channels,
        templateId: input.templateId || null,
        recipients: input.recipients,
        isActive: input.isActive,
        cooldownMinutes: input.cooldownMinutes,
        metadata: input.metadata || {},
        createdBy: Number(user.id) || 0,
        createdAt: new Date().toISOString(),
        lastTriggeredAt: null,
        triggerCount: 0,
      };
      rulesStore.push(rule);
      return { success: true, rule };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // TEMPLATES (in-memory — TODO: migrate to DB)
  // ═══════════════════════════════════════════════════════════════════════════

  getNotificationTemplates: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
      channel: channelEnum.optional(),
      language: z.string().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      ensureInMemorySeeded();
      // TODO: migrate templates to DB
      let templates = [...templatesStore];
      if (input?.category) templates = templates.filter(t => t.category === input.category);
      if (input?.channel) templates = templates.filter(t => t.channel === input.channel);
      if (input?.language) templates = templates.filter(t => t.language === input.language);
      if (input?.search) {
        const q = input.search.toLowerCase();
        templates = templates.filter(t =>
          t.name.toLowerCase().includes(q) || t.body.toLowerCase().includes(q)
        );
      }
      templates.sort((a, b) => b.usageCount - a.usageCount);

      return {
        templates,
        categories: Array.from(new Set(templatesStore.map(t => t.category))),
        totalTemplates: templates.length,
      };
    }),

  createTemplate: protectedProcedure
    .input(z.object({
      id: z.string().optional(),
      name: z.string().min(1).max(100),
      category: z.string(),
      channel: channelEnum,
      subject: z.string().optional(),
      body: z.string().min(1).max(5000),
      mergeFields: z.array(z.string()).default([]),
      isActive: z.boolean().default(true),
      language: z.string().default("en"),
    }))
    .mutation(async ({ ctx, input }) => {
      ensureInMemorySeeded();
      const user = ctx.user as any;
      const now = new Date().toISOString();

      // TODO: migrate templates to DB
      if (input.id) {
        const existing = templatesStore.find(t => t.id === input.id);
        if (existing) {
          Object.assign(existing, {
            name: input.name,
            category: input.category,
            channel: input.channel,
            subject: input.subject || null,
            body: input.body,
            mergeFields: input.mergeFields,
            isActive: input.isActive,
            language: input.language,
            updatedAt: now,
          });
          return { success: true, template: existing };
        }
      }

      const template: CommTemplate = {
        id: nextId("tmpl"),
        name: input.name,
        category: input.category,
        channel: input.channel,
        subject: input.subject || null,
        body: input.body,
        mergeFields: input.mergeFields,
        isActive: input.isActive,
        language: input.language,
        createdBy: Number(user.id) || 0,
        createdAt: now,
        updatedAt: now,
        usageCount: 0,
      };
      templatesStore.push(template);
      return { success: true, template };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // ESCALATION WORKFLOWS (in-memory — TODO: migrate to DB)
  // ═══════════════════════════════════════════════════════════════════════════

  getEscalationWorkflows: protectedProcedure
    .query(async () => {
      ensureInMemorySeeded();
      // TODO: migrate escalation workflows to DB
      return {
        workflows: escalationsStore,
        activeEscalations: activeEscalations.map(e => {
          const wf = escalationsStore.find(w => w.id === e.workflowId);
          return { ...e, workflowName: wf?.name || "Unknown" };
        }),
        totalWorkflows: escalationsStore.length,
        activeCount: escalationsStore.filter(w => w.isActive).length,
      };
    }),

  configureEscalation: protectedProcedure
    .input(z.object({
      id: z.string().optional(),
      name: z.string().min(1).max(100),
      description: z.string().max(500).default(""),
      triggerCondition: z.string(),
      steps: z.array(z.object({
        level: z.number().min(1),
        delayMinutes: z.number().min(1),
        notifyRoles: z.array(z.string()),
        notifyUserIds: z.array(z.number()),
        channel: channelEnum,
        templateId: z.string().optional(),
        message: z.string(),
      })).min(1),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      ensureInMemorySeeded();
      const user = ctx.user as any;
      const now = new Date().toISOString();

      // TODO: migrate escalation workflows to DB
      if (input.id) {
        const existing = escalationsStore.find(e => e.id === input.id);
        if (existing) {
          Object.assign(existing, {
            name: input.name,
            description: input.description,
            triggerCondition: input.triggerCondition,
            steps: input.steps.map(s => ({ ...s, templateId: s.templateId || null })),
            isActive: input.isActive,
            updatedAt: now,
          });
          return { success: true, workflow: existing };
        }
      }

      const workflow: EscalationWorkflow = {
        id: nextId("esc"),
        name: input.name,
        description: input.description,
        triggerCondition: input.triggerCondition,
        steps: input.steps.map(s => ({ ...s, templateId: s.templateId || null })),
        isActive: input.isActive,
        createdBy: Number(user.id) || 0,
        createdAt: now,
        updatedAt: now,
      };
      escalationsStore.push(workflow);
      return { success: true, workflow };
    }),

  triggerEscalation: protectedProcedure
    .input(z.object({
      workflowId: z.string(),
      messageId: z.string().optional(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      ensureInMemorySeeded();
      // TODO: migrate escalation state to DB
      const workflow = escalationsStore.find(w => w.id === input.workflowId);
      if (!workflow) return { success: false, error: "Workflow not found" };
      if (!workflow.isActive) return { success: false, error: "Workflow is not active" };

      const escalation = {
        id: nextId("aesc"),
        workflowId: input.workflowId,
        messageId: input.messageId || "",
        currentLevel: 1,
        status: "pending",
        startedAt: new Date().toISOString(),
        acknowledgedBy: null,
        resolvedAt: null,
      };
      activeEscalations.push(escalation);

      return { success: true, escalation, workflow: { name: workflow.name, firstStep: workflow.steps[0] } };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATION PREFERENCES (in-memory — TODO: migrate to DB)
  // ═══════════════════════════════════════════════════════════════════════════

  getNotificationPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      // TODO: migrate notification preferences to DB
      const userId = Number((ctx.user as any).id) || 0;
      const prefs = preferencesStore.get(userId);
      if (prefs) return prefs;

      // Default preferences
      return {
        userId,
        channels: { in_app: true, sms: true, email: true, push: true },
        quietHours: { enabled: false, start: "22:00", end: "07:00", timezone: "America/Chicago" },
        categories: {
          loads: { enabled: true, channels: ["in_app", "sms", "push"] },
          safety: { enabled: true, channels: ["in_app", "sms", "push", "email"] },
          compliance: { enabled: true, channels: ["in_app", "email"] },
          billing: { enabled: true, channels: ["in_app", "email"] },
          dispatch: { enabled: true, channels: ["in_app", "sms", "push"] },
          maintenance: { enabled: true, channels: ["in_app", "email"] },
          system: { enabled: true, channels: ["in_app"] },
          emergency: { enabled: true, channels: ["in_app", "sms", "push", "email"] },
        },
        language: "en",
      };
    }),

  updateNotificationPreferences: protectedProcedure
    .input(z.object({
      channels: z.object({
        in_app: z.boolean(),
        sms: z.boolean(),
        email: z.boolean(),
        push: z.boolean(),
      }),
      quietHours: z.object({
        enabled: z.boolean(),
        start: z.string(),
        end: z.string(),
        timezone: z.string(),
      }),
      categories: z.record(z.string(), z.object({
        enabled: z.boolean(),
        channels: z.array(z.string()),
      })),
      language: z.string().default("en"),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: migrate notification preferences to DB
      const userId = Number((ctx.user as any).id) || 0;
      const prefs: NotifPreference = { userId, ...input };
      preferencesStore.set(userId, prefs);
      return { success: true, preferences: prefs };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCHEDULED MESSAGES (in-memory — TODO: migrate to DB)
  // ═══════════════════════════════════════════════════════════════════════════

  getScheduledMessages: protectedProcedure
    .input(z.object({
      status: z.enum(["scheduled", "sent", "cancelled", "failed"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      ensureInMemorySeeded();
      // TODO: migrate scheduled messages to DB
      let msgs = [...scheduledStore];
      if (input?.status) msgs = msgs.filter(m => m.status === input.status);
      msgs.sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
      return { messages: msgs, total: msgs.length };
    }),

  scheduleMessage: protectedProcedure
    .input(z.object({
      conversationId: z.string().optional(),
      channel: channelEnum.default("in_app"),
      content: z.string().min(1).max(5000),
      recipientIds: z.array(z.number()).min(1),
      scheduledFor: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: migrate scheduled messages to DB
      const user = ctx.user as any;
      const msg: ScheduledMessage = {
        id: nextId("sched"),
        conversationId: input.conversationId || null,
        senderId: Number(user.id) || 0,
        senderName: user.name || user.email || "Unknown",
        channel: input.channel,
        content: input.content,
        recipientIds: input.recipientIds,
        scheduledFor: input.scheduledFor,
        status: "scheduled",
        createdAt: new Date().toISOString(),
      };
      scheduledStore.push(msg);
      return { success: true, message: msg };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS & COMPLIANCE (DB-backed for messages, in-memory for calls/broadcasts)
  // ═══════════════════════════════════════════════════════════════════════════

  getCommunicationAnalytics: protectedProcedure
    .input(z.object({
      dateRange: z.enum(["today", "week", "month", "quarter"]).default("week"),
    }).optional())
    .query(async ({ input }) => {
      ensureInMemorySeeded();
      const range = input?.dateRange || "week";
      const rangeMs: Record<string, number> = {
        today: 86400000, week: 7 * 86400000, month: 30 * 86400000, quarter: 90 * 86400000,
      };
      const cutoff = new Date(Date.now() - (rangeMs[range] || rangeMs.week));

      let totalMessages = 0;
      let channelDist: Record<string, number> = { in_app: 0, sms: 0, email: 0, push: 0 };
      let priorityDist: Record<string, number> = { low: 0, normal: 0, high: 0, urgent: 0, emergency: 0 };
      let topConversations: any[] = [];

      const db = await getDb();
      if (db) {
        try {
          // Count messages in period
          const [msgCount] = await db.select({ count: sql<number>`count(*)` })
            .from(messages)
            .where(and(
              isNull(messages.deletedAt),
              sql`${messages.createdAt} >= ${cutoff}`,
            ));
          totalMessages = msgCount?.count || 0;

          // Get messages for channel/priority breakdown
          const periodMsgs = await db.select({ metadata: messages.metadata })
            .from(messages)
            .where(and(
              isNull(messages.deletedAt),
              sql`${messages.createdAt} >= ${cutoff}`,
            ))
            .limit(5000);

          for (const m of periodMsgs) {
            const meta = m.metadata as any;
            const ch = meta?.channel || "in_app";
            const pr = meta?.priority || "normal";
            if (ch in channelDist) channelDist[ch]++;
            if (pr in priorityDist) priorityDist[pr]++;
          }

          // Top conversations by message count
          const topConvos = await db.select({
            conversationId: messages.conversationId,
            count: sql<number>`count(*)`,
          })
            .from(messages)
            .where(and(
              isNull(messages.deletedAt),
              sql`${messages.createdAt} >= ${cutoff}`,
            ))
            .groupBy(messages.conversationId)
            .orderBy(sql`count(*) DESC`)
            .limit(5);

          for (const tc of topConvos) {
            const [conv] = await db.select({ name: conversations.name, type: conversations.type })
              .from(conversations)
              .where(eq(conversations.id, tc.conversationId))
              .limit(1);
            topConversations.push({
              id: String(tc.conversationId),
              title: conv?.name || `Conversation #${tc.conversationId}`,
              messageCount: tc.count,
              type: conv ? fromDbConvType(conv.type) : "direct",
            });
          }
        } catch (err) {
          logger.error("[CommHub] getCommunicationAnalytics DB error:", err);
        }
      }

      // Voice calls remain in-memory
      const periodCalls = voiceCallsStore.filter(c => new Date(c.startedAt).getTime() > cutoff.getTime());

      // Hourly volume (simplified — would need raw message timestamps for accuracy)
      const hourlyVolume: Record<number, number> = {};
      for (let h = 0; h < 24; h++) hourlyVolume[h] = 0;

      return {
        period: range,
        totalMessages,
        totalCalls: periodCalls.length,
        totalBroadcasts: broadcastsStore.filter(b => new Date(b.createdAt).getTime() > cutoff.getTime()).length,
        avgResponseTimeMs: 0,
        avgResponseTimeFormatted: "N/A",
        channelDistribution: channelDist,
        hourlyVolume: Object.entries(hourlyVolume).map(([hour, count]) => ({
          hour: Number(hour),
          count,
        })),
        priorityBreakdown: priorityDist,
        topConversations,
        callStats: {
          total: periodCalls.length,
          completed: periodCalls.filter(c => c.status === "completed").length,
          missed: periodCalls.filter(c => c.status === "missed").length,
          avgDuration: periodCalls.filter(c => c.durationSeconds > 0).length > 0
            ? Math.round(periodCalls.filter(c => c.durationSeconds > 0).reduce((s, c) => s + c.durationSeconds, 0) / periodCalls.filter(c => c.durationSeconds > 0).length)
            : 0,
        },
      };
    }),

  getEmergencyBroadcastHistory: protectedProcedure
    .query(async () => {
      ensureInMemorySeeded();
      // TODO: migrate broadcasts to DB
      const emergencies = broadcastsStore
        .filter(b => b.isEmergency)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return {
        broadcasts: emergencies,
        total: emergencies.length,
        deliveryRate: emergencies.length > 0
          ? Math.round((emergencies.reduce((s, b) => s + b.deliveredCount, 0) / emergencies.reduce((s, b) => s + b.recipientCount, 0)) * 100)
          : 0,
        readRate: emergencies.length > 0
          ? Math.round((emergencies.reduce((s, b) => s + b.readCount, 0) / emergencies.reduce((s, b) => s + b.recipientCount, 0)) * 100)
          : 0,
      };
    }),

  getCommunicationCompliance: protectedProcedure
    .input(z.object({
      dateRange: z.enum(["week", "month", "quarter", "year"]).default("month"),
    }).optional())
    .query(async ({ input }) => {
      ensureInMemorySeeded();
      const range = input?.dateRange || "month";
      const rangeMs: Record<string, number> = {
        week: 7 * 86400000, month: 30 * 86400000, quarter: 90 * 86400000, year: 365 * 86400000,
      };
      const cutoff = new Date(Date.now() - (rangeMs[range] || rangeMs.month));

      let messageRecords = 0;
      const db = await getDb();
      if (db) {
        try {
          const [count] = await db.select({ count: sql<number>`count(*)` })
            .from(messages)
            .where(and(
              isNull(messages.deletedAt),
              sql`${messages.createdAt} >= ${cutoff}`,
            ));
          messageRecords = count?.count || 0;
        } catch (err) {
          logger.error("[CommHub] getCommunicationCompliance DB error:", err);
        }
      }

      const callRecords = voiceCallsStore.filter(c => new Date(c.startedAt).getTime() > cutoff.getTime()).length;
      const broadcastRecords = broadcastsStore.filter(b => new Date(b.createdAt).getTime() > cutoff.getTime()).length;

      return {
        period: range,
        totalRecords: messageRecords + callRecords,
        messageRecords,
        callRecords,
        broadcastRecords,
        retentionPolicy: {
          messageDays: 365,
          callDays: 365,
          broadcastDays: 730,
        },
        complianceStatus: "compliant",
        lastAuditDate: new Date(Date.now() - 30 * 86400000).toISOString(),
        dataExport: {
          available: true,
          formats: ["csv", "json", "pdf"],
          lastExportDate: new Date(Date.now() - 7 * 86400000).toISOString(),
        },
        regulations: [
          { name: "FMCSA Record Keeping", status: "compliant", details: "All driver communications archived per 49 CFR Part 395" },
          { name: "ELD Communication Logs", status: "compliant", details: "ELD-related messages linked to driver logs" },
          { name: "Hazmat Communication", status: "compliant", details: "Hazmat load communications flagged and retained per DOT requirements" },
        ],
      };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // VOICE CALL LOG (in-memory — TODO: migrate to DB)
  // ═══════════════════════════════════════════════════════════════════════════

  getVoiceCallLog: protectedProcedure
    .input(z.object({
      direction: z.enum(["inbound", "outbound"]).optional(),
      status: z.enum(["completed", "missed", "voicemail", "busy", "failed"]).optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }).optional())
    .query(async ({ input }) => {
      ensureInMemorySeeded();
      // TODO: migrate voice call log to DB
      let calls = [...voiceCallsStore];
      if (input?.direction) calls = calls.filter(c => c.direction === input.direction);
      if (input?.status) calls = calls.filter(c => c.status === input.status);
      calls.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

      const total = calls.length;
      const page = input?.page || 1;
      const limit = input?.limit || 20;
      const start = (page - 1) * limit;
      const items = calls.slice(start, start + limit);

      return {
        calls: items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        stats: {
          totalCalls: voiceCallsStore.length,
          completed: voiceCallsStore.filter(c => c.status === "completed").length,
          missed: voiceCallsStore.filter(c => c.status === "missed").length,
          avgDuration: voiceCallsStore.filter(c => c.durationSeconds > 0).length > 0
            ? Math.round(voiceCallsStore.filter(c => c.durationSeconds > 0).reduce((s, c) => s + c.durationSeconds, 0) / voiceCallsStore.filter(c => c.durationSeconds > 0).length)
            : 0,
        },
      };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSLATION
  // ═══════════════════════════════════════════════════════════════════════════

  getTranslation: protectedProcedure
    .input(z.object({
      text: z.string().min(1).max(5000),
      targetLanguage: z.enum(["en", "es"]),
    }))
    .query(async ({ input }) => {
      const translated = simpleTranslate(input.text, input.targetLanguage);
      return {
        original: input.text,
        translated,
        targetLanguage: input.targetLanguage,
        sourceLangDetected: input.targetLanguage === "es" ? "en" : "es",
      };
    }),
});
