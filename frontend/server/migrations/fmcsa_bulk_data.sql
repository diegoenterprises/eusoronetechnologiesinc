-- ============================================================================
-- FMCSA BULK DATA TABLES
-- Complete mirror of FMCSA Open Data Portal datasets
-- Source: https://data.transportation.gov
-- ============================================================================

-- 1. COMPANY CENSUS FILE (Updated Daily)
-- All active carriers registered with FMCSA
CREATE TABLE IF NOT EXISTS fmcsa_census (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dot_number VARCHAR(10) NOT NULL,
  legal_name VARCHAR(255),
  dba_name VARCHAR(255),
  carrier_operation VARCHAR(50),
  hm_flag CHAR(1),  -- Y/N hazmat
  pc_flag CHAR(1),  -- Y/N passenger carrier
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
  -- Classification flags
  class_property CHAR(1),
  class_passenger CHAR(1),
  class_hazmat CHAR(1),
  class_private CHAR(1),
  class_exempt CHAR(1),
  -- Operation flags
  op_interstate CHAR(1),
  op_intrastate CHAR(1),
  -- Cargo carried (JSON array)
  cargo_carried JSON,
  -- Timestamps
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY uq_dot (dot_number),
  INDEX idx_state (phy_state),
  INDEX idx_hm (hm_flag),
  INDEX idx_name (legal_name(100)),
  FULLTEXT INDEX ft_company (legal_name, dba_name, phy_city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. OPERATING AUTHORITY (Updated Daily)
-- MC numbers, broker authority, freight forwarder authority
CREATE TABLE IF NOT EXISTS fmcsa_authority (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dot_number VARCHAR(10) NOT NULL,
  docket_number VARCHAR(20),
  prefix CHAR(2),  -- MC, FF, MX
  docket_type VARCHAR(50),
  -- Authority types
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
  -- Status
  authority_status VARCHAR(20),  -- ACTIVE, INACTIVE, PENDING
  -- Insurance amounts
  bipd_insurance_required INT,
  bipd_insurance_on_file INT,
  cargo_insurance_required INT,
  cargo_insurance_on_file INT,
  bond_insurance_required INT,
  bond_insurance_on_file INT,
  -- Timestamps
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_dot (dot_number),
  INDEX idx_mc (docket_number),
  INDEX idx_status (authority_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. INSURANCE (Updated Daily)
-- Active and historical insurance policies
CREATE TABLE IF NOT EXISTS fmcsa_insurance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dot_number VARCHAR(10) NOT NULL,
  docket_number VARCHAR(20),
  insurance_type VARCHAR(20),  -- BIPD, CARGO, BOND, etc.
  policy_number VARCHAR(100),
  insurance_carrier VARCHAR(255),
  coverage_from DATE,
  coverage_to DATE,
  posted_date DATE,
  cancel_date DATE,
  cancel_method VARCHAR(50),  -- CANCELLED, REPLACED, NAME_CHANGE
  bipd_underlying_limit INT,
  bipd_max_limit INT,
  cargo_limit INT,
  bond_limit INT,
  is_active BOOLEAN DEFAULT TRUE,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_dot (dot_number),
  INDEX idx_active (is_active, coverage_to),
  INDEX idx_type (insurance_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. CRASHES (Updated Daily, 3-year rolling)
CREATE TABLE IF NOT EXISTS fmcsa_crashes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dot_number VARCHAR(10) NOT NULL,
  report_state CHAR(2),
  report_number VARCHAR(50),
  report_date DATE,
  report_time TIME,
  report_seq_no INT,
  -- Location
  city VARCHAR(100),
  county VARCHAR(100),
  state CHAR(2),
  -- Severity
  fatalities INT DEFAULT 0,
  injuries INT DEFAULT 0,
  tow_away CHAR(1),
  hazmat_released CHAR(1),
  -- Vehicle info
  vehicle_id_number VARCHAR(20),
  vehicle_license_state CHAR(2),
  vehicle_license_number VARCHAR(20),
  -- Conditions
  road_surface_condition VARCHAR(50),
  light_condition VARCHAR(50),
  weather_condition VARCHAR(50),
  -- Factors
  not_preventable CHAR(1),  -- DataQs determination
  severity_weight DECIMAL(5,2),
  time_weight DECIMAL(5,2),
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_dot (dot_number),
  INDEX idx_date (report_date),
  INDEX idx_state (state),
  INDEX idx_severity (fatalities, injuries)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. INSPECTIONS (Updated Daily, 3-year rolling)
CREATE TABLE IF NOT EXISTS fmcsa_inspections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inspection_id VARCHAR(50) NOT NULL,
  dot_number VARCHAR(10) NOT NULL,
  report_state CHAR(2),
  report_number VARCHAR(50),
  inspection_date DATE,
  -- Location
  insp_level_id INT,  -- 1-6 inspection level
  county_code VARCHAR(10),
  -- Results
  driver_oos CHAR(1),  -- Out of service
  vehicle_oos CHAR(1),
  hazmat_oos CHAR(1),
  total_violations INT DEFAULT 0,
  driver_violations INT DEFAULT 0,
  vehicle_violations INT DEFAULT 0,
  hazmat_violations INT DEFAULT 0,
  -- BASIC category violations
  unsafe_driving_viol INT DEFAULT 0,
  hos_viol INT DEFAULT 0,
  driver_fitness_viol INT DEFAULT 0,
  drugs_alcohol_viol INT DEFAULT 0,
  vehicle_maint_viol INT DEFAULT 0,
  hazmat_viol INT DEFAULT 0,
  -- Weights
  time_weight DECIMAL(5,2),
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY uq_inspection (inspection_id),
  INDEX idx_dot (dot_number),
  INDEX idx_date (inspection_date),
  INDEX idx_oos (driver_oos, vehicle_oos)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. VIOLATIONS (Updated Daily)
CREATE TABLE IF NOT EXISTS fmcsa_violations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inspection_id VARCHAR(50) NOT NULL,
  dot_number VARCHAR(10) NOT NULL,
  violation_code VARCHAR(20),
  violation_descr VARCHAR(500),
  violation_group VARCHAR(20),  -- BASIC category
  unit_number INT,
  oos CHAR(1),  -- Out of service violation
  severity_weight INT,
  time_weight DECIMAL(5,2),
  total_severity_weight DECIMAL(10,2),
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_inspection (inspection_id),
  INDEX idx_dot (dot_number),
  INDEX idx_code (violation_code),
  INDEX idx_group (violation_group)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. SMS BASIC SCORES (Updated Monthly)
CREATE TABLE IF NOT EXISTS fmcsa_sms_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dot_number VARCHAR(10) NOT NULL,
  run_date DATE NOT NULL,  -- SMS calculation date
  carrier_type VARCHAR(20),  -- PROPERTY, PASSENGER, HM
  -- BASIC Scores (percentiles 0-100)
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
  -- Inspection counts
  inspections_total INT,
  driver_inspections INT,
  vehicle_inspections INT,
  hazmat_inspections INT,
  -- OOS rates
  driver_oos_rate DECIMAL(5,2),
  vehicle_oos_rate DECIMAL(5,2),
  -- Raw data
  raw_data JSON,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY uq_dot_date (dot_number, run_date),
  INDEX idx_dot (dot_number),
  INDEX idx_date (run_date),
  INDEX idx_alerts (unsafe_driving_alert, hos_alert, vehicle_maintenance_alert)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. OUT OF SERVICE ORDERS
CREATE TABLE IF NOT EXISTS fmcsa_oos_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dot_number VARCHAR(10) NOT NULL,
  oos_date DATE,
  oos_reason VARCHAR(255),
  oos_basis VARCHAR(100),
  return_to_service_date DATE,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_dot (dot_number),
  INDEX idx_date (oos_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. BOC-3 PROCESS AGENTS
CREATE TABLE IF NOT EXISTS fmcsa_boc3 (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dot_number VARCHAR(10) NOT NULL,
  docket_number VARCHAR(20),
  agent_name VARCHAR(255),
  agent_address VARCHAR(255),
  agent_city VARCHAR(100),
  agent_state CHAR(2),
  agent_zip VARCHAR(10),
  form_date DATE,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_dot (dot_number),
  INDEX idx_agent (agent_name(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. AUTHORITY REVOCATIONS
CREATE TABLE IF NOT EXISTS fmcsa_revocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dot_number VARCHAR(10) NOT NULL,
  docket_number VARCHAR(20),
  revocation_date DATE,
  revocation_reason VARCHAR(255),
  authority_type VARCHAR(50),
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_dot (dot_number),
  INDEX idx_date (revocation_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. ETL SYNC LOG
CREATE TABLE IF NOT EXISTS fmcsa_etl_log (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. CARRIER MONITORING (EusoTrip feature - track specific carriers)
CREATE TABLE IF NOT EXISTS fmcsa_monitored_carriers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dot_number VARCHAR(10) NOT NULL,
  company_id INT,  -- FK to companies table
  user_id INT,  -- Who added this monitoring
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. CARRIER CHANGE ALERTS
CREATE TABLE IF NOT EXISTS fmcsa_change_alerts (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
