/**
 * EIA Crude Oil Prices Integration
 * Source: Energy Information Administration (api.eia.gov/v2)
 * Auth: API Key required (EIA_API_KEY)
 * Refresh: Every 1 hour
 * Data: WTI spot, Brent spot, Cushing OK stocks, Henry Hub nat gas
 */
import { getDb } from "../../db";
import { hzCrudePrices } from "../../../drizzle/schema";
import { sql } from "drizzle-orm";

const EIA_BASE = "https://api.eia.gov/v2";

const CRUDE_SERIES: { code: string; name: string; unit: string }[] = [
  { code: "PET.RWTC.D", name: "WTI Cushing Spot", unit: "$/bbl" },
  { code: "PET.RBRTE.D", name: "Brent Spot", unit: "$/bbl" },
  { code: "PET.WCESTUS1.W", name: "Cushing OK Stocks", unit: "1000 bbl" },
  { code: "NG.RNGWHHD.D", name: "Henry Hub Nat Gas", unit: "$/MMBtu" },
];

export async function fetchCrudePrices(): Promise<void> {
  const apiKey = process.env.EIA_API_KEY;
  if (!apiKey) {
    console.warn("[EIA-Crude] No EIA_API_KEY set, skipping crude price sync");
    return;
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  for (const series of CRUDE_SERIES) {
    try {
      const url = new URL(`${EIA_BASE}/petroleum/pri/spt/data/`);
      url.searchParams.set("api_key", apiKey);
      url.searchParams.set("frequency", "daily");
      url.searchParams.set("data[0]", "value");
      url.searchParams.set("sort[0][column]", "period");
      url.searchParams.set("sort[0][direction]", "desc");
      url.searchParams.set("length", "7");

      const response = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
      if (!response.ok) continue;

      const data = await response.json();
      const rows = data.response?.data || [];
      if (rows.length === 0) continue;

      const latest = rows[0];
      const prev = rows[1];
      const weekAgo = rows[6];

      const id = `${series.code}-${latest.period}`;
      await db
        .insert(hzCrudePrices)
        .values({
          id,
          productCode: series.code,
          productName: series.name,
          priceUsd: String(latest.value),
          priceChange1d: prev ? String((latest.value - prev.value).toFixed(2)) : null,
          priceChange1w: weekAgo ? String((latest.value - weekAgo.value).toFixed(2)) : null,
          source: "EIA",
          reportDate: latest.period,
        })
        .onDuplicateKeyUpdate({
          set: {
            priceUsd: String(latest.value),
            priceChange1d: prev ? String((latest.value - prev.value).toFixed(2)) : null,
            priceChange1w: weekAgo ? String((latest.value - weekAgo.value).toFixed(2)) : null,
            fetchedAt: new Date(),
          },
        });

      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      console.error(`[EIA-Crude] Failed to fetch ${series.code}:`, e);
    }
  }
}
