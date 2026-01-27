/**
 * DOCUMENTS ROUTER
 * tRPC procedures for document management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const documentCategorySchema = z.enum(["compliance", "insurance", "permits", "contracts", "invoices", "bols", "other"]);
const documentStatusSchema = z.enum(["active", "expired", "expiring_soon", "pending_review"]);

export const documentsRouter = router({
  /**
   * Get all documents for DocumentCenter
   */
  getAll: protectedProcedure
    .input(z.object({ search: z.string().optional(), category: z.string().optional() }))
    .query(async ({ input }) => {
      const docs = [
        { id: "d1", name: "MC Authority Letter.pdf", category: "permits", status: "active", uploadedAt: "2025-01-15", size: 245000 },
        { id: "d2", name: "Insurance Certificate.pdf", category: "insurance", status: "active", uploadedAt: "2025-01-10", size: 380000 },
        { id: "d3", name: "Cargo Policy.pdf", category: "insurance", status: "expiring", uploadedAt: "2025-01-10", size: 520000 },
      ];
      let filtered = docs;
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(d => d.name.toLowerCase().includes(q));
      }
      if (input.category && input.category !== "all") filtered = filtered.filter(d => d.category === input.category);
      return filtered;
    }),

  /**
   * Get document stats for DocumentCenter
   */
  getStats: protectedProcedure
    .query(async () => {
      return { total: 45, active: 40, valid: 40, expiring: 3, expired: 2 };
    }),

  /**
   * Get document categories
   */
  getCategories: protectedProcedure
    .query(async () => {
      return [
        { id: "permits", name: "Permits", count: 8 },
        { id: "insurance", name: "Insurance", count: 12 },
        { id: "compliance", name: "Compliance", count: 15 },
        { id: "contracts", name: "Contracts", count: 10 },
      ];
    }),

  /**
   * Delete document mutation
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, deletedId: input.id };
    }),

  /**
   * List all documents with filtering
   */
  list: protectedProcedure
    .input(z.object({
      category: documentCategorySchema.optional(),
      status: documentStatusSchema.optional(),
      search: z.string().optional(),
      relatedToType: z.string().optional(),
      relatedToId: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const documents = [
        {
          id: "doc_001",
          name: "MC Authority Letter.pdf",
          category: "permits",
          type: "pdf",
          size: 245000,
          uploadedBy: "John Admin",
          uploadedAt: "2025-01-15T10:30:00",
          status: "active",
          tags: ["authority", "fmcsa"],
        },
        {
          id: "doc_002",
          name: "Insurance Certificate - Liability.pdf",
          category: "insurance",
          type: "pdf",
          size: 380000,
          uploadedBy: "John Admin",
          uploadedAt: "2025-01-10T14:00:00",
          expirationDate: "2026-01-10",
          status: "active",
          tags: ["insurance", "liability"],
        },
        {
          id: "doc_003",
          name: "Cargo Insurance Policy.pdf",
          category: "insurance",
          type: "pdf",
          size: 520000,
          uploadedBy: "John Admin",
          uploadedAt: "2025-01-10T14:15:00",
          expirationDate: "2025-02-15",
          status: "expiring_soon",
          tags: ["insurance", "cargo"],
        },
        {
          id: "doc_004",
          name: "BOL-2025-0845.pdf",
          category: "bols",
          type: "pdf",
          size: 125000,
          uploadedBy: "System",
          uploadedAt: "2025-01-23T12:30:00",
          status: "active",
          tags: ["bol", "delivered"],
          relatedTo: { type: "load", id: "load_45918", name: "Load #45918" },
        },
      ];

      let filtered = documents;

      if (input.category) {
        filtered = filtered.filter(d => d.category === input.category);
      }
      if (input.status) {
        filtered = filtered.filter(d => d.status === input.status);
      }
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(d => 
          d.name.toLowerCase().includes(q) || 
          d.tags.some(t => t.toLowerCase().includes(q))
        );
      }

      return {
        documents: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
        stats: {
          total: documents.length,
          expired: documents.filter(d => d.status === "expired").length,
          expiringSoon: documents.filter(d => d.status === "expiring_soon").length,
          storageUsed: documents.reduce((sum, d) => sum + d.size, 0),
        },
      };
    }),

  /**
   * Get single document by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        name: "MC Authority Letter.pdf",
        category: "permits",
        type: "pdf",
        size: 245000,
        uploadedBy: "John Admin",
        uploadedAt: "2025-01-15T10:30:00",
        status: "active",
        tags: ["authority", "fmcsa"],
        description: "Motor Carrier Authority documentation",
        url: "/documents/doc_001/download",
      };
    }),

  /**
   * Upload document
   */
  upload: protectedProcedure
    .input(z.object({
      name: z.string(),
      category: documentCategorySchema,
      description: z.string().optional(),
      expirationDate: z.string().optional(),
      tags: z.array(z.string()).optional(),
      relatedToType: z.string().optional(),
      relatedToId: z.string().optional(),
      fileData: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const documentId = `doc_${Date.now()}`;
      
      return {
        id: documentId,
        name: input.name,
        category: input.category,
        uploadedAt: new Date().toISOString(),
        uploadedBy: ctx.user?.name || "Unknown",
        status: "active",
      };
    }),

  /**
   * Delete document (detailed version)
   */
  deleteDetailed: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, id: input.id };
    }),

  /**
   * Update document metadata
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      category: documentCategorySchema.optional(),
      description: z.string().optional(),
      expirationDate: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      return { success: true, id: input.id, updatedAt: new Date().toISOString() };
    }),

  /**
   * Get expiring documents
   */
  getExpiring: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      return [
        {
          id: "doc_003",
          name: "Cargo Insurance Policy.pdf",
          category: "insurance",
          expirationDate: "2025-02-15",
          daysUntilExpiration: 22,
        },
        {
          id: "doc_005",
          name: "Medical Card - Mike Johnson.pdf",
          category: "compliance",
          expirationDate: "2025-02-01",
          daysUntilExpiration: 8,
          relatedTo: { type: "driver", id: "drv_001", name: "Mike Johnson" },
        },
      ];
    }),

  getSummary: protectedProcedure.query(async () => ({ total: 45, pending: 5, expiring: 3, categories: 6, valid: 35, expired: 2 })),
});
