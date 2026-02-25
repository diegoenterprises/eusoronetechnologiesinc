/**
 * ROAD INTELLIGENCE SERVICE
 * Aggregates driver GPS breadcrumbs into road segments for the proprietary
 * EusoTrip road mapping database.
 *
 * As drivers drive their routes, their GPS breadcrumbs are clustered into
 * ~0.3–0.5 mile road segments. These segments visually populate the Market
 * Intelligence HotZones map in real-time — like Google's mapping cars, but digital.
 *
 * Pipeline:
 *   1. ingestBreadcrumbs() writes raw GPS points to location_breadcrumbs
 *   2. This service reads recent breadcrumbs (last 5 min for live, last 1 hr for segments)
 *   3. Groups points by geohash proximity → creates/updates road_segments
 *   4. Writes live pings to road_live_pings (ephemeral, 5-min TTL)
 *   5. HotZoneMap reads road_segments + road_live_pings for rendering
 */

import { getDb } from "../db";
import { sql, desc, gt } from "drizzle-orm";

// ── Geohash encoding (precision 7 ≈ 150m cells) ──
const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

export function encodeGeohash(lat: number, lng: number, precision = 7): string {
  let minLat = -90, maxLat = 90, minLng = -180, maxLng = 180;
  let hash = "";
  let isEven = true;
  let bit = 0;
  let ch = 0;

  while (hash.length < precision) {
    if (isEven) {
      const mid = (minLng + maxLng) / 2;
      if (lng >= mid) { ch |= (1 << (4 - bit)); minLng = mid; } else { maxLng = mid; }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat >= mid) { ch |= (1 << (4 - bit)); minLat = mid; } else { maxLat = mid; }
    }
    isEven = !isEven;
    if (bit < 4) { bit++; } else { hash += BASE32[ch]; bit = 0; ch = 0; }
  }
  return hash;
}

// ── Haversine distance in miles ──
function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Classify road type from name ──
function classifyRoad(name: string | null): "interstate" | "us_highway" | "state_highway" | "county_road" | "local" | "terminal_access" | "unknown" {
  if (!name) return "unknown";
  const n = name.toUpperCase();
  if (n.includes("I-") || n.includes("INTERSTATE") || /^I\s?\d/.test(n)) return "interstate";
  if (n.includes("US-") || n.includes("US ") || /^US\s?\d/.test(n)) return "us_highway";
  if (n.includes("SR-") || n.includes("STATE ROUTE") || n.includes("STATE HWY") || /^(SR|SH)\s?\d/.test(n)) return "state_highway";
  if (n.includes("COUNTY") || n.includes("CR-") || n.includes("FM ") || n.includes("FM-")) return "county_road";
  if (n.includes("TERMINAL") || n.includes("RACK") || n.includes("REFINERY")) return "terminal_access";
  return "local";
}

// ── Estimate US state from lat/lng (rough bounding boxes) ──
function estimateState(lat: number, lng: number): string | null {
  // Major producing/transit states
  if (lat >= 25.8 && lat <= 36.5 && lng >= -106.6 && lng <= -93.5) return "TX";
  if (lat >= 33.0 && lat <= 37.0 && lng >= -94.6 && lng <= -89.6) return "LA";
  if (lat >= 33.6 && lat <= 37.0 && lng >= -103.0 && lng <= -94.4) return "OK";
  if (lat >= 36.0 && lat <= 41.0 && lng >= -102.0 && lng <= -94.6) return "KS";
  if (lat >= 36.9 && lat <= 40.0 && lng >= -84.8 && lng <= -80.5) return "WV";
  if (lat >= 39.7 && lat <= 42.5 && lng >= -80.5 && lng <= -74.7) return "PA";
  if (lat >= 37.0 && lat <= 40.6 && lng >= -82.6 && lng <= -80.5) return "OH";
  if (lat >= 37.8 && lat <= 43.5 && lng >= -104.1 && lng <= -95.3) return "NE";
  if (lat >= 42.5 && lat <= 49.0 && lng >= -104.1 && lng <= -96.6) return "ND";
  if (lat >= 40.0 && lat <= 45.9 && lng >= -91.2 && lng <= -87.0) return "IL";
  if (lat >= 30.2 && lat <= 35.0 && lng >= -88.5 && lng <= -84.9) return "AL";
  if (lat >= 31.0 && lat <= 35.0 && lng >= -90.3 && lng <= -88.1) return "MS";
  if (lat >= 32.0 && lat <= 35.2 && lng >= -85.6 && lng <= -75.5) return "NC";
  if (lat >= 44.0 && lat <= 49.0 && lng >= -116.0 && lng <= -104.0) return "MT";
  if (lat >= 41.0 && lat <= 45.0 && lng >= -111.0 && lng <= -104.0) return "WY";
  if (lat >= 37.0 && lat <= 41.0 && lng >= -109.0 && lng <= -102.0) return "CO";
  if (lat >= 31.3 && lat <= 37.0 && lng >= -109.0 && lng <= -103.0) return "NM";
  return null;
}

