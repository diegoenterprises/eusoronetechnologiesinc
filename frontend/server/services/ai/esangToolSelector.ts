/**
 * WS-T1-003: ESANG Tool Selection via Embeddings
 *
 * Embeds all ACTION_REGISTRY entries from esangActionExecutor.ts.
 * On user query, retrieves top-k actions by embedding similarity instead of
 * rigid keyword matching — making ESANG truly conversational.
 *
 * Example:
 *   "is that carrier safe?" → [carrier_safety, verify_carrier, carrier_inspections]
 *   "how much should I bid?" → [analyze_rate, market_rate_prediction, submit_bid]
 *
 * Reference: pplx-embed ToolRet benchmark (44.45% nDCG@10)
 */

import { embeddingService, EmbeddingService } from "../embeddings/embeddingService";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ActionEmbedding {
  name: string;
  description: string;
  embedding: number[] | null;
}

interface ToolSelectionResult {
  name: string;
  description: string;
  similarity: number;
}

// ── Action Description Catalog ────────────────────────────────────────────────
// Mirrors the ACTION_REGISTRY from esangActionExecutor.ts — descriptions only.
// We don't import the actual registry to avoid circular dependencies.

const ACTION_CATALOG: Array<{ name: string; description: string }> = [
  { name: "create_load", description: "Create a new load and post it to the marketplace. For shippers posting freight." },
  { name: "list_my_loads", description: "List the user's loads with status and details. View my shipments, active loads, completed loads." },
  { name: "cancel_load", description: "Cancel a load that is in draft, posted, or bidding status." },
  { name: "search_marketplace", description: "Search available loads on the marketplace. Find freight to haul." },
  { name: "submit_bid", description: "Submit a bid on a marketplace load. Place an offer to haul freight." },
  { name: "get_my_bids", description: "Get the user's submitted bids on loads. Check bid status." },
  { name: "erg_lookup", description: "Look up ERG emergency response data for a hazmat material. Chemical spill response, placard info, UN number." },
  { name: "get_load_stats", description: "Get load statistics for the current user. Dashboard metrics, delivery counts." },
  { name: "analyze_finances", description: "Get AI-powered financial insights and recommendations. Wallet balance, earnings analysis, revenue trends." },
  { name: "diagnose_issue", description: "Get AI-powered diagnosis for a truck issue based on symptoms and fault codes. Mechanical problems, engine codes, breakdown help." },
  { name: "lookup_fault_code", description: "Look up a truck DTC/SPN-FMI fault code and get detailed analysis. Engine diagnostics, error codes." },
  { name: "analyze_rate", description: "Analyze a freight or escort rate for fairness using AI market intelligence. Is this price fair?" },
  { name: "generate_missions", description: "Generate personalized AI-powered missions for The Haul gamification system. Get XP, badges, achievements." },
  { name: "smart_reply", description: "Generate smart reply suggestions for a conversation. Auto-compose messages." },
  { name: "carrier_lookup", description: "Look up a carrier by DOT number, MC number, or company name. Carrier profile, authority, insurance." },
  { name: "carrier_safety", description: "Get SMS BASIC safety scores for a carrier by DOT number. CSA scores, safety rating, compliance." },
  { name: "carrier_insurance", description: "Check insurance status and filings for a carrier by DOT number. Coverage verification." },
  { name: "carrier_authority", description: "Check operating authority status (common, contract, broker) for a carrier. MC authority, DOT authority." },
  { name: "verify_carrier", description: "Run a full carrier verification check (authority, insurance, safety, OOS). Is this carrier eligible?" },
  { name: "carrier_inspections", description: "Get recent inspection history for a carrier by DOT number. Roadside inspections, violations." },
  { name: "carrier_crashes", description: "Get crash history for a carrier by DOT number. Accident records, fatalities." },
  { name: "market_rate_prediction", description: "Get ML-powered market rate prediction for a freight lane. How much should I charge? What's the going rate?" },
  { name: "fuel_price_check", description: "Get current fuel prices for a state or nationally. Diesel prices, gas prices." },
];

// ── Embedding Cache ───────────────────────────────────────────────────────────

let actionEmbeddings: ActionEmbedding[] = [];
let embeddingsInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Initialize action embeddings. Called lazily on first query.
 * Embeds all action descriptions and caches the vectors.
 */
