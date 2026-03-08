/**
 * DOE FUEL SURCHARGE AUTOMATION — GAP-199
 * ═══════════════════════════════════════════════════════════════
 *
 * Automatically calculates fuel surcharges based on:
 *   1. DOE/EIA weekly national diesel price (fetched from fuelPriceService)
 *   2. PADD regional adjustments
 *   3. Configurable base fuel price threshold per contract
 *   4. Industry-standard FSC formulas (per-mile or per-gallon)
 *
 * Supports two FSC calculation methods:
 *   A) Per-Mile: (Current Price − Base Price) / MPG × miles
 *   B) Per-Gallon: Gallons consumed × (Current Price − Base Price)
 *      where Gallons = (Loaded Miles × 2) / MPG (roundtrip)
 *
 * Rate sheet reference (Permian crude transport):
 *   FSC = Gallons (Loaded Miles × 2 ÷ 5 MPG) × (EIA PADD diesel − $3.75)
 *
 * Auto-refresh: Every Monday when DOE publishes new prices.
 * Cache: Redis WARM tier, 6-hour TTL (matches EIA refresh).
 */

import { getNationalAverages, getRegionalPrices } from "../fuelPriceService";
import { cacheGet, cacheSet } from "../cache/redisCache";

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export interface FSCConfig {
  baseFuelPrice: number;         // Contract base price (e.g., $3.75/gal)
  method: "PER_MILE" | "PER_GALLON";
  mpg: number;                   // Assumed fuel economy (default: 5.0 for crude tankers)
  roundTrip: boolean;            // true = multiply miles × 2 for return trip
  regionOverride?: string;       // Force a specific PADD region (e.g., "R30")
  minimumSurcharge?: number;     // Floor — never charge less than this
  maximumSurcharge?: number;     // Cap — never charge more than this
  incrementCents?: number;       // Round to nearest increment (e.g., 0.01)
}

export interface FSCResult {
  surchargePerMile: number;      // $/mile FSC
  surchargePerGallon: number;    // $/gallon over base
  totalSurcharge: number;        // Total FSC for this load
  gallonsConsumed: number;       // Estimated gallons used
  currentDieselPrice: number;    // Current DOE price used
  baseFuelPrice: number;         // Contract base
  priceDelta: number;            // Current − Base
  method: string;
  region: string;
  miles: number;
  calculatedAt: string;
  source: "eia" | "fallback";
  weekChange: number;            // % change from last week
}

export interface FSCSchedule {
  effectiveDate: string;
  expirationDate: string;
  brackets: FSCBracket[];
  currentBracket: FSCBracket | null;
  currentDieselPrice: number;
}

export interface FSCBracket {
  minPrice: number;
  maxPrice: number;
  surchargePerMile: number;
  surchargePercent: number;
}

// ═══════════════════════════════════════════════════════════════════════
// DEFAULT CONFIG (Crude oil hauling — Permian Basin standard)
// ═══════════════════════════════════════════════════════════════════════

