/**
 * MOTIVE (KEEPTRUCKIN) ELD INTEGRATION SERVICE
 * ELD logs, HOS data, vehicle tracking, and driver management
 */

import { BaseIntegrationService, SyncResult, MappedRecord } from "./BaseIntegrationService";
import { logger } from "../../_core/logger";
import { getDb } from "../../db";
import { 
  vehicles,
  drivers,
  integrationConnections,
  integrationSyncedRecords
} from "../../../drizzle/schema";
import { eq, and } from "drizzle-orm";

interface MotiveDriver {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  license_number?: string;
  license_state?: string;
  status: "active" | "inactive" | "deactivated";
  current_vehicle_id?: string;
  home_terminal?: string;
  driver_company_id?: string;
}

interface MotiveVehicle {
  id: string;
  number: string;
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  license_plate_number?: string;
  license_plate_state?: string;
  status: "active" | "inactive" | "out_of_service";
  current_driver_id?: string;
  current_location?: {
    lat: number;
    lon: number;
    bearing?: number;
    speed?: number;
    located_at: string;
  };
  odometer?: number;
  engine_hours?: number;
  fuel_level_percent?: number;
}

interface MotiveHOSLog {
  id: string;
  driver_id: string;
  vehicle_id?: string;
  date: string;
  status: "off_duty" | "sleeper" | "driving" | "on_duty" | "yard_moves" | "personal_conveyance";
  start_time: string;
  end_time?: string;
  duration_seconds: number;
  location?: {
    description: string;
    lat: number;
    lon: number;
  };
  annotations?: string[];
  edited: boolean;
  certified: boolean;
}

interface MotiveDVIR {
  id: string;
  driver_id: string;
  vehicle_id: string;
  inspection_type: "pre_trip" | "post_trip" | "en_route";
  created_at: string;
  signed_at?: string;
  status: "satisfactory" | "defects_corrected" | "defects_need_correction";
  defects: Array<{
    id: string;
    category: string;
    description: string;
    severity: "minor" | "major" | "critical";
    corrected: boolean;
  }>;
  mechanic_signature?: {
    name: string;
    signed_at: string;
  };
}

interface MotiveLocation {
  vehicle_id: string;
  driver_id?: string;
  lat: number;
  lon: number;
  bearing?: number;
  speed?: number;
  odometer?: number;
  engine_hours?: number;
  located_at: string;
  address?: string;
}

