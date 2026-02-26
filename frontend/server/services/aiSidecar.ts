/**
 * AI SIDECAR CLIENT — TypeScript HTTP client for the Python AI Sidecar.
 * 
 * Provides typed wrappers for all sidecar endpoints:
 *   /ocr/*       — Docling + PaddleOCR document processing
 *   /route/*     — OSRM routing + OR-Tools VRP optimization
 *   /nlp/*       — spaCy NER + text classification
 *   /forecast/*  — Darts/Prophet demand & rate forecasting
 *   /analytics/* — DuckDB fast OLAP queries
 * 
 * All methods return null on failure (sidecar offline) for graceful fallback.
 * Env: AI_SIDECAR_URL (default http://localhost:8091)
 */

const SIDECAR_URL = process.env.AI_SIDECAR_URL || "http://localhost:8091";
const TIMEOUT_MS = 30_000;

// ═══════════════════════════════════════════════════════════════════════════
// CORE HTTP HELPER
// ═══════════════════════════════════════════════════════════════════════════

async function sidecarPost<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(`${SIDECAR_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      console.warn(`[AISidecar] ${path} returned ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err: any) {
    if (err?.name !== "AbortError") {
      console.warn(`[AISidecar] ${path} unavailable:`, err?.message || err);
    }
    return null;
  }
}

