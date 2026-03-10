/**
 * LOAD TEMPLATES ROUTER — GAP-003
 * CRUD for reusable load templates + create-load-from-template.
 */

import { z } from "zod";
import { eq, and, desc, sql, like, type SQL } from "drizzle-orm";
import { randomBytes } from "crypto";
import { isolatedApprovedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { loadTemplates, loads, loadStops } from "../../drizzle/schema";
import type { InsertLoadTemplate } from "../../drizzle/schema";
import { requireAccess } from "../services/security/rbac/access-check";
import { emitLoadStatusChange } from "../_core/websocket";
import { resolveUserRole } from "../_core/resolveRole";

async function resolveUserId(ctxUser: Record<string, unknown> | null | undefined): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  if (ctxUser?.id && typeof ctxUser.id === "number") return ctxUser.id;
  if (ctxUser?.userId) {
    try {
      const { users } = await import("../../drizzle/schema");
      const [u] = await db.select({ id: users.id }).from(users).where(eq(users.openId, String(ctxUser.userId))).limit(1);
      return u?.id || 0;
    } catch { return 0; }
  }
  return 0;
}

const stopSchema = z.object({
  stopType: z.string(),
  facilityName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
});

const locationSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  facilityName: z.string().optional(),
}).optional();

const equipReqSchema = z.object({
  hoseType: z.string().optional(),
  hoseLength: z.string().optional(),
  fittingType: z.string().optional(),
  pumpRequired: z.boolean().optional(),
  compressorRequired: z.boolean().optional(),
  bottomLoadRequired: z.boolean().optional(),
  vaporRecoveryRequired: z.boolean().optional(),
}).optional();

