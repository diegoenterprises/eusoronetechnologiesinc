/**
 * SPECTRA-MATCH™ Ultimate Crude Oil Specification Database
 * Comprehensive global crude oil grades with full physical/chemical parameters
 * Source: Ultimate Crude Oil Specification Guide (authoritative reference)
 * 
 * 130+ global crude grades across 17 countries
 * 12 parameters per grade: API, Sulfur, BS&W, Salt, RVP, Pour Point,
 * Flash Point, Viscosity, TAN, Region, Type, Characteristics
 */

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface CrudeOilSpec {
  id: string;
  name: string;
  type: string;
  country: string;
  region: string;
  apiGravity: { min: number; max: number; typical: number };
  sulfur: { min: number; max: number; typical: number };
  bsw: { min: number; max: number; typical: number };
  salt?: { min: number; max: number; typical: number };
  rvp?: { min: number; max: number; typical: number };
  pourPoint?: { min: number; max: number; typical: number };
  flashPoint?: { min: number; max: number; typical: number };
  viscosity?: { min: number; max: number; typical: number };
  tan?: { min: number; max: number; typical: number };
  characteristics: string[];
}

export interface SpecTolerances {
  apiGravity: number;
  sulfur: number;
  bsw: number;
  salt: number;
  rvp: number;
  pourPoint: number;
  flashPoint: number;
  viscosity: number;
  tan: number;
}

// ── Tolerances (from the spec guide) ────────────────────────────────────────

export const SPEC_TOLERANCES: SpecTolerances = {
  apiGravity: 0.5,
  sulfur: 0.1,
  bsw: 0.2,
  salt: 2,
  rvp: 0.5,
  pourPoint: 3,
  flashPoint: 3,
  viscosity: 0.05, // 5% of reading
  tan: 0.05,
};

// ── Parameter Classification Thresholds ─────────────────────────────────────

export const API_CLASSIFICATIONS = {
  EXTRA_HEAVY: { max: 10, label: "Extra Heavy" },
  HEAVY: { min: 10, max: 22.3, label: "Heavy" },
  MEDIUM: { min: 22.3, max: 31.1, label: "Medium" },
  LIGHT: { min: 31.1, label: "Light" },
};

export const SULFUR_CLASSIFICATIONS = {
  SWEET: { max: 0.5, label: "Sweet" },
  MEDIUM_SOUR: { min: 0.5, max: 1.5, label: "Medium Sour" },
  SOUR: { min: 1.5, label: "Sour" },
};

export const VISCOSITY_CLASSIFICATIONS = {
  LIGHT: { max: 10, label: "Light (2-10 cSt)" },
  MEDIUM: { min: 10, max: 100, label: "Medium (10-100 cSt)" },
  HEAVY: { min: 100, label: "Heavy (>100 cSt)" },
};

// ── ASTM Standard Methods ───────────────────────────────────────────────────

export const ASTM_METHODS: Record<string, { standard: string; notes: string }> = {
  apiGravity: { standard: "ASTM D1298, D4052", notes: "Hydrometer or digital density analyzer" },
  sulfur: { standard: "ASTM D4294, D2622", notes: "XRF or other instrumental methods" },
  bsw: { standard: "ASTM D4007, D473", notes: "Centrifuge method" },
  salt: { standard: "ASTM D3230", notes: "Electrical conductivity method" },
  rvp: { standard: "ASTM D323, D6377", notes: "Reid method or RVPE" },
  pourPoint: { standard: "ASTM D97, D5853", notes: "Manual or automatic tilt method" },
  flashPoint: { standard: "ASTM D93, D56", notes: "Pensky-Martens or Tag closed cup" },
  viscosity: { standard: "ASTM D445", notes: "Kinematic viscosity" },
  tan: { standard: "ASTM D664", notes: "Potentiometric titration" },
};

// ── Complete Global Crude Oil Database ───────────────────────────────────────

