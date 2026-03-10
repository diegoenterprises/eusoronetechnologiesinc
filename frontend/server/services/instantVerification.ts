/**
 * INSTANT VERIFICATION SERVICE v1.0
 * 
 * Comprehensive carrier identity + compliance verification from FMCSA bulk data (9.8M+ records).
 * When a user enters a DOT number, the system instantly knows:
 *   - Who they are (census, legal name, DBA, address, phone, email)
 *   - What they carry (cargo types → equipment/trailer type mapping)
 *   - Their fleet composition (power units, drivers, operation type)
 *   - Their authority status (common, broker, contract, active/revoked)
 *   - Their insurance compliance (BIPD, cargo, coverage amounts, expiry)
 *   - Their safety record (SMS BASICs, crashes, inspections, violations, OOS)
 *   - Cross-reference discrepancies (user input vs FMCSA record)
 *   - ML-ready verification confidence score
 * 
 * Used by: Registration (all roles), Login enrichment, Admin audit, Compliance engine
 */

import { logger } from "../_core/logger";
import { getPool } from "../db";

// ============================================================================
// FMCSA CARGO CODE → EQUIPMENT/TRAILER TYPE MAPPING
// ============================================================================

const CARGO_TO_EQUIPMENT: Record<string, { equipment: string[]; trailerTypes: string[]; commodities: string[] }> = {
  "General Freight": {
    equipment: ["dry_van", "53ft_trailer"],
    trailerTypes: ["Dry Van", "53' Enclosed"],
    commodities: ["General Freight", "Mixed Cargo"],
  },
  "Household Goods": {
    equipment: ["moving_van", "dry_van"],
    trailerTypes: ["Moving Van", "Enclosed Trailer"],
    commodities: ["Household Goods", "Furniture"],
  },
  "Metal: Sheets, Coils, Rolls": {
    equipment: ["flatbed", "step_deck"],
    trailerTypes: ["Flatbed", "Step Deck", "Coil Hauler"],
    commodities: ["Steel", "Aluminum", "Metal Coils"],
  },
  "Motor Vehicles": {
    equipment: ["auto_carrier", "car_hauler"],
    trailerTypes: ["Auto Carrier", "Car Hauler", "Open Transport"],
    commodities: ["Vehicles", "Automobiles"],
  },
  "Drive/Tow away": {
    equipment: ["tow_truck", "rollback"],
    trailerTypes: ["Tow Truck", "Rollback"],
    commodities: ["Vehicles"],
  },
  "Logs, Poles, Beams, Lumber": {
    equipment: ["log_trailer", "flatbed"],
    trailerTypes: ["Log Trailer", "Flatbed", "Pole Trailer"],
    commodities: ["Lumber", "Timber", "Logs"],
  },
  "Building Materials": {
    equipment: ["flatbed", "step_deck"],
    trailerTypes: ["Flatbed", "Step Deck", "Conestoga"],
    commodities: ["Building Materials", "Construction Supplies"],
  },
  "Mobile Homes": {
    equipment: ["specialized", "oversize"],
    trailerTypes: ["Specialized", "Oversize Load"],
    commodities: ["Mobile Homes", "Manufactured Housing"],
  },
  "Machinery, Large Objects": {
    equipment: ["lowboy", "rgn", "step_deck"],
    trailerTypes: ["Lowboy", "RGN", "Step Deck", "Double Drop"],
    commodities: ["Heavy Equipment", "Machinery", "Industrial"],
  },
  "Fresh Produce": {
    equipment: ["reefer", "refrigerated"],
    trailerTypes: ["Refrigerated Trailer", "Reefer"],
    commodities: ["Fresh Produce", "Fruits", "Vegetables"],
  },
  "Liquids/Gases": {
    equipment: ["tanker", "tank_trailer"],
    trailerTypes: ["Tanker", "Tank Trailer", "MC-306", "MC-307", "MC-312", "MC-331"],
    commodities: ["Petroleum", "Chemicals", "Gases", "Liquids"],
  },
  "Intermodal Cont.": {
    equipment: ["container_chassis", "intermodal"],
    trailerTypes: ["Container Chassis", "20' Container", "40' Container", "53' Container"],
    commodities: ["Intermodal Freight", "Containerized Cargo"],
  },
  "Passengers": {
    equipment: ["bus", "passenger_vehicle"],
    trailerTypes: ["Bus", "Motorcoach", "Van"],
    commodities: ["Passengers"],
  },
  "Oilfield Equipment": {
    equipment: ["lowboy", "rgn", "flatbed", "specialized"],
    trailerTypes: ["Lowboy", "RGN", "Oilfield Trailer", "Flatbed"],
    commodities: ["Oilfield Equipment", "Drilling Equipment", "Pipe"],
  },
  "Livestock": {
    equipment: ["livestock_trailer", "stock_trailer"],
    trailerTypes: ["Livestock Trailer", "Stock Trailer", "Pot Trailer"],
    commodities: ["Livestock", "Cattle", "Horses"],
  },
  "Grain, Feed, Hay": {
    equipment: ["hopper", "grain_trailer"],
    trailerTypes: ["Hopper Trailer", "Grain Trailer", "Belt Trailer"],
    commodities: ["Grain", "Feed", "Hay", "Agricultural"],
  },
  "Coal/Coke": {
    equipment: ["dump_trailer", "hopper"],
    trailerTypes: ["Dump Trailer", "End Dump", "Hopper"],
    commodities: ["Coal", "Coke", "Aggregate"],
  },
  "Meat": {
    equipment: ["reefer", "refrigerated"],
    trailerTypes: ["Refrigerated Trailer", "Reefer"],
    commodities: ["Meat", "Poultry", "Frozen Foods"],
  },
  "Garbage/Refuse": {
    equipment: ["roll_off", "dump_trailer"],
    trailerTypes: ["Roll-Off Container", "Dump Trailer", "Refuse Hauler"],
    commodities: ["Waste", "Refuse", "Recyclables"],
  },
  "US Mail": {
    equipment: ["dry_van", "box_truck"],
    trailerTypes: ["Dry Van", "Box Truck", "Straight Truck"],
    commodities: ["Mail", "Parcels"],
  },
  "Chemicals": {
    equipment: ["tanker", "dry_van", "flatbed"],
    trailerTypes: ["Chemical Tanker", "Dry Van", "Flatbed"],
    commodities: ["Chemicals", "Industrial Chemicals", "Hazardous Materials"],
  },
  "Commodities Dry Bulk": {
    equipment: ["pneumatic", "hopper", "dump_trailer"],
    trailerTypes: ["Pneumatic Trailer", "Dry Bulk Tanker", "Hopper"],
    commodities: ["Dry Bulk", "Cement", "Sand", "Flour"],
  },
  "Refrigerated Food": {
    equipment: ["reefer", "refrigerated"],
    trailerTypes: ["Refrigerated Trailer", "Reefer", "Multi-Temp Reefer"],
    commodities: ["Frozen Food", "Dairy", "Refrigerated Goods"],
  },
  "Beverages": {
    equipment: ["reefer", "dry_van", "flatbed"],
    trailerTypes: ["Reefer", "Dry Van", "Flatbed"],
    commodities: ["Beverages", "Beer", "Wine", "Soft Drinks"],
  },
  "Paper Products": {
    equipment: ["dry_van", "flatbed"],
    trailerTypes: ["Dry Van", "Flatbed"],
    commodities: ["Paper", "Cardboard", "Packaging"],
  },
  "Utilities": {
    equipment: ["flatbed", "specialized"],
    trailerTypes: ["Flatbed", "Pole Trailer", "Specialized"],
    commodities: ["Utility Equipment", "Transformers", "Poles"],
  },
  "Farm Supplies": {
    equipment: ["flatbed", "hopper", "dry_van"],
    trailerTypes: ["Flatbed", "Hopper", "Dry Van"],
    commodities: ["Fertilizer", "Seeds", "Farm Supplies"],
  },
  "Construction": {
    equipment: ["dump_trailer", "flatbed", "lowboy"],
    trailerTypes: ["Dump Trailer", "Flatbed", "Lowboy"],
    commodities: ["Construction Materials", "Aggregate", "Asphalt"],
  },
  "Water Well": {
    equipment: ["specialized", "flatbed"],
    trailerTypes: ["Specialized", "Drill Rig Trailer"],
    commodities: ["Water Well Equipment", "Drilling Equipment"],
  },
};

