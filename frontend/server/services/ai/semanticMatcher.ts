/**
 * WS-T1-002: Semantic Load Matching via pplx-embed Embeddings
 *
 * Replaces keyword-based load search with embedding-powered semantic matching.
 * Dense embeddings represent loads and carrier profiles; matching uses cosine
 * similarity. INT8 quantization via pplx-embed-v1-0.6b enables fast inference.
 *
 * Integration points:
 *   - Load Board search (semantic mode)
 *   - ML Carrier Match model
 *   - ESANG search_marketplace action
 *
 * Reference: arXiv:2602.11151 (pplx-embed)
 */

import { logger } from "../../_core/logger";
import { embeddingService, EmbeddingService } from "../embeddings/embeddingService";
import { getDb } from "../../db";
import { loads } from "../../../drizzle/schema";
import { sql, desc } from "drizzle-orm";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LoadEmbeddingRecord {
  loadId: number;
  embedding: number[];
  text: string;
  metadata: {
    loadNumber: string;
    origin: string;
    destination: string;
    cargoType: string;
    rate: string;
    hazmat: boolean;
    equipmentType: string;
  };
}

export interface CarrierProfileInput {
  equipmentTypes: string[];
  preferredLanes: string[];     // e.g., ["Houston TX → Corpus Christi TX"]
  hazmatEndorsed: boolean;
  safetyRating: string;
  operatingStates: string[];
  specializations: string[];    // e.g., ["crude oil", "petroleum"]
}

export interface SemanticMatchResult {
  loadId: number;
  loadNumber: string;
  similarity: number;
  metadata: LoadEmbeddingRecord["metadata"];
}

// ── In-Memory Load Index ──────────────────────────────────────────────────────

const loadIndex: Map<number, LoadEmbeddingRecord> = new Map();
let lastIndexRefresh = 0;
const INDEX_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// ── Text Representations ──────────────────────────────────────────────────────

function loadToText(load: any): string {
  const pickup = load.pickupLocation as any;
  const delivery = load.deliveryLocation as any;
  const originCity = pickup?.city || pickup?.address || "Unknown";
  const originState = pickup?.state || "";
  const destCity = delivery?.city || delivery?.address || "Unknown";
  const destState = delivery?.state || "";

  const parts = [
    `${load.cargoType || "general"} freight`,
    `from ${originCity}${originState ? ", " + originState : ""}`,
    `to ${destCity}${destState ? ", " + destState : ""}`,
  ];

  if (load.weight) parts.push(`Weight: ${load.weight} ${load.weightUnit || "lbs"}`);
  if (load.equipmentType) parts.push(`Equipment: ${load.equipmentType}`);
  if (load.hazmatClass) parts.push(`Hazmat class ${load.hazmatClass}`);
  if (load.commodityName) parts.push(`Product: ${load.commodityName}`);
  if (load.rate) parts.push(`Rate: $${load.rate}`);
  if (load.pickupDate) parts.push(`Pickup: ${new Date(load.pickupDate).toLocaleDateString()}`);
  if (load.specialInstructions) parts.push(load.specialInstructions);

  return parts.join(". ") + ".";
}

function carrierToText(carrier: CarrierProfileInput): string {
  const parts = [
    `Carrier with ${carrier.equipmentTypes.join(", ")} equipment`,
  ];

  if (carrier.preferredLanes.length > 0) {
    parts.push(`Preferred lanes: ${carrier.preferredLanes.join("; ")}`);
  }
  if (carrier.hazmatEndorsed) parts.push("Hazmat endorsed");
  else parts.push("No hazmat endorsement");
  if (carrier.safetyRating) parts.push(`Safety rating: ${carrier.safetyRating}`);
  if (carrier.operatingStates.length > 0) {
    parts.push(`Operating region: ${carrier.operatingStates.join(", ")}`);
  }
  if (carrier.specializations.length > 0) {
    parts.push(`Specializations: ${carrier.specializations.join(", ")}`);
  }

  return parts.join(". ") + ".";
}

function queryToText(query: string): string {
  // If the query already reads like natural language, use it directly
  if (query.length > 15) return query;
  // Otherwise wrap it as a freight search
  return `Looking for ${query} freight loads`;
}

// ── Index Management ──────────────────────────────────────────────────────────

/**
 * Refresh the in-memory load embedding index from active marketplace loads.
 * Only re-embeds loads not already in the index.
 */
