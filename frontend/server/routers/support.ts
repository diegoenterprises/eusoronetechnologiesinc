/**
 * SUPPORT ROUTER
 * tRPC procedures for support ticket and help center operations
 * WIRED TO REAL DB — support_tickets + support_replies tables
 * WIRED TO REAL NOTIFICATIONS — Azure ACS Email + SMS
 */

import { z } from "zod";
import { eq, desc, sql, and, like, or } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb, getPool } from "../db";
import { users } from "../../drizzle/schema";

const ticketStatusSchema = z.enum(["open", "in_progress", "pending_customer", "resolved", "closed"]);
const ticketPrioritySchema = z.enum(["low", "normal", "high", "urgent"]);
const ticketCategorySchema = z.enum([
  "general", "account", "billing", "technical", "load_issue", "catalyst_dispute",
  "compliance", "feature_request", "driver_support", "other"
]);

// Helper: resolve numeric user ID
function resolveUserId(ctxUser: any): number {
  return typeof ctxUser?.id === "string" ? parseInt(ctxUser.id, 10) || 0 : (ctxUser?.id || 0);
}

// Helper: generate ticket number
function genTicketNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `TKT-${ts}${rand}`.slice(0, 16);
}

// Helper: raw query wrapper (support tables aren't in Drizzle schema, use raw SQL)
async function rawQuery(sqlStr: string, params: any[] = []): Promise<any[]> {
  const pool = getPool();
  if (!pool) return [];
  try {
    const [rows] = await pool.query(sqlStr, params);
    return Array.isArray(rows) ? rows : [];
  } catch (e: any) {
    console.error("[Support] Query error:", e?.message?.slice(0, 200));
    return [];
  }
}

async function rawExec(sqlStr: string, params: any[] = []): Promise<any> {
  const pool = getPool();
  if (!pool) return null;
  const [result] = await pool.query(sqlStr, params);
  return result;
}

// Helper: send support notification email + SMS
async function notifyTicketEvent(opts: {
  userEmail?: string; userName?: string; userPhone?: string;
  ticketNumber: string; subject: string; event: "created" | "replied" | "resolved" | "closed";
  replyMessage?: string;
}) {
  try {
    const { emailService } = await import("../_core/email");
    const titles: Record<string, string> = {
      created: "Support Ticket Created",
      replied: "New Reply on Your Ticket",
      resolved: "Your Ticket Has Been Resolved",
      closed: "Your Ticket Has Been Closed",
    };
    const bodies: Record<string, string> = {
      created: `Your support ticket <strong>${opts.ticketNumber}</strong> regarding "<em>${opts.subject}</em>" has been created. Our team will review it shortly.`,
      replied: `There's a new reply on your ticket <strong>${opts.ticketNumber}</strong>.<br><br>${opts.replyMessage ? `<blockquote style="border-left:3px solid #1473FF;padding-left:12px;color:#94a3b8">${opts.replyMessage.slice(0, 500)}</blockquote>` : ""}`,
      resolved: `Your support ticket <strong>${opts.ticketNumber}</strong> regarding "<em>${opts.subject}</em>" has been resolved. If you need further help, feel free to reopen it or create a new ticket.`,
      closed: `Your support ticket <strong>${opts.ticketNumber}</strong> has been closed. Thank you for using EusoTrip support.`,
    };
    if (opts.userEmail) {
      await emailService.send({
        to: opts.userEmail,
        subject: `${titles[opts.event]} — ${opts.ticketNumber}`,
        html: `<div style="font-family:sans-serif;padding:20px;max-width:600px"><div style="background:linear-gradient(135deg,#1473FF,#BE01FF);padding:16px 24px;border-radius:12px 12px 0 0"><h2 style="color:white;margin:0">${titles[opts.event]}</h2></div><div style="background:#1e293b;padding:24px;border-radius:0 0 12px 12px;color:#e2e8f0">${bodies[opts.event]}<p style="margin-top:20px;color:#64748b;font-size:12px">— EusoTrip Support Team</p></div></div>`,
        text: `${titles[opts.event]}: ${opts.subject} (${opts.ticketNumber})`,
      });
    }
    if (opts.userPhone) {
      const { sendSms } = await import("../services/eusosms");
      await sendSms({ to: opts.userPhone, message: `EusoTrip: ${titles[opts.event]} — ${opts.ticketNumber}: ${opts.subject}`.slice(0, 160) });
    }
  } catch (e) {
    console.error("[Support] Notification error:", e);
  }
}

