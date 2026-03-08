/**
 * DRIVER FATIGUE PREDICTION DATA PIPELINE
 * ═══════════════════════════════════════════════════════════════
 *
 * Multi-factor fatigue risk scoring for drivers based on:
 *   1. HOS (Hours of Service) data — driving hours, on-duty hours, break compliance
 *   2. Trip characteristics — distance, night driving, weather severity
 *   3. Historical patterns — past violations, incident history
 *   4. Hazmat multiplier — from hazmatRulesEngine
 *   5. Circadian rhythm — time-of-day risk factor
 *
 * Output:
 *   - Fatigue risk score (0-100)
 *   - Risk level: LOW / MODERATE / HIGH / CRITICAL
 *   - Recommended action (continue, take break, mandatory rest)
 *   - Estimated safe driving hours remaining
 *
 * Compliance basis: FMCSA HOS rules (49 CFR Part 395)
 *   - 11-hour driving limit
 *   - 14-hour on-duty window
 *   - 30-minute break required after 8 hours driving
 *   - 10-hour off-duty required
 *   - 60/70-hour weekly limit
 *
 * Phase 1: Rule-based scoring. Phase 2: ML model integration.
 */

import { getHazmatFatigueMultiplier } from "../compliance/hazmatRulesEngine";

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export interface FatigueInput {
  driverId: string;
  currentDrivingHours: number;    // Hours driven in current shift
  currentOnDutyHours: number;     // Total on-duty hours in current shift
  hoursSinceLastBreak: number;    // Hours since last 30-min break
  hoursSinceLastRest: number;     // Hours since last 10-hr off-duty
  weeklyDrivingHours: number;     // Driving hours in 7-day or 8-day period
  weeklyOnDutyHours: number;      // On-duty hours in 7-day or 8-day period
  useEightDayRule: boolean;       // true = 70-hour/8-day, false = 60-hour/7-day
  isNightDriving: boolean;        // Currently between 12am-6am
  tripDistanceMiles: number;      // Current trip distance
  weatherSeverity: number;        // 0 = clear, 1 = rain, 2 = heavy rain, 3 = ice/snow
  hazmatClass: string | null;     // Hazard class if hauling hazmat
  incidentCount90Days: number;    // Incidents in last 90 days
  violationCount12Months: number; // HOS violations in last 12 months
  currentHour: number;            // Current hour (0-23) for circadian factor
  consecutiveDaysWorked: number;  // Days worked without a 34-hr restart
}

export interface FatigueResult {
  score: number;             // 0-100 (higher = more fatigued)
  level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  recommendation: FatigueRecommendation;
  safeDrivingHoursRemaining: number;
  onDutyHoursRemaining: number;
  weeklyHoursRemaining: number;
  breakDueIn: number | null; // Hours until mandatory 30-min break, null if not needed
  factors: FatigueFactor[];
  hosCompliance: HOSCompliance;
}

export interface FatigueRecommendation {
  action: "CONTINUE" | "TAKE_BREAK" | "PLAN_REST" | "MANDATORY_REST" | "OUT_OF_HOURS";
  message: string;
  urgency: "info" | "warning" | "danger";
}

export interface FatigueFactor {
  name: string;
  weight: number;    // 0-1 contribution
  score: number;     // 0-100 for this factor
  description: string;
}

export interface HOSCompliance {
  drivingLimitHours: number;        // 11
  onDutyWindowHours: number;        // 14
  weeklyLimitHours: number;         // 60 or 70
  breakRequiredAfterHours: number;  // 8
  drivingUsed: number;
  onDutyUsed: number;
  weeklyUsed: number;
  isInViolation: boolean;
  violations: string[];
}

// ═══════════════════════════════════════════════════════════════════════
// HOS LIMITS (49 CFR Part 395)
// ═══════════════════════════════════════════════════════════════════════

const HOS = {
  DRIVING_LIMIT: 11,
  ON_DUTY_WINDOW: 14,
  BREAK_AFTER: 8,
  OFF_DUTY_REQUIRED: 10,
  WEEKLY_7DAY: 60,
  WEEKLY_8DAY: 70,
  RESTART_HOURS: 34,
};

// ═══════════════════════════════════════════════════════════════════════
// CIRCADIAN RHYTHM RISK FACTOR
// Higher risk during natural sleep hours (2am-6am) and afternoon dip (2pm-4pm)
// Based on NTSB fatigue research and FMCSA Naturalistic Driving Study
// ═══════════════════════════════════════════════════════════════════════

const CIRCADIAN_RISK: number[] = [
  // Hour: 0    1     2     3     4     5     6     7     8     9     10    11
       0.7,  0.8,  0.95, 1.0,  0.95, 0.85, 0.6,  0.3,  0.15, 0.1,  0.1,  0.1,
  // Hour: 12   13    14    15    16    17    18    19    20    21    22    23
       0.15, 0.25, 0.4,  0.35, 0.2,  0.15, 0.15, 0.2,  0.3,  0.4,  0.5,  0.6,
];

