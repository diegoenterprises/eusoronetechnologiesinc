/**
 * LIGHTSPEED — Post-ETL Pre-Computation Pipeline
 * ═══════════════════════════════════════════════════════════════
 *
 * Runs after daily ETL completion to pre-warm all caches:
 *   Step 1: Refresh carrier_intelligence_mv (3-5 min)
 *   Step 2: Pre-compute risk scores → cache HOT tier
 *   Step 3: Pre-compute eligibility scores → cache HOT tier
 *   Step 4: Build search index in cache
 *   Step 5: Pre-aggregate dashboard KPIs → cache AGGREGATE tier
 *   Step 6: Publish invalidation events
 *   Step 7: Push WebSocket 'data:refreshed' to connected clients
 *
 * Total pipeline: ~8-10 minutes after ETL
 * Result: By the time any user checks, data is already cached.
 *
 * Part of Project LIGHTSPEED — Phase 1
 */

import { getPool } from "../../db";
import { cacheSet, cacheMSet, cacheInvalidate, publishInvalidation, getCacheStats } from "../cache/redisCache";
import { refreshMaterializedView, isMVReady } from "./materializedViews";
import { getIO } from "../socketService";

// ============================================================================
// PIPELINE ORCHESTRATOR
// ============================================================================

export interface PipelineResult {
  success: boolean;
  steps: StepResult[];
  totalDurationMs: number;
}

interface StepResult {
  name: string;
  success: boolean;
  durationMs: number;
  detail?: string;
}

let _pipelineRunning = false;
let _lastRun: PipelineResult | null = null;

/**
 * Run the full post-ETL pre-computation pipeline.
 * Safe to call multiple times — guards against concurrent runs.
 */
export async function runPreComputePipeline(): Promise<PipelineResult> {
  if (_pipelineRunning) {
    console.log("[LIGHTSPEED Pipeline] Already running, skipping");
    return { success: false, steps: [], totalDurationMs: 0 };
  }

  _pipelineRunning = true;
  const pipelineStart = Date.now();
  const steps: StepResult[] = [];
  console.log("[LIGHTSPEED Pipeline] ═══════════════════════════════════════");
  console.log("[LIGHTSPEED Pipeline] Starting post-ETL pre-computation...");

  try {
    // Step 1: Refresh materialized view
    steps.push(await runStep("Refresh Materialized View", async () => {
      const result = await refreshMaterializedView();
      return `${result.rowCount.toLocaleString()} carriers in ${(result.durationMs / 1000).toFixed(1)}s`;
    }));

    // Step 2: Pre-cache risk scores for top carriers (most active)
    steps.push(await runStep("Pre-cache Risk Scores", async () => {
      const count = await preCacheRiskScores();
      return `${count.toLocaleString()} risk scores cached`;
    }));

    // Step 3: Pre-cache eligibility scores
    steps.push(await runStep("Pre-cache Eligibility Scores", async () => {
      const count = await preCacheEligibilityScores();
      return `${count.toLocaleString()} eligibility scores cached`;
    }));

    // Step 4: Build search index
    steps.push(await runStep("Build Search Index", async () => {
      const count = await buildSearchIndex();
      return `${count.toLocaleString()} search entries indexed`;
    }));

    // Step 5: Pre-aggregate dashboard KPIs
    steps.push(await runStep("Pre-aggregate Dashboard KPIs", async () => {
      await preAggregateDashboardKPIs();
      return "KPIs cached";
    }));

    // Step 6: Publish invalidation events
    steps.push(await runStep("Publish Invalidations", async () => {
      await publishInvalidation("etl", "complete");
      await cacheInvalidate("WARM", "*");
      return "All warm caches invalidated";
    }));

    // Step 7: Notify connected clients via WebSocket
    steps.push(await runStep("WebSocket Notification", async () => {
      const io = getIO();
      if (io) {
        io.emit("data:refreshed", { timestamp: new Date().toISOString(), source: "etl" });
        return "Pushed to all connected clients";
      }
      return "No WebSocket server (skipped)";
    }));

  } finally {
    _pipelineRunning = false;
  }

  const totalDurationMs = Date.now() - pipelineStart;
  const successCount = steps.filter(s => s.success).length;
  const result: PipelineResult = { success: successCount === steps.length, steps, totalDurationMs };
  _lastRun = result;

  console.log(`[LIGHTSPEED Pipeline] ✓ Complete: ${successCount}/${steps.length} steps in ${(totalDurationMs / 1000).toFixed(1)}s`);
  console.log("[LIGHTSPEED Pipeline] ═══════════════════════════════════════");

  return result;
}

