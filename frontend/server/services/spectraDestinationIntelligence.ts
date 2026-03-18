/**
 * SPECTRA-MATCH™ DESTINATION INTELLIGENCE ENGINE
 *
 * Given a crude oil grade or petroleum product (identified by SPECTRA-MATCH),
 * recommends optimal destinations — refineries, terminals, ports, and pipelines
 * worldwide that can accept, process, or blend that specific product.
 *
 * The "Where Should My Product Go?" Engine.
 *
 * Factors:
 * 1. Refinery configuration compatibility (crude diet, processing units)
 * 2. Terminal product acceptance (what grades a terminal handles)
 * 3. Pipeline spec constraints (API, sulfur, RVP limits)
 * 4. Port draft/infrastructure (vessel access, tank capacity)
 * 5. Blending opportunities (complementary crudes for optimization)
 * 6. Geographic/route efficiency
 * 7. Current inventory levels (via TAS integration)
 * 8. Market pricing differentials (arbitrage opportunities)
 */

import { logger } from "../_core/logger";
import { getDb } from "../db";
import { facilities, ports } from "../../drizzle/schema";
import { eq, sql, and, inArray } from "drizzle-orm";
import { cacheThrough as lsCacheThrough } from "./cache/redisCache";
import { type CrudeOilSpec, type MatchResult } from "../_core/crudeOilSpecsDB";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ProductSpec {
  productName: string;
  category: 'crude' | 'refined' | 'lpg' | 'chemical';
  apiGravity?: number;
  sulfurContent?: number;
  bsw?: number;
  rvp?: number;
  viscosity?: number;
  tan?: number;
  pourPoint?: number;
  flashPoint?: number;
  hazmatClass?: string;
  sourceBasin?: string;
  country?: string;
}

export interface RefineryProfile {
  id: number;
  name: string;
  operator: string;
  location: { city: string; state: string; country: string; lat: number; lng: number };
  processingCapacityBpd: number;
  storageCapacityBbl: number;
  /** Crude diet: what API/sulfur range this refinery is configured for */
  crudeSlate: {
    minAPI: number;
    maxAPI: number;
    maxSulfur: number;
    maxTAN: number;
    maxRVP: number;
    preferredTypes: string[]; // e.g. ['light_sweet', 'medium_sour']
  };
  /** Processing units determine what crude types can be refined */
  processingUnits: string[]; // coker, FCC, hydrocracker, desulfurizer, etc.
  /** Transport modes accepted */
  connectivity: {
    pipeline: boolean;
    tanker: boolean;
    barge: boolean;
    truck: boolean;
    rail: boolean;
  };
  /** Port access for vessel delivery */
  nearestPortId?: number;
  nearestPortDistance?: number; // miles
}

export interface DestinationMatch {
  facilityId: number;
  facilityName: string;
  facilityType: string;
  operator: string;
  location: {
    city: string;
    state: string;
    country: string;
    lat: number;
    lng: number;
  };
  /** 0-100 compatibility score */
  compatibilityScore: number;
  /** Why this destination matches */
  matchReasons: string[];
  /** Specific warnings or constraints */
  warnings: string[];
  /** Transport modes available to reach this facility */
  accessModes: string[];
  /** Nearest port for vessel delivery */
  nearestPort?: { name: string; unlocode: string; distanceMiles: number };
  /** Processing capacity if refinery */
  capacityBpd?: number;
  /** Storage capacity */
  storageBbl?: number;
  /** Current products handled */
  products?: string[];
  /** Market context */
  marketInsight?: string;
  /** Blending opportunity */
  blendingOpportunity?: string;
}

export interface DestinationIntelligenceResult {
  product: ProductSpec;
  totalMatches: number;
  topDestinations: DestinationMatch[];
  /** Grouped by region for map visualization */
  byRegion: Record<string, DestinationMatch[]>;
  /** Blending recommendations */
  blendingInsights: BlendingInsight[];
  /** Pipeline route suggestions */
  pipelineRoutes: PipelineRoute[];
  /** Market arbitrage opportunities */
  arbitrageOpportunities: ArbitrageOpportunity[];
  generatedAt: string;
}

export interface BlendingInsight {
  targetProduct: string;
  blendWith: string;
  rationale: string;
  targetAPI: number;
  targetSulfur: number;
  facilities: string[];
}