export const DEFAULT_FSC_CONFIG: FSCConfig = {
  baseFuelPrice: 3.75,
  method: "PER_GALLON",
  mpg: 5.0,
  roundTrip: true,
  minimumSurcharge: 0,
  maximumSurcharge: undefined,
  incrementCents: 0.01,
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN API: calculateFuelSurcharge()
// ═══════════════════════════════════════════════════════════════════════

/**
 * Calculate fuel surcharge for a given load.
 *
 * @param miles - One-way loaded miles
 * @param config - FSC configuration (contract terms)
 * @param originState - Origin state for regional pricing (optional)
 */
export async function calculateFuelSurcharge(
  miles: number,
  config: Partial<FSCConfig> = {},
  originState?: string
): Promise<FSCResult> {
  const cfg: FSCConfig = { ...DEFAULT_FSC_CONFIG, ...config };

  // Get current diesel price (cached via fuelPriceService → EIA)
  const { currentPrice, region, weekChange, source } = await getCurrentDieselPrice(cfg.regionOverride, originState);

  // Price delta
  const priceDelta = Math.max(currentPrice - cfg.baseFuelPrice, 0);

  // Gallons consumed
  const tripMiles = cfg.roundTrip ? miles * 2 : miles;
  const gallonsConsumed = tripMiles / cfg.mpg;

  // Calculate surcharge
  let surchargePerMile: number;
  let totalSurcharge: number;

  if (cfg.method === "PER_GALLON") {
    // Permian standard: Gallons × (Current − Base)
    totalSurcharge = gallonsConsumed * priceDelta;
    surchargePerMile = miles > 0 ? totalSurcharge / miles : 0;
  } else {
    // Per-mile: (Current − Base) / MPG
    surchargePerMile = priceDelta / cfg.mpg;
    totalSurcharge = surchargePerMile * miles;
  }

  // Apply floor/cap
  if (cfg.minimumSurcharge != null && totalSurcharge < cfg.minimumSurcharge) {
    totalSurcharge = cfg.minimumSurcharge;
    surchargePerMile = miles > 0 ? totalSurcharge / miles : 0;
  }
  if (cfg.maximumSurcharge != null && totalSurcharge > cfg.maximumSurcharge) {
    totalSurcharge = cfg.maximumSurcharge;
    surchargePerMile = miles > 0 ? totalSurcharge / miles : 0;
  }

  // Round to increment
  if (cfg.incrementCents) {
    totalSurcharge = Math.round(totalSurcharge / cfg.incrementCents) * cfg.incrementCents;
    surchargePerMile = Math.round(surchargePerMile / cfg.incrementCents) * cfg.incrementCents;
  }

  return {
    surchargePerMile: round(surchargePerMile, 4),
    surchargePerGallon: round(priceDelta, 3),
    totalSurcharge: round(totalSurcharge, 2),
    gallonsConsumed: round(gallonsConsumed, 1),
    currentDieselPrice: round(currentPrice, 3),
    baseFuelPrice: cfg.baseFuelPrice,
    priceDelta: round(priceDelta, 3),
    method: cfg.method,
    region,
    miles,
    calculatedAt: new Date().toISOString(),
    source,
    weekChange,
  };
}

/**
 * Generate a complete FSC schedule (bracket table) for a contract.
 * Used for rate sheets and carrier agreements.
 */
export async function generateFSCSchedule(
  baseFuelPrice: number = 3.75,
  mpg: number = 5.0,
  bracketSize: number = 0.05, // $0.05 increments
  maxPrice: number = 6.00,
): Promise<FSCSchedule> {
  const cacheKey = `fsc_schedule:${baseFuelPrice}:${mpg}:${bracketSize}`;
  const cached = await cacheGet<FSCSchedule>("WARM", cacheKey);
  if (cached) return cached;

  const averages = await getNationalAverages();
  const brackets: FSCBracket[] = [];

  let price = baseFuelPrice;
  while (price <= maxPrice) {
    const nextPrice = price + bracketSize;
    const delta = Math.max(((price + nextPrice) / 2) - baseFuelPrice, 0);
    const surchargePerMile = round(delta / mpg, 4);
    const surchargePercent = baseFuelPrice > 0 ? round((delta / baseFuelPrice) * 100, 1) : 0;

    brackets.push({
      minPrice: round(price, 3),
      maxPrice: round(nextPrice - 0.001, 3),
      surchargePerMile,
      surchargePercent,
    });

    price = nextPrice;
  }

  // Find current bracket
  const currentBracket = brackets.find(
    b => averages.national >= b.minPrice && averages.national <= b.maxPrice
  ) || null;

  const now = new Date();
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((8 - now.getDay()) % 7 || 7));

  const schedule: FSCSchedule = {
    effectiveDate: now.toISOString().slice(0, 10),
    expirationDate: nextMonday.toISOString().slice(0, 10),
    brackets,
    currentBracket,
    currentDieselPrice: averages.national,
  };

  // Cache for 6 hours
  await cacheSet("WARM", cacheKey, schedule, 21600).catch(() => {});
  return schedule;
}

/**
 * Batch calculate FSC for multiple loads (fleet-level).
 */
export async function batchCalculateFSC(
  loads: { loadId: string; miles: number; originState?: string }[],
  config: Partial<FSCConfig> = {}
): Promise<Map<string, FSCResult>> {
  const results = new Map<string, FSCResult>();
  // Fetch price once, reuse for all loads in same region
  for (const load of loads) {
    const result = await calculateFuelSurcharge(load.miles, config, load.originState);
    results.set(load.loadId, result);
  }
  return results;
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

async function getCurrentDieselPrice(
  regionOverride?: string,
  originState?: string
): Promise<{ currentPrice: number; region: string; weekChange: number; source: "eia" | "fallback" }> {
  try {
    if (regionOverride) {
      const regional = await getRegionalPrices();
      const match = regional.regions.find(r => r.name.includes(regionOverride));
      if (match) {
        return { currentPrice: match.avgPrice, region: regionOverride, weekChange: match.change, source: "eia" };
      }
    }

    // Use national average as default
    const averages = await getNationalAverages();
    return {
      currentPrice: averages.national,
      region: "National",
      weekChange: averages.weekChange,
      source: "eia",
    };
  } catch {
    // Fallback
    return { currentPrice: 3.52, region: "National (fallback)", weekChange: 0, source: "fallback" };
  }
}

function round(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}
