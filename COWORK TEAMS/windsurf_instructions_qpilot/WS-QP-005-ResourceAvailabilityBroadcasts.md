# WS-QP-005: Real-Time Resource Availability Broadcasts

## Origin
Reverse-engineered from QPilotOS v3.3 Pub-Sub architecture (Section 3.3.7, Section 6). QPilotOS pushes chip calibration events, resource availability changes, and maintenance windows to subscribers in real-time via a Pub-Sub pattern. No polling. Adapted to freight: broadcast driver availability changes, HOS warnings, equipment status, and permit expirations to dispatchers in real-time.

## Concept
Currently, dispatchers must manually check driver availability, refresh the page to see HOS updates, and have no warning when permits or certifications are about to expire. This feature creates a **Pub-Sub resource broadcast system** that automatically pushes resource state changes to all relevant subscribers.

## What Exists Today
- `frontend/shared/websocket-events.ts` — 611 lines, 140+ events, 20+ categories
- WebSocket channel subscription per role in `_core/locationEngine.ts`
- Driver status changes emit basic events but no resource-level analysis
- HOS data exists in `driver_availability` table but is not broadcast
- Permit/certification expiry is stored but not monitored in real-time

## What to Build

### Step 1: Database Migration
Create migration `frontend/drizzle/0024_resource_broadcasts.sql`:

```sql
CREATE TABLE IF NOT EXISTS resource_broadcast_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  companyId INT NOT NULL,
  resourceType ENUM('driver_availability','hos_warning','equipment_status',
    'permit_expiry','certification_expiry','twic_expiry','insurance_expiry',
    'capacity_alert','maintenance_due') NOT NULL,
  threshold JSON DEFAULT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt DATETIME NOT NULL DEFAULT NOW(),
  KEY idx_company_type (companyId, resourceType),
  KEY idx_user (userId)
);

CREATE TABLE IF NOT EXISTS resource_broadcast_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT NOT NULL,
  broadcastType VARCHAR(50) NOT NULL,
  severity ENUM('info','warning','critical') NOT NULL,
  message TEXT NOT NULL,
  payload JSON DEFAULT NULL,
  recipientCount INT NOT NULL DEFAULT 0,
  broadcastAt DATETIME NOT NULL DEFAULT NOW(),
  KEY idx_company_time (companyId, broadcastAt DESC),
  KEY idx_severity (severity)
);
```

### Step 2: Resource Monitor Service
Create `frontend/server/services/resourceMonitor.ts`:

```typescript
/**
 * REAL-TIME RESOURCE AVAILABILITY BROADCASTS — WS-QP-005
 * Adapted from QPilotOS Pub-Sub notification system
 *
 * Monitors:
 *   1. Driver availability changes (status transitions)
 *   2. HOS approaching limits (< 2h, < 1h, < 30min driving)
 *   3. Permit/certification expiring (30 days, 7 days, expired)
 *   4. Equipment maintenance due
 *   5. Capacity thresholds (< 20% drivers available)
 */

import { emitDispatchEvent } from "../_core/websocket";

interface ResourceAlert {
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  entityType: "driver" | "vehicle" | "permit" | "certification" | "capacity";
  entityId: number;
  metadata: Record<string, any>;
}

// HOS Monitor — runs every 5 minutes
export async function checkHosLimits(db: any, companyId: number): Promise<ResourceAlert[]> {
  const alerts: ResourceAlert[] = [];

  const [rows]: any = await db.execute(sql`
    SELECT da.driverId, da.hosDrivingRemaining, u.name
    FROM driver_availability da
    JOIN drivers d ON da.driverId = d.id
    JOIN users u ON d.userId = u.id
    WHERE da.companyId = ${companyId}
    AND da.hosDrivingRemaining < 120
  `);

  if (Array.isArray(rows)) {
    for (const row of rows) {
      const minutes = row.hosDrivingRemaining;
      let severity: "info" | "warning" | "critical" = "info";
      if (minutes < 30) severity = "critical";
      else if (minutes < 60) severity = "warning";

      alerts.push({
        type: "hos_warning",
        severity,
        title: `HOS Alert: ${row.name}`,
        message: `${row.name} has ${minutes} minutes driving time remaining`,
        entityType: "driver",
        entityId: row.driverId,
        metadata: { hosDrivingRemaining: minutes, driverName: row.name },
      });
    }
  }
  return alerts;
}

// Permit/Certification Expiry Monitor — runs every hour
export async function checkExpirations(db: any, companyId: number): Promise<ResourceAlert[]> {
  const alerts: ResourceAlert[] = [];
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 86400000);
  const in30Days = new Date(now.getTime() + 30 * 86400000);

  // TWIC expiry
  const [twicRows]: any = await db.execute(sql`
    SELECT d.id as driverId, d.twicExpiry, u.name
    FROM drivers d
    JOIN users u ON d.userId = u.id
    WHERE d.companyId = ${companyId}
    AND d.twicExpiry IS NOT NULL
    AND d.twicExpiry <= ${in30Days.toISOString().slice(0, 10)}
  `);

  if (Array.isArray(twicRows)) {
    for (const row of twicRows) {
      const expiry = new Date(row.twicExpiry);
      let severity: "info" | "warning" | "critical" = "info";
      if (expiry <= now) severity = "critical";
      else if (expiry <= in7Days) severity = "warning";

      alerts.push({
        type: "twic_expiry",
        severity,
        title: `TWIC ${severity === "critical" ? "Expired" : "Expiring"}: ${row.name}`,
        message: `${row.name}'s TWIC card ${severity === "critical" ? "has expired" : `expires ${expiry.toLocaleDateString()}`}`,
        entityType: "certification",
        entityId: row.driverId,
        metadata: { expiryDate: row.twicExpiry, driverName: row.name },
      });
    }
  }

  // Medical card, CDL, hazmat endorsement expiry — same pattern
  // Insurance expiry — same pattern

  return alerts;
}

