/**
 * ESANG Cognitive Engine — AgentKeeper-Inspired Persistence Layer
 *
 * Implements a Cognitive Reconstruction Engine (CRE) that sits between
 * ESANG AI and any LLM provider, ensuring memory survives:
 *   - Server restarts
 *   - Provider switches (Gemini → OpenAI → Anthropic → etc.)
 *   - Context window limits (token-budgeted reconstruction)
 *   - Crashes and redeployments
 *
 * Core principles (from AgentKeeper):
 *   1. Store facts independently of any provider
 *   2. Prioritize critical facts under token constraints
 *   3. Reconstruct optimal context for each target model
 *   4. Persist state to database (not just in-memory)
 *
 * Enhanced with dense contextual embeddings for semantic memory retrieval
 * using the existing pplx-embed-v1-0.6b (1024-dim) embedding service.
 */

import { logger } from "../_core/logger";
import { embeddingService } from "./embeddings/embeddingService";

// ── Types ────────────────────────────────────────────────────────────────────

type MemoryCategory = "profile" | "preference" | "pattern" | "context" | "knowledge" | "action_history";

interface CognitiveFact {
  id: number;
  userId: string;
  content: string;
  category: MemoryCategory;
  critical: boolean;
  embedding: number[] | null;
  tokenCount: number;
  accessCount: number;
  createdAt: Date;
  lastAccessedAt: Date;
  metadata?: Record<string, unknown>;
}

interface RecallResult {
  facts: CognitiveFact[];
  totalTokens: number;
  criticalCount: number;
  contextString: string;
}

