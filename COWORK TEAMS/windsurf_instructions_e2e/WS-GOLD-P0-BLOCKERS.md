# WS-GOLD-P0-BLOCKERS — 8 Critical Blockers Before Customer Demos

**Status:** 0/8 implemented
**Total Estimated Hours:** ~60h
**Prerequisite:** Complete before AMJ Energy, Momentum Crude, or Blue Wing demos

---

## BLOCKER 1: Account Closure & Deactivation (8h)

### Problem
Zero account management endpoints. Users cannot close accounts, admins cannot deactivate non-compliant carriers. Violates GDPR Article 17 and CCPA.

### Implementation
Add to `frontend/server/routers/users.ts`:

```typescript
closeAccount: protectedProcedure
  .input(z.object({ reason: z.string().optional(), confirmPassword: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // 1. Verify password
    // 2. Check no active loads (prevent closure mid-transit)
    // 3. Settle all pending financial obligations
    // 4. Soft-delete: set user.status = 'closed', user.closedAt = now()
    // 5. Anonymize PII (name → "Deleted User", email → hash, phone → null)
    // 6. Log to audit_logs: action='ACCOUNT_CLOSED', userId, reason
    // 7. Revoke all sessions
    // 8. Send confirmation email
  }),

deactivateAccount: adminProcedure
  .input(z.object({ userId: z.number(), reason: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // 1. Set user.status = 'deactivated'
    // 2. Remove from all active load assignments
    // 3. Notify user via email
    // 4. Log to audit_logs: action='ACCOUNT_DEACTIVATED', adminId, targetUserId, reason
    // 5. Revoke sessions
  }),

reactivateAccount: adminProcedure
  .input(z.object({ userId: z.number() }))
  .mutation(async ({ ctx, input }) => {
    // Reverse deactivation
  }),
```

### Schema Changes
```typescript
// Add to users table in schema.ts:
status: varchar('status', { length: 20 }).default('active'), // active, deactivated, closed, suspended
closedAt: timestamp('closed_at'),
closedReason: text('closed_reason'),
deactivatedAt: timestamp('deactivated_at'),
deactivatedBy: int('deactivated_by'),
```

### Verification
```
search_code "closeAccount" in users.ts — must find mutation
search_code "deactivateAccount" in users.ts — must find mutation
SQL: DESCRIBE users — must show status, closedAt columns
```

---

## BLOCKER 2: Password Reset Flow (6h)

### Problem
Zero password reset endpoints. Users locked out permanently.

### Implementation
Add to `frontend/server/routers/users.ts` or create `security.ts`:

```typescript
requestPasswordReset: publicProcedure
  .input(z.object({ email: z.string().email() }))
  .mutation(async ({ input }) => {
    // 1. Find user by email
    // 2. Generate crypto token (crypto.randomBytes(32).toString('hex'))
    // 3. Store in password_reset_tokens table (token, userId, expiresAt: now + 1h)
    // 4. Send email with reset link
    // 5. Rate limit: max 3 requests per email per hour
    // Return { success: true } regardless (prevent email enumeration)
  }),

resetPassword: publicProcedure
  .input(z.object({ token: z.string(), newPassword: z.string().min(8) }))
  .mutation(async ({ input }) => {
    // 1. Lookup token in password_reset_tokens
    // 2. Check not expired
    // 3. Hash new password
    // 4. Update user.passwordHash
    // 5. Delete all reset tokens for this user
    // 6. Revoke all sessions
    // 7. Send confirmation email
    // 8. Log to audit_logs: action='PASSWORD_RESET'
  }),
```

### Schema
```typescript
export const passwordResetTokens = mysqlTable('password_reset_tokens', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  token: varchar('token', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Verification
```
search_code "requestPasswordReset" — must find mutation
search_code "resetPassword" — must find mutation
SQL: SELECT table_name WHERE table_name = 'password_reset_tokens' — must return 1 row
```

---

## BLOCKER 3: Two-Factor Authentication (8h)

### Problem
Zero MFA/2FA for any of the 12 roles. Single password compromise = unauthorized hazmat shipments.

### Implementation
```bash
npm install otplib qrcode
```

Add to `frontend/server/routers/security.ts` (or users.ts):

```typescript
setupMFA: protectedProcedure
  .mutation(async ({ ctx }) => {
    // 1. Generate TOTP secret (otplib.authenticator.generateSecret())
    // 2. Store in mfa_secrets table (userId, secret, enabled: false)
    // 3. Generate QR code (otpauth://totp/EusoTrip:email?secret=xxx&issuer=EusoTrip)
    // 4. Return { secret, qrCodeDataUrl }
  }),

verifyMFA: protectedProcedure
  .input(z.object({ token: z.string().length(6) }))
  .mutation(async ({ ctx, input }) => {
    // 1. Get secret from mfa_secrets
    // 2. Verify with otplib.authenticator.verify({ token, secret })
    // 3. If first verify: set enabled = true (activation)
    // 4. If login verify: set lastVerified = now
    // 5. Generate backup codes (10 codes, store hashed)
    // Return { verified: true, backupCodes?: [...] }
  }),

