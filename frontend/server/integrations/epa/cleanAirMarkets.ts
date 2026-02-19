/**
 * EPA Clean Air Markets Program Data (CAMPD) Integration
 * Source: https://api.epa.gov/easey/
 * Auth: API key required (CAMPD_API_KEY)
 * Refresh: Daily at 5:30 AM
 *
 * WHY THIS MATTERS FOR HAZMAT LOGISTICS:
 * - Identifies refineries, power plants, chemical plants with emissions data
 * - These facilities are major origins/destinations for hazmat loads
 * - SO2/NOx hotspots = industrial corridors = more load opportunities
 * - Emission density per zone = industrial activity indicator
 * - Compliance data helps safety/compliance officers assess route risk
 */
import { getDb } from "../../db";
import { hzEmissions } from "../../../drizzle/schema";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";

const CAMPD_BASE = "https://api.epa.gov/easey";

// Top hazmat logistics states
const TARGET_STATES = ["TX", "LA", "CA", "PA", "OH", "IL", "NJ", "GA", "FL", "MI", "IN", "WV", "KY", "OK", "ND"];

function getApiKey(): string {
  return process.env.CAMPD_API_KEY || "";
}

/**
 * Fetch annual emissions from CAMPD for a given state and year.
 * Returns facility-level SO2, NOx, CO2 tons + operating data.
 */
export async function fetchAnnualEmissions(stateCode: string, year?: number): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[CAMPD] No CAMPD_API_KEY set, skipping emissions fetch");
    return;
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const reportYear = year || new Date().getFullYear() - 1;

  const url = new URL(`${CAMPD_BASE}/emissions-mgmt/emissions/apportioned/annual`);
  url.searchParams.set("stateCode", stateCode);
  url.searchParams.set("year", String(reportYear));
  url.searchParams.set("page", "1");
  url.searchParams.set("perPage", "500");

  const response = await fetch(url.toString(), {
    headers: {
      "x-api-key": apiKey,
      "Accept": "application/json",
    },
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    if (response.status === 429) {
      console.warn(`[CAMPD] Rate limited for ${stateCode}, will retry next cycle`);
      return;
    }
    console.error(`[CAMPD] API error ${response.status} for ${stateCode}`);
    return;
  }

  let records: any[];
  try {
    records = await response.json();
  } catch {
    return;
  }

  if (!Array.isArray(records)) return;

  let inserted = 0;
  for (const r of records) {
    if (!r.facilityId) continue;
    try {
      const id = `campd-${r.facilityId}-${reportYear}`;
      await db
        .insert(hzEmissions)
        .values({
          id,
          facilityId: String(r.facilityId),
          facilityName: r.facilityName || "Unknown",
          stateCode: r.stateCode || stateCode,
          countyName: r.countyName || null,
          latitude: r.latitude ? String(r.latitude) : null,
          longitude: r.longitude ? String(r.longitude) : null,
          fuelTypes: r.primaryFuelInfo ? JSON.stringify([r.primaryFuelInfo]) : null,
          unitTypes: r.unitType ? JSON.stringify([r.unitType]) : null,
          so2Tons: r.so2Mass != null ? String(r.so2Mass) : null,
          noxTons: r.noxMass != null ? String(r.noxMass) : null,
          co2Tons: r.co2Mass != null ? String(r.co2Mass) : null,
          hgLbs: r.hgMass != null ? String(r.hgMass) : null,
          grossLoadMwh: r.grossLoad != null ? String(r.grossLoad) : null,
          heatInputMmbtu: r.heatInput != null ? String(r.heatInput) : null,
          operatingHours: r.opTime != null ? Math.round(Number(r.opTime)) : null,
          programCodes: r.programCodeInfo ? JSON.stringify(r.programCodeInfo.split(",").map((s: string) => s.trim())) : null,
          reportingYear: reportYear,
          reportingQuarter: null,
          sourceCategory: r.sourceCategory || null,
        })
        .onDuplicateKeyUpdate({
          set: {
            so2Tons: r.so2Mass != null ? String(r.so2Mass) : null,
            noxTons: r.noxMass != null ? String(r.noxMass) : null,
            co2Tons: r.co2Mass != null ? String(r.co2Mass) : null,
            hgLbs: r.hgMass != null ? String(r.hgMass) : null,
            grossLoadMwh: r.grossLoad != null ? String(r.grossLoad) : null,
            operatingHours: r.opTime != null ? Math.round(Number(r.opTime)) : null,
            fetchedAt: new Date(),
          },
        });
      inserted++;
    } catch {
      // Skip individual record errors
    }
  }

  console.log(`[CAMPD] ${stateCode} ${reportYear}: ${inserted}/${records.length} emission records`);
}

/**
 * Fetch CAMPD facility attributes for enrichment (fuel types, unit types, programs).
 */
export async function fetchCAMPDFacilities(stateCode: string): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const url = new URL(`${CAMPD_BASE}/facilities-mgmt/facilities`);
  url.searchParams.set("stateCode", stateCode);
  url.searchParams.set("page", "1");
  url.searchParams.set("perPage", "500");

  const response = await fetch(url.toString(), {
    headers: { "x-api-key": apiKey, "Accept": "application/json" },
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) return;

  let facilities: any[];
  try {
    facilities = await response.json();
  } catch {
    return;
  }

  if (!Array.isArray(facilities)) return;

  const db = await getDb();
  if (!db) return;

  // Update existing emission records with facility enrichment data
  for (const f of facilities) {
    if (!f.facilityId) continue;
    try {
      await db.execute(
        sql`UPDATE hz_emissions
            SET fuel_types = ${f.fuelTypes ? JSON.stringify(f.fuelTypes) : null},
                unit_types = ${f.unitTypes ? JSON.stringify(f.unitTypes) : null},
                source_category = ${f.sourceCategory || null}
            WHERE facility_id = ${String(f.facilityId)}
              AND state_code = ${stateCode}`
      );
    } catch {
      // Skip enrichment errors
    }
  }
}

/**
 * Main sync: fetch emissions + facility data for all target states.
 * Called daily at 5:30 AM.
 */
export async function syncCleanAirMarkets(): Promise<void> {
  console.log("[CAMPD] Starting Clean Air Markets sync...");

  for (const state of TARGET_STATES) {
    try {
      await fetchAnnualEmissions(state);
      // Rate limit between states
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.error(`[CAMPD] Error syncing ${state}:`, err);
    }
  }

  // Enrich with facility metadata
  for (const state of TARGET_STATES.slice(0, 5)) {
    try {
      await fetchCAMPDFacilities(state);
      await new Promise((r) => setTimeout(r, 500));
    } catch {}
  }

  // Clean up data older than 3 years
  const db = await getDb();
  if (db) {
    try {
      const cutoffYear = new Date().getFullYear() - 3;
      await db.execute(sql`DELETE FROM hz_emissions WHERE reporting_year < ${cutoffYear}`);
    } catch {}
  }

  console.log("[CAMPD] Clean Air Markets sync complete");
}
