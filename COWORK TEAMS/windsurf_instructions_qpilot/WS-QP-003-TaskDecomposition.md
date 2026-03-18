# WS-QP-003: Task Decomposition Pipeline

## Origin
Reverse-engineered from QPilotOS v3.3 ComputerServer Module (Section 3.3.2). QPilotOS decomposes complex quantum tasks into sub-tasks that run in parallel or sequentially, then aggregates results. Adapted to freight: decompose load lifecycle into independent sub-tasks for parallel processing.

## Concept
Currently, EusoTrip's load lifecycle is a monolithic sequence: create → validate → quote → bid → assign → track → deliver → settle. Each step blocks the next. The Task Decomposition Pipeline breaks this into independent sub-tasks that execute in parallel where possible, then aggregate into a unified result.

**QPilotOS Pattern:**
1. Task Pre-processing (parse, validate, standardize)
2. Sub-task Expansion (decompose into parallelizable units)
3. Sub-task Execution (dispatch to appropriate compute backend)
4. Result Aggregation (combine, weight, normalize)

## What Exists Today
- Load creation wizard runs validations sequentially
- Rate prediction, ETA estimation, carrier matching each require separate API calls
- ESANG AI calls mlEngine functions one at a time
- No parallel execution of independent analysis tasks
- `autoSuggest` in dispatchPlanner.ts does a single-pass score

## What to Build

### Step 1: Database Migration
Create migration `frontend/drizzle/0023_task_decomposition.sql`:

```sql
CREATE TABLE IF NOT EXISTS load_analysis_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loadId INT NOT NULL,
  companyId INT NOT NULL,
  parentTaskId INT DEFAULT NULL,
  taskType ENUM('hazmat_validation','rate_prediction','eta_estimation',
    'carrier_matching','route_optimization','compliance_check',
    'equipment_validation','permit_check','escort_check','insurance_check',
    'aggregation') NOT NULL,
  status ENUM('pending','running','completed','failed','skipped') NOT NULL DEFAULT 'pending',
  priority INT NOT NULL DEFAULT 5,
  inputData JSON DEFAULT NULL,
  outputData JSON DEFAULT NULL,
  startedAt DATETIME DEFAULT NULL,
  completedAt DATETIME DEFAULT NULL,
  durationMs INT DEFAULT NULL,
  errorMessage TEXT DEFAULT NULL,
  KEY idx_load_status (loadId, status),
  KEY idx_parent (parentTaskId),
  KEY idx_type_status (taskType, status)
);

CREATE TABLE IF NOT EXISTS load_analysis_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loadId INT NOT NULL,
  companyId INT NOT NULL,
  aggregatedAt DATETIME NOT NULL DEFAULT NOW(),
  overallScore DECIMAL(5,2) NOT NULL DEFAULT 0,
  rateEstimate DECIMAL(10,2) DEFAULT NULL,
  etaMinutes INT DEFAULT NULL,
  topCarriers JSON DEFAULT NULL,
  complianceStatus ENUM('pass','warn','fail') NOT NULL DEFAULT 'pass',
  complianceIssues JSON DEFAULT NULL,
  routeRecommendation JSON DEFAULT NULL,
  resourceVerdict VARCHAR(20) DEFAULT NULL,
  fullReport JSON NOT NULL,
  UNIQUE KEY uq_load (loadId),
  KEY idx_company (companyId)
);
```

### Step 2: Task Decomposition Service
Create `frontend/server/services/taskDecomposition.ts`:

```typescript
/**
 * TASK DECOMPOSITION PIPELINE — WS-QP-003
 * Adapted from QPilotOS ComputerServer sub-task expansion
 *
 * Decomposes a load into independent analysis sub-tasks:
 *   - Phase 1 (parallel): hazmat_validation, compliance_check, equipment_validation
 *   - Phase 2 (parallel, depends on Phase 1): rate_prediction, eta_estimation, carrier_matching
 *   - Phase 3 (parallel): route_optimization, permit_check, escort_check, insurance_check
 *   - Phase 4 (sequential): aggregation (combines all results)
 */

interface SubTaskDef {
  taskType: string;
  phase: number;
  dependsOn: string[];
  executor: (load: any, db: any, companyId: number) => Promise<any>;
}

const TASK_GRAPH: SubTaskDef[] = [
  // Phase 1 — No dependencies, run in parallel
  { taskType: "hazmat_validation", phase: 1, dependsOn: [],
    executor: async (load, db, companyId) => {
      if (!load.hazmatClass) return { required: false, status: "skipped" };
      // Validate UN number, packing group, hazmat class, ERG guide
      return { required: true, hazmatClass: load.hazmatClass, unNumber: load.unNumber,
        ergGuide: null, placardRequired: true, status: "validated" };
    }},
  { taskType: "compliance_check", phase: 1, dependsOn: [],
    executor: async (load, db, companyId) => {
      // Check FMCSA operating authority, insurance minimums, CDL requirements
      return { operatingAuthority: "active", insuranceValid: true, cdlRequired: true };
    }},
  { taskType: "equipment_validation", phase: 1, dependsOn: [],
    executor: async (load, db, companyId) => {
      // Verify equipment type availability
      return { equipmentType: load.equipmentType, available: true, count: 0 };
    }},

  // Phase 2 — Depends on Phase 1 passing
  { taskType: "rate_prediction", phase: 2, dependsOn: ["compliance_check"],
    executor: async (load, db, companyId) => {
      const { mlEngine } = await import("./mlEngine");
      if (!mlEngine.isReady()) return { predicted: false };
      const pred = mlEngine.predictRate({
        originState: load.originState, destState: load.destinationState,
        distance: Number(load.distance), cargoType: load.cargoType
      });
      return pred;
    }},
  { taskType: "eta_estimation", phase: 2, dependsOn: ["compliance_check"],
    executor: async (load, db, companyId) => {
      const { mlEngine } = await import("./mlEngine");
      if (!mlEngine.isReady()) return { predicted: false };
      return mlEngine.predictETA({
        originState: load.originState, destState: load.destinationState,
        distance: Number(load.distance), equipmentType: load.equipmentType,
        cargoType: load.cargoType
      });
    }},
  { taskType: "carrier_matching", phase: 2, dependsOn: ["hazmat_validation", "equipment_validation"],
    executor: async (load, db, companyId) => {
      const { mlEngine } = await import("./mlEngine");
      if (!mlEngine.isReady()) return { matched: false };
      return mlEngine.matchCarriers({
        originState: load.originState, destState: load.destinationState,
        cargoType: load.cargoType, weight: Number(load.weight)
      });
    }},

  // Phase 3 — Depends on Phase 2
  { taskType: "route_optimization", phase: 3, dependsOn: ["eta_estimation"],
    executor: async (load, db, companyId) => {
      // Call routeIntelligence or OSRM for optimal route
      return { optimized: true, avoidZones: [], estimatedMiles: Number(load.distance) };
    }},
  { taskType: "permit_check", phase: 3, dependsOn: ["hazmat_validation"],
    executor: async (load, db, companyId) => {
      return { permitsRequired: [], allValid: true };
    }},
  { taskType: "escort_check", phase: 3, dependsOn: ["hazmat_validation"],
    executor: async (load, db, companyId) => {
      return { escortRequired: load.cargoType === "oversize", available: 0 };
    }},

  // Phase 4 — Aggregation
  { taskType: "aggregation", phase: 4, dependsOn: ["rate_prediction", "eta_estimation",
    "carrier_matching", "route_optimization", "permit_check", "escort_check"],
    executor: async (load, db, companyId) => {
      // Combine all sub-task results into final analysis
      return { aggregated: true };
    }},
];

export async function decomposeAndExecute(
  db: any, loadId: number, companyId: number
): Promise<any> {
  const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
  if (!load) throw new Error("Load not found");

  // Create all sub-task records
  const taskRecords: Record<string, { id: number; status: string; result: any }> = {};
  for (const def of TASK_GRAPH) {
    const [inserted] = await db.insert(loadAnalysisTasks).values({
      loadId, companyId, taskType: def.taskType, status: "pending",
      priority: def.phase, inputData: JSON.stringify({ loadId }),
    });
    taskRecords[def.taskType] = { id: inserted.insertId, status: "pending", result: null };
  }

  // Execute phases sequentially, tasks within each phase in parallel
  for (const phase of [1, 2, 3, 4]) {
    const phaseTasks = TASK_GRAPH.filter(t => t.phase === phase);
    await Promise.all(phaseTasks.map(async (taskDef) => {
      // Check dependencies
      const depsFailed = taskDef.dependsOn.some(dep =>
        taskRecords[dep]?.status === "failed"
      );
      if (depsFailed) {
        taskRecords[taskDef.taskType].status = "skipped";
        return;
      }

      const startTime = Date.now();
      try {
        const result = await taskDef.executor(load, db, companyId);
        taskRecords[taskDef.taskType] = { ...taskRecords[taskDef.taskType], status: "completed", result };
        await db.update(loadAnalysisTasks)
          .set({ status: "completed", outputData: JSON.stringify(result),
            completedAt: new Date(), durationMs: Date.now() - startTime })
          .where(eq(loadAnalysisTasks.id, taskRecords[taskDef.taskType].id));
      } catch (err: any) {
        taskRecords[taskDef.taskType].status = "failed";
        await db.update(loadAnalysisTasks)
          .set({ status: "failed", errorMessage: err.message,
            completedAt: new Date(), durationMs: Date.now() - startTime })
          .where(eq(loadAnalysisTasks.id, taskRecords[taskDef.taskType].id));
      }
    }));
  }

  // Save aggregated result
  const fullReport = Object.fromEntries(
    Object.entries(taskRecords).map(([k, v]) => [k, v.result])
  );
  await db.insert(loadAnalysisResults).values({
    loadId, companyId, overallScore: "85.00",
    rateEstimate: taskRecords.rate_prediction?.result?.predictedRate || null,
    etaMinutes: taskRecords.eta_estimation?.result?.etaMinutes || null,
    complianceStatus: taskRecords.compliance_check?.status === "completed" ? "pass" : "fail",
    fullReport: JSON.stringify(fullReport),
  });

  return fullReport;
}
```