export interface PipelineRoute {
  pipelineName: string;
  origin: string;
  destination: string;
  acceptsProduct: boolean;
  constraints: string[];
  capacityBpd?: number;
}

export interface ArbitrageOpportunity {
  fromRegion: string;
  toRegion: string;
  priceDifferential: string;
  rationale: string;
  facilities: string[];
}

// ============================================================================
// REFINERY CRUDE SLATE PROFILES
// Major US refineries and their crude diet configurations
// Source: EIA, company filings, public capacity data
// ============================================================================

const REFINERY_CRUDE_SLATES: Record<string, {
  minAPI: number; maxAPI: number; maxSulfur: number; maxTAN: number; maxRVP: number;
  preferredTypes: string[]; processingUnits: string[];
}> = {
  // Gulf Coast — configured for heavy sour (cokers)
  'Motiva Port Arthur': { minAPI: 15, maxAPI: 45, maxSulfur: 4.0, maxTAN: 1.5, maxRVP: 12, preferredTypes: ['heavy_sour', 'medium_sour', 'light_sweet'], processingUnits: ['coker', 'FCC', 'hydrocracker', 'desulfurizer', 'alkylation'] },
  'Valero Port Arthur': { minAPI: 18, maxAPI: 42, maxSulfur: 3.5, maxTAN: 1.0, maxRVP: 12, preferredTypes: ['heavy_sour', 'medium_sour'], processingUnits: ['coker', 'FCC', 'desulfurizer'] },
  'ExxonMobil Baytown': { minAPI: 20, maxAPI: 45, maxSulfur: 3.0, maxTAN: 0.8, maxRVP: 12, preferredTypes: ['medium_sour', 'light_sweet'], processingUnits: ['coker', 'FCC', 'hydrocracker', 'desulfurizer'] },
  'Marathon Galveston Bay': { minAPI: 22, maxAPI: 44, maxSulfur: 2.5, maxTAN: 0.8, maxRVP: 11, preferredTypes: ['medium_sour', 'light_sweet', 'light_sour'], processingUnits: ['coker', 'FCC', 'hydrocracker'] },
  'Citgo Lake Charles': { minAPI: 15, maxAPI: 40, maxSulfur: 3.5, maxTAN: 1.5, maxRVP: 10, preferredTypes: ['heavy_sour', 'medium_sour'], processingUnits: ['coker', 'FCC', 'desulfurizer'] },
  'Phillips 66 Lake Charles': { minAPI: 22, maxAPI: 45, maxSulfur: 2.5, maxTAN: 0.5, maxRVP: 12, preferredTypes: ['light_sweet', 'medium_sour'], processingUnits: ['FCC', 'hydrocracker', 'desulfurizer'] },
  'Valero Texas City': { minAPI: 20, maxAPI: 42, maxSulfur: 3.0, maxTAN: 1.0, maxRVP: 11, preferredTypes: ['medium_sour', 'heavy_sour'], processingUnits: ['coker', 'FCC', 'desulfurizer'] },
  'Shell Deer Park': { minAPI: 22, maxAPI: 44, maxSulfur: 2.5, maxTAN: 0.8, maxRVP: 12, preferredTypes: ['medium_sour', 'light_sweet'], processingUnits: ['coker', 'FCC', 'hydrocracker'] },
  'Flint Hills Corpus Christi': { minAPI: 25, maxAPI: 50, maxSulfur: 1.5, maxTAN: 0.5, maxRVP: 14, preferredTypes: ['light_sweet', 'condensate'], processingUnits: ['FCC', 'splitter', 'isomerization'] },

  // Midwest — configured for Canadian heavy + Bakken light
  'BP Whiting': { minAPI: 18, maxAPI: 45, maxSulfur: 4.0, maxTAN: 1.5, maxRVP: 12, preferredTypes: ['heavy_sour', 'light_sweet'], processingUnits: ['coker', 'FCC', 'hydrocracker', 'desulfurizer'] },
  'Marathon Robinson': { minAPI: 25, maxAPI: 45, maxSulfur: 2.0, maxTAN: 0.5, maxRVP: 12, preferredTypes: ['light_sweet', 'medium_sour'], processingUnits: ['FCC', 'desulfurizer'] },
  'ExxonMobil Joliet': { minAPI: 25, maxAPI: 42, maxSulfur: 1.5, maxTAN: 0.5, maxRVP: 12, preferredTypes: ['light_sweet', 'medium_sweet'], processingUnits: ['FCC', 'hydrocracker'] },
  'Phillips 66 Wood River': { minAPI: 20, maxAPI: 45, maxSulfur: 3.5, maxTAN: 1.0, maxRVP: 12, preferredTypes: ['heavy_sour', 'light_sweet'], processingUnits: ['coker', 'FCC', 'desulfurizer'] },

  // West Coast — configured for Alaska/imported crudes
  'Marathon Los Angeles': { minAPI: 20, maxAPI: 40, maxSulfur: 2.5, maxTAN: 1.0, maxRVP: 10, preferredTypes: ['medium_sour', 'heavy_sour'], processingUnits: ['coker', 'FCC', 'desulfurizer'] },
  'Chevron El Segundo': { minAPI: 18, maxAPI: 42, maxSulfur: 2.5, maxTAN: 1.0, maxRVP: 10, preferredTypes: ['medium_sour', 'heavy_sour'], processingUnits: ['coker', 'FCC', 'hydrocracker'] },
  'Valero Benicia': { minAPI: 22, maxAPI: 42, maxSulfur: 2.0, maxTAN: 0.8, maxRVP: 10, preferredTypes: ['medium_sour', 'light_sweet'], processingUnits: ['FCC', 'desulfurizer'] },
  'Phillips 66 Ferndale': { minAPI: 25, maxAPI: 45, maxSulfur: 1.5, maxTAN: 0.5, maxRVP: 10, preferredTypes: ['light_sweet', 'condensate'], processingUnits: ['FCC', 'hydrocracker'] },

  // East Coast
  'Philadelphia Energy Solutions': { minAPI: 28, maxAPI: 45, maxSulfur: 1.5, maxTAN: 0.5, maxRVP: 12, preferredTypes: ['light_sweet', 'Bakken', 'Eagle Ford'], processingUnits: ['FCC', 'hydrocracker'] },
  'PBF Delaware City': { minAPI: 22, maxAPI: 42, maxSulfur: 2.5, maxTAN: 0.8, maxRVP: 12, preferredTypes: ['medium_sour', 'light_sweet'], processingUnits: ['coker', 'FCC', 'desulfurizer'] },

  // International — major global refineries
  'Jamnagar (Reliance)': { minAPI: 20, maxAPI: 45, maxSulfur: 4.0, maxTAN: 2.0, maxRVP: 15, preferredTypes: ['heavy_sour', 'medium_sour', 'light_sweet'], processingUnits: ['coker', 'FCC', 'hydrocracker', 'desulfurizer', 'petrochemical'] },
  'SK Ulsan': { minAPI: 22, maxAPI: 40, maxSulfur: 3.5, maxTAN: 1.0, maxRVP: 12, preferredTypes: ['medium_sour', 'heavy_sour'], processingUnits: ['coker', 'FCC', 'desulfurizer'] },
  'Rotterdam Shell Pernis': { minAPI: 20, maxAPI: 45, maxSulfur: 3.0, maxTAN: 1.0, maxRVP: 12, preferredTypes: ['medium_sour', 'light_sweet', 'Brent'], processingUnits: ['coker', 'FCC', 'hydrocracker'] },
  'Ruwais (ADNOC)': { minAPI: 25, maxAPI: 45, maxSulfur: 2.0, maxTAN: 0.5, maxRVP: 10, preferredTypes: ['light_sweet', 'Murban', 'medium_sour'], processingUnits: ['FCC', 'hydrocracker', 'desulfurizer'] },
  'Ras Tanura (Aramco)': { minAPI: 25, maxAPI: 40, maxSulfur: 2.5, maxTAN: 0.5, maxRVP: 10, preferredTypes: ['Arab Light', 'Arab Medium', 'medium_sour'], processingUnits: ['FCC', 'hydrocracker', 'desulfurizer'] },
  'Jurong (ExxonMobil Singapore)': { minAPI: 22, maxAPI: 42, maxSulfur: 3.0, maxTAN: 1.0, maxRVP: 12, preferredTypes: ['medium_sour', 'light_sweet'], processingUnits: ['coker', 'FCC', 'hydrocracker'] },
};

