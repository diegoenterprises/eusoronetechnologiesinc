/**
 * WS-T1-005: Embedding-Powered Fraud Detection
 *
 * Adds a SEMANTIC fraud detection layer on top of the existing statistical
 * fraudScorer.ts (Benford's law, Z-score, velocity checks).
 *
 * Uses contrastive embedding analysis to detect:
 *   - Suspiciously similar loads posted by different brokers (clone fraud)
 *   - Rate manipulation via coordinated bidding patterns
 *   - Fake carrier registrations with boilerplate profiles
 *   - Invoice/BOL text anomalies vs. legitimate document patterns
 *
 * Architecture:
 *   1. Embed the entity text (load description, bid details, registration)
 *   2. Compare against known-good and known-fraud embedding clusters
 *   3. Return anomaly score (0-1) based on distance to each cluster
 *   4. Integrate with existing fraudScorer as an additional signal
 *
 * Reference: pplx-embed Contrastive Training (arXiv:2602.11151)
 */

import { logger } from "../../_core/logger";
import { embeddingService, EmbeddingService } from "../embeddings/embeddingService";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EmbeddingFraudResult {
  anomalyScore: number;       // 0.0 (clean) to 1.0 (highly suspicious)
  riskLevel: "NONE" | "LOW" | "MODERATE" | "HIGH";
  signals: EmbeddingFraudSignal[];
  clusterDistances: {
    legitimateAvg: number;    // Average cosine similarity to legitimate cluster
    suspiciousAvg: number;    // Average cosine similarity to suspicious cluster
  };
}

export interface EmbeddingFraudSignal {
  type: string;
  score: number;
  detail: string;
}

// ── Reference Clusters ────────────────────────────────────────────────────────
// These are canonical text patterns representing known-good and known-suspicious
// entities. Embeddings are computed lazily and cached.

const LEGITIMATE_LOAD_PATTERNS = [
  "Crude oil transport from Midland, TX to Corpus Christi, TX. 42000 lbs tanker. Rate $2200. Hazmat class 3.",
  "Petroleum hauling Houston, TX to Port Arthur, TX. 38000 lbs. Equipment: tanker trailer. Rate $1800.",
  "Refrigerated produce from Salinas, CA to Phoenix, AZ. 35000 lbs reefer. Rate $3500. Pickup tomorrow.",
  "Dry van general freight from Chicago, IL to Detroit, MI. 40000 lbs. Rate $1100. Non-hazmat.",
  "Flatbed oversized machinery from Houston, TX to Dallas, TX. 55000 lbs. Requires escort. Rate $4200.",
  "LPG propane delivery from Mont Belvieu, TX to San Antonio, TX. 40000 lbs pressurized tanker. Hazmat class 2.1.",
  "Chemical transport sodium hydroxide from Baton Rouge, LA to Memphis, TN. 38000 lbs. Hazmat class 8. Rate $2800.",
  "Grain bulk transport from Omaha, NE to Kansas City, MO. 44000 lbs hopper. Rate $900.",
];

const SUSPICIOUS_LOAD_PATTERNS = [
  "Easy load great pay fast pickup no questions asked urgent load need driver now top dollar guaranteed.",
  "Premium freight premium rate act fast limited time offer guaranteed settlement same day pay.",
  "Load available rate negotiable any carrier welcome no experience needed sign up now free money.",
  "Urgent shipment need carrier ASAP will pay above market rate no inspection needed cash payment.",
  "Test load dummy shipment placeholder freight fake cargo sample delivery no actual pickup.",
];

const LEGITIMATE_BID_PATTERNS = [
  "Competitive bid based on current lane rates and fuel costs. 3 years experience on this route. Safety rating: Satisfactory.",
  "Standard rate per mile for tanker crude oil transport. DOT certified, hazmat endorsed, clean inspection history.",
  "Bid reflects market conditions, distance, and equipment requirements. Available for pickup within 24 hours.",
];

const SUSPICIOUS_BID_PATTERNS = [
  "Will do it for half the posted rate no questions asked just need the work.",
  "Brand new carrier first load ever but can handle anything you need immediately.",
  "Can undercut any other bid guaranteed lowest price no matter what.",
];

// ── Embedding Cache ───────────────────────────────────────────────────────────

interface ClusterCache {
  legitimate: number[][];
  suspicious: number[][];
  initialized: boolean;
}

const loadCluster: ClusterCache = { legitimate: [], suspicious: [], initialized: false };
const bidCluster: ClusterCache = { legitimate: [], suspicious: [], initialized: false };

