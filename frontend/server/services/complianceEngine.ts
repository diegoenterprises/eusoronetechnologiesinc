/**
 * COMPLIANCE ENGINE
 * Smart resolution of required documents based on:
 *  - Company registered state (DOT/MC authority)
 *  - Driver CDL state
 *  - Operations type (hazmat, tanker, oversize, etc.)
 *  - Equipment types in fleet
 *  - Products hauled (crude oil, refined fuel, dairy, etc.)
 *  - Operating states (routes)
 *  - Role (DRIVER, CATALYST, SHIPPER, BROKER, etc.)
 *
 * This engine is the single source of truth for "what documents does
 * this company/driver need?" and is consumed by:
 *  - Registration flow (auto-seed + real-time preview)
 *  - Onboarding checklist
 *  - ComplianceDashboard
 *  - Document Center
 *  - Load lifecycle guards
 */

import { documentTypesSeed } from "../seeds/documentTypesSeed";
import { stateRequirementsSeed } from "../seeds/stateRequirementsSeed";
import { resolveComplianceMatrix, PRODUCT_CATALOG } from "../seeds/complianceMatrix";
import type { ResolvedRule } from "../seeds/complianceMatrix";

// ─── Types ───────────────────────────────────────────────────────────

export interface CompanyProfile {
  companyId: number;
  state: string;              // registered state (2-letter)
  dotNumber?: string;
  mcNumber?: string;
  role: string;               // CATALYST | SHIPPER | BROKER
  hazmatAuthorized?: boolean;
  tankerEndorsed?: boolean;
  oversizeOps?: boolean;
  equipmentTypes?: string[];  // DRY_VAN, REEFER, FLATBED, TANKER, HOPPER, etc.
  products?: string[];        // crude_oil, refined_fuel, milk, produce, etc.
  operatingStates?: string[]; // states the company operates in
  fleetSize?: number;
  hasBrokerAuthority?: boolean;
}

export interface DriverProfile {
  userId: number;
  companyId?: number;
  cdlState: string;           // CDL issuing state
  companyState?: string;      // company's registered state
  role: string;               // DRIVER | OWNER_OPERATOR
  cdlClass?: string;          // A, B, C
  endorsements?: string[];    // H, N, T, P, S, X
  hazmatEndorsed?: boolean;
  tankerEndorsed?: boolean;
  twicCard?: boolean;
  employmentType?: string;    // W2, 1099
}

export type RequirementPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type RequirementStatus = "REQUIRED" | "CONDITIONAL" | "RECOMMENDED";

export interface ResolvedRequirement {
  documentTypeId: string;
  name: string;
  shortName?: string;
  category: string;
  description?: string;
  priority: RequirementPriority;
  status: RequirementStatus;
  reason: string;                // why this doc is required
  sourceUrl?: string;
  downloadUrl?: string;
  instructionsUrl?: string;
  hasExpiration: boolean;
  typicalValidityDays?: number;
  expirationWarningDays?: number;
  isStateSpecific: boolean;
  stateCode?: string;
  statePortalUrl?: string;
  stateIssuingAgency?: string;
  stateFormUrl?: string;
  validityPeriod?: string;
  conditions?: Record<string, any>;
  group: string;                 // logical grouping for UI
  sortOrder: number;
}

export interface ComplianceProfile {
  entityType: "company" | "driver";
  entityId: number;
  registeredState: string;
  role: string;
  resolvedAt: string;
  requirements: ResolvedRequirement[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    byGroup: Record<string, number>;
    stateSpecificCount: number;
    operatingStatesCount: number;
  };
}

// ─── Lookup maps ─────────────────────────────────────────────────────

const DOC_TYPE_MAP = new Map(documentTypesSeed.map(d => [d.id, d]));

const STATE_REQ_BY_STATE = new Map<string, typeof stateRequirementsSeed>();
for (const req of stateRequirementsSeed) {
  const key = req.stateCode;
  if (!STATE_REQ_BY_STATE.has(key)) STATE_REQ_BY_STATE.set(key, []);
  STATE_REQ_BY_STATE.get(key)!.push(req);
}

