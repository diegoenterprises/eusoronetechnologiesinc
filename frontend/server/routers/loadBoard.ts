/**
 * LOAD BOARD ROUTER
 * tRPC procedures for internal and external load board functionality
 */

import { z } from "zod";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { auditedProtectedProcedure as protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loads, companies, vehicles, bids, drivers } from "../../drizzle/schema";

const equipmentTypeSchema = z.enum(["tanker", "dry_van", "flatbed", "reefer", "step_deck", "lowboy", "gas_tank", "cryogenic", "hazmat_van", "bulk_hopper", "food_grade_tank", "water_tank"]);

// Hazmat class → required endorsement/authorization mapping
const HAZMAT_CLASS_REQUIREMENTS: Record<string, { endorsement: string; trailerTypes: string[]; insuranceMinimum: number }> = {
  "1.1": { endorsement: "H", trailerTypes: ["DRY_VAN", "FLATBED"], insuranceMinimum: 5000000 },
  "1.2": { endorsement: "H", trailerTypes: ["DRY_VAN", "FLATBED"], insuranceMinimum: 5000000 },
  "1.3": { endorsement: "H", trailerTypes: ["DRY_VAN", "FLATBED"], insuranceMinimum: 5000000 },
  "1.4": { endorsement: "H", trailerTypes: ["DRY_VAN", "FLATBED"], insuranceMinimum: 1000000 },
  "2.1": { endorsement: "HN", trailerTypes: ["MC-331"], insuranceMinimum: 5000000 },
  "2.2": { endorsement: "N", trailerTypes: ["MC-331", "MC-338"], insuranceMinimum: 1000000 },
  "2.3": { endorsement: "HN", trailerTypes: ["MC-331"], insuranceMinimum: 5000000 },
  "3": { endorsement: "HN", trailerTypes: ["MC-306", "MC-307"], insuranceMinimum: 5000000 },
  "4.1": { endorsement: "H", trailerTypes: ["DRY_VAN", "MC-307"], insuranceMinimum: 1000000 },
  "4.2": { endorsement: "H", trailerTypes: ["DRY_VAN"], insuranceMinimum: 1000000 },
  "4.3": { endorsement: "H", trailerTypes: ["DRY_VAN"], insuranceMinimum: 5000000 },
  "5.1": { endorsement: "H", trailerTypes: ["DRY_VAN", "MC-307", "HOPPER"], insuranceMinimum: 1000000 },
  "5.2": { endorsement: "H", trailerTypes: ["DRY_VAN"], insuranceMinimum: 1000000 },
  "6.1": { endorsement: "H", trailerTypes: ["DRY_VAN", "MC-306", "MC-307", "MC-312"], insuranceMinimum: 5000000 },
  "6.2": { endorsement: "H", trailerTypes: ["DRY_VAN"], insuranceMinimum: 1000000 },
  "7": { endorsement: "H", trailerTypes: ["DRY_VAN", "FLATBED"], insuranceMinimum: 5000000 },
  "8": { endorsement: "HN", trailerTypes: ["MC-312", "MC-307", "DRY_VAN"], insuranceMinimum: 5000000 },
  "9": { endorsement: "H", trailerTypes: ["DRY_VAN", "MC-306", "FLATBED"], insuranceMinimum: 1000000 },
};

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
      hazmatClass: z.string().optional(),
      unNumber: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
      sortBy: z.enum(["rate", "distance", "pickup_date", "posted_date"]).default("posted_date"),
    }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return { loads: [], total: 0, marketStats: { avgRate: 0, totalLoads: 0, loadToTruckRatio: 0 } };
      try {
        const conditions = [sql`${loads.status} IN ('posted', 'available')`];
        if (input.hazmat === true) conditions.push(sql`${loads.hazmatClass} IS NOT NULL AND ${loads.hazmatClass} != ''`);
        if (input.hazmat === false) conditions.push(sql`(${loads.hazmatClass} IS NULL OR ${loads.hazmatClass} = '')`);
        if (input.hazmatClass) conditions.push(sql`${loads.hazmatClass} = ${input.hazmatClass}`);
        if (input.unNumber) conditions.push(sql`JSON_UNQUOTE(JSON_EXTRACT(${loads.specialInstructions}, '$.unNumber')) = ${input.unNumber}`);
        const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
        const rows = await db.select().from(loads).where(whereClause!).orderBy(desc(loads.createdAt)).limit(input.limit).offset(input.offset);
        const [stats] = await db.select({ count: sql<number>`count(*)`, avgRate: sql<number>`COALESCE(AVG(CAST(${loads.rate} AS DECIMAL)), 0)` }).from(loads).where(whereClause!);
        return {
          loads: rows.map(l => {
            const pickup = l.pickupLocation as any || {};
            const delivery = l.deliveryLocation as any || {};
            const si = typeof l.specialInstructions === 'string' ? (() => { try { return JSON.parse(l.specialInstructions); } catch { return {}; } })() : (l.specialInstructions || {});
            return {
              id: String(l.id), loadNumber: l.loadNumber, status: l.status,
              origin: { city: pickup.city || '', state: pickup.state || '' },
              destination: { city: delivery.city || '', state: delivery.state || '' },
              rate: l.rate ? parseFloat(String(l.rate)) : 0,
              distance: l.distance ? parseFloat(String(l.distance)) : 0,
              weight: l.weight ? parseFloat(String(l.weight)) : 0,
              equipmentType: l.cargoType || '',
              hazmat: !!l.hazmatClass,
              hazmatClass: l.hazmatClass || null,
              unNumber: (si as any)?.unNumber || null,
              packingGroup: (si as any)?.packingGroup || null,
              properShippingName: (si as any)?.properShippingName || null,
              postedAt: l.createdAt?.toISOString() || '',
            };
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
      hazmatClass: z.string().optional(),
      unNumber: z.string().optional(),
      packingGroup: z.enum(["I", "II", "III"]).optional(),
      properShippingName: z.string().optional(),
      rate: z.number(),
      expiresIn: z.number().default(24),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const isHazmat = input.hazmat || !!input.hazmatClass;
      if (isHazmat && input.hazmatClass) {
        const classReqs = HAZMAT_CLASS_REQUIREMENTS[input.hazmatClass];
        if (!classReqs) console.warn(`[LoadBoard] Unknown hazmat class: ${input.hazmatClass}`);
      }
      const hazmatMeta = isHazmat ? JSON.stringify({
        unNumber: input.unNumber || null,
        packingGroup: input.packingGroup || null,
        properShippingName: input.properShippingName || null,
      }) : null;
      const loadNumber = `LB-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const [result] = await db.insert(loads).values({
        shipperId: ctx.user?.id || 0,
        loadNumber,
        status: "posted",
        cargoType: isHazmat ? "hazmat" as const : "general" as const,
        hazmatClass: isHazmat ? (input.hazmatClass || "9") : null,
        commodityName: input.commodity,
        weight: String(input.weight),
        rate: String(input.rate),
        specialInstructions: hazmatMeta,
        pickupLocation: { address: input.origin.address, city: input.origin.city, state: input.origin.state, zipCode: input.origin.zip, lat: 0, lng: 0 },
        deliveryLocation: { address: input.destination.address, city: input.destination.city, state: input.destination.state, zipCode: input.destination.zip, lat: 0, lng: 0 },
        pickupDate: new Date(input.pickupDate),
        deliveryDate: new Date(input.deliveryDate),
      }).$returningId();
      return {
        id: String(result.id),
        loadNumber,
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
      skipHazmatCheck: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const loadId = parseInt(input.loadId);
      const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
      if (!load) throw new Error("Load not found");
      if (load.status !== "posted" && load.status !== "bidding") throw new Error("Load is no longer available");

      // --- HAZMAT PRE-BOOKING VERIFICATION ---
      const hazmatWarnings: string[] = [];
      if (load.hazmatClass && !input.skipHazmatCheck) {
        const classReqs = HAZMAT_CLASS_REQUIREMENTS[load.hazmatClass];
        // 1. Verify driver has required endorsement
        if (input.driverId) {
          try {
            const dId = parseInt(input.driverId);
            const [driver] = await db.select().from(drivers).where(eq(drivers.id, dId)).limit(1);
            if (driver) {
              const reqEndorsement = classReqs?.endorsement || 'H';
              const hasH = !!driver.hazmatEndorsement;
              // Tanker endorsement: inferred from hazmatEndorsement + tanker equipment assignment
              // (drivers table doesn't store N separately — treat tanker-endorsed if hazmat-endorsed for now)
              const hasN = hasH;
              if (reqEndorsement.includes('H') && !hasH) hazmatWarnings.push(`Driver missing CDL-H (Hazmat) endorsement required for Class ${load.hazmatClass}`);
              if (reqEndorsement === 'HN' && !hasH) hazmatWarnings.push(`Driver missing CDL-HN (Hazmat+Tanker) endorsement required for Class ${load.hazmatClass}`);
              if (reqEndorsement === 'N' && !hasN) hazmatWarnings.push(`Driver missing CDL-N (Tanker) endorsement required for Class ${load.hazmatClass}`);
              // Check hazmat endorsement expiry
              if (hasH && driver.hazmatExpiry && new Date(driver.hazmatExpiry) < new Date()) {
                hazmatWarnings.push(`Driver's hazmat endorsement expired on ${driver.hazmatExpiry.toISOString().split('T')[0]}`);
              }
              // Check medical card expiry
              if (driver.medicalCardExpiry && new Date(driver.medicalCardExpiry) < new Date()) {
                hazmatWarnings.push(`Driver's medical certificate expired on ${driver.medicalCardExpiry.toISOString().split('T')[0]}`);
              }
            }
          } catch (e) { console.warn('[LoadBoard] Driver endorsement check failed:', e); }
        }
        // 2. Verify vehicle/trailer compatibility
        if (input.vehicleId && classReqs) {
          try {
            const vId = parseInt(input.vehicleId);
            const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, vId)).limit(1);
            if (vehicle) {
              const vType = ((vehicle as any).trailerType || (vehicle as any).vehicleType || '').toUpperCase();
              const allowed = classReqs.trailerTypes.map(t => t.toUpperCase());
              if (vType && !allowed.some(a => vType.includes(a))) {
                hazmatWarnings.push(`Vehicle trailer type '${vType}' may not be authorized for Hazmat Class ${load.hazmatClass}. Allowed: ${allowed.join(', ')}`);
              }
            }
          } catch (e) { console.warn('[LoadBoard] Vehicle compat check failed:', e); }
        }
        // If blocking warnings exist, return them instead of booking
        if (hazmatWarnings.length > 0) {
          return {
            bookingId: null,
            loadId: input.loadId,
            status: "hazmat_verification_failed",
            hazmatWarnings,
            bookedBy: ctx.user?.id,
            bookedAt: new Date().toISOString(),
            confirmationNumber: null,
          };
        }
      }

      await db.update(loads).set({
        status: "assigned",
        catalystId: ctx.user?.id || 0,
        vehicleId: input.vehicleId ? parseInt(input.vehicleId) : undefined,
        driverId: input.driverId ? parseInt(input.driverId) : undefined,
        rate: input.agreedRate ? String(input.agreedRate) : load.rate,
      }).where(eq(loads.id, loadId));
      const confirmationNumber = `CONF-${String(Date.now()).slice(-6)}`;
      return {
        bookingId: String(loadId),
        loadId: input.loadId,
        status: "assigned",
        hazmatWarnings: [],
        bookedBy: ctx.user?.id,
        bookedAt: new Date().toISOString(),
        confirmationNumber,
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
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const loadId = parseInt(input.loadId);
      const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
      if (!load) throw new Error("Load not found");
      const [result] = await db.insert(bids).values({
        loadId,
        catalystId: ctx.user?.id || 0,
        amount: String(input.proposedRate),
        status: "pending",
        notes: input.message || null,
      }).$returningId();
      if (load.status === "posted") {
        await db.update(loads).set({ status: "bidding" }).where(eq(loads.id, loadId));
      }
      return {
        negotiationId: String(result.id),
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
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const loadId = parseInt(input.loadId);
      const updates: Record<string, any> = {};
      if (input.rate !== undefined) updates.rate = String(input.rate);
      if (input.pickupDate) updates.pickupDate = new Date(input.pickupDate);
      if (input.deliveryDate) updates.deliveryDate = new Date(input.deliveryDate);
      if (Object.keys(updates).length > 0) {
        await db.update(loads).set(updates).where(eq(loads.id, loadId));
      }
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
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const loadId = parseInt(input.loadId);
      await db.update(loads).set({
        status: "cancelled",
        specialInstructions: input.reason ? `CANCELLED: ${input.reason}` : undefined,
      }).where(eq(loads.id, loadId));
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
      const db = await getDb();
      let avgRate = 3.15, minRate = 2.80, maxRate = 3.50, totalLoads = 0;
      if (db) {
        try {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
          const [stats] = await db.select({
            avg: sql<number>`COALESCE(AVG(CAST(${loads.rate} AS DECIMAL)), 0)`,
            min: sql<number>`COALESCE(MIN(CAST(${loads.rate} AS DECIMAL)), 0)`,
            max: sql<number>`COALESCE(MAX(CAST(${loads.rate} AS DECIMAL)), 0)`,
            count: sql<number>`count(*)`,
          }).from(loads).where(and(
            sql`JSON_UNQUOTE(JSON_EXTRACT(${loads.pickupLocation}, '$.state')) = ${input.origin.state}`,
            sql`JSON_UNQUOTE(JSON_EXTRACT(${loads.deliveryLocation}, '$.state')) = ${input.destination.state}`,
            gte(loads.createdAt, thirtyDaysAgo),
          ));
          if (stats && stats.count > 0) {
            avgRate = Math.round(stats.avg * 100) / 100 || 3.15;
            minRate = Math.round(stats.min * 100) / 100 || 2.80;
            maxRate = Math.round(stats.max * 100) / 100 || 3.50;
            totalLoads = stats.count || 0;
          }
        } catch (e) { console.error('[LoadBoard] getMarketRates error:', e); }
      }
      return {
        lane: `${input.origin.city}, ${input.origin.state} to ${input.destination.city}, ${input.destination.state}`,
        equipmentType: input.equipmentType,
        currentRate: { low: minRate, average: avgRate, high: maxRate },
        trend: { direction: avgRate > 3.0 ? "up" : "down", change: Math.abs(avgRate - 3.0), period: "30 days" },
        volume: { daily: Math.round(totalLoads / 30), weekly: Math.round(totalLoads / 4) },
        recommendation: totalLoads > 10 ? (avgRate > 3.0 ? "Active lane - rates above average" : "Competitive lane - consider negotiating") : "Limited data for this lane",
      };
    }),
});
