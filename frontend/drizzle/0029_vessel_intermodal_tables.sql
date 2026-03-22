-- Migration 0029: Vessel/Maritime + Intermodal tables
-- Creates all tables required by vesselShipments.ts and intermodal.ts routers
-- These were defined in schema.ts but never migrated to the database

-- ════════════════════════════════════════════════════════════════════════════
-- VESSEL / MARITIME TABLES
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `ports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `unlocode` VARCHAR(10),
  `city` VARCHAR(100),
  `state` VARCHAR(50),
  `country` VARCHAR(100),
  `coordinates` JSON,
  `portType` VARCHAR(50),
  `maxDraft` DECIMAL(8,2),
  `totalBerths` INT DEFAULT 0,
  `containerCapacityTEU` INT DEFAULT 0,
  `hasCranes` TINYINT DEFAULT 0,
  `hasRailAccess` TINYINT DEFAULT 0,
  `customsOffice` VARCHAR(100),
  `ftzNumber` VARCHAR(50),
  `operatingAuthority` VARCHAR(100),
  `website` VARCHAR(255),
  `isActive` TINYINT DEFAULT 1,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `vessels` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `imoNumber` VARCHAR(20),
  `mmsiNumber` VARCHAR(20),
  `callSign` VARCHAR(20),
  `vesselType` VARCHAR(50),
  `flag` VARCHAR(50),
  `grossTonnage` DECIMAL(12,2),
  `deadweightTonnage` DECIMAL(12,2),
  `lengthMeters` DECIMAL(8,2),
  `beamMeters` DECIMAL(8,2),
  `draftMeters` DECIMAL(8,2),
  `teuCapacity` INT DEFAULT 0,
  `yearBuilt` INT,
  `ownerCompany` VARCHAR(255),
  `operatorId` INT,
  `classificationSociety` VARCHAR(100),
  `currentPosition` JSON,
  `status` VARCHAR(30) DEFAULT 'active',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `vessel_shipments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bookingNumber` VARCHAR(64) NOT NULL UNIQUE,
  `billOfLading` VARCHAR(64),
  `shipperId` INT,
  `operatorId` INT,
  `vesselId` INT,
  `originPortId` INT,
  `destinationPortId` INT,
  `cargoType` VARCHAR(50),
  `commodity` VARCHAR(255),
  `hazmatClass` VARCHAR(10),
  `imdgCode` VARCHAR(10),
  `numberOfContainers` INT DEFAULT 0,
  `totalWeightKg` DECIMAL(12,2),
  `totalVolumeCBM` DECIMAL(10,2),
  `status` ENUM('draft','pending','confirmed','loading','in_transit','at_port','unloading','delivered','cancelled') DEFAULT 'draft',
  `freightTerms` VARCHAR(10),
  `incoterms` VARCHAR(10),
  `rate` DECIMAL(10,2),
  `rateType` VARCHAR(20),
  `etd` DATETIME,
  `eta` DATETIME,
  `atd` DATETIME,
  `ata` DATETIME,
  `voyageNumber` VARCHAR(50),
  `serviceRoute` VARCHAR(100),
  `transportMode` VARCHAR(20) DEFAULT 'vessel',
  `companyId` INT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `shipping_containers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `containerNumber` VARCHAR(20) NOT NULL,
  `isoType` VARCHAR(10),
  `sizeType` VARCHAR(10),
  `ownerCompany` VARCHAR(255),
  `tareWeightKg` DECIMAL(10,2),
  `maxPayloadKg` DECIMAL(10,2),
  `maxVolumeCBM` DECIMAL(8,2),
  `condition` VARCHAR(20) DEFAULT 'good',
  `currentLocation` JSON,
  `currentPortId` INT,
  `status` VARCHAR(30) DEFAULT 'available',
  `assignedShipmentId` INT,
  `lastInspectionDate` DATE,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `vessel_voyages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vesselId` INT NOT NULL,
  `voyageNumber` VARCHAR(50) NOT NULL,
  `serviceRoute` VARCHAR(100),
  `departurePortId` INT,
  `arrivalPortId` INT,
  `scheduledDeparture` DATETIME,
  `scheduledArrival` DATETIME,
  `actualDeparture` DATETIME,
  `actualArrival` DATETIME,
  `status` VARCHAR(30) DEFAULT 'scheduled',
  `portCalls` JSON,
  `captainId` INT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `bills_of_lading` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bolNumber` VARCHAR(64) NOT NULL UNIQUE,
  `shipmentId` INT,
  `bolType` VARCHAR(30),
  `shipperId` INT,
  `consigneeId` INT,
  `notifyParty` VARCHAR(255),
  `originPort` VARCHAR(100),
  `destinationPort` VARCHAR(100),
  `vesselName` VARCHAR(255),
  `voyageNumber` VARCHAR(50),
  `cargoDescription` TEXT,
  `numberOfPackages` INT,
  `grossWeightKg` DECIMAL(12,2),
  `volumeCBM` DECIMAL(10,2),
  `freightTerms` VARCHAR(10),
  `dateOfIssue` DATE,
  `placeOfIssue` VARCHAR(100),
  `status` VARCHAR(30) DEFAULT 'draft',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `port_berths` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `portId` INT NOT NULL,
  `berthNumber` VARCHAR(20) NOT NULL,
  `berthType` VARCHAR(30),
  `lengthMeters` DECIMAL(8,2),
  `depthMeters` DECIMAL(8,2),
  `craneCount` INT DEFAULT 0,
  `currentVesselId` INT,
  `status` VARCHAR(30) DEFAULT 'available'
);

CREATE TABLE IF NOT EXISTS `vessel_berth_assignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vesselId` INT NOT NULL,
  `berthId` INT NOT NULL,
  `voyageId` INT,
  `scheduledArrival` DATETIME,
  `actualArrival` DATETIME,
  `scheduledDeparture` DATETIME,
  `actualDeparture` DATETIME,
  `status` VARCHAR(30) DEFAULT 'scheduled',
  `pilotRequired` TINYINT DEFAULT 0,
  `tugboatsRequired` INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS `customs_declarations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `shipmentId` INT,
  `declarationType` VARCHAR(30),
  `entryNumber` VARCHAR(50),
  `htsCode` VARCHAR(20),
  `countryOfOrigin` VARCHAR(50),
  `declaredValue` DECIMAL(12,2),
  `currency` VARCHAR(3) DEFAULT 'USD',
  `dutyRate` DECIMAL(6,4),
  `dutyAmount` DECIMAL(10,2),
  `brokerId` INT,
  `filedDate` DATE,
  `clearedDate` DATE,
  `status` VARCHAR(30) DEFAULT 'pending',
  `holdReasons` JSON,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `vessel_freight_rates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `operatorId` INT,
  `originPortId` INT,
  `destinationPortId` INT,
  `containerSize` VARCHAR(10),
  `ratePerUnit` DECIMAL(10,2),
  `currency` VARCHAR(3) DEFAULT 'USD',
  `bafSurcharge` DECIMAL(8,2) DEFAULT 0,
  `thcOrigin` DECIMAL(8,2) DEFAULT 0,
  `thcDestination` DECIMAL(8,2) DEFAULT 0,
  `peakSeasonSurcharge` DECIMAL(8,2) DEFAULT 0,
  `effectiveDate` DATE,
  `expirationDate` DATE,
  `transitDays` INT,
  `serviceRoute` VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS `vessel_demurrage` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `shipmentId` INT,
  `containerId` INT,
  `portId` INT,
  `chargeType` VARCHAR(30),
  `freeTimeDays` INT DEFAULT 0,
  `chargeableDays` INT DEFAULT 0,
  `ratePerDay` DECIMAL(8,2),
  `totalCharge` DECIMAL(10,2),
  `startDate` DATE,
  `endDate` DATE,
  `status` VARCHAR(30) DEFAULT 'pending',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `vessel_inspections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vesselId` INT NOT NULL,
  `inspectorId` INT,
  `inspectionType` VARCHAR(50),
  `authority` VARCHAR(100),
  `result` VARCHAR(30),
  `deficiencies` JSON,
  `inspectionDate` DATE,
  `nextDueDate` DATE,
  `detentionDays` INT DEFAULT 0,
  `notes` TEXT
);

CREATE TABLE IF NOT EXISTS `vessel_isps_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vesselId` INT NOT NULL,
  `portId` INT,
  `securityLevel` INT DEFAULT 1,
  `isscNumber` VARCHAR(50),
  `isscExpiry` DATE,
  `lastTenPorts` JSON,
  `declarationOfSecurity` TINYINT DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `vessel_insurance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vesselId` INT NOT NULL,
  `policyType` VARCHAR(50),
  `insurer` VARCHAR(255),
  `policyNumber` VARCHAR(100),
  `coverageAmount` DECIMAL(14,2),
  `deductible` DECIMAL(10,2),
  `effectiveDate` DATE,
  `expirationDate` DATE,
  `status` VARCHAR(30) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS `container_tracking` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `containerId` INT NOT NULL,
  `shipmentId` INT,
  `eventType` VARCHAR(50),
  `location` JSON,
  `portId` INT,
  `temperature` DECIMAL(5,2),
  `humidity` DECIMAL(5,2),
  `timestamp` DATETIME NOT NULL,
  `metadata` JSON
);

CREATE TABLE IF NOT EXISTS `vessel_shipment_events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `shipmentId` INT NOT NULL,
  `eventType` VARCHAR(50),
  `description` TEXT,
  `location` JSON,
  `portId` INT,
  `vesselId` INT,
  `timestamp` DATETIME NOT NULL,
  `metadata` JSON
);

