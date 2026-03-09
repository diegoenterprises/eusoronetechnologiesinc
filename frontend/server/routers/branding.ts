// GAP-450: White-Label Branding Framework — tRPC Router
import { router, protectedProcedure, roleProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

const superAdminProcedure = roleProcedure("SUPER_ADMIN");

export const brandingRouter = router({
  // Get branding for a tenant
  get: protectedProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [rows] = await db.execute(
        sql`SELECT * FROM tenant_branding WHERE tenantId = ${input.tenantId} LIMIT 1`
      ) as any;
      return rows?.[0] || null;
    }),

  // Upsert branding config
  upsert: superAdminProcedure
    .input(z.object({
      tenantId: z.number(),
      logoUrl: z.string().optional(),
      faviconUrl: z.string().optional(),
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      fontFamily: z.string().optional(),
      customDomain: z.string().optional(),
      brandName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [existing] = await db.execute(
        sql`SELECT id FROM tenant_branding WHERE tenantId = ${input.tenantId} LIMIT 1`
      ) as any;

      if (existing?.[0]) {
        await db.execute(sql`UPDATE tenant_branding SET
          logoUrl = COALESCE(${input.logoUrl || null}, logoUrl),
          faviconUrl = COALESCE(${input.faviconUrl || null}, faviconUrl),
          primaryColor = COALESCE(${input.primaryColor || null}, primaryColor),
          secondaryColor = COALESCE(${input.secondaryColor || null}, secondaryColor),
          fontFamily = COALESCE(${input.fontFamily || null}, fontFamily),
          customDomain = COALESCE(${input.customDomain || null}, customDomain),
          brandName = COALESCE(${input.brandName || null}, brandName)
          WHERE tenantId = ${input.tenantId}`);
      } else {
        await db.execute(sql`INSERT INTO tenant_branding (tenantId, logoUrl, faviconUrl, primaryColor, secondaryColor, fontFamily, customDomain, brandName)
          VALUES (${input.tenantId}, ${input.logoUrl || null}, ${input.faviconUrl || null}, ${input.primaryColor || "#1E40AF"}, ${input.secondaryColor || "#059669"}, ${input.fontFamily || "Inter, system-ui"}, ${input.customDomain || null}, ${input.brandName || null})`);
      }

      return { success: true };
    }),

  // List all tenant brandings (admin)
  list: superAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const [rows] = await db.execute(sql`SELECT * FROM tenant_branding ORDER BY id DESC LIMIT 100`) as any;
    return rows || [];
  }),
});
