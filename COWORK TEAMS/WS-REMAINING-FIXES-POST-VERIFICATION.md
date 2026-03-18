# WINDSURF INSTRUCTION SET: REMAINING FIXES POST-VERIFICATION

**Source:** 15-Agent Verification Audit (March 9, 2026)
**Context:** Windsurf deployed 2 commits. 15 agents re-scanned the entire codebase. This document contains ONLY the issues that remain unfixed.
**Priority:** Execute in EXACT order. STOP-SHIP items first.

---

## STOP-SHIP FIXES (Must complete before ANY real users)

### SS-1: Remove Master Password from ALL Files [CRITICAL]

The password `Esang2027!` is hardcoded in 5 locations:

**File 1:** `frontend/api-server.js` line 10
```
FIND: const MASTER_PASSWORD = "Esang2027!";
DELETE THIS ENTIRE LINE and all login logic that references MASTER_PASSWORD
```

**File 2:** `frontend/api-server.js` line 114
```
FIND: console.log('Login: Diego / Esang2027!');
DELETE THIS LINE
```

**File 3:** `frontend/serve.py` line 17
```
FIND: MASTER_PASSWORD = "Esang2027!"
DELETE THIS LINE and all authentication logic referencing it
```

**File 4:** `frontend/serve.py` line 135
```
FIND: print("Login: Diego / Esang2027!")
DELETE THIS LINE
```

**File 5:** `docs/CLAUDE_COWORK_TEAM_DELEGATION.md` line 11
```
FIND: Master Password for ALL accounts: Esang2027!
DELETE THIS ENTIRE LINE — never document passwords in source
```

### SS-2: Rotate All Exposed API Keys [CRITICAL]

Every key in `frontend/.env` is compromised if this file has ever been committed to git. Generate NEW keys for ALL of the following:

1. **STRIPE_SECRET_KEY** — Regenerate in Stripe Dashboard → Developers → API Keys
2. **VITE_STRIPE_PUBLISHABLE_KEY** — Regenerate alongside secret key
3. **GEMINI_API_KEY** — Regenerate in Google AI Studio
4. **FMCSA_WEBKEY / FMCSA_API_KEY** — Regenerate at FMCSA portal
5. **FRED_API_KEY** — Regenerate at FRED (Federal Reserve) portal
6. **EIA_API_KEY** — Regenerate at EIA portal
7. **VITE_OPENWEATHER_API_KEY** — Regenerate at OpenWeatherMap
8. **VITE_IPGEO_API_KEY** — Regenerate at IPGeolocation

After rotation, store ALL keys in Azure Key Vault (integration already exists at `frontend/server/services/azure/key-vault.ts`). Remove plaintext values from .env.

### SS-3: Replace Math.random() in Compliance Rule Checkers [CRITICAL]

**File:** `frontend/server/services/ComplianceRulesAutomation.ts`

ALL 5 rule checkers use Math.random() to generate fake violations. Replace each with real database queries:

**checkHOS():** Query `hos_logs` or ELD data table for actual driving hours per driver. Compare against 11-hour, 14-hour, and 70-hour limits per 49 CFR 395.

**checkDVIR():** Query `inspections` table for actual DVIR submissions. Flag missing reports and uncorrected defects.

**checkCDLMedical():** Query `driver_documents` or equivalent for CDL/medical certificate expiration dates. Flag expired and expiring-within-30-days.

**checkDrugAlcohol():** Query compliance testing records for overdue random tests and missing pre-employment screens.

**checkInsuranceAuthority():** Query `insurance_policies` or carrier data for actual expiration dates.

