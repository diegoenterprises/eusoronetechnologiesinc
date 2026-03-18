/**
 * MARINETRAFFIC VESSEL TRACKING INTEGRATION
 * Real-time AIS vessel tracking, position data, and maritime intelligence
 *
 * Provides vessel positions, particulars, port calls, and route history
 * API Documentation: https://www.marinetraffic.com/en/ais-api-services
 */

import { logger } from "../../_core/logger";

// Environment configuration
const MARINETRAFFIC_API_KEY = process.env.MARINETRAFFIC_API_KEY || "";
const MARINETRAFFIC_BASE_URL = "https://services.marinetraffic.com/api";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface VesselPosition {
  imoNumber: string;
  mmsi: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  course: number;
  destination: string | null;
  eta: string | null;
  timestamp: string;
  status: string;
  draught: number | null;
  navigationalStatus: string | null;
}

export interface VesselParticulars {
  imoNumber: string;
  mmsi: string;
  name: string;
  type: string;
  flag: string;
  grossTonnage: number;
  deadweight: number;
  length: number;
  beam: number;
  yearBuilt: number;
  owner: string | null;
  operator: string | null;
  callSign: string | null;
  classification: string | null;
}

export interface PortCall {
  portName: string;
  portId: string;
  unlocode: string;
  arrivalTime: string | null;
  departureTime: string | null;
  inPort: boolean;
  draught: number | null;
  country: string;
}

export interface VesselInPort {
  imoNumber: string;
  mmsi: string;
  name: string;
  type: string;
  flag: string;
  lat: number;
  lng: number;
  speed: number;
  status: string;
  arrivalTime: string | null;
  draught: number | null;
}

export interface RoutePosition {
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  course: number;
  timestamp: string;
  status: string;
}

export interface VesselSearchResult {
  imoNumber: string;
  mmsi: string;
  name: string;
  type: string;
  flag: string;
  grossTonnage: number;
  deadweight: number;
  yearBuilt: number;
}

// ============================================================================
// API CLIENT
// ============================================================================

