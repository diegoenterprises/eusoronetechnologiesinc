/**
 * SHARED LOAD CONSTANTS
 * Extracted from LoadCreationWizard.tsx for reuse across:
 * - LoadCreationWizard.tsx (Step 0 My Products, trailer selection, etc.)
 * - MyProductsTab.tsx (Settings product management)
 * - Any future load-related components
 */

export const TRAILER_TYPES = [
  // ── Tanker / Liquid / Gas (Hazmat) ──
  { id: "liquid_tank", name: "Liquid Tank Trailer", desc: "MC-306/DOT-406 for petroleum, chemicals, liquid bulk", icon: "droplets", animType: "liquid" as const, hazmat: true, equipment: "tank", maxGal: 9500 },
  { id: "gas_tank", name: "Pressurized Gas Tank", desc: "MC-331 for LPG, ammonia, compressed gases", icon: "wind", animType: "gas" as const, hazmat: true, equipment: "tanker", maxGal: 11600 },
  { id: "cryogenic", name: "Cryogenic Tank", desc: "LNG, liquid nitrogen, liquid oxygen, liquid hydrogen", icon: "snowflake", animType: "gas" as const, hazmat: true, equipment: "tanker", maxGal: 10000 },
  { id: "hazmat_van", name: "Hazmat Box / Van", desc: "Packaged hazmat: batteries, chemicals, oxidizers", icon: "alert", animType: "hazmat" as const, hazmat: true, equipment: "hazmat-van", maxGal: 0 },
  // ── Enclosed ──
  { id: "dry_van", name: "Dry Van", desc: "Enclosed trailer for palletized, packaged, and high-value specialty cargo", icon: "box", animType: "solid" as const, hazmat: false, equipment: "dry-van", maxGal: 0 },
  // ── Refrigerated ──
  { id: "reefer", name: "Refrigerated (Reefer)", desc: "Temperature-controlled: food, pharma, chemicals", icon: "thermometer", animType: "refrigerated" as const, hazmat: false, equipment: "reefer", maxGal: 0 },
  // ── Flatbed Family ──
  { id: "flatbed", name: "Standard Flatbed", desc: "Steel, lumber, equipment, oversized loads", icon: "truck", animType: "solid" as const, hazmat: false, equipment: "flatbed", maxGal: 0 },
  { id: "step_deck", name: "Step Deck / Drop Deck", desc: "Tall machinery, equipment — lower deck for extra height clearance", icon: "truck", animType: "solid" as const, hazmat: false, equipment: "step_deck", maxGal: 0 },
  { id: "lowboy", name: "Lowboy / RGN", desc: "Heavy equipment: excavators, dozers, cranes — detachable gooseneck", icon: "truck", animType: "solid" as const, hazmat: false, equipment: "lowboy", maxGal: 0 },
  { id: "double_drop", name: "Double Drop / Stretch", desc: "Extra-tall cargo: transformers, generators, industrial vessels", icon: "truck", animType: "solid" as const, hazmat: false, equipment: "double_drop", maxGal: 0 },
  { id: "conestoga", name: "Conestoga (Rolling-Tarp)", desc: "Weather-protected flatbed: coils, machinery, weather-sensitive steel", icon: "blinds", animType: "solid" as const, hazmat: false, equipment: "conestoga", maxGal: 0 },
  // ── Specialty Haulers ──
  { id: "auto_carrier", name: "Auto Carrier / Car Hauler", desc: "Vehicle transport: 7-10 cars, dealer-to-dealer, auction, OEM delivery", icon: "car_icon", animType: "vehicles" as const, hazmat: false, equipment: "auto_carrier", maxGal: 0 },
  { id: "livestock", name: "Livestock / Cattle Pot", desc: "Live animal transport: cattle, hogs, poultry — USDA/FMCSA regulated", icon: "livestock_icon", animType: "livestock" as const, hazmat: false, equipment: "livestock", maxGal: 0 },
  { id: "log_trailer", name: "Log Trailer", desc: "Timber hauling: sawlogs, pulpwood, tree-length — 49 CFR 393.116", icon: "tree_icon", animType: "solid" as const, hazmat: false, equipment: "log_trailer", maxGal: 0 },
  // ── Bulk & Hopper ──
  { id: "bulk_hopper", name: "Dry Bulk / Hopper", desc: "Pneumatic: cement, lime, flour, plastic pellets", icon: "package", animType: "bulk" as const, hazmat: false, equipment: "hopper", maxGal: 0 },
  { id: "hopper", name: "Gravity Hopper", desc: "Gravity-discharge hopper for grain, sand, aggregate", icon: "hopper_icon", animType: "bulk" as const, hazmat: false, equipment: "hopper", maxGal: 0 },
  { id: "grain_hopper", name: "Grain Hopper", desc: "USDA-grade grain transport: corn, wheat, soybeans, rice, barley", icon: "hopper_icon", animType: "grain" as const, hazmat: false, equipment: "grain_trailer", maxGal: 0 },
  { id: "pneumatic", name: "Pneumatic Tank", desc: "Pressure-unload for cement, flour, powder, pellets", icon: "wind", animType: "bulk" as const, hazmat: false, equipment: "hopper", maxGal: 0 },
  { id: "end_dump", name: "End Dump Trailer", desc: "Hydraulic end-dump for aggregate, sand, demolition debris", icon: "arrowdown", animType: "bulk" as const, hazmat: false, equipment: "dump_trailer", maxGal: 0 },
  // ── Food & Water ──
  { id: "food_grade_tank", name: "Food-Grade Liquid Tank", desc: "Milk, juice, cooking oil, wine, liquid sugar, edible oils", icon: "milkoff", animType: "liquid" as const, hazmat: false, equipment: "tank", maxGal: 6500 },
  { id: "water_tank", name: "Water Tank", desc: "Potable water, non-potable water, industrial water", icon: "glasswater", animType: "liquid" as const, hazmat: false, equipment: "tank", maxGal: 5500 },
  // ── Intermodal & Curtain Side ──
  { id: "intermodal_chassis", name: "Intermodal Chassis", desc: "ISO container chassis for port drayage and intermodal", icon: "container", animType: "solid" as const, hazmat: false, equipment: "intermodal", maxGal: 0 },
  { id: "curtain_side", name: "Curtain Side / Tautliner", desc: "Side-access loading for building materials, machinery", icon: "blinds", animType: "solid" as const, hazmat: false, equipment: "curtain_side", maxGal: 0 },
];

