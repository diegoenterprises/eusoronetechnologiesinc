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
// Files for BOTH partyA and partyB (shipper, catalyst, broker — all types)
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
    catalyst_shipper: "CS",
    broker_catalyst: "BC",
    broker_shipper: "BS",
    catalyst_driver: "CD",
    escort_service: "ES",
    dispatch_dispatch: "CT",
    terminal_access: "TA",
    master_service: "MS",
    lane_commitment: "LC",
    fuel_surcharge: "FS",
    accessorial_schedule: "AS",
    nda: "NDA",
    factoring: "FA",
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
  const partyAName = (inputs.partyASignerName as string) || (inputs.partyAName as string) || "Party A";
  const partyACompanyName = (inputs.partyACompanyName as string) || (inputs.partyACompany as string) || "";
  const partyBName = (inputs.partyBSignerName as string) || (inputs.partyBName as string) || "Party B";
  const partyBCompanyName = (inputs.partyBCompanyName as string) || (inputs.partyBCompany as string) || "";
  const jurisdiction = (inputs.jurisdiction as string) || "Texas";

  const typeTitle: Record<string, string> = {
    catalyst_shipper: "CATALYST-SHIPPER TRANSPORTATION AGREEMENT",
    broker_catalyst: "BROKER-CATALYST AGREEMENT",
    broker_shipper: "BROKER-SHIPPER AGREEMENT",
    catalyst_driver: "CATALYST-DRIVER INDEPENDENT CONTRACTOR AGREEMENT",
    escort_service: "ESCORT/PILOT CAR SERVICE AGREEMENT",
    dispatch_dispatch: "DISPATCH SERVICE AGREEMENT",
    terminal_access: "TERMINAL ACCESS & SERVICES AGREEMENT",
    master_service: "MASTER SERVICE AGREEMENT",
    lane_commitment: "LANE COMMITMENT AGREEMENT",
    fuel_surcharge: "FUEL SURCHARGE SCHEDULE",
    accessorial_schedule: "ACCESSORIAL CHARGES SCHEDULE",
    nda: "NON-DISCLOSURE AGREEMENT",
    factoring: "FREIGHT FACTORING AGREEMENT",
    custom: "SERVICE AGREEMENT",
  };

  let content = `${typeTitle[type] || "AGREEMENT"}\n\n`;
  content += `Date: ${now}\n\n`;
  content += `This Agreement ("Agreement") is entered into by and between:\n\n`;
  content += `PARTY A (${(inputs.partyARole as string)?.toUpperCase() || "SHIPPER"}):\n`;
  if (partyACompanyName) content += `  Company: ${partyACompanyName}\n`;
  content += `  Authorized Signatory: ${partyAName}\n`;
  if (inputs.partyADot) content += `  DOT#: ${inputs.partyADot}\n`;
  if (inputs.partyAMc) content += `  MC#: ${inputs.partyAMc}\n`;
  content += `\nPARTY B (${(inputs.partyBRole as string)?.toUpperCase() || "CATALYST"}):\n`;
  if (partyBCompanyName) content += `  Company: ${partyBCompanyName}\n`;
  content += `  Authorized Signatory: ${partyBName}\n`;
  if (inputs.partyBDot) content += `  DOT#: ${inputs.partyBDot}\n`;
  if (inputs.partyBMc) content += `  MC#: ${inputs.partyBMc}\n`;
  content += `\nGoverning Jurisdiction: State of ${jurisdiction}\n`;
  content += `\n${"---".repeat(20)}\n\n`;

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

  content += `${"---".repeat(20)}\n\n`;
  content += `SIGNATURES\n\n`;
  content += `Party A: ${partyACompanyName || partyAName}\nAuthorized Signatory: ${partyAName}\nSignature: _________________________\nDate: _______________\n\n`;
  content += `Party B: ${partyBCompanyName || partyBName}\nAuthorized Signatory: ${partyBName}\nSignature: _________________________\nDate: _______________\n\n`;
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
          db.select({
            id: agreements.id,
            agreementNumber: agreements.agreementNumber,
            agreementType: agreements.agreementType,
            contractDuration: agreements.contractDuration,
            status: agreements.status,
            partyAUserId: agreements.partyAUserId,
            partyARole: agreements.partyARole,
            partyBUserId: agreements.partyBUserId,
            partyBRole: agreements.partyBRole,
            partyBCompanyId: agreements.partyBCompanyId,
            baseRate: agreements.baseRate,
            rateType: agreements.rateType,
            paymentTermDays: agreements.paymentTermDays,
            effectiveDate: agreements.effectiveDate,
            expirationDate: agreements.expirationDate,
            equipmentTypes: agreements.equipmentTypes,
            hazmatRequired: agreements.hazmatRequired,
            generatedContent: agreements.generatedContent,
            isEncrypted: agreements.isEncrypted,
            createdAt: agreements.createdAt,
            updatedAt: agreements.updatedAt,
          }).from(agreements)
            .where(whereClause)
            .orderBy(desc(agreements.updatedAt))
            .limit(input.limit)
            .offset(input.offset),
          db.select({ count: sql<number>`count(*)` }).from(agreements).where(whereClause),
        ]);

        return { agreements: results.map(decryptAgreement), total: countResult[0]?.count || 0 };
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
          ...decryptAgreement(agreement),
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
      const validTypes = ["catalyst_shipper","broker_catalyst","broker_shipper","catalyst_driver","escort_service","dispatch_dispatch","terminal_access","master_service","lane_commitment","fuel_surcharge","accessorial_schedule","nda","factoring","custom"];
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
        partyADot ? fmcsaService.verifyCatalyst(partyADot).catch(() => null) : Promise.resolve(null),
        partyBDot ? fmcsaService.verifyCatalyst(partyBDot).catch(() => null) : Promise.resolve(null),
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
      // 1) Block if catalyst has Unsatisfactory safety rating or no operating authority
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
            `Catalysts must have active operating authority and a satisfactory or conditional safety rating.`
          );
        }
      }

      // 2) Insurance minimum checks
      const INSURANCE_MINIMUMS: Record<string, number> = {
        catalyst_shipper: 750000,
        broker_catalyst: 750000,
        broker_shipper: 75000,    // Broker bond minimum
        catalyst_driver: 750000,
        escort_service: 300000,
        master_service: 750000,
        lane_commitment: 750000,
        dispatch_dispatch: 75000,
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

      // 4) Cargo insurance check for catalyst agreements
      const catalystTypes = ["catalyst_shipper", "broker_catalyst", "catalyst_driver", "master_service", "lane_commitment"];
      if (catalystTypes.includes(input.agreementType)) {
        if (!input.cargoInsuranceRequired || Number(input.cargoInsuranceRequired) < 100000) {
          fmcsaVerification.warnings.push(
            "Cargo insurance should be at least $100,000 for catalyst agreements per industry standards"
          );
        }
      }

      // 5) Hazmat authority check
      if (input.hazmatRequired && partyBVerification?.catalyst) {
        if (partyBVerification.catalyst.hmFlag !== "Y") {
          fmcsaVerification.blockers.push("Party B is not registered for hazmat with FMCSA but agreement requires hazmat");
          throw new Error(
            "Agreement generation blocked: Party B (catalyst) is not registered for hazardous materials " +
            "with FMCSA, but this agreement requires hazmat authorization. " +
            "The catalyst must obtain hazmat authorization before proceeding."
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
          partyALegalName: partyAVerification?.catalyst?.legalName || null,
          partyBLegalName: partyBVerification?.catalyst?.legalName || null,
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
              role: (input.partyBRole as any) || "CATALYST",
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

      // Pre-flight: verify agreements table exists
      try {
        const [tableCheck] = await db.execute(sql`SELECT 1 FROM agreements LIMIT 1`);
        console.log("[EUSOCONTRACT] agreements table accessible");
      } catch (tableErr: any) {
        console.error("[EUSOCONTRACT] TABLE CHECK FAILED:", tableErr?.message);
        // Try to create the table via raw SQL as a last resort
        try {
          await db.execute(sql`CREATE TABLE IF NOT EXISTS agreements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            agreementNumber VARCHAR(50) NOT NULL UNIQUE,
            templateId INT,
            agreementType ENUM('catalyst_shipper','broker_catalyst','broker_shipper','catalyst_driver','escort_service','dispatch_dispatch','terminal_access','master_service','lane_commitment','fuel_surcharge','accessorial_schedule','nda','factoring','custom') NOT NULL,
            contractDuration ENUM('spot','short_term','long_term','evergreen') NOT NULL DEFAULT 'spot',
            partyAUserId INT NOT NULL,
            partyACompanyId INT,
            partyARole VARCHAR(50) NOT NULL,
            partyBUserId INT NOT NULL,
            partyBCompanyId INT,
            partyBRole VARCHAR(50) NOT NULL,
            rateType ENUM('per_mile','flat_rate','percentage','per_hour','per_ton','per_gallon','custom'),
            baseRate DECIMAL(12,2),
            currency VARCHAR(3) DEFAULT 'USD',
            fuelSurchargeType ENUM('none','fixed','doe_index','percentage','custom') DEFAULT 'none',
            fuelSurchargeValue DECIMAL(10,4),
            minimumCharge DECIMAL(10,2),
            maximumCharge DECIMAL(10,2),
            paymentTermDays INT DEFAULT 30,
            paymentMethod VARCHAR(50),
            quickPayDiscount DECIMAL(5,2),
            quickPayDays INT,
            minInsuranceAmount DECIMAL(12,2),
            liabilityLimit DECIMAL(12,2),
            cargoInsuranceRequired DECIMAL(12,2),
            equipmentTypes JSON,
            hazmatRequired BOOLEAN DEFAULT FALSE,
            twicRequired BOOLEAN DEFAULT FALSE,
            tankerEndorsementRequired BOOLEAN DEFAULT FALSE,
            lanes TEXT,
            volumeCommitmentTotal INT,
            volumeCommitmentPeriod VARCHAR(20),
            accessorialSchedule TEXT,
            generatedContent TEXT,
            clauses TEXT,
            strategicInputs TEXT,
            originalDocumentUrl TEXT,
            status ENUM('draft','pending_review','negotiating','pending_signature','active','expired','terminated','cancelled','suspended','renewed') NOT NULL DEFAULT 'draft',
            effectiveDate TIMESTAMP NULL,
            expirationDate TIMESTAMP NULL,
            terminationDate TIMESTAMP NULL,
            autoRenew BOOLEAN DEFAULT FALSE,
            renewalTermDays INT,
            renewalNoticeDays INT DEFAULT 30,
            terminationNoticeDays INT DEFAULT 30,
            nonCircumventionEnabled BOOLEAN DEFAULT TRUE,
            nonCircumventionMonths INT DEFAULT 24,
            platformFeeAcknowledged BOOLEAN DEFAULT TRUE,
            notes TEXT,
            tags JSON,
            isEncrypted BOOLEAN DEFAULT FALSE,
            encryptionVersion VARCHAR(10),
            createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deletedAt TIMESTAMP NULL
          )`);
          console.log("[EUSOCONTRACT] Created agreements table via raw SQL");
        } catch (createErr: any) {
          console.error("[EUSOCONTRACT] CREATE TABLE also failed:", createErr?.message);
        }
      }

      // Normalize enum values to match DB schema
      const RATE_TYPE_MAP: Record<string, string> = { flat: "flat_rate", hourly: "per_hour", "per-mile": "per_mile", per_mile: "per_mile", flat_rate: "flat_rate", percentage: "percentage", per_hour: "per_hour", per_ton: "per_ton", per_gallon: "per_gallon", custom: "custom" };
      const FUEL_TYPE_MAP: Record<string, string> = { none: "none", fixed: "fixed", doe_index: "doe_index", percentage: "percentage", custom: "custom", variable: "custom" };
      const safeRateType = RATE_TYPE_MAP[input.rateType || ""] || null;
      const safeFuelType = FUEL_TYPE_MAP[input.fuelSurchargeType || "none"] || "none";

      // Use raw SQL to bypass Drizzle ORM serialization issues
      let result: any;
      try {
        const [insertResult] = await db.execute(sql`INSERT INTO agreements
          (agreementNumber, templateId, agreementType, contractDuration,
           partyAUserId, partyACompanyId, partyARole,
           partyBUserId, partyBCompanyId, partyBRole,
           rateType, baseRate, currency, fuelSurchargeType, fuelSurchargeValue,
           minimumCharge, maximumCharge, paymentTermDays,
           quickPayDiscount, quickPayDays,
           minInsuranceAmount, liabilityLimit, cargoInsuranceRequired,
           equipmentTypes, hazmatRequired, twicRequired, tankerEndorsementRequired,
           lanes, accessorialSchedule, generatedContent, clauses, strategicInputs,
           status, effectiveDate, expirationDate,
           autoRenew, notes, isEncrypted, encryptionVersion, platformFeeAcknowledged)
          VALUES (
           ${agreementNumber}, ${input.templateId ?? null}, ${input.agreementType}, ${input.contractDuration || "spot"},
           ${numericUserId}, ${ctx.user?.companyId ?? null}, ${ctx.user?.role || "SHIPPER"},
           ${partyBId}, ${input.partyBCompanyId ?? null}, ${input.partyBRole},
           ${safeRateType}, ${input.baseRate?.toString() ?? null}, ${"USD"}, ${safeFuelType}, ${input.fuelSurchargeValue?.toString() ?? null},
           ${input.minimumCharge?.toString() ?? null}, ${input.maximumCharge?.toString() ?? null}, ${input.paymentTermDays || 30},
           ${input.quickPayDiscount?.toString() ?? null}, ${input.quickPayDays ?? null},
           ${input.minInsuranceAmount?.toString() ?? null}, ${input.liabilityLimit?.toString() ?? null}, ${input.cargoInsuranceRequired?.toString() ?? null},
           ${JSON.stringify(input.equipmentTypes || [])}, ${input.hazmatRequired ? 1 : 0}, ${input.twicRequired ? 1 : 0}, ${input.tankerEndorsementRequired ? 1 : 0},
           ${encryptJSON(input.lanes || [])}, ${encryptJSON(input.accessorialSchedule || [])}, ${encryptField(aiResult.content)}, ${encryptJSON(finalClauses)}, ${encryptJSON(input.strategicInputs)},
           ${"draft"}, ${input.effectiveDate ? new Date(input.effectiveDate) : null}, ${input.expirationDate ? new Date(input.expirationDate) : null},
           ${input.autoRenew ? 1 : 0}, ${input.notes ? encryptField(input.notes) : null}, ${1}, ${ENC_VERSION}, ${1}
          )`);
        const insertId = (insertResult as any)?.insertId;
        result = [{ id: insertId ? Number(insertId) : null }];
        console.log("[EUSOCONTRACT] Agreement inserted successfully, id:", result[0]?.id);
      } catch (insertErr: any) {
        const sqlMsg = insertErr?.sqlMessage || insertErr?.cause?.sqlMessage || "";
        const errCode = insertErr?.code || insertErr?.cause?.code || "";
        const errNo = insertErr?.errno || insertErr?.cause?.errno || "";
        console.error("[EUSOCONTRACT] RAW INSERT ERROR:", errCode, errNo, sqlMsg);
        console.error("[EUSOCONTRACT] Full:", (insertErr?.message || "").slice(0, 500));
        throw new Error(`DB ${errCode}(${errNo}): ${sqlMsg || (insertErr?.message || "").slice(-150)}`);
      }

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
            legalName: partyAVerification.catalyst?.legalName || null,
            isValid: partyAVerification.isValid,
            safetyRating: partyAVerification.safetyRating?.rating || "Not Rated",
            hasActiveAuthority: partyAVerification.authorities?.some((a: any) => a.authorityStatus === "Active") || false,
            insuranceOnFile: (partyAVerification.insurance?.length || 0) > 0,
          } : null,
          partyB: partyBVerification ? {
            dotNumber: partyBDot,
            legalName: partyBVerification.catalyst?.legalName || null,
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
    { id: "insurance", title: "Insurance Requirements", body: "Party B shall maintain with catalysts rated A- VII or better by A.M. Best: (a) Commercial General Liability of $1,000,000 per occurrence; (b) Auto Liability of ${{minInsuranceAmount}} combined single limit per FMCSA requirements (49 CFR §387); (c) Cargo Insurance of ${{cargoInsuranceRequired}} per shipment; (d) Workers' Compensation as required by law. Certificates of insurance naming Party A as additional insured shall be provided prior to commencement of services.", isModified: false },
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
    catalyst_shipper: [
      { id: "equipment", title: "Equipment & Vehicle Requirements", body: "Party B shall provide equipment meeting the following specifications: {{equipmentTypes}}. All vehicles must pass DOT inspections per 49 CFR Part 396 and maintain current registration, safety certifications, and FMCSA inspection stickers. Equipment shall be clean, odor-free, and suitable for the cargo. Hazmat endorsement required: {{hazmatRequired}}. TWIC card required: {{twicRequired}}. Party B shall immediately report any equipment failure, accident, or cargo damage.", isModified: false },
      { id: "fuel_surcharge", title: "Fuel Surcharge Schedule", body: "Fuel surcharge shall be calculated based on {{fuelSurchargeType}} methodology. Current rate: {{fuelSurchargeValue}}. The base fuel price index shall be the U.S. DOE National Average Diesel Price published weekly. Adjustments effective the Monday following DOE publication. The parties may agree to a different methodology in individual rate confirmations.", isModified: false },
      { id: "loading_safety", title: "Loading, Unloading & Driver Safety", body: "Party A shall provide safe and accessible loading/unloading facilities. Party B's drivers shall not be required to perform lumper services or product handling unless specifically agreed and compensated. Party A shall comply with the Anti-Coercion Rule (49 CFR §390.6) and shall not coerce drivers to operate in violation of safety regulations, HOS limits, or vehicle weight laws.", isModified: false },
      { id: "hazmat_protocol", title: "Hazardous Materials Protocol", body: "Where hazardous materials are involved, both parties shall comply with PHMSA regulations (49 CFR Parts 171-180). Party A shall provide proper shipping papers, placards, and emergency response information per 49 CFR §172. Party B's drivers shall possess valid CDL with hazmat endorsement and current PHMSA training certification. Emergency procedures shall follow ERG 2024 guidelines. Contact CHEMTREC at 1-800-424-9300 for emergencies.", isModified: false },
    ],
    broker_catalyst: [
      { id: "broker_authority", title: "Broker Authority & Relationship", body: "Party A (Broker) holds valid property broker authority (MC# {{partyAMc}}) and maintains the required surety bond or trust fund per 49 CFR §387.307 ($75,000 minimum). Party B (Catalyst) holds valid motor catalyst authority (MC# {{partyBMc}}, DOT# {{partyBDot}}) with a satisfactory or better safety rating. The relationship is that of independent contractors per 49 CFR §371.7. The Broker does not assume catalyst liability under the Carmack Amendment.", isModified: false },
      { id: "double_brokering", title: "Prohibition of Double Brokering", body: "Party B shall not re-broker, co-broker, assign, transfer, or interline any loads tendered under this Agreement to any other catalyst, broker, or third party without prior written consent of Party A. All loads must be transported on Party B's own equipment and under Party B's own operating authority. Violation constitutes grounds for immediate termination, forfeiture of payment for affected loads, and indemnification for all resulting damages.", isModified: false },
      { id: "broker_payment", title: "Payment Terms & Factoring", body: "Broker shall pay Catalyst the agreed rate within {{paymentTermDays}} days of receipt of completed documentation. If Catalyst factors its receivables, Catalyst shall provide written notice and a valid notice of assignment. Broker shall not be liable for double payment. Rate confirmations govern over conflicting terms on bills of lading. Broker's surety bond information available upon request per 49 CFR §387.307.", isModified: false },
      { id: "catalyst_selection", title: "Catalyst Qualification & Monitoring", body: "Broker shall verify Catalyst's operating authority, insurance, safety rating, and driver qualifications through the FMCSA SAFER system prior to tendering loads. Broker reserves the right to reject any driver or equipment that does not meet safety standards. Catalyst shall maintain a satisfactory FMCSA safety rating throughout the term of this Agreement.", isModified: false },
    ],
    broker_shipper: [
      { id: "broker_fiduciary", title: "Broker Fiduciary Duty", body: "Party A (Broker) shall exercise reasonable care in selecting catalysts and shall verify each catalyst's operating authority, insurance, and safety record through the FMCSA SAFER system. Party A shall act in a fiduciary capacity regarding catalyst selection and management. Party A shall disclose any catalyst-related issues that may affect service quality or cargo safety.", isModified: false },
      { id: "shipper_obligations", title: "Shipper Obligations", body: "Party B (Shipper) shall provide accurate descriptions of cargo including weight, dimensions, commodity, value, and special handling requirements. Party B shall properly classify and label all hazardous materials per 49 CFR Part 172. Party B shall provide safe loading facilities and shall not detain catalysts beyond the agreed free time.", isModified: false },
    ],
    catalyst_driver: [
      { id: "ic_status", title: "Independent Contractor Classification", body: "Party B (Driver/Owner-Operator) is engaged as an independent contractor, not an employee. Party B maintains control over: (a) when and how long to work; (b) route selection; (c) vehicle maintenance and operation; (d) acceptance or rejection of load offers. Party A does not provide benefits, withhold taxes, or control the manner of Party B's performance.", isModified: false },
      { id: "lease_agreement", title: "Equipment Lease & Maintenance", body: "If Party B leases equipment from Party A, such lease shall comply with 49 CFR Part 376 (Lease and Interchange of Vehicles). The lease shall specify: compensation for equipment use, responsibility for maintenance and repairs, insurance allocation, and the requirement that all equipment display Party A's name and DOT number during the lease period.", isModified: false },
      { id: "settlement", title: "Settlement & Pay", body: "Party A shall provide itemized settlement statements within fifteen (15) days of load completion, detailing: gross revenue, all deductions, fuel charges, advances, and net pay. All deductions must be authorized in writing. Party B shall receive not less than the agreed percentage of line-haul revenue as specified in the individual rate confirmation.", isModified: false },
    ],
    escort_service: [
      { id: "escort_requirements", title: "Escort Vehicle Requirements", body: "Party B shall provide certified escort/pilot car services in compliance with all applicable state requirements. Escort vehicles must be equipped with required signage (\"OVERSIZE LOAD\" / \"WIDE LOAD\"), lighting, flags, height poles, and two-way communication equipment. Vehicles must be in good mechanical condition, properly registered and insured.", isModified: false },
      { id: "state_permits", title: "State Permits & Certifications", body: "Party B shall maintain current escort vehicle permits and operator certifications for all states in which services are performed. Party B is responsible for permit renewals and compliance with state-specific reciprocity requirements. Party B shall be familiar with state-specific escort vehicle laws for each route.", isModified: false },
      { id: "route_survey", title: "Route Survey & Planning", body: "For loads requiring permits, Party B shall conduct or assist with route surveys identifying potential obstacles including low bridges, narrow roads, construction zones, and utility conflicts. Party B shall communicate all route hazards to the catalyst and relevant authorities in advance of the move.", isModified: false },
    ],
    master_service: [
      { id: "sla_framework", title: "Service Level Agreement (SLA)", body: "Party B shall meet the following performance standards: (a) On-time pickup: 95% or better; (b) On-time delivery: 93% or better; (c) Claims ratio: less than 1% of total shipments; (d) Tender acceptance: 90% or better during contract period. Performance shall be measured quarterly. Failure to meet SLA targets for two consecutive quarters may result in rate renegotiation or termination.", isModified: false },
      { id: "volume_commitment", title: "Volume Commitment & Pricing Tiers", body: "Party A commits to tender a minimum volume as specified in the lane schedule attached hereto. Rates are based on the committed volume. If actual volume falls below 80% of commitment, Party B may adjust rates to the next applicable tier. If actual volume exceeds 120% of commitment, the parties shall negotiate a volume discount in good faith.", isModified: false },
    ],
    dispatch_dispatch: [
      { id: "dispatch_authority", title: "Dispatch Authority & Scope", body: "Party A (Dispatch/Dispatcher) is authorized to act as a dispatch service provider for Party B (Catalyst) in securing freight and managing load assignments. Party A shall use best efforts to identify, negotiate, and secure profitable loads matching Party B's equipment, lane preferences, and operational capacity. Party A does not assume catalyst liability, broker authority, or motor catalyst operating authority. Party A acts solely as an agent of Party B for dispatch coordination purposes.", isModified: false },
      { id: "dispatch_fee", title: "Dispatch Fee Structure", body: "Party B shall pay Party A a dispatch fee of {{baseRate}} {{rateType}} for each load successfully dispatched and completed. Fees are earned upon confirmed delivery and proper documentation submission. Party A may offer tiered pricing: (a) Standard Dispatch: percentage of gross line-haul revenue; (b) Premium Dispatch: flat fee per load plus percentage; (c) Dedicated Dispatch: monthly retainer for guaranteed availability. Payment shall be deducted from settlement or invoiced separately within {{paymentTermDays}} days.", isModified: false },
      { id: "catalyst_obligations", title: "Catalyst Obligations & Communication", body: "Party B shall: (a) maintain valid FMCSA operating authority, insurance, and safety ratings throughout the term; (b) promptly communicate equipment availability, preferred lanes, and scheduling constraints; (c) accept or decline dispatched loads within two (2) hours of notification; (d) provide real-time location updates via the EusoTrip platform during transit; (e) immediately report any service failures, delays, accidents, or cargo issues. Party B retains sole authority to accept or reject any load offer.", isModified: false },
      { id: "dispatch_exclusivity", title: "Exclusivity & Non-Solicitation", body: "During the term and for {{nonCircumventionMonths}} months following termination, Party B shall not directly contact or solicit business from shippers, brokers, or consignees introduced by Party A through the EusoTrip platform without Party A's written consent. This non-solicitation does not apply to relationships that existed prior to this Agreement. Party A shall not dispatch loads to competing catalysts on the same lane without Party B's knowledge during exclusive lane commitments.", isModified: false },
      { id: "performance_metrics", title: "Dispatch Performance Standards", body: "Party A shall maintain the following performance standards: (a) Load matching accuracy: 85% or better based on equipment and lane preferences; (b) Rate negotiation: within 5% of market average or better; (c) Communication response time: within thirty (30) minutes during business hours; (d) Load tender confirmation: within four (4) hours of availability notification. Performance shall be tracked via the EusoTrip platform analytics dashboard.", isModified: false },
    ],
    terminal_access: [
      { id: "facility_access", title: "Terminal Facility Access & Hours", body: "Party A (Terminal Operator) grants Party B (Catalyst/Shipper) access to the terminal facility located at {{facilityAddress}} for the purpose of loading, unloading, storage, and related logistics operations. Access hours: {{accessHours}}. After-hours access requires prior written approval and may incur additional charges. Party B shall comply with all posted facility rules, speed limits, traffic patterns, and safety requirements.", isModified: false },
      { id: "appointment_scheduling", title: "Appointment Scheduling & Compliance", body: "All loading and unloading operations require advance scheduling through the EusoTrip Appointment Scheduler. Party B shall: (a) schedule appointments at least twenty-four (24) hours in advance; (b) arrive within the thirty (30) minute appointment window; (c) provide accurate vehicle, driver, and cargo information at booking. Late arrivals may be rescheduled at Party A's discretion. No-shows shall incur a fee of $150 per occurrence. Three consecutive no-shows may result in access suspension.", isModified: false },
      { id: "loading_rack_operations", title: "Loading Rack & Dock Operations", body: "Party B's drivers shall: (a) check in at the guard house upon arrival with valid CDL, shipping documents, and appointment confirmation; (b) proceed only to assigned rack, dock, or bay number; (c) follow all loading/unloading procedures posted at each station; (d) remain with the vehicle during all product transfer operations; (e) verify product type, quantity, and quality before departure; (f) obtain signed Bill of Lading (BOL) before leaving the facility. Drivers who fail to follow procedures may be removed from the approved driver list.", isModified: false },
      { id: "terminal_safety", title: "Terminal Safety & Environmental Compliance", body: "While on terminal premises, Party B shall comply with: (a) OSHA safety standards (29 CFR Part 1910); (b) EPA environmental regulations (40 CFR Parts 260-280) for petroleum facilities; (c) PHMSA hazardous materials regulations; (d) Terminal-specific safety orientation requirements; (e) No smoking, no open flames, no cell phone use in designated hazardous areas; (f) Mandatory use of PPE as posted (hard hat, safety glasses, FRC clothing, steel-toe boots). Spills must be reported immediately to terminal personnel. Party B shall be liable for cleanup costs resulting from Party B's negligence.", isModified: false },
      { id: "product_custody", title: "Product Custody Transfer & SPECTRA-MATCH", body: "Custody of product transfers from Party A to Party B upon completion of loading and Party B's signature on the BOL. Product identification shall be verified using the EusoTrip SPECTRA-MATCH system where available. Any product quality discrepancies must be reported before departure. Party A warrants that products loaded meet the specifications stated on the BOL. Party B assumes full responsibility for product integrity from the point of loading to delivery.", isModified: false },
      { id: "terminal_fees", title: "Terminal Service Fees & Charges", body: "Party B shall pay the following terminal fees: (a) Loading/Unloading Fee: ${{baseRate}} per transaction; (b) Storage Fee: as specified in the rate schedule attached hereto; (c) Detention: $75/hour after two (2) hours of free time; (d) Demurrage (tank trailers): $150/calendar day after twenty-four (24) hour free time; (e) After-Hours Surcharge: 1.5x standard rate; (f) Product Heating: at cost plus 15%; (g) Rush Loading: $250 surcharge. Fees shall be invoiced monthly; payment due within {{paymentTermDays}} days.", isModified: false },
    ],
    lane_commitment: [
      { id: "lane_definition", title: "Lane Definition & Volume", body: "This Lane Commitment covers the transportation corridor(s) specified in Exhibit A (Lane Schedule). Each lane defines: origin terminal/facility, destination terminal/facility, distance, transit time, and committed weekly/monthly volume. Party A commits to tender not less than {{volumeCommitmentTotal}} loads per {{volumeCommitmentPeriod}} on the defined lanes. Party B commits to maintain sufficient capacity to accept not less than 90% of tenders on committed lanes.", isModified: false },
      { id: "lane_pricing", title: "Lane-Specific Pricing", body: "Rates for committed lanes are fixed for the contract period unless adjusted per the fuel surcharge schedule. Base rate: ${{baseRate}} {{rateType}} for the primary lane(s). Rates include standard accessorial services. Non-standard accessorials (detention, layover, TONU) are charged per the Accessorial Schedule. If market rates increase by more than 15% above the contracted rate, either party may request a rate review. Rate adjustments require mutual written agreement.", isModified: false },
      { id: "lane_performance", title: "Lane Performance & Penalties", body: "Performance metrics for lane commitments: (a) Tender acceptance rate: 90% minimum; (b) On-time pickup: 95% minimum; (c) On-time delivery: 93% minimum; (d) Claims ratio: less than 0.5% of lane shipments. Failure to meet volume commitment: Party A shall pay a shortfall fee equal to 25% of the rate for each uncommitted load. Failure to accept tenders: Party B shall pay a tender rejection fee of $100 per rejected load beyond the 10% allowance.", isModified: false },
    ],
    fuel_surcharge: [
      { id: "fsc_methodology", title: "Fuel Surcharge Calculation Methodology", body: "The fuel surcharge (\"FSC\") shall be calculated using the following methodology: (a) Index: U.S. Department of Energy (DOE) National Average Diesel Fuel Price, published weekly; (b) Base Price: ${{fuelSurchargeValue}} per gallon (the \"base\" at which FSC = $0.00); (c) Adjustment Increment: For each $0.01 increase above the base price, FSC increases by $0.01 per mile; (d) Effective Date: Adjustments take effect the Monday following DOE publication; (e) Minimum FSC: $0.00 (no negative surcharge). The FSC applies to all loaded miles and is stated separately on all rate confirmations and invoices.", isModified: false },
      { id: "fsc_alternative", title: "Alternative Fuel Surcharge Methods", body: "The parties may alternatively agree to: (a) Fixed FSC: A flat per-mile or percentage surcharge reviewed quarterly; (b) Percentage-Based: FSC as a percentage of the line-haul rate, adjusted monthly based on the DOE index; (c) All-In Rate: No separate FSC, with fuel cost embedded in the contracted rate, subject to quarterly review. The selected method is specified in the individual rate confirmation. Any change in methodology requires thirty (30) days' written notice.", isModified: false },
      { id: "fsc_disputes", title: "Fuel Surcharge Disputes & Audit", body: "Either party may audit fuel surcharge calculations with ten (10) business days' written notice. Discrepancies exceeding $50.00 per invoice shall be corrected within thirty (30) days with interest at 1.5% per month on underpayments. The DOE published index is the sole reference; no alternative indices shall be used without mutual agreement.", isModified: false },
    ],
    accessorial_schedule: [
      { id: "standard_accessorials", title: "Standard Accessorial Charges", body: "The following standard accessorial charges apply to all loads under this Agreement unless otherwise specified in an individual rate confirmation: (a) Detention at Origin: $75/hour after two (2) hours free time; (b) Detention at Destination: $75/hour after two (2) hours free time; (c) Driver Layover: $350/day when overnight rest is required due to shipper/consignee delay; (d) Truck Ordered Not Used (TONU): $250 flat fee; (e) Lumper/Unloading: At cost plus $25 administrative fee with receipt; (f) Stop-Off Charge: $100 per additional stop; (g) Reconsignment/Diversion: $200 per occurrence plus any additional mileage at the contracted per-mile rate.", isModified: false },
      { id: "special_accessorials", title: "Special Service & Equipment Charges", body: "Special accessorial charges: (a) Hazmat Surcharge: $200-$500 per load based on hazmat class; (b) Tanker Endorsement Surcharge: $150 per load; (c) TWIC Card Surcharge: $75 per load at TWIC-required facilities; (d) Team Driver Service: 1.5x standard rate; (e) Refrigerated/Temperature-Controlled: $0.15/mile surcharge; (f) Oversize/Overweight Permit Fees: At cost plus 10%; (g) Escort Vehicle Charges: Per separate Escort Service Agreement; (h) Tarping: $75-$150 per load; (i) Inside Delivery: $150 per occurrence.", isModified: false },
      { id: "accessorial_documentation", title: "Accessorial Documentation & Claims", body: "All accessorial charges must be supported by: (a) Timestamped documentation (detention logs, photos, GPS records); (b) Signed acknowledgment from facility personnel where applicable; (c) Itemized receipts for pass-through costs (lumper, permits, tolls). Accessorial claims must be submitted within thirty (30) days of the load delivery date. Undocumented accessorial charges will not be honored. Disputes shall follow the standard dispute resolution process outlined in this Agreement.", isModified: false },
    ],
    nda: [
      { id: "nda_definition", title: "Definition of Confidential Information", body: "\"Confidential Information\" means all non-public information disclosed by either party (\"Disclosing Party\") to the other party (\"Receiving Party\"), whether orally, in writing, electronically, or by inspection, including but not limited to: (a) business strategies, financial data, pricing structures, and customer lists; (b) proprietary technology, algorithms, software, and trade secrets (including SPECTRA-MATCH and ESANG AI systems); (c) load data, routing information, catalyst networks, and shipper relationships; (d) personnel information, compensation structures, and organizational charts; (e) any information marked \"Confidential\" or that a reasonable person would understand to be confidential.", isModified: false },
      { id: "nda_obligations", title: "Obligations of Receiving Party", body: "The Receiving Party shall: (a) use Confidential Information solely for the purpose of evaluating or performing under the business relationship between the parties; (b) restrict disclosure to employees, agents, and contractors with a need-to-know who are bound by confidentiality obligations at least as restrictive as this Agreement; (c) protect Confidential Information using the same degree of care used to protect its own confidential information, but no less than reasonable care; (d) not reverse engineer, decompile, or disassemble any technology or software provided as Confidential Information; (e) promptly notify the Disclosing Party of any unauthorized disclosure or use.", isModified: false },
      { id: "nda_exclusions", title: "Exclusions & Permitted Disclosures", body: "Confidential Information does not include information that: (a) is or becomes publicly available through no fault of the Receiving Party; (b) was known to the Receiving Party prior to disclosure; (c) is independently developed by the Receiving Party without reference to Confidential Information; (d) is lawfully received from a third party without restriction. The Receiving Party may disclose Confidential Information if required by law, regulation, or court order, provided it gives prompt written notice to the Disclosing Party and cooperates in seeking a protective order.", isModified: false },
      { id: "nda_term_return", title: "Term, Return & Destruction", body: "This NDA shall remain in effect for three (3) years from the Effective Date and shall survive termination of the underlying business relationship for an additional two (2) years. Upon termination or request, the Receiving Party shall promptly return or destroy all Confidential Information and certify destruction in writing. Notwithstanding the foregoing, the Receiving Party may retain copies as required by law or internal compliance policies, subject to continued confidentiality obligations.", isModified: false },
      { id: "nda_remedies", title: "Remedies & Injunctive Relief", body: "The parties acknowledge that breach of this Agreement may cause irreparable harm for which monetary damages would be inadequate. The Disclosing Party shall be entitled to seek injunctive relief in any court of competent jurisdiction without the requirement of posting a bond, in addition to all other remedies available at law or in equity. The prevailing party in any enforcement action shall be entitled to recover reasonable attorneys' fees and costs.", isModified: false },
    ],
    factoring: [
      { id: "factoring_relationship", title: "Factoring Relationship & Notice of Assignment", body: "Party A (Factoring Company) agrees to purchase eligible accounts receivable from Party B (Catalyst) arising from freight transportation services. Party B hereby assigns and transfers to Party A all right, title, and interest in the purchased receivables (\"Notice of Assignment\"). Party B shall provide a Notice of Assignment to each debtor (broker/shipper) upon execution of this Agreement. All payments for factored invoices shall be remitted directly to Party A. Party A is not a lender; this is a purchase of receivables per Article 9 of the Uniform Commercial Code (UCC).", isModified: false },
      { id: "advance_rate", title: "Advance Rate & Reserve Account", body: "Upon purchase of an eligible invoice, Party A shall advance Party B {{baseRate}}% of the face value of the invoice (the \"Advance\"). The remaining balance, less factoring fees, shall be held in a Reserve Account and released to Party B upon full collection from the debtor. Standard advance rate: 95% for approved debtors. Quick Pay advance rate: 97% with expedited funding within four (4) hours. Party A may adjust advance rates based on debtor creditworthiness, invoice aging, and portfolio concentration.", isModified: false },
      { id: "factoring_fees", title: "Factoring Fees & Rate Schedule", body: "Party B shall pay the following fees: (a) Standard Factoring Fee: {{fuelSurchargeValue}}% of the invoice face value for invoices collected within thirty (30) days; (b) Extended Fee: Additional 0.5% for each ten (10) day period beyond thirty (30) days; (c) Quick Pay Fee: 3.0% of face value for same-day or four-hour funding; (d) Wire Transfer Fee: $25 per outgoing wire; (e) ACH Transfer: No charge; (f) Monthly Minimum: $0 for the first ninety (90) days, then $250/month minimum volume. All fees are deducted from the Reserve Account upon collection.", isModified: false },
      { id: "debtor_approval", title: "Debtor Approval & Credit Limits", body: "Party A shall evaluate and approve debtors (shippers and brokers) prior to purchasing invoices. Approval criteria include: (a) business credit score and payment history; (b) FMCSA broker authority status and surety bond verification; (c) Days Sales Outstanding (DSO) history; (d) concentration limits (no single debtor exceeding 30% of portfolio). Party A reserves the right to decline any invoice or debtor. Party B shall not factor invoices to unapproved debtors. Credit limits are reviewed quarterly and may be adjusted with written notice.", isModified: false },
      { id: "recourse", title: "Recourse & Chargebacks", body: "This Agreement is with recourse. If a debtor fails to pay an invoice within ninety (90) days of the invoice date, Party A may charge back the advanced amount to Party B's Reserve Account. Party B shall cooperate in all collection efforts. Party A shall not charge back invoices where non-payment is due to a valid dispute between Party B and the debtor unless the dispute is attributable to Party B's failure to perform. Party A shall provide thirty (30) days' written notice before executing any chargeback.", isModified: false },
      { id: "catalyst_warranties", title: "Catalyst Warranties & Representations", body: "Party B warrants that: (a) each factored invoice represents a bona fide, completed transportation service; (b) the invoiced amount is accurate and not subject to prior assignment, lien, or encumbrance; (c) Party B has not received payment or partial payment on the invoice from any source; (d) Party B holds valid FMCSA operating authority and insurance; (e) Party B will not double-factor or assign the same invoice to multiple factoring companies. Breach of any warranty entitles Party A to immediate chargeback plus a $500 penalty per occurrence.", isModified: false },
    ],
  };

  const specific = typeSpecific[type] || [];
  return [...commonClauses.slice(0, 4), ...specific, ...commonClauses.slice(4)];
}
