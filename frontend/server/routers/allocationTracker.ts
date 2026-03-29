/**
 * ALLOCATION TRACKER ROUTER — WS-DC-002
 * Daily barrel allocation tracking for contract fulfillment
 *
 * Procedures:
 *   getContracts              — list allocation contracts with filters
 *   createContract            — create a new allocation contract
 *   getDailyDashboard         — summary + per-contract status for a date
 *   updateTracking            — update loaded/delivered volumes
 *   getTerminalView           — terminal-specific view with 7-day trend
 *   getFulfillmentReport      — date-range fulfillment report
 *   createLoadsFromAllocation — create pre-filled loads from a contract
 */

import { z } from "zod";
import { isolatedApprovedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { requireAccess } from "../services/security/rbac/access-check";
import { allocationContracts, allocationDailyTracking, loads } from "../../drizzle/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { emitDispatchEvent } from "../_core/websocket";

export const allocationTrackerRouter = router({

  /**
   * getContracts — List allocation contracts with optional filters
   */
  getContracts: protectedProcedure
    .input(z.object({
      shipperId: z.number().optional(),
      status: z.enum(["active", "paused", "expired", "cancelled"]).optional(),
      originTerminalId: z.number().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;
      if (!companyId) throw new Error("Company context required");

      const conditions = [sql`${allocationContracts.companyId} = ${companyId}`];
      if (input?.shipperId) conditions.push(sql`${allocationContracts.shipperId} = ${input.shipperId}`);
      if (input?.status) conditions.push(sql`${allocationContracts.status} = ${input.status}`);
      if (input?.originTerminalId) conditions.push(sql`${allocationContracts.originTerminalId} = ${input.originTerminalId}`);

      const contracts = await db.select().from(allocationContracts)
        .where(sql.join(conditions, sql` AND `))
        .orderBy(sql`${allocationContracts.contractName} ASC`);

      return { contracts };
    }),

  /**
   * createContract — Create a new allocation contract
   */
  createContract: protectedProcedure
    .input(z.object({
      shipperId: z.number(),
      contractName: z.string().min(1),
      buyerName: z.string().optional(),
      originTerminalId: z.number(),
      destinationTerminalId: z.number(),
      product: z.string().min(1),
      cargoType: z.string().default("petroleum"),
      unit: z.string().default("bbl"),
      dailyNominationBbl: z.number().positive(),
      effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      ratePerBbl: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || "DISPATCH", companyId: (ctx.user as any)?.companyId, action: "CREATE", resource: "LOAD" }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;
      if (!companyId) throw new Error("Company context required");

      if (input.expirationDate < input.effectiveDate) {
        throw new Error("Expiration date must be after effective date");
      }

      await (db as any).execute(
        sql`INSERT INTO allocation_contracts (companyId, shipperId, contractName, buyerName, originTerminalId, destinationTerminalId, product, cargoType, unit, dailyNominationBbl, effectiveDate, expirationDate, ratePerBbl) VALUES (${companyId}, ${input.shipperId}, ${input.contractName}, ${input.buyerName || null}, ${input.originTerminalId}, ${input.destinationTerminalId}, ${input.product}, ${input.cargoType}, ${input.unit}, ${input.dailyNominationBbl.toFixed(2)}, ${input.effectiveDate}, ${input.expirationDate}, ${input.ratePerBbl?.toFixed(4) || null})`
      );

      const [contract] = await db.select().from(allocationContracts)
        .where(and(eq(allocationContracts.companyId, companyId), eq(allocationContracts.contractName, input.contractName)))
        .orderBy(sql`${allocationContracts.id} DESC`)
        .limit(1);

      return { id: contract?.id, contractName: input.contractName, status: "active" };
    }),

  /**
   * getDailyDashboard — Summary bar + per-contract status for a date
   */
  getDailyDashboard: protectedProcedure
    .input(z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;
      if (!companyId) throw new Error("Company context required");

      const date = input?.date || new Date().toISOString().split("T")[0];

      // Get active contracts
      const contracts = await db.select().from(allocationContracts)
        .where(and(
          eq(allocationContracts.companyId, companyId),
          eq(allocationContracts.status, "active"),
        ));

      // Get or create tracking records for each contract
      const contractData: any[] = [];
      let totalNominated = 0, totalLoaded = 0, totalDelivered = 0;

      for (const c of contracts) {
        // Ensure tracking record exists for today
        const [existing] = await db.select().from(allocationDailyTracking)
          .where(and(
            eq(allocationDailyTracking.allocationContractId, c.id),
            sql`${allocationDailyTracking.trackingDate} = ${date}`,
          )).limit(1);

        let tracking = existing;
        if (!tracking) {
          await (db as any).execute(
            sql`INSERT IGNORE INTO allocation_daily_tracking (allocationContractId, trackingDate, nominatedBbl, status) VALUES (${c.id}, ${date}, ${c.dailyNominationBbl}, 'pending')`
          );
          const [created] = await db.select().from(allocationDailyTracking)
            .where(and(
              eq(allocationDailyTracking.allocationContractId, c.id),
              sql`${allocationDailyTracking.trackingDate} = ${date}`,
            )).limit(1);
          tracking = created;
        }

        if (tracking) {
          const nominated = Number(tracking.nominatedBbl) || 0;
          const loaded = Number(tracking.loadedBbl) || 0;
          const delivered = Number(tracking.deliveredBbl) || 0;
          const remaining = nominated - delivered;
          const loadsNeeded = remaining > 0 ? Math.ceil((nominated - loaded) / 26) : 0;

          totalNominated += nominated;
          totalLoaded += loaded;
          totalDelivered += delivered;

          contractData.push({
            contractId: c.id,
            contractName: c.contractName,
            buyerName: c.buyerName,
            product: c.product,
            originTerminalId: c.originTerminalId,
            destinationTerminalId: c.destinationTerminalId,
            ratePerBbl: c.ratePerBbl,
            nominatedBbl: nominated,
            loadedBbl: loaded,
            deliveredBbl: delivered,
            remainingBbl: remaining,
            loadsNeeded,
            loadsCreated: tracking.loadsCreated || 0,
            loadsCompleted: tracking.loadsCompleted || 0,
            status: tracking.status,
          });
        }
      }

      const fulfillmentPercent = totalNominated > 0
        ? Math.round((totalDelivered / totalNominated) * 100)
        : 0;

      return {
        date,
        summaryBar: { totalNominated, totalLoaded, totalDelivered, fulfillmentPercent },
        contracts: contractData,
      };
    }),

  /**
   * updateTracking — Update loaded/delivered volumes for a contract on a date
   */
  updateTracking: protectedProcedure
    .input(z.object({
      allocationContractId: z.number(),
      trackingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      loadedBbl: z.number().optional(),
      deliveredBbl: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || "DISPATCH", companyId: (ctx.user as any)?.companyId, action: "UPDATE", resource: "LOAD" }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Ensure record exists
      const [existing] = await db.select().from(allocationDailyTracking)
        .where(and(
          eq(allocationDailyTracking.allocationContractId, input.allocationContractId),
          sql`${allocationDailyTracking.trackingDate} = ${input.trackingDate}`,
        )).limit(1);

      if (!existing) {
        // Get contract nomination
        const [contract] = await db.select().from(allocationContracts)
          .where(eq(allocationContracts.id, input.allocationContractId)).limit(1);
        if (!contract) throw new Error("Contract not found");

        await (db as any).execute(
          sql`INSERT INTO allocation_daily_tracking (allocationContractId, trackingDate, nominatedBbl, loadedBbl, deliveredBbl, status) VALUES (${input.allocationContractId}, ${input.trackingDate}, ${contract.dailyNominationBbl}, ${(input.loadedBbl || 0).toFixed(2)}, ${(input.deliveredBbl || 0).toFixed(2)}, 'pending')`
        );
      } else {
        const setFields: Record<string, any> = {};
        if (input.loadedBbl !== undefined) setFields.loadedBbl = input.loadedBbl.toFixed(2);
        if (input.deliveredBbl !== undefined) setFields.deliveredBbl = input.deliveredBbl.toFixed(2);
        if (Object.keys(setFields).length > 0) {
          await db.update(allocationDailyTracking)
            .set(setFields)
            .where(eq(allocationDailyTracking.id, existing.id));
        }
      }

      // Recalculate status
      const [record] = await db.select().from(allocationDailyTracking)
        .where(and(
          eq(allocationDailyTracking.allocationContractId, input.allocationContractId),
          sql`${allocationDailyTracking.trackingDate} = ${input.trackingDate}`,
        )).limit(1);

      if (record) {
        const nom = Number(record.nominatedBbl) || 0;
        const del = Number(record.deliveredBbl) || 0;
        const pct = nom > 0 ? (del / nom) * 100 : 0;
        const hour = new Date().getHours();
        let status = "pending";
        if (pct >= 100) status = "completed";
        else if (pct >= 100) status = "ahead";
        else if (pct < 80 && hour >= 12) status = "behind";
        else if (pct >= 0) status = "on_track";

        await db.update(allocationDailyTracking)
          .set({ status: status as any })
          .where(eq(allocationDailyTracking.id, record.id));

        // Fire gamification event on 100% fulfillment
        if (pct >= 100) {
          try {
            const companyId = Number((ctx.user as any)?.companyId) || 0;
            emitDispatchEvent(String(companyId), {
              eventType: "allocation_fulfilled",
              loadId: String(input.allocationContractId),
              loadNumber: `Contract #${input.allocationContractId}`,
              message: `Allocation fulfilled 100% for ${input.trackingDate}`,
              priority: "normal",
              timestamp: new Date().toISOString(),
            });
          } catch {}
        }

        return {
          id: record.id,
          nominatedBbl: nom,
          loadedBbl: Number(record.loadedBbl),
          deliveredBbl: del,
          remainingBbl: nom - del,
          status,
        };
      }

      return { id: 0, nominatedBbl: 0, loadedBbl: 0, deliveredBbl: 0, remainingBbl: 0, status: "pending" };
    }),

  /**
   * getTerminalView — Terminal-specific view with 7-day trend
   */
  getTerminalView: protectedProcedure
    .input(z.object({
      terminalId: z.number(),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      const now = new Date();
      const endDate = input.endDate || now.toISOString().split("T")[0];
      const startDate = input.startDate || new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      // Get contracts for this terminal
      const contracts = await db.select().from(allocationContracts)
        .where(and(
          eq(allocationContracts.companyId, companyId),
          sql`(${allocationContracts.originTerminalId} = ${input.terminalId} OR ${allocationContracts.destinationTerminalId} = ${input.terminalId})`,
        ));

      const contractIds = contracts.map(c => c.id);
      if (contractIds.length === 0) {
        return { terminal: { id: input.terminalId }, contracts: [], trend: [] };
      }

      // Get 7-day trend
      const trendRows = await db.select({
        trackingDate: allocationDailyTracking.trackingDate,
        nominated: sql<number>`SUM(${allocationDailyTracking.nominatedBbl})`,
        loaded: sql<number>`SUM(${allocationDailyTracking.loadedBbl})`,
        delivered: sql<number>`SUM(${allocationDailyTracking.deliveredBbl})`,
      }).from(allocationDailyTracking)
        .where(and(
          inArray(allocationDailyTracking.allocationContractId, contractIds),
          sql`${allocationDailyTracking.trackingDate} >= ${startDate}`,
          sql`${allocationDailyTracking.trackingDate} <= ${endDate}`,
        ))
        .groupBy(allocationDailyTracking.trackingDate)
        .orderBy(sql`${allocationDailyTracking.trackingDate} ASC`);

      const trend = trendRows.map((r: any) => ({
        date: r.trackingDate,
        nominated: Number(r.nominated) || 0,
        loaded: Number(r.loaded) || 0,
        delivered: Number(r.delivered) || 0,
      }));

      return {
        terminal: { id: input.terminalId },
        contracts: contracts.map(c => ({
          id: c.id,
          contractName: c.contractName,
          product: c.product,
          dailyNominationBbl: c.dailyNominationBbl,
          status: c.status,
        })),
        trend,
      };
    }),

  /**
   * getFulfillmentReport — Date-range fulfillment report
   */
  getFulfillmentReport: protectedProcedure
    .input(z.object({
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      // Get all contracts for company
      const contracts = await db.select().from(allocationContracts)
        .where(eq(allocationContracts.companyId, companyId));

      const contractIds = contracts.map(c => c.id);
      if (contractIds.length === 0) {
        return { totalNominated: 0, totalDelivered: 0, fulfillmentPercent: 0, contractsByStatus: {} };
      }

      const [agg] = await db.select({
        totalNom: sql<number>`COALESCE(SUM(${allocationDailyTracking.nominatedBbl}),0)`,
        totalDel: sql<number>`COALESCE(SUM(${allocationDailyTracking.deliveredBbl}),0)`,
      }).from(allocationDailyTracking)
        .where(and(
          inArray(allocationDailyTracking.allocationContractId, contractIds),
          sql`${allocationDailyTracking.trackingDate} >= ${input.startDate}`,
          sql`${allocationDailyTracking.trackingDate} <= ${input.endDate}`,
        ));

      const totalNominated = Number(agg?.totalNom) || 0;
      const totalDelivered = Number(agg?.totalDel) || 0;
      const fulfillmentPercent = totalNominated > 0 ? Math.round((totalDelivered / totalNominated) * 100) : 0;

      // Status breakdown
      const statusRows = await db.select({
        status: allocationDailyTracking.status,
        cnt: sql<number>`COUNT(*)`,
      }).from(allocationDailyTracking)
        .where(and(
          inArray(allocationDailyTracking.allocationContractId, contractIds),
          sql`${allocationDailyTracking.trackingDate} >= ${input.startDate}`,
          sql`${allocationDailyTracking.trackingDate} <= ${input.endDate}`,
        ))
        .groupBy(allocationDailyTracking.status);
      const contractsByStatus: Record<string, number> = {};
      for (const r of statusRows) contractsByStatus[r.status as string] = Number(r.cnt);

      return { totalNominated, totalDelivered, fulfillmentPercent, contractsByStatus };
    }),

  /**
   * createLoadsFromAllocation — Create pre-filled loads from a contract
   */
  createLoadsFromAllocation: protectedProcedure
    .input(z.object({
      allocationContractId: z.number(),
      trackingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      count: z.number().int().min(1).max(50),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || "DISPATCH", companyId: (ctx.user as any)?.companyId, action: "CREATE", resource: "LOAD" }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      const [contract] = await db.select().from(allocationContracts)
        .where(and(eq(allocationContracts.id, input.allocationContractId), eq(allocationContracts.companyId, companyId)))
        .limit(1);
      if (!contract) throw new Error("Contract not found");

      const createdLoadIds: number[] = [];
      const errors: string[] = [];

      for (let i = 0; i < input.count; i++) {
        try {
          const loadNumber = `AL-${contract.id}-${Date.now().toString(36).toUpperCase()}-${i}`;

          await (db as any).execute(
            sql`INSERT INTO loads (loadNumber, companyId, shipperId, pickupLocation, deliveryLocation, pickupDate, deliveryDate, cargoType, weight, rate, status) VALUES (${loadNumber}, ${companyId}, ${contract.shipperId}, ${`Terminal #${contract.originTerminalId}`}, ${`Terminal #${contract.destinationTerminalId}`}, ${input.trackingDate}, ${input.trackingDate}, ${contract.product}, ${2600}, ${Number(contract.ratePerBbl || 0) * 26}, 'pending')`
          );

          const [created] = await db.select({ id: loads.id }).from(loads)
            .where(eq(loads.loadNumber, loadNumber)).limit(1);
          if (created) createdLoadIds.push(created.id);
        } catch (err: any) {
          errors.push(`Load ${i + 1}: ${err.message}`);
        }
      }

      // Update tracking record
      if (createdLoadIds.length > 0) {
        await (db as any).execute(
          sql`UPDATE allocation_daily_tracking SET loadsCreated = loadsCreated + ${createdLoadIds.length} WHERE allocationContractId = ${input.allocationContractId} AND trackingDate = ${input.trackingDate}`
        );
      }

      return {
        createdLoadIds,
        failedCount: errors.length,
        errors,
      };
    }),
});
