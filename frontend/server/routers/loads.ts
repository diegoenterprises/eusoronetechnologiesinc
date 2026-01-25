/**
 * LOADS ROUTER
 * tRPC procedures for load management
 * Connects to database for dynamic data
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loads, bids, users, companies } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const loadsRouter = router({
  /**
   * Get all loads with filtering and pagination
   */
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["draft", "posted", "bidding", "assigned", "in_transit", "delivered", "cancelled", "disputed"]).optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db
        .select()
        .from(loads)
        .$dynamic();

      if (input.status) {
        query = query.where(sql`${loads.status} = ${input.status}`);
      }

      const results = await query
        .orderBy(desc(loads.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return results;
    }),

  /**
   * Get single load by ID with full details (supports string or number ID)
   */
  getById: protectedProcedure
    .input(z.object({ id: z.union([z.string(), z.number()]) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        // Return mock data when database is not available
        return {
          id: input.id,
          loadNumber: "LOAD-45920",
          status: "in_transit",
          cargoType: "petroleum",
          hazmatClass: "3",
          unNumber: "UN1203",
          product: "Gasoline",
          weight: 42000,
          weightUnit: "lbs",
          volume: 8500,
          volumeUnit: "gal",
          origin: { address: "1234 Refinery Rd", city: "Houston", state: "TX", zip: "77001" },
          destination: { address: "5678 Industrial Blvd", city: "Dallas", state: "TX", zip: "75201" },
          pickupDate: "2025-01-24T08:00:00Z",
          deliveryDate: "2025-01-24T16:00:00Z",
          rate: 2450,
          distance: 240,
          shipper: { id: "s1", name: "Shell Oil Company" },
          carrier: { id: "c1", name: "ABC Transport LLC" },
          driver: { id: "d1", name: "Mike Johnson", phone: "(713) 555-0101" },
          currentLocation: { lat: 31.5493, lng: -97.1467, city: "Waco", state: "TX" },
          eta: "2:30 PM",
          createdAt: "2025-01-23T10:00:00Z",
        };
      }

      const loadId = typeof input.id === "string" ? parseInt(input.id, 10) : input.id;
      const result = await db
        .select()
        .from(loads)
        .where(eq(loads.id, loadId))
        .limit(1);

      return result[0] || null;
    }),

  /**
   * Create a new load
   */
  create: protectedProcedure
    .input(
      z.object({
        cargoType: z.enum(["general", "hazmat", "refrigerated", "oversized", "liquid", "gas", "chemicals", "petroleum"]),
        hazmatClass: z.string().optional(),
        unNumber: z.string().optional(),
        weight: z.number().optional(),
        weightUnit: z.string().default("lbs"),
        volume: z.number().optional(),
        volumeUnit: z.string().default("gal"),
        pickupLocation: z.object({
          address: z.string(),
          city: z.string(),
          state: z.string(),
          zipCode: z.string(),
          lat: z.number(),
          lng: z.number(),
        }),
        deliveryLocation: z.object({
          address: z.string(),
          city: z.string(),
          state: z.string(),
          zipCode: z.string(),
          lat: z.number(),
          lng: z.number(),
        }),
        pickupDate: z.date().optional(),
        deliveryDate: z.date().optional(),
        rate: z.number().optional(),
        currency: z.string().default("USD"),
        specialInstructions: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Generate unique load number
      const loadNumber = `LOAD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const result = await db.insert(loads).values({
        shipperId: ctx.user.id,
        loadNumber,
        status: "draft",
        cargoType: input.cargoType,
        hazmatClass: input.hazmatClass,
        unNumber: input.unNumber,
        weight: input.weight?.toString(),
        weightUnit: input.weightUnit,
        volume: input.volume?.toString(),
        volumeUnit: input.volumeUnit,
        pickupLocation: input.pickupLocation,
        deliveryLocation: input.deliveryLocation,
        pickupDate: input.pickupDate,
        deliveryDate: input.deliveryDate,
        rate: input.rate?.toString(),
        currency: input.currency,
        specialInstructions: input.specialInstructions,
      });

      const insertedId = (result as any).insertId || 0;
      return { success: true, loadId: Number(insertedId) };
    }),

  /**
   * Delete a load (draft only)
   */
  deleteLoad: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Only allow deleting draft loads owned by the user
      const load = await db
        .select()
        .from(loads)
        .where(and(eq(loads.id, input.loadId), eq(loads.shipperId, ctx.user.id)))
        .limit(1);

      if (!load[0]) throw new Error("Load not found or you don't have permission");
      if (load[0].status !== "draft") throw new Error("Can only delete draft loads");

      await db.delete(loads).where(eq(loads.id, input.loadId));

      return { success: true };
    }),

  /**
   * Get dashboard statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [totalLoads] = await db
      .select({ count: sql<number>`count(*)` })
      .from(loads)
      .where(eq(loads.shipperId, ctx.user.id));

    const [activeLoads] = await db
      .select({ count: sql<number>`count(*)` })
      .from(loads)
      .where(and(eq(loads.shipperId, ctx.user.id), sql`${loads.status} = 'in_transit'`));

    const [totalRevenue] = await db
      .select({ sum: sql<number>`COALESCE(SUM(CAST(rate AS DECIMAL)), 0)` })
      .from(loads)
      .where(and(eq(loads.shipperId, ctx.user.id), sql`${loads.status} = 'delivered'`));

    return {
      totalLoads: totalLoads?.count || 0,
      activeLoads: activeLoads?.count || 0,
      totalRevenue: totalRevenue?.sum || 0,
    };
  }),
});


export const bidsRouter = router({
  /**
   * Submit a bid on a load
   */
  create: protectedProcedure
    .input(
      z.object({
        loadId: z.number(),
        amount: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(bids).values({
        loadId: input.loadId,
        carrierId: ctx.user.id,
        amount: input.amount.toString(),
        notes: input.notes,
        status: "pending",
      });

      return { success: true };
    }),

  /**
   * Get my bids
   */
  getMyBids: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const results = await db
      .select()
      .from(bids)
      .where(eq(bids.carrierId, ctx.user.id))
      .orderBy(desc(bids.createdAt));

    return results;
  }),

  /**
   * Get bids for a specific load
   */
  getForLoad: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const results = await db
        .select()
        .from(bids)
        .where(eq(bids.loadId, input.loadId))
        .orderBy(desc(bids.createdAt));

      return results;
    }),

  /**
   * Update bid status (accept/reject/counter)
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        bidId: z.number(),
        status: z.enum(["pending", "accepted", "rejected", "countered"]),
        counterAmount: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: any = { status: input.status };
      if (input.counterAmount) {
        updateData.counterAmount = input.counterAmount.toString();
      }

      await db
        .update(bids)
        .set(updateData)
        .where(eq(bids.id, input.bidId));

      return { success: true };
    }),

  /**
   * Withdraw a bid
   */
  withdraw: protectedProcedure
    .input(z.object({ bidId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify the bid belongs to the user
      const bid = await db
        .select()
        .from(bids)
        .where(eq(bids.id, input.bidId))
        .limit(1);

      if (bid.length === 0 || bid[0].carrierId !== ctx.user.id) {
        throw new Error("Cannot withdraw this bid");
      }

      await db
        .update(bids)
        .set({ status: "rejected" })
        .where(eq(bids.id, input.bidId));

      return { success: true };
    }),
});
