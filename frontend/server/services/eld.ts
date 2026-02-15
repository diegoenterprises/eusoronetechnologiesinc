/**
 * ELD (Electronic Logging Device) INTEGRATION SERVICE
 * 
 * Integrates with ELD providers for real-time HOS data,
 * driver duty status, and compliance monitoring.
 * 
 * Supports common ELD providers: KeepTruckin, Samsara, Omnitracs, etc.
 */

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

class ELDService {
  private providers: Map<string, ELDProviderConfig> = new Map();

  constructor() {
    // Initialize with configured providers
    this.initializeProviders();
  }

  private initializeProviders() {
    // KeepTruckin / Motive
    if (process.env.KEEPTRUCKIN_API_KEY) {
      this.providers.set("keeptruckin", {
        name: "KeepTruckin",
        apiKey: process.env.KEEPTRUCKIN_API_KEY,
        baseUrl: "https://api.keeptruckin.com/v1",
      });
    }

    // Samsara
    if (process.env.SAMSARA_API_KEY) {
      this.providers.set("samsara", {
        name: "Samsara",
        apiKey: process.env.SAMSARA_API_KEY,
        baseUrl: "https://api.samsara.com/v1",
      });
    }

    // Omnitracs
    if (process.env.OMNITRACS_API_KEY) {
      this.providers.set("omnitracs", {
        name: "Omnitracs",
        apiKey: process.env.OMNITRACS_API_KEY,
        baseUrl: "https://api.omnitracs.com/v1",
      });
    }
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

  // ============================================================================
  // MOCK DATA
  // ============================================================================

  private getMockDriverHOS(driverId: string): ELDDriverLog {
    const now = new Date();
    const statusSince = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    return {
      driverId,
      date: now.toISOString().split("T")[0],
      currentStatus: "D",
      statusSince: statusSince.toISOString(),
      location: {
        lat: 31.5493,
        lng: -97.1467,
        address: "I-35 near Waco, TX",
      },
      vehicle: {
        id: "v_001",
        unitNumber: "TRK-101",
        vin: "1HGBH41JXMN109186",
      },
      hoursAvailable: {
        driving: 390, // 6.5 hours
        onDuty: 540, // 9 hours
        cycle: 3300, // 55 hours
        breakRemaining: 30,
      },
      violations: [],
      logs: [
        {
          id: "log_001",
          status: "OFF",
          startTime: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          duration: 480,
          location: "Houston, TX",
          certified: true,
          edited: false,
        },
        {
          id: "log_002",
          status: "ON",
          startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
          duration: 30,
          location: "Houston Terminal",
          notes: "Pre-trip inspection",
          certified: true,
          edited: false,
        },
        {
          id: "log_003",
          status: "D",
          startTime: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
          endTime: null,
          duration: 90,
          location: "En route to Dallas",
          certified: false,
          edited: false,
        },
      ],
    };
  }

  private getMockLogs(
    driverId: string,
    startDate: string,
    endDate: string
  ): ELDLogEntry[] {
    return this.getMockDriverHOS(driverId).logs;
  }

  private getMockVehicleInfo(vehicleId: string): ELDVehicleInfo {
    return {
      vehicleId,
      unitNumber: "TRK-101",
      vin: "1HGBH41JXMN109186",
      make: "Peterbilt",
      model: "579",
      year: 2022,
      eldDeviceId: "ELD-001234",
      eldProvider: "keeptruckin",
      lastConnection: new Date().toISOString(),
      odometer: 458350,
      engineHours: 12500,
      fuelLevel: 72,
      location: {
        lat: 31.5493,
        lng: -97.1467,
        speed: 62,
        heading: 315,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

interface ELDProviderConfig {
  name: string;
  apiKey: string;
  baseUrl: string;
}

// Export singleton instance
export const eldService = new ELDService();
