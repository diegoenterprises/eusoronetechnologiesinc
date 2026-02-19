-- ============================================================================
-- MIGRATION 0009: Interstate Compliance Engine + SOS Emergency System
-- ============================================================================

-- SOS Emergency Alerts
CREATE TABLE IF NOT EXISTS `sos_alerts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `load_id` INT NOT NULL,
  `driver_id` INT NOT NULL,
  `vehicle_id` INT,
  `alert_type` ENUM('medical','mechanical','hazmat_spill','accident','threat','weather','other') NOT NULL,
  `severity` ENUM('low','medium','high','critical') NOT NULL DEFAULT 'high',
  `status` ENUM('active','acknowledged','responding','resolved','false_alarm') NOT NULL DEFAULT 'active',
  `latitude` DECIMAL(10,8) NOT NULL,
  `longitude` DECIMAL(11,8) NOT NULL,
  `description` TEXT,
  `state_code` VARCHAR(2),
  `nearest_mile_marker` VARCHAR(20),
  `acknowledged_by` INT,
  `acknowledged_at` TIMESTAMP NULL,
  `resolved_by` INT,
  `resolved_at` TIMESTAMP NULL,
  `resolution_notes` TEXT,
  `notified_users` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sos_load` (`load_id`),
  INDEX `idx_sos_driver` (`driver_id`),
  INDEX `idx_sos_status` (`status`),
  INDEX `idx_sos_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Trip Compliance Events (fired on state crossings, permit checks, etc.)
CREATE TABLE IF NOT EXISTS `trip_compliance_events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `load_id` INT NOT NULL,
  `driver_id` INT NOT NULL,
  `vehicle_id` INT,
  `event_type` ENUM(
    'state_entry','state_exit',
    'permit_valid','permit_missing','permit_expired',
    'weight_tax_required','weight_tax_filed',
    'ifta_mile_logged',
    'carb_required','carb_valid','carb_missing',
    'hazmat_zone_entry','hazmat_zone_exit',
    'oversize_permit_required','oversize_permit_valid','oversize_permit_missing',
    'document_expiring','document_expired',
    'weigh_station_approach','port_of_entry',
    'fuel_purchase','toll_crossing'
  ) NOT NULL,
  `state_code` VARCHAR(2),
  `from_state` VARCHAR(2),
  `to_state` VARCHAR(2),
  `latitude` DECIMAL(10,8),
  `longitude` DECIMAL(11,8),
  `details` JSON,
  `is_blocking` TINYINT(1) DEFAULT 0,
  `requires_action` TINYINT(1) DEFAULT 0,
  `action_taken` TINYINT(1) DEFAULT 0,
  `action_description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_tce_load` (`load_id`),
  INDEX `idx_tce_driver` (`driver_id`),
  INDEX `idx_tce_type` (`event_type`),
  INDEX `idx_tce_state` (`state_code`),
  INDEX `idx_tce_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Trip State Summary (aggregated per-load state mileage for IFTA)
CREATE TABLE IF NOT EXISTS `trip_state_miles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `load_id` INT NOT NULL,
  `vehicle_id` INT,
  `state_code` VARCHAR(2) NOT NULL,
  `miles` DECIMAL(8,2) NOT NULL DEFAULT 0,
  `fuel_gallons` DECIMAL(8,2) DEFAULT 0,
  `entry_time` TIMESTAMP NULL,
  `exit_time` TIMESTAMP NULL,
  `toll_cost` DECIMAL(8,2) DEFAULT 0,
  `weight_tax_applicable` TINYINT(1) DEFAULT 0,
  `weight_tax_amount` DECIMAL(8,2) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_tsm_load` (`load_id`),
  INDEX `idx_tsm_state` (`state_code`),
  INDEX `idx_tsm_vehicle` (`vehicle_id`),
  UNIQUE KEY `uq_tsm_load_state` (`load_id`, `state_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
