/**
 * ENVERUS INTEGRATION SERVICE
 * Developer API v3 — Energy analytics: crude oil pricing, production data,
 * pipeline flow intelligence, basin-level market insights.
 *
 * Auth: Secret key → POST /v3/direct-access/tokens → Bearer token (8hr TTL)
 * Docs: https://app.enverus.com/direct/#/api/explorer/v3/gettingStarted
 * Key management: https://app.enverus.com/provisioning/directaccess
 * Env: ENVERUS_SECRET_KEY
 */

import BaseIntegrationService, { SyncResult, MappedRecord } from "./BaseIntegrationService";

// ── Types ────────────────────────────────────────────────────────────
export interface EnverusWell {
  API14: string;
  WellName: string;
  Operator: string;
  County: string;
  State: string;
  Basin: string;
  Latitude: number;
  Longitude: number;
  WellStatus: string;
  WellType: string;
  FirstProdDate?: string;
  TotalDepth?: number;
}

export interface EnverusProduction {
  API14: string;
  WellName: string;
  Operator: string;
  ReportDate: string;
  OilBbl: number;
  GasMcf: number;
  WaterBbl: number;
  State: string;
  County: string;
  Basin: string;
}

export interface EnverusRig {
  RigId: string;
  RigName: string;
  Operator: string;
  County: string;
  State: string;
  Basin: string;
  Latitude: number;
  Longitude: number;
  DrillType: string;
  Status: string;
  SpudDate?: string;
  TargetFormation?: string;
}

export interface EnverusCompletion {
  API14: string;
  WellName: string;
  Operator: string;
  CompletionDate: string;
  LateralLength?: number;
  ProppantLbs?: number;
  FluidGallons?: number;
  State: string;
  Basin: string;
}

export interface EnverusPermit {
  PermitNumber: string;
  API14?: string;
  Operator: string;
  County: string;
  State: string;
  ApprovedDate: string;
  WellType: string;
  Latitude: number;
  Longitude: number;
}

export interface EnverusCrudePrice {
  Date: string;
  Benchmark: string;
  Price: number;
  Change: number;
  Unit: string;
}

// ── Endpoint catalog ─────────────────────────────────────────────────
export const ENVERUS_ENDPOINTS = {
  TOKEN:          "/v3/direct-access/tokens",
  WELLS:          "/v3/direct-access/wells",
  PRODUCTION:     "/v3/direct-access/production",
  RIGS:           "/v3/direct-access/rigs",
  COMPLETIONS:    "/v3/direct-access/completions",
  PERMITS:        "/v3/direct-access/permits",
  FORMATIONS:     "/v3/direct-access/formations",
  ECONOMICS:      "/v3/direct-access/economics",
  CRUDE_PRICES:   "/v3/direct-access/crude-oil-prices",
  BASINS:         "/v3/direct-access/basins",
  OPERATORS:      "/v3/direct-access/operators",
  COUNTIES:       "/v3/direct-access/counties",
  LEASE_OWNERSHIP:"/v3/direct-access/lease-ownership",
  FRAC_SCHEDULES: "/v3/direct-access/frac-schedules",
  PIPELINE_FLOWS: "/v3/direct-access/pipeline-flows",
} as const;

