/**
 * CONTEXTUAL INTELLIGENCE LAYER FOR DYNAMIC PRICING (Task 13.1)
 *
 * Enriches rate predictions with real-time contextual signals:
 * 1. Weather disruptions (storms, hurricanes, winter conditions)
 * 2. Capacity indicators (truck-to-load ratio, driver availability)
 * 3. Event-driven demand (holidays, produce season, peak shipping)
 * 4. Regulatory impacts (HOS changes, emission zones, permit costs)
 * 5. Fuel price volatility and regional differentials
 * 6. Competitor rate intelligence (market positioning)
 * 7. Historical lane pattern recognition
 */

import { getDb } from "../db";
import { loads, drivers, fuelTransactions, hzFuelPrices } from "../../drizzle/schema";
import { sql, eq, and, gte, desc, inArray } from "drizzle-orm";

// ── Types ──

export type SignalStrength = "low" | "medium" | "high" | "critical";

export interface ContextSignal {
  id: string;
  category: "weather" | "capacity" | "event" | "regulatory" | "fuel" | "competitor" | "pattern";
  name: string;
  description: string;
  impact: number; // percentage adjustment (-30 to +30)
  strength: SignalStrength;
  confidence: number;
  source: string;
  expiresAt: string;
  affectedLanes: string[];
}

export interface ContextualPriceResult {
  baseRate: number;
  contextualRate: number;
  adjustmentPct: number;
  signals: ContextSignal[];
  rateBreakdown: {
    baseLineHaul: number;
    weatherAdjustment: number;
    capacityAdjustment: number;
    eventAdjustment: number;
    regulatoryAdjustment: number;
    fuelAdjustment: number;
    competitorAdjustment: number;
    patternAdjustment: number;
  };
  recommendation: string;
  confidenceLevel: number;
  validUntil: string;
  marketPhase: "buyers" | "balanced" | "sellers" | "disrupted";
}

export interface LaneIntelligence {
  lane: string;
  origin: { state: string; city?: string };
  destination: { state: string; city?: string };
  currentSpotRate: number;
  weekOverWeekChange: number;
  avgTransitDays: number;
  truckToLoadRatio: number;
  activeSignals: ContextSignal[];
  volatilityIndex: number;
  forecastDirection: "rising" | "stable" | "falling";
  bestTimeToBook: string;
}

// ── Signal Generators ──

function generateWeatherSignals(_originState: string, _destState: string): ContextSignal[] {
  // Weather signals require an external API (e.g. NOAA/NWS).
  // The hzWeatherAlerts table could be queried here once a weather-data
  // ingestion job is running. For now, return empty to avoid fake data.
  return [];
}