CREATE TABLE IF NOT EXISTS `vessel_port_charges` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vesselId` INT,
  `portId` INT,
  `voyageId` INT,
  `chargeType` VARCHAR(50),
  `amount` DECIMAL(10,2),
  `currency` VARCHAR(3) DEFAULT 'USD',
  `invoiceNumber` VARCHAR(50),
  `status` VARCHAR(30) DEFAULT 'pending',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ════════════════════════════════════════════════════════════════════════════
-- INTERMODAL TABLES
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `intermodal_shipments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `intermodalNumber` VARCHAR(64) NOT NULL UNIQUE,
  `shipperId` INT,
  `originType` VARCHAR(30),
  `destinationType` VARCHAR(30),
  `originLocation` JSON,
  `destinationLocation` JSON,
  `commodity` VARCHAR(255),
  `hazmatClass` VARCHAR(10),
  `totalWeight` DECIMAL(12,2),
  `totalVolume` DECIMAL(10,2),
  `numberOfSegments` INT DEFAULT 0,
  `status` ENUM('draft','booked','in_transit','at_transfer','delivered','cancelled') DEFAULT 'draft',
  `totalRate` DECIMAL(10,2),
  `currency` VARCHAR(3) DEFAULT 'USD',
  `estimatedTransitDays` INT,
  `actualTransitDays` INT,
  `companyId` INT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `intermodal_segments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `intermodalShipmentId` INT NOT NULL,
  `legNumber` INT NOT NULL,
  `mode` ENUM('truck','rail','vessel','barge') NOT NULL,
  `truckShipmentId` INT,
  `railShipmentId` INT,
  `vesselShipmentId` INT,
  `originDescription` VARCHAR(255),
  `destinationDescription` VARCHAR(255),
  `carrierId` INT,
  `rate` DECIMAL(10,2),
  `estimatedHours` DECIMAL(6,1),
  `actualHours` DECIMAL(6,1),
  `status` VARCHAR(30) DEFAULT 'pending',
  `departedAt` DATETIME,
  `arrivedAt` DATETIME,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `intermodal_transfers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `intermodalShipmentId` INT NOT NULL,
  `fromSegmentId` INT,
  `toSegmentId` INT,
  `transferType` VARCHAR(50),
  `facilityName` VARCHAR(255),
  `facilityType` VARCHAR(50),
  `location` JSON,
  `scheduledAt` DATETIME,
  `startedAt` DATETIME,
  `completedAt` DATETIME,
  `dwellTimeHours` DECIMAL(6,1),
  `transferCost` DECIMAL(8,2),
  `status` VARCHAR(30) DEFAULT 'pending',
  `notes` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `intermodal_containers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `intermodalShipmentId` INT NOT NULL,
  `containerNumber` VARCHAR(20),
  `containerType` VARCHAR(10),
  `sealNumber` VARCHAR(30),
  `weightKg` DECIMAL(10,2),
  `currentMode` VARCHAR(20),
  `currentSegmentId` INT,
  `currentLocation` JSON,
  `status` VARCHAR(30) DEFAULT 'loaded',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `intermodal_chassis_tracking` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `chassisNumber` VARCHAR(30) NOT NULL,
  `chassisPool` VARCHAR(50),
  `chassisType` VARCHAR(30),
  `assignedContainerId` INT,
  `currentLocation` JSON,
  `status` VARCHAR(30) DEFAULT 'available',
  `lastInspectionDate` DATE,
  `ownerCompany` VARCHAR(255),
  `dailyRate` DECIMAL(6,2),
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ════════════════════════════════════════════════════════════════════════════
-- SAFETY / DVIR TABLES (49 CFR 396.11)
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `dvir_reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vehicleId` INT NOT NULL,
  `driverId` INT NOT NULL,
  `reportType` ENUM('pre_trip','post_trip','en_route') NOT NULL,
  `reportDate` DATE NOT NULL,
  `odometerMiles` DECIMAL(10,1),
  `overallCondition` ENUM('satisfactory','defects_noted','out_of_service') NOT NULL,
  `defectsFound` TINYINT DEFAULT 0,
  `defects` JSON,
  `driverSignature` VARCHAR(255),
  `driverSignedAt` DATETIME,
  `mechanicReview` TINYINT DEFAULT 0,
  `mechanicId` INT,
  `mechanicSignature` VARCHAR(255),
  `mechanicSignedAt` DATETIME,
  `mechanicNotes` TEXT,
  `repairsRequired` TINYINT DEFAULT 0,
  `repairsCompleted` TINYINT DEFAULT 0,
  `nextDriverAcknowledged` TINYINT DEFAULT 0,
  `nextDriverId` INT,
  `nextDriverSignedAt` DATETIME,
  `status` ENUM('draft','submitted','reviewed','repaired','acknowledged','closed') DEFAULT 'draft',
  `companyId` INT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_dvir_vehicle` (`vehicleId`),
  INDEX `idx_dvir_driver` (`driverId`),
  INDEX `idx_dvir_date` (`reportDate`),
  INDEX `idx_dvir_status` (`status`)
);

