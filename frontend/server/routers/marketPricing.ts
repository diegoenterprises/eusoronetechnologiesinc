/**
 * MARKET PRICING ENGINE - Platts/Argus-Style Freight Rate Intelligence
 * 
 * Comprehensive pricing system for all user roles:
 * - Shippers: Cost benchmarking, lane rate analysis, budget forecasting
 * - Catalysts: Revenue optimization, rate comparison, profitability analysis
 * - Brokers: Margin analysis, market arbitrage, commission optimization
 * - Drivers: Earnings potential, best-paying lanes, rate-per-mile intelligence
 * - Terminals: Throughput pricing, storage rates, demurrage benchmarks
 * 
 * Data sources: Historical loads, real-time bids, fuel indices, seasonal patterns
 */

import { z } from "zod";
import { router, auditedProtectedProcedure as protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { loads } from "../../drizzle/schema";
import { desc, sql, eq, and, gte, lte } from "drizzle-orm";
import { fetchMarketSnapshot, type MarketSnapshot, searchCommodityPriceAPI, searchYahooFinance, fetchCommodityPriceAPI, fetchCPAPIHistorical, fetchAllCPAPIQuotes, CPAPI_SYMBOL_MAP } from "../services/marketDataService";

// Cached live snapshot (shared across endpoints)
let _liveSnapshot: MarketSnapshot | null = null;
let _liveSnapshotAt = 0;
async function getLiveSnapshot(): Promise<MarketSnapshot | null> {
  if (_liveSnapshot && Date.now() - _liveSnapshotAt < 90 * 1000) return _liveSnapshot;
  try {
    _liveSnapshot = await fetchMarketSnapshot();
    _liveSnapshotAt = Date.now();
    return _liveSnapshot;
  } catch { return _liveSnapshot; }
}

// Cached historical prices for change calculation (refreshes once per hour)
let _historicalPrices: Record<string, number> = {};
let _historicalAt = 0;
async function getYesterdayPrices(): Promise<Record<string, number>> {
  if (Object.keys(_historicalPrices).length > 0 && Date.now() - _historicalAt < 60 * 60 * 1000) return _historicalPrices;
  try {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const cpapiSymbols = Object.values(CPAPI_SYMBOL_MAP);
    const hist = await fetchCPAPIHistorical(cpapiSymbols, yesterday);
    // Map CPAPI symbols back to internal symbols
    const mapped: Record<string, number> = {};
    for (const [internal, cpapi] of Object.entries(CPAPI_SYMBOL_MAP)) {
      if (hist[cpapi] && hist[cpapi] > 0) mapped[internal] = hist[cpapi];
    }
    if (Object.keys(mapped).length > 0) {
      _historicalPrices = mapped;
      _historicalAt = Date.now();
    }
    return _historicalPrices;
  } catch { return _historicalPrices; }
}

// Fetch real freight rates from DB (uses cargoType + rate/distance to compute $/mile)
async function getRealFreightRates(): Promise<Record<string, { rate: number; prevRate: number; count: number }>> {
  try {
    const db = await getDb();
    if (!db) return {};
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);

    // Current week avg rate-per-mile by cargoType
    const currentRates = await db.select({
      cargoType: loads.cargoType,
      avgRpm: sql<number>`AVG(CAST(${loads.rate} AS DECIMAL(10,2)) / NULLIF(CAST(${loads.distance} AS DECIMAL(10,2)), 0))`,
      cnt: sql<number>`COUNT(*)`,
    }).from(loads)
      .where(and(
        gte(loads.createdAt, oneWeekAgo),
        sql`CAST(${loads.rate} AS DECIMAL(10,2)) > 0`,
        sql`CAST(${loads.distance} AS DECIMAL(10,2)) > 0`,
      ))
      .groupBy(loads.cargoType);

    // Previous week for comparison
    const prevRates = await db.select({
      cargoType: loads.cargoType,
      avgRpm: sql<number>`AVG(CAST(${loads.rate} AS DECIMAL(10,2)) / NULLIF(CAST(${loads.distance} AS DECIMAL(10,2)), 0))`,
    }).from(loads)
      .where(and(
        gte(loads.createdAt, twoWeeksAgo),
        lte(loads.createdAt, oneWeekAgo),
        sql`CAST(${loads.rate} AS DECIMAL(10,2)) > 0`,
        sql`CAST(${loads.distance} AS DECIMAL(10,2)) > 0`,
      ))
      .groupBy(loads.cargoType);

    const prevMap: Record<string, number> = {};
    for (const r of prevRates) {
      if (r.cargoType) prevMap[r.cargoType] = Number(r.avgRpm) || 0;
    }

    const result: Record<string, { rate: number; prevRate: number; count: number }> = {};
    for (const r of currentRates) {
      const rpm = Number(r.avgRpm);
      if (r.cargoType && rpm > 0 && rpm < 50) {
        result[r.cargoType] = {
          rate: rpm,
          prevRate: prevMap[r.cargoType] || rpm,
          count: Number(r.cnt),
        };
      }
    }
    return result;
  } catch (err) {
    console.warn("[MarketPricing] DB freight rate query failed:", err);
    return {};
  }
}

// Market rate indices (like Platts/Argus benchmarks)
const FREIGHT_INDICES = {
  DRY_VAN: {
    national: { current: 2.35, previous: 2.28, change: 3.07, unit: "$/mile" },
    spot: { current: 2.52, previous: 2.41, change: 4.56, unit: "$/mile" },
    contract: { current: 2.18, previous: 2.15, change: 1.40, unit: "$/mile" },
  },
  REEFER: {
    national: { current: 3.12, previous: 3.05, change: 2.30, unit: "$/mile" },
    spot: { current: 3.38, previous: 3.22, change: 4.97, unit: "$/mile" },
    contract: { current: 2.95, previous: 2.90, change: 1.72, unit: "$/mile" },
  },
  FLATBED: {
    national: { current: 2.85, previous: 2.78, change: 2.52, unit: "$/mile" },
    spot: { current: 3.10, previous: 2.98, change: 4.03, unit: "$/mile" },
    contract: { current: 2.68, previous: 2.65, change: 1.13, unit: "$/mile" },
  },
  TANKER: {
    national: { current: 3.45, previous: 3.38, change: 2.07, unit: "$/mile" },
    spot: { current: 3.72, previous: 3.55, change: 4.79, unit: "$/mile" },
    contract: { current: 3.25, previous: 3.20, change: 1.56, unit: "$/mile" },
  },
  HAZMAT: {
    national: { current: 4.15, previous: 4.05, change: 2.47, unit: "$/mile" },
    spot: { current: 4.50, previous: 4.30, change: 4.65, unit: "$/mile" },
    contract: { current: 3.90, previous: 3.85, change: 1.30, unit: "$/mile" },
  },
  OVERSIZE: {
    national: { current: 6.50, previous: 6.35, change: 2.36, unit: "$/mile" },
    spot: { current: 7.20, previous: 6.80, change: 5.88, unit: "$/mile" },
    contract: { current: 6.00, previous: 5.90, change: 1.69, unit: "$/mile" },
  },
};

