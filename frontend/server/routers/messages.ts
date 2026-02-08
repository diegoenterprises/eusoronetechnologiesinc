/**
 * MESSAGES ROUTER — OpenIM-Inspired Architecture
 * 100% Database-backed real-time messaging system
 * Powered by MySQL + WebSocket (no Twilio, no external IM servers)
 *
 * Features:
 * - Direct & group conversations
 * - Load-linked and support conversations
 * - Real-time message delivery via WebSocket
 * - Read receipts & typing indicators
 * - Message search
 * - Participant management
 * - Phone calls via mobile network (tel: links)
 */

import { z } from "zod";
import { eq, and, desc, sql, or, like, isNull } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { messages, users, conversations, conversationParticipants } from "../../drizzle/schema";
import { emitMessage } from "../_core/websocket";

// Resolve ctx.user to a numeric DB user ID (same pattern as loads.ts)
async function resolveUserId(ctxUser: any): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const email = ctxUser?.email || "";
  if (email) {
    try {
      const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (row) return row.id;
    } catch {}
  }
  return 0;
}

export const messagesRouter = router({
  /**
   * Get all conversations the current user participates in
   */
  getConversations: protectedProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const userId = await resolveUserId(ctx.user);
        if (!userId) return [];

        // Get conversations where user is a participant (via conversationParticipants table)
        const participantRows = await db
          .select({
            convId: conversationParticipants.conversationId,
            unreadCount: conversationParticipants.unreadCount,
            isPinned: conversationParticipants.isPinned,
            isMuted: conversationParticipants.isMuted,
            isArchived: conversationParticipants.isArchived,
          })
          .from(conversationParticipants)
          .where(and(
            eq(conversationParticipants.userId, userId),
            isNull(conversationParticipants.leftAt),
          ))
          .limit(100);

        if (participantRows.length === 0) {
          // Fallback: check conversations.participants JSON column for legacy data
          const legacyConvs = await db
            .select()
            .from(conversations)
            .where(sql`JSON_CONTAINS(${conversations.participants}, CAST(${userId} AS JSON))`)
            .orderBy(desc(conversations.lastMessageAt))
            .limit(50);

          if (legacyConvs.length === 0) return [];

          // Build results from legacy conversations
          return await Promise.all(legacyConvs.map(async (conv) => {
            // Get last message
            const [lastMsg] = await db.select({ content: messages.content, senderId: messages.senderId, createdAt: messages.createdAt })
              .from(messages).where(eq(messages.conversationId, conv.id)).orderBy(desc(messages.createdAt)).limit(1);

            // Get other participants
            const participantIds = (conv.participants as number[] || []).filter(id => id !== userId);
            let otherName = conv.name || "Conversation";
            if (participantIds.length > 0) {
              const [other] = await db.select({ name: users.name, profilePicture: users.profilePicture, role: users.role })
                .from(users).where(eq(users.id, participantIds[0])).limit(1);
              if (other?.name) otherName = other.name;
            }

            return {
              id: String(conv.id),
              name: otherName,
              participantName: otherName,
              type: conv.type || "direct",
              lastMessage: lastMsg?.content?.substring(0, 80) || "",
              lastMessageAt: (conv.lastMessageAt || conv.createdAt)?.toISOString() || "",
              unread: 0,
              unreadCount: 0,
              online: false,
              role: "user",
              loadId: conv.loadId,
              isPinned: false,
              isMuted: false,
            };
          }));
        }

        // Batch-fetch conversation details
        const convIds = participantRows.map(r => r.convId);
        const convRows = await db.select().from(conversations)
          .where(sql`${conversations.id} IN (${sql.raw(convIds.join(","))})`)
          .orderBy(desc(conversations.lastMessageAt));

        const convMap = new Map(convRows.map(c => [c.id, c]));

        // Build enriched conversation list
        const results = await Promise.all(participantRows.map(async (p) => {
          const conv = convMap.get(p.convId);
          if (!conv) return null;

          // Get last message for this conversation
          const [lastMsg] = await db.select({ content: messages.content, senderId: messages.senderId, createdAt: messages.createdAt })
            .from(messages).where(eq(messages.conversationId, conv.id)).orderBy(desc(messages.createdAt)).limit(1);

          // Get other participants' names
          const otherParticipants = await db.select({
            uId: conversationParticipants.userId,
          }).from(conversationParticipants)
            .where(and(
              eq(conversationParticipants.conversationId, conv.id),
              sql`${conversationParticipants.userId} != ${userId}`,
              isNull(conversationParticipants.leftAt),
            )).limit(10);

          let displayName = conv.name || "Conversation";
          let otherProfilePic: string | null = null;
          let otherRole = "user";
          if (otherParticipants.length > 0) {
            const [other] = await db.select({ name: users.name, profilePicture: users.profilePicture, role: users.role })
              .from(users).where(eq(users.id, otherParticipants[0].uId)).limit(1);
            if (other?.name) displayName = other.name;
            otherProfilePic = other?.profilePicture || null;
            otherRole = other?.role || "user";
          }

          return {
            id: String(conv.id),
            name: displayName,
            participantName: displayName,
            avatar: otherProfilePic,
            type: conv.type || "direct",
            lastMessage: lastMsg?.content?.substring(0, 80) || "",
            lastMessageAt: (lastMsg?.createdAt || conv.lastMessageAt || conv.createdAt)?.toISOString() || "",
            unread: p.unreadCount || 0,
            unreadCount: p.unreadCount || 0,
            online: false,
            role: otherRole,
            loadId: conv.loadId,
            isPinned: p.isPinned || false,
            isMuted: p.isMuted || false,
          };
        }));

        return results.filter(Boolean).sort((a: any, b: any) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
        });
      } catch (error) {
        console.error("[Messages] getConversations error:", error);
        return [];
      }
    }),

  /**
   * Get messages in a conversation (paginated, newest first)
   */
  getMessages: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      limit: z.number().default(50),
      before: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const userId = await resolveUserId(ctx.user);
        if (!userId) return [];
        const convId = parseInt(input.conversationId.replace("conv_", ""), 10) || parseInt(input.conversationId, 10);
        if (!convId) return [];

        // Build filters
        const filters: any[] = [eq(messages.conversationId, convId), isNull(messages.deletedAt)];
        if (input.before) {
          filters.push(sql`${messages.id} < ${parseInt(input.before.replace("msg_", ""), 10) || 0}`);
        }

        const messageList = await db.select({
          id: messages.id,
          conversationId: messages.conversationId,
          senderId: messages.senderId,
          messageType: messages.messageType,
          content: messages.content,
          metadata: messages.metadata,
          readBy: messages.readBy,
          createdAt: messages.createdAt,
        }).from(messages)
          .where(and(...filters))
          .orderBy(desc(messages.createdAt))
          .limit(input.limit);

        // Batch-fetch sender names
        const senderIds = Array.from(new Set(messageList.map(m => m.senderId).filter(Boolean)));
        const senderMap = new Map<number, { name: string; profilePicture: string | null }>();
        if (senderIds.length > 0) {
          const senders = await db.select({ id: users.id, name: users.name, profilePicture: users.profilePicture })
            .from(users)
            .where(sql`${users.id} IN (${sql.raw(senderIds.join(","))})`);
          for (const s of senders) {
            senderMap.set(s.id, { name: s.name || "Unknown", profilePicture: s.profilePicture });
          }
        }

        // Return messages in chronological order (oldest first for display)
        return messageList.reverse().map(msg => {
          const sender = senderMap.get(msg.senderId);
          const readByArray = msg.readBy as number[] || [];
          return {
            id: String(msg.id),
            conversationId: input.conversationId,
            senderId: String(msg.senderId),
            senderName: sender?.name || "Unknown",
            senderAvatar: sender?.profilePicture || null,
            content: msg.content || "",
            type: msg.messageType || "text",
            metadata: msg.metadata,
            timestamp: msg.createdAt?.toISOString() || "",
            read: readByArray.includes(userId),
            isOwn: msg.senderId === userId,
          };
        });
      } catch (error) {
        console.error("[Messages] getMessages error:", error);
        return [];
      }
    }),

  /**
   * Send a message — writes to DB and emits WebSocket event
   */
  sendMessage: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      content: z.string().min(1),
      type: z.enum(["text", "image", "document", "location", "voice_message", "contact_card", "system_notification"]).default("text"),
      metadata: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = await resolveUserId(ctx.user);
      if (!userId) throw new Error("User not found");

      const convId = parseInt(input.conversationId.replace("conv_", ""), 10) || parseInt(input.conversationId, 10);
      if (!convId) throw new Error("Invalid conversation ID");

      // Insert message into DB
      const result = await db.insert(messages).values({
        conversationId: convId,
        senderId: userId,
        messageType: input.type as any,
        content: input.content,
        metadata: input.metadata || null,
        readBy: [userId],
      });
      const msgId = (result as any).insertId || (result as any)[0]?.insertId || 0;

      // Update conversation's lastMessageAt
      await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, convId)).catch(() => {});

      // Increment unread count for all other participants
      await db.update(conversationParticipants)
        .set({ unreadCount: sql`${conversationParticipants.unreadCount} + 1` })
        .where(and(
          eq(conversationParticipants.conversationId, convId),
          sql`${conversationParticipants.userId} != ${userId}`,
        )).catch(() => {});

      // Get sender info for WebSocket payload
      const [sender] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);

      // Emit real-time WebSocket event to all participants
      try {
        emitMessage({
          conversationId: String(convId),
          messageId: String(msgId),
          senderId: String(userId),
          senderName: sender?.name || "User",
          content: input.content,
          messageType: input.type,
          timestamp: new Date().toISOString(),
        } as any);
      } catch {}

      return {
        id: String(msgId),
        conversationId: String(convId),
        senderId: String(userId),
        senderName: sender?.name || "User",
        content: input.content,
        type: input.type,
        timestamp: new Date().toISOString(),
        read: false,
        isOwn: true,
      };
    }),

  /**
   * Shorthand send (used by MessagingCenter.tsx)
   */
  send: protectedProcedure
    .input(z.object({ conversationId: z.string(), content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = await resolveUserId(ctx.user);
      if (!userId) throw new Error("User not found");

      const convId = parseInt(input.conversationId.replace("conv_", ""), 10) || parseInt(input.conversationId, 10);
      if (!convId) throw new Error("Invalid conversation ID");

      const result = await db.insert(messages).values({
        conversationId: convId,
        senderId: userId,
        messageType: "text" as any,
        content: input.content,
        readBy: [userId],
      });
      const msgId = (result as any).insertId || (result as any)[0]?.insertId || 0;

      await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, convId)).catch(() => {});
      await db.update(conversationParticipants)
        .set({ unreadCount: sql`${conversationParticipants.unreadCount} + 1` })
        .where(and(eq(conversationParticipants.conversationId, convId), sql`${conversationParticipants.userId} != ${userId}`))
        .catch(() => {});

      return { success: true, messageId: String(msgId) };
    }),

  /**
   * Create a new conversation
   */
  createConversation: protectedProcedure
    .input(z.object({
      participantIds: z.array(z.number()),
      type: z.enum(["direct", "group", "job", "channel", "company", "support"]).default("direct"),
      name: z.string().optional(),
      loadId: z.number().optional(),
      initialMessage: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = await resolveUserId(ctx.user);
      if (!userId) throw new Error("User not found");

      // For direct messages, check if a conversation already exists between these two users
      if (input.type === "direct" && input.participantIds.length === 1) {
        const otherId = input.participantIds[0];
        const existing = await db.select({ convId: conversationParticipants.conversationId })
          .from(conversationParticipants)
          .where(and(
            eq(conversationParticipants.userId, userId),
            isNull(conversationParticipants.leftAt),
          )).limit(100);

        for (const e of existing) {
          const [otherP] = await db.select({ userId: conversationParticipants.userId })
            .from(conversationParticipants)
            .where(and(
              eq(conversationParticipants.conversationId, e.convId),
              eq(conversationParticipants.userId, otherId),
              isNull(conversationParticipants.leftAt),
            )).limit(1);
          if (otherP) {
            return { id: String(e.convId), createdAt: new Date().toISOString(), existing: true };
          }
        }
      }

      // Create the conversation
      const allParticipants = Array.from(new Set([userId, ...input.participantIds]));
      const convResult = await db.insert(conversations).values({
        type: input.type as any,
        name: input.name || null,
        loadId: input.loadId || null,
        participants: allParticipants,
        lastMessageAt: new Date(),
      });
      const convId = (convResult as any).insertId || (convResult as any)[0]?.insertId || 0;

      // Add participants to conversation_participants table
      for (const pId of allParticipants) {
        await db.insert(conversationParticipants).values({
          conversationId: convId,
          userId: pId,
          role: pId === userId ? "owner" as any : "member" as any,
        }).catch(() => {});
      }

      // Send initial message if provided
      if (input.initialMessage) {
        await db.insert(messages).values({
          conversationId: convId,
          senderId: userId,
          messageType: "text" as any,
          content: input.initialMessage,
          readBy: [userId],
        }).catch(() => {});
      }

      return { id: String(convId), createdAt: new Date().toISOString(), existing: false };
    }),

  /**
   * Mark all messages in a conversation as read for the current user
   */
  markAsRead: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      messageIds: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false, conversationId: input.conversationId, markedCount: 0 };

      const userId = await resolveUserId(ctx.user);
      if (!userId) return { success: false, conversationId: input.conversationId, markedCount: 0 };

      const convId = parseInt(input.conversationId.replace("conv_", ""), 10) || parseInt(input.conversationId, 10);
      if (!convId) return { success: false, conversationId: input.conversationId, markedCount: 0 };

      try {
        // Reset unread count in conversation_participants
        await db.update(conversationParticipants)
          .set({ unreadCount: 0, lastReadAt: new Date() })
          .where(and(
            eq(conversationParticipants.conversationId, convId),
            eq(conversationParticipants.userId, userId),
          ));

        // Update readBy JSON array on unread messages
        await db.execute(sql`
          UPDATE messages
          SET readBy = JSON_ARRAY_APPEND(COALESCE(readBy, JSON_ARRAY()), '$', ${userId})
          WHERE conversationId = ${convId}
            AND NOT JSON_CONTAINS(COALESCE(readBy, JSON_ARRAY()), CAST(${userId} AS JSON))
        `).catch(() => {});

        return { success: true, conversationId: input.conversationId, markedCount: 1 };
      } catch (error) {
        console.error("[Messages] markAsRead error:", error);
        return { success: false, conversationId: input.conversationId, markedCount: 0 };
      }
    }),

  /**
   * Get total unread message count across all conversations
   */
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { total: 0, byConversation: {} };

      try {
        const userId = await resolveUserId(ctx.user);
        if (!userId) return { total: 0, byConversation: {} };

        const rows = await db.select({
          conversationId: conversationParticipants.conversationId,
          unreadCount: conversationParticipants.unreadCount,
        }).from(conversationParticipants)
          .where(and(
            eq(conversationParticipants.userId, userId),
            isNull(conversationParticipants.leftAt),
            sql`${conversationParticipants.unreadCount} > 0`,
          ));

        const byConversation: Record<string, number> = {};
        let total = 0;
        for (const r of rows) {
          const count = r.unreadCount || 0;
          byConversation[String(r.conversationId)] = count;
          total += count;
        }

        return { total, byConversation };
      } catch (error) {
        console.error("[Messages] getUnreadCount error:", error);
        return { total: 0, byConversation: {} };
      }
    }),

  /**
   * Search messages across all user's conversations
   */
  search: protectedProcedure
    .input(z.object({
      query: z.string().min(1),
      conversationId: z.string().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { results: [], total: 0 };

      try {
        const userId = await resolveUserId(ctx.user);
        if (!userId) return { results: [], total: 0 };

        const filters: any[] = [
          sql`${messages.content} LIKE ${`%${input.query}%`}`,
          isNull(messages.deletedAt),
        ];

        if (input.conversationId) {
          const convId = parseInt(input.conversationId.replace("conv_", ""), 10) || parseInt(input.conversationId, 10);
          if (convId) filters.push(eq(messages.conversationId, convId));
        }

        const results = await db.select({
          id: messages.id,
          conversationId: messages.conversationId,
          senderId: messages.senderId,
          content: messages.content,
          createdAt: messages.createdAt,
        }).from(messages)
          .where(and(...filters))
          .orderBy(desc(messages.createdAt))
          .limit(input.limit);

        // Batch-fetch sender names
        const senderIds = Array.from(new Set(results.map(r => r.senderId).filter(Boolean)));
        const senderMap = new Map<number, string>();
        if (senderIds.length > 0) {
          const senders = await db.select({ id: users.id, name: users.name }).from(users)
            .where(sql`${users.id} IN (${sql.raw(senderIds.join(","))})`);
          for (const s of senders) senderMap.set(s.id, s.name || "Unknown");
        }

        return {
          results: results.map(r => ({
            messageId: String(r.id),
            conversationId: String(r.conversationId),
            content: r.content || "",
            timestamp: r.createdAt?.toISOString() || "",
            senderName: senderMap.get(r.senderId) || "Unknown",
            highlight: input.query,
          })),
          total: results.length,
        };
      } catch (error) {
        console.error("[Messages] search error:", error);
        return { results: [], total: 0 };
      }
    }),

  /**
   * Get user's phone number for mobile network calling (no Twilio)
   */
  getUserPhone: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { phone: null };

      try {
        const [user] = await db.select({ phone: users.phone, name: users.name })
          .from(users).where(eq(users.id, input.userId)).limit(1);
        return { phone: user?.phone || null, name: user?.name || null };
      } catch {
        return { phone: null, name: null };
      }
    }),

  /**
   * Delete (soft-delete) a conversation for the current user
   */
  deleteConversation: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false, conversationId: input.conversationId };

      const userId = await resolveUserId(ctx.user);
      const convId = parseInt(input.conversationId.replace("conv_", ""), 10) || parseInt(input.conversationId, 10);
      if (!userId || !convId) return { success: false, conversationId: input.conversationId };

      // Mark user as having left the conversation
      await db.update(conversationParticipants)
        .set({ leftAt: new Date() })
        .where(and(
          eq(conversationParticipants.conversationId, convId),
          eq(conversationParticipants.userId, userId),
        )).catch(() => {});

      return { success: true, conversationId: input.conversationId };
    }),

  /**
   * Archive a conversation
   */
  archiveConversation: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false, conversationId: input.conversationId };

      const userId = await resolveUserId(ctx.user);
      const convId = parseInt(input.conversationId.replace("conv_", ""), 10) || parseInt(input.conversationId, 10);
      if (!userId || !convId) return { success: false, conversationId: input.conversationId };

      await db.update(conversationParticipants)
        .set({ isArchived: true })
        .where(and(
          eq(conversationParticipants.conversationId, convId),
          eq(conversationParticipants.userId, userId),
        )).catch(() => {});

      return { success: true, conversationId: input.conversationId };
    }),

  /**
   * Search users to start a new conversation with
   */
  searchUsers: protectedProcedure
    .input(z.object({ query: z.string().optional(), limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const userId = await resolveUserId(ctx.user);
        const filters: any[] = [eq(users.isActive, true)];
        if (userId) filters.push(sql`${users.id} != ${userId}`);
        if (input.query && input.query.trim()) {
          filters.push(sql`(${users.name} LIKE ${`%${input.query}%`} OR ${users.email} LIKE ${`%${input.query}%`})`);
        }

        const results = await db.select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          profilePicture: users.profilePicture,
          phone: users.phone,
        }).from(users)
          .where(and(...filters))
          .limit(input.limit);

        return results.map(u => ({
          id: u.id,
          name: u.name || u.email || "User",
          email: u.email,
          role: u.role,
          avatar: u.profilePicture,
          phone: u.phone,
        }));
      } catch (error) {
        console.error("[Messages] searchUsers error:", error);
        return [];
      }
    }),

  /**
   * Get conversation details by ID
   */
  getConversation: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const convId = parseInt(input.conversationId.replace("conv_", ""), 10) || parseInt(input.conversationId, 10);
        if (!convId) return null;

        const [conv] = await db.select().from(conversations).where(eq(conversations.id, convId)).limit(1);
        if (!conv) return null;

        // Get participants
        const parts = await db.select({
          userId: conversationParticipants.userId,
        }).from(conversationParticipants)
          .where(and(eq(conversationParticipants.conversationId, convId), isNull(conversationParticipants.leftAt)));

        const partUsers = parts.length > 0
          ? await db.select({ id: users.id, name: users.name, role: users.role, profilePicture: users.profilePicture, phone: users.phone })
              .from(users)
              .where(sql`${users.id} IN (${sql.raw(parts.map(p => p.userId).join(","))})`)
          : [];

        return {
          id: String(conv.id),
          name: conv.name,
          type: conv.type,
          loadId: conv.loadId,
          participants: partUsers.map(u => ({
            id: u.id,
            name: u.name || "User",
            role: u.role,
            avatar: u.profilePicture,
            phone: u.phone,
          })),
        };
      } catch (error) {
        console.error("[Messages] getConversation error:", error);
        return null;
      }
    }),

  /**
   * Alias for listConversations — used by some pages
   */
  listConversations: protectedProcedure
    .input(z.object({
      type: z.enum(["all", "unread", "loads", "support"]).optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { conversations: [], total: 0, unreadTotal: 0 };
      return { conversations: [], total: 0, unreadTotal: 0 };
    }),
});
