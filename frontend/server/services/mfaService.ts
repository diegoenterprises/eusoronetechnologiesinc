/**
 * MFA SERVICE — TOTP-based Two-Factor Authentication
 * P0 Security Fix: Adds 2FA/MFA support with TOTP (RFC 6238)
 *
 * Flow:
 *   1. User calls setupMFA → gets secret + QR URI
 *   2. User scans QR in authenticator app (Google Authenticator, Authy, etc.)
 *   3. User calls verifyMFA with a 6-digit code → MFA enabled
 *   4. On login, if MFA enabled, user must provide code via verifyMFALogin
 *
 * Backup codes: 10 single-use codes generated at setup for recovery.
 */

import crypto from "crypto";
import { eq, and, sql } from "drizzle-orm";
import { getDb } from "../db";
import { logger } from "../_core/logger";

// ═══════════════════════════════════════════════════════════════
// TOTP IMPLEMENTATION (RFC 6238) — No external dependency needed
// ═══════════════════════════════════════════════════════════════

const TOTP_PERIOD = 30;   // seconds
const TOTP_DIGITS = 6;
const TOTP_WINDOW = 1;    // allow ±1 period for clock drift

function generateSecret(): string {
  return crypto.randomBytes(20).toString("hex");
}

function base32Encode(hex: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes = Buffer.from(hex, "hex");
  let bits = "";
  for (let i = 0; i < bytes.length; i++) bits += bytes[i].toString(2).padStart(8, "0");
  let result = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.substring(i, i + 5).padEnd(5, "0");
    result += alphabet[parseInt(chunk, 2)];
  }
  return result;
}

function hmacSha1(key: Buffer, counter: Buffer): Buffer {
  return crypto.createHmac("sha1", key).update(counter).digest();
}

function generateTOTP(secretHex: string, timeStep: number): string {
  const key = Buffer.from(secretHex, "hex");
  const counter = Buffer.alloc(8);
  counter.writeUInt32BE(Math.floor(timeStep), 4);

  const hmac = hmacSha1(key, counter);
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (code % 10 ** TOTP_DIGITS).toString().padStart(TOTP_DIGITS, "0");
}

function verifyTOTP(secretHex: string, token: string): boolean {
  const now = Math.floor(Date.now() / 1000);
  for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
    const timeStep = Math.floor(now / TOTP_PERIOD) + i;
    if (generateTOTP(secretHex, timeStep) === token) return true;
  }
  return false;
}

