/**
 * MESSAGING ROUTER
 * Real-time messaging and communication procedures
 * ALL data from database — conversations + messages tables
 */

import { z } from "zod";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { router, isolatedProcedure as protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { conversations, messages, users } from "../../drizzle/schema";

async function resolveUserId(ctxUser: any): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const email = ctxUser?.email || "";
  if (!email) return 0;
  try {
    const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    return row?.id || 0;
  } catch { return 0; }
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
          } as any).$returningId();
          convId = result[0]?.id;
        }
      } else {
        throw new Error("Either conversationId or to is required");
      }

      const result = await db.insert(messages).values({
        conversationId: convId,
        senderId,
        messageType: input.messageType as any,
        content: input.content,
        readBy: [senderId],
      } as any).$returningId();

      await db.update(conversations).set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, convId));

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
      const companyId = Number((ctx.user as any)?.companyId) || 0;
      const rows = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role })
        .from(users).where(companyId ? eq(users.companyId, companyId) : sql`1=1`).limit(50);
      return { items: rows.filter(u => u.id !== userId).map(u => ({ id: String(u.id), name: u.name || '', email: u.email || '', role: u.role })) };
    } catch (e) { return { items: [] }; }
  }),

  // Remaining stubs — these endpoints exist for UI compatibility
  // Real implementations require additional schema (drafts table, templates table, etc.)
  getArchive: protectedProcedure.query(async () => ({ items: [] })),
  getAttachments: protectedProcedure.query(async () => ({ items: [] })),
  getBroadcast: protectedProcedure.query(async () => ({ items: [] })),
  getChannelDirectory: protectedProcedure.query(async () => ({ items: [] })),
  getChannelSettings: protectedProcedure.query(async () => ({ settings: {} })),
  getChannels: protectedProcedure.query(async () => ({ items: [] })),
  getCompose: protectedProcedure.query(async () => ({})),
  getDrafts: protectedProcedure.query(async () => ({ items: [] })),
  getFileSharing: protectedProcedure.query(async () => ({ items: [] })),
  getGroupChat: protectedProcedure.query(async () => ({ items: [] })),
  getGroupCreate: protectedProcedure.query(async () => ({})),
  getGroupManagement: protectedProcedure.query(async () => ({ items: [] })),
  getGroupSettings: protectedProcedure.query(async () => ({ settings: {} })),
  getMessageSearch: protectedProcedure.query(async () => ({ items: [] })),
  getMessageTemplates: protectedProcedure.query(async () => ({ items: [] })),
  getMuted: protectedProcedure.query(async () => ({ items: [] })),
  getNotificationSettings: protectedProcedure.query(async () => ({ settings: {} })),
  getPinned: protectedProcedure.query(async () => ({ items: [] })),
  getQuickResponses: protectedProcedure.query(async () => ({ items: [] })),
  getReadReceipts: protectedProcedure.query(async () => ({ items: [] })),
  getScheduled: protectedProcedure.query(async () => ({ items: [] })),
  getSent: protectedProcedure.query(async () => ({ items: [] })),
  getSettings: protectedProcedure.query(async () => ({ settings: {} })),
  getStarred: protectedProcedure.query(async () => ({ items: [] })),
  getThreadView: protectedProcedure.query(async () => ({ items: [] })),
  getTypingIndicators: protectedProcedure.query(async () => ({ typing: [] })),
  getVoiceMessages: protectedProcedure.query(async () => ({ items: [] })),
});
