/**
 * OVERSIZE/OVERWEIGHT ENFORCEMENT ENGINE
 *
 * Production-grade enforcement for OS/OW loads:
 * - Auto-detection from load dimensions/weight
 * - State-specific escort requirements (14 states)
 * - Bridge Formula B axle weight calculations
 * - Travel window enforcement (daylight, weekday, holiday)
 * - Multi-state permit aggregation
 *
 * Federal thresholds (FHWA):
 *   Width  > 8.5 ft  → OVERSIZE
 *   Height > 13.5 ft → OVERSIZE
 *   Length > 53 ft (trailer) / 75 ft (overall) → OVERSIZE
 *   GVW    > 80,000 lbs → OVERWEIGHT
 *   Single axle > 20,000 lbs → OVERWEIGHT
 *   Tandem axle > 34,000 lbs → OVERWEIGHT
 */

// ── Federal dimension limits ──────────────────────────────────────────────────

export const FEDERAL_LIMITS = {
  maxWidth: 8.5,        // feet
  maxHeight: 13.5,      // feet — varies by state (13.5–14.6)
  maxTrailerLength: 53, // feet
  maxOverallLength: 75, // feet
  maxGVW: 80000,        // lbs
  maxSingleAxle: 20000, // lbs
  maxTandemAxle: 34000, // lbs
  maxTridemAxle: 42000, // lbs (some states)
} as const;

// ── State-specific oversize rules ─────────────────────────────────────────────

interface StateOversizeRules {
  maxHeight: number;
  maxWidth: number;
  maxGVW: number;
  escortThresholds: {
    /** Width (ft) at which front escort required */
    frontEscortWidth: number;
    /** Width (ft) at which front + rear escort required */
    dualEscortWidth: number;
    /** Height (ft) at which escort required */
    escortHeight: number;
    /** Length (ft overall) at which escort required */
    escortLength: number;
    /** Weight (lbs) at which escort required */
    escortWeight: number;
  };
  travelRestrictions: {
    daylightOnly: boolean;
    noWeekends: boolean;
    noHolidays: boolean;
    /** Hour after which OS/OW loads cannot travel (24h) */
    curfewStart: number;
    /** Hour when OS/OW loads can resume (24h) */
    curfewEnd: number;
    maxSpeed: number; // mph
  };
  permitRequired: boolean;
  permitCostEstimate: number; // USD per trip
  notes: string;
}

