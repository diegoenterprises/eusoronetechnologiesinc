/**
 * VERIFORCE INTEGRATION SERVICE
 * Contractor management and OQ compliance verification
 */

import { BaseIntegrationService, SyncResult, MappedRecord } from "./BaseIntegrationService";
import { getDb } from "../../db";
import { 
  complianceRecords, 
  driverCertifications,
  drugAlcoholTests,
  trainingRecords,
  integrationConnections
} from "../../../drizzle/schema";
import { eq, and } from "drizzle-orm";

interface VeriforceOQRecord {
  id: string;
  workerId: string;
  workerName: string;
  taskId: string;
  taskName: string;
  coveredTask: string;
  qualificationDate: string;
  requalificationDate?: string;
  status: "qualified" | "not_qualified" | "expired" | "pending";
  evaluatorName?: string;
  method: "written" | "oral" | "performance" | "observation";
}

interface VeriforceDARecord {
  id: string;
  workerId: string;
  workerName: string;
  testType: "pre_employment" | "random" | "post_accident" | "reasonable_suspicion" | "return_to_duty" | "follow_up";
  specimenType: "urine" | "hair" | "oral_fluid" | "breath";
  collectionDate: string;
  resultDate?: string;
  result: "negative" | "positive" | "cancelled" | "pending";
  mroName?: string;
  labName?: string;
}

interface VeriforceTraining {
  id: string;
  workerId: string;
  workerName: string;
  courseId: string;
  courseName: string;
  completionDate: string;
  expirationDate?: string;
  score?: number;
  passingScore?: number;
  certificateUrl?: string;
}

export class VeriforceService extends BaseIntegrationService {
  constructor() {
    super("veriforce", "https://api.veriforce.com/v1");
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest("/account/verify");
      return true;
    } catch (error) {
      console.error("[Veriforce] Connection test failed:", error);
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

    const typesToSync = dataTypes || ["oq_records", "da_records", "trainings"];

    try {
      if (typesToSync.includes("oq_records")) {
        const oqResult = await this.syncOQRecords();
        result.recordsFetched += oqResult.fetched;
        result.recordsCreated += oqResult.created;
        result.recordsUpdated += oqResult.updated;
        result.recordsFailed += oqResult.failed;
      }

      if (typesToSync.includes("da_records")) {
        const daResult = await this.syncDARecords();
        result.recordsFetched += daResult.fetched;
        result.recordsCreated += daResult.created;
        result.recordsUpdated += daResult.updated;
        result.recordsFailed += daResult.failed;
      }

      if (typesToSync.includes("trainings")) {
        const trainingResult = await this.syncTrainingRecords();
        result.recordsFetched += trainingResult.fetched;
        result.recordsCreated += trainingResult.created;
        result.recordsUpdated += trainingResult.updated;
        result.recordsFailed += trainingResult.failed;
      }
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : "Unknown error");
    }

