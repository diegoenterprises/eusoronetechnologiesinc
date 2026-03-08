/**
 * MAINTENANCE ANALYTICS SERVICE (GAP-101)
 * Predictive maintenance analysis — aggregates vehicle maintenance history,
 * calculates component-level failure probability, and returns predicted
 * failure dates/mileages for: engine, transmission, brakes, suspension, electrical.
 */

import { eq, and, desc, sql, gte, lte, inArray } from "drizzle-orm";
import { getDb } from "../db";
import { vehicles, zeunMaintenanceSchedules, zeunBreakdownReports } from "../../drizzle/schema";

// ── Types ────────────────────────────────────────────────────────────────────

export type MaintenanceComponent = "engine" | "transmission" | "brakes" | "suspension" | "electrical";

export interface PredictedMaintenance {
  component: MaintenanceComponent;
  lastServiceDate: string | null;
  lastServiceMileage: number;
  averageIntervalMiles: number;
  averageIntervalDays: number;
  currentMileage: number;
  predictedFailureDate: string;
  predictedFailureMileage: number;
  confidenceScore: number; // 0-1 based on sample size
  riskLevel: "critical" | "high" | "medium" | "low";
  sampleCount: number;
}

export interface VehiclePredictionSummary {
  vehicleId: number;
  vehicleUnit: string;
  make: string;
  model: string;
  year: number;
  currentMileage: number;
  predictions: PredictedMaintenance[];
  overallRisk: "critical" | "high" | "medium" | "low";
}

// ── Component Classification ─────────────────────────────────────────────────

const COMPONENT_KEYWORDS: Record<MaintenanceComponent, string[]> = {
  engine: ["engine", "oil", "coolant", "radiator", "turbo", "fuel_filter", "fuel_system", "exhaust", "dpf", "def", "egr", "air_filter"],
  transmission: ["transmission", "clutch", "gear", "driveline", "differential", "u-joint", "pto", "torque_converter"],
  brakes: ["brake", "rotor", "pad", "drum", "caliper", "abs", "air_brake", "slack_adjuster"],
  suspension: ["suspension", "shock", "spring", "airbag", "kingpin", "axle", "wheel_bearing", "alignment", "steering"],
  electrical: ["electrical", "battery", "alternator", "starter", "wiring", "fuse", "light", "sensor", "ecu", "eld"],
};

