# WS-E2E-004: Wire Wallet Auto-Credit on Delivery

**Priority:** P0  
**Estimated Hours:** 6  
**Status:** Not Started

## CONTEXT

When a load reaches the DELIVERED state, the settlement is calculated but the driver's wallet is never credited. This means:
- Drivers complete deliveries but see no balance increase
- Settlement data exists but payment is never processed
- No funds movement occurs even though services are rendered
- Instant pay and standard payout paths are not wired

This breaks the entire payment flow and is a critical blocker.

## REQUIREMENTS

1. Identify the DELIVERED state transition in `services/loadLifecycle/stateMachine.ts`
   - Find the effects/side effects for DELIVERED state
   - Understand current settlement calculation flow

2. After settlement calculation completes, call wallet credit:
   ```typescript
   // In DELIVERED effect, after process_settlement
   await creditWallet({
     userId: driverId,
     amount: settlementResult.netPay,
     transactionType: 'DELIVERY_PAYMENT',
     loadId,
     reference: `Settlement for load ${loadId}`,
     instantPay: driver.instantPayEnabled
   });
   ```

3. Modify `routers/wallet.ts` to add creditWallet function:
   - Create wallet transaction record in database
   - Update wallet balance atomically
   - Use database transaction to ensure consistency

4. Implement wallet transaction table in schema:
   - Add `wallet_transactions` table with columns:
     - `id` (serial, primary key)
     - `walletId` (integer, foreign key to users, required)
     - `amount` (decimal 12.2, required)
     - `transactionType` (text: 'DELIVERY_PAYMENT', 'WITHDRAWAL', 'REFUND', 'BONUS', 'FEE')
     - `status` (text: 'PENDING', 'COMPLETED', 'FAILED', default 'PENDING')
     - `loadId` (integer, nullable, foreign key to loads)
     - `reference` (text, nullable, e.g., "Settlement for load 123")
     - `createdAt` (timestamp with time zone, default now())

5. Update `users` table to add/verify wallet balance column:
   - Add `walletBalance` (decimal 12.2, default 0) if not present
   - Ensure atomic updates with SELECT ... FOR UPDATE

6. Implement instant pay processing:
   - For users with `instantPayEnabled = true`:
     - Trigger Stripe payout to connected account immediately
     - Stripe connected account ID should be stored in users table
     - Create `stripe_payouts` table to track:
       - `id` (serial)
       - `userId` (int, FK to users)
       - `transactionId` (int, FK to wallet_transactions)
       - `stripePayoutId` (text)
       - `amount` (decimal)
       - `status` (text: 'created', 'in_transit', 'paid', 'failed', 'cancelled')
       - `createdAt` (timestamp)

7. For standard payout users (non-instant):
   - Mark transaction status as COMPLETED but do not trigger payout
   - Payouts handled by separate batch job (weekly/bi-weekly)

8. Add error handling:
   - If wallet credit fails, catch error and log but don't block load completion
   - Emit WebSocket event `payment_error` to driver with retry mechanism
   - Add background retry job for failed transactions

9. Add idempotency:
   - Use loadId as idempotency key
   - Check if settlement payment already exists for this load
   - Prevent duplicate payments if DELIVERED is triggered multiple times

## FILES TO MODIFY

- `drizzle/schema.ts` (add wallet_transactions, stripe_payouts tables, add walletBalance + stripeConnectedAccountId to users)
- `services/loadLifecycle/stateMachine.ts` (add creditWallet call in DELIVERED effect)
- `routers/wallet.ts` (add creditWallet function + payout triggering logic)
- `services/stripe.ts` (add payout creation for instant pay users)

## VERIFICATION

1. Create database tables:
   ```bash
   npm run db:push
   psql $DATABASE_URL -c "\dt" | grep -E 'wallet|stripe'
   ```

2. Test wallet credit on load delivery:
   - Record initial wallet balance: `SELECT walletBalance FROM users WHERE id = <driverId>`
   - Complete a load to DELIVERED state
   - Verify wallet balance increased:
     ```bash
     SELECT walletBalance FROM users WHERE id = <driverId>
     ```

3. Verify wallet transaction was created:
   ```bash
   psql $DATABASE_URL -c "SELECT id, userId, amount, transactionType, status FROM wallet_transactions WHERE loadId = <loadId>"
   ```

4. Test instant pay payout:
   - Set driver with `instantPayEnabled = true` and valid Stripe connected account
   - Complete load to DELIVERED
   - Verify Stripe payout was triggered:
     ```bash
     psql $DATABASE_URL -c "SELECT stripePayoutId, status FROM stripe_payouts WHERE userId = <driverId> ORDER BY createdAt DESC LIMIT 1"
     ```

5. Test idempotency:
   - Manually trigger DELIVERED state twice
   - Verify only one wallet transaction was created
   - Check logs for idempotency check

6. Test error handling:
   - Force wallet credit to fail (e.g., mock DB error)
   - Verify error is logged and caught
   - Verify load still transitions to DELIVERED
   - Verify `payment_error` WebSocket event is emitted

## DO NOT

- Call creditWallet before settlement calculation completes
- Skip idempotency checks — can cause double payments
- Trigger Stripe payouts for standard payout users
- Leave wallet transactions in PENDING state indefinitely (add timeout)
- Update user.walletBalance without using atomic transaction
- Forget to emit WebSocket events for payment status changes
- Store Stripe connected account ID as plain text — encrypt sensitive fields
- Process payout without verifying driver has valid Stripe account (check not null)