interface CognitiveStats {
  totalFacts: number;
  criticalFacts: number;
  categories: Record<string, number>;
  oldestFact: Date | null;
  newestFact: Date | null;
  totalTokens: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const CHARS_PER_TOKEN = 4;
const MAX_FACTS_PER_USER = 200;
const HOT_CACHE_TTL_MS = 120_000;
const FACT_EXTRACTION_PATTERNS: Array<{
  pattern: RegExp;
  category: MemoryCategory;
  critical: boolean;
}> = [
  // Profile facts
  { pattern: /(?:my name is|i'?m called|call me)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i, category: "profile", critical: true },
  { pattern: /(?:i work (?:at|for)|my company is)\s+(.+?)(?:\.|,|$)/i, category: "profile", critical: true },
  { pattern: /(?:i'?m a|my role is|i work as)\s+(shipper|catalyst|driver|broker|escort|terminal manager|dispatch|admin|compliance|safety)/i, category: "profile", critical: true },
  { pattern: /(?:my dot|dot number|dot#|dot #)\s*(?:is\s*)?(\d{5,8})/i, category: "profile", critical: true },
  { pattern: /(?:my mc|mc number|mc#|mc #)\s*(?:is\s*)?(\d{5,8})/i, category: "profile", critical: true },

  // Preference facts
  { pattern: /(?:i (?:prefer|always|usually|typically)|my preferred)\s+(.+?)(?:\.|,|$)/i, category: "preference", critical: false },
  { pattern: /(?:i (?:like|want|need) to)\s+(.+?)(?:\.|,|$)/i, category: "preference", critical: false },

  // Pattern facts (lanes, cargo types, equipment)
  { pattern: /(?:i (?:haul|run|drive|ship|move))\s+(.+?)(?:\.|,|$)/i, category: "pattern", critical: false },
  { pattern: /(?:my (?:lane|route|corridor) is|i run)\s+(.+?)\s+(?:to|→|->)\s+(.+?)(?:\.|,|$)/i, category: "pattern", critical: true },
  { pattern: /(?:i (?:specialize|focus) (?:in|on))\s+(.+?)(?:\.|,|$)/i, category: "pattern", critical: false },
  { pattern: /(?:my (?:truck|trailer|rig|equipment) is)\s+(.+?)(?:\.|,|$)/i, category: "pattern", critical: false },

  // Knowledge facts
  { pattern: /(?:remember that|note that|keep in mind)\s+(.+?)(?:\.|$)/i, category: "knowledge", critical: true },
  { pattern: /(?:fyi|for your (?:info|information))[,:]\s*(.+?)(?:\.|$)/i, category: "knowledge", critical: false },
];

// ── Hot Cache ────────────────────────────────────────────────────────────────

interface HotCacheEntry {
  facts: CognitiveFact[];
  loadedAt: number;
}

const _hotCache = new Map<string, HotCacheEntry>();

function getHotCache(userId: string): CognitiveFact[] | null {
  const entry = _hotCache.get(userId);
  if (!entry) return null;
  if (Date.now() - entry.loadedAt > HOT_CACHE_TTL_MS) {
    _hotCache.delete(userId);
    return null;
  }
  return entry.facts;
}

function setHotCache(userId: string, facts: CognitiveFact[]): void {
  _hotCache.set(userId, { facts, loadedAt: Date.now() });
}

function invalidateHotCache(userId: string): void {
  _hotCache.delete(userId);
}

// ── Token Estimation ─────────────────────────────────────────────────────────

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

// ── Cosine Similarity (inline for speed) ─────────────────────────────────────

function cosineSim(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ── Database Helpers ─────────────────────────────────────────────────────────

async function getDbAndSchema() {
  const { getDb } = await import("../db");
  const { esangMemories } = await import("../../drizzle/schema");
  const { eq, and, desc, sql } = await import("drizzle-orm");
  const db = await getDb();
  return { db, esangMemories, eq, and, desc, sql };
}

// ══════════════════════════════════════════════════════════════════════════════
// COGNITIVE ENGINE — Public API
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Store a fact in the user's cognitive memory.
 * Generates a dense embedding for semantic retrieval.
 */
export async function remember(
  userId: string,
  content: string,
  options: { critical?: boolean; category?: MemoryCategory; metadata?: Record<string, unknown>; conversationId?: string } = {},
): Promise<number | null> {
  try {
    const { db, esangMemories, eq, and, sql } = await getDbAndSchema();
    if (!db) return null;

    // Dedup: check if a very similar fact already exists
    const existing = await db.select({ id: esangMemories.id, content: esangMemories.content })
      .from(esangMemories)
      .where(eq(esangMemories.userId, userId))
      .limit(500);

    const normalized = content.trim().toLowerCase();
    for (const row of existing) {
      if (row.content.trim().toLowerCase() === normalized) {
        // Exact duplicate — bump access count instead
        await db.update(esangMemories).set({
          accessCount: sql`access_count + 1`,
          lastAccessedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(esangMemories.id, row.id));
        return row.id;
      }
    }

    // Enforce per-user limit: evict oldest non-critical facts
    if (existing.length >= MAX_FACTS_PER_USER) {
      const { desc: descFn } = await import("drizzle-orm");
      const evictable = await db.select({ id: esangMemories.id })
        .from(esangMemories)
        .where(and(eq(esangMemories.userId, userId), eq(esangMemories.critical, false)))
        .orderBy(esangMemories.lastAccessedAt)
        .limit(10);
      if (evictable.length > 0) {
        for (const e of evictable) {
          await db.delete(esangMemories).where(eq(esangMemories.id, e.id));
        }
      }
    }

    // Generate dense embedding for semantic retrieval
    let embedding: number[] | null = null;
    let dimensions = 1024;
    try {
      const healthy = await embeddingService.isHealthy();
      if (healthy) {
        const vec = await embeddingService.embedOne(content);
        embedding = vec.values;
        dimensions = vec.dimensions;
      }
    } catch { /* Embedding service offline — store without vector */ }

    const tokenCount = estimateTokens(content);

    const [result] = await db.insert(esangMemories).values({
      userId,
      content,
      category: options.category || "context",
      critical: options.critical || false,
      embedding,
      dimensions,
      tokenCount,
      accessCount: 0,
      sourceConversationId: options.conversationId || null,
      metadata: options.metadata || null,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      updatedAt: new Date(),
    });

    invalidateHotCache(userId);
    logger.info(`[CognitiveEngine] Stored fact for user ${userId}: "${content.slice(0, 60)}..." (${options.critical ? "CRITICAL" : "normal"}, ${options.category || "context"})`);
    return (result as any).insertId || null;
  } catch (err) {
    logger.error("[CognitiveEngine] remember() error:", err);
    return null;
  }
}

/**
 * Recall relevant facts for a query, respecting a token budget.
 * Uses semantic similarity (dense embeddings) + critical fact prioritization.
 * This is the core of the Cognitive Reconstruction Engine.
 */
export async function recall(
  userId: string,
  query: string,
  tokenBudget = 2000,
): Promise<RecallResult> {
  const empty: RecallResult = { facts: [], totalTokens: 0, criticalCount: 0, contextString: "" };

  try {
    // Try hot cache first
    let allFacts = getHotCache(userId);

    if (!allFacts) {
      const { db, esangMemories, eq } = await getDbAndSchema();
      if (!db) return empty;

      const rows = await db.select().from(esangMemories)
        .where(eq(esangMemories.userId, userId));

      allFacts = rows.map(r => ({
        id: r.id,
        userId: r.userId,
        content: r.content,
        category: r.category as MemoryCategory,
        critical: r.critical,
        embedding: r.embedding ? (Array.isArray(r.embedding) ? r.embedding as number[] : []) : null,
        tokenCount: r.tokenCount || estimateTokens(r.content),
        accessCount: r.accessCount || 0,
        createdAt: r.createdAt,
        lastAccessedAt: r.lastAccessedAt,
        metadata: r.metadata as Record<string, unknown> | undefined,
      }));

      setHotCache(userId, allFacts);
    }

    if (allFacts.length === 0) return empty;

    // Score each fact by semantic similarity + recency + criticality
    let queryVec: number[] | null = null;
    try {
      const healthy = await embeddingService.isHealthy();
      if (healthy) {
        const vec = await embeddingService.embedOne(query);
        queryVec = vec.values;
      }
    } catch { /* Embedding offline — fall back to recency-only scoring */ }

    const scored = allFacts.map(fact => {
      let score = 0;

      // Semantic similarity (0–1, weighted 60%)
      if (queryVec && fact.embedding && fact.embedding.length > 0) {
        score += cosineSim(queryVec, fact.embedding) * 0.6;
      } else {
        // Text overlap fallback
        const queryWords = new Set(query.toLowerCase().split(/\s+/));
        const factWords = fact.content.toLowerCase().split(/\s+/);
        const overlap = factWords.filter(w => queryWords.has(w)).length;
        score += Math.min(overlap / Math.max(queryWords.size, 1), 1) * 0.3;
      }

      // Critical boost (25%)
      if (fact.critical) score += 0.25;

      // Recency boost (10%) — more recent = higher score
      const ageMs = Date.now() - fact.lastAccessedAt.getTime();
      const ageHours = ageMs / (1000 * 60 * 60);
      score += Math.max(0, 0.1 * (1 - ageHours / (24 * 30))); // decays over 30 days

      // Access frequency boost (5%)
      score += Math.min(fact.accessCount / 50, 1) * 0.05;

      return { fact, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Token-budgeted selection: critical facts first, then by score
    const selected: CognitiveFact[] = [];
    let totalTokens = 0;

    // Phase 1: Always include critical facts (up to 50% of budget)
    const criticalBudget = Math.floor(tokenBudget * 0.5);
    let criticalTokens = 0;
    for (const { fact } of scored) {
      if (!fact.critical) continue;
      if (criticalTokens + fact.tokenCount > criticalBudget) continue;
      selected.push(fact);
      criticalTokens += fact.tokenCount;
      totalTokens += fact.tokenCount;
    }

    // Phase 2: Fill remaining budget with highest-scoring non-critical facts
    const remainingBudget = tokenBudget - totalTokens;
    for (const { fact, score } of scored) {
      if (fact.critical) continue; // already added
      if (score < 0.15) continue; // minimum relevance threshold
      if (totalTokens + fact.tokenCount > tokenBudget) continue;
      selected.push(fact);
      totalTokens += fact.tokenCount;
    }

    // Build context string for injection into LLM prompt
    const contextString = buildContextString(selected);

    // Update access counts (fire-and-forget)
    touchFacts(selected.map(f => f.id)).catch(() => {});

    return {
      facts: selected,
      totalTokens,
      criticalCount: selected.filter(f => f.critical).length,
      contextString,
    };
  } catch (err) {
    logger.error("[CognitiveEngine] recall() error:", err);
    return empty;
  }
}

/**
 * Extract and store facts from a conversation turn.
 * Uses rule-based extraction for speed (no extra LLM call).
 */
export async function learnFromConversation(
  userId: string,
  userMessage: string,
  aiResponse: string,
  conversationId?: string,
): Promise<number> {
  let stored = 0;

  try {
    // Rule-based fact extraction from user message
    for (const { pattern, category, critical } of FACT_EXTRACTION_PATTERNS) {
      const match = userMessage.match(pattern);
      if (match) {
        const factContent = match[0].trim();
        if (factContent.length > 10 && factContent.length < 500) {
          const id = await remember(userId, factContent, { critical, category, conversationId });
          if (id) stored++;
        }
      }
    }

    // Extract action history from AI response (what did ESANG do?)
    const actionPattern = /✅\s+\*\*(.+?)\*\*/g;
    let actionMatch;
    while ((actionMatch = actionPattern.exec(aiResponse)) !== null) {
      const action = actionMatch[1].trim();
      if (action.length > 5) {
        const id = await remember(userId, `ESANG executed: ${action}`, {
          category: "action_history",
          critical: false,
          conversationId,
        });
        if (id) stored++;
      }
    }

    // Store meaningful user questions as context (helps ESANG learn what user cares about)
    if (userMessage.length > 20 && userMessage.length < 300) {
      const lowMsg = userMessage.toLowerCase();
      // Only store substantive questions, not greetings
      const isSubstantive = !(/^(hi|hello|hey|thanks|ok|yes|no|sure|got it)\b/i.test(lowMsg)) && lowMsg.length > 30;
      if (isSubstantive) {
        await remember(userId, `User asked: "${userMessage.slice(0, 200)}"`, {
          category: "context",
          critical: false,
          conversationId,
        });
        stored++;
      }
    }

    if (stored > 0) {
      logger.info(`[CognitiveEngine] Extracted ${stored} facts from conversation for user ${userId}`);
    }
  } catch (err) {
    logger.error("[CognitiveEngine] learnFromConversation() error:", err);
  }

  return stored;
}

/**
 * Reconstruct optimal context for a conversation turn.
 * This is what gets injected into the LLM prompt — the AgentKeeper "reconstruction".
 */
export async function reconstructContext(
  userId: string,
  query: string,
  tokenBudget = 1500,
): Promise<string> {
  const result = await recall(userId, query, tokenBudget);
  if (result.facts.length === 0) return "";
  return result.contextString;
}

/**
 * Get cognitive memory stats for a user.
 */
export async function getStats(userId: string): Promise<CognitiveStats> {
  try {
    const { db, esangMemories, eq } = await getDbAndSchema();
    if (!db) return { totalFacts: 0, criticalFacts: 0, categories: {}, oldestFact: null, newestFact: null, totalTokens: 0 };

    const rows = await db.select().from(esangMemories).where(eq(esangMemories.userId, userId));

    const categories: Record<string, number> = {};
    let criticalFacts = 0;
    let totalTokens = 0;
    let oldest: Date | null = null;
    let newest: Date | null = null;

    for (const r of rows) {
      categories[r.category] = (categories[r.category] || 0) + 1;
      if (r.critical) criticalFacts++;
      totalTokens += r.tokenCount || 0;
      if (!oldest || r.createdAt < oldest) oldest = r.createdAt;
      if (!newest || r.createdAt > newest) newest = r.createdAt;
    }

    return { totalFacts: rows.length, criticalFacts, categories, oldestFact: oldest, newestFact: newest, totalTokens };
  } catch (err) {
    logger.error("[CognitiveEngine] getStats() error:", err);
    return { totalFacts: 0, criticalFacts: 0, categories: {}, oldestFact: null, newestFact: null, totalTokens: 0 };
  }
}

/**
 * Forget a specific fact or all facts for a user.
 */
export async function forget(userId: string, factId?: number): Promise<boolean> {
  try {
    const { db, esangMemories, eq, and } = await getDbAndSchema();
    if (!db) return false;

    if (factId) {
      await db.delete(esangMemories).where(and(eq(esangMemories.id, factId), eq(esangMemories.userId, userId)));
    } else {
      await db.delete(esangMemories).where(eq(esangMemories.userId, userId));
    }

    invalidateHotCache(userId);
    return true;
  } catch (err) {
    logger.error("[CognitiveEngine] forget() error:", err);
    return false;
  }
}

/**
 * Manually store a critical fact (e.g., from user profile updates).
 */
export async function rememberCritical(userId: string, content: string, category: MemoryCategory = "profile"): Promise<number | null> {
  return remember(userId, content, { critical: true, category });
}

// ══════════════════════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Build a formatted context string from selected facts for LLM injection.
 * Groups by category and marks critical facts.
 */
function buildContextString(facts: CognitiveFact[]): string {
  if (facts.length === 0) return "";

  const grouped = new Map<string, CognitiveFact[]>();
  for (const f of facts) {
    const list = grouped.get(f.category) || [];
    list.push(f);
    grouped.set(f.category, list);
  }

  const CATEGORY_LABELS: Record<string, string> = {
    profile: "User Profile",
    preference: "User Preferences",
    pattern: "Behavioral Patterns",
    context: "Conversation Context",
    knowledge: "Stored Knowledge",
    action_history: "Recent Actions",
  };

  // Priority order for categories
  const ORDER: MemoryCategory[] = ["profile", "preference", "pattern", "knowledge", "action_history", "context"];

  let output = "\n\n[ESANG Cognitive Memory — Persistent Facts]";
  for (const cat of ORDER) {
    const items = grouped.get(cat);
    if (!items || items.length === 0) continue;
    output += `\n${CATEGORY_LABELS[cat] || cat}:`;
    for (const f of items) {
      output += `\n- ${f.critical ? "[CRITICAL] " : ""}${f.content}`;
    }
  }
  output += "\n[End Cognitive Memory]\n";

  return output;
}

/**
 * Update access timestamps and counts for recalled facts (fire-and-forget).
 */
async function touchFacts(factIds: number[]): Promise<void> {
  if (factIds.length === 0) return;
  try {
    const { db, esangMemories, eq, sql } = await getDbAndSchema();
    if (!db) return;
    for (const id of factIds) {
      await db.update(esangMemories).set({
        accessCount: sql`access_count + 1`,
        lastAccessedAt: new Date(),
      }).where(eq(esangMemories.id, id));
    }
  } catch { /* non-fatal */ }
}
