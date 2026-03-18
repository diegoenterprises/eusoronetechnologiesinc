# WINDSURF INSTRUCTION SET: 15-AGENT AUDIT REMEDIATION

**Source:** 15-Agent Master Audit (Alpha through Omicron)
**Priority:** Execute in EXACT order listed. Each section depends on prior sections.
**Platform:** EusoTrip — Eusorone Technologies, Inc.
**Author:** Mike "Diego" Usoro

---

## PHASE 1: SECURITY HARDENING (Execute FIRST — Production Blockers)

### FIX-S1: Remove Hardcoded Master Password [CRITICAL]
**File:** `frontend/server/_core/auth.ts`
**Line:** 158

FIND the hardcoded password check that allows "Esang2027!" to authenticate any test user. REMOVE IT ENTIRELY. In production, ALL users must authenticate through proper bcrypt password verification against the database. No backdoors.

Also search ALL other files for the string "Esang2027!" and remove every instance. There are at least 6 files containing this password.

### FIX-S2: Fix SQL Injection in Stripe Webhook Handler [CRITICAL]
**File:** `frontend/server/_core/index.ts`
**Lines:** 237-242

The Stripe webhook handler uses raw SQL string concatenation with payload data. REPLACE with parameterized queries using Drizzle ORM's prepared statements or `db.execute(sql`...`)` with proper parameter binding.

BEFORE (vulnerable):
```
Raw SQL concatenation with webhook event data
```

AFTER: Use Drizzle's parameterized query pattern:
```typescript
await db.execute(sql`UPDATE payments SET status = ${event.data.object.status} WHERE stripe_payment_intent_id = ${event.data.object.id}`)
```

### FIX-S3: Implement Real Stripe Webhook Verification [CRITICAL]
**File:** `frontend/server/_core/stripe.ts`
**Lines:** 221-229

REPLACE the placeholder function:
```typescript
// REMOVE THIS:
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  return true; // PLACEHOLDER
}

// REPLACE WITH:
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

export function verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  }
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
```

Add `STRIPE_WEBHOOK_SECRET` to environment variables. Get it from the Stripe Dashboard → Webhooks → Signing secret.

### FIX-S4: Disable Test User Bypass for Production [CRITICAL]
**File:** `frontend/server/_core/auth.ts`
**Lines:** 96-156

Wrap ALL test user logic in a development environment check:
```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

// Only allow test users in development
if (isDevelopment) {
  // existing test user logic here
}
```

In production (NODE_ENV=production), test users must NOT auto-authenticate.

### FIX-S5: Strong JWT Secret [HIGH]
**File:** `frontend/server/_core/auth.ts`
**Line:** ~12

CHANGE:
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
```
TO:
```typescript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
```

The application MUST NOT start without a proper JWT secret.

### FIX-S6: Add Rate Limiting to Auth Endpoints [HIGH]
**File:** `frontend/server/_core/index.ts` (or create `frontend/server/middleware/rateLimit.ts`)

Install `express-rate-limit`:
```bash
npm install express-rate-limit
```

Add rate limiting middleware BEFORE tRPC handler:
```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to auth routes
app.use('/api/trpc/auth.login', authLimiter);
app.use('/api/trpc/auth.register', authLimiter);
app.use('/api/trpc/auth.resetPassword', authLimiter);
```

### FIX-S7: Add Security Headers [HIGH]
**File:** `frontend/server/_core/index.ts`

Install `helmet`:
```bash
npm install helmet
```

Add BEFORE all other middleware:
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Required for styled-components/Tailwind
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https://api.stripe.com", "https://generativelanguage.googleapis.com"],
    },
  },
  crossOriginEmbedderPolicy: false, // For cross-origin image loading
}));
```

### FIX-S8: Move JWT to httpOnly Cookie [HIGH]
**File:** `frontend/server/_core/auth.ts` and `frontend/client/src/lib/auth.ts`

Currently JWT is stored in localStorage (XSS accessible). Move to httpOnly cookie:

Server-side (auth.ts login response):
```typescript
res.cookie('token', accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000, // 15 minutes
});
```

Client-side: Remove localStorage token storage. Let cookies handle auth automatically.

---

## PHASE 2: FINANCIAL INTEGRITY