-- DVIR defect categories per 49 CFR 396.11(a)(1)
CREATE TABLE IF NOT EXISTS `dvir_defect_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `dvirId` INT NOT NULL,
  `category` ENUM(
    'air_compressor','air_lines','battery','body','brake_accessories',
    'brakes','carburetor','clutch','coupling_devices','defroster_heater',
    'drive_line','engine','exhaust','fifth_wheel','fluid_levels',
    'frame_assembly','front_axle','fuel_tanks','generator','glass',
    'horn','lights_head','lights_stop','lights_tail','lights_turn',
    'lights_clearance','mirrors','muffler','oil_pressure','radiator',
    'rear_end','reflectors','safety_equipment','springs','starter',
    'steering','suspension','tachograph','tires','transmission',
    'trip_recorder','wheels_rims','windows','windshield_wipers','other'
  ) NOT NULL,
  `description` TEXT,
  `severity` ENUM('minor','major','out_of_service') DEFAULT 'minor',
  `photoUrl` VARCHAR(500),
  `repaired` TINYINT DEFAULT 0,
  `repairedAt` DATETIME,
  `repairedBy` INT,
  `repairNotes` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ════════════════════════════════════════════════════════════════════════════
-- SAFETY INCIDENTS TABLE (terminal/facility-level)
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `safety_incidents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT,
  `facilityId` INT,
  `vehicleId` INT,
  `driverId` INT,
  `reportedBy` INT,
  `incidentType` ENUM('slip_fall','equipment_failure','chemical_spill','fire','collision','near_miss','ergonomic','security','weather','other') NOT NULL,
  `severity` ENUM('minor','moderate','major','critical','fatal') NOT NULL,
  `occurredAt` TIMESTAMP NOT NULL,
  `location` VARCHAR(255),
  `description` TEXT,
  `rootCause` TEXT,
  `correctiveAction` TEXT,
  `injuryCount` INT DEFAULT 0,
  `propertyDamageEstimate` DECIMAL(10,2),
  `oshaReportable` TINYINT DEFAULT 0,
  `oshaRecordNumber` VARCHAR(50),
  `status` ENUM('reported','investigating','corrective_action','closed') DEFAULT 'reported',
  `closedAt` TIMESTAMP NULL,
  `closedBy` INT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `si_company_idx` (`companyId`),
  INDEX `si_type_idx` (`incidentType`),
  INDEX `si_status_idx` (`status`)
);