/**
 * Get the result of the last pipeline run.
 */
export function getLastPipelineRun(): PipelineResult | null {
  return _lastRun;
}

export function isPipelineRunning(): boolean {
  return _pipelineRunning;
}

// ============================================================================
// INDIVIDUAL PIPELINE STEPS
// ============================================================================

async function runStep(name: string, fn: () => Promise<string>): Promise<StepResult> {
  const start = Date.now();
  try {
    const detail = await fn();
    const durationMs = Date.now() - start;
    console.log(`[LIGHTSPEED Pipeline] ✓ ${name}: ${detail} (${(durationMs / 1000).toFixed(1)}s)`);
    return { name, success: true, durationMs, detail };
  } catch (err: any) {
    const durationMs = Date.now() - start;
    console.error(`[LIGHTSPEED Pipeline] ✗ ${name}: ${err.message?.slice(0, 150)}`);
    return { name, success: false, durationMs, detail: err.message?.slice(0, 150) };
  }
}

/**
 * Pre-cache risk scores from the materialized view into HOT tier.
 * Batches 1000 at a time using cache pipeline.
 */
async function preCacheRiskScores(): Promise<number> {
  const pool = getPool();
  if (!pool) return 0;

  const mvReady = await isMVReady();
  if (!mvReady.exists) return 0;

  let total = 0;
  let offset = 0;
  const batchSize = 5000;

  while (true) {
    const [rows]: any = await pool.query(
      `SELECT dot_number, risk_score, risk_tier FROM carrier_intelligence_mv
       WHERE nbr_power_unit > 0 LIMIT ? OFFSET ?`,
      [batchSize, offset]
    );
    if (!rows?.length) break;

    const entries = rows.map((r: any) => ({
      key: `risk:${r.dot_number}`,
      value: { score: r.risk_score, tier: r.risk_tier },
    }));
    await cacheMSet("HOT", entries, 3600);

    total += rows.length;
    offset += batchSize;

    if (rows.length < batchSize) break;
  }

  return total;
}

/**
 * Pre-cache eligibility scores from the materialized view into HOT tier.
 */
async function preCacheEligibilityScores(): Promise<number> {
  const pool = getPool();
  if (!pool) return 0;

  const mvReady = await isMVReady();
  if (!mvReady.exists) return 0;

  let total = 0;
  let offset = 0;
  const batchSize = 5000;

  while (true) {
    const [rows]: any = await pool.query(
      `SELECT dot_number, eligibility_score, is_blocked, blocked_reasons FROM carrier_intelligence_mv
       WHERE nbr_power_unit > 0 LIMIT ? OFFSET ?`,
      [batchSize, offset]
    );
    if (!rows?.length) break;

    const entries = rows.map((r: any) => {
      let reasons: string[] = [];
      try { reasons = JSON.parse(r.blocked_reasons || "[]").filter(Boolean); } catch {}
      return {
        key: `eligibility:${r.dot_number}`,
        value: { score: r.eligibility_score, blocked: !!r.is_blocked, reasons },
      };
    });
    await cacheMSet("HOT", entries, 3600);

    total += rows.length;
    offset += batchSize;
    if (rows.length < batchSize) break;
  }

  return total;
}

