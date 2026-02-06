/**
 * EUSONEGOTIATE — RATE & TERMS NEGOTIATION ROUTER
 * Thread-based negotiations between two parties for loads, lanes,
 * contract terms, fuel surcharges, accessorials, and volume commitments.
 */

import { z } from "zod";
import { eq, and, desc, sql, or } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  negotiations,
  negotiationMessages,
  users,
  companies,
} from "../../drizzle/schema";

function generateNegotiationNumber(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 99999).toString().padStart(5, "0");
  return `NEG-${year}-${seq}`;
}

export const rateNegotiationsRouter = router({
  /** List negotiations for current user */
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      type: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { negotiations: [], total: 0 };
      try {
        const userId = ctx.user?.id;
        if (!userId) return { negotiations: [], total: 0 };

        const conditions: any[] = [
          or(
            eq(negotiations.initiatorUserId, userId),
            eq(negotiations.respondentUserId, userId)
          ),
        ];
        if (input.status) {
          if (input.status === "active") {
            conditions.push(
              or(
                eq(negotiations.status, "open"),
                eq(negotiations.status, "awaiting_response"),
                eq(negotiations.status, "counter_offered")
              )
            );
          } else {
            conditions.push(eq(negotiations.status, input.status as any));
          }
        }
        if (input.type) conditions.push(eq(negotiations.negotiationType, input.type as any));

        const whereClause = and(...conditions);
        const [results, countResult] = await Promise.all([
          db.select().from(negotiations)
            .where(whereClause)
            .orderBy(desc(negotiations.updatedAt))
            .limit(input.limit)
            .offset(input.offset),
          db.select({ count: sql<number>`count(*)` }).from(negotiations).where(whereClause),
        ]);

        // Enrich with party names
        const enriched = await Promise.all(results.map(async (neg) => {
          const [initiator] = await db.select({ id: users.id, name: users.name, role: users.role })
            .from(users).where(eq(users.id, neg.initiatorUserId));
          const [respondent] = await db.select({ id: users.id, name: users.name, role: users.role })
            .from(users).where(eq(users.id, neg.respondentUserId));
          return { ...neg, initiator: initiator || null, respondent: respondent || null };
        }));

        return { negotiations: enriched, total: countResult[0]?.count || 0 };
      } catch (e) { return { negotiations: [], total: 0 }; }
    }),

  /** Get negotiation by ID with full message history */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const [neg] = await db.select().from(negotiations).where(eq(negotiations.id, input.id));
        if (!neg) return null;

        const [msgs, initiator, respondent] = await Promise.all([
          db.select().from(negotiationMessages)
            .where(eq(negotiationMessages.negotiationId, input.id))
            .orderBy(negotiationMessages.createdAt),
          db.select({ id: users.id, name: users.name, email: users.email, role: users.role })
            .from(users).where(eq(users.id, neg.initiatorUserId)),
          db.select({ id: users.id, name: users.name, email: users.email, role: users.role })
            .from(users).where(eq(users.id, neg.respondentUserId)),
        ]);

        // Enrich messages with sender names
        const enrichedMsgs = await Promise.all(msgs.map(async (msg) => {
          const [sender] = await db.select({ id: users.id, name: users.name })
            .from(users).where(eq(users.id, msg.senderUserId));
          return { ...msg, sender: sender || null };
        }));

        return {
          ...neg,
          initiator: initiator[0] || null,
          respondent: respondent[0] || null,
          messages: enrichedMsgs,
        };
      } catch (e) { return null; }
    }),

  /** Negotiation stats */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { active: 0, pending: 0, agreed: 0, rejected: 0, expired: 0, winRate: 0, avgRounds: 0, totalNegotiated: 0 };
      try {
        const userId = ctx.user?.id;
        if (!userId) return { active: 0, pending: 0, agreed: 0, rejected: 0, expired: 0, winRate: 0, avgRounds: 0, totalNegotiated: 0 };

        const userFilter = or(eq(negotiations.initiatorUserId, userId), eq(negotiations.respondentUserId, userId));

        const [active, pending, agreed, rejected, expired] = await Promise.all([
          db.select({ count: sql<number>`count(*)` }).from(negotiations)
            .where(and(userFilter, or(eq(negotiations.status, "open"), eq(negotiations.status, "awaiting_response"), eq(negotiations.status, "counter_offered")))),
          db.select({ count: sql<number>`count(*)` }).from(negotiations)
            .where(and(userFilter, eq(negotiations.status, "awaiting_response"))),
          db.select({ count: sql<number>`count(*)` }).from(negotiations)
            .where(and(userFilter, eq(negotiations.status, "agreed"))),
          db.select({ count: sql<number>`count(*)` }).from(negotiations)
            .where(and(userFilter, eq(negotiations.status, "rejected"))),
          db.select({ count: sql<number>`count(*)` }).from(negotiations)
            .where(and(userFilter, eq(negotiations.status, "expired"))),
        ]);

        const totalAgreed = agreed[0]?.count || 0;
        const totalRejected = rejected[0]?.count || 0;
        const total = totalAgreed + totalRejected;
        const winRate = total > 0 ? Math.round((totalAgreed / total) * 100) : 0;

        return {
          active: active[0]?.count || 0,
          pending: pending[0]?.count || 0,
          agreed: totalAgreed,
          rejected: totalRejected,
          expired: expired[0]?.count || 0,
          winRate,
          avgRounds: 0,
          totalNegotiated: 0,
        };
      } catch (e) {
        return { active: 0, pending: 0, agreed: 0, rejected: 0, expired: 0, winRate: 0, avgRounds: 0, totalNegotiated: 0 };
      }
    }),

  /** Initiate a new negotiation */
  initiate: protectedProcedure
    .input(z.object({
      negotiationType: z.enum([
        "load_rate", "lane_rate", "contract_terms", "fuel_surcharge",
        "accessorial_rates", "volume_commitment", "payment_terms", "general",
      ]),
      respondentUserId: z.number(),
      respondentCompanyId: z.number().optional(),
      loadId: z.number().optional(),
      agreementId: z.number().optional(),
      laneContractId: z.number().optional(),
      subject: z.string(),
      description: z.string().optional(),
      initialOffer: z.number().optional(),
      offerRateType: z.string().optional(),
      offerTerms: z.record(z.string(), z.unknown()).optional(),
      message: z.string().optional(),
      responseDeadlineHours: z.number().default(48),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const negotiationNumber = generateNegotiationNumber();
      const responseDeadline = new Date();
      responseDeadline.setHours(responseDeadline.getHours() + input.responseDeadlineHours);

      const currentOffer = input.initialOffer ? {
        amount: input.initialOffer,
        rateType: input.offerRateType || "flat",
        terms: (input.offerTerms || {}) as Record<string, unknown>,
        proposedBy: ctx.user!.id,
        proposedAt: new Date().toISOString(),
      } : null;

      const negResult = await db.insert(negotiations).values({
        negotiationNumber,
        negotiationType: input.negotiationType,
        loadId: input.loadId,
        agreementId: input.agreementId,
        laneContractId: input.laneContractId,
        initiatorUserId: ctx.user!.id,
        initiatorCompanyId: ctx.user?.companyId || null,
        respondentUserId: input.respondentUserId,
        respondentCompanyId: input.respondentCompanyId,
        subject: input.subject,
        description: input.description,
        currentOffer,
        totalRounds: 1,
        status: "awaiting_response",
        responseDeadline,
      }).$returningId();

      const negId = negResult[0]!.id;

      // Create initial message/offer
      await db.insert(negotiationMessages).values({
        negotiationId: negId,
        senderUserId: ctx.user!.id,
        round: 1,
        messageType: "initial_offer",
        content: input.message || `Initial offer: $${input.initialOffer || 0}`,
        offerAmount: input.initialOffer?.toString(),
        offerRateType: input.offerRateType,
        offerTerms: input.offerTerms || {},
      });

      return { id: negId, negotiationNumber, status: "awaiting_response" };
    }),

  /** Send counter-offer */
  counterOffer: protectedProcedure
    .input(z.object({
      negotiationId: z.number(),
      amount: z.number(),
      rateType: z.string().optional(),
      terms: z.record(z.string(), z.unknown()).optional(),
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [neg] = await db.select().from(negotiations).where(eq(negotiations.id, input.negotiationId));
      if (!neg) throw new Error("Negotiation not found");

      const newRound = (neg.totalRounds || 0) + 1;

      // Update negotiation
      const currentOffer = {
        amount: input.amount,
        rateType: input.rateType || "flat",
        terms: (input.terms || {}) as Record<string, unknown>,
        proposedBy: ctx.user!.id,
        proposedAt: new Date().toISOString(),
      };

      await db.update(negotiations).set({
        currentOffer,
        totalRounds: newRound,
        status: "counter_offered",
        responseDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
      }).where(eq(negotiations.id, input.negotiationId));

      // Create counter-offer message
      await db.insert(negotiationMessages).values({
        negotiationId: input.negotiationId,
        senderUserId: ctx.user!.id,
        round: newRound,
        messageType: "counter_offer",
        content: input.message || `Counter offer: $${input.amount}`,
        offerAmount: input.amount.toString(),
        offerRateType: input.rateType,
        offerTerms: input.terms || {},
      });

      return { success: true, round: newRound, status: "counter_offered" };
    }),

  /** Accept current offer */
  accept: protectedProcedure
    .input(z.object({
      negotiationId: z.number(),
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [neg] = await db.select().from(negotiations).where(eq(negotiations.id, input.negotiationId));
      if (!neg) throw new Error("Negotiation not found");

      await db.update(negotiations).set({
        status: "agreed",
        outcome: "accepted",
        agreedTerms: neg.currentOffer,
        resolvedAt: new Date(),
      }).where(eq(negotiations.id, input.negotiationId));

      // Create accept message
      await db.insert(negotiationMessages).values({
        negotiationId: input.negotiationId,
        senderUserId: ctx.user!.id,
        round: (neg.totalRounds || 0) + 1,
        messageType: "accept",
        content: input.message || "Offer accepted. Deal!",
      });

      return { success: true, status: "agreed", agreedTerms: neg.currentOffer };
    }),

  /** Reject negotiation */
  reject: protectedProcedure
    .input(z.object({
      negotiationId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [neg] = await db.select().from(negotiations).where(eq(negotiations.id, input.negotiationId));

      await db.update(negotiations).set({
        status: "rejected",
        outcome: "rejected",
        resolvedAt: new Date(),
      }).where(eq(negotiations.id, input.negotiationId));

      await db.insert(negotiationMessages).values({
        negotiationId: input.negotiationId,
        senderUserId: ctx.user!.id,
        round: (neg?.totalRounds || 0) + 1,
        messageType: "reject",
        content: input.reason || "Negotiation rejected.",
      });

      return { success: true, status: "rejected" };
    }),

  /** Send a plain message in negotiation thread */
  sendMessage: protectedProcedure
    .input(z.object({
      negotiationId: z.number(),
      content: z.string(),
      attachments: z.array(z.object({
        name: z.string(),
        url: z.string(),
        type: z.string(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [neg] = await db.select().from(negotiations).where(eq(negotiations.id, input.negotiationId));

      await db.insert(negotiationMessages).values({
        negotiationId: input.negotiationId,
        senderUserId: ctx.user!.id,
        round: neg?.totalRounds || 1,
        messageType: "message",
        content: input.content,
        attachments: input.attachments || [],
      });

      return { success: true };
    }),

  /** Get message history */
  getMessages: protectedProcedure
    .input(z.object({ negotiationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const msgs = await db.select().from(negotiationMessages)
          .where(eq(negotiationMessages.negotiationId, input.negotiationId))
          .orderBy(negotiationMessages.createdAt);

        const enriched = await Promise.all(msgs.map(async (msg) => {
          const [sender] = await db.select({ id: users.id, name: users.name })
            .from(users).where(eq(users.id, msg.senderUserId));
          return { ...msg, sender: sender || null };
        }));

        return enriched;
      } catch (e) { return []; }
    }),

  /** Mark messages as read */
  markRead: protectedProcedure
    .input(z.object({ negotiationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.update(negotiationMessages)
        .set({ isRead: true, readAt: new Date() })
        .where(and(
          eq(negotiationMessages.negotiationId, input.negotiationId),
          sql`${negotiationMessages.senderUserId} != ${ctx.user!.id}`,
          eq(negotiationMessages.isRead, false)
        ));
      return { success: true };
    }),
});
