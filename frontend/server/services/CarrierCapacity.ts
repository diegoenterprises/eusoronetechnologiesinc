/**
 * CARRIER CAPACITY CALENDAR & FIND SIMILAR CARRIERS AI (GAP-063 Task 6.2)
 *
 * 1. Capacity Calendar: Carriers declare weekly/daily capacity slots.
 *    Shippers/brokers can search for available carriers on specific dates.
 *
 * 2. Find Similar Carriers: Given a reference carrier, uses multi-dimensional
 *    scoring to find carriers with similar:
 *    - Lane coverage (origin/dest states)
 *    - Equipment types
 *    - Rate ranges
 *    - Safety/compliance profile
 *    - Fleet size
 *    - Hazmat authorization
 *    - Cargo specializations
 */

// ── Capacity Calendar Types ──

export interface CapacitySlot {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  availableTrucks: number;
  equipmentTypes: string[];
  preferredLanes: string[]; // "TX→LA", "CA→AZ"
  maxWeight: number;
  hazmatAvailable: boolean;
  notes: string;
  status: "available" | "partial" | "booked" | "unavailable";
}

export interface WeeklyCapacity {
  weekStart: string; // Monday YYYY-MM-DD
  weekEnd: string;
  totalAvailableTruckDays: number;
  slots: CapacitySlot[];
  summary: {
    availableDays: number;
    partialDays: number;
    bookedDays: number;
    unavailableDays: number;
  };
}

export interface CapacitySearchParams {
  dateFrom: string;
  dateTo: string;
  originState?: string;
  destState?: string;
  equipmentType?: string;
  minTrucks?: number;
  hazmatRequired?: boolean;
  minWeight?: number;
}

export interface CapacitySearchResult {
  carrierId: number;
  companyName: string;
  dotNumber: string | null;
  matchScore: number; // 0-100
  availableSlots: CapacitySlot[];
  totalAvailableTrucks: number;
  equipmentTypes: string[];
  hazmatAuthorized: boolean;
  avgRate: number;
  onTimeRate: number;
  tier: string;
}

// ── Similar Carrier Types ──

export interface CarrierProfile {
  carrierId: number;
  companyName: string;
  dotNumber: string | null;
  mcNumber: string | null;
  fleetSize: number;
  driverCount: number;
  totalLoads: number;
  onTimeRate: number;
  safetyScore: number;
  avgRate: number;
  avgRatePerMile: number;
  hazmatAuthorized: boolean;
  equipmentTypes: string[];
  topLanes: { lane: string; count: number }[];
  operatingStates: string[];
  cargoSpecializations: string[];
  tier: string;
  complianceStatus: string;
  tenureMonths: number;
}

export interface SimilarCarrierResult {
  carrier: CarrierProfile;
  similarityScore: number; // 0-100
  matchDimensions: {
    dimension: string;
    score: number;
    detail: string;
  }[];
  advantages: string[];
  tradeoffs: string[];
}

// ── Capacity Generation (from carrier load history) ──

export function generateCapacityCalendar(
  carrierId: number,
  companyName: string,
  fleetSize: number,
  equipmentTypes: string[],
  hazmatAuth: boolean,
  existingLoads: { pickupDate: string; deliveryDate: string; status: string }[],
  startDate: string,
  weeks: number = 4,
): WeeklyCapacity[] {
  const result: WeeklyCapacity[] = [];
  const start = new Date(startDate);
  // Align to Monday
  const dayOfWeek = start.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  start.setDate(start.getDate() + mondayOffset);

  for (let w = 0; w < weeks; w++) {
    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() + w * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const slots: CapacitySlot[] = [];
    let availableDays = 0, partialDays = 0, bookedDays = 0, unavailableDays = 0;
    let totalTruckDays = 0;

    for (let d = 0; d < 7; d++) {
      const slotDate = new Date(weekStart);
      slotDate.setDate(slotDate.getDate() + d);
      const dateStr = slotDate.toISOString().split("T")[0];
      const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][slotDate.getDay()];

      // Count loads active on this date
      const activeLoads = existingLoads.filter(l => {
        const pickup = new Date(l.pickupDate);
        const delivery = new Date(l.deliveryDate);
        return slotDate >= pickup && slotDate <= delivery && l.status !== "cancelled";
      }).length;

      // Weekend: reduced capacity
      const isWeekend = slotDate.getDay() === 0 || slotDate.getDay() === 6;
      const baseCapacity = isWeekend ? Math.ceil(fleetSize * 0.3) : fleetSize;
      const available = Math.max(0, baseCapacity - activeLoads);

      let status: CapacitySlot["status"] = "available";
      if (available === 0) { status = "booked"; bookedDays++; }
      else if (available < baseCapacity * 0.5) { status = "partial"; partialDays++; }
      else if (isWeekend && fleetSize > 0) { status = "partial"; partialDays++; }
      else { availableDays++; }

      if (fleetSize === 0) { status = "unavailable"; unavailableDays++; }

      totalTruckDays += available;

      slots.push({
        date: dateStr,
        dayOfWeek: dayName,
        availableTrucks: available,
        equipmentTypes,
        preferredLanes: [],
        maxWeight: 80000,
        hazmatAvailable: hazmatAuth && available > 0,
        notes: isWeekend ? "Weekend — reduced capacity" : "",
        status,
      });
    }

    result.push({
      weekStart: weekStart.toISOString().split("T")[0],
      weekEnd: weekEnd.toISOString().split("T")[0],
      totalAvailableTruckDays: totalTruckDays,
      slots,
      summary: { availableDays, partialDays, bookedDays, unavailableDays },
    });
  }

  return result;
}

