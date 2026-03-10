// GAP-445: PaaS White-Label Infrastructure — Tenant Management tRPC Router
import { router, roleProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { sql } from "drizzle-orm";
import crypto from "crypto";
import { unsafeCast } from "../_core/types/unsafe";

const superAdminProcedure = roleProcedure("SUPER_ADMIN");

export const tenantManagerRouter = router({
  // Create a new tenant
  create: superAdminProcedure
    .input(z.object({
      parentCarrierId: z.number().optional(),
      customDomain: z.string().optional(),
      maxUsers: z.number().default(50),
      maxLoads: z.number().default(1000),
      features: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const tenantKey = `tk_${crypto.randomBytes(24).toString("hex")}`;
      await db.execute(
        sql`INSERT INTO tenants (tenantKey, parentCarrierId, customDomain, maxUsers, maxLoads, features)
            VALUES (${tenantKey}, ${input.parentCarrierId || null}, ${input.customDomain || null}, ${input.maxUsers}, ${input.maxLoads}, ${JSON.stringify(input.features || {})})`
      );
      return { success: true, tenantKey };
    }),

  // List all tenants
  list: superAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const [rows] = await db.execute(sql`SELECT * FROM tenants ORDER BY id DESC LIMIT 200`);
    return unsafeCast(rows || []).map((r: any) => ({
      ...r,
      features: typeof r.features === "string" ? JSON.parse(r.features) : r.features,
      tenantKeyPreview: r.tenantKey ? `${r.tenantKey.substring(0, 8)}...` : null,
    }));
  }),

  // Get single tenant
  get: superAdminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [rows] = await db.execute(sql`SELECT * FROM tenants WHERE id = ${input.id} LIMIT 1`);
      if (!unsafeCast(rows)?.[0]) return null;
      const t = unsafeCast(rows)[0];
      t.features = typeof t.features === "string" ? JSON.parse(t.features) : t.features;

      // Get user count
      const [userRows] = await db.execute(
        sql`SELECT COUNT(*) as cnt FROM tenant_data_isolation WHERE tenantId = ${input.id}`
      );
      t.userCount = Number(unsafeCast(userRows)?.[0]?.cnt || 0);
      return t;
    }),

  // Update tenant
  update: superAdminProcedure
    .input(z.object({
      id: z.number(),
      customDomain: z.string().optional(),
      maxUsers: z.number().optional(),
      maxLoads: z.number().optional(),
      status: z.enum(["active", "suspended", "deactivated"]).optional(),
      features: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const setClauses: ReturnType<typeof sql>[] = [];
      if (input.customDomain !== undefined) setClauses.push(sql`customDomain = ${input.customDomain}`);
      if (input.maxUsers !== undefined) setClauses.push(sql`maxUsers = ${input.maxUsers}`);
      if (input.maxLoads !== undefined) setClauses.push(sql`maxLoads = ${input.maxLoads}`);
      if (input.status !== undefined) setClauses.push(sql`status = ${input.status}`);
      if (input.features !== undefined) setClauses.push(sql`features = ${JSON.stringify(input.features)}`);
      if (setClauses.length === 0) return { success: true };
      const setFragment = sql.join(setClauses, sql`, `);
      await db.execute(sql`UPDATE tenants SET ${setFragment} WHERE id = ${input.id}`);
      return { success: true };
    }),

  // Assign user to tenant
  assignUser: superAdminProcedure
    .input(z.object({ userId: z.number(), tenantId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.execute(
        sql`INSERT INTO tenant_data_isolation (userId, tenantId) VALUES (${input.userId}, ${input.tenantId})
            ON DUPLICATE KEY UPDATE tenantId = ${input.tenantId}`
      );
      return { success: true };
    }),

  // Regenerate tenant API key
  regenerateKey: superAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const newKey = `tk_${crypto.randomBytes(24).toString("hex")}`;
      await db.execute(sql`UPDATE tenants SET tenantKey = ${newKey} WHERE id = ${input.id}`);
      return { success: true, tenantKey: newKey };
    }),

  // Get tenant stats
  getStats: superAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { total: 0, active: 0, suspended: 0 };
    const [rows] = await db.execute(
      sql`SELECT status, COUNT(*) as cnt FROM tenants GROUP BY status`
    );
    const counts: Record<string, number> = {};
    unsafeCast(rows || []).forEach((r: any) => { counts[r.status] = Number(r.cnt); });
    return {
      total: Object.values(counts).reduce((a, b) => a + b, 0),
      active: counts.active || 0,
      suspended: counts.suspended || 0,
    };
  }),
});
