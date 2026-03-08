-- GAP-128: Multi-Driver Load Handoff (Relay Mode)
-- Creates the load_relay_legs table for splitting loads into sequential driver segments

CREATE TABLE IF NOT EXISTS `load_relay_legs` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `loadId` int NOT NULL,
  `legNumber` int NOT NULL,
  `driverId` int NULL,
  `vehicleId` int NULL,
  `status` enum('planned','driver_assigned','en_route','at_handoff','handed_off','completed','cancelled') NOT NULL DEFAULT 'planned',
  `originFacility` varchar(255) NULL,
  `originAddress` varchar(500) NULL,
  `originCity` varchar(100) NULL,
  `originState` varchar(50) NULL,
  `originLat` decimal(10,8) NULL,
  `originLng` decimal(11,8) NULL,
  `destFacility` varchar(255) NULL,
  `destAddress` varchar(500) NULL,
  `destCity` varchar(100) NULL,
  `destState` varchar(50) NULL,
  `destLat` decimal(10,8) NULL,
  `destLng` decimal(11,8) NULL,
  `plannedStartAt` timestamp NULL,
  `plannedEndAt` timestamp NULL,
  `actualStartAt` timestamp NULL,
  `actualEndAt` timestamp NULL,
  `handoffType` enum('drop_and_hook','live_transfer','yard_relay','terminal_swap') DEFAULT 'drop_and_hook',
  `handoffNotes` text NULL,
  `handoffConfirmedByDriverId` int NULL,
  `handoffConfirmedAt` timestamp NULL,
  `legDistance` decimal(10,2) NULL,
  `legRate` decimal(10,2) NULL,
  `sealNumber` varchar(50) NULL,
  `sealVerified` boolean DEFAULT false,
  `notes` text NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX `relay_legs_load_idx` ON `load_relay_legs` (`loadId`);
CREATE INDEX `relay_legs_leg_idx` ON `load_relay_legs` (`loadId`, `legNumber`);
CREATE INDEX `relay_legs_driver_idx` ON `load_relay_legs` (`driverId`);
CREATE INDEX `relay_legs_status_idx` ON `load_relay_legs` (`status`);
