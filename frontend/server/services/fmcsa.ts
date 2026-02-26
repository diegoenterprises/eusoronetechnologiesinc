/**
 * FMCSA SAFER SYSTEM INTEGRATION
 * Federal Motor Catalyst Safety Administration API Integration
 * 
 * Provides catalyst verification, safety ratings, and authority status
 * API Documentation: https://mobile.fmcsa.dot.gov/qc/services/
 */

import { z } from "zod";

// Environment configuration
const FMCSA_API_KEY = process.env.FMCSA_API_KEY || "";
const FMCSA_BASE_URL = "https://mobile.fmcsa.dot.gov/qc/services";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface FMCSACatalystInfo {
  dotNumber: string;
  legalName: string;
  dbaName: string | null;
  catalystOperation: string;
  hmFlag: "Y" | "N";
  pcFlag: "Y" | "N";
  phyStreet: string;
  phyCity: string;
  phyState: string;
  phyZipcode: string;
  phyCountry: string;
  mailingStreet: string;
  mailingCity: string;
  mailingState: string;
  mailingZipcode: string;
  mailingCountry: string;
  telephone: string;
  fax: string | null;
  emailAddress: string | null;
  mcs150Date: string;
  mcs150Mileage: number;
  mcs150MileageYear: number;
  addDate: string;
  oicState: string | null;
  nbr_power_unit: number;
  driver_total: number;
}

export interface FMCSASafetyRating {
  dotNumber: string;
  ratingDate: string;
  reviewDate: string;
  rating: "Satisfactory" | "Conditional" | "Unsatisfactory" | "None";
  type: string;
  reportNumber: string;
}

export interface FMCSAAuthority {
  dotNumber: string;
  authorityType: string;
  authorityStatus: string;
  effectiveDate: string;
  applicationPending: boolean;
  grantedDate: string | null;
  revokedDate: string | null;
}

export interface FMCSAInsurance {
  dotNumber: string;
  insuranceType: string;
  policyNumber: string;
  insuranceCatalyst: string;
  coverageFrom: string;
  coverageTo: string;
  coverageValue: number;
  postedDate: string;
}

export interface CatalystVerificationResult {
  isValid: boolean;
  catalyst: FMCSACatalystInfo | null;
  safetyRating: FMCSASafetyRating | null;
  authorities: FMCSAAuthority[];
  insurance: FMCSAInsurance[];
  warnings: string[];
  errors: string[];
  verifiedAt: string;
}

// ============================================================================
// API CLIENT
// ============================================================================

