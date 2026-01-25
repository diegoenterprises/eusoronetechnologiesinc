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
   * Get feature flags for FeatureFlags page
   */
  getFeatureFlags: protectedProcedure
    .query(async () => {
      return [
        { id: "f1", name: "new_dashboard", description: "Enable new dashboard UI", enabled: true, rollout: 100 },
        { id: "f2", name: "ai_load_matching", description: "AI-powered load matching", enabled: true, rollout: 50 },
        { id: "f3", name: "mobile_app_v2", description: "Mobile app version 2", enabled: false, rollout: 0 },
      ];
    }),

  /**
   * Toggle feature flag mutation
   */
  toggleFeatureFlag: protectedProcedure
    .input(z.object({ id: z.string(), enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      return { success: true, flagId: input.id, enabled: input.enabled };
    }),

  /**
   * Get API keys for APIManagement page
   */
  getAPIKeys: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ input }) => {
      const keys = [
        { id: "k1", name: "Production API", key: "pk_live_****abc", status: "active", lastUsed: "2025-01-23", requests: 12500 },
        { id: "k2", name: "Development API", key: "pk_test_****xyz", status: "active", lastUsed: "2025-01-22", requests: 3200 },
      ];
      if (input.search) {
        const q = input.search.toLowerCase();
        return keys.filter(k => k.name.toLowerCase().includes(q));
      }
      return keys;
    }),

  /**
   * Get API stats for APIManagement page
   */
  getAPIStats: protectedProcedure
    .query(async () => {
      return { totalKeys: 5, activeKeys: 4, totalRequests: 45000, avgLatency: 125 };
    }),

  /**
   * Revoke API key mutation
   */
  revokeAPIKey: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, revokedId: input.id };
    }),

  /**
   * Get scheduled tasks for ScheduledTasks page
   */
  getScheduledTasks: protectedProcedure
    .query(async () => {
      return [
        { id: "t1", name: "Daily Report Generation", schedule: "0 6 * * *", status: "active", lastRun: "2025-01-23 06:00", nextRun: "2025-01-24 06:00" },
        { id: "t2", name: "Compliance Check", schedule: "0 8 * * 1", status: "active", lastRun: "2025-01-20 08:00", nextRun: "2025-01-27 08:00" },
        { id: "t3", name: "Database Backup", schedule: "0 2 * * *", status: "active", lastRun: "2025-01-23 02:00", nextRun: "2025-01-24 02:00" },
      ];
    }),

  /**
   * Get task history for ScheduledTasks page
   */
  getTaskHistory: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async () => {
      return [
        { id: "h1", taskName: "Daily Report Generation", status: "success", startedAt: "2025-01-23 06:00", completedAt: "2025-01-23 06:02", duration: 120 },
        { id: "h2", taskName: "Database Backup", status: "success", startedAt: "2025-01-23 02:00", completedAt: "2025-01-23 02:15", duration: 900 },
      ];
    }),

  /**
   * Toggle scheduled task mutation
   */
  toggleScheduledTask: protectedProcedure
    .input(z.object({ id: z.string(), enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      return { success: true, taskId: input.id, enabled: input.enabled };
    }),

  /**
   * Run task now mutation
   */
  runTaskNow: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, taskId: input.id, startedAt: new Date().toISOString() };
    }),

  /**
   * Get exports for DataExport page
   */
  getExports: protectedProcedure
    .input(z.object({ dataType: z.string().optional() }))
    .query(async () => {
      return [
        { id: "e1", name: "Loads Export", dataType: "loads", format: "csv", status: "completed", createdAt: "2025-01-22", size: "2.5 MB", downloadUrl: "/exports/e1.csv" },
        { id: "e2", name: "Drivers Export", dataType: "drivers", format: "xlsx", status: "completed", createdAt: "2025-01-20", size: "850 KB", downloadUrl: "/exports/e2.xlsx" },
      ];
    }),

  /**
   * Get export stats for DataExport page
   */
  getExportStats: protectedProcedure
    .query(async () => {
      return { totalExports: 25, thisMonth: 8, avgSize: "1.2 MB", storageUsed: "45 MB" };
    }),

  /**
   * Create export mutation
   */
  createExport: protectedProcedure
    .input(z.object({ dataType: z.string(), format: z.string().optional().default("csv") }))
    .mutation(async ({ input }) => {
      return { success: true, exportId: `exp_${Date.now()}`, dataType: input.dataType, startedAt: new Date().toISOString() };
    }),

  /**
   * Get email templates for EmailTemplates page
   */
  getEmailTemplates: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ input }) => {
      const templates = [
        { id: "t1", name: "Load Confirmation", category: "transactional", subject: "Load {{loadNumber}} Confirmed", status: "active", lastUsed: "2025-01-23" },
        { id: "t2", name: "Driver Assignment", category: "notification", subject: "New Load Assignment", status: "active", lastUsed: "2025-01-22" },
        { id: "t3", name: "Invoice Sent", category: "transactional", subject: "Invoice #{{invoiceNumber}}", status: "active", lastUsed: "2025-01-21" },
      ];
      if (input.search) {
        const q = input.search.toLowerCase();
        return templates.filter(t => t.name.toLowerCase().includes(q));
      }
      return templates;
    }),

  /**
   * Get email template stats for EmailTemplates page
   */
  getEmailTemplateStats: protectedProcedure
    .query(async () => {
      return { total: 15, active: 12, draft: 3, sentThisMonth: 2450 };
    }),

  /**
   * Get backups for BackupManagement page
   */
  getBackups: protectedProcedure
    .input(z.object({ type: z.string().optional() }))
    .query(async ({ input }) => {
      const backups = [
        { id: "b1", name: "Full Backup", type: "full", status: "completed", size: "2.5 GB", createdAt: "2025-01-23 02:00", downloadUrl: "/backups/b1.zip" },
        { id: "b2", name: "Database Backup", type: "database", status: "completed", size: "850 MB", createdAt: "2025-01-22 02:00", downloadUrl: "/backups/b2.sql" },
        { id: "b3", name: "Config Backup", type: "config", status: "completed", size: "15 MB", createdAt: "2025-01-21 02:00", downloadUrl: "/backups/b3.zip" },
      ];
      if (input.type && input.type !== "all") return backups.filter(b => b.type === input.type);
      return backups;
    }),

  /**
   * Get backup stats for BackupManagement page
   */
  getBackupStats: protectedProcedure
    .query(async () => {
      return { totalBackups: 45, totalSize: "125 GB", lastBackup: "2025-01-23 02:00", nextScheduled: "2025-01-24 02:00" };
    }),

  /**
   * Create backup mutation
   */
  createBackup: protectedProcedure
    .input(z.object({ type: z.string().optional().default("full") }))
    .mutation(async ({ input }) => {
      return { success: true, backupId: `bkp_${Date.now()}`, type: input.type, startedAt: new Date().toISOString() };
    }),

  /**
   * Restore backup mutation
   */
  restoreBackup: protectedProcedure
    .input(z.object({ backupId: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, backupId: input.backupId, restoredAt: new Date().toISOString() };
    }),

  /**
   * Get database health for DatabaseHealth page
   */
  getDatabaseHealth: protectedProcedure
    .query(async () => {
      return {
        status: "healthy",
        uptime: "45 days",
        connections: { active: 25, max: 100, available: 75 },
        storage: { used: "45 GB", total: "100 GB", percentage: 45 },
        performance: { avgQueryTime: 15, slowQueries: 3, indexHitRate: 98.5 },
      };
    }),

  /**
   * Get slow queries for DatabaseHealth page
   */
  getSlowQueries: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async () => {
      return [
        { id: "q1", query: "SELECT * FROM loads WHERE...", avgTime: 250, calls: 150, lastRun: "2025-01-23 10:15" },
        { id: "q2", query: "SELECT * FROM drivers JOIN...", avgTime: 180, calls: 85, lastRun: "2025-01-23 09:45" },
      ];
    }),

  /**
   * Optimize database mutation
   */
  optimizeDatabase: protectedProcedure
    .mutation(async () => {
      return { success: true, optimizedAt: new Date().toISOString(), improvements: ["Index rebuilt", "Cache cleared"] };
    }),

  /**
   * Get integrations for IntegrationSettings page
   */
  getIntegrations: protectedProcedure
    .query(async () => {
      return [
        { id: "i1", name: "QuickBooks", type: "accounting", status: "connected", lastSync: "2025-01-23 10:00" },
        { id: "i2", name: "Samsara", type: "eld", status: "connected", lastSync: "2025-01-23 09:45" },
        { id: "i3", name: "Stripe", type: "payment", status: "connected", lastSync: "2025-01-23 08:30" },
        { id: "i4", name: "Twilio", type: "communication", status: "disconnected", lastSync: null },
      ];
    }),

  /**
   * Get integration stats for IntegrationSettings page
   */
  getIntegrationStats: protectedProcedure
    .query(async () => {
      return { total: 8, connected: 6, disconnected: 2, syncedToday: 45 };
    }),

  /**
   * Toggle integration mutation
   */
  toggleIntegration: protectedProcedure
    .input(z.object({ id: z.string(), enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      return { success: true, integrationId: input.id, enabled: input.enabled };
    }),

  /**
   * Sync integration mutation
   */
  syncIntegration: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, integrationId: input.id, syncedAt: new Date().toISOString() };
    }),

  /**
   * Get service status for SystemHealth page
   */
  getServiceStatus: protectedProcedure
    .query(async () => {
      return [
        { id: "s1", name: "API Server", status: "healthy", uptime: "99.9%", responseTime: 45, lastCheck: "2025-01-23 10:30" },
        { id: "s2", name: "Database", status: "healthy", uptime: "99.99%", responseTime: 12, lastCheck: "2025-01-23 10:30" },
        { id: "s3", name: "Redis Cache", status: "healthy", uptime: "99.95%", responseTime: 2, lastCheck: "2025-01-23 10:30" },
        { id: "s4", name: "File Storage", status: "healthy", uptime: "99.8%", responseTime: 85, lastCheck: "2025-01-23 10:30" },
      ];
    }),

  /**
   * Get webhook logs for WebhookLogs page
   */
  getWebhookLogs: protectedProcedure
    .input(z.object({ status: z.string().optional(), limit: z.number().optional().default(50) }))
    .query(async ({ input }) => {
      const logs = [
        { id: "wl1", webhookId: "w1", event: "load.created", status: "success", responseCode: 200, duration: 125, timestamp: "2025-01-23 10:15", payload: "{}" },
        { id: "wl2", webhookId: "w1", event: "load.updated", status: "failed", responseCode: 500, duration: 450, timestamp: "2025-01-23 09:45", payload: "{}", error: "Server error" },
      ];
      if (input.status) return logs.filter(l => l.status === input.status);
      return logs;
    }),

  /**
   * Get webhook summary for WebhookLogs page
   */
  getWebhookSummary: protectedProcedure
    .query(async () => {
      return { total: 245, successful: 238, failed: 7, avgResponseTime: 145 };
    }),

  /**
   * Retry webhook mutation
   */
  retryWebhook: protectedProcedure
    .input(z.object({ logId: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, logId: input.logId, retriedAt: new Date().toISOString() };
    }),

  /**
   * Get verification queue for VerificationQueue page
   */
  getVerificationQueue: protectedProcedure
    .input(z.object({ type: z.string().optional(), limit: z.number().optional().default(50) }))
    .query(async ({ input }) => {
      const items = [
        { id: "v1", type: "driver", name: "John Driver", submittedAt: "2025-01-22", documents: ["CDL", "Medical Card"], status: "pending" },
        { id: "v2", type: "carrier", name: "ABC Transport", submittedAt: "2025-01-21", documents: ["MC Authority", "Insurance"], status: "pending" },
      ];
      if (input.type) return items.filter(i => i.type === input.type);
      return items;
    }),

  /**
   * Get verification summary for VerificationQueue page
   */
  getVerificationSummary: protectedProcedure
    .query(async () => {
      return { pending: 12, approved: 145, rejected: 8, avgProcessingTime: "2.5 hours" };
    }),

  /**
   * Approve verification mutation
   */
  approveVerification: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, id: input.id, status: "approved" };
    }),

  /**
   * Reject verification mutation
   */
  rejectVerification: protectedProcedure
    .input(z.object({ id: z.string(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      return { success: true, id: input.id, status: "rejected" };
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
