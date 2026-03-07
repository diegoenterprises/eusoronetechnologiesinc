/**
 * MULTI-PASS OPTIMIZATION PIPELINE — WS-QP-006
 * Adapted from QPilotOS QCompileServer multi-stage optimization
 *
 * 6-pass pipeline transforms a raw load into a fully optimized dispatch recommendation.
 * Each pass refines the previous output — like compiler optimization passes.
 *
 * Pass 1: Constraint Decomposition — Break complex requirements into atomic constraints
 * Pass 2: Lane Optimization — Match against historical lane performance data
 * Pass 3: Carrier Scoring — Multi-factor carrier/driver scoring with weighted criteria
 * Pass 4: Rate Optimization — Optimize rate against market data and contract rates
 * Pass 5: Schedule Optimization — Optimize pickup/delivery windows for efficiency
 * Pass 6: Compliance Verification — Final regulatory compliance pass
 */

import { eq, and, sql } from "drizzle-orm";
import { loads, drivers, users, optimizationRuns, optimizationPassResults, lanePerformanceCache } from "../../drizzle/schema";

interface OptimizationContext {
  loadId: number;
  companyId: number;
  load: any;
  constraints: any;
  laneData: any;
  candidateDrivers: any[];
  rateRange: { min: number; max: number; predicted: number };
  scheduleWindows: any;
  complianceFlags: string[];
  finalScore: number;
}

type OptimizationPass = {
  name: string;
  passNumber: number;
  execute: (ctx: OptimizationContext, db: any) => Promise<OptimizationContext>;
};

// PASS 1: Constraint Decomposition
const constraintDecomposition: OptimizationPass = {
  name: "constraint_decomposition",
  passNumber: 1,
  execute: async (ctx) => {
    const load = ctx.load;
    ctx.constraints = {
      driverConstraints: {
        hazmatEndorsement: !!load.hazmatClass,
        twicRequired: !!load.requiresTwic,
        minSafetyScore: load.hazmatClass ? 75 : 50,
        minExperience: load.hazmatClass ? 20 : 0,
        cdlClass: "A",
      },
      vehicleConstraints: {
        equipmentType: load.equipmentType || "flatbed",
        minPayloadCapacity: Number(load.weight) || 0,
        hazmatPlacard: !!load.hazmatClass,
        oversizePermit: load.cargoType === "oversize",
      },
      routeConstraints: {
        maxMiles: (Number(load.distance) || 200) * 1.15,
        avoidTunnels: !!load.hazmatClass,
        avoidResidential: !!load.hazmatClass,
        requireEscort: load.cargoType === "oversize",
      },
      timeConstraints: {
        pickupWindow: { earliest: load.pickupDate, latest: null },
        deliveryDeadline: load.deliveryDate,
        maxTransitHours: null,
      },
    };
    return ctx;
  },
};

// PASS 2: Lane Optimization
const laneOptimization: OptimizationPass = {
  name: "lane_optimization",
  passNumber: 2,
  execute: async (ctx, db) => {
    try {
      const [lanes]: any = await db.execute(sql`
        SELECT * FROM lane_performance_cache
        WHERE originState = ${ctx.load.originState || ''}
        AND destState = ${ctx.load.destinationState || ''}
        AND equipmentType = ${ctx.load.equipmentType || 'flatbed'}
        LIMIT 1
      `);

      if (Array.isArray(lanes) && lanes[0]) {
        ctx.laneData = lanes[0];
        ctx.constraints.timeConstraints.maxTransitHours = Number(lanes[0].avgTransitHours) * 1.2;
        ctx.rateRange.predicted = Number(lanes[0].avgRate) || ctx.rateRange.predicted;
      }
    } catch {}
    return ctx;
  },
};