const STATE_REQ_BY_TYPE = new Map<string, typeof stateRequirementsSeed>();
for (const req of stateRequirementsSeed) {
  const key = req.documentTypeId;
  if (!STATE_REQ_BY_TYPE.has(key)) STATE_REQ_BY_TYPE.set(key, []);
  STATE_REQ_BY_TYPE.get(key)!.push(req);
}

// Weight-distance tax states
const WEIGHT_DISTANCE_STATES = new Set(["OR", "NM", "NY", "KY"]);

// CARB compliance states
const CARB_STATES = new Set(["CA"]);

// States requiring port-of-entry check
const PORT_OF_ENTRY_STATES = new Set(["CA", "AZ", "NM", "OR", "ID", "MT", "WY", "UT", "NV", "CO"]);

// IFTA member states (all except AK, HI)
const NON_IFTA_STATES = new Set(["AK", "HI"]);

// ─── Helper ──────────────────────────────────────────────────────────

function docToReq(
  docId: string,
  priority: RequirementPriority,
  status: RequirementStatus,
  reason: string,
  group: string,
  stateOverride?: { stateCode: string; portalUrl?: string; agency?: string; formUrl?: string; validityPeriod?: string },
): ResolvedRequirement | null {
  const dt = DOC_TYPE_MAP.get(docId);
  if (!dt) return null;
  return {
    documentTypeId: dt.id,
    name: dt.name,
    shortName: (dt as any).shortName,
    category: dt.category,
    description: dt.description,
    priority,
    status,
    reason,
    sourceUrl: dt.sourceUrl,
    downloadUrl: (dt as any).downloadUrl,
    instructionsUrl: (dt as any).instructionsUrl,
    hasExpiration: dt.hasExpiration ?? false,
    typicalValidityDays: dt.typicalValidityDays,
    expirationWarningDays: dt.expirationWarningDays,
    isStateSpecific: !!(dt as any).isStateSpecific || !!stateOverride,
    stateCode: stateOverride?.stateCode,
    statePortalUrl: stateOverride?.portalUrl,
    stateIssuingAgency: stateOverride?.agency,
    stateFormUrl: stateOverride?.formUrl,
    validityPeriod: stateOverride?.validityPeriod,
    group,
    sortOrder: dt.sortOrder || 999,
  };
}

function addStateReqs(
  reqs: ResolvedRequirement[],
  stateCode: string,
  docTypeId: string,
  priority: RequirementPriority,
  status: RequirementStatus,
  reason: string,
  group: string,
) {
  // Find the specific state entry from the seed
  const stateEntries = (STATE_REQ_BY_STATE.get(stateCode) || []).filter(e => e.documentTypeId === docTypeId);
  if (stateEntries.length > 0) {
    for (const entry of stateEntries) {
      const r = docToReq(docTypeId, priority, status, reason, group, {
        stateCode: entry.stateCode,
        portalUrl: entry.statePortalUrl,
        agency: entry.stateIssuingAgency,
        formUrl: entry.stateFormUrl,
        validityPeriod: entry.validityPeriod,
      });
      if (r) reqs.push(r);
    }
  } else {
    // Fallback: use the generic doc type
    const r = docToReq(docTypeId, priority, status, reason, group, { stateCode });
    if (r) reqs.push(r);
  }
}

// ─── COMPANY COMPLIANCE RESOLVER ─────────────────────────────────────

