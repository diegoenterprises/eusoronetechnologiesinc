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
import { users, companies } from "../../drizzle/schema";

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
      const parsed = allUsers.map(u => {
        let meta: any = {};
        try {
          meta = u.metadata ? JSON.parse(u.metadata as string) : {};
        } catch {}
        const approvalStatus = meta.approvalStatus || (u.isVerified ? "approved" : "pending_review");
        return { ...u, approvalStatus, registrationData: meta.registration || null };
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

      // Fetch company names for users with companyId
      const companyIds = Array.from(new Set(items.filter(u => u.companyId).map(u => u.companyId!)));
      let companyMap: Record<number, string> = {};
      if (companyIds.length > 0) {
        const companyRows = await db
          .select({ id: companies.id, name: companies.name })
          .from(companies)
          .where(sql`${companies.id} IN (${sql.join(companyIds.map(id => sql`${id}`), sql`, `)})`);
        companyMap = Object.fromEntries(companyRows.map(c => [c.id, c.name]));
      }

      return {
        items: items.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          companyName: u.companyId ? companyMap[u.companyId] || null : null,
          approvalStatus: u.approvalStatus,
          registrationData: u.registrationData,
          createdAt: u.createdAt,
        })),
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
          approvalStatus: meta.approvalStatus || (u.isVerified ? "approved" : "pending_review"),
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
        const status = meta.approvalStatus || (u.isVerified ? "approved" : "pending_review");
        if (status === "pending_review") pending++;
        else if (status === "approved") approved++;
        else if (status === "suspended") suspended++;
      }

      return { pending, approved, suspended, total: allUsers.length };
    }),
});
