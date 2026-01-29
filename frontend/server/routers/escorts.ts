/**
 * ESCORTS ROUTER
 * tRPC procedures for escort/pilot car operations
 * Based on 06_ESCORT_USER_JOURNEY.md
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const jobStatusSchema = z.enum(["available", "assigned", "in_progress", "completed", "cancelled"]);
const positionSchema = z.enum(["lead", "chase", "both"]);

export const escortsRouter = router({
  /**
   * Get escort dashboard stats
   */
  getDashboardStats: protectedProcedure
    .query(async () => {
      return {
        activeJobs: 2,
        upcomingJobs: 5,
        completedThisMonth: 18,
        monthlyEarnings: 8450,
        rating: 4.9, upcoming: 5, completed: 18, earnings: 8450,
      };
    }),

  /**
   * Get active jobs
   */
  getActiveJobs: protectedProcedure
    .query(async () => {
      return [
        {
          id: "job_active_001",
          title: "Oversize Load Escort - I-45 Corridor",
          carrier: "Heavy Haul Specialists",
          position: "lead",
          status: "in_progress",
          currentLocation: "Corsicana, TX",
          destination: "Dallas, TX",
          eta: "2 hours",
          pay: 650,
        },
      ];
    }),

  /**
   * Get upcoming jobs
   */
  getUpcomingJobs: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(5) }))
    .query(async () => {
      return [
        {
          id: "job_upcoming_001",
          title: "Superload Escort - Port Arthur to Austin",
          carrier: "ABC Transport",
          position: "both",
          startDate: "2025-01-26",
          estimatedDuration: "12 hours",
          pay: 1200,
        },
        {
          id: "job_upcoming_002",
          title: "Wind Turbine Blade - Corpus Christi",
          carrier: "Wind Energy Logistics",
          position: "chase",
          startDate: "2025-01-27",
          estimatedDuration: "6 hours",
          pay: 450,
        },
      ];
    }),

  /**
   * Get available jobs for EscortJobMarketplace
   */
  getAvailableJobs: protectedProcedure
    .input(z.object({ filter: z.string().optional(), search: z.string().optional() }))
    .query(async ({ input }) => {
      const jobs = [
        { id: "j1", title: "Oversize Load I-45", carrier: "Heavy Haul", position: "lead", pay: 650, urgency: "normal", startDate: "2025-01-26" },
        { id: "j2", title: "Superload Port Arthur", carrier: "ABC Transport", position: "both", pay: 1200, urgency: "high", startDate: "2025-01-26" },
        { id: "j3", title: "Wind Turbine Blade", carrier: "Wind Energy", position: "chase", pay: 450, urgency: "normal", startDate: "2025-01-27" },
      ];
      let filtered = jobs;
      if (input.filter && input.filter !== "all") filtered = filtered.filter(j => j.urgency === input.filter);
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(j => j.title.toLowerCase().includes(q) || j.carrier.toLowerCase().includes(q));
      }
      return filtered;
    }),

  /**
   * Get marketplace stats for EscortJobMarketplace
   */
  getMarketplaceStats: protectedProcedure
    .query(async () => {
      return { availableJobs: 12, urgentJobs: 3, avgPay: 580, newThisWeek: 8, available: 12, urgent: 3, avgRate: 580, myApplications: 2 };
    }),

  /**
   * Apply for job mutation
   */
  applyForJob: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, jobId: input.jobId, appliedAt: new Date().toISOString() };
    }),

  /**
   * Get certification status
   */
  getCertificationStatus: protectedProcedure
    .query(async () => {
      return {
        total: 12,
        valid: 10,
        expiringSoon: 2,
        expired: 0,
        states: [
          { code: "TX", name: "Texas", status: "active", expirationDate: "2025-12-15" },
          { code: "OK", name: "Oklahoma", status: "active", expirationDate: "2025-08-20" },
          { code: "LA", name: "Louisiana", status: "expiring", expirationDate: "2025-02-15" },
          { code: "AR", name: "Arkansas", status: "expiring", expirationDate: "2025-02-28" },
        ],
        certifications: [
          { state: "TX", status: "valid", expiresAt: "2025-12-15" },
          { state: "OK", status: "valid", expiresAt: "2025-08-20" },
          { state: "LA", status: "expiring", expiresAt: "2025-02-15" },
          { state: "AR", status: "expiring", expiresAt: "2025-02-28" },
        ],
      };
    }),

  /**
   * Get active convoys for ActiveConvoys page
   */
  getActiveConvoys: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ input }) => {
      const convoys = [
        { id: "conv_001", name: "Superload #78", status: "in_progress", origin: "Houston, TX", destination: "Dallas, TX", escorts: 2, eta: "2h 30m", progress: 65 },
        { id: "conv_002", name: "Wind Blade #45", status: "staging", origin: "Port Arthur, TX", destination: "Austin, TX", escorts: 2, eta: "4h", progress: 0 },
        { id: "conv_003", name: "Heavy Equipment #12", status: "in_progress", origin: "Beaumont, TX", destination: "San Antonio, TX", escorts: 1, eta: "5h", progress: 25 },
      ];
      if (input.search) {
        const q = input.search.toLowerCase();
        return convoys.filter(c => c.name.toLowerCase().includes(q) || c.origin.toLowerCase().includes(q));
      }
      return convoys;
    }),

  /**
   * Get convoy stats for ActiveConvoys page
   */
  getConvoyStats: protectedProcedure
    .query(async () => {
      return {
        activeConvoys: 3,
        escortsDeployed: 5,
        completedToday: 2,
        scheduledToday: 4,
      };
    }),

  /**
   * Get escort dashboard summary
   */
  getDashboardSummary: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        activeJobs: 2,
        upcomingJobs: 5,
        completedThisMonth: 18,
        monthlyEarnings: 8450,
        rating: 4.9, upcoming: 5, completed: 18, earnings: 8450,
        certifications: {
          total: 12,
          expiringSoon: 2,
        },
      };
    }),

  /**
   * Get available jobs (marketplace) - detailed version
   */
  getAvailableJobsDetailed: protectedProcedure
    .input(z.object({
      state: z.string().optional(),
      position: positionSchema.optional(),
      startDate: z.string().optional(),
      minPay: z.number().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const jobs = [
        {
          id: "job_001",
          title: "Oversize Load Escort - Houston to Dallas",
          carrier: "Heavy Haul Specialists",
          origin: { city: "Houston", state: "TX" },
          destination: { city: "Dallas", state: "TX" },
          startDate: "2025-01-25",
          estimatedDuration: "8 hours",
          position: "lead",
          pay: 650,
          loadDetails: {
            type: "Wind Turbine Blade",
            dimensions: "180' L x 14' W x 16' H",
            weight: "95,000 lbs",
          },
          urgency: "normal",
          postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "job_002",
          title: "Superload Escort - Port Arthur to Austin",
          carrier: "ABC Transport",
          origin: { city: "Port Arthur", state: "TX" },
          destination: { city: "Austin", state: "TX" },
          startDate: "2025-01-26",
          estimatedDuration: "12 hours",
          position: "both",
          pay: 1200,
          loadDetails: {
            type: "Industrial Transformer",
            dimensions: "45' L x 18' W x 18' H",
            weight: "250,000 lbs",
          },
          urgency: "high",
          postedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
          id: "job_003",
          title: "Wide Load Escort - San Antonio to El Paso",
          carrier: "Southwest Heavy Transport",
          origin: { city: "San Antonio", state: "TX" },
          destination: { city: "El Paso", state: "TX" },
          startDate: "2025-01-27",
          estimatedDuration: "10 hours",
          position: "chase",
          pay: 800,
          loadDetails: {
            type: "Modular Building Section",
            dimensions: "60' L x 16' W x 14' H",
            weight: "78,000 lbs",
          },
          urgency: "normal",
          postedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        },
      ];

      let filtered = jobs;
      if (input.state) {
        filtered = filtered.filter(j => 
          j.origin.state === input.state || j.destination.state === input.state
        );
      }
      if (input.position) {
        filtered = filtered.filter(j => j.position === input.position || j.position === "both");
      }
      if (input.minPay !== undefined) {
        const minPayValue = input.minPay;
        filtered = filtered.filter(j => j.pay >= minPayValue);
      }

      return {
        jobs: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
      };
    }),

  /**
   * Get my jobs (assigned to me)
   */
  getMyJobs: protectedProcedure
    .input(z.object({
      status: jobStatusSchema.optional(),
    }))
    .query(async ({ ctx, input }) => {
      const jobs = [
        {
          id: "myjob_001",
          title: "Oversize Load Escort - Beaumont to Houston",
          carrier: "Gulf Coast Transport",
          status: "in_progress",
          startDate: "2025-01-23",
          position: "lead",
          pay: 450,
          currentLocation: { lat: 29.95, lng: -94.05 },
          eta: "2 hours",
        },
        {
          id: "myjob_002",
          title: "Wide Load Escort - Houston to Corpus Christi",
          carrier: "ABC Transport",
          status: "assigned",
          startDate: "2025-01-24",
          position: "chase",
          pay: 550,
        },
      ];

      let filtered = jobs;
      if (input.status) {
        filtered = filtered.filter(j => j.status === input.status);
      }

      return jobs;
    }),

  /**
   * Apply for job (detailed version)
   */
  applyForJobDetailed: protectedProcedure
    .input(z.object({
      jobId: z.string(),
      position: positionSchema,
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        applicationId: `app_${Date.now()}`,
        jobId: input.jobId,
        status: "pending",
        appliedAt: new Date().toISOString(),
      };
    }),

  /**
   * Update job status
   */
  updateJobStatus: protectedProcedure
    .input(z.object({
      jobId: z.string(),
      status: jobStatusSchema,
      notes: z.string().optional(),
      location: z.object({
        lat: z.number(),
        lng: z.number(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        jobId: input.jobId,
        newStatus: input.status,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get certifications
   */
  getCertifications: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          id: "cert_001",
          state: "TX",
          type: "Pilot/Escort Vehicle Operator",
          issueDate: "2024-03-15",
          expirationDate: "2026-03-15",
          status: "valid",
          certNumber: "TX-PEV-12345",
        },
        {
          id: "cert_002",
          state: "LA",
          type: "Oversize Load Escort",
          issueDate: "2024-06-01",
          expirationDate: "2025-06-01",
          status: "valid",
          certNumber: "LA-OLE-67890",
          reciprocity: ["MS", "AR"],
        },
        {
          id: "cert_003",
          state: "OK",
          type: "Pilot Car Operator",
          issueDate: "2023-09-01",
          expirationDate: "2025-02-01",
          status: "expiring_soon",
          certNumber: "OK-PCO-11111",
        },
      ];
    }),

  /**
   * Get earnings history
   */
  getEarningsHistory: protectedProcedure
    .input(z.object({
      period: z.enum(["week", "month", "quarter", "year"]).default("month"),
    }))
    .query(async ({ input }) => {
      return {
        period: input.period,
        totalEarnings: 8450,
        jobCount: 18,
        avgPerJob: 469.44,
        breakdown: [
          { week: "Jan 1-7", earnings: 1850, jobs: 4 },
          { week: "Jan 8-14", earnings: 2100, jobs: 5 },
          { week: "Jan 15-21", earnings: 2250, jobs: 5 },
          { week: "Jan 22-28", earnings: 2250, jobs: 4 },
        ],
      };
    }),

  /**
   * Get job details
   */
  getJobDetails: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.jobId,
        title: "Superload Escort - Port Arthur to Austin",
        carrier: {
          name: "ABC Transport",
          contact: "John Dispatcher",
          phone: "555-0101",
        },
        origin: { city: "Port Arthur", state: "TX", address: "1234 Refinery Rd" },
        destination: { city: "Austin", state: "TX", address: "5678 Industrial Blvd" },
        route: {
          distance: 280,
          estimatedTime: "12 hours",
          restrictions: ["No travel after dark", "Avoid downtown areas"],
          permits: ["TX Superload Permit #SL-2025-0045"],
        },
        load: {
          type: "Industrial Transformer",
          dimensions: "45' L x 18' W x 18' H",
          weight: "250,000 lbs",
          hazmat: false,
        },
        requirements: {
          position: "both",
          equipment: ["Height pole", "Wide load signs", "Two-way radio"],
          certifications: ["TX Pilot/Escort"],
        },
        pay: 1200,
        startDate: "2025-01-26",
        startTime: "06:00",
      };
    }),

  /**
   * Submit location update
   */
  submitLocationUpdate: protectedProcedure
    .input(z.object({
      jobId: z.string(),
      location: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
      heading: z.number().optional(),
      speed: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        timestamp: new Date().toISOString(),
      };
    }),

  /**
   * Get permits for EscortPermits page
   */
  getPermits: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          id: "permit1",
          state: "Texas",
          permitNumber: "TX-ESC-2024-45678",
          status: "active",
          issuedDate: "2024-03-15",
          expirationDate: "2026-03-15",
          reciprocityStates: ["OK", "LA", "NM", "AR"],
        },
        {
          id: "permit2",
          state: "Louisiana",
          permitNumber: "LA-PCV-2024-12345",
          status: "active",
          issuedDate: "2024-06-01",
          expirationDate: "2025-06-01",
          reciprocityStates: ["TX", "MS", "AR"],
        },
        {
          id: "permit3",
          state: "Oklahoma",
          permitNumber: "OK-PCO-2023-98765",
          status: "expiring_soon",
          issuedDate: "2023-09-01",
          expirationDate: "2025-02-15",
          reciprocityStates: ["TX", "KS"],
        },
        {
          id: "permit4",
          state: "New Mexico",
          permitNumber: "NM-ESC-2024-11111",
          status: "active",
          issuedDate: "2024-08-15",
          expirationDate: "2025-08-15",
          reciprocityStates: ["TX", "AZ", "CO"],
        },
      ];
    }),

  /**
   * Get permit statistics
   */
  getPermitStats: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        activePermits: 4,
        expiringSoon: 1,
        statesCovered: 8,
        certifications: 5,
      };
    }),

  /**
   * Renew permit
   */
  renewPermit: protectedProcedure
    .input(z.object({
      permitId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        permitId: input.permitId,
        renewalSubmittedAt: new Date().toISOString(),
        status: "pending_renewal",
      };
    }),

  /**
   * Get schedule for EscortSchedule page
   */
  getSchedule: protectedProcedure
    .input(z.object({ date: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return [
        {
          id: "sched1",
          convoyName: "Wind Turbine Transport #45",
          status: "confirmed",
          position: "lead",
          loadDescription: "180ft wind turbine blade from Houston to Dallas",
          startTime: "06:00 AM",
          endTime: "06:00 PM",
          origin: "Houston, TX",
          destination: "Dallas, TX",
          miles: 238,
          rate: 850,
          rateType: "flat rate",
          specialRequirements: "Height pole required",
        },
        {
          id: "sched2",
          convoyName: "Industrial Equipment Move",
          status: "pending",
          position: "chase",
          loadDescription: "45ft industrial transformer to Austin facility",
          startTime: "07:00 PM",
          endTime: "11:00 PM",
          origin: "Houston, TX",
          destination: "Austin, TX",
          miles: 162,
          rate: 450,
          rateType: "flat rate",
          specialRequirements: null,
        },
      ];
    }),

  /**
   * Get availability settings
   */
  getAvailability: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        { dayOfWeek: 0, dayName: "Sunday", available: false },
        { dayOfWeek: 1, dayName: "Monday", available: true },
        { dayOfWeek: 2, dayName: "Tuesday", available: true },
        { dayOfWeek: 3, dayName: "Wednesday", available: true },
        { dayOfWeek: 4, dayName: "Thursday", available: true },
        { dayOfWeek: 5, dayName: "Friday", available: true },
        { dayOfWeek: 6, dayName: "Saturday", available: true },
      ];
    }),

  /**
   * Update availability
   */
  updateAvailability: protectedProcedure
    .input(z.object({
      dayOfWeek: z.number(),
      available: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        dayOfWeek: input.dayOfWeek,
        available: input.available,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get upcoming jobs (legacy version)
   */
  getUpcomingJobsLegacy: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          id: "up1",
          convoyName: "Superload #78",
          position: "both",
          date: "Jan 25",
          route: "Port Arthur to Austin",
          rate: 1200,
          miles: 280,
        },
        {
          id: "up2",
          convoyName: "Wide Load #92",
          position: "lead",
          date: "Jan 26",
          route: "San Antonio to El Paso",
          rate: 950,
          miles: 550,
        },
        {
          id: "up3",
          convoyName: "Oversized #105",
          position: "chase",
          date: "Jan 27",
          route: "Dallas to Oklahoma City",
          rate: 650,
          miles: 210,
        },
      ];
    }),

  // Jobs
  acceptJob: protectedProcedure.input(z.object({ jobId: z.string() })).mutation(async ({ input }) => ({ success: true, jobId: input.jobId })),
  getJobs: protectedProcedure.input(z.object({ status: z.string().optional(), limit: z.number().optional() }).optional()).query(async () => [{ id: "j1", convoyName: "Oversized #101", status: "available", rate: 750, date: "2025-01-25" }]),
  getJobsSummary: protectedProcedure.query(async () => ({ available: 15, accepted: 3, completed: 120, totalEarnings: 85000, assigned: 5, inProgress: 2, weeklyEarnings: 3500 })),
  getCompletedJobs: protectedProcedure.input(z.object({ limit: z.number().optional(), period: z.string().optional() })).query(async () => [{ id: "j1", convoyName: "Oversized #99", earnings: 750, completedAt: "2025-01-20" }]),

  // Certifications
  getMyCertifications: protectedProcedure.query(async () => [{ id: "c1", state: "TX", type: "pilot_car", expiration: "2026-06-15", status: "valid" }]),
  getCertificationStats: protectedProcedure.input(z.object({ escortId: z.string().optional() }).optional()).query(async () => ({ total: 8, valid: 7, expiring: 1, expired: 0, statesCovered: 12, reciprocity: 8 })),
  getStateCertifications: protectedProcedure.input(z.object({ escortId: z.string().optional() }).optional()).query(async () => [
    { state: "TX", status: "valid", expiresAt: "2025-12-31", requirements: ["Background check", "Training certificate"] },
    { state: "OK", status: "valid", expiresAt: "2025-10-15", requirements: ["State permit", "Insurance proof"] },
    { state: "LA", status: "expiring", expiresAt: "2025-02-28", requirements: ["State license", "Vehicle inspection"] },
  ]),
  uploadCertification: protectedProcedure.input(z.object({ state: z.string(), type: z.string(), expirationDate: z.string() })).mutation(async ({ input }) => ({ success: true, certId: "cert_123" })),
  getStateRequirements: protectedProcedure.input(z.object({ state: z.string().optional() }).optional()).query(async ({ input }) => { const reqs = [{ label: "Valid driver license", value: "required" }, { label: "Insurance", value: "required" }, { label: "Flags and signs", value: "required" }] as any; reqs.state = input.state; reqs.requirements = ["Valid driver license", "Insurance", "Flags and signs"]; return reqs; }),

  // Earnings
  getEarnings: protectedProcedure.input(z.object({ period: z.string().optional(), limit: z.number().optional() })).query(async () => ({ items: [{ id: "e1", jobId: "j1", amount: 750, date: "2025-01-20" }], total: 85000, trend: "up", trendPercent: 12.5 })),
  getEarningsStats: protectedProcedure.input(z.object({ period: z.string().optional() }).optional()).query(async () => ({ thisWeek: 1500, thisMonth: 6500, thisYear: 85000, avgPerJob: 650, jobsCompleted: 130, hoursWorked: 520, avgHourlyRate: 163.46 })),

  // Incidents & Reports
  getIncidents: protectedProcedure.input(z.object({ status: z.string().optional(), search: z.string().optional(), severity: z.string().optional() })).query(async () => [{ id: "inc1", jobId: "j1", type: "near_miss", status: "reported", date: "2025-01-18" }]),
  getIncidentStats: protectedProcedure.query(async () => ({ total: 5, open: 1, resolved: 4, critical: 0 })),
  getReports: protectedProcedure.input(z.object({ type: z.string().optional(), search: z.string().optional(), status: z.string().optional() })).query(async () => [{ id: "r1", type: "trip_report", jobId: "j1", date: "2025-01-20" }]),
  getReportStats: protectedProcedure.query(async () => ({ total: 120, thisMonth: 15, submitted: 110, drafts: 10 })),

});
