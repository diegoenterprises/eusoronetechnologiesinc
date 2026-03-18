# WINDSURF INSTRUCTION: Load Lifecycle Calibration — Verification Confrontation

> **Context:** You claimed commit f526e7bd completed ALL phases (1-5.1) of the Load Lifecycle Calibration. An independent 6-team audit verified every claim. **Overall result: 42% verified. 10 PASS / 6 PARTIAL / 8 FAIL out of 24 items tested.**

> **This document contains the exact remediation steps. Do NOT claim completion until every item is independently verifiable.**

---

## PHASE 1 RESULTS: ~45% Verified

| Item | Verdict | Issue |
|------|---------|-------|
| 1.1 DOT Hazmat Fields | **FAIL** | schema.ts lines 275-283 updated but **drizzle-kit push NEVER RUN**. 8 columns do NOT exist in MySQL. |
| 1.2 Carrier HazMat Guard | **PASS** | stateMachine.ts line 505 — functional |
| 1.3 Driver Endorsement Guards | **PASS** | stateMachine.ts lines 576-577 — functional |
| 1.4 Wallet Credit | **PARTIAL** | Effects declared but settlements table MISSING from MySQL. Inserts silently fail. |
| 1.5 WebSocket Events | **PARTIAL** | Only 3/15 events emitted (stateChange, timerUpdate, approvalUpdate). 12 events dead. |
| 1.6 GPS Tables | **PASS** | All 5+ tables confirmed in MySQL |

### Phase 1 Fixes Required:

```bash
# FIX 1.1: Run the migration for DOT hazmat fields
npx drizzle-kit push:mysql
# Then verify:
# SHOW COLUMNS FROM loads LIKE 'properShippingName';
# SHOW COLUMNS FROM loads LIKE 'packingGroup';
# SHOW COLUMNS FROM loads LIKE 'emergencyResponseNumber';
# etc. for all 8 new columns
```

**FIX 1.4:** The `settlements` and `settlement_documents` tables must exist in MySQL. Run `npx drizzle-kit push:mysql` and verify with `SHOW TABLES LIKE 'settlement%'`.

**FIX 1.5:** Wire the remaining 12 WebSocket events. In `loadLifecycle.ts`, at each state transition effect, add Socket.io emissions:
- `load:created` → at DRAFT→POSTED
- `load:posted` → at POSTED state entry
- `load:assigned` → at AWARDED→ACCEPTED
- `load:cancelled` → at any →CANCELLED transition
- `load:completed` → at →DELIVERED transition
- `load:location_updated` → at GPS update handler
- `load:eta_updated` → at ETA recalculation
- `load:geofence_enter` → at geofence event handler
- `load:geofence_exit` → at geofence event handler
- `load:document_uploaded` → at document upload endpoint
- `load:bol_signed` → at BOL signature endpoint
- `load:pod_submitted` → at POD submission endpoint

---

## PHASE 2 RESULTS: ~25% Verified

| Item | Verdict | Issue |
|------|---------|-------|
| 2.1 WIZARD_CONFIG (8 roles) | **PARTIAL** | Defined but only quickMode used. showTerminalFields/showBidFields/showTASInventory **NEVER REFERENCED** |
| 2.2 Trailer Conditional Components | **FAIL** | TankerSpecificFields, OversizeFields, LivestockFields **DO NOT EXIST** as components. Inline conditionals only. |
| 2.3 COMMODITY_UNITS (17 types) | **FAIL** | Defined (lines 237-255) but **NEVER REFERENCED**. Dead code. |
| 2.4 SEGREGATION_TABLE | **FAIL** | Defined (lines 258-271) but **NEVER REFERENCED**. Dead code. |
| 2.5 STATE_RULES | **FAIL** | Defined (lines 274-290) but **NEVER REFERENCED**. Dead code. |
| 2.6 Integration | **FAIL** | 5 of 6 data structures are dead code |

### Phase 2 Fixes Required:

**FIX 2.1:** In LoadCreationWizard.tsx, wire WIZARD_CONFIG field flags:
```typescript
// Where terminal fields are rendered, add:
{wizConfig.showTerminalFields && (
  // ... terminal-specific fields
)}

// Where bid fields are rendered, add:
{wizConfig.showBidFields && (
  // ... bid-specific fields
)}

// Where TAS inventory fields are rendered, add:
{wizConfig.showTASInventory && (
  // ... TAS inventory fields
)}
```

