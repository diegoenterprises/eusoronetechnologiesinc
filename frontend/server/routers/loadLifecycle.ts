/**
 * LOAD LIFECYCLE STATE MACHINE v2.0 — 32-State Engine
 * ═══════════════════════════════════════════════════════
 *
 * Full state machine with:
 * - 32 states across 6 categories (Creation → Financial)
 * - ~50 typed transitions with guards, effects, and UI actions
 * - Role-based permission checks (12 platform roles)
 * - Geofence-triggered automatic transitions
 * - Financial timer hooks (detention, demurrage, layover)
 * - Approval gate integration
 * - Transition audit log (load_state_transitions table)
 * - Route intelligence auto-report on DELIVERED
 * - Backward compatible with v1 transitionState signature
 */

import { z } from "zod";
import { router, auditedProtectedProcedure as protectedProcedure } from "../_core/trpc";
import { feeCalculator } from "../services/feeCalculator";
import { getDb } from "../db";
import { loads } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";

import {
  LOAD_STATES,
  STATE_METADATA,
  TRANSITIONS,
  getTransitionsFrom,
  getTransitionById,
  isValidTransition,
  getStateDisplayOrder,
  type LoadState,
  type Transition,
  type UserRole,
} from "../services/loadLifecycle/stateMachine";

import {
  startTimer,
  stopTimer,
  getActiveTimers as getFinancialTimers,
  getTimerHistory,
  waiveTimer,
} from "../services/loadLifecycle/financialTimers";

import { onLoadStateChange as checkConvoySync } from "../services/loadLifecycle/convoySyncService";

// ═══════════════════════════════════════════════════════════════
// GEOFENCE HELPERS
// ═══════════════════════════════════════════════════════════════

const GEOFENCE_RADIUS_MILES = 0.25;

function calculateDistanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ═══════════════════════════════════════════════════════════════
// GUARD EVALUATION
// ═══════════════════════════════════════════════════════════════

