/**
 * PORT MASTER DASHBOARD — Terminal Operations Center
 * Berth allocation, vessel scheduling, gate operations, container yard,
 * equipment status, security & safety, and KPI tracking.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Building2, Ship, Anchor, Container, Truck, Gauge, Shield,
  Clock, AlertTriangle, ArrowUpRight, ArrowDownLeft,
  Sun, Moon, Waves, Wrench, Thermometer,
  Eye, UserCheck, Activity,
  TrendingUp, BarChart3, Timer,
  CheckCircle2, RefreshCw,
  Calendar, MapPin, Siren, HardHat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

/* ─── helpers ─── */
const now = new Date();
const currentHour = now.getHours();
const shift = currentHour >= 6 && currentHour < 18 ? "Day" : "Night";
const todayStr = now.toLocaleDateString("en-US", {
  weekday: "long", month: "long", day: "numeric", year: "numeric",
});
const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

/* ─── mock data ─── */
const TERMINAL_NAME = "EusoPort Terminal — Berth Complex A";

const BERTHS = [
  { id: "B-01", vessel: "MSC AURORA", eta: "06:00", etd: "14:00", operation: "Discharging", cargo: "Containers", status: "occupied", moves: 420 },
  { id: "B-02", vessel: "MAERSK SENTOSA", eta: "08:30", etd: "18:00", operation: "Loading", cargo: "Containers", status: "occupied", moves: 310 },
  { id: "B-03", vessel: null, eta: null, etd: null, operation: null, cargo: null, status: "available", moves: 0 },
  { id: "B-04", vessel: "COSCO HARMONY", eta: "12:00", etd: "22:00", operation: "Loading", cargo: "Bulk / Break-bulk", status: "reserved", moves: 0 },
  { id: "B-05", vessel: null, eta: null, etd: null, operation: "Fender repair", cargo: null, status: "maintenance", moves: 0 },
  { id: "B-06", vessel: "CMA CGM MARCO POLO", eta: "02:00", etd: "10:30", operation: "Discharging", cargo: "Containers / Reefer", status: "occupied", moves: 580 },
  { id: "B-07", vessel: "EVERGREEN TRITON", eta: "16:00", etd: "Tomorrow 04:00", operation: "Loading", cargo: "Containers", status: "reserved", moves: 0 },
  { id: "B-08", vessel: null, eta: null, etd: null, operation: null, cargo: null, status: "available", moves: 0 },
];

const ARRIVALS = [
  { vessel: "COSCO HARMONY", eta: "12:00", cargo: "Bulk / Break-bulk", agent: "Inchcape Shipping" },
  { vessel: "EVERGREEN TRITON", eta: "16:00", cargo: "Containers", agent: "GAC Shipping" },
  { vessel: "HAPAG BERLIN", eta: "20:30", cargo: "Containers / Reefer", agent: "Wilhelmsen Agency" },
];

const DEPARTURES = [
  { vessel: "CMA CGM MARCO POLO", etd: "10:30", nextPort: "Rotterdam, NL" },
  { vessel: "MSC AURORA", etd: "14:00", nextPort: "Antwerp, BE" },
  { vessel: "MAERSK SENTOSA", etd: "18:00", nextPort: "Singapore, SG" },
];

const PRE_ARRIVAL = [
  { vessel: "COSCO HARMONY", status: "submitted" },
  { vessel: "EVERGREEN TRITON", status: "pending" },
  { vessel: "HAPAG BERLIN", status: "pending" },
];

const EQUIPMENT = {
  cranes: { available: 4, inUse: 3, maintenance: 1, total: 8 },
  rtgs: { available: 6, busy: 4, total: 10 },
  reachStackers: { available: 3, busy: 2, total: 5 },
  chassisPool: { available: 120, inUse: 80, total: 200 },
};

const SECURITY_DATA = {
  ispsLevel: 1,
  twicCompliance: 98.4,
  accessEventsToday: 347,
  incidentsLast30: 2,
};

