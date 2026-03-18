# WINDSURF INSTRUCTION: Critical Audit Fixes
## Priority: IMMEDIATE — Execute Before Any Other Work
### EusoTrip Platform — Post-Audit Remediation

**Context:** A full platform audit found 7 CRITICAL issues, 7 HIGH issues, and 6 MEDIUM issues. This instruction addresses ALL critical and high-priority fixes. Execute in order.

---

## FIX C1: Stripe Webhook Signature Verification (CRITICAL SECURITY)

**File:** `frontend/server/_core/stripe.ts`
**Problem:** `verifyWebhookSignature()` ALWAYS returns `true` — allows fake webhook injection
**Line:** ~270

**Find this code:**
```typescript
export function verifyWebhookSignature(payload: string | Buffer, signature: string): boolean {
  // TODO: Implement proper verification
  return true;
}
```

**Replace with:**
```typescript
import crypto from 'crypto';

export function verifyWebhookSignature(payload: string | Buffer, signature: string): boolean {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Stripe] STRIPE_WEBHOOK_SECRET not configured — rejecting webhook');
    return false;
  }
  if (!payload || !signature) {
    console.error('[Stripe] Missing payload or signature — rejecting webhook');
    return false;
  }

  try {
    // Parse Stripe signature header: "t=timestamp,v1=signature"
    const elements = signature.split(',');
    const timestampElement = elements.find(e => e.startsWith('t='));
    const signatureElement = elements.find(e => e.startsWith('v1='));

    if (!timestampElement || !signatureElement) {
      console.error('[Stripe] Invalid signature format — rejecting webhook');
      return false;
    }

    const timestamp = timestampElement.substring(2);
    const receivedSignature = signatureElement.substring(3);

    // Compute expected signature using HMAC-SHA256
    const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');
    const signedPayload = `${timestamp}.${payloadString}`;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const receivedBuffer = Buffer.from(receivedSignature, 'hex');

    if (expectedBuffer.length !== receivedBuffer.length) {
      console.error('[Stripe] Signature length mismatch — rejecting webhook');
      return false;
    }

    const isValid = crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

    // Verify timestamp is within 5-minute tolerance (prevent replay attacks)
    const currentTime = Math.floor(Date.now() / 1000);
    const webhookTime = parseInt(timestamp, 10);
    const FIVE_MINUTES = 300;

    if (Math.abs(currentTime - webhookTime) > FIVE_MINUTES) {
      console.error('[Stripe] Webhook timestamp too old — potential replay attack');
      return false;
    }

    if (!isValid) {
      console.error('[Stripe] Signature mismatch — rejecting webhook');
    }

    return isValid;
  } catch (error) {
    console.error('[Stripe] Webhook verification error:', error instanceof Error ? error.message : error);
    return false;
  }
}
```

**Add to `.env`:**
```
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret_here
```

---

## FIX C2: Payment Validation Through Stripe (CRITICAL SECURITY)

**File:** `frontend/server/routers/payments.ts`
**Problem:** `createPayment` marks status "succeeded" without calling Stripe API
**Lines:** ~134-140

**Find this code (approximate):**
```typescript
createPayment: protectedProcedure
  .input(z.object({ recipientId: z.number(), amount: z.string().regex(/^\d+(\.\d{1,2})?$/), loadId: z.number().optional(), description: z.string().optional() }))
  .mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new Error("Database not available");
    await db.insert(payments).values({ payerId: ctx.user.id, payeeId: input.recipientId, loadId: input.loadId, amount: input.amount, currency: "USD", paymentType: "load_payment", status: "succeeded" });
    return { success: true };
  }),
```

