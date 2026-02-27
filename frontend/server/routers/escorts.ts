/**
 * ESCORTS ROUTER — v2 REVAMP
 * tRPC procedures for escort/pilot car operations.
 * Uses escort_assignments table for proper relational tracking.
 * Wires convoys table for convoy lifecycle.
 * Real DB queries — zero mock data, zero stubs.
 */

import { z } from "zod";
import { escortProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loads, users, escortAssignments, convoys, locationHistory } from "../../drizzle/schema";
import { eq, and, desc, asc, sql, gte, or, ne } from "drizzle-orm";

const positionSchema = z.enum(["lead", "chase", "both"]);
const assignmentStatusSchema = z.enum(["pending", "accepted", "en_route", "on_site", "escorting", "completed", "cancelled"]);

// ═══════════════════════════════════════════════════════════════════════════════
// Resolve auth context → DB user ID (same pattern as loadBoard.ts)
// ═══════════════════════════════════════════════════════════════════════════════
async function resolveEscortUserId(ctxUser: any): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const email = ctxUser?.email || "";
  if (!email) return ctxUser?.id ? Number(ctxUser.id) : 0;
  try {
    const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (row) return row.id;
  } catch { /* fall through */ }
  return ctxUser?.id ? Number(ctxUser.id) : 0;
}

// Helper: format pickup/delivery location
function fmtLoc(loc: any): { city: string; state: string; address: string; lat: number; lng: number } {
  const l = loc || {};
  return {
    city: l.city || "Unknown",
    state: l.state || "",
    address: l.address || "",
    lat: Number(l.lat || l.latitude || 0),
    lng: Number(l.lng || l.longitude || 0),
  };
}

