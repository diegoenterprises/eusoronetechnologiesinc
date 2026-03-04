/**
 * CARGO CALCULATIONS — Shared weight/quantity logic for all trailer & product types
 *
 * Single source of truth for:
 *   - Product density (lbs/gal) for liquid weight auto-calc
 *   - Dry bulk density (lbs/cu ft) for hopper/pneumatic weight auto-calc
 *   - Bushel weights per grain type (USDA standard)
 *   - Livestock weights per animal type
 *   - Generic unit weight factors (pallets, cases, etc.)
 *   - Per-trailer max capacity per unit type
 *   - Unified weight calculator used by all load creation flows
 *
 * Sources: NIST, DOT hazmat tables, USDA, industry standards
 */

// ═══════════════════════════════════════════════════════════════
// PRODUCT DENSITY — lbs per gallon for liquid trailers
// ═══════════════════════════════════════════════════════════════
export const PRODUCT_DENSITY: Record<string, { lbsPerGal: number; label: string }> = {
  // Petroleum
  "gasoline": { lbsPerGal: 6.1, label: "Gasoline" },
  "diesel": { lbsPerGal: 7.1, label: "Diesel #2" },
  "diesel fuel": { lbsPerGal: 7.1, label: "Diesel #2" },
  "crude oil": { lbsPerGal: 7.2, label: "Crude Oil" },
  "jet fuel": { lbsPerGal: 6.7, label: "Jet-A" },
  "kerosene": { lbsPerGal: 6.7, label: "Kerosene" },
  "heating oil": { lbsPerGal: 7.1, label: "Heating Oil" },
  "fuel oil": { lbsPerGal: 7.9, label: "Fuel Oil #6" },
  "ethanol": { lbsPerGal: 6.6, label: "Ethanol" },
  "biodiesel": { lbsPerGal: 7.3, label: "Biodiesel B100" },
  "asphalt": { lbsPerGal: 8.6, label: "Liquid Asphalt" },
  "naphtha": { lbsPerGal: 5.8, label: "Naphtha" },
  "toluene": { lbsPerGal: 7.2, label: "Toluene" },
  "xylene": { lbsPerGal: 7.2, label: "Xylene" },
  "benzene": { lbsPerGal: 7.3, label: "Benzene" },
  "methanol": { lbsPerGal: 6.6, label: "Methanol" },
  "styrene": { lbsPerGal: 7.6, label: "Styrene" },
  "acetaldehyde": { lbsPerGal: 6.5, label: "Acetaldehyde" },
  // Chemicals
  "sulfuric acid": { lbsPerGal: 15.3, label: "Sulfuric Acid" },
  "hydrochloric acid": { lbsPerGal: 9.9, label: "Hydrochloric Acid" },
  "phosphoric acid": { lbsPerGal: 14.1, label: "Phosphoric Acid" },
  "nitric acid": { lbsPerGal: 12.6, label: "Nitric Acid" },
  "acetic acid": { lbsPerGal: 8.8, label: "Acetic Acid" },
  "sodium hydroxide": { lbsPerGal: 13.4, label: "Caustic Soda 50%" },
  "caustic soda": { lbsPerGal: 13.4, label: "Caustic Soda 50%" },
  "ammonia": { lbsPerGal: 5.15, label: "Anhydrous Ammonia" },
  "chlorine": { lbsPerGal: 12.1, label: "Liquid Chlorine" },
  "hydrogen peroxide": { lbsPerGal: 11.2, label: "H2O2 50%" },
  "acetone": { lbsPerGal: 6.6, label: "Acetone" },
  "isopropanol": { lbsPerGal: 6.5, label: "Isopropyl Alcohol" },
  "isopropyl alcohol": { lbsPerGal: 6.5, label: "Isopropyl Alcohol" },
  "formaldehyde": { lbsPerGal: 9.3, label: "Formaldehyde 37%" },
  "sodium hypochlorite": { lbsPerGal: 10.0, label: "Bleach (12.5%)" },
  "ferric chloride": { lbsPerGal: 12.4, label: "Ferric Chloride" },
  "calcium chloride": { lbsPerGal: 10.8, label: "Calcium Chloride (Liquid)" },
  "propylene glycol": { lbsPerGal: 8.6, label: "Propylene Glycol" },
  "ethylene glycol": { lbsPerGal: 9.3, label: "Ethylene Glycol" },
  // Gases (liquid form / cryogenic)
  "propane": { lbsPerGal: 4.2, label: "Propane (LPG)" },
  "butane": { lbsPerGal: 4.9, label: "Butane" },
  "lng": { lbsPerGal: 3.5, label: "LNG" },
  "natural gas": { lbsPerGal: 3.5, label: "LNG" },
  "liquid nitrogen": { lbsPerGal: 6.7, label: "Liquid Nitrogen" },
  "nitrogen": { lbsPerGal: 6.7, label: "Liquid Nitrogen" },
  "liquid oxygen": { lbsPerGal: 9.5, label: "Liquid Oxygen" },
  "oxygen": { lbsPerGal: 9.5, label: "Liquid Oxygen" },
  "liquid hydrogen": { lbsPerGal: 0.6, label: "Liquid Hydrogen" },
  "hydrogen": { lbsPerGal: 0.6, label: "Liquid Hydrogen" },
  "liquid co2": { lbsPerGal: 8.5, label: "Liquid CO2" },
  "carbon dioxide": { lbsPerGal: 8.5, label: "Liquid CO2" },
  "liquid argon": { lbsPerGal: 11.6, label: "Liquid Argon" },
  "argon": { lbsPerGal: 11.6, label: "Liquid Argon" },
  "liquid helium": { lbsPerGal: 1.04, label: "Liquid Helium" },
  "helium": { lbsPerGal: 1.04, label: "Liquid Helium" },
  "liquid neon": { lbsPerGal: 10.1, label: "Liquid Neon" },
  "nitrous oxide": { lbsPerGal: 10.1, label: "Nitrous Oxide" },
  // Food-grade liquids
  "water": { lbsPerGal: 8.34, label: "Water" },
  "potable water": { lbsPerGal: 8.34, label: "Potable Water" },
  "milk": { lbsPerGal: 8.6, label: "Whole Milk" },
  "whole milk": { lbsPerGal: 8.6, label: "Whole Milk" },
  "skim milk": { lbsPerGal: 8.6, label: "Skim Milk" },
  "condensed milk": { lbsPerGal: 10.7, label: "Condensed Milk" },
  "cream": { lbsPerGal: 8.4, label: "Heavy Cream" },
  "whey": { lbsPerGal: 8.5, label: "Liquid Whey" },
  "liquid eggs": { lbsPerGal: 8.5, label: "Liquid Eggs" },
  "juice": { lbsPerGal: 8.8, label: "Fruit Juice" },
  "orange juice": { lbsPerGal: 8.8, label: "Orange Juice" },
  "apple juice": { lbsPerGal: 8.8, label: "Apple Juice" },
  "grape juice": { lbsPerGal: 9.2, label: "Grape Juice Concentrate" },
  "tomato paste": { lbsPerGal: 9.5, label: "Tomato Paste" },
  "wine": { lbsPerGal: 8.4, label: "Wine" },
  "beer": { lbsPerGal: 8.5, label: "Beer" },
  "vinegar": { lbsPerGal: 8.4, label: "Vinegar" },
  "soy sauce": { lbsPerGal: 9.0, label: "Soy Sauce" },
  "chocolate": { lbsPerGal: 10.5, label: "Liquid Chocolate" },
  // Edible oils
  "cooking oil": { lbsPerGal: 7.7, label: "Cooking Oil" },
  "vegetable oil": { lbsPerGal: 7.7, label: "Vegetable Oil" },
  "soybean oil": { lbsPerGal: 7.7, label: "Soybean Oil" },
  "canola oil": { lbsPerGal: 7.7, label: "Canola Oil" },
  "palm oil": { lbsPerGal: 7.6, label: "Palm Oil" },
  "coconut oil": { lbsPerGal: 7.6, label: "Coconut Oil" },
  "corn oil": { lbsPerGal: 7.7, label: "Corn Oil" },
  "olive oil": { lbsPerGal: 7.6, label: "Olive Oil" },
  "sunflower oil": { lbsPerGal: 7.7, label: "Sunflower Oil" },
  "peanut oil": { lbsPerGal: 7.7, label: "Peanut Oil" },
  "fish oil": { lbsPerGal: 7.7, label: "Fish Oil" },
  "mct oil": { lbsPerGal: 7.3, label: "MCT Oil" },
  "tallow": { lbsPerGal: 7.5, label: "Tallow" },
  "lard": { lbsPerGal: 7.6, label: "Lard" },
  "shortening": { lbsPerGal: 7.6, label: "Vegetable Shortening" },
  // Sweeteners / syrups
  "corn syrup": { lbsPerGal: 11.7, label: "Corn Syrup" },
  "hfcs": { lbsPerGal: 11.5, label: "HFCS" },
  "liquid sugar": { lbsPerGal: 11.1, label: "Liquid Sugar" },
  "molasses": { lbsPerGal: 11.7, label: "Molasses" },
  "honey": { lbsPerGal: 11.9, label: "Honey" },
  "maple syrup": { lbsPerGal: 11.1, label: "Maple Syrup" },
  "agave nectar": { lbsPerGal: 11.2, label: "Agave Nectar" },
  "sorbitol": { lbsPerGal: 10.8, label: "Sorbitol Solution" },
  "glycerin": { lbsPerGal: 10.5, label: "Glycerin" },
  // Dairy alternatives
  "coconut milk": { lbsPerGal: 8.4, label: "Coconut Milk" },
  "coconut cream": { lbsPerGal: 8.5, label: "Coconut Cream" },
  "almond milk": { lbsPerGal: 8.5, label: "Almond Milk" },
  "oat milk": { lbsPerGal: 8.6, label: "Oat Milk" },
};

