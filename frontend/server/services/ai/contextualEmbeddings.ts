/**
 * WS-T1-006: RAG Enhancement with Contextual Embeddings
 *
 * Upgrades the existing RAG Retriever with contextual embeddings where each
 * chunk retains awareness of its parent document. Critical for FMCSA regulation
 * search where a specific paragraph only makes sense in context of its parent
 * CFR section.
 *
 * How pplx-embed-context-v1 Helps:
 *   - Chunks retain document-level context via dual-objective embedding
 *   - "Section 49 CFR 385.5(b)" retains awareness that it's about FMCSA safety fitness
 *   - "can I transport crude near a school zone?" → finds exact regulatory passage WITH context
 *
 * Integration:
 *   - Existing RAG Retriever at ragRetriever.ts
 *   - 9.8M FMCSA records as primary corpus
 *   - ERG hazmat guide as secondary corpus
 *   - ESANG's erg_lookup action benefits directly
 *
 * Reference: pplx-embed-context-v1 (ConTEB SOTA, arXiv:2602.11151)
 */

import { logger } from "../../_core/logger";
import { embeddingService, EmbeddingService } from "../embeddings/embeddingService";
import { getDb } from "../../db";
import { sql } from "drizzle-orm";

// ── Constants ─────────────────────────────────────────────────────────────────

const CHUNK_SIZE = 512;           // Characters per chunk
const CHUNK_OVERLAP = 64;         // Overlap between chunks for continuity
const MAX_CONTEXT_PREFIX = 200;   // Max chars for document context prefix
const BATCH_SIZE = 32;            // Embedding batch size
const INDEX_CACHE_TTL_MS = 10 * 60 * 1000; // 10 min

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DocumentSource {
  id: string;
  title: string;
  category: string;        // "fmcsa_regulation", "erg_guide", "platform_knowledge"
  fullText: string;
  metadata?: Record<string, unknown>;
}

export interface ContextualChunk {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  category: string;
  chunkIndex: number;
  totalChunks: number;
  text: string;             // Original chunk text
  contextualText: string;   // Chunk prefixed with document context
  embedding: number[] | null;
  metadata?: Record<string, unknown>;
}

export interface ContextualSearchResult {
  chunk: ContextualChunk;
  score: number;
  documentContext: string;  // Parent document summary for display
}

export interface ContextualRAGContext {
  results: ContextualSearchResult[];
  totalIndexed: number;
  retrievalTimeMs: number;
  contextEnhanced: boolean;
}

// ── Chunking with Context ─────────────────────────────────────────────────────

/**
 * Split a document into overlapping chunks, each prefixed with document context.
 * This is the key innovation: each chunk "remembers" its parent document.
 */
