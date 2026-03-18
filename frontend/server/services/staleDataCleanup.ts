/**
 * STALE DATA CLEANUP
 * Expires abandoned loads, timed-out bids, stuck transactions, old GPS data, orphaned geofences.
 * Runs daily. Prevents data rot.
 */
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export async function cleanupStaleData(): Promise<{ expired: number; cleaned: number }> {
  const db = await getDb();
  if (!db) return { expired: 0, cleaned: 0 };

  let totalExpired = 0;
  let totalCleaned = 0;

  try {
    // 1. Expire loads posted > 30 days with no bids
    const r1 = await db.execute(sql`
      UPDATE loads SET status = 'expired', updatedAt = NOW()
      WHERE status = 'posted'
      AND createdAt < DATE_SUB(NOW(), INTERVAL 30 DAY)
      AND id NOT IN (SELECT DISTINCT loadId FROM bids WHERE loadId IS NOT NULL)
    `);
    totalExpired += (r1 as any)?.[0]?.affectedRows || 0;

    // 2. Expire pending bids > 48 hours
    const r2 = await db.execute(sql`
      UPDATE bids SET status = 'expired', updatedAt = NOW()
      WHERE status = 'pending'
      AND createdAt < DATE_SUB(NOW(), INTERVAL 48 HOUR)
    `);
    totalExpired += (r2 as any)?.[0]?.affectedRows || 0;

    // 3. Fail stuck processing transactions > 24 hours
    const r3 = await db.execute(sql`
      UPDATE wallet_transactions SET status = 'failed',
      metadata = JSON_SET(COALESCE(metadata, '{}'), '$.failReason', 'Processing timeout (24h)')
      WHERE status = 'processing'
      AND createdAt < DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);
    totalCleaned += (r3 as any)?.[0]?.affectedRows || 0;

    // 4. Delete old location breadcrumbs > 90 days (chunked to prevent long locks)
    const r4 = await db.execute(sql`
      DELETE FROM location_breadcrumbs
      WHERE createdAt < DATE_SUB(NOW(), INTERVAL 90 DAY)
      LIMIT 50000
    `);
    totalCleaned += (r4 as any)?.[0]?.affectedRows || 0;

    // 5. Deactivate geofences for completed/cancelled loads
    const r5 = await db.execute(sql`
      UPDATE geofences SET isActive = false
      WHERE isActive = true
      AND loadId IN (SELECT id FROM loads WHERE status IN ('delivered','cancelled','settled','complete','archived'))
    `);
    totalCleaned += (r5 as any)?.[0]?.affectedRows || 0;

    // 6. Clear expired notifications > 60 days
    const r6 = await db.execute(sql`
      DELETE FROM notifications
      WHERE createdAt < DATE_SUB(NOW(), INTERVAL 60 DAY)
      AND isRead = true
      LIMIT 50000
    `);
    totalCleaned += (r6 as any)?.[0]?.affectedRows || 0;

    if (totalExpired > 0 || totalCleaned > 0) {
      logger.info(`[StaleCleanup] Expired ${totalExpired} records, cleaned ${totalCleaned} records`);
    }
  } catch (err) {
    logger.error('[StaleCleanup] Failed:', err);
  }

  return { expired: totalExpired, cleaned: totalCleaned };
}