async function generateCapacitySignals(originState: string, destState: string): Promise<ContextSignal[]> {
  const signals: ContextSignal[] = [];
  const now = new Date();

  try {
    const db = await getDb();

    // Count open (unfulfilled) loads originating from this state
    const activeStatuses = ["posted", "bidding", "awarded", "accepted"] as const;
    const [loadCountResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(loads)
      .where(
        and(
          eq(loads.originState, originState),
          inArray(loads.status, [...activeStatuses]),
        ),
      );

    // Count available drivers whose license state matches origin
    const [driverCountResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(drivers)
      .where(
        and(
          eq(drivers.licenseState, originState),
          inArray(drivers.status, ["active", "available"]),
        ),
      );

    const openLoads = Number(loadCountResult?.count ?? 0);
    const availableDrivers = Number(driverCountResult?.count ?? 0);

    if (openLoads > 0) {
      // Truck-to-load ratio: higher means more supply (looser); lower means tighter
      const ratio = availableDrivers > 0 ? availableDrivers / openLoads : 0;
      const impact = ratio < 1.0 ? Math.round((1.5 - ratio) * 10) : ratio < 2.0 ? Math.round((2.5 - ratio) * 4) : 0;
      const strength: SignalStrength = ratio < 1.0 ? "critical" : ratio < 1.5 ? "high" : ratio < 2.5 ? "medium" : "low";

      if (impact > 0) {
        signals.push({
          id: `cap-${originState}`, category: "capacity",
          name: `Capacity — ${originState}`,
          description: `${originState}: ${availableDrivers} available drivers for ${openLoads} open loads (ratio ${ratio.toFixed(1)}:1)`,
          impact,
          strength,
          confidence: 80,
          source: "Platform load/driver data",
          expiresAt: new Date(now.getTime() + 4 * 3600000).toISOString(),
          affectedLanes: [`${originState}-${destState}`],
        });
      }
    }
  } catch (err) {
    // If DB query fails, return empty rather than fake data
  }

  return signals;
}

function generateEventSignals(originState: string, destState: string): ContextSignal[] {
  const signals: ContextSignal[] = [];
  const now = new Date();
  const month = now.getMonth() + 1;

  // Produce season (April-September) — calendar fact, not fabricated data
  const produceStates = new Set(["CA", "FL", "AZ", "GA", "WA"]);
  if (month >= 4 && month <= 9 && (produceStates.has(originState) || produceStates.has(destState))) {
    signals.push({
      id: "evt-produce-season", category: "event", name: "Produce Season",
      description: "Produce season active — reefer demand typically elevated",
      impact: 0, strength: "low", confidence: 90, source: "USDA Crop Calendar",
      expiresAt: new Date(now.getFullYear(), 9, 1).toISOString(),
      affectedLanes: [`${originState}-${destState}`],
    });
  }

  // Peak shipping (Sep-Nov) — calendar fact
  if (month >= 9 && month <= 11) {
    signals.push({
      id: "evt-peak-season", category: "event", name: "Peak Shipping Season",
      description: "Q4 retail peak period — capacity may tighten",
      impact: 0, strength: "low", confidence: 90, source: "Industry Calendar",
      expiresAt: new Date(now.getFullYear(), 11, 15).toISOString(),
      affectedLanes: [`${originState}-${destState}`],
    });
  }

  // Holiday proximity — calendar facts used as informational signals (impact 0)
  // Actual pricing impact should come from observed capacity/pattern data
  const holidays: { month: number; day: number; name: string; daysBefore: number }[] = [
    { month: 1, day: 1, name: "New Year", daysBefore: 7 },
    { month: 5, day: 26, name: "Memorial Day", daysBefore: 7 },
    { month: 7, day: 4, name: "Independence Day", daysBefore: 7 },
    { month: 9, day: 1, name: "Labor Day", daysBefore: 7 },
    { month: 11, day: 27, name: "Thanksgiving", daysBefore: 10 },
    { month: 12, day: 25, name: "Christmas", daysBefore: 14 },
  ];
  for (const h of holidays) {
    const holidayDate = new Date(now.getFullYear(), h.month - 1, h.day);
    const daysUntil = (holidayDate.getTime() - now.getTime()) / 86400000;
    if (daysUntil > 0 && daysUntil <= h.daysBefore) {
      signals.push({
        id: `evt-holiday-${h.name.toLowerCase().replace(/\s/g, "-")}`, category: "event",
        name: `Upcoming: ${h.name}`,
        description: `${Math.round(daysUntil)} days to ${h.name} — capacity may be reduced`,
        impact: 0, strength: "low",
        confidence: 95, source: "Calendar",
        expiresAt: holidayDate.toISOString(),
        affectedLanes: [`${originState}-${destState}`],
      });
    }
  }

  return signals;
}

function generateRegulatorySignals(originState: string, destState: string): ContextSignal[] {
  const signals: ContextSignal[] = [];
  const now = new Date();

  // California emission zones
  if (originState === "CA" || destState === "CA") {
    signals.push({
      id: "reg-ca-emissions", category: "regulatory", name: "CA CARB Compliance",
      description: "California Air Resources Board emission standards require compliant equipment",
      impact: 5, strength: "medium", confidence: 95, source: "CARB Regulations",
      expiresAt: new Date(now.getFullYear() + 1, 0, 1).toISOString(),
      affectedLanes: [`${originState}-${destState}`],
    });
  }

  // NY/NJ congestion surcharges
  if (["NY", "NJ"].includes(originState) || ["NY", "NJ"].includes(destState)) {
    signals.push({
      id: "reg-nynj-congestion", category: "regulatory", name: "NY/NJ Congestion Zone",
      description: "Port congestion and urban delivery surcharges in NY/NJ metro",
      impact: 4, strength: "low", confidence: 90, source: "Port Authority",
      expiresAt: new Date(now.getTime() + 30 * 86400000).toISOString(),
      affectedLanes: [`${originState}-${destState}`],
    });
  }

  return signals;
}

async function generateFuelSignals(originState: string, destState: string): Promise<ContextSignal[]> {
  const signals: ContextSignal[] = [];
  const now = new Date();

  try {
    const db = await getDb();

    // Query latest fuel price data from hzFuelPrices for origin and destination states
    const statesToCheck = [originState, destState].filter(Boolean);
    const fuelRows = await db
      .select({
        stateCode: hzFuelPrices.stateCode,
        dieselRetail: hzFuelPrices.dieselRetail,
        dieselChange1w: hzFuelPrices.dieselChange1w,
        dieselChange1m: hzFuelPrices.dieselChange1m,
        reportDate: hzFuelPrices.reportDate,
      })
      .from(hzFuelPrices)
      .where(inArray(hzFuelPrices.stateCode, statesToCheck))
      .orderBy(desc(hzFuelPrices.reportDate))
      .limit(statesToCheck.length);

    // Also compute average fuel cost from recent platform transactions (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const [avgFuel] = await db
      .select({ avgPrice: sql<number>`AVG(pricePerGallon)` })
      .from(fuelTransactions)
      .where(gte(fuelTransactions.transactionDate, thirtyDaysAgo));

    const nationalAvg = Number(avgFuel?.avgPrice ?? 0);

    for (const row of fuelRows) {
      const dieselPrice = Number(row.dieselRetail ?? 0);
      const weeklyChange = Number(row.dieselChange1w ?? 0);
      const monthlyChange = Number(row.dieselChange1m ?? 0);

      if (dieselPrice <= 0) continue;

      // Determine impact from weekly price change
      // Positive change = rising prices = upward pressure on rates
      const impact = weeklyChange > 0.10 ? Math.min(Math.round(weeklyChange * 20), 15)
        : weeklyChange < -0.10 ? Math.max(Math.round(weeklyChange * 15), -10)
        : 0;

      if (impact !== 0) {
        const direction = impact > 0 ? "rising" : "falling";
        const strength: SignalStrength = Math.abs(impact) >= 8 ? "high" : Math.abs(impact) >= 4 ? "medium" : "low";

        signals.push({
          id: `fuel-${row.stateCode}`,
          category: "fuel",
          name: `Diesel ${direction} — ${row.stateCode}`,
          description: `${row.stateCode} diesel at $${dieselPrice.toFixed(3)}/gal (${weeklyChange >= 0 ? "+" : ""}${weeklyChange.toFixed(3)} week, ${monthlyChange >= 0 ? "+" : ""}${monthlyChange.toFixed(3)} month)`,
          impact,
          strength,
          confidence: 85,
          source: "EIA/OPIS via hz_fuel_prices",
          expiresAt: new Date(now.getTime() + 7 * 86400000).toISOString(),
          affectedLanes: [`${originState}-${destState}`],
        });
      }
    }

    // If platform transaction data shows prices significantly above national average, flag it
    if (nationalAvg > 0 && fuelRows.length > 0) {
      const originRow = fuelRows.find(r => r.stateCode === originState);
      if (originRow) {
        const statePrice = Number(originRow.dieselRetail ?? 0);
        const pctAboveAvg = statePrice > 0 && nationalAvg > 0
          ? ((statePrice - nationalAvg) / nationalAvg) * 100
          : 0;

        if (Math.abs(pctAboveAvg) >= 10) {
          signals.push({
            id: `fuel-regional-${originState}`,
            category: "fuel",
            name: `Regional Fuel Premium — ${originState}`,
            description: `${originState} diesel is ${pctAboveAvg > 0 ? "+" : ""}${pctAboveAvg.toFixed(1)}% vs platform average ($${nationalAvg.toFixed(3)}/gal)`,
            impact: Math.round(pctAboveAvg * 0.3),
            strength: Math.abs(pctAboveAvg) >= 20 ? "high" : "medium",
            confidence: 75,
            source: "Platform fuel transactions",
            expiresAt: new Date(now.getTime() + 7 * 86400000).toISOString(),
            affectedLanes: [`${originState}-${destState}`],
          });
        }
      }
    }
  } catch (err) {
    // If DB query fails, return empty rather than fake data
  }

  return signals;
}

async function generatePatternSignals(originState: string, destState: string): Promise<ContextSignal[]> {
  const signals: ContextSignal[] = [];
  const now = new Date();
  const dow = now.getDay(); // 0=Sun..6=Sat

  try {
    const db = await getDb();
    const lane = `${originState}-${destState}`;

    // Query historical loads on this lane from the past 90 days
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);

    const laneHistory = await db
      .select({
        avgRate: sql<number>`AVG(CAST(rate AS DECIMAL(10,2)))`,
        loadCount: sql<number>`COUNT(*)`,
        avgDistance: sql<number>`AVG(CAST(distance AS DECIMAL(10,2)))`,
      })
      .from(loads)
      .where(
        and(
          eq(loads.originState, originState),
          eq(loads.destState, destState),
          gte(loads.createdAt, ninetyDaysAgo),
        ),
      );

    const totalLoads = Number(laneHistory[0]?.loadCount ?? 0);
    const avgRate = Number(laneHistory[0]?.avgRate ?? 0);

    if (totalLoads < 3) {
      // Not enough data for meaningful patterns
      return signals;
    }

    // Day-of-week pattern: compare average rate on current DOW vs overall average
    const dowHistory = await db
      .select({
        avgRate: sql<number>`AVG(CAST(rate AS DECIMAL(10,2)))`,
        loadCount: sql<number>`COUNT(*)`,
      })
      .from(loads)
      .where(
        and(
          eq(loads.originState, originState),
          eq(loads.destState, destState),
          gte(loads.createdAt, ninetyDaysAgo),
          sql`DAYOFWEEK(createdAt) = ${dow + 1}`,
        ),
      );

    const dowCount = Number(dowHistory[0]?.loadCount ?? 0);
    const dowAvgRate = Number(dowHistory[0]?.avgRate ?? 0);

    if (dowCount >= 2 && avgRate > 0 && dowAvgRate > 0) {
      const pctDiff = ((dowAvgRate - avgRate) / avgRate) * 100;
      if (Math.abs(pctDiff) >= 2) {
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const direction = pctDiff > 0 ? "premium" : "discount";
        signals.push({
          id: `pat-dow-${dow}`, category: "pattern",
          name: `${dayNames[dow]} ${direction === "premium" ? "Premium" : "Discount"}`,
          description: `${dayNames[dow]} loads on ${lane} average ${pctDiff > 0 ? "+" : ""}${pctDiff.toFixed(1)}% vs lane mean ($${avgRate.toFixed(0)} avg, ${totalLoads} loads over 90d)`,
          impact: Math.round(pctDiff),
          strength: Math.abs(pctDiff) >= 8 ? "high" : Math.abs(pctDiff) >= 4 ? "medium" : "low",
          confidence: Math.min(50 + dowCount * 5, 85),
          source: "Platform historical loads",
          expiresAt: new Date(now.getTime() + 86400000).toISOString(),
          affectedLanes: [lane],
        });
      }
    }

    // Volume trend: compare last 30d load count vs prior 30d
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000);

    const [recent] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(loads)
      .where(
        and(
          eq(loads.originState, originState),
          eq(loads.destState, destState),
          gte(loads.createdAt, thirtyDaysAgo),
        ),
      );

    const [prior] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(loads)
      .where(
        and(
          eq(loads.originState, originState),
          eq(loads.destState, destState),
          gte(loads.createdAt, sixtyDaysAgo),
          sql`createdAt < ${thirtyDaysAgo}`,
        ),
      );

    const recentCount = Number(recent?.count ?? 0);
    const priorCount = Number(prior?.count ?? 0);

    if (priorCount >= 3 && recentCount > 0) {
      const volumeChange = ((recentCount - priorCount) / priorCount) * 100;
      if (Math.abs(volumeChange) >= 20) {
        const trending = volumeChange > 0 ? "Surging" : "Declining";
        const impact = volumeChange > 0 ? Math.min(Math.round(volumeChange * 0.15), 10) : Math.max(Math.round(volumeChange * 0.1), -8);
        signals.push({
          id: `pat-volume-${originState}-${destState}`, category: "pattern",
          name: `Volume ${trending} — ${lane}`,
          description: `${lane} load volume ${volumeChange > 0 ? "+" : ""}${volumeChange.toFixed(0)}% month-over-month (${recentCount} vs ${priorCount} loads)`,
          impact,
          strength: Math.abs(volumeChange) >= 50 ? "high" : "medium",
          confidence: Math.min(60 + priorCount * 2, 85),
          source: "Platform historical loads",
          expiresAt: new Date(now.getTime() + 7 * 86400000).toISOString(),
          affectedLanes: [lane],
        });
      }
    }
  } catch (err) {
    // If DB query fails, return empty rather than fake data
  }

  return signals;
}

