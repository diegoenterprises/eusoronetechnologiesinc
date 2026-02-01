/**
 * INSPECTION FORMS ROUTER
 * tRPC procedures for DVIR and inspection form management
 */

import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { vehicles, drivers } from "../../drizzle/schema";

const inspectionTypeSchema = z.enum(["pre_trip", "post_trip", "en_route", "dot", "annual"]);
const defectSeveritySchema = z.enum(["minor", "major", "critical", "oos"]);

export const inspectionFormsRouter = router({
  /**
   * List inspections
   */
  list: protectedProcedure
    .input(z.object({
      vehicleId: z.string().optional(),
      driverId: z.string().optional(),
      type: inspectionTypeSchema.optional(),
      hasDefects: z.boolean().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const inspections = [
        {
          id: "insp_001",
          type: "pre_trip",
          vehicleId: "v1",
          unitNumber: "TRK-101",
          trailerId: "eq_001",
          trailerNumber: "TRL-201",
          driverId: "d1",
          driverName: "Mike Johnson",
          date: "2025-01-23",
          time: "06:30",
          location: "Houston Yard",
          result: "satisfactory",
          defectsFound: 0,
          odometer: 458250,
        },
        {
          id: "insp_002",
          type: "post_trip",
          vehicleId: "v1",
          unitNumber: "TRK-101",
          trailerId: "eq_001",
          trailerNumber: "TRL-201",
          driverId: "d1",
          driverName: "Mike Johnson",
          date: "2025-01-22",
          time: "18:45",
          location: "Dallas Yard",
          result: "defects_noted",
          defectsFound: 1,
          odometer: 458150,
        },
        {
          id: "insp_003",
          type: "pre_trip",
          vehicleId: "v2",
          unitNumber: "TRK-102",
          trailerId: "eq_002",
          trailerNumber: "TRL-202",
          driverId: "d2",
          driverName: "Sarah Williams",
          date: "2025-01-23",
          time: "07:00",
          location: "Houston Yard",
          result: "satisfactory",
          defectsFound: 0,
          odometer: 445320,
        },
      ];

      let filtered = inspections;
      if (input.vehicleId) filtered = filtered.filter(i => i.vehicleId === input.vehicleId);
      if (input.driverId) filtered = filtered.filter(i => i.driverId === input.driverId);
      if (input.type) filtered = filtered.filter(i => i.type === input.type);
      if (input.hasDefects !== undefined) {
        filtered = filtered.filter(i => input.hasDefects ? i.defectsFound > 0 : i.defectsFound === 0);
      }

      return {
        inspections: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
      };
    }),

  /**
   * Get inspection by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        type: "post_trip",
        vehicle: {
          id: "v1",
          unitNumber: "TRK-101",
          vin: "1HTMKAAN5CH123456",
          licensePlate: "TX-ABC-101",
        },
        trailer: {
          id: "eq_001",
          unitNumber: "TRL-201",
          licensePlate: "TX-TRL-201",
        },
        driver: {
          id: "d1",
          name: "Mike Johnson",
          cdlNumber: "TX-12345678",
        },
        date: "2025-01-22",
        time: "18:45",
        location: "Dallas Yard",
        odometer: 458150,
        result: "defects_noted",
        categories: [
          {
            name: "Cab/Controls",
            items: [
              { item: "Gauges/Warning Indicators", status: "ok" },
              { item: "Windshield Wipers/Washers", status: "ok" },
              { item: "Mirrors", status: "ok" },
              { item: "Horn", status: "ok" },
              { item: "Heater/Defroster", status: "ok" },
              { item: "Emergency Equipment", status: "ok" },
            ],
          },
          {
            name: "Lights",
            items: [
              { item: "Headlights", status: "ok" },
              { item: "Turn Signals", status: "ok" },
              { item: "Brake Lights", status: "ok" },
              { item: "Clearance/Marker Lights", status: "defect", defectNote: "Right rear marker light out" },
              { item: "Reflectors", status: "ok" },
            ],
          },
          {
            name: "Brakes",
            items: [
              { item: "Service Brakes", status: "ok" },
              { item: "Parking Brake", status: "ok" },
              { item: "Brake Drums/Linings", status: "ok" },
              { item: "Air Lines/Connections", status: "ok" },
            ],
          },
          {
            name: "Tires/Wheels",
            items: [
              { item: "Tread Depth", status: "ok" },
              { item: "Tire Condition", status: "ok" },
              { item: "Wheel/Rim Condition", status: "ok" },
              { item: "Lug Nuts", status: "ok" },
            ],
          },
          {
            name: "Coupling Devices",
            items: [
              { item: "Fifth Wheel", status: "ok" },
              { item: "Pintle Hooks", status: "na" },
              { item: "Safety Chains", status: "ok" },
            ],
          },
          {
            name: "Trailer",
            items: [
              { item: "Body/Doors", status: "ok" },
              { item: "Landing Gear", status: "ok" },
              { item: "Tanker Valves", status: "ok" },
              { item: "Vapor Recovery", status: "ok" },
            ],
          },
        ],
        defects: [
          {
            id: "def_001",
            category: "Lights",
            item: "Clearance/Marker Lights",
            severity: "minor",
            description: "Right rear marker light out",
            corrected: true,
            correctedBy: "Shop Technician",
            correctedAt: "2025-01-23T05:00:00Z",
          },
        ],
        certificationStatement: "I certify that this vehicle has been inspected in accordance with 49 CFR 396.11-396.13",
        signature: "Mike Johnson",
        signedAt: "2025-01-22T18:45:00Z",
        reviewedBy: null,
        reviewedAt: null,
      };
    }),

  /**
   * Submit inspection
   */
  submit: protectedProcedure
    .input(z.object({
      type: inspectionTypeSchema,
      vehicleId: z.string(),
      trailerId: z.string().optional(),
      odometer: z.number(),
      location: z.string(),
      items: z.array(z.object({
        category: z.string(),
        item: z.string(),
        status: z.enum(["ok", "defect", "na"]),
        defectNote: z.string().optional(),
        defectSeverity: defectSeveritySchema.optional(),
      })),
      remarks: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const defects = input.items.filter(i => i.status === "defect");
      const hasOOS = defects.some(d => d.defectSeverity === "oos");
      
      return {
        id: `insp_${Date.now()}`,
        type: input.type,
        result: defects.length > 0 ? "defects_noted" : "satisfactory",
        defectsFound: defects.length,
        outOfService: hasOOS,
        submittedBy: ctx.user?.id,
        submittedAt: new Date().toISOString(),
      };
    }),

  /**
   * Report defect
   */
  reportDefect: protectedProcedure
    .input(z.object({
      inspectionId: z.string(),
      category: z.string(),
      item: z.string(),
      severity: defectSeveritySchema,
      description: z.string(),
      photos: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        defectId: `def_${Date.now()}`,
        inspectionId: input.inspectionId,
        requiresImmediate: input.severity === "oos" || input.severity === "critical",
        reportedBy: ctx.user?.id,
        reportedAt: new Date().toISOString(),
      };
    }),

  /**
   * Correct defect
   */
  correctDefect: protectedProcedure
    .input(z.object({
      defectId: z.string(),
      correctionNotes: z.string(),
      partsUsed: z.array(z.object({
        partNumber: z.string(),
        description: z.string(),
        quantity: z.number(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        defectId: input.defectId,
        correctedBy: ctx.user?.id,
        correctedAt: new Date().toISOString(),
      };
    }),

  /**
   * Review inspection
   */
  review: protectedProcedure
    .input(z.object({
      inspectionId: z.string(),
      approved: z.boolean(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        inspectionId: input.inspectionId,
        reviewedBy: ctx.user?.id,
        reviewedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get inspection templates
   */
  getTemplates: protectedProcedure
    .input(z.object({
      vehicleType: z.enum(["tractor", "tanker", "trailer", "combination"]).optional(),
    }))
    .query(async ({ input }) => {
      return [
        {
          id: "tmpl_001",
          name: "Tanker Pre-Trip",
          vehicleType: "tanker",
          categories: [
            { name: "Cab/Controls", items: ["Gauges", "Wipers", "Mirrors", "Horn", "Heater", "Emergency Equipment"] },
            { name: "Lights", items: ["Headlights", "Turn Signals", "Brake Lights", "Markers", "Reflectors"] },
            { name: "Brakes", items: ["Service Brakes", "Parking Brake", "Drums/Linings", "Air Lines"] },
            { name: "Tires/Wheels", items: ["Tread Depth", "Condition", "Rims", "Lug Nuts"] },
            { name: "Coupling", items: ["Fifth Wheel", "Safety Chains"] },
            { name: "Tanker", items: ["Valves", "Vapor Recovery", "Grounding", "Placards"] },
          ],
        },
        {
          id: "tmpl_002",
          name: "Standard Pre-Trip",
          vehicleType: "tractor",
          categories: [
            { name: "Cab/Controls", items: ["Gauges", "Wipers", "Mirrors", "Horn", "Heater", "Emergency Equipment"] },
            { name: "Lights", items: ["Headlights", "Turn Signals", "Brake Lights", "Markers"] },
            { name: "Brakes", items: ["Service Brakes", "Parking Brake", "Drums/Linings"] },
            { name: "Tires/Wheels", items: ["Tread Depth", "Condition", "Rims", "Lug Nuts"] },
          ],
        },
      ];
    }),

  /**
   * Get open defects
   */
  getOpenDefects: protectedProcedure
    .input(z.object({
      vehicleId: z.string().optional(),
      severity: defectSeveritySchema.optional(),
    }))
    .query(async ({ input }) => {
      return [
        {
          id: "def_002",
          vehicleId: "v3",
          unitNumber: "TRK-103",
          category: "Brakes",
          item: "Brake Drums/Linings",
          severity: "major",
          description: "Front brake lining worn below minimum",
          reportedAt: "2025-01-22T10:00:00Z",
          reportedBy: "Tom Brown",
          status: "pending_repair",
        },
      ];
    }),

  /**
   * Get inspection statistics
   */
  getStatistics: protectedProcedure
    .input(z.object({
      period: z.enum(["week", "month", "quarter"]).default("month"),
    }))
    .query(async ({ input }) => {
      return {
        period: input.period,
        summary: {
          totalInspections: 245,
          satisfactory: 228,
          withDefects: 17,
          defectRate: 0.069,
        },
        byType: {
          pre_trip: 120,
          post_trip: 118,
          en_route: 5,
          dot: 2,
        },
        defectsByCategory: [
          { category: "Lights", count: 8 },
          { category: "Brakes", count: 4 },
          { category: "Tires", count: 3 },
          { category: "Other", count: 2 },
        ],
        compliance: {
          inspectionsRequired: 250,
          inspectionsCompleted: 245,
          complianceRate: 0.98,
        },
      };
    }),
});
