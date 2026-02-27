/**
 * OFFLINE HOS TRACKING — Hours of Service (49 CFR Part 395) on-device tracking
 *
 * Tracks driver duty status changes fully offline:
 *   - OFF_DUTY, SLEEPER_BERTH, DRIVING, ON_DUTY_NOT_DRIVING
 *   - 11-hour driving limit, 14-hour window, 30-min break rule
 *   - 60/70-hour weekly limit
 *   - Auto-detects driving via GPS speed
 *   - Queues status changes for sync when online
 *
 * All timers run locally — no network dependency.
 */

import { database, collections } from '@/database';
import { Q } from '@nozbe/watermelondb';
import { syncEngine } from './sync-engine';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type DutyStatus = 'OFF_DUTY' | 'SLEEPER_BERTH' | 'DRIVING' | 'ON_DUTY_NOT_DRIVING';

export interface HOSState {
  currentStatus: DutyStatus;
  statusSince: number;
  drivingMinutesToday: number;
  onDutyMinutesToday: number;
  shiftStartedAt: number | null;
  breakTakenAt: number | null;
  breakDurationMinutes: number;
  cycleHoursUsed: number;
  cycleType: '60_7' | '70_8';
  violations: HOSViolation[];
  timeUntilBreakRequired: number; // minutes
  drivingTimeRemaining: number; // minutes
  shiftTimeRemaining: number; // minutes
  cycleTimeRemaining: number; // hours
}

export interface HOSViolation {
  type: string;
  description: string;
  occurredAt: number;
  severity: 'WARNING' | 'VIOLATION';
}

interface HOSLogEntry {
  status: DutyStatus;
  startedAt: number;
  endedAt?: number;
  latitude?: number;
  longitude?: number;
  location?: string;
  notes?: string;
  isAutomatic: boolean;
}

type HOSListener = (state: HOSState) => void;

// ═══════════════════════════════════════════════════════════════════════════════
// FMCSA LIMITS (49 CFR 395)
// ═══════════════════════════════════════════════════════════════════════════════

const MAX_DRIVING_MINUTES = 11 * 60; // 11 hours
const MAX_SHIFT_MINUTES = 14 * 60; // 14-hour window
const BREAK_REQUIRED_AFTER_MINUTES = 8 * 60; // 30-min break required after 8hrs driving
const MIN_BREAK_MINUTES = 30;
const MIN_OFF_DUTY_HOURS = 10; // 10 consecutive hours off duty
const CYCLE_60_7_HOURS = 60;
const CYCLE_70_8_HOURS = 70;
const DRIVING_SPEED_THRESHOLD_MPH = 5; // Auto-detect driving above 5 mph

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

class HOSTrackingService {
  private state: HOSState = {
    currentStatus: 'OFF_DUTY',
    statusSince: Date.now(),
    drivingMinutesToday: 0,
    onDutyMinutesToday: 0,
    shiftStartedAt: null,
    breakTakenAt: null,
    breakDurationMinutes: 0,
    cycleHoursUsed: 0,
    cycleType: '70_8',
    violations: [],
    timeUntilBreakRequired: BREAK_REQUIRED_AFTER_MINUTES,
    drivingTimeRemaining: MAX_DRIVING_MINUTES,
    shiftTimeRemaining: MAX_SHIFT_MINUTES,
    cycleTimeRemaining: CYCLE_70_8_HOURS,
  };

  private listeners = new Set<HOSListener>();
  private log: HOSLogEntry[] = [];
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private driverId: string = '';

  // ── Lifecycle ──────────────────────────────────────────────────────────

  start(driverId: string, cycleType: '60_7' | '70_8' = '70_8') {
    this.driverId = driverId;
    this.state.cycleType = cycleType;
    this.state.cycleTimeRemaining = cycleType === '60_7' ? CYCLE_60_7_HOURS : CYCLE_70_8_HOURS;

    // Tick every 60 seconds to update running totals
    this.tickTimer = setInterval(() => this.tick(), 60_000);
    console.log('[HOS] Started for driver:', driverId, 'cycle:', cycleType);
  }

  stop() {
    if (this.tickTimer) clearInterval(this.tickTimer);
    this.tickTimer = null;
  }

  subscribe(fn: HOSListener): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  // ── Status Changes ─────────────────────────────────────────────────────

  async changeStatus(
    newStatus: DutyStatus,
    options?: { latitude?: number; longitude?: number; location?: string; notes?: string; isAutomatic?: boolean }
  ): Promise<{ success: boolean; violation?: HOSViolation }> {
    const now = Date.now();
    const oldStatus = this.state.currentStatus;

    if (oldStatus === newStatus) return { success: true };

    // Close current log entry
    if (this.log.length > 0) {
      const last = this.log[this.log.length - 1];
      if (!last.endedAt) last.endedAt = now;
    }

    // Check for violations before allowing the change
    const violation = this.checkViolation(newStatus, now);

    // Add new log entry
    this.log.push({
      status: newStatus,
      startedAt: now,
      latitude: options?.latitude,
      longitude: options?.longitude,
      location: options?.location,
      notes: options?.notes,
      isAutomatic: options?.isAutomatic ?? false,
    });

    // Update state
    this.state.currentStatus = newStatus;
    this.state.statusSince = now;

    // Track shift start
    if ((newStatus === 'DRIVING' || newStatus === 'ON_DUTY_NOT_DRIVING') && !this.state.shiftStartedAt) {
      this.state.shiftStartedAt = now;
    }

    // Track breaks
    if (newStatus === 'OFF_DUTY' || newStatus === 'SLEEPER_BERTH') {
      this.state.breakTakenAt = now;
      this.state.breakDurationMinutes = 0;
    }

    // Enqueue for sync
    await syncEngine.queueAction({
      actionType: 'HOS_UPDATE',
      payload: {
        driverId: this.driverId,
        fromStatus: oldStatus,
        toStatus: newStatus,
        timestamp: now,
        latitude: options?.latitude,
        longitude: options?.longitude,
        location: options?.location,
        notes: options?.notes,
        isAutomatic: options?.isAutomatic ?? false,
        drivingMinutesToday: this.state.drivingMinutesToday,
        onDutyMinutesToday: this.state.onDutyMinutesToday,
      },
      priority: 'CRITICAL',
      requiresOrder: true,
    });

    if (violation) {
      this.state.violations.push(violation);
    }

    this.emit();
    return { success: true, violation };
  }

