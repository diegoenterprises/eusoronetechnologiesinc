/**
 * LIGHTSPEED — Materialized View System
 * ═══════════════════════════════════════════════════════════════
 *
 * Pre-joins 7 FMCSA tables into a single denormalized row per carrier.
 * Converts 7 parallel queries (35ms+ under load) → 1 query (2-5ms).
 *
 * Refresh Strategy: Zero-downtime SWAP
 *   1. CREATE carrier_intelligence_mv_new (build from 7-table JOIN)
 *   2. RENAME carrier_intelligence_mv → _old, _new → carrier_intelligence_mv
 *   3. DROP _old
 *   Total: ~3-5 minutes for 714K+ carriers. Zero read downtime.
 *
 * Triggers: After daily ETL completion + after monthly SMS refresh
 *
 * Part of Project LIGHTSPEED — Phase 1
 */

import { getPool } from "../../db";

// ============================================================================
// TABLE CREATION
// ============================================================================

const MV_TABLE = "carrier_intelligence_mv";
const MV_TABLE_NEW = "carrier_intelligence_mv_new";
const MV_TABLE_OLD = "carrier_intelligence_mv_old";

const CREATE_MV_SQL = (tableName: string) => `
CREATE TABLE IF NOT EXISTS \`${tableName}\` (
  dot_number       INT UNSIGNED NOT NULL,
  -- Census (denormalized)
  legal_name       VARCHAR(200) DEFAULT NULL,
  dba_name         VARCHAR(200) DEFAULT NULL,
  phy_street       VARCHAR(200) DEFAULT NULL,
  phy_city         VARCHAR(100) DEFAULT NULL,
  phy_state        CHAR(2) DEFAULT NULL,
  phy_zip          VARCHAR(10) DEFAULT NULL,
  telephone        VARCHAR(20) DEFAULT NULL,
  email_address    VARCHAR(200) DEFAULT NULL,
  nbr_power_unit   INT DEFAULT 0,
  driver_total     INT DEFAULT 0,
  carrier_operation VARCHAR(10) DEFAULT NULL,
  hm_flag          CHAR(1) DEFAULT 'N',
  pc_flag          CHAR(1) DEFAULT 'N',
  cargo_carried    TEXT DEFAULT NULL,
  mcs150_date      VARCHAR(20) DEFAULT NULL,
  mcs150_mileage   INT DEFAULT 0,
  -- Authority (denormalized)
  authority_status  VARCHAR(20) DEFAULT NULL,
  common_auth_active  TINYINT DEFAULT 0,
  contract_auth_active TINYINT DEFAULT 0,
  broker_auth_active TINYINT DEFAULT 0,
  mc_number         VARCHAR(20) DEFAULT NULL,
  bipd_insurance_on_file  DECIMAL(15,2) DEFAULT 0,
  cargo_insurance_on_file DECIMAL(15,2) DEFAULT 0,
  -- Insurance (pre-aggregated)
  has_active_insurance  TINYINT DEFAULT 0,
  bipd_coverage_amount  DECIMAL(15,2) DEFAULT 0,
  cargo_coverage_amount DECIMAL(15,2) DEFAULT 0,
  nearest_policy_expiry DATE DEFAULT NULL,
  insurance_compliant   TINYINT DEFAULT 0,
  -- Safety SMS BASICs (latest)
  sms_run_date          VARCHAR(20) DEFAULT NULL,
  unsafe_driving_score  TINYINT UNSIGNED DEFAULT NULL,
  unsafe_driving_alert  TINYINT DEFAULT 0,
  hos_score             TINYINT UNSIGNED DEFAULT NULL,
  hos_alert             TINYINT DEFAULT 0,
  driver_fitness_score  TINYINT UNSIGNED DEFAULT NULL,
  driver_fitness_alert  TINYINT DEFAULT 0,
  controlled_sub_score  TINYINT UNSIGNED DEFAULT NULL,
  controlled_sub_alert  TINYINT DEFAULT 0,
  vehicle_maint_score   TINYINT UNSIGNED DEFAULT NULL,
  vehicle_maint_alert   TINYINT DEFAULT 0,
  hazmat_score          TINYINT UNSIGNED DEFAULT NULL,
  hazmat_alert          TINYINT DEFAULT 0,
  crash_indicator_score TINYINT UNSIGNED DEFAULT NULL,
  crash_indicator_alert TINYINT DEFAULT 0,
  driver_oos_rate       DECIMAL(5,4) DEFAULT NULL,
  vehicle_oos_rate      DECIMAL(5,4) DEFAULT NULL,
  -- Crash summary (pre-aggregated)
  total_crashes         INT DEFAULT 0,
  fatal_crashes         INT DEFAULT 0,
  injury_crashes        INT DEFAULT 0,
  total_fatalities      INT DEFAULT 0,
  hazmat_releases       INT DEFAULT 0,
  -- Inspection summary (pre-aggregated)
  total_inspections     INT DEFAULT 0,
  driver_oos_count      INT DEFAULT 0,
  vehicle_oos_count     INT DEFAULT 0,
  total_violations      INT DEFAULT 0,
  -- OOS status
  has_active_oos        TINYINT DEFAULT 0,
  oos_date              DATE DEFAULT NULL,
  oos_reason            VARCHAR(500) DEFAULT NULL,
  -- BOC-3
  has_boc3              TINYINT DEFAULT 0,
  -- Pre-computed scores
  risk_score            TINYINT UNSIGNED DEFAULT 0,
  risk_tier             ENUM('LOW','MODERATE','HIGH','CRITICAL','UNKNOWN') DEFAULT 'UNKNOWN',
  eligibility_score     TINYINT UNSIGNED DEFAULT 0,
  is_blocked            TINYINT DEFAULT 0,
  blocked_reasons       TEXT DEFAULT NULL,
  -- Metadata
  last_computed_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_version          INT UNSIGNED DEFAULT 1,

  PRIMARY KEY (dot_number),
  INDEX idx_mv_name (legal_name),
  INDEX idx_mv_state (phy_state),
  INDEX idx_mv_risk (risk_tier, risk_score),
  INDEX idx_mv_eligible (is_blocked, eligibility_score),
  INDEX idx_mv_hm (hm_flag),
  INDEX idx_mv_mc (mc_number),
  INDEX idx_mv_authority (authority_status),
  FULLTEXT ft_mv_search (legal_name, dba_name, phy_city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

// ============================================================================
// POPULATE — 7-table JOIN + risk score computation in SQL
// ============================================================================

const POPULATE_SQL = (tableName: string) => `
INSERT INTO \`${tableName}\` (
  dot_number, legal_name, dba_name, phy_street, phy_city, phy_state, phy_zip,
  telephone, email_address, nbr_power_unit, driver_total, carrier_operation,
  hm_flag, pc_flag, cargo_carried, mcs150_date, mcs150_mileage,
  authority_status, common_auth_active, contract_auth_active, broker_auth_active,
  mc_number, bipd_insurance_on_file, cargo_insurance_on_file,
  has_active_insurance, bipd_coverage_amount, cargo_coverage_amount,
  nearest_policy_expiry, insurance_compliant,
  sms_run_date, unsafe_driving_score, unsafe_driving_alert,
  hos_score, hos_alert, driver_fitness_score, driver_fitness_alert,
  controlled_sub_score, controlled_sub_alert, vehicle_maint_score, vehicle_maint_alert,
  hazmat_score, hazmat_alert, crash_indicator_score, crash_indicator_alert,
  driver_oos_rate, vehicle_oos_rate,
  total_crashes, fatal_crashes, injury_crashes, total_fatalities, hazmat_releases,
  total_inspections, driver_oos_count, vehicle_oos_count, total_violations,
  has_active_oos, oos_date, oos_reason,
  has_boc3,
  risk_score, risk_tier, eligibility_score, is_blocked, blocked_reasons,
  last_computed_at, data_version
)
SELECT
  c.dot_number,
  c.legal_name, c.dba_name, c.phy_street, c.phy_city, c.phy_state, c.phy_zip,
  c.telephone, c.email_address,
  COALESCE(c.nbr_power_unit, 0),
  COALESCE(c.driver_total, 0),
  c.carrier_operation,
  COALESCE(c.hm_flag, 'N'),
  COALESCE(c.pc_flag, 'N'),
  c.cargo_carried,
  c.mcs150_date,
  COALESCE(c.mcs150_mileage, 0),
  -- Authority
  a.authority_status,
  IF(a.common_auth_granted IS NOT NULL AND a.common_auth_revoked IS NULL, 1, 0),
  IF(a.contract_auth_granted IS NOT NULL AND a.contract_auth_revoked IS NULL, 1, 0),
  IF(a.broker_auth_granted IS NOT NULL AND a.broker_auth_revoked IS NULL, 1, 0),
  a.docket_number,
  COALESCE(a.bipd_insurance_on_file, 0),
  COALESCE(a.cargo_insurance_on_file, 0),
  -- Insurance (pre-aggregated from subquery)
  COALESCE(ins.has_active, 0),
  COALESCE(ins.max_bipd, 0),
  COALESCE(ins.max_cargo, 0),
  ins.nearest_expiry,
  IF(COALESCE(ins.max_bipd, 0) >= 750000, 1, 0),
  -- SMS BASICs
  sms.run_date,
  sms.unsafe_driving_score,
  IF(sms.unsafe_driving_alert = 'Y', 1, 0),
  sms.hos_score,
  IF(sms.hos_alert = 'Y', 1, 0),
  sms.driver_fitness_score,
  IF(sms.driver_fitness_alert = 'Y', 1, 0),
  sms.controlled_substances_score,
  IF(sms.controlled_substances_alert = 'Y', 1, 0),
  sms.vehicle_maintenance_score,
  IF(sms.vehicle_maintenance_alert = 'Y', 1, 0),
  sms.hazmat_score,
  IF(sms.hazmat_alert = 'Y', 1, 0),
  sms.crash_indicator_score,
  IF(sms.crash_indicator_alert = 'Y', 1, 0),
  sms.driver_oos_rate,
  sms.vehicle_oos_rate,
  -- Crash summary
  COALESCE(cr.total_crashes, 0),
  COALESCE(cr.fatal_crashes, 0),
  COALESCE(cr.injury_crashes, 0),
  COALESCE(cr.total_fatalities, 0),
  COALESCE(cr.hazmat_releases, 0),
  -- Inspection summary
  COALESCE(insp.total_inspections, 0),
  COALESCE(insp.driver_oos_count, 0),
  COALESCE(insp.vehicle_oos_count, 0),
  COALESCE(insp.total_violations, 0),
  -- OOS
  IF(oos.dot_number IS NOT NULL, 1, 0),
  oos.oos_date,
  oos.oos_reason,
  -- BOC-3
  IF(boc.dot_number IS NOT NULL, 1, 0),
  -- Risk score (computed in SQL — mirrors fmcsaBulkLookup.ts logic)
  LEAST(100, (
    IF(oos.dot_number IS NOT NULL, 50, 0)
    + IF(a.authority_status IS NOT NULL AND a.authority_status NOT IN ('ACTIVE','UNKNOWN') AND a.authority_status != '', 20, 0)
    + IF(a.common_auth_granted IS NULL AND a.broker_auth_granted IS NULL, 15, 0)
    + IF(COALESCE(ins.max_bipd, 0) < 750000 AND COALESCE(ins.has_active, 0) = 1, 15, 0)
    + IF(COALESCE(ins.has_active, 0) = 0, 20, 0)
    + IF(sms.unsafe_driving_alert = 'Y', 10, 0)
    + IF(sms.hos_alert = 'Y', 8, 0)
    + IF(sms.vehicle_maintenance_alert = 'Y', 8, 0)
    + IF(sms.crash_indicator_alert = 'Y', 12, 0)
    + IF(sms.hazmat_alert = 'Y', 10, 0)
    + IF(COALESCE(cr.total_fatalities, 0) > 0, 15, 0)
    + IF(COALESCE(cr.total_crashes, 0) > 10, 10, 0)
    + IF(sms.driver_oos_rate > 0.10, 5, 0)
  )),
  -- Risk tier
  CASE
    WHEN c.dot_number IS NULL THEN 'UNKNOWN'
    WHEN LEAST(100, (
      IF(oos.dot_number IS NOT NULL, 50, 0)
      + IF(a.authority_status IS NOT NULL AND a.authority_status NOT IN ('ACTIVE','UNKNOWN') AND a.authority_status != '', 20, 0)
      + IF(a.common_auth_granted IS NULL AND a.broker_auth_granted IS NULL, 15, 0)
      + IF(COALESCE(ins.max_bipd, 0) < 750000 AND COALESCE(ins.has_active, 0) = 1, 15, 0)
      + IF(COALESCE(ins.has_active, 0) = 0, 20, 0)
      + IF(sms.unsafe_driving_alert = 'Y', 10, 0)
      + IF(sms.hos_alert = 'Y', 8, 0)
      + IF(sms.vehicle_maintenance_alert = 'Y', 8, 0)
      + IF(sms.crash_indicator_alert = 'Y', 12, 0)
      + IF(sms.hazmat_alert = 'Y', 10, 0)
      + IF(COALESCE(cr.total_fatalities, 0) > 0, 15, 0)
      + IF(COALESCE(cr.total_crashes, 0) > 10, 10, 0)
      + IF(sms.driver_oos_rate > 0.10, 5, 0)
    )) >= 70 THEN 'CRITICAL'
    WHEN LEAST(100, (
      IF(oos.dot_number IS NOT NULL, 50, 0)
      + IF(a.authority_status IS NOT NULL AND a.authority_status NOT IN ('ACTIVE','UNKNOWN') AND a.authority_status != '', 20, 0)
      + IF(a.common_auth_granted IS NULL AND a.broker_auth_granted IS NULL, 15, 0)
      + IF(COALESCE(ins.max_bipd, 0) < 750000 AND COALESCE(ins.has_active, 0) = 1, 15, 0)
      + IF(COALESCE(ins.has_active, 0) = 0, 20, 0)
      + IF(sms.unsafe_driving_alert = 'Y', 10, 0)
      + IF(sms.hos_alert = 'Y', 8, 0)
      + IF(sms.vehicle_maintenance_alert = 'Y', 8, 0)
      + IF(sms.crash_indicator_alert = 'Y', 12, 0)
      + IF(sms.hazmat_alert = 'Y', 10, 0)
      + IF(COALESCE(cr.total_fatalities, 0) > 0, 15, 0)
      + IF(COALESCE(cr.total_crashes, 0) > 10, 10, 0)
      + IF(sms.driver_oos_rate > 0.10, 5, 0)
    )) >= 45 THEN 'HIGH'
    WHEN LEAST(100, (
      IF(oos.dot_number IS NOT NULL, 50, 0)
      + IF(a.authority_status IS NOT NULL AND a.authority_status NOT IN ('ACTIVE','UNKNOWN') AND a.authority_status != '', 20, 0)
      + IF(a.common_auth_granted IS NULL AND a.broker_auth_granted IS NULL, 15, 0)
      + IF(COALESCE(ins.max_bipd, 0) < 750000 AND COALESCE(ins.has_active, 0) = 1, 15, 0)
      + IF(COALESCE(ins.has_active, 0) = 0, 20, 0)
      + IF(sms.unsafe_driving_alert = 'Y', 10, 0)
      + IF(sms.hos_alert = 'Y', 8, 0)
      + IF(sms.vehicle_maintenance_alert = 'Y', 8, 0)
      + IF(sms.crash_indicator_alert = 'Y', 12, 0)
      + IF(sms.hazmat_alert = 'Y', 10, 0)
      + IF(COALESCE(cr.total_fatalities, 0) > 0, 15, 0)
      + IF(COALESCE(cr.total_crashes, 0) > 10, 10, 0)
      + IF(sms.driver_oos_rate > 0.10, 5, 0)
    )) >= 20 THEN 'MODERATE'
    ELSE 'LOW'
  END,
  -- Eligibility score (simplified — full formula in instantVerification.ts)
  GREATEST(0, 100
    - IF(oos.dot_number IS NOT NULL, 100, 0)
    - IF(a.authority_status NOT IN ('ACTIVE','') OR a.authority_status IS NULL, 15, 0)
    - IF(COALESCE(ins.has_active, 0) = 0, 15, 0)
    - IF(COALESCE(ins.max_bipd, 0) < 750000 AND COALESCE(ins.has_active, 0) = 1, 10, 0)
    - IF(sms.unsafe_driving_alert = 'Y', 5, 0)
    - IF(sms.crash_indicator_alert = 'Y', 5, 0)
    - IF(COALESCE(cr.total_fatalities, 0) > 0, 10, 0)
  ),
  -- is_blocked (hard gates)
  IF(oos.dot_number IS NOT NULL
     OR (a.common_auth_granted IS NULL AND a.contract_auth_granted IS NULL AND a.broker_auth_granted IS NULL)
     OR COALESCE(ins.has_active, 0) = 0, 1, 0),
  -- blocked_reasons (JSON array)
  CONCAT('[',
    IF(oos.dot_number IS NOT NULL, '"Active Out-of-Service Order",', ''),
    IF(a.common_auth_granted IS NULL AND a.contract_auth_granted IS NULL AND a.broker_auth_granted IS NULL AND a.dot_number IS NOT NULL, '"No Operating Authority",', ''),
    IF(COALESCE(ins.has_active, 0) = 0 AND a.dot_number IS NOT NULL, '"No Active Insurance",', ''),
  ']'),
  NOW(),
  1
FROM fmcsa_census c
LEFT JOIN (
  SELECT a1.*
  FROM fmcsa_authority a1
  INNER JOIN (
    SELECT dot_number, MAX(fetched_at) AS max_fetched
    FROM fmcsa_authority GROUP BY dot_number
  ) a2 ON a1.dot_number = a2.dot_number AND a1.fetched_at = a2.max_fetched
) a ON c.dot_number = a.dot_number
LEFT JOIN (
  SELECT dot_number,
    MAX(IF(is_active = 1, 1, 0)) AS has_active,
    MAX(CASE WHEN is_active = 1 THEN bipd_max_limit ELSE 0 END) AS max_bipd,
    MAX(CASE WHEN is_active = 1 THEN cargo_limit ELSE 0 END) AS max_cargo,
    MIN(CASE WHEN is_active = 1 AND coverage_to IS NOT NULL THEN coverage_to END) AS nearest_expiry
  FROM fmcsa_insurance GROUP BY dot_number
) ins ON c.dot_number = ins.dot_number
LEFT JOIN (
  SELECT s1.*
  FROM fmcsa_sms_scores s1
  INNER JOIN (
    SELECT dot_number, MAX(run_date) AS max_date
    FROM fmcsa_sms_scores GROUP BY dot_number
  ) s2 ON s1.dot_number = s2.dot_number AND s1.run_date = s2.max_date
) sms ON c.dot_number = sms.dot_number
LEFT JOIN (
  SELECT dot_number,
    COUNT(*) AS total_crashes,
    SUM(CASE WHEN fatalities > 0 THEN 1 ELSE 0 END) AS fatal_crashes,
    SUM(CASE WHEN injuries > 0 THEN 1 ELSE 0 END) AS injury_crashes,
    COALESCE(SUM(fatalities), 0) AS total_fatalities,
    SUM(CASE WHEN hazmat_released = 'Y' THEN 1 ELSE 0 END) AS hazmat_releases
  FROM fmcsa_crashes GROUP BY dot_number
) cr ON c.dot_number = cr.dot_number
LEFT JOIN (
  SELECT dot_number,
    COUNT(*) AS total_inspections,
    SUM(CASE WHEN driver_oos = 'Y' THEN 1 ELSE 0 END) AS driver_oos_count,
    SUM(CASE WHEN vehicle_oos = 'Y' THEN 1 ELSE 0 END) AS vehicle_oos_count,
    COALESCE(SUM(total_violations), 0) AS total_violations
  FROM fmcsa_inspections GROUP BY dot_number
) insp ON c.dot_number = insp.dot_number
LEFT JOIN (
  SELECT dot_number, MIN(oos_date) AS oos_date, oos_reason
  FROM fmcsa_oos_orders
  WHERE return_to_service_date IS NULL
  GROUP BY dot_number
) oos ON c.dot_number = oos.dot_number
LEFT JOIN (
  SELECT DISTINCT dot_number FROM fmcsa_boc3
) boc ON c.dot_number = boc.dot_number
WHERE c.nbr_power_unit > 0
`;

