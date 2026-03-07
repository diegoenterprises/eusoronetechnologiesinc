-- QPilotOS Adaptation — WS-QP-001 through WS-QP-006
-- HRRN Dispatch, Resource Pre-Analysis, Task Decomposition,
-- Dual-Storage refs, Resource Broadcasts, Multi-Pass Optimization

-- WS-QP-001: HRRN Dispatch Queue
CREATE TABLE IF NOT EXISTS dispatch_queue_priorities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loadId INT NOT NULL,
  companyId INT NOT NULL,
  enteredQueueAt DATETIME NOT NULL DEFAULT NOW(),
  estimatedServiceMinutes INT NOT NULL DEFAULT 120,
  basePriority DECIMAL(8,4) NOT NULL DEFAULT 1.0,
  currentHrrnScore DECIMAL(10,4) NOT NULL DEFAULT 1.0,
  lastRecalculatedAt DATETIME NOT NULL DEFAULT NOW(),
  constraintFlags JSON DEFAULT NULL,
  status ENUM('queued','scheduling','assigned','expired') NOT NULL DEFAULT 'queued',
  assignedDriverId INT DEFAULT NULL,
  assignedAt DATETIME DEFAULT NULL,
  UNIQUE KEY uq_dqp_load (loadId),
  KEY idx_dqp_company_status (companyId, status),
  KEY idx_dqp_hrrn_score (currentHrrnScore DESC),
  KEY idx_dqp_entered_queue (enteredQueueAt)
);

-- WS-QP-002: Resource Pre-Analysis
CREATE TABLE IF NOT EXISTS resource_preanalysis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loadId INT NOT NULL,
  companyId INT NOT NULL,
  analyzedAt DATETIME NOT NULL DEFAULT NOW(),
  verdict ENUM('can_dispatch','partial_match','cannot_dispatch') NOT NULL,
  verdictReason TEXT NOT NULL,
  requiredResources JSON NOT NULL,
  availableResources JSON NOT NULL,
  gapAnalysis JSON DEFAULT NULL,
  matchedDriverIds JSON DEFAULT NULL,
  estimatedDispatchReady DATETIME DEFAULT NULL,
  expiresAt DATETIME NOT NULL,
  UNIQUE KEY uq_rpa_load (loadId),
  KEY idx_rpa_company_verdict (companyId, verdict),
  KEY idx_rpa_expires (expiresAt)
);

CREATE TABLE IF NOT EXISTS resource_capacity_snapshot (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT NOT NULL,
  snapshotAt DATETIME NOT NULL DEFAULT NOW(),
  totalDrivers INT NOT NULL DEFAULT 0,
  availableDrivers INT NOT NULL DEFAULT 0,
  hazmatEndorsedDrivers INT NOT NULL DEFAULT 0,
  twicCardDrivers INT NOT NULL DEFAULT 0,
  avgHosRemaining DECIMAL(8,2) NOT NULL DEFAULT 0,
  equipmentCounts JSON NOT NULL,
  activePermits JSON NOT NULL,
  escortAvailable INT NOT NULL DEFAULT 0,
  KEY idx_rcs_company_time (companyId, snapshotAt DESC)
);

-- WS-QP-003: Task Decomposition
CREATE TABLE IF NOT EXISTS load_analysis_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loadId INT NOT NULL,
  companyId INT NOT NULL,
  parentTaskId INT DEFAULT NULL,
  taskType ENUM('hazmat_validation','rate_prediction','eta_estimation',
    'carrier_matching','route_optimization','compliance_check',
    'equipment_validation','permit_check','escort_check','insurance_check',
    'aggregation') NOT NULL,
  status ENUM('pending','running','completed','failed','skipped') NOT NULL DEFAULT 'pending',
  priority INT NOT NULL DEFAULT 5,
  inputData JSON DEFAULT NULL,
  outputData JSON DEFAULT NULL,
  startedAt DATETIME DEFAULT NULL,
  completedAt DATETIME DEFAULT NULL,
  durationMs INT DEFAULT NULL,
  errorMessage TEXT DEFAULT NULL,
  KEY idx_lat_load_status (loadId, status),
  KEY idx_lat_parent (parentTaskId),
  KEY idx_lat_type_status (taskType, status)
);

