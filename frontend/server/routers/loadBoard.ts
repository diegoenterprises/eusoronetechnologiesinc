/**
 * LOAD BOARD ROUTER
 * tRPC procedures for internal and external load board functionality
 */

import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loads, companies } from "../../drizzle/schema";

const equipmentTypeSchema = z.enum(["tanker", "dry_van", "flatbed", "reefer", "step_deck", "lowboy"]);

export const loadBoardRouter = router({
  /**
   * Search available loads
   */
  search: publicProcedure
    .input(z.object({
      origin: z.object({
        city: z.string().optional(),
        state: z.string(),
        radius: z.number().default(50),
      }),
      destination: z.object({
        city: z.string().optional(),
        state: z.string(),
        radius: z.number().default(50),
      }).optional(),
      equipmentType: equipmentTypeSchema.optional(),
      pickupDateStart: z.string().optional(),
      pickupDateEnd: z.string().optional(),
      minRate: z.number().optional(),
      maxWeight: z.number().optional(),
      hazmat: z.boolean().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
      sortBy: z.enum(["rate", "distance", "pickup_date", "posted_date"]).default("posted_date"),
    }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return { loads: [], total: 0, marketStats: { avgRate: 0, totalLoads: 0, loadToTruckRatio: 0 } };
      try {
        const rows = await db.select().from(loads).where(sql`${loads.status} IN ('posted', 'available')`).orderBy(desc(loads.createdAt)).limit(input.limit);
        const [stats] = await db.select({ count: sql<number>`count(*)`, avgRate: sql<number>`COALESCE(AVG(CAST(${loads.rate} AS DECIMAL)), 0)` }).from(loads).where(sql`${loads.status} IN ('posted', 'available')`);
        return {
          loads: rows.map(l => {
            const pickup = l.pickupLocation as any || {};
            const delivery = l.deliveryLocation as any || {};
            return { id: String(l.id), loadNumber: l.loadNumber, status: l.status, origin: { city: pickup.city || '', state: pickup.state || '' }, destination: { city: delivery.city || '', state: delivery.state || '' }, rate: l.rate ? parseFloat(String(l.rate)) : 0, distance: l.distance ? parseFloat(String(l.distance)) : 0, weight: l.weight ? parseFloat(String(l.weight)) : 0, equipmentType: l.cargoType || '', hazmat: !!l.hazmatClass, postedAt: l.createdAt?.toISOString() || '' };
          }),
          total: stats?.count || 0,
          marketStats: { avgRate: Math.round(stats?.avgRate || 0), totalLoads: stats?.count || 0, loadToTruckRatio: 0 },
        };
      } catch (e) { console.error('[LoadBoard] search error:', e); return { loads: [], total: 0, marketStats: { avgRate: 0, totalLoads: 0, loadToTruckRatio: 0 } }; }
    }),

  /**
   * Get load details
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return null;
      try {
        const [load] = await db.select().from(loads).where(eq(loads.id, parseInt(input.id))).limit(1);
        if (!load) return null;
        const pickup = load.pickupLocation as any || {};
        const delivery = load.deliveryLocation as any || {};
        let shipperName = '';
        if (load.shipperId) {
          const [co] = await db.select({ name: companies.name }).from(companies).where(eq(companies.id, load.shipperId)).limit(1);
          shipperName = co?.name || '';
        }
        return { id: String(load.id), loadNumber: load.loadNumber, status: load.status, shipper: { name: shipperName }, origin: { city: pickup.city || '', state: pickup.state || '', address: pickup.address || '' }, destination: { city: delivery.city || '', state: delivery.state || '', address: delivery.address || '' }, distance: load.distance ? parseFloat(String(load.distance)) : 0, pricing: { rate: load.rate ? parseFloat(String(load.rate)) : 0 }, postedAt: load.createdAt?.toISOString() || '', postedBy: String(load.shipperId || '') };
      } catch (e) { console.error('[LoadBoard] getById error:', e); return null; }
    }),

  /**
   * Post load to board
   */
  postLoad: protectedProcedure
    .input(z.object({
      origin: z.object({
        facility: z.string(),
        address: z.string(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
        contact: z.string(),
        phone: z.string(),
      }),
      destination: z.object({
        facility: z.string(),
        address: z.string(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
        contact: z.string(),
        phone: z.string(),
      }),
      pickupDate: z.string(),
      deliveryDate: z.string(),
      commodity: z.string(),
      weight: z.number(),
      equipmentType: equipmentTypeSchema,
      hazmat: z.boolean().default(false),
      rate: z.number(),
      expiresIn: z.number().default(24),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `lb_${Date.now()}`,
        loadNumber: `LB-2025-${String(Date.now()).slice(-5)}`,
        status: "posted",
        postedBy: ctx.user?.id,
        postedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + input.expiresIn * 60 * 60 * 1000).toISOString(),
      };
    }),

  /**
   * Book load
   */
  bookLoad: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      vehicleId: z.string(),
      driverId: z.string(),
      agreedRate: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        bookingId: `book_${Date.now()}`,
        loadId: input.loadId,
        status: "booked",
        bookedBy: ctx.user?.id,
        bookedAt: new Date().toISOString(),
        confirmationNumber: `CONF-${String(Date.now()).slice(-6)}`,
      };
    }),

  /**
   * Request rate negotiation
   */
  negotiateRate: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      proposedRate: z.number(),
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        negotiationId: `neg_${Date.now()}`,
        loadId: input.loadId,
        proposedRate: input.proposedRate,
        status: "pending",
        submittedBy: ctx.user?.id,
        submittedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get my posted loads
   */
  getMyPostedLoads: protectedProcedure
    .input(z.object({ status: z.enum(["all", "active", "booked", "expired"]).default("all") }))
    .query(async ({ ctx }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const userId = ctx.user?.id || 0;
        const rows = await db.select().from(loads).where(eq(loads.shipperId, userId)).orderBy(desc(loads.createdAt)).limit(50);
        return rows.map(l => {
          const pickup = l.pickupLocation as any || {};
          const delivery = l.deliveryLocation as any || {};
          return { id: String(l.id), loadNumber: l.loadNumber, status: l.status, origin: pickup.city && pickup.state ? `${pickup.city}, ${pickup.state}` : '', destination: delivery.city && delivery.state ? `${delivery.city}, ${delivery.state}` : '', rate: l.rate ? parseFloat(String(l.rate)) : 0, postedAt: l.createdAt?.toISOString() || '' };
        });
      } catch (e) { return []; }
    }),

  /**
   * Get saved searches
   */
  getSavedSearches: protectedProcedure
    .query(async () => {
      // Saved searches require a dedicated table; return empty until schema supports it
      return [];
    }),

  /**
   * Save search
   */
  saveSearch: protectedProcedure
    .input(z.object({
      name: z.string(),
      criteria: z.object({
        origin: z.object({
          city: z.string().optional(),
          state: z.string(),
          radius: z.number(),
        }),
        destination: z.object({
          city: z.string().optional(),
          state: z.string(),
          radius: z.number(),
        }).optional(),
        equipmentType: equipmentTypeSchema.optional(),
        minRate: z.number().optional(),
      }),
      notifications: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `search_${Date.now()}`,
        name: input.name,
        savedBy: ctx.user?.id,
        savedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get load board alerts
   */
  getAlerts: protectedProcedure
    .query(async () => {
      // Load board alerts require a dedicated table; return empty until schema supports it
      return [];
    }),

  /**
   * Update load
   */
  updateLoad: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      rate: z.number().optional(),
      pickupDate: z.string().optional(),
      deliveryDate: z.string().optional(),
      expiresAt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        loadId: input.loadId,
        updatedBy: ctx.user?.id,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Cancel posted load
   */
  cancelLoad: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        loadId: input.loadId,
        cancelledBy: ctx.user?.id,
        cancelledAt: new Date().toISOString(),
      };
    }),

  /**
   * Get market rates
   */
  getMarketRates: protectedProcedure
    .input(z.object({
      origin: z.object({ city: z.string(), state: z.string() }),
      destination: z.object({ city: z.string(), state: z.string() }),
      equipmentType: equipmentTypeSchema,
    }))
    .query(async ({ input }) => {
      return {
        lane: `${input.origin.city}, ${input.origin.state} to ${input.destination.city}, ${input.destination.state}`,
        equipmentType: input.equipmentType,
        currentRate: {
          low: 2.80,
          average: 3.15,
          high: 3.50,
        },
        trend: {
          direction: "up",
          change: 0.10,
          period: "7 days",
        },
        volume: {
          daily: 45,
          weekly: 280,
        },
        recommendation: "Good time to book - rates trending up",
      };
    }),
});
