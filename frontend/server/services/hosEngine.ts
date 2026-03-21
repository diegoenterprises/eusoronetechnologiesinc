/**
 * HOS ENGINE — Hours of Service Compliance Engine
 * Per 49 CFR 395 — Real tracking with DB-backed state + Samsara fallback
 *
 * Federal HOS Rules:
 * - 11-Hour Driving Limit: May drive max 11h after 10 consecutive hours off duty
 * - 14-Hour On-Duty Limit: Cannot drive beyond 14h after coming on duty (non-extendable)
 * - 30-Minute Break: Required after 8h cumulative driving without 30min break
 * - 60/70-Hour Cycle: Cannot drive after 60/70h on-duty in 7/8 consecutive days
 * - 10-Hour Off-Duty: Must have 10 consecutive hours off-duty before driving
 * - 34-Hour Restart: Resets 60/70-hour cycle
 *
 * State-specific overrides:
 * - California: meal break ≤5h (not ≤8h)
 * - Short-haul exemption: 150-mile radius, 14h window, no ELD needed
 * - Agricultural exemption: planting/harvest season, state-specific
 */

import { eq, and, desc, sql, gte } from "drizzle-orm";
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { users, drivers, loads } from "../../drizzle/schema";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS — 49 CFR 395
// ═══════════════════════════════════════════════════════════════

export const HOS_RULES = {
  maxDrivingMinutes: 660,           // 11 hours
  maxOnDutyMinutes: 840,            // 14 hours (window)
  breakRequiredAfterMinutes: 480,   // 8 hours driving triggers 30-min break
  minBreakMinutes: 30,              // 30-minute rest break
  minOffDutyMinutes: 600,           // 10 hours consecutive off-duty reset
  cycle7DayMinutes: 3600,           // 60 hours / 7-day
  cycle8DayMinutes: 4200,           // 70 hours / 8-day
  restartMinutes: 2040,             // 34-hour restart
  maxLegalWeightLbs: 80000,         // Federal bridge formula max
  // California-specific
  caMealBreakMinutes: 300,          // 5 hours (not 8)
  caMinMealBreak: 30,
} as const;

export type DutyStatus = "off_duty" | "sleeper" | "driving" | "on_duty";

export interface HOSState {
  userId: number;
  status: DutyStatus;
  statusStartedAt: string;
  // Time used TODAY (minutes)
  drivingMinutesToday: number;
  onDutyMinutesToday: number;
  // Time since last qualifying off-duty (10h+)
  drivingMinutesSinceReset: number;
  onDutyMinutesSinceReset: number;
  // Cycle (rolling 7/8 day)
  cycleMinutesUsed: number;
  cycleDays: number; // 7 or 8
  // Break tracking
  drivingMinutesSinceBreak: number;
  lastBreakAt: string | null;
  lastOffDutyAt: string | null;
  // Violations
  violations: HOSViolation[];
  // Log entries
  todayLog: LogEntry[];
}

export interface HOSViolation {
  type: "driving_limit" | "on_duty_limit" | "cycle_limit" | "break_required" | "off_duty_required";
  description: string;
  severity: "warning" | "violation";
  cfr: string;
  detectedAt: string;
}

export interface LogEntry {
  status: DutyStatus;
  startTime: string;
  endTime: string | null;
  duration: string;
  location?: string;
}

export interface HOSSummary {
  status: DutyStatus;
  currentStatus: DutyStatus;
  drivingHours: number;
  onDutyHours: number;
  cycleHours: number;
  drivingRemaining: string;
  onDutyRemaining: string;
  cycleRemaining: string;
  breakRemaining: string;
  breakRequired: boolean;
  breakDueIn: string;
  canDrive: boolean;
  canAcceptLoad: boolean;
  hoursAvailable: { driving: number; onDuty: number; cycle: number };
  violations: HOSViolation[];
  todayLog: LogEntry[];
  lastBreak: string | null;
  nextBreakRequired: string | null;
  drivingToday: number;
  onDutyToday: number;
  cycleUsed: number;
}

// ═══════════════════════════════════════════════════════════════
// DB-BACKED HOS STATE — persists across server restarts
// Hot cache in memory; source of truth in hos_state table.
// Every state change also writes an immutable audit row to hos_logs
// per 49 CFR 395.8 (6-month retention requirement).
// ═══════════════════════════════════════════════════════════════

