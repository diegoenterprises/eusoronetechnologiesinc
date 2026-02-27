/**
 * COMPLIANCE MATRIX — Smart Document Resolution
 * Maps Trailer Type × Product × State → Required Documents
 *
 * This is the knowledge layer that powers the smart compliance system.
 * Given a carrier's trailer types, products they haul, and operating states,
 * the engine resolves the exact set of compliance documents needed.
 *
 * Three rule dimensions:
 *   1. TRAILER rules  — triggered by equipment type alone
 *   2. PRODUCT rules  — triggered by cargo/product alone
 *   3. COMBO rules    — triggered by specific trailer + product combinations
 *   4. STATE rules    — already handled by stateRequirementsSeed.ts
 */

// ═══════════════════════════════════════════════════════════════
// TRAILER → PRODUCT APPLICABILITY MAP
// Which products are valid for which trailer types?
// Used to dynamically filter the product picker during registration.
// ═══════════════════════════════════════════════════════════════

export interface ProductDefinition {
  id: string;
  label: string;
  category: string;
  hazmatClass?: string;       // UN hazmat class if applicable
  unNumber?: string;          // UN number if applicable
  packingGroup?: string;      // I, II, or III
  requiresHazmat: boolean;
  requiresTanker: boolean;
  requiresTWIC: boolean;
  temperatureControlled: boolean;
  icon: string;               // Lucide icon name
}

