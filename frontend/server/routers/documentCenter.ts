/**
 * DOCUMENT CENTER ROUTER
 * Smart document management with compliance tracking, expiration monitoring,
 * role-based requirements, 50-state matrix, and document awareness engine.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, sql, isNull, inArray } from "drizzle-orm";
import { auditedProtectedProcedure, auditedAdminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  documentTypes,
  documentRequirements,
  userDocuments,
  userDocumentRequirements,
  docComplianceStatus,
  stateDocRequirements,
  userOperatingStates,
  documentTemplates,
  documentNotifications,
  users,
} from "../../drizzle/schema";
import { storagePut, storageGet } from "../storage";
import { encrypt, decrypt, hashForIndex } from "../_core/encryption";
import { documentTypesSeed } from "../seeds/documentTypesSeed";
import { documentRequirementsSeed, TRAILER_TYPE_CONDITIONS } from "../seeds/documentRequirementsSeed";
import { stateRequirementsSeed } from "../seeds/stateRequirementsSeed";
import { resolveCompanyCompliance, resolveDriverCompliance } from "../services/complianceEngine";
import { companies } from "../../drizzle/schema";

// ============================================================================
// HELPER: Resolve numeric userId from auth context
// ============================================================================

async function resolveUserId(ctx: any): Promise<number> {
  const id = Number(ctx.user?.id);
  if (!isNaN(id) && id > 0) return id;

  const db = await getDb();
  if (!db || !ctx.user?.email) throw new TRPCError({ code: "UNAUTHORIZED" });

  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, ctx.user.email))
    .limit(1);

  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
  return row.id;
}

// ============================================================================
// HELPER: Calculate document awareness for a user
// ============================================================================

interface DocumentAwareness {
  complianceScore: number;
  canOperate: boolean;
  hasBlockingIssues: boolean;
  totalRequired: number;
  totalUploaded: number;
  totalVerified: number;
  totalMissing: number;
  totalExpired: number;
  totalExpiringSoon: number;
  totalPendingReview: number;
  totalRejected: number;
  required: any[];
  missing: any[];
  expiring: any[];
  expired: any[];
  pending: any[];
  rejected: any[];
  verified: any[];
  urgentActions: any[];
  nextExpirationDate: string | null;
  nextExpiringDocument: string | null;
  calculatedAt: Date;
}

async function calculateDocumentAwareness(userId: number, userRole: string): Promise<DocumentAwareness> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // 1. Get role-based requirements
  const roleReqs = await db
    .select()
    .from(documentRequirements)
    .where(eq(documentRequirements.requiredForRole, userRole as any));

  // 2. Get user's uploaded documents (active, not deleted, not superseded)
  const uploadedDocs = await db
    .select()
    .from(userDocuments)
    .where(
      and(
        eq(userDocuments.userId, userId),
        isNull(userDocuments.deletedAt),
        isNull(userDocuments.supersededAt)
      )
    );

  // 3. Get all document types for name lookup
  const allTypes = await db.select().from(documentTypes);
  const typeMap = new Map(allTypes.map((t) => [t.id, t]));

  // 3b. Resolve active condition flags AND state info from user metadata (single query)
  //     Conditions: trailer types → HAZMAT/TANKER/OVERSIZE flags
  //     States: registered state, CDL state, operating states from metadata
  const activeConditions = new Set<string>();
  let registeredState: string | null = null;
  let cdlState: string | null = null;
  const operatingStateCodes = new Set<string>();

  try {
    const [userRow] = await db.select({ metadata: users.metadata }).from(users).where(eq(users.id, userId)).limit(1);
    if (userRow?.metadata) {
      const meta = typeof userRow.metadata === "string" ? JSON.parse(userRow.metadata) : userRow.metadata;
      const reg = meta?.registration || {};

      // --- Condition flags ---
      const trailerTypes: string[] = reg.equipmentTypes || reg.catalystType || [];
      for (const tt of trailerTypes) {
        const conditions = TRAILER_TYPE_CONDITIONS[tt] || [];
        for (const c of conditions) activeConditions.add(c);
      }
      if (reg.hazmatEndorsed || reg.hazmatEndorsement || meta?.complianceIds?.dotHazmatPermit) {
        activeConditions.add("HAZMAT");
      }
      if (reg.tankerEndorsed || reg.tankerEndorsement) {
        activeConditions.add("TANKER");
      }

      // --- State info ---
      registeredState = reg.state || reg.companyState || reg.registeredState || meta?.state || null;
      cdlState = reg.cdlState || reg.cdlIssuingState || null;
      const metaOpStates: string[] = reg.operatingStates || [];
      for (const s of metaOpStates) {
        if (s && s.length === 2) operatingStateCodes.add(s.toUpperCase());
      }
    }
  } catch (e) {
    console.warn("[DocumentCenter] Could not parse user metadata:", e);
  }

  // Also read from userOperatingStates table
  try {
    const opStates = await db.select().from(userOperatingStates).where(eq(userOperatingStates.userId, userId));
    for (const os of opStates) {
      operatingStateCodes.add(os.stateCode);
      if (os.isRegisteredState && !registeredState) registeredState = os.stateCode;
      if (os.isHomeState && !cdlState) cdlState = os.stateCode;
    }
  } catch (e) {
    console.warn("[DocumentCenter] Could not query userOperatingStates:", e);
  }

  // The home/registered state is always an operating state
  if (registeredState) operatingStateCodes.add(registeredState);
  if (cdlState) operatingStateCodes.add(cdlState);

  // 3d. Query state-specific requirements for all relevant states
  let stateReqs: any[] = [];
  const allStateCodes = Array.from(operatingStateCodes);
  if (allStateCodes.length > 0) {
    try {
      stateReqs = await db
        .select()
        .from(stateDocRequirements)
        .where(inArray(stateDocRequirements.stateCode, allStateCodes));
    } catch (e) {
      console.warn("[DocumentCenter] Could not query stateDocRequirements:", e);
    }
  }

  // Filter state reqs: only include if userRole is in requiredForRoles array
  // and any conditions (e.g., OVERSIZE) are met by activeConditions.
  const roleUpper = userRole.toUpperCase();
  const filteredStateReqs = stateReqs.filter((sr) => {
    // Check role
    let roles: string[] = [];
    if (Array.isArray(sr.requiredForRoles)) {
      roles = sr.requiredForRoles;
    } else if (typeof sr.requiredForRoles === "string") {
      try { roles = JSON.parse(sr.requiredForRoles); } catch { roles = []; }
    }
    if (!roles.some((r: string) => r.toUpperCase() === roleUpper)) return false;

    // Check conditions (e.g., oversize permits only for flatbed operators)
    if (sr.conditions) {
      const conds = typeof sr.conditions === "string" ? JSON.parse(sr.conditions) : sr.conditions;
      if (conds.trailerType) {
        if (!activeConditions.has(conds.trailerType)) return false;
      }
    }

    return true;
  });

  // 4. Build status for each required document — filter conditionals
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const required: any[] = [];
  const addedDocs = new Set<string>();

  // Helper: build a requirement entry with status from uploaded docs
  function buildReqEntry(opts: {
    documentTypeId: string;
    isRequired: boolean;
    isBlocking: boolean;
    priority: number;
    reason: string;
    stateCode?: string | null;
    statePortalUrl?: string | null;
    stateIssuingAgency?: string | null;
    stateFormNumber?: string | null;
    stateFormUrl?: string | null;
    validityPeriod?: string | null;
    filingFee?: string | null;
    notes?: string | null;
  }) {
    const docType = typeMap.get(opts.documentTypeId);
    const uploaded = uploadedDocs.find((d) => d.documentTypeId === opts.documentTypeId);

    let status = "NOT_UPLOADED";
    let daysUntilExpiry: number | null = null;
    let isExpired = false;
    let isExpiringSoon = false;
    let actionRequired: "UPLOAD" | "RENEW" | "RESUBMIT" | "NONE" = "UPLOAD";

    if (uploaded) {
      status = uploaded.status || "PENDING_REVIEW";

      if (uploaded.expiresAt) {
        const expiryDate = new Date(uploaded.expiresAt);
        const diffMs = expiryDate.getTime() - today.getTime();
        daysUntilExpiry = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        isExpired = daysUntilExpiry < 0;
        isExpiringSoon =
          daysUntilExpiry >= 0 && daysUntilExpiry <= (docType?.expirationWarningDays || 30);

        if (isExpired) {
          status = "EXPIRED";
          actionRequired = "RENEW";
        } else if (isExpiringSoon && status === "VERIFIED") {
          status = "EXPIRING_SOON";
          actionRequired = "RENEW";
        }
      }

      if (status === "VERIFIED" && !isExpiringSoon) {
        actionRequired = "NONE";
      } else if (status === "REJECTED") {
        actionRequired = "RESUBMIT";
      } else if (status === "PENDING_REVIEW") {
        actionRequired = "NONE";
      }
    }

    return {
      documentTypeId: opts.documentTypeId,
      documentTypeName: docType?.name || opts.documentTypeId,
      category: docType?.category || "OTHER",
      isRequired: opts.isRequired,
      isBlocking: opts.isBlocking,
      priority: opts.priority,
      requirementReason: opts.reason,
      status,
      currentDocumentId: uploaded?.id || null,
      expiresAt: uploaded?.expiresAt || null,
      daysUntilExpiry,
      isExpired,
      isExpiringSoon,
      uploadedAt: uploaded?.uploadedAt || null,
      verifiedAt: uploaded?.verifiedAt || null,
      rejectionReason: uploaded?.rejectionReason || null,
      actionRequired,
      actionUrl: `/documents/upload/${opts.documentTypeId}`,
      downloadTemplateUrl: opts.stateFormUrl || opts.statePortalUrl || docType?.downloadUrl || docType?.sourceUrl || null,
      // State-specific metadata (null for federal docs)
      stateCode: opts.stateCode || null,
      statePortalUrl: opts.statePortalUrl || null,
      stateIssuingAgency: opts.stateIssuingAgency || null,
      stateFormNumber: opts.stateFormNumber || null,
      validityPeriod: opts.validityPeriod || null,
      filingFee: opts.filingFee || null,
      notes: opts.notes || null,
      isStateSpecific: !!opts.stateCode,
    };
  }

  // 4a. Federal role-based requirements
  for (const req of roleReqs) {
    if (addedDocs.has(req.documentTypeId)) continue;

    // Skip conditional requirements whose condition is not met
    if (req.conditionType && req.conditionValue != null) {
      const conditionMet = activeConditions.has(req.conditionType);
      const expectedValue = req.conditionValue === true || req.conditionValue === "true" || req.conditionValue === 1;
      if (conditionMet !== expectedValue) continue;
    }

    addedDocs.add(req.documentTypeId);
    required.push(buildReqEntry({
      documentTypeId: req.documentTypeId,
      isRequired: req.isRequired ?? true,
      isBlocking: req.isBlocking ?? true,
      priority: req.priority || 1,
      reason: `Required for ${userRole} role`,
    }));
  }

  // 4b. State-specific requirements (merged, deduped by stateCode+docTypeId)
  const addedStateDocs = new Set<string>();
  for (const sr of filteredStateReqs) {
    const stateDocKey = `${sr.stateCode}:${sr.documentTypeId}`;
    if (addedStateDocs.has(stateDocKey)) continue;
    addedStateDocs.add(stateDocKey);

    // For state docs, use a composite key so the same doc type can appear
    // for multiple states (e.g., STATE_IFTA for TX and CA)
    // But don't duplicate if the federal list already has the exact same docTypeId
    // (state docs are additive — they supplement, not replace)
    const isHomeState = sr.stateCode === registeredState || sr.stateCode === cdlState;
    const reason = isHomeState
      ? `Required by ${sr.stateName} (home state)`
      : `Required for operations in ${sr.stateName}`;

    required.push(buildReqEntry({
      documentTypeId: sr.documentTypeId,
      isRequired: sr.isRequired ?? true,
      isBlocking: isHomeState,
      priority: isHomeState ? 1 : 2,
      reason,
      stateCode: sr.stateCode,
      statePortalUrl: sr.statePortalUrl,
      stateIssuingAgency: sr.stateIssuingAgency,
      stateFormNumber: sr.stateFormNumber,
      stateFormUrl: sr.stateFormUrl,
      validityPeriod: sr.validityPeriod,
      filingFee: sr.filingFee,
      notes: sr.notes,
    }));
  }

  // 5. Categorize
  const missing = required.filter((d) => d.status === "NOT_UPLOADED" && d.isRequired);
  const expiring = required.filter((d) => d.status === "EXPIRING_SOON");
  const expired = required.filter((d) => d.status === "EXPIRED");
  const pending = required.filter((d) => d.status === "PENDING_REVIEW");
  const rejected = required.filter((d) => d.status === "REJECTED");
  const verified = required.filter((d) => d.status === "VERIFIED");

  // 6. Compliance score
  const totalRequired = required.filter((d) => d.isRequired).length;
  const totalCompliant = verified.length + pending.length * 0.5;
  const complianceScore = totalRequired > 0 ? Math.round((totalCompliant / totalRequired) * 100) : 100;

  // 7. Blocking issues
  const blockingMissing = missing.filter((d) => d.isBlocking);
  const blockingExpired = expired.filter((d) => d.isBlocking);
  const hasBlockingIssues = blockingMissing.length > 0 || blockingExpired.length > 0;
  const canOperate = !hasBlockingIssues;

  // 8. Urgent actions
  const urgentActions: any[] = [];
  for (const doc of blockingMissing) {
    urgentActions.push({
      documentTypeId: doc.documentTypeId,
      documentTypeName: doc.documentTypeName,
      actionType: "UPLOAD_MISSING",
      severity: "CRITICAL",
      message: `${doc.documentTypeName} is required to operate on the platform`,
      dueDate: null,
      blocksOperations: true,
    });
  }
  for (const doc of blockingExpired) {
    urgentActions.push({
      documentTypeId: doc.documentTypeId,
      documentTypeName: doc.documentTypeName,
      actionType: "REVIEW_EXPIRED",
      severity: "CRITICAL",
      message: `${doc.documentTypeName} has expired and must be renewed`,
      dueDate: null,
      blocksOperations: true,
    });
  }
  for (const doc of expiring.filter((d) => d.daysUntilExpiry !== null && d.daysUntilExpiry <= 7)) {
    urgentActions.push({
      documentTypeId: doc.documentTypeId,
      documentTypeName: doc.documentTypeName,
      actionType: "RENEW_EXPIRING",
      severity: "HIGH",
      message: `${doc.documentTypeName} expires in ${doc.daysUntilExpiry} days`,
      dueDate: doc.expiresAt,
      blocksOperations: doc.isBlocking,
    });
  }
  for (const doc of rejected) {
    urgentActions.push({
      documentTypeId: doc.documentTypeId,
      documentTypeName: doc.documentTypeName,
      actionType: "FIX_REJECTED",
      severity: doc.isBlocking ? "HIGH" : "MEDIUM",
      message: `${doc.documentTypeName} was rejected: ${doc.rejectionReason || "Please resubmit"}`,
      dueDate: null,
      blocksOperations: doc.isBlocking,
    });
  }

  const severityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  urgentActions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // 9. Next expiration
  const nextExpiring = expiring
    .filter((d) => d.expiresAt)
    .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())[0];

  const awareness: DocumentAwareness = {
    complianceScore,
    canOperate,
    hasBlockingIssues,
    totalRequired,
    totalUploaded: uploadedDocs.length,
    totalVerified: verified.length,
    totalMissing: missing.length,
    totalExpired: expired.length,
    totalExpiringSoon: expiring.length,
    totalPendingReview: pending.length,
    totalRejected: rejected.length,
    required,
    missing,
    expiring,
    expired,
    pending,
    rejected,
    verified,
    urgentActions,
    nextExpirationDate: nextExpiring?.expiresAt || null,
    nextExpiringDocument: nextExpiring?.documentTypeId || null,
    calculatedAt: today,
  };

  // 10. Cache compliance status
  try {
    const overallStatus = hasBlockingIssues
      ? "NON_COMPLIANT"
      : expiring.length > 0
      ? "AT_RISK"
      : "COMPLIANT";

    const existing = await db
      .select({ id: docComplianceStatus.id })
      .from(docComplianceStatus)
      .where(eq(docComplianceStatus.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(docComplianceStatus)
        .set({
          overallStatus,
          complianceScore,
          canOperate,
          totalRequired,
          totalUploaded: uploadedDocs.length,
          totalVerified: verified.length,
          totalMissing: missing.length,
          totalExpired: expired.length,
          totalExpiringSoon: expiring.length,
          totalPendingReview: pending.length,
          totalRejected: rejected.length,
          hasBlockingIssues,
          calculatedAt: today,
        })
        .where(eq(docComplianceStatus.userId, userId));
    } else {
      await db.insert(docComplianceStatus).values({
        userId,
        overallStatus,
        complianceScore,
        canOperate,
        totalRequired,
        totalUploaded: uploadedDocs.length,
        totalVerified: verified.length,
        totalMissing: missing.length,
        totalExpired: expired.length,
        totalExpiringSoon: expiring.length,
        totalPendingReview: pending.length,
        totalRejected: rejected.length,
        hasBlockingIssues,
        calculatedAt: today,
      });
    }
  } catch (e) {
    console.error("[DocumentCenter] Failed to cache compliance status:", e);
  }

  return awareness;
}

// ============================================================================
// ROUTER
// ============================================================================

export const documentCenterRouter = router({
  // =========================================================================
  // DOCUMENT CENTER — Main Dashboard
  // =========================================================================

  getDocumentCenter: auditedProtectedProcedure.query(async ({ ctx }) => {
    const userId = await resolveUserId(ctx);
    const userRole = ctx.user?.role || "DRIVER";
    const awareness = await calculateDocumentAwareness(userId, userRole);

    return {
      summary: {
        complianceScore: awareness.complianceScore,
        canOperate: awareness.canOperate,
        totalRequired: awareness.totalRequired,
        totalCompleted: awareness.totalVerified + awareness.totalPendingReview,
        totalMissing: awareness.totalMissing,
        totalExpiring: awareness.totalExpiringSoon,
        totalIssues: awareness.totalExpired + awareness.totalRejected + awareness.totalMissing,
      },
      urgentActions: awareness.urgentActions.slice(0, 5),
      documents: {
        all: awareness.required,
        missing: awareness.missing,
        expiring: awareness.expiring,
        expired: awareness.expired,
        pending: awareness.pending,
        rejected: awareness.rejected,
        verified: awareness.verified,
      },
      nextExpiration: awareness.nextExpirationDate
        ? { date: awareness.nextExpirationDate, documentTypeId: awareness.nextExpiringDocument }
        : null,
      hasBlockingIssues: awareness.hasBlockingIssues,
      calculatedAt: awareness.calculatedAt,
    };
  }),

  // =========================================================================
  // DOCUMENT TYPES
  // =========================================================================

  getDocumentTypes: auditedProtectedProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const types = await db
        .select()
        .from(documentTypes)
        .where(eq(documentTypes.isActive, true))
        .orderBy(documentTypes.sortOrder);

      let filtered = types;
      if (input?.category) {
        filtered = types.filter((t) => t.category === input.category);
      }

      return filtered.map((t) => ({
        id: t.id,
        category: t.category,
        name: t.name,
        shortName: t.shortName,
        description: t.description,
        formNumber: t.formNumber,
        hasExpiration: t.hasExpiration,
        downloadUrl: t.downloadUrl,
        sourceUrl: t.sourceUrl,
        verificationLevel: t.verificationLevel,
        acceptedFileTypes: t.acceptedFileTypes,
        maxFileSizeMb: t.maxFileSizeMb,
      }));
    }),

  getDocumentType: auditedProtectedProcedure
    .input(z.object({ documentTypeId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [docType] = await db
        .select()
        .from(documentTypes)
        .where(eq(documentTypes.id, input.documentTypeId))
        .limit(1);

      if (!docType) throw new TRPCError({ code: "NOT_FOUND", message: "Document type not found" });

      const templates = await db
        .select()
        .from(documentTemplates)
        .where(
          and(
            eq(documentTemplates.documentTypeId, input.documentTypeId),
            eq(documentTemplates.isActive, true)
          )
        );

      return {
        ...docType,
        templates: templates.map((t) => ({
          id: t.id,
          name: t.name,
          version: t.version,
          templateUrl: t.templateUrl,
          stateCode: t.stateCode,
        })),
      };
    }),

  // =========================================================================
  // USER DOCUMENTS — CRUD
  // =========================================================================

  getMyDocuments: auditedProtectedProcedure
    .input(
      z
        .object({
          status: z.enum(["all", "verified", "pending", "rejected", "expired"]).default("all"),
          category: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const userId = await resolveUserId(ctx);

      const docs = await db
        .select()
        .from(userDocuments)
        .where(
          and(
            eq(userDocuments.userId, userId),
            isNull(userDocuments.deletedAt),
            isNull(userDocuments.supersededAt)
          )
        )
        .orderBy(desc(userDocuments.uploadedAt));

      // Get type names
      const allTypes = await db.select().from(documentTypes);
      const typeMap = new Map(allTypes.map((t) => [t.id, t]));

      let filtered = docs;
      if (input?.status && input.status !== "all") {
        const statusMap: Record<string, string[]> = {
          verified: ["VERIFIED"],
          pending: ["PENDING_REVIEW"],
          rejected: ["REJECTED"],
          expired: ["EXPIRED"],
        };
        filtered = docs.filter((d) => statusMap[input.status]?.includes(d.status));
      }

      return filtered.map((doc) => {
        const docType = typeMap.get(doc.documentTypeId);
        return {
          id: doc.id,
          documentTypeId: doc.documentTypeId,
          documentTypeName: docType?.name || doc.documentTypeId,
          category: docType?.category || "OTHER",
          fileName: doc.fileName,
          status: doc.status,
          documentNumberLast4: doc.documentNumberLast4,
          issuedDate: doc.issuedDate,
          expiresAt: doc.expiresAt,
          uploadedAt: doc.uploadedAt,
          verifiedAt: doc.verifiedAt,
          rejectionReason: doc.rejectionReason,
          version: doc.version,
        };
      });
    }),

  getDocument: auditedProtectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const userId = await resolveUserId(ctx);

      const [doc] = await db
        .select()
        .from(userDocuments)
        .where(
          and(
            eq(userDocuments.id, input.documentId),
            eq(userDocuments.userId, userId),
            isNull(userDocuments.deletedAt)
          )
        )
        .limit(1);

      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });

      // Get type info
      const [docType] = await db
        .select()
        .from(documentTypes)
        .where(eq(documentTypes.id, doc.documentTypeId))
        .limit(1);

      // Generate download URL
      let downloadUrl = doc.blobUrl;
      try {
        if (doc.blobPath) {
          const result = await storageGet(doc.blobPath);
          downloadUrl = result.url;
        }
      } catch {}

      return {
        id: doc.id,
        documentTypeId: doc.documentTypeId,
        documentTypeName: docType?.name || doc.documentTypeId,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        downloadUrl,
        status: doc.status,
        documentNumberLast4: doc.documentNumberLast4,
        issuedBy: doc.issuedBy,
        issuedByState: doc.issuedByState,
        issuedDate: doc.issuedDate,
        expiresAt: doc.expiresAt,
        verifiedAt: doc.verifiedAt,
        rejectionReason: doc.rejectionReason,
        ocrExtractedData: doc.ocrExtractedData,
        version: doc.version,
        uploadedAt: doc.uploadedAt,
      };
    }),

  uploadDocument: auditedProtectedProcedure
    .input(
      z.object({
        documentTypeId: z.string(),
        fileName: z.string(),
        fileBase64: z.string(),
        mimeType: z.string(),
        documentNumber: z.string().optional(),
        issuedBy: z.string().optional(),
        issuedByState: z.string().length(2).optional(),
        issuedDate: z.string().optional(),
        expiresAt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const userId = await resolveUserId(ctx);

      // Verify document type
      const [docType] = await db
        .select()
        .from(documentTypes)
        .where(eq(documentTypes.id, input.documentTypeId))
        .limit(1);

      if (!docType) throw new TRPCError({ code: "NOT_FOUND", message: "Document type not found" });

      // Validate file type
      const allowedTypes = (docType.acceptedFileTypes || "pdf,jpg,jpeg,png").split(",");
      const fileExt = input.fileName.split(".").pop()?.toLowerCase();
      if (!allowedTypes.includes(fileExt || "")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `File type not allowed. Accepted: ${allowedTypes.join(", ")}`,
        });
      }

      // Convert base64 to buffer
      const fileBuffer = Buffer.from(input.fileBase64, "base64");

      // Validate file size
      const maxSize = (docType.maxFileSizeMb || 10) * 1024 * 1024;
      if (fileBuffer.length > maxSize) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `File too large. Maximum: ${docType.maxFileSizeMb || 10}MB`,
        });
      }

      // File hash
      const crypto = await import("crypto");
      const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

      // Upload to storage
      const blobPath = `document-center/${userId}/${input.documentTypeId}/${Date.now()}_${input.fileName}`;
      let blobUrl = "";
      try {
        const result = await storagePut(blobPath, fileBuffer, input.mimeType);
        blobUrl = result.url;
      } catch (e: any) {
        console.error("[DocumentCenter] Upload failed:", e.message);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "File upload failed" });
      }

      // Encrypt document number if provided
      let encryptedNumber: string | null = null;
      let last4: string | null = null;
      if (input.documentNumber) {
        try {
          encryptedNumber = encrypt(input.documentNumber);
          last4 = input.documentNumber.slice(-4);
        } catch {
          encryptedNumber = input.documentNumber;
          last4 = input.documentNumber.slice(-4);
        }
      }

      // Supersede existing document of same type
      await db
        .update(userDocuments)
        .set({ supersededAt: new Date(), status: "SUPERSEDED" as any })
        .where(
          and(
            eq(userDocuments.userId, userId),
            eq(userDocuments.documentTypeId, input.documentTypeId),
            isNull(userDocuments.supersededAt)
          )
        );

      // Get version
      const [previousDoc] = await db
        .select({ id: userDocuments.id, version: userDocuments.version })
        .from(userDocuments)
        .where(
          and(eq(userDocuments.userId, userId), eq(userDocuments.documentTypeId, input.documentTypeId))
        )
        .orderBy(desc(userDocuments.version))
        .limit(1);

      const version = (previousDoc?.version || 0) + 1;

      // Insert
      const [doc] = await db
        .insert(userDocuments)
        .values({
          userId,
          documentTypeId: input.documentTypeId,
          blobUrl,
          blobPath,
          fileName: input.fileName,
          fileSize: fileBuffer.length,
          mimeType: input.mimeType,
          fileHash,
          documentNumber: encryptedNumber,
          documentNumberLast4: last4,
          issuedBy: input.issuedBy || null,
          issuedByState: input.issuedByState || null,
          issuedDate: input.issuedDate || null,
          expiresAt: input.expiresAt || null,
          status: "PENDING_REVIEW",
          version,
          previousVersionId: previousDoc?.id || null,
          uploadedBy: userId,
        })
        .$returningId();

      // Auto-index document for semantic search (fire-and-forget)
      try {
        const { indexDocument } = await import("../services/embeddings/aiTurbocharge");
        indexDocument({
          id: doc.id,
          title: input.fileName,
          type: docType.name || input.documentTypeId,
          category: docType.category || "general",
          description: `${docType.name || ""} uploaded by user ${userId}`,
        });
      } catch { /* embedding service unavailable */ }

      // Recalculate compliance
      const userRole = ctx.user?.role || "DRIVER";
      await calculateDocumentAwareness(userId, userRole);

      return {
        id: doc.id,
        status: "PENDING_REVIEW",
        message: "Document uploaded successfully. Pending review.",
      };
    }),

  deleteDocument: auditedProtectedProcedure
    .input(
      z.object({
        documentId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const userId = await resolveUserId(ctx);

      const [doc] = await db
        .select()
        .from(userDocuments)
        .where(
          and(
            eq(userDocuments.id, input.documentId),
            eq(userDocuments.userId, userId),
            isNull(userDocuments.deletedAt)
          )
        )
        .limit(1);

      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });

      await db
        .update(userDocuments)
        .set({
          deletedAt: new Date(),
          deletedBy: userId,
          deletionReason: input.reason || null,
        })
        .where(eq(userDocuments.id, input.documentId));

      const userRole = ctx.user?.role || "DRIVER";
      await calculateDocumentAwareness(userId, userRole);

      return { success: true };
    }),

  // =========================================================================
  // OPERATING STATES
  // =========================================================================

  getOperatingStates: auditedProtectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const userId = await resolveUserId(ctx);

    const states = await db
      .select()
      .from(userOperatingStates)
      .where(eq(userOperatingStates.userId, userId))
      .orderBy(userOperatingStates.stateCode);

    return states.map((s) => ({
      stateCode: s.stateCode,
      isHomeState: s.isHomeState,
      isRegisteredState: s.isRegisteredState,
      hasStatePermit: s.hasStatePermit,
      permitExpiresAt: s.permitExpiresAt,
      hasWeightDistanceTax: s.hasWeightDistanceTax,
    }));
  }),

  addOperatingState: auditedProtectedProcedure
    .input(
      z.object({
        stateCode: z.string().length(2),
        isHomeState: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const userId = await resolveUserId(ctx);

      // Check duplicate
      const [existing] = await db
        .select({ id: userOperatingStates.id })
        .from(userOperatingStates)
        .where(
          and(
            eq(userOperatingStates.userId, userId),
            eq(userOperatingStates.stateCode, input.stateCode)
          )
        )
        .limit(1);

      if (existing) throw new TRPCError({ code: "CONFLICT", message: "State already added" });

      // Clear existing home state if setting new one
      if (input.isHomeState) {
        await db
          .update(userOperatingStates)
          .set({ isHomeState: false })
          .where(
            and(eq(userOperatingStates.userId, userId), eq(userOperatingStates.isHomeState, true))
          );
      }

      const weightDistanceStates = ["KY", "NM", "NY", "OR"];
      const hasWeightDistanceTax = weightDistanceStates.includes(input.stateCode);

      await db.insert(userOperatingStates).values({
        userId,
        stateCode: input.stateCode,
        isHomeState: input.isHomeState,
        hasWeightDistanceTax,
      });

      const userRole = ctx.user?.role || "DRIVER";
      await calculateDocumentAwareness(userId, userRole);

      return { success: true, hasWeightDistanceTax };
    }),

  removeOperatingState: auditedProtectedProcedure
    .input(z.object({ stateCode: z.string().length(2) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const userId = await resolveUserId(ctx);

      await db
        .delete(userOperatingStates)
        .where(
          and(
            eq(userOperatingStates.userId, userId),
            eq(userOperatingStates.stateCode, input.stateCode)
          )
        );

      const userRole = ctx.user?.role || "DRIVER";
      await calculateDocumentAwareness(userId, userRole);

      return { success: true };
    }),

  // =========================================================================
  // SMART COMPLIANCE ENGINE — State-Aware Document Resolution
  // =========================================================================

  /**
   * Get the full compliance profile for the current user's company.
   * Resolves all required documents based on:
   *  - Company registered state (from DOT/MC authority)
   *  - Role (CATALYST, SHIPPER, BROKER)
   *  - Operations (hazmat, tanker, oversize)
   *  - Equipment types in fleet
   *  - Operating states
   * Also cross-references with uploaded documents to show completion status.
   */
  getMyComplianceProfile: auditedProtectedProcedure
    .input(z.object({
      operatingStates: z.array(z.string()).optional(),
      equipmentTypes: z.array(z.string()).optional(),
      products: z.array(z.string()).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = await resolveUserId(ctx);
      const role = ctx.user?.role || "CATALYST";

      // Resolve company profile from DB
      let companyState = "";
      let dotNumber = "";
      let mcNumber = "";
      let hazmatAuthorized = false;
      let tankerEndorsed = false;
      let oversizeOps = false;
      let hasBrokerAuthority = false;
      let companyId = 0;
      let equipmentTypes: string[] = input?.equipmentTypes || [];
      let products: string[] = input?.products || [];
      let operatingStates: string[] = input?.operatingStates || [];

      if (db) {
        // Get user's company
        const [user] = await db.select({ companyId: users.companyId, metadata: users.metadata })
          .from(users).where(eq(users.id, userId)).limit(1);

        if (user?.companyId) {
          companyId = user.companyId;
          const [company] = await db.select().from(companies).where(eq(companies.id, user.companyId)).limit(1);
          if (company) {
            companyState = company.state || "";
            dotNumber = company.dotNumber || "";
            mcNumber = company.mcNumber || "";
          }

          // Parse registration metadata for ops details
          try {
            const meta = typeof user.metadata === "string" ? JSON.parse(user.metadata) : user.metadata;
            if (meta?.registration) {
              const reg = meta.registration;
              if (reg.hazmatEndorsed) hazmatAuthorized = true;
              if (reg.tankerEndorsed) tankerEndorsed = true;
              if (reg.equipmentTypes?.length) equipmentTypes = Array.from(new Set([...equipmentTypes, ...reg.equipmentTypes]));
              if (reg.products?.length) products = Array.from(new Set([...products, ...reg.products]));
              if (reg.processAgentStates?.length) operatingStates = Array.from(new Set([...operatingStates, ...reg.processAgentStates]));
              if (reg.hazmatClasses?.length) hazmatAuthorized = true;
            }
            if (meta?.complianceIds?.dotHazmatPermit) hazmatAuthorized = true;
          } catch {}

          // Get user's operating states from DB
          try {
            const dbStates = await db.select({ stateCode: userOperatingStates.stateCode })
              .from(userOperatingStates).where(eq(userOperatingStates.userId, userId));
            const dbStateCodes = dbStates.map(s => s.stateCode);
            operatingStates = Array.from(new Set([...operatingStates, ...dbStateCodes]));
          } catch {}
        }
      }

      // Resolve compliance requirements
      const profile = resolveCompanyCompliance({
        companyId,
        state: companyState,
        dotNumber,
        mcNumber,
        role,
        hazmatAuthorized,
        tankerEndorsed,
        oversizeOps,
        equipmentTypes,
        products,
        operatingStates,
        hasBrokerAuthority,
      });

      // Cross-reference with uploaded documents to show completion
      let uploadedMap = new Map<string, any>();
      if (db) {
        try {
          const uploaded = await db.select({
            documentTypeId: userDocuments.documentTypeId,
            status: userDocuments.status,
            expiresAt: userDocuments.expiresAt,
            uploadedAt: userDocuments.uploadedAt,
            verifiedAt: userDocuments.verifiedAt,
            fileName: userDocuments.fileName,
          }).from(userDocuments).where(
            and(eq(userDocuments.userId, userId), isNull(userDocuments.deletedAt), isNull(userDocuments.supersededAt))
          );
          for (const doc of uploaded) {
            uploadedMap.set(doc.documentTypeId, doc);
          }
        } catch {}
      }

      // Enrich requirements with upload status
      const enriched = profile.requirements.map(req => {
        const uploaded = uploadedMap.get(req.documentTypeId);
        const now = new Date();
        let docStatus: "MISSING" | "UPLOADED" | "VERIFIED" | "EXPIRED" | "EXPIRING_SOON" | "REJECTED" | "PENDING_REVIEW" = "MISSING";

        if (uploaded) {
          const status = (uploaded.status || "").toUpperCase();
          if (status === "VERIFIED" || status === "APPROVED") {
            if (uploaded.expiresAt && new Date(uploaded.expiresAt) < now) {
              docStatus = "EXPIRED";
            } else if (uploaded.expiresAt && req.expirationWarningDays) {
              const warningDate = new Date(uploaded.expiresAt);
              warningDate.setDate(warningDate.getDate() - req.expirationWarningDays);
              docStatus = now > warningDate ? "EXPIRING_SOON" : "VERIFIED";
            } else {
              docStatus = "VERIFIED";
            }
          } else if (status === "REJECTED") {
            docStatus = "REJECTED";
          } else if (status.includes("PENDING") || status.includes("REVIEW")) {
            docStatus = "PENDING_REVIEW";
          } else {
            docStatus = "UPLOADED";
          }
        }

        return {
          ...req,
          docStatus,
          uploadedAt: uploaded?.uploadedAt?.toISOString() || null,
          expiresAt: uploaded?.expiresAt || null,
          fileName: uploaded?.fileName || null,
        };
      });

      const totalMissing = enriched.filter(r => r.docStatus === "MISSING").length;
      const totalVerified = enriched.filter(r => r.docStatus === "VERIFIED").length;
      const totalExpired = enriched.filter(r => r.docStatus === "EXPIRED").length;
      const totalExpiring = enriched.filter(r => r.docStatus === "EXPIRING_SOON").length;
      const totalPending = enriched.filter(r => r.docStatus === "PENDING_REVIEW" || r.docStatus === "UPLOADED").length;
      const totalRejected = enriched.filter(r => r.docStatus === "REJECTED").length;

      const criticalMissing = enriched.filter(r => r.docStatus === "MISSING" && r.priority === "CRITICAL").length;
      const complianceScore = profile.summary.total > 0
        ? Math.round(((totalVerified) / profile.summary.total) * 100)
        : 0;

      return {
        ...profile,
        requirements: enriched,
        complianceScore,
        canOperate: criticalMissing === 0 && totalExpired === 0,
        documentStatus: {
          totalMissing,
          totalVerified,
          totalExpired,
          totalExpiring,
          totalPending,
          totalRejected,
          criticalMissing,
        },
      };
    }),

  /**
   * Get the compliance profile for a specific driver.
   * Resolves all required documents based on CDL state, endorsements, etc.
   */
  getDriverComplianceProfile: auditedProtectedProcedure
    .input(z.object({
      driverId: z.number().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = input?.driverId || await resolveUserId(ctx);
      const role = ctx.user?.role || "DRIVER";

      let cdlState = "";
      let companyState = "";
      let companyId: number | undefined;
      let endorsements: string[] = [];
      let hazmatEndorsed = false;
      let tankerEndorsed = false;
      let twicCard = false;
      let employmentType = "W2";

      if (db) {
        const [user] = await db.select({ companyId: users.companyId, metadata: users.metadata })
          .from(users).where(eq(users.id, userId)).limit(1);

        if (user?.companyId) {
          companyId = user.companyId;
          const [company] = await db.select().from(companies).where(eq(companies.id, user.companyId)).limit(1);
          if (company) companyState = company.state || "";
        }

        try {
          const meta = typeof user?.metadata === "string" ? JSON.parse(user.metadata) : user?.metadata;
          if (meta?.registration) {
            const reg = meta.registration;
            cdlState = reg.cdlState || companyState;
            if (reg.cdlEndorsements?.length) endorsements = reg.cdlEndorsements;
            if (reg.hazmatEndorsement) hazmatEndorsed = true;
            if (reg.tankerEndorsement) tankerEndorsed = true;
            if (reg.twicCard) twicCard = true;
            if (reg.employmentType === "1099") employmentType = "1099";
          }
        } catch {}
      }

      if (!cdlState) cdlState = companyState;

      const profile = resolveDriverCompliance({
        userId,
        companyId,
        cdlState,
        companyState,
        role: (role as string) === "OWNER_OPERATOR" ? "OWNER_OPERATOR" : "DRIVER",
        endorsements,
        hazmatEndorsed,
        tankerEndorsed,
        twicCard,
        employmentType,
      });

      // Cross-reference with uploaded documents
      let uploadedMap = new Map<string, any>();
      if (db) {
        try {
          const uploaded = await db.select({
            documentTypeId: userDocuments.documentTypeId,
            status: userDocuments.status,
            expiresAt: userDocuments.expiresAt,
            uploadedAt: userDocuments.uploadedAt,
            fileName: userDocuments.fileName,
          }).from(userDocuments).where(
            and(eq(userDocuments.userId, userId), isNull(userDocuments.deletedAt), isNull(userDocuments.supersededAt))
          );
          for (const doc of uploaded) {
            uploadedMap.set(doc.documentTypeId, doc);
          }
        } catch {}
      }

      const enriched = profile.requirements.map(req => {
        const uploaded = uploadedMap.get(req.documentTypeId);
        const now = new Date();
        let docStatus: "MISSING" | "UPLOADED" | "VERIFIED" | "EXPIRED" | "EXPIRING_SOON" | "REJECTED" | "PENDING_REVIEW" = "MISSING";

        if (uploaded) {
          const status = (uploaded.status || "").toUpperCase();
          if (status === "VERIFIED" || status === "APPROVED") {
            if (uploaded.expiresAt && new Date(uploaded.expiresAt) < now) {
              docStatus = "EXPIRED";
            } else if (uploaded.expiresAt && req.expirationWarningDays) {
              const warningDate = new Date(uploaded.expiresAt);
              warningDate.setDate(warningDate.getDate() - req.expirationWarningDays);
              docStatus = now > warningDate ? "EXPIRING_SOON" : "VERIFIED";
            } else {
              docStatus = "VERIFIED";
            }
          } else if (status === "REJECTED") {
            docStatus = "REJECTED";
          } else if (status.includes("PENDING") || status.includes("REVIEW")) {
            docStatus = "PENDING_REVIEW";
          } else {
            docStatus = "UPLOADED";
          }
        }

        return {
          ...req,
          docStatus,
          uploadedAt: uploaded?.uploadedAt?.toISOString() || null,
          expiresAt: uploaded?.expiresAt || null,
          fileName: uploaded?.fileName || null,
        };
      });

      const totalMissing = enriched.filter(r => r.docStatus === "MISSING").length;
      const totalVerified = enriched.filter(r => r.docStatus === "VERIFIED").length;
      const criticalMissing = enriched.filter(r => r.docStatus === "MISSING" && r.priority === "CRITICAL").length;
      const complianceScore = profile.summary.total > 0
        ? Math.round(((totalVerified) / profile.summary.total) * 100)
        : 0;

      return {
        ...profile,
        requirements: enriched,
        complianceScore,
        canOperate: criticalMissing === 0,
        documentStatus: {
          totalMissing,
          totalVerified,
          totalExpired: enriched.filter(r => r.docStatus === "EXPIRED").length,
          totalExpiring: enriched.filter(r => r.docStatus === "EXPIRING_SOON").length,
          totalPending: enriched.filter(r => r.docStatus === "PENDING_REVIEW" || r.docStatus === "UPLOADED").length,
          totalRejected: enriched.filter(r => r.docStatus === "REJECTED").length,
          criticalMissing,
        },
      };
    }),

  // =========================================================================
  // STATE REQUIREMENTS
  // =========================================================================

  getStateRequirements: auditedProtectedProcedure
    .input(z.object({ stateCode: z.string().length(2) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { stateCode: input.stateCode, requirements: [] };

      const reqs = await db
        .select()
        .from(stateDocRequirements)
        .where(eq(stateDocRequirements.stateCode, input.stateCode));

      // Get type names
      const typeIds = reqs.map((r) => r.documentTypeId);
      let typeMap = new Map<string, any>();
      if (typeIds.length > 0) {
        const types = await db
          .select()
          .from(documentTypes)
          .where(inArray(documentTypes.id, typeIds));
        typeMap = new Map(types.map((t) => [t.id, t]));
      }

      return {
        stateCode: input.stateCode,
        requirements: reqs.map((r) => ({
          documentTypeId: r.documentTypeId,
          documentTypeName: typeMap.get(r.documentTypeId)?.name || r.documentTypeId,
          stateFormNumber: r.stateFormNumber,
          stateFormName: r.stateFormName,
          stateIssuingAgency: r.stateIssuingAgency,
          statePortalUrl: r.statePortalUrl,
          stateFormUrl: r.stateFormUrl,
          isRequired: r.isRequired,
          filingFee: r.filingFee,
          validityPeriod: r.validityPeriod,
          notes: r.notes,
        })),
      };
    }),

  // =========================================================================
  // FORM LIBRARY
  // =========================================================================

  getFormLibrary: auditedProtectedProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
          stateCode: z.string().length(2).optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const templates = await db
        .select()
        .from(documentTemplates)
        .where(eq(documentTemplates.isActive, true));

      // Get type info
      const typeIds = Array.from(new Set(templates.map((t) => t.documentTypeId)));
      let typeMap = new Map<string, any>();
      if (typeIds.length > 0) {
        const types = await db
          .select()
          .from(documentTypes)
          .where(inArray(documentTypes.id, typeIds));
        typeMap = new Map(types.map((t) => [t.id, t]));
      }

      let filtered = templates;
      if (input?.category) {
        filtered = filtered.filter((t) => typeMap.get(t.documentTypeId)?.category === input.category);
      }
      if (input?.stateCode) {
        filtered = filtered.filter((t) => !t.stateCode || t.stateCode === input.stateCode);
      }
      if (input?.search) {
        const search = input.search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.name.toLowerCase().includes(search) ||
            typeMap.get(t.documentTypeId)?.name?.toLowerCase().includes(search)
        );

        // Augment with semantic document search when text filter yields few results
        if (filtered.length < 3) {
          try {
            const { searchDocuments } = await import("../services/embeddings/aiTurbocharge");
            const hits = await searchDocuments(input.search, 5);
            // Add AI-found document IDs as hints (won't expand template list, but logged for future use)
            if (hits.length > 0) {
              console.log(`[DocCenter] Semantic search found ${hits.length} related docs for "${input.search}"`);
            }
          } catch { /* embedding service unavailable */ }
        }
      }

      return filtered.map((t) => ({
        id: t.id,
        documentTypeId: t.documentTypeId,
        documentTypeName: typeMap.get(t.documentTypeId)?.name || t.documentTypeId,
        category: typeMap.get(t.documentTypeId)?.category,
        name: t.name,
        description: t.description,
        version: t.version,
        templateUrl: t.templateUrl,
        thumbnailUrl: t.thumbnailUrl,
        stateCode: t.stateCode,
        sourceUrl: t.sourceUrl,
        isFillable: t.isFillable,
      }));
    }),

  // =========================================================================
  // COMPLIANCE STATUS
  // =========================================================================

  getComplianceStatus: auditedProtectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const userId = await resolveUserId(ctx);

    const [status] = await db
      .select()
      .from(docComplianceStatus)
      .where(eq(docComplianceStatus.userId, userId))
      .limit(1);

    return status || null;
  }),

  // =========================================================================
  // ADMIN — Document Verification
  // =========================================================================

  getPendingDocuments: auditedAdminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { documents: [], total: 0 };

      const docs = await db
        .select()
        .from(userDocuments)
        .where(eq(userDocuments.status, "PENDING_REVIEW" as any))
        .orderBy(userDocuments.uploadedAt)
        .limit(input.limit)
        .offset(input.offset);

      // Get user + type info
      const userIds = Array.from(new Set(docs.map((d) => d.userId)));
      const typeIds = Array.from(new Set(docs.map((d) => d.documentTypeId)));

      let userMap = new Map<number, any>();
      if (userIds.length > 0) {
        const userRows = await db
          .select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .where(inArray(users.id, userIds));
        userMap = new Map(userRows.map((u) => [u.id, u]));
      }

      let typeMap = new Map<string, any>();
      if (typeIds.length > 0) {
        const types = await db
          .select()
          .from(documentTypes)
          .where(inArray(documentTypes.id, typeIds));
        typeMap = new Map(types.map((t) => [t.id, t]));
      }

      return {
        documents: docs.map((d) => ({
          id: d.id,
          documentTypeId: d.documentTypeId,
          documentTypeName: typeMap.get(d.documentTypeId)?.name || d.documentTypeId,
          userId: d.userId,
          userName: userMap.get(d.userId)?.name,
          userEmail: userMap.get(d.userId)?.email,
          fileName: d.fileName,
          uploadedAt: d.uploadedAt,
          ocrExtractedData: d.ocrExtractedData,
        })),
        total: docs.length,
      };
    }),

  verifyDocument: auditedAdminProcedure
    .input(
      z.object({
        documentId: z.number(),
        approved: z.boolean(),
        rejectionReason: z.string().optional(),
        rejectionCode: z.string().optional(),
        verificationNotes: z.string().optional(),
        corrections: z
          .object({
            documentNumber: z.string().optional(),
            expiresAt: z.string().optional(),
            issuedDate: z.string().optional(),
            issuedBy: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const adminId = await resolveUserId(ctx);

      const [doc] = await db
        .select()
        .from(userDocuments)
        .where(eq(userDocuments.id, input.documentId))
        .limit(1);

      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });

      if (input.approved) {
        let encryptedNumber = doc.documentNumber;
        let last4 = doc.documentNumberLast4;
        if (input.corrections?.documentNumber) {
          try {
            encryptedNumber = encrypt(input.corrections.documentNumber);
          } catch {
            encryptedNumber = input.corrections.documentNumber;
          }
          last4 = input.corrections.documentNumber.slice(-4);
        }

        await db
          .update(userDocuments)
          .set({
            status: "VERIFIED" as any,
            verificationLevel: "L2_STAFF" as any,
            verifiedAt: new Date(),
            verifiedBy: adminId,
            verificationNotes: input.verificationNotes || null,
            documentNumber: encryptedNumber,
            documentNumberLast4: last4,
            expiresAt: input.corrections?.expiresAt || doc.expiresAt,
            issuedDate: input.corrections?.issuedDate || doc.issuedDate,
            issuedBy: input.corrections?.issuedBy || doc.issuedBy,
          })
          .where(eq(userDocuments.id, input.documentId));
      } else {
        await db
          .update(userDocuments)
          .set({
            status: "REJECTED" as any,
            verifiedAt: new Date(),
            verifiedBy: adminId,
            rejectionReason: input.rejectionReason || null,
            rejectionCode: input.rejectionCode || null,
            verificationNotes: input.verificationNotes || null,
          })
          .where(eq(userDocuments.id, input.documentId));
      }

      // Recalculate user's compliance
      try {
        const [user] = await db
          .select({ role: users.role })
          .from(users)
          .where(eq(users.id, doc.userId))
          .limit(1);
        await calculateDocumentAwareness(doc.userId, user?.role || "DRIVER");
      } catch {}

      return { success: true };
    }),

  // =========================================================================
  // SEED — Initialize document types & requirements
  // =========================================================================

  seedDocumentTypes: auditedProtectedProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    let inserted = 0;
    for (const seed of documentTypesSeed) {
      try {
        await db.insert(documentTypes).values({
          id: seed.id,
          category: seed.category,
          name: seed.name,
          shortName: seed.shortName || null,
          description: seed.description || null,
          formNumber: seed.formNumber || null,
          issuingAuthority: seed.issuingAuthority || null,
          regulatoryReference: seed.regulatoryReference || null,
          sourceUrl: seed.sourceUrl || null,
          downloadUrl: seed.downloadUrl || null,
          instructionsUrl: (seed as any).instructionsUrl || null,
          hasExpiration: seed.hasExpiration ?? false,
          typicalValidityDays: seed.typicalValidityDays || null,
          expirationWarningDays: seed.expirationWarningDays || 30,
          verificationLevel: seed.verificationLevel || "L1_SYSTEM",
          requiresSignature: seed.requiresSignature ?? false,
          ocrEnabled: seed.ocrEnabled ?? true,
          ocrFieldMappings: seed.ocrFieldMappings || null,
          isStateSpecific: seed.isStateSpecific ?? false,
          applicableStates: (seed as any).applicableStates || null,
          sortOrder: seed.sortOrder || 100,
          isActive: true,
        }).onDuplicateKeyUpdate({
          set: {
            name: seed.name,
            shortName: seed.shortName || null,
            description: seed.description || null,
            formNumber: seed.formNumber || null,
            issuingAuthority: seed.issuingAuthority || null,
            regulatoryReference: seed.regulatoryReference || null,
            sourceUrl: seed.sourceUrl || null,
            downloadUrl: seed.downloadUrl || null,
            instructionsUrl: (seed as any).instructionsUrl || null,
            hasExpiration: seed.hasExpiration ?? false,
            typicalValidityDays: seed.typicalValidityDays || null,
            expirationWarningDays: seed.expirationWarningDays || 30,
            verificationLevel: seed.verificationLevel || "L1_SYSTEM",
            sortOrder: seed.sortOrder || 100,
            isActive: true,
          },
        });
        inserted++;
      } catch (e: any) {
        console.error(`[Seed] Failed to insert document type ${seed.id}:`, e.message);
      }
    }

    return { success: true, inserted, total: documentTypesSeed.length };
  }),

  seedDocumentRequirements: auditedProtectedProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    let inserted = 0;
    for (const seed of documentRequirementsSeed) {
      try {
        await db.insert(documentRequirements).values({
          documentTypeId: seed.documentTypeId,
          requiredForRole: seed.requiredForRole as any,
          requiredForEmploymentType: (seed as any).requiredForEmploymentType || null,
          isRequired: seed.isRequired ?? true,
          isBlocking: seed.isBlocking ?? true,
          priority: seed.priority || 1,
          conditionType: (seed as any).conditionType || null,
          conditionValue: (seed as any).conditionValue != null ? (seed as any).conditionValue : null,
          requiredAtOnboarding: (seed as any).requiredAtOnboarding ?? true,
          gracePeriodDays: (seed as any).gracePeriodDays || 0,
        });
        inserted++;
      } catch (e: any) {
        console.error(`[Seed] Failed to insert doc requirement ${seed.documentTypeId}/${seed.requiredForRole}:`, e.message);
      }
    }

    return { success: true, inserted, total: documentRequirementsSeed.length };
  }),

  seedStateRequirements: auditedProtectedProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    let inserted = 0;
    for (const seed of stateRequirementsSeed) {
      try {
        await db.insert(stateDocRequirements).values({
          stateCode: seed.stateCode,
          stateName: seed.stateName,
          documentTypeId: seed.documentTypeId,
          stateFormNumber: seed.stateFormNumber || null,
          stateFormName: seed.stateFormName || null,
          stateIssuingAgency: seed.stateIssuingAgency,
          statePortalUrl: seed.statePortalUrl || null,
          stateFormUrl: seed.stateFormUrl || null,
          stateInstructionsUrl: seed.stateInstructionsUrl || null,
          isRequired: seed.isRequired ?? true,
          requiredForRoles: seed.requiredForRoles || null,
          conditions: seed.conditions || null,
          filingFee: seed.filingFee || null,
          renewalFee: seed.renewalFee || null,
          lateFee: seed.lateFee || null,
          validityPeriod: seed.validityPeriod || null,
          renewalWindow: seed.renewalWindow || null,
          notes: seed.notes || null,
        });
        inserted++;
      } catch (e: any) {
        if (e.message?.includes("Duplicate")) continue;
        console.error(`[Seed] Failed to insert state req ${seed.stateCode}/${seed.documentTypeId}:`, e.message);
      }
    }

    return { success: true, inserted, total: stateRequirementsSeed.length };
  }),
});