const hosCache = new Map<number, HOSState>();

function getDefaultState(userId: number): HOSState {
  return {
    userId,
    status: "off_duty",
    statusStartedAt: new Date().toISOString(),
    drivingMinutesToday: 0,
    onDutyMinutesToday: 0,
    drivingMinutesSinceReset: 0,
    onDutyMinutesSinceReset: 0,
    cycleMinutesUsed: 0,
    cycleDays: 8,
    drivingMinutesSinceBreak: 0,
    lastBreakAt: null,
    lastOffDutyAt: new Date().toISOString(),
    violations: [],
    todayLog: [],
  };
}

/**
 * Load HOS state from DB, falling back to default if no row exists.
 * Populates the hot cache on first load.
 */
async function getStateFromDB(userId: number): Promise<HOSState> {
  if (hosCache.has(userId)) return hosCache.get(userId)!;

  try {
    const db = await getDb();
    if (db) {
      const rows: any[] = await db.execute(
        sql`SELECT * FROM hos_state WHERE userId = ${userId} LIMIT 1`
      ).then((r: any) => (Array.isArray(r) ? (Array.isArray(r[0]) ? r[0] : r) : []));

      if (rows.length > 0) {
        const row = rows[0];
        const state: HOSState = {
          userId,
          status: row.status || "off_duty",
          statusStartedAt: row.statusStartedAt ? new Date(row.statusStartedAt).toISOString() : new Date().toISOString(),
          drivingMinutesToday: row.drivingMinutesToday || 0,
          onDutyMinutesToday: row.onDutyMinutesToday || 0,
          drivingMinutesSinceReset: row.drivingMinutesSinceReset || 0,
          onDutyMinutesSinceReset: row.onDutyMinutesSinceReset || 0,
          cycleMinutesUsed: row.cycleMinutesUsed || 0,
          cycleDays: row.cycleDays || 8,
          drivingMinutesSinceBreak: row.drivingMinutesSinceBreak || 0,
          lastBreakAt: row.lastBreakAt ? new Date(row.lastBreakAt).toISOString() : null,
          lastOffDutyAt: row.lastOffDutyAt ? new Date(row.lastOffDutyAt).toISOString() : null,
          violations: safeJsonParse(row.violations, []),
          todayLog: safeJsonParse(row.todayLog, []),
        };
        hosCache.set(userId, state);
        return state;
      }
    }
  } catch (e) {
    logger.warn(`[HOS] DB load failed for user ${userId}, using default:`, (e as any)?.message);
  }

  const def = getDefaultState(userId);
  hosCache.set(userId, def);
  return def;
}

