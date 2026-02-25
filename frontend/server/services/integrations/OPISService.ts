/**
 * OPIS INTEGRATION SERVICE (via ICE Data Services API)
 * Real-time wholesale rack pricing for refined products, spot market
 * assessments, and terminal-level pricing transparency.
 *
 * Auth: OAuth2 client_credentials → Bearer token OR API key header
 * Base: https://api.ice.com/v1/data/
 * Token: https://api.ice.com/oauth2/token
 * Portal: https://developer.theice.com/
 * Env: OPIS_CLIENT_ID, OPIS_CLIENT_SECRET (OAuth2) or OPIS_API_KEY
 */

import BaseIntegrationService, { SyncResult, MappedRecord } from "./BaseIntegrationService";

// ── Types ────────────────────────────────────────────────────────────
export interface OPISRackPrice {
  terminalId: string;
  terminalName: string;
  city: string;
  state: string;
  product: string;
  productGrade: string;
  supplier: string;
  grossPrice: number;
  netPrice: number;
  freightIncluded: boolean;
  effectiveDate: string;
  effectiveTime: string;
  priceUnit: string;
  changeFromPrior: number;
}

export interface OPISSpotPrice {
  market: string;
  product: string;
  grade: string;
  bidPrice: number;
  askPrice: number;
  midPrice: number;
  volume: number;
  assessmentDate: string;
  assessmentTime: string;
  priceUnit: string;
}

export interface OPISTerminal {
  terminalId: string;
  terminalName: string;
  operator: string;
  city: string;
  state: string;
  padd: number;
  latitude: number;
  longitude: number;
  products: string[];
  suppliers: string[];
}

export interface OPISMarketAssessment {
  assessmentId: string;
  market: string;
  product: string;
  assessmentType: string;
  lowPrice: number;
  highPrice: number;
  midPrice: number;
  weightedAvg: number;
  volume: number;
  date: string;
  commentary: string;
}

export interface OPISRetailPrice {
  stationId: string;
  brand: string;
  city: string;
  state: string;
  zipCode: string;
  product: string;
  retailPrice: number;
  selfServePrice: number;
  fullServePrice: number;
  reportDate: string;
}

// ── Endpoint catalog ─────────────────────────────────────────────────
export const OPIS_ENDPOINTS = {
  // OAuth2
  TOKEN:                "/oauth2/token",
  // Rack Pricing
  RACK_PRICES:          "/v1/data/opis/rack-prices",
  RACK_PRICES_CURRENT:  "/v1/data/opis/rack-prices/current",
  RACK_PRICES_HISTORY:  "/v1/data/opis/rack-prices/history",
  RACK_TERMINALS:       "/v1/data/opis/rack-prices/terminals",
  RACK_SUPPLIERS:       "/v1/data/opis/rack-prices/suppliers",
  RACK_PRODUCTS:        "/v1/data/opis/rack-prices/products",
  // Spot Market
  SPOT_PRICES:          "/v1/data/opis/spot-prices",
  SPOT_PRICES_CURRENT:  "/v1/data/opis/spot-prices/current",
  SPOT_PRICES_HISTORY:  "/v1/data/opis/spot-prices/history",
  SPOT_MARKETS:         "/v1/data/opis/spot-prices/markets",
  // Retail
  RETAIL_PRICES:        "/v1/data/opis/retail-prices",
  RETAIL_PRICES_CURRENT:"/v1/data/opis/retail-prices/current",
  // Market Assessments
  ASSESSMENTS:          "/v1/data/opis/assessments",
  ASSESSMENTS_CURRENT:  "/v1/data/opis/assessments/current",
  // Reference Data
  TERMINAL_DIRECTORY:   "/v1/data/opis/reference/terminals",
  PRODUCT_DIRECTORY:    "/v1/data/opis/reference/products",
  MARKET_DIRECTORY:     "/v1/data/opis/reference/markets",
} as const;

