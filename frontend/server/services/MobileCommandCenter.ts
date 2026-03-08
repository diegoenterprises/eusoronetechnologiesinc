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

function generateActiveMission(): ActiveMission | null {
  if (Math.random() > 0.2) {
    const total = 400 + Math.round(Math.random() * 800);
    const completed = Math.round(total * (0.2 + Math.random() * 0.6));
    return {
      loadId: `LD-${40000 + Math.floor(Math.random() * 9999)}`,
      status: completed > total * 0.8 ? "approaching_delivery" : completed > total * 0.3 ? "in_transit" : "en_route_pickup",
      origin: { city: "Houston", state: "TX" },
      destination: { city: "Dallas", state: "TX" },
      currentStop: { name: "I-45 Rest Area", city: "Corsicana", state: "TX", type: "rest" },
      nextStop: {
        name: "Dallas Distribution Center",
        city: "Dallas", state: "TX",
        eta: new Date(Date.now() + 3 * 3600000).toISOString(),
        milesRemaining: total - completed,
      },
      commodity: "Electronics",
      weight: 32000,
      hazmat: false,
      rate: Math.round(total * 2.65),
      pickupTime: new Date(Date.now() - 4 * 3600000).toISOString(),
      estimatedDelivery: new Date(Date.now() + 3 * 3600000).toISOString(),
      milesTotal: total,
      milesCompleted: completed,
      progressPct: Math.round((completed / total) * 100),
    };
  }
  return null;
}

function generateHOS(): HOSSummary {
  const drivingLeft = 3 + Math.random() * 8;
  const onDutyLeft = drivingLeft + 1 + Math.random() * 2;
  const cycleUsed = 30 + Math.random() * 30;
  return {
    drivingHoursLeft: Math.round(drivingLeft * 10) / 10,
    onDutyHoursLeft: Math.round(onDutyLeft * 10) / 10,
    nextBreakDue: new Date(Date.now() + (2 + Math.random() * 3) * 3600000).toISOString(),
    breakMinutesLeft: Math.round(30 - Math.random() * 15),
    cycleHoursUsed: Math.round(cycleUsed * 10) / 10,
    cycleLimit: 70,
    restartAvailable: cycleUsed > 50,
    status: Math.random() > 0.3 ? "driving" : "on_duty",
    violations: Math.random() > 0.85 ? 1 : 0,
  };
}

function generateDocuments(): DocumentChecklist {
  const items = [
    { id: "dvir-pre", name: "Pre-Trip DVIR", required: true, category: "pre_trip" as const },
    { id: "bol", name: "Bill of Lading", required: true, category: "loading" as const },
    { id: "seal-verify", name: "Seal Verification", required: true, category: "loading" as const },
    { id: "hazmat-cert", name: "Hazmat Placard Check", required: false, category: "loading" as const },
    { id: "weight-ticket", name: "Weight Ticket", required: true, category: "loading" as const },
    { id: "pod", name: "Proof of Delivery", required: true, category: "delivery" as const },
    { id: "dvir-post", name: "Post-Trip DVIR", required: true, category: "delivery" as const },
  ].map(item => ({
    ...item,
    completed: Math.random() > 0.4,
    completedAt: Math.random() > 0.4 ? new Date(Date.now() - Math.random() * 8 * 3600000).toISOString() : null,
  }));

  const reqItems = items.filter(i => i.required);
  const completionPct = Math.round((reqItems.filter(i => i.completed).length / reqItems.length) * 100);

  return { items, completionPct };
}

function generateEarnings(): EarningsTracker {
  const todayLoads = Math.floor(Math.random() * 2) + 1;
  const weekLoads = todayLoads + Math.floor(Math.random() * 8);
  const todayMiles = todayLoads * (200 + Math.random() * 400);
  const weekMiles = weekLoads * (200 + Math.random() * 400);
  const rpm = 2.40 + Math.random() * 0.80;
  return {
    today: Math.round(todayMiles * rpm),
    thisWeek: Math.round(weekMiles * rpm),
    thisMonth: Math.round(weekMiles * rpm * 3.5),
    loadsToday: todayLoads,
    loadsThisWeek: weekLoads,
    milesToday: Math.round(todayMiles),
    milesThisWeek: Math.round(weekMiles),
    rpmAvg: Math.round(rpm * 100) / 100,
    pendingSettlement: Math.round(weekMiles * rpm * 0.4),
  };
}

function generateUpcoming(): UpcomingAssignment[] {
  const lanes = [
    { o: { city: "Dallas", state: "TX" }, d: { city: "Memphis", state: "TN" }, dist: 450 },
    { o: { city: "Memphis", state: "TN" }, d: { city: "Atlanta", state: "GA" }, dist: 390 },
    { o: { city: "Atlanta", state: "GA" }, d: { city: "Charlotte", state: "NC" }, dist: 245 },
  ];
  return lanes.slice(0, 1 + Math.floor(Math.random() * 2)).map((lane, i) => ({
    loadId: `LD-${70000 + i}`,
    origin: lane.o,
    destination: lane.d,
    pickupTime: new Date(Date.now() + (24 + i * 24) * 3600000).toISOString(),
    rate: Math.round(lane.dist * (2.30 + Math.random() * 0.80)),
    distance: lane.dist,
    commodity: ["Dry Goods", "Auto Parts", "Food Products"][i] || "General",
  }));
}

// ── Main API ──

export function getMobileCommandData(): MobileCommandData {
  const mission = generateActiveMission();
  const hos = generateHOS();

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
    documents: generateDocuments(),
    earnings: generateEarnings(),
    upcoming: generateUpcoming(),
    quickActions,
    alerts,
  };
}
