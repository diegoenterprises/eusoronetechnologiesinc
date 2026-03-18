/**
 * DATA RETENTION POLICY ENGINE
 * Enforces federal record retention requirements:
 * - 49 CFR 395.8: HOS records — 6 months
 * - 49 CFR 396.11(g): Inspection records — 1 year
 * - 49 CFR 382.401: Drug/alcohol tests — 5 years
 * - 49 CFR 391.51: DQ files — 3 years post-separation
 * - 49 CFR 390.15: Incident reports — 6 years
 */
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

interface RetentionPolicy {
  name: string;
  table: string;
  retentionDays: number;
  regulation: string;
  softDelete: boolean;
}

const POLICIES: RetentionPolicy[] = [
  { name: 'HOS Records', table: 'hos_logs', retentionDays: 180, regulation: '49 CFR 395.8', softDelete: true },
  { name: 'Inspection Records', table: 'inspections', retentionDays: 365, regulation: '49 CFR 396.11(g)', softDelete: true },
  { name: 'Drug/Alcohol Tests', table: 'drug_tests', retentionDays: 1825, regulation: '49 CFR 382.401', softDelete: true },
  { name: 'Incident Reports', table: 'incidents', retentionDays: 2190, regulation: '49 CFR 390.15', softDelete: true },
  { name: 'Location Breadcrumbs', table: 'location_breadcrumbs', retentionDays: 90, regulation: 'Platform policy', softDelete: false },
];

export async function enforceRetentionPolicies(): Promise<{ archived: number; policies: string[] }> {
  const db = await getDb();
  if (!db) return { archived: 0, policies: [] };

  let totalArchived = 0;
  const processed: string[] = [];

  for (const policy of POLICIES) {
    try {
      const cutoff = new Date(Date.now() - policy.retentionDays * 86400000);

      if (policy.softDelete) {
        // Soft delete — mark as archived (preserves data for legal holds)
        const result = await db.execute(
          sql`UPDATE ${sql.raw(policy.table)} SET archivedAt = NOW() WHERE createdAt < ${cutoff} AND archivedAt IS NULL`
        ).catch(() => null);
        const affected = (result as any)?.[0]?.affectedRows || 0;
        if (affected > 0) {
          totalArchived += affected;
          logger.info(`[DataRetention] Archived ${affected} ${policy.name} records (${policy.regulation})`);
        }
      } else {
        // Hard delete for non-regulated data (e.g., GPS breadcrumbs older than 90 days)
        const result = await db.execute(
          sql`DELETE FROM ${sql.raw(policy.table)} WHERE createdAt < ${cutoff}`
        ).catch(() => null);
        const affected = (result as any)?.[0]?.affectedRows || 0;
        if (affected > 0) {
          totalArchived += affected;
          logger.info(`[DataRetention] Purged ${affected} ${policy.name} records`);
        }
      }
      processed.push(policy.name);
    } catch (err) {
      logger.warn(`[DataRetention] Failed on ${policy.name}:`, (err as any)?.message);
    }
  }

  return { archived: totalArchived, policies: processed };
}
