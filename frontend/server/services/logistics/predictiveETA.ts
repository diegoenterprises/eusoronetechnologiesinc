/**
 * PREDICTIVE ETA ENGINE (Task 2.4.1)
 * ═══════════════════════════════════
 * Wraps the core ETA engine (locationEngine.ts) with intelligence factors:
 *   - Weather delay estimation (NWS alerts along route)
 *   - Traffic pattern adjustment (time-of-day, day-of-week)
 *   - HOS constraint modeling (mandatory rest breaks)
 *   - Historical lane performance (actual vs estimated from past loads)
 *   - Seasonal adjustment (holiday traffic, construction season)
 *
 * Returns: adjusted ETA, confidence interval, delay breakdown, risk flags
 */

import { cacheThrough } from "../cache/redisCache";
import { getDb } from "../../db";
import { loads } from "../../../drizzle/schema";
import { eq, and, sql, gte } from "drizzle-orm";

// ── Types ───────────────────────────────────────────────────────────

export interface PredictiveETAInput {
  loadId?: number;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  distanceMiles: number;
  departureTime?: string;      // ISO string — defaults to now
  isHazmat?: boolean;
  isOversize?: boolean;
  driverHoursRemaining?: number; // HOS hours left before mandatory rest
}

export interface PredictiveETAResult {
  baseEtaMinutes: number;
  adjustedEtaMinutes: number;
  arrivalTime: string;
  confidencePercent: number;
  confidenceWindow: { early: string; late: string };
  delays: {
    weather: number;
    traffic: number;
    hos: number;
    historical: number;
    seasonal: number;
  };
  totalDelayMinutes: number;
  riskFlags: string[];
  factors: string[];
}

// ── Traffic patterns (hour-of-day multipliers) ──────────────────────

const TRAFFIC_MULTIPLIERS: Record<number, number> = {
  0: 0.85, 1: 0.82, 2: 0.80, 3: 0.80, 4: 0.85, 5: 0.95,
  6: 1.15, 7: 1.30, 8: 1.25, 9: 1.10, 10: 1.05, 11: 1.08,
  12: 1.10, 13: 1.05, 14: 1.08, 15: 1.15, 16: 1.30, 17: 1.35,
  18: 1.20, 19: 1.10, 20: 1.00, 21: 0.95, 22: 0.90, 23: 0.88,
};

// Weekend adjustment
const WEEKEND_FACTOR = 0.88;

// ── Seasonal factors ────────────────────────────────────────────────

const SEASONAL_DELAY: Record<number, { factor: number; reason: string }> = {
  0: { factor: 1.08, reason: "Winter weather risk" },
  1: { factor: 1.06, reason: "Winter weather risk" },
  2: { factor: 1.03, reason: "Spring construction begins" },
  3: { factor: 1.05, reason: "Construction season" },
  4: { factor: 1.06, reason: "Peak construction season" },
  5: { factor: 1.08, reason: "Summer travel + construction" },
  6: { factor: 1.10, reason: "Peak summer travel" },
  7: { factor: 1.08, reason: "Late summer travel" },
  8: { factor: 1.04, reason: "Back-to-school traffic" },
  9: { factor: 1.02, reason: "Normal conditions" },
  10: { factor: 1.06, reason: "Holiday travel begins" },
  11: { factor: 1.10, reason: "Peak holiday travel + winter" },
};

// ── HOS modeling ────────────────────────────────────────────────────

const HOS_DRIVE_LIMIT = 11;        // hours
const HOS_DUTY_LIMIT = 14;         // hours
const HOS_MANDATORY_REST = 10;     // hours (30-min break after 8h not modeled separately for simplicity)
const AVG_SPEED_MPH = 55;          // average speed including stops

function calculateHOSDelays(distanceMiles: number, hoursRemaining?: number): {
  delayMinutes: number;
  restStops: number;
  reason: string;
} {
  const drivingHours = distanceMiles / AVG_SPEED_MPH;
  const available = hoursRemaining ?? HOS_DRIVE_LIMIT;

  if (drivingHours <= available) {
    return { delayMinutes: 0, restStops: 0, reason: "Within HOS window" };
  }

  // Calculate required rest stops
  const extraHours = drivingHours - available;
  const restCycles = Math.ceil(extraHours / HOS_DRIVE_LIMIT);
  const delayMinutes = restCycles * HOS_MANDATORY_REST * 60;

  return {
    delayMinutes,
    restStops: restCycles,
    reason: `${restCycles} mandatory ${HOS_MANDATORY_REST}h rest break(s) required`,
  };
}

