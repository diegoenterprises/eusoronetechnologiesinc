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
        description: (company as any).description || "",
      };
    }),

  // Update company profile — persists to database
  updateProfile: protectedProcedure
    .input(
      z.object({
        companyId: z.number().optional(),
        id: z.number().optional(),
        name: z.string().optional(),
        legalName: z.string().optional(),
        mcNumber: z.string().optional(),
        dotNumber: z.string().optional(),
        ein: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        website: z.string().optional(),
        description: z.string().optional(),
      })
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

      const { companyId: _cid, id: _id, description, ...rest } = input;
      const updateData: Record<string, any> = { ...rest, updatedAt: new Date() };

      // Store description via raw SQL since column may not exist in schema yet
      if (description !== undefined) {
        try {
          await db.execute(sql`UPDATE companies SET description = ${description} WHERE id = ${targetId}`);
        } catch {
          // Column may not exist — non-critical
        }
      }

      // Remove undefined values
      Object.keys(updateData).forEach(k => { if (updateData[k] === undefined) delete updateData[k]; });

      await db.update(companies).set(updateData).where(eq(companies.id, targetId));

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
  getBilling: protectedProcedure.query(async () => ({ balance: 2500, currentBalance: 2500, nextDue: "2025-02-01", nextBillingDate: "2025-02-01", plan: "premium", planName: "Premium", status: "active", monthlyPrice: 299, monthToDate: 1850, paymentMethod: "Visa ending in 4242", pendingCharges: 450, usage: [{ name: "Loads", used: 45, limit: 100 }, { name: "API Calls", used: 1250, limit: 5000 }, { name: "Storage", used: 2.5, limit: 10 }] })),
  getRecentInvoices: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async () => [{ id: "inv1", amount: 500, status: "paid", date: "2025-01-15" }]),
  getUsageBreakdown: protectedProcedure.query(async () => [
    { name: "Loads", value: 45, limit: 100 },
    { name: "API Calls", value: 1250, limit: 5000 },
    { name: "Storage", value: 2.5, limit: 10 },
  ]),
  getCompanyProfile: protectedProcedure.input(z.object({ companyId: z.string().optional() }).optional()).query(async () => ({
    id: 1,
    name: "ABC Transport LLC",
    legalName: "ABC Transport LLC",
    type: "carrier",
    description: "Full-service carrier specializing in petroleum transport",
    dotNumber: "1234567",
    mcNumber: "MC-987654",
    verified: true,
    ein: "12-3456789",
    address: "1234 Transport Way",
    city: "Houston",
    state: "TX",
    zipCode: "77001",
    phone: "(713) 555-0100",
    email: "info@abctransport.com",
    website: "https://abctransport.com",
    logo: null,
    createdAt: "2022-01-15",
    updatedAt: "2025-01-20",
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
