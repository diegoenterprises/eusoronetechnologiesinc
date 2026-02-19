/**
 * EIA Refinery Data Integration
 * Source: Energy Information Administration (api.eia.gov/v2)
 * Auth: API Key required (EIA_API_KEY)
 * Refresh: Daily at 7 AM
 * Data: Refinery utilization, operable capacity by PADD
 */
import { getDb } from "../../db";
import { sql } from "drizzle-orm";

const EIA_BASE = "https://api.eia.gov/v2";

const PADD_STATES: Record<string, string[]> = {
  PADD1: ["CT", "ME", "MA", "NH", "RI", "VT", "DE", "DC", "MD", "NJ", "NY", "PA", "FL", "GA", "NC", "SC", "VA", "WV"],
  PADD2: ["IL", "IN", "IA", "KS", "KY", "MI", "MN", "MO", "NE", "ND", "OH", "OK", "SD", "TN", "WI"],
  PADD3: ["AL", "AR", "LA", "MS", "NM", "TX"],
  PADD4: ["CO", "ID", "MT", "UT", "WY"],
  PADD5: ["AK", "AZ", "CA", "HI", "NV", "OR", "WA"],
};

export async function fetchRefineryData(): Promise<void> {
  const apiKey = process.env.EIA_API_KEY;
  if (!apiKey) {
    console.warn("[EIA-Refinery] No EIA_API_KEY set, skipping refinery data sync");
    return;
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Refinery utilization by PADD
    const url = new URL(`${EIA_BASE}/petroleum/pnp/wiup/data/`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("frequency", "weekly");
    url.searchParams.set("data[0]", "value");
    url.searchParams.set("sort[0][column]", "period");
    url.searchParams.set("sort[0][direction]", "desc");
    url.searchParams.set("length", "25");

    const response = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
    if (!response.ok) return;

    const data = await response.json();
    const rows = data.response?.data || [];

    for (const row of rows) {
      const padd = row.duoarea;
      if (!padd || !PADD_STATES[padd]) continue;

      const id = `refinery-${padd}-${row.period}`;
      await db.execute(
        sql`INSERT INTO hz_crude_prices (id, product_code, product_name, price_usd, source, report_date)
            VALUES (${id}, ${`REFINERY_UTIL_${padd}`}, ${`Refinery Utilization ${padd}`}, ${String(row.value || 0)}, 'EIA', ${row.period})
            ON DUPLICATE KEY UPDATE price_usd = VALUES(price_usd), fetched_at = NOW()`
      );
    }
  } catch (e) {
    console.error("[EIA-Refinery] Failed:", e);
  }
}
