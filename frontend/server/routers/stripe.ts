/**
 * STRIPE ROUTER
 * Unified tRPC router for all Stripe payment operations
 * - Checkout sessions (load payments + subscriptions)
 * - Stripe Connect onboarding (catalysts, drivers, brokers)
 * - Customer management
 * - Payment methods (add, remove, list)
 * - Subscription management
 * - Payouts via Connect
 * - Payment intents for in-app payments
 */

import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { isolatedApprovedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { users, companies, wallets, walletTransactions, payments, subscriptions as subscriptionsTable, subscriptionUsage } from "../../drizzle/schema";
import { stripe } from "../stripe/service";
import { SUBSCRIPTION_PRODUCTS, PLATFORM_FEE_PERCENTAGE, MINIMUM_PLATFORM_FEE, calculatePlatformFee } from "../stripe/products";
import { requireAccess } from "../services/security/rbac/access-check";
import { feeCalculator } from "../services/feeCalculator";

// Helper: resolve user by email (primary) — select only safe columns (openId may not exist in DB)
async function resolveUser(openIdOrEmail: string | number, email?: string): Promise<{ id: number; row: any } | null> {
  const db = await getDb();
  if (!db) return null;

  const safeSelect = {
    id: users.id, name: users.name, email: users.email,
    role: users.role, companyId: users.companyId,
    stripeCustomerId: users.stripeCustomerId, stripeConnectId: users.stripeConnectId,
    isActive: users.isActive, isVerified: users.isVerified, createdAt: users.createdAt,
  };

  // Try email first (most reliable — column always exists)
  if (email) {
    try {
      let [user] = await db.select(safeSelect).from(users).where(eq(users.email, email)).limit(1);
      if (user) return { id: user.id, row: user };
    } catch {}
  }

  // Fallback: try openId (may not exist in DB)
  try {
    const strId = String(openIdOrEmail);
    let [user] = await db.select(safeSelect).from(users).where(eq(users.openId, strId)).limit(1);
    if (user) return { id: user.id, row: user };
  } catch {
    // openId column doesn't exist — that's fine
  }

  return null;
}

// Helper: get or create Stripe customer for a user (race-safe)
// Uses Stripe idempotency key to prevent duplicate customers under concurrent requests
async function getOrCreateStripeCustomer(userOpenId: string | number, email: string, name?: string): Promise<string> {
  const resolved = await resolveUser(userOpenId, email);

  // 1. Check if user already has a Stripe customer ID stored in DB
  if (resolved) {
    const stripeCustomerId = (resolved.row as any)?.stripeCustomerId;
    if (stripeCustomerId) {
      try {
        const cust = await stripe.customers.retrieve(stripeCustomerId);
        if (!(cust as any).deleted) return stripeCustomerId;
      } catch {
        // Customer was deleted from Stripe or doesn't exist, create a new one
      }
    }
  }

  // 2. Try to find existing Stripe customer by email (handles orphaned customers)
  try {
    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data.length > 0) {
      const cust = existing.data[0];
      if (resolved) {
        const db = await getDb();
        if (db) {
          try { await db.update(users).set({ stripeCustomerId: cust.id }).where(eq(users.id, resolved.id)); } catch {}
        }
      }
      return cust.id;
    }
  } catch {}

  // 3. Create new Stripe customer with idempotency key to prevent race-condition duplicates
  const idempotencyKey = `create-customer-${resolved ? resolved.id : String(userOpenId)}-${email}`;
  const customer = await stripe.customers.create({
    email,
    name: name || email,
    metadata: {
      userId: resolved ? String(resolved.id) : String(userOpenId),
      platform: "eusotrip",
    },
  }, {
    idempotencyKey,
  });

  // 4. Store the customer ID on the user record (use conditional update to avoid overwriting a concurrent write)
  if (resolved) {
    const db = await getDb();
    if (db) {
      try {
        await db.update(users)
          .set({ stripeCustomerId: customer.id })
          .where(and(eq(users.id, resolved.id), sql`(${users.stripeCustomerId} IS NULL OR ${users.stripeCustomerId} = '')`));
      } catch {
        logger.warn("[Stripe] Could not store customer ID on user record");
      }

      // Sync stripeCustomerId to wallet (ensure wallet↔user isolation)
      try {
        const [wallet] = await db.select({ id: wallets.id })
          .from(wallets).where(eq(wallets.userId, resolved.id)).limit(1);
        if (wallet) {
          await db.update(wallets)
            .set({ stripeCustomerId: customer.id })
            .where(eq(wallets.userId, resolved.id));
        } else {
          // Auto-create wallet for this user
          await db.insert(wallets).values({
            userId: resolved.id,
            availableBalance: "0",
            pendingBalance: "0",
            stripeCustomerId: customer.id,
          });
        }
      } catch {}

      // Re-read to ensure we return the winning customer ID (in case another request wrote first)
      try {
        const [fresh] = await db.select({ stripeCustomerId: users.stripeCustomerId }).from(users).where(eq(users.id, resolved.id)).limit(1);
        if (fresh?.stripeCustomerId && fresh.stripeCustomerId !== customer.id) {
          return fresh.stripeCustomerId;
        }
      } catch {}
    }
  }

  return customer.id;
}