### FIX-F1: Fix Payment Auto-Success [CRITICAL]
**File:** `frontend/server/routers/payments.ts`
**Lines:** 134-140

The `createPayment` procedure marks payments as "succeeded" without Stripe confirmation. CHANGE to:
1. Create Stripe PaymentIntent
2. Set status to "pending"
3. Only mark "succeeded" when Stripe webhook confirms (after FIX-S3 is done)

```typescript
// In createPayment:
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(input.amount * 100),
  currency: 'usd',
  metadata: { loadId: input.loadId, userId: ctx.user.id },
});

// Insert with PENDING status
await db.insert(payments).values({
  ...paymentData,
  status: 'pending',
  stripePaymentIntentId: paymentIntent.id,
});

// Status updates come from webhook handler (FIX-S3)
```

### FIX-F2: Implement Real Escrow Holds [HIGH]
**File:** `frontend/server/routers/wallet.ts` or create `frontend/server/services/escrow.ts`

Current escrow is database-status-only. Implement real Stripe fund holds:
```typescript
// When placing in escrow:
const paymentIntent = await stripe.paymentIntents.create({
  amount: amountInCents,
  currency: 'usd',
  capture_method: 'manual', // Authorize but don't capture
  metadata: { escrowId, loadId },
});

// When releasing escrow:
await stripe.paymentIntents.capture(paymentIntentId);

// When canceling escrow:
await stripe.paymentIntents.cancel(paymentIntentId);
```

### FIX-F3: Consistent Platform Fee Collection [HIGH]
**Files:** All payment flow routers (payments.ts, wallet.ts, settlementBatching.ts)

Audit every financial transaction flow. Ensure `platformFeeAmount` is calculated and deducted BEFORE funds reach the recipient. Use the existing platform_fees table to record each deduction.

Pattern for every payment:
```typescript
const feeConfig = await db.select().from(platformFees).where(eq(platformFees.feeType, transactionType));
const feeAmount = calculateFee(amount, feeConfig);
const netAmount = amount - feeAmount;

// Record the fee
await db.insert(platformFeeTransactions).values({
  transactionId, feeAmount, feeType: transactionType,
});

// Pay the recipient netAmount, not full amount
```

---

## PHASE 3: ROLE & PERMISSION FIXES

### FIX-R1: Add FACTORING to Database Enum [HIGH]
**File:** `frontend/drizzle/schema.ts`

Find the `userRole` mysqlEnum and add 'FACTORING':
```typescript
// Find this enum (search for mysqlEnum containing 'DRIVER', 'SHIPPER', etc.)
// ADD 'FACTORING' to the list
export const userRoleEnum = mysqlEnum('role', [
  'DRIVER', 'SHIPPER', 'BROKER', 'DISPATCHER', 'DISPATCH',
  'CATALYST', 'ESCORT', 'TERMINAL_MANAGER',
  'COMPLIANCE_OFFICER', 'SAFETY_MANAGER',
  'ADMIN', 'SUPER_ADMIN', 'FACTORING'  // <-- ADD THIS
]);
```

Run database migration to apply the enum change.

### FIX-R2: Fix SAFETY_OFFICER Typo [HIGH]
**File:** `frontend/client/src/config/menuConfig.ts`

FIND AND REPLACE ALL instances of `SAFETY_OFFICER` with `SAFETY_MANAGER`:
- Line 1521
- Line 1537
- Line 1552

### FIX-R3: Fix DISPATCHER Typo [HIGH]
**File:** `frontend/client/src/config/menuConfig.ts`

FIND AND REPLACE ALL instances of `DISPATCHER` with `DISPATCH`:
- Line 1567
- Line 1582
- Line 1597
- Line 1613

### FIX-R4: Add FACTORING to Permissions [HIGH]
**File:** `frontend/shared/permissions.ts`

1. Add 'FACTORING' to the UserRole type union
2. Add FACTORING permissions to ROLE_PERMISSIONS:
```typescript
FACTORING: [
  'view_invoices', 'manage_invoices', 'view_payments',
  'process_factoring', 'view_reports', 'manage_factoring_settings',
  'view_loads', 'view_carriers', 'view_shippers',
  'export_data', 'view_aging_reports'
],
```

