# WS-E2E-019: Implement Subscription Billing

**Priority:** P2  
**Estimated Hours:** 20  
**Status:** Not Started

## CONTEXT

The SUB_FEE is currently $0 — no subscription revenue is being collected. This means:
- Platform is not monetizing from subscription tiers
- No premium features gated by subscription
- Unlimited loads available to free users
- Massive revenue opportunity lost

## REQUIREMENTS

1. Define subscription tiers:

   **Free Tier:**
   - 5 loads/month maximum
   - Basic matching only
   - 1 active shipment
   - Standard support (48-72 hour response)
   - Community forum access
   - Price: $0/month

   **Pro Tier:**
   - Unlimited loads
   - Advanced matching with ML predictions
   - 10 concurrent active shipments
   - Priority support (24 hour response)
   - API access (1000 req/day)
   - Custom integrations (manual setup)
   - Analytics dashboard
   - Price: $99/month

   **Enterprise Tier:**
   - Unlimited loads
   - Advanced ML + custom models
   - Unlimited concurrent shipments
   - Dedicated account manager (24/7 support)
   - API access (unlimited)
   - Custom integrations (development included)
   - White-label options
   - Priority in load matching
   - Advanced analytics + forecasting
   - Price: $499+/month (custom)

2. Create subscription tables in `drizzle/schema.ts`:

   **subscriptions table:**
   - `id` (serial)
   - `userId` (int, FK to users, required)
   - `tier` (text: 'FREE', 'PRO', 'ENTERPRISE', required)
   - `status` (text: 'ACTIVE', 'CANCELLED', 'SUSPENDED', 'EXPIRED')
   - `currentPeriodStart` (date)
   - `currentPeriodEnd` (date)
   - `stripeSubscriptionId` (text, unique, Stripe subscription ID)
   - `stripeCustomerId` (text, Stripe customer ID)
   - `autoRenew` (boolean, default true)
   - `cancelledAt` (timestamp, nullable)
   - `createdAt` (timestamp)
   - `updatedAt` (timestamp)

   **subscription_usage table:**
   - `id` (serial)
   - `subscriptionId` (int, FK to subscriptions)
   - `loadsCreated` (int, current month count)
   - `loadsLimit` (int, tier limit)
   - `apiCallsUsed` (int)
   - `apiCallsLimit` (int)
   - `activeShipments` (int)
   - `activeShipmentsLimit` (int)
   - `monthStart` (date)
   - `monthEnd` (date)
   - `resetAt` (timestamp)

   **subscription_features table:**
   - `id` (serial)
   - `tier` (text: 'FREE', 'PRO', 'ENTERPRISE')
   - `featureName` (text)
   - `featureKey` (text, e.g., 'unlimited_loads')
   - `enabled` (boolean)
   - `limit` (int, nullable)

3. Integrate Stripe Subscriptions:

   a. Create Stripe setup endpoint:
   ```typescript
   POST /api/subscriptions/checkout
   Body: {
     tier: 'PRO' | 'ENTERPRISE',
     billingCycle?: 'MONTHLY' | 'YEARLY'
   }
   Response: {
     sessionId: string,
     checkoutUrl: string
   }
   ```

   b. Initialize Stripe customer:
   ```typescript
   async function initializeStripeCustomer(userId: number) {
     const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
     const customer = await stripe.customers.create({
       email: user.email,
       name: `${user.firstName} ${user.lastName}`,
       metadata: { userId }
     });
     
     await db.update(subscriptions).set({
       stripeCustomerId: customer.id
     }).where(eq(subscriptions.userId, userId));
   }
   ```

   c. Create checkout session:
   ```typescript
   const session = await stripe.checkout.sessions.create({
     customer: stripeCustomerId,
     payment_method_types: ['card'],
     line_items: [{
       price: priceIdForTier,
       quantity: 1
     }],
     mode: 'subscription',
     success_url: `${baseUrl}/dashboard?subscription=success`,
     cancel_url: `${baseUrl}/pricing`,
     metadata: { userId, tier }
   });
   ```

4. Handle Stripe webhooks:

   a. Create webhook endpoint:
   ```typescript
   POST /api/webhooks/stripe
   ```

   b. Handle key events:
   ```typescript
   // customer.subscription.created
   // customer.subscription.updated
   // customer.subscription.deleted
   // invoice.payment_succeeded
   // invoice.payment_failed
   // charge.refunded
   ```

   c. On subscription created:
   ```typescript
   await db.insert(subscriptions).values({
     userId,
     tier,
     status: 'ACTIVE',
     stripeSubscriptionId: event.data.object.id,
     currentPeriodStart: new Date(event.data.object.current_period_start * 1000),
     currentPeriodEnd: new Date(event.data.object.current_period_end * 1000)
   });
   ```

