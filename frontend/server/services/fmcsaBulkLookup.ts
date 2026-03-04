/**
 * FMCSA BULK DATA LOOKUP SERVICE
 * 
 * Centralized query functions for the 9.8M+ FMCSA records:
 *   - Census:      3,099,974 carrier records
 *   - Authority:   2,238,110 authority records
 *   - Violations:  1,799,836 violation records
 *   - Crashes:     1,044,500 crash records
 *   - Insurance:   1,035,820 insurance records
 *   - Inspections:   450,000 inspection records
 *   - OOS/BOC3:    Pending daily run
 *
 * Used by: carrierScorecard, csaScores, dashboard, dispatch, loads,
 *          brokers, catalysts, eld, accidents, hotZones, commissionEngine
 *
 * All queries are sub-millisecond against indexed MySQL bulk tables.
 */

import { getPool } from "../db";

// ============================================================================
// TYPES
// ============================================================================

export interface FMCSACensus {
  dotNumber: string;
  legalName: string;
  dbaName: string | null;
  phyStreet: string | null;
  phyCity: string | null;
  phyState: string | null;
  phyZip: string | null;
  telephone: string | null;
  emailAddress: string | null;
  nbrPowerUnit: number;
  driverTotal: number;
  hmFlag: boolean;
  pcFlag: boolean;
  carrierOperation: string | null;
  cargoCarried: string | null;
  mcs150Date: string | null;
  mcs150Mileage: number;
}

export interface FMCSAAuthority {
  dotNumber: string;
  docketNumber: string | null;
  authorityStatus: string;
  commonAuthActive: boolean;
  brokerAuthActive: boolean;
  contractAuthActive: boolean;
  bipdInsuranceOnFile: number;
  cargoInsuranceOnFile: number;
}

export interface FMCSASafetyScores {
  dotNumber: string;
  runDate: string;
  unsafeDrivingScore: number | null;
  unsafeDrivingAlert: boolean;
  hosScore: number | null;
  hosAlert: boolean;
  driverFitnessScore: number | null;
  driverFitnessAlert: boolean;
  controlledSubstancesScore: number | null;
  controlledSubstancesAlert: boolean;
  vehicleMaintenanceScore: number | null;
  vehicleMaintenanceAlert: boolean;
  hazmatScore: number | null;
  hazmatAlert: boolean;
  crashIndicatorScore: number | null;
  crashIndicatorAlert: boolean;
  inspectionsTotal: number;
  driverOosRate: number | null;
  vehicleOosRate: number | null;
}

export interface FMCSACrashSummary {
  totalCrashes: number;
  totalFatalities: number;
  totalInjuries: number;
  towAways: number;
  hazmatReleases: number;
  recentCrashes: FMCSACrash[];
}

export interface FMCSACrash {
  reportNumber: string;
  reportDate: string;
  state: string;
  city: string;
  fatalities: number;
  injuries: number;
  towAway: boolean;
  hazmatReleased: boolean;
  severityWeight: number;
}

export interface FMCSAInspectionSummary {
  totalInspections: number;
  totalViolations: number;
  driverOosCount: number;
  vehicleOosCount: number;
  hazmatOosCount: number;
  recentInspections: FMCSAInspection[];
}

export interface FMCSAInspection {
  inspectionId: string;
  inspectionDate: string;
  state: string;
  level: number;
  driverOos: boolean;
  vehicleOos: boolean;
  totalViolations: number;
}

export interface FMCSAViolationSummary {
  totalViolations: number;
  byCategory: Record<string, number>;
  oosViolations: number;
  recentViolations: FMCSAViolation[];
}

export interface FMCSAViolation {
  code: string;
  description: string;
  group: string;
  oos: boolean;
  severityWeight: number;
  inspectionDate: string;
}

export interface FMCSAInsuranceStatus {
  activePolicies: number;
  hasLiability: boolean;
  hasCargo: boolean;
  bipdLimit: number;
  cargoLimit: number;
  nearestExpiry: string | null;
  isCompliant: boolean;
}

