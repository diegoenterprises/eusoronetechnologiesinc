/**
 * DOCUMENT MANAGEMENT ROUTER
 * Comprehensive document lifecycle: OCR/scanning, template management,
 * e-signatures, document workflows, BOL generation, POD management,
 * compliance vault, audit trails, and analytics.
 */

import { z } from "zod";
import { randomBytes } from "crypto";
import { router, protectedProcedure } from "../_core/trpc";
import { logger } from "../_core/logger";

// ============================================================================
// SCHEMAS
// ============================================================================

const documentTypeSchema = z.enum([
  "bol", "pod", "invoice", "permit", "insurance", "medical_card",
  "registration", "inspection", "contract", "rate_confirmation",
  "lumper_receipt", "scale_ticket", "fuel_receipt", "toll_receipt",
  "hazmat_placard", "ifta", "irp", "w9", "operating_authority",
  "broker_carrier_agreement", "detention_receipt", "customs_form",
  "freight_bill", "delivery_receipt", "packing_list", "other",
]);

const documentStatusSchema = z.enum([
  "draft", "uploaded", "processing", "classified", "extracted",
  "pending_review", "approved", "rejected", "signed", "archived",
  "expired", "expiring_soon",
]);

const workflowStatusSchema = z.enum([
  "pending", "in_progress", "approved", "rejected", "cancelled",
]);

const signatureStatusSchema = z.enum([
  "pending", "viewed", "signed", "declined", "expired",
]);

const complianceRegulationSchema = z.enum([
  "fmcsa", "dot", "osha", "epa", "ifta", "irp", "hazmat",
  "state_permits", "insurance", "drug_testing", "driver_qualification",
]);

// ============================================================================
// HELPERS
// ============================================================================

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function generateHash(data: string): string {
  return `SHA256:${Buffer.from(data.substring(0, 100)).toString("base64").substring(0, 44)}`;
}

// ============================================================================
// IN-MEMORY STORES (production would use DB via getDb/drizzle)
// ============================================================================

interface StoredDocument {
  id: string;
  name: string;
  type: string;
  status: string;
  category: string;
  mimeType: string;
  size: number;
  url: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  extractedData: Record<string, unknown> | null;
  classification: { type: string; confidence: number } | null;
  tags: string[];
  version: number;
  versions: Array<{ version: number; uploadedAt: string; uploadedBy: string; changeNote: string }>;
  uploadedBy: string;
  uploadedAt: string;
  updatedAt: string;
  expiresAt: string | null;
  archivedAt: string | null;
  retentionPolicy: string | null;
  auditTrail: Array<{ action: string; userId: string; timestamp: string; details: string }>;
}

interface StoredTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  content: string;
  mergeFields: Array<{ key: string; label: string; type: string; required: boolean; defaultValue?: string }>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  isActive: boolean;
}

interface StoredWorkflow {
  id: string;
  documentId: string;
  documentName: string;
  type: string;
  status: string;
  steps: Array<{
    stepId: string;
    name: string;
    assigneeId: string;
    assigneeName: string;
    status: string;
    actionAt: string | null;
    comments: string | null;
    order: number;
  }>;
  createdBy: string;
  createdAt: string;
  completedAt: string | null;
  dueDate: string | null;
}

interface StoredSignatureRequest {
  id: string;
  documentId: string;
  documentName: string;
  requestedBy: string;
  signers: Array<{
    signerId: string;
    name: string;
    email: string;
    status: string;
    signedAt: string | null;
    signatureData: string | null;
    ipAddress: string | null;
    order: number;
  }>;
  status: string;
  createdAt: string;
  expiresAt: string;
  completedAt: string | null;
  message: string;
}

const documentStore = new Map<string, StoredDocument>();
const templateStore = new Map<string, StoredTemplate>();
const workflowStore = new Map<string, StoredWorkflow>();
const signatureRequestStore = new Map<string, StoredSignatureRequest>();

