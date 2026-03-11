/**
 * GEMINI EMBEDDING SERVICE — Google Gemini Embedding 2
 *
 * Powered by gemini-embedding-001 (text, 3072-dim native) with task-type
 * specialization for optimal retrieval, classification, and similarity.
 *
 * Architecture:
 *   Node.js backend → HTTPS → Google Generative AI API
 *   Uses the same GEMINI_API_KEY as the ESANG chat (gemini-2.5-flash).
 *
 * Task types enable purpose-optimized embeddings:
 *   RETRIEVAL_DOCUMENT  — indexing content for later search
 *   RETRIEVAL_QUERY     — searching indexed content
 *   SEMANTIC_SIMILARITY — comparing two texts for closeness
 *   CLASSIFICATION      — intent detection / categorization
 *   CLUSTERING          — grouping similar items
 *   FACT_VERIFICATION   — compliance / evidence retrieval
 *   CODE_RETRIEVAL_QUERY— DTC fault code lookup
 *   QUESTION_ANSWERING  — user question → knowledge match
 *
 * Multimodal support (gemini-embedding-2-preview):
 *   Embeds images, PDFs, audio, and video into the same vector space as text.
 */

import { logger } from "../../_core/logger";
import { ENV } from "../../_core/env";

// ── Task Types ──────────────────────────────────────────────────────────────
export type GeminiTaskType =
  | "RETRIEVAL_DOCUMENT"
  | "RETRIEVAL_QUERY"
  | "SEMANTIC_SIMILARITY"
  | "CLASSIFICATION"
  | "CLUSTERING"
  | "FACT_VERIFICATION"
  | "CODE_RETRIEVAL_QUERY"
  | "QUESTION_ANSWERING";

// ── Constants ────────────────────────────────────────────────────────────────
const EMBEDDING_DIMS = 1536;                // Balanced quality/storage (Gemini supports 128-3072)
const MAX_BATCH_SIZE = 100;                 // Gemini batchEmbedContents limit
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
const HEALTH_CACHE_TTL_MS = 60_000;
const QUERY_CACHE_MAX = 256;
const QUERY_CACHE_TTL_MS = 300_000;         // 5 min TTL

const GEMINI_MODEL = "gemini-embedding-001";
const GEMINI_MULTIMODAL_MODEL = "gemini-embedding-2-preview";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// ── Types ────────────────────────────────────────────────────────────────────
export interface EmbeddingVector {
  /** Float32 values from Gemini (L2-normalized for sub-3072 dims) */
  values: number[];
  /** Number of dimensions */
  dimensions: number;
}

export interface EmbeddingResult {
  index: number;
  embedding: EmbeddingVector;
  text: string;
}

export interface SimilarityResult {
  index: number;
  score: number;
  text?: string;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, unknown>;
}

export interface StoredEmbedding {
  entityType: string;
  entityId: string;
  embedding: Buffer;
  contentHash: string;
  metadata?: Record<string, unknown>;
}

// ── Gemini API Response Types ────────────────────────────────────────────────
interface GeminiEmbedResponse {
  embedding: { values: number[] };
}

interface GeminiBatchEmbedResponse {
  embeddings: Array<{ values: number[] }>;
}

// ── Fetch with timeout + retry ───────────────────────────────────────────────
async function fetchWithRetry(url: string, init: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const resp = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      if (resp.ok || resp.status < 500) return resp;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 300 * 2 ** attempt));
        continue;
      }
      return resp;
    } catch (err: any) {
      clearTimeout(timer);
      if (attempt >= retries) throw err;
      await new Promise(r => setTimeout(r, 300 * 2 ** attempt));
    }
  }
  throw new Error("[EmbeddingService] fetchWithRetry: exhausted retries");
}

// ── L2 Normalization (required for sub-3072 dimensions) ──────────────────────
function normalizeL2(vec: number[]): number[] {
  let norm = 0;
  for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm === 0) return vec;
  return vec.map(v => v / norm);
}

// ── LRU Query Vector Cache ───────────────────────────────────────────────────
interface CachedVector { vec: EmbeddingVector; ts: number }
class QueryVectorCache {
  private map = new Map<string, CachedVector>();
  private maxSize: number;
  private ttlMs: number;
  hits = 0;
  misses = 0;

  constructor(maxSize = QUERY_CACHE_MAX, ttlMs = QUERY_CACHE_TTL_MS) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  get(key: string): EmbeddingVector | null {
    const entry = this.map.get(key);
    if (!entry) { this.misses++; return null; }
    if (Date.now() - entry.ts > this.ttlMs) {
      this.map.delete(key);
      this.misses++;
      return null;
    }
    this.map.delete(key);
    this.map.set(key, entry);
    this.hits++;
    return entry.vec;
  }

