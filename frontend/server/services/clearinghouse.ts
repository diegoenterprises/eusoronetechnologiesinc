/**
 * FMCSA DRUG & ALCOHOL CLEARINGHOUSE INTEGRATION
 * 
 * Provides integration with the FMCSA Drug & Alcohol Clearinghouse
 * for pre-employment and annual queries on CDL drivers.
 * 
 * API Documentation: https://clearinghouse.fmcsa.dot.gov/api
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type QueryType = "pre_employment" | "annual" | "reasonable_suspicion" | "post_accident" | "return_to_duty" | "follow_up";
export type QueryStatus = "pending" | "completed" | "expired" | "cancelled";
export type ViolationStatus = "none" | "violation_found" | "query_error";

export interface ClearinghouseQuery {
  queryId: string;
  driverId: string;
  driverName: string;
  driverCDL: string;
  cdlState: string;
  queryType: QueryType;
  status: QueryStatus;
  requestedAt: string;
  completedAt: string | null;
  expiresAt: string;
  result: ClearinghouseResult | null;
  requestedBy: string;
  consentOnFile: boolean;
  consentDate: string | null;
}

export interface ClearinghouseResult {
  violationStatus: ViolationStatus;
  queryDate: string;
  violations: ClearinghouseViolation[];
  returnToDutyStatus: ReturnToDutyStatus | null;
}

export interface ClearinghouseViolation {
  id: string;
  violationType: string;
  violationDate: string;
  substanceType: "alcohol" | "drug" | "both";
  drugType?: string;
  testType: string;
  reportingEmployer: string;
  reportingEmployerDOT: string;
  status: "open" | "resolved";
}

export interface ReturnToDutyStatus {
  sapName: string;
  sapPhone: string;
  evaluationDate: string;
  returnToDutyTestCompleted: boolean;
  returnToDutyTestDate: string | null;
  followUpPlanRequired: boolean;
  followUpTestsRemaining: number;
}

export interface DriverConsent {
  driverId: string;
  consentType: "limited" | "general";
  grantedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  isActive: boolean;
}

export interface QueryStats {
  totalQueries: number;
  preEmployment: number;
  annual: number;
  pendingQueries: number;
  violationsFound: number;
  complianceRate: number;
}

// ============================================================================
// CLEARINGHOUSE SERVICE
// ============================================================================

class ClearinghouseService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.CLEARINGHOUSE_API_KEY || "";
    this.baseUrl = "https://clearinghouse.fmcsa.dot.gov/api/v1";
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Submit a pre-employment query
   */
  async submitPreEmploymentQuery(
    driverId: string,
    driverInfo: {
      firstName: string;
      lastName: string;
      cdlNumber: string;
      cdlState: string;
      dateOfBirth: string;
    },
    requestedBy: string
  ): Promise<ClearinghouseQuery | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/queries`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          queryType: "pre_employment",
          driver: driverInfo,
        }),
      });

      if (!response.ok) {
        console.error(`[Clearinghouse] API error: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("[Clearinghouse] submitPreEmploymentQuery error:", error);
      return null;
    }
  }

  /**
   * Submit an annual query
   */
  async submitAnnualQuery(
    driverId: string,
    driverInfo: {
      firstName: string;
      lastName: string;
      cdlNumber: string;
      cdlState: string;
      dateOfBirth: string;
    },
    requestedBy: string
  ): Promise<ClearinghouseQuery | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/queries`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          queryType: "annual",
          driver: driverInfo,
        }),
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("[Clearinghouse] submitAnnualQuery error:", error);
      return null;
    }
  }

  /**
   * Get query status and results
   */
  async getQueryStatus(queryId: string): Promise<ClearinghouseQuery | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/queries/${queryId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("[Clearinghouse] getQueryStatus error:", error);
      return null;
    }
  }

  /**
   * Get all queries for a company
   */
  async getCompanyQueries(
    companyId: string,
    filters?: {
      status?: QueryStatus;
      queryType?: QueryType;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ClearinghouseQuery[]> {
    if (!this.isConfigured()) {
      return [];
    }

    // Would call actual API
    return [];
  }

  /**
   * Get driver's query history
   */
  async getDriverQueryHistory(driverId: string): Promise<ClearinghouseQuery[]> {
    if (!this.isConfigured()) {
      return [];
    }

    // Would call actual API
    return [];
  }

  /**
   * Check if driver has valid annual query
   */
  async hasValidAnnualQuery(driverId: string): Promise<boolean> {
    const queries = await this.getDriverQueryHistory(driverId);
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    return queries.some(
      (q) =>
        q.queryType === "annual" &&
        q.status === "completed" &&
        q.result?.violationStatus === "none" &&
        new Date(q.completedAt!) > oneYearAgo
    );
  }

  /**
   * Record driver consent
   */
  async recordConsent(
    driverId: string,
    consentType: "limited" | "general",
    expiresAt: string
  ): Promise<DriverConsent> {
    const consent: DriverConsent = {
      driverId,
      consentType,
      grantedAt: new Date().toISOString(),
      expiresAt,
      revokedAt: null,
      isActive: true,
    };

    // In production, would store in database
    return consent;
  }

  /**
   * Revoke driver consent
   */
  async revokeConsent(driverId: string): Promise<boolean> {
    // In production, would update database
    return true;
  }

  /**
   * Get query statistics
   */
  async getQueryStats(companyId: string): Promise<QueryStats> {
    const queries = await this.getCompanyQueries(companyId);

    const preEmployment = queries.filter((q) => q.queryType === "pre_employment").length;
    const annual = queries.filter((q) => q.queryType === "annual").length;
    const pending = queries.filter((q) => q.status === "pending").length;
    const violations = queries.filter(
      (q) => q.result?.violationStatus === "violation_found"
    ).length;

    return {
      totalQueries: queries.length,
      preEmployment,
      annual,
      pendingQueries: pending,
      violationsFound: violations,
      complianceRate:
        queries.length > 0
          ? Math.round(((queries.length - violations) / queries.length) * 100)
          : 100,
    };
  }

  /**
   * Check if annual queries are due for drivers
   */
  async getDriversNeedingAnnualQuery(companyDriverIds: string[]): Promise<string[]> {
    const driversDue: string[] = [];

    for (const driverId of companyDriverIds) {
      const hasValid = await this.hasValidAnnualQuery(driverId);
      if (!hasValid) {
        driversDue.push(driverId);
      }
    }

    return driversDue;
  }

}

// Export singleton instance
export const clearinghouseService = new ClearinghouseService();
