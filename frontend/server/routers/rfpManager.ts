/**
 * RFP CREATION & DISTRIBUTION ROUTER (GAP-062)
 * 100% Dynamic — All queries use real DB tables.
 */

import { z } from "zod";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import {
  companies, rfps, rfpLanes, rfpBids, rfpLaneBids, rfpAwards,
} from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { scoreBidResponse, type RFPDefinition, type CarrierBidResponse } from "../services/RFPEngine";
import { unsafeCast } from "../_core/types/unsafe";

// ── Helpers ──

async function loadRFPWithLanes(db: any, rfpId: number, companyName: string) {
  const [rfp] = await db.select().from(rfps).where(eq(rfps.id, rfpId)).limit(1);
  if (!rfp) return null;

  const lanes = await db.select().from(rfpLanes).where(eq(rfpLanes.rfpId, rfpId));

  return {
    id: `RFP-${rfp.id}`,
    title: rfp.title,
    description: rfp.description || "",
    status: rfp.status || "draft",
    shipperId: rfp.companyId,
    shipperName: companyName,
    createdAt: new Date(rfp.createdAt).toISOString(),
    publishedAt: rfp.publishedAt ? new Date(rfp.publishedAt).toISOString() : null,
    responseDeadline: rfp.responseDeadline ? new Date(rfp.responseDeadline).toISOString() : "",
    awardDate: rfp.awardDate ? new Date(rfp.awardDate).toISOString() : null,
    contractStartDate: rfp.contractStartDate || "",
    contractEndDate: rfp.contractEndDate || "",
    lanes: lanes.map((l: any) => ({
      id: `LANE-${l.id}`,
      origin: { city: l.originCity, state: l.originState },
      destination: { city: l.destinationCity, state: l.destinationState },
      estimatedDistance: l.estimatedDistance || 0,
      annualVolume: l.annualVolume || 0,
      volumeUnit: l.volumeUnit || "loads",
      equipmentRequired: l.equipmentRequired || "dry_van",
      hazmat: !!l.hazmat,
      temperatureControlled: !!l.temperatureControlled,
      targetRate: l.targetRate ? Number(l.targetRate) : null,
      rateType: l.rateType || "flat",
      frequencyPerWeek: l.frequencyPerWeek || 1,
      specialRequirements: l.specialRequirements || [],
    })),
    carrierRequirements: rfp.carrierRequirements || {
      minSafetyScore: 70, minOnTimeRate: 85, requiredInsurance: 1000000,
      hazmatCertRequired: false, minFleetSize: 5, preferredTiers: ["Gold", "Silver"],
    },
    scoringWeights: rfp.scoringWeights || {
      rate: 35, serviceLevel: 25, safety: 20, capacity: 10, experience: 10,
    },
    distributedTo: rfp.distributedTo || 0,
    responsesReceived: rfp.responsesReceived || 0,
    notes: rfp.notes || "",
  } as RFPDefinition;
}

async function loadBidsForRFP(db: any, rfpId: number) {
  const bids = await db.select().from(rfpBids).where(eq(rfpBids.rfpId, rfpId));
  if (bids.length === 0) return [];

  // Get carrier names
  const carrierIds = bids.map((b: any) => b.carrierId);
  const carrierRows = await db
    .select({ id: companies.id, name: companies.name })
    .from(companies)
    .where(sql`${companies.id} IN (${sql.join(carrierIds.map((id: number) => sql`${id}`), sql`, `)})`);
  const carrierMap = new Map(carrierRows.map((c: any) => [c.id, c.name]));

  // Get lane bids for all bids
  const bidIds = bids.map((b: any) => b.id);
  const laneBidRows = await db
    .select()
    .from(rfpLaneBids)
    .where(sql`${rfpLaneBids.bidId} IN (${sql.join(bidIds.map((id: number) => sql`${id}`), sql`, `)})`);

  return bids.map((b: any) => ({
    id: `BID-RFP-${rfpId}-${b.carrierId}`,
    rfpId: `RFP-${rfpId}`,
    carrierId: b.carrierId,
    carrierName: carrierMap.get(b.carrierId) || `Carrier #${b.carrierId}`,
    carrierTier: b.carrierTier || "Standard",
    submittedAt: b.submittedAt ? new Date(b.submittedAt).toISOString() : new Date(b.createdAt).toISOString(),
    status: b.status || "pending",
    laneBids: laneBidRows
      .filter((lb: any) => lb.bidId === b.id)
      .map((lb: any) => ({
        laneId: `LANE-${lb.laneId}`,
        bidRate: Number(lb.bidRate),
        rateType: lb.rateType || "flat",
        transitDays: lb.transitDays || 1,
        capacityPerWeek: lb.capacityPerWeek || 1,
        equipmentOffered: lb.equipmentOffered || "",
        notes: lb.notes || "",
      })),
    overallScore: b.overallScore ? Number(b.overallScore) : null,
    safetyScore: Number(b.safetyScore) || 0,
    onTimeRate: Number(b.onTimeRate) || 0,
    insuranceCoverage: Number(b.insuranceCoverage) || 0,
    fleetSize: b.fleetSize || 0,
  } as CarrierBidResponse));
}

