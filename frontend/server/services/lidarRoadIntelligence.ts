/**
 * LiDAR ROAD INTELLIGENCE SERVICE — EusoRoads Core
 *
 * EusoRoads is the proprietary road intelligence database. LiDAR is the base layer
 * providing ultra-accurate road geometry. ELD fleet GPS pings are the feeder —
 * every driver mile enriches EusoRoads with traversal data matched to LiDAR geometry.
 *
 * Data Sources:
 *   1. USGS 3DEP — National Elevation Dataset (1m LiDAR DEM) → elevation, gradient
 *   2. Open Elevation — Global SRTM fallback (30m) → elevation
 *   3. FHWA HPMS — IRI roughness index for federal-aid highways
 *   4. NBI — National Bridge Inventory → vertical clearance, weight limits
 *
 * Per-Segment Enrichment:
 *   - Elevation profile (start/end/min/max feet ASL)
 *   - Gradient % (critical for heavy trucks — braking, fuel, speed)
 *   - IRI score (International Roughness Index — pavement quality gold standard)
 *   - Lane geometry (width, shoulder, count)
 *   - Curvature (degrees per 100ft)
 *   - Bridge/tunnel clearance (feet)
 *   - Truck risk score (0-100 composite from gradient + IRI + curvature + clearance)
 *
 * Architecture:
 *   ELD GPS Pings → road_segments (traversal count++) → LiDAR enrichment pass
 *   LiDAR enrichment is triggered:
 *     a) On new segment creation (from ELD/GPS breadcrumb aggregation)
 *     b) On periodic cron sweep for un-enriched segments
 *     c) On-demand via tRPC endpoint for specific coordinates
 */

import { logger } from "../_core/logger";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

// ══════════════════════════════════════════════════════════════
// LiDAR SOURCE CATALOG
// ══════════════════════════════════════════════════════════════

export interface LiDARSourceMeta {
  name: string;
  slug: string;
  type: "elevation" | "roughness" | "geometry" | "clearance";
  baseUrl: string;
  coverage: string;
  resolutionM: number;
  priority: number;
}

export const LIDAR_SOURCES: LiDARSourceMeta[] = [
  {
    name: "USGS 3DEP National Elevation",
    slug: "usgs_3dep",
    type: "elevation",
    baseUrl: "https://epqs.nationalmap.gov/v1/json",
    coverage: "Continental US — 1m LiDAR-derived DEM",
    resolutionM: 1.0,
    priority: 1,
  },
  {
    name: "Open Elevation (SRTM)",
    slug: "open_elevation",
    type: "elevation",
    baseUrl: "https://api.open-elevation.com/api/v1/lookup",
    coverage: "Global — SRTM 30m DEM fallback",
    resolutionM: 30.0,
    priority: 3,
  },
  {
    name: "FHWA HPMS Pavement",
    slug: "fhwa_hpms",
    type: "roughness",
    baseUrl: "https://infopave.fhwa.dot.gov/api",
    coverage: "US Federal-Aid Highways — IRI + rutting + cracking",
    resolutionM: 100.0,
    priority: 1,
  },
  {
    name: "National Bridge Inventory",
    slug: "nbi",
    type: "clearance",
    baseUrl: "https://geo.dot.gov/server/rest/services",
    coverage: "US Bridges — vertical clearance, weight limits, condition",
    resolutionM: 0,
    priority: 1,
  },
  {
    name: "USDOT Road Geometry",
    slug: "usdot_geometry",
    type: "geometry",
    baseUrl: "https://geo.dot.gov/server/rest/services",
    coverage: "US Federal Highways — lane width, shoulder, curves",
    resolutionM: 10.0,
    priority: 2,
  },
];

// ══════════════════════════════════════════════════════════════
// ELEVATION FETCHING
// ══════════════════════════════════════════════════════════════

/**
 * Fetch elevation (feet ASL) for a lat/lng from USGS 3DEP (1m LiDAR).
 * Falls back to Open Elevation (30m SRTM) if 3DEP unavailable.
 */
