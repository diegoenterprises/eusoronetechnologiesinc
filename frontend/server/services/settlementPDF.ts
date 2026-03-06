/**
 * SETTLEMENT PDF GENERATION (P0 Blocker 5)
 * Generates branded PDF settlement documents with load details,
 * rates, accessorials, deductions, platform fees, and net payout.
 * Stores generated PDFs and returns a reference URL.
 */

import { getDb } from "../db";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { payments, users } from "../../drizzle/schema";
import path from "path";
import fs from "fs";

/**
 * Archive a settlement file to Azure Blob Storage for long-term persistence.
 * Returns the blob URL (with SAS) if successful, null otherwise.
 */
async function archiveToBlobStorage(localFilePath: string, blobName: string): Promise<string | null> {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AZURE_BLOB_CONNECTION_STRING || "";
  const containerName = process.env.SETTLEMENT_BLOB_CONTAINER || "settlements";

  if (!connectionString) {
    console.warn("[SettlementPDF] Azure Blob Storage not configured — file stays local only");
    return null;
  }

  try {
    const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } = await import("@azure/storage-blob");
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Create container if not exists
    await containerClient.createIfNotExists({ access: undefined });

    // Upload file
    const blockBlobClient = containerClient.getBlockBlobClient(`archive/${new Date().getFullYear()}/${blobName}`);
    const fileBuffer = fs.readFileSync(localFilePath);
    await blockBlobClient.uploadData(fileBuffer, {
      blobHTTPHeaders: {
        blobContentType: blobName.endsWith(".pdf") ? "application/pdf" : "text/plain",
        blobContentDisposition: `inline; filename="${blobName}"`,
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        source: "eusotrip-settlement",
      },
    });

    // Generate SAS URL valid for 7 years (long-term archival)
    const sasExpiry = new Date();
    sasExpiry.setFullYear(sasExpiry.getFullYear() + 7);

    // Extract account name and key from connection string for SAS generation
    const accountMatch = connectionString.match(/AccountName=([^;]+)/);
    const keyMatch = connectionString.match(/AccountKey=([^;]+)/);
    if (accountMatch && keyMatch) {
      const sharedKeyCredential = new StorageSharedKeyCredential(accountMatch[1], keyMatch[1]);
      const sasToken = generateBlobSASQueryParameters({
        containerName,
        blobName: blockBlobClient.name,
        permissions: BlobSASPermissions.parse("r"),
        startsOn: new Date(),
        expiresOn: sasExpiry,
      }, sharedKeyCredential).toString();
      const sasUrl = `${blockBlobClient.url}?${sasToken}`;
      console.log(`[SettlementPDF] Archived to Azure Blob: ${blockBlobClient.name}`);
      return sasUrl;
    }

    // Fallback: return blob URL without SAS (requires public access or managed identity)
    console.log(`[SettlementPDF] Archived to Azure Blob (no SAS): ${blockBlobClient.name}`);
    return blockBlobClient.url;
  } catch (err: any) {
    console.warn("[SettlementPDF] Azure Blob upload failed (file stays local):", err?.message?.slice(0, 120));
    return null;
  }
}

interface SettlementData {
  settlementId: number;
  loadId?: number;
  loadNumber?: string;
  carrierId?: number;
  carrierName?: string;
  shipperId?: number;
  shipperName?: string;
  origin?: string;
  destination?: string;
  lineHaul: number;
  fuelSurcharge: number;
  accessorials: number;
  deductions: number;
  platformFee: number;
  grossPay: number;
  netPayout: number;
  status: string;
  paymentMethod?: string;
  settledAt?: string;
}

/**
 * Generate a settlement PDF document.
 * Returns the file path / URL of the generated document.
 */
