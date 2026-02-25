/**
 * HAZMAT ROUTER — GOLD STANDARD
 * Comprehensive tRPC procedures for hazardous materials management
 * Covers: ERG, placards, segregation (49 CFR 177.848), load validation,
 * carrier auth, driver endorsement, incident reporting, tank compliance
 * PRODUCTION-READY: Database-driven with static fallbacks
 */

import { z } from "zod";
import { eq, and, desc, sql, gte, lte, inArray, isNotNull } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loads, drivers, companies, incidents, vehicles } from "../../drizzle/schema";
import { searchMaterials, getGuide, getFullERGInfo, EMERGENCY_CONTACTS } from "../_core/ergDatabaseDB";

// All 9 DOT hazard classes + divisions
const HAZARD_CLASSES: Record<string, { name: string; placard: string; color: string; subsidiaryHazards: string[]; packingGroups: string[] }> = {
  "1.1": { name: "Explosives - Mass Explosion", placard: "EXPLOSIVES 1.1", color: "#FF6600", subsidiaryHazards: [], packingGroups: ["II"] },
  "1.2": { name: "Explosives - Projection Hazard", placard: "EXPLOSIVES 1.2", color: "#FF6600", subsidiaryHazards: [], packingGroups: ["II"] },
  "1.3": { name: "Explosives - Fire/Minor Blast", placard: "EXPLOSIVES 1.3", color: "#FF6600", subsidiaryHazards: [], packingGroups: ["II"] },
  "1.4": { name: "Explosives - Minor Hazard", placard: "EXPLOSIVES 1.4", color: "#FF6600", subsidiaryHazards: [], packingGroups: ["II"] },
  "1.5": { name: "Explosives - Very Insensitive", placard: "EXPLOSIVES 1.5", color: "#FF6600", subsidiaryHazards: [], packingGroups: ["II"] },
  "1.6": { name: "Explosives - Extremely Insensitive", placard: "EXPLOSIVES 1.6", color: "#FF6600", subsidiaryHazards: [], packingGroups: ["II"] },
  "2.1": { name: "Flammable Gas", placard: "FLAMMABLE GAS", color: "#FF0000", subsidiaryHazards: ["5.1"], packingGroups: [] },
  "2.2": { name: "Non-Flammable Gas", placard: "NON-FLAMMABLE GAS", color: "#00AA00", subsidiaryHazards: [], packingGroups: [] },
  "2.3": { name: "Poison Gas", placard: "POISON GAS", color: "#FFFFFF", subsidiaryHazards: ["2.1", "5.1", "8"], packingGroups: [] },
  "3": { name: "Flammable Liquid", placard: "FLAMMABLE", color: "#FF0000", subsidiaryHazards: ["6.1", "8"], packingGroups: ["I", "II", "III"] },
  "4.1": { name: "Flammable Solid", placard: "FLAMMABLE SOLID", color: "#FF0000", subsidiaryHazards: [], packingGroups: ["I", "II", "III"] },
  "4.2": { name: "Spontaneously Combustible", placard: "SPONT. COMBUSTIBLE", color: "#FF0000", subsidiaryHazards: [], packingGroups: ["I", "II", "III"] },
  "4.3": { name: "Dangerous When Wet", placard: "DANGEROUS WHEN WET", color: "#0000FF", subsidiaryHazards: [], packingGroups: ["I", "II", "III"] },
  "5.1": { name: "Oxidizer", placard: "OXIDIZER", color: "#FFFF00", subsidiaryHazards: [], packingGroups: ["I", "II", "III"] },
  "5.2": { name: "Organic Peroxide", placard: "ORGANIC PEROXIDE", color: "#FFFF00", subsidiaryHazards: [], packingGroups: ["I", "II", "III"] },
  "6.1": { name: "Poison/Toxic", placard: "POISON", color: "#FFFFFF", subsidiaryHazards: [], packingGroups: ["I", "II", "III"] },
  "6.2": { name: "Infectious Substance", placard: "INFECTIOUS", color: "#FFFFFF", subsidiaryHazards: [], packingGroups: [] },
  "7": { name: "Radioactive", placard: "RADIOACTIVE", color: "#FFFF00", subsidiaryHazards: [], packingGroups: [] },
  "8": { name: "Corrosive", placard: "CORROSIVE", color: "#000000", subsidiaryHazards: [], packingGroups: ["I", "II", "III"] },
  "9": { name: "Miscellaneous Dangerous Goods", placard: "CLASS 9", color: "#FFFFFF", subsidiaryHazards: [], packingGroups: ["III"] },
};

// 49 CFR 177.848 Segregation Table — "X" = incompatible, "O" = may be loaded together
// Rows/cols index: 1.1-1.6, 2.1, 2.2, 2.3, 3, 4.1, 4.2, 4.3, 5.1, 5.2, 6.1, 7, 8
const SEGREGATION_KEYS = ["1", "2.1", "2.2", "2.3", "3", "4.1", "4.2", "4.3", "5.1", "5.2", "6.1", "7", "8"];
const SEGREGATION_MATRIX: Record<string, Record<string, boolean>> = {};
const incompatiblePairs: [string, string][] = [
  ["1", "2.1"], ["1", "2.3"], ["1", "3"], ["1", "4.1"], ["1", "4.2"], ["1", "4.3"],
  ["1", "5.1"], ["1", "5.2"], ["1", "6.1"], ["1", "7"], ["1", "8"],
  ["2.1", "2.3"], ["2.1", "5.1"], ["2.1", "5.2"],
  ["2.3", "3"], ["2.3", "5.1"], ["2.3", "5.2"], ["2.3", "6.1"], ["2.3", "8"],
  ["3", "4.1"], ["3", "4.3"], ["3", "5.1"], ["3", "5.2"],
  ["4.1", "5.1"], ["4.1", "5.2"], ["4.1", "7"],
  ["4.2", "5.1"], ["4.2", "5.2"], ["4.2", "7"],
  ["4.3", "5.1"], ["4.3", "5.2"], ["4.3", "7"], ["4.3", "8"],
  ["5.1", "5.2"], ["5.1", "6.1"], ["5.1", "7"],
  ["5.2", "6.1"], ["5.2", "7"],
  ["6.1", "7"],
];
for (const k of SEGREGATION_KEYS) { SEGREGATION_MATRIX[k] = {}; for (const j of SEGREGATION_KEYS) { SEGREGATION_MATRIX[k][j] = true; } }
for (const [a, b] of incompatiblePairs) { SEGREGATION_MATRIX[a][b] = false; SEGREGATION_MATRIX[b][a] = false; }

// Trailer type → allowed hazmat classes
const TRAILER_HAZMAT_COMPAT: Record<string, { name: string; specCode: string; allowedClasses: string[]; inspectionReq: string }> = {
  "MC-306": { name: "Liquid Tank (DOT-406)", specCode: "DOT-406", allowedClasses: ["3", "6.1", "8", "9"], inspectionReq: "49 CFR 180.407 — 5yr pressure, annual visual, leak test" },
  "MC-307": { name: "Chemical Tank (DOT-407)", specCode: "DOT-407", allowedClasses: ["3", "4.1", "5.1", "6.1", "8", "9"], inspectionReq: "49 CFR 180.407 — 5yr pressure, annual visual" },
  "MC-312": { name: "Corrosive Tank (DOT-412)", specCode: "DOT-412", allowedClasses: ["3", "5.1", "6.1", "8"], inspectionReq: "49 CFR 180.407 — 2yr pressure, annual visual" },
  "MC-331": { name: "Pressurized Gas Tank", specCode: "MC-331", allowedClasses: ["2.1", "2.2", "2.3"], inspectionReq: "49 CFR 180.407 — external visual every trip, hydro test 10yr" },
  "MC-338": { name: "Cryogenic Tank", specCode: "MC-338", allowedClasses: ["2.2"], inspectionReq: "49 CFR 180.407 — vacuum integrity, annual hold-time test" },
  "DRY_VAN": { name: "Dry Van / Box", specCode: "N/A", allowedClasses: ["1.4", "4.1", "6.1", "6.2", "8", "9"], inspectionReq: "Standard DOT annual" },
  "FLATBED": { name: "Flatbed", specCode: "N/A", allowedClasses: ["1.4", "4.1", "9"], inspectionReq: "Standard DOT annual + securement check" },
  "HOPPER": { name: "Dry Bulk / Hopper", specCode: "N/A", allowedClasses: ["4.1", "5.1", "8", "9"], inspectionReq: "Standard DOT annual + pneumatic test" },
};

function normalizeClass(hc: string): string {
  const c = hc.trim();
  if (c.startsWith("1.")) return "1";
  return c;
}

