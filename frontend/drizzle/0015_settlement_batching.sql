-- Migration 0015: 3-Level Settlement Batching (WS-DC-003)
-- Batch grouping for shipper payables, carrier receivables, driver payables

CREATE TABLE IF NOT EXISTS `settlement_batches` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `batchNumber` VARCHAR(50) NOT NULL UNIQUE,
  `companyId` INT NOT NULL,
  `batchType` ENUM('shipper_payable','carrier_receivable','driver_payable') NOT NULL,
  `periodStart` DATE NOT NULL,
  `periodEnd` DATE NOT NULL,
  `status` ENUM('draft','pending_approval','approved','processing','paid','failed','disputed') DEFAULT 'draft',
  `totalLoads` INT DEFAULT 0,
  `subtotalAmount` DECIMAL(12,2) DEFAULT 0.00,
  `fscAmount` DECIMAL(12,2) DEFAULT 0.00,
  `accessorialAmount` DECIMAL(12,2) DEFAULT 0.00,
  `deductionAmount` DECIMAL(12,2) DEFAULT 0.00,
  `totalAmount` DECIMAL(12,2) DEFAULT 0.00,
  `approvedBy` INT DEFAULT NULL,
  `approvedAt` TIMESTAMP NULL DEFAULT NULL,
  `paidAt` TIMESTAMP NULL DEFAULT NULL,
  `stripePaymentId` VARCHAR(255) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `sb_company_idx` (`companyId`),
  INDEX `sb_status_idx` (`status`),
  INDEX `sb_period_idx` (`periodStart`, `periodEnd`),
  INDEX `sb_type_idx` (`batchType`),
  INDEX `sb_batch_number_idx` (`batchNumber`)
);

CREATE TABLE IF NOT EXISTS `settlement_batch_items` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `batchId` INT NOT NULL,
  `settlementId` INT NOT NULL,
  `loadId` INT NOT NULL,
  `loadNumber` VARCHAR(50) DEFAULT NULL,
  `pickupDate` DATE DEFAULT NULL,
  `deliveryDate` DATE DEFAULT NULL,
  `lineAmount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `fscAmount` DECIMAL(12,2) DEFAULT 0.00,
  `accessorialAmount` DECIMAL(12,2) DEFAULT 0.00,
  `deductions` DECIMAL(12,2) DEFAULT 0.00,
  `netAmount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_batch_settlement` (`batchId`, `settlementId`),
  INDEX `sbi_batch_idx` (`batchId`),
  INDEX `sbi_settlement_idx` (`settlementId`),
  INDEX `sbi_load_idx` (`loadId`)
);
