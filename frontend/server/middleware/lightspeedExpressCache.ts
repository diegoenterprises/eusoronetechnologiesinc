/**
 * LIGHTSPEED — Express-level Response Cache for tRPC
 * ═══════════════════════════════════════════════════════════════
 *
 * Sits BEFORE the tRPC handler on `/api/trpc` and caches ALL query
 * responses automatically. This is the nuclear option — every single
 * tRPC query in the entire app gets sub-100ms responses from cache.
 *
 * How it works:
 * 1. Intercepts GET requests to /api/trpc/*
 * 2. Builds a cache key from: procedure path + serialized input + user scope
 * 3. If cached → sends response immediately (< 5ms)
 * 4. If not cached → passes to tRPC, intercepts the response, stores in cache
 * 5. Mutations (POST) bypass cache and optionally invalidate related entries
 *
 * Part of Project LIGHTSPEED — Phase 1
 */

import type { Request, Response, NextFunction } from "express";
import { cacheGet, cacheSet, cacheInvalidate, type CacheTier } from "../services/cache/redisCache";

// ============================================================================
// TTL CONFIGURATION — Per-procedure cache durations (seconds)
// ============================================================================

const ROUTE_TTL: Record<string, number> = {
  // ── BYPASS (0 = never cache) ──
  "auth.me": 0,
  "system.healthCheck": 0,
  "system.dbStatus": 0,
  "system.getPoolStats": 0,

  // ── REALTIME (10-15s) ──
  "tracking.getLive": 10,
  "tracking.getDriverPosition": 10,
  "geolocation.getCurrent": 15,

  // ── FAST (30-60s) — Market data, weather, load board ──
  "hotZones.getRateFeed": 30,
  "hotZones.getMarketPulse": 30,
  "hotZones.getMapIntelligence": 45,
  "hotZones.getZoneDetail": 60,
  "hotZones.getActiveZones": 60,
  "hotZones.getHeatmapData": 60,
  "hotZones.getTopLanes": 60,
  "hotZones.getDriverOpportunities": 30,
  "hotZones.getSurgeHistory": 60,
  "hotZones.getZonesByEquipment": 60,
  "hotZones.getZonesByRegion": 60,
  "hotZones.getPredictions": 120,
  "marketPricing.getMarketIntelligence": 45,
  "marketPricing.getCommodities": 30,
  "marketPricing.getIndices": 60,
  "marketPricing.getFuelIndex": 60,
  "marketPricing.getLaneRates": 60,
  "marketPricing.getFreightRates": 60,
  "marketPricing.getRateCalculator": 60,
  "marketPricing.getSeasonalFactors": 3600,
  "marketPricing.searchCommodity": 30,
  "marketPricing.getCommodityDetail": 60,
  "marketIntelligence.getTheftRisk": 300,
  "marketIntelligence.getMarketIntel": 120,
  "marketIntelligence.getEmissions": 600,
  "marketIntelligence.getResilience": 600,
  "marketIntelligence.getDriverWellness": 120,
  "marketIntelligence.getTariffImpact": 600,
  "marketIntelligence.getSeasonalCalendar": 3600,
  "marketIntelligence.get2026Outlook": 3600,
  "marketIntelligence.getMyLaneDefaults": 300,
  "weather.getCurrent": 60,
  "weather.getForecast": 120,
  "weather.getAlerts": 30,
  "weather.getRouteWeather": 60,
  "weather.getActiveAlerts": 30,
  "weather.getRouteForecast": 60,
  "loadBoard.getAvailableLoads": 15,
  "loadBoard.getLoadDetail": 30,
  "loadBoard.getMatchingLoads": 15,
  "loadBoard.getMyLoads": 20,
  "loadBoard.getMyBids": 20,
  "loadBoard.getLoads": 15,
  "loadBoard.getBids": 20,
  "loadBoard.getStats": 30,

  // ── STANDARD (120-300s) — Dashboards, analytics, fleet ──
  "dashboard.getStats": 120,
  "dashboard.getActiveShipments": 60,
  "dashboard.getRecentActivity": 60,
  "dashboard.getAlerts": 60,
  "dashboard.getFinancials": 120,
  "dashboard.getPerformance": 180,
  "dashboard.getNotifications": 30,
  "dashboard.getTimeline": 60,
  "analytics.getRevenue": 180,
  "analytics.getRevenueBreakdown": 180,
  "analytics.getRevenueTrends": 300,
  "analytics.getRevenueGoals": 300,
  "analytics.getUtilizationSummary": 300,
  "analytics.getUtilizationByVehicle": 300,
  "analytics.getUtilizationByDriver": 300,
  "analytics.getUtilizationTrends": 300,
  "analytics.getTopLanes": 300,
  "analytics.getTopDrivers": 300,
  "analytics.getTopCarriers": 300,
  "analytics.getLoadVolume": 180,
  "analytics.getOnTimePerformance": 300,
  "analytics.getPerformanceMetrics": 300,
  "analytics.getCustomerMetrics": 300,
  "analytics.getFinancialSummary": 180,
  "fleet.getVehicles": 120,
  "fleet.getVehicle": 120,
  "fleet.getGeofences": 300,
  "fleet.getGeofenceStats": 300,
  "fleet.getFleetSummary": 120,
  "drivers.getAll": 120,
  "drivers.getDriver": 120,
  "vehicles.getAll": 120,
  "loads.getAll": 60,
  "loads.getLoad": 30,
  "loads.getStats": 60,
  "bids.getAll": 30,
  "bids.getBid": 30,

  // ── SLOW (600-900s) — Compliance, safety, inspections ──
  "compliance.getDashboardStats": 300,
  "compliance.getExpiringItems": 600,
  "compliance.getDriverCompliance": 600,
  "compliance.getVehicleCompliance": 600,
  "compliance.getStats": 300,
  "safety.getDashboard": 300,
  "safety.getIncidents": 600,
  "safety.getScores": 600,
  "safety.getStats": 300,
  "inspections.getHistory": 600,
  "inspections.getPrevious": 600,
  "inspections.getStats": 600,
  "inspections.getInspections": 600,
  "csaScores.getScores": 600,
  "csaScores.getHistory": 900,
  "documents.getAll": 300,
  "documentCenter.getMyComplianceProfile": 300,
  "documentCenter.getDriverComplianceProfile": 300,

  // ── STATIC (3600s) — Config, reference data ──
  "facilities.getAll": 900,
  "facilities.getFacility": 600,
  "terminal.getAll": 900,
  "terminal.getTerminal": 600,
  "rss.getFeeds": 300,
  "rss.getFeed": 300,
  "rss.getCategories": 3600,
  "news.getArticles": 300,
  "news.getSources": 3600,
  "erg.lookup": 3600,
  "erg.getGuide": 3600,
  "restStops.search": 600,
  "restStops.getNearby": 600,
  "scales.search": 600,
  "permits.getRequirements": 900,
  "fmcsaData.searchCarriers": 60,
  "fmcsaData.lookupCarrier": 120,
  "fmcsaData.getCarrierSnapshot": 120,
  "lightspeed.typeahead": 15,
  "lightspeed.carrierProfile": 120,
  "lightspeed.riskScore": 300,
  "lightspeed.batchRiskScores": 300,
  "lightspeed.dashboardKPIs": 120,
  "onboarding.getChecklist": 300,
  "onboarding.getRequiredDocuments": 300,

  // ── ACCOUNTING / BILLING / EARNINGS / PAYMENTS / PAYROLL ──
  "accounting.getSummary": 180,
  "accounting.getTransactions": 120,
  "accounting.getReport": 300,
  "billing.getSummary": 180,
  "billing.getInvoices": 120,
  "billing.getInvoice": 120,
  "earnings.getSummary": 120,
  "earnings.getHistory": 180,
  "earnings.getBreakdown": 180,
  "payments.getHistory": 180,
  "payments.getPending": 60,
  "payroll.getSummary": 300,
  "payroll.getPayStubs": 300,
  "taxReporting.getSummary": 900,
  "taxReporting.getForms": 900,
  "commissionEngine.getRates": 600,
  "commissionEngine.getSummary": 300,
  "platformFees.getRates": 3600,
  "platformFees.getSummary": 300,
  "factoring.getSummary": 180,
  "factoring.getInvoices": 120,
  "settlementBatching.getBatches": 120,
  "settlementBatching.getBatch": 120,

  // ── CARRIERS / BROKERS / SHIPPERS / CATALYSTS / COMPANIES ──
  "carrierScorecard.getScorecard": 300,
  "carrierScorecard.getHistory": 600,
  "catalysts.getAll": 120,
  "catalysts.getCatalyst": 120,
  "catalystPackets.getAll": 300,
  "brokers.getAll": 120,
  "brokers.getBroker": 120,
  "shippers.getAll": 120,
  "shippers.getShipper": 120,
  "companies.getAll": 120,
  "companies.getCompany": 120,
  "companies.getStats": 180,
  "customers.getAll": 120,
  "customers.getCustomer": 120,
  "customerPortal.getDashboard": 120,
  "contacts.getAll": 120,
  "contacts.getContact": 120,

  // ── DRIVERS / VEHICLES / EQUIPMENT ──
  "drivers.getStats": 180,
  "driverQualification.getStatus": 300,
  "driverQualification.getAll": 300,
  "vehicle.getAll": 120,
  "vehicle.getVehicle": 120,
  "vehicles.getVehicle": 120,
  "equipment.getAll": 120,
  "equipment.getEquipment": 120,
  "equipmentIntelligence.getAnalysis": 300,
  "equipmentIntelligence.getRecommendations": 600,

  // ── DISPATCH / ROUTING / NAVIGATION / TRACKING ──
  "dispatch.getBoard": 30,
  "dispatch.getDrivers": 60,
  "dispatch.getStats": 60,
  "dispatchPlanner.getPlan": 60,
  "dispatchPlanner.getOptimized": 120,
  "dispatchRole.getDashboard": 60,
  "dispatchRole.getStats": 60,
  "routing.getRoute": 120,
  "routing.getOptimal": 120,
  "routes.getAll": 120,
  "routes.getRoute": 120,
  "navigation.getRoute": 60,
  "navigation.getDirections": 60,
  "tracking.getAll": 15,
  "tracking.getLoad": 15,
  "geolocation.getNearby": 30,
  "geofencing.getAll": 300,
  "geofencing.getGeofence": 300,
  "location.getCurrent": 15,
  "location.getHistory": 120,
  "traffic.getCurrent": 30,
  "traffic.getRoute": 60,
  "tolls.getEstimate": 300,
  "tolls.getHistory": 600,
  "mileage.getReport": 300,
  "mileage.getSummary": 300,

  // ── LOADS / BIDS / CONTRACTS / AGREEMENTS ──
  "loadLifecycle.getTimeline": 60,
  "loadLifecycle.getStatus": 30,
  "loadBidding.getActiveBids": 20,
  "loadBidding.getBid": 30,
  "laneContracts.getAll": 300,
  "laneContracts.getContract": 300,
  "laneRates.getAll": 300,
  "laneRates.getRate": 300,
  "lanes.getAll": 300,
  "lanes.getLane": 300,
  "agreements.getAll": 300,
  "agreements.getAgreement": 300,
  "contracts.getAll": 300,
  "contracts.getContract": 300,
  "shipperContracts.getAll": 300,
  "negotiations.getAll": 120,
  "negotiations.getNegotiation": 60,
  "rateNegotiations.getAll": 120,
  "rateConfirmations.getAll": 120,
  "rateSheet.getAll": 600,
  "rates.getAll": 300,
  "rates.getRate": 300,
  "quotes.getAll": 120,
  "quotes.getQuote": 120,
  "pricebook.getAll": 600,
  "pricebook.getEntry": 600,

  // ── SAFETY / HAZMAT / INCIDENTS / ACCIDENTS / DRUG TESTING ──
  "safety.getAlerts": 120,
  "safetyAlerts.getAll": 120,
  "safetyAlerts.getAlert": 120,
  "hazmat.getRequirements": 900,
  "hazmat.getGuide": 3600,
  "hazmat.getShipments": 300,
  "incidents.getAll": 600,
  "incidents.getIncident": 600,
  "accidents.getAll": 600,
  "accidents.getAccident": 600,
  "drugTesting.getStatus": 300,
  "drugTesting.getHistory": 600,
  "clearinghouse.getStatus": 300,
  "emergencyResponse.getGuide": 3600,
  "emergencyResponse.getContacts": 900,

  // ── COMPLIANCE / REGULATORY / PERMITS / AUTHORITY ──
  "complianceNetworks.getStatus": 300,
  "regulatory.getRequirements": 900,
  "regulatory.getUpdates": 300,
  "permits.getAll": 600,
  "permits.getPermit": 600,
  "interstate.getRequirements": 900,
  "authority.getStatus": 300,
  "authority.getHistory": 600,
  "cdlVerification.getStatus": 300,
  "certifications.getAll": 300,
  "certifications.getCertification": 300,

  // ── ELD / HOS / FUEL / MAINTENANCE / SCADA ──
  "eld.getLogs": 60,
  "eld.getStatus": 30,
  "eld.getViolations": 120,
  "hos.getStatus": 30,
  "hos.getLogs": 60,
  "hos.getViolations": 120,
  "fuel.getSummary": 180,
  "fuel.getTransactions": 120,
  "fuelCards.getAll": 300,
  "fuelCards.getTransactions": 120,
  "fscEngine.getRate": 300,
  "fscEngine.getSurcharge": 300,
  "maintenance.getSchedule": 300,
  "maintenance.getHistory": 600,
  "maintenance.getAlerts": 120,
  "scada.getReadings": 15,
  "scada.getAlerts": 30,
  "reeferTemp.getCurrent": 15,
  "reeferTemp.getHistory": 120,
  "telemetry.getCurrent": 15,
  "telemetry.getHistory": 120,

  // ── DOCUMENTS / BOL / POD / RUN TICKETS / SIGNATURES ──
  "documents.getDocument": 300,
  "documentVerification.getStatus": 300,
  "bol.getAll": 120,
  "bol.getBol": 120,
  "pod.getAll": 120,
  "pod.getPod": 120,
  "runTickets.getAll": 120,
  "runTickets.getTicket": 120,
  "signatures.getAll": 300,
  "exports.getAll": 300,

  // ── MESSAGING / NOTIFICATIONS / ANNOUNCEMENTS / CHANNELS ──
  "messages.getAll": 30,
  "messages.getThread": 30,
  "messaging.getAll": 30,
  "messaging.getThread": 30,
  "notifications.getAll": 15,
  "notifications.getUnread": 15,
  "announcements.getAll": 120,
  "announcements.getAnnouncement": 120,
  "channels.getAll": 120,
  "channels.getChannel": 60,

  // ── AI / ML / EMBEDDINGS / SPECTRA MATCH ──
  "aiHealth.getStatus": 60,
  "aiHealth.getMetrics": 120,
  "ml.getPredictions": 120,
  "ml.getModels": 600,
  "embeddings.search": 30,
  "spectraMatch.getMatches": 60,
  "spectraMatch.getScore": 120,
  "visualIntelligence.getAnalysis": 300,
  "taskDecomposition.getTasks": 120,
  "optimizationPipeline.getStatus": 120,

  // ── FACILITIES / TERMINALS / REST STOPS / SCALES ──
  "facility.getAll": 900,
  "facility.getFacility": 600,
  "facilityIntelligence.getAnalysis": 600,
  "appointments.getAppointment": 120,

  // ── MARKET / SUPPLY CHAIN / FUEL INDEX ──
  "market.getOverview": 60,
  "market.getTrends": 120,
  "supplyChain.getStatus": 120,
  "supplyChain.getAlerts": 60,
  "supplyChain.getAnalysis": 300,

  // ── MISC: ACTIVITY, ALERTS, BOOKMARKS, GAMIFICATION, ETC ──
  "activity.getRecent": 60,
  "activity.getAll": 120,
  "alerts.getAll": 30,
  "alerts.getActive": 30,
  "bookmarks.getAll": 120,
  "gamification.getStats": 180,
  "gamification.getLeaderboard": 300,
  "rewards.getAll": 300,
  "rewards.getBalance": 120,
  "ratings.getAll": 300,
  "ratings.getAverage": 300,
  "feedback.getAll": 300,
  "help.getArticles": 3600,
  "help.search": 300,
  "legal.getDocuments": 3600,
  "legal.getDocument": 3600,
  "features.getAll": 3600,
  "features.getFlags": 3600,
  "preferences.getAll": 300,
  "settings.getAll": 300,
  "profile.get": 120,
  "profile.getPublic": 300,
  "users.getAll": 120,
  "users.getUser": 120,
  "team.getAll": 120,
  "team.getMember": 120,
  "widgets.getAll": 300,
  "widgets.getData": 60,
  "sidebar.getConfig": 3600,
  "quickActions.getAll": 600,

  // ── ADMIN / AUDIT / SECURITY / DEVELOPER ──
  "admin.getStats": 120,
  "admin.getUsers": 120,
  "auditLogs.getAll": 300,
  "auditLogs.getLog": 300,
  "security.getStatus": 120,
  "security.getAlerts": 60,
  "developer.getApiKeys": 300,
  "developer.getWebhooks": 300,
  "superAdmin.getStats": 120,
  "superAdmin.getUsers": 120,

  // ── CONVOY / ESCORTS / INSURANCE / CLAIMS / VENDORS ──
  "convoy.getAll": 120,
  "convoy.getConvoy": 120,
  "escorts.getAll": 120,
  "escorts.getEscort": 120,
  "insurance.getAll": 300,
  "insurance.getPolicy": 300,
  "claims.getAll": 300,
  "claims.getClaim": 300,
  "vendors.getAll": 300,
  "vendors.getVendor": 300,

  // ── RSS / NEWS / NEWSFEED ──
  "rss.getAll": 300,
  "news.getAll": 300,
  "news.getArticle": 300,
  "newsfeed.getAll": 120,
  "newsfeed.getFeed": 120,

  // ── FMCSA / AUTHORITY / CSA ──
  "fmcsa.searchCarriers": 60,
  "fmcsa.getCarrier": 120,
  "fmcsa.getSafetyScores": 300,

  // ── ZEUN / SUPPORT / TICKETS ──
  "zeun.getStatus": 60,
  "zeun.getHistory": 120,
  "zeunMechanics.getAll": 120,
  "support.getTickets": 120,
  "support.getTicket": 120,
  "eusoTicket.getAll": 120,
  "eusoTicket.getTicket": 120,

  // ── TRAILER / TRUCK POSTING / ACCESSORIAL ──
  "trailerRegulatory.getRequirements": 900,
  "truckPosting.getAll": 30,
  "truckPosting.getPosting": 60,
  "accessorial.getAll": 600,
  "accessorial.getRates": 600,

  // ── TRAINING / PROCEDURES / RESOURCE ──
  "training.getAll": 600,
  "training.getCourse": 600,
  "procedures.getAll": 900,
  "procedures.getProcedure": 900,
  "resourceBroadcasts.getAll": 120,
  "resourcePreAnalysis.getAnalysis": 300,

  // ── PRODUCT PROFILES / DATA STORE / SEARCH / SYNC ──
  "productProfiles.getAll": 600,
  "productProfiles.getProfile": 600,
  "dataStore.get": 120,
  "dataStore.getAll": 120,
  "search.query": 15,
  "search.getRecent": 120,
  "sync.getStatus": 30,

  // ── ALLOCATION / SCHEDULING ──
  "allocationTracker.getAll": 120,
  "allocationTracker.getAllocation": 120,
  "hrrnScheduler.getQueue": 30,
  "hrrnScheduler.getStats": 60,

  // ── JOBS / INVITE / REGISTRATION / APPROVAL ──
  "jobs.getAll": 300,
  "jobs.getJob": 300,
  "invite.getAll": 300,
  "registration.getStatus": 300,
  "approval.getAll": 120,
  "approval.getPending": 60,

  // ── BULK IMPORT / INTEGRATIONS / ENCRYPTION ──
  "bulkImport.getStatus": 120,
  "integrations.getAll": 600,
  "integrations.getIntegration": 600,
  "encryption.getStatus": 600,

  // ── INVENTORY / WALLET ──
  "inventory.getAll": 120,
  "inventory.getItem": 120,
  "wallet.getBalance": 30,
  "wallet.getTransactions": 60,
};

