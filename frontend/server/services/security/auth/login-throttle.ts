/**
 * LOGIN THROTTLE / BRUTE-FORCE PROTECTION
 * Prevents credential stuffing and brute-force attacks.
 *
 * Strategy:
 *   - Track failed attempts per email + IP
 *   - Progressive delays: 1s, 2s, 4s, 8s, 16s, 32s, 60s
 *   - Lock account after 10 consecutive failures (30 min lockout)
 *   - Alert admin after 5 failures from same IP
 *   - Rate limit: max 5 login attempts per minute per IP
 */

import { TRPCError } from "@trpc/server";
import { recordAuditEvent, AuditAction, AuditCategory } from "../../../_core/auditService";

// In-memory store (use Redis in production for multi-instance)
const failedAttempts: Map<string, FailedAttemptRecord> = new Map();
const ipAttempts: Map<string, number[]> = new Map();

interface FailedAttemptRecord {
  count: number;
  lastAttempt: number;
  lockedUntil: number | null;
  consecutiveFailures: number;
}

const MAX_FAILURES_BEFORE_LOCK = 10;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const MAX_ATTEMPTS_PER_MINUTE = 5;
const ATTEMPT_WINDOW_MS = 60 * 1000; // 1 minute
const PROGRESSIVE_DELAYS = [0, 1000, 2000, 4000, 8000, 16000, 32000, 60000];

/**
 * Check if a login attempt is allowed. Call BEFORE verifying credentials.
 * Throws if the account is locked or rate-limited.
 */
export async function checkLoginAllowed(
  email: string,
  ip: string
): Promise<void> {
  const key = normalizeEmail(email);

  // 1. Check account lockout
  const record = failedAttempts.get(key);
  if (record?.lockedUntil) {
    if (Date.now() < record.lockedUntil) {
      const remainingMs = record.lockedUntil - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);

      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Account temporarily locked. Try again in ${remainingMin} minute(s).`,
      });
    }
    // Lock expired — reset
    record.lockedUntil = null;
    record.consecutiveFailures = 0;
  }

  // 2. Check IP rate limit
  const now = Date.now();
  const ipRecord = ipAttempts.get(ip) || [];
  const recentAttempts = ipRecord.filter(t => now - t < ATTEMPT_WINDOW_MS);

  if (recentAttempts.length >= MAX_ATTEMPTS_PER_MINUTE) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many login attempts. Please wait before trying again.",
    });
  }

  // Record this attempt for IP rate limiting
  recentAttempts.push(now);
  ipAttempts.set(ip, recentAttempts);

  // 3. Apply progressive delay
  if (record && record.consecutiveFailures > 0) {
    const delayIndex = Math.min(record.consecutiveFailures, PROGRESSIVE_DELAYS.length - 1);
    const delay = PROGRESSIVE_DELAYS[delayIndex];
    const timeSinceLastAttempt = now - record.lastAttempt;

    if (timeSinceLastAttempt < delay) {
      const waitMs = delay - timeSinceLastAttempt;
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
  }
}

/**
 * Record a failed login attempt.
 */
export async function recordFailedLogin(
  email: string,
  ip: string,
  req?: any
): Promise<void> {
  const key = normalizeEmail(email);
  const now = Date.now();

  const record = failedAttempts.get(key) || {
    count: 0,
    lastAttempt: 0,
    lockedUntil: null,
    consecutiveFailures: 0,
  };

  record.count++;
  record.consecutiveFailures++;
  record.lastAttempt = now;

  // Lock account after MAX_FAILURES_BEFORE_LOCK consecutive failures
  if (record.consecutiveFailures >= MAX_FAILURES_BEFORE_LOCK) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;

    // Audit: account locked
    recordAuditEvent({
      userId: null,
      action: AuditAction.ACCOUNT_LOCKED,
      category: AuditCategory.SECURITY,
      entityType: "user",
      metadata: {
        email: key,
        ip,
        consecutiveFailures: record.consecutiveFailures,
        lockDuration: "30 minutes",
      },
      severity: "CRITICAL",
    }, req).catch(() => {});
  }

  // Audit: failed login (every 5th failure is HIGH severity)
  if (record.consecutiveFailures >= 5) {
    recordAuditEvent({
      userId: null,
      action: AuditAction.BRUTE_FORCE_DETECTED,
      category: AuditCategory.SECURITY,
      entityType: "user",
      metadata: {
        email: key,
        ip,
        consecutiveFailures: record.consecutiveFailures,
      },
      severity: record.consecutiveFailures >= 10 ? "CRITICAL" : "HIGH",
    }, req).catch(() => {});
  }

  failedAttempts.set(key, record);
}

/**
 * Record a successful login — resets the failure counter.
 */
export function recordSuccessfulLogin(email: string): void {
  const key = normalizeEmail(email);
  failedAttempts.delete(key);
}

/**
 * Check if an account is currently locked.
 */
export function isAccountLocked(email: string): boolean {
  const key = normalizeEmail(email);
  const record = failedAttempts.get(key);
  if (!record?.lockedUntil) return false;
  return Date.now() < record.lockedUntil;
}

/**
 * Manually unlock an account (admin action).
 */
export function unlockAccount(email: string): void {
  const key = normalizeEmail(email);
  failedAttempts.delete(key);
}

/**
 * Get login attempt statistics for an email (admin dashboard).
 */
export function getLoginStats(email: string): {
  totalFailures: number;
  consecutiveFailures: number;
  isLocked: boolean;
  lockedUntil: Date | null;
} {
  const key = normalizeEmail(email);
  const record = failedAttempts.get(key);

  if (!record) {
    return { totalFailures: 0, consecutiveFailures: 0, isLocked: false, lockedUntil: null };
  }

  return {
    totalFailures: record.count,
    consecutiveFailures: record.consecutiveFailures,
    isLocked: record.lockedUntil ? Date.now() < record.lockedUntil : false,
    lockedUntil: record.lockedUntil ? new Date(record.lockedUntil) : null,
  };
}

/**
 * Periodic cleanup of stale IP records (call from a scheduler).
 */
export function cleanupStaleRecords(): void {
  const now = Date.now();

  // Clean IP attempts older than 5 minutes
  const ipKeys = Array.from(ipAttempts.keys());
  for (const ip of ipKeys) {
    const attempts = ipAttempts.get(ip);
    if (!attempts) continue;
    const recent = attempts.filter((t: number) => now - t < 5 * 60 * 1000);
    if (recent.length === 0) {
      ipAttempts.delete(ip);
    } else {
      ipAttempts.set(ip, recent);
    }
  }

  // Clean failed attempts older than 24 hours with no lock
  const failedKeys = Array.from(failedAttempts.keys());
  for (const key of failedKeys) {
    const record = failedAttempts.get(key);
    if (!record) continue;
    if (!record.lockedUntil && now - record.lastAttempt > 24 * 60 * 60 * 1000) {
      failedAttempts.delete(key);
    }
  }
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}
