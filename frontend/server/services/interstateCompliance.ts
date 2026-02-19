/**
 * INTERSTATE COMPLIANCE ENGINE
 * ═══════════════════════════════════════════════════════════════
 * 
 * Detects state border crossings and enforces per-state compliance:
 * - Weight-distance tax states (OR, NM, NY, KY)
 * - CARB compliance (CA)
 * - Oversize/overweight permits per state
 * - IFTA mileage tracking per state
 * - State-specific document requirements
 * - Hazmat route restrictions
 * 
 * Triggered by locationEngine STATE_BORDER geofence events and
 * proactively by route analysis at load assignment time.
 */

import { getDb } from "../db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  tripComplianceEvents, tripStateMiles, loads, users,
  documentTypes, userDocuments, stateCrossings,
} from "../../drizzle/schema";
import { getIO } from "./socketService";

// ═══════════════════════════════════════════════════════════════
// STATE COMPLIANCE RULES
// ═══════════════════════════════════════════════════════════════

const WEIGHT_DISTANCE_TAX_STATES = ["OR", "NM", "NY", "KY"] as const;

const WEIGHT_TAX_INFO: Record<string, { name: string; threshold: number; unit: string; portalUrl: string }> = {
  OR: { name: "Oregon Weight-Mile Tax", threshold: 26001, unit: "lbs", portalUrl: "https://www.oregon.gov/odot/MCT/" },
  NM: { name: "New Mexico Weight-Distance Tax", threshold: 26001, unit: "lbs", portalUrl: "https://www.tax.newmexico.gov/businesses/weight-distance-tax/" },
  NY: { name: "New York Highway Use Tax (HUT)", threshold: 18001, unit: "lbs", portalUrl: "https://www.tax.ny.gov/bus/hut/" },
  KY: { name: "Kentucky Weight Distance Tax (KYU)", threshold: 60000, unit: "lbs", portalUrl: "https://drive.ky.gov/motor-carriers/" },
};

const CARB_STATES = ["CA"] as const;

const OVERSIZE_PERMIT_STATES = ["TX", "CA", "FL", "IL", "OH", "PA", "GA", "IN", "TN", "NC"] as const;

// States with mandatory port-of-entry / weigh station stops
const PORT_OF_ENTRY_STATES = ["CA", "AZ", "NM", "OR", "ID", "MT", "WY", "UT", "NV", "CO"] as const;

// ═══════════════════════════════════════════════════════════════
// ROUTE ANALYSIS — Pre-trip compliance check
// ═══════════════════════════════════════════════════════════════

export interface RouteComplianceResult {
  loadId: number;
  originState: string;
  destState: string;
  transitStates: string[];
  isInterstate: boolean;
  compliance: StateComplianceCheck[];
  overallStatus: "clear" | "warnings" | "blocked";
  blockers: string[];
  warnings: string[];
}

export interface StateComplianceCheck {
  stateCode: string;
  stateName: string;
  checks: ComplianceCheckItem[];
  status: "pass" | "warning" | "fail";
}

export interface ComplianceCheckItem {
  type: string;
  label: string;
  status: "pass" | "warning" | "fail";
  detail: string;
  actionUrl?: string;
  isBlocking: boolean;
}

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

/**
 * Analyze a load's route for interstate compliance requirements.
 * Called when a load is assigned/booked to pre-check compliance.
 */
