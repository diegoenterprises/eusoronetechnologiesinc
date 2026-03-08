/**
 * CARRIER TIER SYSTEM (GAP-063)
 * Gold / Silver / Bronze tier classification for carriers based on:
 * - Scorecard performance (on-time, safety, compliance, completion)
 * - Review ratings & volume
 * - FMCSA risk profile
 * - Load history & tenure
 *
 * Tiers grant benefits: priority matching, reduced platform fees,
 * badge visibility, enhanced analytics, and preferred load access.
 */

// ── Tier Definitions ──

export interface TierDefinition {
  id: "gold" | "silver" | "bronze" | "standard";
  name: string;
  icon: string;
  color: string;
  minScore: number;
  maxScore: number;
  benefits: string[];
  platformFeeDiscount: number; // percentage discount
  priorityMatchBoost: number; // 0-100 boost in auto-dispatch scoring
  badgeVisible: boolean;
  analyticsAccess: "basic" | "standard" | "advanced" | "premium";
  loadAccessTier: "all" | "preferred" | "premium" | "exclusive";
}

export const TIER_DEFINITIONS: Record<string, TierDefinition> = {
  gold: {
    id: "gold",
    name: "Gold Partner",
    icon: "crown",
    color: "#FFD700",
    minScore: 85,
    maxScore: 100,
    benefits: [
      "15% platform fee discount",
      "Priority load matching (+30 dispatch score)",
      "Gold badge on profile & bids",
      "Premium analytics dashboard access",
      "Exclusive high-value load access",
      "Dedicated account manager",
      "Priority payment processing (Net-7)",
      "Featured in carrier directory",
      "Priority bid visibility to shippers",
      "Free quarterly compliance audit",
    ],
    platformFeeDiscount: 15,
    priorityMatchBoost: 30,
    badgeVisible: true,
    analyticsAccess: "premium",
    loadAccessTier: "exclusive",
  },
  silver: {
    id: "silver",
    name: "Silver Partner",
    icon: "award",
    color: "#C0C0C0",
    minScore: 70,
    maxScore: 84,
    benefits: [
      "10% platform fee discount",
      "Enhanced load matching (+20 dispatch score)",
      "Silver badge on profile & bids",
      "Advanced analytics dashboard access",
      "Preferred load access",
      "Priority payment processing (Net-15)",
      "Carrier directory listing",
      "Priority bid visibility",
    ],
    platformFeeDiscount: 10,
    priorityMatchBoost: 20,
    badgeVisible: true,
    analyticsAccess: "advanced",
    loadAccessTier: "preferred",
  },
  bronze: {
    id: "bronze",
    name: "Bronze Partner",
    icon: "medal",
    color: "#CD7F32",
    minScore: 55,
    maxScore: 69,
    benefits: [
      "5% platform fee discount",
      "Standard load matching (+10 dispatch score)",
      "Bronze badge on profile",
      "Standard analytics access",
      "All load access",
      "Standard payment processing (Net-30)",
    ],
    platformFeeDiscount: 5,
    priorityMatchBoost: 10,
    badgeVisible: true,
    analyticsAccess: "standard",
    loadAccessTier: "all",
  },
  standard: {
    id: "standard",
    name: "Standard Carrier",
    icon: "truck",
    color: "#64748B",
    minScore: 0,
    maxScore: 54,
    benefits: [
      "No platform fee discount",
      "Base load matching",
      "Basic analytics access",
      "All load access",
      "Standard payment processing (Net-30)",
    ],
    platformFeeDiscount: 0,
    priorityMatchBoost: 0,
    badgeVisible: false,
    analyticsAccess: "basic",
    loadAccessTier: "all",
  },
};

// ── Scoring Weights ──

interface ScoringWeights {
  scorecardOverall: number;
  onTimeDelivery: number;
  safetyScore: number;
  complianceScore: number;
  completionRate: number;
  reviewRating: number;
  reviewVolume: number;
  fmcsaRisk: number;
  tenure: number;
  loadVolume: number;
}

const SCORING_WEIGHTS: ScoringWeights = {
  scorecardOverall: 0.25,
  onTimeDelivery: 0.15,
  safetyScore: 0.15,
  complianceScore: 0.10,
  completionRate: 0.08,
  reviewRating: 0.10,
  reviewVolume: 0.02,
  fmcsaRisk: 0.08,
  tenure: 0.04,
  loadVolume: 0.03,
};

