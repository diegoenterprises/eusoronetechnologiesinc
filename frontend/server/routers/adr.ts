// GAP-449: EU ADR Compliance — tRPC Router
import { router, protectedProcedure, roleProcedure } from "../_core/trpc";
import { z } from "zod";
import { ADRService } from "../services/ADRService";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

const superAdminProcedure = roleProcedure("SUPER_ADMIN");

export const adrRouter = router({
  // Create/update ADR compliance for a load
  createCompliance: protectedProcedure
    .input(z.object({ loadId: z.number(), dotClass: z.string(), unNumber: z.string() }))
    .mutation(async ({ input }) => {
      return await ADRService.createCompliance(input.loadId, input.dotClass, input.unNumber);
    }),

  // Get ADR compliance for a load
  getCompliance: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => {
      return await ADRService.getCompliance(input.loadId);
    }),

  // Validate driver ADR certification
  validateDriver: protectedProcedure
    .input(z.object({ driverId: z.number(), adrClass: z.string() }))
    .query(async ({ input }) => {
      return await ADRService.validateDriverCertification(input.driverId, input.adrClass);
    }),

  // Add driver ADR certification
  addDriverCert: protectedProcedure
    .input(z.object({
      driverId: z.number(),
      certificationId: z.string(),
      adrClass: z.string().optional(),
      expiryDate: z.string(),
      countryCode: z.string().default("DE"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.execute(
        sql`INSERT INTO adr_driver_certifications (driverId, certificationId, adrClass, expiryDate, countryCode)
            VALUES (${input.driverId}, ${input.certificationId}, ${input.adrClass || null}, ${input.expiryDate}, ${input.countryCode})`
      );
      return { success: true };
    }),

  // Get driver certifications
  getDriverCerts: protectedProcedure
    .input(z.object({ driverId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const [rows] = await db.execute(
        sql`SELECT * FROM adr_driver_certifications WHERE driverId = ${input.driverId} ORDER BY expiryDate DESC`
      ) as any;
      return rows || [];
    }),

  // Get ADR class mappings
  getClassMappings: protectedProcedure.query(() => {
    return ADRService.getClassMappings();
  }),

  // Get tunnel restriction codes
  getTunnelCodes: protectedProcedure.query(() => {
    return Object.entries(ADRService.TUNNEL_CODE_DESC).map(([code, description]) => ({ code, description }));
  }),
});
