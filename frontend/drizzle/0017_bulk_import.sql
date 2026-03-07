-- Migration 0017: Bulk Load Import (WS-DC-006)
-- CSV bulk import with multi-step validation and error recovery

CREATE TABLE IF NOT EXISTS `bulk_import_jobs` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT NOT NULL,
  `uploadedBy` INT NOT NULL,
  `fileName` VARCHAR(255) NOT NULL,
  `totalRows` INT NOT NULL DEFAULT 0,
  `successCount` INT DEFAULT 0,
  `failCount` INT DEFAULT 0,
  `status` ENUM('uploaded','validating','validated','importing','completed','failed') DEFAULT 'uploaded',
  `validationErrors` JSON DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completedAt` TIMESTAMP NULL DEFAULT NULL,
  INDEX `bij_company_idx` (`companyId`),
  INDEX `bij_status_idx` (`status`),
  INDEX `bij_uploaded_by_idx` (`uploadedBy`)
);

CREATE TABLE IF NOT EXISTS `bulk_import_rows` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `jobId` INT NOT NULL,
  `rowNumber` INT NOT NULL,
  `rawData` JSON NOT NULL,
  `loadId` INT DEFAULT NULL,
  `status` ENUM('pending','valid','invalid','created','failed') DEFAULT 'pending',
  `errors` JSON DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_job_row` (`jobId`, `rowNumber`),
  INDEX `bir_job_idx` (`jobId`),
  INDEX `bir_load_idx` (`loadId`),
  INDEX `bir_status_idx` (`status`)
);
