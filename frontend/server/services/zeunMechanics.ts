/**
 * ZEUN MECHANICS — Equipment Intelligence & Load Matching Engine
 * ESANG AI (Gemini 2.5 Flash) powered equipment analysis for ALL trucking modes.
 *
 * Core concept: Load matching is a 3D matrix:
 *   Product × Trailer × Equipment × Site Conditions
 *
 * Every trailer type has specialized equipment:
 *   Tanker: hoses, fittings, pumps, vapor recovery, grounding
 *   Flatbed: straps, chains, binders, tarps, edge protectors, dunnage
 *   Reefer: temp recorders, pre-cool, fuel, multi-temp dividers
 *   Dry Van: load bars, e-track, pallet jacks, liftgate, dock plates
 *   Step Deck: ramps, chains, wide load banners, flags
 *   Lowboy: permits, pilot cars, height poles, amber lights
 *   Hopper/Pneumatic: blowers, discharge hoses, product gates
 *
 * This service maintains the equipment knowledge base, scores carrier↔load compatibility,
 * and uses Gemini AI for edge-case analysis and free-form equipment advisory.
 */

import { ENV } from "../_core/env";

// ─── Gemini AI Config ──────────────────────────────────────────────────────
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const GEMINI_TIMEOUT_MS = 30_000;

async function gemFetch(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  try {
    const resp = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(timer);
    return resp;
  } catch (err: any) {
    clearTimeout(timer);
    throw err;
  }
}

// ─── Equipment Categories ──────────────────────────────────────────────────
export type EquipmentCategoryId =
  | "hoses"
  | "fittings"
  | "pumps"
  | "vapor_recovery"
  | "safety"
  | "loading_equipment"
  | "measurement"
  | "site_infrastructure"
  | "trailer_features"
  | "certifications"
  | "securing"
  | "reefer_equipment"
  | "flatbed_equipment"
  | "dry_van_equipment"
  | "hopper_equipment"
  | "oversized_equipment";

export interface EquipmentItem {
  id: string;
  categoryId: EquipmentCategoryId;
  name: string;
  description: string;
  specs?: Record<string, string | string[]>;
  applicableProducts: string[];      // product types this is used with
  applicableTrailers: string[];      // trailer types this is used with
  criticality: "required" | "recommended" | "optional";
}

export interface EquipmentCategory {
  id: EquipmentCategoryId;
  name: string;
  icon: string;
  description: string;
  items: EquipmentItem[];
}

// ─── Equipment Profile (what a carrier/driver HAS) ────────────────────────
export interface EquipmentProfileItem {
  equipmentId: string;
  available: boolean;
  specs?: Record<string, string>;   // e.g. { diameter: "3\"", length: "50ft" }
  condition?: "excellent" | "good" | "fair" | "needs_service";
  lastInspected?: string;
  notes?: string;
}

export interface EquipmentProfile {
  vehicleId?: number;
  companyId: number;
  items: EquipmentProfileItem[];
  certifications: string[];         // H2S, TWIC, PEC SafeLand, etc.
  updatedAt: string;
}

// ─── Equipment Requirements (what a load NEEDS) ───────────────────────────
export interface EquipmentRequirement {
  equipmentId: string;
  required: boolean;
  minSpec?: Record<string, string>;  // e.g. { diameter: "3\"", length: "25ft" }
  notes?: string;
}

export interface LoadEquipmentRequirements {
  requirements: EquipmentRequirement[];
  siteConditions: SiteCondition[];
  productNotes?: string;
}

export interface SiteCondition {
  conditionId: string;
  label: string;
  value: boolean | string;
  notes?: string;
}

// ─── Match Result ──────────────────────────────────────────────────────────
export interface EquipmentMatchResult {
  overallScore: number;             // 0-100
  readiness: "ready" | "partial" | "not_ready";
  matched: MatchDetail[];
  gaps: GapDetail[];
  warnings: string[];
  recommendations: string[];
  aiInsight?: string;
}

export interface MatchDetail {
  equipmentId: string;
  equipmentName: string;
  status: "met" | "exceeded" | "partial";
  carrierSpec?: string;
  requiredSpec?: string;
}

