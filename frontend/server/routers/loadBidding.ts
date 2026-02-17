/**
 * EUSOBID — ENHANCED LOAD BIDDING ROUTER
 * Full bidding system with counter-offer chains, auto-accept rules,
 * multi-round negotiations, and agreement-linked bidding.
 * Platform fee applies per-load transaction — bidding is business between users.
 */

import { z } from "zod";
import { eq, and, desc, sql, or, gte, lte } from "drizzle-orm";
import { auditedProtectedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  loadBids,
  bidAutoAcceptRules,
  loads,
  users,
  companies,
} from "../../drizzle/schema";

export const loadBiddingRouter = router({
  // --------------------------------------------------------------------------
  // BIDS
  // --------------------------------------------------------------------------

  /** Get all bids for a specific load */
  getByLoad: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const conditions: any[] = [eq(loadBids.loadId, input.loadId)];
        if (input.status) conditions.push(eq(loadBids.status, input.status as any));

        const bids = await db.select().from(loadBids)
          .where(and(...conditions))
          .orderBy(desc(loadBids.createdAt));

        // Enrich with bidder info
        const enriched = await Promise.all(bids.map(async (bid) => {
          const [bidder] = await db.select({ id: users.id, name: users.name, role: users.role })
            .from(users).where(eq(users.id, bid.bidderUserId));
          let company = null;
          if (bid.bidderCompanyId) {
            const [c] = await db.select({ id: companies.id, name: companies.name, dotNumber: companies.dotNumber })
              .from(companies).where(eq(companies.id, bid.bidderCompanyId));
            company = c || null;
          }
          return { ...bid, bidder: bidder || null, company };
        }));

        return enriched;
      } catch (e) { return []; }
    }),

  /** Get bids submitted by current user */
  getMyBids: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { bids: [], total: 0 };
      try {
        const userId = ctx.user?.id;
        if (!userId) return { bids: [], total: 0 };

        const conditions: any[] = [eq(loadBids.bidderUserId, userId)];
        if (input.status) conditions.push(eq(loadBids.status, input.status as any));

        const whereClause = and(...conditions);
        const [results, countResult] = await Promise.all([
          db.select().from(loadBids)
            .where(whereClause)
            .orderBy(desc(loadBids.createdAt))
            .limit(input.limit)
            .offset(input.offset),
          db.select({ count: sql<number>`count(*)` }).from(loadBids).where(whereClause),
        ]);

        return { bids: results, total: countResult[0]?.count || 0 };
      } catch (e) { return { bids: [], total: 0 }; }
    }),

  /** Get bids received on my loads */
  getReceivedBids: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const userId = ctx.user?.id;
        if (!userId) return [];

        // Get loads owned by this user
        const myLoads = await db.select({ id: loads.id }).from(loads)
          .where(eq(loads.shipperId, userId));
        const loadIds = myLoads.map(l => l.id);
        if (loadIds.length === 0) return [];

        const conditions: any[] = [];
        if (input.status) conditions.push(eq(loadBids.status, input.status as any));

        // Get bids on those loads
        const bids = await db.select().from(loadBids)
          .where(and(
            sql`${loadBids.loadId} IN (${sql.join(loadIds.map(id => sql`${id}`), sql`,`)})`,
            ...conditions
          ))
          .orderBy(desc(loadBids.createdAt))
          .limit(input.limit);

        return bids;
      } catch (e) { return []; }
    }),

  /** Bidding stats for dashboard */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { submitted: 0, received: 0, pending: 0, accepted: 0, winRate: 0, avgBid: 0 };
      try {
        const userId = ctx.user?.id;
        if (!userId) return { submitted: 0, received: 0, pending: 0, accepted: 0, winRate: 0, avgBid: 0 };

        const [submitted, pending, accepted] = await Promise.all([
          db.select({ count: sql<number>`count(*)` }).from(loadBids)
            .where(eq(loadBids.bidderUserId, userId)),
          db.select({ count: sql<number>`count(*)` }).from(loadBids)
            .where(and(eq(loadBids.bidderUserId, userId), eq(loadBids.status, "pending"))),
          db.select({ count: sql<number>`count(*)` }).from(loadBids)
            .where(and(eq(loadBids.bidderUserId, userId), eq(loadBids.status, "accepted"))),
        ]);

        const totalSub = submitted[0]?.count || 0;
        const totalAcc = accepted[0]?.count || 0;
        const winRate = totalSub > 0 ? Math.round((totalAcc / totalSub) * 100) : 0;

        return {
          submitted: totalSub,
          received: 0,
          pending: pending[0]?.count || 0,
          accepted: totalAcc,
          winRate,
          avgBid: 0,
        };
      } catch (e) {
        return { submitted: 0, received: 0, pending: 0, accepted: 0, winRate: 0, avgBid: 0 };
      }
    }),

  /** Submit a new bid on a load */
  submit: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      bidAmount: z.number(),
      rateType: z.enum(["flat", "per_mile", "per_hour", "per_ton", "percentage"]).default("flat"),
      equipmentType: z.string().optional(),
      estimatedPickup: z.string().optional(),
      estimatedDelivery: z.string().optional(),
      transitTimeDays: z.number().optional(),
      fuelSurchargeIncluded: z.boolean().optional(),
      accessorialsIncluded: z.array(z.string()).optional(),
      conditions: z.string().optional(),
      agreementId: z.number().optional(),
      expiresInHours: z.number().default(24),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + input.expiresInHours);

      const result = await db.insert(loadBids).values({
        loadId: input.loadId,
        bidderUserId: ctx.user!.id,
        bidderCompanyId: ctx.user?.companyId || null,
        bidderRole: (ctx.user?.role?.toLowerCase() || "catalyst") as any,
        bidAmount: input.bidAmount.toString(),
        rateType: input.rateType,
        equipmentType: input.equipmentType,
        estimatedPickup: input.estimatedPickup ? new Date(input.estimatedPickup) : null,
        estimatedDelivery: input.estimatedDelivery ? new Date(input.estimatedDelivery) : null,
        transitTimeDays: input.transitTimeDays,
        fuelSurchargeIncluded: input.fuelSurchargeIncluded || false,
        accessorialsIncluded: input.accessorialsIncluded || [],
        conditions: input.conditions,
        agreementId: input.agreementId,
        bidRound: 1,
        status: "pending",
        expiresAt,
      }).$returningId();

      // Check auto-accept rules
      const autoAccepted = await checkAutoAcceptRules(db, input.loadId, input.bidAmount, ctx.user!.id);
      if (autoAccepted) {
        await db.update(loadBids)
          .set({ status: "auto_accepted", isAutoAccepted: true, respondedAt: new Date() })
          .where(eq(loadBids.id, result[0]!.id));
        return { id: result[0]?.id, status: "auto_accepted" };
      }

      return { id: result[0]?.id, status: "pending" };
    }),

  /** Counter-offer on a bid */
  counter: protectedProcedure
    .input(z.object({
      parentBidId: z.number(),
      loadId: z.number(),
      counterAmount: z.number(),
      rateType: z.enum(["flat", "per_mile", "per_hour", "per_ton", "percentage"]).default("flat"),
      conditions: z.string().optional(),
      expiresInHours: z.number().default(24),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Get parent bid round
      const [parentBid] = await db.select().from(loadBids).where(eq(loadBids.id, input.parentBidId));
      const newRound = (parentBid?.bidRound || 1) + 1;

      // Mark parent bid as countered
      await db.update(loadBids)
        .set({ status: "countered", respondedAt: new Date(), respondedBy: ctx.user!.id })
        .where(eq(loadBids.id, input.parentBidId));

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + input.expiresInHours);

      const result = await db.insert(loadBids).values({
        loadId: input.loadId,
        bidderUserId: ctx.user!.id,
        bidderCompanyId: ctx.user?.companyId || null,
        bidderRole: (ctx.user?.role?.toLowerCase() || "catalyst") as any,
        bidAmount: input.counterAmount.toString(),
        rateType: input.rateType,
        parentBidId: input.parentBidId,
        bidRound: newRound,
        conditions: input.conditions,
        status: "pending",
        expiresAt,
      }).$returningId();

      return { id: result[0]?.id, round: newRound, status: "pending" };
    }),

  /** Accept a bid */
  accept: protectedProcedure
    .input(z.object({ bidId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [bid] = await db.select().from(loadBids).where(eq(loadBids.id, input.bidId));
      if (!bid) throw new Error("Bid not found");

      // Accept this bid
      await db.update(loadBids)
        .set({ status: "accepted", respondedAt: new Date(), respondedBy: ctx.user!.id })
        .where(eq(loadBids.id, input.bidId));

      // Reject all other pending bids on the same load
      await db.update(loadBids)
        .set({ status: "rejected", rejectionReason: "Another bid was accepted" })
        .where(and(
          eq(loadBids.loadId, bid.loadId),
          eq(loadBids.status, "pending"),
          sql`${loadBids.id} != ${input.bidId}`
        ));

      // Update load status to assigned and set catalyst
      await db.update(loads)
        .set({ status: "assigned", catalystId: bid.bidderUserId, rate: bid.bidAmount })
        .where(eq(loads.id, bid.loadId));

      return { success: true, status: "accepted", loadId: bid.loadId };
    }),

  /** Reject a bid */
  reject: protectedProcedure
    .input(z.object({
      bidId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.update(loadBids)
        .set({ status: "rejected", rejectionReason: input.reason, respondedAt: new Date(), respondedBy: ctx.user!.id })
        .where(eq(loadBids.id, input.bidId));
      return { success: true, status: "rejected" };
    }),

  /** Withdraw a bid */
  withdraw: protectedProcedure
    .input(z.object({ bidId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.update(loadBids)
        .set({ status: "withdrawn" })
        .where(and(eq(loadBids.id, input.bidId), eq(loadBids.bidderUserId, ctx.user!.id)));
      return { success: true, status: "withdrawn" };
    }),

  /** Get bid history chain (all rounds) for a load */
  getBidChain: protectedProcedure
    .input(z.object({ loadId: z.number(), rootBidId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        return await db.select().from(loadBids)
          .where(eq(loadBids.loadId, input.loadId))
          .orderBy(loadBids.bidRound, loadBids.createdAt);
      } catch (e) { return []; }
    }),

  // --------------------------------------------------------------------------
  // AUTO-ACCEPT RULES
  // --------------------------------------------------------------------------

  /** List auto-accept rules for current user */
  listAutoAcceptRules: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const userId = ctx.user?.id;
        if (!userId) return [];
        return await db.select().from(bidAutoAcceptRules)
          .where(eq(bidAutoAcceptRules.userId, userId))
          .orderBy(desc(bidAutoAcceptRules.createdAt));
      } catch (e) { return []; }
    }),

  /** Create auto-accept rule */
  createAutoAcceptRule: protectedProcedure
    .input(z.object({
      name: z.string(),
      maxRate: z.number().optional(),
      maxRatePerMile: z.number().optional(),
      minCatalystRating: z.number().optional(),
      requiredInsuranceMin: z.number().optional(),
      requiredEquipmentTypes: z.array(z.string()).optional(),
      requiredHazmat: z.boolean().optional(),
      maxTransitDays: z.number().optional(),
      preferredCatalystIds: z.array(z.number()).optional(),
      originStates: z.array(z.string()).optional(),
      destinationStates: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const result = await db.insert(bidAutoAcceptRules).values({
        userId: ctx.user!.id,
        companyId: ctx.user?.companyId || null,
        name: input.name,
        maxRate: input.maxRate?.toString(),
        maxRatePerMile: input.maxRatePerMile?.toString(),
        minCatalystRating: input.minCatalystRating?.toString(),
        requiredInsuranceMin: input.requiredInsuranceMin?.toString(),
        requiredEquipmentTypes: input.requiredEquipmentTypes || [],
        requiredHazmat: input.requiredHazmat || false,
        maxTransitDays: input.maxTransitDays,
        preferredCatalystIds: input.preferredCatalystIds || [],
        originStates: input.originStates || [],
        destinationStates: input.destinationStates || [],
        isActive: true,
      }).$returningId();

      return { id: result[0]?.id, success: true };
    }),

  /** Toggle auto-accept rule active/inactive */
  toggleAutoAcceptRule: protectedProcedure
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.update(bidAutoAcceptRules)
        .set({ isActive: input.isActive })
        .where(eq(bidAutoAcceptRules.id, input.id));
      return { success: true };
    }),

  /** Delete auto-accept rule */
  deleteAutoAcceptRule: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.delete(bidAutoAcceptRules).where(eq(bidAutoAcceptRules.id, input.id));
      return { success: true };
    }),
});

