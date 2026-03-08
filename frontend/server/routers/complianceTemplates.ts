/**
 * COMPLIANCE & DOCUMENTATION TEMPLATES ROUTER (Task 4.3)
 * tRPC procedures for generating compliance checklists,
 * document templates, and compliance scoring by vertical.
 */

import { z } from "zod";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import {
  generateChecklist,
  getDocumentTemplates,
  getDocumentTemplate,
  getAllAvailableTemplates,
  generateComplianceSummary,
} from "../services/ComplianceTemplates";

export const complianceTemplatesRouter = router({
  // 1. getChecklist — Full compliance checklist for a vertical
  getChecklist: protectedProcedure
    .input(z.object({ verticalId: z.string() }))
    .query(async ({ input }) => {
      return generateChecklist(input.verticalId);
    }),

  // 2. getDocumentTemplates — All document templates for a vertical
  getDocumentTemplates: protectedProcedure
    .input(z.object({ verticalId: z.string() }))
    .query(async ({ input }) => {
      return getDocumentTemplates(input.verticalId);
    }),

  // 3. getDocumentTemplate — Single document template by ID
  getDocumentTemplate: protectedProcedure
    .input(z.object({ verticalId: z.string(), templateId: z.string() }))
    .query(async ({ input }) => {
      return getDocumentTemplate(input.verticalId, input.templateId);
    }),

  // 4. getAllTemplates — All templates across all verticals
  getAllTemplates: protectedProcedure
    .input(z.object({}).optional())
    .query(async () => {
      return getAllAvailableTemplates();
    }),

  // 5. getComplianceSummary — Score a load against vertical requirements
  getComplianceSummary: protectedProcedure
    .input(z.object({
      verticalId: z.string(),
      loadData: z.record(z.string(), z.any()),
    }))
    .query(async ({ input }) => {
      return generateComplianceSummary(input.verticalId, input.loadData);
    }),
});
