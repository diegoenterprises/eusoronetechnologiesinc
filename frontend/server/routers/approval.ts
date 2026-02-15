/**
 * APPROVAL MANAGEMENT ROUTER
 * Admin endpoints for reviewing and approving/suspending user accounts.
 * 
 * Flow: pending_review -> approved | suspended
 * Only ADMIN and SUPER_ADMIN can manage approvals.
 */

import { z } from "zod";
import { eq, and, sql, desc, like, or } from "drizzle-orm";
import { router, auditedProtectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users, companies, vehicles } from "../../drizzle/schema";

const approvalStatusEnum = z.enum(["pending_review", "approved", "suspended"]);

export const approvalRouter = router({
  /**
   * Get all users pending approval
   */
  getPendingUsers: auditedProtectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(25),
      role: z.string().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userRole = (ctx.user as any)?.role;
      if (!["ADMIN", "SUPER_ADMIN"].includes(userRole)) {
        throw new Error("Unauthorized: Admin access required");
      }

      const page = input?.page || 1;
      const limit = input?.limit || 25;
      const offset = (page - 1) * limit;

      // Get all non-admin users
      const allUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          role: users.role,
          companyId: users.companyId,
          isVerified: users.isVerified,
          isActive: users.isActive,
          metadata: users.metadata,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(
          and(
            // Exclude admin roles from approval queue
            sql`${users.role} NOT IN ('ADMIN', 'SUPER_ADMIN')`,
            users.isActive,
          )
        )
        .orderBy(desc(users.createdAt));

      // Parse metadata and filter by approval status
      // IMPORTANT: Only explicit approvalStatus counts. No isVerified fallback.
      const parsed = allUsers.map(u => {
        let meta: any = {};
        try {
          meta = u.metadata ? JSON.parse(u.metadata as string) : {};
        } catch {}
        const approvalStatus = meta.approvalStatus || "pending_review";
        return { ...u, approvalStatus, meta };
      });

      // Filter by pending status
      let filtered = parsed.filter(u => u.approvalStatus === "pending_review");

      // Optional role filter
      if (input?.role) {
        filtered = filtered.filter(u => u.role === input.role);
      }

      // Optional search
      if (input?.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(u =>
          (u.name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q)
        );
      }

      const total = filtered.length;
      const items = filtered.slice(offset, offset + limit);

      // Fetch full company details for users with companyId
      const companyIds = Array.from(new Set(items.filter(u => u.companyId).map(u => u.companyId!)));
      let companyMap: Record<number, any> = {};
      if (companyIds.length > 0) {
        const companyRows = await db
          .select()
          .from(companies)
          .where(sql`${companies.id} IN (${sql.join(companyIds.map(id => sql`${id}`), sql`, `)})`);
        companyMap = Object.fromEntries(companyRows.map(c => [c.id, c]));
      }

      return {
        items: items.map(u => {
          const company = u.companyId ? companyMap[u.companyId] || null : null;
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: u.role,
            isVerified: u.isVerified,
            approvalStatus: u.approvalStatus,
            createdAt: u.createdAt,
            registrationData: u.meta?.registration || null,
            companyName: company?.name || null,
            company: company ? {
              id: company.id,
              name: company.name,
              legalName: company.legalName,
              dotNumber: company.dotNumber,
              mcNumber: company.mcNumber,
              ein: company.ein,
              address: company.address,
              city: company.city,
              state: company.state,
              zipCode: company.zipCode,
              phone: company.phone,
              email: company.email,
              website: company.website,
              complianceStatus: company.complianceStatus,
              insuranceExpiry: company.insuranceExpiry,
              twicExpiry: company.twicExpiry,
              hazmatExpiry: company.hazmatExpiry,
              createdAt: company.createdAt,
            } : null,
          };
        }),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }),

  /**
   * Get all users with their approval status (for admin user management)
   */
  getAllUsersWithStatus: auditedProtectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(50),
      status: approvalStatusEnum.optional(),
      role: z.string().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userRole = (ctx.user as any)?.role;
      if (!["ADMIN", "SUPER_ADMIN"].includes(userRole)) {
        throw new Error("Unauthorized: Admin access required");
      }

      const page = input?.page || 1;
      const limit = input?.limit || 50;
      const offset = (page - 1) * limit;

      const allUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          companyId: users.companyId,
          isVerified: users.isVerified,
          isActive: users.isActive,
          metadata: users.metadata,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(sql`${users.role} NOT IN ('ADMIN', 'SUPER_ADMIN')`)
        .orderBy(desc(users.createdAt));

      const parsed = allUsers.map(u => {
        let meta: any = {};
        try { meta = u.metadata ? JSON.parse(u.metadata as string) : {}; } catch {}
        return {
          ...u,
          approvalStatus: meta.approvalStatus || "pending_review",
        };
      });

      let filtered = parsed;
      if (input?.status) filtered = filtered.filter(u => u.approvalStatus === input.status);
      if (input?.role) filtered = filtered.filter(u => u.role === input.role);
      if (input?.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter(u =>
          (u.name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q)
        );
      }

      const total = filtered.length;
      const items = filtered.slice(offset, offset + limit);

      return { items, total, page, totalPages: Math.ceil(total / limit) };
    }),

  /**
   * Approve a user account
   */
  approveUser: auditedProtectedProcedure
    .input(z.object({
      userId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userRole = (ctx.user as any)?.role;
      if (!["ADMIN", "SUPER_ADMIN"].includes(userRole)) {
        throw new Error("Unauthorized: Admin access required");
      }

      // Get current user
      const [targetUser] = await db
        .select({ id: users.id, metadata: users.metadata, email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!targetUser) throw new Error("User not found");

      // Parse existing metadata and update approval status
      let meta: any = {};
      try { meta = targetUser.metadata ? JSON.parse(targetUser.metadata as string) : {}; } catch {}

      meta.approvalStatus = "approved";
      meta.approvedAt = new Date().toISOString();
      meta.approvedBy = (ctx.user as any)?.email || "admin";
      if (input.notes) meta.approvalNotes = input.notes;

      await db.update(users).set({
        metadata: JSON.stringify(meta),
        isVerified: true,
      }).where(eq(users.id, input.userId));

      console.log(`[Approval] User ${targetUser.email} (${targetUser.name}) approved by ${meta.approvedBy}`);

      return { success: true, userId: input.userId, status: "approved" };
    }),

  /**
   * Suspend a user account
   */
  suspendUser: auditedProtectedProcedure
    .input(z.object({
      userId: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userRole = (ctx.user as any)?.role;
      if (!["ADMIN", "SUPER_ADMIN"].includes(userRole)) {
        throw new Error("Unauthorized: Admin access required");
      }

      const [targetUser] = await db
        .select({ id: users.id, metadata: users.metadata, email: users.email })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!targetUser) throw new Error("User not found");

      let meta: any = {};
      try { meta = targetUser.metadata ? JSON.parse(targetUser.metadata as string) : {}; } catch {}

      meta.approvalStatus = "suspended";
      meta.suspendedAt = new Date().toISOString();
      meta.suspendedBy = (ctx.user as any)?.email || "admin";
      meta.suspensionReason = input.reason;

      await db.update(users).set({
        metadata: JSON.stringify(meta),
      }).where(eq(users.id, input.userId));

      console.log(`[Approval] User ${targetUser.email} suspended by ${meta.suspendedBy}: ${input.reason}`);

      return { success: true, userId: input.userId, status: "suspended" };
    }),

  /**
   * Revert a suspension (put back to pending_review)
   */
  unsuspendUser: auditedProtectedProcedure
    .input(z.object({
      userId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userRole = (ctx.user as any)?.role;
      if (!["ADMIN", "SUPER_ADMIN"].includes(userRole)) {
        throw new Error("Unauthorized: Admin access required");
      }

      const [targetUser] = await db
        .select({ id: users.id, metadata: users.metadata })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!targetUser) throw new Error("User not found");

      let meta: any = {};
      try { meta = targetUser.metadata ? JSON.parse(targetUser.metadata as string) : {}; } catch {}

      meta.approvalStatus = "pending_review";
      meta.unsuspendedAt = new Date().toISOString();
      meta.unsuspendedBy = (ctx.user as any)?.email || "admin";
      delete meta.suspensionReason;

      await db.update(users).set({
        metadata: JSON.stringify(meta),
      }).where(eq(users.id, input.userId));

      return { success: true, userId: input.userId, status: "pending_review" };
    }),

  /**
   * Get approval stats (counts by status)
   */
  getStats: auditedProtectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userRole = (ctx.user as any)?.role;
      if (!["ADMIN", "SUPER_ADMIN"].includes(userRole)) {
        throw new Error("Unauthorized: Admin access required");
      }

      const allUsers = await db
        .select({ metadata: users.metadata, isVerified: users.isVerified, role: users.role })
        .from(users)
        .where(
          and(
            sql`${users.role} NOT IN ('ADMIN', 'SUPER_ADMIN')`,
            users.isActive,
          )
        );

      let pending = 0, approved = 0, suspended = 0;
      for (const u of allUsers) {
        let meta: any = {};
        try { meta = u.metadata ? JSON.parse(u.metadata as string) : {}; } catch {}
        const status = meta.approvalStatus || "pending_review";
        if (status === "pending_review") pending++;
        else if (status === "approved") approved++;
        else if (status === "suspended") suspended++;
      }

      return { pending, approved, suspended, total: allUsers.length };
    }),

  /**
   * Fix missing approvalStatus in metadata for all non-admin users.
   * Sets pending_review for users with no approvalStatus.
   * Only SUPER_ADMIN can run this.
   */
  fixMissingApprovalStatus: auditedProtectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userRole = (ctx.user as any)?.role;
      if (userRole !== "SUPER_ADMIN") {
        throw new Error("Unauthorized: Super Admin access required");
      }

      const allUsers = await db
        .select({ id: users.id, metadata: users.metadata, role: users.role, email: users.email })
        .from(users)
        .where(
          and(
            sql`${users.role} NOT IN ('ADMIN', 'SUPER_ADMIN')`,
            users.isActive,
          )
        );

      let fixed = 0;
      let rolesFixed = 0;
      for (const u of allUsers) {
        let meta: any = {};
        try { meta = u.metadata ? JSON.parse(u.metadata as string) : {}; } catch {}

        const updates: any = {};

        if (!meta.approvalStatus) {
          meta.approvalStatus = "pending_review";
          updates.metadata = JSON.stringify(meta);
          fixed++;
          console.log(`[ApprovalFix] Set pending_review for user ${u.email} (${u.role})`);
        }

        // Fix legacy CARRIER → CATALYST role rename
        if ((u.role as string) === "CARRIER") {
          updates.role = "CATALYST";
          rolesFixed++;
          console.log(`[ApprovalFix] Renamed role CARRIER → CATALYST for user ${u.email}`);
        }

        // Fix legacy carrier email → catalyst email
        if (u.email === "carrier@eusotrip.com") {
          updates.email = "catalyst@eusotrip.com";
          console.log(`[ApprovalFix] Renamed email carrier@eusotrip.com → catalyst@eusotrip.com`);
        }

        if (Object.keys(updates).length > 0) {
          if (updates.metadata === undefined && (updates.role || updates.email)) {
            updates.metadata = JSON.stringify(meta);
          }
          await db.update(users).set(updates).where(eq(users.id, u.id));
        }
      }

      return { success: true, fixed, rolesFixed, total: allUsers.length };
    }),

  /**
   * Reset specific users to pending_review by email.
   * SUPER_ADMIN only. Used to put accounts back into the approval queue.
   */
  resetUserToPending: auditedProtectedProcedure
    .input(z.object({
      emails: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userRole = (ctx.user as any)?.role;
      if (userRole !== "SUPER_ADMIN") {
        throw new Error("Unauthorized: Super Admin access required");
      }

      const results: { email: string; status: string }[] = [];

      for (const email of input.emails) {
        const [target] = await db
          .select({ id: users.id, email: users.email, metadata: users.metadata, role: users.role })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!target) {
          results.push({ email, status: "not_found" });
          continue;
        }

        // Don't reset admins
        if (["ADMIN", "SUPER_ADMIN"].includes(target.role!)) {
          results.push({ email, status: "skipped_admin" });
          continue;
        }

        let meta: any = {};
        try { meta = target.metadata ? JSON.parse(target.metadata as string) : {}; } catch {}

        meta.approvalStatus = "pending_review";
        delete meta.approvedAt;
        delete meta.approvedBy;
        delete meta.approvalNotes;

        await db.update(users).set({
          metadata: JSON.stringify(meta),
        }).where(eq(users.id, target.id));

        console.log(`[Approval] Reset ${email} (${target.role}) to pending_review by ${(ctx.user as any)?.email}`);
        results.push({ email, status: "reset_to_pending" });
      }

      return { success: true, results };
    }),

  /**
   * Get detailed user info for approval review
   */
  getUserDetail: auditedProtectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userRole = (ctx.user as any)?.role;
      if (!["ADMIN", "SUPER_ADMIN"].includes(userRole)) {
        throw new Error("Unauthorized: Admin access required");
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!user) throw new Error("User not found");

      let meta: any = {};
      try { meta = user.metadata ? JSON.parse(user.metadata as string) : {}; } catch {}

      // Get company details
      let company: any = null;
      if (user.companyId) {
        const [c] = await db
          .select()
          .from(companies)
          .where(eq(companies.id, user.companyId))
          .limit(1);
        company = c || null;
      }

      // Get vehicle count for this user's company
      let vehicleCount = 0;
      if (user.companyId) {
        try {
          const [vc] = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(vehicles)
            .where(eq(vehicles.companyId, user.companyId));
          vehicleCount = vc?.count || 0;
        } catch {}
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastSignedIn: user.lastSignedIn,
        loginMethod: user.loginMethod,
        approvalStatus: meta.approvalStatus || "pending_review",
        metadata: meta,
        company,
        vehicleCount,
      };
    }),
});
