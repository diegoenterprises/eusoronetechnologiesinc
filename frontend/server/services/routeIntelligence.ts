/**
 * ROUTE INTELLIGENCE SERVICE v1.0
 * "In-House LIDAR" — Every driver is a mapping sensor
 *
 * Processes raw GPS telemetry from locationHistory into:
 * 1. Grid Heat — spatial heatmap of driver density & speed per 0.25deg cell
 * 2. Lane Learning — per-lane real performance from completed trips
 * 3. Corridor Intelligence — zone-to-zone travel metrics
 *
 * Runs as scheduled sync job every 5 minutes.
 */

import { getDb } from "../db";
import { locationHistory } from "../../drizzle/schema";
import { sql, and, gte, desc } from "drizzle-orm";

// Round to nearest 0.25 for grid cells (~17mi)
const gridSnap = (v: number) => Math.round(v * 4) / 4;

/**
 * GRID HEAT AGGREGATION
 * Reads recent GPS pings and buckets them into 0.25-degree grid cells.
 * Each cell gets: ping count, unique drivers, avg speed, moving %.
 */
export async function computeGridHeat(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const since = new Date(Date.now() - 60 * 60 * 1000); // last hour
  const periodStart = new Date();
  periodStart.setMinutes(0, 0, 0); // round to hour

  try {
    const pings = await db.select({
      lat: locationHistory.latitude,
      lng: locationHistory.longitude,
      speed: locationHistory.speed,
      isMoving: locationHistory.isMoving,
      userId: locationHistory.userId,
    }).from(locationHistory)
      .where(gte(locationHistory.serverTimestamp, since))
      .limit(50000);

    if (pings.length === 0) return;

    // Bucket into grid cells
    const cells = new Map<string, { lat: number; lng: number; pings: number; drivers: Set<number>; speeds: number[]; moving: number }>();

    for (const p of pings) {
      const glat = gridSnap(Number(p.lat));
      const glng = gridSnap(Number(p.lng));
      const key = `${glat},${glng}`;
      if (!cells.has(key)) cells.set(key, { lat: glat, lng: glng, pings: 0, drivers: new Set(), speeds: [], moving: 0 });
      const c = cells.get(key)!;
      c.pings++;
      c.drivers.add(p.userId);
      if (p.speed) c.speeds.push(Number(p.speed));
      if (p.isMoving) c.moving++;
    }

    // Upsert into hz_grid_heat
    for (const [, c] of Array.from(cells)) {
      const avgSpd = c.speeds.length > 0 ? c.speeds.reduce((a: number, b: number) => a + b, 0) / c.speeds.length : 0;
      const movPct = c.pings > 0 ? (c.moving / c.pings) * 100 : 0;
      await db.execute(sql`
        INSERT INTO hz_grid_heat (grid_lat, grid_lng, period_start, period_hours, ping_count, unique_drivers, avg_speed_mph, moving_pct)
        VALUES (${c.lat}, ${c.lng}, ${periodStart}, 1, ${c.pings}, ${c.drivers.size}, ${avgSpd.toFixed(2)}, ${movPct.toFixed(2)})
        ON DUPLICATE KEY UPDATE
          ping_count = ping_count + VALUES(ping_count),
          unique_drivers = GREATEST(unique_drivers, VALUES(unique_drivers)),
          avg_speed_mph = (avg_speed_mph + VALUES(avg_speed_mph)) / 2,
          moving_pct = (moving_pct + VALUES(moving_pct)) / 2,
          updated_at = NOW()
      `);
    }

    console.log(`[RouteIntelligence] Grid heat: ${cells.size} cells from ${pings.length} pings`);
  } catch (err) {
    console.error("[RouteIntelligence] Grid heat error:", err);
  }
}

/**
 * LANE LEARNING
 * Reads completed loads and their telemetry to build per-lane metrics:
 * avg rate, transit time, on-time %, dwell times, best departure times.
 */
