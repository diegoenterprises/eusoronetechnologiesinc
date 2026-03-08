/**
 * FMCSA ETL CRON SCHEDULER
 * 
 * Automates the daily and monthly ETL jobs.
 * Auto-starts with the server — no separate process needed.
 * 
 * Schedule:
 * - Daily at 12:00 PM CT (18:00 UTC): ALL daily datasets
 *   (census, authority, insurance, crashes, inspections,
 *    violations, OOS, BOC3, revocations)
 * - Monthly on 16th at 12:30 PM CT (18:30 UTC): SMS BASIC scores
 * - Every 15 minutes: Carrier monitoring job
 * - Every 5 minutes: Send pending alerts
 * 
 * Usage (standalone):
 *   npx ts-node server/etl/fmcsaCron.ts
 * 
 * Auto-start (wired into server/_core/index.ts):
 *   import { startFmcsaCron } from '../etl/fmcsaCron';
 *   startFmcsaCron();
 */

import * as cron from "node-cron";
import { getDb } from "../db";
import {
  runDailyEtl,
  runMonthlyEtl,
  runFullEtl,
} from "./fmcsaEtl";
import {
  runMonitoringJob,
  sendPendingAlerts,
} from "../services/carrierMonitor";
import { runPreComputePipeline } from "../services/lightspeed/preCompute";

// ============================================================================
// CONFIGURATION
// ============================================================================

const ENABLE_DAILY_ETL = process.env.FMCSA_ENABLE_DAILY_ETL !== "false";
const ENABLE_MONTHLY_ETL = process.env.FMCSA_ENABLE_MONTHLY_ETL !== "false";
const ENABLE_MONITORING = process.env.FMCSA_ENABLE_MONITORING !== "false";
const ENABLE_ALERTS = process.env.FMCSA_ENABLE_ALERTS !== "false";

// ============================================================================
// JOB WRAPPERS
// ============================================================================