export const STATE_OVERSIZE_RULES: Record<string, StateOversizeRules> = {
  TX: {
    maxHeight: 14.0, maxWidth: 8.5, maxGVW: 84000,
    escortThresholds: { frontEscortWidth: 14, dualEscortWidth: 16, escortHeight: 17, escortLength: 110, escortWeight: 200000 },
    travelRestrictions: { daylightOnly: true, noWeekends: false, noHolidays: true, curfewStart: 20, curfewEnd: 6, maxSpeed: 55 },
    permitRequired: true, permitCostEstimate: 60, notes: "TxDOT MCD permits. Night moves for superloads with THP escort.",
  },
  CA: {
    maxHeight: 14.0, maxWidth: 8.5, maxGVW: 80000,
    escortThresholds: { frontEscortWidth: 12, dualEscortWidth: 14.5, escortHeight: 15, escortLength: 100, escortWeight: 120000 },
    travelRestrictions: { daylightOnly: true, noWeekends: true, noHolidays: true, curfewStart: 18, curfewEnd: 7, maxSpeed: 45 },
    permitRequired: true, permitCostEstimate: 90, notes: "Caltrans Transportation Permits. Strict weekend/holiday restrictions.",
  },
  OK: {
    maxHeight: 13.5, maxWidth: 8.5, maxGVW: 90000,
    escortThresholds: { frontEscortWidth: 12, dualEscortWidth: 16, escortHeight: 16, escortLength: 110, escortWeight: 160000 },
    travelRestrictions: { daylightOnly: true, noWeekends: false, noHolidays: true, curfewStart: 20, curfewEnd: 6, maxSpeed: 55 },
    permitRequired: true, permitCostEstimate: 50, notes: "ODOT Size and Weight. Higher GVW tolerance with 6-axle config.",
  },
  NM: {
    maxHeight: 14.0, maxWidth: 8.5, maxGVW: 86400,
    escortThresholds: { frontEscortWidth: 12, dualEscortWidth: 16, escortHeight: 16.5, escortLength: 110, escortWeight: 160000 },
    travelRestrictions: { daylightOnly: true, noWeekends: false, noHolidays: true, curfewStart: 20, curfewEnd: 6, maxSpeed: 55 },
    permitRequired: true, permitCostEstimate: 55, notes: "NMDOT permits. Escort required for loads >12ft wide.",
  },
  CO: {
    maxHeight: 14.5, maxWidth: 8.5, maxGVW: 85000,
    escortThresholds: { frontEscortWidth: 12, dualEscortWidth: 16, escortHeight: 16, escortLength: 100, escortWeight: 150000 },
    travelRestrictions: { daylightOnly: true, noWeekends: true, noHolidays: true, curfewStart: 18, curfewEnd: 7, maxSpeed: 45 },
    permitRequired: true, permitCostEstimate: 75, notes: "CDOT permits. Mountain passes have additional restrictions.",
  },
  ND: {
    maxHeight: 14.0, maxWidth: 8.5, maxGVW: 105500,
    escortThresholds: { frontEscortWidth: 14.5, dualEscortWidth: 18, escortHeight: 17, escortLength: 120, escortWeight: 200000 },
    travelRestrictions: { daylightOnly: true, noWeekends: false, noHolidays: true, curfewStart: 21, curfewEnd: 5, maxSpeed: 55 },
    permitRequired: true, permitCostEstimate: 40, notes: "NDDOT permits. Highest GVW tolerance in US. Oil field exemptions.",
  },
  NY: {
    maxHeight: 13.5, maxWidth: 8.5, maxGVW: 80000,
    escortThresholds: { frontEscortWidth: 12, dualEscortWidth: 14, escortHeight: 14.5, escortLength: 85, escortWeight: 120000 },
    travelRestrictions: { daylightOnly: true, noWeekends: true, noHolidays: true, curfewStart: 17, curfewEnd: 7, maxSpeed: 45 },
    permitRequired: true, permitCostEstimate: 100, notes: "NYSDOT. Very strict — short windows, low thresholds. NYC prohibited for most OS/OW.",
  },
  PA: {
    maxHeight: 13.5, maxWidth: 8.5, maxGVW: 80000,
    escortThresholds: { frontEscortWidth: 12, dualEscortWidth: 16, escortHeight: 15, escortLength: 100, escortWeight: 150000 },
    travelRestrictions: { daylightOnly: true, noWeekends: true, noHolidays: true, curfewStart: 18, curfewEnd: 7, maxSpeed: 50 },
    permitRequired: true, permitCostEstimate: 85, notes: "PennDOT permits. Bridge postings strictly enforced.",
  },
  OH: {
    maxHeight: 13.5, maxWidth: 8.5, maxGVW: 80000,
    escortThresholds: { frontEscortWidth: 12, dualEscortWidth: 16, escortHeight: 15, escortLength: 100, escortWeight: 150000 },
    travelRestrictions: { daylightOnly: true, noWeekends: true, noHolidays: true, curfewStart: 18, curfewEnd: 7, maxSpeed: 50 },
    permitRequired: true, permitCostEstimate: 70, notes: "ODOT Special Hauling Permits.",
  },
  LA: {
    maxHeight: 13.5, maxWidth: 8.5, maxGVW: 88000,
    escortThresholds: { frontEscortWidth: 12, dualEscortWidth: 16, escortHeight: 16, escortLength: 100, escortWeight: 160000 },
    travelRestrictions: { daylightOnly: true, noWeekends: false, noHolidays: true, curfewStart: 20, curfewEnd: 6, maxSpeed: 55 },
    permitRequired: true, permitCostEstimate: 50, notes: "LADOTD permits. Higher GVW for some configurations.",
  },
  IL: {
    maxHeight: 13.5, maxWidth: 8.5, maxGVW: 80000,
    escortThresholds: { frontEscortWidth: 12, dualEscortWidth: 16, escortHeight: 15, escortLength: 100, escortWeight: 150000 },
    travelRestrictions: { daylightOnly: true, noWeekends: true, noHolidays: true, curfewStart: 18, curfewEnd: 7, maxSpeed: 50 },
    permitRequired: true, permitCostEstimate: 65, notes: "IDOT Oversize/Overweight permits.",
  },
  NJ: {
    maxHeight: 13.5, maxWidth: 8.5, maxGVW: 80000,
    escortThresholds: { frontEscortWidth: 12, dualEscortWidth: 14, escortHeight: 14, escortLength: 85, escortWeight: 120000 },
    travelRestrictions: { daylightOnly: true, noWeekends: true, noHolidays: true, curfewStart: 17, curfewEnd: 7, maxSpeed: 45 },
    permitRequired: true, permitCostEstimate: 95, notes: "NJDOT/NJ Turnpike Authority. Very restrictive — similar to NY.",
  },
  FL: {
    maxHeight: 13.5, maxWidth: 8.5, maxGVW: 80000,
    escortThresholds: { frontEscortWidth: 12, dualEscortWidth: 16, escortHeight: 15.5, escortLength: 100, escortWeight: 150000 },
    travelRestrictions: { daylightOnly: true, noWeekends: false, noHolidays: true, curfewStart: 20, curfewEnd: 6, maxSpeed: 55 },
    permitRequired: true, permitCostEstimate: 60, notes: "FDOT permits. Some toll roads prohibit OS/OW.",
  },
  WV: {
    maxHeight: 13.5, maxWidth: 8.5, maxGVW: 80000,
    escortThresholds: { frontEscortWidth: 12, dualEscortWidth: 14, escortHeight: 15, escortLength: 95, escortWeight: 130000 },
    travelRestrictions: { daylightOnly: true, noWeekends: true, noHolidays: true, curfewStart: 18, curfewEnd: 7, maxSpeed: 45 },
    permitRequired: true, permitCostEstimate: 55, notes: "WV DOH permits. Mountain terrain — additional bridge restrictions.",
  },
};

