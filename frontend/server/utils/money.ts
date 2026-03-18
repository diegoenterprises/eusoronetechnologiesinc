/**
 * MONEY UTILITIES — Cent-based integer arithmetic
 * Eliminates IEEE 754 float errors on financial calculations.
 * All money flows through toCents() → math → fromCents().
 */

/** Convert dollar amount to integer cents */
export function toCents(dollars: number | string): number {
  return Math.round(Number(dollars) * 100);
}

/** Convert integer cents back to dollar string (2 decimal places) */
export function fromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Calculate percentage fee in cents (e.g., 8% of $2500 = 20000 cents) */
export function calculateFeeInCents(amountCents: number, ratePercent: number): number {
  return Math.round(amountCents * ratePercent / 100);
}

/** Sum multiple dollar amounts, returning cents */
export function sumCents(...amounts: (number | string)[]): number {
  return amounts.reduce((sum: number, amt) => sum + toCents(amt), 0);
}

/** Subtract in cents, floor at zero */
export function subtractCents(a: number | string, b: number | string): number {
  return Math.max(0, toCents(a) - toCents(b));
}