class MarineTrafficService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = MARINETRAFFIC_API_KEY;
    this.baseUrl = MARINETRAFFIC_BASE_URL;
  }

  /**
   * Check if the API is configured
   */
  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Get real-time vessel position by IMO number
   */
  async getVesselPosition(imoNumber: string): Promise<VesselPosition | null> {
    if (!this.isConfigured()) {
      logger.warn("[MarineTraffic] API key not configured");
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/exportvessel/v:5/${this.apiKey}/imo:${imoNumber}/protocol:jsono`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        logger.error(`[MarineTraffic] API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const vessel = Array.isArray(data) ? data[0] : data;
      if (!vessel) return null;

      return {
        imoNumber: vessel.IMO || imoNumber,
        mmsi: vessel.MMSI || "",
        lat: parseFloat(vessel.LAT) || 0,
        lng: parseFloat(vessel.LON) || 0,
        heading: parseFloat(vessel.HEADING) || 0,
        speed: parseFloat(vessel.SPEED) || 0,
        course: parseFloat(vessel.COURSE) || 0,
        destination: vessel.DESTINATION || null,
        eta: vessel.ETA || null,
        timestamp: vessel.TIMESTAMP || new Date().toISOString(),
        status: vessel.STATUS || "Unknown",
        draught: vessel.DRAUGHT ? parseFloat(vessel.DRAUGHT) : null,
        navigationalStatus: vessel.NAV_STATUS || null,
      };
    } catch (error) {
      logger.error("[MarineTraffic] getVesselPosition error:", error);
      return null;
    }
  }

  /**
   * Get vessel particulars (static information) by IMO number
   */
  async getVesselParticulars(imoNumber: string): Promise<VesselParticulars | null> {
    if (!this.isConfigured()) {
      logger.warn("[MarineTraffic] API key not configured");
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/vesselparticulars/v:3/${this.apiKey}/imo:${imoNumber}/protocol:jsono`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        logger.error(`[MarineTraffic] API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const vessel = Array.isArray(data) ? data[0] : data;
      if (!vessel) return null;

      return {
        imoNumber: vessel.IMO || imoNumber,
        mmsi: vessel.MMSI || "",
        name: vessel.SHIPNAME || "",
        type: vessel.SHIPTYPE || "",
        flag: vessel.FLAG || "",
        grossTonnage: parseInt(vessel.GRT, 10) || 0,
        deadweight: parseInt(vessel.DWT, 10) || 0,
        length: parseFloat(vessel.LENGTH) || 0,
        beam: parseFloat(vessel.BEAM) || 0,
        yearBuilt: parseInt(vessel.YEAR_BUILT, 10) || 0,
        owner: vessel.OWNER || null,
        operator: vessel.MANAGER || null,
        callSign: vessel.CALLSIGN || null,
        classification: vessel.CLASS || null,
      };
    } catch (error) {
      logger.error("[MarineTraffic] getVesselParticulars error:", error);
      return null;
    }
  }

  /**
   * Get port calls history for a vessel
   */
  async getPortCalls(imoNumber: string, days: number = 30): Promise<PortCall[]> {
    if (!this.isConfigured()) {
      logger.warn("[MarineTraffic] API key not configured");
      return [];
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/portcalls/v:4/${this.apiKey}/imo:${imoNumber}/days:${days}/protocol:jsono`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const calls = Array.isArray(data) ? data : [];

      return calls.map((call: any) => ({
        portName: call.PORT_NAME || "",
        portId: call.PORT_ID || "",
        unlocode: call.UNLOCODE || "",
        arrivalTime: call.TIMESTAMP_ARRIVAL || null,
        departureTime: call.TIMESTAMP_DEPARTURE || null,
        inPort: call.IN_PORT === "1" || call.IN_PORT === true,
        draught: call.DRAUGHT ? parseFloat(call.DRAUGHT) : null,
        country: call.COUNTRY || "",
      }));
    } catch (error) {
      logger.error("[MarineTraffic] getPortCalls error:", error);
      return [];
    }
  }

  /**
   * Get vessels currently in port or approaching a port
   */
  async getVesselsByPort(portId: string): Promise<VesselInPort[]> {
    if (!this.isConfigured()) {
      logger.warn("[MarineTraffic] API key not configured");
      return [];
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/expectedarrivals/v:3/${this.apiKey}/portid:${portId}/protocol:jsono`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const vessels = Array.isArray(data) ? data : [];

      return vessels.map((v: any) => ({
        imoNumber: v.IMO || "",
        mmsi: v.MMSI || "",
        name: v.SHIPNAME || "",
        type: v.SHIPTYPE || "",
        flag: v.FLAG || "",
        lat: parseFloat(v.LAT) || 0,
        lng: parseFloat(v.LON) || 0,
        speed: parseFloat(v.SPEED) || 0,
        status: v.STATUS || "Unknown",
        arrivalTime: v.ETA || null,
        draught: v.DRAUGHT ? parseFloat(v.DRAUGHT) : null,
      }));
    } catch (error) {
      logger.error("[MarineTraffic] getVesselsByPort error:", error);
      return [];
    }
  }

  /**
   * Get historical vessel route positions
   */
  async getVesselRoute(imoNumber: string): Promise<RoutePosition[]> {
    if (!this.isConfigured()) {
      logger.warn("[MarineTraffic] API key not configured");
      return [];
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/exportvesseltrack/v:2/${this.apiKey}/imo:${imoNumber}/days:7/protocol:jsono`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const positions = Array.isArray(data) ? data : [];

      return positions.map((pos: any) => ({
        lat: parseFloat(pos.LAT) || 0,
        lng: parseFloat(pos.LON) || 0,
        speed: parseFloat(pos.SPEED) || 0,
        heading: parseFloat(pos.HEADING) || 0,
        course: parseFloat(pos.COURSE) || 0,
        timestamp: pos.TIMESTAMP || "",
        status: pos.STATUS || "Unknown",
      }));
    } catch (error) {
      logger.error("[MarineTraffic] getVesselRoute error:", error);
      return [];
    }
  }

  /**
   * Search vessels by name, IMO, or MMSI
   */
  async searchVessels(query: string): Promise<VesselSearchResult[]> {
    if (!this.isConfigured()) {
      logger.warn("[MarineTraffic] API key not configured");
      return [];
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/shipsearch/v:1/${this.apiKey}/search:${encodeURIComponent(query)}/protocol:jsono`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const vessels = Array.isArray(data) ? data : [];

      return vessels.map((v: any) => ({
        imoNumber: v.IMO || "",
        mmsi: v.MMSI || "",
        name: v.SHIPNAME || "",
        type: v.SHIPTYPE || "",
        flag: v.FLAG || "",
        grossTonnage: parseInt(v.GRT, 10) || 0,
        deadweight: parseInt(v.DWT, 10) || 0,
        yearBuilt: parseInt(v.YEAR_BUILT, 10) || 0,
      }));
    } catch (error) {
      logger.error("[MarineTraffic] searchVessels error:", error);
      return [];
    }
  }
}

// Export singleton instance
export const marineTrafficService = new MarineTrafficService();
