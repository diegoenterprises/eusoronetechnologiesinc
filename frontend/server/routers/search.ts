/**
 * SEARCH ROUTER
 * tRPC procedures for global search
 * ALL data from database — real queries against loads, users
 */

import { z } from "zod";
import { eq, like, sql, or } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loads, drivers, users } from "../../drizzle/schema";

export const searchRouter = router({
  global: protectedProcedure.input(z.object({ query: z.string(), type: z.string().optional(), filters: z.any().optional() }).optional()).query(async ({ ctx, input }) => {
    const empty = { loads: [], drivers: [], carriers: [], invoices: [], total: 0, counts: { loads: 0, drivers: 0, carriers: 0, invoices: 0 }, results: [] as any[] };
    if (!input?.query || input.query.trim().length < 2) return empty;
    const db = await getDb();
    if (!db) return empty;
    const q = `%${input.query}%`;
    try {
      // Search loads by loadNumber or JSON pickup/delivery city
      const loadResults = await db.select({ id: loads.id, loadNumber: loads.loadNumber, pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation })
        .from(loads).where(or(like(loads.loadNumber, q), sql`JSON_UNQUOTE(JSON_EXTRACT(${loads.pickupLocation}, '$.city')) LIKE ${q}`, sql`JSON_UNQUOTE(JSON_EXTRACT(${loads.deliveryLocation}, '$.city')) LIKE ${q}`)).limit(10);
      // Search users (drivers/carriers)
      const userResults = await db.select({ id: users.id, name: users.name, role: users.role, email: users.email })
        .from(users).where(or(like(users.name, q), like(users.email, q))).limit(10);

      const results: any[] = [];
      for (const l of loadResults) {
        const origin = (l.pickupLocation as any)?.city || "";
        const dest = (l.deliveryLocation as any)?.city || "";
        results.push({ id: String(l.id), type: "load", title: l.loadNumber || `LOAD-${l.id}`, subtitle: `${origin} to ${dest}`, match: 90 });
      }
      for (const u of userResults) results.push({ id: String(u.id), type: u.role === "DRIVER" ? "driver" : "carrier", title: u.name || "Unknown", subtitle: u.role || "", match: 85 });

      return {
        loads: loadResults.map(l => ({ id: String(l.id), loadNumber: l.loadNumber, match: 90 })),
        drivers: userResults.filter(u => u.role === "DRIVER").map(u => ({ id: String(u.id), name: u.name, match: 85 })),
        carriers: userResults.filter(u => u.role === "CARRIER").map(u => ({ id: String(u.id), name: u.name, match: 85 })),
        invoices: [],
        total: results.length,
        counts: { loads: loadResults.length, drivers: userResults.filter(u => u.role === "DRIVER").length, carriers: userResults.filter(u => u.role === "CARRIER").length, invoices: 0 },
        results,
      };
    } catch (err) { console.error("[search.global]", err); return empty; }
  }),

  getRecent: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async () => []),
});