// ── Service ──────────────────────────────────────────────────────────
export class EnverusService extends BaseIntegrationService {
  private token: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    super("enverus", "https://api.enverus.com");
  }

  /** Authenticate with secret key → bearer token */
  async authenticate(secretKey?: string): Promise<string> {
    const key = secretKey || this.credentials.apiKey || process.env.ENVERUS_SECRET_KEY;
    if (!key) throw new Error("Enverus secret key not configured");

    if (this.token && Date.now() < this.tokenExpiresAt - 60_000) {
      return this.token;
    }

    const resp = await fetch(`${this.apiBaseUrl}${ENVERUS_ENDPOINTS.TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secretKey: key }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!resp.ok) {
      const err = await resp.text().catch(() => "");
      throw new Error(`Enverus auth failed (${resp.status}): ${err}`);
    }

    const data = await resp.json();
    this.token = data.token || data.access_token;
    this.tokenExpiresAt = Date.now() + 8 * 3600 * 1000; // 8hr TTL
    return this.token!;
  }

  /** Make authenticated request to Enverus API */
  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const token = await this.authenticate();
    const qs = new URLSearchParams(params).toString();
    const url = `${this.apiBaseUrl}${endpoint}${qs ? "?" + qs : ""}`;

    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(30_000),
    });

    if (!resp.ok) {
      if (resp.status === 401) {
        this.token = null;
        return this.request(endpoint, params); // retry once
      }
      throw new Error(`Enverus API ${resp.status}: ${await resp.text().catch(() => "")}`);
    }
    return resp.json();
  }

  // ── Public data methods ────────────────────────────────────────────

  async getWells(filters: { state?: string; county?: string; operator?: string; basin?: string; limit?: number } = {}): Promise<EnverusWell[]> {
    const params: Record<string, string> = { pagesize: String(filters.limit || 100) };
    if (filters.state) params.state = filters.state;
    if (filters.county) params.county = filters.county;
    if (filters.operator) params.operator = filters.operator;
    if (filters.basin) params.basin = filters.basin;
    return this.request(ENVERUS_ENDPOINTS.WELLS, params);
  }

  async getProduction(filters: { state?: string; operator?: string; basin?: string; startDate?: string; endDate?: string; limit?: number } = {}): Promise<EnverusProduction[]> {
    const params: Record<string, string> = { pagesize: String(filters.limit || 100) };
    if (filters.state) params.state = filters.state;
    if (filters.operator) params.operator = filters.operator;
    if (filters.basin) params.basin = filters.basin;
    if (filters.startDate) params.reportdate_gte = filters.startDate;
    if (filters.endDate) params.reportdate_lte = filters.endDate;
    return this.request(ENVERUS_ENDPOINTS.PRODUCTION, params);
  }

  async getRigs(filters: { state?: string; basin?: string; operator?: string; status?: string; limit?: number } = {}): Promise<EnverusRig[]> {
    const params: Record<string, string> = { pagesize: String(filters.limit || 100) };
    if (filters.state) params.state = filters.state;
    if (filters.basin) params.basin = filters.basin;
    if (filters.operator) params.operator = filters.operator;
    if (filters.status) params.status = filters.status;
    return this.request(ENVERUS_ENDPOINTS.RIGS, params);
  }

  async getCompletions(filters: { state?: string; basin?: string; operator?: string; limit?: number } = {}): Promise<EnverusCompletion[]> {
    const params: Record<string, string> = { pagesize: String(filters.limit || 100) };
    if (filters.state) params.state = filters.state;
    if (filters.basin) params.basin = filters.basin;
    if (filters.operator) params.operator = filters.operator;
    return this.request(ENVERUS_ENDPOINTS.COMPLETIONS, params);
  }

  async getPermits(filters: { state?: string; county?: string; operator?: string; limit?: number } = {}): Promise<EnverusPermit[]> {
    const params: Record<string, string> = { pagesize: String(filters.limit || 100) };
    if (filters.state) params.state = filters.state;
    if (filters.county) params.county = filters.county;
    if (filters.operator) params.operator = filters.operator;
    return this.request(ENVERUS_ENDPOINTS.PERMITS, params);
  }

  async getCrudePrices(benchmark?: string): Promise<EnverusCrudePrice[]> {
    const params: Record<string, string> = {};
    if (benchmark) params.benchmark = benchmark;
    return this.request(ENVERUS_ENDPOINTS.CRUDE_PRICES, params);
  }

  async getPipelineFlows(filters: { pipeline?: string; state?: string; limit?: number } = {}): Promise<any[]> {
    const params: Record<string, string> = { pagesize: String(filters.limit || 100) };
    if (filters.pipeline) params.pipeline = filters.pipeline;
    if (filters.state) params.state = filters.state;
    return this.request(ENVERUS_ENDPOINTS.PIPELINE_FLOWS, params);
  }

  // ── BaseIntegrationService abstract implementations ────────────────

  async testConnection(): Promise<boolean> {
    try {
      await this.authenticate();
      return true;
    } catch { return false; }
  }

  async fetchData(dataTypes?: string[]): Promise<SyncResult> {
    const result: SyncResult = { success: true, recordsFetched: 0, recordsCreated: 0, recordsUpdated: 0, recordsFailed: 0, errors: [] };
    const types = dataTypes || ["wells", "production", "rigs"];
    for (const dt of types) {
      try {
        let data: any[] = [];
        if (dt === "wells") data = await this.getWells({ limit: 500 });
        else if (dt === "production") data = await this.getProduction({ limit: 500 });
        else if (dt === "rigs") data = await this.getRigs({ limit: 500 });
        else if (dt === "completions") data = await this.getCompletions({ limit: 500 });
        else if (dt === "permits") data = await this.getPermits({ limit: 500 });
        result.recordsFetched += data.length;
      } catch (e: any) {
        result.errors.push(`${dt}: ${e.message}`);
      }
    }
    if (result.errors.length > 0) result.success = false;
    return result;
  }

  mapToInternal(externalData: unknown, dataType: string): MappedRecord[] {
    const records = Array.isArray(externalData) ? externalData : [externalData];
    return records.map(r => ({
      externalId: r.API14 || r.RigId || r.PermitNumber || "",
      externalType: `enverus_${dataType}`,
      externalData: r,
      internalTable: `enverus_${dataType}`,
      internalData: r,
    }));
  }
}

export const enverusService = new EnverusService();
