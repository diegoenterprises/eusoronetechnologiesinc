/**
 * OFAC SDN SCREENING SERVICE
 * Real sanctions screening against the US Treasury OFAC SDN list.
 * Downloads and caches the official SDN CSV from treasury.gov.
 * Performs fuzzy name matching using normalized Levenshtein distance.
 *
 * Data source: https://www.treasury.gov/ofac/downloads/sdn.csv
 * Also screens: https://www.treasury.gov/ofac/downloads/consolidated/cons_prim.csv
 */

import { logger } from "../_core/logger";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SdnEntry {
  uid: string;
  name: string;
  type: string; // "individual" | "entity" | "vessel" | "aircraft"
  country: string;
  remarks: string;
  aliases: string[];
}

export interface ScreeningMatch {
  uid: string;
  name: string;
  type: string;
  country: string;
  remarks: string;
  score: number; // 0-100 match confidence
  listSource: string;
}

export interface ScreeningResult {
  entityName: string;
  screenedAt: string;
  totalEntriesScreened: number;
  matches: ScreeningMatch[];
  sdnMatch: boolean;
  consolidatedMatch: boolean;
  overallRisk: "CLEAR" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  listsScreened: Array<{ name: string; source: string; match: boolean; entriesCount: number }>;
}

// ─── Cache ───────────────────────────────────────────────────────────────────

let sdnCache: SdnEntry[] = [];
let consCache: SdnEntry[] = [];
let sdnLastFetch = 0;
let consLastFetch = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const SDN_URL = "https://www.treasury.gov/ofac/downloads/sdn.csv";
const CONS_URL = "https://www.treasury.gov/ofac/downloads/consolidated/cons_prim.csv";

// ─── CSV Parser ──────────────────────────────────────────────────────────────

function parseSdnCsv(csv: string): SdnEntry[] {
  const entries: SdnEntry[] = [];
  const lines = csv.split("\n");

  for (const line of lines) {
    if (!line.trim()) continue;

    // SDN CSV format: uid, name, type_indicator, country, ...remarks
    // Fields may be quoted, use simple parse
    const fields = parseCSVLine(line);
    if (fields.length < 2) continue;

    const uid = fields[0]?.trim() || "";
    const name = fields[1]?.trim().replace(/^"|"$/g, "") || "";
    if (!name || name === "-0-") continue;

    const typeRaw = (fields[2]?.trim() || "").replace(/^"|"$/g, "");
    const country = (fields[3]?.trim() || "").replace(/^"|"$/g, "").replace(/-0-/g, "").trim();
    const remarks = (fields[11]?.trim() || "").replace(/^"|"$/g, "").replace(/-0-/g, "").trim();

    // Extract aliases from remarks
    const aliases: string[] = [];
    const akaMatch = remarks.match(/a\.k\.a\.\s*'([^']+)'/gi);
    if (akaMatch) {
      for (const m of akaMatch) {
        const alias = m.replace(/a\.k\.a\.\s*'/i, "").replace(/'$/, "").trim();
        if (alias) aliases.push(alias);
      }
    }

    let type = "entity";
    if (typeRaw === "individual" || typeRaw.includes("individual")) type = "individual";
    else if (typeRaw === "vessel" || typeRaw.includes("vessel")) type = "vessel";
    else if (typeRaw === "aircraft" || typeRaw.includes("aircraft")) type = "aircraft";

    entries.push({ uid, name, type, country, remarks, aliases });
  }

  return entries;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

// ─── Fetch & Cache ───────────────────────────────────────────────────────────

