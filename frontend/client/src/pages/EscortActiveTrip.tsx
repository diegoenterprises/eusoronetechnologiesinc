/**
 * ESCORT ACTIVE TRIP PAGE
 * Live operational view for the escort's current assignment.
 * 
 * Sections:
 * 1. Trip Header — Load number, status, position badge
 * 2. SOS Emergency Button — One-tap emergency broadcast (shared with catalyst)
 * 3. Status Control Bar — State machine progression
 * 4. Cargo Exception / Active SOS Banners
 * 5. HOS Compact Gauges — Drive/Duty/Cycle with duty status controls
 * 6. Route + Load Details + Convoy Status
 * 7. Contact Cards (Driver, Shipper)
 * 8. Quick Actions grid
 * 
 * 100% Dynamic — powered by escorts.getActiveTrip + escorts.updateTripStatus
 */

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Car, MapPin, Phone, Mail, Navigation, Shield,
  Clock, CheckCircle, AlertTriangle, Truck,
  ChevronRight, RefreshCw, Package,
  Users, ArrowRight, Siren, Heart, Wrench,
  Flame, CloudLightning, HelpCircle, X, Loader2,
  CheckCircle2, Gauge, Moon, Play, Pause,
  Coffee, Thermometer, Snowflake, FlaskConical,
  ShieldAlert, Scale, FileText, Globe,
  Radar, Radio, AlertOctagon, ArrowUpFromLine, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════════════
// SOS BUTTON — Same emergency types as catalyst active trip
// ═══════════════════════════════════════════════════════════════

const SOS_TYPES = [
  { type: "medical" as const, icon: Heart, label: "Medical", color: "#FF3B30", desc: "Medical emergency" },
  { type: "accident" as const, icon: Car, label: "Accident", color: "#FF9500", desc: "Vehicle collision" },
  { type: "mechanical" as const, icon: Wrench, label: "Breakdown", color: "#FFCC00", desc: "Mechanical failure" },
  { type: "hazmat_spill" as const, icon: Flame, label: "Hazmat Spill", color: "#FF2D55", desc: "Chemical spill/leak" },
  { type: "threat" as const, icon: AlertTriangle, label: "Threat", color: "#AF52DE", desc: "Security threat" },
  { type: "weather" as const, icon: CloudLightning, label: "Weather", color: "#5AC8FA", desc: "Severe weather" },
  { type: "other" as const, icon: HelpCircle, label: "Other", color: "#8E8E93", desc: "Other emergency" },
];

