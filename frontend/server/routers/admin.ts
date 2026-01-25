/**
 * ADMIN ROUTER
 * tRPC procedures for admin/super admin operations
 * Based on 10_ADMIN_USER_JOURNEY.md
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const userStatusSchema = z.enum(["active", "pending", "suspended", "inactive"]);
const verificationStatusSchema = z.enum(["pending", "approved", "rejected", "needs_info"]);

export const adminRouter = router({
  /**
   * Get users for UserManagement page
   */
  getUsers: protectedProcedure
    .input(z.object({ search: z.string().optional(), role: z.string().optional() }))
    .query(async ({ input }) => {
      const users = [
        { id: "u1", name: "Mike Johnson", email: "mike@example.com", role: "driver", status: "active", lastLogin: "2025-01-23" },
        { id: "u2", name: "Sarah Williams", email: "sarah@example.com", role: "carrier", status: "active", lastLogin: "2025-01-22" },
        { id: "u3", name: "Tom Brown", email: "tom@example.com", role: "shipper", status: "pending", lastLogin: null },
      ];
      let filtered = users;
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
      }
      if (input.role && input.role !== "all") filtered = filtered.filter(u => u.role === input.role);
      return filtered;
    }),

  /**
   * Get user stats for UserManagement page
   */
  getUserStats: protectedProcedure
    .query(async () => {
      return { total: 2450, active: 1890, pending: 145, suspended: 12 };
    }),

  /**
   * Toggle user status mutation
   */
  toggleUserStatus: protectedProcedure
    .input(z.object({ userId: z.string(), status: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, userId: input.userId, newStatus: input.status };
    }),

  /**
   * Get webhooks for WebhookManagement page
   */
  getWebhooks: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ input }) => {
      const webhooks = [
        { id: "w1", name: "Load Status Updates", url: "https://api.example.com/webhooks/loads", events: ["load.created", "load.updated"], status: "active", lastTriggered: "2025-01-23" },
        { id: "w2", name: "Driver Alerts", url: "https://api.example.com/webhooks/drivers", events: ["driver.hos_warning"], status: "active", lastTriggered: "2025-01-22" },
      ];
      if (input.search) {
        const q = input.search.toLowerCase();
        return webhooks.filter(w => w.name.toLowerCase().includes(q));
      }
      return webhooks;
    }),

  /**
   * Get webhook stats for WebhookManagement page
   */
  getWebhookStats: protectedProcedure
    .query(async () => {
      return { total: 8, active: 6, failed: 1, disabled: 1, triggeredToday: 45 };
    }),

  /**
   * Delete webhook mutation
   */
  deleteWebhook: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, deletedId: input.id };
    }),

  /**
   * Test webhook mutation
   */
  testWebhook: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, webhookId: input.id, responseTime: 245, statusCode: 200 };
    }),

  /**
   * Get admin dashboard summary
   */
  getDashboardSummary: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        users: {
          total: 2450,
          active: 1890,
          pending: 145,
          suspended: 12,
        },
        companies: {
          total: 320,
          carriers: 180,
          shippers: 85,
          brokers: 35,
          other: 20,
        },
        loads: {
          active: 450,
          completedToday: 125,
          totalThisMonth: 2850,
        },
        revenue: {
          gmvToday: 485000,
          gmvThisMonth: 8500000,
          platformFeesThisMonth: 170000,
        },
        pendingVerifications: 23,
        openTickets: 8,
        systemHealth: "healthy",
      };
    }),

  /**
   * List users
   */
  listUsers: protectedProcedure
    .input(z.object({
      status: userStatusSchema.optional(),
      role: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const users = [
        {
          id: "u1",
          email: "mike.johnson@example.com",
          name: "Mike Johnson",
          role: "DRIVER",
          companyId: "car_001",
          companyName: "ABC Transport LLC",
          status: "active",
          createdAt: "2022-03-15",
          lastLogin: "2025-01-23",
        },
        {
          id: "u2",
          email: "john.manager@abctransport.com",
          name: "John Manager",
          role: "CARRIER",
          companyId: "car_001",
          companyName: "ABC Transport LLC",
          status: "active",
          createdAt: "2021-06-01",
          lastLogin: "2025-01-23",
        },
        {
          id: "u3",
          email: "sarah.shipper@shell.com",
          name: "Sarah Shipper",
          role: "SHIPPER",
          companyId: "ship_001",
          companyName: "Shell Oil Company",
          status: "active",
          createdAt: "2020-01-15",
          lastLogin: "2025-01-22",
        },
        {
          id: "u4",
          email: "new.user@example.com",
          name: "New User",
          role: "CARRIER",
          companyId: null,
          companyName: null,
          status: "pending",
          createdAt: "2025-01-22",
          lastLogin: null,
        },
      ];

      let filtered = users;
      if (input.status) filtered = filtered.filter(u => u.status === input.status);
      if (input.role) filtered = filtered.filter(u => u.role === input.role);
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(u => 
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        );
      }

      return {
        users: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
      };
    }),

  /**
   * Get user by ID
   */
  getUserById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        email: "mike.johnson@example.com",
        name: "Mike Johnson",
        phone: "555-0101",
        role: "DRIVER",
        companyId: "car_001",
        companyName: "ABC Transport LLC",
        status: "active",
        verified: true,
        createdAt: "2022-03-15",
        lastLogin: "2025-01-23T10:30:00Z",
        loginCount: 245,
        permissions: ["view_loads", "accept_loads", "submit_documents"],
        notes: [],
      };
    }),

  /**
   * Update user status
   */
  updateUserStatus: protectedProcedure
    .input(z.object({
      userId: z.string(),
      status: userStatusSchema,
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        userId: input.userId,
        newStatus: input.status,
        updatedBy: ctx.user?.id,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get pending verifications
   */
  getPendingVerifications: protectedProcedure
    .input(z.object({
      type: z.enum(["user", "company", "document", "all"]).optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      return [
        {
          id: "ver_001",
          type: "company",
          entityId: "car_003",
          entityName: "SafeHaul Transport",
          submittedAt: "2025-01-22T14:00:00Z",
          priority: "high",
          documents: ["Operating Authority", "Insurance Certificate", "W-9"],
          assignedTo: null,
        },
        {
          id: "ver_002",
          type: "user",
          entityId: "u4",
          entityName: "New User",
          submittedAt: "2025-01-22T16:00:00Z",
          priority: "normal",
          documents: ["Driver License", "CDL"],
          assignedTo: null,
        },
        {
          id: "ver_003",
          type: "document",
          entityId: "doc_123",
          entityName: "Insurance Certificate Renewal",
          parentEntity: "ABC Transport LLC",
          submittedAt: "2025-01-21T10:00:00Z",
          priority: "normal",
          documents: ["Insurance Certificate"],
          assignedTo: "Admin User",
        },
      ];
    }),

  /**
   * Process verification
   */
  processVerification: protectedProcedure
    .input(z.object({
      verificationId: z.string(),
      decision: verificationStatusSchema,
      notes: z.string().optional(),
      requestedDocuments: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        verificationId: input.verificationId,
        decision: input.decision,
        processedBy: ctx.user?.id,
        processedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get platform statistics
   */
  getPlatformStats: protectedProcedure
    .input(z.object({
      period: z.enum(["day", "week", "month", "quarter", "year"]).default("month"),
    }))
    .query(async ({ input }) => {
      return {
        period: input.period,
        users: {
          total: 2450,
          newThisPeriod: 145,
          activeThisPeriod: 1890,
          churnRate: 2.1,
        },
        loads: {
          total: 8500,
          completed: 8100,
          avgValue: 2850,
          totalGMV: 24225000,
        },
        revenue: {
          platformFees: 485000,
          subscriptions: 45000,
          total: 530000,
        },
        performance: {
          avgLoadTime: 42,
          onTimeRate: 94.5,
          customerSatisfaction: 4.6,
        },
      };
    }),

  /**
   * Get system health
   */
  getSystemHealth: protectedProcedure
    .query(async () => {
      return {
        overall: "healthy",
        services: [
          { name: "API Server", status: "healthy", uptime: 99.99, latency: 45 },
          { name: "Database", status: "healthy", uptime: 99.98, latency: 12 },
          { name: "GPS Tracking", status: "healthy", uptime: 99.95, latency: 85 },
          { name: "Notifications", status: "healthy", uptime: 99.90, latency: 120 },
          { name: "File Storage", status: "healthy", uptime: 99.99, latency: 35 },
        ],
        lastCheck: new Date().toISOString(),
      };
    }),

  /**
   * Impersonate user (for support)
   */
  impersonateUser: protectedProcedure
    .input(z.object({
      userId: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        sessionToken: `imp_${Date.now()}`,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        loggedAction: true,
      };
    }),

  /**
   * Send platform announcement
   */
  sendAnnouncement: protectedProcedure
    .input(z.object({
      title: z.string(),
      message: z.string(),
      targetRoles: z.array(z.string()).optional(),
      priority: z.enum(["low", "normal", "high"]).default("normal"),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        announcementId: `ann_${Date.now()}`,
        sentTo: input.targetRoles || ["all"],
        sentAt: new Date().toISOString(),
      };
    }),

  /**
   * Get recent activity
   */
  getRecentActivity: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input }) => {
      return [
        { timestamp: new Date().toISOString(), action: "User login", user: "Mike Johnson", details: "Successful login from mobile app" },
        { timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), action: "Load created", user: "Sarah Shipper", details: "Load LOAD-45925 created" },
        { timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), action: "Bid submitted", user: "ABC Transport", details: "Bid on LOAD-45921" },
        { timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), action: "Document uploaded", user: "Tom Brown", details: "CDL renewal uploaded" },
        { timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(), action: "Company verified", user: "Admin", details: "SafeHaul Transport verified" },
      ];
    }),

  /**
   * Update system configuration
   */
  updateConfig: protectedProcedure
    .input(z.object({
      key: z.string(),
      value: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        key: input.key,
        updatedBy: ctx.user?.id,
        updatedAt: new Date().toISOString(),
      };
    }),
});