export async function analyzeRouteCompliance(loadId: number): Promise<RouteComplianceResult> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
  if (!load) throw new Error("Load not found");

  const pickup = load.pickupLocation as any;
  const delivery = load.deliveryLocation as any;
  const originState = pickup?.state || "";
  const destState = delivery?.state || "";
  const isInterstate = originState !== destState;

  // Determine transit states from route or origin/dest
  const transitStates = await getTransitStates(loadId, originState, destState);

  const compliance: StateComplianceCheck[] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];

  // Check each transit state
  for (const state of transitStates) {
    const checks = await checkStateCompliance(state, load, loadId);
    const status = checks.some(c => c.status === "fail") ? "fail" as const
      : checks.some(c => c.status === "warning") ? "warning" as const
      : "pass" as const;

    compliance.push({
      stateCode: state,
      stateName: STATE_NAMES[state] || state,
      checks,
      status,
    });

    for (const c of checks) {
      if (c.status === "fail" && c.isBlocking) blockers.push(`${STATE_NAMES[state]}: ${c.detail}`);
      if (c.status === "warning") warnings.push(`${STATE_NAMES[state]}: ${c.detail}`);
    }
  }

  const overallStatus = blockers.length > 0 ? "blocked" as const
    : warnings.length > 0 ? "warnings" as const
    : "clear" as const;

  return { loadId, originState, destState, transitStates, isInterstate, compliance, overallStatus, blockers, warnings };
}

async function getTransitStates(loadId: number, origin: string, dest: string): Promise<string[]> {
  const states = new Set<string>();
  if (origin) states.add(origin);
  if (dest) states.add(dest);

  // Check existing state crossings for this load
  const db = await getDb();
  if (db) {
    const crossings = await db.select({ toState: stateCrossings.toState })
      .from(stateCrossings)
      .where(eq(stateCrossings.loadId, loadId));
    for (const c of crossings) {
      if (c.toState) states.add(c.toState);
    }
  }

  return Array.from(states);
}

async function checkStateCompliance(state: string, load: any, loadId: number): Promise<ComplianceCheckItem[]> {
  const checks: ComplianceCheckItem[] = [];
  const weight = Number(load.weight) || 0;
  const isHazmat = load.cargoType === "hazmat" || load.cargoType === "chemicals" || load.cargoType === "petroleum";
  const isOversized = load.cargoType === "oversized";

  // Weight-distance tax check
  if ((WEIGHT_DISTANCE_TAX_STATES as readonly string[]).includes(state)) {
    const info = WEIGHT_TAX_INFO[state];
    if (weight >= info.threshold) {
      checks.push({
        type: "weight_tax",
        label: info.name,
        status: "warning",
        detail: `Vehicle ${weight} lbs exceeds ${info.threshold} lb threshold. ${info.name} filing required.`,
        actionUrl: info.portalUrl,
        isBlocking: false,
      });
    } else {
      checks.push({
        type: "weight_tax",
        label: info.name,
        status: "pass",
        detail: `Below ${info.threshold} lb threshold — no tax required.`,
        isBlocking: false,
      });
    }
  }

  // CARB compliance (California)
  if ((CARB_STATES as readonly string[]).includes(state)) {
    checks.push({
      type: "carb",
      label: "CARB Truck & Bus Compliance",
      status: "warning",
      detail: "California requires CARB emission compliance for all trucks. Verify vehicle registration in TRUCRS.",
      actionUrl: "https://ww2.arb.ca.gov/our-work/programs/truck-and-bus-regulation",
      isBlocking: false,
    });
    checks.push({
      type: "ca_mcp",
      label: "California Motor Carrier Permit",
      status: "warning",
      detail: "CA intrastate operations require a Motor Carrier Permit (MCP).",
      actionUrl: "https://www.dmv.ca.gov/portal/vehicle-industry-services/motor-carrier-services-mcs/motor-carrier-permits/",
      isBlocking: false,
    });
  }

  // Oversize permit
  if (isOversized && (OVERSIZE_PERMIT_STATES as readonly string[]).includes(state)) {
    checks.push({
      type: "oversize_permit",
      label: `${STATE_NAMES[state]} Oversize Permit`,
      status: "warning",
      detail: `Oversize load requires state-specific permit for ${STATE_NAMES[state]}.`,
      isBlocking: true,
    });
  }

  // Hazmat route restrictions
  if (isHazmat) {
    checks.push({
      type: "hazmat_route",
      label: `Hazmat Route Compliance — ${STATE_NAMES[state]}`,
      status: "pass",
      detail: `Verify hazmat route is approved for ${STATE_NAMES[state]}. Check for tunnel/bridge restrictions.`,
      isBlocking: false,
    });
  }

  // Port of entry
  if ((PORT_OF_ENTRY_STATES as readonly string[]).includes(state)) {
    checks.push({
      type: "port_of_entry",
      label: `${STATE_NAMES[state]} Port of Entry`,
      status: "pass",
      detail: `${STATE_NAMES[state]} may require port-of-entry stop. Check PrePass/weigh station status.`,
      isBlocking: false,
    });
  }

  // IFTA (all interstate trips)
  checks.push({
    type: "ifta",
    label: "IFTA Mileage Tracking",
    status: "pass",
    detail: `Miles driven in ${STATE_NAMES[state]} will be recorded for IFTA quarterly filing.`,
    isBlocking: false,
  });

  return checks;
}

