-- GAP-002: Multi-Stop Load Support
-- Creates the load_stops table for ordered stops per load

CREATE TABLE IF NOT EXISTS `load_stops` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `loadId` int NOT NULL,
  `sequence` int NOT NULL,
  `stopType` enum('pickup','delivery','fuel','rest','scale','inspection','crossdock','relay','customs') NOT NULL,
  `facilityName` varchar(255),
  `address` varchar(500),
  `city` varchar(100),
  `state` varchar(50),
  `zipCode` varchar(20),
  `lat` decimal(10,8),
  `lng` decimal(11,8),
  `contactName` varchar(200),
  `contactPhone` varchar(30),
  `appointmentStart` timestamp NULL,
  `appointmentEnd` timestamp NULL,
  `arrivedAt` timestamp NULL,
  `departedAt` timestamp NULL,
  `status` enum('pending','en_route','arrived','loading','unloading','completed','skipped') NOT NULL DEFAULT 'pending',
  `notes` text,
  `referenceNumber` varchar(100),
  `estimatedWeight` decimal(10,2),
  `actualWeight` decimal(10,2),
  `dwellMinutes` int,
  `distanceFromPrev` decimal(10,2),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `load_stops_load_idx` (`loadId`),
  INDEX `load_stops_seq_idx` (`loadId`, `sequence`)
);