// ── Input Data for Tier Calculation ──

export interface CarrierTierInput {
  carrierId: number;
  scorecardOverall: number; // 0-100
  onTimeRate: number; // 0-100
  safetyScore: number; // 0-100
  complianceScore: number; // 0-100
  completionRate: number; // 0-100
  avgReviewRating: number; // 0-5
  reviewCount: number;
  fmcsaRiskTier: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "UNKNOWN";
  fmcsaRiskScore: number; // 0-100 (higher = riskier)
  tenureMonths: number;
  totalLoads: number;
  recentLoads90d: number;
}

// ── Result ──

export interface CarrierTierResult {
  carrierId: number;
  tier: "gold" | "silver" | "bronze" | "standard";
  tierDefinition: TierDefinition;
  compositeScore: number; // 0-100
  breakdown: {
    category: string;
    weight: number;
    rawScore: number;
    weightedScore: number;
  }[];
  promotionPath: {
    nextTier: string | null;
    pointsNeeded: number;
    suggestions: string[];
  } | null;
  flags: string[];
  lastCalculated: string;
}

// ── Core Scoring Functions ──

function normalizeReviewRating(rating: number): number {
  // 0-5 → 0-100
  return Math.min(100, Math.round((rating / 5) * 100));
}

function normalizeReviewVolume(count: number): number {
  // 0-100+ reviews → 0-100 (diminishing returns after 50)
  if (count >= 100) return 100;
  if (count >= 50) return 80 + (count - 50) * 0.4;
  return Math.min(80, count * 1.6);
}

function normalizeFmcsaRisk(riskScore: number): number {
  // Invert: lower FMCSA risk = higher tier score
  return Math.max(0, 100 - riskScore);
}

function normalizeTenure(months: number): number {
  // 0-60+ months → 0-100
  if (months >= 60) return 100;
  if (months >= 36) return 80 + (months - 36) * 0.83;
  if (months >= 12) return 40 + (months - 12) * 1.67;
  return Math.round(months * 3.33);
}

function normalizeLoadVolume(totalLoads: number, recentLoads: number): number {
  // Blend total history + recent activity
  const historyScore = Math.min(60, totalLoads * 0.3);
  const recencyScore = Math.min(40, recentLoads * 2);
  return Math.min(100, Math.round(historyScore + recencyScore));
}

// ── Main Calculation ──

