-- Migration 0016: Allocation Tracker (WS-DC-002)
-- Daily barrel allocation tracking for contract fulfillment

CREATE TABLE IF NOT EXISTS `allocation_contracts` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT NOT NULL,
  `shipperId` INT NOT NULL,
  `contractName` VARCHAR(255) NOT NULL,
  `buyerName` VARCHAR(255) DEFAULT NULL,
  `originTerminalId` INT NOT NULL,
  `destinationTerminalId` INT NOT NULL,
  `product` VARCHAR(100) NOT NULL,
  `dailyNominationBbl` DECIMAL(10,2) NOT NULL,
  `effectiveDate` DATE NOT NULL,
  `expirationDate` DATE NOT NULL,
  `ratePerBbl` DECIMAL(10,4) DEFAULT NULL,
  `status` ENUM('active','paused','expired','cancelled') DEFAULT 'active',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `ac_company_idx` (`companyId`),
  INDEX `ac_shipper_idx` (`shipperId`),
  INDEX `ac_terminal_idx` (`originTerminalId`, `destinationTerminalId`),
  INDEX `ac_status_idx` (`status`),
  INDEX `ac_dates_idx` (`effectiveDate`, `expirationDate`)
);

CREATE TABLE IF NOT EXISTS `allocation_daily_tracking` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `allocationContractId` INT NOT NULL,
  `trackingDate` DATE NOT NULL,
  `nominatedBbl` DECIMAL(10,2) NOT NULL,
  `loadedBbl` DECIMAL(10,2) DEFAULT 0.00,
  `deliveredBbl` DECIMAL(10,2) DEFAULT 0.00,
  `loadsCreated` INT DEFAULT 0,
  `loadsCompleted` INT DEFAULT 0,
  `status` ENUM('pending','on_track','behind','ahead','completed') DEFAULT 'pending',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_contract_date` (`allocationContractId`, `trackingDate`),
  INDEX `adt_contract_date_idx` (`allocationContractId`, `trackingDate`),
  INDEX `adt_date_idx` (`trackingDate`),
  INDEX `adt_status_idx` (`status`)
);
