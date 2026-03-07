-- Migration 0018: Pricebook (WS-DC-004)
-- Flexible rate sheets with cascading lookup priority

CREATE TABLE IF NOT EXISTS `pricebook_entries` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT NOT NULL,
  `entryName` VARCHAR(255) NOT NULL,
  `originCity` VARCHAR(100) DEFAULT NULL,
  `originState` VARCHAR(2) DEFAULT NULL,
  `originTerminalId` INT DEFAULT NULL,
  `destinationCity` VARCHAR(100) DEFAULT NULL,
  `destinationState` VARCHAR(2) DEFAULT NULL,
  `destinationTerminalId` INT DEFAULT NULL,
  `cargoType` VARCHAR(100) DEFAULT NULL,
  `hazmatClass` VARCHAR(50) DEFAULT NULL,
  `rateType` ENUM('per_mile','flat','per_barrel','per_gallon','per_ton') NOT NULL,
  `rate` DECIMAL(12,4) NOT NULL,
  `fscIncluded` TINYINT(1) DEFAULT 0,
  `fscMethod` VARCHAR(50) DEFAULT NULL,
  `fscValue` DECIMAL(10,4) DEFAULT NULL,
  `minimumCharge` DECIMAL(12,2) DEFAULT NULL,
  `customerCompanyId` INT DEFAULT NULL,
  `effectiveDate` DATE NOT NULL,
  `expirationDate` DATE DEFAULT NULL,
  `isActive` TINYINT(1) DEFAULT 1,
  `createdBy` INT NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `pbe_company_idx` (`companyId`),
  INDEX `pbe_origin_terminal_idx` (`originTerminalId`),
  INDEX `pbe_dest_terminal_idx` (`destinationTerminalId`),
  INDEX `pbe_customer_idx` (`customerCompanyId`),
  INDEX `pbe_active_idx` (`isActive`, `effectiveDate`),
  INDEX `pbe_lookup_idx` (`companyId`, `originTerminalId`, `destinationTerminalId`, `cargoType`, `isActive`)
);

CREATE TABLE IF NOT EXISTS `pricebook_history` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `pricebookEntryId` INT NOT NULL,
  `previousRate` DECIMAL(12,4) DEFAULT NULL,
  `newRate` DECIMAL(12,4) DEFAULT NULL,
  `changedBy` INT NOT NULL,
  `changedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `pbh_entry_idx` (`pricebookEntryId`),
  INDEX `pbh_date_idx` (`changedAt`)
);
