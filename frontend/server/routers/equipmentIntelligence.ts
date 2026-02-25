/**
 * EQUIPMENT INTELLIGENCE ROUTER
 * ESANG AI ZEUN Mechanics — Equipment matching, profiles, and AI advisory
 * for oil & gas trucking load compatibility.
 *
 * Handles: Equipment catalog, carrier profiles, load requirements,
 *          match scoring, AI advisor, product-equipment matrix.
 */

import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { router, isolatedProcedure as protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { companies, users, vehicles } from "../../drizzle/schema";
import {
  EQUIPMENT_CATALOG,
  PRODUCT_PROFILES,
  getDefaultRequirements,
  scoreEquipmentMatch,
  askEquipmentAdvisor,
  analyzeMatchWithAI,
  type EquipmentProfile,
  type EquipmentProfileItem,
  type LoadEquipmentRequirements,
  type EquipmentRequirement,
  type SiteCondition,
} from "../services/zeunMechanics";

// ── vehicleType → relevant equipment categories ──────────────────────────
const VEHICLE_TYPE_CATEGORIES: Record<string, string[]> = {
  tractor: ["safety", "certifications"],
  tanker: ["hoses", "fittings", "pumps", "vapor_recovery", "safety", "loading_equipment", "measurement", "site_infrastructure", "trailer_features", "certifications"],
  flatbed: ["securing", "flatbed_equipment", "safety", "certifications"],
  refrigerated: ["reefer_equipment", "dry_van_equipment", "securing", "safety", "certifications"],
  dry_van: ["dry_van_equipment", "securing", "safety", "certifications"],
  lowboy: ["oversized_equipment", "securing", "flatbed_equipment", "safety", "certifications"],
  step_deck: ["flatbed_equipment", "oversized_equipment", "securing", "safety", "certifications"],
  trailer: ["hoses", "fittings", "pumps", "vapor_recovery", "safety", "loading_equipment", "measurement", "site_infrastructure", "trailer_features", "certifications", "securing", "reefer_equipment", "flatbed_equipment", "dry_van_equipment", "hopper_equipment", "oversized_equipment"],
};

function getTrailersForVehicleType(vehicleType: string): string[] {
  const map: Record<string, string[]> = {
    tractor: [],
    tanker: ["liquid_tank", "tanker", "mc307", "mc312", "mc331", "dot407", "dot412", "gas_tank", "cryogenic"],
    flatbed: ["flatbed", "flatbed_48", "flatbed_53", "conestoga", "step_deck", "double_drop"],
    refrigerated: ["refrigerated", "reefer_53", "reefer_48", "multi_temp"],
    dry_van: ["dry_van", "dry_van_53", "dry_van_48"],
    lowboy: ["lowboy", "rgn", "double_drop"],
    step_deck: ["step_deck", "double_drop"],
    trailer: ["liquid_tank", "tanker", "flatbed", "refrigerated", "dry_van", "lowboy", "step_deck", "hopper", "pneumatic"],
  };
  return map[vehicleType] || map.trailer;
}

export const equipmentIntelligenceRouter = router({

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FLEET VEHICLES — List user's tractors & trailers
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  getMyVehicles: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const userId = Number((ctx.user as any)?.id);
    if (!userId) return [];
    const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1);
    if (!user?.companyId) return [];

    const vList = await db.select({
      id: vehicles.id,
      vin: vehicles.vin,
      make: vehicles.make,
      model: vehicles.model,
      year: vehicles.year,
      licensePlate: vehicles.licensePlate,
      vehicleType: vehicles.vehicleType,
      status: vehicles.status,
      capacity: vehicles.capacity,
      mileage: vehicles.mileage,
      nextMaintenanceDate: vehicles.nextMaintenanceDate,
      nextInspectionDate: vehicles.nextInspectionDate,
    }).from(vehicles)
      .where(and(eq(vehicles.companyId, user.companyId), eq(vehicles.isActive, true)))
      .orderBy(vehicles.vehicleType, vehicles.id);

    // Attach equipment item count per vehicle from supplyChainMeta
    const [company] = await db.select({ supplyChainMeta: companies.supplyChainMeta }).from(companies).where(eq(companies.id, user.companyId)).limit(1);
    const meta: any = company?.supplyChainMeta || {};
    const vehicleEquipment: Record<string, any> = meta.vehicleEquipment || {};

    return vList.map(v => {
      const ve = vehicleEquipment[String(v.id)];
      const itemCount = ve?.items?.filter((i: any) => i.available)?.length || 0;
      const certCount = ve?.certifications?.length || 0;
      return { ...v, equipmentCount: itemCount, certificationCount: certCount };
    });
  }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PER-VEHICLE EQUIPMENT PROFILE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  getVehicleProfile: protectedProcedure
    .input(z.object({ vehicleId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const userId = Number((ctx.user as any)?.id);
      if (!userId) return null;
      const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1);
      if (!user?.companyId) return null;

      // Verify vehicle belongs to user's company — fetch ALL details
      const [vehicle] = await db.select({
        id: vehicles.id,
        vin: vehicles.vin,
        make: vehicles.make,
        model: vehicles.model,
        year: vehicles.year,
        licensePlate: vehicles.licensePlate,
        vehicleType: vehicles.vehicleType,
        status: vehicles.status,
        capacity: vehicles.capacity,
        mileage: vehicles.mileage,
        nextMaintenanceDate: vehicles.nextMaintenanceDate,
        nextInspectionDate: vehicles.nextInspectionDate,
        createdAt: vehicles.createdAt,
      }).from(vehicles).where(and(eq(vehicles.id, input.vehicleId), eq(vehicles.companyId, user.companyId))).limit(1);
      if (!vehicle) return null;

      const [company] = await db.select({ supplyChainMeta: companies.supplyChainMeta }).from(companies).where(eq(companies.id, user.companyId)).limit(1);
      const meta: any = company?.supplyChainMeta || {};
      const vehicleEquipment: Record<string, any> = meta.vehicleEquipment || {};

      const profile = vehicleEquipment[String(input.vehicleId)] || {
        vehicleId: input.vehicleId,
        items: [],
        certifications: [],
        updatedAt: new Date().toISOString(),
      };

      // Get relevant categories for this vehicle type
      const relevantCategories = VEHICLE_TYPE_CATEGORIES[vehicle.vehicleType] || VEHICLE_TYPE_CATEGORIES.trailer;

      return {
        vehicleId: vehicle.id,
        vin: vehicle.vin,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.licensePlate,
        vehicleType: vehicle.vehicleType,
        status: vehicle.status,
        capacity: vehicle.capacity,
        mileage: vehicle.mileage,
        nextMaintenanceDate: vehicle.nextMaintenanceDate,
        nextInspectionDate: vehicle.nextInspectionDate,
        createdAt: vehicle.createdAt,
        vehicleName: `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim() || `Vehicle #${vehicle.id}`,
        items: profile.items,
        certifications: profile.certifications,
        updatedAt: profile.updatedAt,
        relevantCategories,
      };
    }),

  saveVehicleProfile: protectedProcedure
    .input(z.object({
      vehicleId: z.number(),
      items: z.array(z.object({
        equipmentId: z.string(),
        available: z.boolean(),
        specs: z.record(z.string(), z.string()).optional(),
        condition: z.enum(["excellent", "good", "fair", "needs_service"]).optional(),
        lastInspected: z.string().optional(),
        notes: z.string().optional(),
      })),
      certifications: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = Number((ctx.user as any)?.id);
      if (!userId) throw new Error("Not authenticated");
      const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1);
      if (!user?.companyId) throw new Error("No company associated");

      // Verify vehicle belongs to company
      const [vehicle] = await db.select({ id: vehicles.id }).from(vehicles)
        .where(and(eq(vehicles.id, input.vehicleId), eq(vehicles.companyId, user.companyId))).limit(1);
      if (!vehicle) throw new Error("Vehicle not found");

      const [company] = await db.select({ supplyChainMeta: companies.supplyChainMeta }).from(companies).where(eq(companies.id, user.companyId)).limit(1);
      const meta: any = company?.supplyChainMeta || {};
      if (!meta.vehicleEquipment) meta.vehicleEquipment = {};

      meta.vehicleEquipment[String(input.vehicleId)] = {
        vehicleId: input.vehicleId,
        items: input.items,
        certifications: input.certifications,
        updatedAt: new Date().toISOString(),
      };

      await db.update(companies).set({ supplyChainMeta: meta as any }).where(eq(companies.id, user.companyId));

      return {
        success: true,
        itemCount: input.items.filter(i => i.available).length,
        certCount: input.certifications.length,
      };
    }),

  getVehicleStats: protectedProcedure
    .input(z.object({ vehicleId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { profileItems: 0, certifications: 0, readinessProducts: [] };
      const userId = Number((ctx.user as any)?.id);
      if (!userId) return { profileItems: 0, certifications: 0, readinessProducts: [] };
      const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1);
      if (!user?.companyId) return { profileItems: 0, certifications: 0, readinessProducts: [] };

      const [vehicle] = await db.select({ id: vehicles.id, vehicleType: vehicles.vehicleType })
        .from(vehicles).where(and(eq(vehicles.id, input.vehicleId), eq(vehicles.companyId, user.companyId))).limit(1);
      if (!vehicle) return { profileItems: 0, certifications: 0, readinessProducts: [] };

      const [company] = await db.select({ supplyChainMeta: companies.supplyChainMeta }).from(companies).where(eq(companies.id, user.companyId)).limit(1);
      const meta: any = company?.supplyChainMeta || {};
      const vehicleEquipment: Record<string, any> = meta.vehicleEquipment || {};
      const vProfile = vehicleEquipment[String(input.vehicleId)] || { items: [], certifications: [] };

      const profile: EquipmentProfile = {
        companyId: user.companyId,
        items: vProfile.items || [],
        certifications: vProfile.certifications || [],
        updatedAt: vProfile.updatedAt || new Date().toISOString(),
      };

      const availableItems = profile.items.filter((i: any) => i.available).length;

      // Only score products relevant to this vehicle type
      const relevantProducts = PRODUCT_PROFILES.filter(p => {
        const relevantTrailers = getTrailersForVehicleType(vehicle.vehicleType);
        return p.typicalTrailers.some(t => relevantTrailers.includes(t));
      });

      const readinessProducts = relevantProducts.map(p => {
        const reqs = getDefaultRequirements(p.productId);
        const result = scoreEquipmentMatch(profile, reqs);
        return {
          productId: p.productId,
          productName: p.name,
          category: p.category,
          score: result.overallScore,
          readiness: result.readiness,
          criticalGaps: result.gaps.filter(g => g.severity === "critical").length,
        };
      });

      return { profileItems: availableItems, certifications: profile.certifications.length, readinessProducts };
    }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ESANG AI VEHICLE SCAN — Deep intelligence auto-scan
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  scanVehicleIntelligence: protectedProcedure
    .input(z.object({ vehicleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = Number((ctx.user as any)?.id);
      if (!userId) throw new Error("Not authenticated");
      const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1);
      if (!user?.companyId) throw new Error("No company");

      const [vehicle] = await db.select({
        id: vehicles.id, vin: vehicles.vin, make: vehicles.make, model: vehicles.model,
        year: vehicles.year, licensePlate: vehicles.licensePlate, vehicleType: vehicles.vehicleType,
        status: vehicles.status, capacity: vehicles.capacity, mileage: vehicles.mileage,
        nextMaintenanceDate: vehicles.nextMaintenanceDate, nextInspectionDate: vehicles.nextInspectionDate,
        createdAt: vehicles.createdAt,
      }).from(vehicles).where(and(eq(vehicles.id, input.vehicleId), eq(vehicles.companyId, user.companyId))).limit(1);
      if (!vehicle) throw new Error("Vehicle not found");

      // Get current equipment profile
      const [company] = await db.select({ supplyChainMeta: companies.supplyChainMeta }).from(companies).where(eq(companies.id, user.companyId)).limit(1);
      const meta: any = company?.supplyChainMeta || {};
      const vProfile = (meta.vehicleEquipment || {})[String(input.vehicleId)] || { items: [], certifications: [] };
      const equippedItems = (vProfile.items || []).filter((i: any) => i.available).map((i: any) => {
        for (const cat of EQUIPMENT_CATALOG) {
          const found = cat.items.find((ci: any) => ci.id === i.equipmentId);
          if (found) return found.name;
        }
        return i.equipmentId;
      });
      const certs = vProfile.certifications || [];

      // Build relevant product readiness summary
      const relevantCategories = VEHICLE_TYPE_CATEGORIES[vehicle.vehicleType] || VEHICLE_TYPE_CATEGORIES.trailer;
      const relevantTrailers = getTrailersForVehicleType(vehicle.vehicleType);
      const relevantProducts = PRODUCT_PROFILES.filter(p =>
        p.typicalTrailers.some(t => relevantTrailers.includes(t))
      );

      const currentYear = new Date().getFullYear();
      const vehicleAge = vehicle.year ? currentYear - vehicle.year : null;
      const mileageStr = vehicle.mileage ? `${vehicle.mileage.toLocaleString()} miles` : "Unknown";

      const prompt = `You are ESANG AI ZEUN Mechanics. Perform a comprehensive intelligence scan on this vehicle and return structured JSON.

VEHICLE DATA:
- VIN: ${vehicle.vin}
- Make: ${vehicle.make || "Unknown"} | Model: ${vehicle.model || "Unknown"} | Year: ${vehicle.year || "Unknown"}
- Type: ${vehicle.vehicleType}
- Mileage: ${mileageStr}
- Age: ${vehicleAge !== null ? `${vehicleAge} years` : "Unknown"}
- License Plate: ${vehicle.licensePlate || "Not set"}
- Status: ${vehicle.status}
- Capacity: ${vehicle.capacity || "Not specified"}
- Next Maintenance: ${vehicle.nextMaintenanceDate ? new Date(vehicle.nextMaintenanceDate).toLocaleDateString() : "Not scheduled"}
- Next Inspection: ${vehicle.nextInspectionDate ? new Date(vehicle.nextInspectionDate).toLocaleDateString() : "Not scheduled"}

CURRENT EQUIPMENT (${equippedItems.length} items): ${equippedItems.length > 0 ? equippedItems.join(", ") : "None configured"}
CURRENT CERTIFICATIONS: ${certs.length > 0 ? certs.join(", ") : "None"}

RELEVANT PRODUCTS THIS VEHICLE CAN HAUL: ${relevantProducts.map(p => p.name).join(", ") || "None identified"}

Analyze this vehicle thoroughly. For the VIN, decode as much as you can (manufacturer, plant, engine type, GVWR class, body type, etc.). Based on the vehicle type, year, and mileage, provide maintenance intelligence.

Return JSON with this EXACT structure:
{
  "vinDecode": {
    "manufacturer": "string",
    "plant": "string or null",
    "engineType": "string or null",
    "gvwrClass": "string or null",
    "bodyType": "string or null",
    "series": "string or null",
    "fuelType": "string or null",
    "brakeSystem": "string or null",
    "driveType": "string or null",
    "summary": "1-2 sentence human summary of what VIN tells us"
  },
  "maintenanceAlerts": [
    { "priority": "critical|high|medium|low", "title": "string", "detail": "string", "mileageInterval": "number or null" }
  ],
  "recommendedEquipment": [
    { "item": "string", "reason": "string", "priority": "required|recommended|optional" }
  ],
  "complianceItems": [
    { "item": "string", "regulation": "string", "status": "required|recommended", "detail": "string" }
  ],
  "equipmentGaps": [
    { "item": "string", "reason": "string", "severity": "critical|warning|info" }
  ],
  "vehicleSummary": "3-4 sentence executive summary of this vehicle's overall readiness, condition assessment, and key action items",
  "estimatedValue": "string or null — rough market value estimate if enough info",
  "safetyScore": "number 0-100 — estimated safety readiness score based on equipment and maintenance"
}`;

      try {
        const { ENV } = await import("../_core/env");
        const apiKey = ENV.geminiApiKey;
        if (!apiKey) return { error: "AI not configured", sections: null };

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 30_000);
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              system_instruction: { parts: [{ text: "You are ESANG AI ZEUN Mechanics — an expert commercial vehicle intelligence system for the trucking industry. You have deep knowledge of VIN decoding, FMCSA regulations, DOT inspection requirements, and fleet maintenance best practices." }] },
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 4096,
                responseMimeType: "application/json",
              },
            }),
          }
        );
        clearTimeout(timer);

        if (!resp.ok) {
          console.error("[ZEUN] Vehicle scan API error:", resp.status);
          return { error: "AI temporarily unavailable", sections: null };
        }

        const data = await resp.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        try {
          const sections = JSON.parse(text);
          return { error: null, sections, vehicleId: vehicle.id, scannedAt: new Date().toISOString() };
        } catch {
          return { error: null, sections: { vehicleSummary: text }, vehicleId: vehicle.id, scannedAt: new Date().toISOString() };
        }
      } catch (err: any) {
        console.error("[ZEUN] Vehicle scan error:", err?.message);
        return { error: "Scan failed", sections: null };
      }
    }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // UPDATE VEHICLE DETAILS — mileage, etc.
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  updateVehicleDetails: protectedProcedure
    .input(z.object({
      vehicleId: z.number(),
      mileage: z.number().optional(),
      licensePlate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = Number((ctx.user as any)?.id);
      if (!userId) throw new Error("Not authenticated");
      const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1);
      if (!user?.companyId) throw new Error("No company");

      const [vehicle] = await db.select({ id: vehicles.id }).from(vehicles)
        .where(and(eq(vehicles.id, input.vehicleId), eq(vehicles.companyId, user.companyId))).limit(1);
      if (!vehicle) throw new Error("Vehicle not found");

      const updates: any = {};
      if (input.mileage !== undefined) updates.mileage = input.mileage;
      if (input.licensePlate !== undefined) updates.licensePlate = input.licensePlate;

      if (Object.keys(updates).length > 0) {
        await db.update(vehicles).set(updates).where(eq(vehicles.id, input.vehicleId));
      }

      return { success: true };
    }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CATALOG — Static equipment knowledge base
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  getCatalog: protectedProcedure.query(() => {
    return EQUIPMENT_CATALOG.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      description: cat.description,
      itemCount: cat.items.length,
      items: cat.items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        specs: item.specs,
        criticality: item.criticality,
        applicableProducts: item.applicableProducts,
        applicableTrailers: item.applicableTrailers,
      })),
    }));
  }),

  getProductProfiles: protectedProcedure.query(() => {
    return PRODUCT_PROFILES.map(p => ({
      productId: p.productId,
      name: p.name,
      category: p.category,
      requiredEquipmentCount: p.requiredEquipment.length,
      recommendedEquipmentCount: p.recommendedEquipment.length,
      requiredCertifications: p.requiredCertifications,
      typicalTrailers: p.typicalTrailers,
      notes: p.notes,
    }));
  }),

  getProductRequirements: protectedProcedure
    .input(z.object({
      productType: z.string(),
      trailerType: z.string().optional(),
    }))
    .query(({ input }) => {
      const reqs = getDefaultRequirements(input.productType, input.trailerType);
      const profile = PRODUCT_PROFILES.find(p => p.productId === input.productType);

      // Enrich requirements with full item details
      const enriched = reqs.requirements.map(req => {
        let item: any = null;
        for (const cat of EQUIPMENT_CATALOG) {
          item = cat.items.find(i => i.id === req.equipmentId);
          if (item) break;
        }
        return {
          ...req,
          name: item?.name || req.equipmentId,
          description: item?.description || "",
          categoryId: item?.categoryId || "unknown",
          specs: item?.specs || {},
        };
      });

      return {
        requirements: enriched,
        siteConditions: reqs.siteConditions,
        productNotes: reqs.productNotes,
        productName: profile?.name || input.productType,
        productCategory: profile?.category || "unknown",
      };
    }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EQUIPMENT PROFILES — What a carrier/driver HAS
  // Stored as JSON in companies.metadata or vehicles table
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const userId = Number((ctx.user as any)?.id);
    if (!userId) return null;

    const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1);
    if (!user?.companyId) return null;

    const [company] = await db.select({ supplyChainMeta: companies.supplyChainMeta }).from(companies).where(eq(companies.id, user.companyId)).limit(1);
    if (!company) return null;

    const meta: any = company.supplyChainMeta || {};

    const profile: EquipmentProfile = meta.equipmentProfile || {
      companyId: user.companyId,
      items: [],
      certifications: [],
      updatedAt: new Date().toISOString(),
    };

    return profile;
  }),

  saveProfile: protectedProcedure
    .input(z.object({
      items: z.array(z.object({
        equipmentId: z.string(),
        available: z.boolean(),
        specs: z.record(z.string(), z.string()).optional(),
        condition: z.enum(["excellent", "good", "fair", "needs_service"]).optional(),
        lastInspected: z.string().optional(),
        notes: z.string().optional(),
      })),
      certifications: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = Number((ctx.user as any)?.id);
      if (!userId) throw new Error("Not authenticated");

      const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1);
      if (!user?.companyId) throw new Error("No company associated");

      const [company] = await db.select({ supplyChainMeta: companies.supplyChainMeta }).from(companies).where(eq(companies.id, user.companyId)).limit(1);
      const meta: any = company?.supplyChainMeta || {};

      const profile: EquipmentProfile = {
        companyId: user.companyId,
        items: input.items as EquipmentProfileItem[],
        certifications: input.certifications,
        updatedAt: new Date().toISOString(),
      };

      meta.equipmentProfile = profile;
      await db.update(companies).set({ supplyChainMeta: meta as any }).where(eq(companies.id, user.companyId));

      return { success: true, itemCount: input.items.filter(i => i.available).length, certCount: input.certifications.length };
    }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MATCH SCORING — Score carrier equipment against load requirements
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  scoreMatch: protectedProcedure
    .input(z.object({
      loadId: z.number().optional(),
      productType: z.string(),
      trailerType: z.string().optional(),
      carrierCompanyId: z.number().optional(),
      siteConditions: z.array(z.object({
        conditionId: z.string(),
        label: z.string(),
        value: z.union([z.boolean(), z.string()]),
        notes: z.string().optional(),
      })).optional(),
      includeAI: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Get carrier equipment profile
      let companyId = input.carrierCompanyId;
      if (!companyId) {
        const userId = Number((ctx.user as any)?.id);
        const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1);
        companyId = user?.companyId || undefined;
      }
      if (!companyId) throw new Error("No carrier company specified");

      const [company] = await db.select({ supplyChainMeta: companies.supplyChainMeta }).from(companies).where(eq(companies.id, companyId)).limit(1);
      const meta: any = company?.supplyChainMeta || {};

      const profile: EquipmentProfile = meta.equipmentProfile || {
        companyId,
        items: [],
        certifications: [],
        updatedAt: new Date().toISOString(),
      };

      // Get load equipment requirements
      const reqs = getDefaultRequirements(input.productType, input.trailerType);
      if (input.siteConditions) {
        reqs.siteConditions = input.siteConditions;
      }

      // Score the match
      const result = scoreEquipmentMatch(profile, reqs);

      // Optionally enrich with AI analysis
      if (input.includeAI) {
        const aiInsight = await analyzeMatchWithAI(
          result,
          input.productType,
          input.trailerType || "liquid_tank",
          input.siteConditions
        );
        result.aiInsight = aiInsight;
      }

      return result;
    }),

  // Quick match score for marketplace — lightweight, no AI
  quickMatch: protectedProcedure
    .input(z.object({
      productType: z.string(),
      trailerType: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { score: 0, readiness: "not_ready" as const, gaps: 0 };

      const userId = Number((ctx.user as any)?.id);
      const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1);
      if (!user?.companyId) return { score: 0, readiness: "not_ready" as const, gaps: 0 };

      const [company] = await db.select({ supplyChainMeta: companies.supplyChainMeta }).from(companies).where(eq(companies.id, user.companyId)).limit(1);
      const meta: any = company?.supplyChainMeta || {};

      const profile: EquipmentProfile = meta.equipmentProfile || {
        companyId: user.companyId,
        items: [],
        certifications: [],
        updatedAt: new Date().toISOString(),
      };

      const reqs = getDefaultRequirements(input.productType, input.trailerType);
      const result = scoreEquipmentMatch(profile, reqs);

      return {
        score: result.overallScore,
        readiness: result.readiness,
        gaps: result.gaps.filter(g => g.severity === "critical").length,
        totalGaps: result.gaps.length,
        matched: result.matched.length,
      };
    }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // AI ADVISOR — Ask ESANG AI equipment questions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  askAdvisor: protectedProcedure
    .input(z.object({
      question: z.string().min(1).max(2000),
      productType: z.string().optional(),
      trailerType: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get carrier's equipment profile for context
      const db = await getDb();
      let carrierEquipment: EquipmentProfileItem[] = [];
      if (db) {
        const userId = Number((ctx.user as any)?.id);
        const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1);
        if (user?.companyId) {
          const [company] = await db.select({ supplyChainMeta: companies.supplyChainMeta }).from(companies).where(eq(companies.id, user.companyId)).limit(1);
          const meta: any = company?.supplyChainMeta || {};
          carrierEquipment = meta.equipmentProfile?.items || [];
        }
      }

      const result = await askEquipmentAdvisor(input.question, {
        productType: input.productType,
        trailerType: input.trailerType,
        carrierEquipment,
      });

      return result;
    }),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STATS — Dashboard summary
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { profileItems: 0, certifications: 0, readinessProducts: [] };

    const userId = Number((ctx.user as any)?.id);
    const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1);
    if (!user?.companyId) return { profileItems: 0, certifications: 0, readinessProducts: [] };

    const [company] = await db.select({ supplyChainMeta: companies.supplyChainMeta }).from(companies).where(eq(companies.id, user.companyId)).limit(1);
    const meta: any = company?.supplyChainMeta || {};

    const profile: EquipmentProfile = meta.equipmentProfile || { items: [], certifications: [] };
    const availableItems = profile.items.filter((i: any) => i.available).length;

    // Score readiness for each product type
    const readinessProducts = PRODUCT_PROFILES.map(p => {
      const reqs = getDefaultRequirements(p.productId);
      const result = scoreEquipmentMatch(profile, reqs);
      return {
        productId: p.productId,
        productName: p.name,
        category: p.category,
        score: result.overallScore,
        readiness: result.readiness,
        criticalGaps: result.gaps.filter(g => g.severity === "critical").length,
      };
    });

    return {
      profileItems: availableItems,
      certifications: profile.certifications.length,
      readinessProducts,
    };
  }),
});
