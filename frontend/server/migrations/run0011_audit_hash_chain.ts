/**
 * Migration: Add hash chain columns to audit_logs table
 * Supports tamper-evident audit logging per Security Architecture spec.
 *
 * New columns:
 *   - metadata (JSON)     — structured metadata for the audit entry
 *   - severity (VARCHAR)  — LOW | MEDIUM | HIGH | CRITICAL
 *   - previous_hash (VARCHAR 64) — SHA-256 hash of the previous entry
 *   - entry_hash (VARCHAR 64)    — SHA-256 hash of this entry (includes previous_hash)
 */

import { getDb } from "../db";

export async function runAuditHashChainMigration() {
  const db = await getDb();
  if (!db) {
    console.error("[Migration 0011] No DB connection");
    return;
  }

  const statements = [
    // Add metadata column if not exists
    `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS metadata JSON DEFAULT NULL`,
    // Add severity column if not exists
    `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS severity VARCHAR(10) DEFAULT 'LOW'`,
    // Add hash chain columns
    `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS previous_hash VARCHAR(64) DEFAULT NULL`,
    `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entry_hash VARCHAR(64) DEFAULT NULL`,
    // Index on severity for filtering
    `CREATE INDEX IF NOT EXISTS audit_severity_idx ON audit_logs (severity)`,
  ];

  for (const sql of statements) {
    try {
      await db.execute(sql as any);
    } catch (err: any) {
      // Ignore "duplicate column" or "duplicate key" errors (already migrated)
      if (
        err.message?.includes("Duplicate column") ||
        err.message?.includes("Duplicate key") ||
        err.message?.includes("already exists")
      ) {
        continue;
      }
      console.error(`[Migration 0011] Error: ${err.message}`);
    }
  }

  console.log("[Migration 0011] audit_logs hash chain columns — DONE");
}