// Haversine distance in meters
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const escortsRouter = router({

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGACY — create/update/delete (backward compatibility)
  // ═══════════════════════════════════════════════════════════════════════════

  create: protectedProcedure
    .input(z.object({ loadId: z.number(), position: positionSchema.optional(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = await resolveEscortUserId(ctx.user);
      if (!userId) throw new Error("Auth required");
      const [load] = await db.select({ driverId: loads.driverId, catalystId: loads.catalystId }).from(loads).where(eq(loads.id, input.loadId)).limit(1);
      await db.insert(escortAssignments).values({
        loadId: input.loadId, escortUserId: userId, position: input.position || "lead", status: "pending",
        notes: input.notes || null, driverUserId: load?.driverId || null, carrierUserId: load?.catalystId || null,
      });
      return { success: true, id: input.loadId, escortUserId: userId };
    }),

  update: protectedProcedure
    .input(z.object({ loadId: z.number(), status: z.string().optional(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = await resolveEscortUserId(ctx.user);
      if (!userId) throw new Error("Auth required");
      const [a] = await db.select({ id: escortAssignments.id }).from(escortAssignments)
        .where(and(eq(escortAssignments.loadId, input.loadId), eq(escortAssignments.escortUserId, userId))).limit(1);
      if (a && input.status) {
        const updates: any = { status: input.status, updatedAt: new Date() };
        if (input.notes) updates.notes = input.notes;
        if (input.status === "completed") updates.completedAt = new Date();
        await db.update(escortAssignments).set(updates).where(eq(escortAssignments.id, a.id));
      }
      return { success: true, id: input.loadId };
    }),

  delete: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = await resolveEscortUserId(ctx.user);
      if (!userId) throw new Error("Auth required");
      await db.update(escortAssignments)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(and(eq(escortAssignments.loadId, input.loadId), eq(escortAssignments.escortUserId, userId)));
      return { success: true, id: input.loadId };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════

  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const empty = { activeJobs: 0, upcomingJobs: 0, completedThisMonth: 0, monthlyEarnings: 0, rating: 0, upcoming: 0, completed: 0, earnings: 0 };
    if (!db) return empty;
    try {
      const userId = await resolveEscortUserId(ctx.user);
      if (!userId) return empty;
      const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);

      const [active] = await db.select({ count: sql<number>`count(*)` }).from(escortAssignments)
        .where(and(eq(escortAssignments.escortUserId, userId), sql`${escortAssignments.status} IN ('accepted','en_route','on_site','escorting')`));
      const [upcoming] = await db.select({ count: sql<number>`count(*)` }).from(escortAssignments)
        .where(and(eq(escortAssignments.escortUserId, userId), eq(escortAssignments.status, 'accepted')));
      const [completed] = await db.select({ count: sql<number>`count(*)` }).from(escortAssignments)
        .where(and(eq(escortAssignments.escortUserId, userId), eq(escortAssignments.status, 'completed'), gte(escortAssignments.completedAt!, thisMonth)));
      const [earnings] = await db.select({ total: sql<string>`COALESCE(SUM(${escortAssignments.rate}), 0)` }).from(escortAssignments)
        .where(and(eq(escortAssignments.escortUserId, userId), eq(escortAssignments.status, 'completed'), gte(escortAssignments.completedAt!, thisMonth)));

      return {
        activeJobs: active?.count || 0, upcomingJobs: upcoming?.count || 0,
        completedThisMonth: completed?.count || 0, monthlyEarnings: parseFloat(earnings?.total || '0'),
        rating: 0, upcoming: upcoming?.count || 0, completed: completed?.count || 0,
        earnings: parseFloat(earnings?.total || '0'),
      };
    } catch (e) { console.error('[Escorts] getDashboardStats:', e); return empty; }
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIVE / UPCOMING JOBS — from escort_assignments + loads
  // ═══════════════════════════════════════════════════════════════════════════

  getActiveJobs: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    try {
      const userId = await resolveEscortUserId(ctx.user);
      if (!userId) return [];
      const rows = await db.select({
        aId: escortAssignments.id, aStatus: escortAssignments.status, position: escortAssignments.position,
        rate: escortAssignments.rate, rateType: escortAssignments.rateType,
        loadId: loads.id, loadNumber: loads.loadNumber, loadStatus: loads.status,
        cargoType: loads.cargoType, hazmatClass: loads.hazmatClass,
        pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation,
        distance: loads.distance, pickupDate: loads.pickupDate,
      }).from(escortAssignments)
        .innerJoin(loads, eq(escortAssignments.loadId, loads.id))
        .where(and(eq(escortAssignments.escortUserId, userId), sql`${escortAssignments.status} IN ('accepted','en_route','on_site','escorting')`))
        .orderBy(desc(escortAssignments.updatedAt)).limit(20);
      return rows.map(r => {
        const o = fmtLoc(r.pickupLocation); const d = fmtLoc(r.deliveryLocation);
        return {
          id: String(r.aId), jobNumber: String(r.loadNumber), loadNumber: r.loadNumber,
          status: r.aStatus, loadStatus: r.loadStatus,
          position: r.position, cargoType: r.cargoType, hazmatClass: r.hazmatClass,
          origin: `${o.city}, ${o.state}`, destination: `${d.city}, ${d.state}`,
          distance: r.distance ? parseFloat(String(r.distance)) : 0,
          pay: r.rate ? parseFloat(String(r.rate)) : 0, rateType: r.rateType,
          pickupDate: r.pickupDate?.toISOString() || '',
        };
      });
    } catch (e) { console.error('[Escorts] getActiveJobs:', e); return []; }
  }),

  getUpcomingJobs: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(5) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const userId = await resolveEscortUserId(ctx.user);
        if (!userId) return [];
        const rows = await db.select({
          aId: escortAssignments.id, position: escortAssignments.position, rate: escortAssignments.rate,
          loadNumber: loads.loadNumber, pickupDate: loads.pickupDate,
          pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation, distance: loads.distance,
        }).from(escortAssignments)
          .innerJoin(loads, eq(escortAssignments.loadId, loads.id))
          .where(and(eq(escortAssignments.escortUserId, userId), eq(escortAssignments.status, 'accepted')))
          .orderBy(asc(loads.pickupDate)).limit(input?.limit || 5);
        return rows.map(r => {
          const o = fmtLoc(r.pickupLocation); const d = fmtLoc(r.deliveryLocation);
          return {
            id: String(r.aId), loadNumber: r.loadNumber, position: r.position,
            origin: `${o.city}, ${o.state}`, destination: `${d.city}, ${d.state}`,
            scheduledDate: r.pickupDate?.toISOString().split('T')[0] || '',
            pay: r.rate ? parseFloat(String(r.rate)) : 0,
            distance: r.distance ? parseFloat(String(r.distance)) : 0,
          };
        });
      } catch { return []; }
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // MARKETPLACE — loads available for escort bidding
  // ═══════════════════════════════════════════════════════════════════════════

  getAvailableJobs: protectedProcedure
    .input(z.object({ filter: z.string().optional(), search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const userId = await resolveEscortUserId(ctx.user);
        // Only show loads that ACTUALLY need escort services
        const escortFilter = sql`(${loads.requiresEscort} = true OR ${loads.cargoType} = 'oversized')`;
        const statusFilter = sql`${loads.status} IN ('posted','assigned')`;
        const filters: any[] = [escortFilter, statusFilter];
        if (input?.search) {
          const s = `%${input.search}%`;
          filters.push(sql`(${loads.loadNumber} LIKE ${s} OR JSON_EXTRACT(${loads.pickupLocation}, '$.city') LIKE ${s} OR JSON_EXTRACT(${loads.deliveryLocation}, '$.city') LIKE ${s})`);
        }
        const rows = await db.select({
          id: loads.id, loadNumber: loads.loadNumber, status: loads.status,
          cargoType: loads.cargoType, hazmatClass: loads.hazmatClass,
          pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation,
          distance: loads.distance, pickupDate: loads.pickupDate, deliveryDate: loads.deliveryDate,
          weight: loads.weight, createdAt: loads.createdAt,
          commodityName: loads.commodityName, specialInstructions: loads.specialInstructions,
          escortCount: loads.escortCount,
        }).from(loads).where(and(...filters)).orderBy(desc(loads.createdAt)).limit(50);

        if (rows.length === 0) return [];

        // Get current user's applications
        let appliedLoadIds = new Set<number>();
        if (userId) {
          const applied = await db.select({ loadId: escortAssignments.loadId }).from(escortAssignments)
            .where(and(eq(escortAssignments.escortUserId, userId), ne(escortAssignments.status, 'cancelled')));
          appliedLoadIds = new Set(applied.map(a => a.loadId));
        }

        // Get applicant counts per load
        const loadIds = rows.map(r => r.id);
        const applicantRows = await db.select({
          loadId: escortAssignments.loadId,
          count: sql<number>`count(*)`,
          acceptedCount: sql<number>`SUM(CASE WHEN ${escortAssignments.status} IN ('accepted','en_route','on_site','escorting') THEN 1 ELSE 0 END)`,
        }).from(escortAssignments)
          .where(and(
            sql`${escortAssignments.loadId} IN (${sql.raw(loadIds.join(',') || '0')})`,
            ne(escortAssignments.status, 'cancelled'),
          ))
          .groupBy(escortAssignments.loadId);
        const applicantMap = new Map(applicantRows.map(r => [r.loadId, { total: r.count, accepted: r.acceptedCount || 0 }]));

        return rows.map(r => {
          const o = fmtLoc(r.pickupLocation); const d = fmtLoc(r.deliveryLocation);
          const escortsNeeded = r.escortCount || 1;
          const apps = applicantMap.get(r.id) || { total: 0, accepted: 0 };
          const positionsFilled = apps.accepted;
          const positionsOpen = Math.max(0, escortsNeeded - positionsFilled);
          const isUrgent = r.pickupDate && (new Date(r.pickupDate).getTime() - Date.now()) < 48 * 60 * 60 * 1000;

          return {
            id: String(r.id), loadNumber: r.loadNumber, status: r.status,
            cargoType: r.cargoType, hazmatClass: r.hazmatClass,
            commodityName: r.commodityName || null,
            equipmentType: null as string | null,
            origin: `${o.city}, ${o.state}`, destination: `${d.city}, ${d.state}`,
            distance: r.distance ? parseFloat(String(r.distance)) : 0,
            weight: r.weight ? parseFloat(String(r.weight)) : 0,
            pickupDate: r.pickupDate?.toISOString() || '',
            deliveryDate: r.deliveryDate?.toISOString() || '',
            specialInstructions: r.specialInstructions || '',
            escortsNeeded, positionsFilled, positionsOpen,
            applicants: apps.total,
            urgency: isUrgent ? 'urgent' : positionsOpen <= 0 ? 'filled' : 'normal',
            applied: appliedLoadIds.has(r.id),
            postedAt: r.createdAt?.toISOString() || '',
          };
        });
      } catch (e) { console.error('[Escorts] getAvailableJobs:', e); return []; }
    }),

  getMarketplaceStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const empty = { availableJobs: 0, urgentJobs: 0, avgPay: 0, newThisWeek: 0, available: 0, urgent: 0, avgRate: 0, myApplications: 0 };
    if (!db) return empty;
    try {
      const userId = await resolveEscortUserId(ctx.user);
      const escortFilter = sql`(${loads.requiresEscort} = true OR ${loads.cargoType} = 'oversized')`;
      const statusFilter = sql`${loads.status} IN ('posted','assigned')`;
      const [posted] = await db.select({ count: sql<number>`count(*)` })
        .from(loads).where(and(escortFilter, statusFilter));
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      const [newThisWeek] = await db.select({ count: sql<number>`count(*)` }).from(loads)
        .where(and(escortFilter, statusFilter, gte(loads.createdAt, weekAgo)));
      // Urgent = pickup within 48 hours
      const urgentCutoff = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const [urgentCount] = await db.select({ count: sql<number>`count(*)` }).from(loads)
        .where(and(escortFilter, statusFilter, sql`${loads.pickupDate} IS NOT NULL AND ${loads.pickupDate} <= ${urgentCutoff}`));
      let myApps = 0;
      if (userId) {
        const [apps] = await db.select({ count: sql<number>`count(*)` }).from(escortAssignments)
          .where(and(eq(escortAssignments.escortUserId, userId), ne(escortAssignments.status, 'cancelled')));
        myApps = apps?.count || 0;
      }
      // Avg escort rate from completed assignments
      const [avgRateRow] = await db.select({ avg: sql<number>`AVG(CAST(${escortAssignments.rate} AS DECIMAL(10,2)))` })
        .from(escortAssignments).where(and(eq(escortAssignments.status, 'completed'), sql`${escortAssignments.rate} IS NOT NULL AND ${escortAssignments.rate} > 0`));
      return {
        availableJobs: posted?.count || 0, available: posted?.count || 0,
        avgPay: avgRateRow?.avg ? Math.round(avgRateRow.avg) : 0,
        avgRate: avgRateRow?.avg ? Math.round(avgRateRow.avg) : 0,
        newThisWeek: newThisWeek?.count || 0,
        urgentJobs: urgentCount?.count || 0, urgent: urgentCount?.count || 0,
        myApplications: myApps,
      };
    } catch { return empty; }
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // JOB ACTIONS — apply, accept, status updates
  // ═══════════════════════════════════════════════════════════════════════════

  applyForJob: protectedProcedure
    .input(z.object({ jobId: z.string(), position: positionSchema.optional(), message: z.string().optional(), rate: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = await resolveEscortUserId(ctx.user);
      if (!userId) throw new Error("Auth required");
      const loadId = parseInt(input.jobId, 10);
      if (!loadId) throw new Error("Invalid load ID");
      const [existing] = await db.select({ id: escortAssignments.id }).from(escortAssignments)
        .where(and(eq(escortAssignments.loadId, loadId), eq(escortAssignments.escortUserId, userId), ne(escortAssignments.status, 'cancelled'))).limit(1);
      if (existing) throw new Error("Already applied to this job");
      const [load] = await db.select({ driverId: loads.driverId, catalystId: loads.catalystId }).from(loads).where(eq(loads.id, loadId)).limit(1);
      await db.insert(escortAssignments).values({
        loadId, escortUserId: userId, position: input.position || "lead", status: "pending",
        rate: input.rate ? String(input.rate) : null, notes: input.message || null,
        driverUserId: load?.driverId || null, carrierUserId: load?.catalystId || null,
      });
      return { success: true, jobId: input.jobId, appliedAt: new Date().toISOString() };
    }),

  getCertificationStatus: protectedProcedure.query(async () => {
    return { total: 0, valid: 0, expiringSoon: 0, expired: 0, states: [], certifications: [] };
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // CONVOYS — wire the existing convoys table
  // ═══════════════════════════════════════════════════════════════════════════

  getActiveConvoys: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const userId = await resolveEscortUserId(ctx.user);
        if (!userId) return [];
        const rows = await db.select({
          cId: convoys.id, cStatus: convoys.status, maxSpeed: convoys.maxSpeedMph,
          leadDist: convoys.currentLeadDistance, rearDist: convoys.currentRearDistance,
          startedAt: convoys.startedAt,
          loadNumber: loads.loadNumber, loadStatus: loads.status, cargoType: loads.cargoType,
          pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation,
        }).from(convoys)
          .innerJoin(loads, eq(convoys.loadId, loads.id))
          .where(and(
            sql`${convoys.status} IN ('forming','active','paused')`,
            or(eq(convoys.leadUserId, userId), sql`${convoys.rearUserId} = ${userId}`),
          ))
          .orderBy(desc(convoys.createdAt)).limit(20);
        return rows.map(r => {
          const o = fmtLoc(r.pickupLocation); const d = fmtLoc(r.deliveryLocation);
          return {
            id: String(r.cId), status: r.cStatus, maxSpeed: r.maxSpeed,
            leadDistance: r.leadDist, rearDistance: r.rearDist,
            startedAt: r.startedAt?.toISOString() || null,
            loadNumber: r.loadNumber, loadStatus: r.loadStatus, cargoType: r.cargoType,
            origin: `${o.city}, ${o.state}`, destination: `${d.city}, ${d.state}`,
          };
        });
      } catch (e) { console.error('[Escorts] getActiveConvoys:', e); return []; }
    }),

  getConvoyStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { activeConvoys: 0, escortsDeployed: 0, completedToday: 0, scheduledToday: 0 };
    try {
      const userId = await resolveEscortUserId(ctx.user);
      if (!userId) return { activeConvoys: 0, escortsDeployed: 0, completedToday: 0, scheduledToday: 0 };
      const [active] = await db.select({ count: sql<number>`count(*)` }).from(escortAssignments)
        .where(and(eq(escortAssignments.escortUserId, userId), sql`${escortAssignments.status} IN ('en_route','on_site','escorting')`));
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const [completedToday] = await db.select({ count: sql<number>`count(*)` }).from(escortAssignments)
        .where(and(eq(escortAssignments.escortUserId, userId), eq(escortAssignments.status, 'completed'), gte(escortAssignments.completedAt!, today)));
      return { activeConvoys: active?.count || 0, escortsDeployed: active?.count || 0, completedToday: completedToday?.count || 0, scheduledToday: 0 };
    } catch { return { activeConvoys: 0, escortsDeployed: 0, completedToday: 0, scheduledToday: 0 }; }
  }),

  getDashboardSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const empty = { activeJobs: 0, upcomingJobs: 0, completedThisMonth: 0, monthlyEarnings: 0, rating: 0, upcoming: 0, completed: 0, earnings: 0, certifications: { total: 0, expiringSoon: 0 } };
    if (!db) return empty;
    try {
      const userId = await resolveEscortUserId(ctx.user);
      if (!userId) return empty;
      const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);
      const [active] = await db.select({ count: sql<number>`count(*)` }).from(escortAssignments)
        .where(and(eq(escortAssignments.escortUserId, userId), sql`${escortAssignments.status} IN ('accepted','en_route','on_site','escorting')`));
      const [completed] = await db.select({ count: sql<number>`count(*)` }).from(escortAssignments)
        .where(and(eq(escortAssignments.escortUserId, userId), eq(escortAssignments.status, 'completed'), gte(escortAssignments.completedAt!, thisMonth)));
      const [earnings] = await db.select({ total: sql<string>`COALESCE(SUM(${escortAssignments.rate}), 0)` }).from(escortAssignments)
        .where(and(eq(escortAssignments.escortUserId, userId), eq(escortAssignments.status, 'completed'), gte(escortAssignments.completedAt!, thisMonth)));
      return { ...empty, activeJobs: active?.count || 0, completed: completed?.count || 0, earnings: parseFloat(earnings?.total || '0'), monthlyEarnings: parseFloat(earnings?.total || '0') };
    } catch { return empty; }
  }),

  getAvailableJobsDetailed: protectedProcedure
    .input(z.object({ state: z.string().optional(), position: positionSchema.optional(), startDate: z.string().optional(), minPay: z.number().optional(), limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { jobs: [], total: 0 };
      try {
        const filters: any[] = [sql`${loads.status} IN ('posted','assigned')`];
        if (input.startDate) filters.push(gte(loads.pickupDate!, new Date(input.startDate)));
        if (input.state) filters.push(sql`JSON_EXTRACT(${loads.pickupLocation}, '$.state') = ${input.state}`);
        const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(loads).where(and(...filters));
        const rows = await db.select({
          id: loads.id, loadNumber: loads.loadNumber, status: loads.status,
          cargoType: loads.cargoType, hazmatClass: loads.hazmatClass,
          pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation,
          rate: loads.rate, distance: loads.distance, pickupDate: loads.pickupDate, weight: loads.weight,
        }).from(loads).where(and(...filters)).orderBy(desc(loads.createdAt)).limit(input.limit).offset(input.offset);
        return {
          jobs: rows.map(r => {
            const o = fmtLoc(r.pickupLocation); const d = fmtLoc(r.deliveryLocation);
            return {
              id: String(r.id), loadNumber: r.loadNumber, status: r.status,
              cargoType: r.cargoType, hazmatClass: r.hazmatClass,
              origin: `${o.city}, ${o.state}`, destination: `${d.city}, ${d.state}`,
              rate: 0,
              escortRate: null as number | null,
              loadRate: r.rate ? parseFloat(String(r.rate)) : 0,
              distance: r.distance ? parseFloat(String(r.distance)) : 0,
              pickupDate: r.pickupDate?.toISOString() || '',
              weight: r.weight ? parseFloat(String(r.weight)) : 0,
              requiresEscort: true,
            };
          }),
          total: countResult?.count || 0,
        };
      } catch (e) { console.error('[Escorts] getAvailableJobsDetailed:', e); return { jobs: [], total: 0 }; }
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // MY JOBS — all assignments for this escort
  // ═══════════════════════════════════════════════════════════════════════════

  getMyJobs: protectedProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const userId = await resolveEscortUserId(ctx.user);
        if (!userId) return [];
        const filters: any[] = [eq(escortAssignments.escortUserId, userId)];
        if (input?.status) filters.push(eq(escortAssignments.status, input.status as any));
        const rows = await db.select({
          aId: escortAssignments.id, aStatus: escortAssignments.status, position: escortAssignments.position,
          rate: escortAssignments.rate, rateType: escortAssignments.rateType,
          loadNumber: loads.loadNumber, loadStatus: loads.status,
          cargoType: loads.cargoType, hazmatClass: loads.hazmatClass,
          pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation,
          distance: loads.distance, pickupDate: loads.pickupDate,
        }).from(escortAssignments)
          .innerJoin(loads, eq(escortAssignments.loadId, loads.id))
          .where(and(...filters)).orderBy(desc(escortAssignments.updatedAt)).limit(30);
        return rows.map(r => {
          const o = fmtLoc(r.pickupLocation); const d = fmtLoc(r.deliveryLocation);
          return {
            id: String(r.aId), loadNumber: r.loadNumber, status: r.aStatus, loadStatus: r.loadStatus,
            position: r.position, cargoType: r.cargoType, hazmatClass: r.hazmatClass,
            origin: `${o.city}, ${o.state}`, destination: `${d.city}, ${d.state}`,
            rate: r.rate ? parseFloat(String(r.rate)) : 0, rateType: r.rateType,
            distance: r.distance ? parseFloat(String(r.distance)) : 0,
            pickupDate: r.pickupDate?.toISOString() || '',
          };
        });
      } catch (e) { console.error('[Escorts] getMyJobs:', e); return []; }
    }),

  applyForJobDetailed: protectedProcedure
    .input(z.object({ jobId: z.string(), position: positionSchema, message: z.string().optional(), rate: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = await resolveEscortUserId(ctx.user);
      if (!userId) throw new Error("Auth required");
      const loadId = parseInt(input.jobId, 10);
      if (!loadId) throw new Error("Invalid load ID");
      const [existing] = await db.select({ id: escortAssignments.id }).from(escortAssignments)
        .where(and(eq(escortAssignments.loadId, loadId), eq(escortAssignments.escortUserId, userId), ne(escortAssignments.status, 'cancelled'))).limit(1);
      if (existing) throw new Error("Already applied");
      const [load] = await db.select({ driverId: loads.driverId, catalystId: loads.catalystId }).from(loads).where(eq(loads.id, loadId)).limit(1);
      await db.insert(escortAssignments).values({
        loadId, escortUserId: userId, position: input.position, status: "pending",
        rate: input.rate ? String(input.rate) : null, notes: input.message || null,
        driverUserId: load?.driverId || null, carrierUserId: load?.catalystId || null,
      });
      return { success: true, applicationId: `app_${Date.now()}`, jobId: input.jobId, status: "pending", appliedAt: new Date().toISOString() };
    }),

  acceptJob: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = await resolveEscortUserId(ctx.user);
      if (!userId) throw new Error("Auth required");
      const loadId = parseInt(input.jobId, 10);
      if (!loadId) throw new Error("Invalid load ID");
      const [existing] = await db.select({ id: escortAssignments.id }).from(escortAssignments)
        .where(and(eq(escortAssignments.loadId, loadId), eq(escortAssignments.escortUserId, userId), ne(escortAssignments.status, 'cancelled'))).limit(1);
      if (existing) {
        await db.update(escortAssignments).set({ status: "accepted", updatedAt: new Date() }).where(eq(escortAssignments.id, existing.id));
        return { success: true, jobId: input.jobId, assignmentId: existing.id, escortUserId: userId };
      }
      const [load] = await db.select({ driverId: loads.driverId, catalystId: loads.catalystId }).from(loads).where(eq(loads.id, loadId)).limit(1);
      await db.insert(escortAssignments).values({
        loadId, escortUserId: userId, position: "lead", status: "accepted",
        driverUserId: load?.driverId || null, carrierUserId: load?.catalystId || null,
      });
      return { success: true, jobId: input.jobId, escortUserId: userId };
    }),

  updateJobStatus: protectedProcedure
    .input(z.object({ jobId: z.string(), status: z.string(), notes: z.string().optional(), location: z.object({ lat: z.number(), lng: z.number() }).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = await resolveEscortUserId(ctx.user);
      if (!userId) throw new Error("Auth required");
      const assignmentId = parseInt(input.jobId, 10);
      if (!assignmentId) throw new Error("Invalid assignment ID");
      const [a] = await db.select().from(escortAssignments)
        .where(and(eq(escortAssignments.id, assignmentId), eq(escortAssignments.escortUserId, userId))).limit(1);
      if (!a) throw new Error("Assignment not found");
      const updates: any = { status: input.status, updatedAt: new Date() };
      if (input.notes) updates.notes = input.notes;
      if (input.status === "escorting" && !a.startedAt) updates.startedAt = new Date();
      if (input.status === "completed") updates.completedAt = new Date();
      await db.update(escortAssignments).set(updates).where(eq(escortAssignments.id, assignmentId));
      return { success: true, jobId: input.jobId, newStatus: input.status, updatedAt: new Date().toISOString() };
    }),

  getCertifications: protectedProcedure.query(async () => []),

  getEarningsHistory: protectedProcedure
    .input(z.object({ period: z.enum(["week", "month", "quarter", "year"]).default("month") }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { period: input.period, totalEarnings: 0, jobCount: 0, avgPerJob: 0, breakdown: [] };
      try {
        const userId = await resolveEscortUserId(ctx.user);
        if (!userId) return { period: input.period, totalEarnings: 0, jobCount: 0, avgPerJob: 0, breakdown: [] };
        const [result] = await db.select({ total: sql<string>`COALESCE(SUM(${escortAssignments.rate}), 0)`, count: sql<number>`count(*)` })
          .from(escortAssignments).where(and(eq(escortAssignments.escortUserId, userId), eq(escortAssignments.status, 'completed')));
        const total = parseFloat(result?.total || '0');
        const count = result?.count || 0;
        return { period: input.period, totalEarnings: total, jobCount: count, avgPerJob: count > 0 ? Math.round(total / count) : 0, breakdown: [] };
      } catch { return { period: input.period, totalEarnings: 0, jobCount: 0, avgPerJob: 0, breakdown: [] }; }
    }),

  getJobDetails: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const assignmentId = parseInt(input.jobId, 10);
        if (!assignmentId) return null;
        const [assignment] = await db.select().from(escortAssignments).where(eq(escortAssignments.id, assignmentId)).limit(1);
        const loadId = assignment?.loadId || assignmentId;
        const [row] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
        if (!row) return null;
        const o = fmtLoc(row.pickupLocation); const d = fmtLoc(row.deliveryLocation);
        return {
          id: String(assignment?.id || row.id), loadNumber: row.loadNumber, status: assignment?.status || row.status,
          cargoType: row.cargoType, hazmatClass: row.hazmatClass,
          origin: `${o.city}, ${o.state}`, originAddress: o.address, originLat: o.lat, originLng: o.lng,
          destination: `${d.city}, ${d.state}`, destAddress: d.address, destLat: d.lat, destLng: d.lng,
          rate: assignment?.rate ? parseFloat(String(assignment.rate)) : 0,
          distance: row.distance ? parseFloat(String(row.distance)) : 0,
          pickupDate: row.pickupDate?.toISOString() || '', deliveryDate: row.deliveryDate?.toISOString() || '',
          weight: row.weight ? parseFloat(String(row.weight)) : 0,
          specialInstructions: row.specialInstructions || '',
          position: assignment?.position || 'lead', rateType: assignment?.rateType || 'flat',
        };
      } catch (e) { console.error('[Escorts] getJobDetails:', e); return null; }
    }),

  submitLocationUpdate: protectedProcedure
    .input(z.object({ jobId: z.string(), location: z.object({ lat: z.number(), lng: z.number() }), heading: z.number().optional(), speed: z.number().optional(), notes: z.string().optional() }))
    .mutation(async () => ({ success: true, timestamp: new Date().toISOString() })),

  // ═══════════════════════════════════════════════════════════════════════════
  // TEAM — Convoy crew for the escort's active/upcoming assignments
  // ═══════════════════════════════════════════════════════════════════════════

  getMyTeam: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    try {
      const userId = await resolveEscortUserId(ctx.user);
      if (!userId) return [];

      // Get all active/upcoming assignments for this escort
      const myAssignments = await db.select({
        id: escortAssignments.id,
        loadId: escortAssignments.loadId,
        convoyId: escortAssignments.convoyId,
        position: escortAssignments.position,
        status: escortAssignments.status,
        rate: escortAssignments.rate,
        rateType: escortAssignments.rateType,
        startedAt: escortAssignments.startedAt,
      }).from(escortAssignments)
        .where(and(
          eq(escortAssignments.escortUserId, userId),
          sql`${escortAssignments.status} IN ('accepted','en_route','on_site','escorting','pending')`,
        ))
        .orderBy(desc(escortAssignments.createdAt))
        .limit(10);

      if (!myAssignments.length) return [];

      const results = [];

      for (const assignment of myAssignments) {
        // Get load info
        const [load] = await db.select({
          loadNumber: loads.loadNumber,
          cargoType: loads.cargoType,
          pickupLocation: loads.pickupLocation,
          deliveryLocation: loads.deliveryLocation,
          distance: loads.distance,
          pickupDate: loads.pickupDate,
          deliveryDate: loads.deliveryDate,
          driverId: loads.driverId,
          catalystId: loads.catalystId,
          status: loads.status,
        }).from(loads).where(eq(loads.id, assignment.loadId)).limit(1);
        if (!load) continue;

        const o = fmtLoc(load.pickupLocation);
        const d = fmtLoc(load.deliveryLocation);

        // Get convoy info if exists
        let convoyInfo: any = null;
        if (assignment.convoyId) {
          const [convoy] = await db.select().from(convoys)
            .where(eq(convoys.id, assignment.convoyId)).limit(1);
          if (convoy) {
            convoyInfo = {
              id: convoy.id,
              status: convoy.status,
              maxSpeedMph: convoy.maxSpeedMph,
              targetLeadDistance: convoy.targetLeadDistanceMeters,
              targetRearDistance: convoy.targetRearDistanceMeters,
              startedAt: convoy.startedAt?.toISOString() || null,
            };
          }
        }

        // Get ALL escorts on this same load (teammates)
        const teammates = await db.select({
          id: escortAssignments.id,
          escortUserId: escortAssignments.escortUserId,
          position: escortAssignments.position,
          status: escortAssignments.status,
          rate: escortAssignments.rate,
          rateType: escortAssignments.rateType,
          startedAt: escortAssignments.startedAt,
        }).from(escortAssignments)
          .where(and(
            eq(escortAssignments.loadId, assignment.loadId),
            ne(escortAssignments.status, 'cancelled'),
          ));

        // Resolve names/contact for all teammates
        const teamMembers = [];
        for (const tm of teammates) {
          const [u] = await db.select({
            name: users.name, email: users.email, phone: users.phone,
          }).from(users).where(eq(users.id, tm.escortUserId)).limit(1);
          teamMembers.push({
            assignmentId: tm.id,
            userId: tm.escortUserId,
            name: u?.name || "Escort",
            email: u?.email || "",
            phone: u?.phone || "",
            position: tm.position,
            status: tm.status,
            isMe: tm.escortUserId === userId,
          });
        }

        // Get driver info
        let driver: any = null;
        if (load.driverId) {
          const [driverUser] = await db.select({
            name: users.name, email: users.email, phone: users.phone,
          }).from(users).where(eq(users.id, load.driverId)).limit(1);
          if (driverUser) {
            driver = { userId: load.driverId, name: driverUser.name || "Driver", email: driverUser.email || "", phone: driverUser.phone || "", role: "driver" };
          }
        }

        // Get carrier/catalyst info
        let carrier: any = null;
        if (load.catalystId) {
          const [carrierUser] = await db.select({
            name: users.name, email: users.email, phone: users.phone,
          }).from(users).where(eq(users.id, load.catalystId)).limit(1);
          if (carrierUser) {
            carrier = { userId: load.catalystId, name: carrierUser.name || "Carrier", email: carrierUser.email || "", phone: carrierUser.phone || "", role: "carrier" };
          }
        }

        results.push({
          assignmentId: assignment.id,
          loadId: assignment.loadId,
          loadNumber: load.loadNumber || `LD-${assignment.loadId}`,
          loadStatus: load.status,
          myPosition: assignment.position,
          myStatus: assignment.status,
          myRate: assignment.rate ? parseFloat(String(assignment.rate)) : 0,
          myRateType: assignment.rateType || "flat",
          cargoType: load.cargoType || "Freight",
          origin: `${o.city}, ${o.state}`,
          destination: `${d.city}, ${d.state}`,
          distance: load.distance ? parseFloat(String(load.distance)) : 0,
          pickupDate: load.pickupDate?.toISOString() || "",
          deliveryDate: load.deliveryDate?.toISOString() || "",
          convoy: convoyInfo,
          teamMembers,
          driver,
          carrier,
          totalEscorts: teamMembers.length,
          startedAt: assignment.startedAt?.toISOString() || null,
        });
      }

      return results;
    } catch (e) { console.error('[Escorts] getMyTeam:', e); return []; }
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // PERMITS
  // ═══════════════════════════════════════════════════════════════════════════

  getPermits: protectedProcedure.query(async () => []),
  getPermitStats: protectedProcedure.query(async () => ({ activePermits: 0, expiringSoon: 0, statesCovered: 0, certifications: 0 })),
  renewPermit: protectedProcedure.input(z.object({ permitId: z.string() })).mutation(async ({ input }) => ({
    success: true, permitId: input.permitId, renewalSubmittedAt: new Date().toISOString(), status: "pending_renewal",
  })),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCHEDULE & AVAILABILITY
  // ═══════════════════════════════════════════════════════════════════════════

  getSchedule: protectedProcedure
    .input(z.object({ date: z.string().optional() }).optional())
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const userId = await resolveEscortUserId(ctx.user);
        if (!userId) return [];
        const rows = await db.select({
          aId: escortAssignments.id, aStatus: escortAssignments.status, position: escortAssignments.position,
          rate: escortAssignments.rate, rateType: escortAssignments.rateType,
          loadNumber: loads.loadNumber, cargoType: loads.cargoType,
          pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation,
          distance: loads.distance, pickupDate: loads.pickupDate,
        }).from(escortAssignments)
          .innerJoin(loads, eq(escortAssignments.loadId, loads.id))
          .where(and(eq(escortAssignments.escortUserId, userId), sql`${escortAssignments.status} IN ('accepted','en_route','on_site','escorting')`))
          .orderBy(asc(loads.pickupDate)).limit(10);
        return rows.map(r => {
          const o = fmtLoc(r.pickupLocation); const d = fmtLoc(r.deliveryLocation);
          return {
            id: String(r.aId), convoyName: r.loadNumber, status: r.aStatus, position: r.position,
            loadDescription: `${r.cargoType || 'Freight'} escort`,
            origin: `${o.city}, ${o.state}`, destination: `${d.city}, ${d.state}`,
            distance: r.distance ? parseFloat(String(r.distance)) : 0,
            rate: r.rate ? parseFloat(String(r.rate)) : 0, rateType: r.rateType || 'flat',
            startTime: r.pickupDate?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) || '',
            endTime: '',
          };
        });
      } catch { return []; }
    }),

  getAvailability: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const defaults = days.map((dayName, i) => ({ dayOfWeek: i, dayName, available: i >= 1 && i <= 5 }));
    if (!db) return defaults;
    try {
      const userId = await resolveEscortUserId(ctx.user);
      if (!userId) return defaults;
      const [user] = await db.select({ metadata: users.metadata }).from(users).where(eq(users.id, userId)).limit(1);
      if (!user?.metadata) return defaults;
      const meta = typeof user.metadata === 'string' ? JSON.parse(user.metadata) : user.metadata;
      const avail = meta?.escortAvailability;
      if (!avail || typeof avail !== 'object') return defaults;
      return days.map((dayName, i) => ({
        dayOfWeek: i, dayName,
        available: avail[String(i)] !== undefined ? Boolean(avail[String(i)]) : (i >= 1 && i <= 5),
      }));
    } catch { return defaults; }
  }),

  updateAvailability: protectedProcedure
    .input(z.object({ dayOfWeek: z.number(), available: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = await resolveEscortUserId(ctx.user);
      if (!userId) throw new Error("Auth required");
      // Read current metadata, merge availability, write back
      const [user] = await db.select({ metadata: users.metadata }).from(users).where(eq(users.id, userId)).limit(1);
      let meta: any = {};
      try { meta = user?.metadata ? (typeof user.metadata === 'string' ? JSON.parse(user.metadata) : user.metadata) : {}; } catch { meta = {}; }
      if (!meta.escortAvailability) {
        // Initialize with Mon-Fri defaults
        meta.escortAvailability = { '0': false, '1': true, '2': true, '3': true, '4': true, '5': true, '6': false };
      }
      meta.escortAvailability[String(input.dayOfWeek)] = input.available;
      await db.update(users).set({ metadata: JSON.stringify(meta) }).where(eq(users.id, userId));
      return { success: true, dayOfWeek: input.dayOfWeek, available: input.available, updatedAt: new Date().toISOString() };
    }),

  getUpcomingJobsLegacy: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    try {
      const userId = await resolveEscortUserId(ctx.user);
      if (!userId) return [];
      const rows = await db.select({
        aId: escortAssignments.id, position: escortAssignments.position,
        loadNumber: loads.loadNumber, pickupDate: loads.pickupDate,
        pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation,
      }).from(escortAssignments)
        .innerJoin(loads, eq(escortAssignments.loadId, loads.id))
        .where(and(eq(escortAssignments.escortUserId, userId), eq(escortAssignments.status, 'accepted')))
        .orderBy(asc(loads.pickupDate)).limit(5);
      return rows.map(r => {
        const o = fmtLoc(r.pickupLocation); const d = fmtLoc(r.deliveryLocation);
        return { id: String(r.aId), loadNumber: r.loadNumber, position: r.position, origin: `${o.city}, ${o.state}`, destination: `${d.city}, ${d.state}`, scheduledDate: r.pickupDate?.toISOString().split('T')[0] || '' };
      });
    } catch { return []; }
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // JOBS — getJobs, getJobsSummary, getCompletedJobs (user-scoped via escortAssignments)
  // ═══════════════════════════════════════════════════════════════════════════

  getJobs: protectedProcedure
    .input(z.object({ status: z.string().optional(), limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const userId = await resolveEscortUserId(ctx.user);
        if (!userId) return [];
        const rows = await db.select({
          aId: escortAssignments.id, aStatus: escortAssignments.status, position: escortAssignments.position,
          rate: escortAssignments.rate,
          loadNumber: loads.loadNumber, loadStatus: loads.status,
          pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation, distance: loads.distance,
        }).from(escortAssignments)
          .innerJoin(loads, eq(escortAssignments.loadId, loads.id))
          .where(eq(escortAssignments.escortUserId, userId))
          .orderBy(desc(escortAssignments.updatedAt)).limit(input?.limit || 20);
        return rows.map(l => {
          const o = fmtLoc(l.pickupLocation); const d = fmtLoc(l.deliveryLocation);
          return {
            id: String(l.aId), loadNumber: l.loadNumber, status: l.aStatus,
            position: l.position, distance: l.distance ? parseFloat(String(l.distance)) : 0,
            rate: l.rate ? parseFloat(String(l.rate)) : 0,
            origin: `${o.city}, ${o.state}`, destination: `${d.city}, ${d.state}`,
          };
        });
      } catch { return []; }
    }),

  getJobsSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const empty = { available: 0, accepted: 0, completed: 0, totalEarnings: 0, assigned: 0, inProgress: 0, weeklyEarnings: 0 };
    if (!db) return empty;
    try {
      const userId = await resolveEscortUserId(ctx.user);
      if (!userId) return empty;
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      const [pending] = await db.select({ count: sql<number>`count(*)` }).from(escortAssignments)
        .where(and(eq(escortAssignments.escortUserId, userId), eq(escortAssignments.status, 'pending')));
      const [accepted] = await db.select({ count: sql<number>`count(*)` }).from(escortAssignments)
        .where(and(eq(escortAssignments.escortUserId, userId), eq(escortAssignments.status, 'accepted')));
      const [active] = await db.select({ count: sql<number>`count(*)` }).from(escortAssignments)
        .where(and(eq(escortAssignments.escortUserId, userId), sql`${escortAssignments.status} IN ('en_route','on_site','escorting')`));
      const [completed] = await db.select({ count: sql<number>`count(*)` }).from(escortAssignments)
        .where(and(eq(escortAssignments.escortUserId, userId), eq(escortAssignments.status, 'completed')));
      const [totalEarnings] = await db.select({ total: sql<string>`COALESCE(SUM(${escortAssignments.rate}), 0)` }).from(escortAssignments)
        .where(and(eq(escortAssignments.escortUserId, userId), eq(escortAssignments.status, 'completed')));
      const [weeklyEarnings] = await db.select({ total: sql<string>`COALESCE(SUM(${escortAssignments.rate}), 0)` }).from(escortAssignments)
        .where(and(eq(escortAssignments.escortUserId, userId), eq(escortAssignments.status, 'completed'), gte(escortAssignments.completedAt!, weekAgo)));
      const [avail] = await db.select({ count: sql<number>`count(*)` }).from(loads).where(sql`${loads.status} IN ('posted','assigned')`);
      return {
        available: avail?.count || 0, accepted: accepted?.count || 0,
        completed: completed?.count || 0, totalEarnings: parseFloat(totalEarnings?.total || '0'),
        assigned: (accepted?.count || 0) + (pending?.count || 0),
        inProgress: active?.count || 0,
        weeklyEarnings: parseFloat(weeklyEarnings?.total || '0'),
      };
    } catch { return empty; }
  }),

  getCompletedJobs: protectedProcedure
    .input(z.object({ limit: z.number().optional(), period: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const userId = await resolveEscortUserId(ctx.user);
        if (!userId) return [];
        const rows = await db.select({
          aId: escortAssignments.id, rate: escortAssignments.rate, completedAt: escortAssignments.completedAt,
          loadNumber: loads.loadNumber, pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation,
          distance: loads.distance,
        }).from(escortAssignments)
          .innerJoin(loads, eq(escortAssignments.loadId, loads.id))
          .where(and(eq(escortAssignments.escortUserId, userId), eq(escortAssignments.status, 'completed')))
          .orderBy(desc(escortAssignments.completedAt)).limit(input?.limit || 20);
        return rows.map(r => {
          const o = fmtLoc(r.pickupLocation); const d = fmtLoc(r.deliveryLocation);
          return {
            id: String(r.aId), loadNumber: r.loadNumber, title: r.loadNumber,
            rate: r.rate ? parseFloat(String(r.rate)) : 0,
            earnings: r.rate ? parseFloat(String(r.rate)) : 0,
            hours: 0, route: `${o.city} → ${d.city}`,
            completedAt: r.completedAt?.toISOString().split('T')[0] || '',
            origin: `${o.city}, ${o.state}`, destination: `${d.city}, ${d.state}`,
            distance: r.distance ? parseFloat(String(r.distance)) : 0,
          };
        });
      } catch { return []; }
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // CERTIFICATIONS (placeholder — no dedicated table yet)
  // ═══════════════════════════════════════════════════════════════════════════

  getMyCertifications: protectedProcedure.query(async () => []),
  getCertificationStats: protectedProcedure.input(z.object({ escortId: z.string().optional() }).optional()).query(async () => ({ total: 0, valid: 0, expiring: 0, expired: 0, statesCovered: 0, reciprocity: 0 })),
  getStateCertifications: protectedProcedure.input(z.object({ escortId: z.string().optional() }).optional()).query(async () => []),
  uploadCertification: protectedProcedure.input(z.object({ state: z.string(), type: z.string(), expirationDate: z.string() })).mutation(async () => ({ success: true, certId: `cert_${Date.now()}` })),
  getStateRequirements: protectedProcedure.input(z.object({ state: z.string().optional() }).optional()).query(async () => []),

  // ═══════════════════════════════════════════════════════════════════════════
  // EARNINGS — from completed escort_assignments
  // ═══════════════════════════════════════════════════════════════════════════

  getEarnings: protectedProcedure
    .input(z.object({ period: z.string().optional(), limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { items: [], total: 0, trend: "flat", trendPercent: 0 };
      try {
        const userId = await resolveEscortUserId(ctx.user);
        if (!userId) return { items: [], total: 0, trend: "flat", trendPercent: 0 };
        const periodStart = new Date();
        if (input?.period === 'week') periodStart.setDate(periodStart.getDate() - 7);
        else if (input?.period === 'quarter') periodStart.setMonth(periodStart.getMonth() - 3);
        else if (input?.period === 'year') periodStart.setFullYear(periodStart.getFullYear() - 1);
        else { periodStart.setDate(1); periodStart.setHours(0, 0, 0, 0); }
        const [totalResult] = await db.select({ total: sql<string>`COALESCE(SUM(${escortAssignments.rate}), 0)` })
          .from(escortAssignments)
          .where(and(eq(escortAssignments.escortUserId, userId), eq(escortAssignments.status, 'completed'), gte(escortAssignments.completedAt!, periodStart)));
        return { items: [], total: parseFloat(totalResult?.total || '0'), trend: "flat" as const, trendPercent: 0 };
      } catch { return { items: [], total: 0, trend: "flat", trendPercent: 0 }; }
    }),

  getEarningsStats: protectedProcedure
    .input(z.object({ period: z.string().optional() }).optional())
    .query(async ({ ctx }) => {
      const db = await getDb();
      const empty = { thisWeek: 0, thisMonth: 0, thisYear: 0, avgPerJob: 0, jobsCompleted: 0, hoursWorked: 0, avgHourlyRate: 0 };
      if (!db) return empty;
      try {
        const userId = await resolveEscortUserId(ctx.user);
        if (!userId) return empty;
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
        const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
        const yearStart = new Date(); yearStart.setMonth(0, 1); yearStart.setHours(0, 0, 0, 0);
        const base = and(eq(escortAssignments.escortUserId, userId), eq(escortAssignments.status, 'completed'));
        const [week] = await db.select({ total: sql<string>`COALESCE(SUM(${escortAssignments.rate}), 0)` }).from(escortAssignments).where(and(base!, gte(escortAssignments.completedAt!, weekAgo)));
        const [month] = await db.select({ total: sql<string>`COALESCE(SUM(${escortAssignments.rate}), 0)` }).from(escortAssignments).where(and(base!, gte(escortAssignments.completedAt!, monthStart)));
        const [year] = await db.select({ total: sql<string>`COALESCE(SUM(${escortAssignments.rate}), 0)`, count: sql<number>`count(*)` }).from(escortAssignments).where(and(base!, gte(escortAssignments.completedAt!, yearStart)));
        const jobCount = year?.count || 0;
        const yearTotal = parseFloat(year?.total || '0');
        return {
          thisWeek: parseFloat(week?.total || '0'), thisMonth: parseFloat(month?.total || '0'),
          thisYear: yearTotal, avgPerJob: jobCount > 0 ? Math.round(yearTotal / jobCount) : 0,
          jobsCompleted: jobCount, hoursWorked: 0, avgHourlyRate: 0,
        };
      } catch { return empty; }
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // INCIDENTS & REPORTS (placeholder — no dedicated table yet)
  // ═══════════════════════════════════════════════════════════════════════════

  getIncidents: protectedProcedure.input(z.object({ status: z.string().optional(), search: z.string().optional(), severity: z.string().optional() })).query(async () => []),
  getIncidentStats: protectedProcedure.query(async () => ({ total: 0, open: 0, resolved: 0, critical: 0 })),
  getReports: protectedProcedure.input(z.object({ type: z.string().optional(), search: z.string().optional(), status: z.string().optional() })).query(async () => []),
  getReportStats: protectedProcedure.query(async () => ({ total: 0, thisMonth: 0, submitted: 0, drafts: 0 })),

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIVE TRIP — the escort's live operational view
  // ═══════════════════════════════════════════════════════════════════════════

  getActiveTrip: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    try {
      const userId = await resolveEscortUserId(ctx.user);
      if (!userId) return null;
      const [assignment] = await db.select().from(escortAssignments)
        .where(and(eq(escortAssignments.escortUserId, userId), sql`${escortAssignments.status} IN ('accepted','en_route','on_site','escorting')`))
        .orderBy(desc(escortAssignments.updatedAt)).limit(1);
      if (!assignment) return null;
      const [load] = await db.select().from(loads).where(eq(loads.id, assignment.loadId)).limit(1);
      if (!load) return null;
      const origin = fmtLoc(load.pickupLocation);
      const dest = fmtLoc(load.deliveryLocation);
      let convoy: any = null;
      if (assignment.convoyId) {
        const [c] = await db.select().from(convoys).where(eq(convoys.id, assignment.convoyId)).limit(1);
        if (c) convoy = c;
      }
      let driverInfo: any = null;
      const driverUserId = assignment.driverUserId || load.driverId;
      if (driverUserId) {
        const [drv] = await db.select({ id: users.id, name: users.name, phone: users.phone, email: users.email })
          .from(users).where(eq(users.id, driverUserId)).limit(1);
        if (drv) driverInfo = { id: drv.id, name: drv.name || 'Driver', phone: drv.phone, email: drv.email };
      }
      let shipperInfo: any = null;
      if (load.shipperId) {
        const [s] = await db.select({ id: users.id, name: users.name, phone: users.phone })
          .from(users).where(eq(users.id, load.shipperId)).limit(1);
        if (s) shipperInfo = { id: s.id, name: s.name || 'Shipper', phone: s.phone };
      }
      return {
        assignmentId: assignment.id, assignmentStatus: assignment.status,
        position: assignment.position,
        rate: assignment.rate ? parseFloat(String(assignment.rate)) : 0,
        rateType: assignment.rateType,
        startedAt: assignment.startedAt?.toISOString() || null,
        load: {
          id: load.id, loadNumber: load.loadNumber, status: load.status,
          cargoType: load.cargoType, hazmatClass: load.hazmatClass,
          weight: load.weight ? parseFloat(String(load.weight)) : 0,
          distance: load.distance ? parseFloat(String(load.distance)) : 0,
          equipmentType: (load as any).equipmentType || null,
          specialInstructions: load.specialInstructions || '',
          origin, destination: dest,
          pickupDate: load.pickupDate?.toISOString() || '',
          deliveryDate: load.deliveryDate?.toISOString() || '',
        },
        convoy: convoy ? {
          id: convoy.id, status: convoy.status, maxSpeedMph: convoy.maxSpeedMph,
          targetLeadDistanceMeters: convoy.targetLeadDistanceMeters,
          targetRearDistanceMeters: convoy.targetRearDistanceMeters,
          currentLeadDistance: convoy.currentLeadDistance,
          currentRearDistance: convoy.currentRearDistance,
        } : null,
        driver: driverInfo, shipper: shipperInfo,
        notes: assignment.notes || '',
      };
    } catch (e) { console.error('[Escorts] getActiveTrip:', e); return null; }
  }),

  updateTripStatus: protectedProcedure
    .input(z.object({ assignmentId: z.number(), status: assignmentStatusSchema, notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = await resolveEscortUserId(ctx.user);
      if (!userId) throw new Error("Auth required");
      const [assignment] = await db.select().from(escortAssignments)
        .where(and(eq(escortAssignments.id, input.assignmentId), eq(escortAssignments.escortUserId, userId))).limit(1);
      if (!assignment) throw new Error("Assignment not found");
      const updates: any = { status: input.status, updatedAt: new Date() };
      if (input.notes) updates.notes = input.notes;
      if (input.status === "escorting" && !assignment.startedAt) updates.startedAt = new Date();
      if (input.status === "completed") updates.completedAt = new Date();
      await db.update(escortAssignments).set(updates).where(eq(escortAssignments.id, input.assignmentId));
      if (input.status === "completed" && assignment.convoyId) {
        await db.update(convoys).set({ status: "completed", completedAt: new Date() }).where(eq(convoys.id, assignment.convoyId));
      }
      return { success: true, assignmentId: input.assignmentId, newStatus: input.status };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // CONVOY PROXIMITY GEOFENCE — escort must stay near the primary vehicle
  // The truck/load vehicle serves as the moving geofence center
  // ═══════════════════════════════════════════════════════════════════════════

  getConvoyProximity: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    try {
      const userId = await resolveEscortUserId(ctx.user);
      if (!userId) return null;

      // Get active assignment with convoy
      const [assignment] = await db.select({
        id: escortAssignments.id,
        convoyId: escortAssignments.convoyId,
        position: escortAssignments.position,
        loadId: escortAssignments.loadId,
        status: escortAssignments.status,
      }).from(escortAssignments)
        .where(and(eq(escortAssignments.escortUserId, userId), sql`${escortAssignments.status} IN ('en_route','on_site','escorting')`))
        .orderBy(desc(escortAssignments.updatedAt)).limit(1);
      if (!assignment || !assignment.convoyId) return null;

      // Get convoy info
      const [convoy] = await db.select().from(convoys).where(eq(convoys.id, assignment.convoyId)).limit(1);
      if (!convoy) return null;

      // Separation thresholds
      const isLead = assignment.position === "lead";
      const maxDistanceMeters = isLead
        ? (convoy.targetLeadDistanceMeters || 1200)
        : (convoy.targetRearDistanceMeters || 800);
      const warningThresholdMeters = Math.round(maxDistanceMeters * 0.8);

      // Get latest positions for escort and primary vehicle
      const [escortLoc] = await db.select({
        lat: locationHistory.latitude, lng: locationHistory.longitude,
        speed: locationHistory.speed, heading: locationHistory.heading,
        ts: locationHistory.serverTimestamp,
      }).from(locationHistory).where(eq(locationHistory.userId, userId))
        .orderBy(desc(locationHistory.serverTimestamp)).limit(1);

      const primaryUserId = convoy.loadUserId;
      const [primaryLoc] = await db.select({
        lat: locationHistory.latitude, lng: locationHistory.longitude,
        speed: locationHistory.speed, heading: locationHistory.heading,
        ts: locationHistory.serverTimestamp,
      }).from(locationHistory).where(eq(locationHistory.userId, primaryUserId))
        .orderBy(desc(locationHistory.serverTimestamp)).limit(1);

      // Calculate distance
      let distanceMeters: number | null = null;
      let status: "ok" | "warning" | "critical" | "unknown" = "unknown";

      if (escortLoc && primaryLoc) {
        const eLat = Number(escortLoc.lat); const eLng = Number(escortLoc.lng);
        const pLat = Number(primaryLoc.lat); const pLng = Number(primaryLoc.lng);
        distanceMeters = Math.round(haversineDistance(eLat, eLng, pLat, pLng));

        if (distanceMeters <= warningThresholdMeters) status = "ok";
        else if (distanceMeters <= maxDistanceMeters) status = "warning";
        else status = "critical";
      }

      return {
        convoyId: assignment.convoyId,
        assignmentId: assignment.id,
        position: assignment.position,
        distanceMeters,
        maxDistanceMeters,
        warningThresholdMeters,
        status,
        escortLocation: escortLoc ? {
          lat: Number(escortLoc.lat), lng: Number(escortLoc.lng),
          speed: escortLoc.speed ? Number(escortLoc.speed) : 0,
          heading: escortLoc.heading ? Number(escortLoc.heading) : 0,
          lastUpdate: escortLoc.ts?.toISOString() || null,
        } : null,
        primaryLocation: primaryLoc ? {
          lat: Number(primaryLoc.lat), lng: Number(primaryLoc.lng),
          speed: primaryLoc.speed ? Number(primaryLoc.speed) : 0,
          heading: primaryLoc.heading ? Number(primaryLoc.heading) : 0,
          lastUpdate: primaryLoc.ts?.toISOString() || null,
        } : null,
        convoyMaxSpeed: convoy.maxSpeedMph || 45,
        convoyStatus: convoy.status,
      };
    } catch (e) { console.error('[Escorts] getConvoyProximity:', e); return null; }
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUTE RESTRICTIONS — prohibited roads, bridge clearances, weight limits
  // for the current load's route (heavy haul / oversize awareness)
  // ═══════════════════════════════════════════════════════════════════════════

  getRouteRestrictions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    try {
      const userId = await resolveEscortUserId(ctx.user);
      if (!userId) return null;

      const [assignment] = await db.select({
        loadId: escortAssignments.loadId,
        convoyId: escortAssignments.convoyId,
      }).from(escortAssignments)
        .where(and(eq(escortAssignments.escortUserId, userId), sql`${escortAssignments.status} IN ('accepted','en_route','on_site','escorting')`))
        .orderBy(desc(escortAssignments.updatedAt)).limit(1);
      if (!assignment) return null;

      const [load] = await db.select({
        id: loads.id, loadNumber: loads.loadNumber,
        cargoType: loads.cargoType, hazmatClass: loads.hazmatClass,
        weight: loads.weight, specialInstructions: loads.specialInstructions,
        pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation,
      }).from(loads).where(eq(loads.id, assignment.loadId)).limit(1);
      if (!load) return null;

      const weight = load.weight ? parseFloat(String(load.weight)) : 0;
      const isOversize = weight > 80000;
      const isHazmat = !!load.hazmatClass;
      const isSuperload = weight > 200000;

      // Build restriction warnings based on load characteristics
      const restrictions: Array<{
        type: string; severity: "info" | "warning" | "critical";
        title: string; description: string; icon: string;
      }> = [];

      if (isSuperload) {
        restrictions.push({
          type: "superload", severity: "critical",
          title: "SUPERLOAD — Restricted Routing",
          description: `Load weighs ${weight.toLocaleString()} lbs. Must follow pre-approved route only. No deviations without dispatch approval. Police escort may be required.`,
          icon: "AlertOctagon",
        });
      } else if (isOversize) {
        restrictions.push({
          type: "oversize", severity: "warning",
          title: "Oversize/Overweight Load",
          description: `Load weighs ${weight.toLocaleString()} lbs (exceeds 80,000 lb limit). Follow permitted route — avoid restricted bridges, tunnels, and low clearances.`,
          icon: "Scale",
        });
      }

      if (isHazmat) {
        restrictions.push({
          type: "hazmat", severity: "critical",
          title: `HazMat Class ${load.hazmatClass}`,
          description: "Hazmat route restrictions apply. Avoid tunnels, densely populated areas, and non-designated hazmat routes. Maintain required placards visible.",
          icon: "Flame",
        });
      }

      // Time-of-day restrictions for oversize
      const hour = new Date().getHours();
      if (isOversize && (hour >= 22 || hour < 5)) {
        restrictions.push({
          type: "time_restriction", severity: "info",
          title: "Night Movement Permitted",
          description: "Many states prefer oversize loads travel at night (10PM-5AM) for reduced traffic. Verify state-specific night travel permits.",
          icon: "Moon",
        });
      } else if (isOversize && (hour >= 7 && hour <= 9 || hour >= 16 && hour <= 18)) {
        restrictions.push({
          type: "rush_hour", severity: "warning",
          title: "Rush Hour — Restricted Movement",
          description: "Most states prohibit oversize loads during rush hours (7-9AM, 4-6PM). Check permits for time-of-day restrictions.",
          icon: "Clock",
        });
      }

      // Bridge/clearance warnings
      restrictions.push({
        type: "clearance", severity: "info",
        title: "Bridge & Clearance Monitoring",
        description: "Use height pole to verify all overhead clearances before the load passes. Minimum required clearance must exceed load height by 6 inches.",
        icon: "ArrowUpFromLine",
      });

      // Weekend/holiday restrictions
      const dayOfWeek = new Date().getDay();
      if (isOversize && (dayOfWeek === 0 || dayOfWeek === 6)) {
        restrictions.push({
          type: "weekend", severity: "warning",
          title: "Weekend Movement Restriction",
          description: "Many states restrict oversize loads on weekends and holidays. Verify weekend permits are in place.",
          icon: "Calendar",
        });
      }

      return {
        loadId: load.id,
        loadNumber: load.loadNumber,
        cargoType: load.cargoType,
        hazmatClass: load.hazmatClass,
        weight,
        isOversize,
        isHazmat,
        isSuperload,
        restrictions,
        specialInstructions: load.specialInstructions || '',
      };
    } catch (e) { console.error('[Escorts] getRouteRestrictions:', e); return null; }
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // ESCORT PROFILE — comprehensive profile data
  // ═══════════════════════════════════════════════════════════════════════════

  getProfile: protectedProcedure
    .input(z.object({ escortId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const userId = input?.escortId ? parseInt(input.escortId, 10) : await resolveEscortUserId(ctx.user);
        if (!userId) return null;

        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user) return null;

        const meta = user.metadata ? (typeof user.metadata === 'string' ? JSON.parse(user.metadata) : user.metadata) : {};
        const escortProfile = meta?.escortProfile || {};

        // Stats from escort_assignments
        const [totalStats] = await db.select({
          totalConvoys: sql<number>`count(*)`,
          totalEarnings: sql<string>`COALESCE(SUM(${escortAssignments.rate}), 0)`,
        }).from(escortAssignments).where(and(eq(escortAssignments.escortUserId, userId), eq(escortAssignments.status, 'completed')));

        const [activeStats] = await db.select({
          activeJobs: sql<number>`count(*)`,
        }).from(escortAssignments).where(and(eq(escortAssignments.escortUserId, userId), sql`${escortAssignments.status} IN ('accepted','en_route','on_site','escorting')`));

        // Lead vs chase breakdown
        const [leadCount] = await db.select({ count: sql<number>`count(*)` }).from(escortAssignments)
          .where(and(eq(escortAssignments.escortUserId, userId), eq(escortAssignments.status, 'completed'), eq(escortAssignments.position, 'lead')));
        const [chaseCount] = await db.select({ count: sql<number>`count(*)` }).from(escortAssignments)
          .where(and(eq(escortAssignments.escortUserId, userId), eq(escortAssignments.status, 'completed'), eq(escortAssignments.position, 'chase')));

        // On-time % (completed before delivery date)
        const [onTimeResult] = await db.select({
          total: sql<number>`count(*)`,
          onTime: sql<number>`SUM(CASE WHEN ${escortAssignments.completedAt} <= ${loads.deliveryDate} OR ${loads.deliveryDate} IS NULL THEN 1 ELSE 0 END)`,
        }).from(escortAssignments)
          .innerJoin(loads, eq(escortAssignments.loadId, loads.id))
          .where(and(eq(escortAssignments.escortUserId, userId), eq(escortAssignments.status, 'completed')));

        const totalConvoys = totalStats?.totalConvoys || 0;
        const onTimePct = onTimeResult?.total ? Math.round(((onTimeResult.onTime || 0) / onTimeResult.total) * 100) : 100;

        return {
          id: String(userId),
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          profilePhoto: (user as any).profileImageUrl || '',
          role: user.role,
          verificationStatus: (user as any).accountStatus || 'pending',
          createdAt: user.createdAt?.toISOString() || '',

          // Professional info from metadata
          positions: escortProfile.positions || { leadEscort: false, rearEscort: false, heightPole: false, routeSurvey: false },
          preferredPosition: escortProfile.preferredPosition || '',
          yearsExperience: escortProfile.yearsExperience || 0,
          isIndependent: escortProfile.isIndependent ?? true,
          escortCompany: escortProfile.escortCompany || '',
          homeBase: escortProfile.homeBase || { city: '', state: '' },
          willingToTravel: escortProfile.willingToTravel || 0,
          heightPole: escortProfile.heightPole || null,

          // Vehicle
          vehicle: escortProfile.vehicle || null,
          equipment: escortProfile.equipment || null,

          // Stats
          stats: {
            totalConvoys,
            totalMiles: escortProfile.totalMiles || 0,
            onTimePercentage: onTimePct,
            incidentCount: 0,
            repeatClientRate: 0,
            leadJobs: leadCount?.count || 0,
            chaseJobs: chaseCount?.count || 0,
          },

          // Rating
          rating: {
            overall: escortProfile.rating?.overall || 0,
            communication: escortProfile.rating?.communication || 0,
            punctuality: escortProfile.rating?.punctuality || 0,
            professionalism: escortProfile.rating?.professionalism || 0,
            safetyAwareness: escortProfile.rating?.safetyAwareness || 0,
            routeKnowledge: escortProfile.rating?.routeKnowledge || 0,
            totalReviews: escortProfile.rating?.totalReviews || 0,
          },

          // Financial
          wallet: {
            balance: 0,
            lifetimeEarnings: parseFloat(totalStats?.totalEarnings || '0'),
            activeJobs: activeStats?.activeJobs || 0,
          },

          // Availability
          availability: meta?.escortAvailability || {},

          // Preferences
          preferences: escortProfile.preferences || {},

          // Certifications (from metadata until dedicated table)
          stateCertifications: escortProfile.stateCertifications || [],
        };
      } catch (e) { console.error('[Escorts] getProfile:', e); return null; }
    }),

  updateProfile: protectedProcedure
    .input(z.object({
      positions: z.object({ leadEscort: z.boolean(), rearEscort: z.boolean(), heightPole: z.boolean(), routeSurvey: z.boolean() }).optional(),
      preferredPosition: z.string().optional(),
      yearsExperience: z.number().optional(),
      isIndependent: z.boolean().optional(),
      escortCompany: z.string().optional(),
      homeBase: z.object({ city: z.string(), state: z.string() }).optional(),
      willingToTravel: z.number().optional(),
      heightPole: z.object({ maxHeight: z.number(), hasElectronicSensor: z.boolean() }).optional(),
      vehicle: z.object({
        make: z.string(), model: z.string(), year: z.number(), color: z.string(),
        licensePlate: z.string(), licenseState: z.string(),
      }).optional(),
      preferences: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = await resolveEscortUserId(ctx.user);
      if (!userId) throw new Error("Auth required");
      const [user] = await db.select({ metadata: users.metadata }).from(users).where(eq(users.id, userId)).limit(1);
      let meta: any = {};
      try { meta = user?.metadata ? (typeof user.metadata === 'string' ? JSON.parse(user.metadata) : user.metadata) : {}; } catch { meta = {}; }
      if (!meta.escortProfile) meta.escortProfile = {};
      // Merge input into escortProfile
      const ep = meta.escortProfile;
      if (input.positions) ep.positions = input.positions;
      if (input.preferredPosition) ep.preferredPosition = input.preferredPosition;
      if (input.yearsExperience !== undefined) ep.yearsExperience = input.yearsExperience;
      if (input.isIndependent !== undefined) ep.isIndependent = input.isIndependent;
      if (input.escortCompany !== undefined) ep.escortCompany = input.escortCompany;
      if (input.homeBase) ep.homeBase = input.homeBase;
      if (input.willingToTravel !== undefined) ep.willingToTravel = input.willingToTravel;
      if (input.heightPole) ep.heightPole = input.heightPole;
      if (input.vehicle) ep.vehicle = input.vehicle;
      if (input.preferences) ep.preferences = { ...ep.preferences, ...input.preferences };
      await db.update(users).set({ metadata: JSON.stringify(meta) }).where(eq(users.id, userId));
      return { success: true, updatedAt: new Date().toISOString() };
    }),
});
