/**
 * ZEUN MECHANICS ROUTER - AI-Powered Breakdown, Diagnostic & Repair Platform
 * Handles: Breakdown reports, AI diagnostics, provider search, maintenance tracking
 */

import { z } from "zod";
import { eq, desc, and, or, like, sql, gte, lte } from "drizzle-orm";
import { auditedProtectedProcedure as protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { esangAI } from "../_core/esangAI";
import { getDb } from "../db";
import {
  zeunBreakdownReports,
  zeunDiagnosticResults,
  zeunRepairProviders,
  zeunProviderReviews,
  zeunMaintenanceLogs,
  zeunMaintenanceSchedules,
  zeunVehicleRecalls,
  zeunBreakdownStatusHistory,
  dtcCodes,
  users,
  vehicles,
} from "../../drizzle/schema";

const issueCategoryEnum = z.enum(["ENGINE", "BRAKES", "TRANSMISSION", "ELECTRICAL", "TIRES", "FUEL_SYSTEM", "COOLING", "EXHAUST", "STEERING", "SUSPENSION", "HVAC", "OTHER"]);
const severityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const statusEnum = z.enum(["REPORTED", "DIAGNOSED", "ACKNOWLEDGED", "EN_ROUTE_TO_SHOP", "AT_SHOP", "UNDER_REPAIR", "WAITING_PARTS", "RESOLVED", "CANCELLED"]);

// Symptom pattern matching for AI diagnostics
const SYMPTOM_PATTERNS: Record<string, { keywords: string[]; likelyIssues: Array<{ issue: string; probability: number; severity: string }> }> = {
  WONT_START: {
    keywords: ["won't start", "no start", "cranks but won't start", "clicking", "dead"],
    likelyIssues: [
      { issue: "Dead batteries", probability: 0.35, severity: "HIGH" },
      { issue: "Fuel delivery issue", probability: 0.25, severity: "HIGH" },
      { issue: "Starter failure", probability: 0.20, severity: "HIGH" },
      { issue: "Fuel filter clogged", probability: 0.15, severity: "MEDIUM" },
    ],
  },
  OVERHEATING: {
    keywords: ["overheating", "running hot", "coolant warning", "steam", "temperature"],
    likelyIssues: [
      { issue: "Low coolant level", probability: 0.30, severity: "HIGH" },
      { issue: "Thermostat stuck closed", probability: 0.25, severity: "HIGH" },
      { issue: "Water pump failure", probability: 0.20, severity: "CRITICAL" },
      { issue: "Radiator blockage", probability: 0.15, severity: "HIGH" },
    ],
  },
  BRAKE_ISSUE: {
    keywords: ["brakes", "air pressure", "brake warning", "won't release", "grinding"],
    likelyIssues: [
      { issue: "Air leak in brake system", probability: 0.35, severity: "CRITICAL" },
      { issue: "Compressor failure", probability: 0.25, severity: "CRITICAL" },
      { issue: "Brake chamber issue", probability: 0.20, severity: "CRITICAL" },
      { issue: "Air dryer problem", probability: 0.15, severity: "HIGH" },
    ],
  },
  CHECK_ENGINE: {
    keywords: ["check engine", "engine light", "warning light", "derate"],
    likelyIssues: [
      { issue: "Emissions system fault", probability: 0.40, severity: "MEDIUM" },
      { issue: "Sensor malfunction", probability: 0.30, severity: "MEDIUM" },
      { issue: "Engine performance issue", probability: 0.20, severity: "HIGH" },
    ],
  },
  DEF_SYSTEM: {
    keywords: ["def", "diesel exhaust", "regen", "emissions", "scr"],
    likelyIssues: [
      { issue: "DEF quality issue", probability: 0.30, severity: "HIGH" },
      { issue: "DEF doser clogged", probability: 0.25, severity: "HIGH" },
      { issue: "NOx sensor failure", probability: 0.20, severity: "HIGH" },
    ],
  },
};

function analyzeSymptoms(symptoms: string[]): { issue: string; probability: number; severity: string; description: string } {
  const normalizedSymptoms = symptoms.map((s) => s.toLowerCase()).join(" ");
  let bestMatch = { issue: "Unknown issue - requires inspection", probability: 0.5, severity: "MEDIUM", description: "Unable to determine specific issue from symptoms provided." };
  let bestScore = 0;

  for (const [, pattern] of Object.entries(SYMPTOM_PATTERNS)) {
    let score = 0;
    for (const keyword of pattern.keywords) {
      if (normalizedSymptoms.includes(keyword)) score++;
    }
    if (score > bestScore && pattern.likelyIssues.length > 0) {
      bestScore = score;
      const topIssue = pattern.likelyIssues[0];
      bestMatch = { ...topIssue, description: `Based on symptoms: ${symptoms.slice(0, 3).join(", ")}` };
    }
  }

  return bestMatch;
}

// ============================================================================
// FREE GEOCODING & MECHANIC DISCOVERY APIs (OpenStreetMap — no API key needed)
// ============================================================================

/** Geocode a location name to coordinates using Nominatim (OpenStreetMap) */
async function geocodeLocation(query: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
  try {
    const encoded = encodeURIComponent(query);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=us`,
      { headers: { "User-Agent": "EusoTrip/1.0 (ZEUN Mechanics)" } }
    );
    if (!res.ok) return null;
    const data = await res.json() as Array<{ lat: string; lon: string; display_name: string }>;
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), displayName: data[0].display_name };
  } catch (e) {
    console.error("[ZEUN] Geocode error:", e);
    return null;
  }
}

/** Search for real mechanic/repair shops near coordinates using Overpass API (OpenStreetMap) */
async function searchOverpassMechanics(lat: number, lng: number, radiusMeters: number = 40000): Promise<Array<{
  name: string; lat: number; lng: number; phone?: string; website?: string;
  address?: string; city?: string; state?: string; zip?: string;
  providerType: string; services: string[];
}>> {
  try {
    // Search for car repair shops, truck repair, fuel stations, tyre shops within radius
    const query = `
      [out:json][timeout:15];
      (
        node["shop"="car_repair"](around:${radiusMeters},${lat},${lng});
        node["shop"="tyres"](around:${radiusMeters},${lat},${lng});
        node["amenity"="car_repair"](around:${radiusMeters},${lat},${lng});
        node["craft"="mechanic"](around:${radiusMeters},${lat},${lng});
        way["shop"="car_repair"](around:${radiusMeters},${lat},${lng});
        way["shop"="tyres"](around:${radiusMeters},${lat},${lng});
        way["amenity"="car_repair"](around:${radiusMeters},${lat},${lng});
      );
      out center body 50;
    `;
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "EusoTrip/1.0" },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) { console.warn("[ZEUN] Overpass API error:", res.status); return []; }
    const data = await res.json() as { elements: Array<{ lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }> };

    return (data.elements || []).filter(el => el.tags?.name).map(el => {
      const tags = el.tags || {};
      const elLat = el.lat ?? el.center?.lat ?? 0;
      const elLng = el.lon ?? el.center?.lon ?? 0;
      let providerType = "INDEPENDENT";
      if (tags.shop === "tyres") providerType = "TIRE_SHOP";
      else if (tags.amenity === "fuel" || tags.name?.toLowerCase().includes("truck stop")) providerType = "TRUCK_STOP";
      else if (tags.name?.toLowerCase().includes("dealer")) providerType = "DEALER";

      const services: string[] = [];
      if (tags["service:vehicle:car_repair"] === "yes" || tags.shop === "car_repair") services.push("General Repair");
      if (tags["service:vehicle:tyres"] === "yes" || tags.shop === "tyres") services.push("Tire Service");
      if (tags["service:vehicle:oil_change"] === "yes") services.push("Oil Change");
      if (tags["service:vehicle:brakes"] === "yes") services.push("Brake Service");
      if (tags["service:vehicle:transmission"] === "yes") services.push("Transmission");
      if (tags["service:vehicle:engine"] === "yes") services.push("Engine Repair");
      if (services.length === 0) services.push("General Repair");

      return {
        name: tags.name || "Unknown Shop",
        lat: elLat,
        lng: elLng,
        phone: tags.phone || tags["contact:phone"] || undefined,
        website: tags.website || tags["contact:website"] || undefined,
        address: [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ") || undefined,
        city: tags["addr:city"] || undefined,
        state: tags["addr:state"] || undefined,
        zip: tags["addr:postcode"] || undefined,
        providerType,
        services,
      };
    });
  } catch (e) {
    console.error("[ZEUN] Overpass search error:", e);
    return [];
  }
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const zeunMechanicsRouter = router({
  // ============================================================================
  // BREAKDOWN REPORTING
  // ============================================================================

  reportBreakdown: protectedProcedure.input(z.object({
    vehicleVin: z.string().optional(),
    vehicleId: z.number().optional(),
    issueCategory: issueCategoryEnum,
    severity: severityEnum,
    symptoms: z.array(z.string()).min(1),
    canDrive: z.boolean(),
    latitude: z.number(),
    longitude: z.number(),
    loadId: z.number().optional(),
    loadStatus: z.enum(["EMPTY", "LOADED", "HAZMAT"]).optional(),
    cargoType: z.string().optional(),
    isHazmat: z.boolean().optional(),
    hazmatClass: z.string().optional(),
    faultCodes: z.array(z.string()).optional(),
    driverNotes: z.string().optional(),
    photos: z.array(z.string()).optional(),
    videos: z.array(z.string()).optional(),
    fuelLevelPercent: z.number().optional(),
    defLevelPercent: z.number().optional(),
    oilPressurePsi: z.number().optional(),
    coolantTempF: z.number().optional(),
    batteryVoltage: z.number().optional(),
    currentOdometer: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const userId = ctx.user?.id;
    if (!userId) throw new Error("Not authenticated");

    const startTime = Date.now();

    // Create breakdown report
    const [report] = await db.insert(zeunBreakdownReports).values({
      driverId: Number(userId),
      vehicleId: input.vehicleId,
      vehicleVin: input.vehicleVin,
      issueCategory: input.issueCategory,
      severity: input.severity,
      symptoms: input.symptoms,
      canDrive: input.canDrive,
      latitude: String(input.latitude),
      longitude: String(input.longitude),
      loadId: input.loadId,
      loadStatus: input.loadStatus,
      cargoType: input.cargoType,
      isHazmat: input.isHazmat,
      hazmatClass: input.hazmatClass,
      faultCodes: input.faultCodes,
      driverNotes: input.driverNotes,
      photos: input.photos,
      videos: input.videos,
      fuelLevelPercent: input.fuelLevelPercent,
      defLevelPercent: input.defLevelPercent,
      oilPressurePsi: input.oilPressurePsi,
      coolantTempF: input.coolantTempF,
      batteryVoltage: input.batteryVoltage ? String(input.batteryVoltage) : null,
      currentOdometer: input.currentOdometer,
      status: "REPORTED",
    }).$returningId();

    // Run ESANG AI-powered diagnosis
    const aiDiag = await esangAI.diagnoseBreakdown({
      symptoms: input.symptoms,
      faultCodes: input.faultCodes,
      issueCategory: input.issueCategory,
      severity: input.severity,
      odometerMiles: input.currentOdometer,
      fuelLevel: input.fuelLevelPercent,
      defLevel: input.defLevelPercent,
      oilPressure: input.oilPressurePsi,
      coolantTemp: input.coolantTempF,
      batteryVoltage: input.batteryVoltage,
      canDrive: input.canDrive,
      isHazmat: input.isHazmat,
      driverNotes: input.driverNotes,
    });
    const diagnosis = aiDiag.primaryDiagnosis;
    const canDriveResult = aiDiag.canDrive;

    // Store diagnostic result
    await db.insert(zeunDiagnosticResults).values({
      breakdownReportId: report.id,
      confidence: String(diagnosis.probability),
      primaryDiagnosis: diagnosis,
      alternativeDiagnoses: aiDiag.alternativeDiagnoses,
      recommendedActions: aiDiag.recommendedActions,
      canDrive: canDriveResult,
      outOfService: aiDiag.outOfService,
      estimatedCostMin: String(aiDiag.estimatedCostMin),
      estimatedCostMax: String(aiDiag.estimatedCostMax),
      estimatedRepairTimeMin: 1,
      estimatedRepairTimeMax: aiDiag.estimatedRepairHours,
      processingTimeMs: Date.now() - startTime,
      aiModel: "esang-ai",
    });

    // Update report status
    await db.update(zeunBreakdownReports).set({ status: "DIAGNOSED" }).where(eq(zeunBreakdownReports.id, report.id));

    // Find nearby providers
    const providers = await db.select().from(zeunRepairProviders).where(eq(zeunRepairProviders.isActive, true)).limit(10);
    const scoredProviders = providers.map((p) => ({
      ...p,
      distance: p.latitude && p.longitude ? calculateDistance(input.latitude, input.longitude, Number(p.latitude), Number(p.longitude)) : 999,
    })).sort((a, b) => a.distance - b.distance).slice(0, 5);

    return {
      success: true,
      reportId: report.id,
      processingTimeMs: Date.now() - startTime,
      diagnosis,
      canDrive: canDriveResult,
      providers: scoredProviders.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.providerType,
        distance: p.distance.toFixed(1),
        phone: p.phone,
        rating: p.rating ? Number(p.rating) : null,
        available24x7: p.available24x7,
      })),
      estimatedCost: { min: aiDiag.estimatedCostMin, max: aiDiag.estimatedCostMax },
      partsLikelyNeeded: aiDiag.partsLikelyNeeded,
      safetyWarnings: aiDiag.safetyWarnings,
      preventiveTips: aiDiag.preventiveTips,
      alternativeDiagnoses: aiDiag.alternativeDiagnoses,
      aiModel: "esang-ai",
    };
  }),

  getBreakdownReport: protectedProcedure.input(z.object({ reportId: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;

    const [report] = await db.select().from(zeunBreakdownReports).where(eq(zeunBreakdownReports.id, input.reportId)).limit(1);
    if (!report) return null;

    const [diagnostic] = await db.select().from(zeunDiagnosticResults).where(eq(zeunDiagnosticResults.breakdownReportId, input.reportId)).limit(1);
    const [driver] = await db.select({ name: users.name }).from(users).where(eq(users.id, report.driverId)).limit(1);

    return {
      ...report,
      driverName: driver?.name,
      diagnostic: diagnostic ? {
        confidence: Number(diagnostic.confidence),
        primaryDiagnosis: diagnostic.primaryDiagnosis,
        alternativeDiagnoses: diagnostic.alternativeDiagnoses,
        recommendedActions: diagnostic.recommendedActions,
        canDrive: diagnostic.canDrive,
        estimatedCost: { min: Number(diagnostic.estimatedCostMin), max: Number(diagnostic.estimatedCostMax) },
      } : null,
    };
  }),

  getMyBreakdowns: protectedProcedure.input(z.object({
    limit: z.number().default(20),
    offset: z.number().default(0),
    status: z.enum(["OPEN", "RESOLVED", "ALL"]).default("ALL"),
  })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const userId = ctx.user?.id;
    if (!userId) return [];

    let conditions = [eq(zeunBreakdownReports.driverId, Number(userId))];
    if (input.status === "OPEN") {
      conditions.push(sql`${zeunBreakdownReports.status} NOT IN ('RESOLVED', 'CANCELLED')`);
    } else if (input.status === "RESOLVED") {
      conditions.push(eq(zeunBreakdownReports.status, "RESOLVED"));
    }

    const reports = await db.select().from(zeunBreakdownReports).where(and(...conditions)).orderBy(desc(zeunBreakdownReports.createdAt)).limit(input.limit).offset(input.offset);

    return reports.map((r) => ({
      id: r.id,
      issueCategory: r.issueCategory,
      severity: r.severity,
      status: r.status,
      canDrive: r.canDrive,
      symptoms: r.symptoms,
      createdAt: r.createdAt?.toISOString(),
      resolvedAt: r.resolvedAt?.toISOString(),
      actualCost: r.actualCost ? Number(r.actualCost) : null,
    }));
  }),

  updateBreakdownStatus: protectedProcedure.input(z.object({
    reportId: z.number(),
    status: statusEnum,
    notes: z.string().optional(),
    actualCost: z.number().optional(),
    selectedProviderId: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const userId = ctx.user?.id;

    const [current] = await db.select({ status: zeunBreakdownReports.status }).from(zeunBreakdownReports).where(eq(zeunBreakdownReports.id, input.reportId)).limit(1);

    // Record status change
    await db.insert(zeunBreakdownStatusHistory).values({
      breakdownReportId: input.reportId,
      previousStatus: current?.status,
      newStatus: input.status,
      changedByUserId: userId ? Number(userId) : null,
      notes: input.notes,
    });

    // Update report
    const updates: Record<string, unknown> = { status: input.status };
    if (input.actualCost) updates.actualCost = String(input.actualCost);
    if (input.selectedProviderId) updates.selectedProviderId = input.selectedProviderId;
    if (input.status === "RESOLVED") updates.resolvedAt = new Date();

    await db.update(zeunBreakdownReports).set(updates).where(eq(zeunBreakdownReports.id, input.reportId));

    return { success: true };
  }),

  // ============================================================================
  // PROVIDERS
  // ============================================================================

  findProviders: protectedProcedure.input(z.object({
    latitude: z.number(),
    longitude: z.number(),
    radiusMiles: z.number().default(50),
    providerType: z.string().optional(),
    maxResults: z.number().default(10),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];

    let conditions = [eq(zeunRepairProviders.isActive, true)];
    if (input.providerType) {
      conditions.push(eq(zeunRepairProviders.providerType, input.providerType as any));
    }

    let providers = await db.select().from(zeunRepairProviders).where(and(...conditions)).limit(100);

    // Helper: score and filter providers by radius
    const scoreAndFilter = (list: typeof providers) => {
      return list.map((p) => {
        const distance = p.latitude && p.longitude ? calculateDistance(input.latitude, input.longitude, Number(p.latitude), Number(p.longitude)) : 999;
        let score = 100;
        if (distance < 5) score += 30;
        else if (distance < 15) score += 25;
        else if (distance < 30) score += 15;
        if (p.rating) score += (Number(p.rating) - 3.0) * 10;
        if (p.available24x7) score += 10;
        return { ...p, distance, score };
      }).filter((p) => p.distance <= input.radiusMiles).sort((a, b) => b.score - a.score).slice(0, input.maxResults);
    };

    let scoredProviders = scoreAndFilter(providers);

    // AI FALLBACK: If DB has no providers OR none within search radius, use ESANG AI
    if (scoredProviders.length === 0) {
      const reason = providers.length === 0 ? "no providers in DB" : "no providers within radius";
      console.log(`[ZEUN] ${reason} — invoking ESANG AI discovery for ${input.latitude.toFixed(4)}, ${input.longitude.toFixed(4)} (${input.radiusMiles}mi)`);
      try {
        const aiProviders = await esangAI.discoverProviders({
          latitude: input.latitude,
          longitude: input.longitude,
          radiusMiles: input.radiusMiles,
          providerType: input.providerType,
          count: Math.max(input.maxResults, 12),
        });

        // Cache AI-generated providers into DB for persistence
        if (aiProviders.length > 0) {
          const VALID_TYPES = ["TRUCK_STOP", "DEALER", "INDEPENDENT", "MOBILE", "TOWING", "TIRE_SHOP"] as const;
          type ValidType = typeof VALID_TYPES[number];
          let cached = 0;
          for (const ap of aiProviders) {
            try {
              const pType = VALID_TYPES.includes(ap.providerType as ValidType)
                ? (ap.providerType as ValidType)
                : "INDEPENDENT";
              await db.insert(zeunRepairProviders).values({
                source: "GOOGLE" as const,
                name: (ap.name || "Unknown Provider").slice(0, 255),
                providerType: pType,
                chainName: ap.chainName?.slice(0, 100) || null,
                address: ap.address?.slice(0, 500) || null,
                city: ap.city?.slice(0, 100) || null,
                state: ap.state?.slice(0, 2) || null,
                zip: ap.zip?.slice(0, 10) || null,
                latitude: String(ap.latitude),
                longitude: String(ap.longitude),
                phone: ap.phone?.slice(0, 20) || null,
                website: ap.website?.slice(0, 500) || null,
                services: ap.services || [],
                certifications: ap.certifications || [],
                oemBrands: ap.oemBrands || [],
                available24x7: ap.available24x7 ?? false,
                hasMobileService: ap.hasMobileService ?? false,
                rating: String(Math.min(5, Math.max(1, ap.rating || 4.0))),
                reviewCount: ap.reviewCount || 0,
                averageWaitTimeMinutes: ap.averageWaitTimeMinutes || 60,
                isActive: true,
              });
              cached++;
            } catch (insertErr) {
              console.warn("[ZEUN] Failed to cache provider:", (insertErr as Error).message);
            }
          }
          console.log(`[ZEUN] Cached ${cached}/${aiProviders.length} AI-generated providers into DB`);

          // Re-query from DB so we get proper IDs
          providers = await db.select().from(zeunRepairProviders).where(and(...conditions)).limit(100);
          scoredProviders = scoreAndFilter(providers);
        }
      } catch (aiErr) {
        console.error("[ZEUN] AI provider discovery failed:", aiErr);
      }
    }

    return scoredProviders.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.providerType,
      chainName: p.chainName,
      address: p.address,
      city: p.city,
      state: p.state,
      phone: p.phone,
      distance: Number(p.distance.toFixed(1)),
      rating: p.rating ? Number(p.rating) : null,
      reviewCount: p.reviewCount,
      available24x7: p.available24x7,
      hasMobileService: p.hasMobileService,
      services: p.services,
      score: p.score,
      aiGenerated: !p.externalId && !p.lastVerified,
    }));
  }),

  // ============================================================================
  // SEARCH PROVIDERS — Location search, name search, + free OpenStreetMap API
  // ============================================================================

  searchProviders: protectedProcedure.input(z.object({
    query: z.string().min(1),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    radiusMiles: z.number().default(50),
    maxResults: z.number().default(20),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { providers: [], searchLocation: null, source: "none" as const };

    const query = input.query.trim();
    const results: Array<{
      id: number | null; name: string; type: string; chainName: string | null;
      address: string | null; city: string | null; state: string | null;
      phone: string | null; distance: number; rating: number | null;
      reviewCount: number | null; available24x7: boolean | null;
      hasMobileService: boolean | null; services: string[] | null;
      score: number; source: string; website: string | null;
    }> = [];
    const seenNames = new Set<string>();

    // 1) SEARCH DB BY NAME / CHAIN NAME
    const nameMatches = await db.select().from(zeunRepairProviders).where(
      and(
        eq(zeunRepairProviders.isActive, true),
        or(
          like(zeunRepairProviders.name, `%${query}%`),
          like(zeunRepairProviders.chainName, `%${query}%`),
          like(zeunRepairProviders.city, `%${query}%`),
          like(zeunRepairProviders.state, `%${query}%`),
          like(zeunRepairProviders.address, `%${query}%`)
        )
      )
    ).limit(50);

    const refLat = input.latitude ?? 30.5127;
    const refLng = input.longitude ?? -97.6792;

    for (const p of nameMatches) {
      const distance = p.latitude && p.longitude
        ? calculateDistance(refLat, refLng, Number(p.latitude), Number(p.longitude))
        : 999;
      const key = p.name.toLowerCase().replace(/\s+/g, "");
      if (!seenNames.has(key)) {
        seenNames.add(key);
        results.push({
          id: p.id, name: p.name, type: p.providerType,
          chainName: p.chainName, address: p.address, city: p.city, state: p.state,
          phone: p.phone, distance: Number(distance.toFixed(1)),
          rating: p.rating ? Number(p.rating) : null,
          reviewCount: p.reviewCount, available24x7: p.available24x7,
          hasMobileService: p.hasMobileService, services: p.services,
          score: 100 + (p.rating ? Number(p.rating) * 10 : 0),
          source: "database", website: null,
        });
      }
    }

    // 2) GEOCODE THE QUERY (is it a location name like "Houston"?)
    let searchLocation: { lat: number; lng: number; displayName: string } | null = null;
    const geo = await geocodeLocation(query);
    if (geo) {
      searchLocation = geo;
      console.log(`[ZEUN] Geocoded "${query}" → ${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)} (${geo.displayName})`);

      // Also search DB near the geocoded location
      const allActive = await db.select().from(zeunRepairProviders).where(eq(zeunRepairProviders.isActive, true)).limit(200);
      for (const p of allActive) {
        if (!p.latitude || !p.longitude) continue;
        const distance = calculateDistance(geo.lat, geo.lng, Number(p.latitude), Number(p.longitude));
        if (distance > input.radiusMiles) continue;
        const key = p.name.toLowerCase().replace(/\s+/g, "");
        if (seenNames.has(key)) continue;
        seenNames.add(key);
        results.push({
          id: p.id, name: p.name, type: p.providerType,
          chainName: p.chainName, address: p.address, city: p.city, state: p.state,
          phone: p.phone, distance: Number(distance.toFixed(1)),
          rating: p.rating ? Number(p.rating) : null,
          reviewCount: p.reviewCount, available24x7: p.available24x7,
          hasMobileService: p.hasMobileService, services: p.services,
          score: 100 - distance + (p.rating ? Number(p.rating) * 10 : 0),
          source: "database", website: null,
        });
      }

      // 3) SEARCH OVERPASS API for real mechanics near the geocoded location
      const radiusMeters = Math.round(input.radiusMiles * 1609.34);
      const overpassResults = await searchOverpassMechanics(geo.lat, geo.lng, Math.min(radiusMeters, 80000));
      console.log(`[ZEUN] Overpass returned ${overpassResults.length} real mechanics near "${query}"`);

      const VALID_TYPES = ["TRUCK_STOP", "DEALER", "INDEPENDENT", "MOBILE", "TOWING", "TIRE_SHOP"] as const;
      type ValidType = typeof VALID_TYPES[number];

      for (const op of overpassResults) {
        const key = op.name.toLowerCase().replace(/\s+/g, "");
        if (seenNames.has(key)) continue;
        seenNames.add(key);

        const distance = calculateDistance(geo.lat, geo.lng, op.lat, op.lng);

        // Cache into DB for persistence
        const pType = VALID_TYPES.includes(op.providerType as ValidType) ? (op.providerType as ValidType) : "INDEPENDENT";
        try {
          const [inserted] = await db.insert(zeunRepairProviders).values({
            source: "GOOGLE" as const,
            name: op.name.slice(0, 255),
            providerType: pType,
            address: op.address?.slice(0, 500) || null,
            city: op.city?.slice(0, 100) || null,
            state: op.state?.slice(0, 2) || null,
            zip: op.zip?.slice(0, 10) || null,
            latitude: String(op.lat),
            longitude: String(op.lng),
            phone: op.phone?.slice(0, 20) || null,
            website: op.website?.slice(0, 500) || null,
            services: op.services,
            isActive: true,
            rating: "4.0",
          });
          results.push({
            id: (inserted as any)?.insertId || null,
            name: op.name, type: pType, chainName: null,
            address: op.address || null, city: op.city || null, state: op.state || null,
            phone: op.phone || null, distance: Number(distance.toFixed(1)),
            rating: 4.0, reviewCount: 0, available24x7: null,
            hasMobileService: null, services: op.services,
            score: 90 - distance, source: "openstreetmap", website: op.website || null,
          });
        } catch {
          // Duplicate or insert error — still add to results
          results.push({
            id: null, name: op.name, type: pType, chainName: null,
            address: op.address || null, city: op.city || null, state: op.state || null,
            phone: op.phone || null, distance: Number(distance.toFixed(1)),
            rating: 4.0, reviewCount: 0, available24x7: null,
            hasMobileService: null, services: op.services,
            score: 90 - distance, source: "openstreetmap", website: op.website || null,
          });
        }
      }
    }

    // Sort by score descending, limit results
    results.sort((a, b) => b.score - a.score);
    return {
      providers: results.slice(0, input.maxResults),
      searchLocation,
      source: searchLocation ? "geocoded" as const : "name_search" as const,
    };
  }),

  getProvider: protectedProcedure.input(z.object({ providerId: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;

    const [provider] = await db.select().from(zeunRepairProviders).where(eq(zeunRepairProviders.id, input.providerId)).limit(1);
    if (!provider) return null;

    const reviews = await db.select().from(zeunProviderReviews).where(eq(zeunProviderReviews.providerId, input.providerId)).orderBy(desc(zeunProviderReviews.createdAt)).limit(10);

    return {
      ...provider,
      rating: provider.rating ? Number(provider.rating) : null,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: Number(r.rating),
        title: r.title,
        reviewText: r.reviewText,
        serviceType: r.serviceType,
        createdAt: r.createdAt?.toISOString(),
      })),
    };
  }),

  submitProviderReview: protectedProcedure.input(z.object({
    providerId: z.number(),
    breakdownReportId: z.number().optional(),
    rating: z.number().min(1).max(5),
    title: z.string().optional(),
    reviewText: z.string().optional(),
    serviceType: z.string().optional(),
    waitTimeMinutes: z.number().optional(),
    costAccuracy: z.enum(["LOWER", "AS_QUOTED", "HIGHER"]).optional(),
    wouldRecommend: z.boolean(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const userId = ctx.user?.id;
    if (!userId) throw new Error("Not authenticated");

    await db.insert(zeunProviderReviews).values({
      providerId: input.providerId,
      userId: Number(userId),
      breakdownReportId: input.breakdownReportId,
      rating: String(input.rating),
      title: input.title,
      reviewText: input.reviewText,
      serviceType: input.serviceType,
      waitTimeMinutes: input.waitTimeMinutes,
      costAccuracy: input.costAccuracy,
      wouldRecommend: input.wouldRecommend,
    });

    // Update provider rating
    const reviews = await db.select({ rating: zeunProviderReviews.rating }).from(zeunProviderReviews).where(eq(zeunProviderReviews.providerId, input.providerId));
    const avgRating = reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length;

    await db.update(zeunRepairProviders).set({
      zeunRating: String(avgRating.toFixed(2)),
      zeunReviewCount: reviews.length,
    }).where(eq(zeunRepairProviders.id, input.providerId));

    return { success: true };
  }),

  // ============================================================================
  // MAINTENANCE
  // ============================================================================

  getMaintenanceStatus: protectedProcedure.input(z.object({
    vehicleId: z.number(),
    currentOdometer: z.number(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;

    const schedules = await db.select().from(zeunMaintenanceSchedules).where(eq(zeunMaintenanceSchedules.vehicleId, input.vehicleId));

    const overdue: typeof schedules = [];
    const dueSoon: typeof schedules = [];
    const upcoming: typeof schedules = [];

    for (const s of schedules) {
      if (s.nextDueOdometer && input.currentOdometer >= s.nextDueOdometer) {
        overdue.push(s);
      } else if (s.nextDueOdometer && input.currentOdometer >= s.nextDueOdometer - 5000) {
        dueSoon.push(s);
      } else {
        upcoming.push(s);
      }
    }

    return {
      overdue: overdue.map((s) => ({ serviceType: s.serviceType, dueOdometer: s.nextDueOdometer, priority: s.priority })),
      dueSoon: dueSoon.map((s) => ({ serviceType: s.serviceType, dueOdometer: s.nextDueOdometer, milesRemaining: s.nextDueOdometer ? s.nextDueOdometer - input.currentOdometer : null })),
      upcoming: upcoming.map((s) => ({ serviceType: s.serviceType, dueOdometer: s.nextDueOdometer })),
    };
  }),

  getMaintenanceHistory: protectedProcedure.input(z.object({
    vehicleId: z.number(),
    limit: z.number().default(50),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];

    const logs = await db.select().from(zeunMaintenanceLogs).where(eq(zeunMaintenanceLogs.vehicleId, input.vehicleId)).orderBy(desc(zeunMaintenanceLogs.serviceDate)).limit(input.limit);

    return logs.map((l) => ({
      id: l.id,
      serviceType: l.serviceType,
      serviceDate: l.serviceDate?.toISOString(),
      odometerAtService: l.odometerAtService,
      cost: l.cost ? Number(l.cost) : null,
      providerName: l.providerName,
      notes: l.notes,
    }));
  }),

  logMaintenance: protectedProcedure.input(z.object({
    vehicleId: z.number(),
    serviceType: z.string(),
    serviceDate: z.string(),
    odometerAtService: z.number(),
    cost: z.number().optional(),
    providerName: z.string().optional(),
    providerId: z.number().optional(),
    partsReplaced: z.array(z.string()).optional(),
    laborHours: z.number().optional(),
    invoiceUrl: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const userId = ctx.user?.id;

    await db.insert(zeunMaintenanceLogs).values({
      vehicleId: input.vehicleId,
      driverId: userId ? Number(userId) : null,
      serviceType: input.serviceType,
      serviceDate: new Date(input.serviceDate),
      odometerAtService: input.odometerAtService,
      cost: input.cost ? String(input.cost) : null,
      providerName: input.providerName,
      providerId: input.providerId,
      partsReplaced: input.partsReplaced,
      laborHours: input.laborHours ? String(input.laborHours) : null,
      invoiceUrl: input.invoiceUrl,
      notes: input.notes,
    });

    // Update maintenance schedule
    const [schedule] = await db.select().from(zeunMaintenanceSchedules).where(and(eq(zeunMaintenanceSchedules.vehicleId, input.vehicleId), eq(zeunMaintenanceSchedules.serviceType, input.serviceType))).limit(1);

    if (schedule) {
      const nextDueOdometer = schedule.intervalMiles ? input.odometerAtService + schedule.intervalMiles : null;
      await db.update(zeunMaintenanceSchedules).set({
        lastServiceDate: new Date(input.serviceDate),
        lastServiceOdometer: input.odometerAtService,
        nextDueOdometer,
        isOverdue: false,
      }).where(eq(zeunMaintenanceSchedules.id, schedule.id));
    }

    return { success: true };
  }),

  checkRecalls: protectedProcedure.input(z.object({ vehicleId: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];

    const recalls = await db.select().from(zeunVehicleRecalls).where(eq(zeunVehicleRecalls.vehicleId, input.vehicleId)).orderBy(desc(zeunVehicleRecalls.recallDate));

    return recalls.map((r) => ({
      id: r.id,
      campaignNumber: r.campaignNumber,
      component: r.component,
      summary: r.summary,
      consequence: r.consequence,
      remedy: r.remedy,
      isCompleted: r.isCompleted,
      recallDate: r.recallDate?.toISOString(),
    }));
  }),

  // ============================================================================
  // FLEET MANAGEMENT
  // ============================================================================

  getFleetBreakdowns: protectedProcedure.input(z.object({
    companyId: z.number().optional(),
    status: z.enum(["OPEN", "RESOLVED", "ALL"]).default("ALL"),
    limit: z.number().default(50),
  })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];

    let conditions = [];
    if (input.companyId) conditions.push(eq(zeunBreakdownReports.companyId, input.companyId));
    if (input.status === "OPEN") conditions.push(sql`${zeunBreakdownReports.status} NOT IN ('RESOLVED', 'CANCELLED')`);
    else if (input.status === "RESOLVED") conditions.push(eq(zeunBreakdownReports.status, "RESOLVED"));

    const reports = await db.select({
      id: zeunBreakdownReports.id,
      driverId: zeunBreakdownReports.driverId,
      issueCategory: zeunBreakdownReports.issueCategory,
      severity: zeunBreakdownReports.severity,
      status: zeunBreakdownReports.status,
      canDrive: zeunBreakdownReports.canDrive,
      latitude: zeunBreakdownReports.latitude,
      longitude: zeunBreakdownReports.longitude,
      actualCost: zeunBreakdownReports.actualCost,
      createdAt: zeunBreakdownReports.createdAt,
      driverName: users.name,
    }).from(zeunBreakdownReports).leftJoin(users, eq(zeunBreakdownReports.driverId, users.id)).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(zeunBreakdownReports.createdAt)).limit(input.limit);

    return reports.map((r) => ({
      ...r,
      actualCost: r.actualCost ? Number(r.actualCost) : null,
      createdAt: r.createdAt?.toISOString(),
    }));
  }),

  getFleetCostAnalytics: protectedProcedure.input(z.object({
    companyId: z.number().optional(),
    startDate: z.string(),
    endDate: z.string(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { totalCost: 0, byCategory: {} };

    let conditions = [
      gte(zeunBreakdownReports.createdAt, new Date(input.startDate)),
      lte(zeunBreakdownReports.createdAt, new Date(input.endDate)),
      eq(zeunBreakdownReports.status, "RESOLVED"),
    ];
    if (input.companyId) conditions.push(eq(zeunBreakdownReports.companyId, input.companyId));

    const reports = await db.select({
      issueCategory: zeunBreakdownReports.issueCategory,
      actualCost: zeunBreakdownReports.actualCost,
    }).from(zeunBreakdownReports).where(and(...conditions));

    const byCategory: Record<string, number> = {};
    let totalCost = 0;

    for (const r of reports) {
      const cost = r.actualCost ? Number(r.actualCost) : 0;
      totalCost += cost;
      byCategory[r.issueCategory] = (byCategory[r.issueCategory] || 0) + cost;
    }

    return { totalCost, byCategory, breakdownCount: reports.length };
  }),

  // ============================================================================
  // DTC LOOKUP — Scenario ZEUN-011
  // Driver enters a fault code and gets instant actionable info
  // ============================================================================

  lookupDTC: protectedProcedure.input(z.object({
    code: z.string().min(1),
  })).query(async ({ input }) => {
    const db = await getDb();
    const normalizedCode = input.code.trim().toUpperCase().replace(/\s+/g, "-");

    // Try DB first
    if (db) {
      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS dtc_codes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(20) NOT NULL UNIQUE,
            spn VARCHAR(20),
            fmi VARCHAR(10),
            description VARCHAR(512) NOT NULL,
            severity ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
            category VARCHAR(100),
            symptoms JSON,
            commonCauses JSON,
            canDrive BOOLEAN DEFAULT TRUE,
            repairUrgency VARCHAR(100),
            estimatedCostMin DECIMAL(10,2),
            estimatedCostMax DECIMAL(10,2),
            estimatedTimeHours DECIMAL(5,1),
            affectedSystems JSON,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX dtc_spn_idx (spn),
            INDEX dtc_severity_idx (severity)
          )
        `);

        const [row] = await db.select().from(dtcCodes)
          .where(eq(dtcCodes.code, normalizedCode)).limit(1);

        if (row) {
          return {
            found: true,
            code: row.code,
            spn: row.spn,
            fmi: row.fmi,
            description: row.description,
            severity: row.severity,
            category: row.category,
            symptoms: row.symptoms || [],
            commonCauses: row.commonCauses || [],
            canDrive: row.canDrive ?? true,
            repairUrgency: row.repairUrgency || "Schedule repair soon",
            estimatedCost: {
              min: parseFloat(String(row.estimatedCostMin)) || 0,
              max: parseFloat(String(row.estimatedCostMax)) || 0,
            },
            estimatedTimeHours: parseFloat(String(row.estimatedTimeHours)) || 0,
            affectedSystems: row.affectedSystems || [],
          };
        }
      } catch (err) {
        console.error("[Zeun] DTC lookup DB error:", err);
      }
    }

    // Fallback: built-in common truck DTC codes
    const BUILT_IN_CODES: Record<string, any> = {
      "520342-31": {
        description: "DEF Doser Condition",
        severity: "HIGH",
        category: "Aftertreatment",
        symptoms: ["Derate warning", "DEF light on", "Reduced power"],
        commonCauses: ["Clogged DEF doser", "DEF pump failure", "Poor DEF quality", "Wiring issue"],
        canDrive: true,
        repairUrgency: "Schedule repair within 48 hours",
        estimatedCost: { min: 300, max: 1500 },
        estimatedTimeHours: 2,
        affectedSystems: ["Aftertreatment", "Emissions"],
      },
      "3364-4": {
        description: "EGR Valve Position Error",
        severity: "MEDIUM",
        category: "Emissions",
        symptoms: ["Check engine light", "Rough idle", "Decreased fuel economy"],
        commonCauses: ["Carbon buildup on EGR valve", "Faulty EGR position sensor", "Vacuum leak"],
        canDrive: true,
        repairUrgency: "Schedule repair within 1 week",
        estimatedCost: { min: 200, max: 800 },
        estimatedTimeHours: 1.5,
        affectedSystems: ["Emissions", "Engine"],
      },
      "111-3": {
        description: "Engine Coolant Level Low",
        severity: "HIGH",
        category: "Cooling",
        symptoms: ["Overheating warning", "Coolant temperature rising", "Steam from engine"],
        commonCauses: ["Coolant leak", "Radiator crack", "Hose failure", "Water pump failure"],
        canDrive: false,
        repairUrgency: "STOP - Do not drive. Risk of engine damage",
        estimatedCost: { min: 50, max: 2000 },
        estimatedTimeHours: 1,
        affectedSystems: ["Cooling", "Engine"],
      },
      "84-2": {
        description: "Vehicle Speed Signal Error",
        severity: "MEDIUM",
        category: "Drivetrain",
        symptoms: ["Speedometer erratic", "Cruise control inoperative", "ABS light on"],
        commonCauses: ["Speed sensor failure", "Wiring damage", "Tone ring damage"],
        canDrive: true,
        repairUrgency: "Schedule repair within 3 days",
        estimatedCost: { min: 100, max: 500 },
        estimatedTimeHours: 1,
        affectedSystems: ["Drivetrain", "ABS"],
      },
      "1569-31": {
        description: "Engine Protection Torque Derate",
        severity: "CRITICAL",
        category: "Engine",
        symptoms: ["Significant power loss", "Engine derate active", "Multiple warning lights"],
        commonCauses: ["Aftertreatment issue", "Sensor failure", "DPF full", "DEF quality"],
        canDrive: true,
        repairUrgency: "Immediate - find safe stopping point and call for service",
        estimatedCost: { min: 500, max: 5000 },
        estimatedTimeHours: 4,
        affectedSystems: ["Engine", "Aftertreatment"],
      },
    };

    const builtin = BUILT_IN_CODES[normalizedCode];
    if (builtin) {
      return { found: true, code: normalizedCode, spn: normalizedCode.split("-")[0], fmi: normalizedCode.split("-")[1], ...builtin };
    }

    // SPN/FMI pattern match attempt
    const parts = normalizedCode.split("-");
    if (parts.length === 2) {
      return {
        found: false,
        code: normalizedCode,
        spn: parts[0],
        fmi: parts[1],
        description: `SPN ${parts[0]} FMI ${parts[1]} - Code not in database`,
        severity: "MEDIUM",
        category: "Unknown",
        symptoms: ["Consult manufacturer documentation"],
        commonCauses: ["Refer to OEM service manual for SPN " + parts[0]],
        canDrive: true,
        repairUrgency: "Have inspected at next available service stop",
        estimatedCost: { min: 0, max: 0 },
        estimatedTimeHours: 0,
        affectedSystems: [],
      };
    }

    // Fallback: Use ESANG AI for deep fault code analysis
    try {
      const aiResult = await esangAI.analyzeDTC(normalizedCode);
      if (aiResult.description && aiResult.description !== `Code ${normalizedCode}`) {
        return {
          found: true,
          code: normalizedCode,
          spn: normalizedCode.split("-")[0],
          fmi: normalizedCode.split("-")[1],
          ...aiResult,
          estimatedCost: aiResult.estimatedCost,
          estimatedTimeHours: aiResult.estimatedHours,
          source: "esang-ai",
        };
      }
    } catch { /* AI unavailable, return generic */ }

    return {
      found: false,
      code: normalizedCode,
      description: "Code not recognized. Try SPN-FMI format (e.g. 520342-31)",
      severity: "MEDIUM",
      symptoms: [],
      commonCauses: [],
      canDrive: true,
      repairUrgency: "Unknown",
      estimatedCost: { min: 0, max: 0 },
      estimatedTimeHours: 0,
      affectedSystems: [],
    };
  }),

  // ============================================================================
  // EMERGENCY PROCEDURES — Scenarios ZEUN-012, ZEUN-013
  // Critical safety procedures displayed immediately
  // ============================================================================

  getEmergencyProcedure: protectedProcedure.input(z.object({
    emergencyType: z.enum([
      "engine_fire", "brake_failure", "tire_blowout", "rollover",
      "hazmat_spill", "medical_emergency", "accident", "stolen_vehicle",
      "weather_severe", "breakdown_highway",
    ]),
  })).query(async ({ input }) => {
    const PROCEDURES: Record<string, any> = {
      engine_fire: {
        title: "Engine Fire Emergency",
        severity: "CRITICAL",
        immediateAction: "STOP IMMEDIATELY - Turn off engine",
        steps: [
          "Pull over to safe location immediately",
          "Turn off engine and engage parking brake",
          "Turn off fuel shutoff valve if accessible",
          "Exit vehicle and move at least 100 feet away",
          "Call 911 immediately",
          "DO NOT open the hood - oxygen feeds fire",
          "Use fire extinguisher ONLY if safe to approach",
          "Warn other drivers and bystanders",
          "If hauling hazmat: call CHEMTREC at 1-800-424-9300",
        ],
        emergencyContacts: [
          { name: "911 Emergency", number: "911", priority: "primary" },
          { name: "CHEMTREC (Hazmat)", number: "1-800-424-9300", priority: "hazmat" },
        ],
        doNot: [
          "Do NOT open the hood",
          "Do NOT try to drive to a service station",
          "Do NOT use water on electrical or grease fires",
        ],
      },
      brake_failure: {
        title: "Brake Failure Emergency",
        severity: "CRITICAL",
        immediateAction: "DO NOT DRIVE - Set parking brake immediately",
        steps: [
          "Engage parking brake immediately",
          "If moving, downshift to lowest gear for engine braking",
          "Find safe location and stop completely",
          "Chock wheels with available materials",
          "Set emergency triangles (50, 100, 200 feet behind vehicle)",
          "Call for heavy-duty tow service",
          "Do NOT attempt to drive the vehicle",
          "Report to your dispatcher immediately",
        ],
        emergencyContacts: [
          { name: "911 Emergency", number: "911", priority: "primary" },
        ],
        doNot: [
          "Do NOT attempt to drive",
          "Do NOT pump brakes repeatedly if air pressure is zero",
          "Do NOT leave vehicle unattended on a grade",
        ],
      },
      tire_blowout: {
        title: "Tire Blowout Procedure",
        severity: "HIGH",
        immediateAction: "Hold steering firmly - DO NOT brake suddenly",
        steps: [
          "Grip the steering wheel firmly with both hands",
          "Take your foot OFF the accelerator - do NOT brake",
          "Let the vehicle slow down naturally",
          "Gently steer to the right shoulder",
          "Once slow enough, gently apply brakes",
          "Come to a complete stop on level ground",
          "Engage parking brake and turn on hazard lights",
          "Set emergency triangles behind vehicle",
          "Assess tire damage - call for mobile tire service",
        ],
        emergencyContacts: [],
        doNot: [
          "Do NOT slam on the brakes",
          "Do NOT make sudden steering corrections",
          "Do NOT drive on a flat tire",
        ],
      },
      hazmat_spill: {
        title: "Hazmat Spill Emergency",
        severity: "CRITICAL",
        immediateAction: "STOP - Evacuate area - Call 911 and CHEMTREC",
        steps: [
          "Stop the vehicle if spill is from your load",
          "Move upwind and uphill from the spill",
          "Evacuate at least 1,000 feet in all directions",
          "Call 911 immediately",
          "Call CHEMTREC: 1-800-424-9300",
          "Provide: UN Number, placard info, quantity spilled",
          "Do NOT attempt to clean up or contain the spill",
          "Keep all persons away from the area",
          "Refer to ERG guide number for your material",
          "Wait for HazMat response team",
        ],
        emergencyContacts: [
          { name: "911 Emergency", number: "911", priority: "primary" },
          { name: "CHEMTREC", number: "1-800-424-9300", priority: "primary" },
          { name: "National Response Center", number: "1-800-424-8802", priority: "secondary" },
        ],
        doNot: [
          "Do NOT touch or walk through spilled material",
          "Do NOT attempt cleanup without proper equipment",
          "Do NOT eat, drink, or smoke near the spill",
        ],
      },
      medical_emergency: {
        title: "Medical Emergency",
        severity: "CRITICAL",
        immediateAction: "Call 911 - Pull over safely if driving",
        steps: [
          "If driving, safely pull over and stop",
          "Call 911 and describe symptoms",
          "Unlock vehicle doors for emergency responders",
          "If conscious, sit upright and stay calm",
          "Share your exact GPS location with 911",
          "If chest pain: chew aspirin if available",
          "Do not drive yourself - wait for EMS",
        ],
        emergencyContacts: [
          { name: "911 Emergency", number: "911", priority: "primary" },
        ],
        doNot: [
          "Do NOT continue driving",
          "Do NOT ignore chest pain or stroke symptoms",
        ],
      },
      accident: {
        title: "Vehicle Accident Procedure",
        severity: "HIGH",
        immediateAction: "Check for injuries - Call 911 if needed",
        steps: [
          "Check yourself and others for injuries",
          "Call 911 if anyone is injured",
          "Move to safe area if possible, away from traffic",
          "Turn on hazard lights",
          "Set emergency triangles",
          "Exchange insurance information with other parties",
          "Take photos of damage, scene, and positions",
          "Do NOT admit fault at the scene",
          "Report to your catalyst/dispatcher",
          "File police report if required by law",
        ],
        emergencyContacts: [
          { name: "911 Emergency", number: "911", priority: "primary" },
        ],
        doNot: [
          "Do NOT leave the scene",
          "Do NOT admit fault",
          "Do NOT move severely injured persons",
        ],
      },
      breakdown_highway: {
        title: "Highway Breakdown Procedure",
        severity: "MEDIUM",
        immediateAction: "Move to right shoulder - Turn on hazards",
        steps: [
          "Signal and move to the right shoulder safely",
          "Turn on hazard flashers immediately",
          "Engage parking brake on level ground",
          "Set emergency triangles: 50, 100, 200 feet behind",
          "Assess the issue if safe to do so",
          "Report breakdown through Zeun app",
          "Stay in vehicle if shoulder is narrow",
          "If you must exit, exit from the passenger side",
          "Call for roadside assistance or tow",
        ],
        emergencyContacts: [],
        doNot: [
          "Do NOT stand behind or beside the vehicle on the traffic side",
          "Do NOT attempt repairs in a travel lane",
        ],
      },
      rollover: {
        title: "Rollover Emergency",
        severity: "CRITICAL",
        immediateAction: "Brace - Turn off engine after stopping",
        steps: [
          "If rolling: brace yourself, do NOT unbuckle",
          "Once stopped: turn off engine immediately",
          "Check for injuries",
          "Call 911",
          "If fuel is leaking, evacuate immediately",
          "If hauling hazmat: call CHEMTREC",
          "Do NOT attempt to right the vehicle",
          "Wait for emergency responders",
        ],
        emergencyContacts: [
          { name: "911 Emergency", number: "911", priority: "primary" },
          { name: "CHEMTREC (if Hazmat)", number: "1-800-424-9300", priority: "hazmat" },
        ],
        doNot: [
          "Do NOT unbuckle while vehicle is still moving",
          "Do NOT smoke or use open flames near fuel spill",
        ],
      },
      stolen_vehicle: {
        title: "Stolen Vehicle / Cargo Theft",
        severity: "HIGH",
        immediateAction: "Call 911 - Do NOT pursue",
        steps: [
          "Call 911 immediately and report location",
          "Note suspect description and direction of travel",
          "Do NOT attempt to follow or confront",
          "Call your dispatcher/catalyst",
          "Document vehicle details: VIN, plate, load info",
          "File police report",
          "Contact insurance company",
        ],
        emergencyContacts: [
          { name: "911 Emergency", number: "911", priority: "primary" },
          { name: "FBI Cargo Theft Hotline", number: "1-888-324-3228", priority: "secondary" },
        ],
        doNot: [
          "Do NOT pursue the thief",
          "Do NOT put yourself at risk",
        ],
      },
      weather_severe: {
        title: "Severe Weather Emergency",
        severity: "HIGH",
        immediateAction: "Find safe shelter - Avoid driving in tornado/severe storm",
        steps: [
          "Monitor weather alerts on your route",
          "If tornado: stop and seek shelter in sturdy building",
          "If no building: lie flat in a ditch, cover your head",
          "Do NOT shelter under overpass (wind tunnel effect)",
          "If flooding: NEVER drive through standing water",
          "Turn around, don't drown",
          "If high winds: park into the wind, away from trees",
          "Wait for all-clear before continuing",
        ],
        emergencyContacts: [
          { name: "911 Emergency", number: "911", priority: "primary" },
        ],
        doNot: [
          "Do NOT drive through flooded roads",
          "Do NOT park under overpasses during tornado",
          "Do NOT ignore weather warnings",
        ],
      },
    };

    const procedure = PROCEDURES[input.emergencyType];
    if (!procedure) {
      return { found: false, emergencyType: input.emergencyType };
    }

    return { found: true, emergencyType: input.emergencyType, ...procedure };
  }),

  // ============================================================================
  // SELF-REPAIR GUIDE — Manufacturer-specific DIY steps + tools + safety
  // ============================================================================

  getSelfRepairGuide: protectedProcedure.input(z.object({
    issueCategory: issueCategoryEnum,
    severity: severityEnum,
    symptoms: z.array(z.string()),
    vehicleMake: z.string().optional(),
    vehicleModel: z.string().optional(),
    vehicleYear: z.number().optional(),
  })).query(async ({ input }) => {
    // Manufacturer-specific tips keyed by make
    const MFG_DATA: Record<string, { commonIssues: string[]; tsb: string[]; specialTools: string[]; dealerTip: string }> = {
      FREIGHTLINER: {
        commonIssues: ["DEF system derates (Cascadia)", "Aftertreatment heater relay failures", "Detroit DD13/DD15 EGR cooler leaks"],
        tsb: ["TSB 47-010: Aftertreatment SCR catalyst", "TSB 25-023: Air compressor oil carry-over"],
        specialTools: ["Detroit Diesel Diagnostic Link (DDDL)", "Freightliner ServiceLink"],
        dealerTip: "Freightliner TeamRun service centers have 24/7 mobile repair",
      },
      PETERBILT: {
        commonIssues: ["PACCAR MX-13 injector failures", "Eaton Fuller shifting hard", "Aftertreatment 5th wheel sensor issues"],
        tsb: ["TSB PB-346: Front axle king pin wear", "TSB PB-221: HVAC blend door actuator"],
        specialTools: ["PACCAR Davie4 diagnostic tool", "PACCAR ESA (Electronic Service Analyst)"],
        dealerTip: "Peterbilt SmartLINQ remote diagnostics can pre-diagnose before you arrive",
      },
      KENWORTH: {
        commonIssues: ["PACCAR MX engine turbo actuator codes", "Dash cluster intermittent failures", "Air dryer purge valve sticking"],
        tsb: ["TSB KW-178: Steering gear input shaft seal", "TSB KW-156: Cab mount bushing wear"],
        specialTools: ["PACCAR Davie4", "Kenworth TruckTech+"],
        dealerTip: "Kenworth PremierCare has guaranteed uptime with 2-hour response",
      },
      VOLVO: {
        commonIssues: ["D13 engine turbo compound unit failures", "I-Shift transmission adaptation issues", "VNL aftertreatment DPF sensor drift"],
        tsb: ["TSB VL-2024-11: Coolant crossover tube leak", "TSB VL-2024-08: DEF dosing unit"],
        specialTools: ["Volvo Tech Tool (PTT)", "Volvo VOCOM II adapter"],
        dealerTip: "Volvo ASIST dealer network provides remote pre-diagnosis",
      },
      INTERNATIONAL: {
        commonIssues: ["MaxxForce engine issues (pre-2017)", "Cummins X15 aftertreatment on LT series", "HV series electrical gremlins"],
        tsb: ["TSB INT-G-21-004: A/C compressor clutch", "TSB INT-E-22-001: Fuel filter housing"],
        specialTools: ["Navistar OnCommand diagnostic", "ServiceMaxx diagnostic software"],
        dealerTip: "International OnCommand Connection provides remote diagnostics OTA",
      },
      MACK: {
        commonIssues: ["MP8 engine coolant leak at EGR", "mDRIVE transmission calibration", "Anthem ADAS sensor alignment"],
        tsb: ["TSB MA-240: Charge air cooler leak", "TSB MA-198: Fuel tank sender unit"],
        specialTools: ["Mack VCADS Pro", "Volvo Tech Tool (PTT) — shared platform"],
        dealerTip: "Mack Uptime Center monitors trucks 24/7 via GuardDog Connect",
      },
      WESTERN_STAR: {
        commonIssues: ["DD16 engine oil consumption", "Allison transmission shift concerns", "X-Series electrical integration"],
        tsb: ["TSB WS-042: Frame rail cracking at crossmember", "TSB WS-039: Steering column play"],
        specialTools: ["Detroit Diesel Diagnostic Link (DDDL)", "Allison DOC"],
        dealerTip: "Western Star uses Freightliner TeamRun network for service",
      },
    };

    // DIY repair guides per issue category
    const DIY_GUIDES: Record<string, {
      difficulty: "EASY" | "MODERATE" | "ADVANCED" | "SHOP_ONLY";
      canDIY: boolean;
      estimatedTime: string;
      tools: string[];
      steps: string[];
      safetyWarnings: string[];
      parts: string[];
      videoSearchTerm: string;
    }> = {
      ENGINE: {
        difficulty: "ADVANCED",
        canDIY: false,
        estimatedTime: "2-8 hours",
        tools: ["OBD-II scanner", "Multimeter", "Socket set", "Torque wrench"],
        steps: [
          "Connect diagnostic scanner and read all fault codes",
          "Check engine oil level and condition on dipstick",
          "Inspect coolant level in overflow tank (engine COOL)",
          "Check air filter — remove and inspect for debris/blockage",
          "Inspect serpentine belt for cracks, glazing, or fraying",
          "Listen for unusual noises — knocking, ticking, hissing",
          "Check for visible fluid leaks under the truck",
          "If derate: check DEF level and quality",
          "Record all codes and contact a certified mechanic",
        ],
        safetyWarnings: [
          "NEVER work under a truck supported only by a jack",
          "Let engine cool completely before opening cooling system",
          "Disconnect batteries before any electrical work",
          "Wear safety glasses and gloves",
        ],
        parts: ["Air filter", "Oil filter", "Serpentine belt", "Coolant"],
        videoSearchTerm: "semi truck engine diagnostic troubleshooting",
      },
      BRAKES: {
        difficulty: "SHOP_ONLY",
        canDIY: false,
        estimatedTime: "1-4 hours (shop)",
        tools: ["Air pressure gauge", "Brake adjustment tool", "Flashlight"],
        steps: [
          "Check dash air pressure gauges — both should read 100-130 PSI",
          "Listen for air leaks around brake chambers and lines",
          "Visually inspect brake drums for cracks or scoring",
          "Check push rod stroke — should not exceed adjustment limit",
          "Inspect brake hoses and lines for damage, chafing, or leaks",
          "Check air dryer — drain moisture from tanks",
          "DO NOT attempt brake chamber or slack adjuster repair yourself",
          "Call a mobile brake service or tow to shop",
        ],
        safetyWarnings: [
          "BRAKE WORK IS SAFETY-CRITICAL — improper repair can cause fatality",
          "Spring brakes are under extreme pressure — never disassemble",
          "Always chock wheels before working near brakes",
          "This is a CDL out-of-service violation if brakes are defective",
        ],
        parts: ["Brake shoes/pads", "S-cam bushings", "Slack adjusters", "Air brake hoses"],
        videoSearchTerm: "commercial truck air brake troubleshooting",
      },
      TRANSMISSION: {
        difficulty: "SHOP_ONLY",
        canDIY: false,
        estimatedTime: "4-12 hours (shop)",
        tools: ["Diagnostic scanner", "Transmission fluid dipstick/sight glass"],
        steps: [
          "Check transmission fluid level and color",
          "Scan for transmission fault codes",
          "Note: is the issue in specific gears or all gears?",
          "Check clutch pedal free play (manual transmissions)",
          "For automated trans (Eaton, mDRIVE): check software version",
          "Inspect transmission linkage and shift cables if manual",
          "Listen for grinding — indicates synchronizer or gear damage",
          "Contact dealer or heavy-duty transmission shop",
        ],
        safetyWarnings: [
          "Transmission fluid is hot — wait for cool-down",
          "Never work under a truck in gear without wheel chocks",
          "Automated transmissions require OEM software for calibration",
        ],
        parts: ["Transmission fluid", "Clutch kit", "Synchronizer rings", "Shift actuator"],
        videoSearchTerm: "semi truck transmission troubleshooting",
      },
      ELECTRICAL: {
        difficulty: "MODERATE",
        canDIY: true,
        estimatedTime: "30 min - 2 hours",
        tools: ["Multimeter", "Battery load tester", "Wire brush", "Terminal cleaner"],
        steps: [
          "Check battery voltage — should read 12.4-12.8V per battery",
          "Inspect battery terminals for corrosion — clean with wire brush",
          "Check battery cable connections — tighten if loose",
          "Test alternator output — should be 13.5-14.5V with engine running",
          "Check all fuses in the main fuse panel",
          "Inspect ground cables for corrosion or damage",
          "Check for parasitic draw if batteries drain overnight",
          "For starting issues: test starter relay and solenoid",
        ],
        safetyWarnings: [
          "Disconnect negative terminal first, reconnect last",
          "Batteries produce explosive hydrogen gas — no sparks or flames",
          "Wear eye protection — battery acid causes blindness",
          "Remove all jewelry before working on electrical systems",
        ],
        parts: ["Batteries (Group 31)", "Battery cables", "Fuses", "Alternator"],
        videoSearchTerm: "semi truck electrical system battery troubleshooting",
      },
      TIRES: {
        difficulty: "MODERATE",
        canDIY: true,
        estimatedTime: "30-90 minutes",
        tools: ["Tire pressure gauge", "Lug wrench (1-1/2\")", "Jack/jack stand", "Flashlight", "Tire iron"],
        steps: [
          "Move to safe location off the roadway",
          "Set parking brake and place wheel chocks",
          "Set emergency triangles 50/100/200 feet behind",
          "Inspect tire damage — sidewall punctures cannot be repaired",
          "If low pressure: inflate to placard spec (usually 100-110 PSI)",
          "For flat: call mobile tire service — truck tires need special equipment",
          "If you have a spare: loosen lugs, jack truck, swap tire, torque to spec",
          "Check all other tires for damage while stopped",
          "Drive slowly to nearest truck stop for proper repair",
        ],
        safetyWarnings: [
          "NEVER stand in front of a tire being inflated — blowout risk",
          "Truck tires at 100+ PSI can be lethal if they fail",
          "Never use a highway jack on soft ground",
          "Wear high-visibility vest when roadside",
        ],
        parts: ["Replacement tire", "Valve stems", "Lug nuts"],
        videoSearchTerm: "semi truck flat tire change roadside",
      },
      FUEL_SYSTEM: {
        difficulty: "MODERATE",
        canDIY: true,
        estimatedTime: "30-60 minutes",
        tools: ["Fuel filter wrench", "Drain pan", "Priming pump", "Clean rags"],
        steps: [
          "Check fuel gauges — rule out empty tank",
          "Inspect fuel/water separator — drain water from bowl",
          "Replace fuel filter if overdue (every 15-25k miles)",
          "Check for fuel leaks at lines, fittings, and tank",
          "Bleed/prime fuel system after filter change",
          "Inspect fuel tank cap seal — vacuum leak causes issues",
          "If engine won't start after filter change: cycle key to prime",
          "For diesel gelling in cold weather: add anti-gel treatment",
        ],
        safetyWarnings: [
          "No smoking or open flames near fuel",
          "Catch all spilled fuel — it's an environmental hazard",
          "Diesel fuel is slippery — clean any spills immediately",
          "Dispose of old filters properly",
        ],
        parts: ["Fuel filter", "Fuel/water separator", "Fuel line fittings", "Anti-gel additive"],
        videoSearchTerm: "diesel truck fuel filter change troubleshooting",
      },
      COOLING: {
        difficulty: "MODERATE",
        canDIY: true,
        estimatedTime: "30-90 minutes",
        tools: ["Coolant pressure tester", "Infrared thermometer", "Flashlight", "Coolant"],
        steps: [
          "WAIT for engine to cool — NEVER open radiator cap when hot",
          "Check coolant level in overflow reservoir",
          "Inspect radiator for visible leaks, debris blocking airflow",
          "Check all coolant hoses for bulging, cracks, or soft spots",
          "Inspect water pump weep hole for coolant dripping",
          "Check thermostat operation — should open at ~180-195°F",
          "Clean bugs/debris from radiator and charge air cooler",
          "Top off coolant with correct type (usually ELC/OAT)",
          "If overheating persists: do NOT drive — call for service",
        ],
        safetyWarnings: [
          "NEVER open a hot cooling system — steam causes severe burns",
          "Coolant is toxic to animals — clean all spills",
          "Do not mix coolant types — can cause gel blockage",
          "Engine fan can start without warning — keep hands clear",
        ],
        parts: ["Coolant (ELC/OAT type)", "Radiator hoses", "Thermostat", "Radiator cap"],
        videoSearchTerm: "diesel truck overheating coolant system troubleshooting",
      },
      EXHAUST: {
        difficulty: "ADVANCED",
        canDIY: false,
        estimatedTime: "2-6 hours (shop)",
        tools: ["Diagnostic scanner (OEM level)", "Infrared thermometer"],
        steps: [
          "Read all fault codes — DEF/SCR codes are complex",
          "Check DEF tank level — refill if below 1/4",
          "Inspect DEF quality — should be clear, not cloudy or crystallized",
          "Check DEF filler cap seal and lines for crystallization",
          "If regen needed: find safe location, initiate parked regen via dash",
          "Monitor regen temps — should reach 1000°F+",
          "If regen won't complete: likely sensor or DPF issue — need shop",
          "For derate codes: you may have limited miles before engine shutdown",
          "Contact OEM dealer — aftertreatment requires specialized tools",
        ],
        safetyWarnings: [
          "DPF/SCR system reaches 1000°F+ during regen — fire hazard",
          "Never park on grass or near combustibles during regen",
          "DEF fluid is corrosive — avoid contact with paint and electrical",
          "Aftertreatment work requires OEM diagnostic tool",
        ],
        parts: ["DEF fluid", "DEF doser/injector", "NOx sensors", "DPF filter"],
        videoSearchTerm: "diesel truck DEF aftertreatment DPF troubleshooting",
      },
      STEERING: {
        difficulty: "SHOP_ONLY",
        canDIY: false,
        estimatedTime: "2-6 hours (shop)",
        tools: ["Power steering fluid", "Flashlight"],
        steps: [
          "Check power steering fluid level — top off if low",
          "Inspect for power steering fluid leaks under truck",
          "Check power steering belt tension and condition",
          "Listen for whining noise — indicates low fluid or pump issue",
          "Check tie rod ends for play — grab tire and push/pull",
          "Inspect steering gear box for leaks at input shaft seal",
          "DO NOT drive if steering is severely compromised",
          "Call for tow to alignment/steering shop",
        ],
        safetyWarnings: [
          "STEERING FAILURE IS LIFE-THREATENING — do not drive",
          "Chock wheels before inspecting underneath",
          "Power steering fluid is hot — let it cool",
        ],
        parts: ["Power steering fluid", "Tie rod ends", "Steering gear seal kit", "Power steering pump"],
        videoSearchTerm: "semi truck power steering troubleshooting",
      },
      SUSPENSION: {
        difficulty: "SHOP_ONLY",
        canDIY: false,
        estimatedTime: "2-8 hours (shop)",
        tools: ["Flashlight", "Pry bar (inspection only)"],
        steps: [
          "Visually inspect air bags/springs for damage or leaks",
          "Check ride height — truck should be level side-to-side",
          "Listen for air leaks around suspension components",
          "Inspect shock absorbers for leaking fluid",
          "Check leaf springs for cracked or broken leaves",
          "Inspect U-bolts and hangers for damage",
          "If air ride: check leveling valve and air lines",
          "Drive slowly to nearest truck repair facility",
        ],
        safetyWarnings: [
          "Never work under a truck with deflated air bags without support",
          "Broken springs can shift suddenly — use extreme caution",
          "Suspension failure can cause loss of control",
        ],
        parts: ["Air bags/springs", "Shock absorbers", "Leaf springs", "U-bolts"],
        videoSearchTerm: "semi truck air ride suspension troubleshooting",
      },
      HVAC: {
        difficulty: "EASY",
        canDIY: true,
        estimatedTime: "15-45 minutes",
        tools: ["Cabin air filter", "Multimeter", "Refrigerant gauge (optional)"],
        steps: [
          "Check cabin air filter — replace if dirty or clogged",
          "Verify blower motor works on all speeds",
          "Check coolant level (heater uses engine coolant)",
          "For no A/C: check if compressor clutch engages",
          "Inspect A/C belt for damage or slipping",
          "Check for refrigerant leaks — oily residue at fittings",
          "Verify blend door moves — switch between hot and cold",
          "If no heat: check heater hoses are hot with engine warm",
          "A/C recharge requires certified technician (EPA regulation)",
        ],
        safetyWarnings: [
          "A/C refrigerant is under high pressure — can cause frostbite",
          "EPA requires certified technician for refrigerant handling",
          "Let engine cool before checking heater hoses",
        ],
        parts: ["Cabin air filter", "Blower motor resistor", "A/C belt", "Heater hoses"],
        videoSearchTerm: "semi truck HVAC heater AC troubleshooting",
      },
      OTHER: {
        difficulty: "MODERATE",
        canDIY: false,
        estimatedTime: "Varies",
        tools: ["Diagnostic scanner", "Flashlight", "Basic hand tools"],
        steps: [
          "Document all symptoms in detail",
          "Note when the issue occurs — speed, temperature, load condition",
          "Check all fluid levels — oil, coolant, DEF, power steering, transmission",
          "Scan for diagnostic trouble codes",
          "Check all warning lights and gauges",
          "Take photos/videos of any visible damage or leaks",
          "Contact a qualified mechanic with your findings",
        ],
        safetyWarnings: [
          "If unsure about safety — do NOT drive",
          "When in doubt, call for professional help",
        ],
        parts: [],
        videoSearchTerm: "semi truck general troubleshooting inspection",
      },
    };

    const guide = DIY_GUIDES[input.issueCategory] || DIY_GUIDES["OTHER"];
    const makeLower = (input.vehicleMake || "").toUpperCase().replace(/\s+/g, "_");
    const mfg = MFG_DATA[makeLower] || null;

    // Severity override: if CRITICAL, always mark as SHOP_ONLY
    if (input.severity === "CRITICAL") {
      guide.difficulty = "SHOP_ONLY";
      guide.canDIY = false;
      guide.safetyWarnings.unshift("⚠ CRITICAL SEVERITY — This issue requires immediate professional attention. Do NOT attempt self-repair.");
    }

    return {
      issueCategory: input.issueCategory,
      ...guide,
      manufacturer: mfg ? {
        make: input.vehicleMake,
        model: input.vehicleModel,
        year: input.vehicleYear,
        commonIssues: mfg.commonIssues,
        technicalServiceBulletins: mfg.tsb,
        specialDiagnosticTools: mfg.specialTools,
        dealerTip: mfg.dealerTip,
      } : null,
    };
  }),

  // ============================================================================
  // EMERGENCY ROADSIDE — Quick panel with all emergency contacts + procedures
  // ============================================================================

  getEmergencyRoadside: protectedProcedure.input(z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  })).query(async ({ input }) => {
    return {
      emergencyContacts: [
        { name: "911 Emergency", number: "911", type: "emergency", icon: "phone" },
        { name: "CHEMTREC (Hazmat)", number: "1-800-424-9300", type: "hazmat", icon: "alert-triangle" },
        { name: "National Response Center", number: "1-800-424-8802", type: "hazmat", icon: "shield" },
        { name: "FBI Cargo Theft Hotline", number: "1-888-324-3228", type: "theft", icon: "shield" },
        { name: "Poison Control", number: "1-800-222-1222", type: "medical", icon: "heart" },
        { name: "FMCSA Safety Hotline", number: "1-888-327-4236", type: "regulatory", icon: "file-text" },
        { name: "Roadside Assistance (AAA)", number: "1-800-222-4357", type: "roadside", icon: "truck" },
      ],
      emergencyTypes: [
        { type: "engine_fire", label: "Engine Fire", icon: "flame", severity: "CRITICAL" },
        { type: "brake_failure", label: "Brake Failure", icon: "alert-triangle", severity: "CRITICAL" },
        { type: "tire_blowout", label: "Tire Blowout", icon: "circle", severity: "HIGH" },
        { type: "hazmat_spill", label: "Hazmat Spill", icon: "alert-triangle", severity: "CRITICAL" },
        { type: "medical_emergency", label: "Medical Emergency", icon: "heart", severity: "CRITICAL" },
        { type: "accident", label: "Vehicle Accident", icon: "truck", severity: "HIGH" },
        { type: "rollover", label: "Rollover", icon: "alert-triangle", severity: "CRITICAL" },
        { type: "breakdown_highway", label: "Highway Breakdown", icon: "map-pin", severity: "MEDIUM" },
        { type: "stolen_vehicle", label: "Cargo Theft", icon: "shield", severity: "HIGH" },
        { type: "weather_severe", label: "Severe Weather", icon: "cloud", severity: "HIGH" },
      ],
      quickTips: [
        "Always carry emergency triangles, fire extinguisher, and first aid kit",
        "Know your exact GPS coordinates — share with 911 if needed",
        "Keep your CDL, registration, and insurance accessible",
        "If hauling hazmat: always have ERG guide and shipping papers ready",
      ],
    };
  }),

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  health: publicProcedure.query(async () => {
    return {
      status: "healthy",
      service: "Zeun Mechanics",
      version: "2.0.0",
      timestamp: new Date().toISOString(),
    };
  }),
});
