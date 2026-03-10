/**
 * CARRIER CAPACITY CALENDAR & FIND SIMILAR CARRIERS ROUTER (GAP-063 Task 6.2)
 */

import { z } from "zod";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { companies, loads, vehicles, drivers, incidents, insurancePolicies } from "../../drizzle/schema";
import {
  generateCapacityCalendar,
  findSimilarCarriers,
  type CarrierProfile,
  type CapacitySearchParams,
} from "../services/CarrierCapacity";
import { calculateCarrierTier, type CarrierTierInput } from "../services/CarrierTierSystem";
import { unsafeCast } from "../_core/types/unsafe";

export const carrierCapacityRouter = router({
  // 1. Get capacity calendar for a specific carrier
  getCapacityCalendar: protectedProcedure
    .input(z.object({
      carrierId: z.number(),
      startDate: z.string().optional(),
      weeks: z.number().min(1).max(12).default(4),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const [company] = await db.select().from(companies).where(eq(companies.id, input.carrierId)).limit(1);
        if (!company) return null;

        // Fleet size
        const [fleetCount] = await db.select({ count: sql<number>`count(*)` })
          .from(vehicles).where(and(eq(vehicles.companyId, input.carrierId), eq(vehicles.isActive, true)));

        // Equipment types from fleet
        const vehicleRows = await db.select({ vehicleType: vehicles.vehicleType })
          .from(vehicles).where(and(eq(vehicles.companyId, input.carrierId), eq(vehicles.isActive, true))).limit(100);
        const equipmentTypes = Array.from(new Set(vehicleRows.map((v: any) => v.vehicleType).filter(Boolean) as string[]));

        // Active loads in the date range
        const startDate = input.startDate || new Date().toISOString().split("T")[0];
        const endDate = new Date(new Date(startDate).getTime() + input.weeks * 7 * 86400000).toISOString().split("T")[0];

        const activeLoads = await db.select({
          pickupDate: loads.pickupDate,
          deliveryDate: loads.deliveryDate,
          status: loads.status,
        }).from(loads).where(and(
          eq(loads.catalystId, input.carrierId),
          sql`${loads.status} NOT IN ('cancelled', 'delivered')`,
          sql`${loads.pickupDate} <= ${endDate}`,
          sql`${loads.deliveryDate} >= ${startDate}`,
        )).limit(200);

        const existingLoads = activeLoads.map(l => ({
          pickupDate: l.pickupDate ? new Date(l.pickupDate).toISOString().split("T")[0] : startDate,
          deliveryDate: l.deliveryDate ? new Date(l.deliveryDate).toISOString().split("T")[0] : startDate,
          status: l.status || "active",
        }));

        const calendar = generateCapacityCalendar(
          input.carrierId,
          company.name,
          fleetCount?.count || 1,
          equipmentTypes.length > 0 ? equipmentTypes : ["dry_van"],
          !!company.hazmatLicense,
          existingLoads,
          startDate,
          input.weeks,
        );

        return {
          carrierId: input.carrierId,
          companyName: company.name,
          dotNumber: company.dotNumber,
          fleetSize: fleetCount?.count || 0,
          equipmentTypes,
          hazmatAuthorized: !!company.hazmatLicense,
          weeks: calendar,
        };
      } catch (e) {
        logger.error("[CarrierCapacity] getCapacityCalendar error:", e);
        return null;
      }
    }),

  // 2. Search carriers with availability on specific dates
  searchAvailableCarriers: protectedProcedure
    .input(z.object({
      dateFrom: z.string(),
      dateTo: z.string(),
      originState: z.string().optional(),
      destState: z.string().optional(),
      equipmentType: z.string().optional(),
      minTrucks: z.number().default(1),
      hazmatRequired: z.boolean().default(false),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        // Get all active carriers with DOT numbers
        const conds: any[] = [
          eq(companies.isActive, true),
          sql`${companies.dotNumber} IS NOT NULL`,
        ];
        if (input.hazmatRequired) {
          conds.push(sql`${companies.hazmatLicense} IS NOT NULL`);
        }

        const carriers = await db.select({
          id: companies.id,
          name: companies.name,
          dotNumber: companies.dotNumber,
          hazmatLicense: companies.hazmatLicense,
          createdAt: companies.createdAt,
        }).from(companies).where(and(...conds)).limit(100);

        const results = [];
        for (const carrier of carriers) {
          // Fleet size
          const [fleetCount] = await db.select({ count: sql<number>`count(*)` })
            .from(vehicles).where(and(eq(vehicles.companyId, carrier.id), eq(vehicles.isActive, true)));
          const fleet = fleetCount?.count || 1;

          // Count active loads in the date range
          const [activeLoadCount] = await db.select({ count: sql<number>`count(*)` })
            .from(loads).where(and(
              eq(loads.catalystId, carrier.id),
              sql`${loads.status} NOT IN ('cancelled', 'delivered')`,
              sql`${loads.pickupDate} <= ${input.dateTo}`,
              sql`${loads.deliveryDate} >= ${input.dateFrom}`,
            ));

          const activeLoads = activeLoadCount?.count || 0;
          const availableTrucks = Math.max(0, fleet - activeLoads);
          if (availableTrucks < input.minTrucks) continue;

          // On-time rate
          const [stats] = await db.select({
            total: sql<number>`count(*)`,
            onTime: sql<number>`SUM(CASE WHEN ${loads.actualDeliveryDate} <= ${loads.estimatedDeliveryDate} OR ${loads.actualDeliveryDate} IS NULL THEN 1 ELSE 0 END)`,
          }).from(loads).where(eq(loads.catalystId, carrier.id));
          const totalLoads = stats?.total || 0;
          const onTimeRate = totalLoads > 0 ? Math.round(((stats?.onTime || 0) / totalLoads) * 100) : 100;

          // Lane filter (if specified)
          let laneMatch = 100;
          if (input.originState || input.destState) {
            const [laneLoads] = await db.select({ count: sql<number>`count(*)` })
              .from(loads).where(and(
                eq(loads.catalystId, carrier.id),
                input.originState ? sql`JSON_EXTRACT(${loads.pickupLocation}, '$.state') = ${input.originState}` : sql`1=1`,
                input.destState ? sql`JSON_EXTRACT(${loads.deliveryLocation}, '$.state') = ${input.destState}` : sql`1=1`,
              ));
            laneMatch = (laneLoads?.count || 0) > 0 ? 100 : 30;
          }

          // Equipment type filter
          let equipMatch = 100;
          if (input.equipmentType) {
            const [eqCount] = await db.select({ count: sql<number>`count(*)` })
              .from(vehicles).where(and(
                eq(vehicles.companyId, carrier.id),
                eq(vehicles.isActive, true),
                sql`${vehicles.vehicleType} = ${input.equipmentType}`,
              ));
            equipMatch = (eqCount?.count || 0) > 0 ? 100 : 20;
          }

          const matchScore = Math.round(
            (availableTrucks / Math.max(fleet, 1)) * 30 +
            onTimeRate * 0.3 +
            laneMatch * 0.2 +
            equipMatch * 0.2
          );

          results.push({
            carrierId: carrier.id,
            companyName: carrier.name,
            dotNumber: carrier.dotNumber,
            matchScore: Math.min(100, matchScore),
            availableTrucks,
            fleetSize: fleet,
            totalLoads,
            onTimeRate,
            hazmatAuthorized: !!carrier.hazmatLicense,
          });
        }

        return results
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, input.limit);
      } catch (e) {
        logger.error("[CarrierCapacity] searchAvailableCarriers error:", e);
        return [];
      }
    }),

  // 3. Find similar carriers AI
  findSimilarCarriers: protectedProcedure
    .input(z.object({
      carrierId: z.number(),
      topK: z.number().min(1).max(20).default(10),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { reference: null, similar: [] };
      try {
        // Build reference carrier profile
        const refProfile = await buildCarrierProfile(db, input.carrierId);
        if (!refProfile) return { reference: null, similar: [] };

        // Get candidate carriers
        const candidates = await db.select({
          id: companies.id,
          name: companies.name,
          dotNumber: companies.dotNumber,
          mcNumber: companies.mcNumber,
          hazmatLicense: companies.hazmatLicense,
          complianceStatus: companies.complianceStatus,
          createdAt: companies.createdAt,
        }).from(companies).where(and(
          eq(companies.isActive, true),
          sql`${companies.dotNumber} IS NOT NULL`,
          sql`${companies.id} != ${input.carrierId}`,
        )).limit(50);

        // Build profiles for all candidates
        const candidateProfiles: CarrierProfile[] = [];
        for (const c of candidates) {
          const profile = await buildCarrierProfile(db, c.id);
          if (profile) candidateProfiles.push(profile);
        }

        const similar = findSimilarCarriers(refProfile, candidateProfiles, input.topK);

        return { reference: refProfile, similar };
      } catch (e) {
        logger.error("[CarrierCapacity] findSimilarCarriers error:", e);
        return { reference: null, similar: [] };
      }
    }),
});

