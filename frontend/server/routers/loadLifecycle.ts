/**
 * LOAD LIFECYCLE STATE MACHINE v2.2 — 37-State Engine
 * ═══════════════════════════════════════════════════════
 *
 * Full state machine with:
 * - 37 states across 6 categories (Creation → Financial + cargo-specific exceptions)
 * - ~60 typed transitions with guards, effects, and UI actions
 * - Role-based permission checks (12 platform roles)
 * - Geofence-triggered automatic transitions
 * - Financial timer hooks (detention, demurrage, layover)
 * - Approval gate integration
 * - Transition audit log (load_state_transitions table)
 * - Route intelligence auto-report on DELIVERED
 * - Backward compatible with v1 transitionState signature
 *
 * v2.1 Additions:
 * - GPS geotag on EVERY state transition (immutable audit trail)
 * - Server-side HOS engine verification (not client-trust)
 * - Cargo-aware compliance guards (tanker, hazmat, reefer, oversize, food, cryo, pharma)
 * - Interstate/intrastate detection + state-crossing compliance
 * - Load compliance snapshot at assignment
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, isolatedApprovedProcedure as protectedProcedure } from "../_core/trpc";
import { logger } from "../_core/logger";
import { feeCalculator } from "../services/feeCalculator";
import { getDb } from "../db";
import { loads, vehicles, escortAssignments, settlements, settlementDocuments, wallets, walletTransactions, notifications, users, drivers, payments, auditLogs, custodyTransfers } from "../../drizzle/schema";
import type { Load, User } from "../../drizzle/schema";
import { eq, and, ne, sql, inArray } from "drizzle-orm";
import { fireGamificationEvent } from "../services/gamificationDispatcher";

/** Row shape returned by raw `db.execute(sql`...`)` queries (MySQL2 RowDataPacket). */
type RawRow = Record<string, unknown>;
/** Tuple shape from `db.execute()`: [unsafeCast(rows)[], fieldPackets]. */
type RawQueryResult = [RawRow[], unknown];

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
  getTimerConfigForCargo,
} from "../services/loadLifecycle/financialTimers";

import { onLoadStateChange as checkConvoySync } from "../services/loadLifecycle/convoySyncService";
import { createGeotag } from "../_core/locationEngine";
import { getHOSSummary, canDriverAcceptLoad } from "../services/hosEngine";
import { resolveComplianceMatrix, PRODUCT_CATALOG, TRAILER_PRODUCT_MAP } from "../seeds/complianceMatrix";
import { SEGREGATION_TABLE } from "../_core/hazmatConstants";
import { unsafeCast } from "../_core/types/unsafe";

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION DISPATCHER — centralized load lifecycle notifications
// ═══════════════════════════════════════════════════════════════

const NOTIFICATION_MAP: Record<string, { roles: string[]; userFields: string[]; title: string; type: string; priority: string }> = {
  "posted": { roles: ["CATALYST", "DISPATCH", "BROKER"], userFields: [], title: "New Load Posted", type: "load_update", priority: "normal" },
  "awarded": { roles: [], userFields: ["catalystId"], title: "Load Awarded to You", type: "load_update", priority: "high" },
  "accepted": { roles: [], userFields: ["shipperId"], title: "Carrier Accepted Load", type: "load_update", priority: "normal" },
  "declined": { roles: [], userFields: ["shipperId"], title: "Carrier Declined Load", type: "load_update", priority: "high" },
  "assigned": { roles: [], userFields: ["driverId"], title: "Load Assigned to You", type: "load_update", priority: "high" },
  "confirmed": { roles: [], userFields: ["catalystId", "shipperId"], title: "Driver Confirmed Load", type: "load_update", priority: "normal" },
  "en_route_pickup": { roles: [], userFields: ["shipperId", "catalystId"], title: "Driver En Route to Pickup", type: "load_update", priority: "normal" },
  "at_pickup": { roles: [], userFields: ["shipperId", "catalystId"], title: "Driver Arrived at Pickup", type: "load_update", priority: "normal" },
  "loading": { roles: [], userFields: ["shipperId"], title: "Loading Started", type: "load_update", priority: "normal" },
  "loaded": { roles: [], userFields: ["shipperId", "catalystId"], title: "Loading Complete", type: "load_update", priority: "normal" },
  "in_transit": { roles: [], userFields: ["shipperId", "catalystId"], title: "Load In Transit", type: "load_update", priority: "normal" },
  "at_delivery": { roles: [], userFields: ["shipperId", "catalystId"], title: "Driver Arrived at Delivery", type: "load_update", priority: "normal" },
  "unloading": { roles: [], userFields: ["shipperId"], title: "Unloading Started", type: "load_update", priority: "normal" },
  "unloaded": { roles: [], userFields: ["shipperId", "catalystId"], title: "Unloading Complete", type: "load_update", priority: "normal" },
  "pod_pending": { roles: [], userFields: ["shipperId"], title: "POD Submitted — Review Required", type: "load_update", priority: "high" },
  "delivered": { roles: [], userFields: ["driverId", "catalystId"], title: "Delivery Confirmed", type: "load_update", priority: "high" },
  "pod_rejected": { roles: [], userFields: ["driverId"], title: "POD Rejected — Resubmit Required", type: "load_update", priority: "high" },
  "invoiced": { roles: [], userFields: ["shipperId"], title: "Invoice Ready", type: "payment_received", priority: "high" },
  "paid": { roles: [], userFields: ["catalystId", "driverId"], title: "Payment Received", type: "payment_received", priority: "high" },
  "cancelled": { roles: [], userFields: ["shipperId", "catalystId", "driverId"], title: "Load Cancelled", type: "load_update", priority: "urgent" },
  "on_hold": { roles: [], userFields: ["shipperId", "catalystId", "driverId"], title: "Load Placed On Hold", type: "load_update", priority: "urgent" },
  // Exception statuses
  "loading_exception": { roles: ["SAFETY_MANAGER"], userFields: ["shipperId", "catalystId"], title: "Loading Exception Reported", type: "load_update", priority: "urgent" },
  "transit_exception": { roles: ["SAFETY_MANAGER"], userFields: ["shipperId", "catalystId"], title: "Transit Exception Reported", type: "load_update", priority: "urgent" },
  "unloading_exception": { roles: ["SAFETY_MANAGER"], userFields: ["shipperId", "catalystId"], title: "Unloading Exception Reported", type: "load_update", priority: "urgent" },
  "temp_excursion": { roles: ["SAFETY_MANAGER"], userFields: ["shipperId", "catalystId", "driverId"], title: "Temperature Excursion Alert", type: "compliance_expiring", priority: "urgent" },
  "reefer_breakdown": { roles: ["SAFETY_MANAGER"], userFields: ["shipperId", "catalystId", "driverId"], title: "Reefer Unit Breakdown", type: "compliance_expiring", priority: "urgent" },
  "contamination_reject": { roles: ["SAFETY_MANAGER", "ADMIN"], userFields: ["shipperId", "catalystId"], title: "Cargo Contamination Detected", type: "compliance_expiring", priority: "urgent" },
  "seal_breach": { roles: ["SAFETY_MANAGER", "ADMIN"], userFields: ["shipperId", "catalystId"], title: "Seal Breach Detected", type: "compliance_expiring", priority: "urgent" },
  "weight_violation": { roles: ["COMPLIANCE_OFFICER"], userFields: ["shipperId", "catalystId"], title: "Weight Violation Detected", type: "compliance_expiring", priority: "urgent" },
};

/**
 * Emit in-app notifications + WebSocket broadcasts for a load status change.
 * Fire-and-forget: errors are caught internally so they never break the main flow.
 */
export async function emitLoadNotifications(
  loadId: number,
  newStatus: string,
  load: { shipperId?: number | null; catalystId?: number | null; driverId?: number | null; loadNumber?: string },
) {
  const config = NOTIFICATION_MAP[newStatus];
  if (!config) return;

  const db = await getDb();
  if (!db) return;

  // Collect target user IDs
  const targetUserIds: number[] = [];

  // Add specific users from load fields
  for (const field of config.userFields) {
    const uid = (load as unknown as Record<string, unknown>)[field];
    if (uid && typeof uid === "number") targetUserIds.push(uid);
  }

  // Add role-based users
  if (config.roles.length > 0) {
    try {
      const roleUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.role, config.roles as typeof users.role.enumValues));
      for (const u of roleUsers) {
        if (!targetUserIds.includes(u.id)) targetUserIds.push(u.id);
      }
    } catch (roleErr) {
      logger.warn("[LoadNotifications] Role lookup error:", (roleErr as Error).message);
    }
  }

  // Insert in-app notifications
  for (const userId of targetUserIds) {
    try {
      await db.insert(notifications).values({
        userId,
        type: config.type as typeof notifications.type.enumValues[number],
        title: config.title,
        message: `Load ${load.loadNumber || loadId} status changed to ${newStatus.replace(/_/g, " ").toUpperCase()}`,
        data: JSON.stringify({ loadId, status: newStatus }),
        isRead: false,
      });
    } catch {}
  }

  // WebSocket broadcast
  try {
    const { getIO } = await import("../services/socketService");
    const io = getIO();
    if (io) {
      io.to(`load:${loadId}`).emit("load:status_changed", { loadId, status: newStatus, loadNumber: load.loadNumber });
      for (const uid of targetUserIds) {
        io.to(`user:${uid}`).emit("notification:new", { loadId, title: config.title, status: newStatus });
      }
    }
  } catch {}
}

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

const IS_PROD = process.env.NODE_ENV === "production";

