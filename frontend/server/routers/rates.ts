/**
 * RATES ROUTER
 * tRPC procedures for rate calculation and market data
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const equipmentTypeSchema = z.enum(["tanker", "flatbed", "reefer", "van", "specialized"]);
const hazmatClassSchema = z.enum(["1", "2", "3", "4", "5", "6", "7", "8", "9", "none"]);

export const ratesRouter = router({
  /**
   * Get lane analysis for LaneAnalysis page
   */
  getLaneAnalysis: protectedProcedure
    .input(z.object({ origin: z.string().optional(), destination: z.string().optional() }))
    .query(async ({ input }) => {
      return [
        { id: "l1", origin: "Houston, TX", destination: "Dallas, TX", avgRate: 2.85, volume: 120, trend: "up" },
        { id: "l2", origin: "Austin, TX", destination: "San Antonio, TX", avgRate: 2.65, volume: 85, trend: "stable" },
        { id: "l3", origin: "Houston, TX", destination: "Austin, TX", avgRate: 2.95, volume: 95, trend: "down" },
      ];
    }),

  /**
   * Get lane stats for LaneAnalysis page
   */
  getLaneStats: protectedProcedure
    .query(async () => {
      return { totalLanes: 45, avgRate: 2.78, hotLanes: 8, coldLanes: 5, loadsThisMonth: 125, topLaneVolume: 45, trending: "up", rateChange: 5.2, avgMiles: 425 };
    }),

  /**
   * Calculate rate for RateCalculator page (simple input)
   */
  calculate: protectedProcedure
    .input(z.object({
      origin: z.string(),
      destination: z.string(),
      equipmentType: z.string(),
      weight: z.number(),
    }))
    .query(async ({ input }) => {
      const distance = 350;
      const baseRate = 3.25;
      const estimatedRate = Math.round(distance * baseRate);
      return {
        distance,
        estimatedRate,
        recommendedRate: estimatedRate,
        ratePerMile: baseRate,
        fuelSurcharge: Math.round(distance * 0.20),
        total: Math.round(distance * baseRate + distance * 0.20),
        driveTime: "5h 30m",
        fuelCost: 245,
        estimatedProfit: 580,
        lowRate: Math.round(estimatedRate * 0.85),
        highRate: Math.round(estimatedRate * 1.15),
      };
    }),

  /**
   * Calculate estimated rate (detailed version)
   */
  calculateDetailed: protectedProcedure
    .input(z.object({
      origin: z.object({
        city: z.string(),
        state: z.string(),
        zip: z.string().optional(),
      }),
      destination: z.object({
        city: z.string(),
        state: z.string(),
        zip: z.string().optional(),
      }),
      equipment: equipmentTypeSchema,
      weight: z.number(),
      hazmatClass: hazmatClassSchema.default("none"),
      urgency: z.enum(["standard", "expedited", "hot"]).default("standard"),
      pickupDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const baseRate = 3.25;
      const distance = 350;
      
      let ratePerMile = baseRate;
      if (input.equipment === "tanker") ratePerMile += 0.35;
      if (input.equipment === "specialized") ratePerMile += 0.50;
      if (input.hazmatClass !== "none") ratePerMile += 0.45;
      if (input.urgency === "expedited") ratePerMile += 0.25;
      if (input.urgency === "hot") ratePerMile += 0.50;
      
      const fuelSurcharge = distance * 0.20;
      const baseTotal = distance * ratePerMile;
      
      return {
        estimatedRate: {
          low: Math.round(baseTotal * 0.9),
          mid: Math.round(baseTotal),
          high: Math.round(baseTotal * 1.15),
        },
        breakdown: {
          linehaul: Math.round(distance * baseRate),
          fuelSurcharge: Math.round(fuelSurcharge),
          hazmatPremium: input.hazmatClass !== "none" ? Math.round(distance * 0.45) : 0,
          urgencyPremium: input.urgency === "hot" ? Math.round(distance * 0.50) : input.urgency === "expedited" ? Math.round(distance * 0.25) : 0,
          equipmentPremium: input.equipment === "tanker" ? Math.round(distance * 0.35) : input.equipment === "specialized" ? Math.round(distance * 0.50) : 0,
        },
        perMile: ratePerMile.toFixed(2),
        distance,
        marketData: {
          avgRate: 3.45,
          lowRate: 2.95,
          highRate: 4.10,
          loadCount: 45,
          capacityTight: true,
        },
      };
    }),

  /**
   * Get market rates for a lane
   */
  getMarketRates: protectedProcedure
    .input(z.object({
      originState: z.string(),
      destState: z.string(),
      equipment: equipmentTypeSchema.optional(),
      period: z.enum(["week", "month", "quarter"]).default("month"),
    }))
    .query(async ({ input }) => {
      return {
        lane: `${input.originState} → ${input.destState}`,
        period: input.period,
        avgRate: 3.45,
        trend: "up" as const,
        trendPercent: 5.2,
        loadToTruckRatio: 3.2,
        volumeIndex: 85,
        history: [
          { date: "2025-01-01", rate: 3.25 },
          { date: "2025-01-08", rate: 3.32 },
          { date: "2025-01-15", rate: 3.40 },
          { date: "2025-01-22", rate: 3.45 },
        ],
        comparison: {
          nationalAvg: 3.28,
          regionalAvg: 3.35,
          laneRank: 12,
          totalLanes: 150,
        },
      };
    }),

  /**
   * Get fuel surcharge rates
   */
  getFuelSurcharge: protectedProcedure
    .query(async () => {
      return {
        currentRate: 0.52,
        basePrice: 3.50,
        effectiveDate: "2025-01-20",
        nextUpdate: "2025-01-27",
        schedule: [
          { priceRange: "3.00-3.24", surcharge: 0.45 },
          { priceRange: "3.25-3.49", surcharge: 0.48 },
          { priceRange: "3.50-3.74", surcharge: 0.52 },
          { priceRange: "3.75-3.99", surcharge: 0.55 },
          { priceRange: "4.00+", surcharge: 0.58 },
        ],
        source: "DOE Weekly Retail Price",
      };
    }),

  /**
   * Get accessorial charges
   */
  getAccessorials: protectedProcedure
    .query(async () => {
      return [
        { code: "DET", name: "Detention", rate: 75, unit: "per hour", freeTime: "2 hours" },
        { code: "LAY", name: "Layover", rate: 350, unit: "per day", notes: "After 24 hours" },
        { code: "TARP", name: "Tarping", rate: 75, unit: "flat", notes: "Per tarp" },
        { code: "STOP", name: "Extra Stop", rate: 150, unit: "per stop", notes: "Beyond origin/dest" },
        { code: "LUMPER", name: "Lumper Fee", rate: 0, unit: "actual", notes: "Receipt required" },
        { code: "HAZMAT", name: "Hazmat Premium", rate: 0.45, unit: "per mile", notes: "Classes 1-9" },
        { code: "TEAM", name: "Team Driver", rate: 0.35, unit: "per mile", notes: "Expedited" },
        { code: "TWIC", name: "TWIC Required", rate: 50, unit: "flat", notes: "Port/refinery access" },
      ];
    }),

  /**
   * Save rate quote
   */
  saveQuote: protectedProcedure
    .input(z.object({
      origin: z.string(),
      destination: z.string(),
      equipment: equipmentTypeSchema,
      rate: z.number(),
      validUntil: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `quote_${Date.now()}`,
        ...input,
        createdBy: ctx.user?.id,
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Get saved quotes
   */
  getSavedQuotes: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx }) => {
      return [
        {
          id: "quote_001",
          origin: "Houston, TX",
          destination: "Dallas, TX",
          equipment: "tanker",
          rate: 1250,
          validUntil: "2025-02-01",
          createdAt: "2025-01-20",
        },
        {
          id: "quote_002",
          origin: "Beaumont, TX",
          destination: "San Antonio, TX",
          equipment: "tanker",
          rate: 1450,
          validUntil: "2025-02-05",
          createdAt: "2025-01-22",
        },
      ];
    }),

  /**
   * Get rate trends
   */
  getTrends: protectedProcedure
    .input(z.object({
      equipment: equipmentTypeSchema.optional(),
      region: z.string().optional(),
      period: z.enum(["week", "month", "quarter", "year"]).default("month"),
    }))
    .query(async ({ input }) => {
      return {
        period: input.period,
        currentAvg: 3.45,
        previousAvg: 3.28,
        changePercent: 5.2,
        trend: "up" as const,
        forecast: {
          nextWeek: 3.48,
          nextMonth: 3.52,
          confidence: 0.75,
        },
        factors: [
          { name: "Fuel prices", impact: "positive", weight: 0.3 },
          { name: "Capacity", impact: "positive", weight: 0.25 },
          { name: "Demand", impact: "positive", weight: 0.25 },
          { name: "Seasonality", impact: "neutral", weight: 0.2 },
        ],
      };
    }),

  // Additional rate procedures
  getAll: protectedProcedure.input(z.object({ search: z.string().optional() })).query(async () => [{ id: "r1", origin: "Houston", destination: "Dallas", rate: 3.25 }]),
  getStats: protectedProcedure.query(async () => ({ avgRate: 3.15, minRate: 2.50, maxRate: 4.25, totalLanes: 150 })),
  getMarketRates: protectedProcedure.input(z.object({ lane: z.string().optional() })).query(async () => [{ lane: "Houston-Dallas", spotRate: 3.25, contractRate: 3.05 }]),
  delete: protectedProcedure.input(z.object({ rateId: z.string() })).mutation(async ({ input }) => ({ success: true, rateId: input.rateId })),
});