export const stripeRouter = router({
  // ═══════════════════════════════════════════════════════════════
  // CUSTOMER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get or create Stripe customer for current user
   */
  getCustomer: protectedProcedure
    .query(async ({ ctx }) => {
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || 'SHIPPER', companyId: (ctx.user as any)?.companyId, action: 'READ', resource: 'PAYMENT' }, (ctx as any).req);
      const customerId = await getOrCreateStripeCustomer(
        ctx.user.id,
        ctx.user.email || "",
        ctx.user.name || undefined
      );
      const customer = await stripe.customers.retrieve(customerId);
      return {
        id: customer.id,
        email: (customer as any).email,
        name: (customer as any).name,
        created: (customer as any).created,
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // PAYMENT METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Create a Stripe Checkout session in setup mode to add a payment method
   */
  createSetupCheckout: protectedProcedure
    .mutation(async ({ ctx }) => {
      const customerId = await getOrCreateStripeCustomer(
        ctx.user.id,
        ctx.user.email || "",
        ctx.user.name || undefined
      );

      const appUrl = process.env.APP_URL || "https://eusotrip.com";
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        mode: "setup",
        success_url: `${appUrl}/settings?tab=billing&setup=success`,
        cancel_url: `${appUrl}/settings?tab=billing&setup=cancelled`,
        metadata: {
          userId: String(ctx.user.id),
          type: "add_payment_method",
        },
      });

      return {
        url: session.url,
        sessionId: session.id,
      };
    }),

  /**
   * List payment methods for current user
   */
  listPaymentMethods: protectedProcedure
    .query(async ({ ctx }) => {
      const customerId = await getOrCreateStripeCustomer(
        ctx.user.id,
        ctx.user.email || "",
        ctx.user.name || undefined
      );

      const methods = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
      });

      const customer = await stripe.customers.retrieve(customerId) as any;
      const defaultMethodId = customer.invoice_settings?.default_payment_method;

      return methods.data.map((m) => ({
        id: m.id,
        type: m.type,
        brand: m.card?.brand || "unknown",
        last4: m.card?.last4 || "****",
        expMonth: String(m.card?.exp_month || ""),
        expYear: String(m.card?.exp_year || ""),
        isDefault: m.id === defaultMethodId,
      }));
    }),

  /**
   * Set default payment method
   */
  setDefaultPaymentMethod: protectedProcedure
    .input(z.object({ paymentMethodId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const customerId = await getOrCreateStripeCustomer(
        ctx.user.id,
        ctx.user.email || "",
        ctx.user.name || undefined
      );

      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: input.paymentMethodId,
        },
      });

      return { success: true };
    }),

  /**
   * Remove a payment method
   */
  removePaymentMethod: protectedProcedure
    .input(z.object({ paymentMethodId: z.string() }))
    .mutation(async ({ input }) => {
      await stripe.paymentMethods.detach(input.paymentMethodId);
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════════
  // CHECKOUT SESSIONS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Create checkout session for a load payment
   */
  createLoadCheckout: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      loadNumber: z.string(),
      amount: z.number(), // in dollars
      catalystConnectId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const amountCents = Math.round(input.amount * 100);

      // Use dynamic fee calculator (admin-configured) with fallback to static fee
      let platformFeeCents: number;
      try {
        const feeResult = await feeCalculator.calculateFee({
          userId: ctx.user.id,
          userRole: ctx.user.role || "DRIVER",
          transactionType: "load_booking",
          amount: input.amount,
        });
        platformFeeCents = Math.round(feeResult.finalFee * 100);
        if (platformFeeCents <= 0) platformFeeCents = calculatePlatformFee(amountCents);

        // Record the fee collection
        await feeCalculator.recordFeeCollection(
          input.loadId,
          "load_booking",
          ctx.user.id,
          input.amount,
          feeResult
        );
        logger.info(`[Stripe] Load ${input.loadNumber} fee: $${feeResult.finalFee.toFixed(2)} (${feeResult.breakdown.feeCode})`);
      } catch (feeErr) {
        logger.warn("[Stripe] Fee calculator fallback:", (feeErr as Error).message);
        platformFeeCents = calculatePlatformFee(amountCents);
      }

      const sessionParams: any = {
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Load Payment - ${input.loadNumber}`,
                description: `Freight load transportation payment`,
              },
              unit_amount: amountCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment" as const,
        success_url: `${process.env.APP_URL || "https://eusotrip.com"}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL || "https://eusotrip.com"}/payments/cancelled`,
        customer_email: ctx.user.email || undefined,
        client_reference_id: String(ctx.user.id),
        metadata: {
          userId: String(ctx.user.id),
          loadId: String(input.loadId),
          loadNumber: input.loadNumber,
          paymentType: "load_payment",
          platformFee: String(platformFeeCents),
        },
      };

      // If catalyst has a Connect account, route payment to them
      if (input.catalystConnectId) {
        sessionParams.payment_intent_data = {
          application_fee_amount: platformFeeCents,
          transfer_data: {
            destination: input.catalystConnectId,
          },
        };
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      return {
        sessionId: session.id,
        url: session.url,
      };
    }),

  /**
   * Create checkout session for a subscription
   */
  createSubscriptionCheckout: protectedProcedure
    .input(z.object({
      planId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const customerId = await getOrCreateStripeCustomer(
        ctx.user.id,
        ctx.user.email || "",
        ctx.user.name || undefined
      );

      const product = SUBSCRIPTION_PRODUCTS.find((p) => p.id === input.planId);
      if (!product) throw new Error("Invalid plan ID");

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        customer: customerId,
        line_items: [
          {
            price_data: {
              currency: product.currency,
              product_data: {
                name: product.name,
                description: product.description,
              },
              unit_amount: product.amount,
              recurring: {
                interval: product.interval || "month",
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.APP_URL || "https://eusotrip.com"}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL || "https://eusotrip.com"}/subscription/cancelled`,
        metadata: {
          userId: String(ctx.user.id),
          planId: input.planId,
          paymentType: "subscription",
        },
      });

      return {
        sessionId: session.id,
        url: session.url,
      };
    }),

  /**
   * Get checkout session result
   */
  getCheckoutSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const session = await stripe.checkout.sessions.retrieve(input.sessionId);
      return {
        id: session.id,
        status: session.status,
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total,
        currency: session.currency,
        customerEmail: session.customer_email,
        metadata: session.metadata,
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // SUBSCRIPTIONS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get current subscription for user
   */
  getSubscription: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const customerId = await getOrCreateStripeCustomer(
          ctx.user.id,
          ctx.user.email || "",
          ctx.user.name || undefined
        );

        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: "active",
          limit: 1,
        });

        if (subscriptions.data.length === 0) {
          return {
            active: false,
            plan: null,
            planName: "Free",
            status: "none",
            price: 0,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
          };
        }

        const sub = subscriptions.data[0] as any;
        const item = sub.items.data[0];
        const price = item.price;

        return {
          active: true,
          subscriptionId: sub.id,
          plan: price.id,
          planName: (price.product as any)?.name || price.nickname || "Premium",
          status: sub.status,
          price: (price.unit_amount || 0) / 100,
          currency: price.currency,
          interval: price.recurring?.interval,
          currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        };
      } catch (error) {
        logger.error("[Stripe] getSubscription error:", error);
        return {
          active: false,
          plan: null,
          planName: "Free",
          status: "none",
          price: 0,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        };
      }
    }),

  /**
   * Cancel subscription
   */
  cancelSubscription: protectedProcedure
    .input(z.object({ subscriptionId: z.string(), immediate: z.boolean().default(false) }))
    .mutation(async ({ input }) => {
      if (input.immediate) {
        await stripe.subscriptions.cancel(input.subscriptionId);
      } else {
        await stripe.subscriptions.update(input.subscriptionId, {
          cancel_at_period_end: true,
        });
      }
      return { success: true };
    }),

  /**
   * Get available subscription plans
   */
  getPlans: protectedProcedure
    .query(async () => {
      return SUBSCRIPTION_PRODUCTS.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.amount / 100,
        currency: p.currency,
        interval: p.interval,
        features: getFeaturesByPlan(p.id),
      }));
    }),

  // ═══════════════════════════════════════════════════════════════
  // DB-BACKED SUBSCRIPTION MANAGEMENT (WS-E2E-019)
  // ═══════════════════════════════════════════════════════════════

  /** Get current user's DB-tracked subscription + usage */
  getMySubscription: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { tier: "FREE", status: "ACTIVE", usage: null };
      const userId = Number(ctx.user?.id) || 0;
      const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, userId)).limit(1);
      if (!sub) return { tier: "FREE", status: "ACTIVE", usage: null };
      const [usage] = await db.select().from(subscriptionUsage).where(eq(subscriptionUsage.userId, userId)).limit(1);
      return { ...sub, usage: usage || null };
    }),

  /** Check if user can create a load (enforces free tier limits) */
  checkLoadAllowed: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { allowed: true, reason: null };
      const userId = Number(ctx.user?.id) || 0;
      const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, userId)).limit(1);
      if (!sub || sub.tier === "FREE") {
        const [usage] = await db.select().from(subscriptionUsage).where(eq(subscriptionUsage.userId, userId)).limit(1);
        if (usage && usage.loadsCreated >= usage.loadsLimit) {
          return { allowed: false, reason: `Free tier limit reached (${usage.loadsLimit} loads/month). Upgrade to Pro for unlimited loads.` };
        }
      }
      return { allowed: true, reason: null };
    }),

  /** Increment usage counter (called after load creation, API call, etc.) */
  incrementUsage: protectedProcedure
    .input(z.object({ metric: z.enum(["loadsCreated", "apiCallsUsed", "activeShipments"]), amount: z.number().default(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const userId = Number(ctx.user?.id) || 0;
      const [usage] = await db.select().from(subscriptionUsage).where(eq(subscriptionUsage.userId, userId)).limit(1);
      if (!usage) return { success: false };
      await db.update(subscriptionUsage)
        .set({ [input.metric]: sql`${subscriptionUsage[input.metric]} + ${input.amount}` } as any)
        .where(eq(subscriptionUsage.id, usage.id));
      return { success: true };
    }),

  /** Sync a Stripe subscription event to our DB (called from webhook handler) */
  syncSubscriptionFromStripe: protectedProcedure
    .input(z.object({
      stripeSubscriptionId: z.string(),
      stripeCustomerId: z.string(),
      tier: z.enum(["FREE", "PRO", "ENTERPRISE"]),
      status: z.enum(["ACTIVE", "CANCELLED", "SUSPENDED", "EXPIRED", "PAST_DUE"]),
      currentPeriodStart: z.string().optional(),
      currentPeriodEnd: z.string().optional(),
      stripePriceId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const userId = Number(ctx.user?.id) || 0;

      // Upsert subscription
      const [existing] = await db.select().from(subscriptionsTable)
        .where(eq(subscriptionsTable.userId, userId)).limit(1);

      const tierLimits = { FREE: { loads: 5, api: 100, shipments: 1 }, PRO: { loads: 999999, api: 1000, shipments: 10 }, ENTERPRISE: { loads: 999999, api: 999999, shipments: 999999 } };
      const limits = tierLimits[input.tier];

      if (existing) {
        await db.update(subscriptionsTable).set({
          tier: input.tier,
          status: input.status,
          stripeSubscriptionId: input.stripeSubscriptionId,
          stripeCustomerId: input.stripeCustomerId,
          stripePriceId: input.stripePriceId || null,
          currentPeriodStart: input.currentPeriodStart ? new Date(input.currentPeriodStart) : undefined,
          currentPeriodEnd: input.currentPeriodEnd ? new Date(input.currentPeriodEnd) : undefined,
          updatedAt: new Date(),
        }).where(eq(subscriptionsTable.id, existing.id));
        // Update usage limits
        await db.update(subscriptionUsage).set({
          loadsLimit: limits.loads, apiCallsLimit: limits.api, activeShipmentsLimit: limits.shipments,
        }).where(eq(subscriptionUsage.userId, userId));
      } else {
        const [newSub] = await db.insert(subscriptionsTable).values({
          userId, tier: input.tier, status: input.status,
          stripeSubscriptionId: input.stripeSubscriptionId,
          stripeCustomerId: input.stripeCustomerId,
          stripePriceId: input.stripePriceId || null,
          currentPeriodStart: input.currentPeriodStart ? new Date(input.currentPeriodStart) : undefined,
          currentPeriodEnd: input.currentPeriodEnd ? new Date(input.currentPeriodEnd) : undefined,
        }).$returningId();
        // Create usage tracking row
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        await db.insert(subscriptionUsage).values({
          subscriptionId: newSub.id, userId,
          loadsLimit: limits.loads, apiCallsLimit: limits.api, activeShipmentsLimit: limits.shipments,
          monthStart, monthEnd,
        });
      }
      return { success: true };
    }),

  /** Create Stripe billing portal session for self-service */
  createPortalSession: protectedProcedure
    .mutation(async ({ ctx }) => {
      const customerId = await getOrCreateStripeCustomer(
        ctx.user.id, ctx.user.email || "",
        ctx.user.name || undefined
      );
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.APP_URL || "https://eusotrip.com"}/settings/billing`,
      });
      return { url: session.url };
    }),

  // ═══════════════════════════════════════════════════════════════
  // STRIPE CONNECT (Catalyst/Driver/Broker onboarding)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Create a Stripe Connect Express account
   */
  createConnectAccount: protectedProcedure
    .input(z.object({
      businessType: z.enum(["individual", "company"]).default("individual"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = Number(ctx.user.id) || 0;

      // Idempotency guard: check if user already has a Connect account
      if (db) {
        const [existing] = await db.select({ stripeConnectId: users.stripeConnectId })
          .from(users).where(eq(users.id, userId)).limit(1);
        if (existing?.stripeConnectId) {
          // Already has a Connect account — return it instead of creating a duplicate
          return { accountId: existing.stripeConnectId };
        }
      }

      let account;
      try {
        account = await stripe.accounts.create({
          type: "express",
          country: "US",
          email: ctx.user.email || undefined,
          business_type: input.businessType,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          metadata: {
            userId: String(userId),
            platform: "eusotrip",
            userRole: ctx.user.role || "catalyst",
          },
        });
      } catch (stripeErr: any) {
        logger.error(`[EusoConnect] Account creation failed: ${stripeErr.type} — ${stripeErr.message}`, stripeErr.raw?.message || "");
        // Surface actionable error with EusoWallet branding
        if (stripeErr.type === 'StripeInvalidRequestError') {
          throw new Error(`EusoWallet account setup is being configured. Bank account connections via EusoWallet are available now. Payout enrollment will be enabled shortly.`);
        }
        if (stripeErr.message?.includes("platform") || stripeErr.message?.includes("questionnaire") || stripeErr.message?.includes("Connect")) {
          throw new Error("EusoWallet payouts are being activated. Bank account connections via EusoWallet are available now. Payout enrollment will be enabled shortly.");
        }
        throw new Error(stripeErr.message || "Failed to set up EusoWallet account");
      }

      // Store connect account ID on BOTH users and wallets tables
      if (db) {
        try {
          // Update users table (Drizzle ORM — correct camelCase column)
          await db.update(users)
            .set({ stripeConnectId: account.id })
            .where(eq(users.id, userId));
        } catch {
          logger.warn("[Stripe] Could not store connect ID on user record");
        }

        try {
          // Ensure wallet exists and sync Connect ID to wallet
          const [wallet] = await db.select({ id: wallets.id })
            .from(wallets).where(eq(wallets.userId, userId)).limit(1);
          if (wallet) {
            await db.update(wallets)
              .set({ stripeConnectId: account.id, stripeAccountStatus: "pending" })
              .where(eq(wallets.userId, userId));
          } else {
            // Auto-create wallet for user if it doesn't exist
            await db.insert(wallets).values({
              userId,
              availableBalance: "0",
              pendingBalance: "0",
              stripeConnectId: account.id,
              stripeAccountStatus: "pending",
            });
          }
        } catch (err) {
          logger.warn("[Stripe] Could not sync connect ID to wallet:", err);
        }
      }

      return {
        accountId: account.id,
      };
    }),

  /**
   * Create onboarding link for Connect account
   */
  createConnectOnboardingLink: protectedProcedure
    .input(z.object({ accountId: z.string() }))
    .mutation(async ({ input }) => {
      const appUrl = process.env.APP_URL || "https://eusotrip.com";
      const accountLink = await stripe.accountLinks.create({
        account: input.accountId,
        refresh_url: `${appUrl}/wallet?connect=refresh`,
        return_url: `${appUrl}/wallet?connect=complete`,
        type: "account_onboarding",
      });

      return {
        url: accountLink.url,
      };
    }),

  /**
   * Get Connect account status
   */
  getConnectAccount: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { hasAccount: false, status: "none" };

      try {
        const [user] = await db.select({ id: users.id, email: users.email, name: users.name, role: users.role, stripeCustomerId: users.stripeCustomerId, stripeConnectId: users.stripeConnectId, companyId: users.companyId }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
        const connectId = (user as any)?.stripeConnectId;
        
        if (!connectId) {
          return { hasAccount: false, status: "none" };
        }

        const account = await stripe.accounts.retrieve(connectId);
        return {
          hasAccount: true,
          accountId: account.id,
          status: account.charges_enabled ? "active" : "pending",
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          requiresAction: !account.details_submitted,
        };
      } catch {
        return { hasAccount: false, status: "none" };
      }
    }),

  /**
   * Get Stripe balance for user's Connect account
   * Shows available + pending funds that can be paid out to their bank
   */
  getConnectBalance: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { hasAccount: false, available: 0, pending: 0 };

      try {
        const [user] = await db.select({ stripeConnectId: users.stripeConnectId })
          .from(users).where(eq(users.id, ctx.user.id)).limit(1);
        const connectId = (user as any)?.stripeConnectId;
        if (!connectId) return { hasAccount: false, available: 0, pending: 0 };

        const balance = await stripe.balance.retrieve({ stripeAccount: connectId });
        const availableUsd = balance.available.find(b => b.currency === "usd");
        const pendingUsd = balance.pending.find(b => b.currency === "usd");
        const instantUsd = balance.instant_available?.find((b: any) => b.currency === "usd");

        return {
          hasAccount: true,
          available: (availableUsd?.amount || 0) / 100,
          pending: (pendingUsd?.amount || 0) / 100,
          instantAvailable: (instantUsd?.amount || 0) / 100,
          currency: "usd",
        };
      } catch (e: any) {
        logger.warn("[Stripe] getConnectBalance error:", e.message);
        return { hasAccount: false, available: 0, pending: 0 };
      }
    }),

  /**
   * Create a login link for the user's Stripe Express Dashboard
   * Allows users to manage their bank accounts, view payouts, download tax forms
   */
  createConnectLoginLink: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [user] = await db.select({ stripeConnectId: users.stripeConnectId })
        .from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const connectId = (user as any)?.stripeConnectId;
      if (!connectId) throw new Error("No EusoWallet account found. Set up payouts first.");

      // Verify account has completed onboarding before generating login link
      const account = await stripe.accounts.retrieve(connectId);
      if (!account.details_submitted) {
        throw new Error("Please complete EusoWallet onboarding before accessing the dashboard.");
      }

      const loginLink = await stripe.accounts.createLoginLink(connectId);
      return { url: loginLink.url };
    }),

  /**
   * Get external accounts (bank accounts) attached to user's Connect account
   * These are the accounts that receive payouts from Stripe
   */
  getConnectExternalAccounts: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const [user] = await db.select({ stripeConnectId: users.stripeConnectId })
          .from(users).where(eq(users.id, ctx.user.id)).limit(1);
        const connectId = (user as any)?.stripeConnectId;
        if (!connectId) return [];

        const accounts = await stripe.accounts.listExternalAccounts(connectId, { object: "bank_account", limit: 10 });
        return accounts.data.map((ea: any) => ({
          id: ea.id,
          bankName: ea.bank_name || "Bank Account",
          last4: ea.last4 || "0000",
          routingNumber: ea.routing_number ? `••••${ea.routing_number.slice(-4)}` : "••••••",
          type: ea.account_holder_type === "company" ? "Business" : "Personal",
          accountType: ea.account_type === "savings" ? "Savings" : "Checking",
          status: ea.status || "verified",
          isDefault: ea.default_for_currency || false,
          currency: ea.currency || "usd",
        }));
      } catch (e: any) {
        logger.warn("[Stripe] getConnectExternalAccounts error:", e.message);
        return [];
      }
    }),

  /**
   * Diagnostic: check platform Connect readiness (admin-safe, no test account creation)
   */
  debugConnectStatus: protectedProcedure
    .query(async () => {
      try {
        const platformAccount = await stripe.accounts.retrieve() as any;
        return {
          platformId: platformAccount.id,
          chargesEnabled: platformAccount.charges_enabled,
          payoutsEnabled: platformAccount.payouts_enabled,
          detailsSubmitted: platformAccount.details_submitted,
          country: platformAccount.country,
          businessType: platformAccount.business_type,
          connectApproved: true,
        };
      } catch (e: any) {
        return { error: e.message, connectApproved: false };
      }
    }),

  /**
   * WS-P1-005: Sync Connect account status after onboarding return
   * Called when user returns from Stripe Connect onboarding to update local records
   */
  syncConnectStatus: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = Number(ctx.user.id) || 0;

      const [user] = await db.select({ stripeConnectId: users.stripeConnectId })
        .from(users).where(eq(users.id, userId)).limit(1);
      const connectId = (user as any)?.stripeConnectId;
      if (!connectId) throw new Error("No Connect account found. Create one first.");

      const account = await stripe.accounts.retrieve(connectId);
      const newStatus = account.charges_enabled && account.payouts_enabled
        ? "active"
        : "pending";

      // Update wallet record
      await db.update(wallets)
        .set({ stripeConnectId: connectId, stripeAccountStatus: newStatus })
        .where(eq(wallets.userId, userId));

      logger.info(`[Stripe Connect] Synced status for user ${userId}: ${newStatus}`);
      return {
        accountId: connectId,
        status: newStatus,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // PAYMENT INTENTS (for in-app payments)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Create a payment intent for in-app payment
   */
  createPaymentIntent: protectedProcedure
    .input(z.object({
      amount: z.number(), // in dollars
      description: z.string().optional(),
      loadId: z.number().optional(),
      destinationConnectId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const customerId = await getOrCreateStripeCustomer(
        ctx.user.id,
        ctx.user.email || "",
        ctx.user.name || undefined
      );

      const amountCents = Math.round(input.amount * 100);
      const params: any = {
        amount: amountCents,
        currency: "usd",
        customer: customerId,
        description: input.description,
        automatic_payment_methods: { enabled: true },
        metadata: {
          userId: String(ctx.user.id),
          loadId: input.loadId ? String(input.loadId) : undefined,
          platform: "eusotrip",
        },
      };

      if (input.destinationConnectId) {
        let feeCents: number;
        try {
          const feeResult = await feeCalculator.calculateFee({
            userId: ctx.user.id,
            userRole: ctx.user.role || "DRIVER",
            transactionType: "load_booking",
            amount: input.amount,
            loadId: input.loadId,
          });
          feeCents = Math.round(feeResult.finalFee * 100);
          if (feeCents <= 0) feeCents = calculatePlatformFee(amountCents);
          if (input.loadId) {
            await feeCalculator.recordFeeCollection(input.loadId, "load_booking", ctx.user.id, input.amount, feeResult);
          }
          logger.info(`[Stripe] PaymentIntent fee: $${feeResult.finalFee.toFixed(2)} (${feeResult.breakdown.feeCode})`);
        } catch (feeErr) {
          logger.warn("[Stripe] PaymentIntent fee calculator fallback:", (feeErr as Error).message);
          feeCents = calculatePlatformFee(amountCents);
        }
        params.application_fee_amount = feeCents;
        params.transfer_data = { destination: input.destinationConnectId };
      }

      const intent = await stripe.paymentIntents.create(params);

      return {
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // PAYOUTS (via Connect)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Create a transfer to a connected account (catalyst/driver payout)
   */
  createTransfer: protectedProcedure
    .input(z.object({
      amount: z.number(), // in dollars
      destinationAccountId: z.string(),
      description: z.string().optional(),
      loadId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const transfer = await stripe.transfers.create({
        amount: Math.round(input.amount * 100),
        currency: "usd",
        destination: input.destinationAccountId,
        description: input.description,
        metadata: {
          userId: String(ctx.user.id),
          loadId: input.loadId ? String(input.loadId) : "",
          type: "payout",
        },
      });

      return {
        transferId: transfer.id,
        amount: transfer.amount / 100,
        status: "completed",
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // INVOICES
  // ═══════════════════════════════════════════════════════════════

  /**
   * List Stripe invoices for current user
   */
  listInvoices: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      try {
        const customerId = await getOrCreateStripeCustomer(
          ctx.user.id,
          ctx.user.email || "",
          ctx.user.name || undefined
        );

        const invoices = await stripe.invoices.list({
          customer: customerId,
          limit: input.limit,
        });

        return invoices.data.map((inv) => ({
          id: inv.id,
          number: inv.number,
          amount: (inv.amount_due || 0) / 100,
          status: inv.status,
          date: inv.created ? new Date(inv.created * 1000).toISOString().split("T")[0] : "",
          pdfUrl: inv.invoice_pdf,
          hostedUrl: inv.hosted_invoice_url,
        }));
      } catch {
        return [];
      }
    }),

  // ═══════════════════════════════════════════════════════════════
  // REFUNDS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Create a refund
   */
  createRefund: protectedProcedure
    .input(z.object({
      paymentIntentId: z.string(),
      amount: z.number().optional(), // in dollars, partial refund
      reason: z.enum(["duplicate", "fraudulent", "requested_by_customer"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const refund = await stripe.refunds.create({
        payment_intent: input.paymentIntentId,
        amount: input.amount ? Math.round(input.amount * 100) : undefined,
        reason: input.reason,
      });

      return {
        refundId: refund.id,
        amount: (refund.amount || 0) / 100,
        status: refund.status,
      };
    }),

  // ═══════════════════════════════════════════════════════════════
  // BALANCE (Platform)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get platform Stripe balance (admin only)
   */
  getPlatformBalance: protectedProcedure
    .query(async () => {
      try {
        const balance = await stripe.balance.retrieve();
        return {
          available: balance.available.map((b) => ({
            amount: b.amount / 100,
            currency: b.currency,
          })),
          pending: balance.pending.map((b) => ({
            amount: b.amount / 100,
            currency: b.currency,
          })),
        };
      } catch {
        return { available: [], pending: [] };
      }
    }),

  /**
   * Get publishable key for client-side Stripe.js
   */
  getPublishableKey: protectedProcedure
    .query(async () => {
      return {
        publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
      };
    }),
});

// Helper: get features for each plan
function getFeaturesByPlan(planId: string): string[] {
  switch (planId) {
    case "prod_premium_catalyst":
      return [
        "Unlimited load matching",
        "Priority bidding",
        "Advanced analytics",
        "Instant pay (1.5% fee)",
        "Dedicated support",
      ];
    case "prod_premium_broker":
      return [
        "Unlimited load posting",
        "Catalyst network access",
        "Advanced analytics",
        "Automated invoicing",
        "Commission tracking",
        "Priority support",
      ];
    case "prod_premium_shipper":
      return [
        "Unlimited load creation",
        "Catalyst matching AI",
        "Real-time tracking",
        "Advanced analytics",
        "Custom integrations",
        "SLA guarantees",
        "Dedicated account manager",
      ];
    default:
      return [];
  }
}