// Paths where cache key should be scoped per-user (different data per user)
const USER_SCOPED = new Set([
  // Dashboard & Analytics
  "dashboard.getStats", "dashboard.getActiveShipments", "dashboard.getRecentActivity",
  "dashboard.getAlerts", "dashboard.getFinancials", "dashboard.getPerformance",
  "dashboard.getNotifications", "dashboard.getTimeline",
  "analytics.getRevenue", "analytics.getRevenueBreakdown", "analytics.getRevenueTrends",
  "analytics.getRevenueGoals", "analytics.getFinancialSummary",
  // Loads & Bids
  "loads.getAll", "loads.getLoad", "loads.getStats",
  "bids.getAll", "bids.getBid",
  "loadBoard.getMyLoads", "loadBoard.getMyBids",
  "loadBidding.getActiveBids", "loadBidding.getBid",
  // Fleet & Drivers
  "fleet.getVehicles", "fleet.getFleetSummary",
  "drivers.getAll", "drivers.getDriver", "drivers.getStats",
  "vehicles.getAll", "vehicle.getAll",
  // Market Intelligence
  "marketIntelligence.getMyLaneDefaults",
  // Compliance & Safety
  "compliance.getDashboardStats", "compliance.getExpiringItems",
  "compliance.getDriverCompliance", "compliance.getVehicleCompliance", "compliance.getStats",
  "safety.getDashboard", "safety.getIncidents", "safety.getStats",
  "inspections.getHistory", "inspections.getPrevious", "inspections.getStats",
  "inspections.getInspections",
  // Documents
  "documents.getAll", "documents.getDocument",
  "documentCenter.getMyComplianceProfile", "documentCenter.getDriverComplianceProfile",
  // Onboarding
  "onboarding.getChecklist", "onboarding.getRequiredDocuments",
  // Financial
  "accounting.getSummary", "accounting.getTransactions",
  "billing.getSummary", "billing.getInvoices",
  "earnings.getSummary", "earnings.getHistory", "earnings.getBreakdown",
  "payments.getHistory", "payments.getPending",
  "payroll.getSummary", "payroll.getPayStubs",
  "factoring.getSummary", "factoring.getInvoices",
  "wallet.getBalance", "wallet.getTransactions",
  // Messaging & Notifications
  "messages.getAll", "messages.getThread",
  "messaging.getAll", "messaging.getThread",
  "notifications.getAll", "notifications.getUnread",
  // Profile & Settings
  "profile.get", "preferences.getAll", "settings.getAll",
  "bookmarks.getAll",
  // Dispatch
  "dispatch.getBoard", "dispatchRole.getDashboard",
  // ELD / HOS
  "eld.getLogs", "eld.getStatus", "eld.getViolations",
  "hos.getStatus", "hos.getLogs", "hos.getViolations",
  // Certifications & Drug Testing
  "certifications.getAll", "drugTesting.getStatus", "drugTesting.getHistory",
  "driverQualification.getStatus", "driverQualification.getAll",
  "cdlVerification.getStatus",
  // Gamification
  "gamification.getStats", "rewards.getAll", "rewards.getBalance",
]);

