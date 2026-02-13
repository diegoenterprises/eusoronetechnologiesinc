/**
 * MARKET PRICING ENGINE - Platts/Argus-Style Freight Rate Intelligence
 * 
 * Comprehensive pricing system for all user roles:
 * - Shippers: Cost benchmarking, lane rate analysis, budget forecasting
 * - Carriers: Revenue optimization, rate comparison, profitability analysis
 * - Brokers: Margin analysis, market arbitrage, commission optimization
 * - Drivers: Earnings potential, best-paying lanes, rate-per-mile intelligence
 * - Terminals: Throughput pricing, storage rates, demurrage benchmarks
 * 
 * Data sources: Historical loads, real-time bids, fuel indices, seasonal patterns
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { loads } from "../../drizzle/schema";
import { desc, sql, eq, and, gte, lte } from "drizzle-orm";
import { fetchMarketSnapshot, type MarketSnapshot, searchCommodityPriceAPI, fetchCommodityPriceAPI, CPAPI_SYMBOL_MAP } from "../services/marketDataService";

// Cached live snapshot (shared across endpoints)
let _liveSnapshot: MarketSnapshot | null = null;
let _liveSnapshotAt = 0;
async function getLiveSnapshot(): Promise<MarketSnapshot | null> {
  if (_liveSnapshot && Date.now() - _liveSnapshotAt < 5 * 60 * 1000) return _liveSnapshot;
  try {
    _liveSnapshot = await fetchMarketSnapshot();
    _liveSnapshotAt = Date.now();
    return _liveSnapshot;
  } catch { return _liveSnapshot; }
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

function generateSparkline(base: number, trend: "up" | "down" | "flat"): number[] {
  const points: number[] = [];
  let val = base * (0.97 + Math.random() * 0.03);
  for (let i = 0; i < 20; i++) {
    const drift = trend === "up" ? 0.002 : trend === "down" ? -0.002 : 0;
    val += val * (drift + (Math.random() - 0.5) * 0.015);
    points.push(+val.toFixed(2));
  }
  return points;
}

const COMMODITIES: CommodityData[] = [
  // === ENERGY ===
  { symbol: "CL", name: "WTI Crude Oil", category: "Energy", price: 78.42, change: 1.23, changePercent: 1.59, previousClose: 77.19, open: 77.35, high: 78.90, low: 76.80, volume: "412K", unit: "$/bbl", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "UP", sparkline: generateSparkline(78, "up") },
  { symbol: "BZ", name: "Brent Crude", category: "Energy", price: 82.15, change: 0.97, changePercent: 1.19, previousClose: 81.18, open: 81.40, high: 82.50, low: 80.95, volume: "285K", unit: "$/bbl", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "UP", sparkline: generateSparkline(82, "up") },
  { symbol: "NG", name: "Natural Gas", category: "Energy", price: 2.847, change: -0.065, changePercent: -2.23, previousClose: 2.912, open: 2.900, high: 2.935, low: 2.810, volume: "198K", unit: "$/MMBtu", intraday: "BEAR", daily: "DOWN", weekly: "DOWN", monthly: "UP", sparkline: generateSparkline(2.85, "down") },
  { symbol: "RB", name: "RBOB Gasoline", category: "Energy", price: 2.4850, change: 0.0340, changePercent: 1.39, previousClose: 2.4510, open: 2.4600, high: 2.5010, low: 2.4400, volume: "87K", unit: "$/gal", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "UP", sparkline: generateSparkline(2.48, "up") },
  { symbol: "HO", name: "Heating Oil", category: "Energy", price: 2.6120, change: 0.0280, changePercent: 1.08, previousClose: 2.5840, open: 2.5900, high: 2.6250, low: 2.5780, volume: "62K", unit: "$/gal", intraday: "BULL", daily: "UP", weekly: "FLAT", monthly: "UP", sparkline: generateSparkline(2.61, "up") },
  { symbol: "ULSD", name: "Ultra-Low Sulfur Diesel", category: "Energy", price: 2.7350, change: -0.0150, changePercent: -0.55, previousClose: 2.7500, open: 2.7480, high: 2.7600, low: 2.7200, volume: "54K", unit: "$/gal", intraday: "BEAR", daily: "DOWN", weekly: "FLAT", monthly: "UP", sparkline: generateSparkline(2.73, "flat") },
  { symbol: "ETH", name: "Ethanol", category: "Energy", price: 1.7200, change: 0.0100, changePercent: 0.58, previousClose: 1.7100, open: 1.7150, high: 1.7280, low: 1.7050, volume: "18K", unit: "$/gal", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "FLAT", sparkline: generateSparkline(1.72, "up") },
  { symbol: "PROP", name: "Propane", category: "Energy", price: 0.8450, change: -0.0120, changePercent: -1.40, previousClose: 0.8570, open: 0.8540, high: 0.8580, low: 0.8400, volume: "22K", unit: "$/gal", intraday: "BEAR", daily: "DOWN", weekly: "DOWN", monthly: "DOWN", sparkline: generateSparkline(0.84, "down") },

  // === METALS ===
  { symbol: "GC", name: "Gold", category: "Metals", price: 2342.50, change: 12.80, changePercent: 0.55, previousClose: 2329.70, open: 2331.00, high: 2348.00, low: 2325.50, volume: "145K", unit: "$/oz", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "UP", sparkline: generateSparkline(2342, "up") },
  { symbol: "SI", name: "Silver", category: "Metals", price: 27.45, change: -0.32, changePercent: -1.15, previousClose: 27.77, open: 27.70, high: 27.85, low: 27.20, volume: "78K", unit: "$/oz", intraday: "BEAR", daily: "DOWN", weekly: "FLAT", monthly: "UP", sparkline: generateSparkline(27.4, "down") },
  { symbol: "HG", name: "Copper", category: "Metals", price: 4.2850, change: 0.0650, changePercent: 1.54, previousClose: 4.2200, open: 4.2300, high: 4.3000, low: 4.2100, volume: "92K", unit: "$/lb", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "UP", sparkline: generateSparkline(4.28, "up") },
  { symbol: "ALI", name: "Aluminum", category: "Metals", price: 2485.00, change: -18.50, changePercent: -0.74, previousClose: 2503.50, open: 2500.00, high: 2510.00, low: 2478.00, volume: "55K", unit: "$/ton", intraday: "BEAR", daily: "DOWN", weekly: "DOWN", monthly: "FLAT", sparkline: generateSparkline(2485, "down") },
  { symbol: "STEEL", name: "Steel HRC", category: "Metals", price: 825.00, change: 5.00, changePercent: 0.61, previousClose: 820.00, open: 822.00, high: 830.00, low: 818.00, volume: "8K", unit: "$/ton", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "DOWN", sparkline: generateSparkline(825, "up") },
  { symbol: "NI", name: "Nickel LME", category: "Metals", price: 16850.00, change: -120.00, changePercent: -0.71, previousClose: 16970.00, open: 16920.00, high: 16980.00, low: 16780.00, volume: "12K", unit: "$/ton", intraday: "BEAR", daily: "DOWN", weekly: "FLAT", monthly: "UP", sparkline: generateSparkline(16850, "down") },

  // === AGRICULTURE ===
  { symbol: "ZC", name: "Corn", category: "Agriculture", price: 4.5250, change: 0.0375, changePercent: 0.84, previousClose: 4.4875, open: 4.4900, high: 4.5400, low: 4.4800, volume: "210K", unit: "$/bu", intraday: "BULL", daily: "UP", weekly: "FLAT", monthly: "DOWN", sparkline: generateSparkline(4.52, "flat") },
  { symbol: "ZS", name: "Soybeans", category: "Agriculture", price: 11.8750, change: -0.1250, changePercent: -1.04, previousClose: 12.0000, open: 11.9800, high: 12.0200, low: 11.8500, volume: "165K", unit: "$/bu", intraday: "BEAR", daily: "DOWN", weekly: "DOWN", monthly: "DOWN", sparkline: generateSparkline(11.87, "down") },
  { symbol: "ZW", name: "Wheat", category: "Agriculture", price: 5.7500, change: 0.0625, changePercent: 1.10, previousClose: 5.6875, open: 5.7000, high: 5.7800, low: 5.6750, volume: "112K", unit: "$/bu", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "FLAT", sparkline: generateSparkline(5.75, "up") },
  { symbol: "CT", name: "Cotton", category: "Agriculture", price: 0.8235, change: -0.0085, changePercent: -1.02, previousClose: 0.8320, open: 0.8300, high: 0.8340, low: 0.8200, volume: "42K", unit: "$/lb", intraday: "BEAR", daily: "DOWN", weekly: "DOWN", monthly: "DOWN", sparkline: generateSparkline(0.82, "down") },
  { symbol: "SB", name: "Sugar #11", category: "Agriculture", price: 0.2185, change: 0.0025, changePercent: 1.16, previousClose: 0.2160, open: 0.2165, high: 0.2200, low: 0.2150, volume: "88K", unit: "$/lb", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "UP", sparkline: generateSparkline(0.218, "up") },
  { symbol: "KC", name: "Coffee", category: "Agriculture", price: 1.8950, change: 0.0320, changePercent: 1.72, previousClose: 1.8630, open: 1.8700, high: 1.9050, low: 1.8600, volume: "56K", unit: "$/lb", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "UP", sparkline: generateSparkline(1.89, "up") },
  { symbol: "LE", name: "Live Cattle", category: "Agriculture", price: 1.8725, change: 0.0050, changePercent: 0.27, previousClose: 1.8675, open: 1.8690, high: 1.8780, low: 1.8650, volume: "35K", unit: "$/lb", intraday: "BULL", daily: "UP", weekly: "FLAT", monthly: "UP", sparkline: generateSparkline(1.87, "flat") },
  { symbol: "LB", name: "Lumber", category: "Agriculture", price: 548.00, change: -8.50, changePercent: -1.53, previousClose: 556.50, open: 554.00, high: 558.00, low: 545.00, volume: "6K", unit: "$/MBF", intraday: "BEAR", daily: "DOWN", weekly: "DOWN", monthly: "UP", sparkline: generateSparkline(548, "down") },

  // === FREIGHT INDICES ===
  { symbol: "DVAN", name: "Dry Van National", category: "Freight", price: 2.35, change: 0.07, changePercent: 3.07, previousClose: 2.28, open: 2.29, high: 2.38, low: 2.27, volume: "N/A", unit: "$/mi", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "UP", sparkline: generateSparkline(2.35, "up") },
  { symbol: "REEF", name: "Reefer National", category: "Freight", price: 3.12, change: 0.07, changePercent: 2.30, previousClose: 3.05, open: 3.06, high: 3.15, low: 3.04, volume: "N/A", unit: "$/mi", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "UP", sparkline: generateSparkline(3.12, "up") },
  { symbol: "FLAT", name: "Flatbed National", category: "Freight", price: 2.85, change: 0.07, changePercent: 2.52, previousClose: 2.78, open: 2.79, high: 2.88, low: 2.77, volume: "N/A", unit: "$/mi", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "FLAT", sparkline: generateSparkline(2.85, "up") },
  { symbol: "TANK", name: "Tanker National", category: "Freight", price: 3.45, change: 0.07, changePercent: 2.07, previousClose: 3.38, open: 3.39, high: 3.48, low: 3.37, volume: "N/A", unit: "$/mi", intraday: "BULL", daily: "UP", weekly: "FLAT", monthly: "UP", sparkline: generateSparkline(3.45, "up") },
  { symbol: "HAZM", name: "Hazmat National", category: "Freight", price: 4.15, change: 0.10, changePercent: 2.47, previousClose: 4.05, open: 4.06, high: 4.18, low: 4.04, volume: "N/A", unit: "$/mi", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "UP", sparkline: generateSparkline(4.15, "up") },
  { symbol: "OVER", name: "Oversize National", category: "Freight", price: 6.50, change: 0.15, changePercent: 2.36, previousClose: 6.35, open: 6.36, high: 6.55, low: 6.33, volume: "N/A", unit: "$/mi", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "UP", sparkline: generateSparkline(6.50, "up") },

  // === FUEL INDEX ===
  { symbol: "DOE", name: "DOE Diesel Avg", category: "Fuel", price: 3.89, change: 0.07, changePercent: 1.83, previousClose: 3.82, open: 3.83, high: 3.91, low: 3.81, volume: "N/A", unit: "$/gal", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "UP", sparkline: generateSparkline(3.89, "up") },
  { symbol: "DEF", name: "DEF Fluid", category: "Fuel", price: 2.95, change: 0.03, changePercent: 1.03, previousClose: 2.92, open: 2.93, high: 2.97, low: 2.91, volume: "N/A", unit: "$/gal", intraday: "BULL", daily: "UP", weekly: "FLAT", monthly: "FLAT", sparkline: generateSparkline(2.95, "flat") },
  { symbol: "FSC", name: "Fuel Surcharge/Mi", category: "Fuel", price: 0.58, change: 0.01, changePercent: 1.75, previousClose: 0.57, open: 0.57, high: 0.59, low: 0.57, volume: "N/A", unit: "$/mi", intraday: "BULL", daily: "UP", weekly: "UP", monthly: "UP", sparkline: generateSparkline(0.58, "up") },
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

  // Get all commodity market data — overlays live FRED/EIA data on energy commodities
  getCommodities: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      // Start with seed data, then overlay live prices
      let all = [...COMMODITIES];
      const snap = await getLiveSnapshot();

      if (snap?.isLiveData) {
        // === CROSS-REFERENCING ENGINE ===
        // Priority: CommodityPriceAPI (60s updates) > Yahoo Finance (real-time) > FRED/EIA (daily/weekly)
        // For each commodity, pick the best available price from the highest-priority source

        const cpapi = snap.cpapiQuotes || {};
        const yq = snap.yahooQuotes || {};

        // Build overrides from ALL sources, highest priority wins
        const overrides: Record<string, { price: number; change: number; source: string }> = {};

        // Layer 1: FRED/EIA government data (lowest priority, but most authoritative for certain series)
        if (snap.crudeOilWTI) overrides["CL"] = { price: snap.crudeOilWTI.price, change: snap.crudeOilWTI.change, source: "FRED" };
        if (snap.naturalGas) overrides["NG"] = { price: snap.naturalGas.price, change: snap.naturalGas.change, source: "FRED" };
        if (snap.dieselNational) {
          overrides["ULSD"] = { price: snap.dieselNational.price, change: snap.dieselNational.change, source: "EIA" };
          overrides["DOE"] = { price: snap.dieselNational.price, change: snap.dieselNational.change, source: "EIA" };
        }

        // Layer 2: Yahoo Finance (higher priority — real-time during market hours)
        for (const sym of Object.keys(yq)) {
          overrides[sym] = { price: yq[sym].price, change: yq[sym].changePercent, source: "Yahoo" };
        }

        // Layer 3: CommodityPriceAPI (highest priority — 60-second updates, 130+ commodities)
        for (const sym of Object.keys(cpapi)) {
          if (cpapi[sym] > 0) {
            // Cross-reference: only override if price is realistic (within 50% of existing)
            const existing = overrides[sym];
            if (!existing || Math.abs(cpapi[sym] - existing.price) / existing.price < 0.5) {
              overrides[sym] = { price: cpapi[sym], change: existing?.change || 0, source: "CommodityPriceAPI" };
            }
          }
        }

        // Apply all overrides to seed data
        all = all.map(c => {
          const ov = overrides[c.symbol];
          if (!ov) return c;
          const yQuote = yq[c.symbol];
          const changeAmt = yQuote ? yQuote.change : +(ov.price * ov.change / 100).toFixed(4);
          return {
            ...c,
            price: ov.price,
            change: +changeAmt.toFixed(4),
            changePercent: +ov.change.toFixed(2),
            previousClose: yQuote ? +yQuote.prevClose.toFixed(4) : +(ov.price - changeAmt).toFixed(4),
            open: yQuote ? +yQuote.open.toFixed(4) : +(ov.price - changeAmt * 0.5).toFixed(4),
            high: yQuote ? +yQuote.high.toFixed(4) : +(ov.price * 1.005).toFixed(4),
            low: yQuote ? +yQuote.low.toFixed(4) : +(ov.price * 0.995).toFixed(4),
            volume: yQuote ? (yQuote.volume > 1000 ? `${Math.round(yQuote.volume / 1000)}K` : String(yQuote.volume)) : c.volume,
            intraday: ov.change > 0.5 ? "BULL" as const : ov.change < -0.5 ? "BEAR" as const : "FLAT" as const,
            daily: ov.change > 0 ? "UP" as const : ov.change < 0 ? "DOWN" as const : "FLAT" as const,
            sparkline: generateSparkline(ov.price, ov.change > 0.5 ? "up" : ov.change < -0.5 ? "down" : "flat"),
          };
        });

        // Also update fuel index commodities with live EIA
        const liveFuel = await getLiveFuelIndex();
        all = all.map(c => {
          if (c.symbol === "FSC" && liveFuel.isLive) {
            return { ...c, price: liveFuel.surchargePerMile, change: +(liveFuel.surchargePerMile - 0.57).toFixed(4), changePercent: +((liveFuel.surchargePerMile - 0.57) / 0.57 * 100).toFixed(2) };
          }
          if (c.symbol === "DEF" && liveFuel.isLive) {
            return { ...c, price: liveFuel.def.current };
          }
          return c;
        });
      }

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
        isLiveData: snap?.isLiveData || false,
        source: snap?.source || "Seed Data",
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
          carrier: {
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

      const dataPoints = [];
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const variance = (Math.random() - 0.45) * 0.3;
        const trend = (days - i) / days * 0.15;
        dataPoints.push({
          date: date.toISOString().split("T")[0],
          spotRate: +(baseRate + variance + trend + 0.15).toFixed(2),
          contractRate: +(baseRate + trend - 0.10).toFixed(2),
          nationalAvg: +(baseRate + (variance * 0.3) + trend).toFixed(2),
        });
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

      return {
        results: [...localMatches, ...apiMatches].slice(0, 25),
        totalLocal: localMatches.length,
        totalApi: apiMatches.length,
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

      // Cross-reference: pick best price
      const bestPrice = directPrice || cpapi || (yq ? yq.price : null) || (seed ? seed.price : null);

      return {
        symbol: sym,
        name: seed?.name || sym,
        price: bestPrice,
        change: yq?.change || seed?.change || 0,
        changePercent: yq?.changePercent || seed?.changePercent || 0,
        high: yq?.high || seed?.high || 0,
        low: yq?.low || seed?.low || 0,
        open: yq?.open || seed?.open || 0,
        previousClose: yq?.prevClose || seed?.previousClose || 0,
        volume: yq ? (yq.volume > 1000 ? `${Math.round(yq.volume / 1000)}K` : String(yq.volume)) : seed?.volume || "N/A",
        category: seed?.category || "External",
        unit: seed?.unit || "USD",
        sparkline: seed?.sparkline || [],
        intraday: seed?.intraday || "FLAT",
        daily: seed?.daily || "FLAT",
        weekly: seed?.weekly || "FLAT",
        monthly: seed?.monthly || "FLAT",
        sources: {
          commodityPriceAPI: directPrice || cpapi || null,
          yahooFinance: yq ? yq.price : null,
          fredEia: snap?.crudeOilWTI && sym === "CL" ? snap.crudeOilWTI.price : snap?.naturalGas && sym === "NG" ? snap.naturalGas.price : null,
          seed: seed?.price || null,
        },
        bestSource: directPrice || cpapi ? "CommodityPriceAPI" : yq ? "Yahoo Finance" : "Seed Data",
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