export const rfpManagerRouter = router({
  getRFPs: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    try {
      const companyId = Number(ctx.user?.companyId || ctx.user?.id) || 0;
      const [co] = await db.select({ name: companies.name }).from(companies).where(eq(companies.id, companyId)).limit(1);
      const companyName = co?.name || "My Company";

      const rfpRows = await db
        .select()
        .from(rfps)
        .where(eq(rfps.companyId, companyId))
        .orderBy(desc(rfps.createdAt))
        .limit(50);

      const results = [];
      for (const rfp of rfpRows) {
        const full = await loadRFPWithLanes(db, rfp.id, companyName);
        if (full) results.push(full);
      }
      return results;
    } catch (e) {
      logger.error("[RFP] getRFPs error:", e);
      return [];
    }
  }),

  getRFPDetail: protectedProcedure
    .input(z.object({ rfpId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const numericId = parseInt(input.rfpId.replace(/\D/g, ""), 10) || 0;
        const companyId = Number(ctx.user?.companyId || ctx.user?.id) || 0;
        const [co] = await db.select({ name: companies.name }).from(companies).where(eq(companies.id, companyId)).limit(1);
        return await loadRFPWithLanes(db, numericId, co?.name || "My Company");
      } catch {
        return null;
      }
    }),

  createRFP: protectedProcedure
    .input(z.object({
      title: z.string().min(5),
      description: z.string(),
      responseDeadline: z.string(),
      contractStartDate: z.string(),
      contractEndDate: z.string(),
      carrierRequirements: z.object({
        minSafetyScore: z.number().optional(),
        minOnTimeRate: z.number().optional(),
        requiredInsurance: z.number().optional(),
        hazmatCertRequired: z.boolean().optional(),
        minFleetSize: z.number().optional(),
        preferredTiers: z.array(z.string()).optional(),
      }).optional(),
      scoringWeights: z.object({
        rate: z.number().optional(),
        serviceLevel: z.number().optional(),
        safety: z.number().optional(),
        capacity: z.number().optional(),
        experience: z.number().optional(),
      }).optional(),
      lanes: z.array(z.object({
        origin: z.object({ city: z.string(), state: z.string() }),
        destination: z.object({ city: z.string(), state: z.string() }),
        estimatedDistance: z.number(),
        annualVolume: z.number(),
        volumeUnit: z.enum(["loads", "tons", "gallons"]),
        equipmentRequired: z.string(),
        hazmat: z.boolean(),
        temperatureControlled: z.boolean(),
        targetRate: z.number().nullable(),
        rateType: z.enum(["flat", "per_mile"]),
        frequencyPerWeek: z.number(),
        specialRequirements: z.array(z.string()),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const companyId = Number(ctx.user?.companyId || ctx.user?.id) || 0;

      if (!db) return { success: false, rfp: null };

      try {
        const [result] = await db.insert(rfps).values({
          companyId,
          title: input.title,
          description: input.description,
          status: "draft",
          responseDeadline: new Date(input.responseDeadline),
          contractStartDate: input.contractStartDate,
          contractEndDate: input.contractEndDate,
          carrierRequirements: input.carrierRequirements || null,
          scoringWeights: input.scoringWeights || null,
        });

        const rfpId = unsafeCast(result).insertId;

        // Insert lanes
        for (const lane of input.lanes) {
          await db.insert(rfpLanes).values({
            rfpId,
            originCity: lane.origin.city,
            originState: lane.origin.state,
            destinationCity: lane.destination.city,
            destinationState: lane.destination.state,
            estimatedDistance: lane.estimatedDistance,
            annualVolume: lane.annualVolume,
            volumeUnit: lane.volumeUnit,
            equipmentRequired: lane.equipmentRequired,
            hazmat: lane.hazmat,
            temperatureControlled: lane.temperatureControlled,
            targetRate: lane.targetRate ? String(lane.targetRate) : null,
            rateType: lane.rateType,
            frequencyPerWeek: lane.frequencyPerWeek,
            specialRequirements: lane.specialRequirements,
          });
        }

        const [co] = await db.select({ name: companies.name }).from(companies).where(eq(companies.id, companyId)).limit(1);
        const full = await loadRFPWithLanes(db, rfpId, co?.name || "My Company");
        return { success: true, rfp: full };
      } catch (e) {
        logger.error("[RFP] createRFP error:", e);
        return { success: false, rfp: null };
      }
    }),

  publishRFP: protectedProcedure
    .input(z.object({ rfpId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const numericId = parseInt(input.rfpId.replace(/\D/g, ""), 10) || 0;

      if (db && numericId > 0) {
        try {
          // Count eligible carriers
          const [carrierCount] = await db
            .select({ cnt: sql<number>`count(*)` })
            .from(companies)
            .where(eq(companies.companyCategory, "motor_carrier"));
          const distributedTo = Number(carrierCount?.cnt || 0);

          await db.update(rfps)
            .set({ status: "published", publishedAt: new Date(), distributedTo })
            .where(eq(rfps.id, numericId));

          return { success: true, rfpId: input.rfpId, status: "published", distributedTo, publishedAt: new Date().toISOString() };
        } catch (e) {
          logger.error("[RFP] publishRFP error:", e);
        }
      }

      return { success: false, rfpId: input.rfpId, status: "draft", distributedTo: 0, publishedAt: null };
    }),

  getBidResponses: protectedProcedure
    .input(z.object({ rfpId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const numericId = parseInt(input.rfpId.replace(/\D/g, ""), 10) || 0;
        return await loadBidsForRFP(db, numericId);
      } catch {
        return [];
      }
    }),

  scoreResponses: protectedProcedure
    .input(z.object({ rfpId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const numericId = parseInt(input.rfpId.replace(/\D/g, ""), 10) || 0;
        const companyId = Number(ctx.user?.companyId || ctx.user?.id) || 0;
        const [co] = await db.select({ name: companies.name }).from(companies).where(eq(companies.id, companyId)).limit(1);
        const rfp = await loadRFPWithLanes(db, numericId, co?.name || "My Company");
        if (!rfp) return [];

        const bids = await loadBidsForRFP(db, numericId) as CarrierBidResponse[];
        const scorecards = bids.map((b: CarrierBidResponse) => scoreBidResponse(b, rfp));
        return scorecards.sort((a: any, b: any) => b.overallScore - a.overallScore);
      } catch {
        return [];
      }
    }),

  awardLane: protectedProcedure
    .input(z.object({ rfpId: z.string(), laneId: z.string(), carrierId: z.number(), awardedRate: z.number().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const numericRfpId = parseInt(input.rfpId.replace(/\D/g, ""), 10) || 0;
      const numericLaneId = parseInt(input.laneId.replace(/\D/g, ""), 10) || 0;

      if (db && numericRfpId > 0 && numericLaneId > 0) {
        try {
          await db.insert(rfpAwards).values({
            rfpId: numericRfpId,
            laneId: numericLaneId,
            carrierId: input.carrierId,
            awardedRate: String(input.awardedRate || 0),
            status: "awarded",
            awardedAt: new Date(),
          });

          return { success: true, rfpId: input.rfpId, laneId: input.laneId, carrierId: input.carrierId, status: "awarded" };
        } catch (e) {
          logger.error("[RFP] awardLane error:", e);
        }
      }

      return { success: false, rfpId: input.rfpId, laneId: input.laneId, carrierId: input.carrierId, status: "error" };
    }),

  batchAward: protectedProcedure
    .input(z.object({ rfpId: z.string(), awards: z.array(z.object({ laneId: z.string(), carrierId: z.number(), awardedRate: z.number().optional() })) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const numericRfpId = parseInt(input.rfpId.replace(/\D/g, ""), 10) || 0;
      let awarded = 0;

      if (db && numericRfpId > 0) {
        try {
          for (const award of input.awards) {
            const numericLaneId = parseInt(award.laneId.replace(/\D/g, ""), 10) || 0;
            if (numericLaneId > 0) {
              await db.insert(rfpAwards).values({
                rfpId: numericRfpId,
                laneId: numericLaneId,
                carrierId: award.carrierId,
                awardedRate: String(award.awardedRate || 0),
                status: "awarded",
                awardedAt: new Date(),
              });
              awarded++;
            }
          }

          // Update RFP status
          await db.update(rfps)
            .set({ status: "awarded", awardDate: new Date() })
            .where(eq(rfps.id, numericRfpId));
        } catch (e) {
          logger.error("[RFP] batchAward error:", e);
        }
      }

      return { success: awarded > 0, rfpId: input.rfpId, awarded };
    }),
});
