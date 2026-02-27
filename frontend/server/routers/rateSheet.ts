/**
 * RATE SHEET & RECONCILIATION ROUTER
 * Real-world crude oil hauling payment cycle
 *
 * Rate Sheet (Schedule A):
 *   - Per-barrel rates by mileage (5-mile increments)
 *   - Fuel Surcharge (FSC) formula per EIA PADD diesel
 *   - Wait time, split loads, rejects, minimums
 *
 * Reconciliation Statement:
 *   - Aggregates loads per billing period
 *   - Gross vs Net barrels per run ticket
 *   - Payment = Net Barrels × Rate/BBL + surcharges
 *
 * Based on real-world documents: Permian Crude Transport Schedule A,
 * Accelerated Transport reconciliation statements
 */

import { z } from "zod";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { isolatedApprovedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loads, users, companies, documents, hzFuelPrices } from "../../drizzle/schema";
import { digitizeRateSheet } from "../services/rateSheetDigitizer";

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

// Rate tiers — per-barrel rate by one-way mileage
const rateTierSchema = z.object({
  minMiles: z.number(),
  maxMiles: z.number(),
  ratePerBarrel: z.number(), // $/BBL
});

// Surcharge rules
const surchargeRulesSchema = z.object({
  // Fuel Surcharge (FSC)
  fscEnabled: z.boolean().default(true),
  fscBaselineDieselPrice: z.coerce.number().default(3.75), // $/gallon baseline
  fscMilesPerGallon: z.coerce.number().default(5), // Fuel mileage
  fscPaddRegion: z.string().default("3"), // EIA PADD region for diesel price

  // Wait Time
  waitTimeFreeHours: z.coerce.number().default(1), // Free hours before charges
  waitTimeRatePerHour: z.coerce.number().default(85), // $/hour after free period

  // Split Loads
  splitLoadFee: z.coerce.number().default(50), // $ per run with split loads

  // Rejects
  rejectFee: z.coerce.number().default(85), // $ per reject with numbered ticket

  // Minimums
  minimumBarrels: z.coerce.number().default(160), // Minimum barrels per load

  // Travel surcharge (leaving operating area)
  travelSurchargePerMile: z.coerce.number().default(1.50), // $/mile

  // Extra charges
  longLeaseRoadFee: z.coerce.number().optional(), // Extra for long lease roads
  multipleGatesFee: z.coerce.number().optional(), // Extra for multiple gates
});

// Full rate sheet
const rateSheetSchema = z.object({
  name: z.string(), // e.g., "Schedule A — Crude Oil Trucking Rates"
  effectiveDate: z.string(),
  expirationDate: z.string().optional(),
  fuelSurchargeIncluded: z.boolean().default(false),
  
  // Parties
  issuedBy: z.string(), // Company name (e.g., "Permian Crude Transport LP")
  issuedByContact: z.string().optional(), // COO name
  issuedByPhone: z.string().optional(),
  issuedByEmail: z.string().optional(),
  issuedByAddress: z.string().optional(),
  
  issuedTo: z.string().optional(), // Carrier/Hauler company
  issuedToCompanyId: z.number().optional(),

  // Rate tiers
  rateTiers: z.array(rateTierSchema),

  // Surcharge rules
  surcharges: surchargeRulesSchema,

  // Notes
  notes: z.string().optional(),
  confidentialityNotice: z.string().optional(),
});

// Reconciliation line item (one load/run)
const reconciliationLineSchema = z.object({
  referenceNumber: z.string(), // Accelerated Transport reference #
  accNumber: z.string().optional(), // Account / BOL number
  driverName: z.string(),
  driverId: z.number().optional(),
  customerName: z.string(), // e.g., "Casa Sumi"
  bolNumber: z.string().optional(),
  originTerminal: z.string(),
  stationName: z.string(),
  oneWayMiles: z.number(),
  ticketCount: z.number().default(1),
  grossBarrels: z.number(),
  netBarrels: z.number(),
  scheduledDate: z.string().optional(),
  entryDate: z.string().optional(),
  // Surcharges for this run
  waitTimeHours: z.number().default(0),
  isSplitLoad: z.boolean().default(false),
  isReject: z.boolean().default(false),
  rejectTicketNumber: z.string().optional(),
  travelSurchargeMiles: z.number().default(0),
});

// ═══════════════════════════════════════════════════════════════════════════
// PLATFORM FEE SCHEDULE — EusoTrip Revenue Model
// ═══════════════════════════════════════════════════════════════════════════

const PLATFORM_FEE_SCHEDULE = {
  // Core transaction fee (% of gross load payment)
  transactionFeePercent: 3.5,
  // Minimum platform fee per load
  minimumFee: 15.00,
  // Maximum platform fee cap per load
  maximumFee: 500.00,
  // Document generation fees
  bolGenerationFee: 0, // Included in platform
  runTicketFee: 0,     // Included in platform
  reconciliationFee: 0, // Included in platform
  // Payment processing (on top of platform fee)
  paymentProcessingPercent: 2.9, // Stripe Connect
  paymentProcessingFlat: 0.30,    // Per-transaction
  // Who pays what:
  //   Shipper pays: load amount + platform fee
  //   Carrier/Catalyst receives: load amount - platform fee
  //   Platform keeps: platform fee + payment processing
  //   Driver payout: per carrier's arrangement (carrier → driver)
  //   Broker: earns commission from spread, pays platform fee on their cut
  //   Terminal: earns facility fees, pays platform fee on those
};