// ============================================================================
// REFRESH — Zero-downtime SWAP
// ============================================================================

export interface RefreshResult {
  success: boolean;
  rowCount: number;
  durationMs: number;
  error?: string;
}

/**
 * Refresh the materialized view using zero-downtime SWAP strategy.
 * Can be called safely during live traffic — reads are never interrupted.
 */
export async function refreshMaterializedView(): Promise<RefreshResult> {
  const pool = getPool();
  if (!pool) return { success: false, rowCount: 0, durationMs: 0, error: "No database pool" };

  const start = Date.now();
  console.log("[LIGHTSPEED MV] Starting materialized view refresh...");

  try {
    // Step 0: Check if source tables exist
    const [tables]: any = await pool.query(
      `SELECT COUNT(*) as cnt FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fmcsa_census'`
    );
    if (!tables[0]?.cnt) {
      return { success: false, rowCount: 0, durationMs: Date.now() - start, error: "fmcsa_census table not found" };
    }

    // Step 1: Drop any leftover staging table
    await pool.query(`DROP TABLE IF EXISTS \`${MV_TABLE_NEW}\``);
    await pool.query(`DROP TABLE IF EXISTS \`${MV_TABLE_OLD}\``);

    // Step 2: Create staging table
    await pool.query(CREATE_MV_SQL(MV_TABLE_NEW));
    console.log("[LIGHTSPEED MV] Staging table created");

    // Step 3: Populate from 7-table JOIN
    console.log("[LIGHTSPEED MV] Populating from 7-table JOIN (this takes 3-5 minutes)...");
    const [insertResult]: any = await pool.query(POPULATE_SQL(MV_TABLE_NEW));
    const rowCount = insertResult?.affectedRows || 0;
    console.log(`[LIGHTSPEED MV] Populated ${rowCount.toLocaleString()} carriers`);

    // Step 3.5: Clean up blocked_reasons JSON — remove trailing commas
    await pool.query(`UPDATE \`${MV_TABLE_NEW}\` SET blocked_reasons = REPLACE(blocked_reasons, ',]', ']') WHERE blocked_reasons LIKE '%,]%'`);

    // Step 4: Ensure the production table exists (first run)
    const [mvExists]: any = await pool.query(
      `SELECT COUNT(*) as cnt FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
      [MV_TABLE]
    );

    if (mvExists[0]?.cnt === 0) {
      // First run — just rename staging to production
      await pool.query(`RENAME TABLE \`${MV_TABLE_NEW}\` TO \`${MV_TABLE}\``);
      console.log("[LIGHTSPEED MV] Initial table created (first run)");
    } else {
      // SWAP: rename current → old, staging → current, drop old
      await pool.query(
        `RENAME TABLE \`${MV_TABLE}\` TO \`${MV_TABLE_OLD}\`, \`${MV_TABLE_NEW}\` TO \`${MV_TABLE}\``
      );
      await pool.query(`DROP TABLE IF EXISTS \`${MV_TABLE_OLD}\``);
      console.log("[LIGHTSPEED MV] Zero-downtime SWAP complete");
    }

    const durationMs = Date.now() - start;
    console.log(`[LIGHTSPEED MV] ✓ Refresh complete: ${rowCount.toLocaleString()} carriers in ${(durationMs / 1000).toFixed(1)}s`);

    return { success: true, rowCount, durationMs };

  } catch (err: any) {
    const durationMs = Date.now() - start;
    console.error(`[LIGHTSPEED MV] ✗ Refresh failed after ${(durationMs / 1000).toFixed(1)}s:`, err.message);

    // Cleanup on failure
    try { await pool.query(`DROP TABLE IF EXISTS \`${MV_TABLE_NEW}\``); } catch {}
    try { await pool.query(`DROP TABLE IF EXISTS \`${MV_TABLE_OLD}\``); } catch {}

    return { success: false, rowCount: 0, durationMs, error: err.message?.slice(0, 200) };
  }
}

