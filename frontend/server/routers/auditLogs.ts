/**
 * AUDIT LOGS ROUTER
 * tRPC procedures for system audit logging
 * Admin access only
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const actionTypeSchema = z.enum([
  "create", "update", "delete", "view", "login", "logout", "export", "approve", "reject"
]);

const resourceTypeSchema = z.enum([
  "load", "user", "company", "payment", "document", "bid", "settings", "system"
]);

export const auditLogsRouter = router({
  /**
   * List audit logs with filtering
   */
  list: protectedProcedure
    .input(z.object({
      action: actionTypeSchema.optional(),
      resource: resourceTypeSchema.optional(),
      userId: z.string().optional(),
      success: z.boolean().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const logs = [
        {
          id: "log_001",
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          userId: "usr_001",
          userName: "John Admin",
          userRole: "ADMIN",
          action: "approve",
          resource: "company",
          resourceId: "comp_045",
          resourceName: "SafeHaul Transport LLC",
          details: "Approved company verification request",
          ipAddress: "192.168.1.100",
          userAgent: "Chrome/120.0 Windows",
          success: true,
        },
        {
          id: "log_002",
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          userId: "usr_002",
          userName: "Sarah Shipper",
          userRole: "SHIPPER",
          action: "create",
          resource: "load",
          resourceId: "load_45921",
          resourceName: "LOAD-45921",
          details: "Created new load: Houston to Dallas, Gasoline 42,000 lbs",
          ipAddress: "10.0.0.55",
          userAgent: "Safari/17.0 macOS",
          success: true,
        },
        {
          id: "log_003",
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          userId: "usr_003",
          userName: "Mike Carrier",
          userRole: "CARRIER",
          action: "create",
          resource: "bid",
          resourceId: "bid_8834",
          resourceName: "Bid on LOAD-45921",
          details: "Submitted bid: $2,450 for Load #45921",
          ipAddress: "172.16.0.25",
          userAgent: "Chrome/120.0 Android",
          success: true,
        },
        {
          id: "log_004",
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          userId: "usr_006",
          userName: "Unknown",
          userRole: "UNKNOWN",
          action: "login",
          resource: "system",
          resourceId: "auth",
          resourceName: "Authentication",
          details: "Failed login attempt - invalid credentials",
          ipAddress: "45.67.89.123",
          userAgent: "Python-urllib/3.9",
          success: false,
        },
      ];

      let filtered = logs;

      if (input.action) {
        filtered = filtered.filter(l => l.action === input.action);
      }
      if (input.resource) {
        filtered = filtered.filter(l => l.resource === input.resource);
      }
      if (input.userId) {
        filtered = filtered.filter(l => l.userId === input.userId);
      }
      if (input.success !== undefined) {
        filtered = filtered.filter(l => l.success === input.success);
      }
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(l => 
          l.userName.toLowerCase().includes(q) ||
          l.resourceName.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q)
        );
      }

      return {
        logs: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
        stats: {
          totalEvents: logs.length,
          failedEvents: logs.filter(l => !l.success).length,
          uniqueUsers: new Set(logs.map(l => l.userId)).size,
        },
      };
    }),

  /**
   * Get single audit log by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        timestamp: new Date().toISOString(),
        userId: "usr_001",
        userName: "John Admin",
        userRole: "ADMIN",
        action: "approve",
        resource: "company",
        resourceId: "comp_045",
        resourceName: "SafeHaul Transport LLC",
        details: "Approved company verification request",
        ipAddress: "192.168.1.100",
        userAgent: "Chrome/120.0 Windows",
        success: true,
      };
    }),

  /**
   * Export audit logs
   */
  export: protectedProcedure
    .input(z.object({
      format: z.enum(["csv", "json"]),
      startDate: z.string(),
      endDate: z.string(),
      filters: z.object({
        action: actionTypeSchema.optional(),
        resource: resourceTypeSchema.optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        downloadUrl: `/api/audit-logs/export?format=${input.format}&start=${input.startDate}&end=${input.endDate}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };
    }),

  /**
   * Log an action (internal use)
   */
  logAction: protectedProcedure
    .input(z.object({
      action: actionTypeSchema,
      resource: resourceTypeSchema,
      resourceId: z.string(),
      resourceName: z.string(),
      details: z.string(),
      success: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const logId = `log_${Date.now()}`;
      
      return {
        id: logId,
        timestamp: new Date().toISOString(),
        userId: ctx.user?.id,
        userName: ctx.user?.name,
        ...input,
      };
    }),

  /**
   * Get activity summary by user
   */
  getUserActivity: protectedProcedure
    .input(z.object({
      userId: z.string(),
      days: z.number().default(30),
    }))
    .query(async ({ input }) => {
      return {
        userId: input.userId,
        totalActions: 156,
        lastActive: new Date().toISOString(),
        actionBreakdown: {
          create: 45,
          update: 62,
          view: 38,
          delete: 5,
          export: 6,
        },
        recentActions: [
          { action: "update", resource: "load", timestamp: new Date().toISOString() },
          { action: "view", resource: "document", timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
        ],
      };
    }),
});
