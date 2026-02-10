/**
 * COMMODITY DATA SERVICE — Real-time market data from FRED & EIA APIs
 *
 * FRED (Federal Reserve Economic Data):
 *   - DCOILWTICO: WTI Crude Oil (West Texas Intermediate)
 *   - GASREGW: Regular Gasoline (weekly avg)
 *
 * EIA (Energy Information Administration):
 *   - PET.EMD_EPD2D_PTE_NUS_DPG.W: Diesel retail price (weekly)
 *   - NG.RNGWHHD.W: Henry Hub Natural Gas spot price
 *
 * Caching: 1-hour TTL to avoid rate limits and keep latency low.
 * Fallback: If APIs fail, use last known values or static defaults.
 */

const FRED_API_KEY = process.env.FRED_API_KEY || "";
const EIA_API_KEY = process.env.EIA_API_KEY || "";

const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";
const EIA_BASE = "https://api.eia.gov/v2";

// Cache config
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CachedValue {
  value: number;
  fetchedAt: number;
  source: string;
  seriesId: string;
}

const cache: Record<string, CachedValue> = {};

// Static fallbacks (used if both API call and cache miss)
const FALLBACKS: Record<string, number> = {
  WTI: 78.50,
  DIESEL: 3.85,
  GASOLINE: 3.25,
  NATURAL_GAS: 2.50,
  BDI: 1450,
};

// ─── FRED API ────────────────────────────────────────────────────────────────

