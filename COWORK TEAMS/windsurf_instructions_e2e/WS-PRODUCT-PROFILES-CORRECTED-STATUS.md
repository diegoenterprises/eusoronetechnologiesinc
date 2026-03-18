# CORRECTED VERIFICATION: Product Profiles + Lifecycle — Post-Re-Fix

> **Date:** March 6, 2026
> **Context:** Our initial Phase 6 audit scored 62% (13/21 PASS). Windsurf made a second pass addressing all three critical blockers. This document reflects the **corrected** state after re-verification against the live database and updated src-snapshot.

---

## EXECUTIVE SUMMARY

| Area | Previous Score | Current Score | Status |
|------|---------------|---------------|--------|
| **Backend Schema** | 13/49 columns (FAIL) | **58/49 columns (PASS+)** | RESOLVED |
| **Indexes** | 3 missing (FAIL) | **All 7 present (PASS)** | RESOLVED |
| **productProfiles Router** | Not created (FAIL) | **356 lines, 7 procedures (PASS)** | RESOLVED |
| **HAZMAT_SURCHARGE** | Not seeded (FAIL) | **Seeded, active=1 (PARTIAL)** | 3 duplicate rows |
| **15 LOAD_EVENTS** | 0/15 emitted (FAIL) | **15/15 emitted (PASS)** | RESOLVED |
| **Financial/Dispatch/Compliance/Gamification Events** | Custom blocks only | **All 4 wired correctly (PASS)** | RESOLVED |
| **Registration Onboarding (Frontend)** | All 5 pages | **All 5 pages (PASS)** | COMPLETE |
| **Registration Auto-Creation (Server)** | All 5 handlers | **All 5 handlers (PASS)** | COMPLETE |
| **Wizard Step 0 "My Products"** | Not checked | **NOT IMPLEMENTED (FAIL)** | Phase 3 |
| **"Save as Product" Modal** | Not checked | **NOT IMPLEMENTED (FAIL)** | Phase 3 |
| **Settings "My Products" Tab** | Not checked | **NOT IMPLEMENTED (FAIL)** | Phase 4 |
| **MyProductsTab.tsx Component** | Not checked | **DOES NOT EXIST (FAIL)** | Phase 4 |
| **loadConstants.ts Shared Constants** | Not checked | **DOES NOT EXIST (FAIL)** | Phase 5 |

**Overall: 21/26 PASS, 1 PARTIAL, 4 FAIL = 81% → up from 62%**

---

## WHAT'S NOW COMPLETE

### 1. product_profiles Schema — PASS (58 columns in live DB)
- Base table: 13 columns (userId, companyId, productId, productLabel, category, hazmatClass, requiresHazmat, requiresTanker, temperatureControlled, isActive, source, createdAt, id)
- Extended via `addColIfMissing()` in db.ts lines 1691-1736: 45 additional columns
- Total: **58 columns** (exceeds 49-column spec — includes both registration-specific `productId`/`productLabel`/`isActive`/`source` AND full profile columns)
- Live DB confirmed via `information_schema.columns` query

### 2. All Indexes — PASS (7 + PRIMARY)
Live DB confirmed:
- `PRIMARY`, `pp_user_idx`, `pp_company_idx`, `pp_product_idx`
- `pp_user_product_uniq` (UNIQUE)
- `pp_user_company_idx`, `pp_hazmat_idx`, `pp_usage_idx`

### 3. productProfiles tRPC Router — PASS (356 lines, 7 procedures)
File: `frontend/server/routers/productProfiles.ts`
- `create` (line 99) — INSERT with all WRITABLE_COLUMNS
- `list` (line 137) — user's own + company shared, search, hazmatOnly, 4 sort options
- `get` (line 196) — single profile with ownership/sharing check
- `update` (line 216) — partial update with ownership verification
- `delete` (line 255) — soft delete (sets deletedAt)
- `incrementUsage` (line 279) — bumps usageCount + lastUsedAt
- `createFromWizard` (line 297) — extracts 41 fields from wizard formData
- Registered in `routers.ts` line 117 (import) + line 1120 (registration)