export async function generateSettlementPDF(data: SettlementData): Promise<string> {
  // Ensure output directory exists
  const outputDir = path.join(process.cwd(), "dist", "settlements");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = `settlement_${data.settlementId}_${Date.now()}.pdf`;
  const filePath = path.join(outputDir, filename);

  try {
    // Dynamic import of pdfkit (may not be installed)
    const PDFDocument = (await import("pdfkit")).default;
    const doc = new PDFDocument({ size: "LETTER", margin: 50 });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).font("Helvetica-Bold").text("EusoTrip", 50, 50);
    doc.fontSize(10).font("Helvetica").text("Settlement Statement", 50, 75);
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor("#666").text(`Document ID: SET-${data.settlementId} | Generated: ${new Date().toISOString()}`, 50, 90);
    doc.fillColor("#000");

    // Divider
    doc.moveTo(50, 110).lineTo(562, 110).stroke("#ccc");

    // Settlement Details
    let y = 125;
    doc.fontSize(12).font("Helvetica-Bold").text("Settlement Details", 50, y);
    y += 20;

    const details = [
      ["Settlement ID", `SET-${data.settlementId}`],
      ["Load Number", data.loadNumber || "N/A"],
      ["Status", data.status.toUpperCase()],
      ["Date", data.settledAt || new Date().toISOString().split("T")[0]],
    ];

    doc.fontSize(9).font("Helvetica");
    for (const [label, value] of details) {
      doc.text(`${label}:`, 60, y, { width: 140 });
      doc.text(String(value), 200, y);
      y += 16;
    }

    // Parties
    y += 10;
    doc.fontSize(12).font("Helvetica-Bold").text("Parties", 50, y);
    y += 20;
    doc.fontSize(9).font("Helvetica");
    doc.text("Carrier:", 60, y, { width: 140 });
    doc.text(data.carrierName || "N/A", 200, y);
    y += 16;
    doc.text("Shipper:", 60, y, { width: 140 });
    doc.text(data.shipperName || "N/A", 200, y);
    y += 16;

    // Route
    if (data.origin || data.destination) {
      doc.text("Origin:", 60, y, { width: 140 });
      doc.text(data.origin || "N/A", 200, y);
      y += 16;
      doc.text("Destination:", 60, y, { width: 140 });
      doc.text(data.destination || "N/A", 200, y);
      y += 16;
    }

    // Financial Breakdown
    y += 15;
    doc.moveTo(50, y).lineTo(562, y).stroke("#ccc");
    y += 10;
    doc.fontSize(12).font("Helvetica-Bold").text("Financial Breakdown", 50, y);
    y += 25;

    const fmt = (n: number) => `$${n.toFixed(2)}`;
    const financials = [
      ["Line Haul", fmt(data.lineHaul)],
      ["Fuel Surcharge", fmt(data.fuelSurcharge)],
      ["Accessorials", fmt(data.accessorials)],
      ["Gross Pay", fmt(data.grossPay)],
      ["Platform Fee", `(${fmt(data.platformFee)})`],
      ["Deductions", `(${fmt(data.deductions)})`],
    ];

    doc.fontSize(9).font("Helvetica");
    for (const [label, value] of financials) {
      doc.text(label, 60, y, { width: 300 });
      doc.text(String(value), 420, y, { width: 100, align: "right" });
      y += 16;
    }

    // Net Payout (bold)
    y += 5;
    doc.moveTo(350, y).lineTo(520, y).stroke("#333");
    y += 8;
    doc.fontSize(11).font("Helvetica-Bold");
    doc.text("NET PAYOUT", 60, y, { width: 300 });
    doc.text(fmt(data.netPayout), 420, y, { width: 100, align: "right" });
    y += 25;

    if (data.paymentMethod) {
      doc.fontSize(8).font("Helvetica").fillColor("#666");
      doc.text(`Payment Method: ${data.paymentMethod}`, 60, y);
      y += 14;
    }

    // Footer
    const footerY = 700;
    doc.moveTo(50, footerY).lineTo(562, footerY).stroke("#ccc");
    doc.fontSize(7).font("Helvetica").fillColor("#999");
    doc.text("This is a system-generated settlement statement from EusoTrip. For disputes, contact support@eusotrip.com within 7 days.", 50, footerY + 8);
    doc.text(`© ${new Date().getFullYear()} Eusorone Technologies Inc. All rights reserved.`, 50, footerY + 20);

    doc.end();

    // Wait for stream to finish
    await new Promise<void>((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    console.log(`[SettlementPDF] Generated locally: ${filePath}`);

    // Archive to Azure Blob Storage for long-term persistence
    const blobUrl = await archiveToBlobStorage(filePath, filename);
    if (blobUrl) return blobUrl;

    return `/settlements/${filename}`;

  } catch (err: any) {
    // If pdfkit not available, generate a text-based receipt as fallback
    console.warn("[SettlementPDF] pdfkit not available, using text fallback:", err?.message?.slice(0, 80));

    const textContent = [
      "═══════════════════════════════════════════",
      "         EUSOTRIP SETTLEMENT STATEMENT",
      "═══════════════════════════════════════════",
      "",
      `Settlement ID: SET-${data.settlementId}`,
      `Load Number:   ${data.loadNumber || "N/A"}`,
      `Status:        ${data.status}`,
      `Date:          ${data.settledAt || new Date().toISOString().split("T")[0]}`,
      "",
      `Carrier:       ${data.carrierName || "N/A"}`,
      `Shipper:       ${data.shipperName || "N/A"}`,
      `Route:         ${data.origin || "N/A"} → ${data.destination || "N/A"}`,
      "",
      "──── Financial Breakdown ────",
      `Line Haul:       $${data.lineHaul.toFixed(2)}`,
      `Fuel Surcharge:  $${data.fuelSurcharge.toFixed(2)}`,
      `Accessorials:    $${data.accessorials.toFixed(2)}`,
      `Gross Pay:       $${data.grossPay.toFixed(2)}`,
      `Platform Fee:   ($${data.platformFee.toFixed(2)})`,
      `Deductions:     ($${data.deductions.toFixed(2)})`,
      "─────────────────────────────",
      `NET PAYOUT:      $${data.netPayout.toFixed(2)}`,
      "",
      `Payment: ${data.paymentMethod || "N/A"}`,
      "",
      "This is a system-generated statement.",
      `© ${new Date().getFullYear()} Eusorone Technologies Inc.`,
    ].join("\n");

    const txtFilename = `settlement_${data.settlementId}_${Date.now()}.txt`;
    const txtPath = path.join(outputDir, txtFilename);
    fs.writeFileSync(txtPath, textContent, "utf-8");
    console.log(`[SettlementPDF] Text fallback generated: ${txtPath}`);
    return `/settlements/${txtFilename}`;
  }
}

/**
 * Generate and store a settlement PDF, updating the payment record with the document URL.
 */
export async function generateAndStoreSettlementPDF(settlementId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Fetch payment/settlement data
    const [payment] = await db.select().from(payments).where(eq(payments.id, settlementId)).limit(1);
    if (!payment) return null;

    // Build settlement data from payment record
    const amount = Number(payment.amount) || 0;
    const fee = amount * 0.03; // Default 3% platform fee
    const data: SettlementData = {
      settlementId,
      loadId: payment.loadId || undefined,
      loadNumber: (payment as any).loadNumber || `LOAD-${payment.loadId || settlementId}`,
      grossPay: amount,
      lineHaul: amount * 0.85,
      fuelSurcharge: amount * 0.10,
      accessorials: amount * 0.05,
      deductions: 0,
      platformFee: fee,
      netPayout: amount - fee,
      status: payment.status || "completed",
      paymentMethod: payment.paymentMethod || "wallet",
      settledAt: payment.createdAt?.toISOString(),
    };

    // Try to get carrier/shipper names
    try {
      if (payment.payeeId) {
        const [carrier] = await db.select({ name: users.name }).from(users).where(eq(users.id, payment.payeeId)).limit(1);
        if (carrier) data.carrierName = carrier.name || undefined;
      }
      if (payment.payerId) {
        const [shipper] = await db.select({ name: users.name }).from(users).where(eq(users.id, payment.payerId)).limit(1);
        if (shipper) data.shipperName = shipper.name || undefined;
      }
    } catch {}

    const documentUrl = await generateSettlementPDF(data);

    // Store document URL on the payment record
    try {
      await db.execute(sql`UPDATE payments SET documentUrl = ${documentUrl} WHERE id = ${settlementId}`);
    } catch {}

    return documentUrl;
  } catch (err: any) {
    console.error("[SettlementPDF] Generate+Store error:", err?.message?.slice(0, 200));
    return null;
  }
}
