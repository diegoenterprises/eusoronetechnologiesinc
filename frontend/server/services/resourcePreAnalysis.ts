/**
 * RESOURCE PRE-ANALYSIS ENGINE — WS-QP-002
 * Adapted from QPilotOS OSServerManager resource estimation
 *
 * Analyzes a load's requirements against company resources BEFORE
 * it enters the dispatch queue. Produces a feasibility verdict with
 * specific gap analysis.
 */

import { eq, and, sql } from "drizzle-orm";
import { drivers, loads, users, resourcePreanalysis, resourceCapacitySnapshot } from "../../drizzle/schema";

interface LoadRequirements {
  hazmatEndorsement: boolean;
  hazmatClass: string | null;
  twicRequired: boolean;
  minHosMinutes: number;
  equipmentType: string;
  escortRequired: boolean;
  specialPermits: string[];
  oversize: boolean;
  minSafetyScore: number;
}

interface ResourceVerdict {
  verdict: "can_dispatch" | "partial_match" | "cannot_dispatch";
  verdictReason: string;
  requiredResources: LoadRequirements;
  availableResources: {
    matchingDriverCount: number;
    totalAvailableDrivers: number;
    hazmatDriversAvailable: number;
    twicDriversAvailable: number;
    equipmentAvailable: boolean;
    escortsAvailable: number;
    permitsValid: boolean;
  };
  gapAnalysis: {
    missingCapabilities: string[];
    suggestions: string[];
    estimatedReadyTime: string | null;
  };
  matchedDriverIds: number[];
}

export function extractLoadRequirements(load: any): LoadRequirements {
  const distance = Number(load.distance) || 200;
  const transitMinutes = Math.round((distance / 45) * 60) + 60;
  let permits: string[] = [];
  try { permits = load.requiredPermits ? JSON.parse(load.requiredPermits) : []; } catch {}

  return {
    hazmatEndorsement: !!load.hazmatClass,
    hazmatClass: load.hazmatClass || null,
    twicRequired: !!load.requiresTwic || !!load.terminalPickup,
    minHosMinutes: transitMinutes,
    equipmentType: load.equipmentType || "flatbed",
    escortRequired: !!load.escortRequired || load.cargoType === "oversize",
    specialPermits: permits,
    oversize: load.cargoType === "oversize",
    minSafetyScore: load.hazmatClass ? 75 : 50,
  };
}

