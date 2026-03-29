/**
 * PORT GATE OPERATIONS — Gate Management Center
 * Live queue, throughput analytics, appointment scheduling, TWIC verification,
 * hazmat gate checks, turn time analytics, and chronological gate activity log.
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
  DoorOpen, Truck, Container, Clock, AlertTriangle,
  ArrowUpRight, ArrowDownLeft, Shield, ShieldAlert, ShieldCheck,
  Flame, BarChart3, Timer, CheckCircle2, XCircle,
  Search, RefreshCw, Calendar, Activity, Eye,
  TrendingUp, TrendingDown, UserCheck, Ban,
  ChevronRight, CircleDot, FileWarning, Siren,
  Gauge, ArrowRight, ArrowLeft, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

/* ─── helpers ─── */
const now = new Date();
const todayStr = now.toLocaleDateString("en-US", {
  weekday: "long", month: "long", day: "numeric", year: "numeric",
});
const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

type GateStatus = "open" | "restricted" | "closed";
type QueueStatus = "waiting" | "processing" | "cleared" | "denied";
type TwicResult = "pass" | "fail" | "expired" | "pending";
type HazmatVerification = "verified" | "pending" | "failed";
type ActivityType = "entry" | "exit" | "denied" | "incident" | "hazmat_check" | "twic_fail";

interface QueueEntry {
  id: string;
  position: number;
  truckNumber: string;
  containerNumber: string;
  appointmentTime: string;
  status: QueueStatus;
  driver: string;
  carrier: string;
  lane: number;
  waitMinutes: number;
}

interface AppointmentEntry {
  id: string;
  time: string;
  truckNumber: string;
  containerNumber: string;
  carrier: string;
  type: "pickup" | "delivery" | "empty_return" | "chassis";
  checkedIn: boolean;
  checkinTime: string | null;
}

interface TwicScan {
  id: string;
  timestamp: string;
  driverName: string;
  cardNumber: string;
  result: TwicResult;
  reason: string | null;
  gate: string;
}

interface HazmatEntry {
  id: string;
  containerNumber: string;
  imdgClass: string;
  unNumber: string;
  properShippingName: string;
  placardVerified: HazmatVerification;
  documentation: HazmatVerification;
  inspector: string;
  timestamp: string;
}

interface ActivityLogEntry {
  id: string;
  timestamp: string;
  type: ActivityType;
  truckNumber: string;
  containerNumber: string | null;
  driver: string;
  gate: string;
  details: string;
}

/* ─── mock data ─── */
const GATE_STATUS: GateStatus = "open";
const GATES = [
  { id: "G1", name: "Gate 1 — Main In", direction: "inbound", status: "open" as GateStatus, lanes: 3, activeLanes: 3 },
  { id: "G2", name: "Gate 2 — Main Out", direction: "outbound", status: "open" as GateStatus, lanes: 3, activeLanes: 3 },
  { id: "G3", name: "Gate 3 — Hazmat In", direction: "inbound", status: "restricted" as GateStatus, lanes: 1, activeLanes: 1 },
  { id: "G4", name: "Gate 4 — Empty Return", direction: "inbound", status: "open" as GateStatus, lanes: 2, activeLanes: 2 },
  { id: "G5", name: "Gate 5 — Rail Intermodal", direction: "both", status: "closed" as GateStatus, lanes: 2, activeLanes: 0 },
];

const QUEUE_DATA: QueueEntry[] = [
  { id: "Q001", position: 1, truckNumber: "TK-4821", containerNumber: "MSCU7284910", appointmentTime: "08:00", status: "processing", driver: "Mike Hernandez", carrier: "Swift Transport", lane: 1, waitMinutes: 3 },
  { id: "Q002", position: 2, truckNumber: "TK-3917", containerNumber: "CMAU5391027", appointmentTime: "08:15", status: "waiting", driver: "James Cole", carrier: "Werner Enterprises", lane: 2, waitMinutes: 8 },
  { id: "Q003", position: 3, truckNumber: "TK-7254", containerNumber: "HLXU6012845", appointmentTime: "08:15", status: "waiting", driver: "Sarah Kim", carrier: "JB Hunt", lane: 1, waitMinutes: 12 },
  { id: "Q004", position: 4, truckNumber: "TK-6103", containerNumber: "OOLU8419532", appointmentTime: "08:30", status: "waiting", driver: "Carlos Reyes", carrier: "Schneider", lane: 3, waitMinutes: 5 },
  { id: "Q005", position: 5, truckNumber: "TK-9482", containerNumber: "EISU3920174", appointmentTime: "08:30", status: "denied", driver: "Tom Banks", carrier: "Heartland Express", lane: 2, waitMinutes: 18 },
  { id: "Q006", position: 6, truckNumber: "TK-2158", containerNumber: "TCLU4812039", appointmentTime: "08:45", status: "waiting", driver: "Luis Vargas", carrier: "XPO Logistics", lane: 1, waitMinutes: 2 },
  { id: "Q007", position: 7, truckNumber: "TK-5039", containerNumber: "MSCU9102483", appointmentTime: "09:00", status: "waiting", driver: "Ana Moreno", carrier: "Covenant Transport", lane: 3, waitMinutes: 1 },
  { id: "Q008", position: 8, truckNumber: "TK-8371", containerNumber: "CMAU2847103", appointmentTime: "09:00", status: "cleared", driver: "Derek Hull", carrier: "Landstar", lane: 2, waitMinutes: 0 },
];