// Capacity Monitor — runs every 5 minutes
export async function checkCapacity(db: any, companyId: number): Promise<ResourceAlert[]> {
  const alerts: ResourceAlert[] = [];

  const [totalRows]: any = await db.execute(sql`
    SELECT COUNT(*) as total FROM drivers WHERE companyId = ${companyId}
  `);
  const [availRows]: any = await db.execute(sql`
    SELECT COUNT(*) as available FROM drivers
    WHERE companyId = ${companyId} AND status IN ('available', 'active')
  `);

  const total = totalRows?.[0]?.total || 0;
  const available = availRows?.[0]?.available || 0;
  const pct = total > 0 ? (available / total) * 100 : 0;

  if (pct < 20) {
    alerts.push({
      type: "capacity_alert",
      severity: pct < 10 ? "critical" : "warning",
      title: "Low Driver Capacity",
      message: `Only ${available} of ${total} drivers available (${pct.toFixed(0)}%)`,
      entityType: "capacity",
      entityId: companyId,
      metadata: { totalDrivers: total, availableDrivers: available, percentage: pct },
    });
  }

  return alerts;
}

// Master broadcast function
export async function broadcastResourceAlerts(db: any, companyId: number) {
  const allAlerts: ResourceAlert[] = [
    ...await checkHosLimits(db, companyId),
    ...await checkExpirations(db, companyId),
    ...await checkCapacity(db, companyId),
  ];

  for (const alert of allAlerts) {
    // Emit via WebSocket
    emitDispatchEvent("resource:alert", {
      companyId,
      ...alert,
      timestamp: new Date().toISOString(),
    });

    // Log broadcast
    await db.insert(resourceBroadcastLog).values({
      companyId,
      broadcastType: alert.type,
      severity: alert.severity,
      message: alert.message,
      payload: JSON.stringify(alert.metadata),
      recipientCount: 1, // update with actual WebSocket subscriber count
    });
  }

  return allAlerts;
}
```

### Step 3: Scheduled Intervals
In `_core/index.ts` startup:
```typescript
// HOS + Capacity: every 5 minutes
setInterval(() => broadcastResourceAlerts(db, companyId), 5 * 60000);
// Expirations: every hour
setInterval(() => checkExpirations(db, companyId), 60 * 60000);
```

### Step 4: WebSocket Events
Add to `frontend/shared/websocket-events.ts`:
```typescript
// Resource Availability Broadcasts (WS-QP-005)
RESOURCE_ALERT: "resource:alert",
RESOURCE_HOS_WARNING: "resource:hos:warning",
RESOURCE_PERMIT_EXPIRY: "resource:permit:expiry",
RESOURCE_CAPACITY_LOW: "resource:capacity:low",
RESOURCE_DRIVER_STATUS_CHANGE: "resource:driver:status",
RESOURCE_EQUIPMENT_MAINTENANCE: "resource:equipment:maintenance",
```

### Step 5: Router
Create `frontend/server/routers/resourceBroadcasts.ts`:
```typescript
export const resourceBroadcastsRouter = router({
  getActiveAlerts: protectedProcedure.query(/* current unresolved alerts */),
  getAlertHistory: protectedProcedure.query(/* last 24h of broadcast log */),
  updateSubscription: protectedProcedure.mutation(/* toggle alert types on/off */),
  getSubscriptions: protectedProcedure.query(/* user's current alert preferences */),
  dismissAlert: protectedProcedure.mutation(/* mark alert as acknowledged */),
});
```

### Step 6: Frontend
- **Alert Bell Widget** (top nav): Shows count of active alerts, grouped by severity
- **Alert Feed Panel** (slide-out): Real-time feed of resource alerts with severity colors
- **Dispatch Planner Integration**: HOS warnings appear as overlays on driver rows
- **Settings Page**: Let dispatchers choose which alert types they receive
- Color coding: Critical = red pulse, Warning = amber, Info = blue subtle

## Registration
- Import in `frontend/server/routers.ts`
- Register on appRouter
- Guard: DISPATCH, SAFETY_MANAGER, COMPLIANCE_OFFICER, ADMIN, SUPER_ADMIN

## Testing
1. Set a driver's HOS to 25 minutes → verify critical alert fires within 5 minutes
2. Set TWIC expiry to tomorrow → verify warning alert fires
3. Mark 90% of drivers as suspended → verify capacity critical alert
4. Verify WebSocket delivers alerts to connected dispatchers in real-time
5. Verify alert dismissal persists and doesn't re-fire for same condition