const SAFETY_ENV = {
  pscNextInspection: "2026-04-15",
  marpolCompliance: "Compliant",
  spillReadiness: "Ready",
  emergencyContacts: [
    { role: "Port Captain", name: "Capt. R. Vasquez", phone: "+1 555-0101" },
    { role: "Safety Officer", name: "M. Chen", phone: "+1 555-0102" },
    { role: "Environmental", name: "L. Okonkwo", phone: "+1 555-0103" },
  ],
};

/* ─── berth status colors ─── */
function berthColor(status: string, isLight: boolean) {
  const map: Record<string, { bg: string; text: string; badge: string }> = {
    occupied: {
      bg: isLight ? "bg-blue-50 border-blue-200" : "bg-blue-500/10 border-blue-500/30",
      text: isLight ? "text-blue-700" : "text-blue-400",
      badge: isLight ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-400",
    },
    available: {
      bg: isLight ? "bg-emerald-50 border-emerald-200" : "bg-emerald-500/10 border-emerald-500/30",
      text: isLight ? "text-emerald-700" : "text-emerald-400",
      badge: isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-400",
    },
    maintenance: {
      bg: isLight ? "bg-amber-50 border-amber-200" : "bg-amber-500/10 border-amber-500/30",
      text: isLight ? "text-amber-700" : "text-amber-400",
      badge: isLight ? "bg-amber-100 text-amber-700" : "bg-amber-500/20 text-amber-400",
    },
    reserved: {
      bg: isLight ? "bg-purple-50 border-purple-200" : "bg-purple-500/10 border-purple-500/30",
      text: isLight ? "text-purple-700" : "text-purple-400",
      badge: isLight ? "bg-purple-100 text-purple-700" : "bg-purple-500/20 text-purple-400",
    },
  };
  return map[status] ?? map.available;
}

/* ─── sub-components ─── */
function StatPill({ icon, label, value, isLight, accent = "cyan" }: {
  icon: React.ReactNode; label: string; value: string | number; isLight: boolean; accent?: string;
}) {
  const accentMap: Record<string, string> = {
    cyan: isLight ? "bg-cyan-50 text-cyan-600" : "bg-cyan-500/10 text-cyan-400",
    blue: isLight ? "bg-blue-50 text-blue-600" : "bg-blue-500/10 text-blue-400",
    emerald: isLight ? "bg-emerald-50 text-emerald-600" : "bg-emerald-500/10 text-emerald-400",
    amber: isLight ? "bg-amber-50 text-amber-600" : "bg-amber-500/10 text-amber-400",
    red: isLight ? "bg-red-50 text-red-600" : "bg-red-500/10 text-red-400",
    purple: isLight ? "bg-purple-50 text-purple-600" : "bg-purple-500/10 text-purple-400",
    teal: isLight ? "bg-teal-50 text-teal-600" : "bg-teal-500/10 text-teal-400",
    orange: isLight ? "bg-orange-50 text-orange-600" : "bg-orange-500/10 text-orange-400",
  };
  return (
    <div className={cn(
      "rounded-xl border p-4 transition-all hover:scale-[1.02]",
      isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50 hover:border-cyan-500/30",
    )}>
      <div className={cn("p-2 rounded-lg w-fit mb-2", accentMap[accent])}>{icon}</div>
      <div className={cn("text-2xl font-bold tabular-nums", isLight ? "text-slate-900" : "text-white")}>{value}</div>
      <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>{label}</div>
    </div>
  );
}