// Carrier operation → service type mapping
const OPERATION_TO_SERVICE: Record<string, { serviceType: string; scope: string }> = {
  "Interstate": { serviceType: "For-Hire Carrier", scope: "Interstate" },
  "Intrastate Only (Non-HM)": { serviceType: "For-Hire Carrier", scope: "Intrastate" },
  "Intrastate Only (HM)": { serviceType: "Hazmat Carrier", scope: "Intrastate" },
  "Intrastate Hazmat": { serviceType: "Hazmat Carrier", scope: "Intrastate" },
  "Interstate & Intrastate": { serviceType: "For-Hire Carrier", scope: "Interstate & Intrastate" },
  "Private(Property)": { serviceType: "Private Carrier", scope: "Property" },
  "Private(Passengers)": { serviceType: "Private Carrier", scope: "Passengers" },
  "Exempt for-hire": { serviceType: "Exempt Carrier", scope: "For-Hire" },
  "U.S. Mail": { serviceType: "U.S. Mail Carrier", scope: "Interstate" },
  "Federal Government": { serviceType: "Government", scope: "Federal" },
  "State Government": { serviceType: "Government", scope: "State" },
  "Indian Tribe": { serviceType: "Government", scope: "Tribal" },
};

// ============================================================================
// TYPES
// ============================================================================

export interface InstantVerificationResult {
  // Identity
  dotNumber: string;
  legalName: string;
  dbaName: string | null;
  address: { street: string; city: string; state: string; zip: string; country: string };
  phone: string | null;
  email: string | null;

  // Fleet Intelligence
  fleet: {
    powerUnits: number;
    drivers: number;
    carrierOperation: string;
    serviceType: string;
    operationScope: string;
    isInterstate: boolean;
    isIntrastate: boolean;
    mcs150Date: string | null;
    mcs150Mileage: number;
    addDate: string | null;
  };

  // Equipment/Trailer Intelligence (derived from cargo_carried)
  equipment: {
    cargoTypes: string[];
    equipmentTypes: string[];
    trailerTypes: string[];
    commodities: string[];
    isHazmat: boolean;
    isPassenger: boolean;
    isRefrigerated: boolean;
    isTanker: boolean;
    isFlatbed: boolean;
    isOversize: boolean;
  };

  // Classification
  classification: {
    property: boolean;
    passenger: boolean;
    hazmat: boolean;
    private: boolean;
    exempt: boolean;
  };

  // Authority & Compliance
  authority: {
    status: string;
    commonAuthActive: boolean;
    brokerAuthActive: boolean;
    contractAuthActive: boolean;
    docketNumber: string | null;
    commonAuthGranted: string | null;
    brokerAuthGranted: string | null;
  } | null;

  // Insurance
  insurance: {
    bipdOnFile: boolean;
    cargoOnFile: boolean;
    activePolicies: number;
    policies: Array<{
      type: string;
      carrier: string;
      coverageTo: string | null;
      bipdLimit: number | null;
      cargoLimit: number | null;
    }>;
    isCompliant: boolean;
    nearestExpiry: string | null;
  } | null;

  // Safety Record
  safety: {
    unsafeDriving: { score: number | null; alert: boolean };
    hos: { score: number | null; alert: boolean };
    vehicleMaintenance: { score: number | null; alert: boolean };
    crashIndicator: { score: number | null; alert: boolean };
    driverFitness: { score: number | null; alert: boolean };
    controlledSubstances: { score: number | null; alert: boolean };
    hazmat: { score: number | null; alert: boolean };
    inspectionsTotal: number;
    driverOosRate: number | null;
    vehicleOosRate: number | null;
    alertCount: number;
    runDate: string | null;
  } | null;

  // Crash History
  crashes: {
    total: number;
    fatalities: number;
    injuries: number;
    towAways: number;
    recentCrashes: Array<{ date: string; state: string; fatalities: number; injuries: number }>;
  } | null;

  // OOS Status
  outOfService: boolean;
  oosReason: string | null;
  oosDate: string | null;

  // BOC-3 Filing (Process Agent designation — required for interstate carriers)
  boc3OnFile: boolean;
  boc3Agent: string | null;
  boc3Date: string | null;

  // Inspection OOS Rate (24 months)
  inspectionOosRate: number;
  inspectionTotal24mo: number;

  // Revocation History
  hasRevocation: boolean;
  revocationReason: string | null;

  // Enhanced Formula v2 — New fields
  carrierAgeDays: number;       // Days since FMCSA registration (add_date)
  isNewEntrant: boolean;        // < 18 months = new entrant (higher crash risk)
  mcs150StaleDays: number;      // Days since last MCS-150 update
  mcs150Stale: boolean;         // > 730 days = stale filing
  crashSeverity24mo: {          // 24-month crash severity breakdown
    total: number;
    fatal: number;
    injury: number;
    towAway: number;
  };
  violationsPerUnit: number;    // Violations normalized by fleet size
  totalViolations24mo: number;  // Raw violation count (24mo)
  smsBasicBreaches: string[];   // BASICs above intervention threshold
  bipdCoverageAmount: number;   // Actual BIPD coverage amount on file
  platformTrust: {              // EusoTrip platform history (if carrier on platform)
    completedLoads: number;
    onTimeRate: number;
    cancelledLoads: number;
    isOnPlatform: boolean;
  } | null;
  scoreBreakdown: {             // Transparent score components
    coreCompliance: number;     // /60
    safetyPerformance: number;  // /25
    trustSignals: number;       // /15
  };

  // Verification Confidence
  verificationScore: number; // 0-100
  verificationTier: "INSTANT_VERIFIED" | "VERIFIED" | "PARTIAL" | "UNVERIFIED" | "FLAGGED";
  flags: string[];
  docsRequired: string[];
  dataSource: "fmcsa_bulk_9.8M" | "live_api" | "not_found";
}

export interface CrossReferenceResult {
  field: string;
  userValue: string;
  fmcsaValue: string;
  match: boolean;
  severity: "info" | "warning" | "critical";
  message: string;
}

export interface ComplianceCrossReference {
  overallMatch: number; // 0-100 percentage
  discrepancies: CrossReferenceResult[];
  verified: CrossReferenceResult[];
  recommendations: string[];
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
}

export interface MLVerificationFeatures {
  dotNumber: string;
  timestamp: string;
  // Identity features
  hasLegalName: boolean;
  hasDBA: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  hasAddress: boolean;
  // Fleet features
  powerUnits: number;
  drivers: number;
  fleetSizeCategory: "solo" | "small" | "medium" | "large" | "enterprise";
  isInterstate: boolean;
  mcs150Age: number; // days since last MCS-150 update
  // Authority features
  hasAuthority: boolean;
  authorityActive: boolean;
  hasBrokerAuth: boolean;
  // Insurance features
  hasInsurance: boolean;
  insuranceCompliant: boolean;
  activePolicies: number;
  // Safety features
  hasSmsBASICs: boolean;
  alertCount: number;
  avgBasicScore: number;
  driverOosRate: number;
  vehicleOosRate: number;
  // Crash features
  totalCrashes: number;
  fatalityCrashes: number;
  // Compliance features
  isOutOfService: boolean;
  isHazmat: boolean;
  // Cross-reference features
  nameMatchScore: number;
  addressMatchScore: number;
  phoneMatchScore: number;
  fleetSizeMatchScore: number;
  overallCrossRefScore: number;
  // Derived
  verificationScore: number;
  verificationTier: string;
}

// ============================================================================
// CORE INSTANT VERIFICATION
// ============================================================================

/**
 * Full instant verification from FMCSA bulk data.
 * Returns everything the platform needs to know about a carrier at registration.
 */
