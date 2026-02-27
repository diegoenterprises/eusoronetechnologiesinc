/**
 * REGULATORY ENGINE ROUTER
 * tRPC procedures exposing the regulatory requirements engine
 * state × city × trailer × user × product compliance checks
 *
 * checkLoadCompliance — the unified endpoint that accepts RAW platform
 * inputs (trailer ID, product name, hazmat class, UN number) and resolves
 * them server-side using PRODUCT_CATALOG + COMPLIANCE_RULES + ERG HAZARD_CLASSES.
 * Works for ALL trailer types and ALL product types, not just hazmat.
 */

import { z } from "zod";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import {
  getRequirements,
  getStateProfile,
  getAllStateProfiles,
  getRequirementsByCategory,
} from "../services/regulatoryQueries";
import type { TrailerSpec, UserRoleType, ProductCategory } from "../services/regulatoryEngine";
import { PRODUCT_CATALOG, COMPLIANCE_RULES, TRAILER_PRODUCT_MAP } from "../seeds/complianceMatrix";
import { HAZARD_CLASSES } from "../_core/ergDatabase";

// ═══════════════════════════════════════════════════════════════
// PLATFORM → REGULATORY ENGINE RESOLVERS
// Uses existing PRODUCT_CATALOG + ERG to resolve raw platform
// trailer IDs and product names to regulatory engine enums.
// ═══════════════════════════════════════════════════════════════

/** Platform trailer ID → regulatory TrailerSpec (DOT/MC spec) */
const TRAILER_ID_TO_SPEC: Record<string, TrailerSpec> = {
  // Hazmat tanks
  liquid_tank:     "DOT-406",
  gas_tank:        "MC-331",
  cryogenic:       "MC-338",
  hazmat_van:      "DRY_VAN",
  // Non-hazmat
  dry_van:         "DRY_VAN",
  reefer:          "REEFER",
  flatbed:         "FLATBED",
  bulk_hopper:     "PNEUMATIC",
  food_grade_tank: "DOT-407",
  water_tank:      "DOT-412",
  // Extended / aliases
  lowboy:          "LOWBOY",
  step_deck:       "FLATBED",
  intermodal:      "INTERMODAL",
  hopper:          "HOPPER",
  tanker:          "TANKER_CRUDE",
  chemical_tank:   "TANKER_CHEMICAL",
  pneumatic:       "PNEUMATIC",
};

/** PRODUCT_CATALOG category → regulatory ProductCategory */
const CATALOG_CATEGORY_TO_REG: Record<string, ProductCategory> = {
  "Petroleum":     "crude_oil",
  "Gas":           "lpg",
  "Cryogenic":     "lpg",
  "Chemicals":     "general_hazmat",
  "Food Liquid":   "dry_freight",
  "Water":         "dry_freight",
  "Dry Freight":   "dry_freight",
  "Refrigerated":  "refrigerated",
  "Flatbed":       "oversize",
  "Heavy Haul":    "oversize",
  "Dry Bulk":      "dry_freight",
};

/** Hazmat class → regulatory ProductCategory (precise per DOT class) */
const HAZCLASS_TO_REG_PRODUCT: Record<string, ProductCategory> = {
  "1":   "explosives",    "1.1": "explosives",    "1.2": "explosives",
  "1.3": "explosives",    "1.4": "explosives",    "1.5": "explosives",
  "1.6": "explosives",
  "2":   "lpg",           "2.1": "lpg",           "2.2": "lpg",
  "2.3": "anhydrous_ammonia",
  "3":   "refined_petroleum",
  "4":   "general_hazmat", "4.1": "general_hazmat", "4.2": "general_hazmat",
  "4.3": "general_hazmat",
  "5":   "ammonium_nitrate", "5.1": "ammonium_nitrate", "5.2": "general_hazmat",
  "6":   "general_hazmat", "6.1": "chlorine",       "6.2": "infectious",
  "7":   "radioactive",
  "8":   "sulfuric_acid",
  "9":   "general_hazmat",
};

/**
 * Resolve product category from all available signals:
 * 1. Exact match in PRODUCT_CATALOG by product ID or name
 * 2. Hazmat class → product category via DOT class table
 * 3. UN number → ERG hazard class → product category
 * 4. Trailer type → default product category
 */