// Default rules for states not explicitly listed
const DEFAULT_STATE_RULES: StateOversizeRules = {
  maxHeight: 13.5, maxWidth: 8.5, maxGVW: 80000,
  escortThresholds: { frontEscortWidth: 12, dualEscortWidth: 16, escortHeight: 15, escortLength: 100, escortWeight: 150000 },
  travelRestrictions: { daylightOnly: true, noWeekends: true, noHolidays: true, curfewStart: 18, curfewEnd: 7, maxSpeed: 50 },
  permitRequired: true, permitCostEstimate: 70, notes: "Default — verify with state DOT.",
};

export function getStateRules(state: string): StateOversizeRules {
  return STATE_OVERSIZE_RULES[state.toUpperCase()] || DEFAULT_STATE_RULES;
}

// ── Load dimension analysis ───────────────────────────────────────────────────

export interface LoadDimensions {
  widthFt?: number;
  heightFt?: number;
  lengthFt?: number;
  overallLengthFt?: number;
  weightLbs?: number;
  axles?: number;
}

export interface OversizeAnalysis {
  isOversize: boolean;
  isOverweight: boolean;
  requiresEscort: boolean;
  escortCount: number;
  requiresPermit: boolean;
  violations: string[];
  warnings: string[];
  /** Per-state breakdown when route crosses multiple states */
  stateRequirements: StateRequirement[];
  travelRestrictions: {
    daylightOnly: boolean;
    noWeekends: boolean;
    noHolidays: boolean;
    maxSpeed: number;
  };
  axleWeights?: AxleWeightResult;
  estimatedPermitCost: number;
}

export interface StateRequirement {
  state: string;
  permitRequired: boolean;
  escortCount: number;
  travelRestrictions: StateOversizeRules["travelRestrictions"];
  violations: string[];
  estimatedCost: number;
}

/**
 * Analyze load dimensions against federal and state-specific limits.
 * Returns full oversize/overweight analysis with escort requirements.
 */
