-- Migration 0019: FSC Engine (WS-DC-005)
-- Per-contract fuel surcharge calculation engine

CREATE TABLE IF NOT EXISTS `fsc_schedules` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT NOT NULL,
  `scheduleName` VARCHAR(255) NOT NULL,
  `basePrice` DECIMAL(10,4) DEFAULT NULL,
  `method` ENUM('cpm','percentage','table') NOT NULL,
  `cpmRate` DECIMAL(10,4) DEFAULT NULL,
  `percentageRate` DECIMAL(5,2) DEFAULT NULL,
  `paddRegion` ENUM('1A','1B','1C','2','3','4','5') NOT NULL,
  `fuelType` VARCHAR(50) DEFAULT 'diesel',
  `updateFrequency` VARCHAR(50) DEFAULT 'weekly',
  `lastPaddPrice` DECIMAL(10,4) DEFAULT NULL,
  `lastUpdateAt` TIMESTAMP NULL DEFAULT NULL,
  `isActive` TINYINT(1) DEFAULT 1,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `fsc_company_idx` (`companyId`),
  INDEX `fsc_active_idx` (`isActive`),
  INDEX `fsc_padd_idx` (`paddRegion`)
);

CREATE TABLE IF NOT EXISTS `fsc_lookup_table` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `scheduleId` INT NOT NULL,
  `fuelPriceMin` DECIMAL(10,4) NOT NULL,
  `fuelPriceMax` DECIMAL(10,4) NOT NULL,
  `surchargeAmount` DECIMAL(10,4) NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_schedule_range` (`scheduleId`, `fuelPriceMin`, `fuelPriceMax`),
  INDEX `flt_schedule_idx` (`scheduleId`)
);

CREATE TABLE IF NOT EXISTS `fsc_history` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `scheduleId` INT NOT NULL,
  `paddPrice` DECIMAL(10,4) NOT NULL,
  `calculatedFsc` DECIMAL(10,4) NOT NULL,
  `appliedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `fsh_schedule_idx` (`scheduleId`, `appliedAt`)
);