// ═══════════════════════════════════════════════════════════════
// DRY BULK DENSITY — lbs per cubic foot (hopper/pneumatic)
// ═══════════════════════════════════════════════════════════════
export const DRY_BULK_DENSITY: Record<string, { lbsPerCuFt: number; label: string }> = {
  "portland cement": { lbsPerCuFt: 94, label: "Portland Cement" },
  "cement": { lbsPerCuFt: 94, label: "Portland Cement" },
  "fly ash": { lbsPerCuFt: 70, label: "Fly Ash" },
  "calcium carbonate": { lbsPerCuFt: 88, label: "Calcium Carbonate" },
  "limestone": { lbsPerCuFt: 88, label: "Limestone" },
  "sand": { lbsPerCuFt: 100, label: "Sand" },
  "frac sand": { lbsPerCuFt: 100, label: "Frac Sand" },
  "silica": { lbsPerCuFt: 95, label: "Silica Sand" },
  "flour": { lbsPerCuFt: 37, label: "Wheat Flour" },
  "sugar": { lbsPerCuFt: 55, label: "Granulated Sugar" },
  "powdered sugar": { lbsPerCuFt: 40, label: "Powdered Sugar" },
  "salt": { lbsPerCuFt: 75, label: "Salt" },
  "plastic pellets": { lbsPerCuFt: 35, label: "Plastic Pellets" },
  "polyethylene": { lbsPerCuFt: 35, label: "PE Pellets" },
  "polypropylene": { lbsPerCuFt: 33, label: "PP Pellets" },
  "pvc": { lbsPerCuFt: 45, label: "PVC Compound" },
  "nylon": { lbsPerCuFt: 42, label: "Nylon Pellets" },
  "soda ash": { lbsPerCuFt: 55, label: "Soda Ash" },
  "potash": { lbsPerCuFt: 70, label: "Potash" },
  "urea": { lbsPerCuFt: 46, label: "Urea" },
  "ammonium sulfate": { lbsPerCuFt: 60, label: "Ammonium Sulfate" },
  "corn": { lbsPerCuFt: 45, label: "Corn" },
  "soybeans": { lbsPerCuFt: 47, label: "Soybeans" },
  "wheat": { lbsPerCuFt: 48, label: "Wheat" },
  "rice": { lbsPerCuFt: 47, label: "Rice" },
  "barley": { lbsPerCuFt: 39, label: "Barley" },
  "oats": { lbsPerCuFt: 26, label: "Oats" },
  "animal feed": { lbsPerCuFt: 40, label: "Animal Feed" },
  "soybean meal": { lbsPerCuFt: 40, label: "Soybean Meal" },
  "bentonite": { lbsPerCuFt: 60, label: "Bentonite Clay" },
  "kaolin": { lbsPerCuFt: 38, label: "Kaolin Clay" },
  "barite": { lbsPerCuFt: 135, label: "Barite" },
  "sodium bicarbonate": { lbsPerCuFt: 54, label: "Sodium Bicarbonate" },
  "titanium dioxide": { lbsPerCuFt: 55, label: "Titanium Dioxide" },
  "carbon black": { lbsPerCuFt: 25, label: "Carbon Black" },
  "alumina": { lbsPerCuFt: 60, label: "Alumina" },
  "lime": { lbsPerCuFt: 56, label: "Lime" },
  "hydrated lime": { lbsPerCuFt: 40, label: "Hydrated Lime" },
  "gypsum": { lbsPerCuFt: 70, label: "Gypsum" },
  "diatomaceous earth": { lbsPerCuFt: 14, label: "Diatomaceous Earth" },
  "wood pellets": { lbsPerCuFt: 42, label: "Wood Pellets" },
  "wood chips": { lbsPerCuFt: 20, label: "Wood Chips" },
  "sawdust": { lbsPerCuFt: 15, label: "Sawdust" },
  "perlite": { lbsPerCuFt: 8, label: "Perlite" },
  "vermiculite": { lbsPerCuFt: 10, label: "Vermiculite" },
  "glass cullet": { lbsPerCuFt: 90, label: "Glass Cullet" },
  "starch": { lbsPerCuFt: 42, label: "Starch" },
  "maltodextrin": { lbsPerCuFt: 35, label: "Maltodextrin" },
  "protein powder": { lbsPerCuFt: 30, label: "Protein Powder" },
  // Aggregates (end dump, hopper)
  "gravel": { lbsPerCuFt: 110, label: "Gravel" },
  "crushed stone": { lbsPerCuFt: 100, label: "Crushed Stone" },
  "topsoil": { lbsPerCuFt: 75, label: "Topsoil" },
  "dirt": { lbsPerCuFt: 80, label: "Dirt" },
  "clay": { lbsPerCuFt: 80, label: "Clay" },
  "asphalt millings": { lbsPerCuFt: 100, label: "Asphalt Millings" },
  "concrete": { lbsPerCuFt: 150, label: "Concrete" },
  "demolition debris": { lbsPerCuFt: 65, label: "Demolition Debris" },
};