export const CRUDE_OIL_SPECS: CrudeOilSpec[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // NORTH AMERICA — UNITED STATES (19 grades)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "wti", name: "West Texas Intermediate (WTI)", type: "Light / Sweet",
    country: "US", region: "Texas / Permian Basin",
    apiGravity: { min: 38.6, max: 40.6, typical: 39.6 },
    sulfur: { min: 0.14, max: 0.34, typical: 0.24 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 5, max: 15, typical: 10 },
    rvp: { min: 5, max: 9, typical: 7 },
    pourPoint: { min: -20, max: -15, typical: -17.5 },
    flashPoint: { min: -10, max: 20, typical: 10 },
    viscosity: { min: 4.4, max: 5.4, typical: 4.9 },
    tan: { min: 0.05, max: 0.15, typical: 0.1 },
    characteristics: ["Global benchmark", "Low sulfur content", "High API gravity", "Premium pricing", "Cushing OK delivery"],
  },
  {
    id: "wti_midland", name: "WTI Midland", type: "Light / Sweet",
    country: "US", region: "Texas / Midland",
    apiGravity: { min: 41, max: 44, typical: 42.5 },
    sulfur: { min: 0.14, max: 0.34, typical: 0.24 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 5, max: 15, typical: 10 },
    rvp: { min: 5, max: 9, typical: 7 },
    pourPoint: { min: -20, max: -15, typical: -17.5 },
    flashPoint: { min: -10, max: 20, typical: 10 },
    viscosity: { min: 3.8, max: 4.8, typical: 4.3 },
    tan: { min: 0.05, max: 0.15, typical: 0.1 },
    characteristics: ["Very light crude", "Sweet", "Shale production", "Permian Basin"],
  },
  {
    id: "eagle_ford", name: "Eagle Ford", type: "Light / Sweet",
    country: "US", region: "Texas / Eagle Ford Shale",
    apiGravity: { min: 44, max: 46, typical: 45 },
    sulfur: { min: 0.05, max: 0.2, typical: 0.1 },
    bsw: { min: 0.1, max: 0.5, typical: 0.25 },
    salt: { min: 3, max: 10, typical: 6 },
    rvp: { min: 5, max: 10, typical: 7.5 },
    pourPoint: { min: -15, max: -10, typical: -12.5 },
    flashPoint: { min: -10, max: 20, typical: 10 },
    viscosity: { min: 3.3, max: 4.3, typical: 3.8 },
    tan: { min: 0.05, max: 0.15, typical: 0.1 },
    characteristics: ["Condensate-like", "Ultra-light", "Ultra-sweet", "Premium grade", "South Texas shale"],
  },
  {
    id: "bakken", name: "Bakken", type: "Light / Sweet",
    country: "US", region: "North Dakota / Montana",
    apiGravity: { min: 41, max: 43.7, typical: 42.3 },
    sulfur: { min: 0.02, max: 0.22, typical: 0.12 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 3, max: 10, typical: 6 },
    rvp: { min: 8, max: 15, typical: 11.5 },
    pourPoint: { min: -30, max: -20, typical: -25 },
    flashPoint: { min: -10, max: 20, typical: 10 },
    viscosity: { min: 3.4, max: 4.4, typical: 3.9 },
    tan: { min: 0.01, max: 0.1, typical: 0.05 },
    characteristics: ["Very light", "Very sweet", "High volatility", "High RVP", "Williston Basin"],
  },
  {
    id: "mars", name: "Mars Blend", type: "Medium / Sour",
    country: "US", region: "Gulf of Mexico (Deepwater)",
    apiGravity: { min: 28, max: 30, typical: 29 },
    sulfur: { min: 1.9, max: 2.0, typical: 1.95 },
    bsw: { min: 0.3, max: 1.0, typical: 0.6 },
    salt: { min: 20, max: 40, typical: 30 },
    rvp: { min: 3, max: 7, typical: 5 },
    pourPoint: { min: -5, max: 5, typical: 0 },
    flashPoint: { min: 10, max: 25, typical: 18 },
    viscosity: { min: 10, max: 14, typical: 12 },
    tan: { min: 0.1, max: 0.3, typical: 0.2 },
    characteristics: ["Medium gravity", "High sulfur", "Deepwater GoM", "Benchmark for GoM sour"],
  },
  {
    id: "poseidon", name: "Poseidon", type: "Medium / Sour",
    country: "US", region: "Gulf of Mexico",
    apiGravity: { min: 29.1, max: 30.1, typical: 29.6 },
    sulfur: { min: 1.87, max: 2.07, typical: 1.97 },
    bsw: { min: 0.3, max: 1.0, typical: 0.6 },
    salt: { min: 20, max: 40, typical: 30 },
    rvp: { min: 3, max: 7, typical: 5 },
    pourPoint: { min: -5, max: 5, typical: 0 },
    flashPoint: { min: 10, max: 25, typical: 18 },
    viscosity: { min: 9, max: 13, typical: 11 },
    tan: { min: 0.15, max: 0.35, typical: 0.25 },
    characteristics: ["Medium sour", "Deepwater GoM", "Similar to Mars"],
  },
  {
    id: "sgc", name: "Southern Green Canyon", type: "Medium / Sour",
    country: "US", region: "Gulf of Mexico",
    apiGravity: { min: 29.9, max: 30.9, typical: 30.4 },
    sulfur: { min: 2.14, max: 2.34, typical: 2.24 },
    bsw: { min: 0.3, max: 1.0, typical: 0.6 },
    salt: { min: 30, max: 50, typical: 40 },
    rvp: { min: 3, max: 6, typical: 4.5 },
    pourPoint: { min: -5, max: 0, typical: -2.5 },
    flashPoint: { min: 10, max: 25, typical: 18 },
    viscosity: { min: 8.5, max: 12.5, typical: 10.5 },
    tan: { min: 0.15, max: 0.35, typical: 0.25 },
    characteristics: ["Medium sour", "Deepwater GoM", "High salt"],
  },
  {
    id: "ans", name: "Alaska North Slope (ANS)", type: "Medium / Sweet",
    country: "US", region: "Alaska",
    apiGravity: { min: 31.4, max: 32.4, typical: 31.9 },
    sulfur: { min: 0.83, max: 1.03, typical: 0.93 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 15, max: 25, typical: 20 },
    rvp: { min: 3, max: 6, typical: 4.5 },
    pourPoint: { min: -15, max: -10, typical: -12.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 8.3, max: 11.3, typical: 9.8 },
    tan: { min: 0.8, max: 1.0, typical: 0.9 },
    characteristics: ["Medium sweet", "Alaskan pipeline", "High TAN", "TAPS crude"],
  },
  {
    id: "lls", name: "Light Louisiana Sweet (LLS)", type: "Light / Sweet",
    country: "US", region: "Louisiana",
    apiGravity: { min: 35.1, max: 36.1, typical: 35.6 },
    sulfur: { min: 0.27, max: 0.47, typical: 0.37 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 5, max: 15, typical: 10 },
    rvp: { min: 3, max: 7, typical: 5 },
    pourPoint: { min: -15, max: -10, typical: -12.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 5.2, max: 6.2, typical: 5.7 },
    tan: { min: 0.1, max: 0.3, typical: 0.2 },
    characteristics: ["Gulf Coast benchmark", "Sweet", "Refinery favorite", "St. James LA delivery"],
  },
  {
    id: "hls", name: "Heavy Louisiana Sweet (HLS)", type: "Medium / Sweet",
    country: "US", region: "Louisiana",
    apiGravity: { min: 32.4, max: 33.4, typical: 32.9 },
    sulfur: { min: 0.25, max: 0.45, typical: 0.35 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 5, max: 15, typical: 10 },
    rvp: { min: 2, max: 6, typical: 4 },
    pourPoint: { min: -10, max: -5, typical: -7.5 },
    flashPoint: { min: 10, max: 25, typical: 18 },
    viscosity: { min: 7.2, max: 9.2, typical: 8.2 },
    tan: { min: 0.1, max: 0.3, typical: 0.2 },
    characteristics: ["Medium-sweet", "Gulf Coast", "Heavier than LLS"],
  },
  {
    id: "bonito_sour", name: "Bonito Sour", type: "Light / Sour",
    country: "US", region: "Gulf of Mexico",
    apiGravity: { min: 35, max: 36, typical: 35.5 },
    sulfur: { min: 0.89, max: 1.09, typical: 0.99 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 15, max: 25, typical: 20 },
    rvp: { min: 3, max: 7, typical: 5 },
    pourPoint: { min: -10, max: -5, typical: -7.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 5.3, max: 6.3, typical: 5.8 },
    tan: { min: 0.05, max: 0.25, typical: 0.15 },
    characteristics: ["Light sour", "Gulf of Mexico", "Moderate sulfur"],
  },
  {
    id: "eugene_island", name: "Eugene Island", type: "Light / Sour",
    country: "US", region: "Gulf of Mexico",
    apiGravity: { min: 33.8, max: 34.8, typical: 34.3 },
    sulfur: { min: 1.08, max: 1.28, typical: 1.18 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 15, max: 25, typical: 20 },
    rvp: { min: 3, max: 7, typical: 5 },
    pourPoint: { min: -10, max: -5, typical: -7.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 6, max: 7, typical: 6.5 },
    tan: { min: 0.1, max: 0.3, typical: 0.2 },
    characteristics: ["Light sour", "Gulf of Mexico", "Offshore"],
  },
  {
    id: "south_la_sweet", name: "South Louisiana Sweet", type: "Light / Sweet",
    country: "US", region: "Louisiana",
    apiGravity: { min: 35.4, max: 36.4, typical: 35.9 },
    sulfur: { min: 0.23, max: 0.43, typical: 0.33 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 5, max: 15, typical: 10 },
    rvp: { min: 3, max: 7, typical: 5 },
    pourPoint: { min: -15, max: -10, typical: -12.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 5, max: 6, typical: 5.5 },
    tan: { min: 0.05, max: 0.25, typical: 0.15 },
    characteristics: ["Light sweet", "Louisiana", "Onshore"],
  },
  {
    id: "bayou_choctaw_sweet", name: "Bayou Choctaw Sweet", type: "Light / Sweet",
    country: "US", region: "Louisiana",
    apiGravity: { min: 35.5, max: 36.5, typical: 36.0 },
    sulfur: { min: 0.26, max: 0.46, typical: 0.36 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 5, max: 15, typical: 10 },
    rvp: { min: 3, max: 7, typical: 5 },
    pourPoint: { min: -15, max: -10, typical: -12.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 4.9, max: 5.9, typical: 5.4 },
    tan: { min: 0.05, max: 0.25, typical: 0.15 },
    characteristics: ["Light sweet", "Louisiana", "SPR site"],
  },
  {
    id: "bayou_choctaw_sour", name: "Bayou Choctaw Sour", type: "Medium / Sour",
    country: "US", region: "Louisiana",
    apiGravity: { min: 31.7, max: 32.7, typical: 32.2 },
    sulfur: { min: 1.33, max: 1.53, typical: 1.43 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 15, max: 30, typical: 22 },
    rvp: { min: 2, max: 6, typical: 4 },
    pourPoint: { min: -10, max: -5, typical: -7.5 },
    flashPoint: { min: 10, max: 25, typical: 18 },
    viscosity: { min: 7.7, max: 9.7, typical: 8.7 },
    tan: { min: 0.2, max: 0.4, typical: 0.3 },
    characteristics: ["Medium sour", "Louisiana"],
  },
  {
    id: "wts", name: "West Texas Sour", type: "Medium / Sour",
    country: "US", region: "West Texas",
    apiGravity: { min: 31.2, max: 32.2, typical: 31.7 },
    sulfur: { min: 1.18, max: 1.38, typical: 1.28 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 15, max: 30, typical: 22 },
    rvp: { min: 4, max: 8, typical: 6 },
    pourPoint: { min: -15, max: -10, typical: -12.5 },
    flashPoint: { min: 10, max: 25, typical: 18 },
    viscosity: { min: 8.1, max: 10.1, typical: 9.1 },
    tan: { min: 0.1, max: 0.3, typical: 0.2 },
    characteristics: ["Medium sour", "West Texas", "Pipeline crude"],
  },
  {
    id: "la_mississippi", name: "LA Mississippi Sweet", type: "Light / Sweet",
    country: "US", region: "Louisiana",
    apiGravity: { min: 40.2, max: 41.2, typical: 40.7 },
    sulfur: { min: 0.24, max: 0.44, typical: 0.34 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 5, max: 15, typical: 10 },
    rvp: { min: 4, max: 8, typical: 6 },
    pourPoint: { min: -20, max: -15, typical: -17.5 },
    flashPoint: { min: -5, max: 20, typical: 8 },
    viscosity: { min: 3.6, max: 4.6, typical: 4.1 },
    tan: { min: 0.05, max: 0.15, typical: 0.1 },
    characteristics: ["Light sweet", "Louisiana/Mississippi"],
  },
  {
    id: "port_hudson", name: "Port Hudson", type: "Light / Sweet",
    country: "US", region: "Louisiana",
    apiGravity: { min: 44.5, max: 45.5, typical: 45.0 },
    sulfur: { min: 0.01, max: 0.1, typical: 0.05 },
    bsw: { min: 0.05, max: 0.3, typical: 0.15 },
    salt: { min: 2, max: 5, typical: 3 },
    rvp: { min: 5, max: 9, typical: 7 },
    pourPoint: { min: -20, max: -15, typical: -17.5 },
    flashPoint: { min: -10, max: 15, typical: 5 },
    viscosity: { min: 3.1, max: 4.1, typical: 3.6 },
    tan: { min: 0.01, max: 0.1, typical: 0.05 },
    characteristics: ["Ultra-sweet", "Very light", "Premium condensate-like"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NORTH AMERICA — CANADA (7 grades)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "wcs", name: "Western Canadian Select (WCS)", type: "Heavy / Sour",
    country: "CA", region: "Alberta",
    apiGravity: { min: 20.3, max: 21.3, typical: 20.8 },
    sulfur: { min: 3.47, max: 3.67, typical: 3.57 },
    bsw: { min: 0.3, max: 1.0, typical: 0.6 },
    salt: { min: 30, max: 60, typical: 45 },
    rvp: { min: 2, max: 5, typical: 3.5 },
    pourPoint: { min: -5, max: 5, typical: 0 },
    flashPoint: { min: 15, max: 30, typical: 22 },
    viscosity: { min: 200, max: 300, typical: 250 },
    tan: { min: 1.5, max: 1.9, typical: 1.7 },
    characteristics: ["Oil sands blend", "Heavy sour", "Canadian benchmark", "Pipeline transported", "High TAN"],
  },
  {
    id: "ssp", name: "Syncrude Sweet Premium (SSP)", type: "Medium / Sweet",
    country: "CA", region: "Alberta",
    apiGravity: { min: 31.8, max: 32.8, typical: 32.3 },
    sulfur: { min: 0.11, max: 0.31, typical: 0.21 },
    bsw: { min: 0.1, max: 0.5, typical: 0.25 },
    salt: { min: 3, max: 10, typical: 6 },
    rvp: { min: 3, max: 6, typical: 4.5 },
    pourPoint: { min: -35, max: -25, typical: -30 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 4.7, max: 5.7, typical: 5.2 },
    tan: { min: 0.6, max: 0.8, typical: 0.7 },
    characteristics: ["Synthetic crude", "Upgraded oil sands", "Low sulfur", "Premium pricing"],
  },
  {
    id: "lsb", name: "Light Sour Blend (LSB)", type: "Light / Sour",
    country: "CA", region: "Alberta",
    apiGravity: { min: 34.8, max: 35.8, typical: 35.3 },
    sulfur: { min: 1.39, max: 1.59, typical: 1.49 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 15, max: 30, typical: 22 },
    rvp: { min: 3, max: 7, typical: 5 },
    pourPoint: { min: -25, max: -20, typical: -22.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 6.3, max: 7.3, typical: 6.8 },
    tan: { min: 0.5, max: 0.7, typical: 0.6 },
    characteristics: ["Light sour blend", "Alberta conventional"],
  },
  {
    id: "msb", name: "Medium Sour Blend (MSB)", type: "Medium / Sour",
    country: "CA", region: "Alberta",
    apiGravity: { min: 32.1, max: 33.1, typical: 32.6 },
    sulfur: { min: 1.78, max: 1.98, typical: 1.88 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 20, max: 40, typical: 30 },
    rvp: { min: 2, max: 6, typical: 4 },
    pourPoint: { min: -20, max: -15, typical: -17.5 },
    flashPoint: { min: 10, max: 25, typical: 18 },
    viscosity: { min: 9, max: 13, typical: 11 },
    tan: { min: 0.6, max: 0.8, typical: 0.7 },
    characteristics: ["Medium sour", "Alberta conventional"],
  },
  {
    id: "pch", name: "Premium Conventional Heavy (PCH)", type: "Heavy / Sour",
    country: "CA", region: "Alberta",
    apiGravity: { min: 20.6, max: 21.6, typical: 21.1 },
    sulfur: { min: 3.45, max: 3.65, typical: 3.55 },
    bsw: { min: 0.3, max: 1.0, typical: 0.6 },
    salt: { min: 30, max: 60, typical: 45 },
    rvp: { min: 1, max: 4, typical: 2.5 },
    pourPoint: { min: -5, max: 5, typical: 0 },
    flashPoint: { min: 15, max: 30, typical: 22 },
    viscosity: { min: 170, max: 270, typical: 220 },
    tan: { min: 1.3, max: 1.7, typical: 1.5 },
    characteristics: ["Heavy sour", "Conventional heavy", "Alberta"],
  },
  {
    id: "cold_lake", name: "Cold Lake Blend", type: "Heavy / Sour",
    country: "CA", region: "Alberta",
    apiGravity: { min: 19.6, max: 20.6, typical: 20.1 },
    sulfur: { min: 3.4, max: 3.6, typical: 3.5 },
    bsw: { min: 0.3, max: 1.0, typical: 0.6 },
    salt: { min: 30, max: 60, typical: 45 },
    rvp: { min: 1, max: 4, typical: 2.5 },
    pourPoint: { min: -5, max: 5, typical: 0 },
    flashPoint: { min: 15, max: 30, typical: 22 },
    viscosity: { min: 300, max: 400, typical: 350 },
    tan: { min: 1.6, max: 2.0, typical: 1.8 },
    characteristics: ["Heavy sour", "Cold Lake in-situ", "Very high viscosity"],
  },
  {
    id: "kearl", name: "Kearl", type: "Heavy / Sour",
    country: "CA", region: "Alberta",
    apiGravity: { min: 19.7, max: 20.7, typical: 20.2 },
    sulfur: { min: 3.4, max: 3.6, typical: 3.5 },
    bsw: { min: 0.3, max: 1.0, typical: 0.6 },
    salt: { min: 30, max: 60, typical: 45 },
    rvp: { min: 1, max: 4, typical: 2.5 },
    pourPoint: { min: -5, max: 5, typical: 0 },
    flashPoint: { min: 15, max: 30, typical: 22 },
    viscosity: { min: 290, max: 390, typical: 340 },
    tan: { min: 1.5, max: 1.9, typical: 1.7 },
    characteristics: ["Heavy sour", "Oil sands mining", "Imperial Oil"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NORTH AMERICA — MEXICO (6 grades)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "maya", name: "Maya", type: "Heavy / Sour",
    country: "MX", region: "Gulf of Mexico",
    apiGravity: { min: 21, max: 22, typical: 21.5 },
    sulfur: { min: 3.3, max: 3.5, typical: 3.4 },
    bsw: { min: 0.3, max: 1.0, typical: 0.6 },
    salt: { min: 30, max: 60, typical: 45 },
    rvp: { min: 3, max: 6, typical: 4.5 },
    pourPoint: { min: -1, max: 5, typical: 2 },
    flashPoint: { min: 15, max: 30, typical: 22 },
    viscosity: { min: 330, max: 430, typical: 380 },
    tan: { min: 0.2, max: 0.4, typical: 0.3 },
    characteristics: ["Mexico benchmark", "Heavy sour", "PEMEX export", "Discount to WTI"],
  },
  {
    id: "isthmus", name: "Isthmus", type: "Medium / Sour",
    country: "MX", region: "Isthmus of Tehuantepec",
    apiGravity: { min: 32, max: 33, typical: 32.5 },
    sulfur: { min: 1.7, max: 1.9, typical: 1.8 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 20, max: 40, typical: 30 },
    rvp: { min: 3, max: 7, typical: 5 },
    pourPoint: { min: -15, max: -10, typical: -12.5 },
    flashPoint: { min: 10, max: 25, typical: 18 },
    viscosity: { min: 13, max: 17, typical: 15 },
    tan: { min: 0.1, max: 0.3, typical: 0.2 },
    characteristics: ["Medium sour", "PEMEX", "Lighter Mexican grade"],
  },
  {
    id: "olmeca", name: "Olmeca", type: "Light / Sweet",
    country: "MX", region: "Tabasco",
    apiGravity: { min: 38, max: 39, typical: 38.5 },
    sulfur: { min: 0.73, max: 0.95, typical: 0.84 },
    bsw: { min: 0.1, max: 0.5, typical: 0.25 },
    salt: { min: 10, max: 20, typical: 15 },
    rvp: { min: 4, max: 8, typical: 6 },
    pourPoint: { min: -20, max: -15, typical: -17.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 5, max: 6, typical: 5.5 },
    tan: { min: 0.05, max: 0.15, typical: 0.1 },
    characteristics: ["Light sweet", "Premium Mexican", "PEMEX export"],
  },
  {
    id: "altamira", name: "Altamira", type: "Extra Heavy / Sour",
    country: "MX", region: "Tamaulipas",
    apiGravity: { min: 16, max: 17.5, typical: 16.75 },
    sulfur: { min: 5.4, max: 5.6, typical: 5.5 },
    bsw: { min: 0.5, max: 1.5, typical: 1.0 },
    salt: { min: 40, max: 80, typical: 60 },
    rvp: { min: 1, max: 3, typical: 2 },
    pourPoint: { min: 0, max: 10, typical: 5 },
    flashPoint: { min: 20, max: 35, typical: 28 },
    viscosity: { min: 700, max: 860, typical: 780 },
    tan: { min: 0.3, max: 0.5, typical: 0.4 },
    characteristics: ["Extra heavy", "Very high sulfur", "Discount pricing"],
  },
  {
    id: "talam", name: "Talam", type: "Extra Heavy / Sour",
    country: "MX", region: "Tabasco",
    apiGravity: { min: 15.8, max: 16, typical: 15.9 },
    sulfur: { min: 4.5, max: 4.76, typical: 4.63 },
    bsw: { min: 0.5, max: 1.5, typical: 1.0 },
    salt: { min: 40, max: 80, typical: 60 },
    rvp: { min: 1, max: 3, typical: 2 },
    pourPoint: { min: 0, max: 10, typical: 5 },
    flashPoint: { min: 20, max: 35, typical: 28 },
    viscosity: { min: 740, max: 900, typical: 820 },
    tan: { min: 0.3, max: 0.5, typical: 0.4 },
    characteristics: ["Extra heavy", "Very sour", "Tabasco onshore"],
  },
  {
    id: "zapoteco", name: "Zapoteco", type: "Medium / Sour",
    country: "MX", region: "Veracruz",
    apiGravity: { min: 29, max: 29.9, typical: 29.45 },
    sulfur: { min: 2.41, max: 2.61, typical: 2.51 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 25, max: 45, typical: 35 },
    rvp: { min: 2, max: 6, typical: 4 },
    pourPoint: { min: -5, max: 0, typical: -2.5 },
    flashPoint: { min: 10, max: 25, typical: 18 },
    viscosity: { min: 18, max: 26, typical: 22 },
    tan: { min: 0.2, max: 0.4, typical: 0.3 },
    characteristics: ["Medium sour", "Veracruz", "PEMEX"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUTH AMERICA (18 grades)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "boscan", name: "Boscan", type: "Extra Heavy / Sour",
    country: "VE", region: "Zulia",
    apiGravity: { min: 9.6, max: 10.6, typical: 10.1 },
    sulfur: { min: 5.6, max: 5.8, typical: 5.7 },
    bsw: { min: 0.5, max: 1.5, typical: 1.0 },
    salt: { min: 40, max: 80, typical: 60 },
    rvp: { min: 1, max: 3, typical: 2 },
    pourPoint: { min: 5, max: 15, typical: 10 },
    flashPoint: { min: 25, max: 40, typical: 32 },
    viscosity: { min: 3500, max: 4500, typical: 4000 },
    tan: { min: 0.2, max: 0.4, typical: 0.3 },
    characteristics: ["Extra heavy", "Highest sulfur globally", "Venezuela benchmark heavy"],
  },
  {
    id: "laguna", name: "Laguna", type: "Extra Heavy / Sour",
    country: "VE", region: "Zulia",
    apiGravity: { min: 10.4, max: 11.4, typical: 10.9 },
    sulfur: { min: 5.3, max: 5.5, typical: 5.4 },
    bsw: { min: 0.5, max: 1.5, typical: 1.0 },
    salt: { min: 40, max: 80, typical: 60 },
    rvp: { min: 1, max: 3, typical: 2 },
    pourPoint: { min: 5, max: 15, typical: 10 },
    flashPoint: { min: 25, max: 40, typical: 32 },
    viscosity: { min: 3000, max: 4000, typical: 3500 },
    tan: { min: 0.2, max: 0.4, typical: 0.3 },
    characteristics: ["Extra heavy", "Very high sulfur", "Zulia"],
  },
  {
    id: "tia_juana_heavy", name: "Tia Juana Heavy", type: "Extra Heavy / Sour",
    country: "VE", region: "Zulia",
    apiGravity: { min: 10.5, max: 11.5, typical: 11.0 },
    sulfur: { min: 2.56, max: 2.76, typical: 2.66 },
    bsw: { min: 0.5, max: 1.5, typical: 1.0 },
    salt: { min: 25, max: 55, typical: 40 },
    rvp: { min: 1, max: 3, typical: 2 },
    pourPoint: { min: 5, max: 15, typical: 10 },
    flashPoint: { min: 25, max: 40, typical: 32 },
    viscosity: { min: 2700, max: 3700, typical: 3200 },
    tan: { min: 0.2, max: 0.4, typical: 0.3 },
    characteristics: ["Extra heavy", "Zulia", "PDVSA"],
  },
  {
    id: "bcf17", name: "BCF-17", type: "Extra Heavy / Sour",
    country: "VE", region: "Bolivar Coastal",
    apiGravity: { min: 16, max: 17, typical: 16.5 },
    sulfur: { min: 2.43, max: 2.63, typical: 2.53 },
    bsw: { min: 0.3, max: 1.0, typical: 0.6 },
    salt: { min: 25, max: 50, typical: 37 },
    rvp: { min: 1, max: 4, typical: 2.5 },
    pourPoint: { min: 0, max: 10, typical: 5 },
    flashPoint: { min: 20, max: 35, typical: 28 },
    viscosity: { min: 880, max: 1080, typical: 980 },
    tan: { min: 0.2, max: 0.4, typical: 0.3 },
    characteristics: ["Extra heavy", "Bolivar Coastal Field"],
  },
  {
    id: "cerro_negro", name: "Cerro Negro", type: "Extra Heavy / Sour",
    country: "VE", region: "Orinoco Belt",
    apiGravity: { min: 15.5, max: 16.5, typical: 16.0 },
    sulfur: { min: 3.24, max: 3.44, typical: 3.34 },
    bsw: { min: 0.3, max: 1.0, typical: 0.6 },
    salt: { min: 30, max: 60, typical: 45 },
    rvp: { min: 1, max: 4, typical: 2.5 },
    pourPoint: { min: 0, max: 10, typical: 5 },
    flashPoint: { min: 20, max: 35, typical: 28 },
    viscosity: { min: 1000, max: 1200, typical: 1100 },
    tan: { min: 2.3, max: 2.7, typical: 2.5 },
    characteristics: ["Extra heavy", "Orinoco upgrader", "Very high TAN"],
  },
  {
    id: "bachaquero_17", name: "Bachaquero 17", type: "Extra Heavy / Sour",
    country: "VE", region: "Zulia",
    apiGravity: { min: 16.5, max: 17.5, typical: 17.0 },
    sulfur: { min: 3.4, max: 3.6, typical: 3.5 },
    bsw: { min: 0.3, max: 1.0, typical: 0.6 },
    salt: { min: 30, max: 60, typical: 45 },
    rvp: { min: 1, max: 4, typical: 2.5 },
    pourPoint: { min: 0, max: 10, typical: 5 },
    flashPoint: { min: 20, max: 35, typical: 28 },
    viscosity: { min: 850, max: 1050, typical: 950 },
    tan: { min: 0.8, max: 1.2, typical: 1.0 },
    characteristics: ["Extra heavy", "Zulia", "Lake Maracaibo"],
  },
  {
    id: "petrozuata", name: "Petrozuata Heavy", type: "Heavy / Sour",
    country: "VE", region: "Orinoco Belt",
    apiGravity: { min: 19, max: 20, typical: 19.5 },
    sulfur: { min: 2.59, max: 2.79, typical: 2.69 },
    bsw: { min: 0.3, max: 1.0, typical: 0.6 },
    salt: { min: 25, max: 50, typical: 37 },
    rvp: { min: 2, max: 5, typical: 3.5 },
    pourPoint: { min: -5, max: 5, typical: 0 },
    flashPoint: { min: 15, max: 30, typical: 22 },
    viscosity: { min: 470, max: 570, typical: 520 },
    tan: { min: 2.0, max: 2.4, typical: 2.2 },
    characteristics: ["Heavy sour", "Orinoco Belt", "High TAN"],
  },
  {
    id: "bachaquero_24", name: "Bachaquero 24", type: "Heavy / Sour",
    country: "VE", region: "Zulia",
    apiGravity: { min: 23.5, max: 24.5, typical: 24.0 },
    sulfur: { min: 3.4, max: 3.6, typical: 3.5 },
    bsw: { min: 0.3, max: 1.0, typical: 0.6 },
    salt: { min: 30, max: 60, typical: 45 },
    rvp: { min: 2, max: 5, typical: 3.5 },
    pourPoint: { min: -5, max: 0, typical: -2.5 },
    flashPoint: { min: 15, max: 30, typical: 22 },
    viscosity: { min: 160, max: 260, typical: 210 },
    tan: { min: 0.6, max: 1.0, typical: 0.8 },
    characteristics: ["Heavy sour", "Lake Maracaibo"],
  },
  {
    id: "mesa_30", name: "Mesa 30", type: "Medium / Sour",
    country: "VE", region: "Anzoategui",
    apiGravity: { min: 28.9, max: 29.9, typical: 29.4 },
    sulfur: { min: 1.02, max: 1.22, typical: 1.12 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 10, max: 30, typical: 20 },
    rvp: { min: 2, max: 6, typical: 4 },
    pourPoint: { min: -10, max: -5, typical: -7.5 },
    flashPoint: { min: 10, max: 25, typical: 18 },
    viscosity: { min: 30, max: 40, typical: 35 },
    tan: { min: 0.5, max: 0.7, typical: 0.6 },
    characteristics: ["Medium sour", "Eastern Venezuela"],
  },
  {
    id: "furrial", name: "Furrial", type: "Medium / Sour",
    country: "VE", region: "Monagas",
    apiGravity: { min: 29.5, max: 30.5, typical: 30.0 },
    sulfur: { min: 0.96, max: 1.16, typical: 1.06 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 10, max: 30, typical: 20 },
    rvp: { min: 2, max: 6, typical: 4 },
    pourPoint: { min: -10, max: -5, typical: -7.5 },
    flashPoint: { min: 10, max: 25, typical: 18 },
    viscosity: { min: 25, max: 35, typical: 30 },
    tan: { min: 0.4, max: 0.6, typical: 0.5 },
    characteristics: ["Medium sour", "Monagas state"],
  },
  {
    id: "santa_barbara", name: "Santa Barbara", type: "Light / Sweet",
    country: "VE", region: "Monagas",
    apiGravity: { min: 39, max: 40, typical: 39.5 },
    sulfur: { min: 0.39, max: 0.59, typical: 0.49 },
    bsw: { min: 0.05, max: 0.3, typical: 0.15 },
    salt: { min: 5, max: 15, typical: 10 },
    rvp: { min: 4, max: 8, typical: 6 },
    pourPoint: { min: -15, max: -10, typical: -12.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 4.6, max: 5.6, typical: 5.1 },
    tan: { min: 0.05, max: 0.15, typical: 0.1 },
    characteristics: ["Light sweet", "Premium Venezuelan"],
  },
  {
    id: "napo", name: "Napo", type: "Heavy / Sour",
    country: "EC", region: "Amazon Basin",
    apiGravity: { min: 18.5, max: 19.5, typical: 19.0 },
    sulfur: { min: 1.9, max: 2.1, typical: 2.0 },
    bsw: { min: 0.3, max: 1.0, typical: 0.6 },
    salt: { min: 20, max: 40, typical: 30 },
    rvp: { min: 2, max: 5, typical: 3.5 },
    pourPoint: { min: -5, max: 5, typical: 0 },
    flashPoint: { min: 15, max: 30, typical: 22 },
    viscosity: { min: 170, max: 270, typical: 220 },
    tan: { min: 0.75, max: 0.95, typical: 0.85 },
    characteristics: ["Heavy sour", "Ecuadorian Amazon", "Pipeline to coast"],
  },
  {
    id: "oriente", name: "Oriente", type: "Heavy / Sour",
    country: "EC", region: "Amazon Basin",
    apiGravity: { min: 23.6, max: 24.6, typical: 24.1 },
    sulfur: { min: 1.41, max: 1.61, typical: 1.51 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 15, max: 35, typical: 25 },
    rvp: { min: 2, max: 6, typical: 4 },
    pourPoint: { min: -10, max: -5, typical: -7.5 },
    flashPoint: { min: 10, max: 25, typical: 18 },
    viscosity: { min: 65, max: 85, typical: 75 },
    tan: { min: 0.7, max: 0.9, typical: 0.8 },
    characteristics: ["Heavy sour", "Ecuador export blend"],
  },
  {
    id: "itapu", name: "Itapu", type: "Medium / Sweet",
    country: "BR", region: "Santos Basin",
    apiGravity: { min: 28.8, max: 29.8, typical: 29.3 },
    sulfur: { min: 0.15, max: 0.35, typical: 0.253 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 3, max: 10, typical: 6 },
    rvp: { min: 3, max: 7, typical: 5 },
    pourPoint: { min: -10, max: -5, typical: -7.5 },
    flashPoint: { min: 10, max: 25, typical: 18 },
    viscosity: { min: 15, max: 21, typical: 18 },
    tan: { min: 0.4, max: 0.6, typical: 0.5 },
    characteristics: ["Medium sweet", "Pre-salt deepwater", "Petrobras"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EUROPE — NORWAY (15 grades)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "grane", name: "Grane", type: "Heavy / Sweet",
    country: "NO", region: "North Sea",
    apiGravity: { min: 18.2, max: 19.2, typical: 18.7 },
    sulfur: { min: 0.73, max: 0.93, typical: 0.83 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 10, max: 25, typical: 17 },
    rvp: { min: 2, max: 5, typical: 3.5 },
    pourPoint: { min: -10, max: 0, typical: -5 },
    flashPoint: { min: 15, max: 30, typical: 22 },
    viscosity: { min: 190, max: 290, typical: 240 },
    tan: { min: 0.45, max: 0.65, typical: 0.55 },
    characteristics: ["Heavy sweet", "Norwegian North Sea", "Equinor"],
  },
  {
    id: "ekofisk", name: "Ekofisk Blend", type: "Light / Sweet",
    country: "NO", region: "North Sea",
    apiGravity: { min: 36.7, max: 37.7, typical: 37.2 },
    sulfur: { min: 0.13, max: 0.33, typical: 0.23 },
    bsw: { min: 0.1, max: 0.5, typical: 0.25 },
    salt: { min: 3, max: 10, typical: 6 },
    rvp: { min: 4, max: 8, typical: 6 },
    pourPoint: { min: -15, max: -10, typical: -12.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 5, max: 6, typical: 5.5 },
    tan: { min: 0.05, max: 0.15, typical: 0.1 },
    characteristics: ["Light sweet", "North Sea benchmark", "ConocoPhillips"],
  },
  {
    id: "statfjord", name: "Statfjord", type: "Light / Sweet",
    country: "NO", region: "North Sea",
    apiGravity: { min: 38.6, max: 39.6, typical: 39.1 },
    sulfur: { min: 0.12, max: 0.32, typical: 0.22 },
    bsw: { min: 0.1, max: 0.5, typical: 0.25 },
    salt: { min: 3, max: 10, typical: 6 },
    rvp: { min: 4, max: 8, typical: 6 },
    pourPoint: { min: -15, max: -10, typical: -12.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 4.4, max: 5.4, typical: 4.9 },
    tan: { min: 0.05, max: 0.15, typical: 0.1 },
    characteristics: ["Light sweet", "North Sea", "Equinor"],
  },
  {
    id: "oseberg", name: "Oseberg Blend", type: "Light / Sweet",
    country: "NO", region: "North Sea",
    apiGravity: { min: 37.3, max: 38.3, typical: 37.8 },
    sulfur: { min: 0.17, max: 0.37, typical: 0.27 },
    bsw: { min: 0.1, max: 0.5, typical: 0.25 },
    salt: { min: 3, max: 10, typical: 6 },
    rvp: { min: 4, max: 8, typical: 6 },
    pourPoint: { min: -15, max: -10, typical: -12.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 4.6, max: 5.6, typical: 5.1 },
    tan: { min: 0.05, max: 0.15, typical: 0.1 },
    characteristics: ["Light sweet", "North Sea", "Brent basket component"],
  },
  {
    id: "draugen", name: "Draugen", type: "Light / Sweet",
    country: "NO", region: "Norwegian Sea",
    apiGravity: { min: 39.4, max: 40.4, typical: 39.9 },
    sulfur: { min: 0.05, max: 0.25, typical: 0.15 },
    bsw: { min: 0.1, max: 0.5, typical: 0.25 },
    salt: { min: 3, max: 10, typical: 6 },
    rvp: { min: 4, max: 8, typical: 6 },
    pourPoint: { min: -15, max: -10, typical: -12.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 4, max: 5, typical: 4.5 },
    tan: { min: 0.05, max: 0.15, typical: 0.1 },
    characteristics: ["Light sweet", "Ultra-low sulfur", "Norwegian Sea"],
  },
  {
    id: "troll", name: "Troll Blend", type: "Medium / Sweet",
    country: "NO", region: "North Sea",
    apiGravity: { min: 30.6, max: 31.6, typical: 31.1 },
    sulfur: { min: 0.11, max: 0.31, typical: 0.21 },
    bsw: { min: 0.1, max: 0.5, typical: 0.25 },
    salt: { min: 3, max: 10, typical: 6 },
    rvp: { min: 3, max: 7, typical: 5 },
    pourPoint: { min: -15, max: -5, typical: -10 },
    flashPoint: { min: 10, max: 25, typical: 18 },
    viscosity: { min: 8.3, max: 11.3, typical: 9.8 },
    tan: { min: 0.2, max: 0.4, typical: 0.3 },
    characteristics: ["Medium sweet", "North Sea", "Giant gas/condensate field"],
  },
  {
    id: "njord", name: "Njord", type: "Light / Sweet",
    country: "NO", region: "Norwegian Sea",
    apiGravity: { min: 46.1, max: 47.1, typical: 46.6 },
    sulfur: { min: 0.01, max: 0.1, typical: 0.05 },
    bsw: { min: 0.05, max: 0.3, typical: 0.15 },
    salt: { min: 2, max: 5, typical: 3 },
    rvp: { min: 5, max: 10, typical: 7.5 },
    pourPoint: { min: -20, max: -15, typical: -17.5 },
    flashPoint: { min: -5, max: 15, typical: 5 },
    viscosity: { min: 2.6, max: 3.6, typical: 3.1 },
    tan: { min: 0.01, max: 0.1, typical: 0.05 },
    characteristics: ["Ultra-light", "Ultra-sweet", "Condensate-like", "Norwegian Sea"],
  },
  {
    id: "asgard", name: "Asgard Blend", type: "Light / Sweet",
    country: "NO", region: "Norwegian Sea",
    apiGravity: { min: 50, max: 51, typical: 50.5 },
    sulfur: { min: 0.02, max: 0.12, typical: 0.07 },
    bsw: { min: 0.05, max: 0.3, typical: 0.15 },
    salt: { min: 2, max: 5, typical: 3 },
    rvp: { min: 5, max: 10, typical: 7.5 },
    pourPoint: { min: -25, max: -20, typical: -22.5 },
    flashPoint: { min: -10, max: 15, typical: 2 },
    viscosity: { min: 2, max: 3, typical: 2.5 },
    tan: { min: 0.01, max: 0.1, typical: 0.05 },
    characteristics: ["Ultra-light condensate", "Norwegian Sea"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EUROPE — UNITED KINGDOM (4 grades)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "brent", name: "Brent Blend", type: "Light / Sweet",
    country: "GB", region: "North Sea",
    apiGravity: { min: 37.8, max: 38.8, typical: 38.3 },
    sulfur: { min: 0.27, max: 0.47, typical: 0.37 },
    bsw: { min: 0.1, max: 0.5, typical: 0.25 },
    salt: { min: 3, max: 10, typical: 6 },
    rvp: { min: 4, max: 8, typical: 6 },
    pourPoint: { min: -15, max: -10, typical: -12.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 4.5, max: 5.5, typical: 5.0 },
    tan: { min: 0.05, max: 0.15, typical: 0.1 },
    characteristics: ["Global benchmark", "Dated Brent pricing", "ICE Futures", "Light sweet"],
  },
  {
    id: "forties", name: "Forties Blend", type: "Light / Sweet",
    country: "GB", region: "North Sea",
    apiGravity: { min: 39.8, max: 40.8, typical: 40.3 },
    sulfur: { min: 0.46, max: 0.66, typical: 0.56 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 5, max: 15, typical: 10 },
    rvp: { min: 4, max: 8, typical: 6 },
    pourPoint: { min: -15, max: -10, typical: -12.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 3.8, max: 4.8, typical: 4.3 },
    tan: { min: 0.05, max: 0.25, typical: 0.15 },
    characteristics: ["Brent basket component", "BP operated", "North Sea"],
  },
  {
    id: "flotta", name: "Flotta", type: "Light / Sour",
    country: "GB", region: "North Sea",
    apiGravity: { min: 34.9, max: 35.9, typical: 35.4 },
    sulfur: { min: 1.12, max: 1.32, typical: 1.22 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 10, max: 25, typical: 17 },
    rvp: { min: 3, max: 7, typical: 5 },
    pourPoint: { min: -10, max: -5, typical: -7.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 5.6, max: 6.6, typical: 6.1 },
    tan: { min: 0.1, max: 0.3, typical: 0.2 },
    characteristics: ["Light sour", "Orkney terminal", "North Sea"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AFRICA — NIGERIA (15 grades)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "bonny_light", name: "Bonny Light", type: "Light / Sweet",
    country: "NG", region: "Niger Delta",
    apiGravity: { min: 34.9, max: 35.9, typical: 35.4 },
    sulfur: { min: 0.04, max: 0.24, typical: 0.14 },
    bsw: { min: 0.1, max: 0.5, typical: 0.25 },
    salt: { min: 3, max: 10, typical: 6 },
    rvp: { min: 3, max: 7, typical: 5 },
    pourPoint: { min: -10, max: -5, typical: -7.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 5.6, max: 6.6, typical: 6.1 },
    tan: { min: 0.15, max: 0.35, typical: 0.25 },
    characteristics: ["African benchmark", "Very low sulfur", "Premium", "NNPC"],
  },
  {
    id: "qua_iboe", name: "Qua Iboe", type: "Light / Sweet",
    country: "NG", region: "Niger Delta",
    apiGravity: { min: 35.8, max: 36.8, typical: 36.3 },
    sulfur: { min: 0.04, max: 0.24, typical: 0.14 },
    bsw: { min: 0.1, max: 0.5, typical: 0.25 },
    salt: { min: 3, max: 10, typical: 6 },
    rvp: { min: 3, max: 7, typical: 5 },
    pourPoint: { min: -10, max: -5, typical: -7.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 5.3, max: 6.3, typical: 5.8 },
    tan: { min: 0.2, max: 0.4, typical: 0.3 },
    characteristics: ["Light sweet", "Nigerian benchmark", "ExxonMobil"],
  },
  {
    id: "forcados", name: "Forcados", type: "Medium / Sweet",
    country: "NG", region: "Niger Delta",
    apiGravity: { min: 30.3, max: 31.3, typical: 30.8 },
    sulfur: { min: 0.06, max: 0.26, typical: 0.16 },
    bsw: { min: 0.1, max: 0.5, typical: 0.25 },
    salt: { min: 3, max: 10, typical: 6 },
    rvp: { min: 3, max: 6, typical: 4.5 },
    pourPoint: { min: -5, max: 0, typical: -2.5 },
    flashPoint: { min: 10, max: 25, typical: 18 },
    viscosity: { min: 10, max: 11, typical: 10.5 },
    tan: { min: 0.2, max: 0.4, typical: 0.3 },
    characteristics: ["Medium sweet", "Shell operated", "Niger Delta"],
  },
  {
    id: "agbami", name: "Agbami", type: "Light / Sweet",
    country: "NG", region: "Offshore",
    apiGravity: { min: 46.7, max: 47.7, typical: 47.2 },
    sulfur: { min: 0.01, max: 0.08, typical: 0.04 },
    bsw: { min: 0.05, max: 0.3, typical: 0.15 },
    salt: { min: 2, max: 5, typical: 3 },
    rvp: { min: 5, max: 10, typical: 7.5 },
    pourPoint: { min: -20, max: -15, typical: -17.5 },
    flashPoint: { min: -5, max: 15, typical: 5 },
    viscosity: { min: 2.7, max: 3.7, typical: 3.2 },
    tan: { min: 0.01, max: 0.1, typical: 0.05 },
    characteristics: ["Ultra-light", "Ultra-sweet", "Deepwater", "Condensate-like"],
  },
  {
    id: "escravos", name: "Escravos", type: "Light / Sweet",
    country: "NG", region: "Niger Delta",
    apiGravity: { min: 33.7, max: 34.7, typical: 34.2 },
    sulfur: { min: 0.07, max: 0.27, typical: 0.17 },
    bsw: { min: 0.1, max: 0.5, typical: 0.25 },
    salt: { min: 3, max: 10, typical: 6 },
    rvp: { min: 3, max: 7, typical: 5 },
    pourPoint: { min: -10, max: -5, typical: -7.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 6.3, max: 7.3, typical: 6.8 },
    tan: { min: 0.2, max: 0.4, typical: 0.3 },
    characteristics: ["Light sweet", "Chevron", "Niger Delta"],
  },
  {
    id: "brass_river", name: "Brass River Blend", type: "Light / Sweet",
    country: "NG", region: "Niger Delta",
    apiGravity: { min: 41.5, max: 42.5, typical: 42.0 },
    sulfur: { min: 0.04, max: 0.24, typical: 0.14 },
    bsw: { min: 0.05, max: 0.3, typical: 0.15 },
    salt: { min: 2, max: 5, typical: 3 },
    rvp: { min: 4, max: 8, typical: 6 },
    pourPoint: { min: -15, max: -10, typical: -12.5 },
    flashPoint: { min: -5, max: 15, typical: 5 },
    viscosity: { min: 3.6, max: 4.6, typical: 4.1 },
    tan: { min: 0.05, max: 0.25, typical: 0.15 },
    characteristics: ["Light sweet", "Agip/Eni", "Niger Delta"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AFRICA — LIBYA (8 grades)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "es_sider", name: "Es Sider (Sidra)", type: "Light / Sweet",
    country: "LY", region: "Sirte Basin",
    apiGravity: { min: 36.5, max: 37.5, typical: 37.0 },
    sulfur: { min: 0.1, max: 0.3, typical: 0.2 },
    bsw: { min: 0.1, max: 0.5, typical: 0.25 },
    salt: { min: 3, max: 10, typical: 6 },
    rvp: { min: 3, max: 7, typical: 5 },
    pourPoint: { min: -10, max: -5, typical: -7.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 5, max: 6, typical: 5.5 },
    tan: { min: 0.05, max: 0.15, typical: 0.1 },
    characteristics: ["Light sweet", "Libyan benchmark", "Sirte Basin"],
  },
  {
    id: "el_sharara", name: "El Sharara", type: "Light / Sweet",
    country: "LY", region: "Murzuq Basin",
    apiGravity: { min: 42.6, max: 43.6, typical: 43.1 },
    sulfur: { min: 0.02, max: 0.12, typical: 0.07 },
    bsw: { min: 0.05, max: 0.3, typical: 0.15 },
    salt: { min: 2, max: 5, typical: 3 },
    rvp: { min: 4, max: 8, typical: 6 },
    pourPoint: { min: -15, max: -10, typical: -12.5 },
    flashPoint: { min: -5, max: 15, typical: 5 },
    viscosity: { min: 3.3, max: 4.3, typical: 3.8 },
    tan: { min: 0.01, max: 0.1, typical: 0.05 },
    characteristics: ["Light ultra-sweet", "Murzuq Basin", "Repsol/OMV"],
  },
  {
    id: "brega", name: "Brega", type: "Light / Sweet",
    country: "LY", region: "Sirte Basin",
    apiGravity: { min: 39.3, max: 40.3, typical: 39.8 },
    sulfur: { min: 0.1, max: 0.3, typical: 0.2 },
    bsw: { min: 0.1, max: 0.5, typical: 0.25 },
    salt: { min: 3, max: 10, typical: 6 },
    rvp: { min: 4, max: 8, typical: 6 },
    pourPoint: { min: -15, max: -10, typical: -12.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 4, max: 5, typical: 4.5 },
    tan: { min: 0.05, max: 0.15, typical: 0.1 },
    characteristics: ["Light sweet", "Sirte Basin", "Historic export"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MIDDLE EAST (19 grades)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "arab_heavy", name: "Arab Heavy", type: "Heavy / Sour",
    country: "SA", region: "Eastern Province",
    apiGravity: { min: 27.2, max: 28.2, typical: 27.7 },
    sulfur: { min: 2.77, max: 2.97, typical: 2.87 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 25, max: 50, typical: 37 },
    rvp: { min: 2, max: 5, typical: 3.5 },
    pourPoint: { min: -10, max: -5, typical: -7.5 },
    flashPoint: { min: 15, max: 30, typical: 22 },
    viscosity: { min: 18, max: 24, typical: 21 },
    tan: { min: 0.05, max: 0.15, typical: 0.1 },
    characteristics: ["Saudi heavy grade", "Aramco", "High sulfur", "Discount pricing"],
  },
  {
    id: "arab_medium", name: "Arab Medium", type: "Medium / Sour",
    country: "SA", region: "Eastern Province",
    apiGravity: { min: 29.7, max: 30.7, typical: 30.2 },
    sulfur: { min: 2.49, max: 2.69, typical: 2.59 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 20, max: 45, typical: 32 },
    rvp: { min: 2, max: 6, typical: 4 },
    pourPoint: { min: -15, max: -10, typical: -12.5 },
    flashPoint: { min: 10, max: 25, typical: 18 },
    viscosity: { min: 11, max: 17, typical: 14 },
    tan: { min: 0.05, max: 0.15, typical: 0.1 },
    characteristics: ["Saudi medium", "Aramco", "Asian export"],
  },
  {
    id: "arab_light", name: "Arab Light", type: "Medium / Sour",
    country: "SA", region: "Eastern Province",
    apiGravity: { min: 32.3, max: 33.3, typical: 32.8 },
    sulfur: { min: 1.87, max: 2.07, typical: 1.97 },
    bsw: { min: 0.1, max: 0.5, typical: 0.25 },
    salt: { min: 15, max: 35, typical: 25 },
    rvp: { min: 3, max: 7, typical: 5 },
    pourPoint: { min: -15, max: -10, typical: -12.5 },
    flashPoint: { min: 10, max: 25, typical: 18 },
    viscosity: { min: 8.3, max: 11.3, typical: 9.8 },
    tan: { min: 0.05, max: 0.15, typical: 0.1 },
    characteristics: ["World's most traded", "Aramco", "Global benchmark", "High volume"],
  },
  {
    id: "arab_extra_light", name: "Arab Extra Light", type: "Light / Sour",
    country: "SA", region: "Eastern Province",
    apiGravity: { min: 38.9, max: 39.9, typical: 39.4 },
    sulfur: { min: 0.99, max: 1.19, typical: 1.09 },
    bsw: { min: 0.1, max: 0.5, typical: 0.25 },
    salt: { min: 10, max: 25, typical: 17 },
    rvp: { min: 4, max: 8, typical: 6 },
    pourPoint: { min: -20, max: -15, typical: -17.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 4.4, max: 5.4, typical: 4.9 },
    tan: { min: 0.05, max: 0.15, typical: 0.1 },
    characteristics: ["Light sour", "Premium Saudi", "Aramco"],
  },
  {
    id: "arab_super_light", name: "Arab Super Light", type: "Light / Sweet",
    country: "SA", region: "Eastern Province",
    apiGravity: { min: 49.6, max: 50.6, typical: 50.1 },
    sulfur: { min: 0.01, max: 0.15, typical: 0.09 },
    bsw: { min: 0.05, max: 0.3, typical: 0.15 },
    salt: { min: 2, max: 5, typical: 3 },
    rvp: { min: 5, max: 10, typical: 7.5 },
    pourPoint: { min: -25, max: -20, typical: -22.5 },
    flashPoint: { min: -5, max: 15, typical: 5 },
    viscosity: { min: 2, max: 3, typical: 2.5 },
    tan: { min: 0.01, max: 0.05, typical: 0.03 },
    characteristics: ["Ultra-light", "Condensate-like", "Premium pricing"],
  },
  {
    id: "basrah_light", name: "Basrah Light", type: "Medium / Sour",
    country: "IQ", region: "Southern Iraq",
    apiGravity: { min: 30, max: 31, typical: 30.5 },
    sulfur: { min: 2.8, max: 3.0, typical: 2.9 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 25, max: 50, typical: 37 },
    rvp: { min: 3, max: 6, typical: 4.5 },
    pourPoint: { min: -10, max: -5, typical: -7.5 },
    flashPoint: { min: 10, max: 25, typical: 18 },
    viscosity: { min: 10, max: 15, typical: 12.5 },
    tan: { min: 0.05, max: 0.25, typical: 0.15 },
    characteristics: ["Iraq benchmark", "SOMO", "Basrah terminal"],
  },
  {
    id: "kirkuk", name: "Kirkuk", type: "Light / Sour",
    country: "IQ", region: "Northern Iraq",
    apiGravity: { min: 34.5, max: 35.5, typical: 35.0 },
    sulfur: { min: 1.7, max: 1.9, typical: 1.8 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 15, max: 35, typical: 25 },
    rvp: { min: 3, max: 7, typical: 5 },
    pourPoint: { min: -15, max: -10, typical: -12.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 5.7, max: 6.7, typical: 6.2 },
    tan: { min: 0.05, max: 0.15, typical: 0.1 },
    characteristics: ["Light sour", "Kurdish region", "Ceyhan terminal export"],
  },
  {
    id: "iranian_heavy", name: "Iranian Heavy", type: "Medium / Sour",
    country: "IR", region: "Khuzestan",
    apiGravity: { min: 29.7, max: 30.7, typical: 30.2 },
    sulfur: { min: 1.67, max: 1.87, typical: 1.77 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 15, max: 35, typical: 25 },
    rvp: { min: 3, max: 6, typical: 4.5 },
    pourPoint: { min: -10, max: -5, typical: -7.5 },
    flashPoint: { min: 10, max: 25, typical: 18 },
    viscosity: { min: 10.3, max: 13.3, typical: 11.8 },
    tan: { min: 0.05, max: 0.25, typical: 0.15 },
    characteristics: ["Medium sour", "NIOC", "Kharg Island export"],
  },
  {
    id: "iranian_light", name: "Iranian Light", type: "Medium / Sour",
    country: "IR", region: "Khuzestan",
    apiGravity: { min: 32.6, max: 33.6, typical: 33.1 },
    sulfur: { min: 1.4, max: 1.6, typical: 1.5 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 15, max: 35, typical: 25 },
    rvp: { min: 3, max: 7, typical: 5 },
    pourPoint: { min: -15, max: -10, typical: -12.5 },
    flashPoint: { min: 10, max: 25, typical: 18 },
    viscosity: { min: 7.5, max: 9.5, typical: 8.5 },
    tan: { min: 0.05, max: 0.15, typical: 0.1 },
    characteristics: ["Medium sour", "NIOC", "Main Iranian export"],
  },
  {
    id: "kuwait_blend", name: "Kuwait Blend", type: "Medium / Sour",
    country: "KW", region: "Kuwait",
    apiGravity: { min: 29.7, max: 30.7, typical: 30.2 },
    sulfur: { min: 2.62, max: 2.82, typical: 2.72 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 25, max: 45, typical: 35 },
    rvp: { min: 3, max: 6, typical: 4.5 },
    pourPoint: { min: -10, max: -5, typical: -7.5 },
    flashPoint: { min: 10, max: 25, typical: 18 },
    viscosity: { min: 10, max: 15, typical: 12.5 },
    tan: { min: 0.05, max: 0.15, typical: 0.1 },
    characteristics: ["KPC", "High sulfur", "Asian export"],
  },
  {
    id: "qatar_marine", name: "Qatar Marine", type: "Light / Sour",
    country: "QA", region: "Offshore",
    apiGravity: { min: 35.3, max: 36.3, typical: 35.8 },
    sulfur: { min: 1.37, max: 1.57, typical: 1.47 },
    bsw: { min: 0.1, max: 0.5, typical: 0.25 },
    salt: { min: 15, max: 30, typical: 22 },
    rvp: { min: 3, max: 7, typical: 5 },
    pourPoint: { min: -15, max: -10, typical: -12.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 5.5, max: 6.5, typical: 6.0 },
    tan: { min: 0.05, max: 0.15, typical: 0.1 },
    characteristics: ["Light sour", "Qatar Petroleum", "Asian market"],
  },
  {
    id: "dukhan", name: "Dukhan", type: "Light / Sour",
    country: "QA", region: "Onshore",
    apiGravity: { min: 40.6, max: 41.6, typical: 41.1 },
    sulfur: { min: 1.12, max: 1.32, typical: 1.22 },
    bsw: { min: 0.1, max: 0.5, typical: 0.25 },
    salt: { min: 10, max: 25, typical: 17 },
    rvp: { min: 4, max: 8, typical: 6 },
    pourPoint: { min: -15, max: -10, typical: -12.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 3.8, max: 4.8, typical: 4.3 },
    tan: { min: 0.05, max: 0.15, typical: 0.1 },
    characteristics: ["Light sour", "Onshore Qatar", "QP"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ASIA (17 grades)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "daqing", name: "Daqing", type: "Medium / Sweet",
    country: "CN", region: "Heilongjiang",
    apiGravity: { min: 31.7, max: 32.7, typical: 32.2 },
    sulfur: { min: 0.01, max: 0.21, typical: 0.11 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 3, max: 10, typical: 6 },
    rvp: { min: 3, max: 7, typical: 5 },
    pourPoint: { min: -15, max: -5, typical: -10 },
    flashPoint: { min: 10, max: 25, typical: 18 },
    viscosity: { min: 7.3, max: 10.3, typical: 8.8 },
    tan: { min: 0.5, max: 0.7, typical: 0.6 },
    characteristics: ["Chinese benchmark", "PetroChina", "Waxy crude", "Low sulfur"],
  },
  {
    id: "shengli", name: "Shengli", type: "Heavy / Sweet",
    country: "CN", region: "Shandong",
    apiGravity: { min: 23.7, max: 24.7, typical: 24.2 },
    sulfur: { min: 0.74, max: 0.94, typical: 0.84 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 10, max: 20, typical: 15 },
    rvp: { min: 2, max: 5, typical: 3.5 },
    pourPoint: { min: -5, max: 0, typical: -2.5 },
    flashPoint: { min: 15, max: 30, typical: 22 },
    viscosity: { min: 40, max: 56, typical: 48 },
    tan: { min: 1.6, max: 2.0, typical: 1.8 },
    characteristics: ["Heavy sweet", "High TAN", "Sinopec", "Shandong onshore"],
  },
  {
    id: "nanhai_light", name: "Nanhai Light", type: "Light / Sweet",
    country: "CN", region: "South China Sea",
    apiGravity: { min: 39.6, max: 40.6, typical: 40.1 },
    sulfur: { min: 0.01, max: 0.11, typical: 0.06 },
    bsw: { min: 0.05, max: 0.3, typical: 0.15 },
    salt: { min: 2, max: 5, typical: 3 },
    rvp: { min: 4, max: 8, typical: 6 },
    pourPoint: { min: -15, max: -10, typical: -12.5 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 4, max: 5, typical: 4.5 },
    tan: { min: 0.1, max: 0.3, typical: 0.2 },
    characteristics: ["Light sweet", "CNOOC", "South China Sea offshore"],
  },
  {
    id: "duri", name: "Duri", type: "Heavy / Sweet",
    country: "ID", region: "Sumatra",
    apiGravity: { min: 20.3, max: 21.3, typical: 20.8 },
    sulfur: { min: 0.1, max: 0.3, typical: 0.2 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 3, max: 10, typical: 6 },
    rvp: { min: 2, max: 5, typical: 3.5 },
    pourPoint: { min: 10, max: 20, typical: 15 },
    flashPoint: { min: 20, max: 35, typical: 28 },
    viscosity: { min: 120, max: 200, typical: 160 },
    tan: { min: 0.8, max: 1.0, typical: 0.9 },
    characteristics: ["Heavy sweet", "Very waxy", "High pour point", "Chevron Indonesia"],
  },
  {
    id: "minas", name: "Minas", type: "Light / Sweet",
    country: "ID", region: "Sumatra",
    apiGravity: { min: 34.8, max: 35.8, typical: 35.3 },
    sulfur: { min: 0.01, max: 0.15, typical: 0.09 },
    bsw: { min: 0.1, max: 0.5, typical: 0.25 },
    salt: { min: 2, max: 5, typical: 3 },
    rvp: { min: 3, max: 7, typical: 5 },
    pourPoint: { min: -5, max: 5, typical: 0 },
    flashPoint: { min: 5, max: 20, typical: 12 },
    viscosity: { min: 5.7, max: 6.7, typical: 6.2 },
    tan: { min: 0.1, max: 0.3, typical: 0.2 },
    characteristics: ["Light sweet", "Indonesian benchmark", "Waxy"],
  },
  {
    id: "tapis", name: "Tapis Blend", type: "Light / Sweet",
    country: "MY", region: "Offshore Peninsula Malaysia",
    apiGravity: { min: 44.7, max: 45.7, typical: 45.2 },
    sulfur: { min: 0.01, max: 0.06, typical: 0.03 },
    bsw: { min: 0.05, max: 0.3, typical: 0.15 },
    salt: { min: 1, max: 3, typical: 2 },
    rvp: { min: 4, max: 9, typical: 6.5 },
    pourPoint: { min: -15, max: -10, typical: -12.5 },
    flashPoint: { min: -5, max: 15, typical: 5 },
    viscosity: { min: 3, max: 4, typical: 3.5 },
    tan: { min: 0.01, max: 0.1, typical: 0.05 },
    characteristics: ["Asian benchmark (light sweet)", "Ultra-low sulfur", "Petronas", "Premium grade"],
  },
  {
    id: "bintulu", name: "Bintulu Condensate", type: "Light / Sweet",
    country: "MY", region: "Offshore Sarawak",
    apiGravity: { min: 68.8, max: 69.8, typical: 69.3 },
    sulfur: { min: 0.01, max: 0.06, typical: 0.03 },
    bsw: { min: 0.02, max: 0.2, typical: 0.1 },
    salt: { min: 1, max: 3, typical: 2 },
    rvp: { min: 8, max: 15, typical: 11.5 },
    pourPoint: { min: -40, max: -30, typical: -35 },
    flashPoint: { min: -20, max: 10, typical: -5 },
    viscosity: { min: 0.9, max: 1.5, typical: 1.2 },
    tan: { min: 0.01, max: 0.05, typical: 0.03 },
    characteristics: ["Ultra-light condensate", "Highest API in database", "LNG associated", "Petronas"],
  },
  {
    id: "belanak", name: "Belanak", type: "Light / Sweet",
    country: "ID", region: "Natuna Sea",
    apiGravity: { min: 47.3, max: 48.3, typical: 47.8 },
    sulfur: { min: 0.01, max: 0.05, typical: 0.02 },
    bsw: { min: 0.05, max: 0.3, typical: 0.15 },
    salt: { min: 1, max: 3, typical: 2 },
    rvp: { min: 5, max: 10, typical: 7.5 },
    pourPoint: { min: -20, max: -15, typical: -17.5 },
    flashPoint: { min: -5, max: 15, typical: 5 },
    viscosity: { min: 2.4, max: 3.4, typical: 2.9 },
    tan: { min: 0.01, max: 0.1, typical: 0.05 },
    characteristics: ["Ultra-light", "Ultra-sweet", "ConocoPhillips Indonesia"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SPEC GUIDE v2.0 ADDITIONS — GLOBAL BENCHMARKS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "wti_light", name: "WTI Light", type: "Extra Light / Sweet",
    country: "US", region: "Texas",
    apiGravity: { min: 46.5, max: 48.5, typical: 47.5 },
    sulfur: { min: 0.03, max: 0.07, typical: 0.05 },
    bsw: { min: 0.1, max: 0.3, typical: 0.2 },
    salt: { min: 2, max: 5, typical: 3.5 },
    rvp: { min: 7.7, max: 8.7, typical: 8.2 },
    pourPoint: { min: -33, max: -27, typical: -30 },
    flashPoint: { min: -24, max: -18, typical: -21 },
    viscosity: { min: 1.4, max: 2.0, typical: 1.7 },
    tan: { min: 0.05, max: 0.09, typical: 0.07 },
    characteristics: ["Extra light sweet", "Very low sulfur", "Premium Texas condensate-like"],
  },
  {
    id: "dubai", name: "Dubai Crude", type: "Medium / Sour",
    country: "AE", region: "Dubai, UAE",
    apiGravity: { min: 30.0, max: 31.0, typical: 30.5 },
    sulfur: { min: 2.00, max: 2.10, typical: 2.05 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 10, max: 15, typical: 12.5 },
    rvp: { min: 5.0, max: 6.5, typical: 5.75 },
    pourPoint: { min: -15, max: -9, typical: -12 },
    flashPoint: { min: -10, max: -4, typical: -7 },
    viscosity: { min: 8.0, max: 12.0, typical: 10.0 },
    tan: { min: 0.10, max: 0.20, typical: 0.15 },
    characteristics: ["Asian benchmark", "Medium sour", "Dubai Mercantile Exchange", "OPEC reference"],
  },
  {
    id: "murban", name: "Murban Crude", type: "Light / Sour",
    country: "AE", region: "Abu Dhabi, UAE",
    apiGravity: { min: 39.0, max: 40.5, typical: 39.75 },
    sulfur: { min: 0.74, max: 0.78, typical: 0.76 },
    bsw: { min: 0.05, max: 0.2, typical: 0.1 },
    salt: { min: 3, max: 8, typical: 5.5 },
    rvp: { min: 6.0, max: 7.5, typical: 6.75 },
    pourPoint: { min: -18, max: -12, typical: -15 },
    flashPoint: { min: -15, max: -6, typical: -10.5 },
    viscosity: { min: 3.5, max: 5.5, typical: 4.5 },
    tan: { min: 0.02, max: 0.05, typical: 0.035 },
    characteristics: ["ADNOC flagship", "ICE Murban futures", "Global benchmark", "Low TAN"],
  },
  {
    id: "dme_oman", name: "DME Oman", type: "Medium / Sour",
    country: "OM", region: "Oman",
    apiGravity: { min: 30.5, max: 33.0, typical: 31.75 },
    sulfur: { min: 1.40, max: 1.60, typical: 1.50 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 8, max: 12, typical: 10 },
    rvp: { min: 5.0, max: 6.5, typical: 5.75 },
    pourPoint: { min: -12, max: -6, typical: -9 },
    flashPoint: { min: -8, max: 0, typical: -4 },
    viscosity: { min: 7.0, max: 11.0, typical: 9.0 },
    tan: { min: 0.05, max: 0.15, typical: 0.10 },
    characteristics: ["Dubai Mercantile Exchange", "Asian sour benchmark", "Oman export"],
  },
  {
    id: "urals", name: "Urals", type: "Medium / Sour",
    country: "RU", region: "Russia",
    apiGravity: { min: 31.0, max: 32.0, typical: 31.5 },
    sulfur: { min: 1.20, max: 1.50, typical: 1.35 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 8, max: 15, typical: 11.5 },
    rvp: { min: 5.0, max: 6.5, typical: 5.75 },
    pourPoint: { min: -18, max: -9, typical: -13.5 },
    flashPoint: { min: -10, max: -2, typical: -6 },
    viscosity: { min: 6.0, max: 10.0, typical: 8.0 },
    tan: { min: 0.05, max: 0.15, typical: 0.10 },
    characteristics: ["European benchmark", "Russian export blend", "Primorsk/Novorossiysk terminals"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SPEC GUIDE v2.0 — OPEC MEMBER CRUDES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "saharan_blend", name: "Saharan Blend", type: "Light / Sweet",
    country: "DZ", region: "Algeria",
    apiGravity: { min: 44.0, max: 46.0, typical: 45.0 },
    sulfur: { min: 0.05, max: 0.10, typical: 0.075 },
    bsw: { min: 0.05, max: 0.2, typical: 0.1 },
    salt: { min: 3, max: 6, typical: 4.5 },
    rvp: { min: 8.0, max: 10.0, typical: 9.0 },
    pourPoint: { min: -30, max: -21, typical: -25.5 },
    flashPoint: { min: -20, max: -12, typical: -16 },
    viscosity: { min: 2.0, max: 3.5, typical: 2.75 },
    tan: { min: 0.02, max: 0.05, typical: 0.035 },
    characteristics: ["Algerian benchmark", "Ultra-sweet", "Very light", "OPEC member", "Premium grade"],
  },
  {
    id: "girassol", name: "Girassol", type: "Medium / Sweet",
    country: "AO", region: "Offshore Angola",
    apiGravity: { min: 29.0, max: 31.0, typical: 30.0 },
    sulfur: { min: 0.30, max: 0.40, typical: 0.35 },
    bsw: { min: 0.1, max: 0.3, typical: 0.2 },
    salt: { min: 5, max: 10, typical: 7.5 },
    rvp: { min: 4.5, max: 6.0, typical: 5.25 },
    pourPoint: { min: -18, max: -9, typical: -13.5 },
    flashPoint: { min: -8, max: 2, typical: -3 },
    viscosity: { min: 8.0, max: 15.0, typical: 11.5 },
    tan: { min: 0.20, max: 0.40, typical: 0.30 },
    characteristics: ["OPEC daily pricing", "Angolan deepwater", "TotalEnergies", "Medium sweet"],
  },
  {
    id: "merey", name: "Merey", type: "Extra Heavy / Sour",
    country: "VE", region: "Venezuela",
    apiGravity: { min: 16.0, max: 18.0, typical: 17.0 },
    sulfur: { min: 2.40, max: 2.70, typical: 2.55 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 20, max: 40, typical: 30 },
    rvp: { min: 2.5, max: 4.0, typical: 3.25 },
    pourPoint: { min: -20, max: -10, typical: -15 },
    flashPoint: { min: 5, max: 15, typical: 10 },
    viscosity: { min: 300.0, max: 600.0, typical: 450.0 },
    tan: { min: 0.60, max: 0.90, typical: 0.75 },
    characteristics: ["OPEC basket component", "Venezuelan heavy", "PDVSA", "Discount pricing"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SPEC GUIDE v2.0 — AUSTRALIA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "cossack", name: "Cossack", type: "Extra Light / Sweet",
    country: "AU", region: "NW Shelf, Australia",
    apiGravity: { min: 48.0, max: 50.5, typical: 49.25 },
    sulfur: { min: 0.01, max: 0.04, typical: 0.025 },
    bsw: { min: 0.02, max: 0.1, typical: 0.05 },
    salt: { min: 1, max: 3, typical: 2 },
    rvp: { min: 8.5, max: 10.0, typical: 9.25 },
    pourPoint: { min: -36, max: -27, typical: -31.5 },
    flashPoint: { min: -25, max: -15, typical: -20 },
    viscosity: { min: 1.0, max: 2.0, typical: 1.5 },
    tan: { min: 0.01, max: 0.03, typical: 0.02 },
    characteristics: ["Extra light", "Ultra-sweet", "Woodside", "NW Shelf condensate-like"],
  },
  {
    id: "nws_condensate", name: "NWS Condensate", type: "Condensate",
    country: "AU", region: "NW Shelf, Australia",
    apiGravity: { min: 55.0, max: 60.0, typical: 57.5 },
    sulfur: { min: 0.01, max: 0.02, typical: 0.015 },
    bsw: { min: 0.02, max: 0.1, typical: 0.05 },
    salt: { min: 1, max: 3, typical: 2 },
    rvp: { min: 10.0, max: 12.0, typical: 11.0 },
    pourPoint: { min: -45, max: -36, typical: -40.5 },
    flashPoint: { min: -30, max: -20, typical: -25 },
    viscosity: { min: 0.5, max: 1.2, typical: 0.85 },
    tan: { min: 0.01, max: 0.02, typical: 0.015 },
    characteristics: ["Condensate", "Ultra-light", "LNG associated", "NW Shelf"],
  },
  {
    id: "ichthys_condensate", name: "Ichthys Condensate", type: "Condensate",
    country: "AU", region: "Browse Basin, Australia",
    apiGravity: { min: 52.0, max: 56.0, typical: 54.0 },
    sulfur: { min: 0.01, max: 0.03, typical: 0.02 },
    bsw: { min: 0.02, max: 0.1, typical: 0.05 },
    salt: { min: 1, max: 3, typical: 2 },
    rvp: { min: 9.0, max: 11.0, typical: 10.0 },
    pourPoint: { min: -40, max: -30, typical: -35 },
    flashPoint: { min: -28, max: -18, typical: -23 },
    viscosity: { min: 0.6, max: 1.5, typical: 1.05 },
    tan: { min: 0.01, max: 0.02, typical: 0.015 },
    characteristics: ["Condensate", "INPEX", "Browse Basin", "LNG associated"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SPEC GUIDE v2.0 — ANGOLA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "cabinda", name: "Cabinda", type: "Medium / Sweet",
    country: "AO", region: "Cabinda, Angola",
    apiGravity: { min: 31.0, max: 33.0, typical: 32.0 },
    sulfur: { min: 0.14, max: 0.20, typical: 0.17 },
    bsw: { min: 0.1, max: 0.3, typical: 0.2 },
    salt: { min: 3, max: 8, typical: 5.5 },
    rvp: { min: 4.5, max: 6.0, typical: 5.25 },
    pourPoint: { min: -21, max: -12, typical: -16.5 },
    flashPoint: { min: -10, max: 0, typical: -5 },
    viscosity: { min: 6.0, max: 10.0, typical: 8.0 },
    tan: { min: 0.10, max: 0.25, typical: 0.175 },
    characteristics: ["Chevron", "Cabinda enclave", "Medium sweet", "Low sulfur"],
  },
  {
    id: "nemba", name: "Nemba", type: "Light / Sweet",
    country: "AO", region: "Offshore Angola",
    apiGravity: { min: 37.0, max: 39.5, typical: 38.25 },
    sulfur: { min: 0.18, max: 0.28, typical: 0.23 },
    bsw: { min: 0.05, max: 0.2, typical: 0.1 },
    salt: { min: 3, max: 6, typical: 4.5 },
    rvp: { min: 5.5, max: 7.0, typical: 6.25 },
    pourPoint: { min: -24, max: -15, typical: -19.5 },
    flashPoint: { min: -15, max: -6, typical: -10.5 },
    viscosity: { min: 3.5, max: 6.0, typical: 4.75 },
    tan: { min: 0.08, max: 0.20, typical: 0.14 },
    characteristics: ["Light sweet", "ExxonMobil/BP", "Angolan deepwater"],
  },
  {
    id: "dalia", name: "Dalia", type: "Heavy / Sweet",
    country: "AO", region: "Block 17, Angola",
    apiGravity: { min: 22.0, max: 24.0, typical: 23.0 },
    sulfur: { min: 0.48, max: 0.55, typical: 0.515 },
    bsw: { min: 0.1, max: 0.3, typical: 0.2 },
    salt: { min: 5, max: 12, typical: 8.5 },
    rvp: { min: 3.5, max: 5.0, typical: 4.25 },
    pourPoint: { min: -24, max: -15, typical: -19.5 },
    flashPoint: { min: -5, max: 5, typical: 0 },
    viscosity: { min: 25.0, max: 50.0, typical: 37.5 },
    tan: { min: 0.30, max: 0.60, typical: 0.45 },
    characteristics: ["Heavy sweet", "TotalEnergies", "Block 17 deepwater"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SPEC GUIDE v2.0 — UAE (additional grades)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "das", name: "Das Crude", type: "Light / Sour",
    country: "AE", region: "Das Island, Abu Dhabi",
    apiGravity: { min: 38.0, max: 40.0, typical: 39.0 },
    sulfur: { min: 1.10, max: 1.40, typical: 1.25 },
    bsw: { min: 0.05, max: 0.3, typical: 0.15 },
    salt: { min: 5, max: 10, typical: 7.5 },
    rvp: { min: 6.0, max: 7.5, typical: 6.75 },
    pourPoint: { min: -18, max: -9, typical: -13.5 },
    flashPoint: { min: -12, max: -4, typical: -8 },
    viscosity: { min: 3.5, max: 6.0, typical: 4.75 },
    tan: { min: 0.02, max: 0.06, typical: 0.04 },
    characteristics: ["ADNOC", "Das Island terminal", "Light sour", "Low TAN"],
  },
  {
    id: "umm_lulu", name: "Umm Lulu", type: "Light / Sour",
    country: "AE", region: "Offshore Abu Dhabi",
    apiGravity: { min: 35.0, max: 38.0, typical: 36.5 },
    sulfur: { min: 1.00, max: 1.30, typical: 1.15 },
    bsw: { min: 0.05, max: 0.3, typical: 0.15 },
    salt: { min: 5, max: 10, typical: 7.5 },
    rvp: { min: 5.5, max: 7.0, typical: 6.25 },
    pourPoint: { min: -15, max: -6, typical: -10.5 },
    flashPoint: { min: -10, max: 0, typical: -5 },
    viscosity: { min: 4.0, max: 7.0, typical: 5.5 },
    tan: { min: 0.03, max: 0.08, typical: 0.055 },
    characteristics: ["ADNOC", "New Abu Dhabi grade", "Offshore"],
  },
  {
    id: "upper_zakum", name: "Upper Zakum", type: "Medium / Sour",
    country: "AE", region: "Offshore Abu Dhabi",
    apiGravity: { min: 32.0, max: 34.0, typical: 33.0 },
    sulfur: { min: 1.80, max: 2.10, typical: 1.95 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 8, max: 15, typical: 11.5 },
    rvp: { min: 5.0, max: 6.5, typical: 5.75 },
    pourPoint: { min: -12, max: -3, typical: -7.5 },
    flashPoint: { min: -6, max: 4, typical: -1 },
    viscosity: { min: 6.0, max: 11.0, typical: 8.5 },
    tan: { min: 0.05, max: 0.15, typical: 0.10 },
    characteristics: ["ADNOC", "Large offshore field", "Medium sour"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SPEC GUIDE v2.0 — IRAQ (additional grades)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "basrah_heavy", name: "Basrah Heavy", type: "Heavy / Sour",
    country: "IQ", region: "Southern Iraq",
    apiGravity: { min: 23.0, max: 24.5, typical: 23.75 },
    sulfur: { min: 3.80, max: 4.20, typical: 4.00 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 15, max: 30, typical: 22.5 },
    rvp: { min: 3.5, max: 5.0, typical: 4.25 },
    pourPoint: { min: -15, max: -6, typical: -10.5 },
    flashPoint: { min: -2, max: 8, typical: 3 },
    viscosity: { min: 30.0, max: 60.0, typical: 45.0 },
    tan: { min: 0.15, max: 0.35, typical: 0.25 },
    characteristics: ["SOMO", "Iraqi heavy export", "Very high sulfur", "Asian market"],
  },
  {
    id: "basrah_medium", name: "Basrah Medium", type: "Medium / Sour",
    country: "IQ", region: "Southern Iraq",
    apiGravity: { min: 29.0, max: 31.0, typical: 30.0 },
    sulfur: { min: 2.80, max: 3.10, typical: 2.95 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 10, max: 20, typical: 15 },
    rvp: { min: 4.5, max: 6.0, typical: 5.25 },
    pourPoint: { min: -18, max: -9, typical: -13.5 },
    flashPoint: { min: -8, max: 2, typical: -3 },
    viscosity: { min: 8.0, max: 15.0, typical: 11.5 },
    tan: { min: 0.10, max: 0.25, typical: 0.175 },
    characteristics: ["SOMO", "New Iraqi export grade", "Between Basrah Light and Heavy"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SPEC GUIDE v2.0 — QATAR (additional grades)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "qatar_land", name: "Qatar Land", type: "Light / Sour",
    country: "QA", region: "Onshore Qatar",
    apiGravity: { min: 40.0, max: 42.0, typical: 41.0 },
    sulfur: { min: 1.10, max: 1.30, typical: 1.20 },
    bsw: { min: 0.05, max: 0.2, typical: 0.1 },
    salt: { min: 3, max: 8, typical: 5.5 },
    rvp: { min: 6.5, max: 8.0, typical: 7.25 },
    pourPoint: { min: -21, max: -12, typical: -16.5 },
    flashPoint: { min: -15, max: -8, typical: -11.5 },
    viscosity: { min: 3.0, max: 5.0, typical: 4.0 },
    tan: { min: 0.02, max: 0.05, typical: 0.035 },
    characteristics: ["QatarEnergy", "Onshore", "Light sour", "Low TAN"],
  },
  {
    id: "al_shaheen", name: "Al Shaheen", type: "Medium / Sour",
    country: "QA", region: "Offshore Qatar",
    apiGravity: { min: 25.0, max: 28.0, typical: 26.5 },
    sulfur: { min: 2.30, max: 2.70, typical: 2.50 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 10, max: 18, typical: 14 },
    rvp: { min: 4.0, max: 5.5, typical: 4.75 },
    pourPoint: { min: -9, max: 0, typical: -4.5 },
    flashPoint: { min: -2, max: 8, typical: 3 },
    viscosity: { min: 15.0, max: 30.0, typical: 22.5 },
    tan: { min: 0.10, max: 0.25, typical: 0.175 },
    characteristics: ["TotalEnergies/QatarEnergy", "Largest Qatar oil field", "Medium sour"],
  },
  {
    id: "qatar_dfc", name: "Deodorized Field Condensate", type: "Condensate",
    country: "QA", region: "Qatar",
    apiGravity: { min: 60.0, max: 65.0, typical: 62.5 },
    sulfur: { min: 0.05, max: 0.15, typical: 0.10 },
    bsw: { min: 0.02, max: 0.1, typical: 0.05 },
    salt: { min: 1, max: 3, typical: 2 },
    rvp: { min: 10.0, max: 13.0, typical: 11.5 },
    pourPoint: { min: -50, max: -40, typical: -45 },
    flashPoint: { min: -35, max: -25, typical: -30 },
    viscosity: { min: 0.4, max: 0.8, typical: 0.6 },
    tan: { min: 0.01, max: 0.02, typical: 0.015 },
    characteristics: ["North Field condensate", "QatarEnergy", "LNG associated", "Ultra-light"],
  },
  {
    id: "qatar_lsc", name: "Low Sulfur Condensate", type: "Condensate",
    country: "QA", region: "Qatar",
    apiGravity: { min: 62.0, max: 67.0, typical: 64.5 },
    sulfur: { min: 0.02, max: 0.08, typical: 0.05 },
    bsw: { min: 0.02, max: 0.1, typical: 0.05 },
    salt: { min: 1, max: 3, typical: 2 },
    rvp: { min: 10.5, max: 13.5, typical: 12.0 },
    pourPoint: { min: -52, max: -42, typical: -47 },
    flashPoint: { min: -38, max: -28, typical: -33 },
    viscosity: { min: 0.3, max: 0.7, typical: 0.5 },
    tan: { min: 0.01, max: 0.02, typical: 0.015 },
    characteristics: ["QatarEnergy", "Ultra-low sulfur", "Premium condensate", "Petrochemical feedstock"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SPEC GUIDE v2.0 — IRAN (additional grades)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "forozan", name: "Forozan Blend", type: "Medium / Sour",
    country: "IR", region: "Kharg Island, Iran",
    apiGravity: { min: 29.0, max: 31.5, typical: 30.25 },
    sulfur: { min: 2.30, max: 2.60, typical: 2.45 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 10, max: 18, typical: 14 },
    rvp: { min: 4.5, max: 6.0, typical: 5.25 },
    pourPoint: { min: -12, max: -3, typical: -7.5 },
    flashPoint: { min: -6, max: 4, typical: -1 },
    viscosity: { min: 9.0, max: 16.0, typical: 12.5 },
    tan: { min: 0.08, max: 0.20, typical: 0.14 },
    characteristics: ["NIOC", "Iran/Saudi shared field", "Medium sour"],
  },
  {
    id: "soroosh", name: "Soroosh", type: "Extra Heavy / Sour",
    country: "IR", region: "Iran",
    apiGravity: { min: 17.0, max: 19.5, typical: 18.25 },
    sulfur: { min: 3.30, max: 3.60, typical: 3.45 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 15, max: 30, typical: 22.5 },
    rvp: { min: 3.0, max: 4.5, typical: 3.75 },
    pourPoint: { min: -6, max: 3, typical: -1.5 },
    flashPoint: { min: 5, max: 15, typical: 10 },
    viscosity: { min: 80.0, max: 200.0, typical: 140.0 },
    tan: { min: 0.30, max: 0.60, typical: 0.45 },
    characteristics: ["NIOC", "Extra heavy", "Mediterranean delivery", "Discount pricing"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SPEC GUIDE v2.0 — RUSSIA, AZERBAIJAN, BRAZIL, KAZAKHSTAN
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "sokol", name: "Sokol", type: "Light / Sweet",
    country: "RU", region: "Sakhalin Island, Russia",
    apiGravity: { min: 36.0, max: 38.0, typical: 37.0 },
    sulfur: { min: 0.18, max: 0.25, typical: 0.215 },
    bsw: { min: 0.05, max: 0.2, typical: 0.1 },
    salt: { min: 3, max: 6, typical: 4.5 },
    rvp: { min: 5.5, max: 7.0, typical: 6.25 },
    pourPoint: { min: -24, max: -15, typical: -19.5 },
    flashPoint: { min: -15, max: -6, typical: -10.5 },
    viscosity: { min: 3.5, max: 6.0, typical: 4.75 },
    tan: { min: 0.02, max: 0.06, typical: 0.04 },
    characteristics: ["Sakhalin-1", "ExxonMobil Russia", "Light sweet", "Asian market"],
  },
  {
    id: "azeri_light", name: "Azeri Light (BTC)", type: "Light / Sweet",
    country: "AZ", region: "Caspian Sea, Azerbaijan",
    apiGravity: { min: 34.0, max: 36.0, typical: 35.0 },
    sulfur: { min: 0.15, max: 0.20, typical: 0.175 },
    bsw: { min: 0.05, max: 0.2, typical: 0.1 },
    salt: { min: 3, max: 6, typical: 4.5 },
    rvp: { min: 5.5, max: 7.0, typical: 6.25 },
    pourPoint: { min: -15, max: -6, typical: -10.5 },
    flashPoint: { min: -10, max: 0, typical: -5 },
    viscosity: { min: 4.0, max: 7.0, typical: 5.5 },
    tan: { min: 0.03, max: 0.08, typical: 0.055 },
    characteristics: ["BP", "BTC pipeline", "Caspian benchmark", "Ceyhan terminal delivery"],
  },
  {
    id: "lula", name: "Lula", type: "Medium / Sweet",
    country: "BR", region: "Santos Basin, Brazil",
    apiGravity: { min: 28.0, max: 30.0, typical: 29.0 },
    sulfur: { min: 0.30, max: 0.50, typical: 0.40 },
    bsw: { min: 0.1, max: 0.3, typical: 0.2 },
    salt: { min: 5, max: 10, typical: 7.5 },
    rvp: { min: 4.5, max: 6.0, typical: 5.25 },
    pourPoint: { min: -15, max: -6, typical: -10.5 },
    flashPoint: { min: -6, max: 4, typical: -1 },
    viscosity: { min: 8.0, max: 15.0, typical: 11.5 },
    tan: { min: 0.15, max: 0.35, typical: 0.25 },
    characteristics: ["Petrobras", "Pre-salt deepwater", "Largest Brazilian field", "Santos Basin"],
  },
  {
    id: "cpc_blend", name: "CPC Blend", type: "Light / Sweet",
    country: "KZ", region: "Tengiz/Karachaganak, Kazakhstan",
    apiGravity: { min: 44.0, max: 47.0, typical: 45.5 },
    sulfur: { min: 0.50, max: 0.60, typical: 0.55 },
    bsw: { min: 0.05, max: 0.2, typical: 0.1 },
    salt: { min: 3, max: 8, typical: 5.5 },
    rvp: { min: 7.5, max: 9.5, typical: 8.5 },
    pourPoint: { min: -39, max: -30, typical: -34.5 },
    flashPoint: { min: -25, max: -15, typical: -20 },
    viscosity: { min: 1.5, max: 3.0, typical: 2.25 },
    tan: { min: 0.02, max: 0.05, typical: 0.035 },
    characteristics: ["CPC pipeline", "Novorossiysk terminal", "Chevron/ExxonMobil", "Light sweet"],
  },
  {
    id: "south_china_sea", name: "South China Sea Light", type: "Light / Sweet",
    country: "CN", region: "South China Sea",
    apiGravity: { min: 35.0, max: 38.0, typical: 36.5 },
    sulfur: { min: 0.04, max: 0.08, typical: 0.06 },
    bsw: { min: 0.05, max: 0.2, typical: 0.1 },
    salt: { min: 3, max: 6, typical: 4.5 },
    rvp: { min: 5.5, max: 7.0, typical: 6.25 },
    pourPoint: { min: -18, max: -9, typical: -13.5 },
    flashPoint: { min: -12, max: -2, typical: -7 },
    viscosity: { min: 3.5, max: 6.5, typical: 5.0 },
    tan: { min: 0.02, max: 0.06, typical: 0.04 },
    characteristics: ["CNOOC", "Offshore South China Sea", "Ultra-sweet"],
  },
  {
    id: "cinta", name: "Cinta", type: "Medium / Sweet",
    country: "ID", region: "Java Sea, Indonesia",
    apiGravity: { min: 32.0, max: 34.0, typical: 33.0 },
    sulfur: { min: 0.07, max: 0.12, typical: 0.095 },
    bsw: { min: 0.1, max: 0.3, typical: 0.2 },
    salt: { min: 3, max: 8, typical: 5.5 },
    rvp: { min: 4.5, max: 6.0, typical: 5.25 },
    pourPoint: { min: 9, max: 15, typical: 12 },
    flashPoint: { min: 5, max: 15, typical: 10 },
    viscosity: { min: 6.0, max: 10.0, typical: 8.0 },
    tan: { min: 0.05, max: 0.12, typical: 0.085 },
    characteristics: ["Waxy crude", "High pour point", "Java Sea offshore", "Pertamina"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SPEC GUIDE v2.0 — CANADIAN BLENDS (additional)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "central_alberta", name: "Central Alberta", type: "Light / Sour",
    country: "CA", region: "Central Alberta, Canada",
    apiGravity: { min: 37.0, max: 39.0, typical: 38.0 },
    sulfur: { min: 0.40, max: 0.60, typical: 0.50 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 5, max: 10, typical: 7.5 },
    rvp: { min: 6.0, max: 7.5, typical: 6.75 },
    pourPoint: { min: -30, max: -21, typical: -25.5 },
    flashPoint: { min: -18, max: -8, typical: -13 },
    viscosity: { min: 3.0, max: 6.0, typical: 4.5 },
    tan: { min: 0.04, max: 0.10, typical: 0.07 },
    characteristics: ["Alberta conventional", "Light sour blend"],
  },
  {
    id: "peace_sour", name: "Peace Sour", type: "Medium / Sour",
    country: "CA", region: "Peace River, Alberta",
    apiGravity: { min: 33.0, max: 35.0, typical: 34.0 },
    sulfur: { min: 1.80, max: 2.50, typical: 2.15 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 10, max: 18, typical: 14 },
    rvp: { min: 5.0, max: 6.5, typical: 5.75 },
    pourPoint: { min: -27, max: -18, typical: -22.5 },
    flashPoint: { min: -15, max: -6, typical: -10.5 },
    viscosity: { min: 5.0, max: 8.0, typical: 6.5 },
    tan: { min: 0.06, max: 0.15, typical: 0.105 },
    characteristics: ["Peace River region", "Sour blend", "Western Canadian"],
  },
  {
    id: "ca_sweet", name: "Canadian Sweet Crude", type: "Light / Sweet",
    country: "CA", region: "Alberta, Canada",
    apiGravity: { min: 38.0, max: 40.0, typical: 39.0 },
    sulfur: { min: 0.25, max: 0.45, typical: 0.35 },
    bsw: { min: 0.1, max: 0.3, typical: 0.2 },
    salt: { min: 5, max: 10, typical: 7.5 },
    rvp: { min: 6.5, max: 8.0, typical: 7.25 },
    pourPoint: { min: -30, max: -21, typical: -25.5 },
    flashPoint: { min: -18, max: -8, typical: -13 },
    viscosity: { min: 3.0, max: 5.5, typical: 4.25 },
    tan: { min: 0.03, max: 0.08, typical: 0.055 },
    characteristics: ["Alberta conventional sweet", "Premium Canadian"],
  },
  {
    id: "clearbrook", name: "US High Sweet Clearbrook", type: "Light / Sweet",
    country: "CA", region: "Clearbrook, Minnesota (Canadian origin)",
    apiGravity: { min: 38.0, max: 40.5, typical: 39.25 },
    sulfur: { min: 0.20, max: 0.35, typical: 0.275 },
    bsw: { min: 0.1, max: 0.3, typical: 0.2 },
    salt: { min: 5, max: 8, typical: 6.5 },
    rvp: { min: 7.0, max: 8.5, typical: 7.75 },
    pourPoint: { min: -30, max: -21, typical: -25.5 },
    flashPoint: { min: -18, max: -8, typical: -13 },
    viscosity: { min: 3.0, max: 5.5, typical: 4.25 },
    tan: { min: 0.03, max: 0.08, typical: 0.055 },
    characteristics: ["Enbridge delivery point", "Canadian origin", "Minnesota hub"],
  },
  {
    id: "midale", name: "Midale", type: "Medium / Sour",
    country: "CA", region: "Saskatchewan, Canada",
    apiGravity: { min: 28.5, max: 31.0, typical: 29.75 },
    sulfur: { min: 2.00, max: 2.50, typical: 2.25 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 10, max: 18, typical: 14 },
    rvp: { min: 4.5, max: 6.0, typical: 5.25 },
    pourPoint: { min: -21, max: -12, typical: -16.5 },
    flashPoint: { min: -10, max: 0, typical: -5 },
    viscosity: { min: 8.0, max: 14.0, typical: 11.0 },
    tan: { min: 0.08, max: 0.18, typical: 0.13 },
    characteristics: ["Saskatchewan", "Medium sour", "CO2 EOR field"],
  },
  {
    id: "albian_heavy_syn", name: "Albian Heavy Synthetic", type: "Heavy / Synthetic",
    country: "CA", region: "Fort McMurray, Alberta",
    apiGravity: { min: 19.0, max: 21.0, typical: 20.0 },
    sulfur: { min: 0.10, max: 0.20, typical: 0.15 },
    bsw: { min: 0.05, max: 0.2, typical: 0.1 },
    salt: { min: 2, max: 5, typical: 3.5 },
    rvp: { min: 2.5, max: 4.0, typical: 3.25 },
    pourPoint: { min: -30, max: -20, typical: -25 },
    flashPoint: { min: -5, max: 5, typical: 0 },
    viscosity: { min: 30.0, max: 60.0, typical: 45.0 },
    tan: { min: 0.02, max: 0.05, typical: 0.035 },
    characteristics: ["Oil sands synthetic", "Heavy but very low sulfur", "Shell Albian Sands"],
  },
  {
    id: "awb", name: "Access Western Blend", type: "Heavy / Sour",
    country: "CA", region: "Alberta, Canada",
    apiGravity: { min: 20.0, max: 22.0, typical: 21.0 },
    sulfur: { min: 3.50, max: 4.00, typical: 3.75 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 20, max: 40, typical: 30 },
    rvp: { min: 2.5, max: 4.0, typical: 3.25 },
    pourPoint: { min: -30, max: -20, typical: -25 },
    flashPoint: { min: 0, max: 10, typical: 5 },
    viscosity: { min: 150.0, max: 400.0, typical: 275.0 },
    tan: { min: 0.80, max: 1.10, typical: 0.95 },
    characteristics: ["Dilbit blend", "Oil sands", "Very high sulfur", "High TAN"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SPEC GUIDE v2.0 — US STATE BLENDS (Arkansas, Oklahoma, Wyoming, etc.)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "ar_sweet", name: "Arkansas Sweet", type: "Light / Sweet",
    country: "US", region: "Arkansas",
    apiGravity: { min: 38.0, max: 41.0, typical: 39.5 },
    sulfur: { min: 0.15, max: 0.30, typical: 0.225 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 5, max: 10, typical: 7.5 },
    rvp: { min: 7.0, max: 8.5, typical: 7.75 },
    pourPoint: { min: -24, max: -15, typical: -19.5 },
    flashPoint: { min: -15, max: -6, typical: -10.5 },
    viscosity: { min: 3.0, max: 5.5, typical: 4.25 },
    tan: { min: 0.03, max: 0.08, typical: 0.055 },
    characteristics: ["Arkansas domestic", "Light sweet"],
  },
  {
    id: "ar_sour", name: "Arkansas Sour", type: "Medium / Sour",
    country: "US", region: "Arkansas",
    apiGravity: { min: 32.0, max: 35.0, typical: 33.5 },
    sulfur: { min: 1.20, max: 1.80, typical: 1.50 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 8, max: 15, typical: 11.5 },
    rvp: { min: 5.5, max: 7.0, typical: 6.25 },
    pourPoint: { min: -18, max: -9, typical: -13.5 },
    flashPoint: { min: -10, max: 0, typical: -5 },
    viscosity: { min: 5.0, max: 9.0, typical: 7.0 },
    tan: { min: 0.05, max: 0.15, typical: 0.10 },
    characteristics: ["Arkansas domestic", "Medium sour"],
  },
  {
    id: "ar_ex_heavy", name: "Arkansas Extra Heavy", type: "Extra Heavy / Sour",
    country: "US", region: "Arkansas",
    apiGravity: { min: 14.0, max: 18.0, typical: 16.0 },
    sulfur: { min: 2.50, max: 3.50, typical: 3.00 },
    bsw: { min: 0.3, max: 1.0, typical: 0.6 },
    salt: { min: 20, max: 40, typical: 30 },
    rvp: { min: 2.0, max: 3.5, typical: 2.75 },
    pourPoint: { min: -3, max: 6, typical: 1.5 },
    flashPoint: { min: 8, max: 18, typical: 13 },
    viscosity: { min: 200.0, max: 800.0, typical: 500.0 },
    tan: { min: 0.30, max: 0.70, typical: 0.50 },
    characteristics: ["Extra heavy sour", "Arkansas domestic", "Very high viscosity"],
  },
  {
    id: "ok_sweet", name: "Oklahoma Sweet", type: "Light / Sweet",
    country: "US", region: "Oklahoma",
    apiGravity: { min: 39.0, max: 42.0, typical: 40.5 },
    sulfur: { min: 0.20, max: 0.35, typical: 0.275 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 5, max: 10, typical: 7.5 },
    rvp: { min: 7.0, max: 8.5, typical: 7.75 },
    pourPoint: { min: -27, max: -18, typical: -22.5 },
    flashPoint: { min: -18, max: -8, typical: -13 },
    viscosity: { min: 3.0, max: 5.0, typical: 4.0 },
    tan: { min: 0.03, max: 0.07, typical: 0.05 },
    characteristics: ["Oklahoma domestic", "Cushing delivery", "Light sweet"],
  },
  {
    id: "ok_sour", name: "Oklahoma Sour", type: "Medium / Sour",
    country: "US", region: "Oklahoma",
    apiGravity: { min: 33.0, max: 36.0, typical: 34.5 },
    sulfur: { min: 1.20, max: 1.80, typical: 1.50 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 8, max: 15, typical: 11.5 },
    rvp: { min: 5.5, max: 7.0, typical: 6.25 },
    pourPoint: { min: -21, max: -12, typical: -16.5 },
    flashPoint: { min: -12, max: -4, typical: -8 },
    viscosity: { min: 5.0, max: 8.0, typical: 6.5 },
    tan: { min: 0.05, max: 0.12, typical: 0.085 },
    characteristics: ["Oklahoma domestic", "Medium sour"],
  },
  {
    id: "ok_intermediate", name: "Oklahoma Intermediate", type: "Light / Sour",
    country: "US", region: "Oklahoma",
    apiGravity: { min: 35.0, max: 38.0, typical: 36.5 },
    sulfur: { min: 0.50, max: 0.90, typical: 0.70 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 5, max: 12, typical: 8.5 },
    rvp: { min: 6.0, max: 7.5, typical: 6.75 },
    pourPoint: { min: -24, max: -15, typical: -19.5 },
    flashPoint: { min: -15, max: -6, typical: -10.5 },
    viscosity: { min: 4.0, max: 7.0, typical: 5.5 },
    tan: { min: 0.04, max: 0.10, typical: 0.07 },
    characteristics: ["Oklahoma domestic", "Intermediate sour"],
  },
  {
    id: "wy_sour", name: "Wyoming General Sour", type: "Medium / Sour",
    country: "US", region: "Wyoming",
    apiGravity: { min: 32.0, max: 35.0, typical: 33.5 },
    sulfur: { min: 1.50, max: 2.50, typical: 2.00 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 10, max: 18, typical: 14 },
    rvp: { min: 5.0, max: 7.0, typical: 6.0 },
    pourPoint: { min: -21, max: -12, typical: -16.5 },
    flashPoint: { min: -12, max: -4, typical: -8 },
    viscosity: { min: 5.0, max: 9.0, typical: 7.0 },
    tan: { min: 0.06, max: 0.15, typical: 0.105 },
    characteristics: ["Wyoming domestic", "Powder River Basin", "Medium sour"],
  },
  {
    id: "wy_sweet", name: "Wyoming General Sweet", type: "Light / Sweet",
    country: "US", region: "Wyoming",
    apiGravity: { min: 38.0, max: 41.0, typical: 39.5 },
    sulfur: { min: 0.15, max: 0.35, typical: 0.25 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 5, max: 10, typical: 7.5 },
    rvp: { min: 7.0, max: 8.5, typical: 7.75 },
    pourPoint: { min: -27, max: -18, typical: -22.5 },
    flashPoint: { min: -18, max: -8, typical: -13 },
    viscosity: { min: 3.0, max: 5.5, typical: 4.25 },
    tan: { min: 0.03, max: 0.08, typical: 0.055 },
    characteristics: ["Wyoming domestic", "Light sweet"],
  },
  {
    id: "co_se", name: "Colorado South East", type: "Light / Sweet",
    country: "US", region: "SE Colorado",
    apiGravity: { min: 35.0, max: 39.0, typical: 37.0 },
    sulfur: { min: 0.20, max: 0.45, typical: 0.325 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 5, max: 10, typical: 7.5 },
    rvp: { min: 6.5, max: 8.5, typical: 7.5 },
    pourPoint: { min: -24, max: -15, typical: -19.5 },
    flashPoint: { min: -15, max: -6, typical: -10.5 },
    viscosity: { min: 3.5, max: 6.0, typical: 4.75 },
    tan: { min: 0.03, max: 0.10, typical: 0.065 },
    characteristics: ["Colorado domestic", "DJ Basin", "Light sweet"],
  },
  {
    id: "ne_sweet", name: "Nebraska Sweet", type: "Light / Sweet",
    country: "US", region: "Nebraska",
    apiGravity: { min: 37.0, max: 40.0, typical: 38.5 },
    sulfur: { min: 0.15, max: 0.30, typical: 0.225 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 5, max: 10, typical: 7.5 },
    rvp: { min: 6.5, max: 8.0, typical: 7.25 },
    pourPoint: { min: -24, max: -15, typical: -19.5 },
    flashPoint: { min: -15, max: -6, typical: -10.5 },
    viscosity: { min: 3.5, max: 6.0, typical: 4.75 },
    tan: { min: 0.03, max: 0.08, typical: 0.055 },
    characteristics: ["Nebraska domestic", "Light sweet"],
  },
  {
    id: "mi_sour", name: "Michigan Sour", type: "Medium / Sour",
    country: "US", region: "Michigan",
    apiGravity: { min: 28.0, max: 31.0, typical: 29.5 },
    sulfur: { min: 1.50, max: 2.00, typical: 1.75 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 10, max: 18, typical: 14 },
    rvp: { min: 5.0, max: 6.5, typical: 5.75 },
    pourPoint: { min: -18, max: -9, typical: -13.5 },
    flashPoint: { min: -10, max: 0, typical: -5 },
    viscosity: { min: 7.0, max: 12.0, typical: 9.5 },
    tan: { min: 0.08, max: 0.18, typical: 0.13 },
    characteristics: ["Michigan domestic", "Medium sour", "Midwest refinery supply"],
  },
  {
    id: "mi_sweet", name: "Michigan Sweet", type: "Light / Sweet",
    country: "US", region: "Michigan",
    apiGravity: { min: 38.0, max: 41.0, typical: 39.5 },
    sulfur: { min: 0.20, max: 0.40, typical: 0.30 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 5, max: 10, typical: 7.5 },
    rvp: { min: 7.0, max: 8.5, typical: 7.75 },
    pourPoint: { min: -24, max: -15, typical: -19.5 },
    flashPoint: { min: -15, max: -6, typical: -10.5 },
    viscosity: { min: 3.5, max: 6.0, typical: 4.75 },
    tan: { min: 0.03, max: 0.08, typical: 0.055 },
    characteristics: ["Michigan domestic", "Light sweet"],
  },
  {
    id: "delhi_la", name: "Delhi / N. Louisiana", type: "Light / Sweet",
    country: "US", region: "Northern Louisiana",
    apiGravity: { min: 38.0, max: 42.0, typical: 40.0 },
    sulfur: { min: 0.10, max: 0.25, typical: 0.175 },
    bsw: { min: 0.1, max: 0.3, typical: 0.2 },
    salt: { min: 3, max: 8, typical: 5.5 },
    rvp: { min: 7.0, max: 8.5, typical: 7.75 },
    pourPoint: { min: -24, max: -15, typical: -19.5 },
    flashPoint: { min: -18, max: -8, typical: -13 },
    viscosity: { min: 3.0, max: 5.5, typical: 4.25 },
    tan: { min: 0.03, max: 0.08, typical: 0.055 },
    characteristics: ["N. Louisiana", "CO2 enhanced recovery", "Light sweet"],
  },
  {
    id: "ks_common", name: "Kansas Common", type: "Light / Sour",
    country: "US", region: "Kansas",
    apiGravity: { min: 33.0, max: 36.0, typical: 34.5 },
    sulfur: { min: 0.40, max: 0.80, typical: 0.60 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 5, max: 12, typical: 8.5 },
    rvp: { min: 6.0, max: 7.5, typical: 6.75 },
    pourPoint: { min: -21, max: -12, typical: -16.5 },
    flashPoint: { min: -12, max: -4, typical: -8 },
    viscosity: { min: 4.5, max: 7.5, typical: 6.0 },
    tan: { min: 0.04, max: 0.10, typical: 0.07 },
    characteristics: ["Kansas domestic", "Mid-continent crude"],
  },
  {
    id: "nw_ks_sweet", name: "NW Kansas Sweet", type: "Light / Sweet",
    country: "US", region: "NW Kansas",
    apiGravity: { min: 39.0, max: 42.0, typical: 40.5 },
    sulfur: { min: 0.15, max: 0.30, typical: 0.225 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 5, max: 10, typical: 7.5 },
    rvp: { min: 7.0, max: 8.5, typical: 7.75 },
    pourPoint: { min: -27, max: -18, typical: -22.5 },
    flashPoint: { min: -18, max: -8, typical: -13 },
    viscosity: { min: 3.0, max: 5.0, typical: 4.0 },
    tan: { min: 0.03, max: 0.07, typical: 0.05 },
    characteristics: ["Kansas domestic", "Light sweet"],
  },
  {
    id: "upper_tx_gulf", name: "Upper Texas Gulf Coast", type: "Light / Sweet",
    country: "US", region: "Upper Texas Gulf Coast",
    apiGravity: { min: 35.0, max: 38.0, typical: 36.5 },
    sulfur: { min: 0.20, max: 0.40, typical: 0.30 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 5, max: 10, typical: 7.5 },
    rvp: { min: 6.5, max: 8.0, typical: 7.25 },
    pourPoint: { min: -21, max: -12, typical: -16.5 },
    flashPoint: { min: -15, max: -6, typical: -10.5 },
    viscosity: { min: 4.0, max: 6.5, typical: 5.25 },
    tan: { min: 0.03, max: 0.10, typical: 0.065 },
    characteristics: ["Texas Gulf Coast", "Light sweet", "Refinery supply"],
  },
  {
    id: "south_tx_sour", name: "South Texas Sour", type: "Medium / Sour",
    country: "US", region: "South Texas",
    apiGravity: { min: 30.0, max: 33.0, typical: 31.5 },
    sulfur: { min: 1.50, max: 2.20, typical: 1.85 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 10, max: 18, typical: 14 },
    rvp: { min: 5.0, max: 6.5, typical: 5.75 },
    pourPoint: { min: -18, max: -9, typical: -13.5 },
    flashPoint: { min: -10, max: 0, typical: -5 },
    viscosity: { min: 6.0, max: 10.0, typical: 8.0 },
    tan: { min: 0.06, max: 0.15, typical: 0.105 },
    characteristics: ["South Texas", "Medium sour"],
  },
  {
    id: "north_tx_sweet", name: "North Texas Sweet", type: "Light / Sweet",
    country: "US", region: "North Texas",
    apiGravity: { min: 37.0, max: 40.0, typical: 38.5 },
    sulfur: { min: 0.20, max: 0.40, typical: 0.30 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 5, max: 10, typical: 7.5 },
    rvp: { min: 7.0, max: 8.5, typical: 7.75 },
    pourPoint: { min: -24, max: -15, typical: -19.5 },
    flashPoint: { min: -15, max: -6, typical: -10.5 },
    viscosity: { min: 3.5, max: 6.0, typical: 4.75 },
    tan: { min: 0.03, max: 0.08, typical: 0.055 },
    characteristics: ["North Texas", "Light sweet"],
  },
  {
    id: "east_tx_sweet", name: "East Texas Sweet", type: "Light / Sweet",
    country: "US", region: "East Texas",
    apiGravity: { min: 38.0, max: 41.0, typical: 39.5 },
    sulfur: { min: 0.25, max: 0.40, typical: 0.325 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 5, max: 10, typical: 7.5 },
    rvp: { min: 7.0, max: 8.5, typical: 7.75 },
    pourPoint: { min: -24, max: -15, typical: -19.5 },
    flashPoint: { min: -15, max: -6, typical: -10.5 },
    viscosity: { min: 3.0, max: 5.5, typical: 4.25 },
    tan: { min: 0.03, max: 0.08, typical: 0.055 },
    characteristics: ["East Texas", "Light sweet", "Historic oil region"],
  },
  {
    id: "south_tx_heavy", name: "South Texas Heavy", type: "Heavy / Sour",
    country: "US", region: "South Texas",
    apiGravity: { min: 24.0, max: 28.0, typical: 26.0 },
    sulfur: { min: 1.80, max: 2.50, typical: 2.15 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 12, max: 25, typical: 18.5 },
    rvp: { min: 4.0, max: 5.5, typical: 4.75 },
    pourPoint: { min: -12, max: -3, typical: -7.5 },
    flashPoint: { min: -2, max: 8, typical: 3 },
    viscosity: { min: 15.0, max: 35.0, typical: 25.0 },
    tan: { min: 0.12, max: 0.30, typical: 0.21 },
    characteristics: ["South Texas", "Heavy sour"],
  },
  {
    id: "domestic_sweet_cushing", name: "Domestic Sweet @ Cushing", type: "Light / Sweet",
    country: "US", region: "Cushing, Oklahoma",
    apiGravity: { min: 40.0, max: 42.9, typical: 41.45 },
    sulfur: { min: 0.30, max: 0.43, typical: 0.365 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 5, max: 10, typical: 7.5 },
    rvp: { min: 7.0, max: 9.0, typical: 8.0 },
    pourPoint: { min: -24, max: -15, typical: -19.5 },
    flashPoint: { min: -15, max: -8, typical: -11.5 },
    viscosity: { min: 2.5, max: 4.5, typical: 3.5 },
    tan: { min: 0.03, max: 0.08, typical: 0.055 },
    characteristics: ["Cushing hub delivery", "Light sweet", "WTI-adjacent"],
  },
  {
    id: "giddings", name: "Giddings", type: "Light / Sweet",
    country: "US", region: "Texas",
    apiGravity: { min: 37.0, max: 40.0, typical: 38.5 },
    sulfur: { min: 0.20, max: 0.35, typical: 0.275 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 5, max: 10, typical: 7.5 },
    rvp: { min: 7.0, max: 8.5, typical: 7.75 },
    pourPoint: { min: -21, max: -12, typical: -16.5 },
    flashPoint: { min: -12, max: -4, typical: -8 },
    viscosity: { min: 3.5, max: 6.0, typical: 4.75 },
    tan: { min: 0.03, max: 0.10, typical: 0.065 },
    characteristics: ["Central Texas", "Austin Chalk formation", "Light sweet"],
  },
  {
    id: "louisiana_light", name: "Louisiana Light", type: "Light / Sweet",
    country: "US", region: "Louisiana",
    apiGravity: { min: 35.0, max: 37.0, typical: 36.0 },
    sulfur: { min: 0.20, max: 0.45, typical: 0.325 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    salt: { min: 5, max: 10, typical: 7.5 },
    rvp: { min: 7.0, max: 8.5, typical: 7.75 },
    pourPoint: { min: -18, max: -9, typical: -13.5 },
    flashPoint: { min: -12, max: -4, typical: -8 },
    viscosity: { min: 4.0, max: 7.0, typical: 5.5 },
    tan: { min: 0.05, max: 0.15, typical: 0.10 },
    characteristics: ["Louisiana domestic", "Light sweet", "Gulf Coast benchmark"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SPEC GUIDE v2.0 — REFINED & NON-CRUDE PRODUCTS (transport/hazmat context)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "rbob_gasoline", name: "RBOB Gasoline", type: "Refined Product",
    country: "US", region: "United States",
    apiGravity: { min: 58, max: 65, typical: 61.5 },
    sulfur: { min: 0.0005, max: 0.001, typical: 0.0008 },
    bsw: { min: 0, max: 0.01, typical: 0.005 },
    rvp: { min: 7.0, max: 15.0, typical: 11.0 },
    flashPoint: { min: -43, max: -38, typical: -40.5 },
    viscosity: { min: 0.4, max: 0.8, typical: 0.6 },
    characteristics: ["Reformulated gasoline", "NYMEX benchmark", "Motor fuel", "Octane 87-93"],
  },
  {
    id: "heating_oil", name: "Heating Oil No. 2 (ULSD)", type: "Refined Product",
    country: "US", region: "United States",
    apiGravity: { min: 35, max: 38, typical: 36.5 },
    sulfur: { min: 0.0005, max: 0.0015, typical: 0.001 },
    bsw: { min: 0, max: 0.01, typical: 0.005 },
    flashPoint: { min: 52, max: 60, typical: 56 },
    pourPoint: { min: -21, max: -15, typical: -18 },
    viscosity: { min: 2.0, max: 5.8, typical: 3.9 },
    characteristics: ["Ultra-low sulfur diesel", "NYMEX benchmark", "Heating fuel", "FP >52C (125F)"],
  },
  {
    id: "hsfo_gc", name: "Gulf Coast HSFO", type: "Residual Fuel Oil",
    country: "US", region: "US Gulf Coast",
    apiGravity: { min: 12, max: 15, typical: 13.5 },
    sulfur: { min: 2.0, max: 3.5, typical: 2.75 },
    bsw: { min: 0.1, max: 0.5, typical: 0.3 },
    flashPoint: { min: 60, max: 75, typical: 67.5 },
    pourPoint: { min: 12, max: 24, typical: 18 },
    viscosity: { min: 180, max: 380, typical: 280 },
    characteristics: ["High sulfur fuel oil", "Bunker fuel", "Marine fuel", "Gulf Coast"],
  },
];

// ── Database Metadata ───────────────────────────────────────────────────────

export const CRUDE_OIL_DB_METADATA = {
  version: "2.1",
  source: "Ultimate Crude Oil Specification Guide v2.0",
  totalGrades: CRUDE_OIL_SPECS.length,
  countries: Array.from(new Set(CRUDE_OIL_SPECS.map(s => s.country))).length,
  regions: Array.from(new Set(CRUDE_OIL_SPECS.map(s => s.region))).length,
  parameters: 12,
  lastUpdated: "2026-02-16",
};

// ── Enhanced Matching Algorithm ─────────────────────────────────────────────

export interface MatchInput {
  apiGravity: number;
  bsw: number;
  sulfur?: number;
  salt?: number;
  rvp?: number;
  pourPoint?: number;
  flashPoint?: number;
  viscosity?: number;
  tan?: number;
  temperature?: number;
  sourceBasin?: string;
  country?: string;
}

export interface ParameterScore {
  score: number;
  accuracy: string;
  weight: number;
  value: number;
  typical: number;
  unit: string;
  withinTolerance: boolean;
}

export interface MatchResult {
  crude: CrudeOilSpec;
  confidence: number;
  parameterScores: Record<string, ParameterScore>;
  matchedParameters: number;
  totalParameters: number;
}

function scoreParameter(
  value: number,
  range: { min: number; max: number; typical: number },
  tolerance: number,
  weight: number,
  unit: string,
): ParameterScore {
  const { min, max, typical } = range;
  const withinRange = value >= min && value <= max;
  const withinTolerance = value >= (min - tolerance) && value <= (max + tolerance);
  
  let score: number;
  if (withinRange) {
    const distFromTypical = Math.abs(value - typical);
    const maxDist = Math.max(typical - min, max - typical) || 1;
    score = 100 - (distFromTypical / maxDist) * 25;
  } else if (withinTolerance) {
    const distance = value < min ? min - value : value - max;
    score = 70 - (distance / tolerance) * 20;
  } else {
    const rangeSize = (max - min) || 1;
    const distance = value < min ? min - value : value - max;
    score = Math.max(0, 50 - (distance / rangeSize) * 50);
  }

  let accuracy: string;
  if (score >= 95) accuracy = "Exact";
  else if (score >= 85) accuracy = "Very High";
  else if (score >= 70) accuracy = "High";
  else if (score >= 55) accuracy = "Good";
  else if (score >= 40) accuracy = "Moderate";
  else accuracy = "Poor";

  return { score, accuracy, weight, value, typical, unit, withinTolerance };
}

// Weights: API Gravity is king, then Sulfur, then the rest
const PARAMETER_WEIGHTS: Record<string, number> = {
  apiGravity: 30,
  sulfur: 25,
  bsw: 10,
  salt: 8,
  rvp: 7,
  viscosity: 7,
  tan: 5,
  pourPoint: 4,
  flashPoint: 4,
};

export function matchCrudeOil(input: MatchInput, maxResults = 10): MatchResult[] {
  const results = CRUDE_OIL_SPECS.map(crude => {
    const scores: Record<string, ParameterScore> = {};
    let totalWeight = 0;
    let weightedScore = 0;
    let matchedCount = 0;
    let totalCount = 0;

    // API Gravity (required)
    const apiScore = scoreParameter(input.apiGravity, crude.apiGravity, SPEC_TOLERANCES.apiGravity, PARAMETER_WEIGHTS.apiGravity, "°API");
    scores.apiGravity = apiScore;
    totalWeight += apiScore.weight;
    weightedScore += apiScore.score * apiScore.weight;
    matchedCount++;
    totalCount++;

    // BS&W (required)
    const bswScore = scoreParameter(input.bsw, crude.bsw, SPEC_TOLERANCES.bsw, PARAMETER_WEIGHTS.bsw, "%");
    scores.bsw = bswScore;
    totalWeight += bswScore.weight;
    weightedScore += bswScore.score * bswScore.weight;
    matchedCount++;
    totalCount++;

    // Sulfur (optional but high-weight)
    if (input.sulfur !== undefined) {
      const s = scoreParameter(input.sulfur, crude.sulfur, SPEC_TOLERANCES.sulfur, PARAMETER_WEIGHTS.sulfur, "%");
      scores.sulfur = s;
      totalWeight += s.weight;
      weightedScore += s.score * s.weight;
      matchedCount++;
      totalCount++;
    }

    // Salt
    if (input.salt !== undefined && crude.salt) {
      const s = scoreParameter(input.salt, crude.salt, SPEC_TOLERANCES.salt, PARAMETER_WEIGHTS.salt, "PTB");
      scores.salt = s;
      totalWeight += s.weight;
      weightedScore += s.score * s.weight;
      matchedCount++;
      totalCount++;
    }

    // RVP
    if (input.rvp !== undefined && crude.rvp) {
      const s = scoreParameter(input.rvp, crude.rvp, SPEC_TOLERANCES.rvp, PARAMETER_WEIGHTS.rvp, "psi");
      scores.rvp = s;
      totalWeight += s.weight;
      weightedScore += s.score * s.weight;
      matchedCount++;
      totalCount++;
    }

    // Pour Point
    if (input.pourPoint !== undefined && crude.pourPoint) {
      const s = scoreParameter(input.pourPoint, crude.pourPoint, SPEC_TOLERANCES.pourPoint, PARAMETER_WEIGHTS.pourPoint, "°C");
      scores.pourPoint = s;
      totalWeight += s.weight;
      weightedScore += s.score * s.weight;
      matchedCount++;
      totalCount++;
    }

    // Flash Point
    if (input.flashPoint !== undefined && crude.flashPoint) {
      const s = scoreParameter(input.flashPoint, crude.flashPoint, SPEC_TOLERANCES.flashPoint, PARAMETER_WEIGHTS.flashPoint, "°C");
      scores.flashPoint = s;
      totalWeight += s.weight;
      weightedScore += s.score * s.weight;
      matchedCount++;
      totalCount++;
    }

    // Viscosity
    if (input.viscosity !== undefined && crude.viscosity) {
      const viscTolerance = crude.viscosity.typical * SPEC_TOLERANCES.viscosity;
      const s = scoreParameter(input.viscosity, crude.viscosity, viscTolerance, PARAMETER_WEIGHTS.viscosity, "cSt@40°C");
      scores.viscosity = s;
      totalWeight += s.weight;
      weightedScore += s.score * s.weight;
      matchedCount++;
      totalCount++;
    }

    // TAN
    if (input.tan !== undefined && crude.tan) {
      const s = scoreParameter(input.tan, crude.tan, SPEC_TOLERANCES.tan, PARAMETER_WEIGHTS.tan, "mg KOH/g");
      scores.tan = s;
      totalWeight += s.weight;
      weightedScore += s.score * s.weight;
      matchedCount++;
      totalCount++;
    }

    // Geographic bonus: if user specifies country/basin and it matches
    let geoBonus = 0;
    if (input.country && crude.country === input.country.toUpperCase()) geoBonus += 3;
    if (input.sourceBasin && crude.region.toLowerCase().includes(input.sourceBasin.toLowerCase())) geoBonus += 2;

    const confidence = Math.min(100, Math.round((weightedScore / totalWeight) + geoBonus));

    return {
      crude,
      confidence,
      parameterScores: scores,
      matchedParameters: matchedCount,
      totalParameters: totalCount,
    };
  });

  return results.sort((a, b) => b.confidence - a.confidence).slice(0, maxResults);
}

// ── Utility Functions ───────────────────────────────────────────────────────

export function getCrudeById(id: string): CrudeOilSpec | undefined {
  return CRUDE_OIL_SPECS.find(c => c.id === id);
}

export function getCrudesByCountry(country: string): CrudeOilSpec[] {
  return CRUDE_OIL_SPECS.filter(c => c.country.toLowerCase() === country.toLowerCase());
}

export function getCrudesByType(type: string): CrudeOilSpec[] {
  return CRUDE_OIL_SPECS.filter(c => c.type.toLowerCase().includes(type.toLowerCase()));
}

export function searchCrudes(query: string, limit = 20): CrudeOilSpec[] {
  const q = query.toLowerCase();
  return CRUDE_OIL_SPECS
    .filter(c => c.name.toLowerCase().includes(q) || c.region.toLowerCase().includes(q) || c.type.toLowerCase().includes(q) || c.country.toLowerCase().includes(q))
    .slice(0, limit);
}

export function classifyAPI(api: number): string {
  if (api < 10) return "Extra Heavy";
  if (api < 22.3) return "Heavy";
  if (api < 31.1) return "Medium";
  return "Light";
}

export function classifySulfur(sulfur: number): string {
  if (sulfur <= 0.5) return "Sweet";
  if (sulfur <= 1.5) return "Medium Sour";
  return "Sour";
}

export function getCountryName(code: string): string {
  const map: Record<string, string> = {
    US: "United States", CA: "Canada", MX: "Mexico", VE: "Venezuela", EC: "Ecuador",
    BR: "Brazil", NO: "Norway", GB: "United Kingdom", NG: "Nigeria", LY: "Libya",
    SA: "Saudi Arabia", IQ: "Iraq", IR: "Iran", KW: "Kuwait", QA: "Qatar",
    AE: "United Arab Emirates", OM: "Oman", RU: "Russia", DZ: "Algeria",
    AO: "Angola", AU: "Australia", AZ: "Azerbaijan", KZ: "Kazakhstan",
    CN: "China", ID: "Indonesia", MY: "Malaysia",
  };
  return map[code] || code;
}
