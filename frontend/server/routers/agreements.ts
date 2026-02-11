/**
 * EUSOCONTRACT — AGREEMENTS ROUTER
 * Full agreement lifecycle: templates, auto-generation from strategic inputs,
 * upload & digitize, sign, amend, negotiate, lane contracts.
 * Platform fee comes from per-load transactions — agreements are business between users.
 */

import { z } from "zod";
import { eq, and, desc, sql, or, like, gte, lte, inArray } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  agreements,
  agreementTemplates,
  agreementSignatures,
  agreementAmendments,
  users,
  companies,
  documents,
} from "../../drizzle/schema";
import { encryptField, decryptField, encryptJSON, decryptJSON } from "../_core/encryption";
import { esangAI } from "../_core/esangAI";
import { fmcsaService } from "../services/fmcsa";

// Encryption version tag for forward compatibility
const ENC_VERSION = "v1";

/** Resolve ctx.user (string openId) → numeric DB user id */
async function resolveUserId(ctxUser: any): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const email = ctxUser?.email || "";
  const name = ctxUser?.name || "User";
  const role = (ctxUser?.role || "SHIPPER") as any;
  if (email) {
    try {
      const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (row) return row.id;
    } catch {}
  }
  try {
    const insertData: Record<string, any> = { email: email || `user-${Date.now()}@eusotrip.com`, name, role, isActive: true, isVerified: false };
    try {
      insertData.openId = String(ctxUser?.id || `auto-${Date.now()}`);
      const result = await db.insert(users).values(insertData as any);
      const insertedId = (result as any).insertId || (result as any)[0]?.insertId;
      if (insertedId) return insertedId;
    } catch {
      delete insertData.openId;
      const result = await db.insert(users).values(insertData as any);
      const insertedId = (result as any).insertId || (result as any)[0]?.insertId;
      if (insertedId) return insertedId;
    }
    if (email) {
      const [newRow] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      return newRow?.id || 0;
    }
    return 0;
  } catch {
    if (email) {
      try {
        const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
        return row?.id || 0;
      } catch {}
    }
    return 0;
  }
}

// Fields that get encrypted at rest in the agreements table
const AGREEMENT_ENCRYPTED_STRING_FIELDS = ["generatedContent", "notes"] as const;
const AGREEMENT_ENCRYPTED_JSON_FIELDS = ["clauses", "strategicInputs", "lanes", "accessorialSchedule"] as const;

/** Decrypt an agreement record for client consumption */
function decryptAgreement(agreement: any): any {
  if (!agreement || !agreement.isEncrypted) return agreement;
  const result = { ...agreement };
  for (const f of AGREEMENT_ENCRYPTED_STRING_FIELDS) {
    if (result[f]) result[f] = decryptField(result[f]);
  }
  for (const f of AGREEMENT_ENCRYPTED_JSON_FIELDS) {
    if (typeof result[f] === "string") result[f] = decryptJSON(result[f]);
  }
  return result;
}

// ============================================================================
// HELPER: Auto-file signed/completed agreements to Documents Center
// Files for BOTH partyA and partyB (shipper, carrier, broker — all types)
// ============================================================================
async function fileAgreementToDocuments(agreementId: number, status: string) {
  try {
    const db = await getDb();
    if (!db) return;

    const [agreement] = await db.select().from(agreements).where(eq(agreements.id, agreementId)).limit(1);
    if (!agreement) return;

    const partyIds = [agreement.partyAUserId, agreement.partyBUserId].filter(Boolean) as number[];
    const docName = `Agreement ${agreement.agreementNumber || `#${agreementId}`} — ${status === "active" ? "Fully Executed" : status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}`;
    const docType = "agreements";

    for (const userId of partyIds) {
      // Check if already filed for this user (avoid duplicates on re-sign or re-update)
      const existing = await db.select({ id: documents.id }).from(documents)
        .where(and(
          eq(documents.userId, userId),
          eq(documents.name, docName),
        )).limit(1);

      if (existing.length > 0) continue;

      await db.insert(documents).values({
        userId,
        name: docName,
        type: docType,
        status: "active",
        fileUrl: `agreement://${agreementId}`,
        expiryDate: agreement.expirationDate || null,
      });
    }

    console.log(`[Agreements] Filed agreement ${agreementId} (${status}) to Documents for ${partyIds.length} parties`);
  } catch (err: any) {
    console.error(`[Agreements] fileAgreementToDocuments error:`, err?.message?.slice(0, 200));
  }
}

// ============================================================================
// HELPER: Generate agreement number
// ============================================================================
function generateAgreementNumber(type: string): string {
  const prefix = {
    carrier_shipper: "CS",
    broker_carrier: "BC",
    broker_shipper: "BS",
    carrier_driver: "CD",
    escort_service: "ES",
    catalyst_dispatch: "CT",
    terminal_access: "TA",
    master_service: "MS",
    lane_commitment: "LC",
    fuel_surcharge: "FS",
    accessorial_schedule: "AS",
    nda: "NDA",
    custom: "CUS",
  }[type] || "AGR";
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 99999).toString().padStart(5, "0");
  return `${prefix}-${year}-${seq}`;
}

// ============================================================================
// HELPER: Auto-generate contract content from strategic inputs
// ============================================================================
function generateContractContent(
  type: string,
  inputs: Record<string, unknown>,
  clauses: { id: string; title: string; body: string; isModified: boolean }[]
): string {
  const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const partyA = (inputs.partyAName as string) || "Party A";
  const partyB = (inputs.partyBName as string) || "Party B";

  const typeTitle: Record<string, string> = {
    carrier_shipper: "CARRIER-SHIPPER TRANSPORTATION AGREEMENT",
    broker_carrier: "BROKER-CARRIER AGREEMENT",
    broker_shipper: "BROKER-SHIPPER AGREEMENT",
    carrier_driver: "CARRIER-DRIVER INDEPENDENT CONTRACTOR AGREEMENT",
    escort_service: "ESCORT/PILOT CAR SERVICE AGREEMENT",
    catalyst_dispatch: "DISPATCH SERVICE AGREEMENT",
    terminal_access: "TERMINAL ACCESS & SERVICES AGREEMENT",
    master_service: "MASTER SERVICE AGREEMENT",
    lane_commitment: "LANE COMMITMENT AGREEMENT",
    fuel_surcharge: "FUEL SURCHARGE SCHEDULE",
    accessorial_schedule: "ACCESSORIAL CHARGES SCHEDULE",
    nda: "NON-DISCLOSURE AGREEMENT",
    custom: "SERVICE AGREEMENT",
  };

  let content = `${typeTitle[type] || "AGREEMENT"}\n\n`;
  content += `Date: ${now}\n\n`;
  content += `This Agreement ("Agreement") is entered into by and between:\n\n`;
  content += `PARTY A: ${partyA}\n`;
  if (inputs.partyACompany) content += `Company: ${inputs.partyACompany}\n`;
  if (inputs.partyADot) content += `DOT#: ${inputs.partyADot}\n`;
  if (inputs.partyAMc) content += `MC#: ${inputs.partyAMc}\n`;
  content += `\nPARTY B: ${partyB}\n`;
  if (inputs.partyBCompany) content += `Company: ${inputs.partyBCompany}\n`;
  if (inputs.partyBDot) content += `DOT#: ${inputs.partyBDot}\n`;
  if (inputs.partyBMc) content += `MC#: ${inputs.partyBMc}\n`;
  content += `\n${"=".repeat(60)}\n\n`;

  // Render clauses
  clauses.forEach((clause, idx) => {
    content += `ARTICLE ${idx + 1}: ${clause.title.toUpperCase()}\n\n`;
    // Replace template variables in clause body
    let body = clause.body;
    Object.entries(inputs).forEach(([key, value]) => {
      body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value || "___"));
    });
    content += `${body}\n\n`;
  });

  content += `${"=".repeat(60)}\n\n`;
  content += `SIGNATURES\n\n`;
  content += `Party A: ${partyA}\nSignature: _________________________\nDate: _______________\n\n`;
  content += `Party B: ${partyB}\nSignature: _________________________\nDate: _______________\n\n`;
  content += `\nThis agreement was generated on the EusoTrip platform.\n`;
  content += `Platform transaction fees apply per load as outlined in the EusoTrip Terms of Service.\n`;

  return content;
}