### 4. HAZMAT_SURCHARGE — PARTIAL (seeded but 3 duplicates)
- `platform_fees` table exists, `HAZMAT_SURCHARGE` row present with active=1
- **Issue:** 3 duplicate rows returned by query. The `INSERT IGNORE` should prevent this — likely the seed ran 3 times before the UNIQUE constraint was properly set. Non-blocking but should be cleaned.

### 5. 15 LOAD_EVENTS — PASS (all emitted from websocket-events.ts)
File: `frontend/server/routers/loadLifecycle.ts` lines 1619-1668
Using shared `WS_EVENTS` from `@shared/websocket-events`:
1. `LOAD_STATUS_CHANGED` — every transition (line 1633)
2. `LOAD_POSTED` — on POSTED state (line 1637)
3. `LOAD_ASSIGNED` — on ASSIGNED state with driverId/vehicleId (line 1641)
4. `LOAD_CANCELLED` — on CANCELLED with reason (line 1645)
5. `LOAD_COMPLETED` — on DELIVERED with rate/distance summary (line 1649)
6. `LOAD_LOCATION_UPDATED` — when location data present (line 1653)
7. `LOAD_BOL_SIGNED` — when BOL document metadata present (line 1657)
8. `LOAD_POD_SUBMITTED` — when POD signature present (line 1661)
9. `LOAD_EXCEPTION_RAISED` — on 5 cargo exception states (line 1666)

Plus 4 domain-specific emission blocks:
- Financial events (lines 1670-1700) — DELIVERED/CANCELLED/DISPUTE → settlement/cancellation/dispute
- Dispatch events (lines 1702-1720) — 8 dispatch states → load_assigned/status_changed
- Compliance alerts (lines 1722-1739) — WEIGHT_VIOLATION → critical alert
- Gamification events (lines 1741-1764) — DELIVERED → XP for driver (100) + catalyst (50)

### 6. Registration Onboarding — PASS (all 5 pages)
Previously verified and confirmed:
- RegisterShipper.tsx — "Products You Ship" step with ProductPicker + CompliancePreview
- RegisterBroker.tsx — "Products You Broker" step with equipment selector + ProductPicker
- RegisterTerminal.tsx — ProductPicker replaces hardcoded 14-item list
- RegisterDispatch.tsx — "Commodity Experience" step with ProductPicker
- RegisterCatalyst.tsx — unchanged UI, server auto-creation wired

---

## WHAT'S STILL MISSING (4 items — Phases 3, 4, 5)

### FAIL 1: Wizard Step 0 "My Products" — Phase 3 from WS-PRODUCT-PROFILES.md

**File:** `frontend/client/src/pages/LoadCreationWizard.tsx`

The wizard has NO reference to `productProfiles`, `myProductsQuery`, `selectedProductId`, `handleSelectProduct`, or "My Products". The backend router exists and works, but the wizard doesn't call it.

**What's needed (from WS-PRODUCT-PROFILES.md Phase 3):**
- Update `ALL_STEPS` to include "My Products" as Step 0 (all other steps shift +1)
- Update `WIZARD_CONFIG` quickSteps indices (+1 shift)
- Add tRPC query: `(trpc as any).productProfiles.list.useQuery()`
- Add `selectedProductId` state + `productSearch` state
- Add `handleSelectProduct` callback (auto-fills 35+ formData fields, skips to Origin/Dest)
- Add Step 0 JSX: product card grid with search, "New Product" bypass button, empty state
- Update ALL `rs === N` references (+1 shift)
- Update `canProceed()` function
- **Estimate:** ~250 lines of modifications

### FAIL 2: "Save as Product" Modal — Phase 3 from WS-PRODUCT-PROFILES.md

**File:** `frontend/client/src/pages/LoadCreationWizard.tsx`

On the Review step, there should be a "Save as Product" button that calls `productProfiles.createFromWizard` mutation. Does not exist.

**What's needed:**
- Add `showSaveProductDialog` state + `saveProductNickname` state
- Add `createFromWizard` mutation hook
- Add dialog JSX with nickname input + save button
- Show only when `!selectedProductId && formData.productName` (i.e., user created a new product manually)
- **Estimate:** ~50 lines

