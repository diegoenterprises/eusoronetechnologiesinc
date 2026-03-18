/**
 * DESCARTES ABI CUSTOMS / CBP INTEGRATION
 * Automated Broker Interface for US Customs and Border Protection filings
 *
 * Provides ISF filing, entry summaries, in-bond movements, and hold status
 * API Documentation: https://developer.descartes.com/customs-api
 */

import { logger } from "../../_core/logger";

// Environment configuration
const DESCARTES_API_KEY = process.env.DESCARTES_API_KEY || "";
const DESCARTES_PARTNER_ID = process.env.DESCARTES_PARTNER_ID || "";
const DESCARTES_BASE_URL = "https://api.descartes.com/customs/v2";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ISFFilingRequest {
  importer: string;
  seller: string;
  buyer: string;
  shipTo: string;
  containerStuffing: string;
  consolidator: string;
  htsNumbers: string[];
  manufacturer: string;
  countryOfOrigin: string;
  vessel: string;
  voyageNumber: string;
}

export interface ISFFilingResponse {
  isfNumber: string;
  filingStatus: string;
  cbpResponse: string | null;
  transactionId: string;
  filedAt: string;
  bondType: string | null;
  errors: string[];
}

export interface EntrySummaryRequest {
  entryType: string;
  importerOfRecord: string;
  htsClassifications: {
    htsCode: string;
    description: string;
    quantity: number;
    unit: string;
    declaredValue: number;
    countryOfOrigin: string;
    dutyRate: number;
  }[];
  declaredValue: number;
  dutyRate: number;
  portOfEntry: string;
}

export interface EntrySummaryResponse {
  entryNumber: string;
  status: string;
  dutyAmount: number;
  taxAmount: number;
  feeAmount: number;
  totalAmount: number;
  filedAt: string;
  liquidationDate: string | null;
}

export interface EntryStatus {
  entryNumber: string;
  status: string;
  holds: {
    holdType: string;
    agency: string;
    reason: string | null;
    appliedAt: string;
  }[];
  releaseDate: string | null;
  liquidationDate: string | null;
  dutyOwed: number;
  lastUpdated: string;
}

export interface InBondRequest {
  type: string;
  originPort: string;
  destPort: string;
  carrier: string;
  commodity: string;
  value: number;
}

export interface InBondResponse {
  bondNumber: string;
  status: string;
  approvedAt: string | null;
  expirationDate: string | null;
  originPort: string;
  destPort: string;
}

export interface HoldStatus {
  entryNumber: string;
  holdType: string;
  reason: string;
  examiningAgency: string;
  estimatedRelease: string | null;
  appliedAt: string;
  status: string;
  examLocation: string | null;
  intensifiedExam: boolean;
}

export interface CBPAlert {
  alertId: string;
  alertType: string;
  severity: string;
  description: string;
  entryNumber: string | null;
  importerId: string;
  createdAt: string;
  expiresAt: string | null;
  actionRequired: boolean;
  agency: string;
}

// ============================================================================
// API CLIENT
// ============================================================================

