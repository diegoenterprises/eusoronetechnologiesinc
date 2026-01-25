/**
 * DISPATCH ROUTER
 * tRPC procedures for dispatch board and driver assignment
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const loadStatusSchema = z.enum([
  "unassigned", "assigned", "en_route_pickup", "at_pickup", 
  "loading", "en_route_delivery", "at_delivery", "unloading", "delivered"
]);

const driverStatusSchema = z.enum([
  "available", "assigned", "driving", "on_duty", "off_duty", "sleeper"
]);

export const dispatchRouter = router({
  /**
   * Get dashboard stats for CatalystDashboard
   */
  getDashboardStats: protectedProcedure
    .query(async () => {
      return {
        active: 12,
        unassigned: 3,
        enRoute: 5,
        loading: 2,
        inTransit: 4,
        issues: 1,
        completedToday: 8,
      };
    }),

  /**
   * Get driver statuses
   */
  getDriverStatuses: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async () => {
      return [
        { id: "d1", name: "Mike Johnson", status: "driving", load: "LOAD-45920", location: "Waco, TX", hoursRemaining: 6.5 },
        { id: "d2", name: "Sarah Williams", status: "available", load: null, location: "Houston, TX", hoursRemaining: 10 },
        { id: "d3", name: "Tom Brown", status: "on_duty", load: "LOAD-45918", location: "Beaumont, TX", hoursRemaining: 8 },
        { id: "d4", name: "Lisa Chen", status: "sleeper", load: null, location: "Dallas, TX", hoursRemaining: 11 },
        { id: "d5", name: "Bob Davis", status: "off_duty", load: null, location: "Austin, TX", hoursRemaining: 11 },
      ];
    }),

  /**
   * Get active issues
   */
  getActiveIssues: protectedProcedure
    .query(async () => {
      return [
        {
          id: "issue_001",
          type: "breakdown",
          severity: "high",
          load: "LOAD-45915",
          driver: "James Wilson",
          location: "I-35 near Temple, TX",
          reportedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: "pending",
          description: "Flat tire - awaiting roadside assistance",
        },
      ];
    }),

  /**
   * Get unassigned loads
   */
  getUnassignedLoads: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async () => {
      return [
        {
          id: "load_u1",
          loadNumber: "LOAD-45925",
          origin: "Houston, TX",
          destination: "Dallas, TX",
          pickupTime: "2025-01-25 08:00",
          rate: 2450,
          urgency: "normal",
        },
        {
          id: "load_u2",
          loadNumber: "LOAD-45926",
          origin: "Beaumont, TX",
          destination: "Austin, TX",
          pickupTime: "2025-01-25 10:00",
          rate: 2800,
          urgency: "high",
        },
        {
          id: "load_u3",
          loadNumber: "LOAD-45927",
          origin: "Port Arthur, TX",
          destination: "San Antonio, TX",
          pickupTime: "2025-01-25 14:00",
          rate: 3100,
          urgency: "normal",
        },
      ];
    }),

  /**
   * Get dispatch board data
   */
  getBoard: protectedProcedure
    .input(z.object({
      status: loadStatusSchema.optional(),
      dateRange: z.object({
        start: z.string(),
        end: z.string(),
      }).optional(),
    }))
    .query(async ({ input }) => {
      const loads = [
        {
          id: "load_001",
          loadNumber: "LOAD-45921",
          status: "unassigned",
          origin: { city: "Houston", state: "TX" },
          destination: { city: "Dallas", state: "TX" },
          pickupDate: "2025-01-24T08:00:00",
          deliveryDate: "2025-01-24T16:00:00",
          commodity: "Gasoline",
          hazmatClass: "3",
          weight: 42000,
          rate: 2450,
          distance: 240,
          assignedDriver: null,
        },
        {
          id: "load_002",
          loadNumber: "LOAD-45922",
          status: "assigned",
          origin: { city: "Beaumont", state: "TX" },
          destination: { city: "San Antonio", state: "TX" },
          pickupDate: "2025-01-24T10:00:00",
          deliveryDate: "2025-01-24T20:00:00",
          commodity: "Diesel",
          hazmatClass: "3",
          weight: 40000,
          rate: 3200,
          distance: 320,
          assignedDriver: { id: "drv_002", name: "Sarah Williams" },
        },
        {
          id: "load_003",
          loadNumber: "LOAD-45920",
          status: "en_route_delivery",
          origin: { city: "Port Arthur", state: "TX" },
          destination: { city: "Austin", state: "TX" },
          pickupDate: "2025-01-24T06:00:00",
          deliveryDate: "2025-01-24T14:00:00",
          commodity: "Jet Fuel",
          hazmatClass: "3",
          weight: 38000,
          rate: 2800,
          distance: 280,
          assignedDriver: { id: "drv_001", name: "Mike Johnson" },
          currentLocation: { city: "Waco", state: "TX", lat: 31.5493, lng: -97.1467 },
          eta: "2:30 PM",
        },
      ];

      const summary = {
        total: loads.length,
        unassigned: loads.filter(l => l.status === "unassigned").length,
        assigned: loads.filter(l => l.status === "assigned").length,
        inTransit: loads.filter(l => l.status.includes("en_route") || l.status.includes("at_")).length,
        delivered: loads.filter(l => l.status === "delivered").length,
      };

      return { loads, summary };
    }),

  /**
   * Get available drivers for assignment
   */
  getAvailableDrivers: protectedProcedure
    .input(z.object({
      hazmatRequired: z.boolean().optional(),
      tankerRequired: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      const drivers = [
        {
          id: "drv_001",
          name: "Mike Johnson",
          status: "driving",
          currentLocation: { city: "Waco", state: "TX" },
          hosRemaining: { driving: 240, onDuty: 360 },
          endorsements: ["hazmat", "tanker", "doubles"],
          safetyScore: 95,
          currentLoad: "LOAD-45920",
        },
        {
          id: "drv_002",
          name: "Sarah Williams",
          status: "available",
          currentLocation: { city: "Houston", state: "TX" },
          hosRemaining: { driving: 660, onDuty: 840 },
          endorsements: ["hazmat", "tanker"],
          safetyScore: 92,
          currentLoad: null,
        },
        {
          id: "drv_003",
          name: "Tom Brown",
          status: "available",
          currentLocation: { city: "Dallas", state: "TX" },
          hosRemaining: { driving: 540, onDuty: 720 },
          endorsements: ["hazmat", "tanker", "doubles"],
          safetyScore: 98,
          currentLoad: null,
        },
        {
          id: "drv_004",
          name: "Lisa Chen",
          status: "off_duty",
          currentLocation: { city: "Austin", state: "TX" },
          hosRemaining: { driving: 660, onDuty: 840 },
          endorsements: ["hazmat"],
          safetyScore: 88,
          currentLoad: null,
          availableAt: "2025-01-24T06:00:00",
        },
      ];

      let filtered = drivers;

      if (input.hazmatRequired) {
        filtered = filtered.filter(d => d.endorsements.includes("hazmat"));
      }
      if (input.tankerRequired) {
        filtered = filtered.filter(d => d.endorsements.includes("tanker"));
      }

      return filtered;
    }),

  /**
   * Assign driver to load
   */
  assignDriver: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      driverId: z.string(),
      vehicleId: z.string().optional(),
      trailerId: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        loadId: input.loadId,
        driverId: input.driverId,
        assignedAt: new Date().toISOString(),
        assignedBy: ctx.user?.id,
      };
    }),

  /**
   * Unassign driver from load
   */
  unassignDriver: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        loadId: input.loadId,
        unassignedAt: new Date().toISOString(),
      };
    }),

  /**
   * Update load status
   */
  updateLoadStatus: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      status: loadStatusSchema,
      location: z.object({
        lat: z.number(),
        lng: z.number(),
        address: z.string().optional(),
      }).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        loadId: input.loadId,
        newStatus: input.status,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get real-time fleet locations
   */
  getFleetLocations: protectedProcedure
    .query(async () => {
      return [
        {
          driverId: "drv_001",
          driverName: "Mike Johnson",
          loadNumber: "LOAD-45920",
          location: { lat: 31.5493, lng: -97.1467 },
          heading: 315,
          speed: 62,
          status: "driving",
          lastUpdate: new Date().toISOString(),
        },
        {
          driverId: "drv_002",
          driverName: "Sarah Williams",
          loadNumber: null,
          location: { lat: 29.7604, lng: -95.3698 },
          heading: 0,
          speed: 0,
          status: "available",
          lastUpdate: new Date().toISOString(),
        },
      ];
    }),

  /**
   * Send message to driver
   */
  sendDriverMessage: protectedProcedure
    .input(z.object({
      driverId: z.string(),
      message: z.string(),
      priority: z.enum(["normal", "urgent"]).default("normal"),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        messageId: `MSG-${Date.now()}`,
        sentAt: new Date().toISOString(),
      };
    }),

  // Dispatch operations
  getDrivers: protectedProcedure.input(z.object({ status: z.string().optional() })).query(async () => [{ id: "d1", name: "Mike Johnson", status: "available", location: "Houston, TX" }]),
  getDriverStatusStats: protectedProcedure.query(async () => ({ available: 8, driving: 12, onDuty: 3, offDuty: 2 })),
  getLoads: protectedProcedure.input(z.object({ status: z.string().optional() })).query(async () => [{ id: "l1", loadNumber: "LOAD-45920", status: "unassigned", origin: "Houston", destination: "Dallas" }]),
  getSummary: protectedProcedure.query(async () => ({ activeLoads: 15, unassigned: 3, inTransit: 10, issues: 2 })),
  getAlerts: protectedProcedure.query(async () => [{ id: "a1", type: "hos_warning", driverId: "d1", message: "Driver approaching HOS limit", severity: "warning" }]),

  // Exceptions
  getExceptions: protectedProcedure.input(z.object({ status: z.string().optional() })).query(async () => [{ id: "e1", type: "breakdown", loadId: "l1", status: "open", reportedAt: "2025-01-23 10:00" }]),
  getExceptionStats: protectedProcedure.query(async () => ({ open: 3, investigating: 2, resolved: 45 })),
  resolveException: protectedProcedure.input(z.object({ exceptionId: z.string(), resolution: z.string() })).mutation(async ({ input }) => ({ success: true, exceptionId: input.exceptionId })),

  // AI Recommendations
  getRecommendations: protectedProcedure.input(z.object({ loadId: z.string() })).query(async ({ input }) => [{ driverId: "d1", driverName: "Mike Johnson", score: 95, reason: "Best HOS availability and route match" }]),
});
