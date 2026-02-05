/**
 * CANOPY CONNECT INTEGRATION SERVICE
 * Insurance policy aggregation via Canopy Connect
 */

import { BaseIntegrationService, SyncResult, MappedRecord } from "./BaseIntegrationService";
import { getDb } from "../../db";
import { insurancePolicies, certificatesOfInsurance, insuranceClaims } from "../../../drizzle/schema";
import { eq, and } from "drizzle-orm";

interface CanopyPolicy {
  id: string;
  policyNumber: string;
  policyType: string;
  carrier: {
    name: string;
    naic?: string;
  };
  effectiveDate: string;
  expirationDate: string;
  limits: {
    perOccurrence?: number;
    aggregate?: number;
    combinedSingle?: number;
  };
  deductible?: number;
  premium?: number;
  status: string;
  insuredName: string;
}

interface CanopyCertificate {
  id: string;
  certificateNumber: string;
  holderName: string;
  holderAddress?: string;
  issuedDate: string;
  policies: Array<{
    policyId: string;
    policyType: string;
    limits: Record<string, number>;
  }>;
  additionalInsuredEndorsement: boolean;
  waiverOfSubrogation: boolean;
}

interface CanopyClaim {
  id: string;
  claimNumber: string;
  policyId: string;
  claimType: string;
  status: string;
  incidentDate: string;
  reportedDate: string;
  description: string;
  estimatedLoss?: number;
  paidAmount?: number;
}

export class CanopyConnectService extends BaseIntegrationService {
  constructor() {
    super("canopy_connect", "https://api.usecanopy.com/v1");
  }