async function withErrorHandling(jobName: string, fn: () => Promise<any>): Promise<void> {
  const startTime = Date.now();
  console.log(`[FMCSA Cron] Starting job: ${jobName}`);
  
  try {
    await fn();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[FMCSA Cron] Completed job: ${jobName} in ${duration}s`);
  } catch (err: any) {
    console.error(`[FMCSA Cron] Job failed: ${jobName}`, err.message);
    // TODO: Send alert to Slack/PagerDuty
  }
}

// ============================================================================
// SCHEDULED JOBS
// ============================================================================

function scheduleDailyEtl(): void {
  if (!ENABLE_DAILY_ETL) {
    console.log("[FMCSA Cron] Daily ETL disabled");
    return;
  }
  
  // Run at 18:00 UTC (12:00 PM CT) every day
  // This scrapes ALL daily FMCSA datasets for instant verification:
  // census, authority, insurance, crashes, inspections, violations, OOS, BOC3, revocations
  cron.schedule("0 18 * * *", async () => {
    await withErrorHandling("Daily ETL (ALL daily datasets)", runDailyEtl);
    // LIGHTSPEED: Post-ETL pre-computation pipeline (refresh MV, warm caches, push WS)
    await withErrorHandling("LIGHTSPEED Post-ETL Pipeline", runPreComputePipeline);
  });
  
  console.log("[FMCSA Cron] ✓ Scheduled: Daily ETL at 12:00 PM CT (18:00 UTC) — all 9 daily datasets");
}

function scheduleMonthlyEtl(): void {
  if (!ENABLE_MONTHLY_ETL) {
    console.log("[FMCSA Cron] Monthly ETL disabled");
    return;
  }
  
  // Run on 16th of each month at 18:30 UTC (12:30 PM CT)
  // (SMS data is usually available by 15th)
  cron.schedule("30 18 16 * *", async () => {
    await withErrorHandling("Monthly ETL (SMS BASIC Scores)", runMonthlyEtl);
    // LIGHTSPEED: Refresh MV after SMS scores update (risk scores change)
    await withErrorHandling("LIGHTSPEED Post-SMS Pipeline", runPreComputePipeline);
  });
  
  console.log("[FMCSA Cron] ✓ Scheduled: Monthly ETL on 16th at 12:30 PM CT (18:30 UTC) — SMS scores");
}

function scheduleMonitoringJob(): void {
  if (!ENABLE_MONITORING) {
    console.log("[FMCSA Cron] Carrier monitoring disabled");
    return;
  }
  
  // Run every 15 minutes — detects changes in authority, insurance, safety
  cron.schedule("*/15 * * * *", async () => {
    await withErrorHandling("Carrier Monitoring", runMonitoringJob);
  });
  
  console.log("[FMCSA Cron] ✓ Scheduled: Carrier Monitoring every 15 minutes");
}

function scheduleAlertDelivery(): void {
  if (!ENABLE_ALERTS) {
    console.log("[FMCSA Cron] Alert delivery disabled");
    return;
  }
  
  // Run every 5 minutes — delivers insurance/authority/safety change alerts
  cron.schedule("*/5 * * * *", async () => {
    await withErrorHandling("Alert Delivery", async () => {
      const sent = await sendPendingAlerts();
      if (sent > 0) {
        console.log(`[FMCSA Cron] Sent ${sent} alerts`);
      }
    });
  });
  
  console.log("[FMCSA Cron] ✓ Scheduled: Alert Delivery every 5 minutes");
}

// ============================================================================
// MANUAL TRIGGERS
// ============================================================================

export async function triggerDailyEtl(): Promise<void> {
  await withErrorHandling("Manual Daily ETL", runDailyEtl);
}

export async function triggerMonthlyEtl(): Promise<void> {
  await withErrorHandling("Manual Monthly ETL", runMonthlyEtl);
}

export async function triggerFullEtl(): Promise<void> {
  await withErrorHandling("Manual Full ETL", runFullEtl);
}

export async function triggerMonitoringJob(): Promise<void> {
  await withErrorHandling("Manual Monitoring Job", runMonitoringJob);
}

// ============================================================================
// AUTO-START (called from server/_core/index.ts on boot)
// ============================================================================

let cronStarted = false;

export async function startFmcsaCron(): Promise<void> {
  if (cronStarted) {
    console.log("[FMCSA Cron] Already running, skipping duplicate start");
    return;
  }
  cronStarted = true;
  
  console.log("[FMCSA Cron] ═══════════════════════════════════════════════════");
  console.log("[FMCSA Cron] Starting FMCSA ETL Scheduler");
  console.log("[FMCSA Cron] Daily scrape: 12:00 PM CT (18:00 UTC)");
  console.log("[FMCSA Cron] Monthly SMS:  16th at 12:30 PM CT (18:30 UTC)");
  console.log("[FMCSA Cron] Monitoring:   Every 15 minutes");
  console.log("[FMCSA Cron] Alerts:       Every 5 minutes");
  console.log("[FMCSA Cron] ═══════════════════════════════════════════════════\n");
  
  scheduleDailyEtl();
  scheduleMonthlyEtl();
  scheduleMonitoringJob();
  scheduleAlertDelivery();
  
  console.log("\n[FMCSA Cron] All jobs scheduled and running.");
  
  // Missed-run catch-up: if server was down during today's 12PM run, catch up now
  setTimeout(async () => {
    try {
      await checkAndCatchUpMissedRuns();
    } catch (err) {
      console.error("[FMCSA Cron] Missed-run check failed:", err);
    }
  }, 5000);
}

async function checkAndCatchUpMissedRuns(): Promise<void> {
  try {
    const { getPool } = await import("../db");
    const pool = getPool();
    if (!pool) return;
    
    // Step 1: Check if tables even have data (first-ever load detection)
    let censusCount = 0;
    try {
      const [countRows]: any = await pool.query(`SELECT COUNT(*) as cnt FROM fmcsa_census`);
      censusCount = countRows?.[0]?.cnt || 0;
    } catch {
      // Table doesn't exist — ensureFmcsaTables() in runDailyEtl will create it
      censusCount = 0;
    }
    
    if (censusCount === 0) {
      // NEVER loaded — trigger immediate full initial load regardless of time
      console.log("[FMCSA Cron] ⚠ FMCSA TABLES ARE EMPTY — triggering initial data load NOW!");
      console.log("[FMCSA Cron] This is the first-ever ETL run. Downloading all FMCSA datasets...");
      await withErrorHandling("Initial Data Load (first boot)", runDailyEtl);
      return;
    }
    
    // Step 2: Tables have data — check if today's scheduled run was missed
    let lastSuccess: any = null;
    try {
      const [rows]: any = await pool.query(
        `SELECT MAX(completed_at) as last_success 
         FROM fmcsa_etl_log 
         WHERE status = 'SUCCESS' 
           AND dataset_name = 'Company Census File'
           AND completed_at >= CURDATE()`
      );
      lastSuccess = rows?.[0]?.last_success;
    } catch {
      lastSuccess = null;
    }
    
    if (!lastSuccess) {
      const nowUtc = new Date();
      const hourUtc = nowUtc.getUTCHours();
      
      if (hourUtc >= 18) {
        // Past noon CT and no run today — server was down during scheduled run
        console.log("[FMCSA Cron] ⚠ MISSED TODAY'S 12PM RUN — catching up now!");
        await withErrorHandling("Catch-Up Daily ETL", runDailyEtl);
      } else {
        console.log(`[FMCSA Cron] ✓ Data loaded (${censusCount.toLocaleString()} carriers). Next run at 12:00 PM CT (18:00 UTC)`);
      }
    } else {
      console.log(`[FMCSA Cron] ✓ Today's daily ETL already completed at ${lastSuccess} (${censusCount.toLocaleString()} carriers)`);
    }
  } catch (err: any) {
    console.error("[FMCSA Cron] Missed-run check error:", err.message);
    // If anything fails, try loading data anyway — better to have data than not
    try {
      console.log("[FMCSA Cron] Attempting data load despite check error...");
      await withErrorHandling("Fallback Data Load", runDailyEtl);
    } catch {
      console.error("[FMCSA Cron] Fallback data load also failed. Will retry at next scheduled run.");
    }
  }
}

// ============================================================================
// STANDALONE STARTUP (when run directly via CLI)
// ============================================================================

async function main(): Promise<void> {
  // Ensure database is ready
  await getDb();
  
  await startFmcsaCron();
  
  // Check for immediate run flags
  const args = process.argv.slice(2);
  
  if (args.includes("--run-daily")) {
    await triggerDailyEtl();
  }
  
  if (args.includes("--run-monthly")) {
    await triggerMonthlyEtl();
  }
  
  if (args.includes("--run-full")) {
    await triggerFullEtl();
  }
  
  if (args.includes("--run-monitoring")) {
    await triggerMonitoringJob();
  }
  
  // Keep process alive
  process.on("SIGINT", () => {
    console.log("\n[FMCSA Cron] Shutting down...");
    process.exit(0);
  });
}

// Run if called directly (wrapped for esbuild ESM compatibility)
try {
  if (require.main === module) {
    main().catch(err => {
      console.error("[FMCSA Cron] Fatal error:", err);
      process.exit(1);
    });
  }
} catch { /* esbuild ESM bundle — module not defined, skip CLI entry */ }

export { scheduleDailyEtl, scheduleMonthlyEtl, scheduleMonitoringJob, scheduleAlertDelivery };
