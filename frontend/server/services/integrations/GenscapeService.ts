/**
 * GENSCAPE / WOOD MACKENZIE INTEGRATION SERVICE
 * Lens Direct API — Physical energy market intelligence: oil storage levels,
 * pipeline flows, refinery utilization, supply/demand fundamentals.
 *
 * Auth: API key via `Gen-Api-Key` header or `genApiKey` query param
 * Base: https://api.genscape.com/
 * Portal: https://developer.genscape.com/
 * Rate limits: 30 requests/min, 1,000 requests/day
 * Env: GENSCAPE_API_KEY
 */

import BaseIntegrationService, { SyncResult, MappedRecord } from "./BaseIntegrationService";

// ── Types ────────────────────────────────────────────────────────────
export interface GenscapeStorageReport {
  hubName: string;
  region: string;
  reportDate: string;
  totalCapacity: number;
  currentInventory: number;
  utilizationPct: number;
  weekOverWeekChange: number;
  unit: string;
}

export interface GenscapeStorageByOwner {
  owner: string;
  hubName: string;
  tankCount: number;
  shellCapacity: number;
  currentLevel: number;
  utilizationPct: number;
  reportDate: string;
  unit: string;
}

export interface GenscapePipelineFlow {
  pipelineName: string;
  segment: string;
  direction: string;
  flowRate: number;
  capacity: number;
  utilizationPct: number;
  product: string;
  measurementDate: string;
  unit: string;
}

export interface GenscapeRefineryStatus {
  refineryName: string;
  operator: string;
  city: string;
  state: string;
  padd: number;
  atmosphericCapacity: number;
  currentThroughput: number;
  utilizationPct: number;
  status: string;
  reportDate: string;
  unit: string;
}

export interface GenscapeSupplyDemand {
  region: string;
  product: string;
  supply: number;
  demand: number;
  netBalance: number;
  imports: number;
  exports: number;
  reportDate: string;
  unit: string;
}

export interface GenscapeCushingStorage {
  reportDate: string;
  totalInventory: number;
  shellCapacity: number;
  utilizationPct: number;
  weekOverWeekChange: number;
  unit: string;
}

// ── Endpoint catalog ─────────────────────────────────────────────────
export const GENSCAPE_ENDPOINTS = {
  // Oil Storage
  OIL_STORAGE_HUBS:        "/oil/na/v1/storage/hubs",
  OIL_STORAGE_CURRENT:     "/oil/na/v1/storage/current",
  OIL_STORAGE_HISTORY:     "/oil/na/v1/storage/history",
  OIL_STORAGE_BY_OWNER:    "/oil/na/v1/storage/by-owner",
  OIL_STORAGE_CUSHING:     "/oil/na/v1/storage/cushing",
  // Pipeline Flows
  PIPELINE_FLOWS_CURRENT:  "/oil/na/v1/pipeline-flows/current",
  PIPELINE_FLOWS_HISTORY:  "/oil/na/v1/pipeline-flows/history",
  PIPELINE_DIRECTORY:      "/oil/na/v1/pipeline-flows/pipelines",
  // Refinery
  REFINERY_STATUS:         "/oil/na/v1/refinery/status",
  REFINERY_UTILIZATION:    "/oil/na/v1/refinery/utilization",
  REFINERY_OUTAGES:        "/oil/na/v1/refinery/outages",
  REFINERY_DIRECTORY:      "/oil/na/v1/refinery/directory",
  // Supply & Demand
  SUPPLY_DEMAND_CURRENT:   "/oil/na/v1/supply-demand/current",
  SUPPLY_DEMAND_FORECAST:  "/oil/na/v1/supply-demand/forecast",
  // Marine / Vessel Tracking
  VESSEL_TRACKING:         "/oil/na/v1/marine/vessels",
  PORT_ACTIVITY:           "/oil/na/v1/marine/port-activity",
  // Power (bonus — useful for LNG/NatGas terminals)
  POWER_GENERATION:        "/power/na/v1/generation-transmission/current",
  NATURAL_GAS_STORAGE:     "/ng/na/v1/storage/current",
  NATURAL_GAS_FLOWS:       "/ng/na/v1/pipeline-flows/current",
} as const;

// ── Service ──────────────────────────────────────────────────────────
export class GenscapeService extends BaseIntegrationService {
  private apiKey: string | null = null;

  constructor() {
    super("genscape", "https://api.genscape.com");
  }

  /** Set API key from credentials or env */
  private getApiKey(): string {
    if (this.apiKey) return this.apiKey;
    this.apiKey = this.credentials.apiKey || process.env.GENSCAPE_API_KEY || "";
    if (!this.apiKey) throw new Error("Genscape API key not configured (set GENSCAPE_API_KEY)");
    return this.apiKey;
  }

  /** Make authenticated Genscape API request */
  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const key = this.getApiKey();
    params.format = params.format || "json";
    const qs = new URLSearchParams(params).toString();
    const url = `${this.apiBaseUrl}${endpoint}${qs ? "?" + qs : ""}`;

    const resp = await fetch(url, {
      headers: {
        "Gen-Api-Key": key,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(30_000),
    });

    if (resp.status === 503) throw new Error("Genscape rate limit exceeded (30/min or 1000/day)");
    if (!resp.ok) throw new Error(`Genscape API ${resp.status}: ${await resp.text().catch(() => "")}`);
    return resp.json();
  }

  // ── Public data methods ────────────────────────────────────────────

