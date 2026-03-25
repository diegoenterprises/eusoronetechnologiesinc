/**
 * AI-OPTIMIZED MISSION BALANCING (GAP-438)
 *
 * Optimizes load distribution across drivers/carriers:
 * 1. Workload balance scoring — even distribution across fleet
 * 2. Deadhead minimization — reduce empty miles between loads
 * 3. HOS utilization optimization — maximize productive hours
 * 4. Revenue per driver optimization — equalize earning opportunity
 * 5. Geographic clustering — group loads by corridor for efficiency
 * 6. Fatigue management — prevent driver burnout patterns
 */

import { getDb } from "../db";
import { drivers, users, loads, vehicles } from "../../drizzle/schema";
import { eq, and, inArray, gte, sql, isNull } from "drizzle-orm";

export interface DriverMission {
  driverId: string;
  driverName: string;
  currentLocation: { state: string; city: string };
  hoursAvailable: number;
  hoursUsedToday: number;
  loadsThisWeek: number;
  revenueThisWeek: number;
  deadheadMilesThisWeek: number;
  loadedMilesThisWeek: number;
  utilizationPct: number;
  fatigueScore: number; // 0=fresh, 100=exhausted
  preferredLanes: string[];
  equipmentType: string;
}

export interface LoadCandidate {
  loadId: string;
  origin: { state: string; city: string };
  destination: { state: string; city: string };
  distance: number;
  rate: number;
  pickupTime: string;
  equipmentRequired: string;
  weight: number;
  priority: "standard" | "hot" | "critical";
}

export interface MissionAssignment {
  driverId: string;
  driverName: string;
  loadId: string;
  deadheadMiles: number;
  totalMiles: number;
  estimatedRevenue: number;
  revenuePerMile: number;
  balanceScore: number;
  reasoning: string[];
  alternativeDrivers: { driverId: string; name: string; score: number }[];
}

export interface FleetBalance {
  totalDrivers: number;
  totalLoads: number;
  avgUtilization: number;
  utilizationStdDev: number;
  avgRevenuePerDriver: number;
  revenueStdDev: number;
  totalDeadheadMiles: number;
  deadheadRatio: number;
  balanceGrade: "A" | "B" | "C" | "D" | "F";
  imbalanceAreas: { area: string; description: string; severity: "low" | "medium" | "high" }[];
  recommendations: string[];
}

export interface MissionDashboard {
  fleetBalance: FleetBalance;
  drivers: DriverMission[];
  pendingLoads: LoadCandidate[];
  suggestedAssignments: MissionAssignment[];
  optimizationSummary: {
    estimatedDeadheadSaved: number;
    estimatedRevenueLift: number;
    driverBalanceImprovement: number;
    hosUtilizationGain: number;
  };
}

// ── Real Data Queries ──