// ── Find Similar Carriers AI ──

const SIMILARITY_WEIGHTS = {
  laneOverlap: 0.25,
  equipmentMatch: 0.15,
  rateRange: 0.12,
  fleetSize: 0.10,
  safetyScore: 0.10,
  onTimeRate: 0.08,
  hazmatMatch: 0.05,
  cargoSpecialization: 0.08,
  tierMatch: 0.04,
  tenureMatch: 0.03,
};

function laneOverlapScore(lanes1: string[], lanes2: string[]): number {
  if (lanes1.length === 0 && lanes2.length === 0) return 50;
  if (lanes1.length === 0 || lanes2.length === 0) return 0;
  const set1 = new Set(lanes1);
  const intersection = lanes2.filter(l => set1.has(l)).length;
  const union = new Set([...lanes1, ...lanes2]).size;
  return Math.round((intersection / union) * 100);
}

function equipmentMatchScore(eq1: string[], eq2: string[]): number {
  if (eq1.length === 0 && eq2.length === 0) return 50;
  if (eq1.length === 0 || eq2.length === 0) return 0;
  const set1 = new Set(eq1.map(e => e.toLowerCase()));
  const matches = eq2.filter(e => set1.has(e.toLowerCase())).length;
  return Math.round((matches / Math.max(eq1.length, eq2.length)) * 100);
}

function rateRangeScore(rate1: number, rate2: number): number {
  if (rate1 === 0 || rate2 === 0) return 50;
  const diff = Math.abs(rate1 - rate2);
  const avg = (rate1 + rate2) / 2;
  const pctDiff = avg > 0 ? diff / avg : 0;
  return Math.max(0, Math.round(100 - pctDiff * 200));
}

function numericProximityScore(val1: number, val2: number, maxDiff: number): number {
  const diff = Math.abs(val1 - val2);
  return Math.max(0, Math.round(100 - (diff / maxDiff) * 100));
}

function tierProximityScore(tier1: string, tier2: string): number {
  const order: Record<string, number> = { gold: 4, silver: 3, bronze: 2, standard: 1 };
  const diff = Math.abs((order[tier1] || 1) - (order[tier2] || 1));
  return diff === 0 ? 100 : diff === 1 ? 70 : diff === 2 ? 40 : 10;
}

