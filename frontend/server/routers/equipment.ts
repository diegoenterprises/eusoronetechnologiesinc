/**
 * EQUIPMENT ROUTER
 * tRPC procedures for equipment/trailer management
 */

import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { vehicles } from "../../drizzle/schema";

const equipmentTypeSchema = z.enum([
  "tanker", "dry_van", "flatbed", "reefer", "lowboy", "step_deck", "container", "hopper"
]);
const equipmentStatusSchema = z.enum([
  "available", "in_use", "maintenance", "out_of_service", "retired"
]);

export const equipmentRouter = router({
  /**
   * List equipment
   */
  list: protectedProcedure
    .input(z.object({
      type: equipmentTypeSchema.optional(),
      status: equipmentStatusSchema.optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const equipment = [
        {
          id: "eq_001",
          unitNumber: "TRL-201",
          type: "tanker",
          status: "in_use",
          capacity: 9000,
          capacityUnit: "gallons",
          make: "Heil",
          model: "9200",
          year: 2022,
          vin: "1H9TK4821NW123456",
          licensePlate: "TX-TRL-201",
          assignedTo: { vehicleId: "v1", unitNumber: "TRK-101" },
          currentLocation: "En route - I-35 N near Waco",
          lastInspection: "2025-01-15",
          nextInspection: "2025-04-15",
        },
        {
          id: "eq_002",
          unitNumber: "TRL-202",
          type: "tanker",
          status: "available",
          capacity: 9000,
          capacityUnit: "gallons",
          make: "Heil",
          model: "9200",
          year: 2021,
          vin: "1H9TK4821MW654321",
          licensePlate: "TX-TRL-202",
          assignedTo: null,
          currentLocation: "Houston Yard",
          lastInspection: "2025-01-10",
          nextInspection: "2025-04-10",
        },
        {
          id: "eq_003",
          unitNumber: "TRL-203",
          type: "tanker",
          status: "maintenance",
          capacity: 8500,
          capacityUnit: "gallons",
          make: "Polar",
          model: "Tank Trailer",
          year: 2020,
          vin: "1P9TK4821LW789012",
          licensePlate: "TX-TRL-203",
          assignedTo: null,
          currentLocation: "Maintenance Shop",
          maintenanceNote: "Valve replacement",
          maintenanceEta: "2025-01-25",
          lastInspection: "2024-12-20",
          nextInspection: "2025-03-20",
        },
      ];

      let filtered = equipment;
      if (input.type) filtered = filtered.filter(e => e.type === input.type);
      if (input.status) filtered = filtered.filter(e => e.status === input.status);

      return {
        equipment: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
        summary: {
          total: equipment.length,
          available: equipment.filter(e => e.status === "available").length,
          inUse: equipment.filter(e => e.status === "in_use").length,
          maintenance: equipment.filter(e => e.status === "maintenance").length,
        },
      };
    }),

  /**
   * Get equipment by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        unitNumber: "TRL-201",
        type: "tanker",
        status: "in_use",
        capacity: 9000,
        capacityUnit: "gallons",
        compartments: [
          { number: 1, capacity: 3000 },
          { number: 2, capacity: 3000 },
          { number: 3, capacity: 3000 },
        ],
        specifications: {
          make: "Heil",
          model: "9200",
          year: 2022,
          vin: "1H9TK4821NW123456",
          licensePlate: "TX-TRL-201",
          length: 42,
          width: 8.5,
          height: 13.5,
          emptyWeight: 14500,
          gvwr: 80000,
        },
        certifications: [
          { type: "DOT", number: "MC-SP-12345", expiresAt: "2026-01-15" },
          { type: "Hazmat", class: "Class 3 Flammable", expiresAt: "2025-07-15" },
        ],
        inspections: {
          lastAnnual: "2025-01-15",
          nextAnnual: "2025-04-15",
          lastDot: "2024-11-20",
        },
        currentAssignment: {
          vehicleId: "v1",
          unitNumber: "TRK-101",
          driverName: "Mike Johnson",
          loadNumber: "LOAD-45850",
          since: "2025-01-23T08:00:00Z",
        },
        maintenanceHistory: [
          { date: "2025-01-10", type: "preventive", description: "Brake inspection", cost: 450 },
          { date: "2024-12-15", type: "repair", description: "Valve seal replacement", cost: 850 },
          { date: "2024-11-01", type: "preventive", description: "Annual inspection", cost: 350 },
        ],
        documents: [
          { type: "registration", name: "Registration 2025", uploadedAt: "2025-01-05" },
          { type: "insurance", name: "Insurance Certificate", uploadedAt: "2025-01-01" },
        ],
      };
    }),

  /**
   * Create equipment
   */
  create: protectedProcedure
    .input(z.object({
      unitNumber: z.string(),
      type: equipmentTypeSchema,
      capacity: z.number(),
      capacityUnit: z.string(),
      make: z.string(),
      model: z.string(),
      year: z.number(),
      vin: z.string(),
      licensePlate: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `eq_${Date.now()}`,
        ...input,
        status: "available",
        createdBy: ctx.user?.id,
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Update equipment
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: equipmentStatusSchema.optional(),
      licensePlate: z.string().optional(),
      currentLocation: z.string().optional(),
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
   * Assign equipment
   */
  assign: protectedProcedure
    .input(z.object({
      equipmentId: z.string(),
      vehicleId: z.string(),
      loadId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        equipmentId: input.equipmentId,
        vehicleId: input.vehicleId,
        assignedBy: ctx.user?.id,
        assignedAt: new Date().toISOString(),
      };
    }),

  /**
   * Unassign equipment
   */
  unassign: protectedProcedure
    .input(z.object({
      equipmentId: z.string(),
      location: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        equipmentId: input.equipmentId,
        unassignedBy: ctx.user?.id,
        unassignedAt: new Date().toISOString(),
      };
    }),

  /**
   * Schedule maintenance
   */
  scheduleMaintenance: protectedProcedure
    .input(z.object({
      equipmentId: z.string(),
      type: z.enum(["preventive", "repair", "inspection"]),
      description: z.string(),
      scheduledDate: z.string(),
      estimatedCost: z.number().optional(),
      vendor: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        maintenanceId: `maint_${Date.now()}`,
        equipmentId: input.equipmentId,
        scheduledBy: ctx.user?.id,
        scheduledAt: new Date().toISOString(),
      };
    }),

  /**
   * Record inspection
   */
  recordInspection: protectedProcedure
    .input(z.object({
      equipmentId: z.string(),
      type: z.enum(["pre_trip", "post_trip", "annual", "dot"]),
      result: z.enum(["pass", "fail", "pass_with_defects"]),
      defects: z.array(z.object({
        category: z.string(),
        description: z.string(),
        severity: z.enum(["minor", "major", "critical"]),
      })).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        inspectionId: `insp_${Date.now()}`,
        equipmentId: input.equipmentId,
        result: input.result,
        inspectedBy: ctx.user?.id,
        inspectedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get equipment utilization
   */
  getUtilization: protectedProcedure
    .input(z.object({
      period: z.enum(["week", "month", "quarter"]).default("month"),
    }))
    .query(async ({ input }) => {
      return {
        period: input.period,
        overall: {
          utilizationRate: 0.78,
          avgDaysInUse: 22,
          avgDaysIdle: 6,
          avgDaysMaintenance: 2,
        },
        byEquipment: [
          { unitNumber: "TRL-201", utilizationRate: 0.85, daysInUse: 25, loads: 18 },
          { unitNumber: "TRL-202", utilizationRate: 0.72, daysInUse: 21, loads: 15 },
          { unitNumber: "TRL-203", utilizationRate: 0.68, daysInUse: 20, loads: 14 },
        ],
        costAnalysis: {
          totalMaintenance: 4500,
          avgPerUnit: 1500,
          revenueGenerated: 125000,
          roi: 27.8,
        },
      };
    }),

  /**
   * Get expiring certifications
   */
  getExpiringCertifications: protectedProcedure
    .input(z.object({
      daysAhead: z.number().default(30),
    }))
    .query(async ({ input }) => {
      return [
        {
          equipmentId: "eq_002",
          unitNumber: "TRL-202",
          certificationType: "Annual Inspection",
          expiresAt: "2025-02-10",
          daysRemaining: 18,
        },
        {
          equipmentId: "eq_003",
          unitNumber: "TRL-203",
          certificationType: "Hazmat Certification",
          expiresAt: "2025-02-15",
          daysRemaining: 23,
        },
      ];
    }),
});