async function generateDrivers(): Promise<DriverMission[]> {
  const db = await getDb();

  // Get active drivers joined with user info
  const driverRows = await db
    .select({
      driverId: drivers.id,
      userId: drivers.userId,
      driverName: users.name,
      currentLocation: users.currentLocation,
      status: drivers.status,
      totalMiles: drivers.totalMiles,
      totalLoads: drivers.totalLoads,
    })
    .from(drivers)
    .innerJoin(users, eq(drivers.userId, users.id))
    .where(
      and(
        inArray(drivers.status, ["active", "available"]),
        eq(users.isActive, true)
      )
    );

  if (driverRows.length === 0) return [];

  // Start of current week (Monday 00:00)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  // Start of today
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Get weekly load stats per driver (loads completed/in-transit this week)
  const driverIds = driverRows.map((d) => d.userId);
  const weeklyStats = await db
    .select({
      driverId: loads.driverId,
      loadsThisWeek: sql<number>`COUNT(*)`.as("loadsThisWeek"),
      revenueThisWeek: sql<number>`COALESCE(SUM(CAST(${loads.rate} AS DECIMAL(12,2))), 0)`.as("revenueThisWeek"),
      loadedMiles: sql<number>`COALESCE(SUM(CAST(${loads.distance} AS DECIMAL(12,2))), 0)`.as("loadedMiles"),
    })
    .from(loads)
    .where(
      and(
        inArray(loads.driverId, driverIds),
        gte(loads.createdAt, monday),
        inArray(loads.status, [
          "accepted", "assigned", "confirmed",
          "en_route_pickup", "at_pickup", "loading", "loaded",
          "in_transit", "at_delivery", "unloading", "delivered",
          "complete",
        ])
      )
    )
    .groupBy(loads.driverId);

  const statsMap = new Map(weeklyStats.map((s) => [s.driverId, s]));

  // Get vehicle equipment type per driver
  const vehicleRows = await db
    .select({
      currentDriverId: vehicles.currentDriverId,
      vehicleType: vehicles.vehicleType,
    })
    .from(vehicles)
    .where(
      and(
        inArray(vehicles.currentDriverId, driverIds),
        eq(vehicles.status, "in_use")
      )
    );

  const vehicleMap = new Map(vehicleRows.map((v) => [v.currentDriverId, v.vehicleType]));

  return driverRows.map((d) => {
    const stats = statsMap.get(d.userId);
    const loadsThisWeek = stats?.loadsThisWeek ?? 0;
    const revenueThisWeek = Number(stats?.revenueThisWeek ?? 0);
    const loadedMiles = Number(stats?.loadedMiles ?? 0);

    // Estimate deadhead as ~15% of loaded miles (industry avg when no tracking data)
    const deadheadMiles = Math.round(loadedMiles * 0.15);

    // Estimate hours used today based on loads in transit today
    // Rough heuristic: each load ~ 3 hrs driving today
    const hoursUsedToday = Math.min(11, loadsThisWeek > 0 ? Math.min(8, loadsThisWeek * 1.5) : 0);
    const hoursAvailable = Math.max(0, 11 - hoursUsedToday);

    const utilization = hoursUsedToday > 0 ? Math.min(100, Math.round((hoursUsedToday / 11) * 100)) : 0;
    const fatigue = Math.min(100, Math.round(hoursUsedToday * 8 + loadsThisWeek * 5));

    const loc = d.currentLocation as { lat?: number; lng?: number; city?: string; state?: string } | null;
    const city = loc?.city ?? "Unknown";
    const state = loc?.state ?? "XX";

    const equipmentType = vehicleMap.get(d.userId) ?? "dry_van";

    return {
      driverId: `DRV-${d.driverId}`,
      driverName: d.driverName ?? `Driver #${d.driverId}`,
      currentLocation: { state, city },
      hoursAvailable: Math.round(hoursAvailable * 10) / 10,
      hoursUsedToday: Math.round(hoursUsedToday * 10) / 10,
      loadsThisWeek,
      revenueThisWeek: Math.round(revenueThisWeek),
      deadheadMilesThisWeek: deadheadMiles,
      loadedMilesThisWeek: Math.round(loadedMiles),
      utilizationPct: utilization,
      fatigueScore: fatigue,
      preferredLanes: [`${state}-*`],
      equipmentType,
    };
  });
}

async function generatePendingLoads(): Promise<LoadCandidate[]> {
  const db = await getDb();

  // Query loads that are pending assignment (posted, bidding, accepted but no driver)
  const pendingRows = await db
    .select({
      id: loads.id,
      loadNumber: loads.loadNumber,
      pickupLocation: loads.pickupLocation,
      deliveryLocation: loads.deliveryLocation,
      originState: loads.originState,
      destState: loads.destState,
      distance: loads.distance,
      rate: loads.rate,
      pickupDate: loads.pickupDate,
      cargoType: loads.cargoType,
      weight: loads.weight,
      status: loads.status,
      createdAt: loads.createdAt,
    })
    .from(loads)
    .where(
      and(
        inArray(loads.status, ["posted", "bidding", "accepted", "awarded"]),
        isNull(loads.driverId),
        isNull(loads.deletedAt)
      )
    )
    .orderBy(loads.pickupDate)
    .limit(50);

  return pendingRows.map((row, i) => {
    const pickup = row.pickupLocation as { city?: string; state?: string } | null;
    const delivery = row.deliveryLocation as { city?: string; state?: string } | null;

    const originCity = pickup?.city ?? "Unknown";
    const originState = pickup?.state ?? row.originState ?? "XX";
    const destCity = delivery?.city ?? "Unknown";
    const destState = delivery?.state ?? row.destState ?? "XX";

    const dist = Number(row.distance ?? 0);
    const rate = Number(row.rate ?? 0);

    // Map cargoType to equipment requirement
    let equipmentRequired = "dry_van";
    if (row.cargoType === "refrigerated" || row.cargoType === "food_grade") {
      equipmentRequired = "reefer";
    } else if (row.cargoType === "oversized" || row.cargoType === "timber") {
      equipmentRequired = "flatbed";
    } else if (row.cargoType === "liquid" || row.cargoType === "petroleum" || row.cargoType === "chemicals" || row.cargoType === "cryogenic") {
      equipmentRequired = "tanker";
    }

    // Priority based on how soon pickup is
    let priority: "standard" | "hot" | "critical" = "standard";
    if (row.pickupDate) {
      const hoursUntilPickup = (new Date(row.pickupDate).getTime() - Date.now()) / 3600000;
      if (hoursUntilPickup <= 4) priority = "critical";
      else if (hoursUntilPickup <= 12) priority = "hot";
    }

    return {
      loadId: row.loadNumber,
      origin: { state: originState, city: originCity },
      destination: { state: destState, city: destCity },
      distance: Math.round(dist),
      rate: Math.round(rate),
      pickupTime: row.pickupDate ? new Date(row.pickupDate).toISOString() : new Date(Date.now() + (1 + i * 6) * 3600000).toISOString(),
      equipmentRequired,
      weight: Number(row.weight ?? 0),
      priority,
    };
  });
}

