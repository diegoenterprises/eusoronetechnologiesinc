/**
 * CARRIERS ROUTER
 * tRPC procedures for carrier management
 * Based on 02_CARRIER_USER_JOURNEY.md
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const carrierStatusSchema = z.enum(["active", "pending", "suspended", "inactive"]);

export const carriersRouter = router({
  /**
   * Get available capacity for CapacityBoard page
   */
  getAvailableCapacity: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(50) }))
    .query(async () => {
      return [
        { id: "c1", carrier: "ABC Transport", equipment: "tanker", available: 3, location: "Houston, TX", rate: 2.85 },
        { id: "c2", carrier: "Fast Freight", equipment: "dry_van", available: 5, location: "Dallas, TX", rate: 2.45 },
        { id: "c3", carrier: "Pro Haulers", equipment: "flatbed", available: 2, location: "Austin, TX", rate: 3.15 },
      ];
    }),

  /**
   * Get capacity summary for CapacityBoard page
   */
  getCapacitySummary: protectedProcedure
    .query(async () => {
      return { totalAvailable: 45, totalCapacity: 60, tankers: 12, tanker: 12, dryVans: 18, dryVan: 18, flatbeds: 8, flatbed: 8, reefers: 7, reefer: 7, available: 45, booked: 15, verified: 42, avgRating: 4.7 };
    }),
  searchCapacity: protectedProcedure.input(z.object({ search: z.string().optional(), origin: z.string().optional(), destination: z.string().optional(), equipment: z.string().optional(), hazmatRequired: z.boolean().optional() }).optional()).query(async () => [
    { id: "cap1", carrierId: "c1", carrierName: "ABC Transport", equipment: "tanker", origin: "Houston, TX", destination: "Dallas, TX", available: "2025-01-25", rate: 2.50 },
    { id: "cap2", carrierId: "c2", carrierName: "FastHaul LLC", equipment: "flatbed", origin: "Austin, TX", destination: "San Antonio, TX", available: "2025-01-24", rate: 2.25 },
  ]),

  /**
   * Get carrier dashboard stats
   */
  getDashboardStats: protectedProcedure
    .query(async () => {
      return {
        activeLoads: 5,
        availableCapacity: 8,
        weeklyRevenue: 28500,
        fleetUtilization: 72,
        safetyScore: 92,
        onTimeRate: 96,
      };
    }),

  /**
   * Get my drivers
   */
  getMyDrivers: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async () => {
      return [
        {
          id: "d1",
          name: "Mike Johnson",
          status: "driving",
          currentLoad: "LOAD-45920",
          hoursRemaining: 6.5,
          location: "Waco, TX",
        },
        {
          id: "d2",
          name: "Sarah Williams",
          status: "available",
          hoursRemaining: 10,
          location: "Dallas, TX",
        },
        {
          id: "d3",
          name: "Tom Brown",
          status: "off_duty",
          hoursRemaining: 11,
          location: "Austin, TX",
        },
      ];
    }),

  /**
   * Get active loads for carrier
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
          driver: "Mike Johnson",
          eta: "2 hours",
          rate: 2450,
        },
        {
          id: "load_002",
          loadNumber: "LOAD-45918",
          status: "loading",
          origin: "Beaumont, TX",
          destination: "Austin, TX",
          driver: "Tom Brown",
          eta: "6 hours",
          rate: 2800,
        },
      ];
    }),

  /**
   * Get carrier alerts
   */
  getAlerts: protectedProcedure
    .query(async () => {
      return [
        {
          id: "alert_001",
          type: "hos",
          severity: "warning",
          message: "Driver Mike Johnson: 2 hours drive time remaining",
          driverId: "d1",
        },
        {
          id: "alert_002",
          type: "document",
          severity: "info",
          message: "Medical certificate expires in 30 days for Sarah Williams",
          driverId: "d2",
        },
      ];
    }),

  /**
   * List carriers
   */
  list: protectedProcedure
    .input(z.object({
      status: carrierStatusSchema.optional(),
      search: z.string().optional(),
      hasHazmat: z.boolean().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const carriers = [
        {
          id: "car_001",
          name: "ABC Transport LLC",
          dotNumber: "1234567",
          mcNumber: "MC-987654",
          status: "active",
          safetyRating: "Satisfactory",
          safetyScore: 92,
          fleetSize: 24,
          activeDrivers: 18,
          hazmatCertified: true,
          insurance: { liability: 1000000, cargo: 100000, valid: true },
          location: { city: "Houston", state: "TX" },
        },
        {
          id: "car_002",
          name: "FastHaul LLC",
          dotNumber: "2345678",
          mcNumber: "MC-876543",
          status: "active",
          safetyRating: "Satisfactory",
          safetyScore: 88,
          fleetSize: 12,
          activeDrivers: 10,
          hazmatCertified: true,
          insurance: { liability: 1000000, cargo: 100000, valid: true },
          location: { city: "Dallas", state: "TX" },
        },
        {
          id: "car_003",
          name: "SafeHaul Transport",
          dotNumber: "3456789",
          mcNumber: "MC-765432",
          status: "pending",
          safetyRating: "None",
          safetyScore: 0,
          fleetSize: 6,
          activeDrivers: 5,
          hazmatCertified: false,
          insurance: { liability: 1000000, cargo: 100000, valid: true },
          location: { city: "Austin", state: "TX" },
        },
      ];

      let filtered = carriers;
      if (input.status) {
        filtered = filtered.filter(c => c.status === input.status);
      }
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(c => 
          c.name.toLowerCase().includes(q) ||
          c.dotNumber.includes(q) ||
          c.mcNumber.includes(q)
        );
      }
      if (input.hasHazmat !== undefined) {
        filtered = filtered.filter(c => c.hazmatCertified === input.hasHazmat);
      }

      return filtered.slice(input.offset, input.offset + input.limit);
    }),

  /**
   * Get carrier by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string(), carrierId: z.string().optional() }))
    .query(async ({ input }) => {
      return {
        id: input.id || input.carrierId,
        name: "ABC Transport LLC",
        dotNumber: "1234567",
        mcNumber: "MC-987654",
        status: "active",
        safetyRating: "Satisfactory",
        safetyScore: 92,
        verified: true,
        rating: 4.7,
        loadsCompleted: 450,
        onTimeRate: 96,
        driverCount: 18,
        fleetSize: 24,
        phone: "555-0100",
        email: "info@abctransport.com",
        address: {
          street: "1234 Industrial Blvd",
          city: "Houston",
          state: "TX",
          zip: "77001",
        },
        contact: {
          name: "John Manager",
          phone: "555-0100",
          email: "john@abctransport.com",
        },
        fleet: {
          totalTrucks: 24,
          totalTrailers: 30,
          activeTrucks: 20,
          activeDrivers: 18,
        },
        insurance: {
          liability: { amount: 1000000, expiration: "2025-12-31", provider: "Progressive" },
          cargo: { amount: 100000, expiration: "2025-12-31", provider: "Progressive" },
          workersComp: { valid: true, expiration: "2025-12-31" },
        },
        certifications: {
          hazmat: true,
          tanker: true,
          twic: true,
          tsa: false,
        },
        performance: {
          loadsCompleted: 450,
          onTimeRate: 96,
          claimsRatio: 0.02,
          avgRating: 4.7,
        },
        csaScores: {
          unsafeDriving: 42,
          hos: 38,
          driverFitness: 0,
          drugs: 0,
          vehicleMaintenance: 58,
          hazmat: 25,
          crash: 35,
        },
        csaScore: 85,
        saferScore: 92,
        insuranceValid: true,
        insuranceExpiry: "2025-12-31",
        authorityActive: true,
        vettingStatus: "approved",
        yearsInBusiness: 8,
        legalName: "ABC Transport LLC",
        dba: "ABC Transport",
        authorityStatus: "active",
        primaryContact: { name: "John Manager", phone: "555-0100", email: "john@abctransport.com" },
        inspections: 24,
        equipmentTypes: ["Dry Van", "Flatbed", "Tanker"],
        serviceAreas: ["TX", "LA", "OK", "AR", "NM"],
      };
    }),

  /**
   * Verify carrier (SAFER lookup)
   */
  verify: protectedProcedure
    .input(z.object({
      dotNumber: z.string(),
    }))
    .mutation(async ({ input }) => {
      return {
        verified: true,
        dotNumber: input.dotNumber,
        legalName: "ABC Transport LLC",
        dbaName: "ABC Hazmat Carriers",
        operatingStatus: "AUTHORIZED",
        safetyRating: "SATISFACTORY",
        outOfServiceDate: null,
        mcNumber: "MC-987654",
        address: {
          street: "1234 Industrial Blvd",
          city: "Houston",
          state: "TX",
          zip: "77001",
        },
        phone: "555-0100",
        authority: {
          common: true,
          contract: true,
          broker: false,
          hazmat: true,
        },
        insurance: {
          bipdOnFile: true,
          cargoOnFile: true,
          bondOnFile: false,
        },
        verifiedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get carrier capacity
   */
  getCapacity: protectedProcedure
    .input(z.object({ carrierId: z.string() }))
    .query(async ({ input }) => {
      return {
        carrierId: input.carrierId,
        availableTrucks: 4,
        availableDrivers: 4,
        equipment: [
          { type: "tanker", available: 3, inUse: 8, total: 11 },
          { type: "flatbed", available: 1, inUse: 2, total: 3 },
        ],
        preferredLanes: [
          { origin: "TX", destination: "TX", rate: 3.25 },
          { origin: "TX", destination: "LA", rate: 3.45 },
          { origin: "TX", destination: "OK", rate: 3.35 },
        ],
      };
    }),

  /**
   * Get bids for BidManagement
   */
  getBids: protectedProcedure
    .input(z.object({ filter: z.string().optional() }))
    .query(async ({ input }) => {
      const bids = [
        { id: "bid_001", loadNumber: "LOAD-45930", origin: "Houston, TX", destination: "Dallas, TX", myBid: 2400, status: "pending", expires: "2h" },
        { id: "bid_002", loadNumber: "LOAD-45928", origin: "Beaumont, TX", destination: "Austin, TX", myBid: 2800, status: "accepted", expires: null },
        { id: "bid_003", loadNumber: "LOAD-45925", origin: "Port Arthur, TX", destination: "San Antonio, TX", myBid: 3000, status: "rejected", expires: null },
      ];
      if (input.filter && input.filter !== "all") {
        return bids.filter(b => b.status === input.filter);
      }
      return bids;
    }),

  /**
   * Get bid stats for BidManagement
   */
  getBidStats: protectedProcedure
    .query(async () => {
      return {
        activeBids: 5,
        wonThisWeek: 3,
        winRate: 68,
        avgBidAmount: 2650,
        pending: 5,
        accepted: 3,
        avgBid: 2650,
      };
    }),

  /**
   * Get available loads for bidding
   */
  getAvailableLoads: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async () => {
      return [
        { id: "load_a1", loadNumber: "LOAD-45935", origin: "Houston, TX", destination: "Dallas, TX", rate: 2500, distance: 240, pickupDate: "Jan 26" },
        { id: "load_a2", loadNumber: "LOAD-45936", origin: "Beaumont, TX", destination: "Austin, TX", rate: 2900, distance: 280, pickupDate: "Jan 27" },
      ];
    }),

  /**
   * Submit a bid
   */
  submitBid: protectedProcedure
    .input(z.object({ loadId: z.string(), amount: z.number(), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        bidId: `bid_${Date.now()}`,
        loadId: input.loadId,
        amount: input.amount,
        submittedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get carrier documents
   */
  getDocuments: protectedProcedure
    .input(z.object({ carrierId: z.string() }))
    .query(async ({ input }) => {
      return [
        { id: "doc1", type: "authority", name: "Operating Authority", status: "valid", expirationDate: null },
        { id: "doc2", type: "insurance_liability", name: "Liability Insurance Certificate", status: "valid", expirationDate: "2025-12-31" },
        { id: "doc3", type: "insurance_cargo", name: "Cargo Insurance Certificate", status: "valid", expirationDate: "2025-12-31" },
        { id: "doc4", type: "w9", name: "W-9 Form", status: "valid", uploadedDate: "2024-01-15" },
        { id: "doc5", type: "hazmat", name: "Hazmat Certificate", status: "valid", expirationDate: "2026-06-30" },
      ];
    }),

  /**
   * Get carrier performance history
   */
  getPerformanceHistory: protectedProcedure
    .input(z.object({
      carrierId: z.string(),
      period: z.enum(["month", "quarter", "year"]).default("quarter"),
    }))
    .query(async ({ input }) => {
      return {
        carrierId: input.carrierId,
        period: input.period,
        history: [
          { month: "Oct 2024", loads: 42, onTimeRate: 95, rating: 4.6 },
          { month: "Nov 2024", loads: 45, onTimeRate: 94, rating: 4.7 },
          { month: "Dec 2024", loads: 38, onTimeRate: 97, rating: 4.8 },
          { month: "Jan 2025", loads: 45, onTimeRate: 96, rating: 4.7 },
        ],
        trends: {
          loads: { change: 7.1, direction: "up" },
          onTimeRate: { change: 1.0, direction: "up" },
          rating: { change: 0.1, direction: "up" },
        },
      };
    }),

  /**
   * Update carrier status
   */
  updateStatus: protectedProcedure
    .input(z.object({
      carrierId: z.string(),
      status: carrierStatusSchema,
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        carrierId: input.carrierId,
        newStatus: input.status,
        updatedBy: ctx.user?.id,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Add carrier note
   */
  addNote: protectedProcedure
    .input(z.object({
      carrierId: z.string(),
      note: z.string(),
      isInternal: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `note_${Date.now()}`,
        carrierId: input.carrierId,
        note: input.note,
        createdBy: ctx.user?.id,
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Get carrier directory for CarrierDirectory page
   */
  getDirectory: protectedProcedure
    .input(z.object({ search: z.string().optional(), equipment: z.string().optional() }))
    .query(async ({ input }) => {
      const carriers = [
        { id: "c1", name: "ABC Transport", mcNumber: "MC-123456", equipment: ["tanker", "dry_van"], rating: 4.8, trucks: 25, location: "Houston, TX", verified: true },
        { id: "c2", name: "Fast Freight", mcNumber: "MC-234567", equipment: ["dry_van", "flatbed"], rating: 4.5, trucks: 18, location: "Dallas, TX", verified: true },
        { id: "c3", name: "Pro Haulers", mcNumber: "MC-345678", equipment: ["flatbed", "tanker"], rating: 4.7, trucks: 32, location: "Austin, TX", verified: true },
      ];
      let filtered = carriers;
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(c => c.name.toLowerCase().includes(q) || c.mcNumber.toLowerCase().includes(q));
      }
      if (input.equipment && input.equipment !== "all") {
        filtered = filtered.filter(c => c.equipment.includes(input.equipment!));
      }
      return filtered;
    }),

  /**
   * Get directory stats for CarrierDirectory page
   */
  getDirectoryStats: protectedProcedure
    .query(async () => {
      return { total: 245, verified: 220, active: 198, newThisMonth: 12 };
    }),

  /**
   * Get carrier profile for CarrierProfile page
   */
  getProfile: protectedProcedure
    .query(async () => {
      return {
        id: "c1",
        companyName: "ABC Transport LLC",
        mcNumber: "MC-123456",
        dotNumber: "1234567",
        contactName: "John Carrier",
        email: "john@abctransport.com",
        phone: "555-0200",
        address: "456 Trucking Lane, Houston, TX 77002",
        verified: true,
        memberSince: "2023-06-15",
        liabilityInsurance: { amount: 1000000, expiration: "2025-12-31" },
        cargoInsurance: { amount: 100000, expiration: "2025-12-31" },
      };
    }),

  /**
   * Get carrier stats for CarrierProfile page
   */
  getStats: protectedProcedure
    .query(async () => {
      return {
        totalLoads: 1250,
        totalRevenue: 3750000,
        avgRatePerMile: 2.85,
        onTimeDeliveryRate: 96,
        safetyScore: 92,
        avgPaymentReceived: 12,
        loadsCompleted: 1250,
        onTimeRate: 96,
      };
    }),

  /**
   * Get fleet summary for CarrierProfile page
   */
  getFleetSummary: protectedProcedure
    .query(async () => {
      return {
        totalTrucks: 25,
        activeTrucks: 22,
        inMaintenance: 2,
        available: 8,
        drivers: 28,
        activeDrivers: 24,
        totalDrivers: 28,
        utilization: 88,
      };
    }),

  /**
   * Get safety rating for CarrierProfile page
   */
  getSafetyRating: protectedProcedure
    .query(async () => {
      return {
        overallScore: 92,
        unsafeDriving: 15,
        hosCompliance: 8,
        vehicleMaintenance: 12,
        controlledSubstances: 0,
        driverFitness: 5,
        lastAudit: "2025-01-15",
        nextAuditDue: "2026-01-15",
        basicScores: { unsafeDriving: 15, hosCompliance: 8, vehicleMaintenance: 12, controlledSubstances: 0, driverFitness: 5, crashIndicator: 3, hazmatCompliance: 2 },
      };
    }),

  // Carrier packets
  getPackets: protectedProcedure.input(z.object({ status: z.string().optional(), limit: z.number().optional() }).optional()).query(async () => ([
    { id: "p1", carrierId: "c1", carrierName: "ABC Transport", status: "pending", progress: 60, submittedAt: "2025-01-20" },
    { id: "p2", carrierId: "c2", carrierName: "XYZ Logistics", status: "completed", progress: 100, submittedAt: "2025-01-18" },
  ])),
  getPacketStats: protectedProcedure.query(async () => ({ total: 45, pending: 12, completed: 33, complete: 33, avgCompletion: 78 })),
  getPacketById: protectedProcedure.input(z.object({ carrierId: z.string(), id: z.string().optional() }).optional()).query(async ({ input }) => ({
    id: input?.id || "p1",
    carrierId: input?.carrierId || "c1",
    carrierName: "ABC Transport",
    status: "pending",
    progress: 60,
    documents: [
      { name: "W-9", status: "uploaded" },
      { name: "Certificate of Insurance", status: "pending" },
    ],
  })),
  resendPacket: protectedProcedure.input(z.object({ carrierId: z.string(), id: z.string().optional() })).mutation(async ({ input }) => ({ success: true, packetId: input.id || "p1" })),

  // Additional carrier procedures
  approve: protectedProcedure.input(z.object({ carrierId: z.string() })).mutation(async ({ input }) => ({ success: true, carrierId: input.carrierId })),
  reject: protectedProcedure.input(z.object({ carrierId: z.string(), reason: z.string().optional() })).mutation(async ({ input }) => ({ success: true, carrierId: input.carrierId })),
  getDrivers: protectedProcedure.input(z.object({ carrierId: z.string().optional(), limit: z.number().optional() }).optional()).query(async () => [{ id: "d1", name: "Mike Johnson", status: "active", cdl: "TX12345678" }]),
  getCSAScores: protectedProcedure.input(z.object({ carrierId: z.string().optional() })).query(async () => ([{ name: "Unsafe Driving", score: 15, category: "unsafe_driving", threshold: 65 }, { name: "HOS Compliance", score: 8, category: "hos", threshold: 65 }, { name: "Vehicle Maintenance", score: 12, category: "vehicle", threshold: 80 }, { name: "Controlled Substances", score: 0, category: "drugs", threshold: 80 }])),
  getCSAScoresList: protectedProcedure.input(z.object({ carrierId: z.string().optional() }).optional()).query(async () => [
    { name: "Unsafe Driving", score: 15, threshold: 65, status: "ok" },
    { name: "HOS Compliance", score: 8, threshold: 65, status: "ok" },
    { name: "Vehicle Maintenance", score: 12, threshold: 80, status: "ok" },
    { name: "Controlled Substances", score: 0, threshold: 80, status: "ok" },
    { name: "Driver Fitness", score: 5, threshold: 80, status: "ok" },
    { name: "Crash Indicator", score: 3, threshold: 65, status: "ok" },
    { name: "Hazmat Compliance", score: 2, threshold: 80, status: "ok" },
  ]),
  getInsurance: protectedProcedure.input(z.object({ carrierId: z.string().optional() })).query(async () => ([{ type: "Liability", amount: 1000000, expiration: "2025-12-31", carrier: "Progressive", policyNumber: "POL-123456", coverage: 1000000, expirationDate: "2025-12-31", verified: true }, { type: "Cargo", amount: 100000, expiration: "2025-12-31", carrier: "Progressive", policyNumber: "POL-123457", coverage: 100000, expirationDate: "2025-12-31", verified: true }])),
  getLoadHistory: protectedProcedure.input(z.object({ carrierId: z.string().optional(), limit: z.number().optional() })).query(async () => [{ id: "l1", loadNumber: "LOAD-45920", status: "delivered", date: "2025-01-20", route: "Houston, TX - Dallas, TX", rate: 2450 }]),
  getRecentLoads: protectedProcedure.input(z.object({ carrierId: z.string().optional(), limit: z.number().optional() })).query(async () => [{ id: "l1", loadNumber: "LOAD-45920", status: "in_transit" }]),
  getScorecards: protectedProcedure.query(async () => [{ carrierId: "c1", name: "ABC Transport", score: 92, trend: "up" }]),
  getTopPerformers: protectedProcedure.query(async () => [{ carrierId: "c1", name: "ABC Transport", score: 98, loads: 150 }]),

  // Vetting
  getVettingList: protectedProcedure.input(z.object({ search: z.string().optional(), status: z.string().optional() }).optional()).query(async () => [
    { id: "v1", carrierId: "c1", name: "ABC Transport", dotNumber: "1234567", status: "pending", submittedAt: "2025-01-20" },
    { id: "v2", carrierId: "c2", name: "FastHaul LLC", dotNumber: "2345678", status: "approved", submittedAt: "2025-01-18" },
  ]),
  getVettingStats: protectedProcedure.query(async () => ({ pending: 5, approved: 42, rejected: 3, total: 50 })),
});