// ═══════════════════════════════════════════════════════════════
// BUSHEL WEIGHTS — USDA standard test weights per crop (lbs/bushel)
// ═══════════════════════════════════════════════════════════════
export const BUSHEL_WEIGHTS: Record<string, { lbsPerBushel: number; label: string }> = {
  "corn": { lbsPerBushel: 56, label: "Corn" },
  "shelled corn": { lbsPerBushel: 56, label: "Shelled Corn" },
  "ear corn": { lbsPerBushel: 70, label: "Ear Corn" },
  "soybeans": { lbsPerBushel: 60, label: "Soybeans" },
  "wheat": { lbsPerBushel: 60, label: "Wheat" },
  "hard red wheat": { lbsPerBushel: 60, label: "Hard Red Wheat" },
  "soft wheat": { lbsPerBushel: 60, label: "Soft Wheat" },
  "durum wheat": { lbsPerBushel: 60, label: "Durum Wheat" },
  "oats": { lbsPerBushel: 32, label: "Oats" },
  "barley": { lbsPerBushel: 48, label: "Barley" },
  "rye": { lbsPerBushel: 56, label: "Rye" },
  "grain sorghum": { lbsPerBushel: 56, label: "Grain Sorghum (Milo)" },
  "milo": { lbsPerBushel: 56, label: "Milo" },
  "sorghum": { lbsPerBushel: 56, label: "Sorghum" },
  "rice": { lbsPerBushel: 45, label: "Rough Rice" },
  "rough rice": { lbsPerBushel: 45, label: "Rough Rice" },
  "milled rice": { lbsPerBushel: 58, label: "Milled Rice" },
  "sunflower seeds": { lbsPerBushel: 24, label: "Sunflower Seeds" },
  "sunflower": { lbsPerBushel: 24, label: "Sunflower Seeds" },
  "flaxseed": { lbsPerBushel: 56, label: "Flaxseed" },
  "canola": { lbsPerBushel: 50, label: "Canola" },
  "rapeseed": { lbsPerBushel: 50, label: "Rapeseed" },
  "buckwheat": { lbsPerBushel: 48, label: "Buckwheat" },
  "millet": { lbsPerBushel: 50, label: "Millet" },
  "popcorn": { lbsPerBushel: 56, label: "Popcorn" },
  "peas": { lbsPerBushel: 60, label: "Field Peas" },
  "lentils": { lbsPerBushel: 60, label: "Lentils" },
  "dry beans": { lbsPerBushel: 60, label: "Dry Beans" },
  "cottonseed": { lbsPerBushel: 32, label: "Cottonseed" },
};