**FIX 2.2:** Extract inline conditionals (lines 1248-1470) into proper React components:
```typescript
// Create: src/components/wizard/TankerSpecificFields.tsx
// Move lines 1248-1312 into this component

// Create: src/components/wizard/OversizeFields.tsx
// Move lines 1315-1364 into this component

// Create: src/components/wizard/LivestockFields.tsx
// Move lines 1367-1405 into this component
```

**FIX 2.3:** Wire COMMODITY_UNITS into the unit display:
```typescript
// Replace the hardcoded switch in getQuantityUnits() (lines 520-547) with:
function getQuantityUnits(commodityType: string) {
  const units = COMMODITY_UNITS[commodityType];
  if (units) return { volume: units.displayVolume, weight: units.displayWeight };
  return { volume: 'Gallons', weight: 'Pounds' }; // fallback
}
```

**FIX 2.4:** Wire SEGREGATION_TABLE into hazmat class selection:
```typescript
// After user selects hazmatClass, validate against existing loads on same vehicle:
const incompatible = SEGREGATION_TABLE[selectedHazmatClass] || [];
// Show warning if any co-loaded hazmat class is in incompatible list
```

**FIX 2.5:** Wire STATE_RULES into the route step:
```typescript
// In the origin/destination step, after state is determined:
const originRules = STATE_RULES[originState];
const destRules = STATE_RULES[destState];
// Display warnings for weight limits, CARB requirements, hazmat notes
```

---

## PHASE 3 RESULTS: ~83% Verified

| Item | Verdict | Issue |
|------|---------|-------|
| 3.1 equipment_matches_load | **PASS** | loadLifecycle.ts lines 323-357 — functional |
| 3.2 commodity_segregation_safe | **PASS** | loadLifecycle.ts lines 360-402 — functional, references 49 CFR 177.848 |
| 3.3 route_state_compliance | **PARTIAL** | Only 13/50 states. Soft enforcement (non-prod bypass). Prop 65 stub. |

### Phase 3 Fixes Required:

**FIX 3.3a:** Remove IS_PROD bypass:
```typescript
// In loadLifecycle.ts, route_state_compliance case:
// REMOVE this line:
// return IS_PROD ? warnings[0] : null;
// REPLACE with:
return warnings.length > 0 ? warnings[0] : null;
```

**FIX 3.3b:** Expand STATE_RULES to all 50 states. At minimum add: WA, OR, NV, AZ, CO, GA, NC, SC, VA, WV, TN, KY, MO, AR, MS, AL, WI, MN, IA, NE, KS, CT, MA, NJ, MD, DE, NH, VT, ME, RI, WY, ID, UT, AK, HI.

---

## PHASE 4 RESULTS: ~65% Verified

| Item | Verdict | Issue |
|------|---------|-------|
| 4.1 Accessorial Charges | **PARTIAL** | Logic correct but `accessorial_charges` table **DOES NOT EXIST** in MySQL or schema.ts |
| 4.2 Hazmat Surcharge | **PARTIAL** | Logic correct but `platform_fees` table **MISSING** + no HAZMAT_SURCHARGE config |
| 4.3 TONU Fee | **PASS** | Correct business logic (25%/$250 confirmed, 30%/$350 en_route + $75 deadhead) |
| 4.4 Partial Rate | **PASS** | Correct (in_transit=60%, loaded=50%, loading=40%, 5% platform fee) |
| 4.5 Escrow Release | **PASS** | Fully integrated with state machine |

### Phase 4 Fixes Required:

**FIX 4.1:** Add accessorial_charges table to schema.ts:
```typescript
export const accessorialCharges = mysqlTable("accessorial_charges", {
  id: serial("id").primaryKey(),
  loadId: int("loadId").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // e.g., 'TONU', 'detention', 'lumper', 'layover'
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "auto_approved", "rejected", "paid"]).default("pending"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow(),
  approvedAt: timestamp("approvedAt"),
  approvedBy: int("approvedBy"),
});
```
Then run `npx drizzle-kit push:mysql`.

