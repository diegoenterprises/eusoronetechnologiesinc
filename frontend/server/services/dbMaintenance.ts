/**
 * DATABASE MAINTENANCE
 * Runs ANALYZE TABLE on high-write tables to keep query optimizer stats fresh.
 * Runs weekly. Prevents query plan degradation.
 */
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

const HIGH_WRITE_TABLES = [
  'loads', 'bids', 'settlements', 'wallet_transactions',
  'location_breadcrumbs', 'geofence_events', 'load_state_transitions',
  'notifications', 'messages', 'appointments',
  'rail_shipments', 'rail_shipment_events',
  'vessel_shipments', 'vessel_shipment_events',
  'dashboard_stats_cache',
];

export async function runDatabaseMaintenance(): Promise<{ analyzed: string[] }> {
  const db = await getDb();
  if (!db) return { analyzed: [] };

  const analyzed: string[] = [];

  for (const table of HIGH_WRITE_TABLES) {
    try {
      await db.execute(sql.raw(`ANALYZE TABLE \`${table}\``));
      analyzed.push(table);
    } catch (err: any) {
      logger.warn(`[DBMaintenance] ANALYZE ${table} failed: ${err.message}`);
    }
  }

  if (analyzed.length > 0) {
    logger.info(`[DBMaintenance] Analyzed ${analyzed.length}/${HIGH_WRITE_TABLES.length} tables`);
  }

  return { analyzed };
}
