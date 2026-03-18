# WS-QP-006: Multi-Pass Optimization Pipeline

## Origin
Reverse-engineered from QPilotOS v3.3 QCompileServer Module (Section 3.3.5). QPilotOS takes an abstract quantum circuit and runs it through multiple optimization passes: multi-control gate decomposition, gate set conversion, circuit optimization, and qubit mapping/topology routing. Each pass transforms the input incrementally for the target hardware. Adapted to freight: take an abstract load request and run it through multiple optimization passes for the specific lane, carrier, equipment, and regulatory constraints.

## Concept
Currently, EusoTrip optimizes loads in a single pass — `autoSuggest` scores drivers once and returns results. The Multi-Pass Optimization Pipeline runs the load through sequential optimization stages, where each pass refines the previous output:

**Pass 1: Constraint Decomposition** — Break complex requirements into atomic constraints
**Pass 2: Lane Optimization** — Match against historical lane performance data
**Pass 3: Carrier Scoring** — Multi-factor carrier/driver scoring with weighted criteria
**Pass 4: Rate Optimization** — Optimize rate against market data and contract rates
**Pass 5: Schedule Optimization** — Optimize pickup/delivery windows for efficiency
**Pass 6: Compliance Verification** — Final regulatory compliance pass

Each pass produces an intermediate result that the next pass consumes. The final output is a fully optimized dispatch recommendation.

## What Exists Today
- `autoSuggest` in `dispatchPlanner.ts` — single-pass scoring (HOS, hazmat, safety, experience)
- `mlEngine.predictRate()` — isolated rate prediction
- `mlEngine.matchCarriers()` — isolated carrier matching
- `mlEngine.predictETA()` — isolated ETA estimation
- `routeIntelligence` service — route calculation
- No pipeline that chains these together iteratively

## What to Build

### Step 1: Database Migration
Create migration `frontend/drizzle/0025_optimization_pipeline.sql`:

```sql
CREATE TABLE IF NOT EXISTS optimization_runs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loadId INT NOT NULL,
  companyId INT NOT NULL,
  triggerType ENUM('auto','manual','re_optimize') NOT NULL DEFAULT 'auto',
  status ENUM('running','completed','failed','cancelled') NOT NULL DEFAULT 'running',
  totalPasses INT NOT NULL DEFAULT 6,
  completedPasses INT NOT NULL DEFAULT 0,
  currentPass VARCHAR(50) DEFAULT NULL,
  startedAt DATETIME NOT NULL DEFAULT NOW(),
  completedAt DATETIME DEFAULT NULL,
  totalDurationMs INT DEFAULT NULL,
  finalScore DECIMAL(5,2) DEFAULT NULL,
  KEY idx_load (loadId),
  KEY idx_company_status (companyId, status)
);

CREATE TABLE IF NOT EXISTS optimization_pass_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  runId INT NOT NULL,
  passNumber INT NOT NULL,
  passName VARCHAR(50) NOT NULL,
  inputSnapshot JSON NOT NULL,
  outputSnapshot JSON NOT NULL,
  improvementDelta DECIMAL(8,4) DEFAULT NULL,
  durationMs INT NOT NULL DEFAULT 0,
  status ENUM('completed','skipped','failed') NOT NULL DEFAULT 'completed',
  notes TEXT DEFAULT NULL,
  KEY idx_run_pass (runId, passNumber)
);

CREATE TABLE IF NOT EXISTS lane_performance_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  originState VARCHAR(2) NOT NULL,
  destState VARCHAR(2) NOT NULL,
  equipmentType VARCHAR(30) NOT NULL DEFAULT 'flatbed',
  avgRate DECIMAL(10,2) DEFAULT NULL,
  avgTransitHours DECIMAL(6,2) DEFAULT NULL,
  avgDetentionMinutes INT DEFAULT NULL,
  onTimePercentage DECIMAL(5,2) DEFAULT NULL,
  volumeLast30Days INT NOT NULL DEFAULT 0,
  topCarrierIds JSON DEFAULT NULL,
  lastUpdated DATETIME NOT NULL DEFAULT NOW(),
  UNIQUE KEY uq_lane (originState, destState, equipmentType),
  KEY idx_volume (volumeLast30Days DESC)
);
```

### Step 2: Optimization Pipeline Service
Create `frontend/server/services/optimizationPipeline.ts`:

```typescript
/**
 * MULTI-PASS OPTIMIZATION PIPELINE — WS-QP-006
 * Adapted from QPilotOS QCompileServer multi-stage optimization
 *
 * 6-pass pipeline transforms a raw load into a fully optimized dispatch recommendation.
 * Each pass refines the previous output — like compiler optimization passes.
 */

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
  execute: async (ctx, db) => {
    const load = ctx.load;
    ctx.constraints = {
      // Atomic constraints decomposed from load requirements
      driverConstraints: {
        hazmatEndorsement: !!load.hazmatClass,
        twicRequired: !!load.requiresTwic,
        minSafetyScore: load.hazmatClass ? 75 : 50,
        minExperience: load.hazmatClass ? 20 : 0, // min total loads
        cdlClass: "A",
      },
      vehicleConstraints: {
        equipmentType: load.equipmentType || "flatbed",
        minPayloadCapacity: Number(load.weight) || 0,
        hazmatPlacard: !!load.hazmatClass,
        oversizePermit: load.cargoType === "oversize",
      },
      routeConstraints: {
        maxMiles: (Number(load.distance) || 200) * 1.15, // 15% buffer
        avoidTunnels: !!load.hazmatClass,
        avoidResidential: !!load.hazmatClass,
        requireEscort: load.cargoType === "oversize",
      },
      timeConstraints: {
        pickupWindow: { earliest: load.pickupDate, latest: null },
        deliveryDeadline: load.deliveryDate,
        maxTransitHours: null, // calculated in Pass 2
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
    // Query historical lane performance
    const [lanes]: any = await db.execute(sql`
      SELECT * FROM lane_performance_cache
      WHERE originState = ${ctx.load.originState}
      AND destState = ${ctx.load.destinationState}
      AND equipmentType = ${ctx.load.equipmentType || 'flatbed'}
      LIMIT 1
    `);

    if (Array.isArray(lanes) && lanes[0]) {
      ctx.laneData = lanes[0];
      ctx.constraints.timeConstraints.maxTransitHours = lanes[0].avgTransitHours * 1.2;
      ctx.rateRange.predicted = Number(lanes[0].avgRate) || ctx.rateRange.predicted;
    }

    return ctx;
  },
};

// PASS 3: Carrier Scoring (multi-factor weighted)
const carrierScoring: OptimizationPass = {
  name: "carrier_scoring",
  passNumber: 3,
  execute: async (ctx, db) => {
    const drivers = ctx.candidateDrivers;
    const weights = {
      hosfit: 0.25,        // HOS sufficient for trip
      hazmatMatch: 0.20,   // Hazmat endorsement match
      safetyScore: 0.15,   // Driver safety rating
      experience: 0.10,    // Total loads completed
      laneExperience: 0.10, // Has done this lane before
      proximity: 0.10,     // Distance to pickup
      availability: 0.10,  // Current status
    };

    ctx.candidateDrivers = drivers.map(d => {
      const scores: Record<string, number> = {};

      // HOS fit (0-100)
      const hosNeeded = ctx.constraints.timeConstraints.maxTransitHours
        ? ctx.constraints.timeConstraints.maxTransitHours * 60 : 480;
      scores.hosfit = (d.hosRemaining >= hosNeeded) ? 100 : (d.hosRemaining / hosNeeded) * 100;

      // Hazmat match
      scores.hazmatMatch = ctx.constraints.driverConstraints.hazmatEndorsement
        ? (d.hazmatEndorsement ? 100 : 0) : 100;

      // Safety score
      scores.safetyScore = Math.min(100, d.safetyScore || 50);

      // Experience
      scores.experience = Math.min(100, (d.totalLoads || 0) * 2);

      // Lane experience (placeholder — extend with actual lane history query)
      scores.laneExperience = 50;

      // Availability
      scores.availability = d.status === "available" ? 100 : d.status === "active" ? 70 : 30;

      // Proximity (placeholder — extend with GPS distance calculation)
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
        if (pred && pred.predictedRate) {
          ctx.rateRange = {
            min: pred.predictedRate * 0.85,
            max: pred.predictedRate * 1.15,
            predicted: pred.predictedRate,
          };
        }
      }
    } catch {}

    // Check Pricebook for contract rates
    const [pbRows]: any = await db.execute(sql`
      SELECT baseRate FROM pricebook_entries
      WHERE originState = ${ctx.load.originState}
      AND destState = ${ctx.load.destinationState}
      AND status = 'active'
      ORDER BY effectiveDate DESC LIMIT 1
    `);
    if (Array.isArray(pbRows) && pbRows[0]) {
      const contractRate = Number(pbRows[0].baseRate);
      if (contractRate > 0) {
        ctx.rateRange.min = Math.min(ctx.rateRange.min, contractRate);
        ctx.rateRange.predicted = contractRate; // prefer contract rate
      }
    }

    return ctx;
  },
};

// PASS 5: Schedule Optimization
const scheduleOptimization: OptimizationPass = {
  name: "schedule_optimization",
  passNumber: 5,
  execute: async (ctx, db) => {
    // Optimize pickup/delivery windows based on driver HOS, traffic patterns, terminal hours
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
  execute: async (ctx, db) => {
    ctx.complianceFlags = [];

    if (ctx.constraints.driverConstraints.hazmatEndorsement) {
      // Verify all recommended drivers have valid hazmat endorsement
      const nonCompliant = ctx.candidateDrivers.slice(0, 5).filter((d: any) => !d.hazmatEndorsement);
      if (nonCompliant.length > 0) {
        ctx.complianceFlags.push(`${nonCompliant.length} top-ranked drivers lack hazmat endorsement`);
      }
    }

    // Verify operating authority is active
    // Verify insurance minimums met
    // Verify route doesn't violate hazmat restrictions

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
  // Initialize context
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
  const runId = runResult.insertId;

  // Execute passes sequentially
  for (const pass of ALL_PASSES) {
    const startTime = Date.now();
    const inputSnapshot = JSON.parse(JSON.stringify({
      candidateCount: ctx.candidateDrivers.length,
      rateRange: ctx.rateRange,
      constraintCount: Object.keys(ctx.constraints).length,
    }));

    try {
      ctx = await pass.execute(ctx, db);

      await db.insert(optimizationPassResults).values({
        runId, passNumber: pass.passNumber, passName: pass.name,
        inputSnapshot: JSON.stringify(inputSnapshot),
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
        inputSnapshot: JSON.stringify(inputSnapshot),
        outputSnapshot: JSON.stringify({}),
        durationMs: Date.now() - startTime,
        status: "failed", notes: err.message,
      });
    }
  }

  // Finalize run
  await db.update(optimizationRuns)
    .set({ status: "completed", completedAt: new Date(),
      totalDurationMs: Date.now() - Date.now(), // calculate properly
      finalScore: ctx.finalScore.toFixed(2) })
    .where(eq(optimizationRuns.id, runId));

  return ctx;
}
```

