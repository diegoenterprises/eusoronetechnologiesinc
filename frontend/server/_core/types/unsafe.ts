/**
 * Type utilities for safely replacing `as any` casts throughout the codebase.
 *
 * `AnyRecord` provides property access on unknown objects (like SQL result rows)
 * without using `any`. Values are typed as `unknown` but the index signature
 * allows arbitrary property access.
 *
 * `unsafeCast<T>()` provides a typed escape hatch for casts that would otherwise
 * require `as any`. It's a zero-cost runtime identity function.
 */

/** A record with string keys and unknown values — safe replacement for `as any` when accessing properties. */
export type AnyRecord = Record<string, unknown>;

/** Cast a value to an arbitrary target type without going through `any`. Zero runtime cost. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function unsafeCast<T = any>(value: unknown): T {
  return value as T;
}
