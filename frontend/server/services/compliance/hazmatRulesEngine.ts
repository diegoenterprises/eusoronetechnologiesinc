/**
 * HAZMAT RULES ENGINE — 49 CFR Parts 172, 173, 177 + ERG 2024
 * ═══════════════════════════════════════════════════════════════
 *
 * Given hazmat class, division, packing group → returns:
 *   - Required placards, labels, markings
 *   - Required shipping documents
 *   - Loading/segregation rules (49 CFR §177.848)
 *   - ERG guide number + initial isolation distances
 *   - Driver training requirements
 *   - Emergency response info (CHEMTREC, NRC)
 *
 * Phase 1: Static rule lookup (no AI). Covers Classes 1-9.
 * Phase 2: Will add AI-powered regulatory change detection.
 *
 * Usage:
 *   const reqs = getRequirements("3", "3.1", "II");
 *   // → { placards: ["FLAMMABLE 3"], labels: [...], ergGuide: 128, ... }
 */

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export interface HazmatRequirements {
  hazardClass: string;
  division: string | null;
  packingGroup: string | null;
  className: string;
  placards: string[];
  labels: string[];
  markings: string[];
  shippingDocuments: string[];
  segregationRules: SegregationRule[];
  ergGuide: number | null;
  initialIsolationFt: number;
  protectiveActionMi: number;
  driverTraining: string[];
  vehicleRequirements: string[];
  emergencyContacts: EmergencyContact[];
  specialProvisions: string[];
  cfrReferences: string[];
  reportableQuantityLbs: number | null;
  marinePollutant: boolean;
  poisonInhalationHazard: boolean;
}

export interface SegregationRule {
  incompatibleClass: string;
  rule: "DO_NOT_LOAD" | "SEPARATE_BY_PARTITION" | "SEPARATE_COMPARTMENTS" | "ALLOWED";
  cfrReference: string;
  description: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  available: string;
  purpose: string;
}

// ═══════════════════════════════════════════════════════════════════════
// HAZARD CLASS DEFINITIONS (49 CFR §173.2)
// ═══════════════════════════════════════════════════════════════════════

const HAZARD_CLASSES: Record<string, { name: string; divisions: Record<string, string> }> = {
  "1": {
    name: "Explosives",
    divisions: {
      "1.1": "Mass explosion hazard",
      "1.2": "Projection hazard",
      "1.3": "Fire hazard / minor blast",
      "1.4": "No significant blast hazard",
      "1.5": "Very insensitive explosives",
      "1.6": "Extremely insensitive articles",
    },
  },
  "2": {
    name: "Gases",
    divisions: {
      "2.1": "Flammable gas",
      "2.2": "Non-flammable/non-toxic gas",
      "2.3": "Toxic gas",
    },
  },
  "3": {
    name: "Flammable Liquids",
    divisions: { "3.1": "Flash point <−18°C", "3.2": "Flash point −18°C to 23°C", "3.3": "Flash point 23°C to 60°C" },
  },
  "4": {
    name: "Flammable Solids",
    divisions: {
      "4.1": "Flammable solid",
      "4.2": "Spontaneously combustible",
      "4.3": "Dangerous when wet",
    },
  },
  "5": {
    name: "Oxidizers & Organic Peroxides",
    divisions: { "5.1": "Oxidizer", "5.2": "Organic peroxide" },
  },
  "6": {
    name: "Toxic & Infectious Substances",
    divisions: { "6.1": "Toxic", "6.2": "Infectious substance" },
  },
  "7": { name: "Radioactive Material", divisions: {} },
  "8": { name: "Corrosives", divisions: {} },
  "9": { name: "Miscellaneous Dangerous Goods", divisions: {} },
};

// ═══════════════════════════════════════════════════════════════════════
// PLACARD RULES (49 CFR §172.504)
// ═══════════════════════════════════════════════════════════════════════

const PLACARD_MAP: Record<string, string[]> = {
  "1.1": ["EXPLOSIVES 1.1"],
  "1.2": ["EXPLOSIVES 1.2"],
  "1.3": ["EXPLOSIVES 1.3"],
  "1.4": ["EXPLOSIVES 1.4"],
  "1.5": ["EXPLOSIVES 1.5"],
  "1.6": ["EXPLOSIVES 1.6"],
  "2.1": ["FLAMMABLE GAS"],
  "2.2": ["NON-FLAMMABLE GAS"],
  "2.3": ["POISON GAS"],
  "3": ["FLAMMABLE 3"],
  "3.1": ["FLAMMABLE 3"],
  "3.2": ["FLAMMABLE 3"],
  "3.3": ["COMBUSTIBLE"],
  "4.1": ["FLAMMABLE SOLID"],
  "4.2": ["SPONTANEOUSLY COMBUSTIBLE"],
  "4.3": ["DANGEROUS WHEN WET"],
  "5.1": ["OXIDIZER"],
  "5.2": ["ORGANIC PEROXIDE"],
  "6.1": ["POISON"],
  "6.2": ["INFECTIOUS SUBSTANCE"],
  "7": ["RADIOACTIVE"],
  "8": ["CORROSIVE"],
  "9": ["CLASS 9"],
};

