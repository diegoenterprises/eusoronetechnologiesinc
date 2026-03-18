/**
 * DASHBOARD STATS AGGREGATOR
 * Pre-computes dashboard stats every 5 minutes instead of per-request.
 * Reduces dashboard query load from O(8n) to O(1) per user.
 */
import { logger } from "../_core/logger";
import { getDb } from "../db";
import { dashboardStatsCache, users, loads, vehicles } from "../../drizzle/schema";
import { eq, sql, and, count } from "drizzle-orm";

export async function refreshUserStats(db: any, userId: number, role: string): Promise<void> {
  try {
    let stats: Record<string, any> = {};
    const now = new Date();

    // Role-specific aggregation (lightweight counts)
    switch (role) {
      case 'SHIPPER': {
        const [active] = await db.select({ count: count() }).from(loads).where(and(eq(loads.shipperId, userId), sql`${loads.status} IN ('in_transit','assigned','bidding','posted')`));
        const [delivered] = await db.select({ count: count() }).from(loads).where(and(eq(loads.shipperId, userId), eq(loads.status, 'delivered')));
        const [total] = await db.select({ count: count(), sum: sql<number>`COALESCE(SUM(CAST(rate AS DECIMAL)),0)` }).from(loads).where(eq(loads.shipperId, userId));
        stats = { activeLoads: active?.count || 0, deliveredLoads: delivered?.count || 0, totalLoads: total?.count || 0, totalSpent: total?.sum || 0 };
        break;
      }
      case 'CATALYST': {
        const [active] = await db.select({ count: count() }).from(loads).where(and(eq(loads.catalystId, userId), sql`${loads.status} IN ('in_transit','assigned')`));
        const [fleet] = await db.select({ count: count() }).from(vehicles).where(eq(vehicles.companyId, userId));
        const [rev] = await db.select({ sum: sql<number>`COALESCE(SUM(CAST(rate AS DECIMAL)),0)` }).from(loads).where(and(eq(loads.catalystId, userId), eq(loads.status, 'delivered')));
        stats = { activeLoads: active?.count || 0, fleetSize: fleet?.count || 0, totalRevenue: rev?.sum || 0 };
        break;
      }
      case 'DRIVER': {
        const [completed] = await db.select({ count: count() }).from(loads).where(and(eq(loads.driverId, userId), eq(loads.status, 'delivered')));
        const [earnings] = await db.select({ sum: sql<number>`COALESCE(SUM(CAST(rate AS DECIMAL)),0)` }).from(loads).where(and(eq(loads.driverId, userId), eq(loads.status, 'delivered')));
        stats = { completedLoads: completed?.count || 0, totalEarnings: earnings?.sum || 0 };
        break;
      }
      default:
        stats = { role, refreshedAt: now.toISOString() };
    }

    // Upsert into cache
    await db.insert(dashboardStatsCache).values({
      userId, role, statsJson: stats, computedAt: now,
    }).onDuplicateKeyUpdate({
      set: { statsJson: sql`VALUES(statsJson)`, computedAt: sql`VALUES(computedAt)` },
    });
  } catch (err) {
    logger.error(`[StatsAggregator] Failed for user ${userId}:`, err);
  }
}

export async function refreshAllStats(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const activeUsers = await db.select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.isActive, true))
      .limit(5000);

    let refreshed = 0;
    for (const user of activeUsers) {
      await refreshUserStats(db, user.id, user.role || 'SHIPPER');
      refreshed++;
    }
    logger.info(`[StatsAggregator] Refreshed stats for ${refreshed} users`);
  } catch (err) {
    logger.error('[StatsAggregator] Bulk refresh failed:', err);
  }
}
