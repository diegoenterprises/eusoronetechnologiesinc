/**
 * AES-256-GCM ENCRYPTION SERVICE
 * Provides authenticated encryption for sensitive data at rest.
 * Used for: SSN, CDL numbers, bank accounts, TWIC, EIN, etc.
 *
 * Algorithm: AES-256-GCM (Galois/Counter Mode)
 *   - 256-bit key derived from ENCRYPTION_KEY env var via PBKDF2
 *   - 96-bit random IV per encryption (never reused)
 *   - 128-bit authentication tag (tamper detection)
 *   - PBKDF2 with 100,000 iterations + SHA-512 for key derivation
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits - NIST recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits
const SALT_LENGTH = 16; // 128 bits
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_DIGEST = "sha512";
const ENCODING = "base64" as const;

// Separator used in the stored ciphertext format
const SEPARATOR = ":";

/**
 * Derive a 256-bit key from the master encryption key using PBKDF2
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    masterKey,
    salt,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    PBKDF2_DIGEST
  );
}

/**
 * Get the master encryption key from environment.
 * In production, this MUST be set via Azure Key Vault or equivalent.
 */
function getMasterKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[ENCRYPTION] ENCRYPTION_KEY environment variable is required in production. " +
        "Set it via Azure Key Vault or your secret manager."
      );
    }
    // Development fallback - NEVER use in production
    return "eusotrip-dev-encryption-key-32chars!";
  }
  return key;
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns: base64(salt):base64(iv):base64(authTag):base64(ciphertext)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return "";

  const masterKey = getMasterKey();
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(masterKey, salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const authTag = cipher.getAuthTag();

  return [
    salt.toString(ENCODING),
    iv.toString(ENCODING),
    authTag.toString(ENCODING),
    encrypted.toString(ENCODING),
  ].join(SEPARATOR);
}

/**
 * Decrypt a ciphertext string encrypted with encrypt().
 * Verifies authentication tag to detect tampering.
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) return "";

  const masterKey = getMasterKey();
  const parts = ciphertext.split(SEPARATOR);

  if (parts.length !== 4) {
    throw new Error("[ENCRYPTION] Invalid ciphertext format");
  }

  const [saltB64, ivB64, authTagB64, encryptedB64] = parts;
  const salt = Buffer.from(saltB64, ENCODING);
  const iv = Buffer.from(ivB64, ENCODING);
  const authTag = Buffer.from(authTagB64, ENCODING);
  const encrypted = Buffer.from(encryptedB64, ENCODING);

  const key = deriveKey(masterKey, salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
}

/**
 * Hash a value for indexing (allows lookups without decrypting all records).
 * Uses HMAC-SHA256 so it's deterministic for the same input + key.
 */
export function hashForIndex(value: string): string {
  if (!value) return "";
  const masterKey = getMasterKey();
  return crypto
    .createHmac("sha256", masterKey)
    .update(value.toLowerCase().trim())
    .digest("hex");
}

/**
 * Mask a sensitive value for display (e.g., "***-**-1234" for SSN)
 */
export function maskSSN(ssn: string): string {
  if (!ssn || ssn.length < 4) return "***-**-****";
  return `***-**-${ssn.slice(-4)}`;
}

export function maskCDL(cdl: string): string {
  if (!cdl || cdl.length < 4) return "****...****";
  return `${cdl.slice(0, 2)}****${cdl.slice(-2)}`;
}

export function maskBankAccount(account: string): string {
  if (!account || account.length < 4) return "****...****";
  return `****${account.slice(-4)}`;
}

export function maskEIN(ein: string): string {
  if (!ein || ein.length < 4) return "**-***-****";
  return `**-***${ein.slice(-4)}`;
}

/**
 * Validate that encryption is working correctly (self-test).
 * Should be called at server startup.
 */
export function validateEncryption(): boolean {
  try {
    const testValue = "EusoTrip-AES256-SelfTest-" + Date.now();
    const encrypted = encrypt(testValue);
    const decrypted = decrypt(encrypted);

    if (decrypted !== testValue) {
      console.error("[ENCRYPTION] Self-test FAILED: decrypted value does not match");
      return false;
    }

    // Verify format
    const parts = encrypted.split(SEPARATOR);
    if (parts.length !== 4) {
      console.error("[ENCRYPTION] Self-test FAILED: invalid ciphertext format");
      return false;
    }

    console.log("[ENCRYPTION] AES-256-GCM self-test PASSED");
    return true;
  } catch (error) {
    console.error("[ENCRYPTION] Self-test FAILED:", error);
    return false;
  }
}

export const encryptionService = {
  encrypt,
  decrypt,
  hashForIndex,
  maskSSN,
  maskCDL,
  maskBankAccount,
  maskEIN,
  validateEncryption,
};

export default encryptionService;
