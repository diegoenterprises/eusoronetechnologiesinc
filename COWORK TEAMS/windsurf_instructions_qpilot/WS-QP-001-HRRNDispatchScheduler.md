# WS-QP-001: HRRN Dispatch Scheduler

## Origin
Reverse-engineered from QPilotOS v3.3 ScheduleServer Module (Section 3.3.4). Adapted from quantum task scheduling to freight dispatch scheduling.

## Concept
Replace the current basic score-based driver assignment in `dispatchPlanner.ts` with **Highest Response Ratio Next (HRRN)** scheduling. HRRN dynamically prioritizes loads based on wait time vs. estimated execution time, preventing starvation (long-waiting loads eventually rise to the top of the dispatch queue).

**Formula:** `Priority = (WaitTime + EstimatedServiceTime) / EstimatedServiceTime`

As a load sits unassigned longer, its priority naturally increases — ensuring no load gets starved while high-value loads still get prioritized.

## What Exists Today
- `frontend/server/routers/dispatchPlanner.ts` (566 lines, 7 procedures)
- `autoSuggest` procedure scores drivers with a simple point system (HOS +20, hazmat +15, safety +5, experience +3, available +10)
- No load prioritization — loads are displayed in creation order
- No starvation prevention — old loads can sit indefinitely
- `dispatch_planner_slots` table tracks assignments but not queue priority

## What to Build

### Step 1: Database Migration
Create migration `frontend/drizzle/0021_hrrn_dispatch_queue.sql`:

```sql
CREATE TABLE IF NOT EXISTS dispatch_queue_priorities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loadId INT NOT NULL,
  companyId INT NOT NULL,
  enteredQueueAt DATETIME NOT NULL DEFAULT NOW(),
  estimatedServiceMinutes INT NOT NULL DEFAULT 120,
  basePriority DECIMAL(8,4) NOT NULL DEFAULT 1.0,
  currentHrrnScore DECIMAL(10,4) NOT NULL DEFAULT 1.0,
  lastRecalculatedAt DATETIME NOT NULL DEFAULT NOW(),
  constraintFlags JSON DEFAULT NULL,
  status ENUM('queued','scheduling','assigned','expired') NOT NULL DEFAULT 'queued',
  assignedDriverId INT DEFAULT NULL,
  assignedAt DATETIME DEFAULT NULL,
  UNIQUE KEY uq_load (loadId),
  KEY idx_company_status (companyId, status),
  KEY idx_hrrn_score (currentHrrnScore DESC),
  KEY idx_entered_queue (enteredQueueAt)
);
```

Add to `frontend/drizzle/schema.ts`:
```typescript
export const dispatchQueuePriorities = mysqlTable("dispatch_queue_priorities", {
  id: int("id").autoincrement().primaryKey(),
  loadId: int("loadId").notNull(),
  companyId: int("companyId").notNull(),
  enteredQueueAt: datetime("enteredQueueAt").notNull().default(sql`NOW()`),
  estimatedServiceMinutes: int("estimatedServiceMinutes").notNull().default(120),
  basePriority: decimal("basePriority", { precision: 8, scale: 4 }).notNull().default("1.0"),
  currentHrrnScore: decimal("currentHrrnScore", { precision: 10, scale: 4 }).notNull().default("1.0"),
  lastRecalculatedAt: datetime("lastRecalculatedAt").notNull().default(sql`NOW()`),
  constraintFlags: json("constraintFlags"),
  status: mysqlEnum("status", ["queued", "scheduling", "assigned", "expired"]).notNull().default("queued"),
  assignedDriverId: int("assignedDriverId"),
  assignedAt: datetime("assignedAt"),
});
```

### Step 2: HRRN Engine Service
Create `frontend/server/services/hrrnScheduler.ts`:

```typescript
/**
 * HRRN DISPATCH SCHEDULER — WS-QP-001
 * Adapted from QPilotOS ScheduleServer HRRN algorithm
 *
 * Core formula: Priority = (W + S) / S
 *   W = wait time (minutes since load entered queue)
 *   S = estimated service time (pickup-to-delivery minutes)
 *
 * Enhancements over pure HRRN:
 *   - Base priority multiplier (hazmat loads get 1.5x, hot shots 2.0x)
 *   - Constraint-aware filtering (hazmat endorsement, HOS, equipment)
 *   - Batch recalculation every 60 seconds via scheduled job
 */

interface HrrnEntry {
  loadId: number;
  waitMinutes: number;
  estimatedServiceMinutes: number;
  basePriority: number;
  hrrnScore: number;
  constraintFlags: {
    requiresHazmat: boolean;
    requiresTwic: boolean;
    minHosMinutes: number;
    equipmentType: string;
    hazmatClass: string | null;
  };
}

export function calculateHrrnScore(
  waitMinutes: number,
  estimatedServiceMinutes: number,
  basePriority: number
): number {
  const S = Math.max(estimatedServiceMinutes, 1); // prevent division by zero
  const W = Math.max(waitMinutes, 0);
  return ((W + S) / S) * basePriority;
}

export function getBasePriority(load: {
  hazmatClass?: string | null;
  priority?: string | null;
  cargoType?: string | null;
}): number {
  let base = 1.0;
  if (load.hazmatClass) base *= 1.5;        // hazmat loads are higher priority
  if (load.priority === "hot") base *= 2.0;  // hot shots
  if (load.priority === "urgent") base *= 1.8;
  if (load.cargoType === "oversize") base *= 1.3;
  return base;
}

export function estimateServiceMinutes(load: {
  distance?: number | null;
  pickupDate?: string | null;
  deliveryDate?: string | null;
}): number {
  // If we have both dates, use them
  if (load.pickupDate && load.deliveryDate) {
    const diff = new Date(load.deliveryDate).getTime() - new Date(load.pickupDate).getTime();
    if (diff > 0) return Math.round(diff / 60000);
  }
  // Otherwise estimate from distance at 45 mph avg + 60 min buffer
  const miles = Number(load.distance) || 200;
  return Math.round((miles / 45) * 60) + 60;
}
```

### Step 3: Recalculation Scheduled Job
Add to `frontend/server/services/hrrnScheduler.ts`:

```typescript
export async function recalculateAllPriorities(db: any, companyId: number): Promise<number> {
  const queued = await db.select()
    .from(dispatchQueuePriorities)
    .where(and(
      eq(dispatchQueuePriorities.companyId, companyId),
      eq(dispatchQueuePriorities.status, "queued")
    ));

  let updated = 0;
  for (const entry of queued) {
    const now = new Date();
    const enteredAt = new Date(entry.enteredQueueAt);
    const waitMinutes = Math.round((now.getTime() - enteredAt.getTime()) / 60000);
    const newScore = calculateHrrnScore(
      waitMinutes,
      entry.estimatedServiceMinutes,
      Number(entry.basePriority)
    );

    await db.update(dispatchQueuePriorities)
      .set({ currentHrrnScore: newScore.toFixed(4), lastRecalculatedAt: now })
      .where(eq(dispatchQueuePriorities.id, entry.id));
    updated++;
  }
  return updated;
}
```

Register a 60-second interval in `frontend/server/_core/index.ts` startup:
```typescript
import { recalculateAllPriorities } from "../services/hrrnScheduler";
// In startup sequence:
setInterval(async () => {
  try {
    const db = await getDb();
    if (!db) return;
    // Recalculate for all active companies
    await db.execute(sql`
      UPDATE dispatch_queue_priorities dqp
      SET currentHrrnScore = ((TIMESTAMPDIFF(MINUTE, dqp.enteredQueueAt, NOW()) + dqp.estimatedServiceMinutes) / dqp.estimatedServiceMinutes) * dqp.basePriority,
          lastRecalculatedAt = NOW()
      WHERE dqp.status = 'queued'
    `);
  } catch {}
}, 60000);
```