async function initializeEmbeddings(): Promise<void> {
  if (embeddingsInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const healthy = await embeddingService.isHealthy();
    if (!healthy) {
      console.warn("[ToolSelector] Embedding service unavailable — falling back to keyword matching");
      actionEmbeddings = ACTION_CATALOG.map(a => ({ ...a, embedding: null }));
      return;
    }

    try {
      const texts = ACTION_CATALOG.map(a => a.description);
      const results = await embeddingService.embed(texts);

      actionEmbeddings = ACTION_CATALOG.map((action, i) => ({
        name: action.name,
        description: action.description,
        embedding: results[i]?.embedding?.values || null,
      }));

      embeddingsInitialized = true;
      console.log(`[ToolSelector] Embedded ${actionEmbeddings.length} actions`);
    } catch (err: any) {
      console.error("[ToolSelector] Failed to embed actions:", err.message);
      actionEmbeddings = ACTION_CATALOG.map(a => ({ ...a, embedding: null }));
    }
  })();

  return initPromise;
}

// ── Keyword Fallback ──────────────────────────────────────────────────────────

function keywordMatch(query: string): ToolSelectionResult[] {
  const q = query.toLowerCase();
  const scored: ToolSelectionResult[] = [];

  for (const action of ACTION_CATALOG) {
    const desc = action.description.toLowerCase();
    const nameWords = action.name.replace(/_/g, " ");

    // Count keyword overlaps
    const queryTokens = q.split(/\s+/).filter(t => t.length > 2);
    let hits = 0;
    for (const token of queryTokens) {
      if (desc.includes(token) || nameWords.includes(token)) hits++;
    }

    if (hits > 0) {
      scored.push({
        name: action.name,
        description: action.description,
        similarity: Math.min(hits / Math.max(queryTokens.length, 1), 1.0),
      });
    }
  }

  return scored.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Select the most relevant ESANG actions for a user query using embedding similarity.
 * Falls back to keyword matching if the embedding service is unavailable.
 *
 * @param query - User's natural language query
 * @param topK - Max number of actions to return (default 3)
 * @param threshold - Minimum similarity score (default 0.30)
 * @param userRole - Filter actions to those the user's role can access
 */
export async function selectActions(
  query: string,
  options: {
    topK?: number;
    threshold?: number;
    userRole?: string;
  } = {},
): Promise<ToolSelectionResult[]> {
  const topK = options.topK ?? 3;
  const threshold = options.threshold ?? 0.30;

  await initializeEmbeddings();

  // Filter by role if provided
  let candidates = actionEmbeddings;
  if (options.userRole) {
    const roleCatalog = ACTION_CATALOG.filter(a => {
      // We don't have the actual allowedRoles here, so we skip role filtering
      // when using the lightweight catalog. The actual execution will enforce RBAC.
      return true;
    });
    // No real filtering at selection time — RBAC enforced at execution
  }

  // Check if embeddings are available
  const hasEmbeddings = candidates.some(c => c.embedding !== null);
  if (!hasEmbeddings) {
    return keywordMatch(query);
  }

  try {
    const queryVec = await embeddingService.embedOne(query);

    const scored: ToolSelectionResult[] = [];
    for (const action of candidates) {
      if (!action.embedding) continue;
      const similarity = EmbeddingService.cosineSimilarity(queryVec.values, action.embedding);
      if (similarity >= threshold) {
        scored.push({
          name: action.name,
          description: action.description,
          similarity: Math.round(similarity * 1000) / 1000,
        });
      }
    }

    const results = scored.sort((a, b) => b.similarity - a.similarity).slice(0, topK);

    // If embedding search returned nothing, fall back to keywords
    if (results.length === 0) {
      return keywordMatch(query);
    }

    return results;
  } catch (err: any) {
    console.error("[ToolSelector] Embedding search failed, falling back to keywords:", err.message);
    return keywordMatch(query);
  }
}

/**
 * Get the action catalog with descriptions (for system prompt generation).
 */
export function getActionCatalog(): Array<{ name: string; description: string }> {
  return ACTION_CATALOG;
}

/**
 * Reset cached embeddings (useful for testing or after adding new actions).
 */
export function resetEmbeddings(): void {
  actionEmbeddings = [];
  embeddingsInitialized = false;
  initPromise = null;
}
