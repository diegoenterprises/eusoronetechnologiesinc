/**
 * SESSION MANAGER
 * Manages user sessions with security constraints:
 *   - Maximum 5 concurrent sessions per user
 *   - Session fingerprinting (IP + User-Agent)
 *   - Automatic session expiry (7 days access, 30 days refresh)
 *   - Force-logout capability for compromised sessions
 *   - Session activity tracking for anomaly detection
 */

import crypto from "crypto";
import { sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { recordAuditEvent, AuditAction, AuditCategory } from "../../../_core/auditService";

const MAX_CONCURRENT_SESSIONS = 5;
const ACCESS_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;   // 7 days
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;  // 30 days
const SESSION_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;      // 1 hour

export interface SessionInfo {
  id: string;
  userId: number;
  tokenHash: string;
  refreshTokenHash: string | null;
  ip: string;
  userAgent: string;
  fingerprint: string;
  createdAt: Date;
  lastActiveAt: Date;
  expiresAt: Date;
  refreshExpiresAt: Date | null;
  mfaVerified: boolean;
}

/**
 * Create a new session for a user.
 * Enforces maximum concurrent session limit.
 */
export async function createSession(
  userId: number,
  tokenHash: string,
  ip: string,
  userAgent: string,
  mfaVerified: boolean = false
): Promise<SessionInfo> {
  const db = await getDb();
  const sessionId = crypto.randomUUID();
  const fingerprint = generateFingerprint(ip, userAgent);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ACCESS_TOKEN_TTL_MS);
  const refreshExpiresAt = new Date(now.getTime() + REFRESH_TOKEN_TTL_MS);

  // Enforce max concurrent sessions — evict oldest if at limit
  if (db) {
    try {
      const countResult = await db.execute(
        sql`SELECT COUNT(*) AS cnt FROM sessions WHERE user_id = ${userId} AND expires_at > NOW()`
      );
      const count = Array.isArray(countResult) && countResult.length > 0
        ? Number((Array.isArray(countResult[0]) ? countResult[0][0] : countResult[0])?.cnt || 0)
        : 0;

      if (count >= MAX_CONCURRENT_SESSIONS) {
        // Delete oldest sessions beyond limit
        await db.execute(
          sql`DELETE FROM sessions 
              WHERE user_id = ${userId} 
              AND id IN (
                SELECT id FROM (
                  SELECT id FROM sessions 
                  WHERE user_id = ${userId} 
                  ORDER BY last_active_at ASC 
                  LIMIT ${count - MAX_CONCURRENT_SESSIONS + 1}
                ) AS oldest
              )`
        );
      }

      // Insert new session
      await db.execute(
        sql`INSERT INTO sessions (id, user_id, token_hash, ip, user_agent, fingerprint, 
                                   created_at, last_active_at, expires_at, refresh_expires_at, mfa_verified)
            VALUES (${sessionId}, ${userId}, ${tokenHash}, ${ip}, ${userAgent.slice(0, 500)}, 
                    ${fingerprint}, NOW(), NOW(), ${expiresAt.toISOString()}, 
                    ${refreshExpiresAt.toISOString()}, ${mfaVerified ? 1 : 0})`
      );
    } catch (err) {
      console.warn("[SessionManager] DB insert failed, session created in-memory only:", err);
    }
  }

  return {
    id: sessionId,
    userId,
    tokenHash,
    refreshTokenHash: null,
    ip,
    userAgent,
    fingerprint,
    createdAt: now,
    lastActiveAt: now,
    expiresAt,
    refreshExpiresAt,
    mfaVerified,
  };
}

/**
 * Validate a session is still active and not expired.
 */
export async function validateSession(
  sessionId: string,
  userId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return true; // Fallback: if no DB, allow (JWT is primary auth)

  try {
    const rows = await db.execute(
      sql`SELECT 1 FROM sessions 
          WHERE id = ${sessionId} AND user_id = ${userId} AND expires_at > NOW()
          LIMIT 1`
    );
    return Array.isArray(rows) && rows.length > 0 &&
      (Array.isArray(rows[0]) ? rows[0].length > 0 : true);
  } catch {
    return true; // Fail open if DB is unavailable
  }
}

