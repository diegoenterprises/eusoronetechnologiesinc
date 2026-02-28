/**
 * AI TURBOCHARGE — Platform-Wide Semantic Intelligence Layer
 * Centralizes embedding-powered search + auto-indexing across all EusoTrip features.
 */

import { embeddingService, EmbeddingService } from "./embeddingService";

type EntityType = "load" | "document" | "knowledge" | "carrier" | "rate_sheet" | "agreement" | "erg_guide" | "zone_intelligence" | "support_ticket" | "message" | "compliance_record";

interface IndexRequest {
  entityType: EntityType;
  entityId: string;
  text: string;
  metadata?: Record<string, unknown>;
}

interface SearchResult {
  entityType: string;
  entityId: string;
  text: string;
  score: number;
  metadata?: Record<string, unknown>;
}

// ── Core: Index Entity ───────────────────────────────────────────────────────
export async function indexEntity(req: IndexRequest): Promise<boolean> {
  try {
    const healthy = await embeddingService.isHealthy();
    if (!healthy) return false;
    const hash = await EmbeddingService.contentHash(req.text);
    const { getDb } = await import("../../db");
    const { embeddings } = await import("../../../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) return false;
    const [existing] = await db.select({ contentHash: embeddings.contentHash })
      .from(embeddings)
      .where(and(eq(embeddings.entityType, req.entityType), eq(embeddings.entityId, req.entityId)))
      .limit(1);
    if (existing && existing.contentHash === hash) return false;
    const vec = await embeddingService.embedOne(req.text);
    const row = {
      contentHash: hash,
      embedding: vec.values,
      dimensions: vec.dimensions,
      model: embeddingService.modelId,
      sourceText: req.text.slice(0, 10000),
      metadata: req.metadata || null,
      updatedAt: new Date(),
    };
    if (existing) {
      await db.update(embeddings).set(row)
        .where(and(eq(embeddings.entityType, req.entityType), eq(embeddings.entityId, req.entityId)));
    } else {
      await db.insert(embeddings).values({
        ...row, entityType: req.entityType, entityId: req.entityId, createdAt: new Date(),
      });
    }
    return true;
  } catch (err) {
    console.error(`[AITurbo] indexEntity(${req.entityType}:${req.entityId}) error:`, err);
    return false;
  }
}

// ── Core: Batch Index (parallelized) ─────────────────────────────────────────
export async function indexBatch(items: IndexRequest[], concurrency = 5): Promise<{ indexed: number; skipped: number }> {
  let indexed = 0, skipped = 0;
  // Process in parallel batches for throughput
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const results = await Promise.allSettled(batch.map(item => indexEntity(item)));
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) indexed++; else skipped++;
    }
  }
  return { indexed, skipped };
}

// ── In-Memory Candidate Cache ────────────────────────────────────────────────
// Avoids hitting the DB on every semantic search — refreshes every 60s or on invalidation.
interface CandidateRow { entityType: string; entityId: string; embedding: number[]; sourceText: string | null; metadata: unknown }
let _candidateCache: CandidateRow[] = [];
let _candidateCacheTs = 0;
const CANDIDATE_CACHE_TTL_MS = 60_000;
let _candidateCacheLoading = false;

