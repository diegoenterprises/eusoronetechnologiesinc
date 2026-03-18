# WS-QP-002: Resource Pre-Analysis Engine

## Origin
Reverse-engineered from QPilotOS v3.3 OSServerManager Module (Section 3.3.3). QPilotOS pre-analyzes quantum circuits before queuing to estimate required resources (qubit count, circuit depth, gate count). Adapted to freight: pre-analyze loads before dispatch to estimate required resources (driver qualifications, equipment, permits, HOS, escort needs).

## Concept
Before a load enters the dispatch queue, automatically analyze it against all company resources and produce a **feasibility verdict**: CAN_DISPATCH, PARTIAL_MATCH, or CANNOT_DISPATCH. This prevents dispatchers from wasting time on loads that can't be fulfilled, and highlights exactly what's missing.

## What Exists Today
- `autoSuggest` in `dispatchPlanner.ts` scores drivers AFTER a dispatcher clicks a load
- No pre-validation before a load enters the queue
- No resource gap analysis (e.g., "you need 2 more hazmat-endorsed drivers to cover today's loads")
- Constraint checks are scattered across individual procedures

## What to Build

### Step 1: Database Migration
Create migration `frontend/drizzle/0022_resource_preanalysis.sql`:

```sql
CREATE TABLE IF NOT EXISTS resource_preanalysis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loadId INT NOT NULL,
  companyId INT NOT NULL,
  analyzedAt DATETIME NOT NULL DEFAULT NOW(),
  verdict ENUM('can_dispatch','partial_match','cannot_dispatch') NOT NULL,
  verdictReason TEXT NOT NULL,
  requiredResources JSON NOT NULL,
  availableResources JSON NOT NULL,
  gapAnalysis JSON DEFAULT NULL,
  matchedDriverIds JSON DEFAULT NULL,
  estimatedDispatchReady DATETIME DEFAULT NULL,
  expiresAt DATETIME NOT NULL,
  UNIQUE KEY uq_load (loadId),
  KEY idx_company_verdict (companyId, verdict),
  KEY idx_expires (expiresAt)
);

CREATE TABLE IF NOT EXISTS resource_capacity_snapshot (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT NOT NULL,
  snapshotAt DATETIME NOT NULL DEFAULT NOW(),
  totalDrivers INT NOT NULL DEFAULT 0,
  availableDrivers INT NOT NULL DEFAULT 0,
  hazmatEndorsedDrivers INT NOT NULL DEFAULT 0,
  twicCardDrivers INT NOT NULL DEFAULT 0,
  avgHosRemaining DECIMAL(8,2) NOT NULL DEFAULT 0,
  equipmentCounts JSON NOT NULL,
  activePermits JSON NOT NULL,
  escortAvailable INT NOT NULL DEFAULT 0,
  KEY idx_company_time (companyId, snapshotAt DESC)
);
```

### Step 2: Pre-Analysis Service
Create `frontend/server/services/resourcePreAnalysis.ts`:

```typescript
/**
 * RESOURCE PRE-ANALYSIS ENGINE — WS-QP-002
 * Adapted from QPilotOS OSServerManager resource estimation
 *
 * Analyzes a load's requirements against company resources BEFORE
 * it enters the dispatch queue. Produces a feasibility verdict with
 * specific gap analysis.
 */

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

  return {
    hazmatEndorsement: !!load.hazmatClass,
    hazmatClass: load.hazmatClass || null,
    twicRequired: !!load.requiresTwic || !!load.terminalPickup,
    minHosMinutes: transitMinutes,
    equipmentType: load.equipmentType || "flatbed",
    escortRequired: !!load.escortRequired || load.cargoType === "oversize",
    specialPermits: load.requiredPermits ? JSON.parse(load.requiredPermits) : [],
    oversize: load.cargoType === "oversize",
    minSafetyScore: load.hazmatClass ? 75 : 50,
  };
}

export async function analyzeLoadFeasibility(
  db: any,
  loadId: number,
  companyId: number
): Promise<ResourceVerdict> {
  // 1. Get load details
  const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
  if (!load) throw new Error("Load not found");

  const requirements = extractLoadRequirements(load);

  // 2. Get available drivers matching constraints
  const availableDrivers = await db.select()
    .from(drivers)
    .where(and(
      eq(drivers.companyId, companyId),
      sql`${drivers.status} IN ('available', 'active', 'off_duty')`
    ));

  // 3. Get HOS data
  const [hosRows]: any = await db.execute(
    sql`SELECT driverId, hosDrivingRemaining FROM driver_availability WHERE companyId = ${companyId}`
  );
  const hosMap: Record<number, number> = {};
  if (Array.isArray(hosRows)) {
    for (const r of hosRows) hosMap[r.driverId] = r.hosDrivingRemaining ?? 660;
  }

  // 4. Filter drivers by ALL constraints
  const matchedDrivers = availableDrivers.filter(d => {
    if (requirements.hazmatEndorsement && !d.hazmatEndorsement) return false;
    if (requirements.twicRequired && !d.twicExpiry) return false;
    if ((hosMap[d.id] ?? 660) < requirements.minHosMinutes) return false;
    if ((d.safetyScore ?? 100) < requirements.minSafetyScore) return false;
    return true;
  });

  // 5. Build gap analysis
  const missingCapabilities: string[] = [];
  const suggestions: string[] = [];

  const hazmatDrivers = availableDrivers.filter(d => d.hazmatEndorsement);
  const twicDrivers = availableDrivers.filter(d => !!d.twicExpiry);

  if (requirements.hazmatEndorsement && hazmatDrivers.length === 0) {
    missingCapabilities.push("No hazmat-endorsed drivers available");
    suggestions.push("Recruit or certify drivers with hazmat endorsement");
  }
  if (requirements.twicRequired && twicDrivers.length === 0) {
    missingCapabilities.push("No TWIC card holders available");
    suggestions.push("Ensure driver TWIC cards are current");
  }
  if (matchedDrivers.length === 0 && availableDrivers.length > 0) {
    const hosShort = availableDrivers.filter(d =>
      (hosMap[d.id] ?? 660) < requirements.minHosMinutes
    );
    if (hosShort.length > 0) {
      missingCapabilities.push(`${hosShort.length} drivers have insufficient HOS`);
      suggestions.push("Consider splitting load or waiting for HOS reset");
    }
  }

  // 6. Determine verdict
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
    verdictReason = missingCapabilities.join("; ") || "No matching drivers";
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
      equipmentAvailable: true, // extend with equipment table check
      escortsAvailable: 0, // extend with escort availability check
      permitsValid: true, // extend with permit expiry check
    },
    gapAnalysis: {
      missingCapabilities,
      suggestions,
      estimatedReadyTime: null,
    },
    matchedDriverIds: matchedDrivers.map(d => d.id),
  };
}
```

