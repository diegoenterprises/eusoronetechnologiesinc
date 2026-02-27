/**
 * CONVOY SYNC SERVICE — Escort/Convoy State Coordination
 *
 * Manages parallel state machines between primary load and escort vehicles:
 * - 5 sync points that gate progression
 * - Separation alerting (distance between convoy vehicles)
 * - Escort-specific states layered on top of the 32-state engine
 *
 * Integrates with: convoy.ts router, loadLifecycle router, eusotrack GPS
 */

import { getDb } from "../../db";
import { sql, eq } from "drizzle-orm";
import { convoys, escortAssignments } from "../../../drizzle/schema";
import { emitConvoyUpdate, emitNotification } from "../../_core/websocket";
import { WS_EVENTS, WS_CHANNELS } from "@shared/websocket-events";
import { wsService } from "../../_core/websocket";

// ═══════════════════════════════════════════════════════════════
// ESCORT-SPECIFIC STATES
// ═══════════════════════════════════════════════════════════════

export const ESCORT_STATES = [
  "EN_ROUTE_STAGING", "AT_STAGING", "EQUIPMENT_CHECK", "STAGING_COMPLETE",
  "AWAITING_PRIMARY", "CONVOY_FORMING", "ESCORTING", "ESCORT_HOLD",
  "CLEARING_HAZARD", "TRAFFIC_CONTROL", "SEPARATION_ALERT",
  "DELIVERY_STANDBY", "ESCORT_COMPLETE",
  "PRIMARY_BREAKDOWN", "ESCORT_BREAKDOWN", "ROUTE_BLOCKED", "POLICE_STOP",
] as const;

export type EscortState = (typeof ESCORT_STATES)[number];

// Cargo exception states that should pause convoy sync progression
const CARGO_EXCEPTION_STATES = new Set([
  "TEMP_EXCURSION", "REEFER_BREAKDOWN", "CONTAMINATION_REJECT",
  "SEAL_BREACH", "WEIGHT_VIOLATION",
]);

// ═══════════════════════════════════════════════════════════════
// SYNC POINTS
// ═══════════════════════════════════════════════════════════════

export interface SyncPoint {
  id: string;
  name: string;
  primaryStates: string[];
  escortStates: string[];
  onSync: {
    primaryTransition?: string;
    escortTransition?: string;
    notifications: string[];
    effects: string[];
  };
  timeout?: { minutes: number; action: string };
}

export const SYNC_POINTS: SyncPoint[] = [
  {
    id: "SYNC_CONFIRMED",
    name: "Both Confirmed",
    primaryStates: ["CONFIRMED"],
    escortStates: ["STAGING_COMPLETE"],
    onSync: {
      notifications: ["convoy_ready_to_depart"],
      effects: ["activate_convoy_tracking"],
    },
    timeout: { minutes: 60, action: "notify_dispatch" },
  },
  {
    id: "SYNC_READY_TO_ROLL",
    name: "Ready to Roll",
    primaryStates: ["LOADED"],
    escortStates: ["AWAITING_PRIMARY"],
    onSync: {
      primaryTransition: "LOADED_TO_IN_TRANSIT",
      escortTransition: "CONVOY_FORMING",
      notifications: ["convoy_departing"],
      effects: ["start_convoy_gps"],
    },
  },
  {
    id: "SYNC_CONVOY_FORMED",
    name: "Convoy Formed",
    primaryStates: ["IN_TRANSIT"],
    escortStates: ["CONVOY_FORMING"],
    onSync: {
      escortTransition: "ESCORTING",
      notifications: ["convoy_formed_all_positions"],
      effects: ["activate_separation_monitoring"],
    },
    timeout: { minutes: 15, action: "separation_check" },
  },
  {
    id: "SYNC_AT_DELIVERY",
    name: "Convoy Arrived",
    primaryStates: ["AT_DELIVERY"],
    escortStates: ["ESCORTING"],
    onSync: {
      escortTransition: "DELIVERY_STANDBY",
      notifications: ["convoy_arrived_at_delivery"],
      effects: ["stop_separation_monitoring"],
    },
  },
  {
    id: "SYNC_COMPLETE",
    name: "All Complete",
    primaryStates: ["DELIVERED", "INVOICED", "PAID", "COMPLETE"],
    escortStates: ["DELIVERY_STANDBY"],
    onSync: {
      escortTransition: "ESCORT_COMPLETE",
      notifications: ["escort_mission_complete"],
      effects: ["deactivate_convoy_tracking", "generate_escort_report"],
    },
  },
];

