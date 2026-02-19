/**
 * EIA Fuel Prices Integration
 * Source: Energy Information Administration (api.eia.gov/v2)
 * Auth: API Key required (EIA_API_KEY)
 * Refresh: Every 1 hour
 */
import { getDb } from "../../db";
import { hzFuelPrices } from "../../../drizzle/schema";
import { sql } from "drizzle-orm";

const EIA_BASE = "https://api.eia.gov/v2";

const DIESEL_SERIES: Record<string, string> = {
  PADD1A: "PET.EMD_EPD2D_PTE_R1X_DPG.W",
  PADD1B: "PET.EMD_EPD2D_PTE_R1Y_DPG.W",
  PADD1C: "PET.EMD_EPD2D_PTE_R1Z_DPG.W",
  PADD2: "PET.EMD_EPD2D_PTE_R20_DPG.W",
  PADD3: "PET.EMD_EPD2D_PTE_R30_DPG.W",
  PADD4: "PET.EMD_EPD2D_PTE_R40_DPG.W",
  PADD5: "PET.EMD_EPD2D_PTE_R50_DPG.W",
};

const PADD_STATES: Record<string, string[]> = {
  PADD1A: ["CT", "ME", "MA", "NH", "RI", "VT"],
  PADD1B: ["DE", "DC", "MD", "NJ", "NY", "PA"],
  PADD1C: ["FL", "GA", "NC", "SC", "VA", "WV"],
  PADD2: ["IL", "IN", "IA", "KS", "KY", "MI", "MN", "MO", "NE", "ND", "OH", "OK", "SD", "TN", "WI"],
  PADD3: ["AL", "AR", "LA", "MS", "NM", "TX"],
  PADD4: ["CO", "ID", "MT", "UT", "WY"],
  PADD5: ["AK", "AZ", "CA", "HI", "NV", "OR", "WA"],
};

export async function fetchEIAFuelPrices(): Promise<void> {
  const apiKey = process.env.EIA_API_KEY;
  if (!apiKey) {
    console.warn("[EIA] No EIA_API_KEY set, skipping fuel price sync");
    return;
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  for (const [padd, seriesId] of Object.entries(DIESEL_SERIES)) {
    try {
      const url = new URL(`${EIA_BASE}/petroleum/pri/gnd/data/`);
      url.searchParams.set("api_key", apiKey);
      url.searchParams.set("frequency", "weekly");
      url.searchParams.set("data[0]", "value");
      url.searchParams.set("facets[series][]", seriesId);
      url.searchParams.set("sort[0][column]", "period");
      url.searchParams.set("sort[0][direction]", "desc");
      url.searchParams.set("length", "4");

      const response = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
      if (!response.ok) continue;

      const data = await response.json();
      const prices = data.response?.data || [];
      if (prices.length === 0) continue;

      const latest = prices[0];
      const prevWeek = prices[1];
      const prevMonth = prices[3];

      const states = PADD_STATES[padd] || [];

      for (const stateCode of states) {
        const id = `${stateCode}-${latest.period}`;
        await db
          .insert(hzFuelPrices)
          .values({
            id,
            stateCode,
            paddRegion: padd,
            dieselRetail: String(latest.value),
            dieselChange1w: prevWeek ? String(latest.value - prevWeek.value) : null,
            dieselChange1m: prevMonth ? String(latest.value - prevMonth.value) : null,
            source: "EIA",
            reportDate: latest.period,
          })
          .onDuplicateKeyUpdate({
            set: {
              dieselRetail: String(latest.value),
              dieselChange1w: prevWeek ? String(latest.value - prevWeek.value) : null,
              dieselChange1m: prevMonth ? String(latest.value - prevMonth.value) : null,
              fetchedAt: new Date(),
            },
          });
      }

      // Rate limit: small delay between PADD requests
      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      console.error(`[EIA] Failed to fetch ${padd}:`, e);
    }
  }
}