### FIX-R5: Add FACTORING Test User [HIGH]
**File:** `frontend/server/_core/auth.ts`

Add to the test users array (within the isDevelopment block after FIX-S4):
```typescript
{ email: 'factoring@eusotrip.com', role: 'FACTORING', name: 'Factor Test User', companyId: 1 },
```

---

## PHASE 4: CORE BACKEND FIXES

### FIX-B1: Replace Hardcoded HOS Data [CRITICAL]
**File:** `frontend/server/routers/drivers.ts`
**Lines:** 180-207

REMOVE the hardcoded "6h 30m" response. REPLACE with actual ELD integration query:

```typescript
getHOSStatus: protectedProcedure
  .input(z.object({ driverId: z.number() }))
  .query(async ({ ctx, input }) => {
    // Query the actual ELD/HOS records from database
    const hosRecords = await db.select()
      .from(hosLogs)
      .where(and(
        eq(hosLogs.driverId, input.driverId),
        gte(hosLogs.logDate, new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)) // Last 8 days
      ))
      .orderBy(desc(hosLogs.logDate));

    // Calculate remaining hours based on 49 CFR 395
    const drivingHoursToday = calculateDrivingHours(hosRecords, 'today');
    const drivingHours8Day = calculateDrivingHours(hosRecords, '8day');

    return {
      dailyDrivingRemaining: Math.max(0, 11 - drivingHoursToday), // 11-hour limit
      dailyOnDutyRemaining: Math.max(0, 14 - calculateOnDutyHours(hosRecords, 'today')), // 14-hour limit
      cycleRemaining: Math.max(0, 70 - drivingHours8Day), // 70-hour/8-day limit
      lastRestartDate: findLastRestart(hosRecords),
      status: determineCurrentDutyStatus(hosRecords),
    };
  }),
```

If ELD data doesn't exist yet, return a clear "No ELD data available" response — NOT fake numbers.

### FIX-B2: Remove Dashboard Mock Data Fallback [CRITICAL]
**File:** `frontend/server/routers/dashboard.ts`
**Lines:** 47-90, 95-138

REMOVE `getSeedStats()` and `getSeedShipments()` functions entirely. When a database query fails, return a proper error — NOT fake data:

```typescript
// REMOVE: try { ... } catch { return getSeedStats(role); }
// REPLACE WITH:
try {
  const stats = await db.select()...;
  return stats;
} catch (error) {
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Unable to load dashboard data. Please try again.',
  });
}
```

### FIX-B3: Implement Admin Panel Procedures [CRITICAL]
**File:** `frontend/server/routers/admin.ts`

All 12 stub procedures must be connected to real database queries. For each:

**getWebhooks:** Query a `webhooks` table (create if needed) that stores configured webhook URLs
**getFeatureFlags:** Query a `feature_flags` table for runtime feature toggles
**getAPIKeys:** Query an `api_keys` table for third-party API key management (show masked values only)
**getScheduledTasks:** Query a `scheduled_tasks` table for cron jobs/background tasks
**getBackups:** Query Azure MySQL backup status via Azure SDK or admin API
**getSlowQueries:** Query MySQL's `performance_schema.events_statements_summary_by_digest` for slow queries

And corresponding mutations for create/delete/toggle operations.

### FIX-B4: Fix Billing Stubs [HIGH]
**File:** `frontend/server/routers/billing.ts`

**getAccessorialCharges (line 443):** Query the `accessorial_claims` table (it exists per MCP tools):
```typescript
getAccessorialCharges: protectedProcedure
  .input(z.object({ loadId: z.number().optional() }))
  .query(async ({ ctx, input }) => {
    const charges = await db.select()
      .from(accessorialClaims)
      .where(input.loadId ? eq(accessorialClaims.loadId, input.loadId) : eq(accessorialClaims.userId, ctx.user.id))
      .orderBy(desc(accessorialClaims.createdAt));
    return charges;
  }),
```

**upgradePlan (line 102):** Actually persist the plan change:
```typescript
upgradePlan: protectedProcedure
  .input(z.object({ plan: z.enum(['basic', 'professional', 'enterprise']) }))
  .mutation(async ({ ctx, input }) => {
    await db.update(users)
      .set({ subscriptionPlan: input.plan, updatedAt: new Date() })
      .where(eq(users.id, ctx.user.id));
    return { success: true, plan: input.plan };
  }),
```

