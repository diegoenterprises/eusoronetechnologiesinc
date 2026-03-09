/**
 * Hot Zones Data Sync Scheduler v2.0
 * Uses node-cron to schedule periodic data fetching from 22+ government APIs
 */
import cron from "node-cron";
import { getDb } from "../../db";
import { logger } from "../../_core/logger";
import { emitDispatchEvent } from "../../_core/websocket";
import { loads, drivers, companies } from "../../../drizzle/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { fetchWeatherAlerts } from "../../integrations/nws/weatherAlerts";
import { fetchRecentEarthquakes } from "../../integrations/usgs/earthquakes";
import { fetchEIAFuelPrices } from "../../integrations/eia/fuelPrices";
import { fetchCrudePrices } from "../../integrations/eia/crudePrices";
import { fetchRefineryData } from "../../integrations/eia/refineryData";
import { syncCarrierSafetyData } from "../../integrations/fmcsa/carrierSafety";
import { processMCMISBulkCensus } from "../../integrations/fmcsa/mcmisBulk";
import { syncPHMSAIncidents } from "../../integrations/phmsa/hazmatIncidents";
import { fetchHazmatRegistrations } from "../../integrations/phmsa/hazmatRegistration";
import { fetchSpillReports } from "../../integrations/nrc/spillReports";
import { fetchActiveWildfires } from "../../integrations/nifc/wildfires";
import { fetchActiveDisasters } from "../../integrations/fema/disasters";
import { syncAllEPAFacilities } from "../../integrations/epa/facilities";
import { fetchUSDATruckRates } from "../../integrations/usda/truckRates";
import { fetchLockStatus } from "../../integrations/usace/locks";
import { fetchBridgeRestrictions } from "../../integrations/fhwa/bridges";
import { fetchTruckParking } from "../../integrations/fhwa/truckParking";
import { fetchRoadConditions } from "../../integrations/state511/roadConditions";
import { fetchNewRegulations } from "../../integrations/federalRegister/regulations";
import { fetchTexasProduction } from "../../integrations/stateProduction/texasRRC";
import { fetchNDProduction } from "../../integrations/stateProduction/ndDMR";
import { syncCleanAirMarkets } from "../../integrations/epa/cleanAirMarkets";
import { syncECHOHazWaste } from "../../integrations/epa/echoHazWaste";
import { computeZoneIntelligence } from "./zoneAggregator";
import { monitorHMSPPermits } from "./hmspMonitor";
import { computeRouteIntelligence } from "../routeIntelligence";
import { monitorInsuranceExpirations, deepFMCSAComplianceScan } from "../insuranceMonitor";
import { logSync, generateSyncId } from "./syncLogger";
import { seedMapData } from "./seedMapData";

