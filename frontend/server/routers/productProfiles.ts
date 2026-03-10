/**
 * PRODUCT PROFILES tRPC ROUTER
 * 7 procedures: create, list, get, update, delete, incrementUsage, createFromWizard
 * Powers wizard Step 0 "My Products", Settings "My Products" tab, and "Save as Product" modal
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getPool } from "../db";
import { TRPCError } from "@trpc/server";
import { unsafeCast } from "../_core/types/unsafe";

// Helper: resolve numeric user ID from context
function resolveUserId(user: any): number {
  if (!user) return 0;
  const id = user.id || user.userId;
  return typeof id === "number" ? id : parseInt(id, 10) || 0;
}

// Helper: resolve companyId from context
function resolveCompanyId(user: any): number {
  return user?.companyId || 0;
}

// Shared field schema for create + update
const productFieldsSchema = z.object({
  nickname: z.string().max(100).optional(),
  description: z.string().optional(),
  isCompanyShared: z.boolean().optional(),
  trailerType: z.string().max(50).optional(),
  equipment: z.string().max(50).optional(),
  productName: z.string().max(255).optional(),
  cargoType: z.string().max(30).optional(),
  hazmatClass: z.string().max(10).optional(),
  unNumber: z.string().max(10).optional(),
  ergGuide: z.number().optional(),
  isTIH: z.boolean().optional(),
  isWR: z.boolean().optional(),
  placardName: z.string().max(100).optional(),
  properShippingName: z.string().max(255).optional(),
  packingGroup: z.string().max(5).optional(),
  technicalName: z.string().max(255).optional(),
  emergencyResponseNumber: z.string().max(50).optional(),
  emergencyPhone: z.string().max(20).optional(),
  hazardClassNumber: z.string().max(10).optional(),
  subsidiaryHazards: z.array(z.string()).optional(),
  specialPermit: z.string().max(100).optional(),
  defaultQuantity: z.number().optional(),
  quantityUnit: z.string().max(30).optional(),
  weightUnit: z.string().max(30).optional(),
  volumeUnit: z.string().max(30).optional(),
  hoseType: z.string().max(50).optional(),
  hoseLength: z.string().max(50).optional(),
  fittingType: z.string().max(50).optional(),
  pumpRequired: z.boolean().optional(),
  compressorRequired: z.boolean().optional(),
  bottomLoadRequired: z.boolean().optional(),
  vaporRecoveryRequired: z.boolean().optional(),
  apiGravity: z.number().optional(),
  bsw: z.number().optional(),
  sulfurContent: z.number().optional(),
  flashPoint: z.number().optional(),
  viscosity: z.number().optional(),
  pourPoint: z.number().optional(),
  reidVaporPressure: z.number().optional(),
  appearance: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  customNotes: z.string().optional(),
});

// All columns that can be written via create/update
const WRITABLE_COLUMNS = [
  "nickname", "description", "isCompanyShared", "trailerType", "equipment",
  "productName", "cargoType", "hazmatClass", "unNumber", "ergGuide",
  "isTIH", "isWR", "placardName", "properShippingName", "packingGroup",
  "technicalName", "emergencyResponseNumber", "emergencyPhone",
  "hazardClassNumber", "subsidiaryHazards", "specialPermit",
  "defaultQuantity", "quantityUnit", "weightUnit", "volumeUnit",
  "hoseType", "hoseLength", "fittingType", "pumpRequired",
  "compressorRequired", "bottomLoadRequired", "vaporRecoveryRequired",
  "apiGravity", "bsw", "sulfurContent", "flashPoint", "viscosity",
  "pourPoint", "reidVaporPressure", "appearance", "tags", "customNotes",
];

function serializeValue(key: string, val: any): any {
  if (val === undefined || val === null) return null;
  if (key === "subsidiaryHazards" || key === "tags") return JSON.stringify(val);
  return val;
}

function parseJsonFields(row: any): any {
  if (!row) return row;
  try { row.subsidiaryHazards = row.subsidiaryHazards ? JSON.parse(row.subsidiaryHazards) : null; } catch { row.subsidiaryHazards = null; }
  try { row.tags = row.tags ? JSON.parse(row.tags) : []; } catch { row.tags = []; }
  return row;
}

export const productProfilesRouter = router({
  // ── CREATE ──
  create: protectedProcedure
    .input(productFieldsSchema.extend({
      productId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = resolveUserId(ctx.user);
      const companyId = resolveCompanyId(ctx.user);
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const pool = getPool();
      if (!pool) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const cols = ["userId", "companyId"];
      const vals: any[] = [userId, companyId];

      if (input.productId) {
        cols.push("productId");
        vals.push(input.productId);
      }

      for (const key of WRITABLE_COLUMNS) {
        const val = unsafeCast(input)[key];
        if (val !== undefined) {
          cols.push(key);
          vals.push(serializeValue(key, val));
        }
      }

      const placeholders = cols.map(() => "?").join(", ");
      const [result]: any = await pool.execute(
        `INSERT INTO product_profiles (${cols.join(", ")}) VALUES (${placeholders})`,
        vals
      );

      return { id: result.insertId, nickname: input.nickname || null };
    }),

  // ── LIST (user's own + company shared) ──
  list: protectedProcedure
    .input(z.object({
      includeCompanyShared: z.boolean().default(true),
      search: z.string().optional(),
      hazmatOnly: z.boolean().default(false),
      sortBy: z.enum(["lastUsed", "name", "usageCount", "created"]).default("lastUsed"),
    }).optional())
    .query(async ({ ctx, input }) => {
      const userId = resolveUserId(ctx.user);
      const companyId = resolveCompanyId(ctx.user);
      if (!userId) return [];

      const pool = getPool();
      if (!pool) return [];

      const opts = input || { includeCompanyShared: true, sortBy: "lastUsed" as const, hazmatOnly: false };

      let where = "WHERE deletedAt IS NULL AND (userId = ?";
      const params: any[] = [userId];

      if (opts.includeCompanyShared && companyId) {
        where += " OR (companyId = ? AND isCompanyShared = TRUE)";
        params.push(companyId);
      }
      where += ")";

      if (opts.hazmatOnly) {
        where += " AND hazmatClass IS NOT NULL";
      }

      const orderMap: Record<string, string> = {
        lastUsed: "COALESCE(lastUsedAt, createdAt) DESC",
        name: "COALESCE(nickname, productLabel, productName) ASC",
        usageCount: "usageCount DESC",
        created: "createdAt DESC",
      };
      const orderBy = orderMap[opts.sortBy] || orderMap.lastUsed;

      const [rows]: any = await pool.execute(
        `SELECT * FROM product_profiles ${where} ORDER BY ${orderBy} LIMIT 200`,
        params
      );

      let results = (rows as never[]).map(parseJsonFields);

      if (opts.search) {
        const q = opts.search.toLowerCase();
        results = results.filter((r: any) =>
          r.nickname?.toLowerCase().includes(q) ||
          r.productName?.toLowerCase().includes(q) ||
          r.productLabel?.toLowerCase().includes(q) ||
          (r.tags as string[])?.some((t: string) => t.toLowerCase().includes(q))
        );
      }

      return results;
    }),

  // ── GET single ──
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const userId = resolveUserId(ctx.user);
      const companyId = resolveCompanyId(ctx.user);
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const pool = getPool();
      if (!pool) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [rows]: any = await pool.execute(
        `SELECT * FROM product_profiles WHERE id = ? AND deletedAt IS NULL AND (userId = ? OR (companyId = ? AND isCompanyShared = TRUE)) LIMIT 1`,
        [input.id, userId, companyId]
      );

      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Product profile not found" });
      return parseJsonFields(rows[0]);
    }),

  // ── UPDATE (partial) ──
  update: protectedProcedure
    .input(z.object({ id: z.number() }).merge(productFieldsSchema.partial()))
    .mutation(async ({ ctx, input }) => {
      const userId = resolveUserId(ctx.user);
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const pool = getPool();
      if (!pool) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify ownership
      const [existing]: any = await pool.execute(
        "SELECT id FROM product_profiles WHERE id = ? AND userId = ?",
        [input.id, userId]
      );
      if (!existing.length) throw new TRPCError({ code: "FORBIDDEN", message: "Cannot modify this product" });

      const updates: string[] = [];
      const vals: any[] = [];

      for (const key of WRITABLE_COLUMNS) {
        const val = unsafeCast(input)[key];
        if (val !== undefined) {
          updates.push(`${key} = ?`);
          vals.push(serializeValue(key, val));
        }
      }

      if (updates.length === 0) return { success: true };

      vals.push(input.id, userId);
      await pool.execute(
        `UPDATE product_profiles SET ${updates.join(", ")} WHERE id = ? AND userId = ?`,
        vals
      );

      return { success: true };
    }),

  // ── DELETE (soft) ──
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = resolveUserId(ctx.user);
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const pool = getPool();
      if (!pool) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [existing]: any = await pool.execute(
        "SELECT id FROM product_profiles WHERE id = ? AND userId = ?",
        [input.id, userId]
      );
      if (!existing.length) throw new TRPCError({ code: "FORBIDDEN" });

      await pool.execute(
        "UPDATE product_profiles SET deletedAt = NOW() WHERE id = ? AND userId = ?",
        [input.id, userId]
      );

      return { success: true };
    }),

  // ── INCREMENT USAGE (called when product selected in wizard) ──
  incrementUsage: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = resolveUserId(ctx.user);
      if (!userId) return { success: false };

      const pool = getPool();
      if (!pool) return { success: false };

      await pool.execute(
        "UPDATE product_profiles SET usageCount = COALESCE(usageCount, 0) + 1, lastUsedAt = NOW() WHERE id = ? AND (userId = ? OR isCompanyShared = TRUE)",
        [input.id, userId]
      );

      return { success: true };
    }),

  // ── CREATE FROM WIZARD (extract product fields from full wizard formData) ──
  createFromWizard: protectedProcedure
    .input(z.object({
      nickname: z.string().min(1).max(100),
      wizardData: z.record(z.string(), z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = resolveUserId(ctx.user);
      const companyId = resolveCompanyId(ctx.user);
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const pool = getPool();
      if (!pool) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const w = input.wizardData;
      const cols = [
        "userId", "companyId", "nickname", "source",
        "trailerType", "equipment", "productName", "cargoType",
        "hazmatClass", "unNumber", "ergGuide", "isTIH", "isWR",
        "placardName", "properShippingName", "packingGroup",
        "technicalName", "emergencyResponseNumber", "emergencyPhone",
        "hazardClassNumber", "subsidiaryHazards", "specialPermit",
        "defaultQuantity", "quantityUnit", "weightUnit", "volumeUnit",
        "hoseType", "hoseLength", "fittingType",
        "pumpRequired", "compressorRequired", "bottomLoadRequired", "vaporRecoveryRequired",
        "apiGravity", "bsw", "sulfurContent", "flashPoint",
        "viscosity", "pourPoint", "reidVaporPressure", "appearance",
        "tags",
      ];
      const vals = [
        userId, companyId, input.nickname, "wizard",
        w.trailerType || null, w.equipment || w.trailerType || null,
        w.productName || null, w.cargoType || null,
        w.hazmatClass || null, w.unNumber || null,
        w.ergGuide ? Number(w.ergGuide) : null, !!w.isTIH, !!w.isWR,
        w.placardName || null, w.properShippingName || null, w.packingGroup || null,
        w.technicalName || null, w.emergencyResponseNumber || null, w.emergencyPhone || null,
        w.hazardClassNumber || null,
        w.subsidiaryHazards ? JSON.stringify(w.subsidiaryHazards) : null,
        w.specialPermit || null,
        w.quantity || w.defaultQuantity || null,
        w.quantityUnit || null, w.weightUnit || null, w.volumeUnit || null,
        w.hoseType || null, w.hoseLength || null, w.fittingType || null,
        !!w.pumpRequired, !!w.compressorRequired, !!w.bottomLoadRequired, !!w.vaporRecoveryRequired,
        w.apiGravity || null, w.bsw || null, w.sulfurContent || null,
        w.flashPoint ? Number(w.flashPoint) : null,
        w.viscosity || null, w.pourPoint ? Number(w.pourPoint) : null,
        w.reidVaporPressure || null, w.appearance || null,
        JSON.stringify(w.hazmatClass ? ["hazmat", w.trailerType].filter(Boolean) : [w.trailerType].filter(Boolean)),
      ];

      const placeholders = cols.map(() => "?").join(", ");
      const [result]: any = await pool.execute(
        `INSERT INTO product_profiles (${cols.join(", ")}) VALUES (${placeholders})`,
        vals
      );

      return { id: result.insertId, nickname: input.nickname };
    }),
});