// ── Service ──────────────────────────────────────────────────────────
export class OPISService extends BaseIntegrationService {
  private token: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    super("opis", "https://api.ice.com");
  }

  /** Authenticate via OAuth2 client_credentials */
  async authenticate(clientId?: string, clientSecret?: string): Promise<string> {
    const id = clientId || this.credentials.apiKey || process.env.OPIS_CLIENT_ID;
    const secret = clientSecret || this.credentials.apiSecret || process.env.OPIS_CLIENT_SECRET;

    // If we have a simple API key instead of OAuth2
    const apiKey = process.env.OPIS_API_KEY;
    if (apiKey && !id) {
      this.token = apiKey;
      this.tokenExpiresAt = Date.now() + 24 * 3600 * 1000;
      return apiKey;
    }

    if (!id || !secret) throw new Error("OPIS credentials not configured (need OPIS_CLIENT_ID + OPIS_CLIENT_SECRET or OPIS_API_KEY)");

    if (this.token && Date.now() < this.tokenExpiresAt - 60_000) {
      return this.token;
    }

    const resp = await fetch(`${this.apiBaseUrl}${OPIS_ENDPOINTS.TOKEN}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(15_000),
    });

    if (!resp.ok) throw new Error(`OPIS auth failed (${resp.status})`);
    const data = await resp.json();
    this.token = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
    return this.token!;
  }

  /** Make authenticated OPIS API request */
  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const token = await this.authenticate();
    const qs = new URLSearchParams(params).toString();
    const url = `${this.apiBaseUrl}${endpoint}${qs ? "?" + qs : ""}`;

    const isApiKey = !!process.env.OPIS_API_KEY && !process.env.OPIS_CLIENT_ID;
    const resp = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(isApiKey
          ? { "X-API-Key": token }
          : { Authorization: `Bearer ${token}` }),
      },
      signal: AbortSignal.timeout(30_000),
    });

    if (!resp.ok) {
      if (resp.status === 401) { this.token = null; return this.request(endpoint, params); }
      throw new Error(`OPIS API ${resp.status}: ${await resp.text().catch(() => "")}`);
    }
    return resp.json();
  }

  // ── Public data methods ────────────────────────────────────────────

  async getRackPrices(filters: { state?: string; terminal?: string; product?: string; supplier?: string; limit?: number } = {}): Promise<OPISRackPrice[]> {
    const params: Record<string, string> = { limit: String(filters.limit || 100) };
    if (filters.state) params.state = filters.state;
    if (filters.terminal) params.terminalId = filters.terminal;
    if (filters.product) params.product = filters.product;
    if (filters.supplier) params.supplier = filters.supplier;
    return this.request(OPIS_ENDPOINTS.RACK_PRICES_CURRENT, params);
  }

  async getRackPriceHistory(terminalId: string, product: string, startDate: string, endDate: string): Promise<OPISRackPrice[]> {
    return this.request(OPIS_ENDPOINTS.RACK_PRICES_HISTORY, {
      terminalId, product, startDate, endDate,
    });
  }

  async getSpotPrices(filters: { market?: string; product?: string; limit?: number } = {}): Promise<OPISSpotPrice[]> {
    const params: Record<string, string> = { limit: String(filters.limit || 50) };
    if (filters.market) params.market = filters.market;
    if (filters.product) params.product = filters.product;
    return this.request(OPIS_ENDPOINTS.SPOT_PRICES_CURRENT, params);
  }

  async getTerminals(filters: { state?: string; padd?: number } = {}): Promise<OPISTerminal[]> {
    const params: Record<string, string> = {};
    if (filters.state) params.state = filters.state;
    if (filters.padd) params.padd = String(filters.padd);
    return this.request(OPIS_ENDPOINTS.TERMINAL_DIRECTORY, params);
  }

  async getMarketAssessments(filters: { market?: string; product?: string; date?: string } = {}): Promise<OPISMarketAssessment[]> {
    const params: Record<string, string> = {};
    if (filters.market) params.market = filters.market;
    if (filters.product) params.product = filters.product;
    if (filters.date) params.date = filters.date;
    return this.request(OPIS_ENDPOINTS.ASSESSMENTS_CURRENT, params);
  }

  async getRetailPrices(filters: { state?: string; brand?: string; product?: string; limit?: number } = {}): Promise<OPISRetailPrice[]> {
    const params: Record<string, string> = { limit: String(filters.limit || 100) };
    if (filters.state) params.state = filters.state;
    if (filters.brand) params.brand = filters.brand;
    if (filters.product) params.product = filters.product;
    return this.request(OPIS_ENDPOINTS.RETAIL_PRICES_CURRENT, params);
  }

  async getProducts(): Promise<{ productId: string; productName: string; category: string }[]> {
    return this.request(OPIS_ENDPOINTS.PRODUCT_DIRECTORY);
  }

  async getMarkets(): Promise<{ marketId: string; marketName: string; region: string }[]> {
    return this.request(OPIS_ENDPOINTS.MARKET_DIRECTORY);
  }

  // ── BaseIntegrationService abstract implementations ────────────────

  async testConnection(): Promise<boolean> {
    try { await this.authenticate(); return true; } catch { return false; }
  }

  async fetchData(dataTypes?: string[]): Promise<SyncResult> {
    const result: SyncResult = { success: true, recordsFetched: 0, recordsCreated: 0, recordsUpdated: 0, recordsFailed: 0, errors: [] };
    const types = dataTypes || ["rack_prices", "spot_prices"];
    for (const dt of types) {
      try {
        let data: any[] = [];
        if (dt === "rack_prices") data = await this.getRackPrices({ limit: 500 });
        else if (dt === "spot_prices") data = await this.getSpotPrices({ limit: 200 });
        else if (dt === "terminals") data = await this.getTerminals();
        else if (dt === "assessments") data = await this.getMarketAssessments();
        result.recordsFetched += data.length;
      } catch (e: any) { result.errors.push(`${dt}: ${e.message}`); }
    }
    if (result.errors.length > 0) result.success = false;
    return result;
  }

  mapToInternal(externalData: unknown, dataType: string): MappedRecord[] {
    const records = Array.isArray(externalData) ? externalData : [externalData];
    return records.map(r => ({
      externalId: r.terminalId || r.market || r.assessmentId || "",
      externalType: `opis_${dataType}`,
      externalData: r,
      internalTable: `opis_${dataType}`,
      internalData: r,
    }));
  }
}

export const opisService = new OPISService();