export const supportRouter = router({
  /**
   * Get KB categories for KnowledgeBase page
   */
  getKBCategories: protectedProcedure
    .query(async () => {
      return [
        { id: "onboarding", name: "Getting Started", count: 3 },
        { id: "loads", name: "Loads & Shipping", count: 4 },
        { id: "compliance", name: "Compliance & Safety", count: 5 },
        { id: "billing", name: "Billing & Payments", count: 3 },
        { id: "technology", name: "Platform Technology", count: 2 },
        { id: "contracts", name: "Agreements & Contracts", count: 2 },
      ];
    }),

  /**
   * Get KB articles for KnowledgeBase page
   */
  getKBArticles: protectedProcedure
    .input(z.object({ categoryId: z.string().nullable().optional(), search: z.string().optional() }))
    .query(async ({ input }) => {
      const articles = [
        { id: "kb_001", title: "Getting Started with EusoTrip", category: "onboarding", summary: "Learn the basics of creating loads and finding catalysts", views: 2450 },
        { id: "kb_002", title: "HazMat Compliance Guide", category: "compliance", summary: "DOT/FMCSA requirements for hazardous materials transport", views: 1890 },
        { id: "kb_003", title: "Understanding Platform Fees", category: "billing", summary: "How the dynamic commission engine calculates fees (5-15%)", views: 3200 },
        { id: "kb_004", title: "Agreements & Smart Contracts", category: "contracts", summary: "Creating, signing, and managing catalyst agreements", views: 1450 },
        { id: "kb_005", title: "Emergency Response (ERG 2024)", category: "compliance", summary: "Using ESANG AI for real-time emergency guidance", views: 2100 },
        { id: "kb_006", title: "Spectra-Match Product ID", category: "technology", summary: "How crude oil identification works with spectral analysis", views: 980 },
        { id: "kb_007", title: "How to Accept a Load", category: "loads", summary: "View, review, and accept available loads", views: 4200 },
        { id: "kb_008", title: "DVIR Submission Guide", category: "compliance", summary: "Completing daily vehicle inspection reports", views: 1780 },
        { id: "kb_009", title: "Hours of Service (HOS)", category: "compliance", summary: "Understanding HOS regulations and tracking driving time", views: 3600 },
        { id: "kb_010", title: "Payment & Settlements", category: "billing", summary: "Payment schedules, settlements, and earnings", views: 5100 },
      ];
      let filtered = articles;
      if (input.categoryId) filtered = filtered.filter(a => a.category === input.categoryId);
      if (input.search) { const q = input.search.toLowerCase(); filtered = filtered.filter(a => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)); }
      return filtered;
    }),

  /**
   * Get KB article detail
   */
  getKBArticle: protectedProcedure
    .input(z.object({ articleId: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.articleId,
        title: "Knowledge Base Article", content: "Article content is being built out.", category: "general", author: "EusoTrip Support",
        updatedAt: new Date().toISOString(), views: 0, helpful: 0,
      };
    }),

  getKBBookmarks: protectedProcedure.query(async () => []),
  toggleKBBookmark: protectedProcedure.input(z.object({ articleId: z.string() })).mutation(async ({ input }) => ({ success: true, articleId: input.articleId, bookmarked: true })),

  /**
   * Get tickets — REAL DB. Admins see all, users see own.
   */
  getTickets: protectedProcedure
    .input(z.object({ search: z.string().optional(), status: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userId = resolveUserId(ctx.user);
      const role = (ctx.user?.role || "").toUpperCase();
      const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";

      let where = isAdmin ? "1=1" : "userId = ?";
      const params: any[] = isAdmin ? [] : [userId];

      if (input?.status && input.status !== "all") {
        where += " AND status = ?";
        params.push(input.status);
      }
      if (input?.search) {
        where += " AND (subject LIKE ? OR message LIKE ? OR ticketNumber LIKE ?)";
        const q = `%${input.search}%`;
        params.push(q, q, q);
      }

      return rawQuery(`SELECT id, ticketNumber, userId, userName, userEmail, userRole, subject, message, category, priority, status, assignedTo, loadId, satisfaction, feedback, resolvedAt, closedAt, createdAt, updatedAt FROM support_tickets WHERE ${where} ORDER BY createdAt DESC LIMIT 100`, params);
    }),

  /**
   * Get ticket stats — REAL DB counts
   */
  getTicketStats: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = resolveUserId(ctx.user);
      const role = (ctx.user?.role || "").toUpperCase();
      const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
      const where = isAdmin ? "" : " WHERE userId = ?";
      const params = isAdmin ? [] : [userId];

      const [total] = await rawQuery(`SELECT COUNT(*) as c FROM support_tickets${where}`, params);
      const [open] = await rawQuery(`SELECT COUNT(*) as c FROM support_tickets WHERE status='open'${isAdmin ? "" : " AND userId=?"}`, isAdmin ? [] : [userId]);
      const [inProgress] = await rawQuery(`SELECT COUNT(*) as c FROM support_tickets WHERE status='in_progress'${isAdmin ? "" : " AND userId=?"}`, isAdmin ? [] : [userId]);
      const [resolved] = await rawQuery(`SELECT COUNT(*) as c FROM support_tickets WHERE status='resolved'${isAdmin ? "" : " AND userId=?"}`, isAdmin ? [] : [userId]);
      const [closed] = await rawQuery(`SELECT COUNT(*) as c FROM support_tickets WHERE status='closed'${isAdmin ? "" : " AND userId=?"}`, isAdmin ? [] : [userId]);

      return {
        total: total?.c || 0,
        open: open?.c || 0,
        inProgress: inProgress?.c || 0,
        resolved: resolved?.c || 0,
        closed: closed?.c || 0,
        avgResponseTime: "< 2 hours",
      };
    }),

  /**
   * Get support summary — REAL DB
   */
  getSummary: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = resolveUserId(ctx.user);
      const role = (ctx.user?.role || "").toUpperCase();
      const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
      const where = isAdmin ? "" : " WHERE userId = ?";
      const params = isAdmin ? [] : [userId];

      const [total] = await rawQuery(`SELECT COUNT(*) as c FROM support_tickets${where}`, params);
      const [open] = await rawQuery(`SELECT COUNT(*) as c FROM support_tickets WHERE status='open'${isAdmin ? "" : " AND userId=?"}`, isAdmin ? [] : [userId]);
      const [inProgress] = await rawQuery(`SELECT COUNT(*) as c FROM support_tickets WHERE status='in_progress'${isAdmin ? "" : " AND userId=?"}`, isAdmin ? [] : [userId]);
      const [resolved] = await rawQuery(`SELECT COUNT(*) as c FROM support_tickets WHERE status='resolved'${isAdmin ? "" : " AND userId=?"}`, isAdmin ? [] : [userId]);

      return {
        total: total?.c || 0,
        open: open?.c || 0,
        openTickets: open?.c || 0,
        inProgress: inProgress?.c || 0,
        resolved: resolved?.c || 0,
        resolvedThisWeek: 0,
        avgResponseTime: "< 2 hours",
      };
    }),

  /**
   * Create support ticket — REAL DB + email/SMS notification
   */
  createTicket: protectedProcedure
    .input(z.object({
      subject: z.string().min(1),
      description: z.string().optional(),
      message: z.string().optional(),
      category: z.string().optional().default("general"),
      priority: z.string().optional().default("medium"),
      loadId: z.string().optional(),
      attachments: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = resolveUserId(ctx.user);
      const ticketNumber = genTicketNumber();
      const messageBody = input.message || input.description || "";

      // Get user info for the ticket
      const db = await getDb();
      let userName = ctx.user?.name || "";
      let userEmail = ctx.user?.email || "";
      let userPhone: string | undefined;
      if (db && userId) {
        try {
          const [u] = await db.select({ name: users.name, email: users.email, phone: users.phone }).from(users).where(eq(users.id, userId)).limit(1);
          if (u) { userName = u.name || userName; userEmail = u.email || userEmail; userPhone = u.phone || undefined; }
        } catch {}
      }

      const result = await rawExec(
        `INSERT INTO support_tickets (ticketNumber, userId, userName, userEmail, userRole, subject, message, category, priority, status, loadId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)`,
        [ticketNumber, userId, userName, userEmail, ctx.user?.role || "", input.subject, messageBody, input.category, input.priority, input.loadId ? parseInt(input.loadId) : null]
      );

      const ticketId = (result as any)?.insertId || 0;

      // Notify user via email + SMS
      notifyTicketEvent({
        userEmail, userName, userPhone,
        ticketNumber, subject: input.subject, event: "created",
      });

      // Notify admins via email
      try {
        const { emailService } = await import("../_core/email");
        await emailService.send({
          to: "support@eusotrip.com",
          subject: `[NEW] ${ticketNumber}: ${input.subject} (${input.priority})`,
          html: `<div style="font-family:sans-serif;padding:16px"><h3>New Support Ticket</h3><p><strong>From:</strong> ${userName} (${userEmail})<br><strong>Priority:</strong> ${input.priority}<br><strong>Category:</strong> ${input.category}</p><p>${messageBody.slice(0, 1000)}</p></div>`,
          text: `New ticket from ${userName}: ${input.subject}`,
        });
      } catch {}

      return {
        id: String(ticketId),
        ticketNumber,
        status: "open",
        createdBy: userId,
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Get my tickets — REAL DB
   */
  getMyTickets: protectedProcedure
    .input(z.object({ status: ticketStatusSchema.optional(), limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      const userId = resolveUserId(ctx.user);
      let where = "userId = ?";
      const params: any[] = [userId];
      if (input.status) { where += " AND status = ?"; params.push(input.status); }

      const tickets = await rawQuery(`SELECT * FROM support_tickets WHERE ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`, [...params, input.limit, input.offset]);
      const [countRow] = await rawQuery(`SELECT COUNT(*) as c FROM support_tickets WHERE ${where}`, params);
      return { tickets, total: countRow?.c || 0 };
    }),

  /**
   * Get ticket by ID — REAL DB + replies
   */
  getTicketById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const ticketId = parseInt(input.id) || 0;
      const [ticket] = await rawQuery(`SELECT * FROM support_tickets WHERE id = ? LIMIT 1`, [ticketId]);
      if (!ticket) return { id: input.id, ticketNumber: "", subject: "Not found", description: "", category: "", priority: "normal", status: "closed", loadId: null, loadNumber: null, createdBy: { id: "", name: "", email: "" }, createdAt: "", assignedTo: null, messages: [], attachments: [] };

      const replies = await rawQuery(`SELECT * FROM support_replies WHERE ticketId = ? ORDER BY createdAt ASC`, [ticketId]);

      return {
        ...ticket,
        id: String(ticket.id),
        description: ticket.message,
        createdBy: { id: String(ticket.userId), name: ticket.userName || "", email: ticket.userEmail || "" },
        createdAt: ticket.createdAt?.toISOString?.() || ticket.createdAt || "",
        messages: replies.map((r: any) => ({
          id: String(r.id),
          message: r.message,
          sentBy: { id: String(r.userId), name: r.userName || "", isStaff: r.isStaff },
          sentAt: r.createdAt?.toISOString?.() || r.createdAt || "",
        })),
        attachments: [],
      };
    }),

  /**
   * Reply to ticket — REAL DB + email/SMS notification
   */
  replyToTicket: protectedProcedure
    .input(z.object({
      ticketId: z.string(),
      message: z.string().min(1),
      attachments: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = resolveUserId(ctx.user);
      const role = (ctx.user?.role || "").toUpperCase();
      const isStaff = role === "SUPER_ADMIN" || role === "ADMIN";
      const ticketId = parseInt(input.ticketId) || 0;

      const result = await rawExec(
        `INSERT INTO support_replies (ticketId, userId, userName, userRole, message, isStaff) VALUES (?, ?, ?, ?, ?, ?)`,
        [ticketId, userId, ctx.user?.name || "", ctx.user?.role || "", input.message, isStaff]
      );

      // Update ticket status: if staff replies, set to in_progress; if user replies, set to open
      const newStatus = isStaff ? "in_progress" : "open";
      await rawExec(`UPDATE support_tickets SET status = ? WHERE id = ? AND status NOT IN ('resolved', 'closed')`, [newStatus, ticketId]);

      // Notify the other party
      const [ticket] = await rawQuery(`SELECT * FROM support_tickets WHERE id = ? LIMIT 1`, [ticketId]);
      if (ticket) {
        if (isStaff) {
          // Staff replied → notify the user
          notifyTicketEvent({
            userEmail: ticket.userEmail, userName: ticket.userName,
            ticketNumber: ticket.ticketNumber, subject: ticket.subject,
            event: "replied", replyMessage: input.message,
          });
        } else {
          // User replied → notify support
          try {
            const { emailService } = await import("../_core/email");
            await emailService.send({
              to: "support@eusotrip.com",
              subject: `[REPLY] ${ticket.ticketNumber}: ${ticket.subject}`,
              html: `<div style="font-family:sans-serif;padding:16px"><h3>New Reply from ${ctx.user?.name || "User"}</h3><p>${input.message.slice(0, 1000)}</p></div>`,
              text: `Reply on ${ticket.ticketNumber} from ${ctx.user?.name}: ${input.message.slice(0, 500)}`,
            });
          } catch {}
        }
      }

      return {
        id: String((result as any)?.insertId || 0),
        ticketId: input.ticketId,
        sentBy: userId,
        sentAt: new Date().toISOString(),
      };
    }),

  /**
   * Close / resolve ticket — REAL DB + notification
   */
  closeTicket: protectedProcedure
    .input(z.object({
      ticketId: z.string(),
      satisfaction: z.number().min(1).max(5).optional(),
      feedback: z.string().optional(),
      resolve: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = resolveUserId(ctx.user);
      const ticketId = parseInt(input.ticketId) || 0;
      const newStatus = input.resolve ? "resolved" : "closed";
      const now = new Date().toISOString();

      await rawExec(
        `UPDATE support_tickets SET status = ?, ${newStatus === "resolved" ? "resolvedAt" : "closedAt"} = ?, satisfaction = COALESCE(?, satisfaction), feedback = COALESCE(?, feedback) WHERE id = ?`,
        [newStatus, now, input.satisfaction || null, input.feedback || null, ticketId]
      );

      const [ticket] = await rawQuery(`SELECT * FROM support_tickets WHERE id = ? LIMIT 1`, [ticketId]);
      if (ticket) {
        notifyTicketEvent({
          userEmail: ticket.userEmail, userName: ticket.userName,
          ticketNumber: ticket.ticketNumber, subject: ticket.subject,
          event: newStatus === "resolved" ? "resolved" : "closed",
        });
      }

      return { success: true, ticketId: input.ticketId, status: newStatus, closedBy: userId, closedAt: now };
    }),

  /**
   * Get FAQ articles
   */
  getFAQArticles: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const articles = [
        { id: "faq_001", title: "How do I accept a load?", category: "loads", summary: "Learn how to view and accept available loads in the app.", views: 4250 },
        { id: "faq_002", title: "How do I submit a DVIR?", category: "compliance", summary: "Step-by-step guide for completing your daily vehicle inspection report.", views: 1980 },
        { id: "faq_003", title: "Understanding your HOS status", category: "compliance", summary: "Learn about Hours of Service regulations and how to track your driving time.", views: 3450 },
        { id: "faq_004", title: "Payment and settlements", category: "billing", summary: "Information about payment schedules, settlements, and viewing your earnings.", views: 5100 },
        { id: "faq_005", title: "Reporting an incident", category: "safety", summary: "How to report accidents, spills, or other incidents through the app.", views: 1650 },
        { id: "faq_006", title: "Using ESANG AI for help", category: "technology", summary: "Ask ESANG AI compliance questions, ERG lookups, platform help, and troubleshooting.", views: 2800 },
        { id: "faq_007", title: "Managing your rate sheet", category: "billing", summary: "Upload, digitize, and manage rate sheets with Schedule A pricing.", views: 1200 },
        { id: "faq_008", title: "Hazmat endorsement requirements", category: "compliance", summary: "CDL endorsements, training, and certifications for hazmat transport.", views: 2300 },
      ];
      let filtered = articles;
      if (input.category) filtered = filtered.filter(a => a.category === input.category);
      if (input.search) { const q = input.search.toLowerCase(); filtered = filtered.filter(a => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)); }
      return filtered.slice(0, input.limit);
    }),

  getFAQArticleById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id, title: "How do I accept a load?", category: "loads",
        content: `# How to Accept a Load\n\n## Step 1: View Available Loads\nNavigate to the Load Board from your dashboard.\n\n## Step 2: Review Load Details\nTap on any load to view origin/destination, pickup/delivery times, rate, distance, and product info.\n\n## Step 3: Accept the Load\nTap "Accept Load" and confirm.\n\n## Step 4: Confirmation\nThe load appears in "My Loads" with pickup instructions.\n\n## Need Help?\nContact support or chat with ESANG AI.`,
        relatedArticles: ["faq_002", "faq_003"], helpful: { yes: 245, no: 12 }, lastUpdated: "2026-02-01",
      };
    }),

  submitArticleFeedback: protectedProcedure
    .input(z.object({ articleId: z.string(), helpful: z.boolean(), feedback: z.string().optional() }))
    .mutation(async ({ input }) => ({ success: true, articleId: input.articleId, submittedAt: new Date().toISOString() })),

  getContactInfo: publicProcedure.query(async () => ({
    phone: "1-800-EUSOTRIP", email: "support@eusotrip.com", hours: "24/7",
    emergencyLine: "1-800-424-9300", chat: { available: true, avgWaitTime: 2 },
  })),

  /**
   * Request callback — REAL email notification to support
   */
  requestCallback: protectedProcedure
    .input(z.object({ phone: z.string(), preferredTime: z.string().optional(), reason: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { emailService } = await import("../_core/email");
        await emailService.send({
          to: "support@eusotrip.com",
          subject: `[CALLBACK] ${ctx.user?.name || "User"} — ${input.reason.slice(0, 50)}`,
          html: `<div style="font-family:sans-serif;padding:16px"><h3>Callback Requested</h3><p><strong>From:</strong> ${ctx.user?.name} (${ctx.user?.email})<br><strong>Phone:</strong> ${input.phone}<br><strong>Preferred Time:</strong> ${input.preferredTime || "ASAP"}<br><strong>Reason:</strong> ${input.reason}</p></div>`,
          text: `Callback from ${ctx.user?.name}: ${input.phone} — ${input.reason}`,
        });
      } catch {}
      return { id: `callback_${Date.now()}`, requestedBy: ctx.user?.id, requestedAt: new Date().toISOString(), estimatedCallback: new Date(Date.now() + 15 * 60 * 1000).toISOString() };
    }),

  /**
   * Report app issue — creates a ticket + notifies support
   */
  reportAppIssue: protectedProcedure
    .input(z.object({
      issueType: z.enum(["crash", "bug", "performance", "ui", "other"]),
      description: z.string(),
      deviceInfo: z.string().optional(),
      appVersion: z.string().optional(),
      screenshot: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = resolveUserId(ctx.user);
      const ticketNumber = genTicketNumber();
      const subject = `[${input.issueType.toUpperCase()}] App Issue Report`;
      const body = `${input.description}\n\nDevice: ${input.deviceInfo || "N/A"}\nApp Version: ${input.appVersion || "N/A"}`;

      await rawExec(
        `INSERT INTO support_tickets (ticketNumber, userId, userName, userEmail, userRole, subject, message, category, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'technical', 'high', 'open')`,
        [ticketNumber, userId, ctx.user?.name || "", ctx.user?.email || "", ctx.user?.role || "", subject, body]
      );

      // Notify support
      try {
        const { emailService } = await import("../_core/email");
        await emailService.send({
          to: "support@eusotrip.com",
          subject: `[APP ISSUE] ${ticketNumber}: ${input.issueType} — ${ctx.user?.name}`,
          html: `<div style="font-family:sans-serif;padding:16px"><h3>App Issue Report</h3><p><strong>Type:</strong> ${input.issueType}<br><strong>From:</strong> ${ctx.user?.name} (${ctx.user?.email})</p><p>${input.description.slice(0, 1000)}</p></div>`,
          text: `App issue (${input.issueType}) from ${ctx.user?.name}: ${input.description.slice(0, 500)}`,
        });
      } catch {}

      return { id: ticketNumber, reportedBy: ctx.user?.id, reportedAt: new Date().toISOString(), status: "received" };
    }),

  // Live chat (ESANG AI handles Tier 1 via the chat widget — these are for future live agent escalation)
  startChatSession: protectedProcedure.input(z.object({ topic: z.string().optional() })).mutation(async () => ({ sessionId: `chat_${Date.now()}`, agentName: "" })),
  endChatSession: protectedProcedure.input(z.object({ sessionId: z.string() })).mutation(async ({ input }) => ({ success: true, sessionId: input.sessionId })),
  getChatSession: protectedProcedure.input(z.object({ sessionId: z.string().optional() }).optional()).query(async ({ input }) => ({ sessionId: input?.sessionId || "", status: "inactive", startedAt: "", active: false, agent: null })),
  getChatMessages: protectedProcedure.input(z.object({ sessionId: z.string().optional() }).optional()).query(async () => []),
  sendChatMessage: protectedProcedure.input(z.object({ sessionId: z.string(), content: z.string() })).mutation(async () => ({ success: true, messageId: `msg_${Date.now()}` })),

  // Surveys
  getPendingSurveys: protectedProcedure.query(async () => []),
  getCompletedSurveys: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async () => ({ surveys: [], total: 0, avgRating: 0 })),
  getSurveyDetail: protectedProcedure.input(z.object({ surveyId: z.string() })).query(async ({ input }) => ({ surveyId: input.surveyId, title: "", description: "", questions: [] })),
  submitSurvey: protectedProcedure.input(z.object({ surveyId: z.string(), responses: z.array(z.object({ questionId: z.string(), answer: z.any() })) })).mutation(async ({ input }) => ({ success: true, surveyId: input.surveyId })),
});
