/**
 * MESSAGING ROUTER
 * Real-time messaging and communication procedures
 * ALL data from database — conversations + messages tables
 */

import { z } from "zod";
import { eq, and, desc, sql, inArray, like } from "drizzle-orm";
import { router, isolatedProcedure as protectedProcedure } from "../_core/trpc";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { conversations, messages, users, auditLogs, messageAttachments, notifications } from "../../drizzle/schema";
import { unsafeCast } from "../_core/types/unsafe";
import { emitNotification } from "../_core/websocket";

async function resolveUserId(ctxUser: any): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const email = ctxUser?.email || "";
  if (!email) return 0;
  try {
    const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    return row?.id || 0;
  } catch (e) { logger.error("[messaging] Failed to resolve user ID from email:", e); return 0; }
}

export const messagingRouter = router({
  create: protectedProcedure
    .input(z.object({
      participantIds: z.array(z.number()),
      name: z.string().optional(),
      type: z.enum(["direct", "group", "job", "channel", "company", "support"]).default("direct"),
      loadId: z.number().optional(),
      initialMessage: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const userId = await resolveUserId(ctx.user);
      const allParticipants = [userId, ...input.participantIds.filter(id => id !== userId)];
      const [conv] = await db.insert(conversations).values({
        type: input.type,
        name: input.name || null,
        participants: allParticipants,
        loadId: input.loadId,
        lastMessageAt: new Date(),
      }).$returningId();
      if (input.initialMessage) {
        await db.insert(messages).values({
          conversationId: conv.id,
          senderId: userId,
          content: input.initialMessage,
        });
      }
      return { success: true, id: conv.id };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const userId = await resolveUserId(ctx.user);
      // SECURITY: Verify caller is a participant in this conversation
      const [conv] = await db.select({ participants: conversations.participants }).from(conversations).where(eq(conversations.id, input.id)).limit(1);
      if (!conv || !(conv.participants as number[])?.includes(userId)) throw new Error("Conversation not found");
      if (input.name) {
        await db.update(conversations).set({ name: input.name }).where(eq(conversations.id, input.id));
      }
      return { success: true, id: input.id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const userId = await resolveUserId(ctx.user);
      // SECURITY: Verify caller is a participant before allowing delete
      const [conv] = await db.select({ participants: conversations.participants }).from(conversations).where(eq(conversations.id, input.id)).limit(1);
      if (!conv || !(conv.participants as number[])?.includes(userId)) throw new Error("Conversation not found");
      // Soft-delete by clearing participants
      await db.update(conversations).set({ participants: [] }).where(eq(conversations.id, input.id));
      return { success: true, id: input.id };
    }),

  /**
   * messaging.getInbox
   * Returns conversations where the current user is a participant,
   * ordered by most recent message. Includes unread count.
   */
  getInbox: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) return { items: [], unread: 0 };
    try {
      const userId = await resolveUserId(ctx.user);
      if (!userId) return { items: [], unread: 0 };

      const convos = await db.select().from(conversations)
        .where(sql`JSON_CONTAINS(${conversations.participants}, CAST(${userId} AS JSON))`)
        .orderBy(desc(conversations.lastMessageAt))
        .limit(30);

      let unread = 0;
      const items = await Promise.all(convos.map(async (c) => {
        const [lastMsg] = await db.select({ id: messages.id, content: messages.content, senderId: messages.senderId, createdAt: messages.createdAt, readBy: messages.readBy })
          .from(messages).where(eq(messages.conversationId, c.id)).orderBy(desc(messages.createdAt)).limit(1);
        const isRead = lastMsg?.readBy ? (lastMsg.readBy as number[]).includes(userId) : true;
        if (!isRead) unread++;

        const participantIds = (c.participants as number[]) || [];
        const otherIds = participantIds.filter(p => p !== userId);
        let otherName = '';
        if (otherIds.length > 0) {
          const [other] = await db.select({ name: users.name }).from(users).where(eq(users.id, otherIds[0])).limit(1);
          otherName = other?.name || '';
        }

        return {
          id: String(c.id),
          type: c.type,
          name: c.name || otherName || 'Conversation',
          lastMessage: lastMsg?.content?.slice(0, 100) || '',
          lastMessageAt: lastMsg?.createdAt?.toISOString() || c.lastMessageAt?.toISOString() || '',
          isRead,
          participantCount: participantIds.length,
        };
      }));

      return { items, unread };
    } catch (e) { return { items: [], unread: 0 }; }
  }),

  /**
   * messaging.getConversations
   * Returns all conversations for the current user with metadata.
   */
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) return { items: [] };
    try {
      const userId = await resolveUserId(ctx.user);
      if (!userId) return { items: [] };
      const convos = await db.select().from(conversations)
        .where(sql`JSON_CONTAINS(${conversations.participants}, CAST(${userId} AS JSON))`)
        .orderBy(desc(conversations.lastMessageAt)).limit(50);
      return { items: convos.map(c => ({ id: String(c.id), type: c.type, name: c.name || '', participants: (c.participants as number[]) || [], lastMessageAt: c.lastMessageAt?.toISOString() || '', createdAt: c.createdAt?.toISOString() || '' })) };
    } catch (e) { return { items: [] }; }
  }),

  /**
   * messaging.getMessages
   * Returns messages for a specific conversation, paginated.
   */
  getMessages: protectedProcedure
    .input(z.object({ conversationId: z.string(), limit: z.number().default(50), offset: z.number().default(0) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return { items: [] };
      if (!input?.conversationId) return { items: [] };
      try {
        const convId = parseInt(input.conversationId, 10);
        const rows = await db.select({
          id: messages.id, conversationId: messages.conversationId,
          senderId: messages.senderId, messageType: messages.messageType,
          content: messages.content, metadata: messages.metadata,
          readBy: messages.readBy, createdAt: messages.createdAt,
        }).from(messages)
          .where(eq(messages.conversationId, convId))
          .orderBy(desc(messages.createdAt))
          .limit(input.limit);

        // Batch-fetch sender names
        const senderIds = Array.from(new Set(rows.map(r => r.senderId)));
        const senderMap = new Map<number, string>();
        if (senderIds.length > 0) {
          const senders = await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, senderIds));
          for (const s of senders) senderMap.set(s.id, s.name || '');
        }

        // Fix 3: Mark unread messages as read by the current user
        const userId = await resolveUserId(ctx.user);
        if (userId) {
          const unreadIds = rows
            .filter(m => !(m.readBy as number[] || []).includes(userId))
            .map(m => m.id);
          if (unreadIds.length > 0) {
            try {
              await db.execute(
                sql`UPDATE messages SET readBy = JSON_ARRAY_APPEND(COALESCE(readBy, '[]'), '$', CAST(${userId} AS JSON)) WHERE id IN (${sql.join(unreadIds.map(id => sql`${id}`), sql`,`)}) AND NOT JSON_CONTAINS(COALESCE(readBy, '[]'), CAST(${userId} AS JSON))`
              );
            } catch (readErr) {
              logger.error("[messaging] Failed to update readBy:", readErr);
            }
          }
        }

        return {
          items: rows.reverse().map(m => ({
            id: String(m.id),
            senderId: String(m.senderId),
            senderName: senderMap.get(m.senderId) || '',
            messageType: m.messageType,
            content: m.content || '',
            metadata: m.metadata || null,
            readBy: (m.readBy as number[]) || [],
            createdAt: m.createdAt?.toISOString() || '',
          })),
        };
      } catch (e) { return { items: [] }; }
    }),

  /**
   * messaging.sendMessage
   * Sends a message in a conversation. Creates the conversation
   * if it doesn't exist (direct message). Updates lastMessageAt.
   */
  sendMessage: protectedProcedure
    .input(z.object({
      conversationId: z.string().optional(),
      to: z.string().optional(),
      content: z.string(),
      messageType: z.string().default('text'),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const senderId = await resolveUserId(ctx.user);
      if (!senderId) throw new Error("User not found");

      let convId: number;

      if (input.conversationId) {
        convId = parseInt(input.conversationId, 10);
      } else if (input.to) {
        // Create or find direct conversation
        const toId = parseInt(input.to, 10);
        const existing = await db.select({ id: conversations.id }).from(conversations)
          .where(and(eq(conversations.type, 'direct'), sql`JSON_CONTAINS(${conversations.participants}, CAST(${senderId} AS JSON))`, sql`JSON_CONTAINS(${conversations.participants}, CAST(${toId} AS JSON))`))
          .limit(1);

        if (existing.length > 0) {
          convId = existing[0].id;
        } else {
          const result = await db.insert(conversations).values({
            type: 'direct',
            participants: [senderId, toId],
            lastMessageAt: new Date(),
          } as never).$returningId();
          convId = result[0]?.id;
        }
      } else {
        throw new Error("Either conversationId or to is required");
      }

      const result = await db.insert(messages).values({
        conversationId: convId,
        senderId,
        messageType: unsafeCast(input.messageType),
        content: input.content,
        readBy: [senderId],
      }).$returningId();

      await db.update(conversations).set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, convId));

      // Fix 2: Real-time DM notifications
      try {
        const [conv] = await db.select({ participants: conversations.participants, name: conversations.name })
          .from(conversations).where(eq(conversations.id, convId)).limit(1);
        const participants = (conv?.participants as number[]) || [];
        const senderName = ctx.user?.name || 'Someone';
        const preview = input.content.substring(0, 100);
        const messageId = result[0]?.id;

        for (const recipientId of participants) {
          if (recipientId === senderId) continue;

          // Emit real-time WebSocket notification
          emitNotification(String(recipientId), {
            id: `dm_${messageId}`,
            type: 'message',
            title: senderName,
            message: preview,
            priority: 'medium',
            data: { conversationId: String(convId), messageId: String(messageId) },
            timestamp: new Date().toISOString(),
          });

          // Persist notification record
          await db.insert(notifications).values({
            userId: recipientId,
            type: 'message',
            title: `New message from ${senderName}`,
            message: preview,
            data: { conversationId: String(convId), messageId: String(messageId) },
            isRead: false,
          });
        }
      } catch (notifErr) {
        logger.error("[messaging] Failed to send DM notifications:", notifErr);
      }

      return { success: true, id: String(result[0]?.id), conversationId: String(convId) };
    }),

  /**
   * messaging.getUnread
   * Returns unread message count and the most recent unread messages.
   */
  getUnread: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) return { items: [], count: 0 };
    try {
      const userId = await resolveUserId(ctx.user);
      if (!userId) return { items: [], count: 0 };

      const convos = await db.select({ id: conversations.id }).from(conversations)
        .where(sql`JSON_CONTAINS(${conversations.participants}, CAST(${userId} AS JSON))`)
        .limit(50);

      if (convos.length === 0) return { items: [], count: 0 };
      const convIds = convos.map(c => c.id);

      const unreadMsgs = await db.select({
        id: messages.id, conversationId: messages.conversationId,
        content: messages.content, senderId: messages.senderId, createdAt: messages.createdAt,
      }).from(messages)
        .where(and(inArray(messages.conversationId, convIds), sql`NOT JSON_CONTAINS(COALESCE(${messages.readBy}, '[]'), CAST(${userId} AS JSON))`))
        .orderBy(desc(messages.createdAt)).limit(20);

      return {
        items: unreadMsgs.map(m => ({ id: String(m.id), conversationId: String(m.conversationId), content: m.content?.slice(0, 100) || '', senderId: String(m.senderId), createdAt: m.createdAt?.toISOString() || '' })),
        count: unreadMsgs.length,
      };
    } catch (e) { return { items: [], count: 0 }; }
  }),

  /**
   * messaging.getContactList
   * Returns users from the same company as potential contacts.
   */
  getContactList: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) return { items: [] };
    try {
      const userId = await resolveUserId(ctx.user);
      const companyId = Number(ctx.user!.companyId) || 0;
      const rows = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role })
        .from(users).where(companyId ? eq(users.companyId, companyId) : sql`1=1`).limit(50);
      return { items: rows.filter(u => u.id !== userId).map(u => ({ id: String(u.id), name: u.name || '', email: u.email || '', role: u.role })) };
    } catch (e) { return { items: [] }; }
  }),

  /**
   * messaging.getArchive
   * Returns conversations the user has archived (tracked via auditLogs entityType='archived_conversations').
   */
  getArchive: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) return { items: [] };
    try {
      const userId = await resolveUserId(ctx.user);
      if (!userId) return { items: [] };

      // Get archived conversation IDs from audit logs
      const archiveRecords = await db.select({ entityId: auditLogs.entityId })
        .from(auditLogs)
        .where(and(
          eq(auditLogs.userId, userId),
          eq(auditLogs.entityType, 'archived_conversations'),
          eq(auditLogs.action, 'archive'),
        ))
        .orderBy(desc(auditLogs.createdAt))
        .limit(50);

      if (archiveRecords.length === 0) return { items: [] };
      const archivedIds = archiveRecords.map(r => r.entityId).filter((id): id is number => id !== null);
      if (archivedIds.length === 0) return { items: [] };

      const convos = await db.select().from(conversations)
        .where(inArray(conversations.id, archivedIds))
        .orderBy(desc(conversations.lastMessageAt));

      return {
        items: convos.map(c => ({
          id: String(c.id),
          type: c.type,
          name: c.name || 'Conversation',
          participants: (c.participants as number[]) || [],
          lastMessageAt: c.lastMessageAt?.toISOString() || '',
          createdAt: c.createdAt?.toISOString() || '',
        })),
      };
    } catch (e) {
      logger.error("[messaging] getArchive error:", e);
      return { items: [] };
    }
  }),

  /**
   * messaging.getAttachments
   * Returns attachments from conversations the user is in.
   */
  getAttachments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) return { items: [] };
    try {
      const userId = await resolveUserId(ctx.user);
      if (!userId) return { items: [] };

      // Get user's conversation IDs
      const convos = await db.select({ id: conversations.id }).from(conversations)
        .where(sql`JSON_CONTAINS(${conversations.participants}, CAST(${userId} AS JSON))`)
        .limit(50);
      if (convos.length === 0) return { items: [] };
      const convIds = convos.map(c => c.id);

      // Get attachments from those conversations
      const attachments = await db.select({
        id: messageAttachments.id,
        messageId: messageAttachments.messageId,
        type: messageAttachments.type,
        fileName: messageAttachments.fileName,
        fileUrl: messageAttachments.fileUrl,
        fileSize: messageAttachments.fileSize,
        mimeType: messageAttachments.mimeType,
        createdAt: messageAttachments.createdAt,
        senderId: messages.senderId,
        conversationId: messages.conversationId,
      })
        .from(messageAttachments)
        .innerJoin(messages, eq(messageAttachments.messageId, messages.id))
        .where(inArray(messages.conversationId, convIds))
        .orderBy(desc(messageAttachments.createdAt))
        .limit(50);

      return {
        items: attachments.map(a => ({
          id: String(a.id),
          messageId: String(a.messageId),
          type: a.type,
          fileName: a.fileName || '',
          fileUrl: a.fileUrl,
          fileSize: a.fileSize || 0,
          mimeType: a.mimeType || '',
          senderId: String(a.senderId),
          conversationId: String(a.conversationId),
          createdAt: a.createdAt?.toISOString() || '',
        })),
      };
    } catch (e) {
      logger.error("[messaging] getAttachments error:", e);
      return { items: [] };
    }
  }),
  getBroadcast: protectedProcedure.query(async () => ({ items: [] })),
  getChannelDirectory: protectedProcedure.query(async () => ({ items: [] })),
  getChannelSettings: protectedProcedure.query(async () => ({ settings: {} })),
  getChannels: protectedProcedure.query(async () => ({ items: [] })),
  getCompose: protectedProcedure.query(async () => ({})),
  /**
   * messaging.getDrafts
   * Retrieve draft messages stored via auditLogs entityType='message_draft'.
   */
  getDrafts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) return { items: [] };
    try {
      const userId = await resolveUserId(ctx.user);
      if (!userId) return { items: [] };

      const drafts = await db.select({
        id: auditLogs.id,
        entityId: auditLogs.entityId,
        changes: auditLogs.changes,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
      })
        .from(auditLogs)
        .where(and(
          eq(auditLogs.userId, userId),
          eq(auditLogs.entityType, 'message_draft'),
          eq(auditLogs.action, 'create'),
        ))
        .orderBy(desc(auditLogs.createdAt))
        .limit(20);

      return {
        items: drafts.map(d => {
          const meta = d.metadata as Record<string, unknown> | null;
          const changes = d.changes as Record<string, unknown> | null;
          return {
            id: String(d.id),
            conversationId: String(d.entityId || ''),
            content: (changes?.content as string) || '',
            recipientId: (meta?.recipientId as string) || '',
            createdAt: d.createdAt?.toISOString() || '',
          };
        }),
      };
    } catch (e) {
      logger.error("[messaging] getDrafts error:", e);
      return { items: [] };
    }
  }),
  getFileSharing: protectedProcedure.query(async () => ({ items: [] })),
  getGroupChat: protectedProcedure.query(async () => ({ items: [] })),
  getGroupCreate: protectedProcedure.query(async () => ({})),
  getGroupManagement: protectedProcedure.query(async () => ({ items: [] })),
  getGroupSettings: protectedProcedure.query(async () => ({ settings: {} })),

  // WS-P1-013: The Lobby — company-wide group chat
  getLobby: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { conversation: null, messages: [] };
      const userId = await resolveUserId(ctx.user);
      if (!userId) return { conversation: null, messages: [] };

      try {
        // Get user's company
        const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1);
        const companyId = unsafeCast(user)?.companyId;
        if (!companyId) return { conversation: null, messages: [] };

        // Find or create lobby conversation for this company
        let [lobby] = await db.select().from(conversations)
          .where(and(eq(conversations.companyId, companyId), eq(conversations.type, 'company'), sql`${conversations.name} = 'The Lobby'`))
          .limit(1);

        if (!lobby) {
          // Auto-create The Lobby for this company
          const [created] = await db.insert(conversations).values({
            type: 'company',
            name: 'The Lobby',
            companyId,
            participants: [],
          }).$returningId();
          [lobby] = await db.select().from(conversations).where(eq(conversations.id, created.id)).limit(1);
        }

        if (!lobby) return { conversation: null, messages: [] };

        // Get recent messages with sender info
        const recentMessages = await db
          .select({
            id: messages.id,
            content: messages.content,
            senderId: messages.senderId,
            senderName: users.name,
            messageType: messages.messageType,
            createdAt: messages.createdAt,
          })
          .from(messages)
          .leftJoin(users, eq(messages.senderId, users.id))
          .where(eq(messages.conversationId, lobby.id))
          .orderBy(desc(messages.createdAt))
          .limit(50);

        return { conversation: lobby, messages: recentMessages.reverse() };
      } catch (error) {
        logger.error('[Messaging] getLobby error:', error);
        return { conversation: null, messages: [] };
      }
    }),

  sendLobbyMessage: protectedProcedure
    .input(z.object({ text: z.string().min(1).max(5000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = await resolveUserId(ctx.user);
      if (!userId) throw new Error("Could not resolve user");

      // Get user's company
      const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1);
      const companyId = unsafeCast(user)?.companyId;
      if (!companyId) throw new Error("No company assigned");

      // Find lobby
      const [lobby] = await db.select({ id: conversations.id }).from(conversations)
        .where(and(eq(conversations.companyId, companyId), eq(conversations.type, 'company'), sql`${conversations.name} = 'The Lobby'`))
        .limit(1);
      if (!lobby) throw new Error("Lobby not found. Navigate to The Lobby first.");

      // Insert message
      const [result] = await db.insert(messages).values({
        conversationId: lobby.id,
        senderId: userId,
        messageType: 'text',
        content: input.text,
      }).$returningId();

      // Update conversation lastMessageAt
      await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, lobby.id));

      // Broadcast via WebSocket to company room
      try {
        const { emitNotification } = await import("../_core/websocket");
        // Get all company users for broadcast
        const companyUsers = await db.select({ id: users.id }).from(users).where(eq(users.companyId, companyId));
        for (const cu of companyUsers) {
          if (cu.id !== userId) {
            emitNotification(String(cu.id), {
              id: `lobby_${result.id}`,
              type: 'message',
              title: 'The Lobby',
              message: `${ctx.user?.name || 'Team member'}: ${input.text.substring(0, 100)}`,
              priority: 'low',
              data: { conversationId: String(lobby.id) },
              timestamp: new Date().toISOString(),
            });
          }
        }
      } catch (e) {
        logger.error("[messaging] Failed to broadcast lobby notification:", e);
      }

      return { messageId: result.id, conversationId: lobby.id };
    }),
  /**
   * messaging.getMessageSearch
   * Search messages by content across user's conversations.
   */
  getMessageSearch: protectedProcedure
    .input(z.object({ query: z.string(), limit: z.number().default(20) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return { items: [] };
      if (!input?.query || input.query.trim().length === 0) return { items: [] };
      try {
        const userId = await resolveUserId(ctx.user);
        if (!userId) return { items: [] };

        // Get user's conversation IDs
        const convos = await db.select({ id: conversations.id }).from(conversations)
          .where(sql`JSON_CONTAINS(${conversations.participants}, CAST(${userId} AS JSON))`)
          .limit(100);
        if (convos.length === 0) return { items: [] };
        const convIds = convos.map(c => c.id);

        const searchTerm = `%${input.query}%`;
        const results = await db.select({
          id: messages.id,
          conversationId: messages.conversationId,
          senderId: messages.senderId,
          content: messages.content,
          createdAt: messages.createdAt,
          senderName: users.name,
        })
          .from(messages)
          .leftJoin(users, eq(messages.senderId, users.id))
          .where(and(
            inArray(messages.conversationId, convIds),
            like(messages.content, searchTerm),
          ))
          .orderBy(desc(messages.createdAt))
          .limit(input.limit);

        return {
          items: results.map(m => ({
            id: String(m.id),
            conversationId: String(m.conversationId),
            senderId: String(m.senderId),
            senderName: m.senderName || '',
            content: m.content || '',
            createdAt: m.createdAt?.toISOString() || '',
          })),
        };
      } catch (e) {
        logger.error("[messaging] getMessageSearch error:", e);
        return { items: [] };
      }
    }),
  getMessageTemplates: protectedProcedure.query(async () => ({ items: [] })),
  getMuted: protectedProcedure.query(async () => ({ items: [] })),
  getNotificationSettings: protectedProcedure.query(async () => ({ settings: {} })),
  getPinned: protectedProcedure.query(async () => ({ items: [] })),
  getQuickResponses: protectedProcedure.query(async () => ({ items: [] })),
  /**
   * messaging.getReadReceipts
   * For a given messageId, return who has read the message.
   */
  getReadReceipts: protectedProcedure
    .input(z.object({ messageId: z.string() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return { items: [] };
      if (!input?.messageId) return { items: [] };
      try {
        const msgId = parseInt(input.messageId, 10);
        const [msg] = await db.select({ readBy: messages.readBy, conversationId: messages.conversationId })
          .from(messages).where(eq(messages.id, msgId)).limit(1);
        if (!msg) return { items: [] };

        // Verify current user is a participant in the conversation
        const userId = await resolveUserId(ctx.user);
        const [conv] = await db.select({ participants: conversations.participants })
          .from(conversations).where(eq(conversations.id, msg.conversationId)).limit(1);
        if (!conv || !(conv.participants as number[])?.includes(userId)) return { items: [] };

        const readByIds = (msg.readBy as number[]) || [];
        if (readByIds.length === 0) return { items: [] };

        const readers = await db.select({ id: users.id, name: users.name, email: users.email })
          .from(users).where(inArray(users.id, readByIds));

        return {
          items: readers.map(r => ({
            userId: String(r.id),
            name: r.name || '',
            email: r.email || '',
          })),
        };
      } catch (e) {
        logger.error("[messaging] getReadReceipts error:", e);
        return { items: [] };
      }
    }),
  getScheduled: protectedProcedure.query(async () => ({ items: [] })),
  /**
   * messaging.getSent
   * Returns messages sent by the current user, paginated.
   */
  getSent: protectedProcedure
    .input(z.object({ limit: z.number().default(30), offset: z.number().default(0) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return { items: [] };
      try {
        const userId = await resolveUserId(ctx.user);
        if (!userId) return { items: [] };

        const limit = input?.limit || 30;
        const offset = input?.offset || 0;

        const sentMessages = await db.select({
          id: messages.id,
          conversationId: messages.conversationId,
          content: messages.content,
          messageType: messages.messageType,
          createdAt: messages.createdAt,
          readBy: messages.readBy,
        })
          .from(messages)
          .where(eq(messages.senderId, userId))
          .orderBy(desc(messages.createdAt))
          .limit(limit)
          .offset(offset);

        return {
          items: sentMessages.map(m => ({
            id: String(m.id),
            conversationId: String(m.conversationId),
            content: m.content?.substring(0, 200) || '',
            messageType: m.messageType,
            readBy: (m.readBy as number[]) || [],
            createdAt: m.createdAt?.toISOString() || '',
          })),
        };
      } catch (e) {
        logger.error("[messaging] getSent error:", e);
        return { items: [] };
      }
    }),
  getSettings: protectedProcedure.query(async () => ({ settings: {} })),
  /**
   * messaging.getStarred
   * Returns messages the user has starred (tracked via auditLogs entityType='starred_message').
   */
  getStarred: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb(); if (!db) return { items: [] };
    try {
      const userId = await resolveUserId(ctx.user);
      if (!userId) return { items: [] };

      // Get starred message IDs from audit logs
      const starRecords = await db.select({ entityId: auditLogs.entityId })
        .from(auditLogs)
        .where(and(
          eq(auditLogs.userId, userId),
          eq(auditLogs.entityType, 'starred_message'),
          eq(auditLogs.action, 'star'),
        ))
        .orderBy(desc(auditLogs.createdAt))
        .limit(50);

      if (starRecords.length === 0) return { items: [] };
      const starredIds = starRecords.map(r => r.entityId).filter((id): id is number => id !== null);
      if (starredIds.length === 0) return { items: [] };

      const starredMessages = await db.select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        content: messages.content,
        messageType: messages.messageType,
        createdAt: messages.createdAt,
        senderName: users.name,
      })
        .from(messages)
        .leftJoin(users, eq(messages.senderId, users.id))
        .where(inArray(messages.id, starredIds))
        .orderBy(desc(messages.createdAt));

      return {
        items: starredMessages.map(m => ({
          id: String(m.id),
          conversationId: String(m.conversationId),
          senderId: String(m.senderId),
          senderName: m.senderName || '',
          content: m.content || '',
          messageType: m.messageType,
          createdAt: m.createdAt?.toISOString() || '',
        })),
      };
    } catch (e) {
      logger.error("[messaging] getStarred error:", e);
      return { items: [] };
    }
  }),
  /**
   * messaging.getThreadView
   * For a given parent messageId, return threaded replies (metadata.parentMessageId).
   */
  getThreadView: protectedProcedure
    .input(z.object({ messageId: z.string() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) return { items: [] };
      if (!input?.messageId) return { items: [] };
      try {
        const parentId = parseInt(input.messageId, 10);

        // Get the parent message first
        const [parent] = await db.select({
          id: messages.id, conversationId: messages.conversationId,
          senderId: messages.senderId, content: messages.content,
          createdAt: messages.createdAt,
        }).from(messages).where(eq(messages.id, parentId)).limit(1);
        if (!parent) return { items: [] };

        // Verify current user is a participant
        const userId = await resolveUserId(ctx.user);
        const [conv] = await db.select({ participants: conversations.participants })
          .from(conversations).where(eq(conversations.id, parent.conversationId)).limit(1);
        if (!conv || !(conv.participants as number[])?.includes(userId)) return { items: [] };

        // Get threaded replies: messages whose metadata.parentMessageId matches
        const replies = await db.select({
          id: messages.id,
          senderId: messages.senderId,
          content: messages.content,
          messageType: messages.messageType,
          createdAt: messages.createdAt,
          senderName: users.name,
        })
          .from(messages)
          .leftJoin(users, eq(messages.senderId, users.id))
          .where(and(
            eq(messages.conversationId, parent.conversationId),
            sql`JSON_EXTRACT(${messages.metadata}, '$.parentMessageId') = ${parentId}`,
          ))
          .orderBy(messages.createdAt)
          .limit(100);

        return {
          items: replies.map(r => ({
            id: String(r.id),
            senderId: String(r.senderId),
            senderName: r.senderName || '',
            content: r.content || '',
            messageType: r.messageType,
            createdAt: r.createdAt?.toISOString() || '',
          })),
        };
      } catch (e) {
        logger.error("[messaging] getThreadView error:", e);
        return { items: [] };
      }
    }),
  getTypingIndicators: protectedProcedure.query(async () => ({ typing: [] })),
  getVoiceMessages: protectedProcedure.query(async () => ({ items: [] })),
});
