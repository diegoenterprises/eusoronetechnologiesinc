/**
 * WS-T1-004: VIGA Evolving Memory for ESANG
 *
 * Applies VIGA's sliding-window memory pattern (TailL) to ESANG's AI context.
 * Each AI action gets paired with its verification result. Memory persists
 * across sessions via database storage.
 *
 * Pattern:
 *   - Every ESANG action execution → record action + result + verification
 *   - Keep only the last L entries per user (TailL window = 10)
 *   - On next query, inject relevant past entries into AI context
 *   - Failed actions store corrections so ESANG learns from mistakes
 *
 * Reference: VIGA Algorithm 1 — TailL Memory (arXiv:2601.11109v2)
 */

import { logger } from "../../_core/logger";
import { getDb } from "../../db";
import { sql } from "drizzle-orm";

// ── Constants ─────────────────────────────────────────────────────────────────

const WINDOW_SIZE = 10;           // L in VIGA's TailL — entries per user
const MAX_CONTEXT_ENTRIES = 5;    // Max entries to inject into AI prompt
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ESANGMemoryEntry {
  id?: number;
  userId: number;
  action: string;
  input: Record<string, unknown>;
  result: Record<string, unknown>;
  verification: {
    success: boolean;
    feedback: string;
    corrections?: string[];
  };
  timestamp: Date;
}

export interface ESANGContextEntry {
  action: string;
  wasSuccessful: boolean;
  feedback: string;
  corrections?: string[];
  timeAgo: string;
}

// ── In-Memory LRU Cache (per-user) ───────────────────────────────────────────
// Primary storage uses DB; this cache avoids repeated DB reads within a session.

const memoryCache: Map<number, { entries: ESANGMemoryEntry[]; ts: number }> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

function getCachedMemory(userId: number): ESANGMemoryEntry[] | null {
  const cached = memoryCache.get(userId);
  if (!cached) return null;
  if (Date.now() - cached.ts > CACHE_TTL_MS) {
    memoryCache.delete(userId);
    return null;
  }
  return cached.entries;
}

function setCachedMemory(userId: number, entries: ESANGMemoryEntry[]): void {
  // Evict oldest if cache grows too large
  if (memoryCache.size > 200) {
    const oldest = memoryCache.keys().next().value;
    if (oldest !== undefined) memoryCache.delete(oldest);
  }
  memoryCache.set(userId, { entries, ts: Date.now() });
}

// ── Database Operations ───────────────────────────────────────────────────────

/**
 * Ensure the esang_memory table exists (called lazily).
 */
