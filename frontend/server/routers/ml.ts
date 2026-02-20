/**
 * ML ENGINE ROUTER
 * Exposes all 10 ML models via tRPC procedures.
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { mlEngine } from "../services/mlEngine";

export const mlRouter = router({
  // ── Model Status ─────────────────────────────────────────
  getModelStatus: protectedProcedure.query(() => {
    return mlEngine.getModelStatus();
  }),

  // ── 1. Rate Prediction ──────────────────────────────────
  predictRate: protectedProcedure
    .input(z.object({
      originState: z.string(),
      destState: z.string(),
      distance: z.number(),
      weight: z.number().optional(),
      equipmentType: z.string().optional(),
      cargoType: z.string().optional(),
      urgency: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]).optional(),
    }))
    .query(({ input }) => mlEngine.predictRate(input)),

  // ── 2. Carrier Matching ─────────────────────────────────
  matchCarriers: protectedProcedure
    .input(z.object({
      originState: z.string(),
      destState: z.string(),
      distance: z.number(),
      weight: z.number().optional(),
      cargoType: z.string().optional(),
      equipmentType: z.string().optional(),
      maxResults: z.number().optional(),
    }))
    .query(({ input }) => mlEngine.matchCarriers(input)),

  // ── 3. ETA Prediction ───────────────────────────────────
  predictETA: protectedProcedure
    .input(z.object({
      originState: z.string(),
      destState: z.string(),
      distance: z.number(),
      equipmentType: z.string().optional(),
      cargoType: z.string().optional(),
      pickupDate: z.string().optional(),
    }))
    .query(({ input }) => mlEngine.predictETA(input)),

  // ── 4. Demand Forecasting ───────────────────────────────
  forecastDemand: protectedProcedure
    .input(z.object({
      originState: z.string().optional(),
      destState: z.string().optional(),
    }))
    .query(({ input }) => mlEngine.forecastDemand(input)),

  // ── 5. Anomaly Detection ────────────────────────────────
  detectAnomalies: protectedProcedure
    .input(z.object({
      rate: z.number().optional(),
      distance: z.number().optional(),
      originState: z.string().optional(),
      destState: z.string().optional(),
      carrierId: z.number().optional(),
      weight: z.number().optional(),
    }))
    .query(({ input }) => mlEngine.detectAnomalies(input)),

  // ── 6. Dynamic Pricing ──────────────────────────────────
  getDynamicPrice: protectedProcedure
    .input(z.object({
      originState: z.string(),
      destState: z.string(),
      distance: z.number(),
      weight: z.number().optional(),
      equipmentType: z.string().optional(),
      cargoType: z.string().optional(),
      pickupDate: z.string().optional(),
      urgency: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]).optional(),
    }))
    .query(({ input }) => mlEngine.getDynamicPrice(input)),

  // ── 7. Carrier Reliability ──────────────────────────────
  getCarrierReliability: protectedProcedure
    .input(z.object({ carrierId: z.number() }))
    .query(({ input }) => mlEngine.getCarrierReliability(input.carrierId)),

  // ── 8. Churn Prediction ─────────────────────────────────
  predictChurn: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => mlEngine.predictChurn(input.userId)),

  // ── 9. Load Bundling ────────────────────────────────────
  suggestBundles: protectedProcedure
    .input(z.object({
      originState: z.string(),
      destState: z.string(),
      maxResults: z.number().optional(),
    }))
    .query(({ input }) => mlEngine.suggestBundles(input)),

  // ── 10. Bid Optimizer ───────────────────────────────────
  optimizeBid: protectedProcedure
    .input(z.object({
      loadId: z.number().optional(),
      originState: z.string(),
      destState: z.string(),
      distance: z.number(),
      postedRate: z.number().optional(),
      cargoType: z.string().optional(),
      equipmentType: z.string().optional(),
      strategy: z.enum(["AGGRESSIVE", "COMPETITIVE", "PREMIUM"]).optional(),
    }))
    .query(({ input }) => mlEngine.optimizeBid(input)),
});
