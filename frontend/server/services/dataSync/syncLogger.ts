/**
 * Data Sync Logger — Logs sync operations to hz_data_sync_log table
 */
import { getDb } from "../../db";
import { hzDataSyncLog } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

interface SyncLogEntry {
  id: string;
  sourceName: string;
  syncType: "FULL" | "INCREMENTAL" | "DELTA";
  startedAt: Date;
  completedAt?: Date;
  recordsFetched?: number;
  recordsInserted?: number;
  recordsUpdated?: number;
  recordsDeleted?: number;
  status: "RUNNING" | "SUCCESS" | "FAILED" | "PARTIAL";
  errorMessage?: string;
}

export async function logSync(entry: SyncLogEntry): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    if (entry.status === "RUNNING") {
      await db.insert(hzDataSyncLog).values({
        id: entry.id,
        sourceName: entry.sourceName,
        syncType: entry.syncType,
        startedAt: entry.startedAt,
        status: "RUNNING",
      });
    } else {
      await db
        .update(hzDataSyncLog)
        .set({
          completedAt: entry.completedAt || new Date(),
          recordsFetched: entry.recordsFetched || 0,
          recordsInserted: entry.recordsInserted || 0,
          recordsUpdated: entry.recordsUpdated || 0,
          recordsDeleted: entry.recordsDeleted || 0,
          status: entry.status,
          errorMessage: entry.errorMessage || null,
        })
        .where(eq(hzDataSyncLog.id, entry.id));
    }
  } catch (e) {
    // Sync logging should never crash the sync itself
    console.error("[SyncLogger] Failed to log sync:", e);
  }
}

export function generateSyncId(): string {
  return crypto.randomUUID();
}
