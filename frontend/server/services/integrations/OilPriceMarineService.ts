/**
 * OILPRICE MARINE BUNKER FUEL PRICING INTEGRATION
 * Bunker fuel prices, global hub pricing, and fuel surcharge indices
 *
 * Provides port-specific bunker prices, historical trends, and BAF/LSS indices
 * API Documentation: https://docs.oilpriceapi.com
 */

import { logger } from "../../_core/logger";

// Environment configuration
const OILPRICE_API_KEY = process.env.OILPRICE_API_KEY || "";
const OILPRICE_BASE_URL = "https://api.oilpriceapi.com/v1";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BunkerPrice {
  fuelType: string;
  price: number;
  currency: string;
  unit: string;
  port: string;
  portName: string;
  supplier: string | null;
  lastUpdated: string;
  change24h: number | null;
  changePercent24h: number | null;
}

export interface GlobalBunkerPrices {
  hub: string;
  country: string;
  prices: {
    fuelType: string;
    price: number;
    currency: string;
    unit: string;
    change24h: number | null;
  }[];
  lastUpdated: string;
}

export interface PriceHistoryEntry {
  date: string;
  price: number;
  currency: string;
  unit: string;
  volume: number | null;
  high: number | null;
  low: number | null;
  open: number | null;
  close: number | null;
}

export interface PriceHistoryResponse {
  port: string;
  fuelType: string;
  entries: PriceHistoryEntry[];
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  trend: "Rising" | "Falling" | "Stable";
  periodDays: number;
}

export interface FuelSurchargeIndex {
  tradeLane: string;
  origin: string;
  destination: string;
  bafIndex: number;
  lssIndex: number;
  efsIndex: number | null;
  currency: string;
  unit: string;
  effectiveDate: string;
  expiryDate: string;
  carrier: string | null;
}

// ============================================================================
// API CLIENT
// ============================================================================

