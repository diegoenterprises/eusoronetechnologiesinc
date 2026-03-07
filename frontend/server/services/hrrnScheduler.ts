/**
 * HRRN DISPATCH SCHEDULER — WS-QP-001
 * Adapted from QPilotOS ScheduleServer HRRN algorithm
 *
 * Core formula: Priority = (W + S) / S
 *   W = wait time (minutes since load entered queue)
 *   S = estimated service time (pickup-to-delivery minutes)
 *
 * Enhancements over pure HRRN:
 *   - Base priority multiplier (hazmat loads get 1.5x, hot shots 2.0x)
 *   - Constraint-aware filtering (hazmat endorsement, HOS, equipment)
 *   - Batch recalculation every 60 seconds via scheduled job
 */

import { eq, and, sql } from "drizzle-orm";
import { dispatchQueuePriorities } from "../../drizzle/schema";

export interface HrrnEntry {
  loadId: number;
  waitMinutes: number;
  estimatedServiceMinutes: number;
  basePriority: number;
  hrrnScore: number;
  constraintFlags: {
    requiresHazmat: boolean;
    requiresTwic: boolean;
    minHosMinutes: number;
    equipmentType: string;
    hazmatClass: string | null;
  };
}

export function calculateHrrnScore(
  waitMinutes: number,
  estimatedServiceMinutes: number,
  basePriority: number
): number {
  const S = Math.max(estimatedServiceMinutes, 1);
  const W = Math.max(waitMinutes, 0);
  return ((W + S) / S) * basePriority;
}

export function getBasePriority(load: {
  hazmatClass?: string | null;
  priority?: string | null;
  cargoType?: string | null;
}): number {
  let base = 1.0;
  if (load.hazmatClass) base *= 1.5;
  if (load.priority === "hot") base *= 2.0;
  if (load.priority === "urgent") base *= 1.8;
  if (load.cargoType === "oversize") base *= 1.3;
  return base;
}

export function estimateServiceMinutes(load: {
  distance?: number | string | null;
  pickupDate?: string | Date | null;
  deliveryDate?: string | Date | null;
}): number {
  if (load.pickupDate && load.deliveryDate) {
    const diff = new Date(load.deliveryDate as string).getTime() - new Date(load.pickupDate as string).getTime();
    if (diff > 0) return Math.round(diff / 60000);
  }
  const miles = Number(load.distance) || 200;
  return Math.round((miles / 45) * 60) + 60;
}

export async function recalculateAllPriorities(db: any, companyId?: number): Promise<number> {
  // Single SQL UPDATE recalculates all queued entries at once
  const whereClause = companyId
    ? sql`WHERE status = 'queued' AND companyId = ${companyId}`
    : sql`WHERE status = 'queued'`;

  await db.execute(sql`
    UPDATE dispatch_queue_priorities
    SET currentHrrnScore = ((TIMESTAMPDIFF(MINUTE, enteredQueueAt, NOW()) + estimatedServiceMinutes) / GREATEST(estimatedServiceMinutes, 1)) * basePriority,
        lastRecalculatedAt = NOW()
    ${whereClause}
  `);

  // Return count of updated rows
  const [rows]: any = await db.execute(sql`
    SELECT COUNT(*) as cnt FROM dispatch_queue_priorities ${whereClause}
  `);
  return Array.isArray(rows) && rows[0] ? rows[0].cnt : 0;
}

export async function enqueueLoad(db: any, load: any, companyId: number): Promise<void> {
  const base = getBasePriority(load);
  const est = estimateServiceMinutes(load);

  await db.insert(dispatchQueuePriorities).values({
    loadId: load.id,
    companyId,
    basePriority: base.toFixed(4),
    estimatedServiceMinutes: est,
    constraintFlags: JSON.stringify({
      requiresHazmat: !!load.hazmatClass,
      requiresTwic: !!load.requiresTwic,
      minHosMinutes: est,
      equipmentType: load.equipmentType || "flatbed",
      hazmatClass: load.hazmatClass || null,
    }),
  }).onDuplicateKeyUpdate({ set: { basePriority: base.toFixed(4) } });
}

export async function markAssigned(db: any, loadId: number, driverId: number): Promise<void> {
  await db.update(dispatchQueuePriorities)
    .set({ status: "assigned" as const, assignedDriverId: driverId, assignedAt: new Date() })
    .where(eq(dispatchQueuePriorities.loadId, loadId));
}

export async function getStarvationWarnings(db: any, companyId: number, thresholdMinutes = 240): Promise<any[]> {
  const [rows]: any = await db.execute(sql`
    SELECT dqp.*, TIMESTAMPDIFF(MINUTE, dqp.enteredQueueAt, NOW()) as waitMinutes
    FROM dispatch_queue_priorities dqp
    WHERE dqp.companyId = ${companyId}
      AND dqp.status = 'queued'
      AND TIMESTAMPDIFF(MINUTE, dqp.enteredQueueAt, NOW()) >= ${thresholdMinutes}
    ORDER BY dqp.currentHrrnScore DESC
  `);
  return Array.isArray(rows) ? rows : [];
}
