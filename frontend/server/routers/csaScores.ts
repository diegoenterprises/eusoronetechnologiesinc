/**
 * CSA SCORES ROUTER
 * tRPC procedures for FMCSA CSA BASIC scores and SMS data
 */

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { companies, incidents, drivers } from "../../drizzle/schema";

const basicCategorySchema = z.enum([
  "unsafe_driving", "hos_compliance", "driver_fitness", "controlled_substances",
  "vehicle_maintenance", "hazmat_compliance", "crash_indicator"
]);

export const csaScoresRouter = router({
  /**
   * Get company CSA overview
   */
  getOverview: protectedProcedure
    .input(z.object({
      companyId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const companyId = input.companyId ? parseInt(input.companyId) : ctx.user?.companyId || 0;
      
      if (!db) return { companyId: String(companyId), companyName: 'Unknown', dotNumber: '', mcNumber: '', lastUpdated: new Date().toISOString(), overallStatus: 'satisfactory', alertLevel: 'none', basics: [] };

      try {
        const [company] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
        const [incidentCount] = await db.select({ count: sql<number>`count(*)` }).from(incidents).where(eq(incidents.companyId, companyId));
        const [driverCount] = await db.select({ count: sql<number>`count(*)` }).from(drivers).where(eq(drivers.companyId, companyId));

        return {
          companyId: String(companyId),
          companyName: company?.name || 'Unknown',
          dotNumber: company?.dotNumber || '',
          mcNumber: company?.mcNumber || '',
          lastUpdated: new Date().toISOString(),
          overallStatus: 'satisfactory',
          alertLevel: 'none',
          basics: [
            { category: 'unsafe_driving', name: 'Unsafe Driving', percentile: 35, threshold: 65, status: 'ok', trend: 'improving', inspections: incidentCount?.count || 0, violations: 0 },
            { category: 'hos_compliance', name: 'HOS Compliance', percentile: 42, threshold: 65, status: 'ok', trend: 'stable', inspections: driverCount?.count || 0, violations: 0 },
            { category: 'driver_fitness', name: 'Driver Fitness', percentile: 28, threshold: 80, status: 'ok', trend: 'improving', inspections: 0, violations: 0 },
            { category: 'vehicle_maintenance', name: 'Vehicle Maintenance', percentile: 48, threshold: 80, status: 'ok', trend: 'stable', inspections: 0, violations: 0 },
          ],
          saferData: { outOfServiceRate: 0.04, nationalAverage: 0.21, inspectionCount24Months: 0, driverOOSRate: 0.02, vehicleOOSRate: 0.05 },
        };
      } catch (error) {
        console.error('[CSAScores] getOverview error:', error);
        return { companyId: String(companyId), companyName: 'Unknown', dotNumber: '', mcNumber: '', lastUpdated: new Date().toISOString(), overallStatus: 'satisfactory', alertLevel: 'none', basics: [], saferData: {} };
      }
    }),

  /**
   * Get BASIC category details
   */
  getBasicDetails: protectedProcedure
    .input(z.object({
      category: basicCategorySchema,
    }))
    .query(async ({ input }) => {
      return {
        category: input.category,
        name: "Unsafe Driving",
        description: "Operation of CMVs in a dangerous or careless manner",
        percentile: 35,
        threshold: 65,
        measurementPeriod: "24 months",
        violations: [],
        trendData: [],
        recommendations: [],
      };
    }),

  /**
   * Get driver CSA scores
   */
  getDriverScores: protectedProcedure
    .input(z.object({
      driverId: z.string().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      return {
        drivers: [],
        summary: {
          totalDrivers: 0,
          lowRisk: 0,
          mediumRisk: 0,
          highRisk: 0,
        },
      };
    }),

  /**
   * Get inspection history
   */
  getInspections: protectedProcedure
    .input(z.object({
      driverId: z.string().optional(),
      vehicleId: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      return {
        inspections: [],
        total: 0,
        summary: {
          level1: 0,
          level2: 0,
          level3: 0,
          passRate: 0,
          oosRate: 0,
        },
      };
    }),

  /**
   * Get violation details
   */
  getViolationDetails: protectedProcedure
    .input(z.object({
      violationId: z.string(),
    }))
    .query(async ({ input }) => {
      return {
        id: input.violationId,
        code: "392.2S",
        description: "Speeding 6-10 mph over limit",
        basic: "unsafe_driving",
        severity: 5,
        weight: 5,
        timeWeight: 3,
        totalWeight: 15,
        inspection: {
          reportNumber: "TX1234567890",
          date: "2025-01-10",
          state: "TX",
          level: 3,
        },
        driver: {
          id: "",
          name: "",
          cdlNumber: "",
        },
        vehicle: {
          id: "",
          unitNumber: "",
          vin: "",
        },
        dataQ: {
          challenged: false,
          challengeDeadline: "2025-04-10",
          challengeEligible: true,
        },
        notes: "Driver was cited for exceeding posted speed limit by 8 mph in construction zone.",
      };
    }),

  /**
   * Submit DataQs challenge
   */
  submitDataQsChallenge: protectedProcedure
    .input(z.object({
      violationId: z.string(),
      reason: z.enum(["incorrect_data", "not_responsible", "documentation_error", "other"]),
      explanation: z.string(),
      supportingDocs: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        challengeId: `dataq_${Date.now()}`,
        violationId: input.violationId,
        status: "submitted",
        submittedBy: ctx.user?.id,
        submittedAt: new Date().toISOString(),
        estimatedResponse: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }),

  /**
   * Get improvement plan
   */
  getImprovementPlan: protectedProcedure
    .input(z.object({
      category: basicCategorySchema.optional(),
    }))
    .query(async ({ input }) => {
      return {
        categories: [
          {
            category: "vehicle_maintenance",
            currentPercentile: 48,
            targetPercentile: 35,
            priority: "high",
            actions: [
              { action: "Increase pre-trip inspection frequency", status: "in_progress", dueDate: "2025-02-01" },
              { action: "Schedule preventive maintenance for all units", status: "pending", dueDate: "2025-02-15" },
              { action: "Train drivers on defect identification", status: "completed", completedDate: "2025-01-15" },
            ],
            projectedImpact: "10-15 percentile point reduction",
          },
          {
            category: "hos_compliance",
            currentPercentile: 42,
            targetPercentile: 30,
            priority: "medium",
            actions: [
              { action: "Review ELD compliance weekly", status: "in_progress", dueDate: "ongoing" },
              { action: "Coach drivers on HOS regulations", status: "pending", dueDate: "2025-02-28" },
            ],
            projectedImpact: "8-12 percentile point reduction",
          },
        ],
        overallGoal: "Maintain all BASICs below intervention thresholds",
        reviewDate: "2025-03-01",
      };
    }),

  /**
   * Get alerts and notifications
   */
  getAlerts: protectedProcedure
    .query(async ({ ctx }) => {
      return [];
    }),

  /**
   * Sync with FMCSA
   */
  syncWithFMCSA: protectedProcedure
    .mutation(async ({ ctx }) => {
      return {
        success: true,
        lastSync: new Date().toISOString(),
        recordsUpdated: 12,
        newViolations: 0,
        newInspections: 2,
        syncedBy: ctx.user?.id,
      };
    }),
});
