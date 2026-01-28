/**
 * NOTIFICATIONS ROUTER
 * tRPC procedures for notification management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const notificationTypeSchema = z.enum(["alert", "info", "success", "warning", "action_required"]);
const notificationCategorySchema = z.enum(["loads", "compliance", "safety", "billing", "system", "drivers"]);

export const notificationsRouter = router({
  /**
   * Get notifications summary
   */
  getSummary: protectedProcedure
    .query(async () => {
      return {
        total: 12,
        unread: 4,
        read: 8,
        alerts: 3,
        byCategory: {
          loads: 5,
          compliance: 3,
          safety: 2,
          billing: 1,
          system: 1,
        },
      };
    }),

  /**
   * Get all notifications for current user
   */
  list: protectedProcedure
    .input(z.object({
      category: notificationCategorySchema.optional(),
      type: z.string().optional(),
      read: z.boolean().optional(),
      archived: z.boolean().default(false).optional(),
      limit: z.number().default(50).optional(),
      offset: z.number().default(0).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const notifications = [
        {
          id: "n1",
          type: "alert",
          category: "compliance",
          title: "Medical Card Expiring",
          message: "Driver Mike Johnson's medical card expires in 14 days.",
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          read: false,
          archived: false,
          actionUrl: "/compliance/dq-files",
          actionLabel: "View DQ File",
        },
        {
          id: "n2",
          type: "action_required",
          category: "loads",
          title: "New Bid Received",
          message: "ABC Transport submitted a bid of $2,450 for Load #45921",
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          read: false,
          archived: false,
          actionUrl: "/bids",
          actionLabel: "Review Bid",
        },
        {
          id: "n3",
          type: "warning",
          category: "safety",
          title: "CSA Score Alert",
          message: "Vehicle Maintenance BASIC score increased to 58%.",
          timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
          read: false,
          archived: false,
          actionUrl: "/safety/csa-scores",
          actionLabel: "View CSA Scores",
        },
        {
          id: "n4",
          type: "success",
          category: "loads",
          title: "Load Delivered",
          message: "Load #45918 successfully delivered. BOL signed.",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: true,
          archived: false,
        },
      ];

      let filtered = notifications.filter(n => n.archived === input.archived);
      
      if (input.category) {
        filtered = filtered.filter(n => n.category === input.category);
      }
      if (input.read !== undefined) {
        filtered = filtered.filter(n => n.read === input.read);
      }

      const result = filtered.slice(input.offset, input.offset + input.limit) as any;
      result.notifications = result;
      return result;
    }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string().optional(), notificationId: z.string().optional() }))
    .mutation(async ({ input }) => {
      return { success: true, id: input.id || input.notificationId };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure
    .input(z.object({}).optional())
    .mutation(async ({ ctx }) => {
      return { success: true, count: 5 };
    }),

  /**
   * Archive notification
   */
  archive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, id: input.id };
    }),

  /**
   * Delete notification
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, id: input.id };
    }),

  /**
   * Get notification preferences
   */
  getPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        email: {
          loads: true,
          compliance: true,
          safety: true,
          billing: true,
          system: false,
        },
        push: {
          loads: true,
          compliance: true,
          safety: true,
          billing: false,
          system: false,
        },
        sms: {
          loads: false,
          compliance: true,
          safety: true,
          billing: false,
          system: false,
        },
      };
    }),

  /**
   * Update notification preferences
   */
  updatePreferences: protectedProcedure
    .input(z.object({
      channel: z.enum(["email", "push", "sms"]),
      category: notificationCategorySchema,
      enabled: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      return { success: true, ...input };
    }),

  // Additional notification procedures
  getSettings: protectedProcedure.query(async () => ({ email: true, push: true, sms: false, quiet: { start: "22:00", end: "07:00" } })),
  updateSetting: protectedProcedure.input(z.object({ key: z.string().optional(), value: z.any(), setting: z.string().optional() })).mutation(async ({ input }) => ({ success: true, key: input.key || input.setting })),
  getUnreadCount: protectedProcedure.query(async () => 5),
  markRead: protectedProcedure.input(z.object({ notificationId: z.string().optional(), id: z.string().optional() })).mutation(async ({ input }) => ({ success: true, notificationId: input.notificationId || input.id })),
  markAllRead: protectedProcedure.mutation(async () => ({ success: true, markedCount: 5 })),

  // Push notifications
  getPushStats: protectedProcedure.query(async () => ({ 
    sent: 1250, 
    delivered: 1200, 
    opened: 480, 
    openRate: 40,
    registeredDevices: 85,
    sentThisMonth: 1250,
    deliveryRate: 96,
  })),
  getPushSettings: protectedProcedure.query(async () => ({ 
    enabled: true, 
    deviceToken: "abc123",
    categories: { loads: true, alerts: true, messages: true, system: true },
  })),
  getDevices: protectedProcedure.query(async () => ([
    { id: "d1", name: "iPhone 15", type: "ios", lastActive: "2025-01-23" },
    { id: "d2", name: "Galaxy S24", type: "android", lastActive: "2025-01-22" },
  ])),
  sendPush: protectedProcedure.input(z.object({ userId: z.string().optional(), title: z.string(), body: z.string().optional(), message: z.string().optional() })).mutation(async ({ input }) => ({ success: true, messageId: "msg_123" })),

  // SMS notifications
  getSMSStats: protectedProcedure.query(async () => ({ 
    sent: 450, 
    delivered: 440, 
    failed: 10, 
    remaining: 550,
    costThisMonth: 45.50,
    sentThisMonth: 450,
    deliveryRate: 97.8,
  })),
  sendSMS: protectedProcedure.input(z.object({ to: z.string(), message: z.string(), phoneNumber: z.string().optional() })).mutation(async ({ input }) => ({ success: true, messageId: "sms_123" })),
  getSMSTemplates: protectedProcedure.query(async () => [
    { id: "st1", name: "Load Assignment", template: "You have been assigned to load {{loadNumber}}", active: true },
    { id: "st2", name: "Delivery Confirmation", template: "Load {{loadNumber}} delivered successfully", active: true },
  ]),
  toggleSMSTemplate: protectedProcedure.input(z.object({ templateId: z.string(), active: z.boolean().optional(), enabled: z.boolean().optional() })).mutation(async ({ input }) => ({ success: true, templateId: input.templateId, active: input.active ?? input.enabled })),
});
