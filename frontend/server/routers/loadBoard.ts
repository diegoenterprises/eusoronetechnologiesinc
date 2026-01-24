/**
 * LOAD BOARD ROUTER
 * tRPC procedures for internal and external load board functionality
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const equipmentTypeSchema = z.enum(["tanker", "dry_van", "flatbed", "reefer", "step_deck", "lowboy"]);

export const loadBoardRouter = router({
  /**
   * Search available loads
   */
  search: publicProcedure
    .input(z.object({
      origin: z.object({
        city: z.string().optional(),
        state: z.string(),
        radius: z.number().default(50),
      }),
      destination: z.object({
        city: z.string().optional(),
        state: z.string(),
        radius: z.number().default(50),
      }).optional(),
      equipmentType: equipmentTypeSchema.optional(),
      pickupDateStart: z.string().optional(),
      pickupDateEnd: z.string().optional(),
      minRate: z.number().optional(),
      maxWeight: z.number().optional(),
      hazmat: z.boolean().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
      sortBy: z.enum(["rate", "distance", "pickup_date", "posted_date"]).default("posted_date"),
    }))
    .query(async ({ input }) => {
      const loads = [
        {
          id: "lb_001",
          loadNumber: "LB-2025-00456",
          shipper: "Shell Oil Company",
          origin: { city: "Houston", state: "TX", zip: "77001" },
          destination: { city: "Dallas", state: "TX", zip: "75201" },
          distance: 239,
          pickupDate: "2025-01-24",
          deliveryDate: "2025-01-24",
          equipmentType: "tanker",
          weight: 58000,
          commodity: "Unleaded Gasoline",
          hazmat: true,
          rate: 850,
          ratePerMile: 3.56,
          postedAt: "2025-01-23T08:00:00Z",
          expiresAt: "2025-01-24T08:00:00Z",
        },
        {
          id: "lb_002",
          loadNumber: "LB-2025-00455",
          shipper: "ExxonMobil",
          origin: { city: "Houston", state: "TX", zip: "77002" },
          destination: { city: "San Antonio", state: "TX", zip: "78201" },
          distance: 197,
          pickupDate: "2025-01-24",
          deliveryDate: "2025-01-24",
          equipmentType: "tanker",
          weight: 56000,
          commodity: "Diesel Fuel",
          hazmat: true,
          rate: 650,
          ratePerMile: 3.30,
          postedAt: "2025-01-23T07:30:00Z",
          expiresAt: "2025-01-24T07:30:00Z",
        },
        {
          id: "lb_003",
          loadNumber: "LB-2025-00454",
          shipper: "Valero",
          origin: { city: "Corpus Christi", state: "TX", zip: "78401" },
          destination: { city: "Austin", state: "TX", zip: "78701" },
          distance: 215,
          pickupDate: "2025-01-25",
          deliveryDate: "2025-01-25",
          equipmentType: "tanker",
          weight: 54000,
          commodity: "Premium Gasoline",
          hazmat: true,
          rate: 720,
          ratePerMile: 3.35,
          postedAt: "2025-01-23T06:00:00Z",
          expiresAt: "2025-01-25T06:00:00Z",
        },
      ];

      return {
        loads: loads.slice(input.offset, input.offset + input.limit),
        total: loads.length,
        marketStats: {
          avgRate: 3.40,
          totalLoads: 156,
          loadToTruckRatio: 1.8,
        },
      };
    }),

  /**
   * Get load details
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        loadNumber: "LB-2025-00456",
        status: "available",
        shipper: {
          id: "ship_001",
          name: "Shell Oil Company",
          rating: 4.8,
          reviews: 156,
          verified: true,
        },
        origin: {
          facility: "Shell Houston Terminal",
          address: "1234 Refinery Rd",
          city: "Houston",
          state: "TX",
          zip: "77001",
          contact: "Sarah Shipper",
          phone: "555-0200",
          hours: "24/7",
          instructions: "Check in at gate. Present BOL and ID.",
        },
        destination: {
          facility: "7-Eleven Distribution Center",
          address: "5678 Commerce Dr",
          city: "Dallas",
          state: "TX",
          zip: "75201",
          contact: "Mike Receiver",
          phone: "555-0300",
          hours: "6am-6pm",
          instructions: "Use dock 15. Call 30 min before arrival.",
        },
        distance: 239,
        pickup: {
          date: "2025-01-24",
          timeWindow: { start: "06:00", end: "10:00" },
          appointmentRequired: true,
        },
        delivery: {
          date: "2025-01-24",
          timeWindow: { start: "14:00", end: "18:00" },
          appointmentRequired: true,
        },
        freight: {
          commodity: "Unleaded Gasoline",
          weight: 58000,
          equipmentType: "tanker",
          hazmat: true,
          hazmatClass: "Class 3 Flammable",
          unNumber: "UN1203",
        },
        pricing: {
          linehaul: 750,
          fuelSurcharge: 85,
          hazmatFee: 15,
          total: 850,
          ratePerMile: 3.56,
          paymentTerms: "Quick Pay Available",
        },
        requirements: {
          hazmatEndorsement: true,
          tankerEndorsement: true,
          twicCard: false,
          insuranceMinimum: 1000000,
        },
        postedAt: "2025-01-23T08:00:00Z",
        expiresAt: "2025-01-24T08:00:00Z",
        postedBy: "EusoTrip Platform",
      };
    }),

  /**
   * Post load to board
   */
  postLoad: protectedProcedure
    .input(z.object({
      origin: z.object({
        facility: z.string(),
        address: z.string(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
        contact: z.string(),
        phone: z.string(),
      }),
      destination: z.object({
        facility: z.string(),
        address: z.string(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
        contact: z.string(),
        phone: z.string(),
      }),
      pickupDate: z.string(),
      deliveryDate: z.string(),
      commodity: z.string(),
      weight: z.number(),
      equipmentType: equipmentTypeSchema,
      hazmat: z.boolean().default(false),
      rate: z.number(),
      expiresIn: z.number().default(24),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `lb_${Date.now()}`,
        loadNumber: `LB-2025-${String(Date.now()).slice(-5)}`,
        status: "posted",
        postedBy: ctx.user?.id,
        postedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + input.expiresIn * 60 * 60 * 1000).toISOString(),
      };
    }),

  /**
   * Book load
   */
  bookLoad: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      vehicleId: z.string(),
      driverId: z.string(),
      agreedRate: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        bookingId: `book_${Date.now()}`,
        loadId: input.loadId,
        status: "booked",
        bookedBy: ctx.user?.id,
        bookedAt: new Date().toISOString(),
        confirmationNumber: `CONF-${String(Date.now()).slice(-6)}`,
      };
    }),

  /**
   * Request rate negotiation
   */
  negotiateRate: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      proposedRate: z.number(),
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        negotiationId: `neg_${Date.now()}`,
        loadId: input.loadId,
        proposedRate: input.proposedRate,
        status: "pending",
        submittedBy: ctx.user?.id,
        submittedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get my posted loads
   */
  getMyPostedLoads: protectedProcedure
    .input(z.object({
      status: z.enum(["all", "active", "booked", "expired"]).default("all"),
    }))
    .query(async ({ ctx, input }) => {
      return [
        {
          id: "lb_001",
          loadNumber: "LB-2025-00456",
          origin: "Houston, TX",
          destination: "Dallas, TX",
          rate: 850,
          status: "active",
          views: 24,
          bids: 3,
          postedAt: "2025-01-23T08:00:00Z",
        },
        {
          id: "lb_010",
          loadNumber: "LB-2025-00450",
          origin: "Houston, TX",
          destination: "San Antonio, TX",
          rate: 650,
          status: "booked",
          carrier: "FastHaul LLC",
          bookedAt: "2025-01-22T14:00:00Z",
        },
      ];
    }),

  /**
   * Get saved searches
   */
  getSavedSearches: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          id: "search_001",
          name: "Houston to Dallas",
          criteria: {
            origin: { city: "Houston", state: "TX", radius: 50 },
            destination: { city: "Dallas", state: "TX", radius: 50 },
            equipmentType: "tanker",
          },
          notifications: true,
          createdAt: "2025-01-15T10:00:00Z",
        },
        {
          id: "search_002",
          name: "Texas Tanker Loads",
          criteria: {
            origin: { state: "TX", radius: 100 },
            equipmentType: "tanker",
            minRate: 3.00,
          },
          notifications: true,
          createdAt: "2025-01-10T14:00:00Z",
        },
      ];
    }),

  /**
   * Save search
   */
  saveSearch: protectedProcedure
    .input(z.object({
      name: z.string(),
      criteria: z.object({
        origin: z.object({
          city: z.string().optional(),
          state: z.string(),
          radius: z.number(),
        }),
        destination: z.object({
          city: z.string().optional(),
          state: z.string(),
          radius: z.number(),
        }).optional(),
        equipmentType: equipmentTypeSchema.optional(),
        minRate: z.number().optional(),
      }),
      notifications: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `search_${Date.now()}`,
        name: input.name,
        savedBy: ctx.user?.id,
        savedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get load board alerts
   */
  getAlerts: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          id: "alert_001",
          type: "new_match",
          message: "5 new loads match your 'Houston to Dallas' search",
          createdAt: "2025-01-23T09:00:00Z",
          read: false,
        },
        {
          id: "alert_002",
          type: "rate_change",
          message: "Rates up 8% on Houston-Dallas lane",
          createdAt: "2025-01-23T08:00:00Z",
          read: true,
        },
      ];
    }),

  /**
   * Update load
   */
  updateLoad: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      rate: z.number().optional(),
      pickupDate: z.string().optional(),
      deliveryDate: z.string().optional(),
      expiresAt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        loadId: input.loadId,
        updatedBy: ctx.user?.id,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Cancel posted load
   */
  cancelLoad: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        loadId: input.loadId,
        cancelledBy: ctx.user?.id,
        cancelledAt: new Date().toISOString(),
      };
    }),

  /**
   * Get market rates
   */
  getMarketRates: protectedProcedure
    .input(z.object({
      origin: z.object({ city: z.string(), state: z.string() }),
      destination: z.object({ city: z.string(), state: z.string() }),
      equipmentType: equipmentTypeSchema,
    }))
    .query(async ({ input }) => {
      return {
        lane: `${input.origin.city}, ${input.origin.state} to ${input.destination.city}, ${input.destination.state}`,
        equipmentType: input.equipmentType,
        currentRate: {
          low: 2.80,
          average: 3.15,
          high: 3.50,
        },
        trend: {
          direction: "up",
          change: 0.10,
          period: "7 days",
        },
        volume: {
          daily: 45,
          weekly: 280,
        },
        recommendation: "Good time to book - rates trending up",
      };
    }),
});
