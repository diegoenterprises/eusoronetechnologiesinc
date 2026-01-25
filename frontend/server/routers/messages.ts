/**
 * MESSAGES ROUTER
 * tRPC procedures for in-app messaging and communication
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const messageTypeSchema = z.enum(["text", "load_update", "bid_notification", "system", "document"]);

export const messagesRouter = router({
  /**
   * Get conversations for Messages page
   */
  getConversations: protectedProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async () => {
      return [
        { id: "conv_001", name: "Mike Johnson", participantName: "Mike Johnson", lastMessage: "Load picked up", time: "15m ago", lastMessageAt: "2025-01-23T10:30:00Z", unread: 2, unreadCount: 2, type: "driver", online: true, role: "driver" },
        { id: "conv_002", name: "Shell Oil", participantName: "Shell Oil", lastMessage: "Rate confirmed", time: "1h ago", lastMessageAt: "2025-01-23T09:00:00Z", unread: 0, unreadCount: 0, type: "shipper", online: false, role: "shipper" },
        { id: "conv_003", name: "Support", participantName: "Support", lastMessage: "Document verified", time: "2h ago", lastMessageAt: "2025-01-23T08:00:00Z", unread: 1, unreadCount: 1, type: "support", online: true, role: "support" },
      ];
    }),

  /**
   * Get conversations list
   */
  listConversations: protectedProcedure
    .input(z.object({
      type: z.enum(["all", "unread", "loads", "support"]).optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const conversations = [
        {
          id: "conv_001",
          type: "load",
          participants: [
            { id: "u1", name: "Mike Johnson", role: "DRIVER", avatar: null },
            { id: "u2", name: "Sarah Shipper", role: "SHIPPER", avatar: null },
          ],
          lastMessage: {
            content: "Load #45920 has been picked up successfully",
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            senderId: "u1",
          },
          unreadCount: 2,
          loadNumber: "LOAD-45920",
        },
        {
          id: "conv_002",
          type: "load",
          participants: [
            { id: "u3", name: "ABC Transport", role: "CARRIER", avatar: null },
            { id: "u4", name: "Shell Oil", role: "SHIPPER", avatar: null },
          ],
          lastMessage: {
            content: "Can we discuss the rate for the Dallas route?",
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            senderId: "u3",
          },
          unreadCount: 0,
          loadNumber: "LOAD-45918",
        },
        {
          id: "conv_003",
          type: "support",
          participants: [
            { id: "u5", name: "Support Team", role: "SUPPORT", avatar: null },
          ],
          lastMessage: {
            content: "Your document has been verified successfully",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            senderId: "u5",
          },
          unreadCount: 1,
        },
      ];

      return {
        conversations,
        total: conversations.length,
        unreadTotal: conversations.reduce((sum, c) => sum + c.unreadCount, 0),
      };
    }),

  /**
   * Get messages in a conversation
   */
  getMessages: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      limit: z.number().default(50),
      before: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const messages = [
        {
          id: "msg_001",
          conversationId: input.conversationId,
          senderId: "u1",
          senderName: "Mike Johnson",
          content: "I've arrived at the pickup location",
          type: "text",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: true,
        },
        {
          id: "msg_002",
          conversationId: input.conversationId,
          senderId: "u2",
          senderName: "Sarah Shipper",
          content: "Great! The loading dock is at Gate 3",
          type: "text",
          timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
          read: true,
        },
        {
          id: "msg_003",
          conversationId: input.conversationId,
          senderId: "system",
          senderName: "System",
          content: "Load status updated: Loading in progress",
          type: "load_update",
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          read: true,
          metadata: { loadNumber: "LOAD-45920", status: "loading" },
        },
        {
          id: "msg_004",
          conversationId: input.conversationId,
          senderId: "u1",
          senderName: "Mike Johnson",
          content: "Load #45920 has been picked up successfully",
          type: "text",
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          read: false,
        },
      ];

      return {
        messages,
        hasMore: false,
      };
    }),

  /**
   * Send a message
   */
  sendMessage: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      content: z.string(),
      type: messageTypeSchema.default("text"),
      metadata: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return {
        id: `msg_${Date.now()}`,
        conversationId: input.conversationId,
        senderId: ctx.user?.id,
        senderName: ctx.user?.name,
        content: input.content,
        type: input.type,
        timestamp: new Date().toISOString(),
        read: false,
      };
    }),

  /**
   * Create a new conversation
   */
  createConversation: protectedProcedure
    .input(z.object({
      participantIds: z.array(z.string()),
      loadNumber: z.string().optional(),
      initialMessage: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const conversationId = `conv_${Date.now()}`;
      
      return {
        id: conversationId,
        createdAt: new Date().toISOString(),
        createdBy: ctx.user?.id,
      };
    }),

  /**
   * Mark messages as read
   */
  markAsRead: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      messageIds: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        conversationId: input.conversationId,
        markedCount: input.messageIds?.length || 0,
      };
    }),

  /**
   * Get unread count
   */
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        total: 3,
        byConversation: {
          conv_001: 2,
          conv_003: 1,
        },
      };
    }),

  /**
   * Search messages
   */
  search: protectedProcedure
    .input(z.object({
      query: z.string(),
      conversationId: z.string().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      return {
        results: [
          {
            messageId: "msg_001",
            conversationId: "conv_001",
            content: "I've arrived at the pickup location",
            timestamp: new Date().toISOString(),
            senderName: "Mike Johnson",
            highlight: "arrived at the pickup location",
          },
        ],
        total: 1,
      };
    }),

  /**
   * Delete conversation
   */
  deleteConversation: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, conversationId: input.conversationId };
    }),

  /**
   * Archive conversation
   */
  archiveConversation: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, conversationId: input.conversationId };
    }),

  send: protectedProcedure.input(z.object({ conversationId: z.string(), content: z.string() })).mutation(async ({ input }) => ({ success: true, messageId: "msg_123" })),
});
