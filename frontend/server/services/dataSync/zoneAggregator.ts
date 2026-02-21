/**
 * Zone Intelligence Aggregator v2.0
 * Computes per-zone metrics from all 22+ data sources
 * Runs every 5 minutes, writes to hz_zone_intelligence
 */
import { getDb } from "../../db";
import {
  hzZoneIntelligence,
  hzWeatherAlerts,
  hzFuelPrices,
  hzCarrierSafety,
  hzHazmatIncidents,
  hzEpaFacilities,
  hzSeismicEvents,
  hzWildfires,
  hzFemaDisasters,
  hzCrudePrices,
  facilities,
} from "../../../drizzle/schema";
import { sql } from "drizzle-orm";
import { invalidateCache } from "../cache/hotZonesCache";

// Zone definitions with state mappings
const ZONES: Record<string, { states: string[]; center: { lat: number; lng: number } }> = {
  "hz-lax": { states: ["CA"], center: { lat: 34.0522, lng: -118.2437 } },
  "hz-chi": { states: ["IL"], center: { lat: 41.8781, lng: -87.6298 } },
  "hz-hou": { states: ["TX"], center: { lat: 29.7604, lng: -95.3698 } },
  "hz-atl": { states: ["GA"], center: { lat: 33.749, lng: -84.388 } },
  "hz-dal": { states: ["TX"], center: { lat: 32.7767, lng: -96.797 } },
  "hz-nwk": { states: ["NJ", "NY"], center: { lat: 40.7357, lng: -74.1724 } },
  "hz-mid": { states: ["TX"], center: { lat: 31.9973, lng: -102.0779 } },
  "hz-sav": { states: ["GA"], center: { lat: 32.0809, lng: -81.0912 } },
  "hz-mem": { states: ["TN"], center: { lat: 35.1495, lng: -90.049 } },
  "hz-bak": { states: ["ND"], center: { lat: 48.1391, lng: -103.838 } },
  "hz-phl": { states: ["PA"], center: { lat: 39.9526, lng: -75.1652 } },
  "hz-lac": { states: ["LA", "TX"], center: { lat: 30.2266, lng: -93.2174 } },
  "hz-det": { states: ["MI"], center: { lat: 42.3314, lng: -83.0458 } },
  "hz-sea": { states: ["WA"], center: { lat: 47.6062, lng: -122.3321 } },
  "hz-den": { states: ["CO"], center: { lat: 39.7392, lng: -104.9903 } },
  "hz-jax": { states: ["FL"], center: { lat: 30.3322, lng: -81.6557 } },
  "hz-eag": { states: ["TX"], center: { lat: 28.7091, lng: -99.7719 } },
  "hz-pit": { states: ["PA"], center: { lat: 40.4406, lng: -79.9959 } },
};

function buildStateInClause(states: string[]): any {
  return sql.join(
    states.map((s) => sql`${s}`),
    sql`, `
  );
}

export async function computeZoneIntelligence(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  for (const [zoneId, zone] of Object.entries(ZONES)) {
    try {
      const metrics = await computeZoneMetrics(db, zoneId, zone);

      await db
        .insert(hzZoneIntelligence)
        .values({
          zoneId,
          ...metrics,
          computedAt: new Date(),
          validUntil: new Date(Date.now() + 5 * 60 * 1000),
        })
        .onDuplicateKeyUpdate({
          set: {
            ...metrics,
            computedAt: new Date(),
            validUntil: new Date(Date.now() + 5 * 60 * 1000),
          },
        });
    } catch (e) {
      console.error(`[ZoneAggregator] Failed to compute ${zoneId}:`, e);
    }
  }

  // Invalidate zone cache so next read gets fresh data
  invalidateCache("zone:");
}