// ============================================================================
// QUERY — Single-row carrier lookup from materialized view
// ============================================================================

export interface CarrierMV {
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
  carrierOperation: string | null;
  hmFlag: string;
  cargoCarried: string | null;
  authorityStatus: string | null;
  commonAuthActive: boolean;
  contractAuthActive: boolean;
  brokerAuthActive: boolean;
  mcNumber: string | null;
  bipdInsuranceOnFile: number;
  cargoInsuranceOnFile: number;
  hasActiveInsurance: boolean;
  bipdCoverageAmount: number;
  cargoCoverageAmount: number;
  nearestPolicyExpiry: string | null;
  insuranceCompliant: boolean;
  smsRunDate: string | null;
  unsafeDrivingScore: number | null;
  unsafeDrivingAlert: boolean;
  hosScore: number | null;
  hosAlert: boolean;
  driverFitnessScore: number | null;
  driverFitnessAlert: boolean;
  controlledSubScore: number | null;
  controlledSubAlert: boolean;
  vehicleMaintScore: number | null;
  vehicleMaintAlert: boolean;
  hazmatScore: number | null;
  hazmatAlert: boolean;
  crashIndicatorScore: number | null;
  crashIndicatorAlert: boolean;
  driverOosRate: number | null;
  vehicleOosRate: number | null;
  totalCrashes: number;
  fatalCrashes: number;
  injuryCrashes: number;
  totalFatalities: number;
  hazmatReleases: number;
  totalInspections: number;
  driverOosCount: number;
  vehicleOosCount: number;
  totalViolations: number;
  hasActiveOos: boolean;
  oosDate: string | null;
  oosReason: string | null;
  hasBoc3: boolean;
  riskScore: number;
  riskTier: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "UNKNOWN";
  eligibilityScore: number;
  isBlocked: boolean;
  blockedReasons: string[];
  lastComputedAt: string;
}

