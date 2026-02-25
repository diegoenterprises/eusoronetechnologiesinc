/**
 * CARRIER SCORECARD ROUTER
 * Competitive differentiator vs DAT CarrierWatch + McLeod Carrier Scorecard
 * Real-time carrier performance metrics, safety ratings, hazmat compliance scoring
 * All data from database — no stubs
 */

import { z } from "zod";
import { eq, and, desc, sql, gte, count } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { companies, loads, bids, drivers, users, vehicles, incidents, insurancePolicies } from "../../drizzle/schema";

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

        // Calculate overall score (weighted)
        const safetyScore = Math.max(0, 100 - ((incidentStats?.total || 0) * 10));
        const complianceScore = activePolicies.length >= 2 ? 100 : activePolicies.length === 1 ? 70 : 30;
        const hmspScore = company.hazmatLicense ? 100 : 0;
        const completionRate = (recentStats?.total || 0) > 0
          ? Math.round(((recentStats?.completed || 0) / (recentStats?.total || 1)) * 100) : 100;

        const overallScore = Math.round(
          onTimeRate * 0.25 +
          safetyScore * 0.25 +
          complianceScore * 0.20 +
          completionRate * 0.15 +
          bidAcceptRate * 0.10 +
          hmspScore * 0.05
        );

        return {
          carrierId: input.carrierId,
          companyName: company.name,
          legalName: company.legalName,
          dotNumber: company.dotNumber,
          mcNumber: company.mcNumber,
          overallScore,
          grade: overallScore >= 90 ? "A" : overallScore >= 80 ? "B" : overallScore >= 70 ? "C" : overallScore >= 60 ? "D" : "F",
          metrics: {
            onTimeDelivery: { rate: onTimeRate, totalDeliveries: totalDelivered, label: "On-Time Delivery" },
            safety: { score: safetyScore, totalIncidents: incidentStats?.total || 0, recentIncidents: incidentStats?.recent || 0, label: "Safety Score" },
            compliance: { score: complianceScore, activePolicies: activePolicies.length, hasExpiringSoon, label: "Insurance Compliance" },
            completionRate: { rate: completionRate, completed: recentStats?.completed || 0, cancelled: recentStats?.cancelled || 0, total: recentStats?.total || 0, period: "90 days", label: "Load Completion" },
            bidAcceptance: { rate: bidAcceptRate, totalBids: bidStats?.total || 0, accepted: bidStats?.accepted || 0, label: "Bid Acceptance" },
            hazmat: { totalLoads: hazmatStats?.total || 0, delivered: hazmatStats?.delivered || 0, hmspActive: !!company.hazmatLicense, hmspExpiry: company.hazmatExpiry, label: "Hazmat Performance" },
          },
          fleet: { vehicles: fleetCount?.count || 0, drivers: driverCount?.count || 0 },
          complianceStatus: company.complianceStatus || "unknown",
          hazmatAuthorized: !!company.hazmatLicense,
          lastUpdated: new Date().toISOString(),
        };
      } catch (e) { console.error("[CarrierScorecard] getScorecard error:", e); return null; }
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
        return results.sort((a, b) => b.overallScore - a.overallScore);
      } catch (e) { console.error("[CarrierScorecard] compareScorecards error:", e); return []; }
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
      } catch (e) { console.error("[CarrierScorecard] getTrends error:", e); return []; }
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

        return scored.sort((a, b) => b.score - a.score).slice(0, input.limit);
      } catch (e) { console.error("[CarrierScorecard] getTopCarriers error:", e); return []; }
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
      } catch (e) { console.error("[CarrierScorecard] getHazmatQualification error:", e); return null; }
    }),
});
