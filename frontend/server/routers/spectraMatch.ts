/**
 * SPECTRA-MATCH™ tRPC Router
 * Multi-Modal Adaptive Crude Oil Identification System
 * 
 * Phone-based oil origin identification using:
 * - API Gravity (°API)
 * - BS&W (Basic Sediment & Water %)
 * - Boiling Point Range
 * - Sulfur Content
 * 
 * NO physical testing - only parameter-based matching
 */

import { z } from "zod";
import { sql, desc, eq } from "drizzle-orm";
import { router, auditedProtectedProcedure as protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { loads } from "../../drizzle/schema";
import { esangAI, type SpectraMatchAIRequest } from "../_core/esangAI";
import { getERGForProduct, getFullERGInfo, EMERGENCY_CONTACTS } from "../_core/ergDatabaseDB";
import { ASTM_METHODS, CRUDE_OIL_DB_METADATA } from "../_core/crudeOilSpecs";
import {
  SPEC_TOLERANCES,
  matchCrudeOil, getCrudeById, getCrudesByCountry, searchCrudes,
  classifyAPI, classifySulfur, getCountryName, getMetadata as getCrudeMetadata,
  type CrudeOilSpec, type MatchResult, type MatchInput,
} from "../_core/crudeOilSpecsDB";

export const spectraMatchRouter = router({
  // Identify crude oil origin based on parameters — HYBRID: Static + ESANG AI
  // Enhanced with 12-parameter matching across 90+ global crude grades
  identify: protectedProcedure
    .input(
      z.object({
        apiGravity: z.number().min(5).max(75).describe("API Gravity in degrees"),
        bsw: z.number().min(0).max(5).describe("Basic Sediment & Water percentage"),
        sulfur: z.number().min(0).max(6).optional().describe("Sulfur content percentage"),
        salt: z.number().min(0).max(100).optional().describe("Salt content in PTB"),
        rvp: z.number().min(0).max(20).optional().describe("Reid Vapor Pressure in psi"),
        pourPoint: z.number().min(-80).max(200).optional().describe("Pour point in °F"),
        flashPoint: z.number().min(-60).max(700).optional().describe("Flash point in °F"),
        viscosity: z.number().min(0).max(5000).optional().describe("Viscosity in cSt at 40C"),
        tan: z.number().min(0).max(5).optional().describe("Total Acid Number mg KOH/g"),
        temperature: z.number().optional().describe("Sample temperature for VCF"),
        category: z.string().optional(),
        sulfurType: z.string().optional(),
        sourceBasin: z.string().optional(),
        country: z.string().optional(),
        fuelGrade: z.string().optional(),
        vaporPressure: z.number().optional(),
        concentration: z.number().optional(),
        productName: z.string().optional(),
        location: z.object({
          lat: z.number().optional(),
          lng: z.number().optional(),
          terminalId: z.string().optional(),
        }).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Build match input from all available parameters
      const matchInput: MatchInput = {
        apiGravity: input.apiGravity,
        bsw: input.bsw,
        sulfur: input.sulfur,
        salt: input.salt,
        rvp: input.rvp ?? input.vaporPressure,
        pourPoint: input.pourPoint,
        flashPoint: input.flashPoint,
        viscosity: input.viscosity,
        tan: input.tan,
        temperature: input.temperature,
        sourceBasin: input.sourceBasin,
        country: input.country,
      };

      // Run DB-backed matching against 130+ global crude grades
      const matches = await matchCrudeOil(matchInput, 10);
      const topMatch = matches[0];
      const alternativeMatches = matches.slice(1, 5);

      // Run ESANG AI analysis in parallel (non-blocking)
      const aiRequest: SpectraMatchAIRequest = {
        apiGravity: input.apiGravity,
        bsw: input.bsw,
        category: input.category,
        sulfurType: input.sulfurType,
        sourceBasin: input.sourceBasin,
        fuelGrade: input.fuelGrade,
        flashPoint: input.flashPoint,
        vaporPressure: input.vaporPressure,
        concentration: input.concentration,
        productName: input.productName,
        terminalId: input.location?.terminalId,
        userId: String(ctx.user?.id || "anonymous"),
      };

      let aiAnalysis = null;
      try {
        aiAnalysis = await esangAI.spectraMatchIdentify(aiRequest);
      } catch (err) {
        console.warn("[SPECTRA-MATCH] ESANG AI analysis failed, using static only", err);
      }

      // Merge: if AI gives higher confidence, prefer AI product name but keep static data structure
      const useAI = aiAnalysis && aiAnalysis.confidence > topMatch.confidence;
      
      return {
        primaryMatch: {
          id: useAI ? aiAnalysis!.suggestedProduct.toLowerCase().replace(/\s+/g, "_") : topMatch.crude.id,
          name: useAI ? aiAnalysis!.suggestedProduct : topMatch.crude.name,
          type: topMatch.crude.type,
          region: topMatch.crude.region,
          confidence: useAI ? aiAnalysis!.confidence : topMatch.confidence,
          characteristics: useAI ? aiAnalysis!.characteristics : topMatch.crude.characteristics,
        },
        parameterAnalysis: Object.fromEntries(
          Object.entries(topMatch.parameterScores).map(([key, ps]) => [key, {
            value: ps.value,
            unit: ps.unit,
            score: Math.round(ps.score * 10) / 10,
            accuracy: ps.accuracy,
            weight: `${ps.weight}%`,
            typical: ps.typical,
            withinTolerance: ps.withinTolerance,
          }])
        ),
        classification: {
          apiClass: classifyAPI(input.apiGravity),
          sulfurClass: input.sulfur !== undefined ? classifySulfur(input.sulfur) : null,
        },
        matchedParameters: topMatch.matchedParameters,
        totalParameters: topMatch.totalParameters,
        alternativeMatches: alternativeMatches.map((m) => ({
          id: m.crude.id,
          name: m.crude.name,
          type: m.crude.type,
          country: getCountryName(m.crude.country),
          region: m.crude.region,
          confidence: m.confidence,
          matchedParameters: m.matchedParameters,
        })),
        // ESANG AI Intelligence Layer
        esangAI: aiAnalysis ? {
          analysis: aiAnalysis.analysis,
          reasoning: aiAnalysis.reasoning,
          safetyNotes: aiAnalysis.safetyNotes,
          marketContext: aiAnalysis.marketContext,
          learningInsight: aiAnalysis.learningInsight,
          poweredBy: "ESANG AI™",
        } : null,
        // ERG 2024 Emergency Response Integration
        ergInfo: await (async () => {
          const productName = useAI ? aiAnalysis!.suggestedProduct : topMatch.crude.name;
          const ergData = await getERGForProduct(productName);
          if (ergData) {
            return {
              unNumber: `UN${ergData.material?.unNumber}`,
              materialName: ergData.material?.name,
              guideNumber: ergData.guide?.number,
              guideTitle: ergData.guide?.title,
              hazardClass: ergData.material?.hazardClass,
              isTIH: ergData.material?.isTIH,
              isolationDistance: ergData.guide?.publicSafety.isolationDistance,
              fireIsolationDistance: ergData.guide?.publicSafety.fireIsolationDistance,
              protectiveClothing: ergData.guide?.publicSafety.protectiveClothing,
              emergencyContacts: Object.values(EMERGENCY_CONTACTS).slice(0, 3).map(c => ({ name: c.name, phone: c.phone })),
            };
          }
          return null;
        })(),
        timestamp: new Date().toISOString(),
        esangVerified: !!aiAnalysis,
      };
    }),

  // ESANG AI-only identification (full AI mode)
  identifyWithAI: protectedProcedure
    .input(
      z.object({
        apiGravity: z.number().min(10).max(70),
        bsw: z.number().min(0).max(5),
        category: z.string().optional(),
        sulfurType: z.string().optional(),
        sourceBasin: z.string().optional(),
        fuelGrade: z.string().optional(),
        flashPoint: z.number().optional(),
        vaporPressure: z.number().optional(),
        concentration: z.number().optional(),
        productName: z.string().optional(),
        terminalId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await esangAI.spectraMatchIdentify({
        ...input,
        userId: String(ctx.user?.id || "anonymous"),
      });
      return {
        ...result,
        poweredBy: "ESANG AI™",
        timestamp: new Date().toISOString(),
      };
    }),

  // Get SPECTRA-MATCH learning stats for the current user
  getLearningStats: protectedProcedure
    .query(async ({ ctx }) => {
      const stats = esangAI.getSpectraMatchStats(String(ctx.user?.id || "anonymous"));
      return {
        ...stats,
        poweredBy: "ESANG AI™",
      };
    }),

  // Ask ESANG AI about a product (knowledge query)
  askAboutProduct: protectedProcedure
    .input(
      z.object({
        question: z.string().min(1).max(2000),
        productName: z.string().optional(),
        loadId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return esangAI.queryProductKnowledge(
        String(ctx.user?.id || "anonymous"),
        input.question,
        { role: ctx.user?.role, productName: input.productName, loadId: input.loadId }
      );
    }),

  // Get all known crude oil types in database (90+ global grades)
  getCrudeTypes: protectedProcedure.query(async () => {
    const { searchCrudes } = await import("../_core/crudeOilSpecsDB");
    const allCrudes = await searchCrudes("", 200);
    return allCrudes.map((crude) => ({
      id: crude.id,
      name: crude.name,
      type: crude.type,
      country: getCountryName(crude.country),
      countryCode: crude.country,
      region: crude.region,
      apiGravityRange: `${crude.apiGravity.min}-${crude.apiGravity.max} °API`,
      sulfurRange: `${crude.sulfur.min}-${crude.sulfur.max}%`,
      characteristics: crude.characteristics,
    }));
  }),

  // Search crude oil grades by name, region, type, or country
  searchCrudes: protectedProcedure
    .input(z.object({ query: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      const results = await searchCrudes(input.query, input.limit || 20);
      return results.map(c => ({
        id: c.id, name: c.name, type: c.type,
        country: getCountryName(c.country), region: c.region,
        apiGravity: c.apiGravity.typical, sulfur: c.sulfur.typical,
        characteristics: c.characteristics,
      }));
    }),

  // Get crude grades filtered by country
  getCrudesByCountry: protectedProcedure
    .input(z.object({ country: z.string() }))
    .query(async ({ input }) => {
      const crudes = await getCrudesByCountry(input.country);
      return crudes.map(c => ({
        id: c.id, name: c.name, type: c.type,
        region: c.region, apiGravity: c.apiGravity.typical,
        sulfur: c.sulfur.typical, characteristics: c.characteristics,
      }));
    }),

  // Get database metadata and statistics
  getDatabaseInfo: protectedProcedure.query(async () => {
    const meta = await getCrudeMetadata();
    return {
      ...CRUDE_OIL_DB_METADATA,
      ...meta,
      tolerances: SPEC_TOLERANCES,
      astmMethods: ASTM_METHODS,
      parameterWeights: { apiGravity: 30, sulfur: 25, bsw: 10, salt: 8, rvp: 7, viscosity: 7, tan: 5, pourPoint: 4, flashPoint: 4 },
    };
  }),

  // Get specifications for a specific crude type (full 12-parameter specs)
  getCrudeSpecs: protectedProcedure
    .input(z.object({ crudeId: z.string() }))
    .query(async ({ input }) => {
      const crude = await getCrudeById(input.crudeId);
      if (!crude) {
        throw new Error("Crude type not found");
      }

      const specEntry = (range: { min: number; max: number; typical: number } | undefined, unit: string) =>
        range ? { min: range.min, max: range.max, typical: range.typical, unit } : null;

      return {
        id: crude.id,
        name: crude.name,
        type: crude.type,
        country: getCountryName(crude.country),
        countryCode: crude.country,
        region: crude.region,
        specifications: {
          apiGravity: specEntry(crude.apiGravity, "°API"),
          sulfur: specEntry(crude.sulfur, "%"),
          bsw: specEntry(crude.bsw, "%"),
          salt: specEntry(crude.salt, "PTB"),
          rvp: specEntry(crude.rvp, "psi"),
          pourPoint: specEntry(crude.pourPoint, "°C"),
          flashPoint: specEntry(crude.flashPoint, "°C"),
          viscosity: specEntry(crude.viscosity, "cSt@40°C"),
          tan: specEntry(crude.tan, "mg KOH/g"),
        },
        characteristics: crude.characteristics,
      };
    }),

  // Save identification to load record in DB
  saveToRunTicket: protectedProcedure
    .input(
      z.object({
        loadId: z.string(),
        crudeId: z.string(),
        productName: z.string().optional(),
        category: z.string().optional(),
        confidence: z.number(),
        parameters: z.object({
          apiGravity: z.number(),
          bsw: z.number(),
          sulfur: z.number().optional(),
          salt: z.number().optional(),
          rvp: z.number().optional(),
          pourPoint: z.number().optional(),
          flashPoint: z.number().optional(),
          viscosity: z.number().optional(),
          tan: z.number().optional(),
        }),
        terminalId: z.string().optional(),
        notes: z.string().optional(),
        esangVerified: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const loadId = parseInt(input.loadId, 10);
      const verifiedAt = new Date().toISOString();

      // Look up crude name from our database if not provided
      const crude = await getCrudeById(input.crudeId);
      const productName = input.productName || crude?.name || input.crudeId;

      const spectraMatchResult = {
        crudeId: input.crudeId,
        productName,
        confidence: input.confidence,
        category: input.category || crude?.type || "unknown",
        apiGravity: input.parameters.apiGravity,
        bsw: input.parameters.bsw,
        sulfur: input.parameters.sulfur,
        flashPoint: input.parameters.flashPoint,
        verifiedBy: (ctx.user as any)?.id || 0,
        verifiedAt,
        esangVerified: input.esangVerified || false,
      };

      try {
        await db.update(loads)
          .set({
            spectraMatchResult: spectraMatchResult as any,
            commodityName: productName,
          } as any)
          .where(eq(loads.id, loadId));

        return {
          success: true,
          runTicketId: `RT-${Date.now()}`,
          loadId: input.loadId,
          crudeIdentification: {
            crudeId: input.crudeId,
            productName,
            confidence: input.confidence,
            verifiedBy: (ctx.user as any)?.id,
            verifiedAt,
          },
          message: "SpectraMatch identification saved to load",
        };
      } catch (error) {
        console.error("[SpectraMatch] saveToRunTicket DB error:", error);
        throw new Error("Failed to save SpectraMatch result");
      }
    }),

  // Get identification history for a terminal
  getHistory: protectedProcedure
    .input(
      z.object({
        terminalId: z.string().optional(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      // Query database for identification history
      const db = await getDb();
      if (!db) return { identifications: [], total: 0 };

      try {
        const history = await db.select().from(loads)
          .orderBy(desc(loads.createdAt))
          .limit(input.limit);

        const verified = history.filter(l => !!(l as any).spectraMatchResult);
        return {
          identifications: verified.map((load) => {
            const sm = (load as any).spectraMatchResult as any;
            return {
              id: `SM-${String(load.id).padStart(3, '0')}`,
              timestamp: sm?.verifiedAt || load.createdAt?.toISOString() || new Date().toISOString(),
              crudeType: sm?.productName || (load as any).commodityName || "Unknown",
              confidence: sm?.confidence || 0,
              apiGravity: sm?.apiGravity || 0,
              bsw: sm?.bsw || 0,
              loadId: `LD-${load.id}`,
              verifiedBy: sm?.esangVerified ? "ESANG AI" : "System",
              category: sm?.category || "unknown",
            };
          }),
          total: verified.length,
        };
      } catch (error) {
        console.error('[SpectraMatch] getHistory error:', error);
        return { identifications: [], total: 0 };
      }
    }),
});