export async function getInstantVerification(dotNumber: string): Promise<InstantVerificationResult | null> {
  const pool = getPool();
  if (!pool || !dotNumber) return null;

  try {
    // Parallel queries across all FMCSA tables (including BOC-3 and inspection OOS)
    const [
      [censusRows],
      [authRows],
      [insRows],
      [smsRows],
      [oosRows],
      [crashRows],
      [crashDetailRows],
      [boc3Rows],
      [inspOosRows],
      [revocationRows],
      [crashSev24Rows],
      [violationRows],
    ]: any[] = await Promise.all([
      pool.query(
        `SELECT dot_number, legal_name, dba_name, phy_street, phy_city, phy_state, phy_zip, phy_country,
                telephone, email_address, nbr_power_unit, driver_total, hm_flag, pc_flag,
                carrier_operation, cargo_carried, mcs150_date, mcs150_mileage, add_date,
                class_property, class_passenger, class_hazmat, class_private, class_exempt,
                op_interstate, op_intrastate
         FROM fmcsa_census WHERE dot_number = ? LIMIT 1`,
        [dotNumber]
      ),
      pool.query(
        `SELECT docket_number, authority_status, common_auth_granted, common_auth_revoked,
                broker_auth_granted, broker_auth_revoked, contract_auth_granted, contract_auth_revoked,
                bipd_insurance_on_file, cargo_insurance_on_file
         FROM fmcsa_authority WHERE dot_number = ? LIMIT 1`,
        [dotNumber]
      ),
      pool.query(
        `SELECT insurance_type, insurance_carrier, coverage_to, bipd_max_limit, cargo_limit
         FROM fmcsa_insurance WHERE dot_number = ? AND is_active = 1 ORDER BY coverage_to DESC LIMIT 10`,
        [dotNumber]
      ),
      pool.query(
        `SELECT unsafe_driving_score, unsafe_driving_alert, hos_score, hos_alert,
                vehicle_maintenance_score, vehicle_maintenance_alert, crash_indicator_score, crash_indicator_alert,
                driver_fitness_score, driver_fitness_alert, controlled_substances_score, controlled_substances_alert,
                hazmat_score, hazmat_alert, inspections_total, driver_oos_rate, vehicle_oos_rate, run_date
         FROM fmcsa_sms_scores WHERE dot_number = ? ORDER BY run_date DESC LIMIT 1`,
        [dotNumber]
      ),
      pool.query(
        `SELECT oos_date, oos_reason, return_to_service_date FROM fmcsa_oos_orders
         WHERE dot_number = ? AND return_to_service_date IS NULL ORDER BY oos_date DESC LIMIT 1`,
        [dotNumber]
      ),
      pool.query(
        `SELECT COUNT(*) as total, SUM(fatalities) as fatalities, SUM(injuries) as injuries,
                SUM(CASE WHEN tow_away = 'Y' THEN 1 ELSE 0 END) as tow_aways
         FROM fmcsa_crashes WHERE dot_number = ?`,
        [dotNumber]
      ),
      pool.query(
        `SELECT report_date, state, fatalities, injuries FROM fmcsa_crashes
         WHERE dot_number = ? ORDER BY report_date DESC LIMIT 5`,
        [dotNumber]
      ),
      // BOC-3 check — critical registration gate for interstate carriers
      pool.query(
        `SELECT agent_name, form_date FROM fmcsa_boc3 WHERE dot_number = ? ORDER BY form_date DESC LIMIT 1`,
        [dotNumber]
      ),
      // Recent inspection OOS rate (24 months)
      pool.query(
        `SELECT COUNT(*) AS total,
                SUM(CASE WHEN driver_oos = 'Y' OR vehicle_oos = 'Y' THEN 1 ELSE 0 END) AS oos_count
         FROM fmcsa_inspections
         WHERE dot_number = ? AND inspection_date >= DATE_SUB(NOW(), INTERVAL 24 MONTH)`,
        [dotNumber]
      ),
      // Revocation history
      pool.query(
        `SELECT revocation_date, revocation_reason FROM fmcsa_revocations
         WHERE dot_number = ? ORDER BY revocation_date DESC LIMIT 1`,
        [dotNumber]
      ),
      // Crash severity breakdown (24 months) — fatal/injury crashes carry heavy weight
      pool.query(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN fatalities > 0 THEN 1 ELSE 0 END) as fatal_crashes,
                SUM(CASE WHEN injuries > 0 THEN 1 ELSE 0 END) as injury_crashes,
                SUM(CASE WHEN tow_away = 'Y' THEN 1 ELSE 0 END) as tow_away_crashes
         FROM fmcsa_crashes
         WHERE dot_number = ? AND report_date >= DATE_SUB(NOW(), INTERVAL 24 MONTH)`,
        [dotNumber]
      ),
      // Violations count (24 months) — normalized by fleet size
      pool.query(
        `SELECT COUNT(*) as total_violations
         FROM fmcsa_violations v
         JOIN fmcsa_inspections i ON v.inspection_id = i.id
         WHERE i.dot_number = ? AND i.inspection_date >= DATE_SUB(NOW(), INTERVAL 24 MONTH)`,
        [dotNumber]
      ).catch(() => [[{ total_violations: 0 }]]),
    ]);

    const c = censusRows?.[0];
    if (!c) return null;

    const auth = authRows?.[0];
    const sms = smsRows?.[0];
    const oos = oosRows?.[0];
    const crashSummary = crashRows?.[0];
    const recentCrashes = crashDetailRows || [];
    const insPolicies = insRows || [];
    const boc3 = boc3Rows?.[0] || null;
    const inspOos = inspOosRows?.[0] || null;
    const revocation = revocationRows?.[0] || null;
    const crashSev24 = crashSev24Rows?.[0] || null;
    const violationData = violationRows?.[0] || null;

    // Parse cargo_carried (JSON or comma-separated)
    let cargoTypes: string[] = [];
    try {
      if (c.cargo_carried) {
        const parsed = typeof c.cargo_carried === "string" ? JSON.parse(c.cargo_carried) : c.cargo_carried;
        cargoTypes = Array.isArray(parsed) ? parsed.map((s: any) => String(s).trim()).filter(Boolean) : [];
      }
    } catch { /* not JSON, try splitting */ 
      if (typeof c.cargo_carried === "string") {
        cargoTypes = c.cargo_carried.split(",").map((s: string) => s.trim()).filter(Boolean);
      }
    }

    // Derive equipment/trailer types from cargo
    const equipmentSet = new Set<string>();
    const trailerSet = new Set<string>();
    const commoditySet = new Set<string>();
    for (const cargo of cargoTypes) {
      const mapping = CARGO_TO_EQUIPMENT[cargo];
      if (mapping) {
        mapping.equipment.forEach(e => equipmentSet.add(e));
        mapping.trailerTypes.forEach(t => trailerSet.add(t));
        mapping.commodities.forEach(c => commoditySet.add(c));
      }
    }

    // Service type from carrier operation
    const opMapping = OPERATION_TO_SERVICE[c.carrier_operation || ""] || { serviceType: "Unknown", scope: "Unknown" };

    // Insurance analysis
    const hasLiability = insPolicies.some((p: any) => p.insurance_type?.includes("BIPD") || p.bipd_max_limit > 0);
    const hasCargo = insPolicies.some((p: any) => p.insurance_type?.includes("CARGO") || p.cargo_limit > 0);
    let nearestExpiry: string | null = null;
    for (const p of insPolicies) {
      if (p.coverage_to && (!nearestExpiry || p.coverage_to < nearestExpiry)) {
        nearestExpiry = p.coverage_to;
      }
    }

    // Safety analysis
    let alertCount = 0;
    if (sms) {
      const alerts = [
        sms.unsafe_driving_alert, sms.hos_alert, sms.vehicle_maintenance_alert,
        sms.crash_indicator_alert, sms.driver_fitness_alert, sms.controlled_substances_alert,
        sms.hazmat_alert,
      ];
      alertCount = alerts.filter((a: any) => a === "Y" || a === true).length;
    }

    // ══════════════════════════════════════════════════════════════════════
    // ENHANCED VERIFICATION FORMULA v2.0
    // ══════════════════════════════════════════════════════════════════════
    //
    // HARD GATES (instant block — any one = BLOCKED):
    //   • Active OOS Order
    //   • No Operating Authority (all revoked/none granted)
    //   • No BIPD Insurance
    //   • Active Revocation (no subsequent reinstatement)
    //
    // SCORE (0-100):
    //   CORE COMPLIANCE (60 pts):
    //     Authority Active            15 pts
    //     Insurance Active+Adequate   15 pts
    //     BOC-3 On File               10 pts
    //     MCS-150 Current (≤24mo)      5 pts
    //     Carrier Age ≥ 18mo           5 pts (new entrant penalty)
    //     No Fatal Crashes (24mo)      5 pts
    //     SMS BASICs Below Threshold   5 pts
    //
    //   SAFETY PERFORMANCE (25 pts):
    //     OOS Rate < 25%               8 pts
    //     Unsafe Driving < 65%ile      5 pts
    //     HOS Compliance < 65%ile      4 pts
    //     Vehicle Maint < 80%ile       4 pts
    //     Violations/Power Unit low    4 pts
    //
    //   TRUST SIGNALS (15 pts):
    //     Platform History              5 pts (completed loads, on-time %)
    //     Document Completeness         5 pts (BOC-3 + Insurance + Authority letter)
    //     HazMat Endorsement Verified   5 pts (if applicable, else redistributed)
    //
    // TIERS:
    //   90-100  INSTANT_VERIFIED (green — auto-approved)
    //   70-89   VERIFIED (blue — approved)
    //   50-69   PARTIAL (yellow — conditional, can operate with monitoring)
    //   30-49   UNVERIFIED (orange — manual review required)
    //   0-29    FLAGGED (red — blocked)
    // ══════════════════════════════════════════════════════════════════════

    const flags: string[] = [];
    let coreCompliance = 0;
    let safetyPerformance = 0;
    let trustSignals = 0;

    // ── Pre-compute derived values ────────────────────────────────────────
    const inspTotal = Number(inspOos?.total) || 0;
    const inspOosCount = Number(inspOos?.oos_count) || 0;
    const inspOosRate = inspTotal > 0 ? (inspOosCount / inspTotal) * 100 : 0;

    const carrierAgeDays = c.add_date
      ? Math.floor((Date.now() - new Date(c.add_date).getTime()) / (1000 * 60 * 60 * 24))
      : 9999; // Unknown = assume established
    const isNewEntrant = carrierAgeDays < 548; // < 18 months

    const mcs150StaleDays = c.mcs150_date
      ? Math.floor((Date.now() - new Date(c.mcs150_date).getTime()) / (1000 * 60 * 60 * 24))
      : 9999;
    const mcs150Stale = mcs150StaleDays > 730;

    const crashSeverity24mo = {
      total: Number(crashSev24?.total) || 0,
      fatal: Number(crashSev24?.fatal_crashes) || 0,
      injury: Number(crashSev24?.injury_crashes) || 0,
      towAway: Number(crashSev24?.tow_away_crashes) || 0,
    };

    const totalViolations24mo = Number(violationData?.total_violations) || 0;
    const powerUnits = Math.max(c.nbr_power_unit || 1, 1);
    const violationsPerUnit = totalViolations24mo / powerUnits;

    // SMS BASIC percentile breach detection (FMCSA intervention thresholds)
    const smsBasicBreaches: string[] = [];
    if (sms) {
      if (sms.unsafe_driving_score >= 65) smsBasicBreaches.push("Unsafe Driving");
      if (sms.hos_score >= 65) smsBasicBreaches.push("HOS Compliance");
      if (sms.vehicle_maintenance_score >= 80) smsBasicBreaches.push("Vehicle Maintenance");
      if (sms.crash_indicator_score >= 65) smsBasicBreaches.push("Crash Indicator");
      if (sms.controlled_substances_score >= 80) smsBasicBreaches.push("Controlled Substances");
      if (sms.driver_fitness_score >= 80) smsBasicBreaches.push("Driver Fitness");
      if (sms.hazmat_score >= 80 && (c.hm_flag === "Y")) smsBasicBreaches.push("HazMat");
    }

    // BIPD coverage amount (from insurance policies or authority record)
    const bipdPolicy = insPolicies.find((p: any) => p.insurance_type?.includes("BIPD") || p.bipd_max_limit > 0);
    const bipdCoverageAmount = bipdPolicy?.bipd_max_limit || auth?.bipd_insurance_on_file || 0;

    // ── HARD GATES (instant block) ────────────────────────────────────────
    const hasActiveAuth = auth && (
      (!auth.common_auth_revoked && auth.common_auth_granted) ||
      (!auth.contract_auth_revoked && auth.contract_auth_granted) ||
      (!auth.broker_auth_revoked && auth.broker_auth_granted)
    );

    if (oos) flags.push("OUT_OF_SERVICE_ORDER");
    if (!hasActiveAuth) flags.push("NO_ACTIVE_AUTHORITY");
    if (!auth) flags.push("NO_AUTHORITY_RECORD");
    if (insPolicies.length === 0 && !(auth?.bipd_insurance_on_file > 0)) flags.push("NO_INSURANCE_ON_FILE");
    if (!hasLiability && !(auth?.bipd_insurance_on_file > 0)) flags.push("NO_BIPD_INSURANCE");
    if (revocation) flags.push("AUTHORITY_PREVIOUSLY_REVOKED");

    const hardBlocked = !!oos || !hasActiveAuth || (!hasLiability && !(auth?.bipd_insurance_on_file > 0));

    // ── CORE COMPLIANCE (60 pts) ──────────────────────────────────────────

    // 1. Authority Active (15 pts)
    if (hasActiveAuth) {
      coreCompliance += 15;
    } else if (auth) {
      coreCompliance += 3; // Record exists but not active
    }
    if (auth?.common_auth_revoked) flags.push("COMMON_AUTHORITY_REVOKED");

    // 2. Insurance Active + Adequate (15 pts)
    if (insPolicies.length > 0 && hasLiability) {
      // Full marks if BIPD coverage >= $750K (standard federal minimum)
      if (bipdCoverageAmount >= 750000) {
        coreCompliance += 15;
      } else if (bipdCoverageAmount >= 300000) {
        coreCompliance += 12; // Below $750K but meets some state minimums
        flags.push("INSURANCE_BELOW_FEDERAL_MINIMUM");
      } else {
        coreCompliance += 8; // Has insurance but low coverage
        flags.push("INSURANCE_COVERAGE_LOW");
      }
    } else if (auth?.bipd_insurance_on_file > 0) {
      coreCompliance += 8; // Reported in authority record but no active policy detail
    }

    // 3. BOC-3 On File (10 pts)
    if (boc3) {
      coreCompliance += 10;
    } else {
      flags.push("NO_BOC3_FILING");
    }

    // 4. MCS-150 Current (5 pts) — ≤24 months
    if (!mcs150Stale && c.mcs150_date) {
      coreCompliance += 5;
    } else {
      if (mcs150Stale) flags.push("MCS150_OUTDATED");
    }

    // 5. Carrier Age ≥ 18mo (5 pts) — Chameleon carrier detection
    if (!isNewEntrant) {
      coreCompliance += 5;
    } else {
      flags.push("NEW_ENTRANT_CARRIER");
      // Extra flag if new carrier with large fleet (chameleon signal)
      if (isNewEntrant && powerUnits >= 20) {
        flags.push("CHAMELEON_CARRIER_RISK");
      }
    }

    // 6. No Fatal/Injury Crashes in 24mo (5 pts)
    if (crashSeverity24mo.fatal === 0 && crashSeverity24mo.injury === 0) {
      coreCompliance += 5;
    } else {
      if (crashSeverity24mo.fatal > 0) flags.push("FATAL_CRASHES_24MO");
      if (crashSeverity24mo.injury > 0) flags.push("INJURY_CRASHES_24MO");
    }

    // 7. SMS BASICs Below Intervention Threshold (5 pts)
    if (sms) {
      if (smsBasicBreaches.length === 0) {
        coreCompliance += 5;
      } else {
        flags.push("SMS_BASIC_THRESHOLD_BREACH");
        if (smsBasicBreaches.length >= 3) flags.push("MULTIPLE_BASIC_ALERTS");
      }
    } else {
      // No SMS data — give 2 pts (carrier may be too small for SMS)
      coreCompliance += 2;
    }

    // ── SAFETY PERFORMANCE (25 pts) ───────────────────────────────────────

    // 1. OOS Rate < 25% (8 pts)
    if (inspTotal === 0) {
      safetyPerformance += 6; // No inspections = mostly fine but not full marks
    } else if (inspOosRate < 15) {
      safetyPerformance += 8; // Excellent
    } else if (inspOosRate < 25) {
      safetyPerformance += 5; // Acceptable
    } else if (inspOosRate < 35) {
      safetyPerformance += 2; // Concerning
      flags.push("HIGH_OOS_INSPECTION_RATE");
    } else {
      flags.push("CRITICAL_OOS_INSPECTION_RATE");
    }

    // 2. Unsafe Driving < 65th percentile (5 pts)
    if (sms) {
      const ud = sms.unsafe_driving_score ?? 0;
      if (ud < 50) safetyPerformance += 5;
      else if (ud < 65) safetyPerformance += 3;
      else if (ud < 80) safetyPerformance += 1;
      // else 0
    } else {
      safetyPerformance += 3; // No data = neutral
    }

    // 3. HOS Compliance < 65th percentile (4 pts)
    if (sms) {
      const hos = sms.hos_score ?? 0;
      if (hos < 50) safetyPerformance += 4;
      else if (hos < 65) safetyPerformance += 2;
      else if (hos < 80) safetyPerformance += 1;
    } else {
      safetyPerformance += 2;
    }

    // 4. Vehicle Maintenance < 80th percentile (4 pts)
    if (sms) {
      const vm = sms.vehicle_maintenance_score ?? 0;
      if (vm < 60) safetyPerformance += 4;
      else if (vm < 80) safetyPerformance += 2;
      else safetyPerformance += 0;
    } else {
      safetyPerformance += 2;
    }

    // 5. Violations per Power Unit (4 pts) — normalized risk
    if (violationsPerUnit < 0.5) {
      safetyPerformance += 4; // < 0.5 violations per truck = excellent
    } else if (violationsPerUnit < 1.5) {
      safetyPerformance += 2; // Moderate
    } else if (violationsPerUnit < 3.0) {
      safetyPerformance += 1;
      flags.push("HIGH_VIOLATIONS_PER_UNIT");
    } else {
      flags.push("CRITICAL_VIOLATIONS_PER_UNIT");
    }

    // ── TRUST SIGNALS (15 pts) ────────────────────────────────────────────

    // 1. Platform History (5 pts) — completed loads on EusoTrip
    let platformTrust: InstantVerificationResult["platformTrust"] = null;
    try {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (db) {
        const { companies, loads } = await import("../../drizzle/schema");
        const { eq, and, gte, sql } = await import("drizzle-orm");
        // Find company by DOT number
        const [company] = await db.select({ id: companies.id })
          .from(companies).where(eq(companies.dotNumber, dotNumber)).limit(1);
        if (company) {
          const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);
          const [stats] = await db.select({
            completed: sql<number>`SUM(CASE WHEN ${loads.status} = 'delivered' THEN 1 ELSE 0 END)`,
            onTime: sql<number>`SUM(CASE WHEN ${loads.actualDeliveryDate} <= ${loads.estimatedDeliveryDate} THEN 1 ELSE 0 END)`,
            cancelled: sql<number>`SUM(CASE WHEN ${loads.status} = 'cancelled' THEN 1 ELSE 0 END)`,
            total: sql<number>`count(*)`,
          }).from(loads).where(and(eq(loads.catalystId, company.id), gte(loads.createdAt, ninetyDaysAgo)));

          const completed = Number(stats?.completed) || 0;
          const onTimeCount = Number(stats?.onTime) || 0;
          const cancelled = Number(stats?.cancelled) || 0;
          const total = Number(stats?.total) || 0;
          const onTimeRate = completed > 0 ? Math.round((onTimeCount / completed) * 100) : 0;

          platformTrust = { completedLoads: completed, onTimeRate, cancelledLoads: cancelled, isOnPlatform: true };

          if (completed >= 10 && onTimeRate >= 90) {
            trustSignals += 5; // Excellent platform history
          } else if (completed >= 5 && onTimeRate >= 75) {
            trustSignals += 3;
          } else if (completed >= 1) {
            trustSignals += 1;
          }
          // Negative: high cancellation rate
          if (total > 5 && cancelled / total > 0.3) {
            flags.push("HIGH_CANCELLATION_RATE");
          }
        }
      }
    } catch {
      // Platform trust query failed — non-critical, continue
    }

    // 2. Document Completeness (5 pts)
    const hasAllCoreDocs = !!boc3 && (hasLiability || auth?.bipd_insurance_on_file > 0) && hasActiveAuth;
    if (hasAllCoreDocs) {
      trustSignals += 5;
    } else {
      const docCount = [!!boc3, hasLiability || auth?.bipd_insurance_on_file > 0, !!hasActiveAuth].filter(Boolean).length;
      trustSignals += Math.floor((docCount / 3) * 5);
    }

    // 3. HazMat Endorsement (5 pts) — if HazMat carrier, else redistribute
    if (c.hm_flag === "Y" || c.class_hazmat === "Y") {
      flags.push("HAZMAT_CARRIER_DOCS_REQUIRED");
      // HazMat carriers: check if docs are verified on platform
      // For now, pending = 0 pts, will be verified via HazMatDocPanel
      trustSignals += 0;
    } else {
      // Non-HazMat: redistribute 5 pts → 3 to document completeness, 2 to safety
      trustSignals += hasAllCoreDocs ? 3 : 1;
      safetyPerformance += inspOosRate < 15 ? 2 : 0;
    }

    // ── FINAL SCORE ───────────────────────────────────────────────────────
    const verificationScore = Math.min(100, coreCompliance + safetyPerformance + trustSignals);

    // ── TIER DETERMINATION ────────────────────────────────────────────────
    const verificationTier: InstantVerificationResult["verificationTier"] =
      hardBlocked ? "FLAGGED" :
      verificationScore >= 90 ? "INSTANT_VERIFIED" :
      verificationScore >= 70 ? "VERIFIED" :
      verificationScore >= 50 ? "PARTIAL" :
      verificationScore >= 30 ? "UNVERIFIED" : "FLAGGED";

    // Required docs
    const docsRequired = [
      "MC Authority Letter",
      "Certificate of Insurance (COI)",
      "W-9 Tax Form",
      !boc3 ? "BOC-3 (Process Agent)" : null,
      c.hm_flag === "Y" ? "PHMSA Hazmat Registration" : null,
      c.hm_flag === "Y" ? "HMSP Permit" : null,
      c.hm_flag === "Y" ? "HazMat CDL Endorsement" : null,
      c.hm_flag === "Y" ? "TWIC Card" : null,
      c.hm_flag === "Y" ? "Security Threat Assessment" : null,
      "Drug & Alcohol Testing Policy",
      nearestExpiry ? null : "Proof of Active Insurance",
    ].filter(Boolean) as string[];

    return {
      dotNumber: c.dot_number?.toString() || dotNumber,
      legalName: c.legal_name || "",
      dbaName: c.dba_name || null,
      address: {
        street: c.phy_street || "",
        city: c.phy_city || "",
        state: c.phy_state || "",
        zip: c.phy_zip || "",
        country: c.phy_country || "USA",
      },
      phone: c.telephone || null,
      email: c.email_address || null,

      fleet: {
        powerUnits: c.nbr_power_unit || 0,
        drivers: c.driver_total || 0,
        carrierOperation: c.carrier_operation || "",
        serviceType: opMapping.serviceType,
        operationScope: opMapping.scope,
        isInterstate: c.op_interstate === "Y" || c.op_interstate === "X",
        isIntrastate: c.op_intrastate === "Y" || c.op_intrastate === "X",
        mcs150Date: c.mcs150_date || null,
        mcs150Mileage: c.mcs150_mileage || 0,
        addDate: c.add_date || null,
      },

      equipment: {
        cargoTypes,
        equipmentTypes: Array.from(equipmentSet),
        trailerTypes: Array.from(trailerSet),
        commodities: Array.from(commoditySet),
        isHazmat: c.hm_flag === "Y",
        isPassenger: c.pc_flag === "Y",
        isRefrigerated: cargoTypes.some(ct => ct.includes("Refrigerated") || ct.includes("Fresh Produce") || ct === "Meat"),
        isTanker: cargoTypes.some(ct => ct.includes("Liquids") || ct.includes("Gases") || ct === "Chemicals"),
        isFlatbed: cargoTypes.some(ct => ct.includes("Metal") || ct.includes("Building") || ct.includes("Machinery") || ct.includes("Logs")),
        isOversize: cargoTypes.some(ct => ct.includes("Machinery") || ct.includes("Mobile Homes") || ct.includes("Oilfield")),
      },

      classification: {
        property: c.class_property === "Y" || c.class_property === "X",
        passenger: c.class_passenger === "Y" || c.class_passenger === "X",
        hazmat: c.class_hazmat === "Y" || c.class_hazmat === "X",
        private: c.class_private === "Y" || c.class_private === "X",
        exempt: c.class_exempt === "Y" || c.class_exempt === "X",
      },

      authority: auth ? {
        status: auth.authority_status || "UNKNOWN",
        commonAuthActive: !auth.common_auth_revoked && !!auth.common_auth_granted,
        brokerAuthActive: !auth.broker_auth_revoked && !!auth.broker_auth_granted,
        contractAuthActive: !auth.contract_auth_revoked && !!auth.contract_auth_granted,
        docketNumber: auth.docket_number || null,
        commonAuthGranted: auth.common_auth_granted || null,
        brokerAuthGranted: auth.broker_auth_granted || null,
      } : null,

      insurance: {
        bipdOnFile: hasLiability || (auth?.bipd_insurance_on_file > 0),
        cargoOnFile: hasCargo || (auth?.cargo_insurance_on_file > 0),
        activePolicies: insPolicies.length,
        policies: insPolicies.map((p: any) => ({
          type: p.insurance_type || "",
          carrier: p.insurance_carrier || "",
          coverageTo: p.coverage_to || null,
          bipdLimit: p.bipd_max_limit || null,
          cargoLimit: p.cargo_limit || null,
        })),
        isCompliant: (hasLiability || auth?.bipd_insurance_on_file > 0) && insPolicies.length > 0,
        nearestExpiry,
      },

      safety: sms ? {
        unsafeDriving: { score: sms.unsafe_driving_score, alert: sms.unsafe_driving_alert === "Y" },
        hos: { score: sms.hos_score, alert: sms.hos_alert === "Y" },
        vehicleMaintenance: { score: sms.vehicle_maintenance_score, alert: sms.vehicle_maintenance_alert === "Y" },
        crashIndicator: { score: sms.crash_indicator_score, alert: sms.crash_indicator_alert === "Y" },
        driverFitness: { score: sms.driver_fitness_score, alert: sms.driver_fitness_alert === "Y" },
        controlledSubstances: { score: sms.controlled_substances_score, alert: sms.controlled_substances_alert === "Y" },
        hazmat: { score: sms.hazmat_score, alert: sms.hazmat_alert === "Y" },
        inspectionsTotal: sms.inspections_total || 0,
        driverOosRate: sms.driver_oos_rate ?? null,
        vehicleOosRate: sms.vehicle_oos_rate ?? null,
        alertCount,
        runDate: sms.run_date || null,
      } : null,

      crashes: {
        total: Number(crashSummary?.total) || 0,
        fatalities: Number(crashSummary?.fatalities) || 0,
        injuries: Number(crashSummary?.injuries) || 0,
        towAways: Number(crashSummary?.tow_aways) || 0,
        recentCrashes: recentCrashes.map((cr: any) => ({
          date: cr.report_date || "",
          state: cr.state || "",
          fatalities: cr.fatalities || 0,
          injuries: cr.injuries || 0,
        })),
      },

      outOfService: !!oos,
      oosReason: oos?.oos_reason || null,
      oosDate: oos?.oos_date || null,

      // BOC-3 Filing (Process Agent designation)
      boc3OnFile: !!boc3,
      boc3Agent: boc3?.agent_name || null,
      boc3Date: boc3?.form_date || null,

      // Inspection OOS rate (24 months)
      inspectionOosRate: Math.round(inspOosRate * 10) / 10,
      inspectionTotal24mo: inspTotal,

      // Revocation history
      hasRevocation: !!revocation,
      revocationReason: revocation?.revocation_reason || null,

      // Enhanced Formula v2 fields
      carrierAgeDays,
      isNewEntrant,
      mcs150StaleDays,
      mcs150Stale,
      crashSeverity24mo,
      violationsPerUnit: Math.round(violationsPerUnit * 100) / 100,
      totalViolations24mo,
      smsBasicBreaches,
      bipdCoverageAmount,
      platformTrust,
      scoreBreakdown: {
        coreCompliance,
        safetyPerformance,
        trustSignals,
      },

      verificationScore,
      verificationTier,
      flags,
      docsRequired,
      dataSource: "fmcsa_bulk_9.8M",
    };
  } catch (e) {
    logger.error("[InstantVerification] Error:", (e as Error).message?.slice(0, 200));
    return null;
  }
}

// ============================================================================
// CROSS-REFERENCE ENGINE
// ============================================================================

/**
 * Cross-reference user-provided registration inputs against FMCSA record.
 * Returns discrepancy report with severity levels.
 */
export function crossReferenceInputs(
  userInputs: {
    companyName?: string;
    dba?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    email?: string;
    powerUnits?: number;
    drivers?: number;
    hazmatEndorsed?: boolean;
    mcNumber?: string;
  },
  fmcsa: InstantVerificationResult
): ComplianceCrossReference {
  const discrepancies: CrossReferenceResult[] = [];
  const verified: CrossReferenceResult[] = [];

  function check(
    field: string,
    userVal: string | undefined,
    fmcsaVal: string | undefined | null,
    severity: "info" | "warning" | "critical" = "warning"
  ) {
    if (!userVal || !fmcsaVal) return;
    const uNorm = userVal.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    const fNorm = fmcsaVal.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    const match = uNorm === fNorm || uNorm.includes(fNorm) || fNorm.includes(uNorm);
    const result: CrossReferenceResult = {
      field,
      userValue: userVal,
      fmcsaValue: fmcsaVal,
      match,
      severity: match ? "info" : severity,
      message: match
        ? `${field} matches FMCSA record`
        : `${field} mismatch: user="${userVal}" vs FMCSA="${fmcsaVal}"`,
    };
    if (match) verified.push(result);
    else discrepancies.push(result);
  }

  // Identity checks
  check("Company Name", userInputs.companyName, fmcsa.legalName, "critical");
  if (userInputs.dba && fmcsa.dbaName) check("DBA", userInputs.dba, fmcsa.dbaName, "info");
  check("Street Address", userInputs.streetAddress, fmcsa.address.street, "warning");
  check("City", userInputs.city, fmcsa.address.city, "warning");
  check("State", userInputs.state, fmcsa.address.state, "critical");
  check("ZIP Code", userInputs.zipCode, fmcsa.address.zip, "warning");
  if (userInputs.phone) check("Phone", userInputs.phone?.replace(/[^0-9]/g, ""), fmcsa.phone?.replace(/[^0-9]/g, ""), "info");

  // Fleet size checks
  if (userInputs.powerUnits !== undefined && fmcsa.fleet.powerUnits > 0) {
    const ratio = userInputs.powerUnits / Math.max(fmcsa.fleet.powerUnits, 1);
    const match = ratio >= 0.5 && ratio <= 2.0; // within 2x
    const result: CrossReferenceResult = {
      field: "Power Units",
      userValue: String(userInputs.powerUnits),
      fmcsaValue: String(fmcsa.fleet.powerUnits),
      match,
      severity: match ? "info" : "warning",
      message: match
        ? `Power units within expected range (FMCSA: ${fmcsa.fleet.powerUnits})`
        : `Power units discrepancy: user=${userInputs.powerUnits} vs FMCSA=${fmcsa.fleet.powerUnits}`,
    };
    if (match) verified.push(result); else discrepancies.push(result);
  }

  if (userInputs.drivers !== undefined && fmcsa.fleet.drivers > 0) {
    const ratio = userInputs.drivers / Math.max(fmcsa.fleet.drivers, 1);
    const match = ratio >= 0.3 && ratio <= 3.0;
    const result: CrossReferenceResult = {
      field: "Driver Count",
      userValue: String(userInputs.drivers),
      fmcsaValue: String(fmcsa.fleet.drivers),
      match,
      severity: match ? "info" : "warning",
      message: match
        ? `Driver count within expected range (FMCSA: ${fmcsa.fleet.drivers})`
        : `Driver count discrepancy: user=${userInputs.drivers} vs FMCSA=${fmcsa.fleet.drivers}`,
    };
    if (match) verified.push(result); else discrepancies.push(result);
  }

  // Hazmat endorsement
  if (userInputs.hazmatEndorsed !== undefined) {
    const match = userInputs.hazmatEndorsed === fmcsa.equipment.isHazmat;
    const result: CrossReferenceResult = {
      field: "Hazmat Authorization",
      userValue: userInputs.hazmatEndorsed ? "Yes" : "No",
      fmcsaValue: fmcsa.equipment.isHazmat ? "Yes" : "No",
      match,
      severity: match ? "info" : "critical",
      message: match
        ? "Hazmat authorization matches FMCSA record"
        : `Hazmat mismatch: user=${userInputs.hazmatEndorsed ? "Yes" : "No"} vs FMCSA=${fmcsa.equipment.isHazmat ? "Yes" : "No"}`,
    };
    if (match) verified.push(result); else discrepancies.push(result);
  }

  // MC Number cross-reference
  if (userInputs.mcNumber && fmcsa.authority?.docketNumber) {
    const uMC = userInputs.mcNumber.replace(/[^0-9]/g, "");
    const fMC = fmcsa.authority.docketNumber.replace(/[^0-9]/g, "");
    const match = uMC === fMC;
    const result: CrossReferenceResult = {
      field: "MC Number",
      userValue: userInputs.mcNumber,
      fmcsaValue: fmcsa.authority.docketNumber,
      match,
      severity: match ? "info" : "critical",
      message: match ? "MC number matches FMCSA authority record" : `MC number mismatch`,
    };
    if (match) verified.push(result); else discrepancies.push(result);
  }

  const totalChecks = verified.length + discrepancies.length;
  const overallMatch = totalChecks > 0 ? Math.round((verified.length / totalChecks) * 100) : 0;

  const criticalDiscrepancies = discrepancies.filter(d => d.severity === "critical");
  const riskLevel: ComplianceCrossReference["riskLevel"] =
    criticalDiscrepancies.length >= 2 ? "CRITICAL" :
    criticalDiscrepancies.length >= 1 ? "HIGH" :
    discrepancies.length >= 3 ? "MODERATE" : "LOW";

  const recommendations: string[] = [];
  if (fmcsa.outOfService) recommendations.push("⚠️ Carrier is under active Out-of-Service order — registration should be blocked or flagged for admin review");
  if (!fmcsa.authority?.commonAuthActive) recommendations.push("Authority not active — carrier may not be authorized to operate");
  if (!fmcsa.insurance?.isCompliant) recommendations.push("Insurance not on file — require COI upload before activation");
  if ((fmcsa.safety?.alertCount || 0) >= 3) recommendations.push("Multiple CSA BASIC alerts — assign to safety review queue");
  if (criticalDiscrepancies.length > 0) recommendations.push("Critical identity discrepancies detected — manual review required");
  if (fmcsa.fleet.mcs150Date) {
    const age = (Date.now() - new Date(fmcsa.fleet.mcs150Date).getTime()) / (1000 * 60 * 60 * 24);
    if (age > 730) recommendations.push("MCS-150 not updated in 2+ years — may have outdated fleet/contact info");
  }

  return { overallMatch, discrepancies, verified, recommendations, riskLevel };
}

// ============================================================================
// ML FEATURE EXTRACTION
// ============================================================================

/**
 * Extract ML-ready features from verification + cross-reference results.
 * These features can be stored for training fraud detection / risk scoring models.
 */
export function extractMLFeatures(
  fmcsa: InstantVerificationResult,
  crossRef: ComplianceCrossReference
): MLVerificationFeatures {
  const nameMatch = crossRef.verified.find(v => v.field === "Company Name");
  const addressMatch = crossRef.verified.find(v => v.field === "Street Address");
  const phoneMatch = crossRef.verified.find(v => v.field === "Phone");
  const fleetMatch = crossRef.verified.find(v => v.field === "Power Units");

  const mcs150Age = fmcsa.fleet.mcs150Date
    ? Math.round((Date.now() - new Date(fmcsa.fleet.mcs150Date).getTime()) / (1000 * 60 * 60 * 24))
    : 9999;

  const pu = fmcsa.fleet.powerUnits;
  const fleetCategory: MLVerificationFeatures["fleetSizeCategory"] =
    pu <= 1 ? "solo" : pu <= 10 ? "small" : pu <= 50 ? "medium" : pu <= 500 ? "large" : "enterprise";

  const basicScores = fmcsa.safety ? [
    fmcsa.safety.unsafeDriving.score, fmcsa.safety.hos.score,
    fmcsa.safety.vehicleMaintenance.score, fmcsa.safety.crashIndicator.score,
    fmcsa.safety.driverFitness.score,
  ].filter((s): s is number => s != null) : [];
  const avgBasicScore = basicScores.length > 0 ? basicScores.reduce((a, b) => a + b, 0) / basicScores.length : 0;

  return {
    dotNumber: fmcsa.dotNumber,
    timestamp: new Date().toISOString(),
    hasLegalName: !!fmcsa.legalName,
    hasDBA: !!fmcsa.dbaName,
    hasPhone: !!fmcsa.phone,
    hasEmail: !!fmcsa.email,
    hasAddress: !!fmcsa.address.street,
    powerUnits: fmcsa.fleet.powerUnits,
    drivers: fmcsa.fleet.drivers,
    fleetSizeCategory: fleetCategory,
    isInterstate: fmcsa.fleet.isInterstate,
    mcs150Age,
    hasAuthority: !!fmcsa.authority,
    authorityActive: fmcsa.authority?.commonAuthActive || false,
    hasBrokerAuth: fmcsa.authority?.brokerAuthActive || false,
    hasInsurance: (fmcsa.insurance?.activePolicies || 0) > 0,
    insuranceCompliant: fmcsa.insurance?.isCompliant || false,
    activePolicies: fmcsa.insurance?.activePolicies || 0,
    hasSmsBASICs: !!fmcsa.safety,
    alertCount: fmcsa.safety?.alertCount || 0,
    avgBasicScore,
    driverOosRate: fmcsa.safety?.driverOosRate || 0,
    vehicleOosRate: fmcsa.safety?.vehicleOosRate || 0,
    totalCrashes: fmcsa.crashes?.total || 0,
    fatalityCrashes: fmcsa.crashes?.fatalities || 0,
    isOutOfService: fmcsa.outOfService,
    isHazmat: fmcsa.equipment.isHazmat,
    nameMatchScore: nameMatch ? 100 : (crossRef.discrepancies.find(d => d.field === "Company Name") ? 0 : -1),
    addressMatchScore: addressMatch ? 100 : (crossRef.discrepancies.find(d => d.field === "Street Address") ? 0 : -1),
    phoneMatchScore: phoneMatch ? 100 : (crossRef.discrepancies.find(d => d.field === "Phone") ? 0 : -1),
    fleetSizeMatchScore: fleetMatch ? 100 : (crossRef.discrepancies.find(d => d.field === "Power Units") ? 0 : -1),
    overallCrossRefScore: crossRef.overallMatch,
    verificationScore: fmcsa.verificationScore,
    verificationTier: fmcsa.verificationTier,
  };
}

// ============================================================================
// BATCH AUDIT: Cross-reference existing platform companies against FMCSA
// ============================================================================

/**
 * Audit all platform companies that have a DOT number against FMCSA bulk data.
 * Returns gaps, discrepancies, and enrichment opportunities.
 */
export async function auditPlatformCompanies(limit = 100): Promise<{
  audited: number;
  enriched: number;
  flagged: number;
  results: Array<{
    companyId: number;
    companyName: string;
    dotNumber: string;
    verificationTier: string;
    verificationScore: number;
    discrepancyCount: number;
    gapsFound: string[];
    enrichments: Record<string, any>;
    flags: string[];
  }>;
}> {
  const pool = getPool();
  if (!pool) return { audited: 0, enriched: 0, flagged: 0, results: [] };

  try {
    const [companyRows]: any = await pool.query(
      `SELECT id, name, dotNumber, mcNumber, address, city, state, zipCode, phone, email,
              hazmatLicense, insuranceExpiry, complianceStatus
       FROM companies WHERE dotNumber IS NOT NULL AND dotNumber != '' LIMIT ?`,
      [limit]
    );

    const results: any[] = [];
    let enriched = 0;
    let flagged = 0;

    for (const co of (companyRows || [])) {
      try {
        const fmcsa = await getInstantVerification(co.dotNumber);
        if (!fmcsa) continue;

        const crossRef = crossReferenceInputs({
          companyName: co.name,
          streetAddress: co.address,
          city: co.city,
          state: co.state,
          zipCode: co.zipCode,
          phone: co.phone,
          email: co.email,
        }, fmcsa);

        // Identify gaps in platform data that FMCSA can fill
        const gapsFound: string[] = [];
        const enrichments: Record<string, any> = {};

        if (!co.mcNumber && fmcsa.authority?.docketNumber) {
          gapsFound.push("MC Number");
          enrichments.mcNumber = fmcsa.authority.docketNumber;
        }
        if (!co.phone && fmcsa.phone) {
          gapsFound.push("Phone");
          enrichments.phone = fmcsa.phone;
        }
        if (!co.email && fmcsa.email) {
          gapsFound.push("Email");
          enrichments.email = fmcsa.email;
        }
        if (!co.address && fmcsa.address.street) {
          gapsFound.push("Address");
          enrichments.address = fmcsa.address.street;
          enrichments.city = fmcsa.address.city;
          enrichments.state = fmcsa.address.state;
          enrichments.zipCode = fmcsa.address.zip;
        }
        if (!co.hazmatLicense && fmcsa.equipment.isHazmat) {
          gapsFound.push("Hazmat Authorization");
          enrichments.hazmatLicense = "FMCSA_AUTHORIZED";
        }
        if (!co.insuranceExpiry && fmcsa.insurance?.nearestExpiry) {
          gapsFound.push("Insurance Expiry");
          enrichments.insuranceExpiry = fmcsa.insurance.nearestExpiry;
        }
        if (fmcsa.equipment.equipmentTypes.length > 0) {
          gapsFound.push("Equipment Types");
          enrichments.equipmentTypes = fmcsa.equipment.equipmentTypes;
          enrichments.trailerTypes = fmcsa.equipment.trailerTypes;
          enrichments.cargoTypes = fmcsa.equipment.cargoTypes;
          enrichments.commodities = fmcsa.equipment.commodities;
        }

        // Auto-enrich: update company record with FMCSA data where gaps exist
        // Whitelist of allowed company columns for auto-enrichment
        const ALLOWED_ENRICH_COLUMNS = new Set([
          "mcNumber", "phone", "email", "dotNumber", "name", "address",
          "city", "state", "zip", "country", "legalName",
        ]);
        const validateEnrichColumn = (col: string) => {
          if (!ALLOWED_ENRICH_COLUMNS.has(col) || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(col)) {
            throw new Error(`Invalid enrichment column: ${col}`);
          }
        };

        const updateFields: string[] = [];
        const updateValues: any[] = [];
        if (enrichments.mcNumber) { validateEnrichColumn("mcNumber"); updateFields.push("mcNumber = ?"); updateValues.push(enrichments.mcNumber); }
        if (enrichments.phone && !co.phone) { validateEnrichColumn("phone"); updateFields.push("phone = ?"); updateValues.push(enrichments.phone); }
        if (enrichments.email && !co.email) { validateEnrichColumn("email"); updateFields.push("email = ?"); updateValues.push(enrichments.email); }

        if (updateFields.length > 0) {
          updateValues.push(co.id);
          await pool.query(`UPDATE companies SET ${updateFields.join(", ")} WHERE id = ?`, updateValues);
          enriched++;
        }

        if (fmcsa.outOfService || crossRef.riskLevel === "CRITICAL") flagged++;

        results.push({
          companyId: co.id,
          companyName: co.name,
          dotNumber: co.dotNumber,
          verificationTier: fmcsa.verificationTier,
          verificationScore: fmcsa.verificationScore,
          discrepancyCount: crossRef.discrepancies.length,
          gapsFound,
          enrichments,
          flags: fmcsa.flags,
        });
      } catch { /* skip individual failures */ }
    }

    return { audited: results.length, enriched, flagged, results };
  } catch (e) {
    logger.error("[InstantVerification] Audit error:", (e as Error).message?.slice(0, 200));
    return { audited: 0, enriched: 0, flagged: 0, results: [] };
  }
}

// ============================================================================
// STORE ML VERIFICATION EVENT
// ============================================================================

/**
 * Store verification event for ML training.
 * Writes to carrier_verification_events table.
 */
export async function storeVerificationEvent(
  features: MLVerificationFeatures,
  eventType: "registration" | "login" | "audit" | "manual_review",
  userId?: number,
  companyId?: number,
): Promise<void> {
  const pool = getPool();
  if (!pool) return;

  try {
    await pool.query(
      `INSERT INTO carrier_verification_events
       (dot_number, event_type, user_id, company_id, verification_score, verification_tier,
        cross_ref_score, alert_count, power_units, drivers, fleet_category,
        is_interstate, is_hazmat, is_out_of_service, total_crashes, features_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        features.dotNumber, eventType, userId || null, companyId || null,
        features.verificationScore, features.verificationTier,
        features.overallCrossRefScore, features.alertCount,
        features.powerUnits, features.drivers, features.fleetSizeCategory,
        features.isInterstate ? 1 : 0, features.isHazmat ? 1 : 0,
        features.isOutOfService ? 1 : 0, features.totalCrashes,
        JSON.stringify(features),
      ]
    );
  } catch (e) {
    logger.warn("[InstantVerification] Could not store ML event:", (e as Error).message?.slice(0, 100));
  }
}

// ============================================================================
// EQUIPMENT TYPE LOOKUP (standalone utility)
// ============================================================================

/**
 * Given a list of FMCSA cargo codes, return the inferred equipment/trailer types.
 * Useful for auto-populating equipment fields on the platform.
 */
export function inferEquipmentFromCargo(cargoTypes: string[]): {
  equipmentTypes: string[];
  trailerTypes: string[];
  commodities: string[];
} {
  const equipmentSet = new Set<string>();
  const trailerSet = new Set<string>();
  const commoditySet = new Set<string>();

  for (const cargo of cargoTypes) {
    const mapping = CARGO_TO_EQUIPMENT[cargo];
    if (mapping) {
      mapping.equipment.forEach(e => equipmentSet.add(e));
      mapping.trailerTypes.forEach(t => trailerSet.add(t));
      mapping.commodities.forEach(c => commoditySet.add(c));
    }
  }

  return {
    equipmentTypes: Array.from(equipmentSet),
    trailerTypes: Array.from(trailerSet),
    commodities: Array.from(commoditySet),
  };
}