// ═══════════════════════════════════════════════════════════════
// STATE CROSSING EVENT HANDLER
// ═══════════════════════════════════════════════════════════════

/**
 * Called by locationEngine when a STATE_BORDER geofence is triggered.
 * Records compliance events and broadcasts to all stakeholders.
 */
export async function handleStateCrossing(opts: {
  loadId: number;
  driverId: number;
  vehicleId?: number;
  fromState: string;
  toState: string;
  lat: number;
  lng: number;
  weight?: number;
  isHazmat?: boolean;
  isOversized?: boolean;
}): Promise<ComplianceCheckItem[]> {
  const db = await getDb();
  if (!db) return [];

  const alerts: ComplianceCheckItem[] = [];

  // Record state entry event
  await db.insert(tripComplianceEvents).values({
    loadId: opts.loadId,
    driverId: opts.driverId,
    vehicleId: opts.vehicleId || null,
    eventType: "state_entry",
    stateCode: opts.toState,
    fromState: opts.fromState,
    toState: opts.toState,
    latitude: String(opts.lat),
    longitude: String(opts.lng),
    details: { fromState: opts.fromState, toState: opts.toState },
  });

  // Record state exit event for previous state
  await db.insert(tripComplianceEvents).values({
    loadId: opts.loadId,
    driverId: opts.driverId,
    vehicleId: opts.vehicleId || null,
    eventType: "state_exit",
    stateCode: opts.fromState,
    fromState: opts.fromState,
    toState: opts.toState,
    latitude: String(opts.lat),
    longitude: String(opts.lng),
    details: { exitedState: opts.fromState },
  });

  // IFTA mile logging — upsert trip_state_miles for the new state
  await db.insert(tripStateMiles).values({
    loadId: opts.loadId,
    vehicleId: opts.vehicleId || null,
    stateCode: opts.toState,
    miles: "0",
    entryTime: new Date(),
  }).onDuplicateKeyUpdate({ set: { entryTime: new Date() } });

  // Update exit time on the previous state
  try {
    await db.update(tripStateMiles)
      .set({ exitTime: new Date() })
      .where(and(
        eq(tripStateMiles.loadId, opts.loadId),
        eq(tripStateMiles.stateCode, opts.fromState),
      ));
  } catch (_) { /* first state entry won't have a previous */ }

  // Weight-distance tax check
  const weight = opts.weight || 0;
  if ((WEIGHT_DISTANCE_TAX_STATES as readonly string[]).includes(opts.toState)) {
    const info = WEIGHT_TAX_INFO[opts.toState];
    if (weight >= info.threshold) {
      const item: ComplianceCheckItem = {
        type: "weight_tax",
        label: info.name,
        status: "warning",
        detail: `Entering ${STATE_NAMES[opts.toState]} — ${info.name} applies (${weight} lbs > ${info.threshold} lb threshold)`,
        actionUrl: info.portalUrl,
        isBlocking: false,
      };
      alerts.push(item);

      await db.insert(tripComplianceEvents).values({
        loadId: opts.loadId,
        driverId: opts.driverId,
        vehicleId: opts.vehicleId || null,
        eventType: "weight_tax_required",
        stateCode: opts.toState,
        latitude: String(opts.lat),
        longitude: String(opts.lng),
        details: { taxName: info.name, weight, threshold: info.threshold },
        requiresAction: 1,
      });

      await db.update(tripStateMiles)
        .set({ weightTaxApplicable: 1 })
        .where(and(eq(tripStateMiles.loadId, opts.loadId), eq(tripStateMiles.stateCode, opts.toState)));
    }
  }

  // CARB check for California
  if (opts.toState === "CA") {
    alerts.push({
      type: "carb",
      label: "CARB Compliance Required",
      status: "warning",
      detail: "Entering California — CARB Truck & Bus emission compliance required.",
      actionUrl: "https://ww2.arb.ca.gov/our-work/programs/truck-and-bus-regulation",
      isBlocking: false,
    });
    await db.insert(tripComplianceEvents).values({
      loadId: opts.loadId,
      driverId: opts.driverId,
      vehicleId: opts.vehicleId || null,
      eventType: "carb_required",
      stateCode: "CA",
      latitude: String(opts.lat),
      longitude: String(opts.lng),
      requiresAction: 1,
    });
  }

  // Oversize permit check
  if (opts.isOversized && (OVERSIZE_PERMIT_STATES as readonly string[]).includes(opts.toState)) {
    alerts.push({
      type: "oversize_permit",
      label: `${STATE_NAMES[opts.toState]} Oversize Permit`,
      status: "fail",
      detail: `Oversize load entering ${STATE_NAMES[opts.toState]} — verify state-specific permit.`,
      isBlocking: true,
    });
    await db.insert(tripComplianceEvents).values({
      loadId: opts.loadId,
      driverId: opts.driverId,
      vehicleId: opts.vehicleId || null,
      eventType: "oversize_permit_required",
      stateCode: opts.toState,
      latitude: String(opts.lat),
      longitude: String(opts.lng),
      isBlocking: 1,
      requiresAction: 1,
    });
  }

  // Broadcast state crossing to all load subscribers via WebSocket
  const io = getIO();
  if (io) {
    io.to(`load:${opts.loadId}`).emit("trip:stateCrossing", {
      loadId: opts.loadId,
      fromState: opts.fromState,
      toState: opts.toState,
      stateName: STATE_NAMES[opts.toState],
      lat: opts.lat,
      lng: opts.lng,
      alerts,
      timestamp: new Date().toISOString(),
    });
    // Alert dispatch and admin
    io.to("role:dispatch").emit("trip:stateCrossing", {
      loadId: opts.loadId,
      fromState: opts.fromState,
      toState: opts.toState,
    });
  }

  return alerts;
}