function resolveProductCategory(
  productName?: string,
  hazmatClass?: string,
  unNumber?: string,
  trailerType?: string,
): ProductCategory {
  // 1. Try exact PRODUCT_CATALOG match by ID
  if (productName) {
    const byId = PRODUCT_CATALOG.find(p => p.id === productName);
    if (byId) {
      // Refine: crude_oil specifically for UN1267, refined for other class 3
      if (byId.id === "crude_oil" || byId.id === "condensate") return "crude_oil";
      if (byId.id === "lpg" || byId.id === "natural_gas_liquids") return "lpg";
      if (byId.id === "ammonia") return "anhydrous_ammonia";
      if (byId.id === "chemicals") return byId.hazmatClass === "8" ? "sulfuric_acid" : "general_hazmat";
      if (byId.id === "lng" || byId.id === "lox" || byId.id === "liquid_nitrogen") return "lpg";
      if (byId.category === "Refrigerated") return "refrigerated";
      if (byId.category === "Flatbed" || byId.category === "Heavy Haul") return "oversize";
      if (byId.requiresHazmat && byId.hazmatClass) return HAZCLASS_TO_REG_PRODUCT[byId.hazmatClass] || "general_hazmat";
      return CATALOG_CATEGORY_TO_REG[byId.category] || "dry_freight";
    }

    // 1b. Fuzzy match by label
    const nameLower = productName.toLowerCase();
    const byLabel = PRODUCT_CATALOG.find(p => p.label.toLowerCase().includes(nameLower) || nameLower.includes(p.label.toLowerCase()));
    if (byLabel) {
      if (byLabel.requiresHazmat && byLabel.hazmatClass) return HAZCLASS_TO_REG_PRODUCT[byLabel.hazmatClass] || "general_hazmat";
      return CATALOG_CATEGORY_TO_REG[byLabel.category] || "dry_freight";
    }

    // 1c. Keyword matching against known product types
    if (/crude|condensate|bitumen/i.test(nameLower)) return "crude_oil";
    if (/gasoline|diesel|fuel oil|kerosene|jet fuel|petroleum|naphtha/i.test(nameLower)) return "refined_petroleum";
    if (/propane|butane|lpg|natural gas|ngl/i.test(nameLower)) return "lpg";
    if (/ammonia|anhydrous/i.test(nameLower)) return "anhydrous_ammonia";
    if (/chlorine/i.test(nameLower)) return "chlorine";
    if (/sulfuric|hydrochloric|corrosive|acid/i.test(nameLower)) return "sulfuric_acid";
    if (/ammonium nitrate|oxidizer|fertilizer/i.test(nameLower)) return "ammonium_nitrate";
    if (/radioactive|uranium|plutonium|cobalt-60/i.test(nameLower)) return "radioactive";
    if (/explosive|dynamite|detonator|blasting/i.test(nameLower)) return "explosives";
    if (/infectious|biological|medical waste/i.test(nameLower)) return "infectious";
    if (/produce|frozen|dairy|meat|seafood|pharma|floral/i.test(nameLower)) return "refrigerated";
    if (/steel|lumber|pipe|solar|equipment|machinery|oversize/i.test(nameLower)) return "oversize";
    if (/livestock|cattle|horse|pig|poultry/i.test(nameLower)) return "livestock";
  }

  // 2. Hazmat class → product category
  if (hazmatClass) {
    // Special: class 3 with UN1267 is crude, not generic refined
    if (hazmatClass === "3" && unNumber && /1267|1268/.test(unNumber)) return "crude_oil";
    return HAZCLASS_TO_REG_PRODUCT[hazmatClass] || "general_hazmat";
  }

  // 3. UN number → hazard class via ERG HAZARD_CLASSES
  if (unNumber) {
    const cleanUN = unNumber.replace(/\D/g, "");
    // Known critical UNs
    const UN_PRODUCT: Record<string, ProductCategory> = {
      "1267": "crude_oil", "1268": "crude_oil",                    // crude oil, condensate
      "1203": "refined_petroleum", "1202": "refined_petroleum",    // gasoline, diesel
      "1863": "refined_petroleum", "1223": "refined_petroleum",    // jet fuel, kerosene
      "1170": "refined_petroleum", "1993": "refined_petroleum",    // ethanol, flammable liquid NOS
      "1075": "lpg", "1978": "lpg", "1971": "lpg", "1972": "lpg", // LPG, propane, NatGas
      "1005": "anhydrous_ammonia",                                  // anhydrous ammonia
      "1017": "chlorine",                                           // chlorine
      "1830": "sulfuric_acid", "1789": "sulfuric_acid",            // sulfuric acid, HCl
      "2067": "ammonium_nitrate",                                   // ammonium nitrate
      "1053": "general_hazmat",                                     // H2S
    };
    if (UN_PRODUCT[cleanUN]) return UN_PRODUCT[cleanUN];
  }

  // 4. Trailer type → default product category
  if (trailerType) {
    const defaultByTrailer: Record<string, ProductCategory> = {
      liquid_tank: "crude_oil", gas_tank: "lpg", cryogenic: "lpg",
      hazmat_van: "general_hazmat", dry_van: "dry_freight",
      reefer: "refrigerated", flatbed: "oversize",
      bulk_hopper: "dry_freight", food_grade_tank: "dry_freight",
      water_tank: "dry_freight", lowboy: "oversize",
    };
    if (defaultByTrailer[trailerType]) return defaultByTrailer[trailerType];
  }

  return "dry_freight";
}

