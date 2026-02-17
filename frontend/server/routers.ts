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
import { catalystsRouter } from "./routers/catalysts";
import { brokersRouter } from "./routers/brokers";
import { shippersRouter } from "./routers/shippers";
import { incidentsRouter } from "./routers/incidents";
import { weatherRouter } from "./routers/weather";
import { geolocationRouter } from "./routers/geolocation";
import { ergRouter } from "./routers/erg";
import { appointmentsRouter } from "./routers/appointments";
import { permitsRouter } from "./routers/permits";
import { facilitiesRouter } from "./routers/facilities";
import { dispatchRoleRouter } from "./routers/dispatchRole";
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
import { preWarmCache as preWarmRSSCache } from "./services/rssService";
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
import { catalystPacketsRouter } from "./routers/catalystPackets";
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
import { fmcsaRouter } from "./routers/fmcsa";
import { complianceNetworksRouter } from "./routers/complianceNetworks";
import { sidebarRouter } from "./routers/sidebar";
import { encryptionRouter } from "./routers/encryption";
import { commissionEngineRouter } from "./routers/commissionEngine";
import { loadLifecycleRouter } from "./routers/loadLifecycle";
import { approvalRouter } from "./routers/approval";
import { authorityRouter } from "./routers/authority";
import { reeferTempRouter } from "./routers/reeferTemp";

