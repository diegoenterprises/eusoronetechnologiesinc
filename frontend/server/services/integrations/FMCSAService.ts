/**
 * FMCSA SAFERSYS INTEGRATION SERVICE
 * QCMobile API — Carrier safety ratings, BASICs scores, inspection data,
 * cargo classification, and operating authority verification.
 *
 * Auth: WebKey as query parameter `?webKey=YOUR_KEY`
 * Base: https://mobile.fmcsa.dot.gov/qc/services/
 * Portal: https://mobile.fmcsa.dot.gov/QCDevsite/
 * Docs: https://mobile.fmcsa.dot.gov/QCDevsite/docs/qcApi
 * Env: FMCSA_WEBSERVICE_KEY
 */

import BaseIntegrationService, { SyncResult, MappedRecord } from "./BaseIntegrationService";

// ── Types ────────────────────────────────────────────────────────────
export interface FMCSACarrier {
  dotNumber: number;
  legalName: string;
  dbaName: string;
  carrierOperation: string;
  hmFlag: string;
  pcFlag: string;
  phyStreet: string;
  phyCity: string;
  phyState: string;
  phyZipcode: string;
  phone: string;
  mailingStreet: string;
  mailingCity: string;
  mailingState: string;
  mailingZipcode: string;
  allowedToOperate: string;
  bipdInsuranceRequired: string;
  bipdInsuranceOnFile: string;
  bondInsuranceOnFile: string;
  cargoInsuranceRequired: string;
  cargoInsuranceOnFile: string;
  totalDrivers: number;
  totalPowerUnits: number;
  statusCode: string;
  oosDate?: string;
  oosReason?: string;
  mcNumber?: string;
  mcsNumber?: number;
}

export interface FMCSABasicMeasure {
  basicName: string;
  basicMeasure: number;
  basicThreshold: number;
  basicExceedFlag: string;
  totalInspections: number;
  totalViolations: number;
  percentile: number;
}

export interface FMCSABasicsReport {
  dotNumber: number;
  carrierName: string;
  unsafeDriving?: FMCSABasicMeasure;
  hoursOfService?: FMCSABasicMeasure;
  driverFitness?: FMCSABasicMeasure;
  controlledSubstances?: FMCSABasicMeasure;
  vehicleMaintenance?: FMCSABasicMeasure;
  hazmatCompliance?: FMCSABasicMeasure;
  crashIndicator?: FMCSABasicMeasure;
}

export interface FMCSAInspection {
  inspectionId: string;
  dotNumber: number;
  inspectionDate: string;
  state: string;
  level: number;
  vehicleType: string;
  timeWeight: number;
  driverOOS: boolean;
  vehicleOOS: boolean;
  hazmatOOS: boolean;
  violations: FMCSAViolation[];
}

export interface FMCSAViolation {
  code: string;
  description: string;
  severity: number;
  oos: boolean;
  basic: string;
  unit: string;
}

export interface FMCSACargo {
  cargoClassId: number;
  cargoClassDesc: string;
}

export interface FMCSAOperationClassification {
  operationClassId: number;
  operationClassDesc: string;
}

export interface FMCSAAuthority {
  authorityType: string;
  authorityStatus: string;
  commonAuthorityStatus: string;
  contractAuthorityStatus: string;
  brokerAuthorityStatus: string;
  commonAuthorityPendingStatus?: string;
}

