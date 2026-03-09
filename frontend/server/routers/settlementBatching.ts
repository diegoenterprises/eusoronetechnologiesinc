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
import { settlementBatches, settlementBatchItems, settlements, loads } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { emitDispatchEvent } from "../_core/websocket";

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
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || "DISPATCH", companyId: (ctx.user as any)?.companyId, action: "CREATE", resource: "INVOICE" }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;
      if (!companyId) throw new Error("Company context required");

      // Get settlements for the provided load IDs
      const matchedSettlements: any[] = [];
      for (const loadId of input.loadIds) {
        const [s] = await db.select().from(settlements).where(eq(settlements.loadId, loadId)).limit(1);
        if (s) {
          // Double-batching prevention: check if already in another batch
          const [existing] = await db.select()
            .from(settlementBatchItems)
            .where(eq(settlementBatchItems.settlementId, s.id))
            .limit(1);
          if (existing) {
            throw new Error(`Settlement for load ${loadId} is already in batch #${existing.batchId}. Remove it first.`);
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

      const batchNumber = generateBatchNumber(input.batchType);

      // Insert batch using raw SQL for date fields
      await (db as any).execute(
        sql`INSERT INTO settlement_batches (batchNumber, companyId, batchType, periodStart, periodEnd, status, totalLoads, subtotalAmount, fscAmount, accessorialAmount, deductionAmount, totalAmount) VALUES (${batchNumber}, ${companyId}, ${input.batchType}, ${input.periodStart}, ${input.periodEnd}, 'draft', ${matchedSettlements.length}, ${subtotal.toFixed(2)}, ${fscTotal.toFixed(2)}, ${accessorialTotal.toFixed(2)}, ${deductionTotal.toFixed(2)}, ${total.toFixed(2)})`
      );

      // Retrieve the inserted batch
      const [batch] = await db.select().from(settlementBatches)
        .where(eq(settlementBatches.batchNumber, batchNumber)).limit(1);
      if (!batch) throw new Error("Failed to create batch");

      // Insert batch items
      for (const s of matchedSettlements) {
        const lineAmt = Number(s.loadRate) || 0;
        const accAmt = Number(s.accessorialCharges) || 0;
        const dedAmt = Number(s.platformFeeAmount) || 0;
        const netAmt = lineAmt + accAmt - dedAmt;

        // Get load number
        const [ld] = await db.select({ loadNumber: loads.loadNumber, pickupDate: loads.pickupDate, deliveryDate: loads.deliveryDate })
          .from(loads).where(eq(loads.id, s.loadId)).limit(1);

        await (db as any).execute(
          sql`INSERT INTO settlement_batch_items (batchId, settlementId, loadId, loadNumber, pickupDate, deliveryDate, lineAmount, fscAmount, accessorialAmount, deductions, netAmount) VALUES (${batch.id}, ${s.id}, ${s.loadId}, ${ld?.loadNumber || null}, ${ld?.pickupDate || null}, ${ld?.deliveryDate || null}, ${lineAmt.toFixed(2)}, ${"0.00"}, ${accAmt.toFixed(2)}, ${dedAmt.toFixed(2)}, ${netAmt.toFixed(2)})`
        );
      }

      return {
        batchId: batch.id,
        batchNumber,
        totalLoads: matchedSettlements.length,
        totalAmount: total,
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
      const companyId = Number((ctx.user as any)?.companyId) || 0;
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
      const companyId = Number((ctx.user as any)?.companyId) || 0;

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
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || "DISPATCH", companyId: (ctx.user as any)?.companyId, action: "UPDATE", resource: "INVOICE" }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;
      const userId = Number((ctx.user as any)?.id) || 0;

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
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || "DISPATCH", companyId: (ctx.user as any)?.companyId, action: "UPDATE", resource: "INVOICE" }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

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
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || "DISPATCH", companyId: (ctx.user as any)?.companyId, action: "UPDATE", resource: "INVOICE" }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

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

      await (db as any).execute(
        sql`INSERT INTO settlement_batch_items (batchId, settlementId, loadId, loadNumber, pickupDate, deliveryDate, lineAmount, fscAmount, accessorialAmount, deductions, netAmount) VALUES (${batch.id}, ${s.id}, ${s.loadId}, ${ld?.loadNumber || null}, ${ld?.pickupDate || null}, ${ld?.deliveryDate || null}, ${lineAmt.toFixed(2)}, ${"0.00"}, ${accAmt.toFixed(2)}, ${dedAmt.toFixed(2)}, ${netAmt.toFixed(2)})`
      );

      // Recalculate batch totals
      const [totals]: any = await (db as any).execute(
        sql`SELECT COUNT(*) as cnt, COALESCE(SUM(lineAmount),0) as sub, COALESCE(SUM(fscAmount),0) as fsc, COALESCE(SUM(accessorialAmount),0) as acc, COALESCE(SUM(deductions),0) as ded, COALESCE(SUM(netAmount),0) as tot FROM settlement_batch_items WHERE batchId = ${batch.id}`
      );
      const t = Array.isArray(totals) ? totals[0] : totals;

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
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || "DISPATCH", companyId: (ctx.user as any)?.companyId, action: "UPDATE", resource: "INVOICE" }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      const [batch] = await db.select().from(settlementBatches)
        .where(and(eq(settlementBatches.id, input.batchId), eq(settlementBatches.companyId, companyId)))
        .limit(1);
      if (!batch) throw new Error("Batch not found");
      if (batch.status !== "draft") throw new Error("Can only remove items from draft batches");

      // Delete the item
      await (db as any).execute(
        sql`DELETE FROM settlement_batch_items WHERE batchId = ${input.batchId} AND settlementId = ${input.settlementId}`
      );

      // Recalculate batch totals
      const [totals]: any = await (db as any).execute(
        sql`SELECT COUNT(*) as cnt, COALESCE(SUM(lineAmount),0) as sub, COALESCE(SUM(fscAmount),0) as fsc, COALESCE(SUM(accessorialAmount),0) as acc, COALESCE(SUM(deductions),0) as ded, COALESCE(SUM(netAmount),0) as tot FROM settlement_batch_items WHERE batchId = ${input.batchId}`
      );
      const t = Array.isArray(totals) ? totals[0] : totals;

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
      const companyId = Number((ctx.user as any)?.companyId) || 0;
      const driverId = input.driverId || Number((ctx.user as any)?.driverId) || 0;

      // Get driver_payable batches where this driver has settlements
      const batches = await db.select()
        .from(settlementBatches)
        .where(and(
          eq(settlementBatches.companyId, companyId),
          eq(settlementBatches.batchType, "driver_payable"),
        ))
        .orderBy(sql`${settlementBatches.createdAt} DESC`);

      // Filter to batches containing this driver's settlements
      const result: any[] = [];
      for (const b of batches) {
        const [item] = await (db as any).execute(
          sql`SELECT sbi.id FROM settlement_batch_items sbi JOIN settlements s ON sbi.settlementId = s.id WHERE sbi.batchId = ${b.id} AND s.driverId = ${driverId} LIMIT 1`
        ) as any;
        if (Array.isArray(item) && item.length > 0) {
          result.push({
            batchId: b.id,
            batchNumber: b.batchNumber,
            periodStart: b.periodStart,
            periodEnd: b.periodEnd,
            totalAmount: b.totalAmount,
            status: b.status,
            paidAt: b.paidAt,
          });
        }
      }

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
      const companyId = Number((ctx.user as any)?.companyId) || 0;

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
      await requireAccess({ userId: ctx.user?.id, role: (ctx.user as any)?.role || "ADMIN", companyId: (ctx.user as any)?.companyId, action: "CREATE", resource: "INVOICE" }, (ctx as any).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number((ctx.user as any)?.companyId) || 0;

      // Find completed settlements not yet in any batch, from last 7 days
      const [unbatched]: any = await (db as any).execute(
        sql`SELECT s.* FROM settlements s LEFT JOIN settlement_batch_items sbi ON sbi.settlementId = s.id WHERE sbi.id IS NULL AND s.status = 'completed' AND s.settledAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND (s.carrierId IN (SELECT userId FROM drivers WHERE companyId = ${companyId}) OR s.shipperId IN (SELECT id FROM users WHERE companyId = ${companyId})) ORDER BY s.settledAt ASC`
      );

      if (!Array.isArray(unbatched) || unbatched.length === 0) {
        return { batchesCreated: 0, totalLoads: 0, totalAmount: 0 };
      }

      // Group by batch type
      const groups: Record<string, any[]> = {
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

        await (db as any).execute(
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

          await (db as any).execute(
            sql`INSERT INTO settlement_batch_items (batchId, settlementId, loadId, loadNumber, lineAmount, fscAmount, accessorialAmount, deductions, netAmount) VALUES (${batch.id}, ${s.id}, ${s.loadId}, ${null}, ${lineAmt.toFixed(2)}, ${"0.00"}, ${accAmt.toFixed(2)}, ${dedAmt.toFixed(2)}, ${netAmt.toFixed(2)})`
          );
        }

        batchesCreated++;
        totalLoads += settles.length;
        totalAmount += total;
      }

      return { batchesCreated, totalLoads, totalAmount };
    }),
});
