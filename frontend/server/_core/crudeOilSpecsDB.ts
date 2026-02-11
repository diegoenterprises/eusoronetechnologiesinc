/**
 * SPECTRA-MATCH™ Database-Backed Crude Oil Specification Engine
 * 
 * Same matching algorithm as crudeOilSpecs.ts but loads data from DB.
 * Caches specs in memory after first load for performance.
 * Falls back to static data if DB is unavailable.
 */

import { getDb } from "../db";
import { crudeOilSpecs as crudeOilSpecsTable } from "../../drizzle/schema";
import { eq, like, sql } from "drizzle-orm";
import {
  CRUDE_OIL_SPECS, SPEC_TOLERANCES, CRUDE_OIL_DB_METADATA,
  matchCrudeOil as staticMatchCrudeOil,
  getCrudeById as staticGetCrudeById,
  getCrudesByCountry as staticGetCrudesByCountry,
  getCrudesByType as staticGetCrudesByType,
  searchCrudes as staticSearchCrudes,
  classifyAPI, classifySulfur, getCountryName,
  type CrudeOilSpec, type MatchResult, type MatchInput,
} from "./crudeOilSpecs";

// Re-export unchanged utilities
export { SPEC_TOLERANCES, classifyAPI, classifySulfur, getCountryName };
export type { CrudeOilSpec, MatchResult, MatchInput };

// ── In-memory cache ──────────────────────────────────────────────────────────
let _cachedSpecs: CrudeOilSpec[] | null = null;
let _cacheLoadedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Load crude oil specs from DB, with in-memory caching.
 * Falls back to static CRUDE_OIL_SPECS if DB unavailable.
 */
async function loadSpecs(): Promise<CrudeOilSpec[]> {
  // Return cache if fresh
  if (_cachedSpecs && Date.now() - _cacheLoadedAt < CACHE_TTL_MS) {
    return _cachedSpecs;
  }

  try {
    const db = await getDb();
    if (!db) throw new Error("No DB");

    const rows = await db.select().from(crudeOilSpecsTable).where(eq(crudeOilSpecsTable.isActive, true));
    if (rows.length === 0) throw new Error("No specs in DB, falling back to static");

    _cachedSpecs = rows.map((r) => ({
      id: r.specId,
      name: r.name,
      type: r.type,
      country: r.country,
      region: r.region,
      apiGravity: r.apiGravity as any,
      sulfur: r.sulfur as any,
      bsw: r.bsw as any,
      salt: r.salt as any || undefined,
      rvp: r.rvp as any || undefined,
      pourPoint: r.pourPoint as any || undefined,
      flashPoint: r.flashPoint as any || undefined,
      viscosity: r.viscosity as any || undefined,
      tan: r.tan as any || undefined,
      characteristics: r.characteristics as any || [],
    }));
    _cacheLoadedAt = Date.now();
    console.log(`[SpectraMatch] Loaded ${_cachedSpecs.length} crude specs from DB`);
    return _cachedSpecs;
  } catch (err) {
    console.warn("[SpectraMatch] DB load failed, using static data:", (err as Error).message);
    _cachedSpecs = CRUDE_OIL_SPECS;
    _cacheLoadedAt = Date.now();
    return _cachedSpecs;
  }
}

/** Force reload from DB on next call */
export function invalidateCache() {
  _cachedSpecs = null;
  _cacheLoadedAt = 0;
}

// ── Scoring engine (same algorithm, now async) ───────────────────────────────

interface ParameterScore {
  score: number; accuracy: string; weight: number;
  value: number; typical: number; unit: string; withinTolerance: boolean;
}

function scoreParameter(
  value: number, range: { min: number; max: number; typical: number },
  tolerance: number, weight: number, unit: string,
): ParameterScore {
  const { min, max, typical } = range;
  const withinRange = value >= min && value <= max;
  const withinTolerance = value >= (min - tolerance) && value <= (max + tolerance);
  let score: number;
  if (withinRange) {
    const distFromTypical = Math.abs(value - typical);
    const maxDist = Math.max(typical - min, max - typical) || 1;
    score = 100 - (distFromTypical / maxDist) * 25;
  } else if (withinTolerance) {
    const distance = value < min ? min - value : value - max;
    score = 70 - (distance / tolerance) * 20;
  } else {
    const rangeSize = (max - min) || 1;
    const distance = value < min ? min - value : value - max;
    score = Math.max(0, 50 - (distance / rangeSize) * 50);
  }
  let accuracy: string;
  if (score >= 95) accuracy = "Exact";
  else if (score >= 85) accuracy = "Very High";
  else if (score >= 70) accuracy = "High";
  else if (score >= 55) accuracy = "Good";
  else if (score >= 40) accuracy = "Moderate";
  else accuracy = "Poor";
  return { score, accuracy, weight, value, typical, unit, withinTolerance };
}

const PARAMETER_WEIGHTS: Record<string, number> = {
  apiGravity: 30, sulfur: 25, bsw: 10, salt: 8, rvp: 7,
  viscosity: 7, tan: 5, pourPoint: 4, flashPoint: 4,
};

