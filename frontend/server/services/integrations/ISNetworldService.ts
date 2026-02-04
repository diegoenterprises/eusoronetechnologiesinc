/**
 * ISNETWORLD INTEGRATION SERVICE
 * Contractor safety management and compliance verification
 */

import { BaseIntegrationService, SyncResult, MappedRecord } from "./BaseIntegrationService";
import { getDb } from "../../db";
import { 
  documents,
  certifications,
  integrationConnections
} from "../../../drizzle/schema";
import { eq, and } from "drizzle-orm";

interface ISNComplianceRecord {
  id: string;
  contractorId: string;
  requirementId: string;
  requirementName: string;
  status: "compliant" | "non_compliant" | "pending" | "expired";
  expirationDate?: string;
  lastVerifiedDate: string;
  documents: Array<{
    id: string;
    name: string;
    url: string;
    uploadedAt: string;
  }>;
  grade?: string;
  score?: number;
}

interface ISNSafetyRecord {
  id: string;
  contractorId: string;
  recordType: "osha_300" | "emr" | "trir" | "dart" | "fatality";
  year: number;
  value: number;
  verifiedAt: string;
  documents: string[];
}

interface ISNEmployee {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  certifications: Array<{
    id: string;
    name: string;
    issueDate: string;
    expirationDate: string;
    status: string;
  }>;
  drugTests: Array<{
    id: string;
    testType: string;
    testDate: string;
    result: string;
    labName: string;
  }>;
  trainings: Array<{
    id: string;
    courseName: string;
    completedDate: string;
    expirationDate?: string;
    provider: string;
  }>;
}

export class ISNetworldService extends BaseIntegrationService {
  constructor() {
    super("isnetworld", "https://api.isnetworld.com/v2");
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest("/contractor/profile");
      return true;
    } catch (error) {
      console.error("[ISNetworld] Connection test failed:", error);
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

    const typesToSync = dataTypes || ["compliance", "safety", "employees"];

    try {
      if (typesToSync.includes("compliance")) {
        const complianceResult = await this.syncComplianceRecords();
        result.recordsFetched += complianceResult.fetched;
        result.recordsCreated += complianceResult.created;
        result.recordsUpdated += complianceResult.updated;
        result.recordsFailed += complianceResult.failed;
      }

      if (typesToSync.includes("safety")) {
        const safetyResult = await this.syncSafetyRecords();
        result.recordsFetched += safetyResult.fetched;
        result.recordsCreated += safetyResult.created;
        result.recordsUpdated += safetyResult.updated;
        result.recordsFailed += safetyResult.failed;
      }

      if (typesToSync.includes("employees")) {
        const employeeResult = await this.syncEmployeeRecords();
        result.recordsFetched += employeeResult.fetched;
        result.recordsCreated += employeeResult.created;
        result.recordsUpdated += employeeResult.updated;
        result.recordsFailed += employeeResult.failed;
      }
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : "Unknown error");
    }

    return result;
  }

  private async syncComplianceRecords(): Promise<{ fetched: number; created: number; updated: number; failed: number }> {
    const stats = { fetched: 0, created: 0, updated: 0, failed: 0 };
    try {
      const response = await this.makeRequest<{ requirements: ISNComplianceRecord[] }>("/contractor/requirements");
      stats.fetched = response.requirements.length;
      // TODO: Store in database when schema is updated
      console.log(`[ISNetworld] Fetched ${stats.fetched} compliance records`);
      stats.created = stats.fetched;
    } catch (error) {
      console.error("[ISNetworld] Failed to fetch compliance records:", error);
      throw error;
    }
    return stats;
  }

  private async syncSafetyRecords(): Promise<{ fetched: number; created: number; updated: number; failed: number }> {
    const stats = { fetched: 0, created: 0, updated: 0, failed: 0 };
    try {
      const response = await this.makeRequest<{ safetyRecords: ISNSafetyRecord[] }>("/contractor/safety-records");
      stats.fetched = response.safetyRecords.length;
      // TODO: Store in database when schema is updated
      console.log(`[ISNetworld] Fetched ${stats.fetched} safety records`);
      stats.created = stats.fetched;
    } catch (error) {
      console.error("[ISNetworld] Failed to fetch safety records:", error);
      throw error;
    }
    return stats;
  }

  private async syncEmployeeRecords(): Promise<{ fetched: number; created: number; updated: number; failed: number }> {
    const stats = { fetched: 0, created: 0, updated: 0, failed: 0 };
    try {
      const response = await this.makeRequest<{ employees: ISNEmployee[] }>("/contractor/employees");
      stats.fetched = response.employees.length;
      // TODO: Store in database when schema is updated
      console.log(`[ISNetworld] Fetched ${stats.fetched} employee records`);
      stats.created = stats.fetched;
    } catch (error) {
      console.error("[ISNetworld] Failed to fetch employee records:", error);
      throw error;
    }
    return stats;
  }

  private mapComplianceStatus(status: string): string {
    const statusMap: Record<string, string> = {
      compliant: "compliant",
      non_compliant: "non_compliant",
      pending: "pending_review",
      expired: "expired",
    };
    return statusMap[status] || "unknown";
  }

  mapToInternal(externalData: unknown, dataType: string): MappedRecord[] {
    const records: MappedRecord[] = [];
    
    if (dataType === "compliance" && Array.isArray(externalData)) {
      for (const record of externalData as ISNComplianceRecord[]) {
        records.push({
          externalId: record.id,
          externalType: "compliance_record",
          externalData: record as unknown as Record<string, unknown>,
          internalTable: "compliance_records",
          internalData: {
            requirementType: record.requirementName,
            status: this.mapComplianceStatus(record.status),
            expirationDate: record.expirationDate,
            grade: record.grade,
            score: record.score,
          },
        });
      }
    }
    
    return records;
  }
}

export default ISNetworldService;
