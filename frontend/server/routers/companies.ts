import { z } from "zod";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { companies, vehicles } from "../../drizzle/schema";

export const companiesRouter = router({
  // Get company documents for CompanyDocuments page
  getDocuments: protectedProcedure
    .input(z.object({ category: z.string().optional() }))
    .query(async ({ input }) => {
      const docs = [
        { id: "d1", name: "Operating Authority.pdf", category: "authority", status: "active", expiresAt: null, uploadedAt: "2025-01-15" },
        { id: "d2", name: "Insurance Certificate.pdf", category: "insurance", status: "active", expiresAt: "2026-01-10", uploadedAt: "2025-01-10" },
        { id: "d3", name: "DOT Registration.pdf", category: "registration", status: "active", expiresAt: "2025-12-31", uploadedAt: "2025-01-05" },
      ];
      if (input.category) return docs.filter(d => d.category === input.category);
      return docs;
    }),

  // Get document categories for CompanyDocuments page
  getDocumentCategories: protectedProcedure
    .query(async () => {
      return [
        { id: "authority", name: "Authority", count: 3 },
        { id: "insurance", name: "Insurance", count: 5 },
        { id: "registration", name: "Registration", count: 4 },
        { id: "permits", name: "Permits", count: 8 },
      ];
    }),

  // Delete company document
  deleteDocument: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, deletedId: input.id };
    }),

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

  // Additional company procedures
  getStats: protectedProcedure.query(async () => ({ totalDrivers: 25, totalVehicles: 30, activeLoads: 15, revenue: 125000, employees: 35, vehicles: 30, loadsCompleted: 1250, rating: 4.8 })),
  getBilling: protectedProcedure.query(async () => ({ balance: 2500, currentBalance: 2500, nextDue: "2025-02-01", nextBillingDate: "2025-02-01", plan: "premium", planName: "Premium", status: "active", monthlyPrice: 299, monthToDate: 1850, paymentMethod: "Visa ending in 4242", pendingCharges: 450, usage: { loads: 45, apiCalls: 1250, storage: 2.5 } })),
  getRecentInvoices: protectedProcedure.query(async () => [{ id: "inv1", amount: 500, status: "paid", date: "2025-01-15" }]),
});
