/**
 * FMCSA Carrier Safety Integration
 * Source: Federal Motor Carrier Safety Administration
 * Auth: Web Services Key (FMCSA_WEBSERVICE_KEY)
 * Refresh: Daily at 2 AM
 */
import { getDb } from "../../db";
import { hzCarrierSafety, loads } from "../../../drizzle/schema";
import { sql } from "drizzle-orm";

const FMCSA_BASE = "https://mobile.fmcsa.dot.gov/qc/services";

export async function fetchCarrierSafety(dotNumber: string): Promise<any | null> {
  const key = process.env.FMCSA_WEBSERVICE_KEY;
  if (!key) return null;

  try {
    const [basicsRes, profileRes] = await Promise.all([
      fetch(`${FMCSA_BASE}/carriers/${dotNumber}/basics?webKey=${key}`, { signal: AbortSignal.timeout(10000) }),
      fetch(`${FMCSA_BASE}/carriers/${dotNumber}?webKey=${key}`, { signal: AbortSignal.timeout(10000) }),
    ]);

    const basicsData = basicsRes.ok ? await basicsRes.json() : {};
    const profileData = profileRes.ok ? await profileRes.json() : {};
    const carrier = profileData.carrier || {};
    const basics = basicsData.content || {};

    return {
      dotNumber,
      legalName: carrier.legalName || `DOT-${dotNumber}`,
      dbaName: carrier.dbaName || null,
      unsafeDrivingScore: basics.unsafeDrivingBasic?.measureValue ?? null,
      hosComplianceScore: basics.hosComplianceBasic?.measureValue ?? null,
      driverFitnessScore: basics.driverFitnessBasic?.measureValue ?? null,
      controlledSubstancesScore: basics.drugAlcoholBasic?.measureValue ?? null,
      vehicleMaintenanceScore: basics.vehicleMaintBasic?.measureValue ?? null,
      hazmatComplianceScore: basics.hmcBasic?.measureValue ?? null,
      crashIndicatorScore: basics.crashIndicatorBasic?.measureValue ?? null,
      safetyRating: carrier.safetyRating || "None",
      totalInspections: carrier.totalInspections || 0,
      driverInspections: carrier.driverInspections || 0,
      vehicleInspections: carrier.vehicleInspections || 0,
      hazmatInspections: carrier.hazmatInspections || 0,
      driverOosRate: carrier.driverOosRate || null,
      vehicleOosRate: carrier.vehicleOosRate || null,
      totalCrashes: carrier.crashTotal || 0,
      fatalCrashes: carrier.fatalCrash || 0,
      injuryCrashes: carrier.injCrash || 0,
      towCrashes: carrier.towawayCrash || 0,
      commonAuthority: carrier.commonAuthorityStatus === "A",
      contractAuthority: carrier.contractAuthorityStatus === "A",
      brokerAuthority: carrier.brokerAuthorityStatus === "A",
      hazmatAuthority: carrier.hmFlag === "Y",
      physicalState: carrier.phyState || null,
      physicalCity: carrier.phyCity || null,
      physicalZip: carrier.phyZipcode || null,
    };
  } catch {
    return null;
  }
}

export async function syncCarrierSafetyData(): Promise<void> {
  const key = process.env.FMCSA_WEBSERVICE_KEY;
  if (!key) {
    console.warn("[FMCSA] No FMCSA_WEBSERVICE_KEY set, skipping carrier safety sync");
    return;
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get unique DOT numbers from active loads
  let carriers: { dotNum: string | null }[] = [];
  try {
    carriers = await db
      .select({ dotNum: sql<string>`DISTINCT JSON_EXTRACT(metadata, '$.carrierDotNumber')` })
      .from(loads)
      .where(sql`JSON_EXTRACT(metadata, '$.carrierDotNumber') IS NOT NULL`)
      .limit(100);
  } catch {
    // If metadata column doesn't have DOT numbers, just return
    console.log("[FMCSA] No carrier DOT numbers found in loads, skipping");
    return;
  }

  for (const { dotNum } of carriers) {
    if (!dotNum) continue;
    const dot = dotNum.replace(/"/g, "");

    try {
      const data = await fetchCarrierSafety(dot);
      if (!data) continue;

      await db
        .insert(hzCarrierSafety)
        .values({
          ...data,
          unsafeDrivingScore: data.unsafeDrivingScore != null ? String(data.unsafeDrivingScore) : null,
          hosComplianceScore: data.hosComplianceScore != null ? String(data.hosComplianceScore) : null,
          driverFitnessScore: data.driverFitnessScore != null ? String(data.driverFitnessScore) : null,
          controlledSubstancesScore: data.controlledSubstancesScore != null ? String(data.controlledSubstancesScore) : null,
          vehicleMaintenanceScore: data.vehicleMaintenanceScore != null ? String(data.vehicleMaintenanceScore) : null,
          hazmatComplianceScore: data.hazmatComplianceScore != null ? String(data.hazmatComplianceScore) : null,
          crashIndicatorScore: data.crashIndicatorScore != null ? String(data.crashIndicatorScore) : null,
          driverOosRate: data.driverOosRate != null ? String(data.driverOosRate) : null,
          vehicleOosRate: data.vehicleOosRate != null ? String(data.vehicleOosRate) : null,
        })
        .onDuplicateKeyUpdate({
          set: {
            unsafeDrivingScore: data.unsafeDrivingScore != null ? String(data.unsafeDrivingScore) : null,
            hosComplianceScore: data.hosComplianceScore != null ? String(data.hosComplianceScore) : null,
            safetyRating: data.safetyRating,
            totalInspections: data.totalInspections,
            fetchedAt: new Date(),
          },
        });

      // Rate limit: 100ms between requests
      await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      console.error(`[FMCSA] Failed for DOT ${dot}:`, err);
    }
  }
}