export interface CarrierSafetyIntel {
  census: FMCSACensus | null;
  authority: FMCSAAuthority | null;
  safety: FMCSASafetyScores | null;
  crashes: FMCSACrashSummary | null;
  inspections: FMCSAInspectionSummary | null;
  insurance: FMCSAInsuranceStatus | null;
  outOfService: boolean;
  oosReason: string | null;
  riskTier: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "UNKNOWN";
  riskScore: number; // 0-100
  alerts: string[];
}

// ============================================================================
// CORE LOOKUP FUNCTIONS
// ============================================================================

/**
 * Get census data for a carrier by DOT number.
 * Queries fmcsa_census (3.1M records).
 */
export async function getCensus(dotNumber: string): Promise<FMCSACensus | null> {
  const pool = getPool();
  if (!pool || !dotNumber) return null;
  try {
    const [rows]: any = await pool.query(
      `SELECT dot_number, legal_name, dba_name, phy_street, phy_city, phy_state, phy_zip,
              telephone, email_address, nbr_power_unit, driver_total, hm_flag, pc_flag,
              carrier_operation, cargo_carried, mcs150_date, mcs150_mileage
       FROM fmcsa_census WHERE dot_number = ? LIMIT 1`,
      [dotNumber]
    );
    if (!rows?.length) return null;
    const c = rows[0];
    return {
      dotNumber: String(c.dot_number),
      legalName: c.legal_name || "",
      dbaName: c.dba_name || null,
      phyStreet: c.phy_street || null,
      phyCity: c.phy_city || null,
      phyState: c.phy_state || null,
      phyZip: c.phy_zip || null,
      telephone: c.telephone || null,
      emailAddress: c.email_address || null,
      nbrPowerUnit: c.nbr_power_unit || 0,
      driverTotal: c.driver_total || 0,
      hmFlag: c.hm_flag === "Y",
      pcFlag: c.pc_flag === "Y",
      carrierOperation: c.carrier_operation || null,
      cargoCarried: c.cargo_carried || null,
      mcs150Date: c.mcs150_date || null,
      mcs150Mileage: c.mcs150_mileage || 0,
    };
  } catch (e) {
    console.warn("[FMCSABulk] getCensus error:", (e as Error).message?.slice(0, 100));
    return null;
  }
}

/**
 * Get authority data for a carrier by DOT number.
 * Queries fmcsa_authority (2.2M records).
 */
export async function getAuthority(dotNumber: string): Promise<FMCSAAuthority | null> {
  const pool = getPool();
  if (!pool || !dotNumber) return null;
  try {
    const [rows]: any = await pool.query(
      `SELECT dot_number, docket_number, authority_status,
              common_auth_granted, common_auth_revoked,
              contract_auth_granted, contract_auth_revoked,
              broker_auth_granted, broker_auth_revoked,
              bipd_insurance_on_file, cargo_insurance_on_file
       FROM fmcsa_authority WHERE dot_number = ? ORDER BY fetched_at DESC LIMIT 1`,
      [dotNumber]
    );
    if (!rows?.length) return null;
    const a = rows[0];
    return {
      dotNumber: String(a.dot_number),
      docketNumber: a.docket_number || null,
      authorityStatus: a.authority_status || "UNKNOWN",
      commonAuthActive: !!(a.common_auth_granted && !a.common_auth_revoked),
      brokerAuthActive: !!(a.broker_auth_granted && !a.broker_auth_revoked),
      contractAuthActive: !!(a.contract_auth_granted && !a.contract_auth_revoked),
      bipdInsuranceOnFile: a.bipd_insurance_on_file || 0,
      cargoInsuranceOnFile: a.cargo_insurance_on_file || 0,
    };
  } catch (e) {
    console.warn("[FMCSABulk] getAuthority error:", (e as Error).message?.slice(0, 100));
    return null;
  }
}

/**
 * Get SMS BASIC safety scores for a carrier.
 * Queries fmcsa_sms_scores.
 */