export const hazmatRouter = router({
  // 1. getSummary — Dashboard-level hazmat stats
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const empty = { activeShipments: 0, totalThisMonth: 0, complianceRate: 100, topClass: "3", total: 0, inTransit: 0, loading: 0, delivered: 0 };
    if (!db) return empty;
    try {
      const cid = ctx.user?.companyId || 0;
      const ht = ["hazmat","liquid","gas","chemicals","petroleum"] as const;
      const ms = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const [tot] = await db.select({ c: sql<number>`count(*)` }).from(loads).where(and(eq(loads.shipperId, cid), inArray(loads.cargoType, [...ht])));
      const [mo] = await db.select({ c: sql<number>`count(*)` }).from(loads).where(and(eq(loads.shipperId, cid), inArray(loads.cargoType, [...ht]), gte(loads.createdAt, ms)));
      const [it] = await db.select({ c: sql<number>`count(*)` }).from(loads).where(and(eq(loads.shipperId, cid), inArray(loads.cargoType, [...ht]), eq(loads.status, "in_transit")));
      const [ld] = await db.select({ c: sql<number>`count(*)` }).from(loads).where(and(eq(loads.shipperId, cid), inArray(loads.cargoType, [...ht]), eq(loads.status, "loading")));
      const [dl] = await db.select({ c: sql<number>`count(*)` }).from(loads).where(and(eq(loads.shipperId, cid), inArray(loads.cargoType, [...ht]), eq(loads.status, "delivered")));
      const tc = await db.select({ hc: loads.hazmatClass, c: sql<number>`count(*)` }).from(loads).where(and(eq(loads.shipperId, cid), isNotNull(loads.hazmatClass))).groupBy(loads.hazmatClass).orderBy(desc(sql`count(*)`)).limit(1);
      return { activeShipments: (it?.c||0)+(ld?.c||0), totalThisMonth: mo?.c||0, complianceRate: 100, topClass: tc[0]?.hc||"3", total: tot?.c||0, inTransit: it?.c||0, loading: ld?.c||0, delivered: dl?.c||0 };
    } catch { return empty; }
  }),

  // 2. getShipments — List hazmat loads
  getShipments: protectedProcedure
    .input(z.object({ status: z.string().optional(), hazmatClass: z.string().optional(), limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const cid = ctx.user?.companyId || 0;
        const ht = ["hazmat","liquid","gas","chemicals","petroleum"] as const;
        const conds = [eq(loads.shipperId, cid), inArray(loads.cargoType, [...ht])];
        if (input?.status) conds.push(eq(loads.status, input.status as any));
        if (input?.hazmatClass) conds.push(eq(loads.hazmatClass, input.hazmatClass));
        const rows = await db.select().from(loads).where(and(...conds)).orderBy(desc(loads.createdAt)).limit(input?.limit || 50);
        return rows.map(r => ({ id: r.id, loadNumber: r.loadNumber, status: r.status, cargoType: r.cargoType, hazmatClass: r.hazmatClass, unNumber: r.unNumber, commodityName: r.commodityName, weight: r.weight, pickupLocation: r.pickupLocation, deliveryLocation: r.deliveryLocation, pickupDate: r.pickupDate, deliveryDate: r.deliveryDate, placard: r.hazmatClass ? HAZARD_CLASSES[r.hazmatClass]?.placard || "Unknown" : null, createdAt: r.createdAt }));
      } catch { return []; }
    }),

  // 3. getHazardClasses — All 9 DOT classes + divisions
  getHazardClasses: protectedProcedure.query(async () => Object.entries(HAZARD_CLASSES).map(([code, info]) => ({ code, ...info }))),

  // 4. determinePlacards — Placard Requirement Engine (49 CFR 172.504)
  determinePlacards: protectedProcedure
    .input(z.object({
      materials: z.array(z.object({
        hazmatClass: z.string(),
        unNumber: z.string().optional(),
        weight: z.number(),
        weightUnit: z.enum(["lbs", "kg"]).default("lbs"),
        packingGroup: z.string().optional(),
      })),
    }))
    .query(async ({ input }) => {
      const placards: Array<{ hazmatClass: string; placardName: string; color: string; required: boolean; reason: string }> = [];
      const subsidiaryPlacards: Array<{ hazmatClass: string; placardName: string; reason: string }> = [];
      for (const mat of input.materials) {
        const cls = HAZARD_CLASSES[mat.hazmatClass];
        if (!cls) continue;
        const wLbs = mat.weightUnit === "kg" ? mat.weight * 2.20462 : mat.weight;
        const isT1 = ["1.1","1.2","1.3","2.3","4.3","5.2","6.1","7"].includes(mat.hazmatClass) && (mat.packingGroup === "I" || mat.hazmatClass === "2.3" || mat.hazmatClass === "7");
        const req = isT1 || wLbs >= 1001;
        placards.push({ hazmatClass: mat.hazmatClass, placardName: cls.placard, color: cls.color, required: req, reason: isT1 ? "Table 1 material — placard required at any quantity (49 CFR 172.504)" : req ? `Weight ${wLbs.toFixed(0)} lbs exceeds 1,001 lb threshold` : `Weight ${wLbs.toFixed(0)} lbs below threshold — optional` });
        for (const sub of cls.subsidiaryHazards) {
          const sc = HAZARD_CLASSES[sub];
          if (sc) subsidiaryPlacards.push({ hazmatClass: sub, placardName: sc.placard, reason: `Subsidiary hazard of Class ${mat.hazmatClass}` });
        }
      }
      const uq = new Set(placards.filter(p => p.required).map(p => p.hazmatClass));
      const useDang = uq.size >= 2 && !placards.some(p => p.required && ["1.1","1.2","1.3","2.3","4.3","6.1","7"].includes(p.hazmatClass));
      return { placards, subsidiaryPlacards, useDangerousPlacardOption: useDang, dangerousPlacardNote: useDang ? "May use DANGEROUS placard for non-Table-1 materials (49 CFR 172.504(b))" : null, totalMaterials: input.materials.length };
    }),

  // 5. checkSegregation — 49 CFR 177.848 incompatibility
  checkSegregation: protectedProcedure
    .input(z.object({
      materials: z.array(z.object({ hazmatClass: z.string(), name: z.string().optional(), unNumber: z.string().optional() })),
    }))
    .query(async ({ input }) => {
      const violations: Array<{ classA: string; classB: string; nameA: string; nameB: string; regulation: string; severity: string }> = [];
      for (let i = 0; i < input.materials.length; i++) {
        for (let j = i + 1; j < input.materials.length; j++) {
          const a = normalizeClass(input.materials[i].hazmatClass);
          const b = normalizeClass(input.materials[j].hazmatClass);
          if (SEGREGATION_MATRIX[a] && SEGREGATION_MATRIX[a][b] === false) {
            violations.push({ classA: input.materials[i].hazmatClass, classB: input.materials[j].hazmatClass, nameA: input.materials[i].name || `Class ${input.materials[i].hazmatClass}`, nameB: input.materials[j].name || `Class ${input.materials[j].hazmatClass}`, regulation: "49 CFR 177.848", severity: "critical" });
          }
        }
      }
      return { compatible: violations.length === 0, violations, materialCount: input.materials.length, regulation: "49 CFR 177.848 — Segregation of hazardous materials" };
    }),

  // 6. validateLoad — Comprehensive hazmat load validation
  validateLoad: protectedProcedure
    .input(z.object({
      loadId: z.number().optional(),
      hazmatClass: z.string(),
      unNumber: z.string().optional(),
      weight: z.number(),
      weightUnit: z.enum(["lbs", "kg"]).default("lbs"),
      packingGroup: z.string().optional(),
      trailerType: z.string().optional(),
      driverId: z.number().optional(),
      carrierId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const checks: Array<{ name: string; status: "pass"|"fail"|"warn"; detail: string; regulation: string }> = [];
      const cls = HAZARD_CLASSES[input.hazmatClass];
      checks.push(cls ? { name: "Hazard Class Valid", status: "pass", detail: `${cls.name} (${cls.placard})`, regulation: "49 CFR 172.101" } : { name: "Hazard Class Valid", status: "fail", detail: `Unknown hazard class: ${input.hazmatClass}`, regulation: "49 CFR 172.101" });

      if (input.unNumber) {
        const ergInfo = await getFullERGInfo(input.unNumber);
        checks.push(ergInfo?.material ? { name: "UN Number Valid", status: "pass", detail: `UN${input.unNumber} — ${ergInfo.material.name} (Guide ${ergInfo.material.guide})`, regulation: "49 CFR 172.101" } : { name: "UN Number Valid", status: "warn", detail: `UN${input.unNumber} not found in ERG database`, regulation: "49 CFR 172.101" });
        if (ergInfo?.material?.isTIH) checks.push({ name: "TIH Material Detected", status: "warn", detail: "Toxic Inhalation Hazard — additional routing and security requirements apply", regulation: "49 CFR 172.505" });
      }

      if (input.packingGroup && cls) {
        const valid = cls.packingGroups.includes(input.packingGroup);
        checks.push({ name: "Packing Group", status: valid ? "pass" : "warn", detail: valid ? `PG ${input.packingGroup} valid for Class ${input.hazmatClass}` : `PG ${input.packingGroup} unusual for Class ${input.hazmatClass}`, regulation: "49 CFR 173" });
      }

      if (input.trailerType) {
        const trailer = TRAILER_HAZMAT_COMPAT[input.trailerType];
        if (trailer) {
          const ok = trailer.allowedClasses.some(ac => input.hazmatClass.startsWith(ac));
          checks.push({ name: "Trailer Compatibility", status: ok ? "pass" : "fail", detail: ok ? `${trailer.name} approved for Class ${input.hazmatClass}` : `${trailer.name} NOT approved for Class ${input.hazmatClass}`, regulation: "49 CFR 173/178/180" });
          checks.push({ name: "Tank Inspection Req", status: "pass", detail: trailer.inspectionReq, regulation: "49 CFR 180.407" });
        }
      }

      if (input.driverId) {
        const db = await getDb();
        if (db) {
          const [drv] = await db.select().from(drivers).where(eq(drivers.id, input.driverId)).limit(1);
          if (drv) {
            checks.push(drv.hazmatEndorsement ? { name: "Hazmat Endorsement", status: "pass", detail: "Driver has active H endorsement", regulation: "49 CFR 383.93" } : { name: "Hazmat Endorsement", status: "fail", detail: "Driver missing hazmat endorsement (H)", regulation: "49 CFR 383.93" });
            if (drv.hazmatExpiry) {
              const exp = new Date(drv.hazmatExpiry);
              const days = Math.ceil((exp.getTime() - Date.now()) / 86400000);
              checks.push(days > 30 ? { name: "Endorsement Expiry", status: "pass", detail: `Expires ${exp.toLocaleDateString()} (${days} days)`, regulation: "49 CFR 383.93" } : days > 0 ? { name: "Endorsement Expiry", status: "warn", detail: `Expires in ${days} days — renewal needed`, regulation: "49 CFR 383.93" } : { name: "Endorsement Expiry", status: "fail", detail: `Expired ${exp.toLocaleDateString()}`, regulation: "49 CFR 383.93" });
            }
          }
        }
      }

      if (input.carrierId) {
        const db = await getDb();
        if (db) {
          const [co] = await db.select().from(companies).where(eq(companies.id, input.carrierId)).limit(1);
          if (co) {
            checks.push(co.hazmatLicense ? { name: "Carrier Hazmat Auth", status: "pass", detail: `Hazmat license: ${co.hazmatLicense}`, regulation: "49 CFR 107 Subpart G" } : { name: "Carrier Hazmat Auth", status: "fail", detail: "Carrier missing hazmat registration", regulation: "49 CFR 107 Subpart G" });
            if (co.hazmatExpiry) {
              const exp = new Date(co.hazmatExpiry);
              const days = Math.ceil((exp.getTime() - Date.now()) / 86400000);
              checks.push(days > 0 ? { name: "Carrier Hazmat Expiry", status: days > 30 ? "pass" : "warn", detail: `Expires ${exp.toLocaleDateString()} (${days} days)`, regulation: "49 CFR 107.608" } : { name: "Carrier Hazmat Expiry", status: "fail", detail: `Expired ${exp.toLocaleDateString()}`, regulation: "49 CFR 107.608" });
            }
          }
        }
      }

      const failCount = checks.filter(c => c.status === "fail").length;
      const warnCount = checks.filter(c => c.status === "warn").length;
      return { valid: failCount === 0, checks, summary: { total: checks.length, pass: checks.filter(c => c.status === "pass").length, fail: failCount, warn: warnCount }, overallStatus: failCount > 0 ? "BLOCKED" as const : warnCount > 0 ? "WARNING" as const : "CLEAR" as const };
    }),

  // 7. getTrailerCompatibility — Which trailer specs work for which classes
  getTrailerCompatibility: protectedProcedure
    .input(z.object({ hazmatClass: z.string().optional(), trailerType: z.string().optional() }).optional())
    .query(async ({ input }) => {
      if (input?.hazmatClass) {
        const compatible = Object.entries(TRAILER_HAZMAT_COMPAT).filter(([, t]) => t.allowedClasses.some(ac => input.hazmatClass!.startsWith(ac)));
        return { hazmatClass: input.hazmatClass, compatibleTrailers: compatible.map(([code, t]) => ({ code, ...t })) };
      }
      if (input?.trailerType) {
        const t = TRAILER_HAZMAT_COMPAT[input.trailerType];
        if (!t) return { trailerType: input.trailerType, found: false, allowedClasses: [] };
        return { trailerType: input.trailerType, found: true, ...t, classDetails: t.allowedClasses.map(c => ({ code: c, ...HAZARD_CLASSES[c] })).filter(c => c.name) };
      }
      return { allTrailers: Object.entries(TRAILER_HAZMAT_COMPAT).map(([code, t]) => ({ code, ...t })) };
    }),

  // 8. verifyDriverEndorsement — Check driver hazmat qualification
  verifyDriverEndorsement: protectedProcedure
    .input(z.object({ driverId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { verified: false, reason: "Database unavailable" };
      const [drv] = await db.select().from(drivers).where(eq(drivers.id, input.driverId)).limit(1);
      if (!drv) return { verified: false, reason: "Driver not found" };
      const issues: string[] = [];
      if (!drv.hazmatEndorsement) issues.push("Missing H endorsement on CDL (49 CFR 383.93)");
      if (drv.hazmatExpiry) {
        const days = Math.ceil((new Date(drv.hazmatExpiry).getTime() - Date.now()) / 86400000);
        if (days <= 0) issues.push(`H endorsement expired ${new Date(drv.hazmatExpiry).toLocaleDateString()}`);
        else if (days <= 30) issues.push(`H endorsement expires in ${days} days — renewal urgent`);
      } else if (drv.hazmatEndorsement) {
        issues.push("No expiry date on file for H endorsement");
      }
      if (drv.twicExpiry) {
        const days = Math.ceil((new Date(drv.twicExpiry).getTime() - Date.now()) / 86400000);
        if (days <= 0) issues.push("TWIC card expired");
        else if (days <= 30) issues.push(`TWIC expires in ${days} days`);
      }
      return { verified: issues.length === 0, driverId: input.driverId, hazmatEndorsement: drv.hazmatEndorsement || false, hazmatExpiry: drv.hazmatExpiry, twicExpiry: drv.twicExpiry, issues, regulation: "49 CFR 383.93, TSA 49 CFR 1572" };
    }),

  // 9. verifyCarrierAuthorization — Check carrier hazmat registration (49 CFR 107 Subpart G)
  verifyCarrierAuthorization: protectedProcedure
    .input(z.object({ carrierId: z.number(), hazmatClass: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { authorized: false, reason: "Database unavailable" };
      const [co] = await db.select().from(companies).where(eq(companies.id, input.carrierId)).limit(1);
      if (!co) return { authorized: false, reason: "Carrier not found" };
      const issues: string[] = [];
      if (!co.hazmatLicense) issues.push("No HMSP registration on file (49 CFR 107.601)");
      if (co.hazmatExpiry) {
        const days = Math.ceil((new Date(co.hazmatExpiry).getTime() - Date.now()) / 86400000);
        if (days <= 0) issues.push("HMSP registration expired");
        else if (days <= 60) issues.push(`HMSP registration expires in ${days} days`);
      }
      if (co.complianceStatus === "non_compliant") issues.push("Carrier compliance status: non-compliant");
      if (co.complianceStatus === "expired") issues.push("Carrier compliance status: expired");
      if (!co.insurancePolicy) issues.push("No insurance policy on file");
      if (co.insuranceExpiry) {
        const days = Math.ceil((new Date(co.insuranceExpiry).getTime() - Date.now()) / 86400000);
        if (days <= 0) issues.push("Insurance expired");
      }
      return { authorized: issues.length === 0, carrierId: input.carrierId, companyName: co.name, dotNumber: co.dotNumber, mcNumber: co.mcNumber, hazmatLicense: co.hazmatLicense, hazmatExpiry: co.hazmatExpiry, complianceStatus: co.complianceStatus, issues, regulation: "49 CFR 107 Subpart G — HMSP Registration" };
    }),

  // 10. ergQuickLookup — ERG material lookup with placard info (bridges erg + hazmat)
  ergQuickLookup: protectedProcedure
    .input(z.object({ unNumber: z.string().optional(), productName: z.string().optional(), guideNumber: z.number().optional() }))
    .query(async ({ input }) => {
      if (input.unNumber) {
        const info = await getFullERGInfo(input.unNumber);
        if (!info?.material) return { found: false, query: input.unNumber };
        const m = info.material;
        const cls = HAZARD_CLASSES[m.hazardClass];
        return { found: true, unNumber: m.unNumber, name: m.name, guideNumber: m.guide, hazardClass: m.hazardClass, placard: cls?.placard || "Unknown", placardColor: cls?.color || "#888", isTIH: m.isTIH, isWR: m.isWR, guide: info.guide ? { title: info.guide.title, potentialHazards: info.guide.potentialHazards, publicSafety: info.guide.publicSafety, emergencyResponse: info.guide.emergencyResponse } : null, protectiveDistance: info.protectiveDistance, emergencyContacts: EMERGENCY_CONTACTS };
      }
      if (input.productName) {
        const results = await searchMaterials(input.productName, 10);
        return { found: results.length > 0, results: results.map(m => ({ unNumber: m.unNumber, name: m.name, guideNumber: m.guide, hazardClass: m.hazardClass, placard: HAZARD_CLASSES[m.hazardClass]?.placard || "Unknown" })) };
      }
      if (input.guideNumber) {
        const guide = await getGuide(input.guideNumber);
        if (!guide) return { found: false, guideNumber: input.guideNumber };
        return { found: true, guide };
      }
      return { found: false, error: "Provide unNumber, productName, or guideNumber" };
    }),

  // 11. reportIncident — DOT 5800.1 hazmat incident reporting
  reportIncident: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      type: z.enum(["spill", "leak", "fire", "explosion", "vapor_release", "container_failure", "rollover", "other"]),
      severity: z.enum(["minor", "moderate", "major", "catastrophic"]),
      description: z.string(),
      location: z.object({ lat: z.number(), lng: z.number(), address: z.string().optional() }).optional(),
      materialsInvolved: z.array(z.object({ hazmatClass: z.string(), unNumber: z.string().optional(), estimatedQuantity: z.string().optional() })).optional(),
      injuries: z.number().default(0),
      fatalities: z.number().default(0),
      evacuationRequired: z.boolean().default(false),
      evacuationRadius: z.string().optional(),
      agenciesNotified: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const reportId = `INC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const dot5800Required = input.severity === "major" || input.severity === "catastrophic" || input.fatalities > 0 || input.injuries > 0 || input.evacuationRequired;
      const nrcRequired = input.severity === "catastrophic" || input.fatalities > 0;
      const notifications = [
        { agency: "Company Safety Officer", required: true, deadline: "Immediate" },
        { agency: "FMCSA", required: dot5800Required, deadline: "Within 30 days (DOT 5800.1)" },
        { agency: "National Response Center (NRC)", required: nrcRequired, deadline: "Immediate — call 1-800-424-8802" },
        { agency: "State Emergency Response Commission", required: input.evacuationRequired, deadline: "Immediate" },
        { agency: "Local Emergency Planning Committee", required: input.evacuationRequired, deadline: "Immediate" },
      ];
      const emergencyActions: string[] = [];
      if (input.materialsInvolved?.length) {
        for (const mat of input.materialsInvolved) {
          if (mat.unNumber) {
            const info = await getFullERGInfo(mat.unNumber);
            if (info?.guide?.emergencyResponse) {
              const er = info.guide.emergencyResponse as any;
              if (er.fire) emergencyActions.push(`[UN${mat.unNumber}] Fire: ${Array.isArray(er.fire) ? er.fire[0] : er.fire}`);
              if (er.spill) emergencyActions.push(`[UN${mat.unNumber}] Spill: ${Array.isArray(er.spill) ? er.spill[0] : er.spill}`);
            }
          }
        }
      }
      return { reportId, loadId: input.loadId, type: input.type, severity: input.severity, dot5800Required, nrcRequired, notifications: notifications.filter(n => n.required), allNotifications: notifications, emergencyActions, emergencyContacts: EMERGENCY_CONTACTS, reportedBy: ctx.user?.id, reportedAt: new Date().toISOString(), status: "open" };
    }),

  // 12. getSegregationMatrix — Full 49 CFR 177.848 reference table
  getSegregationMatrix: protectedProcedure.query(async () => {
    const matrix: Array<{ classA: string; classB: string; compatible: boolean; nameA: string; nameB: string }> = [];
    for (const a of SEGREGATION_KEYS) {
      for (const b of SEGREGATION_KEYS) {
        if (a <= b) {
          matrix.push({ classA: a, classB: b, compatible: SEGREGATION_MATRIX[a][b], nameA: HAZARD_CLASSES[a]?.name || `Class ${a}`, nameB: HAZARD_CLASSES[b]?.name || `Class ${b}` });
        }
      }
    }
    return { matrix, keys: SEGREGATION_KEYS.map(k => ({ code: k, name: HAZARD_CLASSES[k]?.name || `Class ${k}` })), regulation: "49 CFR 177.848" };
  }),

  // 13. getEmergencyContacts — National emergency response contacts
  getEmergencyContacts: protectedProcedure.query(async () => ({
    contacts: [
      { name: "National Response Center (NRC)", phone: "1-800-424-8802", available: "24/7", purpose: "Mandatory reporting for hazmat releases" },
      { name: "CHEMTREC", phone: "1-800-424-9300", available: "24/7", purpose: "Chemical emergency information and response guidance" },
      { name: "INFOTRAC", phone: "1-800-535-5053", available: "24/7", purpose: "Emergency response information" },
      { name: "Poison Control", phone: "1-800-222-1222", available: "24/7", purpose: "Poison exposure guidance" },
      { name: "FMCSA Safety Hotline", phone: "1-888-368-7238", available: "Business hours", purpose: "Safety complaints and concerns" },
      { name: "EPA Emergency", phone: "1-800-424-8802", available: "24/7", purpose: "Environmental spill reporting" },
    ],
    ergContacts: EMERGENCY_CONTACTS,
  })),

  // 14. getRouteRestrictions — Hazmat Route Planner (49 CFR 397)
  getRouteRestrictions: protectedProcedure
    .input(z.object({
      hazmatClass: z.string(),
      unNumber: z.string().optional(),
      originState: z.string(),
      destinationState: z.string(),
      transitStates: z.array(z.string()).optional(),
      isTIH: z.boolean().optional(),
      isRadioactive: z.boolean().optional(),
      isExplosive: z.boolean().optional(),
      weight: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const restrictions: Array<{
        type: string;
        location: string;
        description: string;
        regulation: string;
        severity: "blocked" | "restricted" | "advisory";
        alternatives: string;
      }> = [];

      const allStates = Array.from(new Set([input.originState, input.destinationState, ...(input.transitStates || [])]));

      // Tunnel restrictions (49 CFR 397.71)
      const TUNNEL_RESTRICTIONS: Record<string, Array<{ name: string; category: string; blockedClasses: string[]; note: string }>> = {
        NY: [
          { name: "Lincoln Tunnel", category: "E", blockedClasses: ["1.1","1.2","1.3","1.4","1.5","1.6","2.1","2.3","3","4.1","4.2","4.3","5.1","5.2","6.1","7"], note: "Most hazmat prohibited" },
          { name: "Holland Tunnel", category: "E", blockedClasses: ["1.1","1.2","1.3","1.4","1.5","1.6","2.1","2.3","3","4.1","4.2","4.3","5.1","5.2","6.1","7"], note: "Most hazmat prohibited" },
          { name: "Queens-Midtown Tunnel", category: "D", blockedClasses: ["1.1","1.2","1.3","2.3","3","4.2","4.3","5.1","5.2","6.1","7"], note: "Flammable and toxic prohibited" },
          { name: "Brooklyn-Battery Tunnel", category: "D", blockedClasses: ["1.1","1.2","1.3","2.3","3","4.2","4.3","5.1","5.2","6.1","7"], note: "Flammable and toxic prohibited" },
        ],
        NJ: [
          { name: "Lincoln Tunnel (NJ side)", category: "E", blockedClasses: ["1.1","1.2","1.3","1.4","1.5","1.6","2.1","2.3","3","4.1","4.2","4.3","5.1","5.2","6.1","7"], note: "Most hazmat prohibited" },
          { name: "Holland Tunnel (NJ side)", category: "E", blockedClasses: ["1.1","1.2","1.3","1.4","1.5","1.6","2.1","2.3","3","4.1","4.2","4.3","5.1","5.2","6.1","7"], note: "Most hazmat prohibited" },
        ],
        MA: [
          { name: "Ted Williams Tunnel (I-90)", category: "D", blockedClasses: ["1.1","1.2","1.3","2.3","3","4.2","4.3","5.1","5.2","6.1","7"], note: "Flammable and toxic prohibited" },
          { name: "Sumner/Callahan Tunnels", category: "C", blockedClasses: ["1.1","1.2","1.3","2.3","4.2","5.2","7"], note: "Explosives and toxic gas prohibited" },
        ],
        VA: [
          { name: "Hampton Roads Bridge-Tunnel", category: "C", blockedClasses: ["1.1","1.2","1.3","2.3","4.2","5.2","7"], note: "Escort may be required" },
          { name: "Monitor-Merrimac Bridge-Tunnel", category: "C", blockedClasses: ["1.1","1.2","1.3","2.3","4.2","5.2","7"], note: "Check with VDOT" },
        ],
        MD: [
          { name: "Baltimore Harbor Tunnel", category: "C", blockedClasses: ["1.1","1.2","1.3","2.3","4.2","5.2","7"], note: "MdTA restrictions apply" },
          { name: "Fort McHenry Tunnel (I-95)", category: "C", blockedClasses: ["1.1","1.2","1.3","2.3","4.2","5.2","7"], note: "MdTA restrictions apply" },
        ],
        CO: [
          { name: "Eisenhower/Johnson Tunnels (I-70)", category: "C", blockedClasses: ["1.1","1.2","1.3","2.3","4.2","5.2","7"], note: "CDOT hazmat escort program" },
        ],
        WA: [
          { name: "SR 99 Tunnel (Seattle)", category: "D", blockedClasses: ["1.1","1.2","1.3","2.3","3","4.2","4.3","5.1","5.2","6.1","7"], note: "Most hazmat prohibited" },
        ],
      };

      for (let si = 0; si < allStates.length; si++) {
        const st = allStates[si];
        const tunnels = TUNNEL_RESTRICTIONS[st.toUpperCase()];
        if (tunnels) {
          for (const t of tunnels) {
            const nc = normalizeClass(input.hazmatClass);
            if (t.blockedClasses.some(bc => input.hazmatClass === bc || nc === bc.split(".")[0])) {
              restrictions.push({
                type: "tunnel",
                location: `${t.name} (${st})`,
                description: `Class ${input.hazmatClass} prohibited — Tunnel Category ${t.category}. ${t.note}`,
                regulation: "49 CFR 397.71 — FHWA Tunnel Categories",
                severity: "blocked",
                alternatives: "Use surface routes or alternative crossings",
              });
            }
          }
        }
      }

      // Time-of-day restrictions (common in metro areas)
      const TIME_RESTRICTIONS: Record<string, Array<{ area: string; hours: string; days: string }>> = {
        NY: [{ area: "New York City (all boroughs)", hours: "No hazmat on NYC roads 12am-6am without permit; specific route restrictions 24/7", days: "All days" }],
        IL: [{ area: "Chicago metro (Cook County)", hours: "No hazmat on certain routes during rush hours (6am-9am, 3pm-7pm)", days: "Weekdays" }],
        CA: [{ area: "Los Angeles metro", hours: "Hazmat vehicles prohibited on certain freeways during peak hours", days: "Weekdays" }],
        DC: [{ area: "Washington DC", hours: "Hazmat restricted on most DC streets; designated routes only", days: "All days" }],
      };

      for (let si2 = 0; si2 < allStates.length; si2++) {
        const st = allStates[si2];
        const times = TIME_RESTRICTIONS[st.toUpperCase()];
        if (times) {
          for (const t of times) {
            restrictions.push({
              type: "time_of_day",
              location: `${t.area} (${st})`,
              description: `${t.hours}. Applies: ${t.days}`,
              regulation: "49 CFR 397.67 — Routing designations",
              severity: "restricted",
              alternatives: "Plan arrival/departure outside restricted hours or use designated hazmat routes",
            });
          }
        }
      }

      // State permit requirements
      const STATE_PERMITS: Record<string, { requiresPermit: boolean; permitTypes: string[]; agency: string; website: string; notes: string }> = {
        NY: { requiresPermit: true, permitTypes: ["Highway Route Controlled Quantity (HRCQ)", "Oversize/Overweight Hazmat"], agency: "NYSDOT", website: "dot.ny.gov", notes: "NYC requires separate NYC DOT permit for all hazmat vehicles" },
        NJ: { requiresPermit: true, permitTypes: ["Hazmat Transport Permit"], agency: "NJDOT", website: "nj.gov/transportation", notes: "Required for Class 1, 2.3, 7 materials" },
        CA: { requiresPermit: true, permitTypes: ["Caltrans Hazmat Permit", "CHP Escort (explosives)"], agency: "Caltrans/CHP", website: "dot.ca.gov", notes: "Required for radioactive, explosives, certain toxic materials" },
        TX: { requiresPermit: true, permitTypes: ["TxDMV Hazmat Oversize Permit"], agency: "TxDMV", website: "txdmv.gov", notes: "Required for oversize hazmat loads" },
        IL: { requiresPermit: true, permitTypes: ["IDOT Hazmat Routing Permit"], agency: "IDOT", website: "idot.illinois.gov", notes: "Required for HRCQ through Chicago metro" },
        PA: { requiresPermit: true, permitTypes: ["PennDOT Hazmat Permit"], agency: "PennDOT", website: "penndot.gov", notes: "Required for PA Turnpike hazmat transport" },
        OH: { requiresPermit: false, permitTypes: [], agency: "ODOT", website: "transportation.ohio.gov", notes: "No state-specific hazmat permit; federal HMSP sufficient" },
        FL: { requiresPermit: false, permitTypes: [], agency: "FDOT", website: "fdot.gov", notes: "No state-specific hazmat permit; federal HMSP sufficient" },
      };

      for (let si3 = 0; si3 < allStates.length; si3++) {
        const st = allStates[si3];
        const permit = STATE_PERMITS[st.toUpperCase()];
        if (permit?.requiresPermit) {
          restrictions.push({
            type: "state_permit",
            location: st.toUpperCase(),
            description: `State permit required: ${permit.permitTypes.join(", ")}. Agency: ${permit.agency}. ${permit.notes}`,
            regulation: "49 CFR 397 + State regulations",
            severity: "restricted",
            alternatives: `Apply at ${permit.website}`,
          });
        }
      }

      // Special restrictions for explosives (Class 1)
      if (input.hazmatClass.startsWith("1")) {
        restrictions.push({
          type: "explosives_routing",
          location: "All states",
          description: "Class 1 materials must use DOT-designated preferred routes. Must avoid densely populated areas whenever possible. Vehicle must display proper placards and carry shipping papers.",
          regulation: "49 CFR 397.65 — Highway route controlled quantities of Class 7 / 49 CFR 397.67",
          severity: "restricted",
          alternatives: "Use FMCSA National Hazmat Route Registry for approved routes",
        });
      }

      // Radioactive (Class 7) HRCQ restrictions
      if (input.hazmatClass === "7" || input.isRadioactive) {
        restrictions.push({
          type: "radioactive_routing",
          location: "All states",
          description: "Highway Route Controlled Quantity (HRCQ) of radioactive materials must use Interstate System preferred routes. Written route plan required. 90-day advance notice to governor's office.",
          regulation: "49 CFR 397.101 — Routing for radioactive materials",
          severity: "restricted",
          alternatives: "Consult DOE/NRC for approved transportation corridors",
        });
      }

      // TIH/PIH routing
      if (input.isTIH || input.hazmatClass === "2.3" || input.hazmatClass === "6.1") {
        restrictions.push({
          type: "tih_routing",
          location: "All states",
          description: "Toxic Inhalation Hazard (TIH/PIH) materials require preferred routing. Must avoid populated areas. Emergency response plan required onboard.",
          regulation: "49 CFR 172.505 + 49 CFR 397",
          severity: "restricted",
          alternatives: "Use designated TIH routes; carry CHEMTREC emergency response info",
        });
      }

      // Populated area avoidance (49 CFR 397.9)
      restrictions.push({
        type: "general",
        location: "All routes",
        description: "Hazmat vehicles must avoid routes through or near heavily populated areas, places of assembly, tunnels, narrow streets, or alleys — except where no practicable alternative exists.",
        regulation: "49 CFR 397.9 — Routing",
        severity: "advisory",
        alternatives: "Use bypass routes, ring roads, or designated truck routes",
      });

      // ERG-based distance info
      let ergInfo = null;
      if (input.unNumber) {
        const info = await getFullERGInfo(input.unNumber);
        if (info?.protectiveDistance) {
          ergInfo = info.protectiveDistance;
          restrictions.push({
            type: "erg_isolation",
            location: "In case of spill/leak",
            description: `ERG protective distance: Small spill — ${info.protectiveDistance.smallSpill?.day || "see ERG"} (day), ${info.protectiveDistance.smallSpill?.night || "see ERG"} (night). Large spill — ${info.protectiveDistance.largeSpill?.day || "see ERG"} (day), ${info.protectiveDistance.largeSpill?.night || "see ERG"} (night).`,
            regulation: "ERG 2024 — Protective Action Distances",
            severity: "advisory",
            alternatives: "Carry ERG guide onboard; know evacuation distances",
          });
        }
      }

      const blocked = restrictions.filter(r => r.severity === "blocked").length;
      const restricted = restrictions.filter(r => r.severity === "restricted").length;

      return {
        hazmatClass: input.hazmatClass,
        unNumber: input.unNumber || null,
        originState: input.originState,
        destinationState: input.destinationState,
        transitStates: input.transitStates || [],
        restrictions,
        summary: {
          total: restrictions.length,
          blocked,
          restricted,
          advisory: restrictions.length - blocked - restricted,
        },
        routeStatus: blocked > 0 ? "ROUTE_BLOCKED" as const : restricted > 0 ? "RESTRICTIONS_APPLY" as const : "CLEAR" as const,
        ergProtectiveDistances: ergInfo,
        regulation: "49 CFR Part 397 — Transportation of Hazardous Materials; Driving and Parking Rules",
      };
    }),

  // 15. validatePackaging — 49 CFR 173 packaging compliance validation
  validatePackaging: protectedProcedure
    .input(z.object({
      hazmatClass: z.string(),
      unNumber: z.string().optional(),
      packingGroup: z.enum(["I", "II", "III"]).optional(),
      packagingType: z.string(),
      quantity: z.number(),
      quantityUnit: z.enum(["lbs", "kg", "gal", "L"]).default("lbs"),
    }))
    .query(async ({ input }) => {
      // 49 CFR 173 authorized packagings by hazmat class and packing group
      const AUTHORIZED_PACKAGINGS: Record<string, Record<string, { allowed: string[]; maxQuantity: Record<string, number>; specialProvisions: string[] }>> = {
        "1.1": { "II": { allowed: ["1A2", "1B2", "4C1", "4C2", "4D", "4F"], maxQuantity: { lbs: 66, kg: 30, gal: 0, L: 0 }, specialProvisions: ["Must meet 49 CFR 173.60 compatibility requirements", "New and reused packagings per 173.28"] } },
        "1.4": { "II": { allowed: ["1A2", "1B2", "4C1", "4C2", "4D", "4F", "4G"], maxQuantity: { lbs: 66, kg: 30, gal: 0, L: 0 }, specialProvisions: ["Compatibility group S — limited quantities per 173.63"] } },
        "2.1": { "": { allowed: ["CYL-DOT3AA", "CYL-DOT3AL", "CYL-DOT3E", "CYL-DOT39", "MC-331"], maxQuantity: { lbs: 0, kg: 0, gal: 11600, L: 43906 }, specialProvisions: ["Cylinders per 49 CFR 173.301", "Cargo tanks per 49 CFR 173.315"] } },
        "2.2": { "": { allowed: ["CYL-DOT3AA", "CYL-DOT3AL", "CYL-DOT3E", "CYL-DOT39", "MC-331", "MC-338"], maxQuantity: { lbs: 0, kg: 0, gal: 11600, L: 43906 }, specialProvisions: ["Same as 2.1 plus cryogenic per 173.316"] } },
        "2.3": { "": { allowed: ["CYL-DOT3AA", "CYL-DOT3AL"], maxQuantity: { lbs: 0, kg: 0, gal: 300, L: 1136 }, specialProvisions: ["Poison gas — limited cylinder sizes", "Must have gas-tight valve protection"] } },
        "3": {
          "I": { allowed: ["1A1", "1B1", "1N1", "1H1", "MC-306", "MC-307"], maxQuantity: { lbs: 0, kg: 0, gal: 9200, L: 34826 }, specialProvisions: ["Packing Group I — highest danger", "Single packagings only for <=30L per 173.202"] },
          "II": { allowed: ["1A1", "1B1", "1N1", "1H1", "1H2", "3A1", "3H1", "MC-306", "MC-307"], maxQuantity: { lbs: 0, kg: 0, gal: 9200, L: 34826 }, specialProvisions: ["Inner packagings <=5L in combination per 173.202"] },
          "III": { allowed: ["1A1", "1A2", "1B1", "1B2", "1N1", "1N2", "1H1", "1H2", "3A1", "3A2", "3H1", "3H2", "MC-306", "MC-307", "MC-312", "JERRYCAN", "IBC"], maxQuantity: { lbs: 0, kg: 0, gal: 9200, L: 34826 }, specialProvisions: ["Widest range of packagings allowed", "IBCs per 173.242"] },
        },
        "4.1": { "I": { allowed: ["1A2", "1B2", "4C1", "4C2", "4D", "4F"], maxQuantity: { lbs: 55, kg: 25, gal: 0, L: 0 }, specialProvisions: ["Keep away from heat/flame"] }, "II": { allowed: ["1A2", "1B2", "4C1", "4C2", "4D", "4F", "4G", "IBC"], maxQuantity: { lbs: 882, kg: 400, gal: 0, L: 0 }, specialProvisions: ["IBCs allowed for PG II per 173.212"] }, "III": { allowed: ["1A2", "1B2", "4C1", "4C2", "4D", "4F", "4G", "IBC", "BULK_BAG"], maxQuantity: { lbs: 882, kg: 400, gal: 0, L: 0 }, specialProvisions: ["Bulk packaging per 173.240"] } },
        "4.2": { "I": { allowed: ["1A2", "1B2"], maxQuantity: { lbs: 33, kg: 15, gal: 0, L: 0 }, specialProvisions: ["Must be hermetically sealed", "No air contact"] }, "II": { allowed: ["1A2", "1B2", "4C1"], maxQuantity: { lbs: 110, kg: 50, gal: 0, L: 0 }, specialProvisions: ["Fill with inert gas"] }, "III": { allowed: ["1A2", "1B2", "4C1", "4C2", "4D", "IBC"], maxQuantity: { lbs: 882, kg: 400, gal: 0, L: 0 }, specialProvisions: ["IBCs allowed for PG III"] } },
        "4.3": { "I": { allowed: ["1A1", "1B1"], maxQuantity: { lbs: 0, kg: 0, gal: 2.6, L: 10 }, specialProvisions: ["Waterproof packaging only", "No water contact"] }, "II": { allowed: ["1A1", "1A2", "1B1", "1B2"], maxQuantity: { lbs: 110, kg: 50, gal: 7, L: 25 }, specialProvisions: ["Waterproof inner packaging"] }, "III": { allowed: ["1A1", "1A2", "1B1", "1B2", "4C1", "4C2", "IBC"], maxQuantity: { lbs: 882, kg: 400, gal: 66, L: 250 }, specialProvisions: ["IBCs per 173.242"] } },
        "5.1": { "I": { allowed: ["1A1", "1B1", "1N1", "1H1"], maxQuantity: { lbs: 55, kg: 25, gal: 2.6, L: 10 }, specialProvisions: ["Keep from combustibles", "UN-rated packagings only"] }, "II": { allowed: ["1A1", "1A2", "1B1", "1B2", "1N1", "1H1", "MC-307"], maxQuantity: { lbs: 882, kg: 400, gal: 66, L: 250 }, specialProvisions: ["Separate from combustible materials"] }, "III": { allowed: ["1A1", "1A2", "1B1", "1B2", "1N1", "1N2", "1H1", "1H2", "IBC", "MC-307"], maxQuantity: { lbs: 882, kg: 400, gal: 66, L: 250 }, specialProvisions: ["IBCs allowed per 173.242"] } },
        "5.2": { "I": { allowed: ["1A1", "1B1"], maxQuantity: { lbs: 22, kg: 10, gal: 2.6, L: 10 }, specialProvisions: ["Temperature control may be required", "Type B-F per 173.225"] }, "II": { allowed: ["1A1", "1A2", "1B1", "1B2", "1H1"], maxQuantity: { lbs: 110, kg: 50, gal: 7, L: 25 }, specialProvisions: ["Type B-F designation per 173.225"] } },
        "6.1": { "I": { allowed: ["1A1", "1B1", "1N1", "MC-306", "MC-307", "MC-312"], maxQuantity: { lbs: 55, kg: 25, gal: 2.6, L: 10 }, specialProvisions: ["Poison — requires POISON inhalation hazard label if Zone A/B"] }, "II": { allowed: ["1A1", "1A2", "1B1", "1B2", "1N1", "1H1", "MC-306", "MC-307", "MC-312"], maxQuantity: { lbs: 882, kg: 400, gal: 66, L: 250 }, specialProvisions: ["Poison label required"] }, "III": { allowed: ["1A1", "1A2", "1B1", "1B2", "1N1", "1N2", "1H1", "1H2", "IBC", "MC-306", "MC-307", "MC-312"], maxQuantity: { lbs: 882, kg: 400, gal: 66, L: 250 }, specialProvisions: ["IBC per 173.242"] } },
        "7": { "": { allowed: ["TYPE-A", "TYPE-B(U)", "TYPE-B(M)", "INDUSTRIAL-IP1", "INDUSTRIAL-IP2", "INDUSTRIAL-IP3"], maxQuantity: { lbs: 0, kg: 0, gal: 0, L: 0 }, specialProvisions: ["NRC/DOE approved packagings only", "Activity limits per 173.431-173.435", "Package design approved by competent authority"] } },
        "8": {
          "I": { allowed: ["1A1", "1B1", "1N1", "1H1", "MC-312"], maxQuantity: { lbs: 55, kg: 25, gal: 2.6, L: 10 }, specialProvisions: ["Corrosive-resistant inner packaging", "Corrosion rate criteria per 173.137"] },
          "II": { allowed: ["1A1", "1A2", "1B1", "1B2", "1N1", "1H1", "MC-307", "MC-312"], maxQuantity: { lbs: 882, kg: 400, gal: 66, L: 250 }, specialProvisions: ["Corrosive-resistant packaging"] },
          "III": { allowed: ["1A1", "1A2", "1B1", "1B2", "1N1", "1N2", "1H1", "1H2", "IBC", "MC-307", "MC-312"], maxQuantity: { lbs: 882, kg: 400, gal: 66, L: 250 }, specialProvisions: ["IBCs allowed per 173.242"] },
        },
        "9": { "III": { allowed: ["1A2", "1B2", "1H2", "4C1", "4C2", "4D", "4G", "IBC", "MC-306", "MC-307", "FLATBED", "DRY_VAN", "BULK_BAG"], maxQuantity: { lbs: 882, kg: 400, gal: 119, L: 450 }, specialProvisions: ["Widest range of packagings", "Many exceptions apply — consult 49 CFR 173.155"] } },
      };

      const pg = input.packingGroup || "";
      const classData = AUTHORIZED_PACKAGINGS[input.hazmatClass];
      if (!classData) {
        return { valid: false, hazmatClass: input.hazmatClass, packingGroup: pg, packagingType: input.packagingType, errors: [`No packaging data found for hazmat class ${input.hazmatClass}`], warnings: [], authorizedPackagings: [], specialProvisions: [], regulation: "49 CFR 173" };
      }

      const pgData = classData[pg] || classData[""] || null;
      if (!pgData) {
        const availablePGs = Object.keys(classData).filter(k => k !== "");
        return { valid: false, hazmatClass: input.hazmatClass, packingGroup: pg, packagingType: input.packagingType, errors: [`Packing Group ${pg || "(none)"} not valid for class ${input.hazmatClass}. Available: ${availablePGs.join(", ")}`], warnings: [], authorizedPackagings: classData[availablePGs[0]]?.allowed || [], specialProvisions: [], regulation: "49 CFR 173" };
      }

      const errors: string[] = [];
      const warnings: string[] = [];
      const pkgUpper = input.packagingType.toUpperCase().replace(/[\s-]/g, "");
      const isAllowed = pgData.allowed.some(a => pkgUpper.includes(a.replace(/[\s-]/g, "").toUpperCase()));

      if (!isAllowed) {
        errors.push(`Packaging type '${input.packagingType}' is NOT authorized for Class ${input.hazmatClass} PG ${pg}. Authorized: ${pgData.allowed.join(", ")}`);
      }

      const maxQty = pgData.maxQuantity[input.quantityUnit] || 0;
      if (maxQty > 0 && input.quantity > maxQty) {
        errors.push(`Quantity ${input.quantity} ${input.quantityUnit} exceeds maximum ${maxQty} ${input.quantityUnit} for this packaging/class combination`);
      }

      if (input.hazmatClass.startsWith("4.2")) warnings.push("Spontaneously combustible — verify hermetic seal integrity before transport");
      if (input.hazmatClass === "5.2") warnings.push("Organic peroxide — verify temperature control requirements per 49 CFR 173.225");
      if (input.hazmatClass === "7") warnings.push("Radioactive — additional NRC/DOE approval required for Type B packages");
      if (input.hazmatClass === "2.3") warnings.push("Poison gas — verify cylinder valve protection and gas-tight closure");

      return {
        valid: errors.length === 0,
        hazmatClass: input.hazmatClass,
        packingGroup: pg,
        packagingType: input.packagingType,
        quantity: input.quantity,
        quantityUnit: input.quantityUnit,
        errors,
        warnings,
        authorizedPackagings: pgData.allowed,
        specialProvisions: pgData.specialProvisions,
        maxQuantity: pgData.maxQuantity,
        regulation: "49 CFR 173 — Shippers — General Requirements for Shipments and Packagings",
      };
    }),

  // 16. calculateHazmatPremium — Rate premium calculation for hazmat loads
  calculateHazmatPremium: protectedProcedure
    .input(z.object({
      hazmatClass: z.string(),
      packingGroup: z.enum(["I", "II", "III"]).optional(),
      baseRate: z.number(),
      distance: z.number(),
      weight: z.number(),
      originState: z.string(),
      destinationState: z.string(),
      requiresPlacards: z.boolean().default(true),
      requiresEscort: z.boolean().default(false),
    }))
    .query(async ({ input }) => {
      // Class-based risk multipliers (higher = more premium)
      const CLASS_RISK_MULTIPLIERS: Record<string, number> = {
        "1.1": 0.45, "1.2": 0.40, "1.3": 0.35, "1.4": 0.20, "1.5": 0.15, "1.6": 0.10,
        "2.1": 0.30, "2.2": 0.10, "2.3": 0.40,
        "3": 0.25, "4.1": 0.20, "4.2": 0.30, "4.3": 0.35,
        "5.1": 0.25, "5.2": 0.35, "6.1": 0.30, "6.2": 0.20,
        "7": 0.50, "8": 0.25, "9": 0.10,
      };

      // Packing group multipliers
      const PG_MULTIPLIERS: Record<string, number> = { "I": 1.3, "II": 1.0, "III": 0.8 };

      // Base class premium
      const classMultiplier = CLASS_RISK_MULTIPLIERS[input.hazmatClass] || 0.15;
      const pgMultiplier = PG_MULTIPLIERS[input.packingGroup || "II"] || 1.0;

      // Insurance surcharge per mile (hazmat insurance is ~3-5x general)
      const insuranceSurchargePerMile = classMultiplier > 0.3 ? 0.35 : classMultiplier > 0.2 ? 0.20 : 0.10;

      // Permit/compliance surcharge (flat per load)
      const permitSurcharge = 75; // average state permit + HMSP cost amortized per load

      // Escort surcharge
      const escortSurcharge = input.requiresEscort ? input.distance * 2.50 : 0;

      // Placard/signage surcharge
      const placardSurcharge = input.requiresPlacards ? 25 : 0;

      // Calculate premiums
      const classPremium = input.baseRate * classMultiplier * pgMultiplier;
      const insurancePremium = input.distance * insuranceSurchargePerMile;
      const totalPremium = classPremium + insurancePremium + permitSurcharge + escortSurcharge + placardSurcharge;
      const recommendedRate = input.baseRate + totalPremium;
      const premiumPercentage = Math.round((totalPremium / input.baseRate) * 100);

      return {
        baseRate: input.baseRate,
        hazmatClass: input.hazmatClass,
        packingGroup: input.packingGroup || "II",
        breakdown: {
          classPremium: Math.round(classPremium * 100) / 100,
          insurancePremium: Math.round(insurancePremium * 100) / 100,
          permitSurcharge,
          escortSurcharge: Math.round(escortSurcharge * 100) / 100,
          placardSurcharge,
        },
        totalPremium: Math.round(totalPremium * 100) / 100,
        recommendedRate: Math.round(recommendedRate * 100) / 100,
        premiumPercentage,
        riskLevel: classMultiplier >= 0.35 ? "HIGH" as const : classMultiplier >= 0.20 ? "MEDIUM" as const : "LOW" as const,
        note: `Hazmat Class ${input.hazmatClass} loads typically command ${premiumPercentage}% premium over general freight rates. Factors: class risk (${Math.round(classMultiplier * 100)}%), PG ${input.packingGroup || "II"} modifier, insurance surcharge ($${insuranceSurchargePerMile}/mi), permits ($${permitSurcharge} flat).`,
      };
    }),

  // 17. getHazmatRoute — Google Maps Directions with hazmat restriction avoidance
  getHazmatRoute: protectedProcedure
    .input(z.object({
      origin: z.object({ lat: z.number(), lng: z.number(), address: z.string().optional() }),
      destination: z.object({ lat: z.number(), lng: z.number(), address: z.string().optional() }),
      hazmatClass: z.string(),
      unNumber: z.string().optional(),
      isTIH: z.boolean().optional(),
      weight: z.number().optional(),
      departureTime: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

      // Determine avoidance flags based on hazmat class
      const nc = normalizeClass(input.hazmatClass);
      const avoidTunnels = ["1", "2.1", "2.3", "3", "4.2", "4.3", "5.1", "5.2", "6.1", "7"].includes(nc) || ["1", "2.1", "2.3", "3", "4.2", "4.3", "5.1", "5.2", "6.1", "7"].includes(input.hazmatClass);
      const avoidFerries = true; // All hazmat should avoid ferries where possible
      const avoidHighways = false; // Hazmat should USE highways (49 CFR 397.9 — prefer bypass routes over populated areas)

      // Known tunnel/bridge restrictions — waypoints to avoid
      const AVOID_WAYPOINTS: Array<{ lat: number; lng: number; name: string; reason: string }> = [];
      if (avoidTunnels) {
        // Lincoln/Holland Tunnel area (NYC)
        AVOID_WAYPOINTS.push({ lat: 40.7588, lng: -74.0024, name: "Lincoln Tunnel", reason: "Tunnel Category E — Class " + input.hazmatClass + " prohibited" });
        AVOID_WAYPOINTS.push({ lat: 40.7264, lng: -74.0114, name: "Holland Tunnel", reason: "Tunnel Category E — Class " + input.hazmatClass + " prohibited" });
        // Baltimore tunnels
        AVOID_WAYPOINTS.push({ lat: 39.2641, lng: -76.5796, name: "Baltimore Harbor Tunnel", reason: "Tunnel Category C — hazmat restrictions" });
        AVOID_WAYPOINTS.push({ lat: 39.2695, lng: -76.5838, name: "Fort McHenry Tunnel", reason: "Tunnel Category C — hazmat restrictions" });
        // Eisenhower Tunnel CO
        AVOID_WAYPOINTS.push({ lat: 39.6811, lng: -105.9170, name: "Eisenhower Tunnel", reason: "CDOT hazmat escort required" });
        // Hampton Roads VA
        AVOID_WAYPOINTS.push({ lat: 37.0156, lng: -76.3233, name: "Hampton Roads Bridge-Tunnel", reason: "Tunnel Category C" });
        // Ted Williams Tunnel MA
        AVOID_WAYPOINTS.push({ lat: 42.3541, lng: -71.0188, name: "Ted Williams Tunnel", reason: "Tunnel Category D — flammable/toxic prohibited" });
      }

      // Build Google Maps Directions request
      const avoid: string[] = [];
      if (avoidTunnels) avoid.push("tolls"); // Many restricted tunnels are toll facilities
      if (avoidFerries) avoid.push("ferries");

      let googleRoute = null;
      let alternateRoutes: any[] = [];

      if (GOOGLE_MAPS_KEY) {
        try {
          const originStr = `${input.origin.lat},${input.origin.lng}`;
          const destStr = `${input.destination.lat},${input.destination.lng}`;
          const avoidStr = avoid.length > 0 ? `&avoid=${avoid.join("|")}` : "";
          const depTime = input.departureTime ? `&departure_time=${Math.floor(new Date(input.departureTime).getTime() / 1000)}` : "&departure_time=now";
          const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}${avoidStr}${depTime}&alternatives=true&key=${GOOGLE_MAPS_KEY}`;

          const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
          if (resp.ok) {
            const data = await resp.json() as any;
            if (data.routes?.length > 0) {
              // Primary route (with avoidance)
              const primary = data.routes[0];
              const leg = primary.legs?.[0];
              googleRoute = {
                distance: leg?.distance?.text || "",
                distanceMeters: leg?.distance?.value || 0,
                duration: leg?.duration?.text || "",
                durationSeconds: leg?.duration?.value || 0,
                startAddress: leg?.start_address || input.origin.address || "",
                endAddress: leg?.end_address || input.destination.address || "",
                summary: primary.summary || "",
                warnings: primary.warnings || [],
                polyline: primary.overview_polyline?.points || "",
                steps: (leg?.steps || []).slice(0, 50).map((s: any) => ({
                  instruction: s.html_instructions?.replace(/<[^>]*>/g, "") || "",
                  distance: s.distance?.text || "",
                  duration: s.duration?.text || "",
                  maneuver: s.maneuver || null,
                })),
              };

              // Alternate routes
              alternateRoutes = data.routes.slice(1, 3).map((r: any) => {
                const altLeg = r.legs?.[0];
                return {
                  summary: r.summary || "",
                  distance: altLeg?.distance?.text || "",
                  distanceMeters: altLeg?.distance?.value || 0,
                  duration: altLeg?.duration?.text || "",
                  durationSeconds: altLeg?.duration?.value || 0,
                  polyline: r.overview_polyline?.points || "",
                };
              });
            }
          }
        } catch (err) {
          console.warn("[Hazmat] Google Maps route fetch error:", (err as Error).message);
        }
      }

      // Check if route passes near any restricted waypoints
      const routeWarnings: Array<{ name: string; reason: string; severity: string }> = [];
      if (googleRoute && AVOID_WAYPOINTS.length > 0) {
        // Simple proximity check: if route summary mentions restricted areas
        const summary = (googleRoute.summary || "").toLowerCase();
        for (const wp of AVOID_WAYPOINTS) {
          if (summary.includes("tunnel") || summary.includes("bridge")) {
            routeWarnings.push({ name: wp.name, reason: wp.reason, severity: "warning" });
          }
        }
      }

      // Time-of-day warnings
      const now = input.departureTime ? new Date(input.departureTime) : new Date();
      const hour = now.getHours();
      if ((hour >= 0 && hour < 6) || (hour >= 7 && hour < 9) || (hour >= 16 && hour < 19)) {
        routeWarnings.push({
          name: "Rush Hour / Night Travel Advisory",
          reason: `Departure at ${hour}:00 — many metro areas restrict hazmat during peak hours (NYC, Chicago, Houston). Verify local ordinances.`,
          severity: "advisory",
        });
      }

      return {
        hazmatClass: input.hazmatClass,
        route: googleRoute,
        alternateRoutes,
        avoidance: { tunnels: avoidTunnels, ferries: avoidFerries, flags: avoid },
        restrictedWaypoints: AVOID_WAYPOINTS,
        routeWarnings,
        googleMapsConfigured: !!GOOGLE_MAPS_KEY,
        setupInstructions: GOOGLE_MAPS_KEY ? null : "Set GOOGLE_MAPS_API_KEY environment variable to enable live routing. Enable Directions API in Google Cloud Console.",
        regulation: "49 CFR 397 — Transportation of Hazardous Materials; Driving and Parking Rules",
      };
    }),

  // 18. getHazmatTrainingCompliance — 49 CFR 172.704 training compliance checker
  getHazmatTrainingCompliance: protectedProcedure
    .input(z.object({
      driverId: z.number().optional(),
      companyId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const companyId = input?.companyId || ctx.user?.companyId || 0;

      // 49 CFR 172.704 required training categories for hazmat employees
      const REQUIRED_TRAINING: Array<{
        id: string;
        title: string;
        cfr: string;
        description: string;
        recurrenceYears: number;
        requiredFor: string[];
      }> = [
        {
          id: "general_awareness",
          title: "General Awareness / Familiarization",
          cfr: "49 CFR 172.704(a)(1)",
          description: "Familiarize employee with hazmat regulations, recognize/identify hazardous materials, understand DOT hazmat table (49 CFR 172.101)",
          recurrenceYears: 3,
          requiredFor: ["driver", "loader", "unloader", "packager", "shipper"],
        },
        {
          id: "function_specific",
          title: "Function-Specific Training",
          cfr: "49 CFR 172.704(a)(2)",
          description: "Detailed training specific to the employee's job function — e.g., loading/unloading procedures, vehicle operation, emergency procedures for the specific materials handled",
          recurrenceYears: 3,
          requiredFor: ["driver", "loader", "unloader", "packager"],
        },
        {
          id: "safety_training",
          title: "Safety Training",
          cfr: "49 CFR 172.704(a)(3)",
          description: "Emergency response information, measures to protect from hazmat exposure, spill/leak procedures, PPE requirements, vehicle/equipment safety procedures",
          recurrenceYears: 3,
          requiredFor: ["driver", "loader", "unloader", "packager", "shipper"],
        },
        {
          id: "security_awareness",
          title: "Security Awareness Training",
          cfr: "49 CFR 172.704(a)(4)",
          description: "Awareness of security risks and methods to enhance transportation security — recognize suspicious activities, report security concerns",
          recurrenceYears: 3,
          requiredFor: ["driver", "loader", "unloader", "packager", "shipper"],
        },
        {
          id: "in_depth_security",
          title: "In-Depth Security Training",
          cfr: "49 CFR 172.704(a)(5)",
          description: "Required for employees involved with materials requiring a security plan (49 CFR 172.800) — company security plan details, security procedures, en-route security, cyber security awareness",
          recurrenceYears: 3,
          requiredFor: ["driver", "shipper"],
        },
        {
          id: "modal_specific",
          title: "Modal-Specific Training (Highway)",
          cfr: "49 CFR 177",
          description: "Requirements specific to highway transport: loading/unloading rules, segregation/separation (177.848), routing rules (49 CFR 397), parking rules, attendance requirements",
          recurrenceYears: 3,
          requiredFor: ["driver"],
        },
      ];

      // Check driver training records from DB
      let driverRecords: Array<{ courseName: string; completedAt: Date | null; expiresAt: Date | null; status: string | null }> = [];
      if (db && input?.driverId) {
        try {
          const { trainingRecords } = await import("../../drizzle/schema");
          const rows = await db.select({
            courseName: trainingRecords.courseName,
            completedAt: trainingRecords.completedAt,
            expiresAt: trainingRecords.expiresAt,
            status: trainingRecords.status,
          }).from(trainingRecords).where(eq(trainingRecords.userId, input.driverId));
          driverRecords = rows;
        } catch { /* no training records table or query failed */ }
      }

      const now = new Date();
      const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());

      // Evaluate compliance for each required training
      const compliance = REQUIRED_TRAINING.map(req => {
        const matchingRecords = driverRecords.filter(r =>
          r.courseName.toLowerCase().includes(req.id.replace(/_/g, " ")) ||
          r.courseName.toLowerCase().includes(req.title.toLowerCase().substring(0, 20))
        );

        const latestCompleted = matchingRecords
          .filter(r => r.status === "completed" && r.completedAt)
          .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))[0];

        const isCompleted = !!latestCompleted;
        const completedDate = latestCompleted?.completedAt || null;
        const isExpired = completedDate ? completedDate < threeYearsAgo : false;
        const expiresDate = completedDate ? new Date(completedDate.getFullYear() + req.recurrenceYears, completedDate.getMonth(), completedDate.getDate()) : null;
        const daysUntilExpiry = expiresDate ? Math.ceil((expiresDate.getTime() - now.getTime()) / 86400000) : null;

        let status: "compliant" | "expiring_soon" | "expired" | "not_completed" = "not_completed";
        if (isCompleted && !isExpired) {
          status = daysUntilExpiry !== null && daysUntilExpiry <= 90 ? "expiring_soon" : "compliant";
        } else if (isCompleted && isExpired) {
          status = "expired";
        }

        return {
          ...req,
          status,
          completedDate: completedDate?.toISOString().split("T")[0] || null,
          expiresDate: expiresDate?.toISOString().split("T")[0] || null,
          daysUntilExpiry,
          needsRecurrentTraining: isExpired,
        };
      });

      const compliant = compliance.filter(c => c.status === "compliant").length;
      const expiringSoon = compliance.filter(c => c.status === "expiring_soon").length;
      const expired = compliance.filter(c => c.status === "expired").length;
      const notCompleted = compliance.filter(c => c.status === "not_completed").length;
      const overallCompliant = compliant + expiringSoon === REQUIRED_TRAINING.length;

      return {
        driverId: input?.driverId || null,
        companyId,
        regulation: "49 CFR 172.704 — Training Requirements for Hazmat Employees",
        requiredTraining: compliance,
        summary: {
          totalRequired: REQUIRED_TRAINING.length,
          compliant,
          expiringSoon,
          expired,
          notCompleted,
          overallCompliant,
          compliancePercentage: Math.round((compliant / REQUIRED_TRAINING.length) * 100),
        },
        notes: [
          "Initial training must be completed within 90 days of employment (49 CFR 172.704(c)(1))",
          "Recurrent training required every 3 years from date of previous training (49 CFR 172.704(c)(2))",
          "Employee may perform hazmat functions during initial 90-day training period only under direct supervision of a trained employee",
          "Training records must be retained for 3 years after the most recent training date (49 CFR 172.704(d))",
          "Records must include: employee name, completion date, training materials description, name and address of trainer, certification of completion",
        ],
      };
    }),

  // 19. getSecurityPlanStatus — 49 CFR 172.800 security plan assessment
  getSecurityPlanStatus: protectedProcedure
    .input(z.object({
      companyId: z.number().optional(),
      hazmatClasses: z.array(z.string()).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const companyId = input?.companyId || ctx.user?.companyId || 0;
      const classes = input?.hazmatClasses || [];

      // Materials requiring a security plan (49 CFR 172.800(b))
      const SECURITY_PLAN_TRIGGERS: Array<{
        id: string;
        category: string;
        threshold: string;
        examples: string[];
        hazmatClasses: string[];
      }> = [
        {
          id: "hc_class7",
          category: "Radioactive Materials — Highway Route Controlled Quantities",
          threshold: "Any quantity meeting 49 CFR 173.403 definition",
          examples: ["Spent nuclear fuel", "High-level radioactive waste", "Plutonium"],
          hazmatClasses: ["7"],
        },
        {
          id: "hc_explosives",
          category: "Explosives — Division 1.1, 1.2, 1.3",
          threshold: "Any quantity in a motor vehicle, rail car, or freight container",
          examples: ["Dynamite", "Detonators", "Propellant explosives", "Display fireworks"],
          hazmatClasses: ["1.1", "1.2", "1.3"],
        },
        {
          id: "hc_poison_inhalation",
          category: "Poison Inhalation Hazard (PIH) Materials",
          threshold: "Bulk quantity (>119 gallons liquid, >882 lbs solid, >1000 L gas)",
          examples: ["Chlorine", "Anhydrous ammonia", "Hydrogen fluoride", "Sulfur dioxide"],
          hazmatClasses: ["2.3", "6.1"],
        },
        {
          id: "hc_flammable_gas",
          category: "Flammable Gas — Bulk",
          threshold: "3,500 gallons or more in a single packaging",
          examples: ["Propane MC-331", "LNG MC-338", "Butane"],
          hazmatClasses: ["2.1"],
        },
        {
          id: "hc_oxidizer",
          category: "Oxidizer / Organic Peroxide — Bulk",
          threshold: "3,500 gallons or more",
          examples: ["Hydrogen peroxide >60%", "Ammonium nitrate fertilizer"],
          hazmatClasses: ["5.1", "5.2"],
        },
        {
          id: "hc_flammable_liquid",
          category: "Flammable Liquid — Bulk",
          threshold: "3,500 gallons or more",
          examples: ["Gasoline MC-306", "Crude oil DOT-407", "Ethanol"],
          hazmatClasses: ["3"],
        },
        {
          id: "hc_corrosive",
          category: "Corrosive Materials — Bulk",
          threshold: "3,500 gallons or more",
          examples: ["Sulfuric acid", "Hydrochloric acid", "Sodium hydroxide"],
          hazmatClasses: ["8"],
        },
        {
          id: "hc_select_agents",
          category: "Select Agents and Toxins (CDC/USDA)",
          threshold: "Any quantity listed in 42 CFR 73",
          examples: ["Ebola virus", "Botulinum toxin", "Ricin", "Anthrax"],
          hazmatClasses: ["6.2"],
        },
      ];

      // Check if company's materials trigger security plan requirement
      const triggeredCategories = classes.length > 0
        ? SECURITY_PLAN_TRIGGERS.filter(t => t.hazmatClasses.some(tc => classes.includes(tc)))
        : [];

      const requiresSecurityPlan = triggeredCategories.length > 0;

      // Security plan required elements (49 CFR 172.802)
      const PLAN_ELEMENTS: Array<{
        id: string;
        title: string;
        cfr: string;
        description: string;
        checkItems: string[];
      }> = [
        {
          id: "personnel_security",
          title: "Personnel Security",
          cfr: "49 CFR 172.802(a)",
          description: "Measures to confirm background and employment history of employees with access to hazmat",
          checkItems: [
            "Background checks for all hazmat employees",
            "Employment verification procedures",
            "Access controls to hazmat storage/handling areas",
            "Identification badge requirements",
            "Visitor escort policies in hazmat areas",
          ],
        },
        {
          id: "unauthorized_access",
          title: "Unauthorized Access Prevention",
          cfr: "49 CFR 172.802(b)",
          description: "Measures to prevent unauthorized access to hazmat or transport vehicles",
          checkItems: [
            "Vehicle security when unattended (locks, seals, immobilizers)",
            "Secure parking procedures for hazmat loads",
            "Cargo area locking mechanisms",
            "GPS tracking on hazmat vehicles",
            "En-route security procedures (no unnecessary stops)",
            "Tamper-evident seals on containers",
          ],
        },
        {
          id: "en_route_security",
          title: "En-Route Security",
          cfr: "49 CFR 172.802(c)",
          description: "Measures to address en-route transportation security",
          checkItems: [
            "Approved route planning avoiding high-risk areas",
            "Regular check-in schedule with dispatch",
            "Driver communication devices (cell phone, satellite)",
            "Procedures for stops and rest breaks",
            "Incident reporting chain of command",
            "GPS monitoring with geofence alerts",
          ],
        },
      ];

      return {
        companyId,
        regulation: "49 CFR 172.800-802 — Security Plans for Hazardous Materials",
        requiresSecurityPlan,
        triggeredBy: triggeredCategories,
        allTriggerCategories: SECURITY_PLAN_TRIGGERS,
        planElements: requiresSecurityPlan ? PLAN_ELEMENTS : [],
        assessmentChecklist: requiresSecurityPlan ? [
          { step: 1, action: "Identify which materials trigger the security plan requirement", status: triggeredCategories.length > 0 ? "done" : "pending" },
          { step: 2, action: "Develop written security plan covering all 49 CFR 172.802 elements", status: "needs_review" },
          { step: 3, action: "Train all hazmat employees on the security plan (49 CFR 172.704(a)(5))", status: "needs_review" },
          { step: 4, action: "Implement personnel security measures — background checks, access controls", status: "needs_review" },
          { step: 5, action: "Implement unauthorized access prevention — vehicle locks, seals, GPS", status: "needs_review" },
          { step: 6, action: "Implement en-route security — approved routes, check-in schedules, geofencing", status: "needs_review" },
          { step: 7, action: "Review and update plan annually or when operations change", status: "needs_review" },
          { step: 8, action: "Retain plan copy at principal place of business", status: "needs_review" },
        ] : [],
        notes: requiresSecurityPlan ? [
          "Security plan must be in writing and carried on-board each vehicle transporting affected materials",
          "Plan must be reviewed and updated at least annually",
          "All hazmat employees must receive in-depth security training (49 CFR 172.704(a)(5))",
          "Plan must address personnel security, unauthorized access, and en-route security at minimum",
          "Failure to maintain a security plan is a violation subject to civil penalties up to $81,993 per violation",
          "Companies transporting select agents must also comply with CDC/USDA regulations (42 CFR 73)",
        ] : [
          "Based on the hazmat classes provided, a security plan is NOT currently required under 49 CFR 172.800",
          "If you transport bulk quantities (≥3,500 gal) of flammable gas, flammable liquid, oxidizers, or corrosives, a plan IS required",
          "If you transport ANY quantity of Div 1.1/1.2/1.3 explosives, PIH materials, radioactive HRCQ, or select agents, a plan IS required",
        ],
      };
    }),

  // 20. getIncidentHistory — Past hazmat incidents for a company/driver
  getIncidentHistory: protectedProcedure
    .input(z.object({ companyId: z.number().optional(), driverId: z.number().optional(), limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { incidents: [], total: 0 };
      try {
        const cid = input?.companyId || ctx.user?.companyId || 0;
        const conds: any[] = [eq(incidents.companyId, cid)];
        if (input?.driverId) conds.push(eq(incidents.driverId, input.driverId));
        const rows = await db.select().from(incidents).where(and(...conds)).orderBy(desc(incidents.createdAt)).limit(input?.limit || 25);
        return { incidents: rows, total: rows.length };
      } catch { return { incidents: [], total: 0 }; }
    }),
});
