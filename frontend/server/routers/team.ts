/**
 * TEAM ROUTER
 * tRPC procedures for team management
 */

import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, companies } from "../../drizzle/schema";

export const teamRouter = router({
  /**
   * Get team members for TeamManagement page
   */
  getMembers: protectedProcedure
    .input(z.object({ role: z.string().optional(), limit: z.number().optional().default(50) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const companyId = ctx.user?.companyId || 0;
        const conds: any[] = [eq(users.companyId, companyId), eq(users.isActive, true)];
        if (input.role) conds.push(eq(users.role, input.role as any));
        const rows = await db.select({
          id: users.id, name: users.name, email: users.email, phone: users.phone,
          role: users.role, isActive: users.isActive, isVerified: users.isVerified,
          profilePicture: users.profilePicture, lastSignedIn: users.lastSignedIn, createdAt: users.createdAt,
        }).from(users).where(and(...conds)).orderBy(desc(users.createdAt)).limit(input.limit);
        return rows.map(u => ({
          id: String(u.id), name: u.name || '', email: u.email || '', phone: u.phone || '',
          role: u.role, isActive: u.isActive, isVerified: u.isVerified,
          avatar: u.profilePicture || '', lastActive: u.lastSignedIn?.toISOString() || '',
          joinedAt: u.createdAt?.toISOString() || '',
        }));
      } catch (e) { console.error('[Team] getMembers error:', e); return []; }
    }),

  /**
   * Get roles for TeamManagement page
   */
  getRoles: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const companyId = ctx.user?.companyId || 0;
        const rows = await db.select({
          role: users.role, count: sql<number>`COUNT(*)`,
        }).from(users).where(and(eq(users.companyId, companyId), eq(users.isActive, true))).groupBy(users.role);
        return rows.map(r => ({ role: r.role, count: r.count || 0 }));
      } catch { return []; }
    }),

  /**
   * Get pending invites for TeamManagement page
   */
  getPendingInvites: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb(); if (!db) return [];
      try {
        const companyId = ctx.user?.companyId || 0;
        const rows = await db.select({
          id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt,
        }).from(users).where(and(eq(users.companyId, companyId), eq(users.isVerified, false))).orderBy(desc(users.createdAt));
        return rows.map(u => ({
          id: String(u.id), email: u.email || '', role: u.role, name: u.name || '',
          invitedAt: u.createdAt?.toISOString() || '', status: 'pending',
        }));
      } catch { return []; }
    }),

  /**
   * Invite team member mutation
   */
  invite: protectedProcedure
    .input(z.object({ email: z.string().email(), role: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error('Database unavailable');
      const companyId = ctx.user?.companyId || 0;
      // Check if user already exists
      const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
      if (existing) throw new Error('User with this email already exists');
      const openId = `invite_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const [result] = await db.insert(users).values({
        openId, email: input.email, role: input.role as any,
        companyId, isActive: true, isVerified: false,
      }).$returningId();
      return { success: true, inviteId: String(result.id), email: input.email, sentAt: new Date().toISOString() };
    }),

  /**
   * Remove team member mutation
   */
  remove: protectedProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error('Database unavailable');
      const memberId = parseInt(input.memberId);
      // Prevent self-removal
      if (memberId === ctx.user?.id) throw new Error('Cannot remove yourself');
      await db.update(users).set({ isActive: false }).where(and(
        eq(users.id, memberId), eq(users.companyId, ctx.user?.companyId || 0),
      ));
      return { success: true, removedId: input.memberId };
    }),

  /**
   * Update member role mutation
   */
  updateRole: protectedProcedure
    .input(z.object({ memberId: z.string(), role: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error('Database unavailable');
      const memberId = parseInt(input.memberId);
      await db.update(users).set({ role: input.role as any }).where(and(
        eq(users.id, memberId), eq(users.companyId, ctx.user?.companyId || 0),
      ));
      return { success: true, memberId: input.memberId, newRole: input.role };
    }),
});