// ── Main API ──

export async function getContextualPrice(
  originState: string,
  destState: string,
  baseRate: number,
  distance: number,
): Promise<ContextualPriceResult> {
  // Await async signal generators, run sync ones directly
  const [capacitySignals, fuelSignals, patternSignals] = await Promise.all([
    generateCapacitySignals(originState, destState),
    generateFuelSignals(originState, destState),
    generatePatternSignals(originState, destState),
  ]);

  const signals = [
    ...generateWeatherSignals(originState, destState),
    ...capacitySignals,
    ...generateEventSignals(originState, destState),
    ...generateRegulatorySignals(originState, destState),
    ...fuelSignals,
    ...patternSignals,
  ];

  // Aggregate adjustments by category
  const catImpact = (cat: ContextSignal["category"]) =>
    signals.filter(s => s.category === cat).reduce((sum, s) => sum + s.impact, 0);

  const weatherAdj = catImpact("weather");
  const capacityAdj = catImpact("capacity");
  const eventAdj = catImpact("event");
  const regulatoryAdj = catImpact("regulatory");
  const fuelAdj = catImpact("fuel");
  const competitorAdj = catImpact("competitor");
  const patternAdj = catImpact("pattern");

  const totalAdjPct = weatherAdj + capacityAdj + eventAdj + regulatoryAdj + fuelAdj + competitorAdj + patternAdj;
  const contextualRate = Math.round(baseRate * (1 + totalAdjPct / 100));

  const avgConfidence = signals.length > 0
    ? Math.round(signals.reduce((s, sig) => s + sig.confidence, 0) / signals.length)
    : 50;

  const criticalCount = signals.filter(s => s.strength === "critical" || s.strength === "high").length;
  const marketPhase: ContextualPriceResult["marketPhase"] =
    criticalCount >= 3 ? "disrupted" : totalAdjPct > 15 ? "sellers" : totalAdjPct < -5 ? "buyers" : "balanced";

  const recommendation =
    marketPhase === "disrupted" ? "Market disruption detected — secure capacity immediately at premium rates"
    : marketPhase === "sellers" ? "Tight market conditions — lock in rates quickly, expect premium pricing"
    : marketPhase === "buyers" ? "Favorable buyer conditions — negotiate aggressively for discounts"
    : "Balanced market — standard competitive rates apply";

  return {
    baseRate,
    contextualRate,
    adjustmentPct: totalAdjPct,
    signals,
    rateBreakdown: {
      baseLineHaul: baseRate,
      weatherAdjustment: Math.round(baseRate * weatherAdj / 100),
      capacityAdjustment: Math.round(baseRate * capacityAdj / 100),
      eventAdjustment: Math.round(baseRate * eventAdj / 100),
      regulatoryAdjustment: Math.round(baseRate * regulatoryAdj / 100),
      fuelAdjustment: Math.round(baseRate * fuelAdj / 100),
      competitorAdjustment: Math.round(baseRate * competitorAdj / 100),
      patternAdjustment: Math.round(baseRate * patternAdj / 100),
    },
    recommendation,
    confidenceLevel: avgConfidence,
    validUntil: new Date(Date.now() + 4 * 3600000).toISOString(),
    marketPhase,
  };
}

