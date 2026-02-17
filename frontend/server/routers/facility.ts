/**
 * FACILITY ROUTER
 * tRPC procedures for facility management
 */

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { terminals, loads } from "../../drizzle/schema";

export const facilityRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) return { totalBays: 0, availableBays: 0, todayShipments: 0, staffOnDuty: 0 };
    try {
      const companyId = ctx.user?.companyId || 0;
      const today = new Date(); today.setHours(0,0,0,0);
      const [shipments] = await db.select({ count: sql<number>`count(*)` }).from(loads).where(eq(loads.shipperId, companyId));
      return { totalBays: 0, availableBays: 0, todayShipments: shipments?.count || 0, staffOnDuty: 0 };
    } catch (e) { return { totalBays: 0, availableBays: 0, todayShipments: 0, staffOnDuty: 0 }; }
  }),

  getBays: protectedProcedure.query(async () => {
    // Bays require a dedicated facility_bays table; return empty until schema supports it
    return [];
  }),

  getShipments: protectedProcedure.input(z.object({ status: z.string().optional() })).query(async ({ ctx }) => {
    const db = await getDb(); if (!db) return [];
    try {
      const companyId = ctx.user?.companyId || 0;
      const rows = await db.select().from(loads).where(eq(loads.shipperId, companyId)).limit(20);
      return rows.map(l => {
        const pickup = l.pickupLocation as any || {};
        const delivery = l.deliveryLocation as any || {};
        return { id: String(l.id), loadNumber: l.loadNumber, status: l.status, origin: `${pickup.city || ''}, ${pickup.state || ''}`, destination: `${delivery.city || ''}, ${delivery.state || ''}` };
      });
    } catch (e) { return []; }
  }),

  getStaff: protectedProcedure.query(async () => {
    // Staff management requires a dedicated table; return empty
    return [];
  }),
});
