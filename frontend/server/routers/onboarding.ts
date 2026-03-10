/**
 * ONBOARDING ROUTER
 * tRPC procedures for user and company onboarding
 * Uses real database queries for production readiness
 */

import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { emailService } from "../_core/email";
import { getDb } from "../db";
import { users, companies, onboardingProgress, documents, userTraining, trainingModules, auditLogs } from "../../drizzle/schema";
import { resolveCompanyCompliance, resolveDriverCompliance } from "../services/complianceEngine";

export const onboardingRouter = router({
  /**
   * Get onboarding status
   */
  getStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      const userId = Number(ctx.user?.id) || 0;

      if (!db) {
        return {
          userId: ctx.user?.id,
          currentStep: 1,
          totalSteps: 7,
          completedSteps: [],
          pendingSteps: ["profile", "company", "documents", "payment", "compliance", "training", "review"],
          percentComplete: 0,
          status: "in_progress",
        };
      }

      const [progress] = await db.select()
        .from(onboardingProgress)
        .where(eq(onboardingProgress.userId, userId))
        .limit(1);

      if (!progress) {
        return {
          userId: ctx.user?.id,
          currentStep: 1,
          totalSteps: 7,
          completedSteps: [],
          pendingSteps: ["profile", "company", "documents", "payment", "compliance", "training", "review"],
          percentComplete: 0,
          status: "in_progress",
        };
      }

      const completedSteps = progress.completedSteps || [];
      const percentComplete = Math.round((completedSteps.length / progress.totalSteps) * 100);

      return {
        userId: ctx.user?.id,
        currentStep: progress.currentStep,
        totalSteps: progress.totalSteps,
        completedSteps,
        pendingSteps: progress.pendingSteps || [],
        percentComplete,
        status: progress.status,
      };
    }),

  /**
   * Get onboarding steps
   */
  getSteps: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      const userId = Number(ctx.user?.id) || 0;

      const allSteps = [
        { id: "profile", name: "Profile Setup", order: 1, type: "form", title: "Profile Setup", description: "Complete your profile information", estimatedTime: "5 min" },
        { id: "company", name: "Company Information", order: 2, type: "form", title: "Company Information", description: "Add your company details", estimatedTime: "10 min" },
        { id: "documents", name: "Document Upload", order: 3, type: "upload", title: "Document Upload", description: "Upload required documents", estimatedTime: "15 min" },
        { id: "payment", name: "Payment Setup", order: 4, type: "form", title: "Payment Setup", description: "Configure payment methods", estimatedTime: "5 min" },
        { id: "compliance", name: "Compliance Check", order: 5, type: "verification", title: "Compliance Check", description: "Complete compliance verification", estimatedTime: "10 min" },
        { id: "training", name: "Training Modules", order: 6, type: "training", title: "Training Modules", description: "Complete required training", estimatedTime: "30 min" },
        { id: "review", name: "Final Review", order: 7, type: "review", title: "Final Review", description: "Review and submit application", estimatedTime: "5 min" },
      ];

      if (!db) {
        return allSteps.map(s => ({ ...s, status: "pending" }));
      }

      const [progress] = await db.select()
        .from(onboardingProgress)
        .where(eq(onboardingProgress.userId, userId))
        .limit(1);

      const completedSteps = progress?.completedSteps || [];

      return allSteps.map(step => ({
        ...step,
        status: completedSteps.includes(step.id) ? "complete" : 
                progress?.currentStep === step.order ? "in_progress" : "pending",
      }));
    }),

  /**
   * Complete a step
   */
  completeStep: protectedProcedure
    .input(z.object({
      stepId: z.string(),
      data: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = Number(ctx.user?.id) || 0;

      if (!db) {
        return { success: false, error: "Database not available" };
      }

      // Step ordering map
      const stepOrder: Record<string, number> = {
        profile: 1, company: 2, documents: 3, payment: 4,
        compliance: 5, training: 6, review: 7,
      };
      const orderedStepIds = ["profile", "company", "documents", "payment", "compliance", "training", "review"];

      const [progress] = await db.select()
        .from(onboardingProgress)
        .where(eq(onboardingProgress.userId, userId))
        .limit(1);

      // Enforce step ordering: all previous steps must be completed first
      const currentOrder = stepOrder[input.stepId] || 1;
      if (currentOrder > 1) {
        const completedSteps = progress?.completedSteps || [];
        for (let i = 0; i < currentOrder - 1; i++) {
          const prereq = orderedStepIds[i];
          if (!completedSteps.includes(prereq)) {
            throw new Error(`Please complete step ${i + 1} first`);
          }
        }
      }

      if (!progress) {
        await db.insert(onboardingProgress).values({
          userId,
          currentStep: 2,
          totalSteps: 7,
          completedSteps: [input.stepId],
          pendingSteps: ["company", "documents", "payment", "compliance", "training", "review"],
          status: "in_progress",
        });
      } else {
        const completedSteps = [...(progress.completedSteps || [])];
        if (!completedSteps.includes(input.stepId)) {
          completedSteps.push(input.stepId);
        }
        const pendingSteps = (progress.pendingSteps || []).filter((s: string) => s !== input.stepId);
        
        await db.update(onboardingProgress)
          .set({
            currentStep: progress.currentStep + 1,
            completedSteps,
            pendingSteps,
            status: pendingSteps.length === 0 ? "pending_review" : "in_progress",
          })
          .where(eq(onboardingProgress.userId, userId));
      }

      return {
        success: true,
        stepId: input.stepId,
        completedAt: new Date().toISOString(),
      };
    }),

  /**
   * Get onboarding checklist (smart compliance engine)
   * Resolves requirements based on user's actual company state, role, ops
   */
  getChecklist: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      const userId = Number(ctx.user?.id) || 0;
      const role = ctx.user?.role || "DRIVER";

      if (!db) return [];

      // Get user's uploaded documents
      const userDocs = await db.select()
        .from(documents)
        .where(eq(documents.userId, userId));
      const uploadedTypes = new Set(userDocs.map(d => d.type));

      // Resolve company/driver profile from DB
      let companyState = "";
      let companyId = 0;
      let hazmatAuthorized = false;
      let tankerEndorsed = false;
      let cdlState = "";
      let endorsements: string[] = [];

      const [user] = await db.select({ companyId: users.companyId, metadata: users.metadata })
        .from(users).where(eq(users.id, userId)).limit(1);

      if (user?.companyId) {
        companyId = user.companyId;
        const [company] = await db.select().from(companies).where(eq(companies.id, user.companyId)).limit(1);
        if (company) companyState = company.state || "";
      }

      try {
        const meta = typeof user?.metadata === "string" ? JSON.parse(user.metadata) : user?.metadata;
        if (meta?.registration) {
          const reg = meta.registration;
          if (reg.hazmatEndorsed || reg.hazmatClasses?.length) hazmatAuthorized = true;
          if (reg.tankerEndorsed) tankerEndorsed = true;
          if (reg.cdlState) cdlState = reg.cdlState;
          if (reg.cdlEndorsements) endorsements = reg.cdlEndorsements;
          if (reg.hazmatEndorsement) hazmatAuthorized = true;
          if (reg.tankerEndorsement) tankerEndorsed = true;
        }
      } catch {}

      // Use the compliance engine to resolve requirements
      let reqs: { documentTypeId: string; name: string; priority: string; status: string }[] = [];

      if (role === "DRIVER") {
        const profile = resolveDriverCompliance({
          userId,
          companyId: companyId || undefined,
          cdlState: cdlState || companyState,
          companyState,
          role: "DRIVER",
          endorsements,
          hazmatEndorsed: hazmatAuthorized,
          tankerEndorsed,
        });
        reqs = profile.requirements;
      } else {
        const profile = resolveCompanyCompliance({
          companyId,
          state: companyState,
          role,
          hazmatAuthorized,
          tankerEndorsed,
        });
        reqs = profile.requirements;
      }

      // Map to checklist format — show CRITICAL and HIGH items
      return reqs
        .filter(r => r.priority === "CRITICAL" || r.priority === "HIGH")
        .map(r => ({
          id: r.documentTypeId,
          name: r.name,
          required: r.priority === "CRITICAL",
          completed: uploadedTypes.has(r.documentTypeId),
        }));
    }),

  /**
   * Get pending applicants (Admin)
   */
  getApplicants: protectedProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const pendingUsers = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        isVerified: users.isVerified,
      })
        .from(users)
        .where(eq(users.isVerified, false))
        .orderBy(desc(users.createdAt))
        .limit(50);

      return pendingUsers.map(u => ({
        id: String(u.id),
        name: u.name || "Unknown",
        type: u.role?.toLowerCase() || "driver",
        status: "pending",
        appliedAt: u.createdAt?.toISOString().split("T")[0] || "",
        email: u.email || "",
        appliedDate: u.createdAt?.toISOString().split("T")[0] || "",
        progress: 0,
      }));
    }),

  /**
   * Approve applicant (Admin)
   */
  approveApplicant: protectedProcedure
    .input(z.object({ applicantId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(users)
        .set({ isVerified: true, isActive: true })
        .where(eq(users.id, Number(input.applicantId)));

      await db.update(onboardingProgress)
        .set({ status: "approved", approvedAt: new Date(), approvedBy: Number(ctx.user?.id) })
        .where(eq(onboardingProgress.userId, Number(input.applicantId)));

      return { success: true, applicantId: input.applicantId };
    }),

  /**
   * Reject applicant (Admin)
   */
  rejectApplicant: protectedProcedure
    .input(z.object({ applicantId: z.number(), reason: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Only admins can reject
      const callerRole = ctx.user?.role;
      if (callerRole !== "ADMIN" && callerRole !== "CATALYST") {
        throw new Error("Only admins can reject applicants");
      }

      // Update onboarding progress
      await db.update(onboardingProgress)
        .set({ status: "rejected", rejectionReason: input.reason })
        .where(eq(onboardingProgress.userId, input.applicantId));

      // Update user metadata with rejection info
      const [applicant] = await db.select({ email: users.email, name: users.name, metadata: users.metadata })
        .from(users).where(eq(users.id, input.applicantId)).limit(1);

      const existingMeta = (() => {
        try {
          return typeof applicant?.metadata === "string" ? JSON.parse(applicant.metadata) : (applicant?.metadata || {});
        } catch { return {}; }
      })();

      await db.update(users)
        .set({
          metadata: JSON.stringify({
            ...existingMeta,
            rejected: true,
            rejectionReason: input.reason,
            rejectedAt: new Date().toISOString(),
          }),
        })
        .where(eq(users.id, input.applicantId));

      // Send rejection email
      try {
        await emailService.send({
          to: applicant?.email || '',
          subject: 'EusoTrip Application Update',
          html: `<p>Hello ${applicant?.name || ''},</p><p>We regret to inform you that your application has not been approved.</p><p><strong>Reason:</strong> ${input.reason}</p><p>If you believe this was in error, please contact support.</p>`,
        });
      } catch (emailErr) {
        logger.error('[Onboarding] rejection email failed:', emailErr);
      }

      // Audit log
      try {
        await db.insert(auditLogs).values({
          userId: ctx.user?.id ?? null,
          action: 'reject_applicant',
          entityType: 'onboarding',
          entityId: input.applicantId,
          metadata: { reason: input.reason, applicantEmail: applicant?.email } as unknown as Record<string, unknown>,
        });
      } catch (auditErr) {
        logger.error('[Onboarding] reject audit log failed:', auditErr);
      }

      return { success: true, applicantId: input.applicantId };
    }),

  /**
   * Get progress summary
   */
  getProgress: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      const userId = Number(ctx.user?.id) || 0;

      if (!db) {
        return { step: 1, totalSteps: 7, percentage: 0, completedSteps: 0, inProgressSteps: 1, pendingSteps: 6, estimatedTimeRemaining: "Unknown", trainingsCompleted: 0 };
      }

      const [progress] = await db.select()
        .from(onboardingProgress)
        .where(eq(onboardingProgress.userId, userId))
        .limit(1);

      const trainings = await db.select()
        .from(userTraining)
        .where(and(eq(userTraining.userId, userId), eq(userTraining.status, "completed")));

      const completedCount = progress?.completedSteps?.length || 0;
      const totalSteps = progress?.totalSteps || 7;

      return {
        step: progress?.currentStep || 1,
        totalSteps,
        percentage: Math.round((completedCount / totalSteps) * 100),
        completedSteps: completedCount,
        inProgressSteps: 1,
        pendingSteps: totalSteps - completedCount - 1,
        estimatedTimeRemaining: `${Math.max(1, totalSteps - completedCount)} days`,
        trainingsCompleted: trainings.length,
      };
    }),

  /**
   * Get required documents based on role (smart compliance engine)
   * Resolves all documents needed for onboarding based on company state, role, operations
   */
  getRequiredDocuments: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      const userId = Number(ctx.user?.id) || 0;
      const role = ctx.user?.role || "DRIVER";

      if (!db) return [];

      const userDocs = await db.select()
        .from(documents)
        .where(eq(documents.userId, userId));
      const uploadedMap = new Map(userDocs.map(d => [d.type, d]));

      // Resolve company/driver profile
      let companyState = "";
      let companyId = 0;
      let hazmatAuthorized = false;
      let tankerEndorsed = false;
      let cdlState = "";
      let endorsements: string[] = [];

      const [user] = await db.select({ companyId: users.companyId, metadata: users.metadata })
        .from(users).where(eq(users.id, userId)).limit(1);

      if (user?.companyId) {
        companyId = user.companyId;
        const [company] = await db.select().from(companies).where(eq(companies.id, user.companyId)).limit(1);
        if (company) companyState = company.state || "";
      }

      try {
        const meta = typeof user?.metadata === "string" ? JSON.parse(user.metadata) : user?.metadata;
        if (meta?.registration) {
          const reg = meta.registration;
          if (reg.hazmatEndorsed || reg.hazmatClasses?.length) hazmatAuthorized = true;
          if (reg.tankerEndorsed) tankerEndorsed = true;
          if (reg.cdlState) cdlState = reg.cdlState;
          if (reg.cdlEndorsements) endorsements = reg.cdlEndorsements;
          if (reg.hazmatEndorsement) hazmatAuthorized = true;
          if (reg.tankerEndorsement) tankerEndorsed = true;
        }
      } catch {}

      let reqs: any[] = [];
      if (role === "DRIVER") {
        const profile = resolveDriverCompliance({
          userId, companyId: companyId || undefined,
          cdlState: cdlState || companyState, companyState,
          role: "DRIVER", endorsements,
          hazmatEndorsed: hazmatAuthorized, tankerEndorsed,
        });
        reqs = profile.requirements;
      } else {
        const profile = resolveCompanyCompliance({
          companyId, state: companyState, role,
          hazmatAuthorized, tankerEndorsed,
        });
        reqs = profile.requirements;
      }

      return reqs
        .filter((r: any) => r.priority === "CRITICAL" || r.priority === "HIGH")
        .map((r: any) => {
          const uploaded = uploadedMap.get(r.documentTypeId);
          return {
            id: r.documentTypeId,
            type: r.documentTypeId,
            name: r.name,
            description: r.reason || r.description || "",
            required: r.priority === "CRITICAL",
            uploaded: !!uploaded,
            status: uploaded ? "uploaded" : "pending",
            expirationDate: uploaded?.expiryDate?.toISOString().split("T")[0] || null,
            downloadUrl: r.downloadUrl || null,
            sourceUrl: r.sourceUrl || null,
            statePortalUrl: r.statePortalUrl || null,
            group: r.group,
            priority: r.priority,
          };
        });
    }),

  /**
   * Upload document
   */
  uploadDocument: protectedProcedure
    .input(z.object({
      type: z.string(),
      fileUrl: z.string(),
      fileName: z.string().optional(),
      expirationDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = Number(ctx.user?.id) || 0;
      const companyId = Number(ctx.user?.companyId) || 0;

      if (!db) throw new Error("Database not available");

      const result = await db.insert(documents).values({
        name: input.fileName || input.type,
        type: input.type,
        fileUrl: input.fileUrl,
        userId,
        companyId,
        status: "pending",
        expiryDate: input.expirationDate ? new Date(input.expirationDate) : null,
      }).$returningId();

      // Check if all required docs for the "documents" step are now uploaded
      try {
        const role = ctx.user?.role || "DRIVER";
        let companyState = "";
        let hazmatAuthorized = false;
        let tankerEndorsed = false;
        let cdlState = "";
        let endorsements: string[] = [];

        const [userRow] = await db.select({ companyId: users.companyId, metadata: users.metadata })
          .from(users).where(eq(users.id, userId)).limit(1);
        if (userRow?.companyId) {
          const [company] = await db.select().from(companies).where(eq(companies.id, userRow.companyId)).limit(1);
          if (company) companyState = company.state || "";
        }
        try {
          const meta = typeof userRow?.metadata === "string" ? JSON.parse(userRow.metadata) : userRow?.metadata;
          if (meta?.registration) {
            const reg = meta.registration;
            if (reg.hazmatEndorsed || reg.hazmatClasses?.length) hazmatAuthorized = true;
            if (reg.tankerEndorsed) tankerEndorsed = true;
            if (reg.cdlState) cdlState = reg.cdlState;
            if (reg.cdlEndorsements) endorsements = reg.cdlEndorsements;
            if (reg.hazmatEndorsement) hazmatAuthorized = true;
            if (reg.tankerEndorsement) tankerEndorsed = true;
          }
        } catch {}

        let reqs: { documentTypeId: string; priority: string }[] = [];
        if (role === "DRIVER") {
          const profile = resolveDriverCompliance({
            userId, companyId: companyId || undefined,
            cdlState: cdlState || companyState, companyState,
            role: "DRIVER", endorsements,
            hazmatEndorsed: hazmatAuthorized, tankerEndorsed,
          });
          reqs = profile.requirements;
        } else {
          const profile = resolveCompanyCompliance({
            companyId, state: companyState, role,
            hazmatAuthorized, tankerEndorsed,
          });
          reqs = profile.requirements;
        }

        const requiredDocTypes = reqs
          .filter(r => r.priority === "CRITICAL" || r.priority === "HIGH")
          .map(r => r.documentTypeId);

        // Get all uploaded docs for this user
        const allDocs = await db.select({ type: documents.type })
          .from(documents).where(eq(documents.userId, userId));
        const uploadedTypes = new Set(allDocs.map(d => d.type));

        const allRequiredUploaded = requiredDocTypes.every(t => uploadedTypes.has(t));

        if (allRequiredUploaded && requiredDocTypes.length > 0) {
          // Mark documents step as documents_complete in onboarding progress metadata
          const [progress] = await db.select()
            .from(onboardingProgress)
            .where(eq(onboardingProgress.userId, userId))
            .limit(1);

          if (progress) {
            // Mark documents_complete in user metadata (don't auto-complete the step)
            const userMeta = (() => {
              try {
                return typeof userRow?.metadata === "string" ? JSON.parse(userRow.metadata) : (userRow?.metadata || {});
              } catch { return {}; }
            })();
            await db.update(users)
              .set({
                metadata: JSON.stringify({
                  ...userMeta,
                  onboarding_documents_complete: true,
                  documents_completed_at: new Date().toISOString(),
                }),
              })
              .where(eq(users.id, userId));
          }
        }
      } catch (docCheckErr) {
        logger.error('[Onboarding] document step check failed:', docCheckErr);
      }

      return { success: true, documentId: String(result[0]?.id) };
    }),
});
