/**
 * LIGHTSPEED ROUTER — tRPC endpoints for the acceleration stack
 * ═══════════════════════════════════════════════════════════════
 *
 * Exposes:
 * - Typeahead search (Google Places-style, <30ms per keystroke)
 * - Carrier profile from materialized view (1 query instead of 7)
 * - Pre-computation pipeline controls
 * - Cache diagnostics
 *
 * Part of Project LIGHTSPEED — Phase 1
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getPool } from "../db";
import {
  cacheGet,
  cacheSet,
  cacheThrough,
  cacheMGet,
  getCacheStats,
  invalidateCarrier,
  flushAllCache,
} from "../services/cache/redisCache";
import {
  getCarrierFromMV,
  batchGetFromMV,
  searchMV,
  isMVReady,
  refreshMaterializedView,
} from "../services/lightspeed/materializedViews";
import {
  runPreComputePipeline,
  getLastPipelineRun,
  isPipelineRunning,
} from "../services/lightspeed/preCompute";

export const lightspeedRouter = router({

  // ═══════════════════════════════════════════════════════════
  // TYPEAHEAD SEARCH — Google Places-style instant results
  // ═══════════════════════════════════════════════════════════

  typeahead: publicProcedure
    .input(z.object({
      query: z.string().min(1).max(100),
      limit: z.number().min(1).max(25).default(10),
    }))
    .query(async ({ input }) => {
      const { query, limit } = input;
      const trimmed = query.trim().toLowerCase();
      if (trimmed.length < 1) return { results: [], source: "empty" as const, ms: 0 };

      const start = Date.now();

      // Redis typeahead cache — sub-1ms for repeated keystrokes (SEARCH tier, 60s TTL)
      const cacheKey = `ta:${trimmed}:${limit}`;
      const cached = await cacheGet<{ results: any[]; source: string }>("SEARCH", cacheKey);
      if (cached) {
        return { ...cached, source: "redis" as const, ms: Date.now() - start };
      }

      // Try materialized view first (FULLTEXT indexed, sub-5ms)
      const mvResults = await searchMV(trimmed, limit);
      if (mvResults.length > 0) {
        const mvPayload = {
          results: mvResults.map(r => ({
            dotNumber: r.dotNumber,
            legalName: r.legalName,
            dbaName: r.dbaName,
            mcNumber: r.mcNumber,
            state: r.phyState,
            riskTier: r.riskTier,
            riskScore: r.riskScore,
            hasActiveOos: r.hasActiveOos,
            isBlocked: r.isBlocked,
            authorityStatus: r.authorityStatus,
            nbrPowerUnit: r.nbrPowerUnit,
          })),
          source: "mv" as const,
        };
        cacheSet("SEARCH", cacheKey, mvPayload, 60).catch(() => {});
        return { ...mvPayload, ms: Date.now() - start };
      }

      // Fallback: direct FULLTEXT on fmcsa_census (slower but always available)
      const pool = getPool();
      if (!pool) return { results: [], source: "unavailable" as const, ms: 0 };

      try {
        const isNumeric = /^\d+$/.test(trimmed);
        const isMC = /^mc[#\s-]*\d+/i.test(trimmed);

        let rows: any[];
        if (isNumeric) {
          [rows] = await pool.query(
            `SELECT dot_number, legal_name, dba_name, phy_state, nbr_power_unit
             FROM fmcsa_census WHERE dot_number LIKE ? AND nbr_power_unit > 0
             ORDER BY nbr_power_unit DESC LIMIT ?`,
            [`${trimmed}%`, limit]
          ) as any;
        } else if (isMC) {
          const mcNum = trimmed.replace(/^mc[#\s-]*/i, "");
          [rows] = await pool.query(
            `SELECT c.dot_number, c.legal_name, c.dba_name, c.phy_state, c.nbr_power_unit
             FROM fmcsa_authority a JOIN fmcsa_census c ON a.dot_number = c.dot_number
             WHERE a.docket_number LIKE ? AND c.nbr_power_unit > 0
             ORDER BY c.nbr_power_unit DESC LIMIT ?`,
            [`%${mcNum}%`, limit]
          ) as any;
        } else {
          const ftQuery = trimmed.split(/\s+/).map(w => `+${w}*`).join(" ");
          [rows] = await pool.query(
            `SELECT dot_number, legal_name, dba_name, phy_state, nbr_power_unit,
                    MATCH(legal_name, dba_name) AGAINST(? IN BOOLEAN MODE) AS score
             FROM fmcsa_census
             WHERE MATCH(legal_name, dba_name) AGAINST(? IN BOOLEAN MODE) AND nbr_power_unit > 0
             ORDER BY score DESC LIMIT ?`,
            [ftQuery, ftQuery, limit]
          ) as any;
        }

        const censusPayload = {
          results: (rows || []).map((r: any) => ({
            dotNumber: String(r.dot_number),
            legalName: r.legal_name || "Unknown",
            dbaName: r.dba_name || null,
            mcNumber: null,
            state: r.phy_state || null,
            riskTier: "UNKNOWN" as const,
            riskScore: 0,
            hasActiveOos: false,
            isBlocked: false,
            authorityStatus: null,
            nbrPowerUnit: r.nbr_power_unit || 0,
          })),
          source: "census" as const,
        };
        cacheSet("SEARCH", cacheKey, censusPayload, 60).catch(() => {});
        return { ...censusPayload, ms: Date.now() - start };
      } catch (err: any) {
        console.warn("[LIGHTSPEED] Typeahead fallback error:", err.message?.slice(0, 100));
        return { results: [], source: "error" as const, ms: Date.now() - start };
      }
    }),

  // ═══════════════════════════════════════════════════════════
  // CARRIER PROFILE — Single-row from materialized view
  // ═══════════════════════════════════════════════════════════

  carrierProfile: publicProcedure
    .input(z.object({ dotNumber: z.string().min(1).max(20) }))
    .query(async ({ input }) => {
      const start = Date.now();

      // Try LIGHTSPEED cache first (sub-1ms)
      const cached = await cacheGet<any>("WARM", `profile:${input.dotNumber}`);
      if (cached) {
        return { ...cached, _source: "cache" as const, _ms: Date.now() - start };
      }

      // Try materialized view (1 query, 2-5ms)
      const mv = await getCarrierFromMV(input.dotNumber);
      if (mv) {
        // Cache for 15 min
        cacheSet("WARM", `profile:${input.dotNumber}`, mv, 900).catch(() => {});
        return { ...mv, _source: "mv" as const, _ms: Date.now() - start };
      }

      // No MV data — return null (caller should fall back to legacy 7-query path)
      return null;
    }),

  // ═══════════════════════════════════════════════════════════
  // RISK SCORE — Pre-computed, cached, sub-1ms
  // ═══════════════════════════════════════════════════════════

  riskScore: publicProcedure
    .input(z.object({ dotNumber: z.string().min(1).max(20) }))
    .query(async ({ input }) => {
      // Try HOT cache (pre-computed by pipeline)
      const cached = await cacheGet<{ score: number; tier: string }>("HOT", `risk:${input.dotNumber}`);
      if (cached) return { ...cached, source: "cache" as const };

      // Fallback to MV
      const mv = await getCarrierFromMV(input.dotNumber);
      if (mv) {
        const result = { score: mv.riskScore, tier: mv.riskTier };
        cacheSet("HOT", `risk:${input.dotNumber}`, result, 3600).catch(() => {});
        return { ...result, source: "mv" as const };
      }

      return { score: 0, tier: "UNKNOWN", source: "miss" as const };
    }),

  // ═══════════════════════════════════════════════════════════
  // BATCH RISK SCORES — For enriching lists
  // ═══════════════════════════════════════════════════════════

  batchRiskScores: publicProcedure
    .input(z.object({ dotNumbers: z.array(z.string()).max(50) }))
    .query(async ({ input }) => {
      const cacheKeys = input.dotNumbers.map(d => `risk:${d}`);
      const cached = await cacheMGet<{ score: number; tier: string }>("HOT", cacheKeys);

      const result: Record<string, { score: number; tier: string }> = {};
      const misses: string[] = [];

      for (const dot of input.dotNumbers) {
        const c = cached.get(`risk:${dot}`);
        if (c) {
          result[dot] = c;
        } else {
          misses.push(dot);
        }
      }

      // Batch-fill misses from MV
      if (misses.length > 0) {
        const mvResults = await batchGetFromMV(misses);
        Array.from(mvResults.entries()).forEach(([dot, mv]) => {
          result[dot] = { score: mv.riskScore, tier: mv.riskTier };
        });
      }

      return result;
    }),

  // ═══════════════════════════════════════════════════════════
  // DASHBOARD KPIs — Pre-aggregated
  // ═══════════════════════════════════════════════════════════

  dashboardKPIs: publicProcedure.query(async () => {
    return await cacheThrough("AGGREGATE", "carrier_kpis", async () => {
      const pool = getPool();
      if (!pool) return null;

      try {
        const [rows]: any = await pool.query(`
          SELECT
            COUNT(*) as totalCarriers,
            SUM(IF(has_active_insurance = 1, 1, 0)) as insuredCarriers,
            SUM(IF(has_active_oos = 1, 1, 0)) as oosCarriers,
            SUM(IF(risk_tier = 'LOW', 1, 0)) as lowRisk,
            SUM(IF(risk_tier = 'MODERATE', 1, 0)) as moderateRisk,
            SUM(IF(risk_tier = 'HIGH', 1, 0)) as highRisk,
            SUM(IF(risk_tier = 'CRITICAL', 1, 0)) as criticalRisk,
            AVG(risk_score) as avgRiskScore,
            SUM(IF(hm_flag = 'Y', 1, 0)) as hazmatCarriers
          FROM carrier_intelligence_mv
        `);
        return rows[0] || null;
      } catch {
        return null;
      }
    }, 300);
  }),

  // ═══════════════════════════════════════════════════════════
  // PIPELINE CONTROLS — Admin operations
  // ═══════════════════════════════════════════════════════════

  refreshMV: protectedProcedure.mutation(async () => {
    const result = await refreshMaterializedView();
    return result;
  }),

  runPipeline: protectedProcedure.mutation(async () => {
    if (isPipelineRunning()) {
      return { success: false, message: "Pipeline already running" };
    }
    // Fire-and-forget — pipeline runs in background
    runPreComputePipeline().catch(console.error);
    return { success: true, message: "Pipeline started" };
  }),

  pipelineStatus: publicProcedure.query(async () => {
    const mvStatus = await isMVReady();
    const cacheStats = await getCacheStats();
    const lastRun = getLastPipelineRun();

    return {
      mvReady: mvStatus.exists,
      mvRowCount: mvStatus.rowCount,
      cache: cacheStats,
      pipeline: {
        running: isPipelineRunning(),
        lastRun: lastRun ? {
          success: lastRun.success,
          totalDurationMs: lastRun.totalDurationMs,
          steps: lastRun.steps.map(s => ({ name: s.name, success: s.success, durationMs: s.durationMs, detail: s.detail })),
        } : null,
      },
    };
  }),

  invalidateCarrier: protectedProcedure
    .input(z.object({ dotNumber: z.string() }))
    .mutation(async ({ input }) => {
      await invalidateCarrier(input.dotNumber);
      return { success: true };
    }),

  flushCache: protectedProcedure.mutation(async () => {
    await flushAllCache();
    return { success: true };
  }),

  // ═══════════════════════════════════════════════════════════
  // LIGHTSPEED DIAGNOSTICS — Full cache performance overview
  // ═══════════════════════════════════════════════════════════

  diagnostics: protectedProcedure.query(async () => {
    const cacheStats = await getCacheStats();
    const mvStatus = await isMVReady();
    const lastRun = getLastPipelineRun();

    let expressStats = { hits: 0, misses: 0, bypassed: 0, total: 0, hitRate: 0, label: "not loaded" };
    try {
      const { getLightspeedStats } = await import("../middleware/lightspeedExpressCache");
      expressStats = getLightspeedStats();
    } catch {}

    return {
      expressCache: expressStats,
      redisCache: cacheStats,
      materializedView: { ready: mvStatus.exists, rowCount: mvStatus.rowCount },
      pipeline: {
        running: isPipelineRunning(),
        lastRun: lastRun ? {
          success: lastRun.success,
          totalDurationMs: lastRun.totalDurationMs,
        } : null,
      },
      timestamp: new Date().toISOString(),
    };
  }),
});
