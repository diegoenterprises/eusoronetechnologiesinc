/**
 * APPOINTMENTS ROUTER
 * tRPC procedures for pickup/delivery appointment scheduling
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const appointmentStatusSchema = z.enum([
  "scheduled", "confirmed", "checked_in", "loading", "unloading", "completed", "cancelled", "no_show"
]);
const appointmentTypeSchema = z.enum(["pickup", "delivery", "live_load", "drop_trailer"]);

export const appointmentsRouter = router({
  /**
   * List appointments
   */
  list: protectedProcedure
    .input(z.object({
      date: z.string().optional(),
      facilityId: z.string().optional(),
      carrierId: z.string().optional(),
      status: appointmentStatusSchema.optional(),
      type: appointmentTypeSchema.optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const appointments = [
        {
          id: "apt_001",
          type: "pickup",
          loadNumber: "LOAD-45920",
          facility: { id: "f1", name: "Shell Houston Terminal", address: "1234 Refinery Rd, Houston, TX" },
          carrier: { id: "car_001", name: "ABC Transport LLC" },
          driver: { id: "d1", name: "Mike Johnson" },
          scheduledDate: "2025-01-24",
          scheduledTime: "08:00",
          windowEnd: "10:00",
          status: "confirmed",
          product: "Unleaded Gasoline",
          quantity: 8500,
          unit: "gal",
          confirmationNumber: "CONF-45920-A",
        },
        {
          id: "apt_002",
          type: "delivery",
          loadNumber: "LOAD-45920",
          facility: { id: "f2", name: "7-Eleven Distribution Center", address: "5678 Commerce Dr, Dallas, TX" },
          carrier: { id: "car_001", name: "ABC Transport LLC" },
          driver: { id: "d1", name: "Mike Johnson" },
          scheduledDate: "2025-01-24",
          scheduledTime: "14:00",
          windowEnd: "16:00",
          status: "scheduled",
          product: "Unleaded Gasoline",
          quantity: 8500,
          unit: "gal",
          confirmationNumber: "CONF-45920-B",
        },
        {
          id: "apt_003",
          type: "pickup",
          loadNumber: "LOAD-45921",
          facility: { id: "f3", name: "Exxon Beaumont Refinery", address: "900 Industrial Blvd, Beaumont, TX" },
          carrier: { id: "car_002", name: "FastHaul LLC" },
          driver: { id: "d2", name: "Sarah Williams" },
          scheduledDate: "2025-01-25",
          scheduledTime: "06:00",
          windowEnd: "08:00",
          status: "scheduled",
          product: "Diesel",
          quantity: 9000,
          unit: "gal",
          confirmationNumber: "CONF-45921-A",
        },
      ];

      let filtered = appointments;
      if (input.date) filtered = filtered.filter(a => a.scheduledDate === input.date);
      if (input.facilityId) filtered = filtered.filter(a => a.facility.id === input.facilityId);
      if (input.carrierId) filtered = filtered.filter(a => a.carrier.id === input.carrierId);
      if (input.status) filtered = filtered.filter(a => a.status === input.status);
      if (input.type) filtered = filtered.filter(a => a.type === input.type);

      return {
        appointments: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
      };
    }),

  /**
   * Get appointment by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        type: "pickup",
        loadNumber: "LOAD-45920",
        facility: {
          id: "f1",
          name: "Shell Houston Terminal",
          address: "1234 Refinery Rd",
          city: "Houston",
          state: "TX",
          zip: "77001",
          contact: { name: "John Terminal", phone: "555-0150" },
          instructions: "Check in at guard shack. Present BOL and driver ID.",
        },
        carrier: { id: "car_001", name: "ABC Transport LLC", dotNumber: "1234567" },
        driver: { id: "d1", name: "Mike Johnson", phone: "555-0101", cdl: "TX12345678" },
        vehicle: { id: "v1", unitNumber: "TRK-101", trailerNumber: "TRL-201" },
        scheduledDate: "2025-01-24",
        scheduledTime: "08:00",
        windowEnd: "10:00",
        status: "confirmed",
        product: "Unleaded Gasoline",
        quantity: 8500,
        unit: "gal",
        hazmat: { class: "3", unNumber: "1203" },
        confirmationNumber: "CONF-45920-A",
        timeline: [
          { timestamp: "2025-01-22T10:00:00Z", action: "Appointment created", user: "System" },
          { timestamp: "2025-01-22T10:05:00Z", action: "Appointment confirmed by facility", user: "Shell Terminal" },
        ],
      };
    }),

  /**
   * Create appointment
   */
  create: protectedProcedure
    .input(z.object({
      type: appointmentTypeSchema,
      loadId: z.string(),
      facilityId: z.string(),
      carrierId: z.string(),
      driverId: z.string().optional(),
      vehicleId: z.string().optional(),
      scheduledDate: z.string(),
      scheduledTime: z.string(),
      product: z.string().optional(),
      quantity: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const confirmationNumber = `CONF-${Date.now().toString().slice(-6)}`;
      
      return {
        id: `apt_${Date.now()}`,
        confirmationNumber,
        status: "scheduled",
        createdBy: ctx.user?.id,
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Update appointment
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      scheduledDate: z.string().optional(),
      scheduledTime: z.string().optional(),
      driverId: z.string().optional(),
      vehicleId: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        id: input.id,
        updatedBy: ctx.user?.id,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Update appointment status
   */
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: appointmentStatusSchema,
      notes: z.string().optional(),
      timestamp: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        id: input.id,
        newStatus: input.status,
        updatedBy: ctx.user?.id,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Check in for appointment
   */
  checkIn: protectedProcedure
    .input(z.object({
      appointmentId: z.string(),
      driverId: z.string(),
      vehicleId: z.string(),
      trailerNumber: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        appointmentId: input.appointmentId,
        checkInTime: new Date().toISOString(),
        queuePosition: 3,
        estimatedWait: 25,
      };
    }),

  /**
   * Cancel appointment
   */
  cancel: protectedProcedure
    .input(z.object({
      id: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        id: input.id,
        cancelledBy: ctx.user?.id,
        cancelledAt: new Date().toISOString(),
      };
    }),

  /**
   * Get available time slots
   */
  getAvailableSlots: protectedProcedure
    .input(z.object({
      facilityId: z.string(),
      date: z.string(),
      type: appointmentTypeSchema,
    }))
    .query(async ({ input }) => {
      return {
        facilityId: input.facilityId,
        date: input.date,
        slots: [
          { time: "06:00", available: true, capacity: 2, booked: 0 },
          { time: "08:00", available: true, capacity: 2, booked: 1 },
          { time: "10:00", available: true, capacity: 2, booked: 0 },
          { time: "12:00", available: false, capacity: 2, booked: 2 },
          { time: "14:00", available: true, capacity: 2, booked: 1 },
          { time: "16:00", available: true, capacity: 2, booked: 0 },
        ],
      };
    }),

  /**
   * Get my appointments (driver)
   */
  getMyAppointments: protectedProcedure
    .input(z.object({
      status: z.enum(["upcoming", "today", "past"]).default("upcoming"),
    }))
    .query(async ({ ctx, input }) => {
      return [
        {
          id: "apt_001",
          type: "pickup",
          loadNumber: "LOAD-45920",
          facilityName: "Shell Houston Terminal",
          address: "1234 Refinery Rd, Houston, TX",
          scheduledDate: "2025-01-24",
          scheduledTime: "08:00",
          status: "confirmed",
          product: "Unleaded Gasoline",
          quantity: 8500,
        },
        {
          id: "apt_002",
          type: "delivery",
          loadNumber: "LOAD-45920",
          facilityName: "7-Eleven Distribution Center",
          address: "5678 Commerce Dr, Dallas, TX",
          scheduledDate: "2025-01-24",
          scheduledTime: "14:00",
          status: "scheduled",
          product: "Unleaded Gasoline",
          quantity: 8500,
        },
      ];
    }),

  /**
   * Send appointment reminder
   */
  sendReminder: protectedProcedure
    .input(z.object({
      appointmentId: z.string(),
      recipientType: z.enum(["driver", "carrier", "facility"]),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        appointmentId: input.appointmentId,
        sentTo: input.recipientType,
        sentAt: new Date().toISOString(),
      };
    }),

  // Additional appointment procedures
  getSummary: protectedProcedure.query(async () => ({ today: 12, completed: 8, inProgress: 2, upcoming: 15 })),
  startLoading: protectedProcedure.input(z.object({ appointmentId: z.string() })).mutation(async ({ input }) => ({ success: true, appointmentId: input.appointmentId })),
  complete: protectedProcedure.input(z.object({ appointmentId: z.string() })).mutation(async ({ input }) => ({ success: true, appointmentId: input.appointmentId, completedAt: new Date().toISOString() })),
});