// ═══════════════════════════════════════════════════════════════
// LIVESTOCK WEIGHTS — average lbs per head by animal type
// ═══════════════════════════════════════════════════════════════
export const LIVESTOCK_WEIGHTS: Record<string, { lbsPerHead: number; label: string }> = {
  "cattle": { lbsPerHead: 1200, label: "Cattle (Finished)" },
  "beef cattle": { lbsPerHead: 1200, label: "Beef Cattle" },
  "dairy cattle": { lbsPerHead: 1400, label: "Dairy Cattle" },
  "feeder cattle": { lbsPerHead: 750, label: "Feeder Cattle" },
  "calves": { lbsPerHead: 400, label: "Calves" },
  "calf": { lbsPerHead: 400, label: "Calves" },
  "hogs": { lbsPerHead: 270, label: "Market Hogs" },
  "pigs": { lbsPerHead: 270, label: "Market Hogs" },
  "swine": { lbsPerHead: 270, label: "Swine" },
  "feeder pigs": { lbsPerHead: 50, label: "Feeder Pigs" },
  "sheep": { lbsPerHead: 150, label: "Sheep" },
  "lambs": { lbsPerHead: 120, label: "Market Lambs" },
  "goats": { lbsPerHead: 100, label: "Goats" },
  "horses": { lbsPerHead: 1100, label: "Horses" },
  "donkeys": { lbsPerHead: 500, label: "Donkeys" },
  "bison": { lbsPerHead: 1800, label: "Bison" },
  "llamas": { lbsPerHead: 350, label: "Llamas" },
  "alpacas": { lbsPerHead: 175, label: "Alpacas" },
  "poultry": { lbsPerHead: 7, label: "Poultry (Broiler)" },
  "chickens": { lbsPerHead: 7, label: "Chickens" },
  "turkeys": { lbsPerHead: 30, label: "Turkeys" },
};