export async function getLaneIntelligence(
  originState: string,
  destState: string,
  distance: number,
): Promise<LaneIntelligence> {
  const lane = `${originState}-${destState}`;
  const now = new Date();

  // Gather signals (async + sync)
  const [capacitySignals] = await Promise.all([
    generateCapacitySignals(originState, destState),
  ]);

  const signals = [
    ...generateWeatherSignals(originState, destState),
    ...capacitySignals,
    ...generateEventSignals(originState, destState),
  ];

  // Query real lane metrics from historical loads
  let spotRate = Math.round(2.50 * distance); // fallback
  let weekChange = 0;
  let volatility = 0;
  let truckToLoad = 0;

  try {
    const db = await getDb();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);

    // Recent average rate on this lane
    const [recentRate] = await db
      .select({
        avgRate: sql<number>`AVG(CAST(rate AS DECIMAL(10,2)))`,
        stdRate: sql<number>`STDDEV(CAST(rate AS DECIMAL(10,2)))`,
        count: sql<number>`COUNT(*)`,
      })
      .from(loads)
      .where(
        and(
          eq(loads.originState, originState),
          eq(loads.destState, destState),
          gte(loads.createdAt, thirtyDaysAgo),
        ),
      );

    const avgRate = Number(recentRate?.avgRate ?? 0);
    const stdRate = Number(recentRate?.stdRate ?? 0);
    const count = Number(recentRate?.count ?? 0);

    if (avgRate > 0) {
      spotRate = Math.round(avgRate);
      volatility = avgRate > 0 ? Math.round((stdRate / avgRate) * 100) / 100 : 0;
    }

    // Week-over-week rate change
    if (count >= 2) {
      const [thisWeek] = await db
        .select({ avgRate: sql<number>`AVG(CAST(rate AS DECIMAL(10,2)))` })
        .from(loads)
        .where(
          and(
            eq(loads.originState, originState),
            eq(loads.destState, destState),
            gte(loads.createdAt, sevenDaysAgo),
          ),
        );

      const [lastWeek] = await db
        .select({ avgRate: sql<number>`AVG(CAST(rate AS DECIMAL(10,2)))` })
        .from(loads)
        .where(
          and(
            eq(loads.originState, originState),
            eq(loads.destState, destState),
            gte(loads.createdAt, fourteenDaysAgo),
            sql`createdAt < ${sevenDaysAgo}`,
          ),
        );

      const thisWeekRate = Number(thisWeek?.avgRate ?? 0);
      const lastWeekRate = Number(lastWeek?.avgRate ?? 0);

      if (lastWeekRate > 0 && thisWeekRate > 0) {
        weekChange = Math.round(((thisWeekRate - lastWeekRate) / lastWeekRate) * 100 * 10) / 10;
      }
    }

    // Truck-to-load from capacity signal (reuse already-computed data)
    const capSignal = capacitySignals.find(s => s.id === `cap-${originState}`);
    if (capSignal) {
      // Parse ratio from description if available
      const ratioMatch = capSignal.description.match(/ratio ([\d.]+):1/);
      if (ratioMatch) truckToLoad = parseFloat(ratioMatch[1]);
    }
  } catch (err) {
    // Fallback to defaults on error
  }

  return {
    lane,
    origin: { state: originState },
    destination: { state: destState },
    currentSpotRate: spotRate,
    weekOverWeekChange: weekChange,
    avgTransitDays: Math.ceil(distance / 500) + 1,
    truckToLoadRatio: Math.round(truckToLoad * 10) / 10,
    activeSignals: signals,
    volatilityIndex: volatility,
    forecastDirection: weekChange > 2 ? "rising" : weekChange < -2 ? "falling" : "stable",
    bestTimeToBook: weekChange > 2 ? "Book now — rates rising" : "Mid-week typically offers best rates",
  };
}
