/**
 * DRIVER & ESCORT MOBILE COMMAND CENTER (Task 21.1)
 *
 * Mobile-optimized data service for drivers and escorts:
 * 1. Active mission summary — current load, next stop, ETA
 * 2. Quick status actions — arrive, depart, break, incident
 * 3. Document checklist — BOL, DVIR, POD status
 * 4. HOS summary — hours remaining, next break, drive window
 * 5. Earnings tracker — today, this week, this month
 * 6. Upcoming assignments — next 3 loads in pipeline
 */

import { getDb } from "../db";
import { loads, hosState, documents, settlements } from "../../drizzle/schema";
import { eq, and, gte, desc, inArray, sql, isNull } from "drizzle-orm";

export interface ActiveMission {
  loadId: string;
  status: string;
  origin: { city: string; state: string };
  destination: { city: string; state: string };
  currentStop: { name: string; city: string; state: string; type: "pickup" | "delivery" | "rest" | "fuel" };
  nextStop: { name: string; city: string; state: string; eta: string; milesRemaining: number } | null;
  commodity: string;
  weight: number;
  hazmat: boolean;
  rate: number;
  pickupTime: string;
  estimatedDelivery: string;
  milesTotal: number;
  milesCompleted: number;
  progressPct: number;
}

export interface HOSSummary {
  drivingHoursLeft: number;
  onDutyHoursLeft: number;
  nextBreakDue: string;
  breakMinutesLeft: number;
  cycleHoursUsed: number;
  cycleLimit: number;
  restartAvailable: boolean;
  status: "driving" | "on_duty" | "sleeper" | "off_duty";
  violations: number;
}

export interface DocumentChecklist {
  items: {
    id: string;
    name: string;
    required: boolean;
    completed: boolean;
    completedAt: string | null;
    category: "pre_trip" | "loading" | "transit" | "delivery";
  }[];
  completionPct: number;
}

export interface EarningsTracker {
  today: number;
  thisWeek: number;
  thisMonth: number;
  loadsToday: number;
  loadsThisWeek: number;
  milesToday: number;
  milesThisWeek: number;
  rpmAvg: number;
  pendingSettlement: number;
}

export interface UpcomingAssignment {
  loadId: string;
  origin: { city: string; state: string };
  destination: { city: string; state: string };
  pickupTime: string;
  rate: number;
  distance: number;
  commodity: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  enabled: boolean;
  description: string;
}

export interface MobileCommandData {
  activeMission: ActiveMission | null;
  hos: HOSSummary;
  documents: DocumentChecklist;
  earnings: EarningsTracker;
  upcoming: UpcomingAssignment[];
  quickActions: QuickAction[];
  alerts: { id: string; message: string; severity: "info" | "warning" | "urgent"; createdAt: string }[];
}

// ── Data Generation ──

const ACTIVE_LOAD_STATUSES = [
  "accepted", "assigned", "confirmed",
  "en_route_pickup", "at_pickup", "pickup_checkin", "loading", "loaded",
  "in_transit", "transit_hold",
  "at_delivery", "delivery_checkin", "unloading", "unloaded",
  "pod_pending",
] as const;

