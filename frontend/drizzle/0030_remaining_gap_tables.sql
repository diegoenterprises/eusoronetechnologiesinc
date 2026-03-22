-- Migration 0030: Remaining gap tables + settlements schema drift fix
-- Creates 14 tables missing from DB that exist in schema.ts
-- Fixes 3 column mismatches in settlements table

-- ════════════════════════════════════════════════════════════════════════════
-- ADR COMPLIANCE (EU Hazmat)
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `adr_compliance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `loadId` INT,
  `companyId` INT,
  `adrClass` VARCHAR(10),
  `unNumber` VARCHAR(10),
  `packingGroup` ENUM('I','II','III'),
  `tunnelCode` VARCHAR(10),
  `transportCategory` VARCHAR(5),
  `specialProvisions` JSON,
  `hazardIdentificationNumber` VARCHAR(10),
  `properShippingName` VARCHAR(255),
  `technicalName` VARCHAR(255),
  `quantity` DECIMAL(12,2),
  `unit` VARCHAR(20),
  `packagingType` VARCHAR(50),
  `packagingApproval` VARCHAR(100),
  `labels` JSON,
  `placards` JSON,
  `driverTrainingExpiry` DATE,
  `vehicleApprovalExpiry` DATE,
  `status` ENUM('compliant','non_compliant','pending','expired') DEFAULT 'pending',
  `inspectedBy` INT,
  `inspectedAt` TIMESTAMP NULL,
  `notes` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `adr_driver_certifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `driverId` INT NOT NULL,
  `certificateType` ENUM('basic','tank','class1','class7','radioactive') NOT NULL,
  `certificateNumber` VARCHAR(100),
  `issuingCountry` VARCHAR(50),
  `issuingAuthority` VARCHAR(255),
  `issueDate` DATE,
  `expirationDate` DATE NOT NULL,
  `status` ENUM('active','expired','suspended','revoked') DEFAULT 'active',
  `refresherTrainingDate` DATE,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `adr_driver_idx` (`driverId`),
  INDEX `adr_expiry_idx` (`expirationDate`)
);

-- ════════════════════════════════════════════════════════════════════════════
-- IMDG COMPLIANCE (Maritime Hazmat)
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `imdg_compliance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `shipmentId` INT,
  `containerId` INT,
  `imdgClass` VARCHAR(10) NOT NULL,
  `unNumber` VARCHAR(10),
  `properShippingName` VARCHAR(255),
  `packingGroup` ENUM('I','II','III'),
  `marinePollutant` TINYINT DEFAULT 0,
  `flashPoint` DECIMAL(6,2),
  `emergencyScheduleNumber` VARCHAR(20),
  `segregationGroup` VARCHAR(10),
  `stowageCategory` VARCHAR(10),
  `stowageRequirements` JSON,
  `containerPackingCertificate` TINYINT DEFAULT 0,
  `dangerousGoodsDeclaration` TINYINT DEFAULT 0,
  `status` ENUM('compliant','non_compliant','pending') DEFAULT 'pending',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ════════════════════════════════════════════════════════════════════════════
-- AUTONOMOUS VEHICLES
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `autonomous_vehicles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vehicleId` INT,
  `autonomyLevel` ENUM('L0','L1','L2','L3','L4','L5') NOT NULL,
  `manufacturer` VARCHAR(255),
  `softwareVersion` VARCHAR(50),
  `sensorSuite` JSON,
  `operationalDesignDomain` JSON,
  `safetyDriverRequired` TINYINT DEFAULT 1,
  `safetyDriverId` INT,
  `remoteOperatorId` INT,
  `certifications` JSON,
  `insurancePolicy` VARCHAR(100),
  `regulatoryApprovals` JSON,
  `status` ENUM('testing','approved','operational','suspended','decommissioned') DEFAULT 'testing',
  `lastCalibrationDate` DATE,
  `nextCalibrationDue` DATE,
  `totalMilesAutonomous` DECIMAL(12,2) DEFAULT 0,
  `disengagementCount` INT DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `av_vehicle_idx` (`vehicleId`),
  INDEX `av_status_idx` (`status`)
);

CREATE TABLE IF NOT EXISTS `av_telemetry` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `autonomousVehicleId` INT NOT NULL,
  `timestamp` TIMESTAMP NOT NULL,
  `latitude` DECIMAL(10,7),
  `longitude` DECIMAL(10,7),
  `speed` DECIMAL(6,2),
  `heading` DECIMAL(5,2),
  `autonomyMode` ENUM('manual','assisted','autonomous','disengaged') NOT NULL,
  `sensorHealth` JSON,
  `obstaclesDetected` INT DEFAULT 0,
  `lanePosition` DECIMAL(4,2),
  `steeringAngle` DECIMAL(6,2),
  `brakeStatus` VARCHAR(20),
  `weatherConditions` VARCHAR(50),
  `roadType` VARCHAR(50),
  `eventType` VARCHAR(50),
  `eventData` JSON,
  INDEX `avt_vehicle_idx` (`autonomousVehicleId`),
  INDEX `avt_timestamp_idx` (`timestamp`)
);

-- ════════════════════════════════════════════════════════════════════════════
-- INNOVATION LAB / EXPERIMENTS (A/B Testing)
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `experiments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `hypothesis` TEXT,
  `feature` VARCHAR(100),
  `status` ENUM('draft','running','paused','completed','archived') DEFAULT 'draft',
  `startDate` TIMESTAMP NULL,
  `endDate` TIMESTAMP NULL,
  `targetSampleSize` INT DEFAULT 1000,
  `currentSampleSize` INT DEFAULT 0,
  `variants` JSON,
  `targetAudience` JSON,
  `primaryMetric` VARCHAR(100),
  `secondaryMetrics` JSON,
  `createdBy` INT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `exp_status_idx` (`status`),
  INDEX `exp_feature_idx` (`feature`)
);

