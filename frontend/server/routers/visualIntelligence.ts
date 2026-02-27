/**
 * VISUAL INTELLIGENCE ROUTER — VIGA-Powered Visual Analysis for EusoTrip
 * 
 * tRPC procedures for all visual analysis use cases:
 *   - ZEUN Mechanics photo diagnosis
 *   - Gauge reading extraction
 *   - Seal verification
 *   - DVIR inspection assistance
 *   - Cargo condition assessment
 *   - POD visual verification
 *   - Facility mapping
 *   - Damage assessment
 *   - Road condition reporting
 */

import { z } from "zod";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import {
  analyzeImage,
  analyzeImageMultiPass,
  type AnalysisType,
} from "../services/visualIntelligence";

const imageInput = z.object({
  imageBase64: z.string().min(100, "Image data required"),
  mimeType: z.string().optional().default("image/jpeg"),
});

export const visualIntelligenceRouter = router({
  // ═══════════════════════════════════════════════════════════════════
  // ZEUN MECHANICS — Photograph-based mechanical diagnosis
  // ═══════════════════════════════════════════════════════════════════
  diagnoseMechanical: protectedProcedure
    .input(
      imageInput.extend({
        vehicleMake: z.string().optional(),
        vehicleModel: z.string().optional(),
        vehicleYear: z.number().optional(),
        issueCategory: z.string().optional(),
        symptoms: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await analyzeImage({
        imageBase64: input.imageBase64,
        mimeType: input.mimeType,
        analysisType: "MECHANICAL_DIAGNOSIS",
        context: {
          vehicleMake: input.vehicleMake,
          vehicleModel: input.vehicleModel,
          vehicleYear: input.vehicleYear,
          issueCategory: input.issueCategory,
          symptoms: input.symptoms,
        },
      });
      return result;
    }),

  // ═══════════════════════════════════════════════════════════════════
  // GAUGE READING — Extract readings from tank/pressure/temp gauges
  // ═══════════════════════════════════════════════════════════════════
  readGauge: protectedProcedure
    .input(
      imageInput.extend({
        gaugeType: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await analyzeImage({
        imageBase64: input.imageBase64,
        mimeType: input.mimeType,
        analysisType: "GAUGE_READING",
        context: { gaugeType: input.gaugeType },
      });
      return result;
    }),

  // ═══════════════════════════════════════════════════════════════════
  // SEAL VERIFICATION — Verify seal number & detect tampering
  // ═══════════════════════════════════════════════════════════════════
  verifySeal: protectedProcedure
    .input(
      imageInput.extend({
        expectedSealNumber: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await analyzeImage({
        imageBase64: input.imageBase64,
        mimeType: input.mimeType,
        analysisType: "SEAL_VERIFICATION",
        context: { expectedSealNumber: input.expectedSealNumber },
      });
      return result;
    }),

  // ═══════════════════════════════════════════════════════════════════
  // DVIR INSPECTION — AI-assisted vehicle inspection point check
  // ═══════════════════════════════════════════════════════════════════
  inspectDVIR: protectedProcedure
    .input(
      imageInput.extend({
        inspectionPoint: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await analyzeImage({
        imageBase64: input.imageBase64,
        mimeType: input.mimeType,
        analysisType: "DVIR_INSPECTION",
        context: { inspectionPoint: input.inspectionPoint },
      });
      return result;
    }),

  // ═══════════════════════════════════════════════════════════════════
  // CARGO CONDITION — Assess cargo securement and integrity
  // ═══════════════════════════════════════════════════════════════════
  assessCargo: protectedProcedure
    .input(imageInput)
    .mutation(async ({ input }) => {
      const result = await analyzeImage({
        imageBase64: input.imageBase64,
        mimeType: input.mimeType,
        analysisType: "CARGO_CONDITION",
      });
      return result;
    }),

  // ═══════════════════════════════════════════════════════════════════
  // POD VERIFICATION — Visual proof of delivery
  // ═══════════════════════════════════════════════════════════════════
  verifyPOD: protectedProcedure
    .input(
      imageInput.extend({
        loadNumber: z.string().optional(),
        consigneeName: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await analyzeImage({
        imageBase64: input.imageBase64,
        mimeType: input.mimeType,
        analysisType: "POD_VERIFICATION",
        context: { loadNumber: input.loadNumber, consigneeName: input.consigneeName },
      });
      return result;
    }),

  // ═══════════════════════════════════════════════════════════════════
  // FACILITY MAPPING — Crowdsourced terminal/facility intelligence
  // ═══════════════════════════════════════════════════════════════════
  mapFacility: protectedProcedure
    .input(imageInput)
    .mutation(async ({ input }) => {
      const result = await analyzeImage({
        imageBase64: input.imageBase64,
        mimeType: input.mimeType,
        analysisType: "FACILITY_MAPPING",
      });
      return result;
    }),

  // ═══════════════════════════════════════════════════════════════════
  // DAMAGE ASSESSMENT — Accident/incident documentation
  // ═══════════════════════════════════════════════════════════════════
  assessDamage: protectedProcedure
    .input(imageInput)
    .mutation(async ({ input }) => {
      const result = await analyzeImage({
        imageBase64: input.imageBase64,
        mimeType: input.mimeType,
        analysisType: "DAMAGE_ASSESSMENT",
      });
      return result;
    }),

  // ═══════════════════════════════════════════════════════════════════
  // ROAD CONDITION — Route hazard documentation
  // ═══════════════════════════════════════════════════════════════════
  reportRoadCondition: protectedProcedure
    .input(imageInput)
    .mutation(async ({ input }) => {
      const result = await analyzeImage({
        imageBase64: input.imageBase64,
        mimeType: input.mimeType,
        analysisType: "ROAD_CONDITION",
      });
      return result;
    }),

  // ═══════════════════════════════════════════════════════════════════
  // MULTI-PASS — Run multiple analysis types on the same image
  // ═══════════════════════════════════════════════════════════════════
  analyzeMulti: protectedProcedure
    .input(
      imageInput.extend({
        passes: z.array(
          z.enum([
            "MECHANICAL_DIAGNOSIS",
            "GAUGE_READING",
            "SEAL_VERIFICATION",
            "DVIR_INSPECTION",
            "CARGO_CONDITION",
            "POD_VERIFICATION",
            "FACILITY_MAPPING",
            "DAMAGE_ASSESSMENT",
            "ROAD_CONDITION",
            "GENERAL_VISUAL",
          ]),
        ),
        context: z.record(z.string(), z.any()).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const results = await analyzeImageMultiPass(
        {
          imageBase64: input.imageBase64,
          mimeType: input.mimeType,
          analysisType: input.passes[0] as AnalysisType,
          context: input.context,
        },
        input.passes as AnalysisType[],
      );
      return { results };
    }),
});
