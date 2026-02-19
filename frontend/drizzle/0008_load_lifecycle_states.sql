-- ═══════════════════════════════════════════════════════════════
-- LOAD LIFECYCLE STATE MACHINE — Schema Migration
-- Expands loads.status enum from 13 → 32 states
-- Adds: load_state_transitions, financial_timers, approval_requests
-- ═══════════════════════════════════════════════════════════════

-- 1. Expand the loads.status enum to include all 32 lifecycle states
ALTER TABLE loads MODIFY COLUMN status ENUM(
  'draft', 'posted', 'bidding', 'expired',
  'awarded', 'declined', 'lapsed', 'accepted', 'assigned', 'confirmed',
  'en_route_pickup', 'at_pickup', 'pickup_checkin', 'loading', 'loading_exception', 'loaded',
  'in_transit', 'transit_hold', 'transit_exception',
  'at_delivery', 'delivery_checkin', 'unloading', 'unloading_exception', 'unloaded',
  'pod_pending', 'pod_rejected', 'delivered',
  'invoiced', 'disputed', 'paid', 'complete',
  'cancelled', 'on_hold'
) NOT NULL DEFAULT 'draft';

-- 2. State transition audit log
CREATE TABLE IF NOT EXISTS load_state_transitions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  load_id INT NOT NULL,
  from_state VARCHAR(30) NOT NULL,
  to_state VARCHAR(30) NOT NULL,
  transition_id VARCHAR(60) NOT NULL,
  trigger_type VARCHAR(20) NOT NULL,
  trigger_event VARCHAR(60) NOT NULL,
  actor_user_id INT,
  actor_role VARCHAR(30),
  guards_passed JSON,
  effects_executed JSON,
  metadata JSON,
  error_message TEXT,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_lst_load (load_id),
  INDEX idx_lst_created (created_at),
  INDEX idx_lst_transition (transition_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Financial timers (detention, demurrage, layover)
CREATE TABLE IF NOT EXISTS financial_timers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  load_id INT NOT NULL,
  type ENUM('DETENTION', 'DEMURRAGE', 'LAYOVER') NOT NULL,
  status ENUM('FREE_TIME', 'BILLING', 'STOPPED', 'WAIVED') NOT NULL DEFAULT 'FREE_TIME',
  location_id INT,
  started_at TIMESTAMP NOT NULL,
  free_time_ends_at TIMESTAMP NOT NULL,
  billing_started_at TIMESTAMP NULL,
  stopped_at TIMESTAMP NULL,
  free_time_minutes INT NOT NULL DEFAULT 120,
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 75.00,
  max_charge_hours INT,
  total_minutes INT,
  billable_minutes INT,
  total_charge DECIMAL(10,2),
  waived_by INT,
  waive_reason TEXT,
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ft_load (load_id),
  INDEX idx_ft_status (status),
  INDEX idx_ft_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Approval requests (rate, facility, BOL, POD, payment gates)
CREATE TABLE IF NOT EXISTS approval_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  load_id INT NOT NULL,
  gate_id VARCHAR(60) NOT NULL,
  transition_id VARCHAR(60) NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'DENIED', 'ESCALATED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
  requested_by INT NOT NULL,
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_by INT,
  responded_at TIMESTAMP NULL,
  response_notes TEXT,
  approval_data JSON,
  escalated_to JSON,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ar_load (load_id),
  INDEX idx_ar_status (status),
  INDEX idx_ar_gate (gate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Add hold tracking columns to loads
ALTER TABLE loads
  ADD COLUMN IF NOT EXISTS hold_reason TEXT AFTER deletedAt,
  ADD COLUMN IF NOT EXISTS held_by INT AFTER hold_reason,
  ADD COLUMN IF NOT EXISTS held_at TIMESTAMP NULL AFTER held_by,
  ADD COLUMN IF NOT EXISTS previous_state VARCHAR(30) AFTER held_at;