export class MotiveELDService extends BaseIntegrationService {
  constructor() {
    super("keeptruckin", "https://api.gomotive.com/v1");
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest("/users/me");
      return true;
    } catch (error) {
      logger.error("[Motive] Connection test failed:", error);
      return false;
    }
  }

  async fetchData(dataTypes?: string[]): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      recordsFetched: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      errors: [],
    };

    const typesToSync = dataTypes || ["drivers", "vehicles", "hos_logs", "dvirs", "locations"];

    try {
      if (typesToSync.includes("drivers")) {
        const driverResult = await this.syncDrivers();
        result.recordsFetched += driverResult.fetched;
        result.recordsCreated += driverResult.created;
        result.recordsUpdated += driverResult.updated;
        result.recordsFailed += driverResult.failed;
      }

      if (typesToSync.includes("vehicles")) {
        const vehicleResult = await this.syncVehicles();
        result.recordsFetched += vehicleResult.fetched;
        result.recordsCreated += vehicleResult.created;
        result.recordsUpdated += vehicleResult.updated;
        result.recordsFailed += vehicleResult.failed;
      }

      if (typesToSync.includes("hos_logs")) {
        const hosResult = await this.syncHOSLogs();
        result.recordsFetched += hosResult.fetched;
        result.recordsCreated += hosResult.created;
        result.recordsUpdated += hosResult.updated;
        result.recordsFailed += hosResult.failed;
      }

      if (typesToSync.includes("dvirs")) {
        const dvirResult = await this.syncDVIRs();
        result.recordsFetched += dvirResult.fetched;
        result.recordsCreated += dvirResult.created;
        result.recordsUpdated += dvirResult.updated;
        result.recordsFailed += dvirResult.failed;
      }

      if (typesToSync.includes("locations")) {
        const locationResult = await this.syncLocations();
        result.recordsFetched += locationResult.fetched;
        result.recordsCreated += locationResult.created;
        result.recordsUpdated += locationResult.updated;
        result.recordsFailed += locationResult.failed;
      }
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : "Unknown error");
    }

    return result;
  }

  private async syncDrivers(): Promise<{ fetched: number; created: number; updated: number; failed: number }> {
    const stats = { fetched: 0, created: 0, updated: 0, failed: 0 };

    try {
      const response = await this.makeRequest<{ drivers: MotiveDriver[] }>("/drivers");
      stats.fetched = response.drivers.length;

      for (const driver of response.drivers) {
        try {
          const mapped = this.mapToInternal([driver], "drivers")[0];
          if (mapped) {
            await this.saveSyncedRecord(mapped, 0);
            stats.created++;
          }
        } catch (recErr) {
          logger.warn(`[Motive] Failed to persist driver ${driver.id}:`, recErr);
          stats.failed++;
        }
      }

      logger.info(`[Motive] Fetched ${stats.fetched} drivers, persisted ${stats.created}`);
    } catch (error) {
      logger.error("[Motive] Failed to fetch drivers:", error);
      throw error;
    }

    return stats;
  }

  private async syncVehicles(): Promise<{ fetched: number; created: number; updated: number; failed: number }> {
    const stats = { fetched: 0, created: 0, updated: 0, failed: 0 };
    try {
      const response = await this.makeRequest<{ vehicles: MotiveVehicle[] }>("/vehicles");
      stats.fetched = response.vehicles.length;

      for (const vehicle of response.vehicles) {
        try {
          await this.saveSyncedRecord({
            externalId: vehicle.id,
            externalType: "vehicle",
            externalData: vehicle as unknown as Record<string, unknown>,
            internalTable: "vehicles",
            internalData: {
              vin: vehicle.vin,
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              licensePlate: vehicle.license_plate_number,
              status: vehicle.status,
              odometer: vehicle.odometer,
            },
          }, 0);
          stats.created++;
        } catch (recErr) {
          logger.warn(`[Motive] Failed to persist vehicle ${vehicle.id}:`, recErr);
          stats.failed++;
        }
      }

      logger.info(`[Motive] Fetched ${stats.fetched} vehicles, persisted ${stats.created}`);
    } catch (error) {
      logger.error("[Motive] Failed to fetch vehicles:", error);
      throw error;
    }
    return stats;
  }

  private async syncHOSLogs(): Promise<{ fetched: number; created: number; updated: number; failed: number }> {
    const stats = { fetched: 0, created: 0, updated: 0, failed: 0 };
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const response = await this.makeRequest<{ hos_logs: MotiveHOSLog[] }>(
        `/hos_logs?start_date=${startDate.toISOString().split("T")[0]}`
      );
      stats.fetched = response.hos_logs.length;

      for (const log of response.hos_logs) {
        try {
          await this.saveSyncedRecord({
            externalId: log.id,
            externalType: "hos_log",
            externalData: log as unknown as Record<string, unknown>,
            internalTable: "hos_logs",
            internalData: {
              driverExternalId: log.driver_id,
              status: this.mapHOSStatus(log.status),
              date: log.date,
              startTime: log.start_time,
              endTime: log.end_time,
              durationSeconds: log.duration_seconds,
              certified: log.certified,
            },
          }, 0);
          stats.created++;
        } catch (recErr) {
          logger.warn(`[Motive] Failed to persist HOS log ${log.id}:`, recErr);
          stats.failed++;
        }
      }

      logger.info(`[Motive] Fetched ${stats.fetched} HOS logs, persisted ${stats.created}`);
    } catch (error) {
      logger.error("[Motive] Failed to fetch HOS logs:", error);
      throw error;
    }
    return stats;
  }

  private async syncDVIRs(): Promise<{ fetched: number; created: number; updated: number; failed: number }> {
    const stats = { fetched: 0, created: 0, updated: 0, failed: 0 };
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const response = await this.makeRequest<{ dvirs: MotiveDVIR[] }>(
        `/dvirs?start_date=${startDate.toISOString().split("T")[0]}`
      );
      stats.fetched = response.dvirs.length;

      for (const dvir of response.dvirs) {
        try {
          await this.saveSyncedRecord({
            externalId: dvir.id,
            externalType: "dvir",
            externalData: dvir as unknown as Record<string, unknown>,
            internalTable: "inspections",
            internalData: {
              driverExternalId: dvir.driver_id,
              vehicleExternalId: dvir.vehicle_id,
              inspectionType: dvir.inspection_type,
              status: dvir.status,
              defectCount: dvir.defects?.length ?? 0,
              createdAt: dvir.created_at,
            },
          }, 0);
          stats.created++;
        } catch (recErr) {
          logger.warn(`[Motive] Failed to persist DVIR ${dvir.id}:`, recErr);
          stats.failed++;
        }
      }

      logger.info(`[Motive] Fetched ${stats.fetched} DVIRs, persisted ${stats.created}`);
    } catch (error) {
      logger.error("[Motive] Failed to fetch DVIRs:", error);
      throw error;
    }
    return stats;
  }

  private async syncLocations(): Promise<{ fetched: number; created: number; updated: number; failed: number }> {
    const stats = { fetched: 0, created: 0, updated: 0, failed: 0 };
    try {
      const response = await this.makeRequest<{ locations: MotiveLocation[] }>("/vehicle_locations");
      stats.fetched = response.locations.length;

      for (const loc of response.locations) {
        try {
          await this.saveSyncedRecord({
            externalId: loc.vehicle_id,
            externalType: "vehicle_location",
            externalData: loc as unknown as Record<string, unknown>,
            internalTable: "location_history",
            internalData: {
              vehicleExternalId: loc.vehicle_id,
              driverExternalId: loc.driver_id,
              lat: loc.lat,
              lon: loc.lon,
              speed: loc.speed,
              bearing: loc.bearing,
              odometer: loc.odometer,
              locatedAt: loc.located_at,
            },
          }, 0);
          stats.updated++;
        } catch (recErr) {
          logger.warn(`[Motive] Failed to persist location for vehicle ${loc.vehicle_id}:`, recErr);
          stats.failed++;
        }
      }

      logger.info(`[Motive] Fetched ${stats.fetched} vehicle locations, persisted ${stats.updated}`);
    } catch (error) {
      logger.error("[Motive] Failed to fetch locations:", error);
      throw error;
    }
    return stats;
  }

  private mapHOSStatus(status: string): string {
    const statusMap: Record<string, string> = {
      off_duty: "off_duty",
      sleeper: "sleeper_berth",
      driving: "driving",
      on_duty: "on_duty_not_driving",
      yard_moves: "yard_moves",
      personal_conveyance: "personal_conveyance",
    };
    return statusMap[status] || status;
  }

  mapToInternal(externalData: unknown, dataType: string): MappedRecord[] {
    const records: MappedRecord[] = [];
    
    if (dataType === "drivers" && Array.isArray(externalData)) {
      for (const driver of externalData as MotiveDriver[]) {
        records.push({
          externalId: driver.id,
          externalType: "driver",
          externalData: driver as unknown as Record<string, unknown>,
          internalTable: "drivers",
          internalData: {
            firstName: driver.first_name,
            lastName: driver.last_name,
            email: driver.email,
            status: driver.status,
          },
        });
      }
    }
    
    return records;
  }
}

export default MotiveELDService;
