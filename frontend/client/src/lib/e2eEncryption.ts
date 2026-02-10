/**
 * E2E ENCRYPTION MODULE — EusoTrip Secure Messaging
 * 
 * Architecture:
 * - ECDH (P-256) for key exchange between users
 * - AES-256-GCM for symmetric message encryption
 * - Per-conversation derived keys (HKDF)
 * - Group channels use a shared AES key encrypted per-member
 * 
 * Private keys NEVER leave the client device.
 * Only public keys are stored on the server.
 */

// ─── KEY GENERATION ──────────────────────────────────────────────────────────

/**
 * Generate an ECDH key pair for the current user.
 * The private key stays in IndexedDB; the public key goes to the server.
 */
export async function generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true, // extractable — needed to export/import
    ["deriveKey", "deriveBits"]
  );

  const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privateKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);

  return {
    publicKey: JSON.stringify(publicKeyJwk),
    privateKey: JSON.stringify(privateKeyJwk),
  };
}

// ─── KEY IMPORT / EXPORT ─────────────────────────────────────────────────────

export async function importPublicKey(jwkString: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkString);
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );
}

export async function importPrivateKey(jwkString: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkString);
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );
}

// ─── KEY DERIVATION ──────────────────────────────────────────────────────────

/**
 * Derive a shared AES-256-GCM key from our private key + their public key.
 * This is the core of ECDH — both sides derive the same shared secret.
 */
export async function deriveSharedKey(
  myPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey,
  salt?: string
): Promise<CryptoKey> {
  // ECDH key agreement — produces raw shared bits
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: theirPublicKey },
    myPrivateKey,
    256
  );

  // HKDF to derive a proper AES key from the shared bits
  const hkdfKey = await crypto.subtle.importKey(
    "raw",
    sharedBits,
    "HKDF",
    false,
    ["deriveKey"]
  );

  const encoder = new TextEncoder();
  const saltBuffer = encoder.encode(salt || "eusotrip-e2e-v1");
  const info = encoder.encode("eusotrip-msg-encrypt");

  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: saltBuffer, info },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ─── SYMMETRIC ENCRYPTION (AES-256-GCM) ─────────────────────────────────────

/**
 * Encrypt a plaintext message using AES-256-GCM.
 * Returns base64-encoded ciphertext with IV prepended.
 */
export async function encryptMessage(key: CryptoKey, plaintext: string): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    encoder.encode(plaintext)
  );

  // Prepend IV to ciphertext and base64 encode
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return arrayBufferToBase64(combined.buffer);
}

/**
 * Decrypt an AES-256-GCM encrypted message.
 * Expects base64-encoded data with IV prepended.
 */
export async function decryptMessage(key: CryptoKey, encryptedBase64: string): Promise<string> {
  const combined = base64ToArrayBuffer(encryptedBase64);
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

// ─── GROUP / CHANNEL ENCRYPTION ──────────────────────────────────────────────

/**
 * Generate a random AES-256-GCM key for a group/channel.
 * This key is then encrypted for each member using their public key.
 */
export async function generateGroupKey(): Promise<{ key: CryptoKey; rawKey: string }> {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const raw = await crypto.subtle.exportKey("raw", key);
  return { key, rawKey: arrayBufferToBase64(raw) };
}

/**
 * Import a raw AES key from base64.
 */
export async function importGroupKey(rawKeyBase64: string): Promise<CryptoKey> {
  const raw = base64ToArrayBuffer(rawKeyBase64);
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a group key for a specific member using ECDH.
 * The member can decrypt it with their private key + the encryptor's public key.
 */
export async function encryptGroupKeyForMember(
  groupRawKey: string,
  myPrivateKey: CryptoKey,
  memberPublicKey: CryptoKey
): Promise<string> {
  const sharedKey = await deriveSharedKey(myPrivateKey, memberPublicKey, "eusotrip-group-key");
  return encryptMessage(sharedKey, groupRawKey);
}

/**
 * Decrypt a group key received from the channel creator.
 */
export async function decryptGroupKeyFromCreator(
  encryptedGroupKey: string,
  myPrivateKey: CryptoKey,
  creatorPublicKey: CryptoKey
): Promise<CryptoKey> {
  const sharedKey = await deriveSharedKey(myPrivateKey, creatorPublicKey, "eusotrip-group-key");
  const rawKeyBase64 = await decryptMessage(sharedKey, encryptedGroupKey);
  return importGroupKey(rawKeyBase64);
}

// ─── LOCAL KEY STORAGE (IndexedDB) ───────────────────────────────────────────

const DB_NAME = "eusotrip_e2e";
const STORE_NAME = "keys";
const DB_VERSION = 1;

function openKeyStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storePrivateKey(userId: string, privateKeyJwk: string): Promise<void> {
  const db = await openKeyStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(privateKeyJwk, `privkey_${userId}`);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getStoredPrivateKey(userId: string): Promise<string | null> {
  const db = await openKeyStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(`privkey_${userId}`);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function storeGroupKey(channelId: string, rawKeyBase64: string): Promise<void> {
  const db = await openKeyStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(rawKeyBase64, `groupkey_${channelId}`);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getStoredGroupKey(channelId: string): Promise<string | null> {
  const db = await openKeyStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(`groupkey_${channelId}`);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ─── ENCRYPTION PREFIX ───────────────────────────────────────────────────────
// Encrypted messages are prefixed so the system knows to decrypt them.

export const E2E_PREFIX = "🔒e2e:";

export function isEncryptedMessage(content: string): boolean {
  return content.startsWith(E2E_PREFIX);
}

export function wrapEncrypted(ciphertext: string): string {
  return `${E2E_PREFIX}${ciphertext}`;
}

export function unwrapEncrypted(content: string): string {
  return content.replace(E2E_PREFIX, "");
}
