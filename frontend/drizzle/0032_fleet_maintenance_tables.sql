-- 0032: Create fleet maintenance tables — parts inventory, warranties, tires, POs, compliance events

-- PARTS INVENTORY
CREATE TABLE IF NOT EXISTS `parts_inventory` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `companyId` int NOT NULL,
  `partNumber` varchar(50) NOT NULL,
  `name` varchar(200) NOT NULL,
  `category` varchar(50),
  `quantity` int DEFAULT 0,
  `unit` varchar(20) DEFAULT 'each',
  `unitCost` decimal(10,2),
  `reorderLevel` int DEFAULT 5,
  `supplier` varchar(200),
  `location` varchar(100),
  `lastOrderedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `parts_inv_company_idx` (`companyId`),
  INDEX `parts_inv_partnum_idx` (`partNumber`),
  FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`)
);

-- WARRANTY RECORDS
CREATE TABLE IF NOT EXISTS `warranty_records` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `companyId` int NOT NULL,
  `vehicleId` int,
  `component` varchar(100) NOT NULL,
  `provider` varchar(200),
  `startDate` timestamp NULL,
  `expiryDate` timestamp NULL,
  `mileageLimit` int,
  `status` enum('active','expired','claimed','voided'),
  `policyNumber` varchar(100),
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `warranty_rec_company_idx` (`companyId`),
  INDEX `warranty_rec_vehicle_idx` (`vehicleId`),
  INDEX `warranty_rec_status_idx` (`status`),
  FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`),
  FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`)
);

-- WARRANTY CLAIMS
CREATE TABLE IF NOT EXISTS `warranty_claims` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `warrantyId` int,
  `companyId` int NOT NULL,
  `vehicleId` int,
  `claimDate` timestamp NULL,
  `description` text,
  `repairCost` decimal(10,2),
  `status` enum('submitted','approved','denied','paid'),
  `approvedAmount` decimal(10,2),
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `warranty_claims_warranty_idx` (`warrantyId`),
  INDEX `warranty_claims_company_idx` (`companyId`),
  INDEX `warranty_claims_status_idx` (`status`),
  FOREIGN KEY (`warrantyId`) REFERENCES `warranty_records`(`id`),
  FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`),
  FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`)
);

-- TIRE INVENTORY
CREATE TABLE IF NOT EXISTS `tire_inventory` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `companyId` int NOT NULL,
  `vehicleId` int,
  `position` varchar(20),
  `brand` varchar(100),
  `model` varchar(100),
  `size` varchar(30),
  `treadDepth` decimal(4,2),
  `installedAt` timestamp NULL,
  `installedMileage` int,
  `status` enum('active','worn','replaced','retreaded'),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `tire_inv_company_idx` (`companyId`),
  INDEX `tire_inv_vehicle_idx` (`vehicleId`),
  INDEX `tire_inv_status_idx` (`status`),
  FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`),
  FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`)
);

-- PURCHASE ORDERS
CREATE TABLE IF NOT EXISTS `purchase_orders` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `companyId` int NOT NULL,
  `poNumber` varchar(50) NOT NULL,
  `vendorId` int,
  `vendorName` varchar(200),
  `status` enum('draft','submitted','approved','received','cancelled'),
  `totalAmount` decimal(12,2),
  `items` json,
  `orderedAt` timestamp NULL,
  `receivedAt` timestamp NULL,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `po_company_idx` (`companyId`),
  INDEX `po_number_idx` (`poNumber`),
  INDEX `po_status_idx` (`status`),
  FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`)
);

-- COMPLIANCE EVENTS
CREATE TABLE IF NOT EXISTS `compliance_events` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `companyId` int NOT NULL,
  `vehicleId` int,
  `eventType` enum('registration','ifta','2290','irp','ucr','dot_inspection','state_inspection'),
  `description` varchar(300),
  `dueDate` timestamp NULL,
  `completedDate` timestamp NULL,
  `status` enum('upcoming','due','overdue','completed'),
  `amount` decimal(10,2),
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `comp_events_company_idx` (`companyId`),
  INDEX `comp_events_vehicle_idx` (`vehicleId`),
  INDEX `comp_events_type_idx` (`eventType`),
  INDEX `comp_events_status_idx` (`status`),
  FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`),
  FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`)
);