// ── Endpoint catalog ─────────────────────────────────────────────────
export const FMCSA_ENDPOINTS = {
  // Carrier lookup
  CARRIER_BY_DOT:        "/carriers/{DOT}",
  CARRIER_BY_NAME:       "/carriers/name/{NAME}",
  CARRIER_BY_DOCKET:     "/carriers/docket-number/{MC}",
  // BASICs Safety Scores
  CARRIER_BASICS:        "/carriers/{DOT}/basics",
  // Inspections
  CARRIER_INSPECTIONS:   "/carriers/{DOT}/inspections",
  INSPECTION_DETAIL:     "/carriers/{DOT}/inspection/{INSP_ID}",
  // Cargo & Operations
  CARRIER_CARGO:         "/carriers/{DOT}/cargo-carried",
  CARRIER_OPERATIONS:    "/carriers/{DOT}/operation-classification",
  // Operating Authority
  CARRIER_AUTHORITY:     "/carriers/{DOT}/authority",
  // OOS (Out of Service)
  CARRIER_OOS:           "/carriers/{DOT}/oos",
  // Crashes (limited)
  CARRIER_CRASHES:       "/carriers/{DOT}/crashes",
} as const;

// ── Service ──────────────────────────────────────────────────────────
export class FMCSAService extends BaseIntegrationService {
  constructor() {
    super("fmcsa", "https://mobile.fmcsa.dot.gov/qc/services");
  }

  /** Get the WebKey for FMCSA API auth */
  private getWebKey(): string {
    const key = this.credentials.apiKey || process.env.FMCSA_WEBSERVICE_KEY || process.env.FMCSA_API_KEY;
    if (!key) throw new Error("FMCSA WebKey not configured (set FMCSA_WEBSERVICE_KEY)");
    return key;
  }

  /** Make authenticated FMCSA API request */
  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const webKey = this.getWebKey();
    params.webKey = webKey;
    const qs = new URLSearchParams(params).toString();
    const url = `${this.apiBaseUrl}${endpoint}?${qs}`;