// ============================================================================
// AGREEMENTS ROUTER
// ============================================================================

export const agreementsRouter = router({
  // --------------------------------------------------------------------------
  // TEMPLATES
  // --------------------------------------------------------------------------

  /** List available agreement templates */
  listTemplates: protectedProcedure
    .input(z.object({
      type: z.string().optional(),
      category: z.string().optional(),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        let query = db.select().from(agreementTemplates);
        const conditions: any[] = [eq(agreementTemplates.isActive, true)];
        if (input.type) conditions.push(eq(agreementTemplates.agreementType, input.type as any));
        if (input.category) conditions.push(eq(agreementTemplates.category, input.category as any));
        if (input.search) conditions.push(like(agreementTemplates.name, `%${input.search}%`));

        const results = await query.where(and(...conditions)).orderBy(desc(agreementTemplates.usageCount)).limit(50);
        return results;
      } catch (e) { return []; }
    }),

  /** Get template by ID with full input schema */
  getTemplate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const [template] = await db.select().from(agreementTemplates).where(eq(agreementTemplates.id, input.id));
        return template || null;
      } catch (e) { return null; }
    }),

  /** Create or upload a template */
  createTemplate: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      agreementType: z.string(),
      category: z.enum(["company", "custom", "uploaded"]),
      clauses: z.array(z.object({
        id: z.string(),
        title: z.string(),
        body: z.string(),
        isRequired: z.boolean(),
        isEditable: z.boolean(),
        order: z.number(),
        category: z.string(),
      })).optional(),
      inputSchema: z.array(z.object({
        field: z.string(),
        label: z.string(),
        type: z.enum(["text", "number", "date", "select", "currency", "percentage", "address", "boolean"]),
        required: z.boolean(),
        options: z.array(z.string()).optional(),
        defaultValue: z.string().optional(),
        section: z.string(),
      })).optional(),
      originalDocumentUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const result = await db.insert(agreementTemplates).values({
        name: input.name,
        description: input.description,
        agreementType: input.agreementType as any,
        category: input.category,
        ownerUserId: ctx.user?.id,
        clauses: input.clauses || [],
        inputSchema: input.inputSchema || [],
        originalDocumentUrl: input.originalDocumentUrl,
        isDigitized: !!input.originalDocumentUrl,
      }).$returningId();
      return { id: result[0]?.id, success: true };
    }),

  /** Upload a standard agreement document for digitization */
  uploadForDigitization: protectedProcedure
    .input(z.object({
      templateId: z.number().optional(),
      documentUrl: z.string(),
      agreementType: z.string(),
      name: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // In production, this would call an OCR/AI service to extract clauses
      // For now, store the document URL and mark as pending digitization
      if (input.templateId) {
        await db.update(agreementTemplates)
          .set({
            originalDocumentUrl: input.documentUrl,
            isDigitized: false,
            digitizedContent: null,
          })
          .where(eq(agreementTemplates.id, input.templateId));
        return { templateId: input.templateId, status: "pending_digitization" };
      }

      const result = await db.insert(agreementTemplates).values({
        name: input.name,
        agreementType: input.agreementType as any,
        category: "uploaded",
        ownerUserId: ctx.user?.id,
        originalDocumentUrl: input.documentUrl,
        isDigitized: false,
      }).$returningId();
      return { templateId: result[0]?.id, status: "pending_digitization" };
    }),

  // --------------------------------------------------------------------------
  // AGREEMENTS — CRUD & LIFECYCLE
  // --------------------------------------------------------------------------

  /** List agreements for current user/company */
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      type: z.string().optional(),
      duration: z.string().optional(),
      search: z.string().optional(),
      partyUserId: z.number().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { agreements: [], total: 0 };
      try {
        const userId = await resolveUserId(ctx.user);
        const conditions: any[] = [];

        // User can see agreements where they are party A or party B
        if (userId) {
          conditions.push(
            or(
              eq(agreements.partyAUserId, userId),
              eq(agreements.partyBUserId, userId)
            )
          );
        }

        if (input.status) conditions.push(eq(agreements.status, input.status as any));
        if (input.type) conditions.push(eq(agreements.agreementType, input.type as any));
        if (input.duration) conditions.push(eq(agreements.contractDuration, input.duration as any));
        if (input.search) conditions.push(like(agreements.agreementNumber, `%${input.search}%`));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [results, countResult] = await Promise.all([
          db.select().from(agreements)
            .where(whereClause)
            .orderBy(desc(agreements.updatedAt))
            .limit(input.limit)
            .offset(input.offset),
          db.select({ count: sql<number>`count(*)` }).from(agreements).where(whereClause),
        ]);

        return { agreements: results, total: countResult[0]?.count || 0 };
      } catch (e) { return { agreements: [], total: 0 }; }
    }),

  /** Get agreement by ID with party details */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      try {
        const [agreement] = await db.select().from(agreements).where(eq(agreements.id, input.id));
        if (!agreement) return null;

        // Get party details
        const [partyA, partyB, sigs, amendments] = await Promise.all([
          db.select({ id: users.id, name: users.name, email: users.email, role: users.role })
            .from(users).where(eq(users.id, agreement.partyAUserId)),
          db.select({ id: users.id, name: users.name, email: users.email, role: users.role })
            .from(users).where(eq(users.id, agreement.partyBUserId)),
          db.select().from(agreementSignatures).where(eq(agreementSignatures.agreementId, input.id)),
          db.select().from(agreementAmendments)
            .where(eq(agreementAmendments.agreementId, input.id))
            .orderBy(desc(agreementAmendments.createdAt)),
        ]);

        // Get company details if applicable
        let partyACompany = null;
        let partyBCompany = null;
        if (agreement.partyACompanyId) {
          const [c] = await db.select().from(companies).where(eq(companies.id, agreement.partyACompanyId));
          partyACompany = c || null;
        }
        if (agreement.partyBCompanyId) {
          const [c] = await db.select().from(companies).where(eq(companies.id, agreement.partyBCompanyId));
          partyBCompany = c || null;
        }

        return {
          ...agreement,
          partyA: partyA[0] || null,
          partyB: partyB[0] || null,
          partyACompany,
          partyBCompany,
          signatures: sigs,
          amendments,
        };
      } catch (e) { return null; }
    }),

  /** Get agreement stats for dashboard */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { total: 0, active: 0, draft: 0, negotiating: 0, pendingSignature: 0, expired: 0, totalValue: 0 };
      try {
        const userId = await resolveUserId(ctx.user);
        const userFilter = userId
          ? or(eq(agreements.partyAUserId, userId), eq(agreements.partyBUserId, userId))
          : undefined;

        const [total, active, draft, negotiating, pendingSig, expired] = await Promise.all([
          db.select({ count: sql<number>`count(*)` }).from(agreements).where(userFilter),
          db.select({ count: sql<number>`count(*)` }).from(agreements).where(and(userFilter, eq(agreements.status, "active"))),
          db.select({ count: sql<number>`count(*)` }).from(agreements).where(and(userFilter, eq(agreements.status, "draft"))),
          db.select({ count: sql<number>`count(*)` }).from(agreements).where(and(userFilter, eq(agreements.status, "negotiating"))),
          db.select({ count: sql<number>`count(*)` }).from(agreements).where(and(userFilter, eq(agreements.status, "pending_signature"))),
          db.select({ count: sql<number>`count(*)` }).from(agreements).where(and(userFilter, eq(agreements.status, "expired"))),
        ]);

        return {
          total: total[0]?.count || 0,
          active: active[0]?.count || 0,
          draft: draft[0]?.count || 0,
          negotiating: negotiating[0]?.count || 0,
          pendingSignature: pendingSig[0]?.count || 0,
          expired: expired[0]?.count || 0,
          totalValue: 0,
        };
      } catch (e) {
        return { total: 0, active: 0, draft: 0, negotiating: 0, pendingSignature: 0, expired: 0, totalValue: 0 };
      }
    }),

  /**
   * AUTO-GENERATE AGREEMENT from strategic inputs.
   * This is the core "intelligent agreement builder" —
   * user fills in strategic fields, system generates the contract.
   */
  generate: protectedProcedure
    .input(z.object({
      templateId: z.number().optional(),
      agreementType: z.string(),
      contractDuration: z.enum(["spot", "short_term", "long_term", "evergreen"]),
      // Party B
      partyBUserId: z.number(),
      partyBCompanyId: z.number().optional(),
      partyBRole: z.string(),
      // Strategic inputs
      strategicInputs: z.record(z.string(), z.unknown()),
      // Financial terms
      rateType: z.string().optional(),
      baseRate: z.number().optional(),
      fuelSurchargeType: z.string().optional(),
      fuelSurchargeValue: z.number().optional(),
      minimumCharge: z.number().optional(),
      maximumCharge: z.number().optional(),
      paymentTermDays: z.number().optional(),
      quickPayDiscount: z.number().optional(),
      quickPayDays: z.number().optional(),
      // Insurance
      minInsuranceAmount: z.number().optional(),
      liabilityLimit: z.number().optional(),
      cargoInsuranceRequired: z.number().optional(),
      // Operational
      equipmentTypes: z.array(z.string()).optional(),
      hazmatRequired: z.boolean().optional(),
      twicRequired: z.boolean().optional(),
      tankerEndorsementRequired: z.boolean().optional(),
      // Lanes
      lanes: z.array(z.object({
        origin: z.object({ city: z.string(), state: z.string(), radius: z.number().optional() }),
        destination: z.object({ city: z.string(), state: z.string(), radius: z.number().optional() }),
        rate: z.number(),
        rateType: z.string(),
        volumeCommitment: z.number().optional(),
        volumePeriod: z.string().optional(),
      })).optional(),
      // Accessorials
      accessorialSchedule: z.array(z.object({
        type: z.string(),
        rate: z.number(),
        unit: z.string(),
        description: z.string(),
      })).optional(),
      // Dates
      effectiveDate: z.string().optional(),
      expirationDate: z.string().optional(),
      autoRenew: z.boolean().optional(),
      // Notes
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Validate agreement type is within freight/logistics business scope
      const validTypes = ["carrier_shipper","broker_carrier","broker_shipper","carrier_driver","escort_service","catalyst_dispatch","terminal_access","master_service","lane_commitment","fuel_surcharge","accessorial_schedule","nda","custom"];
      if (!validTypes.includes(input.agreementType)) {
        throw new Error(`Invalid agreement type: ${input.agreementType}. Must be a valid freight/logistics agreement type.`);
      }

      const agreementNumber = generateAgreementNumber(input.agreementType);

      // Load template clauses if templateId provided
      let templateClauses: any[] = [];
      if (input.templateId) {
        const [template] = await db.select().from(agreementTemplates)
          .where(eq(agreementTemplates.id, input.templateId));
        if (template?.clauses) {
          templateClauses = (template.clauses as any[]).map(c => ({
            ...c,
            isModified: false,
          }));
        }
        // Increment usage count
        await db.update(agreementTemplates)
          .set({ usageCount: sql`${agreementTemplates.usageCount} + 1` })
          .where(eq(agreementTemplates.id, input.templateId));
      }

      // If no template clauses, use default clauses for type
      if (templateClauses.length === 0) {
        templateClauses = getDefaultClauses(input.agreementType);
      }

      const numericUserId = await resolveUserId(ctx.user);
      if (!numericUserId) throw new Error("Could not resolve user ID");

      const si = input.strategicInputs || {};

      // ── FMCSA AUTO-VERIFICATION & COMPLIANCE GUARDRAILS ──
      // Verify both parties' DOT numbers against the federal SAFER system
      const fmcsaVerification: {
        partyA: any | null;
        partyB: any | null;
        warnings: string[];
        blockers: string[];
        verified: boolean;
      } = { partyA: null, partyB: null, warnings: [], blockers: [], verified: false };

      const partyADot = (si.partyADot as string) || "";
      const partyBDot = (si.partyBDot as string) || "";

      // Run FMCSA verification in parallel for both parties
      const [partyAVerification, partyBVerification] = await Promise.all([
        partyADot ? fmcsaService.verifyCarrier(partyADot).catch(() => null) : Promise.resolve(null),
        partyBDot ? fmcsaService.verifyCarrier(partyBDot).catch(() => null) : Promise.resolve(null),
      ]);

      if (partyAVerification) {
        fmcsaVerification.partyA = partyAVerification;
        if (!partyAVerification.isValid) {
          partyAVerification.errors?.forEach((e: string) =>
            fmcsaVerification.blockers.push(`Party A: ${e}`)
          );
        }
        partyAVerification.warnings?.forEach((w: string) =>
          fmcsaVerification.warnings.push(`Party A: ${w}`)
        );
      }

      if (partyBVerification) {
        fmcsaVerification.partyB = partyBVerification;
        if (!partyBVerification.isValid) {
          partyBVerification.errors?.forEach((e: string) =>
            fmcsaVerification.blockers.push(`Party B: ${e}`)
          );
        }
        partyBVerification.warnings?.forEach((w: string) =>
          fmcsaVerification.warnings.push(`Party B: ${w}`)
        );
      }

      fmcsaVerification.verified = !!(partyAVerification?.isValid || partyBVerification?.isValid);

      // ── COMPLIANCE GUARDRAILS ──
      // 1) Block if carrier has Unsatisfactory safety rating or no operating authority
      if (fmcsaVerification.blockers.length > 0) {
        console.warn(`[EUSOCONTRACT] FMCSA blockers: ${fmcsaVerification.blockers.join("; ")}`);
        // Don't hard-block — include as risk flags so the user is fully informed
        // Hard-block only for truly dangerous situations
        const hardBlock = fmcsaVerification.blockers.some(b =>
          b.includes("Unsatisfactory safety rating") || b.includes("not have active operating authority")
        );
        if (hardBlock) {
          throw new Error(
            `Agreement generation blocked by compliance guardrails:\n` +
            fmcsaVerification.blockers.join("\n") +
            `\n\nResolve these issues before generating an agreement. ` +
            `Carriers must have active operating authority and a satisfactory or conditional safety rating.`
          );
        }
      }

      // 2) Insurance minimum checks
      const INSURANCE_MINIMUMS: Record<string, number> = {
        carrier_shipper: 750000,
        broker_carrier: 750000,
        broker_shipper: 75000,    // Broker bond minimum
        carrier_driver: 750000,
        escort_service: 300000,
        master_service: 750000,
        lane_commitment: 750000,
        catalyst_dispatch: 75000,
        terminal_access: 500000,
      };

      const requiredMinInsurance = INSURANCE_MINIMUMS[input.agreementType] || 750000;
      const declaredInsurance = input.minInsuranceAmount || 0;

      if (declaredInsurance > 0 && declaredInsurance < requiredMinInsurance) {
        fmcsaVerification.warnings.push(
          `Declared insurance ($${declaredInsurance.toLocaleString()}) is below the ` +
          `recommended FMCSA minimum ($${requiredMinInsurance.toLocaleString()}) for ${input.agreementType} agreements`
        );
      }

      // 3) Verify Party B insurance on file with FMCSA (if DOT verified)
      if (partyBVerification?.insurance) {
        const validIns = partyBVerification.insurance;
        if (validIns.length === 0) {
          fmcsaVerification.warnings.push("Party B has no valid insurance on file with FMCSA");
        } else {
          // Check if coverage meets declared minimums
          const maxCoverage = Math.max(...validIns.map((i: any) => i.coverageValue || 0));
          if (maxCoverage > 0 && declaredInsurance > 0 && maxCoverage < declaredInsurance) {
            fmcsaVerification.warnings.push(
              `Party B's FMCSA-filed insurance ($${maxCoverage.toLocaleString()}) is below ` +
              `the agreement's declared minimum ($${declaredInsurance.toLocaleString()})`
            );
          }
        }
      }

      // 4) Cargo insurance check for carrier agreements
      const carrierTypes = ["carrier_shipper", "broker_carrier", "carrier_driver", "master_service", "lane_commitment"];
      if (carrierTypes.includes(input.agreementType)) {
        if (!input.cargoInsuranceRequired || Number(input.cargoInsuranceRequired) < 100000) {
          fmcsaVerification.warnings.push(
            "Cargo insurance should be at least $100,000 for carrier agreements per industry standards"
          );
        }
      }

      // 5) Hazmat authority check
      if (input.hazmatRequired && partyBVerification?.carrier) {
        if (partyBVerification.carrier.hmFlag !== "Y") {
          fmcsaVerification.blockers.push("Party B is not registered for hazmat with FMCSA but agreement requires hazmat");
          throw new Error(
            "Agreement generation blocked: Party B (carrier) is not registered for hazardous materials " +
            "with FMCSA, but this agreement requires hazmat authorization. " +
            "The carrier must obtain hazmat authorization before proceeding."
          );
        }
      }

      console.log(`[EUSOCONTRACT] FMCSA verification complete — verified: ${fmcsaVerification.verified}, warnings: ${fmcsaVerification.warnings.length}, blockers: ${fmcsaVerification.blockers.length}`);

      // ── ESANG AI™ EusoContract — Intelligent Agreement Generation ──
      // Build the AI request with all strategic inputs for context-aware generation
      const aiRequest = {
        agreementType: input.agreementType,
        contractDuration: input.contractDuration,
        partyA: {
          name: (si.partyAName as string) || ctx.user?.name || "Party A",
          company: (si.partyACompany as string) || undefined,
          role: ctx.user?.role || "SHIPPER",
          mc: (si.partyAMc as string) || undefined,
          dot: (si.partyADot as string) || undefined,
        },
        partyB: {
          name: (si.partyBName as string) || "Party B",
          company: (si.partyBCompany as string) || undefined,
          role: input.partyBRole,
          mc: (si.partyBMc as string) || undefined,
          dot: (si.partyBDot as string) || undefined,
        },
        financial: {
          rateType: input.rateType,
          baseRate: input.baseRate,
          fuelSurchargeType: input.fuelSurchargeType,
          fuelSurchargeValue: input.fuelSurchargeValue,
          minimumCharge: input.minimumCharge,
          maximumCharge: input.maximumCharge,
          paymentTermDays: input.paymentTermDays,
          quickPayDiscount: input.quickPayDiscount,
          quickPayDays: input.quickPayDays,
        },
        insurance: {
          minInsurance: input.minInsuranceAmount,
          liability: input.liabilityLimit,
          cargo: input.cargoInsuranceRequired,
        },
        operational: {
          equipmentTypes: input.equipmentTypes,
          hazmat: input.hazmatRequired,
          twic: input.twicRequired,
          tanker: input.tankerEndorsementRequired,
        },
        lanes: input.lanes,
        dates: {
          effective: input.effectiveDate,
          expiration: input.expirationDate,
          autoRenew: input.autoRenew,
        },
        notes: input.notes,
        clauses: templateClauses,
        fmcsaVerification: {
          partyAVerified: !!partyAVerification?.isValid,
          partyBVerified: !!partyBVerification?.isValid,
          partyASafetyRating: partyAVerification?.safetyRating?.rating || null,
          partyBSafetyRating: partyBVerification?.safetyRating?.rating || null,
          partyALegalName: partyAVerification?.carrier?.legalName || null,
          partyBLegalName: partyBVerification?.carrier?.legalName || null,
          complianceWarnings: fmcsaVerification.warnings,
        },
      };

      // Call ESANG AI for intelligent content generation (falls back to static if unavailable)
      let aiResult: { content: string; enhancedClauses: any[]; complianceNotes: string[]; riskFlags: string[] };
      try {
        aiResult = await esangAI.generateAgreementContent(aiRequest);
        console.log(`[EUSOCONTRACT] AI generated ${aiResult.enhancedClauses.length} clauses, ${aiResult.complianceNotes.length} notes, ${aiResult.riskFlags.length} flags`);
      } catch (aiErr: any) {
        console.warn("[EUSOCONTRACT] AI generation failed, using static fallback:", aiErr?.message?.slice(0, 200));
        // Static fallback
        const content = generateContractContent(input.agreementType, input.strategicInputs, templateClauses);
        aiResult = { content, enhancedClauses: templateClauses, complianceNotes: [], riskFlags: [] };
      }

      const finalClauses = aiResult.enhancedClauses.length > 0 ? aiResult.enhancedClauses : templateClauses;

      // Resolve Party B — if partyBUserId is 0 or missing, create/find a placeholder
      // from the strategic inputs so multi-user accounts work properly
      let partyBId = input.partyBUserId;
      if (!partyBId || partyBId === 0) {
        const bName = (si.partyBName as string) || "Counterparty";
        try {
          const [existing] = await db.select({ id: users.id }).from(users)
            .where(eq(users.name, bName)).limit(1);
          if (existing) {
            partyBId = existing.id;
          } else {
            const placeholderEmail = `${bName.toLowerCase().replace(/\s+/g, ".")}@pending.eusotrip.com`;
            const insResult = await db.insert(users).values({
              name: bName,
              email: placeholderEmail,
              role: (input.partyBRole as any) || "CARRIER",
              isActive: true,
              isVerified: false,
            } as any);
            partyBId = (insResult as any).insertId || (insResult as any)[0]?.insertId || 0;
            if (!partyBId) {
              const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, placeholderEmail)).limit(1);
              partyBId = row?.id || 0;
            }
          }
        } catch {
          partyBId = numericUserId;
        }
      }

      const result = await db.insert(agreements).values({
        agreementNumber,
        templateId: input.templateId,
        agreementType: input.agreementType as any,
        contractDuration: input.contractDuration,
        partyAUserId: numericUserId,
        partyACompanyId: ctx.user?.companyId || null,
        partyARole: ctx.user?.role || "SHIPPER",
        partyBUserId: partyBId,
        partyBCompanyId: input.partyBCompanyId,
        partyBRole: input.partyBRole,
        rateType: (input.rateType as any) || null,
        baseRate: input.baseRate?.toString(),
        fuelSurchargeType: (input.fuelSurchargeType as any) || "none",
        fuelSurchargeValue: input.fuelSurchargeValue?.toString(),
        minimumCharge: input.minimumCharge?.toString(),
        maximumCharge: input.maximumCharge?.toString(),
        paymentTermDays: input.paymentTermDays || 30,
        quickPayDiscount: input.quickPayDiscount?.toString(),
        quickPayDays: input.quickPayDays,
        minInsuranceAmount: input.minInsuranceAmount?.toString(),
        liabilityLimit: input.liabilityLimit?.toString(),
        cargoInsuranceRequired: input.cargoInsuranceRequired?.toString(),
        equipmentTypes: input.equipmentTypes || [],
        hazmatRequired: input.hazmatRequired || false,
        twicRequired: input.twicRequired || false,
        tankerEndorsementRequired: input.tankerEndorsementRequired || false,
        lanes: encryptJSON(input.lanes || []) as any,
        accessorialSchedule: encryptJSON(input.accessorialSchedule || []) as any,
        generatedContent: encryptField(aiResult.content),
        clauses: encryptJSON(finalClauses) as any,
        strategicInputs: encryptJSON(input.strategicInputs) as any,
        status: "draft",
        effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : null,
        expirationDate: input.expirationDate ? new Date(input.expirationDate) : null,
        autoRenew: input.autoRenew || false,
        notes: input.notes ? encryptField(input.notes) : null,
        isEncrypted: true,
        encryptionVersion: ENC_VERSION,
        platformFeeAcknowledged: true,
      }).$returningId();

      // Merge AI compliance notes with FMCSA warnings
      const allComplianceNotes = [
        ...aiResult.complianceNotes,
        ...fmcsaVerification.warnings,
      ];
      const allRiskFlags = [
        ...aiResult.riskFlags,
        ...fmcsaVerification.blockers,
      ];

      return {
        id: result[0]?.id,
        agreementNumber,
        status: "draft",
        generatedContent: aiResult.content,
        complianceNotes: allComplianceNotes,
        riskFlags: allRiskFlags,
        fmcsaVerification: {
          verified: fmcsaVerification.verified,
          partyA: partyAVerification ? {
            dotNumber: partyADot,
            legalName: partyAVerification.carrier?.legalName || null,
            isValid: partyAVerification.isValid,
            safetyRating: partyAVerification.safetyRating?.rating || "Not Rated",
            hasActiveAuthority: partyAVerification.authorities?.some((a: any) => a.authorityStatus === "Active") || false,
            insuranceOnFile: (partyAVerification.insurance?.length || 0) > 0,
          } : null,
          partyB: partyBVerification ? {
            dotNumber: partyBDot,
            legalName: partyBVerification.carrier?.legalName || null,
            isValid: partyBVerification.isValid,
            safetyRating: partyBVerification.safetyRating?.rating || "Not Rated",
            hasActiveAuthority: partyBVerification.authorities?.some((a: any) => a.authorityStatus === "Active") || false,
            insuranceOnFile: (partyBVerification.insurance?.length || 0) > 0,
          } : null,
        },
        poweredBy: "EusoContract™ / ESANG AI™ + FMCSA SAFER",
      };
    }),

  /** Update agreement (while in draft/negotiating) */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.string().optional(),
      baseRate: z.number().optional(),
      paymentTermDays: z.number().optional(),
      effectiveDate: z.string().optional(),
      expirationDate: z.string().optional(),
      notes: z.string().optional(),
      clauses: z.array(z.object({
        id: z.string(),
        title: z.string(),
        body: z.string(),
        isModified: z.boolean(),
        modifiedBy: z.number().optional(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const updateData: any = {};
      if (input.status) updateData.status = input.status;
      if (input.baseRate !== undefined) updateData.baseRate = input.baseRate.toString();
      if (input.paymentTermDays !== undefined) updateData.paymentTermDays = input.paymentTermDays;
      if (input.effectiveDate) updateData.effectiveDate = new Date(input.effectiveDate);
      if (input.expirationDate) updateData.expirationDate = new Date(input.expirationDate);
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.clauses) updateData.clauses = input.clauses;

      await db.update(agreements).set(updateData).where(eq(agreements.id, input.id));

      // Auto-file to Documents Center when agreement becomes active or completed
      if (input.status && ["active", "completed", "signed"].includes(input.status)) {
        await fileAgreementToDocuments(input.id, input.status);
      }

      return { success: true, id: input.id };
    }),

  /** Send agreement for review */
  sendForReview: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.update(agreements)
        .set({ status: "pending_review" })
        .where(eq(agreements.id, input.id));
      return { success: true, status: "pending_review" };
    }),

  /** Send for signature */
  sendForSignature: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.update(agreements)
        .set({ status: "pending_signature" })
        .where(eq(agreements.id, input.id));
      return { success: true, status: "pending_signature" };
    }),

  /** Sign agreement — Gradient Ink digital signature */
  sign: protectedProcedure
    .input(z.object({
      agreementId: z.number(),
      signatureData: z.string().describe("Base64 Gradient Ink signature image"),
      signatureRole: z.string(),
      signerName: z.string().optional(),
      signerTitle: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Create SHA-256 signature hash (Gradient Ink verification)
      const encoder = new TextEncoder();
      const data = encoder.encode(`${input.agreementId}-${ctx.user?.id}-${Date.now()}-gradient_ink`);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const signatureHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      // Store Gradient Ink signature with full audit trail
      const sigUserId = await resolveUserId(ctx.user);
      if (!sigUserId) throw new Error("Could not resolve user ID");

      await db.insert(agreementSignatures).values({
        agreementId: input.agreementId,
        userId: sigUserId,
        companyId: ctx.user?.companyId || null,
        signatureRole: input.signatureRole,
        signatureData: input.signatureData,
        signatureHash,
        ipAddress: ctx.req?.ip || null,
        userAgent: ctx.req?.headers?.["user-agent"] || null,
      });

      // Check if both parties have signed
      const sigs = await db.select().from(agreementSignatures)
        .where(eq(agreementSignatures.agreementId, input.agreementId));

      if (sigs.length >= 2) {
        // Both parties signed — activate the agreement
        await db.update(agreements)
          .set({ status: "active" })
          .where(eq(agreements.id, input.agreementId));

        // Auto-file to Documents Center for both parties
        await fileAgreementToDocuments(input.agreementId, "active");

        return {
          success: true,
          status: "active",
          fullyExecuted: true,
          gradientInk: {
            verified: true,
            method: "gradient_ink_sha256",
            startColor: "#1473FF",
            endColor: "#BE01FF",
            esignAct: "ESIGN Act compliant - 15 U.S.C. ch. 96",
            uetaCompliant: true,
          },
        };
      }

      return {
        success: true,
        status: "pending_signature",
        fullyExecuted: false,
        gradientInk: {
          verified: true,
          method: "gradient_ink_sha256",
          startColor: "#1473FF",
          endColor: "#BE01FF",
          esignAct: "ESIGN Act compliant - 15 U.S.C. ch. 96",
          uetaCompliant: true,
        },
      };
    }),

  /** Terminate agreement */
  terminate: protectedProcedure
    .input(z.object({
      id: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.update(agreements)
        .set({ status: "terminated", terminationDate: new Date() })
        .where(eq(agreements.id, input.id));
      return { success: true, status: "terminated" };
    }),

  // --------------------------------------------------------------------------
  // AMENDMENTS
  // --------------------------------------------------------------------------

  /** Propose amendment to active agreement */
  proposeAmendment: protectedProcedure
    .input(z.object({
      agreementId: z.number(),
      title: z.string(),
      description: z.string().optional(),
      changes: z.array(z.object({
        field: z.string(),
        oldValue: z.unknown(),
        newValue: z.unknown(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Get next amendment number
      const existing = await db.select({ count: sql<number>`count(*)` })
        .from(agreementAmendments)
        .where(eq(agreementAmendments.agreementId, input.agreementId));

      const result = await db.insert(agreementAmendments).values({
        agreementId: input.agreementId,
        amendmentNumber: (existing[0]?.count || 0) + 1,
        title: input.title,
        description: input.description,
        changes: input.changes,
        proposedBy: await resolveUserId(ctx.user) || 0,
        status: "proposed",
      }).$returningId();

      // Set agreement to negotiating
      await db.update(agreements)
        .set({ status: "negotiating" })
        .where(eq(agreements.id, input.agreementId));

      return { id: result[0]?.id, success: true };
    }),

  /** Accept or reject amendment */
  respondToAmendment: protectedProcedure
    .input(z.object({
      amendmentId: z.number(),
      action: z.enum(["accept", "reject"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      if (input.action === "accept") {
        await db.update(agreementAmendments).set({
          status: "accepted",
          acceptedBy: await resolveUserId(ctx.user) || 0,
          acceptedAt: new Date(),
        }).where(eq(agreementAmendments.id, input.amendmentId));
      } else {
        await db.update(agreementAmendments).set({
          status: "rejected",
        }).where(eq(agreementAmendments.id, input.amendmentId));
      }

      return { success: true, status: input.action === "accept" ? "accepted" : "rejected" };
    }),

  /** Get list of expiring agreements */
  getExpiring: protectedProcedure
    .input(z.object({ daysAhead: z.number().default(90) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const userId = await resolveUserId(ctx.user);
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + input.daysAhead);

        const conditions: any[] = [
          eq(agreements.status, "active"),
          lte(agreements.expirationDate, futureDate),
          gte(agreements.expirationDate, new Date()),
        ];
        if (userId) {
          conditions.push(or(
            eq(agreements.partyAUserId, userId),
            eq(agreements.partyBUserId, userId)
          ));
        }

        return await db.select().from(agreements)
          .where(and(...conditions))
          .orderBy(agreements.expirationDate)
          .limit(20);
      } catch (e) { return []; }
    }),
});

// ============================================================================
// DEFAULT CLAUSES BY AGREEMENT TYPE
// ============================================================================

function getDefaultClauses(type: string) {
  const commonClauses = [
    { id: "recitals", title: "Recitals & Purpose", body: "WHEREAS, {{partyAName}} (\"Party A\") desires to engage {{partyBName}} (\"Party B\") for transportation and logistics services; and WHEREAS, Party B represents that it possesses the necessary authority, equipment, qualifications, and personnel to provide such services; NOW THEREFORE, in consideration of the mutual covenants herein, the parties agree as follows.", isModified: false },
    { id: "scope", title: "Scope of Services", body: "Party A engages Party B to provide transportation and logistics services as outlined in this Agreement and any associated rate confirmations, bills of lading, or load tenders incorporated herein by reference. Services shall be performed in accordance with all applicable federal, state, and local regulations, including FMCSA regulations (49 CFR Parts 371-399), DOT requirements, and PHMSA regulations where hazardous materials are involved.", isModified: false },
    { id: "term", title: "Term & Duration", body: "This Agreement shall be effective as of {{effectiveDate}} and shall remain in effect until {{expirationDate}}, unless earlier terminated in accordance with the terms herein. Upon expiration, this Agreement shall automatically renew for successive periods of equal duration unless either party provides written notice of non-renewal at least thirty (30) days prior to the expiration date.", isModified: false },
    { id: "authority", title: "Operating Authority & Compliance", body: "Party B represents and warrants that it holds valid operating authority issued by FMCSA and maintains all required licenses, permits, and registrations. Party B shall immediately notify Party A of any change in its operating authority status, any conditional or unsatisfactory safety rating, or any investigation or enforcement action. Loss of operating authority shall constitute automatic termination of this Agreement.", isModified: false },
    { id: "compensation", title: "Compensation & Rate Structure", body: "Party A shall compensate Party B at the agreed-upon rate of ${{baseRate}} {{rateType}} as specified in individual rate confirmations or load tenders. Payment shall be made within {{paymentTermDays}} days of receipt of proper invoice, signed bill of lading (BOL), proof of delivery (POD), and required supporting documentation. All rates are exclusive of the EusoTrip platform transaction fee, which applies per load as outlined in the platform Terms of Service.", isModified: false },
    { id: "detention", title: "Detention & Demurrage", body: "If loading or unloading exceeds two (2) hours of free time, detention charges shall accrue at $75.00 per hour or as specified in the applicable rate confirmation. Demurrage for tank trailers shall accrue at $150.00 per calendar day after the first twenty-four (24) hours of free time. Party B shall document all detention and demurrage time with timestamped records.", isModified: false },
    { id: "insurance", title: "Insurance Requirements", body: "Party B shall maintain with carriers rated A- VII or better by A.M. Best: (a) Commercial General Liability of $1,000,000 per occurrence; (b) Auto Liability of ${{minInsuranceAmount}} combined single limit per FMCSA requirements (49 CFR §387); (c) Cargo Insurance of ${{cargoInsuranceRequired}} per shipment; (d) Workers' Compensation as required by law. Certificates of insurance naming Party A as additional insured shall be provided prior to commencement of services.", isModified: false },
    { id: "cargo_liability", title: "Cargo Liability & Claims (Carmack Amendment)", body: "Party B shall be liable for loss, damage, or delay to cargo from pickup to delivery pursuant to the Carmack Amendment (49 USC §14706). Liability shall not exceed ${{liabilityLimit}} per occurrence unless a higher declared value is agreed in writing. Claims must be filed within nine (9) months of delivery. Party B shall acknowledge claims within thirty (30) days and pay, decline, or make a firm offer within one hundred twenty (120) days per 49 CFR §370.", isModified: false },
    { id: "indemnification", title: "Indemnification & Hold Harmless", body: "Each party shall indemnify, defend, and hold harmless the other party from claims, damages, losses, liabilities, costs, and expenses (including attorneys' fees) arising from: (a) the indemnifying party's negligence, willful misconduct, or breach; (b) bodily injury or death; (c) property damage; (d) violation of any law; or (e) environmental contamination caused by the indemnifying party. This obligation survives termination.", isModified: false },
    { id: "force_majeure", title: "Force Majeure", body: "Neither party shall be liable for failure or delay in performance due to causes beyond reasonable control, including: Acts of God, fire, flood, earthquake, hurricane, pandemic, war, terrorism, government action, embargo, pipeline failure, refinery shutdown, power outage, cybersecurity incident, or labor dispute. The affected party shall provide prompt written notice. If force majeure continues for more than thirty (30) days, either party may terminate without liability.", isModified: false },
    { id: "compliance", title: "Regulatory Compliance", body: "Both parties shall comply with all applicable laws including: FMCSA regulations (49 CFR); DOT safety regulations; OSHA standards; PHMSA hazmat regulations (49 CFR Parts 171-180) where applicable; EPA environmental regulations; Hours of Service (HOS) rules (49 CFR Part 395); Drug & Alcohol testing (49 CFR Part 382); ELD mandate (49 CFR Part 395 Subpart B); and the Anti-Coercion Rule (49 CFR §390.6). Party B shall not operate in violation of any out-of-service order.", isModified: false },
    { id: "independent_contractor", title: "Independent Contractor Relationship", body: "The relationship between the parties is that of independent contractors. Nothing herein creates an employer-employee, principal-agent, partnership, or joint venture relationship. Party B shall have exclusive control over the manner and means of performing services, including selection of routes, personnel, and equipment. Party B is solely responsible for all taxes, insurance, and compensation for its employees.", isModified: false },
    { id: "confidentiality", title: "Confidentiality & Data Protection", body: "Both parties shall keep confidential all proprietary information, trade secrets, customer lists, pricing structures, and business strategies (\"Confidential Information\"). Confidential Information shall not be disclosed to third parties without prior written consent, except as required by law. Each party shall implement reasonable security measures to protect Confidential Information. This obligation survives termination for three (3) years.", isModified: false },
    { id: "non_circumvention", title: "Non-Circumvention & Platform Integrity", body: "Both parties agree that all business relationships established through the EusoTrip platform shall be conducted through the platform for a period of {{nonCircumventionMonths}} months from initial introduction. Neither party shall circumvent the platform to eliminate or reduce transaction fees. Direct dealings outside the platform during the non-circumvention period shall entitle EusoTrip to a commission equal to applicable platform fees.", isModified: false },
    { id: "termination", title: "Termination", body: "Either party may terminate: (a) without cause, upon {{terminationNoticeDays}} days' written notice; (b) immediately for cause, upon material breach uncured for fifteen (15) days after written notice; (c) immediately upon bankruptcy, insolvency, or assignment for creditors; (d) immediately upon loss of operating authority, insurance, or required permits. Party B shall complete loads in transit; Party A shall pay for services rendered prior to termination.", isModified: false },
    { id: "dispute", title: "Dispute Resolution", body: "Disputes shall be resolved as follows: (a) good-faith negotiation for thirty (30) days; (b) mediation administered by JAMS or a mutually agreed mediator; (c) if unresolved within sixty (60) days, binding arbitration per the Commercial Arbitration Rules of the AAA, held in Houston, Texas. Either party may seek injunctive relief in any court of competent jurisdiction.", isModified: false },
    { id: "governing_law", title: "Governing Law & Jurisdiction", body: "This Agreement shall be governed by federal transportation law (49 USC Subtitle IV, Part B) to the extent applicable, and otherwise by the laws of the State of Texas, without regard to conflict of law provisions. The parties consent to exclusive jurisdiction and venue of the state and federal courts in Harris County, Texas.", isModified: false },
    { id: "electronic_signatures", title: "Electronic Signatures", body: "This Agreement may be executed electronically via EusoTrip's Gradient Ink™ digital signature system, in compliance with the E-SIGN Act (15 U.S.C. ch. 96) and UETA. Electronic signatures shall have the same legal force as original ink signatures. Each party consents to electronic records for all notices and communications under this Agreement.", isModified: false },
    { id: "severability", title: "Severability", body: "If any provision of this Agreement is held invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it valid while preserving the parties' original intent.", isModified: false },
    { id: "entire_agreement", title: "Entire Agreement & Amendments", body: "This Agreement, together with all exhibits, schedules, rate confirmations, and load tenders incorporated herein, constitutes the entire agreement and supersedes all prior negotiations, representations, and agreements. No modification shall be effective unless in writing and signed by both parties. Terms on bills of lading that conflict with this Agreement shall be governed by this Agreement except as required by law.", isModified: false },
    { id: "assignment", title: "Assignment & Subcontracting", body: "Neither party may assign this Agreement without prior written consent, except to an affiliate or in connection with a merger, acquisition, or sale of substantially all assets. Party B shall not subcontract, re-broker, or assign any load tendered under this Agreement without prior written consent of Party A per 49 CFR §371.3.", isModified: false },
    { id: "notices", title: "Notices", body: "All notices shall be in writing via: (a) the EusoTrip platform messaging system; (b) certified mail, return receipt requested; (c) nationally recognized overnight courier; or (d) email with confirmed receipt. Notices are effective upon delivery or three (3) business days after mailing.", isModified: false },
  ];

  // Add type-specific clauses
  const typeSpecific: Record<string, any[]> = {
    carrier_shipper: [
      { id: "equipment", title: "Equipment & Vehicle Requirements", body: "Party B shall provide equipment meeting the following specifications: {{equipmentTypes}}. All vehicles must pass DOT inspections per 49 CFR Part 396 and maintain current registration, safety certifications, and FMCSA inspection stickers. Equipment shall be clean, odor-free, and suitable for the cargo. Hazmat endorsement required: {{hazmatRequired}}. TWIC card required: {{twicRequired}}. Party B shall immediately report any equipment failure, accident, or cargo damage.", isModified: false },
      { id: "fuel_surcharge", title: "Fuel Surcharge Schedule", body: "Fuel surcharge shall be calculated based on {{fuelSurchargeType}} methodology. Current rate: {{fuelSurchargeValue}}. The base fuel price index shall be the U.S. DOE National Average Diesel Price published weekly. Adjustments effective the Monday following DOE publication. The parties may agree to a different methodology in individual rate confirmations.", isModified: false },
      { id: "loading_safety", title: "Loading, Unloading & Driver Safety", body: "Party A shall provide safe and accessible loading/unloading facilities. Party B's drivers shall not be required to perform lumper services or product handling unless specifically agreed and compensated. Party A shall comply with the Anti-Coercion Rule (49 CFR §390.6) and shall not coerce drivers to operate in violation of safety regulations, HOS limits, or vehicle weight laws.", isModified: false },
      { id: "hazmat_protocol", title: "Hazardous Materials Protocol", body: "Where hazardous materials are involved, both parties shall comply with PHMSA regulations (49 CFR Parts 171-180). Party A shall provide proper shipping papers, placards, and emergency response information per 49 CFR §172. Party B's drivers shall possess valid CDL with hazmat endorsement and current PHMSA training certification. Emergency procedures shall follow ERG 2024 guidelines. Contact CHEMTREC at 1-800-424-9300 for emergencies.", isModified: false },
    ],
    broker_carrier: [
      { id: "broker_authority", title: "Broker Authority & Relationship", body: "Party A (Broker) holds valid property broker authority (MC# {{partyAMc}}) and maintains the required surety bond or trust fund per 49 CFR §387.307 ($75,000 minimum). Party B (Carrier) holds valid motor carrier authority (MC# {{partyBMc}}, DOT# {{partyBDot}}) with a satisfactory or better safety rating. The relationship is that of independent contractors per 49 CFR §371.7. The Broker does not assume carrier liability under the Carmack Amendment.", isModified: false },
      { id: "double_brokering", title: "Prohibition of Double Brokering", body: "Party B shall not re-broker, co-broker, assign, transfer, or interline any loads tendered under this Agreement to any other carrier, broker, or third party without prior written consent of Party A. All loads must be transported on Party B's own equipment and under Party B's own operating authority. Violation constitutes grounds for immediate termination, forfeiture of payment for affected loads, and indemnification for all resulting damages.", isModified: false },
      { id: "broker_payment", title: "Payment Terms & Factoring", body: "Broker shall pay Carrier the agreed rate within {{paymentTermDays}} days of receipt of completed documentation. If Carrier factors its receivables, Carrier shall provide written notice and a valid notice of assignment. Broker shall not be liable for double payment. Rate confirmations govern over conflicting terms on bills of lading. Broker's surety bond information available upon request per 49 CFR §387.307.", isModified: false },
      { id: "carrier_selection", title: "Carrier Qualification & Monitoring", body: "Broker shall verify Carrier's operating authority, insurance, safety rating, and driver qualifications through the FMCSA SAFER system prior to tendering loads. Broker reserves the right to reject any driver or equipment that does not meet safety standards. Carrier shall maintain a satisfactory FMCSA safety rating throughout the term of this Agreement.", isModified: false },
    ],
    broker_shipper: [
      { id: "broker_fiduciary", title: "Broker Fiduciary Duty", body: "Party A (Broker) shall exercise reasonable care in selecting carriers and shall verify each carrier's operating authority, insurance, and safety record through the FMCSA SAFER system. Party A shall act in a fiduciary capacity regarding carrier selection and management. Party A shall disclose any carrier-related issues that may affect service quality or cargo safety.", isModified: false },
      { id: "shipper_obligations", title: "Shipper Obligations", body: "Party B (Shipper) shall provide accurate descriptions of cargo including weight, dimensions, commodity, value, and special handling requirements. Party B shall properly classify and label all hazardous materials per 49 CFR Part 172. Party B shall provide safe loading facilities and shall not detain carriers beyond the agreed free time.", isModified: false },
    ],
    carrier_driver: [
      { id: "ic_status", title: "Independent Contractor Classification", body: "Party B (Driver/Owner-Operator) is engaged as an independent contractor, not an employee. Party B maintains control over: (a) when and how long to work; (b) route selection; (c) vehicle maintenance and operation; (d) acceptance or rejection of load offers. Party A does not provide benefits, withhold taxes, or control the manner of Party B's performance.", isModified: false },
      { id: "lease_agreement", title: "Equipment Lease & Maintenance", body: "If Party B leases equipment from Party A, such lease shall comply with 49 CFR Part 376 (Lease and Interchange of Vehicles). The lease shall specify: compensation for equipment use, responsibility for maintenance and repairs, insurance allocation, and the requirement that all equipment display Party A's name and DOT number during the lease period.", isModified: false },
      { id: "settlement", title: "Settlement & Pay", body: "Party A shall provide itemized settlement statements within fifteen (15) days of load completion, detailing: gross revenue, all deductions, fuel charges, advances, and net pay. All deductions must be authorized in writing. Party B shall receive not less than the agreed percentage of line-haul revenue as specified in the individual rate confirmation.", isModified: false },
    ],
    escort_service: [
      { id: "escort_requirements", title: "Escort Vehicle Requirements", body: "Party B shall provide certified escort/pilot car services in compliance with all applicable state requirements. Escort vehicles must be equipped with required signage (\"OVERSIZE LOAD\" / \"WIDE LOAD\"), lighting, flags, height poles, and two-way communication equipment. Vehicles must be in good mechanical condition, properly registered and insured.", isModified: false },
      { id: "state_permits", title: "State Permits & Certifications", body: "Party B shall maintain current escort vehicle permits and operator certifications for all states in which services are performed. Party B is responsible for permit renewals and compliance with state-specific reciprocity requirements. Party B shall be familiar with state-specific escort vehicle laws for each route.", isModified: false },
      { id: "route_survey", title: "Route Survey & Planning", body: "For loads requiring permits, Party B shall conduct or assist with route surveys identifying potential obstacles including low bridges, narrow roads, construction zones, and utility conflicts. Party B shall communicate all route hazards to the carrier and relevant authorities in advance of the move.", isModified: false },
    ],
    master_service: [
      { id: "sla_framework", title: "Service Level Agreement (SLA)", body: "Party B shall meet the following performance standards: (a) On-time pickup: 95% or better; (b) On-time delivery: 93% or better; (c) Claims ratio: less than 1% of total shipments; (d) Tender acceptance: 90% or better during contract period. Performance shall be measured quarterly. Failure to meet SLA targets for two consecutive quarters may result in rate renegotiation or termination.", isModified: false },
      { id: "volume_commitment", title: "Volume Commitment & Pricing Tiers", body: "Party A commits to tender a minimum volume as specified in the lane schedule attached hereto. Rates are based on the committed volume. If actual volume falls below 80% of commitment, Party B may adjust rates to the next applicable tier. If actual volume exceeds 120% of commitment, the parties shall negotiate a volume discount in good faith.", isModified: false },
    ],
  };

  const specific = typeSpecific[type] || [];
  return [...commonClauses.slice(0, 4), ...specific, ...commonClauses.slice(4)];
}