async function fetchFRED(seriesId: string): Promise<number | null> {
  if (!FRED_API_KEY) return null;
  try {
    const url = `${FRED_BASE}?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=5`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      console.warn(`[CommodityData] FRED ${seriesId} HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    const observations = data?.observations;
    if (!Array.isArray(observations) || observations.length === 0) return null;

    // Find most recent non-"." value (FRED uses "." for missing)
    for (const obs of observations) {
      if (obs.value && obs.value !== ".") {
        const val = parseFloat(obs.value);
        if (!isNaN(val)) return val;
      }
    }
    return null;
  } catch (err: any) {
    console.warn(`[CommodityData] FRED ${seriesId} error:`, err?.message?.slice(0, 100));
    return null;
  }
}

// ─── EIA API v2 ──────────────────────────────────────────────────────────────

async function fetchEIA(route: string, params: Record<string, string> = {}): Promise<number | null> {
  if (!EIA_API_KEY) return null;
  try {
    const queryParts = [`api_key=${EIA_API_KEY}`, ...Object.entries(params).map(([k, v]) => `${k}=${v}`)];
    const url = `${EIA_BASE}/${route}?${queryParts.join("&")}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      console.warn(`[CommodityData] EIA ${route} HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    const rows = data?.response?.data;
    if (!Array.isArray(rows) || rows.length === 0) return null;

    // Return most recent value
    const val = parseFloat(rows[0]?.value);
    return isNaN(val) ? null : val;
  } catch (err: any) {
    console.warn(`[CommodityData] EIA ${route} error:`, err?.message?.slice(0, 100));
    return null;
  }
}

// ─── CACHED FETCHER ──────────────────────────────────────────────────────────

async function getCached(key: string, fetcher: () => Promise<number | null>, source: string, seriesId: string): Promise<CachedValue> {
  const existing = cache[key];
  if (existing && (Date.now() - existing.fetchedAt) < CACHE_TTL_MS) {
    return existing;
  }

  const value = await fetcher();
  if (value !== null) {
    cache[key] = { value, fetchedAt: Date.now(), source, seriesId };
    return cache[key];
  }

  // Return stale cache if available
  if (existing) return existing;

  // Final fallback
  return { value: FALLBACKS[key] || 0, fetchedAt: 0, source: "fallback", seriesId };
}

// ─── PUBLIC API ──────────────────────────────────────────────────────────────

export interface CommodityIndex {
  name: string;
  value: number;
  unit: string;
  source: string;
  seriesId: string;
  updatedAt: string;
  isCached: boolean;
  factor: number; // normalized against base
}

const COMMODITY_NORMALIZATION_BASE = 50.0;

/**
 * Get WTI Crude Oil price ($/barrel)
 * FRED series: DCOILWTICO
 */
export async function getWTI(): Promise<CachedValue> {
  return getCached("WTI", () => fetchFRED("DCOILWTICO"), "FRED", "DCOILWTICO");
}

/**
 * Get regular gasoline price ($/gallon)
 * FRED series: GASREGW
 */
export async function getGasoline(): Promise<CachedValue> {
  return getCached("GASOLINE", () => fetchFRED("GASREGW"), "FRED", "GASREGW");
}

/**
 * Get diesel retail price ($/gallon)
 * EIA: petroleum/pri/gnd/data
 */
export async function getDiesel(): Promise<CachedValue> {
  return getCached("DIESEL", () => fetchEIA(
    "petroleum/pri/gnd/data",
    { "frequency": "weekly", "data[0]": "value", "facets[product][]": "EPD2D", "facets[duession][]": "NUS", "sort[0][column]": "period", "sort[0][direction]": "desc", "length": "1" }
  ), "EIA", "PET.EMD_EPD2D_PTE_NUS_DPG.W");
}

/**
 * Get Henry Hub natural gas spot price ($/MMBtu)
 * EIA: natural-gas/pri/fut/data
 */
export async function getNaturalGas(): Promise<CachedValue> {
  return getCached("NATURAL_GAS", () => fetchEIA(
    "natural-gas/pri/fut/data",
    { "frequency": "daily", "data[0]": "value", "facets[series][]": "RNGWHHD", "sort[0][column]": "period", "sort[0][direction]": "desc", "length": "1" }
  ), "EIA", "NG.RNGWHHD.D");
}

/**
 * Get all commodity indexes at once (for Commission Engine and dashboards)
 */
export async function getAllCommodityIndexes(): Promise<CommodityIndex[]> {
  const [wti, diesel, gasoline, naturalGas] = await Promise.all([
    getWTI(),
    getDiesel(),
    getGasoline(),
    getNaturalGas(),
  ]);

  const bdi = FALLBACKS.BDI; // BDI not available from FRED/EIA — would need Baltic Exchange API

  return [
    {
      name: "WTI",
      value: wti.value,
      unit: "$/barrel",
      source: wti.source,
      seriesId: wti.seriesId,
      updatedAt: wti.fetchedAt ? new Date(wti.fetchedAt).toISOString() : "N/A",
      isCached: (Date.now() - wti.fetchedAt) < CACHE_TTL_MS && wti.source !== "fallback",
      factor: Math.round((wti.value / COMMODITY_NORMALIZATION_BASE) * 10000) / 10000,
    },
    {
      name: "DIESEL",
      value: diesel.value,
      unit: "$/gallon",
      source: diesel.source,
      seriesId: diesel.seriesId,
      updatedAt: diesel.fetchedAt ? new Date(diesel.fetchedAt).toISOString() : "N/A",
      isCached: (Date.now() - diesel.fetchedAt) < CACHE_TTL_MS && diesel.source !== "fallback",
      factor: Math.round((diesel.value / 3.0) * 10000) / 10000, // normalize against $3.00 base
    },
    {
      name: "GASOLINE",
      value: gasoline.value,
      unit: "$/gallon",
      source: gasoline.source,
      seriesId: gasoline.seriesId,
      updatedAt: gasoline.fetchedAt ? new Date(gasoline.fetchedAt).toISOString() : "N/A",
      isCached: (Date.now() - gasoline.fetchedAt) < CACHE_TTL_MS && gasoline.source !== "fallback",
      factor: Math.round((gasoline.value / 3.0) * 10000) / 10000,
    },
    {
      name: "NATURAL_GAS",
      value: naturalGas.value,
      unit: "$/MMBtu",
      source: naturalGas.source,
      seriesId: naturalGas.seriesId,
      updatedAt: naturalGas.fetchedAt ? new Date(naturalGas.fetchedAt).toISOString() : "N/A",
      isCached: (Date.now() - naturalGas.fetchedAt) < CACHE_TTL_MS && naturalGas.source !== "fallback",
      factor: Math.round((naturalGas.value / 2.5) * 10000) / 10000,
    },
    {
      name: "BDI",
      value: bdi,
      unit: "index",
      source: "static",
      seriesId: "N/A",
      updatedAt: new Date().toISOString(),
      isCached: false,
      factor: Math.round((bdi / 1000) * 10000) / 10000,
    },
  ];
}

/**
 * Get live commodity values for Commission Engine fee calculation
 * Returns the same shape as the old COMMODITY_INDEXES constant
 */
export async function getLiveCommodityValues(): Promise<Record<string, number>> {
  const [wti, diesel] = await Promise.all([getWTI(), getDiesel()]);
  return {
    WTI: wti.value,
    BDI: FALLBACKS.BDI,
    DIESEL: diesel.value,
  };
}