async function fetchSdnList(): Promise<SdnEntry[]> {
  if (sdnCache.length > 0 && Date.now() - sdnLastFetch < CACHE_TTL) {
    return sdnCache;
  }

  try {
    logger.info("[ofacScreening] Fetching OFAC SDN list from treasury.gov...");
    const res = await fetch(SDN_URL, {
      headers: { "User-Agent": "EusoTrip-Compliance/1.0" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`SDN fetch failed: ${res.status}`);
    const csv = await res.text();
    sdnCache = parseSdnCsv(csv);
    sdnLastFetch = Date.now();
    logger.info(`[ofacScreening] SDN list loaded: ${sdnCache.length} entries`);
    return sdnCache;
  } catch (e) {
    logger.error("[ofacScreening] Failed to fetch SDN list:", e);
    return sdnCache; // return stale cache if available
  }
}

async function fetchConsolidatedList(): Promise<SdnEntry[]> {
  if (consCache.length > 0 && Date.now() - consLastFetch < CACHE_TTL) {
    return consCache;
  }

  try {
    logger.info("[ofacScreening] Fetching OFAC Consolidated list...");
    const res = await fetch(CONS_URL, {
      headers: { "User-Agent": "EusoTrip-Compliance/1.0" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`Consolidated fetch failed: ${res.status}`);
    const csv = await res.text();
    consCache = parseSdnCsv(csv);
    consLastFetch = Date.now();
    logger.info(`[ofacScreening] Consolidated list loaded: ${consCache.length} entries`);
    return consCache;
  } catch (e) {
    logger.error("[ofacScreening] Failed to fetch Consolidated list:", e);
    return consCache;
  }
}

// ─── Fuzzy Matching ──────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Levenshtein distance */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Use single-row optimization for memory efficiency
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,       // deletion
        curr[j - 1] + 1,   // insertion
        prev[j - 1] + cost  // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

/** Returns 0-100 match score (100 = exact match) */
function matchScore(query: string, target: string): number {
  const nq = normalize(query);
  const nt = normalize(target);

  if (!nq || !nt) return 0;

  // Exact match
  if (nq === nt) return 100;

  // Contains match — high score
  if (nt.includes(nq) || nq.includes(nt)) {
    const shorter = Math.min(nq.length, nt.length);
    const longer = Math.max(nq.length, nt.length);
    return Math.round(70 + 30 * (shorter / longer));
  }

  // Token overlap
  const qTokens = nq.split(" ").filter(Boolean);
  const tTokens = nt.split(" ").filter(Boolean);
  const overlap = qTokens.filter(qt => tTokens.some(tt => tt.includes(qt) || qt.includes(tt))).length;
  const tokenScore = qTokens.length > 0 ? (overlap / qTokens.length) * 60 : 0;

  // Levenshtein similarity
  const dist = levenshtein(nq, nt);
  const maxLen = Math.max(nq.length, nt.length);
  const levScore = maxLen > 0 ? Math.round((1 - dist / maxLen) * 100) : 0;

  return Math.max(tokenScore, levScore);
}

// ─── Main Screening Function ─────────────────────────────────────────────────

const MATCH_THRESHOLD = 75; // minimum score to consider a match

export async function screenEntity(entityName: string): Promise<ScreeningResult> {
  const screenedAt = new Date().toISOString();

  if (!entityName || entityName.trim().length < 2) {
    return {
      entityName: entityName || "N/A",
      screenedAt,
      totalEntriesScreened: 0,
      matches: [],
      sdnMatch: false,
      consolidatedMatch: false,
      overallRisk: "CLEAR",
      listsScreened: [],
    };
  }

  // Fetch both lists in parallel
  const [sdnList, consList] = await Promise.all([
    fetchSdnList(),
    fetchConsolidatedList(),
  ]);

  const sdnMatches: ScreeningMatch[] = [];
  const consMatches: ScreeningMatch[] = [];

  // Screen against SDN list
  for (const entry of sdnList) {
    let bestScore = matchScore(entityName, entry.name);

    // Also check aliases
    for (const alias of entry.aliases) {
      const aliasScore = matchScore(entityName, alias);
      if (aliasScore > bestScore) bestScore = aliasScore;
    }

    if (bestScore >= MATCH_THRESHOLD) {
      sdnMatches.push({
        uid: entry.uid,
        name: entry.name,
        type: entry.type,
        country: entry.country,
        remarks: entry.remarks,
        score: bestScore,
        listSource: "OFAC SDN",
      });
    }
  }

  // Screen against Consolidated list
  for (const entry of consList) {
    let bestScore = matchScore(entityName, entry.name);
    for (const alias of entry.aliases) {
      const aliasScore = matchScore(entityName, alias);
      if (aliasScore > bestScore) bestScore = aliasScore;
    }

    if (bestScore >= MATCH_THRESHOLD) {
      consMatches.push({
        uid: entry.uid,
        name: entry.name,
        type: entry.type,
        country: entry.country,
        remarks: entry.remarks,
        score: bestScore,
        listSource: "OFAC Consolidated",
      });
    }
  }

  // Combine and sort by score
  const allMatches = [...sdnMatches, ...consMatches]
    .sort((a, b) => b.score - a.score)
    .slice(0, 20); // top 20

  const hasSdn = sdnMatches.length > 0;
  const hasCons = consMatches.length > 0;
  const topScore = allMatches[0]?.score ?? 0;

  let overallRisk: ScreeningResult["overallRisk"] = "CLEAR";
  if (topScore >= 95) overallRisk = "CRITICAL";
  else if (topScore >= 85) overallRisk = "HIGH";
  else if (topScore >= 80) overallRisk = "MEDIUM";
  else if (topScore >= MATCH_THRESHOLD) overallRisk = "LOW";

  return {
    entityName,
    screenedAt,
    totalEntriesScreened: sdnList.length + consList.length,
    matches: allMatches,
    sdnMatch: hasSdn,
    consolidatedMatch: hasCons,
    overallRisk,
    listsScreened: [
      { name: "SDN (Specially Designated Nationals)", source: "OFAC / US Treasury", match: hasSdn, entriesCount: sdnList.length },
      { name: "Non-SDN Consolidated Sanctions", source: "OFAC / US Treasury", match: hasCons, entriesCount: consList.length },
    ],
  };
}
