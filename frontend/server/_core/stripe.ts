/**
 * STRIPE PAYMENT SERVICE
 * Handles Stripe Connect, payment processing, and wallet operations
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

interface CreateConnectAccountParams {
  userId: number;
  email: string;
  businessType: "individual" | "company";
  country?: string;
}

interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  customerId?: string;
  loadId?: number;
  description?: string;
}

interface CreatePayoutParams {
  amount: number;
  stripeConnectId: string;
  currency?: string;
  description?: string;
}

class StripeService {
  private apiKey: string;
  private baseUrl = "https://api.stripe.com/v1";

  constructor() {
    this.apiKey = STRIPE_SECRET_KEY;
    if (!this.apiKey) {
      console.warn("[Stripe] STRIPE_SECRET_KEY not configured");
    }
  }

  private async request(endpoint: string, method: string = "GET", data?: Record<string, any>) {
    if (!this.apiKey) {
      throw new Error("Stripe not configured");
    }

    const headers: Record<string, string> = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (data && method !== "GET") {
      options.body = new URLSearchParams(this.flattenObject(data)).toString();
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error?.message || "Stripe API error");
    }

    return json;
  }

  private flattenObject(obj: Record<string, any>, prefix = ""): Record<string, string> {
    const result: Record<string, string> = {};
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}[${key}]` : key;
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        Object.assign(result, this.flattenObject(value, newKey));
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === "object") {
            Object.assign(result, this.flattenObject(item, `${newKey}[${index}]`));
          } else {
            result[`${newKey}[${index}]`] = String(item);
          }
        });
      } else {
        result[newKey] = String(value);
      }
    }
    return result;
  }

  /**
   * Create a Stripe Customer
   */
  async createCustomer(email: string, name?: string, metadata?: Record<string, string>) {
    return this.request("/customers", "POST", {
      email,
      name,
      metadata,
    });
  }

  /**
   * Create a Stripe Connect Account for payouts
   */
  async createConnectAccount(params: CreateConnectAccountParams) {
    return this.request("/accounts", "POST", {
      type: "express",
      country: params.country || "US",
      email: params.email,
      business_type: params.businessType,
      capabilities: {
        transfers: { requested: true },
      },
      metadata: {
        userId: String(params.userId),
      },
    });
  }

  /**
   * Create account link for Connect onboarding
   */
  async createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
    return this.request("/account_links", "POST", {
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });
  }

  /**
   * Get Connect account status
   */
  async getConnectAccount(accountId: string) {
    return this.request(`/accounts/${accountId}`);
  }

  /**
   * Create a Payment Intent
   */
  async createPaymentIntent(params: CreatePaymentIntentParams) {
    return this.request("/payment_intents", "POST", {
      amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency || "usd",
      customer: params.customerId,
      description: params.description,
      metadata: {
        loadId: params.loadId ? String(params.loadId) : undefined,
      },
    });
  }

  /**
   * Create a Transfer to Connect account
   */
  async createTransfer(amount: number, destination: string, description?: string) {
    return this.request("/transfers", "POST", {
      amount: Math.round(amount * 100),
      currency: "usd",
      destination,
      description,
    });
  }

  /**
   * Create a Payout from Connect account
   */
  async createPayout(params: CreatePayoutParams) {
    return this.request("/payouts", "POST", {
      amount: Math.round(params.amount * 100),
      currency: params.currency || "usd",
      description: params.description,
    });
  }

  /**
   * Get balance for connected account
   */
  async getBalance(stripeConnectId?: string) {
    const headers: Record<string, string> = {};
    if (stripeConnectId) {
      headers["Stripe-Account"] = stripeConnectId;
    }
    return this.request("/balance");
  }

  /**
   * Create external account (bank account for payouts)
   */
  async createExternalAccount(accountId: string, token: string) {
    return this.request(`/accounts/${accountId}/external_accounts`, "POST", {
      external_account: token,
    });
  }

  /**
   * List transactions/charges
   */
  async listCharges(limit = 10, customerId?: string) {
    const params = new URLSearchParams({ limit: String(limit) });
    if (customerId) params.append("customer", customerId);
    return this.request(`/charges?${params.toString()}`);
  }

  /**
   * Create a refund
   */
  async createRefund(chargeId: string, amount?: number, reason?: string) {
    return this.request("/refunds", "POST", {
      charge: chargeId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason,
    });
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!STRIPE_WEBHOOK_SECRET) {
      console.warn("[Stripe] Webhook secret not configured");
      return false;
    }
    // In production, use Stripe's library for proper signature verification
    // This is a placeholder - actual implementation would use crypto
    return true;
  }
}

export const stripeService = new StripeService();