export async function getElevationFt(
  lat: number, lng: number
): Promise<{ elevFt: number; source: string; resM: number } | null> {
  // Primary: USGS 3DEP (1m LiDAR-derived elevation)
  try {
    const url = `https://epqs.nationalmap.gov/v1/json?x=${lng}&y=${lat}&wkid=4326&units=Feet&includeDate=false`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      const val = Number(data?.value);
      if (!isNaN(val) && val > -1000) {
        return { elevFt: val, source: "usgs_3dep", resM: 1.0 };
      }
    }
  } catch { /* timeout / network */ }

  // Fallback: Open Elevation (30m SRTM)
  try {
    const url = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      const meters = Number(data?.results?.[0]?.elevation);
      if (!isNaN(meters)) {
        return { elevFt: meters * 3.28084, source: "open_elevation", resM: 30.0 };
      }
    }
  } catch { /* fallback failed */ }

  return null;
}

/**
 * Batch elevation for multiple points via Open Elevation POST.
 */
async function batchElevations(
  points: { lat: number; lng: number }[]
): Promise<(number | null)[]> {
  try {
    const res = await fetch("https://api.open-elevation.com/api/v1/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locations: points.map(p => ({ latitude: p.lat, longitude: p.lng })),
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const data = await res.json();
      return (data?.results || []).map((r: any) =>
        r?.elevation != null ? Number(r.elevation) * 3.28084 : null
      );
    }
  } catch { /* batch failed */ }
  return points.map(() => null);
}

// ══════════════════════════════════════════════════════════════
// GRADIENT & GEOMETRY COMPUTATION
// ══════════════════════════════════════════════════════════════

