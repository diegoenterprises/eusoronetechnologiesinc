/**
 * Hot Zones Data Integration — Export all 25 integration services
 * 10 original + 12 Phase 2 + 3 EPA Enhanced = 30 government data feeds
 */

// ── Original 10 integrations ──
export { fetchWeatherAlerts } from "./nws/weatherAlerts";
export { fetchEIAFuelPrices } from "./eia/fuelPrices";
export { fetchCarrierSafety, syncCarrierSafetyData } from "./fmcsa/carrierSafety";
export { fetchRecentEarthquakes } from "./usgs/earthquakes";
export { syncPHMSAIncidents } from "./phmsa/hazmatIncidents";
export { fetchActiveWildfires } from "./nifc/wildfires";
export { fetchActiveDisasters } from "./fema/disasters";
export { fetchTRIFacilities, fetchECHOCompliance, syncAllEPAFacilities } from "./epa/facilities";
export { fetchUSDATruckRates } from "./usda/truckRates";
export { fetchLockStatus } from "./usace/locks";

// ── Phase 2 integrations ──
export { fetchCrudePrices } from "./eia/crudePrices";
export { fetchRefineryData } from "./eia/refineryData";
export { lookupCarrier, lookupAndCacheCarrier } from "./fmcsa/carrierCensus";
export { processMCMISBulkCensus } from "./fmcsa/mcmisBulk";
export { fetchHazmatRegistrations } from "./phmsa/hazmatRegistration";
export { fetchSpillReports } from "./nrc/spillReports";
export { fetchBridgeRestrictions } from "./fhwa/bridges";
export { fetchTruckParking } from "./fhwa/truckParking";
export { fetchRoadConditions } from "./state511/roadConditions";
export { fetchNewRegulations } from "./federalRegister/regulations";
export { fetchTexasProduction } from "./stateProduction/texasRRC";
export { fetchNDProduction } from "./stateProduction/ndDMR";

// ── Phase 3: Enhanced EPA (CAMPD + ECHO Haz Waste + Corrected Endpoints) ──
export { syncCleanAirMarkets, fetchAnnualEmissions } from "./epa/cleanAirMarkets";
export { syncECHOHazWaste, fetchRCRAHandlers } from "./epa/echoHazWaste";
