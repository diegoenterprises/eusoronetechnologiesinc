/**
 * INVOICE GENERATION SERVICE
 * Automatically generates invoices when loads reach DELIVERED status.
 * Creates a factoring_invoices record and transitions load to "invoiced".
 *
 * Works alongside the existing settlement automation in loadLifecycle.ts:
 *   - Settlement row (settlements table) is created on DELIVERED
 *   - This service creates the corresponding invoice record (factoring_invoices)
 *   - Wallet transactions are already handled by the settlement automation
 *   - Load status advances from "delivered" -> "invoiced"
 */

import { getDb } from "../db";
import { loads, settlements, factoringInvoices } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { logger } from "../_core/logger";

// Platform fee: 8% of load rate (fallback — feeCalculator is primary)
const PLATFORM_FEE_RATE = 0.08;

export interface InvoiceData {
  invoiceId: number;
  loadId: number;
  loadNumber: string;
  shipperId: number;
  catalystId: number | null;
  driverId: number | null;
  totalRate: number;
  platformFee: number;
  carrierPayout: number;
  invoiceNumber: string;
  status: string;
  createdAt: string;
}

/**
 * Generate an invoice number: INV-YYMMDD-LOADID
 */
function generateInvoiceNumber(loadId: number, now: Date): string {
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `INV-${yy}${mm}${dd}-${loadId}`;
}

/**
 * Generate an invoice for a load that has reached DELIVERED status.
 * Creates a factoring_invoices record and transitions load to "invoiced".
 *
 * @param loadId - The numeric load ID
 * @returns InvoiceData or null if generation fails / load is not delivered
 */
export async function generateInvoiceForLoad(loadId: number): Promise<InvoiceData | null> {
  const db = await getDb();
  if (!db) return null;

  // Fetch load details
  const [load] = await db
    .select({
      id: loads.id,
      loadNumber: loads.loadNumber,
      shipperId: loads.shipperId,
      catalystId: loads.catalystId,
      driverId: loads.driverId,
      rate: loads.rate,
      status: loads.status,
    })
    .from(loads)
    .where(eq(loads.id, loadId))
    .limit(1);

  if (!load) {
    logger.warn(`[InvoiceService] Load ${loadId} not found`);
    return null;
  }

  // Only generate invoices for delivered loads
  if (load.status !== "delivered") {
    logger.warn(`[InvoiceService] Load ${loadId} status is "${load.status}", expected "delivered"`);
    return null;
  }

  const totalRate = Number(load.rate) || 0;
  if (totalRate <= 0) {
    logger.warn(`[InvoiceService] Load ${loadId} has zero/negative rate, skipping invoice`);
    return null;
  }

  // Look up matching settlement for fee details (created by settlement automation)
  let platformFee: number;
  let carrierPayout: number;

  const [settlement] = await db
    .select()
    .from(settlements)
    .where(eq(settlements.loadId, loadId))
    .limit(1);

  if (settlement) {
    platformFee = Number(settlement.platformFeeAmount) || 0;
    carrierPayout = Number(settlement.carrierPayment) || 0;
  } else {
    // Fallback: calculate using default platform fee rate
    platformFee = Math.round(totalRate * PLATFORM_FEE_RATE * 100) / 100;
    carrierPayout = Math.round((totalRate - platformFee) * 100) / 100;
  }

  const now = new Date();
  const invoiceNumber = generateInvoiceNumber(loadId, now);
  const catalystId = load.catalystId || load.driverId || 0;

  try {
    // Check if invoice already exists for this load (idempotency)
    const [existing] = await db
      .select({ id: factoringInvoices.id, invoiceNumber: factoringInvoices.invoiceNumber })
      .from(factoringInvoices)
      .where(eq(factoringInvoices.loadId, loadId))
      .limit(1);

    if (existing) {
      logger.info(`[InvoiceService] Invoice already exists for load ${loadId}: ${existing.invoiceNumber}`);
      // Still transition to invoiced if not already
      await db
        .update(loads)
        .set({ status: "invoiced" })
        .where(and(eq(loads.id, loadId), eq(loads.status, "delivered" as any)));

      return {
        invoiceId: existing.id,
        loadId,
        loadNumber: load.loadNumber,
        shipperId: load.shipperId,
        catalystId: load.catalystId,
        driverId: load.driverId,
        totalRate,
        platformFee,
        carrierPayout,
        invoiceNumber: existing.invoiceNumber,
        status: "submitted",
        createdAt: now.toISOString(),
      };
    }

    // Create factoring_invoices record
    const advanceRate = 97; // 97% advance
    const factoringFeePercent = 3; // 3% factoring fee
    const invoiceAmount = settlement ? Number(settlement.totalShipperCharge) : totalRate;
    const factoringFeeAmount = Math.round(invoiceAmount * (factoringFeePercent / 100) * 100) / 100;
    const advanceAmount = Math.round(invoiceAmount * (advanceRate / 100) * 100) / 100;
    const reserveAmount = Math.round((invoiceAmount - advanceAmount - factoringFeeAmount) * 100) / 100;

    // Calculate dueDate: net-30 from now
    const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await db.insert(factoringInvoices).values({
      loadId,
      catalystUserId: catalystId,
      shipperUserId: load.shipperId,
      invoiceNumber,
      invoiceAmount: invoiceAmount.toFixed(2),
      advanceRate: String(advanceRate) + ".00",
      factoringFeePercent: String(factoringFeePercent) + ".00",
      factoringFeeAmount: factoringFeeAmount.toFixed(2),
      advanceAmount: advanceAmount.toFixed(2),
      reserveAmount: reserveAmount.toFixed(2),
      status: "submitted",
      dueDate,
      notes: `Auto-generated on delivery — Load #${load.loadNumber}`,
    });

    // Retrieve the inserted invoice
    const [invoice] = await db
      .select()
      .from(factoringInvoices)
      .where(eq(factoringInvoices.invoiceNumber, invoiceNumber))
      .limit(1);

    // Transition load status to "invoiced"
    await db
      .update(loads)
      .set({ status: "invoiced" })
      .where(eq(loads.id, loadId));

    // Update settlement status to "processing" if it exists and is pending
    if (settlement && settlement.status === "pending") {
      await db
        .update(settlements)
        .set({ status: "processing" })
        .where(eq(settlements.id, settlement.id));
    }

    logger.info(
      `[InvoiceService] Invoice ${invoiceNumber} generated for load ${loadId}: ` +
      `total=$${invoiceAmount.toFixed(2)}, fee=$${platformFee.toFixed(2)}, payout=$${carrierPayout.toFixed(2)}`
    );

    return {
      invoiceId: invoice?.id || 0,
      loadId,
      loadNumber: load.loadNumber,
      shipperId: load.shipperId,
      catalystId: load.catalystId,
      driverId: load.driverId,
      totalRate: invoiceAmount,
      platformFee,
      carrierPayout,
      invoiceNumber,
      status: "submitted",
      createdAt: now.toISOString(),
    };
  } catch (err: any) {
    logger.error(`[InvoiceService] Invoice generation failed for load ${loadId}:`, err?.message);
    return null;
  }
}

