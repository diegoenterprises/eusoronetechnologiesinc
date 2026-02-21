-- Migration 0011: Facility Intelligence Layer (FIL)
-- Master facility database, ratings, requirements, stats cache, DTN integration, detention GPS

-- ============================================================================
-- FACILITIES — Gov-seeded master database (EIA, HIFLD, state commissions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `facilities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `facility_type` ENUM('TERMINAL','REFINERY','WELL','RACK','TANK_BATTERY','TRANSLOAD','BULK_PLANT') NOT NULL,
  `facility_subtype` VARCHAR(100),
  `eia_id` VARCHAR(20),
  `hifld_id` VARCHAR(20),
  `api_number` VARCHAR(14),
  `facility_name` VARCHAR(500) NOT NULL,
  `operator_name` VARCHAR(500),
  `owner_name` VARCHAR(500),
  `facility_address` VARCHAR(500),
  `facility_city` VARCHAR(200),
  `facility_county` VARCHAR(200),
  `facility_state` CHAR(2) NOT NULL,
  `facility_zip` VARCHAR(10),
  `latitude` DECIMAL(10,7) NOT NULL,
  `longitude` DECIMAL(10,7) NOT NULL,
  `padd` VARCHAR(10),
  `storage_capacity_bbl` BIGINT,
  `processing_capacity_bpd` INT,
  `receives_pipeline` BOOLEAN DEFAULT FALSE,
  `receives_tanker` BOOLEAN DEFAULT FALSE,
  `receives_barge` BOOLEAN DEFAULT FALSE,
  `receives_truck` BOOLEAN DEFAULT FALSE,
  `receives_rail` BOOLEAN DEFAULT FALSE,
  `products` JSON,
  `hazmat_classes` JSON,
  `well_type` VARCHAR(50),
  `well_status` VARCHAR(50),
  `lease_name` VARCHAR(500),
  `producing_formation` VARCHAR(200),
  `total_depth_ft` INT,
  `facility_status` ENUM('OPERATING','IDLE','UNDER_CONSTRUCTION','SHUT_DOWN','PLUGGED') NOT NULL,
  `is_eusotrip_verified` BOOLEAN DEFAULT FALSE,
  `claimed_by_company_id` INT,
  `claimed_by_user_id` INT,
  `terminal_automation_system` VARCHAR(200),
  `loading_hours` VARCHAR(200),
  `appointment_required` BOOLEAN,
  `appointment_slot_minutes` INT,
  `max_trucks_per_hour` INT,
  `has_scale` BOOLEAN,
  `twic_required` BOOLEAN,
  `safety_orientation_required` BOOLEAN,
  `gate_phone` VARCHAR(20),
  `office_phone` VARCHAR(20),
  `loading_bays` INT,
  `unloading_bays` INT,
  `geofence_radius_ft` INT DEFAULT 500,
  `approach_radius_mi` DECIMAL(4,1) DEFAULT 5.0,
  `data_source` VARCHAR(100) NOT NULL,
  `source_updated_at` TIMESTAMP NULL,
  `facility_created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `facility_updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_fac_type` (`facility_type`),
  INDEX `idx_fac_state` (`facility_state`),
  INDEX `idx_fac_status` (`facility_status`),
  INDEX `idx_fac_padd` (`padd`),
  INDEX `idx_fac_claimed` (`claimed_by_company_id`),
  INDEX `idx_fac_location` (`latitude`, `longitude`),
  INDEX `idx_fac_name` (`facility_name`(191)),
  INDEX `idx_fac_eia` (`eia_id`),
  INDEX `idx_fac_hifld` (`hifld_id`),
  INDEX `idx_fac_source` (`data_source`),
  FULLTEXT INDEX `idx_fac_search` (`facility_name`, `operator_name`, `facility_city`)
);

-- ============================================================================
-- FACILITY RATINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `facility_ratings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `facility_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `user_role` VARCHAR(50) NOT NULL,
  `rating` INT NOT NULL,
  `wait_time_minutes` INT,
  `comment` TEXT,
  `terminal_response` TEXT,
  `terminal_responded_at` TIMESTAMP NULL,
  `load_id` INT,
  `fr_created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX `idx_fr_facility` (`facility_id`),
  INDEX `idx_fr_user` (`user_id`),
  INDEX `idx_fr_rating` (`rating`)
);

-- ============================================================================
-- FACILITY REQUIREMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `facility_requirements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `fq_facility_id` INT NOT NULL,
  `requirement_type` VARCHAR(50) NOT NULL,
  `requirement_value` VARCHAR(200),
  `is_required` BOOLEAN DEFAULT TRUE,
  `fq_notes` TEXT,
  `fq_created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fq_updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_fq_facility` (`fq_facility_id`),
  INDEX `idx_fq_type` (`requirement_type`)
);

