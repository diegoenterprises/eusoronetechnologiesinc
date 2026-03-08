/**
 * GAP-346: Predictive Load Pricing Router
 * Surfaces ML engine rate prediction, dynamic pricing, demand forecasting,
 * and market intelligence to the frontend.
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const predictivePricingRouter = router({
  // ── Predict rate for a lane ──
  predictRate: protectedProcedure
    .input(z.object({
      originState: z.string().min(2),
      destState: z.string().min(2),
      distance: z.number().min(1),
      weight: z.number().optional(),
      equipmentType: z.string().optional(),
      cargoType: z.string().optional(),
      urgency: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]).optional(),
    }))
    .query(async ({ input }) => {
      try {
        const { mlEngine } = await import("../services/mlEngine");
        if (mlEngine.isReady()) {
          return mlEngine.predictRate(input);
        }
      } catch {}
      // Fallback to forecast engine
      try {
        const { predictRate } = await import("../services/ai/forecastEngine");
        const result = predictRate([], 0, {
          isHazmat: input.cargoType === "hazmat" || input.cargoType === "petroleum",
          season: new Date().getMonth() + 1,
          distance: input.distance,
        });
        return {
          predictedSpotRate: result.predictedRate,
          predictedContractRate: Math.round(result.predictedRate * 1.06 * 100) / 100,
          confidence: result.confidence,
          priceRange: { low: result.range.low, high: result.range.high },
          factors: result.factors.map((f: any) => ({ name: f.name, impact: Math.round(f.impact), direction: f.impact > 0 ? "up" : "down" })),
          marketCondition: result.marketPosition === "ABOVE_MARKET" ? "SELLER" : result.marketPosition === "BELOW_MARKET" ? "BUYER" : "BALANCED",
          recommendation: "Enter origin/destination states and distance for ML-powered predictions",
          basedOnSamples: 0,
        };
      } catch {}
      return {
        predictedSpotRate: 0, predictedContractRate: 0, confidence: 0,
        priceRange: { low: 0, high: 0 }, factors: [],
        marketCondition: "BALANCED" as const, recommendation: "ML engine not yet trained", basedOnSamples: 0,
      };
    }),

  // ── Dynamic pricing recommendation ──
  getDynamicPrice: protectedProcedure
    .input(z.object({
      originState: z.string().min(2),
      destState: z.string().min(2),
      distance: z.number().min(1),
      weight: z.number().optional(),
      equipmentType: z.string().optional(),
      cargoType: z.string().optional(),
      pickupDate: z.string().optional(),
      urgency: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]).optional(),
    }))
    .query(async ({ input }) => {
      try {
        const { mlEngine } = await import("../services/mlEngine");
        if (mlEngine.isReady()) {
          return mlEngine.getDynamicPrice(input);
        }
      } catch {}
      return {
        recommendedRate: 0, ratePerMile: 0, urgencyMultiplier: 1,
        demandMultiplier: 1, seasonalMultiplier: 1,
        competitivePosition: "AT_MARKET" as const, savingsVsMarket: 0,
        explanation: "ML engine not yet trained — submit loads to build lane data",
      };
    }),

  // ── Demand forecast for a lane ──
  forecastDemand: protectedProcedure
    .input(z.object({
      originState: z.string().optional(),
      destState: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        const { mlEngine } = await import("../services/mlEngine");
        if (mlEngine.isReady()) {
          return await mlEngine.forecastDemandAdvanced(input);
        }
      } catch {}
      return {
        lane: "ALL", currentWeekVolume: 0, nextWeekForecast: 0,
        next4WeekForecast: [0, 0, 0, 0], trend: "STABLE" as const,
        seasonalFactor: 1, confidence: 0, topLanes: [],
      };
    }),

  // ── Anomaly detection for a rate ──
  detectAnomalies: protectedProcedure
    .input(z.object({
      rate: z.number(),
      distance: z.number(),
      originState: z.string(),
      destState: z.string(),
      weight: z.number().optional(),
    }))
    .query(async ({ input }) => {
      try {
        const { mlEngine } = await import("../services/mlEngine");
        if (mlEngine.isReady()) {
          return mlEngine.detectAnomalies(input);
        }
      } catch {}
      return [];
    }),

  // ── ML engine status ──
  getEngineStatus: protectedProcedure
    .query(async () => {
      try {
        const { mlEngine } = await import("../services/mlEngine");
        const ready = mlEngine.isReady();
        return { ready };
      } catch {
        return { ready: false };
      }
    }),

  // ── Historical lane rates from DB ──
  getLaneHistory: protectedProcedure
    .input(z.object({
      originState: z.string().min(2),
      destState: z.string().min(2),
      limit: z.number().min(1).max(100).optional(),
    }))
    .query(async ({ input }) => {
      try {
        const { getDb } = await import("../db");
        const { sql } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) return [];
        const [rows]: any = await db.execute(sql`
          SELECT id, rate, distance, status, createdAt,
                 originCity, originState, destCity, destState
          FROM loads
          WHERE originState = ${input.originState}
            AND destState = ${input.destState}
            AND rate IS NOT NULL AND rate > 0
          ORDER BY createdAt DESC
          LIMIT ${input.limit || 50}
        `);
        return Array.isArray(rows) ? rows : [];
      } catch {
        return [];
      }
    }),

  // ── Top lanes by volume ──
  getTopLanes: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).optional() }))
    .query(async ({ input }) => {
      try {
        const { getDb } = await import("../db");
        const { sql } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) return [];
        const [rows]: any = await db.execute(sql`
          SELECT originState, destState,
                 COUNT(*) as loadCount,
                 ROUND(AVG(rate), 2) as avgRate,
                 ROUND(AVG(distance), 0) as avgDistance,
                 ROUND(AVG(rate / NULLIF(distance, 0)), 2) as avgRatePerMile
          FROM loads
          WHERE originState IS NOT NULL AND destState IS NOT NULL
            AND rate IS NOT NULL AND rate > 0
          GROUP BY originState, destState
          ORDER BY loadCount DESC
          LIMIT ${input.limit || 20}
        `);
        return Array.isArray(rows) ? rows : [];
      } catch {
        return [];
      }
    }),

  // ── Market snapshot: seasonal factors, equipment multipliers ──
  getMarketSnapshot: protectedProcedure
    .query(async () => {
      const month = new Date().getMonth() + 1;
      const seasonalFactors: Record<number, number> = {
        1: 0.95, 2: 0.97, 3: 1.0, 4: 1.02, 5: 0.98, 6: 1.05,
        7: 1.08, 8: 1.10, 9: 1.15, 10: 1.12, 11: 1.08, 12: 1.03,
      };
      const equipmentMultipliers: Record<string, number> = {
        dry_van: 1.0, reefer: 1.15, flatbed: 1.08, tanker: 1.12,
        step_deck: 1.10, lowboy: 1.20, hopper: 1.05, pneumatic: 1.18,
      };

      let engineReady = false;
      try {
        const { mlEngine } = await import("../services/mlEngine");
        engineReady = mlEngine.isReady();
      } catch {}

      return {
        currentMonth: month,
        seasonalFactor: seasonalFactors[month] || 1.0,
        seasonalFactors,
        equipmentMultipliers,
        engineReady,
      };
    }),
});
