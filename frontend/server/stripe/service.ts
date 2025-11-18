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

// Initialize Stripe with secret key
const stripe = new Stripe(ENV.stripeSecretKey, {
  apiVersion: "2025-10-29.clover",
});

export { stripe };

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