async function computeZoneMetrics(
  db: any,
  _zoneId: string,
  zone: { states: string[]; center: { lat: number; lng: number } }
): Promise<Record<string, any>> {
  const stateList = zone.states;
  const stateIn = buildStateInClause(stateList);

  // ── CORE METRICS: Loads & Trucks from platform DB ──
  let liveLoads = 0;
  let liveTrucks = 0;
  let avgRatePerMile: string | null = null;

  try {
    const loadRows: any[] = await db.execute(
      sql`SELECT COUNT(*) as cnt, AVG(rate / NULLIF(distance, 0)) as avgRpm
          FROM loads
          WHERE JSON_EXTRACT(pickupLocation, '$.state') IN (${stateIn})
            AND status NOT IN ('delivered', 'cancelled', 'draft')
            AND deletedAt IS NULL`
    );
    liveLoads = Number(loadRows[0]?.cnt) || 0;
    avgRatePerMile = loadRows[0]?.avgRpm ? String(Number(loadRows[0].avgRpm).toFixed(3)) : null;

    const truckRows: any[] = await db.execute(
      sql`SELECT COUNT(DISTINCT driverId) as cnt
          FROM loads
          WHERE JSON_EXTRACT(pickupLocation, '$.state') IN (${stateIn})
            AND status IN ('assigned', 'in_transit')
            AND driverId IS NOT NULL
            AND deletedAt IS NULL`
    );
    liveTrucks = Number(truckRows[0]?.cnt) || 0;
  } catch {
    // DB query may fail on missing columns
  }

  // ── USDA AMS RATES FALLBACK — real market rates when no platform loads ──
  if (!avgRatePerMile || avgRatePerMile === "0") {
    try {
      const rateRows: any[] = await db.execute(
        sql`SELECT AVG(CAST(rate_per_mile AS DECIMAL(8,4))) as avgRate,
                COUNT(*) as cnt
            FROM hz_rate_indices
            WHERE origin IN (${stateIn})
              AND equipment_type NOT IN ('ROAD_CONDITION', 'TRUCK_PARKING')
              AND report_date > DATE_SUB(NOW(), INTERVAL 30 DAY)
              AND CAST(rate_per_mile AS DECIMAL(8,4)) > 0`
      );
      if (Number(rateRows[0]?.avgRate) > 0) {
        avgRatePerMile = String(Number(rateRows[0].avgRate).toFixed(3));
        // Use USDA rate count as a load demand proxy if no platform loads
        if (liveLoads === 0) liveLoads = Number(rateRows[0].cnt) || 0;
      }
    } catch {}
  }

  // ── FMCSA CARRIER COUNT — real truck availability when no platform trucks ──
  if (liveTrucks === 0) {
    try {
      const carrierRows: any[] = await db.execute(
        sql`SELECT COUNT(*) as cnt FROM hz_carrier_safety
            WHERE physical_state IN (${stateIn})
              AND safety_rating NOT IN ('Unsatisfactory')`
      );
      // Use ~10% of registered carriers as an active-truck estimate
      liveTrucks = Math.round((Number(carrierRows[0]?.cnt) || 0) * 0.1);
    } catch {}
  }

  const loadToTruckRatio = liveTrucks > 0 ? (liveLoads / liveTrucks).toFixed(2) : "0";
  const surgeMultiplier = Math.min(2.5, Math.max(0.5, (liveLoads / Math.max(liveTrucks, 1)) * 0.5 + 0.5)).toFixed(2);

  // ── FUEL METRICS (EIA) ──
  let dieselPrice: string | null = null;
  let dieselTrend: "rising" | "falling" | "stable" = "stable";

  try {
    const fuelRows = await db
      .select()
      .from(hzFuelPrices)
      .where(sql`state_code IN (${stateIn})`)
      .orderBy(sql`report_date DESC`)
      .limit(1);

    if (fuelRows.length > 0) {
      dieselPrice = fuelRows[0].dieselRetail;
      const change = parseFloat(fuelRows[0].dieselChange1w || "0");
      dieselTrend = change > 0.05 ? "rising" : change < -0.05 ? "falling" : "stable";
    }
  } catch {}

  // ── WEATHER RISK (NWS) ──
  let activeWeatherAlerts = 0;
  let maxWeatherSeverity: "None" | "Minor" | "Moderate" | "Severe" | "Extreme" = "None";
  let weatherAlertTypes: string[] = [];

  try {
    const weatherRows = await db
      .select()
      .from(hzWeatherAlerts)
      .where(sql`(expires_at > NOW() OR expires_at IS NULL)`);

    // Filter by states matching this zone
    const filtered = weatherRows.filter((a: any) => {
      try {
        const states = typeof a.stateCodes === "string" ? JSON.parse(a.stateCodes) : a.stateCodes || [];
        return states.some((s: string) => stateList.includes(s));
      } catch {
        return false;
      }
    });

    activeWeatherAlerts = filtered.length;
    const sevOrder: Record<string, number> = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1, Unknown: 0 };
    for (const a of filtered) {
      if ((sevOrder[a.severity] || 0) > (sevOrder[maxWeatherSeverity] || 0)) {
        maxWeatherSeverity = a.severity as any;
      }
      if (a.eventType && !weatherAlertTypes.includes(a.eventType)) {
        weatherAlertTypes.push(a.eventType);
      }
    }
  } catch {}

  // ── SAFETY METRICS (FMCSA) ──
  let avgCarrierSafetyScore: string | null = null;
  let carriersWithViolations = 0;

  try {
    const safetyRows: any[] = await db.execute(
      sql`SELECT
            AVG(COALESCE(unsafe_driving_score, 0) + COALESCE(vehicle_maintenance_score, 0) + COALESCE(hazmat_compliance_score, 0)) / 3 as avg_score,
            COUNT(CASE WHEN safety_rating IN ('Conditional', 'Unsatisfactory') THEN 1 END) as violations
          FROM hz_carrier_safety
          WHERE physical_state IN (${stateIn})`
    );
    avgCarrierSafetyScore = safetyRows[0]?.avg_score ? String(Number(safetyRows[0].avg_score).toFixed(2)) : null;
    carriersWithViolations = Number(safetyRows[0]?.violations) || 0;
  } catch {}

  // ── HAZMAT INCIDENTS (PHMSA) ──
  let recentHazmatIncidents = 0;
  try {
    const incRows: any[] = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM hz_hazmat_incidents
          WHERE state_code IN (${stateIn}) AND incident_date > DATE_SUB(NOW(), INTERVAL 1 YEAR)`
    );
    recentHazmatIncidents = Number(incRows[0]?.cnt) || 0;
  } catch {}

  // ── EPA COMPLIANCE ──
  let epaFacilitiesCount = 0;
  let facilitiesWithViolations = 0;
  try {
    const epaRows: any[] = await db.execute(
      sql`SELECT COUNT(*) as total, COUNT(CASE WHEN compliance_status = 'Violation' THEN 1 END) as violations
          FROM hz_epa_facilities WHERE state_code IN (${stateIn})`
    );
    epaFacilitiesCount = Number(epaRows[0]?.total) || 0;
    facilitiesWithViolations = Number(epaRows[0]?.violations) || 0;
  } catch {}

  // ── COMPLIANCE RISK SCORE ──
  const violationRate = epaFacilitiesCount > 0 ? (facilitiesWithViolations / epaFacilitiesCount) * 100 : 0;
  const complianceRiskScore = String(Math.min(100, violationRate * 0.5 + carriersWithViolations * 2).toFixed(2));

  // ── NATURAL HAZARDS ──
  let seismicRiskLevel: "Low" | "Moderate" | "High" = "Low";
  try {
    const quakeRows: any[] = await db.execute(
      sql`SELECT MAX(magnitude) as maxMag FROM hz_seismic_events
          WHERE event_time > DATE_SUB(NOW(), INTERVAL 7 DAY)
            AND ST_Distance_Sphere(
              POINT(longitude, latitude),
              POINT(${zone.center.lng}, ${zone.center.lat})
            ) < 500000`
    );
    const maxMag = Number(quakeRows[0]?.maxMag) || 0;
    seismicRiskLevel = maxMag >= 5 ? "High" : maxMag >= 3 ? "Moderate" : "Low";
  } catch {}

  let activeWildfires = 0;
  try {
    const fireRows: any[] = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM hz_wildfires
          WHERE state_code IN (${stateIn}) AND fire_status IN ('Active', 'Contained')`
    );
    activeWildfires = Number(fireRows[0]?.cnt) || 0;
  } catch {}

  let femaDisasterActive = false;
  try {
    const femaRows: any[] = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM hz_fema_disasters
          WHERE state_code IN (${stateIn}) AND closeout_date IS NULL
            AND declaration_date > DATE_SUB(NOW(), INTERVAL 1 YEAR)`
    );
    femaDisasterActive = (Number(femaRows[0]?.cnt) || 0) > 0;
  } catch {}

  // ── CRUDE OIL PRICING (EIA) — v2.0 ──
  let wtiPrice: number | null = null;
  let brentPrice: number | null = null;
  try {
    const crudeRows: any[] = await db.execute(
      sql`SELECT product_code, price_usd FROM hz_crude_prices
          WHERE product_code IN ('PET.RWTC.D', 'PET.RBRTE.D')
          ORDER BY report_date DESC LIMIT 2`
    );
    for (const r of crudeRows) {
      if (r.product_code === "PET.RWTC.D") wtiPrice = Number(r.price_usd) || null;
      if (r.product_code === "PET.RBRTE.D") brentPrice = Number(r.price_usd) || null;
    }
  } catch {}

  // ── SPILL REPORTS (NRC) — v2.0 ──
  let recentSpills = 0;
  try {
    const spillRows: any[] = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM hz_hazmat_incidents
          WHERE state_code IN (${stateIn})
            AND report_number LIKE 'NRC-%'
            AND incident_date > DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
    recentSpills = Number(spillRows[0]?.cnt) || 0;
  } catch {}

  // ── ROAD CONDITIONS (State 511) — v2.0 ──
  let activeRoadClosures = 0;
  try {
    const roadRows: any[] = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM hz_rate_indices
          WHERE origin IN (${stateIn})
            AND equipment_type = 'ROAD_CONDITION'
            AND rate_per_mile = 'HIGH'
            AND report_date >= CURDATE()`
    );
    activeRoadClosures = Number(roadRows[0]?.cnt) || 0;
  } catch {}

  // ── TRUCK PARKING (FHWA TPIMS) — v2.0 ──
  let truckParkingAvailable = 0;
  try {
    const parkingRows: any[] = await db.execute(
      sql`SELECT SUM(CAST(rate_per_mile AS UNSIGNED)) as total FROM hz_rate_indices
          WHERE origin IN (${stateIn})
            AND equipment_type = 'TRUCK_PARKING'
            AND report_date >= CURDATE()`
    );
    truckParkingAvailable = Number(parkingRows[0]?.total) || 0;
  } catch {}

  // ── CAMPD EMISSIONS (Clean Air Markets) — v3.0 ──
  let emissionFacilities = 0;
  let totalSO2Tons = 0;
  let totalNOxTons = 0;
  let totalCO2Tons = 0;
  try {
    const emRows: any[] = await db.execute(
      sql`SELECT COUNT(DISTINCT facility_id) as facilities,
              COALESCE(SUM(CAST(so2_tons AS DECIMAL(15,2))), 0) as so2,
              COALESCE(SUM(CAST(nox_tons AS DECIMAL(15,2))), 0) as nox,
              COALESCE(SUM(CAST(co2_tons AS DECIMAL(15,2))), 0) as co2
          FROM hz_emissions WHERE state_code IN (${stateIn})`
    );
    emissionFacilities = Number(emRows[0]?.facilities) || 0;
    totalSO2Tons = Number(emRows[0]?.so2) || 0;
    totalNOxTons = Number(emRows[0]?.nox) || 0;
    totalCO2Tons = Number(emRows[0]?.co2) || 0;
  } catch {}

  // ── RCRA HANDLERS (ECHO Haz Waste) — v3.0 ──
  let rcraHandlerCount = 0;
  let rcraGenerators = 0;
  let rcraTransporters = 0;
  let rcraTSDFs = 0;
  let rcraViolations = 0;
  try {
    const rcraRows: any[] = await db.execute(
      sql`SELECT COUNT(*) as total,
              COUNT(CASE WHEN handler_type = 'Generator' THEN 1 END) as generators,
              COUNT(CASE WHEN handler_type = 'Transporter' THEN 1 END) as transporters,
              COUNT(CASE WHEN handler_type = 'TSDF' THEN 1 END) as tsdfs,
              COUNT(CASE WHEN compliance_status = 'Violation' THEN 1 END) as violations
          FROM hz_rcra_handlers WHERE state_code IN (${stateIn})`
    );
    rcraHandlerCount = Number(rcraRows[0]?.total) || 0;
    rcraGenerators = Number(rcraRows[0]?.generators) || 0;
    rcraTransporters = Number(rcraRows[0]?.transporters) || 0;
    rcraTSDFs = Number(rcraRows[0]?.tsdfs) || 0;
    rcraViolations = Number(rcraRows[0]?.violations) || 0;
  } catch {}

  // ── CROWD-SOURCED ROUTE INTELLIGENCE — v4.0 ──
  let crowdDriverDensity = 0;
  let crowdAvgSpeed = 0;
  let crowdGridCells = 0;
  let crowdRouteReports = 0;
  let crowdTotalMiles = 0;
  let crowdLanesLearned = 0;
  try {
    // Grid heat within ~2 degrees of zone center (last 6 hours)
    const ghRows: any[] = await db.execute(
      sql`SELECT SUM(ping_count) as pings, AVG(avg_speed_mph) as avgSpd,
              COUNT(DISTINCT CONCAT(grid_lat, ',', grid_lng)) as cells
          FROM hz_grid_heat
          WHERE period_start > DATE_SUB(NOW(), INTERVAL 6 HOUR)
            AND grid_lat BETWEEN ${zone.center.lat - 2} AND ${zone.center.lat + 2}
            AND grid_lng BETWEEN ${zone.center.lng - 2} AND ${zone.center.lng + 2}`
    );
    crowdDriverDensity = Number(ghRows[0]?.pings) || 0;
    crowdAvgSpeed = Number(ghRows[0]?.avgSpd) || 0;
    crowdGridCells = Number(ghRows[0]?.cells) || 0;
  } catch {}

  try {
    // Route reports within zone states
    const rrRows: any[] = await db.execute(
      sql`SELECT COUNT(*) as cnt, COALESCE(SUM(distance_miles), 0) as miles
          FROM hz_driver_route_reports
          WHERE (origin_state IN (${stateIn}) OR dest_state IN (${stateIn}))
            AND completed_at > DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
    crowdRouteReports = Number(rrRows[0]?.cnt) || 0;
    crowdTotalMiles = Math.round(Number(rrRows[0]?.miles) || 0);
  } catch {}

  try {
    // Lane learning coverage for zone states
    const llRows: any[] = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM hz_lane_learning
          WHERE (origin_state IN (${stateIn}) OR dest_state IN (${stateIn}))
            AND trip_count >= 1`
    );
    crowdLanesLearned = Number(llRows[0]?.cnt) || 0;
  } catch {}

  // ── FACILITY INTELLIGENCE (FIL) — Petroleum facility density per zone ──
  let filTerminals = 0;
  let filRefineries = 0;
  let filRacks = 0;
  let filTotal = 0;
  let filClaimedByEusotrip = 0;
  try {
    const filRows: any[] = await db.execute(
      sql`SELECT
              COUNT(*) as total,
              COUNT(CASE WHEN facility_type IN ('TERMINAL','BULK_PLANT','TRANSLOAD') THEN 1 END) as terminals,
              COUNT(CASE WHEN facility_type = 'REFINERY' THEN 1 END) as refineries,
              COUNT(CASE WHEN facility_type = 'RACK' THEN 1 END) as racks,
              COUNT(CASE WHEN claimed_by_company_id IS NOT NULL THEN 1 END) as claimed
          FROM facilities
          WHERE facility_state IN (${stateIn})
            AND facility_status = 'OPERATING'`
    );
    filTotal = Number(filRows[0]?.total) || 0;
    filTerminals = Number(filRows[0]?.terminals) || 0;
    filRefineries = Number(filRows[0]?.refineries) || 0;
    filRacks = Number(filRows[0]?.racks) || 0;
    filClaimedByEusotrip = Number(filRows[0]?.claimed) || 0;
  } catch {}

  // ── ENHANCED COMPLIANCE RISK v4.0 (emissions + RCRA + spills + road closures) ──
  const rcraViolationRate = rcraHandlerCount > 0 ? (rcraViolations / rcraHandlerCount) * 100 : 0;
  const enhancedComplianceRisk = String(Math.min(100,
    Number(complianceRiskScore) +
    (recentSpills * 5) +
    (activeRoadClosures * 3) +
    (rcraViolationRate * 0.3) +
    (emissionFacilities > 50 ? 5 : 0)
  ).toFixed(2));

  return {
    liveLoads,
    liveTrucks,
    loadToTruckRatio,
    surgeMultiplier,
    avgRatePerMile,
    dieselPrice,
    dieselTrend,
    activeWeatherAlerts,
    maxWeatherSeverity,
    weatherAlertTypes: JSON.stringify(weatherAlertTypes),
    avgCarrierSafetyScore,
    carriersWithViolations,
    recentHazmatIncidents,
    complianceRiskScore: enhancedComplianceRisk,
    complianceFactors: JSON.stringify({
      violationRate,
      carrierViolations: carriersWithViolations,
      recentSpills,
      activeRoadClosures,
      truckParkingAvailable,
      wtiPrice,
      brentPrice,
      emissionFacilities,
      totalSO2Tons,
      totalNOxTons,
      totalCO2Tons,
      rcraHandlerCount,
      rcraGenerators,
      rcraTransporters,
      rcraTSDFs,
      rcraViolations,
      rcraViolationRate: +rcraViolationRate.toFixed(1),
      filTerminals,
      filRefineries,
      filRacks,
      filTotal,
      filClaimedByEusotrip,
      crowdDriverDensity,
      crowdAvgSpeed: +crowdAvgSpeed.toFixed(1),
      crowdGridCells,
      crowdRouteReports,
      crowdTotalMiles,
      crowdLanesLearned,
    }),
    epaFacilitiesCount: epaFacilitiesCount + rcraHandlerCount,
    facilitiesWithViolations: facilitiesWithViolations + rcraViolations,
    seismicRiskLevel,
    activeWildfires,
    femaDisasterActive,
  };
}
