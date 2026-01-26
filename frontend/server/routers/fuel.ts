/**
 * FUEL ROUTER
 * tRPC procedures for fuel management and tracking
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const fuelTypeSchema = z.enum(["diesel", "def", "gasoline"]);

export const fuelRouter = router({
  /**
   * Get summary for FuelManagement page
   */
  getSummary: protectedProcedure
    .query(async () => {
      return {
        totalGallons: 4250,
        totalSpent: 15862.50,
        avgPrice: 3.73,
        thisMonthGallons: 1850,
        thisMonthSpent: 6845.50,
        mpgAvg: 6.8,
      };
    }),

  /**
   * Get current fuel prices
   */
  getCurrentPrices: protectedProcedure
    .query(async () => {
      return {
        diesel: { avg: 3.72, low: 3.45, high: 3.98 },
        gasoline: { avg: 2.89, low: 2.65, high: 3.15 },
        def: { avg: 3.25, low: 2.95, high: 3.55 },
        lastUpdated: new Date().toISOString(),
      };
    }),

  /**
   * Get fuel card transactions
   */
  getTransactions: protectedProcedure
    .input(z.object({
      vehicleId: z.string().optional(),
      driverId: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const transactions = [
        {
          id: "fuel_001",
          date: "2025-01-23",
          time: "08:15",
          vehicleId: "v1",
          unitNumber: "TRK-101",
          driverId: "d1",
          driverName: "Mike Johnson",
          location: "Pilot Travel Center, Waco, TX",
          gallons: 125.5,
          pricePerGallon: 3.65,
          totalAmount: 458.08,
          fuelType: "diesel",
          odometer: 458250,
          cardNumber: "****4567",
        },
        {
          id: "fuel_002",
          date: "2025-01-22",
          time: "14:30",
          vehicleId: "v1",
          unitNumber: "TRK-101",
          driverId: "d1",
          driverName: "Mike Johnson",
          location: "Love's Travel Stop, Dallas, TX",
          gallons: 118.2,
          pricePerGallon: 3.72,
          totalAmount: 439.70,
          fuelType: "diesel",
          odometer: 457850,
          cardNumber: "****4567",
        },
        {
          id: "fuel_003",
          date: "2025-01-22",
          time: "14:35",
          vehicleId: "v1",
          unitNumber: "TRK-101",
          driverId: "d1",
          driverName: "Mike Johnson",
          location: "Love's Travel Stop, Dallas, TX",
          gallons: 2.5,
          pricePerGallon: 3.25,
          totalAmount: 8.13,
          fuelType: "def",
          odometer: 457850,
          cardNumber: "****4567",
        },
      ];

      let filtered = transactions;
      if (input.vehicleId) filtered = filtered.filter(t => t.vehicleId === input.vehicleId);
      if (input.driverId) filtered = filtered.filter(t => t.driverId === input.driverId);

      return {
        transactions: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
      };
    }),

  /**
   * Get fuel summary (detailed version)
   */
  getSummaryDetailed: protectedProcedure
    .input(z.object({
      period: z.enum(["week", "month", "quarter"]).default("month"),
      vehicleId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return {
        period: input.period,
        totalGallons: 2850.5,
        totalCost: 10425.33,
        avgPricePerGallon: 3.66,
        avgMpg: 6.2,
        defGallons: 45.2,
        defCost: 146.90,
        transactions: 24,
        byVehicle: [
          { unitNumber: "TRK-101", gallons: 950.2, cost: 3478.73, mpg: 6.4 },
          { unitNumber: "TRK-102", gallons: 880.5, cost: 3222.63, mpg: 6.1 },
          { unitNumber: "TRK-103", gallons: 1019.8, cost: 3723.97, mpg: 6.0 },
        ],
        byDriver: [
          { driverName: "Mike Johnson", gallons: 950.2, cost: 3478.73, mpg: 6.4 },
          { driverName: "Sarah Williams", gallons: 880.5, cost: 3222.63, mpg: 6.1 },
          { driverName: "Tom Brown", gallons: 1019.8, cost: 3723.97, mpg: 6.0 },
        ],
      };
    }),

  /**
   * Get fuel efficiency report
   */
  getEfficiencyReport: protectedProcedure
    .input(z.object({
      vehicleId: z.string().optional(),
      period: z.enum(["week", "month", "quarter"]).default("month"),
    }))
    .query(async ({ input }) => {
      return {
        period: input.period,
        fleetAvgMpg: 6.2,
        trend: {
          change: 0.3,
          direction: "up",
          vsLastPeriod: 6.0,
        },
        byVehicle: [
          { unitNumber: "TRK-101", mpg: 6.4, rank: 1, trend: "up" },
          { unitNumber: "TRK-102", mpg: 6.1, rank: 2, trend: "stable" },
          { unitNumber: "TRK-103", mpg: 6.0, rank: 3, trend: "down" },
          { unitNumber: "TRK-104", mpg: 5.8, rank: 4, trend: "up" },
        ],
        recommendations: [
          { vehicle: "TRK-103", issue: "Below fleet average MPG", action: "Schedule maintenance check" },
          { vehicle: "TRK-104", issue: "Idle time above average", action: "Driver coaching recommended" },
        ],
      };
    }),

  /**
   * Get fuel cards
   */
  getFuelCards: protectedProcedure
    .input(z.object({ status: z.string().optional(), limit: z.number().optional() }).optional())
    .query(async ({ ctx }) => {
      return [
        {
          id: "card_001",
          cardNumber: "****4567",
          status: "active",
          assignedTo: { type: "driver", id: "d1", name: "Mike Johnson" },
          dailyLimit: 500,
          monthlyLimit: 5000,
          restrictions: ["diesel", "def"],
          lastUsed: "2025-01-23T08:15:00Z",
        },
        {
          id: "card_002",
          cardNumber: "****8901",
          status: "active",
          assignedTo: { type: "vehicle", id: "v2", name: "TRK-102" },
          dailyLimit: 500,
          monthlyLimit: 5000,
          restrictions: ["diesel", "def"],
          lastUsed: "2025-01-22T16:30:00Z",
        },
        {
          id: "card_003",
          cardNumber: "****2345",
          status: "suspended",
          assignedTo: { type: "driver", id: "d4", name: "Lisa Chen" },
          dailyLimit: 500,
          monthlyLimit: 5000,
          restrictions: ["diesel", "def"],
          lastUsed: "2025-01-15T10:00:00Z",
          suspensionReason: "Reported lost",
        },
      ];
    }),

  /**
   * Update fuel card
   */
  updateFuelCard: protectedProcedure
    .input(z.object({
      cardId: z.string(),
      status: z.enum(["active", "suspended", "cancelled"]).optional(),
      dailyLimit: z.number().optional(),
      monthlyLimit: z.number().optional(),
      restrictions: z.array(fuelTypeSchema).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        cardId: input.cardId,
        updatedBy: ctx.user?.id,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get fuel prices
   */
  getPrices: publicProcedure
    .input(z.object({
      location: z.object({
        lat: z.number(),
        lng: z.number(),
      }).optional(),
      radius: z.number().default(25),
    }))
    .query(async ({ input }) => {
      return {
        nationalAverage: 3.89,
        nearbyStations: [
          {
            id: "station_001",
            name: "Pilot Travel Center",
            address: "1234 Interstate Dr, Waco, TX",
            distance: 2.5,
            prices: { diesel: 3.65, def: 3.25 },
            amenities: ["showers", "restaurant", "scales"],
            lastUpdated: new Date().toISOString(),
          },
          {
            id: "station_002",
            name: "Love's Travel Stop",
            address: "5678 Highway 35, Waco, TX",
            distance: 4.2,
            prices: { diesel: 3.69, def: 3.29 },
            amenities: ["showers", "restaurant", "tire_shop"],
            lastUpdated: new Date().toISOString(),
          },
          {
            id: "station_003",
            name: "Flying J",
            address: "9012 Truckers Blvd, Waco, TX",
            distance: 5.8,
            prices: { diesel: 3.72, def: 3.35 },
            amenities: ["showers", "restaurant", "scales", "wifi"],
            lastUpdated: new Date().toISOString(),
          },
        ],
      };
    }),

  /**
   * Report fuel purchase
   */
  reportPurchase: protectedProcedure
    .input(z.object({
      vehicleId: z.string(),
      fuelType: fuelTypeSchema,
      gallons: z.number().positive(),
      pricePerGallon: z.number().positive(),
      odometer: z.number(),
      location: z.string(),
      receiptImage: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `fuel_${Date.now()}`,
        totalAmount: input.gallons * input.pricePerGallon,
        reportedBy: ctx.user?.id,
        reportedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get fuel tax summary (IFTA)
   */
  getIFTASummary: protectedProcedure
    .input(z.object({
      quarter: z.string(),
      year: z.number(),
    }))
    .query(async ({ input }) => {
      return {
        quarter: input.quarter,
        year: input.year,
        byState: [
          { state: "TX", miles: 12500, gallons: 2016, taxPaid: 412.28, taxDue: 425.00, balance: -12.72 },
          { state: "LA", miles: 3200, gallons: 516, taxPaid: 103.20, taxDue: 96.00, balance: 7.20 },
          { state: "OK", miles: 2800, gallons: 452, taxPaid: 81.36, taxDue: 84.00, balance: -2.64 },
          { state: "AR", miles: 1500, gallons: 242, taxPaid: 58.08, taxDue: 54.00, balance: 4.08 },
        ],
        totals: {
          totalMiles: 20000,
          totalGallons: 3226,
          totalTaxPaid: 654.92,
          totalTaxDue: 659.00,
          netBalance: -4.08,
        },
        filingDeadline: "2025-04-30",
        status: "not_filed",
      };
    }),

  /**
   * Get fuel alerts
   */
  getAlerts: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          id: "alert_001",
          type: "unusual_purchase",
          severity: "medium",
          message: "Unusual fuel purchase detected: 200 gallons at single transaction",
          vehicleId: "v3",
          unitNumber: "TRK-103",
          timestamp: "2025-01-22T03:00:00Z",
          resolved: false,
        },
        {
          id: "alert_002",
          type: "low_mpg",
          severity: "low",
          message: "TRK-104 fuel efficiency below fleet average for 2 consecutive weeks",
          vehicleId: "v4",
          unitNumber: "TRK-104",
          timestamp: "2025-01-20T09:00:00Z",
          resolved: false,
        },
      ];
    }),

  /**
   * Resolve fuel alert
   */
  resolveAlert: protectedProcedure
    .input(z.object({
      alertId: z.string(),
      resolution: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        alertId: input.alertId,
        resolvedBy: ctx.user?.id,
        resolvedAt: new Date().toISOString(),
      };
    }),

  // Additional fuel procedures
  getAverages: protectedProcedure.input(z.object({ period: z.string().optional(), fuelType: z.string().optional() }).optional()).query(async () => ({ avgPrice: 3.45, trend: "up", change: 0.05, national: 3.45, lowest: 3.15, highest: 3.85, weekChange: 0.05 })),
  getTrends: protectedProcedure.input(z.object({ period: z.string().optional(), fuelType: z.string().optional(), days: z.number().optional() }).optional()).query(async () => [{ date: "2025-01-20", price: 3.40 }]),
  getNearbyStations: protectedProcedure.input(z.object({ lat: z.number(), lng: z.number(), fuelType: z.string().optional(), limit: z.number().optional() })).query(async () => [{ id: "s1", name: "Pilot Flying J", distance: 2.5, dieselPrice: 3.45 }]),
  getPrices: protectedProcedure.input(z.object({ location: z.object({ lat: z.number(), lng: z.number() }).optional(), radius: z.number().optional(), fuelType: z.string().optional() }).optional()).query(async () => [{ id: "s1", name: "Pilot Flying J", diesel: 3.45, unleaded: 3.25, premium: 3.65, distance: 2.5 }]),
  getFuelCardStats: protectedProcedure.query(async () => ({ totalCards: 25, activeCards: 22, totalSpent: 45000, monthlyLimit: 50000, topStation: "Pilot Flying J", monthlySpend: 12500, gallonsThisMonth: 3500 })),
  toggleCard: protectedProcedure.input(z.object({ cardId: z.string(), active: z.boolean().optional(), status: z.string().optional() })).mutation(async ({ input }) => ({ success: true, cardId: input.cardId, active: input.active })),
});