CREATE TABLE IF NOT EXISTS load_analysis_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loadId INT NOT NULL,
  companyId INT NOT NULL,
  aggregatedAt DATETIME NOT NULL DEFAULT NOW(),
  overallScore DECIMAL(5,2) NOT NULL DEFAULT 0,
  rateEstimate DECIMAL(10,2) DEFAULT NULL,
  etaMinutes INT DEFAULT NULL,
  topCarriers JSON DEFAULT NULL,
  complianceStatus ENUM('pass','warn','fail') NOT NULL DEFAULT 'pass',
  complianceIssues JSON DEFAULT NULL,
  routeRecommendation JSON DEFAULT NULL,
  resourceVerdict VARCHAR(20) DEFAULT NULL,
  fullReport JSON NOT NULL,
  mongoDocId VARCHAR(64) DEFAULT NULL,
  UNIQUE KEY uq_lar_load (loadId),
  KEY idx_lar_company (companyId)
);

-- WS-QP-005: Resource Broadcasts
CREATE TABLE IF NOT EXISTS resource_broadcast_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  companyId INT NOT NULL,
  resourceType ENUM('driver_availability','hos_warning','equipment_status',
    'permit_expiry','certification_expiry','twic_expiry','insurance_expiry',
    'capacity_alert','maintenance_due') NOT NULL,
  threshold JSON DEFAULT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt DATETIME NOT NULL DEFAULT NOW(),
  KEY idx_rbs_company_type (companyId, resourceType),
  KEY idx_rbs_user (userId)
);

CREATE TABLE IF NOT EXISTS resource_broadcast_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT NOT NULL,
  broadcastType VARCHAR(50) NOT NULL,
  severity ENUM('info','warning','critical') NOT NULL,
  message TEXT NOT NULL,
  payload JSON DEFAULT NULL,
  recipientCount INT NOT NULL DEFAULT 0,
  broadcastAt DATETIME NOT NULL DEFAULT NOW(),
  KEY idx_rbl_company_time (companyId, broadcastAt DESC),
  KEY idx_rbl_severity (severity)
);

-- WS-QP-006: Multi-Pass Optimization
CREATE TABLE IF NOT EXISTS optimization_runs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loadId INT NOT NULL,
  companyId INT NOT NULL,
  triggerType ENUM('auto','manual','re_optimize') NOT NULL DEFAULT 'auto',
  status ENUM('running','completed','failed','cancelled') NOT NULL DEFAULT 'running',
  totalPasses INT NOT NULL DEFAULT 6,
  completedPasses INT NOT NULL DEFAULT 0,
  currentPass VARCHAR(50) DEFAULT NULL,
  startedAt DATETIME NOT NULL DEFAULT NOW(),
  completedAt DATETIME DEFAULT NULL,
  totalDurationMs INT DEFAULT NULL,
  finalScore DECIMAL(5,2) DEFAULT NULL,
  KEY idx_or_load (loadId),
  KEY idx_or_company_status (companyId, status)
);

CREATE TABLE IF NOT EXISTS optimization_pass_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  runId INT NOT NULL,
  passNumber INT NOT NULL,
  passName VARCHAR(50) NOT NULL,
  inputSnapshot JSON NOT NULL,
  outputSnapshot JSON NOT NULL,
  improvementDelta DECIMAL(8,4) DEFAULT NULL,
  durationMs INT NOT NULL DEFAULT 0,
  status ENUM('completed','skipped','failed') NOT NULL DEFAULT 'completed',
  notes TEXT DEFAULT NULL,
  KEY idx_opr_run_pass (runId, passNumber)
);

CREATE TABLE IF NOT EXISTS lane_performance_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  originState VARCHAR(2) NOT NULL,
  destState VARCHAR(2) NOT NULL,
  equipmentType VARCHAR(30) NOT NULL DEFAULT 'flatbed',
  avgRate DECIMAL(10,2) DEFAULT NULL,
  avgTransitHours DECIMAL(6,2) DEFAULT NULL,
  avgDetentionMinutes INT DEFAULT NULL,
  onTimePercentage DECIMAL(5,2) DEFAULT NULL,
  volumeLast30Days INT NOT NULL DEFAULT 0,
  topCarrierIds JSON DEFAULT NULL,
  lastUpdated DATETIME NOT NULL DEFAULT NOW(),
  UNIQUE KEY uq_lpc_lane (originState, destState, equipmentType),
  KEY idx_lpc_volume (volumeLast30Days DESC)
);