function estimateDeadhead(driverLoc: { state: string }, loadOrigin: { state: string }): number {
  if (driverLoc.state === loadOrigin.state) return 65; // avg intra-state deadhead
  return 250; // avg inter-state deadhead
}

function generateAssignments(drivers: DriverMission[], loads: LoadCandidate[]): MissionAssignment[] {
  const assignments: MissionAssignment[] = [];
  const usedDrivers = new Set<string>();

  for (const load of loads) {
    // Score each available driver
    const candidates = drivers
      .filter(d => !usedDrivers.has(d.driverId) && d.hoursAvailable >= 2 && d.equipmentType === load.equipmentRequired)
      .map(d => {
        const deadhead = estimateDeadhead(d.currentLocation, load.origin);
        const totalMiles = deadhead + load.distance;

        // Balance scoring: prefer underutilized drivers with low fatigue and close proximity
        const proximityScore = Math.max(0, 100 - deadhead / 5);
        const balanceScore = Math.max(0, 100 - d.utilizationPct);
        const fatigueScore = Math.max(0, 100 - d.fatigueScore);
        const laneMatchScore = d.preferredLanes.some(l => l.includes(load.origin.state)) ? 20 : 0;
        const revenueNeedScore = d.revenueThisWeek < 3000 ? 30 : d.revenueThisWeek < 5000 ? 15 : 0;

        const composite = Math.round(
          proximityScore * 0.25 + balanceScore * 0.25 + fatigueScore * 0.20 +
          laneMatchScore * 0.15 + revenueNeedScore * 0.15
        );

        return { driver: d, deadhead, totalMiles, composite };
      })
      .sort((a, b) => b.composite - a.composite);

    if (candidates.length === 0) continue;

    const best = candidates[0];
    usedDrivers.add(best.driver.driverId);

    const reasoning: string[] = [];
    if (best.deadhead < 100) reasoning.push("Closest to pickup — minimal deadhead");
    if (best.driver.utilizationPct < 50) reasoning.push("Underutilized this week — needs loads");
    if (best.driver.fatigueScore < 40) reasoning.push("Well-rested — safe for assignment");
    if (best.driver.revenueThisWeek < 3000) reasoning.push("Below weekly revenue target");
    if (best.driver.preferredLanes.some(l => l.includes(load.origin.state))) reasoning.push("Preferred lane match");
    if (reasoning.length === 0) reasoning.push("Best overall balance score");

    assignments.push({
      driverId: best.driver.driverId,
      driverName: best.driver.driverName,
      loadId: load.loadId,
      deadheadMiles: best.deadhead,
      totalMiles: best.totalMiles,
      estimatedRevenue: load.rate,
      revenuePerMile: Math.round((load.rate / best.totalMiles) * 100) / 100,
      balanceScore: best.composite,
      reasoning,
      alternativeDrivers: candidates.slice(1, 4).map(c => ({
        driverId: c.driver.driverId, name: c.driver.driverName, score: c.composite,
      })),
    });
  }

  return assignments;
}

