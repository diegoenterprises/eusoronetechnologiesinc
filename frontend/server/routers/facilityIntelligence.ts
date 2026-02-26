/**
 * FACILITY INTELLIGENCE ROUTER
 * Full FIL implementation: search, getById, getNearby, stats, ratings,
 * requirements, claim, update, rate, DTN integration, inbound visibility,
 * detention GPS, portfolio, and market intelligence.
 */
import { z } from "zod";
import { eq, and, desc, sql, gte, lte, or } from "drizzle-orm";
import { router, isolatedProcedure as protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  facilities, facilityRatings, facilityRequirements, facilityStatsCache,
  dtnConnections, dtnSyncLog, detentionGpsRecords, loads, users,
} from "../../drizzle/schema";
import { searchFacilities, getNearbyFacilities, getFacilityById, getFacilityCountsByState, seedFacilityDatabase, importPipelineStations } from "../services/facilities/facilityService";
import { getDTNClient } from "../services/dtn/dtnClient";

// ── Helper: resolve user ID from context ───────────────────────────
async function resolveUserId(ctx: any): Promise<number> {
  const db = await getDb(); if (!db) return 0;
  const email = ctx.user?.email || "";
  if (!email) return 0;
  try {
    const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    return row?.id || 0;
  } catch { return 0; }
}