### Step 3: Router
Create `frontend/server/routers/taskDecomposition.ts`:

```typescript
export const taskDecompositionRouter = router({
  analyzeLoad: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .mutation(/* triggers decomposeAndExecute */),

  getAnalysisStatus: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(/* returns all sub-tasks with status, duration, results */),

  getAnalysisResult: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(/* returns aggregated result from load_analysis_results */),
});
```

### Step 4: WebSocket Events
```typescript
LOAD_ANALYSIS_STARTED: "load:analysis:started",
LOAD_SUBTASK_COMPLETED: "load:subtask:completed",
LOAD_ANALYSIS_COMPLETED: "load:analysis:completed",
LOAD_ANALYSIS_FAILED: "load:analysis:failed",
```

### Step 5: Frontend
- Show a real-time progress indicator when analysis runs (each sub-task lights up green as it completes)
- Display aggregated analysis result card on load detail page
- Show timing breakdown (which sub-tasks took longest)

## Registration
- Import in `frontend/server/routers.ts`
- Register on appRouter
- Guard: DISPATCH, SHIPPER, BROKER, ADMIN, SUPER_ADMIN

## Testing
1. Create a standard load → all 10 sub-tasks complete in < 2 seconds
2. Create a hazmat load → hazmat_validation runs, escort_check triggers
3. Simulate mlEngine offline → rate_prediction and eta_estimation return fallbacks
4. Verify Phase 2 waits for Phase 1 completion before starting
5. Verify Phase 4 aggregation combines all results correctly