function chunkDocument(doc: DocumentSource): ContextualChunk[] {
  const text = doc.fullText.trim();
  if (!text) return [];

  // Create document context prefix (title + category summary)
  const contextPrefix = buildContextPrefix(doc);

  // Split into chunks with overlap
  const chunks: ContextualChunk[] = [];
  let pos = 0;
  let index = 0;

  while (pos < text.length) {
    // Find natural break point (sentence end, paragraph break)
    let end = Math.min(pos + CHUNK_SIZE, text.length);
    if (end < text.length) {
      // Try to break at sentence boundary
      const lastPeriod = text.lastIndexOf(". ", end);
      const lastNewline = text.lastIndexOf("\n", end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      if (breakPoint > pos + CHUNK_SIZE * 0.5) {
        end = breakPoint + 1;
      }
    }

    const chunkText = text.slice(pos, end).trim();
    if (chunkText.length > 20) { // Skip tiny fragments
      chunks.push({
        chunkId: `${doc.id}:${index}`,
        documentId: doc.id,
        documentTitle: doc.title,
        category: doc.category,
        chunkIndex: index,
        totalChunks: 0, // Set after loop
        text: chunkText,
        contextualText: `${contextPrefix}\n\n${chunkText}`,
        embedding: null,
        metadata: doc.metadata,
      });
      index++;
    }

    // Advance with overlap
    pos = end - CHUNK_OVERLAP;
    if (pos <= (chunks.length > 0 ? end - CHUNK_SIZE : 0)) {
      pos = end; // Prevent infinite loop
    }
  }

  // Set totalChunks
  for (const chunk of chunks) {
    chunk.totalChunks = chunks.length;
  }

  return chunks;
}

/**
 * Build a context prefix that encodes document-level awareness into each chunk.
 * This is what makes contextual embeddings work — the embedding model sees
 * "This chunk is from [document title] about [topic]" before the actual text.
 */
function buildContextPrefix(doc: DocumentSource): string {
  const parts: string[] = [];

  parts.push(`[Document: ${doc.title}]`);

  switch (doc.category) {
    case "fmcsa_regulation":
      parts.push("[Type: FMCSA Federal Motor Carrier Safety Regulation]");
      break;
    case "erg_guide":
      parts.push("[Type: ERG Emergency Response Guide for Hazardous Materials]");
      break;
    case "cfr_section":
      parts.push("[Type: Code of Federal Regulations - Transportation]");
      break;
    case "platform_knowledge":
      parts.push("[Type: EusoTrip Platform Documentation]");
      break;
    default:
      parts.push(`[Type: ${doc.category}]`);
  }

  if (doc.metadata) {
    if (doc.metadata.cfrPart) parts.push(`[CFR: 49 CFR Part ${doc.metadata.cfrPart}]`);
    if (doc.metadata.unNumber) parts.push(`[UN Number: ${doc.metadata.unNumber}]`);
    if (doc.metadata.hazmatClass) parts.push(`[Hazmat Class: ${doc.metadata.hazmatClass}]`);
    if (doc.metadata.topic) parts.push(`[Topic: ${doc.metadata.topic}]`);
  }

  const prefix = parts.join(" ");
  return prefix.length > MAX_CONTEXT_PREFIX
    ? prefix.slice(0, MAX_CONTEXT_PREFIX)
    : prefix;
}

// ── Contextual Index ──────────────────────────────────────────────────────────

let contextualIndex: ContextualChunk[] = [];
let lastIndexBuild = 0;
let indexBuilding = false;

/**
 * Build the contextual embedding index from document sources.
 * Embeds each chunk WITH its document context prefix.
 */
export async function buildContextualIndex(
  documents: DocumentSource[],
): Promise<{ indexed: number; errors: number; chunks: number }> {
  if (indexBuilding) {
    return { indexed: 0, errors: 0, chunks: contextualIndex.length };
  }

  indexBuilding = true;
  let indexed = 0;
  let errors = 0;

  try {
    const healthy = await embeddingService.isHealthy();
    if (!healthy) {
      logger.warn("[ContextualEmbed] Embedding service unavailable");
      indexBuilding = false;
      return { indexed: 0, errors: 0, chunks: contextualIndex.length };
    }

    // Chunk all documents
    const allChunks: ContextualChunk[] = [];
    for (const doc of documents) {
      const chunks = chunkDocument(doc);
      allChunks.push(...chunks);
    }

    logger.info(`[ContextualEmbed] Chunked ${documents.length} documents into ${allChunks.length} contextual chunks`);

    // Batch embed using contextual text (includes document prefix)
    for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
      const batch = allChunks.slice(i, i + BATCH_SIZE);
      try {
        const texts = batch.map(c => c.contextualText);
        const embeddings = await embeddingService.embed(texts);

        for (let j = 0; j < batch.length; j++) {
          if (embeddings[j]) {
            batch[j].embedding = embeddings[j].embedding.values;
            indexed++;
          }
        }
      } catch (err: any) {
        logger.error(`[ContextualEmbed] Batch ${i}-${i + batch.length} failed:`, err.message);
        errors += batch.length;
      }
    }

    // Replace index
    contextualIndex = allChunks.filter(c => c.embedding !== null);
    lastIndexBuild = Date.now();

    logger.info(`[ContextualEmbed] Index built: ${indexed} embedded, ${errors} errors, ${contextualIndex.length} total`);
  } finally {
    indexBuilding = false;
  }

  return { indexed, errors, chunks: contextualIndex.length };
}

