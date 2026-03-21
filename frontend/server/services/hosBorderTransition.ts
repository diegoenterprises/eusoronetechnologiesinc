/**
 * HOS BORDER TRANSITION ENGINE
 * Phase 1 - Cross-Border Audit P0 Blocker #8
 * Auto-switches HOS ruleset when driver crosses US/CA/MX borders.
 * Clock does NOT reset - remaining time carries over.
 * The MORE RESTRICTIVE rule applies during transition.
 */

import { calculateCanadianHOS, type CanadianHOSStatus } from './canadianHosEngine';
import { calculateMexicanHOS, type MexicanHOSStatus } from './mexicanHosEngine';
import { logger } from '../_core/logger';

export type HOSCountry = 'US' | 'CA' | 'MX';
export type DutyStatus = 'driving' | 'on-duty' | 'off-duty' | 'sleeper';

export interface DutyLogEntry {
  status: DutyStatus;
  startTime: string;
  endTime: string;
  location?: string;
  notes?: string;
  country?: HOSCountry;
}

export interface BorderCrossing {
  timestamp: string;
  fromCountry: HOSCountry;
  toCountry: HOSCountry;
  portOfEntry: string;
  lat: number;
  lng: number;
  eManifestId?: string;
}

export interface TransitionHOSResult {
  activeCountry: HOSCountry;
  activeRuleset: string;
  effectiveDrivingRemaining: number;
  effectiveOnDutyRemaining: number;
  effectiveCycleRemaining: number;
  breakRequired: boolean;
  isCompliant: boolean;
  transitionWarnings: string[];
  recentCrossings: BorderCrossing[];
}


// -- Border Port of Entry Coordinates --
interface PortCoord { name: string; lat: number; lng: number; border: 'US-CA' | 'US-MX'; }

const BORDER_PORTS: PortCoord[] = [
  { name: 'Ambassador Bridge', lat: 42.312, lng: -83.074, border: 'US-CA' },
  { name: 'Blue Water Bridge', lat: 42.999, lng: -82.421, border: 'US-CA' },
  { name: 'Peace Bridge', lat: 42.907, lng: -78.904, border: 'US-CA' },
  { name: 'Thousand Islands', lat: 44.361, lng: -75.977, border: 'US-CA' },
  { name: 'Champlain-Lacolle', lat: 45.007, lng: -73.451, border: 'US-CA' },
  { name: 'Pacific Highway', lat: 49.002, lng: -122.756, border: 'US-CA' },
  { name: 'Queenston-Lewiston', lat: 43.155, lng: -79.048, border: 'US-CA' },
  { name: 'Coutts-Sweetgrass', lat: 49.000, lng: -111.970, border: 'US-CA' },
  { name: 'Emerson-Pembina', lat: 49.000, lng: -97.239, border: 'US-CA' },
  { name: 'World Trade Bridge (Laredo)', lat: 27.508, lng: -99.507, border: 'US-MX' },
  { name: 'BOTA (El Paso-Juarez)', lat: 31.758, lng: -106.453, border: 'US-MX' },
  { name: 'Otay Mesa-Tijuana', lat: 32.552, lng: -116.938, border: 'US-MX' },
  { name: 'Pharr-Reynosa', lat: 26.164, lng: -98.179, border: 'US-MX' },
  { name: 'Eagle Pass-Piedras Negras', lat: 28.710, lng: -100.497, border: 'US-MX' },
  { name: 'Nogales-Nogales', lat: 31.333, lng: -110.942, border: 'US-MX' },
  { name: 'Brownsville-Matamoros', lat: 25.899, lng: -97.497, border: 'US-MX' },
  { name: 'Calexico-Mexicali', lat: 32.665, lng: -115.499, border: 'US-MX' },
  { name: 'Colombia-Solidarity', lat: 27.831, lng: -99.853, border: 'US-MX' },
];

const BORDER_BUFFER_KM = 25;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestPort(lat: number, lng: number): { port: PortCoord; distanceKm: number } | null {
  let nearest: PortCoord | null = null;
  let minDist = Infinity;
  for (const port of BORDER_PORTS) {
    const d = haversineKm(lat, lng, port.lat, port.lng);
    if (d < minDist) { minDist = d; nearest = port; }
  }
  return nearest ? { port: nearest, distanceKm: minDist } : null;
}

