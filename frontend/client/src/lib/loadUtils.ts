/**
 * Shared load labeling utilities — single source of truth for
 * how loads are titled, equipment is described, and animations are
 * selected across the entire platform (Find Loads, Load Board,
 * Load Details, Active Trip, etc.).
 *
 * CRITICAL: When the loads table has cargoType "general" but a hazmatClass
 * is set, we MUST derive the proper trailer, animation, and title from
 * the hazmat class. Never show "General Load" for a hazmat shipment.
 *
 * Hazmat class → trailer mapping (49 CFR 173):
 *   1.x  → Explosives     → Dry Van / Flatbed (UN 1.4S consumer ok dry van)
 *   2.1  → Flammable Gas  → MC-331 Pressure Tank
 *   2.2  → Non-Flam Gas   → MC-331 / Cryogenic Tank
 *   2.3  → Toxic Gas       → MC-331 Pressure Tank
 *   3    → Flammable Liq  → MC-306/DOT-406 Liquid Tank
 *   4.x  → Flammable Solid→ Dry Van / Flatbed
 *   5.x  → Oxidizer       → Dry Van / Liquid Tank
 *   6.x  → Toxic/Infect   → Dry Van / Liquid Tank
 *   7    → Radioactive     → Dry Van (Type A/B cask)
 *   8    → Corrosive       → DOT-412 Chemical Tank
 *   9    → Misc Dangerous  → Dry Van
 */

// ═══════════════════════════════════════════════════════════════
// HAZMAT CLASS → TRAILER INFERENCE
// ═══════════════════════════════════════════════════════════════

type InferredTrailer = "liquid_tank" | "gas_tank" | "chemical_tank" | "cryogenic" | "dry_van" | "flatbed" | "reefer" | null;

function inferTrailerFromHazmat(hazmatClass?: string | null): InferredTrailer {
  if (!hazmatClass) return null;
  const cls = hazmatClass.trim();
  if (cls.startsWith("2.1")) return "gas_tank";
  if (cls.startsWith("2.2")) return "gas_tank";
  if (cls.startsWith("2.3")) return "gas_tank";
  if (cls.startsWith("3")) return "liquid_tank";
  if (cls.startsWith("5.1")) return "liquid_tank";
  if (cls.startsWith("6.1")) return "liquid_tank";
  if (cls.startsWith("8")) return "chemical_tank";
  if (cls.startsWith("1")) return "dry_van";
  if (cls.startsWith("4")) return "dry_van";
  if (cls.startsWith("5.2")) return "dry_van";
  if (cls.startsWith("6.2")) return "dry_van";
  if (cls.startsWith("7")) return "dry_van";
  if (cls.startsWith("9")) return "dry_van";
  return null;
}

// ═══════════════════════════════════════════════════════════════
// HAZMAT CLASS LABEL
// ═══════════════════════════════════════════════════════════════

const HAZMAT_CLASS_NAMES: Record<string, string> = {
  "1":   "Explosives",
  "1.1": "Mass Explosion Hazard",
  "1.2": "Projection Hazard",
  "1.3": "Fire/Minor Blast",
  "1.4": "Minor Explosion",
  "1.5": "Blasting Agents",
  "1.6": "Extremely Insensitive",
  "2.1": "Flammable Gas",
  "2.2": "Non-Flammable Gas",
  "2.3": "Toxic Gas",
  "3":   "Flammable Liquid",
  "4.1": "Flammable Solid",
  "4.2": "Spontaneously Combustible",
  "4.3": "Dangerous When Wet",
  "5.1": "Oxidizer",
  "5.2": "Organic Peroxide",
  "6.1": "Toxic Substance",
  "6.2": "Infectious Substance",
  "7":   "Radioactive",
  "8":   "Corrosive",
  "9":   "Miscellaneous Dangerous",
};

function getHazmatClassName(hazmatClass: string): string {
  const cls = hazmatClass.trim();
  return HAZMAT_CLASS_NAMES[cls] || HAZMAT_CLASS_NAMES[cls.split(".")[0]] || `Class ${cls}`;
}

// ═══════════════════════════════════════════════════════════════
// LOAD TITLE
// ═══════════════════════════════════════════════════════════════

/**
 * Returns a human-readable load title that shows the actual product.
 * Order of precedence:
 *  1. commodity/commodityName (the actual product: "Butylene", "Diesel", etc.)
 *  2. hazmatClass → descriptive name ("Flammable Gas Load", "Corrosive Load")
 *  3. cargoType-specific label (petroleum, chemicals, liquid, gas, etc.)
 *  4. "Dry Freight" fallback (never "General Load")
 */
