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

// Mapping from integrationConnections providerSlug → ELD API config
const ELD_PROVIDER_MAP: Record<string, { name: string; baseUrl: string }> = {
  motive:      { name: "Motive",    baseUrl: "https://api.gomotive.com/v2" },
  keeptruckin: { name: "Motive",    baseUrl: "https://api.gomotive.com/v2" },
  samsara:     { name: "Samsara",   baseUrl: "https://api.samsara.com/v1" },
  omnitracs:   { name: "Omnitracs", baseUrl: "https://api.omnitracs.com/v1" },
  geotab:      { name: "Geotab",    baseUrl: "https://my.geotab.com/apiv1" },
};

// Slugs that are ELD providers (vs terminal automation or market data)
const ELD_SLUGS = new Set(Object.keys(ELD_PROVIDER_MAP));

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

// Export singleton instance
export const eldService = new ELDService();