export function isNearBorder(lat: number, lng: number): boolean {
  const r = findNearestPort(lat, lng);
  return r !== null && r.distanceKm <= BORDER_BUFFER_KM;
}

export function detectCountryFromCoords(lat: number, lng: number): HOSCountry {
  if (lat < 32.7 && lng > -117 && lng < -86) return 'MX';
  if (lat > 48.5 && lng > -141 && lng < -52) return 'CA';
  if (lat < 26.5 && lng > -100 && lng < -97) return 'MX';
  return 'US';
}


// -- US HOS Rules (49 CFR 395) --
const US_RULES = {
  name: '49 CFR Part 395',
  maxDriving: 11 * 60,   // 660 min
  maxOnDuty: 14 * 60,    // 840 min window
  cycleHours: 70 * 60,   // 4200 min / 8 days
  breakAfter: 8 * 60,    // 30-min break after 8h
};

const CA_RULESET = 'SOR/2005-313';
const MX_RULESET = 'NOM-087-SCT/SICT-2';

// -- Core Transition Logic --

export function computeTransitionHOS(
  logs: DutyLogEntry[],
  currentCountry: HOSCountry,
  crossings: BorderCrossing[] = [],
): TransitionHOSResult {
  const warnings: string[] = [];

  // Determine ruleset name
  const rulesetName = currentCountry === 'US' ? US_RULES.name
    : currentCountry === 'CA' ? CA_RULESET : MX_RULESET;

  if (logs.length === 0) {
    const maxDriving = currentCountry === 'US' ? US_RULES.maxDriving
      : currentCountry === 'CA' ? 13 * 60 : 14 * 60;
    return {
      activeCountry: currentCountry,
      activeRuleset: rulesetName,
      effectiveDrivingRemaining: maxDriving,
      effectiveOnDutyRemaining: currentCountry === 'US' ? US_RULES.maxOnDuty : 14 * 60,
      effectiveCycleRemaining: currentCountry === 'US' ? US_RULES.cycleHours : currentCountry === 'CA' ? 70 * 60 : 72 * 60,
      breakRequired: false,
      isCompliant: true,
      transitionWarnings: [],
      recentCrossings: crossings,
    };
  }

  // Calculate status under each country's rules
  const caLogs = logs.map(l => ({ status: l.status, startTime: l.startTime, endTime: l.endTime, location: l.location, notes: l.notes }));
  const mxLogs = caLogs;

  const caStatus = calculateCanadianHOS(caLogs, 1);
  const mxStatus = calculateMexicanHOS(mxLogs);

  // Simple US HOS calculation
  const sorted = [...logs].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const now = sorted[sorted.length - 1].endTime;
  const nowMs = new Date(now).getTime();

  let usDriving = 0;
  let usOnDuty = 0;
  let usCycle = 0;
  const windowStart = nowMs - 14 * 3_600_000;
  const eightDaysAgo = nowMs - 8 * 24 * 3_600_000;

  for (const e of sorted) {
    const eStart = new Date(e.startTime).getTime();
    const eEnd = new Date(e.endTime).getTime();
    if (eEnd > windowStart && e.status === 'driving') {
      usDriving += (eEnd - Math.max(eStart, windowStart)) / 60_000;
    }
    if (eEnd > windowStart && (e.status === 'driving' || e.status === 'on-duty')) {
      usOnDuty += (eEnd - Math.max(eStart, windowStart)) / 60_000;
    }
    if (eEnd > eightDaysAgo && (e.status === 'driving' || e.status === 'on-duty')) {
      usCycle += (eEnd - Math.max(eStart, eightDaysAgo)) / 60_000;
    }
  }

  const usStatus = {
    drivingRemaining: Math.max(0, US_RULES.maxDriving - usDriving),
    onDutyRemaining: Math.max(0, US_RULES.maxOnDuty - usOnDuty),
    cycleRemaining: Math.max(0, US_RULES.cycleHours - usCycle),
  };

  // Apply most restrictive rule
  const drivingValues = [usStatus.drivingRemaining, caStatus.drivingRemaining, mxStatus.drivingRemaining];
  const effectiveDriving = Math.min(...drivingValues);

  const onDutyValues = [usStatus.onDutyRemaining, caStatus.onDutyRemaining, mxStatus.drivingRemaining];
  const effectiveOnDuty = Math.min(...onDutyValues);

  const cycleValues = [usStatus.cycleRemaining, caStatus.cycleRemaining, mxStatus.cycleRemaining];
  const effectiveCycle = Math.min(...cycleValues);

  const breakRequired = mxStatus.breakRequired || caStatus.violations.some(v => v.rule.includes('break'));

  // Check if any country's rules are violated
  const isCompliant = caStatus.isCompliant && mxStatus.isCompliant &&
    usStatus.drivingRemaining >= 0 && usStatus.onDutyRemaining >= 0;

  // Generate transition warnings
  if (crossings.length > 0) {
    const lastCrossing = crossings[crossings.length - 1];
    warnings.push(`Last border crossing: ${lastCrossing.portOfEntry} (${lastCrossing.fromCountry} -> ${lastCrossing.toCountry})`);

    if (currentCountry === 'MX') {
      warnings.push('Bitacora electronica (electronic logbook) required under NOM-087');
    }
    if (currentCountry === 'CA') {
      warnings.push('Canadian ELD mandate active - verify device compliance with SOR/2005-313');
    }
  }

  // Warn if different rulesets give very different remaining times
  const maxDiff = Math.max(...drivingValues) - Math.min(...drivingValues);
  if (maxDiff > 120) {
    warnings.push(`HOS rules differ by ${Math.round(maxDiff / 60)}h between countries - using most restrictive`);
  }

  return {
    activeCountry: currentCountry,
    activeRuleset: rulesetName,
    effectiveDrivingRemaining: effectiveDriving,
    effectiveOnDutyRemaining: effectiveOnDuty,
    effectiveCycleRemaining: effectiveCycle,
    breakRequired,
    isCompliant,
    transitionWarnings: warnings,
    recentCrossings: crossings,
  };
}