export function getLoadTitle(load: {
  cargoType?: string | null;
  hazmatClass?: string | null;
  commodity?: string | null;
  commodityName?: string | null;
  unNumber?: string | null;
}): string {
  const ct = (load.cargoType || "").toLowerCase();
  const commodity = load.commodity || load.commodityName || "";

  // 1. Show actual product name when available
  if (commodity) return commodity;

  // 2. Hazmat class → descriptive title
  if (load.hazmatClass) {
    return `${getHazmatClassName(load.hazmatClass)} Load`;
  }

  // 3. CargoType-specific labels
  if (ct === "petroleum") return "Petroleum Load";
  if (ct === "chemicals") return "Chemical Load";
  if (ct === "hazmat") return "Hazmat Load";
  if (ct === "liquid") return "Liquid Load";
  if (ct === "gas") return "Gas Load";
  if (ct === "refrigerated") return "Refrigerated Load";
  if (ct === "oversized") return "Oversized Load";

  return "Dry Freight";
}

// ═══════════════════════════════════════════════════════════════
// EQUIPMENT / TRAILER LABEL
// ═══════════════════════════════════════════════════════════════

/**
 * Returns a human-readable equipment/trailer description.
 * When equipmentType is null (loads table doesn't store it),
 * we derive the trailer from cargoType and hazmatClass.
 */
// All 19 equipment types from loadBoard equipmentTypeSchema
const EQUIPMENT_LABELS: Record<string, string> = {
  tanker:          "Petroleum Tank (MC-306)",
  gas_tank:        "Pressurized Gas Tank (MC-331)",
  cryogenic:       "Cryogenic Tank (MC-338)",
  food_grade_tank: "Food-Grade Liquid Tank",
  water_tank:      "Water Tank",
  dry_van:         "Dry Van (53ft)",
  hazmat_van:      "Hazmat-Rated Dry Van",
  flatbed:         "Standard Flatbed",
  step_deck:       "Step Deck / Drop Deck",
  lowboy:          "Lowboy / RGN",
  conestoga:       "Conestoga (Rolling-Tarp)",
  curtainside:     "Curtainside / Tautliner",
  double_drop:     "Double Drop / Stretch",
  reefer:          "Refrigerated (Reefer)",
  bulk_hopper:     "Dry Bulk / Pneumatic Hopper",
  dump_trailer:    "End Dump / Bottom Dump",
  intermodal:      "Intermodal Container Chassis",
  auto_carrier:    "Auto Carrier / Car Hauler",
  livestock:       "Livestock / Cattle Pot",
  // Legacy / alias keys
  tank:            "Liquid Tank Trailer",
  liquid_tank:     "Liquid Tank Trailer",
  chemical_tank:   "Chemical Tank (DOT-412)",
  hopper:          "Dry Bulk / Hopper",
  pneumatic:       "Pneumatic Tank",
  refrigerated:    "Refrigerated (Reefer)",
};

export function getEquipmentLabel(
  equipmentType?: string | null,
  cargoType?: string | null,
  hazmatClass?: string | null,
): string {
  const et = (equipmentType || "").toLowerCase();

  // 1. Explicit equipment type
  if (et && EQUIPMENT_LABELS[et]) return EQUIPMENT_LABELS[et];
  if (et === "dry-van") return EQUIPMENT_LABELS.dry_van;
  if (et === "step-deck") return EQUIPMENT_LABELS.step_deck;

  // 2. Derive from cargoType
  const ct = (cargoType || "").toLowerCase();
  if (ct === "petroleum" || ct === "liquid") return "Liquid Tank Trailer";
  if (ct === "gas") return "Gas Tank Trailer";
  if (ct === "chemicals") return "Chemical Tank Trailer";
  if (ct === "refrigerated") return "Refrigerated (Reefer)";
  if (ct === "oversized") return "Flatbed";

  // 3. Derive from hazmatClass
  const inferred = inferTrailerFromHazmat(hazmatClass);
  if (inferred === "liquid_tank") return "Liquid Tank Trailer";
  if (inferred === "gas_tank") return "Gas Tank Trailer";
  if (inferred === "chemical_tank") return "Chemical Tank Trailer";
  if (inferred === "cryogenic") return "Cryogenic Tank";
  if (inferred === "dry_van") return "Dry Van";
  if (inferred === "flatbed") return "Flatbed";
  if (inferred === "reefer") return "Refrigerated (Reefer)";

  return "Dry Van";
}

