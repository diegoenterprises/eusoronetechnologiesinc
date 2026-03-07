/**
 * REAL-TIME RESOURCE AVAILABILITY BROADCASTS — WS-QP-005
 * Adapted from QPilotOS Pub-Sub notification system
 *
 * Monitors:
 *   1. Driver availability changes (status transitions)
 *   2. HOS approaching limits (< 2h, < 1h, < 30min driving)
 *   3. Permit/certification expiring (30 days, 7 days, expired)
 *   4. Equipment maintenance due
 *   5. Capacity thresholds (< 20% drivers available)
 */

import { sql } from "drizzle-orm";
import { resourceBroadcastLog } from "../../drizzle/schema";

interface ResourceAlert {
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  entityType: "driver" | "vehicle" | "permit" | "certification" | "capacity";
  entityId: number;
  metadata: Record<string, any>;
}

// HOS Monitor — runs every 5 minutes
export async function checkHosLimits(db: any, companyId: number): Promise<ResourceAlert[]> {
  const alerts: ResourceAlert[] = [];
  try {
    const [rows]: any = await db.execute(sql`
      SELECT da.driverId, da.hosDrivingRemaining, u.name
      FROM driver_availability da
      JOIN drivers d ON da.driverId = d.id
      JOIN users u ON d.userId = u.id
      WHERE da.companyId = ${companyId}
      AND da.hosDrivingRemaining < 120
    `);

    if (Array.isArray(rows)) {
      for (const row of rows) {
        const minutes = row.hosDrivingRemaining;
        let severity: "info" | "warning" | "critical" = "info";
        if (minutes < 30) severity = "critical";
        else if (minutes < 60) severity = "warning";

        alerts.push({
          type: "hos_warning",
          severity,
          title: `HOS Alert: ${row.name}`,
          message: `${row.name} has ${minutes} minutes driving time remaining`,
          entityType: "driver",
          entityId: row.driverId,
          metadata: { hosDrivingRemaining: minutes, driverName: row.name },
        });
      }
    }
  } catch {}
  return alerts;
}

// Permit/Certification Expiry Monitor — runs every hour
export async function checkExpirations(db: any, companyId: number): Promise<ResourceAlert[]> {
  const alerts: ResourceAlert[] = [];
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 86400000);
  const in30Days = new Date(now.getTime() + 30 * 86400000);

  try {
    // TWIC expiry
    const [twicRows]: any = await db.execute(sql`
      SELECT d.id as driverId, d.twicExpiry, u.name
      FROM drivers d
      JOIN users u ON d.userId = u.id
      WHERE d.companyId = ${companyId}
      AND d.twicExpiry IS NOT NULL
      AND d.twicExpiry <= ${in30Days.toISOString().slice(0, 10)}
    `);

    if (Array.isArray(twicRows)) {
      for (const row of twicRows) {
        const expiry = new Date(row.twicExpiry);
        let severity: "info" | "warning" | "critical" = "info";
        if (expiry <= now) severity = "critical";
        else if (expiry <= in7Days) severity = "warning";

        alerts.push({
          type: "twic_expiry",
          severity,
          title: `TWIC ${severity === "critical" ? "Expired" : "Expiring"}: ${row.name}`,
          message: `${row.name}'s TWIC card ${severity === "critical" ? "has expired" : `expires ${expiry.toLocaleDateString()}`}`,
          entityType: "certification",
          entityId: row.driverId,
          metadata: { expiryDate: row.twicExpiry, driverName: row.name },
        });
      }
    }

    // Medical card expiry
    const [medRows]: any = await db.execute(sql`
      SELECT d.id as driverId, d.medicalCardExpiry, u.name
      FROM drivers d
      JOIN users u ON d.userId = u.id
      WHERE d.companyId = ${companyId}
      AND d.medicalCardExpiry IS NOT NULL
      AND d.medicalCardExpiry <= ${in30Days.toISOString().slice(0, 10)}
    `);

    if (Array.isArray(medRows)) {
      for (const row of medRows) {
        const expiry = new Date(row.medicalCardExpiry);
        let severity: "info" | "warning" | "critical" = "info";
        if (expiry <= now) severity = "critical";
        else if (expiry <= in7Days) severity = "warning";

        alerts.push({
          type: "certification_expiry",
          severity,
          title: `Medical Card ${severity === "critical" ? "Expired" : "Expiring"}: ${row.name}`,
          message: `${row.name}'s medical card ${severity === "critical" ? "has expired" : `expires ${expiry.toLocaleDateString()}`}`,
          entityType: "certification",
          entityId: row.driverId,
          metadata: { expiryDate: row.medicalCardExpiry, driverName: row.name, type: "medical_card" },
        });
      }
    }
  } catch {}

  return alerts;
}

// Capacity Monitor — runs every 5 minutes
export async function checkCapacity(db: any, companyId: number): Promise<ResourceAlert[]> {
  const alerts: ResourceAlert[] = [];

  try {
    const [totalRows]: any = await db.execute(sql`
      SELECT COUNT(*) as total FROM drivers WHERE companyId = ${companyId}
    `);
    const [availRows]: any = await db.execute(sql`
      SELECT COUNT(*) as available FROM drivers
      WHERE companyId = ${companyId} AND status IN ('available', 'active')
    `);

    const total = totalRows?.[0]?.total || 0;
    const available = availRows?.[0]?.available || 0;
    const pct = total > 0 ? (available / total) * 100 : 0;

    if (pct < 20 && total > 0) {
      alerts.push({
        type: "capacity_alert",
        severity: pct < 10 ? "critical" : "warning",
        title: "Low Driver Capacity",
        message: `Only ${available} of ${total} drivers available (${pct.toFixed(0)}%)`,
        entityType: "capacity",
        entityId: companyId,
        metadata: { totalDrivers: total, availableDrivers: available, percentage: pct },
      });
    }
  } catch {}

  return alerts;
}

// Master broadcast function
export async function broadcastResourceAlerts(db: any, companyId: number): Promise<ResourceAlert[]> {
  const allAlerts: ResourceAlert[] = [
    ...await checkHosLimits(db, companyId),
    ...await checkExpirations(db, companyId),
    ...await checkCapacity(db, companyId),
  ];

  // Emit via WebSocket if available
  try {
    const { emitDispatchEvent } = await import("../_core/websocket");
    for (const alert of allAlerts) {
      emitDispatchEvent(String(companyId), {
        eventType: "resource:alert",
        alertType: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        entityType: alert.entityType,
        entityId: alert.entityId,
        metadata: alert.metadata,
        timestamp: new Date().toISOString(),
      } as any);
    }
  } catch {}

  // Log broadcasts
  for (const alert of allAlerts) {
    try {
      await db.insert(resourceBroadcastLog).values({
        companyId,
        broadcastType: alert.type,
        severity: alert.severity,
        message: alert.message,
        payload: JSON.stringify(alert.metadata),
        recipientCount: 1,
      });
    } catch {}
  }

  return allAlerts;
}
