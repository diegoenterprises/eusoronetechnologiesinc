-- 0007: Enhance appointments table with TAS integration fields
-- Adds carrier, product, quantity, vehicle, hazmat, pre-clearance, BOL, timing, and approval fields

ALTER TABLE appointments
  ADD COLUMN carrierId INT NULL AFTER driverId,
  ADD COLUMN product VARCHAR(200) NULL AFTER status,
  ADD COLUMN quantity DECIMAL(12,2) NULL AFTER product,
  ADD COLUMN quantityUnit VARCHAR(20) DEFAULT 'barrels' AFTER quantity,
  ADD COLUMN truckNumber VARCHAR(50) NULL AFTER quantityUnit,
  ADD COLUMN trailerNumber VARCHAR(50) NULL AFTER truckNumber,
  ADD COLUMN hazmatClass VARCHAR(20) NULL AFTER trailerNumber,
  ADD COLUMN unNumber VARCHAR(20) NULL AFTER hazmatClass,
  ADD COLUMN preClearanceStatus ENUM('pending','cleared','denied','bypassed') DEFAULT 'pending' AFTER unNumber,
  ADD COLUMN preClearanceData JSON NULL AFTER preClearanceStatus,
  ADD COLUMN bolNumber VARCHAR(100) NULL AFTER preClearanceData,
  ADD COLUMN loadingId VARCHAR(100) NULL AFTER bolNumber,
  ADD COLUMN estimatedDurationMin INT NULL AFTER loadingId,
  ADD COLUMN notes TEXT NULL AFTER estimatedDurationMin,
  ADD COLUMN requestedById INT NULL AFTER notes,
  ADD COLUMN approvedById INT NULL AFTER requestedById,
  ADD COLUMN checkedInAt TIMESTAMP NULL AFTER approvedById,
  ADD COLUMN completedAt TIMESTAMP NULL AFTER checkedInAt,
  ADD COLUMN arrivalNotifiedAt TIMESTAMP NULL AFTER completedAt,
  ADD COLUMN departureNotifiedAt TIMESTAMP NULL AFTER arrivalNotifiedAt;

ALTER TABLE appointments
  ADD INDEX appointment_carrier_idx (carrierId),
  ADD INDEX appointment_status_idx (status);
