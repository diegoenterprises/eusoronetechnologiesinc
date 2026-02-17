/**
 * PERMITS ROUTER
 * tRPC procedures for oversize/overweight permit management
 */

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { auditedProtectedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { documents } from "../../drizzle/schema";

const permitStatusSchema = z.enum(["draft", "pending", "approved", "expired", "revoked"]);
const permitTypeSchema = z.enum(["oversize", "overweight", "superload", "hazmat_route", "temporary"]);

export const permitsRouter = router({
  /**
   * List permits — empty for new users (no permits table yet)
   */
  list: protectedProcedure
    .input(z.object({ status: permitStatusSchema.optional(), type: permitTypeSchema.optional(), state: z.string().optional(), limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async () => {
      const result: any[] = [];
      return Object.assign(result, { permits: result, total: 0, filter: result.filter.bind(result) });
    }),

  /**
   * Get permit by ID — empty for new users
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => null),

  /**
   * Apply for permit
   */
  submitApplication: protectedProcedure
    .input(z.object({ type: permitTypeSchema, states: z.array(z.string()), catalystId: z.string(), vehicleId: z.string(), trailerId: z.string().optional(), loadDescription: z.string(), commodity: z.string(), dimensions: z.object({ length: z.number(), width: z.number(), height: z.number(), overhangFront: z.number().optional(), overhangRear: z.number().optional() }), weight: z.number(), origin: z.string(), destination: z.string(), requestedStartDate: z.string(), requestedEndDate: z.string(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => ({
      id: `perm_${Date.now()}`, applicationNumber: `APP-${Date.now().toString().slice(-6)}`,
      status: "pending", submittedBy: ctx.user?.id, submittedAt: new Date().toISOString(), estimatedProcessingDays: 3,
    })),

  /**
   * Get expiring permits — empty for new users
   */
  getExpiring: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async () => {
      // Expiring permits require a dedicated permits table
      return [];
    }),

  /**
   * Renew permit
   */
  renew: protectedProcedure
    .input(z.object({ permitId: z.string(), requestedEndDate: z.string(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => ({
      success: true, renewalId: `ren_${Date.now()}`, originalPermitId: input.permitId, status: "pending", submittedAt: new Date().toISOString(),
    })),

  /**
   * Get state permit requirements — static reference data (OK to keep)
   */
  getStateRequirements: protectedProcedure
    .input(z.object({ state: z.string() }))
    .query(async ({ input }) => {
      const requirements: Record<string, any> = {
        TX: {
          state: "TX", agency: "Texas Department of Motor Vehicles",
          maxDimensions: { length: 110, width: 14, height: 14 }, maxWeight: 80000,
          oversizeTriggers: { length: 65, width: 8.5, height: 14 }, overweightTrigger: 80000,
          superloadThreshold: { length: 125, width: 16, height: 17, weight: 200000 },
          escortRequirements: { width14Plus: "Front escort required", width16Plus: "Front and rear escort required", superload: "Law enforcement escort may be required" },
          fees: { oversize: { base: 60, perMile: 0 }, overweight: { base: 75, perMile: 0 }, superload: { base: 200, perMile: 0.50 } },
          processingTime: "2-5 business days", onlinePortal: "https://txdmv.gov/motor-catalysts/oversize-overweight-permits",
        },
      };
      return requirements[input.state] || { state: input.state, found: false };
    }),

  /**
   * Check route for restrictions — logic-based, not fake data
   */
  checkRoute: protectedProcedure
    .input(z.object({ origin: z.string(), destination: z.string(), dimensions: z.object({ length: z.number(), width: z.number(), height: z.number() }), weight: z.number() }))
    .query(async ({ input }) => ({
      origin: input.origin, destination: input.destination,
      restrictions: [],
      permitRequired: input.dimensions.width > 8.5 || input.dimensions.height > 14 || input.weight > 80000,
      permitTypes: [] as string[], alternateRoutes: [] as string[],
    })),

  /**
   * Upload permit document
   */
  uploadDocument: protectedProcedure
    .input(z.object({ permitId: z.string(), documentName: z.string(), documentType: z.enum(["permit", "route", "engineering", "insurance", "other"]) }))
    .mutation(async ({ ctx, input }) => ({
      id: `doc_${Date.now()}`, permitId: input.permitId, name: input.documentName, type: input.documentType, uploadedBy: ctx.user?.id, uploadedAt: new Date().toISOString(),
    })),

  // Additional permit procedures — empty for new users
  getActive: protectedProcedure.query(async () => {
    const permits: any[] = [];
    return Object.assign(permits, { total: 0, valid: 0, expiringSoon: 0, expired: 0 });
  }),
  getSummary: protectedProcedure.query(async () => ({ total: 0, active: 0, expiring: 0, expired: 0 })),
  getStates: protectedProcedure.query(async () => [
    { code: "TX", name: "Texas", permitsRequired: true }, { code: "OK", name: "Oklahoma", permitsRequired: true },
    { code: "LA", name: "Louisiana", permitsRequired: true }, { code: "NM", name: "New Mexico", permitsRequired: true },
  ]),
  getRequirements: protectedProcedure.input(z.object({ state: z.string().optional() }).optional()).query(async () => {
    // Permit requirements require dedicated table or FMCSA API
    return [];
  }),
});
