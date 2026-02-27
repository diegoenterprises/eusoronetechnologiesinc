/**
 * CONVOY ROUTER - Multi-vehicle coordination for oversize loads
 */

import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { convoys, locationHistory, users, escortAssignments, loads } from "../../drizzle/schema";
import { emitConvoyFormed, emitConvoyUpdate, emitEscortJobAssigned, emitEscortJobStarted, emitEscortJobCompleted } from "../_core/websocket";

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

    // Auto-create escort assignments for lead/rear users linked to this convoy
    const [load] = await db.select({ driverId: loads.driverId, catalystId: loads.catalystId })
      .from(loads).where(eq(loads.id, input.loadId)).limit(1);

    // Lead escort assignment (always present)
    const [existingLead] = await db.select({ id: escortAssignments.id })
      .from(escortAssignments)
      .where(and(
        eq(escortAssignments.loadId, input.loadId),
        eq(escortAssignments.escortUserId, input.leadUserId),
      )).limit(1);
    if (existingLead) {
      await db.update(escortAssignments)
        .set({ convoyId: convoy.id, position: "lead" })
        .where(eq(escortAssignments.id, existingLead.id));
    } else {
      await db.insert(escortAssignments).values({
        loadId: input.loadId,
        escortUserId: input.leadUserId,
        convoyId: convoy.id,
        position: "lead",
        status: "accepted",
        driverUserId: load?.driverId || null,
        carrierUserId: load?.catalystId || null,
      });
    }

    // Rear escort assignment (if present)
    if (input.rearUserId) {
      const [existingRear] = await db.select({ id: escortAssignments.id })
        .from(escortAssignments)
        .where(and(
          eq(escortAssignments.loadId, input.loadId),
          eq(escortAssignments.escortUserId, input.rearUserId),
        )).limit(1);
      if (existingRear) {
        await db.update(escortAssignments)
          .set({ convoyId: convoy.id, position: "chase" })
          .where(eq(escortAssignments.id, existingRear.id));
      } else {
        await db.insert(escortAssignments).values({
          loadId: input.loadId,
          escortUserId: input.rearUserId,
          convoyId: convoy.id,
          position: "chase",
          status: "accepted",
          driverUserId: load?.driverId || null,
          carrierUserId: load?.catalystId || null,
        });
      }
    }

    // Emit convoy formed event
    emitConvoyFormed({
      convoyId: convoy.id,
      loadId: input.loadId,
      status: "forming",
      leadUserId: input.leadUserId,
      rearUserId: input.rearUserId,
      loadUserId: input.loadUserId,
      timestamp: new Date().toISOString(),
    });

    // Emit escort assignment events for lead
    emitEscortJobAssigned({
      assignmentId: 0,
      loadId: input.loadId,
      escortUserId: input.leadUserId,
      position: "lead",
      status: "accepted",
      convoyId: convoy.id,
      driverUserId: load?.driverId || undefined,
      carrierUserId: load?.catalystId || undefined,
      timestamp: new Date().toISOString(),
    });

    // Emit escort assignment event for rear if present
    if (input.rearUserId) {
      emitEscortJobAssigned({
        assignmentId: 0,
        loadId: input.loadId,
        escortUserId: input.rearUserId,
        position: "chase",
        status: "accepted",
        convoyId: convoy.id,
        driverUserId: load?.driverId || undefined,
        carrierUserId: load?.catalystId || undefined,
        timestamp: new Date().toISOString(),
      });
    }

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

    // Fetch convoy info before update for event payloads
    const [convoy] = await db.select({
      loadId: convoys.loadId,
      leadUserId: convoys.leadUserId,
      rearUserId: convoys.rearUserId,
      loadUserId: convoys.loadUserId,
      status: convoys.status,
    }).from(convoys).where(eq(convoys.id, input.convoyId)).limit(1);
    if (!convoy) throw new Error("Convoy not found");
    const previousStatus = convoy.status;

    const updates: Record<string, unknown> = { status: input.status };
    if (input.status === "active") updates.startedAt = new Date();
    if (input.status === "completed" || input.status === "disbanded") updates.completedAt = new Date();

    await db.update(convoys).set(updates).where(eq(convoys.id, input.convoyId));

    // Sync escort assignment statuses with convoy status
    // Fetch linked assignments for event emission
    const linkedAssignments = await db.select({
      id: escortAssignments.id,
      escortUserId: escortAssignments.escortUserId,
      loadId: escortAssignments.loadId,
      position: escortAssignments.position,
      driverUserId: escortAssignments.driverUserId,
      carrierUserId: escortAssignments.carrierUserId,
    }).from(escortAssignments).where(eq(escortAssignments.convoyId, input.convoyId));

    if (input.status === "active") {
      await db.update(escortAssignments)
        .set({ status: "escorting", startedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(escortAssignments.convoyId, input.convoyId), eq(escortAssignments.status, "accepted")));

      // Emit escort job started for each linked assignment
      for (const a of linkedAssignments) {
        emitEscortJobStarted({
          assignmentId: a.id,
          loadId: a.loadId,
          escortUserId: a.escortUserId,
          position: (a.position as "lead" | "chase" | "both") || "lead",
          status: "escorting",
          previousStatus: "accepted",
          convoyId: input.convoyId,
          driverUserId: a.driverUserId || undefined,
          carrierUserId: a.carrierUserId || undefined,
          timestamp: new Date().toISOString(),
        });
      }
    } else if (input.status === "completed") {
      await db.update(escortAssignments)
        .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(escortAssignments.convoyId, input.convoyId), eq(escortAssignments.status, "escorting")));

      for (const a of linkedAssignments) {
        emitEscortJobCompleted({
          assignmentId: a.id,
          loadId: a.loadId,
          escortUserId: a.escortUserId,
          position: (a.position as "lead" | "chase" | "both") || "lead",
          status: "completed",
          previousStatus: "escorting",
          convoyId: input.convoyId,
          driverUserId: a.driverUserId || undefined,
          carrierUserId: a.carrierUserId || undefined,
          timestamp: new Date().toISOString(),
        });
      }
    } else if (input.status === "disbanded") {
      await db.update(escortAssignments)
        .set({ status: "cancelled", updatedAt: new Date(), notes: "Convoy disbanded" })
        .where(and(eq(escortAssignments.convoyId, input.convoyId), eq(escortAssignments.status, "escorting")));
    }

    // Emit convoy status update
    emitConvoyUpdate({
      convoyId: input.convoyId,
      loadId: convoy.loadId,
      status: input.status,
      previousStatus,
      leadUserId: convoy.leadUserId,
      rearUserId: convoy.rearUserId || undefined,
      loadUserId: convoy.loadUserId,
      timestamp: new Date().toISOString(),
    });

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
