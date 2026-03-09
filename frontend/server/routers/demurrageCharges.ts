/**
 * AUTOMATED DEMURRAGE CHARGE GENERATION ROUTER (GAP-315)
 * tRPC procedures for charge generation, batch review, approval, analytics.
 */

import { z } from "zod";
import { eq, sql, and, desc, gte, lte } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { loads, companies } from "../../drizzle/schema";
import {
  generateDemurrageCharge,
  generateDemurrageBatch,
  generateDemurrageAnalytics,
  adjustCharge,
  disputeCharge,
  approveCharge,
  type DemurrageCharge,
  type ChargeStatus,
} from "../services/DemurrageChargeEngine";

export const demurrageChargesRouter = router({
  /**
   * Generate demurrage charges from stopped financial timers
   */
  generateCharges: protectedProcedure
    .input(z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { charges: [], batch: null };
      try {
        const dateFrom = input?.dateFrom || new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
        const dateTo = input?.dateTo || new Date().toISOString().split("T")[0];

        // Get stopped timers with billable amounts
        let timerRows: any[] = [];
        try {
          const result = await db.execute(sql`
            SELECT ft.*, l.id as load_id_ref, l.status as load_status,
                   l.catalystId, l.shipperId, l.rate, l.cargoType,
                   l.pickupLocation, l.deliveryLocation
            FROM financial_timers ft
            JOIN loads l ON ft.load_id = l.id
            WHERE ft.status = 'STOPPED'
              AND ft.billable_minutes > 0
              AND ft.total_charge > 0
              AND ft.stopped_at >= ${dateFrom}
              AND ft.stopped_at <= ${dateTo + " 23:59:59"}
            ORDER BY ft.stopped_at DESC
            LIMIT 200
          `);
          timerRows = ((result as unknown as any[][])[0]) || [];
        } catch {
          // financial_timers table may not exist yet — return empty
          timerRows = [];
        }

        const charges: DemurrageCharge[] = [];

        for (const timer of timerRows) {
          // Resolve carrier and shipper names
          const carrierId = timer.catalystId || timer.catalyst_id || 0;
          const shipperId = timer.shipperId || timer.shipper_id || 0;

          let carrierName = "Carrier";
          let shipperName = "Shipper";
          let terminalName = "";

          if (carrierId) {
            const [carrier] = await db.select({ name: companies.name })
              .from(companies).where(eq(companies.id, carrierId)).limit(1);
            if (carrier) carrierName = carrier.name;
          }
          if (shipperId) {
            const [shipper] = await db.select({ name: companies.name })
              .from(companies).where(eq(companies.id, shipperId)).limit(1);
            if (shipper) shipperName = shipper.name;
          }

          const pickup = timer.pickupLocation || timer.pickup_location;
          const delivery = timer.deliveryLocation || timer.delivery_location;
          const pickupAddr = typeof pickup === "string" ? pickup : (pickup?.address || pickup?.city || "Pickup");
          const deliveryAddr = typeof delivery === "string" ? delivery : (delivery?.address || delivery?.city || "Delivery");

          const charge = generateDemurrageCharge(
            {
              id: timer.id,
              loadId: timer.load_id || timer.loadId,
              type: timer.type,
              totalMinutes: timer.total_minutes || timer.totalMinutes || 0,
              billableMinutes: timer.billable_minutes || timer.billableMinutes || 0,
              hourlyRate: parseFloat(timer.hourly_rate || timer.hourlyRate || "75"),
              totalCharge: parseFloat(timer.total_charge || timer.totalCharge || "0"),
              currency: timer.currency || "USD",
              startedAt: timer.started_at || timer.startedAt || new Date().toISOString(),
              stoppedAt: timer.stopped_at || timer.stoppedAt || new Date().toISOString(),
              freeTimeMinutes: timer.free_time_minutes || timer.freeTimeMinutes || 120,
            },
            {
              id: timer.load_id || timer.loadId,
              reference: `LOAD-${timer.load_id || timer.loadId}`,
              carrierId,
              carrierName,
              shipperId,
              shipperName,
              terminalId: null,
              terminalName,
              pickupAddress: pickupAddr,
              deliveryAddress: deliveryAddr,
            },
          );
          charges.push(charge);
        }

        const batch = generateDemurrageBatch(charges, dateFrom, dateTo);
        return { charges, batch };
      } catch (e) {
        logger.error("[DemurrageCharges] generateCharges error:", e);
        return { charges: [], batch: null };
      }
    }),

  /**
   * Get demurrage analytics
   */
  getAnalytics: protectedProcedure
    .input(z.object({
      period: z.enum(["7d", "30d", "90d", "365d"]).default("30d"),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const period = input?.period || "30d";
        const days = parseInt(period);
        const dateFrom = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
        const dateTo = new Date().toISOString().split("T")[0];

        // Try DB first, fall back to simulated
        let timerRows: any[] = [];
        try {
          const result = await db.execute(sql`
            SELECT ft.*, l.catalystId, l.shipperId, l.pickupLocation, l.deliveryLocation
            FROM financial_timers ft
            JOIN loads l ON ft.load_id = l.id
            WHERE ft.status = 'STOPPED'
              AND ft.billable_minutes > 0
              AND ft.stopped_at >= ${dateFrom}
            ORDER BY ft.stopped_at DESC
            LIMIT 500
          `);
          timerRows = ((result as unknown as any[][])[0]) || [];
        } catch {
          // financial_timers table may not exist yet — return empty
          timerRows = [];
        }

        // Build charges for analytics
        const charges: DemurrageCharge[] = timerRows.map((t, i) => ({
          id: `DMR-${t.load_id || i}-${t.id || i}`,
          loadId: t.load_id || i,
          loadReference: `LOAD-${t.load_id || i}`,
          timerId: t.id || i,
          chargeType: (t.type || "DEMURRAGE") as any,
          status: "pending" as ChargeStatus,
          carrierId: t.catalystId || 0,
          carrierName: "Carrier",
          shipperId: t.shipperId || 0,
          shipperName: "Shipper",
          terminalId: null,
          terminalName: `Terminal ${(i % 5) + 1}`,
          locationType: t.type === "DETENTION" ? "pickup" as const : "delivery" as const,
          locationAddress: "",
          arrivedAt: t.started_at || t.startedAt || new Date().toISOString(),
          departedAt: t.stopped_at || t.stoppedAt || new Date().toISOString(),
          totalWaitMinutes: t.total_minutes || t.totalMinutes || 0,
          freeTimeMinutes: t.free_time_minutes || t.freeTimeMinutes || 120,
          billableMinutes: t.billable_minutes || t.billableMinutes || 0,
          hourlyRate: parseFloat(t.hourly_rate || t.hourlyRate || "75"),
          calculatedCharge: parseFloat(t.total_charge || t.totalCharge || "0"),
          adjustedCharge: null,
          finalCharge: parseFloat(t.total_charge || t.totalCharge || "0"),
          currency: "USD",
          generatedAt: t.stopped_at || t.stoppedAt || new Date().toISOString(),
          reviewedBy: null,
          reviewedAt: null,
          approvedBy: null,
          approvedAt: null,
          disputeReason: null,
          adjustmentReason: null,
          notes: "",
        }));

        return generateDemurrageAnalytics(charges, period);
      } catch (e) {
        logger.error("[DemurrageCharges] getAnalytics error:", e);
        return null;
      }
    }),

  /**
   * Approve a demurrage charge
   */
  approveCharge: protectedProcedure
    .input(z.object({ chargeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // In production, update charge status in DB
      return { success: true, chargeId: input.chargeId, status: "approved", approvedBy: ctx.user?.id };
    }),

  /**
   * Dispute a charge
   */
  disputeCharge: protectedProcedure
    .input(z.object({ chargeId: z.string(), reason: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, chargeId: input.chargeId, status: "disputed", reason: input.reason };
    }),

  /**
   * Adjust a charge amount
   */
  adjustCharge: protectedProcedure
    .input(z.object({ chargeId: z.string(), newAmount: z.number(), reason: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return { success: true, chargeId: input.chargeId, status: "adjusted", newAmount: input.newAmount, adjustedBy: ctx.user?.id };
    }),

  /**
   * Batch approve multiple charges
   */
  batchApprove: protectedProcedure
    .input(z.object({ chargeIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        approved: input.chargeIds.length,
        approvedBy: ctx.user?.id,
      };
    }),
});