  async getStorageHubs(): Promise<{ hubId: string; hubName: string; region: string; country: string }[]> {
    return this.request(GENSCAPE_ENDPOINTS.OIL_STORAGE_HUBS);
  }

  async getCurrentStorage(filters: { hub?: string; region?: string; limit?: number } = {}): Promise<GenscapeStorageReport[]> {
    const params: Record<string, string> = { limit: String(filters.limit || 50) };
    if (filters.hub) params.hub = filters.hub;
    if (filters.region) params.region = filters.region;
    return this.request(GENSCAPE_ENDPOINTS.OIL_STORAGE_CURRENT, params);
  }

  async getStorageByOwner(hub: string): Promise<GenscapeStorageByOwner[]> {
    return this.request(GENSCAPE_ENDPOINTS.OIL_STORAGE_BY_OWNER, { hub });
  }

  async getCushingStorage(): Promise<GenscapeCushingStorage[]> {
    return this.request(GENSCAPE_ENDPOINTS.OIL_STORAGE_CUSHING);
  }

  async getStorageHistory(hub: string, startDate: string, endDate: string): Promise<GenscapeStorageReport[]> {
    return this.request(GENSCAPE_ENDPOINTS.OIL_STORAGE_HISTORY, { hub, startDate, endDate });
  }

  async getPipelineFlows(filters: { pipeline?: string; product?: string; limit?: number } = {}): Promise<GenscapePipelineFlow[]> {
    const params: Record<string, string> = { limit: String(filters.limit || 50) };
    if (filters.pipeline) params.pipeline = filters.pipeline;
    if (filters.product) params.product = filters.product;
    return this.request(GENSCAPE_ENDPOINTS.PIPELINE_FLOWS_CURRENT, params);
  }

  async getPipelineDirectory(): Promise<{ pipelineId: string; pipelineName: string; operator: string; product: string }[]> {
    return this.request(GENSCAPE_ENDPOINTS.PIPELINE_DIRECTORY);
  }

  async getRefineryStatus(filters: { state?: string; padd?: number; operator?: string } = {}): Promise<GenscapeRefineryStatus[]> {
    const params: Record<string, string> = {};
    if (filters.state) params.state = filters.state;
    if (filters.padd) params.padd = String(filters.padd);
    if (filters.operator) params.operator = filters.operator;
    return this.request(GENSCAPE_ENDPOINTS.REFINERY_STATUS, params);
  }

  async getRefineryUtilization(filters: { padd?: number } = {}): Promise<GenscapeRefineryStatus[]> {
    const params: Record<string, string> = {};
    if (filters.padd) params.padd = String(filters.padd);
    return this.request(GENSCAPE_ENDPOINTS.REFINERY_UTILIZATION, params);
  }

  async getRefineryOutages(): Promise<any[]> {
    return this.request(GENSCAPE_ENDPOINTS.REFINERY_OUTAGES);
  }

  async getSupplyDemand(filters: { region?: string; product?: string } = {}): Promise<GenscapeSupplyDemand[]> {
    const params: Record<string, string> = {};
    if (filters.region) params.region = filters.region;
    if (filters.product) params.product = filters.product;
    return this.request(GENSCAPE_ENDPOINTS.SUPPLY_DEMAND_CURRENT, params);
  }

  async getSupplyDemandForecast(filters: { region?: string; product?: string; horizon?: string } = {}): Promise<GenscapeSupplyDemand[]> {
    const params: Record<string, string> = {};
    if (filters.region) params.region = filters.region;
    if (filters.product) params.product = filters.product;
    if (filters.horizon) params.horizon = filters.horizon;
    return this.request(GENSCAPE_ENDPOINTS.SUPPLY_DEMAND_FORECAST, params);
  }

  async getNaturalGasStorage(): Promise<any[]> {
    return this.request(GENSCAPE_ENDPOINTS.NATURAL_GAS_STORAGE);
  }

  // ── BaseIntegrationService abstract implementations ────────────────

  async testConnection(): Promise<boolean> {
    try {
      this.getApiKey();
      await this.getStorageHubs();
      return true;
    } catch { return false; }
  }

  async fetchData(dataTypes?: string[]): Promise<SyncResult> {
    const result: SyncResult = { success: true, recordsFetched: 0, recordsCreated: 0, recordsUpdated: 0, recordsFailed: 0, errors: [] };
    const types = dataTypes || ["storage", "pipeline_flows", "refinery_status"];
    for (const dt of types) {
      try {
        let data: any[] = [];
        if (dt === "storage") data = await this.getCurrentStorage({ limit: 200 });
        else if (dt === "pipeline_flows") data = await this.getPipelineFlows({ limit: 200 });
        else if (dt === "refinery_status") data = await this.getRefineryStatus();
        else if (dt === "supply_demand") data = await this.getSupplyDemand();
        result.recordsFetched += data.length;
      } catch (e: any) { result.errors.push(`${dt}: ${e.message}`); }
    }
    if (result.errors.length > 0) result.success = false;
    return result;
  }

  mapToInternal(externalData: unknown, dataType: string): MappedRecord[] {
    const records = Array.isArray(externalData) ? externalData : [externalData];
    return records.map(r => ({
      externalId: r.hubName || r.pipelineName || r.refineryName || "",
      externalType: `genscape_${dataType}`,
      externalData: r,
      internalTable: `genscape_${dataType}`,
      internalData: r,
    }));
  }
}

export const genscapeService = new GenscapeService();
