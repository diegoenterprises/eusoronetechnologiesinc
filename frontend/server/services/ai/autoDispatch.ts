/**
 * AI AUTO-DISPATCH SERVICE (Task 4.1.2 / GAP-075)
 * ═══════════════════════════════════════════════════
 * "Smart Assign" — scores available drivers against unassigned loads
 * using proximity, HOS fit, cost, safety, and preference matching.
 *
 * Returns top 3 driver suggestions per load with detailed scoring breakdown.
 */

import { getDb } from "../../db";
import { drivers, loads, users, vehicles } from "../../../drizzle/schema";
import { eq, sql, and, inArray, gte, desc } from "drizzle-orm";

// ── Types ──────────────────────────────────────────────────────────

export interface DriverSuggestion {
  driverId: number;
  driverName: string;
  score: number; // 0–100
  distanceMiles: number;
  hosRemaining: number; // hours
  estimatedCost: number; // deadhead cost
  safetyScore: number;
  reasons: string[];
  breakdown: {
    proximity: number;   // 0–35
    hosFit: number;      // 0–25
    cost: number;        // 0–15
    safety: number;      // 0–15
    preference: number;  // 0–10
  };
}

export interface LoadAssignment {
  loadId: number;
  loadNumber: string;
  origin: string;
  destination: string;
  hazmatClass: string | null;
  equipmentType: string | null;
  estimatedTripHours: number;
  suggestedDrivers: DriverSuggestion[];
}

// ── Constants ──────────────────────────────────────────────────────

const WEIGHTS = {
  proximity: 0.35,
  hosFit: 0.25,
  cost: 0.15,
  safety: 0.15,
  preference: 0.10,
};

const AVG_SPEED_MPH = 50;
const DEADHEAD_COST_PER_MILE = 1.85;
const MAX_SUGGESTIONS_PER_LOAD = 3;
const DEFAULT_HOS_REMAINING = 11; // hours (FMCSA 11-hour driving limit)

// ── Haversine distance (miles) ─────────────────────────────────────

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── State centroids (approximate lat/lng for state-level distance) ──

const STATE_CENTROIDS: Record<string, [number, number]> = {
  AL: [32.8, -86.8], AK: [64.0, -153.0], AZ: [34.3, -111.7], AR: [34.8, -92.2],
  CA: [37.2, -119.5], CO: [39.0, -105.5], CT: [41.6, -72.7], DE: [39.0, -75.5],
  FL: [28.6, -82.4], GA: [32.7, -83.4], HI: [20.5, -157.5], ID: [44.4, -114.6],
  IL: [40.0, -89.0], IN: [39.9, -86.3], IA: [42.0, -93.5], KS: [38.5, -98.4],
  KY: [37.8, -85.3], LA: [31.1, -91.9], ME: [45.4, -69.2], MD: [39.0, -76.7],
  MA: [42.2, -71.5], MI: [44.3, -84.5], MN: [46.3, -94.3], MS: [32.7, -89.7],
  MO: [38.4, -92.5], MT: [47.1, -109.6], NE: [41.5, -99.8], NV: [39.3, -116.6],
  NH: [43.7, -71.6], NJ: [40.1, -74.7], NM: [34.4, -106.1], NY: [42.9, -75.5],
  NC: [35.6, -79.8], ND: [47.4, -100.5], OH: [40.4, -82.8], OK: [35.6, -97.5],
  OR: [44.0, -120.5], PA: [40.9, -77.8], RI: [41.7, -71.5], SC: [33.9, -80.9],
  SD: [44.4, -100.2], TN: [35.9, -86.4], TX: [31.5, -99.4], UT: [39.3, -111.7],
  VT: [44.1, -72.6], VA: [37.5, -78.9], WA: [47.4, -120.7], WV: [38.6, -80.6],
  WI: [44.6, -89.7], WY: [43.0, -107.6], DC: [38.9, -77.0],
};

function getStateCoords(state: string): [number, number] | null {
  return STATE_CENTROIDS[state?.toUpperCase()?.trim()] || null;
}

// ── Core Suggestion Engine ─────────────────────────────────────────

