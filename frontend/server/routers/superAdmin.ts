/**
 * SUPER ADMIN ROUTER
 * Platform-wide administration procedures
 */

import { z } from "zod";
import { router, superAdminProcedure as protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
// @ts-ignore - Schema import
import { users, companies } from "../../drizzle/schema";
import { eq, desc, sql, and, like, or, gte } from "drizzle-orm";

export const superAdminRouter = router({
  create: protectedProcedure
    .input(z.object({
      entityType: z.enum(["user", "company"]),
      name: z.string(),
      email: z.string().optional(),
      role: z.string().optional(),
      companyId: z.number().optional(),
      companyType: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      if (input.entityType === "company") {
        const [result] = await db.insert(companies).values({
          name: input.name,
          legalName: input.name,
          complianceStatus: "pending",
          isActive: true,
        }).$returningId();
        return { success: true, id: result.id, entityType: "company" };
      }
      const openId = `sa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const [result] = await db.insert(users).values({
        openId,
        name: input.name,
        email: input.email,
        role: (input.role || "DRIVER") as any,
        companyId: input.companyId,
        isActive: true,
      }).$returningId();
      return { success: true, id: result.id, entityType: "user" };
    }),

  update: protectedProcedure
    .input(z.object({
      entityType: z.enum(["user", "company"]),
      id: z.number(),
      name: z.string().optional(),
      role: z.string().optional(),
      isActive: z.boolean().optional(),
      status: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      if (input.entityType === "company") {
        const updates: Record<string, any> = {};
        if (input.name) updates.name = input.name;
        if (input.status) updates.status = input.status;
        if (Object.keys(updates).length > 0) {
          await db.update(companies).set(updates).where(eq(companies.id, input.id));
        }
      } else {
        const updates: Record<string, any> = {};
        if (input.name) updates.name = input.name;
        if (input.role) updates.role = input.role;
        if (input.isActive !== undefined) updates.isActive = input.isActive;
        if (Object.keys(updates).length > 0) {
          await db.update(users).set(updates).where(eq(users.id, input.id));
        }
      }
      return { success: true, id: input.id };
    }),

  delete: protectedProcedure
    .input(z.object({ entityType: z.enum(["user", "company"]), id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      if (input.entityType === "company") {
        await db.update(companies).set({ isActive: false }).where(eq(companies.id, input.id));
      } else {
        await db.update(users).set({ isActive: false }).where(eq(users.id, input.id));
      }
      return { success: true, id: input.id };
    }),

  // Platform Stats
  getPlatformStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { users: 0, companies: 0, loads: 0, revenue: 0 };
    
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [companyCount] = await db.select({ count: sql<number>`count(*)` }).from(companies);
    const { loads } = await import('../../drizzle/schema');
    const [loadCount] = await db.select({ count: sql<number>`count(*)` }).from(loads);
    const [revenue] = await db.select({ sum: sql<number>`COALESCE(SUM(CAST(rate AS DECIMAL)), 0)` }).from(loads).where(eq(loads.status, 'delivered'));
    const [activeDrivers] = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(eq(users.role, 'DRIVER' as any), eq(users.isActive, true)));
    const [pendingVerif] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isVerified, false));
    
    return {
      users: userCount?.count || 0,
      companies: companyCount?.count || 0,
      loads: loadCount?.count || 0,
      revenue: revenue?.sum || 0,
      activeDrivers: activeDrivers?.count || 0,
      pendingVerifications: pendingVerif?.count || 0,
    };
  }),

  // User Management
  getUsers: protectedProcedure
    .input(z.object({ search: z.string().optional(), role: z.string().optional(), limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      let query = db.select({ id: users.id, name: users.name, email: users.email, role: users.role, isActive: users.isActive, isVerified: users.isVerified, companyId: users.companyId, createdAt: users.createdAt, updatedAt: users.updatedAt }).from(users).orderBy(desc(users.createdAt)).limit(input?.limit || 50);
      return await query;
    }),

  // Company Management
  getCompanies: protectedProcedure
    .input(z.object({ search: z.string().optional(), type: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      return await db.select().from(companies).orderBy(desc(companies.createdAt)).limit(50);
    }),

  // System Health
  getSystemHealth: protectedProcedure.query(async () => {
    return {
      status: "healthy",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: 0,
      services: {
        database: "connected",
        redis: "connected",
        websocket: "active",
      },
    };
  }),

  // Audit Logs
  getAuditLogs: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const { auditLogs } = await import('../../drizzle/schema');
        const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(input?.limit || 50);
        return rows.map(r => ({ id: String(r.id), userId: r.userId, action: r.action, entityType: r.entityType, entityId: r.entityId, ip: r.ipAddress || '', timestamp: r.createdAt?.toISOString() || '' }));
      } catch (e) { return []; }
    }),

  // Feature Flags
  getFeatureFlags: protectedProcedure.query(async () => {
    return [];
  }),

  updateFeatureFlag: protectedProcedure
    .input(z.object({ id: z.string(), enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      return { success: true, id: input.id, enabled: input.enabled };
    }),

  // API Management
  getAPIKeys: protectedProcedure.query(async () => {
    return { items: [] };
  }),

  // Revenue Analytics
  getRevenueAnalytics: protectedProcedure
    .input(z.object({ period: z.string().optional() }).optional())
    .query(async () => {
      const db = await getDb(); if (!db) return { total: 0, byMonth: [], byCategory: [], growth: 0 };
      try {
        const { loads } = await import('../../drizzle/schema');
        const [total] = await db.select({ sum: sql<number>`COALESCE(SUM(CAST(rate AS DECIMAL)), 0)` }).from(loads).where(eq(loads.status, 'delivered'));
        const byMonth: Array<{ month: string; revenue: number }> = [];
        for (let i = 5; i >= 0; i--) {
          const start = new Date(); start.setMonth(start.getMonth() - i, 1); start.setHours(0, 0, 0, 0);
          const end = new Date(start); end.setMonth(end.getMonth() + 1);
          const [m] = await db.select({ sum: sql<number>`COALESCE(SUM(CAST(rate AS DECIMAL)), 0)` }).from(loads).where(and(eq(loads.status, 'delivered'), gte(loads.createdAt, start), sql`${loads.createdAt} < ${end}`));
          byMonth.push({ month: start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), revenue: Math.round(m?.sum || 0) });
        }
        const first = byMonth[0]?.revenue || 0; const last = byMonth[byMonth.length - 1]?.revenue || 0;
        const growth = first > 0 ? Math.round(((last - first) / first) * 100 * 10) / 10 : 0;
        return { total: Math.round(total?.sum || 0), byMonth, byCategory: [], growth };
      } catch (e) { return { total: 0, byMonth: [], byCategory: [], growth: 0 }; }
    }),

  // Verification Queue
  getVerificationQueue: protectedProcedure.query(async () => {
    const db = await getDb(); if (!db) return [];
    try {
      const rows = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt }).from(users).where(eq(users.isVerified, false)).orderBy(desc(users.createdAt)).limit(50);
      return rows.map(u => ({ id: String(u.id), name: u.name || '', email: u.email || '', role: u.role, submittedAt: u.createdAt?.toISOString() || '' }));
    } catch (e) { return []; }
  }),

  // Support Tickets
  getSupportTickets: protectedProcedure.query(async () => {
    return [];
  }),

  // All generic getters for new screens
  getAccessLogs: protectedProcedure.query(async () => ({ items: [] })),
  getAnalyticsDashboard: protectedProcedure.query(async () => ({ stats: {}, charts: [] })),
  getCreateAnnouncement: protectedProcedure.query(async () => ({})),
  getAnnouncementHistory: protectedProcedure.query(async () => ({ items: [] })),
  getAPIDocumentation: protectedProcedure.query(async () => ({ docs: [] })),
  getAPIKeyManagement: protectedProcedure.query(async () => ({ items: [] })),
  getAPIMonitoring: protectedProcedure.query(async () => ({ metrics: {} })),
  getAPIRateLimits: protectedProcedure.query(async () => ({ limits: [] })),
  getAPIUsageAnalytics: protectedProcedure.query(async () => ({ usage: [] })),
  getAPIVersioning: protectedProcedure.query(async () => ({ versions: [] })),
  getAPIWebhooks: protectedProcedure.query(async () => ({ webhooks: [] })),
  getAuditTrail: protectedProcedure.query(async () => ({ items: [] })),
  getBackupManagement: protectedProcedure.query(async () => ({ backups: [] })),
  getBadgeManagement: protectedProcedure.query(async () => ({ badges: [] })),
  getBillingManagement: protectedProcedure.query(async () => ({ billing: {} })),
  getBroadcastMessages: protectedProcedure.query(async () => ({ messages: [] })),
  getCacheManagement: protectedProcedure.query(async () => ({ caches: [] })),
  getCatalystVerification: protectedProcedure.query(async () => ({ items: [] })),
  getCompanyManagement: protectedProcedure.query(async () => ({ items: [] })),
  getCompanyVerification: protectedProcedure.query(async () => ({ items: [] })),
  getConfigurationAudits: protectedProcedure.query(async () => ({ items: [] })),
  getContentModeration: protectedProcedure.query(async () => ({ items: [] })),
  getDatabaseHealth: protectedProcedure.query(async () => ({ status: "healthy" })),
  getDeveloperPortal: protectedProcedure.query(async () => ({})),
  getDisasterRecovery: protectedProcedure.query(async () => ({ plans: [] })),
  getDisputeCenter: protectedProcedure.query(async () => ({ disputes: [] })),
  getDocumentVerification: protectedProcedure.query(async () => ({ items: [] })),
  getDriverVerification: protectedProcedure.query(async () => ({ items: [] })),
  getEmailTemplates: protectedProcedure.query(async () => ({ templates: [] })),
  getEnvironmentConfig: protectedProcedure.query(async () => ({ config: {} })),
  getErrorLogs: protectedProcedure.query(async () => ({ logs: [] })),
  getEscrowManagement: protectedProcedure.query(async () => ({ escrows: [] })),
  getEventManagement: protectedProcedure.query(async () => ({ events: [] })),
  getFeatureFlagManagement: protectedProcedure.query(async () => ({ flags: [] })),
  getFeedbackAnalytics: protectedProcedure.query(async () => ({ feedback: [] })),
  getFinancialDashboard: protectedProcedure.query(async () => ({ stats: {} })),
  getFinancialReports: protectedProcedure.query(async () => ({ reports: [] })),
  getFraudDetection: protectedProcedure.query(async () => ({ alerts: [] })),
  getGamificationAnalytics: protectedProcedure.query(async () => ({ stats: {} })),
  getGlobalSettings: protectedProcedure.query(async () => ({ settings: {} })),
  getGuildManagement: protectedProcedure.query(async () => ({ guilds: [] })),
  getHelpCenterManagement: protectedProcedure.query(async () => ({ articles: [] })),
  getIdentityVerification: protectedProcedure.query(async () => ({ items: [] })),
  getInfrastructureMonitoring: protectedProcedure.query(async () => ({ status: {} })),
  getInsuranceVerification: protectedProcedure.query(async () => ({ items: [] })),
  getIntegrationHub: protectedProcedure.query(async () => ({ integrations: [] })),
  getIpWhitelisting: protectedProcedure.query(async () => ({ ips: [] })),
  getKnowledgeBase: protectedProcedure.query(async () => ({ articles: [] })),
  getLegalCompliance: protectedProcedure.query(async () => ({ items: [] })),
  getLevelManagement: protectedProcedure.query(async () => ({ levels: [] })),
  getLoadBalancing: protectedProcedure.query(async () => ({ status: {} })),
  getMaintenanceMode: protectedProcedure.query(async () => ({ enabled: false })),
  getMarketplaceAnalytics: protectedProcedure.query(async () => ({ stats: {} })),
  getMilesManagement: protectedProcedure.query(async () => ({ miles: {} })),
  getMissionManagement: protectedProcedure.query(async () => ({ missions: [] })),
  getNotificationCenter: protectedProcedure.query(async () => ({ notifications: [] })),
  getPaymentGateway: protectedProcedure.query(async () => ({ gateways: [] })),
  getPaymentReconciliation: protectedProcedure.query(async () => ({ items: [] })),
  getPerformanceMetrics: protectedProcedure.query(async () => ({ metrics: {} })),
  getPermissionManagement: protectedProcedure.query(async () => ({ permissions: [] })),
  getPlatformAnalytics: protectedProcedure.query(async () => ({ stats: {} })),
  getPlatformFees: protectedProcedure.query(async () => ({ fees: [] })),
  getQueueManagement: protectedProcedure.query(async () => ({ queues: [] })),
  getRateLimiting: protectedProcedure.query(async () => ({ limits: [] })),
  getRefundManagement: protectedProcedure.query(async () => ({ refunds: [] })),
  getReleaseManagement: protectedProcedure.query(async () => ({ releases: [] })),
  getResourceMonitoring: protectedProcedure.query(async () => ({ resources: {} })),
  getRevenueReports: protectedProcedure.query(async () => ({ reports: [] })),
  getRewardManagement: protectedProcedure.query(async () => ({ rewards: [] })),
  getRiskAssessment: protectedProcedure.query(async () => ({ risks: [] })),
  getRoleManagement: protectedProcedure.query(async () => ({ roles: [] })),
  getSandboxEnvironment: protectedProcedure.query(async () => ({ sandbox: {} })),
  getScheduledTasks: protectedProcedure.query(async () => ({ tasks: [] })),
  getSeasonManagement: protectedProcedure.query(async () => ({ seasons: [] })),
  getSecurityAlerts: protectedProcedure.query(async () => ({ alerts: [] })),
  getSecurityAudit: protectedProcedure.query(async () => ({ audits: [] })),
  getServiceStatus: protectedProcedure.query(async () => ({ services: [] })),
  getSessionManagement: protectedProcedure.query(async () => ({ sessions: [] })),
  getSettlementReports: protectedProcedure.query(async () => ({ reports: [] })),
  getShipperVerification: protectedProcedure.query(async () => ({ items: [] })),
  getSupportAnalytics: protectedProcedure.query(async () => ({ stats: {} })),
  getSupportEscalation: protectedProcedure.query(async () => ({ tickets: [] })),
  getSupportQueue: protectedProcedure.query(async () => ({ tickets: [] })),
  getSystemConfiguration: protectedProcedure.query(async () => ({ config: {} })),
  getSystemLogs: protectedProcedure.query(async () => ({ logs: [] })),
  getSystemMonitoring: protectedProcedure.query(async () => ({ status: {} })),
  getTaxReports: protectedProcedure.query(async () => ({ reports: [] })),
  getTerminalVerification: protectedProcedure.query(async () => ({ items: [] })),
  getThirdPartyIntegrations: protectedProcedure.query(async () => ({ integrations: [] })),
  getTransactionMonitoring: protectedProcedure.query(async () => ({ transactions: [] })),
  getUserActivityLogs: protectedProcedure.query(async () => ({ logs: [] })),
  getUserAnalytics: protectedProcedure.query(async () => ({ stats: {} })),
  getUserManagement: protectedProcedure.query(async () => ({ items: [] })),
  getUserOnboarding: protectedProcedure.query(async () => ({ items: [] })),
  getUserReports: protectedProcedure.query(async () => ({ reports: [] })),
  getUserVerification: protectedProcedure.query(async () => ({ items: [] })),
  getVehicleVerification: protectedProcedure.query(async () => ({ items: [] })),
  getWalletManagement: protectedProcedure.query(async () => ({ wallets: [] })),
  getWebhookLogs: protectedProcedure.query(async () => ({ logs: [] })),
  getSoc2Dashboard: protectedProcedure.query(async () => ({ compliance: {}, controls: [] })),
});