// Default interval assumptions when no history exists
const DEFAULT_INTERVALS: Record<MaintenanceComponent, { miles: number; days: number }> = {
  engine: { miles: 25000, days: 180 },
  transmission: { miles: 60000, days: 365 },
  brakes: { miles: 30000, days: 210 },
  suspension: { miles: 50000, days: 300 },
  electrical: { miles: 40000, days: 270 },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function classifyComponent(serviceType: string): MaintenanceComponent | null {
  const normalized = serviceType.toLowerCase().replace(/[-\s]/g, "_");
  for (const [component, keywords] of Object.entries(COMPONENT_KEYWORDS)) {
    if (keywords.some((kw) => normalized.includes(kw))) {
      return component as MaintenanceComponent;
    }
  }
  return null;
}

function calculateConfidence(sampleCount: number): number {
  // Confidence ramps from 0.3 (1 sample) to 0.95 (10+ samples)
  if (sampleCount <= 0) return 0.2;
  if (sampleCount >= 10) return 0.95;
  return Math.min(0.95, 0.3 + (sampleCount - 1) * 0.072);
}

function determineRiskLevel(
  milesRemaining: number,
  daysRemaining: number
): "critical" | "high" | "medium" | "low" {
  if (milesRemaining <= 500 || daysRemaining <= 7) return "critical";
  if (milesRemaining <= 1000 || daysRemaining <= 14) return "high";
  if (milesRemaining <= 2000 || daysRemaining <= 30) return "medium";
  return "low";
}

// ── Core Analytics ───────────────────────────────────────────────────────────

/**
 * Aggregate maintenance history for a single vehicle and compute
 * component-level failure predictions.
 */
export async function getVehiclePredictions(
  vehicleId: number
): Promise<VehiclePredictionSummary | null> {
  const db = await getDb();
  if (!db) return null;

  // Fetch vehicle
  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.id, vehicleId))
    .limit(1);

  if (!vehicle) return null;

  const currentMileage = vehicle.mileage || 0;
  const now = new Date();

  // Fetch all maintenance schedule records for this vehicle
  const scheduleRecords = await db
    .select()
    .from(zeunMaintenanceSchedules)
    .where(eq(zeunMaintenanceSchedules.vehicleId, vehicleId))
    .orderBy(desc(zeunMaintenanceSchedules.lastServiceDate));

  // Fetch breakdown history for this vehicle
  let breakdownRecords: any[] = [];
  try {
    breakdownRecords = await db
      .select({
        issueCategory: zeunBreakdownReports.issueCategory,
        createdAt: zeunBreakdownReports.createdAt,
        status: zeunBreakdownReports.status,
      })
      .from(zeunBreakdownReports)
      .where(eq(zeunBreakdownReports.vehicleId, vehicleId))
      .orderBy(desc(zeunBreakdownReports.createdAt));
  } catch {
    // Table may not exist or vehicleId column may differ
  }

  // Group service history by component
  const componentHistory: Record<MaintenanceComponent, Array<{
    serviceDate: Date | null;
    odometer: number;
  }>> = {
    engine: [],
    transmission: [],
    brakes: [],
    suspension: [],
    electrical: [],
  };

  for (const rec of scheduleRecords) {
    const comp = classifyComponent(rec.serviceType);
    if (comp && rec.lastServiceDate) {
      componentHistory[comp].push({
        serviceDate: rec.lastServiceDate,
        odometer: rec.lastServiceOdometer || 0,
      });
    }
  }

  // Also add breakdown history
  for (const bk of breakdownRecords) {
    if (bk.status === "RESOLVED") {
      const comp = classifyComponent(bk.issueCategory || "");
      if (comp && bk.createdAt) {
        componentHistory[comp].push({
          serviceDate: bk.createdAt,
          odometer: 0, // breakdowns don't have odometer in schema
        });
      }
    }
  }

  // Calculate predictions per component
  const predictions: PredictedMaintenance[] = [];

  for (const component of Object.keys(componentHistory) as MaintenanceComponent[]) {
    const history = componentHistory[component].sort(
      (a, b) => (a.serviceDate?.getTime() || 0) - (b.serviceDate?.getTime() || 0)
    );

    const sampleCount = history.length;
    let avgIntervalMiles = DEFAULT_INTERVALS[component].miles;
    let avgIntervalDays = DEFAULT_INTERVALS[component].days;
    let lastServiceDate: string | null = null;
    let lastServiceMileage = 0;

    if (sampleCount >= 2) {
      // Calculate intervals between services
      const mileIntervals: number[] = [];
      const dayIntervals: number[] = [];

      for (let i = 1; i < history.length; i++) {
        const prev = history[i - 1];
        const curr = history[i];

        if (curr.odometer > 0 && prev.odometer > 0) {
          mileIntervals.push(curr.odometer - prev.odometer);
        }
        if (curr.serviceDate && prev.serviceDate) {
          const days = Math.round(
            (curr.serviceDate.getTime() - prev.serviceDate.getTime()) / 86400000
          );
          if (days > 0) dayIntervals.push(days);
        }
      }

      if (mileIntervals.length > 0) {
        avgIntervalMiles = Math.round(
          mileIntervals.reduce((a, b) => a + b, 0) / mileIntervals.length
        );
      }
      if (dayIntervals.length > 0) {
        avgIntervalDays = Math.round(
          dayIntervals.reduce((a, b) => a + b, 0) / dayIntervals.length
        );
      }
    }

    // Use most recent service as baseline
    if (sampleCount > 0) {
      const last = history[history.length - 1];
      lastServiceDate = last.serviceDate?.toISOString() || null;
      lastServiceMileage = last.odometer || 0;
    }

    // Predict failure mileage & date
    const predictedFailureMileage = lastServiceMileage > 0
      ? lastServiceMileage + avgIntervalMiles
      : currentMileage + avgIntervalMiles;

    const baseDate = lastServiceDate ? new Date(lastServiceDate) : now;
    const predictedFailureDate = new Date(
      baseDate.getTime() + avgIntervalDays * 86400000
    );

    const milesRemaining = predictedFailureMileage - currentMileage;
    const daysRemaining = Math.round(
      (predictedFailureDate.getTime() - now.getTime()) / 86400000
    );

    predictions.push({
      component,
      lastServiceDate,
      lastServiceMileage,
      averageIntervalMiles: avgIntervalMiles,
      averageIntervalDays: avgIntervalDays,
      currentMileage,
      predictedFailureDate: predictedFailureDate.toISOString(),
      predictedFailureMileage,
      confidenceScore: calculateConfidence(sampleCount),
      riskLevel: determineRiskLevel(milesRemaining, daysRemaining),
      sampleCount,
    });
  }

  // Overall risk = worst component risk
  const riskOrder: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 };
  const overallRisk = predictions.reduce(
    (worst, p) => (riskOrder[p.riskLevel] > riskOrder[worst] ? p.riskLevel : worst),
    "low" as "critical" | "high" | "medium" | "low"
  );

  return {
    vehicleId: vehicle.id,
    vehicleUnit: vehicle.licensePlate || `V-${vehicle.id}`,
    make: vehicle.make || "Unknown",
    model: vehicle.model || "Unknown",
    year: vehicle.year || 0,
    currentMileage,
    predictions,
    overallRisk,
  };
}