export interface GapDetail {
  equipmentId: string;
  equipmentName: string;
  severity: "critical" | "warning" | "info";
  description: string;
  suggestion?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EQUIPMENT KNOWLEDGE BASE — All trailer types & product modes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─── Products ────────────────────────────────────────────────────────────────
const PETROLEUM_PRODUCTS = ["crude_oil", "refined_fuel", "lpg", "chemicals", "asphalt", "condensate", "produced_water", "natural_gas_liquids", "ethanol", "biodiesel"];
const DRY_PRODUCTS = ["general_freight", "electronics", "furniture", "building_materials", "food_beverage_dry", "automotive_parts", "retail_goods", "paper_packaging"];
const REEFER_PRODUCTS = ["produce", "frozen_food", "dairy", "meat_seafood", "pharmaceuticals", "floral", "beverages_cold"];
const FLATBED_PRODUCTS = ["steel_coils", "lumber", "building_materials_flat", "pipe_tubing", "machinery_small", "concrete_products", "roofing", "solar_panels"];
const HEAVY_PRODUCTS = ["heavy_machinery", "construction_equipment", "industrial_equipment", "military_equipment", "oilfield_equipment"];
const BULK_PRODUCTS = ["grain", "feed", "sand_aggregate", "cement", "fly_ash", "plastic_pellets", "flour", "sugar", "salt_bulk"];
const ALL_PRODUCTS = [...PETROLEUM_PRODUCTS, ...DRY_PRODUCTS, ...REEFER_PRODUCTS, ...FLATBED_PRODUCTS, ...HEAVY_PRODUCTS, ...BULK_PRODUCTS];

// ─── Trailers ────────────────────────────────────────────────────────────────
const LIQUID_TRAILERS = ["liquid_tank", "tanker", "mc307", "mc312", "mc331", "dot407", "dot412"];
const GAS_TRAILERS = ["mc331", "gas_tank", "cryogenic"];
const DRY_VAN_TRAILERS = ["dry_van", "dry_van_53", "dry_van_48"];
const REEFER_TRAILERS = ["refrigerated", "reefer_53", "reefer_48", "multi_temp"];
const FLATBED_TRAILERS = ["flatbed", "flatbed_48", "flatbed_53", "conestoga"];
const STEP_DECK_TRAILERS = ["step_deck", "double_drop"];
const LOWBOY_TRAILERS = ["lowboy", "rgn", "double_drop"];
const HOPPER_TRAILERS = ["hopper", "pneumatic", "end_dump", "belly_dump"];
const DRY_TRAILERS = [...DRY_VAN_TRAILERS, ...FLATBED_TRAILERS, ...STEP_DECK_TRAILERS, ...LOWBOY_TRAILERS, ...HOPPER_TRAILERS];
const ALL_TRAILERS = [...LIQUID_TRAILERS, ...GAS_TRAILERS, ...DRY_TRAILERS, ...REEFER_TRAILERS];

export const EQUIPMENT_CATALOG: EquipmentCategory[] = [
  // ─── HOSES ───────────────────────────────────────────────────────────────
  {
    id: "hoses",
    name: "Hoses & Lines",
    icon: "Cable",
    description: "Loading/offloading hoses — diameter, length, material, pressure rating",
    items: [
      {
        id: "hose_2in",
        categoryId: "hoses",
        name: "2\" Loading Hose",
        description: "2-inch diameter loading/offloading hose for lighter products",
        specs: { diameter: ["2\""], length: ["10ft", "25ft", "50ft"], material: ["rubber", "composite"], pressureRating: ["150 PSI"] },
        applicableProducts: ["refined_fuel", "ethanol", "biodiesel", "produced_water"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "recommended",
      },
      {
        id: "hose_3in",
        categoryId: "hoses",
        name: "3\" Loading Hose",
        description: "3-inch diameter hose — standard for crude oil and most petroleum products",
        specs: { diameter: ["3\""], length: ["25ft", "50ft", "100ft"], material: ["rubber", "composite", "stainless_steel"], pressureRating: ["150 PSI", "300 PSI"] },
        applicableProducts: ["crude_oil", "refined_fuel", "condensate", "produced_water", "natural_gas_liquids"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "required",
      },
      {
        id: "hose_4in",
        categoryId: "hoses",
        name: "4\" Loading Hose",
        description: "4-inch diameter hose for high-volume crude and heavy product transfers",
        specs: { diameter: ["4\""], length: ["25ft", "50ft", "100ft"], material: ["rubber", "composite", "stainless_steel"], pressureRating: ["150 PSI", "300 PSI"] },
        applicableProducts: ["crude_oil", "asphalt", "condensate"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "required",
      },
      {
        id: "vapor_hose",
        categoryId: "hoses",
        name: "Vapor Recovery Hose",
        description: "Dedicated vapor return line for loading operations requiring vapor balancing",
        specs: { diameter: ["2\"", "3\""], length: ["25ft", "50ft"], material: ["rubber", "composite"] },
        applicableProducts: ["crude_oil", "refined_fuel", "condensate", "natural_gas_liquids", "ethanol"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "recommended",
      },
      {
        id: "lpg_hose",
        categoryId: "hoses",
        name: "LPG Transfer Hose",
        description: "High-pressure rated hose for liquefied petroleum gas transfer",
        specs: { diameter: ["1.5\"", "2\""], length: ["25ft", "50ft"], material: ["stainless_braided"], pressureRating: ["350 PSI", "500 PSI"] },
        applicableProducts: ["lpg", "natural_gas_liquids"],
        applicableTrailers: GAS_TRAILERS,
        criticality: "required",
      },
      {
        id: "chemical_hose",
        categoryId: "hoses",
        name: "Chemical-Resistant Hose",
        description: "PTFE-lined or chemical-grade hose for corrosive/reactive products",
        specs: { diameter: ["2\"", "3\""], length: ["25ft", "50ft"], material: ["PTFE_lined", "stainless_steel", "chemical_grade_rubber"] },
        applicableProducts: ["chemicals"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "required",
      },
    ],
  },

  // ─── FITTINGS & CONNECTIONS ──────────────────────────────────────────────
  {
    id: "fittings",
    name: "Fittings & Connections",
    icon: "Wrench",
    description: "Cam-locks, API couplings, hammer unions, adapters",
    items: [
      {
        id: "camlock_fittings",
        categoryId: "fittings",
        name: "Cam-Lock Fittings",
        description: "Quick-connect cam-lock fittings (Type A, B, C, D, E, F) — industry standard",
        specs: { sizes: ["2\"", "3\"", "4\""], types: ["A", "B", "C", "D", "E", "F"], material: ["aluminum", "stainless_steel", "brass"] },
        applicableProducts: ALL_PRODUCTS,
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "required",
      },
      {
        id: "api_coupling",
        categoryId: "fittings",
        name: "API Bottom-Load Coupling",
        description: "API 1004 standard bottom-loading adapter for rack-style terminals",
        specs: { sizes: ["3\"", "4\""], standard: ["API 1004"] },
        applicableProducts: ["refined_fuel", "ethanol", "biodiesel"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "required",
      },
      {
        id: "hammer_union",
        categoryId: "fittings",
        name: "Hammer Union Fittings",
        description: "High-pressure hammer union connections common at oilfield well sites",
        specs: { sizes: ["2\"", "3\"", "4\""], rating: ["1502", "602"] },
        applicableProducts: ["crude_oil", "condensate", "produced_water"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "required",
      },
      {
        id: "reducer_adapters",
        categoryId: "fittings",
        name: "Reducer Adapters",
        description: "Size-down adapters (4\"→3\", 3\"→2\") for mismatched connections",
        specs: { combinations: ["4→3", "3→2", "4→2"] },
        applicableProducts: ALL_PRODUCTS,
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "recommended",
      },
      {
        id: "dry_break_coupling",
        categoryId: "fittings",
        name: "Dry-Break Coupling",
        description: "Spill-free disconnect coupling for clean product transfer",
        specs: { sizes: ["3\"", "4\""], standard: ["OPW", "Dixon"] },
        applicableProducts: ["refined_fuel", "chemicals", "ethanol"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "recommended",
      },
      {
        id: "acme_fitting",
        categoryId: "fittings",
        name: "ACME Thread Fittings",
        description: "ACME thread connections for LPG/propane/NGL transfer",
        specs: { sizes: ["1-3/4\" ACME", "3-1/4\" ACME"] },
        applicableProducts: ["lpg", "natural_gas_liquids"],
        applicableTrailers: GAS_TRAILERS,
        criticality: "required",
      },
    ],
  },

  // ─── PUMPS ───────────────────────────────────────────────────────────────
  {
    id: "pumps",
    name: "Pumps",
    icon: "Gauge",
    description: "PTO, centrifugal, gear, and air-driven pumps for loading/offloading",
    items: [
      {
        id: "pto_pump",
        categoryId: "pumps",
        name: "PTO Pump",
        description: "Power take-off pump driven by the truck's engine — standard for crude hauling",
        specs: { type: ["centrifugal", "gear"], flowRate: ["200 GPM", "400 GPM", "600 GPM"] },
        applicableProducts: ["crude_oil", "produced_water", "condensate", "asphalt"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "required",
      },
      {
        id: "air_compressor",
        categoryId: "pumps",
        name: "On-Board Air Compressor",
        description: "Air compressor for pneumatic offloading of dry bulk or air-driven pumps",
        specs: { cfm: ["100", "185", "250"], psi: ["100", "150"] },
        applicableProducts: ["lpg"],
        applicableTrailers: ["hopper", ...GAS_TRAILERS],
        criticality: "recommended",
      },
      {
        id: "internal_pump",
        categoryId: "pumps",
        name: "Internal Cargo Pump",
        description: "Trailer-mounted internal pump for gravity-challenged offloading",
        specs: { type: ["centrifugal", "positive_displacement"], flowRate: ["100 GPM", "200 GPM"] },
        applicableProducts: ["chemicals", "refined_fuel"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "optional",
      },
    ],
  },

  // ─── VAPOR RECOVERY ──────────────────────────────────────────────────────
  {
    id: "vapor_recovery",
    name: "Vapor Recovery",
    icon: "Wind",
    description: "Vapor recovery units and balancing systems for emission compliance",
    items: [
      {
        id: "vapor_recovery_unit",
        categoryId: "vapor_recovery",
        name: "Vapor Recovery Adapter",
        description: "Onboard vapor return adapter for closed-loop loading at equipped terminals",
        specs: { type: ["passive", "active"], connection: ["2\"", "3\""] },
        applicableProducts: ["crude_oil", "refined_fuel", "condensate", "natural_gas_liquids", "ethanol"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "recommended",
      },
      {
        id: "pressure_vacuum_vent",
        categoryId: "vapor_recovery",
        name: "Pressure/Vacuum Relief Vent",
        description: "Spring-loaded P/V vent for safe vapor management during transport",
        specs: { pressureSetting: ["0.5 PSI", "1 PSI", "3 PSI"] },
        applicableProducts: ALL_PRODUCTS,
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "required",
      },
    ],
  },

  // ─── SAFETY EQUIPMENT ────────────────────────────────────────────────────
  {
    id: "safety",
    name: "Safety Equipment",
    icon: "ShieldAlert",
    description: "H2S monitors, fire extinguishers, grounding, spill kits, PPE",
    items: [
      {
        id: "h2s_monitor",
        categoryId: "safety",
        name: "H2S Personal Monitor",
        description: "Portable hydrogen sulfide gas detector — required at sour crude wells",
        specs: { type: ["single_gas", "multi_gas"], alarmLevels: ["10 PPM", "20 PPM"] },
        applicableProducts: ["crude_oil", "condensate", "produced_water", "natural_gas_liquids"],
        applicableTrailers: ALL_TRAILERS,
        criticality: "required",
      },
      {
        id: "fire_extinguisher",
        categoryId: "safety",
        name: "Fire Extinguisher",
        description: "DOT-required ABC dry chemical extinguisher — minimum 10 lb for hazmat",
        specs: { type: ["ABC", "BC"], size: ["5 lb", "10 lb", "20 lb"] },
        applicableProducts: ALL_PRODUCTS,
        applicableTrailers: ALL_TRAILERS,
        criticality: "required",
      },
      {
        id: "grounding_reel",
        categoryId: "safety",
        name: "Grounding/Bonding Cable & Reel",
        description: "Static grounding reel with clamp — mandatory for flammable product transfer",
        specs: { length: ["25ft", "50ft", "100ft"], type: ["spring_reel", "manual"] },
        applicableProducts: ["crude_oil", "refined_fuel", "lpg", "condensate", "natural_gas_liquids", "ethanol", "chemicals"],
        applicableTrailers: [...LIQUID_TRAILERS, ...GAS_TRAILERS],
        criticality: "required",
      },
      {
        id: "spill_kit",
        categoryId: "safety",
        name: "Spill Containment Kit",
        description: "EPA-compliant spill response kit — absorbent pads, booms, bags, PPE",
        specs: { capacity: ["5 gal", "10 gal", "20 gal", "55 gal"] },
        applicableProducts: ALL_PRODUCTS,
        applicableTrailers: ALL_TRAILERS,
        criticality: "required",
      },
      {
        id: "ppe_fr",
        categoryId: "safety",
        name: "FR Clothing (Fire Resistant)",
        description: "NFPA 2112 flame-resistant clothing — required at most well sites and terminals",
        specs: { standard: ["NFPA 2112", "ASTM F1506"] },
        applicableProducts: ALL_PRODUCTS,
        applicableTrailers: ALL_TRAILERS,
        criticality: "required",
      },
      {
        id: "ppe_hardhat",
        categoryId: "safety",
        name: "Hard Hat",
        description: "ANSI Z89.1 Type I or II hard hat — required at well sites and terminals",
        specs: { standard: ["ANSI Z89.1"] },
        applicableProducts: ALL_PRODUCTS,
        applicableTrailers: ALL_TRAILERS,
        criticality: "required",
      },
      {
        id: "ppe_steel_toes",
        categoryId: "safety",
        name: "Steel-Toe Boots",
        description: "ASTM F2413 steel/composite toe boots — required at all loading/unloading sites",
        specs: { standard: ["ASTM F2413"] },
        applicableProducts: ALL_PRODUCTS,
        applicableTrailers: ALL_TRAILERS,
        criticality: "required",
      },
      {
        id: "ppe_safety_glasses",
        categoryId: "safety",
        name: "Safety Glasses",
        description: "ANSI Z87.1 impact-rated safety glasses",
        specs: { standard: ["ANSI Z87.1"] },
        applicableProducts: ALL_PRODUCTS,
        applicableTrailers: ALL_TRAILERS,
        criticality: "required",
      },
      {
        id: "ppe_gloves",
        categoryId: "safety",
        name: "Chemical-Resistant Gloves",
        description: "Nitrile or PVC chemical-resistant gloves for product handling",
        specs: { material: ["nitrile", "PVC", "neoprene"] },
        applicableProducts: ["crude_oil", "chemicals", "refined_fuel", "asphalt"],
        applicableTrailers: ALL_TRAILERS,
        criticality: "required",
      },
    ],
  },

  // ─── LOADING/OFFLOADING EQUIPMENT ────────────────────────────────────────
  {
    id: "loading_equipment",
    name: "Loading Equipment",
    icon: "ArrowUpDown",
    description: "Manifolds, strainers, air eliminators, bottom-loading arms",
    items: [
      {
        id: "manifold_system",
        categoryId: "loading_equipment",
        name: "Loading Manifold",
        description: "Multi-port manifold for compartment-specific loading on multi-compartment trailers",
        specs: { ports: ["2", "3", "4", "5"], size: ["3\"", "4\""] },
        applicableProducts: ["refined_fuel", "crude_oil"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "recommended",
      },
      {
        id: "strainer",
        categoryId: "loading_equipment",
        name: "Inline Strainer / Basket Filter",
        description: "Prevents sediment and debris from entering trailer during loading",
        specs: { meshSize: ["20 mesh", "40 mesh", "60 mesh", "100 mesh"], size: ["3\"", "4\""] },
        applicableProducts: ["crude_oil", "produced_water", "condensate"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "recommended",
      },
      {
        id: "air_eliminator",
        categoryId: "loading_equipment",
        name: "Air Eliminator",
        description: "Removes entrained air from product stream for accurate measurement",
        specs: { flowRate: ["200 GPM", "400 GPM"] },
        applicableProducts: ["crude_oil", "refined_fuel", "condensate"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "recommended",
      },
      {
        id: "bottom_loading_adapter",
        categoryId: "loading_equipment",
        name: "Bottom-Loading Adapter",
        description: "API 1004 bottom-loading adapter for terminal rack loading",
        specs: { size: ["4\""], standard: ["API 1004"] },
        applicableProducts: ["refined_fuel", "ethanol", "biodiesel"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "required",
      },
    ],
  },

  // ─── MEASUREMENT & GAUGING ───────────────────────────────────────────────
  {
    id: "measurement",
    name: "Measurement & Gauging",
    icon: "Ruler",
    description: "Gauging tapes, thermometers, sample kits, meters",
    items: [
      {
        id: "gauge_tape",
        categoryId: "measurement",
        name: "Tank Gauging Tape",
        description: "Innage/outage tape for manual tank level measurement at well sites",
        specs: { length: ["25ft", "50ft", "100ft"], type: ["innage", "outage"] },
        applicableProducts: ["crude_oil", "condensate", "produced_water"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "recommended",
      },
      {
        id: "thermometer",
        categoryId: "measurement",
        name: "Product Thermometer",
        description: "Certified thermometer for temperature correction of measured volumes",
        specs: { range: ["-20°F to 250°F"], accuracy: ["±0.5°F"] },
        applicableProducts: ["crude_oil", "refined_fuel", "condensate", "asphalt"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "recommended",
      },
      {
        id: "sample_kit",
        categoryId: "measurement",
        name: "Product Sampling Kit",
        description: "Thief sampler + bottles for BS&W testing and quality verification",
        specs: { includes: ["thief_sampler", "sample_bottles", "centrifuge_tubes"] },
        applicableProducts: ["crude_oil", "condensate"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "recommended",
      },
      {
        id: "flowmeter_portable",
        categoryId: "measurement",
        name: "Portable Flowmeter",
        description: "Portable turbine or positive-displacement meter for volume measurement",
        specs: { type: ["turbine", "positive_displacement"], accuracy: ["±0.25%", "±0.5%"] },
        applicableProducts: ["crude_oil", "refined_fuel"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "optional",
      },
    ],
  },

  // ─── SITE INFRASTRUCTURE (what the pickup/delivery site provides) ───────
  {
    id: "site_infrastructure",
    name: "Site Equipment",
    icon: "Factory",
    description: "LACT units, loading racks, tank batteries, vapor recovery systems at site",
    items: [
      {
        id: "lact_unit",
        categoryId: "site_infrastructure",
        name: "LACT Unit",
        description: "Lease Automatic Custody Transfer — automated measurement and loading at well sites",
        specs: { flowRate: ["up to 600 GPM"], features: ["meter", "sampler", "BS&W probe", "auto_shutoff"] },
        applicableProducts: ["crude_oil", "condensate"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "optional",
      },
      {
        id: "loading_rack",
        categoryId: "site_infrastructure",
        name: "Loading Rack (Terminal)",
        description: "Multi-arm loading rack at terminal — top-loading or bottom-loading",
        specs: { type: ["top_loading", "bottom_loading", "both"], arms: ["1", "2", "4", "8"] },
        applicableProducts: ["refined_fuel", "ethanol", "biodiesel", "chemicals"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "optional",
      },
      {
        id: "tank_battery",
        categoryId: "site_infrastructure",
        name: "Tank Battery",
        description: "Multi-tank storage facility at well site — gravity feed or pump-out",
        specs: { capacity: ["100 bbl", "500 bbl", "1000 bbl"], feedType: ["gravity", "pump"] },
        applicableProducts: ["crude_oil", "produced_water", "condensate"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "optional",
      },
      {
        id: "pump_off_unit",
        categoryId: "site_infrastructure",
        name: "Pump-Off Unit / Rod Pump",
        description: "Mechanical pump (pump jack) at well site — driver must wait for sufficient volume",
        specs: { type: ["beam_pump", "progressive_cavity"] },
        applicableProducts: ["crude_oil"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "optional",
      },
      {
        id: "site_vapor_recovery",
        categoryId: "site_infrastructure",
        name: "Site Vapor Recovery System",
        description: "Installed VRU at loading site — driver connects vapor return hose",
        specs: { type: ["VRT", "VRU", "flare"], connection: ["2\"", "3\""] },
        applicableProducts: ["crude_oil", "refined_fuel", "condensate"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "optional",
      },
      {
        id: "scale_onsite",
        categoryId: "site_infrastructure",
        name: "On-Site Scale",
        description: "Truck scale at site for weight-based measurement verification",
        specs: { type: ["platform", "axle"], capacity: ["80,000 lbs", "100,000 lbs"] },
        applicableProducts: ALL_PRODUCTS,
        applicableTrailers: ALL_TRAILERS,
        criticality: "optional",
      },
    ],
  },

  // ─── TRAILER FEATURES ────────────────────────────────────────────────────
  {
    id: "trailer_features",
    name: "Trailer Features",
    icon: "Container",
    description: "Compartments, coatings, heating, insulation, pressure ratings",
    items: [
      {
        id: "compartments",
        categoryId: "trailer_features",
        name: "Multi-Compartment Tank",
        description: "Tank divided into separate compartments for multi-product hauling",
        specs: { count: ["1", "2", "3", "4", "5"], individual_capacity: ["varies"] },
        applicableProducts: ["refined_fuel", "crude_oil", "chemicals"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "optional",
      },
      {
        id: "internal_coating",
        categoryId: "trailer_features",
        name: "Internal Coating / Lining",
        description: "Epoxy, phenolic, or stainless lining for chemical compatibility",
        specs: { type: ["epoxy", "phenolic", "stainless_steel", "rubber_lined", "glass_lined"] },
        applicableProducts: ["chemicals", "refined_fuel", "crude_oil"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "recommended",
      },
      {
        id: "heating_coils",
        categoryId: "trailer_features",
        name: "Heating Coils / Steam Jacket",
        description: "Internal heating system for viscous products (asphalt, heavy crude)",
        specs: { type: ["steam_coil", "electric", "hot_oil_jacket"] },
        applicableProducts: ["asphalt", "crude_oil"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "required",
      },
      {
        id: "insulation",
        categoryId: "trailer_features",
        name: "Insulated Tank",
        description: "Thermal insulation for temperature-sensitive products",
        specs: { rValue: ["R-6", "R-10", "R-15"] },
        applicableProducts: ["asphalt", "crude_oil", "chemicals"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "recommended",
      },
      {
        id: "food_grade",
        categoryId: "trailer_features",
        name: "Food-Grade Tank",
        description: "Sanitary stainless steel construction for food-grade ethanol or biodiesel",
        specs: { material: ["304 SS", "316 SS"], certification: ["FDA", "3A"] },
        applicableProducts: ["ethanol", "biodiesel"],
        applicableTrailers: LIQUID_TRAILERS,
        criticality: "optional",
      },
    ],
  },

  // ─── CERTIFICATIONS & ENDORSEMENTS ───────────────────────────────────────
  {
    id: "certifications",
    name: "Certifications & Endorsements",
    icon: "Award",
    description: "Driver and company certifications required for specific job types",
    items: [
      {
        id: "cert_hazmat",
        categoryId: "certifications",
        name: "Hazmat Endorsement (H)",
        description: "CDL Hazmat endorsement — required for all hazmat Class 1-9 products",
        applicableProducts: ALL_PRODUCTS,
        applicableTrailers: ALL_TRAILERS,
        criticality: "required",
      },
      {
        id: "cert_tanker",
        categoryId: "certifications",
        name: "Tanker Endorsement (N)",
        description: "CDL Tanker endorsement — required for liquid cargo in tank vehicles",
        applicableProducts: ["crude_oil", "refined_fuel", "lpg", "chemicals", "condensate", "produced_water", "natural_gas_liquids", "ethanol", "biodiesel", "asphalt"],
        applicableTrailers: [...LIQUID_TRAILERS, ...GAS_TRAILERS],
        criticality: "required",
      },
      {
        id: "cert_twic",
        categoryId: "certifications",
        name: "TWIC Card",
        description: "Transportation Worker Identification Credential — required at maritime terminals and ports",
        applicableProducts: ALL_PRODUCTS,
        applicableTrailers: ALL_TRAILERS,
        criticality: "recommended",
      },
      {
        id: "cert_h2s",
        categoryId: "certifications",
        name: "H2S Safety Certification",
        description: "Hydrogen Sulfide awareness training — required at sour crude sites",
        applicableProducts: ["crude_oil", "condensate", "produced_water", "natural_gas_liquids"],
        applicableTrailers: ALL_TRAILERS,
        criticality: "required",
      },
      {
        id: "cert_pec_safeland",
        categoryId: "certifications",
        name: "PEC SafeLand / SafeGulf",
        description: "Oilfield safety orientation — required by most E&P companies",
        applicableProducts: ["crude_oil", "condensate", "produced_water"],
        applicableTrailers: ALL_TRAILERS,
        criticality: "required",
      },
      {
        id: "cert_msha",
        categoryId: "certifications",
        name: "MSHA Part 46 Training",
        description: "Mine Safety & Health certification — required for sand/frac sites and aggregate quarries",
        applicableProducts: ["crude_oil", "produced_water", "sand_aggregate", "cement"],
        applicableTrailers: ALL_TRAILERS,
        criticality: "optional",
      },
      {
        id: "cert_food_safety",
        categoryId: "certifications",
        name: "Food Safety / FSMA Training",
        description: "FDA FSMA Sanitary Transportation rule compliance — required for food/beverage haulers",
        applicableProducts: [...REEFER_PRODUCTS, "food_beverage_dry", "flour", "sugar"],
        applicableTrailers: [...REEFER_TRAILERS, ...DRY_VAN_TRAILERS],
        criticality: "required",
      },
      {
        id: "cert_pharma_gdp",
        categoryId: "certifications",
        name: "Pharmaceutical GDP Certification",
        description: "Good Distribution Practice — cold chain integrity for pharma transport",
        applicableProducts: ["pharmaceuticals"],
        applicableTrailers: REEFER_TRAILERS,
        criticality: "required",
      },
      {
        id: "cert_oversize_permit",
        categoryId: "certifications",
        name: "Oversize/Overweight Permits",
        description: "State-specific permits for loads exceeding standard dimensions or weight",
        applicableProducts: HEAVY_PRODUCTS,
        applicableTrailers: [...LOWBOY_TRAILERS, ...STEP_DECK_TRAILERS],
        criticality: "required",
      },
      {
        id: "cert_forklift",
        categoryId: "certifications",
        name: "Forklift Certification (OSHA)",
        description: "OSHA 1910.178 powered industrial truck certification — for driver-unload shipments",
        applicableProducts: [...DRY_PRODUCTS, ...REEFER_PRODUCTS],
        applicableTrailers: [...DRY_VAN_TRAILERS, ...REEFER_TRAILERS],
        criticality: "optional",
      },
    ],
  },

  // ─── SECURING & CARGO CONTROL ─────────────────────────────────────────────
  {
    id: "securing",
    name: "Securing & Cargo Control",
    icon: "Lock",
    description: "Straps, chains, binders, load bars, dunnage, edge protectors, cargo nets",
    items: [
      {
        id: "ratchet_straps",
        categoryId: "securing",
        name: "Ratchet Straps (4\" x 27ft)",
        description: "4-inch heavy-duty ratchet straps with flat hooks — FMCSA minimum WLL 5,400 lbs each",
        specs: { width: ["4\""], length: ["27ft", "30ft"], wll: ["5,400 lbs"], breakStrength: ["16,200 lbs"] },
        applicableProducts: [...FLATBED_PRODUCTS, ...HEAVY_PRODUCTS, ...DRY_PRODUCTS],
        applicableTrailers: [...FLATBED_TRAILERS, ...STEP_DECK_TRAILERS, ...LOWBOY_TRAILERS],
        criticality: "required",
      },
      {
        id: "chain_binders",
        categoryId: "securing",
        name: "Chains & Binders (Grade 70)",
        description: "Grade 70 transport chain with ratchet or lever binders — for heavy/steel loads",
        specs: { grade: ["70"], size: ["3/8\"", "1/2\"", "5/8\""], wll: ["6,600 lbs", "11,300 lbs", "15,800 lbs"], binderType: ["ratchet", "lever"] },
        applicableProducts: ["steel_coils", "pipe_tubing", "machinery_small", ...HEAVY_PRODUCTS, "concrete_products"],
        applicableTrailers: [...FLATBED_TRAILERS, ...STEP_DECK_TRAILERS, ...LOWBOY_TRAILERS],
        criticality: "required",
      },
      {
        id: "coil_racks",
        categoryId: "securing",
        name: "Coil Racks / Cradles",
        description: "Steel coil-holding racks that prevent roll — required for steel coil transport",
        specs: { type: ["A-frame", "cradle", "V-rack"], capacity: ["40,000 lbs", "60,000 lbs"] },
        applicableProducts: ["steel_coils"],
        applicableTrailers: FLATBED_TRAILERS,
        criticality: "required",
      },
      {
        id: "edge_protectors",
        categoryId: "securing",
        name: "Edge Protectors / Corner Guards",
        description: "Prevents strap/chain damage to cargo and maintains securement integrity",
        specs: { material: ["rubber", "plastic", "steel"], size: ["4x4", "6x6"] },
        applicableProducts: [...FLATBED_PRODUCTS, ...HEAVY_PRODUCTS],
        applicableTrailers: [...FLATBED_TRAILERS, ...STEP_DECK_TRAILERS],
        criticality: "required",
      },
      {
        id: "tarps",
        categoryId: "securing",
        name: "Tarps (Lumber / Steel / Smoke)",
        description: "Weather protection tarps — lumber (7ft drop), steel (6ft), smoke/machinery (8ft+)",
        specs: { type: ["lumber_tarp", "steel_tarp", "smoke_tarp", "coil_tarp", "open_top"], dropLength: ["6ft", "7ft", "8ft"] },
        applicableProducts: [...FLATBED_PRODUCTS, "machinery_small"],
        applicableTrailers: [...FLATBED_TRAILERS, ...STEP_DECK_TRAILERS],
        criticality: "required",
      },
      {
        id: "dunnage",
        categoryId: "securing",
        name: "Dunnage / 4x4 Lumber",
        description: "Blocking and bracing material — 4x4 lumber, airbags, or foam blocks",
        specs: { type: ["4x4_lumber", "dunnage_bags", "foam_blocks"], length: ["4ft", "8ft"] },
        applicableProducts: [...FLATBED_PRODUCTS, ...HEAVY_PRODUCTS, "steel_coils", "pipe_tubing"],
        applicableTrailers: [...FLATBED_TRAILERS, ...STEP_DECK_TRAILERS, ...LOWBOY_TRAILERS],
        criticality: "recommended",
      },
      {
        id: "cargo_net",
        categoryId: "securing",
        name: "Cargo Net",
        description: "Heavy-duty cargo net for irregular shaped or stacked loads",
        specs: { size: ["6x8 ft", "8x10 ft", "10x12 ft"], wll: ["2,000 lbs", "4,000 lbs"] },
        applicableProducts: [...DRY_PRODUCTS, ...FLATBED_PRODUCTS],
        applicableTrailers: [...FLATBED_TRAILERS, ...DRY_VAN_TRAILERS],
        criticality: "optional",
      },
      {
        id: "load_bars",
        categoryId: "securing",
        name: "Load Bars / Cargo Bars",
        description: "Adjustable steel bars that press-fit between walls to prevent load shift",
        specs: { type: ["ratchet", "spring_loaded"], length: ["89-104 in", "92-116 in"] },
        applicableProducts: [...DRY_PRODUCTS, ...REEFER_PRODUCTS],
        applicableTrailers: [...DRY_VAN_TRAILERS, ...REEFER_TRAILERS],
        criticality: "required",
      },
      {
        id: "winch_straps",
        categoryId: "securing",
        name: "Winch Straps (4\" x 30ft)",
        description: "Flat-hook winch straps with sliding ratchet for flatbed winch tracks",
        specs: { width: ["4\""], length: ["27ft", "30ft"], wll: ["5,400 lbs"] },
        applicableProducts: [...FLATBED_PRODUCTS, ...HEAVY_PRODUCTS],
        applicableTrailers: FLATBED_TRAILERS,
        criticality: "required",
      },
    ],
  },

  // ─── REEFER / REFRIGERATED EQUIPMENT ──────────────────────────────────────
  {
    id: "reefer_equipment",
    name: "Reefer / Temperature Control",
    icon: "Thermometer",
    description: "Temperature recorders, pre-cool, fuel, multi-temp dividers, temp monitoring",
    items: [
      {
        id: "temp_recorder",
        categoryId: "reefer_equipment",
        name: "Temperature Recorder / Data Logger",
        description: "Continuous temp monitoring device with printout — required for food/pharma chain of custody",
        specs: { type: ["Ryan", "Sensitech", "Emerson", "digital"], range: ["-40°F to 180°F"], accuracy: ["±1°F"] },
        applicableProducts: REEFER_PRODUCTS,
        applicableTrailers: REEFER_TRAILERS,
        criticality: "required",
      },
      {
        id: "reefer_fuel",
        categoryId: "reefer_equipment",
        name: "Reefer Unit Fuel (Diesel)",
        description: "Dedicated diesel tank for refrigeration unit — must maintain fuel throughout trip",
        specs: { tankSize: ["50 gal", "100 gal"], consumption: ["0.5-1.5 gal/hr"] },
        applicableProducts: REEFER_PRODUCTS,
        applicableTrailers: REEFER_TRAILERS,
        criticality: "required",
      },
      {
        id: "pre_cool",
        categoryId: "reefer_equipment",
        name: "Pre-Cool Capability",
        description: "Ability to pre-cool trailer to required temp before loading — standard industry practice",
        specs: { cooldownTime: ["1-4 hours depending on ambient"], setpointRange: ["-20°F to 65°F"] },
        applicableProducts: REEFER_PRODUCTS,
        applicableTrailers: REEFER_TRAILERS,
        criticality: "required",
      },
      {
        id: "multi_temp_divider",
        categoryId: "reefer_equipment",
        name: "Multi-Temperature Divider Wall",
        description: "Movable insulated bulkhead dividing trailer into 2-3 temp zones for mixed loads",
        specs: { zones: ["2", "3"], type: ["insulated_bulkhead", "curtain"] },
        applicableProducts: REEFER_PRODUCTS,
        applicableTrailers: ["multi_temp"],
        criticality: "optional",
      },
      {
        id: "temp_blankets",
        categoryId: "reefer_equipment",
        name: "Thermal Blankets / Quilts",
        description: "Insulating blankets for protecting temp-sensitive freight in dry vans during mild weather",
        specs: { rValue: ["R-5", "R-8"], size: ["pallet_size", "full_trailer"] },
        applicableProducts: ["food_beverage_dry", "pharmaceuticals", "beverages_cold"],
        applicableTrailers: [...DRY_VAN_TRAILERS, ...REEFER_TRAILERS],
        criticality: "recommended",
      },
      {
        id: "reefer_alarm",
        categoryId: "reefer_equipment",
        name: "Temperature Alarm System",
        description: "Audible/visual alarm when reefer temp deviates from setpoint beyond threshold",
        specs: { threshold: ["±5°F", "±3°F"], alertType: ["audible", "visual", "telematics"] },
        applicableProducts: REEFER_PRODUCTS,
        applicableTrailers: REEFER_TRAILERS,
        criticality: "recommended",
      },
    ],
  },

  // ─── FLATBED-SPECIFIC EQUIPMENT ───────────────────────────────────────────
  {
    id: "flatbed_equipment",
    name: "Flatbed Equipment",
    icon: "Maximize",
    description: "Headache rack, stake pockets, rub rails, pipe stakes, lumber bunks",
    items: [
      {
        id: "headache_rack",
        categoryId: "flatbed_equipment",
        name: "Headache Rack / Cab Guard",
        description: "Steel rack behind cab protecting driver from forward-shifting cargo",
        specs: { type: ["full_width", "half_width"], material: ["steel", "aluminum"] },
        applicableProducts: [...FLATBED_PRODUCTS, ...HEAVY_PRODUCTS],
        applicableTrailers: [...FLATBED_TRAILERS, ...STEP_DECK_TRAILERS],
        criticality: "required",
      },
      {
        id: "pipe_stakes",
        categoryId: "flatbed_equipment",
        name: "Pipe Stakes / Bolsters",
        description: "Vertical stakes inserted into stake pockets for containing pipe, rebar, or bundled materials",
        specs: { height: ["4ft", "5ft", "6ft"], material: ["steel"] },
        applicableProducts: ["pipe_tubing", "lumber", "steel_coils", "roofing"],
        applicableTrailers: FLATBED_TRAILERS,
        criticality: "recommended",
      },
      {
        id: "ramp_set",
        categoryId: "flatbed_equipment",
        name: "Loading Ramps",
        description: "Aluminum or steel ramps for driving equipment on/off step deck or flatbed",
        specs: { capacity: ["10,000 lbs", "20,000 lbs", "50,000 lbs"], length: ["8ft", "10ft", "12ft"] },
        applicableProducts: [...HEAVY_PRODUCTS, "machinery_small", "construction_equipment"],
        applicableTrailers: [...STEP_DECK_TRAILERS, ...LOWBOY_TRAILERS],
        criticality: "required",
      },
      {
        id: "wide_load_signs",
        categoryId: "flatbed_equipment",
        name: "Wide Load / Oversize Signs & Flags",
        description: "DOT-required oversize warning signs, red/orange flags, and banner",
        specs: { type: ["banner", "rigid_sign", "flags"], color: ["red", "orange"] },
        applicableProducts: HEAVY_PRODUCTS,
        applicableTrailers: [...FLATBED_TRAILERS, ...STEP_DECK_TRAILERS, ...LOWBOY_TRAILERS],
        criticality: "required",
      },
      {
        id: "amber_lights",
        categoryId: "flatbed_equipment",
        name: "Amber Warning Lights",
        description: "Rotating or LED amber warning lights for oversize loads — many states require",
        specs: { type: ["rotating_beacon", "LED_bar", "strobe"] },
        applicableProducts: HEAVY_PRODUCTS,
        applicableTrailers: [...LOWBOY_TRAILERS, ...STEP_DECK_TRAILERS],
        criticality: "recommended",
      },
      {
        id: "height_pole",
        categoryId: "flatbed_equipment",
        name: "Height Measuring Pole",
        description: "Telescoping pole to verify load height at bridges and underpasses",
        specs: { range: ["8ft-16ft"] },
        applicableProducts: HEAVY_PRODUCTS,
        applicableTrailers: [...FLATBED_TRAILERS, ...STEP_DECK_TRAILERS, ...LOWBOY_TRAILERS],
        criticality: "recommended",
      },
    ],
  },

  // ─── DRY VAN EQUIPMENT ────────────────────────────────────────────────────
  {
    id: "dry_van_equipment",
    name: "Dry Van Equipment",
    icon: "Box",
    description: "Pallet jacks, liftgates, dock plates, e-track, logistic posts, floor protection",
    items: [
      {
        id: "pallet_jack",
        categoryId: "dry_van_equipment",
        name: "Pallet Jack (Manual or Electric)",
        description: "Standard 5,500 lb capacity pallet jack for driver-assisted unloading",
        specs: { type: ["manual", "electric"], capacity: ["5,500 lbs", "6,000 lbs"], forkLength: ["48\"", "42\""] },
        applicableProducts: [...DRY_PRODUCTS, ...REEFER_PRODUCTS],
        applicableTrailers: [...DRY_VAN_TRAILERS, ...REEFER_TRAILERS],
        criticality: "recommended",
      },
      {
        id: "liftgate",
        categoryId: "dry_van_equipment",
        name: "Liftgate",
        description: "Hydraulic liftgate for ground-level delivery where no dock is available",
        specs: { type: ["rail_gate", "tuck_away", "column_lift"], capacity: ["2,500 lbs", "4,000 lbs", "5,500 lbs"] },
        applicableProducts: [...DRY_PRODUCTS, ...REEFER_PRODUCTS],
        applicableTrailers: [...DRY_VAN_TRAILERS, ...REEFER_TRAILERS],
        criticality: "optional",
      },
      {
        id: "e_track",
        categoryId: "dry_van_equipment",
        name: "E-Track / Logistic Track",
        description: "Horizontal or vertical tracking system on walls for strap attachment points",
        specs: { type: ["horizontal", "vertical", "L-track"], spacing: ["every 2ft", "every 4ft"] },
        applicableProducts: [...DRY_PRODUCTS, ...REEFER_PRODUCTS],
        applicableTrailers: [...DRY_VAN_TRAILERS, ...REEFER_TRAILERS],
        criticality: "recommended",
      },
      {
        id: "logistic_posts",
        categoryId: "dry_van_equipment",
        name: "Logistic Posts / Decking Beams",
        description: "Adjustable vertical posts creating a second cargo tier for lightweight freight",
        specs: { capacity: ["2,000 lbs/pair"], height: ["floor_to_ceiling"] },
        applicableProducts: ["general_freight", "retail_goods", "paper_packaging"],
        applicableTrailers: DRY_VAN_TRAILERS,
        criticality: "optional",
      },
      {
        id: "dock_plate",
        categoryId: "dry_van_equipment",
        name: "Dock Plate / Dock Board",
        description: "Portable ramp bridging gap between trailer and dock for forklift/pallet jack access",
        specs: { capacity: ["10,000 lbs", "15,000 lbs"], width: ["60\"", "72\""] },
        applicableProducts: [...DRY_PRODUCTS, ...REEFER_PRODUCTS],
        applicableTrailers: [...DRY_VAN_TRAILERS, ...REEFER_TRAILERS],
        criticality: "optional",
      },
      {
        id: "floor_protection",
        categoryId: "dry_van_equipment",
        name: "Floor Protection / Mats",
        description: "Rubber mats or plywood to protect trailer floor from heavy pallets or machinery",
        specs: { material: ["rubber", "plywood"], size: ["4x8 ft"] },
        applicableProducts: ["electronics", "furniture", "automotive_parts"],
        applicableTrailers: DRY_VAN_TRAILERS,
        criticality: "optional",
      },
      {
        id: "load_lock_straps",
        categoryId: "dry_van_equipment",
        name: "Interior Ratchet Straps",
        description: "Short ratchet straps for securing palletized freight to e-track inside trailer",
        specs: { length: ["10ft", "16ft"], wll: ["1,000 lbs", "2,000 lbs"] },
        applicableProducts: [...DRY_PRODUCTS, ...REEFER_PRODUCTS],
        applicableTrailers: [...DRY_VAN_TRAILERS, ...REEFER_TRAILERS],
        criticality: "required",
      },
    ],
  },

  // ─── HOPPER / PNEUMATIC / BULK EQUIPMENT ──────────────────────────────────
  {
    id: "hopper_equipment",
    name: "Hopper / Bulk Equipment",
    icon: "Container",
    description: "Blowers, discharge hoses, product gates, bin indicators, augers",
    items: [
      {
        id: "pneumatic_blower",
        categoryId: "hopper_equipment",
        name: "Pneumatic Blower",
        description: "PTO-driven or stand-alone blower for pneumatic offloading of dry bulk product",
        specs: { type: ["PTO_driven", "engine_driven"], cfm: ["800", "1,100", "1,600"], psi: ["15"] },
        applicableProducts: BULK_PRODUCTS,
        applicableTrailers: ["pneumatic"],
        criticality: "required",
      },
      {
        id: "discharge_hose_bulk",
        categoryId: "hopper_equipment",
        name: "Discharge Hose (4\" or 5\")",
        description: "Flexible rubber or urethane discharge hose for pneumatic offloading into silos",
        specs: { diameter: ["4\"", "5\""], length: ["25ft", "50ft", "100ft"], material: ["rubber", "urethane"] },
        applicableProducts: BULK_PRODUCTS,
        applicableTrailers: ["pneumatic"],
        criticality: "required",
      },
      {
        id: "hopper_gates",
        categoryId: "hopper_equipment",
        name: "Product Gates / Slide Gates",
        description: "Bottom discharge gates on hopper trailers — gravity unloading of granular products",
        specs: { type: ["slide_gate", "butterfly_valve"], size: ["8\"", "10\"", "12\""] },
        applicableProducts: ["grain", "feed", "sand_aggregate", "salt_bulk"],
        applicableTrailers: ["hopper", "end_dump", "belly_dump"],
        criticality: "required",
      },
      {
        id: "tarp_hopper",
        categoryId: "hopper_equipment",
        name: "Hopper Tarp System",
        description: "Roll tarp or manual tarp system to cover open-top hopper during transport",
        specs: { type: ["roll_tarp", "manual_tarp", "electric"], coverage: ["full_top"] },
        applicableProducts: BULK_PRODUCTS,
        applicableTrailers: ["hopper", "end_dump", "belly_dump"],
        criticality: "required",
      },
      {
        id: "silo_adapter",
        categoryId: "hopper_equipment",
        name: "Silo Adapter / Elbow Set",
        description: "Adapter set to connect discharge hose to various silo inlets (4\", 5\", 6\")",
        specs: { sizes: ["4\"", "5\"", "6\""], type: ["90° elbow", "45° elbow", "straight"] },
        applicableProducts: ["cement", "fly_ash", "flour", "sugar", "plastic_pellets"],
        applicableTrailers: ["pneumatic"],
        criticality: "recommended",
      },
      {
        id: "food_grade_liner",
        categoryId: "hopper_equipment",
        name: "Food-Grade Liner / Dedicated Tank",
        description: "FDA-approved liner or dedicated food-grade pneumatic trailer for edible bulk products",
        specs: { standard: ["FDA", "3A"], material: ["stainless_steel", "food_grade_liner"] },
        applicableProducts: ["flour", "sugar", "plastic_pellets", "salt_bulk"],
        applicableTrailers: ["pneumatic", "hopper"],
        criticality: "required",
      },
    ],
  },

  // ─── OVERSIZED / HEAVY HAUL EQUIPMENT ─────────────────────────────────────
  {
    id: "oversized_equipment",
    name: "Oversized / Heavy Haul",
    icon: "Truck",
    description: "Pilot cars, permits, jeeps/boosters, beam/stinger attachments",
    items: [
      {
        id: "pilot_car",
        categoryId: "oversized_equipment",
        name: "Pilot Car / Escort Vehicle",
        description: "Lead and/or chase escort vehicle required by most states for oversize loads",
        specs: { position: ["front", "rear", "both"], requiredAbove: ["12ft wide", "14ft tall"] },
        applicableProducts: HEAVY_PRODUCTS,
        applicableTrailers: [...LOWBOY_TRAILERS, ...STEP_DECK_TRAILERS],
        criticality: "required",
      },
      {
        id: "jeep_booster",
        categoryId: "oversized_equipment",
        name: "Jeep & Booster Axles",
        description: "Additional axle assemblies to distribute weight for overweight loads",
        specs: { type: ["jeep", "booster", "flip_axle"], capacity: ["20,000 lbs/axle"] },
        applicableProducts: ["heavy_machinery", "construction_equipment", "industrial_equipment"],
        applicableTrailers: LOWBOY_TRAILERS,
        criticality: "recommended",
      },
      {
        id: "beam_extensions",
        categoryId: "oversized_equipment",
        name: "Beam / Stinger Extensions",
        description: "Extendable trailer beams for long loads (pipe, turbine blades, structural steel)",
        specs: { extension: ["10ft", "20ft", "40ft"], type: ["telescoping", "removable"] },
        applicableProducts: ["pipe_tubing", "industrial_equipment"],
        applicableTrailers: [...FLATBED_TRAILERS, ...STEP_DECK_TRAILERS],
        criticality: "optional",
      },
      {
        id: "blocking_cribbing",
        categoryId: "oversized_equipment",
        name: "Blocking & Cribbing Set",
        description: "Heavy timber and steel cribbing for leveling and supporting irregular heavy equipment",
        specs: { material: ["oak", "steel"], includes: ["blocks", "wedges", "shims"] },
        applicableProducts: HEAVY_PRODUCTS,
        applicableTrailers: [...LOWBOY_TRAILERS, ...STEP_DECK_TRAILERS],
        criticality: "required",
      },
      {
        id: "rigging_shackles",
        categoryId: "oversized_equipment",
        name: "Rigging & Shackles",
        description: "D-ring shackles, clevises, and rigging hardware for securing heavy equipment",
        specs: { wll: ["8,000 lbs", "12,000 lbs", "25,000 lbs"], type: ["screw_pin", "bolt_type"] },
        applicableProducts: HEAVY_PRODUCTS,
        applicableTrailers: [...LOWBOY_TRAILERS, ...STEP_DECK_TRAILERS, ...FLATBED_TRAILERS],
        criticality: "required",
      },
    ],
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRODUCT → EQUIPMENT REQUIREMENTS MATRIX
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ProductProfile {
  productId: string;
  name: string;
  category: string;
  requiredEquipment: string[];       // equipment IDs always required
  recommendedEquipment: string[];    // equipment IDs recommended
  requiredCertifications: string[];
  typicalTrailers: string[];
  siteConditions: string[];          // typical site infrastructure IDs
  notes: string;
}

export const PRODUCT_PROFILES: ProductProfile[] = [
  {
    productId: "crude_oil",
    name: "Crude Oil",
    category: "petroleum",
    requiredEquipment: ["hose_3in", "camlock_fittings", "hammer_union", "pto_pump", "grounding_reel", "fire_extinguisher", "spill_kit", "h2s_monitor", "ppe_fr", "ppe_hardhat", "ppe_steel_toes", "ppe_safety_glasses", "ppe_gloves", "pressure_vacuum_vent"],
    recommendedEquipment: ["hose_4in", "vapor_hose", "vapor_recovery_unit", "reducer_adapters", "strainer", "gauge_tape", "thermometer", "sample_kit", "manifold_system"],
    requiredCertifications: ["cert_hazmat", "cert_tanker", "cert_h2s", "cert_pec_safeland"],
    typicalTrailers: ["liquid_tank", "mc407", "dot407"],
    siteConditions: ["lact_unit", "tank_battery", "pump_off_unit", "site_vapor_recovery"],
    notes: "Crude hauling is the most equipment-intensive. Drivers must carry hoses (3\" or 4\" depending on site), PTO pump, H2S monitor, full PPE. Ask about LACT availability — if no LACT, driver must gauge tanks manually.",
  },
  {
    productId: "refined_fuel",
    name: "Refined Fuel (Gasoline/Diesel/Jet)",
    category: "petroleum",
    requiredEquipment: ["camlock_fittings", "api_coupling", "bottom_loading_adapter", "grounding_reel", "fire_extinguisher", "spill_kit", "ppe_fr", "ppe_safety_glasses", "pressure_vacuum_vent"],
    recommendedEquipment: ["hose_3in", "vapor_hose", "vapor_recovery_unit", "dry_break_coupling", "air_eliminator", "manifold_system"],
    requiredCertifications: ["cert_hazmat", "cert_tanker"],
    typicalTrailers: ["liquid_tank", "mc306", "dot407"],
    siteConditions: ["loading_rack", "site_vapor_recovery", "scale_onsite"],
    notes: "Rack loading at terminals uses API bottom-loading adapters. Multi-compartment trailers for multi-product loads. Vapor recovery often required by regulation.",
  },
  {
    productId: "lpg",
    name: "LPG / Propane / Butane",
    category: "gas",
    requiredEquipment: ["lpg_hose", "acme_fitting", "grounding_reel", "fire_extinguisher", "spill_kit", "ppe_fr", "ppe_safety_glasses", "pressure_vacuum_vent"],
    recommendedEquipment: ["air_compressor"],
    requiredCertifications: ["cert_hazmat", "cert_tanker"],
    typicalTrailers: ["mc331", "gas_tank"],
    siteConditions: ["loading_rack", "scale_onsite"],
    notes: "Pressurized product — requires MC-331 pressure vessel. ACME fittings standard. No hoses like crude — uses rigid piping and flex connectors.",
  },
  {
    productId: "chemicals",
    name: "Industrial Chemicals",
    category: "chemical",
    requiredEquipment: ["chemical_hose", "camlock_fittings", "dry_break_coupling", "grounding_reel", "fire_extinguisher", "spill_kit", "ppe_fr", "ppe_gloves", "ppe_safety_glasses", "pressure_vacuum_vent"],
    recommendedEquipment: ["internal_pump", "internal_coating"],
    requiredCertifications: ["cert_hazmat", "cert_tanker"],
    typicalTrailers: ["mc312", "dot412", "liquid_tank"],
    siteConditions: ["loading_rack", "scale_onsite"],
    notes: "Chemical compatibility is critical. Verify hose material and tank lining match the specific chemical. PTFE-lined hoses for corrosives. Dedicated tanks — no cross-contamination.",
  },
  {
    productId: "condensate",
    name: "Condensate / NGL",
    category: "petroleum",
    requiredEquipment: ["hose_3in", "camlock_fittings", "hammer_union", "pto_pump", "grounding_reel", "fire_extinguisher", "spill_kit", "h2s_monitor", "ppe_fr", "ppe_hardhat", "ppe_steel_toes", "pressure_vacuum_vent"],
    recommendedEquipment: ["vapor_hose", "vapor_recovery_unit", "gauge_tape", "thermometer"],
    requiredCertifications: ["cert_hazmat", "cert_tanker", "cert_h2s", "cert_pec_safeland"],
    typicalTrailers: ["liquid_tank", "mc407", "dot407"],
    siteConditions: ["lact_unit", "tank_battery", "site_vapor_recovery"],
    notes: "Very volatile — high vapor pressure. Flash point extremely low. Extra caution with vapor management. Similar equipment to crude but higher safety requirements.",
  },
  {
    productId: "produced_water",
    name: "Produced Water / Saltwater",
    category: "oilfield",
    requiredEquipment: ["hose_3in", "camlock_fittings", "pto_pump", "fire_extinguisher", "spill_kit", "ppe_fr", "ppe_steel_toes", "h2s_monitor"],
    recommendedEquipment: ["hose_2in", "strainer", "gauge_tape"],
    requiredCertifications: ["cert_tanker", "cert_h2s", "cert_pec_safeland"],
    typicalTrailers: ["liquid_tank"],
    siteConditions: ["tank_battery"],
    notes: "Non-hazmat in most cases but contains H2S risk. Disposal wells (SWD) are the typical delivery point. Less equipment-intensive than crude.",
  },
  {
    productId: "asphalt",
    name: "Asphalt / Bitumen",
    category: "petroleum",
    requiredEquipment: ["hose_3in", "camlock_fittings", "pto_pump", "grounding_reel", "fire_extinguisher", "spill_kit", "ppe_fr", "ppe_gloves", "heating_coils", "insulation"],
    recommendedEquipment: ["thermometer"],
    requiredCertifications: ["cert_hazmat", "cert_tanker"],
    typicalTrailers: ["liquid_tank"],
    siteConditions: ["loading_rack", "scale_onsite"],
    notes: "Must maintain temperature 275-350°F. Heating coils required. Insulated trailer mandatory. Product solidifies if it cools.",
  },
  {
    productId: "ethanol",
    name: "Ethanol / Biodiesel",
    category: "renewable",
    requiredEquipment: ["camlock_fittings", "api_coupling", "bottom_loading_adapter", "grounding_reel", "fire_extinguisher", "spill_kit", "ppe_fr", "pressure_vacuum_vent"],
    recommendedEquipment: ["dry_break_coupling", "vapor_hose", "vapor_recovery_unit"],
    requiredCertifications: ["cert_hazmat", "cert_tanker"],
    typicalTrailers: ["liquid_tank", "mc306", "dot407"],
    siteConditions: ["loading_rack", "site_vapor_recovery"],
    notes: "Food-grade tank may be required for fuel-grade ethanol. Similar to refined fuel operations but dedicated tank — no cross-contamination with petroleum.",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DRY VAN PRODUCTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    productId: "general_freight",
    name: "General Freight (Palletized)",
    category: "dry_van",
    requiredEquipment: ["load_bars", "load_lock_straps", "fire_extinguisher"],
    recommendedEquipment: ["pallet_jack", "e_track", "liftgate", "dock_plate", "logistic_posts"],
    requiredCertifications: [],
    typicalTrailers: DRY_VAN_TRAILERS,
    siteConditions: ["scale_onsite"],
    notes: "Standard palletized freight. Load bars every 4-6ft of stacked cargo. E-track recommended for partial loads. Liftgate if delivering to locations without a dock.",
  },
  {
    productId: "electronics",
    name: "Electronics / High-Value",
    category: "dry_van",
    requiredEquipment: ["load_bars", "load_lock_straps", "e_track", "floor_protection", "fire_extinguisher"],
    recommendedEquipment: ["pallet_jack", "cargo_net", "liftgate", "temp_blankets"],
    requiredCertifications: [],
    typicalTrailers: DRY_VAN_TRAILERS,
    siteConditions: ["scale_onsite"],
    notes: "High-value cargo — trailer must be clean, dry, and odor-free. Floor protection prevents pallet damage. Extra securing to prevent shift. Seal integrity critical for insurance claims.",
  },
  {
    productId: "furniture",
    name: "Furniture / Household Goods",
    category: "dry_van",
    requiredEquipment: ["load_bars", "load_lock_straps", "e_track", "fire_extinguisher"],
    recommendedEquipment: ["pallet_jack", "liftgate", "floor_protection", "cargo_net"],
    requiredCertifications: [],
    typicalTrailers: DRY_VAN_TRAILERS,
    siteConditions: [],
    notes: "Blanket-wrap or pad-wrap for protection. Liftgate essential for residential deliveries. Inside delivery may require two-person team.",
  },
  {
    productId: "food_beverage_dry",
    name: "Food & Beverage (Dry / Ambient)",
    category: "dry_van",
    requiredEquipment: ["load_bars", "load_lock_straps", "fire_extinguisher"],
    recommendedEquipment: ["pallet_jack", "e_track", "temp_blankets"],
    requiredCertifications: ["cert_food_safety"],
    typicalTrailers: DRY_VAN_TRAILERS,
    siteConditions: ["scale_onsite"],
    notes: "FSMA Sanitary Transportation Rule applies. Trailer must be clean, dry, free of residue, pest-free. No previous hazmat loads without documented washout. Temperature monitoring recommended in summer.",
  },
  {
    productId: "retail_goods",
    name: "Retail / Consumer Goods",
    category: "dry_van",
    requiredEquipment: ["load_bars", "load_lock_straps", "fire_extinguisher"],
    recommendedEquipment: ["pallet_jack", "e_track", "liftgate"],
    requiredCertifications: [],
    typicalTrailers: DRY_VAN_TRAILERS,
    siteConditions: [],
    notes: "Multi-stop deliveries common. Pallet jack essential for driver-unload stops. Load bars critical between stops to prevent shift as trailer empties.",
  },
  {
    productId: "automotive_parts",
    name: "Automotive Parts",
    category: "dry_van",
    requiredEquipment: ["load_bars", "load_lock_straps", "e_track", "fire_extinguisher"],
    recommendedEquipment: ["pallet_jack", "floor_protection", "liftgate"],
    requiredCertifications: [],
    typicalTrailers: DRY_VAN_TRAILERS,
    siteConditions: ["scale_onsite"],
    notes: "JIT (Just-In-Time) delivery critical for auto plants. Floor protection for heavy engine/transmission pallets. Appointment windows strict.",
  },
  {
    productId: "paper_packaging",
    name: "Paper / Packaging Materials",
    category: "dry_van",
    requiredEquipment: ["load_bars", "load_lock_straps", "fire_extinguisher"],
    recommendedEquipment: ["pallet_jack", "logistic_posts"],
    requiredCertifications: [],
    typicalTrailers: DRY_VAN_TRAILERS,
    siteConditions: [],
    notes: "Lightweight but high-cube — often fills trailer by volume before weight limit. Logistic posts allow double-stacking lighter rolls. Keep dry — moisture damage claims common.",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // REFRIGERATED / REEFER PRODUCTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    productId: "produce",
    name: "Fresh Produce (Fruits & Vegetables)",
    category: "refrigerated",
    requiredEquipment: ["temp_recorder", "reefer_fuel", "pre_cool", "load_bars", "load_lock_straps", "fire_extinguisher"],
    recommendedEquipment: ["reefer_alarm", "pallet_jack", "e_track"],
    requiredCertifications: ["cert_food_safety"],
    typicalTrailers: REEFER_TRAILERS,
    siteConditions: ["scale_onsite"],
    notes: "Pre-cool trailer to 34-40°F before loading. Continuous airflow critical — do not block front wall. Pulp temperature on loading doc. Top-ice for some items. USDA inspection possible at destination.",
  },
  {
    productId: "frozen_food",
    name: "Frozen Foods",
    category: "refrigerated",
    requiredEquipment: ["temp_recorder", "reefer_fuel", "pre_cool", "load_bars", "load_lock_straps", "fire_extinguisher"],
    recommendedEquipment: ["reefer_alarm", "pallet_jack", "e_track"],
    requiredCertifications: ["cert_food_safety"],
    typicalTrailers: REEFER_TRAILERS,
    siteConditions: ["scale_onsite"],
    notes: "Pre-cool to -10°F to 0°F. Zero tolerance for temp abuse — product above 0°F at delivery is rejected. Keep doors closed during stops. Fuel reefer unit before long weekends.",
  },
  {
    productId: "dairy",
    name: "Dairy Products",
    category: "refrigerated",
    requiredEquipment: ["temp_recorder", "reefer_fuel", "pre_cool", "load_bars", "load_lock_straps", "fire_extinguisher"],
    recommendedEquipment: ["reefer_alarm", "pallet_jack", "multi_temp_divider"],
    requiredCertifications: ["cert_food_safety"],
    typicalTrailers: REEFER_TRAILERS,
    siteConditions: ["scale_onsite"],
    notes: "34-38°F for fluid milk, 0°F for ice cream. Multi-temp needed for mixed dairy loads. Grade A PMO regulations apply. Trailer must be clean and odor-free.",
  },
  {
    productId: "meat_seafood",
    name: "Meat & Seafood",
    category: "refrigerated",
    requiredEquipment: ["temp_recorder", "reefer_fuel", "pre_cool", "load_bars", "load_lock_straps", "fire_extinguisher"],
    recommendedEquipment: ["reefer_alarm", "pallet_jack"],
    requiredCertifications: ["cert_food_safety"],
    typicalTrailers: REEFER_TRAILERS,
    siteConditions: ["scale_onsite"],
    notes: "Fresh meat 28-32°F, frozen -10°F. USDA seal required for interstate transport. Do not break cold chain. Trailer must be sanitized between loads. Blood/drip contamination requires immediate washout.",
  },
  {
    productId: "pharmaceuticals",
    name: "Pharmaceuticals / Biotech",
    category: "refrigerated",
    requiredEquipment: ["temp_recorder", "reefer_fuel", "pre_cool", "reefer_alarm", "load_bars", "load_lock_straps", "fire_extinguisher"],
    recommendedEquipment: ["temp_blankets", "pallet_jack"],
    requiredCertifications: ["cert_pharma_gdp", "cert_food_safety"],
    typicalTrailers: REEFER_TRAILERS,
    siteConditions: [],
    notes: "Strict 2-8°C (36-46°F) for most pharma. Chain of custody documentation required. GDP-certified carrier. Dual redundant temp monitoring. High-value — insurance/bond may be required. Zero tolerance for excursions.",
  },
  {
    productId: "floral",
    name: "Floral / Live Plants",
    category: "refrigerated",
    requiredEquipment: ["temp_recorder", "reefer_fuel", "pre_cool", "fire_extinguisher"],
    recommendedEquipment: ["reefer_alarm", "pallet_jack"],
    requiredCertifications: [],
    typicalTrailers: REEFER_TRAILERS,
    siteConditions: [],
    notes: "34-50°F depending on species. Ethylene-sensitive — do not mix with produce. Upright transport required. USDA phytosanitary certificate for interstate.",
  },
  {
    productId: "beverages_cold",
    name: "Beverages (Cold Chain)",
    category: "refrigerated",
    requiredEquipment: ["temp_recorder", "reefer_fuel", "pre_cool", "load_bars", "load_lock_straps", "fire_extinguisher"],
    recommendedEquipment: ["pallet_jack", "liftgate", "e_track"],
    requiredCertifications: ["cert_food_safety"],
    typicalTrailers: REEFER_TRAILERS,
    siteConditions: ["scale_onsite"],
    notes: "33-38°F for beer/wine, varies for juices. Very heavy — watch weight limits. Multi-stop common for beverage distribution. Pallet jack and liftgate for bar/restaurant deliveries.",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FLATBED PRODUCTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    productId: "steel_coils",
    name: "Steel Coils",
    category: "flatbed",
    requiredEquipment: ["chain_binders", "coil_racks", "edge_protectors", "dunnage", "headache_rack", "tarps", "fire_extinguisher"],
    recommendedEquipment: ["winch_straps", "ratchet_straps"],
    requiredCertifications: [],
    typicalTrailers: FLATBED_TRAILERS,
    siteConditions: ["scale_onsite"],
    notes: "FMCSA §393.120 requires coils in cradles/racks with minimum one chain per coil. Eye-to-sky, eye-to-side, or eye-to-rear orientation matters. 4x4 dunnage under coils. Steel tarps required.",
  },
  {
    productId: "lumber",
    name: "Lumber / Timber",
    category: "flatbed",
    requiredEquipment: ["ratchet_straps", "winch_straps", "edge_protectors", "headache_rack", "tarps", "fire_extinguisher"],
    recommendedEquipment: ["pipe_stakes", "dunnage"],
    requiredCertifications: [],
    typicalTrailers: FLATBED_TRAILERS,
    siteConditions: ["scale_onsite"],
    notes: "FMCSA §393.116 requires minimum 2 tiedowns for <10ft, 1 additional per 10ft. Lumber tarps (7ft drop). Stakes/bolsters for bundled lumber. Watch for weight — green lumber is very heavy.",
  },
  {
    productId: "building_materials_flat",
    name: "Building Materials (Flatbed)",
    category: "flatbed",
    requiredEquipment: ["ratchet_straps", "winch_straps", "edge_protectors", "tarps", "headache_rack", "fire_extinguisher"],
    recommendedEquipment: ["dunnage", "pipe_stakes"],
    requiredCertifications: [],
    typicalTrailers: FLATBED_TRAILERS,
    siteConditions: ["scale_onsite"],
    notes: "Includes drywall, roofing, siding, brick, pavers, block. Must protect from weather with tarps. Dunnage critical for stacking. Weight distribution matters — center heavy items over axles.",
  },
  {
    productId: "pipe_tubing",
    name: "Pipe & Tubing",
    category: "flatbed",
    requiredEquipment: ["chain_binders", "ratchet_straps", "pipe_stakes", "headache_rack", "dunnage", "fire_extinguisher"],
    recommendedEquipment: ["edge_protectors", "beam_extensions", "tarps"],
    requiredCertifications: [],
    typicalTrailers: [...FLATBED_TRAILERS, ...STEP_DECK_TRAILERS],
    siteConditions: ["scale_onsite"],
    notes: "FMCSA §393.118 — pipe/tubing requires blocking at front and rear. Stakes mandatory. Chains for heavy pipe, straps for lighter bundles. Long pipe may require oversize permits.",
  },
  {
    productId: "machinery_small",
    name: "Machinery (Under 48,000 lbs)",
    category: "flatbed",
    requiredEquipment: ["chain_binders", "ratchet_straps", "headache_rack", "dunnage", "fire_extinguisher"],
    recommendedEquipment: ["ramp_set", "tarps", "edge_protectors", "blocking_cribbing"],
    requiredCertifications: [],
    typicalTrailers: [...FLATBED_TRAILERS, ...STEP_DECK_TRAILERS],
    siteConditions: ["scale_onsite"],
    notes: "Chain down through lift points or tie-down points. Block wheels of tracked/wheeled equipment. Disconnect batteries. Secure all loose components. Smoke tarp for larger machinery.",
  },
  {
    productId: "concrete_products",
    name: "Concrete Products (Block / Pipe / Barrier)",
    category: "flatbed",
    requiredEquipment: ["chain_binders", "ratchet_straps", "headache_rack", "dunnage", "fire_extinguisher"],
    recommendedEquipment: ["edge_protectors", "pipe_stakes"],
    requiredCertifications: [],
    typicalTrailers: FLATBED_TRAILERS,
    siteConditions: ["scale_onsite"],
    notes: "Very heavy per unit — weight limit is the constraint, not volume. Dunnage between layers. Jersey barriers require chains. Concrete pipe uses cradles or dunnage with chains.",
  },
  {
    productId: "roofing",
    name: "Roofing Materials (Shingles / Metal)",
    category: "flatbed",
    requiredEquipment: ["ratchet_straps", "winch_straps", "tarps", "headache_rack", "fire_extinguisher"],
    recommendedEquipment: ["edge_protectors", "pipe_stakes", "dunnage"],
    requiredCertifications: [],
    typicalTrailers: FLATBED_TRAILERS,
    siteConditions: [],
    notes: "Shingle bundles are extremely heavy — 80 lbs each, max 42,000 lbs per load. Metal roofing panels need tarps and edge protection to prevent scratching. Jobsite delivery — usually forklift or crane unload.",
  },
  {
    productId: "solar_panels",
    name: "Solar Panels / Racking",
    category: "flatbed",
    requiredEquipment: ["ratchet_straps", "edge_protectors", "tarps", "headache_rack", "fire_extinguisher"],
    recommendedEquipment: ["dunnage", "cargo_net", "floor_protection"],
    requiredCertifications: [],
    typicalTrailers: [...FLATBED_TRAILERS, ...DRY_VAN_TRAILERS],
    siteConditions: [],
    notes: "Extremely fragile — micro-cracks from vibration reduce panel output. Edge protectors mandatory. No stacking without manufacturer approval. Keep dry. Handle with care.",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HEAVY HAUL / OVERSIZED PRODUCTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    productId: "heavy_machinery",
    name: "Heavy Machinery (Over 48,000 lbs)",
    category: "oversized",
    requiredEquipment: ["chain_binders", "rigging_shackles", "blocking_cribbing", "wide_load_signs", "pilot_car", "headache_rack", "fire_extinguisher"],
    recommendedEquipment: ["jeep_booster", "amber_lights", "height_pole", "ramp_set"],
    requiredCertifications: ["cert_oversize_permit"],
    typicalTrailers: [...LOWBOY_TRAILERS, ...STEP_DECK_TRAILERS],
    siteConditions: ["scale_onsite"],
    notes: "Oversize/overweight permits required per state. Pilot cars front and rear for wide/tall loads. Route survey for bridge clearance and overhead obstacles. Night/weekend travel often mandated.",
  },
  {
    productId: "construction_equipment",
    name: "Construction Equipment (Excavators / Dozers)",
    category: "oversized",
    requiredEquipment: ["chain_binders", "rigging_shackles", "blocking_cribbing", "ramp_set", "wide_load_signs", "headache_rack", "fire_extinguisher"],
    recommendedEquipment: ["pilot_car", "amber_lights", "jeep_booster", "height_pole"],
    requiredCertifications: ["cert_oversize_permit"],
    typicalTrailers: LOWBOY_TRAILERS,
    siteConditions: ["scale_onsite"],
    notes: "Drive-on loading via ramps (RGN detachable gooseneck). Turret locked and boom lowered. Bucket/blade on deck. Chains through lift points. Track machines — chain through track shoes.",
  },
  {
    productId: "industrial_equipment",
    name: "Industrial Equipment (Transformers / Generators)",
    category: "oversized",
    requiredEquipment: ["chain_binders", "rigging_shackles", "blocking_cribbing", "wide_load_signs", "fire_extinguisher"],
    recommendedEquipment: ["pilot_car", "amber_lights", "jeep_booster", "beam_extensions", "height_pole"],
    requiredCertifications: ["cert_oversize_permit"],
    typicalTrailers: [...LOWBOY_TRAILERS, ...STEP_DECK_TRAILERS],
    siteConditions: ["scale_onsite"],
    notes: "Often crane-loaded. Precise blocking and cribbing to distribute load. Transformers may require oil-filled transport orientation. Vibration monitoring for sensitive equipment.",
  },
  {
    productId: "oilfield_equipment",
    name: "Oilfield Equipment (Pumps / Tanks / Separators)",
    category: "oversized",
    requiredEquipment: ["chain_binders", "rigging_shackles", "blocking_cribbing", "wide_load_signs", "headache_rack", "fire_extinguisher", "ppe_fr", "ppe_hardhat", "ppe_steel_toes"],
    recommendedEquipment: ["pilot_car", "amber_lights", "h2s_monitor", "ramp_set"],
    requiredCertifications: ["cert_oversize_permit", "cert_pec_safeland"],
    typicalTrailers: [...LOWBOY_TRAILERS, ...STEP_DECK_TRAILERS, ...FLATBED_TRAILERS],
    siteConditions: ["scale_onsite"],
    notes: "PEC SafeLand required for oilfield site access. FR clothing and steel toes mandatory. H2S monitor if going to active well sites. Residual hydrocarbon in used equipment — treat as hazmat if contaminated.",
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HOPPER / PNEUMATIC / BULK PRODUCTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    productId: "grain",
    name: "Grain (Corn / Wheat / Soybeans)",
    category: "bulk",
    requiredEquipment: ["hopper_gates", "tarp_hopper", "fire_extinguisher"],
    recommendedEquipment: ["pneumatic_blower", "discharge_hose_bulk"],
    requiredCertifications: ["cert_food_safety"],
    typicalTrailers: ["hopper", "end_dump"],
    siteConditions: ["scale_onsite"],
    notes: "Gravity unload at elevators. Tarp required to prevent contamination and spillage. Weight limits critical — grain is dense. FSMA applies. Trailer must be clean and dry — no chemical residue.",
  },
  {
    productId: "feed",
    name: "Animal Feed / Distillers Grain",
    category: "bulk",
    requiredEquipment: ["hopper_gates", "tarp_hopper", "fire_extinguisher"],
    recommendedEquipment: ["pneumatic_blower", "discharge_hose_bulk"],
    requiredCertifications: ["cert_food_safety"],
    typicalTrailers: ["hopper", "end_dump", "pneumatic"],
    siteConditions: ["scale_onsite"],
    notes: "FSMA Sanitary Transportation applies to animal feed too. Dedicated trailer preferred — no cross-contamination from chemicals. Wet distillers grain very heavy.",
  },
  {
    productId: "sand_aggregate",
    name: "Sand / Aggregate / Gravel",
    category: "bulk",
    requiredEquipment: ["hopper_gates", "tarp_hopper", "fire_extinguisher"],
    recommendedEquipment: [],
    requiredCertifications: ["cert_msha"],
    typicalTrailers: ["end_dump", "belly_dump", "hopper"],
    siteConditions: ["scale_onsite"],
    notes: "End dump or belly dump preferred. MSHA certification may be required at quarry/mine sites. Extremely heavy — stay under 80,000 GVW or get overweight permits. Cover load with tarp.",
  },
  {
    productId: "cement",
    name: "Cement / Fly Ash",
    category: "bulk",
    requiredEquipment: ["pneumatic_blower", "discharge_hose_bulk", "silo_adapter", "tarp_hopper", "fire_extinguisher"],
    recommendedEquipment: [],
    requiredCertifications: ["cert_msha"],
    typicalTrailers: ["pneumatic"],
    siteConditions: ["scale_onsite"],
    notes: "Pneumatic trailer only — blower offloads into silos. Silo adapter set essential (4\", 5\", 6\" fittings vary by site). Keep dry — wet cement sets in the trailer. Very dense — watch weight.",
  },
  {
    productId: "flour",
    name: "Flour / Sugar / Food-Grade Bulk",
    category: "bulk",
    requiredEquipment: ["pneumatic_blower", "discharge_hose_bulk", "food_grade_liner", "silo_adapter", "fire_extinguisher"],
    recommendedEquipment: ["tarp_hopper"],
    requiredCertifications: ["cert_food_safety"],
    typicalTrailers: ["pneumatic"],
    siteConditions: ["scale_onsite"],
    notes: "FDA food-grade trailer or liner required. Dedicated tank — no prior chemical or non-food product loads. Washout certificate between loads. FSMA applies. Blower offload into food-grade silos.",
  },
  {
    productId: "plastic_pellets",
    name: "Plastic Pellets / Resin",
    category: "bulk",
    requiredEquipment: ["pneumatic_blower", "discharge_hose_bulk", "food_grade_liner", "silo_adapter", "fire_extinguisher"],
    recommendedEquipment: ["tarp_hopper"],
    requiredCertifications: [],
    typicalTrailers: ["pneumatic", "hopper"],
    siteConditions: ["scale_onsite"],
    notes: "Clean trailer essential — contamination rejected immediately. Operation Clean Sweep compliance (zero pellet loss). Dedicated or food-grade liner for virgin resin. Pneumatic blower offload.",
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MATCH SCORING ENGINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function findEquipmentItem(id: string): EquipmentItem | undefined {
  for (const cat of EQUIPMENT_CATALOG) {
    const found = cat.items.find(i => i.id === id);
    if (found) return found;
  }
  return undefined;
}

/**
 * Score how well a carrier's equipment profile matches a load's requirements.
 * Returns 0-100 with detailed matched/gap breakdown.
 */
export function scoreEquipmentMatch(
  profile: EquipmentProfile,
  requirements: LoadEquipmentRequirements
): EquipmentMatchResult {
  const matched: MatchDetail[] = [];
  const gaps: GapDetail[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  const profileMap = new Map(profile.items.map(i => [i.equipmentId, i]));

  let totalWeight = 0;
  let earnedWeight = 0;

  for (const req of requirements.requirements) {
    const weight = req.required ? 10 : 3;
    totalWeight += weight;

    const item = findEquipmentItem(req.equipmentId);
    const carrierItem = profileMap.get(req.equipmentId);
    const name = item?.name || req.equipmentId;

    if (carrierItem?.available) {
      // Check spec compatibility
      let specMatch = true;
      let carrierSpecStr = "";
      let requiredSpecStr = "";

      if (req.minSpec && carrierItem.specs) {
        for (const [key, minVal] of Object.entries(req.minSpec)) {
          const carrierVal = carrierItem.specs[key];
          requiredSpecStr += `${key}: ${minVal} `;
          carrierSpecStr += `${key}: ${carrierVal || "N/A"} `;
          if (!carrierVal) {
            specMatch = false;
          }
        }
      }

      if (specMatch) {
        earnedWeight += weight;
        matched.push({
          equipmentId: req.equipmentId,
          equipmentName: name,
          status: "met",
          carrierSpec: carrierSpecStr.trim() || undefined,
          requiredSpec: requiredSpecStr.trim() || undefined,
        });
      } else {
        earnedWeight += weight * 0.5;
        matched.push({
          equipmentId: req.equipmentId,
          equipmentName: name,
          status: "partial",
          carrierSpec: carrierSpecStr.trim(),
          requiredSpec: requiredSpecStr.trim(),
        });
        warnings.push(`${name}: carrier has it but specs may not match (${carrierSpecStr.trim()} vs required ${requiredSpecStr.trim()})`);
      }
    } else {
      gaps.push({
        equipmentId: req.equipmentId,
        equipmentName: name,
        severity: req.required ? "critical" : "warning",
        description: req.required ? `Missing required: ${name}` : `Missing recommended: ${name}`,
        suggestion: item ? `Acquire ${name} — ${item.description}` : undefined,
      });
    }
  }

  // Check certifications
  for (const req of requirements.requirements) {
    if (req.equipmentId.startsWith("cert_")) {
      const hasCert = profile.certifications.includes(req.equipmentId);
      if (!hasCert && !profileMap.get(req.equipmentId)?.available) {
        const item = findEquipmentItem(req.equipmentId);
        if (item && !gaps.find(g => g.equipmentId === req.equipmentId)) {
          gaps.push({
            equipmentId: req.equipmentId,
            equipmentName: item.name,
            severity: "critical",
            description: `Missing certification: ${item.name}`,
            suggestion: `Obtain ${item.name} before accepting this load`,
          });
          totalWeight += 10;
        }
      }
    }
  }

  const overallScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 100;
  const criticalGaps = gaps.filter(g => g.severity === "critical").length;
  const readiness: EquipmentMatchResult["readiness"] =
    criticalGaps === 0 && overallScore >= 80 ? "ready"
    : criticalGaps === 0 ? "partial"
    : "not_ready";

  if (criticalGaps > 0) {
    recommendations.push(`${criticalGaps} critical equipment gap(s) must be resolved before accepting this load.`);
  }
  if (gaps.filter(g => g.severity === "warning").length > 0) {
    recommendations.push("Consider adding recommended equipment for a smoother operation.");
  }

  return { overallScore, readiness, matched, gaps, warnings, recommendations };
}

/**
 * Given a product type and trailer type, auto-generate the default equipment requirements.
 */
export function getDefaultRequirements(productType: string, trailerType?: string): LoadEquipmentRequirements {
  const profile = PRODUCT_PROFILES.find(p => p.productId === productType);
  if (!profile) {
    return { requirements: [], siteConditions: [] };
  }

  const requirements: EquipmentRequirement[] = [
    ...profile.requiredEquipment.map(id => ({
      equipmentId: id,
      required: true,
    })),
    ...profile.recommendedEquipment.map(id => ({
      equipmentId: id,
      required: false,
    })),
    ...profile.requiredCertifications.map(id => ({
      equipmentId: id,
      required: true,
    })),
  ];

  const siteConditions: SiteCondition[] = profile.siteConditions.map(id => {
    const item = findEquipmentItem(id);
    return {
      conditionId: id,
      label: item?.name || id,
      value: false,  // shipper fills these in
    };
  });

  return { requirements, siteConditions, productNotes: profile.notes };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ESANG AI EQUIPMENT ADVISOR (Gemini 2.5 Flash)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ZEUN_SYSTEM_PROMPT = `You are ESANG AI ZEUN Mechanics — an expert equipment intelligence system for ALL trucking modes. You operate within the EusoTrip platform.

Your expertise covers every trailer type and product type in the trucking industry:

TANKER / LIQUID:
- Crude oil: hoses (2", 3", 4"), PTO pumps, cam-lock fittings, hammer unions, vapor recovery, H2S monitors
- Well site ops: LACT units, tank batteries, pump-off units, gauging, sampling
- Terminal rack loading: API 1004 bottom-loading, manifolds, vapor balancing, multi-compartment
- LPG/NGL: MC-331 pressure vessels, ACME fittings, pressurized transfer
- Chemicals: PTFE-lined hoses, dedicated tanks, dry-break couplings, compatibility
- Asphalt: heating coils, insulated trailers, temperature maintenance (275-350°F)
- Refined fuels: bottom-loading adapters, vapor recovery, multi-compartment

DRY VAN:
- Load bars, e-track, logistic posts, interior ratchet straps for cargo control
- Pallet jacks (manual/electric), liftgates for no-dock deliveries
- Dock plates, floor protection for heavy pallets
- FSMA Sanitary Transportation Rule for food/beverage freight
- High-value cargo handling: seal integrity, clean/dry/odor-free trailers

REFRIGERATED (REEFER):
- Temperature recorders/data loggers (Ryan, Sensitech, Emerson)
- Pre-cool procedures and setpoints by product (produce 34-40°F, frozen -10°F, pharma 36-46°F)
- Reefer fuel management, multi-temp divider walls, thermal blankets
- FSMA compliance, pharmaceutical GDP certification, cold chain integrity
- Product-specific: produce airflow, meat USDA seals, dairy PMO regulations

FLATBED:
- Ratchet straps (4" x 27ft, WLL 5,400 lbs), winch straps for winch tracks
- Grade 70 chains & binders for steel/heavy loads (FMCSA §393.120-132)
- Coil racks/cradles for steel coils (eye-to-sky, eye-to-side orientation)
- Tarps: lumber (7ft drop), steel (6ft), smoke (8ft+), coil tarps
- Edge protectors, dunnage (4x4 lumber, airbags), pipe stakes/bolsters
- Headache rack/cab guard always required

STEP DECK / LOWBOY / OVERSIZED:
- Loading ramps for drive-on equipment loading (RGN detachable gooseneck)
- Pilot cars (front/rear), wide load signs/flags, amber warning lights
- Oversize/overweight permits (state-specific), height measuring poles
- Jeep & booster axles for overweight distribution
- Blocking & cribbing, rigging shackles, beam/stinger extensions
- Route surveys for bridge clearance and overhead obstacles

HOPPER / PNEUMATIC / BULK:
- Pneumatic blowers (PTO or engine-driven, 800-1600 CFM)
- Discharge hoses (4"-5"), silo adapters/elbows for various inlets
- Hopper gates/slide gates for gravity unload
- Roll tarps for open-top hoppers
- Food-grade liners for flour/sugar/food-grade bulk (FDA compliant)
- MSHA Part 46 for quarry/mine sites

SAFETY & CERTIFICATIONS (all modes):
- Fire extinguishers (ABC, 10 lb minimum for hazmat), spill kits
- FR clothing (NFPA 2112), hard hats, steel-toe boots, safety glasses
- Hazmat H, Tanker N, TWIC, H2S, PEC SafeLand, MSHA, FSMA, pharma GDP
- Forklift certification (OSHA 1910.178) for driver-unload

When analyzing equipment matches or answering questions:
1. Be specific about sizes, materials, and specifications
2. Flag safety-critical gaps immediately
3. Consider regulatory requirements (DOT, FMCSA, PHMSA, EPA, FDA, USDA)
4. Provide actionable recommendations
5. Reference specific FMCSA securement rules (§393.100-136) when relevant

Respond in JSON format when asked for structured analysis. For conversational questions, respond naturally but concisely.`;

/**
 * Ask the ESANG AI ZEUN Mechanics advisor a question about equipment.
 */
export async function askEquipmentAdvisor(question: string, context?: {
  productType?: string;
  trailerType?: string;
  carrierEquipment?: EquipmentProfileItem[];
  loadRequirements?: EquipmentRequirement[];
  siteConditions?: SiteCondition[];
}): Promise<{ answer: string; recommendations?: string[] }> {
  const apiKey = ENV.geminiApiKey;
  if (!apiKey) {
    return {
      answer: "ESANG AI is not configured. Please check the Gemini API key.",
      recommendations: [],
    };
  }

  let contextStr = "";
  if (context) {
    if (context.productType) {
      const profile = PRODUCT_PROFILES.find(p => p.productId === context.productType);
      contextStr += `\nProduct: ${profile?.name || context.productType}`;
      if (profile) contextStr += `\nProduct Notes: ${profile.notes}`;
    }
    if (context.trailerType) contextStr += `\nTrailer Type: ${context.trailerType}`;
    if (context.carrierEquipment?.length) {
      contextStr += `\nCarrier Equipment: ${context.carrierEquipment.filter(e => e.available).map(e => {
        const item = findEquipmentItem(e.equipmentId);
        return item?.name || e.equipmentId;
      }).join(", ")}`;
    }
    if (context.siteConditions?.length) {
      contextStr += `\nSite Conditions: ${context.siteConditions.map(s => `${s.label}: ${s.value}`).join(", ")}`;
    }
  }

  const prompt = `${contextStr ? `\nContext:${contextStr}\n\n` : ""}User Question: ${question}\n\nProvide a clear, practical answer. If equipment recommendations are relevant, include them as a JSON array under "recommendations". Format your response as JSON: { "answer": "...", "recommendations": ["...", "..."] }`;

  try {
    const resp = await gemFetch(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: ZEUN_SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!resp.ok) {
      console.error("[ZEUN] Gemini API error:", resp.status);
      return { answer: "Equipment advisor temporarily unavailable.", recommendations: [] };
    }

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    try {
      const parsed = JSON.parse(text);
      return {
        answer: parsed.answer || text,
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      };
    } catch {
      return { answer: text, recommendations: [] };
    }
  } catch (err) {
    console.error("[ZEUN] AI advisor error:", err);
    return { answer: "Equipment advisor temporarily unavailable.", recommendations: [] };
  }
}

/**
 * AI-enhanced match analysis — enriches the deterministic score with Gemini insights.
 */
export async function analyzeMatchWithAI(
  matchResult: EquipmentMatchResult,
  productType: string,
  trailerType: string,
  siteConditions?: SiteCondition[]
): Promise<string> {
  const apiKey = ENV.geminiApiKey;
  if (!apiKey) return "";

  const profile = PRODUCT_PROFILES.find(p => p.productId === productType);

  const prompt = `Analyze this equipment match for a ${profile?.name || productType} hauling job:

Match Score: ${matchResult.overallScore}%
Readiness: ${matchResult.readiness}
Matched Equipment: ${matchResult.matched.map(m => m.equipmentName).join(", ") || "None"}
Critical Gaps: ${matchResult.gaps.filter(g => g.severity === "critical").map(g => g.equipmentName).join(", ") || "None"}
Warnings: ${matchResult.gaps.filter(g => g.severity === "warning").map(g => g.equipmentName).join(", ") || "None"}
Trailer: ${trailerType}
${siteConditions?.length ? `Site: ${siteConditions.map(s => `${s.label}: ${s.value}`).join(", ")}` : ""}

Provide a brief 2-3 sentence assessment of this carrier's readiness for this specific job. Focus on practical implications — what matters most for safely completing this haul. Respond as plain text, not JSON.`;

  try {
    const resp = await gemFetch(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: ZEUN_SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 300 },
        }),
      }
    );

    if (!resp.ok) return "";
    const data = await resp.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch {
    return "";
  }
}