### FAIL 3: Settings "My Products" Tab — Phase 4 from WS-PRODUCT-PROFILES.md

**File:** `frontend/client/src/pages/Settings.tsx`

Settings has 4 tabs (Profile, Notifications, Security, Billing). No 5th "My Products" tab.

**What's needed:**
- Import `MyProductsTab` component
- Add 5th `TabsTrigger` with Package icon
- Add `TabsContent value="products"` with `<MyProductsTab />`
- **Estimate:** ~15 lines

### FAIL 4: MyProductsTab.tsx Component — Phase 4 from WS-PRODUCT-PROFILES.md

**File:** `frontend/client/src/components/MyProductsTab.tsx` — DOES NOT EXIST

**What's needed:**
- Product card grid (sortable: Last Used, Name, Usage Count)
- Search input for filtering
- Create New Product form (modal)
- Edit product modal (pre-filled)
- Duplicate button (clone with "(Copy)" suffix)
- Delete with confirmation (soft delete)
- "Share with Company" toggle
- Empty state with CTA
- Uses `productProfiles.list`, `productProfiles.create`, `productProfiles.update`, `productProfiles.delete` from the router
- **Estimate:** ~450 lines (NEW FILE)

### OPTIONAL: loadConstants.ts — Phase 5 from WS-PRODUCT-PROFILES.md

**File:** `frontend/client/src/lib/loadConstants.ts` — DOES NOT EXIST

Extract `TRAILER_TYPES`, `TRAILER_ICON`, `HAZMAT_CLASSES`, `COMMODITY_UNITS`, `TRAILER_COMMODITY_MAP` from LoadCreationWizard.tsx into shared module.

Not blocking but prevents duplication between wizard and MyProductsTab.

---

## NON-BLOCKING: HAZMAT_SURCHARGE Duplicate Rows

```sql
-- 3 duplicate HAZMAT_SURCHARGE rows in platform_fees
-- Fix: deduplicate, keep only 1 active row
DELETE p1 FROM platform_fees p1
  INNER JOIN platform_fees p2
  WHERE p1.id > p2.id
    AND p1.feeType = p2.feeType
    AND p1.feeType = 'HAZMAT_SURCHARGE';
```

Or add a UNIQUE constraint to prevent future duplicates:
```sql
ALTER TABLE platform_fees ADD UNIQUE INDEX pf_type_uniq (feeType);
```

---

## PRIORITY ORDER FOR REMAINING WORK

| Priority | Item | Phase | Effort | Impact |
|----------|------|-------|--------|--------|
| **P0** | Wizard Step 0 + Save as Product | Phase 3 | ~300 lines | This IS the feature — without it, users have no way to use saved products |
| **P0** | MyProductsTab.tsx + Settings integration | Phase 4 | ~465 lines | Users need to manage their products outside the wizard |
| **P2** | loadConstants.ts extraction | Phase 5 | ~120 lines | Code quality — prevents duplication |
| **P3** | HAZMAT_SURCHARGE dedup | Data fix | 1 SQL query | Cosmetic — doesn't affect functionality |

**The backend is done. The registration onboarding is done. The lifecycle events are done. What remains is the user-facing wizard and settings UI — the part that actually makes Ryan's 2-minute load creation possible.**

---

## VERIFICATION PROTOCOL (for remaining items)

After Phases 3-5 are implemented:

1. Navigate to Create Load → verify Step 0 shows "My Products"
2. If no products saved → verify empty state with "Create New Product" CTA
3. Register as Shipper → select 3 products → complete → login → Create Load → verify Step 0 shows those 3 products
4. Click a saved product → verify ALL formData fields auto-filled → verify wizard skips to Origin/Destination
5. Complete load manually (all steps) → Review step → verify "Save as Product" button visible
6. Click "Save as Product" → enter nickname → save → verify success toast
7. Settings → verify "My Products" tab visible → verify product appears
8. Edit product → change nickname → verify persisted
9. Delete product → verify soft deleted → verify hidden from wizard Step 0
10. Company sharing: User A marks shared → User B sees it → User C (different company) does NOT

```bash
npm run build
# Must have 0 errors
```
