/**
 * SAFETY ALERTS ROUTER - SOS, driving events, emergency notifications
 */

import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { auditedProtectedProcedure as protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { safetyAlerts, speedEvents, users } from "../../drizzle/schema";

export const safetyAlertsRouter = router({
  // Trigger SOS alert
  triggerSOS: protectedProcedure.input(z.object({
    latitude: z.number(),
    longitude: z.number(),
    loadId: z.number().optional(),
    message: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const userId = ctx.user?.id;
    if (!userId) throw new Error("Not authenticated");

    const [alert] = await db.insert(safetyAlerts).values({
      userId: Number(userId),
      loadId: input.loadId,
      type: "sos",
      severity: "emergency",
      latitude: String(input.latitude),
      longitude: String(input.longitude),
      message: input.message || "SOS - Emergency assistance requested",
      status: "active",
      eventTimestamp: new Date(),
    }).$returningId();

    return { success: true, alertId: alert.id, message: "SOS alert sent. Emergency contacts notified." };
  }),

  // Create safety alert (speeding, harsh braking, etc.)
  createAlert: protectedProcedure.input(z.object({
    type: z.enum(["sos", "geofence_violation", "speeding", "harsh_braking", "rapid_acceleration", "fatigue", "deviation", "no_signal"]),
    severity: z.enum(["info", "warning", "critical", "emergency"]).default("warning"),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    loadId: z.number().optional(),
    message: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const userId = ctx.user?.id;
    if (!userId) throw new Error("Not authenticated");

    const [alert] = await db.insert(safetyAlerts).values({
      userId: Number(userId),
      loadId: input.loadId,
      type: input.type,
      severity: input.severity,
      latitude: input.latitude ? String(input.latitude) : null,
      longitude: input.longitude ? String(input.longitude) : null,
      message: input.message,
      metadata: input.metadata,
      status: "active",
      eventTimestamp: new Date(),
    }).$returningId();

    return { success: true, alertId: alert.id };
  }),

  // Get active alerts
  getActiveAlerts: protectedProcedure.input(z.object({
    userId: z.number().optional(),
    loadId: z.number().optional(),
    type: z.string().optional(),
    severity: z.string().optional(),
    limit: z.number().default(50),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];

    let conditions = [eq(safetyAlerts.status, "active")];
    if (input.userId) conditions.push(eq(safetyAlerts.userId, input.userId));
    if (input.loadId) conditions.push(eq(safetyAlerts.loadId, input.loadId));
    if (input.type) conditions.push(eq(safetyAlerts.type, input.type as any));
    if (input.severity) conditions.push(eq(safetyAlerts.severity, input.severity as any));

    const alerts = await db.select({
      id: safetyAlerts.id,
      userId: safetyAlerts.userId,
      loadId: safetyAlerts.loadId,
      type: safetyAlerts.type,
      severity: safetyAlerts.severity,
      lat: safetyAlerts.latitude,
      lng: safetyAlerts.longitude,
      message: safetyAlerts.message,
      status: safetyAlerts.status,
      eventTimestamp: safetyAlerts.eventTimestamp,
      userName: users.name,
    }).from(safetyAlerts).leftJoin(users, eq(safetyAlerts.userId, users.id)).where(and(...conditions)).orderBy(desc(safetyAlerts.eventTimestamp)).limit(input.limit);

    return alerts.map(a => ({
      id: a.id,
      userId: a.userId,
      userName: a.userName || "Driver",
      loadId: a.loadId,
      type: a.type,
      severity: a.severity,
      latitude: a.lat ? Number(a.lat) : null,
      longitude: a.lng ? Number(a.lng) : null,
      message: a.message,
      status: a.status,
      timestamp: a.eventTimestamp?.toISOString(),
    }));
  }),

  // Acknowledge an alert
  acknowledgeAlert: protectedProcedure.input(z.object({ alertId: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const userId = ctx.user?.id;

    await db.update(safetyAlerts).set({
      status: "acknowledged",
      acknowledgedBy: userId ? Number(userId) : null,
      acknowledgedAt: new Date(),
    }).where(eq(safetyAlerts.id, input.alertId));

    return { success: true };
  }),

  // Resolve an alert
  resolveAlert: protectedProcedure.input(z.object({ alertId: z.number(), resolution: z.string().optional() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    await db.update(safetyAlerts).set({
      status: "resolved",
      resolvedAt: new Date(),
    }).where(eq(safetyAlerts.id, input.alertId));

    return { success: true };
  }),

  // Mark as false alarm
  markFalseAlarm: protectedProcedure.input(z.object({ alertId: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    await db.update(safetyAlerts).set({ status: "false_alarm", resolvedAt: new Date() }).where(eq(safetyAlerts.id, input.alertId));

    return { success: true };
  }),

  // Record speed event
  recordSpeedEvent: protectedProcedure.input(z.object({
    recordedSpeed: z.number(),
    speedLimit: z.number().optional(),
    latitude: z.number(),
    longitude: z.number(),
    roadName: z.string().optional(),
    durationSeconds: z.number(),
    loadId: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const userId = ctx.user?.id;
    if (!userId) throw new Error("Not authenticated");

    const overage = input.speedLimit ? input.recordedSpeed - input.speedLimit : null;
    let severity: "minor" | "moderate" | "severe" = "minor";
    if (overage && overage > 15) severity = "severe";
    else if (overage && overage > 10) severity = "moderate";

    const [event] = await db.insert(speedEvents).values({
      userId: Number(userId),
      loadId: input.loadId,
      recordedSpeed: String(input.recordedSpeed),
      speedLimit: input.speedLimit ? String(input.speedLimit) : null,
      overage: overage ? String(overage) : null,
      latitude: String(input.latitude),
      longitude: String(input.longitude),
      roadName: input.roadName,
      durationSeconds: input.durationSeconds,
      severity,
      eventTimestamp: new Date(),
    }).$returningId();

    return { success: true, eventId: event.id, severity };
  }),

  // Get speed events for a user
  getSpeedEvents: protectedProcedure.input(z.object({ userId: z.number().optional(), loadId: z.number().optional(), limit: z.number().default(50) })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];

    const targetUserId = input.userId || ctx.user?.id;
    let conditions = [];
    if (targetUserId) conditions.push(eq(speedEvents.userId, Number(targetUserId)));
    if (input.loadId) conditions.push(eq(speedEvents.loadId, input.loadId));

    const events = await db.select().from(speedEvents).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(speedEvents.eventTimestamp)).limit(input.limit);

    return events.map(e => ({
      id: e.id,
      recordedSpeed: Number(e.recordedSpeed),
      speedLimit: e.speedLimit ? Number(e.speedLimit) : null,
      overage: e.overage ? Number(e.overage) : null,
      latitude: Number(e.latitude),
      longitude: Number(e.longitude),
      roadName: e.roadName,
      durationSeconds: e.durationSeconds,
      severity: e.severity,
      timestamp: e.eventTimestamp?.toISOString(),
    }));
  }),

  // Get alert statistics
  getAlertStats: protectedProcedure.input(z.object({ userId: z.number().optional(), days: z.number().default(30) })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return { total: 0, bySeverity: {}, byType: {} };

    const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
    const targetUserId = input.userId || ctx.user?.id;

    let conditions = [eq(safetyAlerts.status, "active")];
    if (targetUserId) conditions.push(eq(safetyAlerts.userId, Number(targetUserId)));

    const alerts = await db.select().from(safetyAlerts).where(and(...conditions)).limit(1000);

    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const a of alerts) {
      bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1;
      byType[a.type] = (byType[a.type] || 0) + 1;
    }

    return { total: alerts.length, bySeverity, byType };
  }),
});
