/**
 * EUSOTRIP UNIT CONVERSION LIBRARY
 * Phase 0 - Cross-Border Audit Gap #3, #38, #51
 * US -> imperial | CA/MX -> metric
 */

export type UnitSystem = 'imperial' | 'metric';
export type CountryCode = 'US' | 'CA' | 'MX';
export type MeasureType = 'weight' | 'distance' | 'volume' | 'temperature' | 'dim_small' | 'dim_large';

export const COUNTRY_UNIT_SYSTEM: Record<CountryCode, UnitSystem> = {
  US: 'imperial', CA: 'metric', MX: 'metric',
};

const LBS_PER_KG = 2.20462;
const MI_PER_KM = 0.621371;
const GAL_PER_L = 0.264172;
const IN_PER_CM = 0.393701;
const FT_PER_M = 3.28084;

export const lbsToKg = (v: number) => v / LBS_PER_KG;
export const kgToLbs = (v: number) => v * LBS_PER_KG;
export const milesToKm = (v: number) => v / MI_PER_KM;
export const kmToMiles = (v: number) => v * MI_PER_KM;
export const gallonsToLitres = (v: number) => v / GAL_PER_L;
export const litresToGallons = (v: number) => v * GAL_PER_L;
export const fahrenheitToCelsius = (f: number) => (f - 32) * (5 / 9);
export const celsiusToFahrenheit = (c: number) => c * (9 / 5) + 32;
export const inchesToCm = (v: number) => v / IN_PER_CM;
export const cmToInches = (v: number) => v * IN_PER_CM;
export const feetToMeters = (v: number) => v / FT_PER_M;
export const metersToFeet = (v: number) => v * FT_PER_M;

// Freight rate conversions
export const ratePerMileToPerKm = (rpm: number) => rpm * MI_PER_KM;
export const ratePerKmToPerMile = (rpk: number) => rpk / MI_PER_KM;
export const mpgToKmPerL = (mpg: number) => mpg * (MI_PER_KM / GAL_PER_L);
export const kmPerLToMpg = (kpl: number) => kpl / (MI_PER_KM / GAL_PER_L);
export const lPer100kmToMpg = (l: number) => l === 0 ? Infinity : 235.215 / l;
export const mpgToLPer100km = (m: number) => m === 0 ? Infinity : 235.215 / m;

// Generic converter
export function convert(value: number, measure: MeasureType, from: UnitSystem, to: UnitSystem): number {
  if (from === to) return value;
  const toMetric = from === 'imperial';
  switch (measure) {
    case 'weight': return toMetric ? lbsToKg(value) : kgToLbs(value);
    case 'distance': return toMetric ? milesToKm(value) : kmToMiles(value);
    case 'volume': return toMetric ? gallonsToLitres(value) : litresToGallons(value);
    case 'temperature': return toMetric ? fahrenheitToCelsius(value) : celsiusToFahrenheit(value);
    case 'dim_small': return toMetric ? inchesToCm(value) : cmToInches(value);
    case 'dim_large': return toMetric ? feetToMeters(value) : metersToFeet(value);
    default: return value;
  }
}

export function unitLabel(measure: MeasureType, system: UnitSystem): string {
  const labels: Record<MeasureType, [string, string]> = {
    weight: ['lbs', 'kg'],
    distance: ['mi', 'km'],
    volume: ['gal', 'L'],
    temperature: ['F', 'C'],
    dim_small: ['in', 'cm'],
    dim_large: ['ft', 'm'],
  };
  return system === 'imperial' ? labels[measure][0] : labels[measure][1];
}

export function formatWithUnit(value: number, measure: MeasureType, system: UnitSystem, decimals = 1): string {
  return value.toFixed(decimals) + ' ' + unitLabel(measure, system);
}

// GVW limits per country
export interface GVWLimit {
  country: CountryCode;
  maxGVW_kg: number;
  maxGVW_lbs: number;
  axleConfig: string;
  notes: string;
}

export const GVW_LIMITS: GVWLimit[] = [
  { country: 'US', maxGVW_kg: 36287, maxGVW_lbs: 80000, axleConfig: '5-axle semi', notes: 'Federal Bridge Formula (23 USC 127)' },
  { country: 'CA', maxGVW_kg: 63500, maxGVW_lbs: 139993, axleConfig: '8-axle B-train', notes: 'Transport Canada MOU' },
  { country: 'MX', maxGVW_kg: 75500, maxGVW_lbs: 166449, axleConfig: 'T3-S2-R4 double', notes: 'NOM-012-SCT-2-2017' },
];

export const CA_PROVINCIAL_WEIGHTS: Array<{ province: string; maxGVW_kg: number }> = [
  { province: 'ON', maxGVW_kg: 63500 }, { province: 'QC', maxGVW_kg: 62500 },
  { province: 'AB', maxGVW_kg: 63500 }, { province: 'BC', maxGVW_kg: 63500 },
  { province: 'MB', maxGVW_kg: 62500 }, { province: 'SK', maxGVW_kg: 62500 },
  { province: 'NB', maxGVW_kg: 62500 }, { province: 'NS', maxGVW_kg: 62500 },
  { province: 'PE', maxGVW_kg: 57600 }, { province: 'NL', maxGVW_kg: 62500 },
];

export function getGVWLimit(country: CountryCode): GVWLimit {
  return GVW_LIMITS.find(g => g.country === country) || GVW_LIMITS[0];
}

export function isOverweight(weightLbs: number, country: CountryCode): boolean {
  return weightLbs > getGVWLimit(country).maxGVW_lbs;
}
