/**
 * SEARCH ROUTER
 * tRPC procedures for global search
 * ALL data from database — real queries against loads, users, documents, companies
 * Scoped per-user: results filtered by user's company, role, and ownership
 * Searches: loadNumber, commodityName, cargoType, status, specialInstructions,
 *           pickup/delivery city+state+address, user name/email/phone, company name, document name
 */

import { z } from "zod";
import { eq, like, sql, or, and } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loads, drivers, users, documents, companies } from "../../drizzle/schema";

export const searchRouter = router({
  global: protectedProcedure.input(z.object({ query: z.string(), type: z.string().optional(), filters: z.any().optional() }).optional()).query(async ({ ctx, input }) => {
    const empty = { loads: [], drivers: [], catalysts: [], invoices: [], total: 0, counts: { loads: 0, drivers: 0, catalysts: 0, invoices: 0 }, results: [] as any[] };
    if (!input?.query || input.query.trim().length < 2) return empty;
    const db = await getDb();
    if (!db) return empty;
    const q = `%${input.query.trim()}%`;
    const userId = ctx.user?.id;
    const userRole = ctx.user?.role || "SHIPPER";
    const companyId = ctx.user?.companyId;

    try {
      const results: any[] = [];

      // ── LOADS ──────────────────────────────────────────────────────────
      // Scope: admin/super_admin/broker see all; shipper sees own; catalyst sees assigned; driver sees assigned
      const isAdminRole = userRole === "SUPER_ADMIN" || userRole === "ADMIN";
      const loadScope = isAdminRole ? undefined
        : userRole === "SHIPPER" ? eq(loads.shipperId, userId)
        : userRole === "CATALYST" ? eq(loads.catalystId, userId)
        : userRole === "DRIVER" ? eq(loads.driverId, userId)
        : undefined; // broker see all

      const loadMatch = or(
        like(loads.loadNumber, q),
        like(loads.status, q),
        like(loads.cargoType, q),
        like(loads.commodityName, q),
        like(loads.specialInstructions, q),
        sql`JSON_UNQUOTE(JSON_EXTRACT(${loads.pickupLocation}, '$.city')) LIKE ${q}`,
        sql`JSON_UNQUOTE(JSON_EXTRACT(${loads.pickupLocation}, '$.state')) LIKE ${q}`,
        sql`JSON_UNQUOTE(JSON_EXTRACT(${loads.pickupLocation}, '$.address')) LIKE ${q}`,
        sql`JSON_UNQUOTE(JSON_EXTRACT(${loads.deliveryLocation}, '$.city')) LIKE ${q}`,
        sql`JSON_UNQUOTE(JSON_EXTRACT(${loads.deliveryLocation}, '$.state')) LIKE ${q}`,
        sql`JSON_UNQUOTE(JSON_EXTRACT(${loads.deliveryLocation}, '$.address')) LIKE ${q}`,
      );

      const loadWhere = loadScope ? and(loadScope, loadMatch) : loadMatch;

      let loadResults: any[] = [];
      try {
        loadResults = await db.select({
          id: loads.id, loadNumber: loads.loadNumber, status: loads.status,
          cargoType: loads.cargoType, commodityName: loads.commodityName,
          pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation,
        }).from(loads).where(loadWhere!).limit(10);
      } catch (e) { console.error("[search.global] loads query error:", e); }

      for (const l of loadResults) {
        const origin = (l.pickupLocation as any)?.city || "";
        const dest = (l.deliveryLocation as any)?.city || "";
        const commodity = l.commodityName ? ` · ${l.commodityName}` : "";
        results.push({
          id: String(l.id), type: "load",
          title: l.loadNumber || `LOAD-${l.id}`,
          subtitle: `${origin}${origin && dest ? " → " : ""}${dest}${l.status ? ` · ${l.status}` : ""}${commodity}`,
          match: 95,
        });
      }

      // ── USERS (drivers, catalysts, etc.) ───────────────────────────────
      const userMatch = or(like(users.name, q), like(users.email, q), like(users.phone, q));
      const userWhere = isAdminRole
        ? userMatch
        : companyId
          ? and(eq(users.companyId, companyId), userMatch)
          : userMatch;

      let userResults: any[] = [];
      try {
        userResults = await db.select({ id: users.id, name: users.name, role: users.role, email: users.email })
          .from(users).where(userWhere!).limit(8);
      } catch (e) { console.error("[search.global] users query error:", e); }

      for (const u of userResults) {
        const type = u.role === "DRIVER" ? "driver" : u.role === "CATALYST" ? "catalyst" : "user";
        results.push({ id: String(u.id), type, title: u.name || "Unknown", subtitle: `${u.role || ""} · ${u.email || ""}`, match: 85 });
      }

      // ── COMPANIES ─────────────────────────────────────────────────────
      let companyResults: any[] = [];
      try {
        const companyMatch = or(like(companies.name, q), like(companies.legalName, q), like(companies.dotNumber, q), like(companies.mcNumber, q), like(companies.city, q), like(companies.state, q));
        const companyWhere = isAdminRole ? companyMatch : (companyId ? and(eq(companies.id, companyId), companyMatch) : companyMatch);
        companyResults = await db.select({ id: companies.id, name: companies.name, legalName: companies.legalName })
          .from(companies).where(companyWhere!).limit(5);
      } catch { /* companies table may not exist yet */ }

      for (const c of companyResults) {
        results.push({ id: String(c.id), type: "company", title: c.name || c.legalName || "Company", subtitle: c.legalName && c.legalName !== c.name ? c.legalName : "Company", match: 80 });
      }

      // ── DOCUMENTS ─────────────────────────────────────────────────────
      let docResults: any[] = [];
      try {
        const docWhere = isAdminRole
          ? like(documents.name, q)
          : companyId
            ? and(or(eq(documents.userId, userId), eq(documents.companyId, companyId)), like(documents.name, q))
            : and(eq(documents.userId, userId), like(documents.name, q));
        docResults = await db.select({ id: documents.id, name: documents.name, type: documents.type })
          .from(documents).where(docWhere!).limit(5);
      } catch { /* documents table may not exist yet */ }

      for (const d of docResults) {
        results.push({ id: String(d.id), type: "document", title: d.name || "Document", subtitle: d.type || "file", match: 75 });
      }

      // Sort by match score descending
      results.sort((a, b) => b.match - a.match);

      return {
        loads: loadResults.map((l: any) => ({ id: String(l.id), loadNumber: l.loadNumber, match: 95 })),
        drivers: userResults.filter((u: any) => u.role === "DRIVER").map((u: any) => ({ id: String(u.id), name: u.name, match: 85 })),
        catalysts: userResults.filter((u: any) => u.role === "CATALYST").map((u: any) => ({ id: String(u.id), name: u.name, match: 85 })),
        invoices: [],
        total: results.length,
        counts: {
          loads: loadResults.length,
          drivers: userResults.filter((u: any) => u.role === "DRIVER").length,
          catalysts: userResults.filter((u: any) => u.role === "CATALYST").length,
          invoices: 0,
          documents: docResults.length,
          companies: companyResults.length,
        },
        results,
      };
    } catch (err) { console.error("[search.global]", err); return empty; }
  }),

  getRecent: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async () => []),
});