  /**
   * Test the connection to Canopy Connect
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest("/me");
      return true;
    } catch (error) {
      console.error("[CanopyConnect] Connection test failed:", error);
      return false;
    }
  }

  /**
   * Fetch data from Canopy Connect
   */
  async fetchData(dataTypes?: string[]): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      recordsFetched: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      errors: [],
    };

    const typesToSync = dataTypes || ["policies", "certificates", "claims"];

    try {
      // Sync policies
      if (typesToSync.includes("policies")) {
        const policyResult = await this.syncPolicies();
        result.recordsFetched += policyResult.fetched;
        result.recordsCreated += policyResult.created;
        result.recordsUpdated += policyResult.updated;
        result.recordsFailed += policyResult.failed;
      }

      // Sync certificates
      if (typesToSync.includes("certificates")) {
        const certResult = await this.syncCertificates();
        result.recordsFetched += certResult.fetched;
        result.recordsCreated += certResult.created;
        result.recordsUpdated += certResult.updated;
        result.recordsFailed += certResult.failed;
      }

      // Sync claims
      if (typesToSync.includes("claims")) {
        const claimsResult = await this.syncClaims();
        result.recordsFetched += claimsResult.fetched;
        result.recordsCreated += claimsResult.created;
        result.recordsUpdated += claimsResult.updated;
        result.recordsFailed += claimsResult.failed;
      }
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : "Unknown error");
    }

    return result;
  }

  /**
   * Sync policies from Canopy Connect
   */
  private async syncPolicies(): Promise<{ fetched: number; created: number; updated: number; failed: number }> {
    const stats = { fetched: 0, created: 0, updated: 0, failed: 0 };
    
    try {
      const response = await this.makeRequest<{ policies: CanopyPolicy[] }>("/policies");
      stats.fetched = response.policies.length;

      for (const policy of response.policies) {
        try {
          const mapped = this.mapPolicyToInternal(policy);
          await this.upsertPolicy(mapped, policy.id);
          
          // Check if this is a new or updated record
          const isNew = !await this.hasExistingRecord(policy.id, "policy");
          if (isNew) {
            stats.created++;
          } else {
            stats.updated++;
          }
        } catch (error) {
          console.error(`[CanopyConnect] Failed to sync policy ${policy.id}:`, error);
          stats.failed++;
        }
      }
    } catch (error) {
      console.error("[CanopyConnect] Failed to fetch policies:", error);
      throw error;
    }

    return stats;
  }

  /**
   * Sync certificates from Canopy Connect
   */
  private async syncCertificates(): Promise<{ fetched: number; created: number; updated: number; failed: number }> {
    const stats = { fetched: 0, created: 0, updated: 0, failed: 0 };
    
    try {
      const response = await this.makeRequest<{ certificates: CanopyCertificate[] }>("/certificates");
      stats.fetched = response.certificates.length;

      for (const cert of response.certificates) {
        try {
          const mapped = this.mapCertificateToInternal(cert);
          await this.upsertCertificate(mapped, cert.id);
          
          const isNew = !await this.hasExistingRecord(cert.id, "certificate");
          if (isNew) {
            stats.created++;
          } else {
            stats.updated++;
          }
        } catch (error) {
          console.error(`[CanopyConnect] Failed to sync certificate ${cert.id}:`, error);
          stats.failed++;
        }
      }
    } catch (error) {
      console.error("[CanopyConnect] Failed to fetch certificates:", error);
      throw error;
    }

    return stats;
  }

  /**
   * Sync claims from Canopy Connect
   */
  private async syncClaims(): Promise<{ fetched: number; created: number; updated: number; failed: number }> {
    const stats = { fetched: 0, created: 0, updated: 0, failed: 0 };
    
    try {
      const response = await this.makeRequest<{ claims: CanopyClaim[] }>("/claims");
      stats.fetched = response.claims.length;

      for (const claim of response.claims) {
        try {
          const mapped = this.mapClaimToInternal(claim);
          await this.upsertClaim(mapped, claim.id);
          
          const isNew = !await this.hasExistingRecord(claim.id, "claim");
          if (isNew) {
            stats.created++;
          } else {
            stats.updated++;
          }
        } catch (error) {
          console.error(`[CanopyConnect] Failed to sync claim ${claim.id}:`, error);
          stats.failed++;
        }
      }
    } catch (error) {
      console.error("[CanopyConnect] Failed to fetch claims:", error);
      throw error;
    }

    return stats;
  }

  /**
   * Map Canopy policy to internal format
   */
  private mapPolicyToInternal(policy: CanopyPolicy): Record<string, unknown> {
    const policyTypeMap: Record<string, string> = {
      "auto_liability": "auto_liability",
      "general_liability": "general_liability",
      "cargo": "cargo",
      "workers_comp": "workers_compensation",
      "umbrella": "umbrella_excess",
      "pollution": "pollution_liability",
    };

    return {
      policyNumber: policy.policyNumber,
      policyType: policyTypeMap[policy.policyType.toLowerCase()] || "other",
      providerName: policy.carrier.name,
      effectiveDate: new Date(policy.effectiveDate),
      expirationDate: new Date(policy.expirationDate),
      perOccurrenceLimit: String(policy.limits.perOccurrence || 0),
      aggregateLimit: String(policy.limits.aggregate || 0),
      combinedSingleLimit: String(policy.limits.combinedSingle || 0),
      deductible: String(policy.deductible || 0),
      annualPremium: String(policy.premium || 0),
      status: policy.status === "active" ? "active" : "expired",
      namedInsureds: [policy.insuredName],
      syncedFromIntegration: this.connectionId,
      externalPolicyId: policy.id,
    };
  }

  /**
   * Map Canopy certificate to internal format
   */
  private mapCertificateToInternal(cert: CanopyCertificate): Record<string, unknown> {
    return {
      certificateNumber: cert.certificateNumber,
      holderName: cert.holderName,
      holderAddress: cert.holderAddress,
      issuedDate: new Date(cert.issuedDate),
      policies: cert.policies,
      additionalInsuredEndorsement: cert.additionalInsuredEndorsement,
      waiverOfSubrogation: cert.waiverOfSubrogation,
      status: "active",
      syncedFromIntegration: this.connectionId,
      externalCertId: cert.id,
    };
  }

  /**
   * Map Canopy claim to internal format
   */
  private mapClaimToInternal(claim: CanopyClaim): Record<string, unknown> {
    const claimTypeMap: Record<string, string> = {
      "cargo_damage": "cargo_damage",
      "cargo_theft": "cargo_theft",
      "bodily_injury": "bodily_injury",
      "property_damage": "property_damage",
      "collision": "collision",
    };

    return {
      claimNumber: claim.claimNumber,
      claimType: claimTypeMap[claim.claimType.toLowerCase()] || "other",
      incidentDate: new Date(claim.incidentDate),
      reportedDate: new Date(claim.reportedDate),
      description: claim.description,
      estimatedLoss: String(claim.estimatedLoss || 0),
      paidAmount: String(claim.paidAmount || 0),
      status: claim.status,
      syncedFromIntegration: this.connectionId,
      externalClaimId: claim.id,
    };
  }

  /**
   * Upsert policy to database
   */
  private async upsertPolicy(data: Record<string, unknown>, externalId: string): Promise<number> {
    const db = await getDb(); if (!db) return 0;
    
    // Get company ID from connection
    const [connection] = await db.select().from(require("../../../drizzle/schema").integrationConnections)
      .where(eq(require("../../../drizzle/schema").integrationConnections.id, this.connectionId!));
    
    const companyId = connection.companyId;
    
    // Check for existing policy
    const [existing] = await db.select().from(insurancePolicies)
      .where(and(
        eq(insurancePolicies.companyId, companyId),
        eq(insurancePolicies.externalPolicyId, externalId)
      ));

    if (existing) {
      await db.update(insurancePolicies)
        .set(data as any)
        .where(eq(insurancePolicies.id, existing.id));
      return existing.id;
    } else {
      const [newPolicy] = await db.insert(insurancePolicies)
        .values({ ...data, companyId } as any)
        .$returningId();
      return newPolicy.id;
    }
  }

  /**
   * Upsert certificate to database
   */
  private async upsertCertificate(data: Record<string, unknown>, externalId: string): Promise<number> {
    const db = await getDb(); if (!db) return 0;
    
    const [connection] = await db.select().from(require("../../../drizzle/schema").integrationConnections)
      .where(eq(require("../../../drizzle/schema").integrationConnections.id, this.connectionId!));
    
    const companyId = connection.companyId;
    
    const [existing] = await db.select().from(certificatesOfInsurance)
      .where(and(
        eq(certificatesOfInsurance.companyId, companyId),
        eq(certificatesOfInsurance.externalCertId, externalId)
      ));

    if (existing) {
      await db.update(certificatesOfInsurance)
        .set(data as any)
        .where(eq(certificatesOfInsurance.id, existing.id));
      return existing.id;
    } else {
      const [newCert] = await db.insert(certificatesOfInsurance)
        .values({ ...data, companyId } as any)
        .$returningId();
      return newCert.id;
    }
  }

  /**
   * Upsert claim to database
   */
  private async upsertClaim(data: Record<string, unknown>, externalId: string): Promise<number> {
    const db = await getDb(); if (!db) return 0;
    
    const [connection] = await db.select().from(require("../../../drizzle/schema").integrationConnections)
      .where(eq(require("../../../drizzle/schema").integrationConnections.id, this.connectionId!));
    
    const companyId = connection.companyId;
    
    const [existing] = await db.select().from(insuranceClaims)
      .where(and(
        eq(insuranceClaims.companyId, companyId),
        eq(insuranceClaims.externalClaimId, externalId)
      ));

    if (existing) {
      await db.update(insuranceClaims)
        .set(data as any)
        .where(eq(insuranceClaims.id, existing.id));
      return existing.id;
    } else {
      const [newClaim] = await db.insert(insuranceClaims)
        .values({ ...data, companyId, policyId: 0, filedBy: connection.userId } as any)
        .$returningId();
      return newClaim.id;
    }
  }

  /**
   * Check if we already have a record for this external ID
   */
  private async hasExistingRecord(externalId: string, type: string): Promise<boolean> {
    const db = await getDb(); if (!db) return false;
    const table = type === "policy" ? insurancePolicies : 
                  type === "certificate" ? certificatesOfInsurance : insuranceClaims;
    const field = type === "policy" ? insurancePolicies.externalPolicyId :
                  type === "certificate" ? certificatesOfInsurance.externalCertId : insuranceClaims.externalClaimId;
    
    const [existing] = await db.select({ id: (table as any).id }).from(table)
      .where(eq(field, externalId));
    
    return !!existing;
  }

  /**
   * Map external data to internal format (required by base class)
   */
  mapToInternal(externalData: unknown, dataType: string): MappedRecord[] {
    const records: MappedRecord[] = [];
    
    if (dataType === "policies" && Array.isArray(externalData)) {
      for (const policy of externalData as CanopyPolicy[]) {
        records.push({
          externalId: policy.id,
          externalType: "policy",
          externalData: policy as unknown as Record<string, unknown>,
          internalTable: "insurance_policies",
          internalData: this.mapPolicyToInternal(policy),
        });
      }
    }
    
    return records;
  }
}

export default CanopyConnectService;
