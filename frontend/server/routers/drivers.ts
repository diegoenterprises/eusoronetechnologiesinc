/**
 * DRIVERS ROUTER
 * tRPC procedures for driver management
 * Based on 04_DRIVER_USER_JOURNEY.md
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const driverStatusSchema = z.enum(["available", "on_load", "off_duty", "inactive"]);
const dutyStatusSchema = z.enum(["off_duty", "sleeper", "driving", "on_duty"]);

export const driversRouter = router({
  /**
   * Get summary for DriverDirectory page
   */
  getSummary: protectedProcedure
    .query(async () => {
      return { total: 24, available: 8, onLoad: 12, offDuty: 4, avgSafetyScore: 94 };
    }),

  /**
   * Get driver dashboard stats for logged-in driver
   */
  getDashboardStats: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        currentStatus: "on_load",
        hoursAvailable: 6.5,
        milesThisWeek: 1850,
        earningsThisWeek: 1017.50,
        loadsCompleted: 2,
        safetyScore: 95,
        onTimeRate: 96,
        rating: 4.8,
      };
    }),

  /**
   * Get HOS status (no input required for logged-in driver)
   */
  getHOSStatus: protectedProcedure
    .input(z.object({}).optional())
    .query(async ({ ctx }) => {
      return {
        status: "driving",
        drivingRemaining: "6h 30m",
        onDutyRemaining: "8h 00m",
        cycleRemaining: "52h 30m",
        breakRemaining: "2h 00m",
        hoursAvailable: {
          driving: 6.5,
          onDuty: 8.0,
          cycle: 52.5,
        },
        violations: [],
        lastBreak: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        nextBreakRequired: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      };
    }),

  /**
   * List all drivers
   */
  list: protectedProcedure
    .input(z.object({
      status: driverStatusSchema.optional(),
      search: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const drivers = [
        {
          id: "d1",
          name: "Mike Johnson",
          firstName: "Mike",
          lastName: "Johnson",
          phone: "555-0101",
          email: "mike.j@example.com",
          status: "on_load",
          currentLoad: "LOAD-45920",
          location: { city: "Houston", state: "TX" },
          hoursRemaining: 6.5,
          safetyScore: 95,
          hireDate: "2022-03-15",
        },
        {
          id: "d2",
          name: "Sarah Williams",
          firstName: "Sarah",
          lastName: "Williams",
          phone: "555-0102",
          email: "sarah.w@example.com",
          status: "available",
          location: { city: "Dallas", state: "TX" },
          hoursRemaining: 10,
          safetyScore: 92,
          hireDate: "2021-06-01",
        },
        {
          id: "d3",
          name: "Tom Brown",
          firstName: "Tom",
          lastName: "Brown",
          phone: "555-0103",
          email: "tom.b@example.com",
          status: "off_duty",
          location: { city: "Austin", state: "TX" },
          hoursRemaining: 11,
          safetyScore: 88,
          hireDate: "2023-01-10",
        },
      ];

      let filtered = drivers;
      if (input.status) {
        filtered = filtered.filter(d => d.status === input.status);
      }
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(d => 
          d.name.toLowerCase().includes(q) ||
          d.email.toLowerCase().includes(q)
        );
      }

      return {
        drivers: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
      };
    }),

  /**
   * Get driver by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        name: "Mike Johnson",
        phone: "555-0101",
        email: "mike.j@example.com",
        status: "on_load",
        currentLoad: "LOAD-45920",
        location: { lat: 29.7604, lng: -95.3698, city: "Houston", state: "TX" },
        hoursRemaining: 6.5,
        safetyScore: 95,
        rating: 4.8,
        hireDate: "2022-03-15",
        truckNumber: "TRK-101",
        cdlNumber: "TX12345678",
        cdl: {
          number: "TX12345678",
          class: "A",
          endorsements: ["H", "N", "T"],
          expirationDate: "2026-03-15",
        },
        medicalCard: {
          expirationDate: "2025-11-15",
          status: "valid",
        },
        homeTerminal: "Houston, TX",
        payRate: {
          type: "per_mile",
          rate: 0.55,
        },
        stats: {
          loadsThisMonth: 8,
          milesThisMonth: 7245,
          earningsThisMonth: 6776.75,
          onTimeRate: 96,
        },
      };
    }),

  /**
   * Get driver HOS status by driver ID
   */
  getHOSStatusByDriver: protectedProcedure
    .input(z.object({ driverId: z.string() }))
    .query(async ({ input }) => {
      return {
        driverId: input.driverId,
        currentStatus: "driving",
        statusStartTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        hoursAvailable: {
          driving: 6.5,
          onDuty: 8.0,
          cycle: 52.5,
        },
        violations: [],
        lastBreak: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        nextBreakRequired: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        cycleReset: "2025-01-27T00:00:00Z",
      };
    }),

  /**
   * Update driver status
   */
  updateStatus: protectedProcedure
    .input(z.object({
      driverId: z.string(),
      status: driverStatusSchema,
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        driverId: input.driverId,
        newStatus: input.status,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get driver location history
   */
  getLocationHistory: protectedProcedure
    .input(z.object({
      driverId: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return [
        { timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), lat: 29.7604, lng: -95.3698, city: "Houston", state: "TX" },
        { timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), lat: 30.2672, lng: -95.7889, city: "Conroe", state: "TX" },
        { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), lat: 30.6280, lng: -96.3344, city: "Bryan", state: "TX" },
        { timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), lat: 31.1171, lng: -97.7278, city: "Killeen", state: "TX" },
        { timestamp: new Date().toISOString(), lat: 31.5493, lng: -97.1467, city: "Waco", state: "TX" },
      ];
    }),

  /**
   * Get driver performance metrics
   */
  getPerformanceMetrics: protectedProcedure
    .input(z.object({
      driverId: z.string(),
      period: z.enum(["week", "month", "quarter", "year"]).default("month"),
    }))
    .query(async ({ input }) => {
      return {
        driverId: input.driverId,
        period: input.period,
        metrics: {
          totalMiles: 7245,
          totalLoads: 8,
          onTimeDeliveryRate: 96,
          safetyScore: 95,
          fuelEfficiency: 6.8,
          customerRating: 4.8,
          hosCompliance: 100,
          inspectionPassRate: 100,
        },
        rankings: {
          overall: 1,
          totalDrivers: 18,
          safetyRank: 1,
          productivityRank: 2,
        },
        trends: {
          safetyScore: { current: 95, previous: 93, change: 2.1 },
          onTimeRate: { current: 96, previous: 94, change: 2.1 },
        },
      };
    }),

  /**
   * Assign load to driver
   */
  assignLoad: protectedProcedure
    .input(z.object({
      driverId: z.string(),
      loadId: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        driverId: input.driverId,
        loadId: input.loadId,
        assignedBy: ctx.user?.id,
        assignedAt: new Date().toISOString(),
      };
    }),

  /**
   * Send message to driver
   */
  sendMessage: protectedProcedure
    .input(z.object({
      driverId: z.string(),
      message: z.string(),
      urgent: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        messageId: `msg_${Date.now()}`,
        sentAt: new Date().toISOString(),
      };
    }),

  /**
   * Get driver documents
   */
  getDocuments: protectedProcedure
    .input(z.object({ driverId: z.string() }))
    .query(async ({ input }) => {
      return [
        { id: "doc1", type: "cdl", name: "Commercial Driver's License", status: "valid", expirationDate: "2026-03-15" },
        { id: "doc2", type: "medical", name: "Medical Certificate", status: "valid", expirationDate: "2025-11-15" },
        { id: "doc3", type: "hazmat", name: "Hazmat Endorsement", status: "valid", expirationDate: "2026-03-15" },
        { id: "doc4", type: "twic", name: "TWIC Card", status: "valid", expirationDate: "2027-01-20" },
        { id: "doc5", type: "mvr", name: "Motor Vehicle Record", status: "valid", lastUpdated: "2024-12-01" },
      ];
    }),

  /**
   * Get available drivers for dispatch
   */
  getAvailable: protectedProcedure
    .input(z.object({
      origin: z.string().optional(),
      equipmentType: z.string().optional(),
      hazmatRequired: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      return [
        {
          id: "d2",
          name: "Sarah Williams",
          location: { city: "Dallas", state: "TX" },
          hoursRemaining: 10,
          currentVehicle: "TRK-102",
          endorsements: ["H", "N", "T"],
          safetyScore: 92,
          distance: 240,
        },
        {
          id: "d4",
          name: "Lisa Chen",
          location: { city: "Fort Worth", state: "TX" },
          hoursRemaining: 11,
          currentVehicle: "TRK-104",
          endorsements: ["H", "N"],
          safetyScore: 90,
          distance: 265,
        },
      ];
    }),

  /**
   * Get current assignment for logged-in driver
   */
  getCurrentAssignment: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        loadNumber: "LOAD-45920",
        status: "in_transit",
        commodity: "Diesel Fuel",
        weight: 42000,
        quantity: 8500,
        quantityUnit: "gal",
        equipmentType: "Tanker",
        hazmat: true,
        hazmatClass: "3",
        unNumber: "UN1202",
        packingGroup: "III",
        ergGuide: "128",
        origin: {
          name: "Shell Houston Terminal",
          address: "1234 Refinery Rd",
          city: "Houston",
          state: "TX",
        },
        destination: {
          name: "Dallas Distribution Center",
          address: "5678 Industrial Blvd",
          city: "Dallas",
          state: "TX",
        },
        pickupTime: "08:00 AM",
        deliveryTime: "02:00 PM",
        totalMiles: 238,
        milesCompleted: 165,
        eta: "1:45 PM",
        remainingTime: "1h 15m",
        temperature: {
          min: 60,
          max: 80,
          current: 72,
        },
        dispatch: { name: "John Dispatch", phone: "(713) 555-0100" },
        shipper: { name: "Shell Oil", phone: "(713) 555-0200" },
        receiver: { name: "Dallas Dist Center", phone: "(214) 555-0300" },
      };
    }),

  /**
   * Get HOS status for logged-in driver
   */
  getMyHOSStatus: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        status: "driving",
        drivingRemaining: "6h 30m",
        onDutyRemaining: "8h 00m",
        cycleRemaining: "52h 30m",
        breakRemaining: "2h 00m",
        drivingToday: 4.5,
        onDutyToday: 6,
        cycleUsed: 17.5,
        hoursAvailable: { driving: 6.5, onDuty: 8, cycle: 52.5 },
        violations: [],
        lastBreak: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        nextBreakRequired: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      };
    }),

  /**
   * Update load status
   */
  updateLoadStatus: protectedProcedure
    .input(z.object({
      status: z.enum(["assigned", "en_route_pickup", "at_pickup", "loading", "in_transit", "at_delivery", "unloading", "delivered"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        newStatus: input.status,
        updatedAt: new Date().toISOString(),
        updatedBy: ctx.user?.id,
      };
    }),

  /**
   * Get assigned vehicle for logged-in driver
   */
  getAssignedVehicle: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        id: "v1",
        unitNumber: "TRK-101",
        status: "operational",
        make: "Peterbilt",
        model: "579",
        year: 2022,
        vin: "1XPWD49X1ED000001",
        licensePlate: "TX-ABC1234",
        equipmentType: "Tanker",
        hazmatCertified: true,
        odometer: 145678,
        fuelLevel: 72,
        defLevel: 85,
        daysToService: 12,
        trailer: {
          unitNumber: "TRL-501",
          type: "DOT-407 Tank Trailer",
          capacity: 9000,
          lastInspection: "2025-01-15",
        },
        maintenanceItems: [
          { name: "Oil Change", lastCompleted: "2024-12-15", nextDue: "2025-02-15", daysRemaining: 22 },
          { name: "DOT Annual Inspection", lastCompleted: "2024-06-01", nextDue: "2025-06-01", daysRemaining: 128 },
          { name: "Brake Inspection", lastCompleted: "2024-11-01", nextDue: "2025-02-01", daysRemaining: 8 },
          { name: "Tank Test", lastCompleted: "2024-01-15", nextDue: "2026-01-15", daysRemaining: 356 },
        ],
      };
    }),

  /**
   * Get last inspection for assigned vehicle
   */
  getLastInspection: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        id: "insp1",
        date: "2025-01-23",
        type: "Pre-Trip",
        passed: true,
        defects: 0,
        inspector: ctx.user?.id,
        duration: 15,
      };
    }),

  /**
   * Start DVIR (Driver Vehicle Inspection Report)
   */
  startDVIR: protectedProcedure
    .input(z.object({
      type: z.enum(["pre_trip", "post_trip"]),
      vehicleId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        dvirId: `dvir_${Date.now()}`,
        type: input.type,
        startedAt: new Date().toISOString(),
        startedBy: ctx.user?.id,
      };
    }),

  /**
   * Submit DVIR
   */
  submitDVIR: protectedProcedure
    .input(z.object({
      dvirId: z.string(),
      passed: z.boolean(),
      defects: z.array(z.object({
        category: z.string(),
        description: z.string(),
        severity: z.enum(["minor", "major", "out_of_service"]),
      })).optional(),
      notes: z.string().optional(),
      signature: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        dvirId: input.dvirId,
        result: input.passed ? "passed" : "failed",
        submittedAt: new Date().toISOString(),
        submittedBy: ctx.user?.id,
      };
    }),

  /**
   * Get route information for navigation
   */
  getRouteInfo: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        totalMiles: 238,
        milesRemaining: 73,
        eta: "1:45 PM",
        driveTimeRemaining: "1h 15m",
        fuelStops: [
          { name: "Pilot Travel Center", location: "Waco, TX", miles: 25, dieselPrice: 3.29 },
        ],
        restAreas: [
          { name: "I-35 Rest Area", location: "Hillsboro, TX", miles: 45 },
        ],
        alerts: [
          { type: "traffic", message: "Slow traffic ahead near Waco - 15 min delay", severity: "warning" },
          { type: "weather", message: "Clear conditions through route", severity: "info" },
        ],
        hazmatRestrictions: [
          { location: "Downtown Dallas", restriction: "No hazmat 7AM-9AM, 4PM-7PM", miles: 70 },
        ],
      };
    }),

  /**
   * Get driver earnings summary
   */
  getEarnings: protectedProcedure
    .input(z.object({
      period: z.enum(["week", "month", "quarter", "year"]).default("month"),
    }))
    .query(async ({ ctx, input }) => {
      return {
        period: input.period,
        totalEarnings: 6776.75,
        milesPaid: 7245,
        ratePerMile: 0.55,
        bonuses: 350,
        deductions: 125,
        netPay: 7001.75,
        breakdown: [
          { category: "Line Haul", amount: 3985.75 },
          { category: "Detention", amount: 450 },
          { category: "Fuel Bonus", amount: 200 },
          { category: "Safety Bonus", amount: 150 },
          { category: "Hazmat Premium", amount: 1991 },
        ],
      };
    }),

  /**
   * Get HOS for specific driver for DriverDetails page
   */
  getHOS: protectedProcedure
    .input(z.object({ driverId: z.string() }))
    .query(async ({ input }) => {
      return {
        driverId: input.driverId,
        status: "driving",
        drivingRemaining: "6h 30m",
        onDutyRemaining: "8h 00m",
        cycleRemaining: "52h 30m",
        breakRemaining: "2h 00m",
        lastUpdate: new Date().toISOString(),
        drivingHours: { used: 4.5, total: 11, remaining: 6.5 },
        onDutyHours: { used: 6, total: 14, remaining: 8 },
        cycleHours: { used: 17.5, total: 70, remaining: 52.5 },
      };
    }),

  /**
   * Get recent loads for driver for DriverDetails page
   */
  getRecentLoads: protectedProcedure
    .input(z.object({ driverId: z.string(), limit: z.number().optional().default(5) }))
    .query(async ({ input }) => {
      return [
        { id: "l1", loadNumber: "LOAD-45920", origin: "Houston, TX", destination: "Dallas, TX", status: "delivered", deliveredAt: "2025-01-22" },
        { id: "l2", loadNumber: "LOAD-45915", origin: "Austin, TX", destination: "San Antonio, TX", status: "delivered", deliveredAt: "2025-01-20" },
      ];
    }),

  // Load acceptance
  acceptLoad: protectedProcedure.input(z.object({ loadId: z.string() })).mutation(async ({ input }) => ({ success: true, loadId: input.loadId })),
  declineLoad: protectedProcedure.input(z.object({ loadId: z.string(), reason: z.string().optional() })).mutation(async ({ input }) => ({ success: true, loadId: input.loadId })),
  getPendingLoads: protectedProcedure.query(async () => [{ id: "l1", loadNumber: "LOAD-45930", origin: "Houston, TX", destination: "Dallas, TX", rate: 2450 }]),

  // Driver applications
  getApplications: protectedProcedure.input(z.object({ status: z.string().optional() })).query(async () => [{ id: "a1", name: "John Smith", status: "pending", appliedAt: "2025-01-22" }]),
  getApplicationStats: protectedProcedure.query(async () => ({ pending: 12, approved: 150, rejected: 25 })),
  approveApplication: protectedProcedure.input(z.object({ applicationId: z.string() })).mutation(async ({ input }) => ({ success: true, applicationId: input.applicationId })),
  rejectApplication: protectedProcedure.input(z.object({ applicationId: z.string(), reason: z.string().optional() })).mutation(async ({ input }) => ({ success: true, applicationId: input.applicationId })),

  // Current driver info
  getCurrentDriver: protectedProcedure.query(async () => ({ id: "d1", name: "Mike Johnson", status: "active", cdlNumber: "TX12345678" })),
  getCurrentVehicle: protectedProcedure.query(async () => ({ id: "v1", unitNumber: "TRK-101", make: "Peterbilt", model: "579", year: 2022 })),

  // Earnings
  getEarningsStats: protectedProcedure.query(async () => ({ thisWeek: 2850, lastWeek: 3100, thisMonth: 12500, avgPerLoad: 450 })),
  getCompletedTrips: protectedProcedure.input(z.object({ limit: z.number().optional() })).query(async () => [{ id: "t1", loadNumber: "LOAD-45920", earnings: 850, completedAt: "2025-01-22" }]),

  // HOS
  getHOSAvailability: protectedProcedure.query(async () => ({ canDrive: true, drivingRemaining: "6h 30m", dutyRemaining: "8h 00m" })),
  getMyHOS: protectedProcedure.query(async () => ({ 
    status: "driving", 
    currentStatus: "driving",
    drivingRemaining: "6h 30m", 
    onDutyRemaining: "8h 00m", 
    cycleRemaining: "52h 30m",
    breakRemaining: "2h 00m",
    drivingToday: 4.5,
    onDutyToday: 6,
    cycleUsed: 17.5,
    hoursAvailable: { driving: 6.5, onDuty: 8, cycle: 52.5 },
    violations: [],
    lastBreak: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    nextBreakRequired: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    drivingHours: { used: 4.5, total: 11, remaining: 6.5 },
    onDutyHours: { used: 6, total: 14, remaining: 8 },
    cycleHours: { used: 17.5, total: 70, remaining: 52.5 },
  })),
  startDriving: protectedProcedure.mutation(async () => ({ success: true, startedAt: new Date().toISOString() })),
  stopDriving: protectedProcedure.mutation(async () => ({ success: true, stoppedAt: new Date().toISOString() })),

  // Onboarding
  getOnboarding: protectedProcedure.input(z.object({ search: z.string().optional() }).optional()).query(async () => ({ 
    step: 3, 
    totalSteps: 5, 
    completed: ["profile", "documents", "vehicle"],
    percentage: 60,
    completedSteps: 3,
    inProgressSteps: 1,
    pendingSteps: 1,
    estimatedTimeRemaining: "15 minutes",
  })),
  getOnboardingStats: protectedProcedure.input(z.object({ search: z.string().optional() }).optional()).query(async () => ({ 
    step: 3,
    totalSteps: 5,
    percentage: 60,
    inProgress: 15, 
    completed: 120, 
    dropped: 8,
    total: 143,
    stalled: 5,
    completedSteps: 3,
    inProgressSteps: 1,
    estimatedTimeRemaining: "15 minutes",
    trainingsCompleted: 8,
  })),
  getOnboardingDrivers: protectedProcedure.input(z.object({ search: z.string().optional() }).optional()).query(async () => ([
    { id: "d1", name: "Mike Johnson", step: 3, totalSteps: 5, status: "in_progress", startedAt: "2025-01-20" },
    { id: "d2", name: "Sarah Williams", step: 5, totalSteps: 5, status: "completed", startedAt: "2025-01-18" },
  ])),

  // Performance
  getPerformance: protectedProcedure.input(z.object({ driverId: z.string().optional(), period: z.string().optional() }).optional()).query(async () => ({
    score: 92,
    overallScore: 92,
    onTimeRate: 96,
    safetyScore: 94,
    customerRating: 4.8,
    name: "Mike Johnson",
    rank: 3,
    totalDrivers: 24,
    trend: "up",
    achievements: [{ id: "a1", name: "Perfect Week", earnedAt: "2025-01-20" }],
    stats: {
      loadsCompleted: 45,
      milesDriver: 12500,
      milesThisMonth: 12500,
      hoursThisWeek: 48,
      fuelEfficiency: 6.8,
      revenue: 28500,
      onTimeDeliveries: 43,
      incidents: 0,
    },
    metrics: {
      loadsCompleted: 45,
      milesDriver: 12500,
      revenue: 28500,
      fuelEfficiency: 6.8,
      safety: 94,
      efficiency: 88,
      compliance: 96,
      onTime: { score: 96, trend: "up", change: 1.2 },
      customerRating: { score: 4.8, trend: "stable", change: 0 },
    },
  })),
  getPerformanceReviews: protectedProcedure.input(z.object({ driverId: z.string().optional() })).query(async () => [{ id: "r1", date: "2025-01-15", score: 92, notes: "Excellent performance" }]),
  getReviewStats: protectedProcedure.query(async () => ({ avgScore: 88, totalReviews: 45, pendingReviews: 3 })),
  getScorecard: protectedProcedure.input(z.object({ driverId: z.string().optional(), period: z.string().optional() })).query(async () => ({ 
    safety: 94, 
    efficiency: 88, 
    compliance: 96, 
    customer: 92,
    overallScore: 92,
    driverName: "Mike Johnson",
    rank: 3,
    totalDrivers: 24,
    trend: "up",
    metrics: {
      loadsCompleted: 45,
      milesDriver: 12500,
      milesThisMonth: 12500,
      revenue: 28500,
      fuelEfficiency: 6.8,
      onTimeDelivery: 96,
      customerRating: 4.8,
      inspectionScore: 94,
      safetyEvents: 2,
      hardBraking: 3,
      speeding: 1,
      idling: 12,
    },
  })),
  getLeaderboard: protectedProcedure.input(z.object({ period: z.string().optional() }).optional()).query(async () => [{ rank: 1, driverId: "d1", name: "Mike Johnson", score: 98 }]),

  // Pre-trip
  getPreTripChecklist: protectedProcedure.query(async () => [{ id: "c1", item: "Brakes", required: true }, { id: "c2", item: "Lights", required: true }]),
  submitPreTripInspection: protectedProcedure.input(z.object({ vehicleId: z.string(), items: z.array(z.object({ itemId: z.string(), passed: z.boolean(), notes: z.string().optional() })) })).mutation(async ({ input }) => ({ success: true, inspectionId: "insp_123" })),

  // Events
  getRecentEvents: protectedProcedure.input(z.object({ driverId: z.string().optional(), limit: z.number().optional() })).query(async () => [{ id: "e1", type: "login", timestamp: "2025-01-23 10:30", description: "Driver logged in", category: "system" }]),

  // Terminations
  getTerminations: protectedProcedure.input(z.object({ status: z.string().optional() })).query(async () => [{ id: "t1", driverId: "d1", reason: "voluntary", date: "2025-01-20" }]),
  getTerminationStats: protectedProcedure.query(async () => ({ total: 25, voluntary: 18, involuntary: 7 })),
});
