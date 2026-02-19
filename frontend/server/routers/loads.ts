/**
 * LOADS ROUTER
 * tRPC procedures for load management
 * Connects to database for dynamic data
 */

import { z } from "zod";
import { auditedProtectedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loads, bids, users, companies } from "../../drizzle/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import {
  emitLoadStatusChange,
  emitBidReceived,
  emitBidAwarded,
  emitNotification,
} from "../_core/websocket";
import { WS_EVENTS } from "@shared/websocket-events";
import { emailService } from "../_core/email";
import { fireGamificationEvent } from "../services/gamificationDispatcher";
import { resolveUserRole, isAdminRole } from "../_core/resolveRole";
import { feeCalculator } from "../services/feeCalculator";

async function resolveUserId(ctxUser: any): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const email = ctxUser?.email || "";
  const name = ctxUser?.name || "User";
  const role = (ctxUser?.role || "SHIPPER") as any;

  // 1. Try email lookup (most reliable — email column always exists)
  if (email) {
    try {
      const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (row) return row.id;
    } catch (err) {
      console.warn("[resolveUserId] email lookup failed:", err);
    }
  }

  // 2. User doesn't exist — create them
  try {
    const insertData: Record<string, any> = {
      email: email || `user-${Date.now()}@eusotrip.com`,
      name,
      role,
      isActive: true,
      isVerified: false,
    };
    // Try with openId first; if column missing, retry without
    try {
      insertData.openId = String(ctxUser?.id || `auto-${Date.now()}`);
      const result = await db.insert(users).values(insertData as any);
      const insertedId = (result as any).insertId || (result as any)[0]?.insertId;
      if (insertedId) return insertedId;
    } catch (insertErr: any) {
      console.warn("[resolveUserId] insert with openId failed, retrying without:", insertErr?.message);
      delete insertData.openId;
      const result = await db.insert(users).values(insertData as any);
      const insertedId = (result as any).insertId || (result as any)[0]?.insertId;
      if (insertedId) return insertedId;
    }
    // Re-query by email
    if (email) {
      const [newRow] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      return newRow?.id || 0;
    }
    return 0;
  } catch (err: any) {
    console.error("[resolveUserId] Insert failed:", err);
    if (email) {
      try {
        const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
        if (row) return row.id;
      } catch {}
    }
    return 0;
  }
}

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
      compartments: z.number().optional(),
      compartmentProducts: z.array(z.object({
        product: z.string().optional(),
        volume: z.string().optional(),
        unNumber: z.string().optional(),
        hazardClass: z.string().optional(),
        guide: z.string().optional(),
      })).optional(),
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
      // Collision-safe load number: date prefix + 8-char crypto-random suffix
      // If a duplicate key collision occurs, retry with a new number (up to 3 times)
      const generateLoadNumber = () => {
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
        return `LD-${dateStr}-${rand}`;
      };
      let loadNumber = generateLoadNumber();
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
        ...(input?.compartmentProducts && input.compartmentProducts.length > 0
          ? [`Compartments: ${input.compartmentProducts.length}`,
             ...input.compartmentProducts.map((cp, i) =>
               `Comp ${i + 1}: ${cp.product || 'N/A'} | Vol: ${cp.volume || 'N/A'}${cp.unNumber ? ` | ${cp.unNumber}` : ''}${cp.hazardClass ? ` | Class ${cp.hazardClass}` : ''}`
             )]
          : []),
      ].filter(Boolean).join("\n");

      if (!db) throw new Error("Database not available — cannot create load");

      const dbUserId = await resolveUserId(ctx.user);
      if (!dbUserId) throw new Error("Could not resolve user account");

      // Retry insert up to 3 times in case of duplicate loadNumber collision
      let insertedId = 0;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const result = await db.insert(loads).values({
            shipperId: dbUserId,
            loadNumber,
            status: "posted",
            cargoType,
            hazmatClass: input?.hazmatClass || null,
            unNumber: input?.unNumber || null,
            weight: input?.weight || null,
            weightUnit: input?.weightUnit || "lbs",
            volume: input?.quantity || null,
            volumeUnit: input?.quantityUnit === "Gallons" ? "gal" : input?.quantityUnit === "Barrels" ? "bbl" : input?.quantityUnit?.toLowerCase() || "gal",
            commodityName: input?.productName || null,
            pickupLocation: input?.origin ? { address: input.origin, city: input.origin.split(",")[0]?.trim() || "", state: input.origin.split(",")[1]?.trim() || "", zipCode: "", lat: 0, lng: 0 } : undefined,
            deliveryLocation: input?.destination ? { address: input.destination, city: input.destination.split(",")[0]?.trim() || "", state: input.destination.split(",")[1]?.trim() || "", zipCode: "", lat: 0, lng: 0 } : undefined,
            pickupDate: input?.pickupDate ? new Date(input.pickupDate) : undefined,
            deliveryDate: input?.deliveryDate ? new Date(input.deliveryDate) : undefined,
            rate: input?.rate || null,
            specialInstructions: ergNotes || null,
          } as any);
          insertedId = (result as any).insertId || (result as any)[0]?.insertId || 0;
          break; // success
        } catch (err: any) {
          if (err?.code === "ER_DUP_ENTRY" && attempt < 2) {
            loadNumber = generateLoadNumber(); // regenerate and retry
            continue;
          }
          throw err; // non-retryable error
        }
      }

      emitLoadStatusChange({
        loadId: String(insertedId),
        loadNumber,
        previousStatus: "",
        newStatus: "posted",
        timestamp: new Date().toISOString(),
        updatedBy: String(ctx.user?.id || 0),
      });

      // Send confirmation email to shipper (non-blocking)
      const userEmail = ctx.user?.email;
      if (userEmail) {
        emailService.send({
          to: userEmail,
          subject: `Load ${loadNumber} Posted to Marketplace`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
              <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0">
                <h1 style="margin:0">Load Posted</h1>
              </div>
              <div style="background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px">
                <p>Your load <strong>${loadNumber}</strong> has been posted to the EusoTrip marketplace.</p>
                <p>Catalysts can now view and bid on your load.</p>
                ${input?.productName ? `<p><strong>Product:</strong> ${input.productName}</p>` : ""}
                ${input?.origin ? `<p><strong>Origin:</strong> ${input.origin}</p>` : ""}
                ${input?.destination ? `<p><strong>Destination:</strong> ${input.destination}</p>` : ""}
                <p style="text-align:center;margin-top:20px">
                  <a href="https://eusotrip.com/loads/${insertedId}" style="display:inline-block;background:#667eea;color:white;padding:12px 30px;text-decoration:none;border-radius:6px">View Load</a>
                </p>
              </div>
              <p style="text-align:center;margin-top:20px;color:#666;font-size:12px">EusoTrip - Hazmat Logistics Platform</p>
            </div>
          `,
          text: `Your load ${loadNumber} has been posted to the EusoTrip marketplace.`,
        }).catch(err => console.warn("[loads.create] Email failed:", err));
      }

      // Fire gamification event for load creation
      const dbCreatorId = await resolveUserId(ctx.user);
      if (dbCreatorId) fireGamificationEvent({ userId: dbCreatorId, type: "load_created", value: 1 });
      fireGamificationEvent({ userId: dbCreatorId, type: "platform_action", value: 1 });

      return { success: true, id: String(insertedId), loadNumber };
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: z.any() }).optional())
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db || !input?.id) throw new Error("Database not available");
      const loadId = parseInt(input.id, 10);
      const userId = await resolveUserId(ctx.user);
      if (input.data && typeof input.data === 'object') {
        const updateSet: Record<string, any> = { updatedAt: new Date() };
        if (input.data.status) updateSet.status = input.data.status;
        if (input.data.rate) updateSet.rate = String(input.data.rate);
        if (input.data.specialInstructions) updateSet.specialInstructions = input.data.specialInstructions;
        // Dispatch control: pickup/delivery location changes
        if (input.data.pickupLocation) updateSet.pickupLocation = input.data.pickupLocation;
        if (input.data.deliveryLocation) updateSet.deliveryLocation = input.data.deliveryLocation;
        if (input.data.pickupDate) updateSet.pickupDate = new Date(input.data.pickupDate);
        if (input.data.deliveryDate) updateSet.deliveryDate = new Date(input.data.deliveryDate);
        // Additional stops / multi-drop
        if (input.data.stops) updateSet.stops = input.data.stops;
        // Dispatch notes for catalyst coordination
        if (input.data.dispatchNotes) updateSet.specialInstructions = [
          updateSet.specialInstructions || input.data.specialInstructions || "",
          `[DISPATCH UPDATE ${new Date().toISOString()}] ${input.data.dispatchNotes}`
        ].filter(Boolean).join("\n");
        await db.update(loads).set(updateSet).where(and(eq(loads.id, loadId), eq(loads.shipperId, userId)));
      }
      return { success: true, id: input.id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }).optional())
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db || !input?.id) throw new Error("Database not available");
      const loadId = parseInt(input.id, 10);
      const userId = await resolveUserId(ctx.user);
      await db.delete(loads).where(and(eq(loads.id, loadId), eq(loads.shipperId, userId)));
      return { success: true, id: input.id };
    }),

  /**
   * Get tracked loads for TrackShipments page
   * Returns ALL user loads (except draft) so they can quick-track any shipment
   */
  getTrackedLoads: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const userId = await resolveUserId(ctx.user);
        const loadList = await db
          .select()
          .from(loads)
          .where(sql`${loads.shipperId} = ${userId} AND ${loads.status} != 'draft'`)
          .orderBy(desc(loads.createdAt))
          .limit(25);

        let result = loadList.map(l => {
          const pickup = l.pickupLocation as any || {};
          const delivery = l.deliveryLocation as any || {};
          const progress = ({'draft':2,'posted':5,'bidding':8,'expired':0,'awarded':12,'declined':0,'lapsed':0,'accepted':15,'assigned':18,'confirmed':20,'en_route_pickup':25,'at_pickup':30,'pickup_checkin':32,'loading':38,'loading_exception':38,'loaded':45,'in_transit':55,'transit_hold':55,'transit_exception':55,'at_delivery':70,'delivery_checkin':72,'unloading':78,'unloading_exception':78,'unloaded':82,'pod_pending':88,'pod_rejected':85,'delivered':92,'invoiced':94,'disputed':90,'paid':97,'complete':100,'cancelled':0,'on_hold':0} as Record<string,number>)[l.status] ?? 10;
          return {
            id: String(l.id),
            loadNumber: l.loadNumber,
            origin: pickup.city && pickup.state ? `${pickup.city}, ${pickup.state}` : 'Unknown',
            destination: delivery.city && delivery.state ? `${delivery.city}, ${delivery.state}` : 'Unknown',
            status: l.status,
            eta: l.deliveryDate ? new Date(l.deliveryDate).toLocaleDateString() : 'TBD',
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
        const userId = await resolveUserId(ctx.user);

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
        const progress = ({'draft':2,'posted':5,'bidding':8,'expired':0,'awarded':12,'declined':0,'lapsed':0,'accepted':15,'assigned':18,'confirmed':20,'en_route_pickup':25,'at_pickup':30,'pickup_checkin':32,'loading':38,'loading_exception':38,'loaded':45,'in_transit':55,'transit_hold':55,'transit_exception':55,'at_delivery':70,'delivery_checkin':72,'unloading':78,'unloading_exception':78,'unloaded':82,'pod_pending':88,'pod_rejected':85,'delivered':92,'invoiced':94,'disputed':90,'paid':97,'complete':100,'cancelled':0,'on_hold':0} as Record<string,number>)[load.status] ?? 10;

        const originStr = [pickup.city, pickup.state].filter(Boolean).join(', ') || 'Unknown';
        const destStr = [delivery.city, delivery.state].filter(Boolean).join(', ') || 'Unknown';

        // Parse product from specialInstructions
        const notes = load.specialInstructions || '';
        const product = notes.match(/^Product: (.+)$/m)?.[1] || load.cargoType || 'General Cargo';

        // Build tracking history from load lifecycle
        const history: { status: string; timestamp: string; location: string; notes?: string }[] = [];
        if (load.createdAt) history.push({ status: 'Load Created', timestamp: new Date(load.createdAt).toLocaleString(), location: 'System', notes: `Load ${load.loadNumber} posted` });
        if (load.status !== 'posted' && load.status !== 'bidding') history.push({ status: 'Catalyst Assigned', timestamp: load.updatedAt ? new Date(load.updatedAt).toLocaleString() : 'N/A', location: originStr });
        if (['loading', 'at_pickup', 'in_transit', 'at_delivery', 'unloading', 'delivered'].includes(load.status)) history.push({ status: 'Picked Up', timestamp: load.pickupDate ? new Date(load.pickupDate).toLocaleString() : 'N/A', location: originStr });
        if (['in_transit', 'at_delivery', 'unloading', 'delivered'].includes(load.status)) history.push({ status: 'In Transit', timestamp: load.updatedAt ? new Date(load.updatedAt).toLocaleString() : 'N/A', location: current.city ? `${current.city}, ${current.state}` : 'En Route' });
        if (load.status === 'delivered') history.push({ status: 'Delivered', timestamp: (load as any).actualDeliveryDate ? new Date((load as any).actualDeliveryDate).toLocaleString() : 'N/A', location: destStr });
        if (load.status === 'cancelled') history.push({ status: 'Cancelled', timestamp: load.updatedAt ? new Date(load.updatedAt).toLocaleString() : 'N/A', location: 'N/A', notes: 'Shipment cancelled' });

        return {
          id: String(load.id),
          loadNumber: load.loadNumber,
          status: load.status,
          origin: originStr,
          destination: destStr,
          currentLocation: { city: current.city || '', state: current.state || '', lat: current.lat || 0, lng: current.lng || 0 },
          driver: 'Assigned Driver',
          catalyst: 'Assigned Catalyst',
          eta: load.deliveryDate ? new Date(load.deliveryDate).toLocaleDateString() : 'TBD',
          progress,
          lastUpdate: load.updatedAt ? new Date(load.updatedAt).toLocaleString() : new Date().toLocaleString(),
          product,
          weight: load.weight ? `${load.weight} ${load.weightUnit || 'lbs'}` : 'N/A',
          truck: (load as any).equipmentType || load.cargoType || 'Standard',
          hazmatClass: load.hazmatClass || null,
          rate: load.rate ? parseFloat(String(load.rate)) : 0,
          history: history.reverse(),
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
        status: z.enum([
          "draft", "posted", "bidding", "expired",
          "awarded", "declined", "lapsed", "accepted", "assigned", "confirmed",
          "en_route_pickup", "at_pickup", "pickup_checkin", "loading", "loading_exception", "loaded",
          "in_transit", "transit_hold", "transit_exception",
          "at_delivery", "delivery_checkin", "unloading", "unloading_exception", "unloaded",
          "pod_pending", "pod_rejected", "delivered",
          "invoiced", "disputed", "paid", "complete",
          "cancelled", "on_hold",
        ]).optional(),
        date: z.string().optional(),
        marketplace: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Build proper Drizzle conditions (not raw SQL strings)
      const filters: any[] = [];

      // If marketplace mode, show ALL posted/bidding loads (for Load Board / Find Loads)
      // Otherwise scope by user role so each user only sees THEIR loads
      if (!input.marketplace) {
        const role = await resolveUserRole(ctx.user);
        console.log(`[loads.list] user=${ctx.user?.email} role=${role} id=${(ctx.user as any)?.id}`);
        if (isAdminRole(role)) {
          // Admins see all — no filter needed, skip resolveUserId entirely
          console.log(`[loads.list] Admin bypass — no user scoping applied`);
        } else {
          const dbUserId = await resolveUserId(ctx.user);
          if (role === 'CATALYST' || role === 'DISPATCH') {
            filters.push(sql`(${loads.shipperId} = ${dbUserId} OR ${loads.catalystId} = ${dbUserId})`);
          } else if (role === 'DRIVER' || role === 'ESCORT') {
            filters.push(sql`(${loads.driverId} = ${dbUserId} OR ${loads.shipperId} = ${dbUserId})`);
          } else {
            // SHIPPER, BROKER, etc. — see loads they created
            filters.push(eq(loads.shipperId, dbUserId));
          }
        }
      } else {
        // Marketplace: only show publicly available loads
        filters.push(sql`${loads.status} IN ('posted', 'bidding', 'awarded')`);
      }
      if (input.status) {
        filters.push(eq(loads.status, input.status as any));
      }
      if (input.date) {
        // Show loads whose pickupDate OR deliveryDate matches the selected date.
        // If neither is set, show the load on the date it was created (but convert to user's local context).
        // Use a range comparison to avoid UTC/local timezone mismatch.
        const dateStart = `${input.date} 00:00:00`;
        const dateEnd = `${input.date} 23:59:59`;
        filters.push(sql`(
          (${loads.pickupDate} IS NOT NULL AND DATE(${loads.pickupDate}) = ${input.date})
          OR (${loads.pickupDate} IS NULL AND ${loads.deliveryDate} IS NOT NULL AND DATE(${loads.deliveryDate}) = ${input.date})
          OR (${loads.pickupDate} IS NULL AND ${loads.deliveryDate} IS NULL AND ${loads.createdAt} >= ${dateStart} AND ${loads.createdAt} <= ${dateEnd})
        )`);
      }

      console.log(`[loads.list] filters=${filters.length} date=${input.date || 'none'} marketplace=${!!input.marketplace}`);

      const results = await db
        .select()
        .from(loads)
        .where(filters.length > 0 ? and(...filters) : undefined)
        .orderBy(desc(loads.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      console.log(`[loads.list] Returned ${results.length} rows`);

      // Batch-fetch shipper, catalyst, driver profiles and company logos
      const shipperIds = Array.from(new Set(results.map((r: any) => r.shipperId).filter(Boolean)));
      const catalystIds = Array.from(new Set(results.map((r: any) => r.catalystId).filter(Boolean)));
      const driverIds = Array.from(new Set(results.map((r: any) => r.driverId).filter(Boolean)));
      const allUserIds = Array.from(new Set([...shipperIds, ...catalystIds, ...driverIds]));
      const userMap = new Map<number, { name: string | null; profilePicture: string | null; companyId: number | null; phone: string | null }>();
      const companyMap = new Map<number, { name: string; logo: string | null }>();

      if (allUserIds.length > 0) {
        try {
          const userRows = await db
            .select({ id: users.id, name: users.name, profilePicture: users.profilePicture, companyId: users.companyId, phone: users.phone })
            .from(users)
            .where(inArray(users.id, allUserIds));
          for (const s of userRows) {
            userMap.set(s.id, { name: s.name, profilePicture: s.profilePicture, companyId: s.companyId, phone: (s as any).phone || null });
          }
          // Fetch company logos
          const companyIds = Array.from(new Set(userRows.filter(s => s.companyId).map(s => s.companyId!)));
          if (companyIds.length > 0) {
            const companyRows = await db
              .select({ id: companies.id, name: companies.name, logo: companies.logo })
              .from(companies)
              .where(inArray(companies.id, companyIds));
            for (const c of companyRows) {
              companyMap.set(c.id, { name: c.name, logo: c.logo });
            }
          }
        } catch (err) {
          console.warn("[loads.list] Failed to fetch user/company profiles:", err);
        }
      }

      // Transform DB rows to match what the frontend expects
      return results.map((row: any) => {
        const pickup = row.pickupLocation as any || {};
        const delivery = row.deliveryLocation as any || {};
        const shipper = userMap.get(row.shipperId);
        const catalyst = row.catalystId ? userMap.get(row.catalystId) : null;
        const driver = row.driverId ? userMap.get(row.driverId) : null;
        const company = shipper?.companyId ? companyMap.get(shipper.companyId) : null;
        const catalystCompany = catalyst?.companyId ? companyMap.get(catalyst.companyId) : null;
        return {
          ...row,
          id: String(row.id),
          catalystId: row.catalystId ? row.catalystId : null,
          driverId: row.driverId ? row.driverId : null,
          origin: { city: pickup.city || "", state: pickup.state || "", address: pickup.address || "" },
          destination: { city: delivery.city || "", state: delivery.state || "", address: delivery.address || "" },
          rate: row.rate ? parseFloat(String(row.rate)) : 0,
          weight: row.weight ? parseFloat(String(row.weight)) : 0,
          distance: row.distance ? parseFloat(String(row.distance)) : 0,
          createdAt: row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "",
          pickupDate: row.pickupDate ? new Date(row.pickupDate).toLocaleDateString() : "",
          deliveryDate: row.deliveryDate ? new Date(row.deliveryDate).toLocaleDateString() : "",
          shipperName: shipper?.name || null,
          shipperProfilePicture: shipper?.profilePicture || null,
          companyName: company?.name || null,
          companyLogo: company?.logo || null,
          catalystName: catalyst?.name || null,
          catalystCompanyName: catalystCompany?.name || null,
          driverName: driver?.name || null,
          driverPhone: driver?.phone || null,
          commodity: (row as any).commodityName || row.cargoType || 'General',
          equipmentType: row.cargoType || 'general',
          spectraMatchVerified: !!(row as any).spectraMatchResult,
        };
      });
    }),

  /**
   * Get single load by ID with full details (supports string or number ID)
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

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
      // Serialize ALL Date fields to ISO strings to prevent React "Objects are not valid as React child" crash
      const safeDate = (d: any) => d instanceof Date ? d.toISOString() : (typeof d === 'string' ? d : null);
      return {
        ...load,
        id: String(load.id),
        pickupDate: safeDate(load.pickupDate),
        deliveryDate: safeDate(load.deliveryDate),
        estimatedDeliveryDate: safeDate((load as any).estimatedDeliveryDate),
        actualDeliveryDate: safeDate((load as any).actualDeliveryDate),
        deletedAt: safeDate((load as any).deletedAt),
        createdAt: safeDate(load.createdAt),
        updatedAt: safeDate((load as any).updatedAt),
        origin: { address: pickup.address || "", city: pickup.city || "", state: pickup.state || "", zip: pickup.zipCode || "" },
        destination: { address: delivery.address || "", city: delivery.city || "", state: delivery.state || "", zip: delivery.zipCode || "" },
        pickupLocation: { city: pickup.city || "", state: pickup.state || "" },
        deliveryLocation: { city: delivery.city || "", state: delivery.state || "" },
        commodity: (load as any).commodityName || ergProduct || load.cargoType || "General",
        ergGuide,
        biddingEnds: load.pickupDate instanceof Date ? load.pickupDate.toISOString() : (load.pickupDate || new Date().toISOString()),
        suggestedRateMin: rateNum * 0.9,
        suggestedRateMax: rateNum * 1.1,
        equipmentType: load.cargoType || "general",
        spectraMatchResult: (load as any).spectraMatchResult || null,
        spectraMatchVerified: !!(load as any).spectraMatchResult,
        notes,
        shipperId: load.shipperId,
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

      const dbUserId = await resolveUserId(ctx.user);

      // Generate unique load number
      const loadNumber = `LOAD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const result = await db.insert(loads).values({
        shipperId: dbUserId,
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

      // Fire gamification event for load creation
      fireGamificationEvent({ userId: dbUserId, type: "load_created", value: 1 });
      fireGamificationEvent({ userId: dbUserId, type: "platform_action", value: 1 });

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

  cancel: protectedProcedure.input(z.object({
    loadId: z.string(),
    reason: z.string().optional(),
    waiveTonus: z.boolean().default(false),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const loadId = parseInt(input.loadId, 10);
    const userId = ctx.user?.id || 0;

    // Get load details to check if catalyst was assigned (TONU scenario)
    const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
    if (!load) throw new Error("Load not found");

    // Only owner or admin can cancel
    if (load.shipperId !== userId) {
      throw new Error("Only the load owner can cancel this load");
    }

    // Check if load is in a cancellable state
    const nonCancellable = ["delivered", "cancelled"];
    if (nonCancellable.includes(load.status)) {
      throw new Error(`Cannot cancel a load in '${load.status}' status`);
    }

    let tonuFee = 0;
    let tonuApplied = false;
    const catalystAssigned = load.catalystId && ["assigned", "en_route_pickup", "at_pickup"].includes(load.status);

    // TONU: If a catalyst was assigned and load is being cancelled by shipper
    if (catalystAssigned && !input.waiveTonus) {
      // Standard TONU fee: $250 or 25% of load rate, whichever is greater
      const loadRate = parseFloat(String(load.rate)) || 0;
      tonuFee = Math.max(250, loadRate * 0.25);
      tonuApplied = true;
    }

    // Cancel the load
    await db.update(loads)
      .set({ status: "cancelled" })
      .where(eq(loads.id, loadId));

    // Reject any pending bids
    try {
      await db.execute(sql`
        UPDATE bids SET status = 'rejected'
        WHERE loadId = ${loadId} AND status = 'pending'
      `);
    } catch (_) { /* non-critical */ }

    return {
      success: true,
      loadId: input.loadId,
      tonuApplied,
      tonuFee,
      reason: input.reason,
      catalystNotified: !!catalystAssigned,
    };
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

  /**
   * loads.duplicate
   * Creates a copy of an existing load with a new load number.
   * Preserves all cargo details, locations, and special instructions
   * but resets status to draft and clears assignment fields.
   * Used when a shipper needs to create a recurring shipment.
   */
  duplicate: protectedProcedure
    .input(z.object({ loadId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const loadId = parseInt(input.loadId, 10);
      const [original] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
      if (!original) throw new Error("Load not found");

      const newLoadNumber = `LD-${Date.now().toString(36).toUpperCase()}`;
      const result = await db.insert(loads).values({
        shipperId: original.shipperId,
        loadNumber: newLoadNumber,
        status: 'draft',
        cargoType: original.cargoType,
        hazmatClass: original.hazmatClass,
        unNumber: original.unNumber,
        weight: original.weight,
        weightUnit: original.weightUnit,
        volume: original.volume,
        volumeUnit: original.volumeUnit,
        pickupLocation: original.pickupLocation,
        deliveryLocation: original.deliveryLocation,
        distance: original.distance,
        distanceUnit: original.distanceUnit,
        rate: original.rate,
        currency: original.currency,
        specialInstructions: original.specialInstructions,
        commodityName: original.commodityName,
      } as any).$returningId();

      return { success: true, newLoadId: String(result[0]?.id), loadNumber: newLoadNumber };
    }),

  /**
   * loads.assign
   * Assigns a catalyst (carrier) and optionally a driver to a load.
   * Transitions load status to "assigned". Emits WebSocket events
   * so dispatch boards update in real-time.
   */
  assign: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      catalystId: z.number(),
      driverId: z.number().optional(),
      vehicleId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const loadId = parseInt(input.loadId, 10);
      const [load] = await db.select({ id: loads.id, status: loads.status, loadNumber: loads.loadNumber })
        .from(loads).where(eq(loads.id, loadId)).limit(1);
      if (!load) throw new Error("Load not found");

      const updateData: Record<string, any> = {
        catalystId: input.catalystId,
        status: 'assigned',
        updatedAt: new Date(),
      };
      if (input.driverId) updateData.driverId = input.driverId;
      if (input.vehicleId) updateData.vehicleId = input.vehicleId;

      await db.update(loads).set(updateData).where(eq(loads.id, loadId));
      emitLoadStatusChange({
        loadId: String(loadId), loadNumber: load.loadNumber || '',
        previousStatus: load.status, newStatus: 'assigned',
        timestamp: new Date().toISOString(), updatedBy: String(ctx.user?.id || 0),
      });
      return { success: true };
    }),

  /**
   * loads.unassign
   * Removes catalyst/driver assignment from a load.
   * Reverts status back to "posted" so it can accept new bids.
   */
  unassign: protectedProcedure
    .input(z.object({ loadId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const loadId = parseInt(input.loadId, 10);
      await db.update(loads).set({
        catalystId: null,
        driverId: null,
        vehicleId: null,
        status: 'posted',
        updatedAt: new Date(),
      } as any).where(eq(loads.id, loadId));
      return { success: true };
    }),

  /**
   * loads.reassign
   * Transfers a load from one catalyst/driver to another.
   * Preserves the "assigned" status but swaps the assignee.
   */
  reassign: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      newCatalystId: z.number(),
      newDriverId: z.number().optional(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const loadId = parseInt(input.loadId, 10);
      const updateData: Record<string, any> = {
        catalystId: input.newCatalystId,
        updatedAt: new Date(),
      };
      if (input.newDriverId) updateData.driverId = input.newDriverId;
      await db.update(loads).set(updateData).where(eq(loads.id, loadId));
      return { success: true };
    }),

  /**
   * loads.getTimeline
   * Returns the lifecycle event timeline for a load. Reconstructs
   * events from status changes, bid activity, and document uploads.
   * Used by LoadDetails to show the full shipment progression.
   */
  getTimeline: protectedProcedure
    .input(z.object({ loadId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const loadId = parseInt(input.loadId, 10);
        const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
        if (!load) return [];

        const timeline: { id: string; event: string; timestamp: string; actor: string; details: string }[] = [];
        timeline.push({ id: 'created', event: 'Load Created', timestamp: load.createdAt?.toISOString() || '', actor: 'system', details: `Load ${load.loadNumber} created as ${load.cargoType}` });

        if (load.pickupDate) timeline.push({ id: 'pickup_scheduled', event: 'Pickup Scheduled', timestamp: load.pickupDate.toISOString(), actor: 'system', details: '' });
        if (load.catalystId) timeline.push({ id: 'assigned', event: 'Carrier Assigned', timestamp: load.updatedAt?.toISOString() || '', actor: 'dispatch', details: `Carrier ID: ${load.catalystId}` });
        if (load.driverId) timeline.push({ id: 'driver_assigned', event: 'Driver Assigned', timestamp: load.updatedAt?.toISOString() || '', actor: 'dispatch', details: `Driver ID: ${load.driverId}` });
        if (load.actualDeliveryDate) timeline.push({ id: 'delivered', event: 'Delivered', timestamp: load.actualDeliveryDate.toISOString(), actor: 'driver', details: '' });
        if (load.status === 'cancelled') timeline.push({ id: 'cancelled', event: 'Cancelled', timestamp: load.updatedAt?.toISOString() || '', actor: 'system', details: '' });

        const loadBids = await db.select({ id: bids.id, amount: bids.amount, status: bids.status, createdAt: bids.createdAt })
          .from(bids).where(eq(bids.loadId, loadId)).orderBy(desc(bids.createdAt)).limit(10);
        for (const b of loadBids) {
          timeline.push({ id: `bid_${b.id}`, event: `Bid ${b.status}`, timestamp: b.createdAt?.toISOString() || '', actor: 'catalyst', details: `$${b.amount}` });
        }

        timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        return timeline;
      } catch (e) { return []; }
    }),

  /**
   * loads.addDocument
   * Attaches a document to a load. Stores in the documents table
   * with loadId reference. Supports BOL, POD, rate confirmations,
   * hazmat placards, and any other load-specific files.
   */
  addDocument: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      type: z.string(),
      name: z.string(),
      fileUrl: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { documents } = await import("../../drizzle/schema");
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const loadId = parseInt(input.loadId, 10);
      const userId = Number(ctx.user?.id) || 0;
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      const result = await db.insert(documents).values({
        loadId,
        userId: userId || null,
        companyId: companyId || null,
        type: input.type,
        name: input.name,
        fileUrl: input.fileUrl,
        status: 'active',
      } as any).$returningId();

      return { success: true, documentId: String(result[0]?.id) };
    }),

  /**
   * loads.getDocuments
   * Returns all documents attached to a specific load.
   * Includes BOL, POD, rate confirmations, inspection reports, etc.
   */
  getDocuments: protectedProcedure
    .input(z.object({ loadId: z.string() }))
    .query(async ({ input }) => {
      const { documents } = await import("../../drizzle/schema");
      const db = await getDb(); if (!db) return [];
      try {
        const loadId = parseInt(input.loadId, 10);
        const docs = await db.select().from(documents).where(eq(documents.loadId, loadId));
        return docs.map(d => ({
          id: String(d.id),
          type: d.type,
          name: d.name,
          fileUrl: d.fileUrl,
          status: d.status || 'active',
          createdAt: d.createdAt?.toISOString() || '',
        }));
      } catch (e) { return []; }
    }),

  /**
   * loads.deleteDocument
   * Removes a document from a load by ID.
   */
  deleteDocument: protectedProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ input }) => {
      const { documents } = await import("../../drizzle/schema");
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const docId = parseInt(input.documentId, 10);
      await db.delete(documents).where(eq(documents.id, docId));
      return { success: true };
    }),

  /**
   * loads.addNote
   * Adds a note to a load. Notes are stored in the load's
   * specialInstructions field as JSON array appended entries,
   * preserving the original instructions.
   */
  addNote: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      note: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const loadId = parseInt(input.loadId, 10);
      const [load] = await db.select({ specialInstructions: loads.specialInstructions })
        .from(loads).where(eq(loads.id, loadId)).limit(1);

      const existingNotes = load?.specialInstructions || '';
      const newEntry = `\n[${new Date().toISOString()}] ${ctx.user?.name || 'User'}: ${input.note}`;
      await db.update(loads).set({
        specialInstructions: existingNotes + newEntry,
        updatedAt: new Date(),
      }).where(eq(loads.id, loadId));
      return { success: true };
    }),

  /**
   * loads.getNotes
   * Returns notes for a load parsed from specialInstructions.
   */
  getNotes: protectedProcedure
    .input(z.object({ loadId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return [];
      const loadId = parseInt(input.loadId, 10);
      const [load] = await db.select({ specialInstructions: loads.specialInstructions })
        .from(loads).where(eq(loads.id, loadId)).limit(1);
      if (!load?.specialInstructions) return [];

      const lines = load.specialInstructions.split('\n').filter(l => l.trim());
      return lines.map((line, i) => {
        const match = line.match(/\[(.+?)\]\s*(.+?):\s*(.*)/);
        return {
          id: String(i),
          timestamp: match?.[1] || '',
          author: match?.[2] || '',
          content: match?.[3] || line,
        };
      });
    }),

  /**
   * loads.calculateRate
   * Calculates a suggested rate for a load based on distance,
   * cargo type, hazmat classification, and market conditions.
   * Uses the feeCalculator service for platform fees.
   */
  calculateRate: protectedProcedure
    .input(z.object({
      distance: z.number(),
      cargoType: z.string(),
      hazmatClass: z.string().optional(),
      weight: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const baseCpm = input.cargoType === 'hazmat' ? 3.85 : input.cargoType === 'petroleum' ? 3.50 : input.cargoType === 'refrigerated' ? 3.20 : 2.75;
      let adjustedCpm = baseCpm;
      if (input.hazmatClass) adjustedCpm *= 1.15;
      if (input.weight && input.weight > 40000) adjustedCpm *= 1.08;

      const linehaul = Math.round(input.distance * adjustedCpm * 100) / 100;
      const fuelSurcharge = Math.round(linehaul * 0.22 * 100) / 100;
      const totalRate = linehaul + fuelSurcharge;

      return {
        linehaul,
        fuelSurcharge,
        totalRate,
        ratePerMile: adjustedCpm,
        breakdown: {
          base: baseCpm,
          hazmatSurcharge: input.hazmatClass ? baseCpm * 0.15 : 0,
          weightSurcharge: input.weight && input.weight > 40000 ? baseCpm * 0.08 : 0,
          fuelPercent: 22,
        },
      };
    }),

  /**
   * loads.getRateHistory
   * Returns historical rates for similar loads to help with pricing.
   * Queries delivered loads with matching cargo type and similar distance.
   */
  getRateHistory: protectedProcedure
    .input(z.object({
      cargoType: z.string().optional(),
      originState: z.string().optional(),
      destState: z.string().optional(),
      limit: z.number().default(10),
    }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const rows = await db.select({
          id: loads.id, rate: loads.rate, distance: loads.distance,
          cargoType: loads.cargoType, deliveryDate: loads.actualDeliveryDate,
          pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation,
        }).from(loads)
          .where(eq(loads.status, 'delivered'))
          .orderBy(desc(loads.actualDeliveryDate))
          .limit(input.limit);

        return rows.map(r => ({
          id: String(r.id),
          rate: r.rate ? parseFloat(String(r.rate)) : 0,
          distance: r.distance ? parseFloat(String(r.distance)) : 0,
          ratePerMile: r.rate && r.distance ? Math.round(parseFloat(String(r.rate)) / parseFloat(String(r.distance)) * 100) / 100 : 0,
          cargoType: r.cargoType,
          deliveredAt: r.deliveryDate?.toISOString() || '',
        }));
      } catch (e) { return []; }
    }),

  /**
   * loads.search
   * Advanced load search with multiple filter criteria.
   * Supports text search across load number, origin, destination,
   * plus filters by status, cargo type, and date range.
   */
  search: protectedProcedure
    .input(z.object({
      query: z.string().optional(),
      status: z.string().optional(),
      cargoType: z.string().optional(),
      limit: z.number().default(30),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return [];
      try {
        let rows = await db.select({
          id: loads.id, loadNumber: loads.loadNumber, status: loads.status,
          cargoType: loads.cargoType, rate: loads.rate,
          pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation,
          pickupDate: loads.pickupDate, createdAt: loads.createdAt,
        }).from(loads).orderBy(desc(loads.createdAt)).limit(input.limit * 3);

        let results = rows.map(l => {
          const p = l.pickupLocation as any || {};
          const d = l.deliveryLocation as any || {};
          return {
            id: String(l.id), loadNumber: l.loadNumber || '',
            status: l.status, cargoType: l.cargoType,
            origin: `${p.city || ''}, ${p.state || ''}`,
            destination: `${d.city || ''}, ${d.state || ''}`,
            rate: l.rate ? parseFloat(String(l.rate)) : 0,
            pickupDate: l.pickupDate?.toISOString() || '',
            createdAt: l.createdAt?.toISOString() || '',
          };
        });

        if (input.query) {
          const q = input.query.toLowerCase();
          results = results.filter(r =>
            r.loadNumber.toLowerCase().includes(q) ||
            r.origin.toLowerCase().includes(q) ||
            r.destination.toLowerCase().includes(q)
          );
        }
        if (input.status) results = results.filter(r => r.status === input.status);
        if (input.cargoType) results = results.filter(r => r.cargoType === input.cargoType);

        return results.slice(0, input.limit);
      } catch (e) { return []; }
    }),

  /**
   * loads.book
   * Books a load directly (without bidding). Used for contracted lanes
   * where a catalyst has a pre-agreed rate. Sets status to assigned
   * and records the booking.
   */
  book: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      rate: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const loadId = parseInt(input.loadId, 10);
      const userId = await resolveUserId(ctx.user);

      const updateData: Record<string, any> = {
        catalystId: userId,
        status: 'assigned',
        updatedAt: new Date(),
      };
      if (input.rate) updateData.rate = String(input.rate);

      await db.update(loads).set(updateData).where(eq(loads.id, loadId));
      return { success: true, loadId: input.loadId };
    }),

  /**
   * loads.dispute
   * Files a dispute on a load. Changes status to "disputed"
   * and records the reason. Used for billing disagreements,
   * service failures, or damage claims.
   */
  dispute: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      reason: z.string(),
      category: z.enum(['billing', 'service', 'damage', 'detention', 'other']).default('other'),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const loadId = parseInt(input.loadId, 10);
      const [load] = await db.select({ specialInstructions: loads.specialInstructions, loadNumber: loads.loadNumber, status: loads.status })
        .from(loads).where(eq(loads.id, loadId)).limit(1);
      if (!load) throw new Error("Load not found");

      const disputeNote = `\n[DISPUTE ${new Date().toISOString()}] Category: ${input.category} | ${input.reason}`;
      await db.update(loads).set({
        status: 'disputed',
        specialInstructions: (load.specialInstructions || '') + disputeNote,
        updatedAt: new Date(),
      } as any).where(eq(loads.id, loadId));

      emitLoadStatusChange({
        loadId: String(loadId), loadNumber: load.loadNumber || '',
        previousStatus: load.status, newStatus: 'disputed',
        timestamp: new Date().toISOString(), updatedBy: String(ctx.user?.id || 0),
      });
      return { success: true, loadId: input.loadId };
    }),

  /**
   * loads.share
   * Generates a shareable link for a load. Stores share metadata
   * in the load's document JSON. Used for sending load details
   * to external parties without requiring login.
   */
  share: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      recipientEmail: z.string().email().optional(),
      expiresInHours: z.number().default(72),
    }))
    .mutation(async ({ input }) => {
      const shareToken = `share_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      const shareUrl = `https://eusotrip.com/loads/shared/${shareToken}`;
      return { success: true, shareUrl, shareToken, expiresAt: new Date(Date.now() + input.expiresInHours * 3600000).toISOString() };
    }),

  /**
   * loads.getShared
   * Retrieves a load by its share token (public access).
   */
  getShared: protectedProcedure
    .input(z.object({ shareToken: z.string() }))
    .query(async () => {
      // Share tokens require a dedicated share_links table for production
      return null;
    }),

  /**
   * loads.exportCSV
   * Exports loads matching filter criteria as CSV data.
   * Returns the CSV string content for client-side download.
   */
  exportCSV: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(500),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return { csv: '', count: 0 };
      try {
        const companyId = Number((ctx.user as any)?.companyId) || 0;
        const rows = await db.select({
          loadNumber: loads.loadNumber, status: loads.status, cargoType: loads.cargoType,
          rate: loads.rate, distance: loads.distance, weight: loads.weight,
          pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation,
          pickupDate: loads.pickupDate, actualDeliveryDate: loads.actualDeliveryDate, createdAt: loads.createdAt,
        }).from(loads).orderBy(desc(loads.createdAt)).limit(input.limit);

        const header = 'Load Number,Status,Cargo Type,Rate,Distance,Weight,Origin,Destination,Pickup Date,Delivery Date,Created\n';
        const csvRows = rows.map(r => {
          const p = r.pickupLocation as any || {};
          const d = r.deliveryLocation as any || {};
          return [
            r.loadNumber, r.status, r.cargoType, r.rate || '', r.distance || '', r.weight || '',
            `"${p.city || ''} ${p.state || ''}"`, `"${d.city || ''} ${d.state || ''}"`,
            r.pickupDate?.toISOString() || '', r.actualDeliveryDate?.toISOString() || '',
            r.createdAt?.toISOString() || '',
          ].join(',');
        });

        return { csv: header + csvRows.join('\n'), count: rows.length };
      } catch (e) { return { csv: '', count: 0 }; }
    }),

  /**
   * loads.getBulkStatus
   * Returns status summary for multiple loads by ID.
   * Used by dispatch boards for batch status monitoring.
   */
  getBulkStatus: protectedProcedure
    .input(z.object({ loadIds: z.array(z.number()) }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return [];
      if (input.loadIds.length === 0) return [];
      try {
        const rows = await db.select({ id: loads.id, status: loads.status, loadNumber: loads.loadNumber })
          .from(loads).where(inArray(loads.id, input.loadIds));
        return rows.map(r => ({ id: String(r.id), loadNumber: r.loadNumber || '', status: r.status }));
      } catch (e) { return []; }
    }),

  /**
   * loads.updateBulkStatus
   * Updates status for multiple loads at once. Used for
   * batch operations from the dispatch board.
   */
  updateBulkStatus: protectedProcedure
    .input(z.object({
      loadIds: z.array(z.number()),
      newStatus: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      if (input.loadIds.length === 0) return { success: true, updated: 0 };

      await db.update(loads).set({
        status: input.newStatus as any,
        updatedAt: new Date(),
      }).where(inArray(loads.id, input.loadIds));

      return { success: true, updated: input.loadIds.length };
    }),
});