// Top lane rates (like commodity lane benchmarks)
const LANE_BENCHMARKS = [
  { origin: "Los Angeles, CA", destination: "Dallas, TX", miles: 1435, equipment: "DRY_VAN", rate: 2.45, volume: "HIGH", trend: "up", changePercent: 3.2 },
  { origin: "Chicago, IL", destination: "Atlanta, GA", miles: 716, equipment: "DRY_VAN", rate: 2.38, volume: "HIGH", trend: "stable", changePercent: 0.5 },
  { origin: "Houston, TX", destination: "New York, NY", miles: 1628, equipment: "TANKER", rate: 3.65, volume: "MEDIUM", trend: "up", changePercent: 4.1 },
  { origin: "Seattle, WA", destination: "Denver, CO", miles: 1321, equipment: "REEFER", rate: 3.25, volume: "MEDIUM", trend: "up", changePercent: 2.8 },
  { origin: "Miami, FL", destination: "Memphis, TN", miles: 1019, equipment: "DRY_VAN", rate: 2.55, volume: "HIGH", trend: "down", changePercent: -1.2 },
  { origin: "Dallas, TX", destination: "Chicago, IL", miles: 920, equipment: "FLATBED", rate: 2.95, volume: "MEDIUM", trend: "up", changePercent: 3.5 },
  { origin: "Newark, NJ", destination: "Charlotte, NC", miles: 634, equipment: "DRY_VAN", rate: 2.30, volume: "HIGH", trend: "stable", changePercent: 0.8 },
  { origin: "Phoenix, AZ", destination: "El Paso, TX", miles: 427, equipment: "HAZMAT", rate: 4.30, volume: "LOW", trend: "up", changePercent: 5.2 },
  { origin: "Savannah, GA", destination: "Indianapolis, IN", miles: 622, equipment: "DRY_VAN", rate: 2.42, volume: "HIGH", trend: "up", changePercent: 2.1 },
  { origin: "Houston, TX", destination: "Cushing, OK", miles: 498, equipment: "TANKER", rate: 3.80, volume: "HIGH", trend: "up", changePercent: 6.3 },
  { origin: "Midland, TX", destination: "Houston, TX", miles: 502, equipment: "TANKER", rate: 3.55, volume: "VERY_HIGH", trend: "up", changePercent: 7.1 },
  { origin: "Bakken, ND", destination: "Cushing, OK", miles: 1147, equipment: "TANKER", rate: 3.40, volume: "MEDIUM", trend: "stable", changePercent: 1.0 },
];

// Fuel surcharge data (defaults — overridden by live EIA data)
const FUEL_INDEX_DEFAULTS = {
  diesel: { current: 3.89, previous: 3.82, weekAgo: 3.75, monthAgo: 3.62, yearAgo: 4.15 },
  def: { current: 2.95, previous: 2.92, weekAgo: 2.88 },
  surchargePerMile: 0.58,
  eiaDieselAvg: 3.89,
  lastUpdated: new Date().toISOString(),
};

async function getLiveFuelIndex() {
  const snap = await getLiveSnapshot();
  if (snap?.isLiveData && snap.dieselNational) {
    const dieselPrice = snap.dieselNational.price;
    // DOE surcharge formula: (current diesel - $1.25 base) / 6 MPG
    const surchargePerMile = Math.max(0, +((dieselPrice - 1.25) / 6).toFixed(3));
    return {
      diesel: { current: dieselPrice, previous: +(dieselPrice / (1 + snap.dieselNational.change / 100)).toFixed(3), weekAgo: FUEL_INDEX_DEFAULTS.diesel.weekAgo, monthAgo: FUEL_INDEX_DEFAULTS.diesel.monthAgo, yearAgo: FUEL_INDEX_DEFAULTS.diesel.yearAgo },
      def: { current: +(dieselPrice * 0.88 + 0.05).toFixed(3), previous: FUEL_INDEX_DEFAULTS.def.previous, weekAgo: FUEL_INDEX_DEFAULTS.def.weekAgo },
      surchargePerMile,
      eiaDieselAvg: dieselPrice,
      lastUpdated: snap.fetchedAt,
      isLive: true,
    };
  }
  return { ...FUEL_INDEX_DEFAULTS, isLive: false };
}

// Seasonal adjustment factors
const SEASONAL_FACTORS: Record<string, number> = {
  JAN: 0.92, FEB: 0.94, MAR: 0.98, APR: 1.02,
  MAY: 1.05, JUN: 1.08, JUL: 1.06, AUG: 1.04,
  SEP: 1.03, OCT: 1.06, NOV: 1.10, DEC: 1.12,
};

// ===== COMMODITY MARKET DATA =====
// Real commodities transported via freight & energy logistics
// Prices seed from market data — will refine with live API integration over time

interface CommodityData {
  symbol: string;
  name: string;
  category: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  volume: string;
  unit: string;
  intraday: "BULL" | "BEAR" | "FLAT";
  daily: "UP" | "DOWN" | "FLAT";
  weekly: "UP" | "DOWN" | "FLAT";
  monthly: "UP" | "DOWN" | "FLAT";
  sparkline: number[]; // 20-point mini chart
}

function generateSparkline(base: number, trend: "up" | "down" | "flat", timeSeed?: number): number[] {
  const points: number[] = [];
  const s = timeSeed ?? Date.now();
  const pseudoRand = (i: number) => {
    const x = Math.sin(s * 0.001 + i * 127.1) * 43758.5453;
    return x - Math.floor(x);
  };
  let val = base * (0.97 + pseudoRand(0) * 0.03);
  for (let i = 0; i < 20; i++) {
    const drift = trend === "up" ? 0.002 : trend === "down" ? -0.002 : 0;
    val += val * (drift + (pseudoRand(i + 1) - 0.5) * 0.015);
    points.push(+val.toFixed(2));
  }
  return points;
}

