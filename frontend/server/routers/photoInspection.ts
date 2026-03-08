/**
 * PHOTO-BASED PRE-TRIP INSPECTION AI ROUTER (GAP-164)
 * tRPC procedures for AI-powered photo inspection analysis.
 */

import { z } from "zod";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import {
  INSPECTION_POINTS,
  analyzeInspectionPhoto,
  generatePhotoInspectionReport,
} from "../services/PhotoInspectionAI";

export const photoInspectionRouter = router({
  /**
   * Get all inspection points (checklist)
   */
  getInspectionPoints: protectedProcedure.query(async () => {
    return INSPECTION_POINTS;
  }),

  /**
   * Analyze a single photo for an inspection point
   */
  analyzePhoto: protectedProcedure
    .input(z.object({
      pointId: z.string(),
      photoUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // In production, photoUrl would be sent to Gemini Vision via visualIntelligence.ts
      const result = analyzeInspectionPhoto(input.pointId);
      return result;
    }),

  /**
   * Run full photo inspection (all points)
   */
  runFullInspection: protectedProcedure
    .input(z.object({
      vehicleId: z.string(),
      type: z.enum(["pre_trip", "post_trip"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const driverId = String(ctx.user?.id || 0);
      return generatePhotoInspectionReport(input.vehicleId, driverId, input.type);
    }),

  /**
   * Get inspection report by ID (simulated)
   */
  getReport: protectedProcedure
    .input(z.object({ reportId: z.string() }))
    .query(async ({ ctx, input }) => {
      const driverId = String(ctx.user?.id || 0);
      return generatePhotoInspectionReport("VEH-001", driverId, "pre_trip");
    }),

  /**
   * Get inspection history summary
   */
  getHistory: protectedProcedure
    .input(z.object({ vehicleId: z.string().optional(), limit: z.number().default(10) }))
    .query(async ({ ctx }) => {
      const driverId = String(ctx.user?.id || 0);
      // Return a few sample historical reports
      return [1, 2, 3].map((_, i) => {
        const report = generatePhotoInspectionReport(`VEH-00${i + 1}`, driverId, i % 2 === 0 ? "pre_trip" : "post_trip");
        report.startedAt = new Date(Date.now() - (i + 1) * 86400000).toISOString();
        report.completedAt = new Date(Date.now() - (i + 1) * 86400000 + 300000).toISOString();
        return {
          id: report.id,
          vehicleId: report.vehicleId,
          type: report.type,
          completedAt: report.completedAt,
          overallResult: report.overallResult,
          complianceScore: report.complianceScore,
          totalDefects: report.totalDefects,
          criticalDefects: report.criticalDefects,
          safeToOperate: report.safeToOperate,
        };
      });
    }),
});
