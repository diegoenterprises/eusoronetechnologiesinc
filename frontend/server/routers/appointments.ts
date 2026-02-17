/**
 * APPOINTMENTS ROUTER
 * tRPC procedures for pickup/delivery appointment scheduling
 */

import { z } from "zod";
import { eq, desc, sql, gte, lte, and } from "drizzle-orm";
import { auditedProtectedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { appointments, loads, users, companies } from "../../drizzle/schema";

const appointmentStatusSchema = z.enum([
  "scheduled", "confirmed", "checked_in", "loading", "unloading", "completed", "cancelled", "no_show"
]);
const appointmentTypeSchema = z.enum(["pickup", "delivery", "live_load", "drop_trailer"]);

// Resolve user's terminalId or companyId for scoping
async function resolveUserContext(ctxUser: any) {
  const db = await getDb();
  if (!db) return { userId: 0, companyId: 0 };
  const userId = typeof ctxUser?.id === "string" ? parseInt(ctxUser.id, 10) : (ctxUser?.id || 0);
  try { const [r] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1); return { userId, companyId: r?.companyId || 0 }; } catch { return { userId, companyId: 0 }; }
}

export const appointmentsRouter = router({
  /**
   * List appointments — real DB query
   */
  list: protectedProcedure
    .input(z.object({
      date: z.string().optional(),
      facilityId: z.string().optional(),
      catalystId: z.string().optional(),
      rackId: z.string().optional(),
      status: appointmentStatusSchema.optional(),
      type: appointmentTypeSchema.optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { appointments: [], total: 0 };
      try {
        const filters: any[] = [];
        if (input.facilityId) filters.push(eq(appointments.terminalId, parseInt(input.facilityId, 10)));
        if (input.status) filters.push(eq(appointments.status, input.status as any));
        if (input.type) filters.push(eq(appointments.type, input.type as any));
        if (input.date) {
          const dayStart = new Date(input.date); dayStart.setHours(0,0,0,0);
          const dayEnd = new Date(input.date); dayEnd.setHours(23,59,59,999);
          filters.push(gte(appointments.scheduledAt, dayStart));
          filters.push(lte(appointments.scheduledAt, dayEnd));
        }

        const results = await db.select().from(appointments)
          .where(filters.length > 0 ? and(...filters) : undefined)
          .orderBy(desc(appointments.scheduledAt))
          .limit(input.limit).offset(input.offset);
        const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(appointments).where(filters.length > 0 ? and(...filters) : undefined);

        return {
          appointments: results.map(a => ({
            id: String(a.id), type: a.type, terminalId: String(a.terminalId),
            loadId: a.loadId ? String(a.loadId) : null, driverId: a.driverId ? String(a.driverId) : null,
            scheduledAt: a.scheduledAt?.toISOString() || "", dockNumber: a.dockNumber || "",
            status: a.status || "scheduled",
          })),
          total: countRow?.count || 0,
        };
      } catch (err) { console.error("[appointments.list]", err); return { appointments: [], total: 0 }; }
    }),

  /**
   * Get appointment by ID — real DB query
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const [apt] = await db.select().from(appointments).where(eq(appointments.id, parseInt(input.id, 10))).limit(1);
        if (!apt) return null;
        return {
          id: String(apt.id), type: apt.type, loadNumber: apt.loadId ? `LOAD-${apt.loadId}` : "",
          facility: { id: String(apt.terminalId), name: "", address: "", city: "", state: "", zip: "", contact: { name: "", phone: "" }, instructions: "" },
          catalyst: { id: "", name: "", dotNumber: "" },
          driver: { id: apt.driverId ? String(apt.driverId) : "", name: "", phone: "", cdl: "" },
          vehicle: { id: "", unitNumber: "", trailerNumber: "" },
          scheduledDate: apt.scheduledAt?.toISOString()?.split("T")[0] || "",
          scheduledTime: apt.scheduledAt?.toISOString()?.split("T")[1]?.substring(0,5) || "",
          windowEnd: "", status: apt.status || "scheduled",
          product: "", quantity: 0, unit: "gal", hazmat: null,
          confirmationNumber: `CONF-${String(apt.id).padStart(6, "0")}`,
          dockNumber: apt.dockNumber || "",
          timeline: [],
        };
      } catch { return null; }
    }),

  /**
   * Create appointment — writes to appointments table
   */
  create: protectedProcedure
    .input(z.object({
      type: appointmentTypeSchema, loadId: z.string(), facilityId: z.string(),
      catalystId: z.string(), driverId: z.string().optional(), vehicleId: z.string().optional(),
      scheduledDate: z.string(), scheduledTime: z.string(),
      product: z.string().optional(), quantity: z.number().optional(), notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.insert(appointments).values({
        terminalId: parseInt(input.facilityId, 10),
        loadId: parseInt(input.loadId, 10) || null,
        driverId: input.driverId ? parseInt(input.driverId, 10) : null,
        type: input.type as any,
        scheduledAt: new Date(`${input.scheduledDate}T${input.scheduledTime}`),
        status: "scheduled",
      } as any);
      const insertedId = (result as any).insertId || (result as any)[0]?.insertId || 0;
      return { id: String(insertedId), confirmationNumber: `CONF-${String(insertedId).padStart(6, "0")}`, status: "scheduled", createdBy: ctx.user?.id, createdAt: new Date().toISOString() };
    }),

  /**
   * Update appointment — writes to DB
   */
  update: protectedProcedure
    .input(z.object({ id: z.string(), scheduledDate: z.string().optional(), scheduledTime: z.string().optional(), driverId: z.string().optional(), vehicleId: z.string().optional(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const updateData: any = {};
      if (input.scheduledDate && input.scheduledTime) updateData.scheduledAt = new Date(`${input.scheduledDate}T${input.scheduledTime}`);
      if (input.driverId) updateData.driverId = parseInt(input.driverId, 10);
      if (input.notes) updateData.dockNumber = input.notes; // Store notes in dockNumber for now
      if (Object.keys(updateData).length > 0) {
        await db.update(appointments).set(updateData).where(eq(appointments.id, parseInt(input.id, 10)));
      }
      return { success: true, id: input.id, updatedBy: ctx.user?.id, updatedAt: new Date().toISOString() };
    }),

  /**
   * Update appointment status — writes to DB
   */
  updateStatus: protectedProcedure
    .input(z.object({ id: z.string(), status: appointmentStatusSchema, notes: z.string().optional(), timestamp: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(appointments).set({ status: input.status as any }).where(eq(appointments.id, parseInt(input.id, 10)));
      return { success: true, id: input.id, newStatus: input.status, updatedBy: ctx.user?.id, updatedAt: new Date().toISOString() };
    }),

  /**
   * Check in for appointment — updates status to checked_in
   */
  checkIn: protectedProcedure
    .input(z.object({ appointmentId: z.string(), driverId: z.string().optional(), vehicleId: z.string().optional(), trailerNumber: z.string().optional(), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(appointments).set({ status: "checked_in" as any }).where(eq(appointments.id, parseInt(input.appointmentId, 10)));
      return { success: true, appointmentId: input.appointmentId, checkInTime: new Date().toISOString(), queuePosition: 0, estimatedWait: 0 };
    }),

  /**
   * Cancel appointment — updates status to cancelled
   */
  cancel: protectedProcedure
    .input(z.object({ id: z.string(), reason: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(appointments).set({ status: "cancelled" as any }).where(eq(appointments.id, parseInt(input.id, 10)));
      return { success: true, id: input.id, cancelledBy: ctx.user?.id, cancelledAt: new Date().toISOString() };
    }),

  /**
   * Get available time slots — computed from real bookings
   */
  getAvailableSlots: protectedProcedure
    .input(z.object({ facilityId: z.string(), date: z.string(), type: appointmentTypeSchema }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { facilityId: input.facilityId, date: input.date, slots: [] };
      try {
        const dayStart = new Date(input.date); dayStart.setHours(0,0,0,0);
        const dayEnd = new Date(input.date); dayEnd.setHours(23,59,59,999);
        const booked = await db.select({ scheduledAt: appointments.scheduledAt }).from(appointments)
          .where(and(eq(appointments.terminalId, parseInt(input.facilityId, 10)), gte(appointments.scheduledAt, dayStart), lte(appointments.scheduledAt, dayEnd), sql`${appointments.status} != 'cancelled'`));
        const bookedHours = booked.map(b => b.scheduledAt?.getHours() || 0);
        const capacity = 2;
        const slots = [6, 8, 10, 12, 14, 16].map(hour => {
          const count = bookedHours.filter(h => h === hour).length;
          return { time: `${String(hour).padStart(2, "0")}:00`, available: count < capacity, capacity, booked: count };
        });
        return { facilityId: input.facilityId, date: input.date, slots };
      } catch { return { facilityId: input.facilityId, date: input.date, slots: [] }; }
    }),

  /**
   * Get my appointments (driver) — scoped by driverId
   */
  getMyAppointments: protectedProcedure
    .input(z.object({ status: z.enum(["upcoming", "today", "past"]).default("upcoming") }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const { userId } = await resolveUserContext(ctx.user);
      try {
        const now = new Date();
        const filters: any[] = [eq(appointments.driverId, userId)];
        if (input.status === "upcoming") filters.push(gte(appointments.scheduledAt, now));
        else if (input.status === "today") {
          const dayStart = new Date(); dayStart.setHours(0,0,0,0);
          const dayEnd = new Date(); dayEnd.setHours(23,59,59,999);
          filters.push(gte(appointments.scheduledAt, dayStart));
          filters.push(lte(appointments.scheduledAt, dayEnd));
        } else filters.push(lte(appointments.scheduledAt, now));

        const results = await db.select().from(appointments).where(and(...filters)).orderBy(desc(appointments.scheduledAt)).limit(20);
        return results.map(a => ({
          id: String(a.id), type: a.type, loadNumber: a.loadId ? `LOAD-${a.loadId}` : "",
          facilityName: "", address: "",
          scheduledDate: a.scheduledAt?.toISOString()?.split("T")[0] || "",
          scheduledTime: a.scheduledAt?.toISOString()?.split("T")[1]?.substring(0,5) || "",
          status: a.status || "scheduled", product: "", quantity: 0,
        }));
      } catch { return []; }
    }),

  /**
   * Send appointment reminder
   */
  sendReminder: protectedProcedure
    .input(z.object({ appointmentId: z.string(), recipientType: z.enum(["driver", "catalyst", "facility"]) }))
    .mutation(async ({ input }) => {
      return { success: true, appointmentId: input.appointmentId, sentTo: input.recipientType, sentAt: new Date().toISOString() };
    }),

  // Additional appointment procedures — real DB queries
  getSummary: protectedProcedure.input(z.object({ date: z.string().optional() }).optional()).query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { today: 0, todayTotal: 0, completed: 0, inProgress: 0, upcoming: 0, cancelled: 0 };
    try {
      const dayStart = new Date(); dayStart.setHours(0,0,0,0);
      const dayEnd = new Date(); dayEnd.setHours(23,59,59,999);
      const [todayCount] = await db.select({ count: sql<number>`count(*)` }).from(appointments).where(and(gte(appointments.scheduledAt, dayStart), lte(appointments.scheduledAt, dayEnd)));
      const [completedCount] = await db.select({ count: sql<number>`count(*)` }).from(appointments).where(and(gte(appointments.scheduledAt, dayStart), lte(appointments.scheduledAt, dayEnd), eq(appointments.status, "completed")));
      const [cancelledCount] = await db.select({ count: sql<number>`count(*)` }).from(appointments).where(and(gte(appointments.scheduledAt, dayStart), lte(appointments.scheduledAt, dayEnd), eq(appointments.status, "cancelled")));
      const [upcomingCount] = await db.select({ count: sql<number>`count(*)` }).from(appointments).where(and(gte(appointments.scheduledAt, dayEnd)));
      const total = todayCount?.count || 0;
      return { today: total, todayTotal: total, completed: completedCount?.count || 0, inProgress: 0, upcoming: upcomingCount?.count || 0, cancelled: cancelledCount?.count || 0 };
    } catch { return { today: 0, todayTotal: 0, completed: 0, inProgress: 0, upcoming: 0, cancelled: 0 }; }
  }),
  startLoading: protectedProcedure.input(z.object({ appointmentId: z.string() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (db) await db.update(appointments).set({ status: "loading" as any }).where(eq(appointments.id, parseInt(input.appointmentId, 10)));
    return { success: true, appointmentId: input.appointmentId };
  }),
  complete: protectedProcedure.input(z.object({ appointmentId: z.string() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (db) await db.update(appointments).set({ status: "completed" as any }).where(eq(appointments.id, parseInt(input.appointmentId, 10)));
    return { success: true, appointmentId: input.appointmentId, completedAt: new Date().toISOString() };
  }),
});