function haversineFt(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 20902231; // Earth radius in feet
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Compute gradient % between two elevation points.
 * Positive = uphill, negative = downhill.
 */
function computeGradient(
  lat1: number, lng1: number, elev1Ft: number,
  lat2: number, lng2: number, elev2Ft: number
): number {
  const horizFt = haversineFt(lat1, lng1, lat2, lng2);
  if (horizFt < 10) return 0; // too close to compute
  return ((elev2Ft - elev1Ft) / horizFt) * 100;
}

/**
 * Compute curvature from 3 sequential points (degrees per 100ft).
 */
function computeCurvature(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
  lat3: number, lng3: number
): number {
  // Bearing from p1→p2
  const bearing12 = Math.atan2(
    Math.sin((lng2 - lng1) * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180),
    Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
    Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos((lng2 - lng1) * Math.PI / 180)
  ) * 180 / Math.PI;
  // Bearing from p2→p3
  const bearing23 = Math.atan2(
    Math.sin((lng3 - lng2) * Math.PI / 180) * Math.cos(lat3 * Math.PI / 180),
    Math.cos(lat2 * Math.PI / 180) * Math.sin(lat3 * Math.PI / 180) -
    Math.sin(lat2 * Math.PI / 180) * Math.cos(lat3 * Math.PI / 180) * Math.cos((lng3 - lng2) * Math.PI / 180)
  ) * 180 / Math.PI;

  let delta = Math.abs(bearing23 - bearing12);
  if (delta > 180) delta = 360 - delta;
  const distFt = haversineFt(lat1, lng1, lat3, lng3);
  return distFt > 0 ? (delta / distFt) * 100 : 0;
}

// ══════════════════════════════════════════════════════════════
// IRI ESTIMATION (from speed variance + ELD hard brake data)
// ══════════════════════════════════════════════════════════════

/**
 * Estimate IRI (International Roughness Index, in/mi) from driver speed
 * variance on a segment. More variance at low speed = rougher surface.
 * Real IRI comes from FHWA HPMS when available; this is the crowd-sourced proxy.
 *
 * IRI scale:
 *   < 60  = new pavement (excellent)
 *   60-95 = good
 *   95-170 = fair (needs monitoring)
 *   170-220 = poor (needs repair)
 *   > 220 = very poor (hazardous)
 */
function estimateIRI(avgSpeedMph: number | null, speedVariance: number | null, hardBrakeEvents: number): number {
  let iri = 80; // default baseline
  if (speedVariance != null) {
    // Higher speed variance at consistent speeds → rougher road
    iri = 60 + (speedVariance * 3.5);
  }
  if (avgSpeedMph != null && avgSpeedMph < 30 && speedVariance != null && speedVariance > 10) {
    // Slow + jerky = very rough
    iri += 40;
  }
  if (hardBrakeEvents > 0) {
    iri += hardBrakeEvents * 15; // hard brakes often caused by potholes/rough spots
  }
  return Math.min(Math.max(iri, 30), 350); // clamp
}

/**
 * Map IRI to surface quality enum (overrides speed-variance proxy).
 */
function iriToSurfaceQuality(iri: number): "excellent" | "good" | "fair" | "poor" {
  if (iri < 60) return "excellent";
  if (iri < 95) return "good";
  if (iri < 170) return "fair";
  return "poor";
}

// ══════════════════════════════════════════════════════════════
// TRUCK RISK SCORE (composite 0-100)
// ══════════════════════════════════════════════════════════════

/**
 * Compute truck-specific risk score from LiDAR-enriched data.
 * Factors: gradient, IRI roughness, curvature, clearance deficit.
 * 0 = safest, 100 = highest risk.
 */
export function computeTruckRiskScore(params: {
  gradientPct?: number | null;
  maxGradientPct?: number | null;
  iriScore?: number | null;
  curvatureDeg?: number | null;
  minClearanceFt?: number | null;
  laneWidthFt?: number | null;
}): number {
  let score = 0;

  // Gradient risk (steep grades = hard on brakes, fuel)
  const grade = Math.abs(params.maxGradientPct || params.gradientPct || 0);
  if (grade > 8) score += 35;       // extreme grade
  else if (grade > 6) score += 25;  // severe
  else if (grade > 4) score += 15;  // moderate
  else if (grade > 2) score += 5;

  // Roughness risk (IRI)
  const iri = params.iriScore || 80;
  if (iri > 220) score += 30;       // hazardous
  else if (iri > 170) score += 20;  // poor
  else if (iri > 95) score += 10;   // fair
  else if (iri > 60) score += 3;

  // Curvature risk (sharp curves dangerous for heavy/long trucks)
  const curve = params.curvatureDeg || 0;
  if (curve > 5) score += 20;       // very sharp
  else if (curve > 3) score += 12;
  else if (curve > 1.5) score += 5;

  // Clearance risk (standard semi needs 13.5ft)
  if (params.minClearanceFt != null) {
    if (params.minClearanceFt < 13.5) score += 30;      // won't fit standard semi
    else if (params.minClearanceFt < 14.5) score += 15;  // tight
    else if (params.minClearanceFt < 16) score += 5;
  }

  // Lane width risk (standard lane = 12ft, truck needs ~10.5ft min)
  if (params.laneWidthFt != null) {
    if (params.laneWidthFt < 10) score += 15;
    else if (params.laneWidthFt < 11) score += 8;
    else if (params.laneWidthFt < 12) score += 3;
  }

  return Math.min(score, 100);
}

// ══════════════════════════════════════════════════════════════
// SEGMENT ENRICHMENT PIPELINE
// ══════════════════════════════════════════════════════════════

export interface LiDAREnrichmentResult {
  segmentId: number;
  elevationStartFt: number | null;
  elevationEndFt: number | null;
  elevationMinFt: number | null;
  elevationMaxFt: number | null;
  gradientPct: number | null;
  maxGradientPct: number | null;
  iriScore: number | null;
  surfaceQuality: "excellent" | "good" | "fair" | "poor" | "unknown";
  curvatureDeg: number | null;
  truckRiskScore: number;
  lidarSource: string;
  lidarResolutionM: number;
}

/**
 * Enrich a single road segment with LiDAR data.
 * Called when ELD GPS breadcrumbs create/update a segment.
 */
export async function enrichSegmentWithLiDAR(
  segmentId: number,
  startLat: number, startLng: number,
  endLat: number, endLng: number,
  avgSpeedMph?: number | null,
  speedVariance?: number | null
): Promise<LiDAREnrichmentResult | null> {
  // Fetch elevation for start and end points
  const [startElev, endElev] = await Promise.all([
    getElevationFt(startLat, startLng),
    getElevationFt(endLat, endLng),
  ]);

  if (!startElev && !endElev) return null; // no elevation data available

  const elevStart = startElev?.elevFt ?? null;
  const elevEnd = endElev?.elevFt ?? null;
  const elevMin = elevStart != null && elevEnd != null ? Math.min(elevStart, elevEnd) : (elevStart ?? elevEnd);
  const elevMax = elevStart != null && elevEnd != null ? Math.max(elevStart, elevEnd) : (elevStart ?? elevEnd);

  // Compute gradient
  let gradient: number | null = null;
  if (elevStart != null && elevEnd != null) {
    gradient = computeGradient(startLat, startLng, elevStart, endLat, endLng, elevEnd);
  }

  // Compute curvature (using midpoint approximation)
  const midLat = (startLat + endLat) / 2;
  const midLng = (startLng + endLng) / 2;
  const curvature = computeCurvature(startLat, startLng, midLat, midLng, endLat, endLng);

  // Estimate IRI from speed data
  const iri = estimateIRI(avgSpeedMph ?? null, speedVariance ?? null, 0);
  const surfQuality = iriToSurfaceQuality(iri);

  // Compute truck risk score
  const truckRisk = computeTruckRiskScore({
    gradientPct: gradient,
    maxGradientPct: gradient != null ? Math.abs(gradient) : null,
    iriScore: iri,
    curvatureDeg: curvature,
  });

  const source = startElev?.source || endElev?.source || "unknown";
  const resM = startElev?.resM || endElev?.resM || 0;

  return {
    segmentId,
    elevationStartFt: elevStart,
    elevationEndFt: elevEnd,
    elevationMinFt: elevMin,
    elevationMaxFt: elevMax,
    gradientPct: gradient != null ? Math.round(gradient * 100) / 100 : null,
    maxGradientPct: gradient != null ? Math.round(Math.abs(gradient) * 100) / 100 : null,
    iriScore: Math.round(iri * 100) / 100,
    surfaceQuality: surfQuality,
    curvatureDeg: Math.round(curvature * 100) / 100,
    truckRiskScore: truckRisk,
    lidarSource: source,
    lidarResolutionM: resM,
  };
}

/**
 * Write LiDAR enrichment back to the road_segments table.
 */
export async function writeLiDAREnrichment(result: LiDAREnrichmentResult): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.execute(sql`
      UPDATE road_segments SET
        elevationStartFt = ${result.elevationStartFt},
        elevationEndFt = ${result.elevationEndFt},
        elevationMinFt = ${result.elevationMinFt},
        elevationMaxFt = ${result.elevationMaxFt},
        gradientPct = ${result.gradientPct},
        maxGradientPct = ${result.maxGradientPct},
        iriScore = ${result.iriScore},
        surfaceQuality = ${result.surfaceQuality},
        curvatureDeg = ${result.curvatureDeg},
        truckRiskScore = ${result.truckRiskScore},
        lidarSource = ${result.lidarSource},
        lidarResolutionM = ${result.lidarResolutionM},
        lidarEnrichedAt = NOW()
      WHERE id = ${result.segmentId}
    `);
    return true;
  } catch (e) {
    logger.error(`[EusoRoads LiDAR] Failed to write enrichment for segment ${result.segmentId}:`, e);
    return false;
  }
}