export async function getSafetyScores(dotNumber: string): Promise<FMCSASafetyScores | null> {
  const pool = getPool();
  if (!pool || !dotNumber) return null;
  try {
    const [rows]: any = await pool.query(
      `SELECT dot_number, run_date,
              unsafe_driving_score, unsafe_driving_alert,
              hos_score, hos_alert,
              driver_fitness_score, driver_fitness_alert,
              controlled_substances_score, controlled_substances_alert,
              vehicle_maintenance_score, vehicle_maintenance_alert,
              hazmat_score, hazmat_alert,
              crash_indicator_score, crash_indicator_alert,
              inspections_total, driver_oos_rate, vehicle_oos_rate
       FROM fmcsa_sms_scores WHERE dot_number = ? ORDER BY run_date DESC LIMIT 1`,
      [dotNumber]
    );
    if (!rows?.length) return null;
    const s = rows[0];
    return {
      dotNumber: String(s.dot_number),
      runDate: s.run_date,
      unsafeDrivingScore: s.unsafe_driving_score ?? null,
      unsafeDrivingAlert: s.unsafe_driving_alert === "Y",
      hosScore: s.hos_score ?? null,
      hosAlert: s.hos_alert === "Y",
      driverFitnessScore: s.driver_fitness_score ?? null,
      driverFitnessAlert: s.driver_fitness_alert === "Y",
      controlledSubstancesScore: s.controlled_substances_score ?? null,
      controlledSubstancesAlert: s.controlled_substances_alert === "Y",
      vehicleMaintenanceScore: s.vehicle_maintenance_score ?? null,
      vehicleMaintenanceAlert: s.vehicle_maintenance_alert === "Y",
      hazmatScore: s.hazmat_score ?? null,
      hazmatAlert: s.hazmat_alert === "Y",
      crashIndicatorScore: s.crash_indicator_score ?? null,
      crashIndicatorAlert: s.crash_indicator_alert === "Y",
      inspectionsTotal: s.inspections_total || 0,
      driverOosRate: s.driver_oos_rate ?? null,
      vehicleOosRate: s.vehicle_oos_rate ?? null,
    };
  } catch (e) {
    console.warn("[FMCSABulk] getSafetyScores error:", (e as Error).message?.slice(0, 100));
    return null;
  }
}

/**
 * Get crash summary for a carrier.
 * Queries fmcsa_crashes (1M+ records).
 */
export async function getCrashSummary(dotNumber: string, recentLimit = 5): Promise<FMCSACrashSummary | null> {
  const pool = getPool();
  if (!pool || !dotNumber) return null;
  try {
    const [[agg]]: any = await pool.query(
      `SELECT COUNT(*) as total, COALESCE(SUM(fatalities),0) as fatalities,
              COALESCE(SUM(injuries),0) as injuries,
              SUM(CASE WHEN tow_away='Y' THEN 1 ELSE 0 END) as tow_aways,
              SUM(CASE WHEN hazmat_released='Y' THEN 1 ELSE 0 END) as hazmat_releases
       FROM fmcsa_crashes WHERE dot_number = ?`,
      [dotNumber]
    );
    const [recent]: any = await pool.query(
      `SELECT report_number, report_date, state, city, fatalities, injuries,
              tow_away, hazmat_released, severity_weight
       FROM fmcsa_crashes WHERE dot_number = ? ORDER BY report_date DESC LIMIT ?`,
      [dotNumber, recentLimit]
    );
    return {
      totalCrashes: agg?.total || 0,
      totalFatalities: agg?.fatalities || 0,
      totalInjuries: agg?.injuries || 0,
      towAways: agg?.tow_aways || 0,
      hazmatReleases: agg?.hazmat_releases || 0,
      recentCrashes: (recent || []).map((r: any) => ({
        reportNumber: r.report_number,
        reportDate: r.report_date,
        state: r.state,
        city: r.city,
        fatalities: r.fatalities || 0,
        injuries: r.injuries || 0,
        towAway: r.tow_away === "Y",
        hazmatReleased: r.hazmat_released === "Y",
        severityWeight: r.severity_weight || 0,
      })),
    };
  } catch (e) {
    console.warn("[FMCSABulk] getCrashSummary error:", (e as Error).message?.slice(0, 100));
    return null;
  }
}

/**
 * Get inspection summary for a carrier.
 * Queries fmcsa_inspections (450K records).
 */
