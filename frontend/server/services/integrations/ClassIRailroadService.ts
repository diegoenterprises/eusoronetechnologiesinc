/**
 * CLASS I RAILROAD INTEGRATION SERVICE
 * Multi-carrier service supporting all major Class I railroads:
 * BNSF, UP, NS, CSX, CPKC, CN
 *
 * Shipment tracking, facility status, demurrage charges, and interchange status.
 * Each railroad uses its own API key and base URL.
 *
 * Auth: Per-railroad API keys as Bearer tokens
 * Env: BNSF_API_KEY, UP_API_KEY, NS_API_KEY, CSX_API_KEY, CPKC_API_KEY, CN_API_KEY
 */

import { logger } from "../../_core/logger";

// ── Types ────────────────────────────────────────────────────────────

export type RailroadCode = "BNSF" | "UP" | "NS" | "CSX" | "CPKC" | "CN";

export interface RailroadConfig {
  code: RailroadCode;
  name: string;
  baseUrl: string;
  envKey: string;
}

export interface ShipmentEvent {
  eventType: string;
  eventDate: string;
  station: string;
  city: string;
  state: string;
  description: string;
}

export interface ShipmentLocation {
  latitude: number;
  longitude: number;
  station: string;
  city: string;
  state: string;
  railroad: string;
  reportedAt: string;
}

export interface ShipmentTrackingResult {
  shipmentId: string;
  railroad: RailroadCode;
  status: "IN_TRANSIT" | "AT_ORIGIN" | "AT_DESTINATION" | "DELIVERED" | "HELD" | "INTERCHANGED";
  location: ShipmentLocation;
  eta: string;
  originStation: string;
  destinationStation: string;
  equipmentId: string;
  equipmentType: string;
  commodity: string;
  weight: number;
  events: ShipmentEvent[];
  lastUpdate: string;
}

export interface FacilityGate {
  gateId: string;
  gateType: "INBOUND" | "OUTBOUND";
  status: "OPEN" | "CLOSED" | "RESTRICTED";
  waitTime: number;
}

export interface FacilityStatus {
  facilityCode: string;
  facilityName: string;
  railroad: RailroadCode;
  facilityType: "YARD" | "TERMINAL" | "INTERMODAL" | "PORT";
  yardCapacity: number;
  currentOccupancy: number;
  occupancyPercent: number;
  dwellTimeHours: number;
  avgDwellTimeHours: number;
  gates: FacilityGate[];
  congestionLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  operatingStatus: "NORMAL" | "RESTRICTED" | "CLOSED";
  lastUpdate: string;
}

export interface DemurrageCharge {
  chargeId: string;
  equipmentId: string;
  railroad: RailroadCode;
  facilityCode: string;
  arrivalDate: string;
  freeTimeExpiry: string;
  freeTimeHours: number;
  elapsedHours: number;
  billableHours: number;
  dailyRate: number;
  totalCharges: number;
  currency: string;
  status: "ACCRUING" | "INVOICED" | "PAID" | "DISPUTED";
  carType: string;
}

export interface InterchangeCar {
  equipmentId: string;
  carType: string;
  origin: string;
  destination: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "IN_TRANSIT";
  arrivalDate: string;
}

export interface InterchangeStatus {
  interchangeCode: string;
  interchangeName: string;
  railroad: RailroadCode;
  connectingRailroad: string;
  pendingCars: number;
  acceptedCars: number;
  rejectedCars: number;
  avgDwellHours: number;
  capacity: number;
  currentVolume: number;
  cars: InterchangeCar[];
  lastUpdate: string;
}

// ── Endpoint catalog ─────────────────────────────────────────────────

export const CLASS_I_ENDPOINTS = {
  TRACK_SHIPMENT:     "/shipments/{SHIPMENT_ID}/track",
  FACILITY_STATUS:    "/facilities/{FACILITY_CODE}/status",
  DEMURRAGE:          "/equipment/{EQUIPMENT_ID}/demurrage",
  INTERCHANGE:        "/interchange/{INTERCHANGE_CODE}/status",
} as const;

// ── Railroad configuration ───────────────────────────────────────────

