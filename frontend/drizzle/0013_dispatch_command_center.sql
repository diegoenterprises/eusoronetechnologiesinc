-- Migration 0013: Dispatch Command Center Tables (WS-DISPATCH-OVERHAUL)
-- 6 new tables for dispatcher preferences, queue, templates, availability,
-- performance metrics, and action history

CREATE TABLE IF NOT EXISTS `dispatcher_preferences` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `companyId` INT NOT NULL,
  `defaultView` ENUM('kanban','list','map') DEFAULT 'kanban',
  `autoRefreshSeconds` INT DEFAULT 15,
  `soundAlerts` BOOLEAN DEFAULT TRUE,
  `hosWarningThresholdMinutes` INT DEFAULT 60,
  `preferredCargoTypes` JSON,
  `preferredLanes` JSON,
  `kanbanColumnOrder` JSON,
  `leftPanelCollapsed` BOOLEAN DEFAULT FALSE,
  `rightPanelCollapsed` BOOLEAN DEFAULT FALSE,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `userId` (`userId`),
  INDEX `dp_user_idx` (`userId`),
  INDEX `dp_company_idx` (`companyId`)
);

CREATE TABLE IF NOT EXISTS `dispatch_queue` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `loadId` INT NOT NULL,
  `companyId` INT NOT NULL,
  `priority` ENUM('critical','high','normal','low') DEFAULT 'normal',
  `status` ENUM('pending','assigned','in_progress','completed','cancelled') DEFAULT 'pending',
  `assignedDispatcherId` INT,
  `notes` TEXT,
  `dueBy` TIMESTAMP NULL,
  `completedAt` TIMESTAMP NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `dq_load_idx` (`loadId`),
  INDEX `dq_company_idx` (`companyId`),
  INDEX `dq_status_idx` (`status`),
  INDEX `dq_priority_idx` (`priority`)
);

CREATE TABLE IF NOT EXISTS `dispatch_templates` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT NOT NULL,
  `createdBy` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255),
  `originCity` VARCHAR(100),
  `originState` VARCHAR(2),
  `destinationCity` VARCHAR(100),
  `destinationState` VARCHAR(2),
  `cargoType` VARCHAR(50),
  `trailerType` VARCHAR(50),
  `rate` DECIMAL(10,2),
  `hazmatClass` VARCHAR(10),
  `specialInstructions` TEXT,
  `usageCount` INT DEFAULT 0,
  `isActive` BOOLEAN DEFAULT TRUE,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `dt_company_idx` (`companyId`),
  INDEX `dt_createdby_idx` (`createdBy`)
);

CREATE TABLE IF NOT EXISTS `driver_availability` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `driverId` INT NOT NULL,
  `companyId` INT NOT NULL,
  `status` ENUM('available','on_load','off_duty','sleeper','break','personal','yard') DEFAULT 'available',
  `hosDrivingRemaining` INT,
  `hosOnDutyRemaining` INT,
  `hosCycleRemaining` INT,
  `currentLat` DECIMAL(10,6),
  `currentLng` DECIMAL(10,6),
  `currentCity` VARCHAR(100),
  `currentState` VARCHAR(2),
  `availableFrom` TIMESTAMP NULL,
  `availableUntil` TIMESTAMP NULL,
  `preferredLanes` JSON,
  `notes` TEXT,
  `lastUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `da_driver_idx` (`driverId`),
  INDEX `da_company_idx` (`companyId`),
  INDEX `da_status_idx` (`status`)
);

CREATE TABLE IF NOT EXISTS `dispatch_performance_metrics` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT NOT NULL,
  `dispatcherId` INT,
  `periodStart` TIMESTAMP NOT NULL,
  `periodEnd` TIMESTAMP NOT NULL,
  `totalLoadsDispatched` INT DEFAULT 0,
  `totalLoadsDelivered` INT DEFAULT 0,
  `onTimeDeliveryRate` DECIMAL(5,2),
  `averageAssignmentTimeMinutes` INT,
  `totalRevenue` DECIMAL(12,2),
  `revenuePerMile` DECIMAL(6,2),
  `fleetUtilizationRate` DECIMAL(5,2),
  `deadheadMiles` DECIMAL(10,2),
  `driverSatisfactionScore` INT,
  `exceptionsCount` INT DEFAULT 0,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `dpm_company_idx` (`companyId`),
  INDEX `dpm_dispatcher_idx` (`dispatcherId`),
  INDEX `dpm_period_idx` (`periodStart`, `periodEnd`)
);

CREATE TABLE IF NOT EXISTS `dispatch_action_history` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT NOT NULL,
  `dispatcherId` INT NOT NULL,
  `actionType` ENUM('load_created','load_assigned','load_unassigned','driver_messaged','broadcast_sent','exception_resolved','bulk_assign','template_used','status_changed','rate_adjusted') NOT NULL,
  `loadId` INT,
  `driverId` INT,
  `details` JSON,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `dah_company_idx` (`companyId`),
  INDEX `dah_dispatcher_idx` (`dispatcherId`),
  INDEX `dah_action_idx` (`actionType`),
  INDEX `dah_load_idx` (`loadId`),
  INDEX `dah_created_idx` (`createdAt`)
);