let tableEnsured = false;
async function ensureTable(): Promise<void> {
  if (tableEnsured) return;
  const db = await getDb();
  if (!db) return;

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS esang_memory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        action VARCHAR(100) NOT NULL,
        input_data JSON,
        result_data JSON,
        verification_success TINYINT(1) DEFAULT 0,
        verification_feedback TEXT,
        verification_corrections JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_esang_memory_user (user_id),
        INDEX idx_esang_memory_action (action),
        INDEX idx_esang_memory_created (created_at)
      )
    `);
    tableEnsured = true;
  } catch (err: any) {
    // Table might already exist with different schema — that's OK
    if (!err.message?.includes("already exists")) {
      logger.warn("[ESANGMemory] Table creation warning:", err.message);
    }
    tableEnsured = true;
  }
}

/**
 * Load memory entries for a user from database.
 */
async function loadFromDB(userId: number): Promise<ESANGMemoryEntry[]> {
  await ensureTable();
  const db = await getDb();
  if (!db) return [];

  try {
    const rows: any[] = await db.execute(sql`
      SELECT id, user_id, action, input_data, result_data,
             verification_success, verification_feedback, verification_corrections,
             created_at
      FROM esang_memory
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${WINDOW_SIZE}
    `) as any;

    const resultRows = Array.isArray(rows) ? (Array.isArray(rows[0]) ? rows[0] : rows) : [];

    return resultRows.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      action: r.action,
      input: typeof r.input_data === "string" ? JSON.parse(r.input_data) : (r.input_data || {}),
      result: typeof r.result_data === "string" ? JSON.parse(r.result_data) : (r.result_data || {}),
      verification: {
        success: !!r.verification_success,
        feedback: r.verification_feedback || "",
        corrections: typeof r.verification_corrections === "string"
          ? JSON.parse(r.verification_corrections)
          : (r.verification_corrections || undefined),
      },
      timestamp: new Date(r.created_at),
    })).reverse(); // Oldest first for context injection
  } catch (err: any) {
    logger.warn("[ESANGMemory] Load error:", err.message);
    return [];
  }
}

/**
 * Save a memory entry to database and enforce TailL window.
 */
async function saveToDB(entry: ESANGMemoryEntry): Promise<void> {
  await ensureTable();
  const db = await getDb();
  if (!db) return;

  try {
    // Insert new entry
    await db.execute(sql`
      INSERT INTO esang_memory (user_id, action, input_data, result_data,
        verification_success, verification_feedback, verification_corrections)
      VALUES (
        ${entry.userId},
        ${entry.action},
        ${JSON.stringify(entry.input)},
        ${JSON.stringify(entry.result)},
        ${entry.verification.success ? 1 : 0},
        ${entry.verification.feedback},
        ${JSON.stringify(entry.verification.corrections || [])}
      )
    `);

    // TailL: Delete oldest entries beyond window size
    await db.execute(sql`
      DELETE FROM esang_memory
      WHERE user_id = ${entry.userId}
        AND id NOT IN (
          SELECT id FROM (
            SELECT id FROM esang_memory
            WHERE user_id = ${entry.userId}
            ORDER BY created_at DESC
            LIMIT ${WINDOW_SIZE}
          ) AS keep_rows
        )
    `);
  } catch (err: any) {
    logger.warn("[ESANGMemory] Save error:", err.message);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Record an ESANG action execution with its verification result.
 * Called after every executeAction() in the ESANG pipeline.
 */
export async function recordAction(
  userId: number,
  action: string,
  input: Record<string, unknown>,
  result: Record<string, unknown>,
  verification: ESANGMemoryEntry["verification"],
): Promise<void> {
  const entry: ESANGMemoryEntry = {
    userId,
    action,
    input,
    result: {
      success: (result as any).success,
      message: (result as any).message,
      // Don't store full data to keep memory compact
    },
    verification,
    timestamp: new Date(),
  };

  // Update cache
  const cached = getCachedMemory(userId) || [];
  cached.push(entry);
  if (cached.length > WINDOW_SIZE) cached.splice(0, cached.length - WINDOW_SIZE);
  setCachedMemory(userId, cached);

  // Persist to DB (fire-and-forget)
  saveToDB(entry).catch(() => {});
}

/**
 * Get memory entries for a user (from cache or DB).
 */
export async function getMemory(userId: number): Promise<ESANGMemoryEntry[]> {
  // Check cache first
  const cached = getCachedMemory(userId);
  if (cached) return cached;

  // Load from DB
  const entries = await loadFromDB(userId);
  setCachedMemory(userId, entries);
  return entries;
}

/**
 * Get relevant context entries for the current action.
 * Filters to entries that are most useful for the AI:
 *   1. Same action type (direct precedent)
 *   2. Failed actions with corrections (learning)
 *   3. Recent actions (temporal relevance)
 */
export async function getRelevantContext(
  userId: number,
  currentAction?: string,
): Promise<ESANGContextEntry[]> {
  const memory = await getMemory(userId);
  if (memory.length === 0) return [];

  const now = Date.now();

  // Score each entry for relevance
  const scored = memory.map(entry => {
    let score = 0;

    // Same action type → highest relevance
    if (currentAction && entry.action === currentAction) score += 3;

    // Failed with corrections → learning signal
    if (!entry.verification.success && entry.verification.corrections?.length) score += 2;

    // Failed without corrections → moderate signal
    if (!entry.verification.success) score += 1;

    // Recency bonus (decay over 1 hour)
    const ageMs = now - entry.timestamp.getTime();
    score += Math.max(0, 1 - ageMs / (60 * 60 * 1000));

    return { entry, score };
  });

  // Sort by score and take top entries
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, MAX_CONTEXT_ENTRIES);

  return top.map(({ entry }) => ({
    action: entry.action,
    wasSuccessful: entry.verification.success,
    feedback: entry.verification.feedback,
    corrections: entry.verification.corrections,
    timeAgo: formatTimeAgo(now - entry.timestamp.getTime()),
  }));
}

/**
 * Format memory context as a string for injection into ESANG's system prompt.
 */
export async function getContextPrompt(userId: number, currentAction?: string): Promise<string> {
  const context = await getRelevantContext(userId, currentAction);
  if (context.length === 0) return "";

  const lines = ["<MEMORY>"];
  for (const entry of context) {
    const status = entry.wasSuccessful ? "OK" : "FAILED";
    lines.push(`[${entry.timeAgo}] ${entry.action} → ${status}: ${entry.feedback}`);
    if (entry.corrections?.length) {
      lines.push(`  Corrections: ${entry.corrections.join("; ")}`);
    }
  }
  lines.push("</MEMORY>");

  return lines.join("\n");
}

/**
 * Clear memory for a user (e.g., on account reset).
 */
export async function clearMemory(userId: number): Promise<void> {
  memoryCache.delete(userId);

  const db = await getDb();
  if (!db) return;

  try {
    await db.execute(sql`DELETE FROM esang_memory WHERE user_id = ${userId}`);
  } catch { /* non-critical */ }
}

/**
 * Get memory stats for monitoring.
 */
export function getMemoryStats(): {
  cachedUsers: number;
  windowSize: number;
  maxContextEntries: number;
} {
  return {
    cachedUsers: memoryCache.size,
    windowSize: WINDOW_SIZE,
    maxContextEntries: MAX_CONTEXT_ENTRIES,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTimeAgo(ms: number): string {
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.round(hr / 24)}d ago`;
}
