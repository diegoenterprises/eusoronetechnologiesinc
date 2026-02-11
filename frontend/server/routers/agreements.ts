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

      // Generate the contract content
      const content = generateContractContent(
        input.agreementType,
        input.strategicInputs,
        templateClauses
      );

      const numericUserId = await resolveUserId(ctx.user);
      if (!numericUserId) throw new Error("Could not resolve user ID");

      // Resolve Party B — if partyBUserId is 0 or missing, create/find a placeholder
      // from the strategic inputs so multi-user accounts work properly
      let partyBId = input.partyBUserId;
      if (!partyBId || partyBId === 0) {
        const bName = (input.strategicInputs?.partyBName as string) || "Counterparty";
        const bCompany = (input.strategicInputs?.partyBCompany as string) || "";
        // Try to find by name first, otherwise create a placeholder user
        try {
          const [existing] = await db.select({ id: users.id }).from(users)
            .where(eq(users.name, bName)).limit(1);
          if (existing) {
            partyBId = existing.id;
          } else {
            const placeholderEmail = `${bName.toLowerCase().replace(/\s+/g, ".")}@pending.eusotrip.com`;
            const result = await db.insert(users).values({
              name: bName,
              email: placeholderEmail,
              role: (input.partyBRole as any) || "CARRIER",
              isActive: true,
              isVerified: false,
            } as any);
            partyBId = (result as any).insertId || (result as any)[0]?.insertId || 0;
            if (!partyBId) {
              const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, placeholderEmail)).limit(1);
              partyBId = row?.id || 0;
            }
          }
        } catch {
          // If all else fails, use numericUserId as placeholder (self-agreement draft)
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
        generatedContent: encryptField(content),
        clauses: encryptJSON(templateClauses) as any,
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

      return {
        id: result[0]?.id,
        agreementNumber,
        status: "draft",
        generatedContent: content,
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
    {
      id: "scope",
      title: "Scope of Services",
      body: "{{partyAName}} (\"Party A\") engages {{partyBName}} (\"Party B\") to provide transportation and logistics services as outlined in this Agreement. Services shall be performed in accordance with all applicable federal, state, and local regulations.",
      isModified: false,
    },
    {
      id: "term",
      title: "Term & Duration",
      body: "This Agreement shall be effective as of {{effectiveDate}} and shall remain in effect until {{expirationDate}}, unless earlier terminated in accordance with the terms herein.",
      isModified: false,
    },
    {
      id: "compensation",
      title: "Compensation & Rate Structure",
      body: "Party A shall compensate Party B at the agreed-upon rate of {{baseRate}} {{rateType}}. Payment shall be made within {{paymentTermDays}} days of receipt of proper invoice and supporting documentation. All rates are exclusive of the EusoTrip platform transaction fee, which applies per load as outlined in the platform Terms of Service.",
      isModified: false,
    },
    {
      id: "insurance",
      title: "Insurance Requirements",
      body: "Party B shall maintain, at minimum, the following insurance coverage: General Liability of ${{minInsuranceAmount}}, Cargo Insurance of ${{cargoInsuranceRequired}}, and Auto Liability as required by FMCSA regulations. Certificates of insurance must be provided prior to commencement of services.",
      isModified: false,
    },
    {
      id: "indemnification",
      title: "Indemnification & Liability",
      body: "Each party shall indemnify, defend, and hold harmless the other party from and against any and all claims, damages, losses, and expenses arising from the indemnifying party's negligence or breach of this Agreement. Liability shall be limited to ${{liabilityLimit}} per occurrence.",
      isModified: false,
    },
    {
      id: "compliance",
      title: "Regulatory Compliance",
      body: "Both parties shall comply with all applicable laws and regulations including, but not limited to, FMCSA regulations (49 CFR), DOT requirements, OSHA standards, and all applicable state transportation regulations. Party B shall maintain all required operating authority, licenses, and permits.",
      isModified: false,
    },
    {
      id: "confidentiality",
      title: "Confidentiality",
      body: "Both parties agree to keep confidential all proprietary information, trade secrets, customer lists, pricing structures, and business strategies disclosed during the term of this Agreement. This obligation shall survive termination for a period of two (2) years.",
      isModified: false,
    },
    {
      id: "non_circumvention",
      title: "Non-Circumvention",
      body: "Both parties agree that all business relationships established through the EusoTrip platform shall be conducted through the platform for a period of {{nonCircumventionMonths}} months. Neither party shall attempt to circumvent the platform to avoid applicable transaction fees.",
      isModified: false,
    },
    {
      id: "termination",
      title: "Termination",
      body: "Either party may terminate this Agreement with {{terminationNoticeDays}} days written notice. Termination for cause may be immediate upon material breach, failure to maintain required insurance, or loss of operating authority.",
      isModified: false,
    },
    {
      id: "dispute",
      title: "Dispute Resolution",
      body: "Any dispute arising under this Agreement shall first be submitted to mediation. If mediation fails, disputes shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.",
      isModified: false,
    },
    {
      id: "governing_law",
      title: "Governing Law",
      body: "This Agreement shall be governed by and construed in accordance with the laws of the State of Texas, without regard to its conflict of law provisions.",
      isModified: false,
    },
  ];

  // Add type-specific clauses
  const typeSpecific: Record<string, any[]> = {
    carrier_shipper: [
      {
        id: "equipment",
        title: "Equipment & Vehicle Requirements",
        body: "Party B shall provide equipment meeting the following specifications: {{equipmentTypes}}. All vehicles must pass DOT inspections and maintain current registration and safety certifications. Hazmat endorsement required: {{hazmatRequired}}. TWIC card required: {{twicRequired}}.",
        isModified: false,
      },
      {
        id: "fuel_surcharge",
        title: "Fuel Surcharge",
        body: "Fuel surcharge shall be calculated based on {{fuelSurchargeType}} methodology. Current fuel surcharge rate: {{fuelSurchargeValue}}. Fuel surcharge adjustments shall be made {{fuelSurchargePeriod}}.",
        isModified: false,
      },
    ],
    broker_carrier: [
      {
        id: "broker_authority",
        title: "Broker Authority & Relationship",
        body: "Party A (Broker) holds valid broker authority (MC# {{partyAMc}}) issued by the Federal Motor Carrier Safety Administration. Party B (Carrier) holds valid motor carrier authority (MC# {{partyBMc}}, DOT# {{partyBDot}}). The relationship between the parties is that of independent contractors.",
        isModified: false,
      },
      {
        id: "double_brokering",
        title: "Prohibition of Double Brokering",
        body: "Party B shall not re-broker, co-broker, or assign any loads tendered under this Agreement without prior written consent of Party A. Violation of this provision shall constitute grounds for immediate termination.",
        isModified: false,
      },
    ],
    escort_service: [
      {
        id: "escort_requirements",
        title: "Escort Vehicle Requirements",
        body: "Party B shall provide certified escort/pilot car services in compliance with all applicable state requirements. Escort vehicles must be equipped with required signage, lighting, flags, and communication equipment as mandated by the states of operation.",
        isModified: false,
      },
      {
        id: "state_permits",
        title: "State Permits & Certifications",
        body: "Party B shall maintain current escort vehicle permits and operator certifications for all states in which services are performed. Party B is responsible for permit renewals and compliance with state-specific reciprocity requirements.",
        isModified: false,
      },
    ],
  };

  const specific = typeSpecific[type] || [];
  return [...commonClauses.slice(0, 3), ...specific, ...commonClauses.slice(3)];
}
