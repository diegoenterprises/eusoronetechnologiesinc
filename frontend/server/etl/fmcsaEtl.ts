/**
 * FMCSA BULK DATA ETL SERVICE
 * 
 * Pulls data from DOT Open Data Portal (data.transportation.gov)
 * and loads into EusoTrip database for carrier verification and monitoring.
 * 
 * Data Sources:
 * - Company Census (daily)
 * - Operating Authority (daily)
 * - Insurance (daily)
 * - Crashes (daily, 3-year rolling)
 * - Inspections (daily, 3-year rolling)
 * - Violations (daily)
 * - SMS BASIC Scores (monthly)
 * - Out of Service Orders (daily)
 * 
 * Usage:
 *   npx ts-node server/etl/fmcsaEtl.ts --dataset=census
 *   npx ts-node server/etl/fmcsaEtl.ts --dataset=all
 *   npx ts-node server/etl/fmcsaEtl.ts --dataset=sms --full
 */

import { getDb, getPool } from "../db";
import { logger } from "../_core/logger";

// ============================================================================
// CONFIGURATION
// ============================================================================

const DATA_GOV_BASE = "https://data.transportation.gov/api/views";

// Dataset IDs from data.transportation.gov
const DATASETS = {
  // Daily Updates - Entities with USDOT
  census: {
    id: "az4n-8mr2",
    table: "fmcsa_census",
    name: "Company Census File",
    frequency: "daily",
  },
  crashes: {
    id: "aayw-vxb3",
    table: "fmcsa_crashes",
    name: "Crash File",
    frequency: "daily",
  },
  inspections: {
    id: "fx4q-ay7w",
    table: "fmcsa_inspections",
    name: "Vehicle Inspection File",
    frequency: "daily",
  },
  violations: {
    id: "876r-jsdb",
    table: "fmcsa_violations",
    name: "Vehicle Inspections and Violations",
    frequency: "daily",
  },
  inspectionsPerUnit: {
    id: "wt8s-2hbx",
    table: "fmcsa_inspections",
    name: "Inspections Per Unit",
    frequency: "daily",
  },
  specialStudies: {
    id: "5qik-smay",
    table: "fmcsa_inspections",
    name: "Special Studies",
    frequency: "daily",
  },
  inspectionsCitations: {
    id: "qbt8-7vic",
    table: "fmcsa_violations",
    name: "Inspections and Citations",
    frequency: "daily",
  },
  
  // Daily Updates - Operating Authority
  carrier: {
    id: "6eyk-hxee",
    table: "fmcsa_authority",
    name: "Carrier - All With History",
    frequency: "daily",
  },
  insurance: {
    id: "ypjt-5ydn",
    table: "fmcsa_insurance",
    name: "Insur - All With History",
    frequency: "daily",
  },
  insuranceActive: {
    id: "qh9u-swkp",
    table: "fmcsa_insurance",
    name: "ActPendInsur - All With History",
    frequency: "daily",
  },
  insuranceHistory: {
    id: "6sqe-dvqs",
    table: "fmcsa_insurance",
    name: "InsHist - All With History",
    frequency: "daily",
  },
  boc3: {
    id: "2emp-mxtb",
    table: "fmcsa_boc3",
    name: "BOC3 - All With History",
    frequency: "daily",
  },
  authHistory: {
    id: "9mw4-x3tu",
    table: "fmcsa_authority",
    name: "AuthHist - All With History",
    frequency: "daily",
  },
  revocations: {
    id: "sa6p-acbp",
    table: "fmcsa_revocations",
    name: "Revocation - All With History",
    frequency: "daily",
  },
  rejected: {
    id: "96tg-4mhf",
    table: "fmcsa_revocations",
    name: "Rejected - All With History",
    frequency: "daily",
  },
  
  // Monthly Updates - SMS
  smsCensus: {
    id: "kjg3-diqy",
    table: "fmcsa_census",
    name: "SMS Input - Motor Carrier Census",
    frequency: "monthly",
  },
  smsInspections: {
    id: "rbkj-cgst",
    table: "fmcsa_inspections",
    name: "SMS Input - Inspection Data",
    frequency: "monthly",
  },
  smsCrashes: {
    id: "4wxs-vbns",
    table: "fmcsa_crashes",
    name: "SMS Input - Crash Data",
    frequency: "monthly",
  },
  smsViolations: {
    id: "8mt8-2mdr",
    table: "fmcsa_violations",
    name: "SMS Input - Violation Data",
    frequency: "monthly",
  },
  smsScoresProperty: {
    id: "4y6x-dmck",
    table: "fmcsa_sms_scores",
    name: "SMS AB PassProperty",
    frequency: "monthly",
  },
  smsScoresPassenger: {
    id: "m3ry-qcip",
    table: "fmcsa_sms_scores",
    name: "SMS AB Pass",
    frequency: "monthly",
  },
  smsCPassProperty: {
    id: "h9zy-gjn8",
    table: "fmcsa_sms_scores",
    name: "SMS C PassProperty",
    frequency: "monthly",
  },
  smsCPass: {
    id: "h3zn-uid9",
    table: "fmcsa_sms_scores",
    name: "SMS C Pass",
    frequency: "monthly",
  },
  
  // Other
  oosOrders: {
    id: "p2mt-9ige",
    table: "fmcsa_oos_orders",
    name: "Out of Service Orders",
    frequency: "daily",
  },
} as const;

// Delta datasets (daily changes only)
const DELTA_DATASETS = {
  carrierDelta: { id: "6qg9-x4f8", table: "fmcsa_authority", name: "Carrier (Daily Delta)" },
  insHistDelta: { id: "xkmg-ff2t", table: "fmcsa_insurance", name: "InsHist (Daily Delta)" },
  actPendInsurDelta: { id: "chgs-tx6x", table: "fmcsa_insurance", name: "ActPendInsur (Daily Delta)" },
  insurDelta: { id: "mzmm-6xep", table: "fmcsa_insurance", name: "Insur (Daily Delta)" },
  authHistDelta: { id: "sn3k-dnx7", table: "fmcsa_authority", name: "AuthHist (Daily Delta)" },
  boc3Delta: { id: "fb8g-ngam", table: "fmcsa_boc3", name: "BOC3 (Daily Delta)" },
  revocationDelta: { id: "pivg-szje", table: "fmcsa_revocations", name: "Revocation (Daily Delta)" },
  rejectedDelta: { id: "t3zq-c6n3", table: "fmcsa_revocations", name: "Rejected (Daily Delta)" },
};

type DatasetKey = keyof typeof DATASETS;

// ============================================================================
// AUTO-MIGRATION — creates tables if they don't exist
// ============================================================================

let tablesEnsured = false;

