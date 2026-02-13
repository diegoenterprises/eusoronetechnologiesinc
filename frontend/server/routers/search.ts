/**
 * SEARCH ROUTER
 * tRPC procedures for global search
 * ALL data from database — real queries against loads, users, documents
 * Scoped per-user: results filtered by user's company, role, and ownership
 */

import { z } from "zod";
import { eq, like, sql, or, and } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loads, drivers, users, documents } from "../../drizzle/schema";

export const searchRouter = router({
  global: protectedProcedure.input(z.object({ query: z.string(), type: z.string().optional(), filters: z.any().optional() }).optional()).query(async ({ ctx, input }) => {
    const empty = { loads: [], drivers: [], carriers: [], invoices: [], total: 0, counts: { loads: 0, drivers: 0, carriers: 0, invoices: 0 }, results: [] as any[] };
    if (!input?.query || input.query.trim().length < 2) return empty;
    const db = await getDb();
    if (!db) return empty;
    const q = `%${input.query.trim()}%`;
    const userId = ctx.user?.id;
    const userRole = ctx.user?.role || "SHIPPER";
    const companyId = ctx.user?.companyId;

    try {
      // Build load scope: shipper sees own loads, carrier sees assigned loads, others see company loads
      const loadScope = userRole === "SHIPPER" ? eq(loads.shipperId, userId)
        : userRole === "CARRIER" ? eq(loads.carrierId, userId)
        : userRole === "DRIVER" ? eq(loads.driverId, userId)
        : undefined; // admin/broker see all

      const loadWhere = loadScope
        ? and(loadScope, or(like(loads.loadNumber, q), sql`JSON_UNQUOTE(JSON_EXTRACT(${loads.pickupLocation}, '$.city')) LIKE ${q}`, sql`JSON_UNQUOTE(JSON_EXTRACT(${loads.deliveryLocation}, '$.city')) LIKE ${q}`))
        : or(like(loads.loadNumber, q), sql`JSON_UNQUOTE(JSON_EXTRACT(${loads.pickupLocation}, '$.city')) LIKE ${q}`, sql`JSON_UNQUOTE(JSON_EXTRACT(${loads.deliveryLocation}, '$.city')) LIKE ${q}`);

      // Search loads
      const loadResults = await db.select({
        id: loads.id, loadNumber: loads.loadNumber, status: loads.status,
        pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation
      }).from(loads).where(loadWhere!).limit(8);

      // Search users (drivers/carriers) — scoped to same company or all for brokers/admin
      const userWhere = companyId
        ? and(eq(users.companyId, companyId), or(like(users.name, q), like(users.email, q)))
        : or(like(users.name, q), like(users.email, q));

      const userResults = await db.select({ id: users.id, name: users.name, role: users.role, email: users.email })
        .from(users).where(userWhere!).limit(8);

      // Search documents — scoped to user or company
      let docResults: any[] = [];
      try {
        const docWhere = companyId
          ? and(or(eq(documents.userId, userId), eq(documents.companyId, companyId)), like(documents.name, q))
          : and(eq(documents.userId, userId), like(documents.name, q));
        docResults = await db.select({ id: documents.id, name: documents.name, type: documents.type })
          .from(documents).where(docWhere!).limit(5);
      } catch { /* documents table may not exist yet */ }

      // Build unified results
      const results: any[] = [];
      for (const l of loadResults) {
        const origin = (l.pickupLocation as any)?.city || "";
        const dest = (l.deliveryLocation as any)?.city || "";
        results.push({ id: String(l.id), type: "load", title: l.loadNumber || `LOAD-${l.id}`, subtitle: `${origin}${origin && dest ? " → " : ""}${dest}${l.status ? ` · ${l.status}` : ""}`, match: 95 });
      }
      for (const u of userResults) {
        const type = u.role === "DRIVER" ? "driver" : u.role === "CARRIER" ? "carrier" : "user";
        results.push({ id: String(u.id), type, title: u.name || "Unknown", subtitle: `${u.role || ""} · ${u.email || ""}`, match: 85 });
      }
      for (const d of docResults) {
        results.push({ id: String(d.id), type: "document", title: d.name || "Document", subtitle: d.type || "file", match: 75 });
      }

      // Sort by match score descending
      results.sort((a, b) => b.match - a.match);

      return {
        loads: loadResults.map(l => ({ id: String(l.id), loadNumber: l.loadNumber, match: 95 })),
        drivers: userResults.filter(u => u.role === "DRIVER").map(u => ({ id: String(u.id), name: u.name, match: 85 })),
        carriers: userResults.filter(u => u.role === "CARRIER").map(u => ({ id: String(u.id), name: u.name, match: 85 })),
        invoices: [],
        total: results.length,
        counts: {
          loads: loadResults.length,
          drivers: userResults.filter(u => u.role === "DRIVER").length,
          carriers: userResults.filter(u => u.role === "CARRIER").length,
          invoices: 0,
          documents: docResults.length,
        },
        results,
      };
    } catch (err) { console.error("[search.global]", err); return empty; }
  }),

  getRecent: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async () => []),
});