  set(key: string, vec: EmbeddingVector): void {
    if (this.map.size >= this.maxSize) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
    this.map.set(key, { vec, ts: Date.now() });
  }

  get size() { return this.map.size; }
  get stats() { return { size: this.map.size, hits: this.hits, misses: this.misses, hitRate: this.hits + this.misses > 0 ? Math.round(this.hits / (this.hits + this.misses) * 100) : 0 }; }
}

// ── Core Service ─────────────────────────────────────────────────────────────
export class EmbeddingService {
  private apiKey: string;
  private healthy: boolean | null = null;
  private lastHealthCheck = 0;
  private queryCache = new QueryVectorCache();

  constructor() {
    this.apiKey = ENV.geminiApiKey;
    logger.info(`[EmbeddingService] Gemini Embedding → ${GEMINI_MODEL} (${EMBEDDING_DIMS}D)`);
  }

  // ── Health Check ─────────────────────────────────────────────────────────
  async isHealthy(): Promise<boolean> {
    const now = Date.now();
    if (this.healthy !== null && now - this.lastHealthCheck < HEALTH_CACHE_TTL_MS) {
      return this.healthy;
    }
    // Gemini has no /health endpoint — check API key is set and try a minimal embed
    if (!this.apiKey) {
      this.healthy = false;
      this.lastHealthCheck = now;
      return false;
    }
    try {
      const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:embedContent`;
      const resp = await fetchWithRetry(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
        body: JSON.stringify({
          model: `models/${GEMINI_MODEL}`,
          content: { parts: [{ text: "health" }] },
          outputDimensionality: 128, // Minimal dims for health check
        }),
      }, 0);
      this.healthy = resp.ok;
    } catch {
      this.healthy = false;
    }
    this.lastHealthCheck = now;
    return this.healthy;
  }

  // ── Embed Texts ──────────────────────────────────────────────────────────
  /**
   * Embed an array of texts with task-type specialization.
   * Automatically batches if input exceeds MAX_BATCH_SIZE.
   */
  async embed(texts: string[], taskType: GeminiTaskType = "RETRIEVAL_DOCUMENT"): Promise<EmbeddingResult[]> {
    if (texts.length === 0) return [];
    const results: EmbeddingResult[] = [];
    for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
      const batch = texts.slice(i, i + MAX_BATCH_SIZE);
      const batchResults = await this.embedBatch(batch, i, taskType);
      results.push(...batchResults);
    }
    return results;
  }

  /**
   * Embed a single text with task-type specialization.
   * Uses LRU cache keyed on taskType:text to avoid redundant API calls.
   */
  async embedOne(text: string, taskType: GeminiTaskType = "RETRIEVAL_QUERY"): Promise<EmbeddingVector> {
    const cacheKey = `${taskType}:${text}`;
    const cached = this.queryCache.get(cacheKey);
    if (cached) return cached;

    const results = await this.embed([text], taskType);
    if (results.length === 0) {
      throw new Error("[EmbeddingService] embedOne: no results returned");
    }
    this.queryCache.set(cacheKey, results[0].embedding);
    return results[0].embedding;
  }

  // ── Multimodal Embedding (Gemini Embedding 2 Preview) ──────────────────
  /**
   * Embed an image (base64) into the same vector space as text.
   * Enables cross-modal search: text query → image results and vice versa.
   */
  async embedImage(
    imageBase64: string,
    mimeType: string = "image/jpeg",
    taskType: GeminiTaskType = "RETRIEVAL_DOCUMENT",
  ): Promise<EmbeddingVector> {
    const url = `${GEMINI_API_BASE}/${GEMINI_MULTIMODAL_MODEL}:embedContent`;
    const resp = await fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
      body: JSON.stringify({
        model: `models/${GEMINI_MULTIMODAL_MODEL}`,
        content: {
          parts: [{ inlineData: { mimeType, data: imageBase64 } }],
        },
        taskType,
        outputDimensionality: EMBEDDING_DIMS,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "unknown");
      throw new Error(`[EmbeddingService] embedImage error ${resp.status}: ${errText}`);
    }

    const data = await resp.json() as GeminiEmbedResponse;
    const values = normalizeL2(data.embedding.values);
    return { values, dimensions: values.length };
  }

  /**
   * Embed text + image together into a single aggregated vector.
   * Useful for BOLs, run tickets, and documents with visual + text content.
   */
  async embedMultimodal(
    text: string,
    imageBase64: string,
    mimeType: string = "image/jpeg",
    taskType: GeminiTaskType = "RETRIEVAL_DOCUMENT",
  ): Promise<EmbeddingVector> {
    const url = `${GEMINI_API_BASE}/${GEMINI_MULTIMODAL_MODEL}:embedContent`;
    const resp = await fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
      body: JSON.stringify({
        model: `models/${GEMINI_MULTIMODAL_MODEL}`,
        content: {
          parts: [
            { text },
            { inlineData: { mimeType, data: imageBase64 } },
          ],
        },
        taskType,
        outputDimensionality: EMBEDDING_DIMS,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "unknown");
      throw new Error(`[EmbeddingService] embedMultimodal error ${resp.status}: ${errText}`);
    }

    const data = await resp.json() as GeminiEmbedResponse;
    const values = normalizeL2(data.embedding.values);
    return { values, dimensions: values.length };
  }

  // ── Similarity Search ────────────────────────────────────────────────────
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  search(
    queryVector: number[],
    candidates: Array<{ embedding: number[]; entityId?: string; entityType?: string; text?: string; metadata?: Record<string, unknown> }>,
    topK = 5,
    threshold = 0.0,
  ): SimilarityResult[] {
    const scored = candidates.map((c, index) => ({
      index,
      score: EmbeddingService.cosineSimilarity(queryVector, c.embedding),
      text: c.text,
      entityId: c.entityId,
      entityType: c.entityType,
      metadata: c.metadata,
    }));

    return scored
      .filter(r => r.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  // ── Serialization Helpers ────────────────────────────────────────────────
  /** Convert a float32 number[] embedding to a Buffer for storage. */
  static toBuffer(embedding: number[]): Buffer {
    const float32 = new Float32Array(embedding);
    return Buffer.from(float32.buffer);
  }

  /** Convert a stored Buffer back to a float32 number[] embedding. */
  static fromBuffer(buf: Buffer): number[] {
    const float32 = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
    return Array.from(float32);
  }

  /** Compute a content hash for deduplication. */
  static async contentHash(text: string): Promise<string> {
    const crypto = await import("crypto");
    return crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);
  }

  // ── Model Info ───────────────────────────────────────────────────────────
  get dimensions(): number { return EMBEDDING_DIMS; }
  get modelId(): string { return GEMINI_MODEL; }
  get multimodalModelId(): string { return GEMINI_MULTIMODAL_MODEL; }
  get cacheStats() { return this.queryCache.stats; }

  // ── Private: Batch Embedding ───────────────────────────────────────────
  private async embedBatch(
    texts: string[],
    offsetIndex: number,
    taskType: GeminiTaskType,
  ): Promise<EmbeddingResult[]> {
    if (texts.length === 1) {
      // Single embed is more efficient for single items
      return this.embedSingle(texts[0], offsetIndex, taskType);
    }

    // Use batchEmbedContents for multiple texts
    const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:batchEmbedContents`;
    const requests = texts.map(text => ({
      model: `models/${GEMINI_MODEL}`,
      content: { parts: [{ text }] },
      taskType,
      outputDimensionality: EMBEDDING_DIMS,
    }));

    const resp = await fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
      body: JSON.stringify({ requests }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "unknown");
      logger.error(`[EmbeddingService] Batch API error ${resp.status}: ${errText}`);
      throw new Error(`Gemini batch embed error: ${resp.status}`);
    }

    const data = await resp.json() as GeminiBatchEmbedResponse;

    return data.embeddings.map((emb, i) => ({
      index: offsetIndex + i,
      text: texts[i],
      embedding: {
        values: normalizeL2(emb.values),
        dimensions: emb.values.length,
      },
    }));
  }

  private async embedSingle(
    text: string,
    offsetIndex: number,
    taskType: GeminiTaskType,
  ): Promise<EmbeddingResult[]> {
    const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:embedContent`;
    const resp = await fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
      body: JSON.stringify({
        model: `models/${GEMINI_MODEL}`,
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: EMBEDDING_DIMS,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "unknown");
      logger.error(`[EmbeddingService] API error ${resp.status}: ${errText}`);
      throw new Error(`Gemini embed error: ${resp.status}`);
    }

    const data = await resp.json() as GeminiEmbedResponse;
    const values = normalizeL2(data.embedding.values);

    return [{
      index: offsetIndex,
      text,
      embedding: { values, dimensions: values.length },
    }];
  }
}

// ── Singleton Export ──────────────────────────────────────────────────────────
export const embeddingService = new EmbeddingService();
export default embeddingService;
