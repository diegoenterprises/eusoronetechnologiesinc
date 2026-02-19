-- ═══════════════════════════════════════════════════════════════
-- ROUTE INTELLIGENCE TABLES — Crowd-sourced driver mapping system
-- Every driver becomes a mapping sensor. Raw GPS pings from
-- locationHistory are processed into corridor intelligence,
-- spatial grid heatmaps, and lane performance metrics.
-- ═══════════════════════════════════════════════════════════════

-- 1. Route corridor intelligence — aggregated per origin/dest zone pair
CREATE TABLE IF NOT EXISTS hz_route_intelligence (
  id INT AUTO_INCREMENT PRIMARY KEY,
  origin_zone VARCHAR(64) NOT NULL,
  dest_zone VARCHAR(64) NOT NULL,
  corridor_name VARCHAR(255),
  avg_speed_mph DECIMAL(6,2) DEFAULT 0,
  avg_travel_time_mins DECIMAL(8,2) DEFAULT 0,
  avg_distance_miles DECIMAL(8,2) DEFAULT 0,
  trip_count INT DEFAULT 0,
  unique_drivers INT DEFAULT 0,
  congestion_score DECIMAL(5,2) DEFAULT 0 COMMENT '0=free flow, 100=gridlock',
  reliability_score DECIMAL(5,2) DEFAULT 0 COMMENT '0=unreliable, 100=very consistent',
  peak_hour_delay_pct DECIMAL(5,2) DEFAULT 0,
  avg_stops_per_trip DECIMAL(4,1) DEFAULT 0,
  hazmat_trip_count INT DEFAULT 0,
  last_trip_at DATETIME,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ri_origin (origin_zone),
  INDEX idx_ri_dest (dest_zone),
  INDEX idx_ri_corridor (origin_zone, dest_zone),
  INDEX idx_ri_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Spatial grid heat — 0.25-degree grid cells (~17mi) with driver density
CREATE TABLE IF NOT EXISTS hz_grid_heat (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grid_lat DECIMAL(6,2) NOT NULL COMMENT 'Grid cell center latitude (rounded to 0.25)',
  grid_lng DECIMAL(7,2) NOT NULL COMMENT 'Grid cell center longitude (rounded to 0.25)',
  period_start DATETIME NOT NULL,
  period_hours INT DEFAULT 1,
  ping_count INT DEFAULT 0,
  unique_drivers INT DEFAULT 0,
  avg_speed_mph DECIMAL(6,2) DEFAULT 0,
  moving_pct DECIMAL(5,2) DEFAULT 0 COMMENT 'Pct of pings where driver was moving',
  hazmat_pings INT DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_grid_period (grid_lat, grid_lng, period_start),
  INDEX idx_gh_period (period_start),
  INDEX idx_gh_density (ping_count DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Lane learning — per-lane real performance from completed trips
CREATE TABLE IF NOT EXISTS hz_lane_learning (
  id INT AUTO_INCREMENT PRIMARY KEY,
  origin_city VARCHAR(128) NOT NULL,
  origin_state CHAR(2) NOT NULL,
  dest_city VARCHAR(128) NOT NULL,
  dest_state CHAR(2) NOT NULL,
  equipment_type VARCHAR(32),
  is_hazmat TINYINT(1) DEFAULT 0,
  trip_count INT DEFAULT 0,
  avg_rate_per_mile DECIMAL(6,2),
  avg_total_rate DECIMAL(10,2),
  avg_distance_miles DECIMAL(8,2),
  avg_transit_hours DECIMAL(6,2),
  avg_fuel_cost DECIMAL(8,2),
  avg_deadhead_miles DECIMAL(6,2),
  on_time_pct DECIMAL(5,2),
  avg_dwell_mins_pickup DECIMAL(6,1),
  avg_dwell_mins_delivery DECIMAL(6,1),
  best_day_of_week TINYINT COMMENT '0=Sun..6=Sat',
  best_hour_depart TINYINT COMMENT '0-23',
  seasonal_peak VARCHAR(16) COMMENT 'Q1,Q2,Q3,Q4',
  last_trip_at DATETIME,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ll_lane (origin_state, dest_state),
  INDEX idx_ll_city (origin_city, dest_city),
  INDEX idx_ll_hazmat (is_hazmat),
  INDEX idx_ll_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Driver route submissions — completed trip reports for ML learning
CREATE TABLE IF NOT EXISTS hz_driver_route_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id INT NOT NULL,
  load_id INT,
  origin_lat DECIMAL(9,6) NOT NULL,
  origin_lng DECIMAL(10,6) NOT NULL,
  dest_lat DECIMAL(9,6) NOT NULL,
  dest_lng DECIMAL(10,6) NOT NULL,
  origin_city VARCHAR(128),
  origin_state CHAR(2),
  dest_city VARCHAR(128),
  dest_state CHAR(2),
  distance_miles DECIMAL(8,2),
  transit_minutes INT,
  avg_speed_mph DECIMAL(6,2),
  max_speed_mph DECIMAL(6,2),
  stop_count INT DEFAULT 0,
  fuel_stops INT DEFAULT 0,
  is_hazmat TINYINT(1) DEFAULT 0,
  equipment_type VARCHAR(32),
  weather_conditions VARCHAR(64),
  road_quality_score TINYINT COMMENT '1-5 driver rating',
  congestion_score TINYINT COMMENT '1-5 driver rating',
  route_polyline TEXT COMMENT 'Encoded polyline of actual route taken',
  started_at DATETIME NOT NULL,
  completed_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_drr_driver (driver_id),
  INDEX idx_drr_load (load_id),
  INDEX idx_drr_completed (completed_at),
  INDEX idx_drr_lane (origin_state, dest_state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