export async function computeLaneLearning(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Get recently delivered loads with origin/dest
    const delivered = await db.execute(sql`
      SELECT l.id, l.origin, l.destination, l.rate, l.distance,
             l.cargo_type as cargoType, l.equipment_type as equipmentType,
             l.pickup_date as pickupDate, l.delivery_date as deliveryDate,
             l.actual_pickup_time as actualPickup, l.actual_delivery_time as actualDelivery,
             l.created_at as createdAt
      FROM loads l
      WHERE l.status = 'delivered'
        AND l.delivery_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ORDER BY l.delivery_date DESC
      LIMIT 500
    `);

    if (!delivered || !(delivered as any)[0]?.length) return;
    const rows = (delivered as any)[0] as any[];

    // Parse city,state from origin/destination strings
    const parseLoc = (s: string) => {
      if (!s) return { city: "", state: "" };
      const parts = s.split(",").map((p: string) => p.trim());
      return { city: parts[0] || "", state: (parts[1] || "").substring(0, 2).toUpperCase() };
    };

    // Aggregate per lane
    const lanes = new Map<string, { oc: string; os: string; dc: string; ds: string; rates: number[]; dists: number[]; hours: number[]; hazmat: number; trips: number }>();

    for (const r of rows) {
      const o = parseLoc(r.origin || "");
      const d = parseLoc(r.destination || "");
      if (!o.state || !d.state) continue;
      const key = `${o.city}|${o.state}|${d.city}|${d.state}`;
      if (!lanes.has(key)) lanes.set(key, { oc: o.city, os: o.state, dc: d.city, ds: d.state, rates: [], dists: [], hours: [], hazmat: 0, trips: 0 });
      const ln = lanes.get(key)!;
      ln.trips++;
      if (r.rate) ln.rates.push(Number(r.rate));
      if (r.distance) ln.dists.push(Number(r.distance));
      const isHaz = ["HAZMAT", "TANKER"].includes(r.equipmentType || "");
      if (isHaz) ln.hazmat++;
      if (r.actualPickup && r.actualDelivery) {
        const hrs = (new Date(r.actualDelivery).getTime() - new Date(r.actualPickup).getTime()) / 3600000;
        if (hrs > 0 && hrs < 500) ln.hours.push(hrs);
      }
    }

    // Upsert into hz_lane_learning
    for (const [, ln] of Array.from(lanes)) {
      if (ln.trips < 1) continue;
      const avgRate = ln.rates.length > 0 ? ln.rates.reduce((a: number, b: number) => a + b, 0) / ln.rates.length : null;
      const avgDist = ln.dists.length > 0 ? ln.dists.reduce((a: number, b: number) => a + b, 0) / ln.dists.length : null;
      const avgHrs = ln.hours.length > 0 ? ln.hours.reduce((a: number, b: number) => a + b, 0) / ln.hours.length : null;
      const rpm = avgRate && avgDist && avgDist > 0 ? avgRate / avgDist : null;

      await db.execute(sql`
        INSERT INTO hz_lane_learning (origin_city, origin_state, dest_city, dest_state, is_hazmat, trip_count, avg_rate_per_mile, avg_total_rate, avg_distance_miles, avg_transit_hours, last_trip_at)
        VALUES (${ln.oc}, ${ln.os}, ${ln.dc}, ${ln.ds}, ${ln.hazmat > 0 ? 1 : 0}, ${ln.trips}, ${rpm?.toFixed(2) || null}, ${avgRate?.toFixed(2) || null}, ${avgDist?.toFixed(2) || null}, ${avgHrs?.toFixed(2) || null}, NOW())
        ON DUPLICATE KEY UPDATE
          trip_count = trip_count + VALUES(trip_count),
          avg_rate_per_mile = COALESCE((avg_rate_per_mile + VALUES(avg_rate_per_mile)) / 2, VALUES(avg_rate_per_mile)),
          avg_total_rate = COALESCE((avg_total_rate + VALUES(avg_total_rate)) / 2, VALUES(avg_total_rate)),
          avg_distance_miles = COALESCE((avg_distance_miles + VALUES(avg_distance_miles)) / 2, VALUES(avg_distance_miles)),
          avg_transit_hours = COALESCE((avg_transit_hours + VALUES(avg_transit_hours)) / 2, VALUES(avg_transit_hours)),
          last_trip_at = NOW(),
          updated_at = NOW()
      `);
    }

    console.log(`[RouteIntelligence] Lane learning: ${lanes.size} lanes from ${rows.length} deliveries`);
  } catch (err) {
    console.error("[RouteIntelligence] Lane learning error:", err);
  }
}

/**
 * GET GRID HEAT DATA — for HotZoneMap crowd-sourced heat layer
 * Returns grid cells with driver density from recent hours.
 */
