/**
 * DYNAMIC PLATFORM FEE & COMMISSION ENGINE
 * TEAM ALPHA - FINTECH CORE
 *
 * Extracted from Python CommissionService architecture:
 * - Dynamic fee: BASE_FEE * (1 + RISK_FACTOR - GAMIFICATION_BONUS) * COMMODITY_FACTOR
 * - Fee range: 5% min, 8% base, 15% max
 * - Risk factors: HazMat premium, long-haul premium
 * - Gamification bonus: higher driver score = lower fee (up to 3%)
 * - Commodity factor: volatile pricing (WTI, BDI) adjusts fee
 * - Driver commission: 25% of gross rate
 * - Net to catalyst: gross - platform fee - driver commission
 *
 * Every load, every transaction, every time.
 */

import { z } from "zod";
import { router, isolatedApprovedProcedure as protectedProcedure } from "../_core/trpc";
import { getLiveCommodityValues, getAllCommodityIndexes } from "../_core/commodityData";

// ── CONSTANTS ──
const BASE_PLATFORM_FEE = 0.08;  // 8%
const MAX_PLATFORM_FEE = 0.15;   // 15%
const MIN_PLATFORM_FEE = 0.05;   // 5%
const DRIVER_COMMISSION_RATE = 0.25; // 25%
const GAMIFICATION_MAX_BONUS = 0.03; // 3%
const COMMODITY_NORMALIZATION_BASE = 50.0;

// ── HELPER FUNCTIONS ──

async function getCommodityIndexFactor(cargoType: string): Promise<number> {
  if (['liquid', 'petroleum', 'gas', 'chemicals'].includes(cargoType)) {
    const live = await getLiveCommodityValues();
    const index = cargoType === 'liquid' || cargoType === 'petroleum' ? 'WTI' : 'BDI';
    const indexValue = live[index] || COMMODITY_NORMALIZATION_BASE;
    return Math.round((indexValue / COMMODITY_NORMALIZATION_BASE) * 10000) / 10000;
  }
  return 1.0;
}

function calculateRiskFactor(cargoType: string, distanceMiles: number, hazmatClass?: string): number {
  let risk = 0;
  // HazMat / Liquid Bulk risk premium
  if (['hazmat', 'liquid', 'petroleum', 'gas', 'chemicals'].includes(cargoType) || hazmatClass) {
    risk += 0.02; // 2%
  }
  // Long haul premium
  if (distanceMiles > 1500) {
    risk += 0.01; // 1%
  }
  // Oversized premium
  if (cargoType === 'oversized') {
    risk += 0.015; // 1.5%
  }
  return risk;
}

function calculateGamificationBonus(driverScore: number): number {
  // Score 0.0–1.0, max 3% bonus
  const clampedScore = Math.max(0, Math.min(1, driverScore));
  return Math.round(clampedScore * GAMIFICATION_MAX_BONUS * 10000) / 10000;
}

async function calculateDynamicPlatformFee(
  cargoType: string,
  distanceMiles: number,
  driverScore: number,
  hazmatClass?: string
): Promise<number> {
  const riskFactor = calculateRiskFactor(cargoType, distanceMiles, hazmatClass);
  const gamificationBonus = calculateGamificationBonus(driverScore);
  const commodityFactor = await getCommodityIndexFactor(cargoType);

  // Formula: BASE_FEE * (1 + RISK_FACTOR - GAMIFICATION_BONUS) * COMMODITY_FACTOR
  const dynamicRate = BASE_PLATFORM_FEE * (1.0 + riskFactor - gamificationBonus) * commodityFactor;

  // Enforce min/max
  const finalRate = Math.max(MIN_PLATFORM_FEE, Math.min(MAX_PLATFORM_FEE, dynamicRate));
  return Math.round(finalRate * 10000) / 10000;
}

async function calculateSplit(
  grossRate: number,
  cargoType: string,
  distanceMiles: number,
  driverScore: number,
  hazmatClass?: string
) {
  const platformFeeRate = await calculateDynamicPlatformFee(cargoType, distanceMiles, driverScore, hazmatClass);
  const platformFeeAmount = Math.round(grossRate * platformFeeRate * 100) / 100;
  const driverCommission = Math.round(grossRate * DRIVER_COMMISSION_RATE * 100) / 100;
  const netToCatalyst = Math.round((grossRate - platformFeeAmount - driverCommission) * 100) / 100;
  const commodityFactor = await getCommodityIndexFactor(cargoType);

  return {
    grossRate: Math.round(grossRate * 100) / 100,
    platformFeeRate,
    platformFeePercent: Math.round(platformFeeRate * 100 * 100) / 100,
    platformFeeAmount,
    driverCommissionRate: DRIVER_COMMISSION_RATE,
    driverCommissionPercent: DRIVER_COMMISSION_RATE * 100,
    driverCommission,
    netToCatalyst,
    riskFactor: calculateRiskFactor(cargoType, distanceMiles, hazmatClass),
    gamificationBonus: calculateGamificationBonus(driverScore),
    commodityFactor,
  };
}

