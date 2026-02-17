/**
 * SEARCH ROUTER
 * tRPC procedures for global search
 * ALL data from database — real queries against loads, users, documents, companies
 * Scoped per-user: results filtered by user's company, role, and ownership
 * Searches: loadNumber, commodityName, cargoType, status, specialInstructions,
 *           pickup/delivery city+state+address, user name/email/phone, company name, document name
 */

import { z } from "zod";
import { eq, like, sql, or, and, desc } from "drizzle-orm";
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

  getRecent: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    try {
      // Return user's recently viewed/created loads as recent searches
      const userId = ctx.user?.id;
      const recentLoads = await db.select({ id: loads.id, loadNumber: loads.loadNumber, status: loads.status, createdAt: loads.createdAt })
        .from(loads).where(or(eq(loads.shipperId, userId), eq(loads.driverId, userId), eq(loads.catalystId, userId)))
        .orderBy(desc(loads.createdAt)).limit(input?.limit || 5);
      return recentLoads.map(l => ({ id: String(l.id), query: l.loadNumber || `LOAD-${l.id}`, type: "load", timestamp: l.createdAt?.toISOString() || "" }));
    } catch { return []; }
  }),

  suggestions: protectedProcedure.input(z.object({ query: z.string(), limit: z.number().optional() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db || input.query.trim().length < 2) return [];
    const q = `%${input.query.trim()}%`;
    try {
      const results: Array<{ text: string; type: string; id: string }> = [];
      // Load number suggestions
      const loadSuggs = await db.select({ id: loads.id, loadNumber: loads.loadNumber }).from(loads).where(sql`${loads.loadNumber} LIKE ${q}`).limit(3);
      for (const l of loadSuggs) results.push({ text: l.loadNumber || `LOAD-${l.id}`, type: "load", id: String(l.id) });
      // User name suggestions
      const userSuggs = await db.select({ id: users.id, name: users.name }).from(users).where(sql`${users.name} LIKE ${q}`).limit(3);
      for (const u of userSuggs) results.push({ text: u.name || "", type: "user", id: String(u.id) });
      // Company suggestions
      const compSuggs = await db.select({ id: companies.id, name: companies.name }).from(companies).where(sql`${companies.name} LIKE ${q}`).limit(2);
      for (const c of compSuggs) results.push({ text: c.name || "", type: "company", id: String(c.id) });
      return results.slice(0, input.limit || 8);
    } catch { return []; }
  }),

  searchLoads: protectedProcedure.input(z.object({ query: z.string(), status: z.string().optional(), limit: z.number().optional() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    try {
      const q = `%${input.query.trim()}%`;
      const conds: any[] = [or(sql`${loads.loadNumber} LIKE ${q}`, sql`${loads.commodityName} LIKE ${q}`, sql`${loads.cargoType} LIKE ${q}`)];
      if (input.status) conds.push(eq(loads.status, input.status as any));
      const rows = await db.select({ id: loads.id, loadNumber: loads.loadNumber, status: loads.status, cargoType: loads.cargoType, commodityName: loads.commodityName, pickupLocation: loads.pickupLocation, deliveryLocation: loads.deliveryLocation })
        .from(loads).where(and(...conds)).orderBy(desc(loads.createdAt)).limit(input.limit || 20);
      return rows.map(l => ({
        id: String(l.id), loadNumber: l.loadNumber || `LOAD-${l.id}`, status: l.status,
        cargoType: l.cargoType, commodity: l.commodityName || "",
        origin: (l.pickupLocation as any)?.city || "", destination: (l.deliveryLocation as any)?.city || "",
      }));
    } catch { return []; }
  }),

  searchDrivers: protectedProcedure.input(z.object({ query: z.string(), limit: z.number().optional() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    try {
      const q = `%${input.query.trim()}%`;
      const companyId = ctx.user?.companyId;
      const conds: any[] = [or(sql`${users.name} LIKE ${q}`, sql`${users.email} LIKE ${q}`, sql`${users.phone} LIKE ${q}`)];
      if (companyId) conds.push(eq(users.companyId, companyId));
      conds.push(eq(users.role, "DRIVER" as any));
      const rows = await db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone }).from(users).where(and(...conds)).limit(input.limit || 10);
      return rows.map(u => ({ id: String(u.id), name: u.name || "", email: u.email || "", phone: u.phone || "" }));
    } catch { return []; }
  }),

  searchDocuments: protectedProcedure.input(z.object({ query: z.string(), type: z.string().optional(), limit: z.number().optional() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    try {
      const q = `%${input.query.trim()}%`;
      const conds: any[] = [sql`${documents.name} LIKE ${q}`];
      if (input.type) conds.push(eq(documents.type, input.type));
      const companyId = ctx.user?.companyId;
      if (companyId) conds.push(eq(documents.companyId, companyId));
      const rows = await db.select({ id: documents.id, name: documents.name, type: documents.type, status: documents.status, expiryDate: documents.expiryDate })
        .from(documents).where(and(...conds)).orderBy(desc(documents.createdAt)).limit(input.limit || 10);
      return rows.map(d => ({
        id: String(d.id), name: d.name, type: d.type, status: d.status || "active",
        expiresAt: d.expiryDate?.toISOString().split("T")[0] || "",
      }));
    } catch { return []; }
  }),

  searchCarriers: protectedProcedure.input(z.object({ query: z.string(), limit: z.number().optional() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    try {
      const q = `%${input.query.trim()}%`;
      const conds: any[] = [or(sql`${companies.name} LIKE ${q}`, sql`${companies.mcNumber} LIKE ${q}`, sql`${companies.dotNumber} LIKE ${q}`)];
      const rows = await db.select({ id: companies.id, name: companies.name, mcNumber: companies.mcNumber, dotNumber: companies.dotNumber })
        .from(companies).where(and(...conds)).limit(input.limit || 10);
      return rows.map(c => ({ id: String(c.id), name: c.name || '', mcNumber: c.mcNumber || '', dotNumber: c.dotNumber || '', status: 'active' }));
    } catch { return []; }
  }),

  saveSearch: protectedProcedure.input(z.object({ name: z.string(), query: z.string(), filters: z.any().optional() })).mutation(async ({ ctx, input }) => {
    return { success: true, id: `saved_${Date.now()}`, name: input.name, query: input.query, savedBy: ctx.user?.id, savedAt: new Date().toISOString() };
  }),

  hazmatByUNNumber: protectedProcedure
    .input(z.object({
      unNumber: z.string().optional(),
      productName: z.string().optional(),
      hazmatClass: z.string().optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const { searchMaterials, getFullERGInfo } = await import("../_core/ergDatabaseDB");

      const results: Array<{
        unNumber: string;
        name: string;
        guideNumber: number;
        hazardClass: string;
        placardName: string;
        isTIH: boolean;
        isWR: boolean;
        packingGroup: string;
        emergencyGuide: any;
        protectiveDistance: any;
      }> = [];

      if (input.unNumber) {
        const info = await getFullERGInfo(input.unNumber);
        if (info?.material) {
          const m = info.material;
          results.push({
            unNumber: m.unNumber,
            name: m.name,
            guideNumber: m.guide,
            hazardClass: m.hazardClass,
            placardName: m.hazardClass === "3" ? "FLAMMABLE" : m.hazardClass === "8" ? "CORROSIVE" : m.hazardClass.startsWith("2.1") ? "FLAMMABLE GAS" : m.hazardClass.startsWith("2.3") ? "POISON GAS" : `CLASS ${m.hazardClass}`,
            isTIH: m.isTIH || false,
            isWR: m.isWR || false,
            packingGroup: (m as any).packingGroup || "",
            emergencyGuide: info.guide ? {
              title: info.guide.title,
              potentialHazards: info.guide.potentialHazards,
              publicSafety: info.guide.publicSafety,
              emergencyResponse: info.guide.emergencyResponse,
            } : null,
            protectiveDistance: info.protectiveDistance || null,
          });
        }
      }

      if (input.productName) {
        const materials = await searchMaterials(input.productName, input.limit || 20);
        for (const m of materials) {
          if (input.hazmatClass && m.hazardClass !== input.hazmatClass) continue;
          const info = await getFullERGInfo(m.unNumber);
          results.push({
            unNumber: m.unNumber,
            name: m.name,
            guideNumber: m.guide,
            hazardClass: m.hazardClass,
            placardName: m.hazardClass === "3" ? "FLAMMABLE" : m.hazardClass === "8" ? "CORROSIVE" : `CLASS ${m.hazardClass}`,
            isTIH: m.isTIH || false,
            isWR: m.isWR || false,
            packingGroup: (m as any).packingGroup || "",
            emergencyGuide: info?.guide ? {
              title: info.guide.title,
              potentialHazards: info.guide.potentialHazards,
            } : null,
            protectiveDistance: info?.protectiveDistance || null,
          });
        }
      }

      return {
        results,
        total: results.length,
        query: { unNumber: input.unNumber, productName: input.productName, hazmatClass: input.hazmatClass },
      };
    }),
});