// Paths where cache key is scoped per-role (same data for all users of same role)
const ROLE_SCOPED = new Set([
  "hotZones.getRateFeed", "hotZones.getActiveZones", "hotZones.getMarketPulse",
  "hotZones.getHeatmapData", "hotZones.getDriverOpportunities",
]);

// Prefixes that should NEVER be cached
const BYPASS_PREFIXES = ["auth.", "system.", "stripe.", "wallet.", "push.", "sms.", "esang."];

// Default TTL for any query not explicitly configured (still cached!)
const DEFAULT_TTL = 30;

// ============================================================================
// MIDDLEWARE
// ============================================================================

let _hitCount = 0;
let _missCount = 0;
let _bypassCount = 0;

/**
 * Express middleware that caches tRPC query responses.
 * Mount BEFORE the tRPC handler on /api/trpc.
 */
export function lightspeedResponseCache() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests (tRPC queries use GET, mutations use POST)
    if (req.method !== "GET") {
      // Mutations bypass — but fire-and-forget invalidation for the router namespace
      if (req.method === "POST") {
        const path = extractProcedurePath(req);
        if (path) {
          const ns = path.split(".")[0];
          // Non-blocking invalidation
          Promise.all([
            cacheInvalidate("HOT", `lsq:${ns}.*`).catch(() => {}),
            cacheInvalidate("WARM", `lsq:${ns}.*`).catch(() => {}),
          ]);
        }
      }
      return next();
    }

    const path = extractProcedurePath(req);
    if (!path) return next();

    // tRPC batch: path = "hotZones.getRateFeed,dashboard.getStats"
    // Split into individual procedures to check bypass and compute TTL
    const procedures = path.split(",");

    // Check bypass — if ANY procedure in the batch should be bypassed, bypass all
    if (procedures.some(p => BYPASS_PREFIXES.some(bp => p.startsWith(bp)))) {
      _bypassCount++;
      return next();
    }

    // Determine TTL — use the MINIMUM TTL across all procedures in batch
    const ttls = procedures.map(p => ROUTE_TTL[p] ?? DEFAULT_TTL);
    const ttl = Math.min(...ttls);
    if (ttl === 0) {
      _bypassCount++;
      return next();
    }

    // Build cache key — use full path (handles batches) + input + user scope
    const inputHash = buildInputHash(req);
    // For user scoping in batches, check if ANY procedure needs user scope
    const needsUserScope = procedures.some(p => USER_SCOPED.has(p));
    const needsRoleScope = !needsUserScope && procedures.some(p => ROLE_SCOPED.has(p));
    const userScope = needsUserScope ? buildUserScope(procedures[0], req) : (needsRoleScope ? buildRoleScope(procedures[0], req) : "");
    const cacheKey = `lsq:${path}${userScope}:${inputHash}`;
    const tier: CacheTier = ttl <= 60 ? "HOT" : "WARM";

    // Try cache hit
    try {
      const cached = await cacheGet<CachedResponse>(tier, cacheKey);
      if (cached) {
        _hitCount++;
        // Add LIGHTSPEED headers for debugging
        res.setHeader("X-Lightspeed-Cache", "HIT");
        res.setHeader("X-Lightspeed-TTL", String(ttl));
        res.setHeader("Content-Type", cached.contentType || "application/json");
        return res.status(cached.status || 200).send(cached.body);
      }
    } catch {
      // Cache read failed — fall through to execute
    }

    _missCount++;
    res.setHeader("X-Lightspeed-Cache", "MISS");
    res.setHeader("X-Lightspeed-TTL", String(ttl));

    // Intercept the response to cache it
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    let responseCaptured = false;

    const captureAndCache = (body: any) => {
      if (responseCaptured) return;
      responseCaptured = true;

      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 400) {
        const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
        const toCache: CachedResponse = {
          body: bodyStr,
          status: res.statusCode,
          contentType: res.getHeader("content-type") as string || "application/json",
        };
        // Fire-and-forget cache write
        cacheSet(tier, cacheKey, toCache, ttl).catch(() => {});
      }
    };

    // Override res.json
    res.json = function (body: any) {
      captureAndCache(body);
      return originalJson(body);
    };

    // Override res.send
    res.send = function (body: any) {
      captureAndCache(body);
      return originalSend(body);
    } as any;

    return next();
  };
}

