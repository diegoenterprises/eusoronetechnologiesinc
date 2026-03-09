/**
 * EUSOBID — ENHANCED LOAD BIDDING ROUTER
 * Full bidding system with counter-offer chains, auto-accept rules,
 * multi-round negotiations, and agreement-linked bidding.
 * Platform fee applies per-load transaction — bidding is business between users.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, sql, or, gte, lte } from "drizzle-orm";
import { isolatedApprovedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { requireAccess } from "../services/security/rbac/access-check";
import { getInsuranceStatus } from "../services/fmcsaBulkLookup";
import {
  loadBids,
  bidAutoAcceptRules,
  loads,
  users,
  companies,
  auditLogs,
  insurancePolicies,
} from "../../drizzle/schema";
import { fmcsaService } from "../services/fmcsa";

// Map platform roles to valid load_bids.bidderRole enum values
function roleToBidderRole(role?: string): "catalyst" | "broker" | "driver" | "escort" {
  const r = (role || "").toUpperCase();
  if (r === "BROKER") return "broker";
  if (r === "DRIVER") return "driver";
  if (r === "ESCORT") return "escort";
  return "catalyst"; // CATALYST, DISPATCH, ADMIN, SHIPPER, etc. all bid as catalyst
}

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

  /** Bidding stats for dashboard — comprehensive analytics */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const empty = { submitted: 0, received: 0, pending: 0, accepted: 0, rejected: 0, countered: 0, expired: 0, winRate: 0, avgBid: 0, totalWonValue: 0, avgResponseTimeHrs: 0, autoAccepted: 0, bidsByMonth: [] as { month: string; count: number; won: number }[] };
      const db = await getDb();
      if (!db) return empty;
      try {
        const userId = ctx.user?.id;
        if (!userId) return empty;

        const [submitted, pending, accepted, rejected, countered, expired, autoAcc, avgBidRes, wonValueRes] = await Promise.all([
          db.select({ count: sql<number>`count(*)` }).from(loadBids).where(eq(loadBids.bidderUserId, userId)),
          db.select({ count: sql<number>`count(*)` }).from(loadBids).where(and(eq(loadBids.bidderUserId, userId), eq(loadBids.status, "pending"))),
          db.select({ count: sql<number>`count(*)` }).from(loadBids).where(and(eq(loadBids.bidderUserId, userId), or(eq(loadBids.status, "accepted"), eq(loadBids.status, "auto_accepted")))),
          db.select({ count: sql<number>`count(*)` }).from(loadBids).where(and(eq(loadBids.bidderUserId, userId), eq(loadBids.status, "rejected"))),
          db.select({ count: sql<number>`count(*)` }).from(loadBids).where(and(eq(loadBids.bidderUserId, userId), eq(loadBids.status, "countered"))),
          db.select({ count: sql<number>`count(*)` }).from(loadBids).where(and(eq(loadBids.bidderUserId, userId), eq(loadBids.status, "expired"))),
          db.select({ count: sql<number>`count(*)` }).from(loadBids).where(and(eq(loadBids.bidderUserId, userId), eq(loadBids.isAutoAccepted, true))),
          db.select({ avg: sql<number>`COALESCE(AVG(CAST(${loadBids.bidAmount} AS DECIMAL)), 0)` }).from(loadBids).where(eq(loadBids.bidderUserId, userId)),
          db.select({ total: sql<number>`COALESCE(SUM(CAST(${loadBids.bidAmount} AS DECIMAL)), 0)` }).from(loadBids).where(and(eq(loadBids.bidderUserId, userId), or(eq(loadBids.status, "accepted"), eq(loadBids.status, "auto_accepted")))),
        ]);

        const totalSub = submitted[0]?.count || 0;
        const totalAcc = accepted[0]?.count || 0;
        const winRate = totalSub > 0 ? Math.round((totalAcc / totalSub) * 100) : 0;

        // Monthly bid trends (last 6 months)
        let bidsByMonth: { month: string; count: number; won: number }[] = [];
        try {
          const monthRows = await db.select({
            month: sql<string>`DATE_FORMAT(${loadBids.createdAt}, '%Y-%m')`,
            count: sql<number>`count(*)`,
            won: sql<number>`SUM(CASE WHEN ${loadBids.status} IN ('accepted','auto_accepted') THEN 1 ELSE 0 END)`,
          }).from(loadBids).where(eq(loadBids.bidderUserId, userId)).groupBy(sql`DATE_FORMAT(${loadBids.createdAt}, '%Y-%m')`).orderBy(sql`DATE_FORMAT(${loadBids.createdAt}, '%Y-%m') DESC`).limit(6);
          bidsByMonth = monthRows.reverse().map(r => ({ month: r.month, count: r.count || 0, won: r.won || 0 }));
        } catch {}

        // Received bids (bids on user's loads)
        let received = 0;
        try {
          const myLoadIds = await db.select({ id: loads.id }).from(loads).where(eq(loads.shipperId, userId));
          if (myLoadIds.length > 0) {
            const [rc] = await db.select({ count: sql<number>`count(*)` }).from(loadBids).where(sql`${loadBids.loadId} IN (${sql.join(myLoadIds.map(l => sql`${l.id}`), sql`,`)})`);
            received = rc?.count || 0;
          }
        } catch {}

        return {
          submitted: totalSub,
          received,
          pending: pending[0]?.count || 0,
          accepted: totalAcc,
          rejected: rejected[0]?.count || 0,
          countered: countered[0]?.count || 0,
          expired: expired[0]?.count || 0,
          winRate,
          avgBid: Math.round(avgBidRes[0]?.avg || 0),
          totalWonValue: Math.round(wonValueRes[0]?.total || 0),
          autoAccepted: autoAcc[0]?.count || 0,
          avgResponseTimeHrs: 0,
          bidsByMonth,
        };
      } catch (e) {
        return { submitted: 0, received: 0, pending: 0, accepted: 0, rejected: 0, countered: 0, expired: 0, winRate: 0, avgBid: 0, totalWonValue: 0, avgResponseTimeHrs: 0, autoAccepted: 0, bidsByMonth: [] };
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
      await requireAccess({ userId: ctx.user?.id, role: ctx.user?.role || 'CATALYST', companyId: (ctx.user as any)?.companyId, action: 'CREATE', resource: 'BID' }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // WS-P1-004: Prevent duplicate bids from same user on same load
      const [existingBid] = await db.select({ id: loadBids.id }).from(loadBids)
        .where(and(eq(loadBids.loadId, input.loadId), eq(loadBids.bidderUserId, ctx.user!.id), sql`${loadBids.status} NOT IN ('withdrawn', 'expired')`))
        .limit(1);
      if (existingBid) {
        throw new TRPCError({ code: 'CONFLICT', message: 'You have already submitted a bid on this load. Withdraw your existing bid first.' });
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + input.expiresInHours);

      const result = await db.insert(loadBids).values({
        loadId: input.loadId,
        bidderUserId: ctx.user!.id,
        bidderCompanyId: ctx.user?.companyId || null,
        bidderRole: roleToBidderRole(ctx.user?.role),
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

      // Auto-index bid for AI semantic search (fire-and-forget)
      try {
        const { indexLoad } = await import("../services/embeddings/aiTurbocharge");
        indexLoad({ id: result[0]?.id, loadNumber: `BID-${result[0]?.id}`, commodity: `Bid $${input.bidAmount} ${input.rateType} on load ${input.loadId}`, origin: input.equipmentType || "", destination: "", status: "pending" });
      } catch {}

      // AI Turbocharge: Fraud scoring on bid (fire-and-forget enrichment)
      let aiFraudCheck: any = null;
      try {
        const { scoreBid } = await import("../services/ai/fraudScorer");
        const recentBids = await db.select({ amount: loadBids.bidAmount }).from(loadBids)
          .where(eq(loadBids.loadId, input.loadId)).limit(50);
        const historicalAmounts = recentBids.map(b => parseFloat(String(b.amount)) || 0).filter(v => v > 0);
        const marketAvg = historicalAmounts.length > 0 ? historicalAmounts.reduce((a, b) => a + b, 0) / historicalAmounts.length : input.bidAmount;
        aiFraudCheck = scoreBid(input.bidAmount, historicalAmounts, marketAvg);
      } catch {}

      // ── WebSocket: notify shipper of new bid ──
      try {
        const { emitBidReceived, emitNotification } = await import("../_core/websocket");
        const [bidLoad] = await db.select({ loadNumber: loads.loadNumber, shipperId: loads.shipperId }).from(loads).where(eq(loads.id, input.loadId)).limit(1);
        emitBidReceived({
          bidId: String(result[0]?.id),
          loadId: String(input.loadId),
          loadNumber: bidLoad?.loadNumber || `LOAD-${input.loadId}`,
          catalystId: String(ctx.user!.id),
          catalystName: ctx.user?.name || "Carrier",
          amount: input.bidAmount,
          status: "pending",
          timestamp: new Date().toISOString(),
        });
        if (bidLoad?.shipperId) {
          emitNotification(String(bidLoad.shipperId), {
            id: `notif_bid_${Date.now()}`,
            type: "bid_received",
            title: "New Bid Received",
            message: `${ctx.user?.name || "A carrier"} bid $${input.bidAmount.toLocaleString()} on load ${bidLoad.loadNumber}`,
            priority: "high",
            data: { loadId: String(input.loadId), bidId: String(result[0]?.id), amount: input.bidAmount },
            timestamp: new Date().toISOString(),
          });
        }
      } catch { /* non-critical */ }

      return { id: result[0]?.id, status: "pending", aiFraudCheck };
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
        bidderRole: roleToBidderRole(ctx.user?.role),
        bidAmount: input.counterAmount.toString(),
        rateType: input.rateType,
        parentBidId: input.parentBidId,
        bidRound: newRound,
        conditions: input.conditions,
        status: "pending",
        expiresAt,
      }).$returningId();

      // ── WebSocket: notify of counter-offer ──
      try {
        const { emitBidReceived } = await import("../_core/websocket");
        const [counterLoad] = await db.select({ loadNumber: loads.loadNumber }).from(loads).where(eq(loads.id, input.loadId)).limit(1);
        emitBidReceived({
          bidId: String(result[0]?.id),
          loadId: String(input.loadId),
          loadNumber: counterLoad?.loadNumber || `LOAD-${input.loadId}`,
          catalystId: String(ctx.user!.id),
          catalystName: ctx.user?.name || "User",
          amount: input.counterAmount,
          status: "countered",
          timestamp: new Date().toISOString(),
        });
      } catch { /* non-critical */ }

      return { id: result[0]?.id, round: newRound, status: "pending" };
    }),

  /** Accept a bid */
  accept: protectedProcedure
    .input(z.object({ bidId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: ctx.user?.role || 'SHIPPER', companyId: (ctx.user as any)?.companyId, action: 'APPROVE', resource: 'BID' }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [bid] = await db.select().from(loadBids).where(eq(loadBids.id, input.bidId));
      if (!bid) throw new Error("Bid not found");

      // === WS-P0-005R: COMPLIANCE GATE — FMCSA Safety + Operating Authority ===
      const [bidderUser] = await db.select().from(users).where(eq(users.id, bid.bidderUserId)).limit(1);
      const bidderCompanyId = (bidderUser as any)?.companyId;
      let bidderCompany: any = null;

      if (bidderCompanyId) {
        const [co] = await db.select().from(companies).where(eq(companies.id, bidderCompanyId)).limit(1);
        bidderCompany = co;
      }

      if (!bidderCompany || !bidderCompany.dotNumber) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Carrier must have a registered DOT number' });
      }

      // FMCSA safety rating + operating authority check
      try {
        const verification = await fmcsaService.verifyCatalyst(bidderCompany.dotNumber);
        if (verification.safetyRating?.rating === 'Unsatisfactory') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Carrier has Unsatisfactory FMCSA safety rating' });
        }
        const activeAuth = verification.authorities?.some(a => a.authorityStatus === 'ACTIVE');
        if (verification.authorities?.length > 0 && !activeAuth) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Carrier operating authority is not active' });
        }
        logger.info(`[Bidding] Compliance gate PASSED: DOT#${bidderCompany.dotNumber}, safety=${verification.safetyRating?.rating || 'N/A'}`);
      } catch (fmcsaErr: any) {
        if (fmcsaErr?.code === 'FORBIDDEN') throw fmcsaErr;
        logger.warn('[Bidding] FMCSA check warning (non-blocking):', fmcsaErr?.message);
      }

      // Log compliance decision
      try {
        await db.insert(auditLogs).values({
          action: 'compliance_gate_passed',
          entityType: 'load_bid',
          entityId: input.bidId,
          userId: ctx.user?.id,
          changes: JSON.stringify({ dotNumber: bidderCompany.dotNumber, bidderUserId: bid.bidderUserId }),
          severity: 'LOW',
        });
      } catch { /* non-critical */ }
      // === END COMPLIANCE GATE ===

      // === WS-P0-006R: INSURANCE ENFORCEMENT GATE ===
      const [load] = await db.select().from(loads).where(eq(loads.id, bid.loadId)).limit(1);
      try {
        // Check platform insurance policies (insurancePolicies table)
        const activePolicies = await db.select().from(insurancePolicies)
          .where(and(
            eq(insurancePolicies.companyId, bidderCompany.id),
            eq(insurancePolicies.status, 'active'),
            gte(insurancePolicies.expirationDate, new Date()),
          ));

        if (!activePolicies.length) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Carrier has no valid insurance certificates' });
        }

        // Require auto_liability + cargo for all loads
        const hasAutoLiability = activePolicies.some(p => p.policyType === 'auto_liability');
        const hasCargo = activePolicies.some(p => p.policyType === 'cargo' || p.policyType === 'motor_truck_cargo');
        if (!hasAutoLiability || !hasCargo) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Carrier missing required insurance coverage (auto liability + cargo)' });
        }

        // For hazmat loads, require hazmat endorsement
        const isHazmat = (load as any)?.[0]?.hazmatClass || (load as any)?.hazmatClass;
        const cargoType = (load as any)?.cargoType?.toLowerCase?.() || '';
        if (isHazmat || cargoType.includes('crude') || cargoType.includes('hazmat')) {
          const hasHazmatIns = activePolicies.some(p =>
            p.policyType === 'hazmat_endorsement' || p.hazmatCoverage ||
            (p.endorsements as string[] || []).some?.((e: string) => e.toLowerCase().includes('hazmat'))
          );
          if (!hasHazmatIns) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Hazmat load requires hazmat insurance endorsement' });
          }
        }

        // Check minimum $1M coverage (combinedSingleLimit or perOccurrenceLimit)
        const maxCoverage = Math.max(...activePolicies.map(p =>
          parseFloat(p.combinedSingleLimit || '0') || parseFloat(p.perOccurrenceLimit || '0') || 0
        ));
        if (maxCoverage > 0 && maxCoverage < 1_000_000) {
          throw new TRPCError({ code: 'FORBIDDEN', message: `Insurance coverage ($${maxCoverage.toLocaleString()}) below minimum ($1,000,000)` });
        }

        // Also check FMCSA BIPD for hazmat loads
        if (isHazmat && bidderCompany.dotNumber) {
          const HAZMAT_INS_MIN: Record<string, number> = {
            '1': 5000000, '2': 5000000, '3': 5000000, '4': 5000000,
            '5': 5000000, '6': 5000000, '7': 5000000, '8': 5000000, '9': 1000000,
          };
          const hzClass = typeof isHazmat === 'string' ? isHazmat : '';
          const requiredMin = HAZMAT_INS_MIN[hzClass] || 1000000;
          const insStatus = await getInsuranceStatus(bidderCompany.dotNumber);
          const insAmount = insStatus?.bipdLimit || 0;
          if (insAmount > 0 && insAmount < requiredMin) {
            throw new TRPCError({ code: 'FORBIDDEN', message: `FMCSA BIPD ($${(insAmount / 1000000).toFixed(1)}M) below required ($${(requiredMin / 1000000).toFixed(0)}M) for Hazmat Class ${hzClass}` });
          }
        }

        logger.info(`[Bidding] Insurance gate PASSED: ${activePolicies.length} active policies, maxCoverage=$${maxCoverage.toLocaleString()}`);
      } catch (insErr: any) {
        if (insErr?.code === 'FORBIDDEN') throw insErr;
        logger.warn('[Bidding] Insurance check warning:', insErr?.message);
      }
      // === END INSURANCE GATE ===

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

      // ── WebSocket: notify bidder of acceptance ──
      try {
        const { emitBidAwarded, emitNotification: emitNotif } = await import("../_core/websocket");
        const [accLoad] = await db.select({ loadNumber: loads.loadNumber }).from(loads).where(eq(loads.id, bid.loadId)).limit(1);
        emitBidAwarded({
          bidId: String(bid.id),
          loadId: String(bid.loadId),
          loadNumber: accLoad?.loadNumber || `LOAD-${bid.loadId}`,
          catalystId: String(bid.bidderUserId),
          catalystName: "",
          amount: parseFloat(String(bid.bidAmount)),
          status: "accepted",
          timestamp: new Date().toISOString(),
        });
        emitNotif(String(bid.bidderUserId), {
          id: `notif_acc_${Date.now()}`,
          type: "bid_accepted",
          title: "Bid Accepted!",
          message: `Your bid of $${bid.bidAmount} on load ${accLoad?.loadNumber || bid.loadId} was accepted`,
          priority: "high",
          data: { loadId: String(bid.loadId), bidId: String(bid.id) },
          timestamp: new Date().toISOString(),
        });
      } catch { /* non-critical */ }

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
      const [rejBid] = await db.select().from(loadBids).where(eq(loadBids.id, input.bidId)).limit(1);
      await db.update(loadBids)
        .set({ status: "rejected", rejectionReason: input.reason, respondedAt: new Date(), respondedBy: ctx.user!.id })
        .where(eq(loadBids.id, input.bidId));

      // ── WebSocket: notify bidder of rejection ──
      if (rejBid) {
        try {
          const { emitNotification: emitRejNotif } = await import("../_core/websocket");
          const [rejLoad] = await db.select({ loadNumber: loads.loadNumber }).from(loads).where(eq(loads.id, rejBid.loadId)).limit(1);
          emitRejNotif(String(rejBid.bidderUserId), {
            id: `notif_rej_${Date.now()}`,
            type: "bid_rejected",
            title: "Bid Not Selected",
            message: `Your bid on load ${rejLoad?.loadNumber || rejBid.loadId} was not selected`,
            priority: "medium",
            data: { loadId: String(rejBid.loadId), bidId: String(rejBid.id) },
            timestamp: new Date().toISOString(),
          });
        } catch { /* non-critical */ }
      }

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