// ============================================================================
// PIPELINE SPEC CONSTRAINTS
// ============================================================================

const PIPELINE_SPECS: Record<string, { minAPI: number; maxAPI: number; maxSulfur: number; maxRVP: number; maxBS_W: number; capacityBpd: number; origin: string; destination: string }> = {
  'Keystone Pipeline': { minAPI: 18, maxAPI: 38, maxSulfur: 4.5, maxRVP: 10, maxBS_W: 0.5, capacityBpd: 590000, origin: 'Hardisty AB', destination: 'Cushing OK / USGC' },
  'Enbridge Mainline': { minAPI: 18, maxAPI: 42, maxSulfur: 4.5, maxRVP: 10, maxBS_W: 0.5, capacityBpd: 2850000, origin: 'Edmonton AB', destination: 'Chicago IL / Sarnia ON' },
  'Permian Express': { minAPI: 35, maxAPI: 50, maxSulfur: 0.5, maxRVP: 14, maxBS_W: 1.0, capacityBpd: 400000, origin: 'Permian Basin TX', destination: 'Corpus Christi TX' },
  'DAPL (Dakota Access)': { minAPI: 38, maxAPI: 48, maxSulfur: 0.3, maxRVP: 14, maxBS_W: 1.0, capacityBpd: 570000, origin: 'Bakken ND', destination: 'Patoka IL' },
  'Capline Pipeline': { minAPI: 20, maxAPI: 45, maxSulfur: 3.0, maxRVP: 12, maxBS_W: 1.0, capacityBpd: 1200000, origin: 'St. James LA', destination: 'Patoka IL' },
  'Colonial Pipeline': { minAPI: 30, maxAPI: 60, maxSulfur: 0.5, maxRVP: 15, maxBS_W: 0.1, capacityBpd: 2500000, origin: 'Houston TX', destination: 'Linden NJ' },
  'Explorer Pipeline': { minAPI: 30, maxAPI: 60, maxSulfur: 0.5, maxRVP: 15, maxBS_W: 0.1, capacityBpd: 660000, origin: 'USGC', destination: 'Chicago IL' },
  'TMX (Trans Mountain)': { minAPI: 18, maxAPI: 42, maxSulfur: 4.5, maxRVP: 10, maxBS_W: 0.5, capacityBpd: 890000, origin: 'Edmonton AB', destination: 'Burnaby BC' },
  'BTC Pipeline': { minAPI: 35, maxAPI: 45, maxSulfur: 0.2, maxRVP: 8, maxBS_W: 0.5, capacityBpd: 1200000, origin: 'Baku Azerbaijan', destination: 'Ceyhan Turkey' },
  'Druzhba Pipeline': { minAPI: 28, maxAPI: 36, maxSulfur: 1.8, maxRVP: 8, maxBS_W: 0.5, capacityBpd: 1400000, origin: 'Western Siberia', destination: 'Central Europe' },
  'SUMED Pipeline': { minAPI: 20, maxAPI: 45, maxSulfur: 3.5, maxRVP: 10, maxBS_W: 1.0, capacityBpd: 2340000, origin: 'Ain Sukhna (Red Sea)', destination: 'Sidi Kerir (Med)' },
};

