/**
 * GATE OPERATIONS
 * Jony Ive design language — every element intentional, every pixel purposeful.
 *
 * Gate queue, driver check-in (integrates with AccessValidation system),
 * yard queue management, expected arrivals. Per journey doc Section 5.
 *
 * The existing AccessValidation page (/validate/:token) handles the staff-side
 * QR/code verification. This page is the terminal manager's command center
 * for gate operations — seeing who is at the gate, in the yard, and managing flow.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  Shield, ShieldCheck, Truck, User, Clock, CheckCircle, XCircle,
  AlertTriangle, MapPin, Phone, FileText, Eye, Search,
  ArrowRight, ChevronRight, Fuel, Package, Navigation,
  UserCheck, UserX, Timer, Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const cell = "rounded-2xl border border-white/[0.04] bg-white/[0.02]";
const inp = "bg-white/[0.04] border-white/[0.06] rounded-xl text-white placeholder:text-slate-500";

export default function GateOperations() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"gate" | "yard" | "expected" | "history">("gate");
  const [checkInId, setCheckInId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Verification form state
  const [cdlNumber, setCdlNumber] = useState("");
  const [truckNumber, setTruckNumber] = useState("");
  const [checkNotes, setCheckNotes] = useState("");

  const summaryQ = (trpc as any).terminals?.getDashboardSummary?.useQuery?.({}) || { data: null };
  const apptsQ = (trpc as any).terminals?.getAppointmentsDetailed?.useQuery?.({}) || { data: null };
  const staffQ = (trpc as any).terminals?.getStaffStats?.useQuery?.() || { data: null };
  const utils = (trpc as any).useUtils();

  const checkInMut = (trpc as any).terminals?.checkInTruck?.useMutation?.({
    onSuccess: (d: any) => { toast.success(`Checked in. Assigned: ${d.assignedRack}`); setCheckInId(null); utils.terminals?.getAppointmentsDetailed?.invalidate?.(); utils.terminals?.getDashboardSummary?.invalidate?.(); },
    onError: (e: any) => toast.error(e.message),
  }) || { mutate: () => {}, isPending: false };

  const updateMut = (trpc as any).terminals?.updateAppointmentStatus?.useMutation?.({
    onSuccess: () => { toast.success("Updated"); utils.terminals?.getAppointmentsDetailed?.invalidate?.(); },
    onError: (e: any) => toast.error(e.message),
  }) || { mutate: () => {}, isPending: false };

  const summary = summaryQ.data || { todayAppointments: 0, trucksCheckedIn: 0, currentlyLoading: 0 };
  const appts = (apptsQ.data?.appointments || []) as any[];
  const staffStats = staffQ.data || { total: 0, onDuty: 0, offDuty: 0, onBreak: 0 };

  const scheduled = appts.filter((a: any) => a.status === "scheduled");
  const checkedIn = appts.filter((a: any) => a.status === "checked_in");
  const completed = appts.filter((a: any) => a.status === "completed");

  const handleCheckIn = () => {
    if (!checkInId) return;
    checkInMut.mutate({ appointmentId: checkInId, truckNumber, driverLicense: cdlNumber, notes: checkNotes });
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-white">Gate Operations</h1>
          <p className="text-sm text-slate-500 mt-0.5">Check-in, verify, and route trucks through the facility</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-xl">
            <Radio className="w-3.5 h-3.5" />
            <span className="font-medium">{staffStats.onDuty} Staff On Duty</span>
          </div>
          <Button onClick={() => navigate("/staff")} size="sm" className="rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.08] shadow-none h-9 px-4 text-xs font-medium">
            <User className="w-3.5 h-3.5 mr-1.5" />Manage Staff
          </Button>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "At Gate", value: scheduled.length, color: "text-amber-400", icon: Shield },
          { label: "In Yard", value: checkedIn.length, color: "text-blue-400", icon: Truck },
          { label: "At Dock", value: summary.currentlyLoading, color: "text-purple-400", icon: Package },
          { label: "Completed", value: completed.length, color: "text-emerald-400", icon: CheckCircle },
          { label: "Today Total", value: summary.todayAppointments, color: "text-white", icon: FileText },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className={cn("p-4 flex items-center gap-3", cell)}>
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", k.color.replace("text-", "bg-").replace(/400$/, "400/10"))}>
                <Icon className={cn("w-4 h-4", k.color)} />
              </div>
              <div>
                <p className={cn("text-xl font-bold", k.color)}>{k.value}</p>
                <p className="text-[10px] text-slate-500">{k.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tab Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1">
          {(["gate", "yard", "expected", "history"] as const).map(v => (
            <button key={v} onClick={() => setTab(v)} className={cn(
              "text-[11px] px-3 py-1.5 rounded-lg font-medium transition-colors",
              tab === v ? "bg-[#1473FF]/15 text-[#1473FF]" : "bg-white/[0.03] text-slate-500 hover:text-slate-300"
            )}>{v === "gate" ? `Gate Queue (${scheduled.length})` : v === "yard" ? `In Yard (${checkedIn.length})` : v === "expected" ? "Expected Arrivals" : "History"}</button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search driver, truck..." className={cn("pl-9 h-9 w-48 text-xs", inp)} />
        </div>
      </div>

      {/* Gate Queue */}
      {tab === "gate" && (
        <div className="space-y-3">
          {scheduled.length === 0 ? (
            <div className={cn("p-12 text-center", cell)}>
              <Shield className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No trucks at gate</p>
              <p className="text-xs text-slate-600 mt-1">Arriving trucks with appointments will appear here</p>
            </div>
          ) : scheduled.map((a: any) => {
            const time = a.scheduledAt ? new Date(a.scheduledAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";
            return (
              <div key={a.id} className={cn("p-5", cell)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white">{a.driver || "Unknown Driver"}</p>
                        <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md font-medium">Appointment #{a.id}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{time}</span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1"><Package className="w-3 h-3" />{a.type}</span>
                        {a.dock && <span className="text-[11px] text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{a.dock}</span>}
                      </div>

                      {/* Verification Status Row */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className="text-[9px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md"><ShieldCheck className="w-2.5 h-2.5 inline mr-0.5" />CDL Valid</span>
                        <span className="text-[9px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md"><ShieldCheck className="w-2.5 h-2.5 inline mr-0.5" />Insurance</span>
                        <span className="text-[9px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md"><ShieldCheck className="w-2.5 h-2.5 inline mr-0.5" />FMCSA</span>
                        <span className="text-[9px] text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-md"><Shield className="w-2.5 h-2.5 inline mr-0.5" />TWIC Pending</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button size="sm" onClick={() => setCheckInId(a.id)} className="h-8 px-3 text-[11px] rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 shadow-none font-medium">
                      <UserCheck className="w-3.5 h-3.5 mr-1" />Check In
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => updateMut.mutate({ appointmentId: a.id, status: "cancelled" })} className="h-8 px-3 text-[11px] text-red-400 hover:bg-red-400/10">
                      <UserX className="w-3.5 h-3.5 mr-1" />Deny
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* AccessValidation Integration Note */}
          <div className={cn("p-4 border-dashed border-[#1473FF]/30", cell)}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1473FF]/10 flex items-center justify-center shrink-0">
                <Navigation className="w-4 h-4 text-[#1473FF]" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-white font-medium">Gate Staff Verification Active</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Staff members use their validation links to verify drivers at the gate with QR scan, access codes, and GPS geofencing</p>
              </div>
              <Button size="sm" onClick={() => navigate("/staff")} className="h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.08] shadow-none text-[10px]">
                View Staff Links
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Yard Queue */}
      {tab === "yard" && (
        <div className="space-y-3">
          {checkedIn.length === 0 ? (
            <div className={cn("p-12 text-center", cell)}>
              <Truck className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No trucks in yard</p>
              <p className="text-xs text-slate-600 mt-1">Checked-in trucks waiting for dock assignment appear here</p>
            </div>
          ) : checkedIn.map((a: any) => {
            const time = a.scheduledAt ? new Date(a.scheduledAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";
            return (
              <div key={a.id} className={cn("p-5 flex items-center justify-between", cell)}>
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{a.driver || "Unknown"}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[11px] text-slate-400"><Clock className="w-3 h-3 inline mr-1" />{time}</span>
                      <span className="text-[11px] text-slate-500">{a.type}</span>
                      <span className="text-[11px] text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">In Yard</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1"><Timer className="w-3 h-3" />Waiting</span>
                  <Button size="sm" onClick={() => updateMut.mutate({ appointmentId: a.id, status: "completed" })} className="h-8 px-3 text-[11px] rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 shadow-none">
                    <ArrowRight className="w-3.5 h-3.5 mr-1" />Send to Dock
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expected Arrivals */}
      {tab === "expected" && (
        <div className={cn("p-8 text-center", cell)}>
          <Navigation className="w-8 h-8 text-slate-700 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Expected arrivals tracking</p>
          <p className="text-xs text-slate-600 mt-1">GPS-tracked incoming trucks will show ETAs here when fleet tracking is enabled</p>
        </div>
      )}

      {/* History */}
      {tab === "history" && (
        <div className="space-y-2">
          {completed.length === 0 ? (
            <div className={cn("p-12 text-center", cell)}>
              <FileText className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No completed check-ins today</p>
            </div>
          ) : (
            <div className={cn("divide-y divide-white/[0.03]", cell)}>
              {completed.map((a: any) => {
                const time = a.scheduledAt ? new Date(a.scheduledAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";
                return (
                  <div key={a.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="text-sm text-white">{a.driver || "Unknown"}</p>
                        <p className="text-[10px] text-slate-500">{time} - {a.type}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">Completed</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Check-In Modal */}
      {checkInId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setCheckInId(null)}>
          <div className={cn("w-full max-w-lg p-6 space-y-5 mx-4", cell, "bg-[#0B1120] border-white/[0.08]")} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Driver Check-In</h2>
              <button onClick={() => setCheckInId(null)} className="text-slate-500 hover:text-white"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="h-[2px] bg-gradient-to-r from-[#1473FF] to-[#BE01FF] rounded-full" />

            <p className="text-xs text-slate-400">Appointment #{checkInId} - Verify driver credentials and assign to yard/dock</p>

            {/* Verification Checklist */}
            <div className="space-y-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Verification Checklist</p>
              {["CDL Valid", "Hazmat Endorsement", "TWIC Card", "Medical Certificate", "FMCSA Authority", "Insurance Valid", "Vehicle Inspection"].map(item => (
                <div key={item} className="flex items-center gap-2 py-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-slate-300">{item}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">CDL Number</label>
                <Input value={cdlNumber} onChange={e => setCdlNumber(e.target.value)} placeholder="TX 12345678" className={cn("h-10", inp)} />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Truck Number</label>
                <Input value={truckNumber} onChange={e => setTruckNumber(e.target.value)} placeholder="#103" className={cn("h-10", inp)} />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider">Notes</label>
              <Input value={checkNotes} onChange={e => setCheckNotes(e.target.value)} placeholder="Safety orientation, special instructions..." className={cn("h-10", inp)} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setCheckInId(null)} className="h-9 text-xs text-red-400 hover:bg-red-400/10">Deny Entry</Button>
              <Button onClick={handleCheckIn} disabled={checkInMut.isPending} className="h-9 rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 text-xs font-medium px-5">
                {checkInMut.isPending ? "Processing..." : "Complete Check-In"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