function SOSButton({ loadId, onAlert }: { loadId: number; onAlert?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const createSOS = (trpc as any).interstate?.createSOS?.useMutation?.({
    onSuccess: () => { setSent(true); setSending(false); onAlert?.(); setTimeout(() => { setSent(false); setExpanded(false); setConfirming(null); }, 3000); },
    onError: () => setSending(false),
  }) || { mutate: () => {}, isPending: false };

  const handleSend = useCallback((type: string) => {
    if (sending) return;
    setSending(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => createSOS.mutate({ loadId, alertType: type as any, severity: type === "medical" || type === "hazmat_spill" || type === "accident" ? "critical" : "high", latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => createSOS.mutate({ loadId, alertType: type as any, severity: "high", latitude: 0, longitude: 0 }),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      createSOS.mutate({ loadId, alertType: type as any, severity: "high", latitude: 0, longitude: 0 });
    }
  }, [loadId, sending, createSOS]);

  if (sent) {
    return (
      <div className="rounded-2xl bg-green-500/20 border-2 border-green-500 p-6 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-2" />
        <p className="text-green-300 font-semibold text-lg">SOS Broadcast Sent</p>
        <p className="text-green-400/70 text-sm">All parties have been notified</p>
      </div>
    );
  }

  if (!expanded) {
    return (
      <button onClick={() => setExpanded(true)} className="w-full rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 transition-all duration-200 p-5 flex items-center justify-center gap-3 shadow-lg shadow-red-900/40" style={{ minHeight: 72 }}>
        <Siren className="w-7 h-7 text-white" />
        <span className="text-white font-bold text-xl tracking-wide">SOS EMERGENCY</span>
      </button>
    );
  }

  return (
    <div className="rounded-2xl bg-zinc-900/90 border border-red-500/40 p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2"><Siren className="w-5 h-5 text-red-400" /><span className="text-red-300 font-semibold">Select Emergency Type</span></div>
        <button onClick={() => { setExpanded(false); setConfirming(null); }} className="p-1 rounded-lg hover:bg-zinc-800"><X className="w-5 h-5 text-zinc-500" /></button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {SOS_TYPES.map((s) => {
          const Icon = s.icon;
          const isConfirming = confirming === s.type;
          if (isConfirming) {
            return (
              <button key={s.type} onClick={() => handleSend(s.type)} disabled={sending} className="col-span-2 rounded-xl p-4 text-center transition-all" style={{ backgroundColor: s.color + "30", borderColor: s.color, borderWidth: 2 }}>
                {sending ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-white" /> : <><p className="text-white font-bold text-lg">CONFIRM: {s.label}</p><p className="text-zinc-300 text-xs mt-1">Tap to broadcast to all parties</p></>}
              </button>
            );
          }
          return (
            <button key={s.type} onClick={() => setConfirming(s.type)} className="rounded-xl p-3 flex items-center gap-2 hover:opacity-80 active:scale-95 transition-all" style={{ backgroundColor: s.color + "18", border: `1px solid ${s.color}40` }}>
              <Icon className="w-5 h-5 flex-shrink-0" style={{ color: s.color }} />
              <div className="text-left"><p className="text-white text-sm font-medium">{s.label}</p><p className="text-zinc-400 text-xs">{s.desc}</p></div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ACTIVE SOS BANNER
// ═══════════════════════════════════════════════════════════════

function ActiveSOSBanner({ loadId }: { loadId: number }) {
  const { data: alerts } = (trpc as any).interstate?.getSOSForLoad?.useQuery?.({ loadId }, { refetchInterval: 5000 }) || { data: null };
  const activeAlerts = alerts?.filter((a: any) => a.status === "active" || a.status === "acknowledged") || [];
  if (activeAlerts.length === 0) return null;
  return (
    <div className="rounded-2xl bg-red-500/15 border-2 border-red-500/40 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <Siren className="w-6 h-6 text-red-400" />
        <div><p className="text-red-300 font-bold">Active SOS Alert</p><p className="text-red-400/70 text-xs">{activeAlerts[0].alertType.replace(/_/g, " ").toUpperCase()} - {activeAlerts[0].status}</p></div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CARGO EXCEPTION BANNER
// ═══════════════════════════════════════════════════════════════

const CARGO_EXCEPTION_META: Record<string, { icon: React.ElementType; label: string; desc: string }> = {
  temp_excursion: { icon: Thermometer, label: "Temperature Excursion", desc: "Reefer temperature outside acceptable range." },
  reefer_breakdown: { icon: Snowflake, label: "Reefer Breakdown", desc: "Refrigeration unit failure. Emergency transfer may be needed." },
  contamination_reject: { icon: FlaskConical, label: "Contamination Reject", desc: "Product rejected — contamination detected." },
  seal_breach: { icon: ShieldAlert, label: "Seal Breach", desc: "Seal broken or tampered. Full cargo inspection required." },
  weight_violation: { icon: Scale, label: "Weight Violation", desc: "Load exceeds legal weight limits." },
};

function CargoExceptionBanner({ status }: { status: string }) {
  const meta = CARGO_EXCEPTION_META[status];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <div className="rounded-2xl bg-red-500/15 border-2 border-red-500/40 p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-red-500/20 flex-shrink-0"><Icon className="w-6 h-6 text-red-400" /></div>
        <div>
          <p className="text-red-300 font-bold">{meta.label}</p>
          <p className="text-red-400/80 text-xs mt-0.5 leading-relaxed">{meta.desc}</p>
          <p className="text-red-500/60 text-[10px] mt-1.5">Convoy may be paused until exception is resolved.</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOS COMPACT PANEL — Drive/Duty/Cycle gauges + duty controls
// ═══════════════════════════════════════════════════════════════

const DUTY_BUTTONS = [
  { status: "off_duty" as const, label: "Off Duty", icon: Pause, active: "bg-zinc-500/30 border-zinc-500 text-zinc-200", text: "text-zinc-300" },
  { status: "sleeper" as const, label: "Sleeper", icon: Moon, active: "bg-purple-500/30 border-purple-400 text-purple-200", text: "text-purple-300" },
  { status: "on_duty" as const, label: "On Duty", icon: Play, active: "bg-blue-500/30 border-blue-400 text-blue-200", text: "text-blue-300" },
  { status: "driving" as const, label: "Driving", icon: Truck, active: "bg-emerald-500/30 border-emerald-400 text-emerald-200", text: "text-emerald-300" },
];

function HOSCompactPanel() {
  const { data: hos, refetch: refetchHOS } = (trpc as any).drivers?.getMyHOSStatus?.useQuery?.(undefined, { refetchInterval: 30000 }) || { data: null, refetch: () => {} };
  const changeStatusMut = (trpc as any).hos?.changeStatus?.useMutation?.({
    onSuccess: (data: any) => { refetchHOS(); toast.success(`Duty status: ${(data?.newStatus || "").replace(/_/g, " ").toUpperCase()}`); },
    onError: (err: any) => toast.error("Status change failed", { description: err?.message }),
  });

  const handleDutyChange = useCallback((newStatus: string) => {
    if (!changeStatusMut?.mutate) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => changeStatusMut.mutate({ newStatus, location: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` }),
        () => changeStatusMut.mutate({ newStatus, location: "Unknown" }),
        { enableHighAccuracy: false, timeout: 3000 }
      );
    } else { changeStatusMut.mutate({ newStatus, location: "Unknown" }); }
  }, [changeStatusMut]);

  if (!hos) return null;

  const gauges = [
    { label: "Drive", used: hos.drivingUsed || hos.drivingHours || 0, max: 11, color: "#10b981" },
    { label: "Duty", used: hos.onDutyUsed || hos.onDutyHours || 0, max: 14, color: "#3b82f6" },
    { label: "Cycle", used: hos.cycleUsed || hos.cycleHours || 0, max: 70, color: "#8b5cf6" },
  ];
  const currentStatus = hos.status || "off_duty";

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Gauge className="w-4 h-4 text-zinc-400" />
          <span className="text-zinc-300 font-medium text-sm">HOS Status</span>
          <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium ${
            currentStatus === "driving" ? "bg-emerald-500/20 text-emerald-300" :
            currentStatus === "on_duty" ? "bg-blue-500/20 text-blue-300" :
            currentStatus === "sleeper" ? "bg-purple-500/20 text-purple-300" :
            "bg-zinc-700/50 text-zinc-400"
          }`}>{currentStatus.replace(/_/g, " ").toUpperCase()}</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {DUTY_BUTTONS.map((btn) => {
            const Icon = btn.icon;
            const isActive = currentStatus === btn.status;
            return (
              <button key={btn.status} onClick={() => !isActive && handleDutyChange(btn.status)} disabled={isActive || changeStatusMut?.isPending}
                className={`rounded-xl py-2 px-1 flex flex-col items-center gap-1 transition-all text-center border ${isActive ? btn.active + " border" : "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/60"}`}>
                <Icon className={`w-4 h-4 ${isActive ? btn.text : "text-zinc-500"}`} />
                <span className={`text-[9px] font-medium leading-tight ${isActive ? btn.text : "text-zinc-500"}`}>{btn.label}</span>
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {gauges.map((g) => {
            const pct = Math.min(100, (g.used / g.max) * 100);
            const remaining = Math.max(0, g.max - g.used);
            const isLow = remaining <= (g.max * 0.15);
            return (
              <div key={g.label} className="text-center">
                <div className="relative w-14 h-14 mx-auto">
                  <svg viewBox="0 0 44 44" className="w-14 h-14 -rotate-90">
                    <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                    <circle cx="22" cy="22" r="19" fill="none" stroke={isLow ? "#ef4444" : g.color} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(pct / 100) * 119.4} ${119.4 - (pct / 100) * 119.4}`} opacity={0.8} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-[11px] font-bold tabular-nums ${isLow ? "text-red-400" : "text-white"}`}>{remaining.toFixed(remaining < 10 ? 1 : 0)}</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">{g.label}</p>
                <p className="text-[9px] text-zinc-600">{g.used.toFixed(1)}h/{g.max}h</p>
              </div>
            );
          })}
        </div>
        {hos.breakRequired && (
          <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Coffee className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div className="flex-1"><p className="text-amber-300 text-xs font-medium">30-min break required</p></div>
            <button onClick={() => handleDutyChange("off_duty")} className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-medium hover:bg-amber-500/30 transition-colors">Take Break</button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// CONVOY PROXIMITY GEOFENCE — Moving geofence around primary vehicle
// Escort must stay within threshold distance at all times
// ═══════════════════════════════════════════════════════════════

function ConvoyProximityPanel() {
  const { data: proximity } = (trpc as any).escorts.getConvoyProximity.useQuery(undefined, { refetchInterval: 5000 });

  if (!proximity) return null;

  const dist = proximity.distanceMeters;
  const max = proximity.maxDistanceMeters || 1200;
  const warn = proximity.warningThresholdMeters || Math.round(max * 0.8);
  const pct = dist !== null ? Math.min(100, (dist / max) * 100) : 0;
  const status = proximity.status as string;

  const statusColors = {
    ok: { ring: "#10b981", bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", label: "IN RANGE" },
    warning: { ring: "#f59e0b", bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", label: "DRIFTING" },
    critical: { ring: "#ef4444", bg: "bg-red-500/10", border: "border-red-500/40", text: "text-red-400", label: "OUT OF RANGE" },
    unknown: { ring: "#6b7280", bg: "bg-slate-800/50", border: "border-slate-700/50", text: "text-slate-400", label: "NO SIGNAL" },
  };
  const cfg = statusColors[status as keyof typeof statusColors] || statusColors.unknown;

  const distDisplay = dist !== null
    ? dist < 1000 ? `${dist}m` : `${(dist / 1609.34).toFixed(1)} mi`
    : "—";
  const maxDisplay = max < 1000 ? `${max}m` : `${(max / 1609.34).toFixed(1)} mi`;

  return (
    <Card className={cn("rounded-xl border", cfg.bg, cfg.border, status === "critical" && "animate-pulse")}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Radar className={cn("w-5 h-5", cfg.text)} />
          <span className="text-white font-semibold text-sm">Convoy Proximity</span>
          <Badge className={cn("ml-auto border-0 text-[10px] font-bold", cfg.bg, cfg.text)}>{cfg.label}</Badge>
        </div>

        {/* Proximity gauge */}
        <div className="relative h-4 rounded-full bg-slate-700/50 overflow-hidden mb-3">
          {/* Warning threshold marker */}
          <div className="absolute top-0 h-full border-r-2 border-dashed border-amber-500/60 z-10" style={{ left: `${(warn / max) * 100}%` }} />
          {/* Max limit marker */}
          <div className="absolute top-0 right-0 h-full w-0.5 bg-red-500/80 z-10" />
          {/* Current distance fill */}
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.min(100, pct)}%`,
              background: status === "ok" ? "linear-gradient(90deg, #10b981, #059669)"
                : status === "warning" ? "linear-gradient(90deg, #f59e0b, #d97706)"
                : status === "critical" ? "linear-gradient(90deg, #ef4444, #dc2626)"
                : "linear-gradient(90deg, #6b7280, #4b5563)",
            }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">0m</span>
          <span className={cn("font-bold text-lg tabular-nums", cfg.text)}>{distDisplay}</span>
          <span className="text-slate-500">{maxDisplay}</span>
        </div>

        {/* Position & speed info */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-700/50">
          <div className="text-center">
            <p className="text-[10px] text-slate-500">Position</p>
            <p className="text-white text-xs font-medium capitalize">{proximity.position === "lead" ? "Lead Escort" : "Rear Escort"}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500">Convoy Speed</p>
            <p className="text-white text-xs font-medium">{proximity.escortLocation?.speed?.toFixed(0) || 0} mph</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500">Max Speed</p>
            <p className="text-white text-xs font-medium">{proximity.convoyMaxSpeed} mph</p>
          </div>
        </div>

        {/* Critical separation alert */}
        {status === "critical" && (
          <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-red-500/15 border border-red-500/30">
            <AlertOctagon className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-300 text-xs font-bold">SEPARATION ALERT</p>
              <p className="text-red-400/80 text-[10px] mt-0.5">You have exceeded the maximum distance from the convoy. Reduce distance immediately or contact dispatch.</p>
            </div>
          </div>
        )}

        {status === "warning" && (
          <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Radio className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-amber-300 text-[10px] font-medium">Approaching maximum separation distance. Maintain position.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// ROUTE RESTRICTION WARNINGS — Heavy haul / oversize / hazmat
// ═══════════════════════════════════════════════════════════════

const RESTRICTION_ICON_MAP: Record<string, React.ElementType> = {
  AlertOctagon, Scale, Flame, Moon, Clock, ArrowUpFromLine, Calendar,
};

function RouteRestrictionWarnings() {
  const { data: restrictions } = (trpc as any).escorts.getRouteRestrictions.useQuery(undefined, { refetchInterval: 60000 });

  if (!restrictions || restrictions.restrictions.length === 0) return null;

  const severityConfig = {
    critical: { bg: "bg-red-500/10", border: "border-red-500/30", title: "text-red-300", desc: "text-red-400/80", badge: "bg-red-500/20 text-red-400" },
    warning: { bg: "bg-amber-500/10", border: "border-amber-500/30", title: "text-amber-300", desc: "text-amber-400/80", badge: "bg-amber-500/20 text-amber-400" },
    info: { bg: "bg-blue-500/10", border: "border-blue-500/30", title: "text-blue-300", desc: "text-blue-400/80", badge: "bg-blue-500/20 text-blue-400" },
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          Route Restrictions
          {restrictions.isSuperload && <Badge className="border-0 bg-red-500/20 text-red-400 text-[10px] font-bold ml-2">SUPERLOAD</Badge>}
          {restrictions.isOversize && !restrictions.isSuperload && <Badge className="border-0 bg-amber-500/20 text-amber-400 text-[10px] font-bold ml-2">OVERSIZE</Badge>}
          {restrictions.isHazmat && <Badge className="border-0 bg-purple-500/20 text-purple-400 text-[10px] font-bold ml-2">HAZMAT</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {restrictions.restrictions.map((r: any, i: number) => {
          const cfg = severityConfig[r.severity as keyof typeof severityConfig] || severityConfig.info;
          const Icon = RESTRICTION_ICON_MAP[r.icon] || AlertTriangle;
          return (
            <div key={i} className={cn("rounded-xl p-3 border", cfg.bg, cfg.border)}>
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-slate-700/30 flex-shrink-0 mt-0.5"><Icon className={cn("w-4 h-4", cfg.title)} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn("font-semibold text-sm", cfg.title)}>{r.title}</p>
                    <Badge className={cn("border-0 text-[9px]", cfg.badge)}>{r.severity.toUpperCase()}</Badge>
                  </div>
                  <p className={cn("text-xs mt-0.5 leading-relaxed", cfg.desc)}>{r.description}</p>
                </div>
              </div>
            </div>
          );
        })}
        {restrictions.specialInstructions && (
          <div className="mt-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-xs text-yellow-400 font-medium mb-1">Special Instructions</p>
            <p className="text-yellow-200 text-sm">{restrictions.specialInstructions}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// STATUS CONFIG + TRANSITIONS
// ═══════════════════════════════════════════════════════════════

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  accepted: { label: "Accepted", color: "text-blue-400", bgColor: "bg-blue-500/20", icon: CheckCircle },
  en_route: { label: "En Route to Pickup", color: "text-yellow-400", bgColor: "bg-yellow-500/20", icon: Navigation },
  on_site: { label: "On Site", color: "text-orange-400", bgColor: "bg-orange-500/20", icon: MapPin },
  escorting: { label: "Escorting", color: "text-green-400", bgColor: "bg-green-500/20", icon: Car },
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  accepted: ["en_route"],
  en_route: ["on_site"],
  on_site: ["escorting"],
  escorting: ["completed"],
};

const NEXT_LABEL: Record<string, string> = {
  en_route: "En Route to Pickup",
  on_site: "Arrived On Site",
  escorting: "Start Escorting",
  completed: "Complete Trip",
};

export default function EscortActiveTrip() {
  const utils = (trpc as any).useUtils();
  const tripQuery = (trpc as any).escorts.getActiveTrip.useQuery(undefined, { refetchInterval: 15000 });
  const updateStatus = (trpc as any).escorts.updateTripStatus.useMutation({
    onSuccess: () => utils.escorts.getActiveTrip.invalidate(),
  });

  const [confirmComplete, setConfirmComplete] = useState(false);
  const trip = tripQuery.data;

  const handleStatusUpdate = (newStatus: string) => {
    if (newStatus === "completed" && !confirmComplete) { setConfirmComplete(true); return; }
    setConfirmComplete(false);
    updateStatus.mutate({ assignmentId: trip.assignmentId, status: newStatus });
  };

  if (tripQuery.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4"><Skeleton className="h-48 w-full rounded-xl" /><Skeleton className="h-32 w-full rounded-xl" /></div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="p-6 rounded-full bg-slate-800/50 mb-6"><Car className="w-12 h-12 text-slate-500" /></div>
          <h2 className="text-2xl font-bold text-white mb-2">No Active Trip</h2>
          <p className="text-slate-400 text-center max-w-md mb-6">You don't have an active escort assignment right now. Check the marketplace for available jobs.</p>
          <div className="flex gap-3">
            <Button onClick={() => window.location.href = "/escort/marketplace"} className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg"><MapPin className="w-4 h-4 mr-2" />Find Jobs</Button>
            <Button onClick={() => window.location.href = "/"} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg"><Clock className="w-4 h-4 mr-2" />Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[trip.assignmentStatus] || STATUS_CONFIG.accepted;
  const StatusIcon = statusCfg.icon;
  const nextStatuses = STATUS_TRANSITIONS[trip.assignmentStatus] || [];
  const load = trip.load;
  const convoy = trip.convoy;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Active Trip</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-400 text-sm">Load #{load?.loadNumber}</p>
            <Badge className={cn("border-0", statusCfg.bgColor, statusCfg.color)}><StatusIcon className="w-3 h-3 mr-1" />{statusCfg.label}</Badge>
            <Badge className={cn("border-0", trip.position === "lead" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400")}>{trip.position?.toUpperCase()}</Badge>
          </div>
        </div>
        <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg" onClick={() => tripQuery.refetch()} disabled={tripQuery.isFetching}>
          <RefreshCw className={cn("w-4 h-4 mr-1", tripQuery.isFetching && "animate-spin")} />Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Trip Details */}
        <div className="lg:col-span-2 space-y-4">

          {/* Status Control Bar */}
          <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30 rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-3 rounded-full", statusCfg.bgColor)}><StatusIcon className={cn("w-6 h-6", statusCfg.color)} /></div>
                  <div>
                    <p className="text-white font-bold text-lg">{statusCfg.label}</p>
                    {trip.startedAt && <p className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />Started {new Date(trip.startedAt).toLocaleTimeString()}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {confirmComplete ? (
                    <>
                      <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-lg" onClick={() => setConfirmComplete(false)}>Cancel</Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-lg" onClick={() => handleStatusUpdate("completed")} disabled={updateStatus.isPending}><CheckCircle className="w-4 h-4 mr-1" />Confirm Complete</Button>
                    </>
                  ) : (
                    nextStatuses.map((ns: string) => (
                      <Button key={ns} className={cn("rounded-lg", ns === "completed" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700")} onClick={() => handleStatusUpdate(ns)} disabled={updateStatus.isPending}>
                        {ns === "completed" ? <CheckCircle className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}{NEXT_LABEL[ns] || ns}
                      </Button>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cargo Exception Banner */}
          {load?.status && <CargoExceptionBanner status={load.status} />}

          {/* Active SOS Banner */}
          {load?.id && <ActiveSOSBanner loadId={load.id} />}

          {/* SOS Emergency Button */}
          {load?.id && <SOSButton loadId={load.id} onAlert={() => tripQuery.refetch()} />}

          {/* HOS Panel */}
          <HOSCompactPanel />

          {/* Convoy Proximity Geofence — live distance to primary vehicle */}
          <ConvoyProximityPanel />

          {/* Route Restriction Warnings — oversize/hazmat/superload */}
          <RouteRestrictionWarnings />

          {/* Route Card */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Navigation className="w-5 h-5 text-cyan-400" />Route</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-green-400" /><p className="text-white font-medium">{load?.origin?.city}, {load?.origin?.state}</p></div>
                  {load?.origin?.address && <p className="text-xs text-slate-500 ml-5">{load.origin.address}</p>}
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-red-400" /><p className="text-white font-medium">{load?.destination?.city}, {load?.destination?.state}</p></div>
                  {load?.destination?.address && <p className="text-xs text-slate-500 ml-5">{load.destination.address}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700/50">
                <div className="text-center"><p className="text-xs text-slate-500">Distance</p><p className="text-white font-bold">{load?.distance?.toLocaleString() || 0} mi</p></div>
                <div className="text-center"><p className="text-xs text-slate-500">Pickup</p><p className="text-white font-bold text-sm">{load?.pickupDate ? new Date(load.pickupDate).toLocaleDateString() : '—'}</p></div>
                <div className="text-center"><p className="text-xs text-slate-500">Delivery</p><p className="text-white font-bold text-sm">{load?.deliveryDate ? new Date(load.deliveryDate).toLocaleDateString() : '—'}</p></div>
              </div>
            </CardContent>
          </Card>

          {/* Load Details */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Package className="w-5 h-5 text-orange-400" />Load Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Cargo Type</p><p className="text-white font-medium text-sm">{load?.cargoType || '—'}</p></div>
                {load?.hazmatClass && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"><p className="text-xs text-red-400">HazMat Class</p><p className="text-red-300 font-bold">{load.hazmatClass}</p></div>}
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Weight</p><p className="text-white font-medium text-sm">{load?.weight ? `${load.weight.toLocaleString()} lbs` : '—'}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Equipment</p><p className="text-white font-medium text-sm">{load?.equipmentType || '—'}</p></div>
              </div>
              {load?.specialInstructions && (
                <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-xs text-yellow-400 mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Special Instructions</p>
                  <p className="text-yellow-200 text-sm">{load.specialInstructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Convoy Status */}
          {convoy && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-purple-400" />Convoy Status</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Status</p><Badge className={cn("border-0 mt-1", convoy.status === "active" ? "bg-green-500/20 text-green-400" : convoy.status === "forming" ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-500/20 text-slate-400")}>{convoy.status}</Badge></div>
                  <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Max Speed</p><p className="text-white font-bold">{convoy.maxSpeedMph || 45} mph</p></div>
                  <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Lead Distance</p><p className="text-white font-medium">{convoy.currentLeadDistance || convoy.targetLeadDistanceMeters || '—'}m</p></div>
                  <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500">Rear Distance</p><p className="text-white font-medium">{convoy.currentRearDistance || convoy.targetRearDistanceMeters || '—'}m</p></div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => window.location.href = `/loads/${load?.id}`} className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 flex items-center gap-3 hover:bg-slate-700/50 transition-colors">
              <FileText className="w-5 h-5 text-slate-400" /><span className="text-sm text-slate-300 font-medium">Load Details</span>
            </button>
            <button onClick={() => window.location.href = "/tracking"} className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 flex items-center gap-3 hover:bg-slate-700/50 transition-colors">
              <Globe className="w-5 h-5 text-emerald-400" /><span className="text-sm text-slate-300 font-medium">Live Map</span>
            </button>
            <button onClick={() => window.location.href = "/escort/convoys"} className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 flex items-center gap-3 hover:bg-slate-700/50 transition-colors">
              <Shield className="w-5 h-5 text-purple-400" /><span className="text-sm text-slate-300 font-medium">Convoy Panel</span>
            </button>
            <button onClick={() => window.open("tel:911", "_self")} className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 flex items-center gap-3 hover:bg-slate-700/50 transition-colors">
              <Phone className="w-5 h-5 text-red-400" /><span className="text-sm text-slate-300 font-medium">Call 911</span>
            </button>
          </div>
        </div>

        {/* Right Column — Contacts & Pay */}
        <div className="space-y-4">
          {/* Pay Card */}
          <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 rounded-xl">
            <CardContent className="p-5">
              <p className="text-xs text-slate-400 mb-1">Your Pay</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${trip.rate?.toLocaleString() || 0}</p>
              <p className="text-xs text-slate-500 mt-1">{trip.rateType === 'per_mile' ? 'Per Mile' : 'Flat Rate'}</p>
            </CardContent>
          </Card>

          {/* Driver Contact */}
          {trip.driver && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white text-sm flex items-center gap-2"><Truck className="w-4 h-4 text-cyan-400" />Driver</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center"><Users className="w-5 h-5 text-cyan-400" /></div>
                  <div><p className="text-white font-medium">{trip.driver.name}</p><p className="text-xs text-slate-500">Driver</p></div>
                </div>
                <div className="flex gap-2">
                  {trip.driver.phone && <Button size="sm" variant="outline" className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg text-xs" onClick={() => window.open(`tel:${trip.driver.phone}`)}><Phone className="w-3 h-3 mr-1" />Call</Button>}
                  {trip.driver.email && <Button size="sm" variant="outline" className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg text-xs" onClick={() => window.open(`mailto:${trip.driver.email}`)}><Mail className="w-3 h-3 mr-1" />Email</Button>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shipper Contact */}
          {trip.shipper && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white text-sm flex items-center gap-2"><Package className="w-4 h-4 text-orange-400" />Shipper</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center"><Users className="w-5 h-5 text-orange-400" /></div>
                  <div><p className="text-white font-medium">{trip.shipper.name}</p><p className="text-xs text-slate-500">Shipper</p></div>
                </div>
                {trip.shipper.phone && <Button size="sm" variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg text-xs" onClick={() => window.open(`tel:${trip.shipper.phone}`)}><Phone className="w-3 h-3 mr-1" />Call Shipper</Button>}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {trip.notes && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4"><p className="text-xs text-slate-500 mb-1">Notes</p><p className="text-slate-300 text-sm">{trip.notes}</p></CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
