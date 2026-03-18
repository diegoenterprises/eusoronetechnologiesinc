# QPilotOS Reverse-Engineering: Windsurf Build Instructions

## Source Document
**Origin Pilot (本源司南) v4.0 — User Manual & API Reference v3.3**
Published: March 2, 2026 by Origin Quantum Computing Technology (Hefei) Co., Ltd.

## Adaptation Strategy
6 architectural patterns extracted from QPilotOS's quantum computing operating system, adapted for classical implementation on EusoTrip's hazmat freight logistics platform. No quantum hardware required — these are the algorithmic and architectural patterns that make QPilotOS effective, translated to freight logistics.

## Build Instructions

| ID | Feature | QPilotOS Source | EusoTrip Target | Priority |
|----|---------|-----------------|-----------------|----------|
| WS-QP-001 | HRRN Dispatch Scheduler | ScheduleServer (§3.3.4) | dispatchPlanner.ts | P0 — Critical |
| WS-QP-002 | Resource Pre-Analysis Engine | OSServerManager (§3.3.3) | New service module | P0 — Critical |
| WS-QP-003 | Task Decomposition Pipeline | ComputerServer (§3.3.2) | New service module | P1 — High |
| WS-QP-004 | Dual-Storage Pattern (MongoDB) | QCloudServer Persistence (§3.3.1) | New infrastructure | P2 — Medium |
| WS-QP-005 | Resource Availability Broadcasts | Pub-Sub System (§3.3.7, §6) | WebSocket extension | P1 — High |
| WS-QP-006 | Multi-Pass Optimization Pipeline | QCompileServer (§3.3.5) | New service module | P1 — High |

## Recommended Build Order

### Phase 1: Dispatch Intelligence (WS-QP-001 + WS-QP-002)
Build HRRN scheduling and resource pre-analysis together. These directly upgrade the Dispatch Planner — the feature Ryan Davis criticized most.

### Phase 2: Real-Time Awareness (WS-QP-005)
Resource availability broadcasts extend your existing 611-line WebSocket system. Dispatchers get HOS warnings, permit expiry alerts, and capacity monitoring without polling.

### Phase 3: Optimization Engine (WS-QP-003 + WS-QP-006)
Task decomposition and multi-pass optimization work together. Decomposition breaks loads into parallel sub-tasks; multi-pass optimization chains the results through 6 refinement stages.

### Phase 4: Infrastructure (WS-QP-004)
MongoDB integration is the foundation play. It doesn't change user experience directly but prevents MySQL bloat as GPS data, ESANG conversations, and audit logs grow.

## New Database Tables (6 instructions = 9 new tables)
1. `dispatch_queue_priorities` — HRRN scoring per load
2. `resource_preanalysis` — Pre-dispatch feasibility verdicts
3. `resource_capacity_snapshot` — Periodic resource capacity snapshots
4. `load_analysis_tasks` — Sub-task tracking for decomposition
5. `load_analysis_results` — Aggregated analysis results
6. `resource_broadcast_subscriptions` — User alert preferences
7. `resource_broadcast_log` — Broadcast history
8. `optimization_runs` — Pipeline execution tracking
9. `optimization_pass_results` — Per-pass results and timing
10. `lane_performance_cache` — Historical lane performance data

## New Service Modules (4 new services)
1. `services/hrrnScheduler.ts` — HRRN calculation, recalculation, queue management
2. `services/resourcePreAnalysis.ts` — Feasibility analysis, gap detection
3. `services/taskDecomposition.ts` — Phase-based parallel sub-task execution
4. `services/optimizationPipeline.ts` — 6-pass optimization with lane cache
5. `services/resourceMonitor.ts` — HOS, permit, capacity monitoring
6. `services/mongoStore.ts` — MongoDB client with collection managers

## New Router Procedures (~25 new tRPC procedures)
- `resourcePreAnalysisRouter` — 4 procedures
- `taskDecompositionRouter` — 3 procedures
- `resourceBroadcastsRouter` — 5 procedures
- `optimizationPipelineRouter` — 4 procedures
- `dataStoreRouter` — 4 procedures
- Extensions to `dispatchPlannerRouter` — ~5 new/modified procedures

## New WebSocket Events (~15 new events)
- Dispatch queue: 3 events (queue updated, priority changed, starvation warning)
- Resource verdicts: 3 events (verdict ready, capacity low, gap alert)
- Load analysis: 4 events (started, subtask completed, completed, failed)
- Resource alerts: 6 events (alert, HOS warning, permit expiry, capacity, driver status, equipment)
- Optimization: 3 events (started, pass completed, completed)

## Team Responsibilities
- **Team Alpha (Backend):** All database migrations, service modules, router procedures
- **Team Beta (Frontend):** HRRN queue visualization, resource health widgets, optimization progress UI, alert bell
- **Team Gamma (AI):** mlEngine integration in task decomposition and optimization pipeline
- **Team Delta (Compliance):** Compliance verification pass in optimization pipeline, permit expiry monitoring
- **Team Epsilon (Financial):** Rate optimization pass integration with Pricebook and FSC Engine
- **Team Zeta (Real-Time):** All WebSocket events, resource broadcast intervals, MongoDB real-time queries
