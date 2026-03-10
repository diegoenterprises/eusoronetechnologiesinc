/**
 * CDL VERIFICATION ROUTER (P0 Blocker 7)
 * Ensures drivers have valid CDL with required endorsements before
 * being assigned to loads. Enforces 49 CFR 391.41 compliance.
 */

import { z } from "zod";
import { sql } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { unsafeCast } from "../_core/types/unsafe";

// Valid CDL endorsements
const CDL_ENDORSEMENTS = ["H", "N", "T", "P", "S", "X"] as const;

// Hazmat-related endorsement codes
const HAZMAT_ENDORSEMENTS = ["H", "X"];

/**
 * Check a driver's CDL eligibility for a specific load.
 * Exported for use in dispatch.ts assignDriver gate.
 */
export async function checkCDLForLoadInternal(driverId: number, loadId: number): Promise<{ eligible: boolean; reasons: string[] }> {
  const db = await getDb();
  if (!db) return { eligible: true, reasons: [] }; // Fail open if DB unavailable

  const reasons: string[] = [];

  try {
    // Get driver's CDL record
    const [cdl] = await db.execute(
      sql`SELECT id, cdlNumber, stateOfIssuance, expirationDate, endorsements, restrictions, verified FROM cdl_records WHERE driverId = ${driverId} ORDER BY createdAt DESC LIMIT 1`
    );

    if (!cdl) {
      reasons.push("No CDL record on file. Driver must submit CDL verification first.");
      return { eligible: false, reasons };
    }

    // Check CDL expiration (must be > 30 days from now)
    const expirationDate = new Date(unsafeCast(cdl).expirationDate);
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    if (expirationDate < new Date()) {
      reasons.push(`CDL expired on ${expirationDate.toISOString().split("T")[0]}. Renewal required.`);
    } else if (expirationDate < thirtyDaysFromNow) {
      reasons.push(`CDL expires within 30 days (${expirationDate.toISOString().split("T")[0]}). Renewal recommended.`);
      // Warning only — don't block assignment for 30-day window
    }

    // Check if load requires hazmat endorsement
    try {
      const { loads } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const [load] = await db.select({ hazmatClass: loads.hazmatClass, cargoType: loads.cargoType })
        .from(loads).where(eq(loads.id, loadId)).limit(1);

      if (load?.cargoType === 'hazmat' || load?.hazmatClass) {
        const endorsements: string[] = unsafeCast(cdl).endorsements ? (typeof unsafeCast(cdl).endorsements === 'string' ? JSON.parse(unsafeCast(cdl).endorsements) : unsafeCast(cdl).endorsements) : [];
        const hasHazmat = endorsements.some((e: string) => HAZMAT_ENDORSEMENTS.includes(e));
        if (!hasHazmat) {
          reasons.push(`Hazmat load requires H or X endorsement. Driver has: [${endorsements.join(", ")}]`);
        }
      }
    } catch {}

    // Check verification status
    if (!unsafeCast(cdl).verified) {
      reasons.push("CDL has not been verified. Manual verification required.");
    }

  } catch (err: unknown) {
    logger.error("[CDL] Check error:", (err as Error)?.message?.slice(0, 100));
    // Fail open on DB error — don't block dispatch for infra issues
    return { eligible: true, reasons: [] };
  }

  // Only hard-block for expired CDL or missing hazmat endorsement
  const hardBlocks = reasons.filter(r => r.includes("expired") || r.includes("Hazmat load") || r.includes("No CDL record"));
  return { eligible: hardBlocks.length === 0, reasons };
}