/** Resolve trailer spec from platform trailer ID */
function resolveTrailerSpec(trailerType?: string): TrailerSpec {
  if (!trailerType) return "DRY_VAN";
  return TRAILER_ID_TO_SPEC[trailerType] || TRAILER_ID_TO_SPEC[trailerType.toLowerCase()] || "DRY_VAN";
}

const trailerSpecSchema = z.enum([
  "DOT-406","DOT-407","DOT-412","MC-331","MC-338",
  "DRY_VAN","FLATBED","HOPPER","LOWBOY","REEFER",
  "PNEUMATIC","TANKER_CRUDE","TANKER_CHEMICAL","INTERMODAL",
]);

const userRoleSchema = z.enum([
  "driver","owner_operator","carrier","fleet_manager",
  "dispatcher","shipper","broker","safety_manager",
  "compliance_officer","terminal_manager","lumper","escort",
]);

const productCategorySchema = z.enum([
  "crude_oil","refined_petroleum","lpg","anhydrous_ammonia",
  "chlorine","sulfuric_acid","ammonium_nitrate","general_hazmat",
  "radioactive","explosives","infectious","dry_freight",
  "refrigerated","oversize","livestock",
]);

const requirementCategorySchema = z.enum([
  "permit","endorsement","training","insurance","equipment",
  "inspection","registration","documentation","operational",
]);