function calculatePlatformFee(grossAmount: number): {
  platformFeePercent: number;
  platformFeeAmount: number;
  paymentProcessingFee: number;
  totalPlatformRevenue: number;
  shipperPays: number;
  carrierReceives: number;
} {
  const rawFee = grossAmount * (PLATFORM_FEE_SCHEDULE.transactionFeePercent / 100);
  const platformFeeAmount = Math.min(
    Math.max(rawFee, PLATFORM_FEE_SCHEDULE.minimumFee),
    PLATFORM_FEE_SCHEDULE.maximumFee
  );
  const paymentProcessingFee = Math.round(
    (grossAmount * (PLATFORM_FEE_SCHEDULE.paymentProcessingPercent / 100) +
     PLATFORM_FEE_SCHEDULE.paymentProcessingFlat) * 100
  ) / 100;

  return {
    platformFeePercent: PLATFORM_FEE_SCHEDULE.transactionFeePercent,
    platformFeeAmount: Math.round(platformFeeAmount * 100) / 100,
    paymentProcessingFee,
    totalPlatformRevenue: Math.round((platformFeeAmount + paymentProcessingFee) * 100) / 100,
    shipperPays: Math.round((grossAmount + platformFeeAmount + paymentProcessingFee) * 100) / 100,
    carrierReceives: Math.round((grossAmount - platformFeeAmount) * 100) / 100,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CALCULATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Look up rate per barrel for given one-way miles from rate tiers
 */
function getRateForMiles(miles: number, tiers: { minMiles: number; maxMiles: number; ratePerBarrel: number }[]): number {
  // Sort tiers ascending
  const sorted = [...tiers].sort((a, b) => a.minMiles - b.minMiles);
  for (const tier of sorted) {
    if (miles >= tier.minMiles && miles <= tier.maxMiles) {
      return tier.ratePerBarrel;
    }
  }
  // If beyond max tier, use last tier
  if (sorted.length > 0 && miles > sorted[sorted.length - 1].maxMiles) {
    return sorted[sorted.length - 1].ratePerBarrel;
  }
  return 0;
}

/**
 * Calculate Fuel Surcharge (FSC) per industry formula
 * FSC = Gallons × FSC Reimbursement Rate
 * Gallons = Loaded Miles × 2 ÷ Fuel Mileage per Gallon
 * FSC Rate = Avg Monthly EIA Retail Diesel Price − Baseline
 */
function calculateFSC(
  loadedMiles: number,
  currentDieselPrice: number,
  baselineDieselPrice: number,
  milesPerGallon: number
): number {
  if (currentDieselPrice <= baselineDieselPrice) return 0;
  const gallons = (loadedMiles * 2) / milesPerGallon;
  const fscRate = currentDieselPrice - baselineDieselPrice;
  return Math.round(gallons * fscRate * 100) / 100;
}

/**
 * Calculate total payment for a single run
 */
function calculateRunPayment(
  netBarrels: number,
  oneWayMiles: number,
  rateTiers: { minMiles: number; maxMiles: number; ratePerBarrel: number }[],
  surcharges: z.infer<typeof surchargeRulesSchema>,
  options: {
    waitTimeHours?: number;
    isSplitLoad?: boolean;
    isReject?: boolean;
    travelSurchargeMiles?: number;
    currentDieselPrice?: number;
  } = {}
): {
  ratePerBarrel: number;
  baseAmount: number;
  fsc: number;
  waitTimeCharge: number;
  splitLoadFee: number;
  rejectFee: number;
  travelSurcharge: number;
  totalAmount: number;
  breakdown: string[];
} {
  const ratePerBarrel = getRateForMiles(oneWayMiles, rateTiers);
  const baseAmount = Math.round(netBarrels * ratePerBarrel * 100) / 100;

  // FSC
  const fsc = options.currentDieselPrice
    ? calculateFSC(oneWayMiles, options.currentDieselPrice, surcharges.fscBaselineDieselPrice, surcharges.fscMilesPerGallon)
    : 0;

  // Wait time
  const waitHours = options.waitTimeHours || 0;
  const billableWaitHours = Math.max(0, waitHours - surcharges.waitTimeFreeHours);
  const waitTimeCharge = Math.round(billableWaitHours * surcharges.waitTimeRatePerHour * 100) / 100;

  // Split load
  const splitLoadFee = options.isSplitLoad ? surcharges.splitLoadFee : 0;

  // Reject
  const rejectFee = options.isReject ? surcharges.rejectFee : 0;

  // Travel surcharge
  const travelSurcharge = (options.travelSurchargeMiles || 0) * surcharges.travelSurchargePerMile;

  const totalAmount = Math.round((baseAmount + fsc + waitTimeCharge + splitLoadFee + rejectFee + travelSurcharge) * 100) / 100;

  const breakdown: string[] = [];
  breakdown.push(`${netBarrels} BBL × $${ratePerBarrel}/BBL = $${baseAmount.toFixed(2)}`);
  if (fsc > 0) breakdown.push(`FSC: $${fsc.toFixed(2)}`);
  if (waitTimeCharge > 0) breakdown.push(`Wait time (${billableWaitHours}h × $${surcharges.waitTimeRatePerHour}): $${waitTimeCharge.toFixed(2)}`);
  if (splitLoadFee > 0) breakdown.push(`Split load: $${splitLoadFee.toFixed(2)}`);
  if (rejectFee > 0) breakdown.push(`Reject: $${rejectFee.toFixed(2)}`);
  if (travelSurcharge > 0) breakdown.push(`Travel surcharge: $${travelSurcharge.toFixed(2)}`);

  return { ratePerBarrel, baseAmount, fsc, waitTimeCharge, splitLoadFee, rejectFee, travelSurcharge, totalAmount, breakdown };
}

/**
 * Generate default rate tiers (Permian Crude Transport style, 5-mile increments)
 */
function generateDefaultRateTiers(): { minMiles: number; maxMiles: number; ratePerBarrel: number }[] {
  const tiers: { minMiles: number; maxMiles: number; ratePerBarrel: number }[] = [];
  const rateData: [number, number, number][] = [
    [1, 5, 0.83], [6, 10, 0.86], [11, 15, 0.95], [16, 20, 0.99],
    [21, 25, 1.09], [26, 30, 1.15], [31, 35, 1.26], [36, 40, 1.32],
    [41, 45, 1.37], [46, 50, 1.44], [51, 55, 1.53], [56, 60, 1.62],
    [61, 65, 1.73], [66, 70, 1.79], [71, 75, 1.89], [76, 80, 1.94],
    [81, 85, 2.02], [86, 90, 2.10], [91, 95, 2.19], [96, 100, 2.26],
    [101, 105, 2.43], [106, 110, 2.48], [111, 115, 2.58], [116, 120, 2.66],
    [121, 125, 2.75], [126, 130, 2.88], [131, 135, 2.99], [136, 140, 3.08],
    [141, 145, 3.20], [146, 150, 3.30], [151, 155, 3.59], [156, 160, 3.71],
    [161, 165, 3.82], [166, 170, 3.93], [171, 175, 4.04], [176, 180, 4.15],
    [181, 185, 4.26], [186, 190, 4.38], [191, 195, 4.48], [196, 200, 4.64],
    [201, 205, 4.75], [206, 210, 4.86], [211, 215, 4.98], [216, 220, 5.09],
    [221, 225, 5.19], [226, 230, 5.31], [231, 235, 5.42], [236, 240, 5.54],
    [241, 245, 5.65], [246, 250, 5.76], [251, 255, 5.87], [256, 260, 5.98],
    [261, 265, 6.09], [266, 270, 6.21], [271, 275, 6.32], [276, 280, 6.50],
    [281, 285, 6.60], [286, 290, 6.71], [291, 295, 6.86], [296, 300, 6.94],
  ];
  for (const [min, max, rate] of rateData) {
    tiers.push({ minMiles: min, maxMiles: max, ratePerBarrel: rate });
  }
  return tiers;
}

// ═══════════════════════════════════════════════════════════════════════════
// STATE → PADD MAPPING (for auto-populating diesel from EIA)
// ═══════════════════════════════════════════════════════════════════════════

const STATE_TO_PADD: Record<string, string> = {
  CT: "PADD1A", ME: "PADD1A", MA: "PADD1A", NH: "PADD1A", RI: "PADD1A", VT: "PADD1A",
  DE: "PADD1B", DC: "PADD1B", MD: "PADD1B", NJ: "PADD1B", NY: "PADD1B", PA: "PADD1B",
  FL: "PADD1C", GA: "PADD1C", NC: "PADD1C", SC: "PADD1C", VA: "PADD1C", WV: "PADD1C",
  IL: "PADD2", IN: "PADD2", IA: "PADD2", KS: "PADD2", KY: "PADD2", MI: "PADD2",
  MN: "PADD2", MO: "PADD2", NE: "PADD2", ND: "PADD2", OH: "PADD2", OK: "PADD2",
  SD: "PADD2", TN: "PADD2", WI: "PADD2",
  AL: "PADD3", AR: "PADD3", LA: "PADD3", MS: "PADD3", NM: "PADD3", TX: "PADD3",
  CO: "PADD4", ID: "PADD4", MT: "PADD4", UT: "PADD4", WY: "PADD4",
  AK: "PADD5", AZ: "PADD5", CA: "PADD5", HI: "PADD5", NV: "PADD5", OR: "PADD5", WA: "PADD5",
};

function paddFromState(state: string): string {
  return STATE_TO_PADD[state.toUpperCase().trim()] || "PADD3";
}

// ═══════════════════════════════════════════════════════════════════════════
// REGION-AWARE RATE TIER GENERATION
// Real-world regional multipliers calibrated against published tariffs:
//   Permian Basin (baseline 1.0), Eagle Ford (+8%), Bakken (+22%),
//   Marcellus/Appalachia (+18%), Mid-Continent (+5%), Gulf Coast (-3%),
//   DJ Basin (+15%), Haynesville (+6%), Uinta (+20%), Williston (+22%)
// ═══════════════════════════════════════════════════════════════════════════

const REGION_MULTIPLIERS: Record<string, { mult: number; padd: string; label: string }> = {
  "permian_basin":   { mult: 1.00, padd: "PADD3", label: "Permian Basin" },
  "eagle_ford":      { mult: 1.08, padd: "PADD3", label: "Eagle Ford" },
  "bakken":          { mult: 1.22, padd: "PADD2", label: "Bakken" },
  "marcellus":       { mult: 1.18, padd: "PADD1B", label: "Marcellus/Appalachia" },
  "mid_continent":   { mult: 1.05, padd: "PADD2", label: "Mid-Continent" },
  "gulf_coast":      { mult: 0.97, padd: "PADD3", label: "Gulf Coast" },
  "dj_basin":        { mult: 1.15, padd: "PADD4", label: "DJ Basin" },
  "haynesville":     { mult: 1.06, padd: "PADD3", label: "Haynesville" },
  "uinta":           { mult: 1.20, padd: "PADD4", label: "Uinta Basin" },
  "williston":       { mult: 1.22, padd: "PADD2", label: "Williston Basin" },
  "san_joaquin":     { mult: 1.28, padd: "PADD5", label: "San Joaquin Valley" },
  "powder_river":    { mult: 1.17, padd: "PADD4", label: "Powder River Basin" },
};

// Product multipliers (relative to crude oil baseline)
const PRODUCT_MULTIPLIERS: Record<string, number> = {
  "Crude Oil": 1.00,
  "NGL": 1.18,
  "Condensate": 0.92,
  "Refined Products": 1.12,
  "LPG": 1.25,
  "Biofuels": 1.10,
  "Chemicals": 1.30,
  "Water": 0.70,
  "Brine": 0.72,
};

// Trailer-type base rate multipliers (relative to tanker)
const TRAILER_RATE_STRUCTURES: Record<string, { mult: number; unit: string; defaultProduct: string }> = {
  "tanker":     { mult: 1.00, unit: "per_barrel", defaultProduct: "Crude Oil" },
  "dry_van":    { mult: 0.55, unit: "per_mile", defaultProduct: "General Freight" },
  "reefer":     { mult: 0.72, unit: "per_mile", defaultProduct: "Refrigerated Goods" },
  "flatbed":    { mult: 0.65, unit: "per_mile", defaultProduct: "Heavy Equipment" },
  "step_deck":  { mult: 0.68, unit: "per_mile", defaultProduct: "Heavy Equipment" },
  "lowboy":     { mult: 0.78, unit: "per_mile", defaultProduct: "Machinery" },
  "hopper":     { mult: 0.82, unit: "per_barrel", defaultProduct: "Sand & Gravel" },
  "intermodal": { mult: 0.50, unit: "per_mile", defaultProduct: "General Freight" },
};

// Default surcharges by region (accounts for local operating conditions)
const REGION_SURCHARGE_OVERRIDES: Record<string, Partial<{ waitTimeRatePerHour: number; travelSurchargePerMile: number; minimumBarrels: number; fscBaselineDieselPrice: number }>> = {
  "permian_basin":  { waitTimeRatePerHour: 85, travelSurchargePerMile: 1.50, minimumBarrels: 160 },
  "eagle_ford":     { waitTimeRatePerHour: 85, travelSurchargePerMile: 1.50, minimumBarrels: 160 },
  "bakken":         { waitTimeRatePerHour: 95, travelSurchargePerMile: 2.00, minimumBarrels: 150, fscBaselineDieselPrice: 3.90 },
  "marcellus":      { waitTimeRatePerHour: 90, travelSurchargePerMile: 1.75, minimumBarrels: 155 },
  "mid_continent":  { waitTimeRatePerHour: 82, travelSurchargePerMile: 1.50, minimumBarrels: 160 },
  "gulf_coast":     { waitTimeRatePerHour: 80, travelSurchargePerMile: 1.25, minimumBarrels: 170 },
  "dj_basin":       { waitTimeRatePerHour: 92, travelSurchargePerMile: 1.85, minimumBarrels: 155, fscBaselineDieselPrice: 3.85 },
  "uinta":          { waitTimeRatePerHour: 95, travelSurchargePerMile: 2.10, minimumBarrels: 145, fscBaselineDieselPrice: 3.90 },
  "williston":      { waitTimeRatePerHour: 95, travelSurchargePerMile: 2.00, minimumBarrels: 150, fscBaselineDieselPrice: 3.90 },
  "san_joaquin":    { waitTimeRatePerHour: 100, travelSurchargePerMile: 2.25, minimumBarrels: 150, fscBaselineDieselPrice: 4.25 },
};

/**
 * Generate region-, product-, and trailer-aware rate tiers
 * Applies real-world regional cost multipliers to the Permian baseline
 */
function generateSmartRateTiers(
  region?: string,
  product?: string,
  trailerType?: string,
): {
  tiers: { minMiles: number; maxMiles: number; ratePerBarrel: number }[];
  surcharges: Record<string, any>;
  regionInfo: { key: string; label: string; padd: string; multiplier: number } | null;
  productMultiplier: number;
  trailerMultiplier: number;
} {
  const baseTiers = generateDefaultRateTiers();
  const regionKey = region?.toLowerCase().replace(/[\s\/]+/g, "_").replace(/[^a-z0-9_]/g, "") || "";
  const regionData = REGION_MULTIPLIERS[regionKey] || null;
  const regionMult = regionData?.mult || 1.0;
  const productMult = PRODUCT_MULTIPLIERS[product || ""] || 1.0;
  const trailerData = TRAILER_RATE_STRUCTURES[trailerType || "tanker"] || TRAILER_RATE_STRUCTURES["tanker"];
  const trailerMult = trailerData.mult;

  const combinedMult = regionMult * productMult * trailerMult;

  const tiers = baseTiers.map(t => ({
    minMiles: t.minMiles,
    maxMiles: t.maxMiles,
    ratePerBarrel: Math.round(t.ratePerBarrel * combinedMult * 100) / 100,
  }));

  // Build region-aware surcharges
  const regionOverrides = REGION_SURCHARGE_OVERRIDES[regionKey] || {};
  const surcharges = {
    fscEnabled: true,
    fscBaselineDieselPrice: regionOverrides.fscBaselineDieselPrice || 3.75,
    fscMilesPerGallon: 5,
    fscPaddRegion: regionData?.padd?.replace("PADD", "") || "3",
    waitTimeFreeHours: 1,
    waitTimeRatePerHour: regionOverrides.waitTimeRatePerHour || 85,
    splitLoadFee: 50,
    rejectFee: 85,
    minimumBarrels: regionOverrides.minimumBarrels || 160,
    travelSurchargePerMile: regionOverrides.travelSurchargePerMile || 1.50,
  };

  return {
    tiers,
    surcharges,
    regionInfo: regionData ? { key: regionKey, label: regionData.label, padd: regionData.padd, multiplier: regionMult } : null,
    productMultiplier: productMult,
    trailerMultiplier: trailerMult,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════════════════

export const rateSheetRouter = router({
  // ─── RATE SHEET MANAGEMENT ───

  /**
   * Create/save a rate sheet (Schedule A)
   */
  create: protectedProcedure
    .input(rateSheetSchema)
    .mutation(async ({ ctx, input }) => {
      const id = `RS-${Date.now()}`;
      // Store rate sheet in documents
      const db = await getDb();
      if (db) {
        try {
          await db.insert(documents).values({
            userId: ctx.user?.id || 0,
            companyId: ctx.user?.companyId || 0,
            type: "rate_sheet",
            name: `Rate Sheet: ${input.name}`,
            status: "active",
            fileUrl: "",
          } as any);
        } catch (e) { console.error("[RateSheet] create error:", e); }
      }

      return {
        success: true,
        id,
        name: input.name,
        effectiveDate: input.effectiveDate,
        tierCount: input.rateTiers.length,
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Get default rate tiers (Permian Crude Transport standard)
   */
  getDefaultTiers: protectedProcedure.query(() => {
    return {
      tiers: generateDefaultRateTiers(),
      surcharges: {
        fscEnabled: true,
        fscBaselineDieselPrice: 3.75,
        fscMilesPerGallon: 5,
        fscPaddRegion: "3",
        waitTimeFreeHours: 1,
        waitTimeRatePerHour: 85,
        splitLoadFee: 50,
        rejectFee: 85,
        minimumBarrels: 160,
        travelSurchargePerMile: 1.50,
      },
    };
  }),

  /**
   * Get current EIA diesel price by state or PADD region
   * Auto-populates the FSC diesel input in the Rate Calculator
   */
  getCurrentDiesel: protectedProcedure
    .input(z.object({
      state: z.string().optional(),
      paddRegion: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { price: 3.75, padd: "PADD3", state: null, reportDate: null, source: "default", change1w: null, change1m: null };

      try {
        const targetPadd = input?.paddRegion
          ? (input.paddRegion.startsWith("PADD") ? input.paddRegion : `PADD${input.paddRegion}`)
          : input?.state
            ? paddFromState(input.state)
            : "PADD3";

        const targetState = input?.state?.toUpperCase().trim() || null;

        // Try state-specific first, then fall back to any state in the PADD
        let rows: any[] = [];
        if (targetState) {
          rows = await db.select().from(hzFuelPrices)
            .where(and(eq(hzFuelPrices.stateCode, targetState), eq(hzFuelPrices.source, "EIA")))
            .orderBy(desc(hzFuelPrices.reportDate))
            .limit(1);
        }
        if (rows.length === 0) {
          rows = await db.select().from(hzFuelPrices)
            .where(and(eq(hzFuelPrices.paddRegion, targetPadd), eq(hzFuelPrices.source, "EIA")))
            .orderBy(desc(hzFuelPrices.reportDate))
            .limit(1);
        }

        if (rows.length > 0) {
          const row = rows[0];
          return {
            price: parseFloat(row.dieselRetail) || 3.75,
            padd: row.paddRegion || targetPadd,
            state: row.stateCode,
            reportDate: row.reportDate?.toString() || null,
            source: "EIA" as const,
            change1w: row.dieselChange1w ? parseFloat(row.dieselChange1w) : null,
            change1m: row.dieselChange1m ? parseFloat(row.dieselChange1m) : null,
          };
        }

        return { price: 3.75, padd: targetPadd, state: targetState, reportDate: null, source: "default" as const, change1w: null, change1m: null };
      } catch (e) {
        console.error("[RateSheet] getCurrentDiesel error:", e);
        return { price: 3.75, padd: "PADD3", state: null, reportDate: null, source: "default" as const, change1w: null, change1m: null };
      }
    }),

  /**
   * Get smart default tiers calibrated by region, product, and trailer type
   * Returns region-specific surcharges and multiplier metadata
   */
  getSmartDefaultTiers: protectedProcedure
    .input(z.object({
      region: z.string().optional(),
      product: z.string().optional(),
      trailerType: z.string().optional(),
    }).optional())
    .query(({ input }) => {
      const result = generateSmartRateTiers(input?.region, input?.product, input?.trailerType);
      return {
        tiers: result.tiers,
        surcharges: result.surcharges,
        regionInfo: result.regionInfo,
        productMultiplier: result.productMultiplier,
        trailerMultiplier: result.trailerMultiplier,
        availableRegions: Object.entries(REGION_MULTIPLIERS).map(([key, val]) => ({
          key,
          label: val.label,
          padd: val.padd,
          multiplier: val.mult,
        })),
        availableProducts: Object.entries(PRODUCT_MULTIPLIERS).map(([name, mult]) => ({
          name,
          multiplier: mult,
        })),
        availableTrailers: Object.entries(TRAILER_RATE_STRUCTURES).map(([key, val]) => ({
          key,
          multiplier: val.mult,
          unit: val.unit,
          defaultProduct: val.defaultProduct,
        })),
      };
    }),

  /**
   * Platform Rate Intelligence — aggregates completed loads into a rate index
   * Groups by 25-mile mileage bands and origin state to show actual market rates
   * on the platform. Even with low volume, the framework shows sophistication.
   */
  getPlatformRateIntelligence: protectedProcedure
    .input(z.object({
      state: z.string().optional(),
      cargoType: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { bands: [], totalLoads: 0, avgRatePerMile: 0, states: [], lastUpdated: null };

      try {
        // Query completed loads with distance and rate
        const completedStatuses = ["delivered", "invoiced", "paid", "complete"];
        let allRows: any[] = [];
        for (const status of completedStatuses) {
          try {
            const rows = await db.select({
              id: loads.id,
              distance: loads.distance,
              rate: loads.rate,
              pickupLocation: loads.pickupLocation,
              cargoType: loads.cargoType,
              volume: loads.volume,
              actualDeliveryDate: loads.actualDeliveryDate,
            }).from(loads)
              .where(eq(loads.status, status as any))
              .limit(500);
            allRows.push(...rows);
          } catch { /* skip status if column mismatch */ }
        }

        // Filter by state/cargo if requested
        let filtered = allRows.filter(r => {
          const dist = parseFloat(r.distance) || 0;
          const rate = parseFloat(r.rate) || 0;
          if (dist <= 0 || rate <= 0) return false;
          if (input?.state) {
            const pickup = r.pickupLocation as any;
            if (pickup?.state?.toUpperCase() !== input.state.toUpperCase()) return false;
          }
          if (input?.cargoType && r.cargoType !== input.cargoType) return false;
          return true;
        });

        // Build 25-mile mileage bands
        const bandSize = 25;
        const bandMap = new Map<number, { totalRate: number; totalRPM: number; count: number; minRate: number; maxRate: number }>();

        for (const row of filtered) {
          const dist = parseFloat(row.distance) || 0;
          const rate = parseFloat(row.rate) || 0;
          const rpm = dist > 0 ? rate / dist : 0;
          const bandKey = Math.floor(dist / bandSize) * bandSize;

          if (!bandMap.has(bandKey)) {
            bandMap.set(bandKey, { totalRate: 0, totalRPM: 0, count: 0, minRate: Infinity, maxRate: -Infinity });
          }
          const band = bandMap.get(bandKey)!;
          band.totalRate += rate;
          band.totalRPM += rpm;
          band.count++;
          band.minRate = Math.min(band.minRate, rate);
          band.maxRate = Math.max(band.maxRate, rate);
        }

        const bands = Array.from(bandMap.entries())
          .map(([minMiles, data]) => ({
            minMiles,
            maxMiles: minMiles + bandSize,
            avgRate: Math.round((data.totalRate / data.count) * 100) / 100,
            avgRatePerMile: Math.round((data.totalRPM / data.count) * 100) / 100,
            minRate: data.minRate === Infinity ? 0 : Math.round(data.minRate * 100) / 100,
            maxRate: data.maxRate === -Infinity ? 0 : Math.round(data.maxRate * 100) / 100,
            loadCount: data.count,
          }))
          .sort((a, b) => a.minMiles - b.minMiles);

        // Unique states with load counts
        const stateMap = new Map<string, number>();
        for (const row of filtered) {
          const pickup = row.pickupLocation as any;
          const st = pickup?.state?.toUpperCase() || "UNK";
          stateMap.set(st, (stateMap.get(st) || 0) + 1);
        }
        const states = Array.from(stateMap.entries())
          .map(([state, count]) => ({ state, count }))
          .sort((a, b) => b.count - a.count);

        const totalRate = filtered.reduce((s, r) => s + (parseFloat(r.rate) || 0), 0);
        const totalDist = filtered.reduce((s, r) => s + (parseFloat(r.distance) || 0), 0);

        return {
          bands,
          totalLoads: filtered.length,
          avgRatePerMile: totalDist > 0 ? Math.round((totalRate / totalDist) * 100) / 100 : 0,
          states,
          lastUpdated: new Date().toISOString(),
        };
      } catch (e) {
        console.error("[RateSheet] getPlatformRateIntelligence error:", e);
        return { bands: [], totalLoads: 0, avgRatePerMile: 0, states: [], lastUpdated: null };
      }
    }),

  /**
   * Calculate rate for a specific run (preview)
   */
  calculateRate: protectedProcedure
    .input(z.object({
      netBarrels: z.number(),
      oneWayMiles: z.number(),
      waitTimeHours: z.number().default(0),
      isSplitLoad: z.boolean().default(false),
      isReject: z.boolean().default(false),
      travelSurchargeMiles: z.number().default(0),
      currentDieselPrice: z.number().optional(),
      // Optional custom rate tiers (if not provided, use defaults)
      rateTiers: z.array(rateTierSchema).optional(),
      surcharges: surchargeRulesSchema.optional(),
    }))
    .query(({ input }) => {
      const tiers = input.rateTiers || generateDefaultRateTiers();
      const surcharges = input.surcharges || {
        fscEnabled: true,
        fscBaselineDieselPrice: 3.75,
        fscMilesPerGallon: 5,
        fscPaddRegion: "3",
        waitTimeFreeHours: 1,
        waitTimeRatePerHour: 85,
        splitLoadFee: 50,
        rejectFee: 85,
        minimumBarrels: 160,
        travelSurchargePerMile: 1.50,
      };

      return calculateRunPayment(input.netBarrels, input.oneWayMiles, tiers, surcharges, {
        waitTimeHours: input.waitTimeHours,
        isSplitLoad: input.isSplitLoad,
        isReject: input.isReject,
        travelSurchargeMiles: input.travelSurchargeMiles,
        currentDieselPrice: input.currentDieselPrice,
      });
    }),

  /**
   * List rate sheets for the company
   */
  list: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const rows = await db.select().from(documents)
          .where(and(
            eq(documents.type, "rate_sheet"),
            eq(documents.companyId, ctx.user?.companyId || 0),
          ))
          .orderBy(desc(documents.createdAt))
          .limit(input?.limit || 20);
        return rows.map(r => ({
          id: r.id,
          name: r.name,
          status: r.status,
          createdAt: r.createdAt?.toISOString() || "",
        }));
      } catch (e) { return []; }
    }),

  // ─── RECONCILIATION STATEMENTS ───

  /**
   * Generate a reconciliation statement for a billing period
   * Aggregates all loads/run tickets for the period with payment calculations
   */
  generateReconciliation: protectedProcedure
    .input(z.object({
      periodStart: z.string(),
      periodEnd: z.string(),
      customerName: z.string(),
      carrierName: z.string(),
      // Line items (individual runs)
      lines: z.array(reconciliationLineSchema),
      // Rate info
      rateTiers: z.array(rateTierSchema).optional(),
      surcharges: surchargeRulesSchema.optional(),
      currentDieselPrice: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tiers = input.rateTiers || generateDefaultRateTiers();
      const surcharges = input.surcharges || {
        fscEnabled: true,
        fscBaselineDieselPrice: 3.75,
        fscMilesPerGallon: 5,
        fscPaddRegion: "3",
        waitTimeFreeHours: 1,
        waitTimeRatePerHour: 85,
        splitLoadFee: 50,
        rejectFee: 85,
        minimumBarrels: 160,
        travelSurchargePerMile: 1.50,
      };

      // Calculate payment for each line
      const calculatedLines = input.lines.map(line => {
        const payment = calculateRunPayment(
          line.netBarrels,
          line.oneWayMiles,
          tiers,
          surcharges,
          {
            waitTimeHours: line.waitTimeHours,
            isSplitLoad: line.isSplitLoad,
            isReject: line.isReject,
            travelSurchargeMiles: line.travelSurchargeMiles,
            currentDieselPrice: input.currentDieselPrice,
          }
        );

        return {
          ...line,
          ratePerBarrel: payment.ratePerBarrel,
          baseAmount: payment.baseAmount,
          fsc: payment.fsc,
          waitTimeCharge: payment.waitTimeCharge,
          splitLoadFee: payment.splitLoadFee,
          rejectFee: payment.rejectFee,
          travelSurcharge: payment.travelSurcharge,
          lineTotal: payment.totalAmount,
          breakdown: payment.breakdown,
        };
      });

      // Aggregate totals
      const totals = {
        totalRuns: calculatedLines.length,
        totalGrossBarrels: Math.round(calculatedLines.reduce((s, l) => s + l.grossBarrels, 0) * 100) / 100,
        totalNetBarrels: Math.round(calculatedLines.reduce((s, l) => s + l.netBarrels, 0) * 100) / 100,
        totalBaseAmount: Math.round(calculatedLines.reduce((s, l) => s + l.baseAmount, 0) * 100) / 100,
        totalFSC: Math.round(calculatedLines.reduce((s, l) => s + l.fsc, 0) * 100) / 100,
        totalWaitTimeCharges: Math.round(calculatedLines.reduce((s, l) => s + l.waitTimeCharge, 0) * 100) / 100,
        totalSplitLoadFees: Math.round(calculatedLines.reduce((s, l) => s + l.splitLoadFee, 0) * 100) / 100,
        totalRejectFees: Math.round(calculatedLines.reduce((s, l) => s + l.rejectFee, 0) * 100) / 100,
        totalTravelSurcharges: Math.round(calculatedLines.reduce((s, l) => s + l.travelSurcharge, 0) * 100) / 100,
        grandTotal: Math.round(calculatedLines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100,
        // BS&W deduction = gross - net
        totalBSWDeduction: Math.round(
          (calculatedLines.reduce((s, l) => s + l.grossBarrels, 0) -
           calculatedLines.reduce((s, l) => s + l.netBarrels, 0)) * 100
        ) / 100,
      };

      // Platform fee on the grand total
      const platformFees = calculatePlatformFee(totals.grandTotal);

      const reconciliationId = `RECON-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      // Store reconciliation
      const db = await getDb();
      if (db) {
        try {
          await db.insert(documents).values({
            userId: ctx.user?.id || 0,
            companyId: ctx.user?.companyId || 0,
            type: "reconciliation",
            name: `Reconciliation ${reconciliationId} — ${input.customerName}`,
            status: "active",
            fileUrl: "",
          } as any);
        } catch (e) { console.error("[Reconciliation] save error:", e); }
      }

      return {
        success: true,
        reconciliationId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        customerName: input.customerName,
        carrierName: input.carrierName,
        lines: calculatedLines,
        totals,
        // Platform fee breakdown — EusoTrip revenue model
        platformFees: {
          ...platformFees,
          feeSchedule: {
            transactionFeePercent: PLATFORM_FEE_SCHEDULE.transactionFeePercent,
            minimumFee: PLATFORM_FEE_SCHEDULE.minimumFee,
            maximumFee: PLATFORM_FEE_SCHEDULE.maximumFee,
          },
        },
        // Final amounts after platform fee
        settlement: {
          grossLoadPayment: totals.grandTotal,
          platformFee: platformFees.platformFeeAmount,
          paymentProcessing: platformFees.paymentProcessingFee,
          shipperOwes: platformFees.shipperPays,
          carrierReceives: platformFees.carrierReceives,
        },
        generatedAt: new Date().toISOString(),
        generatedBy: ctx.user?.id,
      };
    }),

  /**
   * List reconciliation statements
   */
  listReconciliations: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const rows = await db.select().from(documents)
          .where(and(
            eq(documents.type, "reconciliation"),
            eq(documents.companyId, ctx.user?.companyId || 0),
          ))
          .orderBy(desc(documents.createdAt))
          .limit(input?.limit || 20);
        return rows.map(r => ({
          id: r.id,
          name: r.name,
          status: r.status,
          createdAt: r.createdAt?.toISOString() || "",
        }));
      } catch (e) { return []; }
    }),

  /**
   * Get reconciliation summary stats
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { totalStatements: 0, totalPaid: 0, pending: 0 };
    try {
      const [stats] = await db.select({
        total: sql<number>`COUNT(*)`,
      }).from(documents).where(and(
        eq(documents.type, "reconciliation"),
        eq(documents.companyId, ctx.user?.companyId || 0),
      ));
      return {
        totalStatements: stats?.total || 0,
        totalPaid: 0,
        pending: 0,
      };
    } catch (e) { return { totalStatements: 0, totalPaid: 0, pending: 0 }; }
  }),

  /**
   * Get EusoTicket documents for all transaction parties
   * Returns BOLs, run tickets, rate sheets, and reconciliation statements
   * visible to the requesting user based on their role in each transaction
   */
  getEusoTicketDocuments: protectedProcedure
    .input(z.object({
      type: z.enum(["all", "bol", "run_ticket", "rate_sheet", "reconciliation"]).default("all"),
      limit: z.number().default(50),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { documents: [], stats: { bols: 0, runTickets: 0, rateSheets: 0, reconciliations: 0 } };
      try {
        const userId = ctx.user?.id || 0;
        const companyId = ctx.user?.companyId || 0;
        const filterType = input?.type || "all";
        const limit = input?.limit || 50;

        // Get all EusoTicket document types visible to this user
        // User can see docs where they are: the creator, or in the same company,
        // or involved in the load (as shipper, catalyst, driver, broker, terminal)
        const docTypes = filterType === "all"
          ? ["bol", "run_ticket", "rate_sheet", "reconciliation"]
          : [filterType];

        const allDocs: any[] = [];
        for (const dtype of docTypes) {
          try {
            const rows = await db.select().from(documents)
              .where(
                and(
                  eq(documents.type, dtype as any),
                  sql`(${documents.userId} = ${userId} OR ${documents.companyId} = ${companyId})`,
                )
              )
              .orderBy(desc(documents.createdAt))
              .limit(limit);
            allDocs.push(...rows.map(r => ({
              id: r.id,
              type: dtype,
              name: r.name,
              status: r.status,
              fileUrl: (r as any).fileUrl || "",
              createdAt: r.createdAt?.toISOString() || "",
              isOwner: (r as any).userId === userId,
            })));
          } catch (e) { /* skip type if error */ }
        }

        // Sort by date desc
        allDocs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Stats
        const stats = {
          bols: allDocs.filter(d => d.type === "bol").length,
          runTickets: allDocs.filter(d => d.type === "run_ticket").length,
          rateSheets: allDocs.filter(d => d.type === "rate_sheet").length,
          reconciliations: allDocs.filter(d => d.type === "reconciliation").length,
        };

        return { documents: allDocs.slice(0, limit), stats };
      } catch (e) {
        return { documents: [], stats: { bols: 0, runTickets: 0, rateSheets: 0, reconciliations: 0 } };
      }
    }),

  /**
   * TICKET RECONCILIATION — Real-world accounting process
   * Matches internal run ticket records against external BOL declarations
   * to verify volume, product, rate, and financial accuracy.
   *
   * Process: Record Retrieval → Matching → Investigation → Adjustment
   * Status: green (matched), amber (minor variance), red (discrepancy)
   */
  reconcileTickets: protectedProcedure
    .input(z.object({
      periodStart: z.string(),
      periodEnd: z.string(),
      customerName: z.string().optional(),
      carrierName: z.string().optional(),
    }))
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { matched: [], unmatched: [], summary: { total: 0, matched: 0, discrepancies: 0, unmatched: 0, volumeVariance: 0, financialVariance: 0 } };

      try {
        // 1. RECORD RETRIEVAL — Gather internal run tickets and external BOLs
        const userId = ctx.user?.id || 0;
        const companyId = ctx.user?.companyId || 0;

        const [runTicketDocs, bolDocs] = await Promise.all([
          db.select().from(documents)
            .where(and(
              eq(documents.type, "run_ticket"),
              sql`(${documents.userId} = ${userId} OR ${documents.companyId} = ${companyId})`,
            ))
            .orderBy(desc(documents.createdAt))
            .limit(200),
          db.select().from(documents)
            .where(and(
              eq(documents.type, "bol"),
              sql`(${documents.userId} = ${userId} OR ${documents.companyId} = ${companyId})`,
            ))
            .orderBy(desc(documents.createdAt))
            .limit(200),
        ]);

        // Parse metadata from fileUrl
        const runTickets = runTicketDocs.map(d => {
          let meta: any = {};
          try { meta = typeof d.fileUrl === 'string' && d.fileUrl.startsWith('{') ? JSON.parse(d.fileUrl) : {}; } catch { meta = {}; }
          return { docId: d.id, createdAt: d.createdAt?.toISOString() || "", ...meta };
        });

        const bols = bolDocs.map(d => {
          let meta: any = {};
          try { meta = typeof d.fileUrl === 'string' && d.fileUrl.startsWith('{') ? JSON.parse(d.fileUrl) : {}; } catch { meta = {}; }
          return { docId: d.id, createdAt: d.createdAt?.toISOString() || "", ...meta };
        });

        // 2. MATCHING — Compare run tickets to BOLs on multiple keys
        type MatchResult = {
          ticketNumber: string;
          bolNumber: string;
          ticketDocId: number;
          bolDocId: number;
          // Volume comparison
          ticketNetBBL: number;
          bolDeclaredQty: number;
          volumeVariancePct: number;
          volumeStatus: "green" | "amber" | "red";
          // Product comparison
          ticketProduct: string;
          bolProduct: string;
          productMatch: boolean;
          // Rate comparison
          ticketRate: number;
          agreedRate: number;
          rateVariancePct: number;
          rateStatus: "green" | "amber" | "red";
          // Driver / route
          driverName: string;
          origin: string;
          destination: string;
          miles: number;
          // Overall
          overallStatus: "green" | "amber" | "red";
          flags: string[];
          matchedAt: string;
        };

        const matched: MatchResult[] = [];
        const usedBolIds = new Set<number>();
        const usedTicketIds = new Set<number>();

        for (const ticket of runTickets) {
          // Try to find a matching BOL by date proximity, product, and volume similarity
          let bestMatch: any = null;
          let bestScore = 0;

          for (const bol of bols) {
            if (usedBolIds.has(bol.docId)) continue;

            let score = 0;
            // Date proximity (same day = 3pts, ±1 day = 2pts, ±3 days = 1pt)
            const ticketDate = new Date(ticket.ticketDate || ticket.createdAt).getTime();
            const bolDate = new Date(bol.shipDate || bol.createdAt).getTime();
            const dayDiff = Math.abs(ticketDate - bolDate) / 86400000;
            if (dayDiff < 1) score += 3;
            else if (dayDiff < 2) score += 2;
            else if (dayDiff < 4) score += 1;

            // Product match
            const tProd = (ticket.productType || "").toLowerCase();
            const bProd = (bol.items?.[0]?.description || bol.productName || "").toLowerCase();
            if (tProd && bProd && (tProd.includes(bProd) || bProd.includes(tProd) || tProd === bProd)) score += 3;

            // Volume similarity (within 10%)
            const tVol = ticket.netBarrels || ticket.grossBarrels || 0;
            const bVol = bol.items?.[0]?.quantity || bol.quantity || 0;
            if (tVol > 0 && bVol > 0) {
              const volDiff = Math.abs(tVol - bVol) / Math.max(tVol, bVol);
              if (volDiff < 0.02) score += 3;
              else if (volDiff < 0.05) score += 2;
              else if (volDiff < 0.10) score += 1;
            }

            // Driver/carrier name match
            const tDriver = (ticket.driverName || ticket.transporterName || "").toLowerCase();
            const bCarrier = (bol.catalyst?.name || bol.carrier?.name || "").toLowerCase();
            if (tDriver && bCarrier && (tDriver.includes(bCarrier) || bCarrier.includes(tDriver))) score += 2;

            if (score > bestScore) {
              bestScore = score;
              bestMatch = bol;
            }
          }

          // Require minimum score of 3 to consider a match
          if (bestMatch && bestScore >= 3) {
            usedBolIds.add(bestMatch.docId);
            usedTicketIds.add(ticket.docId);

            const tVol = ticket.netBarrels || ticket.grossBarrels || 0;
            const bVol = bestMatch.items?.[0]?.quantity || bestMatch.quantity || 0;
            const volVar = bVol > 0 ? ((tVol - bVol) / bVol * 100) : 0;
            const volStatus: "green" | "amber" | "red" = Math.abs(volVar) <= 2 ? "green" : Math.abs(volVar) <= 5 ? "amber" : "red";

            const tProd = ticket.productType || "N/A";
            const bProd = bestMatch.items?.[0]?.description || bestMatch.productName || "N/A";
            const prodMatch = tProd.toLowerCase().includes(bProd.toLowerCase()) || bProd.toLowerCase().includes(tProd.toLowerCase());

            const tRate = ticket.lineTotal || 0;
            const aRate = bestMatch.agreedRate || bestMatch.totalWeight || 0; // agreed rate if stored
            const rateVar = aRate > 0 ? ((tRate - aRate) / aRate * 100) : 0;
            const rateStatus: "green" | "amber" | "red" = aRate === 0 ? "green" : Math.abs(rateVar) <= 5 ? "green" : Math.abs(rateVar) <= 10 ? "amber" : "red";

            const flags: string[] = [];
            if (volStatus === "red") flags.push("Volume discrepancy exceeds 5% tolerance");
            if (volStatus === "amber") flags.push("Volume variance 2-5% — verify gauging");
            if (!prodMatch) flags.push("Product mismatch between run ticket and BOL");
            if (rateStatus === "red") flags.push("Rate discrepancy exceeds 10% tolerance");
            if (rateStatus === "amber") flags.push("Rate variance 5-10% — verify surcharges");
            if (ticket.isReject) flags.push("Run ticket marked as REJECT");
            if (ticket.qualityNote === "High BS&W") flags.push("High BS&W noted on run ticket");

            const overallStatus: "green" | "amber" | "red" =
              flags.some(f => f.includes("discrepancy") || f.includes("mismatch") || f.includes("REJECT")) ? "red" :
              flags.length > 0 ? "amber" : "green";

            matched.push({
              ticketNumber: ticket.ticketNumber || `ET-${ticket.docId}`,
              bolNumber: bestMatch.bolNumber || `BOL-${bestMatch.docId}`,
              ticketDocId: ticket.docId,
              bolDocId: bestMatch.docId,
              ticketNetBBL: tVol,
              bolDeclaredQty: bVol,
              volumeVariancePct: Math.round(volVar * 10) / 10,
              volumeStatus: volStatus,
              ticketProduct: tProd,
              bolProduct: bProd,
              productMatch: prodMatch,
              ticketRate: tRate,
              agreedRate: aRate,
              rateVariancePct: Math.round(rateVar * 10) / 10,
              rateStatus: rateStatus,
              driverName: ticket.driverName || "Unknown",
              origin: ticket.operatorLeasePlant || ticket.originTerminal || "N/A",
              destination: ticket.destinationStation || ticket.destination || "N/A",
              miles: ticket.destinationMiles || 0,
              overallStatus,
              flags,
              matchedAt: new Date().toISOString(),
            });
          }
        }

        // 3. UNMATCHED ITEMS — items that couldn't be paired
        const unmatchedTickets = runTickets.filter(t => !usedTicketIds.has(t.docId)).map(t => ({
          type: "run_ticket" as const,
          id: t.docId,
          number: t.ticketNumber || `ET-${t.docId}`,
          date: t.ticketDate || t.createdAt,
          product: t.productType || "N/A",
          volume: t.netBarrels || t.grossBarrels || 0,
          driver: t.driverName || "Unknown",
          reason: "No matching BOL found",
        }));

        const unmatchedBOLs = bols.filter(b => !usedBolIds.has(b.docId)).map(b => ({
          type: "bol" as const,
          id: b.docId,
          number: b.bolNumber || `BOL-${b.docId}`,
          date: b.shipDate || b.createdAt,
          product: b.items?.[0]?.description || b.productName || "N/A",
          volume: b.items?.[0]?.quantity || b.quantity || 0,
          driver: b.catalyst?.name || b.carrier?.name || "N/A",
          reason: "No matching run ticket found",
        }));

        const unmatched = [...unmatchedTickets, ...unmatchedBOLs];

        // 4. SUMMARY — overall reconciliation health
        const totalVolumeVariance = matched.reduce((s, m) => s + Math.abs(m.ticketNetBBL - m.bolDeclaredQty), 0);
        const totalFinancialVariance = matched.reduce((s, m) => s + Math.abs(m.ticketRate - m.agreedRate), 0);

        const summary = {
          total: runTickets.length + bols.length,
          matched: matched.length,
          discrepancies: matched.filter(m => m.overallStatus === "red").length,
          warnings: matched.filter(m => m.overallStatus === "amber").length,
          clean: matched.filter(m => m.overallStatus === "green").length,
          unmatched: unmatched.length,
          unmatchedTickets: unmatchedTickets.length,
          unmatchedBOLs: unmatchedBOLs.length,
          volumeVariance: Math.round(totalVolumeVariance * 100) / 100,
          financialVariance: Math.round(totalFinancialVariance * 100) / 100,
          reconciliationScore: matched.length > 0 
            ? Math.round((matched.filter(m => m.overallStatus === "green").length / matched.length) * 100)
            : 0,
        };

        return { matched, unmatched, summary };
      } catch (error) {
        console.error("[Reconciliation] reconcileTickets error:", error);
        return { matched: [], unmatched: [], summary: { total: 0, matched: 0, discrepancies: 0, warnings: 0, clean: 0, unmatched: 0, unmatchedTickets: 0, unmatchedBOLs: 0, volumeVariance: 0, financialVariance: 0, reconciliationScore: 0 } };
      }
    }),

  // ─── NAMED RATE SHEET MANAGEMENT (multi-sheet per user) ───

  /**
   * Save a new named rate sheet with full tier + surcharge data
   * Available to: catalyst, broker, shipper, terminal
   */
  saveRateSheet: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(200),
      region: z.string().optional(), // e.g., "Permian Basin", "Eagle Ford"
      productType: z.string().optional(), // e.g., "Crude Oil", "NGL", "General Freight", "Refrigerated Goods"
      trailerType: z.string().optional(), // e.g., "tanker", "dry_van", "reefer", "flatbed", "step_deck", "lowboy"
      rateUnit: z.string().optional(), // e.g., "per_barrel", "per_mile", "per_cwt", "flat_rate", "per_pallet"
      effectiveDate: z.string().optional(),
      expirationDate: z.string().optional(),
      agreementId: z.number().optional(), // link to an agreement/load
      rateTiers: z.array(rateTierSchema),
      surcharges: surchargeRulesSchema,
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const payload = JSON.stringify({
        name: input.name,
        region: input.region || null,
        productType: input.productType || "Crude Oil",
        trailerType: input.trailerType || "tanker",
        rateUnit: input.rateUnit || "per_barrel",
        effectiveDate: input.effectiveDate || new Date().toISOString().split("T")[0],
        expirationDate: input.expirationDate || null,
        agreementId: input.agreementId || null,
        rateTiers: input.rateTiers,
        surcharges: input.surcharges,
        notes: input.notes || null,
        version: 1,
      });

      try {
        const result = await db.insert(documents).values({
          userId: ctx.user?.id || 0,
          companyId: ctx.user?.companyId || 0,
          agreementId: input.agreementId || null,
          type: "rate_sheet",
          name: input.name,
          status: "active",
          fileUrl: payload,
        } as any).$returningId();

        const insertId = result?.[0]?.id || 0;
        return { success: true, id: insertId, name: input.name, tierCount: input.rateTiers.length };
      } catch (e: any) {
        console.error("[RateSheet] saveRateSheet error:", e);
        throw new Error("Failed to save rate sheet");
      }
    }),

  /**
   * Get a single rate sheet with full data (tiers, surcharges)
   */
  getRateSheet: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const [row] = await db.select().from(documents)
          .where(and(
            eq(documents.id, input.id),
            eq(documents.type, "rate_sheet"),
            sql`(${documents.userId} = ${ctx.user?.id || 0} OR ${documents.companyId} = ${ctx.user?.companyId || 0})`,
          ))
          .limit(1);
        if (!row) return null;

        let meta: any = {};
        try { meta = typeof row.fileUrl === 'string' && row.fileUrl.startsWith('{') ? JSON.parse(row.fileUrl) : {}; } catch { meta = {}; }

        return {
          id: row.id,
          name: row.name,
          status: row.status,
          createdAt: row.createdAt?.toISOString() || "",
          region: meta.region || null,
          productType: meta.productType || "Crude Oil",
          trailerType: meta.trailerType || "tanker",
          rateUnit: meta.rateUnit || "per_barrel",
          effectiveDate: meta.effectiveDate || null,
          expirationDate: meta.expirationDate || null,
          agreementId: (row as any).agreementId || meta.agreementId || null,
          rateTiers: meta.rateTiers || [],
          surcharges: meta.surcharges || {},
          notes: meta.notes || null,
          version: meta.version || 1,
        };
      } catch (e) { console.error("[RateSheet] getRateSheet error:", e); return null; }
    }),

  /**
   * Update an existing rate sheet (name, tiers, surcharges, agreement link)
   */
  updateRateSheet: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(200).optional(),
      region: z.string().optional(),
      productType: z.string().optional(),
      trailerType: z.string().optional(),
      rateUnit: z.string().optional(),
      effectiveDate: z.string().optional(),
      expirationDate: z.string().optional(),
      agreementId: z.number().nullable().optional(),
      rateTiers: z.array(rateTierSchema).optional(),
      surcharges: surchargeRulesSchema.optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      try {
        // Fetch existing
        const [existing] = await db.select().from(documents)
          .where(and(
            eq(documents.id, input.id),
            eq(documents.type, "rate_sheet"),
            sql`(${documents.userId} = ${ctx.user?.id || 0} OR ${documents.companyId} = ${ctx.user?.companyId || 0})`,
          ))
          .limit(1);
        if (!existing) throw new Error("Rate sheet not found");

        let meta: any = {};
        try { meta = typeof existing.fileUrl === 'string' && existing.fileUrl.startsWith('{') ? JSON.parse(existing.fileUrl) : {}; } catch { meta = {}; }

        // Store version snapshot before overwriting (audit trail)
        try {
          await db.insert(documents).values({
            userId: ctx.user?.id || 0,
            companyId: ctx.user?.companyId || 0,
            type: "rate_sheet_version",
            name: `${existing.name} — v${meta.version || 1}`,
            status: "active",
            fileUrl: JSON.stringify({
              ...meta,
              parentSheetId: input.id,
              snapshotVersion: meta.version || 1,
              snapshotAt: new Date().toISOString(),
              snapshotBy: ctx.user?.id,
            }),
          } as any);
        } catch (snapErr) { console.error("[RateSheet] snapshot save error:", snapErr); }

        // Merge updates
        const updated = {
          ...meta,
          name: input.name || meta.name,
          region: input.region !== undefined ? input.region : meta.region,
          productType: input.productType !== undefined ? input.productType : meta.productType,
          trailerType: input.trailerType !== undefined ? input.trailerType : meta.trailerType,
          rateUnit: input.rateUnit !== undefined ? input.rateUnit : meta.rateUnit,
          effectiveDate: input.effectiveDate !== undefined ? input.effectiveDate : meta.effectiveDate,
          expirationDate: input.expirationDate !== undefined ? input.expirationDate : meta.expirationDate,
          agreementId: input.agreementId !== undefined ? input.agreementId : meta.agreementId,
          rateTiers: input.rateTiers || meta.rateTiers,
          surcharges: input.surcharges || meta.surcharges,
          notes: input.notes !== undefined ? input.notes : meta.notes,
          version: (meta.version || 1) + 1,
          updatedAt: new Date().toISOString(),
        };

        const setPayload: any = {
            name: input.name || existing.name,
            fileUrl: JSON.stringify(updated),
          };
        if (input.agreementId !== undefined) {
          setPayload.agreementId = input.agreementId;
        }

        await db.update(documents)
          .set(setPayload)
          .where(eq(documents.id, input.id));

        return { success: true, id: input.id, version: updated.version };
      } catch (e: any) {
        console.error("[RateSheet] updateRateSheet error:", e);
        throw new Error(e.message || "Failed to update rate sheet");
      }
    }),

  /**
   * Delete (soft) a rate sheet
   */
  deleteRateSheet: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      try {
        await db.update(documents)
          .set({ status: "expired" } as any)
          .where(and(
            eq(documents.id, input.id),
            eq(documents.type, "rate_sheet"),
            sql`(${documents.userId} = ${ctx.user?.id || 0} OR ${documents.companyId} = ${ctx.user?.companyId || 0})`,
          ));
        return { success: true };
      } catch (e) { throw new Error("Failed to delete rate sheet"); }
    }),

  /**
   * Get version history for a rate sheet (audit trail)
   * Returns all previous snapshots sorted by version descending
   */
  getVersionHistory: protectedProcedure
    .input(z.object({ sheetId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const rows = await db.select().from(documents)
          .where(and(
            eq(documents.type, "rate_sheet_version"),
            sql`(${documents.userId} = ${ctx.user?.id || 0} OR ${documents.companyId} = ${ctx.user?.companyId || 0})`,
          ))
          .orderBy(desc(documents.createdAt))
          .limit(50);

        return rows
          .map(r => {
            let meta: any = {};
            try { meta = typeof r.fileUrl === 'string' && r.fileUrl.startsWith('{') ? JSON.parse(r.fileUrl) : {}; } catch { meta = {}; }
            if (meta.parentSheetId !== input.sheetId) return null;
            return {
              id: r.id,
              version: meta.snapshotVersion || 1,
              snapshotAt: meta.snapshotAt || r.createdAt?.toISOString() || "",
              name: meta.name || r.name,
              tierCount: meta.rateTiers?.length || 0,
              region: meta.region || null,
              productType: meta.productType || null,
              surcharges: meta.surcharges || null,
              rateTiers: meta.rateTiers || [],
            };
          })
          .filter(Boolean)
          .sort((a: any, b: any) => b.version - a.version);
      } catch (e) { console.error("[RateSheet] getVersionHistory error:", e); return []; }
    }),

  /**
   * List all active rate sheets for the current user/company
   * Returns summary info (no full tier data) for the list view
   */
  listMyRateSheets: protectedProcedure
    .input(z.object({ includeExpired: z.boolean().default(false) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const conditions = [
          eq(documents.type, "rate_sheet"),
          sql`(${documents.userId} = ${ctx.user?.id || 0} OR ${documents.companyId} = ${ctx.user?.companyId || 0})`,
        ];
        if (!input?.includeExpired) {
          conditions.push(eq(documents.status, "active"));
        }

        const rows = await db.select().from(documents)
          .where(and(...conditions))
          .orderBy(desc(documents.createdAt))
          .limit(100);

        return rows.map(r => {
          let meta: any = {};
          try { meta = typeof r.fileUrl === 'string' && r.fileUrl.startsWith('{') ? JSON.parse(r.fileUrl) : {}; } catch { meta = {}; }
          return {
            id: r.id,
            name: r.name,
            status: r.status,
            createdAt: r.createdAt?.toISOString() || "",
            region: meta.region || null,
            productType: meta.productType || "Crude Oil",
            trailerType: meta.trailerType || "tanker",
            rateUnit: meta.rateUnit || "per_barrel",
            effectiveDate: meta.effectiveDate || null,
            expirationDate: meta.expirationDate || null,
            agreementId: (r as any).agreementId || meta.agreementId || null,
            tierCount: meta.rateTiers?.length || 0,
            maxMiles: meta.rateTiers?.length > 0 ? meta.rateTiers[meta.rateTiers.length - 1]?.maxMiles || 0 : 0,
            notes: meta.notes || null,
            version: meta.version || 1,
          };
        });
      } catch (e) { console.error("[RateSheet] listMyRateSheets error:", e); return []; }
    }),

  /**
   * Get platform fee schedule (visible to all users)
   */
  getPlatformFeeSchedule: protectedProcedure.query(() => {
    return {
      transactionFeePercent: PLATFORM_FEE_SCHEDULE.transactionFeePercent,
      minimumFee: PLATFORM_FEE_SCHEDULE.minimumFee,
      maximumFee: PLATFORM_FEE_SCHEDULE.maximumFee,
      paymentProcessingPercent: PLATFORM_FEE_SCHEDULE.paymentProcessingPercent,
      paymentProcessingFlat: PLATFORM_FEE_SCHEDULE.paymentProcessingFlat,
      includes: ["BOL generation", "Run ticket generation", "Reconciliation statements", "Document storage", "Load lifecycle tracking"],
      description: "EusoTrip charges a transparent platform fee on every reconciled load payment. The fee covers full EusoTicket document generation, secure escrow, and payment processing.",
    };
  }),

  /**
   * Preview platform fee for a given amount
   */
  previewPlatformFee: protectedProcedure
    .input(z.object({ grossAmount: z.number() }))
    .query(({ input }) => {
      return calculatePlatformFee(input.grossAmount);
    }),

  /**
   * Digitize an uploaded rate sheet file (CSV, XLSX, XLS, PDF)
   * Extracts rate tiers + surcharges and optionally saves as a new rate sheet.
   * Accepts base64 file data (same pattern as document uploads).
   */
  digitize: protectedProcedure
    .input(z.object({
      fileBase64: z.string().min(1),
      fileName: z.string().min(1),
      mimeType: z.string().min(1),
      autoSave: z.boolean().default(false),
      sheetName: z.string().optional(),
      region: z.string().optional(),
      agreementId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Decode base64
      const raw = input.fileBase64.includes(",")
        ? input.fileBase64.split(",")[1]
        : input.fileBase64;
      const buffer = Buffer.from(raw, "base64");

      // 20MB limit
      if (buffer.length > 20 * 1024 * 1024) {
        throw new Error("File too large. Maximum 20MB.");
      }

      const result = await digitizeRateSheet(buffer, input.fileName, input.mimeType);

      // Auto-save as a new rate sheet if requested
      let savedId: number | null = null;
      if (input.autoSave && result.rateTiers.length > 0) {
        const db = await getDb();
        if (db) {
          const name = input.sheetName || `Imported: ${input.fileName.replace(/\.[^.]+$/, "")}`;
          const payload = JSON.stringify({
            name,
            region: input.region || result.region || null,
            productType: result.productType || "Crude Oil",
            trailerType: "tanker",
            rateUnit: result.rateUnit,
            effectiveDate: new Date().toISOString().split("T")[0],
            expirationDate: null,
            agreementId: input.agreementId || null,
            rateTiers: result.rateTiers,
            surcharges: result.surcharges,
            notes: `Digitized from ${input.fileName} (${result.source.toUpperCase()})`,
            version: 1,
            importedFrom: input.fileName,
            importedAt: new Date().toISOString(),
          });

          try {
            const insertResult = await db.insert(documents).values({
              userId: ctx.user?.id || 0,
              companyId: ctx.user?.companyId || 0,
              agreementId: input.agreementId || null,
              type: "rate_sheet",
              name,
              status: "active",
              fileUrl: payload,
            } as any).$returningId();
            savedId = insertResult?.[0]?.id || null;
          } catch (e: any) {
            result.warnings.push(`Auto-save failed: ${e.message}`);
          }
        }
      }

      return {
        ...result,
        savedId,
        tierCount: result.rateTiers.length,
        fileName: input.fileName,
      };
    }),
});
