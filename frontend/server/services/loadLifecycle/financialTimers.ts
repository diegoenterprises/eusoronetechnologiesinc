/**
 * FINANCIAL TIMER SERVICE — Detention, Demurrage & Layover
 *
 * Manages time-based financial charges:
 * - Detention: waiting at pickup (free time → billing)
 * - Demurrage: waiting at delivery (free time → billing)
 * - Layover: overnight/HOS rest stops
 *
 * Integrates with loadLifecycle state transitions as effects.
 */

import { getDb } from "../../db";
import { sql } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type TimerType = "DETENTION" | "DEMURRAGE" | "LAYOVER";
export type TimerStatus = "FREE_TIME" | "BILLING" | "STOPPED" | "WAIVED";

export interface TimerConfig {
  freeTimeMinutes: number;
  hourlyRate: number;
  maxChargeHours?: number;
  currency?: string;
}

export interface FinancialTimer {
  id: number;
  loadId: number;
  type: TimerType;
  status: TimerStatus;
  locationId?: number;
  startedAt: Date;
  freeTimeEndsAt: Date;
  billingStartedAt?: Date;
  stoppedAt?: Date;
  freeTimeMinutes: number;
  hourlyRate: number;
  maxChargeHours?: number;
  totalMinutes?: number;
  billableMinutes?: number;
  totalCharge?: number;
  waivedBy?: number;
  waiveReason?: string;
  currency: string;
}

export interface TimerSnapshot {
  id: number;
  loadId: number;
  type: TimerType;
  status: TimerStatus;
  elapsedMinutes: number;
  freeTimeRemaining: number;
  billableMinutes: number;
  currentCharge: number;
  hourlyRate: number;
  currency: string;
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT CONFIGS
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_TIMER_CONFIGS: Record<TimerType, TimerConfig> = {
  DETENTION: { freeTimeMinutes: 120, hourlyRate: 75, maxChargeHours: 24 },
  DEMURRAGE: { freeTimeMinutes: 120, hourlyRate: 75, maxChargeHours: 48 },
  LAYOVER: { freeTimeMinutes: 0, hourlyRate: 0, maxChargeHours: undefined },
};

const LAYOVER_FLAT_RATE = 350; // $350/day flat rate

// ═══════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════

export async function startTimer(
  loadId: number,
  type: TimerType,
  config?: Partial<TimerConfig>,
  locationId?: number,
): Promise<{ timerId: number } | null> {
  const db = await getDb();
  if (!db) return null;

  const cfg = { ...DEFAULT_TIMER_CONFIGS[type], ...config };
  const now = new Date();
  const freeTimeEnds = new Date(now.getTime() + cfg.freeTimeMinutes * 60000);

  try {
    const [result] = await db.execute(sql`
      INSERT INTO financial_timers
        (load_id, type, status, location_id, started_at, free_time_ends_at,
         free_time_minutes, hourly_rate, max_charge_hours, currency)
      VALUES
        (${loadId}, ${type}, ${"FREE_TIME"}, ${locationId ?? null},
         ${now}, ${freeTimeEnds},
         ${cfg.freeTimeMinutes}, ${cfg.hourlyRate},
         ${cfg.maxChargeHours ?? null}, ${cfg.currency ?? "USD"})
    `);
    const id = (result as any).insertId;
    console.log(`[FinancialTimer] Started ${type} timer #${id} for load ${loadId} (free time: ${cfg.freeTimeMinutes}min)`);
    return { timerId: id };
  } catch (e) {
    console.error(`[FinancialTimer] startTimer error:`, (e as Error).message);
    return null;
  }
}

export async function stopTimer(timerId: number): Promise<TimerSnapshot | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const rows = await db.execute(sql`
      SELECT * FROM financial_timers WHERE id = ${timerId} LIMIT 1
    `);
    const timer = ((rows as unknown as any[][])[0] || [])[0];
    if (!timer || timer.status === "STOPPED" || timer.status === "WAIVED") return null;

    const now = new Date();
    const startedAt = new Date(timer.started_at);
    const freeTimeEndsAt = new Date(timer.free_time_ends_at);
    const totalMinutes = Math.round((now.getTime() - startedAt.getTime()) / 60000);
    const billableMinutes = Math.max(0, Math.round((now.getTime() - freeTimeEndsAt.getTime()) / 60000));
    const hourlyRate = parseFloat(timer.hourly_rate);
    let totalCharge = 0;

    if (timer.type === "LAYOVER") {
      const days = Math.ceil(totalMinutes / (24 * 60));
      totalCharge = days * LAYOVER_FLAT_RATE;
    } else {
      totalCharge = (billableMinutes / 60) * hourlyRate;
      if (timer.max_charge_hours) {
        totalCharge = Math.min(totalCharge, timer.max_charge_hours * hourlyRate);
      }
    }

    totalCharge = Math.round(totalCharge * 100) / 100;

    await db.execute(sql`
      UPDATE financial_timers
      SET status = ${"STOPPED"}, stopped_at = ${now},
          total_minutes = ${totalMinutes}, billable_minutes = ${billableMinutes},
          total_charge = ${totalCharge}
      WHERE id = ${timerId}
    `);