async function sidecarGet<T>(path: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
    const res = await fetch(`${SIDECAR_URL}${path}`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════

export interface SidecarHealth {
  status: string;
  service: string;
  models: Record<string, boolean>;
}

export async function isHealthy(): Promise<boolean> {
  const h = await sidecarGet<SidecarHealth>("/health");
  return h?.status === "ok";
}

export async function getHealth(): Promise<SidecarHealth | null> {
  return sidecarGet<SidecarHealth>("/health");
}

// ═══════════════════════════════════════════════════════════════════════════
// OCR / DOCUMENT PROCESSING
// ═══════════════════════════════════════════════════════════════════════════

export interface OCRLine {
  text: string;
  confidence: number;
  bbox?: number[][];
}

export interface OCRResult {
  success: boolean;
  engine: string;
  text: string;
  lines: OCRLine[];
  tables: Array<{ headers: string[]; rows: any[][]; num_rows: number }>;
  avg_confidence: number;
  error?: string;
}

/**
 * Extract text from a document image/PDF using Docling + PaddleOCR.
 * Engine: "auto" (default), "docling", or "paddle".
 */
export async function ocrExtract(
  imageBase64: string,
  mimeType = "image/png",
  engine = "auto",
  extractTables = true,
): Promise<OCRResult | null> {
  return sidecarPost<OCRResult>("/ocr/extract", {
    image_base64: imageBase64,
    mime_type: mimeType,
    engine,
    extract_tables: extractTables,
  });
}

export interface BOLFields {
  shipper_name?: string;
  shipper_address?: string;
  consignee_name?: string;
  consignee_address?: string;
  carrier_name?: string;
  bol_number?: string;
  date?: string;
  commodity?: string;
  weight?: string;
  pieces?: string;
  hazmat_class?: string;
  un_number?: string;
  packing_group?: string;
  emergency_phone?: string;
  special_instructions?: string;
  po_number?: string;
  pro_number?: string;
}

export interface BOLExtractResult {
  success: boolean;
  fields: BOLFields;
  raw_text: string;
  confidence: number;
  error?: string;
}

/** Extract structured BOL fields from a scanned Bill of Lading. */
export async function ocrExtractBOL(imageBase64: string, mimeType = "image/png"): Promise<BOLExtractResult | null> {
  return sidecarPost<BOLExtractResult>("/ocr/bol", {
    image_base64: imageBase64,
    mime_type: mimeType,
  });
}

export interface RateSheetExtractResult {
  success: boolean;
  rate_tiers: Array<{ minMiles: number; maxMiles: number; ratePerBarrel: number }>;
  surcharges: Record<string, number>;
  metadata: Record<string, string>;
  raw_text: string;
  error?: string;
}

/** Extract structured rate tiers from a rate sheet PDF/image. */
export async function ocrExtractRateSheet(fileBase64: string, mimeType = "application/pdf"): Promise<RateSheetExtractResult | null> {
  return sidecarPost<RateSheetExtractResult>("/ocr/ratesheet", {
    file_base64: fileBase64,
    mime_type: mimeType,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE OPTIMIZATION
// ═══════════════════════════════════════════════════════════════════════════

export interface Waypoint { lat: number; lng: number; name?: string }

export interface DirectionsResult {
  success: boolean;
  distance_miles: number;
  duration_hours: number;
  duration_minutes: number;
  geometry?: string;
  steps: Array<{ instruction: string; name: string; distance_miles: number; duration_minutes: number }>;
  alternatives: Array<{ distance_miles: number; duration_hours: number }>;
  error?: string;
}

/** Get driving directions between two points via OSRM. */
export async function getDirections(
  origin: Waypoint,
  destination: Waypoint,
  options?: { profile?: string; alternatives?: boolean; steps?: boolean },
): Promise<DirectionsResult | null> {
  return sidecarPost<DirectionsResult>("/route/directions", {
    origin, destination,
    profile: options?.profile || "driving",
    alternatives: options?.alternatives || false,
    steps: options?.steps || false,
  });
}

export interface MatrixResult {
  success: boolean;
  distances: number[][]; // miles
  durations: number[][]; // minutes
  error?: string;
}

/** Get distance/duration matrix between all location pairs. */
export async function getDistanceMatrix(locations: Waypoint[]): Promise<MatrixResult | null> {
  return sidecarPost<MatrixResult>("/route/matrix", { locations });
}

export interface OptimizeRouteResult {
  success: boolean;
  routes: Array<{
    vehicle: number;
    stops: Array<{ index: number; name: string; lat: number; lng: number }>;
    distance_miles: number;
    duration_hours: number;
  }>;
  total_distance_miles: number;
  total_duration_hours: number;
  unassigned_stops: number[];
  error?: string;
}

/** Solve multi-stop VRP using OR-Tools. */
export async function optimizeRoute(
  depot: Waypoint,
  stops: Waypoint[],
  options?: { vehicleCapacity?: number; maxVehicles?: number; maxRouteTimeMinutes?: number },
): Promise<OptimizeRouteResult | null> {
  return sidecarPost<OptimizeRouteResult>("/route/optimize", {
    depot, stops,
    vehicle_capacity: options?.vehicleCapacity || 1000,
    max_vehicles: options?.maxVehicles || 1,
    max_route_time_minutes: options?.maxRouteTimeMinutes || 660,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// NLP / ENTITY EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

export interface NLPEntity {
  text: string;
  label: string;
  start: number;
  end: number;
  confidence: number;
}

export interface EntityResult {
  success: boolean;
  entities: NLPEntity[];
  error?: string;
}

/** Extract named entities from text using spaCy NER. */
export async function extractEntities(text: string, entityTypes?: string[]): Promise<EntityResult | null> {
  return sidecarPost<EntityResult>("/nlp/entities", {
    text,
    entity_types: entityTypes || [],
  });
}

export interface ParsedLoadQuery {
  origin?: string;
  destination?: string;
  equipment?: string;
  cargo_type?: string;
  max_rate?: number;
  min_rate?: number;
  date_range?: string;
  weight?: string;
  hazmat: boolean;
  keywords: string[];
}

export interface ParseLoadResult {
  success: boolean;
  parsed: ParsedLoadQuery;
  entities: NLPEntity[];
  error?: string;
}

/** Parse a natural language load search query into structured fields. */
export async function parseLoadQuery(query: string): Promise<ParseLoadResult | null> {
  return sidecarPost<ParseLoadResult>("/nlp/parse-load", { query });
}

export interface ClassifyResult {
  success: boolean;
  category: string;
  confidence: number;
  scores: Record<string, number>;
  error?: string;
}

/** Classify text into categories (support tickets, document types, etc). */
export async function classifyText(text: string, categories?: string[]): Promise<ClassifyResult | null> {
  return sidecarPost<ClassifyResult>("/nlp/classify", { text, categories: categories || [] });
}

// ═══════════════════════════════════════════════════════════════════════════
// DEMAND FORECASTING
// ═══════════════════════════════════════════════════════════════════════════

export interface TimeSeriesPoint { date: string; value: number }
export interface ForecastPoint { date: string; predicted: number; lower: number; upper: number }

export interface DemandForecastResult {
  success: boolean;
  lane: string;
  forecast: ForecastPoint[];
  trend: string;
  seasonal_factor: number;
  model_used: string;
  error?: string;
}

/** Forecast weekly load demand for a lane. */
export async function forecastDemand(
  lane: string,
  history: TimeSeriesPoint[],
  horizonWeeks = 4,
): Promise<DemandForecastResult | null> {
  return sidecarPost<DemandForecastResult>("/forecast/demand", {
    lane, history, horizon_weeks: horizonWeeks, include_confidence: true,
  });
}

export interface RateForecastResult {
  success: boolean;
  lane: string;
  forecast: ForecastPoint[];
  trend: string;
  volatility: number;
  model_used: string;
  error?: string;
}

/** Forecast rate-per-mile trends for a lane. */
export async function forecastRates(
  lane: string,
  history: TimeSeriesPoint[],
  horizonWeeks = 4,
): Promise<RateForecastResult | null> {
  return sidecarPost<RateForecastResult>("/forecast/rates", {
    lane, history, horizon_weeks: horizonWeeks,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS (DuckDB)
// ═══════════════════════════════════════════════════════════════════════════

export interface AnalyticsQueryResult {
  success: boolean;
  columns: string[];
  rows: any[][];
  row_count: number;
  execution_ms: number;
  error?: string;
}

/** Run a read-only SQL query on DuckDB. */
export async function analyticsQuery(sql: string, params: any[] = []): Promise<AnalyticsQueryResult | null> {
  return sidecarPost<AnalyticsQueryResult>("/analytics/query", { sql, params, max_rows: 1000 });
}

export interface AggregateResult {
  success: boolean;
  query_type: string;
  results: Record<string, any>[];
  summary: Record<string, any>;
  error?: string;
}

/** Run pre-built aggregation queries. */
export async function analyticsAggregate(
  queryType: string,
  filters?: Record<string, any>,
  limit = 50,
): Promise<AggregateResult | null> {
  return sidecarPost<AggregateResult>("/analytics/aggregate", {
    query_type: queryType, filters: filters || {}, limit,
  });
}
