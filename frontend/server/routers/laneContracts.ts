/**
 * EUSOLANE — LANE CONTRACTS & COMMITMENTS ROUTER
 * Contracted rates on specific origin-destination lanes.
 * Tied to agreements, with volume commitments, rate locks, and performance tracking.
 */

import { z } from "zod";
import { eq, and, desc, sql, or, like, gte, lte } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  laneContracts,
  users,
  companies,
} from "../../drizzle/schema";

export const laneContractsRouter = router({
  /** List lane contracts for current user */
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      agreementId: z.number().optional(),
      originState: z.string().optional(),
      destinationState: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { lanes: [], total: 0 };
      try {
        const userId = ctx.user?.id;
        const conditions: any[] = [];

        if (userId) {
          conditions.push(
            or(
              eq(laneContracts.shipperId, userId),
              eq(laneContracts.carrierId, userId),
              eq(laneContracts.brokerId, userId)
            )
          );
        }
        if (input.status) conditions.push(eq(laneContracts.status, input.status as any));
        if (input.agreementId) conditions.push(eq(laneContracts.agreementId, input.agreementId));
        if (input.originState) conditions.push(eq(laneContracts.originState, input.originState));
        if (input.destinationState) conditions.push(eq(laneContracts.destinationState, input.destinationState));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [results, countResult] = await Promise.all([
          db.select().from(laneContracts)
            .where(whereClause)
            .orderBy(desc(laneContracts.createdAt))
            .limit(input.limit)
            .offset(input.offset),
          db.select({ count: sql<number>`count(*)` }).from(laneContracts).where(whereClause),
        ]);

        return { lanes: results, total: countResult[0]?.count || 0 };
      } catch (e) { return { lanes: [], total: 0 }; }
    }),

  /** Get lane contract by ID */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const [lane] = await db.select().from(laneContracts).where(eq(laneContracts.id, input.id));
        if (!lane) return null;

        // Get party details
        let shipper = null, carrier = null, broker = null;
        let shipperCompany = null, carrierCompany = null, brokerCompany = null;

        if (lane.shipperId) {
          const [u] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, lane.shipperId));
          shipper = u || null;
        }
        if (lane.carrierId) {
          const [u] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, lane.carrierId));
          carrier = u || null;
        }
        if (lane.brokerId) {
          const [u] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, lane.brokerId));
          broker = u || null;
        }
        if (lane.shipperCompanyId) {
          const [c] = await db.select({ id: companies.id, name: companies.name }).from(companies).where(eq(companies.id, lane.shipperCompanyId));
          shipperCompany = c || null;
        }
        if (lane.carrierCompanyId) {
          const [c] = await db.select({ id: companies.id, name: companies.name }).from(companies).where(eq(companies.id, lane.carrierCompanyId));
          carrierCompany = c || null;
        }
        if (lane.brokerCompanyId) {
          const [c] = await db.select({ id: companies.id, name: companies.name }).from(companies).where(eq(companies.id, lane.brokerCompanyId));
          brokerCompany = c || null;
        }

        return {
          ...lane,
          shipper,
          carrier,
          broker,
          shipperCompany,
          carrierCompany,
          brokerCompany,
        };
      } catch (e) { return null; }
    }),

  /** Lane contract stats */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { total: 0, active: 0, expired: 0, totalRevenue: 0, avgOnTime: 0 };
      try {
        const userId = ctx.user?.id;
        const userFilter = userId
          ? or(eq(laneContracts.shipperId, userId), eq(laneContracts.carrierId, userId), eq(laneContracts.brokerId, userId))
          : undefined;

        const [total, active, expired] = await Promise.all([
          db.select({ count: sql<number>`count(*)` }).from(laneContracts).where(userFilter),
          db.select({ count: sql<number>`count(*)` }).from(laneContracts).where(and(userFilter, eq(laneContracts.status, "active"))),
          db.select({ count: sql<number>`count(*)` }).from(laneContracts).where(and(userFilter, eq(laneContracts.status, "expired"))),
        ]);

        return {
          total: total[0]?.count || 0,
          active: active[0]?.count || 0,
          expired: expired[0]?.count || 0,
          totalRevenue: 0,
          avgOnTime: 0,
        };
      } catch (e) {
        return { total: 0, active: 0, expired: 0, totalRevenue: 0, avgOnTime: 0 };
      }
    }),

  /** Create a new lane contract */
  create: protectedProcedure
    .input(z.object({
      agreementId: z.number().optional(),
      carrierId: z.number().optional(),
      carrierCompanyId: z.number().optional(),
      brokerId: z.number().optional(),
      brokerCompanyId: z.number().optional(),
      originCity: z.string(),
      originState: z.string(),
      originZip: z.string().optional(),
      originRadius: z.number().optional(),
      destinationCity: z.string(),
      destinationState: z.string(),
      destinationZip: z.string().optional(),
      destinationRadius: z.number().optional(),
      estimatedMiles: z.number().optional(),
      contractedRate: z.number(),
      rateType: z.enum(["flat", "per_mile", "per_hour", "per_ton"]).default("flat"),
      fuelSurchargeType: z.enum(["none", "fixed", "doe_index", "percentage"]).default("none"),
      fuelSurchargeValue: z.number().optional(),
      volumeCommitment: z.number().optional(),
      volumePeriod: z.enum(["weekly", "monthly", "quarterly", "annually"]).optional(),
      equipmentType: z.string().optional(),
      hazmatRequired: z.boolean().optional(),
      effectiveDate: z.string(),
      expirationDate: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const result = await db.insert(laneContracts).values({
        agreementId: input.agreementId,
        shipperId: ctx.user!.id,
        shipperCompanyId: ctx.user?.companyId || null,
        carrierId: input.carrierId,
        carrierCompanyId: input.carrierCompanyId,
        brokerId: input.brokerId,
        brokerCompanyId: input.brokerCompanyId,
        originCity: input.originCity,
        originState: input.originState,
        originZip: input.originZip,
        originRadius: input.originRadius,
        destinationCity: input.destinationCity,
        destinationState: input.destinationState,
        destinationZip: input.destinationZip,
        destinationRadius: input.destinationRadius,
        estimatedMiles: input.estimatedMiles?.toString(),
        contractedRate: input.contractedRate.toString(),
        rateType: input.rateType,
        fuelSurchargeType: input.fuelSurchargeType,
        fuelSurchargeValue: input.fuelSurchargeValue?.toString(),
        volumeCommitment: input.volumeCommitment,
        volumePeriod: input.volumePeriod,
        equipmentType: input.equipmentType,
        hazmatRequired: input.hazmatRequired || false,
        effectiveDate: new Date(input.effectiveDate),
        expirationDate: new Date(input.expirationDate),
        status: "active",
      }).$returningId();

      return { id: result[0]?.id, success: true };
    }),

  /** Update lane contract */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      contractedRate: z.number().optional(),
      volumeCommitment: z.number().optional(),
      expirationDate: z.string().optional(),
      status: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const updateData: any = {};
      if (input.contractedRate !== undefined) updateData.contractedRate = input.contractedRate.toString();
      if (input.volumeCommitment !== undefined) updateData.volumeCommitment = input.volumeCommitment;
      if (input.expirationDate) updateData.expirationDate = new Date(input.expirationDate);
      if (input.status) updateData.status = input.status;

      await db.update(laneContracts).set(updateData).where(eq(laneContracts.id, input.id));
      return { success: true };
    }),

  /** Record a load booked against this lane contract */
  recordLoad: protectedProcedure
    .input(z.object({
      laneContractId: z.number(),
      revenue: z.number(),
      onTime: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.update(laneContracts).set({
        totalLoadsBooked: sql`${laneContracts.totalLoadsBooked} + 1`,
        totalRevenue: sql`${laneContracts.totalRevenue} + ${input.revenue}`,
        volumeFulfilled: sql`${laneContracts.volumeFulfilled} + 1`,
      }).where(eq(laneContracts.id, input.laneContractId));

      return { success: true };
    }),

  /** Get expiring lane contracts */
  getExpiring: protectedProcedure
    .input(z.object({ daysAhead: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const userId = ctx.user?.id;
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + input.daysAhead);

        const conditions: any[] = [
          eq(laneContracts.status, "active"),
          lte(laneContracts.expirationDate, futureDate),
          gte(laneContracts.expirationDate, new Date()),
        ];
        if (userId) {
          conditions.push(or(
            eq(laneContracts.shipperId, userId),
            eq(laneContracts.carrierId, userId),
            eq(laneContracts.brokerId, userId)
          ));
        }

        return await db.select().from(laneContracts)
          .where(and(...conditions))
          .orderBy(laneContracts.expirationDate)
          .limit(20);
      } catch (e) { return []; }
    }),
});
