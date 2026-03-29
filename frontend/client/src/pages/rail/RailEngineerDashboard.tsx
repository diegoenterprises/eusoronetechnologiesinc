/**
 * RAIL ENGINEER DASHBOARD — Personal Dashboard
 * The first page a RAIL_ENGINEER sees on login.
 * Current assignment, HOS (49 CFR 228), certifications (FRA Part 240),
 * upcoming assignments, safety record, earnings summary.
 */

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Train,
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
  ClipboardCheck,
  User,
  BadgeCheck,
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
    rest_period: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  };
  return map[status] || map.off_duty;
}

function assignmentStatusBadge(status: string) {
  const map: Record<string, string> = {
    confirmed: "bg-emerald-500/20 text-emerald-400",
    pending: "bg-amber-500/20 text-amber-400",
    tentative: "bg-blue-500/20 text-blue-400",
    completed: "bg-slate-500/20 text-slate-400",
    cancelled: "bg-red-500/20 text-red-400",
  };
  return map[status] || "bg-slate-500/20 text-slate-400";
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
/*  Helper: format relative time                                       */
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

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */
export default function RailEngineerDashboard() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  /* ---- queries ---- */
  const hosQuery = (trpc as any).railShipments.getRailCrewHOS.useQuery();
  const crewQuery = (trpc as any).railShipments.getRailCrew.useQuery({ limit: 100 });
  const complianceQuery = (trpc as any).railShipments.getRailCompliance.useQuery({});

  const isLoading = hosQuery.isLoading || crewQuery.isLoading || complianceQuery.isLoading;

  /* ---- derive engineer data ---- */
  const allCrew: any[] = crewQuery.data || [];
  const hosData: any[] = hosQuery.data || [];
  const complianceData: any = complianceQuery.data || {};

  // The logged-in engineer (first engineer in the crew list, or first HOS entry)
  const engineer = useMemo(() => {
    const eng = allCrew.find((c: any) => c.role === "engineer");
    return eng || allCrew[0] || null;
  }, [allCrew]);

  const engineerHos = useMemo(() => {
    if (!hosData.length) return null;
    const match = hosData.find(
      (h: any) => h.crewMemberId === engineer?.id || h.name === engineer?.name
    );
    return match || hosData[0] || null;
  }, [hosData, engineer]);

  /* ---- derive duty status ---- */
  const hoursOnDuty = Number(engineerHos?.hoursOnDuty ?? engineer?.hoursToday ?? 0);
  const maxOnDuty = 12;
  const lastRelieved = engineerHos?.relievedAt || null;
  const restHoursSinceLast = lastRelieved
    ? (Date.now() - new Date(lastRelieved).getTime()) / 3600000
    : 0;
  const dutyStarted = engineerHos?.dutyStartedAt || engineerHos?.startedAt || null;

  const dutyStatus: "on_duty" | "off_duty" | "rest_period" = engineerHos
    ? engineerHos.relievedAt
      ? restHoursSinceLast < 10
        ? "rest_period"
        : "off_duty"
      : "on_duty"
    : "off_duty";

  const dutyLabel =
    dutyStatus === "on_duty"
      ? "On Duty"
      : dutyStatus === "rest_period"
        ? "Rest Period"
        : "Off Duty";

  /* ---- derive current assignment ---- */
  const currentAssignment = useMemo(() => {
    if (!engineer) return null;
    // Look for assignment data embedded in crew or HOS data
    const assignment = engineer.currentAssignment || engineer.assignment || null;
    if (assignment) return assignment;
    // Construct from available fields
    if (engineer.consistNumber || engineer.consist) {
      return {
        consistNumber: engineer.consistNumber || engineer.consist,
        railroad: engineer.railroad || "Class I Railroad",
        originYard: engineer.originYard || engineer.origin || "Origin Yard",
        destinationYard: engineer.destinationYard || engineer.destination || "Destination Yard",
        departureTime: engineer.departureTime || engineer.scheduledDeparture,
        estimatedArrival: engineer.estimatedArrival || engineer.eta,
        totalCars: engineer.totalCars || engineer.carCount || 0,
        hasHazmat: engineer.hasHazmat || false,
        routeDescription: engineer.routeDescription || engineer.route || "",
        progressPct: engineer.progressPct || engineer.progress || 0,
      };
    }
    return null;
  }, [engineer]);

  /* ---- derive upcoming assignments ---- */
  const upcomingAssignments = useMemo(() => {
    const assignments = engineer?.upcomingAssignments || engineer?.assignments || [];
    if (Array.isArray(assignments) && assignments.length > 0) return assignments.slice(0, 5);
    // Generate from crew data if multiple entries exist
    return allCrew
      .filter(
        (c: any) =>
          c.role === "engineer" &&
          c.id !== engineer?.id &&
          (c.consistNumber || c.consist || c.scheduledDeparture)
      )
      .slice(0, 5)
      .map((c: any, idx: number) => ({
        id: c.id || idx,
        date: c.scheduledDeparture || c.departureTime || null,
        consistNumber: c.consistNumber || c.consist || `CN-${1000 + idx}`,
        origin: c.originYard || c.origin || "Yard A",
        destination: c.destinationYard || c.destination || "Yard B",
        estimatedDuration: c.estimatedDuration || null,
        status: c.assignmentStatus || "confirmed",
      }));
  }, [engineer, allCrew]);

  /* ---- compliance / certs ---- */
  const inspections: any[] = complianceData.inspections || [];
  const hazmatPermits: any[] = complianceData.hazmatPermits || [];
  const certifications: any[] = complianceData.certifications || [];
  const safetyScore = complianceData.safetyScore ?? complianceData.score ?? null;
  const totalInspections = complianceData.totalInspections || inspections.length;
  const passedInspections =
    complianceData.passedInspections ||
    inspections.filter((i: any) => i.status === "passed" || i.status === "pass").length;

  /* ---- monthly HOS ---- */
  const monthlyHours = Number(engineerHos?.monthlyHours ?? engineer?.monthlyHours ?? hoursOnDuty);

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
      description: "Rest period has begun. Minimum 10 hours undisturbed rest required.",
    });
  };
  const handleReportIssue = () => {
    toast("Issue report opened", {
      description: "Complete the form to submit a safety or mechanical report.",
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
            <SkeletonCard isLight={isLight} rows={5} />
          </div>
          <div className="space-y-6">
            <SkeletonCard isLight={isLight} rows={5} />
            <SkeletonCard isLight={isLight} rows={4} />
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
                ? "bg-gradient-to-br from-blue-100 to-indigo-100"
                : "bg-gradient-to-br from-blue-500/20 to-indigo-500/20"
            )}
          >
            <Train className="w-7 h-7 text-blue-500" />
          </div>
          <div>
            <h1 className={cn("text-2xl font-bold", text)}>
              Engineer Dashboard
            </h1>
            <div className={cn("flex items-center gap-2 text-sm", muted)}>
              <User className="w-3.5 h-3.5" />
              <span>
                {engineer?.name || "Engineer"}{" "}
                {engineer?.employeeId
                  ? `\u00B7 ID: ${engineer.employeeId}`
                  : engineer?.id
                    ? `\u00B7 #${engineer.id}`
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
            {dutyStatus === "rest_period" && (
              <Moon className="w-3.5 h-3.5 mr-1.5" />
            )}
            {dutyLabel}
          </Badge>

          {/* Quick actions */}
          {dutyStatus !== "on_duty" ? (
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
            onClick={handleReportIssue}
            className={cn(
              isLight
                ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                : "border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
            )}
          >
            <FileWarning className="w-4 h-4 mr-1.5" />
            Report Issue
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
          {/*  CURRENT ASSIGNMENT — hero card                           */}
          {/* ======================================================== */}
          <Card className={cardBg}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
                <Train className="w-5 h-5 text-blue-500" />
                Current Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentAssignment ? (
                <div className="space-y-4">
                  {/* Top row: consist + railroad */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={cn(
                        "text-xl font-bold",
                        isLight ? "text-blue-700" : "text-blue-400"
                      )}
                    >
                      {currentAssignment.consistNumber}
                    </span>
                    <Badge
                      className={
                        isLight
                          ? "bg-slate-100 text-slate-600"
                          : "bg-slate-700/50 text-slate-300"
                      }
                    >
                      {currentAssignment.railroad}
                    </Badge>
                    {currentAssignment.hasHazmat && (
                      <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">
                        <Flame className="w-3 h-3 mr-1" />
                        HAZMAT
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
                      {currentAssignment.originYard}
                    </span>
                    <ArrowRight className={cn("w-4 h-4 flex-shrink-0", muted)} />
                    <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className={cn("font-medium", text)}>
                      {currentAssignment.destinationYard}
                    </span>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <div className={cn("text-xs mb-0.5", dimmer)}>Departure</div>
                      <div className={cn("text-sm font-medium", text)}>
                        {formatTime(currentAssignment.departureTime)}
                      </div>
                    </div>
                    <div>
                      <div className={cn("text-xs mb-0.5", dimmer)}>Est. Arrival</div>
                      <div className={cn("text-sm font-medium", text)}>
                        {formatTime(currentAssignment.estimatedArrival)}
                      </div>
                    </div>
                    <div>
                      <div className={cn("text-xs mb-0.5", dimmer)}>Total Cars</div>
                      <div className={cn("text-sm font-medium", text)}>
                        <Package className="w-3.5 h-3.5 inline mr-1 opacity-60" />
                        {currentAssignment.totalCars || "--"}
                      </div>
                    </div>
                    <div>
                      <div className={cn("text-xs mb-0.5", dimmer)}>Progress</div>
                      <div className={cn("text-sm font-medium", text)}>
                        {currentAssignment.progressPct || 0}%
                      </div>
                    </div>
                  </div>

                  {/* Route progress bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className={muted}>Route Progress</span>
                      <span className={cn("font-medium", text)}>
                        {currentAssignment.progressPct || 0}%
                      </span>
                    </div>
                    <div
                      className={cn(
                        "h-3 rounded-full overflow-hidden",
                        isLight ? "bg-slate-200" : "bg-slate-700/60"
                      )}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                        style={{
                          width: `${Math.min(currentAssignment.progressPct || 0, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Route description */}
                  {currentAssignment.routeDescription && (
                    <div
                      className={cn(
                        "text-xs p-2.5 rounded-lg",
                        isLight
                          ? "bg-blue-50 text-blue-700"
                          : "bg-blue-500/10 text-blue-400"
                      )}
                    >
                      <span className="font-medium">Route:</span>{" "}
                      {currentAssignment.routeDescription}
                    </div>
                  )}
                </div>
              ) : (
                /* ---- Empty state ---- */
                <div className="text-center py-8">
                  <div
                    className={cn(
                      "mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4",
                      isLight ? "bg-slate-100" : "bg-slate-800"
                    )}
                  >
                    <Train className={cn("w-8 h-8", dimmer)} />
                  </div>
                  <p className={cn("text-lg font-medium mb-1", text)}>
                    No Active Assignment
                  </p>
                  <p className={cn("text-sm", muted)}>
                    {upcomingAssignments.length > 0
                      ? "Your next assignment is shown below."
                      : "No upcoming assignments scheduled."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ======================================================== */}
          {/*  HOS STATUS — prominent card                              */}
          {/* ======================================================== */}
          <Card className={cardBg}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
                <Clock className="w-5 h-5 text-cyan-500" />
                Hours of Service
                <Badge
                  className={cn(
                    "ml-auto text-xs",
                    hoursOnDuty > 11
                      ? "bg-red-500/20 text-red-400"
                      : hoursOnDuty > 9
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-emerald-500/20 text-emerald-400"
                  )}
                >
                  49 CFR 228
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* On-duty hours */}
              <HosProgressBar
                current={hoursOnDuty}
                max={maxOnDuty}
                label="On-Duty Time"
                isLight={isLight}
              />

              {/* Rest period */}
              <HosProgressBar
                current={Math.min(restHoursSinceLast, 10)}
                max={10}
                label="Rest Period (10hr undisturbed required)"
                isLight={isLight}
              />

              {/* Monthly hours */}
              <HosProgressBar
                current={monthlyHours}
                max={276}
                label="Monthly Hours"
                isLight={isLight}
              />

              {/* Warnings */}
              {hoursOnDuty > 11 && (
                <div
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg text-sm",
                    "bg-red-500/10 border border-red-500/20 text-red-500"
                  )}
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">
                    Approaching 12-hour limit! {(maxOnDuty - hoursOnDuty).toFixed(1)}h remaining.
                  </span>
                </div>
              )}

              {dutyStatus === "rest_period" && restHoursSinceLast < 10 && (
                <div
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg text-sm",
                    "bg-blue-500/10 border border-blue-500/20 text-blue-500"
                  )}
                >
                  <Moon className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Rest in progress: {restHoursSinceLast.toFixed(1)}h of 10h completed.{" "}
                    {(10 - restHoursSinceLast).toFixed(1)}h remaining.
                  </span>
                </div>
              )}

              {/* Timestamps */}
              <div
                className={cn(
                  "grid grid-cols-2 gap-3 pt-2 border-t",
                  isLight ? "border-slate-200" : "border-slate-700/50"
                )}
              >
                <div>
                  <div className={cn("text-xs mb-0.5", dimmer)}>Last Duty Started</div>
                  <div className={cn("text-sm font-medium", text)}>
                    {dutyStarted ? formatTime(dutyStarted) : "N/A"}
                  </div>
                </div>
                <div>
                  <div className={cn("text-xs mb-0.5", dimmer)}>Last Rest Completed</div>
                  <div className={cn("text-sm font-medium", text)}>
                    {lastRelieved && restHoursSinceLast >= 10
                      ? timeAgo(lastRelieved)
                      : lastRelieved
                        ? "In progress"
                        : "N/A"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ======================================================== */}
          {/*  UPCOMING ASSIGNMENTS — timeline list                     */}
          {/* ======================================================== */}
          <Card className={cardBg}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
                <Calendar className="w-5 h-5 text-indigo-500" />
                Upcoming Assignments
                {upcomingAssignments.length > 0 && (
                  <Badge className="ml-auto bg-indigo-500/20 text-indigo-400">
                    {upcomingAssignments.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingAssignments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAssignments.map((a: any, idx: number) => (
                    <div
                      key={a.id || idx}
                      className={cn(
                        "flex items-center gap-4 p-3 rounded-lg border transition-colors",
                        isLight
                          ? "border-slate-200 hover:bg-slate-50"
                          : "border-slate-700/50 hover:bg-slate-800/80"
                      )}
                    >
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full",
                            idx === 0
                              ? "bg-indigo-500"
                              : isLight
                                ? "bg-slate-300"
                                : "bg-slate-600"
                          )}
                        />
                        {idx < upcomingAssignments.length - 1 && (
                          <div
                            className={cn(
                              "w-px h-8 mt-1",
                              isLight ? "bg-slate-200" : "bg-slate-700"
                            )}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("font-semibold text-sm", text)}>
                            {a.consistNumber || a.consist || `Assignment ${idx + 1}`}
                          </span>
                          <Badge
                            className={cn(
                              "text-xs",
                              assignmentStatusBadge(a.status || "confirmed")
                            )}
                          >
                            {(a.status || "confirmed").replace("_", " ")}
                          </Badge>
                        </div>
                        <div className={cn("text-xs mt-1 flex items-center gap-1", muted)}>
                          <MapPin className="w-3 h-3" />
                          {a.origin || a.originYard || "TBD"}
                          <ArrowRight className="w-3 h-3" />
                          {a.destination || a.destinationYard || "TBD"}
                        </div>
                      </div>

                      {/* Right: date + duration */}
                      <div className="text-right flex-shrink-0">
                        <div className={cn("text-sm font-medium", text)}>
                          {a.date
                            ? formatDate(a.date)
                            : a.scheduledDate
                              ? formatDate(a.scheduledDate)
                              : "TBD"}
                        </div>
                        {(a.estimatedDuration || a.duration) && (
                          <div className={cn("text-xs", dimmer)}>
                            <Timer className="w-3 h-3 inline mr-0.5" />
                            {a.estimatedDuration || a.duration}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={cn("text-center py-6 text-sm", muted)}>
                  No upcoming assignments scheduled.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ---- RIGHT COLUMN (1/3) ---- */}
        <div className="space-y-6">
          {/* ======================================================== */}
          {/*  CERTIFICATIONS & COMPLIANCE                              */}
          {/* ======================================================== */}
          <Card className={cardBg}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
                <Award className="w-5 h-5 text-amber-500" />
                Certifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* FRA Part 240 */}
              <div
                className={cn(
                  "p-3 rounded-lg border",
                  isLight ? "border-slate-200 bg-slate-50" : "border-slate-700/50 bg-slate-900/40"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("text-sm font-semibold", text)}>
                    FRA Part 240
                  </span>
                  {(() => {
                    const cert = certifications.find(
                      (c: any) =>
                        c.type === "engineer" ||
                        c.name?.includes("240") ||
                        c.name?.includes("Engineer")
                    );
                    const expDays = cert ? daysUntil(cert.expiryDate || cert.expiry) : 999;
                    const valid = cert
                      ? cert.status === "active" || cert.status === "valid" || cert.status === "compliant"
                      : false;
                    return (
                      <Badge
                        className={cn(
                          "text-xs",
                          valid && expDays > 90
                            ? "bg-emerald-500/20 text-emerald-400"
                            : valid && expDays > 30
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-red-500/20 text-red-400"
                        )}
                      >
                        {valid ? (expDays <= 90 ? "Expiring Soon" : "Active") : "Review Needed"}
                      </Badge>
                    );
                  })()}
                </div>
                <div className={cn("text-xs space-y-1", muted)}>
                  {(() => {
                    const cert = certifications.find(
                      (c: any) =>
                        c.type === "engineer" ||
                        c.name?.includes("240") ||
                        c.name?.includes("Engineer")
                    );
                    return (
                      <>
                        <div>
                          Certificate:{" "}
                          <span className={text}>
                            {cert?.certificateNumber || cert?.number || "FRA-240-XXXX"}
                          </span>
                        </div>
                        <div>
                          Expires:{" "}
                          <span
                            className={cn(
                              "font-medium",
                              daysUntil(cert?.expiryDate || cert?.expiry) < 90
                                ? "text-red-500"
                                : text
                            )}
                          >
                            {formatDate(cert?.expiryDate || cert?.expiry)}
                          </span>
                        </div>
                        {cert && (
                          <div>
                            Days until expiry:{" "}
                            <span
                              className={cn(
                                "font-medium",
                                daysUntil(cert?.expiryDate || cert?.expiry) < 90
                                  ? "text-red-500"
                                  : text
                              )}
                            >
                              {daysUntil(cert?.expiryDate || cert?.expiry)}
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Medical Card */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BadgeCheck
                    className={cn(
                      "w-4 h-4",
                      isLight ? "text-emerald-600" : "text-emerald-400"
                    )}
                  />
                  <span className={cn("text-sm", text)}>Medical Card</span>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                  Valid
                </Badge>
              </div>

              {/* Drug & Alcohol Testing */}
              <div
                className={cn(
                  "p-3 rounded-lg",
                  isLight ? "bg-slate-50" : "bg-slate-900/40"
                )}
              >
                <div className={cn("text-sm font-medium mb-1.5", text)}>
                  Drug & Alcohol Program
                </div>
                <div className={cn("text-xs space-y-1", muted)}>
                  <div className="flex justify-between">
                    <span>Last Test</span>
                    <span className={text}>
                      {complianceData.lastDrugTest
                        ? formatDate(complianceData.lastDrugTest)
                        : "On file"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Next Scheduled</span>
                    <span className={text}>
                      {complianceData.nextDrugTest
                        ? formatDate(complianceData.nextDrugTest)
                        : "Per random schedule"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>49 CFR 219 Status</span>
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                      Compliant
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Training */}
              {certifications.length > 0 && (
                <div>
                  <div className={cn("text-xs font-medium mb-2", dimmer)}>
                    Training & Certifications
                  </div>
                  <div className="space-y-1.5">
                    {certifications.slice(0, 4).map((cert: any, idx: number) => {
                      const isValid =
                        cert.status === "active" ||
                        cert.status === "valid" ||
                        cert.status === "compliant" ||
                        cert.status === "pass";
                      return (
                        <div
                          key={cert.id || idx}
                          className="flex items-center justify-between"
                        >
                          <span className={cn("text-xs truncate mr-2", muted)}>
                            {cert.name || cert.type || `Cert #${idx + 1}`}
                          </span>
                          {isValid ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ======================================================== */}
          {/*  SAFETY RECORD                                            */}
          {/* ======================================================== */}
          <Card className={cardBg}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
                <Shield className="w-5 h-5 text-emerald-500" />
                Safety Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Safety score */}
                {safetyScore !== null && (
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm", muted)}>Safety Score</span>
                    <span
                      className={cn(
                        "text-xl font-bold",
                        Number(safetyScore) >= 90
                          ? "text-emerald-500"
                          : Number(safetyScore) >= 70
                            ? "text-amber-500"
                            : "text-red-500"
                      )}
                    >
                      {safetyScore}
                      <span className="text-xs font-normal ml-0.5">/100</span>
                    </span>
                  </div>
                )}

                {/* Incidents */}
                <div
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-lg",
                    isLight ? "bg-slate-50" : "bg-slate-900/40"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className={cn("text-sm", muted)}>Incidents (12 mo)</span>
                  </div>
                  <span className={cn("text-sm font-bold", text)}>
                    {complianceData.incidents || complianceData.totalIncidents || 0}
                  </span>
                </div>

                {/* Inspections */}
                <div
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-lg",
                    isLight ? "bg-slate-50" : "bg-slate-900/40"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-blue-500" />
                    <span className={cn("text-sm", muted)}>Inspections</span>
                  </div>
                  <span className={cn("text-sm font-bold", text)}>
                    {passedInspections}/{totalInspections} passed
                  </span>
                </div>

                {/* Last inspection */}
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs", dimmer)}>Last Inspection</span>
                  <span className={cn("text-xs font-medium", muted)}>
                    {inspections.length > 0
                      ? formatDate(
                          inspections[0].date ||
                            inspections[0].inspectionDate ||
                            inspections[0].createdAt
                        )
                      : "N/A"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ======================================================== */}
          {/*  EARNINGS SUMMARY                                         */}
          {/* ======================================================== */}
          <Card className={cardBg}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
                <DollarSign className="w-5 h-5 text-green-500" />
                Earnings Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    label: "This Week",
                    value: engineer?.earningsWeek ?? engineer?.weeklyEarnings ?? null,
                  },
                  {
                    label: "This Month",
                    value: engineer?.earningsMonth ?? engineer?.monthlyEarnings ?? null,
                  },
                  {
                    label: "This Year",
                    value: engineer?.earningsYear ?? engineer?.yearlyEarnings ?? null,
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-lg",
                      isLight ? "bg-slate-50" : "bg-slate-900/40"
                    )}
                  >
                    <span className={cn("text-sm", muted)}>{label}</span>
                    <span className={cn("text-sm font-bold", text)}>
                      {value !== null && value !== undefined
                        ? `$${Number(value).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : "--"}
                    </span>
                  </div>
                ))}

                {/* Rate */}
                <div
                  className={cn(
                    "pt-2 border-t flex items-center justify-between",
                    isLight ? "border-slate-200" : "border-slate-700/50"
                  )}
                >
                  <span className={cn("text-xs", dimmer)}>Rate</span>
                  <span className={cn("text-xs font-medium", muted)}>
                    {engineer?.hourlyRate
                      ? `$${engineer.hourlyRate}/hr`
                      : engineer?.tripRate
                        ? `$${engineer.tripRate}/trip`
                        : "Per agreement"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs", dimmer)}>Overtime This Month</span>
                  <span className={cn("text-xs font-medium", muted)}>
                    {engineer?.overtimeHours ?? monthlyHours > 160 ? `${(monthlyHours - 160).toFixed(1)}h` : "0h"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
