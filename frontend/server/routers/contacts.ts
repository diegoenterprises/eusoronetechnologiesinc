/**
 * CONTACTS ROUTER
 * tRPC procedures for contact and address book management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const contactTypeSchema = z.enum([
  "shipper", "carrier", "broker", "driver", "terminal", "vendor", "other"
]);

export const contactsRouter = router({
  /**
   * List contacts
   */
  list: protectedProcedure
    .input(z.object({
      type: contactTypeSchema.optional(),
      search: z.string().optional(),
      favorite: z.boolean().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const contacts = [
        {
          id: "con_001",
          type: "shipper",
          name: "Shell Oil Company",
          company: "Shell Oil Company",
          email: "dispatch@shell.com",
          phone: "555-0200",
          address: { city: "Houston", state: "TX" },
          favorite: true,
          lastContact: "2025-01-22",
        },
        {
          id: "con_002",
          type: "carrier",
          name: "John Manager",
          company: "ABC Transport LLC",
          email: "john@abctransport.com",
          phone: "555-0100",
          address: { city: "Houston", state: "TX" },
          favorite: true,
          lastContact: "2025-01-23",
        },
        {
          id: "con_003",
          type: "terminal",
          name: "Houston Terminal Dispatch",
          company: "Shell Houston Terminal",
          email: "dispatch@shell-houston.com",
          phone: "555-0150",
          address: { city: "Houston", state: "TX" },
          favorite: false,
          lastContact: "2025-01-20",
        },
        {
          id: "con_004",
          type: "driver",
          name: "Mike Johnson",
          company: "ABC Transport LLC",
          email: "mike.j@abctransport.com",
          phone: "555-0101",
          address: { city: "Houston", state: "TX" },
          favorite: false,
          lastContact: "2025-01-23",
        },
        {
          id: "con_005",
          type: "vendor",
          name: "QuickFix Truck Repair",
          company: "QuickFix Truck Repair",
          email: "service@quickfix.com",
          phone: "555-0300",
          address: { city: "Dallas", state: "TX" },
          favorite: false,
          lastContact: "2025-01-15",
        },
      ];

      let filtered = contacts;
      if (input.type) filtered = filtered.filter(c => c.type === input.type);
      if (input.favorite !== undefined) filtered = filtered.filter(c => c.favorite === input.favorite);
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(c => 
          c.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
        );
      }

      return {
        contacts: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
      };
    }),

  /**
   * Get contact by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        type: "shipper",
        name: "Shell Oil Company",
        company: "Shell Oil Company",
        title: "Dispatch Coordinator",
        email: "dispatch@shell.com",
        phone: "555-0200",
        mobile: "555-0201",
        fax: "555-0202",
        address: {
          street: "1234 Energy Way",
          city: "Houston",
          state: "TX",
          zip: "77001",
        },
        website: "https://www.shell.com",
        notes: "Primary contact for Houston area loads. Available 24/7 for emergencies.",
        tags: ["vip", "hazmat", "tanker"],
        favorite: true,
        createdAt: "2023-01-15",
        lastContact: "2025-01-22",
        history: [
          { date: "2025-01-22", type: "call", notes: "Discussed upcoming load schedule" },
          { date: "2025-01-15", type: "email", notes: "Sent rate confirmation" },
          { date: "2025-01-10", type: "meeting", notes: "Quarterly review meeting" },
        ],
      };
    }),

  /**
   * Create contact
   */
  create: protectedProcedure
    .input(z.object({
      type: contactTypeSchema,
      name: z.string(),
      company: z.string().optional(),
      title: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      mobile: z.string().optional(),
      address: z.object({
        street: z.string().optional(),
        city: z.string(),
        state: z.string(),
        zip: z.string().optional(),
      }).optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `con_${Date.now()}`,
        ...input,
        createdBy: ctx.user?.id,
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Update contact
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      company: z.string().optional(),
      title: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      mobile: z.string().optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        id: input.id,
        updatedBy: ctx.user?.id,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Delete contact
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        id: input.id,
        deletedAt: new Date().toISOString(),
      };
    }),

  /**
   * Toggle favorite
   */
  toggleFavorite: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        id: input.id,
        favorite: true,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Add contact interaction
   */
  addInteraction: protectedProcedure
    .input(z.object({
      contactId: z.string(),
      type: z.enum(["call", "email", "meeting", "note"]),
      notes: z.string(),
      date: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `int_${Date.now()}`,
        contactId: input.contactId,
        type: input.type,
        notes: input.notes,
        date: input.date || new Date().toISOString(),
        createdBy: ctx.user?.id,
      };
    }),

  /**
   * Import contacts
   */
  importContacts: protectedProcedure
    .input(z.object({
      source: z.enum(["csv", "google", "outlook"]),
      data: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        imported: 15,
        duplicates: 3,
        errors: 0,
        importId: `import_${Date.now()}`,
      };
    }),

  /**
   * Export contacts
   */
  exportContacts: protectedProcedure
    .input(z.object({
      format: z.enum(["csv", "vcf", "json"]),
      type: contactTypeSchema.optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        downloadUrl: `/api/contacts/export?format=${input.format}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };
    }),

  /**
   * Get recent contacts
   */
  getRecent: protectedProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ input }) => {
      return [
        { id: "con_002", name: "John Manager", company: "ABC Transport LLC", lastContact: "2025-01-23" },
        { id: "con_004", name: "Mike Johnson", company: "ABC Transport LLC", lastContact: "2025-01-23" },
        { id: "con_001", name: "Shell Oil Company", company: "Shell Oil Company", lastContact: "2025-01-22" },
      ];
    }),

  /**
   * Search contacts globally
   */
  search: protectedProcedure
    .input(z.object({
      query: z.string(),
      limit: z.number().default(10),
    }))
    .query(async ({ input }) => {
      return [
        { id: "con_001", name: "Shell Oil Company", type: "shipper", email: "dispatch@shell.com" },
        { id: "con_002", name: "John Manager", type: "carrier", email: "john@abctransport.com" },
      ];
    }),

  /**
   * Merge contacts
   */
  merge: protectedProcedure
    .input(z.object({
      primaryId: z.string(),
      secondaryId: z.string(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        mergedId: input.primaryId,
        deletedId: input.secondaryId,
        mergedAt: new Date().toISOString(),
      };
    }),
});