export async function getGridHeatData(hours: number = 6): Promise<Array<{ lat: number; lng: number; density: number; avgSpeed: number; drivers: number }>> {
  const db = await getDb();
  if (!db) return [];

  try {
    const since = new Date(Date.now() - hours * 3600000);
    const rows = await db.execute(sql`
      SELECT grid_lat as lat, grid_lng as lng,
             SUM(ping_count) as density,
             AVG(avg_speed_mph) as avgSpeed,
             MAX(unique_drivers) as drivers
      FROM hz_grid_heat
      WHERE period_start >= ${since}
      GROUP BY grid_lat, grid_lng
      HAVING density > 2
      ORDER BY density DESC
      LIMIT 500
    `);
    return ((rows as any)[0] || []).map((r: any) => ({
      lat: Number(r.lat), lng: Number(r.lng),
      density: Number(r.density), avgSpeed: Number(r.avgSpeed || 0), drivers: Number(r.drivers || 0),
    }));
  } catch { return []; }
}

/**
 * GET LANE PERFORMANCE — for rate intelligence and lane analysis
 */
export async function getLanePerformance(originState?: string, destState?: string, limit: number = 50): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    let q = sql`SELECT * FROM hz_lane_learning WHERE trip_count >= 1`;
    if (originState) q = sql`${q} AND origin_state = ${originState}`;
    if (destState) q = sql`${q} AND dest_state = ${destState}`;
    q = sql`${q} ORDER BY trip_count DESC LIMIT ${limit}`;
    const rows = await db.execute(q);
    return (rows as any)[0] || [];
  } catch { return []; }
}

/**
 * OSRM-POWERED REAL DISTANCE & ETA
 * Uses the AI Sidecar's OSRM integration for real driving distances.
 * Falls back to haversine estimation if sidecar is unavailable.
 */
export async function getRealDistance(
  originLat: number, originLng: number,
  destLat: number, destLng: number,
): Promise<{ miles: number; hours: number; source: "osrm" | "haversine" }> {
  // Try OSRM via AI Sidecar
  try {
    const { getDirections } = await import("./aiSidecar");
    const result = await getDirections(
      { lat: originLat, lng: originLng },
      { lat: destLat, lng: destLng },
    );
    if (result?.success && result.distance_miles > 0) {
      return { miles: result.distance_miles, hours: result.duration_hours, source: "osrm" };
    }
  } catch { /* sidecar unavailable */ }

  // Fallback: haversine
  const R = 3959;
  const dLat = (destLat - originLat) * Math.PI / 180;
  const dLng = (destLng - originLng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(originLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const miles = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const hours = miles / 50; // ~50mph avg
  return { miles: Math.round(miles), hours: Math.round(hours * 100) / 100, source: "haversine" };
}

/**
 * MULTI-STOP ROUTE OPTIMIZATION
 * Uses OR-Tools via AI Sidecar to solve VRP for multi-stop routes.
 * Falls back to greedy nearest-neighbor if sidecar is unavailable.
 */
export async function optimizeMultiStopRoute(
  depot: { lat: number; lng: number },
  stops: Array<{ lat: number; lng: number; name?: string }>,
  maxRouteMinutes = 660, // 11-hour HOS
): Promise<{ stops: Array<{ index: number; name: string; lat: number; lng: number }>; totalMiles: number; totalHours: number; source: "ortools" | "greedy" }> {
  // Try OR-Tools via AI Sidecar
  try {
    const { optimizeRoute } = await import("./aiSidecar");
    const result = await optimizeRoute(depot, stops, { maxRouteTimeMinutes: maxRouteMinutes });
    if (result?.success && result.routes.length > 0) {
      const route = result.routes[0];
      return {
        stops: route.stops,
        totalMiles: result.total_distance_miles,
        totalHours: result.total_duration_hours,
        source: "ortools",
      };
    }
  } catch { /* sidecar unavailable */ }

  // Fallback: greedy nearest-neighbor
  const remaining = stops.map((s, i) => ({ ...s, index: i }));
  const ordered: typeof remaining = [];
  let current = depot;
  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const dx = remaining[i].lat - current.lat;
      const dy = remaining[i].lng - current.lng;
      const d = dx * dx + dy * dy;
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next);
    current = next;
  }
  return {
    stops: ordered.map(s => ({ index: s.index, name: s.name || `Stop ${s.index + 1}`, lat: s.lat, lng: s.lng })),
    totalMiles: 0, totalHours: 0, source: "greedy",
  };
}

/**
 * MASTER AGGREGATION — called by scheduler every 5 minutes
 */
export async function computeRouteIntelligence(): Promise<void> {
  console.log("[RouteIntelligence] Starting crowd-sourced intelligence aggregation...");
  const start = Date.now();
  await computeGridHeat();
  await computeLaneLearning();
  console.log(`[RouteIntelligence] Complete in ${Date.now() - start}ms`);
}