// ═══════════════════════════════════════════════════════════════
// SEPARATION CONFIG
// ═══════════════════════════════════════════════════════════════

export const SEPARATION_CONFIG = {
  maxLeadDistanceMeters: 1200,  // ~0.75 mi
  maxRearDistanceMeters: 800,   // ~0.5 mi
  warningThresholdPct: 0.8,     // warn at 80% of max
  alertIntervalSeconds: 30,
  autoHoldAfterAlerts: 3,       // place on ESCORT_HOLD after 3 consecutive alerts
};

// ═══════════════════════════════════════════════════════════════
// SERVICE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if any sync point is satisfied for a convoy
 */
export async function checkSyncPoints(
  convoyId: number,
  primaryLoadId: number,
): Promise<SyncPoint | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Get convoy and primary load state
    const [convoy] = await db.select().from(convoys).where(eq(convoys.id, convoyId)).limit(1);
    if (!convoy) return null;

    const loadRows = await db.execute(sql`
      SELECT id, status FROM loads WHERE id = ${primaryLoadId} LIMIT 1
    `);
    const primaryLoad = ((loadRows as unknown as any[][])[0] || [])[0];
    if (!primaryLoad) return null;

    const primaryState = (primaryLoad.status || "draft").toUpperCase();
    const escortState = (convoy.status || "forming").toUpperCase();

    // Check each sync point
    for (const sp of SYNC_POINTS) {
      if (sp.primaryStates.includes(primaryState) && sp.escortStates.includes(escortState)) {
        return sp;
      }
    }
    return null;
  } catch (e) {
    console.error(`[ConvoySync] checkSyncPoints error:`, (e as Error).message);
    return null;
  }
}

/**
 * Execute a sync point — update states and trigger effects
 */
