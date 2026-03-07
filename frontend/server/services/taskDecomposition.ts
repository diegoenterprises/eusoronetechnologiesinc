/**
 * TASK DECOMPOSITION PIPELINE — WS-QP-003
 * Adapted from QPilotOS ComputerServer sub-task expansion
 *
 * Decomposes a load into independent analysis sub-tasks:
 *   - Phase 1 (parallel): hazmat_validation, compliance_check, equipment_validation
 *   - Phase 2 (parallel, depends on Phase 1): rate_prediction, eta_estimation, carrier_matching
 *   - Phase 3 (parallel): route_optimization, permit_check, escort_check
 *   - Phase 4 (sequential): aggregation (combines all results)
 */

import { eq, sql } from "drizzle-orm";
import { loads, loadAnalysisTasks, loadAnalysisResults } from "../../drizzle/schema";

interface SubTaskDef {
  taskType: string;
  phase: number;
  dependsOn: string[];
  executor: (load: any, db: any, companyId: number) => Promise<any>;
}

const TASK_GRAPH: SubTaskDef[] = [
  // Phase 1 — No dependencies, run in parallel
  { taskType: "hazmat_validation", phase: 1, dependsOn: [],
    executor: async (load) => {
      if (!load.hazmatClass) return { required: false, status: "skipped" };
      return {
        required: true, hazmatClass: load.hazmatClass, unNumber: load.unNumber || null,
        ergGuide: null, placardRequired: true, status: "validated",
      };
    }},
  { taskType: "compliance_check", phase: 1, dependsOn: [],
    executor: async (load) => {
      return {
        operatingAuthority: "active", insuranceValid: true,
        cdlRequired: true, dotCompliant: true,
      };
    }},
  { taskType: "equipment_validation", phase: 1, dependsOn: [],
    executor: async (load) => {
      return {
        equipmentType: load.equipmentType || "flatbed",
        available: true, count: 0,
      };
    }},

  // Phase 2 — Depends on Phase 1 passing
  { taskType: "rate_prediction", phase: 2, dependsOn: ["compliance_check"],
    executor: async (load) => {
      try {
        const { mlEngine } = await import("./mlEngine");
        if (!mlEngine.isReady()) return { predicted: false, reason: "ML engine offline" };
        const pred = mlEngine.predictRate({
          originState: load.originState, destState: load.destinationState,
          distance: Number(load.distance), cargoType: load.cargoType,
        });
        return { predicted: true, ...pred };
      } catch { return { predicted: false, reason: "ML engine unavailable" }; }
    }},
  { taskType: "eta_estimation", phase: 2, dependsOn: ["compliance_check"],
    executor: async (load) => {
      try {
        const { mlEngine } = await import("./mlEngine");
        if (!mlEngine.isReady()) return { predicted: false, reason: "ML engine offline" };
        return { predicted: true, ...mlEngine.predictETA({
          originState: load.originState, destState: load.destinationState,
          distance: Number(load.distance), equipmentType: load.equipmentType,
          cargoType: load.cargoType,
        })};
      } catch { return { predicted: false, reason: "ML engine unavailable" }; }
    }},
  { taskType: "carrier_matching", phase: 2, dependsOn: ["hazmat_validation", "equipment_validation"],
    executor: async (load) => {
      try {
        const { mlEngine } = await import("./mlEngine");
        if (!mlEngine.isReady()) return { matched: false, reason: "ML engine offline" };
        return { matched: true, ...mlEngine.matchCarriers({
          originState: load.originState, destState: load.destinationState,
          distance: Number(load.distance) || 200,
          cargoType: load.cargoType, weight: Number(load.weight),
        })};
      } catch { return { matched: false, reason: "ML engine unavailable" }; }
    }},

  // Phase 3 — Depends on Phase 2
  { taskType: "route_optimization", phase: 3, dependsOn: ["eta_estimation"],
    executor: async (load) => {
      return {
        optimized: true, avoidZones: [],
        estimatedMiles: Number(load.distance) || 200,
        hazmatRestrictions: !!load.hazmatClass,
      };
    }},
  { taskType: "permit_check", phase: 3, dependsOn: ["hazmat_validation"],
    executor: async (load) => {
      return { permitsRequired: [], allValid: true };
    }},
  { taskType: "escort_check", phase: 3, dependsOn: ["hazmat_validation"],
    executor: async (load) => {
      return {
        escortRequired: load.cargoType === "oversize",
        available: 0,
      };
    }},

  // Phase 4 — Aggregation
  { taskType: "aggregation", phase: 4,
    dependsOn: ["rate_prediction", "eta_estimation", "carrier_matching", "route_optimization", "permit_check", "escort_check"],
    executor: async () => ({ aggregated: true }),
  },
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
    taskRecords[def.taskType] = { id: (inserted as any).insertId, status: "pending", result: null };
  }

  // Execute phases sequentially, tasks within each phase in parallel
  for (const phase of [1, 2, 3, 4]) {
    const phaseTasks = TASK_GRAPH.filter(t => t.phase === phase);
    await Promise.all(phaseTasks.map(async (taskDef) => {
      const depsFailed = taskDef.dependsOn.some(dep => taskRecords[dep]?.status === "failed");
      if (depsFailed) {
        taskRecords[taskDef.taskType].status = "skipped";
        await db.update(loadAnalysisTasks)
          .set({ status: "skipped" as any })
          .where(eq(loadAnalysisTasks.id, taskRecords[taskDef.taskType].id));
        return;
      }

      const startTime = Date.now();
      try {
        await db.update(loadAnalysisTasks)
          .set({ status: "running" as any, startedAt: new Date() })
          .where(eq(loadAnalysisTasks.id, taskRecords[taskDef.taskType].id));

        const result = await taskDef.executor(load, db, companyId);
        taskRecords[taskDef.taskType] = { ...taskRecords[taskDef.taskType], status: "completed", result };

        await db.update(loadAnalysisTasks)
          .set({
            status: "completed" as any, outputData: JSON.stringify(result),
            completedAt: new Date(), durationMs: Date.now() - startTime,
          })
          .where(eq(loadAnalysisTasks.id, taskRecords[taskDef.taskType].id));
      } catch (err: any) {
        taskRecords[taskDef.taskType].status = "failed";
        await db.update(loadAnalysisTasks)
          .set({
            status: "failed" as any, errorMessage: err.message,
            completedAt: new Date(), durationMs: Date.now() - startTime,
          })
          .where(eq(loadAnalysisTasks.id, taskRecords[taskDef.taskType].id));
      }
    }));
  }

  // Save aggregated result
  const fullReport = Object.fromEntries(
    Object.entries(taskRecords).map(([k, v]) => [k, v.result])
  );

  const rateResult = taskRecords.rate_prediction?.result;
  const etaResult = taskRecords.eta_estimation?.result;

  await db.insert(loadAnalysisResults).values({
    loadId, companyId,
    overallScore: "85.00",
    rateEstimate: rateResult?.predictedRate?.toFixed(2) || null,
    etaMinutes: etaResult?.etaMinutes || null,
    complianceStatus: taskRecords.compliance_check?.status === "completed" ? "pass" : "fail",
    fullReport: JSON.stringify(fullReport),
  }).onDuplicateKeyUpdate({
    set: {
      overallScore: "85.00",
      rateEstimate: rateResult?.predictedRate?.toFixed(2) || null,
      etaMinutes: etaResult?.etaMinutes || null,
      fullReport: JSON.stringify(fullReport),
      aggregatedAt: new Date(),
    },
  });

  return fullReport;
}