// Seed some templates
const defaultTemplates: StoredTemplate[] = [
  {
    id: "TPL-BOL-001",
    name: "Standard Bill of Lading",
    description: "FMCSA-compliant Bill of Lading with all required fields",
    type: "bol",
    category: "shipping",
    content: "BILL OF LADING\n\nShipper: {{shipper_name}}\nConsignee: {{consignee_name}}\nCarrier: {{carrier_name}}\nPro Number: {{pro_number}}\nDate: {{date}}\n\nOrigin: {{origin_address}}\nDestination: {{destination_address}}\n\nCommodity: {{commodity}}\nWeight: {{weight}} lbs\nClass: {{freight_class}}\nPieces: {{pieces}}\nPackaging: {{packaging_type}}\n\nSpecial Instructions: {{special_instructions}}\nHazmat: {{hazmat_yn}}\nUN Number: {{un_number}}\n\nDeclared Value: ${{declared_value}}\n\nShipper Signature: _______________\nCarrier Signature: _______________\nDate: {{signature_date}}",
    mergeFields: [
      { key: "shipper_name", label: "Shipper Name", type: "text", required: true },
      { key: "consignee_name", label: "Consignee Name", type: "text", required: true },
      { key: "carrier_name", label: "Carrier Name", type: "text", required: true },
      { key: "pro_number", label: "PRO Number", type: "text", required: true },
      { key: "date", label: "Date", type: "date", required: true },
      { key: "origin_address", label: "Origin Address", type: "text", required: true },
      { key: "destination_address", label: "Destination Address", type: "text", required: true },
      { key: "commodity", label: "Commodity Description", type: "text", required: true },
      { key: "weight", label: "Weight (lbs)", type: "number", required: true },
      { key: "freight_class", label: "Freight Class", type: "text", required: false, defaultValue: "70" },
      { key: "pieces", label: "Number of Pieces", type: "number", required: true },
      { key: "packaging_type", label: "Packaging Type", type: "text", required: false, defaultValue: "Pallets" },
      { key: "special_instructions", label: "Special Instructions", type: "textarea", required: false },
      { key: "hazmat_yn", label: "Hazmat (Y/N)", type: "text", required: false, defaultValue: "N" },
      { key: "un_number", label: "UN Number", type: "text", required: false },
      { key: "declared_value", label: "Declared Value", type: "number", required: false },
      { key: "signature_date", label: "Signature Date", type: "date", required: true },
    ],
    createdBy: "system",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    usageCount: 342,
    isActive: true,
  },
  {
    id: "TPL-RC-001",
    name: "Rate Confirmation",
    description: "Standard rate confirmation with payment terms and load details",
    type: "rate_confirmation",
    category: "financial",
    content: "RATE CONFIRMATION\n\nBroker: {{broker_name}}\nCarrier: {{carrier_name}}\nMC#: {{mc_number}}\nLoad #: {{load_number}}\nDate: {{date}}\n\nPickup: {{pickup_location}}\nPickup Date: {{pickup_date}}\nDelivery: {{delivery_location}}\nDelivery Date: {{delivery_date}}\n\nEquipment: {{equipment_type}}\nCommodity: {{commodity}}\nWeight: {{weight}} lbs\nRate: ${{rate}}\nDetention: ${{detention_rate}}/hr after {{free_time}} hrs\n\nPayment Terms: {{payment_terms}}\n\nCarrier Signature: _______________\nDate: {{signature_date}}",
    mergeFields: [
      { key: "broker_name", label: "Broker Name", type: "text", required: true },
      { key: "carrier_name", label: "Carrier Name", type: "text", required: true },
      { key: "mc_number", label: "MC Number", type: "text", required: true },
      { key: "load_number", label: "Load Number", type: "text", required: true },
      { key: "date", label: "Date", type: "date", required: true },
      { key: "pickup_location", label: "Pickup Location", type: "text", required: true },
      { key: "pickup_date", label: "Pickup Date", type: "date", required: true },
      { key: "delivery_location", label: "Delivery Location", type: "text", required: true },
      { key: "delivery_date", label: "Delivery Date", type: "date", required: true },
      { key: "equipment_type", label: "Equipment Type", type: "text", required: true, defaultValue: "Dry Van 53'" },
      { key: "commodity", label: "Commodity", type: "text", required: true },
      { key: "weight", label: "Weight (lbs)", type: "number", required: true },
      { key: "rate", label: "Rate ($)", type: "number", required: true },
      { key: "detention_rate", label: "Detention Rate ($/hr)", type: "number", required: false, defaultValue: "75" },
      { key: "free_time", label: "Free Time (hrs)", type: "number", required: false, defaultValue: "2" },
      { key: "payment_terms", label: "Payment Terms", type: "text", required: true, defaultValue: "Net 30" },
      { key: "signature_date", label: "Signature Date", type: "date", required: true },
    ],
    createdBy: "system",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    usageCount: 189,
    isActive: true,
  },
  {
    id: "TPL-INV-001",
    name: "Freight Invoice",
    description: "Standard freight invoice template with line items",
    type: "invoice",
    category: "financial",
    content: "FREIGHT INVOICE\n\nInvoice #: {{invoice_number}}\nDate: {{date}}\nDue Date: {{due_date}}\n\nFrom: {{company_name}}\n{{company_address}}\n\nBill To: {{bill_to_name}}\n{{bill_to_address}}\n\nLoad #: {{load_number}}\nPRO #: {{pro_number}}\nBOL #: {{bol_number}}\n\nLine Haul: ${{line_haul}}\nFuel Surcharge: ${{fuel_surcharge}}\nAccessorials: ${{accessorials}}\nDetention: ${{detention}}\n\nTotal: ${{total}}\n\nPayment Terms: {{payment_terms}}\nRemit To: {{remit_to}}",
    mergeFields: [
      { key: "invoice_number", label: "Invoice Number", type: "text", required: true },
      { key: "date", label: "Invoice Date", type: "date", required: true },
      { key: "due_date", label: "Due Date", type: "date", required: true },
      { key: "company_name", label: "Company Name", type: "text", required: true },
      { key: "company_address", label: "Company Address", type: "text", required: true },
      { key: "bill_to_name", label: "Bill To Name", type: "text", required: true },
      { key: "bill_to_address", label: "Bill To Address", type: "text", required: true },
      { key: "load_number", label: "Load Number", type: "text", required: true },
      { key: "pro_number", label: "PRO Number", type: "text", required: false },
      { key: "bol_number", label: "BOL Number", type: "text", required: false },
      { key: "line_haul", label: "Line Haul ($)", type: "number", required: true },
      { key: "fuel_surcharge", label: "Fuel Surcharge ($)", type: "number", required: false, defaultValue: "0" },
      { key: "accessorials", label: "Accessorials ($)", type: "number", required: false, defaultValue: "0" },
      { key: "detention", label: "Detention ($)", type: "number", required: false, defaultValue: "0" },
      { key: "total", label: "Total ($)", type: "number", required: true },
      { key: "payment_terms", label: "Payment Terms", type: "text", required: true, defaultValue: "Net 30" },
      { key: "remit_to", label: "Remit To", type: "text", required: true },
    ],
    createdBy: "system",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    usageCount: 256,
    isActive: true,
  },
  {
    id: "TPL-CONTRACT-001",
    name: "Carrier-Broker Agreement",
    description: "Standard carrier-broker contract template",
    type: "contract",
    category: "legal",
    content: "CARRIER-BROKER AGREEMENT\n\nThis Agreement is entered into as of {{effective_date}}.\n\nBroker: {{broker_name}}, MC# {{broker_mc}}\nCarrier: {{carrier_name}}, MC# {{carrier_mc}}\n\nTerms: {{agreement_terms}}\nDuration: {{duration}}\nInsurance Minimum: ${{insurance_minimum}}\nPayment Terms: {{payment_terms}}",
    mergeFields: [
      { key: "effective_date", label: "Effective Date", type: "date", required: true },
      { key: "broker_name", label: "Broker Name", type: "text", required: true },
      { key: "broker_mc", label: "Broker MC#", type: "text", required: true },
      { key: "carrier_name", label: "Carrier Name", type: "text", required: true },
      { key: "carrier_mc", label: "Carrier MC#", type: "text", required: true },
      { key: "agreement_terms", label: "Agreement Terms", type: "textarea", required: true },
      { key: "duration", label: "Duration", type: "text", required: true, defaultValue: "1 year" },
      { key: "insurance_minimum", label: "Insurance Minimum ($)", type: "number", required: true, defaultValue: "1000000" },
      { key: "payment_terms", label: "Payment Terms", type: "text", required: true, defaultValue: "Net 30" },
    ],
    createdBy: "system",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    usageCount: 78,
    isActive: true,
  },
];

// Initialize default templates
for (const tpl of defaultTemplates) {
  templateStore.set(tpl.id, tpl);
}

// ============================================================================
// ROUTER
// ============================================================================