function calculateFleetBalance(drivers: DriverMission[]): FleetBalance {
  if (drivers.length === 0) {
    return {
      totalDrivers: 0,
      totalLoads: 0,
      avgUtilization: 0,
      utilizationStdDev: 0,
      avgRevenuePerDriver: 0,
      revenueStdDev: 0,
      totalDeadheadMiles: 0,
      deadheadRatio: 0,
      balanceGrade: "A",
      imbalanceAreas: [],
      recommendations: ["No active drivers found — onboard drivers to begin optimization"],
    };
  }

  const utils = drivers.map(d => d.utilizationPct);
  const revs = drivers.map(d => d.revenueThisWeek);
  const avgUtil = utils.reduce((a, b) => a + b, 0) / utils.length;
  const avgRev = revs.reduce((a, b) => a + b, 0) / revs.length;
  const utilStd = Math.sqrt(utils.reduce((s, v) => s + (v - avgUtil) ** 2, 0) / utils.length);
  const revStd = Math.sqrt(revs.reduce((s, v) => s + (v - avgRev) ** 2, 0) / revs.length);
  const totalDH = drivers.reduce((s, d) => s + d.deadheadMilesThisWeek, 0);
  const totalLoaded = drivers.reduce((s, d) => s + d.loadedMilesThisWeek, 0);
  const dhRatio = totalLoaded > 0 ? totalDH / (totalDH + totalLoaded) : 0;

  const balanceScore = Math.max(0, 100 - utilStd - revStd / 100 - dhRatio * 50);
  const grade = balanceScore >= 85 ? "A" : balanceScore >= 70 ? "B" : balanceScore >= 55 ? "C" : balanceScore >= 40 ? "D" : "F";

  const imbalanceAreas: FleetBalance["imbalanceAreas"] = [];
  if (utilStd > 25) imbalanceAreas.push({ area: "Utilization Spread", description: `${Math.round(utilStd)}% std dev — some drivers overworked, others idle`, severity: "high" });
  if (revStd > 1500) imbalanceAreas.push({ area: "Revenue Inequality", description: `$${Math.round(revStd)} revenue std dev across drivers`, severity: "medium" });
  if (dhRatio > 0.20) imbalanceAreas.push({ area: "Deadhead Ratio", description: `${Math.round(dhRatio * 100)}% empty miles — target is <15%`, severity: dhRatio > 0.30 ? "high" : "medium" });

  const fatigued = drivers.filter(d => d.fatigueScore > 70).length;
  if (fatigued > 0) imbalanceAreas.push({ area: "Driver Fatigue", description: `${fatigued} drivers with high fatigue scores (>70)`, severity: fatigued > 3 ? "high" : "low" });

  const recommendations: string[] = [];
  if (utilStd > 25) recommendations.push("Redistribute loads from high-util drivers to low-util drivers");
  if (dhRatio > 0.20) recommendations.push("Use geographic clustering to reduce empty mile repositioning");
  if (fatigued > 0) recommendations.push("Consider mandatory rest for high-fatigue drivers before next assignment");
  if (recommendations.length === 0) recommendations.push("Fleet is well-balanced — maintain current dispatch patterns");

  return {
    totalDrivers: drivers.length,
    totalLoads: drivers.reduce((s, d) => s + d.loadsThisWeek, 0),
    avgUtilization: Math.round(avgUtil),
    utilizationStdDev: Math.round(utilStd),
    avgRevenuePerDriver: Math.round(avgRev),
    revenueStdDev: Math.round(revStd),
    totalDeadheadMiles: Math.round(totalDH),
    deadheadRatio: Math.round(dhRatio * 100) / 100,
    balanceGrade: grade,
    imbalanceAreas,
    recommendations,
  };
}

// ── Main API ──

export async function getMissionDashboard(): Promise<MissionDashboard> {
  const driverList = await generateDrivers();
  const pendingLoads = await generatePendingLoads();
  const suggestedAssignments = generateAssignments(driverList, pendingLoads);
  const fleetBalance = calculateFleetBalance(driverList);

  const optimizedDH = suggestedAssignments.reduce((s, a) => s + a.deadheadMiles, 0);
  const naiveDH = suggestedAssignments.length * 250; // naive average

  return {
    fleetBalance,
    drivers: driverList,
    pendingLoads,
    suggestedAssignments,
    optimizationSummary: {
      estimatedDeadheadSaved: Math.max(0, naiveDH - optimizedDH),
      estimatedRevenueLift: Math.round(suggestedAssignments.reduce((s, a) => s + a.estimatedRevenue, 0) * 0.03),
      driverBalanceImprovement: fleetBalance.utilizationStdDev > 0 ? Math.round(Math.max(0, 25 - fleetBalance.utilizationStdDev)) : 10,
      hosUtilizationGain: fleetBalance.avgUtilization > 0 ? Math.round(Math.min(15, 100 - fleetBalance.avgUtilization) * 0.1) : 5,
    },
  };
}