class FMCSAService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = FMCSA_API_KEY;
    this.baseUrl = FMCSA_BASE_URL;
  }

  /**
   * Check if the API is configured
   */
  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Lookup catalyst by DOT number
   */
  async getCatalystByDOT(dotNumber: string): Promise<FMCSACatalystInfo | null> {
    if (!this.isConfigured()) {
      console.warn("[FMCSA] API key not configured");
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/carriers/${dotNumber}?webKey=${this.apiKey}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(`[FMCSA] API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data.content?.[0]?.carrier || data.content?.carrier || data.content?.[0]?.catalyst || data.content?.catalyst || null;
    } catch (error) {
      console.error("[FMCSA] getCatalystByDOT error:", error);
      return null;
    }
  }

  /**
   * Lookup catalyst by MC number
   */
  async getCatalystByMC(mcNumber: string): Promise<FMCSACatalystInfo | null> {
    if (!this.isConfigured()) {
      console.warn("[FMCSA] API key not configured");
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/carriers/docket-number/${mcNumber}?webKey=${this.apiKey}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.content?.[0]?.carrier || data.content?.carrier || data.content?.[0]?.catalyst || data.content?.catalyst || null;
    } catch (error) {
      console.error("[FMCSA] getCatalystByMC error:", error);
      return null;
    }
  }

  /**
   * Get catalyst safety rating
   */
  async getSafetyRating(dotNumber: string): Promise<FMCSASafetyRating | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/carriers/${dotNumber}/safetyRating?webKey=${this.apiKey}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.content?.safetyRating || null;
    } catch (error) {
      console.error("[FMCSA] getSafetyRating error:", error);
      return null;
    }
  }

  /**
   * Get catalyst authority status
   */
  async getAuthorities(dotNumber: string): Promise<FMCSAAuthority[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/carriers/${dotNumber}/authority?webKey=${this.apiKey}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.content?.authorities || [];
    } catch (error) {
      console.error("[FMCSA] getAuthorities error:", error);
      return [];
    }
  }

  /**
   * Get catalyst insurance information
   */
  async getInsurance(dotNumber: string): Promise<FMCSAInsurance[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/carriers/${dotNumber}/insurance?webKey=${this.apiKey}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.content?.insurance || [];
    } catch (error) {
      console.error("[FMCSA] getInsurance error:", error);
      return [];
    }
  }

  /**
   * Full catalyst verification - combines all checks
   */
  async verifyCatalyst(dotNumber: string): Promise<CatalystVerificationResult> {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Fetch all data in parallel
    const [catalyst, safetyRating, authorities, insurance] = await Promise.all([
      this.getCatalystByDOT(dotNumber),
      this.getSafetyRating(dotNumber),
      this.getAuthorities(dotNumber),
      this.getInsurance(dotNumber),
    ]);

    // Validate catalyst exists
    if (!catalyst) {
      return {
        isValid: false,
        catalyst: null,
        safetyRating: null,
        authorities: [],
        insurance: [],
        warnings: [],
        errors: ["Catalyst not found in FMCSA database"],
        verifiedAt: new Date().toISOString(),
      };
    }

    // Check safety rating
    if (safetyRating?.rating === "Unsatisfactory") {
      errors.push("Catalyst has Unsatisfactory safety rating");
    } else if (safetyRating?.rating === "Conditional") {
      warnings.push("Catalyst has Conditional safety rating");
    }

    // Check authority status
    const hasActiveAuthority = authorities.some(
      (auth) => auth.authorityStatus === "Active"
    );
    if (!hasActiveAuthority && authorities.length > 0) {
      errors.push("Catalyst does not have active operating authority");
    }

    // Check insurance
    const now = new Date();
    const validInsurance = insurance.filter((ins) => {
      const coverageTo = new Date(ins.coverageTo);
      return coverageTo > now;
    });

    if (validInsurance.length === 0 && insurance.length > 0) {
      errors.push("Catalyst insurance has expired");
    }

    // Check for required insurance types
    const hasLiabilityInsurance = validInsurance.some(
      (ins) => ins.insuranceType === "BIPD" || ins.insuranceType === "Liability"
    );
    if (!hasLiabilityInsurance) {
      warnings.push("No valid liability insurance on file");
    }

    // Check hazmat authorization if catalyst hauls hazmat
    if (catalyst.hmFlag === "Y") {
      const hasHazmatAuth = authorities.some(
        (auth) =>
          auth.authorityType.toLowerCase().includes("hazmat") &&
          auth.authorityStatus === "Active"
      );
      if (!hasHazmatAuth) {
        warnings.push("Catalyst registered for hazmat but no active hazmat authority");
      }
    }

    return {
      isValid: errors.length === 0,
      catalyst,
      safetyRating,
      authorities,
      insurance: validInsurance,
      warnings,
      errors,
      verifiedAt: new Date().toISOString(),
    };
  }

  /**
   * Search catalysts by name
   */
  async searchCatalysts(
    name: string,
    state?: string,
    limit: number = 20
  ): Promise<FMCSACatalystInfo[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      let url = `${this.baseUrl}/carriers/name/${encodeURIComponent(name)}?webKey=${this.apiKey}&size=${limit}`;
      if (state) {
        url += `&state=${state}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.content?.catalysts || [];
    } catch (error) {
      console.error("[FMCSA] searchCatalysts error:", error);
      return [];
    }
  }

}

// Export singleton instance
export const fmcsaService = new FMCSAService();
