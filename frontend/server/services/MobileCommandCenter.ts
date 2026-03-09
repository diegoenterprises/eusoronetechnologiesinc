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
  // Real implementation: query active loads assigned to driver
  return null;
}

function generateHOS(): HOSSummary {
  // Real implementation: query ELD/hos_logs for current driver
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
    completed: false,
    completedAt: null,
  }));

  const reqItems = items.filter(i => i.required);
  const completionPct = Math.round((reqItems.filter(i => i.completed).length / reqItems.length) * 100);

  return { items, completionPct };
}

function generateEarnings(): EarningsTracker {
  // Real implementation: query payments/settlements for current driver
  return {
    today: 0, thisWeek: 0, thisMonth: 0,
    loadsToday: 0, loadsThisWeek: 0,
    milesToday: 0, milesThisWeek: 0,
    rpmAvg: 0, pendingSettlement: 0,
  };
}

function generateUpcoming(): UpcomingAssignment[] {
  const lanes = [
    { o: { city: "Dallas", state: "TX" }, d: { city: "Memphis", state: "TN" }, dist: 450 },
    { o: { city: "Memphis", state: "TN" }, d: { city: "Atlanta", state: "GA" }, dist: 390 },
    { o: { city: "Atlanta", state: "GA" }, d: { city: "Charlotte", state: "NC" }, dist: 245 },
  ];
  // Real implementation: query upcoming assigned loads for driver
  return [];
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
