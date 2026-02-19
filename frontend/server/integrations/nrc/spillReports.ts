/**
 * NRC Spill Reports Integration
 * Source: National Response Center (nrc.uscg.mil)
 * Auth: None (public RSS/web scraping)
 * Refresh: Every 15 minutes
 * Data: Real-time chemical/oil spill notifications
 *
 * The NRC provides incident reports via their query tool.
 * We fetch recent reports and store them for zone intelligence.
 */
import { getDb } from "../../db";
import { sql } from "drizzle-orm";

const NRC_QUERY_URL = "https://nrc.uscg.mil/FOIAFiles/CurrentCSV.csv";

interface SpillReport {
  reportNum: string;
  callDate: string;
  state: string;
  nearestCity: string;
  material: string;
  quantity: string;
  unit: string;
  medium: string;
  description: string;
}

export async function fetchSpillReports(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const response = await fetch(NRC_QUERY_URL, {
      signal: AbortSignal.timeout(20000),
      headers: { "User-Agent": "EusoTrip/3.0 (contact@eusotrip.com)" },
    });

    if (!response.ok) {
      console.warn(`[NRC] API returned ${response.status}, skipping`);
      return;
    }

    const text = await response.text();
    const lines = text.split("\n").slice(1); // Skip header

    let processed = 0;
    for (const line of lines.slice(0, 200)) {
      const cols = line.split(",").map((c) => c.replace(/"/g, "").trim());
      if (cols.length < 8) continue;

      const reportNum = cols[0];
      const callDate = cols[1];
      const state = cols[3]?.substring(0, 2);
      const material = cols[5];
      if (!reportNum || !state) continue;

      try {
        await db.execute(
          sql`INSERT INTO hz_hazmat_incidents
              (report_number, state_code, city, incident_date, material_name, description, source, fetched_at)
              VALUES (${`NRC-${reportNum}`}, ${state}, ${cols[4] || null}, ${callDate || null},
                      ${material || 'Unknown'}, ${cols[7] || null}, 'PHMSA', NOW())
              ON DUPLICATE KEY UPDATE fetched_at = NOW()`
        );
        processed++;
      } catch {
        // Skip individual errors
      }
    }

    console.log(`[NRC] Processed ${processed} spill reports`);
  } catch (e) {
    console.error("[NRC] Failed to fetch spill reports:", e);
  }
}