export const facilityIntelligenceRouter = router({

  // ═══════════════════════════════════════════════════════════════════
  // SEARCH & DISCOVERY
  // ═══════════════════════════════════════════════════════════════════

  search: publicProcedure
    .input(z.object({
      query: z.string().min(2).max(200),
      facilityType: z.string().optional(),
      state: z.string().max(2).optional(),
      products: z.array(z.string()).optional(),
      status: z.string().optional(),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ input }) => {
      return searchFacilities(input);
    }),

  getById: publicProcedure
    .input(z.object({ facilityId: z.number() }))
    .query(async ({ input }) => {
      return getFacilityById(input.facilityId);
    }),

  getNearby: publicProcedure
    .input(z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      radiusMiles: z.number().min(0.1).max(500).default(25),
      facilityType: z.string().optional(),
      products: z.array(z.string()).optional(),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      return getNearbyFacilities(input);
    }),

  getByState: publicProcedure
    .input(z.object({
      state: z.string().length(2),
      facilityType: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const conds: any[] = [eq(facilities.state, input.state.toUpperCase())];
        if (input.facilityType) conds.push(eq(facilities.facilityType, input.facilityType as any));
        return db.select().from(facilities).where(and(...conds)).orderBy(facilities.facilityName).limit(input.limit);
      } catch { return []; }
    }),

  getStats: publicProcedure
    .input(z.object({ facilityId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return null;
      try {
        const [stats] = await db.select().from(facilityStatsCache).where(eq(facilityStatsCache.facilityId, input.facilityId)).limit(1);
        return stats || {
          facilityId: input.facilityId, avgWaitMinutes: null, avgLoadingMinutes: null,
          avgTurnaroundMinutes: null, totalLoadsLast90Days: 0, totalLoadsAllTime: 0,
          onTimeStartPercentage: null, detentionIncidentPercentage: null,
          avgRating: null, totalRatings: 0, peakHoursJson: null, topCarriersJson: null,
        };
      } catch { return null; }
    }),

  getRequirements: publicProcedure
    .input(z.object({ facilityId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return [];
      try {
        return db.select().from(facilityRequirements).where(eq(facilityRequirements.facilityId, input.facilityId));
      } catch { return []; }
    }),

  getRatings: publicProcedure
    .input(z.object({ facilityId: z.number(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return { ratings: [], summary: { avg: 0, total: 0 } };
      try {
        const ratings = await db.select().from(facilityRatings)
          .where(eq(facilityRatings.facilityId, input.facilityId))
          .orderBy(desc(facilityRatings.createdAt))
          .limit(input.limit);
        const [summary] = await db.select({
          avg: sql<number>`ROUND(AVG(rating), 2)`,
          total: sql<number>`COUNT(*)`,
        }).from(facilityRatings).where(eq(facilityRatings.facilityId, input.facilityId));
        return { ratings, summary: summary || { avg: 0, total: 0 } };
      } catch { return { ratings: [], summary: { avg: 0, total: 0 } }; }
    }),

  // Facility counts per state (for HotZones integration)
  getCountsByState: publicProcedure
    .query(async () => {
      return getFacilityCountsByState();
    }),

  // Total facility count
  getTotalCount: publicProcedure
    .query(async () => {
      const db = await getDb(); if (!db) return { total: 0, terminals: 0, refineries: 0 };
      try {
        const [row] = await db.select({
          total: sql<number>`COUNT(*)`,
          terminals: sql<number>`SUM(CASE WHEN facility_type IN ('TERMINAL','RACK','BULK_PLANT') THEN 1 ELSE 0 END)`,
          refineries: sql<number>`SUM(CASE WHEN facility_type = 'REFINERY' THEN 1 ELSE 0 END)`,
        }).from(facilities);
        return row || { total: 0, terminals: 0, refineries: 0 };
      } catch { return { total: 0, terminals: 0, refineries: 0 }; }
    }),

  // ═══════════════════════════════════════════════════════════════════
  // USER ACTIONS
  // ═══════════════════════════════════════════════════════════════════

  rate: protectedProcedure
    .input(z.object({
      facilityId: z.number(),
      loadId: z.number().optional(),
      rating: z.number().min(1).max(5),
      waitTimeMinutes: z.number().optional(),
      comment: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const userId = await resolveUserId(ctx);
      if (!userId) throw new Error("User not found");
      const role = ctx.user?.role || "DRIVER";
      await db.insert(facilityRatings).values({
        facilityId: input.facilityId,
        userId,
        userRole: role,
        rating: input.rating,
        waitTimeMinutes: input.waitTimeMinutes || null,
        comment: input.comment || null,
        loadId: input.loadId || null,
      } as any);
      return { success: true };
    }),

  respondToRating: protectedProcedure
    .input(z.object({ ratingId: z.number(), response: z.string().max(1000) }))
    .mutation(async ({ input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      await db.update(facilityRatings)
        .set({ terminalResponse: input.response, terminalRespondedAt: new Date() } as any)
        .where(eq(facilityRatings.id, input.ratingId));
      return { success: true };
    }),

  claim: protectedProcedure
    .input(z.object({ facilityId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const userId = await resolveUserId(ctx);
      const companyId = ctx.user?.companyId;
      if (!userId || !companyId) throw new Error("User/company not found");
      await db.update(facilities)
        .set({ claimedByUserId: userId, claimedByCompanyId: parseInt(String(companyId)) } as any)
        .where(eq(facilities.id, input.facilityId));
      return { success: true, facilityId: input.facilityId };
    }),

  update: protectedProcedure
    .input(z.object({
      facilityId: z.number(),
      loadingHours: z.string().optional(),
      appointmentRequired: z.boolean().optional(),
      appointmentSlotMinutes: z.number().optional(),
      maxTrucksPerHour: z.number().optional(),
      twicRequired: z.boolean().optional(),
      safetyOrientationRequired: z.boolean().optional(),
      gatePhone: z.string().optional(),
      officePhone: z.string().optional(),
      loadingBays: z.number().optional(),
      unloadingBays: z.number().optional(),
      hasScale: z.boolean().optional(),
      terminalAutomationSystem: z.string().optional(),
      products: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const { facilityId, ...updates } = input;
      const setObj: any = {};
      for (const [k, v] of Object.entries(updates)) {
        if (v !== undefined) setObj[k] = v;
      }
      if (Object.keys(setObj).length > 0) {
        await db.update(facilities).set(setObj).where(eq(facilities.id, facilityId));
      }
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════════════
  // REQUIREMENTS MANAGEMENT (Terminal Manager)
  // ═══════════════════════════════════════════════════════════════════

  setRequirement: protectedProcedure
    .input(z.object({
      facilityId: z.number(),
      requirementType: z.string(),
      requirementValue: z.string().optional(),
      isRequired: z.boolean().default(true),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      await db.insert(facilityRequirements).values({
        facilityId: input.facilityId,
        requirementType: input.requirementType,
        requirementValue: input.requirementValue || null,
        isRequired: input.isRequired,
        notes: input.notes || null,
      } as any);
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════════════
  // DTN INTEGRATION
  // ═══════════════════════════════════════════════════════════════════

  dtnGetConnectionStatus: protectedProcedure
    .input(z.object({ facilityId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return null;
      try {
        const [conn] = await db.select().from(dtnConnections).where(eq(dtnConnections.facilityId, input.facilityId)).limit(1);
        return conn ? {
          connected: conn.syncEnabled,
          dtnTerminalId: conn.dtnTerminalId,
          environment: conn.dtnEnvironment,
          lastSyncAt: conn.lastSyncAt,
          lastSyncStatus: conn.lastSyncStatus,
          syncConfig: conn.syncConfigJson,
        } : null;
      } catch { return null; }
    }),

  dtnConfigure: protectedProcedure
    .input(z.object({
      facilityId: z.number(),
      dtnTerminalId: z.string(),
      dtnApiKey: z.string(),
      dtnEnvironment: z.enum(["sandbox", "production"]),
      syncConfig: z.object({
        etaTowardsDtn: z.boolean().optional(),
        complianceToDtn: z.boolean().optional(),
        bolFromDtn: z.boolean().optional(),
        allocationFromDtn: z.boolean().optional(),
        rackPricingFromDtn: z.boolean().optional(),
        inventoryFromDtn: z.boolean().optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const companyId = ctx.user?.companyId || 0;

      // Encrypt API key with AES-256-GCM before storage
      const crypto = await import("crypto");
      const encKeyHex = process.env.DTN_ENCRYPTION_KEY || process.env.APP_SECRET || "";
      if (!encKeyHex) throw new Error("Encryption key not configured (set DTN_ENCRYPTION_KEY)");
      const keyBuffer = crypto.createHash("sha256").update(encKeyHex).digest();
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv("aes-256-gcm", keyBuffer, iv);
      let encrypted = cipher.update(input.dtnApiKey, "utf8", "hex");
      encrypted += cipher.final("hex");
      const authTag = cipher.getAuthTag().toString("hex");

      await db.insert(dtnConnections).values({
        facilityId: input.facilityId,
        companyId: parseInt(String(companyId)),
        dtnTerminalId: input.dtnTerminalId,
        dtnApiKeyEncrypted: { iv: iv.toString("hex"), encryptedData: encrypted, authTag },
        dtnEnvironment: input.dtnEnvironment,
        syncEnabled: true,
        syncConfigJson: input.syncConfig || {},
      } as any);
      return { success: true };
    }),

  dtnTestConnection: protectedProcedure
    .input(z.object({ facilityId: z.number() }))
    .mutation(async ({ input }) => {
      const client = getDTNClient();
      if (!client) return { success: false, error: "DTN integration not configured" };
      try {
        const result = await client.authenticate({ terminalId: String(input.facilityId), apiKey: "test", environment: "sandbox" });
        return { success: true, token: result.token };
      } catch (e: any) {
        return { success: false, error: e?.message || "Connection failed" };
      }
    }),

  dtnGetAllocation: protectedProcedure
    .input(z.object({ facilityId: z.number(), product: z.string() }))
    .query(async ({ input }) => {
      const client = getDTNClient();
      if (!client) throw new Error("DTN integration not configured");
      return client.getTerminalAllocation(String(input.facilityId), input.product);
    }),

  dtnCheckCredit: protectedProcedure
    .input(z.object({ facilityId: z.number(), carrierId: z.number() }))
    .query(async ({ input }) => {
      const client = getDTNClient();
      if (!client) throw new Error("DTN integration not configured");
      return client.checkCredit(String(input.carrierId), String(input.facilityId));
    }),

  dtnGetInventory: protectedProcedure
    .input(z.object({ facilityId: z.number() }))
    .query(async ({ input }) => {
      const client = getDTNClient();
      if (!client) throw new Error("DTN integration not configured");
      return client.getInventoryLevels(String(input.facilityId));
    }),

  dtnGetRackPricing: protectedProcedure
    .input(z.object({ facilityId: z.number(), product: z.string().optional() }))
    .query(async ({ input }) => {
      const client = getDTNClient();
      if (!client) throw new Error("DTN integration not configured");
      return client.getRackPricing(String(input.facilityId), input.product);
    }),

  dtnGetLoadingProgress: protectedProcedure
    .input(z.object({ loadingId: z.string() }))
    .query(async ({ input }) => {
      const client = getDTNClient();
      if (!client) throw new Error("DTN integration not configured");
      return client.getLoadingProgress(input.loadingId);
    }),

  dtnGetSyncLog: protectedProcedure
    .input(z.object({
      facilityId: z.number(),
      direction: z.enum(["TO_DTN", "FROM_DTN"]).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const conds: any[] = [eq(dtnSyncLog.facilityId, input.facilityId)];
        if (input.direction) conds.push(eq(dtnSyncLog.direction, input.direction));
        return db.select().from(dtnSyncLog).where(and(...conds)).orderBy(desc(dtnSyncLog.createdAt)).limit(input.limit);
      } catch { return []; }
    }),

  dtnGetSyncStats: protectedProcedure
    .input(z.object({ facilityId: z.number(), period: z.enum(["today", "week", "month"]).default("today") }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return { sentToDtn: 0, receivedFromDtn: 0, errors: 0, bolsSynced: 0 };
      try {
        const since = new Date();
        if (input.period === "today") since.setHours(0, 0, 0, 0);
        else if (input.period === "week") since.setDate(since.getDate() - 7);
        else since.setMonth(since.getMonth() - 1);

        const [stats] = await db.select({
          sentToDtn: sql<number>`SUM(CASE WHEN direction = 'TO_DTN' THEN 1 ELSE 0 END)`,
          receivedFromDtn: sql<number>`SUM(CASE WHEN direction = 'FROM_DTN' THEN 1 ELSE 0 END)`,
          errors: sql<number>`SUM(CASE WHEN dsl_error_message IS NOT NULL THEN 1 ELSE 0 END)`,
          bolsSynced: sql<number>`SUM(CASE WHEN event_type = 'BOL_DATA' THEN 1 ELSE 0 END)`,
        }).from(dtnSyncLog)
          .where(and(
            eq(dtnSyncLog.facilityId, input.facilityId),
            gte(dtnSyncLog.createdAt, since),
          ));

        return stats || { sentToDtn: 0, receivedFromDtn: 0, errors: 0, bolsSynced: 0 };
      } catch { return { sentToDtn: 0, receivedFromDtn: 0, errors: 0, bolsSynced: 0 }; }
    }),

  // ═══════════════════════════════════════════════════════════════════
  // INBOUND VISIBILITY
  // ═══════════════════════════════════════════════════════════════════

  getApproachingTrucks: protectedProcedure
    .input(z.object({ facilityId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return [];
      try {
        // Get facility location
        const [fac] = await db.select({
          lat: facilities.latitude,
          lng: facilities.longitude,
        }).from(facilities).where(eq(facilities.id, input.facilityId)).limit(1);
        if (!fac) return [];

        // Find active loads headed to this facility area
        const inTransitLoads = await db.select({
          id: loads.id,
          loadNumber: loads.loadNumber,
          status: loads.status,
          driverId: loads.driverId,
          catalystId: loads.catalystId,
          cargoType: loads.cargoType,
          hazmatClass: loads.hazmatClass,
          unNumber: loads.unNumber,
          volume: loads.volume,
          volumeUnit: loads.volumeUnit,
          currentLocation: loads.currentLocation,
          pickupDate: loads.pickupDate,
          deliveryDate: loads.deliveryDate,
          commodityName: loads.commodityName,
        }).from(loads)
          .where(or(
            eq(loads.status, "in_transit"),
            eq(loads.status, "en_route_pickup"),
            eq(loads.status, "at_pickup"),
          ))
          .orderBy(desc(loads.updatedAt))
          .limit(50);

        // Calculate distances, filter by approach radius, add ETA estimates
        const approaching = [];
        for (const load of inTransitLoads) {
          const loc = load.currentLocation as any;
          if (!loc?.lat || !loc?.lng) continue;

          const dLat = (parseFloat(String(fac.lat)) - loc.lat) * 111.32;
          const dLng = (parseFloat(String(fac.lng)) - loc.lng) * 111.32 * Math.cos(loc.lat * Math.PI / 180);
          const distKm = Math.sqrt(dLat * dLat + dLng * dLng);
          const distMi = distKm * 0.621371;

          if (distMi <= 150) {
            const etaMinutes = Math.round(distMi / 0.9); // ~54mph avg
            approaching.push({
              loadId: load.id,
              loadNumber: load.loadNumber,
              driverId: load.driverId,
              carrierId: load.catalystId,
              product: load.commodityName || load.cargoType,
              hazmatClass: load.hazmatClass,
              unNumber: load.unNumber,
              quantity: load.volume ? `${load.volume} ${load.volumeUnit || "gal"}` : "N/A",
              distanceMiles: Math.round(distMi * 10) / 10,
              etaMinutes,
              etaLabel: etaMinutes < 60 ? `${etaMinutes} min` : `${Math.floor(etaMinutes / 60)}h ${etaMinutes % 60}m`,
              currentLat: loc.lat,
              currentLng: loc.lng,
              appointmentTime: load.pickupDate || load.deliveryDate,
              complianceStatus: "CLEAR" as const,
            });
          }
        }

        approaching.sort((a, b) => a.distanceMiles - b.distanceMiles);
        return approaching;
      } catch (e) {
        console.error("[FIL] getApproachingTrucks error:", e);
        return [];
      }
    }),

  getDemandForecast: protectedProcedure
    .input(z.object({
      facilityId: z.number(),
      hours: z.enum(["24", "48", "72"]).default("24"),
    }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return { byProduct: [], totalVolume: 0, loadCount: 0 };
      try {
        const hoursAhead = parseInt(input.hours);
        const until = new Date(Date.now() + hoursAhead * 3600000);

        // Get all booked/dispatched/in-transit loads
        const upcoming = await db.select({
          cargoType: loads.cargoType,
          commodityName: loads.commodityName,
          volume: loads.volume,
          volumeUnit: loads.volumeUnit,
        }).from(loads)
          .where(or(
            eq(loads.status, "assigned"),
            eq(loads.status, "confirmed"),
            eq(loads.status, "en_route_pickup"),
            eq(loads.status, "in_transit"),
          ))
          .limit(200);

        // Aggregate by product
        const byProduct: Record<string, { volume: number; loads: number }> = {};
        for (const l of upcoming) {
          const product = l.commodityName || l.cargoType || "Other";
          if (!byProduct[product]) byProduct[product] = { volume: 0, loads: 0 };
          byProduct[product].loads++;
          byProduct[product].volume += parseFloat(String(l.volume || 0));
        }

        const result = Object.entries(byProduct).map(([product, data]) => ({
          product, volume: data.volume, volumeUnit: "gal", loadCount: data.loads,
        }));

        return {
          byProduct: result,
          totalVolume: result.reduce((s, r) => s + r.volume, 0),
          loadCount: result.reduce((s, r) => s + r.loadCount, 0),
          forecastHours: hoursAhead,
        };
      } catch { return { byProduct: [], totalVolume: 0, loadCount: 0 }; }
    }),

  // ═══════════════════════════════════════════════════════════════════
  // DETENTION GPS RECORDS
  // ═══════════════════════════════════════════════════════════════════

  getDetentionRecords: protectedProcedure
    .input(z.object({
      facilityId: z.number().optional(),
      carrierId: z.number().optional(),
      status: z.enum(["CALCULATED", "INVOICED", "DISPUTED", "RESOLVED"]).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const conds: any[] = [];
        if (input.facilityId) conds.push(eq(detentionGpsRecords.facilityId, input.facilityId));
        if (input.carrierId) conds.push(eq(detentionGpsRecords.carrierId, input.carrierId));
        if (input.status) conds.push(eq(detentionGpsRecords.status, input.status));
        return db.select().from(detentionGpsRecords)
          .where(conds.length ? and(...conds) : undefined)
          .orderBy(desc(detentionGpsRecords.createdAt))
          .limit(input.limit);
      } catch { return []; }
    }),

  // ═══════════════════════════════════════════════════════════════════
  // MULTI-FACILITY PORTFOLIO
  // ═══════════════════════════════════════════════════════════════════

  listMyFacilities: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb(); if (!db) return [];
      const companyId = ctx.user?.companyId;
      if (!companyId) return [];
      try {
        return db.select().from(facilities)
          .where(eq(facilities.claimedByCompanyId, parseInt(String(companyId))))
          .orderBy(facilities.facilityName);
      } catch { return []; }
    }),

  getPortfolioStats: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb(); if (!db) return null;
      const companyId = ctx.user?.companyId;
      if (!companyId) return null;
      try {
        const [stats] = await db.select({
          totalFacilities: sql<number>`COUNT(*)`,
          totalTerminals: sql<number>`SUM(CASE WHEN facility_type = 'TERMINAL' THEN 1 ELSE 0 END)`,
          totalRefineries: sql<number>`SUM(CASE WHEN facility_type = 'REFINERY' THEN 1 ELSE 0 END)`,
          totalLoadingBays: sql<number>`SUM(COALESCE(loading_bays, 0))`,
          statesPresent: sql<number>`COUNT(DISTINCT facility_state)`,
        }).from(facilities)
          .where(eq(facilities.claimedByCompanyId, parseInt(String(companyId))));
        return stats;
      } catch { return null; }
    }),

  // ═══════════════════════════════════════════════════════════════════
  // MARKET INTELLIGENCE (Rack Pricing + Inventory)
  // ═══════════════════════════════════════════════════════════════════

  getMarketRackPricing: protectedProcedure
    .input(z.object({
      facilityId: z.number().optional(),
      state: z.string().optional(),
      product: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const client = getDTNClient();
      if (!client) throw new Error("DTN integration not configured");
      const terminalId = input.facilityId ? String(input.facilityId) : "DEFAULT";
      return client.getRackPricing(terminalId, input.product);
    }),

  getMarketInventory: protectedProcedure
    .input(z.object({ facilityId: z.number() }))
    .query(async ({ input }) => {
      const client = getDTNClient();
      if (!client) throw new Error("DTN integration not configured");
      return client.getInventoryLevels(String(input.facilityId));
    }),

  // ═══════════════════════════════════════════════════════════════════
  // PIPELINE & TARIFF INTELLIGENCE
  // ═══════════════════════════════════════════════════════════════════

  getPipelineTariffs: publicProcedure
    .input(z.object({ facilityId: z.number() }))
    .query(async ({ input }) => {
      const fac = await getFacilityById(input.facilityId);
      if (!fac) return null;
      const f = fac as any;
      const operator = (f.operatorName || f.facilityName || "").toUpperCase();
      const state = f.state || "";

      // ── Curated pipeline operator knowledge base ──
      // Major US petroleum pipeline operators → FERC tariff data
      const PIPELINE_KB: Record<string, {
        company: string;
        systems: { name: string; type: string; ferc: string[]; products: string[]; states: string[] }[];
        tariffIndices: { name: string; date: string; ferc?: string }[];
        prorationPolicy?: { name: string; date?: string };
        website?: string;
      }> = {
        CITGO: {
          company: "CITGO Petroleum Corporation",
          systems: [
            { name: "Lakemont Pipeline System", type: "Refined Products", ferc: ["FERC 16-16-0"], products: ["Gasoline", "Diesel", "Jet Fuel"], states: ["IL", "IN"] },
            { name: "Casa Refined Products Pipeline System", type: "Refined Products", ferc: ["FERC No. 36"], products: ["Gasoline", "Diesel", "Heating Oil"], states: ["LA", "TX"] },
            { name: "Sour Lake Crude Pipeline System", type: "Crude Oil", ferc: ["FERC 71-20-0", "FERC 70-12-0", "FERC 72-11-0", "FERC 74-11-0", "FERC 75-12-0"], products: ["Crude Oil"], states: ["TX"] },
          ],
          tariffIndices: [
            { name: "CITGO Products Pipeline Co. Tariff Index", date: "July 1, 2022", ferc: "FERC 16-16-0" },
            { name: "CITGO Pipeline Co. Tariff Index", date: "July 1, 2022" },
          ],
          prorationPolicy: { name: "Proration Policy", date: "January 2019" },
          website: "https://www.citgo.com/operations/terminals-pipelines",
        },
        "ENTERPRISE PRODUCTS": {
          company: "Enterprise Products Partners",
          systems: [
            { name: "TEPPCO Pipeline", type: "NGL/Petrochemicals", ferc: ["FERC 25-17-0"], products: ["NGL", "Propane", "Butane", "Ethane"], states: ["TX", "LA", "MS", "AL", "GA", "TN", "IN", "IL"] },
            { name: "Dixie Pipeline", type: "NGL", ferc: ["FERC 18-12-0"], products: ["Propane", "Butane"], states: ["TX", "LA", "MS", "AL", "GA"] },
            { name: "Seminole Pipeline", type: "NGL", ferc: ["FERC 50-5-0"], products: ["NGL", "Condensate"], states: ["NM", "TX", "OK"] },
            { name: "Mid-America Pipeline", type: "NGL", ferc: ["FERC 88-16-0"], products: ["NGL"], states: ["NM", "TX", "KS", "NE", "IA", "IL"] },
          ],
          tariffIndices: [
            { name: "TEPPCO Pipeline Tariff Index", date: "July 1, 2024" },
            { name: "Dixie Pipeline Tariff Index", date: "July 1, 2024" },
          ],
          website: "https://www.enterpriseproducts.com",
        },
        MAGELLAN: {
          company: "Magellan Midstream Partners (ONEOK)",
          systems: [
            { name: "Magellan Refined Products Pipeline", type: "Refined Products", ferc: ["FERC 138-9-0"], products: ["Gasoline", "Diesel", "Jet Fuel", "LPG"], states: ["TX", "OK", "KS", "NE", "IA", "MO", "WI", "MN", "CO", "NM", "AZ", "AK"] },
            { name: "Longhorn Pipeline", type: "Crude Oil", ferc: ["FERC 4-5-0"], products: ["Crude Oil"], states: ["TX"] },
          ],
          tariffIndices: [
            { name: "Magellan Pipeline Tariff Index", date: "July 1, 2024" },
          ],
          website: "https://www.magellanlp.com",
        },
        "COLONIAL PIPELINE": {
          company: "Colonial Pipeline Company",
          systems: [
            { name: "Colonial Pipeline System", type: "Refined Products", ferc: ["FERC 99-41-0"], products: ["Gasoline", "Diesel", "Jet Fuel", "Heating Oil", "Kerosene"], states: ["TX", "LA", "MS", "AL", "GA", "SC", "NC", "VA", "MD", "PA", "NJ", "NY"] },
          ],
          tariffIndices: [
            { name: "Colonial Pipeline Tariff Index", date: "January 1, 2025" },
          ],
          prorationPolicy: { name: "Proration & Allocation Policy", date: "2024" },
          website: "https://www.colpipe.com",
        },
        BUCKEYE: {
          company: "Buckeye Partners LP",
          systems: [
            { name: "Buckeye Pipe Line", type: "Refined Products", ferc: ["FERC 57-24-0"], products: ["Gasoline", "Diesel", "Jet Fuel", "LPG"], states: ["PA", "NY", "NJ", "OH", "IN", "IL", "MI", "WI"] },
            { name: "Laurel Pipe Line", type: "Refined Products", ferc: ["FERC 154-14-0"], products: ["Gasoline", "Diesel"], states: ["PA"] },
            { name: "Buckeye Gulf Coast Pipeline", type: "Refined Products", ferc: ["FERC 8-4-0"], products: ["Gasoline", "Diesel", "Jet Fuel"], states: ["TX", "LA"] },
          ],
          tariffIndices: [
            { name: "Buckeye Pipe Line Tariff Index", date: "July 1, 2024" },
            { name: "Laurel Pipe Line Tariff Index", date: "July 1, 2024" },
          ],
          website: "https://www.buckeye.com",
        },
        KINDER: {
          company: "Kinder Morgan",
          systems: [
            { name: "Products (SE) Pipeline", type: "Refined Products", ferc: ["FERC 76-11-0"], products: ["Gasoline", "Diesel", "Jet Fuel"], states: ["TX", "LA", "MS", "AL", "GA", "FL", "SC", "NC", "TN"] },
            { name: "Plantation Pipeline", type: "Refined Products", ferc: ["FERC 20-19-0"], products: ["Gasoline", "Diesel", "Jet Fuel"], states: ["LA", "MS", "AL", "GA", "SC", "NC", "VA"] },
            { name: "CALNEV Pipeline", type: "Refined Products", ferc: ["FERC 30-5-0"], products: ["Gasoline", "Diesel", "Jet Fuel"], states: ["CA", "NV", "AZ"] },
            { name: "SFPP (West)", type: "Refined Products", ferc: ["FERC 148-17-0"], products: ["Gasoline", "Diesel", "Jet Fuel"], states: ["CA", "AZ", "NV", "OR"] },
          ],
          tariffIndices: [
            { name: "Kinder Morgan Products Pipeline Tariff", date: "July 1, 2024" },
          ],
          website: "https://www.kindermorgan.com",
        },
        "NUSTAR": {
          company: "NuStar Energy (Sunoco LP)",
          systems: [
            { name: "NuStar Pipeline System", type: "Refined Products & Crude", ferc: ["FERC 41-9-0"], products: ["Gasoline", "Diesel", "Crude Oil", "Residual Fuel"], states: ["TX", "OK", "NM", "CO", "KS"] },
          ],
          tariffIndices: [{ name: "NuStar Pipeline Tariff Index", date: "July 1, 2024" }],
          website: "https://www.nustarenergy.com",
        },
        PLAINS: {
          company: "Plains All American Pipeline",
          systems: [
            { name: "Basin Pipeline", type: "Crude Oil", ferc: ["FERC 100-8-0"], products: ["Crude Oil"], states: ["TX", "NM"] },
            { name: "Capline Pipeline", type: "Crude Oil", ferc: ["FERC 155-11-0"], products: ["Crude Oil"], states: ["LA", "MS", "TN", "IL"] },
            { name: "Red River Pipeline", type: "Crude Oil", ferc: ["FERC 60-6-0"], products: ["Crude Oil"], states: ["TX", "OK"] },
          ],
          tariffIndices: [{ name: "Plains All American Pipeline Tariff", date: "July 1, 2024" }],
          website: "https://www.plainsallamerican.com",
        },
        PHILLIPS: {
          company: "Phillips 66 Partners",
          systems: [
            { name: "Sweeny to Pasadena Pipeline", type: "NGL/Crude", ferc: ["FERC 4-3-0"], products: ["NGL", "Crude Oil"], states: ["TX"] },
            { name: "Gold Line Pipeline", type: "Refined Products", ferc: ["FERC 7-4-0"], products: ["Gasoline", "Diesel"], states: ["TX", "OK", "KS", "MO", "IL"] },
          ],
          tariffIndices: [{ name: "Phillips 66 Pipeline Tariff", date: "July 1, 2024" }],
          website: "https://www.phillips66.com",
        },
        MARATHON: {
          company: "Marathon Pipe Line LLC (MPLX)",
          systems: [
            { name: "Marathon Pipeline System", type: "Crude & Refined Products", ferc: ["FERC 210-9-0"], products: ["Crude Oil", "Gasoline", "Diesel"], states: ["OH", "MI", "IN", "IL", "KY", "TN"] },
          ],
          tariffIndices: [{ name: "Marathon Pipeline Tariff Index", date: "July 1, 2024" }],
          website: "https://www.marathonpetroleum.com",
        },
        SUNOCO: {
          company: "Sunoco Pipeline LP",
          systems: [
            { name: "Sunoco / ETP Pipeline", type: "Crude & Refined Products", ferc: ["FERC 65-14-0"], products: ["Crude Oil", "Gasoline", "Diesel", "Ethanol"], states: ["TX", "PA", "OH", "MI", "NJ", "NY"] },
            { name: "Mariner East Pipeline", type: "NGL", ferc: ["FERC 2-2-0"], products: ["Ethane", "Propane", "Butane"], states: ["PA", "OH", "WV"] },
          ],
          tariffIndices: [{ name: "Sunoco Pipeline Tariff Index", date: "July 1, 2024" }],
          website: "https://www.sunocologistics.com",
        },
        VALERO: {
          company: "Valero Energy Corporation",
          systems: [
            { name: "McKee to El Paso Pipeline", type: "Refined Products", ferc: ["FERC 12-8-0"], products: ["Gasoline", "Diesel", "Jet Fuel"], states: ["TX", "NM"] },
          ],
          tariffIndices: [{ name: "Valero Pipeline Tariff Index", date: "July 1, 2024" }],
          website: "https://www.valero.com",
        },
        HOLLY: {
          company: "HollyFrontier / HF Sinclair",
          systems: [
            { name: "Holly Pipeline System", type: "Crude & Refined Products", ferc: ["FERC 22-7-0"], products: ["Crude Oil", "Gasoline", "Diesel"], states: ["NM", "TX", "UT", "WY", "MT"] },
          ],
          tariffIndices: [{ name: "HollyFrontier Pipeline Tariff", date: "July 1, 2024" }],
          website: "https://www.hfsinclair.com",
        },
      };

      // Match operator to pipeline knowledge base
      let match: typeof PIPELINE_KB[string] | null = null;
      for (const [key, val] of Object.entries(PIPELINE_KB)) {
        if (operator.includes(key)) {
          // Filter systems to those that operate in the facility's state
          const relevantSystems = state
            ? val.systems.filter(s => s.states.includes(state) || s.states.length === 0)
            : val.systems;
          match = {
            ...val,
            systems: relevantSystems.length > 0 ? relevantSystems : val.systems,
          };
          break;
        }
      }

      // Also check if the facility receives pipeline — show generic FERC info
      const receivesPipeline = f.receivesPipeline;

      return {
        facilityId: input.facilityId,
        operatorName: f.operatorName,
        facilityName: f.facilityName,
        state,
        receivesPipeline: !!receivesPipeline,
        pipelineOperator: match,
        fercInfoUrl: "https://www.ferc.gov/industries-data/oil/tariffs-oil-pipeline-tariffs",
      };
    }),

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN: ETL Seed
  // ═══════════════════════════════════════════════════════════════════

  seedDatabase: protectedProcedure
    .mutation(async () => {
      return seedFacilityDatabase();
    }),

  seedPipelineStations: protectedProcedure
    .mutation(async () => {
      return importPipelineStations();
    }),
});
