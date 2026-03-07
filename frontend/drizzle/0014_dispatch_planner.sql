-- Migration 0014: Dispatch Planner — Drag-and-Drop Load Assignment (WS-DC-001)
-- Slots table for planning driver timelines with load assignments

CREATE TABLE IF NOT EXISTS `dispatch_planner_slots` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT NOT NULL,
  `date` DATE NOT NULL,
  `driverId` INT NOT NULL,
  `slotIndex` INT NOT NULL DEFAULT 0,
  `loadId` INT DEFAULT NULL,
  `status` ENUM('available','assigned','completed','cancelled') DEFAULT 'available',
  `assignedAt` TIMESTAMP NULL DEFAULT NULL,
  `assignedBy` INT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_slot` (`companyId`, `date`, `driverId`, `slotIndex`),
  INDEX `dps_company_date_idx` (`companyId`, `date`),
  INDEX `dps_driver_idx` (`driverId`, `date`),
  INDEX `dps_load_idx` (`loadId`),
  INDEX `dps_status_idx` (`status`)
);
