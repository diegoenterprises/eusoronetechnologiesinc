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
import { logger } from "../_core/logger";
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
      logger.error("[ELD] loadProvidersForCompany error:", e);
    }

    return this.providers.size > 0;
  }

  /**
   * Clear provider cache — called after connect/disconnect to force reload
   */
  clearCache(): void {
    this.providers.clear();
    this.companyLoadCache.clear();
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
        logger.warn(`[ELD/GPS] API error ${resp.status} for ${providerConfig.name}`);
        return [];
      }

      const raw = await resp.json();
      return this.normalizeLocations(raw, providerConfig.name);
    } catch (err) {
      logger.warn(`[ELD/GPS] ${providerConfig.name} fetch error:`, (err as Error).message);
      return [];
    }
  }

  /**
   * Normalize raw provider response into standard ELDFleetLocation[]
   * Each provider returns data in a different shape.
   */
  private normalizeLocations(raw: any, providerName: string): ELDFleetLocation[] {
    try {
      // ── Samsara ──
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

      // ── Geotab ──
      if (providerName === "Geotab" && raw?.result) {
        return raw.result.filter((v: any) => v.latitude).map((v: any) => ({
          driverId: v.driver?.id || "",
          vehicleId: v.device?.id || v.id || "",
          lat: v.latitude,
          lng: v.longitude,
          speed: (v.speed || 0) * 0.621371,
          heading: v.bearing || 0,
          timestamp: v.dateTime || new Date().toISOString(),
          engineStatus: v.currentStateDuration != null ? "on" : undefined,
        }));
      }

      // ── Powerfleet ──
      if (providerName === "Powerfleet" && (raw?.vehicles || raw?.data)) {
        const arr = raw.vehicles || raw.data || [];
        return arr.filter((v: any) => v.position || v.location).map((v: any) => {
          const pos = v.position || v.location || {};
          return {
            driverId: v.driver?.id || v.driverId || "",
            vehicleId: v.vehicleId || v.id || "",
            lat: pos.latitude || pos.lat || 0,
            lng: pos.longitude || pos.lng || 0,
            speed: pos.speed || 0,
            heading: pos.heading || pos.course || 0,
            timestamp: pos.timestamp || pos.time || new Date().toISOString(),
            engineStatus: pos.ignition ? "on" : "off",
            odometerMi: pos.odometer,
          };
        });
      }

      // ── Zonar ──
      if (providerName === "Zonar" && (raw?.assets || raw?.data)) {
        const arr = raw.assets || raw.data || [];
        return arr.filter((v: any) => v.location).map((v: any) => ({
          driverId: v.driver?.id || v.driverId || "",
          vehicleId: v.assetId || v.id || "",
          lat: v.location.lat || v.location.latitude || 0,
          lng: v.location.lon || v.location.longitude || 0,
          speed: v.location.speed || 0,
          heading: v.location.heading || 0,
          timestamp: v.location.timestamp || new Date().toISOString(),
          engineStatus: v.location.ignitionOn ? "on" : "off",
        }));
      }

      // ── Motive (KeepTruckin) ──
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

      // ── Lytx ──
      if (providerName === "Lytx" && (raw?.positions || raw?.data)) {
        const arr = raw.positions || raw.data || [];
        return arr.filter((v: any) => v.latitude || v.lat).map((v: any) => ({
          driverId: v.driverId || v.driver_id || "",
          vehicleId: v.vehicleId || v.vehicle_id || v.id || "",
          lat: v.latitude || v.lat || 0,
          lng: v.longitude || v.lng || 0,
          speed: v.speedMph || v.speed || 0,
          heading: v.heading || v.direction || 0,
          timestamp: v.positionTime || v.timestamp || new Date().toISOString(),
          engineStatus: v.ignitionOn ? "on" : "off",
        }));
      }

      // ── Netradyne ──
      if (providerName === "Netradyne" && (raw?.vehicles || raw?.data)) {
        const arr = raw.vehicles || raw.data || [];
        return arr.filter((v: any) => v.gps || v.location).map((v: any) => {
          const gps = v.gps || v.location || {};
          return {
            driverId: v.driverId || v.driver?.id || "",
            vehicleId: v.vehicleId || v.id || "",
            lat: gps.lat || gps.latitude || 0,
            lng: gps.lng || gps.longitude || 0,
            speed: gps.speed || gps.speedMph || 0,
            heading: gps.bearing || gps.heading || 0,
            timestamp: gps.timestamp || gps.time || new Date().toISOString(),
            engineStatus: gps.engineRunning ? "on" : "off",
          };
        });
      }

      // ── Verizon Connect ──
      if (providerName === "Verizon Connect" && (raw?.vehicles || raw?.data)) {
        const arr = raw.vehicles || raw.data || [];
        return arr.filter((v: any) => v.lastKnownPosition || v.position || v.location).map((v: any) => {
          const pos = v.lastKnownPosition || v.position || v.location || {};
          return {
            driverId: v.driverId || v.driver?.id || "",
            vehicleId: v.id || v.vehicleId || "",
            lat: pos.latitude || pos.lat || 0,
            lng: pos.longitude || pos.lng || 0,
            speed: pos.speed || pos.speedMph || 0,
            heading: pos.heading || pos.direction || 0,
            timestamp: pos.dateTime || pos.timestamp || new Date().toISOString(),
            engineStatus: pos.ignitionStatus === "on" ? "on" : pos.ignitionStatus === "off" ? "off" : undefined,
            odometerMi: pos.odometer,
          };
        });
      }

      // ── Azuga ──
      if (providerName === "Azuga" && (raw?.positions || raw?.data)) {
        const arr = raw.positions || raw.data || [];
        return arr.filter((v: any) => v.lat || v.latitude).map((v: any) => ({
          driverId: v.driverId || v.driver_id || "",
          vehicleId: v.vehicleId || v.vehicle_id || v.id || "",
          lat: v.lat || v.latitude || 0,
          lng: v.lon || v.lng || v.longitude || 0,
          speed: v.speed || v.speedMph || 0,
          heading: v.heading || v.bearing || 0,
          timestamp: v.time || v.timestamp || new Date().toISOString(),
          engineStatus: v.ignition ? "on" : "off",
          fuelPct: v.fuelLevel,
        }));
      }

      // ── Solera (Omnitracs) ──
      if (providerName === "Solera" && (raw?.vehicles || raw?.data)) {
        const arr = raw.vehicles || raw.data || [];
        return arr.filter((v: any) => v.position || v.location).map((v: any) => {
          const pos = v.position || v.location || {};
          return {
            driverId: v.driverId || v.driver?.id || "",
            vehicleId: v.unitId || v.id || "",
            lat: pos.lat || pos.latitude || 0,
            lng: pos.lon || pos.longitude || 0,
            speed: pos.speed || 0,
            heading: pos.heading || pos.course || 0,
            timestamp: pos.timestamp || new Date().toISOString(),
            engineStatus: pos.engineRunning ? "on" : "off",
          };
        });
      }

      // ── Trimble / PeopleNet ──
      if (providerName === "Trimble / PeopleNet" && (raw?.positions || raw?.data || raw?.vehicles)) {
        const arr = raw.positions || raw.vehicles || raw.data || [];
        return arr.filter((v: any) => v.latitude || v.lat || v.position).map((v: any) => {
          const pos = v.position || v;
          return {
            driverId: v.driverId || v.driver?.id || pos.driverId || "",
            vehicleId: v.vehicleId || v.id || "",
            lat: pos.latitude || pos.lat || 0,
            lng: pos.longitude || pos.lng || 0,
            speed: ((pos.speed || 0) * 0.621371),
            heading: pos.heading || pos.course || 0,
            timestamp: pos.positionTime || pos.timestamp || new Date().toISOString(),
            odometerMi: pos.odometer ? pos.odometer * 0.621371 : undefined,
          };
        });
      }

      // ── Generic fallback ──
      const items = raw?.data || raw?.vehicles || raw?.result || raw?.positions || raw?.assets || (Array.isArray(raw) ? raw : []);
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
      logger.error(`[ELD/GPS] normalizeLocations error for ${providerName}:`, e);
      return [];
    }
  }

  /**
   * Map various duty status strings to standard DutyStatus enum
   */
  private mapDutyStatus(status?: string): DutyStatus {
    if (!status) return "OFF";
    const s = status.toLowerCase().replace(/[^a-z]/g, "");
    if (s.includes("driving") || s === "d" || s === "drive") return "D";
    if (s.includes("sleeper") || s === "sb" || s.includes("berth")) return "SB";
    if (s.includes("onduty") || s === "on" || s.includes("notdriving")) return "ON";
    if (s.includes("yard") || s === "ym") return "YM";
    if (s.includes("personal") || s === "pc") return "PC";
    return "OFF";
  }

  /**
   * Get driver's current HOS status.
   * Uses provider-specific hosEndpoint from metadata.
   */
  async getDriverHOS(driverId: string, provider?: string): Promise<ELDDriverLog | null> {
    if (!this.isConfigured()) return null;

    const providerSlug = provider || this.providers.keys().next().value;
    const providerConfig = providerSlug ? this.providers.get(providerSlug) : undefined;
    if (!providerConfig) return null;

    const meta = ELD_PROVIDERS.find(p => p.name === providerConfig.name)
      || ELD_PROVIDERS.find(p => providerConfig.baseUrl.includes(p.baseUrl.replace("https://", "")));
    const hosPath = meta?.hosEndpoint || `/drivers/${driverId}/hos`;

    let fullUrl = `${providerConfig.baseUrl}${hosPath}`;
    if (!hosPath.includes(driverId)) {
      const sep = fullUrl.includes("?") ? "&" : "?";
      fullUrl += `${sep}driverId=${driverId}`;
    }

    try {
      const response = await fetch(fullUrl, {
        headers: {
          Authorization: `${meta?.authHeader || "Bearer"} ${providerConfig.apiKey}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        logger.warn(`[ELD/HOS] ${providerConfig.name} API error: ${response.status}`);
        return null;
      }

      const raw = await response.json();
      return this.normalizeHOS(raw, providerConfig.name, driverId);
    } catch (error) {
      logger.warn(`[ELD/HOS] ${providerConfig.name} fetch error:`, (error as Error).message);
      return null;
    }
  }

  /**
   * Normalize HOS response from any provider into standard ELDDriverLog.
   */
  private normalizeHOS(raw: any, providerName: string, driverId: string): ELDDriverLog | null {
    try {
      const now = new Date().toISOString();
      const base: ELDDriverLog = {
        driverId,
        date: now.split("T")[0],
        currentStatus: "OFF",
        statusSince: now,
        location: { lat: 0, lng: 0 },
        vehicle: { id: "", unitNumber: "" },
        hoursAvailable: { driving: 660, onDuty: 840, cycle: 4200, breakRemaining: 30 },
        violations: [],
        logs: [],
      };

      // ── Samsara ──
      if (providerName === "Samsara") {
        const d = raw?.data?.[0] || raw?.data || raw;
        const clk = d?.hosStatusSummary || d?.clocks || {};
        return { ...base,
          currentStatus: this.mapDutyStatus(d?.hosStatusType || d?.currentDutyStatus),
          statusSince: d?.hosStatusStartTime || now,
          location: { lat: d?.location?.latitude || 0, lng: d?.location?.longitude || 0 },
          vehicle: { id: d?.vehicle?.id || "", unitNumber: d?.vehicle?.name || "" },
          hoursAvailable: {
            driving: clk?.drivingRemainingMs ? clk.drivingRemainingMs / 60000 : clk?.driveTimeRemaining || 660,
            onDuty: clk?.shiftRemainingMs ? clk.shiftRemainingMs / 60000 : clk?.onDutyRemaining || 840,
            cycle: clk?.cycleRemainingMs ? clk.cycleRemainingMs / 60000 : clk?.cycleRemaining || 4200,
            breakRemaining: clk?.breakRemainingMs ? clk.breakRemainingMs / 60000 : clk?.breakRemaining || 30,
          },
          violations: (d?.violations || []).map((v: any, vi: number) => ({
            id: v.id || `viol_${Date.now()}_${vi}`, type: "drive_time" as const,
            severity: (v.severity === "warning" ? "warning" : "violation") as "warning" | "violation",
            description: v.description || v.regulationDescription || "HOS violation",
            occurredAt: v.startTime || now, resolved: v.resolved || false,
          })),
        };
      }

      // ── Motive ──
      if (providerName === "Motive") {
        const d = raw?.driver_daily_log || raw?.data?.[0] || raw;
        const r = d?.hours_remaining || d?.hoursRemaining || {};
        return { ...base,
          currentStatus: this.mapDutyStatus(d?.duty_status || d?.current_status),
          statusSince: d?.status_since || now,
          location: { lat: d?.location?.lat || 0, lng: d?.location?.lon || d?.location?.lng || 0 },
          vehicle: { id: d?.vehicle?.id || "", unitNumber: d?.vehicle?.number || "" },
          hoursAvailable: {
            driving: (r.drive || r.driving || 11) * 60,
            onDuty: (r.shift || r.on_duty || 14) * 60,
            cycle: (r.cycle || 70) * 60,
            breakRemaining: (r.break || 0.5) * 60,
          },
        };
      }

      // ── Geotab ──
      if (providerName === "Geotab") {
        const d = raw?.result?.[0] || raw;
        const a = d?.availability || {};
        return { ...base,
          currentStatus: this.mapDutyStatus(d?.status || d?.dutyStatus),
          statusSince: d?.dateTime || now,
          vehicle: { id: d?.device?.id || "", unitNumber: d?.device?.name || "" },
          hoursAvailable: {
            driving: (a.driving?.value || a.drivingDuration || 11) * 60,
            onDuty: (a.duty?.value || a.onDutyDuration || 14) * 60,
            cycle: (a.cycle?.value || a.cycleDuration || 70) * 60,
            breakRemaining: (a.rest?.value || 0.5) * 60,
          },
        };
      }

      // ── Powerfleet ──
      if (providerName === "Powerfleet") {
        const d = raw?.driver || raw?.data?.[0] || raw;
        const h = d?.hos || d?.hoursOfService || {};
        return { ...base,
          currentStatus: this.mapDutyStatus(h?.currentStatus || d?.dutyStatus),
          statusSince: h?.statusSince || now,
          hoursAvailable: {
            driving: (h?.drivingRemaining || 11) * 60, onDuty: (h?.onDutyRemaining || 14) * 60,
            cycle: (h?.cycleRemaining || 70) * 60, breakRemaining: (h?.breakRemaining || 0.5) * 60,
          },
        };
      }

      // ── Zonar ──
      if (providerName === "Zonar") {
        const d = raw?.driver || raw?.data?.[0] || raw;
        const h = d?.hours || d?.hoursOfService || {};
        return { ...base,
          currentStatus: this.mapDutyStatus(h?.currentDutyStatus || d?.status),
          statusSince: h?.statusStartTime || now,
          hoursAvailable: {
            driving: (h?.drivingRemaining || 11) * 60, onDuty: (h?.shiftRemaining || 14) * 60,
            cycle: (h?.cycleRemaining || 70) * 60, breakRemaining: (h?.breakRemaining || 0.5) * 60,
          },
        };
      }

      // ── Lytx ──
      if (providerName === "Lytx") {
        const d = raw?.compliance || raw?.data?.[0] || raw;
        return { ...base,
          currentStatus: this.mapDutyStatus(d?.dutyStatus || d?.currentStatus),
          statusSince: d?.statusTime || now,
          hoursAvailable: {
            driving: (d?.drivingHoursRemaining || 11) * 60, onDuty: (d?.onDutyHoursRemaining || 14) * 60,
            cycle: (d?.cycleHoursRemaining || 70) * 60, breakRemaining: d?.breakMinutesRemaining || 30,
          },
        };
      }

      // ── Netradyne ──
      if (providerName === "Netradyne") {
        const d = raw?.driver || raw?.data?.[0] || raw;
        const h = d?.hos || {};
        return { ...base,
          currentStatus: this.mapDutyStatus(h?.status || d?.dutyStatus),
          statusSince: h?.statusSince || now,
          hoursAvailable: {
            driving: (h?.drivingRemaining || 11) * 60, onDuty: (h?.shiftRemaining || 14) * 60,
            cycle: (h?.cycleRemaining || 70) * 60, breakRemaining: (h?.breakRemaining || 0.5) * 60,
          },
        };
      }

      // ── Verizon Connect ──
      if (providerName === "Verizon Connect") {
        const d = raw?.hos || raw?.data?.[0] || raw;
        return { ...base,
          currentStatus: this.mapDutyStatus(d?.currentDutyStatus || d?.status),
          statusSince: d?.lastStatusChange || now,
          hoursAvailable: {
            driving: (d?.availableDrive || 11) * 60, onDuty: (d?.availableShift || 14) * 60,
            cycle: (d?.availableCycle || 70) * 60, breakRemaining: (d?.breakTimeRemaining || 0.5) * 60,
          },
        };
      }

      // ── Azuga ──
      if (providerName === "Azuga") {
        const d = raw?.dutyStatus || raw?.data?.[0] || raw;
        return { ...base,
          currentStatus: this.mapDutyStatus(d?.status || d?.currentDutyStatus),
          statusSince: d?.statusTime || now,
          hoursAvailable: {
            driving: (d?.hoursRemaining?.driving || 11) * 60, onDuty: (d?.hoursRemaining?.onDuty || 14) * 60,
            cycle: (d?.hoursRemaining?.cycle || 70) * 60, breakRemaining: (d?.hoursRemaining?.break || 0.5) * 60,
          },
        };
      }

      // ── Solera (Omnitracs) ──
      if (providerName === "Solera") {
        const d = raw?.hosLog || raw?.data?.[0] || raw;
        return { ...base,
          currentStatus: this.mapDutyStatus(d?.dutyStatus || d?.currentStatus),
          statusSince: d?.statusStartTime || now,
          hoursAvailable: {
            driving: (d?.drivingAvailable || 11) * 60, onDuty: (d?.onDutyAvailable || 14) * 60,
            cycle: (d?.cycleAvailable || 70) * 60, breakRemaining: (d?.breakAvailable || 0.5) * 60,
          },
        };
      }

      // ── Trimble / PeopleNet ──
      if (providerName === "Trimble / PeopleNet") {
        const d = raw?.hoursOfService || raw?.data?.[0] || raw;
        return { ...base,
          currentStatus: this.mapDutyStatus(d?.currentDutyStatus || d?.status),
          statusSince: d?.statusStartTime || now,
          hoursAvailable: {
            driving: (d?.remainingDrive || 11) * 60, onDuty: (d?.remainingDuty || 14) * 60,
            cycle: (d?.remainingCycle || 70) * 60, breakRemaining: (d?.remainingBreak || 0.5) * 60,
          },
        };
      }

      return base;
    } catch (e) {
      logger.error(`[ELD/HOS] normalizeHOS error for ${providerName}:`, e);
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
   * Get driver's log entries for a date range.
   * Uses provider-specific hosEndpoint with date params.
   */
  async getDriverLogs(
    driverId: string,
    startDate: string,
    endDate: string,
    provider?: string
  ): Promise<ELDLogEntry[]> {
    if (!this.isConfigured()) return [];

    const providerSlug = provider || this.providers.keys().next().value;
    const providerConfig = providerSlug ? this.providers.get(providerSlug) : undefined;
    if (!providerConfig) return [];

    const meta = ELD_PROVIDERS.find(p => p.name === providerConfig.name)
      || ELD_PROVIDERS.find(p => providerConfig.baseUrl.includes(p.baseUrl.replace("https://", "")));
    const hosPath = meta?.hosEndpoint || `/drivers/${driverId}/logs`;

    let fullUrl = `${providerConfig.baseUrl}${hosPath}`;
    const sep = fullUrl.includes("?") ? "&" : "?";
    fullUrl += `${sep}driverId=${driverId}&startDate=${startDate}&endDate=${endDate}`;

    try {
      const response = await fetch(fullUrl, {
        headers: {
          Authorization: `${meta?.authHeader || "Bearer"} ${providerConfig.apiKey}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        logger.warn(`[ELD/Logs] ${providerConfig.name} API error: ${response.status}`);
        return [];
      }

      const raw = await response.json();
      const entries = raw?.data || raw?.logs || raw?.result || raw?.entries || (Array.isArray(raw) ? raw : []);
      return entries.map((e: any, ei: number) => ({
        id: e.id || `eld_${Date.now()}_${ei}`,
        status: this.mapDutyStatus(e.status || e.dutyStatus || e.duty_status) as DutyStatus,
        startTime: e.startTime || e.start_time || e.startDate || "",
        endTime: e.endTime || e.end_time || e.endDate || null,
        duration: e.duration || e.durationMinutes || e.duration_minutes || 0,
        location: e.location || e.locationDescription || e.address || "",
        notes: e.notes || e.annotation || e.remark || undefined,
        edited: e.edited || e.isEdited || false,
        certified: e.certified || e.isCertified || e.driverCertified || false,
      }));
    } catch (err) {
      logger.warn(`[ELD/Logs] ${providerConfig.name} fetch error:`, (err as Error).message);
      return [];
    }
  }

  /**
   * Get vehicle information from ELD.
   * Queries the provider's vehicle/asset endpoint.
   */
  async getVehicleInfo(vehicleId: string, provider?: string): Promise<ELDVehicleInfo | null> {
    if (!this.isConfigured()) return null;

    const providerSlug = provider || this.providers.keys().next().value;
    const providerConfig = providerSlug ? this.providers.get(providerSlug) : undefined;
    if (!providerConfig) return null;

    const meta = ELD_PROVIDERS.find(p => p.name === providerConfig.name)
      || ELD_PROVIDERS.find(p => providerConfig.baseUrl.includes(p.baseUrl.replace("https://", "")));

    try {
      const response = await fetch(
        `${providerConfig.baseUrl}/vehicles/${vehicleId}`,
        {
          headers: {
            Authorization: `${meta?.authHeader || "Bearer"} ${providerConfig.apiKey}`,
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(15000),
        },
      );

      if (!response.ok) {
        logger.warn(`[ELD/Vehicle] ${providerConfig.name} API error: ${response.status}`);
        return null;
      }

      const raw = await response.json();
      const v = raw?.data || raw?.vehicle || raw?.result || raw;
      return {
        vehicleId: v.id || v.vehicleId || vehicleId,
        unitNumber: v.name || v.unitNumber || v.number || "",
        vin: v.vin || v.VIN || "",
        make: v.make || "",
        model: v.model || "",
        year: v.year || 0,
        eldDeviceId: v.eldDevice?.id || v.deviceId || v.device?.serialNumber || "",
        eldProvider: providerConfig.name,
        lastConnection: v.lastCommunication || v.lastConnection || v.lastSeen || new Date().toISOString(),
        odometer: v.odometerMeters ? v.odometerMeters * 0.000621371 : v.odometer || v.odometerMiles || 0,
        engineHours: v.engineHours || v.engine_hours || 0,
        fuelLevel: v.fuelPercent?.value || v.fuelLevel || v.fuel_level || undefined,
        location: {
          lat: v.location?.latitude || v.location?.lat || v.gps?.lat || 0,
          lng: v.location?.longitude || v.location?.lng || v.gps?.lng || 0,
          speed: v.location?.speedMilesPerHour || v.location?.speed || v.gps?.speed || 0,
          heading: v.location?.heading || v.gps?.heading || 0,
          timestamp: v.location?.time || v.gps?.timestamp || new Date().toISOString(),
        },
      };
    } catch (err) {
      logger.warn(`[ELD/Vehicle] ${providerConfig.name} fetch error:`, (err as Error).message);
      return null;
    }
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
