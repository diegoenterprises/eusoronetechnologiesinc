/**
 * MFA SERVICE — TOTP-based Multi-Factor Authentication
 * Uses otpauth for TOTP generation/verification, qrcode for QR data URIs.
 * Secrets stored in mfaTokens table (AES-256-GCM encrypted at rest).
 */

import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import crypto from "crypto";
import { getDb } from "../db";
import { mfaTokens, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "../_core/logger";

// ─── Encryption helpers (AES-256-GCM for TOTP secrets at rest) ──────────────

const ENC_KEY = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "dev-fallback-key-32-chars-min!!!!!";
const KEY_BUFFER = crypto.createHash("sha256").update(ENC_KEY).digest();

function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY_BUFFER, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decrypt(ciphertext: string): string {
  const [ivHex, tagHex, encHex] = ciphertext.split(":");
  if (!ivHex || !tagHex || !encHex) throw new Error("Invalid encrypted format");
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY_BUFFER, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return decipher.update(encHex, "hex", "utf8") + decipher.final("utf8");
}

// ─── Backup code generation ─────────────────────────────────────────────────

function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

// ─── TOTP helpers ───────────────────────────────────────────────────────────

function createTOTP(secret: OTPAuth.Secret, email: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: "EusoTrip",
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });
}

// ─── Exported MFA service ───────────────────────────────────────────────────