    const resp = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });

    if (!resp.ok) throw new Error(`FMCSA API ${resp.status}: ${await resp.text().catch(() => "")}`);
    const data = await resp.json();
    // FMCSA wraps results in a content property
    return (data?.content || data) as T;
  }

  private ep(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [k, v] of Object.entries(vars)) result = result.replace(`{${k}}`, encodeURIComponent(v));
    return result;
  }

  // ── Public data methods ────────────────────────────────────────────

  async lookupByDOT(dotNumber: string): Promise<FMCSACarrier> {
    const data = await this.request<any>(this.ep(FMCSA_ENDPOINTS.CARRIER_BY_DOT, { DOT: dotNumber }));
    return data?.carrier || data;
  }

  async lookupByName(name: string): Promise<FMCSACarrier[]> {
    const data = await this.request<any>(this.ep(FMCSA_ENDPOINTS.CARRIER_BY_NAME, { NAME: name }));
    const carriers = data?.carriers || data;
    return Array.isArray(carriers) ? carriers.slice(0, 50) : [];
  }

  async lookupByMC(mcNumber: string): Promise<FMCSACarrier> {
    const data = await this.request<any>(this.ep(FMCSA_ENDPOINTS.CARRIER_BY_DOCKET, { MC: mcNumber }));
    return data?.carrier || data;
  }

  async getBasics(dotNumber: string): Promise<FMCSABasicsReport> {
    const data = await this.request<any>(this.ep(FMCSA_ENDPOINTS.CARRIER_BASICS, { DOT: dotNumber }));
    const basics = data?.basics || data;
    const report: FMCSABasicsReport = { dotNumber: parseInt(dotNumber), carrierName: "" };
    if (Array.isArray(basics)) {
      for (const b of basics) {
        const measure: FMCSABasicMeasure = {
          basicName: b.basicsType || b.basicName || "",
          basicMeasure: b.basicMeasure || 0,
          basicThreshold: b.basicThreshold || 0,
          basicExceedFlag: b.basicsExceedFlag || "N",
          totalInspections: b.totalInspections || 0,
          totalViolations: b.totalViolations || 0,
          percentile: b.percentile || 0,
        };
        const name = measure.basicName.toLowerCase().replace(/[\s/]+/g, "_");
        if (name.includes("unsafe_driving")) report.unsafeDriving = measure;
        else if (name.includes("hours") || name.includes("fatigue")) report.hoursOfService = measure;
        else if (name.includes("driver_fitness")) report.driverFitness = measure;
        else if (name.includes("controlled") || name.includes("alcohol")) report.controlledSubstances = measure;
        else if (name.includes("vehicle_maint")) report.vehicleMaintenance = measure;
        else if (name.includes("hazmat")) report.hazmatCompliance = measure;
        else if (name.includes("crash")) report.crashIndicator = measure;
      }
    }
    return report;
  }

  async getCargoCarried(dotNumber: string): Promise<FMCSACargo[]> {
    const data = await this.request<any>(this.ep(FMCSA_ENDPOINTS.CARRIER_CARGO, { DOT: dotNumber }));
    return data?.cargoCarried || data || [];
  }

  async getOperationClassification(dotNumber: string): Promise<FMCSAOperationClassification[]> {
    const data = await this.request<any>(this.ep(FMCSA_ENDPOINTS.CARRIER_OPERATIONS, { DOT: dotNumber }));
    return data?.operationClassification || data || [];
  }

  async getAuthority(dotNumber: string): Promise<FMCSAAuthority> {
    const data = await this.request<any>(this.ep(FMCSA_ENDPOINTS.CARRIER_AUTHORITY, { DOT: dotNumber }));
    return data?.authority || data || {};
  }

  async getCrashes(dotNumber: string): Promise<any[]> {
    const data = await this.request<any>(this.ep(FMCSA_ENDPOINTS.CARRIER_CRASHES, { DOT: dotNumber }));
    return data?.crashes || data || [];
  }

  /** Comprehensive safety profile — combines carrier, BASICs, cargo, authority */
  async getFullSafetyProfile(dotNumber: string): Promise<{
    carrier: FMCSACarrier;
    basics: FMCSABasicsReport;
    cargo: FMCSACargo[];
    authority: FMCSAAuthority;
    safetyScore: number;
    riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  }> {
    const [carrier, basics, cargo, authority] = await Promise.all([
      this.lookupByDOT(dotNumber),
      this.getBasics(dotNumber),
      this.getCargoCarried(dotNumber),
      this.getAuthority(dotNumber),
    ]);

    // Calculate composite safety score (0-100, higher = safer)
    let score = 100;
    const measures = [basics.unsafeDriving, basics.hoursOfService, basics.driverFitness, basics.controlledSubstances, basics.vehicleMaintenance];
    for (const m of measures) {
      if (m && m.basicExceedFlag === "Y") score -= 15;
      else if (m && m.percentile > 75) score -= 8;
      else if (m && m.percentile > 50) score -= 3;
    }
    score = Math.max(0, Math.min(100, score));

    const riskLevel = score >= 80 ? "LOW" : score >= 60 ? "MODERATE" : score >= 40 ? "HIGH" : "CRITICAL";

    return { carrier, basics, cargo, authority, safetyScore: score, riskLevel };
  }

  // ── BaseIntegrationService abstract implementations ────────────────

  async testConnection(): Promise<boolean> {
    try {
      // Test with a known carrier (Greyhound DOT# 1)
      await this.lookupByName("greyhound");
      return true;
    } catch { return false; }
  }

  async fetchData(dataTypes?: string[]): Promise<SyncResult> {
    const result: SyncResult = { success: true, recordsFetched: 0, recordsCreated: 0, recordsUpdated: 0, recordsFailed: 0, errors: [] };
    try {
      const carriers = await this.lookupByName("enterprise");
      result.recordsFetched = carriers.length;
    } catch (e: any) { result.errors.push(e.message); result.success = false; }
    return result;
  }

  mapToInternal(externalData: unknown, dataType: string): MappedRecord[] {
    const records = Array.isArray(externalData) ? externalData : [externalData];
    return records.map(r => ({
      externalId: String(r.dotNumber || r.mcNumber || ""),
      externalType: `fmcsa_${dataType}`,
      externalData: r,
      internalTable: `fmcsa_${dataType}`,
      internalData: r,
    }));
  }
}

export const fmcsaService = new FMCSAService();
