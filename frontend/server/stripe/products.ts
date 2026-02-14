/**
 * STRIPE PRODUCTS CONFIGURATION
 * 
 * Define all Stripe products and prices for the EusoTrip platform
 * Products are created in Stripe Dashboard and referenced here by ID
 */

export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  priceId: string;
  amount: number; // in cents
  currency: string;
  type: "one_time" | "recurring";
  interval?: "month" | "year";
}

/**
 * Load Payment Products
 * These are dynamic - amounts are calculated based on load details
 */
export const LOAD_PAYMENT_PRODUCT = {
  name: "Load Payment",
  description: "Payment for freight load transportation",
  currency: "usd",
  type: "one_time" as const,
};

/**
 * Subscription Products
 * Premium features for catalysts, brokers, and shippers
 */
export const SUBSCRIPTION_PRODUCTS: StripeProduct[] = [
  {
    id: "prod_premium_catalyst",
    name: "Premium Catalyst",
    description: "Advanced features for catalysts - unlimited loads, priority bidding, analytics",
    priceId: "price_premium_catalyst_monthly",
    amount: 9900, // $99/month
    currency: "usd",
    type: "recurring",
    interval: "month",
  },
  {
    id: "prod_premium_broker",
    name: "Premium Broker",
    description: "Advanced features for brokers - unlimited loads, catalyst network, analytics",
    priceId: "price_premium_broker_monthly",
    amount: 14900, // $149/month
    currency: "usd",
    type: "recurring",
    interval: "month",
  },
  {
    id: "prod_premium_shipper",
    name: "Premium Shipper",
    description: "Advanced features for shippers - unlimited loads, catalyst matching, analytics",
    priceId: "price_premium_shipper_monthly",
    amount: 19900, // $199/month
    currency: "usd",
    type: "recurring",
    interval: "month",
  },
];

/**
 * Platform Fee Configuration
 * EusoTrip takes a percentage of each load payment
 */
export const PLATFORM_FEE_PERCENTAGE = 0.05; // 5%
export const MINIMUM_PLATFORM_FEE = 500; // $5.00 minimum

/**
 * Calculate platform fee for a load payment
 */
export function calculatePlatformFee(loadAmount: number): number {
  const fee = Math.floor(loadAmount * PLATFORM_FEE_PERCENTAGE);
  return Math.max(fee, MINIMUM_PLATFORM_FEE);
}

/**
 * Calculate total charge including platform fee
 */
export function calculateTotalCharge(loadAmount: number): number {
  return loadAmount + calculatePlatformFee(loadAmount);
}