async function ensureCluster(
  cluster: ClusterCache,
  legitimateTexts: string[],
  suspiciousTexts: string[],
): Promise<boolean> {
  if (cluster.initialized) return true;

  const healthy = await embeddingService.isHealthy();
  if (!healthy) return false;

  try {
    const [legResults, susResults] = await Promise.all([
      embeddingService.embed(legitimateTexts),
      embeddingService.embed(suspiciousTexts),
    ]);

    cluster.legitimate = legResults.map(r => r.embedding.values);
    cluster.suspicious = susResults.map(r => r.embedding.values);
    cluster.initialized = true;
    return true;
  } catch (err: any) {
    logger.warn("[EmbeddingFraud] Cluster init failed:", err.message);
    return false;
  }
}

// ── Cluster Distance Computation ──────────────────────────────────────────────

function avgSimilarity(queryVec: number[], clusterVecs: number[][]): number {
  if (clusterVecs.length === 0) return 0;
  let total = 0;
  for (const vec of clusterVecs) {
    total += EmbeddingService.cosineSimilarity(queryVec, vec);
  }
  return total / clusterVecs.length;
}

function maxSimilarity(queryVec: number[], clusterVecs: number[][]): number {
  if (clusterVecs.length === 0) return 0;
  let max = -1;
  for (const vec of clusterVecs) {
    const sim = EmbeddingService.cosineSimilarity(queryVec, vec);
    if (sim > max) max = sim;
  }
  return max;
}

function computeAnomalyScore(
  queryVec: number[],
  legitimateVecs: number[][],
  suspiciousVecs: number[][],
): { anomalyScore: number; legitimateAvg: number; suspiciousAvg: number } {
  const legitimateAvg = avgSimilarity(queryVec, legitimateVecs);
  const suspiciousAvg = avgSimilarity(queryVec, suspiciousVecs);
  const suspiciousMax = maxSimilarity(queryVec, suspiciousVecs);

  // Anomaly score: higher when closer to suspicious cluster and farther from legitimate
  // Normalize to 0-1 range
  let anomalyScore = 0;

  if (legitimateAvg + suspiciousAvg > 0) {
    // Ratio-based: how much more similar to suspicious vs legitimate
    anomalyScore = suspiciousAvg / (legitimateAvg + suspiciousAvg);
  }

  // Boost if very close to any known suspicious pattern
  if (suspiciousMax > 0.8) {
    anomalyScore = Math.min(1.0, anomalyScore + 0.2);
  }

  // Penalize if very close to legitimate patterns
  if (legitimateAvg > 0.7) {
    anomalyScore = Math.max(0, anomalyScore - 0.15);
  }

  return {
    anomalyScore: Math.round(anomalyScore * 1000) / 1000,
    legitimateAvg: Math.round(legitimateAvg * 1000) / 1000,
    suspiciousAvg: Math.round(suspiciousAvg * 1000) / 1000,
  };
}

