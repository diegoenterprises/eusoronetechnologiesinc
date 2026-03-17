/**
 * TRAINING ROUTER
 * tRPC procedures for driver training and certification management
 * ALL data from database — trainingModules, userTraining, trainingRecords
 */

import { z } from "zod";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { trainingModules, userTraining, trainingRecords, users, drivers, loads } from "../../drizzle/schema";
import { unsafeCast } from "../_core/types/unsafe";

const trainingStatusSchema = z.enum(["not_started", "in_progress", "completed", "expired"]);
const courseCategorySchema = z.enum(["safety", "hazmat", "compliance", "equipment", "customer_service"]);

async function resolveUserContext(ctxUser: any) {
  const db = await getDb();
  if (!db) return { userId: 0, companyId: 0 };
  const userId = typeof ctxUser?.id === "string" ? parseInt(ctxUser.id, 10) : (ctxUser?.id || 0);
  try { const [r] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1); return { userId, companyId: r?.companyId || 0 }; } catch { return { userId, companyId: 0 }; }
}

export const trainingRouter = router({
  /**
   * Get all trainings — from trainingRecords scoped by company
   */
  getAll: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const { companyId } = await resolveUserContext(ctx.user);
      if (!companyId) return [];
      try {
        const results = await db.select().from(trainingRecords).where(eq(trainingRecords.companyId, companyId)).orderBy(desc(trainingRecords.createdAt)).limit(50);
        return results.map(r => ({
          id: String(r.id), userId: String(r.userId), courseName: r.courseName,
          status: r.status, passed: r.passed, completedAt: r.completedAt?.toISOString() || null,
          expiresAt: r.expiresAt?.toISOString() || null,
        }));
      } catch { return []; }
    }),

  /**
   * Get training stats — computed from real data
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { totalTrainings: 0, totalCourses: 0, completed: 0, inProgress: 0, overdue: 0, completionRate: 0 };
      const { companyId } = await resolveUserContext(ctx.user);
      try {
        const [total] = await db.select({ count: sql<number>`count(*)` }).from(trainingRecords).where(eq(trainingRecords.companyId, companyId));
        const [completed] = await db.select({ count: sql<number>`count(*)` }).from(trainingRecords).where(and(eq(trainingRecords.companyId, companyId), eq(trainingRecords.status, "completed")));
        const [inProgress] = await db.select({ count: sql<number>`count(*)` }).from(trainingRecords).where(and(eq(trainingRecords.companyId, companyId), eq(trainingRecords.status, "in_progress")));
        const [expired] = await db.select({ count: sql<number>`count(*)` }).from(trainingRecords).where(and(eq(trainingRecords.companyId, companyId), eq(trainingRecords.status, "expired")));
        const [courseCount] = await db.select({ count: sql<number>`count(*)` }).from(trainingModules).where(eq(trainingModules.isActive, true));
        const t = total?.count || 0;
        const c = completed?.count || 0;
        return { totalTrainings: t, totalCourses: courseCount?.count || 0, completed: c, inProgress: inProgress?.count || 0, overdue: expired?.count || 0, completionRate: t > 0 ? Math.round((c / t) * 100) : 0 };
      } catch { return { totalTrainings: 0, totalCourses: 0, completed: 0, inProgress: 0, overdue: 0, completionRate: 0 }; }
    }),

  /**
   * Get training dashboard summary
   */
  getDashboardSummary: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { totalDrivers: 0, completedThisMonth: 0, inProgress: 0, expired: 0, overdue: 0, avgCompletionRate: 0, upcomingDeadlines: 0 };
      const { companyId } = await resolveUserContext(ctx.user);
      try {
        const [driverCount] = await db.select({ count: sql<number>`count(*)` }).from(drivers).where(eq(drivers.companyId, companyId));
        const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
        const [completedMonth] = await db.select({ count: sql<number>`count(*)` }).from(trainingRecords).where(and(eq(trainingRecords.companyId, companyId), eq(trainingRecords.status, "completed"), gte(trainingRecords.completedAt, monthStart)));
        const [inProg] = await db.select({ count: sql<number>`count(*)` }).from(trainingRecords).where(and(eq(trainingRecords.companyId, companyId), eq(trainingRecords.status, "in_progress")));
        const [expired] = await db.select({ count: sql<number>`count(*)` }).from(trainingRecords).where(and(eq(trainingRecords.companyId, companyId), eq(trainingRecords.status, "expired")));
        return { totalDrivers: driverCount?.count || 0, completedThisMonth: completedMonth?.count || 0, inProgress: inProg?.count || 0, expired: expired?.count || 0, overdue: 0, avgCompletionRate: 0, upcomingDeadlines: 0 };
      } catch { return { totalDrivers: 0, completedThisMonth: 0, inProgress: 0, expired: 0, overdue: 0, avgCompletionRate: 0, upcomingDeadlines: 0 }; }
    }),

  /**
   * List all courses — from trainingModules table
   */
  listCourses: protectedProcedure
    .input(z.object({ category: courseCategorySchema.optional(), search: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const filters: any[] = [eq(trainingModules.isActive, true)];
        if (input.category) filters.push(eq(trainingModules.type, unsafeCast(input.category)));
        const results = await db.select().from(trainingModules).where(and(...filters)).orderBy(trainingModules.name);
        let mapped = results.map(m => ({
          id: String(m.id), title: m.name, category: m.type, duration: m.duration || 0,
          modules: 1, passingScore: m.passingScore || 80,
          description: m.description || "", requiredFor: m.requiredForRoles || [],
          renewalPeriod: m.expirationMonths || 12,
        }));
        if (input.search) {
          const q = input.search.toLowerCase();
          mapped = mapped.filter(c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
        }
        return mapped;
      } catch { return []; }
    }),

  /**
   * Get driver training assignments — from userTraining table
   */
  getDriverAssignments: protectedProcedure
    .input(z.object({ driverId: z.string().optional(), status: trainingStatusSchema.optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { assignments: [], summary: { total: 0, completed: 0, inProgress: 0, expired: 0, notStarted: 0 } };
      const userId = input.driverId ? parseInt(input.driverId, 10) : (typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) : (ctx.user?.id || 0));
      try {
        const filters: any[] = [eq(userTraining.userId, userId)];
        if (input.status) filters.push(eq(userTraining.status, input.status));
        const results = await db.select().from(userTraining).where(and(...filters)).orderBy(desc(userTraining.createdAt));
        const [total] = await db.select({ count: sql<number>`count(*)` }).from(userTraining).where(eq(userTraining.userId, userId));
        const [completed] = await db.select({ count: sql<number>`count(*)` }).from(userTraining).where(and(eq(userTraining.userId, userId), eq(userTraining.status, "completed")));
        const [inProg] = await db.select({ count: sql<number>`count(*)` }).from(userTraining).where(and(eq(userTraining.userId, userId), eq(userTraining.status, "in_progress")));
        const [expired] = await db.select({ count: sql<number>`count(*)` }).from(userTraining).where(and(eq(userTraining.userId, userId), eq(userTraining.status, "expired")));
        const [notStarted] = await db.select({ count: sql<number>`count(*)` }).from(userTraining).where(and(eq(userTraining.userId, userId), eq(userTraining.status, "not_started")));
        return {
          assignments: results.map(r => ({ id: String(r.id), moduleId: String(r.moduleId), status: r.status, progress: r.progress || 0, score: r.score, startedAt: r.startedAt?.toISOString() || null, completedAt: r.completedAt?.toISOString() || null })),
          summary: { total: total?.count || 0, completed: completed?.count || 0, inProgress: inProg?.count || 0, expired: expired?.count || 0, notStarted: notStarted?.count || 0 },
        };
      } catch { return { assignments: [], summary: { total: 0, completed: 0, inProgress: 0, expired: 0, notStarted: 0 } }; }
    }),

  /**
   * Assign training to driver — writes to userTraining
   */
  assignTraining: protectedProcedure
    .input(z.object({ driverId: z.string(), courseId: z.string(), dueDate: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.insert(userTraining).values({
        userId: parseInt(input.driverId, 10),
        moduleId: parseInt(input.courseId, 10),
        status: "not_started",
        progress: 0,
        expiresAt: new Date(input.dueDate),
      } as never);
      const insertedId = unsafeCast(result).insertId || unsafeCast(result)[0]?.insertId || 0;
      // Auto-index training assignment for AI semantic search (fire-and-forget)
      try { const { indexComplianceRecord } = await import("../services/embeddings/aiTurbocharge"); indexComplianceRecord({ id: insertedId, type: "training_assignment", description: `Training course ${input.courseId} assigned to driver ${input.driverId}. Due: ${input.dueDate}`, status: "assigned", severity: "minor" }); } catch {}
      return { success: true, assignmentId: String(insertedId), assignedBy: ctx.user?.id, assignedAt: new Date().toISOString() };
    }),

  /**
   * Update training progress — writes to userTraining
   */
  updateProgress: protectedProcedure
    .input(z.object({ assignmentId: z.string(), progress: z.number(), moduleCompleted: z.number().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const status = input.progress >= 100 ? "completed" : "in_progress";
      await db.update(userTraining).set({ progress: input.progress, status: unsafeCast(status), startedAt: new Date() }).where(eq(userTraining.id, parseInt(input.assignmentId, 10)));
      return { success: true, assignmentId: input.assignmentId, newProgress: input.progress, updatedAt: new Date().toISOString() };
    }),

  /**
   * Complete training with score — writes to userTraining
   */
  completeTraining: protectedProcedure
    .input(z.object({ assignmentId: z.string(), score: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const passed = input.score >= 75;
      const completedAt = new Date();
      const expiresAt = passed ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null;
      await db.update(userTraining).set({ status: "completed", score: input.score, progress: 100, completedAt, expiresAt }).where(eq(userTraining.id, parseInt(input.assignmentId, 10)));
      return { success: true, assignmentId: input.assignmentId, score: input.score, passed, completedAt: completedAt.toISOString(), certificateId: passed ? input.assignmentId : null, expirationDate: expiresAt?.toISOString() || null };
    }),

  /**
   * Get training certificate — from userTraining
   */
  getCertificate: protectedProcedure
    .input(z.object({ certificateId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const [ut] = await db.select().from(userTraining).where(eq(userTraining.id, parseInt(input.certificateId, 10))).limit(1);
        if (!ut) return null;
        let courseName = "";
        try { const [m] = await db.select({ name: trainingModules.name }).from(trainingModules).where(eq(trainingModules.id, ut.moduleId)).limit(1); courseName = m?.name || ""; } catch {}
        let driverName = "";
        try { const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, ut.userId)).limit(1); driverName = u?.name || ""; } catch {}
        return { id: input.certificateId, driverName, courseName, completedDate: ut.completedAt?.toISOString() || "", expirationDate: ut.expiresAt?.toISOString() || "", score: ut.score || 0, instructor: "", certificateNumber: `CERT-${input.certificateId}`, downloadUrl: ut.certificateUrl || "" };
      } catch { return null; }
    }),

  /**
   * Get expiring certifications — from userTraining
   */
  getExpiringCertifications: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const { companyId } = await resolveUserContext(ctx.user);
      try {
        const futureDate = new Date(Date.now() + input.days * 24 * 60 * 60 * 1000);
        const results = await db.select().from(userTraining).where(and(eq(userTraining.status, "completed"), lte(userTraining.expiresAt, futureDate), gte(userTraining.expiresAt, new Date()))).limit(20);
        return results.map(r => ({ id: String(r.id), userId: String(r.userId), moduleId: String(r.moduleId), expiresAt: r.expiresAt?.toISOString() || "" }));
      } catch { return []; }
    }),

  // Additional training procedures — real DB queries
  getCourses: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    try { const results = await db.select().from(trainingModules).where(eq(trainingModules.isActive, true)); return results.map(m => ({ id: String(m.id), name: m.name, type: m.type, duration: m.duration })); } catch { return []; }
  }),
  getCertifications: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const userId = typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) : (ctx.user?.id || 0);
    try { return (await db.select().from(userTraining).where(and(eq(userTraining.userId, userId), eq(userTraining.status, "completed"))).limit(input?.limit || 20)).map(r => ({ id: String(r.id), moduleId: String(r.moduleId), completedAt: r.completedAt?.toISOString() || "", expiresAt: r.expiresAt?.toISOString() || "" })); } catch { return []; }
  }),
  getProgress: protectedProcedure.input(z.object({ courseId: z.string().optional() }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { courseId: input?.courseId || "", progress: 0, lastAccessed: "", totalCourses: 0, completed: 0, certifications: 0, hoursCompleted: 0, percentage: 0 };
    const userId = typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) : (ctx.user?.id || 0);
    try {
      const [total] = await db.select({ count: sql<number>`count(*)` }).from(userTraining).where(eq(userTraining.userId, userId));
      const [completed] = await db.select({ count: sql<number>`count(*)` }).from(userTraining).where(and(eq(userTraining.userId, userId), eq(userTraining.status, "completed")));
      const t = total?.count || 0; const c = completed?.count || 0;
      return { courseId: input?.courseId || "", progress: t > 0 ? Math.round((c / t) * 100) : 0, lastAccessed: "", totalCourses: t, completed: c, certifications: c, hoursCompleted: 0, percentage: t > 0 ? Math.round((c / t) * 100) : 0 };
    } catch { return { courseId: input?.courseId || "", progress: 0, lastAccessed: "", totalCourses: 0, completed: 0, certifications: 0, hoursCompleted: 0, percentage: 0 }; }
  }),
  startCourse: protectedProcedure.input(z.object({ courseId: z.string() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const userId = typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) : (ctx.user?.id || 0);
    const result = await db.insert(userTraining).values({ userId, moduleId: parseInt(input.courseId, 10), status: "in_progress", progress: 0, startedAt: new Date() } as never);
    const insertedId = unsafeCast(result).insertId || unsafeCast(result)[0]?.insertId || 0;
    return { success: true, enrollmentId: String(insertedId) };
  }),

  // ============================================================================
  // REGULATORY TRAINING INTEGRATION — Stream 16
  // Connects regulatory engine requirements to training modules
  // Platform earns $29-$199 per course enrollment (marketplace model)
  // ============================================================================

  /**
   * Get required training based on regulatory engine analysis
   * Maps a driver's trailer/product/state combo to required courses
   */
  getRequiredRegulatoryCourses: protectedProcedure
    .input(z.object({
      trailerType: z.string().optional(),
      productCategory: z.string().optional(),
      states: z.array(z.string()).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { getRequirementsByCategory } = await import("../services/regulatoryQueries");

      const trainingReqs = getRequirementsByCategory(
        "training",
        unsafeCast(input.trailerType),
        "driver",
        unsafeCast(input.productCategory),
      );

      // Map regulatory requirements to course catalog
      const COURSE_CATALOG = [
        { regId: "FED-HAZMAT-TRAIN", title: "Hazmat Employee Training (49 CFR 172.704)", price: 149, duration: 480, renewalMonths: 36, category: "hazmat", modules: ["General Awareness", "Function-Specific", "Safety Training", "Security Awareness", "In-Depth Security"] },
        { regId: "FED-H2S-TRAIN", title: "H2S Safety Training (Hydrogen Sulfide)", price: 79, duration: 240, renewalMonths: 12, category: "safety", modules: ["H2S Detection", "PPE Usage", "Escape Procedures", "Rescue Operations", "First Aid"] },
        { regId: "FED-HAZWOPER", title: "HAZWOPER 24-Hour Initial Training", price: 199, duration: 1440, renewalMonths: 12, category: "safety", modules: ["Hazard Recognition", "Site Safety Plans", "PPE", "Decontamination", "Emergency Response", "Medical Surveillance"] },
        { regId: "FED-HAZWOPER-R", title: "HAZWOPER 8-Hour Annual Refresher", price: 69, duration: 480, renewalMonths: 12, category: "safety", modules: ["Annual Refresher", "Regulation Updates", "Incident Review"] },
        { regId: "TANKER-ROLLOVER", title: "Tanker Rollover Prevention", price: 49, duration: 120, renewalMonths: 24, category: "safety", modules: ["Load Dynamics", "Center of Gravity", "Surge Prevention", "Cornering", "Emergency Maneuvers"] },
        { regId: "CRUDE-GAUGING", title: "Crude Oil Gauging & Measurement (API MPMS)", price: 129, duration: 360, renewalMonths: 24, category: "equipment", modules: ["Manual Tank Gauging", "Temperature Correction", "BS&W Testing", "Gravity Measurement", "Strapping Tables", "Custody Transfer"] },
        { regId: "LOADING-RACK", title: "Loading Rack Safety & Operations", price: 89, duration: 240, renewalMonths: 12, category: "safety", modules: ["Pre-Loading Inspection", "Grounding/Bonding", "Vapor Recovery", "Emergency Shutdowns", "Spill Response"] },
        { regId: "DEFENSIVE-DRIVING", title: "CDL Defensive Driving (Smith System)", price: 39, duration: 180, renewalMonths: 24, category: "safety", modules: ["Aim High", "Get the Big Picture", "Keep Eyes Moving", "Leave Yourself an Out", "Make Sure They See You"] },
        { regId: "SECURITY-PLAN", title: "Hazmat Security Plan Awareness", price: 59, duration: 120, renewalMonths: 36, category: "compliance", modules: ["Security Risk Assessment", "En-Route Security", "Personnel Security", "Unauthorized Access Prevention"] },
        { regId: "DRIVER-WELLNESS", title: "CDL Health & Wellness Program", price: 29, duration: 60, renewalMonths: 12, category: "safety", modules: ["DOT Physical Prep", "Sleep Apnea", "Nutrition", "Fatigue Management"] },
        { regId: "ELD-COMPLIANCE", title: "ELD Compliance & HOS Rules", price: 49, duration: 120, renewalMonths: 12, category: "compliance", modules: ["ELD Basics", "HOS Rules", "Exceptions", "Data Transfer", "Malfunction Procedures"] },
        { regId: "SPCC-TRAINING", title: "SPCC Plan Training (40 CFR 112)", price: 69, duration: 180, renewalMonths: 12, category: "compliance", modules: ["Spill Prevention", "Control Measures", "Countermeasures", "Facility Plans", "Reporting Requirements"] },
      ];

      const required = COURSE_CATALOG.filter(c =>
        trainingReqs.some(r => r.id === c.regId) || (input.productCategory === "crude_oil" && ["CRUDE-GAUGING", "LOADING-RACK", "TANKER-ROLLOVER"].includes(c.regId))
      );

      // If no specific filters, return the full catalog
      const courses = required.length > 0 ? required : COURSE_CATALOG;

      return {
        courses: courses.map(c => ({
          ...c,
          durationHours: Math.round(c.duration / 60 * 10) / 10,
          renewalYears: Math.round(c.renewalMonths / 12 * 10) / 10,
          platformFee: Math.round(c.price * 0.30), // Platform keeps 30% of course price
        })),
        totalRequired: required.length,
        totalCost: courses.reduce((s, c) => s + c.price, 0),
        regulatorySource: trainingReqs.map(r => ({ id: r.id, title: r.title, regulation: r.regulation })),
      };
    }),

  /**
   * Purchase a training course — platform earns 30% of course price
   */
  purchaseCourse: protectedProcedure
    .input(z.object({
      courseRegId: z.string(),
      courseTitle: z.string(),
      price: z.number().min(0),
      driverId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) : (ctx.user?.id || 0);
      const targetUserId = input.driverId ? parseInt(input.driverId, 10) : userId;

      const PLATFORM_CUT = 0.30; // 30% platform commission on courses
      const platformFee = input.price * PLATFORM_CUT;

      // Create or find a training module for this course
      let moduleId: number;
      const [existing] = await db.select({ id: trainingModules.id })
        .from(trainingModules)
        .where(eq(trainingModules.name, input.courseTitle))
        .limit(1);

      if (existing) {
        moduleId = existing.id;
      } else {
        const [mod] = await db.insert(trainingModules).values({
          name: input.courseTitle,
          type: "hazmat",
          description: `Regulatory course: ${input.courseRegId}`,
          isActive: true,
          duration: 240,
          passingScore: 80,
          expirationMonths: 12,
        }).$returningId();
        moduleId = mod.id;
      }

      // Enroll the driver
      const [enrollment] = await db.insert(userTraining).values({
        userId: targetUserId,
        moduleId,
        status: "not_started",
        progress: 0,
      }).$returningId();

      // Record platform revenue
      if (input.price > 0) {
        try {
          const { platformRevenue } = await import("../../drizzle/schema");
          await db.insert(platformRevenue).values({
            transactionId: enrollment.id,
            transactionType: "training_course",
            userId,
            grossAmount: String(input.price.toFixed(2)),
            feeAmount: String(platformFee.toFixed(2)),
            netAmount: String((input.price - platformFee).toFixed(2)),
            platformShare: String(platformFee.toFixed(2)),
            processorShare: String((input.price - platformFee).toFixed(2)),
            discountApplied: "0.00",
            metadata: { courseRegId: input.courseRegId, courseTitle: input.courseTitle, driverId: targetUserId },
          });
        } catch (e) {
          logger.error("[Training] Revenue recording error:", e);
        }

        // Debit EusoWallet
        try {
          const { walletTransactions, wallets } = await import("../../drizzle/schema");
          const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
          if (wallet) {
            await db.insert(walletTransactions).values({
              walletId: wallet.id,
              type: "fee",
              amount: String(-input.price),
              netAmount: String(-input.price),
              fee: "0",
              description: `Training course: ${input.courseTitle}`,
              status: "completed",
              completedAt: new Date(),
              metadata: JSON.stringify({ courseRegId: input.courseRegId }),
            });
          }
        } catch (e) {
          logger.error("[Training] wallet debit error:", e);
        }
      }

      return {
        success: true,
        enrollmentId: String(enrollment.id),
        moduleId: String(moduleId),
        courseTitle: input.courseTitle,
        price: input.price,
        platformFee,
        status: "not_started",
      };
    }),

  /**
   * Training compliance gap analysis — identifies missing/expired training
   * for a driver based on their role, trailer, and product assignments
   */
  getComplianceGap: protectedProcedure
    .input(z.object({
      driverId: z.string().optional(),
      trailerType: z.string().optional(),
      productCategory: z.string().optional(),
      states: z.array(z.string()).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { gaps: [], completedCount: 0, totalRequired: 0, compliancePercent: 0 };

      const userId = input.driverId ? parseInt(input.driverId, 10) : (typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) : (ctx.user?.id || 0));

      try {
        // Get completed trainings
        const completed = await db.select({
          moduleId: userTraining.moduleId,
          status: userTraining.status,
          expiresAt: userTraining.expiresAt,
          completedAt: userTraining.completedAt,
        }).from(userTraining)
          .where(and(eq(userTraining.userId, userId), eq(userTraining.status, "completed")));

        // Get module names for completed
        const completedModuleIds = completed.map(c => c.moduleId);
        let completedNames: string[] = [];
        if (completedModuleIds.length > 0) {
          const modules = await db.select({ id: trainingModules.id, name: trainingModules.name })
            .from(trainingModules);
          completedNames = modules
            .filter(m => completedModuleIds.includes(m.id))
            .map(m => m.name.toLowerCase());
        }

        // Get required courses from regulatory engine
        const { getRequirementsByCategory } = await import("../services/regulatoryQueries");
        const trainingReqs = getRequirementsByCategory(
          "training",
          unsafeCast(input.trailerType),
          "driver",
          unsafeCast(input.productCategory),
        );

        const now = new Date();
        const gaps = trainingReqs.map(req => {
          const matchingCompleted = completedNames.some(n =>
            n.includes(req.title.toLowerCase().substring(0, 20)) ||
            req.title.toLowerCase().includes(n.substring(0, 20))
          );
          const matchingRecord = completed.find((_, idx) =>
            completedNames[idx] && (
              completedNames[idx].includes(req.title.toLowerCase().substring(0, 20)) ||
              req.title.toLowerCase().includes(completedNames[idx].substring(0, 20))
            )
          );
          const isExpired = matchingRecord?.expiresAt && new Date(matchingRecord.expiresAt) < now;

          return {
            requirementId: req.id,
            title: req.title,
            regulation: req.regulation,
            severity: req.severity,
            renewalPeriod: req.renewalPeriod || "annual",
            status: matchingCompleted && !isExpired ? "compliant" : isExpired ? "expired" : "missing",
            completedAt: matchingRecord?.completedAt?.toISOString() || null,
            expiresAt: matchingRecord?.expiresAt?.toISOString() || null,
          };
        });

        const compliantCount = gaps.filter(g => g.status === "compliant").length;
        return {
          gaps,
          completedCount: compliantCount,
          totalRequired: gaps.length,
          compliancePercent: gaps.length > 0 ? Math.round((compliantCount / gaps.length) * 100) : 100,
        };
      } catch (e) {
        logger.error("[Training] getComplianceGap error:", e);
        return { gaps: [], completedCount: 0, totalRequired: 0, compliancePercent: 0 };
      }
    }),

  // ============================================================================
  // CROSS-VERTICAL MANDATORY TRAINING ASSIGNMENT SYSTEM
  // ANY authorized role can push specific courses to drivers:
  //   SHIPPER — requires drivers to complete training before load pickup
  //   DISPATCH — assigns pre-job training to fleet drivers
  //   CATALYST — ensures carrier drivers are trained for their loads
  //   BROKER — mandates compliance training for carrier network
  //   TERMINAL_MANAGER — requires site-specific safety training
  //   COMPLIANCE_OFFICER / SAFETY_MANAGER — enforces regulatory training
  //   ADMIN / SUPER_ADMIN — platform-wide training mandates
  // Supports bulk assignment, load-linking, SMS + WebSocket notifications.
  // ============================================================================

  /**
   * Assign course(s) to driver(s) — mandatory pre-job training
   * Called by: ALL roles with authority over drivers (shipper, dispatch, catalyst,
   *   broker, terminal_manager, compliance_officer, safety_manager, admin, super_admin)
   * Writes to userTraining, sends SMS + WebSocket push to each driver
   */
  dispatchAssignCourse: protectedProcedure
    .input(z.object({
      driverIds: z.array(z.string()).min(1),
      courseId: z.string(),
      loadId: z.string().optional(),
      priority: z.enum(["standard", "urgent", "mandatory"]).default("mandatory"),
      deadline: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const assignerId = typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) : (ctx.user?.id || 0);
      const moduleId = parseInt(input.courseId, 10);
      const dueDate = new Date(input.deadline);

      // Resolve course name
      let courseName = "Training Course";
      try {
        const [mod] = await db.select({ name: trainingModules.name }).from(trainingModules).where(eq(trainingModules.id, moduleId)).limit(1);
        if (mod) courseName = mod.name;
      } catch {}

      // Resolve assigner name + role
      let assignerName = "Dispatch";
      let assignerRole = (ctx.user as any)?.role || "UNKNOWN";
      try {
        const [u] = await db.select({ name: users.name, role: users.role }).from(users).where(eq(users.id, assignerId)).limit(1);
        if (u?.name) assignerName = u.name;
        if (u?.role) assignerRole = u.role;
      } catch {}

      const results: Array<{ driverId: string; assignmentId: string; driverName: string; notified: boolean }> = [];

      for (const did of input.driverIds) {
        const driverUserId = parseInt(did, 10);

        // Check if already assigned (skip duplicates)
        try {
          const [existing] = await db.select({ id: userTraining.id })
            .from(userTraining)
            .where(and(
              eq(userTraining.userId, driverUserId),
              eq(userTraining.moduleId, moduleId),
              eq(userTraining.status, "not_started"),
            ))
            .limit(1);
          if (existing) {
            results.push({ driverId: did, assignmentId: String(existing.id), driverName: "", notified: false });
            continue;
          }
        } catch {}

        // Insert assignment
        const [inserted] = await db.insert(userTraining).values({
          userId: driverUserId,
          moduleId,
          status: "not_started",
          progress: 0,
          expiresAt: dueDate,
        } as never).$returningId();

        const assignmentId = String(inserted.id);

        // Get driver info for notification
        let driverName = "";
        let driverPhone = "";
        try {
          const [driverUser] = await db.select({ name: users.name, phone: users.phone })
            .from(users).where(eq(users.id, driverUserId)).limit(1);
          driverName = driverUser?.name || "";
          driverPhone = driverUser?.phone || "";
        } catch {}

        let notified = false;

        // SMS notification
        if (driverPhone) {
          try {
            const { sendSms } = await import("../services/eusosms");
            const loadRef = input.loadId ? ` for load ${input.loadId}` : "";
            const urgency = input.priority === "urgent" ? "URGENT: " : input.priority === "mandatory" ? "MANDATORY: " : "";
            await sendSms({
              to: driverPhone,
              message: `EusoTrip: ${urgency}${assignerName} assigned you "${courseName}"${loadRef}. Due: ${dueDate.toLocaleDateString()}. Complete at https://eusotrip.com/training`,
              userId: driverUserId,
            });
            notified = true;
          } catch (e) {
            logger.warn("[Training] SMS send failed for driver", driverUserId, e);
          }
        }

        // WebSocket notification
        try {
          const { emitUserNotification } = await import("../services/socketService");
          emitUserNotification(driverUserId, {
            type: "training_assigned",
            title: `${input.priority === "mandatory" ? "Mandatory" : "New"} Training Assigned`,
            message: `${assignerName} assigned "${courseName}". Due: ${dueDate.toLocaleDateString()}.${input.loadId ? ` Required before load ${input.loadId}.` : ""}`,
            data: { assignmentId, courseId: input.courseId, loadId: input.loadId, priority: input.priority, deadline: input.deadline },
          });
        } catch {}

        results.push({ driverId: did, assignmentId, driverName, notified });
      }

      // Audit log
      try {
        const { auditLogs } = await import("../../drizzle/schema");
        await db.insert(auditLogs).values({
          userId: assignerId,
          action: "training_dispatched",
          entityType: "TRAINING",
          entityId: input.courseId,
          metadata: JSON.stringify({
            courseId: input.courseId,
            courseName,
            driverIds: input.driverIds,
            loadId: input.loadId || null,
            priority: input.priority,
            deadline: input.deadline,
            notes: input.notes || null,
            assignmentCount: results.length,
            assignerRole,
          }),
        } as never);
      } catch {}

      return {
        success: true,
        courseName,
        assignments: results,
        totalAssigned: results.length,
        assignedBy: assignerName,
        assignedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get fleet training status — cross-vertical view of drivers + their training status
   * SHIPPER: sees drivers assigned to their loads (across companies)
   * DISPATCH/CATALYST/BROKER/ADMIN/COMPLIANCE_OFFICER/SAFETY_MANAGER: sees drivers in their company fleet
   * TERMINAL_MANAGER: sees drivers in their company
   */
  getFleetTrainingStatus: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      filter: z.enum(["all", "pending", "overdue", "compliant"]).optional().default("all"),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { drivers: [], totalDrivers: 0, totalPending: 0, totalOverdue: 0, viewType: "fleet" };
      const { userId, companyId } = await resolveUserContext(ctx.user);
      const userRole = (ctx.user as any)?.role || "DRIVER";

      try {
        // ── Resolve which drivers to show based on caller's role ──
        let driverRows: Array<{ driverId: number; userId: number; status: string | null }> = [];
        let viewType = "fleet"; // fleet | loads

        if (userRole === "SHIPPER") {
          // SHIPPER: show drivers assigned to their loads
          viewType = "loads";
          const shipperLoads = await db.select({
            driverId: loads.driverId,
          }).from(loads)
            .where(and(
              eq(loads.shipperId, userId),
              sql`${loads.driverId} IS NOT NULL`,
            ))
            .orderBy(desc(loads.updatedAt))
            .limit(100);

          const driverUserIds = [...new Set(shipperLoads.map(l => l.driverId).filter(Boolean))] as number[];
          if (driverUserIds.length > 0) {
            for (const duid of driverUserIds) {
              try {
                const [d] = await db.select({ driverId: drivers.id, userId: drivers.userId, status: drivers.status })
                  .from(drivers).where(eq(drivers.userId, duid)).limit(1);
                if (d) driverRows.push(d);
              } catch {}
            }
          }
        } else {
          // ALL OTHER ROLES: show drivers in their company fleet
          if (!companyId) return { drivers: [], totalDrivers: 0, totalPending: 0, totalOverdue: 0, viewType };
          driverRows = await db.select({
            driverId: drivers.id,
            userId: drivers.userId,
            status: drivers.status,
          }).from(drivers).where(eq(drivers.companyId, companyId)).limit(100);
        }

        const now = new Date();
        const result: Array<{
          driverId: string;
          userId: string;
          driverName: string;
          driverStatus: string;
          pendingCourses: number;
          completedCourses: number;
          overdueCourses: number;
          assignments: Array<{ id: string; courseName: string; status: string; progress: number; dueDate: string | null; priority: string }>;
        }> = [];

        let totalPending = 0;
        let totalOverdue = 0;

        for (const d of driverRows) {
          // Get driver name
          let driverName = "";
          try {
            const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, d.userId)).limit(1);
            driverName = u?.name || `Driver #${d.driverId}`;
          } catch {}

          // Search filter
          if (input?.search && !driverName.toLowerCase().includes(input.search.toLowerCase())) continue;

          // Get training assignments
          const assignments = await db.select({
            id: userTraining.id,
            moduleId: userTraining.moduleId,
            status: userTraining.status,
            progress: userTraining.progress,
            expiresAt: userTraining.expiresAt,
          }).from(userTraining).where(eq(userTraining.userId, d.userId)).orderBy(desc(userTraining.id));

          // Get module names
          const moduleIds = [...new Set(assignments.map(a => a.moduleId))];
          const moduleNames: Record<number, string> = {};
          if (moduleIds.length > 0) {
            const modules = await db.select({ id: trainingModules.id, name: trainingModules.name }).from(trainingModules);
            for (const m of modules) moduleNames[m.id] = m.name;
          }

          const pending = assignments.filter(a => a.status === "not_started" || a.status === "in_progress");
          const completed = assignments.filter(a => a.status === "completed");
          const overdue = assignments.filter(a =>
            (a.status === "not_started" || a.status === "in_progress") && a.expiresAt && new Date(a.expiresAt) < now
          );

          totalPending += pending.length;
          totalOverdue += overdue.length;

          // Apply filter
          if (input?.filter === "pending" && pending.length === 0) continue;
          if (input?.filter === "overdue" && overdue.length === 0) continue;
          if (input?.filter === "compliant" && (pending.length > 0 || overdue.length > 0)) continue;

          result.push({
            driverId: String(d.driverId),
            userId: String(d.userId),
            driverName,
            driverStatus: d.status || "active",
            pendingCourses: pending.length,
            completedCourses: completed.length,
            overdueCourses: overdue.length,
            assignments: assignments.slice(0, 10).map(a => ({
              id: String(a.id),
              courseName: moduleNames[a.moduleId] || `Course #${a.moduleId}`,
              status: a.status || "not_started",
              progress: a.progress || 0,
              dueDate: a.expiresAt?.toISOString() || null,
              priority: overdue.some(o => o.id === a.id) ? "overdue" : pending.some(p => p.id === a.id) ? "pending" : "completed",
            })),
          });
        }

        return {
          drivers: result,
          totalDrivers: result.length,
          totalPending,
          totalOverdue,
          viewType,
        };
      } catch (e) {
        logger.error("[Training] getFleetTrainingStatus error:", e);
        return { drivers: [], totalDrivers: 0, totalPending: 0, totalOverdue: 0, viewType: "fleet" };
      }
    }),

  /**
   * Get pending mandatory training for a driver — what the driver sees
   * Shows only not_started / in_progress assignments with course details
   */
  getPendingMandatoryTraining: protectedProcedure
    .input(z.object({ driverId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { pending: [], overdue: [], totalPending: 0, totalOverdue: 0 };

      const userId = input?.driverId
        ? parseInt(input.driverId, 10)
        : (typeof ctx.user?.id === "string" ? parseInt(ctx.user.id, 10) : (ctx.user?.id || 0));

      try {
        const assignments = await db.select({
          id: userTraining.id,
          moduleId: userTraining.moduleId,
          status: userTraining.status,
          progress: userTraining.progress,
          expiresAt: userTraining.expiresAt,
          startedAt: userTraining.startedAt,
          createdAt: userTraining.createdAt,
        }).from(userTraining)
          .where(and(
            eq(userTraining.userId, userId),
            sql`${userTraining.status} IN ('not_started', 'in_progress')`,
          ))
          .orderBy(userTraining.expiresAt);

        const now = new Date();
        const pending: Array<{ id: string; courseId: string; courseName: string; description: string; status: string; progress: number; dueDate: string | null; assignedAt: string | null; isOverdue: boolean; duration: number }> = [];
        const overdue: typeof pending = [];

        for (const a of assignments) {
          let courseName = "";
          let description = "";
          let duration = 0;
          try {
            const [m] = await db.select({ name: trainingModules.name, description: trainingModules.description, duration: trainingModules.duration })
              .from(trainingModules).where(eq(trainingModules.id, a.moduleId)).limit(1);
            courseName = m?.name || `Course #${a.moduleId}`;
            description = m?.description || "";
            duration = m?.duration || 0;
          } catch {}

          const isOverdue = a.expiresAt ? new Date(a.expiresAt) < now : false;
          const item = {
            id: String(a.id),
            courseId: String(a.moduleId),
            courseName,
            description,
            status: a.status || "not_started",
            progress: a.progress || 0,
            dueDate: a.expiresAt?.toISOString() || null,
            assignedAt: a.createdAt?.toISOString() || null,
            isOverdue,
            duration,
          };

          if (isOverdue) overdue.push(item);
          else pending.push(item);
        }

        return { pending, overdue, totalPending: pending.length, totalOverdue: overdue.length };
      } catch (e) {
        logger.error("[Training] getPendingMandatoryTraining error:", e);
        return { pending: [], overdue: [], totalPending: 0, totalOverdue: 0 };
      }
    }),

  /**
   * Training revenue dashboard — platform admin view
   */
  getRevenueStats: protectedProcedure
    .input(z.object({ period: z.enum(["7d", "30d", "90d", "ytd"]).optional().default("30d") }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      const empty = { enrollments: 0, revenue: 0, platformRevenue: 0, avgCoursePrice: 0, topCourses: [] as { name: string; count: number }[] };
      if (!db) return empty;
      try {
        const { platformRevenue: prTable } = await import("../../drizzle/schema");
        const days = (input?.period || "30d") === "7d" ? 7 : (input?.period || "30d") === "90d" ? 90 : (input?.period || "30d") === "ytd" ? 365 : 30;
        const since = new Date(Date.now() - days * 86400000);

        const rows = await db.select({
          grossAmount: prTable.grossAmount,
          platformShare: prTable.platformShare,
          metadata: prTable.metadata,
        }).from(prTable)
          .where(and(
            eq(prTable.transactionType, "training_course"),
            gte(prTable.processedAt, since),
          ));

        let revenue = 0, platRev = 0;
        const courseCount: Record<string, number> = {};
        for (const r of rows) {
          revenue += parseFloat(String(r.grossAmount)) || 0;
          platRev += parseFloat(String(r.platformShare)) || 0;
          const meta = unsafeCast(r.metadata);
          if (meta?.courseTitle) courseCount[meta.courseTitle] = (courseCount[meta.courseTitle] || 0) + 1;
        }

        const topCourses = Object.entries(courseCount)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        return {
          enrollments: rows.length,
          revenue: Math.round(revenue * 100) / 100,
          platformRevenue: Math.round(platRev * 100) / 100,
          avgCoursePrice: rows.length > 0 ? Math.round((revenue / rows.length) * 100) / 100 : 0,
          topCourses,
        };
      } catch (e) {
        logger.error("[Training] getRevenueStats error:", e);
        return empty;
      }
    }),
});