const HOURLY_THROUGHPUT = [
  { hour: "05:00", in: 8, out: 3 },
  { hour: "06:00", in: 22, out: 12 },
  { hour: "07:00", in: 45, out: 28 },
  { hour: "08:00", in: 58, out: 41 },
  { hour: "09:00", in: 52, out: 48 },
  { hour: "10:00", in: 38, out: 44 },
  { hour: "11:00", in: 31, out: 39 },
  { hour: "12:00", in: 18, out: 22 },
  { hour: "13:00", in: 42, out: 35 },
  { hour: "14:00", in: 55, out: 50 },
  { hour: "15:00", in: 48, out: 52 },
  { hour: "16:00", in: 35, out: 45 },
];

const APPOINTMENTS: AppointmentEntry[] = [
  { id: "APT001", time: "06:00", truckNumber: "TK-1102", containerNumber: "MSCU1290384", carrier: "Swift Transport", type: "delivery", checkedIn: true, checkinTime: "05:52" },
  { id: "APT002", time: "06:30", truckNumber: "TK-2248", containerNumber: "CMAU3847102", carrier: "Werner Enterprises", type: "pickup", checkedIn: true, checkinTime: "06:28" },
  { id: "APT003", time: "07:00", truckNumber: "TK-3391", containerNumber: "HLXU7201934", carrier: "JB Hunt", type: "delivery", checkedIn: true, checkinTime: "06:55" },
  { id: "APT004", time: "07:30", truckNumber: "TK-4510", containerNumber: "OOLU5928174", carrier: "Schneider", type: "empty_return", checkedIn: true, checkinTime: "07:41" },
  { id: "APT005", time: "08:00", truckNumber: "TK-4821", containerNumber: "MSCU7284910", carrier: "Swift Transport", type: "delivery", checkedIn: true, checkinTime: "07:58" },
  { id: "APT006", time: "08:15", truckNumber: "TK-3917", containerNumber: "CMAU5391027", carrier: "Werner Enterprises", type: "pickup", checkedIn: false, checkinTime: null },
  { id: "APT007", time: "08:30", truckNumber: "TK-6103", containerNumber: "OOLU8419532", carrier: "Schneider", type: "delivery", checkedIn: false, checkinTime: null },
  { id: "APT008", time: "09:00", truckNumber: "TK-5039", containerNumber: "MSCU9102483", carrier: "Covenant Transport", type: "chassis", checkedIn: false, checkinTime: null },
  { id: "APT009", time: "09:30", truckNumber: "TK-7801", containerNumber: "EISU2048173", carrier: "XPO Logistics", type: "pickup", checkedIn: false, checkinTime: null },
  { id: "APT010", time: "10:00", truckNumber: "TK-9124", containerNumber: "TCLU8102947", carrier: "Landstar", type: "delivery", checkedIn: false, checkinTime: null },
];

const TWIC_SCANS: TwicScan[] = [
  { id: "TW001", timestamp: "08:12", driverName: "Mike Hernandez", cardNumber: "****-4821", result: "pass", reason: null, gate: "G1" },
  { id: "TW002", timestamp: "08:10", driverName: "James Cole", cardNumber: "****-3917", result: "pass", reason: null, gate: "G1" },
  { id: "TW003", timestamp: "08:08", driverName: "Tom Banks", cardNumber: "****-9482", result: "fail", reason: "Card expired 02/2026", gate: "G1" },
  { id: "TW004", timestamp: "08:05", driverName: "Sarah Kim", cardNumber: "****-7254", result: "pass", reason: null, gate: "G1" },
  { id: "TW005", timestamp: "08:02", driverName: "Carlos Reyes", cardNumber: "****-6103", result: "pass", reason: null, gate: "G3" },
  { id: "TW006", timestamp: "07:58", driverName: "Derek Hull", cardNumber: "****-8371", result: "pass", reason: null, gate: "G1" },
  { id: "TW007", timestamp: "07:55", driverName: "Luis Vargas", cardNumber: "****-2158", result: "pass", reason: null, gate: "G4" },
  { id: "TW008", timestamp: "07:50", driverName: "Kevin Marsh", cardNumber: "****-1294", result: "expired", reason: "Card expired 12/2025", gate: "G1" },
  { id: "TW009", timestamp: "07:45", driverName: "Ana Moreno", cardNumber: "****-5039", result: "pass", reason: null, gate: "G1" },
  { id: "TW010", timestamp: "07:40", driverName: "Bobby Tran", cardNumber: "****-0182", result: "fail", reason: "Unreadable — damaged chip", gate: "G4" },
];