### Step 4: Modify Dispatch Planner Router
In `frontend/server/routers/dispatchPlanner.ts`:

**Modify `getBoard`** to return loads sorted by HRRN score:
- Join `loads` with `dispatch_queue_priorities` on loadId
- Order unassigned loads by `currentHrrnScore DESC`
- Include `hrrnScore` and `waitMinutes` in the response for the frontend to display

**Modify `autoSuggest`** to factor in HRRN priority:
- After scoring drivers, multiply each driver's score by the load's HRRN priority
- This ensures that when dispatchers look at suggestions for a high-priority load, the best-fit drivers appear first

**Add new procedure `getQueueStatus`**:
```typescript
getQueueStatus: protectedProcedure
  .input(z.object({ date: z.string().optional() }))
  .query(async ({ ctx }) => {
    // Returns: all queued loads sorted by HRRN score
    // With: waitTime, estimatedService, hrrnScore, constraintFlags
    // Purpose: Dispatcher sees a priority-ranked queue with aging indicators
  })
```

### Step 5: Auto-Enqueue on Load Creation
In `frontend/server/routers/loads.ts` (or wherever loads are created), after a load is inserted:
```typescript
import { getBasePriority, estimateServiceMinutes } from "../services/hrrnScheduler";

// After load insert:
await db.insert(dispatchQueuePriorities).values({
  loadId: newLoad.id,
  companyId,
  basePriority: getBasePriority(newLoad).toFixed(4),
  estimatedServiceMinutes: estimateServiceMinutes(newLoad),
  constraintFlags: JSON.stringify({
    requiresHazmat: !!newLoad.hazmatClass,
    requiresTwic: !!newLoad.requiresTwic,
    minHosMinutes: estimateServiceMinutes(newLoad),
    equipmentType: newLoad.equipmentType || "flatbed",
    hazmatClass: newLoad.hazmatClass || null,
  }),
});
```

### Step 6: WebSocket Events
Add to `frontend/shared/websocket-events.ts`:
```typescript
// HRRN Dispatch Queue Events
DISPATCH_QUEUE_UPDATED: "dispatch:queue:updated",
DISPATCH_PRIORITY_CHANGED: "dispatch:priority:changed",
DISPATCH_LOAD_STARVATION_WARNING: "dispatch:load:starvation",
```

Emit `DISPATCH_LOAD_STARVATION_WARNING` when any load's wait time exceeds 4 hours and `DISPATCH_PRIORITY_CHANGED` when HRRN recalculation shifts a load's ranking by 3+ positions.

### Step 7: Frontend — DispatchPlanner.tsx
Update `frontend/client/src/pages/dispatch/DispatchPlanner.tsx`:
- Add a "Queue Priority" column to unassigned loads showing HRRN score as a visual bar (green < 2.0, yellow 2.0-4.0, red > 4.0)
- Add "Wait Time" display (e.g., "2h 15m waiting")
- Loads that are aging (HRRN > 4.0) get a subtle red glow animation
- Tooltip on priority bar shows: "Priority: 3.45 | Waiting: 2h 15m | Est. delivery: 4h 30m"

## Testing
1. Create 10 loads at staggered times
2. Verify HRRN scores increase over time for all loads
3. Verify hazmat loads start with higher base priority
4. Verify that after 4+ hours, even low-value loads rise above recent high-value loads
5. Verify `autoSuggest` returns different driver rankings when load HRRN is high vs. low
6. Verify WebSocket starvation warning fires at 4-hour mark

## Registration
- Import in `frontend/server/routers.ts`
- Register `getQueueStatus` as new procedure on `dispatchPlannerRouter`
- Add route in `frontend/client/src/App.tsx` if adding a separate queue view page
