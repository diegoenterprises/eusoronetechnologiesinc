import { z } from "zod";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { companies, vehicles } from "../../drizzle/schema";

export const companiesRouter = router({
  // Get company profile
  getProfile: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(companies)
        .where(eq(companies.id, input.companyId))
        .limit(1);

      return result[0] || null;
    }),

  // Update company profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        companyId: z.number(),
        name: z.string().optional(),
        mcNumber: z.string().optional(),
        dotNumber: z.string().optional(),
        scacCode: z.string().optional(),
        taxId: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        website: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { companyId, ...updateData } = input;

      await db
        .update(companies)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(companies.id, companyId));

      return { success: true };
    }),

  // Get company fleet
  getFleet: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const fleet = await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.companyId, input.companyId));

      return fleet;
    }),

  // Add vehicle to fleet
  addVehicle: protectedProcedure
    .input(
      z.object({
        companyId: z.number(),
        type: z.enum(["tractor", "trailer", "tanker", "flatbed", "refrigerated", "dry_van", "lowboy", "step_deck"]),
        make: z.string(),
        model: z.string(),
        year: z.number(),
        vin: z.string(),
        licensePlate: z.string(),
        capacity: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(vehicles).values({
        companyId: input.companyId,
        vehicleType: input.type,
        make: input.make,
        model: input.model,
        year: input.year,
        vin: input.vin,
        licensePlate: input.licensePlate,
        capacity: input.capacity,
      });

      return { success: true };
    }),
});