function riskLevel(score: number): EmbeddingFraudResult["riskLevel"] {
  if (score >= 0.7) return "HIGH";
  if (score >= 0.45) return "MODERATE";
  if (score >= 0.25) return "LOW";
  return "NONE";
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Screen a load posting for semantic fraud indicators.
 * Compares load text against known legitimate and suspicious patterns.
 */
export async function screenLoad(loadText: string): Promise<EmbeddingFraudResult> {
  const ready = await ensureCluster(loadCluster, LEGITIMATE_LOAD_PATTERNS, SUSPICIOUS_LOAD_PATTERNS);
  if (!ready) {
    return { anomalyScore: 0, riskLevel: "NONE", signals: [], clusterDistances: { legitimateAvg: 0, suspiciousAvg: 0 } };
  }

  try {
    const vec = await embeddingService.embedOne(loadText);
    const { anomalyScore, legitimateAvg, suspiciousAvg } = computeAnomalyScore(
      vec.values, loadCluster.legitimate, loadCluster.suspicious,
    );

    const signals: EmbeddingFraudSignal[] = [];

    if (suspiciousAvg > 0.5) {
      signals.push({
        type: "SUSPICIOUS_PATTERN",
        score: Math.round(suspiciousAvg * 100),
        detail: "Load description matches known suspicious posting patterns",
      });
    }

    if (legitimateAvg < 0.3) {
      signals.push({
        type: "ATYPICAL_LANGUAGE",
        score: Math.round((1 - legitimateAvg) * 100),
        detail: "Load description uses unusual language compared to typical freight postings",
      });
    }

    // Check for clone fraud signals
    const susMax = maxSimilarity(vec.values, loadCluster.suspicious);
    if (susMax > 0.75) {
      signals.push({
        type: "POTENTIAL_CLONE",
        score: Math.round(susMax * 100),
        detail: "Load closely matches a known fraudulent posting template",
      });
    }

    return {
      anomalyScore,
      riskLevel: riskLevel(anomalyScore),
      signals,
      clusterDistances: { legitimateAvg, suspiciousAvg },
    };
  } catch (err: any) {
    logger.error("[EmbeddingFraud] Load screening error:", err.message);
    return { anomalyScore: 0, riskLevel: "NONE", signals: [], clusterDistances: { legitimateAvg: 0, suspiciousAvg: 0 } };
  }
}

/**
 * Screen a bid submission for semantic fraud indicators.
 */
export async function screenBid(bidText: string): Promise<EmbeddingFraudResult> {
  const ready = await ensureCluster(bidCluster, LEGITIMATE_BID_PATTERNS, SUSPICIOUS_BID_PATTERNS);
  if (!ready) {
    return { anomalyScore: 0, riskLevel: "NONE", signals: [], clusterDistances: { legitimateAvg: 0, suspiciousAvg: 0 } };
  }

  try {
    const vec = await embeddingService.embedOne(bidText);
    const { anomalyScore, legitimateAvg, suspiciousAvg } = computeAnomalyScore(
      vec.values, bidCluster.legitimate, bidCluster.suspicious,
    );

    const signals: EmbeddingFraudSignal[] = [];

    if (suspiciousAvg > 0.5) {
      signals.push({
        type: "SUSPICIOUS_BID_PATTERN",
        score: Math.round(suspiciousAvg * 100),
        detail: "Bid language matches known undercutting/fraud patterns",
      });
    }

    if (legitimateAvg < 0.25) {
      signals.push({
        type: "ATYPICAL_BID_LANGUAGE",
        score: Math.round((1 - legitimateAvg) * 100),
        detail: "Bid uses unusual language compared to typical carrier bids",
      });
    }

    return {
      anomalyScore,
      riskLevel: riskLevel(anomalyScore),
      signals,
      clusterDistances: { legitimateAvg, suspiciousAvg },
    };
  } catch (err: any) {
    logger.error("[EmbeddingFraud] Bid screening error:", err.message);
    return { anomalyScore: 0, riskLevel: "NONE", signals: [], clusterDistances: { legitimateAvg: 0, suspiciousAvg: 0 } };
  }
}

/**
 * Screen a carrier registration for semantic fraud indicators.
 */
export async function screenRegistration(registrationText: string): Promise<EmbeddingFraudResult> {
  // Reuse load clusters as a general indicator for now
  const ready = await ensureCluster(loadCluster, LEGITIMATE_LOAD_PATTERNS, SUSPICIOUS_LOAD_PATTERNS);
  if (!ready) {
    return { anomalyScore: 0, riskLevel: "NONE", signals: [], clusterDistances: { legitimateAvg: 0, suspiciousAvg: 0 } };
  }

  try {
    const vec = await embeddingService.embedOne(registrationText);
    const susAvg = avgSimilarity(vec.values, loadCluster.suspicious);

    const signals: EmbeddingFraudSignal[] = [];
    let anomalyScore = 0;

    // Registration-specific: check for boilerplate/copied text
    if (susAvg > 0.4) {
      anomalyScore = susAvg;
      signals.push({
        type: "BOILERPLATE_REGISTRATION",
        score: Math.round(susAvg * 100),
        detail: "Registration text appears to be copied from a template",
      });
    }

    return {
      anomalyScore: Math.round(anomalyScore * 1000) / 1000,
      riskLevel: riskLevel(anomalyScore),
      signals,
      clusterDistances: { legitimateAvg: 0, suspiciousAvg: Math.round(susAvg * 1000) / 1000 },
    };
  } catch (err: any) {
    logger.error("[EmbeddingFraud] Registration screening error:", err.message);
    return { anomalyScore: 0, riskLevel: "NONE", signals: [], clusterDistances: { legitimateAvg: 0, suspiciousAvg: 0 } };
  }
}

/**
 * Combined fraud score that merges statistical + embedding signals.
 * Call this after getting results from both fraudScorer.ts and this module.
 */
export function combinedFraudScore(
  statisticalScore: number,     // 0-100 from fraudScorer
  embeddingAnomalyScore: number, // 0-1 from this module
): { combinedScore: number; riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" } {
  // Weight: 60% statistical, 40% embedding
  const normalizedStatistical = statisticalScore / 100;
  const combined = normalizedStatistical * 0.6 + embeddingAnomalyScore * 0.4;
  const score = Math.round(combined * 100);

  let level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "LOW";
  if (score >= 80) level = "CRITICAL";
  else if (score >= 60) level = "HIGH";
  else if (score >= 35) level = "MODERATE";

  return { combinedScore: score, riskLevel: level };
}

/**
 * Reset cached clusters (for testing).
 */
export function resetClusters(): void {
  loadCluster.initialized = false;
  loadCluster.legitimate = [];
  loadCluster.suspicious = [];
  bidCluster.initialized = false;
  bidCluster.legitimate = [];
  bidCluster.suspicious = [];
}
