/**
 * AVALARA HTS TARIFF CLASSIFICATION INTEGRATION
 * Harmonized Tariff Schedule classification, duty estimation, and trade agreements
 *
 * Provides product classification, HTS lookup, duty calculation, and FTA analysis
 * API Documentation: https://developer.avalara.com/api-reference/hs-classification
 */

import { logger } from "../../_core/logger";

// Environment configuration
const AVALARA_API_KEY = process.env.AVALARA_API_KEY || "";
const AVALARA_BASE_URL = "https://api.avalara.com/hs/v1";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ClassificationResult {
  hsCode: string;
  htsCode: string;
  scheduleBCode: string | null;
  dutyRate: number;
  dutyRateType: string;
  description: string;
  notes: string | null;
  confidence: number;
  chapter: string;
  heading: string;
  subheading: string;
  alternativeCodes: {
    code: string;
    description: string;
    confidence: number;
  }[];
}

export interface HTSDetails {
  htsCode: string;
  description: string;
  generalDutyRate: number;
  generalDutyRateType: string;
  specialDutyRate: number | null;
  column2DutyRate: number | null;
  unit: string;
  chapter: string;
  section: string;
  specialPrograms: {
    program: string;
    code: string;
    rate: number;
    rateType: string;
  }[];
  quotaStatus: "Open" | "Filled" | "Near Quota" | "N/A";
  quotaQuantityRemaining: number | null;
  additionalDuties: {
    type: string;
    rate: number;
    authority: string;
  }[];
  effectiveDate: string;
  notes: string[];
}

export interface DutyEstimate {
  htsCode: string;
  declaredValue: number;
  countryOfOrigin: string;
  dutyAmount: number;
  dutyRate: number;
  dutyRateType: string;
  taxAmount: number;
  merchandiseProcessingFee: number;
  harborMaintenanceFee: number;
  additionalDuties: {
    type: string;
    amount: number;
    rate: number;
  }[];
  totalFees: number;
  totalLandedCost: number;
  currency: string;
  applicablePrograms: string[];
  notes: string[];
}

export interface TradeAgreement {
  agreementName: string;
  agreementCode: string;
  originCountry: string;
  preferentialRate: number;
  preferentialRateType: string;
  standardRate: number;
  savings: number;
  requiresCertificateOfOrigin: boolean;
  certificateType: string | null;
  rulesOfOrigin: string | null;
  effectiveDate: string;
  expirationDate: string | null;
  conditions: string[];
}

export interface BulkClassificationItem {
  description: string;
  value: number;
  hsCode: string | null;
  htsCode: string | null;
  confidence: number | null;
  dutyRate: number | null;
  estimatedDuty: number | null;
  error: string | null;
}

export interface BulkClassificationResult {
  items: BulkClassificationItem[];
  totalDeclaredValue: number;
  totalEstimatedDuty: number;
  processedCount: number;
  errorCount: number;
  processedAt: string;
}

// ============================================================================
// API CLIENT
// ============================================================================

