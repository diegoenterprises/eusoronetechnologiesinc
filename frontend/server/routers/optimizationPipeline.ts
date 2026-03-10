/**
 * MULTI-PASS OPTIMIZATION PIPELINE ROUTER — WS-QP-006
 * Exposes load optimization triggers, run history, pass details, and lane performance
 */

import { z } from "zod";
import { isolatedApprovedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { optimizationRuns, optimizationPassResults, lanePerformanceCache } from "../../drizzle/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { runOptimizationPipeline, updateLaneCache } from "../services/optimizationPipeline";

export const optimizationPipelineRouter = router({

  optimizeLoad: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;

      const result = await runOptimizationPipeline(db, input.loadId, companyId);
      return {
        success: true,
        finalScore: result.finalScore,
        topDrivers: result.candidateDrivers.slice(0, 5).map((d: any) => ({
          id: (d.drivers || d).id,
          name: (d.users || d).name,
          score: d.optimizationScore,
          breakdown: d.scoreBreakdown,
        })),
        rateRange: result.rateRange,
        scheduleWindows: result.scheduleWindows,
        complianceFlags: result.complianceFlags,
      };
    }),

  getRunHistory: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db.select().from(optimizationRuns)
        .where(eq(optimizationRuns.loadId, input.loadId))
        .orderBy(desc(optimizationRuns.startedAt));
    }),

  getPassDetails: protectedProcedure
    .input(z.object({ runId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db.select().from(optimizationPassResults)
        .where(eq(optimizationPassResults.runId, input.runId))
        .orderBy(optimizationPassResults.passNumber);
    }),

  getLanePerformance: protectedProcedure
    .input(z.object({
      originState: z.string().optional(),
      destState: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      if (input?.originState && input?.destState) {
        const [rows]: any = await db.execute(sql`
          SELECT * FROM lane_performance_cache
          WHERE originState = ${input.originState}
          AND destState = ${input.destState}
          ORDER BY volumeLast30Days DESC
        `);
        return Array.isArray(rows) ? rows : [];
      }

      // Return top lanes by volume
      const [rows]: any = await db.execute(sql`
        SELECT * FROM lane_performance_cache
        ORDER BY volumeLast30Days DESC
        LIMIT 50
      `);
      return Array.isArray(rows) ? rows : [];
    }),

  refreshLaneCache: protectedProcedure
    .mutation(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await updateLaneCache(db);
      return { success: true };
    }),
});