async function generateActiveMission(userId: number): Promise<ActiveMission | null> {
  const db = await getDb() as any;
  const [activeLoad] = await db
    .select()
    .from(loads)
    .where(
      and(
        eq(loads.driverId, userId),
        inArray(loads.status, [...ACTIVE_LOAD_STATUSES]),
        isNull(loads.deletedAt),
      ),
    )
    .orderBy(desc(loads.updatedAt))
    .limit(1);

  if (!activeLoad) return null;

  const pickup = activeLoad.pickupLocation as { city: string; state: string } | null;
  const delivery = activeLoad.deliveryLocation as { city: string; state: string } | null;
  const totalMiles = Number(activeLoad.distance) || 0;

  // Estimate progress from status
  const statusProgress: Record<string, number> = {
    accepted: 0, assigned: 0, confirmed: 5,
    en_route_pickup: 10, at_pickup: 15, pickup_checkin: 18, loading: 20, loaded: 25,
    in_transit: 55, transit_hold: 55,
    at_delivery: 85, delivery_checkin: 88, unloading: 92, unloaded: 95,
    pod_pending: 98,
  };
  const progressPct = statusProgress[activeLoad.status] ?? 0;

  return {
    loadId: activeLoad.loadNumber,
    status: activeLoad.status,
    origin: { city: pickup?.city ?? "Unknown", state: pickup?.state ?? "" },
    destination: { city: delivery?.city ?? "Unknown", state: delivery?.state ?? "" },
    currentStop: {
      name: activeLoad.status.startsWith("at_delivery") || activeLoad.status === "unloading"
        ? "Delivery"
        : "Pickup",
      city: activeLoad.status.startsWith("at_delivery") || activeLoad.status === "unloading"
        ? (delivery?.city ?? "Unknown")
        : (pickup?.city ?? "Unknown"),
      state: activeLoad.status.startsWith("at_delivery") || activeLoad.status === "unloading"
        ? (delivery?.state ?? "")
        : (pickup?.state ?? ""),
      type: activeLoad.status.includes("delivery") || activeLoad.status === "unloading" ? "delivery" : "pickup",
    },
    nextStop: activeLoad.status.includes("pickup") || activeLoad.status === "loading" || activeLoad.status === "loaded"
      ? {
          name: "Delivery",
          city: delivery?.city ?? "Unknown",
          state: delivery?.state ?? "",
          eta: activeLoad.estimatedDeliveryDate?.toISOString() ?? "",
          milesRemaining: Math.round(totalMiles * (1 - progressPct / 100)),
        }
      : null,
    commodity: activeLoad.commodityName ?? activeLoad.cargoType ?? "General",
    weight: Number(activeLoad.weight) || 0,
    hazmat: activeLoad.cargoType === "hazmat" || !!activeLoad.hazmatClass,
    rate: Number(activeLoad.rate) || 0,
    pickupTime: activeLoad.pickupDate?.toISOString() ?? "",
    estimatedDelivery: activeLoad.estimatedDeliveryDate?.toISOString() ?? "",
    milesTotal: totalMiles,
    milesCompleted: Math.round(totalMiles * progressPct / 100),
    progressPct,
  };
}

async function generateHOS(userId: number): Promise<HOSSummary> {
  const db = await getDb() as any;

  // Query current HOS state for this driver
  const [state] = await db
    .select()
    .from(hosState)
    .where(eq(hosState.userId, userId))
    .limit(1);

  if (!state) {
    // No HOS record — return fresh/default (full hours available)
    return {
      drivingHoursLeft: 11,
      onDutyHoursLeft: 14,
      nextBreakDue: "",
      breakMinutesLeft: 30,
      cycleHoursUsed: 0,
      cycleLimit: 70,
      restartAvailable: false,
      status: "off_duty",
      violations: 0,
    };
  }

  const drivingUsedHours = (state.drivingMinutesToday ?? 0) / 60;
  const onDutyUsedHours = (state.onDutyMinutesToday ?? 0) / 60;
  const cycleUsedHours = (state.cycleMinutesUsed ?? 0) / 60;
  const cycleLimit = (state.cycleDays ?? 8) === 8 ? 70 : 60;
  const minutesSinceBreak = state.drivingMinutesSinceBreak ?? 0;
  const breakMinutesLeft = Math.max(0, 480 - minutesSinceBreak); // 8 hours max before 30-min break

  // Calculate next break due time
  let nextBreakDue = "";
  if (breakMinutesLeft > 0 && state.lastBreakAt) {
    const next = new Date(state.lastBreakAt.getTime() + 8 * 60 * 60 * 1000);
    nextBreakDue = next.toISOString();
  }

  // Count violations from JSON array
  const violationCount = Array.isArray(state.violations) ? state.violations.length : 0;

  // Determine if 34-hour restart is available (cycleUsed > 80% of limit)
  const restartAvailable = cycleUsedHours >= cycleLimit * 0.8;

  return {
    drivingHoursLeft: Math.max(0, +(11 - drivingUsedHours).toFixed(1)),
    onDutyHoursLeft: Math.max(0, +(14 - onDutyUsedHours).toFixed(1)),
    nextBreakDue,
    breakMinutesLeft: Math.round(breakMinutesLeft),
    cycleHoursUsed: +cycleUsedHours.toFixed(1),
    cycleLimit,
    restartAvailable,
    status: state.status as HOSSummary["status"],
    violations: violationCount,
  };
}

