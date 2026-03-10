/**
 * RESOURCE BROADCASTS ROUTER — WS-QP-005
 * Exposes active alerts, alert history, subscription management
 */

import { z } from "zod";
import { isolatedApprovedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { resourceBroadcastLog, resourceBroadcastSubscriptions } from "../../drizzle/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { broadcastResourceAlerts } from "../services/resourceMonitor";

export const resourceBroadcastsRouter = router({

  getActiveAlerts: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const companyId = Number(ctx.user!.companyId) || 0;

      // Return alerts from last hour
      const [rows]: any = await db.execute(sql`
        SELECT * FROM resource_broadcast_log
        WHERE companyId = ${companyId}
        AND broadcastAt >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ORDER BY broadcastAt DESC
        LIMIT 50
      `);
      return Array.isArray(rows) ? rows : [];
    }),

  getAlertHistory: protectedProcedure
    .input(z.object({ hours: z.number().default(24) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const companyId = Number(ctx.user!.companyId) || 0;
      const hours = input?.hours || 24;

      const [rows]: any = await db.execute(sql`
        SELECT * FROM resource_broadcast_log
        WHERE companyId = ${companyId}
        AND broadcastAt >= DATE_SUB(NOW(), INTERVAL ${hours} HOUR)
        ORDER BY broadcastAt DESC
        LIMIT 200
      `);
      return Array.isArray(rows) ? rows : [];
    }),

  triggerBroadcast: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const companyId = Number(ctx.user!.companyId) || 0;

      const alerts = await broadcastResourceAlerts(db, companyId);
      return { success: true, alertCount: alerts.length, alerts };
    }),

  getSubscriptions: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const userId = Number(ctx.user!.id) || 0;

      return db.select().from(resourceBroadcastSubscriptions)
        .where(eq(resourceBroadcastSubscriptions.userId, userId));
    }),

  updateSubscription: protectedProcedure
    .input(z.object({
      resourceType: z.enum([
        "driver_availability", "hos_warning", "equipment_status",
        "permit_expiry", "certification_expiry", "twic_expiry", "insurance_expiry",
        "capacity_alert", "maintenance_due",
      ]),
      enabled: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const userId = Number(ctx.user!.id) || 0;
      const companyId = Number(ctx.user!.companyId) || 0;

      // Upsert subscription
      await db.insert(resourceBroadcastSubscriptions).values({
        userId, companyId, resourceType: input.resourceType, enabled: input.enabled,
      }).onDuplicateKeyUpdate({ set: { enabled: input.enabled } });

      return { success: true };
    }),
});
