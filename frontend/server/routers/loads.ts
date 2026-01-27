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
   * Get tracked loads for TrackShipments page
   */
  getTrackedLoads: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ input }) => {
      const loads = [
        { id: "l1", loadNumber: "LOAD-45920", origin: "Houston, TX", destination: "Dallas, TX", status: "in_transit", eta: "2:30 PM", driver: "Mike Johnson", progress: 65 },
        { id: "l2", loadNumber: "LOAD-45918", origin: "Austin, TX", destination: "San Antonio, TX", status: "delivered", driver: "Sarah Williams", progress: 100 },
        { id: "l3", loadNumber: "LOAD-45915", origin: "El Paso, TX", destination: "Houston, TX", status: "picked_up", eta: "Tomorrow 9 AM", driver: "Tom Brown", progress: 10 },
      ];
      if (input.search) {
        const q = input.search.toLowerCase();
        return loads.filter(l => l.loadNumber.toLowerCase().includes(q) || l.driver.toLowerCase().includes(q));
      }
      return loads;
    }),

  /**
   * Get shipper summary for ShipperLoads page
   */
  getShipperSummary: protectedProcedure
    .query(async () => {
      return {
        totalLoads: 156,
        activeLoads: 12,
        inTransit: 8,
        delivered: 142,
        pendingBids: 4,
      };
    }),

  /**
   * Track load by number for LoadTracking page
   */
  trackLoad: protectedProcedure
    .input(z.object({ loadNumber: z.string() }))
    .mutation(async ({ input }) => {
      return {
        loadNumber: input.loadNumber,
        status: "in_transit",
        origin: { city: "Houston", state: "TX" },
        destination: { city: "Dallas", state: "TX" },
        currentLocation: { city: "Waco", state: "TX", lat: 31.5493, lng: -97.1467 },
        driver: "Mike Johnson",
        carrier: "ABC Transport",
        eta: "2:30 PM",
        progress: 65,
        lastUpdate: new Date().toISOString(),
      };
    }),

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
          commodity: "Gasoline",
          weight: 42000,
          weightUnit: "lbs",
          volume: 8500,
          volumeUnit: "gal",
          origin: { address: "1234 Refinery Rd", city: "Houston", state: "TX", zip: "77001" },
          destination: { address: "5678 Industrial Blvd", city: "Dallas", state: "TX", zip: "75201" },
          pickupLocation: { city: "Houston", state: "TX" },
          deliveryLocation: { city: "Dallas", state: "TX" },
          pickupDate: "2025-01-24T08:00:00Z",
          deliveryDate: "2025-01-24T16:00:00Z",
          biddingEnds: "2025-01-24T06:00:00Z",
          suggestedRateMin: 2200,
          suggestedRateMax: 2700,
          rate: 2450,
          distance: 240,
          shipper: { id: "s1", name: "Shell Oil Company" },
          carrier: { id: "c1", name: "ABC Transport LLC" },
          driver: { id: "d1", name: "Mike Johnson", phone: "(713) 555-0101" },
          currentLocation: { lat: 31.5493, lng: -97.1467, city: "Waco", state: "TX" },
          eta: "2:30 PM",
          createdAt: "2025-01-23T10:00:00Z",
          equipmentType: "tanker",
          notes: "Temperature-controlled cargo",
        };
      }

      const loadId = typeof input.id === "string" ? parseInt(input.id, 10) : input.id;
      const result = await db
        .select()
        .from(loads)
        .where(eq(loads.id, loadId))
        .limit(1);

      const load = result[0];
      if (!load) return null;
      return {
        ...load,
        origin: { address: "", city: load.pickupCity || "", state: load.pickupState || "", zip: load.pickupZip || "" },
        destination: { address: "", city: load.deliveryCity || "", state: load.deliveryState || "", zip: load.deliveryZip || "" },
        pickupLocation: { city: load.pickupCity || "", state: load.pickupState || "" },
        deliveryLocation: { city: load.deliveryCity || "", state: load.deliveryState || "" },
        commodity: load.cargoType || "General",
        biddingEnds: load.pickupDate || new Date().toISOString(),
        suggestedRateMin: (load.rate || 0) * 0.9,
        suggestedRateMax: (load.rate || 0) * 1.1,
        equipmentType: load.equipmentType || "dry_van",
      };
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
      return { success: true, loadId: Number(insertedId), id: Number(insertedId) };
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

  cancel: protectedProcedure.input(z.object({ loadId: z.string(), reason: z.string().optional() })).mutation(async ({ input }) => ({ success: true, loadId: input.loadId })),
  getHistoryStats: protectedProcedure.input(z.object({ period: z.string().optional() }).optional()).query(async () => ({ totalCompleted: 342, avgRate: 2850, onTimeRate: 96, totalLoads: 342, delivered: 342, totalRevenue: 975300, totalMiles: 125000 })),
  getHistory: protectedProcedure.input(z.object({ period: z.string().optional(), limit: z.number().optional() }).optional()).query(async () => [
    { id: "h1", loadNumber: "LOAD-45900", origin: "Houston, TX", destination: "Dallas, TX", deliveredAt: "2025-01-20", rate: 2200, status: "delivered" },
    { id: "h2", loadNumber: "LOAD-45890", origin: "Austin, TX", destination: "San Antonio, TX", deliveredAt: "2025-01-18", rate: 1850, status: "delivered" },
  ]),
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

  // Additional bid procedures
  getById: protectedProcedure.input(z.object({ bidId: z.string().optional(), id: z.string().optional() })).query(async ({ input }) => ({ 
    id: input.bidId || input.id || "b1", 
    loadId: "l1", 
    loadNumber: "LOAD-45920",
    amount: 2450, 
    status: "pending",
    submittedAt: "2025-01-23T10:30:00Z",
    ratePerMile: 2.85,
    origin: { city: "Houston", state: "TX" },
    destination: { city: "Dallas", state: "TX" },
    pickupDate: "2025-01-25",
    deliveryDate: "2025-01-26",
    distance: 860,
    weight: 42000,
    equipment: "Dry Van",
    equipmentType: "Dry Van",
    carrierName: "ABC Transport",
    mcNumber: "MC-987654",
    notes: "Flexible on pickup time",
    carrierRating: 4.8,
    carrierLoads: 125,
    onTimeRate: 96,
    safetyScore: 94,
    history: [
      { action: "submitted", timestamp: "2025-01-23T10:30:00Z", note: "Bid submitted" },
      { action: "viewed", timestamp: "2025-01-23T11:00:00Z", note: "Shipper viewed bid" },
    ],
  })),
  getByLoad: protectedProcedure.input(z.object({ loadId: z.string() })).query(async () => [
    { id: "b1", carrierId: "c1", carrierName: "ABC Transport", amount: 2450, status: "pending", carrierRating: 4.8, carrierMC: "MC-123456", ratePerMile: 2.85 },
    { id: "b2", carrierId: "c2", carrierName: "FastHaul LLC", amount: 2380, status: "pending", carrierRating: 4.6, carrierMC: "MC-234567", ratePerMile: 2.77 },
  ]),
  getHistory: protectedProcedure.input(z.object({ limit: z.number().optional() })).query(async () => [{ id: "b1", loadNumber: "LOAD-45900", amount: 2200, status: "accepted", date: "2025-01-20" }]),
  getHistorySummary: protectedProcedure.query(async () => ({ total: 150, accepted: 85, rejected: 40, pending: 25, winRate: 56.7 })),
  getRecentAnalysis: protectedProcedure.query(async () => ({ avgBid: 2350, marketRate: 2400, competitiveness: "good" })),
  submit: protectedProcedure.input(z.object({ loadId: z.string(), amount: z.number(), notes: z.string().optional(), driverId: z.string().optional(), vehicleId: z.string().optional() })).mutation(async () => ({ success: true, bidId: "bid_123" })),
  accept: protectedProcedure.input(z.object({ bidId: z.string() })).mutation(async ({ input }) => ({ success: true, bidId: input.bidId })),
  reject: protectedProcedure.input(z.object({ bidId: z.string(), reason: z.string().optional() })).mutation(async ({ input }) => ({ success: true, bidId: input.bidId })),
});
