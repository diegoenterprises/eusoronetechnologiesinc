/**
 * HASH CHAIN AUDIT INTEGRITY
 * Implements tamper-evident audit logging using cryptographic hash chains.
 *
 * Each audit entry's hash includes the previous entry's hash, creating
 * an immutable chain. If any entry is modified or deleted, the chain
 * breaks and tampering is detected.
 *
 * This satisfies SOC 2 CC6.1 (accountability) and CC7.1 (monitoring).
 */

import crypto from "crypto";
import { sql } from "drizzle-orm";
import { getDb } from "../../../db";

const HASH_ALGORITHM = "sha256";

export interface AuditChainEntry {
  id: number;
  timestamp: Date;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: string;
  previousHash: string;
  entryHash: string;
}

/**
 * Compute the hash for an audit entry.
 * Includes: previousHash + timestamp + userId + action + entityType + entityId + metadata
 */
export function computeEntryHash(
  previousHash: string,
  timestamp: string,
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: string
): string {
  const payload = [
    previousHash,
    timestamp,
    userId || "",
    action,
    entityType,
    entityId || "",
    metadata,
  ].join("|");

  return crypto.createHash(HASH_ALGORITHM).update(payload).digest("hex");
}

/**
 * Get the hash of the most recent audit entry (the chain tip).
 * If no entries exist, returns the genesis hash.
 */
export async function getChainTip(): Promise<string> {
  const db = await getDb();
  if (!db) return genesisHash();

  try {
    const rows = await db.execute(
      sql`SELECT entry_hash FROM audit_logs ORDER BY id DESC LIMIT 1`
    );
    const row = Array.isArray(rows) && rows.length > 0
      ? (Array.isArray(rows[0]) ? rows[0][0] : rows[0])
      : null;

    return row?.entry_hash || genesisHash();
  } catch {
    return genesisHash();
  }
}

/**
 * Verify the integrity of the audit chain.
 * Checks every entry's hash against its computed value.
 *
 * @param startId - Start verification from this entry ID (default: 1)
 * @param batchSize - Number of entries to verify per batch
 * @returns Verification result with first broken link if any
 */
export async function verifyChainIntegrity(
  startId: number = 1,
  batchSize: number = 1000
): Promise<{
  valid: boolean;
  entriesChecked: number;
  firstBrokenAt: number | null;
  brokenReason: string | null;
}> {
  const db = await getDb();
  if (!db) return { valid: true, entriesChecked: 0, firstBrokenAt: null, brokenReason: null };

  let checked = 0;
  let currentId = startId;
  let previousHash = genesisHash();

  // If starting after first entry, get the previous hash
  if (startId > 1) {
    try {
      const rows = await db.execute(
        sql`SELECT entry_hash FROM audit_logs WHERE id = ${startId - 1} LIMIT 1`
      );
      const row = Array.isArray(rows) && rows.length > 0
        ? (Array.isArray(rows[0]) ? rows[0][0] : rows[0])
        : null;
      if (row?.entry_hash) previousHash = row.entry_hash;
    } catch {
      return { valid: false, entriesChecked: 0, firstBrokenAt: startId, brokenReason: "Could not fetch starting hash" };
    }
  }

  while (true) {
    try {
      const rows = await db.execute(
        sql`SELECT id, created_at AS timestamp, user_id AS userId, action, 
                   entity_type AS entityType, entity_id AS entityId, 
                   metadata, previous_hash AS previousHash, entry_hash AS entryHash
            FROM audit_logs 
            WHERE id >= ${currentId}
            ORDER BY id ASC 
            LIMIT ${batchSize}`
      );

      const entries = Array.isArray(rows) ? (Array.isArray(rows[0]) ? rows[0] : rows) : [];
      if (entries.length === 0) break;

      for (const entry of entries) {
        const e = entry as any;
        checked++;

        // Verify previous hash link
        if (e.previousHash && e.previousHash !== previousHash) {
          return {
            valid: false,
            entriesChecked: checked,
            firstBrokenAt: e.id,
            brokenReason: `Previous hash mismatch at entry ${e.id}`,
          };
        }

        // Verify entry hash
        const expectedHash = computeEntryHash(
          previousHash,
          String(e.timestamp),
          e.userId,
          e.action,
          e.entityType,
          e.entityId,
          typeof e.metadata === "string" ? e.metadata : JSON.stringify(e.metadata)
        );

        if (e.entryHash && e.entryHash !== expectedHash) {
          return {
            valid: false,
            entriesChecked: checked,
            firstBrokenAt: e.id,
            brokenReason: `Entry hash mismatch at entry ${e.id} (tampering detected)`,
          };
        }

        previousHash = e.entryHash || expectedHash;
        currentId = e.id + 1;
      }

      if (entries.length < batchSize) break;
    } catch (err) {
      return {
        valid: false,
        entriesChecked: checked,
        firstBrokenAt: currentId,
        brokenReason: `Database error during verification: ${err}`,
      };
    }
  }

  return { valid: true, entriesChecked: checked, firstBrokenAt: null, brokenReason: null };
}

/**
 * Get chain statistics for monitoring dashboards.
 */
export async function getChainStats(): Promise<{
  totalEntries: number;
  oldestEntry: string | null;
  newestEntry: string | null;
  chainTipHash: string;
}> {
  const db = await getDb();
  if (!db) return { totalEntries: 0, oldestEntry: null, newestEntry: null, chainTipHash: genesisHash() };

  try {
    const rows = await db.execute(
      sql`SELECT COUNT(*) AS total, MIN(created_at) AS oldest, MAX(created_at) AS newest
          FROM audit_logs`
    );
    const row = Array.isArray(rows) && rows.length > 0
      ? (Array.isArray(rows[0]) ? rows[0][0] : rows[0])
      : null;

    const tip = await getChainTip();

    return {
      totalEntries: Number(row?.total || 0),
      oldestEntry: row?.oldest ? String(row.oldest) : null,
      newestEntry: row?.newest ? String(row.newest) : null,
      chainTipHash: tip,
    };
  } catch {
    return { totalEntries: 0, oldestEntry: null, newestEntry: null, chainTipHash: genesisHash() };
  }
}

// ─── Internal ───────────────────────────────────────────────────────────────

function genesisHash(): string {
  return crypto.createHash(HASH_ALGORITHM).update("EUSOTRIP_GENESIS_BLOCK_2025").digest("hex");
}