// ═══════════════════════════════════════════════════════════════════════
// MAIN API: predictFatigue()
// ═══════════════════════════════════════════════════════════════════════

export function predictFatigue(input: FatigueInput): FatigueResult {
  const factors: FatigueFactor[] = [];
  const weeklyLimit = input.useEightDayRule ? HOS.WEEKLY_8DAY : HOS.WEEKLY_7DAY;

  // ─── Factor 1: Driving Hours (35% weight) ──────────────────────
  const drivingRatio = Math.min(input.currentDrivingHours / HOS.DRIVING_LIMIT, 1.0);
  const drivingScore = Math.round(drivingRatio * 100);
  factors.push({
    name: "Driving Hours",
    weight: 0.35,
    score: drivingScore,
    description: `${input.currentDrivingHours.toFixed(1)}h / ${HOS.DRIVING_LIMIT}h limit`,
  });

  // ─── Factor 2: On-Duty Window (15% weight) ────────────────────
  const onDutyRatio = Math.min(input.currentOnDutyHours / HOS.ON_DUTY_WINDOW, 1.0);
  const onDutyScore = Math.round(onDutyRatio * 100);
  factors.push({
    name: "On-Duty Window",
    weight: 0.15,
    score: onDutyScore,
    description: `${input.currentOnDutyHours.toFixed(1)}h / ${HOS.ON_DUTY_WINDOW}h window`,
  });

  // ─── Factor 3: Break Compliance (10% weight) ──────────────────
  const breakRatio = Math.min(input.hoursSinceLastBreak / HOS.BREAK_AFTER, 1.0);
  const breakScore = Math.round(breakRatio * 100);
  factors.push({
    name: "Break Compliance",
    weight: 0.10,
    score: breakScore,
    description: `${input.hoursSinceLastBreak.toFixed(1)}h since last 30-min break (limit: ${HOS.BREAK_AFTER}h)`,
  });

  // ─── Factor 4: Circadian Rhythm (15% weight) ──────────────────
  const circadianRisk = CIRCADIAN_RISK[Math.min(Math.max(input.currentHour, 0), 23)];
  const circadianScore = Math.round(circadianRisk * 100);
  factors.push({
    name: "Circadian Rhythm",
    weight: 0.15,
    score: circadianScore,
    description: input.isNightDriving
      ? `Night driving (${input.currentHour}:00) — highest fatigue risk window`
      : `Time-of-day factor at ${input.currentHour}:00`,
  });

  // ─── Factor 5: Weekly Hours (10% weight) ──────────────────────
  const weeklyRatio = Math.min(input.weeklyDrivingHours / weeklyLimit, 1.0);
  const weeklyScore = Math.round(weeklyRatio * 100);
  factors.push({
    name: "Weekly Hours",
    weight: 0.10,
    score: weeklyScore,
    description: `${input.weeklyDrivingHours.toFixed(1)}h / ${weeklyLimit}h weekly limit`,
  });

  // ─── Factor 6: Environmental (5% weight) ──────────────────────
  const envScore = Math.round(Math.min(input.weatherSeverity / 3, 1.0) * 100);
  factors.push({
    name: "Weather Conditions",
    weight: 0.05,
    score: envScore,
    description: ["Clear", "Rain", "Heavy Rain", "Ice/Snow"][input.weatherSeverity] || "Unknown",
  });

  // ─── Factor 7: History (5% weight) ────────────────────────────
  const historyScore = Math.min((input.incidentCount90Days * 25) + (input.violationCount12Months * 15), 100);
  factors.push({
    name: "Safety History",
    weight: 0.05,
    score: historyScore,
    description: `${input.incidentCount90Days} incidents (90d), ${input.violationCount12Months} violations (12mo)`,
  });

  // ─── Factor 8: Consecutive Days (5% weight) ───────────────────
  const consecutiveScore = Math.min(Math.round((input.consecutiveDaysWorked / 8) * 100), 100);
  factors.push({
    name: "Consecutive Days",
    weight: 0.05,
    score: consecutiveScore,
    description: `${input.consecutiveDaysWorked} consecutive days worked`,
  });

  // ─── Compute Weighted Score ────────────────────────────────────
  let rawScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0);

  // Apply hazmat multiplier
  if (input.hazmatClass) {
    const multiplier = getHazmatFatigueMultiplier(input.hazmatClass);
    rawScore = Math.min(rawScore * multiplier, 100);
  }

  const score = Math.round(Math.min(Math.max(rawScore, 0), 100));

  // ─── Risk Level ────────────────────────────────────────────────
  const level: FatigueResult["level"] =
    score >= 80 ? "CRITICAL" :
    score >= 60 ? "HIGH" :
    score >= 35 ? "MODERATE" : "LOW";

  // ─── Hours Remaining ──────────────────────────────────────────
  const safeDrivingHoursRemaining = Math.max(HOS.DRIVING_LIMIT - input.currentDrivingHours, 0);
  const onDutyHoursRemaining = Math.max(HOS.ON_DUTY_WINDOW - input.currentOnDutyHours, 0);
  const weeklyHoursRemaining = Math.max(weeklyLimit - input.weeklyDrivingHours, 0);
  const breakDueIn = input.hoursSinceLastBreak >= HOS.BREAK_AFTER ? 0 : HOS.BREAK_AFTER - input.hoursSinceLastBreak;

  // ─── HOS Compliance Check ─────────────────────────────────────
  const violations: string[] = [];
  if (input.currentDrivingHours > HOS.DRIVING_LIMIT) violations.push(`Driving ${(input.currentDrivingHours - HOS.DRIVING_LIMIT).toFixed(1)}h over 11-hour limit`);
  if (input.currentOnDutyHours > HOS.ON_DUTY_WINDOW) violations.push(`On-duty ${(input.currentOnDutyHours - HOS.ON_DUTY_WINDOW).toFixed(1)}h over 14-hour window`);
  if (input.weeklyDrivingHours > weeklyLimit) violations.push(`Weekly hours ${(input.weeklyDrivingHours - weeklyLimit).toFixed(1)}h over ${weeklyLimit}-hour limit`);
  if (input.hoursSinceLastBreak > HOS.BREAK_AFTER && input.currentDrivingHours > 0) violations.push("30-minute break required — exceeded 8-hour driving interval");

  // ─── Recommendation ────────────────────────────────────────────
  const recommendation = buildRecommendation(score, level, safeDrivingHoursRemaining, onDutyHoursRemaining, breakDueIn, violations);

  return {
    score,
    level,
    recommendation,
    safeDrivingHoursRemaining: Math.round(safeDrivingHoursRemaining * 10) / 10,
    onDutyHoursRemaining: Math.round(onDutyHoursRemaining * 10) / 10,
    weeklyHoursRemaining: Math.round(weeklyHoursRemaining * 10) / 10,
    breakDueIn: breakDueIn > 0 ? Math.round(breakDueIn * 10) / 10 : null,
    factors,
    hosCompliance: {
      drivingLimitHours: HOS.DRIVING_LIMIT,
      onDutyWindowHours: HOS.ON_DUTY_WINDOW,
      weeklyLimitHours: weeklyLimit,
      breakRequiredAfterHours: HOS.BREAK_AFTER,
      drivingUsed: Math.round(input.currentDrivingHours * 10) / 10,
      onDutyUsed: Math.round(input.currentOnDutyHours * 10) / 10,
      weeklyUsed: Math.round(input.weeklyDrivingHours * 10) / 10,
      isInViolation: violations.length > 0,
      violations,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════
// BATCH API: Score multiple drivers at once (for fleet dashboard)
// ═══════════════════════════════════════════════════════════════════════

export function batchPredictFatigue(inputs: FatigueInput[]): Map<string, FatigueResult> {
  const results = new Map<string, FatigueResult>();
  for (const input of inputs) {
    results.set(input.driverId, predictFatigue(input));
  }
  return results;
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

function buildRecommendation(
  score: number,
  level: FatigueResult["level"],
  drivingRemaining: number,
  onDutyRemaining: number,
  breakDueIn: number,
  violations: string[]
): FatigueRecommendation {
  // Out of hours
  if (drivingRemaining <= 0 || onDutyRemaining <= 0) {
    return {
      action: "OUT_OF_HOURS",
      message: "You have reached your HOS limit. You must take a 10-hour off-duty rest before driving.",
      urgency: "danger",
    };
  }

  // Active violations
  if (violations.length > 0) {
    return {
      action: "MANDATORY_REST",
      message: `HOS violation detected: ${violations[0]}. Stop driving and take required rest.`,
      urgency: "danger",
    };
  }

  // Break overdue
  if (breakDueIn <= 0) {
    return {
      action: "TAKE_BREAK",
      message: "30-minute break required. You have exceeded 8 hours of driving without a qualifying break.",
      urgency: "warning",
    };
  }

  // Critical fatigue
  if (level === "CRITICAL") {
    return {
      action: "MANDATORY_REST",
      message: "Fatigue risk is critical. Strongly recommend pulling over at the next safe location for rest.",
      urgency: "danger",
    };
  }

  // High fatigue or low remaining hours
  if (level === "HIGH" || drivingRemaining <= 2) {
    return {
      action: "PLAN_REST",
      message: `${drivingRemaining.toFixed(1)} driving hours remaining. Plan your rest stop soon.`,
      urgency: "warning",
    };
  }

  // Break coming up
  if (breakDueIn <= 1) {
    return {
      action: "TAKE_BREAK",
      message: `30-minute break due within ${(breakDueIn * 60).toFixed(0)} minutes. Plan accordingly.`,
      urgency: "warning",
    };
  }

  // All good
  return {
    action: "CONTINUE",
    message: `${drivingRemaining.toFixed(1)} driving hours remaining. Next break due in ${breakDueIn.toFixed(1)} hours.`,
    urgency: "info",
  };
}