function generateBackupCodes(): string[] {
  return Array.from({ length: 10 }, () =>
    crypto.randomBytes(4).toString("hex").toUpperCase().match(/.{4}/g)!.join("-")
  );
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

export interface MFASetupResult {
  secret: string;
  qrUri: string;
  backupCodes: string[];
}

/**
 * Begin MFA setup: generate secret, QR URI, and backup codes.
 * Does NOT enable MFA yet — user must verify with a code first.
 */
export async function setupMFA(userId: number, email: string): Promise<MFASetupResult> {
  const secretHex = generateSecret();
  const base32Secret = base32Encode(secretHex);
  const issuer = "EusoTrip";
  const qrUri = `otpauth://totp/${issuer}:${encodeURIComponent(email)}?secret=${base32Secret}&issuer=${issuer}&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
  const backupCodes = generateBackupCodes();

  try {
    const db = await getDb();
    if (db) {
      // Upsert MFA token row (not enabled yet)
      await db.execute(sql`
        INSERT INTO mfa_tokens (userId, secret, method, isEnabled, backupCodes)
        VALUES (${userId}, ${secretHex}, 'totp', FALSE, ${JSON.stringify(backupCodes)})
        ON DUPLICATE KEY UPDATE
          secret = VALUES(secret), isEnabled = FALSE, backupCodes = VALUES(backupCodes)
      `);
    }
  } catch (e) {
    logger.error(`[MFA] setup failed for user ${userId}:`, (e as any)?.message);
    throw new Error("Failed to initialize MFA setup");
  }

  return { secret: base32Secret, qrUri, backupCodes };
}

/**
 * Verify a TOTP code during initial setup → enables MFA.
 */
export async function verifyAndEnableMFA(userId: number, code: string): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const rows: any[] = await db.execute(
      sql`SELECT secret FROM mfa_tokens WHERE userId = ${userId} AND method = 'totp' LIMIT 1`
    ).then((r: any) => (Array.isArray(r) ? (Array.isArray(r[0]) ? r[0] : r) : []));

    if (rows.length === 0) return false;

    const secretHex = rows[0].secret;
    if (!verifyTOTP(secretHex, code)) return false;

    // Enable MFA
    await db.execute(sql`
      UPDATE mfa_tokens SET isEnabled = TRUE, lastUsedAt = NOW() WHERE userId = ${userId} AND method = 'totp'
    `);

    logger.info(`[MFA] Enabled TOTP for user ${userId}`);
    return true;
  } catch (e) {
    logger.error(`[MFA] verify+enable failed for user ${userId}:`, (e as any)?.message);
    return false;
  }
}

/**
 * Verify a TOTP code during login (or backup code).
 */
export async function verifyMFALogin(userId: number, code: string): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const rows: any[] = await db.execute(
      sql`SELECT secret, backupCodes, isEnabled FROM mfa_tokens WHERE userId = ${userId} AND method = 'totp' LIMIT 1`
    ).then((r: any) => (Array.isArray(r) ? (Array.isArray(r[0]) ? r[0] : r) : []));

    if (rows.length === 0 || !rows[0].isEnabled) return true; // No MFA = pass

    const { secret: secretHex, backupCodes: backupRaw } = rows[0];

    // Try TOTP first
    if (verifyTOTP(secretHex, code)) {
      await db.execute(sql`UPDATE mfa_tokens SET lastUsedAt = NOW() WHERE userId = ${userId} AND method = 'totp'`);
      return true;
    }

    // Try backup code
    const backups: string[] = typeof backupRaw === 'string' ? JSON.parse(backupRaw) : (backupRaw || []);
    const normalizedCode = code.toUpperCase().replace(/[^A-F0-9-]/g, "");
    const idx = backups.indexOf(normalizedCode);
    if (idx >= 0) {
      backups.splice(idx, 1); // Consume the backup code
      await db.execute(sql`
        UPDATE mfa_tokens SET backupCodes = ${JSON.stringify(backups)}, lastUsedAt = NOW()
        WHERE userId = ${userId} AND method = 'totp'
      `);
      logger.info(`[MFA] Backup code used for user ${userId} (${backups.length} remaining)`);
      return true;
    }

    return false;
  } catch (e) {
    logger.error(`[MFA] login verify failed for user ${userId}:`, (e as any)?.message);
    return false; // Fail closed
  }
}

/**
 * Check if a user has MFA enabled.
 */
export async function isMFAEnabled(userId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const rows: any[] = await db.execute(
      sql`SELECT isEnabled FROM mfa_tokens WHERE userId = ${userId} AND method = 'totp' AND isEnabled = TRUE LIMIT 1`
    ).then((r: any) => (Array.isArray(r) ? (Array.isArray(r[0]) ? r[0] : r) : []));

    return rows.length > 0;
  } catch {
    return false;
  }
}

/**
 * Disable MFA for a user (admin action or user with verified session).
 */
export async function disableMFA(userId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    await db.execute(sql`DELETE FROM mfa_tokens WHERE userId = ${userId}`);
    logger.info(`[MFA] Disabled for user ${userId}`);
    return true;
  } catch (e) {
    logger.error(`[MFA] disable failed for user ${userId}:`, (e as any)?.message);
    return false;
  }
}

/**
 * Generate a password reset token (time-limited, single-use).
 */
export async function createPasswordResetToken(email: string): Promise<string | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const rows: any[] = await db.execute(
      sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`
    ).then((r: any) => (Array.isArray(r) ? (Array.isArray(r[0]) ? r[0] : r) : []));

    if (rows.length === 0) return null; // Don't reveal user existence

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600_000); // 1 hour

    // Store in user metadata
    await db.execute(sql`
      UPDATE users SET metadata = JSON_SET(
        COALESCE(metadata, '{}'),
        '$.passwordReset',
        JSON_OBJECT('token', ${token}, 'expiresAt', ${expiry.toISOString()}, 'used', FALSE)
      ) WHERE id = ${rows[0].id}
    `);

    return token;
  } catch (e) {
    logger.error(`[MFA] password reset token creation failed:`, (e as any)?.message);
    return null;
  }
}

/**
 * Validate a password reset token.
 */
export async function validatePasswordResetToken(token: string): Promise<{ valid: boolean; userId?: number }> {
  try {
    const db = await getDb();
    if (!db) return { valid: false };

    const rows: any[] = await db.execute(
      sql`SELECT id, metadata FROM users WHERE JSON_EXTRACT(metadata, '$.passwordReset.token') = ${token} LIMIT 1`
    ).then((r: any) => (Array.isArray(r) ? (Array.isArray(r[0]) ? r[0] : r) : []));

    if (rows.length === 0) return { valid: false };

    const meta = typeof rows[0].metadata === 'string' ? JSON.parse(rows[0].metadata) : rows[0].metadata;
    const reset = meta?.passwordReset;

    if (!reset || reset.used) return { valid: false };
    if (new Date(reset.expiresAt) < new Date()) return { valid: false };

    return { valid: true, userId: rows[0].id };
  } catch {
    return { valid: false };
  }
}