-- ════════════════════════════════════════════════════════════════════════════
-- ESCORT CERTIFICATIONS TABLE (pilot car operator state certs)
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `escort_certifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `certType` VARCHAR(50) NOT NULL,
  `certNumber` VARCHAR(100),
  `issuingState` VARCHAR(5) NOT NULL,
  `issuingAuthority` VARCHAR(255),
  `issueDate` TIMESTAMP NULL,
  `expirationDate` TIMESTAMP NULL,
  `status` ENUM('active','expired','suspended','revoked') DEFAULT 'active',
  `heightPoleCertified` TINYINT DEFAULT 0,
  `nightOperationsCertified` TINYINT DEFAULT 0,
  `hazmatEscortCertified` TINYINT DEFAULT 0,
  `documentUrl` VARCHAR(500),
  `notes` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `ec_user_idx` (`userId`),
  INDEX `ec_state_idx` (`issuingState`),
  INDEX `ec_status_idx` (`status`),
  INDEX `ec_expiry_idx` (`expirationDate`)
);

-- ════════════════════════════════════════════════════════════════════════════
-- FIX: Add 'dvir' to inspections type enum (49 CFR 396.11 compliance)
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE `inspections` MODIFY COLUMN `type` ENUM('pre_trip', 'post_trip', 'dvir', 'roadside', 'annual', 'dot') NOT NULL;

-- ════════════════════════════════════════════════════════════════════════════
-- FIX: Add 'surety_bond' and 'trust_fund' to insurance_policies policyType enum
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE `insurance_policies` MODIFY COLUMN `policyType` ENUM(
  'auto_liability', 'general_liability', 'cargo', 'workers_compensation',
  'umbrella_excess', 'pollution_liability', 'environmental_impairment',
  'motor_truck_cargo', 'physical_damage', 'non_trucking_liability',
  'trailer_interchange', 'reefer_breakdown', 'hazmat_endorsement',
  'surety_bond', 'trust_fund', 'other'
) NOT NULL;

-- ════════════════════════════════════════════════════════════════════════════
-- INDEXES for performance
-- ════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS `idx_vessel_shipments_status` ON `vessel_shipments` (`status`);
CREATE INDEX IF NOT EXISTS `idx_vessel_shipments_company` ON `vessel_shipments` (`companyId`);
CREATE INDEX IF NOT EXISTS `idx_vessel_shipments_booking` ON `vessel_shipments` (`bookingNumber`);
CREATE INDEX IF NOT EXISTS `idx_containers_number` ON `shipping_containers` (`containerNumber`);
CREATE INDEX IF NOT EXISTS `idx_containers_shipment` ON `shipping_containers` (`assignedShipmentId`);
CREATE INDEX IF NOT EXISTS `idx_intermodal_status` ON `intermodal_shipments` (`status`);
CREATE INDEX IF NOT EXISTS `idx_intermodal_company` ON `intermodal_shipments` (`companyId`);
CREATE INDEX IF NOT EXISTS `idx_intermodal_segments_shipment` ON `intermodal_segments` (`intermodalShipmentId`);
CREATE INDEX IF NOT EXISTS `idx_container_tracking_container` ON `container_tracking` (`containerId`);
CREATE INDEX IF NOT EXISTS `idx_vessel_events_shipment` ON `vessel_shipment_events` (`shipmentId`);
CREATE INDEX IF NOT EXISTS `idx_ports_unlocode` ON `ports` (`unlocode`);
CREATE INDEX IF NOT EXISTS `idx_vessels_imo` ON `vessels` (`imoNumber`);