**Replace with:**
```typescript
createPayment: protectedProcedure
  .input(z.object({
    recipientId: z.number(),
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
    loadId: z.number().optional(),
    description: z.string().optional(),
    paymentMethodId: z.string().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const amountCents = Math.round(parseFloat(input.amount) * 100);
    if (amountCents < 50) throw new Error("Minimum payment amount is $0.50");

    // Step 1: Create payment record as "pending"
    const [paymentRecord] = await db.insert(payments).values({
      payerId: ctx.user.id,
      payeeId: input.recipientId,
      loadId: input.loadId || null,
      amount: input.amount,
      currency: "USD",
      paymentType: "load_payment",
      status: "pending",
      description: input.description || null,
    }).returning();

    try {
      // Step 2: Create Stripe PaymentIntent
      const stripe = (await import('../_core/stripe')).getStripe();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        description: input.description || `EusoTrip payment #${paymentRecord.id}`,
        metadata: {
          eusotrip_payment_id: paymentRecord.id.toString(),
          payer_id: ctx.user.id.toString(),
          payee_id: input.recipientId.toString(),
          load_id: input.loadId?.toString() || '',
        },
        ...(input.paymentMethodId ? { payment_method: input.paymentMethodId, confirm: true } : {}),
      });

      // Step 3: Update payment record based on Stripe response
      if (paymentIntent.status === 'succeeded') {
        await db.update(payments)
          .set({ status: "succeeded", stripePaymentIntentId: paymentIntent.id })
          .where(eq(payments.id, paymentRecord.id));
        return { success: true, paymentId: paymentRecord.id, stripeId: paymentIntent.id };
      } else if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_confirmation') {
        await db.update(payments)
          .set({ status: "pending", stripePaymentIntentId: paymentIntent.id })
          .where(eq(payments.id, paymentRecord.id));
        return { success: false, requiresAction: true, clientSecret: paymentIntent.client_secret, paymentId: paymentRecord.id };
      } else {
        await db.update(payments)
          .set({ status: "failed", stripePaymentIntentId: paymentIntent.id })
          .where(eq(payments.id, paymentRecord.id));
        return { success: false, error: "Payment could not be completed" };
      }
    } catch (error: any) {
      // Step 4: Mark failed if Stripe errors
      console.error('[createPayment] Stripe error:', error?.message);
      await db.update(payments)
        .set({ status: "failed" })
        .where(eq(payments.id, paymentRecord.id));
      throw new Error(error?.message || "Payment processing failed");
    }
  }),
