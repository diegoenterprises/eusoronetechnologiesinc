/**
 * MARKET DATA SERVICE — Free Government & Public API Integration
 * 
 * Fetches real market data from:
 * - FRED (Federal Reserve Economic Data): Trucking PPI, crude oil, natural gas, freight TSI
 * - EIA (Energy Information Administration): Diesel fuel prices by PADD region
 * - BLS (Bureau of Labor Statistics): Producer Price Indices for trucking
 * - FMCSA: Carrier census data
 * 
 * All sources are 100% free with API key registration.
 * Falls back to seed data when API keys are not configured.
 */

// ===== In-memory cache with TTL =====
interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  ttlMs: number;
}

const cache = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > entry.ttlMs) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, fetchedAt: Date.now(), ttlMs });
}

// ===== FRED API (Federal Reserve Economic Data) =====
// Series: PCU484121484121 (TL PPI), DCOILWTICO (WTI Crude), DHHNGSP (Natural Gas), TSIFRGHT (Freight TSI)

export interface FREDObservation {
  date: string;
  value: number;
}

export async function fetchFRED(seriesId: string, limit = 52): Promise<FREDObservation[]> {
  const cacheKey = `fred_${seriesId}_${limit}`;
  const cached = getCached<FREDObservation[]>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) return [];

  try {
    const url = new URL("https://api.stlouisfed.org/fred/series/observations");
    url.searchParams.set("series_id", seriesId);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("file_type", "json");
    url.searchParams.set("sort_order", "desc");
    url.searchParams.set("limit", String(limit));

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      console.error(`FRED API error for ${seriesId}: ${res.status}`);
      return [];
    }

    const json = await res.json();
    const observations: FREDObservation[] = (json.observations || [])
      .filter((obs: any) => obs.value !== ".")
      .map((obs: any) => ({
        date: obs.date,
        value: parseFloat(obs.value),
      }));

    // Cache for 1 hour (most FRED data is daily/weekly)
    setCache(cacheKey, observations, 60 * 60 * 1000);
    return observations;
  } catch (err) {
    console.error(`FRED fetch failed for ${seriesId}:`, err);
    return [];
  }
}

// ===== EIA API v2 (Energy Information Administration) =====
// Diesel fuel prices by PADD region, crude oil spot prices

export interface EIADataPoint {
  period: string;
  value: number;
  product: string;
  region: string;
}

export async function fetchEIADiesel(region = "NUS", limit = 12): Promise<EIADataPoint[]> {
  const cacheKey = `eia_diesel_${region}_${limit}`;
  const cached = getCached<EIADataPoint[]>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.EIA_API_KEY;
  if (!apiKey) return [];

  try {
    const url = new URL("https://api.eia.gov/v2/petroleum/pri/gnd/data/");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("frequency", "weekly");
    url.searchParams.set("data[0]", "value");
    url.searchParams.set("facets[product][]", "EPD2D"); // No 2 Diesel
    url.searchParams.set("facets[duoarea][]", region);
    url.searchParams.set("sort[0][column]", "period");
    url.searchParams.set("sort[0][direction]", "desc");
    url.searchParams.set("length", String(limit));

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      console.error(`EIA API error: ${res.status}`);
      return [];
    }

    const json = await res.json();
    const points: EIADataPoint[] = (json.response?.data || []).map((d: any) => ({
      period: d.period,
      value: d.value,
      product: d["product-name"] || "No 2 Diesel",
      region: d.duoarea || region,
    }));

    // Cache for 4 hours (EIA publishes weekly)
    setCache(cacheKey, points, 4 * 60 * 60 * 1000);
    return points;
  } catch (err) {
    console.error("EIA fetch failed:", err);
    return [];
  }
}

// PADD region mapping for UI
export const EIA_REGIONS: Record<string, string> = {
  NUS: "National",
  R1X: "New England",
  R1Y: "Central Atlantic",
  R1Z: "Lower Atlantic",
  R20: "Midwest",
  R30: "Gulf Coast",
  R4X: "Rocky Mountain",
  R50: "West Coast",
};

// ===== BLS Public Data API =====
// PPI for trucking: PCU484121484121 (TL), PCU4841224841221 (LTL), WPU057303 (Diesel PPI)

