/**
 * COMPLIANCE NETWORK MEMBERSHIP ROUTER
 * Self-attestation + manual verification for Avetta, ISNetworld, Veriforce
 * FMCSA auto-verification handled by fmcsa.ts router
 */

import { z } from "zod";
import { router, auditedPublicProcedure, auditedProtectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { complianceNetworkMemberships } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

const networkEnum = z.enum([
  "fmcsa", "avetta", "isnetworld", "veriforce", "disa",
  "complyworks", "browz", "phmsa", "tsa_twic", "epa", "osha", "other",
]);

export const complianceNetworksRouter = router({
  /**
   * Submit compliance network memberships during registration
   * Stores as PENDING for manual verification (except FMCSA which is auto-verified)
   */
  submitMemberships: auditedPublicProcedure
    .input(z.object({
      companyId: z.number(),
      userId: z.number(),
      networks: z.array(z.object({
        network: networkEnum,
        memberId: z.string().min(1),
        otherName: z.string().optional(),
        proofDocumentUrl: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      let submitted = 0;

      for (const n of input.networks) {
        try {
          await db.insert(complianceNetworkMemberships).values({
            companyId: input.companyId,
            networkName: n.network === "other" ? (n.otherName || "other") : n.network,
            memberId: n.memberId,
            networkDisplayName: n.network === "other" ? n.otherName : n.network.toUpperCase(),
            verificationStatus: n.network === "fmcsa" ? "VERIFIED" : "PENDING",
            verificationMethod: n.network === "fmcsa" ? "api_auto" : "self_attestation",
            proofDocumentUrl: n.proofDocumentUrl || null,
            submittedBy: input.userId,
          });
          submitted++;
        } catch {
          // Skip duplicates silently
        }
      }

      return { submitted, status: "PENDING_REVIEW" };
    }),

  /**
   * Get all compliance network memberships for a company
   */
  getByCompany: auditedProtectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const memberships = await db
        .select()
        .from(complianceNetworkMemberships)
        .where(
          and(
            eq(complianceNetworkMemberships.companyId, input.companyId),
            eq(complianceNetworkMemberships.isActive, true)
          )
        );
      return memberships;
    }),

  /**
   * Verify a membership (admin/compliance officer action)
   */
  verifyMembership: auditedProtectedProcedure
    .input(z.object({
      membershipId: z.number(),
      status: z.enum(["VERIFIED", "FAILED", "EXPIRED"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(complianceNetworkMemberships)
        .set({
          verificationStatus: input.status,
          verifiedAt: new Date(),
          verifiedBy: (ctx.user as any)?.id || null,
          verificationMethod: "manual_review",
        })
        .where(eq(complianceNetworkMemberships.id, input.membershipId));

      return { success: true };
    }),
});