/**
 * BATCH ENRICHMENT — Sweep un-enriched road segments and apply LiDAR data.
 * Called by cron or on-demand. Rate-limited to avoid hammering USGS API.
 */
export async function enrichUnprocessedSegments(batchSize = 25): Promise<{
  enriched: number;
  failed: number;
  remaining: number;
}> {
  const db = await getDb();
  if (!db) return { enriched: 0, failed: 0, remaining: 0 };

  let enriched = 0, failed = 0;

  try {
    // Fetch segments that haven't been LiDAR-enriched yet
    const [rows] = await db.execute(
      sql`SELECT id, startLat, startLng, endLat, endLng, avgSpeedMph
          FROM road_segments
          WHERE lidarEnrichedAt IS NULL
          ORDER BY traversalCount DESC, lastTraversedAt DESC
          LIMIT ${batchSize}`
    ) as any;

    const segments = rows || [];

    for (const seg of segments) {
      try {
        const result = await enrichSegmentWithLiDAR(
          seg.id,
          Number(seg.startLat), Number(seg.startLng),
          Number(seg.endLat), Number(seg.endLng),
          seg.avgSpeedMph ? Number(seg.avgSpeedMph) : null
        );
        if (result) {
          await writeLiDAREnrichment(result);
          enriched++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
      // Rate limit: 250ms between USGS API calls
      await new Promise(r => setTimeout(r, 250));
    }

    // Count remaining
    const [countRows] = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM road_segments WHERE lidarEnrichedAt IS NULL`
    ) as any;
    const remaining = Number((countRows || [])[0]?.cnt || 0);

    logger.info(`[EusoRoads LiDAR] Enriched ${enriched}/${segments.length} segments, ${remaining} remaining`);
    return { enriched, failed, remaining };
  } catch (e) {
    logger.error("[EusoRoads LiDAR] batch enrichment error:", e);
    return { enriched, failed, remaining: -1 };
  }
}

/**
 * ON-DEMAND POINT QUERY — Get LiDAR road intelligence for a specific lat/lng.
 * Used by ActiveTrip and DriverNavigation for real-time road condition lookups.
 */
export async function getLiDARAtPoint(lat: number, lng: number): Promise<{
  elevation: { ft: number; source: string } | null;
  nearestSegment: {
    id: number;
    roadName: string | null;
    gradientPct: number | null;
    iriScore: number | null;
    surfaceQuality: string | null;
    truckRiskScore: number | null;
    curvatureDeg: number | null;
    minClearanceFt: number | null;
    elevationFt: number | null;
    congestion: string | null;
    avgSpeedMph: number | null;
    laneWidthFt: number | null;
    shoulderWidthFt: number | null;
    laneCount: number | null;
  } | null;
}> {
  // Get elevation at this point
  const elev = await getElevationFt(lat, lng);

  // Find nearest enriched road segment
  const db = await getDb();
  let nearestSegment = null;
  if (db) {
    try {
      // Geohash-based proximity search (same cell or adjacent)
      const { encodeGeohash } = await import("./roadIntelligence");
      const gh = encodeGeohash(lat, lng, 5); // precision 5 ≈ ~5km
      const [rows] = await db.execute(
        sql`SELECT id, roadName, gradientPct, iriScore, surfaceQuality,
                   truckRiskScore, curvatureDeg, minClearanceFt,
                   elevationStartFt, congestionLevel, avgSpeedMph,
                   laneWidthFt, shoulderWidthFt, laneCount
            FROM road_segments
            WHERE LEFT(geohash, 5) = ${gh}
            AND lidarEnrichedAt IS NOT NULL
            ORDER BY lastTraversedAt DESC
            LIMIT 1`
      ) as any;
      const row = (rows || [])[0];
      if (row) {
        nearestSegment = {
          id: row.id,
          roadName: row.roadName,
          gradientPct: row.gradientPct ? Number(row.gradientPct) : null,
          iriScore: row.iriScore ? Number(row.iriScore) : null,
          surfaceQuality: row.surfaceQuality,
          truckRiskScore: row.truckRiskScore != null ? Number(row.truckRiskScore) : null,
          curvatureDeg: row.curvatureDeg ? Number(row.curvatureDeg) : null,
          minClearanceFt: row.minClearanceFt ? Number(row.minClearanceFt) : null,
          elevationFt: row.elevationStartFt ? Number(row.elevationStartFt) : null,
          congestion: row.congestionLevel,
          avgSpeedMph: row.avgSpeedMph ? Number(row.avgSpeedMph) : null,
          laneWidthFt: row.laneWidthFt ? Number(row.laneWidthFt) : null,
          shoulderWidthFt: row.shoulderWidthFt ? Number(row.shoulderWidthFt) : null,
          laneCount: row.laneCount ? Number(row.laneCount) : null,
        };
      }
    } catch { /* table may not have LiDAR columns yet */ }
  }

  return {
    elevation: elev ? { ft: elev.elevFt, source: elev.source } : null,
    nearestSegment,
  };
}

/**
 * EusoRoads LiDAR coverage stats.
 */
export async function getLiDARCoverageStats(): Promise<{
  totalSegments: number;
  lidarEnriched: number;
  coveragePct: number;
  avgTruckRisk: number;
  riskDistribution: { low: number; moderate: number; high: number; critical: number };
  surfaceDistribution: { excellent: number; good: number; fair: number; poor: number };
  avgGradientPct: number;
  avgIRI: number;
  sources: { source: string; count: number }[];
}> {
  const db = await getDb();
  if (!db) return {
    totalSegments: 0, lidarEnriched: 0, coveragePct: 0, avgTruckRisk: 0,
    riskDistribution: { low: 0, moderate: 0, high: 0, critical: 0 },
    surfaceDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
    avgGradientPct: 0, avgIRI: 0, sources: [],
  };

  try {
    const [totRow] = await db.execute(sql`SELECT COUNT(*) as cnt FROM road_segments`) as any;
    const total = Number((totRow || [])[0]?.cnt || 0);

    const [enrRow] = await db.execute(
      sql`SELECT COUNT(*) as cnt,
                 AVG(truckRiskScore) as avgRisk,
                 AVG(ABS(CAST(gradientPct AS DECIMAL(5,2)))) as avgGrade,
                 AVG(CAST(iriScore AS DECIMAL(7,2))) as avgIri,
                 SUM(CASE WHEN truckRiskScore < 20 THEN 1 ELSE 0 END) as rLow,
                 SUM(CASE WHEN truckRiskScore BETWEEN 20 AND 40 THEN 1 ELSE 0 END) as rMod,
                 SUM(CASE WHEN truckRiskScore BETWEEN 41 AND 65 THEN 1 ELSE 0 END) as rHigh,
                 SUM(CASE WHEN truckRiskScore > 65 THEN 1 ELSE 0 END) as rCrit,
                 SUM(CASE WHEN surfaceQuality = 'excellent' THEN 1 ELSE 0 END) as sExc,
                 SUM(CASE WHEN surfaceQuality = 'good' THEN 1 ELSE 0 END) as sGood,
                 SUM(CASE WHEN surfaceQuality = 'fair' THEN 1 ELSE 0 END) as sFair,
                 SUM(CASE WHEN surfaceQuality = 'poor' THEN 1 ELSE 0 END) as sPoor
          FROM road_segments
          WHERE lidarEnrichedAt IS NOT NULL`
    ) as any;
    const e = (enrRow || [])[0] || {};
    const enriched = Number(e.cnt || 0);

    const [srcRows] = await db.execute(
      sql`SELECT lidarSource as src, COUNT(*) as cnt
          FROM road_segments WHERE lidarEnrichedAt IS NOT NULL
          GROUP BY lidarSource ORDER BY cnt DESC`
    ) as any;

    return {
      totalSegments: total,
      lidarEnriched: enriched,
      coveragePct: total > 0 ? Math.round((enriched / total) * 100) : 0,
      avgTruckRisk: Math.round(Number(e.avgRisk || 0)),
      riskDistribution: {
        low: Number(e.rLow || 0),
        moderate: Number(e.rMod || 0),
        high: Number(e.rHigh || 0),
        critical: Number(e.rCrit || 0),
      },
      surfaceDistribution: {
        excellent: Number(e.sExc || 0),
        good: Number(e.sGood || 0),
        fair: Number(e.sFair || 0),
        poor: Number(e.sPoor || 0),
      },
      avgGradientPct: Math.round(Number(e.avgGrade || 0) * 100) / 100,
      avgIRI: Math.round(Number(e.avgIri || 0)),
      sources: (srcRows || []).map((r: any) => ({ source: r.src || "unknown", count: Number(r.cnt) })),
    };
  } catch (e) {
    logger.error("[EusoRoads LiDAR] stats error:", e);
    return {
      totalSegments: 0, lidarEnriched: 0, coveragePct: 0, avgTruckRisk: 0,
      riskDistribution: { low: 0, moderate: 0, high: 0, critical: 0 },
      surfaceDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
      avgGradientPct: 0, avgIRI: 0, sources: [],
    };
  }
}
