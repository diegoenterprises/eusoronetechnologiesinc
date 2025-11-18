import { z } from "zod";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";

export const usersRouter = router({
  // Get current user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(users)
        .set({
          name: input.name,
          email: input.email,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return { success: true };
    }),

  // Update notification preferences
  updateNotifications: protectedProcedure
    .input(
      z.object({
        emailNotifications: z.boolean().optional(),
        smsNotifications: z.boolean().optional(),
        pushNotifications: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Store notification preferences in database
      // For now, just return success
      return { success: true, preferences: input };
    }),

  // Update security settings
  updateSecurity: protectedProcedure
    .input(
      z.object({
        twoFactorEnabled: z.boolean().optional(),
        currentPassword: z.string().optional(),
        newPassword: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement password change and 2FA
      // For now, just return success
      return { success: true };
    }),
});