export async function suggestAssignments(
  loadIds: number[],
  companyId?: number,
): Promise<LoadAssignment[]> {
  const db = await getDb();
  if (!db || loadIds.length === 0) return [];

  // 1. Fetch unassigned loads
  const targetLoads = await db
    .select()
    .from(loads)
    .where(
      and(
        inArray(loads.id, loadIds),
        sql`${loads.driverId} IS NULL`,
      )
    );

  if (targetLoads.length === 0) return [];

  // 2. Fetch available drivers (not on active loads)
  const activeDriverIds = await db
    .select({ driverId: loads.driverId })
    .from(loads)
    .where(sql`${loads.status} IN ('in_transit','assigned','loading','unloading','en_route_pickup') AND ${loads.driverId} IS NOT NULL`);
  const busyIds = new Set(activeDriverIds.map(r => r.driverId).filter(Boolean));

  const driverCond = companyId && companyId > 0
    ? and(eq(drivers.companyId, companyId), sql`${drivers.status} IN ('active','available')`)
    : sql`${drivers.status} IN ('active','available')`;

  const driverRows = await db
    .select({
      id: drivers.id,
      userId: drivers.userId,
      companyId: drivers.companyId,
      hazmatEndorsement: drivers.hazmatEndorsement,
      safetyScore: drivers.safetyScore,
      totalLoads: drivers.totalLoads,
      licenseState: drivers.licenseState,
      userName: users.name,
      phone: users.phone,
      metadata: users.metadata,
    })
    .from(drivers)
    .leftJoin(users, eq(drivers.userId, users.id))
    .where(driverCond)
    .limit(200);

  // Filter out busy drivers
  const availableDrivers = driverRows.filter(d => !busyIds.has(d.userId));
  if (availableDrivers.length === 0) return [];

  // 3. Build driver stats (completed loads, on-time rate per driver)
  const driverStatsRows = await db
    .select({
      driverId: loads.driverId,
      total: sql<number>`COUNT(*)`,
      onTime: sql<number>`SUM(CASE WHEN ${loads.actualDeliveryDate} IS NULL OR ${loads.actualDeliveryDate} <= ${loads.deliveryDate} THEN 1 ELSE 0 END)`,
    })
    .from(loads)
    .where(eq(loads.status, "delivered"))
    .groupBy(loads.driverId);

  const driverStatsMap = new Map(
    driverStatsRows.map(r => [r.driverId, { total: r.total || 0, onTime: r.onTime || 0 }])
  );

  // 4. For each load, score every available driver
  const results: LoadAssignment[] = [];

  for (const load of targetLoads) {
    const pickup = load.pickupLocation as any || {};
    const delivery = load.deliveryLocation as any || {};
    const originState = pickup.state || "";
    const destState = delivery.state || "";
    const originCoords = getStateCoords(originState);
    const destCoords = getStateCoords(destState);

    // Estimated trip distance/time
    const tripDistanceMiles = originCoords && destCoords
      ? haversineDistance(originCoords[0], originCoords[1], destCoords[0], destCoords[1])
      : 500; // fallback
    const estimatedTripHours = tripDistanceMiles / AVG_SPEED_MPH;

    const loadHazmat = load.hazmatClass || null;
    const loadEquipment = (() => {
      try {
        const si = typeof load.specialInstructions === "string" ? JSON.parse(load.specialInstructions) : load.specialInstructions;
        return si?.equipmentType || null;
      } catch { return null; }
    })();

    const scored: DriverSuggestion[] = [];

    for (const driver of availableDrivers) {
      const meta = typeof driver.metadata === "string" ? JSON.parse(driver.metadata || "{}") : (driver.metadata || {});
      const reg = meta?.registration || {};

      // ── Filter: hazmat endorsement must match ──
      if (loadHazmat && !driver.hazmatEndorsement) continue;

      // ── Filter: equipment type match ──
      const driverEquipment: string[] = reg.equipmentTypes || [];
      if (loadEquipment && driverEquipment.length > 0 && !driverEquipment.includes(loadEquipment)) continue;

      // ── Proximity Score (0–35) ──
      const driverState = driver.licenseState || reg.state || "";
      const driverCoords = getStateCoords(driverState);
      let distanceMiles = 300; // fallback
      if (driverCoords && originCoords) {
        distanceMiles = haversineDistance(driverCoords[0], driverCoords[1], originCoords[0], originCoords[1]);
      }
      // Closer is better: 0 miles → 35 pts, 500+ miles → 0 pts
      const proximityScore = Math.max(0, 35 * (1 - Math.min(distanceMiles, 500) / 500));

      // ── HOS Fit Score (0–25) — query real ELD data ──
      let hosRemaining = DEFAULT_HOS_REMAINING;
      let hosDataAvailable = false;
      try {
        const todayStr = new Date().toISOString().slice(0, 10);
        const hosRows: any[] = await db.execute(
          sql`SELECT COALESCE(SUM(TIMESTAMPDIFF(MINUTE, start_time, COALESCE(end_time, NOW()))), 0) AS totalDriving
              FROM hos_logs WHERE driver_id = ${driver.id} AND status = 'driving' AND log_date >= ${todayStr}`
        );
        const drivingMinutesToday = (hosRows[0] as any)?.totalDriving || 0;
        hosRemaining = Math.max(0, 11 - drivingMinutesToday / 60);
        hosDataAvailable = true;
      } catch { /* ELD table may not exist yet — use default */ }
      const hosRatio = Math.min(hosRemaining / Math.max(estimatedTripHours, 1), 1);
      const hosScore = hosRemaining >= estimatedTripHours
        ? 25 * hosRatio
        : Math.max(0, 25 * (hosRemaining / Math.max(estimatedTripHours, 1)) - 5);

      // ── Cost Score (0–15) ──
      const deadheadCost = distanceMiles * DEADHEAD_COST_PER_MILE;
      // Lower cost is better: $0 → 15 pts, $1000+ → 0 pts
      const costScore = Math.max(0, 15 * (1 - Math.min(deadheadCost, 1000) / 1000));

      // ── Safety Score (0–15) ──
      const rawSafety = driver.safetyScore ?? 85;
      const safetyNorm = Math.min(rawSafety, 100) / 100;
      const safetyScore = 15 * safetyNorm;

      // ── Preference Score (0–10) ──
      const preferredLanes: string[] = reg.preferredLanes || meta.preferredLanes || [];
      const laneKey = `${originState}-${destState}`;
      const reverseLaneKey = `${destState}-${originState}`;
      const laneMatch = preferredLanes.some(
        (pl: string) => pl === laneKey || pl === reverseLaneKey || pl.includes(originState) || pl.includes(destState)
      );
      const preferenceScore = laneMatch ? 10 : (driver.totalLoads && driver.totalLoads > 50 ? 5 : 2);

      // ── Total Score ──
      const totalScore = Math.round(proximityScore + hosScore + costScore + safetyScore + preferenceScore);

      // ── Build Reasons ──
      const reasons: string[] = [];
      if (distanceMiles < 50) reasons.push(`${Math.round(distanceMiles)} miles from pickup`);
      else if (distanceMiles < 150) reasons.push(`${Math.round(distanceMiles)} miles away`);
      else reasons.push(`${Math.round(distanceMiles)} miles deadhead`);

      reasons.push(`${hosRemaining.toFixed(1)} HOS hours remaining`);

      if (driver.hazmatEndorsement && loadHazmat) reasons.push("Hazmat endorsed");
      if (laneMatch) reasons.push("Prefers this lane");

      const driverStats = driverStatsMap.get(driver.userId);
      if (driverStats && driverStats.total > 0) {
        const otRate = Math.round((driverStats.onTime / driverStats.total) * 100);
        if (otRate >= 90) reasons.push(`${otRate}% on-time rate`);
      }

      if (rawSafety >= 95) reasons.push("Excellent safety record");

      scored.push({
        driverId: driver.id,
        driverName: driver.userName || "Driver",
        score: Math.min(100, totalScore),
        distanceMiles: Math.round(distanceMiles),
        hosRemaining,
        estimatedCost: Math.round(deadheadCost),
        safetyScore: rawSafety,
        reasons,
        breakdown: {
          proximity: Math.round(proximityScore * 10) / 10,
          hosFit: Math.round(hosScore * 10) / 10,
          cost: Math.round(costScore * 10) / 10,
          safety: Math.round(safetyScore * 10) / 10,
          preference: Math.round(preferenceScore * 10) / 10,
        },
      });
    }

    // Sort by score desc, take top N
    scored.sort((a, b) => b.score - a.score);
    const topSuggestions = scored.slice(0, MAX_SUGGESTIONS_PER_LOAD);

    results.push({
      loadId: load.id,
      loadNumber: load.loadNumber || `LD-${load.id}`,
      origin: pickup.city && pickup.state ? `${pickup.city}, ${pickup.state}` : "Unknown",
      destination: delivery.city && delivery.state ? `${delivery.city}, ${delivery.state}` : "Unknown",
      hazmatClass: loadHazmat,
      equipmentType: loadEquipment,
      estimatedTripHours: Math.round(estimatedTripHours * 10) / 10,
      suggestedDrivers: topSuggestions,
    });
  }

  return results;
}
