/**
 * WS-T1-001: Document Verification Router
 *
 * tRPC procedures for VIGA-inspired BOL/POD verification.
 * Drivers upload document photos → ESANG extracts fields → compares to load record.
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

export const documentVerificationRouter = router({
  /**
   * Verify a BOL or POD document image against the load database.
   * Uses iterative VIGA-style Generator→Verifier→Memory loop.
   */
  verify: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      imageBase64: z.string().min(100, "Image data too short"),
      documentType: z.enum(["bol", "pod"]),
      mimeType: z.string().default("image/jpeg"),
    }))
    .mutation(async ({ input, ctx }) => {
      const { verifyDocument } = await import("../services/ai/documentVerifier");

      const userId = (ctx as any).user?.id ? parseInt(String((ctx as any).user.id), 10) : undefined;

      const result = await verifyDocument(
        input.imageBase64,
        input.loadId,
        input.documentType,
        { mimeType: input.mimeType, userId },
      );

      return result;
    }),

  /**
   * Quick single-pass verification (faster, less accurate).
   * For bulk document screening.
   */
  quickVerify: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      imageBase64: z.string().min(100),
      documentType: z.enum(["bol", "pod"]),
      mimeType: z.string().default("image/jpeg"),
    }))
    .mutation(async ({ input }) => {
      const { quickVerify } = await import("../services/ai/documentVerifier");
      return quickVerify(input.imageBase64, input.loadId, input.documentType, input.mimeType);
    }),

  /**
   * Semantic load search — find loads matching a natural language query.
   */
  semanticSearch: protectedProcedure
    .input(z.object({
      query: z.string().min(2),
      topK: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      const { searchLoads } = await import("../services/ai/semanticMatcher");
      return searchLoads(input.query, { topK: input.topK });
    }),

  /**
   * Get semantic match stats / diagnostics.
   */
  semanticStats: protectedProcedure
    .query(async () => {
      const { getIndexStats } = await import("../services/ai/semanticMatcher");
      return getIndexStats();
    }),

  /**
   * Get contextual RAG index stats.
   */
  contextualStats: protectedProcedure
    .query(async () => {
      const { getContextualIndexStats } = await import("../services/ai/contextualEmbeddings");
      return getContextualIndexStats();
    }),
});
