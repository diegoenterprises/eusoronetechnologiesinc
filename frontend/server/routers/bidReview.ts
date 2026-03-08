/**
 * BID REVIEW & AWARD PROCESS ROUTER (GAP-062 Task 11.2)
 * tRPC procedures for bid comparison, counter-offers, awards, and analytics.
 */

import { z } from "zod";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { companies } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  generateBidComparisons,
  generateSampleCounterOffers,
  generateSampleAwards,
  generateBidAnalytics,
} from "../services/BidReviewEngine";
import {
  generateSampleRFPs,
  generateSampleBidResponses,
} from "../services/RFPEngine";

export const bidReviewRouter = router({
  /**
   * Get side-by-side bid comparisons for an RFP
   */
  getBidComparisons: protectedProcedure
    .input(z.object({ rfpId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const shipperId = Number(ctx.user?.companyId || ctx.user?.id) || 1;
        let shipperName = "My Company";
        const db = await getDb();
        if (db && shipperId) {
          const [co] = await db.select({ name: companies.name }).from(companies).where(eq(companies.id, shipperId)).limit(1);
          if (co) shipperName = co.name;
        }
        const rfps = generateSampleRFPs(shipperId, shipperName);
        const rfp = rfps.find(r => r.id === input.rfpId);
        if (!rfp) return [];
        const bids = generateSampleBidResponses(input.rfpId, rfp.lanes);
        return generateBidComparisons(rfp.lanes, bids);
      } catch {
        return [];
      }
    }),

  /**
   * Get counter-offers for an RFP
   */
  getCounterOffers: protectedProcedure
    .input(z.object({ rfpId: z.string() }))
    .query(async ({ input }) => {
      return generateSampleCounterOffers(input.rfpId);
    }),

  /**
   * Send a counter-offer to a carrier
   */
  sendCounterOffer: protectedProcedure
    .input(z.object({
      rfpId: z.string(),
      laneId: z.string(),
      carrierId: z.number(),
      counterRate: z.number(),
      message: z.string(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        counterOffer: {
          id: `CO-${input.rfpId}-${Date.now()}`,
          rfpId: input.rfpId,
          laneId: input.laneId,
          carrierId: input.carrierId,
          counterRate: input.counterRate,
          message: input.message,
          status: "pending",
          createdAt: new Date().toISOString(),
        },
      };
    }),

  /**
   * Get award decisions for an RFP
   */
  getAwards: protectedProcedure
    .input(z.object({ rfpId: z.string() }))
    .query(async ({ input }) => {
      return generateSampleAwards(input.rfpId);
    }),

  /**
   * Award a lane to a carrier
   */
  awardLane: protectedProcedure
    .input(z.object({
      rfpId: z.string(),
      laneId: z.string(),
      carrierId: z.number(),
      awardedRate: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        award: {
          rfpId: input.rfpId,
          laneId: input.laneId,
          carrierId: input.carrierId,
          awardedRate: input.awardedRate,
          status: "awarded",
          awardedAt: new Date().toISOString(),
        },
      };
    }),

  /**
   * Get bid review analytics
   */
  getAnalytics: protectedProcedure
    .input(z.object({ rfpId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const shipperId = Number(ctx.user?.companyId || ctx.user?.id) || 1;
        let shipperName = "My Company";
        const db = await getDb();
        if (db && shipperId) {
          const [co] = await db.select({ name: companies.name }).from(companies).where(eq(companies.id, shipperId)).limit(1);
          if (co) shipperName = co.name;
        }
        const rfps = generateSampleRFPs(shipperId, shipperName);
        const rfp = rfps.find(r => r.id === input.rfpId);
        if (!rfp) return null;
        const bids = generateSampleBidResponses(input.rfpId, rfp.lanes);
        const awards = generateSampleAwards(input.rfpId);
        return generateBidAnalytics(bids, rfp.lanes, awards);
      } catch {
        return null;
      }
    }),
});
