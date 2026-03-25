/**
 * BID REVIEW & AWARD PROCESS ROUTER (GAP-062 Task 11.2)
 * 100% Dynamic — All queries use real DB tables.
 */

import { z } from "zod";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import {
  companies, rfps, rfpLanes, rfpBids, rfpLaneBids,
  rfpCounterOffers, rfpAwards,
} from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { unsafeCast } from "../_core/types/unsafe";
import { generateBidComparisons, generateBidAnalytics, type AwardDecision } from "../services/BidReviewEngine";

export const bidReviewRouter = router({
  /**
   * Get side-by-side bid comparisons for an RFP
   */
  getBidComparisons: protectedProcedure
    .input(z.object({ rfpId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const numericId = parseInt(input.rfpId.replace(/\D/g, ""), 10) || 0;

        // Get lanes
        const lanes = await db.select().from(rfpLanes).where(eq(rfpLanes.rfpId, numericId));
        if (lanes.length === 0) return [];

        // Get bids with lane bids
        const bids = await db.select().from(rfpBids).where(eq(rfpBids.rfpId, numericId));
        if (bids.length === 0) return [];

        const bidIds = bids.map(b => b.id);
        const laneBidRows = await db
          .select()
          .from(rfpLaneBids)
          .where(sql`${rfpLaneBids.bidId} IN (${sql.join(bidIds.map(id => sql`${id}`), sql`, `)})`);

        // Get carrier names
        const carrierIds = bids.map(b => b.carrierId);
        const carrierRows = await db
          .select({ id: companies.id, name: companies.name })
          .from(companies)
          .where(sql`${companies.id} IN (${sql.join(carrierIds.map(id => sql`${id}`), sql`, `)})`);
        const carrierMap = new Map(carrierRows.map(c => [c.id, c.name]));

        const formattedLanes = lanes.map(l => ({
          id: `LANE-${l.id}`,
          origin: { city: l.originCity, state: l.originState },
          destination: { city: l.destinationCity, state: l.destinationState },
          targetRate: l.targetRate ? Number(l.targetRate) : null,
          frequencyPerWeek: l.frequencyPerWeek || 1,
        }));

        const formattedBids = bids.map(b => ({
          carrierId: b.carrierId,
          carrierName: carrierMap.get(b.carrierId) || `Carrier #${b.carrierId}`,
          carrierTier: b.carrierTier || "Standard",
          laneBids: laneBidRows
            .filter(lb => lb.bidId === b.id)
            .map(lb => ({
              laneId: `LANE-${lb.laneId}`,
              bidRate: Number(lb.bidRate),
              transitDays: lb.transitDays || 1,
              capacityPerWeek: lb.capacityPerWeek || 1,
            })),
        }));

        return generateBidComparisons(formattedLanes, formattedBids);
      } catch (e) {
        logger.error("[BidReview] getBidComparisons error:", e);
        return [];
      }
    }),

  /**
   * Get counter-offers for an RFP
   */
  getCounterOffers: protectedProcedure
    .input(z.object({ rfpId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const numericId = parseInt(input.rfpId.replace(/\D/g, ""), 10) || 0;

        const rows = await db
          .select()
          .from(rfpCounterOffers)
          .where(eq(rfpCounterOffers.rfpId, numericId))
          .orderBy(desc(rfpCounterOffers.createdAt));

        // Get carrier names
        const carrierIds = Array.from(new Set(rows.map(r => r.carrierId)));
        const carrierMap = new Map<number, string>();
        if (carrierIds.length > 0) {
          const carrierRows = await db
            .select({ id: companies.id, name: companies.name })
            .from(companies)
            .where(sql`${companies.id} IN (${sql.join(carrierIds.map(id => sql`${id}`), sql`, `)})`);
          for (const c of carrierRows) carrierMap.set(c.id, c.name);
        }

        return rows.map(r => ({
          id: `CO-${r.id}`,
          rfpId: `RFP-${r.rfpId}`,
          laneId: `LANE-${r.laneId}`,
          carrierId: r.carrierId,
          carrierName: carrierMap.get(r.carrierId) || `Carrier #${r.carrierId}`,
          originalRate: Number(r.originalRate) || 0,
          counterRate: Number(r.counterRate) || 0,
          counterMessage: r.message || "",
          status: r.status || "pending",
          createdAt: new Date(r.createdAt).toISOString(),
          respondedAt: r.respondedAt ? new Date(r.respondedAt).toISOString() : null,
          carrierResponse: r.carrierResponse || null,
        }));
      } catch (e) {
        logger.error("[BidReview] getCounterOffers error:", e);
        return [];
      }
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
      originalRate: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const numericRfpId = parseInt(input.rfpId.replace(/\D/g, ""), 10) || 0;
      const numericLaneId = parseInt(input.laneId.replace(/\D/g, ""), 10) || 0;

      if (db && numericRfpId > 0) {
        try {
          const [result] = await db.insert(rfpCounterOffers).values({
            rfpId: numericRfpId,
            laneId: numericLaneId,
            carrierId: input.carrierId,
            originalRate: String(input.originalRate || 0),
            counterRate: String(input.counterRate),
            message: input.message,
            status: "pending",
          });

          return {
            success: true,
            counterOffer: {
              id: `CO-${unsafeCast(result).insertId}`,
              rfpId: input.rfpId,
              laneId: input.laneId,
              carrierId: input.carrierId,
              counterRate: input.counterRate,
              message: input.message,
              status: "pending",
              createdAt: new Date().toISOString(),
            },
          };
        } catch (e) {
          logger.error("[BidReview] sendCounterOffer error:", e);
        }
      }

      return { success: false, counterOffer: null };
    }),

  /**
   * Get award decisions for an RFP
   */
  getAwards: protectedProcedure
    .input(z.object({ rfpId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const numericId = parseInt(input.rfpId.replace(/\D/g, ""), 10) || 0;

        const rows = await db
          .select()
          .from(rfpAwards)
          .where(eq(rfpAwards.rfpId, numericId))
          .orderBy(desc(rfpAwards.createdAt));

        // Get carrier names and lane info
        const carrierIds = Array.from(new Set(rows.map(r => r.carrierId)));
        const laneIds = Array.from(new Set(rows.map(r => r.laneId)));
        const carrierMap = new Map<number, string>();
        const laneMap = new Map<number, any>();

        if (carrierIds.length > 0) {
          const carrierRows = await db
            .select({ id: companies.id, name: companies.name })
            .from(companies)
            .where(sql`${companies.id} IN (${sql.join(carrierIds.map(id => sql`${id}`), sql`, `)})`);
          for (const c of carrierRows) carrierMap.set(c.id, c.name);
        }

        if (laneIds.length > 0) {
          const laneRows = await db
            .select()
            .from(rfpLanes)
            .where(sql`${rfpLanes.id} IN (${sql.join(laneIds.map(id => sql`${id}`), sql`, `)})`);
          for (const l of laneRows) laneMap.set(l.id, l);
        }

        // Get RFP for contract dates
        const [rfp] = await db.select().from(rfps).where(eq(rfps.id, numericId)).limit(1);

        return rows.map(r => {
          const lane = laneMap.get(r.laneId);
          return {
            rfpId: `RFP-${r.rfpId}`,
            laneId: `LANE-${r.laneId}`,
            carrierId: r.carrierId,
            carrierName: carrierMap.get(r.carrierId) || `Carrier #${r.carrierId}`,
            carrierTier: "",
            awardedRate: Number(r.awardedRate),
            rateType: (r.rateType || "flat") as "flat" | "per_mile",
            savingsVsTarget: Number(r.savingsVsTarget) || 0,
            savingsVsAvgBid: Number(r.savingsVsAvgBid) || 0,
            contractStartDate: rfp?.contractStartDate || "",
            contractEndDate: rfp?.contractEndDate || "",
            annualValue: Number(r.annualValue) || (Number(r.awardedRate) * (lane?.annualVolume || 0)),
            status: r.status || "pending_review",
            awardedAt: r.awardedAt ? new Date(r.awardedAt).toISOString() : new Date(r.createdAt).toISOString(),
            notes: r.notes || "",
          } as AwardDecision;
        });
      } catch (e) {
        logger.error("[BidReview] getAwards error:", e);
        return [];
      }
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
      const db = await getDb();
      const numericRfpId = parseInt(input.rfpId.replace(/\D/g, ""), 10) || 0;
      const numericLaneId = parseInt(input.laneId.replace(/\D/g, ""), 10) || 0;

      if (db && numericRfpId > 0) {
        try {
          const [result] = await db.insert(rfpAwards).values({
            rfpId: numericRfpId,
            laneId: numericLaneId,
            carrierId: input.carrierId,
            awardedRate: String(input.awardedRate),
            status: "awarded",
            notes: input.notes || null,
            awardedAt: new Date(),
          });

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
        } catch (e) {
          logger.error("[BidReview] awardLane error:", e);
        }
      }

      return { success: false, award: null };
    }),

  /**
   * Get bid review analytics
   */
  getAnalytics: protectedProcedure
    .input(z.object({ rfpId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const numericId = parseInt(input.rfpId.replace(/\D/g, ""), 10) || 0;

        // Get lanes
        const lanes = await db.select().from(rfpLanes).where(eq(rfpLanes.rfpId, numericId));
        if (lanes.length === 0) return null;

        // Get bids
        const bids = await db.select().from(rfpBids).where(eq(rfpBids.rfpId, numericId));
        const bidIds = bids.map(b => b.id);
        const laneBidRows = bidIds.length > 0
          ? await db.select().from(rfpLaneBids)
              .where(sql`${rfpLaneBids.bidId} IN (${sql.join(bidIds.map(id => sql`${id}`), sql`, `)})`)
          : [];

        // Get awards
        const awards = await db.select().from(rfpAwards).where(eq(rfpAwards.rfpId, numericId));

        // Get carrier names for awards
        const awardCarrierIds = Array.from(new Set(awards.map(a => a.carrierId)));
        const carrierMap = new Map<number, string>();
        if (awardCarrierIds.length > 0) {
          const carrierRows = await db
            .select({ id: companies.id, name: companies.name })
            .from(companies)
            .where(sql`${companies.id} IN (${sql.join(awardCarrierIds.map(id => sql`${id}`), sql`, `)})`);
          for (const c of carrierRows) carrierMap.set(c.id, c.name);
        }

        const formattedBids = bids.map(b => ({
          carrierTier: b.carrierTier || "Standard",
          laneBids: laneBidRows
            .filter(lb => lb.bidId === b.id)
            .map(lb => ({ bidRate: Number(lb.bidRate) })),
        }));

        const formattedLanes = lanes.map(l => ({
          targetRate: l.targetRate ? Number(l.targetRate) : null,
        }));

        const formattedAwards: AwardDecision[] = awards.map(a => ({
          rfpId: `RFP-${a.rfpId}`,
          laneId: `LANE-${a.laneId}`,
          carrierId: a.carrierId,
          carrierName: carrierMap.get(a.carrierId) || `Carrier #${a.carrierId}`,
          carrierTier: "",
          awardedRate: Number(a.awardedRate),
          rateType: (a.rateType || "flat") as "flat" | "per_mile",
          savingsVsTarget: Number(a.savingsVsTarget) || 0,
          savingsVsAvgBid: Number(a.savingsVsAvgBid) || 0,
          contractStartDate: "",
          contractEndDate: "",
          annualValue: Number(a.annualValue) || 0,
          status: (a.status || "pending_review") as AwardDecision["status"],
          awardedAt: a.awardedAt ? new Date(a.awardedAt).toISOString() : "",
          notes: a.notes || "",
        }));

        return generateBidAnalytics(formattedBids, formattedLanes, formattedAwards);
      } catch (e) {
        logger.error("[BidReview] getAnalytics error:", e);
        return null;
      }
    }),
});