// ── Helper: Build carrier profile from DB ──

async function buildCarrierProfile(db: any, carrierId: number): Promise<CarrierProfile | null> {
  const [company] = await db.select().from(companies).where(eq(companies.id, carrierId)).limit(1);
  if (!company) return null;

  // Fleet
  const [fleetCount] = await db.select({ count: sql<number>`count(*)` })
    .from(vehicles).where(and(eq(vehicles.companyId, carrierId), eq(vehicles.isActive, true)));
  const [driverCount] = await db.select({ count: sql<number>`count(*)` })
    .from(drivers).where(eq(drivers.companyId, carrierId));

  // Load stats
  const [stats] = await db.select({
    total: sql<number>`count(*)`,
    onTime: sql<number>`SUM(CASE WHEN ${loads.actualDeliveryDate} <= ${loads.estimatedDeliveryDate} OR ${loads.actualDeliveryDate} IS NULL THEN 1 ELSE 0 END)`,
    avgRate: sql<number>`AVG(${loads.rate})`,
    avgDistance: sql<number>`AVG(${loads.distance})`,
  }).from(loads).where(eq(loads.catalystId, carrierId));

  const totalLoads = stats?.total || 0;
  const onTimeRate = totalLoads > 0 ? Math.round(((stats?.onTime || 0) / totalLoads) * 100) : 100;
  const avgRate = stats?.avgRate ? parseFloat(String(stats.avgRate)) : 0;
  const avgDistance = stats?.avgDistance ? parseFloat(String(stats.avgDistance)) : 0;
  const avgRatePerMile = avgDistance > 0 && avgRate > 0 ? avgRate / avgDistance : 0;

  // Incidents → safety score
  const [incidentCount] = await db.select({ count: sql<number>`count(*)` })
    .from(incidents).where(eq(incidents.companyId, carrierId));
  const safetyScore = Math.max(0, 100 - ((incidentCount?.count || 0) * 10));

  // Top lanes
  const laneRows = await db.select({
    pickupLocation: loads.pickupLocation,
    deliveryLocation: loads.deliveryLocation,
  }).from(loads).where(eq(loads.catalystId, carrierId)).limit(500);

  const laneCounts: Record<string, number> = {};
  const stateSet = new Set<string>();
  const cargoSet = new Set<string>();

  for (const l of laneRows) {
    const p = unsafeCast(l.pickupLocation);
    const d = unsafeCast(l.deliveryLocation);
    if (p?.state && d?.state) {
      const oState = String(p.state).toUpperCase().substring(0, 2);
      const dState = String(d.state).toUpperCase().substring(0, 2);
      const lane = `${oState}→${dState}`;
      laneCounts[lane] = (laneCounts[lane] || 0) + 1;
      stateSet.add(oState);
      stateSet.add(dState);
    }
  }

  // Cargo types
  const cargoRows = await db.select({ cargoType: loads.cargoType })
    .from(loads).where(and(eq(loads.catalystId, carrierId), sql`${loads.cargoType} IS NOT NULL`)).limit(200);
  for (const r of cargoRows) {
    if (r.cargoType) cargoSet.add(r.cargoType);
  }

  const topLanes = Object.entries(laneCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([lane, count]) => ({ lane, count }));

  // Equipment types
  const vehicleRows = await db.select({ vehicleType: vehicles.vehicleType })
    .from(vehicles).where(and(eq(vehicles.companyId, carrierId), eq(vehicles.isActive, true))).limit(50);
  const equipmentTypes = Array.from(new Set(vehicleRows.map((v: any) => v.vehicleType).filter(Boolean) as string[]));

  // Tenure
  const tenureMonths = company.createdAt
    ? Math.round((Date.now() - new Date(company.createdAt).getTime()) / (30 * 86400000))
    : 0;

  // Tier
  const tierInput: CarrierTierInput = {
    carrierId,
    scorecardOverall: Math.round(onTimeRate * 0.5 + safetyScore * 0.5),
    onTimeRate,
    safetyScore,
    complianceScore: 80,
    completionRate: 90,
    avgReviewRating: 4.0,
    reviewCount: 0,
    fmcsaRiskTier: "UNKNOWN",
    fmcsaRiskScore: 0,
    tenureMonths,
    totalLoads,
    recentLoads90d: 0,
  };
  const tierResult = calculateCarrierTier(tierInput);

  return {
    carrierId,
    companyName: company.name,
    dotNumber: company.dotNumber,
    mcNumber: company.mcNumber,
    fleetSize: fleetCount?.count || 0,
    driverCount: driverCount?.count || 0,
    totalLoads,
    onTimeRate,
    safetyScore,
    avgRate,
    avgRatePerMile: Math.round(avgRatePerMile * 100) / 100,
    hazmatAuthorized: !!company.hazmatLicense,
    equipmentTypes,
    topLanes,
    operatingStates: Array.from(stateSet) as string[],
    cargoSpecializations: Array.from(cargoSet) as string[],
    tier: tierResult.tier,
    complianceStatus: company.complianceStatus || "unknown",
    tenureMonths,
  };
}
