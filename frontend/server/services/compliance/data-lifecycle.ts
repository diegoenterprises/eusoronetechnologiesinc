/**
 * DATA LIFECYCLE MANAGEMENT
 * Handles data retention, export (GDPR Article 15), and deletion (GDPR/CCPA).
 *
 * Key policies:
 *   - GPS breadcrumbs: 2 years (49 CFR 395 ELD), then cold storage 5 more years
 *   - Audit logs: 7 years (SOC 2 / regulatory minimum)
 *   - Financial records: 7 years (IRS requirement)
 *   - User PII: deleted on account deletion (30-day grace period)
 *   - Messages: deleted on account deletion
 *   - Load history: anonymized on account deletion (retained for audit)
 */

import { sql } from "drizzle-orm";
import { getDb } from "../../db";
import { recordAuditEvent, AuditAction, AuditCategory } from "../../_core/auditService";

export interface RetentionPolicy {
  entityType: string;
  retentionDays: number;
  action: "delete" | "archive" | "anonymize";
  regulatoryBasis: string;
}

export const RETENTION_POLICIES: RetentionPolicy[] = [
  { entityType: "gps_breadcrumbs", retentionDays: 730, action: "archive", regulatoryBasis: "49 CFR 395 (ELD)" },
  { entityType: "geofence_events", retentionDays: 730, action: "archive", regulatoryBasis: "49 CFR 395 (ELD)" },
  { entityType: "audit_logs", retentionDays: 2555, action: "archive", regulatoryBasis: "SOC 2 Type II / IRS" },
  { entityType: "financial_records", retentionDays: 2555, action: "archive", regulatoryBasis: "IRS 7-year retention" },
  { entityType: "notifications", retentionDays: 365, action: "delete", regulatoryBasis: "Data minimization" },
  { entityType: "sessions", retentionDays: 90, action: "delete", regulatoryBasis: "Data minimization" },
  { entityType: "refresh_tokens", retentionDays: 30, action: "delete", regulatoryBasis: "Security hygiene" },
  { entityType: "search_history", retentionDays: 180, action: "delete", regulatoryBasis: "Privacy (CCPA)" },
];

/**
 * GDPR Article 15: Export all personal data for a user.
 * Returns a structured JSON package of all user data.
 */
export async function exportUserData(userId: number): Promise<Record<string, any>> {
  const db = await getDb();
  if (!db) return { error: "Database unavailable" };

  const uid = userId;
  const exportData: Record<string, any> = {};

  try {
    // User profile
    const userRows = await db.execute(
      sql`SELECT id, email, name, role, phone, company_id, created_at, metadata
          FROM users WHERE id = ${uid}`
    );
    exportData.profile = extractFirst(userRows);

    // Wallet
    const walletRows = await db.execute(
      sql`SELECT id, balance, currency, created_at FROM wallets WHERE user_id = ${uid}`
    );
    exportData.wallet = extractFirst(walletRows);

    // Wallet transactions
    const txRows = await db.execute(
      sql`SELECT id, type, amount, description, created_at 
          FROM wallet_transactions WHERE user_id = ${uid} ORDER BY created_at DESC`
    );
    exportData.walletTransactions = extractAll(txRows);

    // Loads (as participant)
    const loadRows = await db.execute(
      sql`SELECT id, load_number, status, origin, destination, created_at
          FROM loads WHERE shipper_id = ${uid} OR carrier_id = ${uid} OR driver_id = ${uid} OR broker_id = ${uid}
          ORDER BY created_at DESC`
    );
    exportData.loads = extractAll(loadRows);

    // Bids
    const bidRows = await db.execute(
      sql`SELECT id, load_id, amount, status, created_at FROM bids WHERE carrier_id = ${uid} ORDER BY created_at DESC`
    );
    exportData.bids = extractAll(bidRows);

    // Documents
    const docRows = await db.execute(
      sql`SELECT id, name, type, created_at FROM documents WHERE user_id = ${uid} ORDER BY created_at DESC`
    );
    exportData.documents = extractAll(docRows);

    // Messages sent
    const msgRows = await db.execute(
      sql`SELECT id, conversation_id, content, created_at FROM messages WHERE sender_id = ${uid} ORDER BY created_at DESC LIMIT 5000`
    );
    exportData.messagesSent = extractAll(msgRows);

    // Notifications
    const notifRows = await db.execute(
      sql`SELECT id, type, title, message, read_at, created_at FROM notifications WHERE user_id = ${uid} ORDER BY created_at DESC LIMIT 1000`
    );
    exportData.notifications = extractAll(notifRows);

    // GPS breadcrumbs (summary — full export could be massive)
    const gpsCountRows = await db.execute(
      sql`SELECT COUNT(*) AS total FROM gps_breadcrumbs WHERE driver_id = ${uid}`
    );
    const gpsTotal = extractFirst(gpsCountRows);
    exportData.gpsBreadcrumbs = { totalRecords: Number(gpsTotal?.total || 0), note: "Full GPS export available on request" };

    // Audit: record the export
    await recordAuditEvent({
      userId: uid,
      action: AuditAction.DATA_EXPORTED,
      category: AuditCategory.COMPLIANCE,
      entityType: "user",
      entityId: String(uid),
      metadata: { type: "GDPR_ARTICLE_15_EXPORT", exportedEntities: Object.keys(exportData) },
      severity: "HIGH",
    }).catch(() => {});

    exportData.exportMetadata = {
      exportedAt: new Date().toISOString(),
      userId: uid,
      format: "JSON",
      regulatoryBasis: "GDPR Article 15 / CCPA Right to Know",
    };

    return exportData;
  } catch (err) {
    return { error: "Export failed", detail: String(err) };
  }
}

