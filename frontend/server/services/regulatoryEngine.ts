/**
 * REGULATORY REQUIREMENTS ENGINE
 * Platform DNA for compliance — state × city × trailer × user × product
 */

// ============================================================================
// TYPES
// ============================================================================

export type TrailerSpec =
  | "DOT-406" | "DOT-407" | "DOT-412" | "MC-331" | "MC-338"
  | "DRY_VAN" | "FLATBED" | "HOPPER" | "LOWBOY" | "REEFER"
  | "PNEUMATIC" | "TANKER_CRUDE" | "TANKER_CHEMICAL" | "INTERMODAL";

export type UserRoleType =
  | "driver" | "owner_operator" | "carrier" | "fleet_manager"
  | "dispatcher" | "shipper" | "broker" | "safety_manager"
  | "compliance_officer" | "terminal_manager" | "lumper" | "escort";

export type ProductCategory =
  | "crude_oil" | "refined_petroleum" | "lpg" | "anhydrous_ammonia"
  | "chlorine" | "sulfuric_acid" | "ammonium_nitrate" | "general_hazmat"
  | "radioactive" | "explosives" | "infectious" | "dry_freight"
  | "refrigerated" | "oversize" | "livestock";

export interface RegulatoryRequirement {
  id: string;
  category: "permit" | "endorsement" | "training" | "insurance" | "equipment" | "inspection" | "registration" | "documentation" | "operational";
  title: string;
  description: string;
  regulation: string;
  authority: string;
  appliesTo: {
    trailerTypes: TrailerSpec[] | "ALL";
    userRoles: UserRoleType[] | "ALL";
    productCategories: ProductCategory[] | "ALL";
    states: string[] | "ALL";
    cities?: string[];
  };
  renewalPeriod?: string;
  penalty?: string;
  severity: "mandatory" | "conditional" | "recommended";
  estimatedCost?: string;
  processingTime?: string;
  url?: string;
}

export interface CityOverride {
  name: string;
  hazmatRestrictions: string[];
  timeRestrictions: string[];
  routeRestrictions: string[];
  additionalPermits: string[];
}

export interface JurisdictionProfile {
  state: string;
  stateName: string;
  hazmatPermitRequired: boolean;
  oversizePermitRequired: boolean;
  fuelTaxRegistration: string;
  weightLimits: { single: number; tandem: number; gross: number };
  specialRules: string[];
  cities: Record<string, CityOverride>;
}

export interface ComplianceCheckResult {
  jurisdiction: string;
  trailerType: TrailerSpec;
  userRole: UserRoleType;
  productCategory: ProductCategory;
  requirements: RegulatoryRequirement[];
  summary: {
    total: number;
    mandatory: number;
    conditional: number;
    recommended: number;
    byCategory: Record<string, number>;
  };
  estimatedTotalCost: number;
  missingItems: string[];
}

export { FEDERAL_REQUIREMENTS } from "./regulatoryData";
export { STATE_PROFILES } from "./regulatoryData";
export { getRequirements, getStateProfile, getAllStateProfiles, getRequirementsByCategory } from "./regulatoryQueries";
