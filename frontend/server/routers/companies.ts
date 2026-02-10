import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { companies, vehicles, users } from "../../drizzle/schema";

// Ensure the current user has a company — creates one if needed, returns companyId
async function ensureCompanyForUser(ctxUser: any): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const email = ctxUser?.email || "";

  // Find user by email first (most reliable — openId column may not exist)
  let user: any = null;
  if (email) {
    try {
      [user] = await db.select({ id: users.id, companyId: users.companyId }).from(users).where(eq(users.email, email)).limit(1);
    } catch {}
  }
  if (!user) {
    try {
      const openId = String(ctxUser?.id || "");
      [user] = await db.select({ id: users.id, companyId: users.companyId }).from(users).where(eq(users.openId, openId)).limit(1);
    } catch {
      // openId column doesn't exist — that's fine
    }
  }

  // If user has a company, return it
  if (user?.companyId) {
    const [exists] = await db.select({ id: companies.id }).from(companies).where(eq(companies.id, user.companyId)).limit(1);
    if (exists) return exists.id;
  }

  // Create a company for the user
  try {
    const result = await db.insert(companies).values({
      name: ctxUser?.name ? `${ctxUser.name}'s Company` : "My Company",
      email: email || "",
      phone: "",
      isActive: true,
      complianceStatus: "pending",
    });
    const insertedId = (result as any).insertId || (result as any)[0]?.insertId;
    const companyId = insertedId || 0;

    // Link user to this company
    if (user && companyId) {
      await db.update(users).set({ companyId }).where(eq(users.id, user.id));
    }
    return companyId;
  } catch (err) {
    console.error("[ensureCompanyForUser] Failed:", err);
    return 0;
  }
}

export const companiesRouter = router({
  // Get company documents for CompanyDocuments page
  getDocuments: protectedProcedure
    .input(z.object({ category: z.string().optional() }))
    .query(async ({ input }) => {
      return [];
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
    .input(z.object({ id: z.string().optional(), documentId: z.string().optional() }))
    .mutation(async ({ input }) => {
      return { success: true, deletedId: input.id };
    }),

  // Get company profile — auto-creates company for user if needed
  getProfile: protectedProcedure
    .input(z.object({ companyId: z.number().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        return {
          id: 1, name: "", dotNumber: "", mcNumber: "", type: "carrier", verified: false,
          logo: null, website: "", description: "", address: "", city: "", state: "", zip: "",
          phone: "", email: ctx.user?.email || "",
        };
      }

      // Resolve companyId — explicit param > user's company > auto-create
      let companyId = input?.companyId || 0;
      if (!companyId) {
        companyId = await ensureCompanyForUser(ctx.user);
      }
      if (!companyId) return null;

      const [company] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
      if (!company) return null;

      return {
        ...company,
        type: "carrier",
        verified: !!company.dotNumber,
        logo: company.logo || null,
        website: company.website || "",
        description: company.description || "",
      };
    }),

  // Update company profile — persists to database
  updateProfile: protectedProcedure
    .input(
      z.object({
        companyId: z.number().nullable().optional(),
        id: z.number().nullable().optional(),
        name: z.string().nullable().optional(),
        legalName: z.string().nullable().optional(),
        mcNumber: z.string().nullable().optional(),
        dotNumber: z.string().nullable().optional(),
        ein: z.string().nullable().optional(),
        address: z.string().nullable().optional(),
        city: z.string().nullable().optional(),
        state: z.string().nullable().optional(),
        zipCode: z.string().nullable().optional(),
        phone: z.string().nullable().optional(),
        email: z.string().nullable().optional(),
        website: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        logo: z.string().nullable().optional(),
        type: z.string().nullable().optional(),
        verified: z.boolean().nullable().optional(),
        scacCode: z.string().nullable().optional(),
        taxId: z.string().nullable().optional(),
        country: z.string().nullable().optional(),
      }).passthrough()
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Accept either companyId or id
      let targetId = input.companyId || input.id || 0;
      if (!targetId) {
        targetId = await ensureCompanyForUser(ctx.user);
      }
      if (!targetId) throw new Error("Could not resolve company");

      // Only include fields that exist in the companies table
      const allowedFields = [
        "name", "legalName", "mcNumber", "dotNumber", "ein",
        "address", "city", "state", "zipCode", "country",
        "phone", "email", "website", "logo", "description",
      ];

      const updateData: Record<string, any> = {};
      for (const key of allowedFields) {
        if (key in input && (input as any)[key] !== undefined) {
          // Convert null to empty string for varchar/text columns
          updateData[key] = (input as any)[key] ?? "";
        }
      }

      if (Object.keys(updateData).length > 0) {
        await db.update(companies).set(updateData).where(eq(companies.id, targetId));
      }

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
  getStats: protectedProcedure.query(async () => ({ totalDrivers: 0, totalVehicles: 0, activeLoads: 0, revenue: 0, employees: 0, vehicles: 0, loadsCompleted: 0, rating: 0 })),
  getBilling: protectedProcedure.query(async () => ({ balance: 2500, currentBalance: 2500, nextDue: "2025-02-01", nextBillingDate: "2025-02-01", plan: "premium", planName: "Premium", status: "active", monthlyPrice: 299, monthToDate: 1850, paymentMethod: "Visa ending in 4242", pendingCharges: 450, usage: [{ name: "Loads", used: 45, limit: 100 }, { name: "API Calls", used: 1250, limit: 5000 }, { name: "Storage", used: 2.5, limit: 10 }] })),
  getRecentInvoices: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async () => []),
  getUsageBreakdown: protectedProcedure.query(async () => [
    { name: "Loads", value: 0, limit: 100 },
    { name: "API Calls", value: 0, limit: 5000 },
    { name: "Storage", value: 0, limit: 10 },
  ]),
  getCompanyProfile: protectedProcedure.input(z.object({ companyId: z.string().optional() }).optional()).query(async () => ({
    id: 0,
    name: "",
    legalName: "",
    type: "",
    description: "",
    dotNumber: "",
    mcNumber: "",
    verified: false,
    ein: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
    website: "",
    logo: null,
    createdAt: "",
    updatedAt: "",
  })),

  /**
   * List companies for Companies page
   */
  list: protectedProcedure
    .input(z.object({ search: z.string().optional(), limit: z.number().optional().default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const companyList = await db
          .select()
          .from(companies)
          .limit(input.limit);

        return companyList.map(c => ({
          id: c.id,
          name: c.name,
          dotNumber: c.dotNumber || '',
          mcNumber: c.mcNumber || '',
          ein: c.ein || '',
          isActive: c.isActive,
          foundedYear: '',
          employeeCount: 0,
          complianceScore: 95,
          email: c.email || '',
          phone: c.phone || '',
          address: c.address || '',
          city: c.city || '',
          state: c.state || '',
          zipCode: c.zipCode || '',
          documents: [],
        }));
      } catch (error) {
        console.error('[Companies] list error:', error);
        return [];
      }
    }),
});