### Step 3: Resource Capacity Snapshot (Every 5 Minutes)
Add scheduled job that snapshots company resource capacity:

```typescript
export async function captureResourceSnapshot(db: any, companyId: number) {
  const allDrivers = await db.select().from(drivers)
    .where(eq(drivers.companyId, companyId));
  const available = allDrivers.filter(d => ["available", "active", "off_duty"].includes(d.status));
  const hazmat = available.filter(d => d.hazmatEndorsement);
  const twic = available.filter(d => !!d.twicExpiry);

  await db.insert(resourceCapacitySnapshot).values({
    companyId,
    totalDrivers: allDrivers.length,
    availableDrivers: available.length,
    hazmatEndorsedDrivers: hazmat.length,
    twicCardDrivers: twic.length,
    avgHosRemaining: "0", // compute from driver_availability
    equipmentCounts: JSON.stringify({}),
    activePermits: JSON.stringify({}),
    escortAvailable: 0,
  });
}
```

### Step 4: Router Procedures
Create `frontend/server/routers/resourcePreAnalysis.ts`:

```typescript
export const resourcePreAnalysisRouter = router({
  // Analyze a specific load
  analyzeLoad: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(/* calls analyzeLoadFeasibility */),

  // Get all pre-analysis results for today's loads
  getDashboard: protectedProcedure
    .query(/* returns grouped by verdict: can_dispatch, partial_match, cannot_dispatch */),

  // Get resource capacity trend (last 24h snapshots)
  getCapacityTrend: protectedProcedure
    .query(/* returns hourly snapshots for chart display */),

  // Get gap summary (what resources are most needed)
  getGapSummary: protectedProcedure
    .query(/* aggregates gaps across all queued loads */),
});
```

### Step 5: Auto-Analyze on Load Creation
In load creation flow, after insert:
```typescript
import { analyzeLoadFeasibility } from "../services/resourcePreAnalysis";
const verdict = await analyzeLoadFeasibility(db, newLoad.id, companyId);
await db.insert(resourcePreanalysis).values({
  loadId: newLoad.id,
  companyId,
  verdict: verdict.verdict,
  verdictReason: verdict.verdictReason,
  requiredResources: JSON.stringify(verdict.requiredResources),
  availableResources: JSON.stringify(verdict.availableResources),
  gapAnalysis: JSON.stringify(verdict.gapAnalysis),
  matchedDriverIds: JSON.stringify(verdict.matchedDriverIds),
  expiresAt: new Date(Date.now() + 30 * 60000), // 30 min TTL, then re-analyze
});
```

### Step 6: WebSocket Events
```typescript
RESOURCE_VERDICT_READY: "resource:verdict:ready",
RESOURCE_CAPACITY_LOW: "resource:capacity:low",
RESOURCE_GAP_ALERT: "resource:gap:alert",
```

### Step 7: Frontend
Add verdict badges to load cards in DispatchPlanner:
- Green checkmark: CAN_DISPATCH
- Yellow warning: PARTIAL_MATCH (with tooltip showing gaps)
- Red X: CANNOT_DISPATCH (with tooltip showing what's missing + suggestions)

Add a "Resource Health" widget to Dispatch Dashboard showing capacity snapshot trends.

## Registration
- Import `resourcePreAnalysisRouter` in `frontend/server/routers.ts`
- Register on appRouter
- Add frontend route for capacity dashboard
- Guard with DISPATCH, ADMIN, SUPER_ADMIN roles

## Testing
1. Create a hazmat load when no hazmat drivers exist → verdict: CANNOT_DISPATCH
2. Create a standard load with 5 available drivers → verdict: CAN_DISPATCH
3. Create a load requiring 8h HOS when all drivers have < 4h → verdict: CANNOT_DISPATCH with HOS suggestion
4. Verify capacity snapshots populate every 5 minutes
5. Verify WebSocket fires on verdict completion
