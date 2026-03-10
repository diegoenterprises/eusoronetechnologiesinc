/**
 * TEAM ROUTER
 * tRPC procedures for team management
 */

import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { logger } from "../_core/logger";
import { emailService } from "../_core/email";
import { getDb } from "../db";
import { users, companies, auditLogs } from "../../drizzle/schema";
import { unsafeCast } from "../_core/types/unsafe";

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
        if (input.role) conds.push(eq(users.role, unsafeCast(input.role)));
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
      } catch (e) { logger.error('[Team] getMembers error:', e); return []; }
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
      const openId = `invite_${Date.now()}_${randomBytes(4).toString('hex')}`;
      // Generate verification token
      const verification = emailService.generateVerificationToken(input.email);
      const [result] = await db.insert(users).values({
        openId, email: input.email, role: unsafeCast(input.role),
        companyId, isActive: true, isVerified: false,
        metadata: JSON.stringify({
          verificationToken: verification.token,
          verificationExpiry: verification.expiresAt.toISOString(),
        }),
      }).$returningId();

      // Send verification email (don't break user creation on failure)
      try {
        await emailService.sendVerificationEmail(input.email, verification.token);
      } catch (emailErr) {
        logger.error('[Team] invite email failed:', emailErr);
      }

      // Audit log
      try {
        await db.insert(auditLogs).values({
          userId: ctx.user?.id ?? null,
          action: 'invite_team_member',
          entityType: 'team_invite',
          entityId: result.id,
          metadata: { email: input.email, role: input.role, companyId } as unknown as Record<string, unknown>,
        });
      } catch (auditErr) {
        logger.error('[Team] audit log failed:', auditErr);
      }

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
   * Resend invite to an unverified team member
   */
  resendInvite: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error('Database unavailable');
      const companyId = ctx.user?.companyId || 0;
      // Find the unverified user in the same company
      const [target] = await db.select({ id: users.id, email: users.email, name: users.name, isVerified: users.isVerified })
        .from(users)
        .where(and(eq(users.id, input.userId), eq(users.companyId, companyId)))
        .limit(1);
      if (!target) throw new Error('User not found in your company');
      if (target.isVerified) throw new Error('User is already verified');

      // Generate new verification token
      const verification = emailService.generateVerificationToken(target.email || '', target.id);
      await db.update(users)
        .set({
          metadata: JSON.stringify({
            verificationToken: verification.token,
            verificationExpiry: verification.expiresAt.toISOString(),
          }),
        })
        .where(eq(users.id, target.id));

      // Send verification email
      await emailService.sendVerificationEmail(target.email || '', verification.token, target.name || undefined);

      // Audit log
      try {
        await db.insert(auditLogs).values({
          userId: ctx.user?.id ?? null,
          action: 'resend_invite',
          entityType: 'team_invite',
          entityId: target.id,
          metadata: { email: target.email, companyId } as unknown as Record<string, unknown>,
        });
      } catch (auditErr) {
        logger.error('[Team] resend invite audit log failed:', auditErr);
      }

      return { success: true, email: target.email, resentAt: new Date().toISOString() };
    }),

  /**
   * Update member role mutation
   */
  updateRole: protectedProcedure
    .input(z.object({ memberId: z.string(), role: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error('Database unavailable');
      const memberId = parseInt(input.memberId);
      await db.update(users).set({ role: unsafeCast(input.role) }).where(and(
        eq(users.id, memberId), eq(users.companyId, ctx.user?.companyId || 0),
      ));
      return { success: true, memberId: input.memberId, newRole: input.role };
    }),
});
