/**
 * BROKERS ROUTER
 * tRPC procedures for broker operations
 * Based on 03_BROKER_USER_JOURNEY.md
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const brokersRouter = router({
  /**
   * Get broker dashboard stats (alias for getDashboardSummary)
   */
  getDashboardStats: protectedProcedure
    .query(async () => {
      return {
        activeLoads: 12,
        pendingMatches: 8,
        weeklyVolume: 45,
        commissionEarned: 4250,
        marginAverage: 10.2,
        loadToCarrierRatio: 3.2,
      };
    }),

  /**
   * Get broker dashboard summary
   */
  getDashboardSummary: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        activeLoads: 12,
        pendingMatches: 8,
        weeklyVolume: 45,
        commissionEarned: 4250,
        avgMargin: 10.2,
        loadToCarrierRatio: 3.2,
      };
    }),

  /**
   * Get shipper loads to match
   */
  getShipperLoads: protectedProcedure
    .input(z.object({
      status: z.enum(["new", "matching", "matched", "all"]).optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const loads = [
        {
          id: "load_001",
          loadNumber: "LOAD-45920",
          shipper: { id: "s1", name: "Shell Oil Company" },
          origin: { city: "Houston", state: "TX" },
          destination: { city: "Dallas", state: "TX" },
          pickupDate: "2025-01-25",
          deliveryDate: "2025-01-25",
          equipment: "tanker",
          weight: 42000,
          hazmat: true,
          hazmatClass: "3",
          rate: 2450,
          status: "matching",
          postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          matchingCarriers: 5,
        },
        {
          id: "load_002",
          loadNumber: "LOAD-45921",
          shipper: { id: "s2", name: "ExxonMobil" },
          origin: { city: "Beaumont", state: "TX" },
          destination: { city: "San Antonio", state: "TX" },
          pickupDate: "2025-01-26",
          deliveryDate: "2025-01-26",
          equipment: "tanker",
          weight: 45000,
          hazmat: true,
          hazmatClass: "3",
          rate: 2800,
          status: "new",
          postedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          matchingCarriers: 0,
        },
      ];

      let filtered = loads;
      if (input.status && input.status !== "all") {
        filtered = filtered.filter(l => l.status === input.status);
      }

      return {
        loads: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
      };
    }),

  /**
   * Get analytics for BrokerAnalytics page
   */
  getAnalytics: protectedProcedure
    .input(z.object({ timeframe: z.string().optional().default("30d") }))
    .query(async () => {
      return {
        totalLoads: 45,
        totalRevenue: 127500,
        totalCommission: 12750,
        avgMargin: 10.2,
        topCarriers: [
          { name: "ABC Transport", loads: 12, revenue: 28500 },
          { name: "FastHaul LLC", loads: 8, revenue: 19200 },
        ],
      };
    }),

  /**
   * Get commission summary for BrokerAnalytics
   */
  getCommissionSummary: protectedProcedure
    .input(z.object({ timeframe: z.string().optional().default("30d") }))
    .query(async () => {
      return {
        total: 12750,
        pending: 3200,
        paid: 9550,
        avgPerLoad: 283,
      };
    }),

  /**
   * Get commissions for CommissionTracking page
   */
  getCommissions: protectedProcedure
    .input(z.object({ period: z.string().optional().default("month") }))
    .query(async () => {
      return [
        { id: "com_001", loadNumber: "LOAD-45920", shipper: "Shell Oil", carrier: "ABC Transport", amount: 245, status: "paid", date: "2025-01-23" },
        { id: "com_002", loadNumber: "LOAD-45918", shipper: "ExxonMobil", carrier: "FastHaul", amount: 280, status: "pending", date: "2025-01-24" },
        { id: "com_003", loadNumber: "LOAD-45915", shipper: "Chevron", carrier: "SafeHaul", amount: 310, status: "processing", date: "2025-01-24" },
      ];
    }),

  /**
   * Get commission stats for CommissionTracking page
   */
  getCommissionStats: protectedProcedure
    .input(z.object({ period: z.string().optional().default("month") }))
    .query(async () => {
      return {
        totalEarned: 12750,
        pending: 3200,
        paid: 9550,
        avgPerLoad: 283,
        loadsThisPeriod: 45,
      };
    }),

  /**
   * Get performance metrics for BrokerAnalytics
   */
  getPerformanceMetrics: protectedProcedure
    .input(z.object({ timeframe: z.string().optional().default("30d") }))
    .query(async () => {
      return {
        matchRate: 78,
        avgTimeToMatch: "2.5 hours",
        carrierRetention: 92,
        disputeRate: 1.2,
      };
    }),

  /**
   * Get carrier capacity board
   */
  getCarrierCapacity: protectedProcedure
    .input(z.object({
      origin: z.string().optional(),
      destination: z.string().optional(),
      equipment: z.string().optional(),
      hazmatRequired: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      return [
        {
          carrierId: "car_001",
          name: "ABC Transport LLC",
          dotNumber: "1234567",
          safetyScore: 92,
          availableTrucks: 3,
          equipment: ["tanker"],
          hazmatCertified: true,
          preferredLanes: ["TX-TX", "TX-LA"],
          lastActiveLoad: "2025-01-22",
          avgRate: 3.25,
          onTimeRate: 96,
        },
        {
          carrierId: "car_002",
          name: "FastHaul LLC",
          dotNumber: "2345678",
          safetyScore: 88,
          availableTrucks: 2,
          equipment: ["tanker", "flatbed"],
          hazmatCertified: true,
          preferredLanes: ["TX-TX", "TX-OK"],
          lastActiveLoad: "2025-01-21",
          avgRate: 3.35,
          onTimeRate: 94,
        },
      ];
    }),

  /**
   * Match load to carrier
   */
  matchLoadToCarrier: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      carrierId: z.string(),
      negotiatedRate: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const commission = input.negotiatedRate * 0.10;
      
      return {
        success: true,
        matchId: `match_${Date.now()}`,
        loadId: input.loadId,
        carrierId: input.carrierId,
        rate: input.negotiatedRate,
        commission,
        matchedBy: ctx.user?.id,
        matchedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get carrier vetting checklist
   */
  getCarrierVettingChecklist: protectedProcedure
    .input(z.object({ carrierId: z.string() }))
    .query(async ({ input }) => {
      return {
        carrierId: input.carrierId,
        overallStatus: "approved",
        checks: [
          { item: "Operating Authority", status: "passed", verified: true, verifiedAt: "2025-01-15" },
          { item: "Insurance - Liability", status: "passed", verified: true, verifiedAt: "2025-01-15" },
          { item: "Insurance - Cargo", status: "passed", verified: true, verifiedAt: "2025-01-15" },
          { item: "Safety Rating", status: "passed", verified: true, rating: "Satisfactory" },
          { item: "CSA Scores", status: "passed", verified: true, note: "All BASICs below threshold" },
          { item: "Hazmat Certification", status: "passed", verified: true, verifiedAt: "2025-01-15" },
          { item: "W-9 on File", status: "passed", verified: true },
          { item: "Contract Signed", status: "passed", verified: true, signedAt: "2024-06-01" },
        ],
        lastVetted: "2025-01-15",
        nextReview: "2025-04-15",
      };
    }),

  /**
   * Get commission tracking
   */
  getCommissionTracking: protectedProcedure
    .input(z.object({
      period: z.enum(["week", "month", "quarter", "year"]).default("month"),
    }))
    .query(async ({ input }) => {
      return {
        period: input.period,
        totalCommission: 15750,
        totalLoads: 52,
        avgCommissionPerLoad: 302.88,
        avgMargin: 10.0,
        byStatus: {
          paid: 12500,
          pending: 2500,
          invoiced: 750,
        },
        topLoads: [
          { loadNumber: "LOAD-45890", shipper: "Shell Oil", carrier: "ABC Transport", revenue: 4200, commission: 420 },
          { loadNumber: "LOAD-45885", shipper: "ExxonMobil", carrier: "FastHaul", revenue: 3800, commission: 380 },
        ],
      };
    }),

  /**
   * Get loads in progress
   */
  getLoadsInProgress: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          id: "load_active_001",
          loadNumber: "LOAD-45918",
          shipper: "Shell Oil Company",
          carrier: "ABC Transport LLC",
          status: "in_transit",
          origin: { city: "Houston", state: "TX" },
          destination: { city: "Dallas", state: "TX" },
          currentLocation: { city: "Waco", state: "TX" },
          eta: "2 hours",
          revenue: 2450,
          commission: 245,
        },
        {
          id: "load_active_002",
          loadNumber: "LOAD-45915",
          shipper: "ExxonMobil",
          carrier: "FastHaul LLC",
          status: "loading",
          origin: { city: "Beaumont", state: "TX" },
          destination: { city: "Austin", state: "TX" },
          currentLocation: { city: "Beaumont", state: "TX" },
          eta: "6 hours",
          revenue: 2800,
          commission: 280,
        },
      ];
    }),

  /**
   * Send carrier inquiry
   */
  sendCarrierInquiry: protectedProcedure
    .input(z.object({
      carrierId: z.string(),
      loadId: z.string(),
      message: z.string(),
      requestedRate: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        inquiryId: `inq_${Date.now()}`,
        sentAt: new Date().toISOString(),
      };
    }),

  /**
   * Get broker performance metrics (detailed version)
   */
  getPerformanceMetricsDetailed: protectedProcedure
    .input(z.object({
      period: z.enum(["week", "month", "quarter"]).default("month"),
    }))
    .query(async ({ input }) => {
      return {
        period: input.period,
        loadsMatched: 52,
        avgMatchTime: 2.5,
        matchRate: 85,
        carrierRetention: 78,
        shipperSatisfaction: 4.6,
        topShippers: [
          { name: "Shell Oil Company", loads: 18, revenue: 54000 },
          { name: "ExxonMobil", loads: 12, revenue: 36000 },
        ],
        topCarriers: [
          { name: "ABC Transport LLC", loads: 15, rating: 4.8 },
          { name: "FastHaul LLC", loads: 10, rating: 4.5 },
        ],
      };
    }),

  /**
   * Get marketplace loads for BrokerMarketplace page
   */
  getMarketplaceLoads: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.string().optional(),
      type: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const loads = [
        {
          id: "mkt1",
          equipmentType: "Tanker",
          origin: "Houston, TX",
          destination: "Dallas, TX",
          miles: 238,
          pickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          shipperRate: 2450,
          potentialMargin: 245,
          hazmat: true,
          hazmatClass: "3",
          commodity: "Diesel Fuel",
          weight: 42000,
        },
        {
          id: "mkt2",
          equipmentType: "Tanker",
          origin: "Beaumont, TX",
          destination: "San Antonio, TX",
          miles: 285,
          pickupDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          shipperRate: 2800,
          potentialMargin: 280,
          hazmat: true,
          hazmatClass: "3",
          commodity: "Gasoline",
          weight: 45000,
        },
        {
          id: "mkt3",
          equipmentType: "Dry Bulk",
          origin: "Corpus Christi, TX",
          destination: "Houston, TX",
          miles: 212,
          pickupDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          shipperRate: 1950,
          potentialMargin: 195,
          hazmat: false,
          commodity: "Cement",
          weight: 48000,
        },
        {
          id: "mkt4",
          equipmentType: "Reefer",
          origin: "Austin, TX",
          destination: "El Paso, TX",
          miles: 580,
          pickupDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
          shipperRate: 3200,
          potentialMargin: 320,
          hazmat: false,
          commodity: "Frozen Foods",
          weight: 38000,
        },
        {
          id: "mkt5",
          equipmentType: "Tanker",
          origin: "Port Arthur, TX",
          destination: "Lubbock, TX",
          miles: 520,
          pickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          shipperRate: 3500,
          potentialMargin: 350,
          hazmat: true,
          hazmatClass: "8",
          commodity: "Sulfuric Acid",
          weight: 40000,
        },
      ];

      let filtered = loads;
      if (input.search) {
        const s = input.search.toLowerCase();
        filtered = filtered.filter(l => 
          l.origin.toLowerCase().includes(s) ||
          l.destination.toLowerCase().includes(s) ||
          l.commodity?.toLowerCase().includes(s)
        );
      }
      if (input.type) {
        filtered = filtered.filter(l => l.equipmentType.toLowerCase().replace(" ", "_") === input.type);
      }

      return filtered;
    }),

  /**
   * Get marketplace statistics for BrokerMarketplace page
   */
  getMarketplaceStats: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        availableLoads: 47,
        availableCarriers: 23,
        avgMargin: 285,
        matchRate: 78,
        pendingMatches: 8,
        hotLanes: [
          { origin: "Houston", destination: "Dallas", count: 12 },
          { origin: "Beaumont", destination: "San Antonio", count: 8 },
        ],
      };
    }),

  /**
   * Get carrier network for BrokerCarriers page
   */
  getCarrierNetwork: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.string().optional(),
      tier: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const carriers = [
        {
          id: "car1",
          name: "ABC Transport LLC",
          mcNumber: "MC-987654",
          dotNumber: "1234567",
          tier: "platinum",
          status: "active",
          fleetSize: 25,
          loadsCompleted: 156,
          safetyScore: 95,
          rating: 4.8,
          phone: "(713) 555-0101",
          email: "dispatch@abctransport.com",
          location: "Houston, TX",
          equipment: ["tanker", "hazmat"],
          hazmatCertified: true,
        },
        {
          id: "car2",
          name: "FastHaul LLC",
          mcNumber: "MC-876543",
          dotNumber: "2345678",
          tier: "gold",
          status: "active",
          fleetSize: 15,
          loadsCompleted: 98,
          safetyScore: 88,
          rating: 4.5,
          phone: "(214) 555-0202",
          email: "dispatch@fasthaul.com",
          location: "Dallas, TX",
          equipment: ["tanker", "flatbed"],
          hazmatCertified: true,
        },
        {
          id: "car3",
          name: "Bulk Carriers Inc",
          mcNumber: "MC-765432",
          dotNumber: "3456789",
          tier: "silver",
          status: "active",
          fleetSize: 8,
          loadsCompleted: 45,
          safetyScore: 82,
          rating: 4.2,
          phone: "(512) 555-0303",
          email: "ops@bulkcarriers.com",
          location: "Austin, TX",
          equipment: ["dry_bulk", "tanker"],
          hazmatCertified: false,
        },
        {
          id: "car4",
          name: "Premium Logistics",
          mcNumber: "MC-654321",
          dotNumber: "4567890",
          tier: "gold",
          status: "pending",
          fleetSize: 12,
          loadsCompleted: 0,
          safetyScore: 90,
          rating: 0,
          phone: "(210) 555-0404",
          email: "info@premiumlogistics.com",
          location: "San Antonio, TX",
          equipment: ["reefer", "tanker"],
          hazmatCertified: true,
        },
        {
          id: "car5",
          name: "Regional Tankers Co",
          mcNumber: "MC-543210",
          dotNumber: "5678901",
          tier: "bronze",
          status: "suspended",
          fleetSize: 5,
          loadsCompleted: 23,
          safetyScore: 72,
          rating: 3.8,
          phone: "(361) 555-0505",
          email: "dispatch@regionaltankers.com",
          location: "Corpus Christi, TX",
          equipment: ["tanker"],
          hazmatCertified: true,
        },
      ];

      let filtered = carriers;
      if (input.search) {
        const s = input.search.toLowerCase();
        filtered = filtered.filter(c => 
          c.name.toLowerCase().includes(s) ||
          c.mcNumber.toLowerCase().includes(s) ||
          c.dotNumber.includes(s)
        );
      }
      if (input.status) {
        filtered = filtered.filter(c => c.status === input.status);
      }
      if (input.tier) {
        filtered = filtered.filter(c => c.tier === input.tier);
      }

      return filtered;
    }),

  /**
   * Get carrier statistics for BrokerCarriers page
   */
  getCarrierStats: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        totalCarriers: 47,
        activeCarriers: 42,
        preferredCarriers: 12,
        pendingVetting: 3,
        avgSafetyScore: 86,
        avgRating: 4.3,
      };
    }),

  /**
   * Get analytics for BrokerAnalytics page (detailed version)
   */
  getAnalyticsDetailed: protectedProcedure
    .input(z.object({
      timeframe: z.string().default("30d"),
    }))
    .query(async ({ ctx, input }) => {
      return {
        totalCommission: 28500,
        commissionTrend: 12.5,
        loadsBrokered: 87,
        loadsTrend: 8.2,
        avgMarginPercent: 10.5,
        avgMarginDollars: 327,
        activeCarriers: 34,
        newCarriers: 5,
        topLanes: [
          { origin: "Houston", destination: "Dallas", loads: 23, totalCommission: 5750, avgMargin: 10.2 },
          { origin: "Beaumont", destination: "San Antonio", loads: 18, totalCommission: 4500, avgMargin: 9.8 },
          { origin: "Corpus Christi", destination: "Houston", loads: 15, totalCommission: 3750, avgMargin: 11.0 },
          { origin: "Austin", destination: "El Paso", loads: 12, totalCommission: 3600, avgMargin: 10.5 },
          { origin: "Port Arthur", destination: "Lubbock", loads: 10, totalCommission: 3500, avgMargin: 12.0 },
          { origin: "Dallas", destination: "Houston", loads: 9, totalCommission: 2250, avgMargin: 9.5 },
        ],
      };
    }),

  /**
   * Get commission summary for BrokerAnalytics page (detailed version)
   */
  getCommissionSummaryDetailed: protectedProcedure
    .input(z.object({
      timeframe: z.string().default("30d"),
    }))
    .query(async ({ ctx, input }) => {
      return {
        total: 28500,
        breakdown: [
          { category: "Hazmat Loads", amount: 12500, loads: 35, percentage: 44 },
          { category: "Liquid Bulk", amount: 8500, loads: 28, percentage: 30 },
          { category: "Dry Bulk", amount: 4500, loads: 15, percentage: 16 },
          { category: "Refrigerated", amount: 2000, loads: 6, percentage: 7 },
          { category: "Specialized", amount: 1000, loads: 3, percentage: 3 },
        ],
      };
    }),

  /**
   * Vet a new carrier
   */
  vetCarrier: protectedProcedure
    .input(z.object({
      carrierId: z.string(),
      mcNumber: z.string(),
      dotNumber: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        carrierId: input.carrierId,
        vettingStatus: "in_progress",
        estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        startedAt: new Date().toISOString(),
        startedBy: ctx.user?.id,
      };
    }),

  /**
   * Update carrier tier
   */
  updateCarrierTier: protectedProcedure
    .input(z.object({
      carrierId: z.string(),
      tier: z.enum(["platinum", "gold", "silver", "bronze"]),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        carrierId: input.carrierId,
        newTier: input.tier,
        updatedAt: new Date().toISOString(),
        updatedBy: ctx.user?.id,
      };
    }),
});
