/**
 * DTN MARINE WEATHER INTEGRATION
 * Marine weather forecasting, storm alerts, and route weather analysis
 *
 * Provides marine forecasts, route weather, storm alerts, and port conditions
 * API Documentation: https://developer.dtn.com/weather/marine
 */

import { logger } from "../../_core/logger";

// Environment configuration
const DTN_API_KEY = process.env.DTN_API_KEY || "";
const DTN_BASE_URL = "https://api.dtn.com/weather/marine/v1";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface MarineForecast {
  lat: number;
  lng: number;
  generatedAt: string;
  current: {
    windSpeed: number;
    windDirection: number;
    windGust: number;
    waveHeight: number;
    wavePeriod: number;
    swellHeight: number;
    swellDirection: number;
    swellPeriod: number;
    visibility: number;
    precipitation: number;
    temperature: number;
    pressure: number;
    humidity: number;
    cloudCover: number;
  };
  forecast: {
    timestamp: string;
    windSpeed: number;
    windDirection: number;
    windGust: number;
    waveHeight: number;
    wavePeriod: number;
    swellHeight: number;
    swellDirection: number;
    visibility: number;
    precipitation: number;
    temperature: number;
    pressure: number;
  }[];
}

export interface RouteWeatherSegment {
  segmentIndex: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  windSpeed: number;
  windDirection: number;
  waveHeight: number;
  swellHeight: number;
  visibility: number;
  riskLevel: "Low" | "Moderate" | "High" | "Severe";
  riskFactors: string[];
  optimalSpeed: number | null;
  timestamp: string;
}

export interface RouteWeatherResponse {
  segments: RouteWeatherSegment[];
  overallRisk: "Low" | "Moderate" | "High" | "Severe";
  warnings: string[];
  recommendedDeparture: string | null;
  generatedAt: string;
}

export interface StormAlert {
  alertId: string;
  type: string;
  name: string | null;
  severity: "Advisory" | "Watch" | "Warning" | "Extreme";
  description: string;
  affectedAreas: {
    name: string;
    lat: number;
    lng: number;
    radius: number;
  }[];
  windSpeed: number | null;
  category: string | null;
  issuedAt: string;
  expiresAt: string;
  source: string;
  movementDirection: number | null;
  movementSpeed: number | null;
}

export interface PortConditions {
  portId: string;
  portName: string;
  windSpeed: number;
  windDirection: number;
  windGust: number;
  tideLevel: number;
  tideStatus: "Rising" | "Falling" | "High" | "Low";
  nextHighTide: string | null;
  nextLowTide: string | null;
  visibility: number;
  precipitation: number;
  temperature: number;
  pressure: number;
  berthingSafety: "Safe" | "Caution" | "Restricted" | "Closed";
  restrictions: string[];
  updatedAt: string;
}

export interface VesselMotionForecast {
  imoNumber: string;
  segments: {
    segmentIndex: number;
    lat: number;
    lng: number;
    rollAngle: number;
    pitchAngle: number;
    heaveMagnitude: number;
    workability: "Good" | "Moderate" | "Poor" | "Unsafe";
    significantWaveHeight: number;
    encounterPeriod: number;
    timestamp: string;
  }[];
  overallWorkability: "Good" | "Moderate" | "Poor" | "Unsafe";
  recommendations: string[];
  generatedAt: string;
}

// ============================================================================
// API CLIENT
// ============================================================================

