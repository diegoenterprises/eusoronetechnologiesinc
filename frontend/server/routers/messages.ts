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
import { eq, and, desc, sql, or, like, isNull, inArray } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { messages, users, conversations, conversationParticipants, wallets, walletTransactions } from "../../drizzle/schema";
import { emitMessage } from "../_core/websocket";
import { createNotification } from "../_core/createNotification";

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
          .where(inArray(conversations.id, convIds))
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

        // STRICT ISOLATION: verify user is a participant of this conversation
        const [participant] = await db.select({ id: conversationParticipants.id })
          .from(conversationParticipants)
          .where(and(
            eq(conversationParticipants.conversationId, convId),
            eq(conversationParticipants.userId, userId),
          )).limit(1);
        if (!participant) {
          // Also check legacy JSON column
          const [legacyConv] = await db.select({ id: conversations.id })
            .from(conversations)
            .where(and(
              eq(conversations.id, convId),
              sql`JSON_CONTAINS(${conversations.participants}, CAST(${userId} AS JSON))`,
            )).limit(1);
          if (!legacyConv) return []; // User is NOT a participant — block access
        }

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
            .where(inArray(users.id, senderIds));
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

      // STRICT ISOLATION: verify user is a participant
      const [isParticipant] = await db.select({ id: conversationParticipants.id })
        .from(conversationParticipants)
        .where(and(
          eq(conversationParticipants.conversationId, convId),
          eq(conversationParticipants.userId, userId),
        )).limit(1);
      if (!isParticipant) {
        const [legacyCheck] = await db.select({ id: conversations.id }).from(conversations)
          .where(and(eq(conversations.id, convId), sql`JSON_CONTAINS(${conversations.participants}, CAST(${userId} AS JSON))`)).limit(1);
        if (!legacyCheck) throw new Error("Access denied — not a participant");
      }

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

      // Create notifications for all OTHER participants
      try {
        const otherParticipants = await db.select({ userId: conversationParticipants.userId })
          .from(conversationParticipants)
          .where(and(
            eq(conversationParticipants.conversationId, convId),
            sql`${conversationParticipants.userId} != ${userId}`,
            isNull(conversationParticipants.leftAt),
          ));
        for (const p of otherParticipants) {
          await createNotification({
            userId: p.userId,
            type: "message",
            title: `New message from ${sender?.name || "User"}`,
            message: input.content.substring(0, 100),
            data: { category: "system", conversationId: String(convId), senderId: String(userId), actionUrl: "/messages" },
          });
        }
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

      // STRICT ISOLATION: verify user is a participant
      const [isPart] = await db.select({ id: conversationParticipants.id })
        .from(conversationParticipants)
        .where(and(
          eq(conversationParticipants.conversationId, convId),
          eq(conversationParticipants.userId, userId),
        )).limit(1);
      if (!isPart) {
        const [legCheck] = await db.select({ id: conversations.id }).from(conversations)
          .where(and(eq(conversations.id, convId), sql`JSON_CONTAINS(${conversations.participants}, CAST(${userId} AS JSON))`)).limit(1);
        if (!legCheck) throw new Error("Access denied — not a participant");
      }

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

      // Create notifications for other participants
      try {
        const [sender] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
        const others = await db.select({ userId: conversationParticipants.userId })
          .from(conversationParticipants)
          .where(and(eq(conversationParticipants.conversationId, convId), sql`${conversationParticipants.userId} != ${userId}`, isNull(conversationParticipants.leftAt)));
        for (const p of others) {
          await createNotification({
            userId: p.userId,
            type: "message",
            title: `New message from ${sender?.name || "User"}`,
            message: input.content.substring(0, 100),
            data: { category: "system", conversationId: String(convId), actionUrl: "/messages" },
          });
        }
      } catch {}

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
            .where(inArray(users.id, senderIds));
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

      // 1) Mark user as having left in conversationParticipants table
      await db.update(conversationParticipants)
        .set({ leftAt: new Date() })
        .where(and(
          eq(conversationParticipants.conversationId, convId),
          eq(conversationParticipants.userId, userId),
        )).catch(() => {});

      // 2) Also remove user from legacy conversations.participants JSON array
      try {
        const [conv] = await db.select({ id: conversations.id, participants: conversations.participants })
          .from(conversations).where(eq(conversations.id, convId)).limit(1);
        if (conv?.participants) {
          const remaining = (conv.participants as number[]).filter(id => id !== userId);
          if (remaining.length === 0) {
            // No participants left — hard delete conversation + messages
            await db.delete(messages).where(eq(messages.conversationId, convId)).catch(() => {});
            await db.delete(conversationParticipants).where(eq(conversationParticipants.conversationId, convId)).catch(() => {});
            await db.delete(conversations).where(eq(conversations.id, convId)).catch(() => {});
          } else {
            await db.update(conversations)
              .set({ participants: remaining })
              .where(eq(conversations.id, convId));
          }
        }
      } catch {}

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
              .where(inArray(users.id, parts.map(p => p.userId)))
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

  /**
   * Upload attachment in a DM conversation — raw SQL to avoid column-mapping issues
   */
  uploadAttachment: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      fileName: z.string(),
      fileData: z.string(),
      mimeType: z.string(),
      fileSize: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const userId = await resolveUserId(ctx.user);
      if (!userId) throw new Error("User not found");

      const convId = parseInt(input.conversationId.replace("conv_", ""), 10) || parseInt(input.conversationId, 10);
      if (!convId) throw new Error("Invalid conversation");

      // Verify participant
      const [isPart] = await db.select({ id: conversationParticipants.id })
        .from(conversationParticipants)
        .where(and(
          eq(conversationParticipants.conversationId, convId),
          eq(conversationParticipants.userId, userId),
        )).limit(1);
      if (!isPart) throw new Error("Access denied — not a participant");

      // Determine attachment type
      const mime = input.mimeType.toLowerCase();
      let type = "document";
      if (mime.startsWith("image/")) type = "image";
      else if (mime.startsWith("audio/")) type = "audio";
      else if (mime.startsWith("video/")) type = "video";

      // Insert message via raw SQL
      const msgResult = await db.execute(
        sql`INSERT INTO messages (conversationId, senderId, messageType, content, createdAt) VALUES (${convId}, ${userId}, ${type}, ${`📎 ${input.fileName}`}, NOW())`
      );
      const messageId = (msgResult as any)[0]?.insertId || 0;

      // Store attachment via raw SQL
      const attResult = await db.execute(
        sql`INSERT INTO message_attachments (messageId, type, fileName, fileUrl, fileSize, mimeType, createdAt) VALUES (${messageId}, ${type}, ${input.fileName}, ${input.fileData}, ${input.fileSize}, ${input.mimeType}, NOW())`
      );
      const attachmentId = (attResult as any)[0]?.insertId || 0;

      // Update conversation timestamp
      await db.execute(sql`UPDATE conversations SET lastMessageAt = NOW() WHERE id = ${convId}`).catch(() => {});

      return {
        success: true,
        messageId: String(messageId),
        attachmentId: String(attachmentId),
        fileName: input.fileName,
        type,
      };
    }),

  /**
   * Send a payment message (like Apple Pay / Cash App)
   * For "send": debits sender wallet, credits recipient wallet, creates payment_sent message
   * For "request": creates payment_request message (no money movement until accepted)
   */
  sendPayment: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      amount: z.number().min(0.01),
      currency: z.string().default("USD"),
      note: z.string().optional(),
      type: z.enum(["send", "request"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = await resolveUserId(ctx.user);
      if (!userId) throw new Error("User not authenticated");

      const convId = parseInt(input.conversationId.replace("conv_", ""), 10) || parseInt(input.conversationId, 10);
      if (!convId) throw new Error("Invalid conversation ID");

      const [sender] = await db.select({ name: users.name, email: users.email })
        .from(users).where(eq(users.id, userId)).limit(1);
      if (!sender) throw new Error("Sender not found");

      // Find the other participant in the conversation (recipient)
      const participants = await db.select({ userId: conversationParticipants.userId })
        .from(conversationParticipants)
        .where(and(
          eq(conversationParticipants.conversationId, convId),
          isNull(conversationParticipants.leftAt),
        ));
      const recipientId = participants.find(p => p.userId !== userId)?.userId;
      if (!recipientId) throw new Error("Recipient not found in conversation");

      // For "send" type — actually process wallet transfer
      if (input.type === "send") {
        // Get sender wallet
        const [senderWallet] = await db.select()
          .from(wallets).where(eq(wallets.userId, userId)).limit(1);
        if (!senderWallet) throw new Error("Wallet not found. Set up your EusoWallet first.");

        const available = parseFloat(senderWallet.availableBalance || "0");
        if (available < input.amount) {
          throw new Error(`Insufficient balance. Available: $${available.toFixed(2)}`);
        }

        // Get or create recipient wallet
        let [recipientWallet] = await db.select()
          .from(wallets).where(eq(wallets.userId, recipientId)).limit(1);
        if (!recipientWallet) {
          await db.insert(wallets).values({ userId: recipientId, availableBalance: "0", pendingBalance: "0" });
          [recipientWallet] = await db.select()
            .from(wallets).where(eq(wallets.userId, recipientId)).limit(1);
        }

        // Debit sender
        await db.update(wallets)
          .set({
            availableBalance: String((available - input.amount).toFixed(2)),
            totalSpent: String((parseFloat(senderWallet.totalSpent || "0") + input.amount).toFixed(2)),
          })
          .where(eq(wallets.id, senderWallet.id));

        // Credit recipient
        const recipientBalance = parseFloat(recipientWallet.availableBalance || "0");
        await db.update(wallets)
          .set({
            availableBalance: String((recipientBalance + input.amount).toFixed(2)),
            totalReceived: String((parseFloat(recipientWallet.totalReceived || "0") + input.amount).toFixed(2)),
          })
          .where(eq(wallets.id, recipientWallet.id));

        // Record wallet transactions (audit trail)
        await db.insert(walletTransactions).values({
          walletId: senderWallet.id,
          type: "transfer",
          amount: String(-input.amount),
          fee: "0",
          netAmount: String(-input.amount),
          status: "completed",
          description: `Chat payment sent — $${input.amount.toFixed(2)}${input.note ? ` — ${input.note}` : ""}`,
          completedAt: new Date(),
        }).catch(() => {});

        await db.insert(walletTransactions).values({
          walletId: recipientWallet.id,
          type: "transfer",
          amount: String(input.amount),
          fee: "0",
          netAmount: String(input.amount),
          status: "completed",
          description: `Chat payment received — $${input.amount.toFixed(2)}${input.note ? ` — ${input.note}` : ""}`,
          completedAt: new Date(),
        }).catch(() => {});
      }

      const messageType = input.type === "send" ? "payment_sent" : "payment_request";
      const content = input.type === "send"
        ? `Sent $${input.amount.toFixed(2)} ${input.currency}${input.note ? ` - ${input.note}` : ""}`
        : `Requested $${input.amount.toFixed(2)} ${input.currency}${input.note ? ` - ${input.note}` : ""}`;

      const metadata = {
        amount: input.amount,
        currency: input.currency,
        note: input.note || "",
        status: input.type === "send" ? "completed" : "pending",
        recipientId,
        senderName: sender?.name || "User",
        timestamp: new Date().toISOString(),
      };

      const [result] = await db.insert(messages).values({
        conversationId: convId,
        senderId: userId,
        messageType: messageType as any,
        content,
        metadata,
      });

      const msgId = (result as any).insertId;

      // Update conversation timestamp (camelCase column names match Drizzle schema)
      await db.update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, convId));

      // Increment unread for other participants
      await db.execute(
        sql`UPDATE conversation_participants SET unreadCount = unreadCount + 1 WHERE conversationId = ${convId} AND userId != ${userId} AND leftAt IS NULL`
      );

      // Emit real-time event
      try {
        emitMessage({
          conversationId: String(convId),
          messageId: String(msgId),
          senderId: String(userId),
          senderName: sender?.name || "User",
          content,
          messageType,
          timestamp: new Date().toISOString(),
        } as any);
      } catch {}

      // Create notification for recipient
      await createNotification({
        userId: recipientId,
        type: "payment_received",
        title: input.type === "send"
          ? `${sender?.name || "User"} sent you $${input.amount.toFixed(2)}`
          : `${sender?.name || "User"} requested $${input.amount.toFixed(2)}`,
        message: input.note || (input.type === "send" ? "Payment received" : "Tap to review the request"),
        data: {
          category: "billing",
          amount: input.amount,
          currency: input.currency,
          conversationId: String(convId),
          actionUrl: "/messages",
          actionLabel: input.type === "send" ? "View" : "Pay",
        },
      }).catch(() => {});

      return {
        id: String(msgId),
        type: messageType,
        amount: input.amount,
        currency: input.currency,
        status: metadata.status,
      };
    }),

  /**
   * Unsend a message — only the original sender can unsend
   * Replaces content with system notice, keeps the row for conversation integrity
   */
  unsendMessage: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = await resolveUserId(ctx.user);
      if (!userId) throw new Error("User not authenticated");

      const msgId = parseInt(input.messageId, 10);
      if (!msgId) throw new Error("Invalid message ID");

      // Verify ownership
      const [msg] = await db.select({ senderId: messages.senderId, conversationId: messages.conversationId })
        .from(messages).where(eq(messages.id, msgId)).limit(1);
      if (!msg) throw new Error("Message not found");
      if (msg.senderId !== userId) throw new Error("You can only unsend your own messages");

      // Soft-unsend: replace content, mark type as unsent
      await db.update(messages)
        .set({
          content: "This message was unsent",
          messageType: "system_notification" as any,
          metadata: { unsent: true, unsentAt: new Date().toISOString(), originalSenderId: userId },
        })
        .where(eq(messages.id, msgId));

      return { success: true, messageId: input.messageId };
    }),

  /**
   * Accept a payment request — the recipient pays the requester
   * Fully user-isolated: wallets looked up by userId, not shared IDs
   */
  acceptPaymentRequest: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userId = await resolveUserId(ctx.user);
      if (!userId) throw new Error("User not authenticated");

      const msgId = parseInt(input.messageId, 10);
      if (!msgId) throw new Error("Invalid message ID");

      // Fetch the payment request message
      const [msg] = await db.select()
        .from(messages).where(eq(messages.id, msgId)).limit(1);
      if (!msg) throw new Error("Message not found");

      const meta = (msg.metadata || {}) as any;
      if (meta.status === "completed") throw new Error("This payment request has already been paid");
      if (msg.messageType !== "payment_request") throw new Error("This is not a payment request");

      // The requester (sender of the request message) is who gets paid
      const requesterId = msg.senderId;
      if (requesterId === userId) throw new Error("You cannot pay your own request");

      const amount = meta.amount;
      if (!amount || amount <= 0) throw new Error("Invalid payment amount");

      // Get payer (current user) wallet
      const [payerWallet] = await db.select()
        .from(wallets).where(eq(wallets.userId, userId)).limit(1);
      if (!payerWallet) throw new Error("Wallet not found. Set up your EusoWallet first.");

      const available = parseFloat(payerWallet.availableBalance || "0");
      if (available < amount) {
        throw new Error(`Insufficient balance. Available: $${available.toFixed(2)}, Required: $${amount.toFixed(2)}`);
      }

      // Get or create requester wallet
      let [requesterWallet] = await db.select()
        .from(wallets).where(eq(wallets.userId, requesterId)).limit(1);
      if (!requesterWallet) {
        await db.insert(wallets).values({ userId: requesterId, availableBalance: "0", pendingBalance: "0" });
        [requesterWallet] = await db.select()
          .from(wallets).where(eq(wallets.userId, requesterId)).limit(1);
      }

      // Debit payer
      await db.update(wallets)
        .set({
          availableBalance: String((available - amount).toFixed(2)),
          totalSpent: String((parseFloat(payerWallet.totalSpent || "0") + amount).toFixed(2)),
        })
        .where(eq(wallets.id, payerWallet.id));

      // Credit requester
      const requesterBalance = parseFloat(requesterWallet.availableBalance || "0");
      await db.update(wallets)
        .set({
          availableBalance: String((requesterBalance + amount).toFixed(2)),
          totalReceived: String((parseFloat(requesterWallet.totalReceived || "0") + amount).toFixed(2)),
        })
        .where(eq(wallets.id, requesterWallet.id));

      // Record wallet transactions (audit trail)
      const [requesterUser] = await db.select({ name: users.name, email: users.email })
        .from(users).where(eq(users.id, requesterId)).limit(1);

      await db.insert(walletTransactions).values({
        walletId: payerWallet.id,
        type: "transfer",
        amount: String(-amount),
        fee: "0",
        netAmount: String(-amount),
        status: "completed",
        description: `Payment request paid — $${amount.toFixed(2)} to ${requesterUser?.name || "user"}${meta.note ? ` — ${meta.note}` : ""}`,
        completedAt: new Date(),
      }).catch(() => {});

      await db.insert(walletTransactions).values({
        walletId: requesterWallet.id,
        type: "transfer",
        amount: String(amount),
        fee: "0",
        netAmount: String(amount),
        status: "completed",
        description: `Payment request fulfilled — $${amount.toFixed(2)} received${meta.note ? ` — ${meta.note}` : ""}`,
        completedAt: new Date(),
      }).catch(() => {});

      // Stripe Connect transfer (if both parties have Connect accounts)
      try {
        if (requesterWallet.stripeConnectId && payerWallet.stripeConnectId) {
          const Stripe = (await import("stripe")).default;
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
          await stripe.transfers.create({
            amount: Math.round(amount * 100),
            currency: meta.currency?.toLowerCase() || "usd",
            destination: requesterWallet.stripeConnectId,
            metadata: {
              type: "payment_request_accepted",
              payerUserId: String(userId),
              requesterUserId: String(requesterId),
              messageId: String(msgId),
              platform: "eusotrip",
            },
          });
        }
      } catch (stripeErr) {
        console.warn("[Stripe] Connect transfer skipped:", stripeErr);
      }

      // Update the original request message status to "completed"
      await db.update(messages)
        .set({
          metadata: { ...meta, status: "completed", paidBy: userId, paidAt: new Date().toISOString() },
        })
        .where(eq(messages.id, msgId));

      // Create a confirmation payment_sent message
      const [payer] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
      const [result] = await db.insert(messages).values({
        conversationId: msg.conversationId,
        senderId: userId,
        messageType: "payment_sent" as any,
        content: `Paid $${amount.toFixed(2)} ${meta.currency || "USD"}${meta.note ? ` - ${meta.note}` : ""}`,
        metadata: {
          amount,
          currency: meta.currency || "USD",
          note: meta.note || "",
          status: "completed",
          recipientId: requesterId,
          senderName: payer?.name || "User",
          inResponseTo: msgId,
          timestamp: new Date().toISOString(),
        },
      });

      // Update conversation timestamp
      await db.update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, msg.conversationId));

      // Emit real-time event
      try {
        emitMessage({
          conversationId: String(msg.conversationId),
          messageId: String((result as any).insertId),
          senderId: String(userId),
          senderName: payer?.name || "User",
          content: `Paid $${amount.toFixed(2)}`,
          messageType: "payment_sent",
          timestamp: new Date().toISOString(),
        } as any);
      } catch {}

      // Notify the requester that their payment request was fulfilled
      await createNotification({
        userId: requesterId,
        type: "payment_received",
        title: `${payer?.name || "User"} paid your $${amount.toFixed(2)} request`,
        message: meta.note || "Payment request fulfilled",
        data: {
          category: "billing",
          amount,
          currency: meta.currency || "USD",
          conversationId: String(msg.conversationId),
          actionUrl: "/messages",
        },
      }).catch(() => {});

      // Notify the payer with confirmation
      await createNotification({
        userId,
        type: "payment_received",
        title: `You paid $${amount.toFixed(2)} to ${requesterUser?.name || "user"}`,
        message: "Payment completed successfully",
        data: {
          category: "billing",
          amount,
          conversationId: String(msg.conversationId),
          actionUrl: "/wallet",
        },
      }).catch(() => {});

      return { success: true, amount, messageId: input.messageId };
    }),
});
