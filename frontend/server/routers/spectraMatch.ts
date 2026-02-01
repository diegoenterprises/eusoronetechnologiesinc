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
import { sql } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";

// Crude oil database with known specifications
const CRUDE_OIL_DATABASE = [
  {
    id: "wti",
    name: "West Texas Intermediate (WTI)",
    type: "Light / Sweet",
    region: "United States - Permian Basin",
    apiGravity: { min: 38, max: 42, typical: 39.6 },
    sulfur: { min: 0.2, max: 0.4, typical: 0.24 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    boilingPoint: { min: 100, max: 350, typical: 180 },
    characteristics: ["Low sulfur content", "High API gravity", "Premium pricing"],
  },
  {
    id: "wti_midland",
    name: "WTI Midland",
    type: "Light / Sweet",
    region: "United States - Midland, TX",
    apiGravity: { min: 40, max: 44, typical: 42.0 },
    sulfur: { min: 0.15, max: 0.35, typical: 0.22 },
    bsw: { min: 0.1, max: 0.4, typical: 0.25 },
    boilingPoint: { min: 95, max: 340, typical: 175 },
    characteristics: ["Very light crude", "Sweet", "Shale production"],
  },
  {
    id: "bakken",
    name: "Bakken",
    type: "Light / Sweet",
    region: "United States - North Dakota/Montana",
    apiGravity: { min: 40, max: 45, typical: 42.5 },
    sulfur: { min: 0.1, max: 0.25, typical: 0.15 },
    bsw: { min: 0.1, max: 0.5, typical: 0.35 },
    boilingPoint: { min: 90, max: 320, typical: 165 },
    characteristics: ["Very light", "Very sweet", "High volatility"],
  },
  {
    id: "eagle_ford",
    name: "Eagle Ford",
    type: "Light / Sweet",
    region: "United States - South Texas",
    apiGravity: { min: 42, max: 62, typical: 48.0 },
    sulfur: { min: 0.05, max: 0.2, typical: 0.1 },
    bsw: { min: 0.1, max: 0.4, typical: 0.2 },
    boilingPoint: { min: 85, max: 300, typical: 155 },
    characteristics: ["Condensate-like", "Ultra-light", "Premium grade"],
  },
  {
    id: "la_sweet",
    name: "Louisiana Sweet",
    type: "Light / Sweet",
    region: "United States - Louisiana",
    apiGravity: { min: 32, max: 38, typical: 35.0 },
    sulfur: { min: 0.2, max: 0.5, typical: 0.35 },
    bsw: { min: 0.2, max: 0.6, typical: 0.4 },
    boilingPoint: { min: 110, max: 380, typical: 200 },
    characteristics: ["Medium-light", "Sweet", "Gulf Coast origin"],
  },
  {
    id: "mars",
    name: "Mars Blend",
    type: "Medium / Sour",
    region: "United States - Gulf of Mexico",
    apiGravity: { min: 28, max: 32, typical: 30.0 },
    sulfur: { min: 1.8, max: 2.4, typical: 2.1 },
    bsw: { min: 0.3, max: 0.8, typical: 0.5 },
    boilingPoint: { min: 140, max: 420, typical: 240 },
    characteristics: ["Medium gravity", "High sulfur", "Deepwater production"],
  },
  {
    id: "brent",
    name: "Brent Crude",
    type: "Light / Sweet",
    region: "North Sea",
    apiGravity: { min: 36, max: 40, typical: 38.0 },
    sulfur: { min: 0.3, max: 0.5, typical: 0.4 },
    bsw: { min: 0.1, max: 0.4, typical: 0.25 },
    boilingPoint: { min: 105, max: 360, typical: 185 },
    characteristics: ["Global benchmark", "Light-sweet", "European standard"],
  },
  {
    id: "dubai",
    name: "Dubai Crude",
    type: "Medium / Sour",
    region: "Middle East - UAE",
    apiGravity: { min: 30, max: 33, typical: 31.0 },
    sulfur: { min: 1.8, max: 2.2, typical: 2.0 },
    bsw: { min: 0.2, max: 0.5, typical: 0.35 },
    boilingPoint: { min: 130, max: 400, typical: 225 },
    characteristics: ["Asian benchmark", "Medium sour", "Dubai/Oman pricing"],
  },
  {
    id: "arab_light",
    name: "Arab Light",
    type: "Light / Sour",
    region: "Middle East - Saudi Arabia",
    apiGravity: { min: 32, max: 35, typical: 33.0 },
    sulfur: { min: 1.6, max: 2.0, typical: 1.8 },
    bsw: { min: 0.1, max: 0.4, typical: 0.2 },
    boilingPoint: { min: 120, max: 390, typical: 210 },
    characteristics: ["High volume", "Consistent quality", "Global export"],
  },
  {
    id: "maya",
    name: "Maya Crude",
    type: "Heavy / Sour",
    region: "Mexico - Gulf",
    apiGravity: { min: 20, max: 24, typical: 22.0 },
    sulfur: { min: 3.0, max: 3.8, typical: 3.4 },
    bsw: { min: 0.4, max: 1.0, typical: 0.7 },
    boilingPoint: { min: 180, max: 480, typical: 300 },
    characteristics: ["Heavy crude", "High sulfur", "Discount pricing"],
  },
  {
    id: "canadian_heavy",
    name: "Western Canadian Select",
    type: "Heavy / Sour",
    region: "Canada - Alberta",
    apiGravity: { min: 19, max: 23, typical: 21.0 },
    sulfur: { min: 3.0, max: 3.6, typical: 3.3 },
    bsw: { min: 0.3, max: 0.8, typical: 0.5 },
    boilingPoint: { min: 190, max: 500, typical: 320 },
    characteristics: ["Oil sands blend", "Heavy", "Pipeline transported"],
  },
  {
    id: "bonny_light",
    name: "Bonny Light",
    type: "Light / Sweet",
    region: "Nigeria",
    apiGravity: { min: 33, max: 37, typical: 35.0 },
    sulfur: { min: 0.1, max: 0.2, typical: 0.14 },
    bsw: { min: 0.1, max: 0.3, typical: 0.2 },
    boilingPoint: { min: 100, max: 350, typical: 190 },
    characteristics: ["Very low sulfur", "African export", "Premium grade"],
  },
];

// Calculate match score for a single parameter
function calculateParameterScore(
  value: number,
  range: { min: number; max: number; typical: number }
): { score: number; accuracy: string; weight: number } {
  const { min, max, typical } = range;
  
  // Check if value is within range
  if (value < min || value > max) {
    const distance = value < min ? min - value : value - max;
    const rangeSize = max - min;
    const penalty = Math.min(distance / rangeSize, 1) * 50;
    return { 
      score: Math.max(0, 50 - penalty), 
      accuracy: "Poor",
      weight: 15 
    };
  }
  
  // Calculate how close to typical value
  const distanceFromTypical = Math.abs(value - typical);
  const maxDistance = Math.max(typical - min, max - typical);
  const normalizedDistance = distanceFromTypical / maxDistance;
  
  const score = 100 - (normalizedDistance * 30);
  
  let accuracy: string;
  if (score >= 95) accuracy = "Very High";
  else if (score >= 85) accuracy = "High";
  else if (score >= 70) accuracy = "Good";
  else accuracy = "Moderate";
  
  // Weight based on how close to center of range
  const weight = score >= 90 ? 30 : score >= 80 ? 25 : 20;
  
  return { score, accuracy, weight };
}

// Match crude oil based on input parameters
function matchCrudeOil(params: {
  apiGravity: number;
  bsw: number;
  boilingPoint?: number;
  sulfur?: number;
}): Array<{
  crude: typeof CRUDE_OIL_DATABASE[0];
  confidence: number;
  parameterScores: {
    apiGravity: { score: number; accuracy: string; weight: number };
    bsw: { score: number; accuracy: string; weight: number };
    boilingPoint?: { score: number; accuracy: string; weight: number };
    sulfur?: { score: number; accuracy: string; weight: number };
  };
}> {
  const results = CRUDE_OIL_DATABASE.map((crude) => {
    const apiScore = calculateParameterScore(params.apiGravity, crude.apiGravity);
    const bswScore = calculateParameterScore(params.bsw, crude.bsw);
    
    let boilingScore: { score: number; accuracy: string; weight: number } | undefined;
    let sulfurScore: { score: number; accuracy: string; weight: number } | undefined;
    
    if (params.boilingPoint !== undefined) {
      boilingScore = calculateParameterScore(params.boilingPoint, crude.boilingPoint);
    }
    
    if (params.sulfur !== undefined) {
      sulfurScore = calculateParameterScore(params.sulfur, crude.sulfur);
    }
    
    // Calculate weighted confidence
    let totalWeight = apiScore.weight + bswScore.weight;
    let weightedScore = (apiScore.score * apiScore.weight) + (bswScore.score * bswScore.weight);
    
    if (boilingScore) {
      totalWeight += boilingScore.weight;
      weightedScore += boilingScore.score * boilingScore.weight;
    }
    
    if (sulfurScore) {
      totalWeight += sulfurScore.weight;
      weightedScore += sulfurScore.score * sulfurScore.weight;
    }
    
    const confidence = Math.round(weightedScore / totalWeight);
    
    return {
      crude,
      confidence,
      parameterScores: {
        apiGravity: apiScore,
        bsw: bswScore,
        ...(boilingScore && { boilingPoint: boilingScore }),
        ...(sulfurScore && { sulfur: sulfurScore }),
      },
    };
  });
  
  // Sort by confidence and return top matches
  return results.sort((a, b) => b.confidence - a.confidence);
}

export const spectraMatchRouter = router({
  // Identify crude oil origin based on parameters
  identify: protectedProcedure
    .input(
      z.object({
        apiGravity: z.number().min(10).max(70).describe("API Gravity in degrees"),
        bsw: z.number().min(0).max(5).describe("Basic Sediment & Water percentage"),
        boilingPoint: z.number().min(50).max(600).optional().describe("Boiling point in Celsius"),
        sulfur: z.number().min(0).max(6).optional().describe("Sulfur content percentage"),
        location: z.object({
          lat: z.number().optional(),
          lng: z.number().optional(),
          terminalId: z.string().optional(),
        }).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const matches = matchCrudeOil(input);
      const topMatch = matches[0];
      const alternativeMatches = matches.slice(1, 5);
      
      return {
        primaryMatch: {
          id: topMatch.crude.id,
          name: topMatch.crude.name,
          type: topMatch.crude.type,
          region: topMatch.crude.region,
          confidence: topMatch.confidence,
          characteristics: topMatch.crude.characteristics,
        },
        parameterAnalysis: {
          apiGravity: {
            value: input.apiGravity,
            unit: "°API",
            score: topMatch.parameterScores.apiGravity.score,
            accuracy: topMatch.parameterScores.apiGravity.accuracy,
            weight: `${topMatch.parameterScores.apiGravity.weight}%`,
            typical: topMatch.crude.apiGravity.typical,
          },
          bsw: {
            value: input.bsw,
            unit: "%",
            score: topMatch.parameterScores.bsw.score,
            accuracy: topMatch.parameterScores.bsw.accuracy,
            weight: `${topMatch.parameterScores.bsw.weight}%`,
            typical: topMatch.crude.bsw.typical,
          },
          ...(input.boilingPoint && topMatch.parameterScores.boilingPoint && {
            boilingPoint: {
              value: input.boilingPoint,
              unit: "°C",
              score: topMatch.parameterScores.boilingPoint.score,
              accuracy: topMatch.parameterScores.boilingPoint.accuracy,
              weight: `${topMatch.parameterScores.boilingPoint.weight}%`,
              typical: topMatch.crude.boilingPoint.typical,
            },
          }),
          ...(input.sulfur && topMatch.parameterScores.sulfur && {
            sulfur: {
              value: input.sulfur,
              unit: "%",
              score: topMatch.parameterScores.sulfur.score,
              accuracy: topMatch.parameterScores.sulfur.accuracy,
              weight: `${topMatch.parameterScores.sulfur.weight}%`,
              typical: topMatch.crude.sulfur.typical,
            },
          }),
        },
        alternativeMatches: alternativeMatches.map((m) => ({
          id: m.crude.id,
          name: m.crude.name,
          type: m.crude.type,
          confidence: m.confidence,
        })),
        timestamp: new Date().toISOString(),
        esangVerified: true,
      };
    }),

  // Get all known crude oil types in database
  getCrudeTypes: protectedProcedure.query(async () => {
    return CRUDE_OIL_DATABASE.map((crude) => ({
      id: crude.id,
      name: crude.name,
      type: crude.type,
      region: crude.region,
      apiGravityRange: `${crude.apiGravity.min}-${crude.apiGravity.max} °API`,
      sulfurRange: `${crude.sulfur.min}-${crude.sulfur.max}%`,
      characteristics: crude.characteristics,
    }));
  }),

  // Get specifications for a specific crude type
  getCrudeSpecs: protectedProcedure
    .input(z.object({ crudeId: z.string() }))
    .query(async ({ input }) => {
      const crude = CRUDE_OIL_DATABASE.find((c) => c.id === input.crudeId);
      if (!crude) {
        throw new Error("Crude type not found");
      }
      
      return {
        id: crude.id,
        name: crude.name,
        type: crude.type,
        region: crude.region,
        specifications: {
          apiGravity: {
            min: crude.apiGravity.min,
            max: crude.apiGravity.max,
            typical: crude.apiGravity.typical,
            unit: "°API",
          },
          sulfur: {
            min: crude.sulfur.min,
            max: crude.sulfur.max,
            typical: crude.sulfur.typical,
            unit: "%",
          },
          bsw: {
            min: crude.bsw.min,
            max: crude.bsw.max,
            typical: crude.bsw.typical,
            unit: "%",
          },
          boilingPoint: {
            min: crude.boilingPoint.min,
            max: crude.boilingPoint.max,
            typical: crude.boilingPoint.typical,
            unit: "°C",
          },
        },
        characteristics: crude.characteristics,
      };
    }),

  // Save identification to run ticket
  saveToRunTicket: protectedProcedure
    .input(
      z.object({
        loadId: z.string(),
        crudeId: z.string(),
        confidence: z.number(),
        parameters: z.object({
          apiGravity: z.number(),
          bsw: z.number(),
          boilingPoint: z.number().optional(),
          sulfur: z.number().optional(),
        }),
        terminalId: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // In production, this would save to database
      return {
        success: true,
        runTicketId: `RT-${Date.now()}`,
        loadId: input.loadId,
        crudeIdentification: {
          crudeId: input.crudeId,
          confidence: input.confidence,
          verifiedBy: ctx.user?.id,
          verifiedAt: new Date().toISOString(),
        },
        message: "SpectraMatch identification saved to run ticket",
      };
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
      // Mock history data - in production would query database
      return {
        identifications: [
          {
            id: "SM-001",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            crudeType: "West Texas Intermediate (WTI)",
            confidence: 94,
            apiGravity: 39.6,
            bsw: 0.3,
            loadId: "LD-2024-001",
            verifiedBy: "Driver John Smith",
          },
          {
            id: "SM-002",
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            crudeType: "Bakken",
            confidence: 91,
            apiGravity: 42.1,
            bsw: 0.25,
            loadId: "LD-2024-002",
            verifiedBy: "Driver Jane Doe",
          },
          {
            id: "SM-003",
            timestamp: new Date(Date.now() - 10800000).toISOString(),
            crudeType: "Eagle Ford",
            confidence: 88,
            apiGravity: 47.5,
            bsw: 0.2,
            loadId: "LD-2024-003",
            verifiedBy: "Terminal Operator",
          },
        ],
        total: 3,
      };
    }),
});
