/**
 * FMCSA SAFER SYSTEM INTEGRATION
 * Federal Motor Carrier Safety Administration API Integration
 * 
 * Provides carrier verification, safety ratings, and authority status
 * API Documentation: https://mobile.fmcsa.dot.gov/qc/services/
 */

import { z } from "zod";

// Environment configuration
const FMCSA_API_KEY = process.env.FMCSA_API_KEY || "";
const FMCSA_BASE_URL = "https://mobile.fmcsa.dot.gov/qc/services";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface FMCSACarrierInfo {
  dotNumber: string;
  legalName: string;
  dbaName: string | null;
  carrierOperation: string;
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
  insuranceCarrier: string;
  coverageFrom: string;
  coverageTo: string;
  coverageValue: number;
  postedDate: string;
}

export interface CarrierVerificationResult {
  isValid: boolean;
  carrier: FMCSACarrierInfo | null;
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
   * Lookup carrier by DOT number
   */
  async getCarrierByDOT(dotNumber: string): Promise<FMCSACarrierInfo | null> {
    if (!this.isConfigured()) {
      console.warn("[FMCSA] API key not configured, using mock data");
      return this.getMockCarrier(dotNumber);
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
      return data.content?.carrier || null;
    } catch (error) {
      console.error("[FMCSA] getCarrierByDOT error:", error);
      return null;
    }
  }

  /**
   * Lookup carrier by MC number
   */
  async getCarrierByMC(mcNumber: string): Promise<FMCSACarrierInfo | null> {
    if (!this.isConfigured()) {
      console.warn("[FMCSA] API key not configured, using mock data");
      return this.getMockCarrier(`MC-${mcNumber}`);
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
      return data.content?.carrier || null;
    } catch (error) {
      console.error("[FMCSA] getCarrierByMC error:", error);
      return null;
    }
  }