/**
 * Get predictions for all vehicles in a fleet (company).
 */
export async function getFleetPredictions(
  companyId: number,
  options?: { riskFilter?: string; limit?: number }
): Promise<VehiclePredictionSummary[]> {
  const db = await getDb();
  if (!db) return [];

  const limit = options?.limit || 100;

  const companyVehicles = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true)))
    .limit(limit);

  const results: VehiclePredictionSummary[] = [];

  for (const v of companyVehicles) {
    const prediction = await getVehiclePredictions(v.id);
    if (prediction) {
      if (options?.riskFilter && options.riskFilter !== "all") {
        if (prediction.overallRisk !== options.riskFilter) continue;
      }
      results.push(prediction);
    }
  }

  // Sort by risk level descending
  const riskOrder: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 };
  results.sort((a, b) => riskOrder[b.overallRisk] - riskOrder[a.overallRisk]);

  return results;
}

/**
 * Get fleet-wide maintenance summary statistics.
 */
export async function getFleetMaintenanceSummary(companyId: number) {
  const predictions = await getFleetPredictions(companyId);

  const criticalCount = predictions.filter((v) => v.overallRisk === "critical").length;
  const highCount = predictions.filter((v) => v.overallRisk === "high").length;
  const mediumCount = predictions.filter((v) => v.overallRisk === "medium").length;
  const lowCount = predictions.filter((v) => v.overallRisk === "low").length;

  // Component-level aggregation
  const componentRisks: Record<MaintenanceComponent, { critical: number; high: number; medium: number; low: number }> = {
    engine: { critical: 0, high: 0, medium: 0, low: 0 },
    transmission: { critical: 0, high: 0, medium: 0, low: 0 },
    brakes: { critical: 0, high: 0, medium: 0, low: 0 },
    suspension: { critical: 0, high: 0, medium: 0, low: 0 },
    electrical: { critical: 0, high: 0, medium: 0, low: 0 },
  };

  for (const v of predictions) {
    for (const p of v.predictions) {
      componentRisks[p.component][p.riskLevel]++;
    }
  }

  return {
    totalVehicles: predictions.length,
    riskBreakdown: { critical: criticalCount, high: highCount, medium: mediumCount, low: lowCount },
    componentRisks,
    vehiclesNeedingAttention: criticalCount + highCount,
    fleetHealthScore: predictions.length > 0
      ? Math.round(((mediumCount + lowCount) / predictions.length) * 100)
      : 100,
  };
}
