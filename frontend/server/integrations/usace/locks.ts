/**
 * USACE Lock & Waterway Status Integration
 * Source: US Army Corps of Engineers
 * Auth: None
 * Refresh: Every 30 minutes
 */
import { getDb } from "../../db";
import { hzLockStatus } from "../../../drizzle/schema";
import { XMLParser } from "fast-xml-parser";

const USACE_BASE = "https://corpslocks.usace.army.mil/lpwb/xml";

const MONITORED_LOCKS = [
  "LOCK_1_MR",
  "LOCK_27_MR",
  "OLMSTED",
  "MCALPINE",
  "EMSWORTH",
  "BONNEVILLE",
  "THE_DALLES",
  "JOHN_DAY",
  "LOCK_19_MR",
];

function mapLockStatus(status: string): "Open" | "Closed" | "Restricted" | "Scheduled_Closure" {
  if (!status) return "Open";
  const lower = status.toLowerCase();
  if (lower.includes("closed")) return "Closed";
  if (lower.includes("restricted")) return "Restricted";
  if (lower.includes("scheduled")) return "Scheduled_Closure";
  return "Open";
}

export async function fetchLockStatus(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const parser = new XMLParser();

  for (const lockId of MONITORED_LOCKS) {
    try {
      const url = `${USACE_BASE}/lockstatus.xml?lockid=${lockId}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) continue;

      const xmlText = await response.text();
      const data = parser.parse(xmlText);
      const lock = data.lock || {};

      await db
        .insert(hzLockStatus)
        .values({
          lockId,
          lockName: lock.name || lockId,
          riverName: lock.river || null,
          stateCode: lock.state || null,
          latitude: lock.latitude ? String(parseFloat(lock.latitude)) : null,
          longitude: lock.longitude ? String(parseFloat(lock.longitude)) : null,
          operationalStatus: mapLockStatus(lock.status),
          closureReason: lock.closure_reason || null,
          expectedReopen: lock.expected_reopen ? new Date(lock.expected_reopen) : null,
          avgDelayHours: lock.avg_delay_hours ? String(parseFloat(lock.avg_delay_hours)) : "0",
          vesselsWaiting: parseInt(lock.vessels_waiting) || 0,
          dailyLockages: parseInt(lock.daily_lockages) || 0,
          lastUpdated: lock.last_updated ? new Date(lock.last_updated) : new Date(),
        })
        .onDuplicateKeyUpdate({
          set: {
            operationalStatus: mapLockStatus(lock.status),
            avgDelayHours: lock.avg_delay_hours ? String(parseFloat(lock.avg_delay_hours)) : "0",
            vesselsWaiting: parseInt(lock.vessels_waiting) || 0,
            lastUpdated: new Date(),
            fetchedAt: new Date(),
          },
        });
    } catch (err) {
      console.error(`[USACE] Failed to fetch lock ${lockId}:`, err);
    }
  }
}
