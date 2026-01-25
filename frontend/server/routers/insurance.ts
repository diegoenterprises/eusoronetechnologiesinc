/**
 * INSURANCE ROUTER
 * tRPC procedures for insurance management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const insuranceRouter = router({
  /**
   * Get claims for ClaimsManagement page
   */
  getClaims: protectedProcedure
    .input(z.object({ filter: z.string().optional() }))
    .query(async ({ input }) => {
      const claims = [
        { id: "clm_001", number: "CLM-2025-0012", type: "cargo_damage", status: "open", amount: 4500, load: "LOAD-45910", date: "2025-01-22" },
        { id: "clm_002", number: "CLM-2025-0011", type: "accident", status: "investigating", amount: 12000, load: "LOAD-45895", date: "2025-01-18" },
        { id: "clm_003", number: "CLM-2025-0010", type: "cargo_loss", status: "approved", amount: 8200, load: "LOAD-45880", date: "2025-01-15" },
      ];
      if (input.filter && input.filter !== "all") {
        return claims.filter(c => c.status === input.filter);
      }
      return claims;
    }),

  /**
   * Get claim stats for ClaimsManagement page
   */
  getClaimStats: protectedProcedure
    .query(async () => {
      return {
        openClaims: 2,
        totalAmount: 24700,
        avgResolutionDays: 14,
        approvalRate: 85,
      };
    }),

  /**
   * Get insurance policies
   */
  getPolicies: protectedProcedure
    .query(async () => {
      return [
        {
          id: "ins_001",
          type: "auto_liability",
          provider: "Progressive Commercial",
          policyNumber: "POL-2025-001",
          coverage: 1000000,
          premium: 12500,
          startDate: "2025-01-01",
          endDate: "2026-01-01",
          status: "active",
        },
        {
          id: "ins_002",
          type: "cargo",
          provider: "Great West Casualty",
          policyNumber: "POL-2025-002",
          coverage: 250000,
          premium: 4500,
          startDate: "2025-01-01",
          endDate: "2026-01-01",
          status: "active",
        },
      ];
    }),

  /**
   * Get insurance summary
   */
  getSummary: protectedProcedure
    .query(async () => {
      return {
        totalPolicies: 5,
        activePolicies: 4,
        expiringPolicies: 1,
        totalCoverage: 2500000,
        annualPremium: 45000,
      };
    }),

  /**
   * Get insurance certificates
   */
  getCertificates: protectedProcedure
    .query(async () => {
      return [
        {
          id: "cert_001",
          policyId: "ins_001",
          holderName: "ABC Trucking LLC",
          issuedDate: "2025-01-01",
          expirationDate: "2026-01-01",
          documentUrl: "/documents/cert_001.pdf",
        },
      ];
    }),

  /**
   * Request certificate
   */
  requestCertificate: protectedProcedure
    .input(z.object({
      policyId: z.string(),
      holderName: z.string(),
      holderAddress: z.string(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        certificateId: `cert_${Date.now()}`,
        message: "Certificate request submitted",
      };
    }),
});