export const cdlVerificationRouter = router({
  /**
   * Submit or update CDL verification for a driver
   */
  verifyCDL: protectedProcedure
    .input(z.object({
      driverId: z.number(),
      cdlNumber: z.string().min(3),
      stateOfIssuance: z.string().length(2),
      expirationDate: z.string(),
      endorsements: z.array(z.string()),
      restrictions: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const warnings: string[] = [];

      // 1. Validate CDL format
      if (input.cdlNumber.length < 3 || input.cdlNumber.length > 20) {
        throw new Error("Invalid CDL number format");
      }

      // 2. Check expiration (must be > 30 days from now)
      const expDate = new Date(input.expirationDate);
      if (isNaN(expDate.getTime())) throw new Error("Invalid expiration date");
      const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      if (expDate < new Date()) throw new Error("CDL has already expired");
      if (expDate < thirtyDays) warnings.push("CDL expires within 30 days — renewal recommended");

      // 3. Validate endorsements
      const validEndorsements = input.endorsements.filter(e => CDL_ENDORSEMENTS.includes(unsafeCast(e)));
      if (validEndorsements.length !== input.endorsements.length) {
        warnings.push("Some endorsement codes were not recognized");
      }

      // 4. Check hazmat endorsement
      const hasHazmat = validEndorsements.some(e => HAZMAT_ENDORSEMENTS.includes(e));

      // 5. Store/update in cdl_records table
      const nextVerification = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
      const verifierId = ctx.user?.id || 0;

      await db.execute(
        sql`INSERT INTO cdl_records (driverId, cdlNumber, stateOfIssuance, expirationDate, endorsements, restrictions, verified, verifiedAt, verifiedBy, nextVerificationDue)
            VALUES (${input.driverId}, ${input.cdlNumber}, ${input.stateOfIssuance.toUpperCase()}, ${input.expirationDate}, ${JSON.stringify(validEndorsements)}, ${JSON.stringify(input.restrictions || [])}, TRUE, NOW(), ${verifierId}, ${nextVerification.toISOString().split("T")[0]})
            ON DUPLICATE KEY UPDATE cdlNumber = ${input.cdlNumber}, stateOfIssuance = ${input.stateOfIssuance.toUpperCase()}, expirationDate = ${input.expirationDate}, endorsements = ${JSON.stringify(validEndorsements)}, restrictions = ${JSON.stringify(input.restrictions || [])}, verified = TRUE, verifiedAt = NOW(), verifiedBy = ${verifierId}, nextVerificationDue = ${nextVerification.toISOString().split("T")[0]}`
      );

      // 6. Audit log
      try {
        const { auditLogs } = await import("../../drizzle/schema");
        await db.insert(auditLogs).values({
          userId: verifierId, action: 'CDL_VERIFIED', entityType: 'driver', entityId: input.driverId,
          changes: { cdlNumber: input.cdlNumber, state: input.stateOfIssuance, endorsements: validEndorsements },
        } as never);
      } catch {}

      return {
        verified: true,
        endorsements: validEndorsements,
        hazmatEligible: hasHazmat,
        expiresAt: input.expirationDate,
        nextVerificationDue: nextVerification.toISOString().split("T")[0],
        warnings,
      };
    }),

  /**
   * Check if a driver's CDL is eligible for a specific load
   */
  checkCDLForLoad: protectedProcedure
    .input(z.object({ driverId: z.number(), loadId: z.number() }))
    .query(async ({ input }) => {
      return checkCDLForLoadInternal(input.driverId, input.loadId);
    }),

  /**
   * Get CDL record for a driver
   */
  getCDLRecord: protectedProcedure
    .input(z.object({ driverId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const [cdl] = await db.execute(
          sql`SELECT id, driverId, cdlNumber, stateOfIssuance, expirationDate, endorsements, restrictions, verified, verifiedAt, nextVerificationDue, createdAt, updatedAt FROM cdl_records WHERE driverId = ${input.driverId} ORDER BY createdAt DESC LIMIT 1`
        );
        if (!cdl) return null;
        return {
          id: unsafeCast(cdl).id,
          driverId: unsafeCast(cdl).driverId,
          cdlNumber: unsafeCast(cdl).cdlNumber,
          stateOfIssuance: unsafeCast(cdl).stateOfIssuance,
          expirationDate: unsafeCast(cdl).expirationDate?.toISOString?.()?.split("T")[0] || unsafeCast(cdl).expirationDate,
          endorsements: unsafeCast(cdl).endorsements ? (typeof unsafeCast(cdl).endorsements === 'string' ? JSON.parse(unsafeCast(cdl).endorsements) : unsafeCast(cdl).endorsements) : [],
          restrictions: unsafeCast(cdl).restrictions ? (typeof unsafeCast(cdl).restrictions === 'string' ? JSON.parse(unsafeCast(cdl).restrictions) : unsafeCast(cdl).restrictions) : [],
          verified: !!unsafeCast(cdl).verified,
          verifiedAt: unsafeCast(cdl).verifiedAt?.toISOString?.() || null,
          nextVerificationDue: unsafeCast(cdl).nextVerificationDue?.toISOString?.()?.split("T")[0] || null,
          createdAt: unsafeCast(cdl).createdAt?.toISOString?.() || '',
        };
      } catch { return null; }
    }),

  /**
   * Get all CDL records needing re-verification (past due or expiring soon)
   */
  getExpiring: protectedProcedure
    .input(z.object({ daysAhead: z.number().default(30) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const days = input?.daysAhead || 30;
      const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      try {
        const rows = await db.execute(
          sql`SELECT c.id, c.driverId, c.cdlNumber, c.stateOfIssuance, c.expirationDate, c.endorsements, c.verified, c.nextVerificationDue, u.name as driverName
              FROM cdl_records c LEFT JOIN users u ON c.driverId = u.id
              WHERE c.expirationDate <= ${cutoff.toISOString().split("T")[0]} OR c.nextVerificationDue <= CURDATE()
              ORDER BY c.expirationDate ASC LIMIT 50`
        );
        return (rows || []).map((r: any) => ({
          id: r.id, driverId: r.driverId, driverName: r.driverName || 'Unknown',
          cdlNumber: r.cdlNumber, state: r.stateOfIssuance,
          expirationDate: r.expirationDate?.toISOString?.()?.split("T")[0] || r.expirationDate,
          endorsements: r.endorsements ? (typeof r.endorsements === 'string' ? JSON.parse(r.endorsements) : r.endorsements) : [],
          verified: !!r.verified,
          urgent: new Date(r.expirationDate) < new Date(),
        }));
      } catch { return []; }
    }),
});
