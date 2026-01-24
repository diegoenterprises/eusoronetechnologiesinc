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
});