// ============================================================================
// BLENDING MATRIX
// Common crude blending combinations and their purposes
// ============================================================================

const BLENDING_PAIRS: { heavy: string; light: string; targetAPI: number; targetSulfur: number; rationale: string; facilities: string[] }[] = [
  { heavy: 'Western Canadian Select', light: 'Condensate', targetAPI: 22, targetSulfur: 3.0, rationale: 'Dilbit for pipeline transport — WCS too viscous alone', facilities: ['Edmonton terminals', 'Hardisty terminals'] },
  { heavy: 'Maya', light: 'Isthmus', targetAPI: 28, targetSulfur: 2.5, rationale: 'Mexican export blend optimization for USGC cokers', facilities: ['Dos Bocas terminal', 'Cayo Arcas FPSO'] },
  { heavy: 'Arab Heavy', light: 'Arab Light', targetAPI: 31, targetSulfur: 2.0, rationale: 'Aramco blend optimization for Asian refineries', facilities: ['Ras Tanura', 'Juaymah'] },
  { heavy: 'Basrah Heavy', light: 'Basrah Light', targetAPI: 28, targetSulfur: 2.8, rationale: 'Iraqi export blend for Mediterranean refineries', facilities: ['Basrah Oil Terminal', 'Ceyhan terminal'] },
  { heavy: 'Mars', light: 'LLS (Louisiana Light Sweet)', targetAPI: 34, targetSulfur: 1.0, rationale: 'USGC refinery optimization — balance sulfur with sweet blend', facilities: ['LOOP', 'St. James LA terminals'] },
  { heavy: 'Urals', light: 'Siberian Light', targetAPI: 34, targetSulfur: 1.0, rationale: 'Russian export blend optimization', facilities: ['Primorsk', 'Novorossiysk'] },
  { heavy: 'Boscan', light: 'Santa Barbara', targetAPI: 20, targetSulfur: 3.5, rationale: 'Venezuelan blend for deep conversion refineries', facilities: ['Jose terminal', 'USGC terminals'] },
  { heavy: 'Cold Lake', light: 'Bakken', targetAPI: 32, targetSulfur: 1.5, rationale: 'Canadian heavy + US light sweet for Midwest refineries', facilities: ['Cushing OK', 'Patoka IL'] },
];