/**
 * Get invoice data for a specific load.
 */
export async function getInvoiceForLoad(loadId: number): Promise<InvoiceData | null> {
  const db = await getDb();
  if (!db) return null;

  const [invoice] = await db
    .select()
    .from(factoringInvoices)
    .where(eq(factoringInvoices.loadId, loadId))
    .limit(1);

  if (!invoice) return null;

  const [load] = await db
    .select({
      loadNumber: loads.loadNumber,
      shipperId: loads.shipperId,
      catalystId: loads.catalystId,
      driverId: loads.driverId,
    })
    .from(loads)
    .where(eq(loads.id, loadId))
    .limit(1);

  // Get settlement for fee breakdown
  const [settlement] = await db
    .select()
    .from(settlements)
    .where(eq(settlements.loadId, loadId))
    .limit(1);

  return {
    invoiceId: invoice.id,
    loadId,
    loadNumber: load?.loadNumber || "",
    shipperId: load?.shipperId || invoice.shipperUserId || 0,
    catalystId: load?.catalystId || null,
    driverId: load?.driverId || null,
    totalRate: Number(invoice.invoiceAmount) || 0,
    platformFee: Number(settlement?.platformFeeAmount) || Number(invoice.factoringFeeAmount) || 0,
    carrierPayout: Number(settlement?.carrierPayment) || Number(invoice.advanceAmount) || 0,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    createdAt: invoice.createdAt?.toISOString() || "",
  };
}

/**
 * Get all invoices for a user (as shipper or catalyst).
 */
export async function getInvoicesForUser(
  userId: number,
  role: "shipper" | "catalyst" | "all" = "all",
  limit = 50,
  offset = 0,
): Promise<{ invoices: InvoiceData[]; total: number }> {
  const db = await getDb();
  if (!db) return { invoices: [], total: 0 };

  let condition;
  if (role === "shipper") {
    condition = eq(factoringInvoices.shipperUserId, userId);
  } else if (role === "catalyst") {
    condition = eq(factoringInvoices.catalystUserId, userId);
  } else {
    condition = sql`(${factoringInvoices.shipperUserId} = ${userId} OR ${factoringInvoices.catalystUserId} = ${userId})`;
  }

  const rows = await db
    .select()
    .from(factoringInvoices)
    .where(condition)
    .orderBy(desc(factoringInvoices.createdAt))
    .limit(limit)
    .offset(offset);

  // Count total
  const [countRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(factoringInvoices)
    .where(condition);
  const total = countRow?.count || 0;

  // Enrich with load and settlement data
  const invoices: InvoiceData[] = [];
  for (const inv of rows) {
    const [load] = await db
      .select({
        loadNumber: loads.loadNumber,
        shipperId: loads.shipperId,
        catalystId: loads.catalystId,
        driverId: loads.driverId,
      })
      .from(loads)
      .where(eq(loads.id, inv.loadId))
      .limit(1);

    const [settlement] = await db
      .select()
      .from(settlements)
      .where(eq(settlements.loadId, inv.loadId))
      .limit(1);

    invoices.push({
      invoiceId: inv.id,
      loadId: inv.loadId,
      loadNumber: load?.loadNumber || "",
      shipperId: load?.shipperId || inv.shipperUserId || 0,
      catalystId: load?.catalystId || null,
      driverId: load?.driverId || null,
      totalRate: Number(inv.invoiceAmount) || 0,
      platformFee: Number(settlement?.platformFeeAmount) || Number(inv.factoringFeeAmount) || 0,
      carrierPayout: Number(settlement?.carrierPayment) || Number(inv.advanceAmount) || 0,
      invoiceNumber: inv.invoiceNumber,
      status: inv.status,
      createdAt: inv.createdAt?.toISOString() || "",
    });
  }

  return { invoices, total };
}