export const HAZMAT_CLASSES = [
  { id: "1", name: "Class 1 - Explosives" },
  { id: "2.1", name: "Class 2.1 - Flammable Gas" },
  { id: "2.2", name: "Class 2.2 - Non-Flammable Gas" },
  { id: "2.3", name: "Class 2.3 - Poison Gas" },
  { id: "3", name: "Class 3 - Flammable Liquid" },
  { id: "4.1", name: "Class 4.1 - Flammable Solid" },
  { id: "4.2", name: "Class 4.2 - Spontaneously Combustible" },
  { id: "4.3", name: "Class 4.3 - Dangerous When Wet" },
  { id: "5.1", name: "Class 5.1 - Oxidizer" },
  { id: "5.2", name: "Class 5.2 - Organic Peroxide" },
  { id: "6.1", name: "Class 6.1 - Poison" },
  { id: "6.2", name: "Class 6.2 - Infectious Substance" },
  { id: "7", name: "Class 7 - Radioactive" },
  { id: "8", name: "Class 8 - Corrosive" },
  { id: "9", name: "Class 9 - Miscellaneous" },
];

export function getClassesForTrailer(id: string) {
  if (id === "liquid_tank") return HAZMAT_CLASSES.filter(c => ["3", "5.1", "5.2", "6.1", "8"].includes(c.id));
  if (id === "gas_tank" || id === "cryogenic") return HAZMAT_CLASSES.filter(c => c.id.startsWith("2"));
  return HAZMAT_CLASSES;
}