const COMMODITIES: CommodityData[] = [
  // === ENERGY === (Feb 2026 baseline estimates)
  { symbol: "CL", name: "WTI Crude Oil", category: "Energy", price: 71.25, change: 0.85, changePercent: 1.21, previousClose: 70.40, open: 70.50, high: 71.60, low: 70.10, volume: "412K", unit: "$/bbl", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "FLAT", sparkline: generateSparkline(71, "up") },
  { symbol: "BZ", name: "Brent Crude", category: "Energy", price: 74.90, change: 0.72, changePercent: 0.97, previousClose: 74.18, open: 74.30, high: 75.20, low: 73.90, volume: "285K", unit: "$/bbl", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "FLAT", sparkline: generateSparkline(75, "up") },
  { symbol: "NG", name: "Natural Gas", category: "Energy", price: 3.680, change: -0.045, changePercent: -1.21, previousClose: 3.725, open: 3.710, high: 3.750, low: 3.660, volume: "198K", unit: "$/MMBtu", intraday: "BEAR", daily: "DOWN", weekly: "FLAT", monthly: "UP", sparkline: generateSparkline(3.68, "down") },
  { symbol: "RB", name: "RBOB Gasoline", category: "Energy", price: 2.1850, change: 0.0280, changePercent: 1.30, previousClose: 2.1570, open: 2.1600, high: 2.2010, low: 2.1500, volume: "87K", unit: "$/gal", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "UP", sparkline: generateSparkline(2.18, "up") },
  { symbol: "HO", name: "Heating Oil", category: "Energy", price: 2.4120, change: 0.0180, changePercent: 0.75, previousClose: 2.3940, open: 2.3960, high: 2.4250, low: 2.3880, volume: "62K", unit: "$/gal", intraday: "BULL", daily: "UP", weekly: "FLAT", monthly: "UP", sparkline: generateSparkline(2.41, "up") },
  { symbol: "ULSD", name: "Ultra-Low Sulfur Diesel", category: "Energy", price: 3.6880, change: -0.0260, changePercent: -0.70, previousClose: 3.7140, open: 3.7100, high: 3.7200, low: 3.6750, volume: "54K", unit: "$/gal", intraday: "BEAR", daily: "DOWN", weekly: "FLAT", monthly: "UP", sparkline: generateSparkline(3.69, "flat") },
  { symbol: "ETH", name: "Ethanol", category: "Energy", price: 1.7200, change: 0.0100, changePercent: 0.58, previousClose: 1.7100, open: 1.7150, high: 1.7280, low: 1.7050, volume: "18K", unit: "$/gal", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "FLAT", sparkline: generateSparkline(1.72, "up") },
  { symbol: "PROP", name: "Propane", category: "Energy", price: 0.8450, change: -0.0120, changePercent: -1.40, previousClose: 0.8570, open: 0.8540, high: 0.8580, low: 0.8400, volume: "22K", unit: "$/gal", intraday: "BEAR", daily: "DOWN", weekly: "DOWN", monthly: "DOWN", sparkline: generateSparkline(0.84, "down") },

  // === METALS === (Feb 2026 baseline estimates)
  { symbol: "GC", name: "Gold", category: "Metals", price: 2905.00, change: 18.50, changePercent: 0.64, previousClose: 2886.50, open: 2888.00, high: 2912.00, low: 2880.00, volume: "178K", unit: "$/oz", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "UP", sparkline: generateSparkline(2905, "up") },
  { symbol: "SI", name: "Silver", category: "Metals", price: 33.25, change: -0.42, changePercent: -1.25, previousClose: 33.67, open: 33.55, high: 33.80, low: 33.10, volume: "92K", unit: "$/oz", intraday: "BEAR", daily: "DOWN", weekly: "FLAT", monthly: "UP", sparkline: generateSparkline(33.2, "down") },
  { symbol: "HG", name: "Copper", category: "Metals", price: 4.4150, change: 0.0550, changePercent: 1.26, previousClose: 4.3600, open: 4.3650, high: 4.4300, low: 4.3500, volume: "102K", unit: "$/lb", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "UP", sparkline: generateSparkline(4.41, "up") },
  { symbol: "ALI", name: "Aluminum", category: "Metals", price: 2615.00, change: -22.00, changePercent: -0.83, previousClose: 2637.00, open: 2630.00, high: 2645.00, low: 2608.00, volume: "58K", unit: "$/ton", intraday: "BEAR", daily: "DOWN", weekly: "DOWN", monthly: "FLAT", sparkline: generateSparkline(2615, "down") },
  { symbol: "STEEL", name: "Steel HRC", category: "Metals", price: 825.00, change: 5.00, changePercent: 0.61, previousClose: 820.00, open: 822.00, high: 830.00, low: 818.00, volume: "8K", unit: "$/ton", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "DOWN", sparkline: generateSparkline(825, "up") },
  { symbol: "NI", name: "Nickel LME", category: "Metals", price: 16850.00, change: -120.00, changePercent: -0.71, previousClose: 16970.00, open: 16920.00, high: 16980.00, low: 16780.00, volume: "12K", unit: "$/ton", intraday: "BEAR", daily: "DOWN", weekly: "FLAT", monthly: "UP", sparkline: generateSparkline(16850, "down") },

  // === AGRICULTURE === (Feb 2026 baseline estimates)
  { symbol: "ZC", name: "Corn", category: "Agriculture", price: 4.1500, change: 0.0325, changePercent: 0.79, previousClose: 4.1175, open: 4.1200, high: 4.1650, low: 4.1100, volume: "210K", unit: "$/bu", intraday: "BULL", daily: "UP", weekly: "FLAT", monthly: "DOWN", sparkline: generateSparkline(4.15, "flat") },
  { symbol: "ZS", name: "Soybeans", category: "Agriculture", price: 10.2500, change: -0.0875, changePercent: -0.85, previousClose: 10.3375, open: 10.3200, high: 10.3600, low: 10.2200, volume: "165K", unit: "$/bu", intraday: "BEAR", daily: "DOWN", weekly: "DOWN", monthly: "DOWN", sparkline: generateSparkline(10.25, "down") },
  { symbol: "ZW", name: "Wheat", category: "Agriculture", price: 5.6200, change: 0.0475, changePercent: 0.85, previousClose: 5.5725, open: 5.5800, high: 5.6500, low: 5.5600, volume: "112K", unit: "$/bu", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "FLAT", sparkline: generateSparkline(5.62, "up") },
  { symbol: "CT", name: "Cotton", category: "Agriculture", price: 0.6750, change: -0.0065, changePercent: -0.95, previousClose: 0.6815, open: 0.6800, high: 0.6830, low: 0.6720, volume: "42K", unit: "$/lb", intraday: "BEAR", daily: "DOWN", weekly: "DOWN", monthly: "DOWN", sparkline: generateSparkline(0.675, "down") },
  { symbol: "SB", name: "Sugar #11", category: "Agriculture", price: 0.1950, change: 0.0018, changePercent: 0.93, previousClose: 0.1932, open: 0.1935, high: 0.1965, low: 0.1925, volume: "88K", unit: "$/lb", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "UP", sparkline: generateSparkline(0.195, "up") },
  { symbol: "KC", name: "Coffee", category: "Agriculture", price: 3.8500, change: 0.0680, changePercent: 1.80, previousClose: 3.7820, open: 3.7900, high: 3.8700, low: 3.7750, volume: "68K", unit: "$/lb", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "UP", sparkline: generateSparkline(3.85, "up") },
  { symbol: "LE", name: "Live Cattle", category: "Agriculture", price: 2.0250, change: 0.0075, changePercent: 0.37, previousClose: 2.0175, open: 2.0190, high: 2.0300, low: 2.0150, volume: "38K", unit: "$/lb", intraday: "BULL", daily: "UP", weekly: "FLAT", monthly: "UP", sparkline: generateSparkline(2.02, "flat") },
  { symbol: "LB", name: "Lumber", category: "Agriculture", price: 548.00, change: -8.50, changePercent: -1.53, previousClose: 556.50, open: 554.00, high: 558.00, low: 545.00, volume: "6K", unit: "$/MBF", intraday: "BEAR", daily: "DOWN", weekly: "DOWN", monthly: "UP", sparkline: generateSparkline(548, "down") },

  // === FREIGHT INDICES ===
  { symbol: "DVAN", name: "Dry Van National", category: "Freight", price: 2.35, change: 0, changePercent: 0, previousClose: 2.35, open: 2.35, high: 2.35, low: 2.35, volume: "N/A", unit: "$/mi", intraday: "FLAT", daily: "FLAT", weekly: "FLAT", monthly: "FLAT", sparkline: generateSparkline(2.35, "flat") },
  { symbol: "REEF", name: "Reefer National", category: "Freight", price: 3.12, change: 0, changePercent: 0, previousClose: 3.12, open: 3.12, high: 3.12, low: 3.12, volume: "N/A", unit: "$/mi", intraday: "FLAT", daily: "FLAT", weekly: "FLAT", monthly: "FLAT", sparkline: generateSparkline(3.12, "flat") },
  { symbol: "FLAT", name: "Flatbed National", category: "Freight", price: 2.85, change: 0, changePercent: 0, previousClose: 2.85, open: 2.85, high: 2.85, low: 2.85, volume: "N/A", unit: "$/mi", intraday: "FLAT", daily: "FLAT", weekly: "FLAT", monthly: "FLAT", sparkline: generateSparkline(2.85, "flat") },
  { symbol: "TANK", name: "Tanker National", category: "Freight", price: 3.45, change: 0, changePercent: 0, previousClose: 3.45, open: 3.45, high: 3.45, low: 3.45, volume: "N/A", unit: "$/mi", intraday: "FLAT", daily: "FLAT", weekly: "FLAT", monthly: "FLAT", sparkline: generateSparkline(3.45, "flat") },
  { symbol: "HAZM", name: "Hazmat National", category: "Freight", price: 4.15, change: 0, changePercent: 0, previousClose: 4.15, open: 4.15, high: 4.15, low: 4.15, volume: "N/A", unit: "$/mi", intraday: "FLAT", daily: "FLAT", weekly: "FLAT", monthly: "FLAT", sparkline: generateSparkline(4.15, "flat") },
  { symbol: "OVER", name: "Oversize National", category: "Freight", price: 6.50, change: 0, changePercent: 0, previousClose: 6.50, open: 6.50, high: 6.50, low: 6.50, volume: "N/A", unit: "$/mi", intraday: "FLAT", daily: "FLAT", weekly: "FLAT", monthly: "FLAT", sparkline: generateSparkline(6.50, "flat") },

  // === FUEL INDEX ===
  { symbol: "DOE", name: "DOE Diesel Avg", category: "Fuel", price: 3.6880, change: 0, changePercent: 0, previousClose: 3.6880, open: 3.6880, high: 3.6880, low: 3.6880, volume: "N/A", unit: "$/gal", intraday: "FLAT", daily: "FLAT", weekly: "FLAT", monthly: "FLAT", sparkline: generateSparkline(3.69, "flat") },
  { symbol: "DEF", name: "DEF Fluid", category: "Fuel", price: 2.9500, change: 0, changePercent: 0, previousClose: 2.9500, open: 2.9500, high: 2.9500, low: 2.9500, volume: "N/A", unit: "$/gal", intraday: "FLAT", daily: "FLAT", weekly: "FLAT", monthly: "FLAT", sparkline: generateSparkline(2.95, "flat") },
  { symbol: "FSC", name: "Fuel Surcharge/Mi", category: "Fuel", price: 0.4060, change: 0, changePercent: 0, previousClose: 0.4060, open: 0.4060, high: 0.4060, low: 0.4060, volume: "N/A", unit: "$/mi", intraday: "FLAT", daily: "FLAT", weekly: "FLAT", monthly: "FLAT", sparkline: generateSparkline(0.41, "flat") },
];