export async function analyzeLoadFeasibility(
  db: any,
  loadId: number,
  companyId: number
): Promise<ResourceVerdict> {
  const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
  if (!load) throw new Error("Load not found");

  const requirements = extractLoadRequirements(load);

  // Get available drivers matching constraints
  const availableDrivers = await db.select()
    .from(drivers)
    .where(and(
      eq(drivers.companyId, companyId),
      sql`${drivers.status} IN ('available', 'active', 'off_duty')`
    ));

  // Get HOS data
  let hosMap: Record<number, number> = {};
  try {
    const [hosRows]: any = await db.execute(
      sql`SELECT driverId, hosDrivingRemaining FROM driver_availability WHERE companyId = ${companyId}`
    );
    if (Array.isArray(hosRows)) {
      for (const r of hosRows) hosMap[r.driverId] = r.hosDrivingRemaining ?? 660;
    }
  } catch {}

  // Filter drivers by ALL constraints
  const matchedDrivers = availableDrivers.filter((d: any) => {
    if (requirements.hazmatEndorsement && !d.hazmatEndorsement) return false;
    if (requirements.twicRequired && !d.twicExpiry) return false;
    if ((hosMap[d.id] ?? 660) < requirements.minHosMinutes) return false;
    if ((d.safetyScore ?? 100) < requirements.minSafetyScore) return false;
    return true;
  });

  // Build gap analysis
  const missingCapabilities: string[] = [];
  const suggestions: string[] = [];

  const hazmatDrivers = availableDrivers.filter((d: any) => d.hazmatEndorsement);
  const twicDrivers = availableDrivers.filter((d: any) => !!d.twicExpiry);

  if (requirements.hazmatEndorsement && hazmatDrivers.length === 0) {
    missingCapabilities.push("No hazmat-endorsed drivers available");
    suggestions.push("Recruit or certify drivers with hazmat endorsement");
  }
  if (requirements.twicRequired && twicDrivers.length === 0) {
    missingCapabilities.push("No TWIC card holders available");
    suggestions.push("Ensure driver TWIC cards are current");
  }
  if (matchedDrivers.length === 0 && availableDrivers.length > 0) {
    const hosShort = availableDrivers.filter((d: any) =>
      (hosMap[d.id] ?? 660) < requirements.minHosMinutes
    );
    if (hosShort.length > 0) {
      missingCapabilities.push(`${hosShort.length} drivers have insufficient HOS`);
      suggestions.push("Consider splitting load or waiting for HOS reset");
    }
  }
  if (requirements.escortRequired) {
    missingCapabilities.push("Escort vehicle required for oversize load");
    suggestions.push("Coordinate with escort services before dispatch");
  }

  // Determine verdict
  let verdict: "can_dispatch" | "partial_match" | "cannot_dispatch";
  let verdictReason: string;

  if (matchedDrivers.length >= 3) {
    verdict = "can_dispatch";
    verdictReason = `${matchedDrivers.length} qualified drivers available`;
  } else if (matchedDrivers.length >= 1) {
    verdict = "partial_match";
    verdictReason = `Only ${matchedDrivers.length} driver(s) match all constraints`;
  } else {
    verdict = "cannot_dispatch";
    verdictReason = missingCapabilities.join("; ") || "No matching drivers available";
  }

  return {
    verdict,
    verdictReason,
    requiredResources: requirements,
    availableResources: {
      matchingDriverCount: matchedDrivers.length,
      totalAvailableDrivers: availableDrivers.length,
      hazmatDriversAvailable: hazmatDrivers.length,
      twicDriversAvailable: twicDrivers.length,
      equipmentAvailable: true,
      escortsAvailable: 0,
      permitsValid: true,
    },
    gapAnalysis: {
      missingCapabilities,
      suggestions,
      estimatedReadyTime: null,
    },
    matchedDriverIds: matchedDrivers.map((d: any) => d.id),
  };
}

export async function captureResourceSnapshot(db: any, companyId: number): Promise<void> {
  const allDrivers = await db.select().from(drivers).where(eq(drivers.companyId, companyId));
  const available = allDrivers.filter((d: any) => ["available", "active", "off_duty"].includes(d.status));
  const hazmat = available.filter((d: any) => d.hazmatEndorsement);
  const twic = available.filter((d: any) => !!d.twicExpiry);

  await db.insert(resourceCapacitySnapshot).values({
    companyId,
    totalDrivers: allDrivers.length,
    availableDrivers: available.length,
    hazmatEndorsedDrivers: hazmat.length,
    twicCardDrivers: twic.length,
    avgHosRemaining: "0",
    equipmentCounts: JSON.stringify({}),
    activePermits: JSON.stringify({}),
    escortAvailable: 0,
  });
}

export async function storeVerdict(db: any, loadId: number, companyId: number, verdict: ResourceVerdict): Promise<void> {
  await db.insert(resourcePreanalysis).values({
    loadId,
    companyId,
    verdict: verdict.verdict,
    verdictReason: verdict.verdictReason,
    requiredResources: JSON.stringify(verdict.requiredResources),
    availableResources: JSON.stringify(verdict.availableResources),
    gapAnalysis: JSON.stringify(verdict.gapAnalysis),
    matchedDriverIds: JSON.stringify(verdict.matchedDriverIds),
    expiresAt: new Date(Date.now() + 30 * 60000),
  }).onDuplicateKeyUpdate({
    set: {
      verdict: verdict.verdict,
      verdictReason: verdict.verdictReason,
      requiredResources: JSON.stringify(verdict.requiredResources),
      availableResources: JSON.stringify(verdict.availableResources),
      gapAnalysis: JSON.stringify(verdict.gapAnalysis),
      matchedDriverIds: JSON.stringify(verdict.matchedDriverIds),
      analyzedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60000),
    },
  });
}
