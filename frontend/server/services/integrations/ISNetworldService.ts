/**
 * ISNETWORLD INTEGRATION SERVICE
 * Contractor safety management and compliance verification
 */

import { BaseIntegrationService, SyncResult, MappedRecord } from "./BaseIntegrationService";
import { getDb } from "../../db";
import { 
  complianceRecords, 
  safetyRecords, 
  documents,
  driverCertifications,
  drugAlcoholTests,
  trainingRecords,
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

      const db = await getDb(); if (!db) return;
      const [connection] = await db.select().from(integrationConnections)
        .where(eq(integrationConnections.id, this.connectionId!));
      const companyId = connection.companyId;

      for (const record of response.requirements) {
        try {
          const [existing] = await db.select().from(complianceRecords)
            .where(and(
              eq(complianceRecords.companyId, companyId),
              eq(complianceRecords.externalId, record.id)
            ));

          const mappedData = {
            companyId,
            externalId: record.id,
            requirementType: record.requirementName,
            status: this.mapComplianceStatus(record.status),
            expirationDate: record.expirationDate ? new Date(record.expirationDate) : null,
            lastVerifiedAt: new Date(record.lastVerifiedDate),
            grade: record.grade,
            score: record.score,
            source: "isnetworld",
            syncedFromIntegration: this.connectionId,
          };

          if (existing) {
            await db.update(complianceRecords)
              .set(mappedData)
              .where(eq(complianceRecords.id, existing.id));
            stats.updated++;
          } else {
            await db.insert(complianceRecords).values(mappedData as any);
            stats.created++;
          }

          // Sync associated documents
          for (const doc of record.documents) {
            await this.syncDocument(doc, companyId, "compliance_record", record.id);
          }
        } catch (error) {
          console.error(`[ISNetworld] Failed to sync compliance record ${record.id}:`, error);
          stats.failed++;
        }
      }
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

      const db = await getDb(); if (!db) return;
      const [connection] = await db.select().from(integrationConnections)
        .where(eq(integrationConnections.id, this.connectionId!));
      const companyId = connection.companyId;

      for (const record of response.safetyRecords) {
        try {
          const [existing] = await db.select().from(safetyRecords)
            .where(and(
              eq(safetyRecords.companyId, companyId),
              eq(safetyRecords.externalId, record.id)
            ));

          const mappedData = {
            companyId,
            externalId: record.id,
            recordType: record.recordType,
            year: record.year,
            value: String(record.value),
            verifiedAt: new Date(record.verifiedAt),
            source: "isnetworld",
            syncedFromIntegration: this.connectionId,
          };

          if (existing) {
            await db.update(safetyRecords)
              .set(mappedData)
              .where(eq(safetyRecords.id, existing.id));
            stats.updated++;
          } else {
            await db.insert(safetyRecords).values(mappedData as any);
            stats.created++;
          }
        } catch (error) {
          console.error(`[ISNetworld] Failed to sync safety record ${record.id}:`, error);
          stats.failed++;
        }
      }
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

      const db = await getDb(); if (!db) return;
      const [connection] = await db.select().from(integrationConnections)
        .where(eq(integrationConnections.id, this.connectionId!));
      const companyId = connection.companyId;

      for (const employee of response.employees) {
        try {
          // Sync certifications
          for (const cert of employee.certifications) {
            await this.syncCertification(cert, companyId, employee.id);
          }

          // Sync drug tests
          for (const test of employee.drugTests) {
            await this.syncDrugTest(test, companyId, employee.id);
          }

          // Sync trainings
          for (const training of employee.trainings) {
            await this.syncTraining(training, companyId, employee.id);
          }

          stats.updated++;
        } catch (error) {
          console.error(`[ISNetworld] Failed to sync employee ${employee.id}:`, error);
          stats.failed++;
        }
      }
    } catch (error) {
      console.error("[ISNetworld] Failed to fetch employee records:", error);
      throw error;
    }

    return stats;
  }

  private async syncDocument(
    doc: { id: string; name: string; url: string; uploadedAt: string },
    companyId: number,
    relatedType: string,
    relatedId: string
  ): Promise<void> {
    const db = await getDb(); if (!db) return;
    
    const [existing] = await db.select().from(documents)
      .where(and(
        eq(documents.companyId, companyId),
        eq(documents.externalId, doc.id)
      ));

    const mappedData = {
      companyId,
      externalId: doc.id,
      name: doc.name,
      fileUrl: doc.url,
      uploadedAt: new Date(doc.uploadedAt),
      relatedType,
      relatedId,
      source: "isnetworld",
      syncedFromIntegration: this.connectionId,
    };

    if (existing) {
      await db.update(documents)
        .set(mappedData)
        .where(eq(documents.id, existing.id));
    } else {
      await db.insert(documents).values(mappedData as any);
    }
  }

  private async syncCertification(
    cert: { id: string; name: string; issueDate: string; expirationDate: string; status: string },
    companyId: number,
    employeeExternalId: string
  ): Promise<void> {
    const db = await getDb(); if (!db) return;
    
    const [existing] = await db.select().from(driverCertifications)
      .where(eq(driverCertifications.externalId, cert.id));

    const mappedData = {
      companyId,
      externalId: cert.id,
      externalEmployeeId: employeeExternalId,
      certificationType: cert.name,
      issueDate: new Date(cert.issueDate),
      expirationDate: new Date(cert.expirationDate),
      status: cert.status,
      source: "isnetworld",
      syncedFromIntegration: this.connectionId,
    };

    if (existing) {
      await db.update(driverCertifications)
        .set(mappedData)
        .where(eq(driverCertifications.id, existing.id));
    } else {
      await db.insert(driverCertifications).values(mappedData as any);
    }
  }

  private async syncDrugTest(
    test: { id: string; testType: string; testDate: string; result: string; labName: string },
    companyId: number,
    employeeExternalId: string
  ): Promise<void> {
    const db = await getDb(); if (!db) return;
    
    const [existing] = await db.select().from(drugAlcoholTests)
      .where(eq(drugAlcoholTests.externalId, test.id));

    const mappedData = {
      companyId,
      externalId: test.id,
      externalEmployeeId: employeeExternalId,
      testType: test.testType,
      testDate: new Date(test.testDate),
      result: test.result,
      labName: test.labName,
      source: "isnetworld",
      syncedFromIntegration: this.connectionId,
    };

    if (existing) {
      await db.update(drugAlcoholTests)
        .set(mappedData)
        .where(eq(drugAlcoholTests.id, existing.id));
    } else {
      await db.insert(drugAlcoholTests).values(mappedData as any);
    }
  }

  private async syncTraining(
    training: { id: string; courseName: string; completedDate: string; expirationDate?: string; provider: string },
    companyId: number,
    employeeExternalId: string
  ): Promise<void> {
    const db = await getDb(); if (!db) return;
    
    const [existing] = await db.select().from(trainingRecords)
      .where(eq(trainingRecords.externalId, training.id));

    const mappedData = {
      companyId,
      externalId: training.id,
      externalEmployeeId: employeeExternalId,
      courseName: training.courseName,
      completedDate: new Date(training.completedDate),
      expirationDate: training.expirationDate ? new Date(training.expirationDate) : null,
      provider: training.provider,
      source: "isnetworld",
      syncedFromIntegration: this.connectionId,
    };

    if (existing) {
      await db.update(trainingRecords)
        .set(mappedData)
        .where(eq(trainingRecords.id, existing.id));
    } else {
      await db.insert(trainingRecords).values(mappedData as any);
    }
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
