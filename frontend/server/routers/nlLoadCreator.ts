/**
 * NATURAL LANGUAGE LOAD CREATION ROUTER (GAP-339)
 * tRPC procedures for parsing natural language into structured load data.
 */

import { z } from "zod";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { parseNaturalLanguageLoad } from "../services/NaturalLanguageLoadCreator";

export const nlLoadCreatorRouter = router({
  /**
   * Parse natural language text into structured load fields
   */
  parseLoadText: protectedProcedure
    .input(z.object({
      text: z.string().min(3).max(2000),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = parseNaturalLanguageLoad(input.text);

        // Try AI sidecar for enhanced parsing if available
        let sidecarResult: any = null;
        try {
          const { parseLoadQuery } = await import("../services/aiSidecar");
          sidecarResult = await parseLoadQuery(input.text);
        } catch { /* sidecar unavailable */ }

        // Merge sidecar results if they provide additional info
        if (sidecarResult?.success && sidecarResult.parsed) {
          const sp = sidecarResult.parsed;
          if (!result.parsed.originCity && sp.origin) {
            result.parsed.originCity = sp.origin;
            result.parsed.parsedFields.push("origin");
          }
          if (!result.parsed.destinationCity && sp.destination) {
            result.parsed.destinationCity = sp.destination;
            result.parsed.parsedFields.push("destination");
          }
          if (!result.parsed.equipmentType && sp.equipment) {
            result.parsed.equipmentType = sp.equipment.toLowerCase();
            result.parsed.parsedFields.push("equipment");
          }
          if (!result.parsed.cargoType && sp.cargo_type) {
            result.parsed.cargoType = sp.cargo_type;
            result.parsed.parsedFields.push("cargoType");
          }
          if (!result.parsed.hazmat && sp.hazmat) {
            result.parsed.hazmat = true;
            result.parsed.parsedFields.push("hazmat");
          }
          // Recalculate confidence
          const uniqueFields = new Set(result.parsed.parsedFields);
          result.parsed.confidence = Math.min(100, Math.round((uniqueFields.size / 10) * 100));
          result.parsed.parsedFields = Array.from(uniqueFields);
          result.success = result.parsed.parsedFields.length >= 2;
        }

        return result;
      } catch (e) {
        logger.error("[NLLoadCreator] parseLoadText error:", e);
        return {
          success: false,
          parsed: {
            originCity: null, originState: null,
            destinationCity: null, destinationState: null,
            cargoType: null, cargoDescription: null,
            weight: null, weightUnit: "lbs", palletCount: null,
            equipmentType: null,
            pickupDate: null, deliveryDate: null, urgency: "standard" as const,
            rate: null, rateType: null,
            hazmat: false, temperatureControlled: false, oversized: false,
            confidence: 0, parsedFields: [], unparsedText: input.text,
            suggestions: ["Could not parse input. Try: 'Flatbed from Houston TX to Dallas TX, 40000 lbs, $2800'"],
          },
          rawInput: input.text,
          extractedEntities: [],
        };
      }
    }),

  /**
   * Get example prompts for load creation
   */
  getExamples: protectedProcedure.query(async () => {
    return [
      {
        category: "General Freight",
        examples: [
          "Flatbed from Houston TX to Dallas TX, 40000 lbs steel coils, pickup next Monday, $2800",
          "Dry van Chicago to Atlanta, 20 pallets consumer goods, 35000 lbs, deliver by Friday",
          "Need a van from Denver to Phoenix, 25000 lbs, $1800 flat rate",
        ],
      },
      {
        category: "Tanker / Liquid",
        examples: [
          "Tanker load crude oil from Midland TX to Houston TX, 42000 lbs, $3200",
          "Food grade tanker, milk from Wisconsin to Chicago, 45000 lbs, ASAP",
          "Chemical tanker Houston to Baton Rouge, hazmat, 38000 lbs, $2500",
        ],
      },
      {
        category: "Temperature Controlled",
        examples: [
          "Reefer from LA to Phoenix, 20 pallets frozen food, 30000 lbs, $3.50/mile",
          "Refrigerated load produce from Salinas CA to Denver CO, deliver by Wednesday",
          "Cold chain pharmaceuticals Boston to NYC, expedited, temperature controlled",
        ],
      },
      {
        category: "Oversized / Heavy Haul",
        examples: [
          "Lowboy from Houston to Oklahoma City, oversized machinery 80000 lbs, permit required",
          "Step deck Detroit to Nashville, 55000 lbs steel beams, $3800",
          "RGN heavy haul construction equipment from Atlanta to Miami, 95000 lbs",
        ],
      },
      {
        category: "Hazmat",
        examples: [
          "Hazmat tanker flammable chemicals from Houston to New Orleans, UN1203, $4200",
          "MC331 propane from Tulsa to Dallas, 42000 lbs, hazardous materials",
          "Corrosive chemicals dry van with placard, Philadelphia to Baltimore, $1500",
        ],
      },
    ];
  }),
});