// ═══════════════════════════════════════════════════════════════
// ACTIVE TRIP DATA — for driver's dashboard
// ═══════════════════════════════════════════════════════════════

export interface ActiveTripData {
  loadId: number;
  loadNumber: string;
  status: string;
  origin: { city: string; state: string; lat: number; lng: number };
  destination: { city: string; state: string; lat: number; lng: number };
  currentState: string;
  isInterstate: boolean;
  statesCrossed: Array<{ fromState: string; toState: string; crossedAt: string }>;
  complianceEvents: Array<{ type: string; stateCode: string; detail: string; requiresAction: boolean; createdAt: string }>;
  stateMiles: Array<{ stateCode: string; miles: number; weightTaxApplicable: boolean }>;
  routeCompliance: RouteComplianceResult | null;
  cargoType: string;
  isHazmat: boolean;
  weight: number;
}

export async function getActiveTripData(loadId: number): Promise<ActiveTripData | null> {
  const db = await getDb();
  if (!db) return null;

  const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
  if (!load) return null;

  const pickup = load.pickupLocation as any || {};
  const delivery = load.deliveryLocation as any || {};

  // Get state crossings
  const crossings = await db.select().from(stateCrossings)
    .where(eq(stateCrossings.loadId, loadId))
    .orderBy(stateCrossings.crossedAt);

  // Get compliance events
  const events = await db.select().from(tripComplianceEvents)
    .where(eq(tripComplianceEvents.loadId, loadId))
    .orderBy(desc(tripComplianceEvents.createdAt))
    .limit(50);

  // Get state miles
  const miles = await db.select().from(tripStateMiles)
    .where(eq(tripStateMiles.loadId, loadId));

  // Determine current state from latest crossing or origin
  const lastCrossing = crossings[crossings.length - 1];
  const currentState = lastCrossing?.toState || pickup.state || "";

  const isHazmat = load.cargoType === "hazmat" || load.cargoType === "chemicals" || load.cargoType === "petroleum";

  // Route compliance analysis
  let routeCompliance: RouteComplianceResult | null = null;
  try {
    routeCompliance = await analyzeRouteCompliance(loadId);
  } catch (_) { /* non-critical */ }

  return {
    loadId: load.id,
    loadNumber: load.loadNumber,
    status: load.status,
    origin: { city: pickup.city || "", state: pickup.state || "", lat: pickup.lat || 0, lng: pickup.lng || 0 },
    destination: { city: delivery.city || "", state: delivery.state || "", lat: delivery.lat || 0, lng: delivery.lng || 0 },
    currentState,
    isInterstate: (pickup.state || "") !== (delivery.state || ""),
    statesCrossed: crossings.map(c => ({
      fromState: c.fromState || "",
      toState: c.toState || "",
      crossedAt: c.crossedAt?.toISOString() || "",
    })),
    complianceEvents: events.map(e => ({
      type: e.eventType,
      stateCode: e.stateCode || "",
      detail: (e.details as any)?.taxName || e.eventType.replace(/_/g, " "),
      requiresAction: !!e.requiresAction,
      createdAt: e.createdAt?.toISOString() || "",
    })),
    stateMiles: miles.map(m => ({
      stateCode: m.stateCode,
      miles: Number(m.miles),
      weightTaxApplicable: !!m.weightTaxApplicable,
    })),
    routeCompliance,
    cargoType: load.cargoType,
    isHazmat,
    weight: Number(load.weight) || 0,
  };
}