export const regulatoryRouter = router({
  /**
   * Full compliance check — the main engine endpoint
   * Returns every applicable requirement for a given combination
   */
  checkCompliance: protectedProcedure
    .input(z.object({
      trailerType: trailerSpecSchema,
      userRole: userRoleSchema,
      productCategory: productCategorySchema,
      states: z.array(z.string().length(2)).min(1),
      cities: z.record(z.string(), z.string()).optional(),
    }))
    .query(({ input }) => {
      return getRequirements(
        input.trailerType as TrailerSpec,
        input.userRole as UserRoleType,
        input.productCategory as ProductCategory,
        input.states,
        input.cities,
      );
    }),

  /**
   * Get a single state's regulatory profile
   */
  getStateProfile: protectedProcedure
    .input(z.object({ state: z.string().length(2) }))
    .query(({ input }) => {
      const profile = getStateProfile(input.state);
      if (!profile) return { found: false, state: input.state };
      return { found: true, ...profile };
    }),

  /**
   * List all states with regulatory profiles
   */
  getAllStates: protectedProcedure
    .query(() => {
      const profiles = getAllStateProfiles();
      return profiles.map(p => ({
        state: p.state,
        stateName: p.stateName,
        hazmatPermitRequired: p.hazmatPermitRequired,
        oversizePermitRequired: p.oversizePermitRequired,
        weightLimits: p.weightLimits,
        cityCount: Object.keys(p.cities).length,
        specialRuleCount: p.specialRules.length,
      }));
    }),

  /**
   * Get requirements by category (e.g., all training requirements for a driver)
   */
  getByCategory: protectedProcedure
    .input(z.object({
      category: requirementCategorySchema,
      trailerType: trailerSpecSchema.optional(),
      userRole: userRoleSchema.optional(),
      productCategory: productCategorySchema.optional(),
    }))
    .query(({ input }) => {
      return getRequirementsByCategory(
        input.category,
        input.trailerType as TrailerSpec | undefined,
        input.userRole as UserRoleType | undefined,
        input.productCategory as ProductCategory | undefined,
      );
    }),

  /**
   * Quick check: what endorsements does a driver need for a specific load?
   */
  getDriverEndorsements: protectedProcedure
    .input(z.object({
      trailerType: trailerSpecSchema,
      productCategory: productCategorySchema,
      states: z.array(z.string().length(2)).min(1),
    }))
    .query(({ input }) => {
      const results = getRequirements(
        input.trailerType as TrailerSpec,
        "driver",
        input.productCategory as ProductCategory,
        input.states,
      );
      const endorsements = results.flatMap(r =>
        r.requirements.filter(req => req.category === "endorsement")
      );
      // Dedupe
      const seen = new Set<string>();
      return endorsements.filter(e => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });
    }),

  /**
   * Insurance minimums for a given operation
   */
  getInsuranceMinimums: protectedProcedure
    .input(z.object({
      trailerType: trailerSpecSchema,
      productCategory: productCategorySchema,
      states: z.array(z.string().length(2)).min(1),
    }))
    .query(({ input }) => {
      const results = getRequirements(
        input.trailerType as TrailerSpec,
        "carrier",
        input.productCategory as ProductCategory,
        input.states,
      );
      return results.flatMap(r =>
        r.requirements.filter(req => req.category === "insurance")
      ).filter((v, i, a) => a.findIndex(x => x.id === v.id) === i);
    }),

  /**
   * City-level restrictions for a specific route
   */
  getCityRestrictions: protectedProcedure
    .input(z.object({
      state: z.string().length(2),
      city: z.string(),
    }))
    .query(({ input }) => {
      const profile = getStateProfile(input.state);
      if (!profile) return { found: false };
      const cityKey = input.city.toLowerCase().replace(/\s+/g, "");
      const cityData = profile.cities[cityKey];
      if (!cityData) return { found: false, availableCities: Object.keys(profile.cities) };
      return { found: true, state: profile.stateName, ...cityData };
    }),

  // ═══════════════════════════════════════════════════════════════
  // checkLoadCompliance — UNIFIED ENDPOINT FOR ALL LOAD TYPES
  // Accepts raw platform inputs, resolves via PRODUCT_CATALOG + ERG +
  // COMPLIANCE_RULES + regulatory engine. NOT just hazmat.
  // ═══════════════════════════════════════════════════════════════

  checkLoadCompliance: protectedProcedure
    .input(z.object({
      trailerType: z.string(),                          // Platform trailer ID (e.g. "liquid_tank", "reefer", "flatbed")
      productName: z.string().optional(),               // Product name or PRODUCT_CATALOG ID
      productId: z.string().optional(),                 // PRODUCT_CATALOG ID directly
      hazmatClass: z.string().optional(),               // DOT hazmat class (e.g. "3", "2.1")
      unNumber: z.string().optional(),                  // UN number (e.g. "UN1267")
      states: z.array(z.string()).min(1),               // 2-letter state codes
      cities: z.record(z.string(), z.string()).optional(), // state → city
      userRole: z.string().optional().default("driver"),
    }))
    .query(({ input }) => {
      // ── 1. Resolve to regulatory engine enums ──
      const resolvedTrailer = resolveTrailerSpec(input.trailerType);
      const resolvedProduct = resolveProductCategory(
        input.productId || input.productName,
        input.hazmatClass,
        input.unNumber,
        input.trailerType,
      );

      // ── 2. Get PRODUCT_CATALOG entry for this product ──
      const catalogProduct = input.productId
        ? PRODUCT_CATALOG.find(p => p.id === input.productId)
        : input.productName
          ? PRODUCT_CATALOG.find(p =>
              p.id === input.productName ||
              p.label.toLowerCase().includes((input.productName || "").toLowerCase()) ||
              (input.productName || "").toLowerCase().includes(p.label.toLowerCase())
            )
          : undefined;

      // ── 3. Get COMPLIANCE_RULES that apply to this trailer + product ──
      const applicableRules = COMPLIANCE_RULES.filter(rule => {
        if (rule.trigger === "TRAILER") {
          return rule.trailerTypes?.includes(input.trailerType) || false;
        }
        if (rule.trigger === "PRODUCT") {
          const prodId = catalogProduct?.id || input.productId;
          return prodId ? (rule.products?.includes(prodId) || false) : false;
        }
        if (rule.trigger === "COMBO") {
          const trailerMatch = rule.trailerTypes?.includes(input.trailerType) || false;
          const prodId = catalogProduct?.id || input.productId;
          const productMatch = prodId ? (rule.products?.includes(prodId) || false) : false;
          return trailerMatch && productMatch;
        }
        return false;
      });

      // ── 4. Get regulatory engine requirements for all states ──
      const normalizedStates = input.states
        .map(s => s.toUpperCase().trim())
        .filter(s => s.length === 2);

      const regResults = normalizedStates.length > 0
        ? getRequirements(
            resolvedTrailer,
            (input.userRole || "driver") as UserRoleType,
            resolvedProduct,
            normalizedStates,
            input.cities,
          )
        : [];

      // ── 5. Flatten all regulatory requirements ──
      const regRequirements = regResults.flatMap(stateResult =>
        (stateResult.requirements || []).map((r: any) => ({
          ...r,
          source: stateResult.jurisdiction || "Federal",
          sourceType: stateResult.jurisdiction?.length === 2 ? "state" : "federal",
        }))
      );

      // Dedupe by ID
      const seen = new Set<string>();
      const dedupedReg = regRequirements.filter((r: any) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });

      // ── 6. Map compliance rules to unified format ──
      const complianceFindings = applicableRules.map(rule => ({
        id: rule.id,
        title: rule.reason,
        category: rule.group.toLowerCase().includes("endorsement") ? "endorsement"
          : rule.group.toLowerCase().includes("hazmat") ? "permit"
          : rule.group.toLowerCase().includes("training") ? "training"
          : rule.group.toLowerCase().includes("food") ? "inspection"
          : rule.group.toLowerCase().includes("tank") ? "equipment"
          : "documentation",
        severity: rule.priority === "CRITICAL" ? "critical"
          : rule.priority === "HIGH" ? "high"
          : rule.priority === "MEDIUM" ? "medium"
          : "low",
        regulation: rule.federal ? "Federal (49 CFR)" : "State-level",
        source: rule.federal ? "FMCSA/PHMSA" : "State DOT",
        sourceType: rule.federal ? "federal" : "state",
        documentRequired: rule.documentTypeId,
        endorsements: rule.endorsements || [],
        status: rule.status,
      }));

      // ── 7. Merge and sort by severity ──
      const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      const allFindings = [...complianceFindings, ...dedupedReg]
        .sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4));

      // ── 8. Determine required CDL endorsements ──
      const endorsements = new Set<string>();
      for (const rule of applicableRules) {
        rule.endorsements?.forEach(e => endorsements.add(e));
      }
      for (const req of dedupedReg) {
        if ((req as any).endorsements) {
          ((req as any).endorsements as string[]).forEach(e => endorsements.add(e));
        }
      }

      // ── 9. Insurance & training from regulatory engine ──
      const insuranceReqs = dedupedReg.filter((r: any) => r.category === "insurance");
      const trainingReqs = dedupedReg.filter((r: any) => r.category === "training");

      const criticalCount = allFindings.filter(f => f.severity === "critical").length;
      const highCount = allFindings.filter(f => f.severity === "high").length;

      return {
        // Resolved context (what the engine computed)
        resolved: {
          trailerSpec: resolvedTrailer,
          productCategory: resolvedProduct,
          catalogProduct: catalogProduct ? {
            id: catalogProduct.id,
            label: catalogProduct.label,
            category: catalogProduct.category,
            hazmatClass: catalogProduct.hazmatClass,
            unNumber: catalogProduct.unNumber,
            requiresHazmat: catalogProduct.requiresHazmat,
            requiresTanker: catalogProduct.requiresTanker,
            requiresTWIC: catalogProduct.requiresTWIC,
            temperatureControlled: catalogProduct.temperatureControlled,
          } : null,
          states: normalizedStates,
          isHazmat: !!(input.hazmatClass || catalogProduct?.requiresHazmat),
          isTanker: !!(catalogProduct?.requiresTanker || ["liquid_tank", "gas_tank", "cryogenic", "food_grade_tank", "water_tank"].includes(input.trailerType)),
        },

        // All findings (compliance rules + regulatory engine)
        findings: allFindings,
        findingCount: allFindings.length,

        // Summary
        summary: {
          critical: criticalCount,
          high: highCount,
          medium: allFindings.filter(f => f.severity === "medium").length,
          low: allFindings.filter(f => f.severity === "low").length,
          total: allFindings.length,
        },

        // Overall compliance status
        status: criticalCount > 0 ? "CRITICAL" : highCount > 0 ? "ACTION_REQUIRED" : allFindings.length > 0 ? "ADVISORY" : "CLEAR",

        // CDL endorsements required
        endorsementsRequired: Array.from(endorsements),

        // Grouped by category for UI rendering
        byCategory: {
          endorsement: allFindings.filter(f => f.category === "endorsement"),
          permit: allFindings.filter(f => f.category === "permit"),
          training: allFindings.filter(f => f.category === "training"),
          insurance: allFindings.filter(f => f.category === "insurance"),
          equipment: allFindings.filter(f => f.category === "equipment"),
          inspection: allFindings.filter(f => f.category === "inspection"),
          registration: allFindings.filter(f => f.category === "registration"),
          documentation: allFindings.filter(f => f.category === "documentation"),
          operational: allFindings.filter(f => f.category === "operational"),
        },

        // Insurance minimums
        insuranceRequirements: insuranceReqs,

        // Required training
        trainingRequirements: trainingReqs,
      };
    }),
});
