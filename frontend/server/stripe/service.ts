/**
 * STRIPE SERVICE
 * 
 * Handles all Stripe payment operations:
 * - Creating checkout sessions
 * - Processing webhooks
 * - Managing subscriptions
 * - Handling refunds
 */

import Stripe from "stripe";
import { ENV } from "../_core/env";
import { LOAD_PAYMENT_PRODUCT, calculateTotalCharge } from "./products";

// Initialize Stripe with secret key (lazy — server won't crash if key is missing at startup)
let _stripe: Stripe | null = null;

function getStripeInstance(): Stripe {
  if (!_stripe) {
    if (!ENV.stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured. Add it to your .env file.");
    }
    _stripe = new Stripe(ENV.stripeSecretKey, {
      apiVersion: "2025-10-29.clover",
    });
  }
  return _stripe;
}

// Named export — use stripe getter so server boots even without key
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripeInstance() as any)[prop];
  },
});

/**
 * Create a checkout session for load payment
 */
export async function createLoadPaymentCheckout(params: {
  loadId: number;
  loadNumber: string;
  amount: number; // in cents
  currency: string;
  userId: number;
  userEmail: string;
  userName: string;
  originUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const { loadId, loadNumber, amount, currency, userId, userEmail, userName, originUrl } = params;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: `${LOAD_PAYMENT_PRODUCT.name} - ${loadNumber}`,
            description: LOAD_PAYMENT_PRODUCT.description,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${originUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${originUrl}/payments/cancelled`,
    customer_email: userEmail,
    client_reference_id: userId.toString(),
    metadata: {
      user_id: userId.toString(),
      customer_email: userEmail,
      customer_name: userName,
      load_id: loadId.toString(),
      load_number: loadNumber,
      payment_type: "load_payment",
    },
    allow_promotion_codes: true,
  });

  return session;
}

/**
 * Create a checkout session for subscription
 */
export async function createSubscriptionCheckout(params: {
  priceId: string;
  userId: number;
  userEmail: string;
  userName: string;
  originUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const { priceId, userId, userEmail, userName, originUrl } = params;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${originUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${originUrl}/subscription/cancelled`,
    customer_email: userEmail,
    client_reference_id: userId.toString(),
    metadata: {
      user_id: userId.toString(),
      customer_email: userEmail,
      customer_name: userName,
      payment_type: "subscription",
    },
    allow_promotion_codes: true,
  });

  return session;
}

/**
 * Retrieve a checkout session
 */
export async function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  return await stripe.checkout.sessions.retrieve(sessionId);
}

/**
 * Create a refund for a payment
 */
export async function createRefund(params: {
  paymentIntentId: string;
  amount?: number; // in cents, optional for partial refund
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
}): Promise<Stripe.Refund> {
  const { paymentIntentId, amount, reason } = params;

  return await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount,
    reason,
  });
}

/**
 * Get customer by ID
 */
export async function getCustomer(customerId: string): Promise<Stripe.Customer> {
  return (await stripe.customers.retrieve(customerId)) as Stripe.Customer;
}

/**
 * Create or update a customer
 */
export async function createOrUpdateCustomer(params: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
  stripeCustomerId?: string;
}): Promise<Stripe.Customer> {
  const { email, name, metadata, stripeCustomerId } = params;

  if (stripeCustomerId) {
    // Update existing customer
    return await stripe.customers.update(stripeCustomerId, {
      email,
      name,
      metadata,
    });
  } else {
    // Create new customer
    return await stripe.customers.create({
      email,
      name,
      metadata,
    });
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Get payment intent
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

/**
 * List customer payments
 */
export async function listCustomerPayments(customerId: string, limit: number = 10): Promise<Stripe.Charge[]> {
  const charges = await stripe.charges.list({
    customer: customerId,
    limit,
  });
  return charges.data;
}

/**
 * Collect payment from shipper when a settlement is created on DELIVERED.
 *
 * Creates a Stripe PaymentIntent for the totalShipperCharge.
 * If the shipper has a saved default payment method it is attached automatically;
 * otherwise the PaymentIntent stays in "requires_payment_method" and the shipper
 * is prompted to pay via the EusoWallet / Payments UI.
 *
 * Returns the PaymentIntent ID (or null on failure — fire-and-forget, non-blocking).
 */
export async function collectShipperPayment(params: {
  loadId: number;
  loadNumber: string;
  shipperId: number;
  shipperEmail: string;
  shipperName: string;
  totalShipperCharge: number; // dollars
  platformFee: number; // dollars
  carrierStripeConnectId?: string | null;
  carrierPayout: number; // dollars
}): Promise<string | null> {
  const {
    loadId, loadNumber, shipperId, shipperEmail, shipperName,
    totalShipperCharge, platformFee, carrierStripeConnectId, carrierPayout,
  } = params;

  if (totalShipperCharge <= 0) return null;

  try {
    // 1. Resolve or create Stripe customer for shipper
    let customerId: string | undefined;
    try {
      const existing = await stripe.customers.list({ email: shipperEmail, limit: 1 });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      } else {
        const newCust = await stripe.customers.create({
          email: shipperEmail,
          name: shipperName,
          metadata: { userId: String(shipperId), platform: "eusotrip" },
        });
        customerId = newCust.id;
      }
    } catch {
      // If customer resolution fails, create PI without customer (card entry required)
    }

    const amountCents = Math.round(totalShipperCharge * 100);
    const feeCents = Math.round(platformFee * 100);

    // 2. Build PaymentIntent params
    const piParams: Stripe.PaymentIntentCreateParams = {
      amount: amountCents,
      currency: "usd",
      description: `Load #${loadNumber} — Freight Payment`,
      metadata: {
        payment_type: "settlement_collection",
        load_id: String(loadId),
        load_number: loadNumber,
        shipper_id: String(shipperId),
        platform_fee: platformFee.toFixed(2),
        carrier_payout: carrierPayout.toFixed(2),
      },
      automatic_payment_methods: { enabled: true },
    };

    if (customerId) {
      piParams.customer = customerId;
    }

    // 3. If carrier has a Connect account, use destination charge so
    //    funds flow directly to carrier minus platform application_fee
    if (carrierStripeConnectId) {
      piParams.application_fee_amount = feeCents;
      piParams.transfer_data = { destination: carrierStripeConnectId };
    }

    // 4. Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create(piParams);
    return paymentIntent.id;
  } catch (err: any) {
    // Non-blocking — log and return null; settlement still exists
    console.error(`[Stripe] collectShipperPayment failed for load ${loadId}:`, err?.message);
    return null;
  }
}