// ═══════════════════════════════════════════════════════════════════════
// ERG GUIDE MAPPING — Common UN numbers → ERG guide
// Full ERG 2024 database (subset of most common hazmat commodities)
// ═══════════════════════════════════════════════════════════════════════

const ERG_BY_CLASS: Record<string, number> = {
  "1.1": 112, "1.2": 112, "1.3": 112, "1.4": 114, "1.5": 112, "1.6": 112,
  "2.1": 115, "2.2": 120, "2.3": 123,
  "3": 128, "3.1": 128, "3.2": 127, "3.3": 128,
  "4.1": 134, "4.2": 136, "4.3": 139,
  "5.1": 140, "5.2": 146,
  "6.1": 153, "6.2": 158,
  "7": 163,
  "8": 154,
  "9": 171,
};

const ERG_BY_UN: Record<string, number> = {
  "UN1005": 125, // Ammonia, anhydrous
  "UN1017": 124, // Chlorine
  "UN1023": 119, // Coal gas
  "UN1038": 115, // Ethylene, refrigerated
  "UN1040": 116, // Ethylene oxide
  "UN1049": 115, // Hydrogen
  "UN1050": 125, // Hydrogen chloride
  "UN1051": 131, // Hydrogen cyanide
  "UN1053": 117, // Hydrogen sulfide
  "UN1072": 122, // Oxygen, compressed
  "UN1075": 115, // Petroleum gases
  "UN1076": 125, // Phosgene
  "UN1079": 125, // Sulfur dioxide
  "UN1090": 127, // Acetone
  "UN1170": 127, // Ethanol
  "UN1202": 128, // Diesel fuel
  "UN1203": 128, // Gasoline
  "UN1230": 131, // Methanol
  "UN1267": 128, // Petroleum crude oil
  "UN1268": 128, // Petroleum distillates
  "UN1294": 130, // Toluene
  "UN1428": 138, // Sodium
  "UN1680": 157, // Potassium cyanide
  "UN1789": 157, // Hydrochloric acid
  "UN1791": 154, // Sodium hypochlorite solution
  "UN1805": 154, // Phosphoric acid
  "UN1824": 154, // Sodium hydroxide solution
  "UN1830": 137, // Sulfuric acid
  "UN1831": 137, // Sulfuric acid, fuming
  "UN1863": 128, // Fuel, aviation, turbine engine
  "UN1950": 126, // Aerosols
  "UN1951": 120, // Argon, refrigerated
  "UN1966": 115, // Hydrogen, refrigerated
  "UN1971": 115, // Methane, compressed
  "UN1972": 115, // Methane, refrigerated
  "UN1977": 120, // Nitrogen, refrigerated
  "UN1978": 115, // Propane
  "UN1993": 128, // Flammable liquids, n.o.s.
  "UN2031": 157, // Nitric acid
  "UN2187": 120, // Carbon dioxide, refrigerated
  "UN2209": 153, // Formaldehyde solution
  "UN2672": 154, // Ammonia solution
  "UN2810": 153, // Toxic liquid, organic
  "UN2814": 158, // Infectious substance (human)
  "UN2900": 158, // Infectious substance (animal)
  "UN2908": 161, // Radioactive material, excepted
  "UN3077": 171, // Env. hazardous substance, solid
  "UN3082": 171, // Env. hazardous substance, liquid
  "UN3257": 128, // Elevated temperature liquid
  "UN3334": 171, // Aviation regulated liquid
  "UN3475": 128, // Ethanol & gasoline mix
};

// ═══════════════════════════════════════════════════════════════════════
// INITIAL ISOLATION & PROTECTIVE ACTION DISTANCES (ERG Table 1/2/3)
// ═══════════════════════════════════════════════════════════════════════

const ISOLATION_DISTANCES: Record<string, { isolationFt: number; protectiveMi: number }> = {
  "2.3": { isolationFt: 330, protectiveMi: 0.5 },
  "6.1": { isolationFt: 100, protectiveMi: 0.3 },
  "1.1": { isolationFt: 2640, protectiveMi: 1.0 },
  "1.2": { isolationFt: 2640, protectiveMi: 1.0 },
  "1.3": { isolationFt: 1600, protectiveMi: 0.5 },
  "default": { isolationFt: 100, protectiveMi: 0.1 },
};

