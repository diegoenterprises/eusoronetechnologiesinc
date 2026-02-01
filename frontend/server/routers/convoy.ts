/**
 * CONVOY ROUTER - Multi-vehicle coordination for oversize loads
 */

import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { convoys, locationHistory, users } from "../../drizzle/schema";

export const convoyRouter = router({
  // Create a convoy
  createConvoy: protectedProcedure.input(z.object({
    loadId: z.number(),
    routeId: z.number().optional(),
    leadUserId: z.number(),
    loadUserId: z.number(),
    rearUserId: z.number().optional(),
    targetLeadDistanceMeters: z.number().default(800),
    targetRearDistanceMeters: z.number().default(500),
    maxSpeedMph: z.number().default(45),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const [convoy] = await db.insert(convoys).values({
      loadId: input.loadId,
      routeId: input.routeId,
      leadUserId: input.leadUserId,
      loadUserId: input.loadUserId,
      rearUserId: input.rearUserId,
      status: "forming",
      targetLeadDistanceMeters: input.targetLeadDistanceMeters,
      targetRearDistanceMeters: input.targetRearDistanceMeters,
      maxSpeedMph: input.maxSpeedMph,
    }).$returningId();

    return { success: true, convoyId: convoy.id };
  }),

  // Get convoy details
  getConvoy: protectedProcedure.input(z.object({ convoyId: z.number().optional(), loadId: z.number().optional() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;

    let convoy;
    if (input.convoyId) {
      [convoy] = await db.select().from(convoys).where(eq(convoys.id, input.convoyId)).limit(1);
    } else if (input.loadId) {
      [convoy] = await db.select().from(convoys).where(eq(convoys.loadId, input.loadId)).orderBy(desc(convoys.createdAt)).limit(1);
    }

    if (!convoy) return null;

    // Get user names
    const [lead] = await db.select({ name: users.name }).from(users).where(eq(users.id, convoy.leadUserId)).limit(1);
    const [load] = await db.select({ name: users.name }).from(users).where(eq(users.id, convoy.loadUserId)).limit(1);
    let rear = null;
    if (convoy.rearUserId) {
      [rear] = await db.select({ name: users.name }).from(users).where(eq(users.id, convoy.rearUserId)).limit(1);
    }

    return {
      id: convoy.id,
      loadId: convoy.loadId,
      status: convoy.status,
      lead: { userId: convoy.leadUserId, name: lead?.name || "Lead Escort" },
      loadVehicle: { userId: convoy.loadUserId, name: load?.name || "Load Driver" },
      rear: rear ? { userId: convoy.rearUserId, name: rear.name || "Rear Escort" } : null,
      targetLeadDistance: convoy.targetLeadDistanceMeters,
      targetRearDistance: convoy.targetRearDistanceMeters,
      currentLeadDistance: convoy.currentLeadDistance,
      currentRearDistance: convoy.currentRearDistance,
      maxSpeedMph: convoy.maxSpeedMph,
      startedAt: convoy.startedAt?.toISOString(),
    };
  }),

  // Get convoy positions (real-time locations of all vehicles)
  getConvoyPositions: protectedProcedure.input(z.object({ convoyId: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;

    const [convoy] = await db.select().from(convoys).where(eq(convoys.id, input.convoyId)).limit(1);
    if (!convoy) return null;

    const userIds = [convoy.leadUserId, convoy.loadUserId];
    if (convoy.rearUserId) userIds.push(convoy.rearUserId);

    const positions = [];
    for (const userId of userIds) {
      const [loc] = await db.select().from(locationHistory).where(eq(locationHistory.userId, userId)).orderBy(desc(locationHistory.serverTimestamp)).limit(1);
      if (loc) {
        const role = userId === convoy.leadUserId ? "lead" : userId === convoy.loadUserId ? "load" : "rear";
        positions.push({
          userId,
          role,
          lat: Number(loc.latitude),
          lng: Number(loc.longitude),
          speed: loc.speed ? Number(loc.speed) : 0,
          heading: loc.heading ? Number(loc.heading) : 0,
          timestamp: loc.serverTimestamp?.toISOString(),
        });
      }
    }

    // Calculate distances between vehicles
    let leadDistance = null;
    let rearDistance = null;
    const leadPos = positions.find(p => p.role === "lead");
    const loadPos = positions.find(p => p.role === "load");
    const rearPos = positions.find(p => p.role === "rear");

    if (leadPos && loadPos) {
      leadDistance = calculateDistance(leadPos.lat, leadPos.lng, loadPos.lat, loadPos.lng);
    }
    if (loadPos && rearPos) {
      rearDistance = calculateDistance(loadPos.lat, loadPos.lng, rearPos.lat, rearPos.lng);
    }

    return { convoyId: input.convoyId, positions, leadDistance, rearDistance, status: convoy.status };
  }),

  // Update convoy status
  updateConvoyStatus: protectedProcedure.input(z.object({ convoyId: z.number(), status: z.enum(["forming", "active", "paused", "completed", "disbanded"]) })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const updates: Record<string, unknown> = { status: input.status };
    if (input.status === "active") updates.startedAt = new Date();
    if (input.status === "completed" || input.status === "disbanded") updates.completedAt = new Date();

    await db.update(convoys).set(updates).where(eq(convoys.id, input.convoyId));
    return { success: true };
  }),

  // Update convoy distances (called periodically with position updates)
  updateDistances: protectedProcedure.input(z.object({ convoyId: z.number(), leadDistance: z.number().optional(), rearDistance: z.number().optional() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    await db.update(convoys).set({
      currentLeadDistance: input.leadDistance,
      currentRearDistance: input.rearDistance,
      lastPositionUpdate: new Date(),
    }).where(eq(convoys.id, input.convoyId));

    return { success: true };
  }),

  // Get active convoys for a company/fleet
  getActiveConvoys: protectedProcedure.input(z.object({ limit: z.number().default(20) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];

    const activeConvoys = await db.select().from(convoys).where(eq(convoys.status, "active")).orderBy(desc(convoys.startedAt)).limit(input.limit);

    return activeConvoys.map(c => ({
      id: c.id,
      loadId: c.loadId,
      status: c.status,
      leadUserId: c.leadUserId,
      loadUserId: c.loadUserId,
      rearUserId: c.rearUserId,
      currentLeadDistance: c.currentLeadDistance,
      currentRearDistance: c.currentRearDistance,
      startedAt: c.startedAt?.toISOString(),
    }));
  }),
});

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
