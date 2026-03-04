/**
 * ELD (Electronic Logging Device) INTEGRATION SERVICE
 * 
 * Integrates with ELD providers for real-time HOS data,
 * driver duty status, and compliance monitoring.
 * 
 * Supports common ELD providers: Motive (KeepTruckin), Samsara, Omnitracs, etc.
 * 
 * Provider credentials are loaded from:
 *   1. integrationConnections table (per-company, saved via IntegrationsPortal)
 *   2. Environment variables (platform-level fallback)
 */

import { getDb } from "../db";
import { eq, and, sql } from "drizzle-orm";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type DutyStatus = "OFF" | "SB" | "D" | "ON" | "YM" | "PC";

export interface ELDDriverLog {
  driverId: string;
  date: string;
  currentStatus: DutyStatus;
  statusSince: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  vehicle: {
    id: string;
    unitNumber: string;
    vin?: string;
  };
  hoursAvailable: {
    driving: number; // minutes
    onDuty: number;
    cycle: number;
    breakRemaining: number;
  };
  violations: ELDViolation[];
  logs: ELDLogEntry[];
}

export interface ELDLogEntry {
  id: string;
  status: DutyStatus;
  startTime: string;
  endTime: string | null;
  duration: number; // minutes
  location: string;
  notes?: string;
  edited: boolean;
  certified: boolean;
}

export interface ELDViolation {
  id: string;
  type: "drive_time" | "on_duty_time" | "cycle_time" | "break" | "form_manner";
  severity: "warning" | "violation";
  description: string;
  occurredAt: string;
  duration?: number;
  resolved: boolean;
}

export interface ELDVehicleInfo {
  vehicleId: string;
  unitNumber: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  eldDeviceId: string;
  eldProvider: string;
  lastConnection: string;
  odometer: number;
  engineHours: number;
  fuelLevel?: number;
  location: {
    lat: number;
    lng: number;
    speed: number;
    heading: number;
    timestamp: string;
  };
}

export interface HOSSummary {
  driverId: string;
  driverName: string;
  currentStatus: DutyStatus;
  statusDescription: string;
  hoursRemaining: {
    driving: number;
    onDuty: number;
    cycle: number;
  };
  breakRequired: boolean;
  breakDueIn?: number;
  violations: number;
  warnings: number;
  complianceStatus: "compliant" | "warning" | "violation";
}

// ============================================================================
// ELD SERVICE
// ============================================================================

// ============================================================================
// ALL SUPPORTED ELD PROVIDERS — 11 industry leaders
// Ranked by driver satisfaction (source: user-provided market data)
// ============================================================================

export interface ELDProviderMeta {
  name: string;
  slug: string;
  baseUrl: string;
  satisfaction: number; // %
  gpsEndpoint: string;  // relative path for fleet GPS locations
  hosEndpoint: string;  // relative path for HOS data
  authHeader: string;   // how the API key is sent
  logoColor: string;    // brand color for UI
  features: string[];   // capabilities
}

