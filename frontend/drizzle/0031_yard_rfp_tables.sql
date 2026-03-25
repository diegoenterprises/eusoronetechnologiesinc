-- 0031: Create yard management + RFP tables for full dynamic data

-- YARD SPOTS
CREATE TABLE IF NOT EXISTS `yard_spots` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `companyId` int NOT NULL,
  `locationId` varchar(50) NOT NULL,
  `row` int NOT NULL,
  `col` int NOT NULL,
  `label` varchar(20) NOT NULL,
  `type` enum('parking','dock','staging','repair'),
  `status` enum('empty','occupied','reserved','maintenance') DEFAULT 'empty',
  `trailerId` int,
  `trailerNumber` varchar(50),
  `reservedFor` varchar(100),
  `notes` text,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `yard_spots_company_idx` (`companyId`),
  INDEX `yard_spots_location_idx` (`locationId`),
  INDEX `yard_spots_status_idx` (`status`),
  FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`),
  FOREIGN KEY (`trailerId`) REFERENCES `vehicles`(`id`)
);

-- YARD MOVES
CREATE TABLE IF NOT EXISTS `yard_moves` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `companyId` int NOT NULL,
  `locationId` varchar(50) NOT NULL,
  `trailerId` int,
  `trailerNumber` varchar(50) NOT NULL,
  `fromSpot` varchar(20) NOT NULL,
  `toSpot` varchar(20) NOT NULL,
  `status` enum('pending','assigned','in_progress','completed','cancelled') DEFAULT 'pending',
  `priority` enum('low','normal','high','urgent') DEFAULT 'normal',
  `reason` enum('dock_assignment','reposition','outbound_staging','repair_move','gate_staging'),
  `hostlerId` int,
  `hostlerName` varchar(100),
  `estimatedMinutes` int,
  `requestedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `assignedAt` timestamp NULL,
  `startedAt` timestamp NULL,
  `completedAt` timestamp NULL,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `yard_moves_company_idx` (`companyId`),
  INDEX `yard_moves_location_idx` (`locationId`),
  INDEX `yard_moves_status_idx` (`status`),
  INDEX `yard_moves_hostler_idx` (`hostlerId`),
  FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`),
  FOREIGN KEY (`trailerId`) REFERENCES `vehicles`(`id`)
);

-- CHASSIS INVENTORY
CREATE TABLE IF NOT EXISTS `chassis_inventory` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `companyId` int NOT NULL,
  `chassisNumber` varchar(30) NOT NULL,
  `type` varchar(20) NOT NULL,
  `status` enum('available','in_use','maintenance','out_of_service') DEFAULT 'available',
  `owner` varchar(100),
  `containerId` int,
  `locationId` varchar(50),
  `condition` enum('good','needs_repair','damaged') DEFAULT 'good',
  `lastInspection` timestamp NULL,
  `tireCondition` enum('good','worn','replace') DEFAULT 'good',
  `lightStatus` enum('operational','partial','non_operational') DEFAULT 'operational',
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `chassis_inv_company_idx` (`companyId`),
  INDEX `chassis_inv_number_idx` (`chassisNumber`),
  INDEX `chassis_inv_status_idx` (`status`),
  FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`)
);

