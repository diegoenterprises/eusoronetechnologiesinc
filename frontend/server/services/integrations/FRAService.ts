/**
 * FRA (FEDERAL RAILROAD ADMINISTRATION) INTEGRATION SERVICE
 * Free government API for railroad safety data — accident reports,
 * inspection data, highway-rail crossing safety, and compliance metrics.
 *
 * Auth: None required (free public API)
 * Base: https://safetydata.fra.dot.gov/MasterWebService/PublicApi
 * Docs: https://safetydata.fra.dot.gov/OfficeofSafety/publicsite/
 */

import { logger } from "../../_core/logger";

// ── Types ────────────────────────────────────────────────────────────

export interface FRAAccidentReport {
  reportId: string;
  incidentDate: string;
  railroad: string;
  railroadCode: string;
  state: string;
  county: string;
  city: string;
  incidentType: string;
  description: string;
  fatalities: number;
  injuries: number;
  totalDamage: number;
  speed: number;
  temperature: number;
  visibility: string;
  weatherCondition: string;
  trackType: string;
  trackClass: number;
  hazmatReleased: boolean;
  hazmatCars: number;
}

export interface AccidentSearchFilters {
  state?: string;
  railroad?: string;
  year?: number;
  startDate?: string;
  endDate?: string;
}

export interface FRAViolation {
  violationCode: string;
  description: string;
  severity: "MINOR" | "MODERATE" | "SERIOUS" | "CRITICAL";
  regulation: string;
  penalty: number;
  dateFound: string;
  corrected: boolean;
  correctionDate: string | null;
}

export interface FRAInspectionResult {
  inspectionId: string;
  railroadCode: string;
  railroadName: string;
  inspectionDate: string;
  inspectionType: string;
  state: string;
  district: string;
  inspector: string;
  defectsFound: number;
  violations: FRAViolation[];
  overallResult: "PASS" | "CONDITIONAL" | "FAIL";
}

export interface FRACrossingData {
  crossingId: string;
  railroad: string;
  street: string;
  city: string;
  state: string;
  county: string;
  latitude: number;
  longitude: number;
  crossingType: "PUBLIC" | "PRIVATE";
  warningDevices: string[];
  gates: boolean;
  signals: boolean;
  totalTrains: number;
  totalVehicles: number;
  maxTrainSpeed: number;
  totalTracks: number;
  accidentHistory: { year: number; count: number; fatalities: number; injuries: number }[];
  quietZone: boolean;
}

export interface FRASafetyCompliance {
  railroadCode: string;
  railroadName: string;
  reportingYear: number;
  totalInspections: number;
  totalViolations: number;
  violationsByCategory: { category: string; count: number; trend: "UP" | "DOWN" | "STABLE" }[];
  complianceRate: number;
  accidentRate: number;
  fatalityRate: number;
  penaltiesAssessed: number;
  penaltiesPaid: number;
  enforcementActions: number;
  overallRating: "SATISFACTORY" | "CONDITIONAL" | "UNSATISFACTORY";
}

// ── Endpoint catalog ─────────────────────────────────────────────────

export const FRA_ENDPOINTS = {
  ACCIDENT_REPORTS:      "/accidents",
  INSPECTIONS:           "/inspections/{RAILROAD_CODE}",
  CROSSING_DATA:         "/crossings/{CROSSING_ID}",
  SAFETY_COMPLIANCE:     "/compliance/{RAILROAD_CODE}",
} as const;

// ── Service ──────────────────────────────────────────────────────────

const FRA_BASE_URL = "https://safetydata.fra.dot.gov/MasterWebService/PublicApi";

export class FRAService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = FRA_BASE_URL;
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
    const qs = Object.keys(params).length > 0 ? `?${new URLSearchParams(params).toString()}` : "";
    const url = `${this.baseUrl}${endpoint}${qs}`;

    try {
      const resp = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(20_000),
      });

      if (!resp.ok) {
        const body = await resp.text().catch(() => "");
        logger.error(`[FRA] API error ${resp.status}: ${body}`);
        return null;
      }

      return (await resp.json()) as T;
    } catch (err: any) {
      logger.error(`[FRA] Request failed: ${err.message}`);
      return null;
    }
  }

  private ep(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [k, v] of Object.entries(vars)) result = result.replace(`{${k}}`, encodeURIComponent(v));
    return result;
  }

  // ── Public methods ─────────────────────────────────────────────────

  async getAccidentReports(filters: AccidentSearchFilters): Promise<FRAAccidentReport[] | null> {
    logger.info(`[FRA] Fetching accident reports with filters: ${JSON.stringify(filters)}`);
    const params: Record<string, string> = {};
    if (filters.state) params.state = filters.state;
    if (filters.railroad) params.railroad = filters.railroad;
    if (filters.year) params.year = String(filters.year);
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;

    return this.request<FRAAccidentReport[]>(FRA_ENDPOINTS.ACCIDENT_REPORTS, params);
  }

  async getInspectionData(railroadCode: string): Promise<FRAInspectionResult[] | null> {
    logger.info(`[FRA] Fetching inspection data for railroad ${railroadCode}`);
    return this.request<FRAInspectionResult[]>(
      this.ep(FRA_ENDPOINTS.INSPECTIONS, { RAILROAD_CODE: railroadCode })
    );
  }

  async getCrossingData(crossingId: string): Promise<FRACrossingData | null> {
    logger.info(`[FRA] Fetching crossing data for ${crossingId}`);
    return this.request<FRACrossingData>(
      this.ep(FRA_ENDPOINTS.CROSSING_DATA, { CROSSING_ID: crossingId })
    );
  }

  async getSafetyCompliance(railroadCode: string): Promise<FRASafetyCompliance | null> {
    logger.info(`[FRA] Fetching safety compliance for railroad ${railroadCode}`);
    return this.request<FRASafetyCompliance>(
      this.ep(FRA_ENDPOINTS.SAFETY_COMPLIANCE, { RAILROAD_CODE: railroadCode })
    );
  }
}

export const fraService = new FRAService();
