/**
 * RAIL RATE INTEGRATION SERVICE
 * Railinc REN tariff rates, market rate intelligence, fuel surcharge
 * schedules, and demurrage rate lookups for railroad pricing.
 *
 * Auth: API key as Authorization Bearer token (shared with RailincService)
 * Base: https://api.railinc.com/v1/rates
 * Env: RAILINC_API_KEY
 */

import { logger } from "../../_core/logger";

// ── Types ────────────────────────────────────────────────────────────

export interface TariffSurcharge {
  surchargeType: string;
  description: string;
  amount: number;
  unit: "FLAT" | "PERCENT" | "PER_CAR" | "PER_TON";
  effectiveDate: string;
  expirationDate: string | null;
}

export interface TariffRateResult {
  tariffNumber: string;
  originStation: string;
  originSPLC: string;
  destinationStation: string;
  destinationSPLC: string;
  carType: string;
  commodity: string;
  stccCode: string;
  baseRate: number;
  currency: string;
  rateUnit: "PER_CAR" | "PER_TON" | "PER_CWT";
  minWeight: number;
  maxWeight: number;
  transitDays: number;
  surcharges: TariffSurcharge[];
  totalRate: number;
  effectiveDate: string;
  expirationDate: string;
  railroad: string;
  tariffAuthority: string;
}

export interface RateLane {
  origin: string;
  destination: string;
}

export interface HistoricalRate {
  period: string;
  averageRate: number;
  minRate: number;
  maxRate: number;
  volumeCarloads: number;
}

export interface RateTrend {
  direction: "UP" | "DOWN" | "STABLE";
  percentChange: number;
  period: string;
  confidence: number;
}

export interface MarketRateResult {
  lane: RateLane;
  currentRate: number;
  currency: string;
  rateUnit: "PER_CAR" | "PER_TON" | "PER_CWT";
  benchmarkDate: string;
  historicalRates: HistoricalRate[];
  trends: RateTrend[];
  marketCondition: "TIGHT" | "BALANCED" | "SOFT";
  competitiveIndex: number;
  railroads: string[];
  commodityMix: { commodity: string; share: number }[];
  dataSource: string;
}

export interface FSCTier {
  priceFloor: number;
  priceCeiling: number;
  surchargePercent: number;
}

export interface FuelSurchargeResult {
  railroad: string;
  effectiveDate: string;
  expirationDate: string;
  currentFuelPrice: number;
  fuelPriceSource: string;
  currentSurchargePercent: number;
  surchargeTable: FSCTier[];
  applicableTraffic: string[];
  updateFrequency: "WEEKLY" | "MONTHLY";
  nextUpdateDate: string;
}

export interface DemurrageRateSchedule {
  carType: string;
  freeTimeHours: number;
  freeTimeDays: number;
  dailyRate: number;
  hourlyRate: number;
  currency: string;
  escalationTiers: DemurrageEscalation[];
}

export interface DemurrageEscalation {
  afterDays: number;
  dailyRate: number;
  hourlyRate: number;
  description: string;
}

export interface DemurrageRatesResult {
  railroad: string;
  effectiveDate: string;
  schedules: DemurrageRateSchedule[];
  holidays: string[];
  weekendsExcluded: boolean;
  specialRules: string[];
}

// ── Endpoint catalog ─────────────────────────────────────────────────

export const RAIL_RATE_ENDPOINTS = {
  TARIFF_RATE:        "/tariff",
  MARKET_RATES:       "/market",
  FUEL_SURCHARGE:     "/fsc/{RAILROAD}",
  DEMURRAGE_RATES:    "/demurrage/{RAILROAD}",
} as const;

// ── Service ──────────────────────────────────────────────────────────

const RAIL_RATE_BASE_URL = "https://api.railinc.com/v1/rates";

export class RailRateService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.RAILINC_API_KEY || "";
    this.baseUrl = RAIL_RATE_BASE_URL;
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
    if (!this.apiKey) {
      logger.error("[RailRate] RAILINC_API_KEY not configured");
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
        logger.error(`[RailRate] API error ${resp.status}: ${body}`);
        return null;
      }

      return (await resp.json()) as T;
    } catch (err: any) {
      logger.error(`[RailRate] Request failed: ${err.message}`);
      return null;
    }
  }

  private ep(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [k, v] of Object.entries(vars)) result = result.replace(`{${k}}`, encodeURIComponent(v));
    return result;
  }

  // ── Public methods ─────────────────────────────────────────────────

  async getTariffRate(
    originStation: string,
    destStation: string,
    carType: string,
    commodity: string,
  ): Promise<TariffRateResult | null> {
    logger.info(`[RailRate] Fetching tariff rate: ${originStation} -> ${destStation}, ${carType}, ${commodity}`);
    return this.request<TariffRateResult>(RAIL_RATE_ENDPOINTS.TARIFF_RATE, {
      origin: originStation,
      destination: destStation,
      carType,
      commodity,
    });
  }

  async getMarketRates(lane: RateLane): Promise<MarketRateResult | null> {
    logger.info(`[RailRate] Fetching market rates: ${lane.origin} -> ${lane.destination}`);
    return this.request<MarketRateResult>(RAIL_RATE_ENDPOINTS.MARKET_RATES, {
      origin: lane.origin,
      destination: lane.destination,
    });
  }

  async getFuelSurcharge(railroad: string): Promise<FuelSurchargeResult | null> {
    logger.info(`[RailRate] Fetching fuel surcharge for ${railroad}`);
    return this.request<FuelSurchargeResult>(
      this.ep(RAIL_RATE_ENDPOINTS.FUEL_SURCHARGE, { RAILROAD: railroad })
    );
  }

  async getDemurrageRates(railroad: string): Promise<DemurrageRatesResult | null> {
    logger.info(`[RailRate] Fetching demurrage rates for ${railroad}`);
    return this.request<DemurrageRatesResult>(
      this.ep(RAIL_RATE_ENDPOINTS.DEMURRAGE_RATES, { RAILROAD: railroad })
    );
  }
}

export const railRateService = new RailRateService();
