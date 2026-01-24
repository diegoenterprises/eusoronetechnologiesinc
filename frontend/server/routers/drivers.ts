/**
 * DRIVERS ROUTER
 * tRPC procedures for driver management
 * Based on 04_DRIVER_USER_JOURNEY.md
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const driverStatusSchema = z.enum(["available", "on_load", "off_duty", "inactive"]);
const dutyStatusSchema = z.enum(["off_duty", "sleeper", "driving", "on_duty"]);

export const driversRouter = router({
  /**
   * List all drivers
   */
  list: protectedProcedure
    .input(z.object({
      status: driverStatusSchema.optional(),
      search: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const drivers = [
        {
          id: "d1",
          name: "Mike Johnson",
          phone: "555-0101",
          email: "mike.j@example.com",
          status: "on_load",
          currentLoad: "LOAD-45920",
          location: { city: "Houston", state: "TX" },
          hoursRemaining: 6.5,
          safetyScore: 95,
          hireDate: "2022-03-15",
        },
        {
          id: "d2",
          name: "Sarah Williams",
          phone: "555-0102",
          email: "sarah.w@example.com",
          status: "available",
          location: { city: "Dallas", state: "TX" },
          hoursRemaining: 10,
          safetyScore: 92,
          hireDate: "2021-06-01",
        },
        {
          id: "d3",
          name: "Tom Brown",
          phone: "555-0103",
          email: "tom.b@example.com",
          status: "off_duty",
          location: { city: "Austin", state: "TX" },
          hoursRemaining: 11,
          safetyScore: 88,
          hireDate: "2023-01-10",
        },
      ];

      let filtered = drivers;
      if (input.status) {
        filtered = filtered.filter(d => d.status === input.status);
      }
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(d => 
          d.name.toLowerCase().includes(q) ||
          d.email.toLowerCase().includes(q)
        );
      }

      return {
        drivers: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
      };
    }),

  /**
   * Get driver by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        name: "Mike Johnson",
        phone: "555-0101",
        email: "mike.j@example.com",
        status: "on_load",
        currentLoad: "LOAD-45920",
        location: { lat: 29.7604, lng: -95.3698, city: "Houston", state: "TX" },
        hoursRemaining: 6.5,
        safetyScore: 95,
        hireDate: "2022-03-15",
        cdl: {
          number: "TX12345678",
          class: "A",
          endorsements: ["H", "N", "T"],
          expirationDate: "2026-03-15",
        },
        medicalCard: {
          expirationDate: "2025-11-15",
          status: "valid",
        },
        homeTerminal: "Houston, TX",
        payRate: {
          type: "per_mile",
          rate: 0.55,
        },
        stats: {
          loadsThisMonth: 8,
          milesThisMonth: 7245,
          earningsThisMonth: 6776.75,
          onTimeRate: 96,
        },
      };
    }),

  /**
   * Get driver HOS status
   */
  getHOSStatus: protectedProcedure
    .input(z.object({ driverId: z.string() }))
    .query(async ({ input }) => {
      return {
        driverId: input.driverId,
        currentStatus: "driving",
        statusStartTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        hoursAvailable: {
          driving: 6.5,
          onDuty: 8.0,
          cycle: 52.5,
        },
        violations: [],
        lastBreak: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        nextBreakRequired: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        cycleReset: "2025-01-27T00:00:00Z",
      };
    }),

  /**
   * Update driver status
   */
  updateStatus: protectedProcedure
    .input(z.object({
      driverId: z.string(),
      status: driverStatusSchema,
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        driverId: input.driverId,
        newStatus: input.status,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get driver location history
   */
  getLocationHistory: protectedProcedure
    .input(z.object({
      driverId: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return [
        { timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), lat: 29.7604, lng: -95.3698, city: "Houston", state: "TX" },
        { timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), lat: 30.2672, lng: -95.7889, city: "Conroe", state: "TX" },
        { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), lat: 30.6280, lng: -96.3344, city: "Bryan", state: "TX" },
        { timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), lat: 31.1171, lng: -97.7278, city: "Killeen", state: "TX" },
        { timestamp: new Date().toISOString(), lat: 31.5493, lng: -97.1467, city: "Waco", state: "TX" },
      ];
    }),

  /**
   * Get driver performance metrics
   */
  getPerformanceMetrics: protectedProcedure
    .input(z.object({
      driverId: z.string(),
      period: z.enum(["week", "month", "quarter", "year"]).default("month"),
    }))
    .query(async ({ input }) => {
      return {
        driverId: input.driverId,
        period: input.period,
        metrics: {
          totalMiles: 7245,
          totalLoads: 8,
          onTimeDeliveryRate: 96,
          safetyScore: 95,
          fuelEfficiency: 6.8,
          customerRating: 4.8,
          hosCompliance: 100,
          inspectionPassRate: 100,
        },
        rankings: {
          overall: 1,
          totalDrivers: 18,
          safetyRank: 1,
          productivityRank: 2,
        },
        trends: {
          safetyScore: { current: 95, previous: 93, change: 2.1 },
          onTimeRate: { current: 96, previous: 94, change: 2.1 },
        },
      };
    }),

  /**
   * Assign load to driver
   */
  assignLoad: protectedProcedure
    .input(z.object({
      driverId: z.string(),
      loadId: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        driverId: input.driverId,
        loadId: input.loadId,
        assignedBy: ctx.user?.id,
        assignedAt: new Date().toISOString(),
      };
    }),

  /**
   * Send message to driver
   */
  sendMessage: protectedProcedure
    .input(z.object({
      driverId: z.string(),
      message: z.string(),
      urgent: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        messageId: `msg_${Date.now()}`,
        sentAt: new Date().toISOString(),
      };
    }),

  /**
   * Get driver documents
   */
  getDocuments: protectedProcedure
    .input(z.object({ driverId: z.string() }))
    .query(async ({ input }) => {
      return [
        { id: "doc1", type: "cdl", name: "Commercial Driver's License", status: "valid", expirationDate: "2026-03-15" },
        { id: "doc2", type: "medical", name: "Medical Certificate", status: "valid", expirationDate: "2025-11-15" },
        { id: "doc3", type: "hazmat", name: "Hazmat Endorsement", status: "valid", expirationDate: "2026-03-15" },
        { id: "doc4", type: "twic", name: "TWIC Card", status: "valid", expirationDate: "2027-01-20" },
        { id: "doc5", type: "mvr", name: "Motor Vehicle Record", status: "valid", lastUpdated: "2024-12-01" },
      ];
    }),

  /**
   * Get available drivers for dispatch
   */
  getAvailable: protectedProcedure
    .input(z.object({
      origin: z.string().optional(),
      equipmentType: z.string().optional(),
      hazmatRequired: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      return [
        {
          id: "d2",
          name: "Sarah Williams",
          location: { city: "Dallas", state: "TX" },
          hoursRemaining: 10,
          currentVehicle: "TRK-102",
          endorsements: ["H", "N", "T"],
          safetyScore: 92,
          distance: 240,
        },
        {
          id: "d4",
          name: "Lisa Chen",
          location: { city: "Fort Worth", state: "TX" },
          hoursRemaining: 11,
          currentVehicle: "TRK-104",
          endorsements: ["H", "N"],
          safetyScore: 90,
          distance: 265,
        },
      ];
    }),
});