export async function refreshLoadIndex(forceRefresh = false): Promise<number> {
  const now = Date.now();
  if (!forceRefresh && now - lastIndexRefresh < INDEX_REFRESH_INTERVAL_MS) {
    return loadIndex.size;
  }

  const healthy = await embeddingService.isHealthy();
  if (!healthy) {
    logger.warn("[SemanticMatcher] Embedding service unavailable — skipping index refresh");
    return loadIndex.size;
  }

  const db = await getDb();
  if (!db) return loadIndex.size;

  try {
    // Fetch active marketplace loads
    const activeLoads = await db.select().from(loads)
      .where(sql`${loads.status} IN ('posted', 'bidding')`)
      .orderBy(desc(loads.createdAt))
      .limit(500);

    // Find loads not yet indexed
    const toEmbed: Array<{ load: any; text: string }> = [];
    const activeIds = new Set<number>();

    for (const load of activeLoads) {
      const l = load as any;
      activeIds.add(l.id);
      if (!loadIndex.has(l.id)) {
        toEmbed.push({ load: l, text: loadToText(l) });
      }
    }

    // Remove stale entries (loads no longer active)
    for (const key of Array.from(loadIndex.keys())) {
      if (!activeIds.has(key)) loadIndex.delete(key);
    }

    // Batch embed new loads
    if (toEmbed.length > 0) {
      const texts = toEmbed.map(e => e.text);
      const embeddings = await embeddingService.embed(texts, "RETRIEVAL_DOCUMENT");

      for (let i = 0; i < toEmbed.length; i++) {
        const l = toEmbed[i].load;
        const pickup = l.pickupLocation as any;
        const delivery = l.deliveryLocation as any;

        loadIndex.set(l.id, {
          loadId: l.id,
          embedding: embeddings[i].embedding.values,
          text: toEmbed[i].text,
          metadata: {
            loadNumber: l.loadNumber || "",
            origin: pickup?.city ? `${pickup.city}, ${pickup.state}` : "",
            destination: delivery?.city ? `${delivery.city}, ${delivery.state}` : "",
            cargoType: l.cargoType || "general",
            rate: l.rate ? `$${l.rate}` : "Open",
            hazmat: !!l.hazmatClass,
            equipmentType: l.equipmentType || "",
          },
        });
      }

      logger.info(`[SemanticMatcher] Indexed ${toEmbed.length} new loads (total: ${loadIndex.size})`);
    }

    lastIndexRefresh = now;
    return loadIndex.size;
  } catch (err: any) {
    logger.error("[SemanticMatcher] Index refresh error:", err.message);
    return loadIndex.size;
  }
}

// ── Search Functions ──────────────────────────────────────────────────────────

/**
 * Semantic search for loads matching a natural-language query.
 * Example: "crude oil transport from Texas" matches "petroleum hauling Houston"
 */
export async function searchLoads(
  query: string,
  options: { topK?: number; threshold?: number } = {},
): Promise<SemanticMatchResult[]> {
  const topK = options.topK ?? 20;
  const threshold = options.threshold ?? 0.25;

  // Ensure index is fresh
  await refreshLoadIndex();

  if (loadIndex.size === 0) return [];

  const healthy = await embeddingService.isHealthy();
  if (!healthy) return [];

  try {
    const queryVec = await embeddingService.embedOne(queryToText(query), "RETRIEVAL_QUERY");
    const candidates = Array.from(loadIndex.values()).map(entry => ({
      embedding: entry.embedding,
      entityId: String(entry.loadId),
      entityType: "load",
      text: entry.text,
      metadata: entry.metadata as Record<string, unknown>,
    }));

    const results = embeddingService.search(queryVec.values, candidates, topK, threshold);

    return results.map(r => {
      const entry = loadIndex.get(parseInt(r.entityId || "0"));
      return {
        loadId: parseInt(r.entityId || "0"),
        loadNumber: entry?.metadata.loadNumber || "",
        similarity: Math.round(r.score * 1000) / 1000,
        metadata: entry?.metadata || {
          loadNumber: "", origin: "", destination: "",
          cargoType: "", rate: "", hazmat: false, equipmentType: "",
        },
      };
    });
  } catch (err: any) {
    logger.error("[SemanticMatcher] Search error:", err.message);
    return [];
  }
}

/**
 * Find loads matching a carrier's profile using semantic similarity.
 * Embeds the carrier profile and matches against the load index.
 */
export async function matchLoadsForCarrier(
  profile: CarrierProfileInput,
  options: { topK?: number; threshold?: number } = {},
): Promise<SemanticMatchResult[]> {
  const topK = options.topK ?? 20;
  const threshold = options.threshold ?? 0.20;

  await refreshLoadIndex();
  if (loadIndex.size === 0) return [];

  const healthy = await embeddingService.isHealthy();
  if (!healthy) return [];

  try {
    const profileText = carrierToText(profile);
    const profileVec = await embeddingService.embedOne(profileText, "RETRIEVAL_QUERY");

    const candidates = Array.from(loadIndex.values()).map(entry => ({
      embedding: entry.embedding,
      entityId: String(entry.loadId),
      entityType: "load",
      text: entry.text,
      metadata: entry.metadata as Record<string, unknown>,
    }));

    const results = embeddingService.search(profileVec.values, candidates, topK, threshold);

    return results.map(r => {
      const entry = loadIndex.get(parseInt(r.entityId || "0"));
      return {
        loadId: parseInt(r.entityId || "0"),
        loadNumber: entry?.metadata.loadNumber || "",
        similarity: Math.round(r.score * 1000) / 1000,
        metadata: entry?.metadata || {
          loadNumber: "", origin: "", destination: "",
          cargoType: "", rate: "", hazmat: false, equipmentType: "",
        },
      };
    });
  } catch (err: any) {
    logger.error("[SemanticMatcher] Carrier match error:", err.message);
    return [];
  }
}

/**
 * Get similarity score between two text descriptions.
 * Useful for ad-hoc comparisons (e.g., load vs. carrier).
 */
export async function computeSimilarity(textA: string, textB: string): Promise<number> {
  const healthy = await embeddingService.isHealthy();
  if (!healthy) return 0;

  try {
    const [vecA, vecB] = await Promise.all([
      embeddingService.embedOne(textA, "RETRIEVAL_QUERY"),
      embeddingService.embedOne(textB, "RETRIEVAL_QUERY"),
    ]);
    return EmbeddingService.cosineSimilarity(vecA.values, vecB.values);
  } catch {
    return 0;
  }
}

/**
 * Get index diagnostics for monitoring.
 */
export function getIndexStats() {
  return {
    indexedLoads: loadIndex.size,
    lastRefreshAgo: lastIndexRefresh > 0 ? `${Math.round((Date.now() - lastIndexRefresh) / 1000)}s` : "never",
    cacheStats: embeddingService.cacheStats,
  };
}
