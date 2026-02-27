/**
 * REGULATORY QUERIES — Engine functions for compliance checks
 * Consumed by regulatoryEngine.ts (re-exported) and the regulatory router
 */

import type {
  TrailerSpec, UserRoleType, ProductCategory,
  RegulatoryRequirement, ComplianceCheckResult, JurisdictionProfile,
} from "./regulatoryEngine";
import { FEDERAL_REQUIREMENTS, STATE_PROFILES } from "./regulatoryData";

// ============================================================================
// HELPERS
// ============================================================================

function isHazmatProduct(cat: ProductCategory): boolean {
  return !["dry_freight", "refrigerated", "oversize", "livestock"].includes(cat);
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function matchesAppliesTo(
  req: RegulatoryRequirement,
  trailerType: TrailerSpec,
  userRole: UserRoleType,
  productCategory: ProductCategory,
  state: string,
  city?: string
): boolean {
  const a = req.appliesTo;
  if (a.trailerTypes !== "ALL" && !a.trailerTypes.includes(trailerType)) return false;
  if (a.userRoles !== "ALL" && !a.userRoles.includes(userRole)) return false;
  if (a.productCategories !== "ALL" && !a.productCategories.includes(productCategory)) return false;
  if (a.states !== "ALL" && !a.states.includes(state.toUpperCase())) return false;
  if (a.cities && city && !a.cities.includes(city.toLowerCase())) return false;
  return true;
}

// ============================================================================
// MAIN QUERY FUNCTIONS
// ============================================================================

/**
 * Get all applicable regulatory requirements for a given combination
 */
export function getRequirements(
  trailerType: TrailerSpec,
  userRole: UserRoleType,
  productCategory: ProductCategory,
  states: string[],
  cities?: Record<string, string>
): ComplianceCheckResult[] {
  const results: ComplianceCheckResult[] = [];

  for (const state of states) {
    const stateUpper = state.toUpperCase();
    const city = cities?.[stateUpper]?.toLowerCase();

    const applicable: RegulatoryRequirement[] = FEDERAL_REQUIREMENTS.filter(req =>
      matchesAppliesTo(req, trailerType, userRole, productCategory, stateUpper, city)
    );

    const profile = STATE_PROFILES[stateUpper];
    if (profile) {
      if (profile.hazmatPermitRequired && isHazmatProduct(productCategory)) {
        applicable.push({
          id: `STATE-${stateUpper}-HAZMAT-PERMIT`,
          category: "permit",
          title: `${profile.stateName} Hazmat Transport Permit`,
          description: `State-specific hazmat transport permit required in ${profile.stateName}`,
          regulation: `${profile.stateName} DOT regulations`,
          authority: `${profile.stateName} DOT`,
          appliesTo: { trailerTypes: "ALL", userRoles: ["carrier", "owner_operator"], productCategories: "ALL", states: [stateUpper] },
          severity: "mandatory",
        });
      }

      for (const rule of profile.specialRules) {
        applicable.push({
          id: `STATE-${stateUpper}-RULE-${hashCode(rule)}`,
          category: "operational",
          title: `${profile.stateName} — Special Rule`,
          description: rule,
          regulation: `${profile.stateName} state regulations`,
          authority: `${profile.stateName} DOT`,
          appliesTo: { trailerTypes: "ALL", userRoles: "ALL", productCategories: "ALL", states: [stateUpper] },
          severity: "recommended",
        });
      }

      if (city && profile.cities[city]) {
        const co = profile.cities[city];
        for (const restr of co.hazmatRestrictions) {
          applicable.push({
            id: `CITY-${stateUpper}-${city}-HAZ-${hashCode(restr)}`,
            category: "operational",
            title: `${co.name}, ${stateUpper} — Hazmat Restriction`,
            description: restr,
            regulation: `${co.name} municipal ordinance`,
            authority: `City of ${co.name}`,
            appliesTo: { trailerTypes: "ALL", userRoles: "ALL", productCategories: "ALL", states: [stateUpper], cities: [city] },
            severity: "mandatory",
          });
        }
        for (const tr of co.timeRestrictions) {
          applicable.push({
            id: `CITY-${stateUpper}-${city}-TIME-${hashCode(tr)}`,
            category: "operational",
            title: `${co.name}, ${stateUpper} — Time Restriction`,
            description: tr,
            regulation: `${co.name} municipal ordinance`,
            authority: `City of ${co.name}`,
            appliesTo: { trailerTypes: "ALL", userRoles: "ALL", productCategories: "ALL", states: [stateUpper], cities: [city] },
            severity: "conditional",
          });
        }
        for (const rr of co.routeRestrictions) {
          applicable.push({
            id: `CITY-${stateUpper}-${city}-ROUTE-${hashCode(rr)}`,
            category: "operational",
            title: `${co.name}, ${stateUpper} — Route Restriction`,
            description: rr,
            regulation: `${co.name} municipal ordinance`,
            authority: `City of ${co.name}`,
            appliesTo: { trailerTypes: "ALL", userRoles: "ALL", productCategories: "ALL", states: [stateUpper], cities: [city] },
            severity: "conditional",
          });
        }
        for (const ap of co.additionalPermits) {
          applicable.push({
            id: `CITY-${stateUpper}-${city}-PERMIT-${hashCode(ap)}`,
            category: "permit",
            title: `${co.name}, ${stateUpper} — Additional Permit`,
            description: ap,
            regulation: `${co.name} municipal ordinance`,
            authority: `City of ${co.name}`,
            appliesTo: { trailerTypes: "ALL", userRoles: "ALL", productCategories: "ALL", states: [stateUpper], cities: [city] },
            severity: "mandatory",
          });
        }
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    const deduped = applicable.filter(r => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    const byCategory: Record<string, number> = {};
    for (const r of deduped) byCategory[r.category] = (byCategory[r.category] || 0) + 1;

    let estimatedCost = 0;
    for (const r of deduped) {
      if (r.estimatedCost) {
        const match = r.estimatedCost.match(/\$([\d,]+)/);
        if (match) estimatedCost += parseInt(match[1].replace(/,/g, ""), 10);
      }
    }

    results.push({
      jurisdiction: city ? `${city}, ${stateUpper}` : stateUpper,
      trailerType, userRole, productCategory,
      requirements: deduped,
      summary: {
        total: deduped.length,
        mandatory: deduped.filter(r => r.severity === "mandatory").length,
        conditional: deduped.filter(r => r.severity === "conditional").length,
        recommended: deduped.filter(r => r.severity === "recommended").length,
        byCategory,
      },
      estimatedTotalCost: estimatedCost,
      missingItems: [],
    });
  }
  return results;
}

/**
 * Get a specific state's full profile
 */
export function getStateProfile(state: string): JurisdictionProfile | null {
  return STATE_PROFILES[state.toUpperCase()] || null;
}

/**
 * Get all states with profiles
 */
export function getAllStateProfiles(): JurisdictionProfile[] {
  return Object.values(STATE_PROFILES);
}

/**
 * Get requirements for a specific category only
 */
export function getRequirementsByCategory(
  category: RegulatoryRequirement["category"],
  trailerType?: TrailerSpec,
  userRole?: UserRoleType,
  productCategory?: ProductCategory
): RegulatoryRequirement[] {
  return FEDERAL_REQUIREMENTS.filter(r => {
    if (r.category !== category) return false;
    if (trailerType && r.appliesTo.trailerTypes !== "ALL" && !r.appliesTo.trailerTypes.includes(trailerType)) return false;
    if (userRole && r.appliesTo.userRoles !== "ALL" && !r.appliesTo.userRoles.includes(userRole)) return false;
    if (productCategory && r.appliesTo.productCategories !== "ALL" && !r.appliesTo.productCategories.includes(productCategory)) return false;
    return true;
  });
}
