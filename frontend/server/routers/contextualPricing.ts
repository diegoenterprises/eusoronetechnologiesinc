/**
 * CONTEXTUAL INTELLIGENCE LAYER FOR DYNAMIC PRICING ROUTER (Task 13.1)
 * tRPC procedures for contextual pricing signals, lane intelligence, and enriched rates.
 */

import { z } from "zod";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import {
  getContextualPrice,
  getLaneIntelligence,
} from "../services/ContextualPricingIntel";

export const contextualPricingRouter = router({
  /**
   * Get contextually-enriched price for a lane
   */
  getContextualPrice: protectedProcedure
    .input(z.object({
      originState: z.string().min(2).max(2),
      destState: z.string().min(2).max(2),
      distance: z.number().min(1),
      baseRate: z.number().optional(),
      equipmentType: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const baseRate = input.baseRate || Math.round((2.10 + Math.random() * 0.80) * input.distance);
      return getContextualPrice(input.originState, input.destState, baseRate, input.distance);
    }),

  /**
   * Get lane intelligence summary
   */
  getLaneIntelligence: protectedProcedure
    .input(z.object({
      originState: z.string().min(2).max(2),
      destState: z.string().min(2).max(2),
      distance: z.number().min(1),
    }))
    .query(async ({ input }) => {
      return getLaneIntelligence(input.originState, input.destState, input.distance);
    }),

  /**
   * Get active context signals for a region
   */
  getActiveSignals: protectedProcedure
    .input(z.object({ state: z.string().min(2).max(2) }))
    .query(async ({ input }) => {
      // Aggregate signals for common lanes from/to this state
      const partners = ["TX", "CA", "FL", "OH", "IL", "PA", "NJ", "GA", "LA", "OK"];
      const allSignals: any[] = [];
      for (const dest of partners) {
        if (dest === input.state) continue;
        const result = getContextualPrice(input.state, dest, 3000, 800);
        for (const s of result.signals) {
          if (!allSignals.find(a => a.id === s.id)) allSignals.push(s);
        }
      }
      return allSignals;
    }),

  /**
   * Get top lanes with highest contextual adjustments
   */
  getHotLanes: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const states = ["TX", "CA", "FL", "OH", "IL", "PA", "NJ", "GA", "LA", "OK", "NY", "MI", "NC", "AZ", "WA"];
      const lanes: { lane: string; adjustment: number; signals: number; marketPhase: string; spotRate: number }[] = [];
      for (let i = 0; i < states.length; i++) {
        for (let j = i + 1; j < states.length; j++) {
          const dist = 500 + Math.random() * 1500;
          const base = Math.round(2.20 * dist);
          const result = getContextualPrice(states[i], states[j], base, dist);
          if (result.signals.length > 0) {
            lanes.push({
              lane: `${states[i]}→${states[j]}`,
              adjustment: result.adjustmentPct,
              signals: result.signals.length,
              marketPhase: result.marketPhase,
              spotRate: result.contextualRate,
            });
          }
        }
      }
      return lanes.sort((a, b) => Math.abs(b.adjustment) - Math.abs(a.adjustment)).slice(0, input.limit);
    }),
});
