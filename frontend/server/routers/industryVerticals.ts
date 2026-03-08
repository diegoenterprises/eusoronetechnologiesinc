/**
 * INDUSTRY VERTICALS ROUTER (GAP-274-339)
 * tRPC procedures for industry vertical configuration,
 * load validation by vertical, and pricing adjustments.
 */

import { z } from "zod";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import {
  getAllVerticals,
  getVertical,
  getVerticalFields,
  getVerticalCompliance,
  getVerticalDocuments,
  getVerticalPricing,
  validateLoadForVertical,
} from "../services/IndustryVerticals";

export const industryVerticalsRouter = router({
  // 1. getAll — List all available industry verticals
  getAll: protectedProcedure.query(async () => {
    const verticals = getAllVerticals();
    return verticals.map(v => ({
      id: v.id,
      name: v.name,
      icon: v.icon,
      description: v.description,
      equipmentCount: v.equipmentTypes.length,
      cargoTypes: v.cargoTypes,
      temperatureControlled: v.temperatureControlled,
      hazmatApplicable: v.hazmatApplicable,
    }));
  }),

  // 2. getVertical — Full vertical configuration
  getVertical: protectedProcedure
    .input(z.object({ verticalId: z.string() }))
    .query(async ({ input }) => {
      const vertical = getVertical(input.verticalId);
      if (!vertical) return null;
      return vertical;
    }),

  // 3. getFields — Custom fields for load creation wizard
  getFields: protectedProcedure
    .input(z.object({ verticalId: z.string() }))
    .query(async ({ input }) => {
      return getVerticalFields(input.verticalId);
    }),

  // 4. getCompliance — Compliance rules for a vertical
  getCompliance: protectedProcedure
    .input(z.object({ verticalId: z.string() }))
    .query(async ({ input }) => {
      return getVerticalCompliance(input.verticalId);
    }),

  // 5. getDocuments — Required documents for a vertical
  getDocuments: protectedProcedure
    .input(z.object({ verticalId: z.string() }))
    .query(async ({ input }) => {
      return getVerticalDocuments(input.verticalId);
    }),

  // 6. calculatePricing — Pricing with vertical-specific adjustments
  calculatePricing: protectedProcedure
    .input(z.object({
      verticalId: z.string(),
      baseRate: z.number(),
      factors: z.array(z.string()),
    }))
    .query(async ({ input }) => {
      return getVerticalPricing(input.verticalId, input.baseRate, input.factors);
    }),

  // 7. validateLoad — Validate load data against vertical requirements
  validateLoad: protectedProcedure
    .input(z.object({
      verticalId: z.string(),
      loadData: z.record(z.string(), z.any()),
    }))
    .query(async ({ input }) => {
      return validateLoadForVertical(input.verticalId, input.loadData);
    }),

  // 8. getEquipmentTypes — Equipment types for a vertical
  getEquipmentTypes: protectedProcedure
    .input(z.object({ verticalId: z.string() }))
    .query(async ({ input }) => {
      const vertical = getVertical(input.verticalId);
      if (!vertical) return [];
      return vertical.equipmentTypes;
    }),

  // 9. getPricingFactors — Available pricing factors for a vertical
  getPricingFactors: protectedProcedure
    .input(z.object({ verticalId: z.string() }))
    .query(async ({ input }) => {
      const vertical = getVertical(input.verticalId);
      if (!vertical) return [];
      return vertical.pricingFactors;
    }),

  // 10. getSpecialRequirements — Special requirements for a vertical
  getSpecialRequirements: protectedProcedure
    .input(z.object({ verticalId: z.string() }))
    .query(async ({ input }) => {
      const vertical = getVertical(input.verticalId);
      if (!vertical) return { requirements: [], weightRange: null };
      return {
        requirements: vertical.specialRequirements,
        weightRange: vertical.typicalWeightRange,
        temperatureControlled: vertical.temperatureControlled,
        hazmatApplicable: vertical.hazmatApplicable,
      };
    }),
});
