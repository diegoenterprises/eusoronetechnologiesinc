/**
 * VENDORS ROUTER
 * tRPC procedures for vendor and supplier management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const vendorTypeSchema = z.enum([
  "maintenance", "fuel", "insurance", "parts", "tires", "equipment", "technology", "other"
]);
const vendorStatusSchema = z.enum(["active", "inactive", "pending", "suspended"]);

export const vendorsRouter = router({
  /**
   * List vendors
   */
  list: protectedProcedure
    .input(z.object({
      type: vendorTypeSchema.optional(),
      status: vendorStatusSchema.optional(),
      search: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const vendors = [
        {
          id: "vendor_001",
          name: "FleetPro Maintenance",
          type: "maintenance",
          status: "active",
          contact: "Mike Mechanic",
          email: "service@fleetpro.com",
          phone: "555-0500",
          totalSpend: 45000,
          rating: 4.8,
          lastService: "2025-01-20",
        },
        {
          id: "vendor_002",
          name: "Pilot Flying J",
          type: "fuel",
          status: "active",
          contact: "Account Manager",
          email: "fleet@pilotflyingj.com",
          phone: "555-0501",
          totalSpend: 125000,
          rating: 4.5,
          lastService: "2025-01-23",
        },
        {
          id: "vendor_003",
          name: "TruckTire Express",
          type: "tires",
          status: "active",
          contact: "Tom Tire",
          email: "service@trucktire.com",
          phone: "555-0502",
          totalSpend: 28000,
          rating: 4.7,
          lastService: "2025-01-18",
        },
        {
          id: "vendor_004",
          name: "SafeHaul Insurance",
          type: "insurance",
          status: "active",
          contact: "Sarah Agent",
          email: "commercial@safehaul.com",
          phone: "555-0503",
          totalSpend: 85000,
          rating: 4.6,
          lastService: "2025-01-01",
        },
      ];

      let filtered = vendors;
      if (input.type) filtered = filtered.filter(v => v.type === input.type);
      if (input.status) filtered = filtered.filter(v => v.status === input.status);
      if (input.search) {
        const search = input.search.toLowerCase();
        filtered = filtered.filter(v => v.name.toLowerCase().includes(search));
      }

      return {
        vendors: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
      };
    }),

  /**
   * Get vendor by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        name: "FleetPro Maintenance",
        type: "maintenance",
        status: "active",
        companyInfo: {
          legalName: "FleetPro Maintenance LLC",
          taxId: "**-***5678",
          established: "2010",
        },
        primaryContact: {
          name: "Mike Mechanic",
          title: "Fleet Account Manager",
          email: "mike@fleetpro.com",
          phone: "555-0500",
          mobile: "555-0510",
        },
        addresses: [
          { type: "main", street: "1234 Service Rd", city: "Houston", state: "TX", zip: "77001" },
          { type: "branch", street: "5678 Industrial Blvd", city: "Dallas", state: "TX", zip: "75201" },
        ],
        services: [
          "Preventive Maintenance",
          "Engine Repair",
          "Transmission Service",
          "Brake Service",
          "DOT Inspections",
          "24/7 Roadside Assistance",
        ],
        paymentTerms: "Net 30",
        pricing: {
          laborRate: 95,
          shopSupplies: 0.08,
          partsMarkup: 0.15,
        },
        statistics: {
          totalSpend: 45000,
          ordersThisYear: 28,
          avgOrderValue: 1607,
          avgResponseTime: 2.5,
          completionRate: 0.98,
        },
        certifications: [
          { name: "ASE Certified", expiresAt: "2026-03-15" },
          { name: "DOT Inspection Station", expiresAt: "2025-12-31" },
        ],
        insurance: {
          liability: { carrier: "SafeGuard", limit: 2000000, expiresAt: "2025-06-30" },
          workersComp: { carrier: "SafeGuard", expiresAt: "2025-06-30" },
        },
        rating: 4.8,
        reviews: 24,
        notes: "Preferred vendor for all preventive maintenance. Fast turnaround times.",
        createdAt: "2022-03-15",
      };
    }),

  /**
   * Create vendor
   */
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      type: vendorTypeSchema,
      contact: z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string(),
      }),
      address: z.object({
        street: z.string(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
      }),
      services: z.array(z.string()).optional(),
      paymentTerms: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `vendor_${Date.now()}`,
        name: input.name,
        status: "pending",
        createdBy: ctx.user?.id,
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Update vendor
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: vendorStatusSchema.optional(),
      contact: z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string(),
      }).optional(),
      paymentTerms: z.string().optional(),
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
   * Get vendor orders/invoices
   */
  getOrders: protectedProcedure
    .input(z.object({
      vendorId: z.string(),
      status: z.enum(["all", "pending", "completed", "cancelled"]).default("all"),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      return {
        orders: [
          { id: "order_001", type: "service", description: "Preventive Maintenance - TRK-101", amount: 850, status: "completed", date: "2025-01-20" },
          { id: "order_002", type: "service", description: "Brake Inspection - TRK-102", amount: 450, status: "completed", date: "2025-01-18" },
          { id: "order_003", type: "service", description: "Oil Change - TRK-103", amount: 350, status: "pending", date: "2025-01-24" },
        ],
        total: 28,
        summary: {
          totalSpend: 45000,
          pendingOrders: 2,
          avgOrderValue: 1607,
        },
      };
    }),

  /**
   * Create service request
   */
  createServiceRequest: protectedProcedure
    .input(z.object({
      vendorId: z.string(),
      vehicleId: z.string().optional(),
      serviceType: z.string(),
      description: z.string(),
      priority: z.enum(["low", "medium", "high", "urgent"]),
      scheduledDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        requestId: `req_${Date.now()}`,
        vendorId: input.vendorId,
        status: "submitted",
        createdBy: ctx.user?.id,
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Rate vendor
   */
  rate: protectedProcedure
    .input(z.object({
      vendorId: z.string(),
      orderId: z.string(),
      rating: z.number().min(1).max(5),
      categories: z.object({
        quality: z.number().min(1).max(5),
        timeliness: z.number().min(1).max(5),
        communication: z.number().min(1).max(5),
        value: z.number().min(1).max(5),
      }).optional(),
      comment: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        ratingId: `rating_${Date.now()}`,
        submittedBy: ctx.user?.id,
        submittedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get vendor spend analytics
   */
  getSpendAnalytics: protectedProcedure
    .input(z.object({
      period: z.enum(["month", "quarter", "year"]).default("quarter"),
    }))
    .query(async ({ input }) => {
      return {
        period: input.period,
        totalSpend: 283000,
        byCategory: [
          { category: "fuel", amount: 125000, percentage: 44 },
          { category: "insurance", amount: 85000, percentage: 30 },
          { category: "maintenance", amount: 45000, percentage: 16 },
          { category: "tires", amount: 28000, percentage: 10 },
        ],
        topVendors: [
          { name: "Pilot Flying J", amount: 125000, orders: 156 },
          { name: "SafeHaul Insurance", amount: 85000, orders: 4 },
          { name: "FleetPro Maintenance", amount: 45000, orders: 28 },
        ],
        trend: {
          change: 8,
          direction: "up",
          vsLastPeriod: 262000,
        },
      };
    }),

  /**
   * Get expiring contracts/certifications
   */
  getExpiring: protectedProcedure
    .input(z.object({
      daysAhead: z.number().default(60),
    }))
    .query(async ({ input }) => {
      return [
        { vendorId: "vendor_004", vendorName: "SafeHaul Insurance", type: "insurance", expiresAt: "2025-06-30", daysRemaining: 158 },
        { vendorId: "vendor_001", vendorName: "FleetPro Maintenance", type: "certification", item: "DOT Inspection Station", expiresAt: "2025-12-31", daysRemaining: 342 },
      ];
    }),
});