export const COMMODITY_UNITS: Record<string, { volumeUnit: string; weightUnit: string; displayVolume: string; displayWeight: string }> = {
  petroleum: { volumeUnit: "bbl", weightUnit: "tons", displayVolume: "Barrels", displayWeight: "Tons" },
  chemicals: { volumeUnit: "gal", weightUnit: "lbs", displayVolume: "Gallons", displayWeight: "Lbs" },
  gas: { volumeUnit: "gal", weightUnit: "lbs", displayVolume: "Gallons", displayWeight: "Lbs" },
  liquid: { volumeUnit: "gal", weightUnit: "lbs", displayVolume: "Gallons", displayWeight: "Lbs" },
  refrigerated: { volumeUnit: "pallets", weightUnit: "lbs", displayVolume: "Pallets", displayWeight: "Lbs" },
  dry_bulk: { volumeUnit: "cu_ft", weightUnit: "tons", displayVolume: "Cubic Feet", displayWeight: "Tons" },
  grain: { volumeUnit: "bu", weightUnit: "tons", displayVolume: "Bushels", displayWeight: "Tons" },
  livestock: { volumeUnit: "head", weightUnit: "lbs", displayVolume: "Head", displayWeight: "Lbs" },
  vehicles: { volumeUnit: "units", weightUnit: "lbs", displayVolume: "Units", displayWeight: "Lbs" },
  water: { volumeUnit: "gal", weightUnit: "lbs", displayVolume: "Gallons", displayWeight: "Lbs" },
  cryogenic: { volumeUnit: "liters", weightUnit: "kg", displayVolume: "Liters", displayWeight: "Kg" },
  intermodal: { volumeUnit: "TEU", weightUnit: "tons", displayVolume: "TEU", displayWeight: "Tons" },
  food_grade: { volumeUnit: "gal", weightUnit: "lbs", displayVolume: "Gallons", displayWeight: "Lbs" },
  general: { volumeUnit: "pallets", weightUnit: "lbs", displayVolume: "Pallets", displayWeight: "Lbs" },
  oversized: { volumeUnit: "units", weightUnit: "lbs", displayVolume: "Units", displayWeight: "Lbs" },
  hazmat: { volumeUnit: "gal", weightUnit: "lbs", displayVolume: "Gallons", displayWeight: "Lbs" },
  timber: { volumeUnit: "bf", weightUnit: "tons", displayVolume: "Board Feet", displayWeight: "Tons" },
};

export const TRAILER_COMMODITY_MAP: Record<string, string> = {
  liquid_tank: 'petroleum', gas_tank: 'gas', cryogenic: 'cryogenic', hazmat_van: 'hazmat',
  dry_van: 'general', reefer: 'refrigerated', food_grade_tank: 'food_grade', water_tank: 'water',
  flatbed: 'oversized', step_deck: 'oversized', lowboy: 'oversized', double_drop: 'oversized', conestoga: 'general',
  auto_carrier: 'vehicles', livestock: 'livestock', log_trailer: 'timber',
  bulk_hopper: 'dry_bulk', hopper: 'dry_bulk', grain_hopper: 'grain', pneumatic: 'dry_bulk', end_dump: 'dry_bulk',
  intermodal: 'intermodal',
};

export const SEGREGATION_TABLE: Record<string, string[]> = {
  '1.1': ['2.1', '2.3', '3', '4.1', '4.2', '4.3', '5.1', '5.2', '6.1', '7', '8'],
  '2.1': ['1.1', '2.3', '3', '5.1', '5.2', '6.1'],
  '2.3': ['1.1', '2.1', '3', '4.1', '4.2', '4.3', '5.1', '5.2', '6.1', '8'],
  '3': ['1.1', '2.1', '2.3', '4.1', '4.3', '5.1', '5.2', '6.1'],
  '4.1': ['1.1', '2.3', '3', '5.1', '5.2'],
  '4.2': ['1.1', '2.3', '5.1', '5.2', '7', '8'],
  '4.3': ['1.1', '2.3', '3', '5.1', '5.2', '8'],
  '5.1': ['1.1', '2.1', '2.3', '3', '4.1', '4.2', '4.3', '6.1', '7'],
  '5.2': ['1.1', '2.1', '2.3', '3', '4.1', '4.2', '4.3'],
  '6.1': ['1.1', '2.1', '2.3', '3', '5.1'],
  '7': ['1.1', '4.2', '5.1'],
  '8': ['1.1', '2.3', '4.2', '4.3'],
};