/**
 * Get a single carrier from the materialized view.
 * 1 query instead of 7. Includes pre-computed risk score and eligibility.
 */
export async function getCarrierFromMV(dotNumber: string): Promise<CarrierMV | null> {
  const pool = getPool();
  if (!pool || !dotNumber) return null;

  try {
    const [rows]: any = await pool.query(
      `SELECT * FROM \`${MV_TABLE}\` WHERE dot_number = ? LIMIT 1`,
      [dotNumber]
    );
    if (!rows?.length) return null;
    return mapRowToCarrierMV(rows[0]);
  } catch (err: any) {
    // Table might not exist yet — fall through to legacy queries
    if (err.message?.includes("doesn't exist")) return null;
    console.warn("[LIGHTSPEED MV] Query error:", err.message?.slice(0, 100));
    return null;
  }
}

/**
 * Batch-get multiple carriers from the materialized view.
 * Used for search results enrichment and load board.
 */
export async function batchGetFromMV(dotNumbers: string[]): Promise<Map<string, CarrierMV>> {
  const pool = getPool();
  const result = new Map<string, CarrierMV>();
  if (!pool || dotNumbers.length === 0) return result;

  try {
    const placeholders = dotNumbers.map(() => "?").join(",");
    const [rows]: any = await pool.query(
      `SELECT * FROM \`${MV_TABLE}\` WHERE dot_number IN (${placeholders})`,
      dotNumbers
    );
    for (const row of rows || []) {
      const mv = mapRowToCarrierMV(row);
      result.set(mv.dotNumber, mv);
    }
  } catch {}
  return result;
}