// ═══════════════════════════════════════════════════════════════════════
// SEGREGATION TABLE (49 CFR §177.848)
// ═══════════════════════════════════════════════════════════════════════

type SegAction = "X" | "O" | "*" | "";
// X = DO_NOT_LOAD, O = SEPARATE_BY_PARTITION, * = special provisions, "" = ALLOWED
const SEGREGATION_TABLE: Record<string, Record<string, SegAction>> = {
  "1": { "2.1": "X", "2.3": "X", "3": "X", "4.1": "X", "4.2": "X", "4.3": "X", "5.1": "X", "5.2": "X", "6.1": "X", "7": "X", "8": "X" },
  "2.1": { "1": "X", "2.3": "X", "3": "", "4.1": "", "5.1": "X", "5.2": "X", "6.1": "", "8": "" },
  "2.3": { "1": "X", "2.1": "X", "3": "X", "4.1": "X", "5.1": "X", "5.2": "X", "6.1": "X", "8": "X" },
  "3": { "1": "X", "2.3": "X", "4.1": "", "4.3": "O", "5.1": "O", "5.2": "O", "6.1": "", "8": "" },
  "4.1": { "1": "X", "2.3": "X", "5.1": "O", "5.2": "O", "7": "X" },
  "4.2": { "1": "X", "5.1": "O", "5.2": "O", "7": "X" },
  "4.3": { "1": "X", "3": "O", "5.1": "O", "5.2": "O", "8": "O" },
  "5.1": { "1": "X", "2.1": "X", "2.3": "X", "3": "O", "4.1": "O", "4.2": "O", "4.3": "O", "5.2": "O", "8": "O" },
  "5.2": { "1": "X", "2.1": "X", "2.3": "X", "3": "O", "4.1": "O", "4.2": "O", "4.3": "O", "5.1": "O" },
  "6.1": { "1": "X", "2.3": "X", "3": "", "8": "" },
  "8": { "1": "X", "2.3": "X", "3": "", "4.3": "O", "5.1": "O", "6.1": "" },
};

// ═══════════════════════════════════════════════════════════════════════
// EMERGENCY CONTACTS
// ═══════════════════════════════════════════════════════════════════════

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  { name: "CHEMTREC", phone: "1-800-424-9300", available: "24/7", purpose: "Chemical emergency response information" },
  { name: "National Response Center (NRC)", phone: "1-800-424-8802", available: "24/7", purpose: "Federal spill reporting (required for reportable quantities)" },
  { name: "FMCSA Safety Hotline", phone: "1-888-832-7238", available: "24/7", purpose: "Report unsafe commercial vehicles/drivers" },
  { name: "Poison Control", phone: "1-800-222-1222", available: "24/7", purpose: "Human exposure to hazardous materials" },
  { name: "911", phone: "911", available: "24/7", purpose: "Life-threatening emergency" },
];

// ═══════════════════════════════════════════════════════════════════════
// MAIN API: getRequirements()
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get complete hazmat requirements for a given class/division/packing group.
 *
 * @param hazardClass - Hazard class (1-9)
 * @param division - Division (e.g., "3.1", "2.3") — optional
 * @param packingGroup - Packing Group (I, II, or III) — optional
 * @param unNumber - UN number (e.g., "UN1267") — optional, for ERG lookup
 */