export const mfaService = {
  /**
   * Begin TOTP setup: generates secret + QR code data URI.
   * Does NOT enable MFA yet — user must verify a code first.
   */
  async setupTOTP(userId: number, email: string): Promise<{
    secret: string;
    qrDataUrl: string;
    otpauthUri: string;
    backupCodes: string[];
  }> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Generate new secret
    const secret = new OTPAuth.Secret({ size: 20 });
    const totp = createTOTP(secret, email);
    const otpauthUri = totp.toString();
    const qrDataUrl = await QRCode.toDataURL(otpauthUri);
    const backupCodes = generateBackupCodes();

    // Upsert pending MFA token (not enabled yet)
    const [existing] = await db.select({ id: mfaTokens.id })
      .from(mfaTokens)
      .where(and(eq(mfaTokens.userId, userId), eq(mfaTokens.method, "totp")))
      .limit(1);

    const encryptedSecret = encrypt(secret.base32);
    const encryptedBackups = backupCodes.map(c => encrypt(c));

    if (existing) {
      await db.update(mfaTokens).set({
        secret: encryptedSecret,
        backupCodes: encryptedBackups,
        isEnabled: false,
      }).where(eq(mfaTokens.id, existing.id));
    } else {
      await db.insert(mfaTokens).values({
        userId,
        secret: encryptedSecret,
        method: "totp",
        isEnabled: false,
        backupCodes: encryptedBackups,
      } as any);
    }

    logger.info(`[MFA] TOTP setup initiated for user ${userId}`);
    return { secret: secret.base32, qrDataUrl, otpauthUri, backupCodes };
  },

  /**
   * Verify a TOTP code during setup to confirm the user scanned the QR code.
   * On success, enables MFA for the user.
   */
  async verifySetup(userId: number, code: string): Promise<{ success: boolean; message: string }> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const [token] = await db.select()
      .from(mfaTokens)
      .where(and(eq(mfaTokens.userId, userId), eq(mfaTokens.method, "totp")))
      .limit(1);

    if (!token) {
      return { success: false, message: "No MFA setup found. Please start setup first." };
    }

    const secretBase32 = decrypt(token.secret);
    const secret = OTPAuth.Secret.fromBase32(secretBase32);
    const totp = createTOTP(secret, "");
    const delta = totp.validate({ token: code, window: 1 });

    if (delta === null) {
      return { success: false, message: "Invalid verification code. Please try again." };
    }

    // Enable MFA
    await db.update(mfaTokens).set({ isEnabled: true }).where(eq(mfaTokens.id, token.id));

    // Mark user metadata
    try {
      const [user] = await db.select({ id: users.id, metadata: users.metadata })
        .from(users).where(eq(users.id, userId)).limit(1);
      if (user) {
        let meta: any = {};
        try { meta = user.metadata ? JSON.parse(user.metadata as string) : {}; } catch {}
        meta.twoFactorEnabled = true;
        meta.twoFactorMethod = "totp";
        await db.update(users).set({ metadata: JSON.stringify(meta) }).where(eq(users.id, userId));
      }
    } catch {}

    logger.info(`[MFA] TOTP enabled for user ${userId}`);
    return { success: true, message: "MFA enabled successfully." };
  },

  /**
   * Verify a TOTP code during login.
   * Also accepts backup codes as fallback.
   */
  async verifyLogin(userId: number, code: string): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;

    const [token] = await db.select()
      .from(mfaTokens)
      .where(and(eq(mfaTokens.userId, userId), eq(mfaTokens.method, "totp"), eq(mfaTokens.isEnabled, true)))
      .limit(1);

    if (!token) return false;

    // Try TOTP code first
    try {
      const secretBase32 = decrypt(token.secret);
      const secret = OTPAuth.Secret.fromBase32(secretBase32);
      const totp = createTOTP(secret, "");
      const delta = totp.validate({ token: code, window: 1 });
      if (delta !== null) {
        await db.update(mfaTokens).set({ lastUsedAt: new Date() } as any).where(eq(mfaTokens.id, token.id));
        return true;
      }
    } catch (e: any) {
      logger.error(`[MFA] TOTP verify error for user ${userId}:`, e.message);
    }

    // Try backup codes
    try {
      const storedBackups: string[] = token.backupCodes ? (Array.isArray(token.backupCodes) ? token.backupCodes : JSON.parse(token.backupCodes as any)) : [];
      const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
      for (let i = 0; i < storedBackups.length; i++) {
        try {
          const decrypted = decrypt(storedBackups[i]);
          const normalizedBackup = decrypted.replace(/[^A-Z0-9]/g, "");
          if (normalizedBackup === normalizedCode) {
            // Consume the backup code (one-time use)
            storedBackups.splice(i, 1);
            await db.update(mfaTokens).set({
              backupCodes: storedBackups as any,
              lastUsedAt: new Date(),
            } as any).where(eq(mfaTokens.id, token.id));
            logger.info(`[MFA] Backup code used by user ${userId}, ${storedBackups.length} remaining`);
            return true;
          }
        } catch {}
      }
    } catch {}

    return false;
  },

  /**
   * Check if a user has TOTP MFA enabled.
   */
  async isEnabled(userId: number): Promise<{ enabled: boolean; method: string | null }> {
    const db = await getDb();
    if (!db) return { enabled: false, method: null };

    const [token] = await db.select({ method: mfaTokens.method, isEnabled: mfaTokens.isEnabled })
      .from(mfaTokens)
      .where(and(eq(mfaTokens.userId, userId), eq(mfaTokens.isEnabled, true)))
      .limit(1);

    return { enabled: !!token, method: token?.method || null };
  },

  /**
   * Disable MFA for a user.
   */
  async disable(userId: number): Promise<{ success: boolean }> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    await db.update(mfaTokens).set({ isEnabled: false })
      .where(and(eq(mfaTokens.userId, userId), eq(mfaTokens.method, "totp")));

    // Update user metadata
    try {
      const [user] = await db.select({ id: users.id, metadata: users.metadata })
        .from(users).where(eq(users.id, userId)).limit(1);
      if (user) {
        let meta: any = {};
        try { meta = user.metadata ? JSON.parse(user.metadata as string) : {}; } catch {}
        meta.twoFactorEnabled = false;
        delete meta.twoFactorMethod;
        await db.update(users).set({ metadata: JSON.stringify(meta) }).where(eq(users.id, userId));
      }
    } catch {}

    logger.info(`[MFA] TOTP disabled for user ${userId}`);
    return { success: true };
  },

  /**
   * Regenerate backup codes (invalidates old ones).
   */
  async regenerateBackupCodes(userId: number): Promise<{ codes: string[] }> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const [token] = await db.select({ id: mfaTokens.id })
      .from(mfaTokens)
      .where(and(eq(mfaTokens.userId, userId), eq(mfaTokens.method, "totp")))
      .limit(1);

    if (!token) throw new Error("No MFA setup found");

    const newCodes = generateBackupCodes();
    const encryptedCodes = newCodes.map(c => encrypt(c));
    await db.update(mfaTokens).set({ backupCodes: encryptedCodes as any }).where(eq(mfaTokens.id, token.id));

    logger.info(`[MFA] Backup codes regenerated for user ${userId}`);
    return { codes: newCodes };
  },
};
