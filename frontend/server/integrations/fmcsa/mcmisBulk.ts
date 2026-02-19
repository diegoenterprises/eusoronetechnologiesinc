/**
 * FMCSA MCMIS Bulk Census Download
 * Source: FMCSA Data Dissemination (fmcsa.dot.gov)
 * Auth: None (public CSV download)
 * Refresh: Weekly (Sunday 1 AM)
 * Data: All 500k+ registered carriers — fleet size, authority, hazmat flag
 *
 * NOTE: The actual bulk file (~200MB) requires manual download from:
 * https://www.fmcsa.dot.gov/mission/information-systems/mcmis-data-dissemination
 * This integration processes the downloaded CSV if placed in the data directory.
 * In production, this would be automated via a scheduled download script.
 */
import { getDb } from "../../db";
import { hzCarrierSafety } from "../../../drizzle/schema";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

const DATA_DIR = process.env.MCMIS_DATA_DIR || "/tmp/mcmis";

export async function processMCMISBulkCensus(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const csvPath = path.join(DATA_DIR, "CENSUS.csv");
  if (!fs.existsSync(csvPath)) {
    console.warn("[MCMIS] No bulk census file found at", csvPath);
    console.warn("[MCMIS] Download from: https://www.fmcsa.dot.gov/mission/information-systems/mcmis-data-dissemination");
    return;
  }

  const { parse } = await import("csv-parse/sync");
  const content = fs.readFileSync(csvPath, "utf-8");
  const records: Record<string, string>[] = parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true });

  let processed = 0;
  const batchSize = 500;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    for (const row of batch) {
      const dotNumber = row.DOT_NUMBER?.trim();
      if (!dotNumber) continue;

      const legalName = row.LEGAL_NAME?.trim() || "Unknown";
      const dbaName = row.DBA_NAME?.trim() || null;
      const physState = row.PHY_STATE?.trim() || null;
      const hmFlag = row.HM_FLAG?.trim() === "Y";

      try {
        await db
          .insert(hzCarrierSafety)
          .values({
            dotNumber,
            legalName,
            dbaName,
            physicalState: physState,
            hazmatAuthority: hmFlag,
          })
          .onDuplicateKeyUpdate({
            set: {
              legalName,
              dbaName,
              hazmatAuthority: hmFlag,
              fetchedAt: new Date(),
            },
          });
        processed++;
      } catch {
        // Skip individual row errors
      }
    }
  }

  console.log(`[MCMIS] Processed ${processed} carrier records from bulk census`);
}
