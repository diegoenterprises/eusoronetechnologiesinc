/**
 * VIZION RAIL INTEGRATION SERVICE
 * Unified ocean + rail container tracking, last free day monitoring,
 * webhook subscriptions for push updates, and intermodal status.
 *
 * Auth: API key as X-API-Key header
 * Base: https://api.vizionapi.com/v2
 * Docs: https://docs.vizionapi.com
 * Env: VIZION_API_KEY
 */

import { logger } from "../../_core/logger";

// ── Types ────────────────────────────────────────────────────────────

export interface TrackingMilestone {
  milestoneType: string;
  description: string;
  location: string;
  vessel: string | null;
  voyage: string | null;
  timestamp: string;
  actual: boolean;
  source: string;
}

export interface DemurrageEvent {
  eventType: "FREE_TIME_START" | "FREE_TIME_EXPIRY" | "DEMURRAGE_START" | "CHARGE_ACCRUED";
  eventDate: string;
  description: string;
  charges: number | null;
  currency: string;
}

export interface ContainerTrackingResult {
  containerNumber: string;
  carrier: string;
  bookingNumber: string | null;
  billOfLading: string | null;
  status: "IN_TRANSIT" | "AT_PORT" | "ON_RAIL" | "AT_DESTINATION" | "DELIVERED" | "RETURNED_EMPTY";
  currentLocation: string;
  currentMode: "OCEAN" | "RAIL" | "TRUCK" | "YARD";
  pod: string;
  pol: string;
  eta: string;
  ata: string | null;
  milestones: TrackingMilestone[];
  lastFreeDay: string | null;
  demurrageEvents: DemurrageEvent[];
  lastUpdate: string;
}

export interface LastFreeDayResult {
  containerNumber: string;
  terminal: string;
  carrier: string;
  lastFreeDay: string;
  daysRemaining: number;
  currentCharges: number;
  projectedCharges: number;
  currency: string;
  holdStatus: HoldStatus[];
  pickupEligible: boolean;
}

export interface HoldStatus {
  holdType: "FREIGHT" | "CUSTOMS" | "TERMINAL" | "CARRIER" | "USDA" | "OTHER";
  status: "HOLD" | "RELEASED";
  releasedDate: string | null;
  description: string;
}

export interface WebhookSubscription {
  subscriptionId: string;
  containerNumber: string;
  webhookUrl: string;
  status: "ACTIVE" | "PAUSED" | "EXPIRED";
  createdAt: string;
  expiresAt: string;
  eventTypes: string[];
  lastDelivery: string | null;
  deliveryCount: number;
}

export interface IntermodalLeg {
  legNumber: number;
  mode: "OCEAN" | "RAIL" | "TRUCK";
  carrier: string;
  origin: string;
  destination: string;
  status: "PENDING" | "IN_TRANSIT" | "COMPLETED";
  departureDate: string | null;
  arrivalDate: string | null;
  eta: string | null;
}

export interface IntermodalStatusResult {
  referenceNumber: string;
  containerNumber: string;
  overallStatus: "BOOKED" | "IN_TRANSIT" | "AT_TRANSLOAD" | "DELIVERED";
  currentMode: "OCEAN" | "RAIL" | "TRUCK";
  currentLocation: string;
  legs: IntermodalLeg[];
  eta: string;
  lastUpdate: string;
}

// ── Endpoint catalog ─────────────────────────────────────────────────

export const VIZION_ENDPOINTS = {
  TRACK_CONTAINER:    "/containers/{CONTAINER}/track",
  LAST_FREE_DAY:      "/containers/{CONTAINER}/lfd",
  SUBSCRIBE:          "/subscriptions",
  INTERMODAL_STATUS:  "/intermodal/{REFERENCE}",
} as const;

// ── Service ──────────────────────────────────────────────────────────

const VIZION_BASE_URL = "https://api.vizionapi.com/v2";

export class VizionRailService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.VIZION_API_KEY || "";
    this.baseUrl = VIZION_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: { method?: string; params?: Record<string, string>; body?: unknown } = {},
  ): Promise<T | null> {
    if (!this.apiKey) {
      logger.error("[VizionRail] VIZION_API_KEY not configured");
      return null;
    }

    const { method = "GET", params = {}, body } = options;
    const qs = Object.keys(params).length > 0 ? `?${new URLSearchParams(params).toString()}` : "";
    const url = `${this.baseUrl}${endpoint}${qs}`;

    try {
      const headers: Record<string, string> = {
        "X-API-Key": this.apiKey,
        Accept: "application/json",
      };
      const fetchOptions: RequestInit = { method, headers, signal: AbortSignal.timeout(15_000) };

      if (body) {
        headers["Content-Type"] = "application/json";
        fetchOptions.body = JSON.stringify(body);
      }

      const resp = await fetch(url, fetchOptions);

      if (!resp.ok) {
        const respBody = await resp.text().catch(() => "");
        logger.error(`[VizionRail] API error ${resp.status}: ${respBody}`);
        return null;
      }

      return (await resp.json()) as T;
    } catch (err: any) {
      logger.error(`[VizionRail] Request failed: ${err.message}`);
      return null;
    }
  }

  private ep(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [k, v] of Object.entries(vars)) result = result.replace(`{${k}}`, encodeURIComponent(v));
    return result;
  }

  // ── Public methods ─────────────────────────────────────────────────

  async trackContainer(containerNumber: string): Promise<ContainerTrackingResult | null> {
    logger.info(`[VizionRail] Tracking container ${containerNumber}`);
    return this.request<ContainerTrackingResult>(
      this.ep(VIZION_ENDPOINTS.TRACK_CONTAINER, { CONTAINER: containerNumber })
    );
  }

  async getLastFreeDay(containerNumber: string): Promise<LastFreeDayResult | null> {
    logger.info(`[VizionRail] Fetching LFD for container ${containerNumber}`);
    return this.request<LastFreeDayResult>(
      this.ep(VIZION_ENDPOINTS.LAST_FREE_DAY, { CONTAINER: containerNumber })
    );
  }

  async subscribeTracking(containerNumber: string, webhookUrl: string): Promise<WebhookSubscription | null> {
    logger.info(`[VizionRail] Subscribing tracking for ${containerNumber} -> ${webhookUrl}`);
    return this.request<WebhookSubscription>(VIZION_ENDPOINTS.SUBSCRIBE, {
      method: "POST",
      body: {
        containerNumber,
        webhookUrl,
        eventTypes: [
          "MILESTONE_UPDATE",
          "ETA_CHANGE",
          "LFD_CHANGE",
          "HOLD_CHANGE",
          "DELIVERED",
          "DEMURRAGE_ALERT",
        ],
      },
    });
  }

  async getIntermodalStatus(referenceNumber: string): Promise<IntermodalStatusResult | null> {
    logger.info(`[VizionRail] Fetching intermodal status for ${referenceNumber}`);
    return this.request<IntermodalStatusResult>(
      this.ep(VIZION_ENDPOINTS.INTERMODAL_STATUS, { REFERENCE: referenceNumber })
    );
  }
}

export const vizionRailService = new VizionRailService();
