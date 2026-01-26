/**
 * ONBOARDING ROUTER
 * tRPC procedures for user and company onboarding
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const onboardingRouter = router({
  /**
   * Get onboarding status
   */
  getStatus: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        userId: ctx.user?.id,
        currentStep: 3,
        totalSteps: 7,
        completedSteps: ["profile", "company", "documents"],
        pendingSteps: ["payment", "compliance", "training", "review"],
        percentComplete: 43,
      };
    }),

  /**
   * Get onboarding steps
   */
  getSteps: protectedProcedure
    .query(async () => {
      return [
        { id: "profile", name: "Profile Setup", status: "complete", order: 1 },
        { id: "company", name: "Company Information", status: "complete", order: 2 },
        { id: "documents", name: "Document Upload", status: "complete", order: 3 },
        { id: "payment", name: "Payment Setup", status: "pending", order: 4 },
        { id: "compliance", name: "Compliance Check", status: "pending", order: 5 },
        { id: "training", name: "Training Modules", status: "pending", order: 6 },
        { id: "review", name: "Final Review", status: "pending", order: 7 },
      ];
    }),

  /**
   * Complete a step
   */
  completeStep: protectedProcedure
    .input(z.object({
      stepId: z.string(),
      data: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        stepId: input.stepId,
        completedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get onboarding checklist
   */
  getChecklist: protectedProcedure
    .query(async () => {
      return [
        { id: "cdl", name: "CDL License", required: true, completed: true },
        { id: "medical", name: "Medical Certificate", required: true, completed: true },
        { id: "mvr", name: "Motor Vehicle Record", required: true, completed: false },
        { id: "drugtest", name: "Drug Test Results", required: true, completed: false },
        { id: "background", name: "Background Check", required: true, completed: false },
        { id: "insurance", name: "Insurance Documents", required: true, completed: true },
      ];
    }),

  // Applicants
  getApplicants: protectedProcedure.input(z.object({ status: z.string().optional() }).optional()).query(async () => [{ id: "a1", name: "John Smith", type: "driver", status: "pending", appliedAt: "2025-01-22" }]),
  approveApplicant: protectedProcedure.input(z.object({ applicantId: z.string() })).mutation(async ({ input }) => ({ success: true, applicantId: input.applicantId })),

  // Progress & Documents
  getProgress: protectedProcedure.query(async () => ({ step: 3, totalSteps: 5, percentage: 60, completedSteps: 3, inProgressSteps: 1, pendingSteps: 1, estimatedTimeRemaining: "2 days", trainingsCompleted: 4 })),
  getRequiredDocuments: protectedProcedure.query(async () => [{ id: "d1", type: "cdl", name: "CDL License", required: true, uploaded: false, status: "pending" }]),
  uploadDocument: protectedProcedure.input(z.object({ type: z.string(), fileUrl: z.string() })).mutation(async ({ input }) => ({ success: true, documentId: "doc_123" })),
});