Pattern for each:
```typescript
async function checkHOS(): Promise<ComplianceCheckResult> {
  const db = await getDb();
  if (!db) return { score: 0, findings: [{ description: 'Database unavailable' }] };

  const drivers = await db.select().from(driversTable)
    .where(eq(driversTable.status, 'active'));

  const findings = [];
  for (const driver of drivers) {
    const hosLogs = await db.select().from(hosLogsTable)
      .where(and(
        eq(hosLogsTable.driverId, driver.id),
        gte(hosLogsTable.logDate, new Date(Date.now() - 8 * 86400000))
      ));

    const todayDriving = calculateDrivingHours(hosLogs, 'today');
    if (todayDriving > 11) {
      findings.push({
        id: `hos-${driver.id}`,
        description: `Driver ${driver.name} exceeded 11-hour limit: ${todayDriving.toFixed(1)}h`,
        severity: 'critical',
        regulation: '49 CFR 395.3(a)(3)',
      });
    }
  }

  return {
    score: findings.length === 0 ? 100 : Math.max(0, 100 - findings.length * 10),
    findings,
  };
}
```

### SS-4: Replace Math.random() in AI Confidence [CRITICAL]

**File:** `frontend/server/routers/esangAI.ts`

**Lines 145-160 (auto-dispatch):**
REMOVE: `const confidence = Math.random() * 0.3 + 0.7;`
REPLACE with rules-based scoring:
```typescript
function calculateDispatchConfidence(load: any, carrier: any): number {
  let score = 0;
  if (carrier.hazmatCertified && load.isHazmat) score += 0.25;
  if (carrier.trailerTypes?.includes(load.trailerType)) score += 0.20;
  if (carrier.safetyRating === 'Satisfactory' || carrier.safetyRating === 'Conditional') score += 0.15;
  if (carrier.insuranceCurrent) score += 0.15;
  if (carrier.completedLoads > 50) score += 0.10;
  if (carrier.onTimeRate > 0.9) score += 0.10;
  if (carrier.oosRate < 0.05) score += 0.05;
  return Math.min(1.0, score);
}
```

Also fix lines 154-155 (fake reasoning):
REMOVE: `Route compatibility: ${(Math.random() * 20 + 80).toFixed(1)}%`
REPLACE with actual calculations from carrier/load data.

**Lines 196-206 (auto-approve):**
Same pattern — replace random confidence with actual approval rate query from historical data.

### SS-5: Replace Math.random() in Photo Inspection [CRITICAL]

**File:** `frontend/server/services/PhotoInspectionAI.ts`

REMOVE the random pass/fail logic (line 94). REPLACE with actual Gemini Vision API call:
```typescript
async function analyzeInspectionPhoto(photoUrl: string, pointId: string): Promise<PhotoAnalysisResult> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return { condition: 'UNKNOWN', confidence: 0, defects: [], note: 'AI analysis unavailable' };
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: `Analyze this vehicle inspection photo for ${pointId}. Identify any defects, damage, or safety issues. Rate condition as PASS, MARGINAL, or FAIL.` },
          { inlineData: { mimeType: 'image/jpeg', data: await fetchImageAsBase64(photoUrl) } }
        ]
      }]
    })
  });

  // Parse Gemini response into structured result
}
```

If Gemini Vision is not yet integrated, return `{ condition: 'MANUAL_REVIEW_REQUIRED' }` — NOT random results.

### SS-6: Replace Math.random() in Anomaly Monitor [CRITICAL]

**File:** `frontend/server/services/AnomalyMonitor.ts`

11 instances of Math.random() gate whether anomalies are reported. REMOVE ALL random gates. Replace with threshold-based detection against actual data:

```typescript
// INSTEAD OF: if (Math.random() > 0.4) { report anomaly }
// USE:
const lateDeliveries = await db.select({ count: sql`count(*)` })
  .from(loads)
  .where(and(
    eq(loads.status, 'delivered'),
    gt(loads.actualDeliveryDate, loads.scheduledDeliveryDate)
  ));

if (lateDeliveries[0].count > threshold) {
  anomalies.push({ category: 'delivery', description: `${lateDeliveries[0].count} late deliveries detected` });
}
```

### SS-7: Fix Hardcoded HOS Data [CRITICAL]

**File:** `frontend/server/routers/drivers.ts` lines 180-207