/**
 * AGGREGATE BREADCRUMBS INTO ROAD SEGMENTS
 * Called by cron every 5 minutes. Reads recent breadcrumbs, clusters them
 * by geohash, and upserts road_segments.
 */
export async function aggregateBreadcrumbsToSegments(): Promise<{ processed: number; segmentsCreated: number; segmentsUpdated: number }> {
  const db = await getDb();
  if (!db) return { processed: 0, segmentsCreated: 0, segmentsUpdated: 0 };

  let processed = 0, created = 0, updated = 0;

  try {
    // Read breadcrumbs from the last 10 minutes that haven't been road-processed
    const cutoff = new Date(Date.now() - 10 * 60 * 1000);
    const [rows] = await db.execute(
      sql`SELECT lat, lng, speed, heading, roadName, driverId, loadState, accuracy,
                 snappedLat, snappedLng, serverTimestamp
          FROM location_breadcrumbs
          WHERE serverTimestamp > ${cutoff}
          AND lat IS NOT NULL AND lng IS NOT NULL
          ORDER BY serverTimestamp ASC
          LIMIT 5000`
    ) as any;

    if (!rows || rows.length === 0) return { processed: 0, segmentsCreated: 0, segmentsUpdated: 0 };

    // Group points by geohash
    const geoGroups = new Map<string, any[]>();
    for (const row of rows) {
      const lat = Number(row.snappedLat || row.lat);
      const lng = Number(row.snappedLng || row.lng);
      if (lat === 0 && lng === 0) continue;
      const gh = encodeGeohash(lat, lng, 7);
      if (!geoGroups.has(gh)) geoGroups.set(gh, []);
      geoGroups.get(gh)!.push({ ...row, lat, lng });
      processed++;
    }

    // For each geohash cluster, upsert a road segment
    for (const [gh, points] of Array.from(geoGroups.entries())) {
      if (points.length < 2) continue; // need at least 2 points to form a segment

      const firstPt = points[0];
      const lastPt = points[points.length - 1];
      const roadName = points.find((p: any) => p.roadName)?.roadName || null;
      const speeds = points.filter((p: any) => p.speed != null && Number(p.speed) > 0).map((p: any) => Number(p.speed));
      const avgSpeed = speeds.length > 0 ? speeds.reduce((a: number, b: number) => a + b, 0) / speeds.length : null;
      const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : null;
      const accuracies = points.filter((p: any) => p.accuracy != null).map((p: any) => Number(p.accuracy));
      const avgAccuracy = accuracies.length > 0 ? accuracies.reduce((a: number, b: number) => a + b, 0) / accuracies.length : null;
      const uniqueDriverIds = new Set(points.map((p: any) => p.driverId));
      const hasHazmat = points.some((p: any) => p.loadState === "hazmat" || p.loadState === "loaded");
      const length = haversineMiles(firstPt.lat, firstPt.lng, lastPt.lat, lastPt.lng);
      const roadType = classifyRoad(roadName);
      const state = estimateState((firstPt.lat + lastPt.lat) / 2, (firstPt.lng + lastPt.lng) / 2);

      // Determine congestion from speed
      let congestion: "free_flow" | "light" | "moderate" | "heavy" | "stopped" = "free_flow";
      if (avgSpeed !== null) {
        if (avgSpeed < 5) congestion = "stopped";
        else if (avgSpeed < 20) congestion = "heavy";
        else if (avgSpeed < 35) congestion = "moderate";
        else if (avgSpeed < 50) congestion = "light";
      }

      // Determine surface quality from speed variance
      let surfaceQuality: "excellent" | "good" | "fair" | "poor" | "unknown" = "unknown";
      if (speeds.length >= 3) {
        const mean = avgSpeed || 0;
        const variance = speeds.reduce((sum: number, s: number) => sum + (s - mean) ** 2, 0) / speeds.length;
        const stdDev = Math.sqrt(variance);
        if (stdDev < 5) surfaceQuality = "excellent";
        else if (stdDev < 10) surfaceQuality = "good";
        else if (stdDev < 20) surfaceQuality = "fair";
        else surfaceQuality = "poor";
      }

      const now = new Date();

      // Check if segment exists for this geohash
      const [existing] = await db.execute(
        sql`SELECT id, traversalCount, uniqueDrivers FROM road_segments WHERE geohash = ${gh} LIMIT 1`
      ) as any;

      const existingRow = (existing || [])[0];

      if (existingRow) {
        // Update existing segment
        await db.execute(
          sql`UPDATE road_segments SET
            traversalCount = traversalCount + ${points.length},
            uniqueDrivers = uniqueDrivers + ${uniqueDriverIds.size},
            avgSpeedMph = ${avgSpeed !== null ? avgSpeed.toFixed(2) : null},
            maxSpeedMph = ${maxSpeed !== null ? maxSpeed.toFixed(2) : null},
            avgAccuracy = ${avgAccuracy !== null ? avgAccuracy.toFixed(2) : null},
            surfaceQuality = ${surfaceQuality},
            congestionLevel = ${congestion},
            hasHazmatTraffic = hasHazmatTraffic OR ${hasHazmat},
            lastTraversedAt = ${now},
            roadName = COALESCE(${roadName}, roadName),
            roadType = CASE WHEN roadType = 'unknown' THEN ${roadType} ELSE roadType END
          WHERE id = ${existingRow.id}`
        );
        updated++;
      } else {
        // Create new segment
        await db.execute(
          sql`INSERT INTO road_segments 
            (startLat, startLng, endLat, endLng, geohash, roadName, roadType,
             traversalCount, uniqueDrivers, avgSpeedMph, maxSpeedMph, avgAccuracy,
             surfaceQuality, congestionLevel, hasHazmatTraffic, hasOversizedTraffic,
             firstTraversedAt, lastTraversedAt, lengthMiles, state)
          VALUES 
            (${firstPt.lat.toFixed(7)}, ${firstPt.lng.toFixed(7)},
             ${lastPt.lat.toFixed(7)}, ${lastPt.lng.toFixed(7)},
             ${gh}, ${roadName}, ${roadType},
             ${points.length}, ${uniqueDriverIds.size},
             ${avgSpeed !== null ? avgSpeed.toFixed(2) : null},
             ${maxSpeed !== null ? maxSpeed.toFixed(2) : null},
             ${avgAccuracy !== null ? avgAccuracy.toFixed(2) : null},
             ${surfaceQuality}, ${congestion},
             ${hasHazmat}, ${false},
             ${now}, ${now},
             ${length.toFixed(3)}, ${state})`
        );
        created++;
      }
    }

    // Clean up old live pings (> 5 minutes old)
    const pingCutoff = new Date(Date.now() - 5 * 60 * 1000);
    await db.execute(sql`DELETE FROM road_live_pings WHERE pingAt < ${pingCutoff}`).catch(() => {});

    console.log(`[RoadIntel] Processed ${processed} breadcrumbs → ${created} new segments, ${updated} updated`);
  } catch (e) {
    console.error("[RoadIntel] aggregation error:", e);
  }

  return { processed, segmentsCreated: created, segmentsUpdated: updated };
}

