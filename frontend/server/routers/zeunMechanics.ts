/**
 * ZEUN MECHANICS ROUTER - AI-Powered Breakdown, Diagnostic & Repair Platform
 * Handles: Breakdown reports, AI diagnostics, provider search, maintenance tracking
 */

import { z } from "zod";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
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

    // Run AI diagnosis
    const diagnosis = analyzeSymptoms(input.symptoms);
    const canDriveResult = input.severity !== "CRITICAL" && input.canDrive;

    // Store diagnostic result
    await db.insert(zeunDiagnosticResults).values({
      breakdownReportId: report.id,
      confidence: String(diagnosis.probability * 100),
      primaryDiagnosis: diagnosis,
      alternativeDiagnoses: [],
      recommendedActions: canDriveResult ? ["Drive to nearest repair facility", "Monitor gauges closely"] : ["Do not drive", "Request tow or mobile service"],
      canDrive: canDriveResult,
      outOfService: input.severity === "CRITICAL",
      estimatedCostMin: "200",
      estimatedCostMax: "1500",
      estimatedRepairTimeMin: 1,
      estimatedRepairTimeMax: 8,
      processingTimeMs: Date.now() - startTime,
      aiModel: "zeun-pattern-v1",
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
      estimatedCost: { min: 200, max: 1500 },
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

    const providers = await db.select().from(zeunRepairProviders).where(and(...conditions)).limit(100);

    const scoredProviders = providers.map((p) => {
      const distance = p.latitude && p.longitude ? calculateDistance(input.latitude, input.longitude, Number(p.latitude), Number(p.longitude)) : 999;
      let score = 100;
      if (distance < 5) score += 30;
      else if (distance < 15) score += 25;
      else if (distance < 30) score += 15;
      if (p.rating) score += (Number(p.rating) - 3.0) * 10;
      if (p.available24x7) score += 10;
      return { ...p, distance, score };
    }).filter((p) => p.distance <= input.radiusMiles).sort((a, b) => b.score - a.score).slice(0, input.maxResults);

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
    }));
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