export function findSimilarCarriers(
  reference: CarrierProfile,
  candidates: CarrierProfile[],
  topK: number = 10,
): SimilarCarrierResult[] {
  const results: SimilarCarrierResult[] = [];

  for (const candidate of candidates) {
    if (candidate.carrierId === reference.carrierId) continue;

    const refLanes = reference.topLanes.map(l => l.lane);
    const candLanes = candidate.topLanes.map(l => l.lane);

    const dimensions: SimilarCarrierResult["matchDimensions"] = [];
    let totalScore = 0;

    // Lane overlap
    const laneScore = laneOverlapScore(refLanes, candLanes);
    dimensions.push({ dimension: "Lane Coverage", score: laneScore, detail: `${candLanes.length} lanes, ${refLanes.filter(l => candLanes.includes(l)).length} shared` });
    totalScore += laneScore * SIMILARITY_WEIGHTS.laneOverlap;

    // Equipment match
    const eqScore = equipmentMatchScore(reference.equipmentTypes, candidate.equipmentTypes);
    dimensions.push({ dimension: "Equipment", score: eqScore, detail: candidate.equipmentTypes.join(", ") || "Unknown" });
    totalScore += eqScore * SIMILARITY_WEIGHTS.equipmentMatch;

    // Rate range
    const rateScore = rateRangeScore(reference.avgRatePerMile, candidate.avgRatePerMile);
    dimensions.push({ dimension: "Rate Range", score: rateScore, detail: `$${candidate.avgRatePerMile.toFixed(2)}/mi` });
    totalScore += rateScore * SIMILARITY_WEIGHTS.rateRange;

    // Fleet size
    const fleetScore = numericProximityScore(reference.fleetSize, candidate.fleetSize, 50);
    dimensions.push({ dimension: "Fleet Size", score: fleetScore, detail: `${candidate.fleetSize} units` });
    totalScore += fleetScore * SIMILARITY_WEIGHTS.fleetSize;

    // Safety
    const safetyScoreVal = numericProximityScore(reference.safetyScore, candidate.safetyScore, 50);
    dimensions.push({ dimension: "Safety", score: safetyScoreVal, detail: `Score: ${candidate.safetyScore}` });
    totalScore += safetyScoreVal * SIMILARITY_WEIGHTS.safetyScore;

    // On-time
    const otScore = numericProximityScore(reference.onTimeRate, candidate.onTimeRate, 30);
    dimensions.push({ dimension: "On-Time Rate", score: otScore, detail: `${candidate.onTimeRate}%` });
    totalScore += otScore * SIMILARITY_WEIGHTS.onTimeRate;

    // Hazmat
    const hmScore = reference.hazmatAuthorized === candidate.hazmatAuthorized ? 100 : 0;
    dimensions.push({ dimension: "Hazmat", score: hmScore, detail: candidate.hazmatAuthorized ? "Authorized" : "Not authorized" });
    totalScore += hmScore * SIMILARITY_WEIGHTS.hazmatMatch;

    // Cargo specialization
    const cargoScore = laneOverlapScore(reference.cargoSpecializations, candidate.cargoSpecializations);
    dimensions.push({ dimension: "Cargo Specialization", score: cargoScore, detail: candidate.cargoSpecializations.join(", ") || "General" });
    totalScore += cargoScore * SIMILARITY_WEIGHTS.cargoSpecialization;

    // Tier
    const tScore = tierProximityScore(reference.tier, candidate.tier);
    dimensions.push({ dimension: "Tier", score: tScore, detail: candidate.tier });
    totalScore += tScore * SIMILARITY_WEIGHTS.tierMatch;

    // Tenure
    const tenScore = numericProximityScore(reference.tenureMonths, candidate.tenureMonths, 60);
    dimensions.push({ dimension: "Tenure", score: tenScore, detail: `${candidate.tenureMonths} months` });
    totalScore += tenScore * SIMILARITY_WEIGHTS.tenureMatch;

    const similarityScore = Math.round(totalScore);

    // Generate advantages and tradeoffs
    const advantages: string[] = [];
    const tradeoffs: string[] = [];

    if (candidate.onTimeRate > reference.onTimeRate + 5) advantages.push(`Higher on-time rate (${candidate.onTimeRate}% vs ${reference.onTimeRate}%)`);
    if (candidate.safetyScore > reference.safetyScore + 5) advantages.push(`Better safety score (${candidate.safetyScore} vs ${reference.safetyScore})`);
    if (candidate.avgRatePerMile < reference.avgRatePerMile * 0.9) advantages.push(`Lower rate ($${candidate.avgRatePerMile.toFixed(2)}/mi vs $${reference.avgRatePerMile.toFixed(2)}/mi)`);
    if (candidate.fleetSize > reference.fleetSize * 1.5) advantages.push(`Larger fleet (${candidate.fleetSize} vs ${reference.fleetSize} units)`);
    if (candidate.hazmatAuthorized && !reference.hazmatAuthorized) advantages.push("Hazmat authorized");

    if (candidate.onTimeRate < reference.onTimeRate - 5) tradeoffs.push(`Lower on-time rate (${candidate.onTimeRate}%)`);
    if (candidate.safetyScore < reference.safetyScore - 10) tradeoffs.push(`Lower safety score (${candidate.safetyScore})`);
    if (candidate.avgRatePerMile > reference.avgRatePerMile * 1.1) tradeoffs.push(`Higher rate ($${candidate.avgRatePerMile.toFixed(2)}/mi)`);
    if (candidate.totalLoads < 5) tradeoffs.push(`Limited load history (${candidate.totalLoads} loads)`);

    results.push({ carrier: candidate, similarityScore, matchDimensions: dimensions, advantages, tradeoffs });
  }

  return results
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, topK);
}