interface GuardContext {
  load: any;
  location?: { lat: number; lng: number };
  targetLocation?: { lat: number; lng: number };
  complianceChecks?: Record<string, boolean | undefined>;
  metadata?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

function evaluateGuard(guard: { type: string; check: string; errorMessage: string }, ctx: GuardContext): string | null {
  switch (guard.check) {
    // Data guards
    case "has_pickup_location":
      return ctx.load?.pickupLocation ? null : guard.errorMessage;
    case "has_delivery_location":
      return ctx.load?.deliveryLocation ? null : guard.errorMessage;
    case "has_rate":
      return (ctx.load?.rate && parseFloat(String(ctx.load.rate)) > 0) ? null : guard.errorMessage;
    case "has_carrier":
      return (ctx.load?.catalystId || ctx.data?.carrierId) ? null : guard.errorMessage;
    case "has_winning_bid":
      return ctx.data?.bidId ? null : guard.errorMessage;
    case "has_driver":
      return (ctx.load?.driverId || ctx.data?.driverId) ? null : guard.errorMessage;
    case "has_weight":
      return (ctx.load?.weight || ctx.data?.weight) ? null : guard.errorMessage;
    case "has_seal_numbers":
      return ctx.data?.sealNumbers ? null : guard.errorMessage;

    // Time guards
    case "pickup_date_future":
      if (!ctx.load?.pickupDate) return null; // optional
      return new Date(ctx.load.pickupDate) > new Date() ? null : guard.errorMessage;
    case "past_deadline":
    case "award_expired_2hr":
    case "pod_24h_elapsed":
      return null; // Timer-triggered: always pass when triggered by system

    // Location guards
    case "within_pickup_geofence":
      if (!ctx.location || !ctx.targetLocation) return null; // skip if no location data
      return calculateDistanceMiles(ctx.location.lat, ctx.location.lng, ctx.targetLocation.lat, ctx.targetLocation.lng) <= GEOFENCE_RADIUS_MILES
        ? null : guard.errorMessage;
    case "within_delivery_geofence":
      if (!ctx.location || !ctx.targetLocation) return null;
      return calculateDistanceMiles(ctx.location.lat, ctx.location.lng, ctx.targetLocation.lat, ctx.targetLocation.lng) <= GEOFENCE_RADIUS_MILES
        ? null : guard.errorMessage;

    // Document guards
    case "pre_trip_complete":
      return ctx.complianceChecks?.vehicleInspected !== false ? null : guard.errorMessage;
    case "bol_signed":
      return (ctx.complianceChecks?.bolPresent !== false || ctx.metadata?.bolDocumentId) ? null : guard.errorMessage;
    case "pod_photo_present":
      return (ctx.metadata?.podPhotoUrl || ctx.complianceChecks?.podSigned !== false) ? null : guard.errorMessage;
    case "pod_signature_present":
      return (ctx.metadata?.podSignatureUrl || ctx.complianceChecks?.podSigned !== false) ? null : guard.errorMessage;

    // HOS guards
    case "driver_has_hours":
      return ctx.complianceChecks?.hosCompliant !== false ? null : guard.errorMessage;

    // Approval guards
    case "rate_within_limit":
    case "payment_amount_valid":
      return null; // Approval gates handled separately

    default:
      return null; // Unknown guards pass by default
  }
}

// ═══════════════════════════════════════════════════════════════
// EFFECT EXECUTION
// ═══════════════════════════════════════════════════════════════

async function executeFinancialEffect(action: string, loadId: number, ctx: any) {
  try {
    switch (action) {
      case "start_detention_timer":
        await startTimer(loadId, "DETENTION");
        break;
      case "stop_detention_timer": {
        const timers = await getFinancialTimers(loadId);
        const detention = timers.find(t => t.type === "DETENTION");
        if (detention) await stopTimer(detention.id);
        break;
      }
      case "start_demurrage_timer":
        await startTimer(loadId, "DEMURRAGE");
        break;
      case "stop_demurrage_timer": {
        const timers2 = await getFinancialTimers(loadId);
        const demurrage = timers2.find(t => t.type === "DEMURRAGE");
        if (demurrage) await stopTimer(demurrage.id);
        break;
      }
      case "start_layover_timer":
        await startTimer(loadId, "LAYOVER");
        break;
      case "stop_layover_timer": {
        const timers3 = await getFinancialTimers(loadId);
        const layover = timers3.find(t => t.type === "LAYOVER");
        if (layover) await stopTimer(layover.id);
        break;
      }
      case "capture_escrow":
      case "generate_invoice":
      case "process_settlement":
      case "close_load_ledger": {
        const db = await getDb();
        if (!db) break;
        const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
        if (!load) break;
        const loadAmount = parseFloat(String((load as any).rate || "0"));
        if (loadAmount > 0 && (action === "capture_escrow" || action === "process_settlement")) {
          const feeResult = await feeCalculator.calculateFee({
            userId: (load as any).shipperId || 0,
            userRole: "SHIPPER",
            transactionType: "load_completion",
            amount: loadAmount,
            loadId,
          });
          if (feeResult.finalFee > 0) {
            await feeCalculator.recordFeeCollection(loadId, "load_completion", (load as any).shipperId || 0, loadAmount, feeResult);
            console.log(`[LoadLifecycle] ${action}: $${feeResult.finalFee.toFixed(2)} for load ${loadId}`);
          }
        }
        break;
      }
      case "apply_cancellation_penalty":
      case "release_escrow":
      case "start_tracking":
      case "create_rate_confirmation":
        console.log(`[LoadLifecycle] Financial effect: ${action} for load ${loadId}`);
        break;
      default:
        break;
    }
  } catch (e) {
    console.warn(`[LoadLifecycle] Financial effect error (${action}):`, (e as Error).message);
  }
}

async function generateRouteReport(loadId: number, userId: number) {
  try {
    const db = await getDb();
    if (!db) return;
    const trail = await db.execute(sql`
      SELECT latitude, longitude, speed, device_timestamp
      FROM location_history
      WHERE load_id = ${loadId}
      ORDER BY device_timestamp ASC
      LIMIT 2000
    `);
    const pts = (trail as unknown as any[][])[0] || [];
    if (pts.length < 2) return;

    const first = pts[0];
    const last = pts[pts.length - 1];
    const speeds = pts.filter((p: any) => p.speed).map((p: any) => Number(p.speed));
    const avgSpd = speeds.length > 0 ? speeds.reduce((a: number, b: number) => a + b, 0) / speeds.length : null;
    const maxSpd = speeds.length > 0 ? Math.max(...speeds) : null;
    const startTime = new Date(first.device_timestamp);
    const endTime = new Date(last.device_timestamp);
    const transitMins = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
    const toRad = (d: number) => d * Math.PI / 180;
    const R = 3959;
    const dLat = toRad(Number(last.latitude) - Number(first.latitude));
    const dLng = toRad(Number(last.longitude) - Number(first.longitude));
    const a2 = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(Number(first.latitude))) * Math.cos(toRad(Number(last.latitude))) * Math.sin(dLng / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2));