export function getRequirements(
  hazardClass: string,
  division?: string | null,
  packingGroup?: string | null,
  unNumber?: string | null
): HazmatRequirements {
  const classKey = hazardClass.split(".")[0];
  const divKey = division || hazardClass;
  const classDef = HAZARD_CLASSES[classKey];
  const className = classDef?.name || `Hazard Class ${hazardClass}`;

  // Placards
  const placards = PLACARD_MAP[divKey] || PLACARD_MAP[classKey] || [`CLASS ${hazardClass}`];

  // Labels (same as placards for most classes)
  const labels = [...placards];

  // Markings
  const markings = buildMarkings(hazardClass, divKey, packingGroup, unNumber);

  // Shipping documents
  const shippingDocuments = buildShippingDocuments(divKey, packingGroup);

  // Segregation rules
  const segregationRules = buildSegregationRules(classKey);

  // ERG guide
  const ergGuide = unNumber ? (ERG_BY_UN[unNumber.toUpperCase()] || ERG_BY_CLASS[divKey] || ERG_BY_CLASS[classKey] || null)
    : (ERG_BY_CLASS[divKey] || ERG_BY_CLASS[classKey] || null);

  // Isolation distances
  const distances = ISOLATION_DISTANCES[divKey] || ISOLATION_DISTANCES[classKey] || ISOLATION_DISTANCES["default"];

  // Driver training
  const driverTraining = buildDriverTraining(classKey, divKey);

  // Vehicle requirements
  const vehicleRequirements = buildVehicleRequirements(classKey, divKey);

  // Special provisions
  const specialProvisions = buildSpecialProvisions(classKey, divKey, packingGroup);

  // CFR references
  const cfrReferences = [
    "49 CFR §172.101 — Hazardous Materials Table",
    "49 CFR §172.200 — Shipping Papers",
    "49 CFR §172.300 — Marking Requirements",
    "49 CFR §172.400 — Labeling Requirements",
    "49 CFR §172.500 — Placarding Requirements",
    "49 CFR §172.600 — Emergency Response Information",
    "49 CFR §173 — Shippers — General Requirements",
    "49 CFR §177 — Carriage by Public Highway",
    "49 CFR §177.848 — Segregation of Hazardous Materials",
  ];

  // PIH check
  const poisonInhalationHazard = divKey === "2.3" || divKey === "6.1";

  return {
    hazardClass,
    division: division || null,
    packingGroup: packingGroup || null,
    className,
    placards,
    labels,
    markings,
    shippingDocuments,
    segregationRules,
    ergGuide,
    initialIsolationFt: distances.isolationFt,
    protectiveActionMi: distances.protectiveMi,
    driverTraining,
    vehicleRequirements,
    emergencyContacts: EMERGENCY_CONTACTS,
    specialProvisions,
    cfrReferences,
    reportableQuantityLbs: null, // Per-substance; looked up from §172.101 table
    marinePollutant: false, // Per-substance
    poisonInhalationHazard,
  };
}

/**
 * Get ERG guide number for a given UN number.
 */
export function getERGGuide(unNumber: string): number | null {
  return ERG_BY_UN[unNumber.toUpperCase()] || null;
}

/**
 * Get ERG guide by class/division.
 */
export function getERGGuideByClass(hazardClass: string, division?: string): number | null {
  return ERG_BY_CLASS[division || hazardClass] || ERG_BY_CLASS[hazardClass.split(".")[0]] || null;
}

/**
 * Check if two hazard classes can be loaded together.
 */
export function canLoadTogether(class1: string, class2: string): { allowed: boolean; rule: string; cfrReference: string } {
  const key1 = class1.split(".")[0] === class1 ? class1 : class1;
  const key2 = class2.split(".")[0] === class2 ? class2 : class2;

  const action = SEGREGATION_TABLE[key1]?.[key2] || SEGREGATION_TABLE[key2]?.[key1] || "";
  switch (action) {
    case "X":
      return { allowed: false, rule: "DO NOT LOAD together", cfrReference: "49 CFR §177.848(d)" };
    case "O":
      return { allowed: false, rule: "Must be separated by a bulkhead or partition", cfrReference: "49 CFR §177.848(d)" };
    case "*":
      return { allowed: true, rule: "Allowed with special provisions — check §177.848(e)", cfrReference: "49 CFR §177.848(e)" };
    default:
      return { allowed: true, rule: "May be loaded together", cfrReference: "49 CFR §177.848" };
  }
}

/**
 * Get the fatigue risk multiplier for hazmat loads.
 * Used by the fatigue prediction pipeline.
 */
