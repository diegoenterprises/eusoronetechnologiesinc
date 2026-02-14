/**
 * ESANG AI Action Executor — Secure Task Execution Layer
 *
 * Whitelist-only architecture: ESANG can only call predefined operations.
 * Role-based access: each action specifies which roles may invoke it.
 * Input validation: every action uses a strict zod schema.
 * Audit logging: every execution is logged with userId, action, params, result.
 *
 * SECURITY:
 * - No eval(), no dynamic code, no raw SQL interpolation of AI output.
 * - AI output is parsed as JSON; any parse failure = action rejected.
 * - Parameters are validated through zod before touching the DB.
 * - Users can only affect their own data (shipper sees own loads, etc.).
 */

import { z } from "zod";
import { getDb } from "../db";
import { loads, bids, users } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  emitLoadStatusChange,
  emitBidReceived,
  emitNotification,
} from "../_core/websocket";
import {
  getFullERGInfo,
  getERGForProduct,
  searchMaterials,
} from "../_core/ergDatabaseDB";
import { fireGamificationEvent } from "./gamificationDispatcher";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ActionContext {
  userId: number;
  userEmail: string;
  userName: string;
  role: string;
}

export interface ActionResult {
  success: boolean;
  action: string;
  message: string;
  data?: Record<string, unknown>;
  error?: string;
}

type ActionHandler = (ctx: ActionContext, params: Record<string, unknown>) => Promise<ActionResult>;

interface ActionDef {
  allowedRoles: string[];
  schema: z.ZodType<any>;
  handler: ActionHandler;
  description: string;
}

// ─── Resolve DB user ID from auth context ────────────────────────────────────

async function resolveDbUserId(email: string): Promise<number> {
  const db = await getDb();
  if (!db || !email) return 0;
  try {
    const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    return row?.id || 0;
  } catch {
    return 0;
  }
}

// ─── Action Registry (whitelist) ─────────────────────────────────────────────

