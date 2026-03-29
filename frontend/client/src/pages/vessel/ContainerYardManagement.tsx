/**
 * CONTAINER YARD MANAGEMENT — Yard Operations Center
 * Stacking, reefer monitoring, hazmat zones, equipment tracking,
 * dwell time analysis, and stack planning optimization.
 * Role: PORT_MASTER / TERMINAL_MANAGER
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Container, Search, AlertTriangle, Thermometer, ThermometerSnowflake,
  Flame, BarChart3, Clock, CheckCircle2, XCircle, RefreshCw,
  Activity, Eye, TrendingUp, TrendingDown, Layers, Box,
  Gauge, Filter, ArrowUpDown, Zap, BatteryCharging,
  ShieldAlert, MapPin, Truck, Wrench, Radio,
  Weight, ArrowUp, ArrowDown, Grid3X3, LayoutGrid,
  Timer, DollarSign, CalendarClock, PackageCheck, PackageX,
  Snowflake, Biohazard, Ship, RotateCcw, Power, Plug,
  CircleDot, Anchor, ChevronsUp, ChevronsDown, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

/* ─── Constants ─── */
const now = new Date();
const todayStr = now.toLocaleDateString("en-US", {
  weekday: "long", month: "long", day: "numeric", year: "numeric",
});

type YardSection = "import" | "export" | "reefer" | "hazmat" | "empty" | "transshipment";
type AlarmStatus = "normal" | "warning" | "critical" | "offline";
type EquipmentStatus = "operating" | "idle" | "maintenance" | "breakdown";
type EquipmentType = "rtg" | "reach_stacker" | "terminal_tractor" | "straddle_carrier";
type StackCompliance = "compliant" | "warning" | "violation";
type IMDGClass = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type PowerStatus = "connected" | "disconnected" | "backup";

/* ─── Interfaces ─── */
interface YardBlock {
  id: string;
  section: YardSection;
  label: string;
  capacity: number;
  occupied: number;
  rows: number;
  bays: number;
  tiers: number;
}

interface ReeferContainer {
  id: string;
  containerNumber: string;
  size: "20" | "40" | "40HC";
  setTemp: number;
  actualTemp: number;
  alarmStatus: AlarmStatus;
  powerStatus: PowerStatus;
  commodity: string;
  yardBlock: string;
  position: string;
  pluggedInSince: string;
  lastCheck: string;
}

interface HazmatContainer {
  id: string;
  containerNumber: string;
  imdgClass: IMDGClass;
  unNumber: string;
  properShippingName: string;
  segregationCompliant: boolean;
  lastInspection: string;
  isolationZone: string;
  yardBlock: string;
  position: string;
  specialHandling: string[];
}

interface DwellEntry {
  id: string;
  containerNumber: string;
  type: "import" | "export" | "empty";
  arrivalDate: string;
  freeTimeDays: number;
  dwellDays: number;
  daysOver: number;
  dailyDemurrage: number;
  totalDemurrage: number;
  shipper: string;
  bookingRef: string;
}

interface EquipmentEntry {
  id: string;
  equipmentId: string;
  type: EquipmentType;
  name: string;
  status: EquipmentStatus;
  operator: string;
  currentBlock: string;
  fuelLevel: number;
  hoursToday: number;
  movesToday: number;
  lastMaintenance: string;
}

interface StackEntry {
  id: string;
  yardBlock: string;
  bay: number;
  row: string;
  tier: number;
  containerNumber: string;
  weight: number;
  size: "20" | "40" | "40HC";
  type: "import" | "export" | "reefer" | "hazmat" | "empty";
  compliance: StackCompliance;
  issue: string | null;
  accessibilityScore: number;
}

/* ─── Mock Data ─── */
const YARD_BLOCKS: YardBlock[] = [
  { id: "YB-01", section: "import", label: "Import A", capacity: 480, occupied: 387, rows: 6, bays: 40, tiers: 5 },
  { id: "YB-02", section: "import", label: "Import B", capacity: 480, occupied: 312, rows: 6, bays: 40, tiers: 5 },
  { id: "YB-03", section: "export", label: "Export A", capacity: 360, occupied: 298, rows: 6, bays: 30, tiers: 5 },
  { id: "YB-04", section: "export", label: "Export B", capacity: 360, occupied: 245, rows: 6, bays: 30, tiers: 5 },
  { id: "YB-05", section: "reefer", label: "Reefer Zone", capacity: 200, occupied: 156, rows: 4, bays: 25, tiers: 4 },
  { id: "YB-06", section: "hazmat", label: "Hazmat Zone", capacity: 120, occupied: 47, rows: 4, bays: 15, tiers: 3 },
  { id: "YB-07", section: "empty", label: "Empty Stack A", capacity: 600, occupied: 534, rows: 6, bays: 50, tiers: 6 },
  { id: "YB-08", section: "empty", label: "Empty Stack B", capacity: 600, occupied: 421, rows: 6, bays: 50, tiers: 6 },
  { id: "YB-09", section: "transshipment", label: "Transship A", capacity: 240, occupied: 189, rows: 6, bays: 20, tiers: 4 },
  { id: "YB-10", section: "transshipment", label: "Transship B", capacity: 240, occupied: 134, rows: 6, bays: 20, tiers: 4 },
];

const REEFER_CONTAINERS: ReeferContainer[] = [
  { id: "RC-01", containerNumber: "MSCU7234561", size: "40HC", setTemp: -18, actualTemp: -17.8, alarmStatus: "normal", powerStatus: "connected", commodity: "Frozen Seafood", yardBlock: "YB-05", position: "R02-B14-T2", pluggedInSince: "2026-03-27 08:15", lastCheck: "2026-03-29 06:00" },
  { id: "RC-02", containerNumber: "MAEU4129873", size: "40", setTemp: -25, actualTemp: -22.1, alarmStatus: "warning", powerStatus: "connected", commodity: "Ice Cream", yardBlock: "YB-05", position: "R01-B08-T1", pluggedInSince: "2026-03-26 14:30", lastCheck: "2026-03-29 06:00" },
  { id: "RC-03", containerNumber: "CMAU8765432", size: "40HC", setTemp: 2, actualTemp: 2.3, alarmStatus: "normal", powerStatus: "connected", commodity: "Fresh Fruit", yardBlock: "YB-05", position: "R03-B22-T3", pluggedInSince: "2026-03-28 19:00", lastCheck: "2026-03-29 06:00" },
  { id: "RC-04", containerNumber: "HLCU6543219", size: "20", setTemp: -20, actualTemp: -8.5, alarmStatus: "critical", powerStatus: "backup", commodity: "Frozen Poultry", yardBlock: "YB-05", position: "R04-B03-T1", pluggedInSince: "2026-03-25 10:00", lastCheck: "2026-03-29 05:30" },
  { id: "RC-05", containerNumber: "OOLU3456789", size: "40HC", setTemp: 4, actualTemp: 4.1, alarmStatus: "normal", powerStatus: "connected", commodity: "Pharmaceuticals", yardBlock: "YB-05", position: "R01-B18-T2", pluggedInSince: "2026-03-28 06:45", lastCheck: "2026-03-29 06:00" },
  { id: "RC-06", containerNumber: "EISU9871234", size: "40", setTemp: -30, actualTemp: -30.2, alarmStatus: "normal", powerStatus: "connected", commodity: "Frozen Tuna", yardBlock: "YB-05", position: "R02-B05-T1", pluggedInSince: "2026-03-27 22:00", lastCheck: "2026-03-29 06:00" },
  { id: "RC-07", containerNumber: "TCKU1237896", size: "40HC", setTemp: 0, actualTemp: 0, alarmStatus: "offline", powerStatus: "disconnected", commodity: "Dairy Products", yardBlock: "YB-05", position: "R03-B11-T1", pluggedInSince: "2026-03-24 16:00", lastCheck: "2026-03-28 22:00" },
];

