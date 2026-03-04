/**
 * Manual ETL runner — bypasses require.main check.
 * Usage: npx tsx server/etl/runEtlNow.ts [all|daily|census|authority|...]
 */
import "dotenv/config";
import { getDb } from "../db";
import {
  runCensusEtl,
  runAuthorityEtl,
  runInsuranceEtl,
  runCrashEtl,
  runInspectionEtl,
  runViolationEtl,
  runSmsScoresEtl,
  runOosEtl,
  runBoc3Etl,
  runRevocationsEtl,
} from "./fmcsaEtl";
import { runFullEtl, runDailyEtl, runMonthlyEtl } from "./fmcsaEtl";

async function main() {
  const dataset = process.argv[2] || "all";
  console.log(`[ETL Runner] Starting dataset: ${dataset}`);
  console.log(`[ETL Runner] DATABASE_URL set: ${!!process.env.DATABASE_URL}`);

  // Initialize DB connection
  await getDb();

  switch (dataset) {
    case "all":      await runFullEtl(); break;
    case "daily":    await runDailyEtl(); break;
    case "monthly":  await runMonthlyEtl(); break;
    case "census":   await runCensusEtl(true); break;
    case "authority": await runAuthorityEtl(true); break;
    case "insurance": await runInsuranceEtl(true); break;
    case "crashes":  await runCrashEtl(); break;
    case "inspections": await runInspectionEtl(); break;
    case "violations": await runViolationEtl(); break;
    case "sms":      await runSmsScoresEtl(); break;
    case "oos":      await runOosEtl(); break;
    case "boc3":     await runBoc3Etl(); break;
    case "revocations": await runRevocationsEtl(); break;
    default:
      console.log(`Unknown dataset: ${dataset}. Use: all, daily, monthly, census, authority, insurance, crashes, inspections, violations, sms, oos, boc3, revocations`);
  }

  console.log("[ETL Runner] Done.");
  process.exit(0);
}

main().catch(err => {
  console.error("[ETL Runner] Fatal:", err);
  process.exit(1);
});
