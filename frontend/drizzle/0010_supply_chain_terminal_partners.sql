-- ============================================================================
-- MIGRATION 0010: Supply Chain Model — Terminal Partners & Marketer Infusion
-- 
-- Models the oil trucking supply chain:
--   Terminal → Shipper/Marketer → Catalyst/Broker → Driver
-- 
-- Key additions:
--   1. companies.supplyChainRole — classifies shipper companies as
--      PRODUCER, REFINER, MARKETER, WHOLESALER, RETAILER, TERMINAL_OPERATOR
--   2. companies.marketerType — for MARKETER companies: branded, independent, used_oil
--   3. terminal_partners — junction table linking terminals to their
--      shipper/marketer/broker partners with access levels and volume tracking
--   4. loads.originTerminalId / destinationTerminalId — FK to terminal for
--      origin and destination, enabling terminal-aware load lifecycle
-- ============================================================================

-- 1. Company supply chain classification
ALTER TABLE companies
  ADD COLUMN supplyChainRole ENUM(
    'PRODUCER',
    'REFINER',
    'MARKETER',
    'WHOLESALER',
    'RETAILER',
    'TERMINAL_OPERATOR',
    'TRANSPORTER'
  ) DEFAULT NULL AFTER complianceStatus;

ALTER TABLE companies
  ADD COLUMN marketerType ENUM(
    'branded',
    'independent',
    'used_oil'
  ) DEFAULT NULL AFTER supplyChainRole;

ALTER TABLE companies
  ADD COLUMN supplyChainMeta JSON DEFAULT NULL AFTER marketerType;

-- 2. Terminal ↔ Partner relationship (shippers, marketers, brokers at a terminal)
CREATE TABLE IF NOT EXISTS terminal_partners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  terminalId INT NOT NULL,
  companyId INT NOT NULL,
  partnerType ENUM('shipper', 'marketer', 'broker', 'transporter') NOT NULL DEFAULT 'shipper',
  status ENUM('active', 'pending', 'suspended', 'terminated') DEFAULT 'pending',
  agreementId INT DEFAULT NULL,
  rackAccessLevel ENUM('full', 'limited', 'scheduled') DEFAULT 'scheduled',
  monthlyVolumeCommitment DECIMAL(12,2) DEFAULT NULL,
  productTypes JSON DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  startDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  endDate TIMESTAMP NULL DEFAULT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX tp_terminal_idx (terminalId),
  INDEX tp_company_idx (companyId),
  INDEX tp_type_idx (partnerType),
  INDEX tp_status_idx (status),
  UNIQUE KEY tp_unique (terminalId, companyId)
);

-- 3. Load ↔ Terminal origin/destination
ALTER TABLE loads
  ADD COLUMN originTerminalId INT DEFAULT NULL AFTER vehicleId;

ALTER TABLE loads
  ADD COLUMN destinationTerminalId INT DEFAULT NULL AFTER originTerminalId;

ALTER TABLE loads
  ADD INDEX load_origin_terminal_idx (originTerminalId);

ALTER TABLE loads
  ADD INDEX load_dest_terminal_idx (destinationTerminalId);

-- 4. Expand terminal table for supply chain context
ALTER TABLE terminals
  ADD COLUMN terminalType ENUM(
    'refinery',
    'storage',
    'rack',
    'pipeline',
    'blending',
    'distribution',
    'marine',
    'rail'
  ) DEFAULT 'storage' AFTER status;

ALTER TABLE terminals
  ADD COLUMN productsHandled JSON DEFAULT NULL AFTER terminalType;

ALTER TABLE terminals
  ADD COLUMN throughputCapacity DECIMAL(12,2) DEFAULT NULL AFTER productsHandled;

ALTER TABLE terminals
  ADD COLUMN throughputUnit VARCHAR(20) DEFAULT 'bbl/day' AFTER throughputCapacity;