const HAZMAT_CONTAINERS: HazmatContainer[] = [
  { id: "HZ-01", containerNumber: "TRIU6547891", imdgClass: "3", unNumber: "UN1203", properShippingName: "Gasoline", segregationCompliant: true, lastInspection: "2026-03-29 04:00", isolationZone: "HZ-A1", yardBlock: "YB-06", position: "R01-B02-T1", specialHandling: ["No smoking", "Fire extinguisher required"] },
  { id: "HZ-02", containerNumber: "MSCU8912345", imdgClass: "8", unNumber: "UN1789", properShippingName: "Hydrochloric Acid", segregationCompliant: true, lastInspection: "2026-03-28 16:00", isolationZone: "HZ-B2", yardBlock: "YB-06", position: "R03-B08-T1", specialHandling: ["Corrosive", "PPE required"] },
  { id: "HZ-03", containerNumber: "CMAU3456781", imdgClass: "2", unNumber: "UN1075", properShippingName: "LPG", segregationCompliant: false, lastInspection: "2026-03-27 10:00", isolationZone: "HZ-A3", yardBlock: "YB-06", position: "R02-B05-T1", specialHandling: ["Flammable gas", "Pressure vessel"] },
  { id: "HZ-04", containerNumber: "HLCU7654328", imdgClass: "6", unNumber: "UN2810", properShippingName: "Toxic Liquid", segregationCompliant: true, lastInspection: "2026-03-29 02:00", isolationZone: "HZ-C1", yardBlock: "YB-06", position: "R04-B12-T1", specialHandling: ["Toxic", "Full containment"] },
  { id: "HZ-05", containerNumber: "OOLU4561237", imdgClass: "1", unNumber: "UN0027", properShippingName: "Black Powder", segregationCompliant: true, lastInspection: "2026-03-29 06:00", isolationZone: "HZ-D1", yardBlock: "YB-06", position: "R01-B14-T1", specialHandling: ["Explosive", "Maximum isolation"] },
  { id: "HZ-06", containerNumber: "EISU5678912", imdgClass: "7", unNumber: "UN2915", properShippingName: "Radioactive Material Type A", segregationCompliant: true, lastInspection: "2026-03-29 05:00", isolationZone: "HZ-E1", yardBlock: "YB-06", position: "R04-B01-T1", specialHandling: ["Radioactive", "Radiation monitor", "Restricted access"] },
];

const DWELL_ENTRIES: DwellEntry[] = [
  { id: "DW-01", containerNumber: "MSCU4561237", type: "import", arrivalDate: "2026-03-14", freeTimeDays: 5, dwellDays: 15, daysOver: 10, dailyDemurrage: 150, totalDemurrage: 1500, shipper: "Global Foods Inc.", bookingRef: "BK-2026-45123" },
  { id: "DW-02", containerNumber: "MAEU7891234", type: "import", arrivalDate: "2026-03-17", freeTimeDays: 5, dwellDays: 12, daysOver: 7, dailyDemurrage: 150, totalDemurrage: 1050, shipper: "Asia Trade Co.", bookingRef: "BK-2026-45256" },
  { id: "DW-03", containerNumber: "HLCU3214567", type: "export", arrivalDate: "2026-03-20", freeTimeDays: 7, dwellDays: 9, daysOver: 2, dailyDemurrage: 125, totalDemurrage: 250, shipper: "EuroChem GmbH", bookingRef: "BK-2026-45389" },
  { id: "DW-04", containerNumber: "CMAU9876543", type: "import", arrivalDate: "2026-03-12", freeTimeDays: 5, dwellDays: 17, daysOver: 12, dailyDemurrage: 175, totalDemurrage: 2100, shipper: "Pacific Metals Ltd.", bookingRef: "BK-2026-44987" },
  { id: "DW-05", containerNumber: "TRIU1234567", type: "empty", arrivalDate: "2026-03-10", freeTimeDays: 3, dwellDays: 19, daysOver: 16, dailyDemurrage: 50, totalDemurrage: 800, shipper: "N/A", bookingRef: "N/A" },
  { id: "DW-06", containerNumber: "OOLU8765431", type: "import", arrivalDate: "2026-03-19", freeTimeDays: 5, dwellDays: 10, daysOver: 5, dailyDemurrage: 150, totalDemurrage: 750, shipper: "Sumitomo Corp.", bookingRef: "BK-2026-45412" },
];

const EQUIPMENT_LIST: EquipmentEntry[] = [
  { id: "EQ-01", equipmentId: "RTG-01", type: "rtg", name: "RTG Crane Alpha", status: "operating", operator: "Carlos Mendez", currentBlock: "YB-01", fuelLevel: 78, hoursToday: 6.5, movesToday: 142, lastMaintenance: "2026-03-22" },
  { id: "EQ-02", equipmentId: "RTG-02", type: "rtg", name: "RTG Crane Bravo", status: "operating", operator: "Jin Wei", currentBlock: "YB-03", fuelLevel: 65, hoursToday: 5.8, movesToday: 118, lastMaintenance: "2026-03-20" },
  { id: "EQ-03", equipmentId: "RTG-03", type: "rtg", name: "RTG Crane Charlie", status: "maintenance", operator: "—", currentBlock: "Maint. Bay", fuelLevel: 42, hoursToday: 0, movesToday: 0, lastMaintenance: "2026-03-29" },
  { id: "EQ-04", equipmentId: "RS-01", type: "reach_stacker", name: "Reach Stacker 1", status: "operating", operator: "Dmitri Volkov", currentBlock: "YB-07", fuelLevel: 55, hoursToday: 7.2, movesToday: 89, lastMaintenance: "2026-03-25" },
  { id: "EQ-05", equipmentId: "RS-02", type: "reach_stacker", name: "Reach Stacker 2", status: "idle", operator: "Maria Santos", currentBlock: "YB-08", fuelLevel: 91, hoursToday: 3.1, movesToday: 45, lastMaintenance: "2026-03-26" },
  { id: "EQ-06", equipmentId: "TT-01", type: "terminal_tractor", name: "Tractor Unit 1", status: "operating", operator: "Ahmed Hassan", currentBlock: "YB-09", fuelLevel: 38, hoursToday: 8.0, movesToday: 67, lastMaintenance: "2026-03-21" },
  { id: "EQ-07", equipmentId: "TT-02", type: "terminal_tractor", name: "Tractor Unit 2", status: "operating", operator: "Li Fang", currentBlock: "YB-02", fuelLevel: 72, hoursToday: 6.0, movesToday: 58, lastMaintenance: "2026-03-24" },
  { id: "EQ-08", equipmentId: "TT-03", type: "terminal_tractor", name: "Tractor Unit 3", status: "breakdown", operator: "—", currentBlock: "YB-04", fuelLevel: 15, hoursToday: 1.5, movesToday: 12, lastMaintenance: "2026-03-18" },
  { id: "EQ-09", equipmentId: "SC-01", type: "straddle_carrier", name: "Straddle Carrier 1", status: "operating", operator: "Ben Taylor", currentBlock: "YB-05", fuelLevel: 60, hoursToday: 5.0, movesToday: 76, lastMaintenance: "2026-03-23" },
];

