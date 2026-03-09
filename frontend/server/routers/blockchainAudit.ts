// GAP-444: Blockchain Audit Trail — tRPC Router
import { router, protectedProcedure, roleProcedure } from "../_core/trpc";
import { z } from "zod";
import { BlockchainService } from "../services/BlockchainService";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

const superAdminProcedure = roleProcedure("SUPER_ADMIN");

export const blockchainAuditRouter = router({
  // Log an event (called internally from other routers)
  logEvent: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      eventType: z.string(),
      eventData: z.record(z.string(), z.any()),
    }))
    .mutation(async ({ input }) => {
      await BlockchainService.logEvent(input.loadId, input.eventType, input.eventData);
      return { success: true };
    }),

  // Verify chain integrity for a load
  verifyChain: superAdminProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => {
      return await BlockchainService.verifyChain(input.loadId);
    }),

  // Get compliance report for a load
  getComplianceReport: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => {
      return await BlockchainService.generateComplianceReport(input.loadId);
    }),

  // Get audit trail for a load
  getTrail: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const [rows] = await db.execute(
        sql`SELECT id, loadId, eventType, eventData, blockHash, previousBlockHash, timestamp FROM blockchain_audit_trail WHERE loadId = ${input.loadId} ORDER BY id ASC`
      ) as any;
      return (rows || []).map((r: any) => ({
        ...r,
        eventData: typeof r.eventData === "string" ? JSON.parse(r.eventData) : r.eventData,
      }));
    }),

  // Get recent audit events across all loads (admin view)
  getRecentEvents: superAdminProcedure
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const limit = input?.limit || 50;
      const [rows] = await db.execute(
        sql`SELECT id, loadId, eventType, blockHash, timestamp FROM blockchain_audit_trail ORDER BY id DESC LIMIT ${limit}`
      ) as any;
      return rows || [];
    }),

  // Get statistics
  getStats: superAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { totalBlocks: 0, totalLoads: 0, recentEvents: 0 };
    const [stats] = await db.execute(
      sql`SELECT COUNT(*) as totalBlocks, COUNT(DISTINCT loadId) as totalLoads, SUM(CASE WHEN timestamp > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as recentEvents FROM blockchain_audit_trail`
    ) as any;
    const s = stats?.[0] || {};
    return { totalBlocks: Number(s.totalBlocks || 0), totalLoads: Number(s.totalLoads || 0), recentEvents: Number(s.recentEvents || 0) };
  }),
});
