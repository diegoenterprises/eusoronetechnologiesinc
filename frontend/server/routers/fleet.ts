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
   * Get geofences for GeofenceManagement page
   */
  getGeofences: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ input }) => {
      const geofences = [
        { id: "g1", name: "Houston Terminal", type: "terminal", radius: 500, lat: 29.7604, lng: -95.3698, alerts: true },
        { id: "g2", name: "Dallas Yard", type: "yard", radius: 300, lat: 32.7767, lng: -96.7970, alerts: true },
        { id: "g3", name: "Austin Hub", type: "hub", radius: 400, lat: 30.2672, lng: -97.7431, alerts: false },
      ];
      if (input.search) {
        const q = input.search.toLowerCase();
        return geofences.filter(g => g.name.toLowerCase().includes(q));
      }
      return geofences;
    }),

  /**
   * Get geofence stats for GeofenceManagement page
   */
  getGeofenceStats: protectedProcedure
    .query(async () => {
      return { total: 12, terminals: 4, yards: 5, hubs: 3, alertsEnabled: 10 };
    }),

  /**
   * Delete geofence mutation
   */
  deleteGeofence: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, deletedId: input.id };
    }),

  /**
   * Get vehicles for FleetManagement
   */
  getVehicles: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const vehicles = [
        { id: "v1", unitNumber: "TRK-101", type: "truck", make: "Peterbilt", model: "579", year: 2022, status: "active", driver: "Mike Johnson", location: "Houston, TX" },
        { id: "v2", unitNumber: "TRK-102", type: "truck", make: "Kenworth", model: "T680", year: 2021, status: "active", driver: "Sarah Williams", location: "Dallas, TX" },
        { id: "v3", unitNumber: "TRK-103", type: "truck", make: "Freightliner", model: "Cascadia", year: 2023, status: "maintenance", driver: null, location: "Austin, TX" },
        { id: "v4", unitNumber: "TNK-201", type: "tanker", make: "Heil", model: "8400", year: 2022, status: "active", driver: "Tom Brown", location: "Beaumont, TX" },
      ];
      let filtered = vehicles;
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(v => v.unitNumber.toLowerCase().includes(q) || v.make.toLowerCase().includes(q));
      }
      if (input.status && input.status !== "all") {
        filtered = filtered.filter(v => v.status === input.status);
      }
      return filtered;
    }),

  /**
   * Get fleet stats for FleetManagement
   */
  getFleetStats: protectedProcedure
    .query(async () => {
      return {
        totalVehicles: 24,
        active: 18,
        inMaintenance: 4,
        outOfService: 2,
        utilization: 75,
      };
    }),

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

  /**
   * Get maintenance history for VehicleDetails page
   */
  getMaintenanceHistory: protectedProcedure
    .input(z.object({ vehicleId: z.string(), limit: z.number().optional().default(5) }))
    .query(async ({ input }) => {
      return [
        { id: "m1", type: "Oil Change", date: "2025-01-15", cost: 150, mileage: 124500, provider: "FleetServ" },
        { id: "m2", type: "Tire Rotation", date: "2025-01-01", cost: 80, mileage: 123000, provider: "TireMax" },
        { id: "m3", type: "Brake Inspection", date: "2024-12-15", cost: 200, mileage: 121500, provider: "FleetServ" },
      ];
    }),

  /**
   * Get inspections for VehicleDetails page
   */
  getInspections: protectedProcedure
    .input(z.object({ vehicleId: z.string(), limit: z.number().optional().default(5) }))
    .query(async ({ input }) => {
      return [
        { id: "i1", type: "Pre-trip", date: "2025-01-23", status: "passed", driver: "Mike Johnson", issues: 0 },
        { id: "i2", type: "Post-trip", date: "2025-01-22", status: "passed", driver: "Mike Johnson", issues: 0 },
        { id: "i3", type: "DOT Inspection", date: "2025-01-20", status: "passed", driver: "Mike Johnson", issues: 1 },
      ];
    }),

  // Maintenance
  completeMaintenance: protectedProcedure.input(z.object({ maintenanceId: z.string(), notes: z.string().optional() })).mutation(async ({ input }) => ({ success: true, maintenanceId: input.maintenanceId })),
  getMaintenanceStats: protectedProcedure.query(async () => ({ scheduled: 12, overdue: 2, completed: 150, avgCost: 450 })),

  // DVIRs
  getDVIRs: protectedProcedure.input(z.object({ vehicleId: z.string().optional(), status: z.string().optional() })).query(async () => [{ id: "dvir1", vehicleId: "v1", driver: "Mike Johnson", status: "passed", date: "2025-01-23" }]),
  getDVIRStats: protectedProcedure.query(async () => ({ total: 450, passed: 440, defects: 10, openDefects: 2 })),

  // Drivers
  getDrivers: protectedProcedure.input(z.object({ status: z.string().optional() })).query(async () => [{ id: "d1", name: "Mike Johnson", status: "active", vehicleId: "v1" }]),
  getDriverStats: protectedProcedure.query(async () => ({ total: 25, active: 22, inactive: 3 })),

  // Equipment
  getEquipment: protectedProcedure.input(z.object({ type: z.string().optional() })).query(async () => [{ id: "e1", type: "trailer", number: "TRL-101", status: "active" }]),
  getEquipmentStats: protectedProcedure.query(async () => ({ trucks: 25, trailers: 30, other: 5 })),

  // Fleet Map
  getFleetMapStats: protectedProcedure.query(async () => ({ moving: 18, stopped: 5, idle: 2, offline: 0, totalVehicles: 25, inTransit: 18, loading: 3, available: 2, atShipper: 1, atConsignee: 1, offDuty: 0, issues: 2, utilization: 92 })),
  getVehicleLocations: protectedProcedure.query(async () => [{ vehicleId: "v1", lat: 29.7604, lng: -95.3698, heading: 45, speed: 65 }]),

  // Fuel
  getFuelTransactions: protectedProcedure.input(z.object({ vehicleId: z.string().optional(), limit: z.number().optional() })).query(async () => [{ id: "f1", vehicleId: "v1", gallons: 125, cost: 437.50, location: "Houston, TX", date: "2025-01-22" }]),
  getFuelStats: protectedProcedure.query(async () => ({ totalGallons: 2450, totalCost: 8575, avgMPG: 6.8, avgCostPerGallon: 3.50 })),

  // GPS
  getGPSLocations: protectedProcedure.query(async () => [{ vehicleId: "v1", lat: 29.7604, lng: -95.3698, speed: 65, heading: 45, timestamp: new Date().toISOString() }]),
  getGPSStats: protectedProcedure.query(async () => ({ totalVehicles: 25, tracking: 24, offline: 1 })),

  // IFTA
  getIFTAReport: protectedProcedure.input(z.object({ quarter: z.string(), year: z.number() })).query(async ({ input }) => ({ quarter: input.quarter, year: input.year, totalMiles: 125000, totalGallons: 18500, fuelTax: 2850 })),
  getIFTAStats: protectedProcedure.query(async () => ({ totalMiles: 500000, totalGallons: 74000, taxesDue: 11400 })),
  generateIFTAReport: protectedProcedure.input(z.object({ quarter: z.string(), year: z.number() })).mutation(async ({ input }) => ({ success: true, reportId: "ifta_123" })),
});
