/**
 * VEHICLES ROUTER
 * tRPC procedures for vehicle management
 * ALL data from database — scoped by companyId
 */

import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { vehicles, users } from "../../drizzle/schema";

async function resolveCompanyId(ctxUser: any): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const userId = typeof ctxUser?.id === "string" ? parseInt(ctxUser.id, 10) : (ctxUser?.id || 0);
  try { const [r] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1); return r?.companyId || 0; } catch { return 0; }
}

export const vehiclesRouter = router({
  list: protectedProcedure.input(z.object({ status: z.string().optional(), limit: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const companyId = await resolveCompanyId(ctx.user);
    if (!companyId) return [];
    try {
      const filters: any[] = [eq(vehicles.companyId, companyId), eq(vehicles.isActive, true)];
      if (input?.status) filters.push(eq(vehicles.status, input.status as any));
      const results = await db.select().from(vehicles).where(and(...filters)).orderBy(desc(vehicles.createdAt)).limit(input?.limit || 50);
      return results.map(v => ({
        id: String(v.id), unit: `${v.make || ""}-${v.model || ""}`.trim() || String(v.id),
        vin: v.vin, type: v.vehicleType, status: v.status,
        make: v.make, model: v.model, year: v.year,
        licensePlate: v.licensePlate, driver: v.currentDriverId ? String(v.currentDriverId) : "",
      }));
    } catch { return []; }
  }),

  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { total: 0, active: 0, maintenance: 0, outOfService: 0 };
    const companyId = await resolveCompanyId(ctx.user);
    if (!companyId) return { total: 0, active: 0, maintenance: 0, outOfService: 0 };
    try {
      const [total] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true)));
      const [available] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true), eq(vehicles.status, "available")));
      const [inUse] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true), eq(vehicles.status, "in_use")));
      const [maint] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true), eq(vehicles.status, "maintenance")));
      const [oos] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(and(eq(vehicles.companyId, companyId), eq(vehicles.isActive, true), eq(vehicles.status, "out_of_service")));
      return { total: total?.count || 0, active: (available?.count || 0) + (inUse?.count || 0), maintenance: maint?.count || 0, outOfService: oos?.count || 0 };
    } catch { return { total: 0, active: 0, maintenance: 0, outOfService: 0 }; }
  }),
});