/**
 * Search the contextual index for chunks matching a query.
 * Returns chunks ranked by cosine similarity, each with its parent document context.
 */
export async function contextualSearch(
  query: string,
  options: {
    topK?: number;
    threshold?: number;
    categories?: string[];
  } = {},
): Promise<ContextualRAGContext> {
  const start = Date.now();
  const topK = options.topK ?? 5;
  const threshold = options.threshold ?? 0.25;

  if (contextualIndex.length === 0) {
    return {
      results: [],
      totalIndexed: 0,
      retrievalTimeMs: Date.now() - start,
      contextEnhanced: false,
    };
  }

  try {
    const healthy = await embeddingService.isHealthy();
    if (!healthy) {
      return {
        results: [],
        totalIndexed: contextualIndex.length,
        retrievalTimeMs: Date.now() - start,
        contextEnhanced: false,
      };
    }

    // Embed query (no context prefix for queries — the model handles asymmetric matching)
    const queryVec = await embeddingService.embedOne(query);

    // Filter by categories if specified
    let candidates = contextualIndex;
    if (options.categories?.length) {
      const catSet = new Set(options.categories);
      candidates = candidates.filter(c => catSet.has(c.category));
    }

    // Cosine similarity search
    const scored: Array<{ chunk: ContextualChunk; score: number }> = [];
    for (const chunk of candidates) {
      if (!chunk.embedding) continue;
      const score = EmbeddingService.cosineSimilarity(queryVec.values, chunk.embedding);
      if (score >= threshold) {
        scored.push({ chunk, score });
      }
    }

    // Sort and take top-K
    scored.sort((a, b) => b.score - a.score);
    const topResults = scored.slice(0, topK);

    const results: ContextualSearchResult[] = topResults.map(r => ({
      chunk: r.chunk,
      score: Math.round(r.score * 1000) / 1000,
      documentContext: `From "${r.chunk.documentTitle}" (${r.chunk.category}) — chunk ${r.chunk.chunkIndex + 1}/${r.chunk.totalChunks}`,
    }));

    return {
      results,
      totalIndexed: contextualIndex.length,
      retrievalTimeMs: Date.now() - start,
      contextEnhanced: true,
    };
  } catch (err: any) {
    logger.error("[ContextualEmbed] Search error:", err.message);
    return {
      results: [],
      totalIndexed: contextualIndex.length,
      retrievalTimeMs: Date.now() - start,
      contextEnhanced: false,
    };
  }
}

/**
 * Format contextual search results for injection into an AI prompt.
 * Each result includes its parent document context for grounding.
 */
export function formatContextualResults(ctx: ContextualRAGContext): string {
  if (ctx.results.length === 0) return "";

  const lines = [
    `\n\n## Retrieved Knowledge (${ctx.results.length} contextual chunks, ${ctx.retrievalTimeMs}ms)`,
  ];

  for (const r of ctx.results) {
    lines.push(`\n### ${r.documentContext} (relevance: ${(r.score * 100).toFixed(1)}%)`);
    lines.push(r.chunk.text);
  }

  lines.push("\n\nUse the above contextual knowledge to ground your response. Each chunk includes its parent document context for accurate citation.");

  return lines.join("\n");
}

// ── FMCSA Regulation Corpus ───────────────────────────────────────────────────

/**
 * Seed the contextual index with FMCSA regulations and ERG data.
 * These are the primary document corpora for the platform.
 */