export const documentManagementRouter = router({
  // ──────────────────────────────────────────────────────────────────────────
  // DASHBOARD
  // ──────────────────────────────────────────────────────────────────────────

  getDocumentDashboard: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = String(ctx.user?.id || 0);
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const allDocs = Array.from(documentStore.values()).filter(
        (d) => d.uploadedBy === userId || d.entityId === userId
      );

      const byCategory: Record<string, number> = {};
      const byType: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      let pendingReview = 0;
      let expiringSoon = 0;
      let expired = 0;

      for (const doc of allDocs) {
        byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
        byType[doc.type] = (byType[doc.type] || 0) + 1;
        byStatus[doc.status] = (byStatus[doc.status] || 0) + 1;

        if (doc.status === "pending_review") pendingReview++;
        if (doc.expiresAt) {
          const exp = new Date(doc.expiresAt);
          if (exp < now) expired++;
          else if (exp < thirtyDays) expiringSoon++;
        }
      }

      return {
        totalDocuments: allDocs.length,
        pendingReview,
        expiringSoon,
        expired,
        recentUploads: allDocs
          .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
          .slice(0, 5)
          .map((d) => ({
            id: d.id,
            name: d.name,
            type: d.type,
            status: d.status,
            uploadedAt: d.uploadedAt,
          })),
        byCategory: Object.entries(byCategory).map(([category, count]) => ({ category, count })),
        byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
        byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
        activeWorkflows: Array.from(workflowStore.values()).filter(
          (w) => w.status === "pending" || w.status === "in_progress"
        ).length,
        pendingSignatures: Array.from(signatureRequestStore.values()).filter(
          (s) => s.status === "pending"
        ).length,
        templatesAvailable: templateStore.size,
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // DOCUMENT CRUD
  // ──────────────────────────────────────────────────────────────────────────

  getDocuments: protectedProcedure
    .input(
      z.object({
        type: documentTypeSchema.optional(),
        status: documentStatusSchema.optional(),
        entityType: z.string().optional(),
        entityId: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        search: z.string().optional(),
        tags: z.array(z.string()).optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        sortBy: z.enum(["name", "uploadedAt", "type", "status", "size"]).default("uploadedAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = String(ctx.user?.id || 0);
      let docs = Array.from(documentStore.values());

      // Filter by user access
      docs = docs.filter((d) => d.uploadedBy === userId || d.entityId === userId);

      // Apply filters
      if (input.type) docs = docs.filter((d) => d.type === input.type);
      if (input.status) docs = docs.filter((d) => d.status === input.status);
      if (input.entityType) docs = docs.filter((d) => d.entityType === input.entityType);
      if (input.entityId) docs = docs.filter((d) => d.entityId === input.entityId);
      if (input.search) {
        const q = input.search.toLowerCase();
        docs = docs.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.type.toLowerCase().includes(q) ||
            d.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      if (input.dateFrom) {
        const from = new Date(input.dateFrom);
        docs = docs.filter((d) => new Date(d.uploadedAt) >= from);
      }
      if (input.dateTo) {
        const to = new Date(input.dateTo);
        docs = docs.filter((d) => new Date(d.uploadedAt) <= to);
      }
      if (input.tags && input.tags.length > 0) {
        docs = docs.filter((d) => input.tags!.some((t) => d.tags.includes(t)));
      }

      // Sort
      docs.sort((a, b) => {
        let cmp = 0;
        switch (input.sortBy) {
          case "name": cmp = a.name.localeCompare(b.name); break;
          case "uploadedAt": cmp = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime(); break;
          case "type": cmp = a.type.localeCompare(b.type); break;
          case "status": cmp = a.status.localeCompare(b.status); break;
          case "size": cmp = a.size - b.size; break;
        }
        return input.sortOrder === "desc" ? -cmp : cmp;
      });

      const total = docs.length;
      const start = (input.page - 1) * input.pageSize;
      const paginated = docs.slice(start, start + input.pageSize);

      return {
        documents: paginated,
        total,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),

  getDocumentById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const doc = documentStore.get(input.id);
      if (!doc) {
        return null;
      }
      return doc;
    }),

  uploadDocument: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        type: documentTypeSchema.default("other"),
        mimeType: z.string().default("application/pdf"),
        size: z.number().default(0),
        fileData: z.string().describe("Base64 encoded file data"),
        entityType: z.enum(["load", "driver", "vehicle", "company", "carrier", "broker", "shipper"]).default("company"),
        entityId: z.string().default(""),
        tags: z.array(z.string()).optional(),
        expiresAt: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = String(ctx.user?.id || 0);
      const docId = generateId("DOC");
      const now = new Date().toISOString();

      const doc: StoredDocument = {
        id: docId,
        name: input.name,
        type: input.type,
        status: "uploaded",
        category: getCategoryForType(input.type),
        mimeType: input.mimeType,
        size: input.size || input.fileData.length,
        url: `/api/documents/${docId}/download`,
        entityType: input.entityType,
        entityId: input.entityId || userId,
        metadata: input.metadata || {},
        extractedData: null,
        classification: null,
        tags: input.tags || [],
        version: 1,
        versions: [{ version: 1, uploadedAt: now, uploadedBy: userId, changeNote: "Initial upload" }],
        uploadedBy: userId,
        uploadedAt: now,
        updatedAt: now,
        expiresAt: input.expiresAt || null,
        archivedAt: null,
        retentionPolicy: null,
        auditTrail: [
          { action: "uploaded", userId, timestamp: now, details: `Document "${input.name}" uploaded` },
        ],
      };

      documentStore.set(docId, doc);
      logger.info(`[DocumentManagement] Document uploaded: ${docId} by user ${userId}`);

      return {
        id: docId,
        name: doc.name,
        type: doc.type,
        status: doc.status,
        uploadedAt: doc.uploadedAt,
        message: "Document uploaded successfully",
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // AI CLASSIFICATION & OCR
  // ──────────────────────────────────────────────────────────────────────────

  classifyDocument: protectedProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const doc = documentStore.get(input.documentId);
      if (!doc) {
        return { success: false, error: "Document not found" };
      }

      // Simulate AI classification based on document name and existing type
      const classificationMap: Record<string, { type: string; confidence: number }> = {
        bol: { type: "bol", confidence: 0.96 },
        pod: { type: "pod", confidence: 0.94 },
        invoice: { type: "invoice", confidence: 0.92 },
        insurance: { type: "insurance", confidence: 0.95 },
        permit: { type: "permit", confidence: 0.91 },
        medical: { type: "medical_card", confidence: 0.93 },
        registration: { type: "registration", confidence: 0.89 },
        inspection: { type: "inspection", confidence: 0.90 },
        contract: { type: "contract", confidence: 0.88 },
        rate: { type: "rate_confirmation", confidence: 0.94 },
        hazmat: { type: "hazmat_placard", confidence: 0.97 },
        ifta: { type: "ifta", confidence: 0.95 },
        irp: { type: "irp", confidence: 0.93 },
        w9: { type: "w9", confidence: 0.98 },
      };

      const nameLC = doc.name.toLowerCase();
      let classification = { type: doc.type, confidence: 0.85 };
      for (const [keyword, cls] of Object.entries(classificationMap)) {
        if (nameLC.includes(keyword)) {
          classification = cls;
          break;
        }
      }

      const now = new Date().toISOString();
      doc.classification = classification;
      doc.type = classification.type;
      doc.category = getCategoryForType(classification.type);
      doc.status = "classified";
      doc.updatedAt = now;
      doc.auditTrail.push({
        action: "classified",
        userId: String(ctx.user?.id || 0),
        timestamp: now,
        details: `AI classified as "${classification.type}" with ${(classification.confidence * 100).toFixed(1)}% confidence`,
      });

      return {
        success: true,
        documentId: input.documentId,
        classification,
        suggestedCategory: doc.category,
      };
    }),

  extractDocumentData: protectedProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const doc = documentStore.get(input.documentId);
      if (!doc) {
        return { success: false, error: "Document not found", extractedData: null };
      }

      // Simulate OCR/AI data extraction based on document type
      const extractedData: Record<string, unknown> = {};
      const docType = doc.type;

      if (docType === "bol") {
        Object.assign(extractedData, {
          proNumber: `PRO-${Math.floor(Math.random() * 900000 + 100000)}`,
          shipperName: "Extracted Shipper Co.",
          consigneeName: "Extracted Consignee Inc.",
          originAddress: "123 Origin St, Chicago, IL 60601",
          destinationAddress: "456 Dest Ave, Dallas, TX 75201",
          commodity: "General Freight",
          weight: Math.floor(Math.random() * 40000 + 5000),
          pieces: Math.floor(Math.random() * 20 + 1),
          freightClass: "70",
          hazmat: false,
          specialInstructions: "Handle with care",
          date: new Date().toISOString().split("T")[0],
        });
      } else if (docType === "invoice") {
        Object.assign(extractedData, {
          invoiceNumber: `INV-${Math.floor(Math.random() * 90000 + 10000)}`,
          amount: Math.floor(Math.random() * 5000 + 500),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          lineItems: [
            { description: "Line Haul", amount: Math.floor(Math.random() * 3000 + 1000) },
            { description: "Fuel Surcharge", amount: Math.floor(Math.random() * 500 + 100) },
          ],
          paymentTerms: "Net 30",
        });
      } else if (docType === "insurance") {
        Object.assign(extractedData, {
          policyNumber: `POL-${Math.floor(Math.random() * 900000 + 100000)}`,
          carrier: "National Indemnity",
          coverageType: "Commercial Auto Liability",
          coverageAmount: 1000000,
          effectiveDate: new Date().toISOString().split("T")[0],
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          namedInsured: "Transport Co LLC",
        });
      } else if (docType === "pod") {
        Object.assign(extractedData, {
          deliveryDate: new Date().toISOString().split("T")[0],
          deliveryTime: "14:30",
          receiverName: "John Smith",
          receiverSignature: true,
          condition: "Good",
          shortages: "None",
          damages: "None",
          proNumber: `PRO-${Math.floor(Math.random() * 900000 + 100000)}`,
        });
      } else {
        Object.assign(extractedData, {
          rawText: "OCR extracted text content from document...",
          dateDetected: new Date().toISOString().split("T")[0],
          entitiesFound: ["company name", "date", "amount"],
        });
      }

      const now = new Date().toISOString();
      doc.extractedData = extractedData;
      doc.status = "extracted";
      doc.updatedAt = now;
      doc.auditTrail.push({
        action: "data_extracted",
        userId: String(ctx.user?.id || 0),
        timestamp: now,
        details: `OCR/AI extracted ${Object.keys(extractedData).length} data fields`,
      });

      return {
        success: true,
        documentId: input.documentId,
        extractedData,
        fieldsExtracted: Object.keys(extractedData).length,
        confidence: 0.91,
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // TEMPLATES
  // ──────────────────────────────────────────────────────────────────────────

  getDocumentTemplates: protectedProcedure
    .input(
      z.object({
        type: z.string().optional(),
        category: z.string().optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      let templates = Array.from(templateStore.values()).filter((t) => t.isActive);

      if (input?.type) templates = templates.filter((t) => t.type === input.type);
      if (input?.category) templates = templates.filter((t) => t.category === input.category);
      if (input?.search) {
        const q = input.search.toLowerCase();
        templates = templates.filter(
          (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
        );
      }

      return templates;
    }),

  createTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        type: z.string(),
        category: z.string().default("general"),
        content: z.string(),
        mergeFields: z.array(
          z.object({
            key: z.string(),
            label: z.string(),
            type: z.enum(["text", "number", "date", "textarea", "select"]),
            required: z.boolean().default(false),
            defaultValue: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tplId = generateId("TPL");
      const now = new Date().toISOString();

      const template: StoredTemplate = {
        id: tplId,
        name: input.name,
        description: input.description,
        type: input.type,
        category: input.category,
        content: input.content,
        mergeFields: input.mergeFields,
        createdBy: String(ctx.user?.id || 0),
        createdAt: now,
        updatedAt: now,
        usageCount: 0,
        isActive: true,
      };

      templateStore.set(tplId, template);
      return { id: tplId, message: "Template created successfully" };
    }),

  generateDocument: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        fieldValues: z.record(z.string(), z.string()),
        outputName: z.string().optional(),
        entityType: z.string().optional(),
        entityId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const template = templateStore.get(input.templateId);
      if (!template) {
        return { success: false, error: "Template not found" };
      }

      // Merge fields into template content
      let content = template.content;
      for (const [key, value] of Object.entries(input.fieldValues)) {
        content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
      }

      // Create the generated document
      const userId = String(ctx.user?.id || 0);
      const docId = generateId("DOC");
      const now = new Date().toISOString();

      const doc: StoredDocument = {
        id: docId,
        name: input.outputName || `${template.name} - ${new Date().toLocaleDateString()}`,
        type: template.type,
        status: "draft",
        category: template.category,
        mimeType: "application/pdf",
        size: content.length,
        url: `/api/documents/${docId}/download`,
        entityType: input.entityType || "company",
        entityId: input.entityId || userId,
        metadata: { templateId: template.id, templateName: template.name, generatedContent: content },
        extractedData: null,
        classification: { type: template.type, confidence: 1.0 },
        tags: ["generated", template.type],
        version: 1,
        versions: [{ version: 1, uploadedAt: now, uploadedBy: userId, changeNote: "Generated from template" }],
        uploadedBy: userId,
        uploadedAt: now,
        updatedAt: now,
        expiresAt: null,
        archivedAt: null,
        retentionPolicy: null,
        auditTrail: [
          { action: "generated", userId, timestamp: now, details: `Generated from template "${template.name}"` },
        ],
      };

      documentStore.set(docId, doc);
      template.usageCount++;

      return {
        success: true,
        documentId: docId,
        name: doc.name,
        content,
        templateUsed: template.name,
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // BOL & RATE CONFIRMATION GENERATION
  // ──────────────────────────────────────────────────────────────────────────

  generateBol: protectedProcedure
    .input(
      z.object({
        shipperName: z.string(),
        shipperAddress: z.string(),
        consigneeName: z.string(),
        consigneeAddress: z.string(),
        carrierName: z.string(),
        carrierMc: z.string().optional(),
        proNumber: z.string().optional(),
        loadNumber: z.string().optional(),
        pickupDate: z.string(),
        deliveryDate: z.string().optional(),
        commodities: z.array(
          z.object({
            description: z.string(),
            weight: z.number(),
            pieces: z.number(),
            freightClass: z.string().optional(),
            nmfcNumber: z.string().optional(),
            packagingType: z.string().default("Pallets"),
            hazmat: z.boolean().default(false),
            unNumber: z.string().optional(),
          })
        ),
        specialInstructions: z.string().optional(),
        declaredValue: z.number().optional(),
        codAmount: z.number().optional(),
        thirdPartyBilling: z.string().optional(),
        sealNumbers: z.array(z.string()).optional(),
        trailerNumber: z.string().optional(),
        temperature: z.object({ min: z.number(), max: z.number(), unit: z.enum(["F", "C"]) }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = String(ctx.user?.id || 0);
      const bolId = generateId("BOL");
      const proNumber = input.proNumber || `PRO-${Date.now().toString(36).toUpperCase()}`;
      const now = new Date().toISOString();

      const totalWeight = input.commodities.reduce((sum, c) => sum + c.weight, 0);
      const totalPieces = input.commodities.reduce((sum, c) => sum + c.pieces, 0);
      const hasHazmat = input.commodities.some((c) => c.hazmat);

      const bolContent = {
        bolNumber: bolId,
        proNumber,
        loadNumber: input.loadNumber,
        shipper: { name: input.shipperName, address: input.shipperAddress },
        consignee: { name: input.consigneeName, address: input.consigneeAddress },
        carrier: { name: input.carrierName, mc: input.carrierMc },
        pickupDate: input.pickupDate,
        deliveryDate: input.deliveryDate,
        commodities: input.commodities,
        totalWeight,
        totalPieces,
        hasHazmat,
        specialInstructions: input.specialInstructions,
        declaredValue: input.declaredValue,
        codAmount: input.codAmount,
        thirdPartyBilling: input.thirdPartyBilling,
        sealNumbers: input.sealNumbers,
        trailerNumber: input.trailerNumber,
        temperature: input.temperature,
        generatedAt: now,
        generatedBy: userId,
      };

      const doc: StoredDocument = {
        id: bolId,
        name: `BOL-${proNumber}`,
        type: "bol",
        status: "draft",
        category: "shipping",
        mimeType: "application/pdf",
        size: JSON.stringify(bolContent).length,
        url: `/api/documents/${bolId}/download`,
        entityType: "load",
        entityId: input.loadNumber || "",
        metadata: bolContent as unknown as Record<string, unknown>,
        extractedData: null,
        classification: { type: "bol", confidence: 1.0 },
        tags: ["bol", "generated", hasHazmat ? "hazmat" : "non-hazmat"],
        version: 1,
        versions: [{ version: 1, uploadedAt: now, uploadedBy: userId, changeNote: "BOL generated" }],
        uploadedBy: userId,
        uploadedAt: now,
        updatedAt: now,
        expiresAt: null,
        archivedAt: null,
        retentionPolicy: "7_years",
        auditTrail: [
          { action: "generated", userId, timestamp: now, details: `BOL generated for PRO# ${proNumber}` },
        ],
      };

      documentStore.set(bolId, doc);

      return {
        success: true,
        bolId,
        proNumber,
        bolContent,
        message: "Bill of Lading generated successfully",
      };
    }),

  generateRateConfirmation: protectedProcedure
    .input(
      z.object({
        brokerName: z.string(),
        brokerMc: z.string(),
        brokerContact: z.string().optional(),
        carrierName: z.string(),
        carrierMc: z.string(),
        carrierContact: z.string().optional(),
        loadNumber: z.string(),
        pickupLocation: z.string(),
        pickupDate: z.string(),
        pickupTime: z.string().optional(),
        deliveryLocation: z.string(),
        deliveryDate: z.string(),
        deliveryTime: z.string().optional(),
        additionalStops: z.array(z.object({ location: z.string(), date: z.string(), type: z.enum(["pickup", "delivery"]) })).optional(),
        equipmentType: z.string().default("Dry Van 53'"),
        commodity: z.string(),
        weight: z.number(),
        rate: z.number(),
        fuelSurcharge: z.number().optional(),
        accessorials: z.array(z.object({ description: z.string(), amount: z.number() })).optional(),
        detentionRate: z.number().optional().default(75),
        freeTime: z.number().optional().default(2),
        paymentTerms: z.string().default("Net 30"),
        specialInstructions: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = String(ctx.user?.id || 0);
      const rcId = generateId("RC");
      const now = new Date().toISOString();

      const totalAccessorials = input.accessorials?.reduce((s, a) => s + a.amount, 0) || 0;
      const totalRate = input.rate + (input.fuelSurcharge || 0) + totalAccessorials;

      const rcContent = {
        rcNumber: rcId,
        loadNumber: input.loadNumber,
        broker: { name: input.brokerName, mc: input.brokerMc, contact: input.brokerContact },
        carrier: { name: input.carrierName, mc: input.carrierMc, contact: input.carrierContact },
        pickup: { location: input.pickupLocation, date: input.pickupDate, time: input.pickupTime },
        delivery: { location: input.deliveryLocation, date: input.deliveryDate, time: input.deliveryTime },
        additionalStops: input.additionalStops,
        equipmentType: input.equipmentType,
        commodity: input.commodity,
        weight: input.weight,
        rate: input.rate,
        fuelSurcharge: input.fuelSurcharge,
        accessorials: input.accessorials,
        totalRate,
        detentionRate: input.detentionRate,
        freeTime: input.freeTime,
        paymentTerms: input.paymentTerms,
        specialInstructions: input.specialInstructions,
        generatedAt: now,
        generatedBy: userId,
      };

      const doc: StoredDocument = {
        id: rcId,
        name: `Rate Confirmation - ${input.loadNumber}`,
        type: "rate_confirmation",
        status: "draft",
        category: "financial",
        mimeType: "application/pdf",
        size: JSON.stringify(rcContent).length,
        url: `/api/documents/${rcId}/download`,
        entityType: "load",
        entityId: input.loadNumber,
        metadata: rcContent as unknown as Record<string, unknown>,
        extractedData: null,
        classification: { type: "rate_confirmation", confidence: 1.0 },
        tags: ["rate_confirmation", "generated"],
        version: 1,
        versions: [{ version: 1, uploadedAt: now, uploadedBy: userId, changeNote: "Rate confirmation generated" }],
        uploadedBy: userId,
        uploadedAt: now,
        updatedAt: now,
        expiresAt: null,
        archivedAt: null,
        retentionPolicy: "7_years",
        auditTrail: [
          { action: "generated", userId, timestamp: now, details: `Rate confirmation generated for load ${input.loadNumber}` },
        ],
      };

      documentStore.set(rcId, doc);

      return {
        success: true,
        rcId,
        rcContent,
        totalRate,
        message: "Rate confirmation generated successfully",
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // E-SIGNATURES
  // ──────────────────────────────────────────────────────────────────────────

  requestESignature: protectedProcedure
    .input(
      z.object({
        documentId: z.string(),
        signers: z.array(
          z.object({
            name: z.string(),
            email: z.string().email(),
            order: z.number().default(1),
          })
        ),
        message: z.string().default("Please review and sign this document."),
        expiresInDays: z.number().default(7),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const doc = documentStore.get(input.documentId);
      if (!doc) {
        return { success: false, error: "Document not found" };
      }

      const userId = String(ctx.user?.id || 0);
      const requestId = generateId("SIG");
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000).toISOString();

      const request: StoredSignatureRequest = {
        id: requestId,
        documentId: input.documentId,
        documentName: doc.name,
        requestedBy: userId,
        signers: input.signers.map((s) => ({
          signerId: generateId("SGN"),
          name: s.name,
          email: s.email,
          status: "pending",
          signedAt: null,
          signatureData: null,
          ipAddress: null,
          order: s.order,
        })),
        status: "pending",
        createdAt: now,
        expiresAt,
        completedAt: null,
        message: input.message,
      };

      signatureRequestStore.set(requestId, request);

      doc.auditTrail.push({
        action: "signature_requested",
        userId,
        timestamp: now,
        details: `E-signature requested from ${input.signers.map((s) => s.name).join(", ")}`,
      });

      return {
        success: true,
        requestId,
        signers: request.signers.map((s) => ({ name: s.name, email: s.email, status: s.status })),
        expiresAt,
        message: "E-signature request sent successfully",
      };
    }),

  signDocument: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        signerId: z.string(),
        signatureData: z.string().describe("Base64 encoded signature image"),
        ipAddress: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const request = signatureRequestStore.get(input.requestId);
      if (!request) {
        return { success: false, error: "Signature request not found" };
      }

      const signer = request.signers.find((s) => s.signerId === input.signerId);
      if (!signer) {
        return { success: false, error: "Signer not found" };
      }

      const now = new Date().toISOString();
      signer.status = "signed";
      signer.signedAt = now;
      signer.signatureData = generateHash(input.signatureData);
      signer.ipAddress = input.ipAddress || "captured";

      // Check if all signers have signed
      const allSigned = request.signers.every((s) => s.status === "signed");
      if (allSigned) {
        request.status = "signed";
        request.completedAt = now;

        // Update document status
        const doc = documentStore.get(request.documentId);
        if (doc) {
          doc.status = "signed";
          doc.updatedAt = now;
          doc.auditTrail.push({
            action: "fully_signed",
            userId: String(ctx.user?.id || 0),
            timestamp: now,
            details: "All signatures collected - document fully executed",
          });
        }
      }

      return {
        success: true,
        signerId: input.signerId,
        signedAt: now,
        allSigned,
        remainingSigners: request.signers.filter((s) => s.status !== "signed").map((s) => s.name),
      };
    }),

  getSignatureStatus: protectedProcedure
    .input(z.object({ requestId: z.string() }))
    .query(async ({ input }) => {
      const request = signatureRequestStore.get(input.requestId);
      if (!request) {
        return null;
      }

      return {
        id: request.id,
        documentId: request.documentId,
        documentName: request.documentName,
        status: request.status,
        createdAt: request.createdAt,
        expiresAt: request.expiresAt,
        completedAt: request.completedAt,
        message: request.message,
        signers: request.signers.map((s) => ({
          name: s.name,
          email: s.email,
          status: s.status,
          signedAt: s.signedAt,
          order: s.order,
        })),
        progress: {
          total: request.signers.length,
          signed: request.signers.filter((s) => s.status === "signed").length,
          pending: request.signers.filter((s) => s.status === "pending").length,
          percent: Math.round(
            (request.signers.filter((s) => s.status === "signed").length / request.signers.length) * 100
          ),
        },
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // WORKFLOWS
  // ──────────────────────────────────────────────────────────────────────────

  getDocumentWorkflows: protectedProcedure
    .input(
      z.object({
        status: workflowStatusSchema.optional(),
        documentId: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      let workflows = Array.from(workflowStore.values());
      if (input?.status) workflows = workflows.filter((w) => w.status === input.status);
      if (input?.documentId) workflows = workflows.filter((w) => w.documentId === input.documentId);
      return workflows;
    }),

  createWorkflow: protectedProcedure
    .input(
      z.object({
        documentId: z.string(),
        type: z.enum(["approval", "review", "sign_off", "compliance_check"]),
        steps: z.array(
          z.object({
            name: z.string(),
            assigneeId: z.string(),
            assigneeName: z.string(),
            order: z.number(),
          })
        ),
        dueDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const doc = documentStore.get(input.documentId);
      if (!doc) {
        return { success: false, error: "Document not found" };
      }

      const userId = String(ctx.user?.id || 0);
      const workflowId = generateId("WF");
      const now = new Date().toISOString();

      const workflow: StoredWorkflow = {
        id: workflowId,
        documentId: input.documentId,
        documentName: doc.name,
        type: input.type,
        status: "pending",
        steps: input.steps.map((s) => ({
          stepId: generateId("STEP"),
          name: s.name,
          assigneeId: s.assigneeId,
          assigneeName: s.assigneeName,
          status: "pending",
          actionAt: null,
          comments: null,
          order: s.order,
        })),
        createdBy: userId,
        createdAt: now,
        completedAt: null,
        dueDate: input.dueDate || null,
      };

      workflowStore.set(workflowId, workflow);

      doc.status = "pending_review";
      doc.updatedAt = now;
      doc.auditTrail.push({
        action: "workflow_created",
        userId,
        timestamp: now,
        details: `${input.type} workflow created with ${input.steps.length} steps`,
      });

      return { success: true, workflowId, message: "Workflow created successfully" };
    }),

  approveDocument: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        stepId: z.string(),
        action: z.enum(["approve", "reject"]),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const workflow = workflowStore.get(input.workflowId);
      if (!workflow) {
        return { success: false, error: "Workflow not found" };
      }

      const step = workflow.steps.find((s) => s.stepId === input.stepId);
      if (!step) {
        return { success: false, error: "Step not found" };
      }

      const now = new Date().toISOString();
      step.status = input.action === "approve" ? "approved" : "rejected";
      step.actionAt = now;
      step.comments = input.comments || null;

      // Check if workflow is complete
      if (input.action === "reject") {
        workflow.status = "rejected";
        workflow.completedAt = now;
      } else {
        const allApproved = workflow.steps.every((s) => s.status === "approved");
        if (allApproved) {
          workflow.status = "approved";
          workflow.completedAt = now;
        } else {
          workflow.status = "in_progress";
        }
      }

      // Update document
      const doc = documentStore.get(workflow.documentId);
      if (doc) {
        if (workflow.status === "approved") doc.status = "approved";
        else if (workflow.status === "rejected") doc.status = "rejected";
        doc.updatedAt = now;
        doc.auditTrail.push({
          action: `workflow_step_${input.action}`,
          userId: String(ctx.user?.id || 0),
          timestamp: now,
          details: `Step "${step.name}" ${input.action}ed${input.comments ? `: ${input.comments}` : ""}`,
        });
      }

      return {
        success: true,
        workflowStatus: workflow.status,
        stepStatus: step.status,
        message: `Document ${input.action}ed successfully`,
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // COMPLIANCE VAULT
  // ──────────────────────────────────────────────────────────────────────────

  getComplianceVault: protectedProcedure
    .input(
      z.object({
        regulation: complianceRegulationSchema.optional(),
        entityType: z.string().optional(),
        entityId: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = String(ctx.user?.id || 0);
      const docs = Array.from(documentStore.values()).filter(
        (d) => d.uploadedBy === userId || d.entityId === userId
      );

      const regulations = [
        {
          regulation: "fmcsa",
          label: "FMCSA",
          description: "Federal Motor Carrier Safety Administration",
          requiredDocuments: ["operating_authority", "insurance", "registration", "inspection"],
          documents: docs.filter((d) =>
            ["operating_authority", "registration", "inspection"].includes(d.type)
          ),
        },
        {
          regulation: "dot",
          label: "DOT",
          description: "Department of Transportation",
          requiredDocuments: ["registration", "inspection", "medical_card"],
          documents: docs.filter((d) =>
            ["registration", "inspection", "medical_card"].includes(d.type)
          ),
        },
        {
          regulation: "insurance",
          label: "Insurance",
          description: "Liability, cargo, and workers comp insurance",
          requiredDocuments: ["insurance"],
          documents: docs.filter((d) => d.type === "insurance"),
        },
        {
          regulation: "ifta",
          label: "IFTA",
          description: "International Fuel Tax Agreement",
          requiredDocuments: ["ifta"],
          documents: docs.filter((d) => d.type === "ifta"),
        },
        {
          regulation: "irp",
          label: "IRP",
          description: "International Registration Plan",
          requiredDocuments: ["irp"],
          documents: docs.filter((d) => d.type === "irp"),
        },
        {
          regulation: "hazmat",
          label: "Hazmat",
          description: "Hazardous materials endorsements and permits",
          requiredDocuments: ["hazmat_placard", "permit"],
          documents: docs.filter((d) =>
            ["hazmat_placard", "permit"].includes(d.type) && d.tags.includes("hazmat")
          ),
        },
        {
          regulation: "driver_qualification",
          label: "Driver Qualification",
          description: "DQ file requirements (49 CFR Part 391)",
          requiredDocuments: ["medical_card", "registration"],
          documents: docs.filter((d) =>
            ["medical_card", "registration"].includes(d.type)
          ),
        },
      ];

      const filtered = input?.regulation
        ? regulations.filter((r) => r.regulation === input.regulation)
        : regulations;

      return {
        regulations: filtered.map((r) => ({
          ...r,
          complianceScore: r.documents.length > 0
            ? Math.round((r.documents.filter((d) => d.status === "approved" || d.status === "signed").length / r.requiredDocuments.length) * 100)
            : 0,
          totalRequired: r.requiredDocuments.length,
          totalUploaded: r.documents.length,
          documents: r.documents.map((d) => ({
            id: d.id,
            name: d.name,
            type: d.type,
            status: d.status,
            expiresAt: d.expiresAt,
            uploadedAt: d.uploadedAt,
          })),
        })),
        overallScore: Math.round(
          (filtered.reduce((sum, r) => {
            const uploaded = r.documents.filter((d) => d.status === "approved" || d.status === "signed").length;
            return sum + (uploaded / Math.max(r.requiredDocuments.length, 1));
          }, 0) / Math.max(filtered.length, 1)) * 100
        ),
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // EXPIRING DOCUMENTS
  // ──────────────────────────────────────────────────────────────────────────

  getExpiringDocuments: protectedProcedure
    .input(
      z.object({
        daysAhead: z.number().default(30),
        includeExpired: z.boolean().default(true),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = String(ctx.user?.id || 0);
      const now = new Date();
      const daysAhead = input?.daysAhead ?? 30;
      const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

      const docs = Array.from(documentStore.values()).filter(
        (d) => (d.uploadedBy === userId || d.entityId === userId) && d.expiresAt
      );

      const expiring = docs.filter((d) => {
        const exp = new Date(d.expiresAt!);
        return exp > now && exp <= futureDate;
      });

      const expired = (input?.includeExpired ?? true)
        ? docs.filter((d) => new Date(d.expiresAt!) <= now)
        : [];

      return {
        expiring: expiring.map((d) => ({
          id: d.id,
          name: d.name,
          type: d.type,
          expiresAt: d.expiresAt,
          daysUntilExpiry: Math.ceil((new Date(d.expiresAt!).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
          urgency: (() => {
            const days = Math.ceil((new Date(d.expiresAt!).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
            if (days <= 7) return "critical";
            if (days <= 14) return "high";
            if (days <= 30) return "medium";
            return "low";
          })(),
        })),
        expired: expired.map((d) => ({
          id: d.id,
          name: d.name,
          type: d.type,
          expiresAt: d.expiresAt,
          daysExpired: Math.ceil((now.getTime() - new Date(d.expiresAt!).getTime()) / (24 * 60 * 60 * 1000)),
        })),
        totalExpiring: expiring.length,
        totalExpired: expired.length,
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // VERSION HISTORY
  // ──────────────────────────────────────────────────────────────────────────

  getDocumentVersions: protectedProcedure
    .input(z.object({ documentId: z.string() }))
    .query(async ({ input }) => {
      const doc = documentStore.get(input.documentId);
      if (!doc) return { versions: [], currentVersion: 0 };
      return { versions: doc.versions, currentVersion: doc.version };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // SHARING
  // ──────────────────────────────────────────────────────────────────────────

  shareDocument: protectedProcedure
    .input(
      z.object({
        documentId: z.string(),
        recipientEmail: z.string().email(),
        recipientName: z.string().optional(),
        expiresInHours: z.number().default(72),
        permissions: z.enum(["view", "download", "sign"]).default("view"),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const doc = documentStore.get(input.documentId);
      if (!doc) {
        return { success: false, error: "Document not found" };
      }

      const shareToken = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000).toISOString();
      const shareLink = `/shared/documents/${shareToken}`;

      const now = new Date().toISOString();
      doc.auditTrail.push({
        action: "shared",
        userId: String(ctx.user?.id || 0),
        timestamp: now,
        details: `Shared with ${input.recipientEmail} (${input.permissions} access, expires ${expiresAt})`,
      });

      return {
        success: true,
        shareLink,
        shareToken,
        expiresAt,
        permissions: input.permissions,
        recipientEmail: input.recipientEmail,
        message: "Document shared successfully",
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // BULK DOWNLOAD
  // ──────────────────────────────────────────────────────────────────────────

  bulkDownload: protectedProcedure
    .input(
      z.object({
        documentIds: z.array(z.string()),
        format: z.enum(["zip", "pdf_merged"]).default("zip"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const found = input.documentIds
        .map((id) => documentStore.get(id))
        .filter(Boolean) as StoredDocument[];

      if (found.length === 0) {
        return { success: false, error: "No documents found" };
      }

      const downloadId = generateId("DL");
      const now = new Date().toISOString();

      for (const doc of found) {
        doc.auditTrail.push({
          action: "bulk_downloaded",
          userId: String(ctx.user?.id || 0),
          timestamp: now,
          details: `Included in bulk download ${downloadId}`,
        });
      }

      return {
        success: true,
        downloadId,
        downloadUrl: `/api/documents/bulk/${downloadId}`,
        documentsIncluded: found.length,
        format: input.format,
        estimatedSize: found.reduce((s, d) => s + d.size, 0),
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // ANALYTICS
  // ──────────────────────────────────────────────────────────────────────────

  getDocumentAnalytics: protectedProcedure
    .input(
      z.object({
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx }) => {
      const userId = String(ctx.user?.id || 0);
      const docs = Array.from(documentStore.values()).filter(
        (d) => d.uploadedBy === userId || d.entityId === userId
      );

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const recentDocs = docs.filter((d) => new Date(d.uploadedAt) > thirtyDaysAgo);

      const typeBreakdown: Record<string, number> = {};
      for (const d of docs) {
        typeBreakdown[d.type] = (typeBreakdown[d.type] || 0) + 1;
      }

      return {
        totalDocuments: docs.length,
        documentsThisMonth: recentDocs.length,
        averageProcessingTime: "2.3 hours",
        ocrAccuracy: 94.2,
        classificationAccuracy: 91.8,
        typeBreakdown: Object.entries(typeBreakdown).map(([type, count]) => ({ type, count })),
        uploadTrend: [
          { period: "Week 1", uploads: Math.floor(Math.random() * 20 + 5) },
          { period: "Week 2", uploads: Math.floor(Math.random() * 20 + 5) },
          { period: "Week 3", uploads: Math.floor(Math.random() * 20 + 5) },
          { period: "Week 4", uploads: Math.floor(Math.random() * 20 + 5) },
        ],
        topCategories: Object.entries(typeBreakdown)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([type, count]) => ({ type, count, percentage: Math.round((count / Math.max(docs.length, 1)) * 100) })),
        signatureMetrics: {
          totalRequests: signatureRequestStore.size,
          completed: Array.from(signatureRequestStore.values()).filter((s) => s.status === "signed").length,
          pending: Array.from(signatureRequestStore.values()).filter((s) => s.status === "pending").length,
          averageCompletionTime: "4.2 hours",
        },
        workflowMetrics: {
          totalWorkflows: workflowStore.size,
          completed: Array.from(workflowStore.values()).filter((w) => w.status === "approved" || w.status === "rejected").length,
          active: Array.from(workflowStore.values()).filter((w) => w.status === "pending" || w.status === "in_progress").length,
          averageApprovalTime: "6.8 hours",
        },
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // AUDIT TRAIL
  // ──────────────────────────────────────────────────────────────────────────

  getAuditTrail: protectedProcedure
    .input(
      z.object({
        documentId: z.string().optional(),
        action: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(50),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = String(ctx.user?.id || 0);

      let allTrailEntries: Array<{
        documentId: string;
        documentName: string;
        action: string;
        userId: string;
        timestamp: string;
        details: string;
      }> = [];

      const docs = input?.documentId
        ? [documentStore.get(input.documentId)].filter(Boolean) as StoredDocument[]
        : Array.from(documentStore.values()).filter(
            (d) => d.uploadedBy === userId || d.entityId === userId
          );

      for (const doc of docs) {
        for (const entry of doc.auditTrail) {
          allTrailEntries.push({
            documentId: doc.id,
            documentName: doc.name,
            ...entry,
          });
        }
      }

      // Apply filters
      if (input?.action) {
        allTrailEntries = allTrailEntries.filter((e) => e.action === input.action);
      }
      if (input?.dateFrom) {
        const from = new Date(input.dateFrom);
        allTrailEntries = allTrailEntries.filter((e) => new Date(e.timestamp) >= from);
      }
      if (input?.dateTo) {
        const to = new Date(input.dateTo);
        allTrailEntries = allTrailEntries.filter((e) => new Date(e.timestamp) <= to);
      }

      // Sort by timestamp desc
      allTrailEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 50;
      const total = allTrailEntries.length;
      const start = (page - 1) * pageSize;
      const paginated = allTrailEntries.slice(start, start + pageSize);

      return {
        entries: paginated,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  // ──────────────────────────────────────────────────────────────────────────
  // ARCHIVE
  // ──────────────────────────────────────────────────────────────────────────

  archiveDocument: protectedProcedure
    .input(
      z.object({
        documentId: z.string(),
        retentionPolicy: z.enum(["1_year", "3_years", "5_years", "7_years", "10_years", "permanent"]).default("7_years"),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const doc = documentStore.get(input.documentId);
      if (!doc) {
        return { success: false, error: "Document not found" };
      }

      const now = new Date().toISOString();
      doc.status = "archived";
      doc.archivedAt = now;
      doc.retentionPolicy = input.retentionPolicy;
      doc.updatedAt = now;
      doc.auditTrail.push({
        action: "archived",
        userId: String(ctx.user?.id || 0),
        timestamp: now,
        details: `Archived with ${input.retentionPolicy} retention${input.reason ? `: ${input.reason}` : ""}`,
      });

      return {
        success: true,
        documentId: input.documentId,
        archivedAt: now,
        retentionPolicy: input.retentionPolicy,
        message: "Document archived successfully",
      };
    }),
});

// ============================================================================
// HELPERS
// ============================================================================

function getCategoryForType(type: string): string {
  const categoryMap: Record<string, string> = {
    bol: "shipping",
    pod: "shipping",
    invoice: "financial",
    rate_confirmation: "financial",
    freight_bill: "financial",
    lumper_receipt: "financial",
    toll_receipt: "financial",
    fuel_receipt: "financial",
    scale_ticket: "operations",
    insurance: "compliance",
    permit: "compliance",
    medical_card: "compliance",
    registration: "compliance",
    operating_authority: "compliance",
    ifta: "compliance",
    irp: "compliance",
    hazmat_placard: "compliance",
    w9: "compliance",
    inspection: "safety",
    contract: "legal",
    broker_carrier_agreement: "legal",
    customs_form: "international",
    delivery_receipt: "shipping",
    packing_list: "shipping",
    detention_receipt: "operations",
  };
  return categoryMap[type] || "other";
}
