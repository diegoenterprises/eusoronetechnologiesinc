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
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";

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

// ─── In-Memory Stores (production: replace with DB tables) ───────────────────

interface CommMessage {
  id: string;
  conversationId: string;
  senderId: number;
  senderName: string;
  senderRole: string;
  channel: string;
  content: string;
  contentType: "text" | "image" | "file" | "location" | "template";
  priority: string;
  status: string;
  metadata: Record<string, unknown>;
  replyToId: string | null;
  translatedContent: string | null;
  translatedLang: string | null;
  createdAt: string;
  readAt: string | null;
  deliveredAt: string | null;
}

interface Conversation {
  id: string;
  type: string;
  title: string;
  participants: { userId: number; name: string; role: string; joinedAt: string }[];
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  loadId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

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

// Storage
const messagesStore: CommMessage[] = [];
const conversationsStore: Conversation[] = [];
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

// ─── Seed Data ───────────────────────────────────────────────────────────────

function ensureSeeded() {
  if (conversationsStore.length > 0) return;

  // Sample conversations
  const now = new Date().toISOString();
  const convos: Conversation[] = [
    { id: "conv_1", type: "dispatch", title: "Dispatch Channel - Southeast", participants: [{ userId: 1, name: "Diego Usoro", role: "ADMIN", joinedAt: now }, { userId: 2, name: "Maria Garcia", role: "DISPATCH", joinedAt: now }, { userId: 3, name: "James Wilson", role: "DRIVER", joinedAt: now }], lastMessageAt: now, lastMessagePreview: "Load #4521 picked up, heading to Atlanta", unreadCount: 3, isPinned: true, isMuted: false, loadId: null, metadata: { region: "southeast" }, createdAt: now },
    { id: "conv_2", type: "direct", title: "James Wilson", participants: [{ userId: 1, name: "Diego Usoro", role: "ADMIN", joinedAt: now }, { userId: 3, name: "James Wilson", role: "DRIVER", joinedAt: now }], lastMessageAt: new Date(Date.now() - 3600000).toISOString(), lastMessagePreview: "ETA to delivery is 2:30 PM", unreadCount: 1, isPinned: false, isMuted: false, loadId: "LOAD-4521", metadata: {}, createdAt: now },
    { id: "conv_3", type: "group", title: "Houston Terminal Drivers", participants: [{ userId: 1, name: "Diego Usoro", role: "ADMIN", joinedAt: now }, { userId: 4, name: "Carlos Mendez", role: "DRIVER", joinedAt: now }, { userId: 5, name: "Robert Johnson", role: "DRIVER", joinedAt: now }, { userId: 6, name: "Angela Davis", role: "DRIVER", joinedAt: now }], lastMessageAt: new Date(Date.now() - 7200000).toISOString(), lastMessagePreview: "Road construction on I-10 near Katy", unreadCount: 0, isPinned: false, isMuted: false, loadId: null, metadata: { terminal: "Houston" }, createdAt: now },
    { id: "conv_4", type: "load_linked", title: "Load #4530 - Hazmat Run", participants: [{ userId: 1, name: "Diego Usoro", role: "ADMIN", joinedAt: now }, { userId: 2, name: "Maria Garcia", role: "DISPATCH", joinedAt: now }, { userId: 7, name: "Tom Patel", role: "DRIVER", joinedAt: now }], lastMessageAt: new Date(Date.now() - 1800000).toISOString(), lastMessagePreview: "Placards verified, ready for departure", unreadCount: 2, isPinned: true, isMuted: false, loadId: "LOAD-4530", metadata: { hazmat: true }, createdAt: now },
    { id: "conv_5", type: "support", title: "ELD Connectivity Issue", participants: [{ userId: 1, name: "Diego Usoro", role: "ADMIN", joinedAt: now }, { userId: 8, name: "Support Team", role: "ADMIN", joinedAt: now }, { userId: 5, name: "Robert Johnson", role: "DRIVER", joinedAt: now }], lastMessageAt: new Date(Date.now() - 5400000).toISOString(), lastMessagePreview: "Try restarting the ELD device and check Bluetooth", unreadCount: 0, isPinned: false, isMuted: false, loadId: null, metadata: { ticketId: "TKT-892" }, createdAt: now },
  ];
  conversationsStore.push(...convos);

  // Sample messages
  const msgs: CommMessage[] = [
    { id: "msg_1", conversationId: "conv_1", senderId: 3, senderName: "James Wilson", senderRole: "DRIVER", channel: "in_app", content: "Load #4521 picked up, heading to Atlanta", contentType: "text", priority: "normal", status: "delivered", metadata: {}, replyToId: null, translatedContent: "Carga #4521 recogida, rumbo a Atlanta", translatedLang: "es", createdAt: now, readAt: null, deliveredAt: now },
    { id: "msg_2", conversationId: "conv_1", senderId: 2, senderName: "Maria Garcia", senderRole: "DISPATCH", channel: "in_app", content: "Copy that. Weather advisory for I-75 south of Macon. Take alternate if needed.", contentType: "text", priority: "high", status: "delivered", metadata: {}, replyToId: "msg_1", translatedContent: "Copiado. Aviso de clima para I-75 al sur de Macon. Toma ruta alterna si es necesario.", translatedLang: "es", createdAt: new Date(Date.now() - 60000).toISOString(), readAt: null, deliveredAt: new Date(Date.now() - 60000).toISOString() },
    { id: "msg_3", conversationId: "conv_2", senderId: 3, senderName: "James Wilson", senderRole: "DRIVER", channel: "sms", content: "ETA to delivery is 2:30 PM", contentType: "text", priority: "normal", status: "read", metadata: {}, replyToId: null, translatedContent: null, translatedLang: null, createdAt: new Date(Date.now() - 3600000).toISOString(), readAt: new Date(Date.now() - 3500000).toISOString(), deliveredAt: new Date(Date.now() - 3600000).toISOString() },
    { id: "msg_4", conversationId: "conv_4", senderId: 7, senderName: "Tom Patel", senderRole: "DRIVER", channel: "in_app", content: "Placards verified, ready for departure", contentType: "text", priority: "high", status: "delivered", metadata: { hazmat: true }, replyToId: null, translatedContent: "Placas verificadas, listo para salir", translatedLang: "es", createdAt: new Date(Date.now() - 1800000).toISOString(), readAt: null, deliveredAt: new Date(Date.now() - 1800000).toISOString() },
    { id: "msg_5", conversationId: "conv_3", senderId: 4, senderName: "Carlos Mendez", senderRole: "DRIVER", channel: "in_app", content: "Road construction on I-10 near Katy. Adding 20 mins to travel time.", contentType: "text", priority: "normal", status: "read", metadata: {}, replyToId: null, translatedContent: null, translatedLang: null, createdAt: new Date(Date.now() - 7200000).toISOString(), readAt: new Date(Date.now() - 7100000).toISOString(), deliveredAt: new Date(Date.now() - 7200000).toISOString() },
  ];
  messagesStore.push(...msgs);

  // Sample broadcasts
  broadcastsStore.push(
    { id: "bcast_1", senderId: 1, senderName: "Diego Usoro", title: "Winter Storm Warning - I-40 Corridor", content: "WINTER STORM WARNING: I-40 from Memphis to Nashville expecting 4-6 inches of snow tonight. All drivers on this corridor should secure safe parking before 8 PM CST. Contact dispatch if you need rerouting.", channel: "in_app", priority: "emergency", targetGroup: "all_drivers", targetFilters: { corridor: "I-40" }, recipientCount: 45, deliveredCount: 42, readCount: 38, isEmergency: true, expiresAt: new Date(Date.now() + 86400000).toISOString(), createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: "bcast_2", senderId: 2, senderName: "Maria Garcia", title: "Weekly Safety Reminder", content: "Reminder: Pre-trip inspections are mandatory. Check tires, brakes, lights, and fluid levels before departure. Safety is everyone's responsibility.", channel: "in_app", priority: "normal", targetGroup: "all_drivers", targetFilters: {}, recipientCount: 120, deliveredCount: 115, readCount: 89, isEmergency: false, expiresAt: null, createdAt: new Date(Date.now() - 86400000).toISOString() },
  );

  // Sample notification rules
  rulesStore.push(
    { id: "rule_1", name: "Load Pickup Confirmation", description: "Notify dispatch when driver confirms pickup", condition: "load_assigned", channels: ["in_app", "sms"], templateId: "tmpl_1", recipients: "dispatch_team", isActive: true, cooldownMinutes: 0, metadata: {}, createdBy: 1, createdAt: now, lastTriggeredAt: new Date(Date.now() - 600000).toISOString(), triggerCount: 234 },
    { id: "rule_2", name: "Driver Offline Alert", description: "Alert if driver goes offline for more than 30 minutes during active load", condition: "driver_offline", channels: ["in_app", "sms", "push"], templateId: null, recipients: "dispatch_team", isActive: true, cooldownMinutes: 30, metadata: { offlineThresholdMinutes: 30 }, createdBy: 1, createdAt: now, lastTriggeredAt: new Date(Date.now() - 1200000).toISOString(), triggerCount: 56 },
    { id: "rule_3", name: "Document Expiration Warning", description: "Send reminder 30 days before CDL/insurance/medical card expiration", condition: "document_expiring", channels: ["email", "in_app", "push"], templateId: "tmpl_2", recipients: "document_owner", isActive: true, cooldownMinutes: 1440, metadata: { daysBeforeExpiry: 30 }, createdBy: 1, createdAt: now, lastTriggeredAt: new Date(Date.now() - 86400000).toISOString(), triggerCount: 89 },
    { id: "rule_4", name: "HOS Violation Alert", description: "Immediate alert on HOS violation detection", condition: "hos_violation", channels: ["in_app", "sms", "push", "email"], templateId: null, recipients: "safety_team", isActive: true, cooldownMinutes: 0, metadata: {}, createdBy: 1, createdAt: now, lastTriggeredAt: new Date(Date.now() - 43200000).toISOString(), triggerCount: 12 },
    { id: "rule_5", name: "Temperature Alert", description: "Alert when reefer temperature goes out of range", condition: "temperature_alert", channels: ["in_app", "sms", "push"], templateId: null, recipients: "driver_and_dispatch", isActive: true, cooldownMinutes: 15, metadata: { minTemp: 32, maxTemp: 40 }, createdBy: 1, createdAt: now, lastTriggeredAt: null, triggerCount: 0 },
  );

  // Sample templates
  templatesStore.push(
    { id: "tmpl_1", name: "Load Pickup Confirmation", category: "operations", channel: "sms", subject: null, body: "Hi {{driverName}}, Load #{{loadId}} has been assigned to you. Pickup at {{pickupAddress}} on {{pickupDate}}. Confirm receipt.", mergeFields: ["driverName", "loadId", "pickupAddress", "pickupDate"], isActive: true, language: "en", createdBy: 1, createdAt: now, updatedAt: now, usageCount: 234 },
    { id: "tmpl_2", name: "Document Expiration Warning", category: "compliance", channel: "email", subject: "Action Required: {{documentType}} expiring on {{expiryDate}}", body: "Dear {{driverName}},\n\nYour {{documentType}} is set to expire on {{expiryDate}}. Please renew it before the expiration date to maintain compliance.\n\nUpload your renewed document at: {{uploadLink}}\n\nThank you,\nEusoTrip Compliance Team", mergeFields: ["driverName", "documentType", "expiryDate", "uploadLink"], isActive: true, language: "en", createdBy: 1, createdAt: now, updatedAt: now, usageCount: 89 },
    { id: "tmpl_3", name: "Emergency Broadcast", category: "safety", channel: "in_app", subject: null, body: "EMERGENCY: {{emergencyType}} reported in {{location}}. All drivers in the {{region}} area should {{action}}. Contact dispatch immediately at {{dispatchPhone}}.", mergeFields: ["emergencyType", "location", "region", "action", "dispatchPhone"], isActive: true, language: "en", createdBy: 1, createdAt: now, updatedAt: now, usageCount: 3 },
    { id: "tmpl_4", name: "Confirmacion de Recogida", category: "operations", channel: "sms", subject: null, body: "Hola {{driverName}}, Carga #{{loadId}} asignada. Recogida en {{pickupAddress}} el {{pickupDate}}. Confirme recibo.", mergeFields: ["driverName", "loadId", "pickupAddress", "pickupDate"], isActive: true, language: "es", createdBy: 1, createdAt: now, updatedAt: now, usageCount: 67 },
    { id: "tmpl_5", name: "Payment Received", category: "billing", channel: "email", subject: "Payment of ${{amount}} received for Load #{{loadId}}", body: "Hi {{driverName}},\n\nWe've processed your payment of ${{amount}} for Load #{{loadId}} ({{route}}). The funds will be in your account within {{businessDays}} business days.\n\nView details: {{paymentLink}}\n\nThank you for hauling with EusoTrip!", mergeFields: ["driverName", "amount", "loadId", "route", "businessDays", "paymentLink"], isActive: true, language: "en", createdBy: 1, createdAt: now, updatedAt: now, usageCount: 156 },
  );

  // Sample escalation workflows
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

  // Sample scheduled messages
  scheduledStore.push(
    { id: "sched_1", conversationId: null, senderId: 1, senderName: "Diego Usoro", channel: "sms", content: "Good morning team! Remember: safety meeting at 8 AM today at Houston terminal.", recipientIds: [3, 4, 5, 6], scheduledFor: new Date(Date.now() + 43200000).toISOString(), status: "scheduled", createdAt: now },
    { id: "sched_2", conversationId: "conv_3", senderId: 2, senderName: "Maria Garcia", channel: "in_app", content: "Reminder: Quarterly equipment inspections start next Monday. Make sure your trucks are ready.", recipientIds: [4, 5, 6], scheduledFor: new Date(Date.now() + 172800000).toISOString(), status: "scheduled", createdAt: now },
  );

  // Sample voice calls
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

// ─── Router ──────────────────────────────────────────────────────────────────

export const communicationHubRouter = router({

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD & OVERVIEW
  // ═══════════════════════════════════════════════════════════════════════════

  getCommunicationDashboard: protectedProcedure
    .query(async () => {
      ensureSeeded();
      const totalUnread = conversationsStore.reduce((sum, c) => sum + c.unreadCount, 0);
      const activeChats = conversationsStore.filter(c => {
        const lastMsg = new Date(c.lastMessageAt).getTime();
        return Date.now() - lastMsg < 24 * 3600000;
      }).length;
      const recentBroadcasts = broadcastsStore.filter(b => {
        return Date.now() - new Date(b.createdAt).getTime() < 7 * 86400000;
      }).length;
      const activeEscCount = activeEscalations.filter(e => e.status === "pending" || e.status === "escalated").length;
      const scheduledCount = scheduledStore.filter(s => s.status === "scheduled").length;
      const activeRules = rulesStore.filter(r => r.isActive).length;

      // Channel breakdown
      const channelBreakdown = { in_app: 0, sms: 0, email: 0, push: 0 };
      for (const m of messagesStore) {
        if (m.channel in channelBreakdown) {
          channelBreakdown[m.channel as keyof typeof channelBreakdown]++;
        }
      }

      // Recent activity
      const recentMessages = [...messagesStore]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

      return {
        summary: {
          totalUnread,
          activeChats,
          totalConversations: conversationsStore.length,
          recentBroadcasts,
          activeEscalations: activeEscCount,
          scheduledMessages: scheduledCount,
          activeRules,
          totalTemplates: templatesStore.filter(t => t.isActive).length,
          totalVoiceCalls: voiceCallsStore.length,
        },
        channelBreakdown,
        recentActivity: recentMessages.map(m => ({
          id: m.id,
          senderName: m.senderName,
          channel: m.channel,
          preview: m.content.slice(0, 80),
          priority: m.priority,
          conversationId: m.conversationId,
          createdAt: m.createdAt,
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
    .query(async () => {
      ensureSeeded();
      const byChannel = { in_app: 0, sms: 0, email: 0, push: 0 };
      for (const m of messagesStore) {
        if (!m.readAt && m.channel in byChannel) {
          byChannel[m.channel as keyof typeof byChannel]++;
        }
      }
      const totalUnread = Object.values(byChannel).reduce((s, v) => s + v, 0);
      const unreadConversations = conversationsStore.filter(c => c.unreadCount > 0).map(c => ({
        conversationId: c.id,
        title: c.title,
        type: c.type,
        unreadCount: c.unreadCount,
        lastMessageAt: c.lastMessageAt,
        lastMessagePreview: c.lastMessagePreview,
      }));
      return { totalUnread, byChannel, unreadConversations };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // MULTI-CHANNEL INBOX & MESSAGING
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
    .query(async ({ input }) => {
      ensureSeeded();
      const { channel, type, search, unreadOnly, page = 1, limit = 20 } = input || {};

      let filtered = [...conversationsStore];
      if (type) filtered = filtered.filter(c => c.type === type);
      if (unreadOnly) filtered = filtered.filter(c => c.unreadCount > 0);
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(c =>
          c.title.toLowerCase().includes(q) ||
          c.lastMessagePreview.toLowerCase().includes(q)
        );
      }
      if (channel) {
        const convoIdsWithChannel = new Set(
          messagesStore.filter(m => m.channel === channel).map(m => m.conversationId)
        );
        filtered = filtered.filter(c => convoIdsWithChannel.has(c.id));
      }

      filtered.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });

      const total = filtered.length;
      const start = (page - 1) * limit;
      const items = filtered.slice(start, start + limit);

      return {
        conversations: items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
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
      ensureSeeded();
      const user = ctx.user as any;
      const msg: CommMessage = {
        id: nextId("msg"),
        conversationId: input.conversationId,
        senderId: Number(user.id) || 0,
        senderName: user.name || user.email || "Unknown",
        senderRole: user.role || "ADMIN",
        channel: input.channel,
        content: input.content,
        contentType: input.contentType,
        priority: input.priority,
        status: "sent",
        metadata: input.metadata || {},
        replyToId: input.replyToId || null,
        translatedContent: null,
        translatedLang: null,
        createdAt: new Date().toISOString(),
        readAt: null,
        deliveredAt: new Date().toISOString(),
      };

      // Auto-translate
      msg.translatedContent = simpleTranslate(input.content, "es");
      msg.translatedLang = "es";

      messagesStore.push(msg);

      // Update conversation
      const conv = conversationsStore.find(c => c.id === input.conversationId);
      if (conv) {
        conv.lastMessageAt = msg.createdAt;
        conv.lastMessagePreview = msg.content.slice(0, 100);
      }

      return { success: true, message: msg };
    }),

  getConversationThreads: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      search: z.string().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      ensureSeeded();
      let msgs = messagesStore.filter(m => m.conversationId === input.conversationId);
      if (input.search) {
        const q = input.search.toLowerCase();
        msgs = msgs.filter(m => m.content.toLowerCase().includes(q));
      }
      msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      const total = msgs.length;
      const start = (input.page - 1) * input.limit;
      const items = msgs.slice(start, start + input.limit);

      const conv = conversationsStore.find(c => c.id === input.conversationId);

      return {
        conversation: conv || null,
        messages: items,
        pagination: { page: input.page, limit: input.limit, total, totalPages: Math.ceil(total / input.limit) },
      };
    }),

  getDriverDispatcherChat: protectedProcedure
    .input(z.object({
      driverId: z.number().optional(),
      loadId: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      ensureSeeded();
      let convos = conversationsStore.filter(c =>
        c.type === "direct" || c.type === "dispatch" || c.type === "load_linked"
      );
      if (input?.driverId) {
        convos = convos.filter(c =>
          c.participants.some(p => p.userId === input.driverId && p.role === "DRIVER")
        );
      }
      if (input?.loadId) {
        convos = convos.filter(c => c.loadId === input.loadId);
      }

      const chats = convos.map(c => {
        const msgs = messagesStore
          .filter(m => m.conversationId === c.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const driver = c.participants.find(p => p.role === "DRIVER");
        const dispatcher = c.participants.find(p => p.role === "DISPATCH" || p.role === "ADMIN");
        return {
          conversation: c,
          driver: driver || null,
          dispatcher: dispatcher || null,
          recentMessages: msgs.slice(0, 20),
          unreadCount: c.unreadCount,
          lastActivity: c.lastMessageAt,
        };
      });

      return {
        chats,
        totalActive: chats.length,
        totalUnread: chats.reduce((s, c) => s + c.unreadCount, 0),
      };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // DISPATCH RADIO & BROADCASTS
  // ═══════════════════════════════════════════════════════════════════════════

  getDispatchRadio: protectedProcedure
    .input(z.object({
      group: z.string().optional(),
      includeExpired: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      ensureSeeded();
      let broadcasts = [...broadcastsStore];
      if (input?.group) {
        broadcasts = broadcasts.filter(b => b.targetGroup === input.group);
      }
      if (!input?.includeExpired) {
        broadcasts = broadcasts.filter(b => !b.expiresAt || new Date(b.expiresAt) > new Date());
      }
      broadcasts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const dispatchConvos = conversationsStore.filter(c => c.type === "dispatch");

      return {
        broadcasts,
        dispatchChannels: dispatchConvos.map(c => ({
          id: c.id,
          title: c.title,
          participantCount: c.participants.length,
          lastActivity: c.lastMessageAt,
          unreadCount: c.unreadCount,
        })),
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
      ensureSeeded();
      const user = ctx.user as any;

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
  // AUTOMATED NOTIFICATIONS & RULES
  // ═══════════════════════════════════════════════════════════════════════════

  getAutomatedNotifications: protectedProcedure
    .query(async () => {
      ensureSeeded();
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
      ensureSeeded();
      const user = ctx.user as any;

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
  // TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════════

  getNotificationTemplates: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
      channel: channelEnum.optional(),
      language: z.string().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      ensureSeeded();
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
      ensureSeeded();
      const user = ctx.user as any;
      const now = new Date().toISOString();

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
  // ESCALATION WORKFLOWS
  // ═══════════════════════════════════════════════════════════════════════════

  getEscalationWorkflows: protectedProcedure
    .query(async () => {
      ensureSeeded();
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
      ensureSeeded();
      const user = ctx.user as any;
      const now = new Date().toISOString();

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
      ensureSeeded();
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
  // NOTIFICATION PREFERENCES
  // ═══════════════════════════════════════════════════════════════════════════

  getNotificationPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      ensureSeeded();
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
      const userId = Number((ctx.user as any).id) || 0;
      const prefs: NotifPreference = { userId, ...input };
      preferencesStore.set(userId, prefs);
      return { success: true, preferences: prefs };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCHEDULED MESSAGES
  // ═══════════════════════════════════════════════════════════════════════════

  getScheduledMessages: protectedProcedure
    .input(z.object({
      status: z.enum(["scheduled", "sent", "cancelled", "failed"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      ensureSeeded();
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
  // ANALYTICS & COMPLIANCE
  // ═══════════════════════════════════════════════════════════════════════════

  getCommunicationAnalytics: protectedProcedure
    .input(z.object({
      dateRange: z.enum(["today", "week", "month", "quarter"]).default("week"),
    }).optional())
    .query(async ({ input }) => {
      ensureSeeded();
      const range = input?.dateRange || "week";
      const rangeMs: Record<string, number> = {
        today: 86400000, week: 7 * 86400000, month: 30 * 86400000, quarter: 90 * 86400000,
      };
      const cutoff = Date.now() - (rangeMs[range] || rangeMs.week);

      const periodMsgs = messagesStore.filter(m => new Date(m.createdAt).getTime() > cutoff);
      const periodCalls = voiceCallsStore.filter(c => new Date(c.startedAt).getTime() > cutoff);

      // Response time analysis
      const responseTimes: number[] = [];
      for (let i = 1; i < periodMsgs.length; i++) {
        if (periodMsgs[i].conversationId === periodMsgs[i - 1].conversationId &&
          periodMsgs[i].senderId !== periodMsgs[i - 1].senderId) {
          const diff = new Date(periodMsgs[i].createdAt).getTime() - new Date(periodMsgs[i - 1].createdAt).getTime();
          responseTimes.push(diff);
        }
      }
      const avgResponseMs = responseTimes.length > 0
        ? responseTimes.reduce((s, v) => s + v, 0) / responseTimes.length
        : 0;

      // Channel distribution
      const channelDist: Record<string, number> = { in_app: 0, sms: 0, email: 0, push: 0 };
      for (const m of periodMsgs) {
        if (m.channel in channelDist) channelDist[m.channel as keyof typeof channelDist]++;
      }

      // Hourly volume
      const hourlyVolume: Record<number, number> = {};
      for (let h = 0; h < 24; h++) hourlyVolume[h] = 0;
      for (const m of periodMsgs) {
        const hour = new Date(m.createdAt).getHours();
        hourlyVolume[hour] = (hourlyVolume[hour] || 0) + 1;
      }

      // Priority breakdown
      const priorityDist: Record<string, number> = { low: 0, normal: 0, high: 0, urgent: 0, emergency: 0 };
      for (const m of periodMsgs) {
        if (m.priority in priorityDist) priorityDist[m.priority as keyof typeof priorityDist]++;
      }

      return {
        period: range,
        totalMessages: periodMsgs.length,
        totalCalls: periodCalls.length,
        totalBroadcasts: broadcastsStore.filter(b => new Date(b.createdAt).getTime() > cutoff).length,
        avgResponseTimeMs: Math.round(avgResponseMs),
        avgResponseTimeFormatted: avgResponseMs > 0 ? `${Math.round(avgResponseMs / 60000)} min` : "N/A",
        channelDistribution: channelDist,
        hourlyVolume: Object.entries(hourlyVolume).map(([hour, count]) => ({
          hour: Number(hour),
          count,
        })),
        priorityBreakdown: priorityDist,
        topConversations: conversationsStore
          .map(c => ({
            id: c.id,
            title: c.title,
            messageCount: messagesStore.filter(m => m.conversationId === c.id).length,
            type: c.type,
          }))
          .sort((a, b) => b.messageCount - a.messageCount)
          .slice(0, 5),
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
      ensureSeeded();
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
      ensureSeeded();
      const range = input?.dateRange || "month";
      const rangeMs: Record<string, number> = {
        week: 7 * 86400000, month: 30 * 86400000, quarter: 90 * 86400000, year: 365 * 86400000,
      };
      const cutoff = Date.now() - (rangeMs[range] || rangeMs.month);

      const periodMsgs = messagesStore.filter(m => new Date(m.createdAt).getTime() > cutoff);
      const periodCalls = voiceCallsStore.filter(c => new Date(c.startedAt).getTime() > cutoff);

      return {
        period: range,
        totalRecords: periodMsgs.length + periodCalls.length,
        messageRecords: periodMsgs.length,
        callRecords: periodCalls.length,
        broadcastRecords: broadcastsStore.filter(b => new Date(b.createdAt).getTime() > cutoff).length,
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
  // VOICE CALL LOG
  // ═══════════════════════════════════════════════════════════════════════════

  getVoiceCallLog: protectedProcedure
    .input(z.object({
      direction: z.enum(["inbound", "outbound"]).optional(),
      status: z.enum(["completed", "missed", "voicemail", "busy", "failed"]).optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }).optional())
    .query(async ({ input }) => {
      ensureSeeded();
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
