/**
 * SUPPORT ROUTER
 * tRPC procedures for support ticket and help center operations
 */

import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { auditedProtectedProcedure as protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";

const ticketStatusSchema = z.enum(["open", "in_progress", "pending_customer", "resolved", "closed"]);
const ticketPrioritySchema = z.enum(["low", "normal", "high", "urgent"]);
const ticketCategorySchema = z.enum([
  "account", "billing", "technical", "load_issue", "driver_support", "compliance", "other"
]);

export const supportRouter = router({
  /**
   * Get KB categories for KnowledgeBase page
   */
  getKBCategories: protectedProcedure
    .query(async () => {
      return [];
    }),

  /**
   * Get KB articles for KnowledgeBase page
   */
  getKBArticles: protectedProcedure
    .input(z.object({ categoryId: z.string().nullable().optional(), search: z.string().optional() }))
    .query(async ({ input }) => {
      return [];
    }),

  /**
   * Get KB article detail for KnowledgeBase page
   */
  getKBArticle: protectedProcedure
    .input(z.object({ articleId: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.articleId,
        title: "", content: "", category: "", author: "",
        updatedAt: "", views: 0, helpful: 0,
      };
    }),

  /**
   * Get KB bookmarks for KnowledgeBase page
   */
  getKBBookmarks: protectedProcedure
    .query(async () => {
      return [];
    }),

  /**
   * Toggle KB bookmark mutation
   */
  toggleKBBookmark: protectedProcedure
    .input(z.object({ articleId: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, articleId: input.articleId, bookmarked: true };
    }),

  /**
   * Get tickets for Support page
   */
  getTickets: protectedProcedure
    .input(z.object({ search: z.string().optional(), status: z.string().optional() }).optional())
    .query(async () => {
      // Support tickets require a dedicated support_tickets table
      return [];
    }),

  /**
   * Get ticket stats for SupportTickets page
   */
  getTicketStats: protectedProcedure
    .query(async () => ({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, avgResponseTime: "0" })),

  /**
   * Get support summary for Support page
   */
  getSummary: protectedProcedure
    .query(async () => ({ openTickets: 0, resolvedThisWeek: 0, avgResponseTime: "0", total: 0, open: 0, inProgress: 0, resolved: 0 })),

  /**
   * Create support ticket
   */
  createTicket: protectedProcedure
    .input(z.object({
      subject: z.string(),
      description: z.string().optional(),
      message: z.string().optional(),
      category: ticketCategorySchema.optional(),
      priority: z.string().optional(),
      loadId: z.string().optional(),
      attachments: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `ticket_${Date.now()}`,
        ticketNumber: `TKT-${Date.now().toString().slice(-6)}`,
        status: "open",
        createdBy: ctx.user?.id,
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Get my tickets
   */
  getMyTickets: protectedProcedure
    .input(z.object({ status: ticketStatusSchema.optional(), limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async () => ({ tickets: [], total: 0 })),

  /**
   * Get ticket by ID
   */
  getTicketById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => ({
      id: input.id, ticketNumber: "", subject: "", description: "",
      category: "", priority: "normal", status: "open", loadId: null, loadNumber: null,
      createdBy: { id: "", name: "", email: "" }, createdAt: "",
      assignedTo: null, messages: [], attachments: [],
    })),

  /**
   * Reply to ticket
   */
  replyToTicket: protectedProcedure
    .input(z.object({
      ticketId: z.string(),
      message: z.string(),
      attachments: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `msg_${Date.now()}`,
        ticketId: input.ticketId,
        sentBy: ctx.user?.id,
        sentAt: new Date().toISOString(),
      };
    }),

  /**
   * Close ticket
   */
  closeTicket: protectedProcedure
    .input(z.object({
      ticketId: z.string(),
      satisfaction: z.number().min(1).max(5).optional(),
      feedback: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        ticketId: input.ticketId,
        closedBy: ctx.user?.id,
        closedAt: new Date().toISOString(),
      };
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
        {
          id: "faq_001",
          title: "How do I accept a load?",
          category: "loads",
          summary: "Learn how to view and accept available loads in the app.",
          views: 1250,
        },
        {
          id: "faq_002",
          title: "How do I submit a DVIR?",
          category: "compliance",
          summary: "Step-by-step guide for completing your daily vehicle inspection report.",
          views: 980,
        },
        {
          id: "faq_003",
          title: "Understanding your HOS status",
          category: "compliance",
          summary: "Learn about Hours of Service regulations and how to track your driving time.",
          views: 1450,
        },
        {
          id: "faq_004",
          title: "Payment and settlements",
          category: "billing",
          summary: "Information about payment schedules, settlements, and viewing your earnings.",
          views: 2100,
        },
        {
          id: "faq_005",
          title: "Reporting an incident",
          category: "safety",
          summary: "How to report accidents, spills, or other incidents through the app.",
          views: 650,
        },
      ];

      let filtered = articles;
      if (input.category) filtered = filtered.filter(a => a.category === input.category);
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(a => 
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q)
        );
      }

      return filtered.slice(0, input.limit);
    }),

  /**
   * Get FAQ article by ID
   */
  getFAQArticleById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        title: "How do I accept a load?",
        category: "loads",
        content: `
# How to Accept a Load

## Step 1: View Available Loads
Navigate to the Load Board from your dashboard. You'll see a list of available loads that match your equipment and location.

## Step 2: Review Load Details
Tap on any load to view full details including:
- Origin and destination
- Pickup and delivery times
- Rate and distance
- Product information (including hazmat class if applicable)

## Step 3: Accept the Load
If the load meets your requirements, tap the "Accept Load" button. You'll be prompted to confirm your acceptance.

## Step 4: Confirmation
Once accepted, the load will appear in your "My Loads" section. You'll receive a notification with pickup instructions.

## Need Help?
If you have trouble accepting a load, please contact support or check that your profile and equipment are up to date.
        `,
        relatedArticles: ["faq_002", "faq_003"],
        helpful: { yes: 245, no: 12 },
        lastUpdated: "2025-01-15",
      };
    }),

  /**
   * Submit article feedback
   */
  submitArticleFeedback: protectedProcedure
    .input(z.object({
      articleId: z.string(),
      helpful: z.boolean(),
      feedback: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        articleId: input.articleId,
        submittedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get support contact info
   */
  getContactInfo: publicProcedure
    .query(async () => {
      return {
        phone: "1-800-EUSOTRIP",
        email: "support@eusotrip.com",
        hours: "24/7",
        emergencyLine: "1-800-EUSOTRIP-911",
        chat: {
          available: true,
          avgWaitTime: 2,
        },
      };
    }),

  /**
   * Request callback
   */
  requestCallback: protectedProcedure
    .input(z.object({
      phone: z.string(),
      preferredTime: z.string().optional(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `callback_${Date.now()}`,
        requestedBy: ctx.user?.id,
        requestedAt: new Date().toISOString(),
        estimatedCallback: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };
    }),

  /**
   * Report app issue
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
      return {
        id: `issue_${Date.now()}`,
        reportedBy: ctx.user?.id,
        reportedAt: new Date().toISOString(),
        status: "received",
      };
    }),

  // Live chat
  startChatSession: protectedProcedure.input(z.object({ topic: z.string().optional() })).mutation(async () => ({ sessionId: `chat_${Date.now()}`, agentName: "" })),
  endChatSession: protectedProcedure.input(z.object({ sessionId: z.string() })).mutation(async ({ input }) => ({ success: true, sessionId: input.sessionId })),
  getChatSession: protectedProcedure.input(z.object({ sessionId: z.string().optional() }).optional()).query(async ({ input }) => ({ sessionId: input?.sessionId || "", status: "inactive", startedAt: "", active: false, agent: null })),
  getChatMessages: protectedProcedure.input(z.object({ sessionId: z.string().optional() }).optional()).query(async () => {
    // Chat messages require a dedicated chat_messages table
    return [];
  }),
  sendChatMessage: protectedProcedure.input(z.object({ sessionId: z.string(), content: z.string() })).mutation(async () => ({ success: true, messageId: `msg_${Date.now()}` })),

  // Surveys
  getPendingSurveys: protectedProcedure.query(async () => {
    // Surveys require a dedicated surveys table
    return [];
  }),
  getCompletedSurveys: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async () => ({ surveys: [], total: 0, avgRating: 0 })),
  getSurveyDetail: protectedProcedure.input(z.object({ surveyId: z.string() })).query(async ({ input }) => ({ surveyId: input.surveyId, title: "", description: "", questions: [] })),
  submitSurvey: protectedProcedure.input(z.object({ surveyId: z.string(), responses: z.array(z.object({ questionId: z.string(), answer: z.any() })) })).mutation(async ({ input }) => ({ success: true, surveyId: input.surveyId })),
});