5. Implement usage limits enforcement:

   a. Check load creation:
   ```typescript
   async function checkLoadCreationAllowed(userId: number) {
     const subscription = await db.query.subscriptions.findFirst({
       where: eq(subscriptions.userId, userId),
       with: { usage: true }
     });
     
     if (subscription.tier === 'FREE' && subscription.usage.loadsCreated >= 5) {
       throw new Error('Free tier load limit reached. Upgrade to Pro.');
     }
   }
   ```

   b. Check API rate limits:
   ```typescript
   async function checkApiRateLimit(userId: number) {
     const subscription = await getActiveSubscription(userId);
     const usage = await getSubscriptionUsage(userId);
     
     if (usage.apiCallsUsed >= subscription.apiCallsLimit) {
       throw new Error('API rate limit exceeded');
     }
   }
   ```

6. Create subscription management endpoints:

   a. View current subscription:
   ```typescript
   GET /api/subscriptions/current
   Response: {
     tier: 'PRO',
     status: 'ACTIVE',
     periodEnd: '2026-04-05',
     usage: { loadsCreated: 45, loadsLimit: 'unlimited' },
     features: [{ name: 'api_access', enabled: true, limit: 1000 }]
   }
   ```

   b. Change subscription:
   ```typescript
   POST /api/subscriptions/change-tier
   Body: { newTier: 'ENTERPRISE' }
   ```

   c. Cancel subscription:
   ```typescript
   POST /api/subscriptions/cancel
   Body: { reason?: string }
   ```

7. Create billing portal:

   a. Customer portal:
   ```typescript
   POST /api/subscriptions/portal
   // Redirects to Stripe customer portal for:
   // - View/update payment method
   // - Download invoices
   // - Manage subscription
   ```

8. Track and report usage:

   a. Update usage monthly:
   ```typescript
   async function resetMonthlyUsage(subscriptionId: number) {
     await db.update(subscriptionUsage)
       .set({
         loadsCreated: 0,
         apiCallsUsed: 0,
         monthStart: startOfMonth(),
         monthEnd: endOfMonth(),
         resetAt: new Date()
       })
       .where(eq(subscriptionUsage.subscriptionId, subscriptionId));
   }
   ```

   b. Usage reporting:
   ```typescript
   POST /api/subscriptions/usage/increment
   Body: {
     metricName: 'loadsCreated' | 'apiCallsUsed',
     amount: 1
   }
   ```

9. Handle downgrades gracefully:

   a. On downgrade from PRO to FREE:
   - Alert user about load limits
   - Stop accepting new loads over limit
   - Allow completing in-progress loads

10. Email notifications:

    a. Subscription renewal:
    ```
    "Your subscription renews on [date] for $99"
    ```

    b. Approaching limit:
    ```
    "You've used 80% of your monthly load limit (4 of 5)"
    ```

    c. Payment failed:
    ```
    "Payment failed for your subscription. Update payment method: [link]"
    ```

## FILES TO MODIFY

- `drizzle/schema.ts` (add subscription tables)
- `routers/subscriptions.ts` (new file, all subscription endpoints)
- `services/stripe.ts` (Stripe integration)
- `services/webhooks.ts` (Stripe webhook handling)
- `services/feeCalculator.ts` (update to use subscription tier)
- `middleware/auth.ts` (add subscription check to auth)
- `pages/pricing.tsx` (pricing page with tier selection)
- `pages/billing.tsx` (billing management page)

## VERIFICATION

1. Create tables:
   ```bash
   npm run db:push
   ```

2. Test free tier limits:
   - Create free account
   - Try to create 6th load
   - Should fail with appropriate error

3. Test Pro tier signup:
   - Visit `/pricing`
   - Click "Subscribe to Pro"
   - Complete Stripe checkout
   - Verify subscription created:
     ```bash
     psql $DATABASE_URL -c "SELECT tier, status FROM subscriptions WHERE userId = <userId>"
     ```

4. Test webhook handling:
   - Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   - Trigger test event: `stripe trigger customer.subscription.created`
   - Verify subscription updated in DB

5. Test usage limits:
   - Create Pro subscription
   - Create 1000+ API calls
   - Verify 1001st call is rejected

6. Test billing portal:
   ```bash
   curl -X POST http://localhost:3000/api/subscriptions/portal \
     -H "Authorization: Bearer <token>"
   # Should redirect to Stripe portal
   ```

7. Test downgrade:
   - Change from PRO to FREE
   - Verify usage limits reset
   - Verify can only create 5 loads

## DO NOT

- Store credit card data (always use Stripe)
- Forget webhook signature verification (prevents spoofing)
- Allow unlimited API calls on free tier (enforce limits)
- Skip idempotency on webhook processing (prevent duplicates)
- Create subscription without Stripe customer ID
- Expose Stripe API keys in frontend (always server-side)
- Forget to handle subscription cancellation (cleanup data)
- Leave failed payments unhandled (must retry and notify)
- Allow downgrade mid-period without prorating
- Forget to reset usage monthly (implement cleanup job)

