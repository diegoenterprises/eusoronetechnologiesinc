/**
 * INTEGRATIONS ROUTER
 * tRPC procedures for external service integrations
 * FMCSA, ELD, Clearinghouse, and other third-party APIs
 */

import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { fmcsaService } from "../services/fmcsa";
import { eldService } from "../services/eld";
import { clearinghouseService } from "../services/clearinghouse";
import { emitComplianceAlert, emitNotification } from "../_core/websocket";

export const integrationsRouter = router({
  // ============================================================================
  // FMCSA SAFER SYSTEM
  // ============================================================================

  /**
   * Verify carrier by DOT number
   */
  verifyCarrier: protectedProcedure
    .input(z.object({
      dotNumber: z.string(),
    }))
    .mutation(async ({ input }) => {
      const result = await fmcsaService.verifyCarrier(input.dotNumber);
      return result;
    }),

  /**
   * Get carrier info by DOT number
   */
  getCarrierByDOT: protectedProcedure
    .input(z.object({
      dotNumber: z.string(),
    }))
    .query(async ({ input }) => {
      return await fmcsaService.getCarrierByDOT(input.dotNumber);
    }),

  /**
   * Get carrier info by MC number
   */
  getCarrierByMC: protectedProcedure
    .input(z.object({
      mcNumber: z.string(),
    }))
    .query(async ({ input }) => {
      return await fmcsaService.getCarrierByMC(input.mcNumber);
    }),

  /**
   * Search carriers by name
   */
  searchCarriers: protectedProcedure
    .input(z.object({
      name: z.string(),
      state: z.string().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      return await fmcsaService.searchCarriers(input.name, input.state, input.limit);
    }),

  /**
   * Get carrier safety rating
   */
  getCarrierSafetyRating: protectedProcedure
    .input(z.object({
      dotNumber: z.string(),
    }))
    .query(async ({ input }) => {
      return await fmcsaService.getSafetyRating(input.dotNumber);
    }),

  /**
   * Get carrier authorities
   */
  getCarrierAuthorities: protectedProcedure
    .input(z.object({
      dotNumber: z.string(),
    }))
    .query(async ({ input }) => {
      return await fmcsaService.getAuthorities(input.dotNumber);
    }),

  /**
   * Get carrier insurance
   */
  getCarrierInsurance: protectedProcedure
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
          description: "Carrier verification, safety ratings, authority status",
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
   * Bulk verify multiple carriers
   */
  bulkVerifyCarriers: adminProcedure
    .input(z.object({
      dotNumbers: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      const results = await Promise.all(
        input.dotNumbers.map(async (dot) => {
          const result = await fmcsaService.verifyCarrier(dot);
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
});