// ============================================================================
// CORE ENGINE
// ============================================================================

/**
 * Classify crude type from specs
 */
function classifyCrude(spec: ProductSpec): string {
  const api = spec.apiGravity || 30;
  const sulfur = spec.sulfurContent || 0.5;

  if (api >= 35 && sulfur <= 0.5) return 'light_sweet';
  if (api >= 35 && sulfur > 0.5) return 'light_sour';
  if (api >= 25 && api < 35 && sulfur <= 0.5) return 'medium_sweet';
  if (api >= 25 && api < 35 && sulfur > 0.5) return 'medium_sour';
  if (api < 25 && sulfur <= 0.5) return 'heavy_sweet';
  if (api < 25 && sulfur > 0.5) return 'heavy_sour';
  return 'unknown';
}

/**
 * Check if a refinery can process this product
 */
function scoreRefineryCompatibility(spec: ProductSpec, slate: typeof REFINERY_CRUDE_SLATES[string]): { score: number; reasons: string[]; warnings: string[] } {
  const api = spec.apiGravity || 30;
  const sulfur = spec.sulfurContent || 0.5;
  const tan = spec.tan || 0;
  const rvp = spec.rvp || 8;
  const crudeType = classifyCrude(spec);

  let score = 50; // base
  const reasons: string[] = [];
  const warnings: string[] = [];

  // API range check
  if (api >= slate.minAPI && api <= slate.maxAPI) {
    score += 15;
    reasons.push(`API ${api}° within processing range (${slate.minAPI}-${slate.maxAPI}°)`);
  } else {
    score -= 30;
    warnings.push(`API ${api}° outside refinery range (${slate.minAPI}-${slate.maxAPI}°)`);
  }

  // Sulfur check
  if (sulfur <= slate.maxSulfur) {
    score += 15;
    if (sulfur <= slate.maxSulfur * 0.5) {
      score += 5; // bonus for being well within limits
      reasons.push(`Low sulfur ${sulfur}% — well within ${slate.maxSulfur}% limit`);
    } else {
      reasons.push(`Sulfur ${sulfur}% within ${slate.maxSulfur}% limit`);
    }
  } else {
    score -= 25;
    warnings.push(`Sulfur ${sulfur}% exceeds refinery limit of ${slate.maxSulfur}%`);
  }

  // TAN check
  if (tan > 0 && tan > slate.maxTAN) {
    score -= 15;
    warnings.push(`TAN ${tan} exceeds limit of ${slate.maxTAN} — corrosion risk`);
  } else if (tan > 0) {
    score += 5;
    reasons.push(`TAN ${tan} within ${slate.maxTAN} limit`);
  }

  // RVP check
  if (rvp > 0 && rvp > slate.maxRVP) {
    score -= 10;
    warnings.push(`RVP ${rvp} psi exceeds ${slate.maxRVP} psi — vapor handling required`);
  }

  // Preferred type match
  if (slate.preferredTypes.includes(crudeType)) {
    score += 15;
    reasons.push(`${crudeType} is a preferred crude type for this refinery`);
  }

  // Processing unit capabilities
  if (sulfur > 1.5 && slate.processingUnits.includes('desulfurizer')) {
    score += 5;
    reasons.push('Has desulfurization capability for sour crude');
  }
  if (api < 25 && slate.processingUnits.includes('coker')) {
    score += 10;
    reasons.push('Coker unit enables heavy crude processing');
  }
  if (slate.processingUnits.includes('hydrocracker')) {
    score += 3;
    reasons.push('Hydrocracker maximizes distillate yield');
  }

  // Named product match
  if (spec.productName) {
    for (const pt of slate.preferredTypes) {
      if (spec.productName.toLowerCase().includes(pt.toLowerCase()) || pt.toLowerCase().includes(spec.productName.toLowerCase())) {
        score += 10;
        reasons.push(`"${spec.productName}" directly matches refinery's preferred slate`);
        break;
      }
    }
  }

  return { score: Math.min(100, Math.max(0, score)), reasons, warnings };
}