export async function seedFMCSACorpus(): Promise<{ indexed: number; errors: number; chunks: number }> {
  const documents: DocumentSource[] = [
    // ── FMCSA Safety Fitness ──
    {
      id: "fmcsa-part-385",
      title: "49 CFR Part 385 — Safety Fitness Procedures",
      category: "fmcsa_regulation",
      fullText: `49 CFR Part 385 — Safety Fitness Procedures. This part establishes the FMCSA's procedures to determine the safety fitness of motor carriers, to assign safety ratings, to direct motor carriers to take remedial action when required, and to prohibit motor carriers receiving a rating of "unsatisfactory" from operating a CMV. Section 385.5 defines safety ratings: Satisfactory means a motor carrier has adequate safety management controls. Conditional means a motor carrier does not have adequate safety management controls to ensure compliance. Unsatisfactory means a motor carrier does not have adequate safety management controls. Section 385.7: A motor carrier receiving an "unsatisfactory" rating is prohibited from operating a CMV beginning 61 days after the date of the notice unless the rating is changed. Section 385.9: Motor carriers receiving proposed "conditional" or "unsatisfactory" ratings may request an administrative review within 90 days. New entrant carriers must pass a safety audit within 18 months of receiving operating authority.`,
      metadata: { cfrPart: "385", topic: "Safety Fitness" },
    },
    {
      id: "fmcsa-part-387",
      title: "49 CFR Part 387 — Minimum Levels of Financial Responsibility",
      category: "fmcsa_regulation",
      fullText: `49 CFR Part 387 — Minimum Levels of Financial Responsibility for Motor Carriers. Section 387.7: Filing of evidence of security. Motor carriers must file with FMCSA evidence of financial responsibility in the form of surety bonds, policies of insurance, or self-insurance. Section 387.9: Financial responsibility minimum levels. For-hire carriers of property: $750,000 for general freight. $1,000,000 for hazardous substances (as defined in 49 CFR 171.8), oil listed in 49 CFR 172.101, or any quantity of Class 1 (explosives), Class 2.3 (poison gas), or Division 6.1 (poison) materials. $5,000,000 for transportation of large quantities of radioactive materials. Section 387.31: Financial responsibility for freight brokers. $75,000 surety bond or trust fund required ($300,000 effective October 2013). Brokers must maintain BMC-84 (surety bond) or BMC-85 (trust fund) on file with FMCSA.`,
      metadata: { cfrPart: "387", topic: "Financial Responsibility" },
    },
    {
      id: "fmcsa-part-395",
      title: "49 CFR Part 395 — Hours of Service of Drivers",
      category: "fmcsa_regulation",
      fullText: `49 CFR Part 395 — Hours of Service of Drivers. Section 395.3: Maximum driving time for property-carrying vehicles. A driver shall not drive after: (1) Having been on duty 14 consecutive hours following 10 consecutive hours off duty; (2) Having driven for 11 hours following 10 consecutive hours off duty. Section 395.5: Maximum driving time for passenger-carrying vehicles. 10 hours driving after 8 consecutive hours off duty, 15-hour on-duty limit. Section 395.8: Driver's record of duty status. Electronic logging devices required per Part 395 Subpart B. Section 395.11: Supporting documents. Drivers must retain: fuel receipts, BOLs, delivery receipts, toll receipts. All documents must be retained for 6 months. Carriers must retain driver logs for 6 months. Section 395.1(e)(1): Short-haul exception — drivers operating within 150 air-mile radius, reporting to same location daily, not required to use ELD if on duty 14 hours or less. Adverse driving conditions: additional 2 hours driving allowed for unexpected weather/traffic.`,
      metadata: { cfrPart: "395", topic: "Hours of Service" },
    },
    {
      id: "fmcsa-part-397",
      title: "49 CFR Part 397 — Transportation of Hazardous Materials; Driving and Parking Rules",
      category: "fmcsa_regulation",
      fullText: `49 CFR Part 397 — Hazardous Materials Driving and Parking Rules. Section 397.5: Attendance and surveillance of motor vehicles. A motor vehicle containing Division 1.1, 1.2, or 1.3 explosives must be attended at all times by its driver or a qualified representative. Section 397.7: Parking. A motor vehicle containing hazardous materials must not be parked within 5 feet of the traveled portion of a highway or roadway, except for brief periods when necessitated by operational needs. Section 397.9: Fueling. No driver shall fuel a motor vehicle with the engine running while containing hazardous materials. Section 397.11: Tires. A driver must examine each tire at the beginning of each trip and each time the vehicle is parked. Section 397.13: Smoking. No person shall smoke or carry a lighted cigarette, cigar, or pipe within 25 feet of any motor vehicle containing Class 1 (explosives), Class 2.1 (flammable gas), Class 3 (flammable liquid), Class 4 (flammable solid), or Class 5 (oxidizer). Section 397.67: Routing. Motor carriers transporting hazardous materials requiring placarding shall use routes that minimize risk. Prefer interstate highways and US numbered routes. Avoid densely populated areas, tunnels, narrow streets, and alleys unless no practicable alternative exists.`,
      metadata: { cfrPart: "397", topic: "Hazmat Driving Rules" },
    },
    {
      id: "fmcsa-part-172",
      title: "49 CFR Part 172 — Hazardous Materials Table, Markings, Labeling, Placarding",
      category: "fmcsa_regulation",
      fullText: `49 CFR Part 172 — Hazardous Materials Table and Communication Requirements. Section 172.101: The Hazardous Materials Table lists proper shipping names, hazard classes, UN numbers, packing groups, labels, and special provisions for all regulated materials. Section 172.200: Shipping papers. Every person who offers a hazardous material for transport must describe it on a shipping paper. Must include: proper shipping name, hazard class, UN/NA number, packing group, quantity, emergency response info. Section 172.300: Marking requirements. Each package must be marked with proper shipping name and UN number. Section 172.400: Labeling. Hazard labels must be placed near the marked proper shipping name. Section 172.500: Placarding. Vehicles must be placarded when transporting any quantity of Table 1 materials (explosives, poison gas, dangerous when wet, organic peroxides) or 1,001+ lbs aggregate gross weight of Table 2 materials. Four placards required, one on each side and each end. Section 172.602: Emergency response information. Must be immediately accessible during transport. ERG guidebook, Safety Data Sheets, or 24-hour emergency telephone number.`,
      metadata: { cfrPart: "172", topic: "Hazmat Communication" },
    },

    // ── ERG Contextual Knowledge ──
    {
      id: "erg-guide-128",
      title: "ERG Guide 128 — Flammable Liquids (Non-Polar/Water-Immiscible)",
      category: "erg_guide",
      fullText: `ERG 2024 Guide 128 — Flammable Liquids (Non-Polar/Water-Immiscible). Covers: Petroleum crude oil UN1267, Gasoline UN1203, Diesel UN1202, Jet Fuel UN1863, Kerosene UN1223, Naphtha UN1256. POTENTIAL HAZARDS: FIRE OR EXPLOSION — Highly flammable. Will be easily ignited by heat, sparks or flames. Vapors may form explosive mixtures with air. Vapors may travel to source of ignition and flash back. Most vapors are heavier than air and will spread along ground. Runoff to sewer may create fire or explosion hazard. HEALTH — Inhalation or contact may irritate or burn skin and eyes. Fire may produce irritating, corrosive gases. Runoff from fire control may cause pollution. EMERGENCY RESPONSE: FIRE — Use dry chemical, CO2, water spray, or alcohol-resistant foam. Do not use straight streams. Move containers from fire area if possible. For tank fire, cool with flooding quantities of water, do not direct water at source of leak. SPILL — Eliminate all ignition sources (no smoking, flares, sparks). All equipment must be grounded. Do not touch or walk through spilled material. Stop leak if safe to do so. Prevent entry into waterways. FIRST AID — Move victim to fresh air. Call emergency medical care. Remove contaminated clothing. In case of contact with substance, immediately flush with running water for at least 20 minutes. ISOLATION: Small spill 50m (165ft). Large spill 300m (1000ft). Night large spill 300m.`,
      metadata: { unNumber: "1267", hazmatClass: "3", topic: "Flammable Liquids" },
    },
    {
      id: "erg-guide-115",
      title: "ERG Guide 115 — Gases - Flammable (Including Refrigerated Liquids)",
      category: "erg_guide",
      fullText: `ERG 2024 Guide 115 — Gases - Flammable. Covers: Propane UN1978, LPG UN1075, Butane UN1011, Natural Gas UN1971, Methane UN1971. POTENTIAL HAZARDS: FIRE OR EXPLOSION — Extremely flammable. May be ignited by heat, sparks, or flames. Container may BLEVE when exposed to fire. Vapor is heavier than air and may travel long distance to an ignition source. HEALTH — Vapors may cause dizziness or asphyxiation without warning. Contact with gas or liquefied gas may cause burns, severe injury, and/or frostbite. Fire may produce irritating gases. EMERGENCY RESPONSE: FIRE — Do not extinguish a leaking gas fire unless leak can be stopped. Use water spray to cool containers exposed to fire. Move containers from fire if safe. Do not direct water at source of leak. BLEVE WARNING — If tank is exposed to fire, withdraw immediately to a secure location. ALWAYS stay away from ends of tanks. For massive fire, use unmanned hose holder or monitor nozzles. ISOLATION: Small spill 100m (330ft). Large spill 800m (0.5mi). Night large spill 800m.`,
      metadata: { unNumber: "1075", hazmatClass: "2.1", topic: "Flammable Gases" },
    },
    {
      id: "erg-guide-131",
      title: "ERG Guide 131 — Flammable Liquids - Toxic",
      category: "erg_guide",
      fullText: `ERG 2024 Guide 131 — Flammable Liquids - Toxic. Covers: Sour Crude Oil UN3494, Acrylonitrile UN1093, Allyl Alcohol UN1098. CRITICAL: Materials covered by this guide may contain hydrogen sulfide (H2S) which is extremely toxic. POTENTIAL HAZARDS: FIRE OR EXPLOSION — Highly flammable. Vapors may form explosive mixtures with air. HEALTH — TOXIC; inhalation, ingestion or skin contact may cause severe injury or death. H2S: Lethal at 500+ ppm. Olfactory fatigue occurs at 100 ppm (you STOP smelling it before lethal dose). Fire may produce irritating, corrosive toxic gases. EMERGENCY RESPONSE: Full SCBA and chemical-resistant suit REQUIRED. FIRE — Use dry chemical, CO2, alcohol-resistant foam. Water spray may be ineffective. SPILL — Eliminate ignition sources. Ventilate area of leak. Do not touch spilled material. Stop leak from safe distance if possible. ISOLATION: Small spill 50m. Large spill 300m minimum. Night large spill: check ERG Table of Initial Isolation and Protective Action Distances — may be up to 7km+ downwind for TIH materials.`,
      metadata: { unNumber: "3494", hazmatClass: "3", topic: "Flammable Liquids Toxic" },
    },

    // ── Platform Regulatory Knowledge ──
    {
      id: "platform-school-zone-regs",
      title: "Hazmat Transport Near Schools and Population Centers",
      category: "fmcsa_regulation",
      fullText: `Hazardous materials transport near schools and population centers. Per 49 CFR 397.67, motor carriers transporting placarded hazardous materials must operate over routes that do not go through or near heavily populated areas, places where crowds are assembled, tunnels, narrow streets, or alleys, UNLESS there is no practicable alternative. This applies to ALL placarded loads including crude oil (Class 3), LPG (Class 2.1), and chemicals. State and local jurisdictions may designate specific hazmat routes under 49 CFR 397.73. Carriers must comply with all designated route requirements. School zones are considered heavily populated areas. If a route passes near a school zone, the carrier must determine if a practicable alternative route exists. If no alternative exists, the carrier must exercise extra caution, reduce speed, and comply with all local regulations. Some municipalities prohibit hazmat vehicles within a specified distance of schools, hospitals, and other sensitive facilities. Drivers should check local ordinances and routing designations before accepting loads through urban areas.`,
      metadata: { cfrPart: "397", topic: "Hazmat Routing Near Schools" },
    },
    {
      id: "platform-tanker-requirements",
      title: "Tanker Vehicle Requirements for Liquid Bulk Transport",
      category: "fmcsa_regulation",
      fullText: `Tanker vehicle requirements for liquid bulk hazmat. CDL Tanker Endorsement (N): Required for any driver operating a tank vehicle (any CMV designed to transport liquid or gaseous materials in bulk, capacity 119+ gallons). Combined Hazmat+Tanker endorsement is "X" on CDL. DOT specification tanks: MC-306/DOT-406 for atmospheric pressure liquids (gasoline, diesel, crude oil). MC-307/DOT-407 for low-pressure chemicals. MC-331 for high-pressure gases (propane, anhydrous ammonia). MC-338 for cryogenic liquids (LNG, nitrogen). Inspection: Annual DOT inspection required. External visual inspection every 2 years. Hydrostatic pressure test every 5 years. Vapor recovery systems required in CARB states. Tank truck loading/unloading: Grounding required to prevent static discharge. Emergency shutoff valve test at start of each trip. Vapor tightness: no visible leaks permitted. Rollover protection: no tank truck may exceed posted speed limits; recommended max 45 mph in curves for loaded tankers.`,
      metadata: { cfrPart: "180", topic: "Tanker Requirements" },
    },
  ];

  return buildContextualIndex(documents);
}

