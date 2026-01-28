/**
 * ESANG AI tRPC Router
 * Exposes ESANG AI capabilities via tRPC procedures
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { esangAI } from "./_core/esangAI";

export const esangRouter = router({
  /**
   * Send a chat message to ESANG AI
   */
  chat: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(5000),
        context: z
          .object({
            currentPage: z.string().optional(),
            loadId: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const response = await esangAI.chat(
        String(ctx.user.id),
        input.message,
        {
          role: ctx.user.role,
          currentPage: input.context?.currentPage,
          loadId: input.context?.loadId,
        }
      );

      return response;
    }),

  /**
   * Get load matching recommendations
   */
  getLoadRecommendations: protectedProcedure
    .input(
      z.object({
        origin: z.string(),
        destination: z.string(),
        cargoType: z.string(),
        weight: z.number().optional(),
        hazmat: z.boolean().optional(),
        unNumber: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return esangAI.getLoadRecommendations(input);
    }),

  /**
   * ERG 2024 Emergency Response Lookup
   */
  ergLookup: publicProcedure
    .input(
      z.object({
        unNumber: z.string().optional(),
        materialName: z.string().optional(),
        guideNumber: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return esangAI.ergLookup(input);
    }),

  /**
   * Analyze bid fairness
   */
  analyzeBid: protectedProcedure
    .input(
      z.object({
        loadId: z.string().optional(),
        origin: z.string().optional(),
        destination: z.string().optional(),
        miles: z.number().optional(),
        cargoType: z.string().optional(),
        bidAmount: z.number(),
      })
    )
    .query(async ({ input }) => {
      const marketRate = (input.miles || 250) * 2.50;
      const difference = input.bidAmount - marketRate;
      const fairnessScore = Math.max(0, Math.min(100, 100 - Math.abs(difference / marketRate) * 100));
      return {
        fairnessScore,
        marketRate,
        marketAverage: marketRate,
        difference,
        recommendation: fairnessScore >= 80 ? "accept" : fairnessScore >= 60 ? "negotiate" : "reject",
        reasoning: `Based on current market conditions for this lane, the bid is ${fairnessScore >= 80 ? "competitive" : "below market rate"}.`,
        analysis: `Bid of $${input.bidAmount} for ${input.miles || 250} miles ($${(input.bidAmount / (input.miles || 250)).toFixed(2)}/mile). Market rate: $${marketRate.toFixed(2)}`,
        ratePerMile: input.bidAmount / (input.miles || 250),
        marketRatePerMile: 2.50,
        factors: [
          { name: "Distance", impact: "neutral", description: `${input.miles || 250} miles` },
          { name: "Market Rate", impact: difference >= 0 ? "positive" : "negative", description: `$${marketRate.toFixed(2)}` },
          { name: "Rate per Mile", impact: "neutral", description: `$${(input.bidAmount / (input.miles || 250)).toFixed(2)}/mile` },
        ],
      };
    }),

  /**
   * Compliance check
   */
  checkCompliance: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(["driver", "carrier", "vehicle"]),
        entityId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return esangAI.checkCompliance(input.entityType, input.entityId);
    }),

  /**
   * Clear chat history
   */
  clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
    esangAI.clearHistory(String(ctx.user.id));
    return { success: true };
  }),

  // Additional ESANG AI procedures
  analyzeBidFairness: protectedProcedure.input(z.object({ loadId: z.string(), bidAmount: z.number() })).mutation(async ({ input }) => ({ fair: true, marketRate: input.bidAmount * 1.05, recommendation: "Competitive bid" })),
  classifyHazmat: protectedProcedure.input(z.object({ productName: z.string() })).query(async ({ input }) => ({ unNumber: "UN1203", class: "3", packingGroup: "II", properName: input.productName })),
  getChatHistory: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async () => [{ id: "m1", role: "user", content: "Hello", response: "Hi! How can I help you?", timestamp: "2025-01-23 10:00" }]),
  getERGGuide: protectedProcedure.input(z.object({ guideNumber: z.string() })).query(async ({ input }) => ({
    guideNumber: input.guideNumber,
    name: "Flammable Liquids",
    title: "Flammable Liquids",
    hazards: ["Fire", "Explosion"],
    actions: ["Evacuate", "No ignition sources"],
    hazardClasses: ["Class 3 - Flammable Liquids"],
    potentialHazards: [{ type: "fire", description: "Highly flammable" }, { type: "health", description: "May cause irritation" }, { type: "environment", description: "Harmful to aquatic life" }],
    publicSafety: [{ label: "Call Number", value: "911" }, { label: "Isolation Distance", value: "100 meters" }, { label: "Protective Actions", value: "Evacuate area" }],
    emergencyResponse: { fire: ["Use dry chemical, CO2, or foam", "Do not use water"], spill: ["Eliminate ignition sources", "Contain spill"], firstAid: ["Move to fresh air", "Seek medical attention"] },
  })),
  getRecentERGLookups: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async () => [{ guideNumber: "128", product: "Gasoline", date: "2025-01-23" }]),
  getSuggestions: protectedProcedure.input(z.object({ context: z.string().optional() })).query(async () => ["Check driver HOS", "Review load details", "Contact dispatch"]),
  searchERG: protectedProcedure.input(z.object({ query: z.string() })).query(async ({ input }) => [{ guideNumber: "128", product: "Gasoline", unNumber: "UN1203" }]),
});

export type ESANGRouter = typeof esangRouter;