export function resolveCompanyCompliance(profile: CompanyProfile): ComplianceProfile {
  const reqs: ResolvedRequirement[] = [];
  const st = profile.state?.toUpperCase() || "";

  // ── 1. FEDERAL AUTHORITY (always required for motor carriers) ──
  if (profile.role === "CATALYST" || profile.role === "OWNER_OPERATOR") {
    reqs.push(docToReq("USDOT_NUMBER", "CRITICAL", "REQUIRED", "Federal requirement for all interstate motor carriers (49 CFR 390.19)", "Federal Authority")!);
    reqs.push(docToReq("MC_AUTHORITY", "CRITICAL", "REQUIRED", "Required for for-hire motor carriers (49 CFR 365)", "Federal Authority")!);
    reqs.push(docToReq("MCS150", "HIGH", "REQUIRED", "Biennial update required (49 CFR 390.19)", "Federal Authority")!);
    reqs.push(docToReq("BOC3", "CRITICAL", "REQUIRED", "Process agent designation required in all operating states (49 CFR 366)", "Federal Authority")!);
    reqs.push(docToReq("NEW_ENTRANT_AUDIT", "HIGH", "CONDITIONAL", "Required within first 18 months of operation", "Federal Authority")!);
    reqs.push(docToReq("SAFETY_RATING", "MEDIUM", "RECOMMENDED", "FMCSA safety fitness determination", "Federal Authority")!);
    reqs.push(docToReq("UCR", "HIGH", "REQUIRED", "Annual UCR registration required for interstate carriers", "Federal Compliance")!);
  }

  if (profile.hasBrokerAuthority || profile.role === "BROKER") {
    reqs.push(docToReq("BROKER_AUTHORITY", "CRITICAL", "REQUIRED", "Required for property broker operations (49 CFR 365)", "Federal Authority")!);
    reqs.push(docToReq("SURETY_BOND", "CRITICAL", "REQUIRED", "$75,000 surety bond required for brokers (49 CFR 387.307)", "Insurance & Bonds")!);
  }

  // ── 2. INSURANCE (always required) ──
  if (profile.role === "CATALYST" || profile.role === "OWNER_OPERATOR") {
    reqs.push(docToReq("AUTO_LIABILITY", "CRITICAL", "REQUIRED", "Primary liability insurance required (49 CFR 387)", "Insurance & Bonds")!);
    reqs.push(docToReq("CARGO_INSURANCE", "HIGH", "REQUIRED", "Cargo insurance covering goods in transit", "Insurance & Bonds")!);
    reqs.push(docToReq("GENERAL_LIABILITY", "HIGH", "REQUIRED", "General business liability coverage", "Insurance & Bonds")!);
    reqs.push(docToReq("WORKERS_COMP", "HIGH", "REQUIRED", "Workers compensation for employee injuries", "Insurance & Bonds")!);
    reqs.push(docToReq("PHYSICAL_DAMAGE", "MEDIUM", "RECOMMENDED", "Vehicle damage coverage (collision/comprehensive)", "Insurance & Bonds")!);
    reqs.push(docToReq("UMBRELLA_LIABILITY", "LOW", "RECOMMENDED", "Additional liability above primary limits", "Insurance & Bonds")!);
  }

  if (profile.role === "SHIPPER") {
    reqs.push(docToReq("GENERAL_LIABILITY", "HIGH", "REQUIRED", "General liability for shipper operations", "Insurance & Bonds")!);
  }

  // ── 3. TAX DOCUMENTS ──
  reqs.push(docToReq("W9", "CRITICAL", "REQUIRED", "Required for all business entities (IRS)", "Tax & Financial")!);
  reqs.push(docToReq("EIN_VERIFICATION", "HIGH", "REQUIRED", "IRS confirmation of Employer Identification Number", "Tax & Financial")!);
  reqs.push(docToReq("ACH_AUTH", "HIGH", "REQUIRED", "Bank account authorization for electronic payments", "Tax & Financial")!);

  if (profile.role === "CATALYST" || profile.role === "OWNER_OPERATOR") {
    reqs.push(docToReq("FORM_2290", "HIGH", "REQUIRED", "Annual HVUT for vehicles 55,000+ lbs (IRS)", "Tax & Financial")!);
    reqs.push(docToReq("VOIDED_CHECK", "MEDIUM", "REQUIRED", "Proof of bank account ownership", "Tax & Financial")!);
  }

  // ── 4. HAZMAT (conditional) ──
  if (profile.hazmatAuthorized) {
    reqs.push(docToReq("HAZMAT_REGISTRATION", "CRITICAL", "REQUIRED", "Annual PHMSA registration for hazmat transporters (49 CFR 107.601)", "Hazmat Compliance")!);
    reqs.push(docToReq("HAZMAT_SECURITY_PLAN", "CRITICAL", "REQUIRED", "Written security plan required (49 CFR 172.800)", "Hazmat Compliance")!);
    reqs.push(docToReq("HAZMAT_SAFETY_PERMIT", "HIGH", "CONDITIONAL", "FMCSA safety permit for certain hazmat classes (49 CFR 385.403)", "Hazmat Compliance")!);
    reqs.push(docToReq("EPA_ID", "HIGH", "CONDITIONAL", "EPA ID for hazardous waste transport (40 CFR 263)", "Hazmat Compliance")!);
  }

  if (profile.role === "SHIPPER" && profile.hazmatAuthorized) {
    reqs.push(docToReq("HAZMAT_REGISTRATION", "CRITICAL", "REQUIRED", "PHMSA registration for hazmat shippers", "Hazmat Compliance")!);
    reqs.push(docToReq("HAZMAT_SECURITY_PLAN", "HIGH", "REQUIRED", "Security plan for hazmat shippers", "Hazmat Compliance")!);
  }

  // ── 5. EQUIPMENT-SPECIFIC ──
  const eqTypes = new Set((profile.equipmentTypes || []).map(e => e.toUpperCase()));

  if (eqTypes.has("REEFER") || eqTypes.has("REFRIGERATED")) {
    reqs.push(docToReq("FOOD_SAFETY_CERT", "HIGH", "REQUIRED", "FSMA sanitary transportation certification for reefer operations", "Equipment Compliance")!);
  }
  if (eqTypes.has("TANKER") || eqTypes.has("TANK") || profile.tankerEndorsed) {
    reqs.push(docToReq("CARGO_TANK_TEST", "CRITICAL", "REQUIRED", "Cargo tank inspection per 49 CFR 180.407", "Equipment Compliance")!);
    reqs.push(docToReq("TANK_WASHOUT_CERT", "HIGH", "REQUIRED", "Tank cleaning certification between loads", "Equipment Compliance")!);
    reqs.push(docToReq("VAPOR_RECOVERY_CERT", "HIGH", "CONDITIONAL", "Vapor recovery system cert for petroleum tankers", "Equipment Compliance")!);
    reqs.push(docToReq("PRESSURE_RELIEF_TEST", "MEDIUM", "REQUIRED", "PRD testing for pressurized tanks", "Equipment Compliance")!);
  }
  if (eqTypes.has("FLATBED") || eqTypes.has("STEP_DECK") || eqTypes.has("LOWBOY") || profile.oversizeOps) {
    reqs.push(docToReq("OVERSIZE_PERMIT", "HIGH", "CONDITIONAL", "State permits for oversize/overweight loads", "Equipment Compliance")!);
    reqs.push(docToReq("LOAD_SECUREMENT_TRAINING", "HIGH", "REQUIRED", "Cargo securement training per 49 CFR 393", "Equipment Compliance")!);
  }
  if (eqTypes.has("HOPPER") || eqTypes.has("PNEUMATIC") || eqTypes.has("DRY_BULK")) {
    reqs.push(docToReq("BULK_LOADING_CERT", "HIGH", "REQUIRED", "Pneumatic loading/unloading training", "Equipment Compliance")!);
    reqs.push(docToReq("HOPPER_INSPECTION", "HIGH", "REQUIRED", "Pneumatic system inspection record", "Equipment Compliance")!);
  }

  // ── 5b. PRODUCT-AWARE COMPLIANCE (Smart Matrix) ──
  // Resolves additional requirements based on specific products hauled
  if (profile.products && profile.products.length > 0) {
    const matrixResults = resolveComplianceMatrix({
      trailerTypes: profile.equipmentTypes || [],
      products: profile.products,
    });

    for (const mr of matrixResults) {
      const r = docToReq(
        mr.rule.documentTypeId,
        mr.rule.priority,
        mr.rule.status,
        mr.rule.reason,
        mr.rule.group,
      );
      if (r) reqs.push(r);
    }

    // Auto-detect hazmat from products if not explicitly set
    const hasHazmatProduct = profile.products.some(p => {
      const def = PRODUCT_CATALOG.find(pc => pc.id === p);
      return def?.requiresHazmat;
    });
    if (hasHazmatProduct && !profile.hazmatAuthorized) {
      // Add hazmat requirements that would otherwise be missed
      const hazReq = docToReq("HAZMAT_REGISTRATION", "CRITICAL", "REQUIRED",
        "Your product selections include hazmat materials — PHMSA registration required", "Hazmat Compliance");
      if (hazReq) reqs.push(hazReq);
    }
  }

  // ── 6. VEHICLE DOCS (always for carriers) ──
  if (profile.role === "CATALYST" || profile.role === "OWNER_OPERATOR") {
    reqs.push(docToReq("VEHICLE_REGISTRATION", "HIGH", "REQUIRED", "State vehicle registration for all power units", "Vehicle & Fleet")!);
    reqs.push(docToReq("VEHICLE_TITLE", "MEDIUM", "REQUIRED", "Title showing ownership for all vehicles", "Vehicle & Fleet")!);
    reqs.push(docToReq("ANNUAL_INSPECTION", "CRITICAL", "REQUIRED", "Annual DOT vehicle safety inspection (49 CFR 396.17)", "Vehicle & Fleet")!);
    reqs.push(docToReq("TRAILER_REGISTRATION", "HIGH", "REQUIRED", "State trailer registration", "Vehicle & Fleet")!);
  }

  // ── 7. SAFETY & COMPLIANCE PROGRAMS ──
  if (profile.role === "CATALYST" || profile.role === "OWNER_OPERATOR") {
    reqs.push(docToReq("DRUG_ALCOHOL_POLICY", "HIGH", "REQUIRED", "Company D&A policy required (49 CFR 382.601)", "Safety Programs")!);
    reqs.push(docToReq("CLEARINGHOUSE_QUERY", "HIGH", "REQUIRED", "FMCSA Clearinghouse registration required (49 CFR 382.701)", "Safety Programs")!);
  }

  // ── 8. LEGAL AGREEMENTS ──
  reqs.push(docToReq("TERMS_OF_SERVICE", "HIGH", "REQUIRED", "EusoTrip platform terms acceptance", "Legal Agreements")!);
  reqs.push(docToReq("PRIVACY_POLICY_ACK", "HIGH", "REQUIRED", "Privacy policy acknowledgment", "Legal Agreements")!);

  if (profile.role === "CATALYST") {
    reqs.push(docToReq("BROKER_CARRIER_AGREEMENT", "HIGH", "REQUIRED", "Broker-carrier agreement for load tendering", "Legal Agreements")!);
  }
  if (profile.role === "SHIPPER") {
    reqs.push(docToReq("SHIPPER_AGREEMENT", "HIGH", "REQUIRED", "Shipper terms and conditions", "Legal Agreements")!);
  }

  // ── 9. STATE-SPECIFIC: HOME STATE ──
  if (st) {
    // IFTA
    if (!NON_IFTA_STATES.has(st)) {
      addStateReqs(reqs, st, "STATE_IFTA", "CRITICAL", "REQUIRED",
        `IFTA license required — ${st} is your base jurisdiction`, "State Compliance: " + st);
    } else {
      addStateReqs(reqs, st, "STATE_FUEL_PERMIT", "HIGH", "REQUIRED",
        `${st} is not an IFTA member — separate fuel permit required`, "State Compliance: " + st);
    }

    // IRP
    addStateReqs(reqs, st, "STATE_CDL", "CRITICAL", "REQUIRED",
      `CDL from registered state ${st}`, "State Compliance: " + st);

    // California-specific
    if (st === "CA") {
      const caReqs = STATE_REQ_BY_STATE.get("CA") || [];
      for (const cr of caReqs) {
        if (cr.documentTypeId === "CARB_COMPLIANCE" || cr.documentTypeId === "CA_MCP") {
          addStateReqs(reqs, "CA", cr.documentTypeId, "CRITICAL", "REQUIRED",
            `California-specific requirement: ${cr.documentTypeId}`, "State Compliance: CA");
        }
      }
    }

    // Weight-distance tax
    if (WEIGHT_DISTANCE_STATES.has(st)) {
      addStateReqs(reqs, st, "STATE_WEIGHT_PERMIT", "HIGH", "REQUIRED",
        `${st} imposes weight-distance tax — registration required`, "State Compliance: " + st);
    }
  }

  // ── 10. STATE-SPECIFIC: OPERATING STATES ──
  const opStates = (profile.operatingStates || []).map(s => s.toUpperCase()).filter(s => s !== st);
  for (const os of opStates) {
    // Weight-distance tax in operating states
    if (WEIGHT_DISTANCE_STATES.has(os)) {
      addStateReqs(reqs, os, "STATE_WEIGHT_PERMIT", "HIGH", "REQUIRED",
        `${os} weight-distance tax applies when operating in ${os}`, "State Compliance: " + os);
    }
    // California CARB for any carrier entering CA
    if (CARB_STATES.has(os) && st !== "CA") {
      addStateReqs(reqs, "CA", "CARB_COMPLIANCE", "CRITICAL", "REQUIRED",
        "CARB Truck & Bus compliance required when entering California", "State Compliance: CA");
    }
    // Oversize permits for operating states (if applicable)
    if (profile.oversizeOps) {
      const osEntry = (STATE_REQ_BY_STATE.get(os) || []).find(e => e.documentTypeId === "OVERSIZE_PERMIT");
      if (osEntry) {
        addStateReqs(reqs, os, "OVERSIZE_PERMIT", "HIGH", "REQUIRED",
          `Oversize permit required in ${os}`, "State Compliance: " + os);
      }
    }
  }

  // ── 11. OPS TEMPLATES ──
  if (profile.role === "CATALYST" || profile.role === "SHIPPER") {
    reqs.push(docToReq("BOL_TEMPLATE", "MEDIUM", "RECOMMENDED", "Standard bill of lading template", "Operations")!);
    reqs.push(docToReq("RATE_CONFIRMATION", "MEDIUM", "RECOMMENDED", "Rate confirmation template", "Operations")!);
  }
  if (profile.hazmatAuthorized) {
    reqs.push(docToReq("HAZMAT_BOL_TEMPLATE", "HIGH", "REQUIRED", "Hazmat shipping paper template (49 CFR 172.200)", "Operations")!);
  }

  // Filter out nulls
  const filtered = reqs.filter(Boolean);

  // Deduplicate by documentTypeId + stateCode
  const seen = new Set<string>();
  const deduped: ResolvedRequirement[] = [];
  for (const r of filtered) {
    const key = `${r.documentTypeId}:${r.stateCode || ""}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(r);
    }
  }

  // Sort: CRITICAL first, then by group, then sortOrder
  const priorityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  deduped.sort((a, b) => {
    const pDiff = (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
    if (pDiff !== 0) return pDiff;
    if (a.group !== b.group) return a.group.localeCompare(b.group);
    return a.sortOrder - b.sortOrder;
  });

  const byGroup: Record<string, number> = {};
  for (const r of deduped) {
    byGroup[r.group] = (byGroup[r.group] || 0) + 1;
  }

  return {
    entityType: "company",
    entityId: profile.companyId,
    registeredState: st,
    role: profile.role,
    resolvedAt: new Date().toISOString(),
    requirements: deduped,
    summary: {
      total: deduped.length,
      critical: deduped.filter(r => r.priority === "CRITICAL").length,
      high: deduped.filter(r => r.priority === "HIGH").length,
      medium: deduped.filter(r => r.priority === "MEDIUM").length,
      low: deduped.filter(r => r.priority === "LOW").length,
      byGroup,
      stateSpecificCount: deduped.filter(r => r.isStateSpecific).length,
      operatingStatesCount: opStates.length,
    },
  };
}

// ─── DRIVER COMPLIANCE RESOLVER ──────────────────────────────────────

export function resolveDriverCompliance(profile: DriverProfile): ComplianceProfile {
  const reqs: ResolvedRequirement[] = [];
  const st = profile.cdlState?.toUpperCase() || "";

  // ── 1. CDL & LICENSING ──
  addStateReqs(reqs, st, "STATE_CDL", "CRITICAL", "REQUIRED",
    `CDL from ${st} — your issuing state`, "CDL & Licensing");

  reqs.push(docToReq("MEDICAL_CERT", "CRITICAL", "REQUIRED", "DOT physical medical certificate required (49 CFR 391.43)", "CDL & Licensing")!);
  reqs.push(docToReq("MEDICAL_EXAM_LONG", "CRITICAL", "REQUIRED", "Complete DOT physical examination report", "CDL & Licensing")!);
  reqs.push(docToReq("MVR", "HIGH", "REQUIRED", "Motor vehicle record from ${st} DMV (49 CFR 391.23)", "CDL & Licensing")!);
  reqs.push(docToReq("PSP_REPORT", "HIGH", "REQUIRED", "FMCSA pre-employment screening (crash + inspection history)", "CDL & Licensing")!);

  // ── 2. ENDORSEMENT-SPECIFIC ──
  const endorsements = new Set((profile.endorsements || []).map(e => e.toUpperCase()));

  if (profile.hazmatEndorsed || endorsements.has("H") || endorsements.has("X")) {
    reqs.push(docToReq("HAZMAT_ENDORSEMENT", "CRITICAL", "REQUIRED", "H endorsement required for hazmat transport (49 CFR 383.93)", "Endorsements")!);
    reqs.push(docToReq("HAZMAT_TRAINING_CERT", "CRITICAL", "REQUIRED", "Hazmat handling training certification (49 CFR 172.704)", "Endorsements")!);
  }

  if (profile.tankerEndorsed || endorsements.has("N") || endorsements.has("X")) {
    reqs.push(docToReq("TANKER_ENDORSEMENT", "HIGH", "REQUIRED", "N endorsement required for tank vehicles (49 CFR 383.93)", "Endorsements")!);
  }

  if (endorsements.has("T")) {
    reqs.push(docToReq("DOUBLES_TRIPLES", "HIGH", "REQUIRED", "T endorsement for doubles/triples", "Endorsements")!);
  }

  if (endorsements.has("P")) {
    reqs.push(docToReq("PASSENGER_ENDORSEMENT", "MEDIUM", "REQUIRED", "P endorsement for passenger vehicles", "Endorsements")!);
  }

  if (profile.twicCard) {
    reqs.push(docToReq("TWIC", "HIGH", "REQUIRED", "TWIC card for secure area access (49 CFR 1572)", "Endorsements")!);
  }

  // ── 3. SAFETY & TESTING ──
  reqs.push(docToReq("DOT_DRUG_TEST", "CRITICAL", "REQUIRED", "Pre-employment drug test required (49 CFR 382)", "Safety & Testing")!);
  reqs.push(docToReq("DOT_ALCOHOL_TEST", "HIGH", "REQUIRED", "Alcohol test results (49 CFR 382)", "Safety & Testing")!);
  reqs.push(docToReq("CLEARINGHOUSE_QUERY", "HIGH", "REQUIRED", "FMCSA Clearinghouse query consent (49 CFR 382.701)", "Safety & Testing")!);
  reqs.push(docToReq("DRIVER_SAFETY_TRAINING", "MEDIUM", "REQUIRED", "Driver safety training completion", "Safety & Testing")!);
  reqs.push(docToReq("ELD_TRAINING", "HIGH", "REQUIRED", "ELD usage training (49 CFR 395.22)", "Safety & Testing")!);
  reqs.push(docToReq("DVIR_TRAINING", "MEDIUM", "REQUIRED", "DVIR training (49 CFR 396.11)", "Safety & Testing")!);
  reqs.push(docToReq("DEFENSIVE_DRIVING", "LOW", "RECOMMENDED", "Defensive driving course", "Safety & Testing")!);

  // ── 4. EMPLOYMENT ──
  reqs.push(docToReq("DRIVER_APPLICATION", "HIGH", "REQUIRED", "FMCSA-compliant driver application (49 CFR 391.21)", "Employment")!);
  reqs.push(docToReq("EMPLOYMENT_HISTORY", "HIGH", "REQUIRED", "10-year employment history verification (49 CFR 391.23)", "Employment")!);
  reqs.push(docToReq("ROAD_TEST_CERT", "MEDIUM", "REQUIRED", "Road test certification (49 CFR 391.31)", "Employment")!);
  reqs.push(docToReq("BACKGROUND_CHECK_AUTH", "HIGH", "REQUIRED", "Background check consent", "Employment")!);
  reqs.push(docToReq("ANNUAL_MVR_REVIEW", "HIGH", "REQUIRED", "Annual driving record review (49 CFR 391.25)", "Employment")!);

  // ── 5. TAX ──
  if (profile.employmentType === "1099" || profile.role === "OWNER_OPERATOR") {
    reqs.push(docToReq("W9", "HIGH", "REQUIRED", "W-9 required for independent contractors", "Tax & Financial")!);
  } else {
    reqs.push(docToReq("W4", "HIGH", "REQUIRED", "W-4 withholding certificate for employees", "Tax & Financial")!);
  }
  reqs.push(docToReq("I9", "CRITICAL", "REQUIRED", "Employment eligibility verification (8 CFR 274a)", "Tax & Financial")!);

  // ── 6. OWNER-OPERATOR SPECIFIC ──
  if (profile.role === "OWNER_OPERATOR") {
    reqs.push(docToReq("IC_AGREEMENT", "HIGH", "REQUIRED", "Independent contractor agreement", "Legal Agreements")!);
    reqs.push(docToReq("OO_LEASE_AGREEMENT", "HIGH", "REQUIRED", "Owner-operator lease agreement (49 CFR 376)", "Legal Agreements")!);
    reqs.push(docToReq("VEHICLE_REGISTRATION", "HIGH", "REQUIRED", "Vehicle registration for your power unit", "Vehicle & Fleet")!);
    reqs.push(docToReq("ANNUAL_INSPECTION", "CRITICAL", "REQUIRED", "Annual DOT vehicle inspection (49 CFR 396.17)", "Vehicle & Fleet")!);
    reqs.push(docToReq("AUTO_LIABILITY", "CRITICAL", "REQUIRED", "Liability insurance for your operation", "Insurance & Bonds")!);
    reqs.push(docToReq("CARGO_INSURANCE", "HIGH", "REQUIRED", "Cargo insurance", "Insurance & Bonds")!);
    reqs.push(docToReq("FORM_2290", "HIGH", "REQUIRED", "HVUT for your vehicle (IRS Form 2290)", "Tax & Financial")!);
    // IFTA for O/O
    if (!NON_IFTA_STATES.has(st)) {
      addStateReqs(reqs, st, "STATE_IFTA", "CRITICAL", "REQUIRED",
        `IFTA license from base state ${st}`, "State Compliance: " + st);
    }
  }

  // ── 7. PLATFORM ──
  reqs.push(docToReq("TERMS_OF_SERVICE", "MEDIUM", "REQUIRED", "EusoTrip platform terms", "Legal Agreements")!);
  reqs.push(docToReq("EMERGENCY_CONTACT", "MEDIUM", "REQUIRED", "Emergency contact information", "Employment")!);

  // Filter, dedupe, sort
  const filtered = reqs.filter(Boolean);
  const seen = new Set<string>();
  const deduped: ResolvedRequirement[] = [];
  for (const r of filtered) {
    const key = `${r.documentTypeId}:${r.stateCode || ""}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(r);
    }
  }

  const priorityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  deduped.sort((a, b) => {
    const pDiff = (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
    if (pDiff !== 0) return pDiff;
    if (a.group !== b.group) return a.group.localeCompare(b.group);
    return a.sortOrder - b.sortOrder;
  });

  const byGroup: Record<string, number> = {};
  for (const r of deduped) {
    byGroup[r.group] = (byGroup[r.group] || 0) + 1;
  }

  return {
    entityType: "driver",
    entityId: profile.userId,
    registeredState: st,
    role: profile.role,
    resolvedAt: new Date().toISOString(),
    requirements: deduped,
    summary: {
      total: deduped.length,
      critical: deduped.filter(r => r.priority === "CRITICAL").length,
      high: deduped.filter(r => r.priority === "HIGH").length,
      medium: deduped.filter(r => r.priority === "MEDIUM").length,
      low: deduped.filter(r => r.priority === "LOW").length,
      byGroup,
      stateSpecificCount: deduped.filter(r => r.isStateSpecific).length,
      operatingStatesCount: 0,
    },
  };
}