/**
 * Check pipeline compatibility
 */
function scorePipelineCompatibility(spec: ProductSpec, pipeline: typeof PIPELINE_SPECS[string]): { compatible: boolean; constraints: string[] } {
  const api = spec.apiGravity || 30;
  const sulfur = spec.sulfurContent || 0.5;
  const rvp = spec.rvp || 8;
  const bsw = spec.bsw || 0.3;
  const constraints: string[] = [];

  if (api < pipeline.minAPI || api > pipeline.maxAPI) constraints.push(`API ${api}° outside range ${pipeline.minAPI}-${pipeline.maxAPI}°`);
  if (sulfur > pipeline.maxSulfur) constraints.push(`Sulfur ${sulfur}% exceeds ${pipeline.maxSulfur}%`);
  if (rvp > pipeline.maxRVP) constraints.push(`RVP ${rvp} psi exceeds ${pipeline.maxRVP} psi`);
  if (bsw > pipeline.maxBS_W) constraints.push(`BS&W ${bsw}% exceeds ${pipeline.maxBS_W}%`);

  return { compatible: constraints.length === 0, constraints };
}

/**
 * Haversine distance in miles
 */
function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ============================================================================
// MAIN QUERY FUNCTION
// ============================================================================

/**
 * Find optimal destinations for a given product spec.
 * Queries facilities DB + refinery profiles + pipeline specs.
 */
