/**
 * REFRESH TOKEN SERVICE
 * Implements secure token rotation with refresh tokens.
 *
 * Strategy:
 *   - Access tokens: short-lived (15 min), JWT, stateless
 *   - Refresh tokens: long-lived (30 days), opaque, stored in DB
 *   - Refresh token rotation: each use issues a new refresh token
 *   - Reuse detection: if an old refresh token is reused, revoke ALL tokens for the user
 */

import crypto from "crypto";
import { sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { recordAuditEvent, AuditAction, AuditCategory } from "../../../_core/auditService";

const REFRESH_TOKEN_BYTES = 48;
const REFRESH_TOKEN_TTL_DAYS = 30;

export interface RefreshTokenRecord {
  token: string;
  tokenHash: string;
  userId: number;
  familyId: string;       // Token family for reuse detection
  expiresAt: Date;
  replacedBy: string | null;
  createdAt: Date;
}

/**
 * Generate a new refresh token.
 */
export function generateRefreshToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString("base64url");
  const hash = hashToken(token);
  return { token, hash };
}

/**
 * Store a refresh token in the database.
 */
export async function storeRefreshToken(
  userId: number,
  tokenHash: string,
  familyId?: string
): Promise<string> {
  const db = await getDb();
  if (!db) return familyId || crypto.randomUUID();

  const family = familyId || crypto.randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  try {
    await db.execute(
      sql`INSERT INTO refresh_tokens (token_hash, user_id, family_id, expires_at, created_at)
          VALUES (${tokenHash}, ${userId}, ${family}, ${expiresAt.toISOString()}, NOW())`
    );
  } catch (err) {
    console.warn("[RefreshTokens] Failed to store:", err);
  }

  return family;
}

/**
 * Rotate a refresh token: verify the old one, issue a new one, mark old as used.
 * If a previously-used token is presented (reuse attack), revoke the ENTIRE family.
 */
export async function rotateRefreshToken(
  oldToken: string,
  userId: number
): Promise<{ valid: boolean; newTokenHash: string | null; familyId: string | null; reuseDetected: boolean }> {
  const db = await getDb();
  if (!db) return { valid: false, newTokenHash: null, familyId: null, reuseDetected: false };

  const oldHash = hashToken(oldToken);

  try {
    // Find the refresh token record
    const rows = await db.execute(
      sql`SELECT token_hash, user_id, family_id, expires_at, replaced_by
          FROM refresh_tokens
          WHERE token_hash = ${oldHash} AND user_id = ${userId}
          LIMIT 1`
    );

    const record = Array.isArray(rows) && rows.length > 0
      ? (Array.isArray(rows[0]) ? rows[0][0] : rows[0])
      : null;

    if (!record) {
      return { valid: false, newTokenHash: null, familyId: null, reuseDetected: false };
    }

    // Check expiry
    if (new Date(record.expires_at) < new Date()) {
      return { valid: false, newTokenHash: null, familyId: null, reuseDetected: false };
    }

    // REUSE DETECTION: If this token was already replaced, it's a stolen token replay
    if (record.replaced_by) {
      // Revoke the ENTIRE token family
      await db.execute(
        sql`DELETE FROM refresh_tokens WHERE family_id = ${record.family_id}`
      );

      // Audit: potential token theft
      recordAuditEvent({
        userId,
        action: AuditAction.SUSPICIOUS_ACTIVITY,
        category: AuditCategory.SECURITY,
        entityType: "refresh_token",
        metadata: {
          event: "REFRESH_TOKEN_REUSE_DETECTED",
          familyId: record.family_id,
          description: "Previously used refresh token was replayed. Entire token family revoked.",
        },
        severity: "CRITICAL",
      }).catch(() => {});

      return { valid: false, newTokenHash: null, familyId: record.family_id, reuseDetected: true };
    }

    // Generate new token
    const { hash: newHash } = generateRefreshToken();

    // Mark old token as replaced
    await db.execute(
      sql`UPDATE refresh_tokens SET replaced_by = ${newHash} WHERE token_hash = ${oldHash}`
    );

    // Store new token in same family
    await storeRefreshToken(userId, newHash, record.family_id);

    return { valid: true, newTokenHash: newHash, familyId: record.family_id, reuseDetected: false };
  } catch (err) {
    console.warn("[RefreshTokens] Rotation error:", err);
    return { valid: false, newTokenHash: null, familyId: null, reuseDetected: false };
  }
}

/**
 * Revoke all refresh tokens for a user.
 * Called on password change, force logout, or account deletion.
 */
export async function revokeAllRefreshTokens(userId: number, reason?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.execute(
      sql`DELETE FROM refresh_tokens WHERE user_id = ${userId}`
    );

    recordAuditEvent({
      userId,
      action: AuditAction.TOKEN_REVOKED,
      category: AuditCategory.AUTH,
      entityType: "refresh_token",
      metadata: { reason: reason || "manual_revocation", action: "revoke_all" },
      severity: "MEDIUM",
    }).catch(() => {});
  } catch (err) {
    console.warn("[RefreshTokens] Failed to revoke all:", err);
  }
}

/**
 * Cleanup expired refresh tokens (run periodically).
 */
export async function cleanupExpiredRefreshTokens(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db.execute(
      sql`DELETE FROM refresh_tokens WHERE expires_at < NOW()`
    );
    return (result as any)?.affectedRows || 0;
  } catch {
    return 0;
  }
}

// ─── Internal ───────────────────────────────────────────────────────────────

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