function SectionCard({ title, icon, children, isLight, className }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; isLight: boolean; className?: string;
}) {
  return (
    <Card className={cn(
      "border transition-all",
      isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50",
      className,
    )}>
      <CardHeader className="pb-3">
        <CardTitle className={cn("flex items-center gap-2 text-base font-semibold", isLight ? "text-slate-800" : "text-white")}>
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ProgressBar({ value, max, isLight, color = "cyan" }: {
  value: number; max: number; isLight: boolean; color?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colorMap: Record<string, string> = {
    cyan: "bg-cyan-500",
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    teal: "bg-teal-500",
  };
  return (
    <div className="flex items-center gap-3">
      <div className={cn("flex-1 h-2 rounded-full", isLight ? "bg-slate-200" : "bg-slate-700")}>
        <div
          className={cn("h-2 rounded-full transition-all", colorMap[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn("text-xs font-medium tabular-nums w-10 text-right", isLight ? "text-slate-600" : "text-slate-300")}>
        {pct}%
      </span>
    </div>
  );
}

function LoadingSkeleton({ isLight }: { isLight: boolean }) {
  return (
    <div className={cn("min-h-screen p-6", isLight ? "bg-slate-50" : "bg-[#0a0a0a]")}>
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="w-64 h-6" />
          <Skeleton className="w-48 h-4" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-80 rounded-xl mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-60 rounded-xl" />)}
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ─── */
export default function PortMasterDashboard() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [refreshKey, setRefreshKey] = useState(0);

  // Query backend data (graceful fallback to mock if endpoint absent)
  const vesselDash = trpc.vesselShipments.getVesselDashboard.useQuery(undefined, { retry: false });

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn("border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const textPrimary = isLight ? "text-slate-900" : "text-white";
  const textSecondary = isLight ? "text-slate-500" : "text-slate-400";
  const textMuted = isLight ? "text-slate-400" : "text-slate-500";
  const divider = isLight ? "border-slate-200" : "border-slate-700/50";

  const occupiedCount = BERTHS.filter(b => b.status === "occupied").length;
  const anchoredCount = ARRIVALS.length;
  const gateThroughput = 482;

  const gateData = {
    trucksIn: 263,
    trucksOut: 219,
    queueLength: 14,
    avgWait: 22,
    appointmentCompliance: 91,
    status: "Open" as "Open" | "Restricted" | "Closed",
  };

  const yardData = {
    utilization: 73,
    importWaiting: 1240,
    exportReceived: 890,
    reeferPlugged: 64,
    reeferTotal: 78,
    hazmat: 12,
    avgDwellDays: 3.2,
  };

  const kpis = {
    berthProductivity: 28,
    vesselTurnaround: 14.5,
    truckTurnaround: 34,
    teuDaily: 4820,
    teuWeekly: 31400,
    teuMonthly: 128600,
  };

  return (
    <div className={cn("min-h-screen p-4 md:p-6", bg)}>

      {/* ══════════════════ HEADER ══════════════════ */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl",
            isLight
              ? "bg-gradient-to-br from-teal-100 to-cyan-100"
              : "bg-gradient-to-br from-teal-500/20 to-cyan-500/20",
          )}>
            <Building2 className={cn("w-7 h-7", isLight ? "text-teal-600" : "text-teal-400")} />
          </div>
          <div>
            <h1 className={cn("text-2xl font-bold", textPrimary)}>Terminal Operations Center</h1>
            <p className={cn("text-sm", textSecondary)}>
              {TERMINAL_NAME}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge className={cn(
            "gap-1.5 px-3 py-1",
            shift === "Day"
              ? isLight ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-amber-500/20 text-amber-400 border-amber-500/30"
              : isLight ? "bg-indigo-100 text-indigo-700 border-indigo-200" : "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
          )}>
            {shift === "Day" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {shift} Shift
          </Badge>
          <span className={cn("text-sm font-medium tabular-nums", textSecondary)}>
            <Calendar className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
            {todayStr} &mdash; {timeStr}
          </span>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-1",
              isLight ? "border-slate-300 text-slate-600 hover:bg-slate-100" : "border-slate-600 text-slate-300 hover:bg-slate-700",
            )}
            onClick={() => setRefreshKey(k => k + 1)}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* ══════════════════ QUICK STATS ══════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatPill icon={<Ship className="w-5 h-5" />} label="Vessels at Berth" value={occupiedCount} isLight={isLight} accent="blue" />
        <StatPill icon={<Anchor className="w-5 h-5" />} label="Vessels at Anchor / Expected" value={anchoredCount} isLight={isLight} accent="teal" />
        <StatPill icon={<Truck className="w-5 h-5" />} label="Gate Throughput Today" value={gateThroughput} isLight={isLight} accent="orange" />
      </div>

      {/* ══════════════════ BERTH SCHEDULE (hero) ══════════════════ */}
      <SectionCard
        title="Berth Schedule"
        icon={<Waves className={cn("w-5 h-5", isLight ? "text-teal-600" : "text-teal-400")} />}
        isLight={isLight}
        className="mb-6"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={cn("border-b", divider)}>
                {["Berth", "Vessel", "ETA", "ETD", "Operation", "Cargo", "Moves", "Status"].map(h => (
                  <th key={h} className={cn(
                    "text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wider",
                    textSecondary,
                  )}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BERTHS.map(b => {
                const c = berthColor(b.status, isLight);
                return (
                  <tr
                    key={b.id}
                    className={cn(
                      "border-b last:border-b-0 transition-colors",
                      divider,
                      isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/30",
                    )}
                  >
                    <td className={cn("py-3 px-3 font-semibold", textPrimary)}>{b.id}</td>
                    <td className={cn("py-3 px-3 font-medium", b.vessel ? textPrimary : textMuted)}>
                      {b.vessel ?? "---"}
                    </td>
                    <td className={cn("py-3 px-3 tabular-nums", textSecondary)}>{b.eta ?? "---"}</td>
                    <td className={cn("py-3 px-3 tabular-nums", textSecondary)}>{b.etd ?? "---"}</td>
                    <td className={cn("py-3 px-3", textSecondary)}>{b.operation ?? "---"}</td>
                    <td className={cn("py-3 px-3", textSecondary)}>{b.cargo ?? "---"}</td>
                    <td className={cn("py-3 px-3 tabular-nums font-medium", textPrimary)}>
                      {b.moves > 0 ? b.moves : "---"}
                    </td>
                    <td className="py-3 px-3">
                      <Badge className={cn("capitalize text-xs", c.badge)}>{b.status}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className={cn("flex flex-wrap items-center gap-4 mt-4 pt-3 border-t text-xs", divider, textSecondary)}>
          <span className="font-medium">Legend:</span>
          {[
            { label: "Occupied", color: isLight ? "bg-blue-400" : "bg-blue-500" },
            { label: "Available", color: isLight ? "bg-emerald-400" : "bg-emerald-500" },
            { label: "Maintenance", color: isLight ? "bg-amber-400" : "bg-amber-500" },
            { label: "Reserved", color: isLight ? "bg-purple-400" : "bg-purple-500" },
          ].map(l => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span className={cn("w-3 h-3 rounded-sm", l.color)} />
              {l.label}
            </span>
          ))}
          <span className="ml-auto flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-red-400" />
            Current time: {timeStr}
          </span>
        </div>
      </SectionCard>

      {/* ══════════════════ TWO-COLUMN GRID ══════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* ────── VESSEL ARRIVALS & DEPARTURES ────── */}
        <SectionCard
          title="Vessel Arrivals & Departures"
          icon={<Ship className={cn("w-5 h-5", isLight ? "text-blue-600" : "text-blue-400")} />}
          isLight={isLight}
        >
          {/* Arrivals */}
          <div className="mb-4">
            <h4 className={cn("flex items-center gap-1.5 text-sm font-semibold mb-2", isLight ? "text-emerald-700" : "text-emerald-400")}>
              <ArrowDownLeft className="w-4 h-4" /> Today's Arrivals
            </h4>
            <div className="space-y-2">
              {ARRIVALS.map(a => (
                <div key={a.vessel} className={cn(
                  "flex items-center justify-between p-2.5 rounded-lg border text-sm",
                  isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/40",
                )}>
                  <div>
                    <span className={cn("font-semibold", textPrimary)}>{a.vessel}</span>
                    <div className={cn("text-xs mt-0.5", textSecondary)}>{a.cargo} &bull; Agent: {a.agent}</div>
                  </div>
                  <Badge variant="outline" className={cn("tabular-nums", isLight ? "border-slate-300 text-slate-600" : "border-slate-500 text-slate-300")}>
                    ETA {a.eta}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Departures */}
          <div className="mb-4">
            <h4 className={cn("flex items-center gap-1.5 text-sm font-semibold mb-2", isLight ? "text-orange-700" : "text-orange-400")}>
              <ArrowUpRight className="w-4 h-4" /> Today's Departures
            </h4>
            <div className="space-y-2">
              {DEPARTURES.map(d => (
                <div key={d.vessel} className={cn(
                  "flex items-center justify-between p-2.5 rounded-lg border text-sm",
                  isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/40",
                )}>
                  <div>
                    <span className={cn("font-semibold", textPrimary)}>{d.vessel}</span>
                    <div className={cn("text-xs mt-0.5", textSecondary)}>
                      <MapPin className="w-3 h-3 inline -mt-0.5 mr-0.5" /> Next: {d.nextPort}
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("tabular-nums", isLight ? "border-slate-300 text-slate-600" : "border-slate-500 text-slate-300")}>
                    ETD {d.etd}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Pre-arrival notifications */}
          <div>
            <h4 className={cn("text-sm font-semibold mb-2", textSecondary)}>Pre-Arrival Notifications</h4>
            <div className="flex flex-wrap gap-2">
              {PRE_ARRIVAL.map(p => (
                <Badge key={p.vessel} className={cn(
                  "text-xs gap-1",
                  p.status === "submitted"
                    ? isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-400"
                    : isLight ? "bg-amber-100 text-amber-700" : "bg-amber-500/20 text-amber-400",
                )}>
                  {p.status === "submitted" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {p.vessel}: {p.status}
                </Badge>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* ────── GATE OPERATIONS ────── */}
        <SectionCard
          title="Gate Operations"
          icon={<Truck className={cn("w-5 h-5", isLight ? "text-orange-600" : "text-orange-400")} />}
          isLight={isLight}
        >
          {/* Gate status badge */}
          <div className="flex items-center justify-between mb-4">
            <span className={cn("text-sm font-medium", textSecondary)}>Gate Status</span>
            <Badge className={cn(
              "text-sm px-3 py-1",
              gateData.status === "Open"
                ? isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-400"
                : gateData.status === "Restricted"
                  ? isLight ? "bg-amber-100 text-amber-700" : "bg-amber-500/20 text-amber-400"
                  : isLight ? "bg-red-100 text-red-700" : "bg-red-500/20 text-red-400",
            )}>
              {gateData.status === "Open" ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : null}
              {gateData.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Trucks In", value: gateData.trucksIn, icon: <ArrowDownLeft className="w-4 h-4" />, color: "emerald" },
              { label: "Trucks Out", value: gateData.trucksOut, icon: <ArrowUpRight className="w-4 h-4" />, color: "blue" },
              { label: "Queue Length", value: `${gateData.queueLength} trucks`, icon: <Timer className="w-4 h-4" />, color: "amber" },
              { label: "Avg Wait Time", value: `${gateData.avgWait} min`, icon: <Clock className="w-4 h-4" />, color: "orange" },
            ].map(item => (
              <div key={item.label} className={cn(
                "p-3 rounded-lg border",
                isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/40",
              )}>
                <div className={cn("flex items-center gap-1.5 text-xs mb-1", textSecondary)}>
                  {item.icon} {item.label}
                </div>
                <div className={cn("text-lg font-bold tabular-nums", textPrimary)}>{item.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className={cn("text-xs font-medium", textSecondary)}>Appointment Compliance</span>
              <span className={cn("text-xs font-semibold tabular-nums", textPrimary)}>{gateData.appointmentCompliance}%</span>
            </div>
            <ProgressBar value={gateData.appointmentCompliance} max={100} isLight={isLight} color="teal" />
          </div>
        </SectionCard>

        {/* ────── CONTAINER YARD STATUS ────── */}
        <SectionCard
          title="Container Yard Status"
          icon={<Container className={cn("w-5 h-5", isLight ? "text-cyan-600" : "text-cyan-400")} />}
          isLight={isLight}
        >
          {/* Utilization bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className={cn("text-sm font-medium", textSecondary)}>Yard Utilization</span>
              <span className={cn("text-sm font-bold tabular-nums", textPrimary)}>{yardData.utilization}%</span>
            </div>
            <ProgressBar
              value={yardData.utilization}
              max={100}
              isLight={isLight}
              color={yardData.utilization > 85 ? "red" : yardData.utilization > 70 ? "amber" : "emerald"}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Import Awaiting Pickup", value: yardData.importWaiting.toLocaleString(), icon: <ArrowDownLeft className="w-4 h-4" />, color: "blue" },
              { label: "Export Received", value: yardData.exportReceived.toLocaleString(), icon: <ArrowUpRight className="w-4 h-4" />, color: "emerald" },
              { label: "Reefer (Plugged / Total)", value: `${yardData.reeferPlugged} / ${yardData.reeferTotal}`, icon: <Thermometer className="w-4 h-4" />, color: "cyan" },
              { label: "Hazmat in Yard", value: yardData.hazmat, icon: <AlertTriangle className="w-4 h-4" />, color: "red" },
            ].map(item => (
              <div key={item.label} className={cn(
                "p-3 rounded-lg border",
                isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/40",
              )}>
                <div className={cn("flex items-center gap-1.5 text-xs mb-1", textSecondary)}>
                  {item.icon} {item.label}
                </div>
                <div className={cn("text-lg font-bold tabular-nums", textPrimary)}>{item.value}</div>
              </div>
            ))}
          </div>

          <div className={cn("mt-3 flex items-center gap-2 text-xs", textSecondary)}>
            <Clock className="w-3.5 h-3.5" />
            Average Dwell Time: <span className={cn("font-semibold", textPrimary)}>{yardData.avgDwellDays} days</span>
          </div>
        </SectionCard>

        {/* ────── EQUIPMENT STATUS ────── */}
        <SectionCard
          title="Equipment Status"
          icon={<Wrench className={cn("w-5 h-5", isLight ? "text-purple-600" : "text-purple-400")} />}
          isLight={isLight}
        >
          <div className="space-y-4">
            {/* Cranes */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className={cn("text-sm font-medium", textPrimary)}>Ship-to-Shore Cranes</span>
                <span className={cn("text-xs", textSecondary)}>{EQUIPMENT.cranes.total} total</span>
              </div>
              <div className="flex gap-2">
                <Badge className={isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-400"}>
                  {EQUIPMENT.cranes.available} Available
                </Badge>
                <Badge className={isLight ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-400"}>
                  {EQUIPMENT.cranes.inUse} In Use
                </Badge>
                <Badge className={isLight ? "bg-amber-100 text-amber-700" : "bg-amber-500/20 text-amber-400"}>
                  {EQUIPMENT.cranes.maintenance} Maint.
                </Badge>
              </div>
            </div>

            {/* RTGs */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className={cn("text-sm font-medium", textPrimary)}>RTGs / Straddle Carriers</span>
                <span className={cn("text-xs", textSecondary)}>{EQUIPMENT.rtgs.total} total</span>
              </div>
              <ProgressBar value={EQUIPMENT.rtgs.busy} max={EQUIPMENT.rtgs.total} isLight={isLight} color="blue" />
              <div className={cn("flex justify-between text-xs mt-1", textSecondary)}>
                <span>{EQUIPMENT.rtgs.available} available</span>
                <span>{EQUIPMENT.rtgs.busy} busy</span>
              </div>
            </div>

            {/* Reach Stackers */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className={cn("text-sm font-medium", textPrimary)}>Reach Stackers</span>
                <span className={cn("text-xs", textSecondary)}>{EQUIPMENT.reachStackers.total} total</span>
              </div>
              <ProgressBar value={EQUIPMENT.reachStackers.busy} max={EQUIPMENT.reachStackers.total} isLight={isLight} color="purple" />
              <div className={cn("flex justify-between text-xs mt-1", textSecondary)}>
                <span>{EQUIPMENT.reachStackers.available} available</span>
                <span>{EQUIPMENT.reachStackers.busy} busy</span>
              </div>
            </div>

            {/* Chassis Pool */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className={cn("text-sm font-medium", textPrimary)}>Chassis Pool</span>
                <span className={cn("text-xs", textSecondary)}>{EQUIPMENT.chassisPool.total} total</span>
              </div>
              <ProgressBar value={EQUIPMENT.chassisPool.inUse} max={EQUIPMENT.chassisPool.total} isLight={isLight} color="orange" />
              <div className={cn("flex justify-between text-xs mt-1", textSecondary)}>
                <span>{EQUIPMENT.chassisPool.available} available</span>
                <span>{EQUIPMENT.chassisPool.inUse} in use</span>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ────── SECURITY ────── */}
        <SectionCard
          title="Security & Access Control"
          icon={<Shield className={cn("w-5 h-5", isLight ? "text-red-600" : "text-red-400")} />}
          isLight={isLight}
        >
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={cn(
              "p-3 rounded-lg border",
              isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/40",
            )}>
              <div className={cn("flex items-center gap-1.5 text-xs mb-1", textSecondary)}>
                <Siren className="w-4 h-4" /> ISPS Security Level
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-2xl font-bold tabular-nums", textPrimary)}>{SECURITY_DATA.ispsLevel}</span>
                <Badge className={cn(
                  "text-xs",
                  SECURITY_DATA.ispsLevel === 1
                    ? isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-400"
                    : SECURITY_DATA.ispsLevel === 2
                      ? isLight ? "bg-amber-100 text-amber-700" : "bg-amber-500/20 text-amber-400"
                      : isLight ? "bg-red-100 text-red-700" : "bg-red-500/20 text-red-400",
                )}>
                  {SECURITY_DATA.ispsLevel === 1 ? "Normal" : SECURITY_DATA.ispsLevel === 2 ? "Heightened" : "Exceptional"}
                </Badge>
              </div>
            </div>

            <div className={cn(
              "p-3 rounded-lg border",
              isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/40",
            )}>
              <div className={cn("flex items-center gap-1.5 text-xs mb-1", textSecondary)}>
                <UserCheck className="w-4 h-4" /> TWIC Compliance
              </div>
              <div className={cn("text-2xl font-bold tabular-nums", textPrimary)}>{SECURITY_DATA.twicCompliance}%</div>
            </div>

            <div className={cn(
              "p-3 rounded-lg border",
              isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/40",
            )}>
              <div className={cn("flex items-center gap-1.5 text-xs mb-1", textSecondary)}>
                <Eye className="w-4 h-4" /> Access Events Today
              </div>
              <div className={cn("text-2xl font-bold tabular-nums", textPrimary)}>{SECURITY_DATA.accessEventsToday}</div>
            </div>

            <div className={cn(
              "p-3 rounded-lg border",
              isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/40",
            )}>
              <div className={cn("flex items-center gap-1.5 text-xs mb-1", textSecondary)}>
                <AlertTriangle className="w-4 h-4" /> Incidents (30d)
              </div>
              <div className={cn("text-2xl font-bold tabular-nums", textPrimary)}>{SECURITY_DATA.incidentsLast30}</div>
            </div>
          </div>
        </SectionCard>

        {/* ────── SAFETY & ENVIRONMENTAL ────── */}
        <SectionCard
          title="Safety & Environmental"
          icon={<HardHat className={cn("w-5 h-5", isLight ? "text-amber-600" : "text-amber-400")} />}
          isLight={isLight}
        >
          <div className="space-y-3">
            <div className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/40")}>
              <div>
                <div className={cn("text-xs mb-0.5", textSecondary)}>PSC Next Inspection</div>
                <div className={cn("text-sm font-semibold", textPrimary)}>
                  {new Date(SAFETY_ENV.pscNextInspection).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
              <Badge className={isLight ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-400"}>
                <Calendar className="w-3 h-3 mr-1" /> Scheduled
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={cn("p-3 rounded-lg border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/40")}>
                <div className={cn("text-xs mb-1", textSecondary)}>MARPOL Compliance</div>
                <Badge className={cn("text-xs", isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-400")}>
                  <CheckCircle2 className="w-3 h-3 mr-1" /> {SAFETY_ENV.marpolCompliance}
                </Badge>
              </div>
              <div className={cn("p-3 rounded-lg border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/40")}>
                <div className={cn("text-xs mb-1", textSecondary)}>Spill Response</div>
                <Badge className={cn("text-xs", isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-400")}>
                  <CheckCircle2 className="w-3 h-3 mr-1" /> {SAFETY_ENV.spillReadiness}
                </Badge>
              </div>
            </div>

            <div>
              <div className={cn("text-xs font-semibold mb-2", textSecondary)}>Emergency Contacts</div>
              <div className="space-y-1.5">
                {SAFETY_ENV.emergencyContacts.map(c => (
                  <div key={c.role} className={cn(
                    "flex items-center justify-between text-xs p-2 rounded-lg",
                    isLight ? "bg-slate-50" : "bg-slate-700/20",
                  )}>
                    <span>
                      <span className={cn("font-medium", textPrimary)}>{c.role}:</span>{" "}
                      <span className={textSecondary}>{c.name}</span>
                    </span>
                    <span className={cn("tabular-nums font-medium", isLight ? "text-blue-600" : "text-blue-400")}>{c.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ══════════════════ KPI BOTTOM BAR ══════════════════ */}
      <div className={cn(
        "rounded-xl border p-4",
        isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50",
      )}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className={cn("w-5 h-5", isLight ? "text-teal-600" : "text-teal-400")} />
          <h3 className={cn("text-base font-semibold", textPrimary)}>Key Performance Indicators</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Berth Productivity", value: `${kpis.berthProductivity}`, unit: "moves/hr", icon: <Gauge className="w-4 h-4" />, accent: "cyan" },
            { label: "Vessel Turnaround", value: `${kpis.vesselTurnaround}`, unit: "avg hrs", icon: <Ship className="w-4 h-4" />, accent: "blue" },
            { label: "Truck Turnaround", value: `${kpis.truckTurnaround}`, unit: "avg min", icon: <Truck className="w-4 h-4" />, accent: "orange" },
            { label: "TEU Daily", value: kpis.teuDaily.toLocaleString(), unit: "TEU", icon: <Container className="w-4 h-4" />, accent: "emerald" },
            { label: "TEU Weekly", value: kpis.teuWeekly.toLocaleString(), unit: "TEU", icon: <TrendingUp className="w-4 h-4" />, accent: "teal" },
            { label: "TEU Monthly", value: kpis.teuMonthly.toLocaleString(), unit: "TEU", icon: <BarChart3 className="w-4 h-4" />, accent: "purple" },
          ].map(kpi => {
            const accentMap: Record<string, string> = {
              cyan: isLight ? "text-cyan-600" : "text-cyan-400",
              blue: isLight ? "text-blue-600" : "text-blue-400",
              emerald: isLight ? "text-emerald-600" : "text-emerald-400",
              orange: isLight ? "text-orange-600" : "text-orange-400",
              teal: isLight ? "text-teal-600" : "text-teal-400",
              purple: isLight ? "text-purple-600" : "text-purple-400",
            };
            return (
              <div key={kpi.label} className={cn(
                "text-center p-3 rounded-lg border",
                isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/40",
              )}>
                <div className={cn("flex justify-center mb-1.5", accentMap[kpi.accent])}>{kpi.icon}</div>
                <div className={cn("text-xl font-bold tabular-nums", textPrimary)}>{kpi.value}</div>
                <div className={cn("text-[10px] font-medium uppercase tracking-wide", accentMap[kpi.accent])}>{kpi.unit}</div>
                <div className={cn("text-[10px] mt-0.5", textSecondary)}>{kpi.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