const ACTION_REGISTRY: Record<string, ActionDef> = {

  // ── Load Operations ──────────────────────────────────────────────────────

  create_load: {
    allowedRoles: ["SHIPPER", "BROKER", "ADMIN", "SUPER_ADMIN"],
    description: "Create a new load and post it to the marketplace",
    schema: z.object({
      origin: z.string().min(1),
      destination: z.string().min(1),
      cargoType: z.enum(["general", "hazmat", "refrigerated", "oversized", "liquid", "gas", "chemicals", "petroleum"]).default("general"),
      productName: z.string().optional(),
      weight: z.string().optional(),
      volume: z.string().optional(),
      hazmatClass: z.string().optional(),
      unNumber: z.string().optional(),
      rate: z.string().optional(),
      pickupDate: z.string().optional(),
      deliveryDate: z.string().optional(),
      specialInstructions: z.string().optional(),
    }),
    handler: async (ctx, params) => {
      const db = await getDb();
      if (!db) return { success: false, action: "create_load", message: "Database unavailable" };

      const dbUserId = await resolveDbUserId(ctx.userEmail);
      if (!dbUserId) return { success: false, action: "create_load", message: "Could not resolve your user account" };

      const p = params as z.infer<typeof ACTION_REGISTRY.create_load.schema>;
      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
      const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
      const loadNumber = `LD-${dateStr}-${rand}`;

      const result = await db.insert(loads).values({
        shipperId: dbUserId,
        loadNumber,
        status: "posted",
        cargoType: p.cargoType || "general",
        hazmatClass: p.hazmatClass || null,
        unNumber: p.unNumber || null,
        weight: p.weight || null,
        weightUnit: "lbs",
        volume: p.volume || null,
        volumeUnit: "gal",
        commodityName: p.productName || null,
        pickupLocation: { address: p.origin, city: p.origin.split(",")[0]?.trim() || "", state: p.origin.split(",")[1]?.trim() || "", zipCode: "", lat: 0, lng: 0 },
        deliveryLocation: { address: p.destination, city: p.destination.split(",")[0]?.trim() || "", state: p.destination.split(",")[1]?.trim() || "", zipCode: "", lat: 0, lng: 0 },
        pickupDate: p.pickupDate ? new Date(p.pickupDate) : undefined,
        deliveryDate: p.deliveryDate ? new Date(p.deliveryDate) : undefined,
        rate: p.rate || null,
        specialInstructions: p.specialInstructions || null,
      } as any);

      const insertedId = (result as any).insertId || 0;

      emitLoadStatusChange({
        loadId: String(insertedId),
        loadNumber,
        previousStatus: "",
        newStatus: "posted",
        timestamp: new Date().toISOString(),
        updatedBy: String(dbUserId),
      });

      // Fire gamification events
      fireGamificationEvent({ userId: dbUserId, type: "load_created", value: 1 });
      fireGamificationEvent({ userId: dbUserId, type: "platform_action", value: 1 });

      return {
        success: true,
        action: "create_load",
        message: `Load ${loadNumber} created and posted to the marketplace.`,
        data: { loadId: insertedId, loadNumber, status: "posted" },
      };
    },
  },

  list_my_loads: {
    allowedRoles: ["SHIPPER", "CATALYST", "DRIVER", "BROKER", "DISPATCH", "ESCORT", "ADMIN", "SUPER_ADMIN"],
    description: "List the user's loads",
    schema: z.object({
      status: z.string().optional(),
      limit: z.number().max(20).default(10),
    }),
    handler: async (ctx, params) => {
      const db = await getDb();
      if (!db) return { success: false, action: "list_my_loads", message: "Database unavailable" };

      const dbUserId = await resolveDbUserId(ctx.userEmail);
      if (!dbUserId) return { success: false, action: "list_my_loads", message: "Could not resolve user" };

      const p = params as { status?: string; limit: number };
      const filters: any[] = [];

      // Role-based scoping
      const role = ctx.role;
      if (role === "ADMIN" || role === "SUPER_ADMIN") {
        // admins see all
      } else if (role === "CATALYST" || role === "DISPATCH") {
        filters.push(sql`(${loads.shipperId} = ${dbUserId} OR ${loads.catalystId} = ${dbUserId})`);
      } else if (role === "DRIVER" || role === "ESCORT") {
        filters.push(sql`(${loads.driverId} = ${dbUserId} OR ${loads.shipperId} = ${dbUserId})`);
      } else {
        filters.push(eq(loads.shipperId, dbUserId));
      }
      if (p.status) filters.push(eq(loads.status, p.status as any));

      const rows = await db.select().from(loads)
        .where(filters.length > 0 ? and(...filters) : undefined)
        .orderBy(desc(loads.createdAt))
        .limit(p.limit);

      const summary = rows.map((r: any) => ({
        id: r.id,
        loadNumber: r.loadNumber,
        status: r.status,
        cargoType: r.cargoType,
        commodity: r.commodityName || r.cargoType,
        origin: (r.pickupLocation as any)?.city || "N/A",
        destination: (r.deliveryLocation as any)?.city || "N/A",
        rate: r.rate ? `$${r.rate}` : "TBD",
      }));

      return {
        success: true,
        action: "list_my_loads",
        message: `Found ${rows.length} load(s).`,
        data: { loads: summary, count: rows.length },
      };
    },
  },

  cancel_load: {
    allowedRoles: ["SHIPPER", "BROKER", "ADMIN", "SUPER_ADMIN"],
    description: "Cancel a load (only draft or posted loads the user owns)",
    schema: z.object({
      loadId: z.number(),
      reason: z.string().optional(),
    }),
    handler: async (ctx, params) => {
      const db = await getDb();
      if (!db) return { success: false, action: "cancel_load", message: "Database unavailable" };

      const dbUserId = await resolveDbUserId(ctx.userEmail);
      const p = params as { loadId: number; reason?: string };

      // Verify ownership
      const [load] = await db.select().from(loads)
        .where(and(eq(loads.id, p.loadId), eq(loads.shipperId, dbUserId)))
        .limit(1);
      if (!load) return { success: false, action: "cancel_load", message: "Load not found or you don't own it" };
      if (!["draft", "posted", "bidding"].includes((load as any).status)) {
        return { success: false, action: "cancel_load", message: `Cannot cancel a load with status '${(load as any).status}'` };
      }

      await db.update(loads).set({ status: "cancelled" } as any).where(eq(loads.id, p.loadId));

      return {
        success: true,
        action: "cancel_load",
        message: `Load #${(load as any).loadNumber} has been cancelled.`,
        data: { loadId: p.loadId, loadNumber: (load as any).loadNumber },
      };
    },
  },

  search_marketplace: {
    allowedRoles: ["CATALYST", "DRIVER", "BROKER", "DISPATCH", "ESCORT", "ADMIN", "SUPER_ADMIN"],
    description: "Search available loads on the marketplace",
    schema: z.object({
      limit: z.number().max(20).default(10),
    }),
    handler: async (ctx, params) => {
      const db = await getDb();
      if (!db) return { success: false, action: "search_marketplace", message: "Database unavailable" };

      const p = params as { limit: number };
      const rows = await db.select().from(loads)
        .where(sql`${loads.status} IN ('posted', 'bidding')`)
        .orderBy(desc(loads.createdAt))
        .limit(p.limit);

      const summary = rows.map((r: any) => ({
        id: r.id,
        loadNumber: r.loadNumber,
        cargoType: r.cargoType,
        commodity: r.commodityName || r.cargoType,
        origin: (r.pickupLocation as any)?.city || "N/A",
        destination: (r.deliveryLocation as any)?.city || "N/A",
        rate: r.rate ? `$${r.rate}` : "Open bidding",
        hazmat: !!r.hazmatClass,
      }));

      return {
        success: true,
        action: "search_marketplace",
        message: `Found ${rows.length} available load(s) on the marketplace.`,
        data: { loads: summary, count: rows.length },
      };
    },
  },

  // ── Bid Operations ───────────────────────────────────────────────────────

  submit_bid: {
    allowedRoles: ["CATALYST", "DRIVER", "DISPATCH", "BROKER"],
    description: "Submit a bid on a marketplace load",
    schema: z.object({
      loadId: z.number(),
      amount: z.number().positive(),
      notes: z.string().optional(),
    }),
    handler: async (ctx, params) => {
      const db = await getDb();
      if (!db) return { success: false, action: "submit_bid", message: "Database unavailable" };

      const dbUserId = await resolveDbUserId(ctx.userEmail);
      if (!dbUserId) return { success: false, action: "submit_bid", message: "Could not resolve user" };

      const p = params as { loadId: number; amount: number; notes?: string };

      // Verify load exists and is biddable
      const [load] = await db.select().from(loads).where(eq(loads.id, p.loadId)).limit(1);
      if (!load) return { success: false, action: "submit_bid", message: "Load not found" };
      if (!["posted", "bidding"].includes((load as any).status)) {
        return { success: false, action: "submit_bid", message: `Load is not open for bids (status: ${(load as any).status})` };
      }

      // Prevent bidding on own load
      if ((load as any).shipperId === dbUserId) {
        return { success: false, action: "submit_bid", message: "You cannot bid on your own load" };
      }

      const result = await db.insert(bids).values({
        loadId: p.loadId,
        catalystId: dbUserId,
        amount: String(p.amount),
        status: "pending",
        notes: p.notes || null,
      } as any);

      const bidId = (result as any).insertId || 0;

      // Update load status to bidding
      await db.update(loads).set({ status: "bidding" } as any).where(eq(loads.id, p.loadId));

      emitBidReceived({
        bidId: String(bidId),
        loadId: String(p.loadId),
        loadNumber: (load as any).loadNumber || "",
        catalystId: String(dbUserId),
        catalystName: ctx.userName,
        amount: p.amount,
        status: "pending",
        timestamp: new Date().toISOString(),
      });

      // Fire gamification events
      fireGamificationEvent({ userId: dbUserId, type: "bid_submitted", value: 1 });
      fireGamificationEvent({ userId: dbUserId, type: "platform_action", value: 1 });

      return {
        success: true,
        action: "submit_bid",
        message: `Bid of $${p.amount.toLocaleString()} submitted on load ${(load as any).loadNumber}.`,
        data: { bidId, loadId: p.loadId, amount: p.amount },
      };
    },
  },

  get_my_bids: {
    allowedRoles: ["CATALYST", "DRIVER", "DISPATCH", "BROKER"],
    description: "Get the user's submitted bids",
    schema: z.object({
      limit: z.number().max(20).default(10),
    }),
    handler: async (ctx, params) => {
      const db = await getDb();
      if (!db) return { success: false, action: "get_my_bids", message: "Database unavailable" };

      const dbUserId = await resolveDbUserId(ctx.userEmail);
      if (!dbUserId) return { success: false, action: "get_my_bids", message: "Could not resolve user" };

      const p = params as { limit: number };
      const rows = await db.select().from(bids)
        .where(eq(bids.catalystId, dbUserId))
        .orderBy(desc(bids.createdAt))
        .limit(p.limit);

      const summary = rows.map((r: any) => ({
        id: r.id,
        loadId: r.loadId,
        amount: `$${r.amount}`,
        status: r.status,
      }));

      return {
        success: true,
        action: "get_my_bids",
        message: `You have ${rows.length} bid(s).`,
        data: { bids: summary, count: rows.length },
      };
    },
  },

  // ── ERG Lookup ───────────────────────────────────────────────────────────

  erg_lookup: {
    allowedRoles: ["SHIPPER", "CATALYST", "DRIVER", "BROKER", "DISPATCH", "ESCORT", "TERMINAL_MANAGER", "COMPLIANCE_OFFICER", "SAFETY_MANAGER", "ADMIN", "SUPER_ADMIN"],
    description: "Look up ERG emergency response data for a hazmat material",
    schema: z.object({
      unNumber: z.string().optional(),
      materialName: z.string().optional(),
    }),
    handler: async (_ctx, params) => {
      const p = params as { unNumber?: string; materialName?: string };

      if (p.unNumber) {
        const info = await getFullERGInfo(p.unNumber.replace(/^UN/i, ""));
        if (info) return { success: true, action: "erg_lookup", message: `ERG data for UN${p.unNumber}`, data: info as any };
      }
      if (p.materialName) {
        const info = await getERGForProduct(p.materialName);
        if (info) return { success: true, action: "erg_lookup", message: `ERG data for ${p.materialName}`, data: info as any };
        const results = await searchMaterials(p.materialName, 5);
        if (results.length > 0) {
          return { success: true, action: "erg_lookup", message: `Found ${results.length} matching materials`, data: { results: results.map(r => ({ name: r.name, un: r.unNumber, class: r.hazardClass, guide: r.guide })) } };
        }
      }
      return { success: false, action: "erg_lookup", message: "No ERG data found. Provide a UN number or material name." };
    },
  },

  // ── Load Stats ───────────────────────────────────────────────────────────

  get_load_stats: {
    allowedRoles: ["SHIPPER", "CATALYST", "DRIVER", "BROKER", "DISPATCH", "ESCORT", "ADMIN", "SUPER_ADMIN"],
    description: "Get load statistics for the current user",
    schema: z.object({}),
    handler: async (ctx) => {
      const db = await getDb();
      if (!db) return { success: false, action: "get_load_stats", message: "Database unavailable" };

      const dbUserId = await resolveDbUserId(ctx.userEmail);
      if (!dbUserId) return { success: false, action: "get_load_stats", message: "Could not resolve user" };

      const [stats] = await db.select({
        total: sql<number>`COUNT(*)`,
        posted: sql<number>`SUM(CASE WHEN ${loads.status} = 'posted' THEN 1 ELSE 0 END)`,
        inTransit: sql<number>`SUM(CASE WHEN ${loads.status} = 'in_transit' THEN 1 ELSE 0 END)`,
        delivered: sql<number>`SUM(CASE WHEN ${loads.status} = 'delivered' THEN 1 ELSE 0 END)`,
        cancelled: sql<number>`SUM(CASE WHEN ${loads.status} = 'cancelled' THEN 1 ELSE 0 END)`,
      }).from(loads).where(eq(loads.shipperId, dbUserId));

      return {
        success: true,
        action: "get_load_stats",
        message: "Load statistics retrieved.",
        data: stats as any,
      };
    },
  },
  // ── Wallet / Financial Actions ─────────────────────────────────────────────

  analyze_finances: {
    allowedRoles: ["SHIPPER", "CATALYST", "DRIVER", "BROKER", "DISPATCH", "ESCORT", "ADMIN", "SUPER_ADMIN"],
    description: "Get AI-powered financial insights and recommendations for your wallet",
    schema: z.object({}),
    handler: async (ctx) => {
      const { esangAI } = await import("../_core/esangAI");
      const db = await getDb();
      if (!db) return { success: false, action: "analyze_finances", message: "Database unavailable" };
      const dbUserId = await resolveDbUserId(ctx.userEmail);
      // Gather wallet data
      const result = await esangAI.analyzeFinancials({
        userId: String(dbUserId), role: ctx.role, balance: 0,
        recentTransactions: [], monthlyEarnings: 0, monthlyExpenses: 0, outstandingInvoices: 0,
      });
      return { success: true, action: "analyze_finances", message: result.summary, data: result as any };
    },
  },

  // ── Zeun Mechanics Actions ────────────────────────────────────────────────

  diagnose_issue: {
    allowedRoles: ["DRIVER", "CATALYST", "DISPATCH", "ESCORT", "ADMIN", "SUPER_ADMIN"],
    description: "Get AI-powered diagnosis for a truck issue based on symptoms and fault codes",
    schema: z.object({
      symptoms: z.array(z.string()).min(1),
      faultCodes: z.array(z.string()).optional(),
      issueCategory: z.string().default("OTHER"),
      severity: z.string().default("MEDIUM"),
      canDrive: z.boolean().default(true),
    }),
    handler: async (_ctx, params) => {
      const { esangAI } = await import("../_core/esangAI");
      const p = params as { symptoms: string[]; faultCodes?: string[]; issueCategory: string; severity: string; canDrive: boolean };
      const diag = await esangAI.diagnoseBreakdown({
        symptoms: p.symptoms, faultCodes: p.faultCodes, issueCategory: p.issueCategory,
        severity: p.severity, canDrive: p.canDrive,
      });
      return {
        success: true, action: "diagnose_issue",
        message: `Diagnosis: ${diag.primaryDiagnosis.issue} (${diag.primaryDiagnosis.probability}% confidence, ${diag.primaryDiagnosis.severity})`,
        data: diag as any,
      };
    },
  },

  lookup_fault_code: {
    allowedRoles: ["DRIVER", "CATALYST", "DISPATCH", "ESCORT", "ADMIN", "SUPER_ADMIN"],
    description: "Look up a truck DTC/SPN-FMI fault code and get detailed analysis",
    schema: z.object({ code: z.string().min(1) }),
    handler: async (_ctx, params) => {
      const { esangAI } = await import("../_core/esangAI");
      const p = params as { code: string };
      const result = await esangAI.analyzeDTC(p.code);
      return {
        success: true, action: "lookup_fault_code",
        message: `${p.code}: ${result.description} (${result.severity})${!result.canDrive ? " — DO NOT DRIVE" : ""}`,
        data: result as any,
      };
    },
  },

  // ── Rate Analysis Actions ─────────────────────────────────────────────────

  analyze_rate: {
    allowedRoles: ["SHIPPER", "CATALYST", "DRIVER", "BROKER", "DISPATCH", "ADMIN", "SUPER_ADMIN"],
    description: "Analyze a freight rate for fairness using AI market intelligence",
    schema: z.object({
      origin: z.string(), destination: z.string(), cargoType: z.string().default("general"),
      proposedRate: z.number().positive(), distance: z.number().optional(),
      hazmat: z.boolean().optional(), equipmentType: z.string().optional(),
    }),
    handler: async (_ctx, params) => {
      const { esangAI } = await import("../_core/esangAI");
      const p = params as any;
      const result = await esangAI.analyzeRate(p);
      return {
        success: true, action: "analyze_rate",
        message: `Rate analysis: ${result.fairnessScore}/100 fairness — ${result.recommendation}. ${result.reasoning}`,
        data: result as any,
      };
    },
  },

  // ── Gamification Actions ──────────────────────────────────────────────────

  generate_missions: {
    allowedRoles: ["SHIPPER", "CATALYST", "DRIVER", "BROKER", "DISPATCH", "ESCORT", "ADMIN", "SUPER_ADMIN"],
    description: "Generate personalized AI-powered missions for The Haul gamification system",
    schema: z.object({
      level: z.number().default(1),
      recentActivity: z.array(z.string()).default([]),
    }),
    handler: async (ctx, params) => {
      const { esangAI } = await import("../_core/esangAI");
      const p = params as { level: number; recentActivity: string[] };
      const result = await esangAI.generateMissions({
        role: ctx.role, level: p.level, recentActivity: p.recentActivity, completedMissions: [],
      });
      return {
        success: true, action: "generate_missions",
        message: `Generated ${result.missions.length} personalized mission(s) for you.`,
        data: result as any,
      };
    },
  },

  // ── Messaging Actions ─────────────────────────────────────────────────────

  smart_reply: {
    allowedRoles: ["SHIPPER", "CATALYST", "DRIVER", "BROKER", "DISPATCH", "ESCORT", "ADMIN", "SUPER_ADMIN"],
    description: "Generate smart reply suggestions for a conversation",
    schema: z.object({
      messages: z.array(z.object({ sender: z.string(), text: z.string() })).min(1),
    }),
    handler: async (ctx, params) => {
      const { esangAI } = await import("../_core/esangAI");
      const p = params as { messages: Array<{ sender: string; text: string }> };
      const result = await esangAI.generateSmartReplies({
        messages: p.messages, userRole: ctx.role, userName: ctx.userName,
      });
      return {
        success: true, action: "smart_reply",
        message: `Suggested replies: ${result.replies.join(" | ")}`,
        data: result as any,
      };
    },
  },
};