disableMFA: protectedProcedure
  .input(z.object({ password: z.string(), token: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Verify password + TOTP, then delete mfa_secrets row
  }),
```

### Schema
```typescript
export const mfaSecrets = mysqlTable('mfa_secrets', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().unique(),
  secret: varchar('secret', { length: 64 }).notNull(),
  enabled: boolean('enabled').default(false),
  backupCodes: text('backup_codes'), // JSON array of hashed codes
  lastVerified: timestamp('last_verified'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Verification
```
search_code "setupMFA" — must find mutation
search_code "otplib\|authenticator" — must find import
SQL: SELECT table_name WHERE table_name = 'mfa_secrets' — must return 1 row
```

---

## BLOCKER 4: Financial Idempotency Keys (6h)

### Problem
Zero idempotency protection. Network timeout → client retry → double payment on releaseEscrow, transferP2p, requestCashAdvance.

### Implementation
Add to `wallet.ts` (and loadLifecycle.ts for settlements):

```typescript
// Add idempotencyKey to every financial mutation input:
releaseEscrow: protectedProcedure
  .input(z.object({
    loadId: z.string(),
    idempotencyKey: z.string().uuid(), // Client generates UUID
  }))
  .mutation(async ({ ctx, input }) => {
    const db = await getDb();

    // 1. Check idempotency table first
    const existing = await db.select().from(idempotencyKeys)
      .where(eq(idempotencyKeys.key, input.idempotencyKey))
      .limit(1);

    if (existing.length > 0) {
      return JSON.parse(existing[0].response); // Return cached response
    }

    // 2. Execute the actual mutation
    const result = await doReleaseEscrow(input.loadId);

    // 3. Store result in idempotency table
    await db.insert(idempotencyKeys).values({
      key: input.idempotencyKey,
      endpoint: 'releaseEscrow',
      userId: ctx.user.id,
      response: JSON.stringify(result),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h TTL
    });

    return result;
  }),
```

### Schema
```typescript
export const idempotencyKeys = mysqlTable('idempotency_keys', {
  id: int('id').primaryKey().autoincrement(),
  key: varchar('key', { length: 64 }).notNull().unique(),
  endpoint: varchar('endpoint', { length: 100 }).notNull(),
  userId: int('user_id').notNull(),
  response: text('response').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  keyIdx: index('ik_key_idx').on(t.key),
}));
```

Apply to: `releaseEscrow`, `transferP2p`, `requestCashAdvance`, `processSettlement`, `walletDeposit`, `walletWithdraw`

### Verification
```
search_code "idempotencyKey" in wallet.ts — expect 6+ matches
search_code "idempotency_keys" in schema.ts — expect table definition
SQL: SELECT table_name WHERE table_name = 'idempotency_keys' — must return 1 row
```

---

## BLOCKER 5: Settlement PDF Generation (8h)

### Problem
Settlement records exist in DB but never exported. No legal proof of settlement terms.

### Implementation
```bash
npm install pdfkit
```

Create `frontend/server/services/settlementPDF.ts`:
- Generate branded PDF with: load details, rates, accessorials, deductions, platform fees, net payout
- Store in Azure Blob Storage (or local file system initially)
- Reference in settlement record (add documentUrl column)

Call from `loadLifecycle.ts` after settlement creation:
```typescript
const pdfUrl = await generateSettlementPDF(settlementData);
await db.update(settlements).set({ documentUrl: pdfUrl }).where(eq(settlements.id, settlementId));
```

### Verification
```
search_code "generateSettlementPDF\|settlementPDF" — must find service
search_code "documentUrl" in loadLifecycle.ts — must find PDF URL storage
```

---

## BLOCKER 6: Dispute Resolution (10h)

### Problem
`approveSettlement()` in earnings.ts returns `{success: true}` without DB update. `resolveDispute()` in admin.ts is a no-op.

### Implementation
Replace stubs in `earnings.ts` and `admin.ts`:

```typescript
disputeSettlement: protectedProcedure
  .input(z.object({
    settlementId: z.string(),
    reason: z.string(),
    evidence: z.string().optional(), // document URL
  }))
  .mutation(async ({ ctx, input }) => {
    // 1. Set settlement.status = 'disputed'
    // 2. Freeze carrier wallet: hold disputed amount
    // 3. Create dispute record: disputerId, reason, evidence, status='open'
    // 4. Notify other party via email + notification
    // 5. Set auto-escalation timer (7 days)
    // 6. Log to audit_logs
  }),

resolveDispute: adminProcedure
  .input(z.object({
    disputeId: z.string(),
    resolution: z.enum(['carrier_wins', 'shipper_wins', 'split']),
    splitAmount: z.number().optional(),
    notes: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    // 1. Update dispute.status = 'resolved', dispute.resolution = input.resolution
    // 2. If carrier_wins: release held funds to carrier
    // 3. If shipper_wins: refund held funds to shipper
    // 4. If split: distribute per splitAmount
    // 5. Notify both parties
    // 6. Generate resolution PDF
    // 7. Log to audit_logs
  }),
```

### Schema
```typescript
export const disputes = mysqlTable('disputes', {
  id: int('id').primaryKey().autoincrement(),
  settlementId: int('settlement_id').notNull(),
  disputerId: int('disputer_id').notNull(),
  respondentId: int('respondent_id').notNull(),
  reason: text('reason').notNull(),
  evidence: text('evidence'),
  status: varchar('status', { length: 20 }).default('open'), // open, under_review, resolved, escalated
  resolution: varchar('resolution', { length: 20 }), // carrier_wins, shipper_wins, split
  resolvedBy: int('resolved_by'),
  resolvedAt: timestamp('resolved_at'),
  notes: text('notes'),
  heldAmount: decimal('held_amount', { precision: 12, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Verification
```
search_code "disputeSettlement" — must find real mutation with DB update
search_code "resolveDispute" in admin.ts — must NOT be a no-op
SQL: SELECT table_name WHERE table_name = 'disputes' — must return 1 row
```

---

## BLOCKER 7: CDL Verification Router (8h)

### Problem
Zero CDL verification endpoints. Drivers can be assigned hazmat loads without verified CDL status. 49 CFR 391.41 violation.

### Implementation
Create `frontend/server/routers/cdlVerification.ts`:

```typescript
verifyCDL: protectedProcedure
  .input(z.object({
    driverId: z.number(),
    cdlNumber: z.string(),
    stateOfIssuance: z.string().length(2),
    expirationDate: z.string(),
    endorsements: z.array(z.string()), // H, N, T, P, S, X
    restrictions: z.array(z.string()).optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    // 1. Validate CDL format per state rules
    // 2. Check expiration (must be > 30 days from now)
    // 3. Verify hazmat endorsement (H or X) if driver is hazmat-eligible
    // 4. Store in cdl_records table
    // 5. Flag for periodic re-verification (every 90 days)
    // 6. Return { verified, endorsements, expiresAt, warnings }
  }),

checkCDLForLoad: protectedProcedure
  .input(z.object({ driverId: z.number(), loadId: z.number() }))
  .query(async ({ input }) => {
    // 1. Get load details (hazmat class, endorsement requirements)
    // 2. Get driver's CDL record
    // 3. Check: CDL valid? Endorsement matches? TWIC current?
    // 4. Return { eligible: boolean, reasons: string[] }
  }),
```

Also add hard gate in `dispatch.ts` assignDriver mutation (~line 407):
```typescript
// Before assigning, check CDL
const cdlCheck = await checkCDLForLoad(driverId, loadId);
if (!cdlCheck.eligible) {
  throw new TRPCError({
    code: 'PRECONDITION_FAILED',
    message: `Driver CDL check failed: ${cdlCheck.reasons.join(', ')}`,
  });
}
```

### Verification
```
search_code "cdlVerification\|verifyCDL" — must find router
search_code "CDL\|cdlCheck" in dispatch.ts — must find pre-assignment check
SQL: SELECT table_name WHERE table_name = 'cdl_records' — must return 1 row
```

---

## BLOCKER 8: GPS Real-time Transmission (6h)

### Problem
GPS tables exist (gps_tracking, location_breadcrumbs, geofence_events). Events defined (8 TRACKING_EVENTS). But `emitGPSUpdate()` is never called. Dispatchers are blind.

### Implementation
In `frontend/server/routers/location.ts` (telemetry section), after storing GPS data:

```typescript
// After storing GPS position in database, emit WebSocket event:
emitTrackingEvent(String(companyId), {
  type: 'GPS_POSITION',
  driverId: String(driverId),
  loadId: String(loadId),
  latitude: position.latitude,
  longitude: position.longitude,
  speed: position.speed,
  heading: position.heading,
  timestamp: new Date().toISOString(),
});
```

Also wire in the batch GPS endpoint:
```typescript
// After processing batch of GPS points:
for (const position of batchPositions) {
  emitTrackingEvent(String(companyId), {
    type: 'GPS_BATCH_UPDATE',
    driverId: String(driverId),
    positions: batchPositions,
    timestamp: new Date().toISOString(),
  });
}
```

Create `emitTrackingEvent` in `frontend/server/_core/websocket.ts` if not already present:
```typescript
export function emitTrackingEvent(companyId: string, data: any) {
  wsService.broadcastToChannel(`tracking:${companyId}`, 'TRACKING_EVENT', data);
}
```

### Verification
```
search_code "emitTrackingEvent\|emitGPSUpdate" in frontend/server — expect 3+ emission points
search_code "GPS_POSITION\|GPS_BATCH" in location.ts — expect emit calls
```

---

## DEPLOYMENT ORDER

1. Schema changes first (all new tables): `npx drizzle-kit push`
2. Blockers 1-3 (Security): Account closure, password reset, 2FA
3. Blockers 4-6 (Financial): Idempotency, settlement PDFs, disputes
4. Blocker 7 (Compliance): CDL verification + dispatch gate
5. Blocker 8 (Real-time): GPS transmission

After each phase:
- `git add <specific files>`
- `git commit -m "feat(gold-standard): P0 Phase N — description"`
- `git push origin main`
- `npm run build`
- Copy updated files to `dist/src-snapshot/`
- Notify audit team for verification