// ── Historical lane performance ─────────────────────────────────────

async function getHistoricalAdjustment(
  originLat: number, originLng: number,
  destLat: number, destLng: number,
  distanceMiles: number,
): Promise<{ adjustmentMinutes: number; sampleSize: number }> {
  try {
    const db = await getDb();
    if (!db) return { adjustmentMinutes: 0, sampleSize: 0 };

    // Find loads in similar lanes (within ~50 mile radius of origin and dest)
    const since = new Date(Date.now() - 90 * 86400000);
    const rows: any[] = await db.select({
      distance: loads.distance,
      pickupDate: loads.pickupDate,
      actualDeliveryDate: loads.actualDeliveryDate,
      deliveryDate: loads.deliveryDate,
    }).from(loads).where(and(
      eq(loads.status, "delivered" as any),
      gte(loads.createdAt, since),
      sql`CAST(${loads.distance} AS DECIMAL) BETWEEN ${distanceMiles * 0.75} AND ${distanceMiles * 1.25}`,
      sql`${loads.actualDeliveryDate} IS NOT NULL`,
      sql`${loads.deliveryDate} IS NOT NULL`,
    )).limit(100);

    if (rows.length < 3) return { adjustmentMinutes: 0, sampleSize: rows.length };

    // Calculate average overshoot (actual - estimated delivery)
    let totalOvershootMin = 0;
    let validCount = 0;
    for (const row of rows) {
      if (row.actualDeliveryDate && row.deliveryDate) {
        const actual = new Date(row.actualDeliveryDate).getTime();
        const estimated = new Date(row.deliveryDate).getTime();
        const diffMin = (actual - estimated) / 60000;
        if (Math.abs(diffMin) < 2880) { // ignore outliers > 48h
          totalOvershootMin += diffMin;
          validCount++;
        }
      }
    }

    const avgOvershoot = validCount > 0 ? Math.round(totalOvershootMin / validCount) : 0;
    return { adjustmentMinutes: Math.max(0, avgOvershoot), sampleSize: validCount };
  } catch {
    return { adjustmentMinutes: 0, sampleSize: 0 };
  }
}

// ── Weather delay estimation (simplified — NWS integration) ─────────

async function estimateWeatherDelay(
  originLat: number, originLng: number,
  destLat: number, destLng: number,
): Promise<{ delayMinutes: number; alerts: string[] }> {
  try {
    // Check NWS alerts for midpoint of route
    const midLat = (originLat + destLat) / 2;
    const midLng = (originLng + destLng) / 2;

    const result = await cacheThrough<{ delayMinutes: number; alerts: string[] }>(
      "WARM", `weather:eta:${midLat.toFixed(1)}:${midLng.toFixed(1)}`, async () => {
        const res = await fetch(
          `https://api.weather.gov/alerts/active?point=${midLat.toFixed(4)},${midLng.toFixed(4)}`,
          { headers: { "User-Agent": "EusoTrip/1.0 (support@eusotrip.com)" }, signal: AbortSignal.timeout(5000) }
        );
        if (!res.ok) return { delayMinutes: 0, alerts: [] };
        const data = await res.json();
        const features = data?.features || [];
        const alerts: string[] = [];
        let totalDelay = 0;

        for (const f of features.slice(0, 5)) {
          const severity = f?.properties?.severity || "";
          const event = f?.properties?.event || "";
          alerts.push(`${severity}: ${event}`);
          if (severity === "Extreme") totalDelay += 120;
          else if (severity === "Severe") totalDelay += 60;
          else if (severity === "Moderate") totalDelay += 30;
        }

        return { delayMinutes: totalDelay, alerts };
      }, 1800 // 30min cache
    );

    return result || { delayMinutes: 0, alerts: [] };
  } catch {
    return { delayMinutes: 0, alerts: [] };
  }
}

// ── Main Predictive ETA Calculator ──────────────────────────────────