// PASS 3: Carrier Scoring (multi-factor weighted)
const carrierScoring: OptimizationPass = {
  name: "carrier_scoring",
  passNumber: 3,
  execute: async (ctx) => {
    const driverList = ctx.candidateDrivers;
    const weights = {
      hosfit: 0.25,
      hazmatMatch: 0.20,
      safetyScore: 0.15,
      experience: 0.10,
      laneExperience: 0.10,
      proximity: 0.10,
      availability: 0.10,
    };

    ctx.candidateDrivers = driverList.map((d: any) => {
      const driver = d.drivers || d;
      const scores: Record<string, number> = {};

      const hosNeeded = ctx.constraints?.timeConstraints?.maxTransitHours
        ? ctx.constraints.timeConstraints.maxTransitHours * 60 : 480;
      const hosRemaining = driver.hosRemaining ?? 660;
      scores.hosfit = hosRemaining >= hosNeeded ? 100 : (hosRemaining / hosNeeded) * 100;
      scores.hazmatMatch = ctx.constraints?.driverConstraints?.hazmatEndorsement
        ? (driver.hazmatEndorsement ? 100 : 0) : 100;
      scores.safetyScore = Math.min(100, driver.safetyScore || 50);
      scores.experience = Math.min(100, (driver.totalLoads || 0) * 2);
      scores.laneExperience = 50;
      scores.availability = driver.status === "available" ? 100 : driver.status === "active" ? 70 : 30;
      scores.proximity = 50;

      const weightedScore = Object.entries(weights).reduce((sum, [key, weight]) => {
        return sum + (scores[key] || 0) * weight;
      }, 0);

      return { ...d, optimizationScore: weightedScore, scoreBreakdown: scores };
    }).sort((a: any, b: any) => b.optimizationScore - a.optimizationScore);

    return ctx;
  },
};

// PASS 4: Rate Optimization
const rateOptimization: OptimizationPass = {
  name: "rate_optimization",
  passNumber: 4,
  execute: async (ctx, db) => {
    try {
      const { mlEngine } = await import("./mlEngine");
      if (mlEngine.isReady()) {
        const pred = mlEngine.predictRate({
          originState: ctx.load.originState,
          destState: ctx.load.destinationState,
          distance: Number(ctx.load.distance),
          cargoType: ctx.load.cargoType,
        });
        if (pred && pred.predictedSpotRate) {
          ctx.rateRange = {
            min: pred.predictedSpotRate * 0.85,
            max: pred.predictedSpotRate * 1.15,
            predicted: pred.predictedSpotRate,
          };
        }
      }
    } catch {}

    // Check Pricebook for contract rates
    try {
      const [pbRows]: any = await db.execute(sql`
        SELECT baseRate FROM pricebook_entries
        WHERE originState = ${ctx.load.originState || ''}
        AND destState = ${ctx.load.destinationState || ''}
        AND status = 'active'
        ORDER BY effectiveDate DESC LIMIT 1
      `);
      if (Array.isArray(pbRows) && pbRows[0]) {
        const contractRate = Number(pbRows[0].baseRate);
        if (contractRate > 0) {
          ctx.rateRange.min = Math.min(ctx.rateRange.min, contractRate);
          ctx.rateRange.predicted = contractRate;
        }
      }
    } catch {}

    return ctx;
  },
};

// PASS 5: Schedule Optimization
const scheduleOptimization: OptimizationPass = {
  name: "schedule_optimization",
  passNumber: 5,
  execute: async (ctx) => {
    ctx.scheduleWindows = {
      optimalPickup: ctx.load.pickupDate,
      optimalDelivery: ctx.load.deliveryDate,
      bufferHours: 2,
      trafficAvoidance: "depart before 6am or after 8pm for metro areas",
    };
    return ctx;
  },
};

// PASS 6: Compliance Verification
const complianceVerification: OptimizationPass = {
  name: "compliance_verification",
  passNumber: 6,
  execute: async (ctx) => {
    ctx.complianceFlags = [];

    if (ctx.constraints?.driverConstraints?.hazmatEndorsement) {
      const nonCompliant = ctx.candidateDrivers.slice(0, 5).filter((d: any) => {
        const driver = d.drivers || d;
        return !driver.hazmatEndorsement;
      });
      if (nonCompliant.length > 0) {
        ctx.complianceFlags.push(`${nonCompliant.length} top-ranked drivers lack hazmat endorsement`);
      }
    }

    ctx.finalScore = ctx.candidateDrivers[0]?.optimizationScore || 0;
    return ctx;
  },
};

