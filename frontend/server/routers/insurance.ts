/**
 * INSURANCE ROUTER
 * tRPC procedures for insurance management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const insuranceRouter = router({
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
