import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { aggregateAllFeeds, getAllCategories, RSS_FEEDS } from "./services/rssAggregator";
import { zeunMechanicsRouter } from "./services/zeun_mechanics/integration";
import { loadsRouter, bidsRouter } from "./routers/loads";
import { inhouseRouter } from "./routers/inhouse";
import { paymentsRouter } from "./routers/payments";
import { usersRouter } from "./routers/users";
import { companiesRouter } from "./routers/companies";
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

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
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

  // Driver/Carrier Earnings
  earnings: earningsRouter,

  // Fleet Management
  fleet: fleetRouter,

  // Safety Management
  safety: safetyRouter,

  // Compliance Management
  compliance: complianceRouter,

  // Training Management
  training: trainingRouter,

  // Messaging
  messages: messagesRouter,

  // Rate Calculator & Market Data
  rates: ratesRouter,

  // Terminal Operations
  terminals: terminalsRouter,

  // Escort/Pilot Car Operations
  escorts: escortsRouter,

  // Driver Management
  drivers: driversRouter,

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

  // In-house APIs (EUSOTRACK, EUSOSMS, EUSOBANK)
  inhouse: inhouseRouter,

  // ESANG AI™ Intelligence Layer
  esang: esangRouter,

  zeun: router({
    health: publicProcedure.query(async () => zeunMechanicsRouter.health.query()),
    reportBreakdown: publicProcedure
      .input(zeunMechanicsRouter.reportBreakdown.input)
      .mutation(async ({ input }) => zeunMechanicsRouter.reportBreakdown.mutation(input)),
    getMaintenanceDue: publicProcedure
      .input(zeunMechanicsRouter.getMaintenanceDue.input)
      .query(async ({ input }) => zeunMechanicsRouter.getMaintenanceDue.query(input)),
    searchProviders: publicProcedure
      .input(zeunMechanicsRouter.searchProviders.input)
      .query(async ({ input }) => zeunMechanicsRouter.searchProviders.query(input)),
    getDiagnosticDetails: publicProcedure
      .input(zeunMechanicsRouter.getDiagnosticDetails.input)
      .query(async ({ input }) => zeunMechanicsRouter.getDiagnosticDetails.query(input)),
    getMaintenanceHistory: publicProcedure
      .input(zeunMechanicsRouter.getMaintenanceHistory.input)
      .query(async ({ input }) => zeunMechanicsRouter.getMaintenanceHistory.query(input)),
    getCostEstimate: publicProcedure
      .input(zeunMechanicsRouter.getCostEstimate.input)
      .query(async ({ input }) => zeunMechanicsRouter.getCostEstimate.query(input)),
    getWeatherImpact: publicProcedure
      .input(zeunMechanicsRouter.getWeatherImpact.input)
      .query(async ({ input }) => zeunMechanicsRouter.getWeatherImpact.query(input)),
    getTelematicsData: publicProcedure
      .input(zeunMechanicsRouter.getTelematicsData.input)
      .query(async ({ input }) => zeunMechanicsRouter.getTelematicsData.query(input)),
  }),
});

export type AppRouter = typeof appRouter;

