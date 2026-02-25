/**
 * Register all sync jobs with the orchestrator
 * Called once at startup before orchestrator.initialize()
 */
import { syncOrchestrator } from "./syncOrchestrator";
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
import { computeZoneIntelligence } from "../dataSync/zoneAggregator";
import { monitorInsuranceExpirations } from "../insuranceMonitor";

export function registerAllSyncJobs(): void {
  // ── CRITICAL: Real-time (1-5 min) ──
  syncOrchestrator.registerJob({
    id: "USGS_EARTHQUAKES",
    label: "USGS Earthquakes",
    dataType: "SEISMIC_EVENTS",
    schedule: "* * * * *",
    syncFn: fetchRecentEarthquakes,
    enabled: true,
    maxConsecutiveFailures: 10,
  });

  syncOrchestrator.registerJob({
    id: "NWS_WEATHER",
    label: "NWS Weather Alerts",
    dataType: "WEATHER_ALERTS",
    schedule: "*/5 * * * *",
    syncFn: fetchWeatherAlerts,
    enabled: true,
    maxConsecutiveFailures: 5,
  });

  syncOrchestrator.registerJob({
    id: "ZONE_INTELLIGENCE",
    label: "Zone Intelligence Aggregation",
    dataType: "ZONE_INTELLIGENCE",
    schedule: "*/5 * * * *",
    syncFn: computeZoneIntelligence,
    enabled: true,
    maxConsecutiveFailures: 5,
  });

  // ── HIGH PRIORITY: 15-60 min ──
  syncOrchestrator.registerJob({
    id: "NIFC_WILDFIRES",
    label: "NIFC Wildfires",
    dataType: "WILDFIRES",
    schedule: "*/15 * * * *",
    syncFn: fetchActiveWildfires,
    enabled: true,
    maxConsecutiveFailures: 5,
  });

  syncOrchestrator.registerJob({
    id: "NRC_SPILLS",
    label: "NRC Spill Reports",
    dataType: "SPILL_REPORTS",
    schedule: "*/15 * * * *",
    syncFn: fetchSpillReports,
    enabled: true,
    maxConsecutiveFailures: 5,
  });

  syncOrchestrator.registerJob({
    id: "USACE_LOCKS",
    label: "USACE Lock Status",
    dataType: "LOCK_STATUS",
    schedule: "*/30 * * * *",
    syncFn: fetchLockStatus,
    enabled: true,
    maxConsecutiveFailures: 5,
  });

  syncOrchestrator.registerJob({
    id: "STATE_511_ROADS",
    label: "State 511 Road Conditions",
    dataType: "ROAD_CONDITIONS",
    schedule: "*/30 * * * *",
    syncFn: fetchRoadConditions,
    enabled: true,
    maxConsecutiveFailures: 5,
  });

  syncOrchestrator.registerJob({
    id: "FHWA_TRUCK_PARKING",
    label: "FHWA Truck Parking (TPIMS)",
    dataType: "TRUCK_PARKING",
    schedule: "*/30 * * * *",
    syncFn: fetchTruckParking,
    enabled: true,
    maxConsecutiveFailures: 5,
  });

  syncOrchestrator.registerJob({
    id: "EIA_FUEL",
    label: "EIA Fuel Prices",
    dataType: "FUEL_PRICES",
    schedule: "0 * * * *",
    syncFn: fetchEIAFuelPrices,
    enabled: true,
    maxConsecutiveFailures: 5,
  });

  syncOrchestrator.registerJob({
    id: "EIA_CRUDE",
    label: "EIA Crude Oil Prices",
    dataType: "CRUDE_PRICES",
    schedule: "5 * * * *",
    syncFn: fetchCrudePrices,
    enabled: true,
    maxConsecutiveFailures: 5,
  });

  // ── DAILY: Compliance/safety (overnight batch) ──
  syncOrchestrator.registerJob({
    id: "FMCSA_SAFETY",
    label: "FMCSA Carrier Safety",
    dataType: "CARRIER_SAFETY",
    schedule: "0 2 * * *",
    syncFn: syncCarrierSafetyData,
    enabled: true,
    maxConsecutiveFailures: 3,
  });

  syncOrchestrator.registerJob({
    id: "PHMSA_INCIDENTS",
    label: "PHMSA Hazmat Incidents",
    dataType: "HAZMAT_INCIDENTS",
    schedule: "0 3 * * *",
    syncFn: syncPHMSAIncidents,
    enabled: true,
    maxConsecutiveFailures: 3,
  });

  syncOrchestrator.registerJob({
    id: "PHMSA_REGISTRATIONS",
    label: "PHMSA Hazmat Registrations",
    dataType: "HAZMAT_INCIDENTS",
    schedule: "30 3 * * *",
    syncFn: fetchHazmatRegistrations,
    enabled: true,
    maxConsecutiveFailures: 3,
  });

  syncOrchestrator.registerJob({
    id: "EPA_FACILITIES",
    label: "EPA Facilities (TRI + ECHO)",
    dataType: "RATE_INDICES",
    schedule: "0 4 * * *",
    syncFn: syncAllEPAFacilities,
    enabled: true,
    maxConsecutiveFailures: 3,
  });

  syncOrchestrator.registerJob({
    id: "FEMA_DISASTERS",
    label: "FEMA Disaster Declarations",
    dataType: "FEMA_DISASTERS",
    schedule: "0 5 * * *",
    syncFn: fetchActiveDisasters,
    enabled: true,
    maxConsecutiveFailures: 3,
  });

  syncOrchestrator.registerJob({
    id: "USDA_RATES",
    label: "USDA Truck Rates",
    dataType: "RATE_INDICES",
    schedule: "0 6 * * *",
    syncFn: fetchUSDATruckRates,
    enabled: true,
    maxConsecutiveFailures: 3,
  });

  syncOrchestrator.registerJob({
    id: "FED_REGISTER",
    label: "Federal Register Regulations",
    dataType: "REGULATIONS",
    schedule: "0 7 * * *",
    syncFn: fetchNewRegulations,
    enabled: true,
    maxConsecutiveFailures: 3,
  });

  syncOrchestrator.registerJob({
    id: "EIA_REFINERY",
    label: "EIA Refinery Data",
    dataType: "CRUDE_PRICES",
    schedule: "30 7 * * *",
    syncFn: fetchRefineryData,
    enabled: true,
    maxConsecutiveFailures: 3,
  });

  syncOrchestrator.registerJob({
    id: "FHWA_BRIDGES",
    label: "FHWA Bridge Restrictions",
    dataType: "ROAD_CONDITIONS",
    schedule: "0 8 * * *",
    syncFn: fetchBridgeRestrictions,
    enabled: true,
    maxConsecutiveFailures: 3,
  });

  // ── WEEKLY ──
  syncOrchestrator.registerJob({
    id: "MCMIS_BULK_CENSUS",
    label: "MCMIS Bulk Census Download",
    dataType: "CARRIER_SAFETY",
    schedule: "0 1 * * 0",
    syncFn: processMCMISBulkCensus,
    enabled: true,
    maxConsecutiveFailures: 2,
  });

  syncOrchestrator.registerJob({
    id: "TX_RRC_PRODUCTION",
    label: "Texas RRC Production Data",
    dataType: "PRODUCTION_DATA",
    schedule: "0 7 * * 1",
    syncFn: fetchTexasProduction,
    enabled: true,
    maxConsecutiveFailures: 2,
  });

  syncOrchestrator.registerJob({
    id: "ND_DMR_BAKKEN",
    label: "ND DMR Bakken Production",
    dataType: "PRODUCTION_DATA",
    schedule: "30 7 * * 1",
    syncFn: fetchNDProduction,
    enabled: true,
    maxConsecutiveFailures: 2,
  });

  // ── PHASE 3: Enhanced EPA ──
  syncOrchestrator.registerJob({
    id: "ECHO_HAZ_WASTE",
    label: "ECHO RCRA Hazardous Waste Handlers",
    dataType: "RATE_INDICES",
    schedule: "30 4 * * *",
    syncFn: syncECHOHazWaste,
    enabled: true,
    maxConsecutiveFailures: 3,
  });

  syncOrchestrator.registerJob({
    id: "CAMPD_EMISSIONS",
    label: "Clean Air Markets Emissions (CAMPD)",
    dataType: "RATE_INDICES",
    schedule: "30 5 * * *",
    syncFn: syncCleanAirMarkets,
    enabled: true,
    maxConsecutiveFailures: 3,
  });

  // ── INSURANCE: Expiration monitoring ──
  syncOrchestrator.registerJob({
    id: "INSURANCE_EXPIRATION_MONITOR",
    label: "Insurance Expiration Monitor",
    dataType: "INSURANCE_COMPLIANCE",
    schedule: "0 1 * * *",
    syncFn: monitorInsuranceExpirations,
    enabled: true,
    maxConsecutiveFailures: 3,
  });

  console.log("[SyncOrchestrator] Registered 25 sync jobs");
}
