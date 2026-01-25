/**
 * ACTIVITY ROUTER
 * tRPC procedures for activity timeline and user activities
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const activityRouter = router({
  /**
   * Get activity timeline
   */
  getTimeline: protectedProcedure
    .input(z.object({
      type: z.string().optional(),
      dateRange: z.string().optional(),
      limit: z.number().optional().default(50),
    }))
    .query(async ({ ctx }) => {
      return [
        {
          id: "act_001",
          type: "load_created",
          title: "New Load Created",
          description: "Load #LOAD-45921 created for Houston to Dallas route",
          timestamp: new Date().toISOString(),
          userId: ctx.user?.id,
          metadata: { loadId: "load_001" },
        },
        {
          id: "act_002",
          type: "driver_assigned",
          title: "Driver Assigned",
          description: "Mike Johnson assigned to Load #LOAD-45920",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          userId: ctx.user?.id,
          metadata: { loadId: "load_002", driverId: "drv_001" },
        },
        {
          id: "act_003",
          type: "document_uploaded",
          title: "Document Uploaded",
          description: "BOL uploaded for Load #LOAD-45919",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          userId: ctx.user?.id,
          metadata: { documentId: "doc_001" },
        },
      ];
    }),

  /**
   * Get activity summary
   */
  getSummary: protectedProcedure
    .input(z.object({
      dateRange: z.string().optional(),
    }))
    .query(async () => {
      return {
        totalActivities: 156,
        todayActivities: 24,
        weekActivities: 89,
        totalToday: 24,
        loadsToday: 8,
        bidsToday: 12,
        thisWeek: 89,
        loadsCreated: 45,
        driversAssigned: 38,
        documentsUploaded: 28,
        messagesExchanged: 156,
        loadActivities: 45,
        userActivities: 28,
        paymentActivities: 15,
      };
    }),

  /**
   * Get recent activities
   */
  getRecent: protectedProcedure
    .input(z.object({
      limit: z.number().optional().default(10),
    }))
    .query(async () => {
      return [
        {
          id: "act_001",
          type: "load_created",
          title: "New Load Created",
          description: "Load #LOAD-45921 created",
          timestamp: new Date().toISOString(),
        },
      ];
    }),
});