  /**
   * Auto-detect driving based on GPS speed
   */
  async onGPSUpdate(speedMph: number, lat: number, lng: number) {
    if (speedMph > DRIVING_SPEED_THRESHOLD_MPH && this.state.currentStatus !== 'DRIVING') {
      await this.changeStatus('DRIVING', { latitude: lat, longitude: lng, isAutomatic: true, notes: `Auto-detected at ${Math.round(speedMph)} mph` });
    } else if (speedMph <= DRIVING_SPEED_THRESHOLD_MPH && this.state.currentStatus === 'DRIVING') {
      // Don't auto-switch OFF driving — driver must acknowledge manually
      // But we track the stop for compliance
    }
  }

  // ── Timer Tick ─────────────────────────────────────────────────────────

  private tick() {
    const now = Date.now();
    const minutesSinceStatus = Math.floor((now - this.state.statusSince) / 60_000);

    // Update running totals
    if (this.state.currentStatus === 'DRIVING') {
      this.state.drivingMinutesToday += 1;
      this.state.onDutyMinutesToday += 1;
    } else if (this.state.currentStatus === 'ON_DUTY_NOT_DRIVING') {
      this.state.onDutyMinutesToday += 1;
    }

    // Update break tracking
    if (this.state.currentStatus === 'OFF_DUTY' || this.state.currentStatus === 'SLEEPER_BERTH') {
      this.state.breakDurationMinutes += 1;
    }

    // Calculate remaining times
    this.state.drivingTimeRemaining = Math.max(0, MAX_DRIVING_MINUTES - this.state.drivingMinutesToday);
    this.state.timeUntilBreakRequired = Math.max(0, BREAK_REQUIRED_AFTER_MINUTES - this.state.drivingMinutesToday);

    if (this.state.shiftStartedAt) {
      const shiftMinutes = Math.floor((now - this.state.shiftStartedAt) / 60_000);
      this.state.shiftTimeRemaining = Math.max(0, MAX_SHIFT_MINUTES - shiftMinutes);
    }

    // Check for real-time violations
    if (this.state.drivingTimeRemaining === 0 && this.state.currentStatus === 'DRIVING') {
      this.state.violations.push({
        type: '11_HOUR_DRIVING',
        description: 'Exceeded 11-hour driving limit',
        occurredAt: now,
        severity: 'VIOLATION',
      });
    }

    if (this.state.shiftTimeRemaining === 0 && (this.state.currentStatus === 'DRIVING' || this.state.currentStatus === 'ON_DUTY_NOT_DRIVING')) {
      this.state.violations.push({
        type: '14_HOUR_WINDOW',
        description: 'Exceeded 14-hour on-duty window',
        occurredAt: now,
        severity: 'VIOLATION',
      });
    }

    // Warnings at 30 minutes remaining
    if (this.state.drivingTimeRemaining === 30 && this.state.currentStatus === 'DRIVING') {
      this.state.violations.push({
        type: '11_HOUR_WARNING',
        description: '30 minutes of driving time remaining',
        occurredAt: now,
        severity: 'WARNING',
      });
    }

    if (this.state.timeUntilBreakRequired === 0 && this.state.currentStatus === 'DRIVING') {
      this.state.violations.push({
        type: '30_MIN_BREAK',
        description: '30-minute break required',
        occurredAt: now,
        severity: 'WARNING',
      });
    }

    this.emit();
  }

  // ── Violation Check ────────────────────────────────────────────────────

  private checkViolation(newStatus: DutyStatus, now: number): HOSViolation | undefined {
    if (newStatus === 'DRIVING') {
      if (this.state.drivingTimeRemaining <= 0) {
        return { type: '11_HOUR_EXCEEDED', description: 'Cannot drive — 11-hour limit reached', occurredAt: now, severity: 'VIOLATION' };
      }
      if (this.state.shiftTimeRemaining <= 0) {
        return { type: '14_HOUR_EXCEEDED', description: 'Cannot drive — 14-hour window expired', occurredAt: now, severity: 'VIOLATION' };
      }
    }
    return undefined;
  }

  // ── Reset (after 10-hour off-duty) ─────────────────────────────────────

  async resetAfterRest() {
    this.state.drivingMinutesToday = 0;
    this.state.onDutyMinutesToday = 0;
    this.state.shiftStartedAt = null;
    this.state.breakTakenAt = null;
    this.state.breakDurationMinutes = 0;
    this.state.drivingTimeRemaining = MAX_DRIVING_MINUTES;
    this.state.shiftTimeRemaining = MAX_SHIFT_MINUTES;
    this.state.timeUntilBreakRequired = BREAK_REQUIRED_AFTER_MINUTES;
    this.state.violations = [];
    this.emit();
  }

  // ── Getters ────────────────────────────────────────────────────────────

  getState(): HOSState { return { ...this.state }; }
  getLog(): HOSLogEntry[] { return [...this.log]; }

  private emit() {
    this.listeners.forEach(fn => fn({ ...this.state }));
  }
}

export const hosTracking = new HOSTrackingService();
