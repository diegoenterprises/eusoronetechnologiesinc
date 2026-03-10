/**
 * RESOURCE PRE-ANALYSIS ROUTER — WS-QP-002
 * Exposes load feasibility analysis, capacity dashboard, and gap summary
 */

import { z } from "zod";
import { isolatedApprovedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { resourcePreanalysis, resourceCapacitySnapshot } from "../../drizzle/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { analyzeLoadFeasibility, captureResourceSnapshot, storeVerdict } from "../services/resourcePreAnalysis";

export const resourcePreAnalysisRouter = router({

  analyzeLoad: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;

      const verdict = await analyzeLoadFeasibility(db, input.loadId, companyId);
      await storeVerdict(db, input.loadId, companyId, verdict);
      return verdict;
    }),

  getDashboard: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { canDispatch: [], partialMatch: [], cannotDispatch: [] };
      const companyId = Number(ctx.user!.companyId) || 0;

      const [rows]: any = await db.execute(sql`
        SELECT rpa.*, l.loadNumber, l.originCity, l.originState,
          l.destinationCity, l.destinationState, l.hazmatClass
        FROM resource_preanalysis rpa
        LEFT JOIN loads l ON rpa.loadId = l.id
        WHERE rpa.companyId = ${companyId}
        AND rpa.expiresAt > NOW()
        ORDER BY rpa.analyzedAt DESC
      `);

      const all = Array.isArray(rows) ? rows : [];
      return {
        canDispatch: all.filter((r: any) => r.verdict === "can_dispatch"),
        partialMatch: all.filter((r: any) => r.verdict === "partial_match"),
        cannotDispatch: all.filter((r: any) => r.verdict === "cannot_dispatch"),
      };
    }),

  getCapacityTrend: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const companyId = Number(ctx.user!.companyId) || 0;

      const [rows]: any = await db.execute(sql`
        SELECT * FROM resource_capacity_snapshot
        WHERE companyId = ${companyId}
        AND snapshotAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ORDER BY snapshotAt ASC
      `);
      return Array.isArray(rows) ? rows : [];
    }),

  getGapSummary: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { gaps: [], suggestions: [] };
      const companyId = Number(ctx.user!.companyId) || 0;

      const [rows]: any = await db.execute(sql`
        SELECT gapAnalysis FROM resource_preanalysis
        WHERE companyId = ${companyId} AND expiresAt > NOW()
        AND verdict IN ('partial_match', 'cannot_dispatch')
      `);

      const allGaps: string[] = [];
      const allSuggestions: string[] = [];
      if (Array.isArray(rows)) {
        for (const row of rows) {
          try {
            const gap = typeof row.gapAnalysis === "string" ? JSON.parse(row.gapAnalysis) : row.gapAnalysis;
            if (gap?.missingCapabilities) allGaps.push(...gap.missingCapabilities);
            if (gap?.suggestions) allSuggestions.push(...gap.suggestions);
          } catch {}
        }
      }

      return {
        gaps: Array.from(new Set(allGaps)),
        suggestions: Array.from(new Set(allSuggestions)),
      };
    }),

  captureSnapshot: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;
      await captureResourceSnapshot(db, companyId);
      return { success: true };
    }),
});
