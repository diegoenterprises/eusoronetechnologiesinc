/**
 * SUPPORT ROUTER
 * tRPC procedures for support ticket and help center operations
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

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
      return [
        { id: "c1", name: "Getting Started", icon: "rocket", articleCount: 12 },
        { id: "c2", name: "Load Management", icon: "package", articleCount: 18 },
        { id: "c3", name: "Billing & Payments", icon: "credit-card", articleCount: 8 },
        { id: "c4", name: "Compliance", icon: "shield", articleCount: 15 },
      ];
    }),

  /**
   * Get KB articles for KnowledgeBase page
   */
  getKBArticles: protectedProcedure
    .input(z.object({ categoryId: z.string().nullable().optional(), search: z.string().optional() }))
    .query(async ({ input }) => {
      const articles = [
        { id: "a1", title: "How to Create a Load", categoryId: "c2", excerpt: "Step-by-step guide...", views: 1250 },
        { id: "a2", title: "Understanding HOS Rules", categoryId: "c4", excerpt: "Hours of Service explained...", views: 980 },
        { id: "a3", title: "Payment Methods", categoryId: "c3", excerpt: "Available payment options...", views: 750 },
      ];
      let filtered = articles;
      if (input.categoryId) filtered = filtered.filter(a => a.categoryId === input.categoryId);
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(a => a.title.toLowerCase().includes(q));
      }
      return filtered;
    }),

  /**
   * Get KB article detail for KnowledgeBase page
   */
  getKBArticle: protectedProcedure
    .input(z.object({ articleId: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.articleId,
        title: "How to Create a Load",
        content: "## Overview\n\nThis guide walks you through creating a new load...",
        category: "Load Management",
        author: "Support Team",
        updatedAt: "2025-01-15",
        views: 1250,
        helpful: 95,
      };
    }),

  /**
   * Get KB bookmarks for KnowledgeBase page
   */
  getKBBookmarks: protectedProcedure
    .query(async () => {
      return [
        { articleId: "a1", title: "How to Create a Load", bookmarkedAt: "2025-01-20" },
      ];
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
    .query(async ({ input }) => {
      const tickets = [
        { id: "t1", number: "TKT-123456", subject: "Load assignment issue", status: "open", priority: "high", createdAt: "2025-01-22" },
        { id: "t2", number: "TKT-123455", subject: "Billing question", status: "resolved", priority: "normal", createdAt: "2025-01-20" },
      ];
      if (input?.status && input.status !== "all") return tickets.filter(t => t.status === input.status);
      return tickets;
    }),

  /**
   * Get ticket stats for SupportTickets page
   */
  getTicketStats: protectedProcedure
    .query(async () => {
      return { total: 45, open: 8, inProgress: 5, resolved: 30, closed: 2, avgResponseTime: "2.5 hours" };
    }),

  /**
   * Get support summary for Support page
   */
  getSummary: protectedProcedure
    .query(async () => {
      return {
        openTickets: 2,
        resolvedThisWeek: 5,
        avgResponseTime: "2.5 hours",
        total: 47,
        open: 2,
        inProgress: 3,
        resolved: 42,
      };
    }),

  /**
   * Create support ticket
   */
  createTicket: protectedProcedure
    .input(z.object({
      subject: z.string(),
      description: z.string().optional(),
      message: z.string().optional(),
      category: ticketCategorySchema.optional(),
      priority: ticketPrioritySchema.optional(),
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
    .input(z.object({
      status: ticketStatusSchema.optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const tickets = [
        {
          id: "ticket_001",
          ticketNumber: "TKT-123456",
          subject: "Issue with load assignment",
          category: "load_issue",
          priority: "high",
          status: "in_progress",
          createdAt: "2025-01-22T10:00:00Z",
          lastUpdate: "2025-01-22T14:30:00Z",
          assignedTo: "Support Agent",
        },
        {
          id: "ticket_002",
          ticketNumber: "TKT-123455",
          subject: "Billing question",
          category: "billing",
          priority: "normal",
          status: "resolved",
          createdAt: "2025-01-20T09:00:00Z",
          lastUpdate: "2025-01-21T16:00:00Z",
          resolvedAt: "2025-01-21T16:00:00Z",
        },
      ];

      let filtered = tickets;
      if (input.status) filtered = filtered.filter(t => t.status === input.status);

      return {
        tickets: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
      };
    }),

  /**
   * Get ticket by ID
   */
  getTicketById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        ticketNumber: "TKT-123456",
        subject: "Issue with load assignment",
        description: "I cannot see my assigned load in the app. The load number is LOAD-45920.",
        category: "load_issue",
        priority: "high",
        status: "in_progress",
        loadId: "load_001",
        loadNumber: "LOAD-45920",
        createdBy: { id: "u1", name: "Mike Johnson", email: "mike.j@example.com" },
        createdAt: "2025-01-22T10:00:00Z",
        assignedTo: { id: "agent_001", name: "Support Agent" },
        messages: [
          {
            id: "msg_001",
            sender: "user",
            senderName: "Mike Johnson",
            content: "I cannot see my assigned load in the app. The load number is LOAD-45920.",
            timestamp: "2025-01-22T10:00:00Z",
          },
          {
            id: "msg_002",
            sender: "agent",
            senderName: "Support Agent",
            content: "Thank you for reaching out. I'm looking into this issue now. Can you please confirm which device you're using?",
            timestamp: "2025-01-22T10:15:00Z",
          },
          {
            id: "msg_003",
            sender: "user",
            senderName: "Mike Johnson",
            content: "I'm using an iPhone 14 with the latest app version.",
            timestamp: "2025-01-22T10:20:00Z",
          },
          {
            id: "msg_004",
            sender: "agent",
            senderName: "Support Agent",
            content: "I found the issue. There was a sync problem with your account. I've fixed it and you should see the load now. Please log out and log back in.",
            timestamp: "2025-01-22T14:30:00Z",
          },
        ],
        attachments: [],
      };
    }),

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
  startChatSession: protectedProcedure.input(z.object({ topic: z.string().optional() })).mutation(async () => ({ sessionId: "chat_123", agentName: "Support Agent" })),
  endChatSession: protectedProcedure.input(z.object({ sessionId: z.string() })).mutation(async ({ input }) => ({ success: true, sessionId: input.sessionId })),
  getChatSession: protectedProcedure.input(z.object({ sessionId: z.string().optional() }).optional()).query(async ({ input }) => ({ sessionId: input?.sessionId || "session_123", status: "active", startedAt: "2025-01-23 10:00", active: true, agent: { id: "a1", name: "Support Agent", avatar: "/avatars/agent.png", online: true } })),
  getChatMessages: protectedProcedure.input(z.object({ sessionId: z.string() })).query(async () => [{ id: "m1", sender: "agent", content: "How can I help?", timestamp: "2025-01-23 10:00" }]),
  sendChatMessage: protectedProcedure.input(z.object({ sessionId: z.string(), content: z.string() })).mutation(async ({ input }) => ({ success: true, messageId: "msg_123" })),

  // Surveys
  getPendingSurveys: protectedProcedure.query(async () => [{ id: "s1", ticketId: "t1", type: "satisfaction", dueBy: "2025-01-25" }]),
  getCompletedSurveys: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async () => ({ surveys: [{ id: "s1", ticketId: "t1", title: "Support Feedback", rating: 5, completedAt: "2025-01-22" }], total: 25, avgRating: 4.6 })),
  getSurveyDetail: protectedProcedure.input(z.object({ surveyId: z.string() })).query(async ({ input }) => ({ surveyId: input.surveyId, title: "Service Feedback Survey", description: "Please rate your experience", questions: [{ id: "q1", text: "How was your experience?", type: "rating" }] })),
  submitSurvey: protectedProcedure.input(z.object({ surveyId: z.string(), responses: z.array(z.object({ questionId: z.string(), answer: z.any() })) })).mutation(async ({ input }) => ({ success: true, surveyId: input.surveyId })),
});