export const PRODUCT_CATALOG: ProductDefinition[] = [
  // ─── Petroleum & Chemicals (Liquid Tank / Gas Tank / Cryogenic) ───
  { id: "crude_oil",             label: "Crude Oil",                    category: "Petroleum",    hazmatClass: "3", unNumber: "UN1267", packingGroup: "I",   requiresHazmat: true,  requiresTanker: true,  requiresTWIC: false, temperatureControlled: false, icon: "Droplets" },
  { id: "refined_fuel",          label: "Refined Fuel (Gasoline/Diesel)", category: "Petroleum",  hazmatClass: "3", unNumber: "UN1203", packingGroup: "II",  requiresHazmat: true,  requiresTanker: true,  requiresTWIC: false, temperatureControlled: false, icon: "Fuel" },
  { id: "jet_fuel",              label: "Jet Fuel / Aviation Fuel",     category: "Petroleum",    hazmatClass: "3", unNumber: "UN1863", packingGroup: "III", requiresHazmat: true,  requiresTanker: true,  requiresTWIC: true,  temperatureControlled: false, icon: "Plane" },
  { id: "ethanol",               label: "Ethanol / E85",                category: "Petroleum",    hazmatClass: "3", unNumber: "UN1170", packingGroup: "II",  requiresHazmat: true,  requiresTanker: true,  requiresTWIC: false, temperatureControlled: false, icon: "Leaf" },
  { id: "biodiesel",             label: "Biodiesel / Renewable Diesel", category: "Petroleum",    hazmatClass: "3", unNumber: "UN1993", packingGroup: "III", requiresHazmat: true,  requiresTanker: true,  requiresTWIC: false, temperatureControlled: false, icon: "Leaf" },
  { id: "asphalt",               label: "Asphalt / Bitumen",            category: "Petroleum",    hazmatClass: "3", unNumber: "UN1999", packingGroup: "III", requiresHazmat: true,  requiresTanker: true,  requiresTWIC: false, temperatureControlled: true,  icon: "Construction" },
  { id: "condensate",            label: "Condensate",                   category: "Petroleum",    hazmatClass: "3", unNumber: "UN1268", packingGroup: "I",   requiresHazmat: true,  requiresTanker: true,  requiresTWIC: false, temperatureControlled: false, icon: "Droplets" },
  { id: "produced_water",        label: "Produced Water / Brine",       category: "Petroleum",                                                              requiresHazmat: false, requiresTanker: true,  requiresTWIC: false, temperatureControlled: false, icon: "Waves" },
  { id: "natural_gas_liquids",   label: "Natural Gas Liquids (NGL)",    category: "Petroleum",    hazmatClass: "2", unNumber: "UN1075",                      requiresHazmat: true,  requiresTanker: true,  requiresTWIC: false, temperatureControlled: false, icon: "Flame" },
  { id: "lpg",                   label: "LPG / Propane",                category: "Gas",          hazmatClass: "2.1", unNumber: "UN1075",                    requiresHazmat: true,  requiresTanker: true,  requiresTWIC: false, temperatureControlled: false, icon: "Flame" },
  { id: "ammonia",               label: "Anhydrous Ammonia",            category: "Gas",          hazmatClass: "2.2", unNumber: "UN1005",                    requiresHazmat: true,  requiresTanker: true,  requiresTWIC: false, temperatureControlled: false, icon: "Wind" },
  { id: "chemicals",             label: "Industrial Chemicals",         category: "Chemicals",    hazmatClass: "8", unNumber: "UN1760",                      requiresHazmat: true,  requiresTanker: true,  requiresTWIC: false, temperatureControlled: false, icon: "FlaskConical" },
  { id: "lng",                   label: "LNG (Liquefied Natural Gas)",  category: "Cryogenic",    hazmatClass: "2.1", unNumber: "UN1972",                    requiresHazmat: true,  requiresTanker: true,  requiresTWIC: true,  temperatureControlled: true,  icon: "Snowflake" },
  { id: "lox",                   label: "Liquid Oxygen (LOX)",          category: "Cryogenic",    hazmatClass: "2.2", unNumber: "UN1073",                    requiresHazmat: true,  requiresTanker: true,  requiresTWIC: false, temperatureControlled: true,  icon: "Snowflake" },
  { id: "liquid_nitrogen",       label: "Liquid Nitrogen (LN2)",        category: "Cryogenic",    hazmatClass: "2.2", unNumber: "UN1977",                    requiresHazmat: true,  requiresTanker: true,  requiresTWIC: false, temperatureControlled: true,  icon: "Snowflake" },

  // ─── Food-Grade Liquids ───
  { id: "milk",                  label: "Milk / Dairy Liquids",         category: "Food Liquid",                                                             requiresHazmat: false, requiresTanker: true,  requiresTWIC: false, temperatureControlled: true,  icon: "Milk" },
  { id: "edible_oil",            label: "Edible Oils (Vegetable, Canola)", category: "Food Liquid",                                                          requiresHazmat: false, requiresTanker: true,  requiresTWIC: false, temperatureControlled: false, icon: "Droplets" },
  { id: "juice",                 label: "Juice / Liquid Beverages",     category: "Food Liquid",                                                             requiresHazmat: false, requiresTanker: true,  requiresTWIC: false, temperatureControlled: true,  icon: "GlassWater" },
  { id: "wine_spirits",          label: "Wine / Spirits (Bulk)",        category: "Food Liquid",                                                             requiresHazmat: false, requiresTanker: true,  requiresTWIC: false, temperatureControlled: true,  icon: "Wine" },

  // ─── Water ───
  { id: "potable_water",         label: "Potable Water",                category: "Water",                                                                   requiresHazmat: false, requiresTanker: true,  requiresTWIC: false, temperatureControlled: false, icon: "Droplets" },
  { id: "non_potable_water",     label: "Non-Potable / Industrial Water", category: "Water",                                                                 requiresHazmat: false, requiresTanker: true,  requiresTWIC: false, temperatureControlled: false, icon: "Waves" },

  // ─── Dry Van Products ───
  { id: "general_freight",       label: "General Freight",              category: "Dry Freight",                                                             requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Package" },
  { id: "electronics",           label: "Electronics / High-Value",     category: "Dry Freight",                                                             requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Cpu" },
  { id: "automotive_parts",      label: "Automotive Parts",             category: "Dry Freight",                                                             requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Cog" },
  { id: "retail_goods",          label: "Retail / Consumer Goods",      category: "Dry Freight",                                                             requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "ShoppingCart" },
  { id: "paper_packaging",       label: "Paper & Packaging",            category: "Dry Freight",                                                             requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "FileBox" },
  { id: "furniture",             label: "Furniture / Household Goods",  category: "Dry Freight",                                                             requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Armchair" },
  { id: "hazmat_dry",            label: "Hazmat (Dry / Packaged)",      category: "Dry Freight",  hazmatClass: "9", unNumber: "UN3077",                      requiresHazmat: true,  requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "AlertTriangle" },

  // ─── Refrigerated Products ───
  { id: "produce",               label: "Fresh Produce",                category: "Refrigerated",                                                            requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: true,  icon: "Apple" },
  { id: "frozen_food",           label: "Frozen Food",                  category: "Refrigerated",                                                            requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: true,  icon: "Snowflake" },
  { id: "dairy",                 label: "Dairy Products",               category: "Refrigerated",                                                            requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: true,  icon: "Milk" },
  { id: "meat_seafood",          label: "Meat & Seafood",               category: "Refrigerated",                                                            requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: true,  icon: "Beef" },
  { id: "pharmaceuticals",       label: "Pharmaceuticals",              category: "Refrigerated",                                                            requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: true,  icon: "Pill" },
  { id: "floral",                label: "Floral / Live Plants",         category: "Refrigerated",                                                            requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: true,  icon: "Flower2" },

  // ─── Flatbed / Step Deck / Lowboy Products ───
  { id: "steel_coils",           label: "Steel Coils / Metal",          category: "Flatbed",                                                                 requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "CircleDot" },
  { id: "lumber",                label: "Lumber / Timber",              category: "Flatbed",                                                                 requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "TreePine" },
  { id: "pipe_tubing",           label: "Pipe & Tubing",                category: "Flatbed",                                                                 requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Cylinder" },
  { id: "building_materials",    label: "Building Materials",           category: "Flatbed",                                                                 requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Building2" },
  { id: "machinery",             label: "Machinery / Industrial Equipment", category: "Heavy Haul",                                                          requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Cog" },
  { id: "construction_equipment", label: "Construction Equipment",      category: "Heavy Haul",                                                              requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "HardHat" },
  { id: "oilfield_equipment",    label: "Oilfield Equipment",           category: "Heavy Haul",                                                              requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Factory" },
  { id: "solar_panels",          label: "Solar Panels / Wind Components", category: "Flatbed",                                                               requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Sun" },

  // ─── Dry Bulk / Hopper Products ───
  { id: "grain",                 label: "Grain / Feed",                 category: "Dry Bulk",                                                                requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Wheat" },
  { id: "sand_aggregate",        label: "Sand / Gravel / Aggregate",    category: "Dry Bulk",                                                                requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Mountain" },
  { id: "cement",                label: "Cement / Powder",              category: "Dry Bulk",                                                                requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Layers" },
  { id: "plastic_pellets",       label: "Plastic Pellets / Resin",      category: "Dry Bulk",                                                                requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "CircleDot" },
  { id: "flour_sugar",           label: "Flour / Sugar / Food Powders", category: "Dry Bulk",                                                                requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Cookie" },
];

// ═══════════════════════════════════════════════════════════════
// TRAILER → PRODUCT MAP
// Which products are hauled by which trailer types?
// ═══════════════════════════════════════════════════════════════

export const TRAILER_PRODUCT_MAP: Record<string, string[]> = {
  liquid_tank:      ["crude_oil", "refined_fuel", "jet_fuel", "ethanol", "biodiesel", "asphalt", "condensate", "produced_water", "natural_gas_liquids", "chemicals"],
  gas_tank:         ["lpg", "ammonia", "natural_gas_liquids"],
  cryogenic:        ["lng", "lox", "liquid_nitrogen"],
  food_grade_tank:  ["milk", "edible_oil", "juice", "wine_spirits"],
  water_tank:       ["potable_water", "non_potable_water"],
  dry_van:          ["general_freight", "electronics", "automotive_parts", "retail_goods", "paper_packaging", "furniture", "hazmat_dry"],
  reefer:           ["produce", "frozen_food", "dairy", "meat_seafood", "pharmaceuticals", "floral"],
  flatbed:          ["steel_coils", "lumber", "pipe_tubing", "building_materials", "solar_panels", "machinery", "oilfield_equipment"],
  bulk_hopper:      ["grain", "sand_aggregate", "cement", "plastic_pellets", "flour_sugar"],
  hazmat_van:       ["hazmat_dry", "chemicals"],
  // New vehicle types
  hopper:           ["grain", "sand_aggregate", "cement", "plastic_pellets", "flour_sugar"],
  pneumatic:        ["cement", "flour_sugar", "plastic_pellets", "sand_aggregate"],
  end_dump:         ["sand_aggregate", "building_materials", "steel_coils"],
  intermodal_chassis: ["general_freight", "electronics", "automotive_parts", "retail_goods", "paper_packaging", "hazmat_dry"],
  curtain_side:     ["general_freight", "retail_goods", "paper_packaging", "furniture", "building_materials"],
  // Aliases
  lowboy:           ["machinery", "construction_equipment", "oilfield_equipment"],
  step_deck:        ["steel_coils", "lumber", "pipe_tubing", "building_materials", "machinery", "oilfield_equipment", "solar_panels"],
};

// ═══════════════════════════════════════════════════════════════
// COMPLIANCE RULES
// Each rule says: IF trailer + product match → REQUIRE this document
// ═══════════════════════════════════════════════════════════════

export type RuleTrigger = "TRAILER" | "PRODUCT" | "COMBO";
export type RulePriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface ComplianceRule {
  id: string;
  trigger: RuleTrigger;
  trailerTypes?: string[];    // triggers if carrier has ANY of these
  products?: string[];        // triggers if carrier hauls ANY of these
  documentTypeId: string;
  priority: RulePriority;
  status: "REQUIRED" | "CONDITIONAL" | "RECOMMENDED";
  reason: string;
  group: string;
  federal: boolean;           // federal vs state-level
  endorsements?: string[];    // CDL endorsements required (H, N, T, X)
}

export const COMPLIANCE_RULES: ComplianceRule[] = [
  // ═══════════════════════════════════════════════════════════
  // TRAILER-TRIGGERED RULES (equipment type alone)
  // ═══════════════════════════════════════════════════════════

  // ─── Liquid Tank Trailers ───
  { id: "TANK_INSPECTION",     trigger: "TRAILER", trailerTypes: ["liquid_tank", "gas_tank", "cryogenic", "food_grade_tank", "water_tank"], documentTypeId: "CARGO_TANK_TEST",     priority: "CRITICAL", status: "REQUIRED", reason: "Cargo tank test required per 49 CFR 180.407 for all tank vehicles", group: "Tank Compliance", federal: true },
  { id: "TANK_WASHOUT",        trigger: "TRAILER", trailerTypes: ["liquid_tank", "gas_tank", "food_grade_tank", "water_tank"],              documentTypeId: "TANK_WASHOUT_CERT",   priority: "HIGH",     status: "REQUIRED", reason: "Tank cleaning certification between product changes", group: "Tank Compliance", federal: true },
  { id: "TANK_PRD",            trigger: "TRAILER", trailerTypes: ["gas_tank", "cryogenic"],                                                  documentTypeId: "PRESSURE_RELIEF_TEST", priority: "HIGH",    status: "REQUIRED", reason: "Pressure relief device testing for pressurized/cryogenic tanks", group: "Tank Compliance", federal: true },
  { id: "TANK_ENDORSEMENT",    trigger: "TRAILER", trailerTypes: ["liquid_tank", "gas_tank", "cryogenic", "food_grade_tank", "water_tank"], documentTypeId: "TANKER_ENDORSEMENT",  priority: "CRITICAL", status: "REQUIRED", reason: "CDL N endorsement required for all tank vehicles (49 CFR 383.93)", group: "CDL Endorsements", federal: true, endorsements: ["N"] },

  // ─── Cryogenic Specific ───
  { id: "CRYO_HANDLING",       trigger: "TRAILER", trailerTypes: ["cryogenic"],                                                              documentTypeId: "CRYOGENIC_HANDLING_CERT", priority: "CRITICAL", status: "REQUIRED", reason: "Cryogenic materials handling training (CGA P-1 / OSHA 29 CFR 1910.101)", group: "Specialized Training", federal: true },

  // ─── Flatbed / Step Deck / Lowboy ───
  { id: "LOAD_SECUREMENT",     trigger: "TRAILER", trailerTypes: ["flatbed", "step_deck", "lowboy"],                                         documentTypeId: "LOAD_SECUREMENT_TRAINING", priority: "HIGH", status: "REQUIRED", reason: "Cargo securement training per 49 CFR 393 Subpart I", group: "Specialized Training", federal: true },
  { id: "OVERSIZE_PERMIT",     trigger: "TRAILER", trailerTypes: ["flatbed", "step_deck", "lowboy"],                                         documentTypeId: "OVERSIZE_PERMIT",     priority: "HIGH",     status: "CONDITIONAL", reason: "Oversize/overweight permits may be required per state", group: "State Permits", federal: false },
  { id: "ROUTE_SURVEY",        trigger: "TRAILER", trailerTypes: ["lowboy"],                                                                  documentTypeId: "ROUTE_SURVEY",        priority: "MEDIUM",   status: "CONDITIONAL", reason: "Pre-trip route survey for oversize loads", group: "Operations", federal: false },

  // ─── Hopper / Pneumatic / Dry Bulk / End Dump ───
  { id: "BULK_LOADING",        trigger: "TRAILER", trailerTypes: ["bulk_hopper", "hopper", "pneumatic"],                                      documentTypeId: "BULK_LOADING_CERT",   priority: "HIGH",     status: "REQUIRED", reason: "Pneumatic loading/unloading training certification", group: "Specialized Training", federal: true },
  { id: "HOPPER_INSPECT",      trigger: "TRAILER", trailerTypes: ["bulk_hopper", "hopper", "pneumatic"],                                      documentTypeId: "HOPPER_INSPECTION",   priority: "HIGH",     status: "REQUIRED", reason: "Pneumatic system integrity inspection", group: "Equipment Compliance", federal: true },
  { id: "END_DUMP_SECURE",     trigger: "TRAILER", trailerTypes: ["end_dump"],                                                                 documentTypeId: "LOAD_SECUREMENT_TRAINING", priority: "HIGH", status: "REQUIRED", reason: "Load securement training for end-dump operations", group: "Specialized Training", federal: true },

  // ─── Intermodal / Curtain Side ───
  { id: "INTERMODAL_TWIST",    trigger: "TRAILER", trailerTypes: ["intermodal_chassis"],                                                        documentTypeId: "INTERMODAL_TWIST_LOCK_CERT", priority: "HIGH", status: "REQUIRED", reason: "Intermodal twist-lock securement and container inspection training", group: "Equipment Compliance", federal: true },
  { id: "CURTAIN_SECURE",      trigger: "TRAILER", trailerTypes: ["curtain_side"],                                                              documentTypeId: "LOAD_SECUREMENT_TRAINING", priority: "HIGH", status: "REQUIRED", reason: "Cargo securement training for curtain-side operations (49 CFR 393)", group: "Specialized Training", federal: true },

  // ─── Reefer ───
  { id: "REEFER_FSMA",         trigger: "TRAILER", trailerTypes: ["reefer"],                                                                  documentTypeId: "FOOD_SAFETY_CERT",    priority: "HIGH",     status: "REQUIRED", reason: "FSMA sanitary transportation certification (21 CFR 1.908)", group: "Food Safety", federal: true },

  // ═══════════════════════════════════════════════════════════
  // PRODUCT-TRIGGERED RULES (cargo type alone)
  // ═══════════════════════════════════════════════════════════

  // ─── Hazmat Products (ANY hazmat) ───
  { id: "HAZMAT_REG",          trigger: "PRODUCT", products: ["crude_oil", "refined_fuel", "jet_fuel", "ethanol", "biodiesel", "condensate", "natural_gas_liquids", "lpg", "ammonia", "chemicals", "lng", "lox", "liquid_nitrogen", "asphalt", "hazmat_dry"], documentTypeId: "HAZMAT_REGISTRATION",   priority: "CRITICAL", status: "REQUIRED", reason: "Annual PHMSA registration for hazmat transporters (49 CFR 107.601)", group: "Hazmat Compliance", federal: true },
  { id: "HAZMAT_SECURITY",     trigger: "PRODUCT", products: ["crude_oil", "refined_fuel", "jet_fuel", "ethanol", "biodiesel", "condensate", "natural_gas_liquids", "lpg", "ammonia", "chemicals", "lng", "lox", "liquid_nitrogen", "asphalt", "hazmat_dry"], documentTypeId: "HAZMAT_SECURITY_PLAN",  priority: "CRITICAL", status: "REQUIRED", reason: "Written security plan required (49 CFR 172.800)", group: "Hazmat Compliance", federal: true },
  { id: "HAZMAT_TRAINING",     trigger: "PRODUCT", products: ["crude_oil", "refined_fuel", "jet_fuel", "ethanol", "biodiesel", "condensate", "natural_gas_liquids", "lpg", "ammonia", "chemicals", "lng", "lox", "liquid_nitrogen", "asphalt", "hazmat_dry"], documentTypeId: "HAZMAT_TRAINING_CERT",  priority: "CRITICAL", status: "REQUIRED", reason: "Hazmat handling training certification (49 CFR 172.704)", group: "Hazmat Compliance", federal: true },
  { id: "HAZMAT_ENDORSEMENT",  trigger: "PRODUCT", products: ["crude_oil", "refined_fuel", "jet_fuel", "ethanol", "biodiesel", "condensate", "natural_gas_liquids", "lpg", "ammonia", "chemicals", "lng", "lox", "liquid_nitrogen", "asphalt", "hazmat_dry"], documentTypeId: "HAZMAT_ENDORSEMENT",    priority: "CRITICAL", status: "REQUIRED", reason: "CDL H endorsement required for hazmat transport (49 CFR 383.93)", group: "CDL Endorsements", federal: true, endorsements: ["H"] },
  { id: "HAZMAT_SAFETY_PERM",  trigger: "PRODUCT", products: ["crude_oil", "refined_fuel", "jet_fuel", "lpg", "ammonia", "lng", "chemicals"],                                                                                                                  documentTypeId: "HAZMAT_SAFETY_PERMIT",  priority: "HIGH",     status: "CONDITIONAL", reason: "FMCSA safety permit for certain hazmat classes (49 CFR 385.403)", group: "Hazmat Compliance", federal: true },
  { id: "HAZMAT_BOL",          trigger: "PRODUCT", products: ["crude_oil", "refined_fuel", "jet_fuel", "ethanol", "biodiesel", "condensate", "natural_gas_liquids", "lpg", "ammonia", "chemicals", "lng", "lox", "liquid_nitrogen", "asphalt", "hazmat_dry"], documentTypeId: "HAZMAT_BOL_TEMPLATE",   priority: "HIGH",     status: "REQUIRED", reason: "Hazmat shipping paper template (49 CFR 172.200)", group: "Operations", federal: true },
  { id: "EPA_ID_HAZWASTE",     trigger: "PRODUCT", products: ["chemicals", "hazmat_dry"],                                                                                                                                                                       documentTypeId: "EPA_ID",                priority: "HIGH",     status: "CONDITIONAL", reason: "EPA ID may be required for hazardous waste transport (40 CFR 263)", group: "Hazmat Compliance", federal: true },

  // ─── Petroleum-Specific ───
  { id: "VAPOR_RECOVERY",      trigger: "PRODUCT", products: ["crude_oil", "refined_fuel", "condensate", "natural_gas_liquids", "ethanol"],                                                                                                                      documentTypeId: "VAPOR_RECOVERY_CERT",   priority: "HIGH",     status: "CONDITIONAL", reason: "Vapor recovery system cert for petroleum tankers (state EPA / CARB)", group: "Environmental", federal: false },
  { id: "SPCC_PLAN",           trigger: "PRODUCT", products: ["crude_oil", "refined_fuel", "condensate", "asphalt"],                                                                                                                                             documentTypeId: "SPCC_PLAN",             priority: "MEDIUM",   status: "CONDITIONAL", reason: "SPCC plan for petroleum handling at facilities (40 CFR 112)", group: "Environmental", federal: true },

  // ─── TWIC-Requiring Products ───
  { id: "TWIC_AVIATION",       trigger: "PRODUCT", products: ["jet_fuel", "lng"],                                                                                                                                                                                documentTypeId: "TWIC",                  priority: "HIGH",     status: "REQUIRED", reason: "TWIC required for secure area access at airports/LNG terminals (49 CFR 1572)", group: "CDL Endorsements", federal: true },

  // ─── Food-Grade Liquids ───
  { id: "FOOD_TANK_FSMA",      trigger: "PRODUCT", products: ["milk", "edible_oil", "juice", "wine_spirits"],                                                                                                                                                   documentTypeId: "FOOD_SAFETY_CERT",      priority: "HIGH",     status: "REQUIRED", reason: "FSMA sanitary transportation for food-grade liquids (21 CFR 1.908)", group: "Food Safety", federal: true },

  // ─── Potable Water ───
  { id: "POTABLE_CERT",        trigger: "PRODUCT", products: ["potable_water"],                                                                                                                                                                                  documentTypeId: "POTABLE_WATER_CERT",    priority: "HIGH",     status: "REQUIRED", reason: "NSF/ANSI 61 compliance for potable water transport tanks", group: "Water Compliance", federal: true },
  { id: "WATER_QUALITY",       trigger: "PRODUCT", products: ["potable_water"],                                                                                                                                                                                  documentTypeId: "WATER_QUALITY_TEST",    priority: "HIGH",     status: "REQUIRED", reason: "Periodic water quality testing (bacteria, chlorine, contaminants)", group: "Water Compliance", federal: true },

  // ─── Pharmaceuticals ───
  { id: "PHARMA_GDP",          trigger: "PRODUCT", products: ["pharmaceuticals"],                                                                                                                                                                                documentTypeId: "PHARMA_GDP_CERT",       priority: "HIGH",     status: "REQUIRED", reason: "Good Distribution Practice certification for pharmaceutical cold chain", group: "Pharmaceutical", federal: true },

  // ─── Food Products (Reefer) ───
  { id: "ORGANIC_CERT",        trigger: "PRODUCT", products: ["produce", "dairy", "grain", "flour_sugar"],                                                                                                                                                       documentTypeId: "ORGANIC_CERT",          priority: "LOW",      status: "RECOMMENDED", reason: "USDA Organic Handler Certification if transporting organic products", group: "Food Safety", federal: true },
  { id: "KOSHER_CERT",         trigger: "PRODUCT", products: ["dairy", "meat_seafood", "produce"],                                                                                                                                                               documentTypeId: "KOSHER_CERT",           priority: "LOW",      status: "RECOMMENDED", reason: "Kosher certification if transporting kosher products", group: "Food Safety", federal: false },

  // ═══════════════════════════════════════════════════════════
  // COMBO RULES (specific trailer + product)
  // ═══════════════════════════════════════════════════════════

  // Crude oil in liquid tank → full petroleum suite
  { id: "CRUDE_TANK_COMBO",    trigger: "COMBO", trailerTypes: ["liquid_tank"], products: ["crude_oil", "condensate"], documentTypeId: "HAZMAT_ENDORSEMENT", priority: "CRITICAL", status: "REQUIRED", reason: "H+N endorsement required for crude oil tanker operations", group: "CDL Endorsements", federal: true, endorsements: ["H", "N"] },

  // Food-grade tank + milk → extra washout stringency
  { id: "MILK_WASHOUT",        trigger: "COMBO", trailerTypes: ["food_grade_tank"], products: ["milk", "juice"], documentTypeId: "TANK_WASHOUT_CERT", priority: "CRITICAL", status: "REQUIRED", reason: "Tank washout between every load required for dairy/juice (PMO compliance)", group: "Food Safety", federal: true },

  // Cryogenic + LNG → both cryo handling + hazmat combo
  { id: "LNG_CRYO_COMBO",      trigger: "COMBO", trailerTypes: ["cryogenic"], products: ["lng"], documentTypeId: "CRYOGENIC_HANDLING_CERT", priority: "CRITICAL", status: "REQUIRED", reason: "Specialized cryogenic + hazmat handling for LNG transport", group: "Specialized Training", federal: true, endorsements: ["H", "N"] },

  // Lowboy + heavy machinery → oversize almost always required
  { id: "HEAVY_OVERSIZE",      trigger: "COMBO", trailerTypes: ["lowboy"], products: ["construction_equipment", "machinery", "oilfield_equipment"], documentTypeId: "OVERSIZE_PERMIT", priority: "CRITICAL", status: "REQUIRED", reason: "Heavy equipment on lowboy typically exceeds legal dimensions — oversize permit required", group: "State Permits", federal: false },
  { id: "HEAVY_ROUTE_SURVEY",  trigger: "COMBO", trailerTypes: ["lowboy"], products: ["construction_equipment", "machinery", "oilfield_equipment"], documentTypeId: "ROUTE_SURVEY", priority: "HIGH", status: "REQUIRED", reason: "Route survey required for heavy haul loads (bridge clearance, turn restrictions)", group: "Operations", federal: false },

  // Reefer + pharmaceuticals → GDP + cold chain
  { id: "PHARMA_REEFER_COMBO", trigger: "COMBO", trailerTypes: ["reefer"], products: ["pharmaceuticals"], documentTypeId: "PHARMA_GDP_CERT", priority: "CRITICAL", status: "REQUIRED", reason: "GDP certification mandatory for pharmaceutical temperature-controlled shipments", group: "Pharmaceutical", federal: true },

  // Dry bulk + food powders → food safety
  { id: "FOOD_BULK_COMBO",     trigger: "COMBO", trailerTypes: ["bulk_hopper"], products: ["flour_sugar", "grain"], documentTypeId: "FOOD_SAFETY_CERT", priority: "HIGH", status: "REQUIRED", reason: "FSMA compliance for food-grade dry bulk transport", group: "Food Safety", federal: true },
];

// ═══════════════════════════════════════════════════════════════
// RESOLVER — Given selections, return matching rules
// ═══════════════════════════════════════════════════════════════

export interface ComplianceMatrixInput {
  trailerTypes: string[];
  products: string[];
}

export interface ResolvedRule {
  rule: ComplianceRule;
  matchedTrailers: string[];
  matchedProducts: string[];
  matchType: RuleTrigger;
}

/**
 * Resolve compliance rules for a given set of trailer types and products.
 * Returns deduplicated rules sorted by priority.
 */
export function resolveComplianceMatrix(input: ComplianceMatrixInput): ResolvedRule[] {
  const trailerSet = new Set(input.trailerTypes.map(t => t.toLowerCase()));
  const productSet = new Set(input.products.map(p => p.toLowerCase()));
  const results: ResolvedRule[] = [];
  const seen = new Set<string>(); // dedupe by documentTypeId

  for (const rule of COMPLIANCE_RULES) {
    let matched = false;
    let matchedTrailers: string[] = [];
    let matchedProducts: string[] = [];

    if (rule.trigger === "TRAILER") {
      matchedTrailers = (rule.trailerTypes || []).filter(t => trailerSet.has(t));
      matched = matchedTrailers.length > 0;
    } else if (rule.trigger === "PRODUCT") {
      matchedProducts = (rule.products || []).filter(p => productSet.has(p));
      matched = matchedProducts.length > 0;
    } else if (rule.trigger === "COMBO") {
      matchedTrailers = (rule.trailerTypes || []).filter(t => trailerSet.has(t));
      matchedProducts = (rule.products || []).filter(p => productSet.has(p));
      matched = matchedTrailers.length > 0 && matchedProducts.length > 0;
    }

    if (matched) {
      const key = `${rule.documentTypeId}:${rule.group}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({ rule, matchedTrailers, matchedProducts, matchType: rule.trigger });
      }
    }
  }

  // Sort: CRITICAL → HIGH → MEDIUM → LOW
  const pOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  results.sort((a, b) => (pOrder[a.rule.priority] ?? 3) - (pOrder[b.rule.priority] ?? 3));

  return results;
}

/**
 * Get all applicable products for a set of trailer types.
 * Used to dynamically filter the product picker.
 */
export function getApplicableProducts(trailerTypes: string[]): ProductDefinition[] {
  const productIds = new Set<string>();
  for (const tt of trailerTypes) {
    const key = tt.toLowerCase();
    const products = TRAILER_PRODUCT_MAP[key] || [];
    for (const p of products) productIds.add(p);
  }
  return PRODUCT_CATALOG.filter(p => productIds.has(p.id));
}

/**
 * Get all required CDL endorsements for a set of trailer types and products.
 */
export function getRequiredEndorsements(input: ComplianceMatrixInput): string[] {
  const resolved = resolveComplianceMatrix(input);
  const endorsements = new Set<string>();
  for (const r of resolved) {
    if (r.rule.endorsements) {
      for (const e of r.rule.endorsements) endorsements.add(e);
    }
  }
  return Array.from(endorsements).sort();
}