// ============================================================================
// AUTO-ACCEPT CHECK
// ============================================================================
async function checkAutoAcceptRules(
  db: any,
  loadId: number,
  bidAmount: number,
  bidderId: number,
): Promise<boolean> {
  try {
    // Get the load to find the shipper
    const [load] = await db.select().from(loads).where(eq(loads.id, loadId));
    if (!load) return false;

    // Get auto-accept rules for the load owner
    const rules = await db.select().from(bidAutoAcceptRules)
      .where(and(
        eq(bidAutoAcceptRules.userId, load.shipperId),
        eq(bidAutoAcceptRules.isActive, true)
      ));

    for (const rule of rules) {
      let matches = true;

      // Check max rate
      if (rule.maxRate && bidAmount > parseFloat(rule.maxRate)) {
        matches = false;
      }

      // Check preferred catalysts
      if (rule.preferredCatalystIds && (rule.preferredCatalystIds as number[]).length > 0) {
        if (!(rule.preferredCatalystIds as number[]).includes(bidderId)) {
          matches = false;
        }
      }

      if (matches) {
        // Increment auto-accept count
        await db.update(bidAutoAcceptRules)
          .set({ totalAutoAccepted: sql`${bidAutoAcceptRules.totalAutoAccepted} + 1` })
          .where(eq(bidAutoAcceptRules.id, rule.id));
        return true;
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}