// ── TRPC ROUTER ──

export const commissionEngineRouter = router({
  /**
   * Calculate the full financial split for a load
   * Used by: agreement generation, load creation, payment processing
   */
  calculateSplit: protectedProcedure
    .input(z.object({
      grossRate: z.number().min(0),
      cargoType: z.string().default("general"),
      distanceMiles: z.number().default(0),
      driverScore: z.number().min(0).max(1).default(0.5),
      hazmatClass: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return calculateSplit(
        input.grossRate,
        input.cargoType,
        input.distanceMiles,
        input.driverScore,
        input.hazmatClass
      );
    }),

  /**
   * Get the dynamic platform fee rate (without full split)
   */
  getFeeRate: protectedProcedure
    .input(z.object({
      cargoType: z.string().default("general"),
      distanceMiles: z.number().default(0),
      driverScore: z.number().min(0).max(1).default(0.5),
      hazmatClass: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const rate = await calculateDynamicPlatformFee(input.cargoType, input.distanceMiles, input.driverScore, input.hazmatClass);
      const commodityFactor = await getCommodityIndexFactor(input.cargoType);
      return {
        feeRate: rate,
        feePercent: Math.round(rate * 100 * 100) / 100,
        baseFee: BASE_PLATFORM_FEE,
        minFee: MIN_PLATFORM_FEE,
        maxFee: MAX_PLATFORM_FEE,
        riskFactor: calculateRiskFactor(input.cargoType, input.distanceMiles, input.hazmatClass),
        gamificationBonus: calculateGamificationBonus(input.driverScore),
        commodityFactor,
      };
    }),

  /**
   * Batch calculate splits for multiple loads (for settlement/invoice batches)
   */
  batchCalculate: protectedProcedure
    .input(z.object({
      loads: z.array(z.object({
        loadId: z.string(),
        grossRate: z.number(),
        cargoType: z.string().default("general"),
        distanceMiles: z.number().default(0),
        driverScore: z.number().min(0).max(1).default(0.5),
        hazmatClass: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const results = await Promise.all(input.loads.map(async l => ({
        loadId: l.loadId,
        ...(await calculateSplit(l.grossRate, l.cargoType, l.distanceMiles, l.driverScore, l.hazmatClass)),
      })));
      const totalGross = results.reduce((s, r) => s + r.grossRate, 0);
      const totalFees = results.reduce((s, r) => s + r.platformFeeAmount, 0);
      const totalDriverComm = results.reduce((s, r) => s + r.driverCommission, 0);
      const totalNetCatalyst = results.reduce((s, r) => s + r.netToCatalyst, 0);
      return {
        loads: results,
        summary: {
          totalLoads: results.length,
          totalGross: Math.round(totalGross * 100) / 100,
          totalPlatformFees: Math.round(totalFees * 100) / 100,
          totalDriverCommissions: Math.round(totalDriverComm * 100) / 100,
          totalNetToCatalyst: Math.round(totalNetCatalyst * 100) / 100,
          avgFeePercent: results.length > 0 ? Math.round((results.reduce((s, r) => s + r.platformFeePercent, 0) / results.length) * 100) / 100 : 0,
        },
      };
    }),

  /**
   * Get commodity index values (for display in dashboards)
   */
  getCommodityIndexes: protectedProcedure.query(async () => {
    return getAllCommodityIndexes();
  }),

  /**
   * Get fee structure constants (for UI display)
   */
  getFeeStructure: protectedProcedure.query(() => ({
    baseFeePercent: BASE_PLATFORM_FEE * 100,
    minFeePercent: MIN_PLATFORM_FEE * 100,
    maxFeePercent: MAX_PLATFORM_FEE * 100,
    driverCommissionPercent: DRIVER_COMMISSION_RATE * 100,
    gamificationMaxBonusPercent: GAMIFICATION_MAX_BONUS * 100,
    riskPremiums: {
      hazmat: 2.0,
      longHaul: 1.0,
      oversized: 1.5,
    },
    description: "Dynamic fee formula: BASE × (1 + RISK - GAMIFICATION_BONUS) × COMMODITY_FACTOR",
  })),
});
