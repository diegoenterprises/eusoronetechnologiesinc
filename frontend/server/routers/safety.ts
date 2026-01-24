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
});