// -- Detect border crossing from GPS breadcrumbs --

export function detectBorderCrossing(
  previousLat: number, previousLng: number,
  currentLat: number, currentLng: number,
): BorderCrossing | null {
  const prevCountry = detectCountryFromCoords(previousLat, previousLng);
  const currCountry = detectCountryFromCoords(currentLat, currentLng);

  if (prevCountry === currCountry) return null;

  const nearest = findNearestPort(currentLat, currentLng);
  const portName = nearest && nearest.distanceKm < 50 ? nearest.port.name : 'Unknown Port';

  logger.info(`[HOSBorderTransition] Border crossing detected: ${prevCountry} -> ${currCountry} at ${portName}`);

  return {
    timestamp: new Date().toISOString(),
    fromCountry: prevCountry,
    toCountry: currCountry,
    portOfEntry: portName,
    lat: currentLat,
    lng: currentLng,
  };
}

// -- Get applicable HOS rule summary for a country --

export function getHOSRuleSummary(country: HOSCountry): {
  ruleset: string;
  maxDrivingHours: number;
  maxOnDutyHours: number;
  cycleHours: number;
  cycleDays: number;
  mandatoryBreak: string;
  restRequirement: string;
} {
  switch (country) {
    case 'US':
      return {
        ruleset: '49 CFR Part 395',
        maxDrivingHours: 11,
        maxOnDutyHours: 14,
        cycleHours: 70,
        cycleDays: 8,
        mandatoryBreak: '30 min after 8h driving',
        restRequirement: '10h consecutive off-duty',
      };
    case 'CA':
      return {
        ruleset: 'SOR/2005-313',
        maxDrivingHours: 13,
        maxOnDutyHours: 14,
        cycleHours: 70,
        cycleDays: 7,
        mandatoryBreak: 'No federal 30-min rule',
        restRequirement: '8h off-duty (2h consecutive) in 24h',
      };
    case 'MX':
      return {
        ruleset: 'NOM-087-SCT/SICT-2',
        maxDrivingHours: 14,
        maxOnDutyHours: 14,
        cycleHours: 72,
        cycleDays: 7,
        mandatoryBreak: '30 min after 5h continuous driving',
        restRequirement: '8h continuous rest in 24h',
      };
  }
}
