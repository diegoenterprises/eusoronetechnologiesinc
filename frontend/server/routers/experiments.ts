// GAP-451: Innovation Lab — tRPC Router for A/B Testing
import { router, protectedProcedure, roleProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { sql } from "drizzle-orm";
import { ExperimentService } from "../services/ExperimentService";

const superAdminProcedure = roleProcedure("SUPER_ADMIN");

export const experimentsRouter = router({
  // List all experiments (any status)
  list: superAdminProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const status = input?.status;
      const [rows] = status
        ? await db.execute(sql`SELECT * FROM experiments WHERE status = ${status} ORDER BY createdAt DESC LIMIT 100`) as any
        : await db.execute(sql`SELECT * FROM experiments ORDER BY createdAt DESC LIMIT 100`) as any;
      return (rows || []).map((r: any) => ({
        ...r,
        variants: typeof r.variants === "string" ? JSON.parse(r.variants) : r.variants,
      }));
    }),

  // Get single experiment with results
  get: superAdminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [rows] = await db.execute(sql`SELECT * FROM experiments WHERE id = ${input.id} LIMIT 1`) as any;
      if (!rows?.[0]) return null;
      const exp = rows[0];
      exp.variants = typeof exp.variants === "string" ? JSON.parse(exp.variants) : exp.variants;

      // Get assignment counts
      const [assignRows] = await db.execute(
        sql`SELECT variantId, COUNT(*) as cnt FROM variant_assignments WHERE experimentId = ${input.id} GROUP BY variantId`
      ) as any;
      const assignmentCounts: Record<string, number> = {};
      (assignRows || []).forEach((r: any) => { assignmentCounts[r.variantId] = Number(r.cnt); });

      // Get results
      const [resultRows] = await db.execute(
        sql`SELECT * FROM experiment_results WHERE experimentId = ${input.id} ORDER BY metricName, variantId`
      ) as any;

      return { ...exp, assignmentCounts, results: resultRows || [] };
    }),

  // Create new experiment
  create: superAdminProcedure
    .input(z.object({
      name: z.string().min(3).max(255),
      description: z.string().optional(),
      hypothesisStatement: z.string().min(10),
      variants: z.array(z.object({
        variantId: z.string(),
        name: z.string(),
        config: z.record(z.string(), z.any()).optional(),
      })).min(2).max(5),
      targetUserSegment: z.string().default("all"),
      minSampleSize: z.number().int().positive().default(100),
      startDate: z.string(),
      endDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = Number((ctx.user as any)?.id);

      await db.execute(
        sql`INSERT INTO experiments (name, description, hypothesisStatement, variants, targetUserSegment, minSampleSize, startDate, endDate, createdBy, status)
            VALUES (${input.name}, ${input.description || null}, ${input.hypothesisStatement}, ${JSON.stringify(input.variants)}, ${input.targetUserSegment}, ${input.minSampleSize}, ${input.startDate}, ${input.endDate || null}, ${userId}, 'draft')`
      );

      return { success: true };
    }),

  // Update experiment status
  updateStatus: superAdminProcedure
    .input(z.object({ id: z.number(), status: z.enum(["draft", "active", "paused", "completed"]) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.execute(sql`UPDATE experiments SET status = ${input.status} WHERE id = ${input.id}`);
      return { success: true };
    }),

  // Assign current user to experiment variant (for regular users)
  assignMe: protectedProcedure
    .input(z.object({ experimentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = Number((ctx.user as any)?.id);
      const role = (ctx.user as any)?.role || "unknown";
      const variantId = await ExperimentService.assignUserToVariant(input.experimentId, userId, "NA", role);
      return { variantId };
    }),

  // Track a metric event
  trackMetric: protectedProcedure
    .input(z.object({
      experimentId: z.number(),
      metricName: z.string(),
      metricValue: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = Number((ctx.user as any)?.id);
      const db = await getDb();
      if (!db) return { success: false };

      // Get user's variant assignment
      const [rows] = await db.execute(
        sql`SELECT variantId FROM variant_assignments WHERE experimentId = ${input.experimentId} AND userId = ${userId} LIMIT 1`
      ) as any;
      if (!rows?.[0]) throw new Error("User not assigned to experiment variant");

      await ExperimentService.trackMetricEvent(input.experimentId, userId, rows[0].variantId, input.metricName, input.metricValue);
      return { success: true };
    }),

  // Compute results for an experiment
  computeResults: superAdminProcedure
    .input(z.object({ experimentId: z.number() }))
    .mutation(async ({ input }) => {
      const results = await ExperimentService.computeExperimentResults(input.experimentId);
      return results;
    }),

  // Get results
  getResults: superAdminProcedure
    .input(z.object({ experimentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const [rows] = await db.execute(
        sql`SELECT * FROM experiment_results WHERE experimentId = ${input.experimentId} ORDER BY metricName, variantId`
      ) as any;
      return rows || [];
    }),

  // Delete experiment
  delete: superAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.execute(sql`DELETE FROM experiment_results WHERE experimentId = ${input.id}`);
      await db.execute(sql`DELETE FROM metric_events WHERE experimentId = ${input.id}`);
      await db.execute(sql`DELETE FROM variant_assignments WHERE experimentId = ${input.id}`);
      await db.execute(sql`DELETE FROM experiments WHERE id = ${input.id}`);
      return { success: true };
    }),
});
