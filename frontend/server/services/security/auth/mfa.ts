/**
 * MULTI-FACTOR AUTHENTICATION (MFA/TOTP)
 * Time-based One-Time Password implementation per RFC 6238.
 *
 * Mandatory for: ADMIN, SUPER_ADMIN
 * Optional for: all other roles
 *
 * Uses HMAC-SHA1 with 30-second time steps and 6-digit codes.
 * Compatible with Google Authenticator, Authy, 1Password, etc.
 */

import crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { encryptField, decryptField } from "../../../_core/encryption";
import { recordAuditEvent, AuditAction, AuditCategory } from "../../../_core/auditService";

const TOTP_DIGITS = 6;
const TOTP_PERIOD = 30; // seconds
const TOTP_WINDOW = 1;  // Allow ±1 time step for clock skew
const SECRET_LENGTH = 20; // 160 bits
const ISSUER = "EusoTrip";
const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_LENGTH = 8;

// Roles that MUST have MFA enabled
const MFA_REQUIRED_ROLES = ["ADMIN", "SUPER_ADMIN"];

/**
 * Generate a new TOTP secret for a user.
 * Returns the raw secret and an otpauth:// URI for QR code generation.
 */
export function generateTOTPSecret(email: string): {
  secret: string;
  uri: string;
  backupCodes: string[];
} {
  // Generate random secret
  const secretBuffer = crypto.randomBytes(SECRET_LENGTH);
  const secret = base32Encode(secretBuffer);

  // Build otpauth URI for authenticator apps
  const uri = `otpauth://totp/${encodeURIComponent(ISSUER)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(ISSUER)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;

  // Generate backup codes
  const backupCodes = generateBackupCodes();

  return { secret, uri, backupCodes };
}

/**
 * Verify a TOTP code against a secret.
 * Allows ±TOTP_WINDOW time steps for clock drift.
 */
export function verifyTOTP(secret: string, code: string): boolean {
  if (!secret || !code) return false;
  if (code.length !== TOTP_DIGITS) return false;
  if (!/^\d+$/.test(code)) return false;

  const now = Math.floor(Date.now() / 1000);

  for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
    const timeStep = Math.floor(now / TOTP_PERIOD) + i;
    const expected = generateTOTPCode(secret, timeStep);
    if (timingSafeEqual(code, expected)) {
      return true;
    }
  }

  return false;
}

/**
 * Verify a backup code. Backup codes are single-use.
 * Returns the index of the used code, or -1 if invalid.
 */
export function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): number {
  const normalized = code.replace(/[-\s]/g, "").toUpperCase();
  const hash = crypto.createHash("sha256").update(normalized).digest("hex");

  for (let i = 0; i < hashedCodes.length; i++) {
    if (hashedCodes[i] === hash) {
      return i;
    }
  }
  return -1;
}

/**
 * Hash backup codes for storage (we never store plaintext codes).
 */
export function hashBackupCodes(codes: string[]): string[] {
  return codes.map(code => {
    const normalized = code.replace(/[-\s]/g, "").toUpperCase();
    return crypto.createHash("sha256").update(normalized).digest("hex");
  });
}

/**
 * Check if MFA is required for a given role.
 */
export function isMFARequired(role: string): boolean {
  return MFA_REQUIRED_ROLES.includes(role);
}

/**
 * Encrypt TOTP secret for database storage.
 * The TOTP secret is AES-256-GCM encrypted at rest.
 */
export function encryptTOTPSecret(secret: string): string {
  return encryptField(secret);
}

/**
 * Decrypt TOTP secret from database storage.
 */
export function decryptTOTPSecret(encrypted: string): string {
  return decryptField(encrypted);
}

/**
 * Audit MFA events.
 */
export async function auditMFAEvent(
  userId: number | string,
  action: "enabled" | "disabled" | "verified" | "failed" | "backup_used",
  req?: any
): Promise<void> {
  const actionMap: Record<string, AuditAction> = {
    enabled: AuditAction.MFA_ENABLED,
    disabled: AuditAction.MFA_DISABLED,
    verified: AuditAction.MFA_VERIFIED,
    failed: AuditAction.MFA_FAILED,
    backup_used: AuditAction.MFA_VERIFIED,
  };

  await recordAuditEvent({
    userId,
    action: actionMap[action] || AuditAction.MFA_VERIFIED,
    category: AuditCategory.AUTH,
    entityType: "mfa",
    metadata: { mfaAction: action },
    severity: action === "failed" ? "HIGH" : "MEDIUM",
  }, req).catch(() => {});
}

// ─── Internal TOTP Functions ────────────────────────────────────────────────

function generateTOTPCode(secret: string, timeStep: number): string {
  const secretBuffer = base32Decode(secret);

  // Convert time step to 8-byte big-endian buffer
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeUInt32BE(0, 0);
  timeBuffer.writeUInt32BE(timeStep, 4);

  // HMAC-SHA1
  const hmac = crypto.createHmac("sha1", secretBuffer);
  hmac.update(timeBuffer);
  const hash = hmac.digest();

  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, TOTP_DIGITS);
  return otp.toString().padStart(TOTP_DIGITS, "0");
}

function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const bytes = crypto.randomBytes(BACKUP_CODE_LENGTH);
    const code = bytes
      .toString("hex")
      .toUpperCase()
      .slice(0, BACKUP_CODE_LENGTH);
    // Format as XXXX-XXXX for readability
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

// Constant-time comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return crypto.timingSafeEqual(bufA, bufB);
}

// Base32 encoding (RFC 4648)
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(encoded: string): Buffer {
  const cleaned = encoded.replace(/[=\s]/g, "").toUpperCase();
  const output: number[] = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_CHARS.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}