const ELD_PROVIDERS: ELDProviderMeta[] = [
  {
    name: "Samsara", slug: "samsara", baseUrl: "https://api.samsara.com",
    satisfaction: 84, gpsEndpoint: "/fleet/vehicles/locations", hosEndpoint: "/fleet/drivers/hos/daily-logs",
    authHeader: "Bearer", logoColor: "#1A73E8",
    features: ["GPS", "HOS", "DVIR", "IFTA", "Dashcam", "Temperature", "Diagnostics"],
  },
  {
    name: "Geotab", slug: "geotab", baseUrl: "https://my.geotab.com/apiv1",
    satisfaction: 76, gpsEndpoint: "/Get?typeName=DeviceStatusInfo", hosEndpoint: "/Get?typeName=DutyStatusLog",
    authHeader: "Bearer", logoColor: "#00A651",
    features: ["GPS", "HOS", "DVIR", "IFTA", "Engine Diagnostics", "Collision Reconstruction"],
  },
  {
    name: "Powerfleet", slug: "powerfleet", baseUrl: "https://api.powerfleet.com/v1",
    satisfaction: 74, gpsEndpoint: "/vehicles/locations", hosEndpoint: "/drivers/hos",
    authHeader: "Bearer", logoColor: "#0066CC",
    features: ["GPS", "HOS", "Asset Tracking", "Trailer Monitoring", "Cargo Sensors"],
  },
  {
    name: "Zonar", slug: "zonar", baseUrl: "https://api.zonarsystems.net/v3",
    satisfaction: 71, gpsEndpoint: "/assets/locations", hosEndpoint: "/drivers/hours",
    authHeader: "Bearer", logoColor: "#FF6600",
    features: ["GPS", "HOS", "EVIR", "IFTA", "Student Tracking", "Idle Management"],
  },
  {
    name: "Motive", slug: "motive", baseUrl: "https://api.gomotive.com/v2",
    satisfaction: 70, gpsEndpoint: "/vehicles/locations", hosEndpoint: "/drivers/hos_daily_logs",
    authHeader: "Bearer", logoColor: "#FF5722",
    features: ["GPS", "HOS", "DVIR", "IFTA", "AI Dashcam", "Dispatch", "Workflow"],
  },
  {
    name: "Lytx", slug: "lytx", baseUrl: "https://api.lytx.com/v2",
    satisfaction: 68, gpsEndpoint: "/vehicles/positions", hosEndpoint: "/drivers/compliance",
    authHeader: "Bearer", logoColor: "#0077B5",
    features: ["GPS", "HOS", "Video Telematics", "Risk Detection", "Driver Coaching"],
  },
  {
    name: "Netradyne", slug: "netradyne", baseUrl: "https://api.netradyne.com/v1",
    satisfaction: 68, gpsEndpoint: "/fleet/vehicles/location", hosEndpoint: "/fleet/drivers/hos",
    authHeader: "Bearer", logoColor: "#6C5CE7",
    features: ["GPS", "HOS", "AI Dashcam", "Driver Score", "Edge Computing", "GreenZone"],
  },
  {
    name: "Verizon Connect", slug: "verizon_connect", baseUrl: "https://fim.api.verizonconnect.com/api",
    satisfaction: 67, gpsEndpoint: "/vehicles/lastknown", hosEndpoint: "/hos/status",
    authHeader: "Bearer", logoColor: "#CD040B",
    features: ["GPS", "HOS", "IFTA", "Dispatch", "Maintenance Alerts", "Geofencing"],
  },
  {
    name: "Azuga", slug: "azuga", baseUrl: "https://api.azuga.com/v1",
    satisfaction: 64, gpsEndpoint: "/vehicles/positions", hosEndpoint: "/drivers/duty-status",
    authHeader: "Bearer", logoColor: "#00BCD4",
    features: ["GPS", "HOS", "DVIR", "Driver Rewards", "OBD-II", "Fuel Management"],
  },
  {
    name: "Solera", slug: "solera", baseUrl: "https://api.solera.com/fleet/v1",
    satisfaction: 60, gpsEndpoint: "/vehicles/locations", hosEndpoint: "/drivers/hos-logs",
    authHeader: "Bearer", logoColor: "#1B365D",
    features: ["GPS", "HOS", "Claims Management", "Fleet Analytics", "Maintenance"],
  },
  {
    name: "Trimble / PeopleNet", slug: "trimble", baseUrl: "https://api.trimble.com/transportation/v1",
    satisfaction: 55, gpsEndpoint: "/vehicles/positions", hosEndpoint: "/drivers/hours-of-service",
    authHeader: "Bearer", logoColor: "#003B5C",
    features: ["GPS", "HOS", "IFTA", "Navigation", "Dispatch", "Fuel Optimization"],
  },
];

// Backward compatibility aliases
const SLUG_ALIASES: Record<string, string> = {
  keeptruckin: "motive",
  omnitracs: "solera", // Omnitracs merged into Solera
  peoplenet: "trimble",
  verizonconnect: "verizon_connect",
};

// Build fast lookup maps
const ELD_PROVIDER_MAP: Record<string, ELDProviderMeta> = {};
for (const p of ELD_PROVIDERS) {
  ELD_PROVIDER_MAP[p.slug] = p;
}
for (const [alias, canonical] of Object.entries(SLUG_ALIASES)) {
  if (ELD_PROVIDER_MAP[canonical]) ELD_PROVIDER_MAP[alias] = ELD_PROVIDER_MAP[canonical];
}

// Slugs that are ELD providers (vs terminal automation or market data)
const ELD_SLUGS = new Set([...Object.keys(ELD_PROVIDER_MAP), ...Object.keys(SLUG_ALIASES)]);

// ============================================================================
// GPS LOCATION TYPES
// ============================================================================

export interface ELDFleetLocation {
  driverId: string;
  vehicleId: string;
  lat: number;
  lng: number;
  speed: number;      // mph
  heading: number;    // degrees 0-360
  timestamp: string;  // ISO
  roadName?: string;
  engineStatus?: "on" | "off" | "idle";
  odometerMi?: number;
  fuelPct?: number;
  dutyStatus?: DutyStatus;
}