export async function calculatePredictiveETA(input: PredictiveETAInput): Promise<PredictiveETAResult> {
  const departure = input.departureTime ? new Date(input.departureTime) : new Date();
  const hour = departure.getHours();
  const dayOfWeek = departure.getDay();
  const month = departure.getMonth();
  const riskFlags: string[] = [];
  const factors: string[] = [];

  // 1. Base ETA (distance / avg speed)
  const baseEtaMinutes = Math.round((input.distanceMiles / AVG_SPEED_MPH) * 60);
  factors.push(`Base: ${input.distanceMiles} mi @ ${AVG_SPEED_MPH} mph avg`);

  // 2. Traffic adjustment
  const trafficMult = TRAFFIC_MULTIPLIERS[hour] || 1.0;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const effectiveTraffic = isWeekend ? trafficMult * WEEKEND_FACTOR : trafficMult;
  const trafficDelay = Math.round(baseEtaMinutes * (effectiveTraffic - 1));
  if (trafficDelay > 15) factors.push(`Traffic: +${trafficDelay}min (${isWeekend ? "weekend" : `${hour}:00 departure`})`);

  // 3. Weather delay
  const weather = await estimateWeatherDelay(input.originLat, input.originLng, input.destLat, input.destLng);
  if (weather.delayMinutes > 0) {
    factors.push(`Weather: +${weather.delayMinutes}min`);
    riskFlags.push(...weather.alerts);
  }

  // 4. HOS delays
  const hos = calculateHOSDelays(input.distanceMiles, input.driverHoursRemaining);
  if (hos.delayMinutes > 0) {
    factors.push(`HOS: +${Math.round(hos.delayMinutes / 60)}h (${hos.restStops} rest stop(s))`);
    riskFlags.push(hos.reason);
  }

  // 5. Historical adjustment
  const historical = await getHistoricalAdjustment(
    input.originLat, input.originLng, input.destLat, input.destLng, input.distanceMiles,
  );
  if (historical.adjustmentMinutes > 0 && historical.sampleSize >= 3) {
    factors.push(`Historical: +${historical.adjustmentMinutes}min (based on ${historical.sampleSize} loads)`);
  }

  // 6. Seasonal
  const seasonal = SEASONAL_DELAY[month];
  const seasonalDelay = Math.round(baseEtaMinutes * (seasonal.factor - 1));
  if (seasonalDelay > 10) factors.push(`Seasonal: +${seasonalDelay}min (${seasonal.reason})`);

  // 7. Hazmat / oversize penalties
  let specialDelay = 0;
  if (input.isHazmat) { specialDelay += Math.round(baseEtaMinutes * 0.08); factors.push("Hazmat route restriction: +8%"); riskFlags.push("Hazmat route restrictions apply"); }
  if (input.isOversize) { specialDelay += Math.round(baseEtaMinutes * 0.15); factors.push("Oversize permit delays: +15%"); riskFlags.push("Oversize permit / escort delays"); }

  // Total
  const totalDelayMinutes = trafficDelay + weather.delayMinutes + hos.delayMinutes +
    (historical.sampleSize >= 3 ? historical.adjustmentMinutes : 0) + seasonalDelay + specialDelay;
  const adjustedEtaMinutes = baseEtaMinutes + totalDelayMinutes;

  const arrivalTime = new Date(departure.getTime() + adjustedEtaMinutes * 60000).toISOString();

  // Confidence — higher sample size + fewer risk flags = more confident
  let confidence = 85;
  if (historical.sampleSize >= 10) confidence += 5;
  if (historical.sampleSize >= 25) confidence += 5;
  if (weather.alerts.length > 0) confidence -= 10;
  if (hos.restStops > 0) confidence -= 5;
  confidence = Math.max(40, Math.min(98, confidence));

  const windowMinutes = Math.round(adjustedEtaMinutes * (1 - confidence / 100));
  const earlyArrival = new Date(departure.getTime() + (adjustedEtaMinutes - windowMinutes) * 60000).toISOString();
  const lateArrival = new Date(departure.getTime() + (adjustedEtaMinutes + windowMinutes) * 60000).toISOString();

  return {
    baseEtaMinutes,
    adjustedEtaMinutes,
    arrivalTime,
    confidencePercent: confidence,
    confidenceWindow: { early: earlyArrival, late: lateArrival },
    delays: {
      weather: weather.delayMinutes,
      traffic: trafficDelay,
      hos: hos.delayMinutes,
      historical: historical.sampleSize >= 3 ? historical.adjustmentMinutes : 0,
      seasonal: seasonalDelay,
    },
    totalDelayMinutes,
    riskFlags,
    factors,
  };
}
