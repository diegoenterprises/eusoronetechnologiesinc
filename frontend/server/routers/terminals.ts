/**
 * TERMINALS ROUTER
 * tRPC procedures for terminal/facility operations
 * Based on 07_TERMINAL_MANAGER_USER_JOURNEY.md
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const appointmentStatusSchema = z.enum(["scheduled", "checked_in", "loading", "completed", "cancelled", "no_show"]);
const rackStatusSchema = z.enum(["available", "in_use", "maintenance", "offline"]);

export const terminalsRouter = router({
  /**
   * Get terminal dashboard summary
   */
  getDashboardSummary: protectedProcedure
    .input(z.object({ terminalId: z.string().optional() }))
    .query(async ({ input }) => {
      return {
        todayAppointments: 24,
        trucksCheckedIn: 8,
        currentlyLoading: 5,
        rackUtilization: 65,
        totalInventory: 425000,
        inventoryUnit: "bbl",
        avgLoadTime: 42,
        avgLoadTimeUnit: "min",
        alerts: [
          { type: "maintenance", message: "Rack 3 scheduled maintenance at 2:00 PM" },
        ],
      };
    }),

  /**
   * Get today's appointments
   */
  getAppointments: protectedProcedure
    .input(z.object({
      terminalId: z.string().optional(),
      date: z.string().optional(),
      status: appointmentStatusSchema.optional(),
    }))
    .query(async ({ input }) => {
      const appointments = [
        {
          id: "apt_001",
          scheduledTime: "08:00",
          carrier: "ABC Transport",
          driver: "Mike Johnson",
          truckNumber: "TRK-101",
          product: "Unleaded Gasoline",
          quantity: 8500,
          unit: "gal",
          rack: "Rack 1",
          status: "completed",
          checkInTime: "07:55",
          checkOutTime: "08:45",
        },
        {
          id: "apt_002",
          scheduledTime: "09:00",
          carrier: "XYZ Carriers",
          driver: "Sarah Williams",
          truckNumber: "TRK-205",
          product: "Diesel",
          quantity: 9000,
          unit: "gal",
          rack: "Rack 2",
          status: "loading",
          checkInTime: "08:58",
        },
        {
          id: "apt_003",
          scheduledTime: "10:00",
          carrier: "FastHaul LLC",
          driver: "Tom Brown",
          truckNumber: "TRK-312",
          product: "Premium Gasoline",
          quantity: 8000,
          unit: "gal",
          rack: "Rack 1",
          status: "checked_in",
          checkInTime: "09:50",
        },
        {
          id: "apt_004",
          scheduledTime: "11:00",
          carrier: "SafeHaul Transport",
          driver: "Lisa Chen",
          truckNumber: "TRK-445",
          product: "Jet Fuel",
          quantity: 7500,
          unit: "gal",
          rack: "Rack 4",
          status: "scheduled",
        },
      ];

      let filtered = appointments;
      if (input.status) {
        filtered = filtered.filter(a => a.status === input.status);
      }

      return {
        appointments: filtered,
        summary: {
          total: appointments.length,
          completed: appointments.filter(a => a.status === "completed").length,
          inProgress: appointments.filter(a => a.status === "loading" || a.status === "checked_in").length,
          upcoming: appointments.filter(a => a.status === "scheduled").length,
        },
      };
    }),

  /**
   * Create appointment
   */
  createAppointment: protectedProcedure
    .input(z.object({
      terminalId: z.string(),
      carrierId: z.string(),
      driverId: z.string(),
      truckNumber: z.string(),
      productId: z.string(),
      quantity: z.number(),
      scheduledDate: z.string(),
      scheduledTime: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `apt_${Date.now()}`,
        confirmationNumber: `CONF-${Date.now().toString().slice(-6)}`,
        status: "scheduled",
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Update appointment status
   */
  updateAppointmentStatus: protectedProcedure
    .input(z.object({
      appointmentId: z.string(),
      status: appointmentStatusSchema,
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        appointmentId: input.appointmentId,
        newStatus: input.status,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Check in truck
   */
  checkInTruck: protectedProcedure
    .input(z.object({
      appointmentId: z.string(),
      truckNumber: z.string(),
      driverLicense: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        appointmentId: input.appointmentId,
        checkInTime: new Date().toISOString(),
        assignedRack: "Rack 2",
        estimatedLoadTime: 45,
      };
    }),

  /**
   * Get rack status
   */
  getRackStatus: protectedProcedure
    .input(z.object({ terminalId: z.string().optional() }))
    .query(async ({ input }) => {
      return [
        {
          id: "rack_1",
          name: "Rack 1",
          status: "in_use",
          currentLoad: {
            appointmentId: "apt_001",
            carrier: "ABC Transport",
            product: "Unleaded Gasoline",
            startTime: "08:15",
            progress: 85,
          },
          products: ["Unleaded Gasoline", "Premium Gasoline", "E85"],
          flowRate: 600,
          flowRateUnit: "gpm",
        },
        {
          id: "rack_2",
          name: "Rack 2",
          status: "in_use",
          currentLoad: {
            appointmentId: "apt_002",
            carrier: "XYZ Carriers",
            product: "Diesel",
            startTime: "09:10",
            progress: 45,
          },
          products: ["Diesel", "Biodiesel"],
          flowRate: 550,
          flowRateUnit: "gpm",
        },
        {
          id: "rack_3",
          name: "Rack 3",
          status: "maintenance",
          maintenanceReason: "Scheduled pump maintenance",
          expectedAvailable: "14:00",
          products: ["Diesel", "Heating Oil"],
          flowRate: 500,
          flowRateUnit: "gpm",
        },
        {
          id: "rack_4",
          name: "Rack 4",
          status: "available",
          products: ["Jet Fuel", "Kerosene"],
          flowRate: 400,
          flowRateUnit: "gpm",
        },
      ];
    }),

  /**
   * Get inventory levels
   */
  getInventory: protectedProcedure
    .input(z.object({ terminalId: z.string().optional() }))
    .query(async ({ input }) => {
      return [
        {
          tankId: "tank_1",
          product: "Unleaded Gasoline",
          capacity: 150000,
          currentLevel: 125000,
          unit: "bbl",
          percentFull: 83,
          lastUpdated: new Date().toISOString(),
          status: "normal",
        },
        {
          tankId: "tank_2",
          product: "Premium Gasoline",
          capacity: 100000,
          currentLevel: 72000,
          unit: "bbl",
          percentFull: 72,
          lastUpdated: new Date().toISOString(),
          status: "normal",
        },
        {
          tankId: "tank_3",
          product: "Diesel",
          capacity: 200000,
          currentLevel: 165000,
          unit: "bbl",
          percentFull: 82.5,
          lastUpdated: new Date().toISOString(),
          status: "normal",
        },
        {
          tankId: "tank_4",
          product: "Jet Fuel",
          capacity: 75000,
          currentLevel: 28000,
          unit: "bbl",
          percentFull: 37,
          lastUpdated: new Date().toISOString(),
          status: "low",
          alert: "Below 40% threshold",
        },
      ];
    }),

  /**
   * Get loading history
   */
  getLoadingHistory: protectedProcedure
    .input(z.object({
      terminalId: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      return [
        {
          id: "load_001",
          date: "2025-01-23",
          carrier: "ABC Transport",
          driver: "Mike Johnson",
          product: "Unleaded Gasoline",
          quantity: 8500,
          unit: "gal",
          loadTime: 42,
          loadTimeUnit: "min",
          rack: "Rack 1",
          bol: "BOL-2025-0001",
        },
        {
          id: "load_002",
          date: "2025-01-23",
          carrier: "FastHaul LLC",
          driver: "Tom Brown",
          product: "Diesel",
          quantity: 9000,
          unit: "gal",
          loadTime: 45,
          loadTimeUnit: "min",
          rack: "Rack 2",
          bol: "BOL-2025-0002",
        },
      ];
    }),

  /**
   * Generate BOL
   */
  generateBOL: protectedProcedure
    .input(z.object({
      appointmentId: z.string(),
      productId: z.string(),
      quantity: z.number(),
      destination: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        bolNumber: `BOL-2025-${Date.now().toString().slice(-4)}`,
        generatedAt: new Date().toISOString(),
        downloadUrl: `/api/bol/${input.appointmentId}/download`,
      };
    }),
});
