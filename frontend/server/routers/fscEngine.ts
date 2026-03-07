/**
 * FSC ENGINE ROUTER — WS-DC-005
 * Per-contract fuel surcharge calculation with PADD regional pricing
 *
 * Procedures:
 *   getSchedules        — list FSC schedules
 *   createSchedule      — create schedule with method config
 *   calculateFSC        — compute FSC for a load
 *   updatePaddPrices    — refresh PADD prices from hz_fuel_prices
 *   getSchedulePreview  — preview calculation with parameters
 *   attachToContract    — link FSC schedule to pricebook entry
 *   getFSCHistory       — historical PADD + FSC trend
 */

import { z } from "zod";
import { isolatedApprovedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { requireAccess } from "../services/security/rbac/access-check";
import { fscSchedules, fscLookupTable, fscHistory, pricebookEntries } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

export const fscEngineRouter = router({

  /**
   * getSchedules — List FSC schedules for company
   */
  getSchedules: protectedProcedure
    .input(z.object({
      isActive: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      const conditions = [sql`${fscSchedules.companyId} = ${companyId}`];
      if (input?.isActive !== undefined) conditions.push(sql`${fscSchedules.isActive} = ${input.isActive ? 1 : 0}`);

      const schedules = await db.select().from(fscSchedules)
        .where(sql.join(conditions, sql` AND `))
        .orderBy(sql`${fscSchedules.scheduleName} ASC`);

      return { schedules };
    }),

  /**
   * createSchedule — Create FSC schedule with method configuration
   */
  createSchedule: protectedProcedure
    .input(z.object({
      scheduleName: z.string().min(1),
      method: z.enum(["cpm", "percentage", "table"]),
      paddRegion: z.enum(["1A", "1B", "1C", "2", "3", "4", "5"]),
      fuelType: z.string().optional(),
      updateFrequency: z.string().optional(),
      basePrice: z.number().optional(),
      cpmRate: z.number().min(0).optional(),
      percentageRate: z.number().min(0).optional(),
      tableEntries: z.array(z.object({
        fuelPriceMin: z.number(),
        fuelPriceMax: z.number(),
        surchargeAmount: z.number().min(0),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || "DISPATCH", companyId: (ctx.user as any)?.companyId, action: "CREATE", resource: "INVOICE" }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      await (db as any).execute(
        sql`INSERT INTO fsc_schedules (companyId, scheduleName, method, paddRegion, fuelType, updateFrequency, basePrice, cpmRate, percentageRate) VALUES (${companyId}, ${input.scheduleName}, ${input.method}, ${input.paddRegion}, ${input.fuelType || "diesel"}, ${input.updateFrequency || "weekly"}, ${input.basePrice?.toFixed(4) || null}, ${input.cpmRate?.toFixed(4) || null}, ${input.percentageRate?.toFixed(2) || null})`
      );

      const [schedule] = await db.select().from(fscSchedules)
        .where(and(eq(fscSchedules.companyId, companyId), eq(fscSchedules.scheduleName, input.scheduleName)))
        .orderBy(sql`${fscSchedules.id} DESC`)
        .limit(1);

      if (!schedule) throw new Error("Failed to create schedule");

      // Insert table entries if method is 'table'
      if (input.method === "table" && input.tableEntries?.length) {
        for (const te of input.tableEntries) {
          await (db as any).execute(
            sql`INSERT INTO fsc_lookup_table (scheduleId, fuelPriceMin, fuelPriceMax, surchargeAmount) VALUES (${schedule.id}, ${te.fuelPriceMin.toFixed(4)}, ${te.fuelPriceMax.toFixed(4)}, ${te.surchargeAmount.toFixed(4)})`
          );
        }
      }

      return { id: schedule.id, scheduleName: input.scheduleName, status: "active" };
    }),

  /**
   * calculateFSC — Compute FSC for a load
   */
  calculateFSC: protectedProcedure
    .input(z.object({
      scheduleId: z.number(),
      distance: z.number().optional(),
      estimatedCost: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      const [schedule] = await db.select().from(fscSchedules)
        .where(and(eq(fscSchedules.id, input.scheduleId), eq(fscSchedules.companyId, companyId)))
        .limit(1);
      if (!schedule) throw new Error("Schedule not found");

      // Get current PADD price from hz_fuel_prices or schedule
      let paddPrice = Number(schedule.lastPaddPrice) || 0;
      if (!paddPrice) {
        try {
          const [fuelRows]: any = await (db as any).execute(
            sql`SELECT price FROM hz_fuel_prices WHERE paddRegion = ${schedule.paddRegion} ORDER BY recordDate DESC LIMIT 1`
          );
          if (Array.isArray(fuelRows) && fuelRows[0]) paddPrice = Number(fuelRows[0].price);
        } catch { /* table may not exist */ }
      }

      let fsc = 0;
      const basePrice = Number(schedule.basePrice) || 0;

      switch (schedule.method) {
        case "cpm": {
          const cpmRate = Number(schedule.cpmRate) || 0;
          const distance = input.distance || 0;
          fsc = (distance * cpmRate) / 100;
          break;
        }
        case "percentage": {
          const pctRate = Number(schedule.percentageRate) || 0;
          const cost = input.estimatedCost || 0;
          fsc = (cost * pctRate) / 100;
          break;
        }
        case "table": {
          const lookups = await db.select().from(fscLookupTable)
            .where(eq(fscLookupTable.scheduleId, schedule.id))
            .orderBy(sql`${fscLookupTable.fuelPriceMin} ASC`);

          for (const row of lookups) {
            const min = Number(row.fuelPriceMin);
            const max = Number(row.fuelPriceMax);
            if (paddPrice >= min && paddPrice <= max) {
              fsc = Number(row.surchargeAmount);
              break;
            }
          }
          break;
        }
      }

      // Never negative
      fsc = Math.max(0, fsc);

      return {
        fsc: Math.round(fsc * 100) / 100,
        method: schedule.method,
        paddPrice,
        basePrice,
        paddRegion: schedule.paddRegion,
      };
    }),

  /**
   * updatePaddPrices — Refresh PADD prices from hz_fuel_prices table
   */
  updatePaddPrices: protectedProcedure
    .mutation(async ({ ctx }) => {
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || "ADMIN", companyId: (ctx.user as any)?.companyId, action: "UPDATE", resource: "INVOICE" }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      const paddRegions = ["1A", "1B", "1C", "2", "3", "4", "5"];
      const latestPaddPrices: Record<string, number> = {};
      let updatedCount = 0;

      for (const region of paddRegions) {
        try {
          const [rows]: any = await (db as any).execute(
            sql`SELECT price FROM hz_fuel_prices WHERE paddRegion = ${region} ORDER BY recordDate DESC LIMIT 1`
          );
          if (Array.isArray(rows) && rows[0]) {
            latestPaddPrices[region] = Number(rows[0].price);
          }
        } catch { /* table may not exist */ }
      }

      // Update all active schedules for this company
      const schedules = await db.select().from(fscSchedules)
        .where(and(eq(fscSchedules.companyId, companyId), eq(fscSchedules.isActive, 1)));

      for (const s of schedules) {
        const price = latestPaddPrices[s.paddRegion] || 0;
        if (price > 0) {
          await db.update(fscSchedules)
            .set({ lastPaddPrice: price.toFixed(4), lastUpdateAt: new Date() })
            .where(eq(fscSchedules.id, s.id));

          // Calculate and record in history
          let fsc = 0;
          if (s.method === "cpm") fsc = Number(s.cpmRate) || 0;
          else if (s.method === "percentage") fsc = Number(s.percentageRate) || 0;
          else {
            const lookups = await db.select().from(fscLookupTable)
              .where(eq(fscLookupTable.scheduleId, s.id));
            for (const row of lookups) {
              if (price >= Number(row.fuelPriceMin) && price <= Number(row.fuelPriceMax)) {
                fsc = Number(row.surchargeAmount);
                break;
              }
            }
          }

          await (db as any).execute(
            sql`INSERT INTO fsc_history (scheduleId, paddPrice, calculatedFsc) VALUES (${s.id}, ${price.toFixed(4)}, ${Math.max(0, fsc).toFixed(4)})`
          );
          updatedCount++;
        }
      }

      return { updatedCount, latestPaddPrices };
    }),

  /**
   * getSchedulePreview — Preview calculation with custom parameters
   */
  getSchedulePreview: protectedProcedure
    .input(z.object({
      scheduleId: z.number(),
      distance: z.number().optional(),
      estimatedCost: z.number().optional(),
      paddPrice: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      const [schedule] = await db.select().from(fscSchedules)
        .where(and(eq(fscSchedules.id, input.scheduleId), eq(fscSchedules.companyId, companyId)))
        .limit(1);
      if (!schedule) throw new Error("Schedule not found");

      const paddPrice = input.paddPrice || Number(schedule.lastPaddPrice) || 0;
      const basePrice = Number(schedule.basePrice) || 0;
      let fsc = 0;
      const calculations: Record<string, any> = {};

      switch (schedule.method) {
        case "cpm": {
          const rate = Number(schedule.cpmRate) || 0;
          const dist = input.distance || 0;
          fsc = (dist * rate) / 100;
          calculations.formula = `${dist} miles × $${rate}/100 = $${fsc.toFixed(2)}`;
          calculations.distance = dist;
          calculations.cpmRate = rate;
          break;
        }
        case "percentage": {
          const pct = Number(schedule.percentageRate) || 0;
          const cost = input.estimatedCost || 0;
          fsc = (cost * pct) / 100;
          calculations.formula = `$${cost} × ${pct}% = $${fsc.toFixed(2)}`;
          calculations.estimatedCost = cost;
          calculations.percentageRate = pct;
          break;
        }
        case "table": {
          const lookups = await db.select().from(fscLookupTable)
            .where(eq(fscLookupTable.scheduleId, schedule.id))
            .orderBy(sql`${fscLookupTable.fuelPriceMin} ASC`);
          calculations.tableRows = lookups.length;
          calculations.matchedRange = null;
          for (const row of lookups) {
            if (paddPrice >= Number(row.fuelPriceMin) && paddPrice <= Number(row.fuelPriceMax)) {
              fsc = Number(row.surchargeAmount);
              calculations.matchedRange = `$${row.fuelPriceMin}–$${row.fuelPriceMax}`;
              calculations.formula = `PADD $${paddPrice} in range → $${fsc.toFixed(2)}`;
              break;
            }
          }
          break;
        }
      }

      fsc = Math.max(0, fsc);

      return { fsc: Math.round(fsc * 100) / 100, method: schedule.method, calculations, paddPrice, basePrice };
    }),

  /**
   * attachToContract — Link FSC schedule to pricebook entry
   */
  attachToContract: protectedProcedure
    .input(z.object({
      pricebookEntryId: z.number(),
      fscScheduleId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || "DISPATCH", companyId: (ctx.user as any)?.companyId, action: "UPDATE", resource: "INVOICE" }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      // Verify both exist for this company
      const [entry] = await db.select().from(pricebookEntries)
        .where(and(eq(pricebookEntries.id, input.pricebookEntryId), eq(pricebookEntries.companyId, companyId)))
        .limit(1);
      if (!entry) throw new Error("Pricebook entry not found");

      const [schedule] = await db.select().from(fscSchedules)
        .where(and(eq(fscSchedules.id, input.fscScheduleId), eq(fscSchedules.companyId, companyId)))
        .limit(1);
      if (!schedule) throw new Error("FSC schedule not found");

      // Update pricebook entry with FSC info
      await (db as any).execute(
        sql`UPDATE pricebook_entries SET fscIncluded = 1, fscMethod = ${schedule.method}, fscValue = ${schedule.id} WHERE id = ${input.pricebookEntryId}`
      );

      return { entryId: input.pricebookEntryId, fscScheduleId: input.fscScheduleId };
    }),

  /**
   * getFSCHistory — Historical PADD + FSC trend for a schedule
   */
  getFSCHistory: protectedProcedure
    .input(z.object({
      scheduleId: z.number(),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      const [schedule] = await db.select().from(fscSchedules)
        .where(and(eq(fscSchedules.id, input.scheduleId), eq(fscSchedules.companyId, companyId)))
        .limit(1);
      if (!schedule) throw new Error("Schedule not found");

      const conditions = [sql`${fscHistory.scheduleId} = ${input.scheduleId}`];
      if (input.startDate) conditions.push(sql`${fscHistory.appliedAt} >= ${input.startDate}`);
      if (input.endDate) conditions.push(sql`${fscHistory.appliedAt} <= ${input.endDate}`);

      const history = await db.select().from(fscHistory)
        .where(sql.join(conditions, sql` AND `))
        .orderBy(sql`${fscHistory.appliedAt} ASC`);

      return {
        scheduleName: schedule.scheduleName,
        method: schedule.method,
        paddRegion: schedule.paddRegion,
        history: history.map(h => ({
          date: h.appliedAt,
          paddPrice: Number(h.paddPrice),
          calculatedFsc: Number(h.calculatedFsc),
        })),
      };
    }),
});
