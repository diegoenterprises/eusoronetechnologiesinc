/**
 * ANNOUNCEMENTS ROUTER
 * tRPC procedures for system announcements
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const announcementsRouter = router({
  /**
   * List announcements
   */
  list: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(20) }))
    .query(async () => {
      return [
        {
          id: "ann_001",
          title: "System Maintenance Scheduled",
          content: "Scheduled maintenance on January 28th from 2:00 AM to 4:00 AM CST. Brief service interruptions expected.",
          type: "system",
          priority: "high",
          createdAt: "2025-01-24T10:00:00Z",
          read: false,
        },
        {
          id: "ann_002",
          title: "New Feature: SpectraMatch Oil ID",
          content: "We've launched SpectraMatch, our new oil identification system. Check it out in Terminal SCADA.",
          type: "feature",
          priority: "normal",
          createdAt: "2025-01-22T14:00:00Z",
          read: true,
        },
        {
          id: "ann_003",
          title: "Holiday Schedule Reminder",
          content: "Please note adjusted operating hours for upcoming holidays. Check with dispatch for details.",
          type: "info",
          priority: "normal",
          createdAt: "2025-01-20T09:00:00Z",
          read: true,
        },
      ];
    }),

  /**
   * Get unread count
   */
  getUnreadCount: protectedProcedure
    .query(async () => {
      return { count: 1 };
    }),

  /**
   * Mark as read
   */
  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return { success: true, id: input.id };
    }),

  /**
   * Mark all as read
   */
  markAllRead: protectedProcedure.input(z.object({}).optional())
    .mutation(async () => {
      return { success: true, count: 1 };
    }),
});