class DescartesABIService {
  private apiKey: string;
  private partnerId: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = DESCARTES_API_KEY;
    this.partnerId = DESCARTES_PARTNER_ID;
    this.baseUrl = DESCARTES_BASE_URL;
  }

  /**
   * Check if the API is configured
   */
  isConfigured(): boolean {
    return this.apiKey.length > 0 && this.partnerId.length > 0;
  }

  /**
   * Build authorization headers
   */
  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      "X-Partner-Id": this.partnerId,
    };
  }

  /**
   * File Importer Security Filing (ISF/10+2)
   */
  async fileISF(isf: ISFFilingRequest): Promise<ISFFilingResponse | null> {
    if (!this.isConfigured()) {
      logger.warn("[DescartesABI] API credentials not configured");
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/isf`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          importer: isf.importer,
          seller: isf.seller,
          buyer: isf.buyer,
          ship_to: isf.shipTo,
          container_stuffing: isf.containerStuffing,
          consolidator: isf.consolidator,
          hts_numbers: isf.htsNumbers,
          manufacturer: isf.manufacturer,
          country_of_origin: isf.countryOfOrigin,
          vessel: isf.vessel,
          voyage_number: isf.voyageNumber,
        }),
      });

      if (!response.ok) {
        logger.error(`[DescartesABI] API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return {
        isfNumber: data.isf_number || data.isfNumber || "",
        filingStatus: data.filing_status || data.status || "Filed",
        cbpResponse: data.cbp_response || null,
        transactionId: data.transaction_id || "",
        filedAt: data.filed_at || new Date().toISOString(),
        bondType: data.bond_type || null,
        errors: data.errors || [],
      };
    } catch (error) {
      logger.error("[DescartesABI] fileISF error:", error);
      return null;
    }
  }

  /**
   * File customs entry summary (CF 7501)
   */
  async fileEntrySummary(entry: EntrySummaryRequest): Promise<EntrySummaryResponse | null> {
    if (!this.isConfigured()) {
      logger.warn("[DescartesABI] API credentials not configured");
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/entries`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          entry_type: entry.entryType,
          importer_of_record: entry.importerOfRecord,
          hts_classifications: entry.htsClassifications.map((h) => ({
            hts_code: h.htsCode,
            description: h.description,
            quantity: h.quantity,
            unit: h.unit,
            declared_value: h.declaredValue,
            country_of_origin: h.countryOfOrigin,
            duty_rate: h.dutyRate,
          })),
          declared_value: entry.declaredValue,
          duty_rate: entry.dutyRate,
          port_of_entry: entry.portOfEntry,
        }),
      });

      if (!response.ok) {
        logger.error(`[DescartesABI] API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return {
        entryNumber: data.entry_number || data.entryNumber || "",
        status: data.status || "Filed",
        dutyAmount: parseFloat(data.duty_amount) || 0,
        taxAmount: parseFloat(data.tax_amount) || 0,
        feeAmount: parseFloat(data.fee_amount) || 0,
        totalAmount: parseFloat(data.total_amount) || 0,
        filedAt: data.filed_at || new Date().toISOString(),
        liquidationDate: data.liquidation_date || null,
      };
    } catch (error) {
      logger.error("[DescartesABI] fileEntrySummary error:", error);
      return null;
    }
  }

  /**
   * Get entry processing status from CBP
   */
  async getEntryStatus(entryNumber: string): Promise<EntryStatus | null> {
    if (!this.isConfigured()) {
      logger.warn("[DescartesABI] API credentials not configured");
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/entries/${encodeURIComponent(entryNumber)}/status`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        logger.error(`[DescartesABI] API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return {
        entryNumber: data.entry_number || entryNumber,
        status: data.status || "Unknown",
        holds: (data.holds || []).map((h: any) => ({
          holdType: h.hold_type || h.type || "",
          agency: h.agency || "",
          reason: h.reason || null,
          appliedAt: h.applied_at || "",
        })),
        releaseDate: data.release_date || null,
        liquidationDate: data.liquidation_date || null,
        dutyOwed: parseFloat(data.duty_owed) || 0,
        lastUpdated: data.last_updated || new Date().toISOString(),
      };
    } catch (error) {
      logger.error("[DescartesABI] getEntryStatus error:", error);
      return null;
    }
  }

  /**
   * File an in-bond movement request
   */
  async fileInBond(inBond: InBondRequest): Promise<InBondResponse | null> {
    if (!this.isConfigured()) {
      logger.warn("[DescartesABI] API credentials not configured");
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/in-bonds`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          type: inBond.type,
          origin_port: inBond.originPort,
          destination_port: inBond.destPort,
          carrier: inBond.carrier,
          commodity: inBond.commodity,
          value: inBond.value,
        }),
      });

      if (!response.ok) {
        logger.error(`[DescartesABI] API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return {
        bondNumber: data.bond_number || data.bondNumber || "",
        status: data.status || "Filed",
        approvedAt: data.approved_at || null,
        expirationDate: data.expiration_date || null,
        originPort: data.origin_port || inBond.originPort,
        destPort: data.destination_port || inBond.destPort,
      };
    } catch (error) {
      logger.error("[DescartesABI] fileInBond error:", error);
      return null;
    }
  }

  /**
   * Get hold status details for an entry
   */
  async getHoldStatus(entryNumber: string): Promise<HoldStatus | null> {
    if (!this.isConfigured()) {
      logger.warn("[DescartesABI] API credentials not configured");
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/entries/${encodeURIComponent(entryNumber)}/holds`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        logger.error(`[DescartesABI] API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const hold = Array.isArray(data.holds) ? data.holds[0] : data;
      if (!hold) return null;

      return {
        entryNumber: data.entry_number || entryNumber,
        holdType: hold.hold_type || hold.type || "",
        reason: hold.reason || "",
        examiningAgency: hold.examining_agency || hold.agency || "",
        estimatedRelease: hold.estimated_release || null,
        appliedAt: hold.applied_at || "",
        status: hold.status || "Active",
        examLocation: hold.exam_location || null,
        intensifiedExam: hold.intensified_exam === true,
      };
    } catch (error) {
      logger.error("[DescartesABI] getHoldStatus error:", error);
      return null;
    }
  }

  /**
   * Get active CBP alerts for an importer
   */
  async getCBPAlerts(importerId: string): Promise<CBPAlert[]> {
    if (!this.isConfigured()) {
      logger.warn("[DescartesABI] API credentials not configured");
      return [];
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/alerts?importer_id=${encodeURIComponent(importerId)}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const alerts = data.alerts || data.results || [];

      return alerts.map((a: any) => ({
        alertId: a.alert_id || a.id || "",
        alertType: a.alert_type || a.type || "",
        severity: a.severity || "Info",
        description: a.description || "",
        entryNumber: a.entry_number || null,
        importerId: a.importer_id || importerId,
        createdAt: a.created_at || "",
        expiresAt: a.expires_at || null,
        actionRequired: a.action_required === true,
        agency: a.agency || "CBP",
      }));
    } catch (error) {
      logger.error("[DescartesABI] getCBPAlerts error:", error);
      return [];
    }
  }
}

// Export singleton instance
export const descartesABIService = new DescartesABIService();
