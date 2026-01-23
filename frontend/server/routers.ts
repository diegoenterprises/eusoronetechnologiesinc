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

  // In-house APIs (EUSOTRACK, EUSOSMS, EUSOBANK)
  inhouse: inhouseRouter,

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

