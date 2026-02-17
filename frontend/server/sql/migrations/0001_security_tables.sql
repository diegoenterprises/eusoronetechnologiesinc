-- =============================================================================
-- EUSOTRIP SECURITY MIGRATION 0001
-- Creates tables required by the security and data isolation layer.
-- =============================================================================

-- Sessions table (session-manager.ts)
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(128) NOT NULL,
  ip VARCHAR(45) NOT NULL,
  user_agent VARCHAR(500),
  fingerprint VARCHAR(64),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_active_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  refresh_expires_at DATETIME,
  mfa_verified TINYINT(1) NOT NULL DEFAULT 0,
  INDEX idx_sessions_user_id (user_id),
  INDEX idx_sessions_expires (expires_at),
  INDEX idx_sessions_token_hash (token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Refresh tokens table (refresh-tokens.ts)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  family_id VARCHAR(36) NOT NULL,
  replaced_by VARCHAR(128),
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_refresh_user_id (user_id),
  INDEX idx_refresh_family (family_id),
  INDEX idx_refresh_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Deletion logs table (data-lifecycle.ts) — retained for compliance even after user deletion
CREATE TABLE IF NOT EXISTS deletion_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  original_user_id INT NOT NULL,
  deleted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason VARCHAR(500),
  INDEX idx_deletion_user (original_user_id),
  INDEX idx_deletion_date (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add hash chain columns to audit_logs if they don't exist
-- These support the tamper-evident hash chain (hash-chain.ts)
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS previous_hash VARCHAR(64),
  ADD COLUMN IF NOT EXISTS entry_hash VARCHAR(64),
  ADD INDEX IF NOT EXISTS idx_audit_entry_hash (entry_hash);

-- Conversation participants table (relationship-checker.ts)
CREATE TABLE IF NOT EXISTS conversation_participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  user_id INT NOT NULL,
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  left_at DATETIME,
  role VARCHAR(20) DEFAULT 'member',
  UNIQUE KEY uk_conv_user (conversation_id, user_id),
  INDEX idx_conv_participants_user (user_id),
  INDEX idx_conv_participants_conv (conversation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- MFA secrets table (mfa.ts) — TOTP secrets encrypted at rest
CREATE TABLE IF NOT EXISTS mfa_secrets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  encrypted_secret TEXT NOT NULL,
  backup_codes_hash TEXT,
  enabled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_verified_at DATETIME,
  INDEX idx_mfa_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Password history table (password-policy.ts) — prevent reuse of last 12 passwords
CREATE TABLE IF NOT EXISTS password_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pw_history_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
