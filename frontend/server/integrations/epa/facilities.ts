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

// All 50 states + DC for nationwide coverage
const TARGET_STATES = [
  "TX", "LA", "CA", "PA", "OH", "IL", "NJ", "GA", "FL", "MI",
  "IN", "WV", "KY", "OK", "ND", "NY", "NC", "VA", "WA", "CO",
  "AZ", "NV", "NM", "AL", "AR", "MS", "MO", "TN", "SC", "WI",
  "MN", "IA", "KS", "NE", "OR", "UT", "CT", "MA", "MD", "DE",
  "NH", "VT", "ME", "RI", "MT", "ID", "WY", "SD", "HI", "AK", "DC",
];

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

  let inserted = 0;
  for (const f of facilities.slice(0, 200)) {
    try {
      const id = f.tri_facility_id || f.TRI_FACILITY_ID || `epa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const name = f.facility_name || f.FACILITY_NAME || "Unknown";
      const lat = f.latitude ?? f.LATITUDE;
      const lng = f.longitude ?? f.LONGITUDE;
      await db
        .insert(hzEpaFacilities)
        .values({
          registryId: String(id).slice(0, 20),
          facilityName: String(name).slice(0, 255),
          stateCode: (f.state_abbr || f.STATE_ABBR || stateCode).slice(0, 2),
          city: (f.city_name || f.CITY_NAME || null)?.slice(0, 100) || null,
          county: (f.county_name || f.COUNTY_NAME || null)?.slice(0, 100) || null,
          zipCode: (f.zip_code || f.ZIP_CODE || null)?.slice(0, 10) || null,
          latitude: lat != null ? String(lat) : null,
          longitude: lng != null ? String(lng) : null,
          industrySector: (f.industry_sector || f.INDUSTRY_SECTOR || null)?.slice(0, 100) || null,
          naicsCodes: f.naics_codes || f.NAICS_CODES ? JSON.stringify(String(f.naics_codes || f.NAICS_CODES).split(",")) : null,
          triFacility: true,
          totalReleasesLbs: f.total_releases || f.TOTAL_RELEASES ? String(f.total_releases || f.TOTAL_RELEASES) : null,
          airReleasesLbs: f.air_releases || f.AIR_RELEASES ? String(f.air_releases || f.AIR_RELEASES) : null,
          waterReleasesLbs: f.water_releases || f.WATER_RELEASES ? String(f.water_releases || f.WATER_RELEASES) : null,
          landReleasesLbs: f.land_releases || f.LAND_RELEASES ? String(f.land_releases || f.LAND_RELEASES) : null,
        })
        .onDuplicateKeyUpdate({
          set: {
            totalReleasesLbs: f.total_releases || f.TOTAL_RELEASES ? String(f.total_releases || f.TOTAL_RELEASES) : null,
            fetchedAt: new Date(),
          },
        });
      inserted++;
    } catch (e) {
      console.error(`[EPA-TRI] Insert error:`, e instanceof Error ? e.message : e);
    }
  }
  console.log(`[EPA-TRI] ${stateCode}: ${inserted}/${facilities.length} facilities inserted`);
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