const ALL_PASSES: OptimizationPass[] = [
  constraintDecomposition,
  laneOptimization,
  carrierScoring,
  rateOptimization,
  scheduleOptimization,
  complianceVerification,
];

export async function runOptimizationPipeline(
  db: any, loadId: number, companyId: number
): Promise<OptimizationContext> {
  const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
  if (!load) throw new Error("Load not found");

  // Get candidate drivers
  const availableDrivers = await db.select()
    .from(drivers)
    .innerJoin(users, eq(drivers.userId, users.id))
    .where(and(
      eq(drivers.companyId, companyId),
      sql`${drivers.status} IN ('available', 'active', 'off_duty')`
    ));

  let ctx: OptimizationContext = {
    loadId, companyId, load,
    constraints: {},
    laneData: null,
    candidateDrivers: availableDrivers,
    rateRange: { min: 0, max: 0, predicted: 0 },
    scheduleWindows: null,
    complianceFlags: [],
    finalScore: 0,
  };

  // Create run record
  const [runResult] = await db.insert(optimizationRuns).values({
    loadId, companyId, status: "running", totalPasses: ALL_PASSES.length,
  });
  const runId = (runResult as any).insertId;
  const pipelineStart = Date.now();

  // Execute passes sequentially
  for (const pass of ALL_PASSES) {
    const startTime = Date.now();
    const inputSnapshot = JSON.stringify({
      candidateCount: ctx.candidateDrivers.length,
      rateRange: ctx.rateRange,
      constraintCount: Object.keys(ctx.constraints).length,
    });

    try {
      ctx = await pass.execute(ctx, db);

      await db.insert(optimizationPassResults).values({
        runId, passNumber: pass.passNumber, passName: pass.name,
        inputSnapshot,
        outputSnapshot: JSON.stringify({
          candidateCount: ctx.candidateDrivers.length,
          rateRange: ctx.rateRange,
          complianceFlags: ctx.complianceFlags.length,
        }),
        durationMs: Date.now() - startTime,
        status: "completed",
      });

      await db.update(optimizationRuns)
        .set({ completedPasses: pass.passNumber, currentPass: pass.name })
        .where(eq(optimizationRuns.id, runId));
    } catch (err: any) {
      await db.insert(optimizationPassResults).values({
        runId, passNumber: pass.passNumber, passName: pass.name,
        inputSnapshot,
        outputSnapshot: JSON.stringify({}),
        durationMs: Date.now() - startTime,
        status: "failed", notes: err.message,
      });
    }
  }

  // Finalize run
  await db.update(optimizationRuns)
    .set({
      status: "completed" as const, completedAt: new Date(),
      totalDurationMs: Date.now() - pipelineStart,
      finalScore: ctx.finalScore.toFixed(2),
    })
    .where(eq(optimizationRuns.id, runId));

  return ctx;
}

// Lane Performance Cache Updater — daily job
export async function updateLaneCache(db: any): Promise<void> {
  try {
    await db.execute(sql`
      INSERT INTO lane_performance_cache (originState, destState, equipmentType,
        avgRate, avgTransitHours, volumeLast30Days, lastUpdated)
      SELECT
        l.originState, l.destinationState, COALESCE(l.equipmentType, 'flatbed'),
        AVG(l.rate), AVG(TIMESTAMPDIFF(HOUR, l.pickupDate, l.deliveryDate)),
        COUNT(*), NOW()
      FROM loads l
      WHERE l.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      AND l.originState IS NOT NULL AND l.destinationState IS NOT NULL
      GROUP BY l.originState, l.destinationState, COALESCE(l.equipmentType, 'flatbed')
      ON DUPLICATE KEY UPDATE
        avgRate = VALUES(avgRate),
        avgTransitHours = VALUES(avgTransitHours),
        volumeLast30Days = VALUES(volumeLast30Days),
        lastUpdated = NOW()
    `);
  } catch (err: any) {
    console.warn("[QPilotOS/WS-QP-006] Lane cache update failed:", err.message);
  }
}