    return result;
  }

  private async syncOQRecords(): Promise<{ fetched: number; created: number; updated: number; failed: number }> {
    const stats = { fetched: 0, created: 0, updated: 0, failed: 0 };

    try {
      const response = await this.makeRequest<{ qualifications: VeriforceOQRecord[] }>("/oq/qualifications");
      stats.fetched = response.qualifications.length;

      const db = await getDb(); if (!db) return;
      const [connection] = await db.select().from(integrationConnections)
        .where(eq(integrationConnections.id, this.connectionId!));
      const companyId = connection.companyId;

      for (const record of response.qualifications) {
        try {
          const [existing] = await db.select().from(driverCertifications)
            .where(eq(driverCertifications.externalId, record.id));

          const mappedData = {
            companyId,
            externalId: record.id,
            externalEmployeeId: record.workerId,
            certificationType: `OQ - ${record.coveredTask}`,
            taskName: record.taskName,
            issueDate: new Date(record.qualificationDate),
            expirationDate: record.requalificationDate ? new Date(record.requalificationDate) : null,
            status: this.mapOQStatus(record.status),
            evaluatorName: record.evaluatorName,
            evaluationMethod: record.method,
            source: "veriforce",
            syncedFromIntegration: this.connectionId,
          };

          if (existing) {
            await db.update(driverCertifications)
              .set(mappedData)
              .where(eq(driverCertifications.id, existing.id));
            stats.updated++;
          } else {
            await db.insert(driverCertifications).values(mappedData as any);
            stats.created++;
          }
        } catch (error) {
          console.error(`[Veriforce] Failed to sync OQ record ${record.id}:`, error);
          stats.failed++;
        }
      }
    } catch (error) {
      console.error("[Veriforce] Failed to fetch OQ records:", error);
      throw error;
    }

    return stats;
  }

  private async syncDARecords(): Promise<{ fetched: number; created: number; updated: number; failed: number }> {
    const stats = { fetched: 0, created: 0, updated: 0, failed: 0 };

    try {
      const response = await this.makeRequest<{ tests: VeriforceDARecord[] }>("/da/tests");
      stats.fetched = response.tests.length;

      const db = await getDb(); if (!db) return;
      const [connection] = await db.select().from(integrationConnections)
        .where(eq(integrationConnections.id, this.connectionId!));
      const companyId = connection.companyId;

      for (const record of response.tests) {
        try {
          const [existing] = await db.select().from(drugAlcoholTests)
            .where(eq(drugAlcoholTests.externalId, record.id));

          const mappedData = {
            companyId,
            externalId: record.id,
            externalEmployeeId: record.workerId,
            testType: this.mapDATestType(record.testType),
            specimenType: record.specimenType,
            collectionDate: new Date(record.collectionDate),
            resultDate: record.resultDate ? new Date(record.resultDate) : null,
            result: record.result,
            mroName: record.mroName,
            labName: record.labName,
            source: "veriforce",
            syncedFromIntegration: this.connectionId,
          };

          if (existing) {
            await db.update(drugAlcoholTests)
              .set(mappedData)
              .where(eq(drugAlcoholTests.id, existing.id));
            stats.updated++;
          } else {
            await db.insert(drugAlcoholTests).values(mappedData as any);
            stats.created++;
          }
        } catch (error) {
          console.error(`[Veriforce] Failed to sync DA record ${record.id}:`, error);
          stats.failed++;
        }
      }
    } catch (error) {
      console.error("[Veriforce] Failed to fetch DA records:", error);
      throw error;
    }

    return stats;
  }

  private async syncTrainingRecords(): Promise<{ fetched: number; created: number; updated: number; failed: number }> {
    const stats = { fetched: 0, created: 0, updated: 0, failed: 0 };

    try {
      const response = await this.makeRequest<{ trainings: VeriforceTraining[] }>("/training/completions");
      stats.fetched = response.trainings.length;

      const db = await getDb(); if (!db) return;
      const [connection] = await db.select().from(integrationConnections)
        .where(eq(integrationConnections.id, this.connectionId!));
      const companyId = connection.companyId;

      for (const record of response.trainings) {
        try {
          const [existing] = await db.select().from(trainingRecords)
            .where(eq(trainingRecords.externalId, record.id));

          const mappedData = {
            companyId,
            externalId: record.id,
            externalEmployeeId: record.workerId,
            courseId: record.courseId,
            courseName: record.courseName,
            completedDate: new Date(record.completionDate),
            expirationDate: record.expirationDate ? new Date(record.expirationDate) : null,
            score: record.score,
            passingScore: record.passingScore,
            certificateUrl: record.certificateUrl,
            provider: "Veriforce",
            source: "veriforce",
            syncedFromIntegration: this.connectionId,
          };

          if (existing) {
            await db.update(trainingRecords)
              .set(mappedData)
              .where(eq(trainingRecords.id, existing.id));
            stats.updated++;
          } else {
            await db.insert(trainingRecords).values(mappedData as any);
            stats.created++;
          }
        } catch (error) {
          console.error(`[Veriforce] Failed to sync training record ${record.id}:`, error);
          stats.failed++;
        }
      }
    } catch (error) {
      console.error("[Veriforce] Failed to fetch training records:", error);
      throw error;
    }

    return stats;
  }

  private mapOQStatus(status: string): string {
    const statusMap: Record<string, string> = {
      qualified: "active",
      not_qualified: "failed",
      expired: "expired",
      pending: "pending",
    };
    return statusMap[status] || "unknown";
  }

  private mapDATestType(testType: string): string {
    const typeMap: Record<string, string> = {
      pre_employment: "pre_employment",
      random: "random",
      post_accident: "post_accident",
      reasonable_suspicion: "reasonable_suspicion",
      return_to_duty: "return_to_duty",
      follow_up: "follow_up",
    };
    return typeMap[testType] || testType;
  }

  mapToInternal(externalData: unknown, dataType: string): MappedRecord[] {
    const records: MappedRecord[] = [];
    
    if (dataType === "oq_records" && Array.isArray(externalData)) {
      for (const record of externalData as VeriforceOQRecord[]) {
        records.push({
          externalId: record.id,
          externalType: "oq_qualification",
          externalData: record as unknown as Record<string, unknown>,
          internalTable: "driver_certifications",
          internalData: {
            certificationType: `OQ - ${record.coveredTask}`,
            issueDate: record.qualificationDate,
            expirationDate: record.requalificationDate,
            status: this.mapOQStatus(record.status),
          },
        });
      }
    }
    
    return records;
  }
}

export default VeriforceService;
