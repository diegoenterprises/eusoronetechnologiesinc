/**
 * HRRN DISPATCH SCHEDULER ROUTER — WS-QP-001
 * Exposes HRRN queue status, manual enqueue, and starvation warnings
 */

import { z } from "zod";
import { isolatedApprovedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { dispatchQueuePriorities, loads } from "../../drizzle/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import {
  calculateHrrnScore, recalculateAllPriorities, enqueueLoad,
  markAssigned, getStarvationWarnings,
} from "../services/hrrnScheduler";

export const hrrnSchedulerRouter = router({

  getQueueStatus: protectedProcedure
    .input(z.object({ date: z.string().optional() }).optional())
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { queue: [], stats: { total: 0, avgWait: 0, starvationCount: 0 } };
      const companyId = Number((ctx.user as any)?.companyId) || 0;
      if (!companyId) return { queue: [], stats: { total: 0, avgWait: 0, starvationCount: 0 } };

      const [rows]: any = await db.execute(sql`
        SELECT dqp.*, l.loadNumber, l.originCity, l.originState,
          l.destinationCity, l.destinationState, l.rate, l.hazmatClass,
          TIMESTAMPDIFF(MINUTE, dqp.enteredQueueAt, NOW()) as waitMinutes
        FROM dispatch_queue_priorities dqp
        LEFT JOIN loads l ON dqp.loadId = l.id
        WHERE dqp.companyId = ${companyId} AND dqp.status = 'queued'
        ORDER BY dqp.currentHrrnScore DESC
      `);

      const queue = Array.isArray(rows) ? rows : [];
      const totalWait = queue.reduce((s: number, r: any) => s + (r.waitMinutes || 0), 0);
      const starvationCount = queue.filter((r: any) => (r.waitMinutes || 0) >= 240).length;

      return {
        queue,
        stats: {
          total: queue.length,
          avgWait: queue.length > 0 ? Math.round(totalWait / queue.length) : 0,
          starvationCount,
        },
      };
    }),

  enqueue: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      const [load] = await db.select().from(loads).where(eq(loads.id, input.loadId)).limit(1);
      if (!load) throw new Error("Load not found");

      await enqueueLoad(db, load, companyId);
      return { success: true, loadId: input.loadId };
    }),

  recalculate: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      const updated = await recalculateAllPriorities(db, companyId);
      return { success: true, updatedCount: updated };
    }),

  getStarvationWarnings: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const companyId = Number((ctx.user as any)?.companyId) || 0;
      return getStarvationWarnings(db, companyId);
    }),

  markAssigned: protectedProcedure
    .input(z.object({ loadId: z.number(), driverId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await markAssigned(db, input.loadId, input.driverId);
      return { success: true };
    }),
});