// ═══════════════════════════════════════════════════════════════
// GENERIC UNIT WEIGHT FACTORS — fallback when no product match
// ═══════════════════════════════════════════════════════════════
export const UNIT_WEIGHT_FACTORS: Record<string, number> = {
  "Pallets": 1500,
  "Units": 50,
  "Cases": 30,
  "Boxes": 25,
  "Pieces": 2000,
  "Bundles": 3000,
  "Linear Feet": 300,
  "Tons": 2000,
  "Drums": 600,
  "Cubic Yards": 2700,
  "Cubic Feet": 80,
  "Cubic Meters": 2800,
  "Barrels": 300,
  "PSI Units": 0,
  "Vehicles": 3800,
  "Head": 1200,
  "Cords": 5000,
  "MBF": 6000,
  "Bushels": 56,
  "Containers": 44000,
  "TEU": 44000,
};

// ═══════════════════════════════════════════════════════════════
// PER-TRAILER MAX CAPACITY — max quantity per truck by unit type
// ═══════════════════════════════════════════════════════════════
export const UNIT_MAX_CAPACITY: Record<string, number> = {
  "Gallons": 9500,
  "Barrels": 210,
  "Liters": 36000,
  "Pallets": 24,
  "Units": 100,
  "Cases": 500,
  "Boxes": 1000,
  "Pieces": 20,
  "Bundles": 12,
  "Linear Feet": 53,
  "Tons": 25,
  "Cubic Yards": 35,
  "Cubic Feet": 1700,
  "Drums": 80,
  "PSI Units": 300,
  "Cubic Meters": 40,
  "Vehicles": 10,
  "Head": 50,
  "Cords": 10,
  "MBF": 8,
  "Bushels": 1000,
  "Containers": 2,
  "TEU": 2,
};