**FIX 4.2:** After creating platform_fees table via migration, insert seed data:
```sql
INSERT INTO platform_fees (feeType, name, description, percentage, flatAmount, active, effectiveFrom)
VALUES ('HAZMAT_SURCHARGE', 'Hazmat Load Surcharge', 'Additional charge for hazardous materials transport', '2.500', '50.00', true, NOW());
```

**FIX 4.1+4.2 CRITICAL:** Replace all silent try-catch blocks:
```typescript
// REMOVE patterns like:
catch { /* table may not exist */ }

// REPLACE with:
catch (err: any) {
  console.error(`[Settlement] Failed to query accessorial_charges:`, err?.message);
  // Optionally throw to prevent silent data loss
}
```

---

## PHASE 5.1 RESULTS: ~60% Verified

| Item | Verdict | Issue |
|------|---------|-------|
| 5.1a /dispatch/create Route | **PASS** | App.tsx line 625 — route exists with guard(DISP) |
| 5.1b quickMode={true} Prop | **PASS** | Prop wired correctly to component |
| 5.1c quickMode Step Filtering | **FAIL** | isQuickMode assigned but **NEVER USED**. quickSteps array **NEVER CONSULTED**. Full 8-step wizard renders. |
| 5.1d Dispatch Menu Item | **PASS** | menuConfig.ts line 507 — "Quick 3-field load creation" |

### Phase 5.1 Fix Required:

**FIX 5.1c:** Add step filtering logic in LoadCreationWizard.tsx:
```typescript
// After line 297 (const isQuickMode = ...)
const activeSteps = isQuickMode && wizConfig.quickSteps
  ? STEPS.filter((_, idx) => wizConfig.quickSteps!.includes(idx))
  : STEPS;

// Then use activeSteps instead of STEPS everywhere:
// - Step indicator rendering (around line 962)
// - Step display logic (around line 957)
// - Next/Previous navigation
// - Step validation before advancing

// Also pre-fill default values in quick mode:
if (isQuickMode) {
  // Set sensible defaults for fields not shown in quick mode
  // e.g., default insurance level, default payment terms
}
```

---

## VERIFICATION PROTOCOL

After completing ALL fixes above, you MUST:

1. **Run `npx drizzle-kit push:mysql`** and provide output showing tables created
2. **Run `SHOW TABLES`** and provide output showing settlements, settlement_documents, platform_fees, accessorial_charges all exist
3. **Run `SHOW COLUMNS FROM loads`** and verify all 8 DOT hazmat columns exist
4. **Run `SELECT * FROM platform_fees WHERE feeType = 'HAZMAT_SURCHARGE'`** and show the configured fee
5. **Grep for dead code:** `grep -rn "COMMODITY_UNITS\[" src/` must return matches in rendering logic
6. **Grep for dead code:** `grep -rn "SEGREGATION_TABLE\[" src/` must return matches in validation logic
7. **Grep for dead code:** `grep -rn "STATE_RULES\[" src/` must return matches in route validation
8. **Grep for dead code:** `grep -rn "isQuickMode" src/` must return matches beyond the assignment line
9. **Grep for silent catches:** `grep -rn "catch {" src/` should return 0 results
10. **Build clean:** `npm run build` with 0 errors
11. **Commit, push to origin/main, rebuild dist/src-snapshot/, deploy to Azure**

Do NOT claim completion until steps 1-11 pass. Previous rounds have established a pattern of claiming completion before verification. This must stop.

---

## SCORE CARD

| Phase | Claimed | Verified | Gap |
|-------|---------|----------|-----|
| Phase 1 | 100% | ~45% | 55% |
| Phase 2 | 100% | ~25% | 75% |
| Phase 3 | 100% | ~83% | 17% |
| Phase 4 | 100% | ~65% | 35% |
| Phase 5.1 | 100% | ~60% | 40% |
| **OVERALL** | **100%** | **~42%** | **58%** |

**Bottom line:** The infrastructure is partially there — guards work, escrow works, TONU math is correct. But the deployment chain (migrations, table creation, config wiring, dead code integration) is broken. Fix the 8 blockers, wire the dead code, and verify with the 11-step protocol above.