export interface BLSDataPoint {
  year: string;
  period: string;
  periodName: string;
  value: number;
}

export async function fetchBLS(seriesIds: string[]): Promise<Record<string, BLSDataPoint[]>> {
  const cacheKey = `bls_${seriesIds.join("_")}`;
  const cached = getCached<Record<string, BLSDataPoint[]>>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.BLS_API_KEY;
  // BLS v1 works without key (25 req/day), v2 with key (500 req/day)
  const baseUrl = apiKey
    ? "https://api.bls.gov/publicAPI/v2/timeseries/data/"
    : "https://api.bls.gov/publicAPI/v1/timeseries/data/";

  try {
    const currentYear = new Date().getFullYear();
    const body: any = {
      seriesid: seriesIds,
      startyear: String(currentYear - 1),
      endyear: String(currentYear),
    };
    if (apiKey) body.registrationkey = apiKey;

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.error(`BLS API error: ${res.status}`);
      return {};
    }

    const json = await res.json();
    const result: Record<string, BLSDataPoint[]> = {};

    for (const series of json.Results?.series || []) {
      result[series.seriesID] = (series.data || []).map((d: any) => ({
        year: d.year,
        period: d.period,
        periodName: d.periodName,
        value: parseFloat(d.value),
      }));
    }

    // Cache for 6 hours (BLS data is monthly)
    setCache(cacheKey, result, 6 * 60 * 60 * 1000);
    return result;
  } catch (err) {
    console.error("BLS fetch failed:", err);
    return {};
  }
}

// ===== FMCSA Carrier Lookup =====

export interface FMCSACarrier {
  dotNumber: string;
  legalName: string;
  phyState: string;
  totalDrivers: number;
  totalPowerUnits: number;
  carrierOperation: string;
}

export async function fetchFMCSACarrier(dotNumber: string): Promise<FMCSACarrier | null> {
  const cacheKey = `fmcsa_${dotNumber}`;
  const cached = getCached<FMCSACarrier>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.FMCSA_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://mobile.fmcsa.dot.gov/qc/services/carriers/${dotNumber}?webKey=${apiKey}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;

    const json = await res.json();
    const c = json.content?.carrier;
    if (!c) return null;

    const carrier: FMCSACarrier = {
      dotNumber: c.dotNumber,
      legalName: c.legalName,
      phyState: c.phyState,
      totalDrivers: c.totalDrivers || 0,
      totalPowerUnits: c.totalPowerUnits || 0,
      carrierOperation: c.carrierOperation?.carrierOperationDesc || "Unknown",
    };

    // Cache for 24 hours
    setCache(cacheKey, carrier, 24 * 60 * 60 * 1000);
    return carrier;
  } catch (err) {
    console.error(`FMCSA fetch failed for DOT ${dotNumber}:`, err);
    return null;
  }
}

// ===== Yahoo Finance API (Free, no key required) =====
// Real-time commodity futures prices via v7 quote endpoint

export interface YahooQuote {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketPreviousClose: number;
  regularMarketOpen: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
}

// Commodity futures symbols on Yahoo Finance
export const YAHOO_COMMODITY_SYMBOLS: Record<string, string> = {
  "CL=F": "CL",     // WTI Crude Oil
  "BZ=F": "BZ",     // Brent Crude
  "NG=F": "NG",     // Natural Gas
  "RB=F": "RB",     // RBOB Gasoline
  "HO=F": "HO",     // Heating Oil
  "GC=F": "GC",     // Gold
  "SI=F": "SI",     // Silver
  "HG=F": "HG",     // Copper
  "ZC=F": "ZC",     // Corn
  "ZS=F": "ZS",     // Soybeans
  "ZW=F": "ZW",     // Wheat
  "CT=F": "CT",     // Cotton
  "SB=F": "SB",     // Sugar
  "KC=F": "KC",     // Coffee
  "LE=F": "LE",     // Live Cattle
  "LBS=F": "LB",    // Lumber
  "ALI=F": "ALI",   // Aluminum
  "PA=F": "NI",     // Palladium (proxy for Nickel)
};

