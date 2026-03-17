-- Lobby Moderation Log & Strike System
-- Tracks violations, strikes, and mutes for The Haul Lobby
-- Enforces ToS §4 (Anti-Circumvention) and §6 (User Conduct)

CREATE TABLE IF NOT EXISTS `haul_lobby_moderation_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `userName` VARCHAR(255),
  `userRole` VARCHAR(50),
  `originalMessage` TEXT NOT NULL,
  `violationType` ENUM('CIRCUMVENTION', 'PII_LEAK', 'PROFANITY', 'HARASSMENT', 'SOLICITATION', 'FLOODING') NOT NULL,
  `severity` ENUM('WARNING', 'BLOCK', 'STRIKE', 'SUSPEND') NOT NULL,
  `reason` TEXT,
  `tosReference` VARCHAR(100),
  `actionTaken` ENUM('blocked', 'warned', 'muted_1h', 'muted_24h', 'banned') NOT NULL DEFAULT 'blocked',
  `reviewedByAdmin` BOOLEAN NOT NULL DEFAULT FALSE,
  `adminNotes` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_mod_user` (`userId`),
  INDEX `idx_mod_type` (`violationType`),
  INDEX `idx_mod_severity` (`severity`),
  INDEX `idx_mod_reviewed` (`reviewedByAdmin`),
  INDEX `idx_mod_created` (`createdAt`)
);

CREATE TABLE IF NOT EXISTS `haul_lobby_user_strikes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL UNIQUE,
  `strikeCount` INT NOT NULL DEFAULT 0,
  `lastViolationType` VARCHAR(50),
  `mutedUntil` TIMESTAMP NULL,
  `isBanned` BOOLEAN NOT NULL DEFAULT FALSE,
  `lastStrikeAt` TIMESTAMP NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_strikes_user` (`userId`),
  INDEX `idx_strikes_muted` (`mutedUntil`),
  INDEX `idx_strikes_banned` (`isBanned`)
);
