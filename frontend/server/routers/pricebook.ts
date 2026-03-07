/**
 * PRICEBOOK ROUTER — WS-DC-004
 * Flexible rate sheets with cascading lookup priority
 *
 * Procedures:
 *   getEntries       — list pricebook entries with filters
 *   createEntry      — create a new rate entry
 *   updateEntry      — update rate (records history)
 *   deactivateEntry  — soft-delete entry
 *   lookupRate       — cascading priority rate lookup
 *   importRates      — CSV bulk rate import
 *   exportRates      — CSV export
 *   getRateHistory   — rate change timeline
 */

import { z } from "zod";
import { isolatedApprovedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { requireAccess } from "../services/security/rbac/access-check";
import { pricebookEntries, pricebookHistory } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

export const pricebookRouter = router({

  /**
   * getEntries — List pricebook entries with optional filters
   */
  getEntries: protectedProcedure
    .input(z.object({
      cargoType: z.string().optional(),
      hazmatClass: z.string().optional(),
      originTerminalId: z.number().optional(),
      destinationTerminalId: z.number().optional(),
      customerCompanyId: z.number().optional(),
      isActive: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;
      if (!companyId) throw new Error("Company context required");

      const conditions = [sql`${pricebookEntries.companyId} = ${companyId}`];
      if (input?.cargoType) conditions.push(sql`${pricebookEntries.cargoType} = ${input.cargoType}`);
      if (input?.hazmatClass) conditions.push(sql`${pricebookEntries.hazmatClass} = ${input.hazmatClass}`);
      if (input?.originTerminalId) conditions.push(sql`${pricebookEntries.originTerminalId} = ${input.originTerminalId}`);
      if (input?.destinationTerminalId) conditions.push(sql`${pricebookEntries.destinationTerminalId} = ${input.destinationTerminalId}`);
      if (input?.customerCompanyId) conditions.push(sql`${pricebookEntries.customerCompanyId} = ${input.customerCompanyId}`);
      if (input?.isActive !== undefined) conditions.push(sql`${pricebookEntries.isActive} = ${input.isActive ? 1 : 0}`);

      const entries = await db.select().from(pricebookEntries)
        .where(sql.join(conditions, sql` AND `))
        .orderBy(sql`${pricebookEntries.entryName} ASC`);

      return { entries };
    }),

  /**
   * createEntry — Create a new pricebook entry
   */
  createEntry: protectedProcedure
    .input(z.object({
      entryName: z.string().min(1),
      originCity: z.string().optional(),
      originState: z.string().max(2).optional(),
      originTerminalId: z.number().optional(),
      destinationCity: z.string().optional(),
      destinationState: z.string().max(2).optional(),
      destinationTerminalId: z.number().optional(),
      cargoType: z.string().optional(),
      hazmatClass: z.string().optional(),
      rateType: z.enum(["per_mile", "flat", "per_barrel", "per_gallon", "per_ton"]),
      rate: z.number().positive(),
      fscIncluded: z.boolean().optional(),
      fscMethod: z.string().optional(),
      fscValue: z.number().optional(),
      minimumCharge: z.number().optional(),
      customerCompanyId: z.number().optional(),
      effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || "DISPATCH", companyId: (ctx.user as any)?.companyId, action: "CREATE", resource: "INVOICE" }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;
      const userId = Number((ctx.user as any)?.id) || 0;

      if (input.expirationDate && input.expirationDate < input.effectiveDate) {
        throw new Error("Expiration date must be on or after effective date");
      }

      await (db as any).execute(
        sql`INSERT INTO pricebook_entries (companyId, entryName, originCity, originState, originTerminalId, destinationCity, destinationState, destinationTerminalId, cargoType, hazmatClass, rateType, rate, fscIncluded, fscMethod, fscValue, minimumCharge, customerCompanyId, effectiveDate, expirationDate, createdBy) VALUES (${companyId}, ${input.entryName}, ${input.originCity || null}, ${input.originState || null}, ${input.originTerminalId || null}, ${input.destinationCity || null}, ${input.destinationState || null}, ${input.destinationTerminalId || null}, ${input.cargoType || null}, ${input.hazmatClass || null}, ${input.rateType}, ${input.rate.toFixed(4)}, ${input.fscIncluded ? 1 : 0}, ${input.fscMethod || null}, ${input.fscValue?.toFixed(4) || null}, ${input.minimumCharge?.toFixed(2) || null}, ${input.customerCompanyId || null}, ${input.effectiveDate}, ${input.expirationDate || null}, ${userId})`
      );

      const [entry] = await db.select().from(pricebookEntries)
        .where(and(eq(pricebookEntries.companyId, companyId), eq(pricebookEntries.entryName, input.entryName)))
        .orderBy(sql`${pricebookEntries.id} DESC`)
        .limit(1);

      return { id: entry?.id, entryName: input.entryName, status: "active" };
    }),

  /**
   * updateEntry — Update rate (records history)
   */
  updateEntry: protectedProcedure
    .input(z.object({
      entryId: z.number(),
      rate: z.number().positive().optional(),
      entryName: z.string().optional(),
      fscIncluded: z.boolean().optional(),
      fscMethod: z.string().optional(),
      fscValue: z.number().optional(),
      minimumCharge: z.number().optional(),
      expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || "DISPATCH", companyId: (ctx.user as any)?.companyId, action: "UPDATE", resource: "INVOICE" }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;
      const userId = Number((ctx.user as any)?.id) || 0;

      const [entry] = await db.select().from(pricebookEntries)
        .where(and(eq(pricebookEntries.id, input.entryId), eq(pricebookEntries.companyId, companyId)))
        .limit(1);
      if (!entry) throw new Error("Entry not found");

      // Record rate history if rate changed
      if (input.rate !== undefined && input.rate !== Number(entry.rate)) {
        await (db as any).execute(
          sql`INSERT INTO pricebook_history (pricebookEntryId, previousRate, newRate, changedBy) VALUES (${entry.id}, ${entry.rate}, ${input.rate.toFixed(4)}, ${userId})`
        );
      }

      const updates: string[] = [];
      if (input.rate !== undefined) updates.push(`rate = ${input.rate.toFixed(4)}`);
      if (input.entryName !== undefined) updates.push(`entryName = '${input.entryName.replace(/'/g, "''")}'`);
      if (input.fscIncluded !== undefined) updates.push(`fscIncluded = ${input.fscIncluded ? 1 : 0}`);
      if (input.fscMethod !== undefined) updates.push(`fscMethod = '${input.fscMethod}'`);
      if (input.fscValue !== undefined) updates.push(`fscValue = ${input.fscValue.toFixed(4)}`);
      if (input.minimumCharge !== undefined) updates.push(`minimumCharge = ${input.minimumCharge.toFixed(2)}`);
      if (input.expirationDate !== undefined) updates.push(`expirationDate = '${input.expirationDate}'`);

      if (updates.length > 0) {
        await (db as any).execute(sql.raw(`UPDATE pricebook_entries SET ${updates.join(", ")} WHERE id = ${entry.id}`));
      }

      return { id: entry.id, entryName: input.entryName || entry.entryName, rate: input.rate || Number(entry.rate) };
    }),

  /**
   * deactivateEntry — Soft-delete
   */
  deactivateEntry: protectedProcedure
    .input(z.object({ entryId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || "DISPATCH", companyId: (ctx.user as any)?.companyId, action: "UPDATE", resource: "INVOICE" }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      await db.update(pricebookEntries)
        .set({ isActive: 0 })
        .where(and(eq(pricebookEntries.id, input.entryId), eq(pricebookEntries.companyId, companyId)));

      return { id: input.entryId, isActive: false };
    }),

  /**
   * lookupRate — Cascading priority rate lookup
   * Priority: terminal > city > state, customer-specific > general
   */
  lookupRate: protectedProcedure
    .input(z.object({
      originTerminalId: z.number().optional(),
      originCity: z.string().optional(),
      originState: z.string().max(2).optional(),
      destinationTerminalId: z.number().optional(),
      destinationCity: z.string().optional(),
      destinationState: z.string().max(2).optional(),
      cargoType: z.string(),
      customerCompanyId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      const today = new Date().toISOString().split("T")[0];

      // Build cascading queries in priority order
      const lookups: { label: string; where: string }[] = [];

      // Level 1: Terminal-specific + customer
      if (input.originTerminalId && input.destinationTerminalId && input.customerCompanyId) {
        lookups.push({
          label: "terminal+customer",
          where: `originTerminalId = ${input.originTerminalId} AND destinationTerminalId = ${input.destinationTerminalId} AND customerCompanyId = ${input.customerCompanyId}`,
        });
      }
      // Level 2: Terminal-specific
      if (input.originTerminalId && input.destinationTerminalId) {
        lookups.push({
          label: "terminal",
          where: `originTerminalId = ${input.originTerminalId} AND destinationTerminalId = ${input.destinationTerminalId} AND customerCompanyId IS NULL`,
        });
      }
      // Level 3: City + customer
      if (input.originCity && input.destinationCity && input.customerCompanyId) {
        lookups.push({
          label: "city+customer",
          where: `originCity = '${input.originCity.replace(/'/g, "''")}' AND destinationCity = '${input.destinationCity.replace(/'/g, "''")}' AND customerCompanyId = ${input.customerCompanyId}`,
        });
      }
      // Level 4: City
      if (input.originCity && input.destinationCity) {
        lookups.push({
          label: "city",
          where: `originCity = '${input.originCity.replace(/'/g, "''")}' AND destinationCity = '${input.destinationCity.replace(/'/g, "''")}' AND customerCompanyId IS NULL`,
        });
      }
      // Level 5: State + customer
      if (input.originState && input.destinationState && input.customerCompanyId) {
        lookups.push({
          label: "state+customer",
          where: `originState = '${input.originState}' AND destinationState = '${input.destinationState}' AND customerCompanyId = ${input.customerCompanyId}`,
        });
      }
      // Level 6: State
      if (input.originState && input.destinationState) {
        lookups.push({
          label: "state",
          where: `originState = '${input.originState}' AND destinationState = '${input.destinationState}' AND customerCompanyId IS NULL`,
        });
      }

      for (const lookup of lookups) {
        const [rows]: any = await (db as any).execute(
          sql.raw(`SELECT id, rate, fscIncluded, fscValue, minimumCharge, rateType FROM pricebook_entries WHERE companyId = ${companyId} AND isActive = 1 AND cargoType = '${(input.cargoType || "").replace(/'/g, "''")}' AND effectiveDate <= '${today}' AND (expirationDate IS NULL OR expirationDate >= '${today}') AND ${lookup.where} ORDER BY effectiveDate DESC LIMIT 1`)
        );
        const match = Array.isArray(rows) ? rows[0] : null;
        if (match) {
          return {
            entryId: match.id,
            rate: Number(match.rate),
            fscIncluded: !!match.fscIncluded,
            fscValue: Number(match.fscValue) || 0,
            minimumCharge: Number(match.minimumCharge) || 0,
            rateType: match.rateType,
            matchLevel: lookup.label,
          };
        }
      }

      return null;
    }),

  /**
   * importRates — CSV bulk rate import
   */
  importRates: protectedProcedure
    .input(z.object({ csvText: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || "DISPATCH", companyId: (ctx.user as any)?.companyId, action: "CREATE", resource: "INVOICE" }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;
      const userId = Number((ctx.user as any)?.id) || 0;

      const lines = input.csvText.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) throw new Error("CSV must have header + at least 1 data row");

      const headers = lines[0].split(",").map(h => h.trim().replace(/^"/, "").replace(/"$/, ""));
      let imported = 0, failed = 0;
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(",").map(v => v.trim().replace(/^"/, "").replace(/"$/, ""));
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => { row[h] = values[idx] || ""; });

          if (!row.entryName || !row.rateType || !row.rate || !row.effectiveDate) {
            errors.push(`Row ${i}: Missing required fields`);
            failed++;
            continue;
          }

          await (db as any).execute(
            sql`INSERT INTO pricebook_entries (companyId, entryName, originCity, originState, originTerminalId, destinationCity, destinationState, destinationTerminalId, cargoType, hazmatClass, rateType, rate, fscIncluded, fscMethod, fscValue, minimumCharge, customerCompanyId, effectiveDate, expirationDate, createdBy) VALUES (${companyId}, ${row.entryName}, ${row.originCity || null}, ${row.originState || null}, ${row.originTerminalId ? Number(row.originTerminalId) : null}, ${row.destinationCity || null}, ${row.destinationState || null}, ${row.destinationTerminalId ? Number(row.destinationTerminalId) : null}, ${row.cargoType || null}, ${row.hazmatClass || null}, ${row.rateType}, ${Number(row.rate).toFixed(4)}, ${row.fscIncluded === "true" ? 1 : 0}, ${row.fscMethod || null}, ${row.fscValue ? Number(row.fscValue).toFixed(4) : null}, ${row.minimumCharge ? Number(row.minimumCharge).toFixed(2) : null}, ${row.customerCompanyId ? Number(row.customerCompanyId) : null}, ${row.effectiveDate}, ${row.expirationDate || null}, ${userId})`
          );
          imported++;
        } catch (err: any) {
          errors.push(`Row ${i}: ${err.message}`);
          failed++;
        }
      }

      return { importedCount: imported, failedCount: failed, errors };
    }),

  /**
   * exportRates — CSV export
   */
  exportRates: protectedProcedure
    .input(z.object({
      isActive: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      const conditions = [sql`${pricebookEntries.companyId} = ${companyId}`];
      if (input?.isActive !== undefined) conditions.push(sql`${pricebookEntries.isActive} = ${input.isActive ? 1 : 0}`);

      const entries = await db.select().from(pricebookEntries)
        .where(sql.join(conditions, sql` AND `))
        .orderBy(sql`${pricebookEntries.entryName} ASC`);

      const headers = ["entryName", "originCity", "originState", "originTerminalId", "destinationCity", "destinationState", "destinationTerminalId", "cargoType", "hazmatClass", "rateType", "rate", "fscIncluded", "fscMethod", "fscValue", "minimumCharge", "customerCompanyId", "effectiveDate", "expirationDate"];
      const csvLines = [headers.join(",")];

      for (const e of entries) {
        csvLines.push([
          `"${e.entryName}"`, e.originCity || "", e.originState || "", e.originTerminalId || "",
          e.destinationCity || "", e.destinationState || "", e.destinationTerminalId || "",
          e.cargoType || "", e.hazmatClass || "", e.rateType, e.rate,
          e.fscIncluded ? "true" : "false", e.fscMethod || "", e.fscValue || "",
          e.minimumCharge || "", e.customerCompanyId || "", e.effectiveDate, e.expirationDate || "",
        ].join(","));
      }

      return { csv: csvLines.join("\n"), fileName: "pricebook_export.csv" };
    }),

  /**
   * getRateHistory — Rate change timeline for an entry
   */
  getRateHistory: protectedProcedure
    .input(z.object({ entryId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      // Verify entry belongs to company
      const [entry] = await db.select().from(pricebookEntries)
        .where(and(eq(pricebookEntries.id, input.entryId), eq(pricebookEntries.companyId, companyId)))
        .limit(1);
      if (!entry) throw new Error("Entry not found");

      const history = await db.select().from(pricebookHistory)
        .where(eq(pricebookHistory.pricebookEntryId, input.entryId))
        .orderBy(sql`${pricebookHistory.changedAt} DESC`);

      return {
        entryName: entry.entryName,
        currentRate: entry.rate,
        history: history.map(h => ({
          date: h.changedAt,
          previousRate: h.previousRate,
          newRate: h.newRate,
          changedBy: h.changedBy,
        })),
      };
    }),
});
