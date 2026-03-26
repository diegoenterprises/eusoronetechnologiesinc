/**
 * BULK LOAD IMPORT ROUTER — WS-DC-006
 * CSV bulk import with multi-step validation and error recovery
 *
 * Procedures:
 *   uploadCSV          — parse CSV text and create import job
 *   validateImport     — validate each row against schema
 *   executeImport      — create loads from valid rows
 *   getImportStatus    — get job + row details
 *   getImportHistory   — list past import jobs
 *   downloadTemplate   — return CSV header template
 *   downloadErrors     — return error rows as CSV
 */

import { z } from "zod";
import { isolatedApprovedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { requireAccess } from "../services/security/rbac/access-check";
import { bulkImportJobs, bulkImportRows, loads } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { ENV } from "../_core/env";
import { unsafeCast } from "../_core/types/unsafe";

const REQUIRED_FIELDS = ["pickupLocation", "deliveryLocation", "pickupDate", "deliveryDate", "cargoType"];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function validateRow(raw: Record<string, any>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (!raw[field] || String(raw[field]).trim() === "") {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (raw.pickupDate && !DATE_REGEX.test(String(raw.pickupDate))) {
    errors.push("pickupDate must be YYYY-MM-DD format");
  }
  if (raw.deliveryDate && !DATE_REGEX.test(String(raw.deliveryDate))) {
    errors.push("deliveryDate must be YYYY-MM-DD format");
  }
  if (raw.pickupDate && raw.deliveryDate && raw.deliveryDate < raw.pickupDate) {
    errors.push("deliveryDate must be on or after pickupDate");
  }

  if (raw.weight !== undefined && raw.weight !== "" && (isNaN(Number(raw.weight)) || Number(raw.weight) < 0)) {
    errors.push("weight must be a non-negative number");
  }
  if (raw.volume !== undefined && raw.volume !== "" && (isNaN(Number(raw.volume)) || Number(raw.volume) < 0)) {
    errors.push("volume must be a non-negative number");
  }
  if (raw.rate !== undefined && raw.rate !== "" && (isNaN(Number(raw.rate)) || Number(raw.rate) < 0)) {
    errors.push("rate must be a non-negative number");
  }

  return { isValid: errors.length === 0, errors };
}

function parseCSV(csvText: string): { headers: string[]; rows: Record<string, any>[] } {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 1) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map(h => h.trim().replace(/^"/, "").replace(/"$/, ""));
  const rows: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim().replace(/^"/, "").replace(/"$/, ""));
    const row: Record<string, any> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ""; });
    rows.push(row);
  }

  return { headers, rows };
}

// ---------------------------------------------------------------------------
// ESANG AI — Intelligent CSV Column Mapping
// ---------------------------------------------------------------------------
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const TARGET_FIELDS = [
  "pickupLocation", "deliveryLocation", "pickupDate", "deliveryDate",
  "cargoType", "hazmatClass", "weight", "weightUnit", "volume", "volumeUnit",
  "rate", "currency", "specialInstructions", "commodityName", "unNumber",
];

const CSV_MAPPING_PROMPT = `You are ESANG AI's CSV Intelligence engine for EusoTrip, a hazardous materials freight logistics platform.

You will receive CSV column headers and a few sample data rows from a bulk load import file.
Your job is to intelligently map each CSV column to one of these standard load fields:
${TARGET_FIELDS.join(", ")}

Rules:
1. Map columns by meaning, not exact name. E.g. "Origin" or "From" → pickupLocation, "Dest" or "To" → deliveryLocation
2. Date fields: normalize to YYYY-MM-DD format regardless of input format (MM/DD/YYYY, DD-Mon-YY, etc.)
3. If a column doesn't map to any field, set its mapping to null
4. If data contains both city+state in one column, that's fine — map it to the location field
5. Crude oil industry: "BBL" or "Barrels" → volume with volumeUnit "bbl", "Lease" or "Well Site" → pickupLocation, "Terminal" or "Station" → deliveryLocation
6. Rate fields: strip $ signs and commas, output raw number
7. Weight: if unit is embedded (e.g. "52000 lbs"), split into weight + weightUnit
8. For each row, also apply any data cleaning (trim whitespace, fix obvious typos in dates, normalize state abbreviations)

Respond with VALID JSON only. No markdown, no explanation.

JSON schema:
{
  "columnMapping": { "<original_csv_header>": "<target_field_or_null>" },
  "mappedRows": [ { "pickupLocation": "...", "deliveryLocation": "...", ... } ],
  "confidence": <0-100>,
  "unmappedColumns": ["<columns that had no match>"],
  "notes": "<brief note about any issues or assumptions>"
}`;

