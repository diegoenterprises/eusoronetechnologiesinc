/**
 * PERMITS ROUTER
 * tRPC procedures for oversize/overweight permit management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const permitStatusSchema = z.enum(["draft", "pending", "approved", "expired", "revoked"]);
const permitTypeSchema = z.enum(["oversize", "overweight", "superload", "hazmat_route", "temporary"]);

export const permitsRouter = router({
  /**
   * List permits
   */
  list: protectedProcedure
    .input(z.object({
      status: permitStatusSchema.optional(),
      type: permitTypeSchema.optional(),
      state: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const permits = [
        {
          id: "perm_001",
          permitNumber: "TX-OS-2025-12345",
          type: "oversize",
          status: "approved",
          states: ["TX"],
          issueDate: "2025-01-15",
          expirationDate: "2025-02-15",
          loadDescription: "Wind Turbine Blade",
          dimensions: { length: 180, width: 14, height: 16 },
          weight: 95000,
          route: "Houston to Dallas via I-45",
          restrictions: ["Daylight only", "No travel on weekends"],
        },
        {
          id: "perm_002",
          permitNumber: "TX-SL-2025-00456",
          type: "superload",
          status: "approved",
          states: ["TX"],
          issueDate: "2025-01-20",
          expirationDate: "2025-01-30",
          loadDescription: "Industrial Transformer",
          dimensions: { length: 45, width: 18, height: 18 },
          weight: 250000,
          route: "Port Arthur to Austin via US-290",
          restrictions: ["Escort required", "No travel after dark", "Bridge restrictions apply"],
          escortRequired: true,
        },
        {
          id: "perm_003",
          permitNumber: "LA-OW-2025-07890",
          type: "overweight",
          status: "pending",
          states: ["LA"],
          issueDate: null,
          expirationDate: null,
          loadDescription: "Steel Coils",
          dimensions: { length: 53, width: 8.5, height: 13.5 },
          weight: 105000,
          route: "New Orleans to Baton Rouge via I-10",
        },
      ];

      let filtered = permits;
      if (input.status) filtered = filtered.filter(p => p.status === input.status);
      if (input.type) filtered = filtered.filter(p => p.type === input.type);
      if (input.state) filtered = filtered.filter(p => p.states.includes(input.state!));

      return {
        permits: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
      };
    }),

  /**
   * Get permit by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        permitNumber: "TX-OS-2025-12345",
        type: "oversize",
        status: "approved",
        states: ["TX"],
        issueDate: "2025-01-15",
        expirationDate: "2025-02-15",
        carrier: { id: "car_001", name: "Heavy Haul Specialists", dotNumber: "1234567" },
        vehicle: { unitNumber: "TRK-501", make: "Kenworth", model: "W900" },
        trailer: { unitNumber: "TRL-801", type: "Lowboy", axles: 7 },
        loadDescription: "Wind Turbine Blade",
        commodity: "Wind Energy Equipment",
        dimensions: {
          length: 180,
          width: 14,
          height: 16,
          overhangFront: 10,
          overhangRear: 25,
        },
        weight: {
          gross: 95000,
          perAxle: [12000, 12000, 17000, 17000, 17000, 10000, 10000],
        },
        route: {
          origin: "Houston, TX",
          destination: "Lubbock, TX",
          description: "Houston to Dallas via I-45, then I-20 to Lubbock",
          totalMiles: 520,
          restrictedRoutes: ["Avoid downtown Dallas", "No I-35 through Waco"],
        },
        restrictions: [
          "Daylight hours only (30 min after sunrise to 30 min before sunset)",
          "No travel on weekends or holidays",
          "Pilot car required front and rear",
          "Law enforcement escort through Dallas metro area",
        ],
        escortRequired: true,
        escortDetails: {
          leadCar: true,
          chaseCar: true,
          lawEnforcement: ["Dallas County"],
        },
        fees: {
          permitFee: 150,
          routeSurvey: 0,
          escortFees: 0,
          total: 150,
        },
        documents: [
          { id: "doc1", name: "Permit Document.pdf", type: "permit" },
          { id: "doc2", name: "Route Map.pdf", type: "route" },
          { id: "doc3", name: "Bridge Analysis.pdf", type: "engineering" },
        ],
        timeline: [
          { timestamp: "2025-01-10T10:00:00Z", action: "Application submitted", user: "John Manager" },
          { timestamp: "2025-01-12T14:00:00Z", action: "Route survey completed", user: "TxDOT" },
          { timestamp: "2025-01-15T09:00:00Z", action: "Permit approved", user: "TxDOT" },
        ],
      };
    }),

  /**
   * Apply for permit
   */
  apply: protectedProcedure
    .input(z.object({
      type: permitTypeSchema,
      states: z.array(z.string()),
      carrierId: z.string(),
      vehicleId: z.string(),
      trailerId: z.string().optional(),
      loadDescription: z.string(),
      commodity: z.string(),
      dimensions: z.object({
        length: z.number(),
        width: z.number(),
        height: z.number(),
        overhangFront: z.number().optional(),
        overhangRear: z.number().optional(),
      }),
      weight: z.number(),
      origin: z.string(),
      destination: z.string(),
      requestedStartDate: z.string(),
      requestedEndDate: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `perm_${Date.now()}`,
        applicationNumber: `APP-${Date.now().toString().slice(-6)}`,
        status: "pending",
        submittedBy: ctx.user?.id,
        submittedAt: new Date().toISOString(),
        estimatedProcessingDays: 3,
      };
    }),

  /**
   * Get expiring permits
   */
  getExpiring: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      return [
        {
          id: "perm_001",
          permitNumber: "TX-OS-2025-12345",
          type: "oversize",
          expirationDate: "2025-02-15",
          daysUntilExpiration: 22,
          states: ["TX"],
          loadDescription: "Wind Turbine Blade",
        },
        {
          id: "perm_002",
          permitNumber: "TX-SL-2025-00456",
          type: "superload",
          expirationDate: "2025-01-30",
          daysUntilExpiration: 7,
          states: ["TX"],
          loadDescription: "Industrial Transformer",
        },
      ];
    }),

  /**
   * Renew permit
   */
  renew: protectedProcedure
    .input(z.object({
      permitId: z.string(),
      requestedEndDate: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        renewalId: `ren_${Date.now()}`,
        originalPermitId: input.permitId,
        status: "pending",
        submittedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get state permit requirements
   */
  getStateRequirements: protectedProcedure
    .input(z.object({ state: z.string() }))
    .query(async ({ input }) => {
      const requirements: Record<string, any> = {
        TX: {
          state: "TX",
          agency: "Texas Department of Motor Vehicles",
          maxDimensions: {
            length: 110,
            width: 14,
            height: 14,
          },
          maxWeight: 80000,
          oversizeTriggers: {
            length: 65,
            width: 8.5,
            height: 14,
          },
          overweightTrigger: 80000,
          superloadThreshold: {
            length: 125,
            width: 16,
            height: 17,
            weight: 200000,
          },
          escortRequirements: {
            width14Plus: "Front escort required",
            width16Plus: "Front and rear escort required",
            superload: "Law enforcement escort may be required",
          },
          fees: {
            oversize: { base: 60, perMile: 0 },
            overweight: { base: 75, perMile: 0 },
            superload: { base: 200, perMile: 0.50 },
          },
          processingTime: "2-5 business days",
          onlinePortal: "https://txdmv.gov/motor-carriers/oversize-overweight-permits",
        },
      };

      return requirements[input.state] || { state: input.state, found: false };
    }),

  /**
   * Check route for restrictions
   */
  checkRoute: protectedProcedure
    .input(z.object({
      origin: z.string(),
      destination: z.string(),
      dimensions: z.object({
        length: z.number(),
        width: z.number(),
        height: z.number(),
      }),
      weight: z.number(),
    }))
    .query(async ({ input }) => {
      return {
        origin: input.origin,
        destination: input.destination,
        restrictions: [
          { type: "bridge", location: "I-45 at Trinity River", clearance: 14.5, issue: input.dimensions.height > 14.5 ? "Height restriction" : null },
          { type: "weight", location: "FM 1960 Overpass", limit: 80000, issue: input.weight > 80000 ? "Weight restriction" : null },
        ],
        permitRequired: input.dimensions.width > 8.5 || input.dimensions.height > 14 || input.weight > 80000,
        permitTypes: [],
        alternateRoutes: [],
      };
    }),

  /**
   * Upload permit document
   */
  uploadDocument: protectedProcedure
    .input(z.object({
      permitId: z.string(),
      documentName: z.string(),
      documentType: z.enum(["permit", "route", "engineering", "insurance", "other"]),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `doc_${Date.now()}`,
        permitId: input.permitId,
        name: input.documentName,
        type: input.documentType,
        uploadedBy: ctx.user?.id,
        uploadedAt: new Date().toISOString(),
      };
    }),
});