async function generateDocuments(userId: number, activeLoadId?: number): Promise<DocumentChecklist> {
  const db = await getDb() as any;

  // Standard checklist template
  const template = [
    { id: "dvir-pre", name: "Pre-Trip DVIR", required: true, category: "pre_trip" as const, dbType: "dvir" },
    { id: "bol", name: "Bill of Lading", required: true, category: "loading" as const, dbType: "bol" },
    { id: "seal-verify", name: "Seal Verification", required: true, category: "loading" as const, dbType: "seal_verification" },
    { id: "hazmat-cert", name: "Hazmat Placard Check", required: false, category: "loading" as const, dbType: "hazmat_cert" },
    { id: "weight-ticket", name: "Weight Ticket", required: true, category: "loading" as const, dbType: "weight_ticket" },
    { id: "pod", name: "Proof of Delivery", required: true, category: "delivery" as const, dbType: "pod" },
    { id: "dvir-post", name: "Post-Trip DVIR", required: true, category: "delivery" as const, dbType: "dvir_post" },
  ];

  // Query documents uploaded by this user (optionally for active load)
  const conditions = [eq(documents.userId, userId), isNull(documents.deletedAt)];
  if (activeLoadId) {
    conditions.push(eq(documents.loadId, activeLoadId));
  }

  const userDocs = await db
    .select({ type: documents.type, createdAt: documents.createdAt })
    .from(documents)
    .where(and(...conditions));

  const uploadedTypes = new Map<string, string>();
  for (const d of userDocs) {
    if (d.type) uploadedTypes.set(d.type.toLowerCase(), d.createdAt?.toISOString() ?? null!);
  }

  const items = template.map((t) => ({
    id: t.id,
    name: t.name,
    required: t.required,
    category: t.category,
    completed: uploadedTypes.has(t.dbType) || uploadedTypes.has(t.id),
    completedAt: uploadedTypes.get(t.dbType) ?? uploadedTypes.get(t.id) ?? null,
  }));

  const reqItems = items.filter((i) => i.required);
  const completionPct = reqItems.length > 0
    ? Math.round((reqItems.filter((i) => i.completed).length / reqItems.length) * 100)
    : 0;

  return { items, completionPct };
}

async function generateEarnings(userId: number): Promise<EarningsTracker> {
  const db = await getDb() as any;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = now.getDay(); // 0=Sun
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - dayOfWeek);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Query completed/delivered loads for this driver in relevant periods
  const completedStatuses = ["delivered", "invoiced", "paid", "complete"] as const;

  const driverLoads = await db
    .select({
      rate: loads.rate,
      distance: loads.distance,
      deliveryDate: loads.actualDeliveryDate,
    })
    .from(loads)
    .where(
      and(
        eq(loads.driverId, userId),
        inArray(loads.status, [...completedStatuses]),
        gte(loads.actualDeliveryDate, monthStart),
        isNull(loads.deletedAt),
      ),
    );

  let today = 0, thisWeek = 0, thisMonth = 0;
  let loadsToday = 0, loadsThisWeek = 0;
  let milesToday = 0, milesThisWeek = 0;
  let totalMiles = 0, totalRate = 0;

  for (const l of driverLoads) {
    const r = Number(l.rate) || 0;
    const d = Number(l.distance) || 0;
    const delivered = l.deliveryDate ? new Date(l.deliveryDate) : null;

    thisMonth += r;
    totalRate += r;
    totalMiles += d;

    if (delivered && delivered >= weekStart) {
      thisWeek += r;
      loadsThisWeek++;
      milesThisWeek += d;
    }
    if (delivered && delivered >= todayStart) {
      today += r;
      loadsToday++;
      milesToday += d;
    }
  }

  const rpmAvg = totalMiles > 0 ? +(totalRate / totalMiles).toFixed(2) : 0;

  // Pending settlement: sum of settlements with status "pending" for this driver
  const [pendingRow] = await db
    .select({ total: sql<string>`COALESCE(SUM(${settlements.carrierPayment}), 0)` })
    .from(settlements)
    .where(
      and(
        eq(settlements.driverId, userId),
        eq(settlements.status, "pending"),
      ),
    );

  const pendingSettlement = Number(pendingRow?.total) || 0;

  return {
    today: +today.toFixed(2),
    thisWeek: +thisWeek.toFixed(2),
    thisMonth: +thisMonth.toFixed(2),
    loadsToday,
    loadsThisWeek,
    milesToday: +milesToday.toFixed(2),
    milesThisWeek: +milesThisWeek.toFixed(2),
    rpmAvg,
    pendingSettlement: +pendingSettlement.toFixed(2),
  };
}

