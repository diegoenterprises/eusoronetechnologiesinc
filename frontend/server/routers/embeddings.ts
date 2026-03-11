/**
 * GEMINI EMBEDDING ROUTER
 *
 * tRPC procedures for semantic indexing, search, and RAG operations
 * powered by Google Gemini Embedding (gemini-embedding-001, 1536-dim).
 *
 * Key operations:
 *   - index: Embed and store content with task-type specialization
 *   - search: Semantic search across indexed content
 *   - migrateEmbeddings: Re-embed old pplx-embed vectors to Gemini
 *   - health: Check Gemini embedding API availability
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { embeddingService, EmbeddingService } from "../services/embeddings/embeddingService";
import { unsafeCast } from "../_core/types/unsafe";

const ENTITY_TYPES = [
  "load", "document", "knowledge", "carrier",
  "rate_sheet", "agreement", "erg_guide", "zone_intelligence",
  "support_ticket", "message", "compliance_record",
] as const;

export const embeddingsRouter = router({

  /**
   * Check if the Gemini Embedding API is reachable.
   */
  health: protectedProcedure.query(async () => {
    const healthy = await embeddingService.isHealthy();
    return {
      healthy,
      model: embeddingService.modelId,
      dimensions: embeddingService.dimensions,
      provider: "gemini",
      queryCache: embeddingService.cacheStats,
    };
  }),

  /**
   * Index one or more texts — embed and store in the DB.
   * Skips items whose content hash hasn't changed (dedup).
   */
  index: protectedProcedure
    .input(z.object({
      items: z.array(z.object({
        entityType: z.enum(ENTITY_TYPES),
        entityId: z.string().min(1),
        text: z.string().min(1).max(100_000),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })).min(1).max(100),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("../db");
      const { embeddings } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Compute content hashes to skip unchanged items
      const itemsWithHash = await Promise.all(
        input.items.map(async (item) => ({
          ...item,
          contentHash: await EmbeddingService.contentHash(item.text),
        }))
      );

      // Check which items already exist with same hash (unchanged → skip)
      const toEmbed: typeof itemsWithHash = [];
      for (const item of itemsWithHash) {
        const [existing] = await db
          .select({ contentHash: embeddings.contentHash })
          .from(embeddings)
          .where(and(
            eq(embeddings.entityType, unsafeCast(item.entityType)),
            eq(embeddings.entityId, item.entityId),
          ))
          .limit(1);

        if (existing?.contentHash === item.contentHash) continue; // unchanged
        toEmbed.push(item);
      }

      if (toEmbed.length === 0) {
        return { indexed: 0, skipped: input.items.length, message: "All items up-to-date" };
      }

      // Embed all texts in one batch
      const results = await embeddingService.embed(toEmbed.map(i => i.text), "RETRIEVAL_DOCUMENT");

      // Upsert into DB
      let indexed = 0;
      for (let i = 0; i < toEmbed.length; i++) {
        const item = toEmbed[i];
        const emb = results[i];
        if (!emb) continue;

        const row = {
          entityType: unsafeCast(item.entityType),
          entityId: item.entityId,
          contentHash: item.contentHash,
          embedding: emb.embedding.values,
          dimensions: emb.embedding.dimensions,
          model: embeddingService.modelId,
          sourceText: item.text.slice(0, 5000), // Truncate for storage
          metadata: item.metadata || null,
          updatedAt: new Date(),
        };

        // Upsert: delete + insert (MySQL-friendly)
        await db.delete(embeddings).where(and(
          eq(embeddings.entityType, unsafeCast(item.entityType)),
          eq(embeddings.entityId, item.entityId),
        ));
        await db.insert(embeddings).values({ ...row, createdAt: new Date() });
        indexed++;
      }

      return { indexed, skipped: input.items.length - toEmbed.length };
    }),

  /**
   * Semantic search — uses cached candidates via aiTurbocharge for speed.
   */
  search: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(10_000),
      entityTypes: z.array(z.enum(ENTITY_TYPES)).optional().default([]),
      topK: z.number().min(1).max(50).default(5),
      threshold: z.number().min(0).max(1).default(0.3),
    }))
    .query(async ({ input }) => {
      const { semanticSearch } = await import("../services/embeddings/aiTurbocharge");
      const results = await semanticSearch(input.query, {
        entityTypes: input.entityTypes.length > 0 ? unsafeCast(input.entityTypes) : undefined,
        topK: input.topK,
        threshold: input.threshold,
      });

      return {
        query: input.query,
        results: results.map(r => ({
          entityType: r.entityType,
          entityId: r.entityId,
          score: r.score,
          text: r.text?.slice(0, 500),
          metadata: r.metadata,
        })),
        totalCandidates: results.length,
        cacheStats: embeddingService.cacheStats,
      };
    }),

  /**
   * Delete embeddings for specific entities.
   */
  remove: protectedProcedure
    .input(z.object({
      entityType: z.enum(ENTITY_TYPES),
      entityIds: z.array(z.string()).min(1).max(100),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import("../db");
      const { embeddings } = await import("../../drizzle/schema");
      const { eq, and, inArray } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.delete(embeddings).where(and(
        eq(embeddings.entityType, unsafeCast(input.entityType)),
        inArray(embeddings.entityId, input.entityIds),
      ));

      return { removed: input.entityIds.length };
    }),

  /**
   * Get stats on indexed embeddings.
   */
  stats: protectedProcedure.query(async () => {
    const { getDb } = await import("../db");
    const { embeddings } = await import("../../drizzle/schema");
    const { sql } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const counts = await db
      .select({
        entityType: embeddings.entityType,
        count: sql<number>`count(*)`,
      })
      .from(embeddings)
      .groupBy(embeddings.entityType);

    const total = counts.reduce((sum, c) => sum + (c.count || 0), 0);

    return {
      total,
      byType: Object.fromEntries(counts.map(c => [c.entityType, c.count])),
      model: embeddingService.modelId,
      dimensions: embeddingService.dimensions,
    };
  }),

  /**
   * Migrate old pplx-embed embeddings to Gemini.
   * Re-embeds rows where model != current model and sourceText is available.
   * Processes in batches to avoid rate limits.
   */
  migrateEmbeddings: protectedProcedure
    .input(z.object({
      batchSize: z.number().min(1).max(100).default(50),
    }).optional())
    .mutation(async ({ input }) => {
      const batchSize = input?.batchSize ?? 50;
      const { getDb } = await import("../db");
      const { embeddings } = await import("../../drizzle/schema");
      const { ne, and, isNotNull, eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const currentModel = embeddingService.modelId;

      // Find rows that need migration
      const stale = await db
        .select({ id: embeddings.id, entityType: embeddings.entityType, entityId: embeddings.entityId, sourceText: embeddings.sourceText })
        .from(embeddings)
        .where(and(ne(embeddings.model, currentModel), isNotNull(embeddings.sourceText)))
        .limit(batchSize);

      if (stale.length === 0) {
        return { migrated: 0, remaining: 0, message: "All embeddings are up to date" };
      }

      // Re-embed using Gemini
      const texts = stale.map(r => r.sourceText || "");
      const results = await embeddingService.embed(texts, "RETRIEVAL_DOCUMENT");

      let migrated = 0;
      for (let i = 0; i < stale.length; i++) {
        const row = stale[i];
        const emb = results[i];
        if (!emb) continue;

        await db.update(embeddings).set({
          embedding: emb.embedding.values,
          dimensions: emb.embedding.dimensions,
          model: currentModel,
          contentHash: await EmbeddingService.contentHash(texts[i]),
          updatedAt: new Date(),
        }).where(eq(embeddings.id, row.id));
        migrated++;
      }

      // Count remaining
      const { sql } = await import("drizzle-orm");
      const [remaining] = await db
        .select({ count: sql<number>`count(*)` })
        .from(embeddings)
        .where(and(ne(embeddings.model, currentModel), isNotNull(embeddings.sourceText)));

      return { migrated, remaining: remaining?.count || 0 };
    }),
});