CREATE TABLE IF NOT EXISTS `variant_assignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `experimentId` INT NOT NULL,
  `userId` INT NOT NULL,
  `variantId` VARCHAR(50) NOT NULL,
  `assignedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `ua_unique` (`experimentId`, `userId`),
  INDEX `va_experiment_idx` (`experimentId`),
  INDEX `va_user_idx` (`userId`)
);

CREATE TABLE IF NOT EXISTS `metric_events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `experimentId` INT NOT NULL,
  `userId` INT NOT NULL,
  `variantId` VARCHAR(50) NOT NULL,
  `metricName` VARCHAR(100) NOT NULL,
  `metricValue` DECIMAL(12,4),
  `metadata` JSON,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `me_experiment_idx` (`experimentId`),
  INDEX `me_metric_idx` (`metricName`)
);

CREATE TABLE IF NOT EXISTS `experiment_results` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `experimentId` INT NOT NULL,
  `variantId` VARCHAR(50) NOT NULL,
  `metricName` VARCHAR(100) NOT NULL,
  `sampleSize` INT DEFAULT 0,
  `mean` DECIMAL(12,4),
  `standardDeviation` DECIMAL(12,4),
  `confidenceInterval` JSON,
  `pValue` DECIMAL(8,6),
  `isSignificant` TINYINT DEFAULT 0,
  `calculatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `er_experiment_idx` (`experimentId`)
);

-- ════════════════════════════════════════════════════════════════════════════
-- PAAS / WHITE-LABEL TENANTS
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `tenants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `domain` VARCHAR(255),
  `status` ENUM('active','suspended','trial','cancelled') DEFAULT 'trial',
  `plan` ENUM('starter','professional','enterprise','custom') DEFAULT 'starter',
  `ownerId` INT,
  `settings` JSON,
  `features` JSON,
  `maxUsers` INT DEFAULT 50,
  `maxLoads` INT DEFAULT 1000,
  `apiKeyHash` VARCHAR(255),
  `webhookUrl` VARCHAR(500),
  `billingEmail` VARCHAR(320),
  `stripeSubscriptionId` VARCHAR(255),
  `trialEndsAt` TIMESTAMP NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `tenant_slug_idx` (`slug`),
  INDEX `tenant_status_idx` (`status`)
);

CREATE TABLE IF NOT EXISTS `tenant_data_isolation` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenantId` INT NOT NULL,
  `tableName` VARCHAR(100) NOT NULL,
  `rowId` INT NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `tdi_unique` (`tenantId`, `tableName`, `rowId`),
  INDEX `tdi_tenant_idx` (`tenantId`)
);

CREATE TABLE IF NOT EXISTS `tenant_branding` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tenantId` INT NOT NULL UNIQUE,
  `logoUrl` VARCHAR(500),
  `faviconUrl` VARCHAR(500),
  `primaryColor` VARCHAR(7) DEFAULT '#1473FF',
  `secondaryColor` VARCHAR(7) DEFAULT '#BE01FF',
  `companyName` VARCHAR(255),
  `tagline` VARCHAR(255),
  `supportEmail` VARCHAR(320),
  `supportPhone` VARCHAR(20),
  `termsUrl` VARCHAR(500),
  `privacyUrl` VARCHAR(500),
  `customCss` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ════════════════════════════════════════════════════════════════════════════
-- BLOCKCHAIN AUDIT TRAIL (if not already created)
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `blockchain_audit_trail` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `loadId` INT NOT NULL,
  `eventType` VARCHAR(100) NOT NULL,
  `eventData` JSON NOT NULL,
  `blockHash` VARCHAR(256),
  `previousBlockHash` VARCHAR(256),
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `bat_load_idx` (`loadId`),
  INDEX `bat_event_idx` (`eventType`),
  INDEX `bat_time_idx` (`timestamp`)
);

-- ════════════════════════════════════════════════════════════════════════════
-- SETTLEMENTS SCHEMA DRIFT FIX
-- Add 3 columns that schema.ts defines but the real table is missing
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE `settlements` ADD COLUMN IF NOT EXISTS `accessorialCharges` DECIMAL(10,2) DEFAULT 0;
ALTER TABLE `settlements` ADD COLUMN IF NOT EXISTS `stripeTransferId` VARCHAR(255);
ALTER TABLE `settlements` ADD COLUMN IF NOT EXISTS `settledAt` TIMESTAMP NULL;