/**
 * Search the materialized view using FULLTEXT index.
 * Returns carriers with pre-computed risk scores — no 7-table join needed.
 */
export async function searchMV(
  query: string,
  limit: number = 20
): Promise<CarrierMV[]> {
  const pool = getPool();
  if (!pool || !query.trim()) return [];

  try {
    const trimmed = query.trim();
    const isNumeric = /^\d+$/.test(trimmed);
    const isMC = /^mc[#\s-]*\d+/i.test(trimmed);
    const mcNum = isMC ? trimmed.replace(/^mc[#\s-]*/i, "") : null;

    let sql: string;
    let params: any[];

    if (isNumeric) {
      sql = `SELECT * FROM \`${MV_TABLE}\` WHERE dot_number LIKE ? ORDER BY dot_number LIMIT ?`;
      params = [`${trimmed}%`, limit];
    } else if (mcNum) {
      sql = `SELECT * FROM \`${MV_TABLE}\` WHERE mc_number LIKE ? LIMIT ?`;
      params = [`${mcNum}%`, limit];
    } else {
      const ftQuery = trimmed.split(/\s+/).map(w => `+${w}*`).join(" ");
      sql = `SELECT *, MATCH(legal_name, dba_name, phy_city) AGAINST(? IN BOOLEAN MODE) AS relevance
             FROM \`${MV_TABLE}\`
             WHERE MATCH(legal_name, dba_name, phy_city) AGAINST(? IN BOOLEAN MODE)
             ORDER BY relevance DESC LIMIT ?`;
      params = [ftQuery, ftQuery, limit];
    }

    const [rows]: any = await pool.query(sql, params);
    return (rows || []).map(mapRowToCarrierMV);
  } catch (err: any) {
    if (err.message?.includes("doesn't exist")) return [];
    console.warn("[LIGHTSPEED MV] Search error:", err.message?.slice(0, 100));
    return [];
  }
}

/**
 * Check if the materialized view exists and has data.
 */
export async function isMVReady(): Promise<{ exists: boolean; rowCount: number }> {
  const pool = getPool();
  if (!pool) return { exists: false, rowCount: 0 };
  try {
    const [rows]: any = await pool.query(`SELECT COUNT(*) as cnt FROM \`${MV_TABLE}\``);
    return { exists: true, rowCount: rows[0]?.cnt || 0 };
  } catch {
    return { exists: false, rowCount: 0 };
  }
}

// ============================================================================
// ROW MAPPER
// ============================================================================

function mapRowToCarrierMV(r: any): CarrierMV {
  let blockedReasons: string[] = [];
  try {
    if (r.blocked_reasons) blockedReasons = JSON.parse(r.blocked_reasons).filter(Boolean);
  } catch {}

  return {
    dotNumber: String(r.dot_number),
    legalName: r.legal_name || "Unknown",
    dbaName: r.dba_name || null,
    phyStreet: r.phy_street || null,
    phyCity: r.phy_city || null,
    phyState: r.phy_state || null,
    phyZip: r.phy_zip || null,
    telephone: r.telephone || null,
    emailAddress: r.email_address || null,
    nbrPowerUnit: r.nbr_power_unit || 0,
    driverTotal: r.driver_total || 0,
    carrierOperation: r.carrier_operation || null,
    hmFlag: r.hm_flag || "N",
    cargoCarried: r.cargo_carried || null,
    authorityStatus: r.authority_status || null,
    commonAuthActive: !!r.common_auth_active,
    contractAuthActive: !!r.contract_auth_active,
    brokerAuthActive: !!r.broker_auth_active,
    mcNumber: r.mc_number || null,
    bipdInsuranceOnFile: r.bipd_insurance_on_file || 0,
    cargoInsuranceOnFile: r.cargo_insurance_on_file || 0,
    hasActiveInsurance: !!r.has_active_insurance,
    bipdCoverageAmount: r.bipd_coverage_amount || 0,
    cargoCoverageAmount: r.cargo_coverage_amount || 0,
    nearestPolicyExpiry: r.nearest_policy_expiry || null,
    insuranceCompliant: !!r.insurance_compliant,
    smsRunDate: r.sms_run_date || null,
    unsafeDrivingScore: r.unsafe_driving_score ?? null,
    unsafeDrivingAlert: !!r.unsafe_driving_alert,
    hosScore: r.hos_score ?? null,
    hosAlert: !!r.hos_alert,
    driverFitnessScore: r.driver_fitness_score ?? null,
    driverFitnessAlert: !!r.driver_fitness_alert,
    controlledSubScore: r.controlled_sub_score ?? null,
    controlledSubAlert: !!r.controlled_sub_alert,
    vehicleMaintScore: r.vehicle_maint_score ?? null,
    vehicleMaintAlert: !!r.vehicle_maint_alert,
    hazmatScore: r.hazmat_score ?? null,
    hazmatAlert: !!r.hazmat_alert,
    crashIndicatorScore: r.crash_indicator_score ?? null,
    crashIndicatorAlert: !!r.crash_indicator_alert,
    driverOosRate: r.driver_oos_rate ?? null,
    vehicleOosRate: r.vehicle_oos_rate ?? null,
    totalCrashes: r.total_crashes || 0,
    fatalCrashes: r.fatal_crashes || 0,
    injuryCrashes: r.injury_crashes || 0,
    totalFatalities: r.total_fatalities || 0,
    hazmatReleases: r.hazmat_releases || 0,
    totalInspections: r.total_inspections || 0,
    driverOosCount: r.driver_oos_count || 0,
    vehicleOosCount: r.vehicle_oos_count || 0,
    totalViolations: r.total_violations || 0,
    hasActiveOos: !!r.has_active_oos,
    oosDate: r.oos_date || null,
    oosReason: r.oos_reason || null,
    hasBoc3: !!r.has_boc3,
    riskScore: r.risk_score || 0,
    riskTier: r.risk_tier || "UNKNOWN",
    eligibilityScore: r.eligibility_score || 0,
    isBlocked: !!r.is_blocked,
    blockedReasons,
    lastComputedAt: r.last_computed_at || new Date().toISOString(),
  };
}