---

## PHASE 5: AI & MOCK DATA REMEDIATION

### FIX-AI1: Replace Math.random() in Auto-Dispatch [CRITICAL]
**File:** `frontend/server/routers/esangAI.ts`
**Lines:** 145-160, 196-206

REMOVE all `Math.random() * 0.3 + 0.7` patterns. REPLACE with actual AI confidence:

```typescript
// Call Gemini to evaluate dispatch match
const evaluation = await esangAI.evaluateDispatchMatch({
  load: loadDetails,
  carrier: carrierDetails,
  historicalPerformance: await getCarrierPerformance(carrierId),
});

const confidence = evaluation.confidenceScore; // Real AI-derived score
const shouldAutoDispatch = confidence >= 0.85 && evaluation.safetyScore >= 0.9;
```

If AI integration is not ready, use a RULES-BASED system (not random):
```typescript
function calculateDispatchConfidence(load, carrier) {
  let score = 0;
  if (carrier.hazmatCertified && load.isHazmat) score += 0.3;
  if (carrier.trailerTypes.includes(load.trailerType)) score += 0.2;
  if (carrier.safetyRating >= 'Satisfactory') score += 0.2;
  if (carrier.insuranceCurrent) score += 0.15;
  if (carrier.completedLoads > 100) score += 0.15;
  return score;
}
```

### FIX-AI2: Replace ALL Math.random() in Business Logic [CRITICAL]
**Files (search globally for `Math.random()`):**