async function evaluateGuard(guard: { type: string; check: string; errorMessage: string }, ctx: GuardContext): Promise<string | null> {
  switch (guard.check) {
    // ── Data guards (always enforced) ──
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

    // ── Time-window guards (enforced in production) ──
    case "pickup_date_future": {
      if (!ctx.load?.pickupDate) return IS_PROD ? guard.errorMessage : null;
      const pickupDate = new Date(ctx.load.pickupDate);
      // Allow 4-hour early window before pickup date
      const earlyWindow = new Date(pickupDate.getTime() - 4 * 3600000);
      return new Date() >= earlyWindow ? null : guard.errorMessage;
    }
    case "within_pickup_window": {
      if (!ctx.load?.pickupDate) return IS_PROD ? guard.errorMessage : null;
      const pickupDate = new Date(ctx.load.pickupDate);
      // Must be within ±24h of scheduled pickup
      const diff = Math.abs(Date.now() - pickupDate.getTime());
      return diff <= 24 * 3600000 ? null : guard.errorMessage;
    }
    case "within_delivery_window": {
      if (!ctx.load?.deliveryDate) return IS_PROD ? guard.errorMessage : null;
      const deliveryDate = new Date(ctx.load.deliveryDate);
      // Must be within ±48h of scheduled delivery
      const diff = Math.abs(Date.now() - deliveryDate.getTime());
      return diff <= 48 * 3600000 ? null : guard.errorMessage;
    }
    case "past_deadline":
    case "award_expired_2hr":
    case "pod_24h_elapsed":
      return null; // Timer-triggered: always pass when triggered by system

    // ── GPS geofence guards (enforced in production) ──
    case "within_pickup_geofence": {
      if (!ctx.location) return IS_PROD ? "GPS location required for pickup check-in" : null;
      const target = ctx.targetLocation || parseLocation(ctx.load?.pickupLocation);
      if (!target) return IS_PROD ? "Pickup location coordinates unavailable" : null;
      const dist = calculateDistanceMiles(ctx.location.lat, ctx.location.lng, target.lat, target.lng);
      return dist <= GEOFENCE_RADIUS_MILES ? null : `${guard.errorMessage} (${dist.toFixed(2)} mi away, must be within ${GEOFENCE_RADIUS_MILES} mi)`;
    }
    case "within_delivery_geofence": {
      if (!ctx.location) return IS_PROD ? "GPS location required for delivery check-in" : null;
      const target = ctx.targetLocation || parseLocation(ctx.load?.deliveryLocation);
      if (!target) return IS_PROD ? "Delivery location coordinates unavailable" : null;
      const dist = calculateDistanceMiles(ctx.location.lat, ctx.location.lng, target.lat, target.lng);
      return dist <= GEOFENCE_RADIUS_MILES ? null : `${guard.errorMessage} (${dist.toFixed(2)} mi away, must be within ${GEOFENCE_RADIUS_MILES} mi)`;
    }

    // ── Document guards (tightened — check explicit flags or metadata) ──
    case "pre_trip_complete":
      if (ctx.complianceChecks?.vehicleInspected === true) return null;
      if (ctx.complianceChecks?.vehicleInspected === false) return guard.errorMessage;
      return IS_PROD ? guard.errorMessage : null;
    case "bol_signed":
      if (ctx.metadata?.bolDocumentId) return null;
      if (ctx.complianceChecks?.bolPresent === true) return null;
      if (ctx.complianceChecks?.bolPresent === false) return guard.errorMessage;
      return IS_PROD ? guard.errorMessage : null;
    case "run_ticket_present":
      if (ctx.metadata?.runTicketId) return null;
      if (ctx.complianceChecks?.runTicketPresent === true) return null;
      return IS_PROD ? guard.errorMessage : null;
    case "pod_photo_present":
      if (ctx.metadata?.podPhotoUrl) return null;
      if (ctx.complianceChecks?.podSigned === true) return null;
      return IS_PROD ? guard.errorMessage : null;
    case "pod_signature_present":
      if (ctx.metadata?.podSignatureUrl) return null;
      if (ctx.complianceChecks?.podSigned === true) return null;
      return IS_PROD ? guard.errorMessage : null;

    // ── HOS guard (SERVER-SIDE — queries real HOS engine, not client boolean) ──
    case "driver_has_hours": {
      // Trust client boolean as fast-path, but verify server-side for real enforcement
      if (ctx.complianceChecks?.hosCompliant === false) return guard.errorMessage;
      // Server-side HOS verification (the source of truth)
      const driverId = ctx.load?.driverId || (ctx.data?.driverId as number | undefined);
      if (driverId) {
        const hosResult = verifyHOSServerSide(driverId);
        if (!hosResult.compliant) return `${guard.errorMessage}: ${hosResult.reason}`;
      }
      return null;
    }

    // ── HOS acceptance guard (for assigning driver to load) ──
    case "driver_can_accept": {
      const acceptDriverId = ctx.load?.driverId || (ctx.data?.driverId as number | undefined);
      if (acceptDriverId) {
        const hosAccept = verifyHOSForAcceptance(acceptDriverId);
        if (!hosAccept.allowed) return `${guard.errorMessage}: ${hosAccept.reason}`;
      }
      return null;
    }

    // ── Hazmat endorsement guard ──
    case "hazmat_endorsed":
      if (ctx.complianceChecks?.hazmatEndorsed === true) return null;
      if (ctx.complianceChecks?.hazmatEndorsed === false) return guard.errorMessage;
      // If load is hazmat, require explicit endorsement in production
      if (IS_PROD && (ctx.load?.hazmatClass || ctx.load?.cargoType === "hazmat")) return guard.errorMessage;
      return null;

    // ── Carrier hazmat authorization guard (FMCSA check at AWARDED→ACCEPTED) ──
    case "carrier_hazmat_authorized": {
      // Only enforce if load involves hazmat
      if (!ctx.load?.hazmatClass && ctx.load?.cargoType !== "hazmat") return null;
      const carrierId = ctx.load?.catalystId || (ctx.data?.carrierId as number | undefined);
      if (!carrierId) return guard.errorMessage;
      try {
        const db = await getDb();
        if (!db) return guard.errorMessage;
        // Check user record for hazmat authorization
        const [carrier] = await db.execute(sql`
          SELECT hazmatLicense, hazmatExpiry FROM users WHERE id = ${carrierId} LIMIT 1
        `);
        const row = ((carrier as unknown as RawQueryResult)?.[0] || [])[0];
        if (!row) return guard.errorMessage;
        if (!row.hazmatLicense) return guard.errorMessage;
        // Check expiry
        if (row.hazmatExpiry && new Date(String(row.hazmatExpiry)) < new Date()) {
          return `Carrier hazmat authorization expired on ${new Date(String(row.hazmatExpiry)).toLocaleDateString()}`;
        }
        return null;
      } catch {
        return guard.errorMessage;
      }
    }

    // ── Carrier insurance minimum guard (at AWARDED→ACCEPTED) ──
    // FMCSA minimums: Standard $750K liability + $100K cargo; Hazmat $5M liability + $1M cargo
    case "carrier_insurance_verified":
    case "carrier_insurance_minimum": {
      const insCarrierId = ctx.load?.catalystId || (ctx.data?.carrierId as number | undefined);
      if (!insCarrierId) return guard.errorMessage;
      try {
        const db = await getDb();
        if (!db) return guard.errorMessage;
        // Determine load type to set FMCSA insurance minimums
        const isHazmat = !!ctx.load?.hazmatClass || ctx.load?.cargoType === "hazmat";
        const minLiability = isHazmat ? 5000000 : 750000;
        const minCargo = isHazmat ? 1000000 : 100000;
        // Query active, non-expired insurance policies for the carrier's company
        const [policies] = await db.execute(sql`
          SELECT policyType, combinedSingleLimit, perOccurrenceLimit, aggregateLimit, cargoLimit, expirationDate
          FROM insurance_policies
          WHERE companyId IN (SELECT companyId FROM users WHERE id = ${insCarrierId})
            AND status = 'active'
            AND expirationDate > NOW()
        `) as unknown as RawQueryResult;
        const rows = policies || [];
        // Check liability coverage — use combinedSingleLimit, fall back to perOccurrenceLimit or aggregateLimit
        const liabilityOk = unsafeCast(rows).some((p: RawRow) => {
          if (p.policyType !== 'auto_liability' && p.policyType !== 'general_liability') return false;
          const coverage = Math.max(
            parseFloat(String(p.combinedSingleLimit || "0")),
            parseFloat(String(p.perOccurrenceLimit || "0")),
            parseFloat(String(p.aggregateLimit || "0"))
          );
          return coverage >= minLiability;
        });
        // Check cargo coverage — use cargoLimit, fall back to combinedSingleLimit or perOccurrenceLimit
        const cargoOk = unsafeCast(rows).some((p: RawRow) => {
          if (p.policyType !== 'cargo' && p.policyType !== 'motor_truck_cargo') return false;
          const coverage = Math.max(
            parseFloat(String(p.cargoLimit || "0")),
            parseFloat(String(p.combinedSingleLimit || "0")),
            parseFloat(String(p.perOccurrenceLimit || "0"))
          );
          return coverage >= minCargo;
        });
        // Verify expiration dates are in the future
        const expiredPolicies = unsafeCast(rows).filter((p: RawRow) =>
          p.expirationDate && new Date(String(p.expirationDate)) < new Date()
        );
        if (expiredPolicies.length > 0 && rows.length === expiredPolicies.length) {
          return 'All carrier insurance policies have expired. Active coverage required for load acceptance.';
        }
        if (!liabilityOk) return `Carrier liability insurance below $${minLiability.toLocaleString()} FMCSA minimum for ${isHazmat ? 'hazmat' : 'standard'} loads`;
        if (!cargoOk) return `Carrier cargo insurance below $${minCargo.toLocaleString()} FMCSA minimum for ${isHazmat ? 'hazmat' : 'standard'} loads`;
        return null;
      } catch {
        return guard.errorMessage;
      }
    }

    // ── Driver HazMat endorsement guard (CDL H or X at ASSIGNED→CONFIRMED) ──
    case "driver_hazmat_endorsed": {
      // Only enforce if load involves hazmat
      if (!ctx.load?.hazmatClass && ctx.load?.cargoType !== "hazmat") return null;
      const hazDriverId = ctx.load?.driverId || (ctx.data?.driverId as number | undefined);
      if (!hazDriverId) return guard.errorMessage;
      try {
        const db = await getDb();
        if (!db) return guard.errorMessage;
        const [result] = await db.execute(sql`
          SELECT hazmatEndorsement, hazmatExpiry, cdlEndorsements
          FROM driver_profiles WHERE userId = ${hazDriverId} LIMIT 1
        `) as unknown as RawQueryResult;
        const driver = (result || [])[0];
        if (!driver) return guard.errorMessage;
        // Check H or X endorsement
        const endorsements: string = String(driver.cdlEndorsements || "");
        const hasH = endorsements.includes("H") || endorsements.includes("X");
        if (!hasH && !driver.hazmatEndorsement) return guard.errorMessage;
        // Check expiry
        if (driver.hazmatExpiry && new Date(String(driver.hazmatExpiry)) < new Date()) {
          return `Driver HazMat endorsement expired on ${new Date(String(driver.hazmatExpiry)).toLocaleDateString()}`;
        }
        return null;
      } catch {
        return guard.errorMessage;
      }
    }

    // ── Driver Tanker endorsement guard (CDL N or X at ASSIGNED→CONFIRMED) ──
    case "driver_tanker_endorsed": {
      // Only enforce if load uses a tanker trailer
      const trailerType = ctx.load?.trailerType || ctx.load?.equipmentType || "";
      const isTanker = typeof trailerType === "string" &&
        (trailerType.toLowerCase().includes("tanker") || trailerType.toLowerCase().includes("mc-") || trailerType.toLowerCase().includes("mc_"));
      if (!isTanker) return null;
      const tankDriverId = ctx.load?.driverId || (ctx.data?.driverId as number | undefined);
      if (!tankDriverId) return guard.errorMessage;
      try {
        const db = await getDb();
        if (!db) return guard.errorMessage;
        const [result] = await db.execute(sql`
          SELECT cdlEndorsements FROM driver_profiles WHERE userId = ${tankDriverId} LIMIT 1
        `) as unknown as RawQueryResult;
        const driver = (result || [])[0];
        if (!driver) return guard.errorMessage;
        const endorsements: string = String(driver.cdlEndorsements || "");
        const hasN = endorsements.includes("N") || endorsements.includes("X");
        if (!hasN) return guard.errorMessage;
        return null;
      } catch {
        return guard.errorMessage;
      }
    }

    // ── Vehicle DOT inspection + Out-of-Service blocking guard ──
    case "vehicle_inspection_current": {
      if (!ctx.load?.vehicleId) return null;
      try {
        const db = await getDb();
        if (!db) return guard.errorMessage;
        const [vRows] = await db.execute(sql`
          SELECT outOfService, outOfServiceReason, annualDotInspectionExpiry
          FROM vehicles WHERE id = ${ctx.load.vehicleId} LIMIT 1
        `) as unknown as RawQueryResult;
        const vehicle = (vRows || [])[0];
        if (!vehicle) return null;
        if (vehicle.outOfService) {
          return `Vehicle is out of service: ${vehicle.outOfServiceReason || 'See maintenance records'}`;
        }
        if (vehicle.annualDotInspectionExpiry && new Date(String(vehicle.annualDotInspectionExpiry)) < new Date()) {
          return 'Vehicle annual DOT inspection has expired. Cannot dispatch until renewed.';
        }
        return null;
      } catch {
        return guard.errorMessage;
      }
    }

    // ── Equipment certification guard (Phase 3.1) ──
    case "equipment_matches_load": {
      const eqLoadId = ctx.load?.id;
      const vehicleId = ctx.load?.vehicleId || (ctx.data?.vehicleId as number | undefined);
      if (!vehicleId || !eqLoadId) return null; // No vehicle assigned yet — skip
      try {
        const db = await getDb();
        if (!db) return IS_PROD ? guard.errorMessage : null;
        const loadTrailer = ctx.load?.trailerType || ctx.load?.equipment || "";
        const loadWeight = parseFloat(ctx.load?.weight || "0");
        // Check vehicle specs from fleet
        const [vRows] = await db.execute(sql`
          SELECT trailerType, trailerSpec, maxPayloadLbs, reeferStatus
          FROM vehicles WHERE id = ${vehicleId} LIMIT 1
        `) as unknown as RawQueryResult;
        const vehicle = (vRows || [])[0];
        if (!vehicle) return IS_PROD ? guard.errorMessage : null;
        // Tanker spec match
        if (loadTrailer && (loadTrailer.startsWith("mc_") || loadTrailer.startsWith("dot_"))) {
          if (vehicle.trailerSpec && vehicle.trailerSpec !== loadTrailer) {
            return `Load requires ${loadTrailer} but vehicle is ${vehicle.trailerSpec}`;
          }
        }
        // Reefer operational check
        if (loadTrailer === "reefer" && vehicle.reeferStatus && vehicle.reeferStatus !== "operational") {
          return "Reefer load requires vehicle with operational refrigeration unit";
        }
        // Weight capacity check
        if (loadWeight > 0 && vehicle.maxPayloadLbs && loadWeight > parseFloat(String(vehicle.maxPayloadLbs))) {
          return `Load weight (${loadWeight} lbs) exceeds vehicle capacity (${vehicle.maxPayloadLbs} lbs)`;
        }
        return null;
      } catch {
        return IS_PROD ? guard.errorMessage : null;
      }
    }

    // ── Commodity segregation guard (Phase 3.3 — 49 CFR 177.848) ──
    case "commodity_segregation_safe": {
      const segLoadId = ctx.load?.id;
      const segHazmat = ctx.load?.hazmatClass || ctx.load?.hazardClassNumber;
      if (!segHazmat || !segLoadId) return null; // Non-hazmat load — skip
      const segVehicleId = ctx.load?.vehicleId || (ctx.data?.vehicleId as number | undefined);
      if (!segVehicleId) return null; // No vehicle yet
      try {
        const db = await getDb();
        if (!db) return IS_PROD ? guard.errorMessage : null;
        // Find other active loads on the same vehicle
        const [otherRows] = await db.execute(sql`
          SELECT id, hazmatClass, hazardClassNumber FROM loads
          WHERE vehicleId = ${segVehicleId}
            AND id != ${segLoadId}
            AND status IN ('assigned', 'confirmed', 'en_route_pickup', 'at_pickup', 'loading', 'loaded', 'in_transit')
        `) as unknown as RawQueryResult;
        const otherLoads = otherRows || [];
        const incompatible = SEGREGATION_TABLE[segHazmat] || [];
        for (const other of otherLoads) {
          const otherClass = String(other.hazmatClass || other.hazardClassNumber || "");
          if (otherClass && incompatible.includes(otherClass)) {
            return `Hazmat Class ${segHazmat} cannot be transported with Class ${otherClass} on same vehicle per 49 CFR 177.848`;
          }
        }
        return null;
      } catch {
        return IS_PROD ? guard.errorMessage : null;
      }
    }

    // ── Route state compliance guard (Phase 3.4) ──
    case "route_state_compliance": {
      const rcLoad = ctx.load;
      if (!rcLoad) return null;
      const loadWeight = parseFloat(rcLoad.weight || "0");
      const origin = rcLoad.origin || rcLoad.pickupAddress || "";
      const dest = rcLoad.destination || rcLoad.deliveryAddress || "";
      // Extract state abbreviations from origin/destination
      const stateRegex = /\b([A-Z]{2})\b/g;
      const states = new Set<string>();
      for (const match of (origin.match(stateRegex) || [])) states.add(match);
      for (const match of (dest.match(stateRegex) || [])) states.add(match);
      const STATE_RULES: Record<string, { carb?: boolean; weightLimit?: number; hazmatNote?: string }> = {
        CA: { carb: true, weightLimit: 80000, hazmatNote: "Tunnel restrictions apply" },
        NY: { weightLimit: 80000, hazmatNote: "NYC restricted hazmat routes" },
        TX: { weightLimit: 84000 },
        MT: { weightLimit: 131060 },
        MI: { weightLimit: 164000 },
        FL: { weightLimit: 80000 },
        PA: { weightLimit: 80000 },
        OH: { weightLimit: 80000 },
        IL: { weightLimit: 80000 },
        IN: { weightLimit: 80000 },
        LA: { weightLimit: 80000 },
        OK: { weightLimit: 90000 },
        NM: { weightLimit: 86400 },
        ND: { weightLimit: 105500 },
        SD: { weightLimit: 129000 },
        WA: { weightLimit: 105500 },
        OR: { weightLimit: 105500 },
        NV: { weightLimit: 80000 },
        AZ: { weightLimit: 80000, hazmatNote: "Phoenix metro hazmat curfew" },
        CO: { weightLimit: 85000 },
        UT: { weightLimit: 80000 },
        ID: { weightLimit: 105500 },
        WY: { weightLimit: 117000 },
        NE: { weightLimit: 95000 },
        KS: { weightLimit: 85500 },
        MO: { weightLimit: 80000 },
        AR: { weightLimit: 80000 },
        MS: { weightLimit: 80000 },
        AL: { weightLimit: 80000 },
        GA: { weightLimit: 80000 },
        SC: { weightLimit: 80000 },
        NC: { weightLimit: 80000 },
        VA: { weightLimit: 80000, hazmatNote: "Hampton Roads tunnel restrictions" },
        WV: { weightLimit: 80000 },
        KY: { weightLimit: 80000 },
        TN: { weightLimit: 80000 },
        WI: { weightLimit: 80000 },
        MN: { weightLimit: 80000 },
        IA: { weightLimit: 80000 },
        CT: { weightLimit: 80000, hazmatNote: "I-95 corridor hazmat route" },
        NJ: { weightLimit: 80000, hazmatNote: "Turnpike hazmat restrictions" },
        MA: { weightLimit: 80000, hazmatNote: "Ted Williams Tunnel ban" },
        MD: { weightLimit: 80000, hazmatNote: "Baltimore tunnel restrictions" },
        DE: { weightLimit: 80000 },
        RI: { weightLimit: 80000 },
        NH: { weightLimit: 80000 },
        VT: { weightLimit: 80000 },
        ME: { weightLimit: 100000 },
        HI: { weightLimit: 80000 },
        AK: { weightLimit: 105500 },
      };
      const warnings: string[] = [];
      for (const state of Array.from(states)) {
        const rules = STATE_RULES[state];
        if (!rules) continue;
        if (rules.weightLimit && loadWeight > rules.weightLimit && !rcLoad.specialPermit) {
          warnings.push(`${state}: weight ${loadWeight} lbs exceeds limit ${rules.weightLimit} lbs — permit required`);
        }
        if (rules.carb && rcLoad.trailerType?.includes("tank")) {
          warnings.push(`${state}: CARB compliance required for tanker vehicles`);
        }
      }
      // Enforce in all environments — no bypass
      if (warnings.length > 0) {
        return warnings[0];
      }
      return null;
    }

    // ── Rate & payment validation guards ──
    case "rate_within_limit": {
      const rcRate = parseFloat(String(ctx.load?.rate || "0"));
      const rcDistance = parseFloat(String(ctx.load?.distance || ctx.load?.miles || "0"));
      // If rate is zero or negative, fail immediately
      if (rcRate <= 0) return guard.errorMessage || "Load rate must be greater than $0";
      // Hard ceiling: $500,000 total
      if (rcRate > 500000) return guard.errorMessage || "Load rate exceeds maximum allowed ($500,000)";
      // Per-mile check when distance is known
      if (rcDistance > 0) {
        const ratePerMile = rcRate / rcDistance;
        if (ratePerMile < 0.50) return guard.errorMessage || `Rate per mile ($${ratePerMile.toFixed(2)}) is below minimum ($0.50/mi)`;
        if (ratePerMile > 15.00) {
          // Check for an approved rate_override before rejecting
          try {
            const rdb = await getDb();
            if (rdb) {
              const [overrideRows] = await rdb.execute(sql`
                SELECT id FROM approval_requests
                WHERE load_id = ${ctx.load?.id} AND gate_id = 'rate_override' AND status = 'APPROVED'
                LIMIT 1
              `) as unknown as RawQueryResult;
              if ((overrideRows || []).length > 0) return null; // approved override — bypass
            }
          } catch { /* DB error — fall through to reject */ }
          return guard.errorMessage || `Rate per mile ($${ratePerMile.toFixed(2)}) exceeds maximum ($15.00/mi) — approval required`;
        }
      }
      return null;
    }
    case "payment_amount_valid": {
      const payRate = parseFloat(String(ctx.load?.rate || "0"));
      if (!payRate || payRate <= 0) return guard.errorMessage || "Load must have a positive rate/amount set before proceeding";
      return null;
    }

    // ── Cargo-aware guards (tanker, hazmat, reefer, oversize, interstate, state-specific) ──
    case "tanker_inspection_valid":
    case "vapor_recovery_valid":
    case "tank_washout_valid":
    case "tank_pressure_test":
    case "product_compatibility_verified":
    case "tanker_endorsement_valid":
    case "tanker_hose_inspection":
    case "tanker_compartment_segregation":
    case "tanker_residual_handling":
    case "hazmat_shipping_papers":
    case "hazmat_security_plan_active":
    case "hazmat_placard_verified":
    case "hazmat_route_compliant":
    case "emergency_response_plan":
    case "hazmat_placard_photo":
    case "hazmat_loading_sequence":
    case "hazmat_decontamination":
    case "reefer_temp_verified":
    case "reefer_temp_set":
    case "reefer_pretrip_complete":
    case "reefer_pre_cool_complete":
    case "continuous_temp_monitoring":
    case "fsma_cert_valid":
    case "reefer_precool_verified":
    case "reefer_delivery_temp_verified":
    case "cold_chain_declaration":
    case "oversize_permit_valid":
    case "escort_vehicle_confirmed":
    case "route_survey_complete":
    case "flatbed_securement_verified":
    case "flatbed_dimension_verified":
    case "oversize_escort_confirmed":
    case "animal_welfare_check":
    case "ventilation_verified":
    case "28hr_rule_compliant":
    case "livestock_welfare_check":
    case "livestock_ventilation_verified":
    case "livestock_28hr_plan":
    case "livestock_count_verified":
    case "vehicle_inventory_complete":
    case "tie_down_inspection":
    case "auto_vin_verified":
    case "auto_condition_documented":
    case "auto_tiedown_verified":
    case "chassis_inspection_valid":
    case "intermodal_twistlock_verified":
    case "intermodal_vgm_verified":
    case "ifta_valid":
    case "irp_valid":
    case "carb_compliant":
    case "weight_distance_tax": {
      const profile = buildCargoProfile(ctx.load);
      return await evaluateCargoGuard(guard.check, profile, guard.errorMessage, ctx.load?.id);
    }

    // ── Escort arrangement gate (async DB check) ──
    case "escort_arranged": {
      const loadId = ctx.load?.id;
      const requiresEscort = ctx.load?.requiresEscort;
      // If the load doesn't require escort, pass immediately
      if (!requiresEscort) return null;
      if (!loadId) return guard.errorMessage;
      try {
        const db = await getDb();
        if (!db) return IS_PROD ? guard.errorMessage : null;
        const [assignment] = await db.select({ id: escortAssignments.id })
          .from(escortAssignments)
          .where(and(
            eq(escortAssignments.loadId, loadId),
            ne(escortAssignments.status, "cancelled"),
          )).limit(1);
        return assignment ? null : guard.errorMessage;
      } catch {
        return IS_PROD ? guard.errorMessage : null;
      }
    }

    // ── Cargo exception document guards (seal breach, temp excursion, reefer breakdown, weight, contamination, rejection) ──
    case "temp_log_uploaded": {
      const tlProfile = buildCargoProfile(ctx.load);
      if (tlProfile.complianceChecks?.temp_log_uploaded?.passed) return null;
      // Fallback: check documents table for a matching document
      const tlLoadId = ctx.load?.id;
      if (tlLoadId) {
        try {
          const db = await getDb();
          if (db) {
            const [rows] = await db.execute(sql`
              SELECT id FROM documents
              WHERE load_id = ${tlLoadId} AND type = 'temp_log'
              LIMIT 1
            `) as unknown as RawQueryResult;
            if ((rows || []).length > 0) return null;
          }
        } catch { /* non-critical */ }
      }
      return guard.errorMessage;
    }

    case "reefer_diagnostic_uploaded": {
      const rdProfile = buildCargoProfile(ctx.load);
      if (rdProfile.complianceChecks?.reefer_diagnostic_uploaded?.passed) return null;
      const rdLoadId = ctx.load?.id;
      if (rdLoadId) {
        try {
          const db = await getDb();
          if (db) {
            const [rows] = await db.execute(sql`
              SELECT id FROM documents
              WHERE load_id = ${rdLoadId} AND type = 'reefer_diagnostic'
              LIMIT 1
            `) as unknown as RawQueryResult;
            if ((rows || []).length > 0) return null;
          }
        } catch { /* non-critical */ }
      }
      return guard.errorMessage;
    }

    case "seal_photos_uploaded": {
      const spProfile = buildCargoProfile(ctx.load);
      if (spProfile.complianceChecks?.seal_photos_uploaded?.passed) return null;
      const spLoadId = ctx.load?.id;
      if (spLoadId) {
        try {
          const db = await getDb();
          if (db) {
            const [rows] = await db.execute(sql`
              SELECT id FROM documents
              WHERE load_id = ${spLoadId} AND type = 'seal_photo'
              LIMIT 1
            `) as unknown as RawQueryResult;
            if ((rows || []).length > 0) return null;
          }
        } catch { /* non-critical */ }
      }
      return guard.errorMessage;
    }

    case "cargo_inspection_complete": {
      const ciProfile = buildCargoProfile(ctx.load);
      if (ciProfile.complianceChecks?.cargo_inspection_complete?.passed) return null;
      const ciLoadId = ctx.load?.id;
      if (ciLoadId) {
        try {
          const db = await getDb();
          if (db) {
            const [rows] = await db.execute(sql`
              SELECT id FROM documents
              WHERE load_id = ${ciLoadId} AND type = 'cargo_inspection'
              LIMIT 1
            `) as unknown as RawQueryResult;
            if ((rows || []).length > 0) return null;
          }
        } catch { /* non-critical */ }
      }
      return guard.errorMessage;
    }

    case "scale_ticket_uploaded": {
      const stProfile = buildCargoProfile(ctx.load);
      if (stProfile.complianceChecks?.scale_ticket_uploaded?.passed) return null;
      const stLoadId = ctx.load?.id;
      if (stLoadId) {
        try {
          const db = await getDb();
          if (db) {
            const [rows] = await db.execute(sql`
              SELECT id FROM documents
              WHERE load_id = ${stLoadId} AND type = 'scale_ticket'
              LIMIT 1
            `) as unknown as RawQueryResult;
            if ((rows || []).length > 0) return null;
          }
        } catch { /* non-critical */ }
      }
      return guard.errorMessage;
    }

    case "lab_results_uploaded": {
      const lrProfile = buildCargoProfile(ctx.load);
      if (lrProfile.complianceChecks?.lab_results_uploaded?.passed) return null;
      const lrLoadId = ctx.load?.id;
      if (lrLoadId) {
        try {
          const db = await getDb();
          if (db) {
            const [rows] = await db.execute(sql`
              SELECT id FROM documents
              WHERE load_id = ${lrLoadId} AND type = 'lab_results'
              LIMIT 1
            `) as unknown as RawQueryResult;
            if ((rows || []).length > 0) return null;
          }
        } catch { /* non-critical */ }
      }
      return guard.errorMessage;
    }

    case "inspection_report_uploaded": {
      const irProfile = buildCargoProfile(ctx.load);
      if (irProfile.complianceChecks?.inspection_report_uploaded?.passed) return null;
      const irLoadId = ctx.load?.id;
      if (irLoadId) {
        try {
          const db = await getDb();
          if (db) {
            const [rows] = await db.execute(sql`
              SELECT id FROM documents
              WHERE load_id = ${irLoadId} AND type = 'inspection_report'
              LIMIT 1
            `) as unknown as RawQueryResult;
            if ((rows || []).length > 0) return null;
          }
        } catch { /* non-critical */ }
      }
      return guard.errorMessage;
    }

    // ── HOS enforcement at load assignment (Phase 3 — driver_hos_available) ──
    case "driver_hos_available": {
      if (!ctx.load?.driverId) return null;
      try {
        const { getHOSSummaryWithELD } = await import("../services/hosEngine");
        const hos = await getHOSSummaryWithELD(ctx.load.driverId);
        const drivingHoursRemaining = hos?.hoursAvailable?.driving || 0;
        const estDriveHours = (Number(ctx.load.distance) || 0) / 55; // avg 55 mph

        if (drivingHoursRemaining > 0 && estDriveHours > 0 && drivingHoursRemaining < estDriveHours) {
          return `Driver has ${Math.floor(drivingHoursRemaining)}h remaining but load requires ~${Math.floor(estDriveHours)}h. HOS violation risk.`;
        }
        if (hos?.violations && hos.violations.length > 0) {
          return `Driver has ${hos.violations.length} active HOS violation(s).`;
        }
      } catch {
        // HOS check failed — allow assignment but log
        logger.warn(`[Guard] driver_hos_available check failed for driver ${ctx.load.driverId}, allowing assignment`);
      }
      return null;
    }

    default:
      // In production, unknown guards block to prevent unchecked transitions
      logger.warn(`[Guard] Unknown guard check: ${guard.check}`);
      return IS_PROD ? guard.errorMessage : null;
  }
}

