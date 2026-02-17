/**
 * TRAINING ROUTER
 * tRPC procedures for driver training and certification management
 * ALL data from database — trainingModules, userTraining, trainingRecords
 */

import { z } from "zod";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { auditedProtectedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { trainingModules, userTraining, trainingRecords, users, drivers } from "../../drizzle/schema";

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
        if (input.category) filters.push(eq(trainingModules.type, input.category as any));
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
      } as any);
      const insertedId = (result as any).insertId || (result as any)[0]?.insertId || 0;
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
      await db.update(userTraining).set({ progress: input.progress, status: status as any, startedAt: new Date() }).where(eq(userTraining.id, parseInt(input.assignmentId, 10)));
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
    const result = await db.insert(userTraining).values({ userId, moduleId: parseInt(input.courseId, 10), status: "in_progress", progress: 0, startedAt: new Date() } as any);
    const insertedId = (result as any).insertId || (result as any)[0]?.insertId || 0;
    return { success: true, enrollmentId: String(insertedId) };
  }),
});
