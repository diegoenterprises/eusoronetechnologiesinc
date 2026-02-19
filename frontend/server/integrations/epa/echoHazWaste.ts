/**
 * EPA ECHO Hazardous Waste Handler Integration
 * Source: https://echo.epa.gov/api/ (CORRECT endpoint)
 * Auth: No API key required
 * Refresh: Daily at 4:30 AM
 *
 * WHY THIS MATTERS FOR HAZMAT LOGISTICS:
 * - RCRA generators/transporters/TSDFs are actual or potential CUSTOMERS
 * - Large Quantity Generators (LQG) = high-volume hazmat shippers
 * - Transporters = competitors or partners
 * - TSDFs = treatment/storage/disposal destinations for hazmat loads
 * - Compliance violations = risk at pickup/delivery locations
 * - Enforcement actions = regulatory pressure in a zone
 * - Zone density of RCRA handlers = hazmat market opportunity score
 */
import { getDb } from "../../db";
import { hzRcraHandlers } from "../../../drizzle/schema";
import { sql } from "drizzle-orm";

const ECHO_BASE = "https://echo.epa.gov/api";

// Top hazmat logistics states
const TARGET_STATES = ["TX", "LA", "CA", "PA", "OH", "IL", "NJ", "GA", "FL", "MI", "IN", "WV", "KY", "OK", "ND"];

/**
 * Fetch RCRA hazardous waste handlers from ECHO for a given state.
 * Uses the correct echo.epa.gov/api endpoint with p_rcra=Y filter.
 */