```

---

## FIX C3: Add Settlements Table to Schema (CRITICAL)

**File:** `frontend/drizzle/schema.ts`
**Problem:** `settlementBatching.ts` references a `settlements` table that doesn't exist
**Location:** Add after the `payments` table definition

**Add this table:**
```typescript
export const settlements = mysqlTable('settlements', {
  id: int('id').primaryKey().autoincrement(),
  batchId: varchar('batch_id', { length: 36 }).notNull(), // UUID batch identifier
  carrierId: int('carrier_id').notNull(),
  driverId: int('driver_id'),
  loadId: int('load_id'),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  status: varchar('status', { length: 32 }).notNull().default('pending'), // pending, processing, completed, failed, disputed
  paymentMethod: varchar('payment_method', { length: 50 }), // ach, wire, check, wallet
  stripeTransferId: varchar('stripe_transfer_id', { length: 255 }),
  settlementDate: datetime('settlement_date'),
  periodStart: datetime('period_start').notNull(),
  periodEnd: datetime('period_end').notNull(),
  lineItems: json('line_items'), // Array of { loadId, amount, type, description }
  deductions: json('deductions'), // Array of { type, amount, description } — fuel advances, equipment, insurance
  grossAmount: decimal('gross_amount', { precision: 12, scale: 2 }),
  deductionTotal: decimal('deduction_total', { precision: 12, scale: 2 }),
  netAmount: decimal('net_amount', { precision: 12, scale: 2 }),
  notes: text('notes'),
  approvedBy: int('approved_by'),
  approvedAt: datetime('approved_at'),
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
}, (table) => ({
  batchIdx: index('idx_settlements_batch').on(table.batchId),
  carrierIdx: index('idx_settlements_carrier').on(table.carrierId),
  statusIdx: index('idx_settlements_status').on(table.status),
  periodIdx: index('idx_settlements_period').on(table.periodStart, table.periodEnd),
}));
```

**Also update `frontend/server/routers/settlementBatching.ts`** — ensure it imports and uses `settlements` from schema:
```typescript
import { settlements } from '../../drizzle/schema';
```

---

## FIX C4: Move Hardcoded Passwords to Environment Variables (CRITICAL SECURITY)

**Files to modify:**
1. `frontend/api-server.js` (lines 10, 114)
2. `frontend/serve.py` (lines 17, 135)
3. `frontend/server/_core/auth.ts` (line 158)

**In each file, find:**
```
"Esang2027!"
```

**Replace with:**
```javascript
// In JS/TS files:
process.env.MASTER_PASSWORD
```
```python
# In Python files:
os.environ.get('MASTER_PASSWORD')
```

**Remove ALL test user email bypasses.** Find any code like:
```typescript
if (email === 'test@eusotrip.com' || email === 'admin@eusotrip.com') { /* bypass */ }
```
And remove the bypass entirely. All authentication must go through proper validation.

**Add to `.env`:**
```
MASTER_PASSWORD=<generate_strong_password_here>
```

---

## FIX C5: Remove Claude/AI Attribution (CRITICAL)

**File:** `docs/CLAUDE_COWORK_TEAM_DELEGATION.md`

**Find at end of file (~line 203):**
```
*Generated by Claude Cowork · March 4, 2026*
```

**Replace with:**
```
*EusoTrip — Developed by Eusorone Technologies, Inc. in Texas. Coded by Mike "Diego" Usoro.*
```

**Global search across entire codebase for any of these strings and remove/replace:**
- `"claude"` (case-insensitive) — replace context with "Eusorone Technologies"
- `"anthropic"` — remove
- `"Generated by"` + AI tool name — replace with Eusorone attribution
- `"AI-generated"` or `"ai generated"` — remove
- `"windsurf"` in comments — remove

---

## FIX C6: Remove .windsurf Directory

**Action:** Add to `.gitignore` and remove from tracking:
```bash
echo ".windsurf/" >> frontend/.gitignore
git rm -r --cached frontend/.windsurf/
```

---

## FIX C7: Fix SAFETY_OFFICER Typo (CRITICAL — 3 Features Broken)

**File:** `frontend/client/src/config/menuConfig.ts`

**Line 1521 — Find:**
```typescript
const PHOTO_INSP_ROLES = new Set(['CATALYST', 'DRIVER', 'COMPLIANCE_OFFICER', 'SAFETY_OFFICER', 'ADMIN', 'SUPER_ADMIN']);
```
**Replace with:**
```typescript
const PHOTO_INSP_ROLES = new Set(['CATALYST', 'DRIVER', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER', 'ADMIN', 'SUPER_ADMIN']);
```

**Line 1537 — Find:**
```typescript
const COMPLIANCE_RULES_ROLES = new Set(['COMPLIANCE_OFFICER', 'SAFETY_OFFICER', 'CATALYST', 'ADMIN', 'SUPER_ADMIN']);
```
**Replace with:**
```typescript
const COMPLIANCE_RULES_ROLES = new Set(['COMPLIANCE_OFFICER', 'SAFETY_MANAGER', 'CATALYST', 'ADMIN', 'SUPER_ADMIN']);
```

**Line 1552 — Find:**
```typescript
const ANOMALY_ROLES = new Set(['ADMIN', 'SUPER_ADMIN', 'COMPLIANCE_OFFICER', 'SAFETY_OFFICER']);
```
**Replace with:**
```typescript
const ANOMALY_ROLES = new Set(['ADMIN', 'SUPER_ADMIN', 'COMPLIANCE_OFFICER', 'SAFETY_MANAGER']);
```

---

## FIX H1: Replace Math.random() Business IDs (HIGH)

**Global rule: Replace ALL `Math.random()` used for business logic with proper alternatives.**

### Pattern A: Random IDs → crypto.randomUUID()
**Find (all files):**
```typescript
Math.floor(Math.random() * 9000 + 1000)
```
**Replace with:**
```typescript
import { randomUUID } from 'crypto';
// Use: randomUUID() for string IDs
// Use: database auto-increment for numeric IDs
```

### Pattern B: Random Confidence Scores → Real Model Output or Honest Fallback
**File:** `frontend/server/routers/esangAI.ts` (lines 145-160, 196-206)

**Find:**
```typescript
confidence: Math.random() * 0.3 + 0.7
```
**Replace with:**
```typescript
confidence: null, // AI model confidence not yet available — do NOT fake it
confidenceSource: 'pending_ml_integration',
```

### Pattern C: Random Pricing → Data-Driven or Configuration-Based
**File:** `frontend/server/routers/contextualPricing.ts`

Remove all `Math.random()` multipliers. Replace with:
```typescript
// Use actual market data from fuelPriceService, or configurable base rates
const basePricePerMile = parseFloat(process.env.BASE_RATE_PER_MILE || '3.50');
// Apply real surcharges from fscEngine
```

---

## FIX H2: AnomalyMonitor — Replace Fake Detection (HIGH)

**File:** `frontend/server/services/AnomalyMonitor.ts` (lines 51-177)

**Problem:** ALL detection functions use `Math.random() > threshold` to probabilistically generate fake anomalies.

**Fix approach:** Replace random generation with real database queries:

```typescript
// BEFORE (fake):
async checkForAnomalies(carrierId: number) {
  if (Math.random() > 0.8) {
    return { anomalyDetected: true, type: 'safety_spike', severity: 'high' };
  }
  return { anomalyDetected: false };
}

// AFTER (real):
async checkForAnomalies(carrierId: number) {
  const db = await getDb();
  if (!db) return { anomalyDetected: false, error: 'Database unavailable' };

  // Check for actual data anomalies
  const recentIncidents = await db.select()
    .from(safetyIncidents)
    .where(and(
      eq(safetyIncidents.carrierId, carrierId),
      gte(safetyIncidents.createdAt, sql`DATE_SUB(NOW(), INTERVAL 30 DAY)`)
    ));

  const historicalAvg = await db.select({ avg: sql<number>`AVG(incident_count)` })
    .from(carrierSafetyMetrics)
    .where(eq(carrierSafetyMetrics.carrierId, carrierId));

  const currentCount = recentIncidents.length;
  const avgCount = historicalAvg[0]?.avg || 0;

  // Real anomaly: current period > 2x historical average
  if (currentCount > avgCount * 2 && currentCount > 3) {
    return {
      anomalyDetected: true,
      type: 'safety_spike',
      severity: currentCount > avgCount * 3 ? 'critical' : 'high',
      detail: `${currentCount} incidents in 30 days vs ${avgCount.toFixed(1)} average`,
    };
  }

  return { anomalyDetected: false };
}
```

Apply this same pattern to ALL functions in the file: replace `Math.random()` with actual database queries against relevant tables.

---

## FIX H3: MobileCommandCenter — Replace Synthetic Data (HIGH)

**File:** `frontend/server/services/MobileCommandCenter.ts` (lines 98-180)

Replace `generateActiveMission()`, `generateHOS()`, `generateEarnings()` with real database queries:

```typescript
// BEFORE: generateActiveMission() returns random mission data
// AFTER: Query actual active loads for the driver
async getActiveMission(driverId: number) {
  const db = await getDb();
  if (!db) return null;

  const activeLoad = await db.select()
    .from(loads)
    .where(and(
      eq(loads.driverId, driverId),
      inArray(loads.status, ['assigned', 'in_transit', 'at_pickup', 'at_delivery'])
    ))
    .orderBy(desc(loads.updatedAt))
    .limit(1);

  if (!activeLoad.length) return null;

  return {
    loadNumber: activeLoad[0].loadNumber,
    status: activeLoad[0].status,
    origin: activeLoad[0].originCity,
    destination: activeLoad[0].destinationCity,
    pickupDate: activeLoad[0].pickupDate,
    deliveryDate: activeLoad[0].deliveryDate,
    cargoType: activeLoad[0].commodityType,
    hazmatClass: activeLoad[0].hazmatClass,
  };
}
```

---

## FIX H4: ComplianceRulesAutomation — Replace Random Violations (HIGH)

**File:** `frontend/server/services/ComplianceRulesAutomation.ts` (lines 90-204)

Replace each check function with real database queries:

```typescript
// checkHOS() — query actual HOS records
async checkHOS(driverId: number) {
  const db = await getDb();
  const hosRecords = await db.select()
    .from(hosLogs)
    .where(and(
      eq(hosLogs.driverId, driverId),
      gte(hosLogs.logDate, sql`DATE_SUB(NOW(), INTERVAL 8 DAY)`)
    ));
  // Calculate actual driving hours, check against 11-hour/14-hour/70-hour limits
  // Return real violations, not random ones
}

// checkMedicalCerts() — query actual cert expiration dates
async checkMedicalCerts(driverId: number) {
  const db = await getDb();
  const certs = await db.select()
    .from(driverCertifications)
    .where(eq(driverCertifications.driverId, driverId));
  // Check actual expiration dates against current date
  // Return certs expiring within 30/60/90 days
}
```

---

## FIX H5: PhotoInspectionAI — Honest Fallback (HIGH)

**File:** `frontend/server/services/PhotoInspectionAI.ts` (lines 94-130)

**If no actual AI model is integrated yet, be honest about it:**

```typescript
async analyzePhoto(imageUrl: string, inspectionType: string) {
  // Phase 1: Manual review required (AI model integration pending)
  return {
    analysisComplete: false,
    requiresManualReview: true,
    message: 'Photo captured successfully. Manual inspection review required.',
    photoUrl: imageUrl,
    inspectionType: inspectionType,
    capturedAt: new Date().toISOString(),
    // Do NOT generate fake defects with Math.random()
  };
}
```

---

## FIX H6: Wire Platform Fee Collection (HIGH)

**File:** `frontend/server/routers/billing.ts` (lines 458-500)

The platform fee calculation exists but fees are never actually collected via Stripe Connect.

**Add application fee to Stripe PaymentIntent creation:**
```typescript
// When creating a payment for a load, include the platform fee
const platformFeePercent = await getPlatformFeeRate(); // from platform_fees table
const applicationFeeAmount = Math.round(amountCents * platformFeePercent / 100);

const paymentIntent = await stripe.paymentIntents.create({
  amount: amountCents,
  currency: 'usd',
  application_fee_amount: applicationFeeAmount,
  transfer_data: {
    destination: carrierStripeAccountId,
  },
});
```

---

## FIX H7: Create Voice ESANG Backend Router (HIGH)

**New file:** `frontend/server/routers/voiceESANG.ts`

The frontend (`VoiceESANGPage.tsx`) expects:
- `voiceESANG.processVoiceCommand` — receives text from speech recognition, runs through ESANG AI
- `voiceESANG.getCommandHelp` — returns available voice commands for the user's role

```typescript
import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { processESANGQuery } from '../_core/esangAI';

export const voiceESANGRouter = router({
  processVoiceCommand: protectedProcedure
    .input(z.object({
      transcript: z.string().min(1),
      context: z.object({
        currentPage: z.string().optional(),
        activeLoadId: z.number().optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Pass voice transcript to ESANG AI engine
      const result = await processESANGQuery({
        userId: ctx.user.id,
        role: ctx.user.role,
        query: input.transcript,
        context: input.context,
        inputType: 'voice',
      });

      return {
        response: result.response,
        actions: result.actions || [],
        confidence: result.confidence,
        spokenResponse: result.response, // For text-to-speech
      };
    }),

  getCommandHelp: protectedProcedure
    .query(async ({ ctx }) => {
      const roleCommands: Record<string, string[]> = {
        DRIVER: [
          "What's my next pickup?",
          "Start pre-trip inspection",
          "Report emergency",
          "Check my hours",
          "Navigate to delivery",
        ],
        DISPATCHER: [
          "Show unassigned loads",
          "Find available drivers near Dallas",
          "Assign load to driver",
          "Check fleet status",
        ],
        SHIPPER: [
          "Create a new load",
          "Check load status",
          "Show my active shipments",
          "Get rate quote",
        ],
        // Add per-role commands...
      };

      return {
        commands: roleCommands[ctx.user.role] || roleCommands['SHIPPER'],
        tip: 'Speak naturally — ESANG understands conversational commands.',
      };
    }),
});
```

**Register in `frontend/server/routers.ts`:**
```typescript
import { voiceESANGRouter } from './routers/voiceESANG';
// In the appRouter:
voiceESANG: voiceESANGRouter,
```

---

## VERIFICATION CHECKLIST

After applying all fixes, verify:

- [ ] `verifyWebhookSignature()` returns `false` when given invalid signature
- [ ] `createPayment` creates a Stripe PaymentIntent before marking "succeeded"
- [ ] `SELECT * FROM settlements LIMIT 1` — table exists
- [ ] No file contains the string "Esang2027!" in plaintext
- [ ] No file contains "Generated by Claude" or similar AI attribution
- [ ] `.windsurf/` is not in the repository
- [ ] Safety Manager can see Photo Inspection, Compliance Rules, and Anomaly Monitor in menu
- [ ] No `Math.random()` used for business IDs, confidence scores, or pricing
- [ ] AnomalyMonitor queries real data instead of generating random anomalies
- [ ] Voice ESANG page loads without router error
- [ ] Platform fees are applied as Stripe Connect application fees

---

*EusoTrip — Developed by Eusorone Technologies, Inc. in Texas. Coded by Mike "Diego" Usoro.*
