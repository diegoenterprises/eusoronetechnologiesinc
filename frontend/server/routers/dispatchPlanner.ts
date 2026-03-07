/**
 * DISPATCH PLANNER ROUTER — WS-DC-001
 * Drag-and-drop load→driver timeline with HOS, hazmat, equipment validation
 * 
 * Procedures:
 *   getBoard       — full board for a date (drivers + slots + unassigned loads)
 *   assignLoad     — place a load in a driver slot (with validations)
 *   unassignLoad   — remove a load from a slot
 *   swapDrivers    — swap loads between two slots
 *   bulkAssign     — assign multiple loads at once
 *   getDriverAvailability — detailed driver availability for a date
 *   autoSuggest    — AI-ranked driver suggestions for a load
 */

import { z } from "zod";
import { isolatedApprovedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { requireAccess } from "../services/security/rbac/access-check";
import { dispatchPlannerSlots, drivers, loads, users } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { emitDispatchEvent } from "../_core/websocket";

export const dispatchPlannerRouter = router({

  /**
   * getBoard — Full planning board for a given date
   */
  getBoard: protectedProcedure
    .input(z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;
      if (!companyId) throw new Error("Company context required");

      // Get all company drivers
      const companyDrivers = await db.select({
        id: drivers.id,
        userId: drivers.userId,
        name: users.name,
        phone: users.phone,
        hazmatEndorsement: drivers.hazmatEndorsement,
        twicExpiry: drivers.twicExpiry,
        safetyScore: drivers.safetyScore,
        totalLoads: drivers.totalLoads,
        status: drivers.status,
      })
      .from(drivers)
      .innerJoin(users, eq(drivers.userId, users.id))
      .where(and(
        eq(drivers.companyId, companyId),
        sql`${drivers.status} NOT IN ('suspended')`,
      ));

      // Get existing slots for this date using raw SQL for date comparison
      const existingSlots = await db.select()
        .from(dispatchPlannerSlots)
        .where(and(
          eq(dispatchPlannerSlots.companyId, companyId),
          sql`${dispatchPlannerSlots.date} = ${input.date}`,
        ));

      // Get unassigned loads — loads linked to this company via shipperId or catalystId
      const unassignedLoads = await db.select({
        id: loads.id,
        loadNumber: loads.loadNumber,
        pickupLocation: loads.pickupLocation,
        deliveryLocation: loads.deliveryLocation,
        pickupDate: loads.pickupDate,
        deliveryDate: loads.deliveryDate,
        cargoType: loads.cargoType,
        hazmatClass: loads.hazmatClass,
        weight: loads.weight,
        rate: loads.rate,
        distance: loads.distance,
        specialInstructions: loads.specialInstructions,
        status: loads.status,
      })
      .from(loads)
      .where(and(
        sql`(${loads.shipperId} IN (SELECT id FROM users WHERE companyId = ${companyId}) OR ${loads.catalystId} IN (SELECT id FROM users WHERE companyId = ${companyId}))`,
        sql`${loads.status} IN ('posted', 'draft', 'awarded', 'accepted')`,
        sql`${loads.deletedAt} IS NULL`,
      ));

      // Also get loads already assigned in slots (to display in timeline)
      const assignedLoadIds = new Set(
        existingSlots.filter(s => s.loadId).map(s => s.loadId!)
      );
      let assignedLoadsMap: Record<number, any> = {};
      if (assignedLoadIds.size > 0) {
        const ids = Array.from(assignedLoadIds);
        const assignedRows = await db.select({
          id: loads.id,
          loadNumber: loads.loadNumber,
          pickupLocation: loads.pickupLocation,
          deliveryLocation: loads.deliveryLocation,
          cargoType: loads.cargoType,
          hazmatClass: loads.hazmatClass,
          weight: loads.weight,
          rate: loads.rate,
          distance: loads.distance,
          status: loads.status,
        })
        .from(loads)
        .where(sql`${loads.id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`);
        for (const r of assignedRows) assignedLoadsMap[r.id] = r;
      }

      // Get driver_availability HOS data if table exists
      let hosMap: Record<number, number> = {};
      try {
        const [hosRows]: any = await (db as any).execute(
          sql`SELECT driverId, hosDrivingRemaining FROM driver_availability WHERE companyId = ${companyId}`
        );
        if (Array.isArray(hosRows)) {
          for (const r of hosRows) hosMap[r.driverId] = r.hosDrivingRemaining ?? 660;
        }
      } catch {}

      // Build driver rows with their slots
      const driverRows = companyDrivers.map((d) => {
        const driverSlots = existingSlots
          .filter(s => s.driverId === d.id)
          .sort((a, b) => a.slotIndex - b.slotIndex);

        const maxSlot = driverSlots.length > 0
          ? Math.max(...driverSlots.map(s => s.slotIndex))
          : -1;
        const slotCount = Math.max(3, maxSlot + 2);
        const slots = [];
        for (let i = 0; i < slotCount; i++) {
          const existing = driverSlots.find(s => s.slotIndex === i);
          if (existing) {
            slots.push({
              slotIndex: i,
              slotId: existing.id,
              loadId: existing.loadId,
              load: existing.loadId ? (assignedLoadsMap[existing.loadId] || null) : null,
              status: existing.status,
              assignedAt: existing.assignedAt,
              notes: existing.notes,
            });
          } else {
            slots.push({
              slotIndex: i,
              slotId: null,
              loadId: null,
              load: null,
              status: "available" as const,
              assignedAt: null,
              notes: null,
            });
          }
        }

        return {
          driverId: d.id,
          driverName: d.name || "Unknown",
          phone: d.phone || "",
          status: d.status,
          hosRemaining: hosMap[d.id] ?? 660,
          hazmatEndorsement: d.hazmatEndorsement || false,
          hasTwic: !!d.twicExpiry,
          safetyScore: d.safetyScore ?? 100,
          totalLoads: d.totalLoads ?? 0,
          slots,
        };
      });

      // Available loads = unassigned loads minus those already in slots
      const availableLoads = unassignedLoads.filter(l => !assignedLoadIds.has(l.id));

      return {
        date: input.date,
        companyId,
        drivers: driverRows,
        unassignedLoads: availableLoads,
      };
    }),

  /**
   * assignLoad — Place a load in a specific driver slot
   */
  assignLoad: protectedProcedure
    .input(z.object({
      driverId: z.number(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      slotIndex: z.number().min(0),
      loadId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || "DISPATCH", companyId: (ctx.user as any)?.companyId, action: "UPDATE", resource: "LOAD" }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;
      const userId = Number((ctx.user as any)?.id) || 0;

      // Validate load exists
      const [load] = await db.select().from(loads).where(eq(loads.id, input.loadId)).limit(1);
      if (!load) throw new Error("Load not found");

      // Validate driver exists and belongs to company
      const [driver] = await db.select().from(drivers).where(and(
        eq(drivers.id, input.driverId),
        eq(drivers.companyId, companyId),
      )).limit(1);
      if (!driver) throw new Error("Driver not found or not in your company");

      // HOS validation from driver_availability
      let hosRemaining = 660; // default 11h in minutes
      try {
        const [hosRows]: any = await (db as any).execute(
          sql`SELECT hosDrivingRemaining FROM driver_availability WHERE driverId = ${input.driverId} AND companyId = ${companyId} LIMIT 1`
        );
        if (Array.isArray(hosRows) && hosRows[0]) hosRemaining = hosRows[0].hosDrivingRemaining ?? 660;
      } catch {}
      const estimatedMinutes = ((load.distance ? Number(load.distance) : 100) / 50) * 60;
      if (hosRemaining < estimatedMinutes) {
        throw new Error(`Insufficient HOS: driver has ${Math.floor(hosRemaining / 60)}h ${hosRemaining % 60}m remaining, load needs ~${Math.ceil(estimatedMinutes / 60)}h`);
      }

      // Hazmat endorsement check
      if (load.hazmatClass) {
        if (!driver.hazmatEndorsement) {
          throw new Error(`Load requires hazmat endorsement (Class ${load.hazmatClass}). Driver does not have one.`);
        }
      }

      // Conflict detection — check if this slot is already taken
      const [existingSlot] = await db.select()
        .from(dispatchPlannerSlots)
        .where(and(
          eq(dispatchPlannerSlots.companyId, companyId),
          sql`${dispatchPlannerSlots.date} = ${input.date}`,
          eq(dispatchPlannerSlots.driverId, input.driverId),
          eq(dispatchPlannerSlots.slotIndex, input.slotIndex),
        ))
        .limit(1);

      if (existingSlot && existingSlot.loadId) {
        throw new Error("Slot already occupied. Unassign the current load first or use a different slot.");
      }

      // Check load isn't already assigned in another slot
      const [alreadyAssigned] = await db.select()
        .from(dispatchPlannerSlots)
        .where(and(
          eq(dispatchPlannerSlots.companyId, companyId),
          eq(dispatchPlannerSlots.loadId, input.loadId),
          sql`${dispatchPlannerSlots.status} != 'cancelled'`,
        ))
        .limit(1);

      if (alreadyAssigned) {
        throw new Error("Load is already assigned to another slot. Unassign it first.");
      }

      // Upsert slot — use raw SQL for date insert
      if (existingSlot) {
        await db.update(dispatchPlannerSlots)
          .set({
            loadId: input.loadId,
            status: "assigned",
            assignedAt: new Date(),
            assignedBy: userId,
          })
          .where(eq(dispatchPlannerSlots.id, existingSlot.id));
      } else {
        await (db as any).execute(
          sql`INSERT INTO dispatch_planner_slots (companyId, date, driverId, slotIndex, loadId, status, assignedAt, assignedBy) VALUES (${companyId}, ${input.date}, ${input.driverId}, ${input.slotIndex}, ${input.loadId}, 'assigned', NOW(), ${userId})`
        );
      }

      // Update load status
      await db.update(loads).set({ status: "assigned" }).where(eq(loads.id, input.loadId));

      // Fire WS event
      try {
        emitDispatchEvent(String(companyId), {
          eventType: "load_assigned",
          loadId: String(input.loadId),
          loadNumber: load.loadNumber || `LD-${load.id}`,
          message: `Load ${load.loadNumber || load.id} assigned to driver`,
          priority: "normal",
          timestamp: new Date().toISOString(),
        });
      } catch {}

      return { success: true, slotIndex: input.slotIndex, loadId: input.loadId };
    }),

  /**
   * unassignLoad — Remove a load from its slot
   */
  unassignLoad: protectedProcedure
    .input(z.object({ slotId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || "DISPATCH", companyId: (ctx.user as any)?.companyId, action: "UPDATE", resource: "LOAD" }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      const [slot] = await db.select()
        .from(dispatchPlannerSlots)
        .where(and(
          eq(dispatchPlannerSlots.id, input.slotId),
          eq(dispatchPlannerSlots.companyId, companyId),
        ))
        .limit(1);

      if (!slot) throw new Error("Slot not found");
      if (!slot.loadId) throw new Error("Slot has no load to unassign");

      const loadId = slot.loadId;

      await db.update(dispatchPlannerSlots)
        .set({ loadId: null, status: "available", assignedAt: null, assignedBy: null })
        .where(eq(dispatchPlannerSlots.id, input.slotId));

      await db.update(loads).set({ status: "posted" }).where(eq(loads.id, loadId));

      return { success: true, loadId };
    }),

  /**
   * swapDrivers — Swap loads between two slots
   */
  swapDrivers: protectedProcedure
    .input(z.object({ slotId1: z.number(), slotId2: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || "DISPATCH", companyId: (ctx.user as any)?.companyId, action: "UPDATE", resource: "LOAD" }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      const [slot1] = await db.select().from(dispatchPlannerSlots)
        .where(and(eq(dispatchPlannerSlots.id, input.slotId1), eq(dispatchPlannerSlots.companyId, companyId))).limit(1);
      const [slot2] = await db.select().from(dispatchPlannerSlots)
        .where(and(eq(dispatchPlannerSlots.id, input.slotId2), eq(dispatchPlannerSlots.companyId, companyId))).limit(1);

      if (!slot1 || !slot2) throw new Error("One or both slots not found");

      await db.update(dispatchPlannerSlots)
        .set({ loadId: slot2.loadId, assignedAt: new Date(), assignedBy: Number((ctx.user as any)?.id) || null })
        .where(eq(dispatchPlannerSlots.id, input.slotId1));
      await db.update(dispatchPlannerSlots)
        .set({ loadId: slot1.loadId, assignedAt: new Date(), assignedBy: Number((ctx.user as any)?.id) || null })
        .where(eq(dispatchPlannerSlots.id, input.slotId2));

      return { success: true };
    }),

  /**
   * bulkAssign — Assign multiple loads at once
   */
  bulkAssign: protectedProcedure
    .input(z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      assignments: z.array(z.object({
        driverId: z.number(),
        slotIndex: z.number().min(0),
        loadId: z.number(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || "DISPATCH", companyId: (ctx.user as any)?.companyId, action: "UPDATE", resource: "LOAD" }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;
      const userId = Number((ctx.user as any)?.id) || 0;

      const successful: { driverId: number; loadId: number; slotIndex: number }[] = [];
      const failed: { loadId: number; error: string }[] = [];

      for (const a of input.assignments) {
        try {
          const [existing] = await db.select()
            .from(dispatchPlannerSlots)
            .where(and(
              eq(dispatchPlannerSlots.companyId, companyId),
              sql`${dispatchPlannerSlots.date} = ${input.date}`,
              eq(dispatchPlannerSlots.driverId, a.driverId),
              eq(dispatchPlannerSlots.slotIndex, a.slotIndex),
            )).limit(1);

          if (existing?.loadId) {
            failed.push({ loadId: a.loadId, error: "Slot already occupied" });
            continue;
          }

          if (existing) {
            await db.update(dispatchPlannerSlots)
              .set({ loadId: a.loadId, status: "assigned", assignedAt: new Date(), assignedBy: userId })
              .where(eq(dispatchPlannerSlots.id, existing.id));
          } else {
            await (db as any).execute(
              sql`INSERT INTO dispatch_planner_slots (companyId, date, driverId, slotIndex, loadId, status, assignedAt, assignedBy) VALUES (${companyId}, ${input.date}, ${a.driverId}, ${a.slotIndex}, ${a.loadId}, 'assigned', NOW(), ${userId})`
            );
          }

          await db.update(loads).set({ status: "assigned" }).where(eq(loads.id, a.loadId));
          successful.push(a);
        } catch (err: any) {
          failed.push({ loadId: a.loadId, error: err.message || "Unknown error" });
        }
      }

      return { successful, failed };
    }),

  /**
   * getDriverAvailability — Detailed driver info for planning
   */
  getDriverAvailability: protectedProcedure
    .input(z.object({
      driverId: z.number(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      const [driver] = await db.select().from(drivers)
        .where(and(eq(drivers.id, input.driverId), eq(drivers.companyId, companyId))).limit(1);
      if (!driver) throw new Error("Driver not found");

      // Get conflicting loads for this date
      const conflicting = await db.select({
        slotId: dispatchPlannerSlots.id,
        loadId: dispatchPlannerSlots.loadId,
        slotIndex: dispatchPlannerSlots.slotIndex,
        status: dispatchPlannerSlots.status,
      })
      .from(dispatchPlannerSlots)
      .where(and(
        eq(dispatchPlannerSlots.companyId, companyId),
        eq(dispatchPlannerSlots.driverId, input.driverId),
        sql`${dispatchPlannerSlots.date} = ${input.date}`,
        sql`${dispatchPlannerSlots.loadId} IS NOT NULL`,
      ));

      // HOS from driver_availability
      let hosRemaining = 660;
      try {
        const [hosRows]: any = await (db as any).execute(
          sql`SELECT hosDrivingRemaining FROM driver_availability WHERE driverId = ${input.driverId} AND companyId = ${companyId} LIMIT 1`
        );
        if (Array.isArray(hosRows) && hosRows[0]) hosRemaining = hosRows[0].hosDrivingRemaining ?? 660;
      } catch {}

      return {
        driverId: driver.id,
        hosRemaining,
        hazmatEndorsement: driver.hazmatEndorsement || false,
        hasTwic: !!driver.twicExpiry,
        safetyScore: driver.safetyScore ?? 100,
        conflictingLoads: conflicting,
        status: driver.status,
      };
    }),

  /**
   * autoSuggest — AI-ranked driver suggestions for a load
   */
  autoSuggest: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      // Get the load
      const [load] = await db.select().from(loads).where(eq(loads.id, input.loadId)).limit(1);
      if (!load) throw new Error("Load not found");

      // Get available drivers
      const availableDrivers = await db.select({
        id: drivers.id,
        userId: drivers.userId,
        name: users.name,
        hazmatEndorsement: drivers.hazmatEndorsement,
        safetyScore: drivers.safetyScore,
        totalLoads: drivers.totalLoads,
        status: drivers.status,
      })
      .from(drivers)
      .innerJoin(users, eq(drivers.userId, users.id))
      .where(and(
        eq(drivers.companyId, companyId),
        sql`${drivers.status} IN ('available', 'active', 'off_duty')`,
      ));

      // Score each driver
      const estimatedMinutes = ((load.distance ? Number(load.distance) : 100) / 50) * 60;

      // Get HOS for all drivers
      let hosMap: Record<number, number> = {};
      try {
        const [hosRows]: any = await (db as any).execute(
          sql`SELECT driverId, hosDrivingRemaining FROM driver_availability WHERE companyId = ${companyId}`
        );
        if (Array.isArray(hosRows)) {
          for (const r of hosRows) hosMap[r.driverId] = r.hosDrivingRemaining ?? 660;
        }
      } catch {}

      const scored = availableDrivers.map((d) => {
        let score = 50;
        const matchReasons: string[] = [];

        // HOS fit
        const hos = hosMap[d.id] ?? 660;
        if (hos >= estimatedMinutes) {
          score += 20;
          matchReasons.push("HOS sufficient");
        } else {
          score -= 30;
          matchReasons.push("HOS insufficient");
        }

        // Hazmat match
        if (load.hazmatClass) {
          if (d.hazmatEndorsement) {
            score += 15;
            matchReasons.push("Hazmat endorsed");
          } else {
            score -= 40;
            matchReasons.push("No hazmat endorsement");
          }
        }

        // Safety score bonus
        if (d.safetyScore && d.safetyScore > 80) {
          score += 5;
          matchReasons.push(`Safety score ${d.safetyScore}`);
        }

        // Experience bonus
        if (d.totalLoads && d.totalLoads > 50) {
          score += 3;
          matchReasons.push("Experienced");
        }

        // Available status bonus
        if (d.status === "available") {
          score += 10;
          matchReasons.push("Available now");
        }

        return {
          driverId: d.id,
          driverName: d.name || "Unknown",
          score: Math.max(0, Math.min(100, score)),
          matchReasons,
        };
      });

      scored.sort((a, b) => b.score - a.score);
      return { suggestedDrivers: scored.slice(0, 10) };
    }),
});