async function generateUpcoming(userId: number): Promise<UpcomingAssignment[]> {
  const db = await getDb() as any;

  const upcomingStatuses = ["accepted", "assigned", "confirmed"] as const;

  const upcoming = await db
    .select({
      loadNumber: loads.loadNumber,
      pickupLocation: loads.pickupLocation,
      deliveryLocation: loads.deliveryLocation,
      pickupDate: loads.pickupDate,
      rate: loads.rate,
      distance: loads.distance,
      commodityName: loads.commodityName,
      cargoType: loads.cargoType,
    })
    .from(loads)
    .where(
      and(
        eq(loads.driverId, userId),
        inArray(loads.status, [...upcomingStatuses]),
        gte(loads.pickupDate, new Date()),
        isNull(loads.deletedAt),
      ),
    )
    .orderBy(loads.pickupDate)
    .limit(3);

  return upcoming.map((l) => {
    const pickup = l.pickupLocation as { city: string; state: string } | null;
    const delivery = l.deliveryLocation as { city: string; state: string } | null;
    return {
      loadId: l.loadNumber,
      origin: { city: pickup?.city ?? "Unknown", state: pickup?.state ?? "" },
      destination: { city: delivery?.city ?? "Unknown", state: delivery?.state ?? "" },
      pickupTime: l.pickupDate?.toISOString() ?? "",
      rate: Number(l.rate) || 0,
      distance: Number(l.distance) || 0,
      commodity: l.commodityName ?? l.cargoType ?? "General",
    };
  });
}

// ── Main API ──

export async function getMobileCommandData(userId: number): Promise<MobileCommandData> {
  const [mission, hos, earnings, upcoming] = await Promise.all([
    generateActiveMission(userId),
    generateHOS(userId),
    generateEarnings(userId),
    generateUpcoming(userId),
  ]);

  // For documents, pass the active load's DB id if available
  let activeLoadDbId: number | undefined;
  if (mission) {
    const db = await getDb() as any;
    if (!db) return { mission, hos, documents, earnings, upcoming };
    const [row] = await db
      .select({ id: loads.id })
      .from(loads)
      .where(eq(loads.loadNumber, mission.loadId))
      .limit(1);
    activeLoadDbId = row?.id;
  }
  const docs = await generateDocuments(userId, activeLoadDbId);

  const quickActions: QuickAction[] = [
    { id: "arrive", label: "Arrive", icon: "MapPin", color: "emerald", enabled: !!mission, description: "Mark arrival at current stop" },
    { id: "depart", label: "Depart", icon: "Truck", color: "blue", enabled: !!mission, description: "Mark departure from stop" },
    { id: "break", label: "Break", icon: "Coffee", color: "amber", enabled: true, description: "Start 30-min rest break" },
    { id: "incident", label: "Incident", icon: "AlertTriangle", color: "red", enabled: true, description: "Report safety incident" },
    { id: "fuel", label: "Fuel Stop", icon: "Fuel", color: "purple", enabled: true, description: "Log fuel purchase" },
    { id: "photo", label: "Photo", icon: "Camera", color: "cyan", enabled: true, description: "Capture inspection photo" },
  ];

  const alerts: MobileCommandData["alerts"] = [];
  if (hos.drivingHoursLeft < 2) {
    alerts.push({ id: "hos-low", message: `Only ${hos.drivingHoursLeft}h driving time remaining`, severity: "warning", createdAt: new Date().toISOString() });
  }
  if (hos.violations > 0) {
    alerts.push({ id: "hos-viol", message: "HOS violation detected — contact dispatch", severity: "urgent", createdAt: new Date().toISOString() });
  }

  return {
    activeMission: mission,
    hos,
    documents: docs,
    earnings,
    upcoming,
    quickActions,
    alerts,
  };
}
