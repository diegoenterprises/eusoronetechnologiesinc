/**
 * INCIDENTS ROUTER
 * tRPC procedures for incident reporting and management
 * Based on 09_SAFETY_MANAGER_USER_JOURNEY.md
 */

import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { incidents } from "../../drizzle/schema";

const incidentTypeSchema = z.enum([
  "accident", "spill", "violation", "injury", "near_miss", "equipment_failure", "theft", "other"
]);
const incidentSeveritySchema = z.enum(["critical", "major", "minor"]);
const incidentStatusSchema = z.enum(["reported", "investigating", "pending_review", "closed", "reopened"]);

export const incidentsRouter = router({
  /**
   * List all incidents
   */
  list: protectedProcedure
    .input(z.object({
      status: incidentStatusSchema.optional(),
      type: incidentTypeSchema.optional(),
      severity: incidentSeveritySchema.optional(),
      driverId: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const incidents = [
        {
          id: "inc_001",
          incidentNumber: "INC-2025-0045",
          type: "accident",
          severity: "major",
          status: "investigating",
          date: "2025-01-22",
          time: "14:30",
          location: "I-45 N, Mile Marker 52, Houston, TX",
          description: "Minor collision with another vehicle at traffic light",
          driverId: "d1",
          driverName: "John Smith",
          vehicleNumber: "TRK-101",
          loadNumber: "LOAD-45890",
          injuries: false,
          hazmatRelease: false,
          propertyDamage: true,
          estimatedCost: 2500,
          reportedBy: "John Smith",
          reportedAt: "2025-01-22T14:35:00Z",
        },
        {
          id: "inc_002",
          incidentNumber: "INC-2025-0044",
          type: "spill",
          severity: "minor",
          status: "closed",
          date: "2025-01-20",
          time: "09:15",
          location: "Terminal A, Houston Refinery",
          description: "Small diesel spill during unloading - contained immediately",
          driverId: "d2",
          driverName: "Mike Johnson",
          vehicleNumber: "TRK-102",
          loadNumber: "LOAD-45885",
          injuries: false,
          hazmatRelease: true,
          propertyDamage: false,
          estimatedCost: 500,
          reportedBy: "Mike Johnson",
          reportedAt: "2025-01-20T09:20:00Z",
        },
        {
          id: "inc_003",
          incidentNumber: "INC-2025-0043",
          type: "near_miss",
          severity: "minor",
          status: "pending_review",
          date: "2025-01-19",
          time: "16:45",
          location: "US-290 W, Austin, TX",
          description: "Vehicle cut off driver, emergency braking required",
          driverId: "d3",
          driverName: "Sarah Williams",
          vehicleNumber: "TRK-103",
          injuries: false,
          hazmatRelease: false,
          propertyDamage: false,
          reportedBy: "Sarah Williams",
          reportedAt: "2025-01-19T17:00:00Z",
        },
      ];

      let filtered = incidents;
      if (input.status) filtered = filtered.filter(i => i.status === input.status);
      if (input.type) filtered = filtered.filter(i => i.type === input.type);
      if (input.severity) filtered = filtered.filter(i => i.severity === input.severity);
      if (input.driverId) filtered = filtered.filter(i => i.driverId === input.driverId);

      return {
        incidents: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
        summary: {
          total: incidents.length,
          open: incidents.filter(i => i.status !== "closed").length,
          critical: incidents.filter(i => i.severity === "critical").length,
          thisMonth: incidents.length,
        },
      };
    }),

  /**
   * Get incident by ID
   */
  getById: protectedProcedure
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
        description: "Minor collision with another vehicle at traffic light. The other vehicle ran a red light and struck the front bumper of our truck. No injuries reported. Police report filed.",
        driver: { id: "d1", name: "John Smith", phone: "555-0101" },
        vehicle: { id: "v1", unitNumber: "TRK-101", make: "Peterbilt", model: "579" },
        loadNumber: "LOAD-45890",
        injuries: false,
        injuryDetails: null,
        hazmatRelease: false,
        hazmatDetails: null,
        propertyDamage: true,
        propertyDamageDetails: "Front bumper damage, headlight broken",
        estimatedCost: 2500,
        otherParties: [
          { name: "Jane Doe", vehicle: "2022 Toyota Camry", insurance: "State Farm", contact: "555-0199" },
        ],
        witnesses: [
          { name: "Bob Observer", phone: "555-0188", statement: "The red car ran the light" },
        ],
        policeReport: {
          filed: true,
          reportNumber: "HPD-2025-123456",
          officer: "Officer Johnson",
          department: "Houston PD",
        },
        timeline: [
          { timestamp: "2025-01-22T14:30:00Z", action: "Incident occurred", user: "System" },
          { timestamp: "2025-01-22T14:35:00Z", action: "Driver reported incident", user: "John Smith" },
          { timestamp: "2025-01-22T14:45:00Z", action: "Safety manager notified", user: "System" },
          { timestamp: "2025-01-22T15:00:00Z", action: "Investigation started", user: "Bob Safety" },
          { timestamp: "2025-01-22T16:30:00Z", action: "Police report obtained", user: "Bob Safety" },
        ],
        documents: [
          { id: "doc1", name: "Scene Photos.zip", type: "photos", uploadedAt: "2025-01-22T15:30:00Z" },
          { id: "doc2", name: "Police Report.pdf", type: "report", uploadedAt: "2025-01-22T18:00:00Z" },
          { id: "doc3", name: "Driver Statement.pdf", type: "statement", uploadedAt: "2025-01-22T15:00:00Z" },
        ],
        investigation: {
          assignedTo: { id: "u5", name: "Bob Safety" },
          startedAt: "2025-01-22T15:00:00Z",
          findings: "Preliminary investigation shows other party at fault. Awaiting insurance determination.",
          rootCause: null,
          correctiveActions: [],
        },
        reportedBy: "John Smith",
        reportedAt: "2025-01-22T14:35:00Z",
      };
    }),

  /**
   * Report new incident
   */
  report: protectedProcedure
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
      injuryDetails: z.string().optional(),
      hazmatRelease: z.boolean().default(false),
      hazmatDetails: z.string().optional(),
      propertyDamage: z.boolean().default(false),
      propertyDamageDetails: z.string().optional(),
      estimatedCost: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const incidentNumber = `INC-2025-${String(Date.now()).slice(-4)}`;
      
      return {
        id: `inc_${Date.now()}`,
        incidentNumber,
        status: "reported",
        reportedBy: ctx.user?.id,
        reportedAt: new Date().toISOString(),
      };
    }),

  /**
   * Update incident status
   */
  updateStatus: protectedProcedure
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
   * Add investigation note
   */
  addNote: protectedProcedure
    .input(z.object({
      incidentId: z.string(),
      note: z.string(),
      isInternal: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `note_${Date.now()}`,
        incidentId: input.incidentId,
        note: input.note,
        createdBy: ctx.user?.id,
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Add corrective action
   */
  addCorrectiveAction: protectedProcedure
    .input(z.object({
      incidentId: z.string(),
      action: z.string(),
      assignedTo: z.string(),
      dueDate: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `ca_${Date.now()}`,
        incidentId: input.incidentId,
        action: input.action,
        status: "pending",
        createdBy: ctx.user?.id,
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Upload incident document
   */
  uploadDocument: protectedProcedure
    .input(z.object({
      incidentId: z.string(),
      documentName: z.string(),
      documentType: z.enum(["photos", "report", "statement", "other"]),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `doc_${Date.now()}`,
        incidentId: input.incidentId,
        name: input.documentName,
        type: input.documentType,
        uploadedBy: ctx.user?.id,
        uploadedAt: new Date().toISOString(),
        uploadUrl: `/api/incidents/${input.incidentId}/upload`,
      };
    }),

  /**
   * Get incident statistics
   */
  getStatistics: protectedProcedure
    .input(z.object({
      period: z.enum(["month", "quarter", "year"]).default("month"),
    }))
    .query(async ({ input }) => {
      return {
        period: input.period,
        total: 12,
        byType: {
          accident: 3,
          spill: 2,
          violation: 1,
          injury: 0,
          near_miss: 5,
          equipment_failure: 1,
        },
        bySeverity: {
          critical: 0,
          major: 3,
          minor: 9,
        },
        byStatus: {
          reported: 1,
          investigating: 2,
          pending_review: 3,
          closed: 6,
        },
        trends: {
          vsLastPeriod: -25,
          direction: "down" as const,
        },
        costImpact: {
          total: 15500,
          avgPerIncident: 1291.67,
        },
      };
    }),

  /**
   * Close incident
   */
  close: protectedProcedure
    .input(z.object({
      id: z.string(),
      resolution: z.string(),
      rootCause: z.string().optional(),
      preventiveMeasures: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        id: input.id,
        closedBy: ctx.user?.id,
        closedAt: new Date().toISOString(),
      };
    }),
});