const STACK_ENTRIES: StackEntry[] = [
  { id: "ST-01", yardBlock: "YB-01", bay: 12, row: "A", tier: 5, containerNumber: "MSCU1111111", weight: 28500, size: "40HC", type: "import", compliance: "violation", issue: "Heavy on top — 28.5t above 12t container", accessibilityScore: 32 },
  { id: "ST-02", yardBlock: "YB-01", bay: 12, row: "A", tier: 4, containerNumber: "MAEU2222222", weight: 12000, size: "40", type: "import", compliance: "warning", issue: "Blocked by non-priority containers", accessibilityScore: 55 },
  { id: "ST-03", yardBlock: "YB-03", bay: 8, row: "C", tier: 3, containerNumber: "CMAU3333333", weight: 22000, size: "40HC", type: "export", compliance: "compliant", issue: null, accessibilityScore: 88 },
  { id: "ST-04", yardBlock: "YB-01", bay: 22, row: "B", tier: 5, containerNumber: "HLCU4444444", weight: 30200, size: "40HC", type: "import", compliance: "violation", issue: "Exceeds max stack weight — tier 5 over limit", accessibilityScore: 20 },
  { id: "ST-05", yardBlock: "YB-03", bay: 15, row: "D", tier: 2, containerNumber: "OOLU5555555", weight: 18500, size: "20", type: "export", compliance: "compliant", issue: null, accessibilityScore: 95 },
  { id: "ST-06", yardBlock: "YB-07", bay: 30, row: "F", tier: 6, containerNumber: "TRIU6666666", weight: 2200, size: "20", type: "empty", compliance: "compliant", issue: null, accessibilityScore: 40 },
  { id: "ST-07", yardBlock: "YB-02", bay: 5, row: "A", tier: 4, containerNumber: "EISU7777777", weight: 26800, size: "40HC", type: "import", compliance: "warning", issue: "Adjacent to reefer — check ventilation clearance", accessibilityScore: 60 },
  { id: "ST-08", yardBlock: "YB-04", bay: 18, row: "B", tier: 1, containerNumber: "TCKU8888888", weight: 15200, size: "40", type: "export", compliance: "compliant", issue: null, accessibilityScore: 100 },
];

/* ─── Helpers ─── */
const pct = (o: number, c: number) => Math.round((o / c) * 100);
const fmt$ = (n: number) => `$${n.toLocaleString()}`;