export function analyzeLoadDimensions(
  dims: LoadDimensions,
  routeStates: string[] = []
): OversizeAnalysis {
  const violations: string[] = [];
  const warnings: string[] = [];
  let isOversize = false;
  let isOverweight = false;

  // ── Federal checks ──
  if (dims.widthFt && dims.widthFt > FEDERAL_LIMITS.maxWidth) {
    isOversize = true;
    violations.push(`Width ${dims.widthFt}ft exceeds federal limit of ${FEDERAL_LIMITS.maxWidth}ft — OS permit required`);
  }
  if (dims.heightFt && dims.heightFt > FEDERAL_LIMITS.maxHeight) {
    isOversize = true;
    violations.push(`Height ${dims.heightFt}ft exceeds federal limit of ${FEDERAL_LIMITS.maxHeight}ft — OS permit required`);
  }
  if (dims.lengthFt && dims.lengthFt > FEDERAL_LIMITS.maxTrailerLength) {
    isOversize = true;
    violations.push(`Trailer length ${dims.lengthFt}ft exceeds federal limit of ${FEDERAL_LIMITS.maxTrailerLength}ft`);
  }
  if (dims.overallLengthFt && dims.overallLengthFt > FEDERAL_LIMITS.maxOverallLength) {
    isOversize = true;
    violations.push(`Overall length ${dims.overallLengthFt}ft exceeds federal limit of ${FEDERAL_LIMITS.maxOverallLength}ft`);
  }
  if (dims.weightLbs && dims.weightLbs > FEDERAL_LIMITS.maxGVW) {
    isOverweight = true;
    violations.push(`GVW ${dims.weightLbs.toLocaleString()} lbs exceeds federal limit of ${FEDERAL_LIMITS.maxGVW.toLocaleString()} lbs — OW permit required`);
  }

  // Warning thresholds (within 5% of limits)
  if (dims.widthFt && dims.widthFt > FEDERAL_LIMITS.maxWidth * 0.95 && !isOversize) {
    warnings.push(`Width ${dims.widthFt}ft is within 5% of federal limit (${FEDERAL_LIMITS.maxWidth}ft)`);
  }
  if (dims.weightLbs && dims.weightLbs > FEDERAL_LIMITS.maxGVW * 0.95 && !isOverweight) {
    warnings.push(`Weight ${dims.weightLbs.toLocaleString()} lbs is within 5% of federal limit`);
  }

  // ── Per-state analysis ──
  const states = routeStates.length > 0 ? routeStates : ["DEFAULT"];
  const stateRequirements: StateRequirement[] = [];
  let maxEscortCount = 0;
  let totalPermitCost = 0;
  const mergedRestrictions = { daylightOnly: false, noWeekends: false, noHolidays: false, maxSpeed: 65 };

  for (const stateCode of states) {
    const rules = stateCode === "DEFAULT" ? DEFAULT_STATE_RULES : getStateRules(stateCode);
    const stateViolations: string[] = [];
    let stateEscortCount = 0;

    // State-specific dimension checks
    if (dims.heightFt && dims.heightFt > rules.maxHeight) {
      stateViolations.push(`Height ${dims.heightFt}ft exceeds ${stateCode} limit of ${rules.maxHeight}ft`);
    }
    if (dims.weightLbs && dims.weightLbs > rules.maxGVW) {
      stateViolations.push(`GVW ${dims.weightLbs.toLocaleString()} lbs exceeds ${stateCode} limit of ${rules.maxGVW.toLocaleString()} lbs`);
    }

    // Escort calculation
    if (isOversize || isOverweight) {
      const t = rules.escortThresholds;
      if (dims.widthFt && dims.widthFt >= t.dualEscortWidth) {
        stateEscortCount = 2;
      } else if (dims.widthFt && dims.widthFt >= t.frontEscortWidth) {
        stateEscortCount = 1;
      }
      if (dims.heightFt && dims.heightFt >= t.escortHeight && stateEscortCount < 1) {
        stateEscortCount = 1;
      }
      if (dims.overallLengthFt && dims.overallLengthFt >= t.escortLength && stateEscortCount < 1) {
        stateEscortCount = 1;
      }
      if (dims.weightLbs && dims.weightLbs >= t.escortWeight && stateEscortCount < 2) {
        stateEscortCount = 2;
      }
    }

    maxEscortCount = Math.max(maxEscortCount, stateEscortCount);
    totalPermitCost += rules.permitCostEstimate;

    // Merge travel restrictions (most restrictive wins)
    if (isOversize || isOverweight) {
      if (rules.travelRestrictions.daylightOnly) mergedRestrictions.daylightOnly = true;
      if (rules.travelRestrictions.noWeekends) mergedRestrictions.noWeekends = true;
      if (rules.travelRestrictions.noHolidays) mergedRestrictions.noHolidays = true;
      mergedRestrictions.maxSpeed = Math.min(mergedRestrictions.maxSpeed, rules.travelRestrictions.maxSpeed);
    }

    stateRequirements.push({
      state: stateCode,
      permitRequired: (isOversize || isOverweight) && rules.permitRequired,
      escortCount: stateEscortCount,
      travelRestrictions: rules.travelRestrictions,
      violations: stateViolations,
      estimatedCost: rules.permitCostEstimate,
    });
  }

  // ── Axle weight calculation ──
  let axleWeights: AxleWeightResult | undefined;
  if (dims.weightLbs && dims.axles) {
    axleWeights = calculateAxleWeights(dims.weightLbs, dims.axles);
    if (!axleWeights.compliant) {
      isOverweight = true;
      violations.push(...axleWeights.violations);
    }
  }

  return {
    isOversize,
    isOverweight,
    requiresEscort: maxEscortCount > 0,
    escortCount: maxEscortCount,
    requiresPermit: (isOversize || isOverweight),
    violations,
    warnings,
    stateRequirements,
    travelRestrictions: mergedRestrictions,
    axleWeights,
    estimatedPermitCost: (isOversize || isOverweight) ? totalPermitCost : 0,
  };
}

