/**
 * STRIPE ROUTER
 * Unified tRPC router for all Stripe payment operations
 * - Checkout sessions (load payments + subscriptions)
 * - Stripe Connect onboarding (carriers, drivers, brokers)
 * - Customer management
 * - Payment methods (add, remove, list)
 * - Subscription management
 * - Payouts via Connect
 * - Payment intents for in-app payments
 */

import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, companies, wallets, walletTransactions, payments } from "../../drizzle/schema";
import { stripe } from "../stripe/service";
import { SUBSCRIPTION_PRODUCTS, PLATFORM_FEE_PERCENTAGE, MINIMUM_PLATFORM_FEE, calculatePlatformFee } from "../stripe/products";

// Helper: resolve openId to numeric DB user id
async function resolveUserId(openId: string | number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const strId = String(openId);
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.openId, strId)).limit(1);
  return user?.id || 0;
}

// Helper: get or create Stripe customer for a user
async function getOrCreateStripeCustomer(userOpenId: string | number, email: string, name?: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const numericId = await resolveUserId(userOpenId);
  if (!numericId) throw new Error("User not found");

  const [user] = await db.select().from(users).where(eq(users.id, numericId)).limit(1);
  
  // Check if user already has a Stripe customer ID stored
  const stripeCustomerId = (user as any)?.stripeCustomerId;
  if (stripeCustomerId) {
    try {
      await stripe.customers.retrieve(stripeCustomerId);
      return stripeCustomerId;
    } catch {
      // Customer was deleted from Stripe, create a new one
    }
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: name || email,
    metadata: {
      userId: String(numericId),
      platform: "eusotrip",
    },
  });

  // Store the customer ID on the user record
  try {
    await db.execute(
      `UPDATE users SET stripe_customer_id = '${customer.id}' WHERE id = ${numericId}`
    );
  } catch {
    // Column may not exist yet - non-critical
    console.warn("[Stripe] Could not store customer ID on user record");
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
   * Create a SetupIntent for adding a payment method
   */
  createSetupIntent: protectedProcedure
    .mutation(async ({ ctx }) => {
      const customerId = await getOrCreateStripeCustomer(
        ctx.user.id,
        ctx.user.email || "",
        ctx.user.name || undefined
      );

      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ["card"],
        metadata: {
          userId: String(ctx.user.id),
        },
      });

      return {
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
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
      carrierConnectId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const amountCents = Math.round(input.amount * 100);
      const platformFeeCents = calculatePlatformFee(amountCents);

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
        success_url: `${process.env.APP_URL || "https://eusotrip-app.azurewebsites.net"}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL || "https://eusotrip-app.azurewebsites.net"}/payments/cancelled`,
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

      // If carrier has a Connect account, route payment to them
      if (input.carrierConnectId) {
        sessionParams.payment_intent_data = {
          application_fee_amount: platformFeeCents,
          transfer_data: {
            destination: input.carrierConnectId,
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
        success_url: `${process.env.APP_URL || "https://eusotrip-app.azurewebsites.net"}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL || "https://eusotrip-app.azurewebsites.net"}/subscription/cancelled`,
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
        console.error("[Stripe] getSubscription error:", error);
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
  // STRIPE CONNECT (Carrier/Driver/Broker onboarding)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Create a Stripe Connect Express account
   */
  createConnectAccount: protectedProcedure
    .input(z.object({
      businessType: z.enum(["individual", "company"]).default("individual"),
    }))
    .mutation(async ({ ctx, input }) => {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: ctx.user.email || undefined,
        business_type: input.businessType,
        capabilities: {
          transfers: { requested: true },
        },
        metadata: {
          userId: String(ctx.user.id),
          platform: "eusotrip",
          userRole: ctx.user.role || "carrier",
        },
      });

      // Store connect account ID on user
      try {
        const db = await getDb();
        if (db) {
          await db.execute(
            `UPDATE users SET stripe_connect_id = '${account.id}' WHERE id = ${ctx.user.id}`
          );
        }
      } catch {
        console.warn("[Stripe] Could not store connect ID on user record");
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
      const appUrl = process.env.APP_URL || "https://eusotrip-app.azurewebsites.net";
      const accountLink = await stripe.accountLinks.create({
        account: input.accountId,
        refresh_url: `${appUrl}/settings/payments?refresh=true`,
        return_url: `${appUrl}/settings/payments?onboarding=complete`,
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
        const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
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
        const feeCents = calculatePlatformFee(amountCents);
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
   * Create a transfer to a connected account (carrier/driver payout)
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
    case "prod_premium_carrier":
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
        "Carrier network access",
        "Advanced analytics",
        "Automated invoicing",
        "Commission tracking",
        "Priority support",
      ];
    case "prod_premium_shipper":
      return [
        "Unlimited load creation",
        "Carrier matching AI",
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
