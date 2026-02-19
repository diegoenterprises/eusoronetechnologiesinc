/**
 * FMCSA Carrier Census Integration
 * Source: FMCSA QCMobile API
 * Auth: API Key required (FMCSA_WEBSERVICE_KEY)
 * Refresh: On-demand (lookup by DOT# or MC#)
 * Data: Full carrier profile, fleet size, authority status
 */
import { getDb } from "../../db";
import { hzCarrierSafety } from "../../../drizzle/schema";
import { sql } from "drizzle-orm";

const FMCSA_BASE = "https://mobile.fmcsa.dot.gov/qc/services";

export interface CarrierProfile {
  dotNumber: string;
  legalName: string;
  dbaName?: string;
  physicalState: string;
  totalDrivers: number;
  totalPowerUnits: number;
  carrierOperation: string;
  hmFlag: boolean;
  mcNumber?: string;
  commonAuthorityStatus?: string;
  contractAuthorityStatus?: string;
  brokerAuthorityStatus?: string;
}

export async function lookupCarrier(dotNumber: string): Promise<CarrierProfile | null> {
  const apiKey = process.env.FMCSA_WEBSERVICE_KEY;
  if (!apiKey) {
    console.warn("[FMCSA-Census] No FMCSA_WEBSERVICE_KEY set");
    return null;
  }

  try {
    const response = await fetch(
      `${FMCSA_BASE}/carriers/${dotNumber}?webKey=${apiKey}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!response.ok) return null;

    const data = await response.json();
    const c = data.content?.carrier;
    if (!c) return null;

    return {
      dotNumber: String(c.dotNumber),
      legalName: c.legalName || "",
      dbaName: c.dbaName || undefined,
      physicalState: c.phyState || "",
      totalDrivers: Number(c.totalDrivers) || 0,
      totalPowerUnits: Number(c.totalPowerUnits) || 0,
      carrierOperation: c.carrierOperation || "",
      hmFlag: c.hmFlag === "Y",
      mcNumber: c.mcNumber ? String(c.mcNumber) : undefined,
      commonAuthorityStatus: c.commonAuthorityStatus || undefined,
      contractAuthorityStatus: c.contractAuthorityStatus || undefined,
      brokerAuthorityStatus: c.brokerAuthorityStatus || undefined,
    };
  } catch (e) {
    console.error(`[FMCSA-Census] Failed to lookup DOT# ${dotNumber}:`, e);
    return null;
  }
}

export async function lookupAndCacheCarrier(dotNumber: string): Promise<CarrierProfile | null> {
  const profile = await lookupCarrier(dotNumber);
  if (!profile) return null;

  const db = await getDb();
  if (!db) return profile;

  try {
    await db
      .insert(hzCarrierSafety)
      .values({
        dotNumber: profile.dotNumber,
        legalName: profile.legalName,
        dbaName: profile.dbaName || null,
        physicalState: profile.physicalState,
        commonAuthority: profile.commonAuthorityStatus === "ACTIVE",
        contractAuthority: profile.contractAuthorityStatus === "ACTIVE",
        brokerAuthority: profile.brokerAuthorityStatus === "ACTIVE",
        hazmatAuthority: profile.hmFlag,
      })
      .onDuplicateKeyUpdate({
        set: {
          legalName: profile.legalName,
          dbaName: profile.dbaName || null,
          commonAuthority: profile.commonAuthorityStatus === "ACTIVE",
          contractAuthority: profile.contractAuthorityStatus === "ACTIVE",
          hazmatAuthority: profile.hmFlag,
          fetchedAt: new Date(),
        },
      });
  } catch {
    // Cache failure is non-critical
  }

  return profile;
}
