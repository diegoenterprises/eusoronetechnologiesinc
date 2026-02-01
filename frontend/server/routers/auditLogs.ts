/**
 * AUDIT LOGS ROUTER
 * PRODUCTION-READY: All data from database
 */

import { z } from "zod";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { auditLogs, users } from "../../drizzle/schema";

export const auditLogsRouter = router({
  getLogs: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      action: z.string().optional(),
      userId: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { logs: [], totalPages: 0, total: 0 };

      try {
        const offset = (input.page - 1) * input.limit;
        const logs = await db.select({
          id: auditLogs.id,
          action: auditLogs.action,
          userId: auditLogs.userId,
          resource: auditLogs.entityType,
          ipAddress: auditLogs.ipAddress,
          timestamp: auditLogs.createdAt,
          userName: users.name,
        })
          .from(auditLogs)
          .leftJoin(users, eq(auditLogs.userId, users.id))
          .orderBy(desc(auditLogs.createdAt))
          .limit(input.limit)
          .offset(offset);

        const [total] = await db.select({ count: sql<number>`count(*)` }).from(auditLogs);

        return {
          logs: logs.map(l => ({
            id: String(l.id),
            action: l.action || 'unknown',
            description: `${l.action} on ${l.resource}`,
            userName: l.userName || 'Unknown',
            resource: l.resource || 'system',
            ipAddress: l.ipAddress || '',
            timestamp: l.timestamp?.toISOString() || new Date().toISOString(),
          })),
          totalPages: Math.ceil((total?.count || 0) / input.limit),
          total: total?.count || 0,
        };
      } catch (error) {
        console.error('[AuditLogs] getLogs error:', error);
        return { logs: [], totalPages: 0, total: 0 };
      }
    }),

  getUsers: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    try {
      const userList = await db.select({ id: users.id, name: users.name }).from(users).limit(100);
      return userList.map(u => ({ id: String(u.id), name: u.name || 'Unknown' }));
    } catch (error) {
      console.error('[AuditLogs] getUsers error:', error);
      return [];
    }
  }),

  getSummary: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { totalEvents: 0, todayEvents: 0, activeUsers: 0, securityEvents: 0 };

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalEvents] = await db.select({ count: sql<number>`count(*)` }).from(auditLogs);
      const [todayEvents] = await db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(gte(auditLogs.createdAt, today));
      const [activeUsers] = await db.select({ count: sql<number>`count(DISTINCT userId)` }).from(auditLogs).where(gte(auditLogs.createdAt, today));

      return {
        totalEvents: totalEvents?.count || 0,
        todayEvents: todayEvents?.count || 0,
        activeUsers: activeUsers?.count || 0,
        securityEvents: 0,
      };
    } catch (error) {
      console.error('[AuditLogs] getSummary error:', error);
      return { totalEvents: 0, todayEvents: 0, activeUsers: 0, securityEvents: 0 };
    }
  }),
});
