/**
 * State 511 Road Conditions Integration
 * Source: State DOT 511 systems (TX, CA, CO, etc.)
 * Auth: None (public APIs)
 * Refresh: Every 30 minutes
 * Data: Road closures, construction, incidents, weather-related restrictions
 */
import { getDb } from "../../db";
import { sql } from "drizzle-orm";

const STATE_511_ENDPOINTS: { state: string; url: string }[] = [
  { state: "TX", url: "https://its.txdot.gov/ITS_WEB/FrontEnd/default.html/api/conditions" },
  { state: "CO", url: "https://www.cotrip.org/api/graphql" },
  { state: "CA", url: "https://cwwp2.dot.ca.gov/data/d7/cctv/cctvStatusD07.json" },
];

// TxDOT DriveTexas conditions feed (GeoJSON)
async function fetchTexasConditions(db: any): Promise<number> {
  let count = 0;
  try {
    const response = await fetch(
      "https://its.txdot.gov/ITS_WEB/FrontEnd/default.html/GetRoadConditions",
      {
        signal: AbortSignal.timeout(15000),
        headers: { Accept: "application/json", "User-Agent": "EusoTrip/3.0" },
      }
    );
    if (!response.ok) return 0;

    const data = await response.json();
    const conditions = Array.isArray(data) ? data : data.conditions || data.features || [];

    for (const item of conditions.slice(0, 100)) {
      const props = item.properties || item;
      const id = `road-TX-${props.id || props.conditionId || Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const route = props.roadName || props.route || "Unknown";
      const description = props.description || props.condition || "";
      const severity = props.severity || (description.toLowerCase().includes("closed") ? "HIGH" : "MODERATE");

      await db.execute(
        sql`INSERT INTO hz_rate_indices
            (id, origin, destination, equipment_type, rate_per_mile, load_to_truck_ratio, source, report_date)
            VALUES (${id.substring(0, 36)}, ${"TX"}, ${route.substring(0, 100)}, 'ROAD_CONDITION',
                    ${severity}, ${description.substring(0, 200)}, 'STATE_511', CURDATE())
            ON DUPLICATE KEY UPDATE rate_per_mile = ${severity}, fetched_at = NOW()`
      );
      count++;
    }
  } catch (e) {
    console.error("[511-TX] Failed:", e);
  }
  return count;
}

// Colorado COTRIP conditions
async function fetchColoradoConditions(db: any): Promise<number> {
  let count = 0;
  try {
    const response = await fetch("https://www.cotrip.org/speed/getSegments.do", {
      signal: AbortSignal.timeout(15000),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return 0;

    const data = await response.json();
    const segments = Array.isArray(data) ? data : data.segments || [];

    for (const seg of segments.slice(0, 50)) {
      if (!seg.closureDescription && !seg.restrictionDescription) continue;

      const id = `road-CO-${seg.segmentId || Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const desc = seg.closureDescription || seg.restrictionDescription || "";

      await db.execute(
        sql`INSERT INTO hz_rate_indices
            (id, origin, destination, equipment_type, rate_per_mile, load_to_truck_ratio, source, report_date)
            VALUES (${id.substring(0, 36)}, ${"CO"}, ${(seg.roadName || "I-70").substring(0, 100)}, 'ROAD_CONDITION',
                    ${"HIGH"}, ${desc.substring(0, 200)}, 'STATE_511', CURDATE())
            ON DUPLICATE KEY UPDATE rate_per_mile = ${"HIGH"}, fetched_at = NOW()`
      );
      count++;
    }
  } catch (e) {
    console.error("[511-CO] Failed:", e);
  }
  return count;
}

export async function fetchRoadConditions(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [txCount, coCount] = await Promise.allSettled([
    fetchTexasConditions(db),
    fetchColoradoConditions(db),
  ]);

  const total = (txCount.status === "fulfilled" ? txCount.value : 0) +
                (coCount.status === "fulfilled" ? coCount.value : 0);

  console.log(`[511] Updated ${total} road conditions`);
}
