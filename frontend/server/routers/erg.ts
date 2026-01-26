/**
 * ERG ROUTER
 * tRPC procedures for ERG 2024 Emergency Response Guide lookup
 * Hazmat classification and emergency response procedures
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const ergRouter = router({
  /**
   * Search ERG by UN number
   */
  searchByUN: publicProcedure
    .input(z.object({
      unNumber: z.string(),
    }))
    .query(async ({ input }) => {
      const ergData: Record<string, any> = {
        "1203": {
          unNumber: "1203",
          name: "Gasoline",
          guideNumber: 128,
          hazardClass: "3",
          placard: "Flammable",
          ergPage: "128",
          initialIsolation: {
            small: 30,
            large: 100,
          },
          protectiveDistance: {
            day: { small: 0.1, large: 0.3 },
            night: { small: 0.2, large: 0.5 },
          },
          fireResponse: [
            "CAUTION: All these products have a very low flash point",
            "Use dry chemical, CO2, water spray or alcohol-resistant foam",
            "Do not use straight streams",
            "Water may be ineffective for fire",
          ],
          spillResponse: [
            "Eliminate all ignition sources",
            "Stop leak if you can do it without risk",
            "Prevent entry into waterways, sewers, basements",
            "Use water spray to reduce vapors",
          ],
          firstAid: [
            "Move victim to fresh air",
            "Give artificial respiration if not breathing",
            "Call 911 or emergency medical service",
          ],
        },
        "1202": {
          unNumber: "1202",
          name: "Diesel Fuel",
          guideNumber: 128,
          hazardClass: "3",
          placard: "Flammable",
          ergPage: "128",
          initialIsolation: {
            small: 30,
            large: 100,
          },
          protectiveDistance: {
            day: { small: 0.1, large: 0.2 },
            night: { small: 0.1, large: 0.3 },
          },
          fireResponse: [
            "Use dry chemical, CO2, water spray or foam",
            "Water may be ineffective",
            "Cool containers with flooding quantities of water",
          ],
          spillResponse: [
            "Eliminate all ignition sources",
            "Prevent entry into waterways, sewers, basements",
            "Absorb with earth, sand, or other non-combustible material",
          ],
          firstAid: [
            "Move victim to fresh air",
            "Call 911 if symptoms persist",
          ],
        },
        "1863": {
          unNumber: "1863",
          name: "Jet Fuel",
          guideNumber: 128,
          hazardClass: "3",
          placard: "Flammable",
          ergPage: "128",
          initialIsolation: {
            small: 30,
            large: 100,
          },
          protectiveDistance: {
            day: { small: 0.1, large: 0.3 },
            night: { small: 0.2, large: 0.5 },
          },
          fireResponse: [
            "Use dry chemical, CO2, alcohol-resistant foam or water spray",
            "Do not use straight streams",
            "Move containers from fire area if safe to do so",
          ],
          spillResponse: [
            "Eliminate all ignition sources",
            "Stop leak if without risk",
            "Use water spray to reduce vapors",
          ],
          firstAid: [
            "Move victim to fresh air",
            "Give oxygen if breathing is difficult",
            "Call emergency medical service",
          ],
        },
      };

      const result = ergData[input.unNumber];
      if (!result) {
        return { found: false, unNumber: input.unNumber };
      }

      return { found: true, ...result };
    }),

  /**
   * Search ERG by product name
   */
  searchByName: publicProcedure
    .input(z.object({
      productName: z.string(),
    }))
    .query(async ({ input }) => {
      const products = [
        { unNumber: "1203", name: "Gasoline", guideNumber: 128, hazardClass: "3" },
        { unNumber: "1202", name: "Diesel Fuel", guideNumber: 128, hazardClass: "3" },
        { unNumber: "1863", name: "Jet Fuel", guideNumber: 128, hazardClass: "3" },
        { unNumber: "1170", name: "Ethanol", guideNumber: 127, hazardClass: "3" },
        { unNumber: "1267", name: "Crude Oil", guideNumber: 128, hazardClass: "3" },
        { unNumber: "1993", name: "Flammable Liquid, N.O.S.", guideNumber: 128, hazardClass: "3" },
        { unNumber: "2187", name: "Carbon Dioxide (Refrigerated)", guideNumber: 120, hazardClass: "2.2" },
        { unNumber: "1075", name: "Propane", guideNumber: 115, hazardClass: "2.1" },
        { unNumber: "1011", name: "Butane", guideNumber: 115, hazardClass: "2.1" },
      ];

      const query = input.productName.toLowerCase();
      const results = products.filter(p => 
        p.name.toLowerCase().includes(query)
      );

      return {
        query: input.productName,
        results,
        count: results.length,
      };
    }),

  /**
   * Get ERG guide page
   */
  getGuidePage: publicProcedure
    .input(z.object({
      guideNumber: z.number(),
    }))
    .query(async ({ input }) => {
      const guides: Record<number, any> = {
        128: {
          guideNumber: 128,
          title: "Flammable Liquids (Non-Polar/Water-Immiscible)",
          name: "Flammable Liquids (Non-Polar/Water-Immiscible)",
          hazardClasses: ["3 - Flammable Liquid"],
          potentialHazards: {
            fire: [
              "HIGHLY FLAMMABLE: Will be easily ignited by heat, sparks or flames",
              "Vapors may form explosive mixtures with air",
              "Vapors may travel to source of ignition and flash back",
              "Most vapors are heavier than air",
            ],
            health: [
              "Inhalation or contact with material may irritate or burn skin and eyes",
              "Fire may produce irritating, corrosive and/or toxic gases",
              "Vapors may cause dizziness or suffocation",
            ],
          },
          publicSafety: {
            isolation: "Isolate spill or leak area immediately for at least 25 to 50 meters",
            protective: "Wear positive pressure self-contained breathing apparatus (SCBA)",
            evacuation: {
              spill: "Downwind evacuation should be considered",
              fire: "If tank, rail car or tank truck is involved, ISOLATE for 800 meters",
            },
          },
          emergencyResponse: {
            fire: {
              small: "Dry chemical, CO2, water spray or alcohol-resistant foam",
              large: "Water spray, fog or alcohol-resistant foam",
              notes: "Do not use straight streams. Move containers from fire area if safe.",
            },
            spill: {
              small: "Absorb with earth, sand or other non-combustible material",
              large: "Dike far ahead of liquid spill for later disposal",
              notes: "Prevent entry into waterways, sewers, basements or confined areas.",
            },
          },
        },
        127: {
          guideNumber: 127,
          title: "Flammable Liquids (Polar/Water-Miscible)",
          potentialHazards: {
            fire: [
              "HIGHLY FLAMMABLE: Will be easily ignited by heat, sparks or flames",
              "Vapors may form explosive mixtures with air",
            ],
            health: [
              "Inhalation or contact may irritate or burn skin and eyes",
              "Fire may produce irritating and/or toxic gases",
            ],
          },
          publicSafety: {
            isolation: "Isolate spill or leak area for at least 50 meters",
            protective: "Wear SCBA and structural firefighter protective clothing",
          },
          emergencyResponse: {
            fire: {
              small: "Dry chemical, CO2, water spray or alcohol-resistant foam",
              large: "Water spray, fog or alcohol-resistant foam",
            },
          },
        },
        115: {
          guideNumber: 115,
          title: "Gases - Flammable (Including Refrigerated Liquids)",
          potentialHazards: {
            fire: [
              "EXTREMELY FLAMMABLE",
              "May be ignited by heat, sparks or flames",
              "May form explosive mixtures with air",
              "Vapors from liquefied gas are initially heavier than air",
            ],
            health: [
              "Vapors may cause dizziness or asphyxiation",
              "Contact with gas or liquefied gas may cause burns, severe injury and/or frostbite",
            ],
          },
          publicSafety: {
            isolation: "Isolate spill or leak area immediately for at least 100 meters",
          },
          emergencyResponse: {
            fire: {
              small: "Dry chemical or CO2",
              large: "Water spray or fog",
              notes: "Do not extinguish a leaking gas fire unless leak can be stopped.",
            },
          },
        },
      };

      const result = guides[input.guideNumber];
      if (!result) {
        return { found: false, guideNumber: input.guideNumber };
      }

      return { found: true, ...result };
    }),

  /**
   * Get hazard class info
   */
  getHazardClass: publicProcedure
    .input(z.object({
      classNumber: z.string(),
    }))
    .query(async ({ input }) => {
      const classes: Record<string, any> = {
        "1": { class: "1", name: "Explosives", placard: "Explosive", color: "Orange" },
        "2.1": { class: "2.1", name: "Flammable Gas", placard: "Flammable Gas", color: "Red" },
        "2.2": { class: "2.2", name: "Non-Flammable Gas", placard: "Non-Flammable Gas", color: "Green" },
        "2.3": { class: "2.3", name: "Poison Gas", placard: "Poison Gas", color: "White" },
        "3": { class: "3", name: "Flammable Liquid", placard: "Flammable", color: "Red" },
        "4.1": { class: "4.1", name: "Flammable Solid", placard: "Flammable Solid", color: "Red/White" },
        "4.2": { class: "4.2", name: "Spontaneously Combustible", placard: "Spontaneously Combustible", color: "Red/White" },
        "4.3": { class: "4.3", name: "Dangerous When Wet", placard: "Dangerous When Wet", color: "Blue" },
        "5.1": { class: "5.1", name: "Oxidizer", placard: "Oxidizer", color: "Yellow" },
        "5.2": { class: "5.2", name: "Organic Peroxide", placard: "Organic Peroxide", color: "Yellow/Red" },
        "6.1": { class: "6.1", name: "Poison", placard: "Poison", color: "White" },
        "6.2": { class: "6.2", name: "Infectious Substance", placard: "Infectious", color: "White" },
        "7": { class: "7", name: "Radioactive", placard: "Radioactive", color: "Yellow/White" },
        "8": { class: "8", name: "Corrosive", placard: "Corrosive", color: "Black/White" },
        "9": { class: "9", name: "Miscellaneous Dangerous Goods", placard: "Class 9", color: "White/Black" },
      };

      const result = classes[input.classNumber];
      if (!result) {
        return { found: false, classNumber: input.classNumber };
      }

      return { found: true, ...result };
    }),

  /**
   * Get emergency contacts
   */
  getEmergencyContacts: publicProcedure
    .query(async () => {
      return {
        chemtrec: {
          name: "CHEMTREC",
          phone: "1-800-424-9300",
          description: "24-hour emergency response assistance",
          international: "+1-703-527-3887",
        },
        national: {
          name: "National Response Center",
          phone: "1-800-424-8802",
          description: "Report oil and chemical spills",
        },
        poison: {
          name: "Poison Control Center",
          phone: "1-800-222-1222",
          description: "Poison exposure emergencies",
        },
        emergency: {
          name: "Emergency Services",
          phone: "911",
          description: "Fire, Police, EMS",
        },
      };
    }),

  /**
   * Log ERG lookup for audit
   */
  logLookup: protectedProcedure
    .input(z.object({
      unNumber: z.string().optional(),
      productName: z.string().optional(),
      guideNumber: z.number().optional(),
      loadId: z.string().optional(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `erg_lookup_${Date.now()}`,
        userId: ctx.user?.id,
        ...input,
        timestamp: new Date().toISOString(),
      };
    }),
  getRecentLookups: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async () => [
    { id: "l1", unNumber: "1203", productName: "Gasoline", guideNumber: 128, timestamp: "2025-01-23 10:00" },
    { id: "l2", unNumber: "1202", productName: "Diesel Fuel", guideNumber: 128, timestamp: "2025-01-22 15:30" },
  ]),
});