const sectionMeta: Record<YardSection, { label: string; color: string; darkColor: string; icon: React.ReactNode }> = {
  import:        { label: "Import",        color: "bg-blue-100 text-blue-800 border-blue-300",      darkColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",      icon: <ArrowDown className="w-4 h-4" /> },
  export:        { label: "Export",        color: "bg-green-100 text-green-800 border-green-300",    darkColor: "bg-green-500/20 text-green-300 border-green-500/40",    icon: <ArrowUp className="w-4 h-4" /> },
  reefer:        { label: "Reefer",        color: "bg-cyan-100 text-cyan-800 border-cyan-300",      darkColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",      icon: <Snowflake className="w-4 h-4" /> },
  hazmat:        { label: "Hazmat",        color: "bg-red-100 text-red-800 border-red-300",         darkColor: "bg-red-500/20 text-red-300 border-red-500/40",         icon: <Flame className="w-4 h-4" /> },
  empty:         { label: "Empty",         color: "bg-gray-100 text-gray-800 border-gray-300",      darkColor: "bg-gray-500/20 text-gray-300 border-gray-500/40",      icon: <Box className="w-4 h-4" /> },
  transshipment: { label: "Transshipment", color: "bg-purple-100 text-purple-800 border-purple-300", darkColor: "bg-purple-500/20 text-purple-300 border-purple-500/40", icon: <RotateCcw className="w-4 h-4" /> },
};

const alarmBadge = (s: AlarmStatus, isLight: boolean) => {
  const map: Record<AlarmStatus, string> = {
    normal:   isLight ? "bg-emerald-100 text-emerald-800" : "bg-emerald-500/20 text-emerald-300",
    warning:  isLight ? "bg-amber-100 text-amber-800"     : "bg-amber-500/20 text-amber-300",
    critical: isLight ? "bg-red-100 text-red-800"         : "bg-red-500/20 text-red-300",
    offline:  isLight ? "bg-gray-200 text-gray-600"       : "bg-gray-600/30 text-gray-400",
  };
  return map[s];
};

const powerBadge = (s: PowerStatus, isLight: boolean) => {
  const map: Record<PowerStatus, string> = {
    connected:    isLight ? "bg-green-100 text-green-800"  : "bg-green-500/20 text-green-300",
    disconnected: isLight ? "bg-red-100 text-red-800"      : "bg-red-500/20 text-red-300",
    backup:       isLight ? "bg-amber-100 text-amber-800"  : "bg-amber-500/20 text-amber-300",
  };
  return map[s];
};

const equipStatusBadge = (s: EquipmentStatus, isLight: boolean) => {
  const map: Record<EquipmentStatus, string> = {
    operating:   isLight ? "bg-emerald-100 text-emerald-800" : "bg-emerald-500/20 text-emerald-300",
    idle:        isLight ? "bg-blue-100 text-blue-800"       : "bg-blue-500/20 text-blue-300",
    maintenance: isLight ? "bg-amber-100 text-amber-800"     : "bg-amber-500/20 text-amber-300",
    breakdown:   isLight ? "bg-red-100 text-red-800"         : "bg-red-500/20 text-red-300",
  };
  return map[s];
};

const complianceBadge = (s: StackCompliance, isLight: boolean) => {
  const map: Record<StackCompliance, string> = {
    compliant: isLight ? "bg-emerald-100 text-emerald-800" : "bg-emerald-500/20 text-emerald-300",
    warning:   isLight ? "bg-amber-100 text-amber-800"     : "bg-amber-500/20 text-amber-300",
    violation: isLight ? "bg-red-100 text-red-800"         : "bg-red-500/20 text-red-300",
  };
  return map[s];
};

const equipTypeLabel: Record<EquipmentType, string> = {
  rtg: "RTG Crane",
  reach_stacker: "Reach Stacker",
  terminal_tractor: "Terminal Tractor",
  straddle_carrier: "Straddle Carrier",
};

const imdgLabel: Record<IMDGClass, string> = {
  "1": "Explosives",
  "2": "Gases",
  "3": "Flammable Liquids",
  "4": "Flammable Solids",
  "5": "Oxidizers",
  "6": "Toxic Substances",
  "7": "Radioactive",
  "8": "Corrosives",
  "9": "Misc. Dangerous",
};

/* ─── Stat Card ─── */
function StatCard({ icon, label, value, sub, accent, isLight }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; accent: string; isLight: boolean;
}) {
  return (
    <Card className={cn(
      "border transition-all",
      isLight ? "bg-white border-gray-200 shadow-sm" : "bg-[#1a1f2e] border-gray-700/50",
    )}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-lg", accent)}>{icon}</div>
          <div className="min-w-0 flex-1">
            <p className={cn("text-xs font-medium truncate", isLight ? "text-gray-500" : "text-gray-400")}>{label}</p>
            <p className={cn("text-xl font-bold", isLight ? "text-gray-900" : "text-white")}>{value}</p>
            {sub && <p className={cn("text-xs mt-0.5", isLight ? "text-gray-400" : "text-gray-500")}>{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Fill Bar ─── */
function FillBar({ pct: percent, isLight }: { pct: number; isLight: boolean }) {
  const color = percent >= 90 ? "bg-red-500" : percent >= 75 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className={cn("h-2 rounded-full w-full", isLight ? "bg-gray-200" : "bg-gray-700")}>
      <div className={cn("h-2 rounded-full transition-all", color)} style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
  );
}

/* ─── Accessibility Score Bar ─── */
function AccessBar({ score, isLight }: { score: number; isLight: boolean }) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-1.5 rounded-full w-16", isLight ? "bg-gray-200" : "bg-gray-700")}>
        <div className={cn("h-1.5 rounded-full transition-all", color)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn("text-xs font-medium", isLight ? "text-gray-600" : "text-gray-400")}>{score}%</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function ContainerYardManagement() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  /* ─── Local State ─── */
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"container" | "booking" | "bl">("container");
  const [activeSection, setActiveSection] = useState<YardSection | "all">("all");
  const [reeferFilter, setReeferFilter] = useState<AlarmStatus | "all">("all");
  const [equipFilter, setEquipFilter] = useState<EquipmentType | "all">("all");
  const [dwellSort, setDwellSort] = useState<"daysOver" | "totalDemurrage">("daysOver");
  const [stackFilter, setStackFilter] = useState<StackCompliance | "all">("all");

  /* ─── Computed ─── */
  const totalCapacity = YARD_BLOCKS.reduce((s, b) => s + b.capacity, 0);
  const totalOccupied = YARD_BLOCKS.reduce((s, b) => s + b.occupied, 0);
  const yardUtilization = pct(totalOccupied, totalCapacity);

  const filteredBlocks = useMemo(() =>
    activeSection === "all" ? YARD_BLOCKS : YARD_BLOCKS.filter(b => b.section === activeSection),
  [activeSection]);

  const filteredReefers = useMemo(() =>
    reeferFilter === "all" ? REEFER_CONTAINERS : REEFER_CONTAINERS.filter(r => r.alarmStatus === reeferFilter),
  [reeferFilter]);

  const filteredEquipment = useMemo(() =>
    equipFilter === "all" ? EQUIPMENT_LIST : EQUIPMENT_LIST.filter(e => e.type === equipFilter),
  [equipFilter]);

  const sortedDwell = useMemo(() =>
    [...DWELL_ENTRIES].sort((a, b) => dwellSort === "daysOver" ? b.daysOver - a.daysOver : b.totalDemurrage - a.totalDemurrage),
  [dwellSort]);

  const filteredStacks = useMemo(() =>
    stackFilter === "all" ? STACK_ENTRIES : STACK_ENTRIES.filter(s => s.compliance === stackFilter),
  [stackFilter]);

  const reeferAlarms = REEFER_CONTAINERS.filter(r => r.alarmStatus === "critical" || r.alarmStatus === "warning").length;
  const hazmatNonCompliant = HAZMAT_CONTAINERS.filter(h => !h.segregationCompliant).length;
  const totalDemurrage = DWELL_ENTRIES.reduce((s, d) => s + d.totalDemurrage, 0);
  const equipOperating = EQUIPMENT_LIST.filter(e => e.status === "operating").length;
  const stackViolations = STACK_ENTRIES.filter(s => s.compliance === "violation").length;

  /* ─── Section Stats ─── */
  const sectionStats = useMemo(() => {
    const grouped: Record<YardSection, { capacity: number; occupied: number }> = {
      import: { capacity: 0, occupied: 0 },
      export: { capacity: 0, occupied: 0 },
      reefer: { capacity: 0, occupied: 0 },
      hazmat: { capacity: 0, occupied: 0 },
      empty: { capacity: 0, occupied: 0 },
      transshipment: { capacity: 0, occupied: 0 },
    };
    YARD_BLOCKS.forEach(b => {
      grouped[b.section].capacity += b.capacity;
      grouped[b.section].occupied += b.occupied;
    });
    return grouped;
  }, []);

  /* ─── Search Results ─── */
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toUpperCase().trim();
    const containers: { containerNumber: string; location: string; type: string; status: string }[] = [];

    // Search reefers
    REEFER_CONTAINERS.forEach(r => {
      if (r.containerNumber.includes(q)) {
        containers.push({ containerNumber: r.containerNumber, location: `${r.yardBlock} / ${r.position}`, type: "Reefer", status: r.alarmStatus });
      }
    });
    // Search hazmat
    HAZMAT_CONTAINERS.forEach(h => {
      if (h.containerNumber.includes(q)) {
        containers.push({ containerNumber: h.containerNumber, location: `${h.yardBlock} / ${h.position}`, type: `Hazmat (IMDG ${h.imdgClass})`, status: h.segregationCompliant ? "compliant" : "non-compliant" });
      }
    });
    // Search dwell
    DWELL_ENTRIES.forEach(d => {
      if (d.containerNumber.includes(q) || d.bookingRef.toUpperCase().includes(q)) {
        containers.push({ containerNumber: d.containerNumber, location: "Yard", type: d.type, status: `${d.daysOver}d over` });
      }
    });
    // Search stacks
    STACK_ENTRIES.forEach(s => {
      if (s.containerNumber.includes(q)) {
        containers.push({ containerNumber: s.containerNumber, location: `${s.yardBlock} Bay ${s.bay} Row ${s.row} Tier ${s.tier}`, type: s.type, status: s.compliance });
      }
    });

    return containers;
  }, [searchQuery]);

  /* ─── Styles ─── */
  const cardCls = cn("border transition-all", isLight ? "bg-white border-gray-200 shadow-sm" : "bg-[#1a1f2e] border-gray-700/50");
  const headerCls = cn("text-sm font-semibold", isLight ? "text-gray-900" : "text-white");
  const subCls = cn("text-xs", isLight ? "text-gray-500" : "text-gray-400");
  const tableBorder = isLight ? "border-gray-200" : "border-gray-700/50";
  const rowHover = isLight ? "hover:bg-gray-50" : "hover:bg-white/5";
  const inputCls = cn(
    "text-sm",
    isLight
      ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
      : "bg-[#0f1219] border-gray-700 text-white placeholder:text-gray-500",
  );

  return (
    <div className={cn("min-h-screen p-4 md:p-6 space-y-6", isLight ? "bg-gray-50" : "bg-[#0b0e14]")}>

      {/* ═══ 1. HEADER ═══ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-3 rounded-xl", isLight ? "bg-indigo-100" : "bg-indigo-500/20")}>
            <Container className={cn("w-7 h-7", isLight ? "text-indigo-600" : "text-indigo-400")} />
          </div>
          <div>
            <h1 className={cn("text-2xl font-bold", isLight ? "text-gray-900" : "text-white")}>Container Yard</h1>
            <p className={subCls}>{todayStr}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Utilization gauge */}
          <div className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl border", cardCls)}>
            <Gauge className={cn("w-5 h-5", yardUtilization >= 85 ? "text-red-400" : yardUtilization >= 70 ? "text-amber-400" : "text-emerald-400")} />
            <div>
              <p className={cn("text-xs font-medium", subCls)}>Yard Utilization</p>
              <p className={cn("text-lg font-bold", isLight ? "text-gray-900" : "text-white")}>
                {yardUtilization}%
              </p>
            </div>
            <div className="w-20">
              <FillBar pct={yardUtilization} isLight={isLight} />
            </div>
          </div>
          <Badge className={cn("text-xs px-3 py-1.5", isLight ? "bg-indigo-100 text-indigo-800" : "bg-indigo-500/20 text-indigo-300")}>
            {totalOccupied.toLocaleString()} / {totalCapacity.toLocaleString()} TEU
          </Badge>
          <Button variant="outline" size="sm" className={cn("gap-1.5", isLight ? "" : "border-gray-700 text-gray-300 hover:bg-white/5")}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* ═══ KPI ROW ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={<Layers className="w-5 h-5 text-indigo-400" />} label="Total Containers" value={totalOccupied.toLocaleString()} sub={`${totalCapacity - totalOccupied} slots free`} accent={isLight ? "bg-indigo-100" : "bg-indigo-500/20"} isLight={isLight} />
        <StatCard icon={<Snowflake className="w-5 h-5 text-cyan-400" />} label="Reefer Alarms" value={reeferAlarms} sub={`${REEFER_CONTAINERS.length} monitored`} accent={isLight ? "bg-cyan-100" : "bg-cyan-500/20"} isLight={isLight} />
        <StatCard icon={<Flame className="w-5 h-5 text-red-400" />} label="Hazmat Issues" value={hazmatNonCompliant} sub={`${HAZMAT_CONTAINERS.length} containers`} accent={isLight ? "bg-red-100" : "bg-red-500/20"} isLight={isLight} />
        <StatCard icon={<DollarSign className="w-5 h-5 text-amber-400" />} label="Demurrage Accruing" value={fmt$(totalDemurrage)} sub={`${DWELL_ENTRIES.length} over free time`} accent={isLight ? "bg-amber-100" : "bg-amber-500/20"} isLight={isLight} />
        <StatCard icon={<Wrench className="w-5 h-5 text-emerald-400" />} label="Equipment Active" value={`${equipOperating}/${EQUIPMENT_LIST.length}`} sub="Operating now" accent={isLight ? "bg-emerald-100" : "bg-emerald-500/20"} isLight={isLight} />
        <StatCard icon={<AlertTriangle className="w-5 h-5 text-orange-400" />} label="Stack Violations" value={stackViolations} sub={`${STACK_ENTRIES.length} checked`} accent={isLight ? "bg-orange-100" : "bg-orange-500/20"} isLight={isLight} />
      </div>

      {/* ═══ 2. YARD OVERVIEW ═══ */}
      <Card className={cardCls}>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className={cn("flex items-center gap-2 text-base", isLight ? "text-gray-900" : "text-white")}>
              <LayoutGrid className="w-5 h-5 text-indigo-400" /> Yard Overview
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {(["all", "import", "export", "reefer", "hazmat", "empty", "transshipment"] as const).map(s => (
                <Button
                  key={s}
                  variant={activeSection === s ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "text-xs h-7 px-2.5",
                    activeSection !== s && (isLight ? "" : "border-gray-700 text-gray-400 hover:bg-white/5"),
                  )}
                  onClick={() => setActiveSection(s)}
                >
                  {s === "all" ? "All" : sectionMeta[s].label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Section summary bars */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
            {(Object.keys(sectionStats) as YardSection[]).map(sec => {
              const st = sectionStats[sec];
              const p = pct(st.occupied, st.capacity);
              const meta = sectionMeta[sec];
              return (
                <div
                  key={sec}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all",
                    activeSection === sec && "ring-2 ring-indigo-500",
                    isLight ? "bg-gray-50 border-gray-200 hover:bg-gray-100" : "bg-[#141822] border-gray-700/50 hover:bg-[#1a1f2e]",
                  )}
                  onClick={() => setActiveSection(activeSection === sec ? "all" : sec)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={cn("text-[10px] px-1.5 py-0.5 border", isLight ? meta.color : meta.darkColor)}>
                      {meta.icon}
                    </Badge>
                    <span className={cn("text-xs font-semibold", isLight ? "text-gray-700" : "text-gray-300")}>{meta.label}</span>
                  </div>
                  <p className={cn("text-lg font-bold mb-1", isLight ? "text-gray-900" : "text-white")}>{p}%</p>
                  <FillBar pct={p} isLight={isLight} />
                  <p className={cn("text-[10px] mt-1", subCls)}>{st.occupied}/{st.capacity} TEU</p>
                </div>
              );
            })}
          </div>

          {/* Block grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {filteredBlocks.map(block => {
              const p = pct(block.occupied, block.capacity);
              const meta = sectionMeta[block.section];
              return (
                <div
                  key={block.id}
                  className={cn(
                    "p-3 rounded-lg border",
                    isLight ? "bg-white border-gray-200" : "bg-[#141822] border-gray-700/50",
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-[10px] px-1.5 py-0.5 border", isLight ? meta.color : meta.darkColor)}>
                        {meta.label}
                      </Badge>
                      <span className={cn("text-xs font-bold", isLight ? "text-gray-800" : "text-white")}>{block.label}</span>
                    </div>
                    <span className={cn("text-[10px] font-mono", subCls)}>{block.id}</span>
                  </div>

                  {/* Mini yard grid visualization */}
                  <div className="mb-2">
                    <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${Math.min(block.bays, 20)}, 1fr)` }}>
                      {Array.from({ length: Math.min(block.bays, 20) * Math.min(block.rows, 4) }).map((_, i) => {
                        const filled = i < Math.round((p / 100) * Math.min(block.bays, 20) * Math.min(block.rows, 4));
                        return (
                          <div
                            key={i}
                            className={cn(
                              "h-1.5 rounded-[1px]",
                              filled
                                ? p >= 90 ? "bg-red-500" : p >= 75 ? "bg-amber-500" : "bg-emerald-500"
                                : isLight ? "bg-gray-200" : "bg-gray-700",
                            )}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={cn("text-xs font-bold", p >= 90 ? "text-red-400" : p >= 75 ? "text-amber-400" : "text-emerald-400")}>{p}%</span>
                    <span className={cn("text-[10px]", subCls)}>{block.occupied}/{block.capacity}</span>
                  </div>
                  <FillBar pct={p} isLight={isLight} />
                  <p className={cn("text-[10px] mt-1", subCls)}>{block.rows}R x {block.bays}B x {block.tiers}T</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ═══ 3. CONTAINER SEARCH ═══ */}
      <Card className={cardCls}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("flex items-center gap-2 text-base", isLight ? "text-gray-900" : "text-white")}>
            <Search className="w-5 h-5 text-indigo-400" /> Container Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2">
              {(["container", "booking", "bl"] as const).map(t => (
                <Button
                  key={t}
                  variant={searchType === t ? "default" : "outline"}
                  size="sm"
                  className={cn("text-xs h-8", searchType !== t && (isLight ? "" : "border-gray-700 text-gray-400 hover:bg-white/5"))}
                  onClick={() => setSearchType(t)}
                >
                  {t === "container" ? "Container #" : t === "booking" ? "Booking" : "B/L Number"}
                </Button>
              ))}
            </div>
            <div className="relative flex-1">
              <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isLight ? "text-gray-400" : "text-gray-500")} />
              <Input
                placeholder={searchType === "container" ? "Enter container number (e.g. MSCU7234561)" : searchType === "booking" ? "Enter booking reference" : "Enter Bill of Lading number"}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={cn("pl-10 h-9", inputCls)}
              />
            </div>
          </div>

          {/* Search results */}
          {searchResults && searchResults.length > 0 && (
            <div className={cn("mt-4 rounded-lg border overflow-hidden", tableBorder)}>
              <table className="w-full text-sm">
                <thead>
                  <tr className={cn("border-b", tableBorder, isLight ? "bg-gray-50" : "bg-[#141822]")}>
                    <th className={cn("text-left px-4 py-2 text-xs font-semibold", subCls)}>Container #</th>
                    <th className={cn("text-left px-4 py-2 text-xs font-semibold", subCls)}>Location</th>
                    <th className={cn("text-left px-4 py-2 text-xs font-semibold", subCls)}>Type</th>
                    <th className={cn("text-left px-4 py-2 text-xs font-semibold", subCls)}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((r, i) => (
                    <tr key={i} className={cn("border-b last:border-0", tableBorder, rowHover)}>
                      <td className={cn("px-4 py-2 font-mono font-bold text-xs", isLight ? "text-gray-900" : "text-white")}>{r.containerNumber}</td>
                      <td className={cn("px-4 py-2 text-xs", subCls)}>{r.location}</td>
                      <td className={cn("px-4 py-2 text-xs", subCls)}>{r.type}</td>
                      <td className="px-4 py-2">
                        <Badge className={cn("text-[10px]", isLight ? "bg-gray-100 text-gray-700" : "bg-gray-600/30 text-gray-300")}>{r.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {searchResults && searchResults.length === 0 && (
            <div className={cn("mt-4 text-center py-8", subCls)}>
              <PackageX className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No containers found matching "{searchQuery}"</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ TWO-COL: REEFER + HAZMAT ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ═══ 4. REEFER MONITORING ═══ */}
        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className={cn("flex items-center gap-2 text-base", isLight ? "text-gray-900" : "text-white")}>
                <ThermometerSnowflake className="w-5 h-5 text-cyan-400" /> Reefer Monitoring
                <Badge className={cn("text-[10px] ml-1", isLight ? "bg-cyan-100 text-cyan-800" : "bg-cyan-500/20 text-cyan-300")}>{REEFER_CONTAINERS.length}</Badge>
              </CardTitle>
              <div className="flex items-center gap-1.5">
                {(["all", "critical", "warning", "normal", "offline"] as const).map(f => (
                  <Button
                    key={f}
                    variant={reeferFilter === f ? "default" : "outline"}
                    size="sm"
                    className={cn("text-[10px] h-6 px-2", reeferFilter !== f && (isLight ? "" : "border-gray-700 text-gray-400 hover:bg-white/5"))}
                    onClick={() => setReeferFilter(f)}
                  >
                    {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredReefers.map(r => {
              const tempDiff = Math.abs(r.actualTemp - r.setTemp);
              const isCritical = r.alarmStatus === "critical";
              const isWarn = r.alarmStatus === "warning";
              return (
                <div
                  key={r.id}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    isCritical && "ring-1 ring-red-500/50",
                    isLight ? "bg-gray-50 border-gray-200" : "bg-[#141822] border-gray-700/50",
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn("font-mono font-bold text-sm", isLight ? "text-gray-900" : "text-white")}>{r.containerNumber}</span>
                        <Badge className={cn("text-[10px]", isLight ? "bg-gray-200 text-gray-700" : "bg-gray-600/30 text-gray-400")}>{r.size}'</Badge>
                      </div>
                      <p className={cn("text-xs mt-0.5", subCls)}>{r.commodity}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge className={cn("text-[10px]", alarmBadge(r.alarmStatus, isLight))}>
                        {r.alarmStatus === "critical" && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {r.alarmStatus.toUpperCase()}
                      </Badge>
                      <Badge className={cn("text-[10px]", powerBadge(r.powerStatus, isLight))}>
                        <Plug className="w-3 h-3 mr-1" />
                        {r.powerStatus}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <p className={cn("text-[10px]", subCls)}>Set Temp</p>
                      <p className={cn("text-sm font-bold", isLight ? "text-gray-900" : "text-white")}>{r.setTemp}°C</p>
                    </div>
                    <div>
                      <p className={cn("text-[10px]", subCls)}>Actual Temp</p>
                      <p className={cn(
                        "text-sm font-bold",
                        isCritical ? "text-red-400" : isWarn ? "text-amber-400" : isLight ? "text-gray-900" : "text-white",
                      )}>
                        {r.actualTemp}°C
                        {tempDiff > 2 && <span className="text-[10px] ml-1 text-red-400">(+{tempDiff.toFixed(1)})</span>}
                      </p>
                    </div>
                    <div>
                      <p className={cn("text-[10px]", subCls)}>Position</p>
                      <p className={cn("text-xs font-mono", isLight ? "text-gray-700" : "text-gray-300")}>{r.position}</p>
                    </div>
                    <div>
                      <p className={cn("text-[10px]", subCls)}>Last Check</p>
                      <p className={cn("text-xs", isLight ? "text-gray-700" : "text-gray-300")}>{r.lastCheck.split(" ")[1]}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredReefers.length === 0 && (
              <div className={cn("text-center py-6", subCls)}>No reefers match this filter.</div>
            )}
          </CardContent>
        </Card>

        {/* ═══ 5. HAZMAT CONTAINERS ═══ */}
        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("flex items-center gap-2 text-base", isLight ? "text-gray-900" : "text-white")}>
              <Flame className="w-5 h-5 text-red-400" /> Hazmat Containers
              <Badge className={cn("text-[10px] ml-1", isLight ? "bg-red-100 text-red-800" : "bg-red-500/20 text-red-300")}>{HAZMAT_CONTAINERS.length}</Badge>
              {hazmatNonCompliant > 0 && (
                <Badge className="text-[10px] ml-1 bg-red-500 text-white animate-pulse">
                  {hazmatNonCompliant} NON-COMPLIANT
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
            {HAZMAT_CONTAINERS.map(h => (
              <div
                key={h.id}
                className={cn(
                  "p-3 rounded-lg border transition-all",
                  !h.segregationCompliant && "ring-1 ring-red-500/50",
                  isLight ? "bg-gray-50 border-gray-200" : "bg-[#141822] border-gray-700/50",
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-mono font-bold text-sm", isLight ? "text-gray-900" : "text-white")}>{h.containerNumber}</span>
                      <Badge className={cn(
                        "text-[10px]",
                        isLight ? "bg-red-100 text-red-800 border border-red-300" : "bg-red-500/20 text-red-300 border border-red-500/40",
                      )}>
                        IMDG {h.imdgClass} — {imdgLabel[h.imdgClass]}
                      </Badge>
                    </div>
                    <p className={cn("text-xs mt-0.5", subCls)}>{h.properShippingName} ({h.unNumber})</p>
                  </div>
                  <Badge className={cn(
                    "text-[10px]",
                    h.segregationCompliant
                      ? (isLight ? "bg-emerald-100 text-emerald-800" : "bg-emerald-500/20 text-emerald-300")
                      : "bg-red-500 text-white",
                  )}>
                    {h.segregationCompliant ? "COMPLIANT" : "NON-COMPLIANT"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <p className={cn("text-[10px]", subCls)}>Isolation Zone</p>
                    <p className={cn("text-xs font-mono font-bold", isLight ? "text-gray-800" : "text-white")}>{h.isolationZone}</p>
                  </div>
                  <div>
                    <p className={cn("text-[10px]", subCls)}>Position</p>
                    <p className={cn("text-xs font-mono", isLight ? "text-gray-700" : "text-gray-300")}>{h.position}</p>
                  </div>
                  <div>
                    <p className={cn("text-[10px]", subCls)}>Last Inspection</p>
                    <p className={cn("text-xs", isLight ? "text-gray-700" : "text-gray-300")}>{h.lastInspection}</p>
                  </div>
                  <div>
                    <p className={cn("text-[10px]", subCls)}>Handling</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {h.specialHandling.map((sh, i) => (
                        <Badge key={i} className={cn("text-[9px]", isLight ? "bg-orange-100 text-orange-800" : "bg-orange-500/20 text-orange-300")}>{sh}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ═══ 6. DWELL TIME MONITOR ═══ */}
      <Card className={cardCls}>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className={cn("flex items-center gap-2 text-base", isLight ? "text-gray-900" : "text-white")}>
              <CalendarClock className="w-5 h-5 text-amber-400" /> Dwell Time Monitor
              <Badge className={cn("text-[10px] ml-1", isLight ? "bg-amber-100 text-amber-800" : "bg-amber-500/20 text-amber-300")}>
                {DWELL_ENTRIES.length} over free time
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className={cn("text-xs", subCls)}>Sort by:</span>
              <Button
                variant={dwellSort === "daysOver" ? "default" : "outline"}
                size="sm"
                className={cn("text-xs h-7 px-2.5", dwellSort !== "daysOver" && (isLight ? "" : "border-gray-700 text-gray-400 hover:bg-white/5"))}
                onClick={() => setDwellSort("daysOver")}
              >
                <Clock className="w-3 h-3 mr-1" /> Days Over
              </Button>
              <Button
                variant={dwellSort === "totalDemurrage" ? "default" : "outline"}
                size="sm"
                className={cn("text-xs h-7 px-2.5", dwellSort !== "totalDemurrage" && (isLight ? "" : "border-gray-700 text-gray-400 hover:bg-white/5"))}
                onClick={() => setDwellSort("totalDemurrage")}
              >
                <DollarSign className="w-3 h-3 mr-1" /> Demurrage
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn("rounded-lg border overflow-x-auto", tableBorder)}>
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b", tableBorder, isLight ? "bg-gray-50" : "bg-[#141822]")}>
                  <th className={cn("text-left px-4 py-2.5 text-xs font-semibold", subCls)}>Container #</th>
                  <th className={cn("text-left px-4 py-2.5 text-xs font-semibold", subCls)}>Type</th>
                  <th className={cn("text-left px-4 py-2.5 text-xs font-semibold", subCls)}>Shipper</th>
                  <th className={cn("text-left px-4 py-2.5 text-xs font-semibold", subCls)}>Arrived</th>
                  <th className={cn("text-center px-4 py-2.5 text-xs font-semibold", subCls)}>Free Days</th>
                  <th className={cn("text-center px-4 py-2.5 text-xs font-semibold", subCls)}>Dwell</th>
                  <th className={cn("text-center px-4 py-2.5 text-xs font-semibold", subCls)}>Days Over</th>
                  <th className={cn("text-right px-4 py-2.5 text-xs font-semibold", subCls)}>Daily Rate</th>
                  <th className={cn("text-right px-4 py-2.5 text-xs font-semibold", subCls)}>Total</th>
                </tr>
              </thead>
              <tbody>
                {sortedDwell.map(d => (
                  <tr key={d.id} className={cn("border-b last:border-0", tableBorder, rowHover)}>
                    <td className={cn("px-4 py-2.5 font-mono font-bold text-xs", isLight ? "text-gray-900" : "text-white")}>{d.containerNumber}</td>
                    <td className="px-4 py-2.5">
                      <Badge className={cn("text-[10px]",
                        d.type === "import" ? (isLight ? "bg-blue-100 text-blue-800" : "bg-blue-500/20 text-blue-300")
                        : d.type === "export" ? (isLight ? "bg-green-100 text-green-800" : "bg-green-500/20 text-green-300")
                        : (isLight ? "bg-gray-100 text-gray-700" : "bg-gray-600/30 text-gray-400"),
                      )}>{d.type}</Badge>
                    </td>
                    <td className={cn("px-4 py-2.5 text-xs", subCls)}>{d.shipper}</td>
                    <td className={cn("px-4 py-2.5 text-xs", subCls)}>{d.arrivalDate}</td>
                    <td className={cn("px-4 py-2.5 text-xs text-center", subCls)}>{d.freeTimeDays}</td>
                    <td className={cn("px-4 py-2.5 text-xs text-center font-medium", isLight ? "text-gray-900" : "text-white")}>{d.dwellDays}d</td>
                    <td className="px-4 py-2.5 text-center">
                      <Badge className={cn(
                        "text-[10px] font-bold",
                        d.daysOver >= 10 ? "bg-red-500 text-white"
                        : d.daysOver >= 5 ? (isLight ? "bg-amber-100 text-amber-800" : "bg-amber-500/20 text-amber-300")
                        : (isLight ? "bg-yellow-100 text-yellow-800" : "bg-yellow-500/20 text-yellow-300"),
                      )}>
                        +{d.daysOver}d
                      </Badge>
                    </td>
                    <td className={cn("px-4 py-2.5 text-xs text-right", subCls)}>{fmt$(d.dailyDemurrage)}/d</td>
                    <td className={cn("px-4 py-2.5 text-sm text-right font-bold", d.totalDemurrage >= 1500 ? "text-red-400" : isLight ? "text-gray-900" : "text-white")}>{fmt$(d.totalDemurrage)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={cn("border-t", tableBorder, isLight ? "bg-gray-50" : "bg-[#141822]")}>
                  <td colSpan={8} className={cn("px-4 py-2.5 text-xs font-semibold text-right", isLight ? "text-gray-700" : "text-gray-300")}>Total Demurrage Accruing:</td>
                  <td className={cn("px-4 py-2.5 text-sm font-bold text-right text-red-400")}>{fmt$(totalDemurrage)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ═══ 7. EQUIPMENT TRACKER ═══ */}
      <Card className={cardCls}>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className={cn("flex items-center gap-2 text-base", isLight ? "text-gray-900" : "text-white")}>
              <Wrench className="w-5 h-5 text-emerald-400" /> Equipment Tracker
              <Badge className={cn("text-[10px] ml-1", isLight ? "bg-emerald-100 text-emerald-800" : "bg-emerald-500/20 text-emerald-300")}>
                {equipOperating} operating
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(["all", "rtg", "reach_stacker", "terminal_tractor", "straddle_carrier"] as const).map(t => (
                <Button
                  key={t}
                  variant={equipFilter === t ? "default" : "outline"}
                  size="sm"
                  className={cn("text-[10px] h-6 px-2", equipFilter !== t && (isLight ? "" : "border-gray-700 text-gray-400 hover:bg-white/5"))}
                  onClick={() => setEquipFilter(t)}
                >
                  {t === "all" ? "All" : equipTypeLabel[t]}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredEquipment.map(eq => (
              <div
                key={eq.id}
                className={cn(
                  "p-4 rounded-lg border transition-all",
                  eq.status === "breakdown" && "ring-1 ring-red-500/50",
                  isLight ? "bg-gray-50 border-gray-200" : "bg-[#141822] border-gray-700/50",
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-bold text-sm", isLight ? "text-gray-900" : "text-white")}>{eq.name}</span>
                      <Badge className={cn("text-[10px]", isLight ? "bg-gray-200 text-gray-700" : "bg-gray-600/30 text-gray-400")}>{eq.equipmentId}</Badge>
                    </div>
                    <p className={cn("text-xs mt-0.5", subCls)}>{equipTypeLabel[eq.type]}</p>
                  </div>
                  <Badge className={cn("text-[10px]", equipStatusBadge(eq.status, isLight))}>
                    {eq.status === "operating" && <Activity className="w-3 h-3 mr-1" />}
                    {eq.status === "breakdown" && <AlertTriangle className="w-3 h-3 mr-1" />}
                    {eq.status === "maintenance" && <Wrench className="w-3 h-3 mr-1" />}
                    {eq.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className={cn("text-[10px]", subCls)}>Operator</p>
                    <p className={cn("text-xs font-medium", isLight ? "text-gray-800" : "text-gray-200")}>{eq.operator}</p>
                  </div>
                  <div>
                    <p className={cn("text-[10px]", subCls)}>Location</p>
                    <p className={cn("text-xs font-mono", isLight ? "text-gray-700" : "text-gray-300")}>{eq.currentBlock}</p>
                  </div>
                  <div>
                    <p className={cn("text-[10px]", subCls)}>Moves Today</p>
                    <p className={cn("text-sm font-bold", isLight ? "text-gray-900" : "text-white")}>{eq.movesToday}</p>
                  </div>
                  <div>
                    <p className={cn("text-[10px]", subCls)}>Hours Today</p>
                    <p className={cn("text-xs", isLight ? "text-gray-700" : "text-gray-300")}>{eq.hoursToday}h</p>
                  </div>
                </div>

                {/* Fuel gauge */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("text-[10px]", subCls)}>Fuel Level</span>
                    <span className={cn("text-[10px] font-bold",
                      eq.fuelLevel <= 25 ? "text-red-400" : eq.fuelLevel <= 50 ? "text-amber-400" : "text-emerald-400"
                    )}>{eq.fuelLevel}%</span>
                  </div>
                  <div className={cn("h-1.5 rounded-full w-full", isLight ? "bg-gray-200" : "bg-gray-700")}>
                    <div
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        eq.fuelLevel <= 25 ? "bg-red-500" : eq.fuelLevel <= 50 ? "bg-amber-500" : "bg-emerald-500",
                      )}
                      style={{ width: `${eq.fuelLevel}%` }}
                    />
                  </div>
                  <p className={cn("text-[10px] mt-1", subCls)}>Last maint: {eq.lastMaintenance}</p>
                </div>
              </div>
            ))}
            {filteredEquipment.length === 0 && (
              <div className={cn("col-span-full text-center py-8", subCls)}>No equipment matches this filter.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ═══ 8. STACK PLANNING ═══ */}
      <Card className={cardCls}>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className={cn("flex items-center gap-2 text-base", isLight ? "text-gray-900" : "text-white")}>
              <ChevronsUp className="w-5 h-5 text-purple-400" /> Stack Planning
              {stackViolations > 0 && (
                <Badge className="text-[10px] ml-1 bg-red-500 text-white animate-pulse">{stackViolations} Violations</Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-1.5">
              {(["all", "violation", "warning", "compliant"] as const).map(f => (
                <Button
                  key={f}
                  variant={stackFilter === f ? "default" : "outline"}
                  size="sm"
                  className={cn("text-[10px] h-6 px-2", stackFilter !== f && (isLight ? "" : "border-gray-700 text-gray-400 hover:bg-white/5"))}
                  onClick={() => setStackFilter(f)}
                >
                  {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stacking rules summary */}
          <div className={cn("p-3 rounded-lg border mb-4", isLight ? "bg-blue-50 border-blue-200" : "bg-blue-500/10 border-blue-500/30")}>
            <p className={cn("text-xs font-semibold mb-2", isLight ? "text-blue-800" : "text-blue-300")}>Active Stacking Rules</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                { rule: "Max tier height: 5 (loaded), 6 (empty)", icon: <ChevronsUp className="w-3 h-3" /> },
                { rule: "Heavier containers on lower tiers", icon: <Weight className="w-3 h-3" /> },
                { rule: "Priority containers at bay ends", icon: <ArrowUpDown className="w-3 h-3" /> },
                { rule: "Reefer blocks: max 4 high", icon: <Snowflake className="w-3 h-3" /> },
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={cn("p-1 rounded", isLight ? "bg-blue-200 text-blue-700" : "bg-blue-500/30 text-blue-300")}>{r.icon}</div>
                  <span className={cn("text-[11px]", isLight ? "text-blue-700" : "text-blue-300")}>{r.rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stack entries table */}
          <div className={cn("rounded-lg border overflow-x-auto", tableBorder)}>
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b", tableBorder, isLight ? "bg-gray-50" : "bg-[#141822]")}>
                  <th className={cn("text-left px-4 py-2.5 text-xs font-semibold", subCls)}>Container #</th>
                  <th className={cn("text-left px-4 py-2.5 text-xs font-semibold", subCls)}>Block</th>
                  <th className={cn("text-center px-4 py-2.5 text-xs font-semibold", subCls)}>Bay</th>
                  <th className={cn("text-center px-4 py-2.5 text-xs font-semibold", subCls)}>Row</th>
                  <th className={cn("text-center px-4 py-2.5 text-xs font-semibold", subCls)}>Tier</th>
                  <th className={cn("text-right px-4 py-2.5 text-xs font-semibold", subCls)}>Weight</th>
                  <th className={cn("text-center px-4 py-2.5 text-xs font-semibold", subCls)}>Size</th>
                  <th className={cn("text-center px-4 py-2.5 text-xs font-semibold", subCls)}>Compliance</th>
                  <th className={cn("text-left px-4 py-2.5 text-xs font-semibold", subCls)}>Access</th>
                  <th className={cn("text-left px-4 py-2.5 text-xs font-semibold", subCls)}>Issue</th>
                </tr>
              </thead>
              <tbody>
                {filteredStacks.map(s => (
                  <tr key={s.id} className={cn(
                    "border-b last:border-0",
                    tableBorder,
                    s.compliance === "violation" ? (isLight ? "bg-red-50" : "bg-red-500/5") : rowHover,
                  )}>
                    <td className={cn("px-4 py-2.5 font-mono font-bold text-xs", isLight ? "text-gray-900" : "text-white")}>{s.containerNumber}</td>
                    <td className={cn("px-4 py-2.5 text-xs font-mono", subCls)}>{s.yardBlock}</td>
                    <td className={cn("px-4 py-2.5 text-xs text-center", subCls)}>{s.bay}</td>
                    <td className={cn("px-4 py-2.5 text-xs text-center", subCls)}>{s.row}</td>
                    <td className="px-4 py-2.5 text-center">
                      <Badge className={cn("text-[10px]",
                        s.tier >= 5 ? (isLight ? "bg-amber-100 text-amber-800" : "bg-amber-500/20 text-amber-300")
                        : (isLight ? "bg-gray-100 text-gray-700" : "bg-gray-600/30 text-gray-400"),
                      )}>T{s.tier}</Badge>
                    </td>
                    <td className={cn("px-4 py-2.5 text-xs text-right font-medium",
                      s.weight > 25000 ? "text-amber-400" : isLight ? "text-gray-700" : "text-gray-300"
                    )}>{(s.weight / 1000).toFixed(1)}t</td>
                    <td className={cn("px-4 py-2.5 text-xs text-center", subCls)}>{s.size}'</td>
                    <td className="px-4 py-2.5 text-center">
                      <Badge className={cn("text-[10px]", complianceBadge(s.compliance, isLight))}>
                        {s.compliance === "violation" && <XCircle className="w-3 h-3 mr-1" />}
                        {s.compliance === "compliant" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {s.compliance === "warning" && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {s.compliance.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <AccessBar score={s.accessibilityScore} isLight={isLight} />
                    </td>
                    <td className={cn("px-4 py-2.5 text-xs max-w-[200px] truncate",
                      s.issue ? "text-red-400" : subCls
                    )}>{s.issue || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredStacks.length === 0 && (
            <div className={cn("text-center py-8", subCls)}>No stack entries match this filter.</div>
          )}

          {/* Stack optimization summary */}
          <div className={cn("mt-4 p-3 rounded-lg border grid grid-cols-1 sm:grid-cols-3 gap-4", isLight ? "bg-gray-50 border-gray-200" : "bg-[#141822] border-gray-700/50")}>
            <div className="text-center">
              <p className={cn("text-[10px] mb-1", subCls)}>Avg Accessibility Score</p>
              <p className={cn("text-xl font-bold", isLight ? "text-gray-900" : "text-white")}>
                {Math.round(STACK_ENTRIES.reduce((s, e) => s + e.accessibilityScore, 0) / STACK_ENTRIES.length)}%
              </p>
              <p className={cn("text-[10px]", subCls)}>Target: 75%+</p>
            </div>
            <div className="text-center">
              <p className={cn("text-[10px] mb-1", subCls)}>Weight Distribution</p>
              <p className={cn("text-xl font-bold",
                stackViolations > 0 ? "text-red-400" : "text-emerald-400"
              )}>
                {stackViolations > 0 ? "Needs Attention" : "Balanced"}
              </p>
              <p className={cn("text-[10px]", subCls)}>{stackViolations} violations detected</p>
            </div>
            <div className="text-center">
              <p className={cn("text-[10px] mb-1", subCls)}>Rehandle Estimate</p>
              <p className={cn("text-xl font-bold", isLight ? "text-gray-900" : "text-white")}>
                {Math.round(STACK_ENTRIES.filter(s => s.accessibilityScore < 50).length * 1.8)} moves
              </p>
              <p className={cn("text-[10px]", subCls)}>To optimize current layout</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ FOOTER ═══ */}
      <div className={cn("text-center py-4 text-xs", subCls)}>
        Container Yard Management — EusoTrip Terminal Operations
      </div>
    </div>
  );
}