export async function matchCrudeOil(input: MatchInput, maxResults = 10): Promise<MatchResult[]> {
  const specs = await loadSpecs();

  const results = specs.map(crude => {
    const scores: Record<string, ParameterScore> = {};
    let totalWeight = 0; let weightedScore = 0;
    let matchedCount = 0; let totalCount = 0;

    const apiScore = scoreParameter(input.apiGravity, crude.apiGravity, SPEC_TOLERANCES.apiGravity, PARAMETER_WEIGHTS.apiGravity, "°API");
    scores.apiGravity = apiScore; totalWeight += apiScore.weight; weightedScore += apiScore.score * apiScore.weight; matchedCount++; totalCount++;

    const bswScore = scoreParameter(input.bsw, crude.bsw, SPEC_TOLERANCES.bsw, PARAMETER_WEIGHTS.bsw, "%");
    scores.bsw = bswScore; totalWeight += bswScore.weight; weightedScore += bswScore.score * bswScore.weight; matchedCount++; totalCount++;

    if (input.sulfur !== undefined) {
      const s = scoreParameter(input.sulfur, crude.sulfur, SPEC_TOLERANCES.sulfur, PARAMETER_WEIGHTS.sulfur, "%");
      scores.sulfur = s; totalWeight += s.weight; weightedScore += s.score * s.weight; matchedCount++; totalCount++;
    }
    if (input.salt !== undefined && crude.salt) {
      const s = scoreParameter(input.salt, crude.salt, SPEC_TOLERANCES.salt, PARAMETER_WEIGHTS.salt, "PTB");
      scores.salt = s; totalWeight += s.weight; weightedScore += s.score * s.weight; matchedCount++; totalCount++;
    }
    if (input.rvp !== undefined && crude.rvp) {
      const s = scoreParameter(input.rvp, crude.rvp, SPEC_TOLERANCES.rvp, PARAMETER_WEIGHTS.rvp, "psi");
      scores.rvp = s; totalWeight += s.weight; weightedScore += s.score * s.weight; matchedCount++; totalCount++;
    }
    if (input.pourPoint !== undefined && crude.pourPoint) {
      const s = scoreParameter(input.pourPoint, crude.pourPoint, SPEC_TOLERANCES.pourPoint, PARAMETER_WEIGHTS.pourPoint, "°C");
      scores.pourPoint = s; totalWeight += s.weight; weightedScore += s.score * s.weight; matchedCount++; totalCount++;
    }
    if (input.flashPoint !== undefined && crude.flashPoint) {
      const s = scoreParameter(input.flashPoint, crude.flashPoint, SPEC_TOLERANCES.flashPoint, PARAMETER_WEIGHTS.flashPoint, "°C");
      scores.flashPoint = s; totalWeight += s.weight; weightedScore += s.score * s.weight; matchedCount++; totalCount++;
    }
    if (input.viscosity !== undefined && crude.viscosity) {
      const viscTolerance = crude.viscosity.typical * SPEC_TOLERANCES.viscosity;
      const s = scoreParameter(input.viscosity, crude.viscosity, viscTolerance, PARAMETER_WEIGHTS.viscosity, "cSt@40°C");
      scores.viscosity = s; totalWeight += s.weight; weightedScore += s.score * s.weight; matchedCount++; totalCount++;
    }
    if (input.tan !== undefined && crude.tan) {
      const s = scoreParameter(input.tan, crude.tan, SPEC_TOLERANCES.tan, PARAMETER_WEIGHTS.tan, "mg KOH/g");
      scores.tan = s; totalWeight += s.weight; weightedScore += s.score * s.weight; matchedCount++; totalCount++;
    }

    let geoBonus = 0;
    if (input.country && crude.country === input.country.toUpperCase()) geoBonus += 3;
    if (input.sourceBasin && crude.region.toLowerCase().includes(input.sourceBasin.toLowerCase())) geoBonus += 2;

    const confidence = Math.min(100, Math.round((weightedScore / totalWeight) + geoBonus));

    return { crude, confidence, parameterScores: scores, matchedParameters: matchedCount, totalParameters: totalCount };
  });

  return results.sort((a, b) => b.confidence - a.confidence).slice(0, maxResults);
}

export async function getCrudeById(id: string): Promise<CrudeOilSpec | undefined> {
  const specs = await loadSpecs();
  return specs.find(c => c.id === id);
}

export async function getCrudesByCountry(country: string): Promise<CrudeOilSpec[]> {
  const specs = await loadSpecs();
  return specs.filter(c => c.country.toLowerCase() === country.toLowerCase());
}

export async function getCrudesByType(type: string): Promise<CrudeOilSpec[]> {
  const specs = await loadSpecs();
  return specs.filter(c => c.type.toLowerCase().includes(type.toLowerCase()));
}

export async function searchCrudes(query: string, limit = 20): Promise<CrudeOilSpec[]> {
  const q = query.toLowerCase();
  const specs = await loadSpecs();
  return specs
    .filter(c => c.name.toLowerCase().includes(q) || c.region.toLowerCase().includes(q) || c.type.toLowerCase().includes(q) || c.country.toLowerCase().includes(q))
    .slice(0, limit);
}

export async function getMetadata() {
  const specs = await loadSpecs();
  const countries = Array.from(new Set(specs.map(s => s.country)));
  return {
    totalGrades: specs.length,
    countries: countries.length,
    source: _cacheLoadedAt > 0 ? "database" : "static",
    lastLoaded: new Date(_cacheLoadedAt).toISOString(),
  };
}
