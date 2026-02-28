/**
 * PPLX-EMBED SELF-HOSTED EMBEDDING SERVICE
 * 
 * TypeScript client for the self-hosted HuggingFace Text Embeddings Inference (TEI)
 * server running perplexity-ai/pplx-embed-v1-0.6b.
 * 
 * Architecture:
 *   Node.js backend  →  HTTP  →  TEI Docker container (Azure Container Instance)
 *   All compute billed through Azure — zero external API charges.
 * 
 * The TEI server exposes an OpenAI-compatible /v1/embeddings endpoint.
 * Model: perplexity-ai/pplx-embed-v1-0.6b (1024-dim, INT8, 32K context)
 */

import { ENV } from "../../_core/env";

// ── Constants ────────────────────────────────────────────────────────────────
const EMBEDDING_DIMS = 1024;            // pplx-embed-v1-0.6b output dimensions
const MAX_BATCH_SIZE = 64;              // TEI default max batch
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
const HEALTH_CACHE_TTL_MS = 60_000;     // Cache health status for 60s (was 30s)
const QUERY_CACHE_MAX = 256;            // LRU cache size for query embeddings
const QUERY_CACHE_TTL_MS = 300_000;     // 5 min TTL for cached query vectors

// ── Types ────────────────────────────────────────────────────────────────────
export interface EmbeddingVector {
  /** INT8 values as a regular number array (range -128..127) */
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

// ── TEI Response Types ───────────────────────────────────────────────────────
interface TEIEmbeddingResponse {
  object: "list";
  data: Array<{
    object: "embedding";
    index: number;
    embedding: number[];  // TEI returns float array by default
  }>;
  model: string;
  usage: { prompt_tokens: number; total_tokens: number };
}

// Also supports the simpler TEI-native format (array of arrays)
type TEINativeResponse = number[][];

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
    // LRU: move to end
    this.map.delete(key);
    this.map.set(key, entry);
    this.hits++;
    return entry.vec;
  }

  set(key: string, vec: EmbeddingVector): void {
    if (this.map.size >= this.maxSize) {
      // Evict oldest (first key)
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
  private baseUrl: string;
  private healthy: boolean | null = null;
  private lastHealthCheck = 0;
  private queryCache = new QueryVectorCache();

  constructor() {
    this.baseUrl = ENV.embeddingServiceUrl || "http://localhost:8090";
    console.log(`[EmbeddingService] Configured → ${this.baseUrl}`);
  }

  // ── Health Check ─────────────────────────────────────────────────────────
  async isHealthy(): Promise<boolean> {
    const now = Date.now();
    // Cache health for 60s (reduced API chatter)
    if (this.healthy !== null && now - this.lastHealthCheck < HEALTH_CACHE_TTL_MS) {
      return this.healthy;
    }
    try {
      const resp = await fetchWithRetry(`${this.baseUrl}/health`, { method: "GET" }, 0);
      this.healthy = resp.ok;
    } catch {
      this.healthy = false;
    }
    this.lastHealthCheck = now;
    return this.healthy;
  }

  // ── Embed Texts ──────────────────────────────────────────────────────────
  /**
   * Embed an array of texts and return their INT8 vectors.
   * Automatically batches if input exceeds MAX_BATCH_SIZE.
   */
  async embed(texts: string[]): Promise<EmbeddingResult[]> {
    if (texts.length === 0) return [];

    const results: EmbeddingResult[] = [];

    // Batch if needed
    for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
      const batch = texts.slice(i, i + MAX_BATCH_SIZE);
      const batchResults = await this.embedBatch(batch, i);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Embed a single text and return its vector.
   * Uses LRU cache to avoid re-embedding identical queries.
   */
  async embedOne(text: string): Promise<EmbeddingVector> {
    // Check LRU cache first
    const cached = this.queryCache.get(text);
    if (cached) return cached;

    const results = await this.embed([text]);
    if (results.length === 0) {
      throw new Error("[EmbeddingService] embedOne: no results returned");
    }
    // Cache the result
    this.queryCache.set(text, results[0].embedding);
    return results[0].embedding;
  }

  // ── Similarity Search ────────────────────────────────────────────────────
  /**
   * Compute cosine similarity between a query vector and a set of candidate vectors.
   * Returns results sorted by score descending.
   */
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

  /**
   * Search for the most similar vectors in a candidate set.
   * @param queryVector - The query embedding
   * @param candidates - Array of stored embeddings to search against
   * @param topK - Number of results to return (default 5)
   * @param threshold - Minimum similarity score (default 0.0)
   */
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
  /**
   * Convert a number[] embedding to a compact Buffer for DB storage.
   * Stores as INT8 (1 byte per dimension) → 1024 bytes for the 0.6B model.
   */
  static toBuffer(embedding: number[]): Buffer {
    const int8 = new Int8Array(embedding.length);
    for (let i = 0; i < embedding.length; i++) {
      int8[i] = Math.max(-128, Math.min(127, Math.round(embedding[i])));
    }
    return Buffer.from(int8.buffer);
  }

  /**
   * Convert a stored Buffer back to a number[] embedding.
   */
  static fromBuffer(buf: Buffer): number[] {
    const int8 = new Int8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    return Array.from(int8);
  }

  /**
   * Compute a content hash for deduplication (avoids re-embedding unchanged text).
   */
  static async contentHash(text: string): Promise<string> {
    const crypto = await import("crypto");
    return crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);
  }

  // ── Model Info ───────────────────────────────────────────────────────────
  get dimensions(): number { return EMBEDDING_DIMS; }
  get modelId(): string { return "perplexity-ai/pplx-embed-v1-0.6b"; }
  get serviceUrl(): string { return this.baseUrl; }
  get cacheStats() { return this.queryCache.stats; }

  // ── Private ──────────────────────────────────────────────────────────────
  private async embedBatch(texts: string[], offsetIndex: number): Promise<EmbeddingResult[]> {
    // Try OpenAI-compatible endpoint first (TEI supports both)
    try {
      const resp = await fetchWithRetry(`${this.baseUrl}/v1/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: texts,
          model: "perplexity-ai/pplx-embed-v1-0.6b",
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => "unknown");
        console.error(`[EmbeddingService] API error ${resp.status}: ${errText}`);
        throw new Error(`TEI API error: ${resp.status}`);
      }

      const data = await resp.json() as TEIEmbeddingResponse;

      return data.data.map((item) => ({
        index: offsetIndex + item.index,
        text: texts[item.index],
        embedding: {
          values: item.embedding.map((v: number) => Math.max(-128, Math.min(127, Math.round(v)))),
          dimensions: item.embedding.length,
        },
      }));
    } catch (openaiErr) {
      // Fallback: TEI native /embed endpoint
      try {
        const resp = await fetchWithRetry(`${this.baseUrl}/embed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputs: texts }),
        });

        if (!resp.ok) throw new Error(`TEI /embed error: ${resp.status}`);
        const data = await resp.json() as TEINativeResponse;

        return data.map((emb, i) => ({
          index: offsetIndex + i,
          text: texts[i],
          embedding: {
            values: emb.map(v => Math.max(-128, Math.min(127, Math.round(v)))),
            dimensions: emb.length,
          },
        }));
      } catch (nativeErr) {
        console.error("[EmbeddingService] Both endpoints failed:", openaiErr, nativeErr);
        throw openaiErr;
      }
    }
  }
}

// ── Singleton Export ──────────────────────────────────────────────────────────
export const embeddingService = new EmbeddingService();
export default embeddingService;
