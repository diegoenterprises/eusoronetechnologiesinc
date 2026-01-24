/**
 * CATALYSTS ROUTER
 * tRPC procedures for dispatch/catalyst operations
 * Based on 05_CATALYST_USER_JOURNEY.md
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const loadStatusSchema = z.enum([
  "unassigned", "assigned", "en_route_pickup", "at_pickup", "loading", 
  "in_transit", "at_delivery", "unloading", "delivered", "issue"
]);

export const catalystsRouter = router({
  /**
   * Get dispatch dashboard summary
   */
  getDashboardSummary: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        activeLoads: 24,
        unassigned: 5,
        enRoute: 8,
        loading: 3,
        inTransit: 6,
        issues: 2,
        fleetUtilization: 78,
        avgLoadTime: 42,
      };
    }),

  /**
   * Get dispatch board
   */
  getDispatchBoard: protectedProcedure
    .input(z.object({
      status: loadStatusSchema.optional(),
      priority: z.enum(["all", "high", "normal"]).optional(),
    }))
    .query(async ({ input }) => {
      const loads = [
        {
          id: "load_001",
          loadNumber: "LOAD-45920",
          status: "in_transit",
          priority: "normal",
          shipper: "Shell Oil Company",
          origin: { city: "Houston", state: "TX" },
          destination: { city: "Dallas", state: "TX" },
          pickupTime: "08:00",
          deliveryTime: "16:00",
          driver: { id: "d1", name: "Mike Johnson", phone: "555-0101" },
          vehicle: "TRK-101",
          currentLocation: { city: "Waco", state: "TX" },
          eta: "2 hours",
          progress: 65,
        },
        {
          id: "load_002",
          loadNumber: "LOAD-45921",
          status: "unassigned",
          priority: "high",
          shipper: "ExxonMobil",
          origin: { city: "Beaumont", state: "TX" },
          destination: { city: "San Antonio", state: "TX" },
          pickupTime: "10:00",
          deliveryTime: "18:00",
          driver: null,
          vehicle: null,
          needsAssignment: true,
        },
        {
          id: "load_003",
          loadNumber: "LOAD-45922",
          status: "loading",
          priority: "normal",
          shipper: "Valero",
          origin: { city: "Port Arthur", state: "TX" },
          destination: { city: "Austin", state: "TX" },
          pickupTime: "06:00",
          deliveryTime: "14:00",
          driver: { id: "d3", name: "Tom Brown", phone: "555-0103" },
          vehicle: "TRK-103",
          currentLocation: { city: "Port Arthur", state: "TX" },
          loadingProgress: 75,
        },
        {
          id: "load_004",
          loadNumber: "LOAD-45923",
          status: "issue",
          priority: "high",
          shipper: "Marathon",
          origin: { city: "Galveston", state: "TX" },
          destination: { city: "Fort Worth", state: "TX" },
          pickupTime: "07:00",
          deliveryTime: "15:00",
          driver: { id: "d4", name: "Lisa Chen", phone: "555-0104" },
          vehicle: "TRK-104",
          currentLocation: { city: "Temple", state: "TX" },
          issue: { type: "breakdown", description: "Flat tire, awaiting roadside assistance" },
        },
      ];

      let filtered = loads;
      if (input.status) filtered = filtered.filter(l => l.status === input.status);
      if (input.priority && input.priority !== "all") {
        filtered = filtered.filter(l => l.priority === input.priority);
      }

      return {
        loads: filtered,
        summary: {
          total: loads.length,
          byStatus: {
            unassigned: loads.filter(l => l.status === "unassigned").length,
            inTransit: loads.filter(l => l.status === "in_transit").length,
            loading: loads.filter(l => l.status === "loading").length,
            issue: loads.filter(l => l.status === "issue").length,
          },
        },
      };
    }),

  /**
   * Get available drivers for assignment
   */
  getAvailableDrivers: protectedProcedure
    .input(z.object({
      loadId: z.string().optional(),
      nearLocation: z.object({ city: z.string(), state: z.string() }).optional(),
    }))
    .query(async ({ input }) => {
      return [
        {
          id: "d2",
          name: "Sarah Williams",
          phone: "555-0102",
          vehicle: "TRK-102",
          location: { city: "Dallas", state: "TX" },
          hoursRemaining: 10,
          distanceToPickup: 240,
          etaToPickup: 4,
          safetyScore: 92,
          endorsements: ["H", "N", "T"],
          recommended: true,
          recommendationReason: "Closest available driver with hazmat endorsement",
        },
        {
          id: "d5",
          name: "James Wilson",
          phone: "555-0105",
          vehicle: "TRK-105",
          location: { city: "Austin", state: "TX" },
          hoursRemaining: 11,
          distanceToPickup: 280,
          etaToPickup: 4.5,
          safetyScore: 88,
          endorsements: ["H", "N"],
          recommended: false,
        },
      ];
    }),

  /**
   * Assign driver to load
   */
  assignDriver: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      driverId: z.string(),
      vehicleId: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        loadId: input.loadId,
        driverId: input.driverId,
        assignedBy: ctx.user?.id,
        assignedAt: new Date().toISOString(),
        notificationSent: true,
      };
    }),

  /**
   * Update load status
   */
  updateLoadStatus: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      status: loadStatusSchema,
      notes: z.string().optional(),
      location: z.object({ lat: z.number(), lng: z.number() }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        loadId: input.loadId,
        newStatus: input.status,
        updatedBy: ctx.user?.id,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get driver status board
   */
  getDriverStatusBoard: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          id: "d1",
          name: "Mike Johnson",
          status: "driving",
          currentLoad: "LOAD-45920",
          vehicle: "TRK-101",
          location: { city: "Waco", state: "TX" },
          hoursRemaining: { driving: 6.5, onDuty: 8 },
          eta: "2 hours",
          lastUpdate: new Date().toISOString(),
        },
        {
          id: "d2",
          name: "Sarah Williams",
          status: "available",
          currentLoad: null,
          vehicle: "TRK-102",
          location: { city: "Dallas", state: "TX" },
          hoursRemaining: { driving: 10, onDuty: 12 },
          lastUpdate: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
        {
          id: "d3",
          name: "Tom Brown",
          status: "on_duty",
          currentLoad: "LOAD-45922",
          vehicle: "TRK-103",
          location: { city: "Port Arthur", state: "TX" },
          hoursRemaining: { driving: 9, onDuty: 10 },
          activity: "Loading at terminal",
          lastUpdate: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        },
        {
          id: "d4",
          name: "Lisa Chen",
          status: "issue",
          currentLoad: "LOAD-45923",
          vehicle: "TRK-104",
          location: { city: "Temple", state: "TX" },
          hoursRemaining: { driving: 7, onDuty: 9 },
          issue: "Breakdown - flat tire",
          lastUpdate: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
      ];
    }),

  /**
   * Report exception/issue
   */
  reportException: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      type: z.enum(["breakdown", "delay", "accident", "weather", "customer", "other"]),
      description: z.string(),
      severity: z.enum(["low", "medium", "high", "critical"]),
      estimatedDelay: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `exc_${Date.now()}`,
        loadId: input.loadId,
        type: input.type,
        reportedBy: ctx.user?.id,
        reportedAt: new Date().toISOString(),
        status: "open",
      };
    }),

  /**
   * Resolve exception
   */
  resolveException: protectedProcedure
    .input(z.object({
      exceptionId: z.string(),
      resolution: z.string(),
      actualDelay: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        exceptionId: input.exceptionId,
        resolvedBy: ctx.user?.id,
        resolvedAt: new Date().toISOString(),
      };
    }),

  /**
   * Send message to driver
   */
  messageDriver: protectedProcedure
    .input(z.object({
      driverId: z.string(),
      message: z.string(),
      urgent: z.boolean().default(false),
      loadId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        messageId: `msg_${Date.now()}`,
        sentTo: input.driverId,
        sentAt: new Date().toISOString(),
      };
    }),

  /**
   * Get ESANG AI driver recommendations
   */
  getAIRecommendations: protectedProcedure
    .input(z.object({ loadId: z.string() }))
    .query(async ({ input }) => {
      return {
        loadId: input.loadId,
        recommendations: [
          {
            driverId: "d2",
            driverName: "Sarah Williams",
            score: 95,
            reasons: [
              "Closest available driver (240 miles)",
              "10 hours driving time remaining",
              "Hazmat certified",
              "92% safety score",
              "98% on-time delivery rate on this lane",
            ],
            estimatedCost: 850,
            estimatedProfit: 1600,
          },
          {
            driverId: "d5",
            driverName: "James Wilson",
            score: 82,
            reasons: [
              "280 miles from pickup",
              "11 hours driving time remaining",
              "Hazmat certified",
              "88% safety score",
            ],
            estimatedCost: 920,
            estimatedProfit: 1530,
          },
        ],
        generatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get fleet map data
   */
  getFleetMapData: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        vehicles: [
          { id: "v1", unitNumber: "TRK-101", lat: 31.5493, lng: -97.1467, heading: 15, status: "moving", driverName: "Mike Johnson", loadNumber: "LOAD-45920" },
          { id: "v2", unitNumber: "TRK-102", lat: 32.7767, lng: -96.7970, heading: 0, status: "stopped", driverName: "Sarah Williams", loadNumber: null },
          { id: "v3", unitNumber: "TRK-103", lat: 29.95, lng: -93.99, heading: 270, status: "loading", driverName: "Tom Brown", loadNumber: "LOAD-45922" },
          { id: "v4", unitNumber: "TRK-104", lat: 31.1171, lng: -97.3428, heading: 0, status: "breakdown", driverName: "Lisa Chen", loadNumber: "LOAD-45923" },
        ],
        facilities: [
          { id: "f1", name: "Shell Houston Terminal", lat: 29.7604, lng: -95.3698, type: "terminal" },
          { id: "f2", name: "Dallas Yard", lat: 32.7767, lng: -96.7970, type: "yard" },
        ],
        lastUpdated: new Date().toISOString(),
      };
    }),
});