// ═══════════════════════════════════════════════════════════════
// IFTA QUARTERLY REPORT
// ═══════════════════════════════════════════════════════════════

export async function generateIFTAReport(opts: { vehicleId?: number; startDate: Date; endDate: Date }) {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [];
  if (opts.vehicleId) conditions.push(eq(tripStateMiles.vehicleId, opts.vehicleId));

  const rows = await db.select({
    stateCode: tripStateMiles.stateCode,
    totalMiles: sql<number>`SUM(${tripStateMiles.miles})`,
    totalFuel: sql<number>`SUM(${tripStateMiles.fuelGallons})`,
    totalTolls: sql<number>`SUM(${tripStateMiles.tollCost})`,
    trips: sql<number>`COUNT(*)`,
  }).from(tripStateMiles)
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(tripStateMiles.stateCode)
    .orderBy(tripStateMiles.stateCode);

  return rows.map(r => ({
    stateCode: r.stateCode,
    stateName: STATE_NAMES[r.stateCode] || r.stateCode,
    totalMiles: Number(r.totalMiles),
    totalFuel: Number(r.totalFuel),
    totalTolls: Number(r.totalTolls),
    trips: Number(r.trips),
    mpg: Number(r.totalFuel) > 0 ? Number(r.totalMiles) / Number(r.totalFuel) : 0,
  }));
}