// ── Bridge Formula B — Axle Weight Calculation ────────────────────────────────

export interface AxleWeightResult {
  compliant: boolean;
  steerAxle: number;
  driveAxle: number;
  trailerAxle: number;
  gvw: number;
  violations: string[];
  bridgeFormulaMax: number;
  recommendation: string;
}

/**
 * Calculate axle weight distribution using standard tractor-trailer config.
 * Bridge Formula B: W = 500 * (LN/(N-1) + 12N + 36)
 * where W = max weight (lbs), L = distance between outer axles (ft), N = number of axles
 */
export function calculateAxleWeights(totalWeight: number, axleCount: number): AxleWeightResult {
  const violations: string[] = [];

  // Standard axle distribution percentages (tractor-trailer)
  // Steer: ~15%, Drive tandem: ~42.5%, Trailer tandem: ~42.5%
  let steerAxle: number, driveAxle: number, trailerAxle: number;

  if (axleCount <= 3) {
    // 3-axle: steer + single drive + single trailer
    steerAxle = Math.round(totalWeight * 0.20);
    driveAxle = Math.round(totalWeight * 0.40);
    trailerAxle = Math.round(totalWeight * 0.40);
  } else if (axleCount === 4) {
    // 4-axle: steer + tandem drive + single trailer
    steerAxle = Math.round(totalWeight * 0.17);
    driveAxle = Math.round(totalWeight * 0.43);
    trailerAxle = Math.round(totalWeight * 0.40);
  } else {
    // 5+ axle: steer + tandem drive + tandem trailer (standard 18-wheeler)
    steerAxle = Math.round(totalWeight * 0.15);
    driveAxle = Math.round(totalWeight * 0.425);
    trailerAxle = Math.round(totalWeight * 0.425);
  }

  // Check federal limits
  if (steerAxle > FEDERAL_LIMITS.maxSingleAxle) {
    violations.push(`Steer axle ${steerAxle.toLocaleString()} lbs exceeds ${FEDERAL_LIMITS.maxSingleAxle.toLocaleString()} lb single axle limit`);
  }
  if (axleCount >= 5 && driveAxle > FEDERAL_LIMITS.maxTandemAxle) {
    violations.push(`Drive tandem ${driveAxle.toLocaleString()} lbs exceeds ${FEDERAL_LIMITS.maxTandemAxle.toLocaleString()} lb tandem limit`);
  }
  if (axleCount >= 5 && trailerAxle > FEDERAL_LIMITS.maxTandemAxle) {
    violations.push(`Trailer tandem ${trailerAxle.toLocaleString()} lbs exceeds ${FEDERAL_LIMITS.maxTandemAxle.toLocaleString()} lb tandem limit`);
  }
  if (totalWeight > FEDERAL_LIMITS.maxGVW) {
    violations.push(`GVW ${totalWeight.toLocaleString()} lbs exceeds ${FEDERAL_LIMITS.maxGVW.toLocaleString()} lb federal limit`);
  }

  // Bridge Formula B: standard 51ft outer axle spacing for 5-axle
  const outerAxleSpacing = axleCount >= 5 ? 51 : axleCount === 4 ? 40 : 30;
  const bridgeFormulaMax = 500 * ((outerAxleSpacing * axleCount) / (axleCount - 1) + 12 * axleCount + 36);

  if (totalWeight > bridgeFormulaMax) {
    violations.push(`GVW ${totalWeight.toLocaleString()} lbs exceeds Bridge Formula B max of ${Math.round(bridgeFormulaMax).toLocaleString()} lbs for ${axleCount}-axle config`);
  }

  const compliant = violations.length === 0;
  let recommendation = "Weight distribution within legal limits.";
  if (!compliant) {
    if (axleCount < 5) {
      recommendation = `Consider adding axles. A ${axleCount + 1}-axle configuration would increase Bridge Formula capacity.`;
    } else {
      recommendation = "Overweight permit required. Consider spread-axle trailer or reducing cargo weight.";
    }
  }

  return { compliant, steerAxle, driveAxle, trailerAxle, gvw: totalWeight, violations, bridgeFormulaMax: Math.round(bridgeFormulaMax), recommendation };
}