-- CONTAINERS
CREATE TABLE IF NOT EXISTS `containers` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `companyId` int NOT NULL,
  `containerNumber` varchar(20) NOT NULL,
  `size` enum('20ft','40ft','45ft','53ft'),
  `type` enum('standard','high_cube','reefer','open_top','flat_rack','tank'),
  `status` enum('on_chassis','grounded','loaded','empty','in_transit','at_port') DEFAULT 'empty',
  `chassisId` int,
  `locationId` varchar(50),
  `spotId` varchar(20),
  `steamshipLine` varchar(100),
  `bookingNumber` varchar(50),
  `sealNumber` varchar(50),
  `weight` int,
  `lastFreeDay` timestamp NULL,
  `demurrageRate` decimal(10,2),
  `arrivalTime` timestamp NULL,
  `departureTime` timestamp NULL,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `containers_company_idx` (`companyId`),
  INDEX `containers_number_idx` (`containerNumber`),
  INDEX `containers_status_idx` (`status`),
  INDEX `containers_steamship_idx` (`steamshipLine`),
  FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`),
  FOREIGN KEY (`chassisId`) REFERENCES `chassis_inventory`(`id`)
);

-- CROSS DOCK OPERATIONS
CREATE TABLE IF NOT EXISTS `cross_dock_operations` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `companyId` int NOT NULL,
  `locationId` varchar(50) NOT NULL,
  `status` enum('planned','in_progress','completed','cancelled') DEFAULT 'planned',
  `inboundDock` varchar(20),
  `outboundDock` varchar(20),
  `inboundTrailerId` int,
  `inboundTrailerNumber` varchar(50),
  `outboundTrailerId` int,
  `outboundTrailerNumber` varchar(50),
  `inboundCarrier` varchar(100),
  `outboundCarrier` varchar(100),
  `palletCount` int DEFAULT 0,
  `palletsTransferred` int DEFAULT 0,
  `priority` enum('low','normal','high','urgent') DEFAULT 'normal',
  `scheduledStart` timestamp NULL,
  `startedAt` timestamp NULL,
  `completedAt` timestamp NULL,
  `estimatedCompletion` timestamp NULL,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `xdock_company_idx` (`companyId`),
  INDEX `xdock_location_idx` (`locationId`),
  INDEX `xdock_status_idx` (`status`),
  FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`),
  FOREIGN KEY (`inboundTrailerId`) REFERENCES `vehicles`(`id`),
  FOREIGN KEY (`outboundTrailerId`) REFERENCES `vehicles`(`id`)
);

-- WAREHOUSE INVENTORY
CREATE TABLE IF NOT EXISTS `warehouse_inventory` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `companyId` int NOT NULL,
  `locationId` varchar(50) NOT NULL,
  `sku` varchar(30) NOT NULL,
  `name` varchar(200) NOT NULL,
  `category` varchar(50),
  `quantity` int DEFAULT 0,
  `unit` varchar(20) DEFAULT 'each',
  `warehouseLocation` varchar(50),
  `minLevel` int DEFAULT 0,
  `maxLevel` int DEFAULT 1000,
  `lastReceivedAt` timestamp NULL,
  `lastShippedAt` timestamp NULL,
  `unitValue` decimal(10,2),
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `wh_inv_company_idx` (`companyId`),
  INDEX `wh_inv_location_idx` (`locationId`),
  INDEX `wh_inv_sku_idx` (`sku`),
  INDEX `wh_inv_category_idx` (`category`),
  FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`)
);

-- RFPs
CREATE TABLE IF NOT EXISTS `rfps` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `companyId` int NOT NULL,
  `title` varchar(300) NOT NULL,
  `description` text,
  `status` enum('draft','published','in_review','awarded','closed','cancelled') DEFAULT 'draft',
  `responseDeadline` timestamp NULL,
  `contractStartDate` varchar(20),
  `contractEndDate` varchar(20),
  `carrierRequirements` json,
  `scoringWeights` json,
  `distributedTo` int DEFAULT 0,
  `responsesReceived` int DEFAULT 0,
  `notes` text,
  `publishedAt` timestamp NULL,
  `awardDate` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `rfps_company_idx` (`companyId`),
  INDEX `rfps_status_idx` (`status`),
  FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`)
);

-- RFP LANES
CREATE TABLE IF NOT EXISTS `rfp_lanes` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `rfpId` int NOT NULL,
  `originCity` varchar(100) NOT NULL,
  `originState` varchar(10) NOT NULL,
  `destinationCity` varchar(100) NOT NULL,
  `destinationState` varchar(10) NOT NULL,
  `estimatedDistance` int,
  `annualVolume` int,
  `volumeUnit` enum('loads','tons','gallons') DEFAULT 'loads',
  `equipmentRequired` varchar(50),
  `hazmat` boolean DEFAULT false,
  `temperatureControlled` boolean DEFAULT false,
  `targetRate` decimal(10,2),
  `rateType` enum('flat','per_mile') DEFAULT 'flat',
  `frequencyPerWeek` int DEFAULT 1,
  `specialRequirements` json,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `rfp_lanes_rfp_idx` (`rfpId`),
  FOREIGN KEY (`rfpId`) REFERENCES `rfps`(`id`)
);

