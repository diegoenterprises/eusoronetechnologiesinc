/**
 * CERTIFICATIONS ROUTER
 * tRPC procedures for driver and company certifications
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const certTypeSchema = z.enum([
  "cdl", "hazmat", "tanker", "doubles_triples", "passenger", "school_bus",
  "medical_card", "twic", "fast_card", "tsa", "osha", "first_aid", "defensive_driving"
]);
const certStatusSchema = z.enum(["active", "expiring_soon", "expired", "pending", "suspended"]);

export const certificationsRouter = router({
  /**
   * List certifications
   */
  list: protectedProcedure
    .input(z.object({
      entityType: z.enum(["driver", "company", "vehicle"]).optional(),
      entityId: z.string().optional(),
      type: certTypeSchema.optional(),
      status: certStatusSchema.optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const certifications = [
        {
          id: "cert_001",
          type: "cdl",
          name: "Commercial Driver's License - Class A",
          entityType: "driver",
          entityId: "d1",
          entityName: "Mike Johnson",
          number: "TX-12345678",
          issuedBy: "Texas DPS",
          issuedDate: "2022-03-15",
          expiresAt: "2026-03-15",
          status: "active",
          endorsements: ["H", "N", "T"],
        },
        {
          id: "cert_002",
          type: "hazmat",
          name: "Hazmat Endorsement",
          entityType: "driver",
          entityId: "d1",
          entityName: "Mike Johnson",
          number: "HM-12345",
          issuedBy: "TSA",
          issuedDate: "2023-06-01",
          expiresAt: "2025-06-01",
          status: "expiring_soon",
          daysRemaining: 129,
        },
        {
          id: "cert_003",
          type: "medical_card",
          name: "DOT Medical Certificate",
          entityType: "driver",
          entityId: "d1",
          entityName: "Mike Johnson",
          number: "MED-2024-12345",
          issuedBy: "Dr. Smith Medical",
          issuedDate: "2024-01-15",
          expiresAt: "2026-01-15",
          status: "active",
        },
        {
          id: "cert_004",
          type: "twic",
          name: "TWIC Card",
          entityType: "driver",
          entityId: "d1",
          entityName: "Mike Johnson",
          number: "TWIC-87654321",
          issuedBy: "TSA",
          issuedDate: "2023-09-01",
          expiresAt: "2028-09-01",
          status: "active",
        },
      ];

      let filtered = certifications;
      if (input.entityType) filtered = filtered.filter(c => c.entityType === input.entityType);
      if (input.entityId) filtered = filtered.filter(c => c.entityId === input.entityId);
      if (input.type) filtered = filtered.filter(c => c.type === input.type);
      if (input.status) filtered = filtered.filter(c => c.status === input.status);

      return {
        certifications: filtered.slice(input.offset, input.offset + input.limit),
        total: filtered.length,
        summary: {
          active: certifications.filter(c => c.status === "active").length,
          expiringSoon: certifications.filter(c => c.status === "expiring_soon").length,
          expired: certifications.filter(c => c.status === "expired").length,
        },
      };
    }),

  /**
   * Get certification by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        type: "cdl",
        name: "Commercial Driver's License - Class A",
        entityType: "driver",
        entityId: "d1",
        entityName: "Mike Johnson",
        number: "TX-12345678",
        issuedBy: "Texas DPS",
        issuedDate: "2022-03-15",
        expiresAt: "2026-03-15",
        status: "active",
        endorsements: [
          { code: "H", name: "Hazardous Materials", status: "active" },
          { code: "N", name: "Tank Vehicles", status: "active" },
          { code: "T", name: "Double/Triple Trailers", status: "active" },
        ],
        restrictions: [],
        documents: [
          { id: "doc_001", name: "CDL Front", type: "image", uploadedAt: "2024-01-15" },
          { id: "doc_002", name: "CDL Back", type: "image", uploadedAt: "2024-01-15" },
        ],
        history: [
          { action: "issued", date: "2022-03-15", notes: "Initial issuance" },
          { action: "renewed", date: "2024-03-15", notes: "4-year renewal" },
        ],
        verificationStatus: "verified",
        verifiedAt: "2024-01-20",
        verifiedBy: "FMCSA Query",
      };
    }),

  /**
   * Add certification
   */
  add: protectedProcedure
    .input(z.object({
      entityType: z.enum(["driver", "company", "vehicle"]),
      entityId: z.string(),
      type: certTypeSchema,
      name: z.string(),
      number: z.string(),
      issuedBy: z.string(),
      issuedDate: z.string(),
      expiresAt: z.string(),
      endorsements: z.array(z.string()).optional(),
      documentIds: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `cert_${Date.now()}`,
        status: "pending",
        createdBy: ctx.user?.id,
        createdAt: new Date().toISOString(),
      };
    }),

  /**
   * Update certification
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      number: z.string().optional(),
      expiresAt: z.string().optional(),
      status: certStatusSchema.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        id: input.id,
        updatedBy: ctx.user?.id,
        updatedAt: new Date().toISOString(),
      };
    }),

  /**
   * Verify certification
   */
  verify: protectedProcedure
    .input(z.object({
      certificationId: z.string(),
      verificationMethod: z.enum(["manual", "fmcsa", "cdlis", "tsa"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        certificationId: input.certificationId,
        verificationStatus: "verified",
        verifiedBy: ctx.user?.id,
        verifiedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get expiring certifications
   */
  getExpiring: protectedProcedure
    .input(z.object({
      daysAhead: z.number().default(90),
      entityType: z.enum(["driver", "company", "vehicle", "all"]).default("all"),
    }))
    .query(async ({ input }) => {
      return [
        {
          id: "cert_002",
          type: "hazmat",
          name: "Hazmat Endorsement",
          entityType: "driver",
          entityName: "Mike Johnson",
          expiresAt: "2025-06-01",
          daysRemaining: 129,
          renewalUrl: "https://hazmat.tsa.gov/renewal",
        },
        {
          id: "cert_005",
          type: "medical_card",
          name: "DOT Medical Certificate",
          entityType: "driver",
          entityName: "Sarah Williams",
          expiresAt: "2025-03-15",
          daysRemaining: 51,
          renewalUrl: null,
        },
        {
          id: "cert_006",
          type: "cdl",
          name: "CDL Class A",
          entityType: "driver",
          entityName: "Tom Brown",
          expiresAt: "2025-04-20",
          daysRemaining: 87,
          renewalUrl: "https://txdps.gov/cdl-renewal",
        },
      ];
    }),

  /**
   * Get certification requirements
   */
  getRequirements: protectedProcedure
    .input(z.object({
      role: z.enum(["driver", "owner_operator", "company"]),
      equipmentType: z.enum(["tanker", "dry_van", "flatbed", "hazmat"]).optional(),
    }))
    .query(async ({ input }) => {
      const baseRequirements = [
        { type: "cdl", name: "CDL Class A", required: true, description: "Valid Commercial Driver's License" },
        { type: "medical_card", name: "DOT Medical Card", required: true, description: "Current DOT physical certification" },
      ];

      const hazmatRequirements = input.equipmentType === "hazmat" || input.equipmentType === "tanker" ? [
        { type: "hazmat", name: "Hazmat Endorsement", required: true, description: "TSA hazmat background check and endorsement" },
        { type: "tanker", name: "Tanker Endorsement", required: true, description: "Tanker vehicle endorsement on CDL" },
        { type: "twic", name: "TWIC Card", required: true, description: "Transportation Worker ID for port access" },
      ] : [];

      return {
        role: input.role,
        equipmentType: input.equipmentType,
        requirements: [...baseRequirements, ...hazmatRequirements],
      };
    }),

  /**
   * Upload certification document
   */
  uploadDocument: protectedProcedure
    .input(z.object({
      certificationId: z.string(),
      documentType: z.enum(["front", "back", "full", "supporting"]),
      fileName: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        documentId: `doc_${Date.now()}`,
        uploadUrl: `/api/certifications/${input.certificationId}/documents/upload`,
        uploadedBy: ctx.user?.id,
        uploadedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get certification compliance report
   */
  getComplianceReport: protectedProcedure
    .input(z.object({
      entityType: z.enum(["driver", "company", "fleet"]).default("fleet"),
    }))
    .query(async ({ input }) => {
      return {
        entityType: input.entityType,
        overallCompliance: 0.94,
        byCategory: [
          { category: "CDL", compliant: 45, nonCompliant: 0, expiringSoon: 3 },
          { category: "Medical Cards", compliant: 42, nonCompliant: 2, expiringSoon: 5 },
          { category: "Hazmat", compliant: 28, nonCompliant: 1, expiringSoon: 2 },
          { category: "TWIC", compliant: 25, nonCompliant: 0, expiringSoon: 1 },
        ],
        actionRequired: [
          { driverName: "Tom Brown", certification: "Medical Card", action: "Schedule renewal", dueDate: "2025-02-15" },
          { driverName: "Lisa Chen", certification: "Hazmat", action: "Complete background check", dueDate: "2025-02-28" },
        ],
        upcomingRenewals: 11,
        estimatedRenewalCost: 2500,
      };
    }),

  /**
   * Send renewal reminder
   */
  sendRenewalReminder: protectedProcedure
    .input(z.object({
      certificationId: z.string(),
      recipientEmail: z.string().email().optional(),
      message: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        certificationId: input.certificationId,
        sentBy: ctx.user?.id,
        sentAt: new Date().toISOString(),
      };
    }),
});