const RAILROAD_CONFIGS: Record<RailroadCode, RailroadConfig> = {
  BNSF: { code: "BNSF", name: "BNSF Railway",                     baseUrl: "https://api.bnsf.com/v1",    envKey: "BNSF_API_KEY" },
  UP:   { code: "UP",   name: "Union Pacific Railroad",           baseUrl: "https://api.up.com/v1",      envKey: "UP_API_KEY" },
  NS:   { code: "NS",   name: "Norfolk Southern Railway",         baseUrl: "https://api.nscorp.com/v1",  envKey: "NS_API_KEY" },
  CSX:  { code: "CSX",  name: "CSX Transportation",               baseUrl: "https://api.csx.com/v1",     envKey: "CSX_API_KEY" },
  CPKC: { code: "CPKC", name: "Canadian Pacific Kansas City",     baseUrl: "https://api.cpkcr.com/v1",   envKey: "CPKC_API_KEY" },
  CN:   { code: "CN",   name: "Canadian National Railway",        baseUrl: "https://api.cn.ca/v1",       envKey: "CN_API_KEY" },
};

// ── Service ──────────────────────────────────────────────────────────

export class ClassIRailroadService {
  private getConfig(railroad: string): RailroadConfig | null {
    const code = railroad.toUpperCase() as RailroadCode;
    const config = RAILROAD_CONFIGS[code];
    if (!config) {
      logger.error(`[ClassIRailroad] Unknown railroad code: ${railroad}`);
      return null;
    }
    return config;
  }

  private getApiKey(config: RailroadConfig): string | null {
    const key = process.env[config.envKey];
    if (!key) {
      logger.error(`[ClassIRailroad] ${config.envKey} not configured for ${config.name}`);
      return null;
    }
    return key;
  }

  private async request<T>(config: RailroadConfig, endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
    const apiKey = this.getApiKey(config);
    if (!apiKey) return null;

    const qs = Object.keys(params).length > 0 ? `?${new URLSearchParams(params).toString()}` : "";
    const url = `${config.baseUrl}${endpoint}${qs}`;

    try {
      const resp = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
          "X-Railroad-Code": config.code,
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!resp.ok) {
        const body = await resp.text().catch(() => "");
        logger.error(`[ClassIRailroad][${config.code}] API error ${resp.status}: ${body}`);
        return null;
      }

      return (await resp.json()) as T;
    } catch (err: any) {
      logger.error(`[ClassIRailroad][${config.code}] Request failed: ${err.message}`);
      return null;
    }
  }

  private ep(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [k, v] of Object.entries(vars)) result = result.replace(`{${k}}`, encodeURIComponent(v));
    return result;
  }

  // ── Public methods ─────────────────────────────────────────────────

  getSupportedRailroads(): RailroadConfig[] {
    return Object.values(RAILROAD_CONFIGS);
  }

  async trackShipment(railroad: string, shipmentId: string): Promise<ShipmentTrackingResult | null> {
    const config = this.getConfig(railroad);
    if (!config) return null;

    logger.info(`[ClassIRailroad][${config.code}] Tracking shipment ${shipmentId}`);
    return this.request<ShipmentTrackingResult>(
      config,
      this.ep(CLASS_I_ENDPOINTS.TRACK_SHIPMENT, { SHIPMENT_ID: shipmentId })
    );
  }

  async getFacilityStatus(railroad: string, facilityCode: string): Promise<FacilityStatus | null> {
    const config = this.getConfig(railroad);
    if (!config) return null;

    logger.info(`[ClassIRailroad][${config.code}] Fetching facility status for ${facilityCode}`);
    return this.request<FacilityStatus>(
      config,
      this.ep(CLASS_I_ENDPOINTS.FACILITY_STATUS, { FACILITY_CODE: facilityCode })
    );
  }

  async getDemurrageCharges(railroad: string, equipmentId: string): Promise<DemurrageCharge | null> {
    const config = this.getConfig(railroad);
    if (!config) return null;

    logger.info(`[ClassIRailroad][${config.code}] Fetching demurrage for equipment ${equipmentId}`);
    return this.request<DemurrageCharge>(
      config,
      this.ep(CLASS_I_ENDPOINTS.DEMURRAGE, { EQUIPMENT_ID: equipmentId })
    );
  }

  async getInterchangeStatus(railroad: string, interchangeCode: string): Promise<InterchangeStatus | null> {
    const config = this.getConfig(railroad);
    if (!config) return null;

    logger.info(`[ClassIRailroad][${config.code}] Fetching interchange status for ${interchangeCode}`);
    return this.request<InterchangeStatus>(
      config,
      this.ep(CLASS_I_ENDPOINTS.INTERCHANGE, { INTERCHANGE_CODE: interchangeCode })
    );
  }
}

export const classIRailroadService = new ClassIRailroadService();