class ELDService {
  private providers: Map<string, ELDProviderConfig> = new Map();
  // Cache: companyId → timestamp of last provider load
  private companyLoadCache: Map<number, number> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

  constructor() {
    // Initialize with env var fallbacks
    this.initializeFromEnv();
  }

  private initializeFromEnv() {
    if (process.env.KEEPTRUCKIN_API_KEY || process.env.MOTIVE_API_KEY) {
      this.providers.set("motive", {
        name: "Motive",
        apiKey: process.env.MOTIVE_API_KEY || process.env.KEEPTRUCKIN_API_KEY || "",
        baseUrl: "https://api.gomotive.com/v2",
      });
    }
    if (process.env.SAMSARA_API_KEY) {
      this.providers.set("samsara", {
        name: "Samsara",
        apiKey: process.env.SAMSARA_API_KEY,
        baseUrl: "https://api.samsara.com/v1",
      });
    }
    if (process.env.OMNITRACS_API_KEY) {
      this.providers.set("omnitracs", {
        name: "Omnitracs",
        apiKey: process.env.OMNITRACS_API_KEY,
        baseUrl: "https://api.omnitracs.com/v1",
      });
    }
  }

  /**
   * Load ELD provider credentials from integrationConnections for a company.
   * Called by hosEngine when it needs to check if ELD data is available.
   */
  async loadProvidersForCompany(companyId: number): Promise<boolean> {
    // Check cache
    const lastLoad = this.companyLoadCache.get(companyId) || 0;
    if (Date.now() - lastLoad < this.CACHE_TTL_MS && this.providers.size > 0) {
      return this.providers.size > 0;
    }

    const db = await getDb();
    if (!db) return this.providers.size > 0;

    try {
      const { integrationConnections } = await import("../../drizzle/schema");
      const conns = await db.select({
        slug: integrationConnections.providerSlug,
        apiKey: integrationConnections.apiKey,
        apiSecret: integrationConnections.apiSecret,
        status: integrationConnections.status,
      }).from(integrationConnections)
        .where(and(
          eq(integrationConnections.companyId, companyId),
          eq(integrationConnections.status, "connected"),
        ));

      // Add any ELD providers found in the company's integrations
      for (const conn of conns) {
        const slug = (conn.slug || "").toLowerCase();
        if (!ELD_SLUGS.has(slug) || !conn.apiKey) continue;

        const providerInfo = ELD_PROVIDER_MAP[slug];
        if (!providerInfo) continue;

        // Use canonical name (motive for keeptruckin)
        const canonicalSlug = slug === "keeptruckin" ? "motive" : slug;
        this.providers.set(canonicalSlug, {
          name: providerInfo.name,
          apiKey: conn.apiKey,
          baseUrl: providerInfo.baseUrl,
          apiSecret: conn.apiSecret || undefined,
        });
      }

      this.companyLoadCache.set(companyId, Date.now());
    } catch (e) {
      console.error("[ELD] loadProvidersForCompany error:", e);
    }

    return this.providers.size > 0;
  }

  /**
   * Check if any ELD provider is configured
   */
  isConfigured(): boolean {
    return this.providers.size > 0;
  }

  /**
   * Get available providers
   */
  getProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get all supported ELD providers with metadata (for frontend UI)
   */
  static getAllProviders(): ELDProviderMeta[] {
    return ELD_PROVIDERS;
  }

  /**
   * Get provider details by slug
   */
  static getProviderBySlug(slug: string): ELDProviderMeta | null {
    const canonical = SLUG_ALIASES[slug] || slug;
    return ELD_PROVIDER_MAP[canonical] || null;
  }

  /**
   * Get connected provider info for a company
   */
  getConnectedProviders(): Array<{ slug: string; name: string }> {
    return Array.from(this.providers.entries()).map(([slug, cfg]) => ({
      slug,
      name: cfg.name,
    }));
  }

  // ════════════════════════════════════════════════════════════════
  // FLEET GPS LOCATIONS — The key method for live driver tracking
  // ════════════════════════════════════════════════════════════════

