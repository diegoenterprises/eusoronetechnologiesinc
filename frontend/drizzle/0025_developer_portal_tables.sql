-- Developer Portal: API Keys & Webhooks persistence
-- Migration 0025

CREATE TABLE IF NOT EXISTS `developer_api_keys` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `visibleId` VARCHAR(50) NOT NULL,
  `userId` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `keyHash` VARCHAR(255) NOT NULL,
  `keyPrefix` VARCHAR(12) NOT NULL,
  `keySuffix` VARCHAR(8) NOT NULL,
  `scopes` JSON NOT NULL,
  `status` ENUM('active', 'revoked', 'expired') NOT NULL DEFAULT 'active',
  `expiresAt` TIMESTAMP NULL,
  `lastUsedAt` TIMESTAMP NULL,
  `requestCount` INT NOT NULL DEFAULT 0,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX `dak_visible_idx` (`visibleId`),
  INDEX `dak_user_idx` (`userId`),
  INDEX `dak_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `developer_webhooks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `visibleId` VARCHAR(50) NOT NULL,
  `userId` INT NOT NULL,
  `url` VARCHAR(2048) NOT NULL,
  `events` JSON NOT NULL,
  `secretHash` VARCHAR(255) NULL,
  `status` ENUM('active', 'paused', 'disabled') NOT NULL DEFAULT 'active',
  `deliveryRate` INT DEFAULT 100,
  `lastDeliveryAt` TIMESTAMP NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX `dwh_visible_idx` (`visibleId`),
  INDEX `dwh_user_idx` (`userId`),
  INDEX `dwh_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
