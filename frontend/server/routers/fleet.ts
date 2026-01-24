/**
 * FLEET ROUTER
 * tRPC procedures for fleet and vehicle management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const vehicleStatusSchema = z.enum(["active", "maintenance", "out_of_service", "retired"]);
const vehicleTypeSchema = z.enum(["truck", "trailer", "tanker", "flatbed", "reefer"]);

export const fleetRouter = router({
  /**
   * Get fleet summary
   */
  getSummary: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        totalVehicles: 24,
        active: 18,
        inMaintenance: 4,
        outOfService: 2,
        utilization: 75,
        avgAge: 3.2,
        maintenanceDueThisWeek: 3,
        inspectionsDueThisWeek: 5,
      };
    }),

  /**
   * List all vehicles
   */
  list: protectedProcedure
    .input(z.object({
      type: vehicleTypeSchema.optional(),
      status: vehicleStatusSchema.optional(),
      search: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const vehicles = [
        {
          id: "v1",
          unitNumber: "TRK-101",
          type: "truck",
          make: "Peterbilt",
          model: "579",
          year: 2022,
          vin: "1XPWD40X1ED215467",
          licensePlate: "TX ABC123",
          status: "active",
          currentDriver: { id: "d1", name: "Mike Johnson" },
          currentLocation: { city: "Houston", state: "TX" },
          odometer: 125430,
          fuelLevel: 78,
          lastInspection: "2025-01-20",
          nextMaintenanceDue: "2025-02-15",
        },
        {
          id: "v2",
          unitNumber: "TRK-102",
          type: "truck",
          make: "Kenworth",
          model: "T680",
          year: 2021,
          vin: "1XKWD49X1EJ123456",
          licensePlate: "TX DEF456",
          status: "active",
          currentDriver: { id: "d2", name: "Sarah Williams" },
          currentLocation: { city: "Dallas", state: "TX" },
          odometer: 187650,
          fuelLevel: 45,
          lastInspection: "2025-01-18",
          nextMaintenanceDue: "2025-01-28",
        },
        {
          id: "v3",
          unitNumber: "TRK-103",
          type: "truck",
          make: "Freightliner",
          model: "Cascadia",
          year: 2023,
          vin: "3AKJHHDR4ESAA1234",
          licensePlate: "TX GHI789",
          status: "maintenance",
          currentDriver: null,
          currentLocation: { city: "San Antonio", state: "TX" },
          odometer: 45200,
          fuelLevel: 92,
          lastInspection: "2025-01-15",
          nextMaintenanceDue: "2025-01-23",
          maintenanceReason: "Scheduled oil change and brake inspection",
        },
        {
          id: "t1",
          unitNumber: "TRL-201",
          type: "tanker",
          make: "Polar",
          model: "DOT 406",
          year: 2020,
          vin: "1P9TA4325LA123456",
          licensePlate: "TX TRL001",
          status: "active",
          capacity: 9000,
          capacityUnit: "gal",
          lastInspection: "2025-01-19",
          nextMaintenanceDue: "2025-03-01",
        },
      ];

      let filtered = vehicles;
      if (input.type) {
        filtered = filtered.filter(v => v.type === input.type);
      }
      if (input.status) {
        filtered = filtered.filter(v => v.status === input.status);
      }
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(v => 
          v.unitNumber.toLowerCase().includes(q) ||
          v.make.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q)
        );
      }

      return {
        vehicles: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
      };
    }),

  /**
   * Get single vehicle by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        unitNumber: "TRK-101",
        type: "truck",
        make: "Peterbilt",
        model: "579",
        year: 2022,
        vin: "1XPWD40X1ED215467",
        licensePlate: "TX ABC123",
        status: "active",
        currentDriver: { id: "d1", name: "Mike Johnson" },
        currentLocation: { lat: 29.7604, lng: -95.3698, city: "Houston", state: "TX" },
        odometer: 125430,
        fuelLevel: 78,
        engineHours: 4520,
        lastInspection: "2025-01-20",
        nextMaintenanceDue: "2025-02-15",
        insurance: {
          provider: "Progressive Commercial",
          policyNumber: "PCT-123456789",
          expirationDate: "2025-12-31",
        },
        registration: {
          state: "TX",
          expirationDate: "2025-06-30",
        },
        specifications: {
          engine: "Cummins X15",
          horsepower: 500,
          transmission: "Eaton Fuller 18-speed",
          fuelCapacity: 300,
          sleeper: true,
        },
      };
    }),

  /**
   * Add new vehicle
   */
  create: protectedProcedure
    .input(z.object({
      unitNumber: z.string(),
      type: vehicleTypeSchema,
      make: z.string(),
      model: z.string(),
      year: z.number(),
      vin: z.string(),
      licensePlate: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `v_${Date.now()}`,
        ...input,
        status: "active",
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Update vehicle
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: vehicleStatusSchema.optional(),
      currentDriverId: z.string().optional(),
      odometer: z.number().optional(),
      licensePlate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        id: input.id,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get vehicle locations (real-time)
   */
  getLocations: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          vehicleId: "v1",
          unitNumber: "TRK-101",
          driverName: "Mike Johnson",
          location: { lat: 29.7604, lng: -95.3698 },
          heading: 45,
          speed: 62,
          status: "moving",
          lastUpdate: new Date().toISOString(),
        },
        {
          vehicleId: "v2",
          unitNumber: "TRK-102",
          driverName: "Sarah Williams",
          location: { lat: 32.7767, lng: -96.7970 },
          heading: 180,
          speed: 0,
          status: "stopped",
          lastUpdate: new Date().toISOString(),
        },
      ];
    }),

  /**
   * Get maintenance schedule
   */
  getMaintenanceSchedule: protectedProcedure
    .input(z.object({ vehicleId: z.string().optional() }))
    .query(async ({ input }) => {
      return [
        {
          id: "m1",
          vehicleId: "v1",
          unitNumber: "TRK-101",
          type: "oil_change",
          description: "Oil and filter change",
          scheduledDate: "2025-02-15",
          status: "scheduled",
          estimatedCost: 450,
        },
        {
          id: "m2",
          vehicleId: "v2",
          unitNumber: "TRK-102",
          type: "brake_inspection",
          description: "Brake pad inspection and replacement",
          scheduledDate: "2025-01-28",
          status: "overdue",
          estimatedCost: 1200,
        },
        {
          id: "m3",
          vehicleId: "v3",
          unitNumber: "TRK-103",
          type: "oil_change",
          description: "Scheduled oil change and brake inspection",
          scheduledDate: "2025-01-23",
          status: "in_progress",
          estimatedCost: 650,
        },
      ];
    }),

  /**
   * Schedule maintenance
   */
  scheduleMaintenance: protectedProcedure
    .input(z.object({
      vehicleId: z.string(),
      type: z.string(),
      description: z.string(),
      scheduledDate: z.string(),
      estimatedCost: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        id: `m_${Date.now()}`,
        ...input,
        status: "scheduled",
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Get fuel consumption data
   */
  getFuelData: protectedProcedure
    .input(z.object({
      vehicleId: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return {
        totalGallons: 2450,
        totalCost: 8575,
        avgMPG: 6.8,
        entries: [
          { date: "2025-01-22", vehicleId: "v1", gallons: 125, cost: 437.50, location: "Houston, TX" },
          { date: "2025-01-21", vehicleId: "v2", gallons: 110, cost: 385.00, location: "Dallas, TX" },
          { date: "2025-01-20", vehicleId: "v1", gallons: 130, cost: 455.00, location: "Austin, TX" },
        ],
      };
    }),
});
