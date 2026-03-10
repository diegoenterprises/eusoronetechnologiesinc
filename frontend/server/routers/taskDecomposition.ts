/**
 * TASK DECOMPOSITION ROUTER — WS-QP-003
 * Exposes load analysis pipeline triggers and status queries
 */

import { z } from "zod";
import { isolatedApprovedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loadAnalysisTasks, loadAnalysisResults } from "../../drizzle/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { decomposeAndExecute } from "../services/taskDecomposition";

export const taskDecompositionRouter = router({

  analyzeLoad: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;

      const report = await decomposeAndExecute(db, input.loadId, companyId);
      return { success: true, report };
    }),

  getAnalysisStatus: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { tasks: [], summary: null };

      const tasks = await db.select().from(loadAnalysisTasks)
        .where(eq(loadAnalysisTasks.loadId, input.loadId))
        .orderBy(loadAnalysisTasks.priority);

      const completed = tasks.filter(t => t.status === "completed").length;
      const failed = tasks.filter(t => t.status === "failed").length;
      const totalMs = tasks.reduce((s, t) => s + (t.durationMs || 0), 0);

      return {
        tasks,
        summary: {
          total: tasks.length,
          completed,
          failed,
          skipped: tasks.filter(t => t.status === "skipped").length,
          pending: tasks.filter(t => t.status === "pending" || t.status === "running").length,
          totalDurationMs: totalMs,
        },
      };
    }),

  getAnalysisResult: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [result] = await db.select().from(loadAnalysisResults)
        .where(eq(loadAnalysisResults.loadId, input.loadId))
        .limit(1);
      return result || null;
    }),
});