// ── Travel Window Enforcement ─────────────────────────────────────────────────

const FEDERAL_HOLIDAYS_2026 = [
  "2026-01-01", "2026-01-19", "2026-02-16", "2026-05-25",
  "2026-07-03", "2026-07-04", "2026-09-07", "2026-10-12",
  "2026-11-11", "2026-11-26", "2026-11-27", "2026-12-25",
];

export interface TravelWindowCheck {
  allowed: boolean;
  reason?: string;
  nextAllowedWindow?: string;
}

/**
 * Check if an OS/OW load can travel at the given time in the given state.
 */
export function checkTravelWindow(
  state: string,
  departureTime: Date,
  isOversize: boolean,
  isOverweight: boolean
): TravelWindowCheck {
  if (!isOversize && !isOverweight) return { allowed: true };

  const rules = getStateRules(state);
  const hour = departureTime.getHours();
  const dayOfWeek = departureTime.getDay(); // 0=Sun, 6=Sat
  const dateStr = departureTime.toISOString().split("T")[0];

  // Holiday check
  if (rules.travelRestrictions.noHolidays && FEDERAL_HOLIDAYS_2026.includes(dateStr)) {
    return { allowed: false, reason: `${state}: OS/OW loads prohibited on federal holidays` };
  }

  // Weekend check
  if (rules.travelRestrictions.noWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
    return { allowed: false, reason: `${state}: OS/OW loads prohibited on weekends`, nextAllowedWindow: "Monday 7:00 AM" };
  }

  // Daylight/curfew check
  if (rules.travelRestrictions.daylightOnly) {
    if (hour >= rules.travelRestrictions.curfewStart || hour < rules.travelRestrictions.curfewEnd) {
      return {
        allowed: false,
        reason: `${state}: OS/OW loads restricted to ${rules.travelRestrictions.curfewEnd}:00–${rules.travelRestrictions.curfewStart}:00`,
        nextAllowedWindow: `${rules.travelRestrictions.curfewEnd}:00 AM`,
      };
    }
  }

  return { allowed: true };
}

// ── Multi-state permit aggregation ────────────────────────────────────────────

export interface MultiStatePermitSummary {
  totalStates: number;
  totalEstimatedCost: number;
  mostRestrictiveState: string;
  permits: { state: string; required: boolean; estimatedCost: number; escortCount: number }[];
  mergedRestrictions: {
    daylightOnly: boolean;
    noWeekends: boolean;
    noHolidays: boolean;
    maxSpeed: number;
  };
}

/**
 * Aggregate permit requirements across all states in a route.
 */
export function aggregateMultiStatePermits(
  dims: LoadDimensions,
  routeStates: string[]
): MultiStatePermitSummary {
  const analysis = analyzeLoadDimensions(dims, routeStates);

  let mostRestrictive = routeStates[0] || "DEFAULT";
  let maxEscorts = 0;
  for (const sr of analysis.stateRequirements) {
    if (sr.escortCount > maxEscorts) {
      maxEscorts = sr.escortCount;
      mostRestrictive = sr.state;
    }
  }

  return {
    totalStates: routeStates.length,
    totalEstimatedCost: analysis.estimatedPermitCost,
    mostRestrictiveState: mostRestrictive,
    permits: analysis.stateRequirements.map(sr => ({
      state: sr.state,
      required: sr.permitRequired,
      estimatedCost: sr.estimatedCost,
      escortCount: sr.escortCount,
    })),
    mergedRestrictions: analysis.travelRestrictions,
  };
}