// RSS cache is now warmed lazily on first request or after server.listen()
// preWarmRSSCache() — moved to post-listen in _core/index.ts to not block health probe

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(async (opts) => {
      if (!opts.ctx.user) return null;
      // Enrich with metadata from DB for approval status
      try {
        const { getDb } = await import("./db");
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (db) {
          const userId = Number((opts.ctx.user as any).id);
          if (!isNaN(userId)) {
            const [row] = await db
              .select({ metadata: users.metadata })
              .from(users)
              .where(eq(users.id, userId))
              .limit(1);
            if (row?.metadata) {
              return { ...opts.ctx.user, metadata: row.metadata };
            }
          }
        }
      } catch {}
      return opts.ctx.user;
    }),
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

    /**
     * auth.refreshToken
     * Silently extends the session. Reads the current JWT from cookie,
     * validates it, and issues a fresh token with a new expiry.
     * This keeps users logged in during active usage without
     * requiring re-authentication.
     */
    refreshToken: protectedProcedure.mutation(async ({ ctx }) => {
      const { authService } = await import("./_core/auth");
      const user = ctx.user as any;
      if (!user?.id) throw new Error("No active session");
      const freshToken = authService.createSessionToken({
        id: String(user.id),
        email: user.email || '',
        role: user.role || 'DRIVER',
        name: user.name || undefined,
        companyId: user.companyId ? String(user.companyId) : undefined,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, freshToken, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });
      return { success: true, expiresIn: '7d' };
    }),

    /**
     * auth.verifyEmail
     * Completes email verification. Takes a token that was sent via email,
     * validates it against the stored token in user metadata, and sets
     * isVerified=true. This is the gate between registration and full access.
     */
    verifyEmail: publicProcedure
      .input(z.object({ token: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { users } = await import("../drizzle/schema");
        const { eq, sql } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        // Find user whose metadata contains this verification token
        const allUnverified = await db.select({ id: users.id, metadata: users.metadata, email: users.email })
          .from(users).where(eq(users.isVerified, false)).limit(500);

        let targetUser: { id: number; email: string | null } | null = null;
        for (const u of allUnverified) {
          try {
            const meta = u.metadata ? JSON.parse(u.metadata as string) : {};
            if (meta.verificationToken === input.token) {
              if (meta.verificationExpiry && new Date(meta.verificationExpiry) < new Date()) {
                throw new Error("Verification link has expired. Please request a new one.");
              }
              targetUser = { id: u.id, email: u.email };
              break;
            }
          } catch (e: any) {
            if (e.message?.includes('expired')) throw e;
          }
        }

        if (!targetUser) throw new Error("Invalid or expired verification token");

        // Mark as verified and clear the token
        let meta: any = {};
        const [row] = await db.select({ metadata: users.metadata }).from(users).where(eq(users.id, targetUser.id)).limit(1);
        try { meta = row?.metadata ? JSON.parse(row.metadata as string) : {}; } catch {}
        delete meta.verificationToken;
        delete meta.verificationExpiry;
        meta.emailVerifiedAt = new Date().toISOString();

        await db.update(users).set({
          isVerified: true,
          metadata: JSON.stringify(meta),
        }).where(eq(users.id, targetUser.id));

        return { success: true, email: targetUser.email };
      }),

    /**
     * auth.resendVerification
     * Generates a new verification token and sends it via email.
     * Rate-limited: only one resend per 60 seconds per email.
     * Designed so new users who missed the first email can recover.
     */
    resendVerification: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        const [user] = await db.select({ id: users.id, name: users.name, email: users.email, isVerified: users.isVerified, metadata: users.metadata })
          .from(users).where(eq(users.email, input.email)).limit(1);

        // Always return success to prevent email enumeration
        if (!user || user.isVerified) return { success: true, message: "If that email exists, a verification link has been sent." };

        // Rate limit: check last resend timestamp
        let meta: any = {};
        try { meta = user.metadata ? JSON.parse(user.metadata as string) : {}; } catch {}
        const lastResend = meta.lastVerificationResend ? new Date(meta.lastVerificationResend) : null;
        if (lastResend && (Date.now() - lastResend.getTime()) < 60000) {
          return { success: true, message: "If that email exists, a verification link has been sent." };
        }

        // Generate new token
        const { emailService } = await import("./_core/email");
        const verification = emailService.generateVerificationToken(input.email, user.id);

        meta.verificationToken = verification.token;
        meta.verificationExpiry = verification.expiresAt.toISOString();
        meta.lastVerificationResend = new Date().toISOString();

        await db.update(users).set({ metadata: JSON.stringify(meta) }).where(eq(users.id, user.id));
        await emailService.sendVerificationEmail(input.email, verification.token, user.name || undefined);

        return { success: true, message: "If that email exists, a verification link has been sent." };
      }),

    /**
     * auth.forgotPassword
     * Initiates password reset flow. Generates a time-limited reset token,
     * stores it in user metadata, and sends a reset email.
     * Always returns success to prevent email enumeration attacks.
     */
    forgotPassword: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        const [user] = await db.select({ id: users.id, email: users.email, name: users.name, metadata: users.metadata })
          .from(users).where(eq(users.email, input.email)).limit(1);

        // Always return success to prevent enumeration
        if (!user) return { success: true, message: "If that email exists, a password reset link has been sent." };

        const { v4: uuidv4 } = await import("uuid");
        const resetToken = uuidv4();
        const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        let meta: any = {};
        try { meta = user.metadata ? JSON.parse(user.metadata as string) : {}; } catch {}
        meta.passwordResetToken = resetToken;
        meta.passwordResetExpiry = resetExpiry.toISOString();
        meta.passwordResetRequestedAt = new Date().toISOString();

        await db.update(users).set({ metadata: JSON.stringify(meta) }).where(eq(users.id, user.id));

        const { emailService } = await import("./_core/email");
        await emailService.sendPasswordResetEmail(input.email, resetToken);

        return { success: true, message: "If that email exists, a password reset link has been sent." };
      }),

    /**
     * auth.resetPassword
     * Completes password reset. Validates the reset token from the email link,
     * hashes the new password with bcrypt (12 rounds), clears the reset token,
     * and invalidates all existing sessions by bumping tokenVersion.
     */
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string().min(1),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const bcryptMod = await import("bcryptjs");
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        // Find user with this reset token
        const allUsers = await db.select({ id: users.id, metadata: users.metadata })
          .from(users).where(eq(users.isActive, true)).limit(1000);

        let targetUserId: number | null = null;
        for (const u of allUsers) {
          try {
            const meta = u.metadata ? JSON.parse(u.metadata as string) : {};
            if (meta.passwordResetToken === input.token) {
              if (meta.passwordResetExpiry && new Date(meta.passwordResetExpiry) < new Date()) {
                throw new Error("Reset link has expired. Please request a new one.");
              }
              targetUserId = u.id;
              break;
            }
          } catch (e: any) {
            if (e.message?.includes('expired')) throw e;
          }
        }

        if (!targetUserId) throw new Error("Invalid or expired reset token");

        const passwordHash = await bcryptMod.default.hash(input.newPassword, 12);

        // Clear reset token and bump token version to invalidate all sessions
        const [row] = await db.select({ metadata: users.metadata }).from(users).where(eq(users.id, targetUserId)).limit(1);
        let meta: any = {};
        try { meta = row?.metadata ? JSON.parse(row.metadata as string) : {}; } catch {}
        delete meta.passwordResetToken;
        delete meta.passwordResetExpiry;
        delete meta.passwordResetRequestedAt;
        meta.tokenVersion = (meta.tokenVersion || 0) + 1;
        meta.passwordLastChangedAt = new Date().toISOString();

        await db.update(users).set({
          passwordHash,
          metadata: JSON.stringify(meta),
        }).where(eq(users.id, targetUserId));

        return { success: true };
      }),

    /**
     * auth.checkSession
     * Returns the health of the current session: whether it's valid,
     * when it was created, the user's role, verification status,
     * and approval status. Frontend uses this for session guards
     * and to show "pending approval" states.
     */
    checkSession: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user as any;
      if (!user?.id) return { valid: false, reason: 'no_session' };

      const { getDb } = await import("./db");
      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();

      let isVerified = true;
      let approvalStatus = 'approved';
      let isActive = true;

      if (db) {
        try {
          const userId = Number(user.id);
          if (!isNaN(userId)) {
            const [dbUser] = await db.select({
              isVerified: users.isVerified,
              isActive: users.isActive,
              metadata: users.metadata,
            }).from(users).where(eq(users.id, userId)).limit(1);

            if (dbUser) {
              isVerified = dbUser.isVerified;
              isActive = dbUser.isActive;
              try {
                const meta = dbUser.metadata ? JSON.parse(dbUser.metadata as string) : {};
                approvalStatus = meta.approvalStatus || 'pending';
              } catch {}
            }
          }
        } catch {}
      }

      return {
        valid: true,
        userId: String(user.id),
        email: user.email || '',
        role: user.role || '',
        isVerified,
        isActive,
        approvalStatus,
      };
    }),

    /**
     * auth.revokeAllSessions
     * Nuclear option: invalidates every active session for the current user.
     * Works by incrementing a tokenVersion in metadata. The next time any
     * token is checked, it will fail validation against the new version.
     * Also clears the current session cookie.
     */
    revokeAllSessions: protectedProcedure.mutation(async ({ ctx }) => {
      const user = ctx.user as any;
      if (!user?.id) throw new Error("No active session");

      const { getDb } = await import("./db");
      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();

      if (db) {
        try {
          const userId = Number(user.id);
          if (!isNaN(userId)) {
            const [row] = await db.select({ metadata: users.metadata }).from(users).where(eq(users.id, userId)).limit(1);
            let meta: any = {};
            try { meta = row?.metadata ? JSON.parse(row.metadata as string) : {}; } catch {}
            meta.tokenVersion = (meta.tokenVersion || 0) + 1;
            meta.allSessionsRevokedAt = new Date().toISOString();
            await db.update(users).set({ metadata: JSON.stringify(meta) }).where(eq(users.id, userId));
          }
        } catch (e) {
          console.error('[auth] revokeAllSessions error:', e);
        }
      }

      // Clear the current cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });

      return { success: true, message: "All sessions have been revoked. You will need to log in again." };
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

  // Stripe Payments (checkout, Connect, subscriptions, payment methods)
  stripe: stripeRouter,

  // Driver/Catalyst Earnings
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

  // E2E Encryption Key Management
  encryption: encryptionRouter,

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

  // Catalyst Management
  catalysts: catalystsRouter,

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

  // Dispatch Role Operations
  dispatchRole: dispatchRoleRouter,

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

  // User Registration (Shipper, Catalyst, Driver, etc.)
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

  // Catalyst Packets
  catalystPackets: catalystPacketsRouter,

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

  // FMCSA QCMobile API — USDOT/MC lookup, auto-populate registration
  fmcsa: fmcsaRouter,

  // Compliance Network Memberships (Avetta, ISNetworld, Veriforce, etc.)
  complianceNetworks: complianceNetworksRouter,

  // Dynamic Platform Fee & Commission Engine (Team Alpha Fintech)
  commissionEngine: commissionEngineRouter,

  // Load Lifecycle State Machine (Hyper-Compliance)
  loadLifecycle: loadLifecycleRouter,

  // Sidebar Dynamic Badge Counts
  sidebar: sidebarRouter,

  // Approval Management (admin user approval/suspension)
  approval: approvalRouter,

  // Authority & Leasing (FMCSR Part 376)
  authority: authorityRouter,

  // Reefer Temperature Monitoring (FSMA D-066)
  reeferTemp: reeferTempRouter,

  // Singular aliases — many pages use singular names (trpc.driver vs trpc.drivers)
  broker: brokersRouter,
  catalyst: catalystsRouter,
  driver: driversRouter,
  escort: escortsRouter,
  shipper: shippersRouter,
  terminal: terminalsRouter,
});

export type AppRouter = typeof appRouter;