// ── Enhanced Retrieval ────────────────────────────────────────────────────────

/**
 * Enhanced retrieval that combines standard RAG with contextual embeddings.
 * Falls back to standard retrieval if contextual index is empty.
 */
export async function enhancedRetrieve(
  query: string,
  options: {
    topK?: number;
    threshold?: number;
    categories?: string[];
    includeStandardRAG?: boolean;
  } = {},
): Promise<ContextualRAGContext> {
  const start = Date.now();
  const topK = options.topK ?? 5;

  // Try contextual search first
  const contextualResults = await contextualSearch(query, {
    topK,
    threshold: options.threshold,
    categories: options.categories,
  });

  // If contextual index has results, return them
  if (contextualResults.results.length > 0) {
    return contextualResults;
  }

  // Fallback: use standard RAG retriever
  if (options.includeStandardRAG !== false) {
    try {
      const { retrieveContext } = await import("../embeddings/ragRetriever");
      const standardRAG = await retrieveContext(query, {
        topK,
        threshold: options.threshold,
        entityTypes: options.categories,
      });

      // Convert standard RAG results to contextual format
      const results: ContextualSearchResult[] = standardRAG.chunks.map(chunk => ({
        chunk: {
          chunkId: `standard:${chunk.entityId}`,
          documentId: chunk.entityId,
          documentTitle: chunk.entityType,
          category: chunk.entityType,
          chunkIndex: 0,
          totalChunks: 1,
          text: chunk.text,
          contextualText: chunk.text,
          embedding: null,
          metadata: chunk.metadata,
        },
        score: chunk.score,
        documentContext: `From ${chunk.entityType}:${chunk.entityId}`,
      }));

      return {
        results,
        totalIndexed: contextualIndex.length,
        retrievalTimeMs: Date.now() - start,
        contextEnhanced: false, // Standard RAG, not contextually enhanced
      };
    } catch {
      // Standard RAG also failed
    }
  }

  return {
    results: [],
    totalIndexed: contextualIndex.length,
    retrievalTimeMs: Date.now() - start,
    contextEnhanced: false,
  };
}

// ── Index Management ──────────────────────────────────────────────────────────

/**
 * Get index statistics for monitoring.
 */
export function getContextualIndexStats(): {
  totalChunks: number;
  categories: Record<string, number>;
  documents: number;
  lastBuildAgo: string;
  embeddingModel: string;
} {
  const categories: Record<string, number> = {};
  const docIds = new Set<string>();

  for (const chunk of contextualIndex) {
    categories[chunk.category] = (categories[chunk.category] || 0) + 1;
    docIds.add(chunk.documentId);
  }

  return {
    totalChunks: contextualIndex.length,
    categories,
    documents: docIds.size,
    lastBuildAgo: lastIndexBuild > 0
      ? `${Math.round((Date.now() - lastIndexBuild) / 1000)}s ago`
      : "never",
    embeddingModel: embeddingService.modelId,
  };
}

/**
 * Reset the contextual index (for testing).
 */
export function resetContextualIndex(): void {
  contextualIndex = [];
  lastIndexBuild = 0;
}