async function runSync(sourceName: string, syncFn: () => Promise<void>): Promise<void> {
  const syncId = generateSyncId();
  const startedAt = new Date();

  try {
    logger.info(`[DataSync] Starting ${sourceName}...`);

    await logSync({
      id: syncId,
      sourceName,
      syncType: "INCREMENTAL",
      startedAt,
      status: "RUNNING",
    });

    await syncFn();

    await logSync({
      id: syncId,
      sourceName,
      syncType: "INCREMENTAL",
      startedAt,
      completedAt: new Date(),
      status: "SUCCESS",
    });

    logger.info(`[DataSync] Completed ${sourceName} in ${Date.now() - startedAt.getTime()}ms`);
  } catch (error) {
    logger.error(`[DataSync] Failed ${sourceName}:`, error);

    await logSync({
      id: syncId,
      sourceName,
      syncType: "INCREMENTAL",
      startedAt,
      completedAt: new Date(),
      status: "FAILED",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  }
}

export function initializeDataSyncScheduler(): void {
  logger.info("[DataSync] Initializing scheduler...");

  // ═══ CRITICAL: Real-time data (1-5 minute intervals) ═══

  // Earthquakes - every 1 minute
  cron.schedule("* * * * *", async () => {
    await runSync("USGS_EARTHQUAKES", fetchRecentEarthquakes);
  });

  // Weather alerts - every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    await runSync("NWS_WEATHER", fetchWeatherAlerts);
  });

  // Zone intelligence aggregation - every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    await runSync("ZONE_INTELLIGENCE", computeZoneIntelligence);
  });

  // Route intelligence (crowd-sourced LIDAR) - every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    await runSync("ROUTE_INTELLIGENCE", computeRouteIntelligence);
  });

  // Road segment aggregation — converts GPS breadcrumbs into road_segments - every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    try {
      const { aggregateBreadcrumbsToSegments } = await import("../../services/roadIntelligence");
      await runSync("ROAD_SEGMENT_AGGREGATION", async () => { await aggregateBreadcrumbsToSegments(); });
    } catch (e) { logger.error("[Scheduler] Road segment aggregation error:", e); }
  });

  // ═══ HIGH PRIORITY: Operational data (15-60 minute intervals) ═══

  // Wildfires - every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    await runSync("NIFC_WILDFIRES", fetchActiveWildfires);
  });

  // NRC Spill Reports - every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    await runSync("NRC_SPILLS", fetchSpillReports);
  });

  // Lock status - every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    await runSync("USACE_LOCKS", fetchLockStatus);
  });

  // State 511 Road Conditions - every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    await runSync("STATE_511_ROADS", fetchRoadConditions);
  });

  // Truck Parking Availability (TPIMS) - every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    await runSync("FHWA_TRUCK_PARKING", fetchTruckParking);
  });

  // Fuel prices - every hour at :00
  cron.schedule("0 * * * *", async () => {
    await runSync("EIA_FUEL", fetchEIAFuelPrices);
  });

  // Crude oil prices + stocks - every hour at :05
  cron.schedule("5 * * * *", async () => {
    await runSync("EIA_CRUDE", fetchCrudePrices);
  });

  // ═══ DAILY: Compliance and safety data (overnight batch) ═══

  // FMCSA carrier safety - daily at 2:00 AM
  cron.schedule("0 2 * * *", async () => {
    await runSync("FMCSA_SAFETY", syncCarrierSafetyData);
  });

  // PHMSA hazmat incidents - daily at 3:00 AM
  cron.schedule("0 3 * * *", async () => {
    await runSync("PHMSA_INCIDENTS", syncPHMSAIncidents);
  });

  // PHMSA hazmat registrations - daily at 3:30 AM
  cron.schedule("30 3 * * *", async () => {
    await runSync("PHMSA_REGISTRATIONS", fetchHazmatRegistrations);
  });

  // EPA facilities - daily at 4:00 AM
  cron.schedule("0 4 * * *", async () => {
    await runSync("EPA_FACILITIES", syncAllEPAFacilities);
  });

  // FEMA disasters - daily at 5:00 AM
  cron.schedule("0 5 * * *", async () => {
    await runSync("FEMA_DISASTERS", fetchActiveDisasters);
  });

  // USDA truck rates - daily at 6:00 AM
  cron.schedule("0 6 * * *", async () => {
    await runSync("USDA_RATES", fetchUSDATruckRates);
  });

  // Federal Register new regulations - daily at 7:00 AM
  cron.schedule("0 7 * * *", async () => {
    await runSync("FED_REGISTER", fetchNewRegulations);
  });

  // EIA Refinery data - daily at 7:30 AM
  cron.schedule("30 7 * * *", async () => {
    await runSync("EIA_REFINERY", fetchRefineryData);
  });

  // ECHO RCRA Hazardous Waste handlers - daily at 4:30 AM
  cron.schedule("30 4 * * *", async () => {
    await runSync("ECHO_HAZ_WASTE", syncECHOHazWaste);
  });

  // CAMPD Clean Air Markets emissions - daily at 5:30 AM
  cron.schedule("30 5 * * *", async () => {
    await runSync("CAMPD_EMISSIONS", syncCleanAirMarkets);
  });

  // FHWA Bridge restrictions - daily at 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    await runSync("FHWA_BRIDGES", fetchBridgeRestrictions);
  });

  // ═══ WEEKLY: Large datasets and production data ═══

  // MCMIS Bulk Census - Sunday at 1:00 AM
  cron.schedule("0 1 * * 0", async () => {
    await runSync("MCMIS_BULK_CENSUS", processMCMISBulkCensus);
  });

  // Texas RRC production data - Monday at 7:00 AM
  cron.schedule("0 7 * * 1", async () => {
    await runSync("TX_RRC_PRODUCTION", fetchTexasProduction);
  });

  // North Dakota DMR Bakken data - Monday at 7:30 AM
  cron.schedule("30 7 * * 1", async () => {
    await runSync("ND_DMR_BAKKEN", fetchNDProduction);
  });

  // HMSP Permit Monitoring - Daily at 2:30 AM (after FMCSA safety at 2 AM)
  cron.schedule("30 2 * * *", async () => {
    await runSync("HMSP_PERMIT_MONITOR", monitorHMSPPermits);
  });

  // Insurance Expiration Monitor - Daily at 1:00 AM
  cron.schedule("0 1 * * *", async () => {
    await runSync("INSURANCE_EXPIRATION_MONITOR", monitorInsuranceExpirations);
  });

  // Insurance FMCSA Deep Compliance Scan - Sunday at 3:00 AM
  cron.schedule("0 3 * * 0", async () => {
    await runSync("INSURANCE_FMCSA_DEEP_SCAN", deepFMCSAComplianceScan);
  });

  // Dispatch Check Call Monitor - Every 30 minutes (WS-DISPATCH-OVERHAUL)
  cron.schedule("*/30 * * * *", async () => {
    await runSync("DISPATCH_CHECK_CALL_DUE", scanCheckCallsDue);
  });

  logger.info("[DataSync] Scheduler v3.5 initialized — 30 data sources, 27+ cron jobs (incl. dispatch check calls)");
}

/**
 * Scan for in-transit loads that are due for a check call.
 * A check call is due every 4 hours for active in-transit loads.
 * Emits DISPATCH_CHECK_CALL_DUE WebSocket events per company.
 */
