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
   * Get summary for TerminalDashboard
   */
  getSummary: protectedProcedure
    .query(async () => {
      return {
        todayAppointments: 24,
        trucksCheckedIn: 8,
        currentlyLoading: 5,
        rackUtilization: 65,
        totalInventory: 425000,
        avgLoadTime: 42,
      };
    }),

  /**
   * Get racks status
   */
  getRacks: protectedProcedure
    .query(async () => {
      return [
        { id: "r1", name: "Rack 1", status: "loading", product: "Unleaded", currentLoad: "LOAD-45920", progress: 65 },
        { id: "r2", name: "Rack 2", status: "available", product: null, currentLoad: null },
        { id: "r3", name: "Rack 3", status: "maintenance", product: null, currentLoad: null },
        { id: "r4", name: "Rack 4", status: "loading", product: "Diesel", currentLoad: "LOAD-45918", progress: 30 },
      ];
    }),

  /**
   * Get tanks status
   */
  getTanks: protectedProcedure
    .query(async () => {
      return [
        { id: "t1", name: "Tank 1", product: "Unleaded", level: 82, capacity: 50000, status: "normal" },
        { id: "t2", name: "Tank 2", product: "Premium", level: 45, capacity: 30000, status: "low" },
        { id: "t3", name: "Tank 3", product: "Diesel", level: 78, capacity: 75000, status: "normal" },
        { id: "t4", name: "Tank 4", product: "Jet Fuel", level: 90, capacity: 40000, status: "high" },
      ];
    }),

  /**
   * Get today's appointments
   */
  getTodayAppointments: protectedProcedure
    .query(async () => {
      return [
        { id: "apt_001", time: "08:00", carrier: "ABC Transport", driver: "Mike Johnson", product: "Unleaded", status: "completed" },
        { id: "apt_002", time: "09:00", carrier: "XYZ Carriers", driver: "Sarah Williams", product: "Diesel", status: "loading" },
        { id: "apt_003", time: "10:00", carrier: "FastHaul LLC", driver: "Tom Brown", product: "Premium", status: "checked_in" },
        { id: "apt_004", time: "11:00", carrier: "QuickLoad Inc", driver: "Lisa Chen", product: "Unleaded", status: "scheduled" },
      ];
    }),

  /**
   * Get terminal alerts
   */
  getAlerts: protectedProcedure
    .query(async () => {
      return [
        { id: "alert_001", type: "maintenance", severity: "info", message: "Rack 3 scheduled maintenance at 2:00 PM" },
        { id: "alert_002", type: "inventory", severity: "warning", message: "Tank 2 (Premium) below 50% capacity" },
      ];
    }),

  /**
   * Get appointments for AppointmentScheduling
   */
  getAppointments: protectedProcedure
    .input(z.object({ date: z.string().optional(), terminal: z.string().optional() }))
    .query(async () => {
      return [
        { id: "apt_001", time: "08:00", carrier: "ABC Transport", driver: "Mike Johnson", product: "Unleaded", rack: "Rack 1", status: "completed" },
        { id: "apt_002", time: "09:30", carrier: "XYZ Carriers", driver: "Sarah Williams", product: "Diesel", rack: "Rack 2", status: "scheduled" },
        { id: "apt_003", time: "11:00", carrier: "FastHaul LLC", driver: "Tom Brown", product: "Premium", rack: "Rack 1", status: "scheduled" },
      ];
    }),

  /**
   * Get terminals list
   */
  getTerminals: protectedProcedure
    .query(async () => {
      return [
        { id: "t1", name: "Houston Terminal", location: "Houston, TX", racks: 4, status: "active" },
        { id: "t2", name: "Dallas Terminal", location: "Dallas, TX", racks: 3, status: "active" },
        { id: "t3", name: "Austin Terminal", location: "Austin, TX", racks: 2, status: "active" },
      ];
    }),

  /**
   * Get available slots for AppointmentScheduling
   */
  getAvailableSlots: protectedProcedure
    .input(z.object({ date: z.string(), terminal: z.string() }))
    .query(async () => {
      return [
        { time: "10:00", rack: "Rack 1", available: true },
        { time: "10:30", rack: "Rack 1", available: true },
        { time: "14:00", rack: "Rack 2", available: true },
        { time: "15:00", rack: "Rack 2", available: true },
      ];
    }),

  /**
   * Get appointment stats
   */
  getAppointmentStats: protectedProcedure
    .input(z.object({ date: z.string().optional() }))
    .query(async () => {
      return { total: 24, completed: 8, inProgress: 3, scheduled: 12, cancelled: 1 };
    }),

  /**
   * Book appointment mutation
   */
  bookAppointment: protectedProcedure
    .input(z.object({ date: z.string(), time: z.string(), terminal: z.string(), product: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, appointmentId: `apt_${Date.now()}`, date: input.date, time: input.time };
    }),

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
   * Get today's appointments (detailed version)
   */
  getAppointmentsDetailed: protectedProcedure
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

  /**
   * Get loading bays status
   */
  getLoadingBays: protectedProcedure
    .input(z.object({ terminalId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return [
        {
          id: "bay1",
          name: "Bay 1",
          status: "loading",
          currentLoad: {
            loadNumber: "LOAD-45920",
            product: "Diesel Fuel",
            carrier: "ABC Transport",
            driver: "Mike Johnson",
          },
          progress: 72,
          flowRate: 450,
        },
        {
          id: "bay2",
          name: "Bay 2",
          status: "available",
          currentLoad: null,
          progress: 0,
          flowRate: 0,
        },
        {
          id: "bay3",
          name: "Bay 3",
          status: "unloading",
          currentLoad: {
            loadNumber: "LOAD-45918",
            product: "Gasoline",
            carrier: "FastHaul LLC",
            driver: "Sarah Williams",
          },
          progress: 45,
          flowRate: 380,
        },
        {
          id: "bay4",
          name: "Bay 4",
          status: "maintenance",
          currentLoad: null,
          maintenanceNote: "Pump replacement",
          progress: 0,
          flowRate: 0,
        },
        {
          id: "bay5",
          name: "Bay 5",
          status: "loading",
          currentLoad: {
            loadNumber: "LOAD-45922",
            product: "Jet Fuel",
            carrier: "Premium Logistics",
            driver: "Tom Brown",
          },
          progress: 28,
          flowRate: 420,
        },
        {
          id: "bay6",
          name: "Bay 6",
          status: "available",
          currentLoad: null,
          progress: 0,
          flowRate: 0,
        },
        {
          id: "bay7",
          name: "Bay 7",
          status: "occupied",
          currentLoad: {
            loadNumber: "LOAD-45921",
            product: "Crude Oil",
            carrier: "Bulk Carriers Inc",
            driver: "Lisa Chen",
          },
          progress: 100,
          flowRate: 0,
        },
        {
          id: "bay8",
          name: "Bay 8",
          status: "available",
          currentLoad: null,
          progress: 0,
          flowRate: 0,
        },
      ];
    }),

  /**
   * Get bay statistics
   */
  getBayStats: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        available: 3,
        loading: 2,
        unloading: 1,
        occupied: 1,
        maintenance: 1,
        utilization: 62,
        avgLoadTime: 45,
        throughputToday: 85000,
      };
    }),

  /**
   * Start loading operation
   */
  startLoading: protectedProcedure
    .input(z.object({
      bayId: z.string(),
      loadId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        bayId: input.bayId,
        startedAt: new Date().toISOString(),
        startedBy: ctx.user?.id,
      };
    }),

  /**
   * Complete loading operation
   */
  completeLoading: protectedProcedure
    .input(z.object({
      bayId: z.string(),
      quantity: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        bayId: input.bayId,
        completedAt: new Date().toISOString(),
        completedBy: ctx.user?.id,
      };
    }),

  /**
   * Get tank inventory for TerminalInventory page
   */
  getTankInventory: protectedProcedure
    .input(z.object({ terminalId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return [
        {
          id: "t1",
          name: "Tank 1A",
          product: "Unleaded Gasoline",
          capacity: 150000,
          currentVolume: 125000,
          fillPercent: 83,
          status: "active",
          temperature: 72,
          trend: "down",
          trendValue: 1200,
        },
        {
          id: "t2",
          name: "Tank 1B",
          product: "Premium Gasoline",
          capacity: 100000,
          currentVolume: 72000,
          fillPercent: 72,
          status: "dispensing",
          temperature: 71,
          trend: "down",
          trendValue: 850,
        },
        {
          id: "t3",
          name: "Tank 2A",
          product: "Diesel Fuel",
          capacity: 200000,
          currentVolume: 185000,
          fillPercent: 92,
          status: "receiving",
          temperature: 68,
          trend: "up",
          trendValue: 2500,
        },
        {
          id: "t4",
          name: "Tank 2B",
          product: "Ultra Low Sulfur Diesel",
          capacity: 150000,
          currentVolume: 98000,
          fillPercent: 65,
          status: "active",
          temperature: 69,
          trend: "stable",
          trendValue: 0,
        },
        {
          id: "t5",
          name: "Tank 3A",
          product: "Jet Fuel A",
          capacity: 75000,
          currentVolume: 12000,
          fillPercent: 16,
          status: "active",
          temperature: 65,
          trend: "down",
          trendValue: 400,
        },
        {
          id: "t6",
          name: "Tank 3B",
          product: "Kerosene",
          capacity: 50000,
          currentVolume: 42000,
          fillPercent: 84,
          status: "maintenance",
          temperature: 66,
          trend: "stable",
          trendValue: 0,
        },
      ];
    }),

  /**
   * Get inventory statistics
   */
  getInventoryStats: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        totalCapacity: 725000,
        currentInventory: 534000,
        utilization: 74,
        lowLevelAlerts: 1,
        productsCount: 6,
        lastReceipt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      };
    }),

  /**
   * Get BOLs for BOLGeneration page
   */
  getBOLs: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const bols = [
        {
          id: "bol1",
          bolNumber: "BOL-2025-0001",
          status: "delivered",
          carrier: "ABC Transport LLC",
          driver: "Mike Johnson",
          vehicleNumber: "TRK-101",
          product: "Diesel Fuel",
          quantity: 8500,
          hazmat: true,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          destination: "Houston Terminal B",
        },
        {
          id: "bol2",
          bolNumber: "BOL-2025-0002",
          status: "signed",
          carrier: "FastHaul LLC",
          driver: "Sarah Williams",
          vehicleNumber: "TRK-205",
          product: "Gasoline",
          quantity: 9000,
          hazmat: true,
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          destination: "Dallas Distribution Center",
        },
        {
          id: "bol3",
          bolNumber: "BOL-2025-0003",
          status: "generated",
          carrier: "Bulk Carriers Inc",
          driver: "Tom Brown",
          vehicleNumber: "TRK-312",
          product: "Jet Fuel A",
          quantity: 7500,
          hazmat: true,
          date: new Date().toISOString(),
          destination: "DFW Airport",
        },
        {
          id: "bol4",
          bolNumber: "BOL-2025-0004",
          status: "pending",
          carrier: "Premium Logistics",
          driver: "Lisa Chen",
          vehicleNumber: "TRK-445",
          product: "Ultra Low Sulfur Diesel",
          quantity: 8000,
          hazmat: false,
          date: new Date().toISOString(),
          destination: "San Antonio Depot",
        },
      ];

      let filtered = bols;
      if (input.search) {
        const s = input.search.toLowerCase();
        filtered = filtered.filter(b => 
          b.bolNumber.toLowerCase().includes(s) ||
          b.carrier.toLowerCase().includes(s) ||
          b.driver.toLowerCase().includes(s)
        );
      }
      if (input.status) {
        filtered = filtered.filter(b => b.status === input.status);
      }

      return filtered;
    }),

  /**
   * Get BOL statistics
   */
  getBOLStats: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        generated: 12,
        pending: 3,
        signed: 8,
        delivered: 45,
        voided: 2,
        thisMonth: 68,
      };
    }),

  /**
   * Get terminal equipment status
   */
  getEquipment: protectedProcedure
    .input(z.object({ terminalId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return [
        {
          id: "eq1",
          name: "Pump Station 1",
          type: "pump",
          status: "operational",
          lastMaintenance: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          nextMaintenance: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          flowRate: 600,
          runtime: 4520,
        },
        {
          id: "eq2",
          name: "Pump Station 2",
          type: "pump",
          status: "operational",
          lastMaintenance: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          nextMaintenance: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          flowRate: 550,
          runtime: 3890,
        },
        {
          id: "eq3",
          name: "Flow Meter FM-101",
          type: "meter",
          status: "calibration_due",
          lastCalibration: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString(),
          nextCalibration: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "eq4",
          name: "Tank Gauge TG-1A",
          type: "gauge",
          status: "operational",
          tankId: "t1",
          accuracy: 99.8,
        },
        {
          id: "eq5",
          name: "Loading Arm LA-01",
          type: "loading_arm",
          status: "maintenance",
          maintenanceReason: "Seal replacement",
          estimatedCompletion: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "eq6",
          name: "Vapor Recovery Unit",
          type: "vapor_recovery",
          status: "operational",
          recoveryRate: 98.5,
          lastInspection: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
    }),
});
