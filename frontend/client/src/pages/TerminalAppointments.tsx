/**
 * TERMINAL APPOINTMENTS
 * Jony Ive design language — every element intentional, every pixel purposeful.
 *
 * Calendar grid by dock/bay, create appointments, pending requests,
 * approve/deny, walk-in handling. Per journey doc Section 4.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import {
  Calendar, Plus, Clock, CheckCircle, XCircle, AlertTriangle,
  ChevronLeft, ChevronRight, Search, Truck, User,
  Package, CalendarDays, Shield, ShieldCheck,
  Wifi, WifiOff, Fuel, Loader2, ChevronDown,
  CreditCard, Database, UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { EsangIcon } from "@/components/EsangIcon";
import { Badge } from "@/components/ui/badge";
import DatePicker from "@/components/DatePicker";

const STATUS_STYLE: Record<string, { cls: string; label: string; icon: any }> = {
  scheduled:  { cls: "text-blue-400 bg-blue-400/10", label: "Scheduled", icon: Clock },
  checked_in: { cls: "text-amber-400 bg-amber-400/10", label: "Checked In", icon: Truck },
  loading:    { cls: "text-purple-400 bg-purple-400/10", label: "Loading", icon: Package },
  completed:  { cls: "text-emerald-400 bg-emerald-400/10", label: "Completed", icon: CheckCircle },
  cancelled:  { cls: "text-red-400 bg-red-400/10", label: "Cancelled", icon: XCircle },
  no_show:    { cls: "text-slate-400 bg-white/[0.04]", label: "No Show", icon: AlertTriangle },
};

const TIME_SLOTS = ["06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];

export default function TerminalAppointments() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const cell = isLight ? "rounded-2xl border border-slate-200/80 bg-white" : "rounded-2xl border border-white/[0.04] bg-white/[0.02]";
  const inp = isLight ? "bg-slate-50 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400" : "bg-white/[0.04] border-white/[0.06] rounded-xl text-white placeholder:text-slate-500";
  const [view, setView] = useState<"calendar" | "list" | "pending">("calendar");
  const [dateOffset, setDateOffset] = useState(0);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // Form state — TAS-integrated appointment creation
  const [formType, setFormType] = useState<"loading" | "unloading" | "pickup" | "delivery">("loading");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formTime, setFormTime] = useState("09:00");
  const [formDock, setFormDock] = useState("");
  const [formProduct, setFormProduct] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formQuantityUnit, setFormQuantityUnit] = useState("barrels");
  const [formTruckNumber, setFormTruckNumber] = useState("");
  const [formTrailerNumber, setFormTrailerNumber] = useState("");
  const [formHazmatClass, setFormHazmatClass] = useState("");
  const [formUnNumber, setFormUnNumber] = useState("");
  const [formDriverId, setFormDriverId] = useState("");
  const [formCarrierId, setFormCarrierId] = useState("");
  const [formLoadId, setFormLoadId] = useState("");
  const [formEstDuration, setFormEstDuration] = useState("45");
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [skipTasValidation, setSkipTasValidation] = useState(false);

  // ERG search (ESANG AI powered)
  const [ergQuery, setErgQuery] = useState("");
  const [showErgResults, setShowErgResults] = useState(false);
  const ergSuggestRef = useRef<HTMLDivElement>(null);
  const ergSearch = (trpc as any).erg?.search?.useQuery?.(
    { query: ergQuery, limit: 8 },
    { enabled: ergQuery.length >= 2, staleTime: 30000 }
  ) || { data: null, isLoading: false };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ergSuggestRef.current && !ergSuggestRef.current.contains(e.target as Node)) setShowErgResults(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + dateOffset);
  const dateStr = currentDate.toISOString().split("T")[0];
  const dateLabel = currentDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const statsQ = (trpc as any).terminals?.getAppointmentStats?.useQuery?.({ date: dateStr }) || { data: null };
  const detailedQ = (trpc as any).terminals?.getAppointmentsDetailed?.useQuery?.({ date: dateStr }) || { data: null, isLoading: false };
  const racksQ = (trpc as any).terminals?.getRackStatus?.useQuery?.() || { data: null };
  const utils = (trpc as any).useUtils();

  // TAS connection status
  const tasStatusQ = (trpc as any).terminals?.getTASConnectionStatus?.useQuery?.() || { data: null };
  const tasConnected = tasStatusQ.data?.connected ?? false;

  // TAS pre-clearance check (live validation in modal step 2)
  const preClearanceQ = (trpc as any).terminals?.runPreClearanceCheck?.useQuery?.(
    { terminalId: "1", carrierId: formCarrierId ? parseInt(formCarrierId) : undefined, driverId: formDriverId ? parseInt(formDriverId) : undefined, product: formProduct || undefined, type: formType },
    { enabled: showCreate && formStep === 2, staleTime: 10000, refetchOnWindowFocus: false }
  ) || { data: null, isLoading: false, isError: false };

  // Driver search for modal
  const [driverSearch, setDriverSearch] = useState("");
  const driversQ = (trpc as any).users?.searchUsers?.useQuery?.(
    { query: driverSearch, role: "DRIVER", limit: 5 },
    { enabled: driverSearch.length >= 2, staleTime: 30000 }
  ) || { data: null };

  const bookMut = (trpc as any).terminals?.bookAppointment?.useMutation?.({
    onSuccess: (data: any) => {
      const msg = data?.preClearanceStatus === "cleared" ? "Appointment created — TAS Pre-Cleared" : data?.preClearanceStatus === "denied" ? "Appointment created — Pre-Clearance Issues Found" : "Appointment created";
      toast.success(msg, { description: data?.confirmationNumber ? `Confirmation: ${data.confirmationNumber}` : undefined });
      setShowCreate(false); setFormStep(1); resetForm();
      utils.terminals?.getAppointmentsDetailed?.invalidate?.(); utils.terminals?.getAppointmentStats?.invalidate?.();
    },
    onError: (e: any) => toast.error(e.message),
  }) || { mutate: () => {}, isPending: false };

  const updateMut = (trpc as any).terminals?.updateAppointmentStatus?.useMutation?.({
    onSuccess: (data: any) => {
      if (data?.bolNumber) {
        toast.success("Appointment Completed — BOL Generated", { description: `BOL: ${data.bolNumber}` });
      } else {
        toast.success("Status updated");
      }
      if (data?.detention?.exceeded) {
        toast.warning(`Detention Alert: ${data.detention.minutes} minutes over free time`, { description: "Detention charges may apply" });
      }
      utils.terminals?.getAppointmentsDetailed?.invalidate?.(); utils.terminals?.getAppointmentStats?.invalidate?.();
    },
    onError: (e: any) => toast.error(e.message),
  }) || { mutate: () => {}, isPending: false };

  const stats = statsQ.data || { total: 0, completed: 0, inProgress: 0, scheduled: 0, cancelled: 0, confirmed: 0, pending: 0, checkedIn: 0 };
  const appts = (detailedQ.data?.appointments || []) as any[];
  const racks = (racksQ.data || []) as any[];

  const filtered = appts.filter((a: any) => {
    if (filter !== "all" && a.status !== filter) return false;
    if (search && !a.driver?.toLowerCase().includes(search.toLowerCase()) && !a.dock?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const resetForm = useCallback(() => {
    setFormType("loading"); setFormDate(new Date().toISOString().split("T")[0]); setFormTime("09:00");
    setFormDock(""); setFormProduct(""); setFormNotes(""); setFormQuantity(""); setFormQuantityUnit("barrels");
    setFormTruckNumber(""); setFormTrailerNumber(""); setFormHazmatClass(""); setFormUnNumber("");
    setFormDriverId(""); setFormCarrierId(""); setFormLoadId(""); setFormEstDuration("45");
    setFormStep(1); setSkipTasValidation(false); setDriverSearch("");
  }, []);

  const handleCreate = () => {
    bookMut.mutate({
      date: formDate, time: formTime, terminal: "1", type: formType,
      product: formProduct || undefined, quantity: formQuantity ? parseFloat(formQuantity) : undefined,
      quantityUnit: formQuantityUnit, dockNumber: formDock || undefined,
      driverId: formDriverId ? parseInt(formDriverId) : undefined,
      carrierId: formCarrierId ? parseInt(formCarrierId) : undefined,
      loadId: formLoadId ? parseInt(formLoadId) : undefined,
      truckNumber: formTruckNumber || undefined, trailerNumber: formTrailerNumber || undefined,
      hazmatClass: formHazmatClass || undefined, unNumber: formUnNumber || undefined,
      estimatedDurationMin: formEstDuration ? parseInt(formEstDuration) : undefined,
      notes: formNotes || undefined, skipTasValidation,
    });
  };

  const getApptForSlot = (time: string, rackId: string) => {
    return appts.find((a: any) => {
      const t = a.scheduledAt ? new Date(a.scheduledAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) : "";
      return t.startsWith(time.slice(0, 2)) && (a.dock === rackId || a.dock === "");
    });
  };

  const PRECLEARANCE_ICONS: Record<string, any> = { "Credit Authorization": CreditCard, "Product Allocation": Database, "Inventory Level": Fuel, "Driver Pre-Clearance": UserCheck };
  const PRECLEARANCE_COLORS: Record<string, string> = { pass: "text-emerald-400 bg-emerald-400/10", fail: "text-red-400 bg-red-400/10", warn: "text-amber-400 bg-amber-400/10", skip: "text-slate-500 bg-white/[0.03]" };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className={`text-[28px] font-semibold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>Appointments</h1>
          <p className="text-sm text-slate-500 mt-0.5">Schedule, manage, and track facility appointments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreate(true)} size="sm" className="rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 text-white border-0 shadow-none h-9 px-4 text-xs font-medium">
            <Plus className="w-3.5 h-3.5 mr-1.5" />New Appointment
          </Button>
        </div>
      </div>

      {/* TAS Connection Status Banner */}
      <div className={cn("flex items-center justify-between px-4 py-2.5 rounded-xl", tasConnected ? (isLight ? "bg-emerald-50 border border-emerald-200" : "bg-emerald-500/5 border border-emerald-500/10") : (isLight ? "bg-amber-50 border border-amber-200" : "bg-amber-500/5 border border-amber-500/10"))}>
        <div className="flex items-center gap-2.5">
          {tasConnected ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-amber-400" />}
          <div>
            <p className={cn("text-xs font-medium", tasConnected ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>{tasConnected ? "TAS Connected" : "TAS Disconnected"}</p>
            <p className="text-[10px] text-slate-500">{tasStatusQ.data?.provider || "DTN Guardian3 / TABS / TIMS"}{tasStatusQ.data?.environment ? ` — ${tasStatusQ.data.environment}` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tasConnected && <span className="text-[10px] text-slate-500">Pre-clearance, credit, allocation & inventory checks active</span>}
          <div className={cn("w-2 h-2 rounded-full", tasConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400")} />
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: "Total", value: stats.total, color: isLight ? "text-slate-900" : "text-white" },
          { label: "Scheduled", value: stats.scheduled, color: "text-blue-400" },
          { label: "Checked In", value: stats.checkedIn, color: "text-amber-400" },
          { label: "In Progress", value: stats.inProgress, color: "text-purple-400" },
          { label: "Completed", value: stats.completed, color: "text-emerald-400" },
          { label: "Cancelled", value: stats.cancelled, color: "text-red-400" },
        ].map(k => (
          <div key={k.label} className={cn("p-3 text-center", cell)}>
            <p className={cn("text-xl font-bold", k.color)}>{k.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* View Toggle + Date Nav */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1">
          {(["calendar", "list", "pending"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} className={cn(
              "text-[11px] px-3 py-1.5 rounded-lg font-medium transition-colors",
              view === v ? "bg-[#1473FF]/15 text-[#1473FF]" : isLight ? "bg-slate-100 text-slate-500 hover:text-slate-700" : "bg-white/[0.03] text-slate-500 hover:text-slate-300"
            )}>{v === "calendar" ? "Calendar" : v === "list" ? "List" : "Pending"}</button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setDateOffset(d => d - 1)} className={`p-1.5 rounded-lg transition-colors ${isLight ? "bg-slate-100 hover:bg-slate-200" : "bg-white/[0.04] hover:bg-white/[0.08]"}`}><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
          <button onClick={() => setDateOffset(0)} className={`text-xs font-medium px-3 py-1.5 rounded-lg ${isLight ? "text-slate-600 bg-slate-100 hover:bg-slate-200" : "text-slate-300 bg-white/[0.04] hover:bg-white/[0.08]"}`}>Today</button>
          <span className={`text-sm font-medium min-w-[200px] text-center ${isLight ? "text-slate-900" : "text-white"}`}>{dateLabel}</span>
          <button onClick={() => setDateOffset(d => d + 1)} className={`p-1.5 rounded-lg transition-colors ${isLight ? "bg-slate-100 hover:bg-slate-200" : "bg-white/[0.04] hover:bg-white/[0.08]"}`}><ChevronRight className="w-4 h-4 text-slate-400" /></button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className={cn("pl-9 h-9 w-48 text-xs", inp)} />
        </div>
      </div>

      {/* Calendar View */}
      {view === "calendar" && (
        <div className={cn("overflow-x-auto", cell)}>
          <table className="w-full text-xs">
            <thead>
              <tr className={`border-b ${isLight ? "border-slate-200" : "border-white/[0.04]"}`}>
                <th className="py-3 px-4 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold w-20">Time</th>
                {racks.length > 0 ? racks.map((r: any) => (
                  <th key={r.id} className="py-3 px-3 text-center text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    <span className={`block ${isLight ? "text-slate-900" : "text-white"}`}>{r.name}</span>
                    <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded-md mt-0.5 inline-block",
                      r.status === "available" ? "text-emerald-400 bg-emerald-400/10" :
                      r.status === "in_use" ? "text-blue-400 bg-blue-400/10" :
                      r.status === "maintenance" ? "text-red-400 bg-red-400/10" : "text-slate-400 bg-white/[0.04]"
                    )}>{r.status?.replace("_", " ")}</span>
                  </th>
                )) : ["Bay 1", "Bay 2", "Bay 3", "Bay 4", "Bay 5", "Bay 6"].map(b => (
                  <th key={b} className="py-3 px-3 text-center text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{b}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map(time => (
                <tr key={time} className={`border-b ${isLight ? "border-slate-100 hover:bg-slate-50" : "border-white/[0.03] hover:bg-white/[0.01]"}`}>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{time}</td>
                  {(racks.length > 0 ? racks : [{ id: "bay_1" }, { id: "bay_2" }, { id: "bay_3" }, { id: "bay_4" }, { id: "bay_5" }, { id: "bay_6" }]).map((r: any) => {
                    const appt = getApptForSlot(time, r.id || r.name);
                    return (
                      <td key={r.id} className="py-2 px-2">
                        {appt ? (
                          <div className={cn("p-2 rounded-lg border cursor-pointer hover:scale-[1.02] transition-transform",
                            appt.status === "completed" ? "bg-emerald-500/10 border-emerald-500/20" :
                            appt.status === "checked_in" ? "bg-amber-500/10 border-amber-500/20" :
                            appt.status === "loading" ? "bg-purple-500/10 border-purple-500/20" :
                            "bg-blue-500/10 border-blue-500/20"
                          )}>
                            <p className={`text-[10px] font-medium truncate ${isLight ? "text-slate-900" : "text-white"}`}>{appt.driver}</p>
                            <p className="text-[9px] text-slate-400 truncate">{appt.type}</p>
                          </div>
                        ) : (
                          <div className={`h-8 rounded-lg border border-dashed transition-colors cursor-pointer ${isLight ? "border-slate-200 hover:border-slate-400" : "border-white/[0.04] hover:border-white/[0.08]"}`} onClick={() => { setFormTime(time); setShowCreate(true); }} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="space-y-2">
          <div className="flex gap-1.5 mb-3">
            {["all", "scheduled", "checked_in", "loading", "completed", "cancelled"].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={cn(
                "text-[10px] px-3 py-1.5 rounded-lg font-medium transition-colors",
                filter === f ? "bg-[#1473FF]/15 text-[#1473FF]" : isLight ? "bg-slate-100 text-slate-500 hover:text-slate-700" : "bg-white/[0.03] text-slate-500 hover:text-slate-300"
              )}>{f === "all" ? "All" : f.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className={cn("p-12 text-center", cell)}>
              <Calendar className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No appointments found</p>
              <p className="text-xs text-slate-600 mt-1">Create a new appointment to get started</p>
            </div>
          ) : (
            <div className={cn("divide-y divide-white/[0.03]", cell)}>
              {filtered.map((a: any) => {
                const st = STATUS_STYLE[a.status] || STATUS_STYLE.scheduled;
                const Icon = st.icon;
                const time = a.scheduledAt ? new Date(a.scheduledAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";
                const pcStatus = a.preClearanceStatus || "pending";
                const pcCls = pcStatus === "cleared" ? "text-emerald-400 bg-emerald-400/10" : pcStatus === "denied" ? "text-red-400 bg-red-400/10" : pcStatus === "bypassed" ? "text-slate-400 bg-white/[0.04]" : "text-amber-400 bg-amber-400/10";
                return (
                  <div key={a.id} className={`flex items-center justify-between px-5 py-4 ${isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.01]"}`}>
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", st.cls)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-medium truncate ${isLight ? "text-slate-900" : "text-white"}`}>{a.driver || "Unassigned"}</p>
                          {a.dock && <span className={`text-[9px] text-slate-500 px-1.5 py-0.5 rounded font-mono ${isLight ? "bg-slate-100" : "bg-white/[0.04]"}`}>{a.dock}</span>}
                          {a.truckNumber && <span className={`text-[9px] text-slate-500 px-1.5 py-0.5 rounded font-mono ${isLight ? "bg-slate-100" : "bg-white/[0.04]"}`}><Truck className="w-2.5 h-2.5 inline mr-0.5" />{a.truckNumber}</span>}
                          {a.hazmatClass && <span className="text-[9px] text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded font-medium">⚠ Class {a.hazmatClass}</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="text-[11px] text-slate-400"><Clock className="w-3 h-3 inline mr-1" />{time}</span>
                          <span className="text-[11px] text-slate-500">{a.type}</span>
                          {a.product && <span className="text-[11px] text-cyan-400"><Fuel className="w-3 h-3 inline mr-0.5" />{a.product}</span>}
                          {a.quantity && <span className="text-[10px] text-slate-500">{a.quantity} {a.quantityUnit}</span>}
                          {a.loadId && <span className="text-[10px] text-slate-600">Load #{a.loadId}</span>}
                          {a.bolNumber && <span className="text-[10px] text-purple-400">BOL: {a.bolNumber}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Pre-clearance badge */}
                      <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded-md flex items-center gap-1", pcCls)}>
                        {pcStatus === "cleared" ? <ShieldCheck className="w-3 h-3" /> : pcStatus === "denied" ? <XCircle className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                        {pcStatus.toUpperCase()}
                      </span>
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md", st.cls)}>{st.label}</span>
                      {a.status === "scheduled" && (
                        <Button size="sm" onClick={() => updateMut.mutate({ appointmentId: a.id, status: "checked_in" })} className="h-7 px-2.5 text-[10px] rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/20 shadow-none">
                          Check In
                        </Button>
                      )}
                      {a.status === "checked_in" && (
                        <Button size="sm" onClick={() => updateMut.mutate({ appointmentId: a.id, status: "completed" })} className="h-7 px-2.5 text-[10px] rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 shadow-none">
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pending View */}
      {view === "pending" && (
        <div className={cn("p-8 text-center", cell)}>
          <CalendarDays className="w-8 h-8 text-slate-700 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No pending appointment requests</p>
          <p className="text-xs text-slate-600 mt-1">Walk-in and external requests will appear here for approval</p>
        </div>
      )}

      {/* Create Modal — 2-Step TAS-Integrated */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowCreate(false); resetForm(); }}>
          <div className={cn("w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4 mx-4", cell, isLight ? "bg-white border-slate-200" : "bg-[#0B1120] border-white/[0.08]")} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className={`text-lg font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>New Appointment</h2>
                <div className="flex items-center gap-1">
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold", formStep >= 1 ? "bg-[#1473FF] text-white" : isLight ? "bg-slate-200 text-slate-500" : "bg-white/[0.06] text-slate-500")}>1</div>
                  <div className={cn("w-8 h-0.5 rounded", formStep >= 2 ? "bg-[#1473FF]" : isLight ? "bg-slate-200" : "bg-white/[0.06]")} />
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold", formStep >= 2 ? "bg-[#1473FF] text-white" : isLight ? "bg-slate-200 text-slate-500" : "bg-white/[0.06] text-slate-500")}>2</div>
                </div>
              </div>
              <button onClick={() => { setShowCreate(false); resetForm(); }} className={`${isLight ? "text-slate-400 hover:text-slate-700" : "text-slate-500 hover:text-white"}`}><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="h-[2px] bg-gradient-to-r from-[#1473FF] to-[#BE01FF] rounded-full" />

            {/* Step 1: Appointment Details */}
            {formStep === 1 && (
              <div className="space-y-4">
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Appointment Details</p>

                {/* Type + Product Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Type</label>
                    <select value={formType} onChange={e => setFormType(e.target.value as any)} className={cn("w-full px-3 py-2 text-sm h-10", inp)}>
                      <option value="loading">Loading (Pickup)</option>
                      <option value="unloading">Unloading (Delivery)</option>
                      <option value="pickup">Pickup</option>
                      <option value="delivery">Delivery</option>
                    </select>
                  </div>
                  <div ref={ergSuggestRef} className="relative">
                    <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Product (ERG AI)</label>
                    <div className="flex gap-1.5">
                      <div className="relative flex-1">
                        <Search className={cn("absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5", isLight ? "text-slate-400" : "text-slate-500")} />
                        <Input value={formProduct} onChange={e => {
                          setFormProduct(e.target.value);
                          const v = e.target.value.replace(/^un/i, "").trim();
                          if (v.length >= 2) { setErgQuery(v); setShowErgResults(true); }
                          else setShowErgResults(false);
                        }} onFocus={() => { if (ergQuery.length >= 2) setShowErgResults(true); }}
                          placeholder="e.g. UN1203 Gasoline" className={cn("h-10 pl-8", inp)} />
                      </div>
                      <Button variant="outline" size="sm" className={cn("h-10 px-2 rounded-xl", isLight ? "bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100" : "bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20")} onClick={() => {
                        if (formProduct.trim().length >= 2) { setErgQuery(formProduct.replace(/^un/i, "").trim()); setShowErgResults(true); }
                      }}>
                        <EsangIcon className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    {showErgResults && ergSearch.data?.results?.length > 0 && (
                      <div className={cn("absolute z-50 left-0 right-0 mt-1 rounded-xl border shadow-xl max-h-56 overflow-y-auto", isLight ? "bg-white border-slate-200" : "bg-slate-800 border-slate-600/50")}>
                        <div className={cn("px-3 py-1.5 text-[9px] uppercase tracking-wide border-b sticky top-0", isLight ? "text-slate-400 border-slate-100 bg-white" : "text-slate-500 border-slate-700/50 bg-slate-800")}>ERG 2024 — {ergSearch.data.count} results</div>
                        {ergSearch.data.results.map((m: any, i: number) => (
                          <button key={`${m.unNumber}-${i}`} className={cn("w-full text-left px-3 py-2 flex items-center justify-between gap-2 border-b last:border-0 transition-colors", isLight ? "hover:bg-slate-50 border-slate-100" : "hover:bg-slate-700/50 border-slate-700/20")} onClick={() => {
                            setFormProduct(`UN${m.unNumber} ${m.name}`);
                            setFormHazmatClass(m.hazardClass || ""); setFormUnNumber(m.unNumber || "");
                            setShowErgResults(false);
                            toast.success("ESANG AI — Product Verified", { description: `${m.name} — UN${m.unNumber} (Class ${m.hazardClass}) Guide ${m.guide}` });
                          }}>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-xs font-medium truncate", isLight ? "text-slate-900" : "text-white")}>{m.name}</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Badge variant="outline" className="text-[9px] border-cyan-500/30 text-cyan-500">UN{m.unNumber}</Badge>
                              <Badge variant="outline" className="text-[9px] border-purple-500/30 text-purple-400">Class {m.hazardClass}</Badge>
                              <Badge variant="outline" className="text-[9px] border-slate-500/30 text-slate-400">G{m.guide}</Badge>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {showErgResults && ergQuery.length >= 2 && ergSearch.isLoading && (
                      <div className={cn("absolute z-50 left-0 right-0 mt-1 rounded-xl border shadow-xl p-3", isLight ? "bg-white border-slate-200" : "bg-slate-800 border-slate-600/50")}>
                        <div className="flex items-center gap-2 text-slate-400 text-xs"><EsangIcon className="w-3.5 h-3.5 animate-spin" />Searching ERG 2024...</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quantity + Date + Time */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Quantity</label>
                    <div className="flex gap-1">
                      <Input type="number" value={formQuantity} onChange={e => setFormQuantity(e.target.value)} placeholder="0" className={cn("h-10 flex-1", inp)} />
                      <select value={formQuantityUnit} onChange={e => setFormQuantityUnit(e.target.value)} className={cn("px-2 py-2 text-[10px] h-10 w-20", inp)}>
                        <option value="barrels">bbl</option>
                        <option value="gallons">gal</option>
                        <option value="metric_tons">MT</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Date</label>
                    <DatePicker value={formDate} onChange={setFormDate} placeholder="Select date" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Time</label>
                    <select value={formTime} onChange={e => setFormTime(e.target.value)} className={cn("w-full px-3 py-2 text-sm h-10", inp)}>
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Driver + Carrier */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Driver ID</label>
                    <Input value={formDriverId} onChange={e => setFormDriverId(e.target.value)} placeholder="Driver user ID" className={cn("h-10", inp)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Carrier ID</label>
                    <Input value={formCarrierId} onChange={e => setFormCarrierId(e.target.value)} placeholder="Carrier company ID" className={cn("h-10", inp)} />
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Truck #</label>
                    <Input value={formTruckNumber} onChange={e => setFormTruckNumber(e.target.value)} placeholder="TRK-001" className={cn("h-10", inp)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Trailer #</label>
                    <Input value={formTrailerNumber} onChange={e => setFormTrailerNumber(e.target.value)} placeholder="TRL-001" className={cn("h-10", inp)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Dock / Bay</label>
                    <Input value={formDock} onChange={e => setFormDock(e.target.value)} placeholder="Auto-assign" className={cn("h-10", inp)} />
                  </div>
                </div>

                {/* Hazmat + Load Ref + Duration */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Hazmat Class</label>
                    <Input value={formHazmatClass} onChange={e => setFormHazmatClass(e.target.value)} placeholder="e.g. 3" className={cn("h-10", inp)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Load Reference</label>
                    <Input value={formLoadId} onChange={e => setFormLoadId(e.target.value)} placeholder="Load ID (optional)" className={cn("h-10", inp)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Est. Duration (min)</label>
                    <Input type="number" value={formEstDuration} onChange={e => setFormEstDuration(e.target.value)} placeholder="45" className={cn("h-10", inp)} />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Notes</label>
                  <Input value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Special instructions, access codes..." className={cn("h-10", inp)} />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" onClick={() => { setShowCreate(false); resetForm(); }} className="h-9 text-xs text-slate-400">Cancel</Button>
                  <Button onClick={() => setFormStep(2)} className="h-9 rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 text-white border-0 shadow-none text-xs font-medium px-5">
                    <Shield className="w-3.5 h-3.5 mr-1.5" />Review & Validate
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: TAS Pre-Clearance Validation */}
            {formStep === 2 && (
              <div className="space-y-4">
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">TAS Pre-Clearance Validation</p>

                {/* Summary of appointment */}
                <div className={cn("p-3 rounded-xl space-y-1.5", isLight ? "bg-slate-50 border border-slate-200" : "bg-white/[0.02] border border-white/[0.04]")}>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div><span className="text-slate-500">Type:</span> <span className={isLight ? "text-slate-900 font-medium" : "text-white font-medium"}>{formType}</span></div>
                    <div><span className="text-slate-500">Date:</span> <span className={isLight ? "text-slate-900 font-medium" : "text-white font-medium"}>{formDate} {formTime}</span></div>
                    <div><span className="text-slate-500">Quantity:</span> <span className={isLight ? "text-slate-900 font-medium" : "text-white font-medium"}>{formQuantity || "—"} {formQuantityUnit}</span></div>
                    <div><span className="text-slate-500">Product:</span> <span className={isLight ? "text-slate-900 font-medium" : "text-white font-medium"}>{formProduct || "—"}</span></div>
                    <div><span className="text-slate-500">Truck:</span> <span className={isLight ? "text-slate-900 font-medium" : "text-white font-medium"}>{formTruckNumber || "—"}</span></div>
                    <div><span className="text-slate-500">Driver:</span> <span className={isLight ? "text-slate-900 font-medium" : "text-white font-medium"}>{formDriverId ? `#${formDriverId}` : "—"}</span></div>
                  </div>
                </div>

                {/* Pre-clearance checks panel */}
                <div className={cn("rounded-xl border overflow-hidden", isLight ? "border-slate-200" : "border-white/[0.06]")}>
                  <div className={cn("px-4 py-2.5 flex items-center justify-between", isLight ? "bg-slate-50 border-b border-slate-200" : "bg-white/[0.02] border-b border-white/[0.04]")}>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#1473FF]" />
                      <span className={cn("text-xs font-semibold", isLight ? "text-slate-900" : "text-white")}>TAS Validation Checks</span>
                    </div>
                    {preClearanceQ.isLoading && <Loader2 className="w-3.5 h-3.5 text-[#1473FF] animate-spin" />}
                    {preClearanceQ.data && (
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md",
                        preClearanceQ.data.overall === "cleared" ? "text-emerald-400 bg-emerald-400/10" :
                        preClearanceQ.data.overall === "denied" ? "text-red-400 bg-red-400/10" : "text-amber-400 bg-amber-400/10"
                      )}>{preClearanceQ.data.overall === "cleared" ? "ALL CLEAR" : preClearanceQ.data.overall === "denied" ? "ISSUES FOUND" : "WARNINGS"}</span>
                    )}
                  </div>
                  <div className="divide-y divide-white/[0.03]">
                    {preClearanceQ.isLoading ? (
                      <div className="p-6 text-center">
                        <Loader2 className="w-6 h-6 text-[#1473FF] animate-spin mx-auto mb-2" />
                        <p className="text-xs text-slate-500">Running TAS validation checks...</p>
                        <p className="text-[10px] text-slate-600 mt-1">Credit · Allocation · Inventory · Driver Pre-Clearance</p>
                      </div>
                    ) : preClearanceQ.data?.checks ? (
                      preClearanceQ.data.checks.map((check: any, i: number) => {
                        const Icon = PRECLEARANCE_ICONS[check.label] || Shield;
                        const colorCls = PRECLEARANCE_COLORS[check.status] || PRECLEARANCE_COLORS.skip;
                        return (
                          <div key={i} className={cn("flex items-center justify-between px-4 py-3", isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.01]")}>
                            <div className="flex items-center gap-3">
                              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colorCls)}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <p className={cn("text-xs font-medium", isLight ? "text-slate-900" : "text-white")}>{check.label}</p>
                                <p className="text-[10px] text-slate-500">{check.detail}</p>
                              </div>
                            </div>
                            <div className={cn("flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-md", colorCls)}>
                              {check.status === "pass" && <CheckCircle className="w-3 h-3" />}
                              {check.status === "fail" && <XCircle className="w-3 h-3" />}
                              {check.status === "warn" && <AlertTriangle className="w-3 h-3" />}
                              {check.status === "skip" && <span className="w-3 h-3 text-center">—</span>}
                              {check.status.toUpperCase()}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center">
                        <Shield className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                        <p className="text-xs text-slate-500">Validation unavailable</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Skip validation toggle */}
                <label className={cn("flex items-center gap-2 text-[11px] cursor-pointer px-1", isLight ? "text-slate-600" : "text-slate-400")}>
                  <input type="checkbox" checked={skipTasValidation} onChange={e => setSkipTasValidation(e.target.checked)} className="rounded border-slate-300 text-[#1473FF]" />
                  Skip TAS validation (bypass pre-clearance checks)
                </label>

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={() => setFormStep(1)} className="h-9 text-xs text-slate-400">
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />Back
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => { setShowCreate(false); resetForm(); }} className="h-9 text-xs text-slate-400">Cancel</Button>
                    <Button onClick={handleCreate} disabled={bookMut.isPending} className={cn("h-9 rounded-xl text-xs font-medium px-5",
                      preClearanceQ.data?.overall === "denied" && !skipTasValidation
                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                        : "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 text-white border-0 shadow-none"
                    )}>
                      {bookMut.isPending ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Creating...</> :
                       preClearanceQ.data?.overall === "denied" && !skipTasValidation ? "Create Anyway (Issues Found)" : "Create Appointment"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