class OilPriceMarineService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = OILPRICE_API_KEY;
    this.baseUrl = OILPRICE_BASE_URL;
  }

  /**
   * Check if the API is configured
   */
  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Build authorization headers
   */
  private getHeaders(): Record<string, string> {
    return {
      Accept: "application/json",
      Authorization: `Token ${this.apiKey}`,
    };
  }

  /**
   * Get bunker fuel prices at a specific port
   */
  async getBunkerPrices(
    port: string,
    fuelTypes?: string[]
  ): Promise<BunkerPrice[]> {
    if (!this.isConfigured()) {
      logger.warn("[OilPriceMarine] API key not configured");
      return [];
    }

    try {
      const params = new URLSearchParams({ port });
      if (fuelTypes && fuelTypes.length > 0) {
        params.set("fuel_types", fuelTypes.join(","));
      }

      const response = await fetch(
        `${this.baseUrl}/bunker-prices?${params.toString()}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        logger.error(`[OilPriceMarine] API error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      const prices = data.prices || data.results || data.data || [];

      return prices.map((p: any) => ({
        fuelType: p.fuel_type || p.fuelType || p.grade || "",
        price: parseFloat(p.price) || 0,
        currency: p.currency || "USD",
        unit: p.unit || "MT",
        port: p.port_code || p.port || port,
        portName: p.port_name || p.portName || "",
        supplier: p.supplier || null,
        lastUpdated: p.last_updated || p.date || "",
        change24h: p.change_24h != null ? parseFloat(p.change_24h) : null,
        changePercent24h: p.change_percent_24h != null ? parseFloat(p.change_percent_24h) : null,
      }));
    } catch (error) {
      logger.error("[OilPriceMarine] getBunkerPrices error:", error);
      return [];
    }
  }

  /**
   * Get bunker prices at major global hubs
   */
  async getGlobalBunkerPrices(): Promise<GlobalBunkerPrices[]> {
    if (!this.isConfigured()) {
      logger.warn("[OilPriceMarine] API key not configured");
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/bunker-prices/global`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        logger.error(`[OilPriceMarine] API error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      const hubs = data.hubs || data.results || data.data || [];

      return hubs.map((hub: any) => ({
        hub: hub.hub || hub.port || "",
        country: hub.country || "",
        prices: (hub.prices || []).map((p: any) => ({
          fuelType: p.fuel_type || p.grade || "",
          price: parseFloat(p.price) || 0,
          currency: p.currency || "USD",
          unit: p.unit || "MT",
          change24h: p.change_24h != null ? parseFloat(p.change_24h) : null,
        })),
        lastUpdated: hub.last_updated || hub.date || "",
      }));
    } catch (error) {
      logger.error("[OilPriceMarine] getGlobalBunkerPrices error:", error);
      return [];
    }
  }

  /**
   * Get historical bunker price data for a port and fuel type
   */
  async getPriceHistory(
    port: string,
    fuelType: string,
    days: number = 30
  ): Promise<PriceHistoryResponse | null> {
    if (!this.isConfigured()) {
      logger.warn("[OilPriceMarine] API key not configured");
      return null;
    }

    try {
      const params = new URLSearchParams({
        port,
        fuel_type: fuelType,
        days: days.toString(),
      });

      const response = await fetch(
        `${this.baseUrl}/bunker-prices/history?${params.toString()}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        logger.error(`[OilPriceMarine] API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const entries = data.history || data.prices || data.data || [];

      const parsedEntries: PriceHistoryEntry[] = entries.map((e: any) => ({
        date: e.date || e.timestamp || "",
        price: parseFloat(e.price) || 0,
        currency: e.currency || "USD",
        unit: e.unit || "MT",
        volume: e.volume != null ? parseFloat(e.volume) : null,
        high: e.high != null ? parseFloat(e.high) : null,
        low: e.low != null ? parseFloat(e.low) : null,
        open: e.open != null ? parseFloat(e.open) : null,
        close: e.close != null ? parseFloat(e.close) : null,
      }));

      const prices = parsedEntries.map((e) => e.price).filter((p) => p > 0);
      const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

      let trend: "Rising" | "Falling" | "Stable" = "Stable";
      if (prices.length >= 2) {
        const firstHalf = prices.slice(0, Math.floor(prices.length / 2));
        const secondHalf = prices.slice(Math.floor(prices.length / 2));
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
        if (changePercent > 2) trend = "Rising";
        else if (changePercent < -2) trend = "Falling";
      }

      return {
        port,
        fuelType,
        entries: parsedEntries,
        averagePrice: Math.round(avgPrice * 100) / 100,
        minPrice: Math.round(minPrice * 100) / 100,
        maxPrice: Math.round(maxPrice * 100) / 100,
        trend: data.trend || trend,
        periodDays: days,
      };
    } catch (error) {
      logger.error("[OilPriceMarine] getPriceHistory error:", error);
      return null;
    }
  }

  /**
   * Get current fuel surcharge / BAF / LSS indices by trade lane
   */
  async getFuelSurchargeIndex(): Promise<FuelSurchargeIndex[]> {
    if (!this.isConfigured()) {
      logger.warn("[OilPriceMarine] API key not configured");
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/surcharge-index`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        logger.error(`[OilPriceMarine] API error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      const indices = data.indices || data.results || data.data || [];

      return indices.map((idx: any) => ({
        tradeLane: idx.trade_lane || idx.tradeLane || "",
        origin: idx.origin || "",
        destination: idx.destination || "",
        bafIndex: parseFloat(idx.baf_index || idx.baf) || 0,
        lssIndex: parseFloat(idx.lss_index || idx.lss) || 0,
        efsIndex: idx.efs_index != null ? parseFloat(idx.efs_index) : null,
        currency: idx.currency || "USD",
        unit: idx.unit || "TEU",
        effectiveDate: idx.effective_date || "",
        expiryDate: idx.expiry_date || "",
        carrier: idx.carrier || null,
      }));
    } catch (error) {
      logger.error("[OilPriceMarine] getFuelSurchargeIndex error:", error);
      return [];
    }
  }
}

// Export singleton instance
export const oilPriceMarineService = new OilPriceMarineService();