class AvalaraHTSService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = AVALARA_API_KEY;
    this.baseUrl = AVALARA_BASE_URL;
  }

  /**
   * Check if the API is configured
   */
  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Build authorization headers
   */
  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  /**
   * Classify a product description into HS/HTS codes
   */
  async classifyProduct(
    description: string,
    countryOfOrigin?: string,
    destinationCountry?: string
  ): Promise<ClassificationResult | null> {
    if (!this.isConfigured()) {
      logger.warn("[AvalaraHTS] API key not configured");
      return null;
    }

    try {
      const body: Record<string, string> = { description };
      if (countryOfOrigin) body.country_of_origin = countryOfOrigin;
      if (destinationCountry) body.destination_country = destinationCountry;

      const response = await fetch(`${this.baseUrl}/classify`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        logger.error(`[AvalaraHTS] API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const result = data.classification || data.result || data;

      return {
        hsCode: result.hs_code || result.hsCode || "",
        htsCode: result.hts_code || result.htsCode || "",
        scheduleBCode: result.schedule_b_code || result.scheduleBCode || null,
        dutyRate: parseFloat(result.duty_rate) || 0,
        dutyRateType: result.duty_rate_type || "ad_valorem",
        description: result.description || "",
        notes: result.notes || null,
        confidence: parseFloat(result.confidence) || 0,
        chapter: result.chapter || "",
        heading: result.heading || "",
        subheading: result.subheading || "",
        alternativeCodes: (result.alternatives || []).map((alt: any) => ({
          code: alt.code || alt.hs_code || "",
          description: alt.description || "",
          confidence: parseFloat(alt.confidence) || 0,
        })),
      };
    } catch (error) {
      logger.error("[AvalaraHTS] classifyProduct error:", error);
      return null;
    }
  }

  /**
   * Look up full tariff details for an HTS code
   */
  async lookupHTS(htsCode: string): Promise<HTSDetails | null> {
    if (!this.isConfigured()) {
      logger.warn("[AvalaraHTS] API key not configured");
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/hts/${encodeURIComponent(htsCode)}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        logger.error(`[AvalaraHTS] API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const tariff = data.tariff || data.result || data;

      return {
        htsCode: tariff.hts_code || tariff.htsCode || htsCode,
        description: tariff.description || "",
        generalDutyRate: parseFloat(tariff.general_duty_rate || tariff.duty_rate) || 0,
        generalDutyRateType: tariff.general_duty_rate_type || "ad_valorem",
        specialDutyRate: tariff.special_duty_rate != null ? parseFloat(tariff.special_duty_rate) : null,
        column2DutyRate: tariff.column_2_duty_rate != null ? parseFloat(tariff.column_2_duty_rate) : null,
        unit: tariff.unit || tariff.quantity_unit || "",
        chapter: tariff.chapter || "",
        section: tariff.section || "",
        specialPrograms: (tariff.special_programs || []).map((sp: any) => ({
          program: sp.program || sp.name || "",
          code: sp.code || "",
          rate: parseFloat(sp.rate) || 0,
          rateType: sp.rate_type || "ad_valorem",
        })),
        quotaStatus: tariff.quota_status || "N/A",
        quotaQuantityRemaining: tariff.quota_remaining != null ? parseFloat(tariff.quota_remaining) : null,
        additionalDuties: (tariff.additional_duties || []).map((ad: any) => ({
          type: ad.type || "",
          rate: parseFloat(ad.rate) || 0,
          authority: ad.authority || "",
        })),
        effectiveDate: tariff.effective_date || "",
        notes: tariff.notes || [],
      };
    } catch (error) {
      logger.error("[AvalaraHTS] lookupHTS error:", error);
      return null;
    }
  }

  /**
   * Calculate estimated duties, taxes, and fees for an import
   */
  async getDutyEstimate(
    htsCode: string,
    declaredValue: number,
    countryOfOrigin: string
  ): Promise<DutyEstimate | null> {
    if (!this.isConfigured()) {
      logger.warn("[AvalaraHTS] API key not configured");
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/duty-estimate`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          hts_code: htsCode,
          declared_value: declaredValue,
          country_of_origin: countryOfOrigin,
        }),
      });

      if (!response.ok) {
        logger.error(`[AvalaraHTS] API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const estimate = data.estimate || data.result || data;

      const additionalDuties = (estimate.additional_duties || []).map((ad: any) => ({
        type: ad.type || "",
        amount: parseFloat(ad.amount) || 0,
        rate: parseFloat(ad.rate) || 0,
      }));

      const dutyAmount = parseFloat(estimate.duty_amount) || 0;
      const taxAmount = parseFloat(estimate.tax_amount) || 0;
      const mpf = parseFloat(estimate.mpf || estimate.merchandise_processing_fee) || 0;
      const hmf = parseFloat(estimate.hmf || estimate.harbor_maintenance_fee) || 0;
      const additionalTotal = additionalDuties.reduce((sum: number, d: any) => sum + d.amount, 0);
      const totalFees = dutyAmount + taxAmount + mpf + hmf + additionalTotal;

      return {
        htsCode: estimate.hts_code || htsCode,
        declaredValue,
        countryOfOrigin,
        dutyAmount,
        dutyRate: parseFloat(estimate.duty_rate) || 0,
        dutyRateType: estimate.duty_rate_type || "ad_valorem",
        taxAmount,
        merchandiseProcessingFee: mpf,
        harborMaintenanceFee: hmf,
        additionalDuties,
        totalFees: parseFloat(estimate.total_fees) || totalFees,
        totalLandedCost: parseFloat(estimate.total_landed_cost) || (declaredValue + totalFees),
        currency: estimate.currency || "USD",
        applicablePrograms: estimate.applicable_programs || [],
        notes: estimate.notes || [],
      };
    } catch (error) {
      logger.error("[AvalaraHTS] getDutyEstimate error:", error);
      return null;
    }
  }

  /**
   * Get applicable trade agreements and preferential rates
   */
  async getTradeAgreements(
    htsCode: string,
    originCountry: string
  ): Promise<TradeAgreement[]> {
    if (!this.isConfigured()) {
      logger.warn("[AvalaraHTS] API key not configured");
      return [];
    }

    try {
      const params = new URLSearchParams({
        hts_code: htsCode,
        origin_country: originCountry,
      });

      const response = await fetch(
        `${this.baseUrl}/trade-agreements?${params.toString()}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const agreements = data.agreements || data.results || [];

      return agreements.map((a: any) => ({
        agreementName: a.agreement_name || a.name || "",
        agreementCode: a.agreement_code || a.code || "",
        originCountry: a.origin_country || originCountry,
        preferentialRate: parseFloat(a.preferential_rate) || 0,
        preferentialRateType: a.preferential_rate_type || "ad_valorem",
        standardRate: parseFloat(a.standard_rate) || 0,
        savings: parseFloat(a.savings) || 0,
        requiresCertificateOfOrigin: a.requires_certificate === true || a.requires_coo === true,
        certificateType: a.certificate_type || null,
        rulesOfOrigin: a.rules_of_origin || null,
        effectiveDate: a.effective_date || "",
        expirationDate: a.expiration_date || null,
        conditions: a.conditions || [],
      }));
    } catch (error) {
      logger.error("[AvalaraHTS] getTradeAgreements error:", error);
      return [];
    }
  }

  /**
   * Classify and estimate duties for multiple items in bulk
   */
  async bulkClassify(
    items: { description: string; value: number }[]
  ): Promise<BulkClassificationResult | null> {
    if (!this.isConfigured()) {
      logger.warn("[AvalaraHTS] API key not configured");
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/classify/bulk`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          items: items.map((item) => ({
            description: item.description,
            value: item.value,
          })),
        }),
      });

      if (!response.ok) {
        logger.error(`[AvalaraHTS] API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const results = data.items || data.results || [];

      const classifiedItems: BulkClassificationItem[] = results.map((r: any) => ({
        description: r.description || "",
        value: parseFloat(r.value) || 0,
        hsCode: r.hs_code || r.hsCode || null,
        htsCode: r.hts_code || r.htsCode || null,
        confidence: r.confidence != null ? parseFloat(r.confidence) : null,
        dutyRate: r.duty_rate != null ? parseFloat(r.duty_rate) : null,
        estimatedDuty: r.estimated_duty != null ? parseFloat(r.estimated_duty) : null,
        error: r.error || null,
      }));

      const successItems = classifiedItems.filter((i) => !i.error);
      const totalDeclaredValue = successItems.reduce((sum, i) => sum + i.value, 0);
      const totalEstimatedDuty = successItems.reduce((sum, i) => sum + (i.estimatedDuty || 0), 0);

      return {
        items: classifiedItems,
        totalDeclaredValue: Math.round(totalDeclaredValue * 100) / 100,
        totalEstimatedDuty: Math.round(totalEstimatedDuty * 100) / 100,
        processedCount: successItems.length,
        errorCount: classifiedItems.length - successItems.length,
        processedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("[AvalaraHTS] bulkClassify error:", error);
      return null;
    }
  }
}

// Export singleton instance
export const avalaraHTSService = new AvalaraHTSService();