export const loadTemplatesRouter = router({

  // ── List templates for the current user ──
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      favoritesOnly: z.boolean().optional(),
      includeArchived: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: ctx.user?.role || "SHIPPER", companyId: ctx.user!.companyId, action: "READ", resource: "LOAD" }, ctx.req);
      const db = await getDb();
      if (!db) return [];
      const userId = await resolveUserId(ctx.user);
      if (!userId) return [];

      const conditions: SQL[] = [eq(loadTemplates.ownerId, userId)];
      if (!input?.includeArchived) conditions.push(eq(loadTemplates.isArchived, false));
      if (input?.favoritesOnly) conditions.push(eq(loadTemplates.isFavorite, true));
      if (input?.search) conditions.push(like(loadTemplates.name, `%${input.search}%`));

      const results = await db.select().from(loadTemplates)
        .where(and(...conditions))
        .orderBy(desc(loadTemplates.isFavorite), desc(loadTemplates.lastUsedAt), desc(loadTemplates.createdAt))
        .limit(100);
      return results;
    }),

  // ── Get single template ──
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: ctx.user?.role || "SHIPPER", companyId: ctx.user!.companyId, action: "READ", resource: "LOAD" }, ctx.req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [tmpl] = await db.select().from(loadTemplates).where(eq(loadTemplates.id, input.id)).limit(1);
      if (!tmpl) throw new Error("Template not found");
      return tmpl;
    }),

  // ── Create template from scratch ──
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(200),
      description: z.string().optional(),
      origin: locationSchema,
      destination: locationSchema,
      distance: z.number().optional(),
      commodity: z.string().optional(),
      cargoType: z.string().optional(),
      equipmentType: z.string().optional(),
      trailerType: z.string().optional(),
      weight: z.string().optional(),
      weightUnit: z.string().optional(),
      quantity: z.string().optional(),
      quantityUnit: z.string().optional(),
      hazmatClass: z.string().optional(),
      unNumber: z.string().optional(),
      packingGroup: z.string().optional(),
      properShippingName: z.string().optional(),
      rate: z.number().optional(),
      rateType: z.enum(["flat", "per_mile", "per_barrel", "per_gallon", "per_ton"]).optional(),
      stops: z.array(stopSchema).optional(),
      equipmentRequirements: equipReqSchema,
      preferredDays: z.array(z.string()).optional(),
      preferredPickupTime: z.string().optional(),
      specialInstructions: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: ctx.user?.role || "SHIPPER", companyId: ctx.user!.companyId, action: "CREATE", resource: "LOAD" }, ctx.req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = await resolveUserId(ctx.user);
      if (!userId) throw new Error("Could not resolve user");

      const [result] = await db.insert(loadTemplates).values({
        ownerId: userId,
        companyId: ctx.user!.companyId || null,
        name: input.name,
        description: input.description || null,
        origin: input.origin || null,
        destination: input.destination || null,
        distance: input.distance ? String(input.distance) : null,
        commodity: input.commodity || null,
        cargoType: input.cargoType || null,
        equipmentType: input.equipmentType || null,
        trailerType: input.trailerType || null,
        weight: input.weight || null,
        weightUnit: input.weightUnit || "lbs",
        quantity: input.quantity || null,
        quantityUnit: input.quantityUnit || null,
        hazmatClass: input.hazmatClass || null,
        unNumber: input.unNumber || null,
        packingGroup: input.packingGroup || null,
        properShippingName: input.properShippingName || null,
        rate: input.rate ? String(input.rate) : null,
        rateType: input.rateType || "flat",
        stops: input.stops || null,
        equipmentRequirements: input.equipmentRequirements || null,
        preferredDays: input.preferredDays || null,
        preferredPickupTime: input.preferredPickupTime || null,
        specialInstructions: input.specialInstructions || null,
        notes: input.notes || null,
      } as InsertLoadTemplate).$returningId();

      return { id: result.id, name: input.name };
    }),

  // ── Save existing load as template ──
  saveFromLoad: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      name: z.string().min(1).max(200),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: ctx.user?.role || "SHIPPER", companyId: ctx.user!.companyId, action: "CREATE", resource: "LOAD" }, ctx.req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = await resolveUserId(ctx.user);

      const [load] = await db.select().from(loads).where(eq(loads.id, input.loadId)).limit(1);
      if (!load) throw new Error("Load not found");

      // Fetch stops for this load
      let loadStopData: (typeof loadStops.$inferSelect)[] = [];
      try {
        loadStopData = await db.select().from(loadStops)
          .where(eq(loadStops.loadId, input.loadId))
          .orderBy(loadStops.sequence);
      } catch {}

      const stopsJson = loadStopData.length > 0 ? loadStopData.map((s) => ({
        stopType: s.stopType,
        facilityName: s.facilityName || undefined,
        address: s.address || undefined,
        city: s.city || undefined,
        state: s.state || undefined,
        zipCode: s.zipCode || undefined,
        contactName: s.contactName || undefined,
        contactPhone: s.contactPhone || undefined,
        notes: s.notes || undefined,
      })) : null;

      // Parse equipment requirements from specialInstructions JSON
      let equipReqs = null;
      try {
        const si = typeof load.specialInstructions === "string" ? JSON.parse(load.specialInstructions) : load.specialInstructions;
        if (si?.equipmentType) equipReqs = { equipmentType: si.equipmentType };
      } catch {}

      const [result] = await db.insert(loadTemplates).values({
        ownerId: userId,
        companyId: ctx.user!.companyId || null,
        name: input.name,
        description: `Saved from load ${load.loadNumber || load.id}`,
        origin: load.pickupLocation || null,
        destination: load.deliveryLocation || null,
        distance: load.distance || null,
        commodity: load.commodityName || null,
        cargoType: load.cargoType || null,
        equipmentType: null,
        trailerType: null,
        weight: load.weight || null,
        weightUnit: load.weightUnit || "lbs",
        quantity: load.volume || null,
        quantityUnit: load.volumeUnit || null,
        hazmatClass: load.hazmatClass || null,
        unNumber: load.unNumber || null,
        packingGroup: load.packingGroup || null,
        properShippingName: load.properShippingName || null,
        rate: load.rate || null,
        stops: stopsJson,
        equipmentRequirements: equipReqs,
        specialInstructions: typeof load.specialInstructions === "string" ? load.specialInstructions : null,
      } as InsertLoadTemplate).$returningId();

      return { id: result.id, name: input.name };
    }),

  // ── Create load from template ──
  useTemplate: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      pickupDate: z.string().optional(),
      deliveryDate: z.string().optional(),
      rate: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: ctx.user?.role || "SHIPPER", companyId: ctx.user!.companyId, action: "CREATE", resource: "LOAD" }, ctx.req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = await resolveUserId(ctx.user);

      const [tmpl] = await db.select().from(loadTemplates).where(eq(loadTemplates.id, input.templateId)).limit(1);
      if (!tmpl) throw new Error("Template not found");

      const loadNumber = `LD-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${randomBytes(5).toString('hex').toUpperCase()}`;

      const [result] = await db.insert(loads).values({
        shipperId: userId,
        loadNumber,
        status: "posted",
        cargoType: (tmpl.cargoType || "general") as typeof loads.cargoType.enumValues[number],
        hazmatClass: tmpl.hazmatClass || null,
        unNumber: tmpl.unNumber || null,
        commodityName: tmpl.commodity || null,
        weight: tmpl.weight || null,
        weightUnit: tmpl.weightUnit || "lbs",
        volume: tmpl.quantity || null,
        volumeUnit: tmpl.quantityUnit || null,
        pickupLocation: tmpl.origin || undefined,
        deliveryLocation: tmpl.destination || undefined,
        distance: tmpl.distance || null,
        rate: input.rate ? String(input.rate) : tmpl.rate || null,
        specialInstructions: tmpl.specialInstructions || null,
        pickupDate: input.pickupDate ? new Date(input.pickupDate) : undefined,
        deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : undefined,
        properShippingName: tmpl.properShippingName || null,
        packingGroup: tmpl.packingGroup || null,
      } as typeof loads.$inferInsert).$returningId();

      // Insert template stops into load_stops
      if (tmpl.stops && Array.isArray(tmpl.stops) && tmpl.stops.length > 0) {
        try {
          const stopValues = tmpl.stops.map((s, i: number) => ({
            loadId: result.id,
            sequence: i + 1,
            stopType: s.stopType || "delivery",
            facilityName: s.facilityName || null,
            address: s.address || null,
            city: s.city || null,
            state: s.state || null,
            zipCode: s.zipCode || null,
            contactName: s.contactName || null,
            contactPhone: s.contactPhone || null,
            notes: s.notes || null,
            status: "pending" as const,
          }));
          await db.insert(loadStops).values(stopValues as (typeof loadStops.$inferInsert)[]);
        } catch (e) {
          logger.warn("[LoadTemplates] Failed to insert stops from template:", e);
        }
      } else {
        // Auto-create pickup/delivery stops from origin/destination
        try {
          const o = tmpl.origin;
          const d = tmpl.destination;
          if (o || d) {
            await db.insert(loadStops).values([
              ...(o ? [{ loadId: result.id, sequence: 1, stopType: "pickup" as const, facilityName: o.facilityName || null, address: o.address || null, city: o.city || null, state: o.state || null, zipCode: o.zipCode || null, status: "pending" as const }] : []),
              ...(d ? [{ loadId: result.id, sequence: o ? 2 : 1, stopType: "delivery" as const, facilityName: d.facilityName || null, address: d.address || null, city: d.city || null, state: d.state || null, zipCode: d.zipCode || null, status: "pending" as const }] : []),
            ] as (typeof loadStops.$inferInsert)[]);
          }
        } catch (e) {
          logger.warn("[LoadTemplates] Failed to auto-create stops:", e);
        }
      }

      // Increment usage count
      await db.update(loadTemplates).set({
        usageCount: sql`${loadTemplates.usageCount} + 1`,
        lastUsedAt: new Date(),
      } as unknown as Partial<InsertLoadTemplate>).where(eq(loadTemplates.id, input.templateId));

      emitLoadStatusChange({
        loadId: String(result.id),
        loadNumber,
        previousStatus: "",
        newStatus: "posted",
        timestamp: new Date().toISOString(),
        updatedBy: String(userId),
      });

      return { loadId: result.id, loadNumber };
    }),

  // ── Update template ──
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        origin: locationSchema,
        destination: locationSchema,
        distance: z.number().optional(),
        commodity: z.string().optional(),
        cargoType: z.string().optional(),
        equipmentType: z.string().optional(),
        trailerType: z.string().optional(),
        weight: z.string().optional(),
        weightUnit: z.string().optional(),
        quantity: z.string().optional(),
        quantityUnit: z.string().optional(),
        hazmatClass: z.string().nullable().optional(),
        unNumber: z.string().nullable().optional(),
        rate: z.number().optional(),
        rateType: z.enum(["flat", "per_mile", "per_barrel", "per_gallon", "per_ton"]).optional(),
        stops: z.array(stopSchema).optional(),
        equipmentRequirements: equipReqSchema,
        preferredDays: z.array(z.string()).optional(),
        preferredPickupTime: z.string().optional(),
        specialInstructions: z.string().optional(),
        notes: z.string().optional(),
        isFavorite: z.boolean().optional(),
        isArchived: z.boolean().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: ctx.user?.role || "SHIPPER", companyId: ctx.user!.companyId, action: "UPDATE", resource: "LOAD" }, ctx.req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = await resolveUserId(ctx.user);

      const [existing] = await db.select().from(loadTemplates).where(eq(loadTemplates.id, input.id)).limit(1);
      if (!existing) throw new Error("Template not found");
      if (existing.ownerId !== userId) throw new Error("Not authorized to edit this template");

      const updateSet: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(input.data)) {
        if (val !== undefined) {
          if (key === "rate") updateSet[key] = String(val);
          else if (key === "distance") updateSet[key] = String(val);
          else updateSet[key] = val;
        }
      }

      if (Object.keys(updateSet).length > 0) {
        await db.update(loadTemplates).set(updateSet as Partial<InsertLoadTemplate>).where(eq(loadTemplates.id, input.id));
      }
      return { success: true };
    }),

  // ── Toggle favorite ──
  toggleFavorite: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: ctx.user?.role || "SHIPPER", companyId: ctx.user!.companyId, action: "UPDATE", resource: "LOAD" }, ctx.req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [tmpl] = await db.select().from(loadTemplates).where(eq(loadTemplates.id, input.id)).limit(1);
      if (!tmpl) throw new Error("Template not found");
      await db.update(loadTemplates).set({ isFavorite: !tmpl.isFavorite } as Partial<InsertLoadTemplate>).where(eq(loadTemplates.id, input.id));
      return { isFavorite: !tmpl.isFavorite };
    }),

  // ── Delete template ──
  remove: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: ctx.user?.role || "SHIPPER", companyId: ctx.user!.companyId, action: "DELETE", resource: "LOAD" }, ctx.req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = await resolveUserId(ctx.user);
      const [existing] = await db.select().from(loadTemplates).where(eq(loadTemplates.id, input.id)).limit(1);
      if (!existing) throw new Error("Template not found");
      if (existing.ownerId !== userId) throw new Error("Not authorized");
      await db.delete(loadTemplates).where(eq(loadTemplates.id, input.id));
      return { success: true };
    }),
});
