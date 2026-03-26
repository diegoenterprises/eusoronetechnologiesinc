/**
 * TRAINING LMS ROUTER
 * tRPC procedures for the Learning Management System
 * Covers: courses, modules, lessons, quizzes, enrollments, progress, certificates
 * ALL data from database.
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import {
  trainingCourses,
  lmsModules,
  trainingLessons,
  trainingQuizzes,
  trainingQuizQuestions,
  userCourseEnrollments,
  userModuleProgress,
  userLessonProgress,
  userCertificates,
  countries,
  provinces,
  users,
  notifications,
} from "../../drizzle/schema";
import { eq, and, sql, desc, asc, like, inArray } from "drizzle-orm";

export const trainingLMSRouter = router({
  // ──────────────────────────────────────────────
  // 1. getCountries — list available countries
  // ──────────────────────────────────────────────
  getCountries: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    try {
      return await db
        .select()
        .from(countries)
        .where(eq(countries.isActive, true))
        .orderBy(asc(countries.name));
    } catch (e: any) {
      logger.error("[LMS] getCountries error:", e?.message);
      return [];
    }
  }),

  // ──────────────────────────────────────────────
  // 2. getProvinces — provinces for a country
  // ──────────────────────────────────────────────
  getProvinces: protectedProcedure
    .input(z.object({ countryId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        return await db
          .select()
          .from(provinces)
          .where(and(eq(provinces.countryId, input.countryId), eq(provinces.isActive, true)))
          .orderBy(asc(provinces.name));
      } catch (e: any) {
        logger.error("[LMS] getProvinces error:", e?.message);
        return [];
      }
    }),

  // ──────────────────────────────────────────────
  // 3. setUserCountry — set user's country/province
  // ──────────────────────────────────────────────
  setUserCountry: protectedProcedure
    .input(z.object({ country: z.enum(["US", "CA", "MX"]), provinceId: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = Number((ctx.user as any).id);
      try {
        await db
          .update(users)
          .set({
            country: input.country,
            countrySetAt: new Date(),
            provinceId: input.provinceId || null,
          })
          .where(eq(users.id, userId));
        return { success: true };
      } catch (e: any) {
        logger.error("[LMS] setUserCountry error:", e?.message);
        throw new Error("Failed to update country");
      }
    }),

  // ──────────────────────────────────────────────
  // 4. listCourses — course catalog with filtering
  // ──────────────────────────────────────────────
  listCourses: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        country: z.string().optional(),
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { courses: [], total: 0 };
      const category = input?.category;
      const country = input?.country;
      const search = input?.search;
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const offset = (page - 1) * limit;

      try {
        const conditions: any[] = [eq(trainingCourses.status, "active")];
        if (category) conditions.push(eq(trainingCourses.category, category as any));
        if (search) conditions.push(like(trainingCourses.title, `%${search}%`));

        const [countResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(trainingCourses)
          .where(and(...conditions));

        const rows = await db
          .select()
          .from(trainingCourses)
          .where(and(...conditions))
          .orderBy(desc(trainingCourses.enrollmentCount), asc(trainingCourses.title))
          .limit(limit)
          .offset(offset);

        // Filter by country scope if specified
        let filtered = rows;
        if (country) {
          filtered = rows.filter((c) => {
            try {
              const scope = typeof c.countryScope === "string" ? JSON.parse(c.countryScope) : c.countryScope;
              return Array.isArray(scope) && scope.includes(country);
            } catch {
              return true;
            }
          });
        }

        return { courses: filtered, total: countResult?.count || 0 };
      } catch (e: any) {
        logger.error("[LMS] listCourses error:", e?.message);
        return { courses: [], total: 0 };
      }
    }),

  // ──────────────────────────────────────────────
  // 5. getCourseDetail — full course with modules
  // ──────────────────────────────────────────────
  getCourseDetail: protectedProcedure
    .input(z.object({ courseId: z.number().optional(), slug: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        let course: any;
        if (input.slug) {
          [course] = await db.select().from(trainingCourses).where(eq(trainingCourses.slug, input.slug)).limit(1);
        } else if (input.courseId) {
          [course] = await db.select().from(trainingCourses).where(eq(trainingCourses.id, input.courseId)).limit(1);
        }
        if (!course) return null;

        const modules = await db
          .select()
          .from(lmsModules)
          .where(eq(lmsModules.courseId, course.id))
          .orderBy(asc(lmsModules.orderIndex));

        const moduleIds = modules.map((m) => m.id);
        let lessons: any[] = [];
        let quizzes: any[] = [];
        if (moduleIds.length > 0) {
          lessons = await db.select().from(trainingLessons).where(inArray(trainingLessons.moduleId, moduleIds)).orderBy(asc(trainingLessons.orderIndex));
          quizzes = await db.select().from(trainingQuizzes).where(inArray(trainingQuizzes.moduleId, moduleIds));
        }

        // Check enrollment status
        const userId = Number((ctx.user as any).id);
        let enrollment = null;
        if (userId) {
          const [e] = await db
            .select()
            .from(userCourseEnrollments)
            .where(and(eq(userCourseEnrollments.userId, userId), eq(userCourseEnrollments.courseId, course.id)))
            .limit(1);
          enrollment = e || null;
        }

        return {
          ...course,
          modules: modules.map((m) => ({
            ...m,
            lessons: lessons.filter((l) => l.moduleId === m.id),
            quiz: quizzes.find((q) => q.moduleId === m.id) || null,
          })),
          enrollment,
        };
      } catch (e: any) {
        logger.error("[LMS] getCourseDetail error:", e?.message);
        return null;
      }
    }),

  // ──────────────────────────────────────────────
  // 6. enrollInCourse — enroll user in a course
  // ──────────────────────────────────────────────
  enrollInCourse: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = Number((ctx.user as any).id);
      try {
        // Check existing enrollment
        const [existing] = await db
          .select()
          .from(userCourseEnrollments)
          .where(and(eq(userCourseEnrollments.userId, userId), eq(userCourseEnrollments.courseId, input.courseId)))
          .limit(1);
        if (existing) return { success: true, enrollmentId: existing.id, alreadyEnrolled: true };

        const [result] = await db.insert(userCourseEnrollments).values({
          userId,
          courseId: input.courseId,
          status: "enrolled",
          progressPercentage: 0,
          totalTimeSpentMinutes: 0,
        });

        // Increment enrollment count
        await db.execute(sql`UPDATE training_courses SET enrollmentCount = enrollmentCount + 1 WHERE id = ${input.courseId}`);

        return { success: true, enrollmentId: (result as any).insertId, alreadyEnrolled: false };
      } catch (e: any) {
        logger.error("[LMS] enrollInCourse error:", e?.message);
        throw new Error("Failed to enroll");
      }
    }),

  // ──────────────────────────────────────────────
  // 7. getMyEnrollments — user's enrolled courses
  // ──────────────────────────────────────────────
  getMyEnrollments: protectedProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const userId = Number((ctx.user as any).id);
      try {
        const conditions: any[] = [eq(userCourseEnrollments.userId, userId)];
        if (input?.status) conditions.push(eq(userCourseEnrollments.status, input.status as any));

        const enrollments = await db
          .select({
            enrollment: userCourseEnrollments,
            courseTitle: trainingCourses.title,
            courseSlug: trainingCourses.slug,
            courseCategory: trainingCourses.category,
            courseDescription: trainingCourses.description,
            courseDuration: trainingCourses.estimatedDurationMinutes,
            courseModuleCount: trainingCourses.moduleCount,
            coursePassingScore: trainingCourses.passingScore,
          })
          .from(userCourseEnrollments)
          .innerJoin(trainingCourses, eq(userCourseEnrollments.courseId, trainingCourses.id))
          .where(and(...conditions))
          .orderBy(desc(userCourseEnrollments.updatedAt));

        return enrollments;
      } catch (e: any) {
        logger.error("[LMS] getMyEnrollments error:", e?.message);
        return [];
      }
    }),

  // ──────────────────────────────────────────────
  // 8. getLessonContent — get a lesson's full content
  // ──────────────────────────────────────────────
  getLessonContent: protectedProcedure
    .input(z.object({ lessonId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const [lesson] = await db.select().from(trainingLessons).where(eq(trainingLessons.id, input.lessonId)).limit(1);
        if (!lesson) return null;

        // Mark lesson as started if not already
        const userId = Number((ctx.user as any).id);
        const [module] = await db.select().from(lmsModules).where(eq(lmsModules.id, lesson.moduleId)).limit(1);
        if (module) {
          const [enrollment] = await db
            .select()
            .from(userCourseEnrollments)
            .where(and(eq(userCourseEnrollments.userId, userId), eq(userCourseEnrollments.courseId, module.courseId)))
            .limit(1);
          if (enrollment) {
            // Upsert lesson progress
            const [existing] = await db
              .select()
              .from(userLessonProgress)
              .where(and(eq(userLessonProgress.enrollmentId, enrollment.id), eq(userLessonProgress.lessonId, input.lessonId)))
              .limit(1);
            if (!existing) {
              await db.insert(userLessonProgress).values({
                enrollmentId: enrollment.id,
                lessonId: input.lessonId,
                status: "in_progress",
                startedAt: new Date(),
                timeSpentMinutes: 0,
              });
            }
          }
        }

        return lesson;
      } catch (e: any) {
        logger.error("[LMS] getLessonContent error:", e?.message);
        return null;
      }
    }),

  // ──────────────────────────────────────────────
  // 9. completeLesson — mark a lesson complete
  // ──────────────────────────────────────────────
  completeLesson: protectedProcedure
    .input(z.object({ lessonId: z.number(), timeSpentMinutes: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = Number((ctx.user as any).id);
      try {
        const [lesson] = await db.select().from(trainingLessons).where(eq(trainingLessons.id, input.lessonId)).limit(1);
        if (!lesson) throw new Error("Lesson not found");

        const [module] = await db.select().from(lmsModules).where(eq(lmsModules.id, lesson.moduleId)).limit(1);
        if (!module) throw new Error("Module not found");

        const [enrollment] = await db
          .select()
          .from(userCourseEnrollments)
          .where(and(eq(userCourseEnrollments.userId, userId), eq(userCourseEnrollments.courseId, module.courseId)))
          .limit(1);
        if (!enrollment) throw new Error("Not enrolled");

        // Update lesson progress
        await db
          .update(userLessonProgress)
          .set({
            status: "completed",
            completedAt: new Date(),
            timeSpentMinutes: input.timeSpentMinutes || 0,
          })
          .where(and(eq(userLessonProgress.enrollmentId, enrollment.id), eq(userLessonProgress.lessonId, input.lessonId)));

        // Update enrollment time
        if (input.timeSpentMinutes) {
          await db.execute(
            sql`UPDATE user_course_enrollments SET totalTimeSpentMinutes = totalTimeSpentMinutes + ${input.timeSpentMinutes} WHERE id = ${enrollment.id}`
          );
        }

        // Recalculate progress
        await recalculateProgress(db, enrollment.id, module.courseId);

        return { success: true };
      } catch (e: any) {
        logger.error("[LMS] completeLesson error:", e?.message);
        throw new Error(e.message || "Failed to complete lesson");
      }
    }),

  // ──────────────────────────────────────────────
  // 10. getQuiz — get quiz questions for a module
  // ──────────────────────────────────────────────
  getQuiz: protectedProcedure
    .input(z.object({ moduleId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const [quiz] = await db.select().from(trainingQuizzes).where(eq(trainingQuizzes.moduleId, input.moduleId)).limit(1);
        if (!quiz) return null;

        const questions = await db
          .select({
            id: trainingQuizQuestions.id,
            questionText: trainingQuizQuestions.questionText,
            questionType: trainingQuizQuestions.questionType,
            options: trainingQuizQuestions.options,
            difficulty: trainingQuizQuestions.difficulty,
            orderIndex: trainingQuizQuestions.orderIndex,
          })
          .from(trainingQuizQuestions)
          .where(eq(trainingQuizQuestions.quizId, quiz.id))
          .orderBy(asc(trainingQuizQuestions.orderIndex));

        // Strip correct answers from response (graded server-side)
        return {
          ...quiz,
          questions: questions.map((q) => ({
            ...q,
            options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
          })),
        };
      } catch (e: any) {
        logger.error("[LMS] getQuiz error:", e?.message);
        return null;
      }
    }),

  // ──────────────────────────────────────────────
  // 11. submitQuiz — grade quiz answers
  // ──────────────────────────────────────────────
  submitQuiz: protectedProcedure
    .input(
      z.object({
        quizId: z.number(),
        answers: z.array(z.object({ questionId: z.number(), answer: z.string() })),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = Number((ctx.user as any).id);
      try {
        const [quiz] = await db.select().from(trainingQuizzes).where(eq(trainingQuizzes.id, input.quizId)).limit(1);
        if (!quiz) throw new Error("Quiz not found");

        const [module] = await db.select().from(lmsModules).where(eq(lmsModules.id, quiz.moduleId)).limit(1);
        if (!module) throw new Error("Module not found");

        const [enrollment] = await db
          .select()
          .from(userCourseEnrollments)
          .where(and(eq(userCourseEnrollments.userId, userId), eq(userCourseEnrollments.courseId, module.courseId)))
          .limit(1);
        if (!enrollment) throw new Error("Not enrolled");

        // Get questions with correct answers
        const questions = await db
          .select()
          .from(trainingQuizQuestions)
          .where(eq(trainingQuizQuestions.quizId, input.quizId));

        // Grade
        let correct = 0;
        const results = input.answers.map((a) => {
          const q = questions.find((qq) => qq.id === a.questionId);
          if (!q) return { questionId: a.questionId, correct: false, correctAnswer: null, explanation: null };
          const isCorrect = q.correctAnswer === a.answer;
          if (isCorrect) correct++;
          return {
            questionId: a.questionId,
            correct: isCorrect,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          };
        });

        const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
        const passed = score >= (quiz.passingScore || 80);

        // Update module progress
        const [existingProgress] = await db
          .select()
          .from(userModuleProgress)
          .where(and(eq(userModuleProgress.enrollmentId, enrollment.id), eq(userModuleProgress.moduleId, quiz.moduleId)))
          .limit(1);

        if (existingProgress) {
          await db
            .update(userModuleProgress)
            .set({
              quizScore: score,
              quizAttempts: (existingProgress.quizAttempts || 0) + 1,
              lastQuizAttemptAt: new Date(),
              status: passed ? "completed" : "in_progress",
              completedAt: passed ? new Date() : existingProgress.completedAt,
            })
            .where(eq(userModuleProgress.id, existingProgress.id));
        } else {
          await db.insert(userModuleProgress).values({
            enrollmentId: enrollment.id,
            moduleId: quiz.moduleId,
            startedAt: new Date(),
            status: passed ? "completed" : "in_progress",
            quizScore: score,
            quizAttempts: 1,
            lastQuizAttemptAt: new Date(),
            completedAt: passed ? new Date() : null,
            timeSpentMinutes: 0,
          });
        }

        // Recalculate course progress
        await recalculateProgress(db, enrollment.id, module.courseId);

        return {
          score,
          passed,
          passingScore: quiz.passingScore || 80,
          correctCount: correct,
          totalQuestions: questions.length,
          results,
        };
      } catch (e: any) {
        logger.error("[LMS] submitQuiz error:", e?.message);
        throw new Error(e.message || "Failed to submit quiz");
      }
    }),

  // ──────────────────────────────────────────────
  // 12. getModuleProgress — progress for a specific enrollment
  // ──────────────────────────────────────────────
  getModuleProgress: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        return await db
          .select({
            progress: userModuleProgress,
            moduleTitle: lmsModules.title,
            moduleOrder: lmsModules.orderIndex,
          })
          .from(userModuleProgress)
          .innerJoin(lmsModules, eq(userModuleProgress.moduleId, lmsModules.id))
          .where(eq(userModuleProgress.enrollmentId, input.enrollmentId))
          .orderBy(asc(lmsModules.orderIndex));
      } catch (e: any) {
        logger.error("[LMS] getModuleProgress error:", e?.message);
        return [];
      }
    }),

  // ──────────────────────────────────────────────
  // 13. getMyCertificates — user's earned certificates
  // ──────────────────────────────────────────────
  getMyCertificates: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const userId = Number((ctx.user as any).id);
    try {
      return await db
        .select({
          certificate: userCertificates,
          courseTitle: trainingCourses.title,
          courseSlug: trainingCourses.slug,
          courseCategory: trainingCourses.category,
        })
        .from(userCertificates)
        .innerJoin(trainingCourses, eq(userCertificates.courseId, trainingCourses.id))
        .where(eq(userCertificates.userId, userId))
        .orderBy(desc(userCertificates.issuedAt));
    } catch (e: any) {
      logger.error("[LMS] getMyCertificates error:", e?.message);
      return [];
    }
  }),

  // ──────────────────────────────────────────────
  // 14. getCertificate — single certificate detail
  // ──────────────────────────────────────────────
  getCertificate: protectedProcedure
    .input(z.object({ certificateId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const [cert] = await db
          .select({
            certificate: userCertificates,
            courseTitle: trainingCourses.title,
            courseSlug: trainingCourses.slug,
          })
          .from(userCertificates)
          .innerJoin(trainingCourses, eq(userCertificates.courseId, trainingCourses.id))
          .where(eq(userCertificates.id, input.certificateId))
          .limit(1);
        return cert || null;
      } catch (e: any) {
        logger.error("[LMS] getCertificate error:", e?.message);
        return null;
      }
    }),

  // ──────────────────────────────────────────────
  // 15. getLMSDashboard — summary stats for user
  // ──────────────────────────────────────────────
  getLMSDashboard: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db)
      return {
        totalCourses: 0,
        enrolledCourses: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        totalCertificates: 0,
        totalTimeSpent: 0,
        averageScore: 0,
      };
    const userId = Number((ctx.user as any).id);
    try {
      const [totalCourses] = await db.select({ count: sql<number>`count(*)` }).from(trainingCourses).where(eq(trainingCourses.status, "active"));
      const [enrolled] = await db.select({ count: sql<number>`count(*)` }).from(userCourseEnrollments).where(eq(userCourseEnrollments.userId, userId));
      const [completed] = await db
        .select({ count: sql<number>`count(*)` })
        .from(userCourseEnrollments)
        .where(and(eq(userCourseEnrollments.userId, userId), eq(userCourseEnrollments.status, "completed")));
      const [inProgress] = await db
        .select({ count: sql<number>`count(*)` })
        .from(userCourseEnrollments)
        .where(and(eq(userCourseEnrollments.userId, userId), eq(userCourseEnrollments.status, "in_progress")));
      const [certs] = await db.select({ count: sql<number>`count(*)` }).from(userCertificates).where(eq(userCertificates.userId, userId));

      const [timeResult] = await db
        .select({ total: sql<number>`COALESCE(SUM(totalTimeSpentMinutes), 0)` })
        .from(userCourseEnrollments)
        .where(eq(userCourseEnrollments.userId, userId));

      const [scoreResult] = await db
        .select({ avg: sql<number>`COALESCE(AVG(quizScore), 0)` })
        .from(userModuleProgress)
        .innerJoin(userCourseEnrollments, eq(userModuleProgress.enrollmentId, userCourseEnrollments.id))
        .where(and(eq(userCourseEnrollments.userId, userId), sql`${userModuleProgress.quizScore} IS NOT NULL`));

      return {
        totalCourses: totalCourses?.count || 0,
        enrolledCourses: enrolled?.count || 0,
        completedCourses: completed?.count || 0,
        inProgressCourses: inProgress?.count || 0,
        totalCertificates: certs?.count || 0,
        totalTimeSpent: timeResult?.total || 0,
        averageScore: Math.round(scoreResult?.avg || 0),
      };
    } catch (e: any) {
      logger.error("[LMS] getLMSDashboard error:", e?.message);
      return {
        totalCourses: 0,
        enrolledCourses: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        totalCertificates: 0,
        totalTimeSpent: 0,
        averageScore: 0,
      };
    }
  }),

  // ──────────────────────────────────────────────
  // 16. shareCourse — share/assign a course to another user
  // ──────────────────────────────────────────────
  shareCourse: protectedProcedure
    .input(
      z.object({
        courseId: z.number(),
        recipientEmail: z.string().email(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };

      try {
        // Find recipient user by email
        const [recipient] = await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(eq(users.email, input.recipientEmail))
          .limit(1);

        // Get course info
        const [course] = await db
          .select({ id: trainingCourses.id, title: trainingCourses.title, slug: trainingCourses.slug })
          .from(trainingCourses)
          .where(eq(trainingCourses.id, input.courseId))
          .limit(1);

        if (!course) return { success: false, error: "Course not found" };

        const senderName = (ctx.user as any)?.name || "A team member";

        if (recipient) {
          // User exists — create notification + auto-enroll
          await db.insert(notifications).values({
            userId: recipient.id,
            type: "system",
            title: `Training Assigned: ${course.title}`,
            message: input.message || `${senderName} has shared a training course with you.`,
            data: JSON.stringify({ courseId: course.id, courseSlug: course.slug, senderId: (ctx.user as any)?.id }),
          });

          // Auto-enroll if not already enrolled
          const [existing] = await db
            .select({ id: userCourseEnrollments.id })
            .from(userCourseEnrollments)
            .where(and(eq(userCourseEnrollments.userId, recipient.id), eq(userCourseEnrollments.courseId, course.id)))
            .limit(1);

          if (!existing) {
            await db.insert(userCourseEnrollments).values({
              userId: recipient.id,
              courseId: course.id,
              status: "enrolled",
              progressPercentage: 0,
              totalTimeSpentMinutes: 0,
            });
            await db.execute(sql`UPDATE training_courses SET enrollmentCount = enrollmentCount + 1 WHERE id = ${course.id}`);
          }

          return { success: true, recipientFound: true, recipientName: recipient.name };
        } else {
          // User not on platform
          return { success: true, recipientFound: false, message: "Invitation will be sent when user joins the platform" };
        }
      } catch (e: any) {
        logger.error("[LMS] shareCourse error:", e?.message);
        return { success: false, error: "Failed to share course" };
      }
    }),

  // ──────────────────────────────────────────────
  // 17. verifyCertificate — public cert verification
  // ──────────────────────────────────────────────
  verifyCertificate: protectedProcedure
    .input(z.object({ certificateNumber: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const [cert] = await db
          .select({
            certificate: userCertificates,
            courseTitle: trainingCourses.title,
            userName: users.name,
          })
          .from(userCertificates)
          .innerJoin(trainingCourses, eq(userCertificates.courseId, trainingCourses.id))
          .innerJoin(users, eq(userCertificates.userId, users.id))
          .where(eq(userCertificates.certificateNumber, input.certificateNumber))
          .limit(1);
        if (!cert) return null;
        return {
          valid: cert.certificate.status === "active",
          certificateNumber: cert.certificate.certificateNumber,
          courseName: cert.courseTitle,
          holderName: cert.userName,
          issuedAt: cert.certificate.issuedAt,
          expiresAt: cert.certificate.expiresAt,
          status: cert.certificate.status,
        };
      } catch (e: any) {
        logger.error("[LMS] verifyCertificate error:", e?.message);
        return null;
      }
    }),
});

// ── Helper: Recalculate overall course progress ──
async function recalculateProgress(db: any, enrollmentId: number, courseId: number) {
  try {
    // Count total modules and completed modules
    const [totalModules] = await db
      .select({ count: sql<number>`count(*)` })
      .from(lmsModules)
      .where(eq(lmsModules.courseId, courseId));

    const [completedModules] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userModuleProgress)
      .where(and(eq(userModuleProgress.enrollmentId, enrollmentId), eq(userModuleProgress.status, "completed")));

    const total = totalModules?.count || 1;
    const completed = completedModules?.count || 0;
    const percentage = Math.round((completed / total) * 100);

    const newStatus = percentage >= 100 ? "completed" : percentage > 0 ? "in_progress" : "enrolled";

    const updates: any = {
      progressPercentage: percentage,
      status: newStatus,
    };
    if (newStatus === "in_progress" && percentage > 0) {
      updates.startedAt = sql`COALESCE(startedAt, NOW())`;
    }
    if (newStatus === "completed") {
      updates.completedAt = new Date();
    }

    await db.update(userCourseEnrollments).set(updates).where(eq(userCourseEnrollments.id, enrollmentId));

    // If course completed, issue certificate
    if (newStatus === "completed") {
      const [enrollment] = await db.select().from(userCourseEnrollments).where(eq(userCourseEnrollments.id, enrollmentId)).limit(1);
      if (enrollment) {
        const [existingCert] = await db
          .select()
          .from(userCertificates)
          .where(and(eq(userCertificates.userId, enrollment.userId), eq(userCertificates.courseId, courseId)))
          .limit(1);
        if (!existingCert) {
          const certNumber = `EUSOTRIP-${courseId}-${enrollment.userId}-${Date.now().toString(36).toUpperCase()}`;
          const [course] = await db.select().from(trainingCourses).where(eq(trainingCourses.id, courseId)).limit(1);
          const renewalMonths = course?.renewalIntervalMonths || 12;
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + renewalMonths);

          await db.insert(userCertificates).values({
            userId: enrollment.userId,
            courseId,
            enrollmentId,
            certificateNumber: certNumber,
            issuedAt: new Date(),
            expiresAt,
            status: "active",
          });
        }
      }
    }
  } catch (e: any) {
    logger.error("[LMS] recalculateProgress error:", e?.message);
  }
}
