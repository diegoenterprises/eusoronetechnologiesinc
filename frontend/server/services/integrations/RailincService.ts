/**
 * RAILINC INTEGRATION SERVICE
 * Railcar tracking, UMLER equipment specs, asset health monitoring,
 * waybill data, and equipment search via the Railinc API.
 *
 * Auth: API key as Authorization header
 * Base: https://api.railinc.com/v1
 * Env: RAILINC_API_KEY
 */

import { logger } from "../../_core/logger";

// ── Types ────────────────────────────────────────────────────────────

export interface RailcarPosition {
  railcarNumber: string;
  latitude: number;
  longitude: number;
  railroad: string;
  station: string;
  stateProvince: string;
  reportedAt: string;
}

export interface RailcarEvent {
  eventType: string;
  eventDate: string;
  station: string;
  railroad: string;
  description: string;
}

export interface RailcarTrackingResult {
  railcarNumber: string;
  position: RailcarPosition;
  lastEvent: RailcarEvent;
  eventHistory: RailcarEvent[];
}

export interface RailcarDimensions {
  insideLength: number;
  insideWidth: number;
  insideHeight: number;
  doorWidth: number;
  doorHeight: number;
  cubicCapacity: number;
}

export interface UMLEREquipmentSpecs {
  railcarNumber: string;
  carType: string;
  capacity: number;
  tareWeight: number;
  loadLimit: number;
  owner: string;
  lessee: string | null;
  dimensions: RailcarDimensions;
  buildDate: string;
  aarType: string;
  plateC: string;
}

export interface ComponentStatus {
  component: string;
  condition: "GOOD" | "FAIR" | "POOR" | "CRITICAL";
  lastInspectionDate: string;
  notes: string;
}

export interface MaintenanceAlert {
  alertId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  dueDate: string;
  component: string;
}

export interface AssetHealthResult {
  railcarNumber: string;
  overallCondition: "GOOD" | "FAIR" | "POOR" | "CRITICAL";
  mechanicalCondition: string;
  maintenanceAlerts: MaintenanceAlert[];
  componentStatus: ComponentStatus[];
  lastInspectionDate: string;
  nextInspectionDue: string;
}

export interface WaybillRouting {
  sequenceNumber: number;
  railroad: string;
  junctionStation: string;
}

export interface WaybillResult {
  waybillNumber: string;
  shipper: { name: string; city: string; state: string };
  consignee: { name: string; city: string; state: string };
  routing: WaybillRouting[];
  commodity: { stccCode: string; description: string };
  weight: number;
  carCount: number;
  originStation: string;
  destinationStation: string;
}

export interface EquipmentSearchFilters {
  carType?: string;
  owner?: string;
  status?: string;
}

export interface EquipmentSearchResult {
  railcarNumber: string;
  carType: string;
  owner: string;
  status: string;
  currentLocation: string;
  railroad: string;
}

// ── Endpoint catalog ─────────────────────────────────────────────────

export const RAILINC_ENDPOINTS = {
  TRACK_RAILCAR:      "/tracking/railcar/{RAILCAR}",
  EQUIPMENT_SPECS:    "/umler/equipment/{RAILCAR}",
  ASSET_HEALTH:       "/asset-health/{RAILCAR}",
  WAYBILL:            "/waybill/{WAYBILL}",
  EQUIPMENT_SEARCH:   "/umler/search",
} as const;

// ── Service ──────────────────────────────────────────────────────────

const RAILINC_BASE_URL = "https://api.railinc.com/v1";

export class RailincService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.RAILINC_API_KEY || "";
    this.baseUrl = RAILINC_BASE_URL;
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
    if (!this.apiKey) {
      logger.error("[Railinc] RAILINC_API_KEY not configured");
      return null;
    }

    const qs = Object.keys(params).length > 0 ? `?${new URLSearchParams(params).toString()}` : "";
    const url = `${this.baseUrl}${endpoint}${qs}`;

    try {
      const resp = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!resp.ok) {
        const body = await resp.text().catch(() => "");
        logger.error(`[Railinc] API error ${resp.status}: ${body}`);
        return null;
      }

      return (await resp.json()) as T;
    } catch (err: any) {
      logger.error(`[Railinc] Request failed: ${err.message}`);
      return null;
    }
  }

  private ep(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [k, v] of Object.entries(vars)) result = result.replace(`{${k}}`, encodeURIComponent(v));
    return result;
  }

  // ── Public methods ─────────────────────────────────────────────────

  async trackRailcar(railcarNumber: string): Promise<RailcarTrackingResult | null> {
    logger.info(`[Railinc] Tracking railcar ${railcarNumber}`);
    return this.request<RailcarTrackingResult>(
      this.ep(RAILINC_ENDPOINTS.TRACK_RAILCAR, { RAILCAR: railcarNumber })
    );
  }

  async getEquipmentSpecs(railcarNumber: string): Promise<UMLEREquipmentSpecs | null> {
    logger.info(`[Railinc] Fetching UMLER specs for ${railcarNumber}`);
    return this.request<UMLEREquipmentSpecs>(
      this.ep(RAILINC_ENDPOINTS.EQUIPMENT_SPECS, { RAILCAR: railcarNumber })
    );
  }

  async getAssetHealth(railcarNumber: string): Promise<AssetHealthResult | null> {
    logger.info(`[Railinc] Fetching asset health for ${railcarNumber}`);
    return this.request<AssetHealthResult>(
      this.ep(RAILINC_ENDPOINTS.ASSET_HEALTH, { RAILCAR: railcarNumber })
    );
  }

  async getWaybill(waybillNumber: string): Promise<WaybillResult | null> {
    logger.info(`[Railinc] Fetching waybill ${waybillNumber}`);
    return this.request<WaybillResult>(
      this.ep(RAILINC_ENDPOINTS.WAYBILL, { WAYBILL: waybillNumber })
    );
  }

  async searchEquipment(filters: EquipmentSearchFilters): Promise<EquipmentSearchResult[] | null> {
    logger.info(`[Railinc] Searching equipment with filters: ${JSON.stringify(filters)}`);
    const params: Record<string, string> = {};
    if (filters.carType) params.carType = filters.carType;
    if (filters.owner) params.owner = filters.owner;
    if (filters.status) params.status = filters.status;

    return this.request<EquipmentSearchResult[]>(RAILINC_ENDPOINTS.EQUIPMENT_SEARCH, params);
  }
}

export const railincService = new RailincService();
