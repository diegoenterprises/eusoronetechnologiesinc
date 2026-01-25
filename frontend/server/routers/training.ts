/**
 * TRAINING ROUTER
 * tRPC procedures for driver training and certification management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const trainingStatusSchema = z.enum(["not_started", "in_progress", "completed", "expired"]);
const courseCategorySchema = z.enum(["safety", "hazmat", "compliance", "equipment", "customer_service"]);

export const trainingRouter = router({
  /**
   * Get all trainings for TrainingManagement page
   */
  getAll: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ input }) => {
      const trainings = [
        { id: "t1", title: "Hazmat Safety", driver: "Mike Johnson", status: "completed", progress: 100, dueDate: "2025-01-20" },
        { id: "t2", title: "Defensive Driving", driver: "Sarah Williams", status: "in_progress", progress: 65, dueDate: "2025-02-15" },
        { id: "t3", title: "HOS Compliance", driver: "Tom Brown", status: "overdue", progress: 30, dueDate: "2025-01-10" },
      ];
      if (input.search) {
        const q = input.search.toLowerCase();
        return trainings.filter(t => t.title.toLowerCase().includes(q) || t.driver.toLowerCase().includes(q));
      }
      return trainings;
    }),

  /**
   * Get training stats for TrainingManagement page
   */
  getStats: protectedProcedure
    .query(async () => {
      return {
        totalTrainings: 45,
        completed: 32,
        inProgress: 8,
        overdue: 5,
        completionRate: 71,
      };
    }),

  /**
   * Get training dashboard summary
   */
  getDashboardSummary: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        totalDrivers: 18,
        completedThisMonth: 12,
        inProgress: 8,
        expired: 3,
        overdue: 2,
        avgCompletionRate: 85,
        upcomingDeadlines: 5,
      };
    }),

  /**
   * List all courses
   */
  listCourses: protectedProcedure
    .input(z.object({
      category: courseCategorySchema.optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const courses = [
        {
          id: "c1",
          title: "Hazmat Transportation Safety",
          category: "hazmat",
          duration: 120,
          modules: 8,
          passingScore: 80,
          description: "Comprehensive hazmat handling and transportation procedures per 49 CFR 172-180",
          requiredFor: ["DRIVER"],
          renewalPeriod: 12,
        },
        {
          id: "c2",
          title: "Defensive Driving",
          category: "safety",
          duration: 90,
          modules: 6,
          passingScore: 75,
          description: "Advanced defensive driving techniques for commercial vehicle operators",
          requiredFor: ["DRIVER"],
          renewalPeriod: 24,
        },
        {
          id: "c3",
          title: "Hours of Service Compliance",
          category: "compliance",
          duration: 60,
          modules: 4,
          passingScore: 85,
          description: "ELD regulations and HOS rules per 49 CFR 395",
          requiredFor: ["DRIVER", "CATALYST"],
          renewalPeriod: 12,
        },
        {
          id: "c4",
          title: "Tank Vehicle Operations",
          category: "equipment",
          duration: 90,
          modules: 5,
          passingScore: 80,
          description: "Safe operation of tank trailers including loading, unloading, and surge control",
          requiredFor: ["DRIVER"],
          renewalPeriod: 24,
        },
        {
          id: "c5",
          title: "Spill Response Procedures",
          category: "hazmat",
          duration: 45,
          modules: 3,
          passingScore: 90,
          description: "Emergency response procedures for hazmat spills per ERG 2024",
          requiredFor: ["DRIVER"],
          renewalPeriod: 12,
        },
      ];

      let filtered = courses;
      if (input.category) {
        filtered = filtered.filter(c => c.category === input.category);
      }
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(c => 
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
        );
      }

      return courses;
    }),

  /**
   * Get driver training assignments
   */
  getDriverAssignments: protectedProcedure
    .input(z.object({
      driverId: z.string().optional(),
      status: trainingStatusSchema.optional(),
    }))
    .query(async ({ input }) => {
      const assignments = [
        { driverId: "d1", driverName: "Mike Johnson", courseId: "c1", courseName: "Hazmat Transportation Safety", status: "completed", progress: 100, score: 92, completedDate: "2024-11-15", expirationDate: "2025-11-15" },
        { driverId: "d1", driverName: "Mike Johnson", courseId: "c2", courseName: "Defensive Driving", status: "in_progress", progress: 65, dueDate: "2025-02-01" },
        { driverId: "d1", driverName: "Mike Johnson", courseId: "c3", courseName: "Hours of Service Compliance", status: "completed", progress: 100, score: 88, completedDate: "2024-12-01", expirationDate: "2025-12-01" },
        { driverId: "d2", driverName: "Sarah Williams", courseId: "c1", courseName: "Hazmat Transportation Safety", status: "expired", progress: 100, score: 85, completedDate: "2024-01-10", expirationDate: "2025-01-10" },
        { driverId: "d2", driverName: "Sarah Williams", courseId: "c2", courseName: "Defensive Driving", status: "completed", progress: 100, score: 91, completedDate: "2024-10-20", expirationDate: "2026-10-20" },
        { driverId: "d3", driverName: "Tom Brown", courseId: "c1", courseName: "Hazmat Transportation Safety", status: "not_started", progress: 0, dueDate: "2025-02-15" },
        { driverId: "d3", driverName: "Tom Brown", courseId: "c4", courseName: "Tank Vehicle Operations", status: "in_progress", progress: 40, dueDate: "2025-01-31" },
      ];

      let filtered = assignments;
      if (input.driverId) {
        filtered = filtered.filter(a => a.driverId === input.driverId);
      }
      if (input.status) {
        filtered = filtered.filter(a => a.status === input.status);
      }

      return {
        assignments: filtered,
        summary: {
          total: assignments.length,
          completed: assignments.filter(a => a.status === "completed").length,
          inProgress: assignments.filter(a => a.status === "in_progress").length,
          expired: assignments.filter(a => a.status === "expired").length,
          notStarted: assignments.filter(a => a.status === "not_started").length,
        },
      };
    }),

  /**
   * Assign training to driver
   */
  assignTraining: protectedProcedure
    .input(z.object({
      driverId: z.string(),
      courseId: z.string(),
      dueDate: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        assignmentId: `assign_${Date.now()}`,
        assignedBy: ctx.user?.id,
        assignedAt: new Date().toISOString(),
      };
    }),

  /**
   * Update training progress
   */
  updateProgress: protectedProcedure
    .input(z.object({
      assignmentId: z.string(),
      progress: z.number(),
      moduleCompleted: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        assignmentId: input.assignmentId,
        newProgress: input.progress,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Complete training with score
   */
  completeTraining: protectedProcedure
    .input(z.object({
      assignmentId: z.string(),
      score: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const passed = input.score >= 75;
      
      return {
        success: true,
        assignmentId: input.assignmentId,
        score: input.score,
        passed,
        completedAt: new Date().toISOString(),
        certificateId: passed ? `cert_${Date.now()}` : null,
        expirationDate: passed ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null,
      };
    }),

  /**
   * Get training certificate
   */
  getCertificate: protectedProcedure
    .input(z.object({ certificateId: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.certificateId,
        driverName: "Mike Johnson",
        courseName: "Hazmat Transportation Safety",
        completedDate: "2024-11-15",
        expirationDate: "2025-11-15",
        score: 92,
        instructor: "Safety Training System",
        certificateNumber: `CERT-2024-${input.certificateId.slice(-4)}`,
        downloadUrl: `/api/certificates/${input.certificateId}/download`,
      };
    }),

  /**
   * Get expiring certifications
   */
  getExpiringCertifications: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      return [
        {
          driverId: "d2",
          driverName: "Sarah Williams",
          courseId: "c1",
          courseName: "Hazmat Transportation Safety",
          expirationDate: "2025-01-10",
          daysUntilExpiration: -13,
          status: "expired",
        },
        {
          driverId: "d4",
          driverName: "Lisa Chen",
          courseId: "c3",
          courseName: "Hours of Service Compliance",
          expirationDate: "2025-02-15",
          daysUntilExpiration: 22,
          status: "expiring_soon",
        },
      ];
    }),
});
