-- Migration 0020: Customer Portal (WS-DC-007)
-- Read-only customer portal with token-based access

CREATE TABLE IF NOT EXISTS `portal_access_tokens` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT NOT NULL,
  `issuedBy` INT NOT NULL,
  `customerName` VARCHAR(255) NOT NULL,
  `customerEmail` VARCHAR(255) DEFAULT NULL,
  `accessToken` VARCHAR(64) NOT NULL,
  `permissions` JSON DEFAULT NULL,
  `expiresAt` TIMESTAMP NOT NULL,
  `lastAccessAt` TIMESTAMP NULL DEFAULT NULL,
  `isActive` TINYINT(1) DEFAULT 1,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_access_token` (`accessToken`),
  INDEX `pat_company_idx` (`companyId`),
  INDEX `pat_active_idx` (`isActive`, `expiresAt`)
);

CREATE TABLE IF NOT EXISTS `portal_load_links` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `portalTokenId` INT NOT NULL,
  `loadId` INT NOT NULL,
  `linkedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_token_load` (`portalTokenId`, `loadId`),
  INDEX `pll_token_idx` (`portalTokenId`),
  INDEX `pll_load_idx` (`loadId`)
);

CREATE TABLE IF NOT EXISTS `portal_audit_log` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `portalTokenId` INT NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `resourceType` VARCHAR(100) DEFAULT NULL,
  `resourceId` INT DEFAULT NULL,
  `accessedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `pal_token_idx` (`portalTokenId`),
  INDEX `pal_date_idx` (`accessedAt`)
);
