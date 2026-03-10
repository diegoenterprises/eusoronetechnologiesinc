/**
 * LOAD STOPS ROUTER — Multi-Stop Load Support (GAP-002)
 * CRUD for ordered stops per load: pickup, delivery, fuel, rest, crossdock, etc.
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loadStops, loads } from "../../drizzle/schema";
import { eq, and, asc, desc, gte, sql } from "drizzle-orm";
import { requireAccess } from "../services/security/rbac/access-check";
import { unsafeCast } from "../_core/types/unsafe";

const stopTypeEnum = z.enum([
  "pickup", "delivery", "fuel", "rest", "scale",
  "inspection", "crossdock", "relay", "customs",
]);

const stopStatusEnum = z.enum([
  "pending", "en_route", "arrived", "loading", "unloading", "completed", "skipped",
]);

const stopInput = z.object({
  stopType: stopTypeEnum,
  facilityName: z.string().max(255).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zipCode: z.string().max(20).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  contactName: z.string().max(200).optional(),
  contactPhone: z.string().max(30).optional(),
  appointmentStart: z.string().optional(),
  appointmentEnd: z.string().optional(),
  notes: z.string().optional(),
  referenceNumber: z.string().max(100).optional(),
  estimatedWeight: z.number().optional(),
});

export const loadStopsRouter = router({
  /**
   * Get all stops for a load, ordered by sequence
   */
  getByLoadId: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: ctx.user?.role || "DRIVER", companyId: ctx.user!.companyId, action: "READ", resource: "LOAD" }, unsafeCast(ctx).req);
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(loadStops)
        .where(eq(loadStops.loadId, input.loadId))
        .orderBy(asc(loadStops.sequence));
      return rows.map(r => ({
        ...r,
        lat: r.lat ? Number(r.lat) : null,
        lng: r.lng ? Number(r.lng) : null,
        estimatedWeight: r.estimatedWeight ? Number(r.estimatedWeight) : null,
        actualWeight: r.actualWeight ? Number(r.actualWeight) : null,
        distanceFromPrev: r.distanceFromPrev ? Number(r.distanceFromPrev) : null,
      }));
    }),

  /**
   * Add a stop to a load (appended at end or at a specific sequence)
   */
  add: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      sequence: z.number().optional(),
      stop: stopInput,
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: ctx.user?.role || "DISPATCH", companyId: ctx.user!.companyId, action: "UPDATE", resource: "LOAD" }, unsafeCast(ctx).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Determine sequence: use provided or append at end
      let seq = input.sequence;
      if (seq === undefined || seq === null) {
        const [maxRow] = await db
          .select({ maxSeq: sql<number>`COALESCE(MAX(${loadStops.sequence}), 0)` })
          .from(loadStops)
          .where(eq(loadStops.loadId, input.loadId));
        seq = (maxRow?.maxSeq || 0) + 1;
      } else {
        // Shift existing stops at or after this sequence
        await db.execute(
          sql`UPDATE load_stops SET sequence = sequence + 1 WHERE loadId = ${input.loadId} AND sequence >= ${seq}`
        );
      }

      const [result] = await db.insert(loadStops).values({
        loadId: input.loadId,
        sequence: seq,
        stopType: input.stop.stopType,
        facilityName: input.stop.facilityName || null,
        address: input.stop.address || null,
        city: input.stop.city || null,
        state: input.stop.state || null,
        zipCode: input.stop.zipCode || null,
        lat: input.stop.lat ? String(input.stop.lat) : null,
        lng: input.stop.lng ? String(input.stop.lng) : null,
        contactName: input.stop.contactName || null,
        contactPhone: input.stop.contactPhone || null,
        appointmentStart: input.stop.appointmentStart ? new Date(input.stop.appointmentStart) : null,
        appointmentEnd: input.stop.appointmentEnd ? new Date(input.stop.appointmentEnd) : null,
        notes: input.stop.notes || null,
        referenceNumber: input.stop.referenceNumber || null,
        estimatedWeight: input.stop.estimatedWeight ? String(input.stop.estimatedWeight) : null,
        status: "pending",
      } as never).$returningId();

      return { id: result.id, sequence: seq };
    }),

  /**
   * Bulk set stops for a load (replace all existing stops)
   */
  setStops: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      stops: z.array(stopInput).min(2).max(30),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: ctx.user?.role || "DISPATCH", companyId: ctx.user!.companyId, action: "UPDATE", resource: "LOAD" }, unsafeCast(ctx).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Delete existing stops
      await db.delete(loadStops).where(eq(loadStops.loadId, input.loadId));

      // Insert all new stops
      const values = input.stops.map((s, i) => ({
        loadId: input.loadId,
        sequence: i + 1,
        stopType: s.stopType,
        facilityName: s.facilityName || null,
        address: s.address || null,
        city: s.city || null,
        state: s.state || null,
        zipCode: s.zipCode || null,
        lat: s.lat ? String(s.lat) : null,
        lng: s.lng ? String(s.lng) : null,
        contactName: s.contactName || null,
        contactPhone: s.contactPhone || null,
        appointmentStart: s.appointmentStart ? new Date(s.appointmentStart) : null,
        appointmentEnd: s.appointmentEnd ? new Date(s.appointmentEnd) : null,
        notes: s.notes || null,
        referenceNumber: s.referenceNumber || null,
        estimatedWeight: s.estimatedWeight ? String(s.estimatedWeight) : null,
        status: "pending" as const,
      }));

      await db.insert(loadStops).values(unsafeCast(values));

      // Sync first/last stop to load's pickupLocation/deliveryLocation
      const first = input.stops[0];
      const last = input.stops[input.stops.length - 1];
      await db.update(loads).set({
        pickupLocation: first ? {
          address: first.address || "",
          city: first.city || "",
          state: first.state || "",
          zipCode: first.zipCode || "",
          lat: first.lat || 0,
          lng: first.lng || 0,
        } : undefined,
        deliveryLocation: last ? {
          address: last.address || "",
          city: last.city || "",
          state: last.state || "",
          zipCode: last.zipCode || "",
          lat: last.lat || 0,
          lng: last.lng || 0,
        } : undefined,
        updatedAt: new Date(),
      }).where(eq(loads.id, input.loadId));

      return { count: input.stops.length };
    }),

  /**
   * Update a single stop
   */
  update: protectedProcedure
    .input(z.object({
      stopId: z.number(),
      data: z.object({
        stopType: stopTypeEnum.optional(),
        facilityName: z.string().max(255).optional(),
        address: z.string().max(500).optional(),
        city: z.string().max(100).optional(),
        state: z.string().max(50).optional(),
        zipCode: z.string().max(20).optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        contactName: z.string().max(200).optional(),
        contactPhone: z.string().max(30).optional(),
        appointmentStart: z.string().nullable().optional(),
        appointmentEnd: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        referenceNumber: z.string().max(100).nullable().optional(),
        estimatedWeight: z.number().nullable().optional(),
        actualWeight: z.number().nullable().optional(),
        status: stopStatusEnum.optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: ctx.user?.role || "DISPATCH", companyId: ctx.user!.companyId, action: "UPDATE", resource: "LOAD" }, unsafeCast(ctx).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const updates: Record<string, any> = { updatedAt: new Date() };
      const d = input.data;
      if (d.stopType !== undefined) updates.stopType = d.stopType;
      if (d.facilityName !== undefined) updates.facilityName = d.facilityName;
      if (d.address !== undefined) updates.address = d.address;
      if (d.city !== undefined) updates.city = d.city;
      if (d.state !== undefined) updates.state = d.state;
      if (d.zipCode !== undefined) updates.zipCode = d.zipCode;
      if (d.lat !== undefined) updates.lat = String(d.lat);
      if (d.lng !== undefined) updates.lng = String(d.lng);
      if (d.contactName !== undefined) updates.contactName = d.contactName;
      if (d.contactPhone !== undefined) updates.contactPhone = d.contactPhone;
      if (d.appointmentStart !== undefined) updates.appointmentStart = d.appointmentStart ? new Date(d.appointmentStart) : null;
      if (d.appointmentEnd !== undefined) updates.appointmentEnd = d.appointmentEnd ? new Date(d.appointmentEnd) : null;
      if (d.notes !== undefined) updates.notes = d.notes;
      if (d.referenceNumber !== undefined) updates.referenceNumber = d.referenceNumber;
      if (d.estimatedWeight !== undefined) updates.estimatedWeight = d.estimatedWeight != null ? String(d.estimatedWeight) : null;
      if (d.actualWeight !== undefined) updates.actualWeight = d.actualWeight != null ? String(d.actualWeight) : null;
      if (d.status !== undefined) updates.status = d.status;

      // Auto-set arrivedAt/departedAt based on status changes
      if (d.status === "arrived") updates.arrivedAt = new Date();
      if (d.status === "completed" || d.status === "skipped") updates.departedAt = new Date();

      await db.update(loadStops).set(updates).where(eq(loadStops.id, input.stopId));

      // If status changed to completed/arrived, calculate dwell time
      if (d.status === "completed" || d.status === "skipped") {
        const [stop] = await db.select({ arrivedAt: loadStops.arrivedAt }).from(loadStops).where(eq(loadStops.id, input.stopId)).limit(1);
        if (stop?.arrivedAt) {
          const dwellMinutes = Math.round((Date.now() - new Date(stop.arrivedAt).getTime()) / 60000);
          await db.update(loadStops).set({ dwellMinutes }).where(eq(loadStops.id, input.stopId));
        }
      }

      return { success: true };
    }),

  /**
   * Reorder stops (move a stop to a new position)
   */
  reorder: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      stopId: z.number(),
      newSequence: z.number().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: ctx.user?.role || "DISPATCH", companyId: ctx.user!.companyId, action: "UPDATE", resource: "LOAD" }, unsafeCast(ctx).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [stop] = await db.select({ sequence: loadStops.sequence }).from(loadStops).where(eq(loadStops.id, input.stopId)).limit(1);
      if (!stop) throw new Error("Stop not found");

      const oldSeq = stop.sequence;
      const newSeq = input.newSequence;

      if (oldSeq === newSeq) return { success: true };

      if (newSeq > oldSeq) {
        // Moving down: shift items between old+1..new up by -1
        await db.execute(
          sql`UPDATE load_stops SET sequence = sequence - 1 WHERE loadId = ${input.loadId} AND sequence > ${oldSeq} AND sequence <= ${newSeq}`
        );
      } else {
        // Moving up: shift items between new..old-1 down by +1
        await db.execute(
          sql`UPDATE load_stops SET sequence = sequence + 1 WHERE loadId = ${input.loadId} AND sequence >= ${newSeq} AND sequence < ${oldSeq}`
        );
      }

      await db.update(loadStops).set({ sequence: newSeq }).where(eq(loadStops.id, input.stopId));
      return { success: true };
    }),

  /**
   * Delete a stop and re-sequence remaining stops
   */
  remove: protectedProcedure
    .input(z.object({ stopId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: ctx.user?.role || "DISPATCH", companyId: ctx.user!.companyId, action: "UPDATE", resource: "LOAD" }, unsafeCast(ctx).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [stop] = await db.select({ loadId: loadStops.loadId, sequence: loadStops.sequence }).from(loadStops).where(eq(loadStops.id, input.stopId)).limit(1);
      if (!stop) throw new Error("Stop not found");

      await db.delete(loadStops).where(eq(loadStops.id, input.stopId));

      // Re-sequence remaining stops
      await db.execute(
        sql`UPDATE load_stops SET sequence = sequence - 1 WHERE loadId = ${stop.loadId} AND sequence > ${stop.sequence}`
      );

      return { success: true };
    }),

  /**
   * Get stop summary for a load (counts by type, total distance, progress %)
   */
  getSummary: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: ctx.user?.role || "DRIVER", companyId: ctx.user!.companyId, action: "READ", resource: "LOAD" }, unsafeCast(ctx).req);
      const db = await getDb();
      if (!db) return { totalStops: 0, completedStops: 0, pickups: 0, deliveries: 0, progress: 0 };

      const rows = await db
        .select({ stopType: loadStops.stopType, status: loadStops.status })
        .from(loadStops)
        .where(eq(loadStops.loadId, input.loadId));

      const total = rows.length;
      const completed = rows.filter(r => r.status === "completed").length;
      const pickups = rows.filter(r => r.stopType === "pickup").length;
      const deliveries = rows.filter(r => r.stopType === "delivery").length;

      return {
        totalStops: total,
        completedStops: completed,
        pickups,
        deliveries,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    }),
});
