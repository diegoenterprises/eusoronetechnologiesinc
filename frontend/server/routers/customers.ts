/**
 * CUSTOMERS ROUTER
 * tRPC procedures for customer relationship management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const customerTypeSchema = z.enum(["shipper", "consignee", "broker", "facility"]);
const customerStatusSchema = z.enum(["active", "inactive", "pending", "blocked"]);

export const customersRouter = router({
  /**
   * Get summary for CustomerDirectory page
   */
  getSummary: protectedProcedure
    .query(async () => {
      return { total: 45, active: 38, pending: 5, blocked: 2, totalRevenue: 1250000 };
    }),

  /**
   * List customers
   */
  list: protectedProcedure
    .input(z.object({
      type: customerTypeSchema.optional(),
      status: customerStatusSchema.optional(),
      search: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const customers = [
        {
          id: "cust_001",
          name: "Shell Oil Company",
          type: "shipper",
          status: "active",
          contact: "Sarah Shipper",
          email: "logistics@shell.com",
          phone: "555-0200",
          totalLoads: 156,
          totalRevenue: 185000,
          lastActivity: "2025-01-23",
          rating: 4.8,
        },
        {
          id: "cust_002",
          name: "ExxonMobil",
          type: "shipper",
          status: "active",
          contact: "John Exxon",
          email: "transport@exxon.com",
          phone: "555-0201",
          totalLoads: 124,
          totalRevenue: 148000,
          lastActivity: "2025-01-22",
          rating: 4.7,
        },
        {
          id: "cust_003",
          name: "7-Eleven Distribution",
          type: "consignee",
          status: "active",
          contact: "Mike Manager",
          email: "receiving@7eleven.com",
          phone: "555-0300",
          totalLoads: 89,
          totalRevenue: 0,
          lastActivity: "2025-01-23",
          rating: 4.5,
        },
        {
          id: "cust_004",
          name: "Valero",
          type: "shipper",
          status: "active",
          contact: "Lisa Valero",
          email: "logistics@valero.com",
          phone: "555-0202",
          totalLoads: 98,
          totalRevenue: 115000,
          lastActivity: "2025-01-21",
          rating: 4.6,
        },
      ];

      let filtered = customers;
      if (input.type) filtered = filtered.filter(c => c.type === input.type);
      if (input.status) filtered = filtered.filter(c => c.status === input.status);
      if (input.search) {
        const search = input.search.toLowerCase();
        filtered = filtered.filter(c => 
          c.name.toLowerCase().includes(search) || 
          c.contact.toLowerCase().includes(search)
        );
      }

      return {
        customers: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
      };
    }),

  /**
   * Get customer by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        name: "Shell Oil Company",
        type: "shipper",
        status: "active",
        companyInfo: {
          legalName: "Shell Oil Company",
          dba: "Shell",
          taxId: "**-***1234",
          mcNumber: null,
          dotNumber: null,
        },
        primaryContact: {
          name: "Sarah Shipper",
          title: "Logistics Manager",
          email: "sarah.shipper@shell.com",
          phone: "555-0200",
          mobile: "555-0210",
        },
        additionalContacts: [
          { name: "Tom Transport", title: "Transportation Coordinator", email: "tom.transport@shell.com", phone: "555-0220" },
          { name: "Amy Accounting", title: "AP Manager", email: "amy.accounting@shell.com", phone: "555-0230" },
        ],
        billingAddress: {
          street: "1234 Energy Plaza",
          city: "Houston",
          state: "TX",
          zip: "77001",
          country: "USA",
        },
        paymentTerms: "Net 30",
        creditLimit: 100000,
        currentBalance: 25000,
        statistics: {
          totalLoads: 156,
          totalRevenue: 185000,
          avgLoadValue: 1186,
          onTimePickup: 0.95,
          onTimeDelivery: 0.92,
          claimsRate: 0.02,
        },
        facilities: [
          { id: "fac_001", name: "Houston Terminal", address: "1234 Refinery Rd, Houston, TX", type: "origin" },
          { id: "fac_002", name: "Baytown Refinery", address: "5678 Industrial Blvd, Baytown, TX", type: "origin" },
        ],
        preferredLanes: [
          { origin: "Houston, TX", destination: "Dallas, TX", volume: 45 },
          { origin: "Houston, TX", destination: "San Antonio, TX", volume: 32 },
        ],
        notes: "Preferred customer. Priority scheduling during peak seasons.",
        createdAt: "2023-06-15",
        lastActivity: "2025-01-23",
      };
    }),

  /**
   * Create customer
   */
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      type: customerTypeSchema,
      contact: z.object({
        name: z.string(),
        title: z.string().optional(),
        email: z.string().email(),
        phone: z.string(),
      }),
      billingAddress: z.object({
        street: z.string(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
      }),
      paymentTerms: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `cust_${Date.now()}`,
        name: input.name,
        status: "active",
        createdBy: ctx.user?.id,
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Update customer
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      status: customerStatusSchema.optional(),
      contact: z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string(),
      }).optional(),
      paymentTerms: z.string().optional(),
      creditLimit: z.number().optional(),
      notes: z.string().optional(),
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
   * Get customer loads
   */
  getLoads: protectedProcedure
    .input(z.object({
      customerId: z.string(),
      status: z.enum(["all", "active", "completed"]).default("all"),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      return {
        loads: [
          { loadNumber: "LOAD-45850", status: "in_transit", origin: "Houston, TX", destination: "Dallas, TX", pickupDate: "2025-01-23", amount: 1250 },
          { loadNumber: "LOAD-45820", status: "delivered", origin: "Houston, TX", destination: "San Antonio, TX", pickupDate: "2025-01-20", amount: 980 },
          { loadNumber: "LOAD-45800", status: "delivered", origin: "Baytown, TX", destination: "Austin, TX", pickupDate: "2025-01-18", amount: 1100 },
        ],
        total: 156,
      };
    }),

  /**
   * Get customer invoices
   */
  getInvoices: protectedProcedure
    .input(z.object({
      customerId: z.string(),
      status: z.enum(["all", "pending", "paid", "overdue"]).default("all"),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      return {
        invoices: [
          { invoiceNumber: "INV-2025-00450", amount: 3500, status: "pending", dueDate: "2025-02-15", createdAt: "2025-01-15" },
          { invoiceNumber: "INV-2025-00420", amount: 2800, status: "paid", dueDate: "2025-02-01", paidAt: "2025-01-20" },
          { invoiceNumber: "INV-2025-00390", amount: 4200, status: "paid", dueDate: "2025-01-15", paidAt: "2025-01-10" },
        ],
        summary: {
          totalOutstanding: 3500,
          totalOverdue: 0,
          totalPaidThisMonth: 7000,
        },
      };
    }),

  /**
   * Add customer note
   */
  addNote: protectedProcedure
    .input(z.object({
      customerId: z.string(),
      content: z.string(),
      type: z.enum(["general", "billing", "operations", "complaint"]).default("general"),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `note_${Date.now()}`,
        customerId: input.customerId,
        createdBy: ctx.user?.id,
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Get customer notes
   */
  getNotes: protectedProcedure
    .input(z.object({
      customerId: z.string(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      return [
        { id: "note_001", type: "general", content: "Preferred customer. Priority scheduling.", createdBy: "John Broker", createdAt: "2025-01-15" },
        { id: "note_002", type: "operations", content: "Requires 2-hour delivery window notice.", createdBy: "Sarah Ops", createdAt: "2025-01-10" },
      ];
    }),

  /**
   * Get customer analytics
   */
  getAnalytics: protectedProcedure
    .input(z.object({
      customerId: z.string(),
      period: z.enum(["month", "quarter", "year"]).default("quarter"),
    }))
    .query(async ({ input }) => {
      return {
        customerId: input.customerId,
        period: input.period,
        revenue: {
          total: 45000,
          trend: "up",
          change: 12,
          byMonth: [
            { month: "2025-01", amount: 15000 },
            { month: "2024-12", amount: 14500 },
            { month: "2024-11", amount: 15500 },
          ],
        },
        loads: {
          total: 38,
          avgPerMonth: 12.7,
          trend: "stable",
        },
        performance: {
          onTimePickup: 0.95,
          onTimeDelivery: 0.92,
          avgTransitTime: 4.2,
          claimsRate: 0.02,
        },
        topLanes: [
          { origin: "Houston, TX", destination: "Dallas, TX", loads: 18, revenue: 22500 },
          { origin: "Houston, TX", destination: "San Antonio, TX", loads: 12, revenue: 14000 },
        ],
      };
    }),

  /**
   * Get top customers
   */
  getTopCustomers: protectedProcedure
    .input(z.object({
      metric: z.enum(["revenue", "loads", "growth"]).default("revenue"),
      period: z.enum(["month", "quarter", "year"]).default("quarter"),
      limit: z.number().default(10),
    }))
    .query(async ({ input }) => {
      return [
        { id: "cust_001", name: "Shell Oil Company", value: 45000, loads: 38, change: 12 },
        { id: "cust_002", name: "ExxonMobil", value: 38000, loads: 32, change: 8 },
        { id: "cust_004", name: "Valero", value: 32000, loads: 28, change: 15 },
        { id: "cust_005", name: "Chevron", value: 28000, loads: 24, change: 5 },
      ];
    }),

  /**
   * Export customers
   */
  export: protectedProcedure
    .input(z.object({
      format: z.enum(["csv", "xlsx"]),
      filters: z.object({
        type: customerTypeSchema.optional(),
        status: customerStatusSchema.optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        downloadUrl: `/api/customers/export/${Date.now()}.${input.format}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };
    }),

  // Additional customer procedures
  getAll: protectedProcedure.input(z.object({ search: z.string().optional() })).query(async () => [{ id: "c1", name: "Shell Oil", type: "shipper", status: "active" }]),
  getStats: protectedProcedure.query(async () => ({ total: 45, newThisMonth: 5, avgRevenue: 28000 })),
});
