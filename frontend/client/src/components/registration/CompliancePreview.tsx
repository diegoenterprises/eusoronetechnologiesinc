/**
 * COMPLIANCE PREVIEW — Smart Real-Time Requirements Panel
 * Renders during registration as the user selects trailers, products, and operating states.
 * Updates instantly — zero lag, zero server calls. Pure client-side matrix resolution.
 *
 * Design: Jony Ive — frosted glass, gradient accents, EusoTrip brand palette.
 */

import React, { useMemo, useState } from "react";
import {
  Shield, FileText, AlertTriangle, ChevronDown, ChevronUp,
  Download, ExternalLink, Flame, Snowflake, Droplets,
  Truck, Package, CheckCircle2, CircleDot, Info,
  Lock, Leaf, FlaskConical, HardHat, Wheat, Milk,
  Factory, Waves, GlassWater, Mountain, Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ─── Types mirroring the server-side compliance matrix ───
// These are intentionally duplicated client-side so the preview
// works with zero network calls during registration.

interface ProductDefinition {
  id: string;
  label: string;
  category: string;
  hazmatClass?: string;
  requiresHazmat: boolean;
  requiresTanker: boolean;
  requiresTWIC: boolean;
  temperatureControlled: boolean;
  icon: string;
}

type RulePriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type RuleTrigger = "TRAILER" | "PRODUCT" | "COMBO";

interface ComplianceRule {
  id: string;
  trigger: RuleTrigger;
  trailerTypes?: string[];
  products?: string[];
  documentTypeId: string;
  priority: RulePriority;
  status: "REQUIRED" | "CONDITIONAL" | "RECOMMENDED";
  reason: string;
  group: string;
  federal: boolean;
  endorsements?: string[];
}

// ─── Client-side product catalog (mirrors server) ───
const PRODUCT_CATALOG: ProductDefinition[] = [
  { id: "crude_oil", label: "Crude Oil", category: "Petroleum", hazmatClass: "3", requiresHazmat: true, requiresTanker: true, requiresTWIC: false, temperatureControlled: false, icon: "Droplets" },
  { id: "refined_fuel", label: "Refined Fuel (Gasoline/Diesel)", category: "Petroleum", hazmatClass: "3", requiresHazmat: true, requiresTanker: true, requiresTWIC: false, temperatureControlled: false, icon: "Fuel" },
  { id: "jet_fuel", label: "Jet Fuel / Aviation Fuel", category: "Petroleum", hazmatClass: "3", requiresHazmat: true, requiresTanker: true, requiresTWIC: true, temperatureControlled: false, icon: "Plane" },
  { id: "ethanol", label: "Ethanol / E85", category: "Petroleum", hazmatClass: "3", requiresHazmat: true, requiresTanker: true, requiresTWIC: false, temperatureControlled: false, icon: "Leaf" },
  { id: "biodiesel", label: "Biodiesel / Renewable Diesel", category: "Petroleum", hazmatClass: "3", requiresHazmat: true, requiresTanker: true, requiresTWIC: false, temperatureControlled: false, icon: "Leaf" },
  { id: "asphalt", label: "Asphalt / Bitumen", category: "Petroleum", hazmatClass: "3", requiresHazmat: true, requiresTanker: true, requiresTWIC: false, temperatureControlled: true, icon: "Construction" },
  { id: "condensate", label: "Condensate", category: "Petroleum", hazmatClass: "3", requiresHazmat: true, requiresTanker: true, requiresTWIC: false, temperatureControlled: false, icon: "Droplets" },
  { id: "produced_water", label: "Produced Water / Brine", category: "Petroleum", requiresHazmat: false, requiresTanker: true, requiresTWIC: false, temperatureControlled: false, icon: "Waves" },
  { id: "natural_gas_liquids", label: "Natural Gas Liquids (NGL)", category: "Petroleum", hazmatClass: "2", requiresHazmat: true, requiresTanker: true, requiresTWIC: false, temperatureControlled: false, icon: "Flame" },
  { id: "lpg", label: "LPG / Propane", category: "Gas", hazmatClass: "2.1", requiresHazmat: true, requiresTanker: true, requiresTWIC: false, temperatureControlled: false, icon: "Flame" },
  { id: "ammonia", label: "Anhydrous Ammonia", category: "Gas", hazmatClass: "2.2", requiresHazmat: true, requiresTanker: true, requiresTWIC: false, temperatureControlled: false, icon: "Wind" },
  { id: "chemicals", label: "Industrial Chemicals", category: "Chemicals", hazmatClass: "8", requiresHazmat: true, requiresTanker: true, requiresTWIC: false, temperatureControlled: false, icon: "FlaskConical" },
  { id: "lng", label: "LNG (Liquefied Natural Gas)", category: "Cryogenic", hazmatClass: "2.1", requiresHazmat: true, requiresTanker: true, requiresTWIC: true, temperatureControlled: true, icon: "Snowflake" },
  { id: "lox", label: "Liquid Oxygen (LOX)", category: "Cryogenic", hazmatClass: "2.2", requiresHazmat: true, requiresTanker: true, requiresTWIC: false, temperatureControlled: true, icon: "Snowflake" },
  { id: "liquid_nitrogen", label: "Liquid Nitrogen (LN2)", category: "Cryogenic", hazmatClass: "2.2", requiresHazmat: true, requiresTanker: true, requiresTWIC: false, temperatureControlled: true, icon: "Snowflake" },
  { id: "milk", label: "Milk / Dairy Liquids", category: "Food Liquid", requiresHazmat: false, requiresTanker: true, requiresTWIC: false, temperatureControlled: true, icon: "Milk" },
  { id: "edible_oil", label: "Edible Oils", category: "Food Liquid", requiresHazmat: false, requiresTanker: true, requiresTWIC: false, temperatureControlled: false, icon: "Droplets" },
  { id: "juice", label: "Juice / Liquid Beverages", category: "Food Liquid", requiresHazmat: false, requiresTanker: true, requiresTWIC: false, temperatureControlled: true, icon: "GlassWater" },
  { id: "wine_spirits", label: "Wine / Spirits (Bulk)", category: "Food Liquid", requiresHazmat: false, requiresTanker: true, requiresTWIC: false, temperatureControlled: true, icon: "Wine" },
  { id: "potable_water", label: "Potable Water", category: "Water", requiresHazmat: false, requiresTanker: true, requiresTWIC: false, temperatureControlled: false, icon: "Droplets" },
  { id: "non_potable_water", label: "Non-Potable / Industrial Water", category: "Water", requiresHazmat: false, requiresTanker: true, requiresTWIC: false, temperatureControlled: false, icon: "Waves" },
  { id: "general_freight", label: "General Freight", category: "Dry Freight", requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Package" },
  { id: "electronics", label: "Electronics / High-Value", category: "Dry Freight", requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Cpu" },
  { id: "automotive_parts", label: "Automotive Parts", category: "Dry Freight", requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Cog" },
  { id: "retail_goods", label: "Retail / Consumer Goods", category: "Dry Freight", requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "ShoppingCart" },
  { id: "paper_packaging", label: "Paper & Packaging", category: "Dry Freight", requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "FileBox" },
  { id: "furniture", label: "Furniture / Household Goods", category: "Dry Freight", requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Armchair" },
  { id: "hazmat_dry", label: "Hazmat (Dry / Packaged)", category: "Dry Freight", hazmatClass: "9", requiresHazmat: true, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "AlertTriangle" },
  { id: "produce", label: "Fresh Produce", category: "Refrigerated", requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: true, icon: "Apple" },
  { id: "frozen_food", label: "Frozen Food", category: "Refrigerated", requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: true, icon: "Snowflake" },
  { id: "dairy", label: "Dairy Products", category: "Refrigerated", requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: true, icon: "Milk" },
  { id: "meat_seafood", label: "Meat & Seafood", category: "Refrigerated", requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: true, icon: "Beef" },
  { id: "pharmaceuticals", label: "Pharmaceuticals", category: "Refrigerated", requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: true, icon: "Pill" },
  { id: "floral", label: "Floral / Live Plants", category: "Refrigerated", requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: true, icon: "Flower2" },
  { id: "steel_coils", label: "Steel Coils / Metal", category: "Flatbed", requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "CircleDot" },
  { id: "lumber", label: "Lumber / Timber", category: "Flatbed", requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "TreePine" },
  { id: "pipe_tubing", label: "Pipe & Tubing", category: "Flatbed", requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Cylinder" },
  { id: "building_materials", label: "Building Materials", category: "Flatbed", requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Building2" },
  { id: "machinery", label: "Machinery / Industrial Equipment", category: "Heavy Haul", requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Cog" },
  { id: "construction_equipment", label: "Construction Equipment", category: "Heavy Haul", requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "HardHat" },
  { id: "oilfield_equipment", label: "Oilfield Equipment", category: "Heavy Haul", requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Factory" },
  { id: "solar_panels", label: "Solar Panels / Wind Components", category: "Flatbed", requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Sun" },
  { id: "grain", label: "Grain / Feed", category: "Dry Bulk", requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Wheat" },
  { id: "sand_aggregate", label: "Sand / Gravel / Aggregate", category: "Dry Bulk", requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Mountain" },
  { id: "cement", label: "Cement / Powder", category: "Dry Bulk", requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Layers" },
  { id: "plastic_pellets", label: "Plastic Pellets / Resin", category: "Dry Bulk", requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "CircleDot" },
  { id: "flour_sugar", label: "Flour / Sugar / Food Powders", category: "Dry Bulk", requiresHazmat: false, requiresTanker: false, requiresTWIC: false, temperatureControlled: false, icon: "Cookie" },
];

// ─── Trailer → Product map (client-side mirror) ───
const TRAILER_PRODUCT_MAP: Record<string, string[]> = {
  liquid_tank: ["crude_oil", "refined_fuel", "jet_fuel", "ethanol", "biodiesel", "asphalt", "condensate", "produced_water", "natural_gas_liquids", "chemicals"],
  gas_tank: ["lpg", "ammonia", "natural_gas_liquids"],
  cryogenic: ["lng", "lox", "liquid_nitrogen"],
  food_grade_tank: ["milk", "edible_oil", "juice", "wine_spirits"],
  water_tank: ["potable_water", "non_potable_water"],
  dry_van: ["general_freight", "electronics", "automotive_parts", "retail_goods", "paper_packaging", "furniture", "hazmat_dry"],
  reefer: ["produce", "frozen_food", "dairy", "meat_seafood", "pharmaceuticals", "floral"],
  flatbed: ["steel_coils", "lumber", "pipe_tubing", "building_materials", "solar_panels", "machinery", "oilfield_equipment"],
  bulk_hopper: ["grain", "sand_aggregate", "cement", "plastic_pellets", "flour_sugar"],
  hazmat_van: ["hazmat_dry", "chemicals"],
  lowboy: ["machinery", "construction_equipment", "oilfield_equipment"],
  step_deck: ["steel_coils", "lumber", "pipe_tubing", "building_materials", "machinery", "oilfield_equipment", "solar_panels"],
};

// ─── Client-side compliance rules (mirrors server complianceMatrix.ts) ───
const COMPLIANCE_RULES: ComplianceRule[] = [
  // TRAILER rules
  { id: "TANK_INSPECTION", trigger: "TRAILER", trailerTypes: ["liquid_tank", "gas_tank", "cryogenic", "food_grade_tank", "water_tank"], documentTypeId: "CARGO_TANK_TEST", priority: "CRITICAL", status: "REQUIRED", reason: "Cargo tank test per 49 CFR 180.407", group: "Tank Compliance", federal: true },
  { id: "TANK_WASHOUT", trigger: "TRAILER", trailerTypes: ["liquid_tank", "gas_tank", "food_grade_tank", "water_tank"], documentTypeId: "TANK_WASHOUT_CERT", priority: "HIGH", status: "REQUIRED", reason: "Tank cleaning between product changes", group: "Tank Compliance", federal: true },
  { id: "TANK_PRD", trigger: "TRAILER", trailerTypes: ["gas_tank", "cryogenic"], documentTypeId: "PRESSURE_RELIEF_TEST", priority: "HIGH", status: "REQUIRED", reason: "Pressure relief device testing", group: "Tank Compliance", federal: true },
  { id: "TANK_ENDORSE", trigger: "TRAILER", trailerTypes: ["liquid_tank", "gas_tank", "cryogenic", "food_grade_tank", "water_tank"], documentTypeId: "TANKER_ENDORSEMENT", priority: "CRITICAL", status: "REQUIRED", reason: "CDL N endorsement for tank vehicles", group: "CDL Endorsements", federal: true, endorsements: ["N"] },
  { id: "CRYO_HANDLING", trigger: "TRAILER", trailerTypes: ["cryogenic"], documentTypeId: "CRYOGENIC_HANDLING_CERT", priority: "CRITICAL", status: "REQUIRED", reason: "Cryogenic materials handling training", group: "Specialized Training", federal: true },
  { id: "LOAD_SECUREMENT", trigger: "TRAILER", trailerTypes: ["flatbed", "step_deck", "lowboy"], documentTypeId: "LOAD_SECUREMENT_TRAINING", priority: "HIGH", status: "REQUIRED", reason: "Cargo securement per 49 CFR 393", group: "Specialized Training", federal: true },
  { id: "OVERSIZE_PERMIT", trigger: "TRAILER", trailerTypes: ["flatbed", "step_deck", "lowboy"], documentTypeId: "OVERSIZE_PERMIT", priority: "HIGH", status: "CONDITIONAL", reason: "Oversize/overweight permits per state", group: "State Permits", federal: false },
  { id: "BULK_LOADING", trigger: "TRAILER", trailerTypes: ["bulk_hopper"], documentTypeId: "BULK_LOADING_CERT", priority: "HIGH", status: "REQUIRED", reason: "Pneumatic loading/unloading training", group: "Specialized Training", federal: true },
  { id: "HOPPER_INSPECT", trigger: "TRAILER", trailerTypes: ["bulk_hopper"], documentTypeId: "HOPPER_INSPECTION", priority: "HIGH", status: "REQUIRED", reason: "Pneumatic system inspection", group: "Equipment Compliance", federal: true },
  { id: "REEFER_FSMA", trigger: "TRAILER", trailerTypes: ["reefer"], documentTypeId: "FOOD_SAFETY_CERT", priority: "HIGH", status: "REQUIRED", reason: "FSMA sanitary transportation (21 CFR 1.908)", group: "Food Safety", federal: true },

  // PRODUCT rules
  { id: "HAZMAT_REG", trigger: "PRODUCT", products: ["crude_oil", "refined_fuel", "jet_fuel", "ethanol", "biodiesel", "condensate", "natural_gas_liquids", "lpg", "ammonia", "chemicals", "lng", "lox", "liquid_nitrogen", "asphalt", "hazmat_dry"], documentTypeId: "HAZMAT_REGISTRATION", priority: "CRITICAL", status: "REQUIRED", reason: "PHMSA registration (49 CFR 107.601)", group: "Hazmat Compliance", federal: true },
  { id: "HAZMAT_SECURITY", trigger: "PRODUCT", products: ["crude_oil", "refined_fuel", "jet_fuel", "ethanol", "biodiesel", "condensate", "natural_gas_liquids", "lpg", "ammonia", "chemicals", "lng", "lox", "liquid_nitrogen", "asphalt", "hazmat_dry"], documentTypeId: "HAZMAT_SECURITY_PLAN", priority: "CRITICAL", status: "REQUIRED", reason: "Security plan (49 CFR 172.800)", group: "Hazmat Compliance", federal: true },
  { id: "HAZMAT_TRAINING", trigger: "PRODUCT", products: ["crude_oil", "refined_fuel", "jet_fuel", "ethanol", "biodiesel", "condensate", "natural_gas_liquids", "lpg", "ammonia", "chemicals", "lng", "lox", "liquid_nitrogen", "asphalt", "hazmat_dry"], documentTypeId: "HAZMAT_TRAINING_CERT", priority: "CRITICAL", status: "REQUIRED", reason: "Hazmat handling training (49 CFR 172.704)", group: "Hazmat Compliance", federal: true },
  { id: "HAZMAT_ENDORSE", trigger: "PRODUCT", products: ["crude_oil", "refined_fuel", "jet_fuel", "ethanol", "biodiesel", "condensate", "natural_gas_liquids", "lpg", "ammonia", "chemicals", "lng", "lox", "liquid_nitrogen", "asphalt", "hazmat_dry"], documentTypeId: "HAZMAT_ENDORSEMENT", priority: "CRITICAL", status: "REQUIRED", reason: "CDL H endorsement (49 CFR 383.93)", group: "CDL Endorsements", federal: true, endorsements: ["H"] },
  { id: "HAZMAT_BOL", trigger: "PRODUCT", products: ["crude_oil", "refined_fuel", "jet_fuel", "ethanol", "biodiesel", "condensate", "natural_gas_liquids", "lpg", "ammonia", "chemicals", "lng", "lox", "liquid_nitrogen", "asphalt", "hazmat_dry"], documentTypeId: "HAZMAT_BOL_TEMPLATE", priority: "HIGH", status: "REQUIRED", reason: "Hazmat shipping papers (49 CFR 172.200)", group: "Operations", federal: true },
  { id: "VAPOR_RECOVERY", trigger: "PRODUCT", products: ["crude_oil", "refined_fuel", "condensate", "natural_gas_liquids", "ethanol"], documentTypeId: "VAPOR_RECOVERY_CERT", priority: "HIGH", status: "CONDITIONAL", reason: "Vapor recovery cert (state EPA / CARB)", group: "Environmental", federal: false },
  { id: "TWIC_AVIATION", trigger: "PRODUCT", products: ["jet_fuel", "lng"], documentTypeId: "TWIC", priority: "HIGH", status: "REQUIRED", reason: "TWIC for secure facility access", group: "CDL Endorsements", federal: true },
  { id: "FOOD_TANK_FSMA", trigger: "PRODUCT", products: ["milk", "edible_oil", "juice", "wine_spirits"], documentTypeId: "FOOD_SAFETY_CERT", priority: "HIGH", status: "REQUIRED", reason: "FSMA for food-grade liquids", group: "Food Safety", federal: true },
  { id: "POTABLE_CERT", trigger: "PRODUCT", products: ["potable_water"], documentTypeId: "POTABLE_WATER_CERT", priority: "HIGH", status: "REQUIRED", reason: "NSF/ANSI 61 potable water compliance", group: "Water Compliance", federal: true },
  { id: "WATER_QUALITY", trigger: "PRODUCT", products: ["potable_water"], documentTypeId: "WATER_QUALITY_TEST", priority: "HIGH", status: "REQUIRED", reason: "Periodic water quality testing", group: "Water Compliance", federal: true },
  { id: "PHARMA_GDP", trigger: "PRODUCT", products: ["pharmaceuticals"], documentTypeId: "PHARMA_GDP_CERT", priority: "HIGH", status: "REQUIRED", reason: "GDP certification for pharma cold chain", group: "Pharmaceutical", federal: true },

  // COMBO rules
  { id: "CRUDE_TANK", trigger: "COMBO", trailerTypes: ["liquid_tank"], products: ["crude_oil", "condensate"], documentTypeId: "HAZMAT_ENDORSEMENT", priority: "CRITICAL", status: "REQUIRED", reason: "H+N endorsement for crude tanker ops", group: "CDL Endorsements", federal: true, endorsements: ["H", "N"] },
  { id: "MILK_WASHOUT", trigger: "COMBO", trailerTypes: ["food_grade_tank"], products: ["milk", "juice"], documentTypeId: "TANK_WASHOUT_CERT", priority: "CRITICAL", status: "REQUIRED", reason: "Tank washout every load (PMO)", group: "Food Safety", federal: true },
  { id: "HEAVY_OVERSIZE", trigger: "COMBO", trailerTypes: ["lowboy"], products: ["construction_equipment", "machinery", "oilfield_equipment"], documentTypeId: "OVERSIZE_PERMIT", priority: "CRITICAL", status: "REQUIRED", reason: "Oversize permit for heavy equipment", group: "State Permits", federal: false },
  { id: "PHARMA_REEFER", trigger: "COMBO", trailerTypes: ["reefer"], products: ["pharmaceuticals"], documentTypeId: "PHARMA_GDP_CERT", priority: "CRITICAL", status: "REQUIRED", reason: "GDP mandatory for pharma temp-controlled", group: "Pharmaceutical", federal: true },
  { id: "FOOD_BULK", trigger: "COMBO", trailerTypes: ["bulk_hopper"], products: ["flour_sugar", "grain"], documentTypeId: "FOOD_SAFETY_CERT", priority: "HIGH", status: "REQUIRED", reason: "FSMA for food-grade dry bulk", group: "Food Safety", federal: true },
];

// ─── Resolver (client-side) ───
function resolveRules(trailerTypes: string[], products: string[]) {
  const tSet = new Set(trailerTypes);
  const pSet = new Set(products);
  const results: { rule: ComplianceRule; matchType: RuleTrigger }[] = [];
  const seen = new Set<string>();

  for (const rule of COMPLIANCE_RULES) {
    let matched = false;
    if (rule.trigger === "TRAILER") {
      matched = (rule.trailerTypes || []).some(t => tSet.has(t));
    } else if (rule.trigger === "PRODUCT") {
      matched = (rule.products || []).some(p => pSet.has(p));
    } else if (rule.trigger === "COMBO") {
      matched = (rule.trailerTypes || []).some(t => tSet.has(t)) && (rule.products || []).some(p => pSet.has(p));
    }
    if (matched) {
      const key = `${rule.documentTypeId}:${rule.group}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({ rule, matchType: rule.trigger });
      }
    }
  }

  const pOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  results.sort((a, b) => (pOrder[a.rule.priority] ?? 3) - (pOrder[b.rule.priority] ?? 3));
  return results;
}

function getApplicableProducts(trailerTypes: string[]): ProductDefinition[] {
  const ids = new Set<string>();
  for (const tt of trailerTypes) {
    for (const p of (TRAILER_PRODUCT_MAP[tt] || [])) ids.add(p);
  }
  return PRODUCT_CATALOG.filter(p => ids.has(p.id));
}

// ─── Icon resolver ───
const ICON_MAP: Record<string, React.ReactNode> = {
  Droplets: <Droplets className="w-3.5 h-3.5" />,
  Flame: <Flame className="w-3.5 h-3.5" />,
  Snowflake: <Snowflake className="w-3.5 h-3.5" />,
  Milk: <Milk className="w-3.5 h-3.5" />,
  Waves: <Waves className="w-3.5 h-3.5" />,
  GlassWater: <GlassWater className="w-3.5 h-3.5" />,
  Package: <Package className="w-3.5 h-3.5" />,
  FlaskConical: <FlaskConical className="w-3.5 h-3.5" />,
  HardHat: <HardHat className="w-3.5 h-3.5" />,
  Factory: <Factory className="w-3.5 h-3.5" />,
  Wheat: <Wheat className="w-3.5 h-3.5" />,
  Mountain: <Mountain className="w-3.5 h-3.5" />,
  Layers: <Layers className="w-3.5 h-3.5" />,
  CircleDot: <CircleDot className="w-3.5 h-3.5" />,
  AlertTriangle: <AlertTriangle className="w-3.5 h-3.5" />,
  Leaf: <Leaf className="w-3.5 h-3.5" />,
};

// ─── Priority styling ───
const PRIORITY_STYLES: Record<RulePriority, { bg: string; text: string; ring: string; dot: string }> = {
  CRITICAL: { bg: "bg-red-500/10", text: "text-red-400", ring: "ring-red-500/20", dot: "bg-red-500" },
  HIGH: { bg: "bg-amber-500/10", text: "text-amber-400", ring: "ring-amber-500/20", dot: "bg-amber-500" },
  MEDIUM: { bg: "bg-blue-500/10", text: "text-blue-400", ring: "ring-blue-500/20", dot: "bg-blue-500" },
  LOW: { bg: "bg-slate-500/10", text: "text-slate-400", ring: "ring-slate-500/20", dot: "bg-slate-500" },
};

// ═══════════════════════════════════════════════════════════
// PRODUCT PICKER COMPONENT
// ═══════════════════════════════════════════════════════════

interface ProductPickerProps {
  trailerTypes: string[];
  selectedProducts: string[];
  onProductsChange: (products: string[]) => void;
}

export function ProductPicker({ trailerTypes, selectedProducts, onProductsChange }: ProductPickerProps) {
  const applicableProducts = useMemo(() => getApplicableProducts(trailerTypes), [trailerTypes]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, ProductDefinition[]>();
    for (const p of applicableProducts) {
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category)!.push(p);
    }
    return Array.from(map.entries());
  }, [applicableProducts]);

  if (trailerTypes.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
        <Truck className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <p className="text-sm text-slate-400">Select equipment types above to see applicable products</p>
      </div>
    );
  }

  const toggle = (id: string) => {
    if (selectedProducts.includes(id)) {
      onProductsChange(selectedProducts.filter(p => p !== id));
    } else {
      onProductsChange([...selectedProducts, id]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-200">Products You Haul</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Filtered by your equipment — select all products you transport
          </p>
        </div>
        {selectedProducts.length > 0 && (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30 text-xs">
            {selectedProducts.length} selected
          </Badge>
        )}
      </div>

      {grouped.map(([category, products]) => (
        <div key={category} className="space-y-1.5">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider pl-1">{category}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {products.map(p => {
              const selected = selectedProducts.includes(p.id);
              const icon = ICON_MAP[p.icon] || <Package className="w-3.5 h-3.5" />;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  className={`
                    flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-all duration-150
                    ${selected
                      ? "bg-gradient-to-r from-blue-500/15 to-purple-500/10 border border-blue-500/30 text-blue-200 shadow-sm shadow-blue-500/5"
                      : "bg-slate-800/40 border border-slate-700/40 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                    }
                  `}
                >
                  <span className={selected ? "text-blue-400" : "text-slate-500"}>{icon}</span>
                  <span className="flex-1 truncate">{p.label}</span>
                  {p.requiresHazmat && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/15 text-red-400 border border-red-500/20">
                      HAZMAT
                    </span>
                  )}
                  {p.temperatureControlled && !p.requiresHazmat && (
                    <Snowflake className="w-3 h-3 shrink-0 text-cyan-400/60" />
                  )}
                  {selected && <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-400" />}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPLIANCE PREVIEW PANEL
// ═══════════════════════════════════════════════════════════

interface CompliancePreviewProps {
  trailerTypes: string[];
  products: string[];
  operatingStates: string[];
  hasHazmat: boolean;
}

export function CompliancePreview({ trailerTypes, products, operatingStates, hasHazmat }: CompliancePreviewProps) {
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const resolved = useMemo(() => resolveRules(trailerTypes, products), [trailerTypes, products]);

  // Count by priority
  const counts = useMemo(() => {
    const c = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, total: 0 };
    for (const r of resolved) {
      c[r.rule.priority]++;
      c.total++;
    }
    return c;
  }, [resolved]);

  // Required endorsements
  const endorsements = useMemo(() => {
    const set = new Set<string>();
    for (const r of resolved) {
      if (r.rule.endorsements) r.rule.endorsements.forEach(e => set.add(e));
    }
    return Array.from(set).sort();
  }, [resolved]);

  // Group by group name
  const grouped = useMemo(() => {
    const map = new Map<string, typeof resolved>();
    for (const r of resolved) {
      if (!map.has(r.rule.group)) map.set(r.rule.group, []);
      map.get(r.rule.group)!.push(r);
    }
    return Array.from(map.entries());
  }, [resolved]);

  // State-level requirements summary
  const stateWarnings = useMemo(() => {
    const warnings: string[] = [];
    const stSet = new Set(operatingStates.map(s => s.toUpperCase()));
    if (stSet.has("CA")) warnings.push("CA: CARB Truck & Bus Compliance + Motor Carrier Permit required");
    if (stSet.has("OR")) warnings.push("OR: Weight-Mile Tax registration required");
    if (stSet.has("NM")) warnings.push("NM: Weight-Distance Tax registration required");
    if (stSet.has("NY")) warnings.push("NY: Highway Use Tax registration required");
    if (stSet.has("KY")) warnings.push("KY: Weight-Distance Tax registration required");
    return warnings;
  }, [operatingStates]);

  if (trailerTypes.length === 0 && products.length === 0) return null;

  const displayRules = showAll ? resolved : resolved.slice(0, 8);

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500/[0.08] to-purple-500/[0.05] border-b border-slate-700/50 hover:from-blue-500/[0.12] hover:to-purple-500/[0.08] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1473FF] to-[#BE01FF] flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-slate-200">Smart Compliance Requirements</p>
            <p className="text-[11px] text-slate-500">
              {counts.total === 0
                ? "Select products to see requirements"
                : `${counts.total} document${counts.total !== 1 ? "s" : ""} required based on your selections`
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {counts.CRITICAL > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-400 border border-red-500/20">
              {counts.CRITICAL} Critical
            </span>
          )}
          {counts.HIGH > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
              {counts.HIGH} High
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </button>

      {expanded && counts.total > 0 && (
        <div className="p-4 space-y-4">
          {/* Endorsement badges */}
          {endorsements.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-500">Required CDL Endorsements:</span>
              {endorsements.map(e => (
                <span key={e} className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-gradient-to-r from-blue-500/15 to-purple-500/10 text-blue-300 border border-blue-500/25">
                  {e === "H" ? "H (Hazmat)" : e === "N" ? "N (Tanker)" : e === "T" ? "T (Doubles/Triples)" : e === "X" ? "X (H+N Combo)" : e}
                </span>
              ))}
            </div>
          )}

          {/* State warnings */}
          {stateWarnings.length > 0 && (
            <div className="p-2.5 rounded-lg bg-amber-500/[0.06] border border-amber-500/15">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-amber-300">State-Specific Requirements</p>
                  {stateWarnings.map((w, i) => (
                    <p key={i} className="text-[11px] text-amber-400/70">{w}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Grouped requirements */}
          <div className="space-y-1">
            {displayRules.map(({ rule, matchType }) => {
              const ps = PRIORITY_STYLES[rule.priority];
              return (
                <div
                  key={rule.id}
                  className={`flex items-start gap-2.5 px-3 py-2 rounded-lg ${ps.bg} border border-transparent ring-1 ${ps.ring}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${ps.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-200 truncate">{rule.documentTypeId.replace(/_/g, " ")}</span>
                      <span className={`text-[9px] font-semibold uppercase ${ps.text}`}>{rule.priority}</span>
                      {rule.federal && (
                        <span className="text-[9px] text-slate-600 uppercase">Federal</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{rule.reason}</p>
                  </div>
                  <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded ${
                    rule.status === "REQUIRED" ? "bg-slate-700/50 text-slate-300" :
                    rule.status === "CONDITIONAL" ? "bg-slate-700/30 text-slate-400" :
                    "bg-slate-700/20 text-slate-500"
                  }`}>
                    {rule.status}
                  </span>
                </div>
              );
            })}
          </div>

          {resolved.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="w-full text-center text-xs text-blue-400 hover:text-blue-300 transition-colors py-1"
            >
              {showAll ? "Show less" : `Show all ${resolved.length} requirements`}
            </button>
          )}

          {/* Summary bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-700/30">
            <div className="flex items-center gap-3">
              {Object.entries(counts).filter(([k]) => k !== "total").map(([priority, count]) => {
                if (count === 0) return null;
                const ps = PRIORITY_STYLES[priority as RulePriority];
                return (
                  <div key={priority} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${ps.dot}`} />
                    <span className="text-[10px] text-slate-500">{count} {priority.toLowerCase()}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-600" />
              <span className="text-[10px] text-slate-600">Updates as you select</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { PRODUCT_CATALOG as CLIENT_PRODUCT_CATALOG, TRAILER_PRODUCT_MAP as CLIENT_TRAILER_PRODUCT_MAP };