export async function executeSyncPoint(
  convoyId: number,
  syncPoint: SyncPoint,
): Promise<{ success: boolean; effects: string[] }> {
  const db = await getDb();
  if (!db) return { success: false, effects: [] };

  const executedEffects: string[] = [];

  try {
    // Update escort state if specified
    if (syncPoint.onSync.escortTransition) {
      const newEscortState = syncPoint.onSync.escortTransition.toLowerCase();
      await db.update(convoys).set({
        status: newEscortState as any,
      }).where(eq(convoys.id, convoyId));
      executedEffects.push(`escort_state:${newEscortState}`);
    }

    // Log sync event
    await db.execute(sql`
      INSERT INTO load_state_transitions
        (load_id, from_state, to_state, transition_id, trigger_type, trigger_event,
         actor_user_id, actor_role, guards_passed, effects_executed, metadata, success)
      VALUES
        (${convoyId}, ${"SYNC"}, ${syncPoint.id}, ${syncPoint.id}, ${"SYSTEM"},
         ${"convoy_sync_point"}, ${0}, ${"SYSTEM"},
         ${JSON.stringify([])}, ${JSON.stringify(executedEffects)},
         ${JSON.stringify({ syncPointName: syncPoint.name })}, ${true})
    `);

    for (const effect of syncPoint.onSync.effects) {
      executedEffects.push(effect);
    }

    // ── Send real-time notifications for this sync point ──
    const [convoyInfo] = await db.select({
      loadId: convoys.loadId,
      leadUserId: convoys.leadUserId,
      rearUserId: convoys.rearUserId,
      loadUserId: convoys.loadUserId,
      status: convoys.status,
    }).from(convoys).where(eq(convoys.id, convoyId)).limit(1);

    if (convoyInfo) {
      const participants = [convoyInfo.leadUserId, convoyInfo.loadUserId];
      if (convoyInfo.rearUserId) participants.push(convoyInfo.rearUserId);

      // Map sync point notification keys to human-readable messages
      const NOTIF_MAP: Record<string, { title: string; message: string; priority: 'low' | 'medium' | 'high' | 'critical' }> = {
        convoy_ready_to_depart: { title: "Convoy Ready", message: "Both primary and escort confirmed — convoy ready to depart.", priority: "high" },
        convoy_departing: { title: "Convoy Departing", message: "Convoy is forming and departing from pickup.", priority: "high" },
        convoy_formed_all_positions: { title: "Convoy Formed", message: "All positions confirmed — convoy is in transit.", priority: "medium" },
        convoy_arrived_at_delivery: { title: "Convoy Arrived", message: "Convoy has arrived at the delivery location.", priority: "medium" },
        escort_mission_complete: { title: "Escort Complete", message: "Escort mission is complete. Thank you for your service.", priority: "low" },
      };

      for (const notifKey of syncPoint.onSync.notifications) {
        const notif = NOTIF_MAP[notifKey];
        if (!notif) continue;

        // Notify each participant via user channel
        for (const userId of participants) {
          emitNotification(String(userId), {
            id: `notif_convoy_${convoyId}_${notifKey}_${Date.now()}`,
            type: `convoy_sync`,
            title: notif.title,
            message: notif.message,
            priority: notif.priority,
            data: { convoyId: String(convoyId), syncPointId: syncPoint.id, loadId: String(convoyInfo.loadId) },
            actionUrl: `/escort/active-trip`,
            timestamp: new Date().toISOString(),
          });
        }

        // Also broadcast convoy alert to the load channel
        wsService.broadcastToChannel(
          WS_CHANNELS.LOAD(String(convoyInfo.loadId)),
          {
            type: WS_EVENTS.CONVOY_ALERT,
            data: {
              convoyId,
              syncPointId: syncPoint.id,
              syncPointName: syncPoint.name,
              notification: notifKey,
              message: notif.message,
            },
            timestamp: new Date().toISOString(),
          }
        );
      }

      // Emit convoy update event with new state
      emitConvoyUpdate({
        convoyId,
        loadId: convoyInfo.loadId,
        status: convoyInfo.status || "unknown",
        leadUserId: convoyInfo.leadUserId,
        rearUserId: convoyInfo.rearUserId || undefined,
        loadUserId: convoyInfo.loadUserId,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`[ConvoySync] Sync point ${syncPoint.id} executed for convoy ${convoyId}`);
    return { success: true, effects: executedEffects };
  } catch (e) {
    console.error(`[ConvoySync] executeSyncPoint error:`, (e as Error).message);
    return { success: false, effects: executedEffects };
  }
}

/**
 * Check convoy separation distances and trigger alerts if needed
 */
export async function checkSeparation(convoyId: number): Promise<{
  leadDistance: number | null;
  rearDistance: number | null;
  leadAlert: boolean;
  rearAlert: boolean;
}> {
  const db = await getDb();
  if (!db) return { leadDistance: null, rearDistance: null, leadAlert: false, rearAlert: false };

  try {
    const [convoy] = await db.select().from(convoys).where(eq(convoys.id, convoyId)).limit(1);
    if (!convoy) return { leadDistance: null, rearDistance: null, leadAlert: false, rearAlert: false };

    const leadDist = convoy.currentLeadDistance ?? null;
    const rearDist = convoy.currentRearDistance ?? null;

    const leadAlert = leadDist !== null && leadDist > SEPARATION_CONFIG.maxLeadDistanceMeters;
    const rearAlert = rearDist !== null && rearDist > SEPARATION_CONFIG.maxRearDistanceMeters;

    if (leadAlert || rearAlert) {
      console.log(`[ConvoySync] Separation alert convoy ${convoyId}: lead=${leadDist}m rear=${rearDist}m`);

      // Build alert message
      const alerts: string[] = [];
      if (leadAlert) alerts.push(`Lead escort ${Math.round(leadDist!)}m away (max ${SEPARATION_CONFIG.maxLeadDistanceMeters}m)`);
      if (rearAlert) alerts.push(`Rear escort ${Math.round(rearDist!)}m away (max ${SEPARATION_CONFIG.maxRearDistanceMeters}m)`);
      const alertMsg = `Separation alert: ${alerts.join("; ")}`;

      // Broadcast convoy alert to the load channel
      wsService.broadcastToChannel(
        WS_CHANNELS.LOAD(String(convoy.loadId)),
        {
          type: WS_EVENTS.CONVOY_ALERT,
          data: {
            convoyId,
            alertType: "separation",
            leadDistance: leadDist,
            rearDistance: rearDist,
            leadAlert,
            rearAlert,
            message: alertMsg,
          },
          timestamp: new Date().toISOString(),
        }
      );

      // Notify all convoy participants
      const participants = [convoy.leadUserId, convoy.loadUserId];
      if (convoy.rearUserId) participants.push(convoy.rearUserId);

      for (const userId of participants) {
        emitNotification(String(userId), {
          id: `notif_sep_${convoyId}_${Date.now()}`,
          type: "convoy_separation_alert",
          title: "Convoy Separation Alert",
          message: alertMsg,
          priority: "high",
          data: { convoyId: String(convoyId), loadId: String(convoy.loadId), leadDistance: leadDist, rearDistance: rearDist },
          actionUrl: `/escort/active-trip`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return { leadDistance: leadDist, rearDistance: rearDist, leadAlert, rearAlert };
  } catch (e) {
    console.error(`[ConvoySync] checkSeparation error:`, (e as Error).message);
    return { leadDistance: null, rearDistance: null, leadAlert: false, rearAlert: false };
  }
}

/**
 * Handle a load state change that might affect convoy sync
 */
export async function onLoadStateChange(
  loadId: number,
  newState: string,
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Check if this load is part of a convoy
    const convoyRows = await db.execute(sql`
      SELECT id FROM convoys
      WHERE load_id = ${loadId} AND status NOT IN ('completed', 'disbanded')
      LIMIT 1
    `);
    const convoy = ((convoyRows as unknown as any[][])[0] || [])[0];
    if (!convoy) return;

    const upperState = newState.toUpperCase();

    // Cargo exception states pause convoy — place escort on ESCORT_HOLD
    if (CARGO_EXCEPTION_STATES.has(upperState)) {
      console.log(`[ConvoySync] Primary load ${loadId} entered ${upperState}, placing convoy ${convoy.id} on ESCORT_HOLD`);
      await db.update(convoys).set({ status: "escort_hold" as any }).where(eq(convoys.id, convoy.id));

      // Fetch convoy participants and notify them
      const [cInfo] = await db.select({
        leadUserId: convoys.leadUserId,
        rearUserId: convoys.rearUserId,
        loadUserId: convoys.loadUserId,
      }).from(convoys).where(eq(convoys.id, convoy.id)).limit(1);

      if (cInfo) {
        const holdMsg = `Convoy paused — primary load entered ${upperState}`;
        wsService.broadcastToChannel(
          WS_CHANNELS.LOAD(String(loadId)),
          {
            type: WS_EVENTS.CONVOY_ALERT,
            data: { convoyId: convoy.id, alertType: "cargo_exception", cargoState: upperState, message: holdMsg },
            timestamp: new Date().toISOString(),
          }
        );

        const holdParticipants = [cInfo.leadUserId, cInfo.loadUserId];
        if (cInfo.rearUserId) holdParticipants.push(cInfo.rearUserId);
        for (const uid of holdParticipants) {
          emitNotification(String(uid), {
            id: `notif_hold_${convoy.id}_${Date.now()}`,
            type: "convoy_hold",
            title: "Convoy On Hold",
            message: holdMsg,
            priority: "critical",
            data: { convoyId: String(convoy.id), loadId: String(loadId), cargoState: upperState },
            actionUrl: `/escort/active-trip`,
            timestamp: new Date().toISOString(),
          });
        }
      }
      return;
    }

    // Check sync points
    const syncPoint = await checkSyncPoints(convoy.id, loadId);
    if (syncPoint) {
      await executeSyncPoint(convoy.id, syncPoint);
    }
  } catch (e) {
    console.warn(`[ConvoySync] onLoadStateChange error:`, (e as Error).message);
  }
}
