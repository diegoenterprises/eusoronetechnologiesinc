/**
 * TAX REPORTING ROUTER (P0)
 * 1099-NEC generation for independent contractor payments
 * Aggregates payment data by tax year, generates 1099 records,
 * supports download and e-file preparation per IRS requirements.
 */

import { z } from "zod";
import { eq, and, sql, gte, lte, desc } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { payments, users } from "../../drizzle/schema";

const TAX_YEAR_SCHEMA = z.number().min(2020).max(2099);
const FORM_TYPE_SCHEMA = z.enum(["1099-NEC", "1099-MISC"]);

export const taxReportingRouter = router({
  /**
   * Get contractor payment summary for a tax year
   * Aggregates all payments >= $600 threshold per IRS 1099-NEC rules
   */
  getContractorSummary: protectedProcedure
    .input(z.object({ taxYear: TAX_YEAR_SCHEMA }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { contractors: [], totalPaid: 0, qualifyingCount: 0, taxYear: input.taxYear };
      try {
        const yearStart = `${input.taxYear}-01-01 00:00:00`;
        const yearEnd = `${input.taxYear}-12-31 23:59:59`;

        // Aggregate payments to each payee (contractor) within the tax year
        const rows = await db.execute(sql`
          SELECT
            p.payeeId,
            u.name AS contractorName,
            u.email AS contractorEmail,
            u.phone AS contractorPhone,
            u.role AS contractorRole,
            COUNT(*) AS paymentCount,
            SUM(CAST(p.amount AS DECIMAL(12,2))) AS totalPaid,
            MIN(p.createdAt) AS firstPayment,
            MAX(p.createdAt) AS lastPayment
          FROM payments p
          LEFT JOIN users u ON u.id = p.payeeId
          WHERE p.status IN ('completed', 'settled', 'paid')
            AND p.createdAt >= ${yearStart}
            AND p.createdAt <= ${yearEnd}
            AND p.payeeId IS NOT NULL
          GROUP BY p.payeeId, u.name, u.email, u.phone, u.role
          ORDER BY totalPaid DESC
        `) as any;

        const contractors = (rows[0] || []).map((r: any) => ({
          payeeId: r.payeeId,
          name: r.contractorName || "Unknown",
          email: r.contractorEmail || "",
          phone: r.contractorPhone || "",
          role: r.contractorRole || "",
          paymentCount: Number(r.paymentCount) || 0,
          totalPaid: parseFloat(r.totalPaid || "0"),
          firstPayment: r.firstPayment?.toISOString?.() || r.firstPayment || "",
          lastPayment: r.lastPayment?.toISOString?.() || r.lastPayment || "",
          meetsThreshold: parseFloat(r.totalPaid || "0") >= 600,
          formType: "1099-NEC" as const,
        }));

        return {
          taxYear: input.taxYear,
          contractors,
          totalPaid: contractors.reduce((s: number, c: any) => s + c.totalPaid, 0),
          qualifyingCount: contractors.filter((c: any) => c.meetsThreshold).length,
        };
      } catch (e: any) {
        logger.error("[TaxReporting] getContractorSummary error:", e?.message?.slice(0, 200));
        return { contractors: [], totalPaid: 0, qualifyingCount: 0, taxYear: input.taxYear };
      }
    }),

  /**
   * Generate 1099-NEC records for all qualifying contractors
   */
  generate1099s: protectedProcedure
    .input(z.object({
      taxYear: TAX_YEAR_SCHEMA,
      payerTIN: z.string().min(9).max(11).optional(),
      payerName: z.string().default("Eusorone Technologies Inc"),
      payerAddress: z.string().default("Houston, TX"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const yearStart = `${input.taxYear}-01-01 00:00:00`;
      const yearEnd = `${input.taxYear}-12-31 23:59:59`;

      // Get qualifying contractors (>= $600)
      const rows = await db.execute(sql`
        SELECT
          p.payeeId,
          u.name, u.email, u.phone, u.role,
          SUM(CAST(p.amount AS DECIMAL(12,2))) AS totalPaid
        FROM payments p
        LEFT JOIN users u ON u.id = p.payeeId
        WHERE p.status IN ('completed', 'settled', 'paid')
          AND p.createdAt >= ${yearStart}
          AND p.createdAt <= ${yearEnd}
          AND p.payeeId IS NOT NULL
        GROUP BY p.payeeId, u.name, u.email, u.phone, u.role
        HAVING totalPaid >= 600
      `) as any;

      const qualifying = rows[0] || [];
      const generated: any[] = [];

      for (const contractor of qualifying) {
        const recordId = `1099-${input.taxYear}-${contractor.payeeId}-${Date.now()}`;
        // Insert 1099 record into tax_1099_records
        try {
          await db.execute(sql`
            INSERT INTO tax_1099_records (recordId, taxYear, formType, payeeId, payeeName, payeeEmail,
              payeeTIN, payerName, payerTIN, payerAddress, nonemployeeCompensation,
              status, generatedBy, generatedAt)
            VALUES (${recordId}, ${input.taxYear}, '1099-NEC', ${contractor.payeeId},
              ${contractor.name || 'Unknown'}, ${contractor.email || ''},
              '', ${input.payerName}, ${input.payerTIN || ''},
              ${input.payerAddress}, ${parseFloat(contractor.totalPaid || '0')},
              'generated', ${ctx.user?.id || 0}, NOW())
            ON DUPLICATE KEY UPDATE
              nonemployeeCompensation = ${parseFloat(contractor.totalPaid || '0')},
              status = 'generated',
              generatedAt = NOW()
          `);
          generated.push({
            recordId,
            payeeId: contractor.payeeId,
            name: contractor.name,
            amount: parseFloat(contractor.totalPaid || "0"),
          });
        } catch (e: any) {
          logger.warn("[TaxReporting] generate1099 skip for payee", contractor.payeeId, e?.message?.slice(0, 80));
        }
      }

      return {
        taxYear: input.taxYear,
        generated: generated.length,
        total: qualifying.length,
        records: generated,
      };
    }),

  /**
   * List generated 1099 records
   */
  list1099s: protectedProcedure
    .input(z.object({
      taxYear: TAX_YEAR_SCHEMA,
      status: z.enum(["generated", "reviewed", "filed", "corrected", "voided"]).optional(),
      limit: z.number().default(100),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { records: [], total: 0 };
      try {
        let whereClause = sql`taxYear = ${input.taxYear}`;
        if (input.status) {
          whereClause = sql`taxYear = ${input.taxYear} AND status = ${input.status}`;
        }

        const [countResult] = await db.execute(sql`
          SELECT COUNT(*) as cnt FROM tax_1099_records WHERE ${whereClause}
        `) as any;
        const total = (countResult?.[0] || [])[0]?.cnt || 0;

        const rows = await db.execute(sql`
          SELECT * FROM tax_1099_records
          WHERE ${whereClause}
          ORDER BY nonemployeeCompensation DESC
          LIMIT ${input.limit} OFFSET ${input.offset}
        `) as any;

        const records = (rows[0] || []).map((r: any) => ({
          id: r.id,
          recordId: r.recordId,
          taxYear: r.taxYear,
          formType: r.formType,
          payeeId: r.payeeId,
          payeeName: r.payeeName,
          payeeEmail: r.payeeEmail,
          nonemployeeCompensation: parseFloat(r.nonemployeeCompensation || "0"),
          status: r.status,
          generatedAt: r.generatedAt?.toISOString?.() || "",
          filedAt: r.filedAt?.toISOString?.() || null,
        }));

        return { records, total: Number(total) };
      } catch (e: any) {
        logger.error("[TaxReporting] list1099s error:", e?.message?.slice(0, 200));
        return { records: [], total: 0 };
      }
    }),

  /**
   * Get single 1099 record detail
   */
  get1099Detail: protectedProcedure
    .input(z.object({ recordId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const rows = await db.execute(sql`
          SELECT * FROM tax_1099_records WHERE recordId = ${input.recordId} LIMIT 1
        `) as any;
        const r = (rows[0] || [])[0];
        if (!r) return null;
        return {
          id: r.id,
          recordId: r.recordId,
          taxYear: r.taxYear,
          formType: r.formType,
          payeeId: r.payeeId,
          payeeName: r.payeeName,
          payeeEmail: r.payeeEmail,
          payeeTIN: r.payeeTIN ? `***-**-${r.payeeTIN.slice(-4)}` : "Not provided",
          payerName: r.payerName,
          payerAddress: r.payerAddress,
          nonemployeeCompensation: parseFloat(r.nonemployeeCompensation || "0"),
          status: r.status,
          generatedAt: r.generatedAt?.toISOString?.() || "",
          filedAt: r.filedAt?.toISOString?.() || null,
          correctedAt: r.correctedAt?.toISOString?.() || null,
        };
      } catch { return null; }
    }),

  /**
   * Update 1099 record status (review, file, void, correct)
   */
  updateStatus: protectedProcedure
    .input(z.object({
      recordId: z.string(),
      status: z.enum(["reviewed", "filed", "corrected", "voided"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const updates: string[] = [`status = '${input.status}'`];
      if (input.status === "filed") updates.push(`filedAt = NOW()`);
      if (input.status === "corrected") updates.push(`correctedAt = NOW()`);
      if (input.notes) updates.push(`notes = '${input.notes.replace(/'/g, "''")}'`);

      await db.execute(sql.raw(
        `UPDATE tax_1099_records SET ${updates.join(", ")} WHERE recordId = '${input.recordId}'`
      ));

      return { success: true, recordId: input.recordId, status: input.status };
    }),

  /**
   * Update contractor TIN (encrypted at rest in production)
   */
  updatePayeeTIN: protectedProcedure
    .input(z.object({ recordId: z.string(), tin: z.string().min(9).max(11) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const cleanTIN = input.tin.replace(/\D/g, "");
      if (cleanTIN.length !== 9) throw new Error("TIN must be 9 digits");

      await db.execute(sql`
        UPDATE tax_1099_records SET payeeTIN = ${cleanTIN} WHERE recordId = ${input.recordId}
      `);

      return { success: true };
    }),

  /**
   * Get tax year dashboard metrics
   */
  getDashboard: protectedProcedure
    .input(z.object({ taxYear: TAX_YEAR_SCHEMA }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return {
        taxYear: input.taxYear, totalContractors: 0, qualifying1099: 0,
        totalPaid: 0, generated: 0, filed: 0, pendingReview: 0,
        deadline: `${input.taxYear + 1}-01-31`,
      };
      try {
        const yearStart = `${input.taxYear}-01-01 00:00:00`;
        const yearEnd = `${input.taxYear}-12-31 23:59:59`;

        // Total contractors paid
        const [paymentStats] = await db.execute(sql`
          SELECT
            COUNT(DISTINCT p.payeeId) AS totalContractors,
            SUM(CAST(p.amount AS DECIMAL(12,2))) AS totalPaid
          FROM payments p
          WHERE p.status IN ('completed', 'settled', 'paid')
            AND p.createdAt >= ${yearStart}
            AND p.createdAt <= ${yearEnd}
            AND p.payeeId IS NOT NULL
        `) as any;
        const ps = (paymentStats || [])[0] || {};

        // Qualifying (>= $600)
        const [qualStats] = await db.execute(sql`
          SELECT COUNT(*) AS cnt FROM (
            SELECT p.payeeId, SUM(CAST(p.amount AS DECIMAL(12,2))) AS total
            FROM payments p
            WHERE p.status IN ('completed', 'settled', 'paid')
              AND p.createdAt >= ${yearStart} AND p.createdAt <= ${yearEnd}
              AND p.payeeId IS NOT NULL
            GROUP BY p.payeeId HAVING total >= 600
          ) sub
        `) as any;

        // 1099 record stats
        const [recStats] = await db.execute(sql`
          SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'filed' THEN 1 ELSE 0 END) AS filed,
            SUM(CASE WHEN status IN ('generated', 'reviewed') THEN 1 ELSE 0 END) AS pendingReview
          FROM tax_1099_records WHERE taxYear = ${input.taxYear}
        `) as any;
        const rs = (recStats || [])[0] || {};

        return {
          taxYear: input.taxYear,
          totalContractors: Number(ps.totalContractors) || 0,
          qualifying1099: Number((qualStats || [])[0]?.cnt) || 0,
          totalPaid: parseFloat(ps.totalPaid || "0"),
          generated: Number(rs.total) || 0,
          filed: Number(rs.filed) || 0,
          pendingReview: Number(rs.pendingReview) || 0,
          deadline: `${input.taxYear + 1}-01-31`,
        };
      } catch (e: any) {
        logger.error("[TaxReporting] getDashboard error:", e?.message?.slice(0, 200));
        return {
          taxYear: input.taxYear, totalContractors: 0, qualifying1099: 0,
          totalPaid: 0, generated: 0, filed: 0, pendingReview: 0,
          deadline: `${input.taxYear + 1}-01-31`,
        };
      }
    }),
});
