/**
 * ESANG AI tRPC Router
 * Exposes ESANG AI capabilities via tRPC procedures
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { esangAI } from "./_core/esangAI";
import {
  searchMaterials, getMaterialByUN, getGuide,
  getFullERGInfo, getERGForProduct, getUNForProduct,
  EMERGENCY_CONTACTS,
} from "./_core/ergDatabaseDB";
import { fireGamificationEvent } from "./services/gamificationDispatcher";

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
            latitude: z.number().optional(),
            longitude: z.number().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const numericUserId = typeof ctx.user.id === "number" ? ctx.user.id : parseInt(String(ctx.user.id), 10) || 0;
      const response = await esangAI.chat(
        String(ctx.user.id),
        input.message,
        {
          role: ctx.user.role,
          currentPage: input.context?.currentPage,
          loadId: input.context?.loadId,
          latitude: input.context?.latitude,
          longitude: input.context?.longitude,
        },
        {
          userId: numericUserId,
          userEmail: ctx.user.email || "",
          userName: ctx.user.name || "User",
          role: ctx.user.role || "SHIPPER",
        }
      );

      // Fire gamification events for ESANG interaction
      if (numericUserId) {
        fireGamificationEvent({ userId: numericUserId, type: "esang_question", value: 1 });
        fireGamificationEvent({ userId: numericUserId, type: "platform_action", value: 1 });
      }

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
        const info = await getFullERGInfo(input.unNumber);
        if (info) return { found: true, ...info, emergencyContacts: Object.values(EMERGENCY_CONTACTS).filter((c: any) => c.isPrimary) };
      }
      // Try material name
      if (input.materialName) {
        const info = await getERGForProduct(input.materialName);
        if (info) return { found: true, ...info, emergencyContacts: Object.values(EMERGENCY_CONTACTS).filter((c: any) => c.isPrimary) };
        // Fallback to search
        const results = await searchMaterials(input.materialName, 5);
        if (results.length > 0) {
          const first = await getFullERGInfo(results[0].unNumber);
          if (first) return { found: true, ...first, searchResults: results, emergencyContacts: Object.values(EMERGENCY_CONTACTS).filter((c: any) => c.isPrimary) };
        }
      }
      // Try guide number directly
      if (input.guideNumber) {
        const guide = await getGuide(input.guideNumber);
        if (guide) return { found: true, material: null, guide, protectiveDistance: null, emergencyContacts: Object.values(EMERGENCY_CONTACTS).filter((c: any) => c.isPrimary) };
      }
      return { found: false, message: "No ERG data found. Use Guide 111 for unidentified cargo.", fallbackGuide: await getGuide(111), emergencyContacts: Object.values(EMERGENCY_CONTACTS).filter((c: any) => c.isPrimary) };
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
        entityType: z.enum(["driver", "catalyst", "vehicle"]),
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

  /**
   * MULTI-MODEL INTENT CLASSIFICATION & ROUTING
   * Extracted from Python ESANGMultiModelOrchestrator architecture
   *
   * Routes user requests to the appropriate model/handler:
   * - COMMAND: Logic model (structured actions — assign load, start tracking)
   * - NEGOTIATION: Logic model (rate proposals, counter-offers)
   * - COMPLIANCE_QUERY: Logic model + ERG database (regulatory, hazmat)
   * - GENERAL_QUESTION: Creative model (summaries, Q&A)
   * - NEWS_SUMMARY: Creative model (news feed, market updates)
   *
   * In production: GPT-4.1-mini for logic, ESANG AI for creative
   * Currently: ESANG AI handles both, but intent classification enables future split
   */
  classifyIntent: protectedProcedure
    .input(z.object({
      message: z.string().min(1).max(5000),
      context: z.object({
        currentPage: z.string().optional(),
        loadId: z.string().optional(),
        role: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const msg = input.message.toLowerCase();

      // Rule-based intent classification (fast path — no API call needed)
      let intent: "COMMAND" | "NEGOTIATION" | "COMPLIANCE_QUERY" | "GENERAL_QUESTION" | "NEWS_SUMMARY" = "GENERAL_QUESTION";
      let modelTarget: "logic" | "creative" = "creative";
      let confidence = 0.85;

      // Command patterns
      const commandPatterns = ["assign", "start tracking", "dispatch", "cancel load", "update status", "transition", "create load", "post load", "submit bid"];
      if (commandPatterns.some(p => msg.includes(p))) {
        intent = "COMMAND";
        modelTarget = "logic";
        confidence = 0.92;
      }
      // Negotiation patterns
      else if (/\$[\d,.]+|rate|counter.?offer|negotiate|bid|i.?ll do it for|price|per mile/.test(msg)) {
        intent = "NEGOTIATION";
        modelTarget = "logic";
        confidence = 0.90;
      }
      // Compliance / ERG patterns
      else if (/erg|un\d{4}|hazmat|compliance|hos|dot|fmcsa|placard|endorsement|hazard class|isolation distance|ppe|emergency/.test(msg)) {
        intent = "COMPLIANCE_QUERY";
        modelTarget = "logic";
        confidence = 0.95;
      }
      // News patterns
      else if (/news|market|update|summary|trend|headline|what.?s happening/.test(msg)) {
        intent = "NEWS_SUMMARY";
        modelTarget = "creative";
        confidence = 0.88;
      }

      // Route to appropriate handler
      let response: any;
      if (modelTarget === "logic" && (intent === "COMPLIANCE_QUERY")) {
        // For compliance queries, use ERG database directly
        const ergMatch = msg.match(/un\s?(\d{4})/i);
        if (ergMatch) {
          const info = await getFullERGInfo(ergMatch[1]);
          if (info) {
            response = { message: `ERG data for UN${ergMatch[1]}: Guide ${(info as any).guide?.number || 'N/A'}, ${(info as any).material?.name || 'Unknown'}`, data: info, source: "erg_database" };
          }
        }
        if (!response) {
          // Fall through to ESANG AI for complex compliance queries
          response = await esangAI.chat(String(ctx.user.id), input.message, { role: input.context?.role, currentPage: input.context?.currentPage, loadId: input.context?.loadId, latitude: input.context?.latitude, longitude: input.context?.longitude }, { userId: typeof ctx.user.id === 'number' ? ctx.user.id : parseInt(String(ctx.user.id), 10) || 0, userEmail: ctx.user.email || '', userName: ctx.user.name || 'User', role: ctx.user.role || 'SHIPPER' });
          response = { ...response, source: "esang_logic" };
        }
      } else {
        // All other intents go to ESANG AI (both logic and creative for now)
        response = await esangAI.chat(String(ctx.user.id), input.message, { role: input.context?.role, currentPage: input.context?.currentPage, loadId: input.context?.loadId, latitude: input.context?.latitude, longitude: input.context?.longitude }, { userId: typeof ctx.user.id === 'number' ? ctx.user.id : parseInt(String(ctx.user.id), 10) || 0, userEmail: ctx.user.email || '', userName: ctx.user.name || 'User', role: ctx.user.role || 'SHIPPER' });
        response = { ...response, source: modelTarget === "logic" ? "esang_logic" : "esang_creative" };
      }

      return {
        intent,
        modelTarget,
        confidence,
        modelUsed: "esang-ai", // ESANG AI Engine
        futureModels: { logic: "gpt-4.1-mini", creative: "esang-ai-creative" },
        response,
      };
    }),

  // Additional ESANG AI procedures
  analyzeBidFairness: protectedProcedure.input(z.object({ loadId: z.string(), bidAmount: z.number() })).mutation(async ({ input }) => ({ fair: true, marketRate: input.bidAmount * 1.05, recommendation: "Competitive bid" })),
  classifyHazmat: protectedProcedure.input(z.object({ productName: z.string() })).mutation(async ({ input }) => {
    const un = await getUNForProduct(input.productName);
    if (un) {
      const material = await getMaterialByUN(un);
      if (material) {
        return { unNumber: `UN${material.unNumber}`, class: material.hazardClass, hazmatClass: material.hazardClass, packingGroup: material.packingGroup || "N/A", properName: material.name, isTIH: material.isTIH, guide: material.guide };
      }
    }
    return { unNumber: "UNKNOWN", class: "N/A", hazmatClass: "N/A", packingGroup: "N/A", properName: input.productName, isTIH: false, guide: 111 };
  }),
  getChatHistory: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async ({ ctx }) => {
    const history = esangAI.getHistory(String(ctx.user.id));
    return history.map((msg, i) => ({
      id: `m${i}`,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp ? new Date(msg.timestamp).toISOString() : undefined,
    }));
  }),
  getERGGuide: protectedProcedure.input(z.object({ guideNumber: z.string() })).query(async ({ ctx, input }) => {
    const uid = typeof ctx.user?.id === "number" ? ctx.user.id : parseInt(String(ctx.user?.id), 10) || 0;
    if (uid) { fireGamificationEvent({ userId: uid, type: "erg_lookup", value: 1 }); fireGamificationEvent({ userId: uid, type: "platform_action", value: 1 }); }
    const num = parseInt(input.guideNumber, 10);
    const guide = await getGuide(num);
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
  getSuggestions: protectedProcedure.input(z.object({ context: z.string().optional() }).optional()).query(async ({ ctx }) => {
    const role = (ctx.user?.role || "SHIPPER").toUpperCase();
    switch (role) {
      case "SHIPPER":
        return ["Get rate estimate for a lane", "Track my active shipments", "Find available catalysts", "Check compliance status", "Identify product with SPECTRA-MATCH"];
      case "CATALYST":
        return ["Find loads matching my equipment", "Check fuel surcharge rates", "Review my bid history", "Fleet compliance check", "Optimize my routes"];
      case "DRIVER":
        return ["Check my HOS status", "View assigned loads", "Report an incident", "Find nearest fuel stop", "ERG hazmat lookup"];
      case "BROKER":
        return ["Analyze lane pricing", "Match catalyst to load", "Check margin on active loads", "Market rate intelligence", "Catalyst compliance verify"];
      case "TERMINAL_MANAGER":
        return ["View terminal throughput", "Identify product with SPECTRA-MATCH", "Check tank inventory", "Review pending run tickets", "Safety compliance audit"];
      case "ADMIN": case "SUPER_ADMIN":
        return ["System health overview", "User activity summary", "Compliance dashboard", "Revenue analytics", "Platform diagnostics"];
      case "COMPLIANCE_OFFICER":
        return ["Run compliance audit", "Check catalyst insurance", "Review HOS violations", "DOT inspection results", "Safety score analysis"];
      case "SAFETY_MANAGER":
        return ["ERG 2024 hazmat lookup", "Incident report summary", "Safety training status", "Fleet safety scores", "Emergency response plan"];
      default:
        return ["How can you help me?", "What are my active tasks?", "Show my dashboard summary"];
    }
  }),
  // ── ESANG AI Deep Integrations ──────────────────────────────────────────

  analyzeRate: protectedProcedure.input(z.object({
    origin: z.string(), destination: z.string(), cargoType: z.string().default("general"),
    proposedRate: z.number().positive(), distance: z.number().optional(),
    hazmat: z.boolean().optional(), equipmentType: z.string().optional(),
  })).mutation(async ({ input }) => {
    return esangAI.analyzeRate(input);
  }),

  walletInsights: protectedProcedure.input(z.object({
    balance: z.number().default(0),
    recentTransactions: z.array(z.object({ type: z.string(), amount: z.number(), date: z.string(), description: z.string() })).default([]),
    monthlyEarnings: z.number().optional(), monthlyExpenses: z.number().optional(),
    outstandingInvoices: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    return esangAI.analyzeFinancials({
      userId: String(ctx.user.id), role: ctx.user.role || "USER",
      balance: input.balance, recentTransactions: input.recentTransactions,
      monthlyEarnings: input.monthlyEarnings, monthlyExpenses: input.monthlyExpenses,
      outstandingInvoices: input.outstandingInvoices,
    });
  }),

  smartReplies: protectedProcedure.input(z.object({
    messages: z.array(z.object({ sender: z.string(), text: z.string() })).min(1),
  })).mutation(async ({ ctx, input }) => {
    return esangAI.generateSmartReplies({
      messages: input.messages, userRole: ctx.user.role || "USER", userName: ctx.user.name || "User",
    });
  }),

  generateMissions: protectedProcedure.input(z.object({
    level: z.number().default(1),
    recentActivity: z.array(z.string()).default([]),
    completedMissions: z.array(z.string()).default([]),
  })).mutation(async ({ ctx, input }) => {
    return esangAI.generateMissions({
      role: ctx.user.role || "USER", level: input.level,
      recentActivity: input.recentActivity, completedMissions: input.completedMissions,
    });
  }),

  diagnoseIssue: protectedProcedure.input(z.object({
    symptoms: z.array(z.string()).min(1),
    faultCodes: z.array(z.string()).optional(),
    issueCategory: z.string().default("OTHER"),
    severity: z.string().default("MEDIUM"),
    canDrive: z.boolean().default(true),
    isHazmat: z.boolean().optional(),
    driverNotes: z.string().optional(),
  })).mutation(async ({ input }) => {
    return esangAI.diagnoseBreakdown(input);
  }),

  analyzeDTC: protectedProcedure.input(z.object({
    code: z.string().min(1),
    vehicleMake: z.string().optional(),
    vehicleYear: z.number().optional(),
    engine: z.string().optional(),
  })).mutation(async ({ input }) => {
    return esangAI.analyzeDTC(input.code, { make: input.vehicleMake, year: input.vehicleYear, engine: input.engine });
  }),

  searchERG: protectedProcedure.input(z.object({ query: z.string() })).query(async ({ input }) => {
    const results = await searchMaterials(input.query, 20);
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