// ============================================================================
// HELPERS
// ============================================================================

interface CachedResponse {
  body: string;
  status: number;
  contentType: string;
}

/**
 * Extract the tRPC procedure path from the request URL.
 * tRPC batch: /api/trpc/hotZones.getRateFeed,dashboard.getStats?batch=1&input=...
 * tRPC single: /api/trpc/hotZones.getRateFeed?input=...
 */
function extractProcedurePath(req: Request): string | null {
  const url = req.url || req.originalUrl || "";
  // Strip /api/trpc/ prefix
  const match = url.match(/\/api\/trpc\/([^?]+)/);
  if (!match) {
    // Handle when mounted at /api/trpc — path is just after /
    const path = req.path?.replace(/^\//, "");
    return path || null;
  }
  return match[1];
}

/**
 * Build a deterministic hash from the request input/query params.
 */
function buildInputHash(req: Request): string {
  const input = req.query?.input;
  if (!input) return "_";
  if (typeof input === "string") {
    // Truncate very long inputs to prevent cache key explosion
    return input.length > 500 ? input.slice(0, 500) : input;
  }
  return "_";
}

/**
 * Build user scope for the cache key.
 */
function buildUserScope(path: string, req: Request): string {
  const user = (req as any).user || (req as any).ctx?.user;
  const userId = user?.id || req.headers["x-user-id"];
  return userId ? `:u${userId}` : ":uanon";
}

/**
 * Build role scope for the cache key.
 */
function buildRoleScope(path: string, req: Request): string {
  const user = (req as any).user || (req as any).ctx?.user;
  const role = user?.role || req.headers["x-user-role"];
  return role ? `:r${role}` : "";
}

// ============================================================================
// DIAGNOSTICS
// ============================================================================

/**
 * Get cache hit/miss stats for monitoring.
 */
export function getLightspeedStats() {
  const total = _hitCount + _missCount + _bypassCount;
  return {
    hits: _hitCount,
    misses: _missCount,
    bypassed: _bypassCount,
    total,
    hitRate: total > 0 ? +((_hitCount / total) * 100).toFixed(1) : 0,
    label: "LIGHTSPEED Express Response Cache",
  };
}

/**
 * Reset stats (for testing).
 */
export function resetLightspeedStats() {
  _hitCount = 0;
  _missCount = 0;
  _bypassCount = 0;
}