### Step 3: Lane Performance Cache Updater
Scheduled job (daily) to populate `lane_performance_cache`:

```typescript
export async function updateLaneCache(db: any) {
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
}
```

### Step 4: Router
Create `frontend/server/routers/optimizationPipeline.ts`:
```typescript
export const optimizationPipelineRouter = router({
  optimizeLoad: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .mutation(/* runs full pipeline, returns top 5 drivers + rate + schedule */),

  getRunHistory: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(/* returns all optimization runs for a load */),

  getPassDetails: protectedProcedure
    .input(z.object({ runId: z.number() }))
    .query(/* returns all pass results for a run, with timing and deltas */),

  getLanePerformance: protectedProcedure
    .input(z.object({ originState: z.string(), destState: z.string() }))
    .query(/* returns lane cache data */),
});
```

### Step 5: WebSocket Events
```typescript
OPTIMIZATION_STARTED: "optimization:started",
OPTIMIZATION_PASS_COMPLETED: "optimization:pass:completed",
OPTIMIZATION_COMPLETED: "optimization:completed",
```

### Step 6: Frontend
- **Optimize Button** on load detail page triggers pipeline
- **Pass Progress Indicator**: 6-step progress bar showing each pass completing in real-time
- **Result Card**: Shows top 5 driver recommendations with score breakdowns, rate range, schedule
- **Pass Drill-Down**: Click any pass to see input/output snapshots and timing

## Registration
- Import in `frontend/server/routers.ts`
- Register on appRouter
- Guard: DISPATCH, BROKER, ADMIN, SUPER_ADMIN

## Testing
1. Run pipeline on standard load → 6 passes complete, top drivers ranked
2. Run on hazmat load → constraint decomposition adds hazmat flags, carrier scoring filters non-endorsed
3. Run when Pricebook has contract rate → verify contract rate takes priority
4. Run when mlEngine is offline → rate optimization degrades gracefully
5. Verify lane cache populates from historical loads
6. Verify pass timing is logged and visible in frontend
