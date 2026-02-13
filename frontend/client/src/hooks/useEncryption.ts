/**
 * useEncryption Hook — EusoTrip E2E Encryption
 * 
 * Manages the user's encryption key pair lifecycle:
 * - Generates keys on first use
 * - Stores private key locally in IndexedDB
 * - Publishes public key to the server
 * - Provides encrypt/decrypt functions for messages
 * - Handles group channel key management
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import {
  generateKeyPair,
  importPrivateKey,
  importPublicKey,
  deriveSharedKey,
  encryptMessage,
  decryptMessage,
  generateGroupKey,
  importGroupKey,
  encryptGroupKeyForMember,
  decryptGroupKeyFromCreator,
  storePrivateKey,
  getStoredPrivateKey,
  storeGroupKey,
  getStoredGroupKey,
  isEncryptedMessage,
  wrapEncrypted,
  unwrapEncrypted,
  E2E_PREFIX,
} from "@/lib/e2eEncryption";

interface UseEncryptionOptions {
  userId?: string;
  enabled?: boolean;
}

export function useEncryption({ userId, enabled = true }: UseEncryptionOptions) {
  const [ready, setReady] = useState(false);
  const [myPrivateKey, setMyPrivateKey] = useState<CryptoKey | null>(null);
  const [myPublicKeyJwk, setMyPublicKeyJwk] = useState<string | null>(null);
  const derivedKeyCache = useRef<Map<string, CryptoKey>>(new Map());
  const groupKeyCache = useRef<Map<string, CryptoKey>>(new Map());

  // tRPC mutations
  const storePublicKeyMutation = (trpc as any).encryption?.storePublicKey?.useMutation?.() || null;

  // Initialize encryption keys for the current user
  useEffect(() => {
    if (!userId || !enabled) return;

    (async () => {
      try {
        // Check if we already have a private key stored locally
        const storedPrivKey = await getStoredPrivateKey(userId);

        if (storedPrivKey) {
          // Import existing private key
          const privKey = await importPrivateKey(storedPrivKey);
          setMyPrivateKey(privKey);
          setReady(true);
        } else {
          // First time — generate a new key pair
          const { publicKey, privateKey } = await generateKeyPair();

          // Store private key locally (never sent to server)
          await storePrivateKey(userId, privateKey);

          // Import for use
          const privKey = await importPrivateKey(privateKey);
          setMyPrivateKey(privKey);
          setMyPublicKeyJwk(publicKey);

          // Publish public key to server
          if (storePublicKeyMutation?.mutate) {
            storePublicKeyMutation.mutate({ publicKey });
          }

          setReady(true);
        }
      } catch (error) {
        console.error("[E2E] Key initialization failed:", error);
        // Encryption failed to init — app still works, just without E2E
        setReady(true);
      }
    })();
  }, [userId, enabled]);

  /**
   * Encrypt a message for a direct conversation.
   * Uses ECDH to derive a shared key from our private key + recipient's public key.
   */
  const encryptForUser = useCallback(
    async (recipientPublicKeyJwk: string, plaintext: string): Promise<string> => {
      if (!myPrivateKey || !recipientPublicKeyJwk) return plaintext;

      try {
        // Check cache
        const cacheKey = recipientPublicKeyJwk.substring(0, 64);
        let sharedKey = derivedKeyCache.current.get(cacheKey);

        if (!sharedKey) {
          const recipientPubKey = await importPublicKey(recipientPublicKeyJwk);
          sharedKey = await deriveSharedKey(myPrivateKey, recipientPubKey);
          derivedKeyCache.current.set(cacheKey, sharedKey);
        }

        const encrypted = await encryptMessage(sharedKey, plaintext);
        return wrapEncrypted(encrypted);
      } catch (error) {
        console.error("[E2E] Encryption failed:", error);
        return plaintext; // Fallback to plaintext
      }
    },
    [myPrivateKey]
  );

  /**
   * Decrypt a message from a direct conversation.
   */
  const decryptFromUser = useCallback(
    async (senderPublicKeyJwk: string, content: string): Promise<string> => {
      if (!myPrivateKey || !isEncryptedMessage(content)) return content;

      try {
        const cacheKey = senderPublicKeyJwk.substring(0, 64);
        let sharedKey = derivedKeyCache.current.get(cacheKey);

        if (!sharedKey) {
          const senderPubKey = await importPublicKey(senderPublicKeyJwk);
          sharedKey = await deriveSharedKey(myPrivateKey, senderPubKey);
          derivedKeyCache.current.set(cacheKey, sharedKey);
        }

        const ciphertext = unwrapEncrypted(content);
        return await decryptMessage(sharedKey, ciphertext);
      } catch (error) {
        console.error("[E2E] Decryption failed:", error);
        return "[Encrypted message - unable to decrypt]";
      }
    },
    [myPrivateKey]
  );

  /**
   * Encrypt a message for a group channel using the channel's shared AES key.
   */
  const encryptForChannel = useCallback(
    async (channelId: string, plaintext: string): Promise<string> => {
      try {
        let groupKey = groupKeyCache.current.get(channelId);

        if (!groupKey) {
          const storedRaw = await getStoredGroupKey(channelId);
          if (storedRaw) {
            groupKey = await importGroupKey(storedRaw);
            groupKeyCache.current.set(channelId, groupKey);
          }
        }

        if (!groupKey) return plaintext; // No group key available yet

        const encrypted = await encryptMessage(groupKey, plaintext);
        return wrapEncrypted(encrypted);
      } catch (error) {
        console.error("[E2E] Channel encryption failed:", error);
        return plaintext;
      }
    },
    []
  );

  /**
   * Decrypt a message from a group channel.
   */
  const decryptFromChannel = useCallback(
    async (channelId: string, content: string): Promise<string> => {
      if (!isEncryptedMessage(content)) return content;

      try {
        let groupKey = groupKeyCache.current.get(channelId);

        if (!groupKey) {
          const storedRaw = await getStoredGroupKey(channelId);
          if (storedRaw) {
            groupKey = await importGroupKey(storedRaw);
            groupKeyCache.current.set(channelId, groupKey);
          }
        }

        if (!groupKey) return "[Encrypted - missing channel key]";

        const ciphertext = unwrapEncrypted(content);
        return await decryptMessage(groupKey, ciphertext);
      } catch (error) {
        console.error("[E2E] Channel decryption failed:", error);
        return "[Encrypted message - unable to decrypt]";
      }
    },
    []
  );

  /**
   * Initialize a group key for a new channel.
   * The creator generates the key and encrypts it for each member.
   */
  const initChannelKey = useCallback(
    async (channelId: string): Promise<string | null> => {
      try {
        const { key, rawKey } = await generateGroupKey();
        await storeGroupKey(channelId, rawKey);
        groupKeyCache.current.set(channelId, key);
        return rawKey;
      } catch (error) {
        console.error("[E2E] Channel key init failed:", error);
        return null;
      }
    },
    []
  );

  /**
   * Import a channel group key received from another member.
   */
  const receiveChannelKey = useCallback(
    async (
      channelId: string,
      encryptedGroupKey: string,
      creatorPublicKeyJwk: string
    ): Promise<boolean> => {
      if (!myPrivateKey) return false;

      try {
        const creatorPubKey = await importPublicKey(creatorPublicKeyJwk);
        const groupKey = await decryptGroupKeyFromCreator(
          encryptedGroupKey,
          myPrivateKey,
          creatorPubKey
        );
        const raw = await crypto.subtle.exportKey("raw", groupKey);
        const rawBase64 = btoa(String.fromCharCode(...new Uint8Array(raw)));
        await storeGroupKey(channelId, rawBase64);
        groupKeyCache.current.set(channelId, groupKey);
        return true;
      } catch (error) {
        console.error("[E2E] Channel key receive failed:", error);
        return false;
      }
    },
    [myPrivateKey]
  );

  /**
   * Batch decrypt an array of messages (for display).
   * Handles both DM and channel messages.
   */
  const batchDecrypt = useCallback(
    async (
      msgs: Array<{ content: string; [key: string]: any }>,
      mode: "dm" | "channel",
      contextKey?: string // recipientPublicKey for DM, channelId for channel
    ): Promise<Array<{ content: string; [key: string]: any }>> => {
      if (!contextKey) return msgs;

      return Promise.all(
        msgs.map(async (msg) => {
          if (!isEncryptedMessage(msg.content)) return msg;
          try {
            const decrypted =
              mode === "dm"
                ? await decryptFromUser(contextKey, msg.content)
                : await decryptFromChannel(contextKey, msg.content);
            return { ...msg, content: decrypted, _encrypted: true };
          } catch {
            return { ...msg, content: "[Encrypted message]", _encrypted: true };
          }
        })
      );
    },
    [decryptFromUser, decryptFromChannel]
  );

  return {
    ready,
    myPrivateKey,
    myPublicKeyJwk,
    encryptForUser,
    decryptFromUser,
    encryptForChannel,
    decryptFromChannel,
    initChannelKey,
    receiveChannelKey,
    batchDecrypt,
    isEncrypted: isEncryptedMessage,
    E2E_PREFIX,
  };
}