/**
 * Touch a session — update last_active_at timestamp.
 * Called on each authenticated request.
 */
export async function touchSession(sessionId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.execute(
      sql`UPDATE sessions SET last_active_at = NOW() WHERE id = ${sessionId}`
    );
  } catch {
    // Non-critical — don't fail the request
  }
}

/**
 * Destroy a specific session (logout).
 */
export async function destroySession(
  sessionId: string,
  userId: number,
  req?: any
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.execute(
      sql`DELETE FROM sessions WHERE id = ${sessionId} AND user_id = ${userId}`
    );
  } catch {
    // Non-critical
  }

  recordAuditEvent({
    userId,
    action: AuditAction.LOGOUT,
    category: AuditCategory.AUTH,
    entityType: "session",
    metadata: { sessionId },
    severity: "LOW",
  }, req).catch(() => {});
}

/**
 * Destroy ALL sessions for a user (force-logout everywhere).
 * Used when password is changed or account is compromised.
 */
export async function destroyAllSessions(
  userId: number,
  reason: string,
  req?: any
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db.execute(
      sql`DELETE FROM sessions WHERE user_id = ${userId}`
    );

    recordAuditEvent({
      userId,
      action: AuditAction.TOKEN_REVOKED,
      category: AuditCategory.AUTH,
      entityType: "session",
      metadata: { reason, action: "destroy_all_sessions" },
      severity: "HIGH",
    }, req).catch(() => {});

    return (result as any)?.affectedRows || 0;
  } catch {
    return 0;
  }
}

/**
 * Get all active sessions for a user (for "active sessions" settings page).
 */
export async function getActiveSessions(userId: number): Promise<Array<{
  id: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  lastActiveAt: string;
  mfaVerified: boolean;
}>> {
  const db = await getDb();
  if (!db) return [];

  try {
    const rows = await db.execute(
      sql`SELECT id, ip, user_agent AS userAgent, created_at AS createdAt, 
                 last_active_at AS lastActiveAt, mfa_verified AS mfaVerified
          FROM sessions 
          WHERE user_id = ${userId} AND expires_at > NOW()
          ORDER BY last_active_at DESC`
    );

    const results = Array.isArray(rows) ? (Array.isArray(rows[0]) ? rows[0] : rows) : [];
    return results.map((r: any) => ({
      id: r.id,
      ip: r.ip,
      userAgent: r.userAgent,
      createdAt: r.createdAt,
      lastActiveAt: r.lastActiveAt,
      mfaVerified: !!r.mfaVerified,
    }));
  } catch {
    return [];
  }
}

/**
 * Detect session anomalies — IP change, user-agent change, etc.
 */
export async function detectSessionAnomaly(
  sessionId: string,
  currentIp: string,
  currentUA: string
): Promise<{ anomaly: boolean; reason: string | null }> {
  const db = await getDb();
  if (!db) return { anomaly: false, reason: null };

  try {
    const rows = await db.execute(
      sql`SELECT ip, user_agent AS userAgent FROM sessions WHERE id = ${sessionId} LIMIT 1`
    );
    const session = Array.isArray(rows) && rows.length > 0
      ? (Array.isArray(rows[0]) ? rows[0][0] : rows[0])
      : null;

    if (!session) return { anomaly: false, reason: null };

    if (session.ip !== currentIp) {
      return { anomaly: true, reason: `IP changed: ${session.ip} → ${currentIp}` };
    }

    if (session.userAgent && currentUA && session.userAgent !== currentUA) {
      return { anomaly: true, reason: "User-Agent changed" };
    }

    return { anomaly: false, reason: null };
  } catch {
    return { anomaly: false, reason: null };
  }
}

/**
 * Cleanup expired sessions (run periodically).
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db.execute(
      sql`DELETE FROM sessions WHERE expires_at < NOW()`
    );
    return (result as any)?.affectedRows || 0;
  } catch {
    return 0;
  }
}

// ─── Internal ───────────────────────────────────────────────────────────────

function generateFingerprint(ip: string, userAgent: string): string {
  return crypto
    .createHash("sha256")
    .update(`${ip}:${userAgent}`)
    .digest("hex")
    .slice(0, 32);
}