export async function fetchYahooFinanceQuotes(symbols: string[]): Promise<Map<string, YahooQuote>> {
  const cacheKey = `yahoo_${symbols.sort().join(",")}`;
  const cached = getCached<Map<string, YahooQuote>>(cacheKey);
  if (cached) return cached;

  try {
    const symbolStr = symbols.join(",");
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbolStr)}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose,regularMarketOpen,regularMarketDayHigh,regularMarketDayLow,regularMarketVolume,shortName`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; EusoTrip/1.0)",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.error(`Yahoo Finance API error: ${res.status}`);
      return new Map();
    }

    const json = await res.json();
    const quotes = new Map<string, YahooQuote>();

    for (const q of json.quoteResponse?.result || []) {
      const mappedSymbol = YAHOO_COMMODITY_SYMBOLS[q.symbol] || q.symbol;
      quotes.set(mappedSymbol, {
        symbol: mappedSymbol,
        shortName: q.shortName || q.symbol,
        regularMarketPrice: q.regularMarketPrice || 0,
        regularMarketChange: q.regularMarketChange || 0,
        regularMarketChangePercent: q.regularMarketChangePercent || 0,
        regularMarketPreviousClose: q.regularMarketPreviousClose || 0,
        regularMarketOpen: q.regularMarketOpen || 0,
        regularMarketDayHigh: q.regularMarketDayHigh || 0,
        regularMarketDayLow: q.regularMarketDayLow || 0,
        regularMarketVolume: q.regularMarketVolume || 0,
      });
    }

    // Cache for 5 minutes (Yahoo Finance updates in real-time during market hours)
    setCache(cacheKey, quotes, 5 * 60 * 1000);
    return quotes;
  } catch (err) {
    console.error("Yahoo Finance fetch failed:", err);
    return new Map();
  }
}

// Convenience: fetch all tracked commodity futures
export async function fetchAllCommodityQuotes(): Promise<Map<string, YahooQuote>> {
  return fetchYahooFinanceQuotes(Object.keys(YAHOO_COMMODITY_SYMBOLS));
}

// ===== Aggregated Market Intelligence =====
// Combines all sources into a unified market snapshot

export interface MarketSnapshot {
  dieselNational: { price: number; change: number; date: string } | null;
  dieselByRegion: Array<{ region: string; regionName: string; price: number }>;
  crudeOilWTI: { price: number; change: number; date: string } | null;
  naturalGas: { price: number; change: number; date: string } | null;
  truckingPPI: { value: number; change: number; history: FREDObservation[] } | null;
  ltlPPI: { value: number; change: number } | null;
  freightTSI: { value: number; change: number } | null;
  yahooQuotes: Record<string, { price: number; change: number; changePercent: number; prevClose: number; open: number; high: number; low: number; volume: number }>;
  source: string;
  fetchedAt: string;
  isLiveData: boolean;
}

function calcPctChange(current: number, previous: number): number {
  if (!previous || previous === 0) return 0;
  return +((((current - previous) / previous) * 100)).toFixed(2);
}

export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  const cacheKey = "market_snapshot";
  const cached = getCached<MarketSnapshot>(cacheKey);
  if (cached) return cached;

  // Fetch all sources in parallel (including Yahoo Finance — no key required)
  const [
    crudeRaw,
    natGasRaw,
    tlPPIRaw,
    ltlPPIRaw,
    freightTSIRaw,
    dieselNational,
    dieselMidwest,
    dieselGulf,
    dieselWest,
    yahooRaw,
  ] = await Promise.all([
    fetchFRED("DCOILWTICO", 5),
    fetchFRED("DHHNGSP", 5),
    fetchFRED("PCU484121484121", 52),
    fetchFRED("PCU4841224841221", 2),
    fetchFRED("TSIFRGHT", 2),
    fetchEIADiesel("NUS", 2),
    fetchEIADiesel("R20", 1),
    fetchEIADiesel("R30", 1),
    fetchEIADiesel("R50", 1),
    fetchAllCommodityQuotes(),
  ]);

  const hasGovData = crudeRaw.length > 0 || dieselNational.length > 0 || tlPPIRaw.length > 0;
  const hasYahoo = yahooRaw.size > 0;
  const hasAnyData = hasGovData || hasYahoo;

  // Build yahooQuotes record for the snapshot
  const yahooQuotes: MarketSnapshot["yahooQuotes"] = {};
  for (const [sym, q] of Array.from(yahooRaw.entries())) {
    yahooQuotes[sym] = {
      price: q.regularMarketPrice,
      change: q.regularMarketChange,
      changePercent: q.regularMarketChangePercent,
      prevClose: q.regularMarketPreviousClose,
      open: q.regularMarketOpen,
      high: q.regularMarketDayHigh,
      low: q.regularMarketDayLow,
      volume: q.regularMarketVolume,
    };
  }

  // Prefer FRED for crude/natgas, fallback to Yahoo Finance
  const yCL = yahooRaw.get("CL");
  const yNG = yahooRaw.get("NG");

  const snapshot: MarketSnapshot = {
    dieselNational: dieselNational.length >= 1
      ? {
          price: dieselNational[0].value,
          change: dieselNational.length >= 2 ? calcPctChange(dieselNational[0].value, dieselNational[1].value) : 0,
          date: dieselNational[0].period,
        }
      : null,
    dieselByRegion: [
      ...(dieselNational.length > 0 ? [{ region: "NUS", regionName: "National", price: dieselNational[0].value }] : []),
      ...(dieselMidwest.length > 0 ? [{ region: "R20", regionName: "Midwest", price: dieselMidwest[0].value }] : []),
      ...(dieselGulf.length > 0 ? [{ region: "R30", regionName: "Gulf Coast", price: dieselGulf[0].value }] : []),
      ...(dieselWest.length > 0 ? [{ region: "R50", regionName: "West Coast", price: dieselWest[0].value }] : []),
    ],
    crudeOilWTI: crudeRaw.length >= 1
      ? {
          price: crudeRaw[0].value,
          change: crudeRaw.length >= 2 ? calcPctChange(crudeRaw[0].value, crudeRaw[1].value) : 0,
          date: crudeRaw[0].date,
        }
      : yCL
        ? { price: yCL.regularMarketPrice, change: yCL.regularMarketChangePercent, date: new Date().toISOString().split("T")[0] }
        : null,
    naturalGas: natGasRaw.length >= 1
      ? {
          price: natGasRaw[0].value,
          change: natGasRaw.length >= 2 ? calcPctChange(natGasRaw[0].value, natGasRaw[1].value) : 0,
          date: natGasRaw[0].date,
        }
      : yNG
        ? { price: yNG.regularMarketPrice, change: yNG.regularMarketChangePercent, date: new Date().toISOString().split("T")[0] }
        : null,
    truckingPPI: tlPPIRaw.length >= 1
      ? {
          value: tlPPIRaw[0].value,
          change: tlPPIRaw.length >= 2 ? calcPctChange(tlPPIRaw[0].value, tlPPIRaw[1].value) : 0,
          history: tlPPIRaw.slice(0, 24).reverse(),
        }
      : null,
    ltlPPI: ltlPPIRaw.length >= 1
      ? {
          value: ltlPPIRaw[0].value,
          change: ltlPPIRaw.length >= 2 ? calcPctChange(ltlPPIRaw[0].value, ltlPPIRaw[1].value) : 0,
        }
      : null,
    freightTSI: freightTSIRaw.length >= 1
      ? {
          value: freightTSIRaw[0].value,
          change: freightTSIRaw.length >= 2 ? calcPctChange(freightTSIRaw[0].value, freightTSIRaw[1].value) : 0,
        }
      : null,
    yahooQuotes,
    source: hasGovData && hasYahoo
      ? "FRED + EIA + BLS + Yahoo Finance (Live)"
      : hasYahoo
        ? "Yahoo Finance (Live) — Configure FRED_API_KEY, EIA_API_KEY for government data"
        : hasGovData
          ? "FRED + EIA + BLS (Live)"
          : "EusoTrip Seed Data (Configure API keys for live)",
    fetchedAt: new Date().toISOString(),
    isLiveData: hasAnyData,
  };

  // Cache for 30 min
  setCache(cacheKey, snapshot, 30 * 60 * 1000);
  return snapshot;
}