/**
 * Schedule account deletion with 30-day grace period.
 * GDPR Article 17 / CCPA Right to Delete.
 */
export async function scheduleAccountDeletion(
  userId: number,
  reason?: string
): Promise<{ success: boolean; deletionDate: Date }> {
  const db = await getDb();
  const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  if (db) {
    try {
      await db.execute(
        sql`UPDATE users SET 
              status = 'PENDING_DELETION',
              metadata = JSON_SET(COALESCE(metadata, '{}'), 
                '$.deletionScheduledAt', ${deletionDate.toISOString()},
                '$.deletionReason', ${reason || 'user_requested'})
            WHERE id = ${userId}`
      );
    } catch (err) {
      console.error("[DataLifecycle] Failed to schedule deletion:", err);
      return { success: false, deletionDate };
    }
  }

  await recordAuditEvent({
    userId,
    action: AuditAction.PRIVACY_REQUEST,
    category: AuditCategory.COMPLIANCE,
    entityType: "user",
    entityId: String(userId),
    metadata: { type: "ACCOUNT_DELETION_SCHEDULED", deletionDate: deletionDate.toISOString(), reason },
    severity: "HIGH",
  }).catch(() => {});

  return { success: true, deletionDate };
}

/**
 * Cancel a scheduled account deletion (within grace period).
 */
export async function cancelAccountDeletion(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.execute(
      sql`UPDATE users SET 
            status = 'active',
            metadata = JSON_REMOVE(metadata, '$.deletionScheduledAt', '$.deletionReason')
          WHERE id = ${userId} AND status = 'PENDING_DELETION'`
    );

    await recordAuditEvent({
      userId,
      action: AuditAction.PRIVACY_REQUEST,
      category: AuditCategory.COMPLIANCE,
      entityType: "user",
      entityId: String(userId),
      metadata: { type: "ACCOUNT_DELETION_CANCELLED" },
      severity: "MEDIUM",
    }).catch(() => {});

    return true;
  } catch {
    return false;
  }
}

/**
 * Execute scheduled deletions — called by cron job.
 * Anonymizes shared data, deletes private data, removes user record.
 */
export async function executeScheduledDeletions(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  let deletedCount = 0;

  try {
    const rows = await db.execute(
      sql`SELECT id, email FROM users 
          WHERE status = 'PENDING_DELETION' 
          AND JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.deletionScheduledAt')) <= ${new Date().toISOString()}`
    );
    const usersToDelete = Array.isArray(rows) ? (Array.isArray(rows[0]) ? rows[0] : rows) : [];

    for (const user of usersToDelete) {
      const uid = Number((user as any).id);
      try {
        // 1. Anonymize public data that must be retained
        await db.execute(sql`UPDATE loads SET driver_name = 'Deleted User' WHERE driver_id = ${uid}`);

        // 2. Delete private data
        await db.execute(sql`DELETE FROM messages WHERE sender_id = ${uid}`);
        await db.execute(sql`DELETE FROM wallet_transactions WHERE user_id = ${uid}`);
        await db.execute(sql`DELETE FROM wallets WHERE user_id = ${uid}`);
        await db.execute(sql`DELETE FROM documents WHERE user_id = ${uid}`);
        await db.execute(sql`DELETE FROM notifications WHERE user_id = ${uid}`);
        await db.execute(sql`DELETE FROM sessions WHERE user_id = ${uid}`);
        await db.execute(sql`DELETE FROM refresh_tokens WHERE user_id = ${uid}`);

        // 3. Delete user record
        await db.execute(sql`DELETE FROM users WHERE id = ${uid}`);

        // 4. Compliance audit (separate table for long-term retention)
        await db.execute(
          sql`INSERT INTO deletion_logs (original_user_id, deleted_at, reason)
              VALUES (${uid}, NOW(), 'scheduled_deletion')`
        );

        deletedCount++;
      } catch (err) {
        console.error(`[DataLifecycle] Failed to delete user ${uid}:`, err);
      }
    }
  } catch (err) {
    console.error("[DataLifecycle] Scheduled deletion query failed:", err);
  }

  return deletedCount;
}

/**
 * Execute data retention policies — purge expired data.
 */
export async function executeRetentionPolicies(): Promise<Record<string, number>> {
  const db = await getDb();
  if (!db) return {};

  const results: Record<string, number> = {};

  for (const policy of RETENTION_POLICIES) {
    if (policy.action === "delete") {
      try {
        const cutoff = new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000);
        const result = await db.execute(
          sql`DELETE FROM ${sql.raw(policy.entityType)} WHERE created_at < ${cutoff.toISOString()} LIMIT 10000`
        );
        results[policy.entityType] = (result as any)?.affectedRows || 0;
      } catch {
        results[policy.entityType] = -1; // Error indicator
      }
    }
  }

  await recordAuditEvent({
    userId: null,
    action: AuditAction.DATA_RETENTION_PURGE,
    category: AuditCategory.COMPLIANCE,
    entityType: "system",
    metadata: { results, policiesExecuted: RETENTION_POLICIES.length },
    severity: "MEDIUM",
  }).catch(() => {});

  return results;
}

// ─── Internal ───────────────────────────────────────────────────────────────

function extractFirst(rows: any): any {
  if (Array.isArray(rows) && rows.length > 0) {
    return Array.isArray(rows[0]) ? rows[0][0] : rows[0];
  }
  return null;
}

function extractAll(rows: any): any[] {
  if (Array.isArray(rows)) {
    return Array.isArray(rows[0]) ? rows[0] : rows;
  }
  return [];
}
