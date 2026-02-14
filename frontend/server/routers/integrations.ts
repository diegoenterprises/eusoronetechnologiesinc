/**
 * INTEGRATIONS ROUTER
 * tRPC procedures for external service integrations
 * FMCSA, ELD, Clearinghouse, EusoConnect providers and connections
 */

import { z } from "zod";
import { eq, and, desc, inArray } from "drizzle-orm";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { fmcsaService } from "../services/fmcsa";
import { eldService } from "../services/eld";
import { clearinghouseService } from "../services/clearinghouse";
import { emitComplianceAlert, emitNotification } from "../_core/websocket";
import { getDb } from "../db";
import { 
  integrationProviders, 
  integrationConnections, 
  integrationSyncLogs,
  integrationSyncedRecords 
} from "../../drizzle/schema";

export const integrationsRouter = router({
  // Generic CRUD for screen templates
  create: protectedProcedure
    .input(z.object({ type: z.string(), data: z.any() }).optional())
    .mutation(async ({ input }) => {
      return { success: true, id: crypto.randomUUID(), ...input?.data };
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: z.any() }).optional())
    .mutation(async ({ input }) => {
      return { success: true, id: input?.id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }).optional())
    .mutation(async ({ input }) => {
      return { success: true, id: input?.id };
    }),

  // ============================================================================
  // FMCSA SAFER SYSTEM
  // ============================================================================

  /**
   * Verify catalyst by DOT number
   */
  verifyCatalyst: protectedProcedure
    .input(z.object({
      dotNumber: z.string(),
    }))
    .mutation(async ({ input }) => {
      const result = await fmcsaService.verifyCatalyst(input.dotNumber);
      return result;
    }),

  /**
   * Get catalyst info by DOT number
   */
  getCatalystByDOT: protectedProcedure
    .input(z.object({
      dotNumber: z.string(),
    }))
    .query(async ({ input }) => {
      return await fmcsaService.getCatalystByDOT(input.dotNumber);
    }),

  /**
   * Get catalyst info by MC number
   */
  getCatalystByMC: protectedProcedure
    .input(z.object({
      mcNumber: z.string(),
    }))
    .query(async ({ input }) => {
      return await fmcsaService.getCatalystByMC(input.mcNumber);
    }),

  /**
   * Search catalysts by name
   */
  searchCatalysts: protectedProcedure
    .input(z.object({
      name: z.string(),
      state: z.string().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      return await fmcsaService.searchCatalysts(input.name, input.state, input.limit);
    }),

  /**
   * Get catalyst safety rating
   */
  getCatalystSafetyRating: protectedProcedure
    .input(z.object({
      dotNumber: z.string(),
    }))
    .query(async ({ input }) => {
      return await fmcsaService.getSafetyRating(input.dotNumber);
    }),

  /**
   * Get catalyst authorities
   */
  getCatalystAuthorities: protectedProcedure
    .input(z.object({
      dotNumber: z.string(),
    }))
    .query(async ({ input }) => {
      return await fmcsaService.getAuthorities(input.dotNumber);
    }),

  /**
   * Get catalyst insurance
   */
  getCatalystInsurance: protectedProcedure
    .input(z.object({
      dotNumber: z.string(),
    }))
    .query(async ({ input }) => {
      return await fmcsaService.getInsurance(input.dotNumber);
    }),

  // ============================================================================
  // ELD INTEGRATION
  // ============================================================================

  /**
   * Get driver HOS status
   */
  getDriverHOS: protectedProcedure
    .input(z.object({
      driverId: z.string(),
      provider: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return await eldService.getDriverHOS(input.driverId, input.provider);
    }),

  /**
   * Get fleet HOS summary
   */
  getFleetHOSSummary: protectedProcedure
    .input(z.object({
      driverIds: z.array(z.string()),
    }))
    .query(async ({ input }) => {
      return await eldService.getFleetHOSSummary(input.driverIds);
    }),

  /**
   * Get driver log entries
   */
  getDriverLogs: protectedProcedure
    .input(z.object({
      driverId: z.string(),
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      return await eldService.getDriverLogs(input.driverId, input.startDate, input.endDate);
    }),

  /**
   * Get vehicle info from ELD
   */
  getELDVehicleInfo: protectedProcedure
    .input(z.object({
      vehicleId: z.string(),
    }))
    .query(async ({ input }) => {
      return await eldService.getVehicleInfo(input.vehicleId);
    }),

  /**
   * Get driver violations from ELD
   */
  getDriverELDViolations: protectedProcedure
    .input(z.object({
      driverId: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return await eldService.getDriverViolations(input.driverId, input.startDate, input.endDate);
    }),

  /**
   * Get available ELD providers
   */
  getELDProviders: protectedProcedure
    .query(async () => {
      return {
        configured: eldService.isConfigured(),
        providers: eldService.getProviders(),
      };
    }),

  // ============================================================================
  // CLEARINGHOUSE
  // ============================================================================

  /**
   * Submit pre-employment query
   */
  submitPreEmploymentQuery: protectedProcedure
    .input(z.object({
      driverId: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      cdlNumber: z.string(),
      cdlState: z.string(),
      dateOfBirth: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await clearinghouseService.submitPreEmploymentQuery(
        input.driverId,
        {
          firstName: input.firstName,
          lastName: input.lastName,
          cdlNumber: input.cdlNumber,
          cdlState: input.cdlState,
          dateOfBirth: input.dateOfBirth,
        },
        String(ctx.user?.id)
      );

      // Emit notification
      emitNotification(String(ctx.user?.id), {
        id: `notif_${Date.now()}`,
        type: 'clearinghouse_query',
        title: 'Clearinghouse Query Submitted',
        message: `Pre-employment query submitted for ${input.firstName} ${input.lastName}`,
        priority: 'medium',
        data: { queryId: result.queryId, driverId: input.driverId },
        timestamp: new Date().toISOString(),
      });

      return result;
    }),

  /**
   * Submit annual query
   */
  submitAnnualQuery: protectedProcedure
    .input(z.object({
      driverId: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      cdlNumber: z.string(),
      cdlState: z.string(),
      dateOfBirth: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await clearinghouseService.submitAnnualQuery(
        input.driverId,
        {
          firstName: input.firstName,
          lastName: input.lastName,
          cdlNumber: input.cdlNumber,
          cdlState: input.cdlState,
          dateOfBirth: input.dateOfBirth,
        },
        String(ctx.user?.id)
      );

      return result;
    }),

  /**
   * Get query status
   */
  getClearinghouseQueryStatus: protectedProcedure
    .input(z.object({
      queryId: z.string(),
    }))
    .query(async ({ input }) => {
      return await clearinghouseService.getQueryStatus(input.queryId);
    }),

  /**
   * Get company queries
   */
  getCompanyClearinghouseQueries: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "completed", "expired", "cancelled"]).optional(),
      queryType: z.enum(["pre_employment", "annual", "reasonable_suspicion", "post_accident", "return_to_duty", "follow_up"]).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const companyId = String(ctx.user?.companyId || 0);
      return await clearinghouseService.getCompanyQueries(companyId, input);
    }),

  /**
   * Get driver query history
   */
  getDriverClearinghouseHistory: protectedProcedure
    .input(z.object({
      driverId: z.string(),
    }))
    .query(async ({ input }) => {
      return await clearinghouseService.getDriverQueryHistory(input.driverId);
    }),

  /**
   * Check if driver has valid annual query
   */
  checkDriverAnnualQuery: protectedProcedure
    .input(z.object({
      driverId: z.string(),
    }))
    .query(async ({ input }) => {
      const hasValid = await clearinghouseService.hasValidAnnualQuery(input.driverId);
      return { driverId: input.driverId, hasValidAnnualQuery: hasValid };
    }),

  /**
   * Get clearinghouse stats
   */
  getClearinghouseStats: protectedProcedure
    .query(async ({ ctx }) => {
      const companyId = String(ctx.user?.companyId || 0);
      return await clearinghouseService.getQueryStats(companyId);
    }),

  /**
   * Get drivers needing annual query
   */
  getDriversNeedingAnnualQuery: protectedProcedure
    .input(z.object({
      driverIds: z.array(z.string()),
    }))
    .query(async ({ input }) => {
      const driversDue = await clearinghouseService.getDriversNeedingAnnualQuery(input.driverIds);
      return {
        driversDue,
        count: driversDue.length,
      };
    }),

  /**
   * Record driver consent
   */
  recordDriverConsent: protectedProcedure
    .input(z.object({
      driverId: z.string(),
      consentType: z.enum(["limited", "general"]),
      expiresAt: z.string(),
    }))
    .mutation(async ({ input }) => {
      return await clearinghouseService.recordConsent(
        input.driverId,
        input.consentType,
        input.expiresAt
      );
    }),

  /**
   * Revoke driver consent
   */
  revokeDriverConsent: protectedProcedure
    .input(z.object({
      driverId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const success = await clearinghouseService.revokeConsent(input.driverId);
      return { success, driverId: input.driverId };
    }),

  // ============================================================================
  // INTEGRATION STATUS
  // ============================================================================

  /**
   * Get status of all integrations
   */
  getIntegrationStatus: adminProcedure
    .query(async () => {
      return {
        fmcsa: {
          name: "FMCSA SAFER",
          configured: fmcsaService.isConfigured(),
          description: "Catalyst verification, safety ratings, authority status",
        },
        eld: {
          name: "ELD Providers",
          configured: eldService.isConfigured(),
          providers: eldService.getProviders(),
          description: "Electronic logging device integration for HOS compliance",
        },
        clearinghouse: {
          name: "Drug & Alcohol Clearinghouse",
          configured: clearinghouseService.isConfigured(),
          description: "Pre-employment and annual driver drug/alcohol queries",
        },
      };
    }),

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Bulk verify multiple catalysts
   */
  bulkVerifyCatalysts: adminProcedure
    .input(z.object({
      dotNumbers: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      const results = await Promise.all(
        input.dotNumbers.map(async (dot) => {
          const result = await fmcsaService.verifyCatalyst(dot);
          return { dotNumber: dot, ...result };
        })
      );

      return {
        total: results.length,
        valid: results.filter(r => r.isValid).length,
        invalid: results.filter(r => !r.isValid).length,
        results,
      };
    }),

  /**
   * Bulk submit annual queries
   */
  bulkSubmitAnnualQueries: adminProcedure
    .input(z.object({
      drivers: z.array(z.object({
        driverId: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        cdlNumber: z.string(),
        cdlState: z.string(),
        dateOfBirth: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const results = await Promise.all(
        input.drivers.map(async (driver) => {
          const result = await clearinghouseService.submitAnnualQuery(
            driver.driverId,
            driver,
            String(ctx.user?.id)
          );
          return { driverId: driver.driverId, queryId: result.queryId, status: result.status };
        })
      );

      return {
        total: results.length,
        submitted: results.length,
        results,
      };
    }),

  // ============================================================================
  // EUSOCONNECT - PROVIDERS
  // ============================================================================

  /**
   * Get all available integration providers for user's role
   */
  getProviders: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb(); if (!db) throw new Error("Database unavailable");
        const userRole = ctx.user?.role || "DRIVER";
        
        let query = db.select().from(integrationProviders);
        
        const conditions = [];
        
        if (input?.category) {
          conditions.push(eq(integrationProviders.category, input.category as any));
        }
        if (input?.status) {
          conditions.push(eq(integrationProviders.status, input.status as any));
        } else {
          conditions.push(inArray(integrationProviders.status, ["active", "beta"]));
        }
        
        const providers = await query
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(integrationProviders.category, integrationProviders.displayName);
        
        // Filter by role availability
        return providers.filter(p => {
          const roles = (p.availableForRoles as string[]) || [];
          return roles.includes(userRole) || roles.includes("ALL");
        });
      } catch (error) {
        console.error("[Integrations] getProviders error:", error);
        return [];
      }
    }),

  /**
   * Get provider by slug
   */
  getProviderBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb(); if (!db) throw new Error("Database unavailable");
        const [provider] = await db
          .select()
          .from(integrationProviders)
          .where(eq(integrationProviders.slug, input.slug));
        
        return provider || null;
      } catch (error) {
        console.error("[Integrations] getProviderBySlug error:", error);
        return null;
      }
    }),

  /**
   * Get providers by category
   */
  getProvidersByCategory: protectedProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb(); if (!db) throw new Error("Database unavailable");
        const userRole = ctx.user?.role || "DRIVER";
        
        const providers = await db
          .select()
          .from(integrationProviders)
          .where(and(
            eq(integrationProviders.category, input.category as any),
            inArray(integrationProviders.status, ["active", "beta"])
          ))
          .orderBy(integrationProviders.displayName);
        
        return providers.filter(p => {
          const roles = (p.availableForRoles as string[]) || [];
          return roles.includes(userRole) || roles.includes("ALL");
        });
      } catch (error) {
        console.error("[Integrations] getProvidersByCategory error:", error);
        return [];
      }
    }),

  // ============================================================================
  // EUSOCONNECT - CONNECTIONS
  // ============================================================================

  /**
   * Get all connections for company
   */
  getConnections: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb(); if (!db) throw new Error("Database unavailable");
        const companyId = ctx.user?.companyId;
        if (!companyId) return [];
        
        const connections = await db
          .select({
            connection: integrationConnections,
            provider: integrationProviders,
          })
          .from(integrationConnections)
          .leftJoin(integrationProviders, eq(integrationConnections.providerId, integrationProviders.id))
          .where(eq(integrationConnections.companyId, companyId))
          .orderBy(desc(integrationConnections.createdAt));
        
        return connections.map(c => ({
          ...c.connection,
          provider: c.provider,
        }));
      } catch (error) {
        console.error("[Integrations] getConnections error:", error);
        return [];
      }
    }),

  /**
   * Get connection by provider slug
   */
  getConnectionByProvider: protectedProcedure
    .input(z.object({ providerSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb(); if (!db) throw new Error("Database unavailable");
        const companyId = ctx.user?.companyId;
        if (!companyId) return null;
        
        const [connection] = await db
          .select()
          .from(integrationConnections)
          .where(and(
            eq(integrationConnections.companyId, companyId),
            eq(integrationConnections.providerSlug, input.providerSlug)
          ));
        
        return connection || null;
      } catch (error) {
        console.error("[Integrations] getConnectionByProvider error:", error);
        return null;
      }
    }),

  /**
   * Connect with API key
   */
  connectWithApiKey: protectedProcedure
    .input(z.object({
      providerSlug: z.string(),
      apiKey: z.string(),
      apiSecret: z.string().optional(),
      externalId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const companyId = ctx.user?.companyId;
      const userId = ctx.user?.id;
      if (!companyId || !userId) {
        throw new Error("User must be associated with a company");
      }
      
      // Get provider
      const [provider] = await db
        .select()
        .from(integrationProviders)
        .where(eq(integrationProviders.slug, input.providerSlug));
      
      if (!provider) {
        throw new Error("Provider not found");
      }
      
      // Check for existing connection
      const [existing] = await db
        .select()
        .from(integrationConnections)
        .where(and(
          eq(integrationConnections.companyId, companyId),
          eq(integrationConnections.providerSlug, input.providerSlug)
        ));
      
      if (existing) {
        // Update existing connection
        await db
          .update(integrationConnections)
          .set({
            apiKey: input.apiKey,
            apiSecret: input.apiSecret || null,
            externalId: input.externalId || null,
            status: "connected",
            lastConnectedAt: new Date(),
            errorCount: 0,
            lastError: null,
          })
          .where(eq(integrationConnections.id, existing.id));
        
        return { success: true, connectionId: existing.id, isNew: false };
      }
      
      // Create new connection
      const [newConnection] = await db
        .insert(integrationConnections)
        .values({
          companyId,
          userId,
          providerId: provider.id,
          providerSlug: input.providerSlug,
          authType: provider.authType,
          apiKey: input.apiKey,
          apiSecret: input.apiSecret || null,
          externalId: input.externalId || null,
          status: "connected",
          lastConnectedAt: new Date(),
          connectedBy: userId,
        })
        .$returningId();
      
      // Emit event
      emitNotification(String(userId), {
        id: `notif_${Date.now()}`,
        type: "integration_connected",
        title: "Integration Connected",
        message: `Successfully connected to ${provider.displayName}`,
        priority: "medium",
        data: { providerSlug: input.providerSlug },
        timestamp: new Date().toISOString(),
      });
      
      return { success: true, connectionId: newConnection.id, isNew: true };
    }),

  /**
   * Initiate OAuth flow
   */
  initiateOAuth: protectedProcedure
    .input(z.object({
      providerSlug: z.string(),
      externalId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const companyId = ctx.user?.companyId;
      const userId = ctx.user?.id;
      if (!companyId || !userId) {
        throw new Error("User must be associated with a company");
      }
      
      // Get provider
      const [provider] = await db
        .select()
        .from(integrationProviders)
        .where(eq(integrationProviders.slug, input.providerSlug));
      
      if (!provider || !provider.oauthAuthorizeUrl) {
        throw new Error("Provider not found or does not support OAuth");
      }
      
      // Create state token
      const state = Buffer.from(JSON.stringify({
        companyId,
        userId,
        providerSlug: input.providerSlug,
        externalId: input.externalId,
        timestamp: Date.now(),
      })).toString("base64");
      
      // Build OAuth URL
      const params = new URLSearchParams({
        client_id: process.env[`${input.providerSlug.toUpperCase()}_CLIENT_ID`] || "",
        redirect_uri: `${process.env.APP_URL}/api/integrations/oauth/callback`,
        response_type: "code",
        state,
      });
      
      if (provider.oauthScopes && Array.isArray(provider.oauthScopes)) {
        params.append("scope", (provider.oauthScopes as string[]).join(" "));
      }
      
      if (input.externalId && provider.requiresExternalId) {
        params.append("company_id", input.externalId);
      }
      
      const authUrl = `${provider.oauthAuthorizeUrl}?${params.toString()}`;
      
      return { authUrl, state };
    }),

  /**
   * Disconnect integration
   */
  disconnect: protectedProcedure
    .input(z.object({ providerSlug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const companyId = ctx.user?.companyId;
      if (!companyId) {
        throw new Error("User must be associated with a company");
      }
      
      await db
        .update(integrationConnections)
        .set({
          status: "disconnected",
          accessToken: null,
          refreshToken: null,
          apiKey: null,
          apiSecret: null,
        })
        .where(and(
          eq(integrationConnections.companyId, companyId),
          eq(integrationConnections.providerSlug, input.providerSlug)
        ));
      
      return { success: true };
    }),

  /**
   * Trigger manual sync
   */
  triggerSync: protectedProcedure
    .input(z.object({
      providerSlug: z.string(),
      dataTypes: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const companyId = ctx.user?.companyId;
      const userId = ctx.user?.id;
      if (!companyId) {
        throw new Error("User must be associated with a company");
      }
      
      // Get connection
      const [connection] = await db
        .select()
        .from(integrationConnections)
        .where(and(
          eq(integrationConnections.companyId, companyId),
          eq(integrationConnections.providerSlug, input.providerSlug)
        ));
      
      if (!connection || connection.status !== "connected") {
        throw new Error("Integration not connected");
      }
      
      // Create sync log
      const [syncLog] = await db
        .insert(integrationSyncLogs)
        .values({
          connectionId: connection.id,
          syncType: "manual",
          status: "running",
          triggeredBy: "user",
          triggeredByUserId: userId,
        })
        .$returningId();
      
      // Update connection status
      await db
        .update(integrationConnections)
        .set({ status: "syncing" })
        .where(eq(integrationConnections.id, connection.id));
      
      // TODO: Trigger actual sync via service
      // For now, simulate completion
      setTimeout(async () => {
        await db
          .update(integrationSyncLogs)
          .set({
            status: "completed",
            completedAt: new Date(),
            durationMs: 1500,
            recordsFetched: 0,
            recordsCreated: 0,
            recordsUpdated: 0,
          })
          .where(eq(integrationSyncLogs.id, syncLog.id));
        
        await db
          .update(integrationConnections)
          .set({
            status: "connected",
            lastSyncAt: new Date(),
          })
          .where(eq(integrationConnections.id, connection.id));
      }, 1500);
      
      return { success: true, syncLogId: syncLog.id };
    }),

  /**
   * Get sync history
   */
  getSyncHistory: protectedProcedure
    .input(z.object({
      providerSlug: z.string(),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb(); if (!db) throw new Error("Database unavailable");
        const companyId = ctx.user?.companyId;
        if (!companyId) return [];
        
        // Get connection
        const [connection] = await db
          .select()
          .from(integrationConnections)
          .where(and(
            eq(integrationConnections.companyId, companyId),
            eq(integrationConnections.providerSlug, input.providerSlug)
          ));
        
        if (!connection) return [];
        
        const logs = await db
          .select()
          .from(integrationSyncLogs)
          .where(eq(integrationSyncLogs.connectionId, connection.id))
          .orderBy(desc(integrationSyncLogs.startedAt))
          .limit(input.limit);
        
        return logs;
      } catch (error) {
        console.error("[Integrations] getSyncHistory error:", error);
        return [];
      }
    }),

  /**
   * Get dashboard stats
   */
  getDashboardStats: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const db = await getDb(); if (!db) throw new Error("Database unavailable");
        const companyId = ctx.user?.companyId;
        if (!companyId) {
          return { connected: 0, syncing: 0, errors: 0, totalRecords: 0 };
        }
        
        const connections = await db
          .select()
          .from(integrationConnections)
          .where(eq(integrationConnections.companyId, companyId));
        
        const connected = connections.filter(c => c.status === "connected").length;
        const syncing = connections.filter(c => c.status === "syncing").length;
        const errors = connections.filter(c => c.status === "error").length;
        const totalRecords = connections.reduce((sum, c) => sum + (c.totalRecordsSynced || 0), 0);
        
        return { connected, syncing, errors, totalRecords };
      } catch (error) {
        console.error("[Integrations] getDashboardStats error:", error);
        return { connected: 0, syncing: 0, errors: 0, totalRecords: 0 };
      }
    }),
});
