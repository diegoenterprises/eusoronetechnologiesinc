/**
 * SIDEBAR ROUTER
 * Dynamic badge counts from real DB data
 * Returns counts only when there's actual new activity per section
 * Scoped to the authenticated user's company and role
 */

import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { sql, eq, and, count } from "drizzle-orm";
import { loads, bids, notifications } from "../../drizzle/schema";

export const sidebarRouter = router({
  /**
   * Get dynamic badge counts for sidebar menu items.
   * Returns a map of path -> count.
   * Only returns non-zero counts (new/unread/pending items).
   */
  getBadgeCounts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const badges: Record<string, number> = {};

    if (!db || !ctx.user) return badges;

    const userId = (ctx.user as any).id;
    const companyId = (ctx.user as any).companyId;
    const role = ctx.user.role?.toUpperCase() || "";

    try {
      // --- LOADS ---
      if (role === "SHIPPER" || role === "BROKER") {
        // My Loads: loads in bidding state (shipper has new bids to review)
        try {
          const [row] = await db.select({ cnt: count() }).from(loads)
            .where(and(eq(loads.shipperId, userId), eq(loads.status, "bidding")));
          if (row && Number(row.cnt) > 0) badges["/loads"] = Number(row.cnt);
        } catch {}

        // Active Loads: in transit
        try {
          const [row] = await db.select({ cnt: count() }).from(loads)
            .where(and(eq(loads.shipperId, userId), eq(loads.status, "in_transit")));
          if (row && Number(row.cnt) > 0) badges["/loads/active"] = Number(row.cnt);
        } catch {}

        // Tracking: same as in_transit
        try {
          const [row] = await db.select({ cnt: count() }).from(loads)
            .where(and(eq(loads.shipperId, userId), eq(loads.status, "in_transit")));
          if (row && Number(row.cnt) > 0) badges["/tracking"] = Number(row.cnt);
        } catch {}

        // Catalysts: pending bids on shipper's loads
        try {
          const result = await db.execute(
            sql`SELECT COUNT(*) as cnt FROM bids b JOIN loads l ON b.loadId = l.id WHERE l.shipperId = ${userId} AND b.status = 'pending'`
          );
          const v = Number((result as any)?.[0]?.cnt || 0);
          if (v > 0) badges["/catalysts"] = v;
        } catch {}

      } else if (role === "CATALYST") {
        // Assigned loads
        try {
          const [row] = await db.select({ cnt: count() }).from(loads)
            .where(and(eq(loads.catalystId, companyId || 0), eq(loads.status, "assigned")));
          if (row && Number(row.cnt) > 0) badges["/loads"] = Number(row.cnt);
        } catch {}

        // In Transit
        try {
          const [row] = await db.select({ cnt: count() }).from(loads)
            .where(and(eq(loads.catalystId, companyId || 0), eq(loads.status, "in_transit")));
          if (row && Number(row.cnt) > 0) badges["/loads/transit"] = Number(row.cnt);
        } catch {}

        // Pending bids
        try {
          const [row] = await db.select({ cnt: count() }).from(bids)
            .where(and(eq(bids.catalystId, companyId || 0), eq(bids.status, "pending")));
          if (row && Number(row.cnt) > 0) badges["/bids"] = Number(row.cnt);
        } catch {}

      } else if (role === "DRIVER") {
        // Jobs assigned to driver
        try {
          const [row] = await db.select({ cnt: count() }).from(loads)
            .where(and(eq(loads.driverId, userId), eq(loads.status, "assigned")));
          if (row && Number(row.cnt) > 0) badges["/jobs"] = Number(row.cnt);
        } catch {}
      }

      // --- MESSAGES: unread count (raw SQL for flexibility) ---
      try {
        const result = await db.execute(
          sql`SELECT COUNT(*) as cnt FROM messages WHERE recipient_id = ${userId} AND read_at IS NULL`
        );
        const v = Number((result as any)?.[0]?.cnt || 0);
        if (v > 0) badges["/messages"] = v;
      } catch {}

      // --- PAYMENTS: pending invoices ---
      try {
        const result = await db.execute(
          sql`SELECT COUNT(*) as cnt FROM invoices WHERE (payer_id = ${userId} OR payee_id = ${userId}) AND status = 'pending'`
        );
        const v = Number((result as any)?.[0]?.cnt || 0);
        if (v > 0) badges["/payments"] = v;
      } catch {}

      // --- COMPANY CHANNELS: unread channel messages ---
      try {
        const result = await db.execute(
          sql`SELECT COUNT(DISTINCT cm.channelId) as cnt FROM channel_members cm JOIN messages m ON m.channel_id = cm.channelId WHERE cm.userId = ${userId} AND m.createdAt > COALESCE(cm.lastReadAt, '1970-01-01')`
        );
        const v = Number((result as any)?.[0]?.cnt || 0);
        if (v > 0) badges["/company-channels"] = v;
      } catch {}

      // --- WALLET: pending transactions ---
      try {
        const result = await db.execute(
          sql`SELECT COUNT(*) as cnt FROM wallet_transactions WHERE user_id = ${userId} AND status = 'pending'`
        );
        const v = Number((result as any)?.[0]?.cnt || 0);
        if (v > 0) badges["/wallet"] = v;
      } catch {}

      // --- DOCUMENTS: pending review ---
      try {
        const result = await db.execute(
          sql`SELECT COUNT(*) as cnt FROM documents WHERE (uploaded_by = ${userId} OR assigned_to = ${userId}) AND status = 'pending_review'`
        );
        const v = Number((result as any)?.[0]?.cnt || 0);
        if (v > 0) badges["/documents"] = v;
      } catch {}

    } catch (error) {
      console.error('[Sidebar] getBadgeCounts error:', error);
    }

    return badges;
  }),
});
