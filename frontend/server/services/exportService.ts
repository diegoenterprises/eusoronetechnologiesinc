/**
 * CSV EXPORT SERVICE
 * Generates downloadable CSV data for any report.
 */

/** Generate CSV string from array of objects */
export function generateCSV(data: Record<string, any>[], columns?: string[]): string {
  if (!data.length) return '';
  const cols = columns || Object.keys(data[0]);

  // Header row
  const header = cols.map(c => `"${c}"`).join(',');

  // Data rows
  const rows = data.map(row =>
    cols.map(col => {
      const val = row[col];
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );

  return [header, ...rows].join('\n');
}
