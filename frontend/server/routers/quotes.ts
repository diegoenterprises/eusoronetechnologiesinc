/**
 * QUOTES ROUTER
 * tRPC procedures for freight quotes and pricing
 */

import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { loads } from "../../drizzle/schema";

const quoteStatusSchema = z.enum([
  "draft", "sent", "viewed", "accepted", "declined", "expired", "converted"
]);

export const quotesRouter = router({
  /**
   * Get all quotes for QuoteManagement page
   */
  getAll: protectedProcedure
    .input(z.object({ search: z.string().optional(), status: z.string().optional() }))
    .query(async ({ input }) => {
      const quotes = [
        { id: "q1", number: "QT-2025-0045", customer: "Shell Oil", origin: "Houston, TX", destination: "Dallas, TX", amount: 2850, status: "sent", createdAt: "2025-01-22" },
        { id: "q2", number: "QT-2025-0044", customer: "ExxonMobil", origin: "Austin, TX", destination: "San Antonio, TX", amount: 1650, status: "accepted", createdAt: "2025-01-20" },
        { id: "q3", number: "QT-2025-0043", customer: "Valero", origin: "Corpus Christi, TX", destination: "Houston, TX", amount: 2100, status: "expired", createdAt: "2025-01-15" },
      ];
      let filtered = quotes;
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(qt => qt.customer.toLowerCase().includes(q) || qt.number.toLowerCase().includes(q));
      }
      if (input.status && input.status !== "all") filtered = filtered.filter(qt => qt.status === input.status);
      return filtered;
    }),

  /**
   * Get quote stats for QuoteManagement page
   */
  getStats: protectedProcedure
    .query(async () => {
      return { total: 45, sent: 12, accepted: 28, declined: 3, expired: 2, conversionRate: 62, totalValue: 285000, quoted: 35 };
    }),

  /**
   * Get instant quote
   */
  getInstant: publicProcedure
    .input(z.object({
      origin: z.object({
        city: z.string(),
        state: z.string(),
        zip: z.string().optional(),
      }),
      destination: z.object({
        city: z.string(),
        state: z.string(),
        zip: z.string().optional(),
      }),
      equipmentType: z.enum(["tanker", "dry_van", "flatbed", "reefer"]),
      weight: z.number().optional(),
      hazmat: z.boolean().default(false),
      pickupDate: z.string(),
    }))
    .query(async ({ input }) => {
      const baseRate = 2.85;
      const distance = 285;
      const hazmatSurcharge = input.hazmat ? 0.35 : 0;
      const ratePerMile = baseRate + hazmatSurcharge;
      
      return {
        quoteId: `quote_${Date.now()}`,
        origin: input.origin,
        destination: input.destination,
        distance,
        estimatedTransitTime: "4-5 hours",
        pricing: {
          ratePerMile,
          linehaul: distance * ratePerMile,
          fuelSurcharge: distance * 0.45,
          hazmatFee: input.hazmat ? 150 : 0,
          totalEstimate: distance * ratePerMile + distance * 0.45 + (input.hazmat ? 150 : 0),
        },
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        marketComparison: {
          low: distance * 2.50,
          average: distance * 2.85,
          high: distance * 3.20,
        },
      };
    }),

  /**
   * Create quote
   */
  create: protectedProcedure
    .input(z.object({
      customerId: z.string(),
      origin: z.object({
        name: z.string(),
        address: z.string(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
      }),
      destination: z.object({
        name: z.string(),
        address: z.string(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
      }),
      equipmentType: z.string(),
      commodity: z.string(),
      weight: z.number().optional(),
      hazmat: z.boolean().default(false),
      pickupDate: z.string(),
      deliveryDate: z.string().optional(),
      pricing: z.object({
        ratePerMile: z.number(),
        linehaul: z.number(),
        fuelSurcharge: z.number(),
        accessorials: z.array(z.object({
          type: z.string(),
          amount: z.number(),
        })).optional(),
        total: z.number(),
      }),
      notes: z.string().optional(),
      validDays: z.number().default(7),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `quote_${Date.now()}`,
        quoteNumber: `Q-2025-${String(Date.now()).slice(-5)}`,
        status: "draft",
        createdBy: ctx.user?.id,
        createdAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + input.validDays * 24 * 60 * 60 * 1000).toISOString(),
      };
    }),

  /**
   * List quotes
   */
  list: protectedProcedure
    .input(z.object({
      status: quoteStatusSchema.optional(),
      customerId: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const quotes = [
        {
          id: "quote_001",
          quoteNumber: "Q-2025-00123",
          customer: { id: "cust_001", name: "Shell Oil Company" },
          origin: "Houston, TX",
          destination: "Dallas, TX",
          total: 1250.00,
          status: "sent",
          createdAt: "2025-01-22T10:00:00Z",
          validUntil: "2025-01-29T10:00:00Z",
        },
        {
          id: "quote_002",
          quoteNumber: "Q-2025-00120",
          customer: { id: "cust_002", name: "ExxonMobil" },
          origin: "Houston, TX",
          destination: "San Antonio, TX",
          total: 980.00,
          status: "accepted",
          createdAt: "2025-01-20T14:00:00Z",
          validUntil: "2025-01-27T14:00:00Z",
          convertedToLoad: "LOAD-45855",
        },
        {
          id: "quote_003",
          quoteNumber: "Q-2025-00115",
          customer: { id: "cust_003", name: "Valero" },
          origin: "Corpus Christi, TX",
          destination: "Austin, TX",
          total: 1100.00,
          status: "expired",
          createdAt: "2025-01-10T09:00:00Z",
          validUntil: "2025-01-17T09:00:00Z",
        },
      ];

      let filtered = quotes;
      if (input.status) filtered = filtered.filter(q => q.status === input.status);
      if (input.customerId) filtered = filtered.filter(q => q.customer.id === input.customerId);

      return filtered.slice(input.offset, input.offset + input.limit);
    }),

  /**
   * Get quote by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        quoteNumber: "Q-2025-00123",
        status: "sent",
        customer: {
          id: "cust_001",
          name: "Shell Oil Company",
          contact: "Sarah Shipper",
          email: "sarah@shell.com",
          phone: "555-0200",
        },
        origin: {
          name: "Shell Houston Terminal",
          address: "1234 Refinery Rd",
          city: "Houston",
          state: "TX",
          zip: "77001",
        },
        destination: {
          name: "7-Eleven Distribution",
          address: "5678 Commerce Dr",
          city: "Dallas",
          state: "TX",
          zip: "75201",
        },
        distance: 239,
        equipmentType: "tanker",
        commodity: "Unleaded Gasoline",
        weight: 58000,
        hazmat: true,
        pickupDate: "2025-01-25",
        deliveryDate: "2025-01-25",
        pricing: {
          ratePerMile: 3.20,
          linehaul: 764.80,
          fuelSurcharge: 107.55,
          accessorials: [
            { type: "Hazmat", amount: 150 },
            { type: "Detention", amount: 0, note: "First 2 hours free" },
          ],
          subtotal: 1022.35,
          discount: 0,
          total: 1022.35,
        },
        notes: "Standard terms apply. Quote valid for 7 days.",
        createdBy: { id: "u1", name: "John Broker" },
        createdAt: "2025-01-22T10:00:00Z",
        validUntil: "2025-01-29T10:00:00Z",
        viewedAt: "2025-01-22T14:30:00Z",
        history: [
          { action: "created", timestamp: "2025-01-22T10:00:00Z", user: "John Broker" },
          { action: "sent", timestamp: "2025-01-22T10:05:00Z", user: "John Broker" },
          { action: "viewed", timestamp: "2025-01-22T14:30:00Z", user: "Sarah Shipper" },
        ],
      };
    }),

  /**
   * Update quote
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      pricing: z.object({
        ratePerMile: z.number(),
        linehaul: z.number(),
        fuelSurcharge: z.number(),
        total: z.number(),
      }).optional(),
      notes: z.string().optional(),
      validDays: z.number().optional(),
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
   * Send quote to customer
   */
  send: protectedProcedure
    .input(z.object({
      quoteId: z.string(),
      recipientEmail: z.string().email().optional(),
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        quoteId: input.quoteId,
        sentTo: input.recipientEmail,
        sentBy: ctx.user?.id,
        sentAt: new Date().toISOString(),
      };
    }),

  /**
   * Accept quote (convert to load)
   */
  accept: protectedProcedure
    .input(z.object({
      quoteId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        quoteId: input.quoteId,
        loadId: `load_${Date.now()}`,
        loadNumber: `LOAD-${String(Date.now()).slice(-5)}`,
        acceptedBy: ctx.user?.id,
        acceptedAt: new Date().toISOString(),
      };
    }),

  /**
   * Decline quote
   */
  decline: protectedProcedure
    .input(z.object({
      quoteId: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        quoteId: input.quoteId,
        declinedBy: ctx.user?.id,
        declinedAt: new Date().toISOString(),
      };
    }),

  /**
   * Duplicate quote
   */
  duplicate: protectedProcedure
    .input(z.object({
      quoteId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `quote_${Date.now()}`,
        quoteNumber: `Q-2025-${String(Date.now()).slice(-5)}`,
        duplicatedFrom: input.quoteId,
        createdBy: ctx.user?.id,
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Get quote analytics
   */
  getAnalytics: protectedProcedure
    .input(z.object({
      period: z.enum(["week", "month", "quarter"]).default("month"),
    }))
    .query(async ({ input }) => {
      return {
        period: input.period,
        summary: {
          totalQuotes: 45,
          sent: 38,
          accepted: 22,
          declined: 8,
          expired: 6,
          pending: 9,
        },
        conversionRate: 0.58,
        avgQuoteValue: 1150,
        totalQuotedValue: 51750,
        totalConvertedValue: 30000,
        avgResponseTime: 18,
        topCustomers: [
          { name: "Shell Oil Company", quotes: 12, converted: 8 },
          { name: "ExxonMobil", quotes: 8, converted: 5 },
          { name: "Valero", quotes: 6, converted: 3 },
        ],
      };
    }),

  // Additional quote procedures
  getSummary: protectedProcedure.query(async () => ({ pending: 12, accepted: 28, total: 45, avgValue: 2150, quoted: 35 })),
  respond: protectedProcedure.input(z.object({ quoteId: z.string(), action: z.enum(["accept", "decline"]), notes: z.string().optional() })).mutation(async ({ input }) => ({ success: true, quoteId: input.quoteId })),
});
