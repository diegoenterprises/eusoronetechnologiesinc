/**
 * ERG ROUTER
 * tRPC procedures for ERG 2020 Emergency Response Guidebook
 * Powered by comprehensive government data: 1,980 materials, 272 TIH entries
 * Source: U.S. DOT ERG 2020 Official XLS/XLSX
 */

import { z } from "zod";
import { auditedProtectedProcedure as protectedProcedure, router } from "../_core/trpc";
import {
  searchMaterials,
  getGuide,
  getFullERGInfo,
  getMetadata as getERGMetadata,
  EMERGENCY_CONTACTS,
} from "../_core/ergDatabaseDB";

const HAZARD_CLASS_INFO: Record<string, { name: string; placard: string; color: string }> = {
  "1": { name: "Explosives", placard: "Explosive", color: "Orange" },
  "2.1": { name: "Flammable Gas", placard: "Flammable Gas", color: "Red" },
  "2.2": { name: "Non-Flammable Gas", placard: "Non-Flammable Gas", color: "Green" },
  "2.3": { name: "Poison Gas", placard: "Poison Gas", color: "White" },
  "3": { name: "Flammable Liquid", placard: "Flammable", color: "Red" },
  "4.1": { name: "Flammable Solid", placard: "Flammable Solid", color: "Red/White" },
  "4.2": { name: "Spontaneously Combustible", placard: "Spontaneously Combustible", color: "Red/White" },
  "4.3": { name: "Dangerous When Wet", placard: "Dangerous When Wet", color: "Blue" },
  "5.1": { name: "Oxidizer", placard: "Oxidizer", color: "Yellow" },
  "5.2": { name: "Organic Peroxide", placard: "Organic Peroxide", color: "Yellow/Red" },
  "6.1": { name: "Poison", placard: "Poison", color: "White" },
  "6.2": { name: "Infectious Substance", placard: "Infectious", color: "White" },
  "7": { name: "Radioactive", placard: "Radioactive", color: "Yellow/White" },
  "8": { name: "Corrosive", placard: "Corrosive", color: "Black/White" },
  "9": { name: "Miscellaneous Dangerous Goods", placard: "Class 9", color: "White/Black" },
};

export const ergRouter = router({
  /**
   * Real-time search: searches by name, UN number, or alternate names
   * Used by LoadCreationWizard for auto-suggest as user types
   */
  search: protectedProcedure
    .input(z.object({ query: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      const q = input.query.trim();
      if (!q || q.length < 2) return { results: [], count: 0 };
      const results = await searchMaterials(q, input.limit || 10);
      return {
        results: results.map(m => ({
          unNumber: m.unNumber,
          name: m.name,
          guide: m.guide,
          hazardClass: m.hazardClass,
          isTIH: m.isTIH,
          isWR: m.isWR,
          alternateNames: m.alternateNames,
          placardName: HAZARD_CLASS_INFO[m.hazardClass]?.placard || "Unknown",
        })),
        count: results.length,
      };
    }),

  /**
   * Search ERG by UN number -- full info with guide + protective distances
   */
  searchByUN: protectedProcedure
    .input(z.object({ unNumber: z.string() }))
    .query(async ({ input }) => {
      const info = await getFullERGInfo(input.unNumber);
      if (!info || !info.material) return { found: false, unNumber: input.unNumber };
      const m = info.material;
      const classInfo = HAZARD_CLASS_INFO[m.hazardClass];
      return {
        found: true,
        unNumber: m.unNumber,
        name: m.name,
        guideNumber: m.guide,
        hazardClass: m.hazardClass,
        placard: classInfo?.placard || "Unknown",
        isTIH: m.isTIH,
        isWR: m.isWR,
        alternateNames: m.alternateNames,
        guide: info.guide ? {
          title: info.guide.title,
          potentialHazards: info.guide.potentialHazards,
          publicSafety: info.guide.publicSafety,
          emergencyResponse: info.guide.emergencyResponse,
        } : null,
        protectiveDistance: info.protectiveDistance,
      };
    }),

  /**
   * Search ERG by product name
   */
  searchByName: protectedProcedure
    .input(z.object({ productName: z.string() }))
    .query(async ({ input }) => {
      const results = await searchMaterials(input.productName, 20);
      return {
        query: input.productName,
        results: results.map(m => ({
          unNumber: m.unNumber,
          name: m.name,
          guideNumber: m.guide,
          hazardClass: m.hazardClass,
          isTIH: m.isTIH,
          isWR: m.isWR,
        })),
        count: results.length,
      };
    }),

  /**
   * Get ERG guide page
   */
  getGuidePage: protectedProcedure
    .input(z.object({ guideNumber: z.number() }))
    .query(async ({ input }) => {
      const guide = await getGuide(input.guideNumber);
      if (!guide) return { found: false, guideNumber: input.guideNumber };
      return { found: true, ...guide };
    }),

  /**
   * Get hazard class info
   */
  getHazardClass: protectedProcedure
    .input(z.object({ classNumber: z.string() }))
    .query(async ({ input }) => {
      const result = HAZARD_CLASS_INFO[input.classNumber];
      if (!result) return { found: false, classNumber: input.classNumber };
      return { found: true, class: input.classNumber, ...result };
    }),

  /**
   * Get emergency contacts
   */
  getEmergencyContacts: protectedProcedure
    .query(async () => ({
      chemtrec: { name: "CHEMTREC", phone: "1-800-424-9300", description: "24-hour emergency response assistance", international: "+1-703-527-3887" },
      national: { name: "National Response Center", phone: "1-800-424-8802", description: "Report oil and chemical spills" },
      poison: { name: "Poison Control Center", phone: "1-800-222-1222", description: "Poison exposure emergencies" },
      emergency: { name: "Emergency Services", phone: "911", description: "Fire, Police, EMS" },
    })),

  /**
   * Get ERG database metadata
   */
  getMetadata: protectedProcedure
    .query(async () => await getERGMetadata()),

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
    .mutation(async ({ ctx, input }) => ({
      id: `erg_lookup_${Date.now()}`,
      userId: ctx.user?.id,
      ...input,
      timestamp: new Date().toISOString(),
    })),

  getRecentLookups: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async () => []),
});
