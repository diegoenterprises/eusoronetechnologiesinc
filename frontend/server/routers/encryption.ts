/**
 * ENCRYPTION ROUTER — E2E Key Management
 * Handles public key storage/retrieval for ECDH key exchange.
 * Private keys NEVER touch the server — they stay in the client's IndexedDB.
 */

import { z } from "zod";
import { isolatedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, channelMembers, groupChannels } from "../../drizzle/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

async function resolveUserId(ctxUser: any): Promise<number> {
  if (typeof ctxUser?.id === "number") return ctxUser.id;
  const db = await getDb();
  if (!db || !ctxUser?.email) return 0;
  try {
    const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, ctxUser.email)).limit(1);
    return row?.id || 0;
  } catch { return 0; }
}

export const encryptionRouter = router({
  /**
   * Store the current user's ECDH public key (JWK format).
   * Called once on first login when keys are generated.
   */
  storePublicKey: protectedProcedure
    .input(z.object({ publicKey: z.string().min(10).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = await resolveUserId(ctx.user);
      if (!userId) throw new Error("User not found");

      await db.execute(
        sql`UPDATE users SET publicKey = ${input.publicKey} WHERE id = ${userId}`
      );

      return { success: true };
    }),

  /**
   * Get the current user's public key.
   */
  getMyPublicKey: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { publicKey: null };

      const userId = await resolveUserId(ctx.user);
      if (!userId) return { publicKey: null };

      const [row] = await db.execute(
        sql`SELECT publicKey FROM users WHERE id = ${userId} LIMIT 1`
      );
      return { publicKey: (row as any)?.publicKey || null };
    }),

  /**
   * Get public keys for a list of user IDs (for DM key exchange).
   */
  getPublicKeys: protectedProcedure
    .input(z.object({ userIds: z.array(z.number()) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      if (input.userIds.length === 0) return [];

      try {
        const rows = await db.execute(
          sql`SELECT id, publicKey FROM users WHERE id IN (${sql.join(input.userIds.map(id => sql`${id}`), sql`,`)}) AND publicKey IS NOT NULL`
        );

        return (rows as any[]).map((r: any) => ({
          userId: r.id,
          publicKey: r.publicKey,
        }));
      } catch (error) {
        console.error("[Encryption] getPublicKeys error:", error);
        return [];
      }
    }),

  /**
   * Get public key for a specific user by ID.
   */
  getUserPublicKey: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { publicKey: null };

      try {
        const [row] = await db.execute(
          sql`SELECT publicKey FROM users WHERE id = ${input.userId} LIMIT 1`
        );
        return { publicKey: (row as any)?.publicKey || null };
      } catch {
        return { publicKey: null };
      }
    }),

  /**
   * Store an encrypted group key for a channel member.
   * The channel creator encrypts the group AES key for each member.
   */
  storeChannelGroupKey: protectedProcedure
    .input(z.object({
      channelId: z.number(),
      memberId: z.number(),
      encryptedGroupKey: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify caller is a member of this channel (security: prevent cross-channel key injection)
      const callerId = await resolveUserId(ctx.user);
      if (!callerId) throw new Error("User not found");
      const [callerMembership] = await db.execute(
        sql`SELECT id FROM channel_members WHERE channelId = ${input.channelId} AND userId = ${callerId} LIMIT 1`
      );
      if (!callerMembership) throw new Error("Access denied: not a member of this channel");

      await db.execute(
        sql`UPDATE channel_members SET encryptedGroupKey = ${input.encryptedGroupKey} WHERE channelId = ${input.channelId} AND userId = ${input.memberId}`
      );

      return { success: true };
    }),

  /**
   * Get the encrypted group key for the current user on a channel.
   */
  getMyChannelGroupKey: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { encryptedGroupKey: null, creatorId: null };

      const userId = await resolveUserId(ctx.user);
      if (!userId) return { encryptedGroupKey: null, creatorId: null };

      try {
        const [membership] = await db.execute(
          sql`SELECT encryptedGroupKey FROM channel_members WHERE channelId = ${input.channelId} AND userId = ${userId} LIMIT 1`
        );
        const [channel] = await db.execute(
          sql`SELECT groupKeyCreatorId FROM group_channels WHERE id = ${input.channelId} LIMIT 1`
        );

        return {
          encryptedGroupKey: (membership as any)?.encryptedGroupKey || null,
          creatorId: (channel as any)?.groupKeyCreatorId || null,
        };
      } catch {
        return { encryptedGroupKey: null, creatorId: null };
      }
    }),

  /**
   * Set the group key creator for a channel (so members know whose public key to use).
   */
  setChannelKeyCreator: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = await resolveUserId(ctx.user);
      if (!userId) throw new Error("User not found");

      // Verify caller is a member of this channel (security: prevent cross-channel key creator spoofing)
      const [membership] = await db.execute(
        sql`SELECT id FROM channel_members WHERE channelId = ${input.channelId} AND userId = ${userId} LIMIT 1`
      );
      if (!membership) throw new Error("Access denied: not a member of this channel");

      await db.execute(
        sql`UPDATE group_channels SET groupKeyCreatorId = ${userId} WHERE id = ${input.channelId}`
      );

      return { success: true, creatorId: userId };
    }),

  /**
   * Get encryption status overview for the current user.
   */
  getStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { hasPublicKey: false, keyCreatedAt: null };

      const userId = await resolveUserId(ctx.user);
      if (!userId) return { hasPublicKey: false, keyCreatedAt: null };

      try {
        const [row] = await db.execute(
          sql`SELECT publicKey FROM users WHERE id = ${userId} LIMIT 1`
        );
        return {
          hasPublicKey: !!(row as any)?.publicKey,
          keyCreatedAt: null,
        };
      } catch {
        return { hasPublicKey: false, keyCreatedAt: null };
      }
    }),
});
