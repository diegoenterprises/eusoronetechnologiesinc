/**
 * WS-P0-019R: Document Content Hashing
 * Hashes document content (BOL, POD, agreements) and stores in document_hashes table.
 * Links versions via previousVersionHash for tamper-evident chain.
 */

import crypto from "crypto";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "../../../_core/logger";
import { getDb } from "../../../db";
import { documentHashes } from "../../../../drizzle/schema";

const HASH_ALGORITHM = "sha256";

/**
 * Hash arbitrary content using SHA-256
 */
export function hashContent(content: string | object): string {
  const raw = typeof content === "string" ? content : JSON.stringify(content);
  return crypto.createHash(HASH_ALGORITHM).update(raw).digest("hex");
}

/**
 * Add a document to the hash chain.
 * Automatically links to the previous version of the same document if it exists.
 */
export async function addDocumentHash(params: {
  documentType: string;
  documentId: number;
  content: string | object;
  userId?: number;
  metadata?: Record<string, any>;
}): Promise<{ contentHash: string; version: number } | null> {
  const db = await getDb();
  if (!db) return null;

  const contentHash = hashContent(params.content);

  // Find previous version of this document
  let previousVersionHash: string | null = null;
  let version = 1;
  try {
    const [prev] = await db.select({ contentHash: documentHashes.contentHash, version: documentHashes.version })
      .from(documentHashes)
      .where(and(
        eq(documentHashes.documentType, params.documentType),
        eq(documentHashes.documentId, params.documentId),
      ))
      .orderBy(desc(documentHashes.version))
      .limit(1);

    if (prev) {
      previousVersionHash = prev.contentHash;
      version = (prev.version || 1) + 1;
    }
  } catch { /* first version */ }

  try {
    await db.insert(documentHashes).values({
      documentType: params.documentType,
      documentId: params.documentId,
      version,
      contentHash,
      previousVersionHash,
      userId: params.userId,
      metadata: params.metadata || null,
    });
    return { contentHash, version };
  } catch (err) {
    logger.error("[DocumentHash] Failed to record hash:", (err as Error).message);
    return null;
  }
}

/**
 * Verify a document's content against its stored hash.
 */
export async function verifyDocumentHash(params: {
  documentType: string;
  documentId: number;
  content: string | object;
  version?: number;
}): Promise<{ valid: boolean; storedHash: string | null; computedHash: string }> {
  const db = await getDb();
  const computedHash = hashContent(params.content);
  if (!db) return { valid: false, storedHash: null, computedHash };

  try {
    const query = params.version
      ? and(
          eq(documentHashes.documentType, params.documentType),
          eq(documentHashes.documentId, params.documentId),
          eq(documentHashes.version, params.version),
        )
      : and(
          eq(documentHashes.documentType, params.documentType),
          eq(documentHashes.documentId, params.documentId),
        );

    const [record] = await db.select({ contentHash: documentHashes.contentHash })
      .from(documentHashes)
      .where(query)
      .orderBy(desc(documentHashes.version))
      .limit(1);

    if (!record) return { valid: false, storedHash: null, computedHash };

    return {
      valid: record.contentHash === computedHash,
      storedHash: record.contentHash,
      computedHash,
    };
  } catch {
    return { valid: false, storedHash: null, computedHash };
  }
}

/**
 * Get the full version history of a document's hashes.
 */
export async function getDocumentHashHistory(documentType: string, documentId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select()
      .from(documentHashes)
      .where(and(
        eq(documentHashes.documentType, documentType),
        eq(documentHashes.documentId, documentId),
      ))
      .orderBy(desc(documentHashes.version));
  } catch {
    return [];
  }
}
