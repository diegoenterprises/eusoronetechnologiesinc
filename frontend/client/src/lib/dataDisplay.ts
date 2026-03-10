/**
 * DATA DISPLAY UTILITIES
 * Cleanly distinguish between "no data available" (null/undefined → "—")
 * vs "genuinely zero" (0 → "0") across all dashboard widgets.
 */

/** Format a numeric metric for display. null/undefined → "—", 0 → "0". */
export function formatMetric(value: number | null | undefined, unit?: string): string {
  if (value === null || value === undefined) return '—';
  const formatted = value.toLocaleString();
  return unit ? `${formatted} ${unit}` : formatted;
}

/** Format currency. null/undefined → "—", 0 → "$0.00". */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Format percentage. null/undefined → "—", 0 → "0%". */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${Math.round(value)}%`;
}

/** Check if a dataset is empty (no rows returned from DB). */
export function hasData<T>(data: T[] | null | undefined): data is T[] {
  return Array.isArray(data) && data.length > 0;
}

/** Empty state message for widgets when table has no data yet. */
export function emptyStateMessage(dataType: string): string {
  return `No ${dataType} yet`;
}
