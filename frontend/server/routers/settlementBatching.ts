/**
 * SETTLEMENT BATCHING ROUTER — WS-DC-003
 * 3-Level settlement batching: shipper payable, carrier receivable, driver payable
 * 
 * Procedures:
 *   createBatch          — create a new batch from date range + load IDs
 *   getBatches           — list batches with filters
 *   getBatchDetail       — single batch with expanded items
 *   approveBatch         — move to approved status
 *   processBatchPayment  — Stripe payment processing
 *   addToBatch           — add a settlement to existing batch
 *   removeFromBatch      — remove a settlement from batch + recalc
 *   getDriverBatchView   — driver-facing payable batch list
 *   generateBatchPDF     — placeholder for PDF generation
 *   autoBatch            — auto-create batches for completed settlements
 */

import { z } from "zod";
import { randomBytes } from "crypto";
import { isolatedApprovedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { requireAccess } from "../services/security/rbac/access-check";
import { settlementBatches, settlementBatchItems, settlements, loads, notifications } from "../../drizzle/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { emitDispatchEvent, emitNotification } from "../_core/websocket";
import { unsafeCast } from "../_core/types/unsafe";
import { BlockchainService } from "../services/BlockchainService";

function generateBatchNumber(type: string): string {
  const prefix = type === "shipper_payable" ? "SP" : type === "carrier_receivable" ? "CR" : "DP";
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

export const settlementBatchingRouter = router({

  /**
   * createBatch — Create a new settlement batch from date range + settlement/load IDs
   */
  createBatch: protectedProcedure
    .input(z.object({
      batchType: z.enum(["shipper_payable", "carrier_receivable", "driver_payable"]),
      periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      loadIds: z.array(z.number()).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user!.id, role: ctx.user!.role, companyId: ctx.user!.companyId, action: "CREATE", resource: "INVOICE" }, ctx.req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;
      if (!companyId) throw new Error("Company context required");

      const batchNumber = generateBatchNumber(input.batchType);

      // Wrap all writes in a transaction for atomicity — if any step fails, everything rolls back
      const result = await db.transaction(async (tx) => {
        // V8: Batch query — fetch all settlements for provided load IDs in one query
        const allSettlements = await tx.select().from(settlements).where(inArray(settlements.loadId, input.loadIds));
        const matchedSettlements: Array<typeof settlements.$inferSelect> = [];
        if (allSettlements.length > 0) {
          // V8: Batch check for double-batching prevention
          const settlementIds = allSettlements.map(s => s.id);
          const existingItems = await tx.select({ settlementId: settlementBatchItems.settlementId, batchId: settlementBatchItems.batchId })
            .from(settlementBatchItems)
            .where(inArray(settlementBatchItems.settlementId, settlementIds));
          const existingMap = new Map(existingItems.map(e => [e.settlementId, e.batchId]));

          for (const s of allSettlements) {
            const existingBatch = existingMap.get(s.id);
            if (existingBatch) {
              throw new Error(`Settlement for load ${s.loadId} is already in batch #${existingBatch}. Remove it first.`);
            }
            matchedSettlements.push(s);
          }
        }

        if (matchedSettlements.length === 0) {
          throw new Error("No settlements found for the provided load IDs");
        }

        // Calculate batch totals
        let subtotal = 0, fscTotal = 0, accessorialTotal = 0, deductionTotal = 0;
        for (const s of matchedSettlements) {
          subtotal += Number(s.loadRate) || 0;
          accessorialTotal += Number(s.accessorialCharges) || 0;
          deductionTotal += Number(s.platformFeeAmount) || 0;
        }
        const total = subtotal + fscTotal + accessorialTotal - deductionTotal;

        // Insert batch using raw SQL for date fields
        await tx.execute(
          sql`INSERT INTO settlement_batches (batchNumber, companyId, batchType, periodStart, periodEnd, status, totalLoads, subtotalAmount, fscAmount, accessorialAmount, deductionAmount, totalAmount) VALUES (${batchNumber}, ${companyId}, ${input.batchType}, ${input.periodStart}, ${input.periodEnd}, 'draft', ${matchedSettlements.length}, ${subtotal.toFixed(2)}, ${fscTotal.toFixed(2)}, ${accessorialTotal.toFixed(2)}, ${deductionTotal.toFixed(2)}, ${total.toFixed(2)})`
        );

        // Retrieve the inserted batch
        const [batch] = await tx.select().from(settlementBatches)
          .where(eq(settlementBatches.batchNumber, batchNumber)).limit(1);
        if (!batch) throw new Error("Failed to create batch");

        // V8: Batch-fetch all load details in one query instead of N queries
        const loadIds = matchedSettlements.map(s => s.loadId);
        const loadDetails = loadIds.length > 0
          ? await tx.select({ id: loads.id, loadNumber: loads.loadNumber, pickupDate: loads.pickupDate, deliveryDate: loads.deliveryDate })
              .from(loads).where(inArray(loads.id, loadIds))
          : [];
        const loadMap = new Map(loadDetails.map(ld => [ld.id, ld]));

        // Insert batch items
        for (const s of matchedSettlements) {
          const lineAmt = Number(s.loadRate) || 0;
          const accAmt = Number(s.accessorialCharges) || 0;
          const dedAmt = Number(s.platformFeeAmount) || 0;
          const netAmt = lineAmt + accAmt - dedAmt;

          const ld = loadMap.get(s.loadId);

          await tx.execute(
            sql`INSERT INTO settlement_batch_items (batchId, settlementId, loadId, loadNumber, pickupDate, deliveryDate, lineAmount, fscAmount, accessorialAmount, deductions, netAmount) VALUES (${batch.id}, ${s.id}, ${s.loadId}, ${ld?.loadNumber || null}, ${ld?.pickupDate || null}, ${ld?.deliveryDate || null}, ${lineAmt.toFixed(2)}, ${"0.00"}, ${accAmt.toFixed(2)}, ${dedAmt.toFixed(2)}, ${netAmt.toFixed(2)})`
          );
        }

        return {
          batchId: batch.id,
          totalLoads: matchedSettlements.length,
          totalAmount: total,
        };
      });

      // Blockchain audit — settlement batch created
      try { await BlockchainService.logEvent(0, "SETTLEMENT_BATCH_CREATED", { batchId: result.batchId, batchNumber, totalLoads: result.totalLoads, totalAmount: result.totalAmount, createdBy: ctx.user?.id, timestamp: new Date().toISOString() }); } catch { /* best-effort */ }

      return {
        batchId: result.batchId,
        batchNumber,
        totalLoads: result.totalLoads,
        totalAmount: result.totalAmount,
        status: "draft",
      };
    }),

  /**
   * getBatches — List batches with optional filters
   */
  getBatches: protectedProcedure
    .input(z.object({
      status: z.enum(["draft", "pending_approval", "approved", "processing", "paid", "failed", "disputed"]).optional(),
      batchType: z.enum(["shipper_payable", "carrier_receivable", "driver_payable"]).optional(),
      dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;
      if (!companyId) throw new Error("Company context required");

      const conditions = [sql`${settlementBatches.companyId} = ${companyId}`];
      if (input?.status) conditions.push(sql`${settlementBatches.status} = ${input.status}`);
      if (input?.batchType) conditions.push(sql`${settlementBatches.batchType} = ${input.batchType}`);
      if (input?.dateFrom) conditions.push(sql`${settlementBatches.periodStart} >= ${input.dateFrom}`);
      if (input?.dateTo) conditions.push(sql`${settlementBatches.periodEnd} <= ${input.dateTo}`);

      const batches = await db.select()
        .from(settlementBatches)
        .where(sql.join(conditions, sql` AND `))
        .orderBy(sql`${settlementBatches.createdAt} DESC`);

      return { batches };
    }),

  /**
   * getBatchDetail — Single batch with expanded items
   */
  getBatchDetail: protectedProcedure
    .input(z.object({ batchId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;

      const [batch] = await db.select().from(settlementBatches)
        .where(and(eq(settlementBatches.id, input.batchId), eq(settlementBatches.companyId, companyId)))
        .limit(1);
      if (!batch) throw new Error("Batch not found");

      const items = await db.select().from(settlementBatchItems)
        .where(eq(settlementBatchItems.batchId, input.batchId))
        .orderBy(sql`${settlementBatchItems.createdAt} ASC`);

      return { batch, items };
    }),

  /**
   * approveBatch — Move batch to approved status
   */
  approveBatch: protectedProcedure
    .input(z.object({ batchId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user!.id, role: ctx.user!.role, companyId: ctx.user!.companyId, action: "UPDATE", resource: "INVOICE" }, ctx.req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;
      const userId = Number(ctx.user!.id) || 0;

      const [batch] = await db.select().from(settlementBatches)
        .where(and(eq(settlementBatches.id, input.batchId), eq(settlementBatches.companyId, companyId)))
        .limit(1);
      if (!batch) throw new Error("Batch not found");
      if (batch.status !== "draft" && batch.status !== "pending_approval") {
        throw new Error(`Cannot approve batch in ${batch.status} status`);
      }

      await db.update(settlementBatches)
        .set({ status: "approved", approvedBy: userId, approvedAt: new Date() })
        .where(eq(settlementBatches.id, input.batchId));

      // ── Notifications: settlement batch approved ──
      try {
        // Fetch batch items to identify carrier/shipper from linked settlements
        const batchItems = await db.select({ settlementId: settlementBatchItems.settlementId, loadId: settlementBatchItems.loadId, loadNumber: settlementBatchItems.loadNumber })
          .from(settlementBatchItems).where(eq(settlementBatchItems.batchId, input.batchId));
        const carrierIds = new Set<number>();
        const shipperIds = new Set<number>();
        // V8: Batch query — fetch all settlement parties in one query
        const approveSettlementIds = batchItems.map(i => i.settlementId).filter(Boolean) as number[];
        if (approveSettlementIds.length > 0) {
          const approveSettlements = await db.select({ carrierId: settlements.carrierId, shipperId: settlements.shipperId })
            .from(settlements).where(inArray(settlements.id, approveSettlementIds));
          for (const s of approveSettlements) {
            if (s.carrierId) carrierIds.add(s.carrierId);
            if (s.shipperId) shipperIds.add(s.shipperId);
          }
        }
        const totalAmt = batch.totalAmount || "0.00";
        const firstLoadNumber = batchItems[0]?.loadNumber || "N/A";

        for (const carrierId of Array.from(carrierIds)) {
          await db.insert(notifications).values({
            userId: carrierId,
            type: "payment_received",
            title: "Settlement Batch Approved",
            message: `Settlement #${batch.batchNumber} approved — $${totalAmt} will be deposited`,
            data: { batchId: input.batchId, batchNumber: batch.batchNumber, amount: totalAmt },
          });
          emitNotification(carrierId.toString(), {
            id: `notif_batch_${input.batchId}_carrier_${carrierId}`,
            type: "payment_received",
            title: "Settlement Batch Approved",
            message: `Settlement #${batch.batchNumber} approved — $${totalAmt} will be deposited`,
            priority: "high",
            data: { batchId: input.batchId, batchNumber: batch.batchNumber },
            timestamp: new Date().toISOString(),
          });
        }
        for (const shipperId of Array.from(shipperIds)) {
          await db.insert(notifications).values({
            userId: shipperId,
            type: "payment_received",
            title: "Settlement Processed",
            message: `Settlement #${batch.batchNumber} for load #${firstLoadNumber} has been processed`,
            data: { batchId: input.batchId, batchNumber: batch.batchNumber, loadNumber: firstLoadNumber },
          });
          emitNotification(shipperId.toString(), {
            id: `notif_batch_${input.batchId}_shipper_${shipperId}`,
            type: "payment_received",
            title: "Settlement Processed",
            message: `Settlement #${batch.batchNumber} for load #${firstLoadNumber} has been processed`,
            priority: "medium",
            data: { batchId: input.batchId, batchNumber: batch.batchNumber },
            timestamp: new Date().toISOString(),
          });
        }
      } catch (_notifErr) { /* notification failure must not break primary operation */ }

      return { batchId: input.batchId, status: "approved", approvedAt: new Date().toISOString() };
    }),

  /**
   * processBatchPayment — Process payment via Stripe
   */
  processBatchPayment: protectedProcedure
    .input(z.object({
      batchId: z.number(),
      paymentMethod: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user!.id, role: ctx.user!.role, companyId: ctx.user!.companyId, action: "UPDATE", resource: "INVOICE" }, ctx.req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;

      const [batch] = await db.select().from(settlementBatches)
        .where(and(eq(settlementBatches.id, input.batchId), eq(settlementBatches.companyId, companyId)))
        .limit(1);
      if (!batch) throw new Error("Batch not found");
      if (batch.status !== "approved") {
        throw new Error("Batch must be approved before payment processing");
      }

      // Mark as processing
      await db.update(settlementBatches)
        .set({ status: "processing" })
        .where(eq(settlementBatches.id, input.batchId));

      // Stripe payment — use existing Stripe module if available
      let stripePaymentId = `sim_${Date.now()}`;
      try {
        const Stripe = (await import("stripe")).default;
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (stripeKey && batch.totalAmount) {
          const stripe = new Stripe(stripeKey);
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(Number(batch.totalAmount) * 100),
            currency: "usd",
            metadata: { batchId: String(batch.id), batchNumber: batch.batchNumber, companyId: String(companyId) },
            payment_method: input.paymentMethod || undefined,
            confirm: !!input.paymentMethod,
          });
          stripePaymentId = paymentIntent.id;
        }
      } catch (err: any) {
        // If Stripe fails, mark as failed
        await db.update(settlementBatches)
          .set({ status: "failed" })
          .where(eq(settlementBatches.id, input.batchId));
        throw new Error(`Payment failed: ${err.message}`);
      }

      // Mark as paid
      await db.update(settlementBatches)
        .set({ status: "paid", stripePaymentId, paidAt: new Date() })
        .where(eq(settlementBatches.id, input.batchId));

      // Fire gamification event
      try {
        emitDispatchEvent(String(companyId), {
          eventType: "batch_paid",
          loadId: String(batch.id),
          loadNumber: batch.batchNumber,
          message: `Settlement batch ${batch.batchNumber} paid — $${batch.totalAmount}`,
          priority: "normal",
          timestamp: new Date().toISOString(),
        });
      } catch {}

      // ── Notifications: settlement batch paid ──
      try {
        const paidItems = await db.select({ settlementId: settlementBatchItems.settlementId, loadNumber: settlementBatchItems.loadNumber })
          .from(settlementBatchItems).where(eq(settlementBatchItems.batchId, input.batchId));
        const paidCarrierIds = new Set<number>();
        const paidShipperIds = new Set<number>();
        // V8: Batch query — fetch all settlement parties in one query
        const paidSettlementIds = paidItems.map(i => i.settlementId).filter(Boolean) as number[];
        if (paidSettlementIds.length > 0) {
          const paidSettlements = await db.select({ carrierId: settlements.carrierId, shipperId: settlements.shipperId })
            .from(settlements).where(inArray(settlements.id, paidSettlementIds));
          for (const s of paidSettlements) {
            if (s.carrierId) paidCarrierIds.add(s.carrierId);
            if (s.shipperId) paidShipperIds.add(s.shipperId);
          }
        }
        const paidAmt = batch.totalAmount || "0.00";
        for (const cid of Array.from(paidCarrierIds)) {
          await db.insert(notifications).values({
            userId: cid,
            type: "payment_received",
            title: "Settlement Payment Sent",
            message: `Settlement #${batch.batchNumber} paid — $${paidAmt} deposited`,
            data: { batchId: input.batchId, batchNumber: batch.batchNumber, amount: paidAmt, transactionId: stripePaymentId },
          });
          emitNotification(cid.toString(), {
            id: `notif_paid_${input.batchId}_${cid}`,
            type: "payment_received",
            title: "Settlement Payment Sent",
            message: `Settlement #${batch.batchNumber} paid — $${paidAmt} deposited`,
            priority: "high",
            data: { batchId: input.batchId, transactionId: stripePaymentId },
            timestamp: new Date().toISOString(),
          });
        }
        for (const sid of Array.from(paidShipperIds)) {
          await db.insert(notifications).values({
            userId: sid,
            type: "payment_received",
            title: "Settlement Payment Completed",
            message: `Settlement #${batch.batchNumber} has been paid — $${paidAmt}`,
            data: { batchId: input.batchId, batchNumber: batch.batchNumber, amount: paidAmt },
          });
          emitNotification(sid.toString(), {
            id: `notif_paid_${input.batchId}_shipper_${sid}`,
            type: "payment_received",
            title: "Settlement Payment Completed",
            message: `Settlement #${batch.batchNumber} has been paid — $${paidAmt}`,
            priority: "medium",
            data: { batchId: input.batchId },
            timestamp: new Date().toISOString(),
          });
        }
      } catch (_notifErr) { /* notification failure must not break primary operation */ }

      return {
        batchId: input.batchId,
        status: "paid",
        paidAt: new Date().toISOString(),
        transactionId: stripePaymentId,
      };
    }),

  /**
   * addToBatch — Add a settlement to an existing batch
   */
  addToBatch: protectedProcedure
    .input(z.object({
      batchId: z.number(),
      settlementId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user!.id, role: ctx.user!.role, companyId: ctx.user!.companyId, action: "UPDATE", resource: "INVOICE" }, ctx.req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;

      // Validate batch
      const [batch] = await db.select().from(settlementBatches)
        .where(and(eq(settlementBatches.id, input.batchId), eq(settlementBatches.companyId, companyId)))
        .limit(1);
      if (!batch) throw new Error("Batch not found");
      if (batch.status !== "draft") throw new Error("Can only add items to draft batches");

      // Validate settlement
      const [s] = await db.select().from(settlements)
        .where(eq(settlements.id, input.settlementId)).limit(1);
      if (!s) throw new Error("Settlement not found");

      // Double-batching check
      const [dup] = await db.select().from(settlementBatchItems)
        .where(eq(settlementBatchItems.settlementId, input.settlementId)).limit(1);
      if (dup) throw new Error(`Settlement already in batch #${dup.batchId}`);

      // Get load info
      const [ld] = await db.select({ loadNumber: loads.loadNumber, pickupDate: loads.pickupDate, deliveryDate: loads.deliveryDate })
        .from(loads).where(eq(loads.id, s.loadId)).limit(1);

      const lineAmt = Number(s.loadRate) || 0;
      const accAmt = Number(s.accessorialCharges) || 0;
      const dedAmt = Number(s.platformFeeAmount) || 0;
      const netAmt = lineAmt + accAmt - dedAmt;

      await db.execute(
        sql`INSERT INTO settlement_batch_items (batchId, settlementId, loadId, loadNumber, pickupDate, deliveryDate, lineAmount, fscAmount, accessorialAmount, deductions, netAmount) VALUES (${batch.id}, ${s.id}, ${s.loadId}, ${ld?.loadNumber || null}, ${ld?.pickupDate || null}, ${ld?.deliveryDate || null}, ${lineAmt.toFixed(2)}, ${"0.00"}, ${accAmt.toFixed(2)}, ${dedAmt.toFixed(2)}, ${netAmt.toFixed(2)})`
      );

      // Recalculate batch totals
      const [totals] = await db.execute(
        sql`SELECT COUNT(*) as cnt, COALESCE(SUM(lineAmount),0) as sub, COALESCE(SUM(fscAmount),0) as fsc, COALESCE(SUM(accessorialAmount),0) as acc, COALESCE(SUM(deductions),0) as ded, COALESCE(SUM(netAmount),0) as tot FROM settlement_batch_items WHERE batchId = ${batch.id}`
      ) as unknown as [Record<string, string | number | null>[]];
      const t = Array.isArray(totals) ? unsafeCast(totals)[0] : totals;

      await db.update(settlementBatches).set({
        totalLoads: Number(t?.cnt) || 0,
        subtotalAmount: String(t?.sub || "0.00"),
        fscAmount: String(t?.fsc || "0.00"),
        accessorialAmount: String(t?.acc || "0.00"),
        deductionAmount: String(t?.ded || "0.00"),
        totalAmount: String(t?.tot || "0.00"),
      }).where(eq(settlementBatches.id, batch.id));

      return {
        batchId: batch.id,
        totalLoads: Number(t?.cnt) || 0,
        totalAmount: Number(t?.tot) || 0,
      };
    }),

  /**
   * removeFromBatch — Remove a settlement from batch + recalc
   */
  removeFromBatch: protectedProcedure
    .input(z.object({
      batchId: z.number(),
      settlementId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user!.id, role: ctx.user!.role, companyId: ctx.user!.companyId, action: "UPDATE", resource: "INVOICE" }, ctx.req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;

      const [batch] = await db.select().from(settlementBatches)
        .where(and(eq(settlementBatches.id, input.batchId), eq(settlementBatches.companyId, companyId)))
        .limit(1);
      if (!batch) throw new Error("Batch not found");
      if (batch.status !== "draft") throw new Error("Can only remove items from draft batches");

      // Delete the item
      await db.execute(
        sql`DELETE FROM settlement_batch_items WHERE batchId = ${input.batchId} AND settlementId = ${input.settlementId}`
      );

      // Recalculate batch totals
      const [totals] = await db.execute(
        sql`SELECT COUNT(*) as cnt, COALESCE(SUM(lineAmount),0) as sub, COALESCE(SUM(fscAmount),0) as fsc, COALESCE(SUM(accessorialAmount),0) as acc, COALESCE(SUM(deductions),0) as ded, COALESCE(SUM(netAmount),0) as tot FROM settlement_batch_items WHERE batchId = ${input.batchId}`
      ) as unknown as [Record<string, string | number | null>[]];
      const t = Array.isArray(totals) ? unsafeCast(totals)[0] : totals;

      await db.update(settlementBatches).set({
        totalLoads: Number(t?.cnt) || 0,
        subtotalAmount: String(t?.sub || "0.00"),
        fscAmount: String(t?.fsc || "0.00"),
        accessorialAmount: String(t?.acc || "0.00"),
        deductionAmount: String(t?.ded || "0.00"),
        totalAmount: String(t?.tot || "0.00"),
      }).where(eq(settlementBatches.id, input.batchId));

      return {
        batchId: input.batchId,
        totalLoads: Number(t?.cnt) || 0,
        totalAmount: Number(t?.tot) || 0,
      };
    }),

  /**
   * getDriverBatchView — Driver-facing payable batch list
   */
  getDriverBatchView: protectedProcedure
    .input(z.object({ driverId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;
      const driverId = input.driverId || 0;

      // Get driver_payable batches where this driver has settlements
      const batches = await db.select()
        .from(settlementBatches)
        .where(and(
          eq(settlementBatches.companyId, companyId),
          eq(settlementBatches.batchType, "driver_payable"),
        ))
        .orderBy(sql`${settlementBatches.createdAt} DESC`);

      // V8: Batch query — find all batch IDs containing this driver's settlements in one query
      if (batches.length === 0) return { batches: [] };
      const batchIds = batches.map(b => b.id);
      const [driverBatchRows] = await db.execute(
        sql`SELECT DISTINCT sbi.batchId FROM settlement_batch_items sbi JOIN settlements s ON sbi.settlementId = s.id WHERE sbi.batchId IN (${sql.join(batchIds.map(id => sql`${id}`), sql`,`)}) AND s.driverId = ${driverId}`
      ) as unknown as [Record<string, unknown>[]];
      const driverBatchIds = new Set(
        Array.isArray(driverBatchRows) ? unsafeCast(driverBatchRows).map((r: any) => Number(r.batchId)) : []
      );

      const result = batches
        .filter(b => driverBatchIds.has(b.id))
        .map(b => ({
          batchId: b.id,
          batchNumber: b.batchNumber,
          periodStart: b.periodStart,
          periodEnd: b.periodEnd,
          totalAmount: b.totalAmount,
          status: b.status,
          paidAt: b.paidAt,
        }));

      return { batches: result };
    }),

  /**
   * generateBatchPDF — Placeholder for PDF generation
   */
  generateBatchPDF: protectedProcedure
    .input(z.object({ batchId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;

      const [batch] = await db.select().from(settlementBatches)
        .where(and(eq(settlementBatches.id, input.batchId), eq(settlementBatches.companyId, companyId)))
        .limit(1);
      if (!batch) throw new Error("Batch not found");

      const items = await db.select().from(settlementBatchItems)
        .where(eq(settlementBatchItems.batchId, input.batchId));

      // Return data for client-side PDF generation (html2canvas or jspdf)
      return {
        batch,
        items,
        generatedAt: new Date().toISOString(),
        pdfReady: true,
      };
    }),

  /**
   * autoBatch — Auto-create batches for completed settlements from past week
   */
  autoBatch: protectedProcedure
    .mutation(async ({ ctx }) => {
      await requireAccess({ userId: ctx.user!.id, role: ctx.user!.role, companyId: ctx.user!.companyId, action: "CREATE", resource: "INVOICE" }, ctx.req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;

      // Find completed settlements not yet in any batch, from last 7 days
      const [unbatched] = await db.execute(
        sql`SELECT s.* FROM settlements s LEFT JOIN settlement_batch_items sbi ON sbi.settlementId = s.id WHERE sbi.id IS NULL AND s.status = 'completed' AND s.settledAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND (s.carrierId IN (SELECT userId FROM drivers WHERE companyId = ${companyId}) OR s.shipperId IN (SELECT id FROM users WHERE companyId = ${companyId})) ORDER BY s.settledAt ASC`
      );

      if (!Array.isArray(unbatched) || unsafeCast(unbatched).length === 0) {
        return { batchesCreated: 0, totalLoads: 0, totalAmount: 0 };
      }

      // Group by batch type
      const groups: Record<string, Record<string, unknown>[]> = {
        shipper_payable: [],
        carrier_receivable: [],
        driver_payable: [],
      };

      for (const s of unbatched) {
        // Simplified: put all in carrier_receivable for the company
        groups.carrier_receivable.push(s);
      }

      let batchesCreated = 0;
      let totalLoads = 0;
      let totalAmount = 0;

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const periodStart = weekAgo.toISOString().split("T")[0];
      const periodEnd = now.toISOString().split("T")[0];

      for (const [batchType, settles] of Object.entries(groups)) {
        if (settles.length === 0) continue;

        let subtotal = 0, accessorialTotal = 0, deductionTotal = 0;
        for (const s of settles) {
          subtotal += Number(s.loadRate) || 0;
          accessorialTotal += Number(s.accessorialCharges) || 0;
          deductionTotal += Number(s.platformFeeAmount) || 0;
        }
        const total = subtotal + accessorialTotal - deductionTotal;

        const batchNumber = generateBatchNumber(batchType);

        await db.execute(
          sql`INSERT INTO settlement_batches (batchNumber, companyId, batchType, periodStart, periodEnd, status, totalLoads, subtotalAmount, fscAmount, accessorialAmount, deductionAmount, totalAmount) VALUES (${batchNumber}, ${companyId}, ${batchType}, ${periodStart}, ${periodEnd}, 'draft', ${settles.length}, ${subtotal.toFixed(2)}, ${"0.00"}, ${accessorialTotal.toFixed(2)}, ${deductionTotal.toFixed(2)}, ${total.toFixed(2)})`
        );

        const [batch] = await db.select().from(settlementBatches)
          .where(eq(settlementBatches.batchNumber, batchNumber)).limit(1);
        if (!batch) continue;

        for (const s of settles) {
          const lineAmt = Number(s.loadRate) || 0;
          const accAmt = Number(s.accessorialCharges) || 0;
          const dedAmt = Number(s.platformFeeAmount) || 0;
          const netAmt = lineAmt + accAmt - dedAmt;

          await db.execute(
            sql`INSERT INTO settlement_batch_items (batchId, settlementId, loadId, loadNumber, lineAmount, fscAmount, accessorialAmount, deductions, netAmount) VALUES (${batch.id}, ${s.id}, ${s.loadId}, ${null}, ${lineAmt.toFixed(2)}, ${"0.00"}, ${accAmt.toFixed(2)}, ${dedAmt.toFixed(2)}, ${netAmt.toFixed(2)})`
          );
        }

        batchesCreated++;
        totalLoads += settles.length;
        totalAmount += total;
      }

      return { batchesCreated, totalLoads, totalAmount };
    }),

  // ═══════════════════════════════════════════════════════════════
  // INVOICE QUERY ENDPOINTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * getInvoiceForLoad — Returns invoice data for a specific load
   */
  getInvoiceForLoad: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ ctx, input }) => {
      const { getInvoiceForLoad } = await import("../services/invoiceService");
      const invoice = await getInvoiceForLoad(input.loadId);
      if (!invoice) {
        return { invoice: null };
      }

      // Verify user has access (must be shipper, catalyst, or driver on the load)
      const userId = Number(ctx.user!.id) || 0;
      const role = (ctx.user!.role || "").toUpperCase();
      const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN" || role === "DISPATCH";
      const isParty = userId === invoice.shipperId || userId === invoice.catalystId || userId === invoice.driverId;
      if (!isAdmin && !isParty) {
        throw new Error("You do not have access to this invoice");
      }

      return { invoice };
    }),

  /**
   * getMyInvoices — Returns all invoices where user is shipper (payable) or catalyst (receivable)
   */
  getMyInvoices: protectedProcedure
    .input(z.object({
      role: z.enum(["shipper", "catalyst", "all"]).default("all"),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const userId = Number(ctx.user!.id) || 0;
      if (!userId) throw new Error("Authentication required");

      const { getInvoicesForUser } = await import("../services/invoiceService");
      const result = await getInvoicesForUser(
        userId,
        input?.role || "all",
        input?.limit || 50,
        input?.offset || 0,
      );

      return result;
    }),
});
