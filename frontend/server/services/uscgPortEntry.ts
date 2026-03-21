/**
 * USCG Port Entry Requirements
 * Validates vessel compliance before US port entry per 33 CFR Part 160
 */
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { vesselInspections, vesselISPSRecords, vesselInsurance, vessels } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export interface USCGPortEntryCheck {
  vesselId: number;
  vesselName: string;
  overallStatus: 'cleared' | 'conditional' | 'denied';
  checks: Array<{
    requirement: string;
    regulation: string;
    status: 'pass' | 'fail' | 'warning' | 'unknown';
    details: string;
  }>;
  denialReasons: string[];
}

export async function validateUSCGPortEntry(vesselId: number): Promise<USCGPortEntryCheck> {
  const db = await getDb();
  const checks: USCGPortEntryCheck['checks'] = [];
  const denialReasons: string[] = [];

  if (!db) {
    return {
      vesselId,
      vesselName: 'Unknown',
      overallStatus: 'denied',
      checks: [{ requirement: 'Database', regulation: 'N/A', status: 'fail', details: 'Unable to verify — database unavailable' }],
      denialReasons: ['Database unavailable'],
    };
  }

  const [vessel] = await db.select().from(vessels).where(eq(vessels.id, vesselId)).limit(1);
  const vesselName = (vessel as any)?.name || 'Unknown';

  // 1. ISPS Security Certificate (ISSC)
  const [isps] = await db.select().from(vesselISPSRecords).where(eq(vesselISPSRecords.vesselId, vesselId)).limit(1);
  if ((isps as any)?.isscExpiry && new Date((isps as any).isscExpiry) > new Date()) {
    checks.push({ requirement: 'ISPS Security Certificate', regulation: '33 CFR 104', status: 'pass', details: `Valid until ${(isps as any).isscExpiry}` });
  } else {
    checks.push({ requirement: 'ISPS Security Certificate', regulation: '33 CFR 104', status: 'fail', details: 'ISSC expired or missing' });
    denialReasons.push('ISSC certificate expired or not on file');
  }

  // 2. P&I Insurance
  const piInsurance = await db.select().from(vesselInsurance)
    .where(and(
      eq(vesselInsurance.vesselId, vesselId),
      eq(vesselInsurance.policyType, 'p_and_i' as any),
      eq(vesselInsurance.status, 'active' as any),
    ))
    .limit(1);
  checks.push({
    requirement: 'P&I Insurance',
    regulation: 'OPA 90',
    status: piInsurance.length > 0 ? 'pass' : 'fail',
    details: piInsurance.length > 0 ? 'Active P&I coverage on file' : 'No active P&I insurance — required under OPA 90',
  });
  if (piInsurance.length === 0) denialReasons.push('No P&I insurance');

  // 3. Recent PSC Inspection
  const [lastInspection] = await db.select().from(vesselInspections)
    .where(and(
      eq(vesselInspections.vesselId, vesselId),
      eq(vesselInspections.inspectionType, 'psc' as any),
    ))
    .orderBy(desc(vesselInspections.inspectionDate))
    .limit(1);
  if (lastInspection) {
    const detained = (lastInspection as any).detentionDays && (lastInspection as any).detentionDays > 0;
    checks.push({
      requirement: 'Port State Control',
      regulation: '33 CFR 160',
      status: detained ? 'warning' : 'pass',
      details: detained
        ? `Last PSC resulted in ${(lastInspection as any).detentionDays}-day detention`
        : `Last PSC: ${(lastInspection as any).result}`,
    });
  } else {
    checks.push({ requirement: 'Port State Control', regulation: '33 CFR 160', status: 'unknown', details: 'No PSC inspection history' });
  }

  // 4. 96-Hour Advance Notice of Arrival
  checks.push({
    requirement: '96-Hour ANOA',
    regulation: '33 CFR 160.212',
    status: 'warning',
    details: 'Advance Notice of Arrival must be filed 96 hours before entry — verify filing status',
  });

  const overallStatus = denialReasons.length > 0
    ? 'denied'
    : checks.some(c => c.status === 'warning')
      ? 'conditional'
      : 'cleared';

  logger.info(`[USCG] Port entry check for vessel ${vesselId} (${vesselName}): ${overallStatus}`);

  return { vesselId, vesselName, overallStatus, checks, denialReasons };
}