class DTNMarineWeatherService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = DTN_API_KEY;
    this.baseUrl = DTN_BASE_URL;
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
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  /**
   * Get marine weather forecast for a specific location
   */
  async getMarineForecast(lat: number, lng: number): Promise<MarineForecast | null> {
    if (!this.isConfigured()) {
      logger.warn("[DTNMarine] API key not configured");
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/forecast?lat=${lat}&lng=${lng}&days=7`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        logger.error(`[DTNMarine] API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return {
        lat,
        lng,
        generatedAt: data.generated_at || new Date().toISOString(),
        current: {
          windSpeed: parseFloat(data.current?.wind_speed) || 0,
          windDirection: parseFloat(data.current?.wind_direction) || 0,
          windGust: parseFloat(data.current?.wind_gust) || 0,
          waveHeight: parseFloat(data.current?.wave_height) || 0,
          wavePeriod: parseFloat(data.current?.wave_period) || 0,
          swellHeight: parseFloat(data.current?.swell_height) || 0,
          swellDirection: parseFloat(data.current?.swell_direction) || 0,
          swellPeriod: parseFloat(data.current?.swell_period) || 0,
          visibility: parseFloat(data.current?.visibility) || 0,
          precipitation: parseFloat(data.current?.precipitation) || 0,
          temperature: parseFloat(data.current?.temperature) || 0,
          pressure: parseFloat(data.current?.pressure) || 0,
          humidity: parseFloat(data.current?.humidity) || 0,
          cloudCover: parseFloat(data.current?.cloud_cover) || 0,
        },
        forecast: (data.forecast || data.hourly || []).map((f: any) => ({
          timestamp: f.timestamp || f.time || "",
          windSpeed: parseFloat(f.wind_speed) || 0,
          windDirection: parseFloat(f.wind_direction) || 0,
          windGust: parseFloat(f.wind_gust) || 0,
          waveHeight: parseFloat(f.wave_height) || 0,
          wavePeriod: parseFloat(f.wave_period) || 0,
          swellHeight: parseFloat(f.swell_height) || 0,
          swellDirection: parseFloat(f.swell_direction) || 0,
          visibility: parseFloat(f.visibility) || 0,
          precipitation: parseFloat(f.precipitation) || 0,
          temperature: parseFloat(f.temperature) || 0,
          pressure: parseFloat(f.pressure) || 0,
        })),
      };
    } catch (error) {
      logger.error("[DTNMarine] getMarineForecast error:", error);
      return null;
    }
  }

  /**
   * Get weather conditions along a route defined by waypoints
   */
  async getRouteWeather(
    waypoints: { lat: number; lng: number }[]
  ): Promise<RouteWeatherResponse | null> {
    if (!this.isConfigured()) {
      logger.warn("[DTNMarine] API key not configured");
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/route-weather`, {
        method: "POST",
        headers: {
          ...this.getHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          waypoints: waypoints.map((wp) => ({
            lat: wp.lat,
            lng: wp.lng,
          })),
        }),
      });

      if (!response.ok) {
        logger.error(`[DTNMarine] API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return {
        segments: (data.segments || []).map((s: any, index: number) => ({
          segmentIndex: s.segment_index ?? index,
          startLat: parseFloat(s.start_lat) || 0,
          startLng: parseFloat(s.start_lng) || 0,
          endLat: parseFloat(s.end_lat) || 0,
          endLng: parseFloat(s.end_lng) || 0,
          windSpeed: parseFloat(s.wind_speed) || 0,
          windDirection: parseFloat(s.wind_direction) || 0,
          waveHeight: parseFloat(s.wave_height) || 0,
          swellHeight: parseFloat(s.swell_height) || 0,
          visibility: parseFloat(s.visibility) || 0,
          riskLevel: s.risk_level || "Low",
          riskFactors: s.risk_factors || [],
          optimalSpeed: s.optimal_speed ? parseFloat(s.optimal_speed) : null,
          timestamp: s.timestamp || "",
        })),
        overallRisk: data.overall_risk || "Low",
        warnings: data.warnings || [],
        recommendedDeparture: data.recommended_departure || null,
        generatedAt: data.generated_at || new Date().toISOString(),
      };
    } catch (error) {
      logger.error("[DTNMarine] getRouteWeather error:", error);
      return null;
    }
  }

  /**
   * Get active storm and weather alerts for a region
   */
  async getStormAlerts(region: string): Promise<StormAlert[]> {
    if (!this.isConfigured()) {
      logger.warn("[DTNMarine] API key not configured");
      return [];
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/alerts?region=${encodeURIComponent(region)}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const alerts = data.alerts || data.results || [];

      return alerts.map((a: any) => ({
        alertId: a.alert_id || a.id || "",
        type: a.type || a.alert_type || "",
        name: a.name || null,
        severity: a.severity || "Advisory",
        description: a.description || "",
        affectedAreas: (a.affected_areas || []).map((area: any) => ({
          name: area.name || "",
          lat: parseFloat(area.lat) || 0,
          lng: parseFloat(area.lng) || 0,
          radius: parseFloat(area.radius) || 0,
        })),
        windSpeed: a.wind_speed ? parseFloat(a.wind_speed) : null,
        category: a.category || null,
        issuedAt: a.issued_at || "",
        expiresAt: a.expires_at || "",
        source: a.source || "NWS",
        movementDirection: a.movement_direction ? parseFloat(a.movement_direction) : null,
        movementSpeed: a.movement_speed ? parseFloat(a.movement_speed) : null,
      }));
    } catch (error) {
      logger.error("[DTNMarine] getStormAlerts error:", error);
      return [];
    }
  }

  /**
   * Get current port weather conditions and berthing assessment
   */
  async getPortConditions(portId: string): Promise<PortConditions | null> {
    if (!this.isConfigured()) {
      logger.warn("[DTNMarine] API key not configured");
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/ports/${encodeURIComponent(portId)}/conditions`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        logger.error(`[DTNMarine] API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return {
        portId: data.port_id || portId,
        portName: data.port_name || "",
        windSpeed: parseFloat(data.wind_speed) || 0,
        windDirection: parseFloat(data.wind_direction) || 0,
        windGust: parseFloat(data.wind_gust) || 0,
        tideLevel: parseFloat(data.tide_level) || 0,
        tideStatus: data.tide_status || "Rising",
        nextHighTide: data.next_high_tide || null,
        nextLowTide: data.next_low_tide || null,
        visibility: parseFloat(data.visibility) || 0,
        precipitation: parseFloat(data.precipitation) || 0,
        temperature: parseFloat(data.temperature) || 0,
        pressure: parseFloat(data.pressure) || 0,
        berthingSafety: data.berthing_safety || "Safe",
        restrictions: data.restrictions || [],
        updatedAt: data.updated_at || new Date().toISOString(),
      };
    } catch (error) {
      logger.error("[DTNMarine] getPortConditions error:", error);
      return null;
    }
  }

  /**
   * Get predicted vessel motion along a route
   */
  async getVesselMotionForecast(
    imoNumber: string,
    route: { lat: number; lng: number }[]
  ): Promise<VesselMotionForecast | null> {
    if (!this.isConfigured()) {
      logger.warn("[DTNMarine] API key not configured");
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/vessel-motion`, {
        method: "POST",
        headers: {
          ...this.getHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imo_number: imoNumber,
          route: route.map((wp) => ({ lat: wp.lat, lng: wp.lng })),
        }),
      });

      if (!response.ok) {
        logger.error(`[DTNMarine] API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return {
        imoNumber: data.imo_number || imoNumber,
        segments: (data.segments || []).map((s: any, index: number) => ({
          segmentIndex: s.segment_index ?? index,
          lat: parseFloat(s.lat) || 0,
          lng: parseFloat(s.lng) || 0,
          rollAngle: parseFloat(s.roll_angle) || 0,
          pitchAngle: parseFloat(s.pitch_angle) || 0,
          heaveMagnitude: parseFloat(s.heave_magnitude) || 0,
          workability: s.workability || "Good",
          significantWaveHeight: parseFloat(s.significant_wave_height) || 0,
          encounterPeriod: parseFloat(s.encounter_period) || 0,
          timestamp: s.timestamp || "",
        })),
        overallWorkability: data.overall_workability || "Good",
        recommendations: data.recommendations || [],
        generatedAt: data.generated_at || new Date().toISOString(),
      };
    } catch (error) {
      logger.error("[DTNMarine] getVesselMotionForecast error:", error);
      return null;
    }
  }
}

// Export singleton instance
export const dtnMarineWeatherService = new DTNMarineWeatherService();
