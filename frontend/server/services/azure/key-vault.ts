/**
 * AZURE KEY VAULT INTEGRATION
 * Manages secrets, encryption keys, and certificates via Azure Key Vault.
 *
 * Uses Azure Managed Identity in production (no credentials in code).
 * Falls back to environment variables in development.
 *
 * Key management responsibilities:
 *   - Master encryption key for AES-256-GCM field encryption
 *   - JWT signing key (RS256 in production)
 *   - Stripe API keys and webhook secrets
 *   - Database connection strings
 *   - Redis connection strings
 */

import crypto from "crypto";

// Azure Key Vault configuration
const VAULT_URL = process.env.AZURE_KEY_VAULT_URL || "";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Cache for secrets (refresh every 5 minutes)
const secretCache: Map<string, { value: string; fetchedAt: number }> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Known secret names in Key Vault
 */
export const SecretNames = {
  ENCRYPTION_KEY: "eusotrip-encryption-key",
  JWT_SECRET: "eusotrip-jwt-secret",
  DATABASE_URL: "eusotrip-database-url",
  REDIS_URL: "eusotrip-redis-url",
  STRIPE_SECRET_KEY: "eusotrip-stripe-secret",
  STRIPE_WEBHOOK_SECRET: "eusotrip-stripe-webhook-secret",
  GEMINI_API_KEY: "eusotrip-gemini-api-key",
  FMCSA_API_KEY: "eusotrip-fmcsa-api-key",
  GOOGLE_MAPS_KEY: "eusotrip-google-maps-key",
} as const;

/**
 * Get a secret from Azure Key Vault (with caching).
 * In development, falls back to environment variables.
 */
export async function getSecret(secretName: string): Promise<string | null> {
  // Check cache first
  const cached = secretCache.get(secretName);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.value;
  }

  if (IS_PRODUCTION && VAULT_URL) {
    try {
      // Dynamic require to avoid bundling Azure SDK in development
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { DefaultAzureCredential } = require("@azure/identity") as any;
      const { SecretClient } = require("@azure/keyvault-secrets") as any;

      const credential = new DefaultAzureCredential();
      const client = new SecretClient(VAULT_URL, credential);
      const secret = await client.getSecret(secretName);

      if (secret.value) {
        secretCache.set(secretName, { value: secret.value, fetchedAt: Date.now() });
        return secret.value;
      }
    } catch (err) {
      console.error(`[KeyVault] Failed to get secret '${secretName}':`, err);
    }
  }

  // Development fallback: environment variables
  const envMap: Record<string, string> = {
    [SecretNames.ENCRYPTION_KEY]: "ENCRYPTION_KEY",
    [SecretNames.JWT_SECRET]: "JWT_SECRET",
    [SecretNames.DATABASE_URL]: "DATABASE_URL",
    [SecretNames.REDIS_URL]: "REDIS_URL",
    [SecretNames.STRIPE_SECRET_KEY]: "STRIPE_SECRET_KEY",
    [SecretNames.STRIPE_WEBHOOK_SECRET]: "STRIPE_WEBHOOK_SECRET",
    [SecretNames.GEMINI_API_KEY]: "GEMINI_API_KEY",
    [SecretNames.FMCSA_API_KEY]: "FMCSA_API_KEY",
    [SecretNames.GOOGLE_MAPS_KEY]: "GOOGLE_MAPS_API_KEY",
  };

  const envName = envMap[secretName] || secretName.toUpperCase().replace(/-/g, "_");
  return process.env[envName] || null;
}

/**
 * ENVELOPE ENCRYPTION
 * Uses a Master Key (from Key Vault) to wrap per-record Data Encryption Keys (DEKs).
 *
 * Flow:
 *   1. Generate a random DEK for each sensitive record
 *   2. Encrypt the data with the DEK (AES-256-GCM)
 *   3. Wrap (encrypt) the DEK with the Master Key
 *   4. Store wrapped DEK + ciphertext together
 *   5. On read: unwrap DEK with Master Key, then decrypt data
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const AUTH_TAG_LENGTH = 16;

export interface EnvelopeEncryptedData {
  wrappedKey: string;     // DEK encrypted with Master Key (base64)
  iv: string;             // Initialization vector (base64)
  authTag: string;        // GCM authentication tag (base64)
  ciphertext: string;     // Data encrypted with DEK (base64)
  keyVersion: string;     // Master key version for rotation
}

/**
 * Encrypt data using envelope encryption.
 */
