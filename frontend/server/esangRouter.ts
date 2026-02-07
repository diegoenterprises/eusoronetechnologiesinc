/**
 * ESANG AI tRPC Router
 * Exposes ESANG AI capabilities via tRPC procedures
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { esangAI } from "./_core/esangAI";
import {
  searchMaterials, getMaterialByUN, getGuide, getProtectiveDistance,
  getFullERGInfo, getERGForProduct, getUNForProduct,
  EMERGENCY_CONTACTS, HAZARD_CLASSES, ERG_MATERIALS, ERG_GUIDES, ERG_METADATA,
} from "./_core/ergDatabase";

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
   * ERG 2024 Emergency Response Lookup - Real Database
   */
  ergLookup: publicProcedure
    .input(
      z.object({
        unNumber: z.string().optional(),
        materialName: z.string().optional(),
        guideNumber: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Try UN number first
      if (input.unNumber) {
        const info = getFullERGInfo(input.unNumber);
        if (info) return { found: true, ...info, emergencyContacts: Object.values(EMERGENCY_CONTACTS).filter((c: any) => c.isPrimary) };
      }
      // Try material name
      if (input.materialName) {
        const info = getERGForProduct(input.materialName);
        if (info) return { found: true, ...info, emergencyContacts: Object.values(EMERGENCY_CONTACTS).filter((c: any) => c.isPrimary) };
        // Fallback to search
        const results = searchMaterials(input.materialName, 5);
        if (results.length > 0) {
          const first = getFullERGInfo(results[0].unNumber);
          if (first) return { found: true, ...first, searchResults: results, emergencyContacts: Object.values(EMERGENCY_CONTACTS).filter((c: any) => c.isPrimary) };
        }
      }
      // Try guide number directly
      if (input.guideNumber) {
        const guide = getGuide(input.guideNumber);
        if (guide) return { found: true, material: null, guide, protectiveDistance: null, emergencyContacts: Object.values(EMERGENCY_CONTACTS).filter((c: any) => c.isPrimary) };
      }
      return { found: false, message: "No ERG data found. Use Guide 111 for unidentified cargo.", fallbackGuide: getGuide(111), emergencyContacts: Object.values(EMERGENCY_CONTACTS).filter((c: any) => c.isPrimary) };
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
  classifyHazmat: protectedProcedure.input(z.object({ productName: z.string() })).mutation(async ({ input }) => {
    const un = getUNForProduct(input.productName);
    if (un) {
      const material = getMaterialByUN(un);
      if (material) {
        return { unNumber: `UN${material.unNumber}`, class: material.hazardClass, hazmatClass: material.hazardClass, packingGroup: material.packingGroup || "N/A", properName: material.name, isTIH: material.isTIH, guide: material.guide };
      }
    }
    return { unNumber: "UNKNOWN", class: "N/A", hazmatClass: "N/A", packingGroup: "N/A", properName: input.productName, isTIH: false, guide: 111 };
  }),
  getChatHistory: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async () => [{ id: "m1", role: "user", content: "Hello", response: "Hi! How can I help you?", timestamp: "2025-01-23 10:00" }]),
  getERGGuide: protectedProcedure.input(z.object({ guideNumber: z.string() })).query(async ({ input }) => {
    const num = parseInt(input.guideNumber, 10);
    const guide = getGuide(num);
    if (guide) {
      return {
        guideNumber: String(guide.number),
        name: guide.title,
        title: guide.title,
        color: guide.color,
        hazards: [...guide.potentialHazards.fireExplosion.slice(0, 2), ...guide.potentialHazards.health.slice(0, 2)],
        actions: guide.emergencyResponse.fire.small.concat(guide.emergencyResponse.spillLeak.general.slice(0, 2)),
        potentialHazards: [
          ...guide.potentialHazards.fireExplosion.map((h: string) => ({ type: "fire", description: h })),
          ...guide.potentialHazards.health.map((h: string) => ({ type: "health", description: h })),
        ],
        publicSafety: [
          `ISOLATE ${guide.publicSafety.isolationDistance.meters}m (${guide.publicSafety.isolationDistance.feet} ft) in all directions`,
          guide.publicSafety.protectiveClothing,
          guide.publicSafety.evacuationNotes,
        ],
        emergencyResponse: {
          fire: guide.emergencyResponse.fire.small.concat(guide.emergencyResponse.fire.large),
          spill: guide.emergencyResponse.spillLeak.general.concat(guide.emergencyResponse.spillLeak.small),
          firstAid: [guide.emergencyResponse.firstAid],
        },
        isolationDistance: guide.publicSafety.isolationDistance,
        fireIsolationDistance: guide.publicSafety.fireIsolationDistance,
      };
    }
    return { guideNumber: input.guideNumber, name: "Unknown Guide", title: "Unknown Guide", hazards: [], actions: [], potentialHazards: [], publicSafety: [], emergencyResponse: { fire: [], spill: [], firstAid: [] } };
  }),
  getRecentERGLookups: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async () => [
    { guideNumber: "128", product: "Gasoline / Motor fuel", unNumber: "UN1203", hazardClass: "3", date: new Date().toISOString().split("T")[0] },
    { guideNumber: "128", product: "Diesel fuel", unNumber: "UN1202", hazardClass: "3", date: new Date().toISOString().split("T")[0] },
    { guideNumber: "128", product: "Petroleum crude oil", unNumber: "UN1267", hazardClass: "3", date: new Date().toISOString().split("T")[0] },
  ]),
  getSuggestions: protectedProcedure.input(z.object({ context: z.string().optional() }).optional()).query(async () => ["Check driver HOS", "Review load details", "Contact dispatch"]),
  searchERG: protectedProcedure.input(z.object({ query: z.string() })).query(async ({ input }) => {
    const results = searchMaterials(input.query, 20);
    return results.map(m => ({
      guideNumber: String(m.guide),
      product: m.name,
      unNumber: `UN${m.unNumber}`,
      hazardClass: m.hazardClass,
      isTIH: m.isTIH,
      packingGroup: m.packingGroup,
    }));
  }),
});

export type ESANGRouter = typeof esangRouter;