export function calculateCarrierTier(input: CarrierTierInput): CarrierTierResult {
  const breakdown: CarrierTierResult["breakdown"] = [];

  // Calculate each component
  const components: { category: string; weight: number; rawScore: number }[] = [
    { category: "Scorecard Overall", weight: SCORING_WEIGHTS.scorecardOverall, rawScore: input.scorecardOverall },
    { category: "On-Time Delivery", weight: SCORING_WEIGHTS.onTimeDelivery, rawScore: input.onTimeRate },
    { category: "Safety Score", weight: SCORING_WEIGHTS.safetyScore, rawScore: input.safetyScore },
    { category: "Compliance", weight: SCORING_WEIGHTS.complianceScore, rawScore: input.complianceScore },
    { category: "Completion Rate", weight: SCORING_WEIGHTS.completionRate, rawScore: input.completionRate },
    { category: "Review Rating", weight: SCORING_WEIGHTS.reviewRating, rawScore: normalizeReviewRating(input.avgReviewRating) },
    { category: "Review Volume", weight: SCORING_WEIGHTS.reviewVolume, rawScore: normalizeReviewVolume(input.reviewCount) },
    { category: "FMCSA Profile", weight: SCORING_WEIGHTS.fmcsaRisk, rawScore: normalizeFmcsaRisk(input.fmcsaRiskScore) },
    { category: "Tenure", weight: SCORING_WEIGHTS.tenure, rawScore: normalizeTenure(input.tenureMonths) },
    { category: "Load Volume", weight: SCORING_WEIGHTS.loadVolume, rawScore: normalizeLoadVolume(input.totalLoads, input.recentLoads90d) },
  ];

  let compositeScore = 0;
  for (const comp of components) {
    const weightedScore = Math.round(comp.rawScore * comp.weight * 100) / 100;
    compositeScore += weightedScore;
    breakdown.push({
      category: comp.category,
      weight: comp.weight,
      rawScore: comp.rawScore,
      weightedScore,
    });
  }
  compositeScore = Math.round(Math.min(100, compositeScore));

  // ── Hard Flags (can block tier promotion) ──
  const flags: string[] = [];
  if (input.fmcsaRiskTier === "CRITICAL") {
    flags.push("FMCSA CRITICAL risk — tier capped at Standard");
    compositeScore = Math.min(compositeScore, 40);
  }
  if (input.fmcsaRiskTier === "HIGH") {
    flags.push("FMCSA HIGH risk — tier capped at Bronze");
    compositeScore = Math.min(compositeScore, 60);
  }
  if (input.safetyScore < 40) {
    flags.push("Safety score below threshold — tier capped at Bronze");
    compositeScore = Math.min(compositeScore, 65);
  }
  if (input.complianceScore < 50) {
    flags.push("Insurance compliance issue — review required for promotion");
  }
  if (input.totalLoads < 5) {
    flags.push("Insufficient load history — minimum 5 loads for Bronze");
    compositeScore = Math.min(compositeScore, 50);
  }

  // ── Determine Tier ──
  let tier: CarrierTierResult["tier"] = "standard";
  if (compositeScore >= TIER_DEFINITIONS.gold.minScore) tier = "gold";
  else if (compositeScore >= TIER_DEFINITIONS.silver.minScore) tier = "silver";
  else if (compositeScore >= TIER_DEFINITIONS.bronze.minScore) tier = "bronze";

  const tierDefinition = TIER_DEFINITIONS[tier];

  // ── Promotion Path ──
  let promotionPath: CarrierTierResult["promotionPath"] = null;
  if (tier !== "gold") {
    const nextTierMap: Record<string, string> = { standard: "bronze", bronze: "silver", silver: "gold" };
    const nextTierKey = nextTierMap[tier];
    const nextTierDef = TIER_DEFINITIONS[nextTierKey];
    const pointsNeeded = Math.max(0, nextTierDef.minScore - compositeScore);

    const suggestions: string[] = [];
    // Find lowest-scoring categories for improvement suggestions
    const sortedByScore = [...breakdown].sort((a, b) => a.rawScore - b.rawScore);
    for (const comp of sortedByScore.slice(0, 3)) {
      if (comp.rawScore < 80) {
        const impactPerPoint = comp.weight;
        const pointsAvailable = Math.round((100 - comp.rawScore) * impactPerPoint);
        if (pointsAvailable >= 1) {
          suggestions.push(`Improve ${comp.category} (currently ${comp.rawScore}%) — up to +${pointsAvailable} tier points available`);
        }
      }
    }
    if (input.reviewCount < 25) {
      suggestions.push(`Increase review volume (${input.reviewCount} reviews) — request feedback from shippers`);
    }
    if (input.totalLoads < 20) {
      suggestions.push(`Build load history (${input.totalLoads} total) — consistent activity improves tier`);
    }

    promotionPath = { nextTier: nextTierDef.name, pointsNeeded, suggestions };
  }

  return {
    carrierId: input.carrierId,
    tier,
    tierDefinition,
    compositeScore,
    breakdown,
    promotionPath,
    flags,
    lastCalculated: new Date().toISOString(),
  };
}

// ── Get All Tier Definitions ──

export function getAllTierDefinitions(): TierDefinition[] {
  return Object.values(TIER_DEFINITIONS).sort((a, b) => b.minScore - a.minScore);
}

// ── Tier Comparison ──

export function compareTiers(tier1: string, tier2: string): number {
  const order: Record<string, number> = { gold: 4, silver: 3, bronze: 2, standard: 1 };
  return (order[tier1] || 0) - (order[tier2] || 0);
}

// ── Check if carrier qualifies for tier-specific benefits ──

export function getTierBenefits(tier: string): TierDefinition["benefits"] {
  return TIER_DEFINITIONS[tier]?.benefits || TIER_DEFINITIONS.standard.benefits;
}

export function getTierFeeDiscount(tier: string): number {
  return TIER_DEFINITIONS[tier]?.platformFeeDiscount || 0;
}

export function getTierDispatchBoost(tier: string): number {
  return TIER_DEFINITIONS[tier]?.priorityMatchBoost || 0;
}