REMOVE the entire hardcoded return block. REPLACE with:
```typescript
getHOSStatus: protectedProcedure
  .query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

    const hosData = await db.select()
      .from(hosLogs)
      .where(eq(hosLogs.driverId, ctx.user.id))
      .orderBy(desc(hosLogs.logDate))
      .limit(30);

    if (hosData.length === 0) {
      return {
        status: 'no_data',
        message: 'No ELD data available. Connect your ELD device to track hours.',
        drivingRemaining: null,
        onDutyRemaining: null,
        cycleRemaining: null,
      };
    }

    // Calculate actual hours from ELD records
    return calculateHOSFromRecords(hosData);
  }),
```

### SS-8: Remove Dashboard Mock Data Fallback [HIGH]

**File:** `frontend/server/routers/dashboard.ts`

REMOVE `getSeedStats()` function (around line 1670) and `getSeedShipments()` (around line 1685).

In the getStats procedure, REMOVE the silent fallback:
```typescript
// REMOVE: default: return getSeedStats(role);
// REPLACE WITH:
default:
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Unable to load dashboard data. Please try again.',
  });
```

---

## WEEK 1 FIXES (Critical functionality)

### W1-1: Implement Centralized Logger [HIGH]

Windsurf claimed this was done but it wasn't. Actually build it:

```bash
cd frontend && npm install winston
```

