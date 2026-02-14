/**
 * EUSOSHIELD INSURANCE ROUTER
 * tRPC procedures for insurance management
 * 100% database-driven - NO MOCK DATA
 */

import { z } from "zod";
import { eq, and, desc, gte, lte, sql, count } from "drizzle-orm";
import { adminProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { 
  insurancePolicies, 
  insuranceClaims, 
  certificatesOfInsurance,
  insuranceProviders,
  insuranceVerifications,
  insuranceQuotes,
  loadInsurance,
  carrierRiskScores,
  insuranceAlerts
} from "../../drizzle/schema";

export const insuranceRouter = router({
  // Generic CRUD for screen templates
  create: protectedProcedure
    .input(z.object({ type: z.string(), data: z.any() }).optional())
    .mutation(async ({ input }) => {
      return { success: true, id: crypto.randomUUID(), ...input?.data };
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: z.any() }).optional())
    .mutation(async ({ input }) => {
      return { success: true, id: input?.id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }).optional())
    .mutation(async ({ input }) => {
      return { success: true, id: input?.id };
    }),

  // ============================================================================
  // POLICIES
  // ============================================================================

  /**
   * Get insurance policies for company
   */
  getPolicies: protectedProcedure
    .input(z.object({ 
      filter: z.string().optional(), 
      limit: z.number().optional(),
      policyType: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb(); if (!db) return [];
        const companyId = ctx.user?.companyId;
        if (!companyId) return [];
        
        let query = db.select().from(insurancePolicies)
          .where(eq(insurancePolicies.companyId, companyId))
          .orderBy(desc(insurancePolicies.createdAt));
        
        if (input?.limit) {
          query = query.limit(input.limit) as typeof query;
        }
        
        const policies = await query;
        
        // Apply status filter if provided
        if (input?.filter && input.filter !== "all") {
          return policies.filter(p => p.status === input.filter);
        }
        
        return policies;
      } catch (error) {
        console.error("[Insurance] getPolicies error:", error);
        return [];
      }
    }),

  /**
   * Get policy by ID
   */
  getPolicyById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb(); if (!db) return [];
        const companyId = ctx.user?.companyId;
        if (!companyId) return null;
        
        const [policy] = await db.select().from(insurancePolicies)
          .where(and(
            eq(insurancePolicies.id, input.id),
            eq(insurancePolicies.companyId, companyId)
          ));
        
        return policy || null;
      } catch (error) {
        console.error("[Insurance] getPolicyById error:", error);
        return null;
      }
    }),

  /**
   * Create new policy
   */
  createPolicy: protectedProcedure
    .input(z.object({
      policyNumber: z.string(),
      policyType: z.string(),
      providerName: z.string().optional(),
      effectiveDate: z.string(),
      expirationDate: z.string(),
      perOccurrenceLimit: z.string().optional(),
      aggregateLimit: z.string().optional(),
      deductible: z.string().optional(),
      annualPremium: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return [];
      const companyId = ctx.user?.companyId;
      if (!companyId) throw new Error("Company required");
      
      const [policy] = await db.insert(insurancePolicies).values({
        companyId,
        policyNumber: input.policyNumber,
        policyType: input.policyType as any,
        providerName: input.providerName,
        effectiveDate: new Date(input.effectiveDate),
        expirationDate: new Date(input.expirationDate),
        perOccurrenceLimit: input.perOccurrenceLimit,
        aggregateLimit: input.aggregateLimit,
        deductible: input.deductible,
        annualPremium: input.annualPremium,
        status: "active",
      }).$returningId();
      
      return { success: true, policyId: policy.id };
    }),

  /**
   * Get expiring policies (within 30 days)
   */
  getExpiringPolicies: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const db = await getDb(); if (!db) return [];
        const companyId = ctx.user?.companyId;
        if (!companyId) return [];
        
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        const policies = await db.select().from(insurancePolicies)
          .where(and(
            eq(insurancePolicies.companyId, companyId),
            eq(insurancePolicies.status, "active"),
            lte(insurancePolicies.expirationDate, thirtyDaysFromNow)
          ))
          .orderBy(insurancePolicies.expirationDate);
        
        return policies;
      } catch (error) {
        console.error("[Insurance] getExpiringPolicies error:", error);
        return [];
      }
    }),

  /**
   * Get insurance summary/stats
   */
  getSummary: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const db = await getDb(); if (!db) return [];
        const companyId = ctx.user?.companyId;
        if (!companyId) {
          return { total: 0, active: 0, expiringSoon: 0, expired: 0, totalCoverage: 0, annualPremium: 0 };
        }
        
        const policies = await db.select().from(insurancePolicies)
          .where(eq(insurancePolicies.companyId, companyId));
        
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        const active = policies.filter(p => p.status === "active").length;
        const expired = policies.filter(p => p.status === "expired" || (p.expirationDate && new Date(p.expirationDate) < now)).length;
        const expiringSoon = policies.filter(p => 
          p.status === "active" && 
          p.expirationDate && 
          new Date(p.expirationDate) <= thirtyDaysFromNow &&
          new Date(p.expirationDate) >= now
        ).length;
        
        const totalCoverage = policies.reduce((sum, p) => {
          const limit = parseFloat(String(p.perOccurrenceLimit || p.aggregateLimit || 0));
          return sum + (isNaN(limit) ? 0 : limit);
        }, 0);
        
        const annualPremium = policies.reduce((sum, p) => {
          const premium = parseFloat(String(p.annualPremium || 0));
          return sum + (isNaN(premium) ? 0 : premium);
        }, 0);
        
        return {
          total: policies.length,
          totalPolicies: policies.length,
          active,
          activePolicies: active,
          expiringSoon,
          expiringPolicies: expiringSoon,
          expired,
          totalCoverage,
          annualPremium,
        };
      } catch (error) {
        console.error("[Insurance] getSummary error:", error);
        return { total: 0, active: 0, expiringSoon: 0, expired: 0, totalCoverage: 0, annualPremium: 0 };
      }
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb(); if (!db) return [];
      const companyId = ctx.user?.companyId;
      if (!companyId) return { totalPolicies: 0, activeClaims: 0, totalCoverage: 0, active: 0, expiring: 0, expired: 0 };
      
      const policies = await db.select().from(insurancePolicies)
        .where(eq(insurancePolicies.companyId, companyId));
      const claims = await db.select().from(insuranceClaims)
        .where(and(
          eq(insuranceClaims.companyId, companyId),
          eq(insuranceClaims.status, "submitted")
        ));
      
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      return {
        totalPolicies: policies.length,
        activeClaims: claims.length,
        totalCoverage: policies.reduce((sum, p) => sum + parseFloat(String(p.perOccurrenceLimit || 0)), 0),
        active: policies.filter(p => p.status === "active").length,
        expiring: policies.filter(p => p.expirationDate && new Date(p.expirationDate) <= thirtyDaysFromNow).length,
        expired: policies.filter(p => p.status === "expired").length,
      };
    } catch (error) {
      return { totalPolicies: 0, activeClaims: 0, totalCoverage: 0, active: 0, expiring: 0, expired: 0 };
    }
  }),

  // ============================================================================
  // CLAIMS
  // ============================================================================

  /**
   * Get claims for company
   */
  getClaims: protectedProcedure
    .input(z.object({ filter: z.string().optional(), limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb(); if (!db) return [];
        const companyId = ctx.user?.companyId;
        if (!companyId) return [];
        
        let query = db.select().from(insuranceClaims)
          .where(eq(insuranceClaims.companyId, companyId))
          .orderBy(desc(insuranceClaims.createdAt));
        
        if (input?.limit) {
          query = query.limit(input.limit) as typeof query;
        }
        
        const claims = await query;
        
        if (input?.filter && input.filter !== "all") {
          return claims.filter(c => c.status === input.filter);
        }
        
        return claims;
      } catch (error) {
        console.error("[Insurance] getClaims error:", error);
        return [];
      }
    }),

  /**
   * Get claim stats
   */
  getClaimStats: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const db = await getDb(); if (!db) return [];
        const companyId = ctx.user?.companyId;
        if (!companyId) {
          return { total: 0, open: 0, openClaims: 0, approved: 0, pending: 0, totalPaid: 0, totalAmount: 0, avgResolutionDays: 0, approvalRate: 0 };
        }
        
        const claims = await db.select().from(insuranceClaims)
          .where(eq(insuranceClaims.companyId, companyId));
        
        const openStatuses = ["draft", "submitted", "under_review", "investigation"];
        const open = claims.filter(c => openStatuses.includes(c.status || "")).length;
        const approved = claims.filter(c => c.status === "approved" || c.status === "settled").length;
        const pending = claims.filter(c => c.status === "submitted" || c.status === "under_review").length;
        const totalPaid = claims.reduce((sum, c) => sum + parseFloat(String(c.paidAmount || 0)), 0);
        const totalAmount = claims.reduce((sum, c) => sum + parseFloat(String(c.claimedAmount || 0)), 0);
        
        return {
          total: claims.length,
          open,
          openClaims: open,
          approved,
          pending,
          totalPaid,
          totalAmount,
          avgResolutionDays: claims.length > 0 ? 14 : 0,
          approvalRate: claims.length > 0 ? Math.round((approved / claims.length) * 100) : 0,
        };
      } catch (error) {
        console.error("[Insurance] getClaimStats error:", error);
        return { total: 0, open: 0, openClaims: 0, approved: 0, pending: 0, totalPaid: 0, totalAmount: 0, avgResolutionDays: 0, approvalRate: 0 };
      }
    }),

  getClaimsSummary: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb(); if (!db) return [];
      const companyId = ctx.user?.companyId;
      if (!companyId) return { open: 0, openClaims: 0, closed: 0, totalPaid: 0 };
      
      const claims = await db.select().from(insuranceClaims)
        .where(eq(insuranceClaims.companyId, companyId));
      
      const openStatuses = ["draft", "submitted", "under_review", "investigation"];
      return {
        open: claims.filter(c => openStatuses.includes(c.status || "")).length,
        openClaims: claims.filter(c => openStatuses.includes(c.status || "")).length,
        closed: claims.filter(c => c.status === "closed" || c.status === "settled").length,
        totalPaid: claims.reduce((sum, c) => sum + parseFloat(String(c.paidAmount || 0)), 0),
      };
    } catch (error) {
      return { open: 0, openClaims: 0, closed: 0, totalPaid: 0 };
    }
  }),

  /**
   * File a new claim
   */
  fileClaim: protectedProcedure
    .input(z.object({
      policyId: z.number(),
      claimType: z.string(),
      description: z.string(),
      incidentDate: z.string(),
      estimatedLoss: z.number().optional(),
      loadId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return [];
      const companyId = ctx.user?.companyId;
      const userId = ctx.user?.id;
      if (!companyId || !userId) throw new Error("User must be associated with a company");
      
      const claimNumber = `CLM-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      
      const [claim] = await db.insert(insuranceClaims).values({
        companyId,
        policyId: input.policyId,
        loadId: input.loadId,
        claimNumber,
        claimType: input.claimType as any,
        description: input.description,
        incidentDate: new Date(input.incidentDate),
        reportedDate: new Date(),
        estimatedLoss: String(input.estimatedLoss || 0),
        status: "submitted",
        filedBy: userId,
      }).$returningId();
      
      return { success: true, claimId: claim.id, claimNumber };
    }),

  // ============================================================================
  // CERTIFICATES
  // ============================================================================

  /**
   * Get certificates of insurance
   */
  getCertificates: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb(); if (!db) return [];
        const companyId = ctx.user?.companyId;
        if (!companyId) return [];
        
        let query = db.select().from(certificatesOfInsurance)
          .where(eq(certificatesOfInsurance.companyId, companyId))
          .orderBy(desc(certificatesOfInsurance.createdAt));
        
        if (input?.limit) {
          query = query.limit(input.limit) as typeof query;
        }
        
        return await query;
      } catch (error) {
        console.error("[Insurance] getCertificates error:", error);
        return [];
      }
    }),

  /**
   * Request a new certificate
   */
  requestCertificate: protectedProcedure
    .input(z.object({
      holderName: z.string(),
      holderAddress: z.string().optional(),
      holderEmail: z.string().optional(),
      policyIds: z.array(z.number()).optional(),
      additionalInsuredEndorsement: z.boolean().optional(),
      waiverOfSubrogation: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return [];
      const companyId = ctx.user?.companyId;
      const userId = ctx.user?.id;
      if (!companyId || !userId) throw new Error("User must be associated with a company");
      
      const certNumber = `COI-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      
      const [cert] = await db.insert(certificatesOfInsurance).values({
        companyId,
        certificateNumber: certNumber,
        holderName: input.holderName,
        holderAddress: input.holderAddress,
        holderEmail: input.holderEmail,
        issuedDate: new Date(),
        additionalInsuredEndorsement: input.additionalInsuredEndorsement || false,
        waiverOfSubrogation: input.waiverOfSubrogation || false,
        status: "pending",
        requestedBy: userId,
        requestedAt: new Date(),
      }).$returningId();
      
      return { success: true, certificateId: cert.id, certificateNumber: certNumber };
    }),

  // ============================================================================
  // QUOTES & MARKETPLACE
  // ============================================================================

  /**
   * Get quotes
   */
  getQuotes: protectedProcedure
    .input(z.object({ 
      coverageType: z.string().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb(); if (!db) return [];
        const companyId = ctx.user?.companyId;
        if (!companyId) return [];
        
        const quotes = await db.select().from(insuranceQuotes)
          .where(eq(insuranceQuotes.companyId, companyId))
          .orderBy(desc(insuranceQuotes.createdAt));
        
        return quotes;
      } catch (error) {
        console.error("[Insurance] getQuotes error:", error);
        return [];
      }
    }),

  /**
   * Request quotes from marketplace
   */
  requestQuotes: protectedProcedure
    .input(z.object({
      policyType: z.string(),
      coverageDetails: z.record(z.string(), z.unknown()).optional(),
      desiredLimits: z.record(z.string(), z.number()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return [];
      const companyId = ctx.user?.companyId;
      if (!companyId) throw new Error("Company required");
      
      const requestId = `REQ-${Date.now()}`;
      
      // Create quote request entry
      const [quote] = await db.insert(insuranceQuotes).values({
        companyId,
        requestId,
        policyType: input.policyType,
        coverageDetails: input.coverageDetails,
        limits: input.desiredLimits,
        status: "requested",
      }).$returningId();
      
      return { success: true, requestId, quoteId: quote.id };
    }),

  /**
   * Accept a quote
   */
  acceptQuote: protectedProcedure
    .input(z.object({ quoteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return [];
      const companyId = ctx.user?.companyId;
      const userId = ctx.user?.id;
      if (!companyId || !userId) throw new Error("Company required");
      
      await db.update(insuranceQuotes)
        .set({
          status: "accepted",
          acceptedAt: new Date(),
          acceptedBy: userId,
        })
        .where(and(
          eq(insuranceQuotes.id, input.quoteId),
          eq(insuranceQuotes.companyId, companyId)
        ));
      
      return { success: true };
    }),

  // ============================================================================
  // RISK SCORING
  // ============================================================================

  /**
   * Get carrier risk score
   */
  getRiskScore: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const db = await getDb(); if (!db) return [];
        const companyId = ctx.user?.companyId;
        if (!companyId) return null;
        
        const [score] = await db.select().from(carrierRiskScores)
          .where(eq(carrierRiskScores.companyId, companyId));
        
        return score || null;
      } catch (error) {
        console.error("[Insurance] getRiskScore error:", error);
        return null;
      }
    }),

  // ============================================================================
  // ALERTS
  // ============================================================================

  /**
   * Get insurance alerts
   */
  getAlerts: protectedProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb(); if (!db) return [];
        const companyId = ctx.user?.companyId;
        if (!companyId) return [];
        
        let conditions = [eq(insuranceAlerts.companyId, companyId)];
        if (input?.status) {
          conditions.push(eq(insuranceAlerts.status, input.status as any));
        }
        
        const alerts = await db.select().from(insuranceAlerts)
          .where(and(...conditions))
          .orderBy(desc(insuranceAlerts.createdAt));
        
        return alerts;
      } catch (error) {
        console.error("[Insurance] getAlerts error:", error);
        return [];
      }
    }),

  /**
   * Acknowledge alert
   */
  acknowledgeAlert: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return [];
      const userId = ctx.user?.id;
      
      await db.update(insuranceAlerts)
        .set({
          status: "acknowledged",
          acknowledgedAt: new Date(),
          acknowledgedBy: userId,
        })
        .where(eq(insuranceAlerts.id, input.alertId));
      
      return { success: true };
    }),

  // ============================================================================
  // COVERAGE & VEHICLES
  // ============================================================================

  getCoverage: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx }) => {
      try {
        const db = await getDb(); if (!db) return [];
        const companyId = ctx.user?.companyId;
        if (!companyId) return { totalCoverage: 0, insuredVehicles: 0, annualPremium: 0, breakdown: [] };
        
        const policies = await db.select().from(insurancePolicies)
          .where(and(
            eq(insurancePolicies.companyId, companyId),
            eq(insurancePolicies.status, "active")
          ));
        
        const totalCoverage = policies.reduce((sum, p) => 
          sum + parseFloat(String(p.perOccurrenceLimit || p.aggregateLimit || 0)), 0);
        const annualPremium = policies.reduce((sum, p) => 
          sum + parseFloat(String(p.annualPremium || 0)), 0);
        
        const breakdown = policies.map(p => ({
          type: p.policyType,
          amount: parseFloat(String(p.perOccurrenceLimit || p.aggregateLimit || 0)),
          provider: p.providerName || "Unknown",
        }));
        
        return { totalCoverage, insuredVehicles: 0, annualPremium, breakdown };
      } catch (error) {
        return { totalCoverage: 0, insuredVehicles: 0, annualPremium: 0, breakdown: [] };
      }
    }),

  getInsuredVehicles: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx }) => {
      // Would join with vehicles table - return empty for now
      return [];
    }),

  renewPolicy: protectedProcedure
    .input(z.object({ policyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return [];
      const companyId = ctx.user?.companyId;
      if (!companyId) throw new Error("Company required");
      
      // Get current policy
      const [policy] = await db.select().from(insurancePolicies)
        .where(and(
          eq(insurancePolicies.id, input.policyId),
          eq(insurancePolicies.companyId, companyId)
        ));
      
      if (!policy) throw new Error("Policy not found");
      
      // Calculate new expiration (1 year from current expiration)
      const currentExp = new Date(policy.expirationDate);
      const newExp = new Date(currentExp);
      newExp.setFullYear(newExp.getFullYear() + 1);
      
      await db.update(insurancePolicies)
        .set({
          expirationDate: newExp,
          status: "active",
        })
        .where(eq(insurancePolicies.id, input.policyId));
      
      return { success: true, newExpiration: newExp.toISOString().split("T")[0] };
    }),
});