/**
 * Build search index: cache carrier name→DOT→MC→state mapping.
 * Used for typeahead search when Redis sorted sets are available.
 * For in-memory mode, stores a compact lookup array.
 */
async function buildSearchIndex(): Promise<number> {
  const pool = getPool();
  if (!pool) return 0;

  const mvReady = await isMVReady();
  if (!mvReady.exists) return 0;

  let total = 0;
  let offset = 0;
  const batchSize = 10000;
  const indexEntries: Array<{ key: string; value: any }> = [];

  while (true) {
    const [rows]: any = await pool.query(
      `SELECT dot_number, legal_name, dba_name, mc_number, phy_state, risk_tier
       FROM carrier_intelligence_mv
       WHERE nbr_power_unit > 0
       ORDER BY nbr_power_unit DESC
       LIMIT ? OFFSET ?`,
      [batchSize, offset]
    );
    if (!rows?.length) break;

    for (const r of rows) {
      // Index by DOT prefix (for numeric search)
      const dot = String(r.dot_number);
      indexEntries.push({
        key: `dot:${dot}`,
        value: { d: dot, n: r.legal_name, m: r.mc_number, s: r.phy_state, t: r.risk_tier },
      });
    }

    total += rows.length;
    offset += batchSize;
    if (rows.length < batchSize) break;

    // Flush batch to avoid memory pressure
    if (indexEntries.length >= 10000) {
      await cacheMSet("SEARCH", indexEntries, 86400);
      indexEntries.length = 0;
    }
  }

  // Flush remaining
  if (indexEntries.length > 0) {
    await cacheMSet("SEARCH", indexEntries, 86400);
  }

  return total;
}

/**
 * Pre-aggregate dashboard KPIs into AGGREGATE cache tier.
 */
async function preAggregateDashboardKPIs(): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  const mvReady = await isMVReady();
  if (!mvReady.exists) return;

  // Carrier intelligence stats
  const [carrierStats]: any = await pool.query(`
    SELECT
      COUNT(*) as totalCarriers,
      SUM(IF(has_active_insurance = 1, 1, 0)) as insuredCarriers,
      SUM(IF(has_active_oos = 1, 1, 0)) as oosCarriers,
      SUM(IF(risk_tier = 'LOW', 1, 0)) as lowRiskCount,
      SUM(IF(risk_tier = 'MODERATE', 1, 0)) as moderateRiskCount,
      SUM(IF(risk_tier = 'HIGH', 1, 0)) as highRiskCount,
      SUM(IF(risk_tier = 'CRITICAL', 1, 0)) as criticalRiskCount,
      AVG(risk_score) as avgRiskScore,
      SUM(IF(is_blocked = 1, 1, 0)) as blockedCount,
      SUM(total_crashes) as totalCrashesAllCarriers,
      SUM(total_inspections) as totalInspectionsAllCarriers,
      SUM(total_violations) as totalViolationsAllCarriers,
      SUM(IF(hm_flag = 'Y', 1, 0)) as hazmatCarriers,
      COUNT(DISTINCT phy_state) as statesRepresented
    FROM carrier_intelligence_mv
  `);

  await cacheSet("AGGREGATE", "carrier_kpis", carrierStats[0] || {}, 300);

  // Risk tier distribution
  const [riskDist]: any = await pool.query(`
    SELECT risk_tier, COUNT(*) as count
    FROM carrier_intelligence_mv
    GROUP BY risk_tier
  `);
  await cacheSet("AGGREGATE", "risk_distribution", riskDist || [], 300);

  // Top states by carrier count
  const [stateStats]: any = await pool.query(`
    SELECT phy_state as state, COUNT(*) as count, AVG(risk_score) as avgRisk
    FROM carrier_intelligence_mv
    WHERE phy_state IS NOT NULL
    GROUP BY phy_state
    ORDER BY count DESC
    LIMIT 20
  `);
  await cacheSet("AGGREGATE", "top_states", stateStats || [], 300);
}