const HAZMAT_ENTRIES: HazmatEntry[] = [
  { id: "HZ001", containerNumber: "HLXU6012845", imdgClass: "3 — Flammable Liquids", unNumber: "UN1203", properShippingName: "Gasoline", placardVerified: "verified", documentation: "verified", inspector: "Sgt. R. Delgado", timestamp: "07:30" },
  { id: "HZ002", containerNumber: "OOLU8419532", imdgClass: "8 — Corrosive Substances", unNumber: "UN1789", properShippingName: "Hydrochloric Acid", placardVerified: "verified", documentation: "pending", inspector: "Sgt. R. Delgado", timestamp: "07:45" },
  { id: "HZ003", containerNumber: "EISU3920174", imdgClass: "2.1 — Flammable Gas", unNumber: "UN1075", properShippingName: "Liquefied Petroleum Gas", placardVerified: "failed", documentation: "verified", inspector: "Ofc. M. Tate", timestamp: "08:00" },
  { id: "HZ004", containerNumber: "TCLU4812039", imdgClass: "6.1 — Toxic Substances", unNumber: "UN2810", properShippingName: "Toxic Liquid, organic", placardVerified: "verified", documentation: "verified", inspector: "Sgt. R. Delgado", timestamp: "08:10" },
  { id: "HZ005", containerNumber: "MSCU9102483", imdgClass: "5.1 — Oxidizing Substances", unNumber: "UN1942", properShippingName: "Ammonium Nitrate", placardVerified: "pending", documentation: "pending", inspector: "Ofc. M. Tate", timestamp: "08:20" },
];

const TURN_TIME_DATA = {
  avgMinutes: 47,
  targetMinutes: 60,
  peakHour: "08:00 — 09:00",
  bottleneck: "TWIC Verification Queue at Gate 1",
  byHour: [
    { hour: "05:00", avg: 32 },
    { hour: "06:00", avg: 38 },
    { hour: "07:00", avg: 52 },
    { hour: "08:00", avg: 68 },
    { hour: "09:00", avg: 55 },
    { hour: "10:00", avg: 42 },
    { hour: "11:00", avg: 39 },
    { hour: "12:00", avg: 35 },
    { hour: "13:00", avg: 48 },
    { hour: "14:00", avg: 58 },
    { hour: "15:00", avg: 51 },
    { hour: "16:00", avg: 44 },
  ],
};

const ACTIVITY_LOG: ActivityLogEntry[] = [
  { id: "AL001", timestamp: "08:14", type: "entry", truckNumber: "TK-4821", containerNumber: "MSCU7284910", driver: "Mike Hernandez", gate: "G1-L1", details: "Cleared for delivery to Block C-14" },
  { id: "AL002", timestamp: "08:12", type: "denied", truckNumber: "TK-9482", containerNumber: "EISU3920174", driver: "Tom Banks", gate: "G1-L2", details: "TWIC expired — directed to visitor office" },
  { id: "AL003", timestamp: "08:10", type: "exit", truckNumber: "TK-8371", containerNumber: "CMAU2847103", driver: "Derek Hull", gate: "G2-L1", details: "Pickup complete — empty chassis return" },
  { id: "AL004", timestamp: "08:08", type: "hazmat_check", truckNumber: "TK-7254", containerNumber: "HLXU6012845", driver: "Sarah Kim", gate: "G3-L1", details: "IMDG Class 3 — placard verified, routed to hazmat staging" },
  { id: "AL005", timestamp: "08:05", type: "entry", truckNumber: "TK-6103", containerNumber: "OOLU8419532", driver: "Carlos Reyes", gate: "G3-L1", details: "Hazmat delivery — corrosive, escorted to Block H-02" },
  { id: "AL006", timestamp: "08:02", type: "exit", truckNumber: "TK-1102", containerNumber: null, driver: "Paul Wheeler", gate: "G2-L3", details: "Bobtail out — delivery completed" },
  { id: "AL007", timestamp: "07:58", type: "entry", truckNumber: "TK-2158", containerNumber: "TCLU4812039", driver: "Luis Vargas", gate: "G4-L1", details: "Empty return to Block A-08" },
  { id: "AL008", timestamp: "07:55", type: "twic_fail", truckNumber: "TK-0182", containerNumber: null, driver: "Bobby Tran", gate: "G4-L2", details: "TWIC chip unreadable — alternate ID check required" },
  { id: "AL009", timestamp: "07:50", type: "incident", truckNumber: "TK-3301", containerNumber: "EISU0294817", driver: "Ray Santos", gate: "G1-L3", details: "Minor fender contact with bollard — no injuries, photo documented" },
  { id: "AL010", timestamp: "07:45", type: "entry", truckNumber: "TK-5039", containerNumber: "MSCU9102483", driver: "Ana Moreno", gate: "G1-L1", details: "Cleared for chassis pickup at Block F-22" },
  { id: "AL011", timestamp: "07:40", type: "exit", truckNumber: "TK-7712", containerNumber: "CMAU1028374", driver: "Frank Diaz", gate: "G2-L2", details: "Loaded out — 40ft HC to rail ramp" },
  { id: "AL012", timestamp: "07:35", type: "entry", truckNumber: "TK-8194", containerNumber: "HLXU3910284", driver: "Jose Gutierrez", gate: "G1-L2", details: "Delivery to Block D-09" },
];