async function loadCandidates(entityTypes?: EntityType[]): Promise<CandidateRow[]> {
  const now = Date.now();
  // Return cache if fresh
  if (_candidateCache.length > 0 && now - _candidateCacheTs < CANDIDATE_CACHE_TTL_MS) {
    if (!entityTypes?.length) return _candidateCache;
    const set = new Set(entityTypes as string[]);
    return _candidateCache.filter(c => set.has(c.entityType));
  }
  // Avoid thundering herd
  if (_candidateCacheLoading) {
    if (!entityTypes?.length) return _candidateCache;
    const set = new Set(entityTypes as string[]);
    return _candidateCache.filter(c => set.has(c.entityType));
  }
  _candidateCacheLoading = true;
  try {
    const { getDb } = await import("../../db");
    const { embeddings } = await import("../../../drizzle/schema");
    const db = await getDb();
    if (!db) { _candidateCacheLoading = false; return []; }
    const rows = await db.select({
      entityType: embeddings.entityType, entityId: embeddings.entityId,
      embedding: embeddings.embedding, sourceText: embeddings.sourceText, metadata: embeddings.metadata,
    }).from(embeddings);
    _candidateCache = rows.map(c => ({
      entityType: c.entityType, entityId: c.entityId,
      embedding: Array.isArray(c.embedding) ? c.embedding as number[] : [],
      sourceText: c.sourceText, metadata: c.metadata,
    }));
    _candidateCacheTs = now;
    console.log(`[AITurbo] Candidate cache refreshed: ${_candidateCache.length} embeddings`);
  } catch (err) { console.error("[AITurbo] loadCandidates error:", err); }
  _candidateCacheLoading = false;
  if (!entityTypes?.length) return _candidateCache;
  const set = new Set(entityTypes as string[]);
  return _candidateCache.filter(c => set.has(c.entityType));
}

/** Invalidate candidate cache (call after indexing new entities) */
export function invalidateCandidateCache(): void {
  _candidateCacheTs = 0;
}

// ── Core: Semantic Search (cached candidates) ────────────────────────────────
export async function semanticSearch(
  query: string,
  opts: { entityTypes?: EntityType[]; topK?: number; threshold?: number } = {},
): Promise<SearchResult[]> {
  try {
    if (!(await embeddingService.isHealthy())) return [];
    const queryVec = await embeddingService.embedOne(query);
    const candidates = await loadCandidates(opts.entityTypes);
    if (!candidates.length) return [];
    return embeddingService.search(
      queryVec.values,
      candidates.map(c => ({
        embedding: c.embedding,
        entityId: c.entityId, entityType: c.entityType,
        text: c.sourceText || undefined, metadata: (c.metadata as Record<string, unknown>) || undefined,
      })),
      opts.topK ?? 10, opts.threshold ?? 0.25,
    ).map(r => ({
      entityType: r.entityType || "", entityId: r.entityId || "",
      text: r.text || "", score: Math.round(r.score * 10000) / 10000, metadata: r.metadata,
    }));
  } catch (err) { console.error("[AITurbo] semanticSearch error:", err); return []; }
}