async function ensureFmcsaTables(): Promise<void> {
  if (tablesEnsured) return;
  
  const pool = getPool();
  if (!pool) return;
  
  logger.info("[FMCSA ETL] Ensuring all FMCSA bulk data tables exist...");
  
  const migrations = [
    `CREATE TABLE IF NOT EXISTS fmcsa_census (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dot_number VARCHAR(10) NOT NULL,
      legal_name VARCHAR(255),
      dba_name VARCHAR(255),
      carrier_operation VARCHAR(50),
      hm_flag CHAR(1),
      pc_flag CHAR(1),
      phy_street VARCHAR(255),
      phy_city VARCHAR(100),
      phy_state CHAR(2),
      phy_zip VARCHAR(10),
      phy_country VARCHAR(50),
      mailing_street VARCHAR(255),
      mailing_city VARCHAR(100),
      mailing_state CHAR(2),
      mailing_zip VARCHAR(10),
      mailing_country VARCHAR(50),
      telephone VARCHAR(20),
      fax VARCHAR(20),
      email_address VARCHAR(255),
      mcs150_date DATE,
      mcs150_mileage INT,
      mcs150_mileage_year INT,
      add_date DATE,
      oic_state CHAR(2),
      nbr_power_unit INT,
      driver_total INT,
      class_property CHAR(1),
      class_passenger CHAR(1),
      class_hazmat CHAR(1),
      class_private CHAR(1),
      class_exempt CHAR(1),
      op_interstate CHAR(1),
      op_intrastate CHAR(1),
      cargo_carried JSON,
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_dot (dot_number),
      INDEX idx_state (phy_state),
      INDEX idx_hm (hm_flag),
      INDEX idx_name (legal_name(100))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS fmcsa_authority (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dot_number VARCHAR(10) NOT NULL,
      docket_number VARCHAR(20),
      prefix CHAR(2),
      docket_type VARCHAR(50),
      common_auth_pending CHAR(1),
      common_auth_granted DATE,
      common_auth_revoked DATE,
      contract_auth_pending CHAR(1),
      contract_auth_granted DATE,
      contract_auth_revoked DATE,
      broker_auth_pending CHAR(1),
      broker_auth_granted DATE,
      broker_auth_revoked DATE,
      freight_forwarder_auth_pending CHAR(1),
      freight_forwarder_auth_granted DATE,
      freight_forwarder_auth_revoked DATE,
      authority_status VARCHAR(20),
      bipd_insurance_required INT,
      bipd_insurance_on_file INT,
      cargo_insurance_required INT,
      cargo_insurance_on_file INT,
      bond_insurance_required INT,
      bond_insurance_on_file INT,
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_dot (dot_number),
      INDEX idx_mc (docket_number),
      INDEX idx_status (authority_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS fmcsa_insurance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dot_number VARCHAR(10) NOT NULL,
      docket_number VARCHAR(20),
      insurance_type VARCHAR(20),
      policy_number VARCHAR(100),
      insurance_carrier VARCHAR(255),
      coverage_from DATE,
      coverage_to DATE,
      posted_date DATE,
      cancel_date DATE,
      cancel_method VARCHAR(50),
      bipd_underlying_limit INT,
      bipd_max_limit INT,
      cargo_limit INT,
      bond_limit INT,
      is_active BOOLEAN DEFAULT TRUE,
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_dot (dot_number),
      INDEX idx_active (is_active, coverage_to),
      INDEX idx_type (insurance_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS fmcsa_crashes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dot_number VARCHAR(10) NOT NULL,
      report_state CHAR(2),
      report_number VARCHAR(50),
      report_date DATE,
      report_time TIME,
      report_seq_no INT,
      city VARCHAR(100),
      county VARCHAR(100),
      state CHAR(2),
      fatalities INT DEFAULT 0,
      injuries INT DEFAULT 0,
      tow_away CHAR(1),
      hazmat_released CHAR(1),
      vehicle_id_number VARCHAR(20),
      vehicle_license_state CHAR(2),
      vehicle_license_number VARCHAR(20),
      road_surface_condition VARCHAR(50),
      light_condition VARCHAR(50),
      weather_condition VARCHAR(50),
      not_preventable CHAR(1),
      severity_weight DECIMAL(5,2),
      time_weight DECIMAL(5,2),
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_dot (dot_number),
      INDEX idx_date (report_date),
      INDEX idx_state (state)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS fmcsa_inspections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      inspection_id VARCHAR(50) NOT NULL,
      dot_number VARCHAR(10) NOT NULL,
      report_state CHAR(2),
      report_number VARCHAR(50),
      inspection_date DATE,
      insp_level_id INT,
      county_code VARCHAR(10),
      driver_oos CHAR(1),
      vehicle_oos CHAR(1),
      hazmat_oos CHAR(1),
      total_violations INT DEFAULT 0,
      driver_violations INT DEFAULT 0,
      vehicle_violations INT DEFAULT 0,
      hazmat_violations INT DEFAULT 0,
      unsafe_driving_viol INT DEFAULT 0,
      hos_viol INT DEFAULT 0,
      driver_fitness_viol INT DEFAULT 0,
      drugs_alcohol_viol INT DEFAULT 0,
      vehicle_maint_viol INT DEFAULT 0,
      hazmat_viol INT DEFAULT 0,
      time_weight DECIMAL(5,2),
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_inspection (inspection_id),
      INDEX idx_dot (dot_number),
      INDEX idx_date (inspection_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS fmcsa_violations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      inspection_id VARCHAR(50) NOT NULL,
      dot_number VARCHAR(10) NOT NULL,
      violation_code VARCHAR(20),
      violation_descr VARCHAR(500),
      violation_group VARCHAR(20),
      unit_number INT,
      oos CHAR(1),
      severity_weight INT,
      time_weight DECIMAL(5,2),
      total_severity_weight DECIMAL(10,2),
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_inspection (inspection_id),
      INDEX idx_dot (dot_number),
      INDEX idx_code (violation_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS fmcsa_sms_scores (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dot_number VARCHAR(10) NOT NULL,
      run_date DATE NOT NULL,
      carrier_type VARCHAR(20),
      unsafe_driving_score DECIMAL(5,2),
      unsafe_driving_alert CHAR(1),
      hos_score DECIMAL(5,2),
      hos_alert CHAR(1),
      driver_fitness_score DECIMAL(5,2),
      driver_fitness_alert CHAR(1),
      controlled_substances_score DECIMAL(5,2),
      controlled_substances_alert CHAR(1),
      vehicle_maintenance_score DECIMAL(5,2),
      vehicle_maintenance_alert CHAR(1),
      hazmat_score DECIMAL(5,2),
      hazmat_alert CHAR(1),
      crash_indicator_score DECIMAL(5,2),
      crash_indicator_alert CHAR(1),
      inspections_total INT,
      driver_inspections INT,
      vehicle_inspections INT,
      hazmat_inspections INT,
      driver_oos_rate DECIMAL(5,2),
      vehicle_oos_rate DECIMAL(5,2),
      raw_data JSON,
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_dot_date (dot_number, run_date),
      INDEX idx_dot (dot_number),
      INDEX idx_date (run_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS fmcsa_oos_orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dot_number VARCHAR(10) NOT NULL,
      oos_date DATE,
      oos_reason VARCHAR(255),
      oos_type VARCHAR(100),
      oos_basis VARCHAR(100),
      return_to_service_date DATE,
      federal_state VARCHAR(50),
      legal_name VARCHAR(255),
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_dot (dot_number),
      INDEX idx_date (oos_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS fmcsa_boc3 (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dot_number VARCHAR(10) NOT NULL,
      docket_number VARCHAR(20),
      prefix VARCHAR(10),
      process_agent_name VARCHAR(255),
      process_agent_street VARCHAR(255),
      process_agent_city VARCHAR(100),
      process_agent_state CHAR(2),
      process_agent_zip VARCHAR(10),
      process_agent_phone VARCHAR(20),
      filing_date DATE,
      effective_date DATE,
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_dot (dot_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS fmcsa_revocations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dot_number VARCHAR(10) NOT NULL,
      docket_number VARCHAR(20),
      prefix VARCHAR(10),
      revocation_date DATE,
      revocation_reason VARCHAR(255),
      reinstatement_date DATE,
      legal_name VARCHAR(255),
      fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_dot (dot_number),
      INDEX idx_date (revocation_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS fmcsa_etl_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dataset_name VARCHAR(100) NOT NULL,
      sync_type ENUM('FULL', 'DELTA') NOT NULL,
      started_at TIMESTAMP NOT NULL,
      completed_at TIMESTAMP,
      records_fetched INT DEFAULT 0,
      records_inserted INT DEFAULT 0,
      records_updated INT DEFAULT 0,
      records_deleted INT DEFAULT 0,
      status ENUM('RUNNING', 'SUCCESS', 'FAILED') DEFAULT 'RUNNING',
      error_message TEXT,
      source_url VARCHAR(500),
      INDEX idx_dataset (dataset_name),
      INDEX idx_status (status),
      INDEX idx_date (started_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS fmcsa_monitored_carriers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dot_number VARCHAR(10) NOT NULL,
      company_id INT,
      user_id INT,
      monitor_insurance BOOLEAN DEFAULT TRUE,
      monitor_authority BOOLEAN DEFAULT TRUE,
      monitor_safety BOOLEAN DEFAULT TRUE,
      monitor_oos BOOLEAN DEFAULT TRUE,
      alert_email VARCHAR(255),
      alert_webhook VARCHAR(500),
      last_checked_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_dot (dot_number),
      INDEX idx_company (company_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS fmcsa_change_alerts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      dot_number VARCHAR(10) NOT NULL,
      change_type ENUM('INSURANCE', 'AUTHORITY', 'SAFETY', 'OOS', 'CENSUS') NOT NULL,
      change_field VARCHAR(100),
      old_value TEXT,
      new_value TEXT,
      detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      alert_sent BOOLEAN DEFAULT FALSE,
      alert_sent_at TIMESTAMP,
      INDEX idx_dot (dot_number),
      INDEX idx_type (change_type),
      INDEX idx_pending (alert_sent, detected_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  ];
  
  for (const ddl of migrations) {
    try {
      await pool.query(ddl);
    } catch (err: any) {
      logger.error(`[FMCSA ETL] Table creation error: ${err.message}`);
    }
  }
  
  tablesEnsured = true;
  logger.info("[FMCSA ETL] All 13 FMCSA tables verified/created");
}

// ============================================================================
// ETL LOGGING
// ============================================================================

interface EtlLogEntry {
  id?: number;
  datasetName: string;
  syncType: "FULL" | "DELTA";
  startedAt: Date;
  completedAt?: Date;
  recordsFetched: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsDeleted: number;
  status: "RUNNING" | "SUCCESS" | "FAILED";
  errorMessage?: string;
  sourceUrl: string;
}

async function logEtlStart(entry: Omit<EtlLogEntry, "id">): Promise<number> {
  const pool = getPool();
  if (!pool) return 0;
  
  const [result]: any = await pool.query(
    `INSERT INTO fmcsa_etl_log (dataset_name, sync_type, started_at, status, source_url)
     VALUES (?, ?, ?, ?, ?)`,
    [entry.datasetName, entry.syncType, entry.startedAt, entry.status, entry.sourceUrl]
  );
  return result.insertId;
}

async function logEtlComplete(id: number, entry: Partial<EtlLogEntry>): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  
  await pool.query(
    `UPDATE fmcsa_etl_log SET 
       completed_at = ?, records_fetched = ?, records_inserted = ?, 
       records_updated = ?, records_deleted = ?, status = ?, error_message = ?
     WHERE id = ?`,
    [
      entry.completedAt || new Date(),
      entry.recordsFetched || 0,
      entry.recordsInserted || 0,
      entry.recordsUpdated || 0,
      entry.recordsDeleted || 0,
      entry.status || "SUCCESS",
      entry.errorMessage || null,
      id,
    ]
  );
}

// ============================================================================
// SOCRATA SODA API — paginated JSON queries (memory-safe, no disk I/O)
// ============================================================================

const SODA_BASE = "https://data.transportation.gov/resource";
const SODA_PAGE_SIZE = 50000; // Records per API page
const MAX_DOWNLOAD_RETRIES = 5;
const SODA_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes per page

/**
 * Fetch paginated records from Socrata SODA API.
 * Yields pages of records (50K each) — memory-safe for any dataset size.
 */
async function* fetchSodaPages(datasetId: string): AsyncGenerator<Record<string, string>[]> {
  let offset = 0;
  let totalFetched = 0;
  
  while (true) {
    const url = `${SODA_BASE}/${datasetId}.json?$limit=${SODA_PAGE_SIZE}&$offset=${offset}&$order=:id`;
    let page: Record<string, string>[] = [];
    
    for (let attempt = 1; attempt <= MAX_DOWNLOAD_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), SODA_TIMEOUT_MS);
        
        const response = await fetch(url, {
          headers: {
            "Accept": "application/json",
            "User-Agent": "EusoTrip-ETL/2.0",
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
          throw new Error(`SODA HTTP ${response.status} ${response.statusText}`);
        }
        
        page = await response.json() as Record<string, string>[];
        break; // Success
        
      } catch (err: any) {
        if (attempt === MAX_DOWNLOAD_RETRIES) {
          // Don't throw — preserve partial data already inserted
          logger.error(`[FMCSA ETL] SODA fetch failed after ${MAX_DOWNLOAD_RETRIES} attempts for ${datasetId} offset=${offset}: ${err.message}. Keeping ${totalFetched} records already loaded.`);
          return; // Exit generator, partial data preserved
        }
        const backoffMs = Math.min(2000 * Math.pow(2, attempt), 60000);
        logger.warn(`[FMCSA ETL] SODA page fetch failed (attempt ${attempt}/${MAX_DOWNLOAD_RETRIES}): ${err.message}. Retrying in ${backoffMs / 1000}s...`);
        await new Promise(r => setTimeout(r, backoffMs));
      }
    }
    
    if (!Array.isArray(page) || page.length === 0) {
      break; // No more data
    }
    
    totalFetched += page.length;
    
    if (totalFetched % 100000 === 0 || page.length < SODA_PAGE_SIZE) {
      logger.info(`[FMCSA ETL] ${datasetId}: ${totalFetched.toLocaleString()} records fetched so far...`);
    }
    
    yield page;
    
    if (page.length < SODA_PAGE_SIZE) {
      break; // Last page (partial) — we've got everything
    }
    
    offset += SODA_PAGE_SIZE;
    
    // Rate-limit: pause between pages to avoid SODA API throttling
    await new Promise(r => setTimeout(r, 1500));
  }
  
  logger.info(`[FMCSA ETL] ${datasetId}: Completed \u2014 ${totalFetched.toLocaleString()} total records`);
}

// ============================================================================
// DATA TRANSFORMERS
// ============================================================================

function transformCensusRecord(raw: Record<string, string>): Record<string, any> {
  return {
    dot_number: raw.DOT_NUMBER || raw.USDOT_NUMBER || raw.dot_number,
    legal_name: raw.LEGAL_NAME || raw.legal_name,
    dba_name: raw.DBA_NAME || raw.dba_name || null,
    carrier_operation: raw.CARRIER_OPERATION || raw.carrier_operation || null,
    hm_flag: raw.HM_FLAG || raw.hm_flag || raw.hm_ind || "N",
    pc_flag: raw.PC_FLAG || raw.pc_flag || "N",
    phy_street: raw.PHY_STREET || raw.phy_street || null,
    phy_city: raw.PHY_CITY || raw.phy_city || null,
    phy_state: raw.PHY_STATE || raw.phy_state || null,
    phy_zip: raw.PHY_ZIP || raw.phy_zip || null,
    phy_country: raw.PHY_COUNTRY || raw.phy_country || "US",
    mailing_street: raw.MAILING_STREET || raw.mailing_street || raw.carrier_mailing_street || null,
    mailing_city: raw.MAILING_CITY || raw.mailing_city || raw.carrier_mailing_city || null,
    mailing_state: raw.MAILING_STATE || raw.mailing_state || raw.carrier_mailing_state || null,
    mailing_zip: raw.MAILING_ZIP || raw.mailing_zip || raw.carrier_mailing_zip || null,
    mailing_country: raw.MAILING_COUNTRY || raw.mailing_country || raw.carrier_mailing_country || null,
    telephone: raw.TELEPHONE || raw.telephone || raw.phone || null,
    fax: raw.FAX || raw.fax || null,
    email_address: raw.EMAIL_ADDRESS || raw.email_address || null,
    mcs150_date: parseDate(raw.MCS150_DATE || raw.mcs150_date || raw.review_date),
    mcs150_mileage: Math.min(parseInt(raw.MCS150_MILEAGE || raw.mcs150_mileage) || 0, 2147483647),
    mcs150_mileage_year: parseInt(raw.MCS150_MILEAGE_YEAR || raw.mcs150_mileage_year) || null,
    add_date: parseDate(raw.ADD_DATE || raw.add_date),
    oic_state: raw.OIC_STATE || raw.oic_state || null,
    nbr_power_unit: parseInt(raw.NBR_POWER_UNIT || raw.nbr_power_unit || raw.power_units) || 0,
    driver_total: parseInt(raw.DRIVER_TOTAL || raw.driver_total || raw.total_drivers) || 0,
  };
}

function transformAuthorityRecord(raw: Record<string, string>): Record<string, any> {
  // Derive authority_status from SODA common/contract/broker status fields
  const authStatus = raw.AUTH_STATUS || raw.authority_status || raw.common_stat || raw.contract_stat || raw.broker_stat || "ACTIVE";
  return {
    dot_number: raw.DOT_NUMBER || raw.USDOT_NUMBER || raw.dot_number,
    docket_number: raw.DOCKET_NUMBER || raw.docket_number || null,
    prefix: raw.PREFIX || raw.prefix || null,
    docket_type: raw.DOCKET_TYPE || raw.docket_type || null,
    common_auth_pending: raw.COMMON_AUTH_PENDING || raw.common_app_pend || null,
    common_auth_granted: parseDate(raw.COMMON_AUTH_GRANTED_DATE || raw.common_auth_granted),
    common_auth_revoked: parseDate(raw.COMMON_AUTH_REVOKED_DATE || raw.common_auth_revoked || raw.common_rev_pend),
    contract_auth_pending: raw.CONTRACT_AUTH_PENDING || raw.contract_app_pend || null,
    contract_auth_granted: parseDate(raw.CONTRACT_AUTH_GRANTED_DATE),
    contract_auth_revoked: parseDate(raw.CONTRACT_AUTH_REVOKED_DATE || raw.contract_rev_pend),
    broker_auth_pending: raw.BROKER_AUTH_PENDING || raw.broker_app_pend || null,
    broker_auth_granted: parseDate(raw.BROKER_AUTH_GRANTED_DATE),
    broker_auth_revoked: parseDate(raw.BROKER_AUTH_REVOKED_DATE || raw.broker_rev_pend),
    authority_status: authStatus,
    bipd_insurance_required: parseInt(raw.BIPD_INSURANCE_REQUIRED || raw.min_cov_amount) || null,
    bipd_insurance_on_file: parseInt(raw.BIPD_INSURANCE_ON_FILE || raw.bipd_file) || null,
    cargo_insurance_required: parseInt(raw.CARGO_INSURANCE_REQUIRED || raw.cargo_req) || null,
    cargo_insurance_on_file: parseInt(raw.CARGO_INSURANCE_ON_FILE || raw.cargo_file) || null,
    bond_insurance_required: parseInt(raw.BOND_INSURANCE_REQUIRED || raw.bond_req) || null,
    bond_insurance_on_file: parseInt(raw.BOND_INSURANCE_ON_FILE || raw.bond_file) || null,
  };
}

function transformInsuranceRecord(raw: Record<string, string>): Record<string, any> {
  // SODA API uses prefix_docket_number instead of separate dot_number
  const docketNum = raw.DOCKET_NUMBER || raw.docket_number || raw.prefix_docket_number || null;
  return {
    dot_number: raw.DOT_NUMBER || raw.USDOT_NUMBER || raw.dot_number || docketNum,
    docket_number: docketNum,
    insurance_type: raw.INSURANCE_TYPE || raw.insurance_type || raw.ins_type_code || null,
    policy_number: raw.POLICY_NUMBER || raw.policy_number || raw.policy_no || null,
    insurance_carrier: raw.INSURANCE_CARRIER || raw.insurance_carrier || raw.name_company || null,
    coverage_from: parseDate(raw.COVERAGE_FROM || raw.EFFECTIVE_DATE || raw.effective_date),
    coverage_to: parseDate(raw.COVERAGE_TO || raw.CANCEL_EFF_DATE),
    posted_date: parseDate(raw.POSTED_DATE),
    cancel_date: parseDate(raw.CANCEL_DATE),
    cancel_method: raw.CANCEL_METHOD || null,
    bipd_underlying_limit: parseInt(raw.BIPD_UNDERLYING_LIMIT || raw.underl_lim_amount) || null,
    bipd_max_limit: parseInt(raw.BIPD_MAX_LIMIT || raw.max_cov_amount) || null,
    is_active: !raw.CANCEL_DATE,
  };
}

function transformCrashRecord(raw: Record<string, string>): Record<string, any> {
  return {
    dot_number: raw.DOT_NUMBER || raw.USDOT_NUMBER || raw.dot_number,
    report_state: raw.REPORT_STATE || raw.report_state,
    report_number: raw.REPORT_NUMBER || raw.report_number || raw.crash_id || String(Date.now()),
    report_date: parseDate(raw.REPORT_DATE || raw.report_date || raw.CRASH_DATE),
    fatalities: parseInt(raw.FATALITIES || raw.fatalities) || 0,
    injuries: parseInt(raw.INJURIES || raw.injuries) || 0,
    tow_away: raw.TOW_AWAY || raw.tow_away || "N",
    hazmat_released: raw.HAZMAT_RELEASED || raw.hazmat_released || "N",
    state: raw.STATE || raw.state || raw.report_state,
    city: raw.CITY || raw.city || null,
    severity_weight: parseFloat(raw.SEVERITY_WEIGHT || raw.severity_weight) || null,
    time_weight: parseFloat(raw.TIME_WEIGHT || raw.time_weight) || null,
    vehicle_id_number: raw.VEHICLE_ID_NUMBER || raw.VIN || null,
  };
}

function transformInspectionRecord(raw: Record<string, string>): Record<string, any> {
  return {
    inspection_id: raw.INSPECTION_ID || raw.inspection_id || raw.UNIQUE_ID,
    dot_number: raw.DOT_NUMBER || raw.USDOT_NUMBER || raw.dot_number,
    report_state: raw.REPORT_STATE || raw.report_state,
    report_number: raw.REPORT_NUMBER || raw.report_number,
    inspection_date: parseDate(raw.INSPECTION_DATE || raw.inspection_date || raw.INSP_DATE || raw.insp_date),
    insp_level_id: parseInt(raw.INSP_LEVEL_ID || raw.insp_level_id) || null,
    driver_oos: raw.DRIVER_OOS || raw.driver_oos || (parseInt(raw.driver_oos_total) > 0 ? "Y" : "N"),
    vehicle_oos: raw.VEHICLE_OOS || raw.vehicle_oos || (parseInt(raw.vehicle_oos_total) > 0 ? "Y" : "N"),
    hazmat_oos: raw.HAZMAT_OOS || raw.hazmat_oos || (parseInt(raw.hazmat_oos_total) > 0 ? "Y" : "N"),
    total_violations: parseInt(raw.TOTAL_VIOLATIONS || raw.viol_total) || 0,
    unsafe_driving_viol: parseInt(raw.UNSAFE_DRIVING_VIOL) || 0,
    hos_viol: parseInt(raw.HOS_VIOL) || 0,
    driver_fitness_viol: parseInt(raw.DRIVER_FITNESS_VIOL || raw.driver_viol_total) || 0,
    vehicle_maint_viol: parseInt(raw.VEHICLE_MAINT_VIOL || raw.vehicle_viol_total) || 0,
    hazmat_viol: parseInt(raw.HAZMAT_VIOL || raw.hazmat_viol_total) || 0,
    time_weight: parseFloat(raw.TIME_WEIGHT || raw.time_weight) || null,
  };
}

function transformViolationRecord(raw: Record<string, string>): Record<string, any> {
  // SODA API: violation code is part_no + part_no_section, no dot_number field
  const violCode = raw.VIOLATION_CODE || raw.violation_code || 
    (raw.part_no && raw.part_no_section ? `${raw.part_no}.${raw.part_no_section}` : raw.part_no) || "UNKNOWN";
  return {
    inspection_id: raw.INSPECTION_ID || raw.inspection_id || raw.UNIQUE_ID,
    dot_number: raw.DOT_NUMBER || raw.USDOT_NUMBER || raw.dot_number || "0",
    violation_code: violCode,
    violation_descr: raw.VIOLATION_DESCR || raw.violation_descr || raw.DESCRIPTION || raw.insp_violation_category_id || null,
    violation_group: raw.BASIC || raw.VIOLATION_GROUP || raw.violation_group || raw.insp_viol_unit || null,
    oos: raw.OOS || raw.oos || raw.out_of_service_indicator || "N",
    severity_weight: parseInt(raw.SEVERITY_WEIGHT || raw.severity_weight) || null,
    time_weight: parseFloat(raw.TIME_WEIGHT || raw.time_weight) || null,
    total_severity_weight: parseFloat(raw.TOTAL_SEVERITY_WGHT) || null,
  };
}

function transformSmsScoreRecord(raw: Record<string, string>): Record<string, any> {
  const runDate = raw.SMS_RUN_DATE || raw.RUN_DATE || new Date().toISOString().split("T")[0];
  // SODA field mapping: unsafe_driv_measure, hos_driv_measure, veh_maint_measure, etc.
  // Alert counts: unsafe_driv_ac, hos_driv_ac, etc. (>0 = alert)
  const unsafeDrivAc = parseInt(raw.unsafe_driv_ac) || 0;
  const hosDrivAc = parseInt(raw.hos_driv_ac) || 0;
  const drivFitAc = parseInt(raw.driv_fit_ac) || 0;
  const contrSubAc = parseInt(raw.contr_subst_ac) || 0;
  const vehMaintAc = parseInt(raw.veh_maint_ac) || 0;
  
  return {
    dot_number: raw.DOT_NUMBER || raw.USDOT_NUMBER || raw.dot_number,
    run_date: parseDate(runDate),
    carrier_type: raw.CARRIER_TYPE || "PROPERTY",
    unsafe_driving_score: parseFloat(raw.UNSAFE_DRIVING_MEASURE || raw.unsafe_driv_measure) || null,
    unsafe_driving_alert: raw.UNSAFE_DRIVING_ALERT || (unsafeDrivAc > 0 ? "Y" : null),
    hos_score: parseFloat(raw.HOS_MEASURE || raw.hos_driv_measure) || null,
    hos_alert: raw.HOS_ALERT || (hosDrivAc > 0 ? "Y" : null),
    driver_fitness_score: parseFloat(raw.DRIVER_FITNESS_MEASURE || raw.driv_fit_measure) || null,
    driver_fitness_alert: raw.DRIVER_FITNESS_ALERT || (drivFitAc > 0 ? "Y" : null),
    controlled_substances_score: parseFloat(raw.CONTROLLED_SUBSTANCES_MEASURE || raw.contr_subst_measure) || null,
    controlled_substances_alert: raw.CONTROLLED_SUBSTANCES_ALERT || (contrSubAc > 0 ? "Y" : null),
    vehicle_maintenance_score: parseFloat(raw.VEHICLE_MAINTENANCE_MEASURE || raw.veh_maint_measure) || null,
    vehicle_maintenance_alert: raw.VEHICLE_MAINTENANCE_ALERT || (vehMaintAc > 0 ? "Y" : null),
    hazmat_score: parseFloat(raw.HAZMAT_MEASURE) || null,
    hazmat_alert: raw.HAZMAT_ALERT || null,
    crash_indicator_score: parseFloat(raw.CRASH_INDICATOR_MEASURE) || null,
    crash_indicator_alert: raw.CRASH_INDICATOR_ALERT || null,
    inspections_total: parseInt(raw.TOTAL_INSPECTIONS || raw.insp_total) || 0,
    driver_inspections: parseInt(raw.DRIVER_INSPECTIONS || raw.driver_insp_total) || 0,
    vehicle_inspections: parseInt(raw.VEHICLE_INSPECTIONS || raw.vehicle_insp_total) || 0,
    driver_oos_rate: parseFloat(raw.DRIVER_OOS_RATE) || null,
    vehicle_oos_rate: parseFloat(raw.VEHICLE_OOS_RATE) || null,
    raw_data: JSON.stringify(raw),
  };
}

function transformOosRecord(raw: Record<string, string>): Record<string, any> {
  return {
    dot_number: raw.DOT_NUMBER || raw.USDOT_NUMBER || raw.dot_number,
    oos_date: parseDate(raw.OOS_DATE || raw.oos_date || raw.EFFECTIVE_DATE),
    oos_reason: raw.OOS_REASON || raw.oos_reason || raw.REASON || null,
    oos_type: raw.OOS_TYPE || raw.oos_type || raw.status || null,
    return_to_service_date: parseDate(raw.RETURN_TO_SERVICE_DATE || raw.return_to_service_date || raw.RTS_DATE || raw.rescind_date),
    federal_state: raw.FEDERAL_STATE || raw.federal_state || null,
    legal_name: raw.LEGAL_NAME || raw.legal_name || null,
  };
}

function transformBoc3Record(raw: Record<string, string>): Record<string, any> {
  return {
    dot_number: raw.DOT_NUMBER || raw.USDOT_NUMBER || raw.dot_number,
    docket_number: raw.DOCKET_NUMBER || raw.docket_number || null,
    agent_name: raw.PROCESS_AGENT_NAME || raw.process_agent_name || raw.PA_NAME || null,
    agent_address: raw.PROCESS_AGENT_STREET || raw.PA_STREET || null,
    agent_city: raw.PROCESS_AGENT_CITY || raw.PA_CITY || null,
    agent_state: raw.PROCESS_AGENT_STATE || raw.PA_STATE || null,
    agent_zip: raw.PROCESS_AGENT_ZIP || raw.PA_ZIP || null,
    form_date: parseDate(raw.FILING_DATE || raw.filing_date || raw.EFFECTIVE_DATE || raw.effective_date),
  };
}

function transformRevocationRecord(raw: Record<string, string>): Record<string, any> {
  return {
    dot_number: raw.DOT_NUMBER || raw.USDOT_NUMBER || raw.dot_number,
    docket_number: raw.DOCKET_NUMBER || raw.docket_number || null,
    revocation_date: parseDate(raw.REVOCATION_DATE || raw.revocation_date || raw.EFFECTIVE_DATE || raw.order2_effective_date || raw.order1_serve_date),
    revocation_reason: raw.REVOCATION_REASON || raw.revocation_reason || raw.REASON || raw.order2_type_desc || null,
    authority_type: raw.PREFIX || raw.prefix || raw.type_license || null,
  };
}

function parseDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr || dateStr === "" || dateStr === "NULL") return null;
  
  // SODA API compact format: YYYYMMDD (e.g., "19870707")
  const compactMatch = dateStr.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactMatch) {
    const d = new Date(`${compactMatch[1]}-${compactMatch[2]}-${compactMatch[3]}`);
    if (!isNaN(d.getTime())) return d;
  }
  
  // Handle various date formats
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/,  // 2024-01-15
    /^(\d{2})\/(\d{2})\/(\d{4})$/,  // 01/15/2024
    /^(\d{2})-(\w{3})-(\d{4})$/,  // 15-Jan-2024
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) return date;
    }
  }
  
  // Try direct parse
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

// ============================================================================
// BATCH INSERTERS
// ============================================================================

const BATCH_SIZE = 1000;
const INSERT_RETRY_BATCH_SIZES = [100, 10, 1]; // Auto-split cascade on failure
const MAX_INSERT_RETRIES = 2; // Per-batch retry before splitting

async function batchUpsert(
  table: string,
  records: Record<string, any>[],
  uniqueKey: string | string[]
): Promise<{ inserted: number; updated: number }> {
  const pool = getPool();
  if (!pool || records.length === 0) return { inserted: 0, updated: 0 };
  
  return await _batchUpsertWithRetry(pool, table, records, uniqueKey, BATCH_SIZE);
}

async function _batchUpsertWithRetry(
  pool: any,
  table: string,
  records: Record<string, any>[],
  uniqueKey: string | string[],
  currentBatchSize: number,
): Promise<{ inserted: number; updated: number }> {
  const keys = Object.keys(records[0]);
  const uniqueKeys = Array.isArray(uniqueKey) ? uniqueKey : [uniqueKey];
  
  const placeholders = records.map(() => `(${keys.map(() => "?").join(", ")})`).join(", ");
  const updateClause = keys
    .filter(k => !uniqueKeys.includes(k))
    .map(k => `${k} = VALUES(${k})`)
    .join(", ");
  
  const sql = `
    INSERT INTO ${table} (${keys.join(", ")})
    VALUES ${placeholders}
    ON DUPLICATE KEY UPDATE ${updateClause}, fetched_at = CURRENT_TIMESTAMP
  `;
  
  const values = records.flatMap(r => keys.map(k => r[k]));
  
  for (let attempt = 1; attempt <= MAX_INSERT_RETRIES; attempt++) {
    try {
      const [result]: any = await pool.query(sql, values);
      const affected = result.affectedRows || 0;
      const inserted = affected - (result.changedRows || 0);
      return { inserted, updated: result.changedRows || 0 };
    } catch (err: any) {
      if (attempt < MAX_INSERT_RETRIES) {
        logger.warn(`[FMCSA ETL] Insert retry ${attempt} for ${table} (${records.length} records): ${err.message}`);
        await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }
      
      // All retries exhausted at this batch size — split into smaller batches
      const smallerSize = INSERT_RETRY_BATCH_SIZES.find(s => s < currentBatchSize);
      
      if (smallerSize && records.length > 1) {
        logger.warn(`[FMCSA ETL] Splitting ${table} batch: ${records.length} → chunks of ${smallerSize}`);
        let totalInserted = 0;
        let totalUpdated = 0;
        let skippedRecords = 0;
        
        for (let i = 0; i < records.length; i += smallerSize) {
          const chunk = records.slice(i, i + smallerSize);
          try {
            const result = await _batchUpsertWithRetry(pool, table, chunk, uniqueKey, smallerSize);
            totalInserted += result.inserted;
            totalUpdated += result.updated;
          } catch (chunkErr: any) {
            // Even the smallest chunk failed — log and skip (never lose the whole dataset)
            skippedRecords += chunk.length;
            logger.error(`[FMCSA ETL] Skipping ${chunk.length} bad records in ${table}: ${chunkErr.message}`);
          }
        }
        
        if (skippedRecords > 0) {
          logger.warn(`[FMCSA ETL] ${table}: ${skippedRecords} records skipped due to errors (${records.length - skippedRecords} succeeded)`);
        }
        
        return { inserted: totalInserted, updated: totalUpdated };
      }
      
      // Single record that still fails — skip it, don't kill the pipeline
      logger.error(`[FMCSA ETL] Skipping 1 unfixable record in ${table}: ${err.message}`);
      return { inserted: 0, updated: 0 };
    }
  }
  
  return { inserted: 0, updated: 0 };
}

// ============================================================================
// MAIN ETL FUNCTIONS
// ============================================================================

async function runCensusEtl(full: boolean = true): Promise<EtlLogEntry> {
  const dataset = DATASETS.census;
  const startedAt = new Date();
  const logId = await logEtlStart({
    datasetName: dataset.name,
    syncType: full ? "FULL" : "DELTA",
    startedAt,
    recordsFetched: 0,
    recordsInserted: 0,
    recordsUpdated: 0,
    recordsDeleted: 0,
    status: "RUNNING",
    sourceUrl: `${DATA_GOV_BASE}/${dataset.id}`,
  });
  
  const stats = { recordsFetched: 0, recordsInserted: 0, recordsUpdated: 0 };
  
  try {
    for await (const page of fetchSodaPages(dataset.id)) {
      const batch: Record<string, any>[] = [];
      
      for (const raw of page) {
        const record = transformCensusRecord(raw);
        if (!record.dot_number) continue;
        batch.push(record);
        stats.recordsFetched++;
      }
      
      // Insert page in BATCH_SIZE chunks
      for (let i = 0; i < batch.length; i += BATCH_SIZE) {
        const chunk = batch.slice(i, i + BATCH_SIZE);
        const result = await batchUpsert("fmcsa_census", chunk, "dot_number");
        stats.recordsInserted += result.inserted;
        stats.recordsUpdated += result.updated;
      }
    }
    
    await logEtlComplete(logId, { completedAt: new Date(), ...stats, recordsDeleted: 0, status: "SUCCESS" });
    logger.info(`[FMCSA ETL] Census complete: ${stats.recordsFetched.toLocaleString()} fetched, ${stats.recordsInserted.toLocaleString()} inserted, ${stats.recordsUpdated.toLocaleString()} updated`);
    return { datasetName: dataset.name, syncType: full ? "FULL" : "DELTA", startedAt, ...stats, recordsDeleted: 0, status: "SUCCESS", sourceUrl: "" };
    
  } catch (err: any) {
    await logEtlComplete(logId, { completedAt: new Date(), ...stats, recordsDeleted: 0, status: "FAILED", errorMessage: err.message });
    throw err;
  }
}

async function runAuthorityEtl(full: boolean = true): Promise<EtlLogEntry> {
  const dataset = DATASETS.carrier;
  const startedAt = new Date();
  const logId = await logEtlStart({
    datasetName: dataset.name,
    syncType: full ? "FULL" : "DELTA",
    startedAt,
    recordsFetched: 0,
    recordsInserted: 0,
    recordsUpdated: 0,
    recordsDeleted: 0,
    status: "RUNNING",
    sourceUrl: `${DATA_GOV_BASE}/${dataset.id}`,
  });
  
  const stats = { recordsFetched: 0, recordsInserted: 0, recordsUpdated: 0 };
  
  try {
    for await (const page of fetchSodaPages(dataset.id)) {
      const batch: Record<string, any>[] = [];
      for (const raw of page) {
        const record = transformAuthorityRecord(raw);
        if (!record.dot_number) continue;
        batch.push(record);
        stats.recordsFetched++;
      }
      for (let i = 0; i < batch.length; i += BATCH_SIZE) {
        const chunk = batch.slice(i, i + BATCH_SIZE);
        const result = await batchUpsert("fmcsa_authority", chunk, ["dot_number", "docket_number"]);
        stats.recordsInserted += result.inserted;
        stats.recordsUpdated += result.updated;
      }
    }
    
    await logEtlComplete(logId, { completedAt: new Date(), ...stats, recordsDeleted: 0, status: "SUCCESS" });
    logger.info(`[FMCSA ETL] Authority complete: ${stats.recordsFetched.toLocaleString()} records`);
    return { datasetName: dataset.name, syncType: full ? "FULL" : "DELTA", startedAt, ...stats, recordsDeleted: 0, status: "SUCCESS", sourceUrl: "" };
    
  } catch (err: any) {
    await logEtlComplete(logId, { completedAt: new Date(), ...stats, recordsDeleted: 0, status: "FAILED", errorMessage: err.message });
    throw err;
  }
}

async function runInsuranceEtl(full: boolean = true): Promise<EtlLogEntry> {
  const dataset = full ? DATASETS.insurance : DATASETS.insuranceActive;
  const startedAt = new Date();
  const logId = await logEtlStart({
    datasetName: dataset.name,
    syncType: full ? "FULL" : "DELTA",
    startedAt,
    recordsFetched: 0,
    recordsInserted: 0,
    recordsUpdated: 0,
    recordsDeleted: 0,
    status: "RUNNING",
    sourceUrl: `${DATA_GOV_BASE}/${dataset.id}`,
  });
  
  const stats = { recordsFetched: 0, recordsInserted: 0, recordsUpdated: 0 };
  
  try {
    for await (const page of fetchSodaPages(dataset.id)) {
      const batch: Record<string, any>[] = [];
      for (const raw of page) {
        const record = transformInsuranceRecord(raw);
        if (!record.dot_number) continue;
        batch.push(record);
        stats.recordsFetched++;
      }
      for (let i = 0; i < batch.length; i += BATCH_SIZE) {
        const chunk = batch.slice(i, i + BATCH_SIZE);
        const result = await batchUpsert("fmcsa_insurance", chunk, ["dot_number", "docket_number", "policy_number"]);
        stats.recordsInserted += result.inserted;
        stats.recordsUpdated += result.updated;
      }
    }
    
    await logEtlComplete(logId, { completedAt: new Date(), ...stats, recordsDeleted: 0, status: "SUCCESS" });
    logger.info(`[FMCSA ETL] Insurance complete: ${stats.recordsFetched.toLocaleString()} records`);
    return { datasetName: dataset.name, syncType: full ? "FULL" : "DELTA", startedAt, ...stats, recordsDeleted: 0, status: "SUCCESS", sourceUrl: "" };
    
  } catch (err: any) {
    await logEtlComplete(logId, { completedAt: new Date(), ...stats, recordsDeleted: 0, status: "FAILED", errorMessage: err.message });
    throw err;
  }
}

async function runCrashEtl(): Promise<EtlLogEntry> {
  const dataset = DATASETS.crashes;
  const startedAt = new Date();
  const logId = await logEtlStart({
    datasetName: dataset.name,
    syncType: "FULL",
    startedAt,
    recordsFetched: 0,
    recordsInserted: 0,
    recordsUpdated: 0,
    recordsDeleted: 0,
    status: "RUNNING",
    sourceUrl: `${DATA_GOV_BASE}/${dataset.id}`,
  });
  
  const stats = { recordsFetched: 0, recordsInserted: 0, recordsUpdated: 0 };
  
  try {
    for await (const page of fetchSodaPages(dataset.id)) {
      const batch: Record<string, any>[] = [];
      for (const raw of page) {
        const record = transformCrashRecord(raw);
        if (!record.dot_number) continue;
        batch.push(record);
        stats.recordsFetched++;
      }
      for (let i = 0; i < batch.length; i += BATCH_SIZE) {
        const chunk = batch.slice(i, i + BATCH_SIZE);
        const result = await batchUpsert("fmcsa_crashes", chunk, ["dot_number", "report_number", "report_date"]);
        stats.recordsInserted += result.inserted;
        stats.recordsUpdated += result.updated;
      }
    }
    
    await logEtlComplete(logId, { completedAt: new Date(), ...stats, recordsDeleted: 0, status: "SUCCESS" });
    logger.info(`[FMCSA ETL] Crashes complete: ${stats.recordsFetched.toLocaleString()} records`);
    return { datasetName: dataset.name, syncType: "FULL", startedAt, ...stats, recordsDeleted: 0, status: "SUCCESS", sourceUrl: "" };
    
  } catch (err: any) {
    await logEtlComplete(logId, { completedAt: new Date(), ...stats, recordsDeleted: 0, status: "FAILED", errorMessage: err.message });
    throw err;
  }
}

async function runInspectionEtl(): Promise<EtlLogEntry> {
  const dataset = DATASETS.inspections;
  const startedAt = new Date();
  const logId = await logEtlStart({
    datasetName: dataset.name,
    syncType: "FULL",
    startedAt,
    recordsFetched: 0,
    recordsInserted: 0,
    recordsUpdated: 0,
    recordsDeleted: 0,
    status: "RUNNING",
    sourceUrl: `${DATA_GOV_BASE}/${dataset.id}`,
  });
  
  const stats = { recordsFetched: 0, recordsInserted: 0, recordsUpdated: 0 };
  
  try {
    for await (const page of fetchSodaPages(dataset.id)) {
      const batch: Record<string, any>[] = [];
      for (const raw of page) {
        const record = transformInspectionRecord(raw);
        if (!record.dot_number || !record.inspection_id) continue;
        batch.push(record);
        stats.recordsFetched++;
      }
      for (let i = 0; i < batch.length; i += BATCH_SIZE) {
        const chunk = batch.slice(i, i + BATCH_SIZE);
        const result = await batchUpsert("fmcsa_inspections", chunk, "inspection_id");
        stats.recordsInserted += result.inserted;
        stats.recordsUpdated += result.updated;
      }
    }
    
    await logEtlComplete(logId, { completedAt: new Date(), ...stats, recordsDeleted: 0, status: "SUCCESS" });
    logger.info(`[FMCSA ETL] Inspections complete: ${stats.recordsFetched.toLocaleString()} records`);
    return { datasetName: dataset.name, syncType: "FULL", startedAt, ...stats, recordsDeleted: 0, status: "SUCCESS", sourceUrl: "" };
    
  } catch (err: any) {
    await logEtlComplete(logId, { completedAt: new Date(), ...stats, recordsDeleted: 0, status: "FAILED", errorMessage: err.message });
    throw err;
  }
}

async function runViolationEtl(): Promise<EtlLogEntry> {
  const dataset = DATASETS.violations;
  const startedAt = new Date();
  const logId = await logEtlStart({
    datasetName: dataset.name,
    syncType: "FULL",
    startedAt,
    recordsFetched: 0,
    recordsInserted: 0,
    recordsUpdated: 0,
    recordsDeleted: 0,
    status: "RUNNING",
    sourceUrl: `${DATA_GOV_BASE}/${dataset.id}`,
  });
  
  const stats = { recordsFetched: 0, recordsInserted: 0, recordsUpdated: 0 };
  
  try {
    for await (const page of fetchSodaPages(dataset.id)) {
      const batch: Record<string, any>[] = [];
      for (const raw of page) {
        const record = transformViolationRecord(raw);
        if (!record.dot_number || !record.inspection_id) continue;
        batch.push(record);
        stats.recordsFetched++;
      }
      for (let i = 0; i < batch.length; i += BATCH_SIZE) {
        const chunk = batch.slice(i, i + BATCH_SIZE);
        const result = await batchUpsert("fmcsa_violations", chunk, ["inspection_id", "violation_code"]);
        stats.recordsInserted += result.inserted;
        stats.recordsUpdated += result.updated;
      }
    }
    
    await logEtlComplete(logId, { completedAt: new Date(), ...stats, recordsDeleted: 0, status: "SUCCESS" });
    logger.info(`[FMCSA ETL] Violations complete: ${stats.recordsFetched.toLocaleString()} records`);
    return { datasetName: dataset.name, syncType: "FULL", startedAt, ...stats, recordsDeleted: 0, status: "SUCCESS", sourceUrl: "" };
    
  } catch (err: any) {
    await logEtlComplete(logId, { completedAt: new Date(), ...stats, recordsDeleted: 0, status: "FAILED", errorMessage: err.message });
    throw err;
  }
}

async function runSmsScoresEtl(): Promise<EtlLogEntry> {
  const dataset = DATASETS.smsScoresProperty;
  const startedAt = new Date();
  const logId = await logEtlStart({
    datasetName: dataset.name,
    syncType: "FULL",
    startedAt,
    recordsFetched: 0,
    recordsInserted: 0,
    recordsUpdated: 0,
    recordsDeleted: 0,
    status: "RUNNING",
    sourceUrl: `${DATA_GOV_BASE}/${dataset.id}`,
  });
  
  const stats = { recordsFetched: 0, recordsInserted: 0, recordsUpdated: 0 };
  
  try {
    for await (const page of fetchSodaPages(dataset.id)) {
      const batch: Record<string, any>[] = [];
      for (const raw of page) {
        const record = transformSmsScoreRecord(raw);
        if (!record.dot_number) continue;
        batch.push(record);
        stats.recordsFetched++;
      }
      for (let i = 0; i < batch.length; i += BATCH_SIZE) {
        const chunk = batch.slice(i, i + BATCH_SIZE);
        const result = await batchUpsert("fmcsa_sms_scores", chunk, ["dot_number", "run_date"]);
        stats.recordsInserted += result.inserted;
        stats.recordsUpdated += result.updated;
      }
    }
    
    await logEtlComplete(logId, { completedAt: new Date(), ...stats, recordsDeleted: 0, status: "SUCCESS" });
    logger.info(`[FMCSA ETL] SMS Scores complete: ${stats.recordsFetched.toLocaleString()} records`);
    return { datasetName: dataset.name, syncType: "FULL", startedAt, ...stats, recordsDeleted: 0, status: "SUCCESS", sourceUrl: "" };
    
  } catch (err: any) {
    await logEtlComplete(logId, { completedAt: new Date(), ...stats, recordsDeleted: 0, status: "FAILED", errorMessage: err.message });
    throw err;
  }
}

async function runOosEtl(): Promise<EtlLogEntry> {
  const dataset = DATASETS.oosOrders;
  const startedAt = new Date();
  const logId = await logEtlStart({
    datasetName: dataset.name,
    syncType: "FULL",
    startedAt,
    recordsFetched: 0,
    recordsInserted: 0,
    recordsUpdated: 0,
    recordsDeleted: 0,
    status: "RUNNING",
    sourceUrl: `${DATA_GOV_BASE}/${dataset.id}`,
  });
  
  const stats = { recordsFetched: 0, recordsInserted: 0, recordsUpdated: 0 };
  
  try {
    for await (const page of fetchSodaPages(dataset.id)) {
      const batch: Record<string, any>[] = [];
      for (const raw of page) {
        const record = transformOosRecord(raw);
        if (!record.dot_number) continue;
        batch.push(record);
        stats.recordsFetched++;
      }
      for (let i = 0; i < batch.length; i += BATCH_SIZE) {
        const chunk = batch.slice(i, i + BATCH_SIZE);
        const result = await batchUpsert("fmcsa_oos_orders", chunk, ["dot_number", "oos_date"]);
        stats.recordsInserted += result.inserted;
        stats.recordsUpdated += result.updated;
      }
    }
    
    await logEtlComplete(logId, { completedAt: new Date(), ...stats, recordsDeleted: 0, status: "SUCCESS" });
    logger.info(`[FMCSA ETL] OOS Orders complete: ${stats.recordsFetched.toLocaleString()} records`);
    return { datasetName: dataset.name, syncType: "FULL", startedAt, ...stats, recordsDeleted: 0, status: "SUCCESS", sourceUrl: "" };
    
  } catch (err: any) {
    await logEtlComplete(logId, { completedAt: new Date(), ...stats, recordsDeleted: 0, status: "FAILED", errorMessage: err.message });
    throw err;
  }
}

async function runBoc3Etl(): Promise<EtlLogEntry> {
  const dataset = DATASETS.boc3;
  const startedAt = new Date();
  const logId = await logEtlStart({
    datasetName: dataset.name,
    syncType: "FULL",
    startedAt,
    recordsFetched: 0,
    recordsInserted: 0,
    recordsUpdated: 0,
    recordsDeleted: 0,
    status: "RUNNING",
    sourceUrl: `${DATA_GOV_BASE}/${dataset.id}`,
  });
  
  const stats = { recordsFetched: 0, recordsInserted: 0, recordsUpdated: 0 };
  
  try {
    for await (const page of fetchSodaPages(dataset.id)) {
      const batch: Record<string, any>[] = [];
      for (const raw of page) {
        const record = transformBoc3Record(raw);
        if (!record.dot_number) continue;
        batch.push(record);
        stats.recordsFetched++;
      }
      for (let i = 0; i < batch.length; i += BATCH_SIZE) {
        const chunk = batch.slice(i, i + BATCH_SIZE);
        const result = await batchUpsert("fmcsa_boc3", chunk, ["dot_number", "docket_number"]);
        stats.recordsInserted += result.inserted;
        stats.recordsUpdated += result.updated;
      }
    }
    
    await logEtlComplete(logId, { completedAt: new Date(), ...stats, recordsDeleted: 0, status: "SUCCESS" });
    logger.info(`[FMCSA ETL] BOC3 complete: ${stats.recordsFetched.toLocaleString()} records`);
    return { datasetName: dataset.name, syncType: "FULL", startedAt, ...stats, recordsDeleted: 0, status: "SUCCESS", sourceUrl: "" };
    
  } catch (err: any) {
    await logEtlComplete(logId, { completedAt: new Date(), ...stats, recordsDeleted: 0, status: "FAILED", errorMessage: err.message });
    throw err;
  }
}

async function runRevocationsEtl(): Promise<EtlLogEntry> {
  const dataset = DATASETS.revocations;
  const startedAt = new Date();
  const logId = await logEtlStart({
    datasetName: dataset.name,
    syncType: "FULL",
    startedAt,
    recordsFetched: 0,
    recordsInserted: 0,
    recordsUpdated: 0,
    recordsDeleted: 0,
    status: "RUNNING",
    sourceUrl: `${DATA_GOV_BASE}/${dataset.id}`,
  });
  
  const stats = { recordsFetched: 0, recordsInserted: 0, recordsUpdated: 0 };
  
  try {
    for await (const page of fetchSodaPages(dataset.id)) {
      const batch: Record<string, any>[] = [];
      for (const raw of page) {
        const record = transformRevocationRecord(raw);
        if (!record.dot_number) continue;
        batch.push(record);
        stats.recordsFetched++;
      }
      for (let i = 0; i < batch.length; i += BATCH_SIZE) {
        const chunk = batch.slice(i, i + BATCH_SIZE);
        const result = await batchUpsert("fmcsa_revocations", chunk, ["dot_number", "docket_number", "revocation_date"]);
        stats.recordsInserted += result.inserted;
        stats.recordsUpdated += result.updated;
      }
    }
    
    await logEtlComplete(logId, { completedAt: new Date(), ...stats, recordsDeleted: 0, status: "SUCCESS" });
    logger.info(`[FMCSA ETL] Revocations complete: ${stats.recordsFetched.toLocaleString()} records`);
    return { datasetName: dataset.name, syncType: "FULL", startedAt, ...stats, recordsDeleted: 0, status: "SUCCESS", sourceUrl: "" };
    
  } catch (err: any) {
    await logEtlComplete(logId, { completedAt: new Date(), ...stats, recordsDeleted: 0, status: "FAILED", errorMessage: err.message });
    throw err;
  }
}

// ============================================================================
// ORCHESTRATION
// ============================================================================

// Per-dataset error isolation — one failure NEVER kills the rest
async function safeRun(name: string, fn: () => Promise<any>): Promise<{ name: string; ok: boolean; error?: string }> {
  try {
    await fn();
    return { name, ok: true };
  } catch (err: any) {
    logger.error(`[FMCSA ETL] FAILED: ${name} — ${err.message}`);
    return { name, ok: false, error: err.message };
  }
}

function printEtlSummary(label: string, results: { name: string; ok: boolean; error?: string }[], start: number): void {
  const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1);
  const succeeded = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok);
  
  logger.info(`[FMCSA ETL] ═══════════════════════════════════════════════════`);
  logger.info(`[FMCSA ETL] ${label} complete in ${elapsed} minutes`);
  logger.info(`[FMCSA ETL] ${succeeded}/${results.length} datasets succeeded`);
  
  if (failed.length > 0) {
    logger.error(`[FMCSA ETL] ${failed.length} datasets failed:`);
    for (const f of failed) {
      logger.error(`[FMCSA ETL]   - ${f.name}: ${f.error}`);
    }
  } else {
    logger.info(`[FMCSA ETL] ALL datasets refreshed — zero failures`);
  }
  
  logger.info(`[FMCSA ETL] ═══════════════════════════════════════════════════`);
}

export async function runFullEtl(): Promise<void> {
  logger.info("[FMCSA ETL] ═══════════════════════════════════════════════════");
  logger.info("[FMCSA ETL] Starting FULL ETL run — ALL datasets");
  logger.info("[FMCSA ETL] ═══════════════════════════════════════════════════");
  await ensureFmcsaTables();
  const start = Date.now();
  
  const pause = () => new Promise(r => setTimeout(r, 5000));
  const results: { name: string; ok: boolean; error?: string }[] = [];
  results.push(await safeRun("Census",       () => runCensusEtl(true)));    await pause();
  results.push(await safeRun("Authority",    () => runAuthorityEtl(true))); await pause();
  results.push(await safeRun("Insurance",    () => runInsuranceEtl(true))); await pause();
  results.push(await safeRun("Crashes",      () => runCrashEtl()));         await pause();
  results.push(await safeRun("Inspections",  () => runInspectionEtl()));    await pause();
  results.push(await safeRun("Violations",   () => runViolationEtl()));     await pause();
  results.push(await safeRun("OOS Orders",   () => runOosEtl()));           await pause();
  results.push(await safeRun("BOC3",         () => runBoc3Etl()));          await pause();
  results.push(await safeRun("Revocations",  () => runRevocationsEtl()));   await pause();
  results.push(await safeRun("SMS Scores",   () => runSmsScoresEtl()));
  
  printEtlSummary("Full ETL", results, start);
}

export async function runDailyEtl(): Promise<void> {
  logger.info("[FMCSA ETL] ═══════════════════════════════════════════════════");
  logger.info("[FMCSA ETL] Starting DAILY ETL — all daily-frequency datasets");
  logger.info("[FMCSA ETL] ═══════════════════════════════════════════════════");
  await ensureFmcsaTables();
  const start = Date.now();
  
  // ALL daily datasets — each isolated so one failure never stops the rest
  // 5s pause between datasets to avoid SODA API rate limiting
  const pause = () => new Promise(r => setTimeout(r, 5000));
  const results: { name: string; ok: boolean; error?: string }[] = [];
  results.push(await safeRun("Census",       () => runCensusEtl(false)));   await pause();
  results.push(await safeRun("Authority",    () => runAuthorityEtl(false))); await pause();
  results.push(await safeRun("Insurance",    () => runInsuranceEtl(false))); await pause();
  results.push(await safeRun("Crashes",      () => runCrashEtl()));          await pause();
  results.push(await safeRun("Inspections",  () => runInspectionEtl()));     await pause();
  results.push(await safeRun("Violations",   () => runViolationEtl()));      await pause();
  results.push(await safeRun("OOS Orders",   () => runOosEtl()));            await pause();
  results.push(await safeRun("BOC3",         () => runBoc3Etl()));           await pause();
  results.push(await safeRun("Revocations",  () => runRevocationsEtl()));
  
  printEtlSummary("Daily ETL", results, start);
  
  // If any datasets failed, schedule an automatic retry in 30 minutes
  const failed = results.filter(r => !r.ok);
  if (failed.length > 0) {
    logger.info(`[FMCSA ETL] Scheduling automatic retry for ${failed.length} failed datasets in 30 minutes...`);
    setTimeout(async () => {
      logger.info(`[FMCSA ETL] ═══ RETRY RUN for ${failed.length} failed datasets ═══`);
      const retryResults: { name: string; ok: boolean; error?: string }[] = [];
      
      for (const f of failed) {
        const retryFn = {
          "Census":      () => runCensusEtl(false),
          "Authority":   () => runAuthorityEtl(false),
          "Insurance":   () => runInsuranceEtl(false),
          "Crashes":     () => runCrashEtl(),
          "Inspections": () => runInspectionEtl(),
          "Violations":  () => runViolationEtl(),
          "OOS Orders":  () => runOosEtl(),
          "BOC3":        () => runBoc3Etl(),
          "Revocations": () => runRevocationsEtl(),
        }[f.name];
        
        if (retryFn) {
          retryResults.push(await safeRun(`RETRY: ${f.name}`, retryFn));
        }
      }
      
      const stillFailed = retryResults.filter(r => !r.ok);
      if (stillFailed.length > 0) {
        logger.error(`[FMCSA ETL] ${stillFailed.length} datasets still failing after retry — will try again tomorrow`);
      } else {
        logger.info(`[FMCSA ETL] All retry datasets succeeded — data is now complete`);
      }
    }, 30 * 60 * 1000);
  }
}

export async function runMonthlyEtl(): Promise<void> {
  logger.info("[FMCSA ETL] ═══════════════════════════════════════════════════");
  logger.info("[FMCSA ETL] Starting MONTHLY ETL — SMS BASIC scores");
  logger.info("[FMCSA ETL] ═══════════════════════════════════════════════════");
  await ensureFmcsaTables();
  const start = Date.now();
  
  const results = [
    await safeRun("SMS Scores", () => runSmsScoresEtl()),
  ];
  
  printEtlSummary("Monthly ETL", results, start);
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dataset = args.find(a => a.startsWith("--dataset="))?.split("=")[1];
  const full = args.includes("--full");
  
  // Ensure database is ready
  await getDb();
  
  switch (dataset) {
    case undefined:
    case "all":
      await runFullEtl();
      break;
    case "daily":
      await runDailyEtl();
      break;
    case "monthly":
      await runMonthlyEtl();
      break;
    case "census":
      await runCensusEtl(full);
      break;
    case "authority":
      await runAuthorityEtl(full);
      break;
    case "insurance":
      await runInsuranceEtl(full);
      break;
    case "crashes":
      await runCrashEtl();
      break;
    case "inspections":
      await runInspectionEtl();
      break;
    case "violations":
      await runViolationEtl();
      break;
    case "sms":
      await runSmsScoresEtl();
      break;
    case "oos":
      await runOosEtl();
      break;
    case "boc3":
      await runBoc3Etl();
      break;
    case "revocations":
      await runRevocationsEtl();
      break;
    default:
      logger.info(`
FMCSA ETL — EusoTrip Carrier Data Pipeline
═══════════════════════════════════════════

Usage: npx ts-node server/etl/fmcsaEtl.ts --dataset=<name> [--full]

Orchestration:
  all            Run full ETL for ALL datasets (~16M records)
  daily          Run ALL daily datasets (census, authority, insurance,
                 crashes, inspections, violations, OOS, BOC3, revocations)
  monthly        Run monthly SMS BASIC scores update

Individual Datasets:
  census         Company Census File (~900K carriers)
  authority      Operating Authority / Carrier file (~500K)
  insurance      Insurance policies (~2M)
  crashes        Crash reports, 3-year rolling (~500K)
  inspections    Roadside inspections, 3-year rolling (~4M)
  violations     Inspection violations (~8M)
  sms            SMS BASIC percentile scores (~500K)
  oos            Out of Service orders (~10K active)
  boc3           BOC-3 process agents
  revocations    Authority revocations

Options:
  --full         Force full refresh instead of delta (census/authority/insurance)

Data Sources: data.transportation.gov (34 dataset IDs)
Schedule:      Daily at 12:00 PM CT (18:00 UTC) via fmcsaCron.ts
`);
  }
  
  process.exit(0);
}

// Run if called directly (wrapped for esbuild ESM compatibility)
try {
  if (require.main === module) {
    main().catch(err => {
      logger.error("[FMCSA ETL] Fatal error:", err);
      process.exit(1);
    });
  }
} catch { /* esbuild ESM bundle — module not defined, skip CLI entry */ }

export {
  runCensusEtl,
  runAuthorityEtl,
  runInsuranceEtl,
  runCrashEtl,
  runInspectionEtl,
  runViolationEtl,
  runSmsScoresEtl,
  runOosEtl,
  runBoc3Etl,
  runRevocationsEtl,
};
