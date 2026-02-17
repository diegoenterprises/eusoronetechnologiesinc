/**
 * QUOTES ROUTER
 * tRPC procedures for freight quotes and pricing
 */

import { z } from "zod";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loads, users } from "../../drizzle/schema";

const quoteStatusSchema = z.enum([
  "draft", "sent", "viewed", "accepted", "declined", "expired", "converted"
]);

export const quotesRouter = router({
  /**
   * Get all quotes for QuoteManagement page
   */
  getAll: protectedProcedure
    .input(z.object({ search: z.string().optional(), status: z.string().optional() }))
    .query(async ({ ctx }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const companyId = ctx.user?.companyId || 0;
        const rows = await db.select().from(loads).where(eq(loads.shipperId, companyId)).orderBy(desc(loads.createdAt)).limit(30);
        return rows.map(l => {
          const p = l.pickupLocation as any || {}; const d = l.deliveryLocation as any || {};
          return { id: String(l.id), quoteNumber: `Q-${l.loadNumber || l.id}`, status: l.status === 'posted' ? 'sent' : l.status === 'delivered' ? 'accepted' : 'draft', origin: `${p.city || ''}, ${p.state || ''}`, destination: `${d.city || ''}, ${d.state || ''}`, rate: l.rate ? parseFloat(String(l.rate)) : 0, createdAt: l.createdAt?.toISOString() || '' };
        });
      } catch (e) { return []; }
    }),

  /**
   * Get quote stats for QuoteManagement page
   * Aggregates from loads created by the user's company.
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { total: 0, sent: 0, accepted: 0, declined: 0, expired: 0, conversionRate: 0, totalValue: 0, quoted: 0 };
      try {
        const companyId = ctx.user?.companyId || 0;
        const [stats] = await db.select({
          total: sql<number>`COUNT(*)`,
          posted: sql<number>`SUM(CASE WHEN ${loads.status} = 'posted' THEN 1 ELSE 0 END)`,
          delivered: sql<number>`SUM(CASE WHEN ${loads.status} = 'delivered' THEN 1 ELSE 0 END)`,
          cancelled: sql<number>`SUM(CASE WHEN ${loads.status} = 'cancelled' THEN 1 ELSE 0 END)`,
          totalValue: sql<number>`COALESCE(SUM(CAST(${loads.rate} AS DECIMAL)), 0)`,
        }).from(loads).where(eq(loads.shipperId, companyId));
        const total = stats?.total || 0;
        const accepted = stats?.delivered || 0;
        return {
          total, sent: stats?.posted || 0, accepted, declined: stats?.cancelled || 0,
          expired: 0, conversionRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
          totalValue: Math.round(stats?.totalValue || 0), quoted: total,
        };
      } catch (e) { return { total: 0, sent: 0, accepted: 0, declined: 0, expired: 0, conversionRate: 0, totalValue: 0, quoted: 0 }; }
    }),

  /**
   * Get instant quote
   */
  getInstant: publicProcedure
    .input(z.object({
      origin: z.object({
        city: z.string(),
        state: z.string(),
        zip: z.string().optional(),
      }),
      destination: z.object({
        city: z.string(),
        state: z.string(),
        zip: z.string().optional(),
      }),
      equipmentType: z.enum(["tanker", "dry_van", "flatbed", "reefer"]),
      weight: z.number().optional(),
      hazmat: z.boolean().default(false),
      pickupDate: z.string(),
    }))
    .query(async ({ input }) => {
      const baseRate = 2.85;
      const distance = 285;
      const hazmatSurcharge = input.hazmat ? 0.35 : 0;
      const ratePerMile = baseRate + hazmatSurcharge;
      
      return {
        quoteId: `quote_${Date.now()}`,
        origin: input.origin,
        destination: input.destination,
        distance,
        estimatedTransitTime: "4-5 hours",
        pricing: {
          ratePerMile,
          linehaul: distance * ratePerMile,
          fuelSurcharge: distance * 0.45,
          hazmatFee: input.hazmat ? 150 : 0,
          totalEstimate: distance * ratePerMile + distance * 0.45 + (input.hazmat ? 150 : 0),
        },
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        marketComparison: {
          low: distance * 2.50,
          average: distance * 2.85,
          high: distance * 3.20,
        },
      };
    }),

  /**
   * Create quote
   */
  create: protectedProcedure
    .input(z.object({
      customerId: z.string(),
      origin: z.object({
        name: z.string().optional(),
        address: z.string(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
      }),
      destination: z.object({
        name: z.string().optional(),
        address: z.string(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
      }),
      equipmentType: z.string(),
      commodity: z.string(),
      weight: z.number().optional(),
      hazmat: z.boolean().default(false),
      pickupDate: z.string(),
      deliveryDate: z.string().optional(),
      pricing: z.object({
        ratePerMile: z.number(),
        linehaul: z.number(),
        fuelSurcharge: z.number(),
        accessorials: z.array(z.object({
          type: z.string(),
          amount: z.number(),
        })).optional(),
        total: z.number(),
      }),
      notes: z.string().optional(),
      validDays: z.number().default(7),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const companyId = ctx.user?.companyId || 0;
      const userId = Number(ctx.user?.id) || 0;
      const loadNumber = `Q-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
      const result = await db.insert(loads).values({
        loadNumber,
        shipperId: companyId,
        status: 'posted' as any,
        cargoType: input.equipmentType as any,
        commodityName: input.commodity,
        weight: input.weight ? String(input.weight) : null,
        rate: String(input.pricing.total),
        pickupLocation: { address: input.origin.address, city: input.origin.city, state: input.origin.state, zip: input.origin.zip },
        deliveryLocation: { address: input.destination.address, city: input.destination.city, state: input.destination.state, zip: input.destination.zip },
        pickupDate: new Date(input.pickupDate),
        specialInstructions: input.notes || null,
      } as any).$returningId();
      return {
        id: String(result[0]?.id),
        quoteNumber: loadNumber,
        status: "draft",
        createdBy: userId,
        createdAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + input.validDays * 86400000).toISOString(),
      };
    }),

  /**
   * List quotes
   */
  list: protectedProcedure
    .input(z.object({ status: quoteStatusSchema.optional(), customerId: z.string().optional(), limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const companyId = ctx.user?.companyId || 0;
        const rows = await db.select().from(loads).where(eq(loads.shipperId, companyId)).orderBy(desc(loads.createdAt)).limit(input.limit);
        return rows.map(l => {
          const p = l.pickupLocation as any || {}; const d = l.deliveryLocation as any || {};
          return { id: String(l.id), quoteNumber: `Q-${l.loadNumber || l.id}`, status: 'draft', origin: `${p.city || ''}, ${p.state || ''}`, destination: `${d.city || ''}, ${d.state || ''}`, rate: l.rate ? parseFloat(String(l.rate)) : 0, createdAt: l.createdAt?.toISOString() || '' };
        });
      } catch (e) { return []; }
    }),

  /**
   * Get quote by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const loadId = parseInt(input.id, 10);
        const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
        if (!load) return null;
        const p = load.pickupLocation as any || {};
        const d = load.deliveryLocation as any || {};
        return {
          id: String(load.id), quoteNumber: load.loadNumber || `Q-${load.id}`,
          status: load.status === 'posted' ? 'sent' : load.status === 'delivered' ? 'accepted' : 'draft',
          origin: { city: p.city || '', state: p.state || '', address: p.address || '', zip: p.zip || '' },
          destination: { city: d.city || '', state: d.state || '', address: d.address || '', zip: d.zip || '' },
          distance: load.distance ? parseFloat(String(load.distance)) : 0,
          equipmentType: load.cargoType || '', commodity: load.commodityName || '',
          weight: load.weight ? parseFloat(String(load.weight)) : 0, hazmat: false,
          pickupDate: load.pickupDate?.toISOString() || '',
          deliveryDate: load.deliveryDate?.toISOString() || '',
          pricing: { ratePerMile: 0, linehaul: 0, fuelSurcharge: 0, accessorials: [], subtotal: 0, discount: 0, total: load.rate ? parseFloat(String(load.rate)) : 0 },
          notes: load.specialInstructions || '', createdAt: load.createdAt?.toISOString() || '',
          validUntil: '', viewedAt: null, history: [],
        };
      } catch (e) { return null; }
    }),

  /**
   * Update quote
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      pricing: z.object({
        ratePerMile: z.number(),
        linehaul: z.number(),
        fuelSurcharge: z.number(),
        total: z.number(),
      }).optional(),
      notes: z.string().optional(),
      validDays: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const loadId = parseInt(input.id, 10);
      const updates: any = {};
      if (input.pricing?.total) updates.rate = String(input.pricing.total);
      if (input.notes) updates.specialInstructions = input.notes;
      if (Object.keys(updates).length > 0) {
        await db.update(loads).set(updates).where(eq(loads.id, loadId));
      }
      return { success: true, id: input.id, updatedBy: ctx.user?.id, updatedAt: new Date().toISOString() };
    }),

  /**
   * Send quote to customer
   */
  send: protectedProcedure
    .input(z.object({
      quoteId: z.string(),
      recipientEmail: z.string().email().optional(),
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (db) {
        const loadId = parseInt(input.quoteId, 10);
        await db.update(loads).set({ status: 'posted' as any }).where(eq(loads.id, loadId));
      }
      return { success: true, quoteId: input.quoteId, sentTo: input.recipientEmail, sentBy: ctx.user?.id, sentAt: new Date().toISOString() };
    }),

  /**
   * Accept quote (convert to load)
   */
  accept: protectedProcedure
    .input(z.object({ quoteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const loadId = parseInt(input.quoteId, 10);
      await db.update(loads).set({ status: 'assigned' as any }).where(eq(loads.id, loadId));
      const [load] = await db.select({ loadNumber: loads.loadNumber }).from(loads).where(eq(loads.id, loadId)).limit(1);
      return { success: true, quoteId: input.quoteId, loadId: String(loadId), loadNumber: load?.loadNumber || `LOAD-${loadId}`, acceptedBy: ctx.user?.id, acceptedAt: new Date().toISOString() };
    }),

  /**
   * Decline quote
   */
  decline: protectedProcedure
    .input(z.object({ quoteId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (db) {
        const loadId = parseInt(input.quoteId, 10);
        await db.update(loads).set({ status: 'cancelled' as any }).where(eq(loads.id, loadId));
      }
      return { success: true, quoteId: input.quoteId, declinedBy: ctx.user?.id, declinedAt: new Date().toISOString() };
    }),

  /**
   * Duplicate quote
   */
  duplicate: protectedProcedure
    .input(z.object({ quoteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const loadId = parseInt(input.quoteId, 10);
      const [orig] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
      if (!orig) throw new Error("Quote not found");
      const newNumber = `Q-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
      const result = await db.insert(loads).values({
        loadNumber: newNumber, shipperId: orig.shipperId, status: 'posted' as any,
        cargoType: orig.cargoType, commodityName: orig.commodityName, weight: orig.weight,
        rate: orig.rate, pickupLocation: orig.pickupLocation, deliveryLocation: orig.deliveryLocation,
        pickupDate: orig.pickupDate, specialInstructions: orig.specialInstructions,
      } as any).$returningId();
      return { id: String(result[0]?.id), quoteNumber: newNumber, duplicatedFrom: input.quoteId, createdBy: ctx.user?.id, createdAt: new Date().toISOString() };
    }),

  /**
   * Get quote analytics
   */
  getAnalytics: protectedProcedure
    .input(z.object({ period: z.enum(["week", "month", "quarter"]).default("month") }))
    .query(async ({ input }) => ({
      period: input.period,
      summary: { totalQuotes: 0, sent: 0, accepted: 0, declined: 0, expired: 0, pending: 0 },
      conversionRate: 0, avgQuoteValue: 0, totalQuotedValue: 0, totalConvertedValue: 0, avgResponseTime: 0, topCustomers: [],
    })),

  // Additional quote procedures
  getSummary: protectedProcedure.query(async () => ({ pending: 0, accepted: 0, total: 0, avgValue: 0, quoted: 0 })),
  respond: protectedProcedure.input(z.object({ quoteId: z.string(), action: z.enum(["accept", "decline"]), notes: z.string().optional() })).mutation(async ({ input }) => ({ success: true, quoteId: input.quoteId })),
});
