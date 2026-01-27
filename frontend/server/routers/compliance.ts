/**
 * COMPLIANCE ROUTER
 * tRPC procedures for regulatory compliance management
 * DQ Files, certifications, and audit tracking
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const documentStatusSchema = z.enum(["valid", "expiring_soon", "expired", "missing"]);
const complianceCategorySchema = z.enum(["dq_file", "hos", "drug_alcohol", "vehicle", "hazmat", "documentation"]);

export const complianceRouter = router({
  /**
   * Get dashboard stats for ComplianceDashboard
   */
  getDashboardStats: protectedProcedure
    .query(async () => {
      return {
        complianceScore: 94,
        overallScore: 94,
        expiringDocs: 5,
        overdueItems: 2,
        pendingAudits: 1,
        violations: 0,
        trend: "up",
        expiring: 5,
        compliant: 18,
        nonCompliant: 2,
      };
    }),

  /**
   * Get expiring items
   */
  getExpiringItems: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async () => {
      return [
        { id: "exp_001", type: "Medical Card", driver: "Sarah Williams", expiresAt: "2025-02-15", daysRemaining: 22 },
        { id: "exp_002", type: "CDL", driver: "Tom Brown", expiresAt: "2025-02-28", daysRemaining: 35 },
        { id: "exp_003", type: "Hazmat Endorsement", driver: "Mike Johnson", expiresAt: "2025-03-15", daysRemaining: 50 },
      ];
    }),

  /**
   * Get recent violations
   */
  getRecentViolations: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async () => {
      return [
        { id: "vio_001", type: "HOS", driver: "Bob Davis", date: "2025-01-20", severity: "minor", status: "resolved" },
      ];
    }),

  /**
   * Get HOS drivers for HOSCompliance page
   */
  getHOSDrivers: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ input }) => {
      const drivers = [
        { id: "d1", name: "Mike Johnson", status: "compliant", driveRemaining: 8.5, dutyRemaining: 11, cycleRemaining: 55 },
        { id: "d2", name: "Sarah Williams", status: "warning", driveRemaining: 2.0, dutyRemaining: 4, cycleRemaining: 45 },
        { id: "d3", name: "Tom Brown", status: "violation", driveRemaining: 0, dutyRemaining: 0, cycleRemaining: 38 },
      ];
      if (input.search) {
        const q = input.search.toLowerCase();
        return drivers.filter(d => d.name.toLowerCase().includes(q));
      }
      return drivers;
    }),

  /**
   * Get HOS stats for HOSCompliance page
   */
  getHOSStats: protectedProcedure
    .query(async () => {
      return { totalDrivers: 18, compliant: 15, warnings: 2, violations: 1, complianceRate: 94 };
    }),

  /**
   * Get recent HOS violations for HOSCompliance page
   */
  getRecentHOSViolations: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async () => {
      return [
        { id: "v1", driver: "Tom Brown", type: "Drive Time Exceeded", date: "2025-01-22", duration: "45 min" },
      ];
    }),

  /**
   * Get hazmat drivers for HazmatCertifications page
   */
  getHazmatDrivers: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ input }) => {
      const drivers = [
        { id: "d1", name: "Mike Johnson", status: "valid", endorsement: "H", expiresAt: "2026-03-15", trainedAt: "2024-03-15" },
        { id: "d2", name: "Sarah Williams", status: "expiring", endorsement: "H", expiresAt: "2025-02-15", trainedAt: "2023-02-15" },
        { id: "d3", name: "Tom Brown", status: "valid", endorsement: "H,X", expiresAt: "2026-08-20", trainedAt: "2024-08-20" },
      ];
      if (input.search) {
        const q = input.search.toLowerCase();
        return drivers.filter(d => d.name.toLowerCase().includes(q));
      }
      return drivers;
    }),

  /**
   * Get hazmat stats for HazmatCertifications page
   */
  getHazmatStats: protectedProcedure
    .query(async () => {
      return { totalCertified: 12, valid: 10, expiringSoon: 2, expiring: 2, expired: 0, trainingDue: 1 };
    }),

  /**
   * Get expiring hazmat certs for HazmatCertifications page
   */
  getExpiringHazmat: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(5) }))
    .query(async () => {
      return [
        { id: "h1", driver: "Sarah Williams", endorsement: "H", expiresAt: "2025-02-15", daysRemaining: 22 },
      ];
    }),

  /**
   * Get medical certs for MedicalCertifications page
   */
  getMedicalCerts: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ input }) => {
      const certs = [
        { id: "m1", driver: "Mike Johnson", status: "valid", expiresAt: "2025-11-15", examiner: "Dr. Smith", daysRemaining: 295 },
        { id: "m2", driver: "Sarah Williams", status: "expiring", expiresAt: "2025-02-15", examiner: "Dr. Brown", daysRemaining: 22 },
        { id: "m3", driver: "Tom Brown", status: "valid", expiresAt: "2025-08-20", examiner: "Dr. Davis", daysRemaining: 208 },
      ];
      if (input.search) {
        const q = input.search.toLowerCase();
        return certs.filter(c => c.driver.toLowerCase().includes(q));
      }
      return certs;
    }),

  /**
   * Get medical cert stats for MedicalCertifications page
   */
  getMedicalCertStats: protectedProcedure
    .query(async () => {
      return { totalDrivers: 18, valid: 15, expiringSoon: 2, expired: 1, complianceRate: 94 };
    }),

  /**
   * Get compliance scores by category
   */
  getComplianceScores: protectedProcedure
    .query(async () => {
      return {
        overall: 94,
        categories: [
          { name: "DQ Files", score: 96, status: "good" },
          { name: "HOS Compliance", score: 92, status: "good" },
          { name: "Drug & Alcohol", score: 100, status: "excellent" },
          { name: "Vehicle Inspections", score: 88, status: "warning" },
          { name: "Hazmat", score: 95, status: "good" },
          { name: "Documentation", score: 90, status: "good" },
        ],
      };
    }),

  /**
   * Get compliance dashboard summary
   */
  getDashboardSummary: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        overallScore: 94,
        scores: {
          dqFiles: { score: 96, items: 18, issues: 1 },
          hos: { score: 92, items: 18, issues: 2 },
          drugAlcohol: { score: 100, items: 18, issues: 0 },
          vehicle: { score: 88, items: 24, issues: 3 },
          hazmat: { score: 95, items: 12, issues: 1 },
          documentation: { score: 90, items: 45, issues: 5 },
        },
        expiringDocuments: 5,
        overdueItems: 2,
        pendingAudits: 1,
        recentViolations: 0,
      };
    }),

  /**
   * Get permits for PermitManagement page
   */
  getPermits: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ input }) => {
      const permits = [
        { id: "pmt_001", type: "oversize", states: ["TX", "OK", "LA"], status: "active", expiresAt: "2025-12-31", vehicle: "TRK-101" },
        { id: "pmt_002", type: "overweight", states: ["TX"], status: "expiring", expiresAt: "2025-02-15", vehicle: "TRK-102" },
        { id: "pmt_003", type: "hazmat", states: ["TX", "OK", "LA", "AR"], status: "active", expiresAt: "2025-08-20", vehicle: "All" },
      ];
      if (input.search) {
        const q = input.search.toLowerCase();
        return permits.filter(p => p.type.includes(q) || p.vehicle.toLowerCase().includes(q));
      }
      return permits;
    }),

  /**
   * Get permit stats for PermitManagement page
   */
  getPermitStats: protectedProcedure
    .query(async () => {
      return {
        totalPermits: 12,
        activePermits: 10,
        expiringPermits: 2,
        expiredPermits: 0,
        total: 12,
        active: 10,
        expiring: 2,
        states: 8,
      };
    }),

  /**
   * Get DQ file status for all drivers
   */
  getDQFileStatus: protectedProcedure
    .input(z.object({
      driverId: z.string().optional(),
      status: documentStatusSchema.optional(),
    }))
    .query(async ({ input }) => {
      const drivers = [
        {
          driverId: "d1",
          driverName: "Mike Johnson",
          hireDate: "2022-03-15",
          overallStatus: "valid",
          completionPercentage: 100,
          documents: [
            { type: "cdl", name: "Commercial Driver's License", status: "valid", expirationDate: "2026-03-15" },
            { type: "medical_card", name: "Medical Examiner's Certificate", status: "valid", expirationDate: "2025-11-15" },
            { type: "mvr", name: "Motor Vehicle Record", status: "valid", lastUpdated: "2024-12-01" },
            { type: "road_test", name: "Road Test Certificate", status: "valid", completedDate: "2022-03-20" },
            { type: "application", name: "Employment Application", status: "valid", completedDate: "2022-03-10" },
            { type: "clearinghouse", name: "Clearinghouse Query", status: "valid", lastQueried: "2025-01-01" },
          ],
        },
        {
          driverId: "d2",
          driverName: "Sarah Williams",
          hireDate: "2021-06-01",
          overallStatus: "expiring_soon",
          completionPercentage: 100,
          documents: [
            { type: "cdl", name: "Commercial Driver's License", status: "valid", expirationDate: "2025-06-01" },
            { type: "medical_card", name: "Medical Examiner's Certificate", status: "expiring_soon", expirationDate: "2025-02-15" },
            { type: "mvr", name: "Motor Vehicle Record", status: "valid", lastUpdated: "2024-11-15" },
            { type: "road_test", name: "Road Test Certificate", status: "valid", completedDate: "2021-06-05" },
            { type: "application", name: "Employment Application", status: "valid", completedDate: "2021-05-25" },
            { type: "clearinghouse", name: "Clearinghouse Query", status: "valid", lastQueried: "2025-01-01" },
          ],
        },
        {
          driverId: "d3",
          driverName: "Tom Brown",
          hireDate: "2023-01-10",
          overallStatus: "expired",
          completionPercentage: 85,
          documents: [
            { type: "cdl", name: "Commercial Driver's License", status: "valid", expirationDate: "2027-01-10" },
            { type: "medical_card", name: "Medical Examiner's Certificate", status: "expired", expirationDate: "2025-01-10" },
            { type: "mvr", name: "Motor Vehicle Record", status: "valid", lastUpdated: "2024-10-01" },
            { type: "road_test", name: "Road Test Certificate", status: "valid", completedDate: "2023-01-15" },
            { type: "application", name: "Employment Application", status: "valid", completedDate: "2023-01-05" },
            { type: "clearinghouse", name: "Clearinghouse Query", status: "missing" },
          ],
        },
      ];

      let filtered = drivers;
      if (input.driverId) {
        filtered = filtered.filter(d => d.driverId === input.driverId);
      }
      if (input.status) {
        filtered = filtered.filter(d => d.overallStatus === input.status);
      }

      return {
        drivers: filtered,
        summary: {
          total: drivers.length,
          valid: drivers.filter(d => d.overallStatus === "valid").length,
          expiringSoon: drivers.filter(d => d.overallStatus === "expiring_soon").length,
          expired: drivers.filter(d => d.overallStatus === "expired").length,
        },
      };
    }),

  /**
   * Get expiring documents
   */
  getExpiringDocuments: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      return [
        {
          id: "exp1",
          documentType: "medical_card",
          documentName: "Medical Examiner's Certificate",
          relatedTo: { type: "driver", id: "d2", name: "Sarah Williams" },
          expirationDate: "2025-02-15",
          daysUntilExpiration: 22,
          status: "expiring_soon",
        },
        {
          id: "exp2",
          documentType: "insurance",
          documentName: "Cargo Insurance Policy",
          relatedTo: { type: "company", id: "c1", name: "ABC Transport LLC" },
          expirationDate: "2025-02-10",
          daysUntilExpiration: 17,
          status: "expiring_soon",
        },
        {
          id: "exp3",
          documentType: "hazmat_endorsement",
          documentName: "Hazmat Endorsement",
          relatedTo: { type: "driver", id: "d4", name: "Lisa Chen" },
          expirationDate: "2025-03-01",
          daysUntilExpiration: 36,
          status: "expiring_soon",
        },
      ];
    }),

  /**
   * Get compliance audit history
   */
  getAuditHistory: protectedProcedure
    .input(z.object({
      type: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return [
        {
          id: "audit1",
          type: "dot_inspection",
          date: "2025-01-15",
          inspector: "DOT Officer Smith",
          location: "I-45 Weigh Station, TX",
          result: "satisfactory",
          violations: 0,
          notes: "Routine inspection, no issues found",
        },
        {
          id: "audit2",
          type: "internal_audit",
          date: "2025-01-10",
          inspector: "John Admin",
          location: "Houston Terminal",
          result: "passed",
          violations: 0,
          notes: "Quarterly compliance review",
        },
        {
          id: "audit3",
          type: "dot_inspection",
          date: "2024-12-20",
          inspector: "DOT Officer Johnson",
          location: "US-290 Checkpoint, TX",
          result: "conditional",
          violations: 1,
          notes: "Minor brake adjustment required",
          violationDetails: [
            { code: "393.47", description: "Brake adjustment out of spec", severity: "minor" },
          ],
        },
      ];
    }),

  /**
   * Get FMCSA compliance data
   */
  getFMCSAData: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        carrier: {
          dotNumber: "1234567",
          mcNumber: "MC-987654",
          legalName: "ABC Transport LLC",
          dbaName: "ABC Hazmat Carriers",
          address: "1234 Industrial Blvd, Houston, TX 77001",
          phone: "(713) 555-0100",
        },
        operatingStatus: "authorized",
        insuranceStatus: "compliant",
        saferRating: "satisfactory",
        lastUpdated: new Date().toISOString(),
        authority: {
          commonCarrier: true,
          contractCarrier: true,
          broker: false,
          hazmat: true,
        },
      };
    }),

  /**
   * Update document status
   */
  updateDocumentStatus: protectedProcedure
    .input(z.object({
      documentId: z.string(),
      status: documentStatusSchema,
      expirationDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        documentId: input.documentId,
        updatedAt: new Date().toISOString(),
        updatedBy: ctx.user?.id,
      };
    }),

  /**
   * Schedule compliance reminder
   */
  scheduleReminder: protectedProcedure
    .input(z.object({
      documentId: z.string(),
      reminderDate: z.string(),
      recipients: z.array(z.string()),
      message: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        reminderId: `rem_${Date.now()}`,
        scheduledFor: input.reminderDate,
      };
    }),

  /**
   * Run Clearinghouse query
   */
  runClearinghouseQuery: protectedProcedure
    .input(z.object({
      driverId: z.string(),
      queryType: z.enum(["pre_employment", "annual"]),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        queryId: `ch_${Date.now()}`,
        driverId: input.driverId,
        status: "pending",
        estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
    }),

  /**
   * Get violations list with filtering
   */
  getViolations: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.string().optional(),
      severity: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const violations = [
        {
          id: "v1",
          code: "395.8",
          description: "Driver failed to maintain accurate log of duty status",
          severity: "major",
          status: "open",
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          driver: "Tom Brown",
          vehicle: "Unit 2847",
          location: "Houston, TX",
          fineAmount: 1500,
        },
        {
          id: "v2",
          code: "393.47",
          description: "Brake adjustment out of specification",
          severity: "minor",
          status: "in_progress",
          date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          driver: "Mike Johnson",
          vehicle: "Unit 1923",
          location: "Dallas, TX",
          fineAmount: 500,
        },
        {
          id: "v3",
          code: "172.704",
          description: "Hazmat shipping papers not properly annotated",
          severity: "critical",
          status: "open",
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          driver: "Sarah Williams",
          vehicle: "Unit 3456",
          location: "San Antonio, TX",
          fineAmount: 2500,
        },
        {
          id: "v4",
          code: "382.305",
          description: "Random drug test not completed within required timeframe",
          severity: "major",
          status: "resolved",
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          driver: "Lisa Chen",
          vehicle: null,
          location: "Houston Terminal",
          fineAmount: 1000,
          resolvedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "v5",
          code: "177.817",
          description: "Placarding not visible from all four sides",
          severity: "minor",
          status: "resolved",
          date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          driver: "Robert Davis",
          vehicle: "Unit 2156",
          location: "Austin, TX",
          fineAmount: 750,
          resolvedDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      let filtered = violations;
      if (input.search) {
        const s = input.search.toLowerCase();
        filtered = filtered.filter(v => 
          v.code.toLowerCase().includes(s) || 
          v.description.toLowerCase().includes(s) ||
          v.driver?.toLowerCase().includes(s)
        );
      }
      if (input.status) {
        filtered = filtered.filter(v => v.status === input.status);
      }
      if (input.severity) {
        filtered = filtered.filter(v => v.severity === input.severity);
      }

      return filtered;
    }),

  /**
   * Get violation statistics
   */
  getViolationStats: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        open: 2,
        critical: 1,
        inProgress: 1,
        resolved: 8,
        totalFines: 6250,
        avgResolutionDays: 12,
      };
    }),

  /**
   * Resolve a violation
   */
  resolveViolation: protectedProcedure
    .input(z.object({
      id: z.string(),
      resolution: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        id: input.id,
        resolvedAt: new Date().toISOString(),
        resolvedBy: ctx.user?.id,
      };
    }),

  /**
   * Get audits list with filtering
   */
  getAudits: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.string().optional(),
      type: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const audits = [
        {
          id: "a1",
          name: "Q1 2025 DOT Compliance Audit",
          type: "dot",
          status: "scheduled",
          scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          description: "Quarterly DOT compliance review covering all driver qualification files",
          auditor: "DOT Regional Office",
          location: "Houston Terminal",
          progress: 0,
        },
        {
          id: "a2",
          name: "Hazmat Certification Review",
          type: "hazmat",
          status: "in_progress",
          scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          description: "Annual hazmat certification verification for all certified drivers",
          auditor: "John Safety Manager",
          location: "All Terminals",
          progress: 65,
          findings: 2,
        },
        {
          id: "a3",
          name: "FMCSA Safety Audit",
          type: "fmcsa",
          status: "completed",
          scheduledDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          completedDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
          description: "Comprehensive safety management controls audit",
          auditor: "FMCSA Field Office",
          location: "Houston Terminal",
          progress: 100,
          findings: 3,
          result: "satisfactory",
        },
        {
          id: "a4",
          name: "Internal Driver File Audit",
          type: "internal",
          status: "completed",
          scheduledDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          completedDate: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000).toISOString(),
          description: "Monthly review of driver qualification files for compliance",
          auditor: "Compliance Team",
          location: "Houston Terminal",
          progress: 100,
          findings: 1,
          result: "passed",
        },
        {
          id: "a5",
          name: "Tank Wagon Inspection Audit",
          type: "hazmat",
          status: "scheduled",
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          description: "DOT-required tank wagon inspection and certification review",
          auditor: "Third Party Inspector",
          location: "Equipment Yard",
          progress: 0,
        },
      ];

      let filtered = audits;
      if (input.search) {
        const s = input.search.toLowerCase();
        filtered = filtered.filter(a => 
          a.name.toLowerCase().includes(s) || 
          a.description?.toLowerCase().includes(s)
        );
      }
      if (input.status) {
        filtered = filtered.filter(a => a.status === input.status);
      }
      if (input.type) {
        filtered = filtered.filter(a => a.type === input.type);
      }

      return filtered;
    }),

  /**
   * Get audit statistics
   */
  getAuditStats: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        scheduled: 2,
        inProgress: 1,
        passed: 15,
        failed: 1,
        passRate: 94,
        upcomingThisMonth: 2,
      };
    }),

  /**
   * Schedule a new audit
   */
  scheduleAudit: protectedProcedure
    .input(z.object({
      name: z.string(),
      type: z.enum(["dot", "fmcsa", "internal", "hazmat"]),
      scheduledDate: z.string(),
      location: z.string(),
      description: z.string().optional(),
      auditor: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        id: `a_${Date.now()}`,
        ...input,
        status: "scheduled",
        createdAt: new Date().toISOString(),
        createdBy: ctx.user?.id,
      };
    }),

  /**
   * Get compliance training records
   */
  getTrainingRecords: protectedProcedure
    .input(z.object({
      driverId: z.string().optional(),
      type: z.string().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const records = [
        {
          id: "t1",
          driverId: "d1",
          driverName: "Mike Johnson",
          trainingType: "hazmat_awareness",
          trainingName: "Hazmat General Awareness Training",
          status: "completed",
          completedDate: "2024-12-15",
          expirationDate: "2027-12-15",
          score: 95,
          certificateId: "CERT-HAZ-001",
        },
        {
          id: "t2",
          driverId: "d1",
          driverName: "Mike Johnson",
          trainingType: "hazmat_function",
          trainingName: "Hazmat Function-Specific Training",
          status: "completed",
          completedDate: "2024-12-15",
          expirationDate: "2027-12-15",
          score: 92,
          certificateId: "CERT-HAZ-002",
        },
        {
          id: "t3",
          driverId: "d2",
          driverName: "Sarah Williams",
          trainingType: "hazmat_security",
          trainingName: "Hazmat Security Awareness Training",
          status: "in_progress",
          assignedDate: "2025-01-10",
          dueDate: "2025-02-10",
          progress: 60,
        },
        {
          id: "t4",
          driverId: "d3",
          driverName: "Tom Brown",
          trainingType: "defensive_driving",
          trainingName: "Defensive Driving Certification",
          status: "overdue",
          assignedDate: "2024-11-01",
          dueDate: "2025-01-01",
          progress: 30,
        },
        {
          id: "t5",
          driverId: "d4",
          driverName: "Lisa Chen",
          trainingType: "tanker_endorsement",
          trainingName: "Tanker Endorsement Training",
          status: "completed",
          completedDate: "2024-10-20",
          expirationDate: "2027-10-20",
          score: 98,
          certificateId: "CERT-TANK-001",
        },
      ];

      let filtered = records;
      if (input.driverId) {
        filtered = filtered.filter(r => r.driverId === input.driverId);
      }
      if (input.type) {
        filtered = filtered.filter(r => r.trainingType === input.type);
      }
      if (input.status) {
        filtered = filtered.filter(r => r.status === input.status);
      }

      return {
        records: filtered,
        summary: {
          completed: records.filter(r => r.status === "completed").length,
          inProgress: records.filter(r => r.status === "in_progress").length,
          overdue: records.filter(r => r.status === "overdue").length,
          upcoming: records.filter(r => r.status === "assigned").length,
        },
      };
    }),

  /**
   * Assign training to driver
   */
  assignTraining: protectedProcedure
    .input(z.object({
      driverId: z.string(),
      trainingType: z.string(),
      dueDate: z.string(),
      priority: z.enum(["low", "medium", "high"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        success: true,
        id: `t_${Date.now()}`,
        ...input,
        status: "assigned",
        assignedAt: new Date().toISOString(),
        assignedBy: ctx.user?.id,
      };
    }),

  // Background checks
  getBackgroundChecks: protectedProcedure.input(z.object({ status: z.string().optional() })).query(async () => [{ id: "bg1", driverId: "d1", driverName: "John Smith", status: "completed", completedAt: "2025-01-20" }]),
  getBackgroundCheckStats: protectedProcedure.query(async () => ({ total: 150, pending: 5, completed: 140, failed: 5 })),
  initiateBackgroundCheck: protectedProcedure.input(z.object({ driverId: z.string() })).mutation(async ({ input }) => ({ success: true, checkId: "bg_123", driverId: input.driverId })),

  // Calendar
  getCalendarEvents: protectedProcedure.input(z.object({ month: z.number().optional(), year: z.number().optional() })).query(async () => [{ id: "ev1", title: "Medical Card Renewal", date: "2025-02-15", type: "renewal" }]),
  getCalendarSummary: protectedProcedure.query(async () => ({ thisMonth: 12, nextMonth: 8, overdue: 2 })),

  // Clearinghouse
  getClearinghouseQueries: protectedProcedure.input(z.object({ status: z.string().optional(), limit: z.number().optional(), filter: z.string().optional(), search: z.string().optional() }).optional()).query(async () => [
    { id: "ch1", driverId: "d1", driverName: "Mike Johnson", type: "pre-employment", status: "completed", completedAt: "2025-01-18", lastQuery: "2025-01-18" },
    { id: "ch2", driverId: "d2", driverName: "Sarah Williams", type: "annual", status: "pending", completedAt: null, lastQuery: "2024-12-15" },
  ]),
  getClearinghouseStats: protectedProcedure.input(z.object({ period: z.string().optional() }).optional()).query(async () => ({ totalDrivers: 45, compliant: 42, pendingQueries: 3, clearDrivers: 42, violations: 2, totalQueries: 250, thisMonth: 15, clear: 42, pending: 3, total: 250 })),
  runClearinghouseQuery: protectedProcedure.input(z.object({ driverId: z.string().optional(), queryType: z.enum(["pre_employment", "annual"]).optional() }).optional()).mutation(async ({ input }) => ({ success: true, queryId: "q_123" })),
  getClearinghouseDrivers: protectedProcedure.input(z.object({ status: z.string().optional() }).optional()).query(async () => [
    { driverId: "d1", name: "Mike Johnson", status: "clear", lastQuery: "2025-01-18" },
    { driverId: "d2", name: "Sarah Williams", status: "pending", lastQuery: "2024-12-15" },
  ]),

  // DQ File
  getDQDrivers: protectedProcedure.input(z.object({ status: z.string().optional() })).query(async () => [{ id: "d1", name: "Mike Johnson", status: "complete", lastUpdated: "2025-01-20" }]),
  getDQStats: protectedProcedure.query(async () => ({ total: 150, complete: 140, incomplete: 8, missing: 2, expiringSoon: 5, totalDrivers: 25 })),
  getDriverDQFile: protectedProcedure.input(z.object({ driverId: z.string(), search: z.string().optional() })).query(async ({ input }) => ({ driverId: input.driverId, name: "Mike Johnson", dqStatus: "complete", cdlNumber: "TX12345678", hireDate: "2022-01-15", completionPercent: 95, documents: [{ type: "cdl", status: "valid" }, { type: "medical", status: "valid" }] })),
  getDQFiles: protectedProcedure.input(z.object({ status: z.string().optional(), search: z.string().optional() })).query(async () => [{ driverId: "d1", name: "Mike Johnson", dqStatus: "complete", cdlNumber: "TX12345678", hireDate: "2022-01-15", completionPercent: 95, documents: [{ type: "cdl", status: "valid" }] }]),

  // Drug & Alcohol
  getDrugAlcoholTests: protectedProcedure.input(z.object({ status: z.string().optional(), filter: z.string().optional() })).query(async () => [{ id: "da1", driverId: "d1", type: "random", status: "negative", date: "2025-01-15" }]),
  getDrugAlcoholStats: protectedProcedure.query(async () => ({ totalTests: 450, negative: 445, positive: 3, pending: 2, scheduled: 5, totalYTD: 450 })),
  getUpcomingTests: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async () => [{ id: "ut1", driverId: "d1", type: "random", scheduledDate: "2025-02-01" }]),
  scheduleTest: protectedProcedure.input(z.object({ driverId: z.string().optional(), type: z.string().optional(), date: z.string().optional() }).optional()).mutation(async ({ input }) => ({ success: true, testId: "test_123" })),

  // Employment History
  getEmploymentHistory: protectedProcedure.input(z.object({ driverId: z.string() })).query(async ({ input }) => [{ id: "eh1", employer: "ABC Transport", startDate: "2020-01-15", endDate: "2024-12-31" }]),
  getEmploymentHistoryStats: protectedProcedure.query(async () => ({ verified: 120, pending: 15, unverifiable: 5 })),

  // Licenses
  getLicenses: protectedProcedure.input(z.object({ status: z.string().optional() })).query(async () => [{ id: "lic1", driverId: "d1", type: "CDL-A", state: "TX", expiration: "2026-06-15", status: "valid" }]),
  getLicenseStats: protectedProcedure.query(async () => ({ total: 150, valid: 145, expiring: 3, expired: 2 })),

  // MVR Reports
  getMVRReports: protectedProcedure.input(z.object({ driverId: z.string().optional() })).query(async () => [{ id: "mvr1", driverId: "d1", date: "2025-01-10", status: "clean", violations: 0 }]),
  getMVRStats: protectedProcedure.query(async () => ({ total: 150, clean: 140, violations: 10 })),
  requestMVR: protectedProcedure.input(z.object({ driverId: z.string() })).mutation(async ({ input }) => ({ success: true, requestId: "mvr_123" })),

  // PSP Reports
  getPSPReports: protectedProcedure.input(z.object({ driverId: z.string().optional() })).query(async () => [{ id: "psp1", driverId: "d1", date: "2025-01-10", crashes: 0, inspections: 5 }]),
  getPSPStats: protectedProcedure.query(async () => ({ total: 150, requested: 145, pending: 5 })),
  requestPSP: protectedProcedure.input(z.object({ driverId: z.string() })).mutation(async ({ input }) => ({ success: true, requestId: "psp_123" })),

  // Road Tests
  getRoadTests: protectedProcedure.input(z.object({ status: z.string().optional() })).query(async () => [{ id: "rt1", driverId: "d1", date: "2025-01-05", result: "passed", examiner: "John Examiner" }]),
  getRoadTestStats: protectedProcedure.query(async () => ({ total: 150, passed: 145, failed: 3, scheduled: 2 })),

  // SAFER Lookup
  saferLookup: protectedProcedure.input(z.object({ dotNumber: z.string().optional(), mcNumber: z.string().optional() })).query(async ({ input }) => ({ dotNumber: input.dotNumber || "1234567", legalName: "ABC Transport LLC", status: "AUTHORIZED", safetyRating: "Satisfactory" })),

  // Permit Requirements
  getPermitRequirements: protectedProcedure.input(z.object({ state: z.string() })).query(async ({ input }) => [
    { id: "pr1", type: "oversize", state: input.state, requirements: ["Permit application", "Route survey", "Escort vehicles"], fees: 150, renewalPeriod: "Annual" },
    { id: "pr2", type: "overweight", state: input.state, requirements: ["Weight certification", "Bridge analysis"], fees: 200, renewalPeriod: "Per trip" },
  ]),
  getStatePermits: protectedProcedure.input(z.object({ state: z.string().optional() }).optional()).query(async () => ({
    permits: [
      { id: "sp1", number: "TX-2025-001", state: "TX", expiresAt: "2025-12-31", status: "valid" },
      { id: "sp2", number: "OK-2025-002", state: "OK", expiresAt: "2025-02-15", status: "expiring" },
    ],
    total: 12,
    valid: 10,
    expiringSoon: 2,
    expired: 0,
  })),
});