export function getHazmatFatigueMultiplier(hazardClass: string): number {
  const classKey = hazardClass.split(".")[0];
  const multipliers: Record<string, number> = {
    "1": 1.5,  // Explosives — highest stress
    "2": 1.2,  // Gases
    "3": 1.15, // Flammable liquids (crude oil, gasoline)
    "4": 1.25, // Flammable solids
    "5": 1.2,  // Oxidizers
    "6": 1.3,  // Toxic/infectious
    "7": 1.4,  // Radioactive
    "8": 1.15, // Corrosives
    "9": 1.05, // Misc
  };
  return multipliers[classKey] || 1.0;
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

function buildMarkings(hazardClass: string, divKey: string, pg: string | null | undefined, un: string | null | undefined): string[] {
  const markings = [
    "Proper shipping name",
    "UN identification number",
  ];
  if (un) markings.push(`UN number marking: ${un}`);
  if (pg) markings.push(`Packing group: ${pg}`);
  if (divKey === "2.3" || divKey === "6.1") markings.push("POISON INHALATION HAZARD marking");
  if (hazardClass === "7") markings.push("Radioactive White-I, Yellow-II, or Yellow-III label");
  markings.push("Orientation arrows (if liquid)");
  return markings;
}

function buildShippingDocuments(divKey: string, pg: string | null | undefined): string[] {
  const docs = [
    "Shipping paper (BOL) with proper shipping name, hazard class, UN/NA number, packing group",
    "Emergency response information (49 CFR §172.602)",
    "Shipper's certification (49 CFR §172.204)",
  ];
  if (divKey.startsWith("1")) docs.push("Explosive approval / EX number");
  if (divKey === "6.2") docs.push("Category A or B infectious substance documentation");
  if (divKey === "7") docs.push("Transport Index (TI) and Criticality Safety Index (CSI)");
  docs.push("24-hour emergency response phone number");
  return docs;
}

function buildSegregationRules(classKey: string): SegregationRule[] {
  const rules: SegregationRule[] = [];
  const classRules = SEGREGATION_TABLE[classKey];
  if (!classRules) return rules;

  for (const [incompatible, action] of Object.entries(classRules)) {
    const classDef = HAZARD_CLASSES[incompatible.split(".")[0]];
    const desc = classDef?.name || `Class ${incompatible}`;
    rules.push({
      incompatibleClass: incompatible,
      rule: action === "X" ? "DO_NOT_LOAD" : action === "O" ? "SEPARATE_BY_PARTITION" : "ALLOWED",
      cfrReference: "49 CFR §177.848(d)",
      description: action === "X"
        ? `Cannot be loaded with ${desc}`
        : action === "O"
          ? `Must be separated from ${desc} by a bulkhead/partition`
          : `May be loaded with ${desc} under special provisions`,
    });
  }
  return rules;
}

function buildDriverTraining(classKey: string, divKey: string): string[] {
  const training = [
    "General awareness/familiarization training (49 CFR §172.704(a)(1))",
    "Function-specific training (49 CFR §172.704(a)(2))",
    "Safety training (49 CFR §172.704(a)(3))",
    "Security awareness training (49 CFR §172.704(a)(4))",
    "In-depth security training for security-sensitive materials (if applicable)",
  ];
  if (classKey === "1") training.push("Explosives-specific handling certification");
  if (divKey === "2.3" || divKey === "6.1") training.push("Poison inhalation hazard (PIH) awareness training");
  if (classKey === "7") training.push("Radiation safety officer (RSO) approval required");
  training.push("Hazmat endorsement (H) on CDL required");
  training.push("Recurrent training every 3 years (49 CFR §172.704(c)(2))");
  return training;
}

function buildVehicleRequirements(classKey: string, divKey: string): string[] {
  const reqs = [
    "Placards visible on all 4 sides of vehicle",
    "Fire extinguisher (minimum 10 B:C rated)",
    "Chock blocks (2 minimum)",
    "Reflective triangles (3 minimum)",
  ];
  if (classKey === "1") {
    reqs.push("No smoking within 25 feet of vehicle");
    reqs.push("Motor must be off during loading/unloading");
    reqs.push("Written route plan required (49 CFR §397.67)");
  }
  if (divKey === "2.1" || classKey === "3") {
    reqs.push("Ground/bonding wire for static discharge");
    reqs.push("No open flames or smoking within 25 feet");
  }
  if (divKey === "2.3" || divKey === "6.1") {
    reqs.push("Gas mask/self-contained breathing apparatus (SCBA) available");
    reqs.push("POISON placard required in addition to primary placard");
  }
  reqs.push("Vehicle inspection before and after loading (49 CFR §392.7)");
  reqs.push("Parking rules: 49 CFR §397.7 (attended, or safe haven, or 5 ft from road)");
  return reqs;
}

function buildSpecialProvisions(classKey: string, divKey: string, pg: string | null | undefined): string[] {
  const provisions: string[] = [];
  if (classKey === "3" && pg === "III") {
    provisions.push("Combustible liquid exception: May be reclassed if flash point > 100°F (§173.150)");
  }
  if (classKey === "3") {
    provisions.push("Petroleum crude oil (UN1267): Must display FLAMMABLE placard; PG I requires DANGER placard");
  }
  if (divKey === "2.1") {
    provisions.push("Limited quantity exception for ≤ 1L containers (§173.306)");
  }
  if (classKey === "1") {
    provisions.push("Route restrictions per 49 CFR Part 397 Subpart D — preferred hazmat routes");
  }
  if (classKey === "7") {
    provisions.push("NRC Nuclear Regulatory Commission approval required for Type B packages");
  }
  return provisions;
}