export async function findOptimalDestinations(
  spec: ProductSpec,
  options: {
    maxResults?: number;
    regionFilter?: string; // 'US', 'GLOBAL', specific country code
    facilityTypes?: string[]; // ['REFINERY', 'TERMINAL', 'RACK']
    transportModes?: string[]; // filter by connectivity
    originLat?: number;
    originLng?: number;
  } = {}
): Promise<DestinationIntelligenceResult> {
  const maxResults = options.maxResults || 25;
  const crudeType = classifyCrude(spec);

  const destinations: DestinationMatch[] = [];

  // ── 1. Score refineries from static profiles ──
  for (const [name, slate] of Object.entries(REFINERY_CRUDE_SLATES)) {
    const { score, reasons, warnings } = scoreRefineryCompatibility(spec, slate);
    if (score >= 30) {
      destinations.push({
        facilityId: 0,
        facilityName: name,
        facilityType: 'REFINERY',
        operator: name.split(' ')[0],
        location: { city: '', state: '', country: 'US', lat: 0, lng: 0 },
        compatibilityScore: score,
        matchReasons: reasons,
        warnings,
        accessModes: Object.entries({
          pipeline: true, tanker: true, barge: true, truck: true, rail: true
        }).filter(([, v]) => v).map(([k]) => k),
        capacityBpd: 0,
        storageBbl: 0,
        products: slate.preferredTypes,
      });
    }
  }

  // ── 2. Query facilities DB for terminals/refineries ──
  try {
    const db = await getDb();
    if (db) {
      const typeFilter = options.facilityTypes || ['REFINERY', 'TERMINAL', 'RACK', 'TRANSLOAD'];
      const rows = await db.select().from(facilities)
        .where(and(
          inArray(facilities.facilityType, typeFilter as any),
          eq(facilities.status, 'OPERATING'),
        ))
        .limit(500);

      for (const f of rows) {
        let score = 40; // base
        const reasons: string[] = [];
        const warnings: string[] = [];
        const fProducts = (f.products as string[]) || [];

        // Check product match
        if (spec.productName && fProducts.some(p => p.toLowerCase().includes(spec.productName.toLowerCase()))) {
          score += 25;
          reasons.push(`Facility handles "${spec.productName}"`);
        } else if (fProducts.length > 0 && spec.category === 'crude') {
          // Check crude type keywords
          const crudeKeywords = ['crude', 'wti', 'wcs', 'brent', 'heavy', 'light', 'sweet', 'sour'];
          if (fProducts.some(p => crudeKeywords.some(k => p.toLowerCase().includes(k)))) {
            score += 15;
            reasons.push('Facility handles crude oil products');
          }
        }

        // Refinery bonus
        if (f.facilityType === 'REFINERY' && f.processingCapacityBpd) {
          score += 10;
          reasons.push(`Refinery with ${f.processingCapacityBpd?.toLocaleString()} BPD capacity`);
        }

        // Connectivity scoring
        const modes: string[] = [];
        if (f.receivesPipeline) { modes.push('pipeline'); score += 3; }
        if (f.receivesTanker) { modes.push('tanker'); score += 3; }
        if (f.receivesBarge) { modes.push('barge'); score += 2; }
        if (f.receivesTruck) { modes.push('truck'); score += 1; }
        if (f.receivesRail) { modes.push('rail'); score += 2; }

        // Capacity bonus
        if (f.storageCapacityBbl && f.storageCapacityBbl > 1000000) {
          score += 5;
          reasons.push(`${(f.storageCapacityBbl / 1000000).toFixed(1)}M bbl storage`);
        }

        // Hazmat compatibility
        if (spec.hazmatClass && f.hazmatClasses) {
          const hClasses = f.hazmatClasses as string[];
          if (hClasses.includes(spec.hazmatClass)) {
            score += 5;
            reasons.push(`Handles hazmat class ${spec.hazmatClass}`);
          }
        }

        // Distance scoring if origin provided
        if (options.originLat && options.originLng && f.latitude && f.longitude) {
          const dist = distanceMiles(options.originLat, options.originLng, parseFloat(String(f.latitude)), parseFloat(String(f.longitude)));
          if (dist < 100) { score += 10; reasons.push(`${Math.round(dist)} miles from origin`); }
          else if (dist < 300) { score += 5; reasons.push(`${Math.round(dist)} miles from origin`); }
        }

        if (score >= 35) {
          destinations.push({
            facilityId: f.id,
            facilityName: f.facilityName,
            facilityType: f.facilityType,
            operator: f.operatorName || f.ownerName || '',
            location: {
              city: f.city || '',
              state: f.state,
              country: 'US',
              lat: parseFloat(String(f.latitude)),
              lng: parseFloat(String(f.longitude)),
            },
            compatibilityScore: Math.min(100, score),
            matchReasons: reasons,
            warnings,
            accessModes: modes,
            capacityBpd: f.processingCapacityBpd || undefined,
            storageBbl: f.storageCapacityBbl || undefined,
            products: fProducts.length > 0 ? fProducts : undefined,
          });
        }
      }
    }
  } catch (e) {
    logger.error('[SpectraDestination] Facility query error:', e);
  }

  // ── 3. Query ports for vessel delivery destinations ──
  try {
    const db = await getDb();
    if (db && spec.category === 'crude') {
      const portRows = await db.select().from(ports)
        .where(eq(ports.isActive, true))
        .limit(200);

      for (const p of portRows) {
        const coords = p.coordinates as any;
        if (!coords?.lat || !coords?.lng) continue;

        let score = 30;
        const reasons: string[] = [];

        // Port type scoring
        if (p.portType === 'container_terminal' && spec.category === 'crude') continue; // skip container-only
        if (p.containerCapacityTEU && p.containerCapacityTEU > 0) score += 3;
        if (p.totalBerths && p.totalBerths > 5) { score += 5; reasons.push(`${p.totalBerths} berths available`); }
        if (p.maxDraft && parseFloat(String(p.maxDraft)) > 15) { score += 5; reasons.push(`${p.maxDraft}m draft — VLCC capable`); }
        if (p.hasRailAccess) { score += 5; reasons.push('Rail access for intermodal transfer'); }

        reasons.push(`Port: ${p.name} (${p.unlocode})`);

        if (score >= 30) {
          destinations.push({
            facilityId: p.id,
            facilityName: p.name,
            facilityType: 'PORT',
            operator: p.operatingAuthority || '',
            location: {
              city: p.city || '',
              state: p.state || '',
              country: p.country,
              lat: coords.lat,
              lng: coords.lng,
            },
            compatibilityScore: Math.min(100, score),
            matchReasons: reasons,
            warnings: [],
            accessModes: ['vessel', ...(p.hasRailAccess ? ['rail'] : [])],
            nearestPort: { name: p.name, unlocode: p.unlocode, distanceMiles: 0 },
          });
        }
      }
    }
  } catch (e) {
    logger.error('[SpectraDestination] Port query error:', e);
  }

  // ── 4. Sort by compatibility score ──
  destinations.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  const topDestinations = destinations.slice(0, maxResults);

  // ── 5. Group by region ──
  const byRegion: Record<string, DestinationMatch[]> = {};
  for (const d of topDestinations) {
    const region = d.location.country === 'US' ? `US-${d.location.state || 'Unknown'}` : d.location.country;
    if (!byRegion[region]) byRegion[region] = [];
    byRegion[region].push(d);
  }

  // ── 6. Blending insights ──
  const blendingInsights: BlendingInsight[] = [];
  for (const pair of BLENDING_PAIRS) {
    if (spec.productName) {
      if (pair.heavy.toLowerCase().includes(spec.productName.toLowerCase()) ||
          pair.light.toLowerCase().includes(spec.productName.toLowerCase())) {
        blendingInsights.push({
          targetProduct: `${pair.heavy} + ${pair.light}`,
          blendWith: pair.heavy.toLowerCase().includes(spec.productName.toLowerCase()) ? pair.light : pair.heavy,
          rationale: pair.rationale,
          targetAPI: pair.targetAPI,
          targetSulfur: pair.targetSulfur,
          facilities: pair.facilities,
        });
      }
    }
    // Also match by spec characteristics
    if (spec.apiGravity && spec.apiGravity < 22 && crudeType.includes('heavy')) {
      if (!blendingInsights.some(b => b.blendWith === pair.light) && pair.heavy.toLowerCase().includes('heavy')) {
        blendingInsights.push({
          targetProduct: `Your product + ${pair.light}`,
          blendWith: pair.light,
          rationale: `Heavy crude (${spec.apiGravity}° API) benefits from light blend for transport/processing`,
          targetAPI: pair.targetAPI,
          targetSulfur: pair.targetSulfur,
          facilities: pair.facilities,
        });
      }
    }
  }

  // ── 7. Pipeline routes ──
  const pipelineRoutes: PipelineRoute[] = [];
  for (const [name, pipeline] of Object.entries(PIPELINE_SPECS)) {
    const { compatible, constraints } = scorePipelineCompatibility(spec, pipeline);
    pipelineRoutes.push({
      pipelineName: name,
      origin: pipeline.origin,
      destination: pipeline.destination,
      acceptsProduct: compatible,
      constraints,
      capacityBpd: pipeline.capacityBpd,
    });
  }

  // ── 8. Arbitrage opportunities ──
  const arbitrageOpportunities: ArbitrageOpportunity[] = [];
  if (crudeType === 'light_sweet') {
    arbitrageOpportunities.push({
      fromRegion: 'Permian Basin',
      toRegion: 'USGC Export',
      priceDifferential: 'WTI Midland discount to Brent',
      rationale: 'Light sweet export via Corpus Christi/Houston — Brent premium capture',
      facilities: ['Flint Hills Corpus Christi', 'MODA Ingleside', 'Enterprise ECHO'],
    });
  }
  if (crudeType === 'heavy_sour') {
    arbitrageOpportunities.push({
      fromRegion: 'Canadian Oil Sands',
      toRegion: 'USGC Coking Refineries',
      priceDifferential: 'WCS discount to WTI — $10-20/bbl spread',
      rationale: 'Deep conversion refineries profit from heavy crude discount',
      facilities: ['Motiva Port Arthur', 'Valero Port Arthur', 'Citgo Lake Charles'],
    });
  }

  return {
    product: spec,
    totalMatches: destinations.length,
    topDestinations,
    byRegion,
    blendingInsights: blendingInsights.slice(0, 5),
    pipelineRoutes: pipelineRoutes.filter(p => p.acceptsProduct || p.constraints.length <= 1),
    arbitrageOpportunities,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Cache-wrapped version for tRPC endpoints
 */
export async function getDestinationIntelligence(spec: ProductSpec, options?: Parameters<typeof findOptimalDestinations>[1]): Promise<DestinationIntelligenceResult> {
  const cacheKey = `spectra:dest:${spec.productName || 'unknown'}:${spec.apiGravity || 0}:${spec.sulfurContent || 0}`;
  try {
    return await lsCacheThrough("WARM", cacheKey, async () => {
      return await findOptimalDestinations(spec, options);
    }, 600); // 10min cache
  } catch (e) {
    logger.error('[SpectraDestination] Cache error, computing directly:', e);
    return await findOptimalDestinations(spec, options);
  }
}