export const marketPricingRouter = router({
  // === LIVE GOVERNMENT DATA FEEDS ===
  // Pulls real data from FRED, EIA, BLS — falls back to seed when API keys not configured

  getMarketIntelligence: protectedProcedure
    .input(z.object({
      region: z.string().default("national"),
    }).optional())
    .query(async () => {
      try {
        const snapshot = await getLiveSnapshot();
        if (!snapshot) throw new Error("No snapshot available");

        // If we got live data, overlay it onto the seed commodity list
        if (snapshot.isLiveData) {
          // Update seed commodities with real values where available
          const updates: Record<string, Partial<CommodityData>> = {};

          if (snapshot.crudeOilWTI) {
            updates["CL"] = { price: snapshot.crudeOilWTI.price, changePercent: snapshot.crudeOilWTI.change, change: +(snapshot.crudeOilWTI.price * snapshot.crudeOilWTI.change / 100).toFixed(2) };
          }
          if (snapshot.naturalGas) {
            updates["NG"] = { price: snapshot.naturalGas.price, changePercent: snapshot.naturalGas.change, change: +(snapshot.naturalGas.price * snapshot.naturalGas.change / 100).toFixed(4) };
          }
          if (snapshot.dieselNational) {
            updates["ULSD"] = { price: snapshot.dieselNational.price, changePercent: snapshot.dieselNational.change, change: +(snapshot.dieselNational.price * snapshot.dieselNational.change / 100).toFixed(4) };
            updates["DOE"] = { price: snapshot.dieselNational.price, changePercent: snapshot.dieselNational.change, change: +(snapshot.dieselNational.price * snapshot.dieselNational.change / 100).toFixed(4) };
          }

          // Overlay Yahoo Finance real-time data for all matching symbols
          const yq = snapshot.yahooQuotes || {};
          for (const sym of Object.keys(yq)) {
            if (!updates[sym]) {
              updates[sym] = { price: yq[sym].price, changePercent: yq[sym].changePercent, change: yq[sym].change };
            }
          }

          // Overlay CommodityPriceAPI (highest priority — 60s updates)
          const cpapi = snapshot.cpapiQuotes || {};
          for (const sym of Object.keys(cpapi)) {
            if (cpapi[sym] > 0) {
              const existing = updates[sym];
              updates[sym] = { price: cpapi[sym], changePercent: existing?.changePercent || 0, change: existing?.change || 0 };
            }
          }

          return {
            snapshot,
            liveOverrides: updates,
            ppiTrends: snapshot.truckingPPI?.history || [],
            dieselByRegion: snapshot.dieselByRegion,
            source: snapshot.source,
            isLive: true,
          };
        }

        return {
          snapshot: null,
          liveOverrides: {},
          ppiTrends: [],
          dieselByRegion: [],
          source: "EusoTrip Seed Data — Configure FRED_API_KEY, EIA_API_KEY for live government data",
          isLive: false,
        };
      } catch (err) {
        console.error("Market intelligence fetch error:", err);
        return {
          snapshot: null,
          liveOverrides: {},
          ppiTrends: [],
          dieselByRegion: [],
          source: "EusoTrip Seed Data (API error)",
          isLive: false,
        };
      }
    }),

  // Get all commodity market data — LIVE from CommodityPriceAPI + Yahoo + FRED/EIA
  getCommodities: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      // Fetch live data + yesterday's prices + real freight rates in parallel
      const [snap, yesterdayPrices, dbFreight] = await Promise.all([
        getLiveSnapshot(),
        getYesterdayPrices(),
        getRealFreightRates(),
      ]);

      const cpapi = snap?.cpapiQuotes || {};
      const yq = snap?.yahooQuotes || {};
      const hasLive = snap?.isLiveData || false;

      // === BUILD LIVE PRICE MAP ===
      // For each commodity, compute: best price, real change from yesterday, source
      const livePrices: Record<string, { price: number; changePct: number; changeAmt: number; prevClose: number; open: number; high: number; low: number; volume: string; source: string }> = {};

      // Layer 1: FRED/EIA government data
      if (snap?.crudeOilWTI) livePrices["CL"] = { price: snap.crudeOilWTI.price, changePct: snap.crudeOilWTI.change, changeAmt: +(snap.crudeOilWTI.price * snap.crudeOilWTI.change / 100).toFixed(2), prevClose: +(snap.crudeOilWTI.price / (1 + snap.crudeOilWTI.change / 100)).toFixed(2), open: 0, high: 0, low: 0, volume: "N/A", source: "FRED" };
      if (snap?.naturalGas) livePrices["NG"] = { price: snap.naturalGas.price, changePct: snap.naturalGas.change, changeAmt: +(snap.naturalGas.price * snap.naturalGas.change / 100).toFixed(4), prevClose: +(snap.naturalGas.price / (1 + snap.naturalGas.change / 100)).toFixed(4), open: 0, high: 0, low: 0, volume: "N/A", source: "FRED" };
      if (snap?.dieselNational) {
        livePrices["ULSD"] = { price: snap.dieselNational.price, changePct: snap.dieselNational.change, changeAmt: +(snap.dieselNational.price * snap.dieselNational.change / 100).toFixed(4), prevClose: +(snap.dieselNational.price / (1 + snap.dieselNational.change / 100)).toFixed(4), open: 0, high: 0, low: 0, volume: "N/A", source: "EIA" };
        livePrices["DOE"] = { ...livePrices["ULSD"], source: "EIA" };
      }

      // Layer 2: Yahoo Finance (real-time OHLCV)
      for (const [sym, q] of Object.entries(yq)) {
        livePrices[sym] = {
          price: q.price, changePct: q.changePercent, changeAmt: q.change,
          prevClose: q.prevClose, open: q.open, high: q.high, low: q.low,
          volume: q.volume > 1000 ? `${Math.round(q.volume / 1000)}K` : String(q.volume),
          source: "Yahoo",
        };
      }

      // Layer 3: CommodityPriceAPI (highest priority — 60-sec updates)
      // Compute REAL change% from yesterday's historical prices
      for (const [sym, price] of Object.entries(cpapi)) {
        if (price > 0) {
          const yestPrice = yesterdayPrices[sym];
          const existing = livePrices[sym];
          let changePct = existing?.changePct || 0;
          let changeAmt = existing?.changeAmt || 0;
          let prevClose = existing?.prevClose || 0;

          if (yestPrice && yestPrice > 0) {
            // Real change from yesterday's close
            changePct = +((price - yestPrice) / yestPrice * 100).toFixed(2);
            changeAmt = +(price - yestPrice).toFixed(price >= 100 ? 2 : 4);
            prevClose = yestPrice;
          }

          livePrices[sym] = {
            price, changePct, changeAmt, prevClose,
            open: existing?.open || +(price - changeAmt * 0.3).toFixed(4),
            high: existing?.high || +(price * 1.003).toFixed(4),
            low: existing?.low || +(price * 0.997).toFixed(4),
            volume: existing?.volume || "N/A",
            source: "CommodityPriceAPI",
          };
        }
      }

      // === APPLY LIVE PRICES TO COMMODITIES ===
      let all: CommodityData[] = COMMODITIES.map(c => {
        const live = livePrices[c.symbol];
        if (!live) return c; // Keep seed data for symbols with no live source
        return {
          ...c,
          price: live.price,
          change: live.changeAmt,
          changePercent: live.changePct,
          previousClose: live.prevClose || +(live.price - live.changeAmt).toFixed(4),
          open: live.open || c.open,
          high: live.high || c.high,
          low: live.low || c.low,
          volume: live.volume || c.volume,
          intraday: live.changePct > 0.5 ? "BULL" as const : live.changePct < -0.5 ? "BEAR" as const : "FLAT" as const,
          daily: live.changePct > 0 ? "UP" as const : live.changePct < 0 ? "DOWN" as const : "FLAT" as const,
          weekly: live.changePct > 1 ? "UP" as const : live.changePct < -1 ? "DOWN" as const : c.weekly,
          sparkline: generateSparkline(live.price, live.changePct > 0.5 ? "up" : live.changePct < -0.5 ? "down" : "flat"),
        };
      });

      // === FREIGHT INDICES FROM REAL DB DATA ===
      // Map cargoType enum values to our display symbols
      const freightSymMap: Record<string, { sym: string; name: string }> = {
        general: { sym: "DVAN", name: "Dry Van National" },
        hazmat: { sym: "HAZM", name: "Hazmat National" },
        refrigerated: { sym: "REEF", name: "Reefer National" },
        oversized: { sym: "OVER", name: "Oversize National" },
        liquid: { sym: "TANK", name: "Tanker National" },
        petroleum: { sym: "TANK", name: "Tanker National" },
        chemicals: { sym: "HAZM", name: "Hazmat National" },
        gas: { sym: "TANK", name: "Tanker National" },
      };

      const dbUpdated = new Set<string>();
      for (const [eqType, data] of Object.entries(dbFreight)) {
        const mapping = freightSymMap[eqType.toLowerCase()];
        if (mapping && !dbUpdated.has(mapping.sym)) {
          dbUpdated.add(mapping.sym);
          const changePct = data.prevRate > 0 ? +((data.rate - data.prevRate) / data.prevRate * 100).toFixed(2) : 0;
          const changeAmt = +(data.rate - data.prevRate).toFixed(4);
          all = all.map(c => c.symbol === mapping.sym ? {
            ...c,
            price: +data.rate.toFixed(4),
            change: changeAmt,
            changePercent: changePct,
            previousClose: +data.prevRate.toFixed(4),
            volume: `${data.count} loads`,
            intraday: changePct > 0.5 ? "BULL" as const : changePct < -0.5 ? "BEAR" as const : "FLAT" as const,
            daily: changePct > 0 ? "UP" as const : changePct < 0 ? "DOWN" as const : "FLAT" as const,
            sparkline: generateSparkline(data.rate, changePct > 0.5 ? "up" : changePct < -0.5 ? "down" : "flat"),
          } : c);
        }
      }

      // === FUEL INDICES FROM LIVE EIA ===
      const liveFuel = await getLiveFuelIndex();
      if (liveFuel.isLive) {
        all = all.map(c => {
          if (c.symbol === "FSC") {
            const prev = liveFuel.diesel.previous > 0 ? +((liveFuel.diesel.previous - 1.25) / 6).toFixed(3) : c.previousClose;
            const changeAmt = +(liveFuel.surchargePerMile - prev).toFixed(4);
            const changePct = prev > 0 ? +((changeAmt / prev) * 100).toFixed(2) : 0;
            return { ...c, price: liveFuel.surchargePerMile, previousClose: prev, change: changeAmt, changePercent: changePct, intraday: changePct > 0.5 ? "BULL" as const : changePct < -0.5 ? "BEAR" as const : "FLAT" as const, daily: changePct > 0 ? "UP" as const : changePct < 0 ? "DOWN" as const : "FLAT" as const, sparkline: generateSparkline(liveFuel.surchargePerMile, changePct > 0.5 ? "up" : changePct < -0.5 ? "down" : "flat") };
          }
          if (c.symbol === "DEF") {
            const prev = liveFuel.def.previous > 0 ? liveFuel.def.previous : c.previousClose;
            const changeAmt = +(liveFuel.def.current - prev).toFixed(4);
            const changePct = prev > 0 ? +((changeAmt / prev) * 100).toFixed(2) : 0;
            return { ...c, price: liveFuel.def.current, previousClose: prev, change: changeAmt, changePercent: changePct, intraday: changePct > 0.5 ? "BULL" as const : changePct < -0.5 ? "BEAR" as const : "FLAT" as const, daily: changePct > 0 ? "UP" as const : changePct < 0 ? "DOWN" as const : "FLAT" as const, sparkline: generateSparkline(liveFuel.def.current, changePct > 0.5 ? "up" : changePct < -0.5 ? "down" : "flat") };
          }
          return c;
        });
      }

      // === FILTER + SORT ===
      let data = [...all];
      if (input?.category && input.category !== "ALL") {
        data = data.filter(c => c.category === input.category);
      }
      if (input?.search) {
        const q = input.search.toLowerCase();
        data = data.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
      }

      const categories = Array.from(new Set(all.map(c => c.category)));
      const gainers = [...all].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
      const losers = [...all].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);

      const liveCount = Object.keys(livePrices).length;
      const dbFreightCount = Object.keys(dbFreight).length;

      return {
        commodities: data,
        categories,
        topGainers: gainers,
        topLosers: losers,
        marketBreadth: {
          advancing: all.filter(c => c.changePercent > 0).length,
          declining: all.filter(c => c.changePercent < 0).length,
          unchanged: all.filter(c => c.changePercent === 0).length,
        },
        lastUpdated: snap?.fetchedAt || new Date().toISOString(),
        isLiveData: hasLive || liveCount > 0,
        source: hasLive
          ? `${snap?.source}${dbFreightCount > 0 ? " + Platform Loads" : ""} · ${liveCount} live prices`
          : dbFreightCount > 0 ? `Platform Loads (${dbFreightCount} equipment types)` : "Seed Data",
      };
    }),

  // Get market indices (Platts/Argus-style benchmark rates)
  getIndices: protectedProcedure
    .input(z.object({
      equipment: z.string().optional(),
      timeframe: z.enum(["daily", "weekly", "monthly", "quarterly"]).default("daily"),
    }).optional())
    .query(async ({ input }) => {
      const equipment = input?.equipment;
      const indices = equipment && equipment in FREIGHT_INDICES
        ? { [equipment]: FREIGHT_INDICES[equipment as keyof typeof FREIGHT_INDICES] }
        : FREIGHT_INDICES;

      const currentMonth = new Date().toLocaleString('en', { month: 'short' }).toUpperCase();
      const seasonalFactor = SEASONAL_FACTORS[currentMonth] || 1.0;

      const liveFuel = await getLiveFuelIndex();

      return {
        indices,
        fuel: liveFuel,
        seasonalFactor,
        marketCondition: seasonalFactor > 1.05 ? "TIGHT" : seasonalFactor < 0.96 ? "LOOSE" : "BALANCED",
        publishedAt: new Date().toISOString(),
        source: "EusoTrip Market Intelligence",
        nextUpdate: "Daily at 06:00 CT",
      };
    }),

  // Get lane rate benchmarks
  getLaneBenchmarks: protectedProcedure
    .input(z.object({
      origin: z.string().optional(),
      destination: z.string().optional(),
      equipment: z.string().optional(),
      limit: z.number().default(20),
    }).optional())
    .query(async ({ input }) => {
      let lanes = [...LANE_BENCHMARKS];

      if (input?.origin) {
        lanes = lanes.filter(l => l.origin.toLowerCase().includes(input.origin!.toLowerCase()));
      }
      if (input?.destination) {
        lanes = lanes.filter(l => l.destination.toLowerCase().includes(input.destination!.toLowerCase()));
      }
      if (input?.equipment) {
        lanes = lanes.filter(l => l.equipment === input.equipment);
      }

      const liveFuel = await getLiveFuelIndex();

      return {
        lanes: lanes.slice(0, input?.limit || 20).map(lane => ({
          ...lane,
          totalRate: Math.round(lane.rate * lane.miles),
          rateWithFuel: +(lane.rate + liveFuel.surchargePerMile).toFixed(2),
          marginEstimate: +(lane.rate * 0.15).toFixed(2),
          driverPayEstimate: +(lane.rate * 0.72).toFixed(2),
        })),
        totalLanes: lanes.length,
        averageRate: +(lanes.reduce((sum, l) => sum + l.rate, 0) / lanes.length).toFixed(2),
        fuelSurcharge: liveFuel.surchargePerMile,
      };
    }),

  // Calculate rate for a specific lane (smart pricing engine)
  calculateRate: protectedProcedure
    .input(z.object({
      originCity: z.string(),
      originState: z.string(),
      destinationCity: z.string(),
      destinationState: z.string(),
      miles: z.number().min(1),
      equipment: z.string(),
      weight: z.number().optional(),
      hazmat: z.boolean().default(false),
      oversizePermit: z.boolean().default(false),
      expedited: z.boolean().default(false),
      teamRequired: z.boolean().default(false),
      pickupDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const baseIndex = FREIGHT_INDICES[input.equipment as keyof typeof FREIGHT_INDICES]
        || FREIGHT_INDICES.DRY_VAN;

      let baseRate = baseIndex.national.current;

      // Apply modifiers
      if (input.hazmat) baseRate *= 1.35;
      if (input.oversizePermit) baseRate *= 1.55;
      if (input.expedited) baseRate *= 1.40;
      if (input.teamRequired) baseRate *= 1.25;

      // Seasonal adjustment
      const month = input.pickupDate
        ? new Date(input.pickupDate).toLocaleString('en', { month: 'short' }).toUpperCase()
        : new Date().toLocaleString('en', { month: 'short' }).toUpperCase();
      const seasonal = SEASONAL_FACTORS[month] || 1.0;
      baseRate *= seasonal;

      // Distance adjustment (shorter hauls cost more per mile)
      if (input.miles < 250) baseRate *= 1.25;
      else if (input.miles < 500) baseRate *= 1.10;
      else if (input.miles > 2000) baseRate *= 0.92;

      const liveFuel = await getLiveFuelIndex();

      const ratePerMile = +baseRate.toFixed(2);
      const totalRate = Math.round(ratePerMile * input.miles);
      const fuelSurcharge = Math.round(liveFuel.surchargePerMile * input.miles);

      return {
        ratePerMile,
        totalRate,
        fuelSurcharge,
        allInRate: totalRate + fuelSurcharge,
        allInPerMile: +((totalRate + fuelSurcharge) / input.miles).toFixed(2),
        breakdown: {
          lineHaul: totalRate,
          fuelSurcharge,
          hazmatPremium: input.hazmat ? Math.round(totalRate * 0.35) : 0,
          oversizePremium: input.oversizePermit ? Math.round(totalRate * 0.55) : 0,
          expeditedPremium: input.expedited ? Math.round(totalRate * 0.40) : 0,
          teamPremium: input.teamRequired ? Math.round(totalRate * 0.25) : 0,
        },
        confidence: "HIGH",
        marketPosition: ratePerMile > baseIndex.spot.current ? "ABOVE_MARKET" :
          ratePerMile < baseIndex.contract.current ? "BELOW_MARKET" : "AT_MARKET",
        comparisons: {
          spotRate: baseIndex.spot.current,
          contractRate: baseIndex.contract.current,
          nationalAvg: baseIndex.national.current,
        },
        roleInsights: {
          shipper: {
            costPerUnit: input.weight ? +((totalRate + fuelSurcharge) / (input.weight / 1000)).toFixed(2) : null,
            budgetImpact: "Within market range",
            savingOpportunity: totalRate > baseIndex.contract.current * input.miles
              ? `Save $${Math.round((ratePerMile - baseIndex.contract.current) * input.miles)} with contract rate`
              : null,
          },
          catalyst: {
            revenuePerMile: ratePerMile,
            estimatedProfit: Math.round(totalRate * 0.18),
            profitMargin: "18%",
            fuelCostEstimate: Math.round(input.miles * 0.65),
          },
          broker: {
            suggestedMargin: +(ratePerMile * 0.12).toFixed(2),
            buyRate: +(ratePerMile * 0.88).toFixed(2),
            sellRate: ratePerMile,
            commission: Math.round(totalRate * 0.12),
          },
          driver: {
            takeHome: +(ratePerMile * 0.72).toFixed(2),
            estimatedEarnings: Math.round(totalRate * 0.72),
            perDiem: Math.ceil(input.miles / 500) * 69,
            totalCompensation: Math.round(totalRate * 0.72) + (Math.ceil(input.miles / 500) * 69),
          },
        },
        calculatedAt: new Date().toISOString(),
      };
    }),

  // Get historical rate trends for a lane
  getRateTrends: protectedProcedure
    .input(z.object({
      origin: z.string().optional(),
      destination: z.string().optional(),
      equipment: z.string().default("DRY_VAN"),
      period: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
    }))
    .query(async ({ input }) => {
      const baseRate = FREIGHT_INDICES[input.equipment as keyof typeof FREIGHT_INDICES]?.national.current || 2.35;
      const days = input.period === "7d" ? 7 : input.period === "30d" ? 30 : input.period === "90d" ? 90 : 365;
      const startDate = new Date(Date.now() - days * 86400000);

      // Try to get real rate data from delivered loads
      let dbRates: Array<{ date: string; avgRate: number; count: number }> = [];
      try {
        const { getDb } = await import("../db");
        const { loads } = await import("../../drizzle/schema");
        const { sql, gte, and } = await import("drizzle-orm");
        const db = await getDb();
        if (db) {
          const rows = await db.select({
            day: sql<string>`DATE(${loads.createdAt})`,
            avgRate: sql<number>`ROUND(AVG(CAST(${loads.rate} AS DECIMAL) / NULLIF(CAST(${loads.distance} AS DECIMAL), 0)), 2)`,
            count: sql<number>`COUNT(*)`,
          }).from(loads).where(and(
            gte(loads.createdAt, startDate),
            sql`${loads.rate} > 0`,
            sql`${loads.distance} > 0`,
          )).groupBy(sql`DATE(${loads.createdAt})`).orderBy(sql`DATE(${loads.createdAt})`);
          dbRates = rows.map(r => ({ date: String(r.day), avgRate: r.avgRate || 0, count: r.count || 0 }));
        }
      } catch { /* fall through to seed-based trends */ }

      // Build data points: use real DB rates where available, fill gaps with base rate
      const rateMap = new Map(dbRates.map(r => [r.date, r.avgRate]));
      const dataPoints = [];
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const dbRate = rateMap.get(dateStr);
        const trend = (days - i) / days * 0.15;
        const spotRate = dbRate ? +dbRate.toFixed(2) : +(baseRate + trend + 0.15).toFixed(2);
        const contractRate = dbRate ? +(dbRate * 0.92).toFixed(2) : +(baseRate + trend - 0.10).toFixed(2);
        const nationalAvg = dbRate ? +(dbRate * 0.97).toFixed(2) : +(baseRate + trend).toFixed(2);
        dataPoints.push({ date: dateStr, spotRate, contractRate, nationalAvg });
      }

      return {
        trends: dataPoints,
        summary: {
          spotHigh: Math.max(...dataPoints.map(d => d.spotRate)),
          spotLow: Math.min(...dataPoints.map(d => d.spotRate)),
          spotAvg: +(dataPoints.reduce((s, d) => s + d.spotRate, 0) / dataPoints.length).toFixed(2),
          contractAvg: +(dataPoints.reduce((s, d) => s + d.contractRate, 0) / dataPoints.length).toFixed(2),
          volatility: +(Math.max(...dataPoints.map(d => d.spotRate)) - Math.min(...dataPoints.map(d => d.spotRate))).toFixed(2),
          trendDirection: dataPoints[dataPoints.length - 1].spotRate > dataPoints[0].spotRate ? "RISING" : "FALLING",
        },
        equipment: input.equipment,
        period: input.period,
        hasRealData: dbRates.length > 0,
        dataPointsFromDB: dbRates.length,
      };
    }),

  // Get fuel price index — live from EIA
  getFuelIndex: protectedProcedure.query(async () => {
    return getLiveFuelIndex();
  }),

  // Search/lookup any commodity or ticker — queries CommodityPriceAPI + local seed data
  searchCommodity: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      const q = input.query.toLowerCase();

      // Search local seed data first
      const localMatches = COMMODITIES
        .filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
        .map(c => ({ symbol: c.symbol, name: c.name, price: c.price, category: c.category, unit: c.unit, changePercent: c.changePercent, source: "local" as const }));

      // Also search CommodityPriceAPI for symbols not in our seed data
      let apiMatches: Array<{ symbol: string; name: string; price: number; category: string; unit: string; changePercent: number; source: "api" }> = [];
      try {
        const apiResults = await searchCommodityPriceAPI(input.query);
        apiMatches = apiResults
          .filter(r => !localMatches.find(l => l.symbol === r.symbol))
          .map(r => ({
            symbol: r.symbol,
            name: r.name || r.symbol,
            price: r.price,
            category: "External",
            unit: "USD",
            changePercent: 0,
            source: "api" as const,
          }));
      } catch { /* CommodityPriceAPI search failed, use local only */ }

      // Also search Yahoo Finance for stocks, ETFs, and any other tickers
      let yahooMatches: typeof apiMatches = [];
      try {
        const yResults = await searchYahooFinance(input.query);
        yahooMatches = yResults
          .filter(r => !localMatches.find(l => l.symbol === r.symbol) && !apiMatches.find(a => a.symbol === r.symbol))
          .map(r => ({
            symbol: r.symbol,
            name: r.name,
            price: r.price,
            category: r.category,
            unit: "USD",
            changePercent: r.changePercent,
            source: "api" as const,
          }));
      } catch { /* Yahoo Finance search failed */ }

      const allApi = [...apiMatches, ...yahooMatches];
      return {
        results: [...localMatches, ...allApi].slice(0, 25),
        totalLocal: localMatches.length,
        totalApi: allApi.length,
      };
    }),

  // Get a single commodity quote from all sources (cross-referenced)
  getQuote: protectedProcedure
    .input(z.object({ symbol: z.string() }))
    .query(async ({ input }) => {
      const sym = input.symbol.toUpperCase();

      // Check seed data
      const seed = COMMODITIES.find(c => c.symbol === sym);

      // Check live snapshot
      const snap = await getLiveSnapshot();
      const yq = snap?.yahooQuotes?.[sym];
      const cpapi = snap?.cpapiQuotes?.[sym];
      const cpapiMapped = CPAPI_SYMBOL_MAP[sym];

      // Also try direct CommodityPriceAPI fetch for the specific symbol
      let directPrice: number | null = null;
      if (cpapiMapped) {
        try {
          const rates = await fetchCommodityPriceAPI([cpapiMapped]);
          directPrice = rates[cpapiMapped] || null;
        } catch { /* ignore */ }
      }

      // Direct Yahoo Finance lookup for any ticker (stocks, ETFs, etc.)
      let directYahoo: { price: number; change: number; changePercent: number; high: number; low: number; open: number; prevClose: number; volume: number; name: string; category: string } | null = null;
      if (!seed && !directPrice && !cpapi && !yq) {
        try {
          const yResults = await searchYahooFinance(sym);
          const match = yResults.find(r => r.symbol === sym);
          if (match) {
            directYahoo = { price: match.price, change: match.change, changePercent: match.changePercent, high: 0, low: 0, open: 0, prevClose: 0, volume: 0, name: match.name, category: match.category };
          }
        } catch { /* ignore */ }
      }

      // Cross-reference: pick best price
      const bestPrice = directPrice || cpapi || (yq ? yq.price : null) || (directYahoo ? directYahoo.price : null) || (seed ? seed.price : null);

      return {
        symbol: sym,
        name: directYahoo?.name || seed?.name || sym,
        price: bestPrice,
        change: yq?.change || directYahoo?.change || seed?.change || 0,
        changePercent: yq?.changePercent || directYahoo?.changePercent || seed?.changePercent || 0,
        high: yq?.high || seed?.high || 0,
        low: yq?.low || seed?.low || 0,
        open: yq?.open || seed?.open || 0,
        previousClose: yq?.prevClose || seed?.previousClose || 0,
        volume: yq ? (yq.volume > 1000 ? `${Math.round(yq.volume / 1000)}K` : String(yq.volume)) : seed?.volume || "N/A",
        category: directYahoo?.category || seed?.category || "External",
        unit: seed?.unit || "USD",
        sparkline: seed?.sparkline || [],
        intraday: seed?.intraday || (directYahoo && directYahoo.changePercent > 0.5 ? "BULL" : directYahoo && directYahoo.changePercent < -0.5 ? "BEAR" : "FLAT"),
        daily: seed?.daily || (directYahoo && directYahoo.changePercent > 0 ? "UP" : directYahoo && directYahoo.changePercent < 0 ? "DOWN" : "FLAT"),
        weekly: seed?.weekly || "FLAT",
        monthly: seed?.monthly || "FLAT",
        sources: {
          commodityPriceAPI: directPrice || cpapi || null,
          yahooFinance: yq ? yq.price : directYahoo ? directYahoo.price : null,
          fredEia: snap?.crudeOilWTI && sym === "CL" ? snap.crudeOilWTI.price : snap?.naturalGas && sym === "NG" ? snap.naturalGas.price : null,
          seed: seed?.price || null,
        },
        bestSource: directPrice || cpapi ? "CommodityPriceAPI" : yq || directYahoo ? "Yahoo Finance" : "Seed Data",
      };
    }),

  // Get market summary for dashboard widgets — live data
  getMarketSummary: protectedProcedure.query(async () => {
    const equipmentTypes = Object.keys(FREIGHT_INDICES) as Array<keyof typeof FREIGHT_INDICES>;
    const liveFuel = await getLiveFuelIndex();
    const snap = await getLiveSnapshot();
    return {
      overview: {
        avgNationalRate: +(equipmentTypes.reduce((s, k) => s + FREIGHT_INDICES[k].national.current, 0) / equipmentTypes.length).toFixed(2),
        avgSpotRate: +(equipmentTypes.reduce((s, k) => s + FREIGHT_INDICES[k].spot.current, 0) / equipmentTypes.length).toFixed(2),
        marketCondition: "BALANCED",
        loadToTruckRatio: 5.8,
        dieselPrice: liveFuel.diesel.current,
        crudeOilWTI: snap?.crudeOilWTI?.price || 78.50,
        naturalGas: snap?.naturalGas?.price || 2.85,
        isLiveData: snap?.isLiveData || false,
      },
      topMovers: LANE_BENCHMARKS
        .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
        .slice(0, 5)
        .map(l => ({
          lane: `${l.origin.split(",")[0]} → ${l.destination.split(",")[0]}`,
          rate: l.rate,
          change: l.changePercent,
          trend: l.trend,
        })),
      equipmentRates: equipmentTypes.map(k => ({
        type: k,
        spot: FREIGHT_INDICES[k].spot.current,
        contract: FREIGHT_INDICES[k].contract.current,
        change: FREIGHT_INDICES[k].national.change,
      })),
      lastUpdated: snap?.fetchedAt || new Date().toISOString(),
      isLiveData: snap?.isLiveData || false,
      source: snap?.source || "Seed Data",
    };
  }),
});