export async function envelopeEncrypt(
  plaintext: string,
  masterKeyName: string = SecretNames.ENCRYPTION_KEY
): Promise<EnvelopeEncryptedData> {
  // Get master key
  const masterKey = await getSecret(masterKeyName);
  if (!masterKey) throw new Error("Master encryption key not available");

  // Generate random DEK
  const dek = crypto.randomBytes(KEY_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Encrypt data with DEK
  const cipher = crypto.createCipheriv(ALGORITHM, dek, iv, { authTagLength: AUTH_TAG_LENGTH });
  let encrypted = cipher.update(plaintext, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Wrap DEK with Master Key
  const masterKeyBuffer = deriveKeyFromSecret(masterKey);
  const wrapIv = crypto.randomBytes(IV_LENGTH);
  const wrapCipher = crypto.createCipheriv(ALGORITHM, masterKeyBuffer, wrapIv, { authTagLength: AUTH_TAG_LENGTH });
  let wrappedKey = wrapCipher.update(dek);
  wrappedKey = Buffer.concat([wrappedKey, wrapCipher.final()]);
  const wrapAuthTag = wrapCipher.getAuthTag();

  // Combine wrap IV + wrap auth tag + wrapped key
  const wrappedKeyFull = Buffer.concat([wrapIv, wrapAuthTag, wrappedKey]);

  return {
    wrappedKey: wrappedKeyFull.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    ciphertext: encrypted.toString("base64"),
    keyVersion: "v1",
  };
}

/**
 * Decrypt envelope-encrypted data.
 */
export async function envelopeDecrypt(
  data: EnvelopeEncryptedData,
  masterKeyName: string = SecretNames.ENCRYPTION_KEY
): Promise<string> {
  // Get master key
  const masterKey = await getSecret(masterKeyName);
  if (!masterKey) throw new Error("Master encryption key not available");

  // Unwrap DEK
  const masterKeyBuffer = deriveKeyFromSecret(masterKey);
  const wrappedKeyFull = Buffer.from(data.wrappedKey, "base64");

  const wrapIv = wrappedKeyFull.subarray(0, IV_LENGTH);
  const wrapAuthTag = wrappedKeyFull.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const wrappedKey = wrappedKeyFull.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const unwrapDecipher = crypto.createDecipheriv(ALGORITHM, masterKeyBuffer, wrapIv, { authTagLength: AUTH_TAG_LENGTH });
  unwrapDecipher.setAuthTag(wrapAuthTag);
  let dek = unwrapDecipher.update(wrappedKey);
  dek = Buffer.concat([dek, unwrapDecipher.final()]);

  // Decrypt data with DEK
  const iv = Buffer.from(data.iv, "base64");
  const authTag = Buffer.from(data.authTag, "base64");
  const ciphertext = Buffer.from(data.ciphertext, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, dek, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
}

/**
 * Clear the secret cache (use after key rotation).
 */
export function clearSecretCache(): void {
  secretCache.clear();
}

/**
 * Health check: verify Key Vault is accessible.
 */
export async function checkKeyVaultHealth(): Promise<{
  available: boolean;
  method: string;
  error?: string;
}> {
  if (IS_PRODUCTION && VAULT_URL) {
    try {
      const { DefaultAzureCredential } = require("@azure/identity") as any;
      const { SecretClient } = require("@azure/keyvault-secrets") as any;
      const credential = new DefaultAzureCredential();
      const client = new SecretClient(VAULT_URL, credential);

      // List one secret to verify access
      const iter = client.listPropertiesOfSecrets();
      await iter.next();
      return { available: true, method: "Azure Key Vault (Managed Identity)" };
    } catch (err) {
      return { available: false, method: "Azure Key Vault", error: String(err) };
    }
  }

  // Development: check env vars
  const hasKey = !!process.env.ENCRYPTION_KEY || !!process.env.JWT_SECRET;
  return {
    available: hasKey,
    method: "Environment Variables (development)",
    error: hasKey ? undefined : "No encryption keys configured",
  };
}

// ─── Internal ───────────────────────────────────────────────────────────────

function deriveKeyFromSecret(secret: string): Buffer {
  // Use PBKDF2 to derive a 256-bit key from the secret string
  return crypto.pbkdf2Sync(secret, "eusotrip-kv-salt", 10000, KEY_LENGTH, "sha256");
}
