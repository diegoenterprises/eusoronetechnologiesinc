/**
 * MEXICAN HOURS OF SERVICE ENGINE
 * Implements NOM-087-SCT/SICT-2-2017 (Norma Oficial Mexicana)
 * "Que establece los tiempos de conduccion y descanso para conductores
 *  de vehiculos de autotransporte federal"
 *
 * Key rules (different from US 49 CFR 395 and Canadian SOR/2005-313):
 *  - 14h driving limit per 24h period
 *  - No separate "on-duty not driving" distinction in NOM-087
 *  - 30-minute mandatory rest after 5h continuous driving
 *  - 8h minimum continuous rest in every 24h period
 *  - 7-day cycle: 72h max driving in any 7-day period
 *  - 24h off-duty reset required every 7 days
 *  - Night driving restrictions on certain routes (NOM-012 supplement)
 *  - Bitacora electronica (electronic logbook) mandatory since 2024
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type DutyStatus = 'driving' | 'on-duty' | 'off-duty' | 'sleeper';

export interface DutyLogEntry {
  status: DutyStatus;
  startTime: string; // ISO-8601
  endTime: string;   // ISO-8601
  location?: string;
  notes?: string;
}

export interface MexicanHOSStatus {
  drivingRemaining: number;       // minutes remaining in 24h
  continuousDriving: number;      // minutes since last 30-min break
  breakRequired: boolean;         // true if 30-min break needed now
  cycleRemaining: number;         // minutes remaining in 7-day cycle
  cycleHoursUsed: number;         // minutes used in 7-day cycle
  restIn24h: number;              // accumulated rest minutes in last 24h
  lastRestStart: string | null;   // ISO start of last qualifying rest
  nextRequiredReset: string | null;
  violations: MexicanHOSViolation[];
  isCompliant: boolean;
  bitacoraRequired: boolean;      // electronic logbook required
}

export interface MexicanHOSViolation {
  rule: string;
  description: string;
  severity: 'warning' | 'violation';
  hoursOver?: number;
}

// ─── Rule Constants (NOM-087-SCT/SICT-2) ────────────────────────────────────

export interface MexicanHOSRules {
  name: string;
  maxDrivingHours24h: number;     // max driving in any 24h period
  maxContinuousDriving: number;   // hours before mandatory break
  mandatoryBreakMinutes: number;  // minimum break after continuous driving
  minRestIn24h: number;           // hours of rest required per 24h
  cycleHours: number;             // max driving in cycle period
  cycleDays: number;              // cycle period in days
  resetHours: number;             // consecutive off-duty to reset cycle
}

export const MEXICAN_HOS_RULES: MexicanHOSRules = {
  name: 'NOM-087-SCT/SICT-2-2017',
  maxDrivingHours24h: 14,
  maxContinuousDriving: 5,
  mandatoryBreakMinutes: 30,
  minRestIn24h: 8,
  cycleHours: 72,
  cycleDays: 7,
  resetHours: 24,
};

// ─── Mexican States ─────────────────────────────────────────────────────────

export const MEXICAN_JURISDICTIONS = new Set([
  'AGS', 'BC', 'BCS', 'CAM', 'CHIS', 'CHIH', 'COAH', 'COL', 'CDMX', 'DGO',
  'GTO', 'GRO', 'HGO', 'JAL', 'MEX', 'MICH', 'MOR', 'NAY', 'NL', 'OAX',
  'PUE', 'QRO', 'QROO', 'SLP', 'SIN', 'SON', 'TAB', 'TAMPS', 'TLAX', 'VER',
  'YUC', 'ZAC',
]);

// NOM-012-SCT-2 restricted mountain routes (night driving prohibited 00:00-06:00)
export const RESTRICTED_NIGHT_ROUTES = [
  'Mexico City - Cuernavaca (La Pera)',
  'Mexico City - Puebla (Rio Frio)',
  'Durango - Mazatlan (Espinazo del Diablo)',
  'Saltillo - Monterrey (Los Chorros)',
  'Guadalajara - Tepic (Barranca)',
  'Oaxaca - Tuxtepec (La Cumbre)',
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function minutesBetween(start: string, end: string): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / 60_000;
}

function hoursToMinutes(h: number): number {
  return h * 60;
}

function subtractHours(iso: string, hours: number): Date {
  return new Date(new Date(iso).getTime() - hours * 3_600_000);
}

// ─── Core Calculation ───────────────────────────────────────────────────────

export function calculateMexicanHOS(logs: DutyLogEntry[]): MexicanHOSStatus {
  const rules = MEXICAN_HOS_RULES;
  const violations: MexicanHOSViolation[] = [];

  if (logs.length === 0) {
    return {
      drivingRemaining: hoursToMinutes(rules.maxDrivingHours24h),
      continuousDriving: 0,
      breakRequired: false,
      cycleRemaining: hoursToMinutes(rules.cycleHours),
      cycleHoursUsed: 0,
      restIn24h: 0,
      lastRestStart: null,
      nextRequiredReset: null,
      violations: [],
      isCompliant: true,
      bitacoraRequired: true,
    };
  }

  const sorted = [...logs].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  const now = sorted[sorted.length - 1].endTime;
  const twentyFourHoursAgo = subtractHours(now, 24);
  const sevenDaysAgo = subtractHours(now, rules.cycleDays * 24);

  // ─── 1. Driving in last 24h ────────────────────────────────────────────
  let drivingIn24h = 0;
  let restIn24h = 0;

  for (const entry of sorted) {
    const entryStart = new Date(entry.startTime);
    const entryEnd = new Date(entry.endTime);

    if (entryEnd <= twentyFourHoursAgo) continue;

    const effectiveStart = entryStart < twentyFourHoursAgo ? twentyFourHoursAgo : entryStart;
    const mins = (entryEnd.getTime() - effectiveStart.getTime()) / 60_000;

    if (entry.status === 'driving') {
      drivingIn24h += mins;
    } else if (entry.status === 'off-duty' || entry.status === 'sleeper') {
      restIn24h += mins;
    }
  }

  const drivingRemaining = Math.max(0, hoursToMinutes(rules.maxDrivingHours24h) - drivingIn24h);

  if (drivingIn24h > hoursToMinutes(rules.maxDrivingHours24h)) {
    violations.push({
      rule: 'NOM-087 Art. 5.1',
      description: `Exceeded ${rules.maxDrivingHours24h}h driving limit in 24h period`,
      severity: 'violation',
      hoursOver: (drivingIn24h - hoursToMinutes(rules.maxDrivingHours24h)) / 60,
    });
  }

  // ─── 2. Rest requirement (8h continuous in 24h) ────────────────────────
  let maxContinuousRest = 0;
  let lastRestStart: string | null = null;

  for (const entry of sorted) {
    if (entry.status === 'off-duty' || entry.status === 'sleeper') {
      const entryEnd = new Date(entry.endTime);
      if (entryEnd <= twentyFourHoursAgo) continue;
      const duration = minutesBetween(entry.startTime, entry.endTime);
      if (duration > maxContinuousRest) {
        maxContinuousRest = duration;
        lastRestStart = entry.startTime;
      }
    }
  }

  if (maxContinuousRest < hoursToMinutes(rules.minRestIn24h)) {
    violations.push({
      rule: 'NOM-087 Art. 5.3',
      description: `Less than ${rules.minRestIn24h}h continuous rest in 24h period (got ${(maxContinuousRest / 60).toFixed(1)}h)`,
      severity: 'violation',
    });
  }

  // ─── 3. Continuous driving (5h max, then 30-min break) ─────────────────
  let continuousDriving = 0;
  let breakRequired = false;

  for (let i = sorted.length - 1; i >= 0; i--) {
    const entry = sorted[i];
    if (entry.status === 'driving') {
      continuousDriving += minutesBetween(entry.startTime, entry.endTime);
    } else if (entry.status === 'off-duty' || entry.status === 'sleeper') {
      const duration = minutesBetween(entry.startTime, entry.endTime);
      if (duration >= rules.mandatoryBreakMinutes) {
        break; // Found qualifying break
      }
    }
  }

  if (continuousDriving >= hoursToMinutes(rules.maxContinuousDriving)) {
    breakRequired = true;
    violations.push({
      rule: 'NOM-087 Art. 5.2',
      description: `${rules.mandatoryBreakMinutes}-minute break required after ${rules.maxContinuousDriving}h continuous driving`,
      severity: continuousDriving > hoursToMinutes(rules.maxContinuousDriving + 0.5) ? 'violation' : 'warning',
    });
  }

  // ─── 4. 7-day cycle (72h max) ──────────────────────────────────────────
  let cycleHoursUsed = 0;

  for (const entry of sorted) {
    const entryEnd = new Date(entry.endTime);
    if (entryEnd <= sevenDaysAgo) continue;
    if (entry.status === 'driving') {
      const entryStart = new Date(entry.startTime);
      const effectiveStart = entryStart < sevenDaysAgo ? sevenDaysAgo : entryStart;
      cycleHoursUsed += (entryEnd.getTime() - effectiveStart.getTime()) / 60_000;
    }
  }

  const cycleRemaining = Math.max(0, hoursToMinutes(rules.cycleHours) - cycleHoursUsed);

  if (cycleHoursUsed > hoursToMinutes(rules.cycleHours)) {
    violations.push({
      rule: 'NOM-087 Art. 5.4',
      description: `Exceeded ${rules.cycleHours}h driving limit in ${rules.cycleDays}-day cycle`,
      severity: 'violation',
      hoursOver: (cycleHoursUsed - hoursToMinutes(rules.cycleHours)) / 60,
    });
  }

  // ─── 5. Weekly reset check ─────────────────────────────────────────────
  let hasWeeklyReset = false;
  let nextRequiredReset: string | null = null;

  for (const entry of sorted) {
    if (entry.status === 'off-duty' || entry.status === 'sleeper') {
      const duration = minutesBetween(entry.startTime, entry.endTime);
      if (duration >= hoursToMinutes(rules.resetHours)) {
        hasWeeklyReset = true;
        const resetEnd = new Date(entry.endTime);
        const nextReset = new Date(resetEnd.getTime() + rules.cycleDays * 24 * 3_600_000);
        nextRequiredReset = nextReset.toISOString();
      }
    }
  }

  if (!hasWeeklyReset && cycleHoursUsed > hoursToMinutes(rules.cycleHours * 0.8)) {
    violations.push({
      rule: 'NOM-087 Art. 5.5',
      description: `${rules.resetHours}h cycle reset required within ${rules.cycleDays}-day period`,
      severity: 'warning',
    });
  }

  return {
    drivingRemaining,
    continuousDriving,
    breakRequired,
    cycleRemaining,
    cycleHoursUsed,
    restIn24h,
    lastRestStart,
    nextRequiredReset,
    violations,
    isCompliant: violations.filter(v => v.severity === 'violation').length === 0,
    bitacoraRequired: true,
  };
}

// ─── Vehicle Configuration Rules (NOM-012-SCT-2-2017) ───────────────────────

export interface MexicanVehicleConfig {
  code: string;
  description: string;
  maxGVW_kg: number;
  maxLength_m: number;
  axles: number;
  requiresSpecialPermit: boolean;
}

export const MEXICAN_VEHICLE_CONFIGS: MexicanVehicleConfig[] = [
  { code: 'C2', description: 'Camion unitario 2 ejes', maxGVW_kg: 19000, maxLength_m: 14, axles: 2, requiresSpecialPermit: false },
  { code: 'C3', description: 'Camion unitario 3 ejes', maxGVW_kg: 27000, maxLength_m: 14, axles: 3, requiresSpecialPermit: false },
  { code: 'T3-S2', description: 'Tractocamion 3 ejes - Semirremolque 2 ejes', maxGVW_kg: 46500, maxLength_m: 23, axles: 5, requiresSpecialPermit: false },
  { code: 'T3-S3', description: 'Tractocamion 3 ejes - Semirremolque 3 ejes', maxGVW_kg: 54500, maxLength_m: 23, axles: 6, requiresSpecialPermit: false },
  { code: 'T3-S2-R4', description: 'Tractocamion doble remolque', maxGVW_kg: 75500, maxLength_m: 31, axles: 9, requiresSpecialPermit: true },
  { code: 'T3-S2-R2', description: 'Full trailer combination', maxGVW_kg: 66500, maxLength_m: 28.5, axles: 7, requiresSpecialPermit: true },
];

// ─── SCT License Types ──────────────────────────────────────────────────────

export interface SCTLicenseType {
  category: string;
  description: string;
  vehicleTypes: string[];
  hazmatAllowed: boolean;
}

export const SCT_LICENSE_TYPES: SCTLicenseType[] = [
  { category: 'A', description: 'Conductor de vehiculos ligeros', vehicleTypes: ['light'], hazmatAllowed: false },
  { category: 'B', description: 'Conductor de vehiculos pesados', vehicleTypes: ['C2', 'C3'], hazmatAllowed: false },
  { category: 'C', description: 'Conductor de tractocamiones articulados', vehicleTypes: ['T3-S2', 'T3-S3'], hazmatAllowed: false },
  { category: 'D', description: 'Conductor de dobles articulados', vehicleTypes: ['T3-S2-R4', 'T3-S2-R2'], hazmatAllowed: false },
  { category: 'E', description: 'Conductor de materiales peligrosos', vehicleTypes: ['T3-S2', 'T3-S3', 'T3-S2-R4'], hazmatAllowed: true },
];

// ─── Validation Helpers ─────────────────────────────────────────────────────

export function isInMexico(jurisdiction: string): boolean {
  return MEXICAN_JURISDICTIONS.has(jurisdiction.toUpperCase().trim());
}

export function getVehicleConfig(code: string): MexicanVehicleConfig | undefined {
  return MEXICAN_VEHICLE_CONFIGS.find(v => v.code === code);
}

export function requiresSpecialPermit(vehicleCode: string): boolean {
  const config = getVehicleConfig(vehicleCode);
  return config?.requiresSpecialPermit ?? false;
}

export function validateSCTLicense(licenseCategory: string, vehicleCode: string, isHazmat: boolean): {
  valid: boolean;
  reason?: string;
} {
  const license = SCT_LICENSE_TYPES.find(l => l.category === licenseCategory.toUpperCase());
  if (!license) {
    return { valid: false, reason: `Unknown SCT license category: ${licenseCategory}` };
  }

  if (isHazmat && !license.hazmatAllowed) {
    return { valid: false, reason: `SCT license category ${licenseCategory} does not allow hazmat transport. Category E required.` };
  }

  const vehicle = getVehicleConfig(vehicleCode);
  if (vehicle && !license.vehicleTypes.includes(vehicleCode)) {
    return { valid: false, reason: `SCT license category ${licenseCategory} does not cover vehicle type ${vehicleCode}` };
  }

  return { valid: true };
}