/* ─── status helpers ─── */
const gateStatusConfig: Record<GateStatus, { label: string; color: string; bgColor: string }> = {
  open: { label: "OPEN", color: "text-emerald-400", bgColor: "bg-emerald-500/20 border-emerald-500/40" },
  restricted: { label: "RESTRICTED", color: "text-amber-400", bgColor: "bg-amber-500/20 border-amber-500/40" },
  closed: { label: "CLOSED", color: "text-red-400", bgColor: "bg-red-500/20 border-red-500/40" },
};

const queueStatusConfig: Record<QueueStatus, { label: string; color: string; icon: React.ReactNode }> = {
  waiting: { label: "Waiting", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: <Clock className="w-3 h-3" /> },
  processing: { label: "Processing", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <Activity className="w-3 h-3" /> },
  cleared: { label: "Cleared", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: <CheckCircle2 className="w-3 h-3" /> },
  denied: { label: "Denied", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <Ban className="w-3 h-3" /> },
};

const twicResultConfig: Record<TwicResult, { label: string; color: string; icon: React.ReactNode }> = {
  pass: { label: "PASS", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: <ShieldCheck className="w-3 h-3" /> },
  fail: { label: "FAIL", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <ShieldAlert className="w-3 h-3" /> },
  expired: { label: "EXPIRED", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: <FileWarning className="w-3 h-3" /> },
  pending: { label: "PENDING", color: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: <Clock className="w-3 h-3" /> },
};

const hazmatConfig: Record<HazmatVerification, { label: string; color: string; icon: React.ReactNode }> = {
  verified: { label: "Verified", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: <CheckCircle2 className="w-3 h-3" /> },
  pending: { label: "Pending", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: <Clock className="w-3 h-3" /> },
  failed: { label: "Failed", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <XCircle className="w-3 h-3" /> },
};

const activityTypeConfig: Record<ActivityType, { label: string; color: string; icon: React.ReactNode }> = {
  entry: { label: "Entry", color: "text-emerald-400", icon: <ArrowRight className="w-4 h-4 text-emerald-400" /> },
  exit: { label: "Exit", color: "text-blue-400", icon: <ArrowLeft className="w-4 h-4 text-blue-400" /> },
  denied: { label: "Denied", color: "text-red-400", icon: <Ban className="w-4 h-4 text-red-400" /> },
  incident: { label: "Incident", color: "text-orange-400", icon: <Siren className="w-4 h-4 text-orange-400" /> },
  hazmat_check: { label: "Hazmat", color: "text-amber-400", icon: <Flame className="w-4 h-4 text-amber-400" /> },
  twic_fail: { label: "TWIC Fail", color: "text-rose-400", icon: <ShieldAlert className="w-4 h-4 text-rose-400" /> },
};