  /**
   * Get live GPS locations for all vehicles from connected ELD provider.
   * This is what feeds the satellite map's fleet layer and road_live_pings.
   * Each ELD provider has a different endpoint; we normalize to ELDFleetLocation[].
   */
  async getFleetLocations(provider?: string): Promise<ELDFleetLocation[]> {
    if (!this.isConfigured()) return [];

    const providerConfig = provider
      ? this.providers.get(provider)
      : this.providers.values().next().value;

    if (!providerConfig) return [];

    // Find the provider metadata to get the correct GPS endpoint
    const meta = ELD_PROVIDERS.find(p => p.name === providerConfig.name)
      || ELD_PROVIDERS.find(p => providerConfig.baseUrl.includes(p.baseUrl.replace("https://", "")));

    const gpsPath = meta?.gpsEndpoint || "/fleet/vehicles/locations";

    try {
      const resp = await fetch(
        `${providerConfig.baseUrl}${gpsPath}`,
        {
          headers: {
            Authorization: `Bearer ${providerConfig.apiKey}`,
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(15000),
        },
      );

      if (!resp.ok) {
        console.warn(`[ELD/GPS] API error ${resp.status} for ${providerConfig.name}`);
        return [];
      }

      const raw = await resp.json();
      return this.normalizeLocations(raw, providerConfig.name);
    } catch (err) {
      console.warn(`[ELD/GPS] ${providerConfig.name} fetch error:`, (err as Error).message);
      return [];
    }
  }

  /**
   * Normalize raw provider response into standard ELDFleetLocation[]
   * Each provider returns data in a different shape.
   */
  private normalizeLocations(raw: any, providerName: string): ELDFleetLocation[] {
    try {
      // Samsara: { data: [{ id, name, location: { latitude, longitude, speed, heading, time } }] }
      if (providerName === "Samsara" && raw?.data) {
        return raw.data.filter((v: any) => v.location).map((v: any) => ({
          driverId: v.driverAssignment?.id || v.id || "",
          vehicleId: v.id || "",
          lat: v.location.latitude,
          lng: v.location.longitude,
          speed: (v.location.speedMilesPerHour || v.location.speed || 0),
          heading: v.location.heading || 0,
          timestamp: v.location.time || new Date().toISOString(),
          engineStatus: v.location.isEcuSpeed ? "on" : "off",
          odometerMi: v.odometerMeters ? v.odometerMeters * 0.000621371 : undefined,
        }));
      }

      // Motive: { vehicles: [{ vehicle: { id }, current_location: { lat, lon, speed, bearing, located_at } }] }
      if (providerName === "Motive" && (raw?.vehicles || raw?.data)) {
        const arr = raw.vehicles || raw.data || [];
        return arr.filter((v: any) => v.current_location || v.location).map((v: any) => {
          const loc = v.current_location || v.location || {};
          return {
            driverId: v.driver?.id || v.driverId || "",
            vehicleId: v.vehicle?.id || v.id || "",
            lat: loc.lat || loc.latitude || 0,
            lng: loc.lon || loc.lng || loc.longitude || 0,
            speed: loc.speed || loc.speed_miles_per_hour || 0,
            heading: loc.bearing || loc.heading || 0,
            timestamp: loc.located_at || loc.timestamp || new Date().toISOString(),
            engineStatus: loc.engine_state === "on" ? "on" : "off",
          };
        });
      }

      // Geotab: { result: [{ device: { id }, latitude, longitude, speed, bearing, dateTime }] }
      if (providerName === "Geotab" && raw?.result) {
        return raw.result.filter((v: any) => v.latitude).map((v: any) => ({
          driverId: v.driver?.id || "",
          vehicleId: v.device?.id || v.id || "",
          lat: v.latitude,
          lng: v.longitude,
          speed: (v.speed || 0) * 0.621371, // km/h → mph
          heading: v.bearing || 0,
          timestamp: v.dateTime || new Date().toISOString(),
        }));
      }

      // Generic fallback: try common field patterns
      const items = raw?.data || raw?.vehicles || raw?.result || raw?.positions || (Array.isArray(raw) ? raw : []);
      return items.filter((v: any) => (v.lat || v.latitude) && (v.lng || v.longitude || v.lon)).map((v: any) => ({
        driverId: v.driverId || v.driver_id || v.driver?.id || "",
        vehicleId: v.vehicleId || v.vehicle_id || v.id || "",
        lat: v.lat || v.latitude || 0,
        lng: v.lng || v.longitude || v.lon || 0,
        speed: v.speed || v.speedMph || 0,
        heading: v.heading || v.bearing || v.direction || 0,
        timestamp: v.timestamp || v.time || v.dateTime || v.located_at || new Date().toISOString(),
        engineStatus: v.engineStatus || v.engine_state || undefined,
        dutyStatus: v.dutyStatus || v.duty_status || undefined,
      }));
    } catch (e) {
      console.error(`[ELD/GPS] normalizeLocations error for ${providerName}:`, e);
      return [];
    }
  }

  /**
   * Get driver's current HOS status
   */
  async getDriverHOS(driverId: string, provider?: string): Promise<ELDDriverLog | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const providerConfig = provider
      ? this.providers.get(provider)
      : this.providers.values().next().value;

    if (!providerConfig) {
      return null;
    }

    try {
      const response = await fetch(
        `${providerConfig.baseUrl}/drivers/${driverId}/hos`,
        {
          headers: {
            Authorization: `Bearer ${providerConfig.apiKey}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(`[ELD] API error: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("[ELD] getDriverHOS error:", error);
      return null;
    }
  }

  /**
   * Get HOS summary for multiple drivers
   */
  async getFleetHOSSummary(driverIds: string[]): Promise<HOSSummary[]> {
    const results = await Promise.all(
      driverIds.map(async (driverId) => {
        const hos = await this.getDriverHOS(driverId);
        if (!hos) return null;

        return this.convertToSummary(hos);
      })
    );

    return results.filter((r): r is HOSSummary => r !== null);
  }

  /**
   * Get driver's log entries for a date range
   */
  async getDriverLogs(
    driverId: string,
    startDate: string,
    endDate: string
  ): Promise<ELDLogEntry[]> {
    if (!this.isConfigured()) {
      return [];
    }

    // Would call actual ELD API
    return [];
  }

  /**
   * Get vehicle information from ELD
   */
  async getVehicleInfo(vehicleId: string): Promise<ELDVehicleInfo | null> {
    if (!this.isConfigured()) {
      return null;
    }

    // Would call actual ELD API
    return null;
  }

  /**
   * Get all violations for a driver
   */
  async getDriverViolations(
    driverId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ELDViolation[]> {
    const hos = await this.getDriverHOS(driverId);
    return hos?.violations || [];
  }

  /**
   * Calculate if driver needs a break
   */
  calculateBreakRequired(hos: ELDDriverLog): { required: boolean; dueIn: number } {
    // 30-minute break required after 8 hours of driving
    const drivingMinutes = 8 * 60 - hos.hoursAvailable.driving;
    const breakThreshold = 8 * 60;

    if (drivingMinutes >= breakThreshold && hos.hoursAvailable.breakRemaining > 0) {
      return { required: true, dueIn: 0 };
    }

    if (drivingMinutes >= breakThreshold - 30) {
      return { required: false, dueIn: breakThreshold - drivingMinutes };
    }

    return { required: false, dueIn: breakThreshold - drivingMinutes };
  }

  /**
   * Convert driver log to summary format
   */
  private convertToSummary(hos: ELDDriverLog): HOSSummary {
    const statusDescriptions: Record<DutyStatus, string> = {
      OFF: "Off Duty",
      SB: "Sleeper Berth",
      D: "Driving",
      ON: "On Duty (Not Driving)",
      YM: "Yard Move",
      PC: "Personal Conveyance",
    };

    const violations = hos.violations.filter((v) => v.severity === "violation").length;
    const warnings = hos.violations.filter((v) => v.severity === "warning").length;
    const breakInfo = this.calculateBreakRequired(hos);

    let complianceStatus: "compliant" | "warning" | "violation" = "compliant";
    if (violations > 0) {
      complianceStatus = "violation";
    } else if (warnings > 0 || breakInfo.required) {
      complianceStatus = "warning";
    }

    return {
      driverId: hos.driverId,
      driverName: `Driver ${hos.driverId}`,
      currentStatus: hos.currentStatus,
      statusDescription: statusDescriptions[hos.currentStatus],
      hoursRemaining: {
        driving: Math.round(hos.hoursAvailable.driving / 60 * 10) / 10,
        onDuty: Math.round(hos.hoursAvailable.onDuty / 60 * 10) / 10,
        cycle: Math.round(hos.hoursAvailable.cycle / 60 * 10) / 10,
      },
      breakRequired: breakInfo.required,
      breakDueIn: breakInfo.dueIn > 0 ? breakInfo.dueIn : undefined,
      violations,
      warnings,
      complianceStatus,
    };
  }

}

interface ELDProviderConfig {
  name: string;
  apiKey: string;
  baseUrl: string;
  apiSecret?: string;
}

// Export singleton + metadata
export const eldService = new ELDService();
export { ELD_PROVIDERS, ELD_PROVIDER_MAP, ELD_SLUGS, SLUG_ALIASES };