async function aiMapCSV(
  headers: string[],
  rows: Record<string, any>[]
): Promise<{ mappedRows: Record<string, any>[]; columnMapping: Record<string, string | null>; confidence: number; notes: string } | null> {
  const apiKey = ENV.geminiApiKey;
  if (!apiKey) {
    logger.info("[BulkImport] ESANG AI key not configured, using raw CSV headers");
    return null;
  }

  // Send up to 5 sample rows for mapping context
  const sampleRows = rows.slice(0, 5);
  const csvPreview = [
    headers.join(","),
    ...sampleRows.map(r => headers.map(h => String(r[h] || "")).join(",")),
  ].join("\n");

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${CSV_MAPPING_PROMPT}\n\nCSV Headers: ${JSON.stringify(headers)}\nTotal rows to map: ${rows.length}\n\nCSV Preview (headers + up to 5 sample rows):\n${csvPreview}\n\nNow map ALL ${rows.length} rows. Here is the full data as JSON:\n${JSON.stringify(rows)}`,
          }],
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
      }),
    });

    if (!response.ok) {
      logger.warn(`[BulkImport] ESANG AI error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const parsed = JSON.parse(text);
    logger.info(`[BulkImport] ESANG AI mapped ${parsed.mappedRows?.length || 0} rows, confidence: ${parsed.confidence}%`);

    return {
      mappedRows: parsed.mappedRows || rows,
      columnMapping: parsed.columnMapping || {},
      confidence: parsed.confidence || 50,
      notes: parsed.notes || "",
    };
  } catch (err) {
    logger.error("[BulkImport] ESANG AI CSV mapping error:", err);
    return null;
  }
}