// ═══════════════════════════════════════════════════════════════
// FUZZY MATCH — case-insensitive product name lookup
// ═══════════════════════════════════════════════════════════════
export function fuzzyMatch<T extends { label: string }>(table: Record<string, T>, productName: string): T | null {
  if (!productName) return null;
  const key = productName.toLowerCase().trim();
  if (table[key]) return table[key];
  for (const [k, v] of Object.entries(table)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  for (const [k, v] of Object.entries(table)) {
    const keyWords = k.split(/\s+/);
    if (keyWords.length >= 1 && keyWords.every(w => key.includes(w))) return v;
  }
  for (const [k, v] of Object.entries(table)) {
    if (k.length >= 3 && key.split(/[\s,()]+/).some(w => w === k)) return v;
  }
  return null;
}

export function lookupDensity(productName: string): { lbsPerGal: number; label: string } | null {
  return fuzzyMatch(PRODUCT_DENSITY, productName);
}

export function lookupBulkDensity(productName: string): { lbsPerCuFt: number; label: string } | null {
  return fuzzyMatch(DRY_BULK_DENSITY, productName);
}

export function lookupBushelWeight(productName: string): { lbsPerBushel: number; label: string } | null {
  return fuzzyMatch(BUSHEL_WEIGHTS, productName);
}

export function lookupLivestockWeight(productName: string): { lbsPerHead: number; label: string } | null {
  return fuzzyMatch(LIVESTOCK_WEIGHTS, productName);
}

// ═══════════════════════════════════════════════════════════════
// UNIFIED WEIGHT CALCULATOR — handles ALL trailer/product/unit combos
// Returns { weight (lbs), source (human-readable explanation) } or null
// ═══════════════════════════════════════════════════════════════
export function calcWeight(qty: number, unit: string, productName: string): { weight: number; source: string } | null {
  if (qty <= 0) return null;

  // 1. Liquid volume units -> use PRODUCT_DENSITY (lbs/gal)
  if (unit === "Gallons" || unit === "Barrels" || unit === "Liters") {
    const density = lookupDensity(productName);
    if (density) {
      let gallons = qty;
      if (unit === "Barrels") gallons = qty * 42;
      if (unit === "Liters") gallons = qty * 0.2642;
      return { weight: Math.round(gallons * density.lbsPerGal), source: `${density.label} @ ${density.lbsPerGal} lbs/gal` };
    }
    // Fallback: generic 7 lbs/gal for unknown liquids (close to petroleum/water avg)
    let gallons = qty;
    if (unit === "Barrels") gallons = qty * 42;
    if (unit === "Liters") gallons = qty * 0.2642;
    return { weight: Math.round(gallons * 7), source: "Est. 7 lbs/gal (generic liquid)" };
  }

  // 2. Bushels -> use product-specific USDA bushel weights
  if (unit === "Bushels") {
    const bushelW = lookupBushelWeight(productName);
    if (bushelW) {
      return { weight: Math.round(qty * bushelW.lbsPerBushel), source: `${bushelW.label} @ ${bushelW.lbsPerBushel} lbs/bu (USDA)` };
    }
    return { weight: Math.round(qty * 56), source: "Est. 56 lbs/bu (corn/sorghum standard)" };
  }

  // 3. Head (livestock) -> use product-specific animal weights
  if (unit === "Head") {
    const animalW = lookupLivestockWeight(productName);
    if (animalW) {
      return { weight: Math.round(qty * animalW.lbsPerHead), source: `${animalW.label} @ ${animalW.lbsPerHead} lbs/head` };
    }
    return { weight: Math.round(qty * 1200), source: "Est. 1,200 lbs/head (cattle avg)" };
  }

  // 4. Cubic volume units -> use DRY_BULK_DENSITY if product matches, else generic
  if (unit === "Cubic Yards" || unit === "Cubic Feet" || unit === "Cubic Meters") {
    const bulk = lookupBulkDensity(productName);
    if (bulk) {
      let cuFt = qty;
      if (unit === "Cubic Yards") cuFt = qty * 27;
      if (unit === "Cubic Meters") cuFt = qty * 35.315;
      return { weight: Math.round(cuFt * bulk.lbsPerCuFt), source: `${bulk.label} @ ${bulk.lbsPerCuFt} lbs/cu ft` };
    }
    // Generic fallback per unit
    const factor = UNIT_WEIGHT_FACTORS[unit];
    if (factor && factor > 0) {
      return { weight: Math.round(qty * factor), source: `Est. ${factor.toLocaleString()} lbs/${unit.toLowerCase().replace(/s$/, "")}` };
    }
  }

  // 5. Tons -> exact conversion
  if (unit === "Tons") return { weight: qty * 2000, source: "1 ton = 2,000 lbs" };

  // 6. Drums -> 55-gal drum, use product density if available
  if (unit === "Drums") {
    const density = lookupDensity(productName);
    if (density) {
      return { weight: Math.round(qty * 55 * density.lbsPerGal), source: `${density.label} @ ${density.lbsPerGal} lbs/gal x 55 gal/drum` };
    }
    return { weight: Math.round(qty * 600), source: "Est. 600 lbs/drum (55 gal avg)" };
  }

  // 7. Vehicles -> use generic 3,800 lbs (typical car; heavy equipment is weighed individually)
  if (unit === "Vehicles") {
    return { weight: Math.round(qty * 3800), source: "Est. 3,800 lbs/vehicle (passenger car avg)" };
  }

  // 8. Cords/MBF (timber)
  if (unit === "Cords") return { weight: Math.round(qty * 5000), source: "Est. 5,000 lbs/cord (green hardwood)" };
  if (unit === "MBF") return { weight: Math.round(qty * 6000), source: "Est. 6,000 lbs/MBF (thousand board feet)" };

  // 9. Containers / TEU
  if (unit === "Containers" || unit === "TEU") {
    return { weight: Math.round(qty * 44000), source: "Est. 44,000 lbs/container (loaded avg)" };
  }

  // 10. Generic unit factors (Pallets, Cases, Boxes, Pieces, Bundles, Linear Feet, etc.)
  const factor = UNIT_WEIGHT_FACTORS[unit];
  if (factor && factor > 0) {
    return { weight: Math.round(qty * factor), source: `Est. ${factor.toLocaleString()} lbs/${unit.toLowerCase().replace(/s$/, "")}` };
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════
// LIQUID WEIGHT FROM GALLONS — used by shipper CreateLoad & terminal flows
// Product-aware: looks up exact density, falls back to 7 lbs/gal
// ═══════════════════════════════════════════════════════════════
export function calcLiquidWeightLbs(gallons: number, productName: string): { weightLbs: number; lbsPerGal: number; source: string } {
  const density = lookupDensity(productName);
  const lbsPerGal = density ? density.lbsPerGal : 7;
  const source = density ? `${density.label} @ ${density.lbsPerGal} lbs/gal` : "Est. 7 lbs/gal (generic liquid)";
  return { weightLbs: Math.round(gallons * lbsPerGal), lbsPerGal, source };
}

// ═══════════════════════════════════════════════════════════════
// GALLONS FROM QUANTITY — convert any liquid unit to gallons
// ═══════════════════════════════════════════════════════════════
export function toGallons(qty: number, unit: string): number {
  if (unit === "Gallons" || unit === "gal") return qty;
  if (unit === "Barrels" || unit === "bbl" || unit === "barrels") return qty * 42;
  if (unit === "Liters") return qty * 0.2642;
  return qty; // fallback: treat as gallons
}

export function toBarrels(qty: number, unit: string): number {
  if (unit === "Barrels" || unit === "bbl" || unit === "barrels") return qty;
  if (unit === "Gallons" || unit === "gal") return qty / 42;
  if (unit === "Liters") return (qty * 0.2642) / 42;
  return qty / 42;
}
