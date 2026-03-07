/**
 * DUAL-STORAGE ROUTER — WS-QP-004
 * Exposes GPS trail, ESANG conversation, and audit detail retrieval from MongoDB
 * Falls back gracefully when MongoDB is unavailable
 */

import { z } from "zod";
import { isolatedApprovedProcedure as protectedProcedure, router } from "../_core/trpc";
import * as mongo from "../services/mongoStore";

export const dataStoreRouter = router({

  getGpsTrail: protectedProcedure
    .input(z.object({ loadId: z.number(), limit: z.number().default(500) }))
    .query(async ({ input }) => {
      return mongo.getGpsTrail(input.loadId, input.limit);
    }),

  getDriverGpsTrail: protectedProcedure
    .input(z.object({ driverId: z.number(), limit: z.number().default(500) }))
    .query(async ({ input }) => {
      return mongo.getDriverGpsTrail(input.driverId, input.limit);
    }),

  getConversationHistory: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      return mongo.getConversationHistory(input.sessionId);
    }),

  getUserConversations: protectedProcedure
    .input(z.object({ userId: z.number(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      return mongo.getUserConversations(input.userId, input.limit);
    }),

  getAuditDetail: protectedProcedure
    .input(z.object({ auditLogId: z.number() }))
    .query(async ({ input }) => {
      return mongo.getAuditDetail(input.auditLogId);
    }),

  getAnalysisReport: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => {
      return mongo.getAnalysisReport(input.loadId);
    }),

  getStorageStats: protectedProcedure
    .query(async () => {
      return mongo.getStorageStats();
    }),

  isMongoEnabled: protectedProcedure
    .query(async () => {
      return { enabled: mongo.isMongoEnabled() };
    }),
});
