/**
 * API UTILITY FUNCTIONS
 * Timeout wrapper + circuit breaker for all external API calls
 */

import { logger } from "../_core/logger";

/**
 * Wraps a promise with a timeout. If the promise doesn't resolve
 * within timeoutMs, it rejects with a timeout error.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(
      () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
      timeoutMs
    );
  });

  try {
    const result = await Promise.race([promise, timeout]);
    clearTimeout(timeoutHandle!);
    return result;
  } catch (err) {
    clearTimeout(timeoutHandle!);
    throw err;
  }
}

/**
 * Circuit breaker state per service.
 * Opens after 3 consecutive failures, closes after 30s cooldown.
 */
const circuitState = new Map<string, {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}>();

export function checkCircuit(service: string): boolean {
  const state = circuitState.get(service);
  if (!state || !state.isOpen) return true;
  if (Date.now() - state.lastFailure > 30000) {
    state.isOpen = false;
    state.failures = 0;
    return true;
  }
  return false;
}

export function recordFailure(service: string): void {
  const state = circuitState.get(service) || { failures: 0, lastFailure: 0, isOpen: false };
  state.failures++;
  state.lastFailure = Date.now();
  if (state.failures >= 3) {
    state.isOpen = true;
    logger.warn(`[CircuitBreaker] ${service} circuit OPEN after ${state.failures} failures`);
  }
  circuitState.set(service, state);
}

export function recordSuccess(service: string): void {
  const existing = circuitState.get(service);
  if (existing?.isOpen) {
    logger.info(`[CircuitBreaker] ${service} circuit CLOSED — service recovered`);
  }
  circuitState.set(service, { failures: 0, lastFailure: 0, isOpen: false });
}

/**
 * Convenience: Wraps an external API call with timeout + circuit breaker.
 * Returns null instead of throwing if the circuit is open.
 */
export async function safeExternalCall<T>(
  service: string,
  fn: () => Promise<T>,
  timeoutMs: number = 10000
): Promise<T | null> {
  if (!checkCircuit(service)) {
    logger.warn(`[CircuitBreaker] ${service} circuit is OPEN — skipping call`);
    return null;
  }

  try {
    const result = await withTimeout(fn(), timeoutMs, service);
    recordSuccess(service);
    return result;
  } catch (err: any) {
    recordFailure(service);
    logger.error(`[${service}] External call failed: ${err.message}`);
    return null;
  }
}
