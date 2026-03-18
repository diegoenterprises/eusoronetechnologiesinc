/**
 * CANADIAN HOURS OF SERVICE ENGINE
 * Implements SOR/2005-313 (Motor Vehicle Drivers Hours of Service Regulations)
 *
 * Key differences from US (49 CFR Part 395):
 *  - 13h driving limit (US = 11h)
 *  - 14h on-duty limit is CUMULATIVE (US = 14h WINDOW from start of shift)
 *  - 8h off-duty required in any 24h period, including at least 2 consecutive hours
 *  - Two cycle options: Cycle 1 (70h/7d) or Cycle 2 (120h/14d)
 *  - Mandatory 24h off-duty reset within every 14 days
 *  - No 30-minute break rule (that is US-only per FMCSA 2013 revision)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DutyStatus = 'driving' | 'on-duty' | 'off-duty' | 'sleeper';

export interface DutyLogEntry {
  status: DutyStatus;
  startTime: string; // ISO-8601
  endTime: string;   // ISO-8601
  location?: string;
  notes?: string;
}

export interface CanadianHOSStatus {
  drivingRemaining: number;   // minutes remaining
  onDutyRemaining: number;    // minutes remaining
  cycleRemaining: number;     // minutes remaining
  currentCycle: 1 | 2;
  cycleHoursUsed: number;     // minutes used in cycle
  lastResetDate: string | null;
  nextRequiredReset: string | null;
  offDutyIn24h: number;       // accumulated off-duty minutes in last 24h
  consecutiveOffDuty: number; // longest consecutive off-duty block in last 24h (minutes)
  violations: CanadianHOSViolation[];
  isCompliant: boolean;
}

export interface CanadianHOSViolation {
  rule: string;
  description: string;
  severity: 'warning' | 'violation';
  hoursOver?: number;
}

// ---------------------------------------------------------------------------
// Rule constants
// ---------------------------------------------------------------------------

export interface CycleRules {
  name: string;
  maxDrivingHours: number;
  maxOnDutyHours: number;
  cycleHours: number;
  cycleDays: number;
  requiredOffDutyIn24h: number;       // hours
  requiredConsecutiveOffDuty: number;  // hours within that 24h block
  resetHours: number;                 // consecutive off-duty to reset cycle
  mandatoryResetDays: number;         // must take resetHours off every N days
}

export const CANADIAN_HOS_RULES: Record<'CYCLE_1' | 'CYCLE_2', CycleRules> = {
  CYCLE_1: {
    name: 'Cycle 1',
    maxDrivingHours: 13,
    maxOnDutyHours: 14,
    cycleHours: 70,
    cycleDays: 7,
    requiredOffDutyIn24h: 8,
    requiredConsecutiveOffDuty: 2,
    resetHours: 24,
    mandatoryResetDays: 14,
  },
  CYCLE_2: {
    name: 'Cycle 2',
    maxDrivingHours: 13,
    maxOnDutyHours: 14,
    cycleHours: 120,
    cycleDays: 14,
    requiredOffDutyIn24h: 8,
    requiredConsecutiveOffDuty: 2,
    resetHours: 24,
    mandatoryResetDays: 14,
  },
};

// Canadian provinces and territories
const CANADIAN_JURISDICTIONS = new Set([
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT',
  // Full names
  'ALBERTA', 'BRITISH COLUMBIA', 'MANITOBA', 'NEW BRUNSWICK',
  'NEWFOUNDLAND AND LABRADOR', 'NOVA SCOTIA', 'NORTHWEST TERRITORIES',
  'NUNAVUT', 'ONTARIO', 'PRINCE EDWARD ISLAND', 'QUEBEC', 'SASKATCHEWAN', 'YUKON',
]);

const MEXICAN_STATES = new Set([
  'AGS', 'BC', 'BCS', 'CAM', 'CHIS', 'CHIH', 'COAH', 'COL', 'CDMX', 'DGO',
  'GTO', 'GRO', 'HGO', 'JAL', 'MEX', 'MICH', 'MOR', 'NAY', 'NL', 'OAX',
  'PUE', 'QRO', 'QROO', 'SLP', 'SIN', 'SON', 'TAB', 'TAMPS', 'TLAX', 'VER',
  'YUC', 'ZAC',
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function minutesBetween(start: string, end: string): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / 60_000;
}

function hoursToMinutes(h: number): number {
  return h * 60;
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function subtractHours(iso: string, hours: number): Date {
  return new Date(new Date(iso).getTime() - hours * 3_600_000);
}

// ---------------------------------------------------------------------------
// Core calculation
// ---------------------------------------------------------------------------

export function calculateCanadianHOS(
  logs: DutyLogEntry[],
  cycle: 1 | 2 = 1,
): CanadianHOSStatus {
  const rules = cycle === 1 ? CANADIAN_HOS_RULES.CYCLE_1 : CANADIAN_HOS_RULES.CYCLE_2;
  const violations: CanadianHOSViolation[] = [];

  if (logs.length === 0) {
    return {
      drivingRemaining: hoursToMinutes(rules.maxDrivingHours),
      onDutyRemaining: hoursToMinutes(rules.maxOnDutyHours),
      cycleRemaining: hoursToMinutes(rules.cycleHours),
      currentCycle: cycle,
      cycleHoursUsed: 0,
      lastResetDate: null,
      nextRequiredReset: null,
      offDutyIn24h: 0,
      consecutiveOffDuty: 0,
      violations: [],
      isCompliant: true,
    };
  }

  // Sort logs chronologically
  const sorted = [...logs].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  const now = sorted[sorted.length - 1].endTime;
  const twentyFourHoursAgo = subtractHours(now, 24);
  const cyclePeriodStart = subtractHours(now, rules.cycleDays * 24);

  // -----------------------------------------------------------------------
  // 1. Driving / on-duty in current shift (since last qualifying off-duty)
  // -----------------------------------------------------------------------
  // Canadian rules: "shift" resets after 8h cumulative off-duty in 24h that
  // includes 2 consecutive hours. We track cumulative driving and on-duty
  // since the last valid shift reset.
  let shiftDrivingMinutes = 0;
  let shiftOnDutyMinutes = 0;

  // Find last shift reset: 8h off-duty in preceding 24h window with 2h consecutive block
  let lastResetIndex = -1;
  let lastResetDate: string | null = null;

  for (let i = sorted.length - 1; i >= 0; i--) {
    const entry = sorted[i];
    if (entry.status === 'off-duty' || entry.status === 'sleeper') {
      const duration = minutesBetween(entry.startTime, entry.endTime);
      if (duration >= hoursToMinutes(rules.resetHours)) {
        // Full cycle reset
        lastResetIndex = i;
        lastResetDate = entry.endTime;
        break;
      }
    }
  }

  // Find shift start: last block of off-duty >= 8h (with 2h consecutive)
  let shiftStartIndex = lastResetIndex + 1;

  // Walk backwards from end to find last valid daily rest (8h off-duty with 2h consecutive)
  let accumulatedOffDuty = 0;
  let maxConsecutiveOffDuty = 0;
  let currentConsecutive = 0;
  let dailyResetFound = false;

  for (let i = sorted.length - 1; i >= 0; i--) {
    const entry = sorted[i];
    const duration = minutesBetween(entry.startTime, entry.endTime);
    const entryEnd = new Date(entry.endTime);

    // Only consider entries within last 24h for shift reset detection
    if (entryEnd.getTime() < twentyFourHoursAgo.getTime()) break;

    if (entry.status === 'off-duty' || entry.status === 'sleeper') {
      accumulatedOffDuty += duration;
      currentConsecutive += duration;
      if (currentConsecutive > maxConsecutiveOffDuty) {
        maxConsecutiveOffDuty = currentConsecutive;
      }

      if (
        accumulatedOffDuty >= hoursToMinutes(rules.requiredOffDutyIn24h) &&
        maxConsecutiveOffDuty >= hoursToMinutes(rules.requiredConsecutiveOffDuty)
      ) {
        dailyResetFound = true;
        shiftStartIndex = i + 1;
        break;
      }
    } else {
      currentConsecutive = 0;
    }
  }

  // Calculate shift totals from shiftStartIndex forward
  for (let i = shiftStartIndex; i < sorted.length; i++) {
    const entry = sorted[i];
    const duration = minutesBetween(entry.startTime, entry.endTime);
    if (entry.status === 'driving') {
      shiftDrivingMinutes += duration;
      shiftOnDutyMinutes += duration;
    } else if (entry.status === 'on-duty') {
      shiftOnDutyMinutes += duration;
    }
  }

  // -----------------------------------------------------------------------
  // 2. Off-duty tracking in last 24h
  // -----------------------------------------------------------------------
  let offDutyIn24h = 0;
  let longestConsecutiveOffDuty24h = 0;
  let consecutiveBlock = 0;

  for (const entry of sorted) {
    const entryStart = new Date(entry.startTime);
    const entryEnd = new Date(entry.endTime);

    if (entryEnd.getTime() < twentyFourHoursAgo.getTime()) continue;

    const effectiveStart = entryStart.getTime() < twentyFourHoursAgo.getTime()
      ? twentyFourHoursAgo
      : entryStart;

    const duration = (entryEnd.getTime() - effectiveStart.getTime()) / 60_000;

    if (entry.status === 'off-duty' || entry.status === 'sleeper') {
      offDutyIn24h += duration;
      consecutiveBlock += duration;
      if (consecutiveBlock > longestConsecutiveOffDuty24h) {
        longestConsecutiveOffDuty24h = consecutiveBlock;
      }
    } else {
      consecutiveBlock = 0;
    }
  }

  // -----------------------------------------------------------------------
  // 3. Cycle accumulation
  // -----------------------------------------------------------------------
  let cycleOnDutyMinutes = 0;

  for (const entry of sorted) {
    const entryStart = new Date(entry.startTime);
    if (entryStart.getTime() < cyclePeriodStart.getTime()) continue;

    // If a full cycle reset happened, only count after that
    if (lastResetDate && entryStart.getTime() < new Date(lastResetDate).getTime()) continue;

    const duration = minutesBetween(entry.startTime, entry.endTime);
    if (entry.status === 'driving' || entry.status === 'on-duty') {
      cycleOnDutyMinutes += duration;
    }
  }

  // -----------------------------------------------------------------------
  // 4. Violation detection
  // -----------------------------------------------------------------------

  // Daily driving limit
  const drivingLimit = hoursToMinutes(rules.maxDrivingHours);
  if (shiftDrivingMinutes > drivingLimit) {
    const overMinutes = shiftDrivingMinutes - drivingLimit;
    violations.push({
      rule: 'SOR/2005-313 s.12(1)',
      description: `Driving time exceeded ${rules.maxDrivingHours}h limit by ${(overMinutes / 60).toFixed(1)}h`,
      severity: 'violation',
      hoursOver: overMinutes / 60,
    });
  } else if (shiftDrivingMinutes > drivingLimit - 60) {
    violations.push({
      rule: 'SOR/2005-313 s.12(1)',
      description: `Less than 1h driving time remaining before ${rules.maxDrivingHours}h limit`,
      severity: 'warning',
    });
  }

  // Cumulative on-duty limit (key difference: Canadian is CUMULATIVE, not window-based)
  const onDutyLimit = hoursToMinutes(rules.maxOnDutyHours);
  if (shiftOnDutyMinutes > onDutyLimit) {
    const overMinutes = shiftOnDutyMinutes - onDutyLimit;
    violations.push({
      rule: 'SOR/2005-313 s.12(2)',
      description: `On-duty time exceeded ${rules.maxOnDutyHours}h cumulative limit by ${(overMinutes / 60).toFixed(1)}h`,
      severity: 'violation',
      hoursOver: overMinutes / 60,
    });
  }

  // Off-duty requirement in 24h
  const requiredOffDuty = hoursToMinutes(rules.requiredOffDutyIn24h);
  if (offDutyIn24h < requiredOffDuty) {
    const deficit = requiredOffDuty - offDutyIn24h;
    violations.push({
      rule: 'SOR/2005-313 s.12(3)',
      description: `Insufficient off-duty time in 24h period: ${(offDutyIn24h / 60).toFixed(1)}h of required ${rules.requiredOffDutyIn24h}h (need ${(deficit / 60).toFixed(1)}h more)`,
      severity: deficit > 60 ? 'violation' : 'warning',
    });
  }

  // Consecutive off-duty requirement (2h block within 24h period)
  const requiredConsecutive = hoursToMinutes(rules.requiredConsecutiveOffDuty);
  if (longestConsecutiveOffDuty24h < requiredConsecutive) {
    violations.push({
      rule: 'SOR/2005-313 s.12(4)',
      description: `No consecutive off-duty block of at least ${rules.requiredConsecutiveOffDuty}h found in last 24h. Longest block: ${(longestConsecutiveOffDuty24h / 60).toFixed(1)}h`,
      severity: 'violation',
    });
  }

  // Cycle limit
  const cycleLimit = hoursToMinutes(rules.cycleHours);
  if (cycleOnDutyMinutes > cycleLimit) {
    const overMinutes = cycleOnDutyMinutes - cycleLimit;
    violations.push({
      rule: 'SOR/2005-313 s.13',
      description: `${rules.name} cycle limit exceeded: ${(cycleOnDutyMinutes / 60).toFixed(1)}h of ${rules.cycleHours}h used`,
      severity: 'violation',
      hoursOver: overMinutes / 60,
    });
  } else if (cycleOnDutyMinutes > cycleLimit - hoursToMinutes(4)) {
    violations.push({
      rule: 'SOR/2005-313 s.13',
      description: `Approaching ${rules.name} cycle limit: ${(cycleOnDutyMinutes / 60).toFixed(1)}h of ${rules.cycleHours}h used`,
      severity: 'warning',
    });
  }

  // Mandatory reset check (must take 24h off every 14 days)
  const mandatoryResetDeadline = lastResetDate
    ? addDays(lastResetDate, rules.mandatoryResetDays)
    : null;

  if (mandatoryResetDeadline) {
    const deadlineDate = new Date(mandatoryResetDeadline);
    const nowDate = new Date(now);
    if (nowDate > deadlineDate) {
      violations.push({
        rule: 'SOR/2005-313 s.14',
        description: `Mandatory ${rules.resetHours}h reset period overdue. Last reset: ${lastResetDate}. Required every ${rules.mandatoryResetDays} days.`,
        severity: 'violation',
      });
    } else {
      const daysUntil = (deadlineDate.getTime() - nowDate.getTime()) / 86_400_000;
      if (daysUntil <= 2) {
        violations.push({
          rule: 'SOR/2005-313 s.14',
          description: `Mandatory ${rules.resetHours}h reset required within ${daysUntil.toFixed(1)} days`,
          severity: 'warning',
        });
      }
    }
  }

  // -----------------------------------------------------------------------
  // 5. Assemble result
  // -----------------------------------------------------------------------

  return {
    drivingRemaining: Math.max(0, drivingLimit - shiftDrivingMinutes),
    onDutyRemaining: Math.max(0, onDutyLimit - shiftOnDutyMinutes),
    cycleRemaining: Math.max(0, cycleLimit - cycleOnDutyMinutes),
    currentCycle: cycle,
    cycleHoursUsed: cycleOnDutyMinutes,
    lastResetDate,
    nextRequiredReset: mandatoryResetDeadline,
    offDutyIn24h,
    consecutiveOffDuty: longestConsecutiveOffDuty24h,
    violations,
    isCompliant: violations.filter(v => v.severity === 'violation').length === 0,
  };
}

// ---------------------------------------------------------------------------
// Jurisdiction detection
// ---------------------------------------------------------------------------

export function detectJurisdiction(
  origin: { state?: string; province?: string; country?: string },
  destination: { state?: string; province?: string; country?: string },
): 'US' | 'CA' | 'MX' {
  const normalize = (s?: string) => (s ?? '').toUpperCase().trim();

  const originCountry = normalize(origin.country);
  const destCountry = normalize(destination.country);
  const originRegion = normalize(origin.state) || normalize(origin.province);
  const destRegion = normalize(destination.state) || normalize(destination.province);

  // Explicit country codes
  if (originCountry === 'CA' || originCountry === 'CAN' || originCountry === 'CANADA') return 'CA';
  if (destCountry === 'CA' || destCountry === 'CAN' || destCountry === 'CANADA') return 'CA';

  if (originCountry === 'MX' || originCountry === 'MEX' || originCountry === 'MEXICO') return 'MX';
  if (destCountry === 'MX' || destCountry === 'MEX' || destCountry === 'MEXICO') return 'MX';

  // Infer from province/state codes
  if (CANADIAN_JURISDICTIONS.has(originRegion) || CANADIAN_JURISDICTIONS.has(destRegion)) {
    return 'CA';
  }

  // Mexican state detection (only when BC context is clearly Mexican)
  if (MEXICAN_STATES.has(originRegion) && !CANADIAN_JURISDICTIONS.has(originRegion)) return 'MX';
  if (MEXICAN_STATES.has(destRegion) && !CANADIAN_JURISDICTIONS.has(destRegion)) return 'MX';

  return 'US';
}

// ---------------------------------------------------------------------------
// Compare US vs CA rules (informational utility)
// ---------------------------------------------------------------------------

export interface RulesComparison {
  rule: string;
  us: string;
  canada: string;
  note: string;
}

export function getUSvsCAComparison(): RulesComparison[] {
  return [
    {
      rule: 'Daily driving limit',
      us: '11 hours',
      canada: '13 hours',
      note: 'Canada allows 2 more hours of driving',
    },
    {
      rule: 'On-duty limit',
      us: '14-hour window from shift start',
      canada: '14 hours cumulative on-duty time',
      note: 'US uses a window; Canada accumulates actual on-duty time',
    },
    {
      rule: 'Off-duty requirement',
      us: '10 consecutive hours',
      canada: '8h total in 24h (including 2h consecutive block)',
      note: 'Canada allows split off-duty with minimums',
    },
    {
      rule: '30-minute break',
      us: 'Required after 8h driving',
      canada: 'Not required',
      note: 'FMCSA rule does not apply in Canada',
    },
    {
      rule: 'Cycle option 1',
      us: '60h/7d or 70h/8d',
      canada: '70h/7d',
      note: 'Different cycle structures',
    },
    {
      rule: 'Cycle option 2',
      us: 'N/A (only 1 pair)',
      canada: '120h/14d',
      note: 'Canada offers a longer cycle option',
    },
    {
      rule: 'Cycle reset',
      us: '34h restart (with two 1-5am periods)',
      canada: '24h off-duty, mandatory every 14 days',
      note: 'Different reset mechanisms',
    },
    {
      rule: 'Sleeper berth',
      us: '7/3 or 8/2 split',
      canada: 'Part of off-duty; flexible splits meeting 8h/2h rule',
      note: 'Canada is more flexible',
    },
    {
      rule: 'ELD mandate',
      us: 'Required since Dec 2019 (49 CFR 395.8)',
      canada: 'Required since June 2021 (SOR/2019-165)',
      note: 'Both countries now require ELDs',
    },
  ];
}

// ---------------------------------------------------------------------------
// Singleton wrapper for consistent API across service engines
// ---------------------------------------------------------------------------

class CanadianHOSEngine {
  calculate(logs: DutyLogEntry[], cycle: 1 | 2 = 1): CanadianHOSStatus {
    return calculateCanadianHOS(logs, cycle);
  }

  detectJurisdiction(
    origin: { state?: string; province?: string; country?: string },
    destination: { state?: string; province?: string; country?: string },
  ): 'US' | 'CA' | 'MX' {
    return detectJurisdiction(origin, destination);
  }

  getRules(cycle: 1 | 2 = 1): CycleRules {
    return cycle === 1 ? CANADIAN_HOS_RULES.CYCLE_1 : CANADIAN_HOS_RULES.CYCLE_2;
  }

  getComparison(): RulesComparison[] {
    return getUSvsCAComparison();
  }
}

export const canadianHosEngine = new CanadianHOSEngine();
export default canadianHosEngine;
