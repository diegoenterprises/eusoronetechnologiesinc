/**
 * EPA Facilities Integration (TRI + ECHO)
 * Source: EPA Envirofacts & ECHO APIs
 * Auth: Optional API key (EPA_API_KEY)
 * Refresh: Daily at 4 AM
 */
import { getDb } from "../../db";
import { hzEpaFacilities } from "../../../drizzle/schema";
import { sql, eq } from "drizzle-orm";

const EPA_BASE = "https://data.epa.gov/efservice";
const ECHO_BASE = "https://echo.epa.gov/api";

// Top 10 states for hazmat logistics
const TARGET_STATES = ["TX", "LA", "CA", "PA", "OH", "IL", "NJ", "GA", "FL", "MI"];

export async function fetchTRIFacilities(stateCode: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const url = `${EPA_BASE}/tri_facility/state_abbr/${stateCode}/rows/0:200/JSON`;

  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) return;

  let facilities: any[];
  try {
    facilities = await response.json();
  } catch {
    return;
  }

  if (!Array.isArray(facilities)) return;

  for (const f of facilities.slice(0, 200)) {
    try {
      await db
        .insert(hzEpaFacilities)
        .values({
          registryId: f.TRI_FACILITY_ID || `epa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          facilityName: f.FACILITY_NAME || "Unknown",
          stateCode: f.STATE_ABBR || stateCode,
          city: f.CITY_NAME || null,
          county: f.COUNTY_NAME || null,
          zipCode: f.ZIP_CODE || null,
          latitude: f.LATITUDE ? String(f.LATITUDE) : null,
          longitude: f.LONGITUDE ? String(f.LONGITUDE) : null,
          industrySector: f.INDUSTRY_SECTOR || null,
          naicsCodes: f.NAICS_CODES ? JSON.stringify(f.NAICS_CODES.split(",")) : null,
          triFacility: true,
          totalReleasesLbs: f.TOTAL_RELEASES ? String(f.TOTAL_RELEASES) : null,
          airReleasesLbs: f.AIR_RELEASES ? String(f.AIR_RELEASES) : null,
          waterReleasesLbs: f.WATER_RELEASES ? String(f.WATER_RELEASES) : null,
          landReleasesLbs: f.LAND_RELEASES ? String(f.LAND_RELEASES) : null,
        })
        .onDuplicateKeyUpdate({
          set: {
            totalReleasesLbs: f.TOTAL_RELEASES ? String(f.TOTAL_RELEASES) : null,
            fetchedAt: new Date(),
          },
        });
    } catch {
      // Skip individual facility errors
    }
  }
}

export async function fetchECHOCompliance(stateCode: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const url = new URL(`${ECHO_BASE}/dfr_rest_services.get_dfr`);
  url.searchParams.set("output", "JSON");
  url.searchParams.set("p_st", stateCode);
  url.searchParams.set("p_med", "ALL");

  const response = await fetch(url.toString(), { signal: AbortSignal.timeout(30000) });
  if (!response.ok) return;

  let data: any;
  try {
    data = await response.json();
  } catch {
    return;
  }

  const facilities = data?.Results?.Facilities || [];

  for (const f of facilities.slice(0, 200)) {
    if (!f.FacilityId) continue;
    try {
      await db
        .update(hzEpaFacilities)
        .set({
          complianceStatus: f.DfrCurrSvFlag === "Y" ? "Violation" : "In Compliance",
          qtrsInNoncompliance: parseInt(f.QtrsWithNC) || 0,
          informalEnforcementActions: parseInt(f.InformalCount) || 0,
          formalEnforcementActions: parseInt(f.FormalCount) || 0,
          penaltiesLast5yr: f.TotalPenalties ? String(f.TotalPenalties) : null,
          rcraHandler: f.RCRAFlag === "Y",
          npdesPermit: f.NPDESFlag === "Y",
          caaPermit: f.CAAFlag === "Y",
          lastInspectionDate: f.LastInspDate ? new Date(f.LastInspDate) : null,
        })
        .where(eq(hzEpaFacilities.registryId, f.FacilityId));
    } catch {
      // Skip individual compliance errors
    }
  }
}

export async function syncAllEPAFacilities(): Promise<void> {
  for (const state of TARGET_STATES) {
    await fetchTRIFacilities(state);
    await fetchECHOCompliance(state);
    // Rate limit between states
    await new Promise((r) => setTimeout(r, 500));
  }
}
