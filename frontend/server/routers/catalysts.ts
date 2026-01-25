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
   * Get exceptions for CatalystExceptions page
   */
  getExceptions: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.string().optional(),
      type: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const exceptions = [
        { id: "exc_001", loadNumber: "LOAD-45915", type: "breakdown", status: "open", driver: "James Wilson", location: "I-35 Temple, TX", reportedAt: "2025-01-24T10:30:00Z", severity: "high" },
        { id: "exc_002", loadNumber: "LOAD-45918", type: "delay", status: "resolved", driver: "Tom Brown", location: "Beaumont, TX", reportedAt: "2025-01-24T08:00:00Z", severity: "medium" },
        { id: "exc_003", loadNumber: "LOAD-45920", type: "hos", status: "open", driver: "Mike Johnson", location: "Waco, TX", reportedAt: "2025-01-24T14:00:00Z", severity: "low" },
      ];
      let filtered = exceptions;
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(e => e.loadNumber.toLowerCase().includes(q) || e.driver.toLowerCase().includes(q));
      }
      if (input.status) filtered = filtered.filter(e => e.status === input.status);
      if (input.type) filtered = filtered.filter(e => e.type === input.type);
      return filtered;
    }),

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

  /**
   * Get fleet positions for CatalystFleetMap
   */
  getFleetPositions: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          id: "v1",
          unitNumber: "TRK-101",
          driver: "Mike Johnson",
          status: "in_transit",
          location: { city: "Waco", state: "TX", lat: 31.5493, lng: -97.1467 },
          currentLoad: "LOAD-45920",
          destination: "Dallas, TX",
          eta: "2h 15m",
          speed: 62,
        },
        {
          id: "v2",
          unitNumber: "TRK-102",
          driver: "Sarah Williams",
          status: "available",
          location: { city: "Dallas", state: "TX", lat: 32.7767, lng: -96.7970 },
          currentLoad: null,
          hoursAvailable: 10,
        },
        {
          id: "v3",
          unitNumber: "TRK-103",
          driver: "Tom Brown",
          status: "loading",
          location: { city: "Port Arthur", state: "TX", lat: 29.95, lng: -93.99 },
          currentLoad: "LOAD-45922",
          loadingProgress: 75,
        },
        {
          id: "v4",
          unitNumber: "TRK-104",
          driver: "Lisa Chen",
          status: "breakdown",
          location: { city: "Temple", state: "TX", lat: 31.1171, lng: -97.3428 },
          currentLoad: "LOAD-45923",
          issue: "Flat tire - roadside assistance en route",
        },
        {
          id: "v5",
          unitNumber: "TRK-105",
          driver: "James Wilson",
          status: "available",
          location: { city: "Austin", state: "TX", lat: 30.2672, lng: -97.7431 },
          currentLoad: null,
          hoursAvailable: 11,
        },
        {
          id: "v6",
          unitNumber: "TRK-106",
          driver: "Maria Garcia",
          status: "off_duty",
          location: { city: "Houston", state: "TX", lat: 29.7604, lng: -95.3698 },
          currentLoad: null,
          offDutySince: "10:00 PM",
        },
      ];
    }),

  /**
   * Get fleet statistics
   */
  getFleetStats: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        inTransit: 8,
        loading: 3,
        available: 4,
        issues: 2,
        offDuty: 3,
        totalVehicles: 20,
        utilization: 65,
      };
    }),

  /**
   * Get exceptions list for CatalystExceptions page (detailed version)
   */
  getExceptionsDetailed: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.string().optional(),
      type: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const exceptions = [
        {
          id: "exc1",
          title: "Vehicle Breakdown - Flat Tire",
          type: "breakdown",
          severity: "high",
          status: "in_progress",
          description: "TRK-104 has a flat tire on I-35 near Temple. Roadside assistance dispatched, ETA 45 minutes.",
          vehicle: "TRK-104",
          driver: "Lisa Chen",
          load: "LOAD-45923",
          reportedAt: "10:30 AM",
          estimatedDelay: 90,
        },
        {
          id: "exc2",
          title: "Customer Delay at Receiver",
          type: "delay",
          severity: "medium",
          status: "open",
          description: "Receiver facility backed up, 3 trucks in queue. Estimated wait time 2 hours.",
          vehicle: "TRK-107",
          driver: "Robert Davis",
          load: "LOAD-45918",
          reportedAt: "11:15 AM",
          estimatedDelay: 120,
        },
        {
          id: "exc3",
          title: "HOS Violation Risk",
          type: "hos_violation",
          severity: "critical",
          status: "open",
          description: "Driver approaching 11-hour limit, may not complete delivery without relief driver.",
          vehicle: "TRK-108",
          driver: "Kevin Park",
          load: "LOAD-45925",
          reportedAt: "11:45 AM",
          hoursRemaining: 0.5,
        },
        {
          id: "exc4",
          title: "Weather Advisory",
          type: "weather",
          severity: "low",
          status: "monitoring",
          description: "Thunderstorm warning for I-10 corridor. Monitoring conditions.",
          vehicle: null,
          driver: null,
          load: null,
          reportedAt: "09:00 AM",
          affectedRoutes: ["Houston-San Antonio", "Houston-Beaumont"],
        },
      ];

      let filtered = exceptions;
      if (input.search) {
        const s = input.search.toLowerCase();
        filtered = filtered.filter(e => 
          e.title.toLowerCase().includes(s) ||
          e.description.toLowerCase().includes(s) ||
          e.driver?.toLowerCase().includes(s) ||
          e.vehicle?.toLowerCase().includes(s)
        );
      }
      if (input.status) {
        filtered = filtered.filter(e => e.status === input.status);
      }
      if (input.type) {
        filtered = filtered.filter(e => e.type === input.type);
      }

      return filtered;
    }),

  /**
   * Get exception statistics
   */
  getExceptionStats: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        critical: 1,
        open: 3,
        inProgress: 1,
        monitoring: 1,
        resolvedToday: 5,
        avgResolutionTime: 45,
      };
    }),
});