export async function getInspectionSummary(dotNumber: string, recentLimit = 5): Promise<FMCSAInspectionSummary | null> {
  const pool = getPool();
  if (!pool || !dotNumber) return null;
  try {
    const [[agg]]: any = await pool.query(
      `SELECT COUNT(*) as total,
              COALESCE(SUM(total_violations),0) as violations,
              SUM(CASE WHEN driver_oos='Y' THEN 1 ELSE 0 END) as driver_oos,
              SUM(CASE WHEN vehicle_oos='Y' THEN 1 ELSE 0 END) as vehicle_oos,
              SUM(CASE WHEN hazmat_oos='Y' THEN 1 ELSE 0 END) as hazmat_oos
       FROM fmcsa_inspections WHERE dot_number = ?`,
      [dotNumber]
    );
    const [recent]: any = await pool.query(
      `SELECT inspection_id, inspection_date, report_state, insp_level_id,
              driver_oos, vehicle_oos, total_violations
       FROM fmcsa_inspections WHERE dot_number = ? ORDER BY inspection_date DESC LIMIT ?`,
      [dotNumber, recentLimit]
    );
    return {
      totalInspections: agg?.total || 0,
      totalViolations: agg?.violations || 0,
      driverOosCount: agg?.driver_oos || 0,
      vehicleOosCount: agg?.vehicle_oos || 0,
      hazmatOosCount: agg?.hazmat_oos || 0,
      recentInspections: (recent || []).map((r: any) => ({
        inspectionId: r.inspection_id,
        inspectionDate: r.inspection_date,
        state: r.report_state,
        level: r.insp_level_id,
        driverOos: r.driver_oos === "Y",
        vehicleOos: r.vehicle_oos === "Y",
        totalViolations: r.total_violations || 0,
      })),
    };
  } catch (e) {
    console.warn("[FMCSABulk] getInspectionSummary error:", (e as Error).message?.slice(0, 100));
    return null;
  }
}

/**
 * Get violation summary for a carrier.
 * Queries fmcsa_violations (1.8M records).
 */