export async function fetchRCRAHandlers(stateCode: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Step 1: Search for RCRA facilities in state
  const searchUrl = new URL(`${ECHO_BASE}/echo_rest_services.get_facilities`);
  searchUrl.searchParams.set("output", "JSON");
  searchUrl.searchParams.set("p_st", stateCode);
  searchUrl.searchParams.set("p_rcra", "Y");
  searchUrl.searchParams.set("p_act", "Y"); // Active only
  searchUrl.searchParams.set("responseset", "500");

  const response = await fetch(searchUrl.toString(), {
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    console.error(`[ECHO-HazWaste] API error ${response.status} for ${stateCode}`);
    return;
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    return;
  }

  const facilities = data?.Results?.Facilities || [];
  if (!Array.isArray(facilities) || facilities.length === 0) return;

  let inserted = 0;
  for (const f of facilities) {
    const handlerId = f.RegistryId || f.RcraId || f.FacilityId;
    if (!handlerId) continue;

    try {
      // Determine handler type from activity flags
      let handlerType: "Generator" | "Transporter" | "TSDF" | "Mixed" = "Generator";
      const isTSD = f.RcraTsdFlag === "Y" || f.RcraTsdfFlag === "Y";
      const isGen = f.RcraGenFlag === "Y" || f.RcraGeneratorFlag === "Y";
      const isTrans = f.RcraTransporterFlag === "Y";
      if (isTSD && isGen) handlerType = "Mixed";
      else if (isTSD) handlerType = "TSDF";
      else if (isTrans) handlerType = "Transporter";
      else handlerType = "Generator";

      // Generator status (LQG/SQG/VSQG)
      const genStatus = f.RcraGenStatus || f.GeneratorStatus || null;

      // Compliance
      const hasViolation = f.RcraQtrsWithNC > 0 || f.DfrCurrSvFlag === "Y" || f.RcraCurrVioFlag === "Y";

      await db
        .insert(hzRcraHandlers)
        .values({
          handlerId: String(handlerId).slice(0, 20),
          handlerName: f.FacName || f.FacilityName || "Unknown",
          stateCode: f.FacState || stateCode,
          city: f.FacCity || null,
          county: f.FacCounty || null,
          zipCode: f.FacZip || null,
          latitude: f.FacLat ? String(f.FacLat) : null,
          longitude: f.FacLong ? String(f.FacLong) : null,
          handlerType,
          generatorStatus: genStatus ? String(genStatus).slice(0, 10) : null,
          wasteActivityCodes: null,
          wasteCodes: null,
          landType: f.FacFederalFlg === "Y" ? "Federal" : "Non-Federal",
          complianceStatus: hasViolation ? "Violation" : "In Compliance",
          evaluationsCount: parseInt(f.RcraInspCount || f.InspCount || "0") || 0,
          violationsCount: parseInt(f.RcraQtrsWithNC || "0") || 0,
          enforcementActionsCount: parseInt(f.RcraFormalCount || f.FormalCount || "0") || 0,
          penaltiesTotal: f.RcraPenalties ? String(f.RcraPenalties) : null,
          lastEvaluationDate: f.RcraLastEval ? new Date(f.RcraLastEval) : null,
          naicsCode: f.FacNaicsCode || null,
          industrySector: f.FacSectorDesc || f.FacMajorNaicsDesc || null,
        })
        .onDuplicateKeyUpdate({
          set: {
            complianceStatus: hasViolation ? "Violation" : "In Compliance",
            violationsCount: parseInt(f.RcraQtrsWithNC || "0") || 0,
            enforcementActionsCount: parseInt(f.RcraFormalCount || f.FormalCount || "0") || 0,
            evaluationsCount: parseInt(f.RcraInspCount || f.InspCount || "0") || 0,
            fetchedAt: new Date(),
          },
        });
      inserted++;
    } catch {
      // Skip individual handler errors
    }
  }

  console.log(`[ECHO-HazWaste] ${stateCode}: ${inserted}/${facilities.length} RCRA handlers`);
}

/**
 * Fetch detailed compliance info for facilities with violations.
 * Uses ECHO DFR (Detailed Facility Report) API.
 */
export async function enrichViolationDetails(stateCode: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Get handlers with violations for enrichment
  const handlers: any[] = await db.execute(
    sql`SELECT handler_id FROM hz_rcra_handlers
        WHERE state_code = ${stateCode}
          AND compliance_status = 'Violation'
        ORDER BY violations_count DESC
        LIMIT 20`
  );

  for (const h of handlers) {
    try {
      const url = `${ECHO_BASE}/dfr_rest_services.get_rcra_compliance?output=JSON&p_id=${h.handler_id}`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!resp.ok) continue;

      const data = await resp.json();
      const compliance = data?.Results?.RCRACompliance;
      if (!compliance) continue;

      // Extract waste codes from compliance data
      const wasteCodes = compliance.WasteCodes
        ? JSON.stringify(compliance.WasteCodes.map((w: any) => w.WasteCode || w))
        : null;

      await db.execute(
        sql`UPDATE hz_rcra_handlers
            SET waste_codes = ${wasteCodes},
                last_evaluation_date = ${compliance.LastEvalDate || null}
            WHERE handler_id = ${h.handler_id}`
      );

      // Rate limit DFR calls
      await new Promise((r) => setTimeout(r, 300));
    } catch {
      // Skip enrichment errors
    }
  }
}

/**
 * Main sync: fetch RCRA handlers for all target states.
 * Called daily at 4:30 AM.
 */
export async function syncECHOHazWaste(): Promise<void> {
  console.log("[ECHO-HazWaste] Starting RCRA handler sync...");

  for (const state of TARGET_STATES) {
    try {
      await fetchRCRAHandlers(state);
      // Rate limit: ~30 req/min max for ECHO
      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      console.error(`[ECHO-HazWaste] Error syncing ${state}:`, err);
    }
  }

  // Enrich top violation facilities with detailed compliance data
  for (const state of TARGET_STATES.slice(0, 5)) {
    try {
      await enrichViolationDetails(state);
      await new Promise((r) => setTimeout(r, 1000));
    } catch {}
  }

  console.log("[ECHO-HazWaste] RCRA handler sync complete");
}