-- RFP BIDS
CREATE TABLE IF NOT EXISTS `rfp_bids` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `rfpId` int NOT NULL,
  `carrierId` int NOT NULL,
  `carrierTier` varchar(20),
  `status` enum('pending','submitted','shortlisted','awarded','rejected','declined') DEFAULT 'pending',
  `overallScore` decimal(5,2),
  `safetyScore` decimal(5,2),
  `onTimeRate` decimal(5,2),
  `insuranceCoverage` decimal(12,2),
  `fleetSize` int,
  `submittedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `rfp_bids_rfp_idx` (`rfpId`),
  INDEX `rfp_bids_carrier_idx` (`carrierId`),
  INDEX `rfp_bids_status_idx` (`status`),
  FOREIGN KEY (`rfpId`) REFERENCES `rfps`(`id`),
  FOREIGN KEY (`carrierId`) REFERENCES `companies`(`id`)
);

-- RFP LANE BIDS
CREATE TABLE IF NOT EXISTS `rfp_lane_bids` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `bidId` int NOT NULL,
  `laneId` int NOT NULL,
  `bidRate` decimal(10,2) NOT NULL,
  `rateType` enum('flat','per_mile') DEFAULT 'flat',
  `transitDays` int,
  `capacityPerWeek` int,
  `equipmentOffered` varchar(50),
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `rfp_lane_bids_bid_idx` (`bidId`),
  INDEX `rfp_lane_bids_lane_idx` (`laneId`),
  FOREIGN KEY (`bidId`) REFERENCES `rfp_bids`(`id`),
  FOREIGN KEY (`laneId`) REFERENCES `rfp_lanes`(`id`)
);

-- RFP COUNTER OFFERS
CREATE TABLE IF NOT EXISTS `rfp_counter_offers` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `rfpId` int NOT NULL,
  `laneId` int NOT NULL,
  `carrierId` int NOT NULL,
  `originalRate` decimal(10,2),
  `counterRate` decimal(10,2),
  `message` text,
  `status` enum('pending','accepted','rejected','expired') DEFAULT 'pending',
  `carrierResponse` text,
  `respondedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `rfp_co_rfp_idx` (`rfpId`),
  INDEX `rfp_co_carrier_idx` (`carrierId`),
  INDEX `rfp_co_status_idx` (`status`),
  FOREIGN KEY (`rfpId`) REFERENCES `rfps`(`id`),
  FOREIGN KEY (`laneId`) REFERENCES `rfp_lanes`(`id`),
  FOREIGN KEY (`carrierId`) REFERENCES `companies`(`id`)
);

-- RFP AWARDS
CREATE TABLE IF NOT EXISTS `rfp_awards` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `rfpId` int NOT NULL,
  `laneId` int NOT NULL,
  `carrierId` int NOT NULL,
  `awardedRate` decimal(10,2) NOT NULL,
  `rateType` enum('flat','per_mile') DEFAULT 'flat',
  `savingsVsTarget` decimal(10,2),
  `savingsVsAvgBid` decimal(10,2),
  `annualValue` decimal(14,2),
  `status` enum('pending_review','shortlisted','counter_offered','awarded','rejected','declined_by_carrier') DEFAULT 'pending_review',
  `notes` text,
  `awardedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `rfp_awards_rfp_idx` (`rfpId`),
  INDEX `rfp_awards_lane_idx` (`laneId`),
  INDEX `rfp_awards_carrier_idx` (`carrierId`),
  INDEX `rfp_awards_status_idx` (`status`),
  FOREIGN KEY (`rfpId`) REFERENCES `rfps`(`id`),
  FOREIGN KEY (`laneId`) REFERENCES `rfp_lanes`(`id`),
  FOREIGN KEY (`carrierId`) REFERENCES `companies`(`id`)
);