Create `frontend/server/services/logger.ts`:
```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'eusotrip' },
  transports: [
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

Then ACTUALLY replace all 2,029 console statements with logger calls. Use find-and-replace:
- `console.log(` → `logger.info(`
- `console.error(` → `logger.error(`
- `console.warn(` → `logger.warn(`

### W1-2: Wire WebSocket Emitters to Routers [HIGH]

Only 3 of 42 emitters are currently called. Wire the remaining 39.

**Architecture note:** Routers are split between two WebSocket systems:
- `socketService.ts` (42 emitters, 3 called)
- `_core/websocket.ts` (used by dispatch, convoy, gamification, messaging)

**Step 1:** Consolidate. Pick ONE system (recommend socketService.ts since it's Socket.io-based).
**Step 2:** Migrate all `websocket.ts` callers to use `socketService.ts` equivalents.
**Step 3:** Wire remaining emitters in their corresponding routers.

Priority wiring order:
1. `emitPaymentReceived` / `emitWalletUpdate` → in wallet.ts and payments.ts
2. `emitLoadBoardUpdate` → in loads.ts on every status change
3. `emitDispatchAssignment` → in dispatch.ts
4. `emitComplianceAlert` → in compliance routers
5. `emitGeofenceTriggered` → in tracking/location routers
6. `emitTerminalQueueUpdate` → in terminal routers

### W1-3: Switch MessagingCenter to WebSocket [HIGH]

**File:** `frontend/client/src/pages/MessagingCenter.tsx`

REMOVE polling:
```typescript
// REMOVE: refetchInterval: 6000  (line 44)
// REMOVE: refetchInterval: 3000  (line 48)
```

ADD WebSocket subscription:
```typescript
import { useRealtimeMessages } from '@/hooks/useRealtimeEvents';

// Inside component:
const { messages: realtimeMessages } = useRealtimeMessages(selectedConversation);

// Use realtimeMessages for display, with tRPC as initial data source
```

### W1-4: Implement Admin Panel Procedures [HIGH]

**File:** `frontend/server/routers/admin.ts`

12 stub procedures return empty arrays. Implement each:

- `getWebhooks` → Create webhooks table, query it
- `getFeatureFlags` → Create feature_flags table, query it
- `getAPIKeys` → Create api_keys table (store masked values only)
- `getScheduledTasks` → Query MySQL event scheduler or create tasks table
- `getBackups` → Query Azure MySQL backup status via Azure SDK
- `getSlowQueries` → Already partially implemented (performance_schema) — just ensure it works

### W1-5: Add Foreign Key Constraints [HIGH]

**File:** `frontend/drizzle/schema.ts`

Add `.references()` to ALL tables that reference other tables. Start with financial tables:

```typescript
// payments table
payerId: int('payer_id').notNull().references(() => users.id),
payeeId: int('payee_id').references(() => users.id),
loadId: int('load_id').references(() => loads.id),

// wallet_transactions
walletId: int('wallet_id').notNull().references(() => wallets.id),

// bids
loadId: int('load_id').notNull().references(() => loads.id),
bidderId: int('bidder_id').notNull().references(() => users.id),
```

Run `npx drizzle-kit generate:mysql` then `npx drizzle-kit push:mysql` to apply.

**Warning:** Clean up orphaned records FIRST or the migration will fail.

---

## WEEK 2 FIXES (Completion & Polish)

### W2-1: Build Escort Pages
Empty directory at `frontend/client/src/pages/escort/`. Create:
- EscortDashboard.tsx — Job overview, active convoy status
- ConvoyManagement.tsx — Convoy formation, route planning
- PermitTracking.tsx — Oversized load permit management
- RouteVisualization.tsx — Map-based escort route display

### W2-2: Build Catalyst Pages
Empty directory at `frontend/client/src/pages/catalyst/`. Create:
- CatalystDashboard.tsx — Territory overview, active matches
- ShipperCarrierMatching.tsx — Match shipper loads to carriers
- CommissionTracking.tsx — Commission earned per match
- TerritoryManagement.tsx — Geographic territory boundaries

### W2-3: Add Pagination to List Endpoints
Every router returning arrays needs pagination:
```typescript
.input(z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
}))
```

### W2-4: Implement Hazmat Shipping Paper PDF
Create `frontend/server/services/shippingPaperGenerator.ts` using pdfkit. Must include all 49 CFR 172.200 required fields.

### W2-5: Remove 4 Remaining Claude References
1. Rename `docs/CLAUDE_COWORK_TEAM_DELEGATION.md` → `docs/TEAM_DELEGATION.md`
2. Remove "Claude Cowork" from `frontend/server/_core/index.ts` line 1026
3. Rewrite header in `frontend/server/services/mcpServer.ts` lines 2-3
4. Update line 203 in the delegation doc

### W2-6: Increase Connection Pool
**File:** `frontend/server/db.ts` line 28
```
CHANGE: connectionLimit: 30
TO: connectionLimit: 150
```

### W2-7: Add DOMPurify for XSS Prevention
```bash
npm install dompurify @types/dompurify
```
Fix `frontend/_archive/pages/KnowledgeBase.tsx` line 90 to sanitize HTML.

### W2-8: Populate relations.ts
**File:** `frontend/drizzle/relations.ts`
Define ALL table relationships for Drizzle ORM. This enables type-safe joins and eager loading.

### W2-9: Implement MobileCommandCenter with Real Data
**File:** `frontend/server/services/MobileCommandCenter.ts`
Replace generateActiveMission(), generateHOS(), and generateEarnings() with actual database queries — not Math.random().

---

## VERIFICATION CHECKLIST

After ALL fixes, verify:

- [ ] `Esang2027` returns ZERO search results across entire codebase
- [ ] `Math.random()` returns ZERO results in compliance/anomaly/inspection/AI files
- [ ] `console.log` count is under 50 (only in logger initialization)
- [ ] All 42 WebSocket emitters have at least 1 caller
- [ ] MessagingCenter uses WebSocket (no refetchInterval)
- [ ] Admin panel procedures return real data
- [ ] HOS returns real ELD data or "unavailable"
- [ ] Dashboard throws error on DB failure (no fake data)
- [ ] FK constraints exist on payments, wallets, bids, loads tables
- [ ] Connection pool is 150+
- [ ] No "Claude" or "Windsurf" references in production code
- [ ] Escort and catalyst directories have real pages

---

**Total Remaining Fixes: 28 items**
**Estimated Effort: ~240 hours (6 weeks single dev, 2 weeks with 3 devs)**

---

*EusoTrip — Eusorone Technologies, Inc. | Austin, Texas*
*Developed by Mike "Diego" Usoro*