const appointmentTypeConfig: Record<string, { label: string; color: string }> = {
  pickup: { label: "Pickup", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  delivery: { label: "Delivery", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  empty_return: { label: "Empty Return", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
  chassis: { label: "Chassis", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
};

/* ─── simple bar component ─── */
function MiniBar({ value, max, color, isLight }: { value: number; max: number; color: string; isLight: boolean }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className={cn("w-full h-4 rounded-sm", isLight ? "bg-slate-200" : "bg-slate-700")}>
      <div className={cn("h-4 rounded-sm transition-all", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function PortGateOperations() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [searchQueue, setSearchQueue] = useState("");
  const [activityFilter, setActivityFilter] = useState<ActivityType | "all">("all");
  const [selectedGate, setSelectedGate] = useState<string | null>(null);

  /* ─── computed ─── */
  const totalIn = HOURLY_THROUGHPUT.reduce((s, h) => s + h.in, 0);
  const totalOut = HOURLY_THROUGHPUT.reduce((s, h) => s + h.out, 0);
  const maxHourly = Math.max(...HOURLY_THROUGHPUT.map((h) => Math.max(h.in, h.out)));
  const maxTurnTime = Math.max(...TURN_TIME_DATA.byHour.map((h) => h.avg));

  const twicPassRate = useMemo(() => {
    const passes = TWIC_SCANS.filter((s) => s.result === "pass").length;
    return Math.round((passes / TWIC_SCANS.length) * 100);
  }, []);

  const filteredQueue = useMemo(() => {
    if (!searchQueue) return QUEUE_DATA;
    const q = searchQueue.toLowerCase();
    return QUEUE_DATA.filter(
      (e) =>
        e.truckNumber.toLowerCase().includes(q) ||
        e.containerNumber.toLowerCase().includes(q) ||
        e.driver.toLowerCase().includes(q)
    );
  }, [searchQueue]);

  const filteredLog = useMemo(() => {
    if (activityFilter === "all") return ACTIVITY_LOG;
    return ACTIVITY_LOG.filter((e) => e.type === activityFilter);
  }, [activityFilter]);

  const checkedInCount = APPOINTMENTS.filter((a) => a.checkedIn).length;

  /* ─── card wrapper ─── */
  const cardCn = cn(
    "border rounded-xl",
    isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/60"
  );
  const headerCn = cn(isLight ? "text-slate-800" : "text-white");
  const subCn = cn(isLight ? "text-slate-500" : "text-slate-400");
  const rowHover = cn(isLight ? "hover:bg-slate-50" : "hover:bg-slate-800/40");
  const borderB = cn(isLight ? "border-slate-200" : "border-slate-700/50");

  return (
    <div className={cn("min-h-screen p-4 md:p-6 space-y-6", isLight ? "bg-slate-50" : "bg-slate-950")}>

      {/* ═══════════════════ HEADER ═══════════════════ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-3 rounded-xl", isLight ? "bg-indigo-100" : "bg-indigo-500/20")}>
            <DoorOpen className={cn("w-7 h-7", isLight ? "text-indigo-600" : "text-indigo-400")} />
          </div>
          <div>
            <h1 className={cn("text-2xl md:text-3xl font-bold", headerCn)}>Gate Operations</h1>
            <p className={subCn}>{todayStr} &mdash; {timeStr}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Overall gate status */}
          <div className={cn("px-4 py-2 rounded-lg border font-semibold text-sm flex items-center gap-2", gateStatusConfig[GATE_STATUS].bgColor)}>
            <CircleDot className={cn("w-4 h-4", gateStatusConfig[GATE_STATUS].color)} />
            <span className={gateStatusConfig[GATE_STATUS].color}>Terminal Gates: {gateStatusConfig[GATE_STATUS].label}</span>
          </div>
          <Button variant="outline" size="sm" className={cn("gap-1", isLight ? "" : "border-slate-700 text-slate-300")}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* ═══════════════════ GATE STATUS STRIP ═══════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {GATES.map((g) => {
          const cfg = gateStatusConfig[g.status];
          return (
            <div
              key={g.id}
              onClick={() => setSelectedGate(selectedGate === g.id ? null : g.id)}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-all",
                cfg.bgColor,
                selectedGate === g.id && "ring-2 ring-indigo-500"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn("text-xs font-bold", cfg.color)}>{g.id}</span>
                <Badge variant="outline" className={cn("text-[10px] px-1.5", cfg.bgColor, cfg.color)}>
                  {cfg.label}
                </Badge>
              </div>
              <p className={cn("text-xs font-medium truncate", isLight ? "text-slate-700" : "text-slate-300")}>{g.name}</p>
              <p className={cn("text-[10px] mt-1", subCn)}>
                {g.activeLanes}/{g.lanes} lanes &bull; {g.direction}
              </p>
            </div>
          );
        })}
      </div>

      {/* ═══════════════════ KPI CARDS ═══════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Trucks In Today", value: totalIn, icon: <ArrowDownLeft className="w-5 h-5 text-emerald-400" />, trend: "+12%", trendUp: true },
          { label: "Trucks Out Today", value: totalOut, icon: <ArrowUpRight className="w-5 h-5 text-blue-400" />, trend: "+8%", trendUp: true },
          { label: "In Queue Now", value: QUEUE_DATA.filter((q) => q.status === "waiting").length, icon: <Truck className="w-5 h-5 text-amber-400" />, trend: "5 waiting", trendUp: false },
          { label: "Avg Turn Time", value: `${TURN_TIME_DATA.avgMinutes}m`, icon: <Timer className="w-5 h-5 text-purple-400" />, trend: `Target: ${TURN_TIME_DATA.targetMinutes}m`, trendUp: true },
        ].map((kpi, i) => (
          <div key={i} className={cn("p-4 rounded-xl border", cardCn)}>
            <div className="flex items-center justify-between mb-2">
              <span className={cn("text-xs font-medium", subCn)}>{kpi.label}</span>
              {kpi.icon}
            </div>
            <p className={cn("text-2xl font-bold", headerCn)}>{kpi.value}</p>
            <p className={cn("text-xs mt-1", kpi.trendUp ? "text-emerald-400" : "text-amber-400")}>{kpi.trend}</p>
          </div>
        ))}
      </div>

      {/* ═══════════════════ LIVE QUEUE + THROUGHPUT ═══════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Live Queue — 2 cols */}
        <div className={cn("lg:col-span-2 rounded-xl border", cardCn)}>
          <div className={cn("p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3", borderB)}>
            <div className="flex items-center gap-2">
              <Truck className={cn("w-5 h-5", isLight ? "text-indigo-600" : "text-indigo-400")} />
              <h2 className={cn("text-lg font-semibold", headerCn)}>Live Queue</h2>
              <Badge variant="outline" className="text-xs">{filteredQueue.length} trucks</Badge>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", subCn)} />
              <Input
                placeholder="Search truck, container, driver..."
                value={searchQueue}
                onChange={(e) => setSearchQueue(e.target.value)}
                className={cn("pl-9 text-sm", isLight ? "bg-white border-slate-300" : "bg-slate-800 border-slate-600 text-white placeholder:text-slate-500")}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("text-xs uppercase", isLight ? "bg-slate-100 text-slate-500" : "bg-slate-800/60 text-slate-400")}>
                  <th className="px-4 py-2.5 text-left">#</th>
                  <th className="px-4 py-2.5 text-left">Truck</th>
                  <th className="px-4 py-2.5 text-left">Container</th>
                  <th className="px-4 py-2.5 text-left">Driver</th>
                  <th className="px-4 py-2.5 text-left">Appt</th>
                  <th className="px-4 py-2.5 text-left">Lane</th>
                  <th className="px-4 py-2.5 text-left">Wait</th>
                  <th className="px-4 py-2.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueue.map((q) => {
                  const sCfg = queueStatusConfig[q.status];
                  return (
                    <tr key={q.id} className={cn("border-t transition-colors", borderB, rowHover)}>
                      <td className={cn("px-4 py-3 font-mono font-bold", headerCn)}>{q.position}</td>
                      <td className={cn("px-4 py-3 font-mono font-semibold", isLight ? "text-indigo-700" : "text-indigo-300")}>{q.truckNumber}</td>
                      <td className={cn("px-4 py-3 font-mono text-xs", subCn)}>{q.containerNumber}</td>
                      <td className={cn("px-4 py-3", isLight ? "text-slate-700" : "text-slate-300")}>{q.driver}</td>
                      <td className={cn("px-4 py-3 font-mono", subCn)}>{q.appointmentTime}</td>
                      <td className={cn("px-4 py-3 text-center", headerCn)}>L{q.lane}</td>
                      <td className={cn("px-4 py-3 font-mono", q.waitMinutes > 10 ? "text-red-400 font-bold" : subCn)}>{q.waitMinutes}m</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn("text-xs gap-1", sCfg.color)}>
                          {sCfg.icon} {sCfg.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gate Throughput — 1 col */}
        <div className={cn("rounded-xl border", cardCn)}>
          <div className={cn("p-4 border-b", borderB)}>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className={cn("w-5 h-5", isLight ? "text-indigo-600" : "text-indigo-400")} />
              <h2 className={cn("text-lg font-semibold", headerCn)}>Gate Throughput</h2>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span className={cn("text-xs", subCn)}>In ({totalIn})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-blue-500" />
                <span className={cn("text-xs", subCn)}>Out ({totalOut})</span>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-2">
            {HOURLY_THROUGHPUT.map((h) => (
              <div key={h.hour} className="flex items-center gap-2">
                <span className={cn("text-[10px] font-mono w-10 shrink-0", subCn)}>{h.hour}</span>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-1">
                    <MiniBar value={h.in} max={maxHourly} color="bg-emerald-500" isLight={isLight} />
                    <span className={cn("text-[10px] w-6 text-right font-mono", subCn)}>{h.in}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MiniBar value={h.out} max={maxHourly} color="bg-blue-500" isLight={isLight} />
                    <span className={cn("text-[10px] w-6 text-right font-mono", subCn)}>{h.out}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════ APPOINTMENTS + TWIC ═══════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Appointment Schedule */}
        <div className={cn("rounded-xl border", cardCn)}>
          <div className={cn("p-4 border-b flex items-center justify-between", borderB)}>
            <div className="flex items-center gap-2">
              <Calendar className={cn("w-5 h-5", isLight ? "text-indigo-600" : "text-indigo-400")} />
              <h2 className={cn("text-lg font-semibold", headerCn)}>Appointment Schedule</h2>
            </div>
            <Badge variant="outline" className={cn("text-xs", isLight ? "" : "border-slate-600 text-slate-300")}>
              {checkedInCount}/{APPOINTMENTS.length} checked in
            </Badge>
          </div>

          <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
            {APPOINTMENTS.map((apt) => {
              const typeCfg = appointmentTypeConfig[apt.type];
              return (
                <div
                  key={apt.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    apt.checkedIn
                      ? isLight ? "bg-emerald-50 border-emerald-200" : "bg-emerald-500/10 border-emerald-500/20"
                      : isLight ? "bg-white border-slate-200" : "bg-slate-800/40 border-slate-700/50"
                  )}
                >
                  {/* time marker */}
                  <div className="flex flex-col items-center w-14 shrink-0">
                    <span className={cn("text-sm font-bold font-mono", headerCn)}>{apt.time}</span>
                    {apt.checkedIn && (
                      <span className="text-[10px] text-emerald-400 font-mono">{apt.checkinTime}</span>
                    )}
                  </div>

                  {/* status icon */}
                  <div className="shrink-0">
                    {apt.checkedIn ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Clock className={cn("w-5 h-5", subCn)} />
                    )}
                  </div>

                  {/* details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("font-mono font-semibold text-sm", isLight ? "text-indigo-700" : "text-indigo-300")}>{apt.truckNumber}</span>
                      <Badge variant="outline" className={cn("text-[10px]", typeCfg.color)}>{typeCfg.label}</Badge>
                    </div>
                    <p className={cn("text-xs truncate", subCn)}>
                      {apt.containerNumber} &bull; {apt.carrier}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TWIC Verification */}
        <div className={cn("rounded-xl border", cardCn)}>
          <div className={cn("p-4 border-b flex items-center justify-between", borderB)}>
            <div className="flex items-center gap-2">
              <Shield className={cn("w-5 h-5", isLight ? "text-indigo-600" : "text-indigo-400")} />
              <h2 className={cn("text-lg font-semibold", headerCn)}>TWIC Verification</h2>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                {twicPassRate}% pass rate
              </Badge>
            </div>
          </div>

          {/* TWIC stats strip */}
          <div className={cn("grid grid-cols-4 gap-0 border-b", borderB)}>
            {(["pass", "fail", "expired", "pending"] as TwicResult[]).map((result) => {
              const count = TWIC_SCANS.filter((s) => s.result === result).length;
              const cfg = twicResultConfig[result];
              return (
                <div key={result} className={cn("p-3 text-center", isLight ? "border-r border-slate-200 last:border-r-0" : "border-r border-slate-700/50 last:border-r-0")}>
                  <p className={cn("text-lg font-bold", cfg.color.includes("emerald") ? "text-emerald-400" : cfg.color.includes("red") ? "text-red-400" : cfg.color.includes("amber") ? "text-amber-400" : "text-slate-400")}>{count}</p>
                  <p className={cn("text-[10px] uppercase font-semibold", subCn)}>{result}</p>
                </div>
              );
            })}
          </div>

          <div className="p-4 space-y-2 max-h-[340px] overflow-y-auto">
            {TWIC_SCANS.map((scan) => {
              const cfg = twicResultConfig[scan.result];
              return (
                <div key={scan.id} className={cn("flex items-center gap-3 p-2.5 rounded-lg border transition-colors", isLight ? "bg-white border-slate-200" : "bg-slate-800/30 border-slate-700/50", rowHover)}>
                  <span className={cn("text-xs font-mono w-12 shrink-0", subCn)}>{scan.timestamp}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium truncate", headerCn)}>{scan.driverName}</p>
                    <p className={cn("text-[10px]", subCn)}>{scan.cardNumber} &bull; {scan.gate}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {scan.reason && (
                      <span className="text-[10px] text-red-400 max-w-[120px] truncate hidden md:block">{scan.reason}</span>
                    )}
                    <Badge variant="outline" className={cn("text-[10px] gap-1", cfg.color)}>
                      {cfg.icon} {cfg.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════ HAZMAT + TURN TIME ═══════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Hazmat Gate Checks */}
        <div className={cn("rounded-xl border", cardCn)}>
          <div className={cn("p-4 border-b flex items-center justify-between", borderB)}>
            <div className="flex items-center gap-2">
              <Flame className={cn("w-5 h-5 text-amber-500")} />
              <h2 className={cn("text-lg font-semibold", headerCn)}>Hazmat Gate Checks</h2>
            </div>
            <Badge variant="outline" className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30">
              {HAZMAT_ENTRIES.length} containers today
            </Badge>
          </div>

          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {HAZMAT_ENTRIES.map((hz) => {
              const placardCfg = hazmatConfig[hz.placardVerified];
              const docCfg = hazmatConfig[hz.documentation];
              return (
                <div key={hz.id} className={cn("p-3 rounded-lg border", isLight ? "bg-white border-slate-200" : "bg-slate-800/30 border-slate-700/50")}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Container className={cn("w-4 h-4", isLight ? "text-indigo-600" : "text-indigo-400")} />
                      <span className={cn("font-mono font-semibold text-sm", isLight ? "text-indigo-700" : "text-indigo-300")}>{hz.containerNumber}</span>
                    </div>
                    <span className={cn("text-xs font-mono", subCn)}>{hz.timestamp}</span>
                  </div>

                  <div className="mb-2">
                    <p className={cn("text-xs font-semibold", isLight ? "text-amber-700" : "text-amber-400")}>{hz.imdgClass}</p>
                    <p className={cn("text-xs", subCn)}>{hz.unNumber} &mdash; {hz.properShippingName}</p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("text-[10px] uppercase font-medium", subCn)}>Placard:</span>
                      <Badge variant="outline" className={cn("text-[10px] gap-1", placardCfg.color)}>
                        {placardCfg.icon} {placardCfg.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("text-[10px] uppercase font-medium", subCn)}>Docs:</span>
                      <Badge variant="outline" className={cn("text-[10px] gap-1", docCfg.color)}>
                        {docCfg.icon} {docCfg.label}
                      </Badge>
                    </div>
                    <span className={cn("text-[10px] ml-auto", subCn)}>{hz.inspector}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Turn Time Analytics */}
        <div className={cn("rounded-xl border", cardCn)}>
          <div className={cn("p-4 border-b", borderB)}>
            <div className="flex items-center gap-2 mb-1">
              <Gauge className={cn("w-5 h-5", isLight ? "text-indigo-600" : "text-indigo-400")} />
              <h2 className={cn("text-lg font-semibold", headerCn)}>Turn Time Analytics</h2>
            </div>
          </div>

          {/* Summary strip */}
          <div className={cn("grid grid-cols-3 gap-0 border-b", borderB)}>
            <div className={cn("p-4 text-center", isLight ? "border-r border-slate-200" : "border-r border-slate-700/50")}>
              <p className={cn("text-2xl font-bold", TURN_TIME_DATA.avgMinutes <= TURN_TIME_DATA.targetMinutes ? "text-emerald-400" : "text-red-400")}>
                {TURN_TIME_DATA.avgMinutes}m
              </p>
              <p className={cn("text-[10px] uppercase font-semibold", subCn)}>Avg Turn Time</p>
            </div>
            <div className={cn("p-4 text-center", isLight ? "border-r border-slate-200" : "border-r border-slate-700/50")}>
              <p className={cn("text-2xl font-bold text-amber-400")}>{TURN_TIME_DATA.peakHour.split(" — ")[0]}</p>
              <p className={cn("text-[10px] uppercase font-semibold", subCn)}>Peak Hour</p>
            </div>
            <div className="p-4 text-center">
              <p className={cn("text-2xl font-bold", headerCn)}>{TURN_TIME_DATA.targetMinutes}m</p>
              <p className={cn("text-[10px] uppercase font-semibold", subCn)}>Target</p>
            </div>
          </div>

          {/* Bottleneck callout */}
          <div className={cn("mx-4 mt-4 p-3 rounded-lg border flex items-center gap-2", isLight ? "bg-red-50 border-red-200" : "bg-red-500/10 border-red-500/20")}>
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <div>
              <p className={cn("text-xs font-semibold", isLight ? "text-red-700" : "text-red-400")}>Bottleneck Identified</p>
              <p className={cn("text-xs", isLight ? "text-red-600" : "text-red-300")}>{TURN_TIME_DATA.bottleneck}</p>
            </div>
          </div>

          {/* Hourly turn time bars */}
          <div className="p-4 space-y-2">
            {TURN_TIME_DATA.byHour.map((h) => {
              const overTarget = h.avg > TURN_TIME_DATA.targetMinutes;
              return (
                <div key={h.hour} className="flex items-center gap-2">
                  <span className={cn("text-[10px] font-mono w-10 shrink-0", subCn)}>{h.hour}</span>
                  <div className="flex-1">
                    <MiniBar
                      value={h.avg}
                      max={maxTurnTime}
                      color={overTarget ? "bg-red-500" : h.avg > TURN_TIME_DATA.targetMinutes * 0.8 ? "bg-amber-500" : "bg-emerald-500"}
                      isLight={isLight}
                    />
                  </div>
                  <span className={cn("text-[10px] font-mono w-8 text-right", overTarget ? "text-red-400 font-bold" : subCn)}>
                    {h.avg}m
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════ GATE ACTIVITY LOG ═══════════════════ */}
      <div className={cn("rounded-xl border", cardCn)}>
        <div className={cn("p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3", borderB)}>
          <div className="flex items-center gap-2">
            <Activity className={cn("w-5 h-5", isLight ? "text-indigo-600" : "text-indigo-400")} />
            <h2 className={cn("text-lg font-semibold", headerCn)}>Gate Activity Log</h2>
            <Badge variant="outline" className="text-xs">{filteredLog.length} events</Badge>
          </div>

          {/* Filter buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className={cn("w-4 h-4 mr-1", subCn)} />
            {(["all", "entry", "exit", "denied", "incident", "hazmat_check", "twic_fail"] as (ActivityType | "all")[]).map((f) => (
              <Button
                key={f}
                variant="outline"
                size="sm"
                onClick={() => setActivityFilter(f)}
                className={cn(
                  "text-[10px] px-2 py-1 h-7",
                  activityFilter === f
                    ? isLight ? "bg-indigo-100 border-indigo-300 text-indigo-700" : "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                    : isLight ? "border-slate-300 text-slate-600" : "border-slate-700 text-slate-400"
                )}
              >
                {f === "all" ? "All" : f === "hazmat_check" ? "Hazmat" : f === "twic_fail" ? "TWIC" : f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="divide-y max-h-[500px] overflow-y-auto" style={{ borderColor: isLight ? "#e2e8f0" : "rgba(51,65,85,0.5)" }}>
          {filteredLog.map((entry) => {
            const cfg = activityTypeConfig[entry.type];
            return (
              <div key={entry.id} className={cn("flex items-start gap-3 p-4 transition-colors", rowHover)}>
                {/* Timestamp */}
                <span className={cn("text-xs font-mono w-12 pt-0.5 shrink-0", subCn)}>{entry.timestamp}</span>

                {/* Icon */}
                <div className="shrink-0 pt-0.5">{cfg.icon}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <Badge variant="outline" className={cn("text-[10px] px-1.5", cfg.color === "text-emerald-400" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : cfg.color === "text-blue-400" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : cfg.color === "text-red-400" ? "bg-red-500/20 text-red-400 border-red-500/30" : cfg.color === "text-orange-400" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : cfg.color === "text-amber-400" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-rose-500/20 text-rose-400 border-rose-500/30")}>
                      {cfg.label}
                    </Badge>
                    <span className={cn("font-mono font-semibold text-sm", isLight ? "text-indigo-700" : "text-indigo-300")}>{entry.truckNumber}</span>
                    {entry.containerNumber && (
                      <span className={cn("font-mono text-xs", subCn)}>{entry.containerNumber}</span>
                    )}
                    <span className={cn("text-xs", subCn)}>&bull; {entry.driver}</span>
                  </div>
                  <p className={cn("text-xs", isLight ? "text-slate-600" : "text-slate-400")}>{entry.details}</p>
                </div>

                {/* Gate */}
                <span className={cn("text-[10px] font-mono shrink-0 pt-0.5", subCn)}>{entry.gate}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <div className={cn("text-center py-4 text-xs", subCn)}>
        EusoPort Gate Operations &mdash; Real-time terminal gate management &bull; Data refreshes every 30 seconds
      </div>
    </div>
  );
}