| File | Replace With |
|---|---|
| ComplianceRulesAutomation.ts | Real DB queries against compliance records |
| AnomalyMonitor.ts | Statistical analysis of actual transaction data |
| PhotoInspectionAI.ts | Real Gemini Vision API for photo analysis |
| MobileCommandCenter.ts | Real DB queries for missions/HOS/earnings |
| pricing/*.ts | Market rate calculations from actual load data |

For EVERY `Math.random()` found in a business logic context:
1. Identify what data the random value is simulating
2. Replace with a real database query or API call that provides that data
3. If real data isn't available yet, return `null` or `{ status: 'unavailable' }` — NOT random numbers

### FIX-AI3: Remove Console.log Statements [MEDIUM]
Search entire codebase for `console.log` — there are 741 instances.

Replace with a proper logging framework:
```bash
npm install winston
```

Create `frontend/server/services/logger.ts`:
```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ level: 'warn' }), // Only warn+ to console
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

Replace `console.log` with `logger.info`, `console.error` with `logger.error`, etc.

### FIX-AI4: Replace Placeholder Text [MEDIUM]
Search for: "Coming soon", "Lorem ipsum", "TODO", "FIXME", "placeholder", "test data", "sample"

For each instance:
- If it's UI text: Replace with actual copy describing the feature
- If it's a code TODO: Either implement the TODO or document it as a known limitation
- If it's sample data: Replace with either real data queries or helpful empty states

---

## PHASE 6: WEBSOCKET ACTIVATION

### FIX-WS1: Wire WebSocket Emitters to Routers [HIGH]
**Files:** ALL routers in `frontend/server/routers/`
**Service:** `frontend/server/services/socketService.ts`

For EVERY state-changing mutation in a router, add the corresponding WebSocket emit AFTER the database operation succeeds.

Example pattern (loads.ts — after status update):
```typescript
updateLoadStatus: protectedProcedure
  .input(z.object({ loadId: z.number(), status: z.string() }))
  .mutation(async ({ ctx, input }) => {
    await db.update(loads).set({ status: input.status }).where(eq(loads.id, input.loadId));

    // EMIT WebSocket event
    socketService.emitLoadStatusUpdate(input.loadId, {
      status: input.status,
      updatedBy: ctx.user.id,
      timestamp: new Date(),
    });

    return { success: true };
  }),
```

Priority emitters to wire FIRST:
1. `emitLoadStatusUpdate` — in loads.ts (every status change)
2. `emitBidPlaced` / `emitBidAccepted` — in bids/loads router
3. `emitPaymentProcessed` — in payments.ts
4. `emitWalletTransaction` — in wallet.ts
5. `emitDriverLocationUpdate` — in tracking/drivers router
6. `emitDispatchAssignment` — in dispatch router
7. `emitComplianceAlert` — in compliance router
8. `emitMissionComplete` / `emitRewardEarned` — in gamification router

### FIX-WS2: Import WebSocket Hooks into Components [HIGH]
**Files:** Frontend components in `frontend/client/src/pages/`

For every page that displays real-time data, import and use the appropriate hook:

```typescript
// In LoadTrackingPage.tsx:
import { useLoadUpdates } from '@/hooks/useWebSocket';

function LoadTrackingPage({ loadId }) {
  const { data: loadUpdate } = useLoadUpdates(loadId);
  // Use loadUpdate to display real-time status
}

// In MessagingCenter.tsx — REPLACE polling:
// REMOVE: refetchInterval: 3000
// ADD: useRealtimeMessages hook
import { useRealtimeMessages } from '@/hooks/useRealtimeEvents';

function MessagingCenter() {
  const { messages, isConnected } = useRealtimeMessages(conversationId);
  // Real-time messaging instead of 3-second polling
}
```

### FIX-WS3: Remove Duplicate WebSocket Implementation [MEDIUM]
**File:** `frontend/server/_core/websocket.ts` (1,189 lines)

This entire file is dead code — a parallel raw `ws` implementation that conflicts with Socket.io. DELETE this file. The canonical WebSocket implementation is `socketService.ts` + `socket/index.ts`.

### FIX-WS4: Replace In-Memory Connection Tracking [HIGH]
**File:** `frontend/server/socket/index.ts`

Replace `connectedUsers` Map with Redis:
```typescript
// REMOVE: const connectedUsers = new Map();
// REPLACE WITH Redis adapter (already optional — make required):
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));

// Track connected users in Redis
async function trackConnection(userId: string, socketId: string) {
  await pubClient.hSet('connected_users', userId, socketId);
}

async function removeConnection(userId: string) {
  await pubClient.hDel('connected_users', userId);
}
```

---

## PHASE 7: DATABASE INTEGRITY

### FIX-DB1: Add Foreign Key Constraints [HIGH]
**File:** `frontend/drizzle/schema.ts`

Add FK constraints to ALL tables that reference other tables. Critical FKs first:

```typescript
// Example for payments table:
export const payments = mysqlTable('payments', {
  id: serial('id').primaryKey(),
  userId: int('user_id').notNull().references(() => users.id),
  loadId: int('load_id').references(() => loads.id),
  // ... other fields
});

// Example for wallet_transactions:
export const walletTransactions = mysqlTable('wallet_transactions', {
  id: serial('id').primaryKey(),
  walletId: int('wallet_id').notNull().references(() => wallets.id),
  senderId: int('sender_id').references(() => users.id),
  recipientId: int('recipient_id').references(() => users.id),
  // ... other fields
});
```

Run migration. If existing data violates FK constraints, clean up orphaned records FIRST.

### FIX-DB2: Add Missing Tables to Schema [HIGH]
**File:** `frontend/drizzle/schema.ts`

83 tables exist in the database but are missing from schema.ts. Priority additions:
1. All FMCSA SODA tables (~13) — needed for carrier safety queries
2. Gamification tables (~8) — needed for The Haul features
3. Compliance tables (~6) — needed for compliance monitoring
4. Terminal operations tables (~5)

For each missing table, run `DESCRIBE tablename` against the database and create the corresponding Drizzle schema definition.

### FIX-DB3: Populate relations.ts [MEDIUM]
**File:** `frontend/drizzle/relations.ts`

Define ALL table relationships for Drizzle's query builder:
```typescript
import { relations } from 'drizzle-orm';
import { users, loads, bids, payments, wallets, companies, ... } from './schema';

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, { fields: [users.companyId], references: [companies.id] }),
  loads: many(loads),
  bids: many(bids),
  payments: many(payments),
  wallet: one(wallets),
}));

export const loadsRelations = relations(loads, ({ one, many }) => ({
  shipper: one(users, { fields: [loads.shipperId], references: [users.id] }),
  driver: one(users, { fields: [loads.driverId], references: [users.id] }),
  bids: many(bids),
  payments: many(payments),
}));

// Continue for ALL tables with relationships
```

### FIX-DB4: Increase Connection Pool [CRITICAL]
**File:** Database connection configuration (db.ts or similar)

CHANGE pool size from 30 to at least 150:
```typescript
const pool = mysql.createPool({
  connectionLimit: 150, // Was 30, Azure allows 300
  waitForConnections: true,
  queueLimit: 0,
  // ... other options
});
```

---

## PHASE 8: PERFORMANCE OPTIMIZATION

### FIX-P1: Add Pagination to All List Endpoints [HIGH]
**Files:** Every router that returns arrays of records

Standard pagination pattern:
```typescript
.input(z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  // ... existing inputs
}))
.query(async ({ input }) => {
  const offset = (input.page - 1) * input.limit;
  const [items, countResult] = await Promise.all([
    db.select().from(table).limit(input.limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(table),
  ]);
  return {
    items,
    total: countResult[0].count,
    page: input.page,
    totalPages: Math.ceil(countResult[0].count / input.limit),
  };
});
```

### FIX-P2: Implement Code Splitting [HIGH]
**File:** `frontend/client/src/App.tsx` (or main router file)

Use React.lazy for route-level code splitting:
```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const LoadCreationWizard = lazy(() => import('./pages/LoadCreationWizard'));
const MessagingCenter = lazy(() => import('./pages/MessagingCenter'));
const Settings = lazy(() => import('./pages/Settings'));
const TheHaul = lazy(() => import('./pages/TheHaul'));
// ... all other pages

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        {/* ... */}
      </Routes>
    </Suspense>
  );
}
```

### FIX-P3: Add Redis Caching Layer [HIGH]
Create `frontend/server/services/cache.ts`:

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export async function getCached<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const data = await fetcher();
  await redis.setex(key, ttlSeconds, JSON.stringify(data));
  return data;
}
```