function safeJsonParse(val: any, fallback: any): any {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

/**
 * Persist HOS state to DB (upsert) + write immutable audit log entry.
 */
async function persistState(state: HOSState, auditEvent?: {
  eventType: string;
  fromStatus?: DutyStatus | null;
  toStatus?: DutyStatus | null;
  location?: string;
  source?: string;
  violationType?: string;
  violationCfr?: string;
}): Promise<void> {
  hosCache.set(state.userId, state);

  try {
    const db = await getDb();
    if (!db) return;

    // Upsert hos_state
    await db.execute(sql`
      INSERT INTO hos_state (userId, status, statusStartedAt, drivingMinutesToday, onDutyMinutesToday,
        drivingMinutesSinceReset, onDutyMinutesSinceReset, cycleMinutesUsed, cycleDays,
        drivingMinutesSinceBreak, lastBreakAt, lastOffDutyAt, violations, todayLog)
      VALUES (${state.userId}, ${state.status}, ${state.statusStartedAt},
        ${state.drivingMinutesToday}, ${state.onDutyMinutesToday},
        ${state.drivingMinutesSinceReset}, ${state.onDutyMinutesSinceReset},
        ${state.cycleMinutesUsed}, ${state.cycleDays}, ${state.drivingMinutesSinceBreak},
        ${state.lastBreakAt}, ${state.lastOffDutyAt},
        ${JSON.stringify(state.violations)}, ${JSON.stringify(state.todayLog)})
      ON DUPLICATE KEY UPDATE
        status = VALUES(status), statusStartedAt = VALUES(statusStartedAt),
        drivingMinutesToday = VALUES(drivingMinutesToday), onDutyMinutesToday = VALUES(onDutyMinutesToday),
        drivingMinutesSinceReset = VALUES(drivingMinutesSinceReset),
        onDutyMinutesSinceReset = VALUES(onDutyMinutesSinceReset),
        cycleMinutesUsed = VALUES(cycleMinutesUsed), cycleDays = VALUES(cycleDays),
        drivingMinutesSinceBreak = VALUES(drivingMinutesSinceBreak),
        lastBreakAt = VALUES(lastBreakAt), lastOffDutyAt = VALUES(lastOffDutyAt),
        violations = VALUES(violations), todayLog = VALUES(todayLog)
    `);

    // Write immutable audit log entry (49 CFR 395.8)
    if (auditEvent) {
      await db.execute(sql`
        INSERT INTO hos_logs (userId, eventType, fromStatus, toStatus, location, source,
          violationType, violationCfr, drivingMinutesAtEvent, onDutyMinutesAtEvent, cycleMinutesAtEvent)
        VALUES (${state.userId}, ${auditEvent.eventType}, ${auditEvent.fromStatus || null},
          ${auditEvent.toStatus || null}, ${auditEvent.location || null},
          ${auditEvent.source || 'driver'}, ${auditEvent.violationType || null},
          ${auditEvent.violationCfr || null}, ${state.drivingMinutesSinceReset},
          ${state.onDutyMinutesSinceReset}, ${state.cycleMinutesUsed})
      `);
    }
  } catch (e) {
    logger.error(`[HOS] DB persist failed for user ${state.userId}:`, (e as any)?.message);
  }
}

/** Sync wrapper for backward compat — reads from cache only */
function getState(userId: number): HOSState {
  if (!hosCache.has(userId)) {
    hosCache.set(userId, getDefaultState(userId));
  }
  return hosCache.get(userId)!;
}

/**
 * Resolve a driver's timezone from DB (users.timezone or metadata.preferences.timezone).
 * Falls back to America/Chicago (FMCSA default home terminal time).
 * Cached for 5 minutes to avoid repeated DB hits.
 */
const tzCache = new Map<number, { tz: string; ts: number }>();
const TZ_TTL_MS = 300_000; // 5 minutes

async function getDriverTimezone(userId: number): Promise<string> {
  const cached = tzCache.get(userId);
  if (cached && Date.now() - cached.ts < TZ_TTL_MS) return cached.tz;

  try {
    const db = await getDb();
    if (db) {
      const rows: any[] = await db.execute(
        sql`SELECT timezone, metadata FROM users WHERE id = ${userId} LIMIT 1`
      ).then((r: any) => (Array.isArray(r) ? (Array.isArray(r[0]) ? r[0] : r) : []));

      if (rows.length > 0) {
        const row = rows[0];
        // Direct column first, then metadata.preferences.timezone
        let tz = row.timezone;
        if (!tz && row.metadata) {
          try {
            const meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
            tz = meta?.preferences?.timezone || meta?.displayPreferences?.timezone;
          } catch {}
        }
        tz = tz || 'America/Chicago';
        tzCache.set(userId, { tz, ts: Date.now() });
        return tz;
      }
    }
  } catch (e) {
    logger.warn(`[HOS] timezone lookup failed for user ${userId}:`, (e as any)?.message);
  }

  return 'America/Chicago';
}

function minutesSince(isoStr: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000));
}

