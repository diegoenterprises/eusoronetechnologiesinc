/**
 * DRIVER DASHBOARD PAGE
 * Jony Ive design — theme-aware, carrier connection, HOS, current load
 * Uses single getDriverDashboard endpoint for all data
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import {
  Truck, Clock, DollarSign, MapPin, Navigation, Package,
  CheckCircle, AlertTriangle, ClipboardCheck, Fuel, Shield,
  Building2, ChevronRight, FileText, Activity, Award,
  IdCard, Gauge
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  driving:  { label: "Driving",  color: "text-emerald-500", bg: "bg-emerald-500" },
  on_duty:  { label: "On Duty",  color: "text-blue-500",    bg: "bg-blue-500" },
  off_duty: { label: "Off Duty", color: "text-slate-400",   bg: "bg-slate-400" },
  sleeper:  { label: "Sleeper",  color: "text-purple-500",  bg: "bg-purple-500" },
};

const LOAD_STATUS: Record<string, { label: string; color: string }> = {
  assigned:          { label: "Assigned",          color: "text-yellow-500" },
  en_route_pickup:   { label: "En Route Pickup",   color: "text-blue-500" },
  at_pickup:         { label: "At Pickup",          color: "text-cyan-500" },
  loading:           { label: "Loading",            color: "text-orange-500" },
  in_transit:        { label: "In Transit",         color: "text-emerald-500" },
  en_route_delivery: { label: "En Route Delivery",  color: "text-blue-500" },
  at_delivery:       { label: "At Delivery",        color: "text-cyan-500" },
  unloading:         { label: "Unloading",          color: "text-orange-500" },
  delivered:         { label: "Delivered",           color: "text-emerald-500" },
  temp_excursion:    { label: "Temp Excursion",     color: "text-red-500" },
  reefer_breakdown:  { label: "Reefer Breakdown",   color: "text-red-500" },
  contamination_reject: { label: "Contamination",   color: "text-red-500" },
  seal_breach:       { label: "Seal Breach",         color: "text-red-500" },
  weight_violation:  { label: "Weight Violation",    color: "text-red-500" },
};

export default function DriverDashboard() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, navigate] = useLocation();

  const dashQuery = (trpc as any).drivers.getDriverDashboard.useQuery(undefined, { refetchInterval: 60000 });
  const d = dashQuery.data;
  const isLoading = dashQuery.isLoading;

  const hosStatus = STATUS_MAP[d?.hos?.status || "off_duty"] || STATUS_MAP.off_duty;

  // Card style helper
  const card = cn("rounded-2xl border backdrop-blur-sm", isLight ? "bg-white/80 border-slate-200/60 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");
  const subcard = cn("rounded-xl p-3", isLight ? "bg-slate-50/80" : "bg-white/[0.03]");
  const label = cn("text-[11px] font-medium tracking-wide uppercase", isLight ? "text-slate-500" : "text-slate-500");
  const heading = cn("font-semibold", isLight ? "text-slate-900" : "text-white");
  const muted = cn("text-sm", isLight ? "text-slate-500" : "text-slate-400");

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            {d?.driver?.name ? `Welcome back, ${d.driver.name.split(" ")[0]}` : "Driver Dashboard"}
          </h1>
          <p className={muted}>Your daily overview</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse", hosStatus.bg)} />
          <span className={cn("text-sm font-medium", hosStatus.color)}>{hosStatus.label}</span>
        </div>
      </div>

      {/* ── Carrier Connection ── */}
      {isLoading ? <Skeleton className="h-20 w-full rounded-2xl" /> : d?.carrier ? (
        <div className={cn(card, "p-4")}>
          <div className="flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", isLight ? "bg-gradient-to-br from-blue-50 to-purple-50" : "bg-gradient-to-br from-blue-500/10 to-purple-500/10")}>
              {d.carrier.logo ? (
                <img src={d.carrier.logo} alt="" className="w-8 h-8 rounded-lg object-contain" />
              ) : (
                <Building2 className={cn("w-6 h-6", isLight ? "text-blue-600" : "text-blue-400")} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("font-semibold truncate", heading)}>{d.carrier.name}</p>
              <div className="flex items-center gap-3 flex-wrap">
                {d.carrier.dotNumber && <span className={cn("text-xs", muted)}>DOT {d.carrier.dotNumber}</span>}
                {d.carrier.mcNumber && <span className={cn("text-xs", muted)}>MC {d.carrier.mcNumber}</span>}
                {d.carrier.city && d.carrier.state && <span className={cn("text-xs", muted)}>{d.carrier.city}, {d.carrier.state}</span>}
              </div>
            </div>
            <Badge className={cn("shrink-0 border-0 text-[10px] font-bold", isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/15 text-emerald-400")}>
              <Shield className="w-3 h-3 mr-1" />Active
            </Badge>
          </div>
        </div>
      ) : null}

      {/* ── HOS Compliance ── */}
      {isLoading ? <Skeleton className="h-32 w-full rounded-2xl" /> : (
        <div className={cn(card, "p-5")} onClick={() => navigate("/driver/hos")} role="button">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Clock className={cn("w-4.5 h-4.5", isLight ? "text-slate-700" : "text-slate-300")} />
              <span className={cn("text-sm font-semibold", heading)}>Hours of Service</span>
            </div>
            <div className="flex items-center gap-2">
              {d?.hos?.violations?.length > 0 && (
                <Badge className="bg-red-500/15 text-red-500 border-0 text-[10px]">
                  <AlertTriangle className="w-3 h-3 mr-1" />{d.hos.violations.length} Violation{d.hos.violations.length > 1 ? "s" : ""}
                </Badge>
              )}
              <ChevronRight className={cn("w-4 h-4", isLight ? "text-slate-400" : "text-slate-600")} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className={subcard}>
              <p className={label}>Driving</p>
              <p className={cn("text-lg font-bold mt-0.5", d?.hos?.canDrive ? (isLight ? "text-emerald-600" : "text-emerald-400") : "text-red-500")}>{d?.hos?.drivingRemaining || "11h 00m"}</p>
              <p className={cn("text-[10px] mt-0.5", isLight ? "text-slate-400" : "text-slate-600")}>of 11h limit</p>
            </div>
            <div className={subcard}>
              <p className={label}>On-Duty</p>
              <p className={cn("text-lg font-bold mt-0.5", isLight ? "text-blue-600" : "text-blue-400")}>{d?.hos?.onDutyRemaining || "14h 00m"}</p>
              <p className={cn("text-[10px] mt-0.5", isLight ? "text-slate-400" : "text-slate-600")}>of 14h window</p>
            </div>
            <div className={subcard}>
              <p className={label}>70h Cycle</p>
              <p className={cn("text-lg font-bold mt-0.5", isLight ? "text-purple-600" : "text-purple-400")}>{d?.hos?.cycleRemaining || "70h 00m"}</p>
              <p className={cn("text-[10px] mt-0.5", isLight ? "text-slate-400" : "text-slate-600")}>8-day rolling</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Current Load ── */}
      {isLoading ? <Skeleton className="h-44 w-full rounded-2xl" /> : d?.currentLoad ? (
        <div className={cn(card, "overflow-hidden")}>
          <div className={cn("px-5 py-3 flex items-center justify-between", isLight ? "bg-gradient-to-r from-blue-50 to-purple-50 border-b border-slate-200/60" : "bg-gradient-to-r from-blue-500/[0.06] to-purple-500/[0.06] border-b border-white/[0.04]")}>
            <div className="flex items-center gap-2">
              <Package className={cn("w-4 h-4", isLight ? "text-blue-600" : "text-blue-400")} />
              <span className={cn("font-semibold text-sm", heading)}>{d.currentLoad.loadNumber}</span>
            </div>
            <Badge className={cn("border-0 text-[10px] font-bold", isLight ? "bg-white/80 shadow-sm" : "bg-white/[0.06]", LOAD_STATUS[d.currentLoad.status]?.color || "text-slate-400")}>
              {LOAD_STATUS[d.currentLoad.status]?.label || d.currentLoad.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <div className="p-5 space-y-4">
            {d.currentLoad.hazmatClass && (
              <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium", isLight ? "bg-orange-50 text-orange-700 border border-orange-200/60" : "bg-orange-500/10 text-orange-400 border border-orange-500/20")}>
                <AlertTriangle className="w-3.5 h-3.5" />
                Hazmat Class {d.currentLoad.hazmatClass} — {d.currentLoad.commodity}
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 pt-1">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <div className={cn("w-px h-8", isLight ? "bg-slate-200" : "bg-white/10")} />
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>Pickup</p>
                  <p className={cn("text-sm font-medium", heading)}>{d.currentLoad.origin.name}</p>
                  <p className={cn("text-xs", muted)}>{d.currentLoad.origin.city}, {d.currentLoad.origin.state}</p>
                </div>
                <div>
                  <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>Delivery</p>
                  <p className={cn("text-sm font-medium", heading)}>{d.currentLoad.destination.name}</p>
                  <p className={cn("text-xs", muted)}>{d.currentLoad.destination.city}, {d.currentLoad.destination.state}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${d.currentLoad.rate.toLocaleString()}</p>
                <p className={cn("text-xs", muted)}>{d.currentLoad.miles.toLocaleString()} mi</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button onClick={() => navigate("/navigation")} className="flex-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 text-white rounded-xl h-10 text-sm font-semibold">
                <Navigation className="w-4 h-4 mr-1.5" />Navigate
              </Button>
              <Button variant="outline" onClick={() => navigate(`/jobs/current`)} className={cn("flex-1 rounded-xl h-10 text-sm font-semibold", isLight ? "border-slate-200 hover:bg-slate-50" : "border-white/10 hover:bg-white/[0.04]")}>
                <FileText className="w-4 h-4 mr-1.5" />Details
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className={cn(card, "p-8 text-center")}>
          <div className={cn("w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-white/[0.04]")}>
            <Truck className={cn("w-7 h-7", isLight ? "text-slate-400" : "text-slate-500")} />
          </div>
          <p className={cn("font-semibold mb-1", heading)}>No Active Assignment</p>
          <p className={cn("text-sm mb-4", muted)}>Check the load board for available freight</p>
          <Button onClick={() => navigate("/marketplace")} className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 text-white rounded-xl h-10 text-sm font-semibold px-6">
            <Package className="w-4 h-4 mr-1.5" />Browse Loads
          </Button>
        </div>
      )}

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: DollarSign, label: "This Week", value: `$${(d?.stats?.weeklyEarnings || 0).toLocaleString()}`, color: "text-emerald-500", bg: isLight ? "bg-emerald-50" : "bg-emerald-500/10" },
          { icon: MapPin, label: "Miles", value: (d?.stats?.weeklyMiles || 0).toLocaleString(), color: "text-purple-500", bg: isLight ? "bg-purple-50" : "bg-purple-500/10" },
          { icon: Package, label: "Loads", value: String(d?.stats?.weeklyLoads || 0), color: "text-blue-500", bg: isLight ? "bg-blue-50" : "bg-blue-500/10" },
          { icon: Shield, label: "Safety", value: String(d?.stats?.safetyScore || 100), color: "text-amber-500", bg: isLight ? "bg-amber-50" : "bg-amber-500/10" },
        ].map((s, i) => (
          <div key={i} className={cn(card, "p-4")}>
            {isLoading ? <Skeleton className="h-14 w-full" /> : (
              <>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", s.bg)}>
                  <s.icon className={cn("w-4 h-4", s.color)} />
                </div>
                <p className={cn("text-xl font-bold", heading)}>{s.value}</p>
                <p className={label}>{s.label}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: ClipboardCheck, label: "Pre-Trip", path: "/inspection/pre-trip", color: "text-emerald-500", bg: isLight ? "bg-emerald-50" : "bg-emerald-500/10" },
          { icon: FileText, label: "DVIR", path: "/inspection/dvir", color: "text-blue-500", bg: isLight ? "bg-blue-50" : "bg-blue-500/10" },
          { icon: Fuel, label: "Fuel Stop", path: "/fuel", color: "text-amber-500", bg: isLight ? "bg-amber-50" : "bg-amber-500/10" },
          { icon: Gauge, label: "Scorecard", path: "/driver-scorecard", color: "text-purple-500", bg: isLight ? "bg-purple-50" : "bg-purple-500/10" },
        ].map((a, i) => (
          <button key={i} onClick={() => navigate(a.path)} className={cn(card, "p-4 flex flex-col items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center")}>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", a.bg)}>
              <a.icon className={cn("w-5 h-5", a.color)} />
            </div>
            <span className={cn("text-xs font-semibold", heading)}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* ── Vehicle & Driver Info ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Vehicle */}
        <div className={cn(card, "p-4")} onClick={() => navigate("/vehicle")} role="button">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Truck className={cn("w-4 h-4", isLight ? "text-slate-600" : "text-slate-400")} />
              <span className={cn("text-sm font-semibold", heading)}>Assigned Vehicle</span>
            </div>
            <ChevronRight className={cn("w-4 h-4", isLight ? "text-slate-400" : "text-slate-600")} />
          </div>
          {isLoading ? <Skeleton className="h-12 w-full" /> : d?.vehicle?.id ? (
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", isLight ? "bg-cyan-50" : "bg-cyan-500/10")}>
                <Truck className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <p className={cn("font-medium text-sm", heading)}>{d.vehicle.make} {d.vehicle.model} {d.vehicle.year || ""}</p>
                <p className={cn("text-xs", muted)}>Unit {d.vehicle.unitNumber || "—"} {d.vehicle.equipmentType ? `• ${d.vehicle.equipmentType}` : ""}</p>
              </div>
            </div>
          ) : (
            <p className={cn("text-sm", muted)}>No vehicle assigned</p>
          )}
        </div>

        {/* Driver Credentials */}
        <div className={cn(card, "p-4")} onClick={() => navigate("/documents")} role="button">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <IdCard className={cn("w-4 h-4", isLight ? "text-slate-600" : "text-slate-400")} />
              <span className={cn("text-sm font-semibold", heading)}>Credentials</span>
            </div>
            <ChevronRight className={cn("w-4 h-4", isLight ? "text-slate-400" : "text-slate-600")} />
          </div>
          {isLoading ? <Skeleton className="h-12 w-full" /> : (
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", isLight ? "bg-indigo-50" : "bg-indigo-500/10")}>
                <IdCard className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p className={cn("font-medium text-sm", heading)}>CDL {d?.driver?.cdlNumber || "—"}</p>
                <div className="flex items-center gap-2">
                  {d?.driver?.hazmatEndorsement && (
                    <Badge className={cn("border-0 text-[10px]", isLight ? "bg-orange-100 text-orange-700" : "bg-orange-500/15 text-orange-400")}>H Endorsement</Badge>
                  )}
                  <span className={cn("text-xs", muted)}>Class A</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Loads ── */}
      {d?.recentLoads && d.recentLoads.length > 0 && (
        <div className={cn(card, "overflow-hidden")}>
          <div className={cn("px-5 py-3 flex items-center justify-between", isLight ? "border-b border-slate-100" : "border-b border-white/[0.04]")}>
            <div className="flex items-center gap-2">
              <Activity className={cn("w-4 h-4", isLight ? "text-slate-600" : "text-slate-400")} />
              <span className={cn("text-sm font-semibold", heading)}>Recent Activity</span>
            </div>
            <button onClick={() => navigate("/loads/history")} className={cn("text-xs font-medium", isLight ? "text-blue-600" : "text-blue-400")}>View All</button>
          </div>
          <div className="divide-y" style={{ borderColor: isLight ? "#f1f5f9" : "rgba(255,255,255,0.04)" }}>
            {d.recentLoads.map((load: any) => (
              <div key={load.id} className={cn("px-5 py-3 flex items-center justify-between transition-colors", isLight ? "hover:bg-slate-50/60" : "hover:bg-white/[0.02]")} onClick={() => navigate(`/load/${load.id}`)} role="button">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", load.status === "delivered" ? (isLight ? "bg-emerald-50" : "bg-emerald-500/10") : (isLight ? "bg-blue-50" : "bg-blue-500/10"))}>
                    {load.status === "delivered" ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Package className="w-4 h-4 text-blue-500" />}
                  </div>
                  <div className="min-w-0">
                    <p className={cn("text-sm font-medium truncate", heading)}>{load.loadNumber}</p>
                    <p className={cn("text-xs truncate", muted)}>{load.origin} → {load.destination}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className={cn("text-sm font-semibold", heading)}>${load.rate.toLocaleString()}</p>
                  <p className={cn("text-[10px]", LOAD_STATUS[load.status]?.color || muted)}>{LOAD_STATUS[load.status]?.label || load.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