    await db.execute(sql`
      INSERT INTO hz_driver_route_reports
      (driver_id, load_id, origin_lat, origin_lng, dest_lat, dest_lng,
       distance_miles, transit_minutes, avg_speed_mph, max_speed_mph,
       stop_count, is_hazmat, started_at, completed_at)
      VALUES (${userId}, ${loadId},
              ${Number(first.latitude)}, ${Number(first.longitude)},
              ${Number(last.latitude)}, ${Number(last.longitude)},
              ${dist.toFixed(2)}, ${transitMins},
              ${avgSpd?.toFixed(2) || null}, ${maxSpd?.toFixed(2) || null},
              ${pts.filter((p: any, i: number) => i > 0 && Number(p.speed || 0) < 2).length},
              0,
              ${startTime.toISOString()}, ${endTime.toISOString()})
    `);
    console.log(`[LoadLifecycle] Route report: ${pts.length} GPS points, ${dist.toFixed(1)}mi for load ${loadId}`);
  } catch (e) {
    console.warn(`[LoadLifecycle] Route report error for load ${loadId}:`, (e as Error).message);
  }
}

// ═══════════════════════════════════════════════════════════════
// AUDIT LOG
// ═══════════════════════════════════════════════════════════════

async function logTransition(
  loadId: number, fromState: string, toState: string,
  transition: Transition, userId: number, userRole: string,
  guardsPassed: string[], effectsExecuted: string[],
  metadata: Record<string, unknown> | undefined, success: boolean, errorMessage?: string,
) {
  try {
    const db = await getDb();
    if (!db) return;
    await db.execute(sql`
      INSERT INTO load_state_transitions
        (load_id, from_state, to_state, transition_id, trigger_type, trigger_event,
         actor_user_id, actor_role, guards_passed, effects_executed, metadata, success, error_message)
      VALUES
        (${loadId}, ${fromState}, ${toState}, ${transition.id}, ${transition.trigger},
         ${transition.triggerEvent}, ${userId}, ${userRole},
         ${JSON.stringify(guardsPassed)}, ${JSON.stringify(effectsExecuted)},
         ${JSON.stringify(metadata || {})}, ${success}, ${errorMessage || null})
    `);
  } catch (e) {
    console.warn(`[LoadLifecycle] Audit log error:`, (e as Error).message);
  }
}

// ═══════════════════════════════════════════════════════════════
// TRPC ROUTER
// ═══════════════════════════════════════════════════════════════

