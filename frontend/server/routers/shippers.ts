/**
 * SHIPPERS ROUTER
 * tRPC procedures for shipper operations
 * Based on 01_SHIPPER_USER_JOURNEY.md
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const loadStatusSchema = z.enum(["draft", "posted", "assigned", "in_transit", "delivered", "cancelled"]);

export const shippersRouter = router({
  /**
   * Get shipper dashboard stats
   */
  getDashboardStats: protectedProcedure
    .query(async () => {
      return {
        activeLoads: 8,
        pendingBids: 12,
        deliveredThisWeek: 15,
        ratePerMile: 3.45,
        onTimeRate: 96,
        totalSpendThisMonth: 89500,
      };
    }),

  /**
   * Get active loads
   */
  getActiveLoads: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async () => {
      return [
        {
          id: "load_001",
          loadNumber: "LOAD-45920",
          status: "in_transit",
          origin: "Houston, TX",
          destination: "Dallas, TX",
          carrier: "ABC Transport",
          driver: "Mike Johnson",
          eta: "2 hours",
          rate: 2450,
        },
        {
          id: "load_002",
          loadNumber: "LOAD-45919",
          status: "loading",
          origin: "Beaumont, TX",
          destination: "Austin, TX",
          carrier: "FastHaul LLC",
          driver: "Tom Brown",
          eta: "6 hours",
          rate: 2800,
        },
      ];
    }),

  /**
   * Get loads requiring attention
   */
  getLoadsRequiringAttention: protectedProcedure
    .query(async () => {
      return [
        {
          id: "load_003",
          loadNumber: "LOAD-45918",
          issue: "Delayed pickup",
          severity: "warning",
          message: "Carrier delayed 30 minutes at origin",
        },
        {
          id: "load_004",
          loadNumber: "LOAD-45915",
          issue: "Missing documentation",
          severity: "critical",
          message: "BOL not uploaded",
        },
      ];
    }),

  /**
   * Get recent loads
   */
  getRecentLoads: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(5) }))
    .query(async () => {
      return [
        {
          id: "load_010",
          loadNumber: "LOAD-45910",
          status: "delivered",
          origin: "Houston, TX",
          destination: "Dallas, TX",
          deliveredAt: "2025-01-23",
          rate: 2300,
        },
        {
          id: "load_011",
          loadNumber: "LOAD-45908",
          status: "delivered",
          origin: "Port Arthur, TX",
          destination: "Austin, TX",
          deliveredAt: "2025-01-22",
          rate: 2650,
        },
      ];
    }),

  /**
   * Get shipper dashboard summary
   */
  getDashboardSummary: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        activeLoads: 8,
        pendingBids: 12,
        deliveredThisWeek: 15,
        ratePerMile: 3.45,
        onTimeRate: 96,
        totalSpendThisMonth: 89500,
      };
    }),

  /**
   * Get my loads
   */
  getMyLoads: protectedProcedure
    .input(z.object({
      status: loadStatusSchema.optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const loads = [
        {
          id: "load_001",
          loadNumber: "LOAD-45920",
          status: "in_transit",
          origin: { city: "Houston", state: "TX" },
          destination: { city: "Dallas", state: "TX" },
          pickupDate: "2025-01-23",
          deliveryDate: "2025-01-23",
          equipment: "tanker",
          weight: 42000,
          hazmat: true,
          hazmatClass: "3",
          product: "Gasoline",
          carrier: { id: "car_001", name: "ABC Transport LLC" },
          driver: { id: "d1", name: "Mike Johnson" },
          rate: 2450,
          currentLocation: { city: "Waco", state: "TX" },
          eta: "2 hours",
        },
        {
          id: "load_002",
          loadNumber: "LOAD-45921",
          status: "posted",
          origin: { city: "Beaumont", state: "TX" },
          destination: { city: "San Antonio", state: "TX" },
          pickupDate: "2025-01-25",
          deliveryDate: "2025-01-25",
          equipment: "tanker",
          weight: 45000,
          hazmat: true,
          hazmatClass: "3",
          product: "Diesel",
          rate: 2800,
          bidsReceived: 5,
        },
        {
          id: "load_003",
          loadNumber: "LOAD-45918",
          status: "delivered",
          origin: { city: "Port Arthur", state: "TX" },
          destination: { city: "Austin", state: "TX" },
          pickupDate: "2025-01-22",
          deliveryDate: "2025-01-22",
          equipment: "tanker",
          weight: 40000,
          hazmat: true,
          hazmatClass: "3",
          product: "Jet Fuel",
          carrier: { id: "car_002", name: "FastHaul LLC" },
          rate: 2650,
          deliveredAt: "2025-01-22T16:30:00Z",
        },
      ];

      let filtered = loads;
      if (input.status) {
        filtered = filtered.filter(l => l.status === input.status);
      }

      return {
        loads: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
      };
    }),

  /**
   * Get loads requiring attention (detailed version)
   */
  getLoadsAttentionDetails: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          loadId: "load_002",
          loadNumber: "LOAD-45921",
          issue: "pending_bids",
          message: "5 bids awaiting review",
          priority: "high",
        },
        {
          loadId: "load_004",
          loadNumber: "LOAD-45922",
          issue: "no_bids",
          message: "No bids received after 24 hours",
          priority: "medium",
        },
      ];
    }),

  /**
   * Get bids for a load
   */
  getBidsForLoad: protectedProcedure
    .input(z.object({ loadId: z.string() }))
    .query(async ({ input }) => {
      return [
        {
          id: "bid_001",
          carrierId: "car_001",
          carrierName: "ABC Transport LLC",
          dotNumber: "1234567",
          safetyScore: 92,
          amount: 2350,
          transitTime: "8 hours",
          submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          message: "Available immediately with hazmat certified driver",
          recommended: true,
        },
        {
          id: "bid_002",
          carrierId: "car_002",
          carrierName: "FastHaul LLC",
          dotNumber: "2345678",
          safetyScore: 88,
          amount: 2450,
          transitTime: "7 hours",
          submittedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
          message: "Expedited delivery available",
        },
        {
          id: "bid_003",
          carrierId: "car_003",
          carrierName: "SafeHaul Transport",
          dotNumber: "3456789",
          safetyScore: 90,
          amount: 2280,
          transitTime: "9 hours",
          submittedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        },
      ];
    }),

  /**
   * Accept bid
   */
  acceptBid: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      bidId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        loadId: input.loadId,
        bidId: input.bidId,
        status: "assigned",
        acceptedAt: new Date().toISOString(),
      };
    }),

  /**
   * Reject bid
   */
  rejectBid: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      bidId: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        bidId: input.bidId,
        rejectedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get carrier performance for shipper
   */
  getCarrierPerformance: protectedProcedure
    .input(z.object({
      period: z.enum(["month", "quarter", "year"]).default("quarter"),
    }))
    .query(async ({ input }) => {
      return [
        {
          carrierId: "car_001",
          name: "ABC Transport LLC",
          loadsCompleted: 25,
          onTimeRate: 96,
          avgRating: 4.8,
          avgRate: 3.25,
          claims: 0,
        },
        {
          carrierId: "car_002",
          name: "FastHaul LLC",
          loadsCompleted: 18,
          onTimeRate: 92,
          avgRating: 4.5,
          avgRate: 3.35,
          claims: 0,
        },
        {
          carrierId: "car_003",
          name: "SafeHaul Transport",
          loadsCompleted: 12,
          onTimeRate: 95,
          avgRating: 4.7,
          avgRate: 3.20,
          claims: 0,
        },
      ];
    }),

  /**
   * Get spending analytics
   */
  getSpendingAnalytics: protectedProcedure
    .input(z.object({
      period: z.enum(["month", "quarter", "year"]).default("month"),
    }))
    .query(async ({ input }) => {
      return {
        period: input.period,
        totalSpend: 89500,
        loadCount: 32,
        avgPerLoad: 2797,
        avgPerMile: 3.45,
        vsMarketRate: -5.2,
        byLane: [
          { lane: "Houston → Dallas", spend: 28500, loads: 12 },
          { lane: "Beaumont → San Antonio", spend: 19200, loads: 8 },
          { lane: "Port Arthur → Austin", spend: 14400, loads: 6 },
        ],
        byCarrier: [
          { carrier: "ABC Transport", spend: 35000, loads: 15 },
          { carrier: "FastHaul LLC", spend: 28500, loads: 10 },
        ],
      };
    }),

  /**
   * Get favorite carriers
   */
  getFavoriteCarriers: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        { carrierId: "car_001", name: "ABC Transport LLC", loadsCompleted: 45, rating: 4.8 },
        { carrierId: "car_002", name: "FastHaul LLC", loadsCompleted: 32, rating: 4.5 },
      ];
    }),

  /**
   * Add favorite carrier
   */
  addFavoriteCarrier: protectedProcedure
    .input(z.object({ carrierId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        carrierId: input.carrierId,
        addedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get delivery confirmations
   */
  getDeliveryConfirmations: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "confirmed", "disputed"]).optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      return [
        {
          loadId: "load_003",
          loadNumber: "LOAD-45918",
          deliveredAt: "2025-01-22T16:30:00Z",
          confirmedAt: "2025-01-22T17:00:00Z",
          status: "confirmed",
          signature: "John Receiver",
          documents: ["BOL-45918.pdf", "POD-45918.pdf"],
        },
      ];
    }),

  /**
   * Rate carrier
   */
  rateCarrier: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      carrierId: z.string(),
      rating: z.number().min(1).max(5),
      review: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        ratingId: `rating_${Date.now()}`,
        submittedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get shipper profile for ShipperProfile page
   */
  getProfile: protectedProcedure
    .query(async () => {
      return {
        id: "s1",
        companyName: "Shell Oil Company",
        contactName: "John Smith",
        email: "john.smith@shell.com",
        phone: "555-0100",
        address: "123 Energy Way, Houston, TX 77001",
        dotNumber: "1234567",
        mcNumber: "MC-123456",
        verified: true,
        memberSince: "2024-01-15",
        website: "https://www.shell.com",
      };
    }),

  /**
   * Get shipper stats for ShipperProfile page
   */
  getStats: protectedProcedure
    .query(async () => {
      return {
        totalLoads: 245,
        totalSpend: 875000,
        avgRatePerMile: 3.45,
        onTimeDeliveryRate: 96,
        preferredCarriers: 12,
        avgPaymentTime: 15,
        onTimeRate: 96,
        monthlyVolume: 28,
        maxMonthlyLoads: 50,
      };
    }),
});