/**
 * WRITE LIVE PING — Called inline during ingestBreadcrumbs() for real-time
 * map animation. Each ping shows as a glowing dot moving along the road.
 */
export async function writeLivePing(driverId: number, lat: number, lng: number, speed?: number, heading?: number, roadName?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    const gh = encodeGeohash(lat, lng, 7);
    await db.execute(
      sql`INSERT INTO road_live_pings (driverId, lat, lng, speed, heading, roadName, geohash, pingAt)
          VALUES (${driverId}, ${lat.toFixed(7)}, ${lng.toFixed(7)}, 
                  ${speed != null ? speed.toFixed(2) : null},
                  ${heading != null ? heading.toFixed(2) : null},
                  ${roadName || null}, ${gh}, NOW())`
    );
  } catch (e) {
    // Non-blocking — don't fail the breadcrumb ingestion
  }
}

/**
 * GET ROAD COVERAGE STATS — Platform-wide road intelligence metrics
 */
export async function getRoadCoverageStats(): Promise<{
  totalSegments: number;
  totalMilesMapped: number;
  totalTraversals: number;
  uniqueDriversContributed: number;
  topRoads: { roadName: string; traversals: number; avgSpeed: number }[];
  coverageByState: { state: string; segments: number; miles: number }[];
}> {
  const db = await getDb();
  if (!db) return { totalSegments: 0, totalMilesMapped: 0, totalTraversals: 0, uniqueDriversContributed: 0, topRoads: [], coverageByState: [] };

  try {
    // Aggregate stats
    const [statsRows] = await db.execute(
      sql`SELECT COUNT(*) as totalSegs,
                 SUM(CAST(lengthMiles AS DECIMAL(10,3))) as totalMiles,
                 SUM(traversalCount) as totalTrav,
                 SUM(uniqueDrivers) as totalDrivers
          FROM road_segments`
    ) as any;
    const stats = (statsRows || [])[0] || {};

    // Top roads by traversals
    const [topRows] = await db.execute(
      sql`SELECT roadName, SUM(traversalCount) as trav, AVG(CAST(avgSpeedMph AS DECIMAL(6,2))) as avgSpd
          FROM road_segments
          WHERE roadName IS NOT NULL
          GROUP BY roadName
          ORDER BY trav DESC
          LIMIT 10`
    ) as any;

    // Coverage by state
    const [stateRows] = await db.execute(
      sql`SELECT state, COUNT(*) as segs, SUM(CAST(lengthMiles AS DECIMAL(10,3))) as miles
          FROM road_segments
          WHERE state IS NOT NULL
          GROUP BY state
          ORDER BY segs DESC
          LIMIT 51`
    ) as any;

    return {
      totalSegments: Number(stats.totalSegs || 0),
      totalMilesMapped: Number(stats.totalMiles || 0),
      totalTraversals: Number(stats.totalTrav || 0),
      uniqueDriversContributed: Number(stats.totalDrivers || 0),
      topRoads: (topRows || []).map((r: any) => ({
        roadName: r.roadName,
        traversals: Number(r.trav),
        avgSpeed: Number(r.avgSpd || 0),
      })),
      coverageByState: (stateRows || []).map((r: any) => ({
        state: r.state,
        segments: Number(r.segs),
        miles: Number(r.miles || 0),
      })),
    };
  } catch (e) {
    console.error("[RoadIntel] stats error:", e);
    return { totalSegments: 0, totalMilesMapped: 0, totalTraversals: 0, uniqueDriversContributed: 0, topRoads: [], coverageByState: [] };
  }
}
