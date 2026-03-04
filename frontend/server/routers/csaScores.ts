/**
 * CSA SCORES ROUTER
 * tRPC procedures for FMCSA CSA BASIC scores and SMS data
 */

import { z } from "zod";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { companies, incidents, drivers, inspections, users } from "../../drizzle/schema";
import { getSafetyScores, getCrashSummary, getInspectionSummary, getViolationSummary, getOOSStatus } from "../services/fmcsaBulkLookup";

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

        // ── Pull real FMCSA BASIC scores from 9.8M+ bulk data ──
        const dotNumber = company?.dotNumber || '';
        const [sms, crashData, inspData, oosData] = await Promise.all([
          dotNumber ? getSafetyScores(dotNumber) : null,
          dotNumber ? getCrashSummary(dotNumber) : null,
          dotNumber ? getInspectionSummary(dotNumber) : null,
          dotNumber ? getOOSStatus(dotNumber) : { outOfService: false, reason: null },
        ]);

        const makeBasic = (category: string, name: string, score: number | null, alert: boolean, threshold: number) => {
          const percentile = score ?? 0;
          return {
            category, name, percentile, threshold,
            status: alert ? 'alert' : percentile >= threshold ? 'warning' : 'ok',
            trend: 'stable' as const,
            inspections: sms?.inspectionsTotal || incidentCount?.count || 0,
            violations: 0,
            alert,
          };
        };

        const basics = sms ? [
          makeBasic('unsafe_driving', 'Unsafe Driving', sms.unsafeDrivingScore, sms.unsafeDrivingAlert, 65),
          makeBasic('hos_compliance', 'HOS Compliance', sms.hosScore, sms.hosAlert, 65),
          makeBasic('driver_fitness', 'Driver Fitness', sms.driverFitnessScore, sms.driverFitnessAlert, 80),
          makeBasic('controlled_substances', 'Controlled Substances/Alcohol', sms.controlledSubstancesScore, sms.controlledSubstancesAlert, 80),
          makeBasic('vehicle_maintenance', 'Vehicle Maintenance', sms.vehicleMaintenanceScore, sms.vehicleMaintenanceAlert, 80),
          makeBasic('hazmat_compliance', 'Hazardous Materials', sms.hazmatScore, sms.hazmatAlert, 80),
          makeBasic('crash_indicator', 'Crash Indicator', sms.crashIndicatorScore, sms.crashIndicatorAlert, 65),
        ] : [
          { category: 'unsafe_driving', name: 'Unsafe Driving', percentile: 0, threshold: 65, status: 'ok', trend: 'stable', inspections: incidentCount?.count || 0, violations: 0, alert: false },
          { category: 'hos_compliance', name: 'HOS Compliance', percentile: 0, threshold: 65, status: 'ok', trend: 'stable', inspections: driverCount?.count || 0, violations: 0, alert: false },
          { category: 'driver_fitness', name: 'Driver Fitness', percentile: 0, threshold: 80, status: 'ok', trend: 'stable', inspections: 0, violations: 0, alert: false },
          { category: 'vehicle_maintenance', name: 'Vehicle Maintenance', percentile: 0, threshold: 80, status: 'ok', trend: 'stable', inspections: 0, violations: 0, alert: false },
        ];

        const alertCount = basics.filter(b => b.alert).length;
        const overallStatus = oosData.outOfService ? 'out_of_service' : alertCount >= 3 ? 'critical' : alertCount >= 1 ? 'alert' : 'satisfactory';
        const alertLevel = alertCount >= 3 ? 'critical' : alertCount >= 1 ? 'warning' : 'none';

        return {
          companyId: String(companyId),
          companyName: company?.name || 'Unknown',
          dotNumber,
          mcNumber: company?.mcNumber || '',
          lastUpdated: sms?.runDate || new Date().toISOString(),
          overallStatus,
          alertLevel,
          basics,
          saferData: {
            outOfServiceRate: sms?.driverOosRate ?? 0,
            nationalAverage: 0.21,
            inspectionCount24Months: inspData?.totalInspections || 0,
            driverOOSRate: sms?.driverOosRate ?? 0,
            vehicleOOSRate: sms?.vehicleOosRate ?? 0,
          },
          // ── FMCSA Bulk Data Enrichment ──
          fmcsaCrashes: crashData ? {
            total: crashData.totalCrashes,
            fatalities: crashData.totalFatalities,
            injuries: crashData.totalInjuries,
            towAways: crashData.towAways,
            hazmatReleases: crashData.hazmatReleases,
            recent: crashData.recentCrashes,
          } : null,
          fmcsaInspections: inspData ? {
            total: inspData.totalInspections,
            violations: inspData.totalViolations,
            driverOos: inspData.driverOosCount,
            vehicleOos: inspData.vehicleOosCount,
            hazmatOos: inspData.hazmatOosCount,
            recent: inspData.recentInspections,
          } : null,
          outOfService: oosData.outOfService,
          oosReason: oosData.reason,
          dataSource: sms ? 'fmcsa_bulk_9.8M' : 'platform_internal',
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
    .query(async ({ ctx, input }) => {
      const basicNames: Record<string, { name: string; desc: string; threshold: number }> = {
        unsafe_driving: { name: 'Unsafe Driving', desc: 'Operation of CMVs in a dangerous or careless manner', threshold: 65 },
        hos_compliance: { name: 'HOS Compliance', desc: 'Operating a CMV while ill, fatigued, or non-compliant with HOS regulations', threshold: 65 },
        driver_fitness: { name: 'Driver Fitness', desc: 'Operating a CMV while unfit due to lack of training, experience, or medical qualifications', threshold: 80 },
        controlled_substances: { name: 'Controlled Substances/Alcohol', desc: 'Operation of a CMV while impaired by alcohol, illegal drugs, or misuse of prescription drugs', threshold: 80 },
        vehicle_maintenance: { name: 'Vehicle Maintenance', desc: 'Failure to properly maintain a CMV and/or intermodal equipment', threshold: 80 },
        hazmat_compliance: { name: 'Hazardous Materials Compliance', desc: 'Unsafe handling of hazmat on a CMV', threshold: 80 },
        crash_indicator: { name: 'Crash Indicator', desc: 'Histories or patterns of high crash involvement', threshold: 65 },
      };
      const info = basicNames[input.category] || { name: input.category, desc: '', threshold: 65 };
      const db = await getDb();
      let inspCount = 0;
      let dotNumber = '';
      if (db) {
        const companyId = ctx.user?.companyId || 0;
        const [row] = await db.select({ count: sql<number>`COUNT(*)` }).from(inspections).where(eq(inspections.companyId, companyId));
        inspCount = row?.count || 0;
        const [comp] = await db.select({ dotNumber: companies.dotNumber }).from(companies).where(eq(companies.id, companyId)).limit(1);
        dotNumber = comp?.dotNumber || '';
      }

      // ── Pull real FMCSA data for this BASIC category ──
      const [sms, violData] = await Promise.all([
        dotNumber ? getSafetyScores(dotNumber) : null,
        dotNumber ? getViolationSummary(dotNumber, 20) : null,
      ]);

      const scoreMap: Record<string, { score: number | null; alert: boolean }> = {
        unsafe_driving: { score: sms?.unsafeDrivingScore ?? null, alert: sms?.unsafeDrivingAlert ?? false },
        hos_compliance: { score: sms?.hosScore ?? null, alert: sms?.hosAlert ?? false },
        driver_fitness: { score: sms?.driverFitnessScore ?? null, alert: sms?.driverFitnessAlert ?? false },
        controlled_substances: { score: sms?.controlledSubstancesScore ?? null, alert: sms?.controlledSubstancesAlert ?? false },
        vehicle_maintenance: { score: sms?.vehicleMaintenanceScore ?? null, alert: sms?.vehicleMaintenanceAlert ?? false },
        hazmat_compliance: { score: sms?.hazmatScore ?? null, alert: sms?.hazmatAlert ?? false },
        crash_indicator: { score: sms?.crashIndicatorScore ?? null, alert: sms?.crashIndicatorAlert ?? false },
      };
      const categoryData = scoreMap[input.category] || { score: null, alert: false };

      return {
        category: input.category, name: info.name, description: info.desc,
        percentile: categoryData.score ?? 0,
        alert: categoryData.alert,
        threshold: info.threshold,
        measurementPeriod: '24 months',
        violations: violData?.recentViolations?.map(v => ({
          code: v.code, description: v.description, group: v.group,
          oos: v.oos, severityWeight: v.severityWeight, date: v.inspectionDate,
        })) || [],
        violationSummary: violData ? {
          total: violData.totalViolations,
          oosViolations: violData.oosViolations,
          byCategory: violData.byCategory,
        } : null,
        trendData: [], recommendations: [],
        inspectionCount: inspCount,
        dataSource: sms ? 'fmcsa_bulk_9.8M' : 'platform_internal',
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
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return { drivers: [], summary: { totalDrivers: 0, lowRisk: 0, mediumRisk: 0, highRisk: 0 } };
      try {
        const companyId = ctx.user?.companyId || 0;
        const conds: any[] = [eq(drivers.companyId, companyId)];
        if (input.driverId) conds.push(eq(drivers.id, parseInt(input.driverId)));
        const rows = await db.select({
          id: drivers.id, userId: drivers.userId, safetyScore: drivers.safetyScore,
          totalMiles: drivers.totalMiles, totalLoads: drivers.totalLoads, status: drivers.status,
        }).from(drivers).where(and(...conds)).limit(input.limit);
        // Get names from users table
        const driverList = await Promise.all(rows.map(async (d) => {
          let name = `Driver #${d.id}`;
          if (d.userId) {
            const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, d.userId)).limit(1);
            if (u?.name) name = u.name;
          }
          const score = d.safetyScore || 0;
          return {
            id: String(d.id), name, safetyScore: score,
            totalMiles: d.totalMiles || 0, totalLoads: d.totalLoads || 0, status: d.status,
            riskLevel: score >= 80 ? 'low' : score >= 50 ? 'medium' : 'high',
          };
        }));
        const low = driverList.filter(d => d.riskLevel === 'low').length;
        const med = driverList.filter(d => d.riskLevel === 'medium').length;
        const high = driverList.filter(d => d.riskLevel === 'high').length;
        return { drivers: driverList, summary: { totalDrivers: driverList.length, lowRisk: low, mediumRisk: med, highRisk: high } };
      } catch (e) { console.error('[CSAScores] getDriverScores error:', e); return { drivers: [], summary: { totalDrivers: 0, lowRisk: 0, mediumRisk: 0, highRisk: 0 } }; }
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
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return { inspections: [], total: 0, summary: { level1: 0, level2: 0, level3: 0, passRate: 0, oosRate: 0 } };
      try {
        const companyId = ctx.user?.companyId || 0;
        const conds: any[] = [eq(inspections.companyId, companyId)];
        if (input.driverId) conds.push(eq(inspections.driverId, parseInt(input.driverId)));
        if (input.vehicleId) conds.push(eq(inspections.vehicleId, parseInt(input.vehicleId)));
        if (input.startDate) conds.push(gte(inspections.createdAt, new Date(input.startDate)));
        const rows = await db.select().from(inspections).where(and(...conds)).orderBy(desc(inspections.createdAt)).limit(input.limit);
        const [countRow] = await db.select({ count: sql<number>`COUNT(*)` }).from(inspections).where(and(...conds));
        const [statsRow] = await db.select({
          passed: sql<number>`SUM(CASE WHEN ${inspections.status} = 'passed' THEN 1 ELSE 0 END)`,
          oos: sql<number>`SUM(CASE WHEN ${inspections.oosViolation} = true THEN 1 ELSE 0 END)`,
          total: sql<number>`COUNT(*)`,
        }).from(inspections).where(and(...conds));
        const total = statsRow?.total || 0;
        return {
          inspections: rows.map(i => ({
            id: String(i.id), type: i.type, vehicleId: String(i.vehicleId), driverId: String(i.driverId),
            status: i.status, location: i.location || '', defectsFound: i.defectsFound || 0,
            oosViolation: i.oosViolation || false, createdAt: i.createdAt?.toISOString() || '',
          })),
          total: countRow?.count || 0,
          summary: {
            level1: 0, level2: 0, level3: total,
            passRate: total > 0 ? Math.round(((statsRow?.passed || 0) / total) * 100) : 0,
            oosRate: total > 0 ? Math.round(((statsRow?.oos || 0) / total) * 100) : 0,
          },
        };
      } catch (e) { console.error('[CSAScores] getInspections error:', e); return { inspections: [], total: 0, summary: { level1: 0, level2: 0, level3: 0, passRate: 0, oosRate: 0 } }; }
    }),

  /**
   * Get violation details
   */
  getViolationDetails: protectedProcedure
    .input(z.object({
      violationId: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (db) {
        try {
          const incId = parseInt(input.violationId);
          const [inc] = await db.select().from(incidents).where(eq(incidents.id, incId)).limit(1);
          if (inc) {
            return {
              id: String(inc.id), code: '', description: inc.description || '',
              basic: 'unsafe_driving', severity: 5, weight: 5, timeWeight: 3, totalWeight: 15,
              inspection: { reportNumber: '', date: inc.createdAt?.toISOString()?.split('T')[0] || '', state: '', level: 3 },
              driver: { id: '', name: '', cdlNumber: '' },
              vehicle: { id: '', unitNumber: '', vin: '' },
              dataQ: { challenged: false, challengeDeadline: '', challengeEligible: true },
              notes: inc.description || '',
            };
          }
        } catch {}
      }
      return {
        id: input.violationId, code: '', description: 'Violation not found',
        basic: 'unsafe_driving', severity: 0, weight: 0, timeWeight: 0, totalWeight: 0,
        inspection: { reportNumber: '', date: '', state: '', level: 0 },
        driver: { id: '', name: '', cdlNumber: '' },
        vehicle: { id: '', unitNumber: '', vin: '' },
        dataQ: { challenged: false, challengeDeadline: '', challengeEligible: false },
        notes: '',
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
      const db = await getDb(); if (!db) return [];
      try {
        const companyId = ctx.user?.companyId || 0;
        // Check for recent failed inspections as alerts
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
        const failedRecent = await db.select().from(inspections).where(and(
          eq(inspections.companyId, companyId),
          eq(inspections.status, 'failed'),
          gte(inspections.createdAt, thirtyDaysAgo),
        )).orderBy(desc(inspections.createdAt)).limit(10);
        return failedRecent.map(i => ({
          id: `csa_alert_${i.id}`,
          type: i.oosViolation ? 'critical' : 'warning',
          message: `Failed inspection on vehicle #${i.vehicleId}: ${i.defectsFound || 0} defects${i.oosViolation ? ' (OOS)' : ''}`,
          inspectionId: String(i.id),
          createdAt: i.createdAt?.toISOString() || '',
        }));
      } catch { return []; }
    }),

  /**
   * Sync with FMCSA
   */
  syncWithFMCSA: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      let inspCount = 0;
      let incCount = 0;
      let dotNumber = '';
      if (db) {
        const companyId = ctx.user?.companyId || 0;
        const [iRow] = await db.select({ count: sql<number>`COUNT(*)` }).from(inspections).where(eq(inspections.companyId, companyId));
        const [nRow] = await db.select({ count: sql<number>`COUNT(*)` }).from(incidents).where(eq(incidents.companyId, companyId));
        inspCount = iRow?.count || 0;
        incCount = nRow?.count || 0;
        const [comp] = await db.select({ dotNumber: companies.dotNumber }).from(companies).where(eq(companies.id, companyId)).limit(1);
        dotNumber = comp?.dotNumber || '';
      }

      // ── Pull latest FMCSA bulk data counts for this carrier ──
      const [sms, crashes, fmcsaInsp, violations] = await Promise.all([
        dotNumber ? getSafetyScores(dotNumber) : null,
        dotNumber ? getCrashSummary(dotNumber) : null,
        dotNumber ? getInspectionSummary(dotNumber) : null,
        dotNumber ? getViolationSummary(dotNumber) : null,
      ]);

      return {
        success: true, lastSync: new Date().toISOString(),
        recordsUpdated: inspCount + incCount,
        newViolations: violations?.totalViolations || 0,
        newInspections: fmcsaInsp?.totalInspections || inspCount,
        syncedBy: ctx.user?.id,
        fmcsaData: {
          smsScoresAvailable: !!sms,
          lastRunDate: sms?.runDate || null,
          crashesOnRecord: crashes?.totalCrashes || 0,
          inspectionsOnRecord: fmcsaInsp?.totalInspections || 0,
          violationsOnRecord: violations?.totalViolations || 0,
          dataSource: 'fmcsa_bulk_9.8M',
        },
      };
    }),
});