  /**
   * Get carrier safety rating
   */
  async getSafetyRating(dotNumber: string): Promise<FMCSASafetyRating | null> {
    if (!this.isConfigured()) {
      return this.getMockSafetyRating(dotNumber);
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
   * Get carrier authority status
   */
  async getAuthorities(dotNumber: string): Promise<FMCSAAuthority[]> {
    if (!this.isConfigured()) {
      return this.getMockAuthorities(dotNumber);
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
   * Get carrier insurance information
   */
  async getInsurance(dotNumber: string): Promise<FMCSAInsurance[]> {
    if (!this.isConfigured()) {
      return this.getMockInsurance(dotNumber);
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
   * Full carrier verification - combines all checks
   */
  async verifyCarrier(dotNumber: string): Promise<CarrierVerificationResult> {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Fetch all data in parallel
    const [carrier, safetyRating, authorities, insurance] = await Promise.all([
      this.getCarrierByDOT(dotNumber),
      this.getSafetyRating(dotNumber),
      this.getAuthorities(dotNumber),
      this.getInsurance(dotNumber),
    ]);

    // Validate carrier exists
    if (!carrier) {
      return {
        isValid: false,
        carrier: null,
        safetyRating: null,
        authorities: [],
        insurance: [],
        warnings: [],
        errors: ["Carrier not found in FMCSA database"],
        verifiedAt: new Date().toISOString(),
      };
    }

    // Check safety rating
    if (safetyRating?.rating === "Unsatisfactory") {
      errors.push("Carrier has Unsatisfactory safety rating");
    } else if (safetyRating?.rating === "Conditional") {
      warnings.push("Carrier has Conditional safety rating");
    }

    // Check authority status
    const hasActiveAuthority = authorities.some(
      (auth) => auth.authorityStatus === "Active"
    );
    if (!hasActiveAuthority && authorities.length > 0) {
      errors.push("Carrier does not have active operating authority");
    }

    // Check insurance
    const now = new Date();
    const validInsurance = insurance.filter((ins) => {
      const coverageTo = new Date(ins.coverageTo);
      return coverageTo > now;
    });

    if (validInsurance.length === 0 && insurance.length > 0) {
      errors.push("Carrier insurance has expired");
    }

    // Check for required insurance types
    const hasLiabilityInsurance = validInsurance.some(
      (ins) => ins.insuranceType === "BIPD" || ins.insuranceType === "Liability"
    );
    if (!hasLiabilityInsurance) {
      warnings.push("No valid liability insurance on file");
    }

    // Check hazmat authorization if carrier hauls hazmat
    if (carrier.hmFlag === "Y") {
      const hasHazmatAuth = authorities.some(
        (auth) =>
          auth.authorityType.toLowerCase().includes("hazmat") &&
          auth.authorityStatus === "Active"
      );
      if (!hasHazmatAuth) {
        warnings.push("Carrier registered for hazmat but no active hazmat authority");
      }
    }

    return {
      isValid: errors.length === 0,
      carrier,
      safetyRating,
      authorities,
      insurance: validInsurance,
      warnings,
      errors,
      verifiedAt: new Date().toISOString(),
    };
  }

  /**
   * Search carriers by name
   */
  async searchCarriers(
    name: string,
    state?: string,
    limit: number = 20
  ): Promise<FMCSACarrierInfo[]> {
    if (!this.isConfigured()) {
      return [this.getMockCarrier("1234567")!];
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
      return data.content?.carriers || [];
    } catch (error) {
      console.error("[FMCSA] searchCarriers error:", error);
      return [];
    }
  }

  // ============================================================================
  // MOCK DATA (for development without API key)
  // ============================================================================

  private getMockCarrier(dotNumber: string): FMCSACarrierInfo {
    return {
      dotNumber: dotNumber.replace(/\D/g, "") || "1234567",
      legalName: "ABC Transport LLC",
      dbaName: "ABC Hazmat Carriers",
      carrierOperation: "A",
      hmFlag: "Y",
      pcFlag: "N",
      phyStreet: "1234 Industrial Blvd",
      phyCity: "Houston",
      phyState: "TX",
      phyZipcode: "77001",
      phyCountry: "US",
      mailingStreet: "PO Box 1234",
      mailingCity: "Houston",
      mailingState: "TX",
      mailingZipcode: "77001",
      mailingCountry: "US",
      telephone: "(713) 555-0100",
      fax: "(713) 555-0101",
      emailAddress: "dispatch@abctransport.com",
      mcs150Date: "2024-06-15",
      mcs150Mileage: 2500000,
      mcs150MileageYear: 2023,
      addDate: "2015-03-20",
      oicState: "TX",
      nbr_power_unit: 25,
      driver_total: 30,
    };
  }

  private getMockSafetyRating(dotNumber: string): FMCSASafetyRating {
    return {
      dotNumber,
      ratingDate: "2024-01-15",
      reviewDate: "2024-01-10",
      rating: "Satisfactory",
      type: "Compliance Review",
      reportNumber: "CR-2024-001234",
    };
  }

  private getMockAuthorities(dotNumber: string): FMCSAAuthority[] {
    return [
      {
        dotNumber,
        authorityType: "Common",
        authorityStatus: "Active",
        effectiveDate: "2015-03-25",
        applicationPending: false,
        grantedDate: "2015-03-25",
        revokedDate: null,
      },
      {
        dotNumber,
        authorityType: "Contract",
        authorityStatus: "Active",
        effectiveDate: "2015-03-25",
        applicationPending: false,
        grantedDate: "2015-03-25",
        revokedDate: null,
      },
      {
        dotNumber,
        authorityType: "Hazmat",
        authorityStatus: "Active",
        effectiveDate: "2016-01-10",
        applicationPending: false,
        grantedDate: "2016-01-10",
        revokedDate: null,
      },
    ];
  }

  private getMockInsurance(dotNumber: string): FMCSAInsurance[] {
    const now = new Date();
    const oneYearFromNow = new Date(now);
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    return [
      {
        dotNumber,
        insuranceType: "BIPD",
        policyNumber: "POL-2024-123456",
        insuranceCarrier: "National Trucking Insurance",
        coverageFrom: now.toISOString().split("T")[0],
        coverageTo: oneYearFromNow.toISOString().split("T")[0],
        coverageValue: 1000000,
        postedDate: now.toISOString().split("T")[0],
      },
      {
        dotNumber,
        insuranceType: "Cargo",
        policyNumber: "POL-2024-789012",
        insuranceCarrier: "National Trucking Insurance",
        coverageFrom: now.toISOString().split("T")[0],
        coverageTo: oneYearFromNow.toISOString().split("T")[0],
        coverageValue: 100000,
        postedDate: now.toISOString().split("T")[0],
      },
    ];
  }
}

// Export singleton instance
export const fmcsaService = new FMCSAService();

// Export types for use in routers
export type {
  FMCSACarrierInfo,
  FMCSASafetyRating,
  FMCSAAuthority,
  FMCSAInsurance,
  CarrierVerificationResult,
};
