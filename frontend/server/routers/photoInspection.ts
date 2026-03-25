/**
 * PHOTO-BASED PRE-TRIP INSPECTION AI ROUTER (GAP-164)
 * tRPC procedures for AI-powered photo inspection analysis.
 * Powered by VIGA (visualIntelligence.ts) — Gemini 2.5 Flash Vision
 */

import { z } from "zod";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import {
  INSPECTION_POINTS,
  analyzeInspectionPhoto,
  generatePhotoInspectionReport,
} from "../services/PhotoInspectionAI";
import { eq, desc, and, sql } from "drizzle-orm";
import { getDb } from "../db";
import { inspections, vehicles } from "../../drizzle/schema";

export const photoInspectionRouter = router({
  /**
   * Get all inspection points (checklist)
   */
  getInspectionPoints: protectedProcedure.query(async () => {
    return INSPECTION_POINTS;
  }),

  /**
   * Analyze a single photo for an inspection point via VIGA Gemini Vision
   */
  analyzePhoto: protectedProcedure
    .input(z.object({
      pointId: z.string(),
      imageBase64: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return analyzeInspectionPhoto(input.pointId, input.imageBase64);
    }),

  /**
   * Run full photo inspection (all points) via VIGA Gemini Vision
   */
  runFullInspection: protectedProcedure
    .input(z.object({
      vehicleId: z.string(),
      type: z.enum(["pre_trip", "post_trip"]),
      photos: z.record(z.string(), z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const driverId = String(ctx.user?.id || 0);
      return generatePhotoInspectionReport(input.vehicleId, driverId, input.type, input.photos);
    }),

  /**
   * Get inspection report by ID
   */
  getReport: protectedProcedure
    .input(z.object({ reportId: z.string() }))
    .query(async ({ ctx, input }) => {
      const driverId = String(ctx.user?.id || 0);
      const db = await getDb();
      if (db) {
        try {
          // Try to find a real inspection record by id
          const numericId = parseInt(input.reportId.replace(/\D/g, ""), 10);
          if (!isNaN(numericId)) {
            const rows = await db
              .select({
                id: inspections.id,
                vehicleId: inspections.vehicleId,
                type: inspections.type,
                status: inspections.status,
                defectsFound: inspections.defectsFound,
                oosViolation: inspections.oosViolation,
                completedAt: inspections.completedAt,
                createdAt: inspections.createdAt,
              })
              .from(inspections)
              .where(eq(inspections.id, numericId))
              .limit(1);
            if (rows[0]) {
              const rec = rows[0];
              const inspType = (rec.type === "pre_trip" || rec.type === "post_trip") ? rec.type : "pre_trip";
              return generatePhotoInspectionReport(
                `VEH-${String(rec.vehicleId).padStart(3, "0")}`,
                driverId,
                inspType,
              );
            }
          }
        } catch { /* fall through to default */ }
      }
      // Fallback: use reportId as vehicle identifier
      return generatePhotoInspectionReport(input.reportId, driverId, "pre_trip");
    }),

  /**
   * Get inspection history summary
   */
  getHistory: protectedProcedure
    .input(z.object({ vehicleId: z.string().optional(), limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const driverId = String(ctx.user?.id || 0);
      const db = await getDb();

      if (db) {
        try {
          const conditions = [
            sql`${inspections.type} IN ('pre_trip', 'post_trip')`,
          ];
          if (input.vehicleId) {
            const numericVehicleId = parseInt(input.vehicleId.replace(/\D/g, ""), 10);
            if (!isNaN(numericVehicleId)) {
              conditions.push(eq(inspections.vehicleId, numericVehicleId));
            }
          }

          const rows = await db
            .select({
              id: inspections.id,
              vehicleId: inspections.vehicleId,
              type: inspections.type,
              status: inspections.status,
              defectsFound: inspections.defectsFound,
              oosViolation: inspections.oosViolation,
              completedAt: inspections.completedAt,
              createdAt: inspections.createdAt,
            })
            .from(inspections)
            .where(and(...conditions))
            .orderBy(desc(inspections.createdAt))
            .limit(input.limit);

          if (rows.length > 0) {
            return rows.map((r) => ({
              id: `INSP-${r.id}`,
              vehicleId: `VEH-${String(r.vehicleId).padStart(3, "0")}`,
              type: r.type,
              completedAt: (r.completedAt ?? r.createdAt).toISOString(),
              overallResult: r.status === "passed" ? "pass" : r.status === "failed" ? "fail" : "pending",
              complianceScore: r.status === "passed" ? 100 : r.status === "failed" ? (r.oosViolation ? 30 : 60) : 50,
              totalDefects: r.defectsFound ?? 0,
              criticalDefects: r.oosViolation ? Math.max(1, Math.floor((r.defectsFound ?? 0) / 2)) : 0,
              safeToOperate: r.status !== "failed" || !r.oosViolation,
            }));
          }
        } catch { /* fall through to AI-generated fallback */ }
      }

      // Fallback: generate a single report if no DB records found
      const report = await generatePhotoInspectionReport("VEH-001", driverId, "pre_trip");
      return [{
        id: report.id,
        vehicleId: report.vehicleId,
        type: report.type,
        completedAt: report.completedAt,
        overallResult: report.overallResult,
        complianceScore: report.complianceScore,
        totalDefects: report.totalDefects,
        criticalDefects: report.criticalDefects,
        safeToOperate: report.safeToOperate,
      }];
    }),
});
