import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { aggregateAllFeeds, getAllCategories, RSS_FEEDS } from "./services/rssAggregator";
import { loadsRouter, bidsRouter } from "./routers/loads";
import { inhouseRouter } from "./routers/inhouse";
import { paymentsRouter } from "./routers/payments";
import { usersRouter } from "./routers/users";
import { companiesRouter } from "./routers/companies";
// ESANG AI router - uses Gemini API
import { esangRouter } from "./esangRouter";
import { dashboardRouter } from "./routers/dashboard";
import { inspectionsRouter } from "./routers/inspections";
import { hosRouter } from "./routers/hos";
import { notificationsRouter } from "./routers/notifications";
import { documentsRouter } from "./routers/documents";
import { dispatchRouter } from "./routers/dispatch";
import { auditLogsRouter } from "./routers/auditLogs";
import { billingRouter } from "./routers/billing";
import { earningsRouter } from "./routers/earnings";
import { fleetRouter } from "./routers/fleet";
import { safetyRouter } from "./routers/safety";
import { complianceRouter } from "./routers/compliance";
import { trainingRouter } from "./routers/training";
import { messagesRouter } from "./routers/messages";
import { ratesRouter } from "./routers/rates";
import { terminalsRouter } from "./routers/terminals";
import { escortsRouter } from "./routers/escorts";
import { driversRouter } from "./routers/drivers";
import { analyticsRouter } from "./routers/analytics";
import { carriersRouter } from "./routers/carriers";
import { brokersRouter } from "./routers/brokers";
import { shippersRouter } from "./routers/shippers";
import { incidentsRouter } from "./routers/incidents";
import { weatherRouter } from "./routers/weather";
import { geolocationRouter } from "./routers/geolocation";
import { ergRouter } from "./routers/erg";
import { appointmentsRouter } from "./routers/appointments";
import { permitsRouter } from "./routers/permits";
import { facilitiesRouter } from "./routers/facilities";
import { catalystsRouter } from "./routers/catalysts";
import { adminRouter } from "./routers/admin";
import { supportRouter } from "./routers/support";
import { profileRouter } from "./routers/profile";
import { settingsRouter } from "./routers/settings";
import { walletRouter } from "./routers/wallet";
import { newsfeedRouter } from "./routers/newsfeed";
import { contactsRouter } from "./routers/contacts";
import { claimsRouter } from "./routers/claims";
import { fuelRouter } from "./routers/fuel";
import { ratingsRouter } from "./routers/ratings";
import { inventoryRouter } from "./routers/inventory";
import { reportsRouter } from "./routers/reports";
import { routesRouter } from "./routers/routes";
import { trackingRouter } from "./routers/tracking";
import { equipmentRouter } from "./routers/equipment";
import { quotesRouter } from "./routers/quotes";
import { lanesRouter } from "./routers/lanes";
import { customersRouter } from "./routers/customers";
import { vendorsRouter } from "./routers/vendors";
import { contractsRouter } from "./routers/contracts";
import { accountingRouter } from "./routers/accounting";
import { certificationsRouter } from "./routers/certifications";
import { drugTestingRouter } from "./routers/drugTesting";
import { accidentsRouter } from "./routers/accidents";
import { driverQualificationRouter } from "./routers/driverQualification";
import { factoringRouter } from "./routers/factoring";
import { inspectionFormsRouter } from "./routers/inspectionForms";
import { loadBoardRouter } from "./routers/loadBoard";
import { csaScoresRouter } from "./routers/csaScores";
import { scadaRouter } from "./routers/scada";
import { gamificationRouter } from "./routers/gamification";
import { clearinghouseRouter } from "./routers/clearinghouse";
import { spectraMatchRouter } from "./routers/spectraMatch";
import { eusoTicketRouter } from "./routers/eusoTicket";
import { payrollRouter } from "./routers/payroll";
import { alertsRouter } from "./routers/alerts";
import { activityRouter } from "./routers/activity";
import { insuranceRouter } from "./routers/insurance";
import { onboardingRouter } from "./routers/onboarding";
import { registrationRouter } from "./routers/registration";
import { maintenanceRouter } from "./routers/maintenance";
import { announcementsRouter } from "./routers/announcements";
import { bolRouter } from "./routers/bol";
import { newsRouter } from "./routers/news";
import { marketRouter } from "./routers/market";
import { vehicleRouter } from "./routers/vehicle";
import { routingRouter } from "./routers/routing";
import { teamRouter } from "./routers/team";
import { featuresRouter } from "./routers/features";
import { securityRouter } from "./routers/security";
import { tollsRouter } from "./routers/tolls";
import { trafficRouter } from "./routers/traffic";
import { shipperContractsRouter } from "./routers/shipperContracts";
import { legalRouter } from "./routers/legal";
import { smsRouter } from "./routers/sms";
import { pushRouter } from "./routers/push";
import { fuelCardsRouter } from "./routers/fuelCards";
import { facilityRouter } from "./routers/facility";
import { exportsRouter } from "./routers/exports";
import { eldRouter } from "./routers/eld";
import { developerRouter } from "./routers/developer";
import { rateConfirmationsRouter } from "./routers/rateConfirmations";
import { quickActionsRouter } from "./routers/quickActions";
import { laneRatesRouter } from "./routers/laneRates";
import { helpRouter } from "./routers/help";
import { feedbackRouter } from "./routers/feedback";
import { rewardsRouter } from "./routers/rewards";
import { bookmarksRouter } from "./routers/bookmarks";
import { carrierPacketsRouter } from "./routers/carrierPackets";
import { hazmatRouter } from "./routers/hazmat";
import { platformFeesRouter } from "./routers/platformFees";
import { podRouter } from "./routers/pod";
import { mileageRouter } from "./routers/mileage";
import { preferencesRouter } from "./routers/preferences";
import { proceduresRouter } from "./routers/procedures";
import { restStopsRouter } from "./routers/restStops";
import { scalesRouter } from "./routers/scales";
import { searchRouter } from "./routers/search";
import { vehiclesRouter } from "./routers/vehicles";
import { jobsRouter } from "./routers/jobs";
import { channelsRouter } from "./routers/channels";
import { zeunRouter } from "./routers/zeun";
import { telemetryRouter } from "./routers/telemetry";
import { geofencingRouter } from "./routers/geofencing";
import { navigationRouter } from "./routers/navigation";
import { convoyRouter } from "./routers/convoy";
import { safetyAlertsRouter } from "./routers/safetyAlerts";
import { zeunMechanicsRouter } from "./routers/zeunMechanics";
import { runTicketsRouter } from "./routers/runTickets";
import { negotiationsRouter } from "./routers/negotiations";
import { integrationsRouter } from "./routers/integrations";
import { superAdminRouter } from "./routers/superAdmin";
import { widgetsRouter } from "./routers/widgets";
import { messagingRouter } from "./routers/messaging";
import { marketPricingRouter } from "./routers/marketPricing";
import { hotZonesRouter } from "./routers/hotZones";
import { signaturesRouter } from "./routers/signatures";
import { emergencyResponseRouter } from "./routers/emergencyResponse";
import { agreementsRouter } from "./routers/agreements";
import { loadBiddingRouter } from "./routers/loadBidding";
import { rateNegotiationsRouter } from "./routers/rateNegotiations";
import { laneContractsRouter } from "./routers/laneContracts";
import { stripeRouter } from "./routers/stripe";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure.input(z.object({ email: z.string(), password: z.string() })).mutation(async ({ input, ctx }) => {
      const { authService } = await import("./_core/auth");
      const result = await authService.loginWithCredentials(input.email, input.password);
      if (!result) {
        throw new Error("Invalid credentials");
      }
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, result.token, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });
      return { success: true, user: result.user };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    // 2FA procedures
    get: protectedProcedure.query(async () => ({ enabled: false, method: "authenticator" })),
    setup: protectedProcedure.query(async () => ({ qrCode: "data:image/png;base64,abc123", secret: "ABCD1234EFGH5678", backupCodes: ["12345678", "87654321"] })),
    enable: protectedProcedure.input(z.object({ code: z.string() })).mutation(async () => ({ success: true })),
    disable: protectedProcedure.input(z.object({ code: z.string().optional() })).mutation(async () => ({ success: true })),
    regenerateBackupCodes: protectedProcedure.input(z.object({}).optional()).mutation(async () => ({ success: true, backupCodes: ["11111111", "22222222", "33333333"] })),
    changePassword: protectedProcedure.input(z.object({ currentPassword: z.string(), newPassword: z.string() })).mutation(async () => ({ success: true })),
    get2FAStatus: protectedProcedure.query(async () => ({ enabled: false, method: "authenticator", backupCodesRemaining: 8, backupCodes: ["ABC123", "DEF456", "GHI789", "JKL012", "MNO345", "PQR678", "STU901", "VWX234"] })),
    setup2FA: protectedProcedure.query(async () => ({ qrCode: "data:image/png;base64,abc123", secret: "ABCD1234EFGH5678", backupCodes: ["12345678", "87654321"] })),
    enable2FA: protectedProcedure.input(z.object({ code: z.string() })).mutation(async () => ({ success: true })),
    disable2FA: protectedProcedure.input(z.object({ code: z.string().optional() }).optional()).mutation(async () => ({ success: true })),
  }),

  rss: router({
    allFeeds: publicProcedure.query(async () => {
      return await aggregateAllFeeds();
    }),
    categories: publicProcedure.query(() => {
      return getAllCategories();
    }),
    allFeedSources: publicProcedure.query(() => {
      return RSS_FEEDS;
    }),
  }),

  loads: loadsRouter,
  bids: bidsRouter,
  payments: paymentsRouter,
  users: usersRouter,
  companies: companiesRouter,

  // Dashboard data for all widgets
  dashboard: dashboardRouter,

  // Inspections (Pre-Trip, DVIR)
  inspections: inspectionsRouter,

  // Hours of Service (ELD)
  hos: hosRouter,

  // Notifications
  notifications: notificationsRouter,

  // Documents
  documents: documentsRouter,

  // Dispatch Board
  dispatch: dispatchRouter,

  // Audit Logs
  auditLogs: auditLogsRouter,

  // Billing & Invoicing
  billing: billingRouter,

  // Stripe Payments (checkout, Connect, subscriptions, payment methods)
  stripe: stripeRouter,

  // Driver/Carrier Earnings
  earnings: earningsRouter,

  // Fleet Management
  fleet: fleetRouter,

  // Safety Management
  safety: safetyRouter,

  // Compliance Management
  compliance: complianceRouter,

  // External Integrations (FMCSA, ELD, Clearinghouse)
  integrations: integrationsRouter,

  // Training Management
  training: trainingRouter,

  // Messaging
  messages: messagesRouter,

  // Company Channels
  channels: channelsRouter,

  // Rate Calculator & Market Data
  rates: ratesRouter,

  // Terminal Operations
  terminals: terminalsRouter,

  // Escort/Pilot Car Operations
  escorts: escortsRouter,

  // Driver Management
  drivers: driversRouter,

  // Driver Jobs
  jobs: jobsRouter,

  // Analytics & Reporting
  analytics: analyticsRouter,

  // Carrier Management
  carriers: carriersRouter,

  // Broker Operations
  brokers: brokersRouter,

  // Shipper Operations
  shippers: shippersRouter,

  // Incident Management
  incidents: incidentsRouter,

  // Weather & Route Conditions
  weather: weatherRouter,

  // GPS Tracking & Geofencing
  geolocation: geolocationRouter,

  // ERG 2024 Hazmat Reference
  erg: ergRouter,

  // Appointment Scheduling
  appointments: appointmentsRouter,

  // Oversize/Overweight Permits
  permits: permitsRouter,

  // Facility Management
  facilities: facilitiesRouter,

  // Catalyst/Dispatch Operations
  catalysts: catalystsRouter,

  // Admin/Super Admin Operations
  admin: adminRouter,

  // Support & Help Center
  support: supportRouter,

  // User Profile
  profile: profileRouter,

  // User Settings
  settings: settingsRouter,

  // EusoWallet Digital Payments
  wallet: walletRouter,

  // News Feed & Market Data
  newsfeed: newsfeedRouter,

  // Contact Management
  contacts: contactsRouter,

  // Claims & Disputes
  claims: claimsRouter,

  // Fuel Management
  fuel: fuelRouter,

  // Ratings & Reviews
  ratings: ratingsRouter,

  // Terminal Inventory
  inventory: inventoryRouter,

  // Reports & Analytics
  reports: reportsRouter,

  // Route Planning
  routes: routesRouter,

  // Real-Time Tracking
  tracking: trackingRouter,

  // Equipment/Trailer Management
  equipment: equipmentRouter,

  // Freight Quotes
  quotes: quotesRouter,

  // Freight Lanes
  lanes: lanesRouter,

  // Customer Management
  customers: customersRouter,

  // Vendor Management
  vendors: vendorsRouter,

  // Contracts & Agreements
  contracts: contractsRouter,

  // Accounting & Finance
  accounting: accountingRouter,

  // Certifications & Compliance
  certifications: certificationsRouter,

  // Drug & Alcohol Testing
  drugTesting: drugTestingRouter,

  // Accident Reporting
  accidents: accidentsRouter,

  // Driver Qualification Files (49 CFR 391.51)
  driverQualification: driverQualificationRouter,

  // Freight Factoring & Quick Pay
  factoring: factoringRouter,

  // DVIR & Inspection Forms
  inspectionForms: inspectionFormsRouter,

  // Load Board
  loadBoard: loadBoardRouter,

  // FMCSA CSA Scores
  csaScores: csaScoresRouter,

  // Terminal SCADA Integration
  scada: scadaRouter,

  // Gamification & Rewards
  gamification: gamificationRouter,

  // FMCSA Clearinghouse
  clearinghouse: clearinghouseRouter,

  // SPECTRA-MATCH™ Oil Identification
  spectraMatch: spectraMatchRouter,

  // EusoTicket™ Run Ticket & BOL System
  eusoTicket: eusoTicketRouter,

  // In-house APIs (EUSOTRACK, EUSOSMS, EUSOBANK)
  inhouse: inhouseRouter,

  // ESANG AI™ Intelligence Layer
  esang: esangRouter,

  // Payroll Management
  payroll: payrollRouter,

  // System Alerts
  alerts: alertsRouter,

  // Activity Timeline
  activity: activityRouter,

  // Insurance Management
  insurance: insuranceRouter,

  // User/Company Onboarding
  onboarding: onboardingRouter,

  // User Registration (Shipper, Carrier, Driver, etc.)
  registration: registrationRouter,

  // Vehicle Maintenance
  maintenance: maintenanceRouter,

  // System Announcements
  announcements: announcementsRouter,

  // Bill of Lading Management
  bol: bolRouter,

  // News Articles
  news: newsRouter,

  // Market Intelligence
  market: marketRouter,

  // Vehicle Inspections
  vehicle: vehicleRouter,

  // Route Planning
  routing: routingRouter,

  // Team Management
  team: teamRouter,

  // Feature Requests
  features: featuresRouter,

  // Security Settings
  security: securityRouter,

  // Toll Calculator
  tolls: tollsRouter,

  // Traffic Conditions
  traffic: trafficRouter,

  // Shipper Contracts
  shipperContracts: shipperContractsRouter,

  // Legal & Privacy
  legal: legalRouter,

  // SMS
  sms: smsRouter,

  // Push Notifications
  push: pushRouter,

  // Fuel Cards
  fuelCards: fuelCardsRouter,

  // Facility
  facility: facilityRouter,

  // Exports
  exports: exportsRouter,

  // ELD
  eld: eldRouter,

  // Developer
  developer: developerRouter,

  // Rate Confirmations
  rateConfirmations: rateConfirmationsRouter,

  // Quick Actions
  quickActions: quickActionsRouter,

  // Lane Rates
  laneRates: laneRatesRouter,

  // Help
  help: helpRouter,

  // Feedback
  feedback: feedbackRouter,

  // Rewards
  rewards: rewardsRouter,

  // Bookmarks
  bookmarks: bookmarksRouter,

  // Carrier Packets
  carrierPackets: carrierPacketsRouter,

  // Hazmat
  hazmat: hazmatRouter,

  // Platform Fees & Revenue
  platformFees: platformFeesRouter,

  // Telemetry & GPS Tracking
  telemetry: telemetryRouter,

  // Geofencing
  geofencing: geofencingRouter,

  // Navigation & Routing
  navigation: navigationRouter,

  // Convoy Management
  convoy: convoyRouter,

  // Safety Alerts
  safetyAlerts: safetyAlertsRouter,

  // ZEUN Maintenance Platform
  zeun: zeunRouter,

  // ZEUN Mechanics - Breakdown, Diagnostic & Repair
  zeunMechanics: zeunMechanicsRouter,

  // POD
  pod: podRouter,

  // Mileage
  mileage: mileageRouter,

  // Preferences
  preferences: preferencesRouter,

  // Procedures
  procedures: proceduresRouter,

  // Rest Stops
  restStops: restStopsRouter,

  // Scales
  scales: scalesRouter,

  // Search
  search: searchRouter,

  // Vehicles
  vehicles: vehiclesRouter,

  // Run Tickets / Trip Sheets
  runTickets: runTicketsRouter,

  // Rate Negotiations
  negotiations: negotiationsRouter,

  // Super Admin Operations
  superAdmin: superAdminRouter,

  // Dashboard Widgets
  widgets: widgetsRouter,

  // Messaging System
  messaging: messagingRouter,

  // Market Pricing Intelligence (Platts/Argus-style)
  marketPricing: marketPricingRouter,

  // Hot Zones - Demand Intelligence & Surge Pricing
  hotZones: hotZonesRouter,

  // Gradient Ink Digital Signatures
  signatures: signaturesRouter,

  // Emergency Response Command Center — Pipeline crisis mobilization
  emergencyResponse: emergencyResponseRouter,

  // EusoContract — Agreement & Contract Management System
  agreements: agreementsRouter,

  // EusoBid — Enhanced Load Bidding with counter-offers & auto-accept
  loadBidding: loadBiddingRouter,

  // EusoNegotiate — Rate & Terms Negotiation Threads
  rateNegotiations: rateNegotiationsRouter,

  // EusoLane — Lane Contracts & Commitments
  laneContracts: laneContractsRouter,

  // Singular aliases — many pages use singular names (trpc.driver vs trpc.drivers)
  broker: brokersRouter,
  carrier: carriersRouter,
  catalyst: catalystsRouter,
  driver: driversRouter,
  escort: escortsRouter,
  shipper: shippersRouter,
  terminal: terminalsRouter,
});

export type AppRouter = typeof appRouter;

