-- GAP-003: Load Template System
-- Dedicated table for reusable load templates

CREATE TABLE IF NOT EXISTS `load_templates` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `ownerId` int NOT NULL,
  `companyId` int,
  `name` varchar(200) NOT NULL,
  `description` text,
  `origin` json,
  `destination` json,
  `distance` decimal(10,2),
  `commodity` varchar(200),
  `cargoType` varchar(50),
  `equipmentType` varchar(80),
  `trailerType` varchar(80),
  `weight` varchar(50),
  `weightUnit` varchar(20) DEFAULT 'lbs',
  `quantity` varchar(50),
  `quantityUnit` varchar(30),
  `hazmatClass` varchar(10),
  `unNumber` varchar(20),
  `packingGroup` varchar(5),
  `properShippingName` varchar(200),
  `rate` decimal(10,2),
  `rateType` enum('flat','per_mile','per_barrel','per_gallon','per_ton') DEFAULT 'flat',
  `stops` json,
  `equipmentRequirements` json,
  `preferredDays` json,
  `preferredPickupTime` varchar(10),
  `specialInstructions` text,
  `notes` text,
  `usageCount` int NOT NULL DEFAULT 0,
  `lastUsedAt` timestamp NULL,
  `isFavorite` boolean NOT NULL DEFAULT false,
  `isArchived` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX `lt_owner_idx` ON `load_templates` (`ownerId`);
CREATE INDEX `lt_company_idx` ON `load_templates` (`companyId`);
CREATE INDEX `lt_name_idx` ON `load_templates` (`name`);
CREATE INDEX `lt_favorite_idx` ON `load_templates` (`isFavorite`);