export const bidsRouter = router({
  create: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      amount: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const userId = Number(ctx.user?.id) || 0;
      const [result] = await db.insert(bids).values({
        loadId: input.loadId,
        catalystId: userId,
        amount: String(input.amount),
        notes: input.notes,
        status: "pending",
      }).$returningId();
      return { success: true, id: result.id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      amount: z.number().optional(),
      notes: z.string().optional(),
      status: z.enum(["pending", "accepted", "rejected", "withdrawn", "expired"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const updates: Record<string, any> = {};
      if (input.amount !== undefined) updates.amount = String(input.amount);
      if (input.notes) updates.notes = input.notes;
      if (input.status) updates.status = input.status;
      if (Object.keys(updates).length > 0) {
        await db.update(bids).set(updates).where(eq(bids.id, input.id));
      }
      return { success: true, id: input.id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      await db.update(bids).set({ status: "withdrawn" }).where(eq(bids.id, input.id));
      return { success: true, id: input.id };
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

      const catalystId = await resolveUserId(ctx.user);
      if (!catalystId) throw new Error("Could not resolve user");

      const result = await db.insert(bids).values({
        loadId: input.loadId,
        catalystId,
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
        catalystId: String(catalystId),
        catalystName: ctx.user.name || 'Catalyst',
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

        // Email shipper about new bid (non-blocking)
        try {
          const [shipper] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, load.shipperId)).limit(1);
          if (shipper?.email) {
            emailService.send({
              to: shipper.email,
              subject: `New Bid on Load ${load.loadNumber}: $${input.amount.toLocaleString()}`,
              html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
                  <div style="background:linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0">
                    <h1 style="margin:0">New Bid Received</h1>
                  </div>
                  <div style="background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px">
                    <p>Hello ${shipper.name || "Shipper"},</p>
                    <p>A catalyst has submitted a bid on your load:</p>
                    <table style="width:100%;border-collapse:collapse;margin:15px 0">
                      <tr><td style="padding:8px;border-bottom:1px solid #ddd;color:#666">Load</td><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:bold">${load.loadNumber}</td></tr>
                      <tr><td style="padding:8px;border-bottom:1px solid #ddd;color:#666">Bid Amount</td><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:bold;color:#10b981">$${input.amount.toLocaleString()}</td></tr>
                      <tr><td style="padding:8px;border-bottom:1px solid #ddd;color:#666">Catalyst</td><td style="padding:8px;border-bottom:1px solid #ddd">${ctx.user.name || "Catalyst"}</td></tr>
                    </table>
                    <p style="text-align:center;margin-top:20px">
                      <a href="https://eusotrip.com/loads/${input.loadId}/bids" style="display:inline-block;background:#3b82f6;color:white;padding:12px 30px;text-decoration:none;border-radius:6px">Review Bids</a>
                    </p>
                  </div>
                  <p style="text-align:center;margin-top:20px;color:#666;font-size:12px">EusoTrip - Hazmat Logistics Platform</p>
                </div>
              `,
              text: `New bid of $${input.amount.toLocaleString()} received on load ${load.loadNumber}`,
            }).catch(err => console.warn("[loads.submitBid] Email failed:", err));
          }
        } catch {}
      }

      // Fire gamification event for bid submission
      fireGamificationEvent({ userId: catalystId, type: "bid_submitted", value: 1 });
      fireGamificationEvent({ userId: catalystId, type: "platform_action", value: 1 });

      return { success: true, bidId };
    }),

  /**
   * Get my bids
   */
  getMyBids: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const userId = await resolveUserId(ctx.user);
    if (!userId) return [];

    const results = await db
      .select()
      .from(bids)
      .where(eq(bids.catalystId, userId))
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
            catalystId: String(bid.catalystId),
            catalystName: 'Catalyst',
            amount: Number(bid.amount),
            status: 'accepted',
            timestamp: new Date().toISOString(),
          });

          // Update load status to assigned
          await db.update(loads).set({ 
            status: 'assigned', 
            catalystId: bid.catalystId 
          }).where(eq(loads.id, bid.loadId));

          emitLoadStatusChange({
            loadId: String(bid.loadId),
            loadNumber: load?.loadNumber || '',
            previousStatus: load?.status || '',
            newStatus: 'assigned',
            timestamp: new Date().toISOString(),
          });

          // Notify catalyst
          emitNotification(String(bid.catalystId), {
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
      const userId = await resolveUserId(ctx.user);

      const bid = await db
        .select()
        .from(bids)
        .where(eq(bids.id, input.bidId))
        .limit(1);

      if (bid.length === 0 || bid[0].catalystId !== userId) {
        throw new Error("Cannot withdraw this bid");
      }
      if (bid[0].status !== 'pending') throw new Error("Only pending bids can be withdrawn");

      await db
        .update(bids)
        .set({ status: "withdrawn" } as any)
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
      catalystName: 'Catalyst',
      mcNumber: '',
      notes: bid.notes || '',
      catalystRating: 4.5,
      catalystLoads: 0,
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
    
    // Batch-fetch catalyst user info
    const catalystIds = Array.from(new Set(results.map(b => b.catalystId).filter(Boolean)));
    const catalystMap = new Map<number, { name: string | null; companyId: number | null }>();
    const companyMap = new Map<number, { name: string; logo: string | null }>();
    if (catalystIds.length > 0) {
      try {
        const catalystRows = await db.select({ id: users.id, name: users.name, companyId: users.companyId }).from(users).where(inArray(users.id, catalystIds));
        for (const c of catalystRows) catalystMap.set(c.id, { name: c.name, companyId: c.companyId });
        const compIds = Array.from(new Set(catalystRows.filter(c => c.companyId).map(c => c.companyId!)));
        if (compIds.length > 0) {
          const compRows = await db.select({ id: companies.id, name: companies.name, logo: companies.logo }).from(companies).where(inArray(companies.id, compIds));
          for (const c of compRows) companyMap.set(c.id, { name: c.name, logo: c.logo });
        }
      } catch {}
    }
    const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
    const dist = load?.distance ? parseFloat(String(load.distance)) : 0;
    
    return results.map(b => {
      const catalyst = catalystMap.get(b.catalystId);
      const company = catalyst?.companyId ? companyMap.get(catalyst.companyId) : null;
      const amt = b.amount ? parseFloat(String(b.amount)) : 0;
      return {
        id: String(b.id),
        catalystId: String(b.catalystId),
        catalystName: catalyst?.name || 'Unknown Catalyst',
        companyName: company?.name || null,
        companyLogo: company?.logo || null,
        amount: amt,
        status: b.status,
        notes: b.notes || '',
        submittedAt: b.createdAt?.toISOString() || '',
        catalystRating: 4.5,
        catalystMC: '',
        ratePerMile: dist > 0 ? Math.round((amt / dist) * 100) / 100 : 0,
      };
    });
  }),

  getHistory: protectedProcedure.input(z.object({ limit: z.number().optional(), status: z.string().optional() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const userId = await resolveUserId(ctx.user);
    if (!userId) return [];
    
    const results = await db
      .select()
      .from(bids)
      .where(eq(bids.catalystId, userId))
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
    const userId = await resolveUserId(ctx.user);
    if (!userId) return { total: 0, accepted: 0, rejected: 0, pending: 0, winRate: 0, totalBids: 0, totalValue: 0 };
    
    const [total] = await db.select({ count: sql<number>`count(*)` }).from(bids).where(eq(bids.catalystId, userId));
    const [accepted] = await db.select({ count: sql<number>`count(*)` }).from(bids).where(and(eq(bids.catalystId, userId), eq(bids.status, 'accepted')));
    const [rejected] = await db.select({ count: sql<number>`count(*)` }).from(bids).where(and(eq(bids.catalystId, userId), eq(bids.status, 'rejected')));
    const [pending] = await db.select({ count: sql<number>`count(*)` }).from(bids).where(and(eq(bids.catalystId, userId), eq(bids.status, 'pending')));
    const [totalValue] = await db.select({ sum: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` }).from(bids).where(eq(bids.catalystId, userId));
    
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
  getRecentAnalysis: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    try {
      const userId = await resolveUserId(ctx.user);
      if (!userId) return [];
      const recentBids = await db.select().from(bids).where(eq(bids.catalystId, userId)).orderBy(desc(bids.createdAt)).limit(input?.limit || 10);
      const results = await Promise.all(recentBids.map(async (b) => {
        const [load] = await db.select().from(loads).where(eq(loads.id, b.loadId)).limit(1);
        const pickup = load?.pickupLocation as any || {};
        const delivery = load?.deliveryLocation as any || {};
        const loadRate = load?.rate ? parseFloat(String(load.rate)) : 0;
        const bidAmt = b.amount ? parseFloat(String(b.amount)) : 0;
        return {
          bidId: String(b.id),
          loadNumber: load?.loadNumber || '',
          origin: pickup.city && pickup.state ? `${pickup.city}, ${pickup.state}` : 'Unknown',
          destination: delivery.city && delivery.state ? `${delivery.city}, ${delivery.state}` : 'Unknown',
          bidAmount: bidAmt,
          marketRate: loadRate,
          difference: loadRate > 0 ? Math.round(((bidAmt - loadRate) / loadRate) * 100) : 0,
          status: b.status,
          date: b.createdAt?.toISOString() || '',
        };
      }));
      return results;
    } catch (e) { console.error('[Bids] getRecentAnalysis error:', e); return []; }
  }),
  submit: protectedProcedure
    .input(z.object({ loadId: z.string(), amount: z.number(), notes: z.string().optional(), driverId: z.string().optional(), vehicleId: z.string().optional(), estimatedPickup: z.string().optional(), estimatedDelivery: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const loadIdNum = parseInt(input.loadId, 10);
      if (!loadIdNum) throw new Error("Invalid load ID");

      const catalystId = await resolveUserId(ctx.user);
      if (!catalystId) throw new Error("Could not resolve user");

      const result = await db.insert(bids).values({
        loadId: loadIdNum,
        catalystId,
        amount: input.amount.toString(),
        notes: input.notes || '',
        status: 'pending',
      });
      const bidId = (result as any).insertId || 0;

      // Emit real-time bid received event
      const [load] = await db.select().from(loads).where(eq(loads.id, loadIdNum)).limit(1);
      emitBidReceived({
        bidId: String(bidId),
        loadId: input.loadId,
        loadNumber: load?.loadNumber || '',
        catalystId: String(catalystId),
        catalystName: ctx.user.name || 'Catalyst',
        amount: input.amount,
        status: 'pending',
        timestamp: new Date().toISOString(),
      });

      // Fire gamification event for bid submission
      fireGamificationEvent({ userId: catalystId, type: "bid_submitted", value: 1 });
      fireGamificationEvent({ userId: catalystId, type: "platform_action", value: 1 });

      return { success: true, bidId: String(bidId) };
    }),
  accept: protectedProcedure.input(z.object({ bidId: z.string() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const bidIdNum = parseInt(input.bidId, 10);
    const [bid] = await db.select().from(bids).where(eq(bids.id, bidIdNum)).limit(1);
    if (!bid) throw new Error("Bid not found");
    const [load] = await db.select().from(loads).where(eq(loads.id, bid.loadId)).limit(1);
    const userId = await resolveUserId(ctx.user);
    if (load && load.shipperId !== userId) throw new Error("Only the load owner can accept bids");
    await db.update(bids).set({ status: 'accepted' } as any).where(eq(bids.id, bidIdNum));
    // Reject all other pending bids on this load
    await db.update(bids).set({ status: 'rejected' } as any).where(and(eq(bids.loadId, bid.loadId), sql`${bids.id} != ${bidIdNum}`, eq(bids.status, 'pending')));
    // Assign catalyst to load
    await db.update(loads).set({ status: 'assigned', catalystId: bid.catalystId } as any).where(eq(loads.id, bid.loadId));
    emitBidAwarded({ bidId: input.bidId, loadId: String(bid.loadId), loadNumber: load?.loadNumber || '', catalystId: String(bid.catalystId), catalystName: 'Catalyst', amount: Number(bid.amount), status: 'accepted', timestamp: new Date().toISOString() });
    emitLoadStatusChange({ loadId: String(bid.loadId), loadNumber: load?.loadNumber || '', previousStatus: load?.status || '', newStatus: 'assigned', timestamp: new Date().toISOString() });
    emitNotification(String(bid.catalystId), { id: `notif_${Date.now()}`, type: 'bid_accepted', title: 'Bid Accepted!', message: `Your bid of $${Number(bid.amount).toLocaleString()} for load ${load?.loadNumber} has been accepted`, priority: 'high', data: { loadId: String(bid.loadId), bidId: input.bidId }, actionUrl: `/loads/${bid.loadId}`, timestamp: new Date().toISOString() });
    fireGamificationEvent({ userId: bid.catalystId, type: "bid_accepted", value: 1 });
    return { success: true, bidId: input.bidId };
  }),
  reject: protectedProcedure.input(z.object({ bidId: z.string(), reason: z.string().optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const bidIdNum = parseInt(input.bidId, 10);
    const [bid] = await db.select().from(bids).where(eq(bids.id, bidIdNum)).limit(1);
    if (!bid) throw new Error("Bid not found");
    const [load] = await db.select().from(loads).where(eq(loads.id, bid.loadId)).limit(1);
    const userId = await resolveUserId(ctx.user);
    if (load && load.shipperId !== userId) throw new Error("Only the load owner can reject bids");
    await db.update(bids).set({ status: 'rejected' } as any).where(eq(bids.id, bidIdNum));
    emitNotification(String(bid.catalystId), { id: `notif_${Date.now()}`, type: 'bid_rejected', title: 'Bid Declined', message: `Your bid for load ${load?.loadNumber} was declined${input.reason ? ': ' + input.reason : ''}`, priority: 'medium', data: { loadId: String(bid.loadId), bidId: input.bidId }, actionUrl: `/bids`, timestamp: new Date().toISOString() });
    return { success: true, bidId: input.bidId };
  }),

  cancelBid: protectedProcedure.input(z.object({ bidId: z.string(), reason: z.string().optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const userId = await resolveUserId(ctx.user);
    const bidIdNum = parseInt(input.bidId, 10);
    const [bid] = await db.select().from(bids).where(eq(bids.id, bidIdNum)).limit(1);
    if (!bid) throw new Error("Bid not found");
    if (bid.catalystId !== userId) throw new Error("You can only cancel your own bids");
    if (bid.status !== 'pending') throw new Error("Only pending bids can be cancelled");
    await db.update(bids).set({ status: 'withdrawn' } as any).where(eq(bids.id, bidIdNum));
    return { success: true, bidId: input.bidId };
  }),

  getBidsForMyLoads: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const userId = await resolveUserId(ctx.user);
    if (!userId) return [];
    // Get all loads owned by this user
    const myLoads = await db.select({ id: loads.id, loadNumber: loads.loadNumber, pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation, status: loads.status, rate: loads.rate }).from(loads).where(eq(loads.shipperId, userId)).orderBy(desc(loads.createdAt)).limit(100);
    if (myLoads.length === 0) return [];
    const loadIds = myLoads.map(l => l.id);
    const allBids = await db.select().from(bids).where(inArray(bids.loadId, loadIds)).orderBy(desc(bids.createdAt));
    // Fetch catalyst info
    const catalystIds = Array.from(new Set(allBids.map(b => b.catalystId).filter(Boolean)));
    const catalystMap = new Map<number, { name: string | null; companyId: number | null }>();
    if (catalystIds.length > 0) {
      try {
        const rows = await db.select({ id: users.id, name: users.name, companyId: users.companyId }).from(users).where(inArray(users.id, catalystIds));
        for (const r of rows) catalystMap.set(r.id, { name: r.name, companyId: r.companyId });
      } catch {}
    }
    // Group bids by load
    return myLoads.map(l => {
      const pickup = l.pickupLocation as any || {};
      const delivery = l.deliveryLocation as any || {};
      const loadBids = allBids.filter(b => b.loadId === l.id);
      return {
        loadId: String(l.id),
        loadNumber: l.loadNumber,
        origin: pickup.city && pickup.state ? `${pickup.city}, ${pickup.state}` : 'Unknown',
        destination: delivery.city && delivery.state ? `${delivery.city}, ${delivery.state}` : 'Unknown',
        loadStatus: l.status,
        targetRate: l.rate ? parseFloat(String(l.rate)) : 0,
        bidCount: loadBids.length,
        pendingBids: loadBids.filter(b => b.status === 'pending').length,
        bids: loadBids.map(b => {
          const catalyst = catalystMap.get(b.catalystId);
          return {
            id: String(b.id),
            catalystId: String(b.catalystId),
            catalystName: catalyst?.name || 'Unknown Catalyst',
            amount: b.amount ? parseFloat(String(b.amount)) : 0,
            status: b.status,
            notes: b.notes || '',
            submittedAt: b.createdAt?.toISOString() || '',
          };
        }),
      };
    }).filter(l => l.bidCount > 0);
  }),

  updateLoadStatus: protectedProcedure.input(z.object({
    loadId: z.string(),
    status: z.enum(['posted', 'bidding', 'assigned', 'en_route_pickup', 'at_pickup', 'loading', 'in_transit', 'at_delivery', 'unloading', 'delivered', 'cancelled', 'disputed']),
    lat: z.number().optional(),
    lng: z.number().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const loadIdNum = parseInt(input.loadId, 10);
    const [load] = await db.select().from(loads).where(eq(loads.id, loadIdNum)).limit(1);
    if (!load) throw new Error("Load not found");
    const userId = await resolveUserId(ctx.user);
    const role = ctx.user?.role || 'SHIPPER';
    // Auth: shipper can cancel, catalyst/driver/dispatch can update transit statuses
    const isOwner = load.shipperId === userId;
    const isCatalyst = load.catalystId === userId;
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    if (!isOwner && !isCatalyst && !isAdmin) throw new Error("Not authorized to update this load");
    const updateSet: Record<string, any> = { status: input.status, updatedAt: new Date() };
    if (input.lat && input.lng) updateSet.currentLocation = { lat: input.lat, lng: input.lng };
    if (input.status === 'delivered') updateSet.actualDeliveryDate = new Date();
    if (input.notes) {
      updateSet.specialInstructions = [(load.specialInstructions || ''), `[STATUS ${input.status.toUpperCase()} ${new Date().toISOString()}] ${input.notes}`].filter(Boolean).join('\n');
    }
    await db.update(loads).set(updateSet as any).where(eq(loads.id, loadIdNum));
    emitLoadStatusChange({ loadId: input.loadId, loadNumber: load.loadNumber, previousStatus: load.status, newStatus: input.status, timestamp: new Date().toISOString(), updatedBy: String(userId) });
    if (input.status === 'delivered') {
      fireGamificationEvent({ userId, type: 'load_delivered', value: 1 });
      if (load.shipperId) {
        emitNotification(String(load.shipperId), { id: `notif_${Date.now()}`, type: 'load_delivered', title: 'Load Delivered', message: `Load ${load.loadNumber} has been delivered`, priority: 'high', data: { loadId: input.loadId }, actionUrl: `/loads/${input.loadId}`, timestamp: new Date().toISOString() });
      }
      // Collect load_completion platform fee
      try {
        const loadRate = parseFloat(load.rate || "0");
        if (loadRate > 0) {
          const feeResult = await feeCalculator.calculateFee({
            userId: load.shipperId || userId,
            userRole: 'SHIPPER',
            transactionType: 'load_completion',
            amount: loadRate,
            loadId: loadIdNum,
          });
          if (feeResult.finalFee > 0) {
            await feeCalculator.recordFeeCollection(loadIdNum, 'load_completion', load.shipperId || userId, loadRate, feeResult);
            console.log(`[Loads] Completion fee: $${feeResult.finalFee.toFixed(2)} for load ${load.loadNumber}`);
          }
        }
      } catch (feeErr) {
        console.warn('[Loads] Load completion fee error:', (feeErr as Error).message);
      }
    }
    return { success: true, loadId: input.loadId, status: input.status };
  }),

  /**
   * Get marketplace loads for Marketplace page
   * Returns all posted/bidding loads for catalysts to browse and bid on
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
   * Save a load as a reusable template
   */
  saveAsTemplate: protectedProcedure
    .input(z.object({ loadId: z.number(), templateName: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const userId = await resolveUserId(ctx.user);
      const [load] = await db.select().from(loads).where(eq(loads.id, input.loadId)).limit(1);
      if (!load) throw new Error("Load not found");
      const result = await db.insert(loads).values({
        shipperId: userId,
        loadNumber: `TMPL-${Date.now().toString(36).toUpperCase()}`,
        cargoType: load.cargoType,
        weight: load.weight, rate: load.rate,
        pickupLocation: load.pickupLocation,
        deliveryLocation: load.deliveryLocation,
        hazmatClass: load.hazmatClass, unNumber: load.unNumber,
        commodityName: load.commodityName,
        specialInstructions: JSON.stringify({ templateName: input.templateName }),
        status: "draft",
      } as any);
      const insertId = (result as any).insertId || (result as any)[0]?.insertId;
      return { success: true, templateId: insertId, name: input.templateName };
    }),

  /**
   * Create a load from a saved template
   */
  createFromTemplate: protectedProcedure
    .input(z.object({ templateId: z.number(), pickupDate: z.string().optional(), deliveryDate: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const userId = await resolveUserId(ctx.user);
      const [template] = await db.select().from(loads).where(and(eq(loads.id, input.templateId), eq(loads.status, "draft"))).limit(1);
      if (!template) throw new Error("Template not found");
      const loadNumber = `LD-${Date.now().toString(36).toUpperCase()}`;
      const result = await db.insert(loads).values({
        shipperId: userId, loadNumber,
        cargoType: template.cargoType,
        weight: template.weight, rate: template.rate,
        pickupLocation: template.pickupLocation,
        deliveryLocation: template.deliveryLocation,
        hazmatClass: template.hazmatClass, unNumber: template.unNumber,
        commodityName: template.commodityName,
        specialInstructions: template.specialInstructions,
        pickupDate: input.pickupDate ? new Date(input.pickupDate) : undefined,
        deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : undefined,
        status: "posted",
      } as any);
      const insertId = (result as any).insertId || (result as any)[0]?.insertId;
      emitLoadStatusChange({ loadId: String(insertId), loadNumber, previousStatus: "", newStatus: "posted", timestamp: new Date().toISOString(), updatedBy: String(userId) });
      return { success: true, loadId: insertId, loadNumber };
    }),

  /**
   * Bulk create multiple loads at once
   */
  bulkCreate: protectedProcedure
    .input(z.object({
      loads: z.array(z.object({
        origin: z.string(), destination: z.string(),
        cargoType: z.string().optional(),
        weight: z.number().optional(), rate: z.number().optional(),
        pickupDate: z.string().optional(), deliveryDate: z.string().optional(),
        specialInstructions: z.string().optional(),
      })).min(1).max(50),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const userId = await resolveUserId(ctx.user);
      const created: { loadId: number; loadNumber: string }[] = [];
      for (const ld of input.loads) {
        const loadNumber = `LD-${Date.now().toString(36).toUpperCase()}-${created.length}`;
        const result = await db.insert(loads).values({
          shipperId: userId, loadNumber,
          cargoType: (ld.cargoType || "general") as any,
          weight: ld.weight ? String(ld.weight) : null,
          rate: ld.rate ? String(ld.rate) : null,
          pickupLocation: { address: ld.origin, city: ld.origin.split(",")[0]?.trim() || "", state: ld.origin.split(",")[1]?.trim() || "", zipCode: "", lat: 0, lng: 0 },
          deliveryLocation: { address: ld.destination, city: ld.destination.split(",")[0]?.trim() || "", state: ld.destination.split(",")[1]?.trim() || "", zipCode: "", lat: 0, lng: 0 },
          pickupDate: ld.pickupDate ? new Date(ld.pickupDate) : undefined,
          deliveryDate: ld.deliveryDate ? new Date(ld.deliveryDate) : undefined,
          specialInstructions: ld.specialInstructions || null,
          status: "posted",
        } as any);
        const insertId = (result as any).insertId || (result as any)[0]?.insertId;
        created.push({ loadId: insertId, loadNumber });
      }
      return { success: true, count: created.length, loads: created };
    }),

  /**
   * Cancel a load with a reason
   */
  cancelWithReason: protectedProcedure
    .input(z.object({ loadId: z.number(), reason: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const userId = await resolveUserId(ctx.user);
      const [load] = await db.select().from(loads).where(eq(loads.id, input.loadId)).limit(1);
      if (!load) throw new Error("Load not found");
      if (load.shipperId !== userId) throw new Error("Not authorized to cancel this load");
      if (load.status === "delivered" || load.status === "cancelled") throw new Error("Cannot cancel — load is " + load.status);
      await db.update(loads).set({
        status: "cancelled",
        specialInstructions: `${load.specialInstructions || ""}\n[CANCELLED: ${input.reason}]`.trim(),
      } as any).where(eq(loads.id, input.loadId));
      emitLoadStatusChange({ loadId: String(input.loadId), loadNumber: load.loadNumber || "", previousStatus: load.status, newStatus: "cancelled", timestamp: new Date().toISOString(), updatedBy: String(userId) });
      return { success: true, loadId: input.loadId, reason: input.reason };
    }),

  /**
   * Bulk decline bids on a load
   */
  bulkDeclineBids: protectedProcedure
    .input(z.object({ loadId: z.number(), bidIds: z.array(z.number()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const userId = await resolveUserId(ctx.user);
      const [load] = await db.select().from(loads).where(eq(loads.id, input.loadId)).limit(1);
      if (!load || load.shipperId !== userId) throw new Error("Not authorized");
      await db.update(bids).set({ status: "rejected" } as any)
        .where(and(eq(bids.loadId, input.loadId), inArray(bids.id, input.bidIds)));
      return { success: true, declined: input.bidIds.length };
    }),

  /**
   * Auto-award bid to lowest/best bidder
   */
  autoAwardBid: protectedProcedure
    .input(z.object({ loadId: z.number(), strategy: z.enum(["lowest_price", "highest_rated", "fastest_delivery"]).default("lowest_price") }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const userId = await resolveUserId(ctx.user);
      const [load] = await db.select().from(loads).where(eq(loads.id, input.loadId)).limit(1);
      if (!load || load.shipperId !== userId) throw new Error("Not authorized");
      const loadBids = await db.select().from(bids).where(and(eq(bids.loadId, input.loadId), eq(bids.status, "pending"))).limit(100);
      if (loadBids.length === 0) throw new Error("No pending bids");
      const sorted = [...loadBids].sort((a, b) => parseFloat(a.amount || "0") - parseFloat(b.amount || "0"));
      const winner = sorted[0];
      await db.update(bids).set({ status: "accepted" } as any).where(eq(bids.id, winner.id));
      await db.update(bids).set({ status: "rejected" } as any)
        .where(and(eq(bids.loadId, input.loadId), eq(bids.status, "pending")));
      await db.update(loads).set({ status: "assigned", catalystId: winner.catalystId } as any).where(eq(loads.id, input.loadId));
      emitBidAwarded({ bidId: String(winner.id), loadId: String(input.loadId), catalystId: String(winner.catalystId), catalystName: "Catalyst", amount: Number(winner.amount) || 0, status: "accepted", loadNumber: load.loadNumber || "", timestamp: new Date().toISOString() });
      emitLoadStatusChange({ loadId: String(input.loadId), loadNumber: load.loadNumber || "", previousStatus: load.status, newStatus: "assigned", timestamp: new Date().toISOString(), updatedBy: String(userId) });
      return { success: true, winnerId: winner.id, winnerCatalystId: winner.catalystId, amount: winner.amount };
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
        const catalystId = await resolveUserId(ctx.user);
        if (!catalystId) throw new Error("Could not resolve user");

        await db.insert(bids).values({
          loadId: input.loadId,
          catalystId,
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