    console.log(`[FinancialTimer] Stopped timer #${timerId}: ${totalMinutes}min total, ${billableMinutes}min billable, $${totalCharge}`);

    return {
      id: timerId,
      loadId: timer.load_id,
      type: timer.type,
      status: "STOPPED",
      elapsedMinutes: totalMinutes,
      freeTimeRemaining: 0,
      billableMinutes,
      currentCharge: totalCharge,
      hourlyRate,
      currency: timer.currency || "USD",
    };
  } catch (e) {
    console.error(`[FinancialTimer] stopTimer error:`, (e as Error).message);
    return null;
  }
}

export async function waiveTimer(
  timerId: number,
  waivedBy: number,
  reason: string,
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.execute(sql`
      UPDATE financial_timers
      SET status = ${"WAIVED"}, stopped_at = NOW(),
          waived_by = ${waivedBy}, waive_reason = ${reason},
          total_charge = 0
      WHERE id = ${timerId}
    `);
    console.log(`[FinancialTimer] Waived timer #${timerId} by user ${waivedBy}: ${reason}`);
    return true;
  } catch (e) {
    console.error(`[FinancialTimer] waiveTimer error:`, (e as Error).message);
    return false;
  }
}

export async function getActiveTimers(loadId: number): Promise<TimerSnapshot[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const rows = await db.execute(sql`
      SELECT * FROM financial_timers
      WHERE load_id = ${loadId} AND status IN (${"FREE_TIME"}, ${"BILLING"})
      ORDER BY started_at DESC
    `);
    const timers = (rows as unknown as any[][])[0] || [];
    const now = new Date();

    return timers.map((t: any) => {
      const startedAt = new Date(t.started_at);
      const freeTimeEndsAt = new Date(t.free_time_ends_at);
      const elapsedMinutes = Math.round((now.getTime() - startedAt.getTime()) / 60000);
      const freeTimeRemaining = Math.max(0, Math.round((freeTimeEndsAt.getTime() - now.getTime()) / 60000));
      const billableMinutes = Math.max(0, Math.round((now.getTime() - freeTimeEndsAt.getTime()) / 60000));
      const hourlyRate = parseFloat(t.hourly_rate);

      let currentCharge = 0;
      if (t.type === "LAYOVER") {
        currentCharge = Math.ceil(elapsedMinutes / (24 * 60)) * LAYOVER_FLAT_RATE;
      } else if (billableMinutes > 0) {
        currentCharge = (billableMinutes / 60) * hourlyRate;
        if (t.max_charge_hours) {
          currentCharge = Math.min(currentCharge, t.max_charge_hours * hourlyRate);
        }
      }
      currentCharge = Math.round(currentCharge * 100) / 100;

      // Auto-promote from FREE_TIME to BILLING
      const status: TimerStatus = freeTimeRemaining <= 0 ? "BILLING" : "FREE_TIME";

      return {
        id: t.id,
        loadId: t.load_id,
        type: t.type as TimerType,
        status,
        elapsedMinutes,
        freeTimeRemaining,
        billableMinutes,
        currentCharge,
        hourlyRate,
        currency: t.currency || "USD",
      };
    });
  } catch (e) {
    console.error(`[FinancialTimer] getActiveTimers error:`, (e as Error).message);
    return [];
  }
}

export async function getTimerHistory(loadId: number): Promise<TimerSnapshot[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const rows = await db.execute(sql`
      SELECT * FROM financial_timers
      WHERE load_id = ${loadId}
      ORDER BY started_at DESC
    `);
    return (((rows as unknown as any[][])[0]) || []).map((t: any) => ({
      id: t.id,
      loadId: t.load_id,
      type: t.type as TimerType,
      status: t.status as TimerStatus,
      elapsedMinutes: t.total_minutes || 0,
      freeTimeRemaining: 0,
      billableMinutes: t.billable_minutes || 0,
      currentCharge: parseFloat(t.total_charge || "0"),
      hourlyRate: parseFloat(t.hourly_rate || "0"),
      currency: t.currency || "USD",
    }));
  } catch (e) {
    console.error(`[FinancialTimer] getTimerHistory error:`, (e as Error).message);
    return [];
  }
}

/**
 * Promote any FREE_TIME timers that have passed their free time window to BILLING.
 * Called periodically by the scheduler.
 */
export async function promoteFreeTimeTimers(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const [result] = await db.execute(sql`
      UPDATE financial_timers
      SET status = ${"BILLING"}, billing_started_at = NOW()
      WHERE status = ${"FREE_TIME"} AND free_time_ends_at < NOW()
    `);
    const count = (result as any).affectedRows || 0;
    if (count > 0) {
      console.log(`[FinancialTimer] Promoted ${count} timers from FREE_TIME to BILLING`);
    }
    return count;
  } catch (e) {
    console.error(`[FinancialTimer] promoteFreeTimeTimers error:`, (e as Error).message);
    return 0;
  }
}