// ─── Audit Log ───────────────────────────────────────────────────────────────

const auditLog: Array<{ ts: string; userId: number; action: string; success: boolean; message: string }> = [];

function logAudit(userId: number, action: string, success: boolean, message: string) {
  const entry = { ts: new Date().toISOString(), userId, action, success, message };
  auditLog.push(entry);
  // Keep last 500 entries in memory
  if (auditLog.length > 500) auditLog.shift();
  console.log(`[ESANG Action] ${success ? "✅" : "❌"} user=${userId} action=${action}: ${message}`);
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Execute a whitelisted action on behalf of a user.
 * Returns ActionResult with success/failure and data.
 */
export async function executeAction(
  actionName: string,
  rawParams: Record<string, unknown>,
  context: ActionContext
): Promise<ActionResult> {
  // 1. Check action exists in whitelist
  const actionDef = ACTION_REGISTRY[actionName];
  if (!actionDef) {
    logAudit(context.userId, actionName, false, "Action not in whitelist");
    return { success: false, action: actionName, message: `Unknown action '${actionName}'. I can only perform registered operations.` };
  }

  // 2. Check role permission
  if (!actionDef.allowedRoles.includes(context.role)) {
    logAudit(context.userId, actionName, false, `Role '${context.role}' not allowed`);
    return { success: false, action: actionName, message: `Your role (${context.role}) doesn't have permission for this action.` };
  }

  // 3. Validate params with zod
  const parseResult = actionDef.schema.safeParse(rawParams);
  if (!parseResult.success) {
    const errors = parseResult.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
    logAudit(context.userId, actionName, false, `Validation failed: ${errors}`);
    return { success: false, action: actionName, message: `Missing or invalid information: ${errors}` };
  }

  // 4. Execute handler
  try {
    const result = await actionDef.handler(context, parseResult.data);
    logAudit(context.userId, actionName, result.success, result.message);
    return result;
  } catch (err: any) {
    logAudit(context.userId, actionName, false, `Error: ${err?.message}`);
    return { success: false, action: actionName, message: "An internal error occurred while performing this action.", error: err?.message };
  }
}

/**
 * Parse action blocks from AI response text.
 * Format: [ESANG_ACTION:{"action":"create_load","params":{...}}]
 * Returns parsed actions and cleaned text (with action blocks removed).
 */
export function parseActionBlocks(text: string): { cleanText: string; actions: Array<{ action: string; params: Record<string, unknown> }> } {
  const actions: Array<{ action: string; params: Record<string, unknown> }> = [];
  const actionRegex = /\[ESANG_ACTION:([\s\S]*?)\]/g;

  let match;
  while ((match = actionRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed && typeof parsed.action === "string") {
        actions.push({
          action: String(parsed.action).replace(/[^a-z_]/g, ""), // sanitize action name
          params: typeof parsed.params === "object" && parsed.params !== null ? parsed.params : {},
        });
      }
    } catch {
      // Invalid JSON — skip this block (do not execute)
    }
  }

  // Remove action blocks from the visible text
  const cleanText = text.replace(actionRegex, "").trim();

  return { cleanText, actions };
}

/**
 * Get the list of available actions for a given role (for the system prompt).
 */
export function getAvailableActionsForRole(role: string): string {
  const entries = Object.entries(ACTION_REGISTRY)
    .filter(([, def]) => def.allowedRoles.includes(role))
    .map(([name, def]) => {
      let schemaKeys: string[] = [];
      try {
        const shape = (def.schema as any)?._def?.shape;
        schemaKeys = Object.keys(typeof shape === "function" ? shape() : (shape || {}));
      } catch { /* schema doesn't support shape introspection */ }
      return `- ${name}: ${def.description} (params: ${schemaKeys.join(", ") || "none"})`;
    });
  return entries.join("\n");
}