export const loadLifecycleRouter = router({

  // ── GET STATE MACHINE DEFINITION ──
  getStateMachine: protectedProcedure.query(() => ({
    states: LOAD_STATES,
    stateMetadata: STATE_METADATA,
    transitions: TRANSITIONS.map(t => ({
      id: t.id, from: t.from, to: t.to, trigger: t.trigger,
      triggerEvent: t.triggerEvent, actor: t.actor, priority: t.priority,
      uiAction: t.uiAction, guardsCount: t.guards.length, effectsCount: t.effects.length,
    })),
    stateOrder: getStateDisplayOrder(),
    geofenceRadiusMiles: GEOFENCE_RADIUS_MILES,
  })),

  // ── GET AVAILABLE TRANSITIONS FOR A LOAD ──
  getAvailableTransitions: protectedProcedure
    .input(z.object({ loadId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const numId = Number(input.loadId) || 0;
      const [load] = numId > 0
        ? await db.select().from(loads).where(eq(loads.id, numId)).limit(1)
        : [null];
      if (!load) return [];

      const currentState = ((load as any).status || "draft").toUpperCase() as LoadState;
      const userRole = (ctx.user?.role || "DRIVER").toUpperCase() as UserRole;
      const transitions = getTransitionsFrom(currentState);

      return transitions
        .filter(t => t.actor.includes(userRole) || userRole === "ADMIN" || userRole === "SUPER_ADMIN")
        .map(t => {
          const guardErrors: string[] = [];
          for (const g of t.guards) {
            const err = evaluateGuard(g, { load, complianceChecks: {}, metadata: {} });
            if (err) guardErrors.push(err);
          }
          return {
            transitionId: t.id,
            to: t.to,
            toMeta: STATE_METADATA[t.to],
            trigger: t.trigger,
            uiAction: t.uiAction,
            canExecute: guardErrors.length === 0,
            blockedReasons: guardErrors,
          };
        });
    }),

  // ── GET STATE HISTORY FOR A LOAD ──
  getStateHistory: protectedProcedure
    .input(z.object({ loadId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const rows = await db.execute(sql`
          SELECT lst.*, u.name as actor_name
          FROM load_state_transitions lst
          LEFT JOIN users u ON u.id = lst.actor_user_id
          WHERE lst.load_id = ${Number(input.loadId) || 0}
          ORDER BY lst.created_at ASC
        `);
        return (((rows as unknown as any[][])[0]) || []).map((r: any) => ({
          id: r.id,
          fromState: r.from_state,
          toState: r.to_state,
          transitionId: r.transition_id,
          triggerType: r.trigger_type,
          triggerEvent: r.trigger_event,
          actorName: r.actor_name || "System",
          actorRole: r.actor_role,
          success: r.success,
          errorMessage: r.error_message,
          createdAt: r.created_at?.toISOString?.() || r.created_at,
        }));
      } catch {
        return [];
      }
    }),

  // ── VALIDATE TRANSITION (v1 compat) ──
  validateTransition: protectedProcedure
    .input(z.object({ currentState: z.string(), nextState: z.string() }))
    .query(({ input }) => {
      const from = input.currentState.toUpperCase() as LoadState;
      const to = input.nextState.toUpperCase() as LoadState;
      const valid = isValidTransition(from, to);
      const meta = STATE_METADATA[to];
      return {
        valid,
        reason: valid ? undefined : `Cannot transition from ${from} to ${to}`,
        toMeta: meta ? { displayName: meta.displayName, icon: meta.icon, color: meta.color, category: meta.category } : null,
        documentsRequired: meta?.documentsRequired || [],
        gpsRequired: meta?.gpsRequired || false,
      };
    }),

  // ── GET VALID NEXT STATES ──
  getValidNextStates: protectedProcedure
    .input(z.object({ currentState: z.string() }))
    .query(({ input }) => {
      const current = input.currentState.toUpperCase() as LoadState;
      const transitions = getTransitionsFrom(current);
      const seen = new Set<string>();
      const uniqueStates: LoadState[] = [];
      for (const t of transitions) { if (!seen.has(t.to)) { seen.add(t.to); uniqueStates.push(t.to); } }
      return uniqueStates.map(s => {
        const m = STATE_METADATA[s as LoadState];
        return {
          state: s,
          category: m.category, displayName: m.displayName, description: m.description,
          icon: m.icon, color: m.color, bgColor: m.bgColor, gpsRequired: m.gpsRequired,
          documentsRequired: m.documentsRequired, isFinal: m.isFinal, isException: m.isException,
          transitions: transitions.filter(t => t.to === s).map(t => ({ id: t.id, trigger: t.trigger, actor: t.actor, uiAction: t.uiAction })),
        };
      });
    }),

  // ── EXECUTE TRANSITION (v2 — uses typed transition IDs) ──
  executeTransition: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      transitionId: z.string(),
      location: z.object({ lat: z.number(), lng: z.number() }).optional(),
      targetLocation: z.object({ lat: z.number(), lng: z.number() }).optional(),
      data: z.record(z.string(), z.unknown()).optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
      complianceChecks: z.object({
        hosCompliant: z.boolean().optional(),
        hazmatEndorsed: z.boolean().optional(),
        vehicleInspected: z.boolean().optional(),
        bolPresent: z.boolean().optional(),
        runTicketPresent: z.boolean().optional(),
        podSigned: z.boolean().optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };

      const numericLoadId = Number(input.loadId) || 0;
      const [load] = numericLoadId > 0
        ? await db.select().from(loads).where(eq(loads.id, numericLoadId)).limit(1)
        : [null];
      if (!load) return { success: false, error: "Load not found" };

      const currentState = ((load as any).status || "draft").toUpperCase() as LoadState;
      const transition = getTransitionById(input.transitionId);
      if (!transition) return { success: false, error: `Unknown transition: ${input.transitionId}` };

      // Verify from-state matches
      const fromMatch = Array.isArray(transition.from)
        ? transition.from.includes(currentState)
        : transition.from === currentState;
      if (!fromMatch) {
        return { success: false, error: `Transition ${input.transitionId} not valid from state ${currentState}` };
      }

      // Role check
      const userRole = (ctx.user?.role || "DRIVER").toUpperCase() as UserRole;
      if (!transition.actor.includes(userRole) && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
        return { success: false, error: `Role ${userRole} not permitted for this transition` };
      }

      // Evaluate guards
      const guardCtx: GuardContext = {
        load,
        location: input.location,
        targetLocation: input.targetLocation || (load as any).pickupLocation || (load as any).deliveryLocation,
        complianceChecks: input.complianceChecks || {},
        metadata: input.metadata || {},
        data: input.data || {},
      };
      const errors: string[] = [];
      const guardsPassed: string[] = [];
      for (const g of transition.guards) {
        const err = evaluateGuard(g, guardCtx);
        if (err) errors.push(err);
        else guardsPassed.push(g.check);
      }

      if (errors.length > 0) {
        await logTransition(numericLoadId, currentState, transition.to, transition, ctx.user?.id || 0, userRole, guardsPassed, [], input.metadata, false, errors.join("; "));
        return { success: false, errors, step: "GUARD_VALIDATION" };
      }

      // Update load status in DB
      const newStatusLower = transition.to.toLowerCase();
      try {
        await db.execute(sql`UPDATE loads SET status = ${newStatusLower}, updatedAt = NOW() WHERE id = ${numericLoadId}`);
      } catch (dbErr) {
        return { success: false, error: `DB update failed: ${(dbErr as Error).message}` };
      }

      // If ON_HOLD, save previous state
      if (transition.to === "ON_HOLD") {
        try {
          await db.execute(sql`
            UPDATE loads SET previous_state = ${currentState.toLowerCase()},
            hold_reason = ${(input.metadata?.reason as string) || null},
            held_by = ${ctx.user?.id || null}, held_at = NOW()
            WHERE id = ${numericLoadId}
          `);
        } catch { /* non-critical */ }
      }

      // Execute effects
      const effectsExecuted: string[] = [];
      for (const effect of transition.effects) {
        try {
          if (effect.type === "financial") {
            await executeFinancialEffect(effect.action, numericLoadId, ctx);
          }
          // integration effects
          if (effect.type === "integration" && effect.action === "generate_route_report") {
            await generateRouteReport(numericLoadId, ctx.user?.id || 0);
          }
          effectsExecuted.push(`${effect.type}:${effect.action}`);
        } catch (effErr) {
          console.warn(`[LoadLifecycle] Effect error (${effect.action}):`, (effErr as Error).message);
          effectsExecuted.push(`${effect.type}:${effect.action}:FAILED`);
        }
      }

      // Route intelligence on DELIVERED
      if (transition.to === "DELIVERED") {
        await generateRouteReport(numericLoadId, ctx.user?.id || 0);
      }

      // Convoy sync — check if this state change satisfies a sync point
      try { await checkConvoySync(numericLoadId, transition.to); } catch { /* non-critical */ }

      // Audit log
      await logTransition(numericLoadId, currentState, transition.to, transition, ctx.user?.id || 0, userRole, guardsPassed, effectsExecuted, input.metadata, true);

      console.log(`[LoadLifecycle] ${currentState} → ${transition.to} (${input.transitionId}) for load ${input.loadId}`);

      // ── Real-time broadcast via Socket.io ──
      try {
        const { emitLoadStateChange } = await import("../services/socketService");
        emitLoadStateChange({
          loadId: input.loadId,
          previousState: currentState,
          newState: transition.to,
          transitionId: input.transitionId,
          actorId: ctx.user?.id || 0,
          actorName: ctx.user?.name || "System",
          actorRole: userRole,
          timestamp: new Date().toISOString(),
          metadata: input.metadata || {},
        });
      } catch { /* non-critical — page still works via polling */ }

      return {
        success: true,
        loadId: input.loadId,
        previousState: currentState,
        newState: transition.to,
        transitionId: input.transitionId,
        guardsPassed,
        effectsExecuted,
        transitionedAt: new Date().toISOString(),
        newStateMeta: STATE_METADATA[transition.to],
      };
    }),

  // ── BACKWARD COMPAT: v1 transitionState ──
  transitionState: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      currentState: z.string(),
      nextState: z.string(),
      location: z.object({ lat: z.number(), lng: z.number() }).optional(),
      targetLocation: z.object({ lat: z.number(), lng: z.number() }).optional(),
      metadata: z.object({
        podSignatureUrl: z.string().optional(),
        bolDocumentId: z.string().optional(),
        runTicketId: z.string().optional(),
        smartContractUrl: z.string().optional(),
        escrowIntentId: z.string().optional(),
        cancellationReason: z.string().optional(),
        delayReason: z.string().optional(),
        disputeReason: z.string().optional(),
      }).optional(),
      complianceChecks: z.object({
        hosCompliant: z.boolean().optional(),
        hazmatEndorsed: z.boolean().optional(),
        vehicleInspected: z.boolean().optional(),
        bolPresent: z.boolean().optional(),
        runTicketPresent: z.boolean().optional(),
        podSigned: z.boolean().optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const from = input.currentState.toUpperCase() as LoadState;
      const to = input.nextState.toUpperCase() as LoadState;

      // Find matching transition
      const transitions = getTransitionsFrom(from);
      const match = transitions.find(t => t.to === to);
      if (!match) {
        return { success: false, error: `Cannot transition from ${from} to ${to}`, step: "TRANSITION_VALIDATION" };
      }

      // Delegate to v2 executeTransition logic inline
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };

      const numericLoadId = Number(input.loadId) || 0;
      const [load] = numericLoadId > 0
        ? await db.select().from(loads).where(eq(loads.id, numericLoadId)).limit(1)
        : [null];
      if (!load) return { success: false, error: "Load not found" };

      // Evaluate guards
      const guardCtx: GuardContext = {
        load,
        location: input.location,
        targetLocation: input.targetLocation,
        complianceChecks: input.complianceChecks || {},
        metadata: input.metadata || {},
        data: {},
      };
      const errors: string[] = [];
      for (const g of match.guards) {
        const err = evaluateGuard(g, guardCtx);
        if (err) errors.push(err);
      }
      if (errors.length > 0) {
        return { success: false, errors, step: "COMPLIANCE_VALIDATION" };
      }

      // Update status
      const newStatusLower = to.toLowerCase();
      await db.execute(sql`UPDATE loads SET status = ${newStatusLower}, updatedAt = NOW() WHERE id = ${numericLoadId}`);

      // Execute financial effects
      const financialEffects = match.effects.filter(e => e.type === "financial");
      for (const eff of financialEffects) {
        await executeFinancialEffect(eff.action, numericLoadId, ctx);
      }

      // Route report on DELIVERED
      if (to === "DELIVERED") {
        await generateRouteReport(numericLoadId, ctx.user?.id || 0);
      }

      // Audit
      const userRole = (ctx.user?.role || "DRIVER").toUpperCase();
      await logTransition(numericLoadId, from, to, match, ctx.user?.id || 0, userRole, match.guards.map(g => g.check), financialEffects.map(e => e.action), input.metadata, true);

      // ── Real-time broadcast via Socket.io ──
      try {
        const { emitLoadStateChange } = await import("../services/socketService");
        emitLoadStateChange({
          loadId: input.loadId,
          previousState: from,
          newState: to,
          actorId: ctx.user?.id || 0,
          actorName: ctx.user?.name || "System",
          actorRole: userRole,
          timestamp: new Date().toISOString(),
          metadata: (input.metadata as Record<string, unknown>) || {},
        });
      } catch { /* non-critical */ }

      return {
        success: true,
        loadId: input.loadId,
        previousState: from,
        newState: to,
        complianceChecked: match.guards.map(g => g.check),
        financialActionsTriggered: financialEffects.map(e => e.action),
        feeCollected: null,
        transitionedAt: new Date().toISOString(),
        metadata: input.metadata || {},
      };
    }),

  // ── FINANCIAL TIMERS ──
  getActiveTimers: protectedProcedure
    .input(z.object({ loadId: z.string() }))
    .query(async ({ input }) => {
      return getFinancialTimers(Number(input.loadId) || 0);
    }),

  getTimerHistory: protectedProcedure
    .input(z.object({ loadId: z.string() }))
    .query(async ({ input }) => {
      return getTimerHistory(Number(input.loadId) || 0);
    }),

  waiveTimer: protectedProcedure
    .input(z.object({ timerId: z.number(), reason: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return waiveTimer(input.timerId, ctx.user?.id || 0, input.reason);
    }),

  // ── FINANCIAL SUMMARY ──
  getFinancialSummary: protectedProcedure
    .input(z.object({ loadId: z.string() }))
    .query(async ({ input }) => {
      const numId = Number(input.loadId) || 0;
      const db = await getDb();
      if (!db) return null;

      const [load] = numId > 0
        ? await db.select().from(loads).where(eq(loads.id, numId)).limit(1)
        : [null];
      if (!load) return null;

      const rate = parseFloat(String((load as any).rate || "0"));
      const distance = parseFloat(String((load as any).distance || "0"));
      const timers = await getTimerHistory(numId);
      const activeTimers = await getFinancialTimers(numId);

      const detentionCharges = timers.filter(t => t.type === "DETENTION").reduce((s, t) => s + t.currentCharge, 0);
      const demurrageCharges = timers.filter(t => t.type === "DEMURRAGE").reduce((s, t) => s + t.currentCharge, 0);
      const layoverCharges = timers.filter(t => t.type === "LAYOVER").reduce((s, t) => s + t.currentCharge, 0);

      return {
        loadId: input.loadId,
        lineHaul: rate,
        distance,
        fuelSurcharge: Math.round(distance * 0.58 * 100) / 100, // $0.58/mi avg
        hazmatSurcharge: (load as any).cargoType === "hazmat" ? Math.round(rate * 0.15 * 100) / 100 : 0,
        detentionCharges,
        demurrageCharges,
        layoverCharges,
        totalAccessorials: detentionCharges + demurrageCharges + layoverCharges,
        totalCharges: rate + detentionCharges + demurrageCharges + layoverCharges,
        activeTimers,
        timerHistory: timers,
        currency: "USD",
      };
    }),

  // ── PENDING APPROVALS ──
  getPendingApprovals: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      try {
        const rows = await db.execute(sql`
          SELECT ar.*, l.load_number, l.status as load_status
          FROM approval_requests ar
          LEFT JOIN loads l ON l.id = ar.load_id
          WHERE ar.status = 'PENDING'
          ORDER BY ar.created_at DESC
          LIMIT 50
        `);
        return (((rows as unknown as any[][])[0]) || []).map((r: any) => ({
          id: r.id,
          loadId: r.load_id,
          loadNumber: r.load_number,
          loadStatus: r.load_status,
          gateId: r.gate_id,
          transitionId: r.transition_id,
          status: r.status,
          requestedAt: r.requested_at?.toISOString?.() || r.requested_at,
          expiresAt: r.expires_at?.toISOString?.() || r.expires_at,
        }));
      } catch {
        return [];
      }
    }),

  // ── CREATE APPROVAL REQUEST ──
  createApprovalRequest: protectedProcedure
    .input(z.object({
      loadId: z.string(),
      gateId: z.string(),
      transitionId: z.string(),
      expiresInMinutes: z.number().optional().default(60),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };
      try {
        const expiresAt = new Date(Date.now() + input.expiresInMinutes * 60000);
        await db.execute(sql`
          INSERT INTO approval_requests (load_id, gate_id, transition_id, status, requested_by, created_at, expires_at)
          VALUES (${Number(input.loadId) || 0}, ${input.gateId}, ${input.transitionId}, 'PENDING',
                  ${ctx.user?.id || 0}, NOW(), ${expiresAt.toISOString()})
        `);

        // Broadcast approval event via Socket.io
        try {
          const { emitApprovalEvent } = await import("../services/socketService");
          emitApprovalEvent({
            loadId: input.loadId,
            approvalId: 0,
            gateId: input.gateId,
            action: "requested",
            actorId: ctx.user?.id || 0,
            timestamp: new Date().toISOString(),
          });
        } catch { /* non-critical */ }

        return { success: true };
      } catch (e) {
        return { success: false, error: (e as Error).message };
      }
    }),

  // ── APPROVE REQUEST ──
  approveRequest: protectedProcedure
    .input(z.object({
      approvalId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };

      // Only dispatch/admin/super_admin can approve
      const userRole = (ctx.user?.role || "").toUpperCase();
      if (!["DISPATCH", "ADMIN", "SUPER_ADMIN", "TERMINAL_MANAGER"].includes(userRole)) {
        return { success: false, error: "Insufficient permissions to approve" };
      }

      try {
        // Get the approval request
        const rows = await db.execute(sql`
          SELECT * FROM approval_requests WHERE id = ${input.approvalId} AND status = 'PENDING' LIMIT 1
        `);
        const approval = ((rows as unknown as any[][])[0] || [])[0];
        if (!approval) return { success: false, error: "Approval request not found or already resolved" };

        // Check expiration
        if (approval.expires_at && new Date(approval.expires_at) < new Date()) {
          await db.execute(sql`UPDATE approval_requests SET status = 'EXPIRED' WHERE id = ${input.approvalId}`);
          return { success: false, error: "Approval request has expired" };
        }

        // Approve it
        await db.execute(sql`
          UPDATE approval_requests
          SET status = 'APPROVED', resolved_by = ${ctx.user?.id || 0}, resolved_at = NOW(),
              notes = ${input.notes || null}
          WHERE id = ${input.approvalId}
        `);

        // Broadcast via Socket.io
        try {
          const { emitApprovalEvent } = await import("../services/socketService");
          emitApprovalEvent({
            loadId: String(approval.load_id),
            approvalId: input.approvalId,
            gateId: approval.gate_id,
            action: "approved",
            actorId: ctx.user?.id || 0,
            timestamp: new Date().toISOString(),
          });
        } catch { /* non-critical */ }

        return {
          success: true,
          approvalId: input.approvalId,
          loadId: String(approval.load_id),
          gateId: approval.gate_id,
          transitionId: approval.transition_id,
        };
      } catch (e) {
        return { success: false, error: (e as Error).message };
      }
    }),

  // ── DENY REQUEST ──
  denyRequest: protectedProcedure
    .input(z.object({
      approvalId: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };

      const userRole = (ctx.user?.role || "").toUpperCase();
      if (!["DISPATCH", "ADMIN", "SUPER_ADMIN", "TERMINAL_MANAGER"].includes(userRole)) {
        return { success: false, error: "Insufficient permissions to deny" };
      }

      try {
        const rows = await db.execute(sql`
          SELECT * FROM approval_requests WHERE id = ${input.approvalId} AND status = 'PENDING' LIMIT 1
        `);
        const approval = ((rows as unknown as any[][])[0] || [])[0];
        if (!approval) return { success: false, error: "Approval request not found or already resolved" };

        await db.execute(sql`
          UPDATE approval_requests
          SET status = 'DENIED', resolved_by = ${ctx.user?.id || 0}, resolved_at = NOW(),
              notes = ${input.reason}
          WHERE id = ${input.approvalId}
        `);

        // Broadcast via Socket.io
        try {
          const { emitApprovalEvent } = await import("../services/socketService");
          emitApprovalEvent({
            loadId: String(approval.load_id),
            approvalId: input.approvalId,
            gateId: approval.gate_id,
            action: "denied",
            actorId: ctx.user?.id || 0,
            timestamp: new Date().toISOString(),
          });
        } catch { /* non-critical */ }

        return {
          success: true,
          approvalId: input.approvalId,
          loadId: String(approval.load_id),
        };
      } catch (e) {
        return { success: false, error: (e as Error).message };
      }
    }),
});
