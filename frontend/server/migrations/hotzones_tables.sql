-- ============================================
-- HOT ZONES DATA INTEGRATION SCHEMA
-- EusoTrip Platform - Hazmat Logistics Intelligence
-- Migration: 2026_02_17_create_hotzones_tables
-- ============================================

-- ---------------------------------------------
-- FUEL PRICES (EIA + AAA + OPIS)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS hz_fuel_prices (
  id VARCHAR(36) PRIMARY KEY,
  state_code CHAR(2) NOT NULL,
  padd_region VARCHAR(10),
  
  -- Retail prices (cents/gallon)
  diesel_retail DECIMAL(6,3),
  gasoline_retail DECIMAL(6,3),
  
  -- Wholesale/rack prices
  diesel_rack DECIMAL(6,3),
  ulsd_rack DECIMAL(6,3),
  
  -- Price changes
  diesel_change_1w DECIMAL(5,3),
  diesel_change_1m DECIMAL(5,3),
  
  -- Metadata
  source ENUM('EIA', 'AAA', 'OPIS') NOT NULL,
  report_date DATE NOT NULL,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_state_date (state_code, report_date),
  INDEX idx_padd_date (padd_region, report_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- WEATHER ALERTS (NWS)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS hz_weather_alerts (
  id VARCHAR(64) PRIMARY KEY,
  
  -- Geographic targeting
  state_codes JSON,
  zone_ids JSON,
  affected_counties JSON,
  geometry JSON,
  
  -- Alert details
  event_type VARCHAR(100) NOT NULL,
  severity ENUM('Minor', 'Moderate', 'Severe', 'Extreme', 'Unknown') NOT NULL,
  urgency ENUM('Immediate', 'Expected', 'Future', 'Past', 'Unknown') NOT NULL,
  certainty ENUM('Observed', 'Likely', 'Possible', 'Unlikely', 'Unknown') NOT NULL,
  
  -- Content
  headline VARCHAR(500),
  description TEXT,
  instruction TEXT,
  
  -- Timing
  onset_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  ends_at TIMESTAMP NULL,
  
  -- Status
  status ENUM('Actual', 'Exercise', 'System', 'Test', 'Draft') NOT NULL,
  message_type ENUM('Alert', 'Update', 'Cancel') NOT NULL,
  
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_severity (severity),
  INDEX idx_expires (expires_at),
  INDEX idx_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- CARRIER SAFETY (FMCSA)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS hz_carrier_safety (
  dot_number VARCHAR(10) PRIMARY KEY,
  legal_name VARCHAR(255) NOT NULL,
  dba_name VARCHAR(255),
  
  -- Safety Scores (BASIC percentiles 0-100)
  unsafe_driving_score DECIMAL(5,2),
  hos_compliance_score DECIMAL(5,2),
  driver_fitness_score DECIMAL(5,2),
  controlled_substances_score DECIMAL(5,2),
  vehicle_maintenance_score DECIMAL(5,2),
  hazmat_compliance_score DECIMAL(5,2),
  crash_indicator_score DECIMAL(5,2),
  
  -- Overall rating
  safety_rating ENUM('Satisfactory', 'Conditional', 'Unsatisfactory', 'None') DEFAULT 'None',
  safety_rating_date DATE,
  
  -- Inspection summary (last 24 months)
  total_inspections INT DEFAULT 0,
  driver_inspections INT DEFAULT 0,
  vehicle_inspections INT DEFAULT 0,
  hazmat_inspections INT DEFAULT 0,
  driver_oos_rate DECIMAL(5,2),
  vehicle_oos_rate DECIMAL(5,2),
  
  -- Crash summary
  total_crashes INT DEFAULT 0,
  fatal_crashes INT DEFAULT 0,
  injury_crashes INT DEFAULT 0,
  tow_crashes INT DEFAULT 0,
  
  -- Authority status
  common_authority BOOLEAN DEFAULT FALSE,
  contract_authority BOOLEAN DEFAULT FALSE,
  broker_authority BOOLEAN DEFAULT FALSE,
  hazmat_authority BOOLEAN DEFAULT FALSE,
  
  -- Insurance
  bipd_insurance_required INT,
  bipd_insurance_on_file INT,
  cargo_insurance_required INT,
  cargo_insurance_on_file INT,
  bond_insurance_required INT,
  bond_insurance_on_file INT,
  
  -- Location
  physical_state CHAR(2),
  physical_city VARCHAR(100),
  physical_zip VARCHAR(10),
  
  -- Metadata
  last_update DATE,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_state (physical_state),
  INDEX idx_hazmat (hazmat_authority),
  INDEX idx_rating (safety_rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- HAZMAT INCIDENTS (PHMSA)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS hz_hazmat_incidents (
  report_number VARCHAR(20) PRIMARY KEY,
  
  -- Location
  state_code CHAR(2) NOT NULL,
  city VARCHAR(100),
  county VARCHAR(100),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  
  -- Incident details
  incident_date DATE NOT NULL,
  mode ENUM('Highway', 'Rail', 'Air', 'Water', 'Pipeline') NOT NULL,
  incident_type VARCHAR(100),
  
  -- Material info
  hazmat_class VARCHAR(20),
  hazmat_name VARCHAR(255),
  un_number VARCHAR(10),
  quantity_released DECIMAL(15,4),
  quantity_unit VARCHAR(20),
  
  -- Consequences
  fatalities INT DEFAULT 0,
  injuries INT DEFAULT 0,
  hospitalized INT DEFAULT 0,
  evacuated INT DEFAULT 0,
  property_damage DECIMAL(15,2),
  
  -- Carrier info
  carrier_name VARCHAR(255),
  carrier_dot_number VARCHAR(10),
  
  -- Root cause
  cause_category VARCHAR(100),
  cause_subcategory VARCHAR(100),
  
  -- Response
  federal_response BOOLEAN DEFAULT FALSE,
  cleanup_cost DECIMAL(15,2),
  
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_state_date (state_code, incident_date),
  INDEX idx_hazmat_class (hazmat_class),
  INDEX idx_carrier (carrier_dot_number),
  INDEX idx_mode (mode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- EPA FACILITIES (TRI + ECHO)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS hz_epa_facilities (
  registry_id VARCHAR(20) PRIMARY KEY,
  facility_name VARCHAR(255) NOT NULL,
  
  -- Location
  state_code CHAR(2) NOT NULL,
  city VARCHAR(100),
  county VARCHAR(100),
  zip_code VARCHAR(10),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  
  -- Facility type
  industry_sector VARCHAR(100),
  naics_codes JSON,
  sic_codes JSON,
  
  -- Chemical releases (TRI)
  tri_facility BOOLEAN DEFAULT FALSE,
  total_releases_lbs DECIMAL(15,2),
  air_releases_lbs DECIMAL(15,2),
  water_releases_lbs DECIMAL(15,2),
  land_releases_lbs DECIMAL(15,2),
  chemicals_reported JSON,
  
  -- Compliance (ECHO)
  compliance_status ENUM('In Compliance', 'Violation', 'Unknown') DEFAULT 'Unknown',
  qtrs_in_noncompliance INT DEFAULT 0,
  informal_enforcement_actions INT DEFAULT 0,
  formal_enforcement_actions INT DEFAULT 0,
  penalties_last_5yr DECIMAL(15,2),
  
  -- Permits
  rcra_handler BOOLEAN DEFAULT FALSE,
  npdes_permit BOOLEAN DEFAULT FALSE,
  caa_permit BOOLEAN DEFAULT FALSE,
  
  last_inspection_date DATE,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_state (state_code),
  INDEX idx_compliance (compliance_status),
  INDEX idx_location (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- SEISMIC EVENTS (USGS)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS hz_seismic_events (
  event_id VARCHAR(20) PRIMARY KEY,
  
  -- Location
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  depth_km DECIMAL(8,3),
  place_description VARCHAR(255),
  
  -- Event details
  magnitude DECIMAL(4,2) NOT NULL,
  magnitude_type VARCHAR(10),
  event_time TIMESTAMP NOT NULL,
  
  -- Impact assessment
  felt_reports INT DEFAULT 0,
  cdi DECIMAL(4,2),
  mmi DECIMAL(4,2),
  alert_level ENUM('green', 'yellow', 'orange', 'red') NULL,
  
  -- Tsunami
  tsunami_flag BOOLEAN DEFAULT FALSE,
  
  -- Status
  status VARCHAR(20),
  
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_time (event_time),
  INDEX idx_magnitude (magnitude),
  INDEX idx_location (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- WILDFIRES (NIFC)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS hz_wildfires (
  incident_id VARCHAR(50) PRIMARY KEY,
  incident_name VARCHAR(255) NOT NULL,
  
  -- Location
  state_code CHAR(2),
  county VARCHAR(100),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  perimeter_geometry JSON,
  
  -- Fire details
  fire_discovery_date DATE,
  containment_date DATE,
  acres_burned DECIMAL(12,2),
  percent_contained DECIMAL(5,2),
  
  -- Resources
  total_personnel INT,
  total_engines INT,
  total_helicopters INT,
  
  -- Cost
  estimated_cost DECIMAL(15,2),
  
  -- Impact
  structures_destroyed INT DEFAULT 0,
  structures_threatened INT DEFAULT 0,
  evacuations_ordered BOOLEAN DEFAULT FALSE,
  
  -- Status
  fire_status ENUM('Active', 'Contained', 'Controlled', 'Out') NOT NULL,
  
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_state (state_code),
  INDEX idx_status (fire_status),
  INDEX idx_date (fire_discovery_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- FEMA DISASTERS
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS hz_fema_disasters (
  disaster_number VARCHAR(10) PRIMARY KEY,
  
  -- Location
  state_code CHAR(2) NOT NULL,
  designated_area VARCHAR(255),
  
  -- Declaration details
  declaration_date DATE NOT NULL,
  incident_type VARCHAR(100),
  declaration_type ENUM('DR', 'EM', 'FM', 'FS') NOT NULL,
  
  -- Timing
  incident_begin_date DATE,
  incident_end_date DATE,
  closeout_date DATE,
  
  -- Programs activated
  ih_program_declared BOOLEAN DEFAULT FALSE,
  ia_program_declared BOOLEAN DEFAULT FALSE,
  pa_program_declared BOOLEAN DEFAULT FALSE,
  hm_program_declared BOOLEAN DEFAULT FALSE,
  
  -- Financial
  total_obligated_amount DECIMAL(15,2),
  
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_state (state_code),
  INDEX idx_date (declaration_date),
  INDEX idx_type (declaration_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- FREIGHT FLOWS (BTS)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS hz_freight_flows (
  id VARCHAR(36) PRIMARY KEY,
  
  -- Lane definition
  origin_state CHAR(2) NOT NULL,
  origin_cfs_area VARCHAR(10),
  destination_state CHAR(2) NOT NULL,
  destination_cfs_area VARCHAR(10),
  
  -- Commodity
  sctg_code VARCHAR(5),
  sctg_description VARCHAR(255),
  hazmat_flag BOOLEAN DEFAULT FALSE,
  
  -- Volume (annual)
  tons_thousands DECIMAL(15,2),
  ton_miles_millions DECIMAL(15,2),
  value_millions DECIMAL(15,2),
  
  -- Mode
  mode VARCHAR(50),
  
  -- Year
  data_year YEAR NOT NULL,
  
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_origin (origin_state),
  INDEX idx_destination (destination_state),
  INDEX idx_commodity (sctg_code),
  INDEX idx_hazmat (hazmat_flag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- RATE INDICES (USDA + Freightos)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS hz_rate_indices (
  id VARCHAR(36) PRIMARY KEY,
  
  -- Lane or region
  origin VARCHAR(100),
  destination VARCHAR(100),
  region VARCHAR(50),
  
  -- Rate data
  rate_per_mile DECIMAL(6,3),
  rate_per_load DECIMAL(10,2),
  fuel_surcharge DECIMAL(6,3),
  
  -- Change metrics
  rate_change_1w DECIMAL(5,2),
  rate_change_1m DECIMAL(5,2),
  rate_change_1y DECIMAL(5,2),
  
  -- Index type
  equipment_type ENUM('DRY_VAN', 'REEFER', 'FLATBED', 'TANKER', 'ALL') NOT NULL,
  rate_type ENUM('SPOT', 'CONTRACT', 'INDEX') NOT NULL,
  
  -- Source
  source ENUM('USDA', 'FREIGHTOS', 'DAT_PUBLIC', 'INTERNAL') NOT NULL,
  report_date DATE NOT NULL,
  
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_region (region),
  INDEX idx_date (report_date),
  INDEX idx_equipment (equipment_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- CRUDE OIL PRICING (CME + EIA)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS hz_crude_prices (
  id VARCHAR(36) PRIMARY KEY,
  
  -- Product
  product_code VARCHAR(20) NOT NULL,
  product_name VARCHAR(100),
  
  -- Pricing
  price_usd DECIMAL(10,4) NOT NULL,
  price_change_1d DECIMAL(8,4),
  price_change_1w DECIMAL(8,4),
  
  -- Volume
  volume_barrels BIGINT,
  open_interest INT,
  
  -- Contract details
  contract_month VARCHAR(10),
  settlement_date DATE,
  
  -- Source
  source ENUM('CME', 'EIA', 'PLATTS_FREE', 'ICE_FREE') NOT NULL,
  report_date DATE NOT NULL,
  
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_product (product_code),
  INDEX idx_date (report_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- PORT ACTIVITY
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS hz_port_activity (
  id VARCHAR(36) PRIMARY KEY,
  
  -- Port identification
  port_code VARCHAR(10) NOT NULL,
  port_name VARCHAR(100) NOT NULL,
  state_code CHAR(2) NOT NULL,
  
  -- Volume metrics
  container_teus INT,
  bulk_tons DECIMAL(15,2),
  tanker_barrels BIGINT,
  vessel_calls INT,
  
  -- Capacity
  berth_availability DECIMAL(5,2),
  terminal_utilization DECIMAL(5,2),
  avg_dwell_time_hours DECIMAL(6,2),
  
  -- Delays
  avg_wait_time_hours DECIMAL(6,2),
  vessels_at_anchor INT,
  
  -- Trends
  volume_change_mom DECIMAL(5,2),
  volume_change_yoy DECIMAL(5,2),
  
  report_date DATE NOT NULL,
  
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_port (port_code),
  INDEX idx_state (state_code),
  INDEX idx_date (report_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- LOCK & WATERWAY STATUS (USACE)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS hz_lock_status (
  lock_id VARCHAR(20) PRIMARY KEY,
  lock_name VARCHAR(100) NOT NULL,
  river_name VARCHAR(100),
  
  -- Location
  state_code CHAR(2),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  
  -- Status
  operational_status ENUM('Open', 'Closed', 'Restricted', 'Scheduled_Closure') NOT NULL,
  closure_reason VARCHAR(255),
  expected_reopen DATE,
  
  -- Traffic
  avg_delay_hours DECIMAL(6,2),
  vessels_waiting INT,
  daily_lockages INT,
  
  -- Maintenance
  scheduled_maintenance JSON,
  
  last_updated TIMESTAMP,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_status (operational_status),
  INDEX idx_state (state_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- AIRSPACE RESTRICTIONS (FAA TFRs)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS hz_tfr_restrictions (
  notam_id VARCHAR(50) PRIMARY KEY,
  
  -- Restriction area
  center_latitude DECIMAL(10,7),
  center_longitude DECIMAL(10,7),
  radius_nm DECIMAL(8,2),
  altitude_floor INT,
  altitude_ceiling INT,
  geometry JSON,
  
  -- Details
  restriction_type VARCHAR(100),
  reason VARCHAR(255),
  
  -- Timing
  effective_start TIMESTAMP NOT NULL,
  effective_end TIMESTAMP,
  
  -- Impact on surface transport
  affects_oversize BOOLEAN DEFAULT FALSE,
  surface_restrictions TEXT,
  
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_dates (effective_start, effective_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- ZONE INTELLIGENCE CACHE (Aggregated Metrics)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS hz_zone_intelligence (
  zone_id VARCHAR(20) PRIMARY KEY,
  
  -- Core metrics
  live_loads INT DEFAULT 0,
  live_trucks INT DEFAULT 0,
  load_to_truck_ratio DECIMAL(5,2),
  surge_multiplier DECIMAL(4,2) DEFAULT 1.0,
  
  -- Rates
  avg_rate_per_mile DECIMAL(6,3),
  rate_change_24h DECIMAL(5,2),
  rate_change_7d DECIMAL(5,2),
  
  -- Fuel
  diesel_price DECIMAL(6,3),
  diesel_trend ENUM('rising', 'falling', 'stable'),
  
  -- Weather risk (aggregated)
  active_weather_alerts INT DEFAULT 0,
  max_weather_severity ENUM('None', 'Minor', 'Moderate', 'Severe', 'Extreme') DEFAULT 'None',
  weather_alert_types JSON,
  
  -- Safety metrics (FMCSA aggregate)
  avg_carrier_safety_score DECIMAL(5,2),
  carriers_with_violations INT DEFAULT 0,
  recent_hazmat_incidents INT DEFAULT 0,
  
  -- Compliance risk
  compliance_risk_score DECIMAL(5,2),
  compliance_factors JSON,
  
  -- Environmental
  epa_facilities_count INT DEFAULT 0,
  facilities_with_violations INT DEFAULT 0,
  
  -- Natural hazards
  seismic_risk_level ENUM('Low', 'Moderate', 'High') DEFAULT 'Low',
  active_wildfires INT DEFAULT 0,
  fema_disaster_active BOOLEAN DEFAULT FALSE,
  
  -- Infrastructure
  port_congestion_level ENUM('Low', 'Normal', 'High', 'Critical') DEFAULT 'Normal',
  lock_delays_avg_hours DECIMAL(6,2),
  
  -- Timestamps
  computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP,
  
  INDEX idx_computed (computed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- DATA SYNC LOG
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS hz_data_sync_log (
  id VARCHAR(36) PRIMARY KEY,
  source_name VARCHAR(50) NOT NULL,
  sync_type ENUM('FULL', 'INCREMENTAL', 'DELTA') NOT NULL,
  
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  
  records_fetched INT DEFAULT 0,
  records_inserted INT DEFAULT 0,
  records_updated INT DEFAULT 0,
  records_deleted INT DEFAULT 0,
  
  status ENUM('RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL') NOT NULL,
  error_message TEXT,
  
  INDEX idx_source (source_name),
  INDEX idx_status (status),
  INDEX idx_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------
-- INITIAL ZONE SEED DATA
-- ---------------------------------------------
INSERT INTO hz_zone_intelligence (zone_id, live_loads, live_trucks, load_to_truck_ratio, surge_multiplier, avg_rate_per_mile, diesel_price)
VALUES 
  ('hz-lax', 0, 0, 0, 1.0, 2.45, 4.89),
  ('hz-chi', 0, 0, 0, 1.0, 2.38, 4.12),
  ('hz-hou', 0, 0, 0, 1.0, 2.52, 3.78),
  ('hz-atl', 0, 0, 0, 1.0, 2.41, 3.95),
  ('hz-dal', 0, 0, 0, 1.0, 2.48, 3.82),
  ('hz-nwk', 0, 0, 0, 1.0, 2.65, 4.45),
  ('hz-mid', 0, 0, 0, 1.0, 3.15, 3.72),
  ('hz-sav', 0, 0, 0, 1.0, 2.35, 3.88),
  ('hz-mem', 0, 0, 0, 1.0, 2.28, 3.92),
  ('hz-bak', 0, 0, 0, 1.0, 3.25, 4.15),
  ('hz-phl', 0, 0, 0, 1.0, 2.55, 4.28),
  ('hz-lac', 0, 0, 0, 1.0, 2.85, 3.68),
  ('hz-det', 0, 0, 0, 1.0, 2.32, 4.05),
  ('hz-sea', 0, 0, 0, 1.0, 2.58, 4.72),
  ('hz-den', 0, 0, 0, 1.0, 2.42, 4.02),
  ('hz-jax', 0, 0, 0, 1.0, 2.28, 3.85),
  ('hz-eag', 0, 0, 0, 1.0, 2.95, 3.72),
  ('hz-pit', 0, 0, 0, 1.0, 2.65, 4.18)
ON DUPLICATE KEY UPDATE zone_id = zone_id;

-- Complete
SELECT 'Hot Zones Data Integration Schema Created Successfully' AS status;
