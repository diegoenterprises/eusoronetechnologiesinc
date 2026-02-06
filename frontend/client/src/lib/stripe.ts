/**
 * STRIPE CLIENT-SIDE UTILITIES
 * Initializes Stripe.js and provides hooks for payment flows
 */

import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get the Stripe.js instance (singleton)
 * Uses the publishable key from environment or fetches from server
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
    if (!key) {
      console.warn("[Stripe] No publishable key configured");
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

/**
 * Redirect to Stripe Checkout
 * Used for subscription purchases and load payments
 */
export async function redirectToCheckout(sessionUrl: string): Promise<void> {
  // Stripe Checkout sessions return a URL - just redirect
  window.location.href = sessionUrl;
}

/**
 * Format amount for display (cents to dollars)
 */
export function formatStripeAmount(amountCents: number, currency: string = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

/**
 * Format amount from dollars for display
 */
export function formatDollars(amount: number, currency: string = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}