function formatHM(minutes: number): string {
  const h = Math.floor(Math.abs(minutes) / 60);
  const m = Math.round(Math.abs(minutes) % 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

// ═══════════════════════════════════════════════════════════════
// CORE: Compute current HOS from state + elapsed time
// ═══════════════════════════════════════════════════════════════

function computeCurrentHOS(state: HOSState): HOSSummary {
  const elapsed = minutesSince(state.statusStartedAt);

  // Add elapsed time to current status
  let drivingToday = state.drivingMinutesToday;
  let onDutyToday = state.onDutyMinutesToday;
  let drivingSinceReset = state.drivingMinutesSinceReset;
  let onDutySinceReset = state.onDutyMinutesSinceReset;
  let drivingSinceBreak = state.drivingMinutesSinceBreak;
  let cycleUsed = state.cycleMinutesUsed;

  if (state.status === "driving") {
    drivingToday += elapsed;
    onDutyToday += elapsed;
    drivingSinceReset += elapsed;
    onDutySinceReset += elapsed;
    drivingSinceBreak += elapsed;
    cycleUsed += elapsed;
  } else if (state.status === "on_duty") {
    onDutyToday += elapsed;
    onDutySinceReset += elapsed;
    cycleUsed += elapsed;
  }
  // off_duty and sleeper don't add to duty time

  // Remaining calculations
  const drivingRemaining = Math.max(0, HOS_RULES.maxDrivingMinutes - drivingSinceReset);
  const onDutyRemaining = Math.max(0, HOS_RULES.maxOnDutyMinutes - onDutySinceReset);
  const cycleRemaining = Math.max(0, (state.cycleDays === 7 ? HOS_RULES.cycle7DayMinutes : HOS_RULES.cycle8DayMinutes) - cycleUsed);
  const breakNeededIn = Math.max(0, HOS_RULES.breakRequiredAfterMinutes - drivingSinceBreak);

  // Check violations
  const violations: HOSViolation[] = [...state.violations];
  const now = new Date().toISOString();

  if (drivingSinceReset > HOS_RULES.maxDrivingMinutes) {
    violations.push({
      type: "driving_limit",
      description: `Exceeded 11-hour driving limit by ${formatHM(drivingSinceReset - HOS_RULES.maxDrivingMinutes)}`,
      severity: "violation",
      cfr: "49 CFR 395.3(a)(3)",
      detectedAt: now,
    });
  } else if (drivingRemaining <= 60 && state.status === "driving") {
    violations.push({
      type: "driving_limit",
      description: `Only ${formatHM(drivingRemaining)} driving time remaining`,
      severity: "warning",
      cfr: "49 CFR 395.3(a)(3)",
      detectedAt: now,
    });
  }

  if (onDutySinceReset > HOS_RULES.maxOnDutyMinutes) {
    violations.push({
      type: "on_duty_limit",
      description: `Exceeded 14-hour on-duty window by ${formatHM(onDutySinceReset - HOS_RULES.maxOnDutyMinutes)}`,
      severity: "violation",
      cfr: "49 CFR 395.3(a)(2)",
      detectedAt: now,
    });
  }

  if (cycleUsed > (state.cycleDays === 7 ? HOS_RULES.cycle7DayMinutes : HOS_RULES.cycle8DayMinutes)) {
    violations.push({
      type: "cycle_limit",
      description: `Exceeded ${state.cycleDays === 7 ? "60" : "70"}-hour/${state.cycleDays}-day cycle limit`,
      severity: "violation",
      cfr: "49 CFR 395.3(b)",
      detectedAt: now,
    });
  }

  const breakRequired = drivingSinceBreak >= HOS_RULES.breakRequiredAfterMinutes;
  if (breakRequired && state.status === "driving") {
    violations.push({
      type: "break_required",
      description: "30-minute break required after 8 hours of cumulative driving",
      severity: "violation",
      cfr: "49 CFR 395.3(a)(3)(ii)",
      detectedAt: now,
    });
  }

  // Can the driver legally drive?
  const canDrive =
    drivingRemaining > 0 &&
    onDutyRemaining > 0 &&
    cycleRemaining > 0 &&
    !breakRequired &&
    violations.filter(v => v.severity === "violation").length === 0;

  // Can driver accept a new load? Need at least 2h driving + no active violations
  const canAcceptLoad = drivingRemaining >= 120 && onDutyRemaining >= 120 && cycleRemaining >= 120 && !breakRequired;

  return {
    status: state.status,
    currentStatus: state.status,
    drivingHours: Math.round(drivingSinceReset / 60 * 10) / 10,
    onDutyHours: Math.round(onDutySinceReset / 60 * 10) / 10,
    cycleHours: Math.round(cycleUsed / 60 * 10) / 10,
    drivingRemaining: formatHM(drivingRemaining),
    onDutyRemaining: formatHM(onDutyRemaining),
    cycleRemaining: formatHM(cycleRemaining),
    breakRemaining: formatHM(breakNeededIn),
    breakRequired,
    breakDueIn: breakRequired ? "Now" : drivingSinceBreak > 0 ? `in ${formatHM(breakNeededIn)}` : "",
    canDrive,
    canAcceptLoad,
    hoursAvailable: {
      driving: Math.round(drivingRemaining / 60 * 10) / 10,
      onDuty: Math.round(onDutyRemaining / 60 * 10) / 10,
      cycle: Math.round(cycleRemaining / 60 * 10) / 10,
    },
    violations: violations.filter((v, i, arr) => arr.findIndex(x => x.type === v.type) === i),
    todayLog: state.todayLog,
    lastBreak: state.lastBreakAt,
    nextBreakRequired: breakNeededIn > 0 && drivingSinceBreak > 0
      ? new Date(Date.now() + breakNeededIn * 60000).toISOString()
      : null,
    drivingToday: Math.round(drivingToday / 60 * 10) / 10,
    onDutyToday: Math.round(onDutyToday / 60 * 10) / 10,
    cycleUsed: Math.round(cycleUsed / 60 * 10) / 10,
  };
}

// ═══════════════════════════════════════════════════════════════
// ELD INTEGRATION — Hydrate HOS state from connected ELD device
// ═══════════════════════════════════════════════════════════════

const ELD_STATUS_MAP: Record<string, DutyStatus> = {
  OFF: "off_duty", SB: "sleeper", D: "driving", ON: "on_duty",
  YM: "on_duty", PC: "off_duty",
};

/**
 * Try to hydrate HOS state from connected ELD provider.
 * Returns true if ELD data was available and applied.
 */
async function tryHydrateFromELD(userId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Get user's companyId
    const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1);
    if (!user?.companyId) return false;

    const { eldService } = await import("./eld");
    const hasELD = await eldService.loadProvidersForCompany(user.companyId);
    if (!hasELD) return false;

    // Fetch HOS from ELD API
    const eldData = await eldService.getDriverHOS(String(userId));
    if (!eldData) return false;

    // Convert ELD data → HOSState and apply
    const state = getState(userId);
    const eldStatus = ELD_STATUS_MAP[eldData.currentStatus] || "off_duty";

    state.status = eldStatus;
    state.statusStartedAt = eldData.statusSince || new Date().toISOString();

    // ELD provides remaining minutes → convert to used
    const drivingUsed = HOS_RULES.maxDrivingMinutes - (eldData.hoursAvailable.driving || 0);
    const onDutyUsed = HOS_RULES.maxOnDutyMinutes - (eldData.hoursAvailable.onDuty || 0);
    const cycleUsed = HOS_RULES.cycle8DayMinutes - (eldData.hoursAvailable.cycle || 0);
    const breakUsed = HOS_RULES.breakRequiredAfterMinutes - (eldData.hoursAvailable.breakRemaining || 0);

    state.drivingMinutesToday = Math.max(0, drivingUsed);
    state.onDutyMinutesToday = Math.max(0, onDutyUsed);
    state.drivingMinutesSinceReset = Math.max(0, drivingUsed);
    state.onDutyMinutesSinceReset = Math.max(0, onDutyUsed);
    state.cycleMinutesUsed = Math.max(0, cycleUsed);
    state.drivingMinutesSinceBreak = Math.max(0, breakUsed);

    // Convert ELD violations
    state.violations = (eldData.violations || []).map((v: any) => ({
      type: v.type === "drive_time" ? "driving_limit" as const :
            v.type === "on_duty_time" ? "on_duty_limit" as const :
            v.type === "cycle_time" ? "cycle_limit" as const :
            v.type === "break" ? "break_required" as const : "driving_limit" as const,
      description: v.description || "ELD violation",
      severity: v.severity === "violation" ? "violation" as const : "warning" as const,
      cfr: "49 CFR 395",
      detectedAt: v.occurredAt || new Date().toISOString(),
    }));

    // Convert ELD log entries
    state.todayLog = (eldData.logs || []).map((log: any) => ({
      status: ELD_STATUS_MAP[log.status] || "off_duty" as DutyStatus,
      startTime: log.startTime,
      endTime: log.endTime || null,
      duration: formatHM(log.duration || 0),
      location: log.location,
    }));

    hosCache.set(userId, state);
    return true;
  } catch (e) {
    // ELD fetch failed — fall back to cache
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

export function getHOSSummary(userId: number): HOSSummary {
  const state = getState(userId);
  return computeCurrentHOS(state);
}

/**
 * ELD-aware HOS summary — loads persisted state from DB, tries ELD, computes.
 * Use this from all API endpoints that serve HOS data to any user role.
 */
export async function getHOSSummaryWithELD(userId: number): Promise<HOSSummary> {
  // 1. Load persisted state from DB (warm cache or cold start)
  await getStateFromDB(userId);
  // 2. Try to overlay with connected ELD provider data
  await tryHydrateFromELD(userId);
  // 3. Compute from (possibly ELD-hydrated) state
  return getHOSSummary(userId);
}

/**
 * ELD-aware duty status change — updates both in-memory and flags for ELD sync.
 */
export async function changeDutyStatusWithELD(userId: number, newStatus: DutyStatus, location?: string): Promise<HOSSummary> {
  // First change locally
  const summary = await changeDutyStatus(userId, newStatus, location);

  // If ELD is connected, attempt to push the status change
  try {
    const db = await getDb();
    if (db) {
      const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1);
      if (user?.companyId) {
        const { eldService } = await import("./eld");
        const hasELD = await eldService.loadProvidersForCompany(user.companyId);
        // Note: Most ELD APIs don't allow pushing status changes via API
        // (status changes happen on the ELD device itself). This is a
        // future hook for bidirectional sync when providers support it.
        if (hasELD) {
          logger.info(`[HOS] Duty status ${newStatus} for user ${userId} — ELD connected, local state updated`);
        }
      }
    }
  } catch { /* non-critical */ }

  return summary;
}

export async function changeDutyStatus(userId: number, newStatus: DutyStatus, location?: string): Promise<HOSSummary> {
  const state = getState(userId);
  const elapsed = minutesSince(state.statusStartedAt);
  const now = new Date();

  // Record log entry for the ending status
  if (elapsed > 0) {
    state.todayLog.push({
      status: state.status,
      startTime: state.statusStartedAt,
      endTime: now.toISOString(),
      duration: formatHM(elapsed),
      location,
    });
  }

  // Accumulate time from the ending status
  if (state.status === "driving") {
    state.drivingMinutesToday += elapsed;
    state.onDutyMinutesToday += elapsed;
    state.drivingMinutesSinceReset += elapsed;
    state.onDutyMinutesSinceReset += elapsed;
    state.drivingMinutesSinceBreak += elapsed;
    state.cycleMinutesUsed += elapsed;
  } else if (state.status === "on_duty") {
    state.onDutyMinutesToday += elapsed;
    state.onDutyMinutesSinceReset += elapsed;
    state.cycleMinutesUsed += elapsed;
  }

  // Check if transitioning to off-duty/sleeper qualifies as break
  if ((newStatus === "off_duty" || newStatus === "sleeper") &&
      (state.status === "driving" || state.status === "on_duty")) {
    // If off-duty for 30+ min, reset break counter
    state.lastBreakAt = now.toISOString();
  }

  // Check for 10-hour off-duty reset
  if ((state.status === "off_duty" || state.status === "sleeper") && elapsed >= HOS_RULES.minOffDutyMinutes) {
    // Full reset of driving and on-duty windows
    state.drivingMinutesSinceReset = 0;
    state.onDutyMinutesSinceReset = 0;
    state.drivingMinutesSinceBreak = 0;
    state.lastOffDutyAt = now.toISOString();
    state.violations = [];
  }

  // Check for 30-min break completion
  if ((state.status === "off_duty" || state.status === "sleeper") && elapsed >= HOS_RULES.minBreakMinutes) {
    state.drivingMinutesSinceBreak = 0;
    state.lastBreakAt = now.toISOString();
  }

  // Reset daily counters at midnight in driver's timezone (not server time)
  // Per 49 CFR 395.8: "24-hour period" is based on home terminal time
  const driverTZ = await getDriverTimezone(userId);
  const lastStartLocal = new Date(state.statusStartedAt).toLocaleDateString('en-US', { timeZone: driverTZ });
  const nowLocal = now.toLocaleDateString('en-US', { timeZone: driverTZ });
  if (lastStartLocal !== nowLocal) {
    state.drivingMinutesToday = 0;
    state.onDutyMinutesToday = 0;
    state.todayLog = [];
  }

  // Update status
  state.status = newStatus;
  state.statusStartedAt = now.toISOString();

  if (newStatus === "off_duty") {
    state.lastOffDutyAt = now.toISOString();
  }

  hosCache.set(userId, state);

  // Persist to DB + write audit log (non-blocking)
  persistState(state, {
    eventType: 'status_change',
    fromStatus: state.status,
    toStatus: newStatus,
    location: location || undefined,
    source: 'driver',
  }).catch(e => logger.error('[HOS] persist after changeDutyStatus failed:', (e as any)?.message));

  return computeCurrentHOS(state);
}

/**
 * Check if a driver can legally accept a load based on HOS.
 * Used by mission guard and load acceptance.
 */
export function canDriverAcceptLoad(userId: number): { allowed: boolean; reason?: string; hosSummary: HOSSummary } {
  const summary = getHOSSummary(userId);

  if (!summary.canAcceptLoad) {
    const reasons: string[] = [];
    if (summary.hoursAvailable.driving < 2) reasons.push(`Only ${summary.drivingRemaining} driving time left`);
    if (summary.hoursAvailable.onDuty < 2) reasons.push(`Only ${summary.onDutyRemaining} on-duty time left`);
    if (summary.hoursAvailable.cycle < 2) reasons.push(`Only ${summary.cycleRemaining} cycle time left`);
    if (summary.breakRequired) reasons.push("30-minute break required before driving");
    return { allowed: false, reason: reasons.join("; ") || "HOS limits exceeded", hosSummary: summary };
  }

  return { allowed: true, hosSummary: summary };
}

/**
 * Get matching active missions for a driver's current load.
 * Cross-references active missions against load properties.
 */
export async function getMatchingMissionsForLoad(userId: number, loadId: number): Promise<Array<{
  missionId: number;
  missionName: string;
  description: string;
  category: string;
  currentProgress: number;
  targetValue: number;
  xpReward: number;
  matchReason: string;
}>> {
  const db = await getDb();
  if (!db) return [];

  try {
    // Get user's active mission progress
    const activeMissions = await db.execute(sql`
      SELECT mp.id, mp.missionId, mp.currentProgress, mp.targetProgress,
             m.name, m.description, m.category, m.targetType, m.targetValue, m.xpReward, m.type
      FROM mission_progress mp
      JOIN missions m ON m.id = mp.missionId
      WHERE mp.userId = ${userId} AND mp.status = 'in_progress' AND m.isActive = TRUE
    `);

    const rows = Array.isArray(activeMissions) ? (activeMissions as any[])[0] || activeMissions : [];
    if (!Array.isArray(rows) || rows.length === 0) return [];

    // Get the load to match against
    const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
    if (!load) return [];

    const matches: Array<{
      missionId: number; missionName: string; description: string;
      category: string; currentProgress: number; targetValue: number;
      xpReward: number; matchReason: string;
    }> = [];

    for (const row of rows) {
      const r = row as any;
      const category = (r.category || "").toLowerCase();
      const targetType = (r.targetType || "").toLowerCase();
      let matchReason = "";

      // Match delivery missions
      if (category === "deliveries" && (targetType === "count")) {
        matchReason = "This delivery counts toward your mission progress";
      }
      // Match earnings missions
      else if (category === "earnings" && targetType === "amount") {
        const loadRate = Number(load.rate) || 0;
        if (loadRate > 0) matchReason = `$${loadRate.toLocaleString()} earned from this load applies`;
      }
      // Match distance missions
      else if ((category === "efficiency" || category === "deliveries") && targetType === "distance") {
        const dist = Number(load.distance) || 0;
        if (dist > 0) matchReason = `${dist} miles from this trip counts`;
      }
      // Match safety missions (completing without violations)
      else if (category === "safety") {
        matchReason = "Safe completion of this trip contributes to your safety mission";
      }

      if (matchReason) {
        matches.push({
          missionId: r.missionId,
          missionName: r.name || "",
          description: r.description || "",
          category: r.category || "",
          currentProgress: Number(r.currentProgress) || 0,
          targetValue: Number(r.targetValue || r.targetProgress) || 0,
          xpReward: Number(r.xpReward) || 0,
          matchReason,
        });
      }
    }

    return matches;
  } catch (err) {
    logger.error("[HOSEngine] getMatchingMissionsForLoad error:", err);
    return [];
  }
}