export const bulkImportRouter = router({

  /**
   * uploadCSV — Parse CSV text and create import job with rows
   */
  uploadCSV: protectedProcedure
    .input(z.object({
      csvText: z.string().min(1),
      fileName: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: ctx.user!.role || "DISPATCH", companyId: ctx.user!.companyId, action: "CREATE", resource: "LOAD" }, unsafeCast(ctx).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;
      const userId = Number(ctx.user!.id) || 0;
      if (!companyId) throw new Error("Company context required");

      const { headers, rows: rawRows } = parseCSV(input.csvText);
      if (rawRows.length === 0) throw new Error("CSV contains no data rows");

      // ESANG AI: intelligently map CSV columns to standard load fields
      let rows = rawRows;
      let aiMapping: Record<string, string | null> | null = null;
      let aiConfidence = 0;
      let aiNotes = "";
      try {
        const aiResult = await aiMapCSV(headers, rawRows);
        if (aiResult && aiResult.mappedRows.length > 0) {
          rows = aiResult.mappedRows;
          aiMapping = aiResult.columnMapping;
          aiConfidence = aiResult.confidence;
          aiNotes = aiResult.notes;
          logger.info(`[BulkImport] AI mapping applied: ${aiConfidence}% confidence. Notes: ${aiNotes}`);
        }
      } catch (aiErr) {
        logger.warn("[BulkImport] AI mapping failed, using raw CSV:", aiErr);
      }

      // Create job
      await unsafeCast(db).execute(
        sql`INSERT INTO bulk_import_jobs (companyId, uploadedBy, fileName, totalRows, status) VALUES (${companyId}, ${userId}, ${input.fileName}, ${rows.length}, 'uploaded')`
      );

      const [job] = await db.select().from(bulkImportJobs)
        .where(and(eq(bulkImportJobs.companyId, companyId), eq(bulkImportJobs.uploadedBy, userId)))
        .orderBy(sql`${bulkImportJobs.id} DESC`)
        .limit(1);
      if (!job) throw new Error("Failed to create import job");

      // Insert rows
      for (let i = 0; i < rows.length; i++) {
        await unsafeCast(db).execute(
          sql`INSERT INTO bulk_import_rows (jobId, rowNumber, rawData, status) VALUES (${job.id}, ${i + 1}, ${JSON.stringify(rows[i])}, 'pending')`
        );
      }

      return {
        jobId: job.id,
        fileName: input.fileName,
        totalRows: rows.length,
        headers,
        aiMapping: aiMapping ? { columnMapping: aiMapping, confidence: aiConfidence, notes: aiNotes } : null,
      };
    }),

  /**
   * validateImport — Validate each row against schema
   */
  validateImport: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;

      const [job] = await db.select().from(bulkImportJobs)
        .where(and(eq(bulkImportJobs.id, input.jobId), eq(bulkImportJobs.companyId, companyId)))
        .limit(1);
      if (!job) throw new Error("Import job not found");

      // Mark as validating
      await db.update(bulkImportJobs).set({ status: "validating" }).where(eq(bulkImportJobs.id, input.jobId));

      const rows = await db.select().from(bulkImportRows)
        .where(eq(bulkImportRows.jobId, input.jobId))
        .orderBy(sql`${bulkImportRows.rowNumber} ASC`);

      let validCount = 0, invalidCount = 0;
      const allErrors: Record<string, string[]> = {};

      for (const row of rows) {
        const rawData = typeof row.rawData === "string" ? JSON.parse(row.rawData) : row.rawData;
        const { isValid, errors } = validateRow(rawData);

        if (isValid) {
          validCount++;
          await db.update(bulkImportRows).set({ status: "valid", errors: null }).where(eq(bulkImportRows.id, row.id));
        } else {
          invalidCount++;
          allErrors[String(row.rowNumber)] = errors;
          await db.update(bulkImportRows).set({ status: "invalid", errors }).where(eq(bulkImportRows.id, row.id));
        }
      }

      // Update job
      await db.update(bulkImportJobs).set({
        status: "validated",
        validationErrors: Object.keys(allErrors).length > 0 ? allErrors : null,
      }).where(eq(bulkImportJobs.id, input.jobId));

      return { jobId: input.jobId, validRows: validCount, invalidRows: invalidCount, errors: allErrors };
    }),

  /**
   * executeImport — Create loads from valid rows
   */
  executeImport: protectedProcedure
    .input(z.object({
      jobId: z.number(),
      skipInvalid: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await requireAccess({ userId: ctx.user?.id, role: ctx.user!.role || "DISPATCH", companyId: ctx.user!.companyId, action: "CREATE", resource: "LOAD" }, unsafeCast(ctx).req);
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;

      const [job] = await db.select().from(bulkImportJobs)
        .where(and(eq(bulkImportJobs.id, input.jobId), eq(bulkImportJobs.companyId, companyId)))
        .limit(1);
      if (!job) throw new Error("Import job not found");
      if (job.status !== "validated") throw new Error("Job must be validated before import");

      // Mark as importing
      await db.update(bulkImportJobs).set({ status: "importing" }).where(eq(bulkImportJobs.id, input.jobId));

      const validRows = await db.select().from(bulkImportRows)
        .where(and(eq(bulkImportRows.jobId, input.jobId), eq(bulkImportRows.status, "valid")))
        .orderBy(sql`${bulkImportRows.rowNumber} ASC`);

      let successCount = 0, failCount = 0;

      for (const row of validRows) {
        try {
          const raw = typeof row.rawData === "string" ? JSON.parse(row.rawData) : row.rawData;
          const loadNumber = `BLK-${input.jobId}-${row.rowNumber}-${Date.now().toString(36).toUpperCase()}`;

          await unsafeCast(db).execute(
            sql`INSERT INTO loads (loadNumber, companyId, pickupLocation, deliveryLocation, pickupDate, deliveryDate, cargoType, hazmatClass, weight, rate, specialInstructions, status) VALUES (${loadNumber}, ${companyId}, ${raw.pickupLocation || ""}, ${raw.deliveryLocation || ""}, ${raw.pickupDate}, ${raw.deliveryDate}, ${raw.cargoType || ""}, ${raw.hazmatClass || null}, ${Number(raw.weight) || null}, ${Number(raw.rate) || null}, ${raw.specialInstructions || null}, 'pending')`
          );

          const [created] = await db.select({ id: loads.id }).from(loads)
            .where(eq(loads.loadNumber, loadNumber)).limit(1);

          await db.update(bulkImportRows).set({
            status: "created",
            loadId: created?.id || null,
          }).where(eq(bulkImportRows.id, row.id));
          successCount++;
        } catch (err: unknown) {
          failCount++;
          await db.update(bulkImportRows).set({
            status: "failed",
            errors: [(err as Error).message],
          }).where(eq(bulkImportRows.id, row.id));
        }
      }

      // Update job
      await db.update(bulkImportJobs).set({
        status: "completed",
        successCount,
        failCount,
        completedAt: new Date(),
      }).where(eq(bulkImportJobs.id, input.jobId));

      return { jobId: input.jobId, createdCount: successCount, failedCount: failCount };
    }),

  /**
   * getImportStatus — Get job + row details
   */
  getImportStatus: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;

      const [job] = await db.select().from(bulkImportJobs)
        .where(and(eq(bulkImportJobs.id, input.jobId), eq(bulkImportJobs.companyId, companyId)))
        .limit(1);
      if (!job) throw new Error("Import job not found");

      const rows = await db.select().from(bulkImportRows)
        .where(eq(bulkImportRows.jobId, input.jobId))
        .orderBy(sql`${bulkImportRows.rowNumber} ASC`);

      return {
        jobId: job.id,
        fileName: job.fileName,
        status: job.status,
        totalRows: job.totalRows,
        successCount: job.successCount,
        failCount: job.failCount,
        rows: rows.map(r => ({
          rowNumber: r.rowNumber,
          rawData: r.rawData,
          status: r.status,
          errors: r.errors,
          loadId: r.loadId,
        })),
      };
    }),

  /**
   * getImportHistory — List past import jobs
   */
  getImportHistory: protectedProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(100).optional(),
      offset: z.number().int().min(0).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;

      const limit = input?.limit || 20;
      const offset = input?.offset || 0;

      const jobs = await db.select().from(bulkImportJobs)
        .where(eq(bulkImportJobs.companyId, companyId))
        .orderBy(sql`${bulkImportJobs.createdAt} DESC`)
        .limit(limit)
        .offset(offset);

      return { jobs };
    }),

  /**
   * downloadTemplate — Return CSV header template
   */
  downloadTemplate: protectedProcedure
    .query(async () => {
      const headers = [
        "pickupLocation", "deliveryLocation", "pickupDate", "deliveryDate", "cargoType",
        "hazmatClass", "weight", "weightUnit", "volume", "volumeUnit",
        "rate", "currency", "specialInstructions", "commodityName", "unNumber",
      ];
      const example = [
        "Houston, TX", "Cushing, OK", "2026-04-01", "2026-04-02", "Crude Oil",
        "3", "52000", "lbs", "200", "bbl",
        "4500", "USD", "Temperature sensitive", "WTI Crude", "UN1267",
      ];
      const csv = headers.join(",") + "\n" + example.join(",");
      return { csv, fileName: "bulk_load_import_template.csv" };
    }),

  /**
   * downloadErrors — Return error rows as CSV
   */
  downloadErrors: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;

      const [job] = await db.select().from(bulkImportJobs)
        .where(and(eq(bulkImportJobs.id, input.jobId), eq(bulkImportJobs.companyId, companyId)))
        .limit(1);
      if (!job) throw new Error("Import job not found");

      const errorRows = await db.select().from(bulkImportRows)
        .where(and(
          eq(bulkImportRows.jobId, input.jobId),
          sql`${bulkImportRows.status} IN ('invalid', 'failed')`,
        ))
        .orderBy(sql`${bulkImportRows.rowNumber} ASC`);

      if (errorRows.length === 0) return { csv: "", fileName: `errors_job_${input.jobId}.csv` };

      // Build CSV
      const allKeys = new Set<string>();
      for (const r of errorRows) {
        const raw = typeof r.rawData === "string" ? JSON.parse(r.rawData) : r.rawData;
        Object.keys(raw).forEach(k => allKeys.add(k));
      }
      const headers = ["rowNumber", ...Array.from(allKeys), "errors"];

      const lines = [headers.join(",")];
      for (const r of errorRows) {
        const raw = typeof r.rawData === "string" ? JSON.parse(r.rawData) : r.rawData;
        const errs = Array.isArray(r.errors) ? r.errors.join("; ") : "";
        const values = [String(r.rowNumber), ...Array.from(allKeys).map(k => `"${String(raw[k] || "").replace(/"/g, '""')}"`), `"${errs}"`];
        lines.push(values.join(","));
      }

      return { csv: lines.join("\n"), fileName: `errors_job_${input.jobId}.csv` };
    }),
});
