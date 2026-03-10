// GAP-446: Autonomous Vehicle Integration — tRPC Router
import { router, protectedProcedure, roleProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { sql } from "drizzle-orm";
import { auditLogs } from "../../drizzle/schema";
import { unsafeCast } from "../_core/types/unsafe";

const superAdminProcedure = roleProcedure("SUPER_ADMIN");

export const autonomousRouter = router({
  // Register an autonomous vehicle
  register: superAdminProcedure
    .input(z.object({ vehicleId: z.number(), vin: z.string().length(17), avLevel: z.number().min(1).max(5) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.execute(
        sql`INSERT INTO autonomous_vehicles (vehicleId, vin, avLevel) VALUES (${input.vehicleId}, ${input.vin}, ${input.avLevel})`
      );
      await db.insert(auditLogs).values({
        action: "av_registered",
        entityType: "autonomous_vehicle",
        entityId: input.vehicleId,
        changes: JSON.stringify({ vin: input.vin, avLevel: input.avLevel }),
        severity: "MEDIUM",
      });
      return { success: true };
    }),

  // List all AVs
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const [rows] = await db.execute(sql`SELECT * FROM autonomous_vehicles ORDER BY id DESC LIMIT 200`);
    return rows || [];
  }),

  // Get AV details
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [rows] = await db.execute(sql`SELECT * FROM autonomous_vehicles WHERE id = ${input.id} LIMIT 1`);
      return unsafeCast(rows)?.[0] || null;
    }),

  // Ingest telemetry data
  ingestTelemetry: protectedProcedure
    .input(z.object({
      avId: z.number(),
      latitude: z.number(),
      longitude: z.number(),
      speed: z.number().optional(),
      fuelLevel: z.number().optional(),
      engineTemp: z.number().optional(),
      diagnosticCode: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.execute(
        sql`INSERT INTO av_telemetry (avId, latitude, longitude, speed, fuelLevel, engineTemp, diagnosticCode)
            VALUES (${input.avId}, ${input.latitude}, ${input.longitude}, ${input.speed || null}, ${input.fuelLevel || null}, ${input.engineTemp || null}, ${input.diagnosticCode || null})`
      );

      // Update last telemetry timestamp on vehicle
      await db.execute(
        sql`UPDATE autonomous_vehicles SET telemetryLastUpdate = NOW(), operationalStatus = 'active' WHERE id = ${input.avId}`
      );

      await db.insert(auditLogs).values({
        action: "av_telemetry_ingested",
        entityType: "autonomous_vehicle",
        entityId: input.avId,
        changes: JSON.stringify({ latitude: input.latitude, longitude: input.longitude, speed: input.speed ?? null, diagnosticCode: input.diagnosticCode ?? null }),
        severity: "LOW",
      });
      return { success: true };
    }),

  // Get latest telemetry for an AV
  getLatestTelemetry: protectedProcedure
    .input(z.object({ avId: z.number(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const [rows] = await db.execute(
        sql`SELECT * FROM av_telemetry WHERE avId = ${input.avId} ORDER BY id DESC LIMIT ${input.limit}`
      );
      return rows || [];
    }),

  // Emergency takeover
  emergencyTakeover: superAdminProcedure
    .input(z.object({ avId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = Number(ctx.user!.id);
      await db.execute(
        sql`UPDATE autonomous_vehicles SET operationalStatus = 'emergency_control', remotePilotId = ${userId} WHERE id = ${input.avId}`
      );
      return { success: true, message: "Emergency takeover initiated" };
    }),

  // Release from emergency control
  releaseControl: superAdminProcedure
    .input(z.object({ avId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.execute(
        sql`UPDATE autonomous_vehicles SET operationalStatus = 'active', remotePilotId = NULL WHERE id = ${input.avId}`
      );
      await db.insert(auditLogs).values({
        action: "av_control_released",
        entityType: "autonomous_vehicle",
        entityId: input.avId,
        changes: JSON.stringify({ operationalStatus: "active", remotePilotId: null }),
        severity: "HIGH",
      });
      return { success: true };
    }),

  // Get fleet status overview
  getFleetStatus: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { total: 0, active: 0, idle: 0, emergency: 0, offline: 0 };
    const [rows] = await db.execute(
      sql`SELECT operationalStatus, COUNT(*) as cnt FROM autonomous_vehicles GROUP BY operationalStatus`
    );
    const counts: Record<string, number> = {};
    unsafeCast(rows || []).forEach((r: any) => { counts[r.operationalStatus] = Number(r.cnt); });
    return {
      total: Object.values(counts).reduce((a, b) => a + b, 0),
      active: counts.active || 0,
      idle: counts.idle || 0,
      emergency: counts.emergency_control || 0,
      offline: counts.offline || 0,
    };
  }),
});