/** Parse lat/lng from a location object (handles various DB shapes) */
function parseLocation(loc: any): { lat: number; lng: number } | null {
  if (!loc) return null;
  if (typeof loc.lat === "number" && typeof loc.lng === "number") return loc;
  if (typeof loc.latitude === "number" && typeof loc.longitude === "number") {
    return { lat: loc.latitude, lng: loc.longitude };
  }
  // Try parsing coordinates string "lat,lng"
  if (typeof loc.coordinates === "string") {
    const [lat, lng] = loc.coordinates.split(",").map(Number);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// GPS GEOTAG — Immutable audit trail on every transition
// ═══════════════════════════════════════════════════════════════

async function geotagTransition(
  loadId: number, userId: number, userRole: string,
  fromState: string, toState: string, transitionId: string,
  location?: { lat: number; lng: number },
  load?: any, metadata?: Record<string, unknown>,
): Promise<number | null> {
  try {
    const lat = location?.lat ?? 0;
    const lng = location?.lng ?? 0;
    if (lat === 0 && lng === 0) return null; // No GPS — still audit-log the transition, just no geotag

    return await createGeotag({
      loadId,
      userId,
      userRole,
      driverId: load?.driverId || undefined,
      vehicleId: load?.vehicleId || undefined,
      eventType: `lifecycle_${toState.toLowerCase()}`,
      eventCategory: "load_lifecycle",
      lat,
      lng,
      timestamp: new Date(),
      source: "system",
      loadState: toState,
      metadata: {
        transitionId,
        fromState,
        toState,
        cargoType: load?.cargoType || null,
        hazmatClass: load?.hazmatClass || null,
        isInterstate: detectInterstate(load),
        ...metadata,
      },
    });
  } catch (e) {
    logger.warn(`[LoadLifecycle] Geotag error for ${transitionId}:`, (e as Error).message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// INTERSTATE / INTRASTATE DETECTION
// ═══════════════════════════════════════════════════════════════

function detectInterstate(load: any): boolean {
  if (!load) return false;
  const pickupState = load.pickupLocation?.state?.toUpperCase?.();
  const deliveryState = load.deliveryLocation?.state?.toUpperCase?.();
  if (!pickupState || !deliveryState) return true; // Assume interstate if unknown
  return pickupState !== deliveryState;
}

function getOperatingStates(load: any): string[] {
  const states = new Set<string>();
  const p = load?.pickupLocation?.state?.toUpperCase?.();
  const d = load?.deliveryLocation?.state?.toUpperCase?.();
  if (p) states.add(p);
  if (d) states.add(d);
  return Array.from(states);
}

// ═══════════════════════════════════════════════════════════════
// SERVER-SIDE HOS VERIFICATION
// ═══════════════════════════════════════════════════════════════

function verifyHOSServerSide(driverId: number | null | undefined): { compliant: boolean; reason?: string } {
  if (!driverId) return { compliant: true }; // No driver assigned yet — pass
  try {
    const summary = getHOSSummary(driverId);
    if (!summary.canDrive) {
      const reasons: string[] = [];
      if (summary.hoursAvailable.driving < 1) reasons.push(`Only ${summary.drivingRemaining} driving time left`);
      if (summary.hoursAvailable.onDuty < 1) reasons.push(`Only ${summary.onDutyRemaining} on-duty time left`);
      if (summary.breakRequired) reasons.push("30-minute break required (49 CFR 395.3)");
      const activeViolations = summary.violations.filter(v => v.severity === "violation");
      if (activeViolations.length > 0) reasons.push(activeViolations.map(v => v.description).join("; "));
      return { compliant: false, reason: reasons.join("; ") || "HOS limits exceeded" };
    }
    return { compliant: true };
  } catch (e) {
    logger.error(`[HOS] Server-side HOS verification failed for driver ${driverId}:`, (e as Error).message);
    return { compliant: false, reason: "HOS verification unavailable — cannot confirm compliance" };
  }
}

function verifyHOSForAcceptance(driverId: number | null | undefined): { allowed: boolean; reason?: string } {
  if (!driverId) return { allowed: true };
  try {
    const result = canDriverAcceptLoad(driverId);
    return { allowed: unsafeCast(result).allowed, reason: unsafeCast(result).reason };
  } catch (e) {
    logger.error(`[HOS] Acceptance verification failed for driver ${driverId}:`, (e as Error).message);
    return { allowed: false, reason: "HOS verification unavailable — cannot confirm driver eligibility" };
  }
}

// ═══════════════════════════════════════════════════════════════
// CARGO-AWARE COMPLIANCE GUARDS
// ═══════════════════════════════════════════════════════════════

// Cargo type families for guard evaluation
const TANKER_CARGO = new Set(["liquid", "gas", "chemicals", "petroleum"]);
const HAZMAT_CARGO = new Set(["hazmat", "chemicals", "petroleum", "gas"]);
const TEMP_CARGO = new Set(["refrigerated"]);
const OVERSIZE_CARGO = new Set(["oversized"]);

interface CargoProfile {
  cargoType: string;
  hazmatClass: string | null;
  isTanker: boolean;
  isHazmat: boolean;
  isReefer: boolean;
  isOversize: boolean;
  isInterstate: boolean;
  isLivestock: boolean;
  isAutoTransport: boolean;
  isIntermodal: boolean;
  isFlatbed: boolean;
  operatingStates: string[];
  vehicleType: string | null;
  complianceChecks: Record<string, { passed: boolean; userId?: number; timestamp?: string; notes?: string | null } | undefined>;
  /** @deprecated Use isReefer instead */
  isRefer: boolean;
}

function buildCargoProfile(load: any): CargoProfile {
  const ct = (load?.cargoType || "general").toLowerCase();
  const commodityName = (load?.commodityName || load?.commodity || "").toLowerCase();
  const trailerType = (load?.trailerType || load?.equipmentType || "").toLowerCase();

  const isTanker = TANKER_CARGO.has(ct) || trailerType.includes("tanker") || trailerType.includes("mc_") || trailerType.includes("mc-");
  const isHazmat = HAZMAT_CARGO.has(ct) || !!load?.hazmatClass;
  const isReefer = TEMP_CARGO.has(ct) || trailerType.includes("reefer") || trailerType.includes("refrigerated");
  const isOversize = OVERSIZE_CARGO.has(ct) || load?.requiresEscort === true;
  const isLivestock = ct === "livestock" || commodityName.includes("cattle") || commodityName.includes("livestock");
  const isAutoTransport = ct === "vehicles" || trailerType.includes("auto") || trailerType.includes("car_carrier");
  const isIntermodal = ct === "intermodal" || trailerType.includes("intermodal") || trailerType.includes("chassis");
  const isFlatbed = trailerType.includes("flatbed") || trailerType.includes("step_deck") || trailerType.includes("lowboy");

  // Read compliance checks from load.specialInstructions JSON
  let complianceChecks: Record<string, any> = {};
  try {
    const si = typeof load?.specialInstructions === "string"
      ? JSON.parse(load.specialInstructions || "{}")
      : (load?.specialInstructions || {});
    complianceChecks = si.complianceChecks || {};
  } catch { /* non-critical — specialInstructions may contain non-JSON content */ }

  return {
    cargoType: ct,
    hazmatClass: load?.hazmatClass || null,
    isTanker,
    isHazmat,
    isReefer,
    isRefer: isReefer, // backward compat alias
    isOversize,
    isLivestock,
    isAutoTransport,
    isIntermodal,
    isFlatbed,
    isInterstate: detectInterstate(load),
    operatingStates: getOperatingStates(load),
    vehicleType: null, // Resolved from vehicle table if needed
    complianceChecks,
  };
}

/**
 * Helper: check documents table for a matching document type on this load.
 * Returns true if at least one matching document is found.
 */
async function hasDocumentOfType(loadId: number | undefined, docType: string): Promise<boolean> {
  if (!loadId) return false;
  try {
    const db = await getDb();
    if (!db) return false;
    const [rows] = await db.execute(sql`
      SELECT id FROM documents
      WHERE load_id = ${loadId} AND type = ${docType}
      LIMIT 1
    `) as unknown as RawQueryResult;
    return (rows || []).length > 0;
  } catch { return false; }
}

async function evaluateCargoGuard(check: string, profile: CargoProfile, errorMessage: string, loadId?: number): Promise<string | null> {
  switch (check) {
    // ── Tanker-specific ──
    case "tanker_inspection_valid": {
      if (!profile.isTanker) return null;
      if (profile.complianceChecks?.tanker_inspection_valid?.passed) return null;
      if (await hasDocumentOfType(loadId, "tanker_inspection")) return null;
      return errorMessage;
    }
    case "vapor_recovery_valid": {
      if (!profile.isTanker || !HAZMAT_CARGO.has(profile.cargoType)) return null;
      if (profile.complianceChecks?.vapor_recovery_valid?.passed) return null;
      if (await hasDocumentOfType(loadId, "vapor_recovery")) return null;
      return errorMessage;
    }
    case "tank_washout_valid": {
      if (!profile.isTanker) return null;
      if (profile.complianceChecks?.tank_washout_valid?.passed) return null;
      if (await hasDocumentOfType(loadId, "tank_washout")) return null;
      return errorMessage;
    }
    case "tank_pressure_test": {
      if (!profile.isTanker) return null;
      if (profile.complianceChecks?.tank_pressure_test?.passed) return null;
      if (await hasDocumentOfType(loadId, "pressure_test")) return null;
      return errorMessage;
    }
    case "product_compatibility_verified": {
      if (!profile.isTanker) return null;
      if (profile.complianceChecks?.product_compatibility_verified?.passed) return null;
      return errorMessage;
    }
    case "tanker_endorsement_valid": {
      if (!profile.isTanker) return null;
      if (profile.complianceChecks?.tanker_endorsement_valid?.passed) return null;
      return errorMessage;
    }

    // ── Tanker vertical guards (v2.2) ──
    case "tanker_hose_inspection":
      if (!profile.isTanker) return null;
      return profile.complianceChecks?.tanker_hose_inspection?.passed ? null : errorMessage;
    case "tanker_compartment_segregation":
      if (!profile.isTanker) return null;
      return profile.complianceChecks?.tanker_compartment_segregation?.passed ? null : errorMessage;
    case "tanker_residual_handling":
      if (!profile.isTanker) return null;
      return profile.complianceChecks?.tanker_residual_handling?.passed ? null : errorMessage;

    // ── Hazmat-specific ──
    case "hazmat_placard_verified": {
      if (!profile.isHazmat) return null;
      if (profile.complianceChecks?.hazmat_placard_verified?.passed) return null;
      return errorMessage;
    }
    case "hazmat_shipping_papers": {
      if (!profile.isHazmat) return null;
      if (profile.complianceChecks?.hazmat_shipping_papers?.passed) return null;
      if (await hasDocumentOfType(loadId, "shipping_papers")) return null;
      return errorMessage;
    }
    case "hazmat_security_plan_active": {
      if (!profile.isHazmat) return null;
      if (profile.complianceChecks?.hazmat_security_plan_active?.passed) return null;
      return errorMessage;
    }
    case "hazmat_route_compliant": {
      if (!profile.isHazmat) return null;
      // Hazmat route compliance — route engine integration TBD
      if (profile.complianceChecks?.hazmat_route_compliant?.passed) return null;
      return errorMessage;
    }
    case "emergency_response_plan": {
      if (!profile.isHazmat) return null;
      if (profile.complianceChecks?.emergency_response_plan?.passed) return null;
      if (await hasDocumentOfType(loadId, "emergency_response")) return null;
      return errorMessage;
    }

    // ── Hazmat vertical guards (v2.2) ──
    case "hazmat_placard_photo":
      if (!profile.isHazmat) return null;
      return profile.complianceChecks?.hazmat_placard_photo?.passed ? null : errorMessage;
    case "hazmat_loading_sequence":
      if (!profile.isHazmat) return null;
      return profile.complianceChecks?.hazmat_loading_sequence?.passed ? null : errorMessage;
    case "hazmat_decontamination":
      if (!profile.isHazmat) return null;
      return profile.complianceChecks?.hazmat_decontamination?.passed ? null : errorMessage;

    // ── Reefer / Temperature-controlled ──
    case "reefer_temp_verified": {
      if (!profile.isReefer) return null;
      if (profile.complianceChecks?.reefer_temp_verified?.passed) return null;
      return errorMessage;
    }
    case "reefer_temp_set": {
      if (!profile.isReefer) return null;
      if (profile.complianceChecks?.reefer_temp_set?.passed) return null;
      return errorMessage;
    }
    case "reefer_pretrip_complete": {
      if (!profile.isReefer) return null;
      if (profile.complianceChecks?.reefer_pretrip_complete?.passed) return null;
      return errorMessage;
    }
    case "reefer_pre_cool_complete": {
      if (!profile.isReefer) return null;
      if (profile.complianceChecks?.reefer_pre_cool_complete?.passed) return null;
      return errorMessage;
    }
    case "continuous_temp_monitoring": {
      if (!profile.isReefer) return null;
      if (profile.complianceChecks?.continuous_temp_monitoring?.passed) return null;
      return errorMessage;
    }
    case "fsma_cert_valid": {
      if (!profile.isReefer && !profile.cargoType.includes("food")) return null;
      if (profile.complianceChecks?.fsma_cert_valid?.passed) return null;
      if (await hasDocumentOfType(loadId, "fsma_cert")) return null;
      return errorMessage;
    }

    // ── Reefer vertical guards (v2.2) ──
    case "reefer_precool_verified":
      if (!profile.isReefer) return null;
      return profile.complianceChecks?.reefer_precool_verified?.passed ? null : errorMessage;
    case "reefer_delivery_temp_verified":
      if (!profile.isReefer) return null;
      return profile.complianceChecks?.reefer_delivery_temp_verified?.passed ? null : errorMessage;
    case "cold_chain_declaration":
      if (!profile.isReefer) return null;
      return profile.complianceChecks?.cold_chain_declaration?.passed ? null : errorMessage;

    // ── Oversize ──
    case "oversize_permit_valid": {
      if (!profile.isOversize) return null;
      if (profile.complianceChecks?.oversize_permit_valid?.passed) return null;
      if (await hasDocumentOfType(loadId, "oversize_permit")) return null;
      return errorMessage;
    }
    case "escort_vehicle_confirmed": {
      if (!profile.isOversize) return null;
      if (profile.complianceChecks?.escort_vehicle_confirmed?.passed) return null;
      return errorMessage;
    }
    case "route_survey_complete": {
      if (!profile.isOversize) return null;
      if (profile.complianceChecks?.route_survey_complete?.passed) return null;
      return errorMessage;
    }

    // ── Flatbed / Oversize vertical guards (v2.2) ──
    case "flatbed_securement_verified":
      if (!profile.isFlatbed) return null;
      return profile.complianceChecks?.flatbed_securement_verified?.passed ? null : errorMessage;
    case "flatbed_dimension_verified":
      if (!profile.isFlatbed && !profile.isOversize) return null;
      return profile.complianceChecks?.flatbed_dimension_verified?.passed ? null : errorMessage;
    case "oversize_escort_confirmed":
      if (!profile.isOversize) return null;
      return profile.complianceChecks?.oversize_escort_confirmed?.passed ? null : errorMessage;

    // ── Livestock guards ──
    case "animal_welfare_check": {
      if (!profile.isLivestock) return null;
      if (profile.complianceChecks?.animal_welfare_check?.passed) return null;
      return errorMessage;
    }
    case "ventilation_verified": {
      if (!profile.isLivestock) return null;
      if (profile.complianceChecks?.ventilation_verified?.passed) return null;
      return errorMessage;
    }
    case "28hr_rule_compliant": {
      if (!profile.isLivestock) return null;
      if (profile.complianceChecks?.["28hr_rule_compliant"]?.passed) return null;
      return errorMessage;
    }

    // ── Livestock vertical guards (v2.2) ──
    case "livestock_welfare_check":
      if (!profile.isLivestock) return null;
      return profile.complianceChecks?.livestock_welfare_check?.passed ? null : errorMessage;
    case "livestock_ventilation_verified":
      if (!profile.isLivestock) return null;
      return profile.complianceChecks?.livestock_ventilation_verified?.passed ? null : errorMessage;
    case "livestock_28hr_plan":
      if (!profile.isLivestock) return null;
      return profile.complianceChecks?.livestock_28hr_plan?.passed ? null : errorMessage;
    case "livestock_count_verified":
      if (!profile.isLivestock) return null;
      return profile.complianceChecks?.livestock_count_verified?.passed ? null : errorMessage;

    // ── Auto Transport guards ──
    case "vehicle_inventory_complete": {
      if (!profile.isAutoTransport) return null;
      if (profile.complianceChecks?.vehicle_inventory_complete?.passed) return null;
      return errorMessage;
    }
    case "tie_down_inspection": {
      if (!profile.isAutoTransport) return null;
      if (profile.complianceChecks?.tie_down_inspection?.passed) return null;
      return errorMessage;
    }

    // ── Auto Transport vertical guards (v2.2) ──
    case "auto_vin_verified":
      if (!profile.isAutoTransport) return null;
      return profile.complianceChecks?.auto_vin_verified?.passed ? null : errorMessage;
    case "auto_condition_documented":
      if (!profile.isAutoTransport) return null;
      return profile.complianceChecks?.auto_condition_documented?.passed ? null : errorMessage;
    case "auto_tiedown_verified":
      if (!profile.isAutoTransport) return null;
      return profile.complianceChecks?.auto_tiedown_verified?.passed ? null : errorMessage;

    // ── Intermodal guards ──
    case "chassis_inspection_valid": {
      if (!profile.isIntermodal) return null;
      if (profile.complianceChecks?.chassis_inspection_valid?.passed) return null;
      if (await hasDocumentOfType(loadId, "chassis_inspection")) return null;
      return errorMessage;
    }

    // ── Intermodal vertical guards (v2.2) ──
    case "intermodal_twistlock_verified":
      if (!profile.isIntermodal) return null;
      return profile.complianceChecks?.intermodal_twistlock_verified?.passed ? null : errorMessage;
    case "intermodal_vgm_verified":
      if (!profile.isIntermodal) return null;
      return profile.complianceChecks?.intermodal_vgm_verified?.passed ? null : errorMessage;

    // ── Interstate compliance ──
    case "ifta_valid": {
      if (!profile.isInterstate) return null;
      if (profile.complianceChecks?.ifta_valid?.passed) return null;
      if (await hasDocumentOfType(loadId, "ifta_cert")) return null;
      return errorMessage;
    }
    case "irp_valid": {
      if (!profile.isInterstate) return null;
      if (profile.complianceChecks?.irp_valid?.passed) return null;
      if (await hasDocumentOfType(loadId, "irp_cert")) return null;
      return errorMessage;
    }

    // ── State-specific ──
    case "carb_compliant": {
      if (!profile.operatingStates.includes("CA")) return null;
      if (profile.complianceChecks?.carb_compliant?.passed) return null;
      if (await hasDocumentOfType(loadId, "carb_compliance")) return null;
      return errorMessage;
    }
    case "weight_distance_tax": {
      if (!profile.operatingStates.some(s => ["OR", "NM", "NY", "KY"].includes(s))) return null;
      if (profile.complianceChecks?.weight_distance_tax?.passed) return null;
      if (await hasDocumentOfType(loadId, "weight_distance_tax")) return null;
      return errorMessage;
    }

    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// LOAD COMPLIANCE SNAPSHOT
// ═══════════════════════════════════════════════════════════════

async function captureComplianceSnapshot(loadId: number, load: any) {
  try {
    const db = await getDb();
    if (!db) return;

    const profile = buildCargoProfile(load);
    const snapshot: Record<string, unknown> = {
      capturedAt: new Date().toISOString(),
      cargoType: profile.cargoType,
      hazmatClass: profile.hazmatClass,
      isTanker: profile.isTanker,
      isHazmat: profile.isHazmat,
      isReefer: profile.isReefer,
      isRefer: profile.isReefer, // backward compat
      isOversize: profile.isOversize,
      isLivestock: profile.isLivestock,
      isAutoTransport: profile.isAutoTransport,
      isIntermodal: profile.isIntermodal,
      isFlatbed: profile.isFlatbed,
      isInterstate: profile.isInterstate,
      operatingStates: profile.operatingStates,
      pickupState: load?.pickupLocation?.state || null,
      deliveryState: load?.deliveryLocation?.state || null,
    };

    // Resolve trailer type from vehicle if assigned
    if (load?.vehicleId) {
      try {
        const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, load.vehicleId)).limit(1);
        if (vehicle) {
          snapshot.vehicleType = vehicle.vehicleType || null;
          snapshot.vehicleVin = vehicle.vin || null;
        }
      } catch { /* non-critical */ }
    }

    // Run compliance matrix if we have enough info
    const trailerTypes: string[] = [];
    if (snapshot.vehicleType) trailerTypes.push(String(snapshot.vehicleType));
    if (profile.isTanker && trailerTypes.length === 0) trailerTypes.push("liquid_tank");
    if (profile.isRefer && trailerTypes.length === 0) trailerTypes.push("reefer");
    if (profile.isOversize && trailerTypes.length === 0) trailerTypes.push("flatbed");

    const products: string[] = [];
    if (profile.cargoType === "petroleum") products.push("crude_oil");
    if (profile.cargoType === "chemicals") products.push("chemicals");
    if (profile.cargoType === "gas") products.push("lpg");
    if (profile.cargoType === "refrigerated") products.push("produce");

    if (trailerTypes.length > 0 || products.length > 0) {
      const matrixResult = resolveComplianceMatrix({ trailerTypes, products });
      snapshot.requiredDocuments = matrixResult.map(r => ({
        documentTypeId: r.rule.documentTypeId,
        priority: r.rule.priority,
        status: r.rule.status,
        reason: r.rule.reason,
        group: r.rule.group,
      }));
      snapshot.requiredEndorsements = Array.from(
        new Set(matrixResult.flatMap(r => r.rule.endorsements || []))
      );
    }

    // Store snapshot in load metadata
    await db.execute(sql`
      UPDATE loads SET specialInstructions = CONCAT(
        COALESCE(specialInstructions, ''),
        '\n[COMPLIANCE_SNAPSHOT ', ${new Date().toISOString()}, '] ',
        ${JSON.stringify(snapshot)}
      ) WHERE id = ${loadId}
    `);

    logger.info(`[LoadLifecycle] Compliance snapshot captured for load ${loadId}: ${profile.isInterstate ? "INTERSTATE" : "INTRASTATE"}, cargo=${profile.cargoType}`);
  } catch (e) {
    logger.warn(`[LoadLifecycle] Compliance snapshot error for load ${loadId}:`, (e as Error).message);
  }
}

// ═══════════════════════════════════════════════════════════════
// EFFECT EXECUTION
// ═══════════════════════════════════════════════════════════════

async function executeFinancialEffect(action: string, loadId: number, ctx: any) {
  try {
    // Resolve cargo type for cargo-specific timer configs
    let cargoType: string | undefined;
    if (["start_detention_timer", "start_demurrage_timer"].includes(action)) {
      const db = await getDb();
      if (db) {
        const [load] = await db.select({ cargoType: loads.cargoType }).from(loads).where(eq(loads.id, loadId)).limit(1);
        cargoType = load?.cargoType;
      }
    }

    switch (action) {
      case "start_detention_timer": {
        const cfg = getTimerConfigForCargo("DETENTION", cargoType);
        await startTimer(loadId, "DETENTION", cfg);
        break;
      }
      case "stop_detention_timer": {
        const timers = await getFinancialTimers(loadId);
        const detention = timers.find(t => t.type === "DETENTION");
        if (detention) await stopTimer(detention.id);
        break;
      }
      case "start_demurrage_timer": {
        const cfg2 = getTimerConfigForCargo("DEMURRAGE", cargoType);
        await startTimer(loadId, "DEMURRAGE", cfg2);
        break;
      }
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
      case "start_pump_timer":
        await startTimer(loadId, "PUMP_TIME");
        break;
      case "stop_pump_timer": {
        const timers4 = await getFinancialTimers(loadId);
        const pump = timers4.find(t => t.type === "PUMP_TIME");
        if (pump) await stopTimer(pump.id);
        break;
      }
      case "start_blow_off_timer":
        await startTimer(loadId, "BLOW_OFF");
        break;
      case "stop_blow_off_timer": {
        const timers5 = await getFinancialTimers(loadId);
        const blowOff = timers5.find(t => t.type === "BLOW_OFF");
        if (blowOff) await stopTimer(blowOff.id);
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
        const loadAmount = parseFloat(String(load.rate || "0"));
        if (loadAmount > 0 && (action === "capture_escrow" || action === "process_settlement")) {
          const feeResult = await feeCalculator.calculateFee({
            userId: load.shipperId || 0,
            userRole: "SHIPPER",
            transactionType: "load_completion",
            amount: loadAmount,
            loadId,
          });
          await feeCalculator.recordFeeCollection(loadId, "load_completion", load.shipperId || 0, loadAmount, feeResult);
          logger.info(`[LoadLifecycle] ${action}: $${feeResult.finalFee.toFixed(2)} for load ${loadId}`);
        }
        break;
      }
      case "apply_cancellation_penalty": {
        // Phase 4.3 — Cancellation financial handling based on load status at time of cancellation
        const db = await getDb();
        if (!db) break;
        const [loadRows] = await db.execute(sql`SELECT status, rate, origin, destination, catalystId, driverId, hazmatClass, trailerType FROM loads WHERE id = ${loadId} LIMIT 1`) as unknown as RawQueryResult;
        const cancelLoad = (loadRows || [])[0];
        if (!cancelLoad) break;
        const cancelStatus = String(cancelLoad.status || "");
        const cancelRate = parseFloat(String(cancelLoad.rate || "0"));
        const cancelCarrierId = Number(cancelLoad.catalystId || cancelLoad.driverId || 0);

        // Pre-award: no financial impact
        if (["draft", "posted", "bidding"].includes(cancelStatus)) {
          logger.info(`[Cancellation] Load ${loadId} cancelled pre-award — no financial impact`);
          break;
        }

        // Post-award, pre-transit: TONU (Truck On Not Used) if carrier was confirmed
        if (["awarded", "accepted", "assigned", "confirmed"].includes(cancelStatus)) {
          const isConfirmed = cancelStatus === "confirmed";
          const tonuAmount = isConfirmed ? Math.max(cancelRate * 0.25, 250) : 0; // 25% or $250 minimum if confirmed
          if (tonuAmount > 0 && cancelCarrierId) {
            try {
              await db.execute(sql`
                INSERT INTO accessorial_charges (loadId, type, amount, status, description, createdAt)
                VALUES (${loadId}, 'TONU', ${tonuAmount.toFixed(2)}, 'auto_approved', ${`TONU — Load cancelled at ${cancelStatus} status`}, NOW())
              `);
              // Credit TONU to carrier wallet
              const [wRows] = await db.execute(sql`SELECT id FROM wallets WHERE userId = ${cancelCarrierId} LIMIT 1`) as unknown as RawQueryResult;
              const wallet = (wRows || [])[0];
              if (wallet) {
                await db.execute(sql`UPDATE wallets SET availableBalance = availableBalance + ${tonuAmount.toFixed(2)}, totalReceived = totalReceived + ${tonuAmount.toFixed(2)} WHERE id = ${wallet.id}`);
                await db.execute(sql`
                  INSERT INTO wallet_transactions (walletId, type, amount, fee, netAmount, currency, status, description, loadId, completedAt)
                  VALUES (${wallet.id}, 'earnings', ${tonuAmount.toFixed(2)}, '0.00', ${tonuAmount.toFixed(2)}, 'USD', 'completed', ${`TONU — Load #${loadId} cancelled`}, ${loadId}, NOW())
                `);
              }
              logger.info(`[Cancellation] Load ${loadId} TONU: $${tonuAmount.toFixed(2)} credited to carrier ${cancelCarrierId}`);
            } catch (tonuErr: any) {
              logger.error(`[Cancellation] TONU effect FAILED for load ${loadId} (status=${cancelStatus}, amount=$${tonuAmount.toFixed(2)}, carrier=${cancelCarrierId}):`, tonuErr?.message);
              // Record failed effect for admin review
              try {
                await db.execute(sql`
                  INSERT INTO system_alerts (type, severity, title, message, metadata, created_at)
                  VALUES ('failed_financial_effect', 'critical', ${`TONU payment failed — Load #${loadId}`},
                    ${`TONU of $${tonuAmount.toFixed(2)} could not be credited to carrier ${cancelCarrierId}. Manual intervention required. Error: ${tonuErr?.message}`},
                    ${JSON.stringify({ loadId, effectType: 'TONU', amount: tonuAmount, carrierId: cancelCarrierId, cancelStatus, error: tonuErr?.message })},
                    NOW())
                `);
              } catch { /* alert insert best-effort */ }
              // Notify admin/dispatch via WebSocket
              try {
                const { getIO } = await import("../services/socketService");
                const io = getIO();
                if (io) {
                  io.to("role:ADMIN").to("role:DISPATCH").emit("system:alert", {
                    type: "failed_financial_effect",
                    severity: "critical",
                    title: `TONU payment failed — Load #${loadId}`,
                    message: `$${tonuAmount.toFixed(2)} TONU could not be credited to carrier ${cancelCarrierId}. Manual intervention required.`,
                    loadId,
                    timestamp: new Date().toISOString(),
                  });
                }
              } catch { /* ws notification best-effort */ }
            }
          }
          break;
        }

        // En-route to pickup or at pickup: TONU + deadhead estimate
        if (["en_route_pickup", "at_pickup"].includes(cancelStatus)) {
          const tonuBase = Math.max(cancelRate * 0.30, 350); // 30% or $350 minimum
          const deadheadEstimate = 75; // flat deadhead allowance
          const totalTonu = tonuBase + deadheadEstimate;
          if (cancelCarrierId) {
            try {
              await db.execute(sql`
                INSERT INTO accessorial_charges (loadId, type, amount, status, description, createdAt)
                VALUES (${loadId}, 'TONU', ${totalTonu.toFixed(2)}, 'auto_approved', ${`TONU + deadhead — Load cancelled at ${cancelStatus}`}, NOW())
              `);
              const [wRows] = await db.execute(sql`SELECT id FROM wallets WHERE userId = ${cancelCarrierId} LIMIT 1`) as unknown as RawQueryResult;
              const wallet = (wRows || [])[0];
              if (wallet) {
                await db.execute(sql`UPDATE wallets SET availableBalance = availableBalance + ${totalTonu.toFixed(2)}, totalReceived = totalReceived + ${totalTonu.toFixed(2)} WHERE id = ${wallet.id}`);
                await db.execute(sql`
                  INSERT INTO wallet_transactions (walletId, type, amount, fee, netAmount, currency, status, description, loadId, completedAt)
                  VALUES (${wallet.id}, 'earnings', ${totalTonu.toFixed(2)}, '0.00', ${totalTonu.toFixed(2)}, 'USD', 'completed', ${`TONU+Deadhead — Load #${loadId} cancelled`}, ${loadId}, NOW())
                `);
              }
              logger.info(`[Cancellation] Load ${loadId} TONU+Deadhead: $${totalTonu.toFixed(2)} credited to carrier ${cancelCarrierId}`);
            } catch (tonuErr: any) {
              logger.error(`[Cancellation] TONU+Deadhead effect FAILED for load ${loadId} (status=${cancelStatus}, amount=$${totalTonu.toFixed(2)}, carrier=${cancelCarrierId}):`, tonuErr?.message);
              try {
                await db.execute(sql`
                  INSERT INTO system_alerts (type, severity, title, message, metadata, created_at)
                  VALUES ('failed_financial_effect', 'critical', ${`TONU+Deadhead payment failed — Load #${loadId}`},
                    ${`TONU+Deadhead of $${totalTonu.toFixed(2)} could not be credited to carrier ${cancelCarrierId}. Manual intervention required. Error: ${tonuErr?.message}`},
                    ${JSON.stringify({ loadId, effectType: 'TONU_DEADHEAD', amount: totalTonu, carrierId: cancelCarrierId, cancelStatus, error: tonuErr?.message })},
                    NOW())
                `);
              } catch { /* alert insert best-effort */ }
              try {
                const { getIO } = await import("../services/socketService");
                const io = getIO();
                if (io) {
                  io.to("role:ADMIN").to("role:DISPATCH").emit("system:alert", {
                    type: "failed_financial_effect",
                    severity: "critical",
                    title: `TONU+Deadhead payment failed — Load #${loadId}`,
                    message: `$${totalTonu.toFixed(2)} could not be credited to carrier ${cancelCarrierId}. Manual intervention required.`,
                    loadId,
                    timestamp: new Date().toISOString(),
                  });
                }
              } catch { /* ws notification best-effort */ }
            }
          }
          break;
        }

        // In-transit or transit_hold: partial rate based on estimated completion
        if (["in_transit", "transit_hold", "loading", "loaded"].includes(cancelStatus)) {
          const partialPercent = cancelStatus === "in_transit" ? 0.60 : cancelStatus === "loaded" ? 0.50 : 0.40;
          const partialRate = cancelRate * partialPercent;
          if (cancelCarrierId && partialRate > 0) {
            try {
              // Create partial settlement
              await db.execute(sql`
                INSERT INTO settlements (loadId, shipperId, carrierId, loadRate, platformFeePercent, platformFeeAmount, carrierPayment, totalShipperCharge, status)
                VALUES (${loadId}, ${cancelLoad.shipperId || 0}, ${cancelCarrierId}, ${cancelRate.toFixed(2)}, '5.00', ${(partialRate * 0.05).toFixed(2)}, ${(partialRate * 0.95).toFixed(2)}, ${partialRate.toFixed(2)}, 'partial_cancellation')
              `);
              const netPay = partialRate * 0.95;
              const [wRows] = await db.execute(sql`SELECT id FROM wallets WHERE userId = ${cancelCarrierId} LIMIT 1`) as unknown as RawQueryResult;
              const wallet = (wRows || [])[0];
              if (wallet) {
                await db.execute(sql`UPDATE wallets SET availableBalance = availableBalance + ${netPay.toFixed(2)}, totalReceived = totalReceived + ${netPay.toFixed(2)} WHERE id = ${wallet.id}`);
                await db.execute(sql`
                  INSERT INTO wallet_transactions (walletId, type, amount, fee, netAmount, currency, status, description, loadId, completedAt)
                  VALUES (${wallet.id}, 'earnings', ${netPay.toFixed(2)}, ${(partialRate * 0.05).toFixed(2)}, ${netPay.toFixed(2)}, 'USD', 'completed', ${`Partial settlement (${Math.round(partialPercent * 100)}%) — Load #${loadId} cancelled in transit`}, ${loadId}, NOW())
                `);
              }
              logger.info(`[Cancellation] Load ${loadId} partial rate (${Math.round(partialPercent * 100)}%): $${netPay.toFixed(2)} credited to carrier ${cancelCarrierId}`);
            } catch (partErr: any) {
              logger.error(`[Cancellation] Partial settlement effect FAILED for load ${loadId} (${Math.round(partialPercent * 100)}%, amount=$${partialRate.toFixed(2)}, carrier=${cancelCarrierId}):`, partErr?.message);
              try {
                const pDb = await getDb();
                if (pDb) {
                  await pDb.execute(sql`
                    INSERT INTO system_alerts (type, severity, title, message, metadata, created_at)
                    VALUES ('failed_financial_effect', 'high', ${`Partial settlement failed — Load #${loadId}`},
                      ${`Partial settlement of $${partialRate.toFixed(2)} (${Math.round(partialPercent * 100)}%) could not be processed for carrier ${cancelCarrierId}. Error: ${partErr?.message}`},
                      ${JSON.stringify({ loadId, effectType: 'PARTIAL_SETTLEMENT', amount: partialRate, percent: partialPercent, carrierId: cancelCarrierId, error: partErr?.message })},
                      NOW())
                  `);
                }
              } catch { /* alert insert best-effort */ }
            }
          }
          break;
        }
        logger.info(`[Cancellation] Load ${loadId} cancelled at status ${cancelStatus} — no additional penalty logic`);
        break;
      }
      case "release_escrow": {
        // Release any held escrow amounts back to shipper
        const escDb = await getDb();
        if (!escDb) break;
        try {
          // Check for escrow holds on this load
          const [escRows] = await escDb.execute(sql`
            SELECT id, amount, walletId FROM wallet_transactions
            WHERE loadId = ${loadId} AND type = 'escrow_hold' AND status = 'pending'
          `) as unknown as RawQueryResult;
          for (const esc of (escRows || [])) {
            await escDb.execute(sql`UPDATE wallet_transactions SET status = 'released', completedAt = NOW() WHERE id = ${esc.id}`);
            if (esc.walletId && esc.amount) {
              await escDb.execute(sql`UPDATE wallets SET reservedBalance = reservedBalance - ${esc.amount}, availableBalance = availableBalance + ${esc.amount} WHERE id = ${esc.walletId}`);
            }
          }
          if ((escRows || []).length > 0) {
            logger.info(`[Escrow] Released ${(escRows || []).length} escrow hold(s) for load ${loadId}`);
          }
        } catch (escErr: any) {
          logger.error(`[Escrow] Release effect FAILED for load ${loadId}:`, escErr?.message);
          try {
            await escDb.execute(sql`
              INSERT INTO system_alerts (type, severity, title, message, metadata, created_at)
              VALUES ('failed_financial_effect', 'critical', ${`Escrow release failed — Load #${loadId}`},
                ${`Escrow holds could not be released for load ${loadId}. Shipper funds may remain locked. Manual intervention required. Error: ${escErr?.message}`},
                ${JSON.stringify({ loadId, effectType: 'ESCROW_RELEASE', error: escErr?.message })},
                NOW())
            `);
          } catch { /* alert insert best-effort */ }
          // Notify admin/dispatch — escrow release failures need immediate attention
          try {
            const { getIO } = await import("../services/socketService");
            const io = getIO();
            if (io) {
              io.to("role:ADMIN").to("role:DISPATCH").emit("system:alert", {
                type: "failed_financial_effect",
                severity: "critical",
                title: `Escrow release failed — Load #${loadId}`,
                message: `Escrow holds could not be released. Shipper funds may remain locked. Manual intervention required.`,
                loadId,
                timestamp: new Date().toISOString(),
              });
            }
          } catch { /* ws notification best-effort */ }
        }
        break;
      }
      case "start_tracking":
      case "create_rate_confirmation":
        logger.info(`[LoadLifecycle] Financial effect: ${action} for load ${loadId}`);
        break;
      default:
        break;
    }
  } catch (e) {
    logger.error(`[LoadLifecycle] Financial effect FAILED (${action}) for load ${loadId}:`, (e as Error).message);
    try {
      const alertDb = await getDb();
      if (alertDb) {
        await alertDb.execute(sql`
          INSERT INTO system_alerts (type, severity, title, message, metadata, created_at)
          VALUES ('failed_financial_effect', 'high', ${`Financial effect failed: ${action} — Load #${loadId}`},
            ${`Effect "${action}" failed for load ${loadId}. Error: ${(e as Error).message}`},
            ${JSON.stringify({ loadId, effectType: action, error: (e as Error).message })},
            NOW())
        `);
      }
    } catch { /* alert insert best-effort */ }
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
    const pts = (trail as unknown as RawQueryResult)[0] || [];
    if (pts.length < 2) return;

    const first = pts[0];
    const last = pts[pts.length - 1];
    const speeds = pts.filter((p: RawRow) => p.speed).map((p: RawRow) => Number(p.speed));
    const avgSpd = speeds.length > 0 ? speeds.reduce((a: number, b: number) => a + b, 0) / speeds.length : null;
    const maxSpd = speeds.length > 0 ? Math.max(...speeds) : null;
    const startTime = new Date(String(first.device_timestamp));
    const endTime = new Date(String(last.device_timestamp));
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
              ${pts.filter((p: RawRow, i: number) => i > 0 && Number(p.speed || 0) < 2).length},
              0,
              ${startTime.toISOString()}, ${endTime.toISOString()})
    `);
    logger.info(`[LoadLifecycle] Route report: ${pts.length} GPS points, ${dist.toFixed(1)}mi for load ${loadId}`);
  } catch (e) {
    logger.error(`[LoadLifecycle] Route report effect FAILED for load ${loadId}:`, (e as Error).message);
    try {
      const alertDb = await getDb();
      if (alertDb) {
        await alertDb.execute(sql`
          INSERT INTO system_alerts (type, severity, title, message, metadata, created_at)
          VALUES ('failed_financial_effect', 'medium', ${`Route report generation failed — Load #${loadId}`},
            ${`Route report could not be generated for load ${loadId}. Error: ${(e as Error).message}`},
            ${JSON.stringify({ loadId, effectType: 'route_report', driverId: userId, error: (e as Error).message })},
            NOW())
        `);
      }
    } catch { /* alert insert best-effort */ }
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
    logger.error(`[LoadLifecycle] Audit log effect FAILED for load ${loadId} (${fromState} → ${toState}):`, (e as Error).message);
    try {
      const alertDb = await getDb();
      if (alertDb) {
        await alertDb.execute(sql`
          INSERT INTO system_alerts (type, severity, title, message, metadata, created_at)
          VALUES ('failed_financial_effect', 'medium', ${`Audit log failed — Load #${loadId}`},
            ${`State transition audit log (${fromState} → ${toState}) could not be recorded for load ${loadId}. Error: ${(e as Error).message}`},
            ${JSON.stringify({ loadId, effectType: 'audit_log', fromState, toState, transitionId: transition.id, error: (e as Error).message })},
            NOW())
        `);
      }
    } catch { /* alert insert best-effort */ }
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

      const currentState = (load.status || "draft").toUpperCase() as LoadState;
      const userRole = (ctx.user?.role || "DRIVER").toUpperCase() as UserRole;
      const transitions = getTransitionsFrom(currentState);

      const filtered = transitions.filter(t => t.actor.includes(userRole) || userRole === "ADMIN" || userRole === "SUPER_ADMIN");
      return Promise.all(filtered.map(async t => {
          const guardErrors: string[] = [];
          for (const g of t.guards) {
            const err = await evaluateGuard(g, { load, complianceChecks: {}, metadata: {} });
            if (err) guardErrors.push(err);
          }
          return {
            transitionId: t.id,
            to: t.to,
            toMeta: t.to === "__previous_state__" ? undefined : STATE_METADATA[t.to as LoadState],
            trigger: t.trigger,
            uiAction: t.uiAction,
            canExecute: guardErrors.length === 0,
            blockedReasons: guardErrors,
          };
        }));
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
        return (((rows as unknown as RawQueryResult)[0]) || []).map((r: RawRow) => ({
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
          createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
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
      for (const t of transitions) { if (t.to !== "__previous_state__" && !seen.has(t.to)) { seen.add(t.to); uniqueStates.push(t.to as LoadState); } }
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

      const currentState = (load.status || "draft").toUpperCase() as LoadState;
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
        targetLocation: input.targetLocation || load.pickupLocation || load.deliveryLocation || undefined,
        complianceChecks: input.complianceChecks || {},
        metadata: input.metadata || {},
        data: input.data || {},
      };
      const errors: string[] = [];
      const guardsPassed: string[] = [];
      for (const g of transition.guards) {
        const err = await evaluateGuard(g, guardCtx);
        if (err) errors.push(err);
        else guardsPassed.push(g.check);
      }

      if (errors.length > 0) {
        await logTransition(numericLoadId, currentState, transition.to, transition, ctx.user?.id || 0, userRole, guardsPassed, [], input.metadata, false, errors.join("; "));
        return { success: false, errors, step: "GUARD_VALIDATION" };
      }

      // Resolve __previous_state__ sentinel for ON_HOLD release
      let resolvedTo: string = transition.to;
      if (transition.to === "__previous_state__") {
        const prevStateRow = await db.execute(sql`SELECT previous_state FROM loads WHERE id = ${numericLoadId}`);
        const rawResult = prevStateRow as unknown as RawQueryResult;
        const prevRows = rawResult?.[0] || (rawResult as unknown as { rows?: RawRow[] })?.rows || [];
        const prevState = prevRows[0]?.previous_state;
        resolvedTo = prevState ? String(prevState).toUpperCase() : "IN_TRANSIT";
        logger.info(`[LoadLifecycle] ON_HOLD release: restoring to previous state "${resolvedTo}"`);
      }

      // Update load status in DB
      const newStatusLower = resolvedTo.toLowerCase();
      try {
        await db.execute(sql`UPDATE loads SET status = ${newStatusLower}, updatedAt = NOW() WHERE id = ${numericLoadId}`);
      } catch (dbErr) {
        return { success: false, error: `DB update failed: ${(dbErr as Error).message}` };
      }

      // ── NOTIFICATION DISPATCH — in-app + WebSocket after successful status update ──
      try {
        const [loadData] = await db.select({
          shipperId: loads.shipperId,
          catalystId: loads.catalystId,
          driverId: loads.driverId,
          loadNumber: loads.loadNumber,
        }).from(loads).where(eq(loads.id, numericLoadId)).limit(1);
        await emitLoadNotifications(numericLoadId, newStatusLower, loadData || {});
      } catch (notifErr) {
        logger.warn("[LoadLifecycle] Notification dispatch error:", (notifErr as Error).message);
      }

      // ── CHAIN OF CUSTODY — record cargo transfer from shipper to driver on LOADED ──
      if (resolvedTo === 'LOADED') {
        try {
          await db.insert(custodyTransfers).values({
            loadId: numericLoadId,
            transportMode: 'TRUCK',
            sequenceNumber: 1,
            fromPartyRole: 'SHIPPER',
            fromPartyUserId: load.shipperId,
            toPartyRole: 'DRIVER',
            toPartyUserId: load.driverId,
            transferredAt: new Date(),
            cargoCondition: 'good',
            sealIntact: true,
          });
        } catch (custodyErr) {
          logger.warn('[Custody] Failed to record transfer:', custodyErr);
        }
      }

      // Cascade on cancellation
      if (resolvedTo === 'CANCELLED') {
        try {
          // Cancel pending bids
          await db.execute(sql`UPDATE bids SET status = 'cancelled', updatedAt = NOW() WHERE loadId = ${numericLoadId} AND status IN ('pending','submitted')`);
          // Deactivate geofences
          await db.execute(sql`UPDATE geofences SET isActive = false WHERE loadId = ${numericLoadId}`);
          // Void documents
          await db.execute(sql`UPDATE documents SET status = 'voided' WHERE loadId = ${numericLoadId} AND type IN ('bol','rate_confirmation')`);
          logger.info(`[LoadCancel] Cascaded cancellation for load ${numericLoadId}`);
        } catch (cascadeErr) {
          logger.warn(`[LoadCancel] Cascade partial failure for load ${numericLoadId}:`, cascadeErr);
        }
      }

      // If ON_HOLD, save previous state
      if (resolvedTo === "ON_HOLD") {
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
          logger.warn(`[LoadLifecycle] Effect error (${effect.action}):`, (effErr as Error).message);
          effectsExecuted.push(`${effect.type}:${effect.action}:FAILED`);
        }
      }

      // Route intelligence on DELIVERED
      if (resolvedTo === "DELIVERED") {
        await generateRouteReport(numericLoadId, ctx.user?.id || 0);

        // ── SETTLEMENT AUTOMATION — with accessorials, hazmat surcharge, and carrier wallet credit ──
        try {
          const _sDb = await getDb();
          if (_sDb && load) {
            const loadRate = parseFloat(load.rate || "0");
            if (loadRate > 0) {
              const carrierId = load.catalystId || load.driverId || 0;

              // 1. Calculate accessorial charges (detention, demurrage)
              let accessorialTotal = 0;
              try {
                const [accRows] = await _sDb.execute(sql`
                  SELECT type, amount, status FROM accessorial_charges
                  WHERE loadId = ${numericLoadId} AND status IN ('approved', 'auto_approved')
                `) as unknown as RawQueryResult;
                for (const acc of (accRows || [])) {
                  accessorialTotal += parseFloat(String(acc.amount || "0"));
                }
              } catch { /* accessorial_charges table may not exist yet */ }

              // 2. Calculate hazmat surcharge from platform_fee_configs table
              let hazmatSurcharge = 0;
              if (load.hazmatClass) {
                try {
                  const [feeRows] = await _sDb.execute(sql`
                    SELECT flatAmount, baseRate FROM platform_fee_configs
                    WHERE feeCode = 'HAZMAT_SURCHARGE' AND isActive = true
                      AND (effectiveFrom IS NULL OR effectiveFrom <= NOW())
                      AND (effectiveTo IS NULL OR effectiveTo >= NOW())
                    LIMIT 1
                  `) as unknown as RawQueryResult;
                  const hazFee = (feeRows || [])[0];
                  if (hazFee) {
                    hazmatSurcharge = parseFloat(String(hazFee.flatAmount || "0"));
                    if (hazFee.baseRate && parseFloat(String(hazFee.baseRate)) > 0) {
                      hazmatSurcharge += loadRate * (parseFloat(String(hazFee.baseRate)) / 100);
                    }
                  }
                } catch { /* platform_fee_configs table may not exist yet */ }
              }

              // 3. Calculate platform commission fee
              const totalShipperCharge = loadRate + accessorialTotal + hazmatSurcharge;
              const feeResult = await feeCalculator.calculateFee({
                userId: load.shipperId,
                userRole: "SHIPPER",
                transactionType: "load_completion",
                amount: totalShipperCharge,
                loadId: numericLoadId,
              });
              const platformFee = feeResult.finalFee;
              const carrierPay = totalShipperCharge - platformFee;

              await _sDb.insert(settlements).values({
                loadId: numericLoadId,
                shipperId: load.shipperId,
                carrierId,
                driverId: load.driverId || null,
                loadRate: loadRate.toFixed(2),
                platformFeePercent: feeResult.breakdown?.baseRate?.toString() || "5.00",
                platformFeeAmount: platformFee.toFixed(2),
                carrierPayment: carrierPay.toFixed(2),
                totalShipperCharge: totalShipperCharge.toFixed(2),
                status: "pending",
              });

              // Credit carrier wallet
              if (carrierId) {
                let [cWallet] = await _sDb.select().from(wallets).where(eq(wallets.userId, carrierId)).limit(1);
                if (!cWallet) {
                  try { await _sDb.insert(wallets).values({ userId: carrierId, availableBalance: "0", pendingBalance: "0", reservedBalance: "0", currency: "USD" }); } catch {}
                  [cWallet] = await _sDb.select().from(wallets).where(eq(wallets.userId, carrierId)).limit(1);
                }
                if (cWallet) {
                  await _sDb.execute(sql`UPDATE wallets SET availableBalance = availableBalance + ${carrierPay.toFixed(2)}, totalReceived = totalReceived + ${carrierPay.toFixed(2)} WHERE id = ${cWallet.id}`);
                  await _sDb.insert(walletTransactions).values({
                    walletId: cWallet.id,
                    type: "earnings",
                    amount: carrierPay.toFixed(2),
                    fee: platformFee.toFixed(2),
                    netAmount: carrierPay.toFixed(2),
                    currency: "USD",
                    status: "completed",
                    description: `Settlement — Load #${load.loadNumber || numericLoadId}${accessorialTotal > 0 ? ` (incl. $${accessorialTotal.toFixed(2)} accessorials)` : ""}${hazmatSurcharge > 0 ? ` (incl. $${hazmatSurcharge.toFixed(2)} hazmat surcharge)` : ""}`,
                    loadId: numericLoadId,
                    loadNumber: load.loadNumber || null,
                    completedAt: new Date(),
                  });
                }
              }

              // Record platform revenue
              try {
                await feeCalculator.recordFeeCollection(numericLoadId, "load_completion", load.shipperId, totalShipperCharge, feeResult);
              } catch {}

              // Persist settlement document for audit trail
              try {
                await _sDb.insert(settlementDocuments).values({
                  loadId: numericLoadId,
                  driverId: load.driverId || 0,
                  carrierId,
                  documentType: "SETTLEMENT",
                  amount: totalShipperCharge.toFixed(2),
                  deductions: { platformFee: parseFloat(platformFee.toFixed(2)), accessorials: accessorialTotal, hazmatSurcharge },
                  netPay: carrierPay.toFixed(2),
                  status: "FINALIZED",
                  finalizedAt: new Date(),
                });
              } catch (docErr: any) { logger.warn('[SettlementDoc] Persist error:', docErr?.message); }

              // ── Fix 3: Bridge settlement → payments table ──
              try {
                await _sDb.insert(payments).values({
                  loadId: numericLoadId,
                  payerId: load.shipperId,
                  payeeId: carrierId,
                  amount: carrierPay.toFixed(2),
                  currency: "USD",
                  paymentType: "load_payment",
                  status: "pending",
                  metadata: {
                    subType: "settlement_payment",
                    totalShipperCharge: parseFloat(totalShipperCharge.toFixed(2)),
                    platformFee: parseFloat(platformFee.toFixed(2)),
                    accessorials: accessorialTotal,
                    hazmatSurcharge,
                  },
                });
              } catch (payErr: any) { logger.warn('[Settlement] Payment record error:', payErr?.message); }

              // ── SHIPPER PAYMENT COLLECTION — Create Stripe PaymentIntent to charge shipper ──
              try {
                const { collectShipperPayment } = await import("../stripe/service");
                // Resolve shipper email and name
                const [shipperUser] = await _sDb.select({ email: users.email, name: users.name, stripeConnectId: users.stripeConnectId }).from(users).where(eq(users.id, load.shipperId)).limit(1);
                // Resolve carrier Stripe Connect ID for destination charges
                let carrierConnectId: string | null = null;
                if (carrierId) {
                  const [carrierWallet] = await _sDb.select({ stripeConnectId: wallets.stripeConnectId }).from(wallets).where(eq(wallets.userId, carrierId)).limit(1);
                  carrierConnectId = carrierWallet?.stripeConnectId || null;
                }
                if (shipperUser?.email) {
                  const piId = await collectShipperPayment({
                    loadId: numericLoadId,
                    loadNumber: load.loadNumber || String(numericLoadId),
                    shipperId: load.shipperId,
                    shipperEmail: shipperUser.email,
                    shipperName: shipperUser.name || shipperUser.email,
                    totalShipperCharge,
                    platformFee,
                    carrierStripeConnectId: carrierConnectId,
                    carrierPayout: carrierPay,
                  });
                  if (piId) {
                    // Update payment record with Stripe PaymentIntent ID
                    try {
                      await _sDb.execute(sql`UPDATE payments SET stripePaymentIntentId = ${piId}, status = 'processing' WHERE loadId = ${numericLoadId} AND payerId = ${load.shipperId} AND status = 'pending' ORDER BY id DESC LIMIT 1`);
                    } catch {}
                    logger.info(`[Settlement] Stripe PaymentIntent ${piId} created for shipper ${load.shipperId} — Load #${load.loadNumber || numericLoadId}, charge=$${totalShipperCharge.toFixed(2)}`);
                  }
                }
              } catch (stripeErr: any) { logger.warn('[Settlement] Shipper payment collection error (non-blocking):', stripeErr?.message); }

              // ── Fix 4: Driver earnings audit record ──
              if (load.driverId) {
                try {
                  await _sDb.insert(auditLogs).values({
                    userId: load.driverId,
                    action: "driver_earnings_recorded",
                    entityType: "driver_earnings",
                    entityId: numericLoadId,
                    changes: {
                      loadId: numericLoadId,
                      loadNumber: load.loadNumber || null,
                      carrierId,
                      carrierPayment: parseFloat(carrierPay.toFixed(2)),
                      totalShipperCharge: parseFloat(totalShipperCharge.toFixed(2)),
                      platformFee: parseFloat(platformFee.toFixed(2)),
                    },
                    severity: "LOW",
                  });
                } catch (earnErr: any) { logger.warn('[Settlement] Driver earnings audit error:', earnErr?.message); }
              }

              logger.info(`[Settlement] Load ${numericLoadId} settled: rate=$${loadRate}, accessorials=$${accessorialTotal.toFixed(2)}, hazmat=$${hazmatSurcharge.toFixed(2)}, total=$${totalShipperCharge.toFixed(2)}, fee=$${platformFee.toFixed(2)}, carrier=$${carrierPay.toFixed(2)}`);

              // ── Notifications: settlement created on DELIVERED ──
              try {
                const loadNum = load.loadNumber || String(numericLoadId);
                // Notify carrier
                if (carrierId) {
                  await _sDb.insert(notifications).values({
                    userId: carrierId,
                    type: "payment_received",
                    title: "Settlement Created",
                    message: `Load #${loadNum} delivered — Settlement of $${carrierPay.toFixed(2)} created`,
                    data: { loadId: numericLoadId, loadNumber: loadNum, amount: carrierPay.toFixed(2), totalShipperCharge: totalShipperCharge.toFixed(2) },
                  });
                  try {
                    const { emitNotification: emitSettleNotif } = await import("../_core/websocket");
                    emitSettleNotif(carrierId.toString(), {
                      id: `notif_settle_carrier_${numericLoadId}`,
                      type: "payment_received",
                      title: "Settlement Created",
                      message: `Load #${loadNum} delivered — Settlement of $${carrierPay.toFixed(2)} created`,
                      priority: "high",
                      data: { loadId: numericLoadId, loadNumber: loadNum },
                      timestamp: new Date().toISOString(),
                    });
                  } catch {}
                }
                // Notify driver
                if (load.driverId && load.driverId !== carrierId) {
                  await _sDb.insert(notifications).values({
                    userId: load.driverId,
                    type: "payment_received",
                    title: "Trip Complete",
                    message: `Trip complete — Earnings of $${carrierPay.toFixed(2)} recorded for load #${loadNum}`,
                    data: { loadId: numericLoadId, loadNumber: loadNum, earnings: carrierPay.toFixed(2) },
                  });
                  try {
                    const { emitNotification: emitDriverNotif } = await import("../_core/websocket");
                    emitDriverNotif(load.driverId.toString(), {
                      id: `notif_settle_driver_${numericLoadId}`,
                      type: "payment_received",
                      title: "Trip Complete",
                      message: `Trip complete — Earnings of $${carrierPay.toFixed(2)} recorded`,
                      priority: "high",
                      data: { loadId: numericLoadId, loadNumber: loadNum },
                      timestamp: new Date().toISOString(),
                    });
                  } catch {}
                }
              } catch (_notifErr) { /* notification failure must not break settlement */ }
            }
          }
        } catch (settleErr: any) {
          logger.warn(`[Settlement] Auto-settle error for load ${numericLoadId}:`, settleErr?.message);
        }

        // Reset driver status to available after delivery
        if (load?.driverId) {
          try {
            const _drDb = await getDb();
            if (_drDb) {
              await _drDb.update(drivers).set({ status: "available" }).where(eq(drivers.userId, load.driverId));
            }
          } catch { /* non-critical — driver status reset */ }
        }

        // ── INVOICE GENERATION — auto-generate invoice and transition to "invoiced" ──
        try {
          const { generateInvoiceForLoad } = await import("../services/invoiceService");
          const invoice = await generateInvoiceForLoad(numericLoadId);
          if (invoice) {
            logger.info(`[Invoice] ${invoice.invoiceNumber} generated for load ${numericLoadId} — $${invoice.totalRate.toFixed(2)}`);
          }
        } catch (invErr: any) {
          logger.warn(`[Invoice] Auto-invoice generation failed for load ${numericLoadId}:`, invErr?.message);
        }

        // WS-E2E-005: Fire gamification events on DELIVERED
        try {
          const driverId = load?.driverId || 0;
          const carrierId = load?.catalystId || load?.driverId || 0;
          if (driverId) {
            fireGamificationEvent({ userId: driverId, type: "load_completed", value: 1 });
            fireGamificationEvent({ userId: driverId, type: "route_completed", value: 1 });
            // delivery_on_time: compare delivery vs ETA
            const loadEta = load?.estimatedDeliveryDate || load?.deliveryDate;
            if (loadEta) {
              const etaDate = new Date(String(loadEta));
              if (new Date() <= etaDate) {
                fireGamificationEvent({ userId: driverId, type: "delivery_on_time", value: 1 });
              }
            }
            // first_load_completed: check if this is driver's first delivered load
            const _gDb = await getDb();
            if (_gDb) {
              const [cnt] = await _gDb.select({ count: sql<number>`COUNT(*)` }).from(loads)
                .where(and(eq(loads.driverId, driverId), eq(loads.status, 'delivered' as typeof loads.status.enumValues[number])));
              if ((cnt?.count || 0) <= 1) {
                fireGamificationEvent({ userId: driverId, type: "first_load_completed", value: 1 });
              }
            }
          }
          // escort_completed
          if (load && load.requiresEscort) {
            const _eDb = await getDb();
            if (_eDb) {
              const escorts = await _eDb.select({ escortUserId: escortAssignments.escortUserId })
                .from(escortAssignments).where(eq(escortAssignments.loadId, numericLoadId));
              for (const e of escorts) {
                if (e.escortUserId) fireGamificationEvent({ userId: e.escortUserId, type: "escort_completed", value: 1 });
              }
            }
          }
          if (carrierId && carrierId !== driverId) {
            fireGamificationEvent({ userId: carrierId, type: "load_completed", value: 1 });
          }
        } catch (gamErr: any) { logger.warn('[Gamification] DELIVERED event error:', gamErr?.message); }
      }

      // Convoy sync — check if this state change satisfies a sync point
      try { await checkConvoySync(numericLoadId, resolvedTo); } catch { /* non-critical */ }

      // ── GPS GEOTAG — immutable audit trail on every transition ──
      const geotagId = await geotagTransition(
        numericLoadId, ctx.user?.id || 0, userRole,
        currentState, resolvedTo, input.transitionId,
        input.location, load, input.metadata,
      );

      // ── COMPLIANCE SNAPSHOT — capture at assignment (first time cargo profile is locked in) ──
      if (resolvedTo === "ASSIGNED" || resolvedTo === "ACCEPTED" || resolvedTo === "CONFIRMED") {
        await captureComplianceSnapshot(numericLoadId, load);
      }

      // Audit log
      await logTransition(numericLoadId, currentState, resolvedTo, transition, ctx.user?.id || 0, userRole, guardsPassed, effectsExecuted, { ...input.metadata, geotagId }, true);

      logger.info(`[LoadLifecycle] ${currentState} → ${resolvedTo} (${input.transitionId}) for load ${input.loadId}`);

      // ── Real-time broadcast via Socket.io ──
      try {
        const { emitLoadStateChange } = await import("../services/socketService");
        emitLoadStateChange({
          loadId: input.loadId,
          previousState: currentState,
          newState: resolvedTo,
          transitionId: input.transitionId,
          actorId: ctx.user?.id || 0,
          actorName: ctx.user?.name || "System",
          actorRole: userRole,
          timestamp: new Date().toISOString(),
          metadata: input.metadata || {},
        });
      } catch { /* non-critical — page still works via polling */ }

      // ── Native WebSocket broadcast — emitLoadStatusChange + role notifications ──
      try {
        const { emitLoadStatusChange, emitNotification } = await import("../_core/websocket");
        emitLoadStatusChange({
          loadId: String(numericLoadId),
          loadNumber: load?.loadNumber || `LOAD-${numericLoadId}`,
          previousStatus: currentState,
          newStatus: resolvedTo,
          updatedBy: String(ctx.user?.id || 0),
          timestamp: new Date().toISOString(),
          location: input.location ? { lat: input.location.lat, lng: input.location.lng } : undefined,
        });

        const statusLabel = resolvedTo.replace(/_/g, " ").toLowerCase();
        const loadNum = load?.loadNumber || `#${numericLoadId}`;

        if (load?.shipperId) {
          emitNotification(String(load.shipperId), {
            id: `notif_${Date.now()}_sh`,
            type: "load_update",
            title: `Load ${loadNum}: ${statusLabel}`,
            message: `Your load transitioned from ${currentState} to ${resolvedTo}`,
            priority: "medium",
            data: { loadId: String(numericLoadId), newState: resolvedTo },
            timestamp: new Date().toISOString(),
          });
        }
        if (load?.catalystId && load.catalystId !== (ctx.user?.id || 0)) {
          emitNotification(String(load.catalystId), {
            id: `notif_${Date.now()}_cat`,
            type: "load_update",
            title: `Load ${loadNum}: ${statusLabel}`,
            message: `Load transitioned to ${resolvedTo}`,
            priority: "medium",
            data: { loadId: String(numericLoadId), newState: resolvedTo },
            timestamp: new Date().toISOString(),
          });
        }
        if (load?.driverId && load.driverId !== (ctx.user?.id || 0)) {
          emitNotification(String(load.driverId), {
            id: `notif_${Date.now()}_drv`,
            type: "load_update",
            title: `Load ${loadNum}: ${statusLabel}`,
            message: `Load transitioned to ${resolvedTo}`,
            priority: "high",
            data: { loadId: String(numericLoadId), newState: resolvedTo },
            timestamp: new Date().toISOString(),
          });
        }
      } catch { /* non-critical */ }

      // ── Standard load:* event catalog (15 events from websocket-events.ts) ──
      try {
        const { wsService, WS_EVENTS, WS_CHANNELS } = await import("../_core/websocket");
        const loadChannel = WS_CHANNELS.LOAD(String(numericLoadId));
        const stdPayload = {
          loadId: String(numericLoadId),
          loadNumber: load?.loadNumber || `LOAD-${numericLoadId}`,
          previousState: currentState,
          newState: resolvedTo,
          timestamp: new Date().toISOString(),
          actorId: String(ctx.user?.id || 0),
        };

        // load:status_changed — every transition
        wsService.broadcastToChannel(loadChannel, { type: WS_EVENTS.LOAD_STATUS_CHANGED, data: stdPayload, timestamp: stdPayload.timestamp });

        // load:posted
        if (resolvedTo === "POSTED") {
          wsService.broadcastToChannel(loadChannel, { type: WS_EVENTS.LOAD_POSTED, data: stdPayload, timestamp: stdPayload.timestamp });
        }
        // load:assigned
        if (resolvedTo === "ASSIGNED") {
          wsService.broadcastToChannel(loadChannel, { type: WS_EVENTS.LOAD_ASSIGNED, data: { ...stdPayload, driverId: load?.driverId ? String(load.driverId) : undefined, vehicleId: load?.vehicleId ? String(load.vehicleId) : undefined }, timestamp: stdPayload.timestamp });
        }
        // load:cancelled
        if (resolvedTo === "CANCELLED") {
          wsService.broadcastToChannel(loadChannel, { type: WS_EVENTS.LOAD_CANCELLED, data: { ...stdPayload, reason: input.metadata?.cancellationReason || "unspecified" }, timestamp: stdPayload.timestamp });
        }
        // load:completed
        if (resolvedTo === "DELIVERED") {
          wsService.broadcastToChannel(loadChannel, { type: WS_EVENTS.LOAD_COMPLETED, data: { ...stdPayload, summary: { rate: load.rate, distance: load.distance } }, timestamp: stdPayload.timestamp });
        }
        // load:location_updated — when location data is present
        if (input.location) {
          wsService.broadcastToChannel(WS_CHANNELS.LOAD_TRACKING(String(numericLoadId)), { type: WS_EVENTS.LOAD_LOCATION_UPDATED, data: { loadId: String(numericLoadId), lat: input.location.lat, lng: input.location.lng, timestamp: stdPayload.timestamp }, timestamp: stdPayload.timestamp });
        }
        // load:bol_signed — when BOL document metadata is present
        if (input.metadata?.bolDocumentId) {
          wsService.broadcastToChannel(loadChannel, { type: WS_EVENTS.LOAD_BOL_SIGNED, data: { loadId: String(numericLoadId), bolDocumentId: input.metadata!.bolDocumentId, timestamp: stdPayload.timestamp }, timestamp: stdPayload.timestamp });
        }
        // load:pod_submitted — when POD signature metadata is present
        if (input.metadata?.podSignatureUrl) {
          wsService.broadcastToChannel(loadChannel, { type: WS_EVENTS.LOAD_POD_SUBMITTED, data: { loadId: String(numericLoadId), podUrl: input.metadata!.podSignatureUrl, timestamp: stdPayload.timestamp }, timestamp: stdPayload.timestamp });
        }
        // load:exception_raised — cargo exception states
        const EXCEPTION_STATES = ["TEMP_EXCURSION", "REEFER_BREAKDOWN", "CONTAMINATION_REJECT", "SEAL_BREACH", "WEIGHT_VIOLATION"];
        if (EXCEPTION_STATES.includes(resolvedTo)) {
          wsService.broadcastToChannel(loadChannel, { type: WS_EVENTS.LOAD_EXCEPTION_RAISED, data: { loadId: String(numericLoadId), exceptionType: resolvedTo, severity: "critical", timestamp: stdPayload.timestamp }, timestamp: stdPayload.timestamp });
        }
      } catch { /* non-critical — standard events are supplementary */ }

      // ── Financial event emissions — settlement, cancellation, escrow ──
      const FINANCIAL_STATES = ["DELIVERED", "CANCELLED", "DISPUTE"];
      if (FINANCIAL_STATES.includes(resolvedTo)) {
        try {
          const { emitFinancialEvent } = await import("../_core/websocket");
          const finType = resolvedTo === "DELIVERED" ? "settlement_created" : resolvedTo === "CANCELLED" ? "cancellation_processed" : "dispute_opened";
          const finAmount = parseFloat(String(load.rate || "0"));
          if (load?.shipperId) {
            emitFinancialEvent(String(load.shipperId), {
              transactionId: `fin_${numericLoadId}_${Date.now()}`,
              type: finType,
              amount: finAmount,
              currency: "USD",
              loadId: String(numericLoadId),
              status: "pending",
              timestamp: new Date().toISOString(),
            });
          }
          if (load?.catalystId) {
            emitFinancialEvent(String(load.catalystId), {
              transactionId: `fin_${numericLoadId}_${Date.now()}_c`,
              type: resolvedTo === "DELIVERED" ? "payment_pending" : "cancellation_processed",
              amount: finAmount,
              currency: "USD",
              loadId: String(numericLoadId),
              status: "pending",
              timestamp: new Date().toISOString(),
            });
          }
        } catch { /* non-critical */ }
      }

      // ── Dispatch event emissions — assignment, unassignment, status changes ──
      const DISPATCH_STATES = ["ASSIGNED", "CONFIRMED", "EN_ROUTE_PICKUP", "AT_PICKUP", "LOADING", "IN_TRANSIT", "AT_DELIVERY", "UNLOADING"];
      if (DISPATCH_STATES.includes(resolvedTo)) {
        try {
          const { emitDispatchEvent } = await import("../_core/websocket");
          const dispatchCompanyId = (load as unknown as Record<string, unknown>).companyId || load?.shipperId || 0;
          if (dispatchCompanyId) {
            emitDispatchEvent(String(dispatchCompanyId), {
              loadId: String(numericLoadId),
              loadNumber: load?.loadNumber || `LOAD-${numericLoadId}`,
              driverId: load?.driverId ? String(load.driverId) : undefined,
              eventType: resolvedTo === "ASSIGNED" ? "load_assigned" : "status_changed",
              priority: "normal",
              message: `Load ${load?.loadNumber || numericLoadId} transitioned to ${resolvedTo}`,
              timestamp: new Date().toISOString(),
            });
          }
        } catch { /* non-critical */ }
      }

      // ── Compliance alert emissions — weight violations ──
      if (resolvedTo === "WEIGHT_VIOLATION") {
        try {
          const { emitComplianceAlert } = await import("../_core/websocket");
          const complianceCompanyId = (load as unknown as Record<string, unknown>).companyId || load?.shipperId || 0;
          if (complianceCompanyId) {
            emitComplianceAlert(String(complianceCompanyId), {
              entityType: "vehicle",
              entityId: String(load?.vehicleId || 0),
              entityName: load?.loadNumber || `LOAD-${numericLoadId}`,
              alertType: "weight_violation",
              severity: "critical",
              message: `Load ${load?.loadNumber || numericLoadId} flagged for weight violation`,
              timestamp: new Date().toISOString(),
            });
          }
        } catch { /* non-critical */ }
      }

      // ── Gamification event on delivery ──
      if (resolvedTo === "DELIVERED") {
        try {
          const { emitGamificationEvent } = await import("../_core/websocket");
          const { WS_EVENTS } = await import("@shared/websocket-events");
          const xpEvent = WS_EVENTS.XP_EARNED;
          if (load?.driverId) {
            emitGamificationEvent(String(load.driverId), xpEvent, {
              userId: String(load.driverId),
              eventType: "load_delivered",
              data: { name: "Load Delivered", description: `Delivered load ${load?.loadNumber || numericLoadId}`, xpEarned: 100 },
              timestamp: new Date().toISOString(),
            });
          }
          if (load?.catalystId) {
            emitGamificationEvent(String(load.catalystId), xpEvent, {
              userId: String(load.catalystId),
              eventType: "load_completed",
              data: { name: "Load Completed", description: `Completed load ${load?.loadNumber || numericLoadId}`, xpEarned: 50 },
              timestamp: new Date().toISOString(),
            });
          }
        } catch { /* non-critical */ }
      }

      // ── Cargo exception notifications — urgent email + SMS ──
      const CARGO_EXCEPTION_STATES = ["TEMP_EXCURSION", "REEFER_BREAKDOWN", "CONTAMINATION_REJECT", "SEAL_BREACH", "WEIGHT_VIOLATION"];
      if (CARGO_EXCEPTION_STATES.includes(resolvedTo)) {
        try {
          const { lookupAndNotify } = await import("../services/notifications");
          const cargoType = load.cargoType || undefined;
          if (load.shipperId) lookupAndNotify(load.shipperId, { type: "cargo_exception", loadNumber: load.loadNumber, exceptionType: resolvedTo.toLowerCase(), loadId: input.loadId, cargoType });
          if (load.catalystId) lookupAndNotify(load.catalystId, { type: "cargo_exception", loadNumber: load.loadNumber, exceptionType: resolvedTo.toLowerCase(), loadId: input.loadId, cargoType });
        } catch { /* non-critical */ }
      }

      return {
        success: true,
        loadId: input.loadId,
        previousState: currentState,
        newState: resolvedTo,
        transitionId: input.transitionId,
        guardsPassed,
        effectsExecuted,
        transitionedAt: new Date().toISOString(),
        newStateMeta: STATE_METADATA[resolvedTo as LoadState],
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
        const err = await evaluateGuard(g, guardCtx);
        if (err) errors.push(err);
      }
      if (errors.length > 0) {
        return { success: false, errors, step: "COMPLIANCE_VALIDATION" };
      }

      // Update status
      const newStatusLower = to.toLowerCase();
      await db.execute(sql`UPDATE loads SET status = ${newStatusLower}, updatedAt = NOW() WHERE id = ${numericLoadId}`);

      // ── NOTIFICATION DISPATCH — in-app + WebSocket after successful status update (v1 path) ──
      try {
        const [loadDataV1] = await db.select({
          shipperId: loads.shipperId,
          catalystId: loads.catalystId,
          driverId: loads.driverId,
          loadNumber: loads.loadNumber,
        }).from(loads).where(eq(loads.id, numericLoadId)).limit(1);
        await emitLoadNotifications(numericLoadId, newStatusLower, loadDataV1 || {});
      } catch (notifErr) {
        logger.warn("[LoadLifecycle] Notification dispatch error (v1):", (notifErr as Error).message);
      }

      // Execute financial effects
      const financialEffects = match.effects.filter(e => e.type === "financial");
      for (const eff of financialEffects) {
        await executeFinancialEffect(eff.action, numericLoadId, ctx);
      }

      // Route report on DELIVERED
      if (to === "DELIVERED") {
        await generateRouteReport(numericLoadId, ctx.user?.id || 0);

        // Auto-generate invoice on delivery confirmation (v1 path)
        try {
          const { generateInvoiceForLoad } = await import("../services/invoiceService");
          const invoice = await generateInvoiceForLoad(numericLoadId);
          if (invoice) {
            logger.info(`[Invoice] ${invoice.invoiceNumber} generated for load ${numericLoadId} (v1 path)`);
          }
        } catch (invErr: any) {
          logger.warn(`[Invoice] Auto-invoice generation failed for load ${numericLoadId} (v1 path):`, (invErr as Error)?.message);
        }
      }

      // ── GPS GEOTAG — immutable audit trail (v1 compat path) ──
      const userRole = (ctx.user?.role || "DRIVER").toUpperCase();
      const v1GeotagId = await geotagTransition(
        numericLoadId, ctx.user?.id || 0, userRole,
        from, to, match.id,
        input.location, load, input.metadata as Record<string, unknown>,
      );

      // ── COMPLIANCE SNAPSHOT at assignment ──
      if (to === "ASSIGNED" || to === "ACCEPTED" || to === "CONFIRMED") {
        await captureComplianceSnapshot(numericLoadId, load);
      }

      // Audit
      await logTransition(numericLoadId, from, to, match, ctx.user?.id || 0, userRole, match.guards.map(g => g.check), financialEffects.map(e => e.action), { ...(input.metadata as Record<string, unknown>), geotagId: v1GeotagId }, true);

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

      const rate = parseFloat(String(load.rate || "0"));
      const distance = parseFloat(String(load.distance || "0"));
      const timers = await getTimerHistory(numId);
      const activeTimers = await getFinancialTimers(numId);

      const detentionCharges = timers.filter(t => t.type === "DETENTION").reduce((s, t) => s + t.currentCharge, 0);
      const demurrageCharges = timers.filter(t => t.type === "DEMURRAGE").reduce((s, t) => s + t.currentCharge, 0);
      const layoverCharges = timers.filter(t => t.type === "LAYOVER").reduce((s, t) => s + t.currentCharge, 0);

      const fuelSurcharge = Math.round(distance * 0.58 * 100) / 100; // $0.58/mi avg
      const hazmatSurcharge = load.cargoType === "hazmat" ? Math.round(rate * 0.15 * 100) / 100 : 0;

      return {
        loadId: input.loadId,
        lineHaul: rate,
        distance,
        fuelSurcharge,
        hazmatSurcharge,
        detentionCharges,
        demurrageCharges,
        layoverCharges,
        totalAccessorials: detentionCharges + demurrageCharges + layoverCharges,
        totalCharges: rate + fuelSurcharge + hazmatSurcharge + detentionCharges + demurrageCharges + layoverCharges,
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
        return (((rows as unknown as RawQueryResult)[0]) || []).map((r: RawRow) => ({
          id: r.id,
          loadId: r.load_id,
          loadNumber: r.load_number,
          loadStatus: r.load_status,
          gateId: r.gate_id,
          transitionId: r.transition_id,
          status: r.status,
          requestedAt: r.requested_at instanceof Date ? r.requested_at.toISOString() : r.requested_at,
          expiresAt: r.expires_at instanceof Date ? r.expires_at.toISOString() : r.expires_at,
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
        const approval = ((rows as unknown as RawQueryResult)[0] || [])[0];
        if (!approval) return { success: false, error: "Approval request not found or already resolved" };

        // Check expiration
        if (approval.expires_at && new Date(String(approval.expires_at)) < new Date()) {
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
            gateId: String(approval.gate_id),
            action: "approved",
            actorId: ctx.user?.id || 0,
            timestamp: new Date().toISOString(),
          });
        } catch { /* non-critical */ }

        return {
          success: true,
          approvalId: input.approvalId,
          loadId: String(approval.load_id),
          gateId: String(approval.gate_id),
          transitionId: String(approval.transition_id),
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
        const approval = ((rows as unknown as RawQueryResult)[0] || [])[0];
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
            gateId: String(approval.gate_id),
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

  // ── SUBMIT COMPLIANCE CHECK — drivers submit vertical-specific compliance items ──
  submitComplianceCheck: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      checkName: z.string(),
      passed: z.boolean(),
      notes: z.string().optional(),
      photoBase64: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const userId = Number(ctx.user?.id) || 0;

      // Store compliance check in load specialInstructions JSON
      const [load] = await db.select({ id: loads.id, specialInstructions: loads.specialInstructions })
        .from(loads).where(eq(loads.id, input.loadId)).limit(1);
      if (!load) throw new TRPCError({ code: "NOT_FOUND", message: "Load not found" });

      let existingData: Record<string, any> = {};
      try {
        existingData = (typeof load.specialInstructions === "string"
          ? JSON.parse(load.specialInstructions || "{}")
          : load.specialInstructions) || {};
      } catch {
        // specialInstructions may contain non-JSON content (e.g. compliance snapshot appended text)
        existingData = { _rawText: load.specialInstructions };
      }

      const checks: Record<string, any> = existingData.complianceChecks || {};
      checks[input.checkName] = {
        passed: input.passed,
        userId,
        timestamp: new Date().toISOString(),
        notes: input.notes || null,
      };
      existingData.complianceChecks = checks;

      await db.update(loads)
        .set({ specialInstructions: JSON.stringify(existingData) })
        .where(eq(loads.id, input.loadId));

      logger.info(`[LoadLifecycle] Compliance check "${input.checkName}" = ${input.passed} for load ${input.loadId} by user ${userId}`);

      return { success: true, checkName: input.checkName, passed: input.passed };
    }),

  // ── FACILITY CHECK-IN — Manual trigger for pickup_checkin / delivery_checkin ──
  checkIn: protectedProcedure
    .input(z.object({
      loadId: z.number(),
      type: z.enum(["pickup", "delivery"]),
      gateCode: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const userId = Number(ctx.user?.id) || 0;

      const [load] = await db.select({ id: loads.id, status: loads.status, driverId: loads.driverId })
        .from(loads).where(eq(loads.id, input.loadId)).limit(1);
      if (!load) throw new TRPCError({ code: "NOT_FOUND", message: "Load not found" });

      // Validate correct status for check-in
      if (input.type === "pickup" && load.status !== "at_pickup") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Must be at pickup to check in" });
      }
      if (input.type === "delivery" && load.status !== "at_delivery") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Must be at delivery to check in" });
      }

      // Allow driver OR terminal manager
      const newStatus = input.type === "pickup" ? "pickup_checkin" : "delivery_checkin";

      await db.update(loads)
        .set({ status: newStatus as typeof loads.status.enumValues[number], updatedAt: new Date() })
        .where(eq(loads.id, input.loadId));

      // Audit log the check-in transition
      try {
        const fromStatus = input.type === "pickup" ? "at_pickup" : "at_delivery";
        await geotagTransition(
          input.loadId, userId, (ctx.user?.role || "driver"),
          fromStatus, newStatus, `${input.type}_checkin`,
          undefined, load, { gateCode: input.gateCode, notes: input.notes },
        );
      } catch { /* non-critical */ }

      logger.info(`[LoadLifecycle] Check-in: load ${input.loadId} → ${newStatus} by user ${userId}`);

      return { success: true, newStatus };
    }),

  /**
   * getCustodyChain — Returns the full chain of custody for a load.
   * Used by the BOL page to display cargo transfer history.
   */
  getCustodyChain: protectedProcedure
    .input(z.object({ loadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      try {
        const chain = await db.select().from(custodyTransfers)
          .where(eq(custodyTransfers.loadId, input.loadId))
          .orderBy(custodyTransfers.sequenceNumber);
        return chain;
      } catch { return []; }
    }),
});
