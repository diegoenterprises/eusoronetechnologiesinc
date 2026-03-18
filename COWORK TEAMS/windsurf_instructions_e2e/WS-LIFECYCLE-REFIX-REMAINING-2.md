# WINDSURF INSTRUCTION: Load Lifecycle — 2 Remaining Blockers

> **Context:** Commit f011fe98 was independently verified. **Major improvement: 42% → 87%.** 20 of 23 items now PASS. But 2 blockers remain that must be fixed before production.

---

## BLOCKER 1: HAZMAT_SURCHARGE Not Seeded in platform_fees

**Status:** FAIL
**Impact:** Hazmat loads receive $0 surcharge. The calculation logic in loadLifecycle.ts (lines 1355-1374) works correctly — it queries platform_fees for an active HAZMAT_SURCHARGE row, applies flat + percentage amounts. But the platform_fees table is **completely empty**. The query returns 0 rows, so hazmatSurcharge = $0 for every hazmat load.

**Fix:** Insert the seed data. Either:

### Option A: In db.ts runSchemaSync() after ensureTable('platform_fees')
```typescript
// After the ensureTable call for platform_fees, add:
const [existing] = await db.execute(sql`
  SELECT id FROM platform_fees WHERE feeType = 'HAZMAT_SURCHARGE' LIMIT 1
`);
if (!existing || (existing as any[]).length === 0) {
  await db.execute(sql`
    INSERT INTO platform_fees (feeType, name, description, percentage, flatAmount, active, effectiveFrom, createdAt, updatedAt)
    VALUES ('HAZMAT_SURCHARGE', 'Hazmat Load Surcharge', 'Additional charge for hazardous materials transport', 2.500, 50.00, true, NOW(), NOW(), NOW())
  `);
  console.log('[SchemaSync] Seeded HAZMAT_SURCHARGE fee');
}
```

### Option B: One-time SQL (if you prefer manual seeding)
```sql
INSERT INTO platform_fees (feeType, name, description, percentage, flatAmount, active, effectiveFrom, createdAt, updatedAt)
VALUES ('HAZMAT_SURCHARGE', 'Hazmat Load Surcharge', 'Additional charge for hazardous materials transport', 2.500, 50.00, true, NOW(), NOW(), NOW());
```

**Verification:** `SELECT * FROM platform_fees WHERE feeType = 'HAZMAT_SURCHARGE'` must return 1 row.

---

## BLOCKER 2: Original 15 LOAD_EVENTS Not Emitted

**Status:** FAIL
**Impact:** The 4 new emit functions (emitFinancialEvent, emitDispatchEvent, emitComplianceAlert, emitGamificationEvent) are correctly implemented and called — that's good. But they use **custom event types**, not the 15 standardized LOAD_EVENTS from `websocket-events.ts`. Any frontend client subscribing to `load:created`, `load:posted`, `load:assigned`, etc. receives **nothing**.

**The 15 events from websocket-events.ts (lines 10-31):**
```
load:created, load:posted, load:assigned, load:status_changed, load:cancelled,
load:completed, load:location_updated, load:eta_updated, load:geofence_enter,
load:geofence_exit, load:route_deviation, load:document_uploaded, load:bol_signed,
load:pod_submitted, load:exception_raised
```

**Fix:** In the state machine effect handler in loadLifecycle.ts, add emissions for each standardized event at the correct transition:

```typescript
import { LOAD_EVENTS } from '../../shared/websocket-events';

// In the effect execution block, after each state transition:

// DRAFT → POSTED
io.to(`load:${loadId}`).emit(LOAD_EVENTS.LOAD_CREATED, { loadId, loadNumber, status: 'posted', timestamp: new Date() });
io.to(`load:${loadId}`).emit(LOAD_EVENTS.LOAD_POSTED, { loadId, loadNumber, timestamp: new Date() });

// AWARDED → ACCEPTED
io.to(`load:${loadId}`).emit(LOAD_EVENTS.LOAD_ASSIGNED, { loadId, carrierId, timestamp: new Date() });

// Any state change
io.to(`load:${loadId}`).emit(LOAD_EVENTS.LOAD_STATUS_CHANGED, { loadId, from: previousState, to: newState, timestamp: new Date() });

// → CANCELLED
io.to(`load:${loadId}`).emit(LOAD_EVENTS.LOAD_CANCELLED, { loadId, reason, cancelledBy, timestamp: new Date() });

// → DELIVERED
io.to(`load:${loadId}`).emit(LOAD_EVENTS.LOAD_COMPLETED, { loadId, deliveredAt: new Date() });

// GPS update handler
io.to(`load:${loadId}`).emit(LOAD_EVENTS.LOAD_LOCATION_UPDATED, { loadId, lat, lng, timestamp: new Date() });

// ETA recalculation
io.to(`load:${loadId}`).emit(LOAD_EVENTS.LOAD_ETA_UPDATED, { loadId, eta, timestamp: new Date() });

// Geofence events
io.to(`load:${loadId}`).emit(LOAD_EVENTS.LOAD_GEOFENCE_ENTER, { loadId, geofenceId, timestamp: new Date() });
io.to(`load:${loadId}`).emit(LOAD_EVENTS.LOAD_GEOFENCE_EXIT, { loadId, geofenceId, timestamp: new Date() });

// Route deviation
io.to(`load:${loadId}`).emit(LOAD_EVENTS.LOAD_ROUTE_DEVIATION, { loadId, deviation, timestamp: new Date() });

// Document upload endpoint
io.to(`load:${loadId}`).emit(LOAD_EVENTS.LOAD_DOCUMENT_UPLOADED, { loadId, documentType, timestamp: new Date() });

// BOL signature
io.to(`load:${loadId}`).emit(LOAD_EVENTS.LOAD_BOL_SIGNED, { loadId, signedBy, timestamp: new Date() });

// POD submission
io.to(`load:${loadId}`).emit(LOAD_EVENTS.LOAD_POD_SUBMITTED, { loadId, submittedBy, timestamp: new Date() });

// Exception raised
io.to(`load:${loadId}`).emit(LOAD_EVENTS.LOAD_EXCEPTION_RAISED, { loadId, exceptionType, message, timestamp: new Date() });
```

**Verification:**
```bash
grep -c "LOAD_EVENTS\." frontend/server/routers/loadLifecycle.ts
# Must return ≥15
```

---

## VERIFICATION PROTOCOL

After fixing both items:
1. `SELECT * FROM platform_fees WHERE feeType = 'HAZMAT_SURCHARGE'` → must return 1 row with percentage=2.5 and flatAmount=50.00
2. `grep -c "LOAD_EVENTS\." frontend/server/routers/loadLifecycle.ts` → must return ≥15
3. `npm run build` → 0 errors
4. Commit, push to origin/main, rebuild dist/src-snapshot/, deploy to Azure

---

## SCORE CARD UPDATE

| Metric | Round 1 | Round 2 | After This Fix |
|--------|---------|---------|----------------|
| Items PASS | 10/24 | 20/23 | Target: 23/23 |
| Overall | 42% | 87% | Target: 100% |
| DB Schema | FAIL | PASS | PASS |
| Wizard | 25% | 100% | 100% |
| Compliance | 83% | 100% | 100% |
| Financial | 65% | 75% | Target: 100% |
| WebSocket | 20% | 60% | Target: 100% |
| Dispatcher | 60% | 100% | 100% |

These are the final 2 items. Fix them and we're at 100%.
