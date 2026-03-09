/**
 * CARRIER SCORECARD ROUTER
 * Competitive differentiator vs DAT CarrierWatch + McLeod Carrier Scorecard
 * Real-time carrier performance metrics, safety ratings, hazmat compliance scoring
 * All data from database — no stubs
 */

import { z } from "zod";
import { eq, and, desc, sql, gte, count } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { companies, loads, bids, drivers, users, vehicles, incidents, insurancePolicies } from "../../drizzle/schema";
import { getCarrierSafetyIntel, batchSafetyScores, batchCrashCounts, batchOOSStatus } from "../services/fmcsaBulkLookup";

export const carrierScorecardRouter = router({
  /**
   * Get carrier scorecard — comprehensive performance metrics
   */
  getScorecard: protectedProcedure
    .input(z.object({ carrierId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const [company] = await db.select().from(companies).where(eq(companies.id, input.carrierId)).limit(1);
        if (!company) return null;

        // On-time delivery rate
        const [delivered] = await db.select({
          total: sql<number>`count(*)`,
          onTime: sql<number>`SUM(CASE WHEN ${loads.actualDeliveryDate} <= ${loads.estimatedDeliveryDate} OR ${loads.actualDeliveryDate} IS NULL THEN 1 ELSE 0 END)`,
        }).from(loads).where(eq(loads.catalystId, input.carrierId));

        const totalDelivered = delivered?.total || 0;
        const onTimeCount = delivered?.onTime || 0;
        const onTimeRate = totalDelivered > 0 ? Math.round((onTimeCount / totalDelivered) * 100) : 100;

        // Load completion stats (last 90 days)
        const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);
        const [recentStats] = await db.select({
          completed: sql<number>`SUM(CASE WHEN ${loads.status} = 'delivered' THEN 1 ELSE 0 END)`,
          cancelled: sql<number>`SUM(CASE WHEN ${loads.status} = 'cancelled' THEN 1 ELSE 0 END)`,
          total: sql<number>`count(*)`,
        }).from(loads).where(and(eq(loads.catalystId, input.carrierId), gte(loads.createdAt, ninetyDaysAgo)));

        // Hazmat load stats
        const [hazmatStats] = await db.select({
          total: sql<number>`count(*)`,
          delivered: sql<number>`SUM(CASE WHEN ${loads.status} = 'delivered' THEN 1 ELSE 0 END)`,
        }).from(loads).where(and(
          eq(loads.catalystId, input.carrierId),
          sql`${loads.hazmatClass} IS NOT NULL`,
        ));

        // Safety incidents
        const [incidentStats] = await db.select({
          total: sql<number>`count(*)`,
          recent: sql<number>`SUM(CASE WHEN ${incidents.createdAt} >= ${ninetyDaysAgo} THEN 1 ELSE 0 END)`,
        }).from(incidents).where(eq(incidents.companyId, input.carrierId));

        // Active insurance policies
        const activePolicies = await db.select({
          id: insurancePolicies.id,
          type: insurancePolicies.policyType,
          status: insurancePolicies.status,
          expirationDate: insurancePolicies.expirationDate,
        }).from(insurancePolicies).where(and(
          eq(insurancePolicies.companyId, input.carrierId),
          eq(insurancePolicies.status, "active"),
        ));

        const hasExpiringSoon = activePolicies.some(p => {
          if (!p.expirationDate) return false;
          const days = Math.ceil((new Date(p.expirationDate).getTime() - Date.now()) / 86400000);
          return days <= 30 && days > 0;
        });

        // Fleet size
        const [fleetCount] = await db.select({ count: sql<number>`count(*)` })
          .from(vehicles).where(and(eq(vehicles.companyId, input.carrierId), eq(vehicles.isActive, true)));

        // Driver count
        const [driverCount] = await db.select({ count: sql<number>`count(*)` })
          .from(drivers).where(eq(drivers.companyId, input.carrierId));

        // Bid acceptance rate
        const [bidStats] = await db.select({
          total: sql<number>`count(*)`,
          accepted: sql<number>`SUM(CASE WHEN ${bids.status} = 'accepted' THEN 1 ELSE 0 END)`,
        }).from(bids).where(eq(bids.catalystId, input.carrierId));

        const bidAcceptRate = (bidStats?.total || 0) > 0
          ? Math.round(((bidStats?.accepted || 0) / (bidStats?.total || 1)) * 100) : 0;

        // ── FMCSA Bulk Data Enrichment (9.8M+ records) ──
        const fmcsaIntel = company.dotNumber
          ? await getCarrierSafetyIntel(company.dotNumber)
          : null;

        // Calculate overall score (weighted) — now incorporates FMCSA BASIC scores
        const fmcsaSafetyScore = fmcsaIntel?.safety
          ? Math.max(0, 100 - (
              (fmcsaIntel.safety.unsafeDrivingAlert ? 15 : 0) +
              (fmcsaIntel.safety.hosAlert ? 12 : 0) +
              (fmcsaIntel.safety.vehicleMaintenanceAlert ? 10 : 0) +
              (fmcsaIntel.safety.crashIndicatorAlert ? 15 : 0) +
              (fmcsaIntel.safety.hazmatAlert ? 10 : 0) +
              (fmcsaIntel.outOfService ? 30 : 0)
            ))
          : Math.max(0, 100 - ((incidentStats?.total || 0) * 10));

        const fmcsaInsuranceCompliant = fmcsaIntel?.insurance?.isCompliant ?? (activePolicies.length >= 2);
        const complianceScore = fmcsaInsuranceCompliant ? 100 : activePolicies.length >= 1 ? 70 : 30;
        const hmspScore = (fmcsaIntel?.census?.hmFlag || company.hazmatLicense) ? 100 : 0;
        const completionRate = (recentStats?.total || 0) > 0
          ? Math.round(((recentStats?.completed || 0) / (recentStats?.total || 1)) * 100) : 100;

        const overallScore = Math.round(
          onTimeRate * 0.20 +
          fmcsaSafetyScore * 0.30 +
          complianceScore * 0.20 +
          completionRate * 0.15 +
          bidAcceptRate * 0.10 +
          hmspScore * 0.05
        );

        return {
          carrierId: input.carrierId,
          companyName: company.name,
          legalName: fmcsaIntel?.census?.legalName || company.legalName,
          dotNumber: company.dotNumber,
          mcNumber: fmcsaIntel?.authority?.docketNumber || company.mcNumber,
          overallScore,
          grade: overallScore >= 90 ? "A" : overallScore >= 80 ? "B" : overallScore >= 70 ? "C" : overallScore >= 60 ? "D" : "F",
          metrics: {
            onTimeDelivery: { rate: onTimeRate, totalDeliveries: totalDelivered, label: "On-Time Delivery" },
            safety: { score: fmcsaSafetyScore, totalIncidents: incidentStats?.total || 0, recentIncidents: incidentStats?.recent || 0, label: "Safety Score" },
            compliance: { score: complianceScore, activePolicies: activePolicies.length, hasExpiringSoon, label: "Insurance Compliance" },
            completionRate: { rate: completionRate, completed: recentStats?.completed || 0, cancelled: recentStats?.cancelled || 0, total: recentStats?.total || 0, period: "90 days", label: "Load Completion" },
            bidAcceptance: { rate: bidAcceptRate, totalBids: bidStats?.total || 0, accepted: bidStats?.accepted || 0, label: "Bid Acceptance" },
            hazmat: { totalLoads: hazmatStats?.total || 0, delivered: hazmatStats?.delivered || 0, hmspActive: !!(fmcsaIntel?.census?.hmFlag || company.hazmatLicense), hmspExpiry: company.hazmatExpiry, label: "Hazmat Performance" },
          },
          fleet: {
            vehicles: fleetCount?.count || 0,
            drivers: driverCount?.count || 0,
            fmcsaPowerUnits: fmcsaIntel?.census?.nbrPowerUnit || 0,
            fmcsaDriverTotal: fmcsaIntel?.census?.driverTotal || 0,
          },
          // ── FMCSA Intelligence (from 9.8M+ bulk records) ──
          fmcsa: fmcsaIntel ? {
            riskTier: fmcsaIntel.riskTier,
            riskScore: fmcsaIntel.riskScore,
            alerts: fmcsaIntel.alerts,
            outOfService: fmcsaIntel.outOfService,
            oosReason: fmcsaIntel.oosReason,
            authorityStatus: fmcsaIntel.authority?.authorityStatus || null,
            commonAuthActive: fmcsaIntel.authority?.commonAuthActive ?? null,
            brokerAuthActive: fmcsaIntel.authority?.brokerAuthActive ?? null,
            basics: fmcsaIntel.safety ? {
              unsafeDriving: { score: fmcsaIntel.safety.unsafeDrivingScore, alert: fmcsaIntel.safety.unsafeDrivingAlert },
              hos: { score: fmcsaIntel.safety.hosScore, alert: fmcsaIntel.safety.hosAlert },
              driverFitness: { score: fmcsaIntel.safety.driverFitnessScore, alert: fmcsaIntel.safety.driverFitnessAlert },
              vehicleMaintenance: { score: fmcsaIntel.safety.vehicleMaintenanceScore, alert: fmcsaIntel.safety.vehicleMaintenanceAlert },
              crashIndicator: { score: fmcsaIntel.safety.crashIndicatorScore, alert: fmcsaIntel.safety.crashIndicatorAlert },
              hazmat: { score: fmcsaIntel.safety.hazmatScore, alert: fmcsaIntel.safety.hazmatAlert },
            } : null,
            crashes: fmcsaIntel.crashes ? {
              total: fmcsaIntel.crashes.totalCrashes,
              fatalities: fmcsaIntel.crashes.totalFatalities,
              injuries: fmcsaIntel.crashes.totalInjuries,
              towAways: fmcsaIntel.crashes.towAways,
              hazmatReleases: fmcsaIntel.crashes.hazmatReleases,
            } : null,
            inspections: fmcsaIntel.inspections ? {
              total: fmcsaIntel.inspections.totalInspections,
              violations: fmcsaIntel.inspections.totalViolations,
              driverOos: fmcsaIntel.inspections.driverOosCount,
              vehicleOos: fmcsaIntel.inspections.vehicleOosCount,
            } : null,
            insurance: fmcsaIntel.insurance ? {
              activePolicies: fmcsaIntel.insurance.activePolicies,
              hasLiability: fmcsaIntel.insurance.hasLiability,
              hasCargo: fmcsaIntel.insurance.hasCargo,
              bipdLimit: fmcsaIntel.insurance.bipdLimit,
              isCompliant: fmcsaIntel.insurance.isCompliant,
              nearestExpiry: fmcsaIntel.insurance.nearestExpiry,
            } : null,
            census: fmcsaIntel.census ? {
              legalName: fmcsaIntel.census.legalName,
              phyState: fmcsaIntel.census.phyState,
              powerUnits: fmcsaIntel.census.nbrPowerUnit,
              driverTotal: fmcsaIntel.census.driverTotal,
              hazmat: fmcsaIntel.census.hmFlag,
              carrierOperation: fmcsaIntel.census.carrierOperation,
              mcs150Mileage: fmcsaIntel.census.mcs150Mileage,
            } : null,
          } : null,
          complianceStatus: company.complianceStatus || "unknown",
          hazmatAuthorized: !!(fmcsaIntel?.census?.hmFlag || company.hazmatLicense),
          lastUpdated: new Date().toISOString(),
        };
      } catch (e) { logger.error("[CarrierScorecard] getScorecard error:", e); return null; }
    }),

  /**
   * Get scorecard summary for multiple carriers (e.g. for bid comparison)
   */
  compareScorecards: protectedProcedure
    .input(z.object({ carrierIds: z.array(z.number()).min(1).max(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const results = [];
        for (const cid of input.carrierIds) {
          const [company] = await db.select({
            id: companies.id,
            name: companies.name,
            dotNumber: companies.dotNumber,
            mcNumber: companies.mcNumber,
            complianceStatus: companies.complianceStatus,
            hazmatLicense: companies.hazmatLicense,
          }).from(companies).where(eq(companies.id, cid)).limit(1);
          if (!company) continue;

          const [stats] = await db.select({
            total: sql<number>`count(*)`,
            delivered: sql<number>`SUM(CASE WHEN ${loads.status} = 'delivered' THEN 1 ELSE 0 END)`,
            onTime: sql<number>`SUM(CASE WHEN ${loads.actualDeliveryDate} <= ${loads.estimatedDeliveryDate} OR ${loads.actualDeliveryDate} IS NULL THEN 1 ELSE 0 END)`,
          }).from(loads).where(eq(loads.catalystId, cid));

          const [incidentCount] = await db.select({ count: sql<number>`count(*)` })
            .from(incidents).where(eq(incidents.companyId, cid));

          const totalLoads = stats?.total || 0;
          const onTimeRate = totalLoads > 0 ? Math.round(((stats?.onTime || 0) / totalLoads) * 100) : 100;
          const safetyScore = Math.max(0, 100 - ((incidentCount?.count || 0) * 10));
          const overallScore = Math.round(onTimeRate * 0.5 + safetyScore * 0.5);

          results.push({
            carrierId: cid,
            companyName: company.name,
            dotNumber: company.dotNumber,
            mcNumber: company.mcNumber,
            overallScore,
            grade: overallScore >= 90 ? "A" : overallScore >= 80 ? "B" : overallScore >= 70 ? "C" : overallScore >= 60 ? "D" : "F",
            onTimeRate,
            safetyScore,
            totalLoads,
            incidents: incidentCount?.count || 0,
            hazmatAuthorized: !!company.hazmatLicense,
            complianceStatus: company.complianceStatus || "unknown",
          });
        }

        // ── Enrich comparisons with FMCSA bulk data (batch query) ──
        const dotNumbers = results.map(r => r.dotNumber).filter(Boolean) as string[];
        if (dotNumbers.length > 0) {
          const [safetyMap, crashMap, oosMap] = await Promise.all([
            batchSafetyScores(dotNumbers),
            batchCrashCounts(dotNumbers),
            batchOOSStatus(dotNumbers),
          ]);
          for (const r of results) {
            const dot = r.dotNumber;
            if (!dot) continue;
            const sms = safetyMap.get(dot);
            const crash = crashMap.get(dot);
            const oos = oosMap.get(dot);
            (r as any).fmcsa = {
              basics: sms ? {
                unsafeDriving: { score: sms.unsafeDrivingScore, alert: sms.unsafeDrivingAlert },
                hos: { score: sms.hosScore, alert: sms.hosAlert },
                vehicleMaintenance: { score: sms.vehicleMaintenanceScore, alert: sms.vehicleMaintenanceAlert },
                crashIndicator: { score: sms.crashIndicatorScore, alert: sms.crashIndicatorAlert },
              } : null,
              crashes: crash ? { total: crash.total, fatalities: crash.fatalities } : null,
              outOfService: oos || false,
              alertCount: (sms ? [sms.unsafeDrivingAlert, sms.hosAlert, sms.vehicleMaintenanceAlert, sms.crashIndicatorAlert].filter(Boolean).length : 0),
            };
          }
        }

        return results.sort((a, b) => b.overallScore - a.overallScore);
      } catch (e) { logger.error("[CarrierScorecard] compareScorecards error:", e); return []; }
    }),

  /**
   * Get carrier performance trends over time
   */
  getTrends: protectedProcedure
    .input(z.object({ carrierId: z.number(), months: z.number().default(6) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const rows = await db.select({
          month: sql<string>`DATE_FORMAT(${loads.createdAt}, '%Y-%m')`,
          total: sql<number>`count(*)`,
          delivered: sql<number>`SUM(CASE WHEN ${loads.status} = 'delivered' THEN 1 ELSE 0 END)`,
          onTime: sql<number>`SUM(CASE WHEN ${loads.actualDeliveryDate} <= ${loads.estimatedDeliveryDate} OR ${loads.actualDeliveryDate} IS NULL THEN 1 ELSE 0 END)`,
          revenue: sql<number>`COALESCE(SUM(CAST(${loads.rate} AS DECIMAL)), 0)`,
          hazmatLoads: sql<number>`SUM(CASE WHEN ${loads.hazmatClass} IS NOT NULL THEN 1 ELSE 0 END)`,
        }).from(loads)
          .where(eq(loads.catalystId, input.carrierId))
          .groupBy(sql`DATE_FORMAT(${loads.createdAt}, '%Y-%m')`)
          .orderBy(sql`DATE_FORMAT(${loads.createdAt}, '%Y-%m') DESC`)
          .limit(input.months);

        return rows.reverse().map(r => ({
          period: r.month,
          totalLoads: r.total || 0,
          delivered: r.delivered || 0,
          onTimeRate: (r.total || 0) > 0 ? Math.round(((r.onTime || 0) / (r.total || 1)) * 100) : 100,
          revenue: Math.round(r.revenue || 0),
          hazmatLoads: r.hazmatLoads || 0,
        }));
      } catch (e) { logger.error("[CarrierScorecard] getTrends error:", e); return []; }
    }),

  /**
   * Get top-rated carriers (for shipper/broker load matching)
   */
  getTopCarriers: protectedProcedure
    .input(z.object({
      limit: z.number().default(10),
      hazmatOnly: z.boolean().default(false),
      minScore: z.number().default(70),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const conds: any[] = [eq(companies.isActive, true)];
        if (input.hazmatOnly) {
          conds.push(sql`${companies.hazmatLicense} IS NOT NULL`);
        }

        const carriers = await db.select({
          id: companies.id,
          name: companies.name,
          dotNumber: companies.dotNumber,
          mcNumber: companies.mcNumber,
          hazmatLicense: companies.hazmatLicense,
          complianceStatus: companies.complianceStatus,
        }).from(companies).where(and(...conds)).limit(50);

        const scored = [];
        for (const c of carriers) {
          const [stats] = await db.select({
            total: sql<number>`count(*)`,
            onTime: sql<number>`SUM(CASE WHEN ${loads.actualDeliveryDate} <= ${loads.estimatedDeliveryDate} OR ${loads.actualDeliveryDate} IS NULL THEN 1 ELSE 0 END)`,
          }).from(loads).where(eq(loads.catalystId, c.id));

          const totalLoads = stats?.total || 0;
          if (totalLoads === 0) continue;
          const onTimeRate = Math.round(((stats?.onTime || 0) / totalLoads) * 100);
          if (onTimeRate < input.minScore) continue;

          scored.push({
            carrierId: c.id,
            companyName: c.name,
            dotNumber: c.dotNumber,
            mcNumber: c.mcNumber,
            score: onTimeRate,
            grade: onTimeRate >= 90 ? "A" : onTimeRate >= 80 ? "B" : onTimeRate >= 70 ? "C" : "D",
            totalLoads,
            hazmatAuthorized: !!c.hazmatLicense,
            complianceStatus: c.complianceStatus || "unknown",
          });
        }

        // ── Enrich top carriers with FMCSA bulk safety data ──
        const topDots = scored.map(s => s.dotNumber).filter(Boolean) as string[];
        if (topDots.length > 0) {
          const [safetyMap, oosMap] = await Promise.all([
            batchSafetyScores(topDots),
            batchOOSStatus(topDots),
          ]);
          for (const s of scored) {
            if (!s.dotNumber) continue;
            const sms = safetyMap.get(s.dotNumber);
            const oos = oosMap.get(s.dotNumber);
            (s as any).fmcsa = {
              unsafeDrivingAlert: sms?.unsafeDrivingAlert || false,
              hosAlert: sms?.hosAlert || false,
              vehicleMaintenanceAlert: sms?.vehicleMaintenanceAlert || false,
              crashIndicatorAlert: sms?.crashIndicatorAlert || false,
              outOfService: oos || false,
              inspectionsTotal: sms?.inspectionsTotal || 0,
            };
            // Penalize carriers with FMCSA alerts
            if (oos) s.score = Math.max(0, s.score - 30);
            if (sms?.unsafeDrivingAlert) s.score = Math.max(0, s.score - 10);
            if (sms?.crashIndicatorAlert) s.score = Math.max(0, s.score - 10);
            s.grade = s.score >= 90 ? "A" : s.score >= 80 ? "B" : s.score >= 70 ? "C" : "D";
          }
        }

        return scored.sort((a, b) => b.score - a.score).slice(0, input.limit);
      } catch (e) { logger.error("[CarrierScorecard] getTopCarriers error:", e); return []; }
    }),

  /**
   * Get carrier hazmat qualification summary
   */
  getHazmatQualification: protectedProcedure
    .input(z.object({ carrierId: z.number(), hazmatClass: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const [company] = await db.select().from(companies).where(eq(companies.id, input.carrierId)).limit(1);
        if (!company) return null;

        // Check HMSP permit
        const hmspValid = !!company.hazmatLicense;
        let hmspDaysRemaining = 0;
        if (company.hazmatExpiry) {
          hmspDaysRemaining = Math.ceil((new Date(company.hazmatExpiry).getTime() - Date.now()) / 86400000);
        }

        // Check hazmat-endorsed drivers (join with users for name)
        const hazmatDrivers = await db.select({
          id: drivers.id,
          name: users.name,
          hazmatEndorsement: drivers.hazmatEndorsement,
          hazmatExpiry: drivers.hazmatExpiry,
          twicExpiry: drivers.twicExpiry,
        }).from(drivers)
          .innerJoin(users, eq(drivers.userId, users.id))
          .where(and(
            eq(drivers.companyId, input.carrierId),
            eq(drivers.hazmatEndorsement, true),
          ));

        // Check hazmat-compatible vehicles
        const hazmatVehicles = await db.select({
          id: vehicles.id,
          type: vehicles.vehicleType,
          status: vehicles.status,
          vin: vehicles.vin,
        }).from(vehicles).where(and(
          eq(vehicles.companyId, input.carrierId),
          eq(vehicles.isActive, true),
          sql`${vehicles.vehicleType} IN ('tanker', 'flatbed', 'dry_van')`,
        ));

        // Hazmat load history
        const [hazmatHistory] = await db.select({
          total: sql<number>`count(*)`,
          delivered: sql<number>`SUM(CASE WHEN ${loads.status} = 'delivered' THEN 1 ELSE 0 END)`,
          classes: sql<string>`GROUP_CONCAT(DISTINCT ${loads.hazmatClass})`,
        }).from(loads).where(and(
          eq(loads.catalystId, input.carrierId),
          sql`${loads.hazmatClass} IS NOT NULL`,
        ));

        // Active insurance for hazmat
        const hazmatInsurance = await db.select({
          type: insurancePolicies.policyType,
          status: insurancePolicies.status,
          expirationDate: insurancePolicies.expirationDate,
        }).from(insurancePolicies).where(and(
          eq(insurancePolicies.companyId, input.carrierId),
          eq(insurancePolicies.status, "active"),
        ));

        const qualifiedClasses = hazmatHistory?.classes ? hazmatHistory.classes.split(",").filter(Boolean) : [];

        return {
          carrierId: input.carrierId,
          companyName: company.name,
          qualified: hmspValid && hazmatDrivers.length > 0 && hazmatInsurance.length > 0,
          hmsp: {
            active: hmspValid,
            licenseNumber: company.hazmatLicense,
            daysRemaining: hmspDaysRemaining,
            expiry: company.hazmatExpiry,
          },
          drivers: {
            total: hazmatDrivers.length,
            list: hazmatDrivers.map(d => ({
              id: d.id,
              name: d.name,
              hazmatExpiry: d.hazmatExpiry,
              twicExpiry: d.twicExpiry,
              daysRemaining: d.hazmatExpiry ? Math.ceil((new Date(d.hazmatExpiry).getTime() - Date.now()) / 86400000) : 0,
            })),
          },
          vehicles: {
            total: hazmatVehicles.length,
            list: hazmatVehicles.map(v => ({ id: v.id, type: v.type, status: v.status, vin: v.vin })),
          },
          insurance: {
            policies: hazmatInsurance.length,
            types: hazmatInsurance.map(p => p.type),
          },
          history: {
            totalHazmatLoads: hazmatHistory?.total || 0,
            deliveredHazmatLoads: hazmatHistory?.delivered || 0,
            classesHandled: qualifiedClasses,
          },
        };
      } catch (e) { logger.error("[CarrierScorecard] getHazmatQualification error:", e); return null; }
    }),
});