-- ============================================================================
-- FACILITY STATS CACHE (refreshed every 15 min)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `facility_stats_cache` (
  `fsc_facility_id` INT PRIMARY KEY,
  `avg_wait_minutes` DECIMAL(6,1),
  `avg_loading_minutes` DECIMAL(6,1),
  `avg_turnaround_minutes` DECIMAL(6,1),
  `total_loads_last_90_days` INT DEFAULT 0,
  `total_loads_all_time` INT DEFAULT 0,
  `on_time_start_pct` DECIMAL(5,2),
  `detention_incident_pct` DECIMAL(5,2),
  `avg_rating` DECIMAL(3,2),
  `total_ratings` INT DEFAULT 0,
  `peak_hours_json` JSON,
  `top_carriers_json` JSON,
  `fsc_last_calculated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- DTN CONNECTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `dtn_connections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `dtn_facility_id` INT NOT NULL,
  `dtn_company_id` INT NOT NULL,
  `dtn_terminal_id` VARCHAR(100),
  `dtn_api_key_encrypted` JSON,
  `dtn_environment` ENUM('sandbox','production') DEFAULT 'production',
  `sync_enabled` BOOLEAN DEFAULT TRUE,
  `last_sync_at` TIMESTAMP NULL,
  `last_sync_status` ENUM('SUCCESS','ERROR','TIMEOUT'),
  `sync_config_json` JSON,
  `dtn_created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `dtn_updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_dtn_facility` (`dtn_facility_id`),
  INDEX `idx_dtn_company` (`dtn_company_id`)
);

-- ============================================================================
-- DTN SYNC LOG (append-only audit trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `dtn_sync_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `dtn_connection_id` INT NOT NULL,
  `dsl_facility_id` INT NOT NULL,
  `direction` ENUM('TO_DTN','FROM_DTN') NOT NULL,
  `event_type` VARCHAR(100) NOT NULL,
  `dsl_payload` JSON,
  `response_status` INT,
  `response_body` JSON,
  `dsl_error_message` TEXT,
  `duration_ms` INT,
  `dsl_created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX `idx_dsl_connection` (`dtn_connection_id`),
  INDEX `idx_dsl_facility` (`dsl_facility_id`),
  INDEX `idx_dsl_direction` (`direction`),
  INDEX `idx_dsl_event` (`event_type`),
  INDEX `idx_dsl_created` (`dsl_created_at`)
);

-- ============================================================================
-- DETENTION GPS RECORDS (immutable geofence timestamps)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `detention_gps_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `dgr_load_id` INT NOT NULL,
  `dgr_facility_id` INT NOT NULL,
  `dgr_driver_id` INT NOT NULL,
  `dgr_carrier_id` INT NOT NULL,
  `arrival_timestamp` TIMESTAMP NOT NULL,
  `arrival_latitude` DECIMAL(10,7),
  `arrival_longitude` DECIMAL(10,7),
  `gate_entry_timestamp` TIMESTAMP NULL,
  `dock_assign_timestamp` TIMESTAMP NULL,
  `loading_start_timestamp` TIMESTAMP NULL,
  `loading_end_timestamp` TIMESTAMP NULL,
  `departure_timestamp` TIMESTAMP NULL,
  `departure_latitude` DECIMAL(10,7),
  `departure_longitude` DECIMAL(10,7),
  `total_time_minutes` INT,
  `free_time_minutes` INT,
  `detention_minutes` INT,
  `detention_rate` DECIMAL(8,2),
  `detention_charge` DECIMAL(10,2),
  `dtn_bol_number` VARCHAR(100),
  `dtn_loading_start` TIMESTAMP NULL,
  `dtn_loading_end` TIMESTAMP NULL,
  `dgr_status` ENUM('CALCULATED','INVOICED','DISPUTED','RESOLVED') DEFAULT 'CALCULATED',
  `dgr_created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX `idx_dgr_load` (`dgr_load_id`),
  INDEX `idx_dgr_facility` (`dgr_facility_id`),
  INDEX `idx_dgr_driver` (`dgr_driver_id`),
  INDEX `idx_dgr_carrier` (`dgr_carrier_id`),
  INDEX `idx_dgr_status` (`dgr_status`),
  INDEX `idx_dgr_arrival` (`arrival_timestamp`)
);