// ── Core: Remove Entity ──────────────────────────────────────────────────────
export async function removeEntity(entityType: EntityType, entityId: string): Promise<boolean> {
  try {
    const { getDb } = await import("../../db");
    const { embeddings } = await import("../../../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) return false;
    await db.delete(embeddings).where(and(eq(embeddings.entityType, entityType), eq(embeddings.entityId, entityId)));
    invalidateCandidateCache();
    return true;
  } catch (err) { console.error(`[AITurbo] removeEntity error:`, err); return false; }
}

// ══════════════════════════════════════════════════════════════════════════════
// DOMAIN-SPECIFIC INDEXERS — Fire-and-forget from routers
// ══════════════════════════════════════════════════════════════════════════════

export function indexLoad(load: Record<string, any>): void {
  const text = [
    `Load from ${load.origin || "?"} to ${load.destination || "?"}`,
    load.cargoType && `Cargo: ${load.cargoType}`, load.productName && `Product: ${load.productName}`,
    load.equipment && `Equipment: ${load.equipment}`, load.rate && `Rate: $${load.rate}`,
    load.weight && `Weight: ${load.weight} lbs`, load.miles && `Miles: ${load.miles}`,
    load.hazmat && `HAZMAT load`, load.specialInstructions && `Instructions: ${load.specialInstructions}`,
  ].filter(Boolean).join(". ");
  indexEntity({ entityType: "load", entityId: String(load.id), text, metadata: { origin: load.origin, destination: load.destination, cargoType: load.cargoType } }).catch(() => {});
}

export function indexCarrier(carrier: Record<string, any>): void {
  const text = [
    `Carrier: ${carrier.companyName || carrier.name || "?"}`,
    carrier.dotNumber && `DOT# ${carrier.dotNumber}`, carrier.mcNumber && `MC# ${carrier.mcNumber}`,
    carrier.equipmentTypes && `Equipment: ${Array.isArray(carrier.equipmentTypes) ? carrier.equipmentTypes.join(", ") : carrier.equipmentTypes}`,
    carrier.serviceAreas && `Service areas: ${carrier.serviceAreas}`,
    carrier.specializations && `Specializations: ${carrier.specializations}`,
    carrier.hazmatCertified && `HazMat certified`,
    carrier.safetyRating && `Safety rating: ${carrier.safetyRating}`,
  ].filter(Boolean).join(". ");
  indexEntity({ entityType: "carrier", entityId: String(carrier.id), text, metadata: { dotNumber: carrier.dotNumber, mcNumber: carrier.mcNumber } }).catch(() => {});
}

export function indexDocument(doc: Record<string, any>): void {
  const text = [
    `Document: ${doc.title || doc.name || doc.fileName || "Untitled"}`,
    doc.type && `Type: ${doc.type}`, doc.category && `Category: ${doc.category}`,
    doc.description && doc.description, doc.content && doc.content.slice(0, 5000),
    doc.tags && `Tags: ${Array.isArray(doc.tags) ? doc.tags.join(", ") : doc.tags}`,
  ].filter(Boolean).join(". ");
  indexEntity({ entityType: "document", entityId: String(doc.id), text, metadata: { type: doc.type, category: doc.category } }).catch(() => {});
}

export function indexAgreement(agreement: Record<string, any>): void {
  const text = [
    `Agreement: ${agreement.title || agreement.name || "Untitled"}`,
    agreement.type && `Type: ${agreement.type}`, agreement.status && `Status: ${agreement.status}`,
    agreement.partyA && `Party A: ${agreement.partyA}`, agreement.partyB && `Party B: ${agreement.partyB}`,
    agreement.terms && agreement.terms.slice(0, 3000),
    agreement.effectiveDate && `Effective: ${agreement.effectiveDate}`,
  ].filter(Boolean).join(". ");
  indexEntity({ entityType: "agreement", entityId: String(agreement.id), text, metadata: { type: agreement.type, status: agreement.status } }).catch(() => {});
}

export function indexRateSheet(rateSheet: Record<string, any>): void {
  const text = [
    `Rate Sheet: ${rateSheet.name || rateSheet.title || "Untitled"}`,
    rateSheet.origin && `Origin: ${rateSheet.origin}`, rateSheet.destination && `Destination: ${rateSheet.destination}`,
    rateSheet.commodity && `Commodity: ${rateSheet.commodity}`,
    rateSheet.rateType && `Rate type: ${rateSheet.rateType}`,
    rateSheet.baseRate && `Base rate: $${rateSheet.baseRate}`,
    rateSheet.fuelSurcharge && `FSC: ${rateSheet.fuelSurcharge}`,
  ].filter(Boolean).join(". ");
  indexEntity({ entityType: "rate_sheet", entityId: String(rateSheet.id), text, metadata: { origin: rateSheet.origin, destination: rateSheet.destination } }).catch(() => {});
}

export function indexZoneIntelligence(zone: Record<string, any>): void {
  const text = [
    `Zone: ${zone.zoneName || zone.name || zone.zoneId || "?"}`,
    zone.state && `State: ${zone.state}`, zone.region && `Region: ${zone.region}`,
    zone.riskLevel && `Risk: ${zone.riskLevel}`,
    zone.weatherAlerts && `Weather: ${zone.weatherAlerts}`,
    zone.fuelPrice && `Diesel: $${zone.fuelPrice}/gal`,
    zone.activeWildfires && `Wildfires: ${zone.activeWildfires}`,
    zone.seismicRisk && `Seismic: ${zone.seismicRisk}`,
  ].filter(Boolean).join(". ");
  indexEntity({ entityType: "zone_intelligence", entityId: String(zone.zoneId || zone.id), text, metadata: { state: zone.state, riskLevel: zone.riskLevel } }).catch(() => {});
}

// ══════════════════════════════════════════════════════════════════════════════
// DOMAIN-SPECIFIC SEARCH HELPERS
// ══════════════════════════════════════════════════════════════════════════════

export const searchLoads = (q: string, topK = 10) => semanticSearch(q, { entityTypes: ["load"], topK });
export const searchCarriers = (q: string, topK = 10) => semanticSearch(q, { entityTypes: ["carrier"], topK });
export const searchDocuments = (q: string, topK = 10) => semanticSearch(q, { entityTypes: ["document"], topK });
export const searchAgreements = (q: string, topK = 10) => semanticSearch(q, { entityTypes: ["agreement"], topK });
export const searchRateSheets = (q: string, topK = 10) => semanticSearch(q, { entityTypes: ["rate_sheet"], topK });
export const searchKnowledge = (q: string, topK = 10) => semanticSearch(q, { entityTypes: ["knowledge", "erg_guide"], topK });
export const searchZones = (q: string, topK = 10) => semanticSearch(q, { entityTypes: ["zone_intelligence"], topK });
export const searchSupportTickets = (q: string, topK = 10) => semanticSearch(q, { entityTypes: ["support_ticket"], topK });
export const searchMessages = (q: string, topK = 10) => semanticSearch(q, { entityTypes: ["message"], topK });
export const searchCompliance = (q: string, topK = 10) => semanticSearch(q, { entityTypes: ["compliance_record", "knowledge"], topK });
export const searchAll = (q: string, topK = 15) => semanticSearch(q, { topK });

// ══════════════════════════════════════════════════════════════════════════════
// ADDITIONAL DOMAIN INDEXERS
// ══════════════════════════════════════════════════════════════════════════════

export function indexSupportTicket(ticket: Record<string, any>): void {
  const text = [
    `Support ticket: ${ticket.subject || ticket.title || "Untitled"}`,
    ticket.category && `Category: ${ticket.category}`,
    ticket.description && ticket.description.slice(0, 3000),
    ticket.status && `Status: ${ticket.status}`,
    ticket.priority && `Priority: ${ticket.priority}`,
  ].filter(Boolean).join(". ");
  indexEntity({ entityType: "support_ticket", entityId: String(ticket.id), text, metadata: { category: ticket.category, status: ticket.status } }).then(() => invalidateCandidateCache()).catch(() => {});
}

export function indexMessage(msg: Record<string, any>): void {
  const text = [
    msg.subject && `Subject: ${msg.subject}`,
    msg.content && msg.content.slice(0, 2000),
    msg.senderName && `From: ${msg.senderName}`,
    msg.recipientName && `To: ${msg.recipientName}`,
  ].filter(Boolean).join(". ");
  if (text.length < 10) return;
  indexEntity({ entityType: "message", entityId: String(msg.id), text, metadata: { senderId: msg.senderId, conversationId: msg.conversationId } }).then(() => invalidateCandidateCache()).catch(() => {});
}

export function indexComplianceRecord(record: Record<string, any>): void {
  const text = [
    `Compliance: ${record.type || record.category || "record"}`,
    record.entityName && `Entity: ${record.entityName}`,
    record.description && record.description.slice(0, 2000),
    record.violation && `Violation: ${record.violation}`,
    record.status && `Status: ${record.status}`,
    record.severity && `Severity: ${record.severity}`,
  ].filter(Boolean).join(". ");
  indexEntity({ entityType: "compliance_record", entityId: String(record.id), text, metadata: { type: record.type, status: record.status } }).then(() => invalidateCandidateCache()).catch(() => {});
}
