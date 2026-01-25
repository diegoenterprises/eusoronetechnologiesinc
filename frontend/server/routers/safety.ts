/**
 * SAFETY ROUTER
 * tRPC procedures for safety management, incidents, and CSA scores
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const incidentTypeSchema = z.enum([
  "accident", "spill", "violation", "injury", "near_miss", "equipment_failure"
]);
const incidentSeveritySchema = z.enum(["critical", "major", "minor"]);
const incidentStatusSchema = z.enum(["reported", "investigating", "pending_review", "closed"]);

export const safetyRouter = router({
  /**
   * Get dashboard stats for SafetyDashboard
   */
  getDashboardStats: protectedProcedure
    .query(async () => {
      return {
        safetyScore: 92,
        activeDrivers: 18,
        openIncidents: 3,
        overdueItems: 2,
        pendingDrugTests: 1,
        csaAlert: false,
      };
    }),

  /**
   * Get CSA overview for SafetyDashboard
   */
  getCSAOverview: protectedProcedure
    .query(async () => {
      return {
        basics: [
          { name: "Unsafe Driving", score: 42, threshold: 65, status: "ok" },
          { name: "Hours of Service", score: 38, threshold: 65, status: "ok" },
          { name: "Driver Fitness", score: 0, threshold: 80, status: "ok" },
          { name: "Controlled Substances", score: 0, threshold: 80, status: "ok" },
          { name: "Vehicle Maintenance", score: 58, threshold: 80, status: "warning" },
          { name: "Hazmat Compliance", score: 25, threshold: 80, status: "ok" },
          { name: "Crash Indicator", score: 35, threshold: 65, status: "ok" },
        ],
        lastUpdated: new Date().toISOString(),
      };
    }),

  /**
   * Get recent incidents
   */
  getRecentIncidents: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(5) }))
    .query(async () => {
      return [
        { id: "inc_001", type: "near_miss", driver: "Tom Brown", date: "2025-01-22", severity: "minor", status: "closed" },
        { id: "inc_002", type: "violation", driver: "Bob Davis", date: "2025-01-20", severity: "minor", status: "investigating" },
      ];
    }),

  /**
   * Get top drivers by safety score
   */
  getTopDrivers: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(5) }))
    .query(async () => {
      return [
        { id: "d1", name: "Mike Johnson", score: 98, incidents: 0, inspections: 5 },
        { id: "d2", name: "Sarah Williams", score: 96, incidents: 0, inspections: 4 },
        { id: "d3", name: "Tom Brown", score: 94, incidents: 1, inspections: 3 },
        { id: "d4", name: "Lisa Chen", score: 92, incidents: 0, inspections: 2 },
        { id: "d5", name: "Bob Davis", score: 88, incidents: 1, inspections: 3 },
      ];
    }),

  /**
   * Get safety dashboard summary
   */
  getDashboardSummary: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        overallScore: 92,
        activeDirvers: 18,
        openIncidents: 3,
        overdueItems: 2,
        pendingDrugTests: 1,
        csaAlert: false,
        trends: {
          score: { current: 92, previous: 89, change: 3.4 },
          incidents: { current: 3, previous: 5, change: -40 },
        },
      };
    }),

  /**
   * Get CSA BASIC scores
   */
  getCSAScores: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        lastUpdated: new Date().toISOString(),
        carrier: {
          dotNumber: "1234567",
          name: "ABC Transport LLC",
          mcNumber: "MC-987654",
        },
        basics: [
          { name: "Unsafe Driving", score: 42, threshold: 65, percentile: 42, status: "ok", inspections: 12, violations: 3 },
          { name: "Hours of Service", score: 38, threshold: 65, percentile: 38, status: "ok", inspections: 12, violations: 2 },
          { name: "Driver Fitness", score: 0, threshold: 80, percentile: 0, status: "ok", inspections: 8, violations: 0 },
          { name: "Controlled Substances", score: 0, threshold: 80, percentile: 0, status: "ok", inspections: 8, violations: 0 },
          { name: "Vehicle Maintenance", score: 58, threshold: 80, percentile: 58, status: "warning", inspections: 15, violations: 5 },
          { name: "Hazmat Compliance", score: 25, threshold: 80, percentile: 25, status: "ok", inspections: 6, violations: 1 },
          { name: "Crash Indicator", score: 35, threshold: 65, percentile: 35, status: "ok", inspections: 3, violations: 1 },
        ],
        alerts: [
          { type: "warning", message: "Vehicle Maintenance score approaching threshold" },
        ],
      };
    }),

  /**
   * Get incidents for SafetyIncidents page
   */
  getIncidents: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.string().optional(),
      type: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const incidents = [
        { id: "i1", number: "INC-2025-0045", type: "accident", status: "investigating", date: "2025-01-22", driver: "John Smith", severity: "major" },
        { id: "i2", number: "INC-2025-0044", type: "near_miss", status: "closed", date: "2025-01-20", driver: "Sarah Williams", severity: "minor" },
        { id: "i3", number: "INC-2025-0043", type: "violation", status: "open", date: "2025-01-18", driver: "Tom Brown", severity: "moderate" },
      ];
      let filtered = incidents;
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(i => i.driver.toLowerCase().includes(q) || i.number.toLowerCase().includes(q));
      }
      if (input.status) filtered = filtered.filter(i => i.status === input.status);
      if (input.type) filtered = filtered.filter(i => i.type === input.type);
      return filtered;
    }),

  /**
   * List incidents
   */
  listIncidents: protectedProcedure
    .input(z.object({
      status: incidentStatusSchema.optional(),
      type: incidentTypeSchema.optional(),
      severity: incidentSeveritySchema.optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const incidents = [
        {
          id: "i1",
          incidentNumber: "INC-2025-0045",
          type: "accident",
          severity: "major",
          status: "investigating",
          date: "2025-01-22",
          time: "14:30",
          location: "I-45 N, Mile Marker 52, Houston, TX",
          description: "Minor collision with another vehicle at traffic light",
          driverName: "John Smith",
          vehicleNumber: "TRK-101",
          loadNumber: "LOAD-45890",
          injuries: false,
          hazmatRelease: false,
          propertyDamage: true,
          estimatedCost: 2500,
        },
        {
          id: "i2",
          incidentNumber: "INC-2025-0044",
          type: "spill",
          severity: "minor",
          status: "closed",
          date: "2025-01-20",
          time: "09:15",
          location: "Terminal A, Houston Refinery",
          description: "Small diesel spill during unloading - contained immediately",
          driverName: "Mike Johnson",
          vehicleNumber: "TRK-102",
          loadNumber: "LOAD-45885",
          injuries: false,
          hazmatRelease: true,
          propertyDamage: false,
          estimatedCost: 500,
        },
        {
          id: "i3",
          incidentNumber: "INC-2025-0043",
          type: "near_miss",
          severity: "minor",
          status: "pending_review",
          date: "2025-01-19",
          time: "16:45",
          location: "US-290 W, Austin, TX",
          description: "Vehicle cut off driver, emergency braking required",
          driverName: "Sarah Williams",
          vehicleNumber: "TRK-103",
          injuries: false,
          hazmatRelease: false,
          propertyDamage: false,
        },
      ];

      let filtered = incidents;
      if (input.status) {
        filtered = filtered.filter(i => i.status === input.status);
      }
      if (input.type) {
        filtered = filtered.filter(i => i.type === input.type);
      }
      if (input.severity) {
        filtered = filtered.filter(i => i.severity === input.severity);
      }

      return {
        incidents: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
        summary: {
          total: incidents.length,
          open: incidents.filter(i => i.status !== "closed").length,
          critical: incidents.filter(i => i.severity === "critical").length,
        },
      };
    }),

  /**
   * Get single incident
   */
  getIncident: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        incidentNumber: "INC-2025-0045",
        type: "accident",
        severity: "major",
        status: "investigating",
        date: "2025-01-22",
        time: "14:30",
        location: {
          address: "I-45 N, Mile Marker 52",
          city: "Houston",
          state: "TX",
          lat: 29.8168,
          lng: -95.3422,
        },
        description: "Minor collision with another vehicle at traffic light. No injuries.",
        driver: { id: "d1", name: "John Smith", phone: "555-0101" },
        vehicle: { id: "v1", unitNumber: "TRK-101", make: "Peterbilt", model: "579" },
        loadNumber: "LOAD-45890",
        injuries: false,
        hazmatRelease: false,
        propertyDamage: true,
        estimatedCost: 2500,
        timeline: [
          { timestamp: "2025-01-22T14:30:00", action: "Incident occurred", user: "System" },
          { timestamp: "2025-01-22T14:35:00", action: "Driver reported incident", user: "John Smith" },
          { timestamp: "2025-01-22T14:45:00", action: "Safety manager notified", user: "System" },
          { timestamp: "2025-01-22T15:00:00", action: "Investigation started", user: "Bob Safety" },
        ],
        documents: [
          { id: "doc1", name: "Scene Photos.zip", type: "photos", uploadedAt: "2025-01-22T15:30:00" },
          { id: "doc2", name: "Police Report.pdf", type: "report", uploadedAt: "2025-01-22T18:00:00" },
        ],
      };
    }),

  /**
   * Report new incident
   */
  reportIncident: protectedProcedure
    .input(z.object({
      type: incidentTypeSchema,
      severity: incidentSeveritySchema,
      date: z.string(),
      time: z.string(),
      location: z.string(),
      description: z.string(),
      driverId: z.string(),
      vehicleId: z.string(),
      loadNumber: z.string().optional(),
      injuries: z.boolean().default(false),
      hazmatRelease: z.boolean().default(false),
      propertyDamage: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const incidentNumber = `INC-2025-${String(Date.now()).slice(-4)}`;
      
      return {
        id: `i_${Date.now()}`,
        incidentNumber,
        status: "reported",
        reportedBy: ctx.user?.id,
        reportedAt: new Date().toISOString(),
      };
    }),

  /**
   * Update incident status
   */
  updateIncidentStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: incidentStatusSchema,
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        id: input.id,
        newStatus: input.status,
        updatedBy: ctx.user?.id,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get driver safety scorecards
   */
  getDriverScorecards: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ input }) => {
      return [
        {
          driverId: "d1",
          name: "Mike Johnson",
          overallScore: 95,
          rank: 1,
          metrics: {
            safetyEvents: 0,
            hardBraking: 2,
            speeding: 1,
            hosViolations: 0,
            inspectionScore: 98,
          },
          trend: "up",
          lastUpdated: new Date().toISOString(),
        },
        {
          driverId: "d2",
          name: "Sarah Williams",
          overallScore: 92,
          rank: 2,
          metrics: {
            safetyEvents: 1,
            hardBraking: 4,
            speeding: 2,
            hosViolations: 0,
            inspectionScore: 95,
          },
          trend: "stable",
          lastUpdated: new Date().toISOString(),
        },
        {
          driverId: "d3",
          name: "Tom Brown",
          overallScore: 88,
          rank: 3,
          metrics: {
            safetyEvents: 0,
            hardBraking: 6,
            speeding: 4,
            hosViolations: 1,
            inspectionScore: 90,
          },
          trend: "down",
          lastUpdated: new Date().toISOString(),
        },
      ];
    }),

  /**
   * Get drug and alcohol test records
   */
  getDrugAlcoholTests: protectedProcedure
    .input(z.object({
      driverId: z.string().optional(),
      status: z.enum(["scheduled", "completed", "pending_results"]).optional(),
    }))
    .query(async ({ input }) => {
      return [
        {
          id: "dat1",
          driverId: "d1",
          driverName: "Mike Johnson",
          testType: "random",
          testDate: "2025-01-15",
          status: "completed",
          result: "negative",
          facility: "LabCorp Houston",
        },
        {
          id: "dat2",
          driverId: "d2",
          driverName: "Sarah Williams",
          testType: "pre_employment",
          testDate: "2025-01-20",
          status: "pending_results",
          facility: "Quest Diagnostics Dallas",
        },
        {
          id: "dat3",
          driverId: "d3",
          driverName: "Tom Brown",
          testType: "random",
          testDate: "2025-01-25",
          status: "scheduled",
          facility: "LabCorp Austin",
        },
      ];
    }),

  /**
   * Get incidents with search/filter for SafetyIncidents page (detailed version)
   */
  getIncidentsDetailed: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.string().optional(),
      type: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const incidents = [
        {
          id: "inc1",
          type: "accident",
          severity: "major",
          status: "investigating",
          description: "Minor collision with another vehicle at I-45 intersection",
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          driver: "John Smith",
          vehicle: "Unit 2847",
          location: "Houston, TX",
        },
        {
          id: "inc2",
          type: "spill",
          severity: "critical",
          status: "open",
          description: "Diesel fuel spill during unloading at Terminal B - 50 gallons",
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          driver: "Mike Johnson",
          vehicle: "Unit 1923",
          location: "Beaumont Terminal",
        },
        {
          id: "inc3",
          type: "injury",
          severity: "minor",
          status: "closed",
          description: "Driver minor back strain during loading operations",
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          driver: "Sarah Williams",
          vehicle: null,
          location: "Houston Terminal",
        },
        {
          id: "inc4",
          type: "equipment",
          severity: "minor",
          status: "resolved",
          description: "Tanker valve malfunction - repaired on-site",
          date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          driver: "Tom Brown",
          vehicle: "Unit 3456",
          location: "Dallas, TX",
        },
        {
          id: "inc5",
          type: "near_miss",
          severity: "minor",
          status: "closed",
          description: "Vehicle cut off driver, emergency braking prevented collision",
          date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          driver: "Lisa Chen",
          vehicle: "Unit 2156",
          location: "Austin, TX",
        },
      ];

      let filtered = incidents;
      if (input.search) {
        const s = input.search.toLowerCase();
        filtered = filtered.filter(i => 
          i.description.toLowerCase().includes(s) ||
          i.driver?.toLowerCase().includes(s) ||
          i.location?.toLowerCase().includes(s)
        );
      }
      if (input.status) {
        filtered = filtered.filter(i => i.status === input.status);
      }
      if (input.type) {
        filtered = filtered.filter(i => i.type === input.type);
      }

      return filtered;
    }),

  /**
   * Get incident statistics for SafetyIncidents page
   */
  getIncidentStats: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        open: 2,
        investigating: 1,
        thisMonth: 5,
        resolved: 12,
        daysWithoutIncident: 8,
        yearToDate: 23,
      };
    }),

  /**
   * Close an incident
   */
  closeIncident: protectedProcedure
    .input(z.object({
      id: z.string(),
      resolution: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        id: input.id,
        closedAt: new Date().toISOString(),
        closedBy: ctx.user?.id,
      };
    }),

  /**
   * Get safety metrics for SafetyMetrics page
   */
  getMetrics: protectedProcedure
    .input(z.object({
      timeframe: z.string().default("30d"),
    }))
    .query(async ({ ctx, input }) => {
      return {
        overallScore: 92,
        scoreTrend: 3.5,
        activeDrivers: 18,
        driversInCompliance: 16,
        openIncidents: 3,
        incidentsThisMonth: 5,
        daysWithoutIncident: 8,
        recordDays: 45,
        goals: [
          { name: "Zero Accidents", target: 0, current: 1, progress: 90, achieved: false },
          { name: "CSA Score < 50%", target: 50, current: 42, progress: 100, achieved: true },
          { name: "Training Completion", target: 100, current: 95, progress: 95, achieved: false },
          { name: "Inspection Pass Rate", target: 95, current: 97, progress: 100, achieved: true },
        ],
      };
    }),

  /**
   * Get safety trends for SafetyMetrics page
   */
  getTrends: protectedProcedure
    .input(z.object({
      timeframe: z.string().default("30d"),
    }))
    .query(async ({ ctx, input }) => {
      return [
        { metric: "Incidents", current: 3, previous: 5, change: -40, positive: true },
        { metric: "Near Misses", current: 2, previous: 4, change: -50, positive: true },
        { metric: "Inspection Pass Rate", current: 97, previous: 94, change: 3.2, positive: true },
        { metric: "Training Completion", current: 95, previous: 88, change: 8, positive: true },
        { metric: "HOS Violations", current: 1, previous: 2, change: -50, positive: true },
      ];
    }),

  /**
   * Get vehicle inspections
   */
  getVehicleInspections: protectedProcedure
    .input(z.object({
      vehicleId: z.string().optional(),
      status: z.string().optional(),
      type: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const inspections = [
        {
          id: "vi1",
          vehicleId: "v1",
          vehicleNumber: "Unit 2847",
          type: "pre_trip",
          status: "passed",
          date: new Date().toISOString(),
          inspector: "Mike Johnson",
          defects: [],
          nextDue: null,
        },
        {
          id: "vi2",
          vehicleId: "v2",
          vehicleNumber: "Unit 1923",
          type: "dot_annual",
          status: "passed",
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          inspector: "Third Party Inspector",
          defects: [],
          nextDue: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "vi3",
          vehicleId: "v3",
          vehicleNumber: "Unit 3456",
          type: "tank_test",
          status: "due",
          date: null,
          inspector: null,
          defects: [],
          nextDue: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      let filtered = inspections;
      if (input.vehicleId) {
        filtered = filtered.filter(i => i.vehicleId === input.vehicleId);
      }
      if (input.status) {
        filtered = filtered.filter(i => i.status === input.status);
      }
      if (input.type) {
        filtered = filtered.filter(i => i.type === input.type);
      }

      return filtered;
    }),

  /**
   * Submit vehicle inspection
   */
  submitInspection: protectedProcedure
    .input(z.object({
      vehicleId: z.string(),
      type: z.enum(["pre_trip", "post_trip", "dot_annual", "tank_test", "hazmat"]),
      passed: z.boolean(),
      defects: z.array(z.object({
        category: z.string(),
        description: z.string(),
        severity: z.enum(["minor", "major", "out_of_service"]),
      })).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        id: `vi_${Date.now()}`,
        vehicleId: input.vehicleId,
        status: input.passed ? "passed" : "failed",
        submittedAt: new Date().toISOString(),
        submittedBy: ctx.user?.id,
      };
    }),
});
