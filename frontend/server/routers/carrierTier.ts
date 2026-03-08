/**
 * CARRIER TIER SYSTEM ROUTER (GAP-063)
 * Gold / Silver / Bronze carrier classification with benefits,
 * promotion paths, and tier-based load access.
 */

import { z } from "zod";
import { eq, and, desc, sql, gte, count } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { companies, loads, bids, incidents, insurancePolicies, users } from "../../drizzle/schema";
import { getCarrierSafetyIntel } from "../services/fmcsaBulkLookup";
import {
  calculateCarrierTier,
  getAllTierDefinitions,
  getTierBenefits,
  getTierFeeDiscount,
  getTierDispatchBoost,
  TIER_DEFINITIONS,
  type CarrierTierInput,
} from "../services/CarrierTierSystem";

export const carrierTierRouter = router({
  // 1. Get carrier tier — full tier calculation with breakdown
  getCarrierTier: protectedProcedure
    .input(z.object({ carrierId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const [company] = await db.select().from(companies).where(eq(companies.id, input.carrierId)).limit(1);
        if (!company) return null;

        // On-time delivery rate
        const [delivered] = await db.select({
          total: sql<number>`count(*)`,
          onTime: sql<number>`SUM(CASE WHEN ${loads.actualDeliveryDate} <= ${loads.estimatedDeliveryDate} OR ${loads.actualDeliveryDate} IS NULL THEN 1 ELSE 0 END)`,
        }).from(loads).where(eq(loads.catalystId, input.carrierId));

        const totalLoads = delivered?.total || 0;
        const onTimeRate = totalLoads > 0 ? Math.round(((delivered?.onTime || 0) / totalLoads) * 100) : 100;

        // Recent loads (90 days)
        const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);
        const [recentStats] = await db.select({
          completed: sql<number>`SUM(CASE WHEN ${loads.status} = 'delivered' THEN 1 ELSE 0 END)`,
          total: sql<number>`count(*)`,
        }).from(loads).where(and(eq(loads.catalystId, input.carrierId), gte(loads.createdAt, ninetyDaysAgo)));

        const completionRate = (recentStats?.total || 0) > 0
          ? Math.round(((recentStats?.completed || 0) / (recentStats?.total || 1)) * 100) : 100;

        // Safety incidents
        const [incidentStats] = await db.select({
          total: sql<number>`count(*)`,
        }).from(incidents).where(eq(incidents.companyId, input.carrierId));
        const safetyScore = Math.max(0, 100 - ((incidentStats?.total || 0) * 10));

        // Insurance compliance
        const activePolicies = await db.select({ id: insurancePolicies.id })
          .from(insurancePolicies)
          .where(and(eq(insurancePolicies.companyId, input.carrierId), eq(insurancePolicies.status, "active")));
        const complianceScore = activePolicies.length >= 2 ? 100 : activePolicies.length >= 1 ? 70 : 30;

        // Review rating (from ratings table or company metadata)
        let avgRating = 4.0;
        let reviewCount = 0;
        try {
          const [ratingData] = await db.execute(sql`
            SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
            FROM ratings WHERE target_id = ${input.carrierId} AND target_type = 'carrier'
          `) as any;
          const rd = (ratingData || [])[0];
          if (rd && Number(rd.review_count) > 0) {
            avgRating = Number(rd.avg_rating) || 4.0;
            reviewCount = Number(rd.review_count) || 0;
          }
        } catch { /* ratings table may not exist */ }

        // FMCSA risk data
        let fmcsaRiskTier: CarrierTierInput["fmcsaRiskTier"] = "UNKNOWN";
        let fmcsaRiskScore = 0;
        if (company.dotNumber) {
          try {
            const intel = await getCarrierSafetyIntel(company.dotNumber);
            fmcsaRiskTier = intel.riskTier;
            fmcsaRiskScore = intel.riskScore;
          } catch { /* FMCSA lookup may fail */ }
        }

        // Tenure (months since company creation)
        const tenureMonths = company.createdAt
          ? Math.round((Date.now() - new Date(company.createdAt).getTime()) / (30 * 86400000))
          : 0;

        // Scorecard overall (simplified calculation matching carrierScorecard router)
        const scorecardOverall = Math.round(
          onTimeRate * 0.30 + safetyScore * 0.30 + complianceScore * 0.20 + completionRate * 0.20
        );

        // Build tier input and calculate
        const tierInput: CarrierTierInput = {
          carrierId: input.carrierId,
          scorecardOverall,
          onTimeRate,
          safetyScore,
          complianceScore,
          completionRate,
          avgReviewRating: avgRating,
          reviewCount,
          fmcsaRiskTier,
          fmcsaRiskScore,
          tenureMonths,
          totalLoads,
          recentLoads90d: recentStats?.total || 0,
        };

        const result = calculateCarrierTier(tierInput);

        return {
          ...result,
          companyName: company.name,
          dotNumber: company.dotNumber,
          mcNumber: company.mcNumber,
        };
      } catch (e) {
        console.error("[CarrierTier] getCarrierTier error:", e);
        return null;
      }
    }),

  // 2. Get all tier definitions
  getTierDefinitions: protectedProcedure
    .query(async () => {
      return getAllTierDefinitions();
    }),

  // 3. Get tier benefits for a specific tier
  getTierBenefits: protectedProcedure
    .input(z.object({ tier: z.enum(["gold", "silver", "bronze", "standard"]) }))
    .query(async ({ input }) => {
      const def = TIER_DEFINITIONS[input.tier];
      return {
        tier: input.tier,
        name: def.name,
        benefits: def.benefits,
        platformFeeDiscount: def.platformFeeDiscount,
        priorityMatchBoost: def.priorityMatchBoost,
        analyticsAccess: def.analyticsAccess,
        loadAccessTier: def.loadAccessTier,
      };
    }),

  // 4. Batch tier lookup — for carrier lists and comparisons
  batchGetTiers: protectedProcedure
    .input(z.object({ carrierIds: z.array(z.number()).min(1).max(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const results: Array<{ carrierId: number; companyName: string; tier: string; compositeScore: number; dotNumber: string | null }> = [];

      for (const cid of input.carrierIds) {
        try {
          const [company] = await db.select({
            id: companies.id,
            name: companies.name,
            dotNumber: companies.dotNumber,
            createdAt: companies.createdAt,
          }).from(companies).where(eq(companies.id, cid)).limit(1);
          if (!company) continue;

          // Simplified scoring for batch (no FMCSA lookup for speed)
          const [stats] = await db.select({
            total: sql<number>`count(*)`,
            onTime: sql<number>`SUM(CASE WHEN ${loads.actualDeliveryDate} <= ${loads.estimatedDeliveryDate} OR ${loads.actualDeliveryDate} IS NULL THEN 1 ELSE 0 END)`,
            delivered: sql<number>`SUM(CASE WHEN ${loads.status} = 'delivered' THEN 1 ELSE 0 END)`,
          }).from(loads).where(eq(loads.catalystId, cid));

          const totalLoads = stats?.total || 0;
          const onTimeRate = totalLoads > 0 ? Math.round(((stats?.onTime || 0) / totalLoads) * 100) : 100;
          const completionRate = totalLoads > 0 ? Math.round(((stats?.delivered || 0) / totalLoads) * 100) : 100;
          const tenureMonths = company.createdAt
            ? Math.round((Date.now() - new Date(company.createdAt).getTime()) / (30 * 86400000))
            : 0;

          const tierInput: CarrierTierInput = {
            carrierId: cid,
            scorecardOverall: Math.round(onTimeRate * 0.5 + completionRate * 0.5),
            onTimeRate,
            safetyScore: 80, // default for batch
            complianceScore: 80,
            completionRate,
            avgReviewRating: 4.0,
            reviewCount: 0,
            fmcsaRiskTier: "UNKNOWN",
            fmcsaRiskScore: 0,
            tenureMonths,
            totalLoads,
            recentLoads90d: 0,
          };

          const result = calculateCarrierTier(tierInput);
          results.push({
            carrierId: cid,
            companyName: company.name,
            tier: result.tier,
            compositeScore: result.compositeScore,
            dotNumber: company.dotNumber,
          });
        } catch { continue; }
      }

      return results;
    }),

  // 5. Get dispatch boost for a carrier (used by auto-dispatch)
  getDispatchBoost: protectedProcedure
    .input(z.object({ tier: z.string() }))
    .query(async ({ input }) => {
      return {
        tier: input.tier,
        boost: getTierDispatchBoost(input.tier),
        feeDiscount: getTierFeeDiscount(input.tier),
      };
    }),

  // 6. Get tier distribution — admin analytics
  getTierDistribution: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return { gold: 0, silver: 0, bronze: 0, standard: 0, total: 0 };

      try {
        // Get all active carriers
        const carriers = await db.select({
          id: companies.id,
          createdAt: companies.createdAt,
        }).from(companies).where(sql`${companies.dotNumber} IS NOT NULL`).limit(500);

        const distribution = { gold: 0, silver: 0, bronze: 0, standard: 0, total: carriers.length };

        for (const carrier of carriers) {
          const [stats] = await db.select({
            total: sql<number>`count(*)`,
            onTime: sql<number>`SUM(CASE WHEN ${loads.actualDeliveryDate} <= ${loads.estimatedDeliveryDate} OR ${loads.actualDeliveryDate} IS NULL THEN 1 ELSE 0 END)`,
            delivered: sql<number>`SUM(CASE WHEN ${loads.status} = 'delivered' THEN 1 ELSE 0 END)`,
          }).from(loads).where(eq(loads.catalystId, carrier.id));

          const totalLoads = stats?.total || 0;
          const onTimeRate = totalLoads > 0 ? Math.round(((stats?.onTime || 0) / totalLoads) * 100) : 100;
          const completionRate = totalLoads > 0 ? Math.round(((stats?.delivered || 0) / totalLoads) * 100) : 100;
          const tenureMonths = carrier.createdAt
            ? Math.round((Date.now() - new Date(carrier.createdAt).getTime()) / (30 * 86400000))
            : 0;

          const tierInput: CarrierTierInput = {
            carrierId: carrier.id,
            scorecardOverall: Math.round(onTimeRate * 0.5 + completionRate * 0.5),
            onTimeRate,
            safetyScore: 80,
            complianceScore: 80,
            completionRate,
            avgReviewRating: 4.0,
            reviewCount: 0,
            fmcsaRiskTier: "UNKNOWN",
            fmcsaRiskScore: 0,
            tenureMonths,
            totalLoads,
            recentLoads90d: 0,
          };

          const result = calculateCarrierTier(tierInput);
          distribution[result.tier]++;
        }

        return distribution;
      } catch (e) {
        console.error("[CarrierTier] getTierDistribution error:", e);
        return { gold: 0, silver: 0, bronze: 0, standard: 0, total: 0 };
      }
    }),
});
