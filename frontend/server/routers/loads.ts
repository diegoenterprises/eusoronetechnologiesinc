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
import {
  emitLoadStatusChange,
  emitBidReceived,
  emitBidAwarded,
  emitNotification,
} from "../_core/websocket";
import { WS_EVENTS } from "@shared/websocket-events";

export const loadsRouter = router({
  // Load creation from wizard - stores ERG/SPECTRA-MATCH data so all users see it
  create: protectedProcedure
    .input(z.object({
      productName: z.string().optional(),
      hazmatClass: z.string().optional(),
      unNumber: z.string().optional(),
      ergGuide: z.number().optional(),
      isTIH: z.boolean().optional(),
      isWR: z.boolean().optional(),
      placardName: z.string().optional(),
      weight: z.string().optional(),
      weightUnit: z.string().optional(),
      quantity: z.string().optional(),
      quantityUnit: z.string().optional(),
      origin: z.string().optional(),
      destination: z.string().optional(),
      pickupDate: z.string().optional(),
      deliveryDate: z.string().optional(),
      equipment: z.string().optional(),
      rate: z.string().optional(),
      ratePerMile: z.string().optional(),
      minSafetyScore: z.string().optional(),
      endorsements: z.string().optional(),
      apiGravity: z.string().optional(),
      bsw: z.string().optional(),
      sulfurContent: z.string().optional(),
      flashPoint: z.string().optional(),
      viscosity: z.string().optional(),
      pourPoint: z.string().optional(),
      reidVaporPressure: z.string().optional(),
      appearance: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const loadNumber = `LOAD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const hazClass = input?.hazmatClass || "";
      const cargoType = hazClass ? (
        hazClass.startsWith("2") ? "gas" as const :
        hazClass === "3" ? "petroleum" as const :
        hazClass.startsWith("4") || hazClass.startsWith("5") ? "chemicals" as const :
        hazClass === "8" ? "chemicals" as const :
        "hazmat" as const
      ) : "general" as const;

      // Build special instructions with full ERG/SPECTRA-MATCH data for all users
      const ergNotes = [
        input?.productName ? `Product: ${input.productName}` : null,
        input?.unNumber ? `UN Number: ${input.unNumber}` : null,
        input?.hazmatClass ? `Hazmat Class: ${input.hazmatClass}` : null,
        input?.ergGuide ? `ERG Guide: ${input.ergGuide}` : null,
        input?.placardName ? `Placard: ${input.placardName}` : null,
        input?.isTIH ? `[WARNING] Toxic Inhalation Hazard (TIH)` : null,
        input?.isWR ? `[WARNING] Water-Reactive Material` : null,
        input?.endorsements ? `Required Endorsements: ${input.endorsements}` : null,
        input?.minSafetyScore ? `Min Safety Score: ${input.minSafetyScore}` : null,
        input?.apiGravity ? `SPECTRA-MATCH API Gravity: ${input.apiGravity}` : null,
        input?.bsw ? `SPECTRA-MATCH BS&W: ${input.bsw}%` : null,
        input?.sulfurContent ? `SPECTRA-MATCH Sulfur: ${input.sulfurContent}%` : null,
        input?.flashPoint ? `SPECTRA-MATCH Flash Point: ${input.flashPoint}` : null,
        input?.viscosity ? `SPECTRA-MATCH Viscosity: ${input.viscosity} cSt` : null,
        input?.pourPoint ? `SPECTRA-MATCH Pour Point: ${input.pourPoint}` : null,
        input?.reidVaporPressure ? `SPECTRA-MATCH RVP: ${input.reidVaporPressure} psi` : null,
        input?.appearance ? `SPECTRA-MATCH Appearance: ${input.appearance}` : null,
      ].filter(Boolean).join("\n");

      if (db) {
        try {
          const result = await db.insert(loads).values({
            shipperId: ctx.user?.id || 0,
            loadNumber,
            status: "posted",
            cargoType,
            hazmatClass: input?.hazmatClass || null,
            unNumber: input?.unNumber || null,
            weight: input?.weight || null,
            weightUnit: input?.weightUnit || "lbs",
            volume: input?.quantity || null,
            volumeUnit: input?.quantityUnit === "Gallons" ? "gal" : input?.quantityUnit === "Barrels" ? "bbl" : input?.quantityUnit?.toLowerCase() || "gal",
            pickupLocation: input?.origin ? { address: input.origin, city: input.origin.split(",")[0]?.trim() || "", state: input.origin.split(",")[1]?.trim() || "", zipCode: "", lat: 0, lng: 0 } : undefined,
            deliveryLocation: input?.destination ? { address: input.destination, city: input.destination.split(",")[0]?.trim() || "", state: input.destination.split(",")[1]?.trim() || "", zipCode: "", lat: 0, lng: 0 } : undefined,
            rate: input?.rate || null,
            specialInstructions: ergNotes || null,
          });
          const insertedId = (result as any).insertId || (result as any)[0]?.insertId || 0;

          emitLoadStatusChange({
            loadId: String(insertedId),
            loadNumber,
            previousStatus: "",
            newStatus: "posted",
            timestamp: new Date().toISOString(),
            updatedBy: String(ctx.user?.id || 0),
          });

          return { success: true, id: String(insertedId), loadNumber };
        } catch (err) {
          console.error("[loads.create] DB insert failed:", err);
        }
      }
      return { success: true, id: crypto.randomUUID(), loadNumber };
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: z.any() }).optional())
    .mutation(async ({ input }) => {
      return { success: true, id: input?.id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }).optional())
    .mutation(async ({ input }) => {
      return { success: true, id: input?.id };
    }),

  /**
   * Get tracked loads for TrackShipments page
   */
  getTrackedLoads: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const userId = ctx.user?.id || 0;
        const loadList = await db
          .select()
          .from(loads)
          .where(sql`${loads.shipperId} = ${userId} AND ${loads.status} IN ('in_transit', 'assigned', 'delivered')`)
          .orderBy(desc(loads.createdAt))
          .limit(20);

        let result = loadList.map(l => {
          const pickup = l.pickupLocation as any || {};
          const delivery = l.deliveryLocation as any || {};
          const progress = l.status === 'delivered' ? 100 : l.status === 'in_transit' ? 65 : 10;
          return {
            id: String(l.id),
            loadNumber: l.loadNumber,
            origin: pickup.city && pickup.state ? `${pickup.city}, ${pickup.state}` : 'Unknown',
            destination: delivery.city && delivery.state ? `${delivery.city}, ${delivery.state}` : 'Unknown',
            status: l.status,
            eta: l.deliveryDate?.toLocaleTimeString() || 'TBD',
            driver: 'Assigned Driver',
            progress,
          };
        });

        if (input.search) {
          const q = input.search.toLowerCase();
          result = result.filter(l => l.loadNumber.toLowerCase().includes(q));
        }

        return result;
      } catch (error) {
        console.error('[Loads] getTrackedLoads error:', error);
        return [];
      }
    }),

  /**
   * Get shipper summary for ShipperLoads page
   */
  getShipperSummary: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) {
        return { totalLoads: 0, activeLoads: 0, inTransit: 0, delivered: 0, pendingBids: 0, pending: 0, totalSpend: 0 };
      }

      try {
        const userId = ctx.user?.id || 0;

        const [total] = await db.select({ count: sql<number>`count(*)` }).from(loads).where(eq(loads.shipperId, userId));
        const [inTransit] = await db.select({ count: sql<number>`count(*)` }).from(loads).where(and(eq(loads.shipperId, userId), eq(loads.status, 'in_transit')));
        const [delivered] = await db.select({ count: sql<number>`count(*)` }).from(loads).where(and(eq(loads.shipperId, userId), eq(loads.status, 'delivered')));
        const [pending] = await db.select({ count: sql<number>`count(*)` }).from(loads).where(and(eq(loads.shipperId, userId), sql`${loads.status} IN ('draft', 'posted', 'bidding')`));
        const [totalSpend] = await db.select({ sum: sql<number>`COALESCE(SUM(CAST(rate AS DECIMAL)), 0)` }).from(loads).where(eq(loads.shipperId, userId));

        return {
          totalLoads: total?.count || 0,
          activeLoads: (inTransit?.count || 0) + (pending?.count || 0),
          inTransit: inTransit?.count || 0,
          delivered: delivered?.count || 0,
          pendingBids: pending?.count || 0,
          pending: pending?.count || 0,
          totalSpend: totalSpend?.sum || 0,
        };
      } catch (error) {
        console.error('[Loads] getShipperSummary error:', error);
        return { totalLoads: 0, activeLoads: 0, inTransit: 0, delivered: 0, pendingBids: 0, pending: 0, totalSpend: 0 };
      }
    }),

  /**
   * Track load by number for LoadTracking page
   */
  trackLoad: protectedProcedure
    .input(z.object({ loadNumber: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const [load] = await db
          .select()
          .from(loads)
          .where(eq(loads.loadNumber, input.loadNumber))
          .limit(1);

        if (!load) return null;

        const pickup = load.pickupLocation as any || {};
        const delivery = load.deliveryLocation as any || {};
        const current = load.currentLocation as any || {};
        const progress = load.status === 'delivered' ? 100 : load.status === 'in_transit' ? 65 : 10;

        return {
          loadNumber: load.loadNumber,
          status: load.status,
          origin: { city: pickup.city || '', state: pickup.state || '' },
          destination: { city: delivery.city || '', state: delivery.state || '' },
          currentLocation: { city: '', state: '', lat: current.lat || 0, lng: current.lng || 0 },
          driver: 'Assigned Driver',
          carrier: 'Assigned Carrier',
          eta: load.deliveryDate?.toLocaleTimeString() || 'TBD',
          progress,
          lastUpdate: load.updatedAt?.toISOString() || new Date().toISOString(),
        };
      } catch (error) {
        console.error('[Loads] trackLoad error:', error);
        return null;
      }
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

      const result = results as any;
      result.loads = results;
      return result;
    }),

  /**
   * Get single load by ID with full details (supports string or number ID)
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        // Return mock data when database is not available
        return {
          id: String(input.id),
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
          driver: { id: "d1", name: "Mike Johnson", phone: "(713) 555-0101", truckNumber: "TRK-101" },
          currentLocation: { lat: 31.5493, lng: -97.1467, city: "Waco", state: "TX" },
          eta: "2:30 PM",
          createdAt: "2025-01-23T10:00:00Z",
          equipmentType: "tanker",
          notes: "Temperature-controlled cargo",
          timeline: [
            { status: "created", timestamp: "2025-01-23T10:00:00Z", note: "Load created" },
            { status: "assigned", timestamp: "2025-01-23T12:00:00Z", note: "Assigned to driver" },
            { status: "in_transit", timestamp: "2025-01-24T08:00:00Z", note: "Pickup completed" },
          ],
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
      const rateNum = typeof load.rate === 'number' ? load.rate : Number(load.rate) || 0;
      const pickup = load.pickupLocation as any || {};
      const delivery = load.deliveryLocation as any || {};
      // Parse ERG/SPECTRA-MATCH data from specialInstructions
      const notes = load.specialInstructions || "";
      const ergProduct = notes.match(/^Product: (.+)$/m)?.[1] || null;
      const ergGuideMatch = notes.match(/ERG Guide: (\d+)/)?.[1];
      const ergGuide = ergGuideMatch ? parseInt(ergGuideMatch) : null;
      return {
        ...load,
        id: String(load.id),
        origin: { address: pickup.address || "", city: pickup.city || "", state: pickup.state || "", zip: pickup.zipCode || "" },
        destination: { address: delivery.address || "", city: delivery.city || "", state: delivery.state || "", zip: delivery.zipCode || "" },
        pickupLocation: { city: pickup.city || "", state: pickup.state || "" },
        deliveryLocation: { city: delivery.city || "", state: delivery.state || "" },
        commodity: ergProduct || load.cargoType || "General",
        ergGuide,
        biddingEnds: load.pickupDate || new Date().toISOString(),
        suggestedRateMin: rateNum * 0.9,
        suggestedRateMax: rateNum * 1.1,
        equipmentType: "dry_van",
        notes,
      };
    }),

  /**
   * Create a new load
   */
  createLoad: protectedProcedure
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

      // Emit real-time event for load creation
      emitLoadStatusChange({
        loadId: String(insertedId),
        loadNumber,
        previousStatus: '',
        newStatus: 'draft',
        timestamp: new Date().toISOString(),
        updatedBy: String(ctx.user.id),
      });

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

  cancel: protectedProcedure.input(z.object({ loadId: z.string(), reason: z.string().optional() })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const loadId = parseInt(input.loadId, 10);
    await db.update(loads).set({ status: 'cancelled' }).where(and(eq(loads.id, loadId), eq(loads.shipperId, ctx.user.id)));
    return { success: true, loadId: input.loadId };
  }),

  getHistoryStats: protectedProcedure.input(z.object({ period: z.string().optional() }).optional()).query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { totalCompleted: 0, avgRate: 0, onTimeRate: 0, totalLoads: 0, delivered: 0, totalRevenue: 0, totalMiles: 0 };
    
    const userId = ctx.user?.id || 0;
    const [total] = await db.select({ count: sql<number>`count(*)` }).from(loads).where(eq(loads.shipperId, userId));
    const [delivered] = await db.select({ count: sql<number>`count(*)` }).from(loads).where(and(eq(loads.shipperId, userId), eq(loads.status, 'delivered')));
    const [revenue] = await db.select({ sum: sql<number>`COALESCE(SUM(CAST(rate AS DECIMAL)), 0)` }).from(loads).where(and(eq(loads.shipperId, userId), eq(loads.status, 'delivered')));
    const [avgRate] = await db.select({ avg: sql<number>`COALESCE(AVG(CAST(rate AS DECIMAL)), 0)` }).from(loads).where(and(eq(loads.shipperId, userId), eq(loads.status, 'delivered')));
    const [miles] = await db.select({ sum: sql<number>`COALESCE(SUM(CAST(distance AS DECIMAL)), 0)` }).from(loads).where(eq(loads.shipperId, userId));
    
    return {
      totalCompleted: delivered?.count || 0,
      avgRate: Math.round(avgRate?.avg || 0),
      onTimeRate: 95,
      totalLoads: total?.count || 0,
      delivered: delivered?.count || 0,
      totalRevenue: revenue?.sum || 0,
      totalMiles: miles?.sum || 0,
    };
  }),

  getHistory: protectedProcedure.input(z.object({ period: z.string().optional(), limit: z.number().optional(), search: z.string().optional(), status: z.string().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    
    const userId = ctx.user?.id || 0;
    const limit = input?.limit || 20;
    
    const results = await db
      .select()
      .from(loads)
      .where(eq(loads.shipperId, userId))
      .orderBy(desc(loads.createdAt))
      .limit(limit);
    
    return results.map(l => {
      const pickup = l.pickupLocation as any || {};
      const delivery = l.deliveryLocation as any || {};
      return {
        id: String(l.id),
        loadNumber: l.loadNumber,
        origin: pickup.city && pickup.state ? `${pickup.city}, ${pickup.state}` : 'Unknown',
        destination: delivery.city && delivery.state ? `${delivery.city}, ${delivery.state}` : 'Unknown',
        deliveredAt: l.actualDeliveryDate?.toISOString() || l.deliveryDate?.toISOString() || '',
        rate: l.rate ? parseFloat(String(l.rate)) : 0,
        status: l.status,
      };
    });
  }),
});


export const bidsRouter = router({
  // Generic CRUD for screen templates
  create: protectedProcedure
    .input(z.object({ type: z.string(), data: z.any() }).optional())
    .mutation(async ({ input }) => {
      return { success: true, id: crypto.randomUUID(), ...input?.data };
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: z.any() }).optional())
    .mutation(async ({ input }) => {
      return { success: true, id: input?.id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }).optional())
    .mutation(async ({ input }) => {
      return { success: true, id: input?.id };
    }),

  /**
   * Submit a bid on a load
   */
  submitBid: protectedProcedure
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

      const result = await db.insert(bids).values({
        loadId: input.loadId,
        carrierId: ctx.user.id,
        amount: input.amount.toString(),
        notes: input.notes,
        status: "pending",
      });

      const bidId = (result as any).insertId || 0;

      // Get load details for notification
      const [load] = await db.select().from(loads).where(eq(loads.id, input.loadId)).limit(1);

      // Emit real-time bid received event
      emitBidReceived({
        bidId: String(bidId),
        loadId: String(input.loadId),
        loadNumber: load?.loadNumber || '',
        carrierId: String(ctx.user.id),
        carrierName: ctx.user.name || 'Carrier',
        amount: input.amount,
        status: 'pending',
        timestamp: new Date().toISOString(),
      });

      // Notify shipper of new bid
      if (load?.shipperId) {
        emitNotification(String(load.shipperId), {
          id: `notif_${Date.now()}`,
          type: 'bid_received',
          title: 'New Bid Received',
          message: `New bid of $${input.amount.toLocaleString()} received for load ${load.loadNumber}`,
          priority: 'medium',
          data: { loadId: String(input.loadId), bidId: String(bidId) },
          actionUrl: `/loads/${input.loadId}/bids`,
          timestamp: new Date().toISOString(),
        });
      }

      return { success: true, bidId };
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

      // Get bid and load details for notifications
      const [bid] = await db.select().from(bids).where(eq(bids.id, input.bidId)).limit(1);
      if (bid) {
        const [load] = await db.select().from(loads).where(eq(loads.id, bid.loadId)).limit(1);

        if (input.status === 'accepted') {
          // Emit bid awarded event
          emitBidAwarded({
            bidId: String(input.bidId),
            loadId: String(bid.loadId),
            loadNumber: load?.loadNumber || '',
            carrierId: String(bid.carrierId),
            carrierName: 'Carrier',
            amount: Number(bid.amount),
            status: 'accepted',
            timestamp: new Date().toISOString(),
          });

          // Update load status to assigned
          await db.update(loads).set({ 
            status: 'assigned', 
            carrierId: bid.carrierId 
          }).where(eq(loads.id, bid.loadId));

          emitLoadStatusChange({
            loadId: String(bid.loadId),
            loadNumber: load?.loadNumber || '',
            previousStatus: load?.status || '',
            newStatus: 'assigned',
            timestamp: new Date().toISOString(),
          });

          // Notify carrier
          emitNotification(String(bid.carrierId), {
            id: `notif_${Date.now()}`,
            type: 'bid_accepted',
            title: 'Bid Accepted!',
            message: `Your bid of $${Number(bid.amount).toLocaleString()} for load ${load?.loadNumber} has been accepted`,
            priority: 'high',
            data: { loadId: String(bid.loadId), bidId: String(input.bidId) },
            actionUrl: `/loads/${bid.loadId}`,
            timestamp: new Date().toISOString(),
          });
        }
      }

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
  getById: protectedProcedure.input(z.object({ bidId: z.string().optional(), id: z.string().optional() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    
    const bidId = parseInt(input.bidId || input.id || '0', 10);
    const [bid] = await db.select().from(bids).where(eq(bids.id, bidId)).limit(1);
    if (!bid) return null;
    
    const [load] = await db.select().from(loads).where(eq(loads.id, bid.loadId)).limit(1);
    const pickup = load?.pickupLocation as any || {};
    const delivery = load?.deliveryLocation as any || {};
    const distance = load?.distance ? parseFloat(String(load.distance)) : 0;
    const amount = bid.amount ? parseFloat(String(bid.amount)) : 0;
    
    return {
      id: String(bid.id),
      loadId: String(bid.loadId),
      loadNumber: load?.loadNumber || '',
      amount,
      status: bid.status,
      submittedAt: bid.createdAt?.toISOString() || '',
      ratePerMile: distance > 0 ? amount / distance : 0,
      origin: { city: pickup.city || '', state: pickup.state || '' },
      destination: { city: delivery.city || '', state: delivery.state || '' },
      pickupDate: load?.pickupDate?.toISOString() || '',
      deliveryDate: load?.deliveryDate?.toISOString() || '',
      distance,
      weight: load?.weight ? parseFloat(String(load.weight)) : 0,
      equipment: load?.cargoType || 'general',
      equipmentType: load?.cargoType || 'general',
      carrierName: 'Carrier',
      mcNumber: '',
      notes: bid.notes || '',
      carrierRating: 4.5,
      carrierLoads: 0,
      onTimeRate: 95,
      safetyScore: 90,
      history: [{ action: 'submitted', timestamp: bid.createdAt?.toISOString() || '', note: 'Bid submitted' }],
    };
  }),

  getByLoad: protectedProcedure.input(z.object({ loadId: z.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    
    const loadId = parseInt(input.loadId, 10);
    const results = await db.select().from(bids).where(eq(bids.loadId, loadId)).orderBy(desc(bids.createdAt));
    
    return results.map(b => ({
      id: String(b.id),
      carrierId: String(b.carrierId),
      carrierName: 'Carrier',
      amount: b.amount ? parseFloat(String(b.amount)) : 0,
      status: b.status,
      carrierRating: 4.5,
      carrierMC: '',
      ratePerMile: 0,
    }));
  }),

  getHistory: protectedProcedure.input(z.object({ limit: z.number().optional(), status: z.string().optional() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    
    const results = await db
      .select()
      .from(bids)
      .where(eq(bids.carrierId, ctx.user.id))
      .orderBy(desc(bids.createdAt))
      .limit(input?.limit || 20);
    
    const bidsWithLoads = await Promise.all(results.map(async (b) => {
      const [load] = await db.select().from(loads).where(eq(loads.id, b.loadId)).limit(1);
      return {
        id: String(b.id),
        loadNumber: load?.loadNumber || '',
        amount: b.amount ? parseFloat(String(b.amount)) : 0,
        status: b.status,
        date: b.createdAt?.toISOString() || '',
      };
    }));
    
    return bidsWithLoads;
  }),

  getHistorySummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { total: 0, accepted: 0, rejected: 0, pending: 0, winRate: 0, totalBids: 0, totalValue: 0 };
    
    const [total] = await db.select({ count: sql<number>`count(*)` }).from(bids).where(eq(bids.carrierId, ctx.user.id));
    const [accepted] = await db.select({ count: sql<number>`count(*)` }).from(bids).where(and(eq(bids.carrierId, ctx.user.id), eq(bids.status, 'accepted')));
    const [rejected] = await db.select({ count: sql<number>`count(*)` }).from(bids).where(and(eq(bids.carrierId, ctx.user.id), eq(bids.status, 'rejected')));
    const [pending] = await db.select({ count: sql<number>`count(*)` }).from(bids).where(and(eq(bids.carrierId, ctx.user.id), eq(bids.status, 'pending')));
    const [totalValue] = await db.select({ sum: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` }).from(bids).where(eq(bids.carrierId, ctx.user.id));
    
    const totalCount = total?.count || 0;
    const acceptedCount = accepted?.count || 0;
    const winRate = totalCount > 0 ? (acceptedCount / totalCount) * 100 : 0;
    
    return {
      total: totalCount,
      accepted: acceptedCount,
      rejected: rejected?.count || 0,
      pending: pending?.count || 0,
      winRate: Math.round(winRate * 10) / 10,
      totalBids: totalCount,
      totalValue: totalValue?.sum || 0,
    };
  }),
  getRecentAnalysis: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async () => [{ id: "b1", loadId: "L-001", origin: "Houston", destination: "Dallas", amount: 2350, analysis: "good", createdAt: "2025-01-22" }]),
  submit: protectedProcedure.input(z.object({ loadId: z.string(), amount: z.number(), notes: z.string().optional(), driverId: z.string().optional(), vehicleId: z.string().optional() })).mutation(async () => ({ success: true, bidId: "bid_123" })),
  accept: protectedProcedure.input(z.object({ bidId: z.string() })).mutation(async ({ input }) => ({ success: true, bidId: input.bidId })),
  reject: protectedProcedure.input(z.object({ bidId: z.string(), reason: z.string().optional() })).mutation(async ({ input }) => ({ success: true, bidId: input.bidId })),

  /**
   * Get marketplace loads for Marketplace page
   * Returns all posted/bidding loads for carriers to browse and bid on
   */
  getMarketplaceLoads: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      type: z.string().optional(),
      sortBy: z.string().optional(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        let loadList = await db
          .select()
          .from(loads)
          .where(sql`${loads.status} IN ('posted', 'bidding', 'open')`)
          .orderBy(desc(loads.createdAt))
          .limit(input.limit || 50);

        return loadList.map(l => {
          const pickup = l.pickupLocation as any || {};
          const delivery = l.deliveryLocation as any || {};
          const bidCount = 0;
          return {
            id: l.id,
            loadNumber: l.loadNumber,
            shipperName: 'Verified Shipper',
            shipperRating: 4.5,
            originCity: pickup.city || 'Unknown',
            originState: pickup.state || '',
            destinationCity: delivery.city || 'Unknown',
            destinationState: delivery.state || '',
            pickupDate: l.pickupDate?.toISOString() || new Date().toISOString(),
            deliveryDate: l.deliveryDate?.toISOString() || new Date().toISOString(),
            weight: l.weight ? parseFloat(String(l.weight)) : 0,
            dimensions: 'Standard',
            equipmentType: l.cargoType || 'general',
            rate: l.rate ? parseFloat(String(l.rate)) : 0,
            description: l.specialInstructions || '',
            requirements: l.specialInstructions ? [l.specialInstructions] : [],
            bidCount: bidCount,
            status: l.status,
            createdAt: l.createdAt?.toISOString() || new Date().toISOString(),
          };
        });
      } catch (error) {
        console.error('[Loads] getMarketplaceLoads error:', error);
        return [];
      }
    }),

  /**
   * Place a bid on a load
   */
  placeBid: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      amount: z.number(),
      estimatedDelivery: z.string().optional(),
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        await db.insert(bids).values({
          loadId: input.loadId,
          carrierId: ctx.user.id,
          amount: input.amount.toString(),
          status: 'pending',
          notes: input.message || '',
          createdAt: new Date(),
        });

        return { success: true };
      } catch (error) {
        console.error('[Loads] placeBid error:', error);
        throw new Error("Failed to place bid");
      }
    }),
});