Apply to frequently-accessed queries:
- Dashboard stats: 60s TTL
- FMCSA carrier data: 3600s TTL
- User profiles: 300s TTL
- Platform fee configs: 600s TTL

### FIX-P4: Optimize FMCSA Queries [CRITICAL]
For the 36M+ record FMCSA tables:

1. Add composite indexes for common query patterns:
```sql
CREATE INDEX idx_fmcsa_carriers_dot ON fmcsa_carriers(dot_number);
CREATE INDEX idx_fmcsa_carriers_name ON fmcsa_carriers(legal_name(50));
CREATE INDEX idx_fmcsa_inspections_carrier ON fmcsa_inspections(carrier_id, inspection_date);
```

2. Create materialized views (MySQL doesn't have native MV, use scheduled events):
```sql
CREATE TABLE fmcsa_carrier_summary AS
SELECT carrier_id, COUNT(*) as total_inspections,
  SUM(CASE WHEN oos_flag = 'Y' THEN 1 ELSE 0 END) as oos_count,
  MAX(inspection_date) as last_inspection
FROM fmcsa_inspections GROUP BY carrier_id;

-- Refresh daily via MySQL event
CREATE EVENT refresh_fmcsa_summary
ON SCHEDULE EVERY 1 DAY
DO REPLACE INTO fmcsa_carrier_summary SELECT ...;
```

3. Add full-text search for typeahead:
```sql
ALTER TABLE fmcsa_carriers ADD FULLTEXT INDEX ft_carrier_name (legal_name, dba_name);
```

---

## PHASE 9: ATTRIBUTION & BRANDING

### FIX-ATTR1: Remove Claude/AI Attribution [HIGH]

**File: docs/CLAUDE_COWORK_TEAM_DELEGATION.md**
- RENAME file to `docs/TEAM_DELEGATION.md`
- REMOVE line 203: "Generated by Claude Cowork · March 4, 2026"
- REPLACE with: "EusoTrip — Eusorone Technologies, Inc. | Developed by Mike 'Diego' Usoro"

**File: frontend/server/_core/index.ts**
- Line 1019: REMOVE any Claude Cowork MCP reference
- REPLACE with: "EusoTrip Internal Service"

**File: frontend/server/services/mcpServer.ts**
- Lines 2-8: REPLACE "MCP SERVER — Model Context Protocol for Claude Cowork"
- WITH: "EusoTrip Service Protocol — Eusorone Technologies, Inc."

**File: frontend/server/_core/esangAI.ts**
- Line 1373: UPDATE EusoContract attribution to "Powered by ESANG AI — Eusorone Technologies, Inc."
- KEEP all Gemini API references (legitimate API usage)
- KEEP all OpenAI API references (legitimate fallback API usage)

**Search globally for:** "claude", "windsurf", "anthropic", "ai-generated", "ai-coded"
Remove any that imply AI was used to code the platform. KEEP references to AI as a product FEATURE (ESANG AI is a user-facing feature — that's fine).

### FIX-ATTR2: Add Proper Attribution
Add to `package.json`:
```json
{
  "author": "Mike 'Diego' Usoro <diego@eusorone.com>",
  "company": "Eusorone Technologies, Inc.",
  "homepage": "https://eusotrip.com"
}
```

Add footer attribution to the main layout component:
```typescript
<footer className="text-xs text-muted-foreground text-center py-2">
  EusoTrip — Eusorone Technologies, Inc. | Austin, Texas
</footer>
```

---

## PHASE 10: COMPLIANCE REMEDIATION

### FIX-COMP1: Replace Fake Compliance Rule Checkers [CRITICAL]
**File:** `frontend/server/services/ComplianceRulesAutomation.ts`

ALL 5 rule checkers use Math.random(). Replace each with real database queries:

```typescript
// Example: HOS compliance check
async checkHOSCompliance(driverId: number) {
  const hosLogs = await db.select()
    .from(hosLogsTable)
    .where(eq(hosLogsTable.driverId, driverId))
    .orderBy(desc(hosLogsTable.logDate))
    .limit(30); // Last 30 days

  const violations = [];

  // Check 11-hour driving limit
  for (const day of groupByDay(hosLogs)) {
    const drivingHours = day.reduce((sum, log) => sum + log.drivingMinutes / 60, 0);
    if (drivingHours > 11) {
      violations.push({
        type: 'HOS_11_HOUR',
        date: day[0].logDate,
        actual: drivingHours,
        limit: 11,
        regulation: '49 CFR 395.3(a)(3)',
      });
    }
  }

  // Check 14-hour on-duty limit
  // Check 70-hour/8-day limit
  // Check 30-minute break requirement

  return { driverId, compliant: violations.length === 0, violations };
}
```

### FIX-COMP2: Implement Hazmat Shipping Paper PDF [HIGH]
The system classifies hazmat correctly but cannot generate required DOT shipping papers.

Create `frontend/server/services/shippingPaperGenerator.ts`:
```typescript
// Use a PDF library (pdfkit or jspdf) to generate DOT-compliant shipping papers
// Must include: proper shipping name, hazard class, UN number, packing group,
// quantity, emergency contact, and all 49 CFR 172.200 requirements
```

---

## PHASE 11: GEOPOLITICAL ENHANCEMENTS

### FIX-GEO1: Intra-Week Fuel Price Updates [HIGH]
**File:** `frontend/server/services/fuelPriceService.ts`

Add a secondary fuel price source that updates more frequently than weekly EIA data:

```typescript
// Add daily NYMEX/WTI crude price tracking
async function getDailyOilPrice(): Promise<number> {
  // Query a commodities API (Alpha Vantage, Quandl, or similar)
  // If crude jumps > 5% in a day, trigger alert
  const response = await fetch(`https://api.commodity-source.com/crude-oil/daily`);
  return response.json();
}

// Auto-trigger fuel surcharge recalculation when crude spikes
async function checkForPriceSpike() {
  const current = await getDailyOilPrice();
  const lastKnown = await getLastRecordedPrice();
  const change = (current - lastKnown) / lastKnown;

  if (Math.abs(change) > 0.05) { // 5% change
    await recalculateAllActiveFuelSurcharges();
    await notifyShippersOfSurchargeChange(change);
  }
}
```

### FIX-GEO2: Dynamic Hot Zone Creation [HIGH]
**File:** `frontend/server/routers/hotZones.ts`

Currently 18 static hot zones. Add ability for ADMIN/SUPER_ADMIN to create dynamic hot zones:

```typescript
createHotZone: protectedProcedure
  .input(z.object({
    name: z.string(),
    type: z.enum(['weather', 'conflict', 'infrastructure', 'demand', 'regulatory']),
    region: z.object({ lat: z.number(), lng: z.number(), radiusMiles: z.number() }),
    surgeMultiplier: z.number().min(1).max(5),
    expiresAt: z.date().optional(),
    description: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    // Create dynamic hot zone
    // Auto-apply surge pricing to loads in affected area
    // Notify affected drivers and shippers
  }),
```

---

## PHASE 12: FRONTEND PAGE COMPLETION

### Priority Order for Empty Pages

**Tier 1 — Revenue-Generating Roles:**
1. FACTORING module (10 pages): Invoice management, payment processing, aging reports, factoring dashboard
2. BROKER pages (15 pages): Carrier vetting, margin tracking, load board, broker dashboard
3. CATALYST pages (12 pages): Territory management, shipper-carrier matching, commission tracking

**Tier 2 — Operational Roles:**
4. TERMINAL_MANAGER pages (8 pages): Dock management, queue visualization, yard inventory
5. DISPATCH advanced pages (8 pages): Fleet overview, route optimization, multi-load planning

**Tier 3 — Specialized Roles:**
6. ESCORT pages (10 pages): Convoy coordination, route planning, permit management
7. COMPLIANCE_OFFICER advanced pages (6 pages): Audit management, violation tracking, reporting
8. SAFETY_MANAGER pages: Inspection management, incident tracking, safety scoring

For EACH empty page:
1. Query what data the role needs (from the RBAC permission mapping in Kappa's findings)
2. Build the appropriate tRPC query hooks
3. Create functional React components with proper data display
4. Include search, sort, filter, and pagination
5. Match the existing brand design system (shadcn/ui, Blue→Magenta gradient, Gilroy font)

---

## PHASE 13: GAMIFICATION INTEGRATION

### FIX-GAM1: Integrate The Haul into Core Workflows [HIGH]

The Haul (gamification) is currently a standalone page. Integrate into daily workflows:

1. **Load Completion:** After driver delivers a load, show mission progress overlay
2. **Settlement:** After payment, show earnings toward current mission goal
3. **Compliance:** Award points for clean inspections, on-time deliveries
4. **Messaging:** Show badge/level next to user name in messages
5. **Dashboard:** Add gamification widget (current mission, XP bar, next reward)

```typescript
// After every load status change to 'delivered':
async function checkMissionProgress(userId: number, loadId: number) {
  const activeMissions = await db.select().from(missions)
    .where(and(eq(missions.userId, userId), eq(missions.status, 'active')));

  for (const mission of activeMissions) {
    const progress = await calculateMissionProgress(mission, loadId);
    if (progress.completed) {
      await completeMission(mission.id, userId);
      socketService.emitMissionComplete(userId, mission);
      socketService.emitRewardEarned(userId, mission.reward);
    }
  }
}
```

---

## VERIFICATION CHECKLIST

After ALL fixes applied, verify:

- [ ] Login with test users works (dev only) — no master password
- [ ] Login fails with wrong password (no bypass)
- [ ] Stripe webhook rejects forged requests
- [ ] SQL injection attempt blocked
- [ ] FACTORING role can be assigned to users
- [ ] SAFETY_MANAGER menu items appear correctly
- [ ] DISPATCH menu items appear correctly
- [ ] HOS shows real data (or "unavailable" — not fake)
- [ ] Dashboard shows error on DB failure (not fake data)
- [ ] Admin panel procedures return real data
- [ ] Payments go through Stripe (not auto-succeed)
- [ ] WebSocket events fire on load status changes
- [ ] Messaging uses WebSocket (not polling)
- [ ] All Math.random() removed from business logic
- [ ] No "Claude", "Windsurf", or "AI-coded" references remain
- [ ] Console.log replaced with logger
- [ ] FK constraints exist on critical tables
- [ ] Connection pool at 150+
- [ ] FMCSA queries respond in < 2 seconds
- [ ] Code splitting reduces initial bundle

---

**Total Fixes: 52 items across 13 phases**
**Estimated Total Effort: ~480 hours**
**Recommended Timeline: 12 weeks (one developer) or 4 weeks (three developers)**

---

*EusoTrip — Eusorone Technologies, Inc. | Austin, Texas*
*Developed by Mike "Diego" Usoro*
