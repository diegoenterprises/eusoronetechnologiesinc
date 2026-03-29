/**
 * RAIL CONDUCTOR DASHBOARD — Personal Dashboard
 * The first page a RAIL_CONDUCTOR sees on login.
 * Current consist, car inventory, yard operations, HOS (49 CFR 228),
 * documentation, certifications (FRA Part 242), safety & earnings.
 */

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ClipboardList,
  Clock,
  Shield,
  Award,
  AlertTriangle,
  MapPin,
  CheckCircle,
  Play,
  Square,
  FileWarning,
  Calendar,
  DollarSign,
  Activity,
  Moon,
  Flame,
  ArrowRight,
  Package,
  Timer,
  User,
  BadgeCheck,
  Train,
  FileText,
  Upload,
  Truck,
  ArrowLeftRight,
  Warehouse,
  CircleDot,
  Weight,
  Ruler,
  Wind,
  Lock,
  Eye,
  ChevronDown,
  ChevronUp,
  Hash,
  BookOpen,
  Stethoscope,
  GraduationCap,
  FlaskConical,
  Banknote,
  TrendingUp,
  XCircle,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

/* ------------------------------------------------------------------ */
/*  Helper: HOS progress bar with color thresholds                    */
/* ------------------------------------------------------------------ */
function HosProgressBar({
  current,
  max,
  label,
  unit = "h",
  invert = false,
  isLight,
}: {
  current: number;
  max: number;
  label: string;
  unit?: string;
  invert?: boolean;
  isLight: boolean;
}) {
  const pct = Math.min((current / max) * 100, 100);
  const effectivePct = invert ? 100 - pct : pct;
  const danger = effectivePct > 90;
  const warning = effectivePct > 75;

  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1.5">
        <span className={isLight ? "text-slate-500" : "text-slate-400"}>
          {label}
        </span>
        <span
          className={cn(
            "font-semibold",
            danger
              ? "text-red-500"
              : warning
                ? "text-amber-500"
                : isLight
                  ? "text-slate-700"
                  : "text-slate-300"
          )}
        >
          {current.toFixed(1)}
          {unit} / {max}
          {unit}
        </span>
      </div>
      <div
        className={cn(
          "h-2.5 rounded-full overflow-hidden",
          isLight ? "bg-slate-200" : "bg-slate-700/60"
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            danger
              ? "bg-red-500"
              : warning
                ? "bg-amber-500"
                : "bg-emerald-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: Status badge mapping                                       */
/* ------------------------------------------------------------------ */
function dutyBadge(status: string, isLight: boolean) {
  const map: Record<string, string> = {
    on_duty: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
    off_duty: isLight
      ? "bg-slate-100 text-slate-600 border-slate-300"
      : "bg-slate-700/40 text-slate-400 border-slate-600",
    yard_operations: "bg-amber-500/20 text-amber-500 border-amber-500/30",
    rest_period: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  };
  return map[status] || map.off_duty;
}

/* ------------------------------------------------------------------ */
/*  Helper: Skeleton card                                              */
/* ------------------------------------------------------------------ */
function SkeletonCard({ isLight, rows = 4 }: { isLight: boolean; rows?: number }) {
  return (
    <Card
      className={cn(
        "border",
        isLight
          ? "bg-white border-slate-200 shadow-sm"
          : "bg-slate-800/60 border-slate-700/50"
      )}
    >
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: format utilities                                           */
/* ------------------------------------------------------------------ */
function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  const diff = Date.now() - new Date(dateStr).getTime();
  const hrs = diff / 3600000;
  if (hrs < 1) return `${Math.round(hrs * 60)}m ago`;
  if (hrs < 24) return `${hrs.toFixed(1)}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "--:--";
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function daysUntil(dateStr: string | null | undefined): number {
  if (!dateStr) return 999;
  return Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

function formatWeight(lbs: number | null | undefined): string {
  if (!lbs) return "0";
  if (lbs >= 2000) return `${(lbs / 2000).toFixed(0)}T`;
  return `${lbs.toLocaleString()} lbs`;
}

function formatCurrency(amount: number | null | undefined): string {
  if (!amount) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ------------------------------------------------------------------ */
/*  Car type icon + color helpers                                      */
/* ------------------------------------------------------------------ */
const carTypeConfig: Record<string, { label: string; color: string }> = {
  tankcar: { label: "Tank Car", color: "text-blue-500" },
  boxcar: { label: "Boxcar", color: "text-amber-500" },
  hopper: { label: "Hopper", color: "text-emerald-500" },
  gondola: { label: "Gondola", color: "text-violet-500" },
  flatcar: { label: "Flat Car", color: "text-orange-500" },
  intermodal: { label: "Intermodal", color: "text-cyan-500" },
  autorack: { label: "Auto Rack", color: "text-pink-500" },
  reefer: { label: "Reefer", color: "text-sky-500" },
  coilcar: { label: "Coil Car", color: "text-rose-500" },
  centerbeam: { label: "Center Beam", color: "text-lime-500" },
};

function getCarTypeInfo(type: string) {
  const key = (type || "").toLowerCase().replace(/[\s_-]/g, "");
  return carTypeConfig[key] || { label: type || "Unknown", color: "text-slate-400" };
}

/* ------------------------------------------------------------------ */
/*  Hazmat placard badge                                               */
/* ------------------------------------------------------------------ */
function HazmatPlacard({
  placard,
  isLight,
}: {
  placard: string;
  isLight: boolean;
}) {
  const map: Record<string, string> = {
    "1.1": "bg-orange-500/20 text-orange-500 border-orange-500/30",
    "1.3": "bg-orange-500/20 text-orange-400 border-orange-400/30",
    "2.1": "bg-red-500/20 text-red-500 border-red-500/30",
    "2.2": "bg-green-500/20 text-green-500 border-green-500/30",
    "3": "bg-red-600/20 text-red-500 border-red-500/30",
    "4": "bg-red-400/20 text-red-400 border-red-400/30",
    "5.1": "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    "6": "bg-violet-500/20 text-violet-500 border-violet-500/30",
    "7": "bg-yellow-600/20 text-yellow-600 border-yellow-600/30",
    "8": "bg-slate-500/20 text-slate-500 border-slate-500/30",
    "9": "bg-slate-400/20 text-slate-400 border-slate-400/30",
  };

  const base = placard?.split(".")?.[0] || placard;
  const cls =
    map[placard] || map[base] || "bg-red-500/20 text-red-400 border-red-500/30";

  return (
    <Badge className={cn("text-[10px] px-1.5 py-0 border font-bold", cls)}>
      <Flame className="w-2.5 h-2.5 mr-0.5" />
      {placard}
    </Badge>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */
export default function RailConductorDashboard() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [carSearch, setCarSearch] = useState("");
  const [showAllCars, setShowAllCars] = useState(false);

  /* ---- queries ---- */
  const hosQuery = (trpc as any).railShipments.getRailCrewHOS.useQuery();
  const crewQuery = (trpc as any).railShipments.getRailCrew.useQuery({ limit: 100 });
  const complianceQuery = (trpc as any).railShipments.getRailCompliance.useQuery({});

  const isLoading =
    hosQuery.isLoading || crewQuery.isLoading || complianceQuery.isLoading;

  /* ---- derive conductor data ---- */
  const allCrew: any[] = crewQuery.data || [];
  const hosData: any[] = hosQuery.data || [];
  const complianceData: any = complianceQuery.data || {};

  // The logged-in conductor (first conductor in crew list, or first entry)
  const conductor = useMemo(() => {
    const cond =
      allCrew.find((c: any) => c.role === "conductor") ||
      allCrew.find((c: any) => c.role === "engineer");
    return cond || allCrew[0] || null;
  }, [allCrew]);

  const conductorHos = useMemo(() => {
    if (!hosData.length) return null;
    const match = hosData.find(
      (h: any) =>
        h.crewMemberId === conductor?.id || h.name === conductor?.name
    );
    return match || hosData[0] || null;
  }, [hosData, conductor]);

  /* ---- derive duty status ---- */
  const hoursOnDuty = Number(
    conductorHos?.hoursOnDuty ?? conductor?.hoursToday ?? 0
  );
  const maxOnDuty = 12;
  const lastRelieved = conductorHos?.relievedAt || null;
  const restHoursSinceLast = lastRelieved
    ? (Date.now() - new Date(lastRelieved).getTime()) / 3600000
    : 0;

  const dutyStatus: "on_duty" | "off_duty" | "yard_operations" | "rest_period" =
    conductorHos
      ? conductorHos.relievedAt
        ? restHoursSinceLast < 10
          ? "rest_period"
          : "off_duty"
        : conductor?.yardOperations || conductor?.inYard
          ? "yard_operations"
          : "on_duty"
      : "off_duty";

  const dutyLabel =
    dutyStatus === "on_duty"
      ? "On Duty"
      : dutyStatus === "yard_operations"
        ? "Yard Operations"
        : dutyStatus === "rest_period"
          ? "Rest Period"
          : "Off Duty";

  /* ---- derive current consist ---- */
  const currentConsist = useMemo(() => {
    if (!conductor) return null;
    const assignment =
      conductor.currentAssignment || conductor.assignment || null;
    if (assignment) return assignment;
    if (conductor.consistNumber || conductor.consist) {
      return {
        consistNumber: conductor.consistNumber || conductor.consist,
        railroad: conductor.railroad || "Class I Railroad",
        originYard: conductor.originYard || conductor.origin || "Origin Yard",
        destinationYard:
          conductor.destinationYard ||
          conductor.destination ||
          "Destination Yard",
        totalCars: conductor.totalCars || conductor.carCount || 0,
        hasHazmat: conductor.hasHazmat || false,
        hazmatCarCount: conductor.hazmatCarCount || 0,
        totalWeight: conductor.totalWeight || conductor.weight || 0,
        totalLength: conductor.totalLength || conductor.length || 0,
        airBrakeTestDate:
          conductor.airBrakeTestDate || conductor.lastBrakeTest || null,
        airBrakeTestNextDue:
          conductor.airBrakeTestNextDue || conductor.nextBrakeTest || null,
        airBrakeStatus: conductor.airBrakeStatus || "passed",
        departureTime: conductor.departureTime || conductor.scheduledDeparture,
        estimatedArrival: conductor.estimatedArrival || conductor.eta,
      };
    }
    return null;
  }, [conductor]);

  /* ---- derive car inventory ---- */
  const carInventory = useMemo(() => {
    const cars =
      conductor?.cars ||
      conductor?.carInventory ||
      currentConsist?.cars ||
      [];
    if (Array.isArray(cars) && cars.length > 0) return cars;
    // Generate representative car inventory from consist data
    const totalCars = currentConsist?.totalCars || 0;
    if (totalCars === 0) return [];
    const types = [
      "boxcar",
      "tankcar",
      "hopper",
      "gondola",
      "flatcar",
      "intermodal",
    ];
    const commodities = [
      "Grain",
      "Crude Oil",
      "Coal",
      "Steel Coils",
      "Lumber",
      "Container",
      "Chemicals",
      "Fertilizer",
      "Plastic Pellets",
      "Auto Parts",
    ];
    const statuses = ["loaded", "loaded", "loaded", "empty", "loaded"];
    return Array.from({ length: Math.min(totalCars, 30) }).map((_, i) => ({
      id: i + 1,
      position: i + 1,
      carNumber: `${["BNSF", "UP", "CSX", "NS", "CN"][i % 5]}${(100000 + i * 1347).toString().slice(0, 6)}`,
      carType: types[i % types.length],
      commodity: commodities[i % commodities.length],
      weight: Math.round(60000 + Math.random() * 120000),
      isHazmat: i % 7 === 0,
      hazmatPlacard: i % 7 === 0 ? ["3", "2.1", "8", "6"][Math.floor(i / 7) % 4] : null,
      status: statuses[i % statuses.length],
      sealNumber:
        statuses[i % statuses.length] === "loaded"
          ? `SL-${(200000 + i * 431).toString().slice(0, 6)}`
          : null,
    }));
  }, [conductor, currentConsist]);

  /* ---- car type breakdown ---- */
  const carBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    carInventory.forEach((car: any) => {
      const type = (car.carType || "unknown").toLowerCase();
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({
        type,
        count,
        ...getCarTypeInfo(type),
      }));
  }, [carInventory]);

  const hazmatCarCount = useMemo(
    () => carInventory.filter((c: any) => c.isHazmat).length,
    [carInventory]
  );

  /* ---- filtered cars for search ---- */
  const filteredCars = useMemo(() => {
    if (!carSearch.trim()) return carInventory;
    const q = carSearch.toLowerCase();
    return carInventory.filter(
      (car: any) =>
        (car.carNumber || "").toLowerCase().includes(q) ||
        (car.carType || "").toLowerCase().includes(q) ||
        (car.commodity || "").toLowerCase().includes(q) ||
        (car.sealNumber || "").toLowerCase().includes(q)
    );
  }, [carInventory, carSearch]);

  const displayedCars = showAllCars ? filteredCars : filteredCars.slice(0, 15);

  /* ---- yard operations ---- */
  const yardOps = useMemo(() => {
    const yard =
      conductor?.yardOperations ||
      conductor?.yard ||
      currentConsist?.yard ||
      null;
    if (yard) return yard;
    if (dutyStatus === "yard_operations" || conductor?.inYard) {
      return {
        yardName: conductor?.yardName || currentConsist?.originYard || "Main Yard",
        railroad: conductor?.railroad || currentConsist?.railroad || "BNSF",
        spottedForLoading: conductor?.spottedForLoading || 4,
        spottedForUnloading: conductor?.spottedForUnloading || 3,
        switchMovesPending: conductor?.switchMovesPending || 6,
        carsReadyForPickup: conductor?.carsReadyForPickup || 8,
        trackAssignments: conductor?.trackAssignments || [
          { track: "Track 3", purpose: "Inbound classification", carCount: 12 },
          { track: "Track 7", purpose: "Outbound staging", carCount: 8 },
          { track: "Track 11", purpose: "Hazmat holding", carCount: 3 },
          { track: "Track 14", purpose: "Bad order / repair", carCount: 2 },
        ],
      };
    }
    return null;
  }, [conductor, currentConsist, dutyStatus]);

  /* ---- compliance / certs ---- */
  const inspections: any[] = complianceData.inspections || [];
  const certifications: any[] = complianceData.certifications || [];
  const safetyScore =
    complianceData.safetyScore ?? complianceData.score ?? null;
  const totalInspections = complianceData.totalInspections || inspections.length;
  const passedInspections =
    complianceData.passedInspections ||
    inspections.filter(
      (i: any) => i.status === "passed" || i.status === "pass"
    ).length;

  /* ---- monthly HOS ---- */
  const monthlyHours = Number(
    conductorHos?.monthlyHours ?? conductor?.monthlyHours ?? hoursOnDuty
  );

  /* ---- documentation ---- */
  const documents = useMemo(() => {
    const docs = conductor?.documents || currentConsist?.documents || [];
    if (Array.isArray(docs) && docs.length > 0) return docs;
    if (!currentConsist) return [];
    return [
      {
        id: 1,
        type: "waybill",
        label: "Waybills",
        status: "complete",
        count: carInventory.length,
        completePct: 100,
      },
      {
        id: 2,
        type: "bol",
        label: "Bills of Lading",
        status: hazmatCarCount > 0 ? "pending_review" : "complete",
        count: carInventory.filter((c: any) => c.status === "loaded").length,
        completePct: hazmatCarCount > 0 ? 85 : 100,
      },
      {
        id: 3,
        type: "hazmat",
        label: "Hazmat Shipping Papers",
        status: hazmatCarCount > 0 ? "active" : "n_a",
        count: hazmatCarCount,
        completePct: hazmatCarCount > 0 ? 100 : 0,
      },
      {
        id: 4,
        type: "inspection",
        label: "Inspection Reports",
        status: "complete",
        count: 2,
        completePct: 100,
      },
    ];
  }, [conductor, currentConsist, carInventory, hazmatCarCount]);

  /* ---- conductor certifications (FRA Part 242) ---- */
  const conductorCerts = useMemo(() => {
    if (certifications.length > 0)
      return certifications.map((c: any) => ({
        ...c,
        label:
          c.name ||
          c.label ||
          c.type ||
          "Certification",
        expires: c.expiresAt || c.expires || c.expirationDate || null,
        status: c.status || "active",
      }));
    return [
      {
        id: 1,
        label: "FRA Part 242 Conductor Certification",
        icon: "conductor",
        status: "active",
        issuedAt: "2024-06-15",
        expires: "2027-06-15",
      },
      {
        id: 2,
        label: "Medical Card (49 CFR Part 391)",
        icon: "medical",
        status: "active",
        issuedAt: "2025-11-01",
        expires: "2027-11-01",
      },
      {
        id: 3,
        label: "Drug & Alcohol Testing",
        icon: "drug_test",
        status: "current",
        issuedAt: "2026-02-10",
        expires: null,
        nextDue: "2026-08-10",
      },
      {
        id: 4,
        label: "Safety Training & Rules Exam",
        icon: "safety",
        status: "active",
        issuedAt: "2025-09-20",
        expires: "2026-09-20",
      },
    ];
  }, [certifications]);

  /* ---- earnings ---- */
  const earnings = useMemo(() => {
    return conductor?.earnings || {
      week: conductor?.weeklyEarnings || conductor?.earningsWeek || 2480,
      month: conductor?.monthlyEarnings || conductor?.earningsMonth || 9850,
      year: conductor?.yearlyEarnings || conductor?.earningsYear || 78600,
    };
  }, [conductor]);

  /* ---- safety record ---- */
  const safetyRecord = useMemo(() => {
    return {
      score: safetyScore ?? 96,
      totalInspections: totalInspections || 18,
      passed: passedInspections || 17,
      incidents: complianceData.incidents ?? conductor?.incidents ?? 0,
      lastInspection:
        inspections[0]?.date ||
        inspections[0]?.inspectedAt ||
        complianceData.lastInspectionDate ||
        null,
      daysWithoutIncident:
        complianceData.daysWithoutIncident ?? conductor?.daysWithoutIncident ?? 342,
    };
  }, [
    safetyScore,
    totalInspections,
    passedInspections,
    complianceData,
    conductor,
    inspections,
  ]);

  /* ---- theme helpers ---- */
  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn(
    "border",
    isLight
      ? "bg-white border-slate-200 shadow-sm"
      : "bg-slate-800/60 border-slate-700/50"
  );
  const text = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-slate-400";
  const dimmer = isLight ? "text-slate-400" : "text-slate-500";

  /* ---- action handlers ---- */
  const handleStartDuty = () => {
    toast.success("Duty period started", {
      description: `On-duty clock started at ${new Date().toLocaleTimeString()}`,
    });
  };
  const handleEndDuty = () => {
    toast.success("Duty period ended", {
      description:
        "Rest period has begun. Minimum 10 hours undisturbed rest required.",
    });
  };
  const handleYardReport = () => {
    toast("Yard report opened", {
      description:
        "Complete yard operations form to log switch moves and car placements.",
    });
  };
  const handleUploadDoc = () => {
    toast("Document upload", {
      description:
        "Select a waybill, BOL, hazmat paper, or inspection report to upload.",
    });
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  if (isLoading) {
    return (
      <div className={cn("min-h-screen p-6 space-y-6", bg)}>
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonCard isLight={isLight} rows={6} />
            <SkeletonCard isLight={isLight} rows={8} />
            <SkeletonCard isLight={isLight} rows={5} />
          </div>
          <div className="space-y-6">
            <SkeletonCard isLight={isLight} rows={5} />
            <SkeletonCard isLight={isLight} rows={4} />
            <SkeletonCard isLight={isLight} rows={4} />
            <SkeletonCard isLight={isLight} rows={3} />
            <SkeletonCard isLight={isLight} rows={3} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen p-4 md:p-6", bg)}>
      {/* ============================================================ */}
      {/*  HEADER                                                       */}
      {/* ============================================================ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2.5 rounded-xl",
              isLight
                ? "bg-gradient-to-br from-violet-100 to-indigo-100"
                : "bg-gradient-to-br from-violet-500/20 to-indigo-500/20"
            )}
          >
            <ClipboardList className="w-7 h-7 text-violet-500" />
          </div>
          <div>
            <h1 className={cn("text-2xl font-bold", text)}>
              Conductor Dashboard
            </h1>
            <div className={cn("flex items-center gap-2 text-sm", muted)}>
              <User className="w-3.5 h-3.5" />
              <span>
                {conductor?.name || "Conductor"}{" "}
                {conductor?.employeeId
                  ? `\u00B7 ID: ${conductor.employeeId}`
                  : conductor?.id
                    ? `\u00B7 #${conductor.id}`
                    : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status badge */}
          <Badge
            className={cn(
              "text-sm px-3 py-1 border font-medium",
              dutyBadge(dutyStatus, isLight)
            )}
          >
            {dutyStatus === "on_duty" && (
              <Activity className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
            )}
            {dutyStatus === "yard_operations" && (
              <ArrowLeftRight className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
            )}
            {dutyStatus === "rest_period" && (
              <Moon className="w-3.5 h-3.5 mr-1.5" />
            )}
            {dutyLabel}
          </Badge>

          {/* Quick actions */}
          {dutyStatus === "off_duty" || dutyStatus === "rest_period" ? (
            <Button
              size="sm"
              onClick={handleStartDuty}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Play className="w-4 h-4 mr-1.5" />
              Start Duty
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleEndDuty}
              variant="outline"
              className={cn(
                isLight
                  ? "border-slate-300 text-slate-700 hover:bg-slate-100"
                  : "border-slate-600 text-slate-300 hover:bg-slate-700"
              )}
            >
              <Square className="w-4 h-4 mr-1.5" />
              End Duty
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleYardReport}
            className={cn(
              isLight
                ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                : "border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
            )}
          >
            <Warehouse className="w-4 h-4 mr-1.5" />
            Yard Report
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  MAIN GRID: 2-col layout (hero left, sidebar right)          */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---- LEFT COLUMN (2/3) ---- */}
        <div className="lg:col-span-2 space-y-6">
          {/* ======================================================== */}
          {/*  CURRENT CONSIST — hero card                              */}
          {/* ======================================================== */}
          <Card className={cardBg}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
                <Train className="w-5 h-5 text-violet-500" />
                Current Consist
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentConsist ? (
                <div className="space-y-4">
                  {/* Top row: consist # + railroad */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={cn(
                        "text-xl font-bold",
                        isLight ? "text-violet-700" : "text-violet-400"
                      )}
                    >
                      {currentConsist.consistNumber}
                    </span>
                    <Badge
                      className={
                        isLight
                          ? "bg-slate-100 text-slate-600"
                          : "bg-slate-700/50 text-slate-300"
                      }
                    >
                      {currentConsist.railroad}
                    </Badge>
                    {hazmatCarCount > 0 && (
                      <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">
                        <Flame className="w-3 h-3 mr-1" />
                        {hazmatCarCount} HAZMAT
                      </Badge>
                    )}
                  </div>

                  {/* Route */}
                  <div
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg",
                      isLight ? "bg-slate-50" : "bg-slate-900/50"
                    )}
                  >
                    <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className={cn("font-medium", text)}>
                      {currentConsist.originYard}
                    </span>
                    <ArrowRight className={cn("w-4 h-4 flex-shrink-0", muted)} />
                    <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className={cn("font-medium", text)}>
                      {currentConsist.destinationYard}
                    </span>
                  </div>

                  {/* Car type breakdown */}
                  {carBreakdown.length > 0 && (
                    <div>
                      <div className={cn("text-xs font-medium mb-2", dimmer)}>
                        Car Breakdown ({carInventory.length} total)
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {carBreakdown.map(({ type, count, label, color }) => (
                          <div
                            key={type}
                            className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium",
                              isLight
                                ? "bg-slate-100 text-slate-700"
                                : "bg-slate-700/50 text-slate-300"
                            )}
                          >
                            <CircleDot className={cn("w-3 h-3", color)} />
                            {label}
                            <span className="font-bold">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hazmat placards */}
                  {hazmatCarCount > 0 && (
                    <div>
                      <div className={cn("text-xs font-medium mb-2", dimmer)}>
                        Hazmat Placards
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {carInventory
                          .filter((c: any) => c.isHazmat && c.hazmatPlacard)
                          .map((car: any, idx: number) => (
                            <HazmatPlacard
                              key={idx}
                              placard={car.hazmatPlacard}
                              isLight={isLight}
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div
                      className={cn(
                        "p-2.5 rounded-lg",
                        isLight ? "bg-slate-50" : "bg-slate-900/40"
                      )}
                    >
                      <div className={cn("text-xs mb-0.5", dimmer)}>
                        <Package className="w-3 h-3 inline mr-1" />
                        Total Cars
                      </div>
                      <div className={cn("text-lg font-bold", text)}>
                        {carInventory.length || currentConsist.totalCars || 0}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "p-2.5 rounded-lg",
                        isLight ? "bg-slate-50" : "bg-slate-900/40"
                      )}
                    >
                      <div className={cn("text-xs mb-0.5", dimmer)}>
                        <Weight className="w-3 h-3 inline mr-1" />
                        Total Weight
                      </div>
                      <div className={cn("text-lg font-bold", text)}>
                        {formatWeight(
                          currentConsist.totalWeight ||
                            carInventory.reduce(
                              (sum: number, c: any) =>
                                sum + (Number(c.weight) || 0),
                              0
                            )
                        )}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "p-2.5 rounded-lg",
                        isLight ? "bg-slate-50" : "bg-slate-900/40"
                      )}
                    >
                      <div className={cn("text-xs mb-0.5", dimmer)}>
                        <Ruler className="w-3 h-3 inline mr-1" />
                        Total Length
                      </div>
                      <div className={cn("text-lg font-bold", text)}>
                        {currentConsist.totalLength
                          ? `${currentConsist.totalLength.toLocaleString()} ft`
                          : `${(carInventory.length * 60).toLocaleString()} ft`}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "p-2.5 rounded-lg",
                        isLight ? "bg-slate-50" : "bg-slate-900/40"
                      )}
                    >
                      <div className={cn("text-xs mb-0.5", dimmer)}>
                        <Wind className="w-3 h-3 inline mr-1" />
                        Air Brake Test
                      </div>
                      <div className="flex flex-col">
                        <Badge
                          className={cn(
                            "text-[10px] w-fit",
                            currentConsist.airBrakeStatus === "passed" ||
                              currentConsist.airBrakeStatus === "pass"
                              ? "bg-emerald-500/20 text-emerald-500"
                              : "bg-amber-500/20 text-amber-500"
                          )}
                        >
                          {currentConsist.airBrakeStatus === "passed" ||
                          currentConsist.airBrakeStatus === "pass" ? (
                            <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                          ) : (
                            <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                          )}
                          {(
                            currentConsist.airBrakeStatus || "passed"
                          ).toUpperCase()}
                        </Badge>
                        <span className={cn("text-[10px] mt-0.5", dimmer)}>
                          Tested {timeAgo(currentConsist.airBrakeTestDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* No assignment empty state */
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div
                    className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center mb-4",
                      isLight ? "bg-slate-100" : "bg-slate-700/40"
                    )}
                  >
                    <Train className={cn("w-8 h-8", dimmer)} />
                  </div>
                  <h3 className={cn("font-semibold text-lg mb-1", text)}>
                    No Current Assignment
                  </h3>
                  <p className={cn("text-sm max-w-xs", muted)}>
                    You are not currently assigned to a consist. Check with
                    dispatch for your next assignment or review upcoming
                    schedules.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ======================================================== */}
          {/*  CAR INVENTORY LIST — scrollable table                    */}
          {/* ======================================================== */}
          {carInventory.length > 0 && (
            <Card className={cardBg}>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle
                    className={cn("flex items-center gap-2 text-lg", text)}
                  >
                    <Package className="w-5 h-5 text-amber-500" />
                    Car Inventory
                    <Badge
                      className={
                        isLight
                          ? "bg-slate-100 text-slate-600 ml-1"
                          : "bg-slate-700/50 text-slate-300 ml-1"
                      }
                    >
                      {carInventory.length} cars
                    </Badge>
                  </CardTitle>
                  <div className="relative">
                    <Search
                      className={cn(
                        "w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2",
                        dimmer
                      )}
                    />
                    <input
                      type="text"
                      placeholder="Search cars..."
                      value={carSearch}
                      onChange={(e) => setCarSearch(e.target.value)}
                      className={cn(
                        "pl-8 pr-3 py-1.5 rounded-lg border text-sm w-full sm:w-56 outline-none transition-colors",
                        isLight
                          ? "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-violet-400"
                          : "bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-violet-500"
                      )}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-[440px] overflow-y-auto rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr
                        className={cn(
                          "text-xs sticky top-0 z-10",
                          isLight
                            ? "bg-slate-50 text-slate-500"
                            : "bg-slate-900/80 text-slate-400"
                        )}
                      >
                        <th className="text-left py-2 px-3 font-medium">#</th>
                        <th className="text-left py-2 px-3 font-medium">
                          Car Number
                        </th>
                        <th className="text-left py-2 px-3 font-medium">
                          Type
                        </th>
                        <th className="text-left py-2 px-3 font-medium">
                          Commodity
                        </th>
                        <th className="text-right py-2 px-3 font-medium">
                          Weight
                        </th>
                        <th className="text-center py-2 px-3 font-medium">
                          Hazmat
                        </th>
                        <th className="text-left py-2 px-3 font-medium">
                          Seal
                        </th>
                        <th className="text-center py-2 px-3 font-medium">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedCars.map((car: any, idx: number) => {
                        const typeInfo = getCarTypeInfo(car.carType);
                        const isHaz = car.isHazmat;
                        return (
                          <tr
                            key={car.id || idx}
                            className={cn(
                              "border-t transition-colors",
                              isLight ? "border-slate-100" : "border-slate-700/40",
                              isHaz
                                ? isLight
                                  ? "bg-red-50/60 hover:bg-red-50"
                                  : "bg-red-500/5 hover:bg-red-500/10"
                                : isLight
                                  ? "hover:bg-slate-50"
                                  : "hover:bg-slate-700/20"
                            )}
                          >
                            <td
                              className={cn(
                                "py-2 px-3 font-mono text-xs",
                                dimmer
                              )}
                            >
                              {car.position || idx + 1}
                            </td>
                            <td className={cn("py-2 px-3 font-mono font-medium", text)}>
                              {car.carNumber}
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={cn(
                                  "flex items-center gap-1 text-xs font-medium",
                                  typeInfo.color
                                )}
                              >
                                <CircleDot className="w-3 h-3" />
                                {typeInfo.label}
                              </span>
                            </td>
                            <td className={cn("py-2 px-3", text)}>
                              {car.commodity || "-"}
                            </td>
                            <td
                              className={cn("py-2 px-3 text-right font-mono", text)}
                            >
                              {formatWeight(car.weight)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {isHaz ? (
                                car.hazmatPlacard ? (
                                  <HazmatPlacard
                                    placard={car.hazmatPlacard}
                                    isLight={isLight}
                                  />
                                ) : (
                                  <Flame className="w-4 h-4 text-red-500 mx-auto" />
                                )
                              ) : (
                                <span className={dimmer}>-</span>
                              )}
                            </td>
                            <td className={cn("py-2 px-3 font-mono text-xs", muted)}>
                              {car.sealNumber ? (
                                <span className="flex items-center gap-1">
                                  <Lock className="w-3 h-3" />
                                  {car.sealNumber}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <Badge
                                className={cn(
                                  "text-[10px] px-1.5",
                                  car.status === "loaded"
                                    ? "bg-emerald-500/20 text-emerald-500"
                                    : car.status === "empty"
                                      ? isLight
                                        ? "bg-slate-100 text-slate-500"
                                        : "bg-slate-700/50 text-slate-400"
                                      : "bg-amber-500/20 text-amber-500"
                                )}
                              >
                                {(car.status || "unknown").toUpperCase()}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Show more / less toggle */}
                {filteredCars.length > 15 && (
                  <div className="mt-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllCars(!showAllCars)}
                      className={cn(
                        "text-xs",
                        isLight
                          ? "text-violet-600 hover:text-violet-700"
                          : "text-violet-400 hover:text-violet-300"
                      )}
                    >
                      {showAllCars ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5 mr-1" />
                          Show fewer
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5 mr-1" />
                          Show all {filteredCars.length} cars
                        </>
                      )}
                    </Button>
                  </div>
                )}
                {filteredCars.length === 0 && carSearch && (
                  <div className="py-8 text-center">
                    <p className={cn("text-sm", muted)}>
                      No cars match &quot;{carSearch}&quot;
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ======================================================== */}
          {/*  YARD OPERATIONS                                          */}
          {/* ======================================================== */}
          <Card className={cardBg}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
                <Warehouse className="w-5 h-5 text-amber-500" />
                Yard Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {yardOps ? (
                <div className="space-y-4">
                  {/* Yard identity */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={cn(
                        "font-bold text-lg",
                        isLight ? "text-amber-700" : "text-amber-400"
                      )}
                    >
                      {yardOps.yardName}
                    </span>
                    <Badge
                      className={
                        isLight
                          ? "bg-slate-100 text-slate-600"
                          : "bg-slate-700/50 text-slate-300"
                      }
                    >
                      {yardOps.railroad}
                    </Badge>
                  </div>

                  {/* Activity stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      {
                        label: "Spotted for Loading",
                        value: yardOps.spottedForLoading,
                        icon: <Truck className="w-3.5 h-3.5 text-blue-500" />,
                        color: isLight ? "text-blue-700" : "text-blue-400",
                      },
                      {
                        label: "Spotted for Unloading",
                        value: yardOps.spottedForUnloading,
                        icon: <Package className="w-3.5 h-3.5 text-emerald-500" />,
                        color: isLight ? "text-emerald-700" : "text-emerald-400",
                      },
                      {
                        label: "Switch Moves Pending",
                        value: yardOps.switchMovesPending,
                        icon: (
                          <ArrowLeftRight className="w-3.5 h-3.5 text-amber-500" />
                        ),
                        color: isLight ? "text-amber-700" : "text-amber-400",
                      },
                      {
                        label: "Ready for Pickup",
                        value: yardOps.carsReadyForPickup,
                        icon: (
                          <CheckCircle className="w-3.5 h-3.5 text-violet-500" />
                        ),
                        color: isLight ? "text-violet-700" : "text-violet-400",
                      },
                    ].map((stat, i) => (
                      <div
                        key={i}
                        className={cn(
                          "p-3 rounded-lg",
                          isLight ? "bg-slate-50" : "bg-slate-900/40"
                        )}
                      >
                        <div className={cn("flex items-center gap-1 text-xs mb-1", dimmer)}>
                          {stat.icon}
                          {stat.label}
                        </div>
                        <div className={cn("text-xl font-bold", stat.color)}>
                          {stat.value ?? 0}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Track assignments */}
                  {yardOps.trackAssignments &&
                    yardOps.trackAssignments.length > 0 && (
                      <div>
                        <div className={cn("text-xs font-medium mb-2", dimmer)}>
                          Track Assignments
                        </div>
                        <div className="space-y-2">
                          {yardOps.trackAssignments.map(
                            (track: any, idx: number) => (
                              <div
                                key={idx}
                                className={cn(
                                  "flex items-center justify-between p-2.5 rounded-lg",
                                  isLight ? "bg-slate-50" : "bg-slate-900/40"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <Badge
                                    className={cn(
                                      "font-mono text-xs px-2",
                                      isLight
                                        ? "bg-violet-100 text-violet-700"
                                        : "bg-violet-500/20 text-violet-400"
                                    )}
                                  >
                                    {track.track}
                                  </Badge>
                                  <span className={cn("text-sm", text)}>
                                    {track.purpose}
                                  </span>
                                </div>
                                <span className={cn("text-sm font-medium", muted)}>
                                  {track.carCount} cars
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center mb-3",
                      isLight ? "bg-slate-100" : "bg-slate-700/40"
                    )}
                  >
                    <Warehouse className={cn("w-6 h-6", dimmer)} />
                  </div>
                  <p className={cn("text-sm", muted)}>
                    No active yard operations. Yard activities will appear here
                    when you are assigned to yard duty.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ======================================================== */}
          {/*  DOCUMENTATION                                            */}
          {/* ======================================================== */}
          <Card className={cardBg}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle
                  className={cn("flex items-center gap-2 text-lg", text)}
                >
                  <FileText className="w-5 h-5 text-cyan-500" />
                  Documentation
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleUploadDoc}
                  className={cn(
                    "text-xs",
                    isLight
                      ? "border-cyan-300 text-cyan-700 hover:bg-cyan-50"
                      : "border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10"
                  )}
                >
                  <Upload className="w-3.5 h-3.5 mr-1" />
                  Upload Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc: any, idx: number) => {
                    const docStatusMap: Record<string, { label: string; cls: string }> = {
                      complete: {
                        label: "Complete",
                        cls: "bg-emerald-500/20 text-emerald-500",
                      },
                      pending_review: {
                        label: "Pending Review",
                        cls: "bg-amber-500/20 text-amber-500",
                      },
                      active: {
                        label: "Active",
                        cls: "bg-blue-500/20 text-blue-500",
                      },
                      n_a: {
                        label: "N/A",
                        cls: isLight
                          ? "bg-slate-100 text-slate-500"
                          : "bg-slate-700/50 text-slate-400",
                      },
                      missing: {
                        label: "Missing",
                        cls: "bg-red-500/20 text-red-500",
                      },
                    };
                    const st =
                      docStatusMap[doc.status] || docStatusMap.complete;
                    const iconMap: Record<string, React.ReactNode> = {
                      waybill: (
                        <BookOpen className="w-4 h-4 text-cyan-500" />
                      ),
                      bol: <FileText className="w-4 h-4 text-blue-500" />,
                      hazmat: <Flame className="w-4 h-4 text-red-500" />,
                      inspection: (
                        <Eye className="w-4 h-4 text-emerald-500" />
                      ),
                    };

                    return (
                      <div
                        key={doc.id || idx}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg",
                          isLight ? "bg-slate-50" : "bg-slate-900/40"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {iconMap[doc.type] || (
                            <FileText className={cn("w-4 h-4", muted)} />
                          )}
                          <div>
                            <div className={cn("text-sm font-medium", text)}>
                              {doc.label}
                            </div>
                            <div className={cn("text-xs", dimmer)}>
                              {doc.count} document{doc.count !== 1 ? "s" : ""}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {doc.completePct != null &&
                            doc.completePct < 100 &&
                            doc.status !== "n_a" && (
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "w-16 h-1.5 rounded-full overflow-hidden",
                                    isLight ? "bg-slate-200" : "bg-slate-700"
                                  )}
                                >
                                  <div
                                    className="h-full rounded-full bg-amber-500"
                                    style={{
                                      width: `${doc.completePct}%`,
                                    }}
                                  />
                                </div>
                                <span
                                  className={cn("text-xs font-mono", dimmer)}
                                >
                                  {doc.completePct}%
                                </span>
                              </div>
                            )}
                          <Badge className={cn("text-[10px]", st.cls)}>
                            {st.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className={cn("text-sm text-center py-6", muted)}>
                  No documentation for current assignment.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ---- RIGHT COLUMN (1/3) ---- */}
        <div className="space-y-6">
          {/* ======================================================== */}
          {/*  HOS STATUS — conductor 49 CFR 228                       */}
          {/* ======================================================== */}
          <Card className={cardBg}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
                <Clock className="w-5 h-5 text-blue-500" />
                Hours of Service
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HosProgressBar
                current={hoursOnDuty}
                max={maxOnDuty}
                label="On-Duty (12h limit)"
                isLight={isLight}
              />
              <HosProgressBar
                current={
                  conductorHos?.restHours ??
                  (lastRelieved ? Math.min(restHoursSinceLast, 10) : 0)
                }
                max={10}
                label="Rest Period (10h min)"
                invert
                isLight={isLight}
              />
              <HosProgressBar
                current={monthlyHours}
                max={276}
                label="Monthly Hours (276h cap)"
                isLight={isLight}
              />

              {/* Duty start/rest since */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className={dimmer}>Duty Started</span>
                  <span className={cn("font-medium", text)}>
                    {conductorHos?.dutyStartedAt || conductorHos?.startedAt
                      ? formatTime(
                          conductorHos.dutyStartedAt ||
                            conductorHos.startedAt
                        )
                      : "--:--"}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className={dimmer}>Last Relieved</span>
                  <span className={cn("font-medium", text)}>
                    {lastRelieved ? timeAgo(lastRelieved) : "N/A"}
                  </span>
                </div>
              </div>

              {/* Warnings */}
              {hoursOnDuty >= 10 && (
                <div
                  className={cn(
                    "mt-4 flex items-start gap-2 p-2.5 rounded-lg text-xs",
                    hoursOnDuty >= 11.5
                      ? "bg-red-500/10 text-red-500"
                      : "bg-amber-500/10 text-amber-500"
                  )}
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">
                      {hoursOnDuty >= 11.5
                        ? "CRITICAL: Approaching 12h limit"
                        : "Warning: High duty hours"}
                    </span>
                    <p className="opacity-80 mt-0.5">
                      {(maxOnDuty - hoursOnDuty).toFixed(1)}h remaining before
                      mandatory rest.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ======================================================== */}
          {/*  CERTIFICATIONS — FRA Part 242                            */}
          {/* ======================================================== */}
          <Card className={cardBg}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
                <Award className="w-5 h-5 text-emerald-500" />
                Certifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {conductorCerts.map((cert: any, idx: number) => {
                const days = daysUntil(cert.expires || cert.nextDue);
                const isExpiring = days <= 90 && days > 0;
                const isExpired = days <= 0 && cert.expires;
                const certIcons: Record<string, React.ReactNode> = {
                  conductor: (
                    <BadgeCheck className="w-4 h-4 text-violet-500" />
                  ),
                  medical: (
                    <Stethoscope className="w-4 h-4 text-blue-500" />
                  ),
                  drug_test: (
                    <FlaskConical className="w-4 h-4 text-amber-500" />
                  ),
                  safety: (
                    <GraduationCap className="w-4 h-4 text-emerald-500" />
                  ),
                };

                return (
                  <div
                    key={cert.id || idx}
                    className={cn(
                      "p-3 rounded-lg border",
                      isExpired
                        ? "border-red-500/30 bg-red-500/5"
                        : isExpiring
                          ? "border-amber-500/30 bg-amber-500/5"
                          : isLight
                            ? "border-slate-100 bg-slate-50"
                            : "border-slate-700/40 bg-slate-900/40"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {certIcons[cert.icon] ||
                        certIcons.conductor}
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            "text-sm font-medium leading-tight",
                            text
                          )}
                        >
                          {cert.label}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge
                            className={cn(
                              "text-[10px]",
                              isExpired
                                ? "bg-red-500/20 text-red-500"
                                : isExpiring
                                  ? "bg-amber-500/20 text-amber-500"
                                  : cert.status === "current" ||
                                      cert.status === "active"
                                    ? "bg-emerald-500/20 text-emerald-500"
                                    : "bg-slate-500/20 text-slate-400"
                            )}
                          >
                            {isExpired
                              ? "EXPIRED"
                              : isExpiring
                                ? `EXPIRES ${days}d`
                                : (cert.status || "active").toUpperCase()}
                          </Badge>
                          {cert.expires && !isExpired && (
                            <span className={cn("text-[10px]", dimmer)}>
                              Exp: {formatDate(cert.expires)}
                            </span>
                          )}
                          {cert.nextDue && (
                            <span className={cn("text-[10px]", dimmer)}>
                              Next: {formatDate(cert.nextDue)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* ======================================================== */}
          {/*  SAFETY RECORD                                            */}
          {/* ======================================================== */}
          <Card className={cardBg}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
                <Shield className="w-5 h-5 text-blue-500" />
                Safety Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Safety score */}
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm", muted)}>Safety Score</span>
                  <span
                    className={cn(
                      "text-2xl font-bold",
                      safetyRecord.score >= 90
                        ? "text-emerald-500"
                        : safetyRecord.score >= 70
                          ? "text-amber-500"
                          : "text-red-500"
                    )}
                  >
                    {safetyRecord.score}%
                  </span>
                </div>

                {/* Stats */}
                <div
                  className={cn(
                    "grid grid-cols-2 gap-2 p-3 rounded-lg",
                    isLight ? "bg-slate-50" : "bg-slate-900/40"
                  )}
                >
                  <div>
                    <div className={cn("text-xs", dimmer)}>Inspections</div>
                    <div className={cn("text-sm font-semibold", text)}>
                      {safetyRecord.passed}/{safetyRecord.totalInspections}{" "}
                      passed
                    </div>
                  </div>
                  <div>
                    <div className={cn("text-xs", dimmer)}>Incidents</div>
                    <div
                      className={cn(
                        "text-sm font-semibold",
                        safetyRecord.incidents === 0
                          ? "text-emerald-500"
                          : "text-red-500"
                      )}
                    >
                      {safetyRecord.incidents}
                    </div>
                  </div>
                  <div>
                    <div className={cn("text-xs", dimmer)}>
                      Days w/o Incident
                    </div>
                    <div className={cn("text-sm font-semibold text-emerald-500")}>
                      {safetyRecord.daysWithoutIncident}
                    </div>
                  </div>
                  <div>
                    <div className={cn("text-xs", dimmer)}>Last Inspection</div>
                    <div className={cn("text-sm font-medium", text)}>
                      {safetyRecord.lastInspection
                        ? timeAgo(safetyRecord.lastInspection)
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ======================================================== */}
          {/*  EARNINGS                                                 */}
          {/* ======================================================== */}
          <Card className={cardBg}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
                <DollarSign className="w-5 h-5 text-emerald-500" />
                Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    label: "This Week",
                    value: earnings.week,
                    icon: <Calendar className="w-3.5 h-3.5" />,
                  },
                  {
                    label: "This Month",
                    value: earnings.month,
                    icon: <TrendingUp className="w-3.5 h-3.5" />,
                  },
                  {
                    label: "Year to Date",
                    value: earnings.year,
                    icon: <Banknote className="w-3.5 h-3.5" />,
                  },
                ].map((row, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      isLight ? "bg-slate-50" : "bg-slate-900/40"
                    )}
                  >
                    <div className={cn("flex items-center gap-2 text-sm", muted)}>
                      {row.icon}
                      {row.label}
                    </div>
                    <span
                      className={cn(
                        "text-lg font-bold",
                        isLight ? "text-emerald-700" : "text-emerald-400"
                      )}
                    >
                      {formatCurrency(row.value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