async function scanCheckCallsDue(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const inTransitStatuses = ['en_route_pickup', 'en_route_delivery', 'at_pickup', 'at_delivery', 'loading', 'unloading'];

    const activeLoads = await db
      .select({
        id: loads.id,
        loadNumber: loads.loadNumber,
        status: loads.status,
        driverId: loads.driverId,
        catalystId: loads.catalystId,
        pickupLocation: loads.pickupLocation,
        deliveryLocation: loads.deliveryLocation,
        updatedAt: loads.updatedAt,
      })
      .from(loads)
      .where(
        sql`${loads.status} IN (${sql.raw(inTransitStatuses.map(s => `'${s}'`).join(','))})`
      )
      .limit(500);

    // Group by company (catalystId) and find loads not updated in 4+ hours
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    const companyCalls: Record<string, typeof activeLoads> = {};

    for (const load of activeLoads) {
      const lastUpdate = load.updatedAt ? new Date(load.updatedAt) : new Date(0);
      if (lastUpdate < fourHoursAgo) {
        const companyId = String(load.catalystId || 0);
        if (!companyCalls[companyId]) companyCalls[companyId] = [];
        companyCalls[companyId].push(load);
      }
    }

    let totalEmitted = 0;
    for (const [companyId, dueLoads] of Object.entries(companyCalls)) {
      for (const load of dueLoads) {
        emitDispatchEvent(companyId, {
          loadId: String(load.id),
          loadNumber: load.loadNumber || `LOAD-${load.id}`,
          eventType: 'DISPATCH_CHECK_CALL_DUE',
          priority: 'urgent',
          message: `Check call due for ${load.loadNumber || `LOAD-${load.id}`} (${load.status}) — no update in 4+ hours`,
          timestamp: new Date().toISOString(),
        });
        totalEmitted++;
      }
    }

    logger.info(`[Dispatch] Check call scan: ${activeLoads.length} in-transit loads, ${totalEmitted} check calls due`);
  } catch (err: any) {
    logger.error('[Dispatch] Check call scan error:', err?.message?.slice(0, 200));
  }
}

/**
 * Run an initial data fetch on startup (non-blocking)
 * Fetches critical data first (weather, earthquakes, fuel)
 */
export async function runInitialSync(): Promise<void> {
  logger.info("[DataSync] Running initial data sync — ALL 25 sources...");

  // Wave 0: Seed baseline data for tables that have broken/unavailable APIs
  await runSync("SEED_MAP_DATA", seedMapData);

  // Wave 1: Critical real-time data
  await Promise.allSettled([
    runSync("NWS_WEATHER_INIT", fetchWeatherAlerts),
    runSync("USGS_EARTHQUAKES_INIT", fetchRecentEarthquakes),
    runSync("EIA_FUEL_INIT", fetchEIAFuelPrices),
    runSync("EIA_CRUDE_INIT", fetchCrudePrices),
    runSync("NRC_SPILLS_INIT", fetchSpillReports),
    runSync("NIFC_WILDFIRES_INIT", fetchActiveWildfires),
  ]);

  // Wave 2: Operational data — rates, road conditions, safety
  await Promise.allSettled([
    runSync("USDA_RATES_INIT", fetchUSDATruckRates),
    runSync("STATE_511_INIT", fetchRoadConditions),
    runSync("FHWA_PARKING_INIT", fetchTruckParking),
    runSync("FHWA_BRIDGES_INIT", fetchBridgeRestrictions),
    runSync("FEMA_DISASTERS_INIT", fetchActiveDisasters),
  ]);

  // Wave 3: Compliance and safety data
  await Promise.allSettled([
    runSync("FMCSA_SAFETY_INIT", syncCarrierSafetyData),
    runSync("PHMSA_INCIDENTS_INIT", syncPHMSAIncidents),
    runSync("PHMSA_REGISTRATIONS_INIT", fetchHazmatRegistrations),
    runSync("EPA_FACILITIES_INIT", syncAllEPAFacilities),
    runSync("ECHO_HAZ_WASTE_INIT", syncECHOHazWaste),
  ]);

  // Wave 4: Extended intelligence
  await Promise.allSettled([
    runSync("FED_REGISTER_INIT", fetchNewRegulations),
    runSync("EIA_REFINERY_INIT", fetchRefineryData),
    runSync("CAMPD_EMISSIONS_INIT", syncCleanAirMarkets),
    runSync("TX_RRC_INIT", fetchTexasProduction),
    runSync("ND_DMR_INIT", fetchNDProduction),
  ]);

  // Finally: compute zone intelligence from ALL data + route intelligence
  await Promise.allSettled([
    runSync("ZONE_INTELLIGENCE_INIT", computeZoneIntelligence),
    runSync("ROUTE_INTELLIGENCE_INIT", computeRouteIntelligence),
  ]);

  // Wave 5: Insurance compliance check
  await runSync("INSURANCE_COMPLIANCE_INIT", monitorInsuranceExpirations);

  logger.info("[DataSync] Initial data sync complete — ALL 28 sources loaded (incl. insurance compliance engine)");
}
