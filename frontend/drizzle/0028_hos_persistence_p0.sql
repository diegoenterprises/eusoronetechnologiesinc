-- ═══════════════════════════════════════════════════════════════════
-- P0 MIGRATION: HOS Persistence + Auth Enrichment + FSMA + Bridge
-- Addresses 6 P0 blockers from 25-agent audit
-- ═══════════════════════════════════════════════════════════════════

-- 1. HOS STATE — persisted driver HOS state (survives restarts)
CREATE TABLE IF NOT EXISTS hos_state (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  status ENUM('off_duty','sleeper','driving','on_duty') NOT NULL DEFAULT 'off_duty',
  statusStartedAt TIMESTAMP NOT NULL DEFAULT NOW(),
  drivingMinutesToday INT NOT NULL DEFAULT 0,
  onDutyMinutesToday INT NOT NULL DEFAULT 0,
  drivingMinutesSinceReset INT NOT NULL DEFAULT 0,
  onDutyMinutesSinceReset INT NOT NULL DEFAULT 0,
  cycleMinutesUsed INT NOT NULL DEFAULT 0,
  cycleDays INT NOT NULL DEFAULT 8,
  drivingMinutesSinceBreak INT NOT NULL DEFAULT 0,
  lastBreakAt TIMESTAMP NULL,
  lastOffDutyAt TIMESTAMP NULL,
  violations JSON,
  todayLog JSON,
  timezone VARCHAR(64) DEFAULT 'America/Chicago',
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  UNIQUE KEY hos_state_user_unique (userId),
  INDEX hos_state_status_idx (status),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. HOS AUDIT LOG — immutable audit trail per 49 CFR 395.8
CREATE TABLE IF NOT EXISTS hos_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  eventType ENUM('status_change','violation','break_start','break_end','reset','cycle_restart','edit','annotation') NOT NULL,
  fromStatus ENUM('off_duty','sleeper','driving','on_duty') NULL,
  toStatus ENUM('off_duty','sleeper','driving','on_duty') NULL,
  location VARCHAR(255),
  locationLat DECIMAL(10,6),
  locationLng DECIMAL(10,6),
  odometer DECIMAL(10,1),
  engineHours DECIMAL(10,1),
  vehicleId INT,
  loadId INT,
  annotation TEXT,
  source ENUM('driver','auto','eld','system','edit') NOT NULL DEFAULT 'driver',
  violationType VARCHAR(50),
  violationCfr VARCHAR(50),
  drivingMinutesAtEvent INT,
  onDutyMinutesAtEvent INT,
  cycleMinutesAtEvent INT,
  timezone VARCHAR(64) DEFAULT 'America/Chicago',
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX hos_logs_user_idx (userId),
  INDEX hos_logs_created_idx (createdAt),
  INDEX hos_logs_type_idx (eventType),
  INDEX hos_logs_user_date_idx (userId, createdAt),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. FSMA TEMPERATURE LOGS — 21 CFR 1.908 food safety
CREATE TABLE IF NOT EXISTS fsma_temp_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loadId INT NOT NULL,
  recordedBy INT,
  temperature DECIMAL(6,2) NOT NULL,
  unit ENUM('F','C') NOT NULL DEFAULT 'F',
  location VARCHAR(255),
  eventType ENUM('pickup','in_transit','delivery','excursion','alarm','manual') NOT NULL,
  isExcursion BOOLEAN NOT NULL DEFAULT FALSE,
  minTemp DECIMAL(6,2),
  maxTemp DECIMAL(6,2),
  setPoint DECIMAL(6,2),
  notes TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX fsma_load_idx (loadId),
  INDEX fsma_excursion_idx (isExcursion),
  FOREIGN KEY (loadId) REFERENCES loads(id) ON DELETE CASCADE
);

-- 4. BRIDGE CLEARANCE CHECKS — oversized load validation
CREATE TABLE IF NOT EXISTS bridge_clearance_checks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loadId INT NOT NULL,
  routeId INT,
  bridgeId VARCHAR(20),
  bridgeName VARCHAR(255),
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),
  postedClearanceFt DECIMAL(6,2),
  vehicleHeightFt DECIMAL(6,2),
  marginFt DECIMAL(6,2),
  status ENUM('clear','warning','blocked','override') NOT NULL,
  checkedAt TIMESTAMP NOT NULL DEFAULT NOW(),
  overrideBy INT,
  overrideReason TEXT,
  INDEX bridge_load_idx (loadId),
  INDEX bridge_status_idx (status),
  FOREIGN KEY (loadId) REFERENCES loads(id) ON DELETE CASCADE
);

-- 5. MFA TOKENS — TOTP 2FA support
CREATE TABLE IF NOT EXISTS mfa_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  secret VARCHAR(128) NOT NULL,
  method ENUM('totp','sms','email') NOT NULL DEFAULT 'totp',
  isEnabled BOOLEAN NOT NULL DEFAULT FALSE,
  backupCodes JSON,
  lastUsedAt TIMESTAMP NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE KEY mfa_user_method (userId, method),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Add timezone column to users table if not exists
-- (Users can set via preferences, but we need it directly accessible)
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(64) DEFAULT 'America/Chicago';