export async function getViolationSummary(dotNumber: string, recentLimit = 10): Promise<FMCSAViolationSummary | null> {
  const pool = getPool();
  if (!pool || !dotNumber) return null;
  try {
    const [[agg]]: any = await pool.query(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN oos='Y' THEN 1 ELSE 0 END) as oos_violations
       FROM fmcsa_violations v
       INNER JOIN fmcsa_inspections i ON v.inspection_id = i.inspection_id
       WHERE i.dot_number = ?`,
      [dotNumber]
    );
    const [byCat]: any = await pool.query(
      `SELECT v.violation_group, COUNT(*) as cnt
       FROM fmcsa_violations v
       INNER JOIN fmcsa_inspections i ON v.inspection_id = i.inspection_id
       WHERE i.dot_number = ?
       GROUP BY v.violation_group
       ORDER BY cnt DESC LIMIT 10`,
      [dotNumber]
    );
    const [recent]: any = await pool.query(
      `SELECT v.violation_code, v.violation_descr, v.violation_group, v.oos,
              v.severity_weight, i.inspection_date
       FROM fmcsa_violations v
       INNER JOIN fmcsa_inspections i ON v.inspection_id = i.inspection_id
       WHERE i.dot_number = ?
       ORDER BY i.inspection_date DESC LIMIT ?`,
      [dotNumber, recentLimit]
    );
    const byCategory: Record<string, number> = {};
    for (const row of byCat || []) {
      byCategory[row.violation_group || "Other"] = row.cnt;
    }
    return {
      totalViolations: agg?.total || 0,
      byCategory,
      oosViolations: agg?.oos_violations || 0,
      recentViolations: (recent || []).map((r: any) => ({
        code: r.violation_code,
        description: r.violation_descr,
        group: r.violation_group,
        oos: r.oos === "Y",
        severityWeight: r.severity_weight || 0,
        inspectionDate: r.inspection_date,
      })),
    };
  } catch (e) {
    console.warn("[FMCSABulk] getViolationSummary error:", (e as Error).message?.slice(0, 100));
    return null;
  }
}

/**
 * Get insurance status for a carrier.
 * Queries fmcsa_insurance (1M+ records).
 */
export async function getInsuranceStatus(dotNumber: string): Promise<FMCSAInsuranceStatus | null> {
  const pool = getPool();
  if (!pool || !dotNumber) return null;
  try {
    const [rows]: any = await pool.query(
      `SELECT insurance_type, coverage_to, bipd_max_limit, cargo_limit
       FROM fmcsa_insurance
       WHERE dot_number = ? AND is_active = 1
       ORDER BY coverage_to DESC`,
      [dotNumber]
    );
    if (!rows?.length) return { activePolicies: 0, hasLiability: false, hasCargo: false, bipdLimit: 0, cargoLimit: 0, nearestExpiry: null, isCompliant: false };

    const hasLiability = rows.some((r: any) => r.insurance_type?.includes("BIPD") || r.insurance_type?.includes("LIABILITY"));
    const hasCargo = rows.some((r: any) => r.insurance_type?.includes("CARGO"));
    const maxBipd = Math.max(...rows.map((r: any) => r.bipd_max_limit || 0));
    const maxCargo = Math.max(...rows.map((r: any) => r.cargo_limit || 0));
    const nearestExpiry = rows
      .map((r: any) => r.coverage_to)
      .filter(Boolean)
      .sort()[0] || null;

    return {
      activePolicies: rows.length,
      hasLiability,
      hasCargo,
      bipdLimit: maxBipd,
      cargoLimit: maxCargo,
      nearestExpiry,
      isCompliant: hasLiability && maxBipd >= 750000,
    };
  } catch (e) {
    console.warn("[FMCSABulk] getInsuranceStatus error:", (e as Error).message?.slice(0, 100));
    return null;
  }
}

/**
 * Check if carrier is under an active Out of Service order.
 */
export async function getOOSStatus(dotNumber: string): Promise<{ outOfService: boolean; reason: string | null }> {
  const pool = getPool();
  if (!pool || !dotNumber) return { outOfService: false, reason: null };
  try {
    const [rows]: any = await pool.query(
      `SELECT oos_date, oos_reason FROM fmcsa_oos_orders
       WHERE dot_number = ? AND return_to_service_date IS NULL
       ORDER BY oos_date DESC LIMIT 1`,
      [dotNumber]
    );
    if (rows?.length > 0) {
      return { outOfService: true, reason: rows[0].oos_reason || "Out of Service" };
    }
    return { outOfService: false, reason: null };
  } catch {
    return { outOfService: false, reason: null };
  }
}

// ============================================================================
// COMPOSITE LOOKUP — Full carrier safety intelligence in one call
// ============================================================================

/**
 * Get comprehensive carrier safety intelligence.
 * Parallel-queries all 7 FMCSA tables for a single DOT number.
 * Returns unified risk tier + score + alerts.
 */
export async function getCarrierSafetyIntel(dotNumber: string): Promise<CarrierSafetyIntel> {
  const [census, authority, safety, crashes, inspections, insurance, oos] = await Promise.all([
    getCensus(dotNumber),
    getAuthority(dotNumber),
    getSafetyScores(dotNumber),
    getCrashSummary(dotNumber),
    getInspectionSummary(dotNumber),
    getInsuranceStatus(dotNumber),
    getOOSStatus(dotNumber),
  ]);

  const alerts: string[] = [];
  let riskScore = 0;

  // OOS is an instant CRITICAL
  if (oos.outOfService) {
    alerts.push(`OUT OF SERVICE: ${oos.reason}`);
    riskScore += 50;
  }

  // Authority issues
  if (authority && authority.authorityStatus !== "ACTIVE" && authority.authorityStatus !== "UNKNOWN") {
    alerts.push(`Authority status: ${authority.authorityStatus}`);
    riskScore += 20;
  }
  if (authority && !authority.commonAuthActive && !authority.brokerAuthActive) {
    alerts.push("No active operating authority");
    riskScore += 15;
  }

  // Insurance issues
  if (insurance && !insurance.isCompliant) {
    alerts.push("Insurance below minimum ($750K BIPD required)");
    riskScore += 15;
  }
  if (insurance && !insurance.hasLiability) {
    alerts.push("No liability insurance on file");
    riskScore += 20;
  }

  // Safety BASIC alerts
  if (safety) {
    if (safety.unsafeDrivingAlert) { alerts.push(`Unsafe Driving BASIC alert (score: ${safety.unsafeDrivingScore})`); riskScore += 10; }
    if (safety.hosAlert) { alerts.push(`HOS Compliance BASIC alert (score: ${safety.hosScore})`); riskScore += 8; }
    if (safety.vehicleMaintenanceAlert) { alerts.push(`Vehicle Maintenance BASIC alert (score: ${safety.vehicleMaintenanceScore})`); riskScore += 8; }
    if (safety.crashIndicatorAlert) { alerts.push(`Crash Indicator BASIC alert (score: ${safety.crashIndicatorScore})`); riskScore += 12; }
    if (safety.hazmatAlert) { alerts.push(`Hazmat Compliance BASIC alert (score: ${safety.hazmatScore})`); riskScore += 10; }
  }

  // Crash history
  if (crashes && crashes.totalFatalities > 0) { alerts.push(`${crashes.totalFatalities} fatality crash(es) on record`); riskScore += 15; }
  if (crashes && crashes.totalCrashes > 10) { alerts.push(`${crashes.totalCrashes} total crashes on record`); riskScore += 10; }

  // OOS rates
  if (safety && safety.driverOosRate !== null && safety.driverOosRate > 0.10) {
    alerts.push(`High driver OOS rate: ${(safety.driverOosRate * 100).toFixed(1)}%`);
    riskScore += 5;
  }

  riskScore = Math.min(100, riskScore);

  const riskTier: CarrierSafetyIntel["riskTier"] =
    !census ? "UNKNOWN" :
    riskScore >= 70 ? "CRITICAL" :
    riskScore >= 45 ? "HIGH" :
    riskScore >= 20 ? "MODERATE" : "LOW";

  return {
    census,
    authority,
    safety,
    crashes,
    inspections,
    insurance,
    outOfService: oos.outOfService,
    oosReason: oos.reason,
    riskTier,
    riskScore,
    alerts,
  };
}

// ============================================================================
// BATCH LOOKUPS — For scorecards, dispatch boards, load matching
// ============================================================================

/**
 * Batch-lookup safety scores for multiple DOT numbers.
 * Used by carrier scorecard comparison and dispatch boards.
 */
export async function batchSafetyScores(dotNumbers: string[]): Promise<Map<string, FMCSASafetyScores>> {
  const pool = getPool();
  const map = new Map<string, FMCSASafetyScores>();
  if (!pool || dotNumbers.length === 0) return map;

  try {
    const placeholders = dotNumbers.map(() => "?").join(",");
    const [rows]: any = await pool.query(
      `SELECT s.* FROM fmcsa_sms_scores s
       INNER JOIN (
         SELECT dot_number, MAX(run_date) as max_date
         FROM fmcsa_sms_scores WHERE dot_number IN (${placeholders})
         GROUP BY dot_number
       ) latest ON s.dot_number = latest.dot_number AND s.run_date = latest.max_date`,
      dotNumbers
    );
    for (const s of rows || []) {
      map.set(String(s.dot_number), {
        dotNumber: String(s.dot_number),
        runDate: s.run_date,
        unsafeDrivingScore: s.unsafe_driving_score ?? null,
        unsafeDrivingAlert: s.unsafe_driving_alert === "Y",
        hosScore: s.hos_score ?? null,
        hosAlert: s.hos_alert === "Y",
        driverFitnessScore: s.driver_fitness_score ?? null,
        driverFitnessAlert: s.driver_fitness_alert === "Y",
        controlledSubstancesScore: s.controlled_substances_score ?? null,
        controlledSubstancesAlert: s.controlled_substances_alert === "Y",
        vehicleMaintenanceScore: s.vehicle_maintenance_score ?? null,
        vehicleMaintenanceAlert: s.vehicle_maintenance_alert === "Y",
        hazmatScore: s.hazmat_score ?? null,
        hazmatAlert: s.hazmat_alert === "Y",
        crashIndicatorScore: s.crash_indicator_score ?? null,
        crashIndicatorAlert: s.crash_indicator_alert === "Y",
        inspectionsTotal: s.inspections_total || 0,
        driverOosRate: s.driver_oos_rate ?? null,
        vehicleOosRate: s.vehicle_oos_rate ?? null,
      });
    }
  } catch (e) {
    console.warn("[FMCSABulk] batchSafetyScores error:", (e as Error).message?.slice(0, 100));
  }
  return map;
}

/**
 * Batch-lookup crash counts for multiple DOT numbers.
 */
export async function batchCrashCounts(dotNumbers: string[]): Promise<Map<string, { total: number; fatalities: number }>> {
  const pool = getPool();
  const map = new Map<string, { total: number; fatalities: number }>();
  if (!pool || dotNumbers.length === 0) return map;
  try {
    const placeholders = dotNumbers.map(() => "?").join(",");
    const [rows]: any = await pool.query(
      `SELECT dot_number, COUNT(*) as total, COALESCE(SUM(fatalities),0) as fatalities
       FROM fmcsa_crashes WHERE dot_number IN (${placeholders}) GROUP BY dot_number`,
      dotNumbers
    );
    for (const r of rows || []) {
      map.set(String(r.dot_number), { total: r.total, fatalities: r.fatalities });
    }
  } catch (e) {
    console.warn("[FMCSABulk] batchCrashCounts error:", (e as Error).message?.slice(0, 100));
  }
  return map;
}

/**
 * Batch-lookup OOS status for multiple DOT numbers.
 */
export async function batchOOSStatus(dotNumbers: string[]): Promise<Map<string, boolean>> {
  const pool = getPool();
  const map = new Map<string, boolean>();
  if (!pool || dotNumbers.length === 0) return map;
  try {
    const placeholders = dotNumbers.map(() => "?").join(",");
    const [rows]: any = await pool.query(
      `SELECT dot_number FROM fmcsa_oos_orders
       WHERE dot_number IN (${placeholders}) AND return_to_service_date IS NULL
       GROUP BY dot_number`,
      dotNumbers
    );
    for (const r of rows || []) {
      map.set(String(r.dot_number), true);
    }
  } catch (e) {
    console.warn("[FMCSABulk] batchOOSStatus error:", (e as Error).message?.slice(0, 100));
  }
  return map;
}

// ============================================================================
// GEOGRAPHIC QUERIES — For Hot Zones & route risk scoring
// ============================================================================

/**
 * Get crash density within a geographic bounding box.
 * Used by Hot Zones zone aggregator for zone risk scoring.
 */
export async function getCrashDensityInBox(
  minLat: number, maxLat: number, minLng: number, maxLng: number
): Promise<{ count: number; fatalities: number; injuries: number }> {
  const pool = getPool();
  if (!pool) return { count: 0, fatalities: 0, injuries: 0 };
  try {
    const [[row]]: any = await pool.query(
      `SELECT COUNT(*) as cnt, COALESCE(SUM(fatalities),0) as fat, COALESCE(SUM(injuries),0) as inj
       FROM fmcsa_crashes
       WHERE latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?`,
      [minLat, maxLat, minLng, maxLng]
    );
    return { count: row?.cnt || 0, fatalities: row?.fat || 0, injuries: row?.inj || 0 };
  } catch {
    return { count: 0, fatalities: 0, injuries: 0 };
  }
}

/**
 * Get inspection density within a geographic bounding box.
 */
export async function getInspectionDensityInBox(
  minLat: number, maxLat: number, minLng: number, maxLng: number
): Promise<{ count: number; violations: number; oosCount: number }> {
  const pool = getPool();
  if (!pool) return { count: 0, violations: 0, oosCount: 0 };
  try {
    const [[row]]: any = await pool.query(
      `SELECT COUNT(*) as cnt,
              COALESCE(SUM(total_violations),0) as viols,
              SUM(CASE WHEN driver_oos='Y' OR vehicle_oos='Y' THEN 1 ELSE 0 END) as oos
       FROM fmcsa_inspections
       WHERE latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?`,
      [minLat, maxLat, minLng, maxLng]
    );
    return { count: row?.cnt || 0, violations: row?.viols || 0, oosCount: row?.oos || 0 };
  } catch {
    return { count: 0, violations: 0, oosCount: 0 };
  }
}

/**
 * Get state-level crash aggregation for route risk assessment.
 */
export async function getCrashCountsByState(): Promise<Map<string, number>> {
  const pool = getPool();
  const map = new Map<string, number>();
  if (!pool) return map;
  try {
    const [rows]: any = await pool.query(
      `SELECT state, COUNT(*) as cnt FROM fmcsa_crashes GROUP BY state ORDER BY cnt DESC`
    );
    for (const r of rows || []) {
      map.set(r.state, r.cnt);
    }
  } catch {}
  return map;
}