// ═══════════════════════════════════════════════════════════════
// ANIMATION TYPE INFERENCE
// ═══════════════════════════════════════════════════════════════

/**
 * Returns the animation key for LoadCargoAnimation.
 * Used by both the component and any external caller that needs to know
 * what animation a load should display.
 *
 * Priority: equipmentType → cargoType → hazmatClass → "dryvan"
 */
export type AnimationType = "liquid" | "gas" | "flatbed" | "reefer" | "dryvan" | "hopper" | "cryogenic" | "hazmat" | "autocarrier" | "livestock" | "dump" | "intermodal" | "default";

// All 19 equipment types → animation key
const EQUIP_ANIM: Record<string, AnimationType> = {
  tanker:          "liquid",       // MC-306 petroleum tank
  gas_tank:        "gas",          // MC-331 pressure tank
  cryogenic:       "cryogenic",    // MC-338 cryogenic tank
  food_grade_tank: "liquid",       // DOT-407 stainless tank
  water_tank:      "liquid",       // Non-DOT liquid tank
  dry_van:         "dryvan",       // 53ft standard van
  hazmat_van:      "hazmat",       // Reinforced van w/ hazmat diamonds
  flatbed:         "flatbed",      // Standard flatbed
  step_deck:       "flatbed",      // Step deck variant
  lowboy:          "flatbed",      // Lowboy/RGN variant
  conestoga:       "flatbed",      // Covered flatbed
  curtainside:     "dryvan",       // Side-access van
  double_drop:     "flatbed",      // Stretch/oversized flatbed
  reefer:          "reefer",       // Refrigerated
  bulk_hopper:     "hopper",       // Pneumatic hopper
  dump_trailer:    "dump",         // End/bottom/side dump
  intermodal:      "intermodal",   // ISO container chassis
  auto_carrier:    "autocarrier",  // Car hauler
  livestock:       "livestock",    // Cattle pot
  // Legacy / alias keys
  tank:            "liquid",
  liquid_tank:     "liquid",
  chemical_tank:   "liquid",
  hopper:          "hopper",
  pneumatic:       "hopper",
};

export function inferAnimationType(
  equipmentType?: string | null,
  cargoType?: string | null,
  hazmatClass?: string | null,
): AnimationType {
  const et = (equipmentType || "").toLowerCase();
  const ct = (cargoType || "").toLowerCase();

  // 1. Equipment type → exact animation
  if (et && EQUIP_ANIM[et]) return EQUIP_ANIM[et];
  if (et === "dry-van") return "dryvan";
  if (et === "step-deck") return "flatbed";
  if (et === "refrigerated") return "reefer";

  // 2. Cargo type fallback
  if (ct === "petroleum" || ct === "liquid" || ct === "oil") return "liquid";
  if (ct === "gas" || ct === "lpg" || ct === "lng") return "gas";
  if (ct === "chemicals") return "liquid";
  if (ct === "refrigerated" || ct === "frozen") return "reefer";
  if (ct === "oversized") return "flatbed";
  if (ct === "grain" || ct === "cement" || ct === "sand") return "hopper";

  // 3. Hazmat class → proper trailer animation
  const inferred = inferTrailerFromHazmat(hazmatClass);
  if (inferred === "liquid_tank") return "liquid";
  if (inferred === "gas_tank") return "gas";
  if (inferred === "chemical_tank") return "liquid";
  if (inferred === "cryogenic") return "cryogenic";
  if (inferred === "dry_van") return "dryvan";
  if (inferred === "flatbed") return "flatbed";
  if (inferred === "reefer") return "reefer";

  // 4. Generic hazmat (cargoType is "hazmat" but no specific class)
  if (ct === "hazmat") return "hazmat";

  return "dryvan";
}

// ═══════════════════════════════════════════════════════════════
// HAZMAT DETECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Returns true if a load qualifies as hazardous.
 */
export function isHazmatLoad(load: {
  cargoType?: string | null;
  hazmatClass?: string | null;
  unNumber?: string | null;
}): boolean {
  if (load.hazmatClass || load.unNumber) return true;
  const ct = (load.cargoType || "").toLowerCase();
  return ["hazmat", "chemicals", "petroleum", "gas"].includes(ct);
}
