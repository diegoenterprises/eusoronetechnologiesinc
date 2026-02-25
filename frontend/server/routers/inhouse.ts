/**
 * IN-HOUSE API ROUTERS
 * 
 * tRPC procedures for EUSOTRACK, EUSOSMS, and EUSOBANK services
 */

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { publicProcedure, isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import * as eusotrack from "../services/eusotrack";
import * as eusosms from "../services/eusosms";
import * as eusobank from "../services/eusobank";

// ============================================================================
// EUSOTRACK - GPS TRACKING & TELEMATICS
// ============================================================================

export const eusotrackRouter = router({
  // Record location update
  recordLocation: protectedProcedure
    .input(
      z.object({
        vehicleId: z.number(),
        driverId: z.number(),
        loadId: z.number().optional(),
        latitude: z.number(),
        longitude: z.number(),
        speed: z.number().optional(),
        heading: z.number().optional(),
        accuracy: z.number().optional(),
        altitude: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await eusotrack.recordLocationUpdate({
        ...input,
        timestamp: new Date(),
      });
    }),

  // Get location history
  getLocationHistory: protectedProcedure
    .input(
      z.object({
        vehicleId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input }) => {
      return await eusotrack.getLocationHistory(
        input.vehicleId,
        input.startDate,
        input.endDate
      );
    }),

  // Get current location
  getCurrentLocation: protectedProcedure
    .input(z.object({ vehicleId: z.number() }))
    .query(async ({ input }) => {
      return await eusotrack.getCurrentLocation(input.vehicleId);
    }),

  // Get unnotified alerts
  getUnnotifiedAlerts: protectedProcedure.query(async () => {
    return await eusotrack.getUnnotifiedAlerts();
  }),

  // Mark alert as notified
  markAlertNotified: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ input }) => {
      return await eusotrack.markAlertNotified(input.alertId);
    }),

  // Calculate driver score
  calculateDriverScore: protectedProcedure
    .input(
      z.object({
        driverId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input }) => {
      return await eusotrack.calculateDriverScore(
        input.driverId,
        input.startDate,
        input.endDate
      );
    }),
});

// ============================================================================
// EUSOSMS - SMS GATEWAY
// ============================================================================

export const eusosmsRouter = router({
  // Send SMS
  sendSms: protectedProcedure
    .input(
      z.object({
        to: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await eusosms.sendSms({
        to: input.to,
        message: input.message,
        userId: ctx.user?.id,
      });
    }),

  // Send bulk SMS
  sendBulkSms: protectedProcedure
    .input(
      z.object({
        phoneNumbers: z.array(z.string()),
        message: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await eusosms.sendBulkSms(
        input.phoneNumbers,
        input.message,
        ctx.user?.id
      );
    }),

  // Get SMS status
  getSmsStatus: protectedProcedure
    .input(z.object({ smsId: z.number() }))
    .query(async ({ input }) => {
      return await eusosms.getSmsStatus(input.smsId);
    }),

  // Get SMS history
  getSmsHistory: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await eusosms.getSmsHistory(input.phoneNumber, input.limit);
    }),

  // Opt out
  optOut: protectedProcedure
    .input(z.object({ phoneNumber: z.string() }))
    .mutation(async ({ input }) => {
      return await eusosms.optOutPhoneNumber(input.phoneNumber);
    }),

  // Opt in
  optIn: protectedProcedure
    .input(z.object({ phoneNumber: z.string() }))
    .mutation(async ({ input }) => {
      return await eusosms.optInPhoneNumber(input.phoneNumber);
    }),

  // Get cost summary
  getCostSummary: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      return await eusosms.getSmsCostSummary(
        ctx.user?.id,
        input.startDate,
        input.endDate
      );
    }),
});

// ============================================================================
// EUSOBANK - BANK ACCOUNT LINKING & ACH
// ============================================================================

export const eusobankRouter = router({
  // Link bank account
  linkAccount: protectedProcedure
    .input(
      z.object({
        bankName: z.string(),
        accountType: z.enum(["CHECKING", "SAVINGS"]),
        accountNumber: z.string(),
        routingNumber: z.string(),
        accountHolderName: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      
      return await eusobank.linkBankAccount({
        userId: ctx.user.id,
        ...input,
      });
    }),

  // Verify bank account
  verifyAccount: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
        amount1: z.number(),
        amount2: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await eusobank.verifyBankAccount(
        input.accountId,
        input.amount1,
        input.amount2
      );
    }),

  // Get linked accounts
  getLinkedAccounts: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error("Not authenticated");
    return await eusobank.getLinkedAccounts(ctx.user.id);
  }),

  // Initiate ACH transfer
  initiateTransfer: protectedProcedure
    .input(
      z.object({
        fromAccountId: z.number().optional(),
        toAccountId: z.number().optional(),
        amount: z.number(),
        description: z.string().optional(),
        scheduledFor: z.date().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      
      return await eusobank.initiateAchTransfer({
        ...input,
        initiatedBy: ctx.user.id,
      });
    }),

  // Get transfer status
  getTransferStatus: protectedProcedure
    .input(z.object({ transferId: z.number() }))
    .query(async ({ input }) => {
      return await eusobank.getAchTransferStatus(input.transferId);
    }),

  // Get transaction history
  getTransactionHistory: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await eusobank.getTransactionHistory(
        input.accountId,
        input.startDate,
        input.endDate,
        input.limit
      );
    }),

  // Sync account balance
  syncBalance: protectedProcedure
    .input(z.object({ accountId: z.number() }))
    .mutation(async ({ input }) => {
      return await eusobank.syncAccountBalance(input.accountId);
    }),

  // Set default account
  setDefaultAccount: protectedProcedure
    .input(z.object({ accountId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      return await eusobank.setDefaultAccount(ctx.user.id, input.accountId);
    }),

  // Remove account
  removeAccount: protectedProcedure
    .input(z.object({ accountId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      return await eusobank.removeBankAccount(input.accountId, ctx.user.id);
    }),
});

// ============================================================================
// COMBINED ROUTER
// ============================================================================

export const inhouseRouter = router({
  track: eusotrackRouter,
  sms: eusosmsRouter,
  bank: eusobankRouter,
});

