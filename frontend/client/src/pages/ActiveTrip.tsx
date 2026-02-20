/**
 * ACTIVE TRIP DASHBOARD
 * ═══════════════════════════════════════════════════════════════
 * 
 * The driver's real-time command center while transporting a load.
 * Every element serves an obvious purpose — Jony Ive design philosophy.
 * 
 * Sections:
 * 1. Trip Header — Load number, status, origin→destination
 * 2. State Crossing Tracker — Visual state-by-state progress
 * 3. Zone Mechanics Panel — ZEUN integration for in-motion diagnostics
 * 4. Compliance Alerts — Real-time per-state requirements
 * 5. SOS Emergency Button — One-tap emergency broadcast
 * 6. IFTA Mileage Tracker — Per-state mile log
 */

import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  Shield, AlertTriangle, Navigation, MapPin, Truck, Phone,
  Radio, Fuel, Scale, FileText, ChevronRight, Activity,
  Siren, CheckCircle2, Clock, Zap, ArrowRight, Globe,
  Wrench, Heart, Flame, Car, CloudLightning, HelpCircle,
  X, Loader2, RefreshCw, Target, Award, Coffee, Gauge,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// SOS BUTTON COMPONENT — The most important UI element
// Big, unmissable, always accessible. One tap saves lives.
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

  const createSOS = trpc.interstate.createSOS.useMutation({
    onSuccess: () => {
      setSent(true);
      setSending(false);
      onAlert?.();
      setTimeout(() => { setSent(false); setExpanded(false); setConfirming(null); }, 3000);
    },
    onError: () => setSending(false),
  });

  const handleSend = useCallback((type: string) => {
    if (sending) return;
    setSending(true);
    // Get current position
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          createSOS.mutate({
            loadId,
            alertType: type as any,
            severity: type === "medical" || type === "hazmat_spill" || type === "accident" ? "critical" : "high",
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => {
          // Fallback: send with 0,0 — server will still broadcast
          createSOS.mutate({
            loadId,
            alertType: type as any,
            severity: "high",
            latitude: 0,
            longitude: 0,
          });
        },
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
      <button
        onClick={() => setExpanded(true)}
        className="w-full rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 transition-all duration-200 p-5 flex items-center justify-center gap-3 shadow-lg shadow-red-900/40"
        style={{ minHeight: 72 }}
      >
        <Siren className="w-7 h-7 text-white" />
        <span className="text-white font-bold text-xl tracking-wide">SOS EMERGENCY</span>
      </button>
    );
  }

  return (
    <div className="rounded-2xl bg-zinc-900/90 border border-red-500/40 p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Siren className="w-5 h-5 text-red-400" />
          <span className="text-red-300 font-semibold">Select Emergency Type</span>
        </div>
        <button onClick={() => { setExpanded(false); setConfirming(null); }} className="p-1 rounded-lg hover:bg-zinc-800">
          <X className="w-5 h-5 text-zinc-500" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {SOS_TYPES.map((s) => {
          const Icon = s.icon;
          const isConfirming = confirming === s.type;

          if (isConfirming) {
            return (
              <button
                key={s.type}
                onClick={() => handleSend(s.type)}
                disabled={sending}
                className="col-span-2 rounded-xl p-4 text-center transition-all"
                style={{ backgroundColor: s.color + "30", borderColor: s.color, borderWidth: 2 }}
              >
                {sending ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-white" />
                ) : (
                  <>
                    <p className="text-white font-bold text-lg">CONFIRM: {s.label}</p>
                    <p className="text-zinc-300 text-xs mt-1">Tap to broadcast to all parties</p>
                  </>
                )}
              </button>
            );
          }

          return (
            <button
              key={s.type}
              onClick={() => setConfirming(s.type)}
              className="rounded-xl p-3 flex items-center gap-2 hover:opacity-80 active:scale-95 transition-all"
              style={{ backgroundColor: s.color + "18", border: `1px solid ${s.color}40` }}
            >
              <Icon className="w-5 h-5 flex-shrink-0" style={{ color: s.color }} />
              <div className="text-left">
                <p className="text-white text-sm font-medium">{s.label}</p>
                <p className="text-zinc-400 text-xs">{s.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STATE CROSSING TRACKER — Visual breadcrumb of state progress
// ═══════════════════════════════════════════════════════════════

function StateCrossingTracker({ origin, destination, statesCrossed, currentState }: {
  origin: { city: string; state: string };
  destination: { city: string; state: string };
  statesCrossed: Array<{ fromState: string; toState: string; crossedAt: string }>;
  currentState: string;
}) {
  // Build ordered state list
  const allStates: string[] = [origin.state];
  for (const c of statesCrossed) {
    if (!allStates.includes(c.toState)) allStates.push(c.toState);
  }
  if (!allStates.includes(destination.state)) allStates.push(destination.state);

  return (
    <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-4 h-4 text-blue-400" />
        <span className="text-zinc-300 font-medium text-sm">State Progress</span>
        {allStates.length > 1 && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium">
            Interstate
          </span>
        )}
        {allStates.length === 1 && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
            Intrastate
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {allStates.map((state, i) => {
          const isCurrent = state === currentState;
          const isPast = allStates.indexOf(currentState) > i;
          const isFuture = !isCurrent && !isPast;
          const crossing = statesCrossed.find(c => c.toState === state);

          return (
            <div key={state} className="flex items-center gap-1 flex-shrink-0">
              {i > 0 && (
                <ChevronRight className={`w-3 h-3 ${isPast || isCurrent ? "text-blue-400" : "text-zinc-700"}`} />
              )}
              <div
                className={`px-3 py-1.5 rounded-lg text-center transition-all ${
                  isCurrent
                    ? "bg-blue-500/30 border border-blue-400 shadow-lg shadow-blue-500/20"
                    : isPast
                    ? "bg-emerald-500/15 border border-emerald-500/30"
                    : "bg-zinc-800/50 border border-zinc-700/50"
                }`}
              >
                <p className={`font-bold text-sm ${isCurrent ? "text-blue-300" : isPast ? "text-emerald-400" : "text-zinc-500"}`}>
                  {state}
                </p>
                {crossing && (
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {new Date(crossing.crossedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPLIANCE ALERTS PANEL — Per-state requirements in real-time
// ═══════════════════════════════════════════════════════════════

function CompliancePanel({ compliance }: { compliance: any }) {
  if (!compliance) return null;

  const { overallStatus, compliance: stateChecks, warnings, blockers } = compliance;

  return (
    <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-amber-400" />
        <span className="text-zinc-300 font-medium text-sm">Compliance Status</span>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
          overallStatus === "clear" ? "bg-emerald-500/20 text-emerald-300" :
          overallStatus === "warnings" ? "bg-amber-500/20 text-amber-300" :
          "bg-red-500/20 text-red-300"
        }`}>
          {overallStatus === "clear" ? "All Clear" : overallStatus === "warnings" ? `${warnings.length} Warning${warnings.length > 1 ? "s" : ""}` : `${blockers.length} Blocker${blockers.length > 1 ? "s" : ""}`}
        </span>
      </div>

      {stateChecks?.map((sc: any) => (
        <div key={sc.stateCode} className="space-y-1.5">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{sc.stateName}</p>
          {sc.checks.map((check: any, i: number) => {
            const statusColor = check.status === "pass" ? "text-emerald-400" : check.status === "warning" ? "text-amber-400" : "text-red-400";
            const StatusIcon = check.status === "pass" ? CheckCircle2 : check.status === "warning" ? AlertTriangle : X;
            return (
              <div key={i} className="flex items-start gap-2 py-1">
                <StatusIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${statusColor}`} />
                <div className="min-w-0">
                  <p className="text-xs text-zinc-300">{check.label}</p>
                  <p className="text-[10px] text-zinc-500 leading-tight">{check.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ZEUN MECHANICS PANEL — In-motion vehicle diagnostics
// ═══════════════════════════════════════════════════════════════

function ZeunMechanicsPanel({ loadId }: { loadId: number }) {
  const { data: zeunData } = trpc.zeunMechanics.getVehicleHealth.useQuery(
    { loadId },
    { refetchInterval: 30000, retry: false }
  );

  const items = [
    { label: "Engine", icon: Zap, status: zeunData?.engine || "nominal" },
    { label: "Tires", icon: Activity, status: zeunData?.tires || "nominal" },
    { label: "Brakes", icon: Scale, status: zeunData?.brakes || "nominal" },
    { label: "Fuel", icon: Fuel, status: zeunData?.fuel || "nominal" },
  ];

  return (
    <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Wrench className="w-4 h-4 text-cyan-400" />
        <span className="text-zinc-300 font-medium text-sm">ZEUN Vehicle Health</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isOk = item.status === "nominal" || item.status === "good";
          return (
            <div key={item.label} className={`rounded-xl p-2.5 text-center border ${
              isOk ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20"
            }`}>
              <Icon className={`w-5 h-5 mx-auto mb-1 ${isOk ? "text-emerald-400" : "text-amber-400"}`} />
              <p className="text-[10px] text-zinc-400">{item.label}</p>
            </div>
          );
        })}
      </div>

      {zeunData?.nextService && (
        <p className="text-[10px] text-zinc-500 mt-2 text-center">
          Next service: {zeunData.nextService}
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// IFTA MILEAGE LOG — Per-state miles for quarterly filing
// ═══════════════════════════════════════════════════════════════

function IFTAMileageLog({ stateMiles }: { stateMiles: Array<{ stateCode: string; miles: number; weightTaxApplicable: boolean }> }) {
  if (!stateMiles?.length) return null;
  const totalMiles = stateMiles.reduce((sum, s) => sum + s.miles, 0);

  return (
    <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-indigo-400" />
        <span className="text-zinc-300 font-medium text-sm">IFTA Mileage</span>
        <span className="ml-auto text-xs text-zinc-500">{totalMiles.toFixed(1)} mi total</span>
      </div>

      <div className="space-y-1">
        {stateMiles.map((s) => (
          <div key={s.stateCode} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-300 w-6">{s.stateCode}</span>
              {s.weightTaxApplicable && (
                <Scale className="w-3 h-3 text-amber-400" />
              )}
            </div>
            <div className="flex-1 mx-3">
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500/60"
                  style={{ width: `${totalMiles > 0 ? (s.miles / totalMiles) * 100 : 0}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-zinc-400 w-16 text-right">{s.miles.toFixed(1)} mi</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ACTIVE SOS ALERTS BANNER — Shows if there's an active SOS
// ═══════════════════════════════════════════════════════════════

function ActiveSOSBanner({ loadId }: { loadId: number }) {
  const { data: alerts } = trpc.interstate.getSOSForLoad.useQuery(
    { loadId },
    { refetchInterval: 5000 }
  );

  const activeAlerts = alerts?.filter((a: any) => a.status === "active" || a.status === "acknowledged") || [];
  if (activeAlerts.length === 0) return null;

  return (
    <div className="rounded-2xl bg-red-500/15 border-2 border-red-500/40 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <Siren className="w-6 h-6 text-red-400" />
        <div>
          <p className="text-red-300 font-bold">Active SOS Alert</p>
          <p className="text-red-400/70 text-xs">
            {activeAlerts[0].alertType.replace(/_/g, " ").toUpperCase()} - {activeAlerts[0].status}
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MISSION PROGRESS INDICATOR — Jony Ive-inspired minimal design
// Subtle, elegant, purposeful. Shows when an active trip matches
// a mission the driver has accepted. Frosted glass + thin ring.
// ═══════════════════════════════════════════════════════════════

function MissionProgressIndicator({ loadId }: { loadId: number }) {
  const { data: missions } = (trpc as any).gamification?.getActiveTripMissions?.useQuery?.(
    { loadId },
    { refetchInterval: 30000, retry: false }
  ) || { data: null };

  if (!missions || missions.length === 0) return null;

  return (
    <div className="space-y-2">
      {missions.map((m: any) => {
        const pct = m.targetValue > 0 ? Math.min(100, (m.currentProgress / m.targetValue) * 100) : 0;
        const circumference = 2 * Math.PI * 18;
        const strokeDash = (pct / 100) * circumference;

        return (
          <div
            key={m.missionId}
            className="rounded-2xl border border-white/[0.08] p-4"
            style={{
              background: "linear-gradient(135deg, rgba(20,115,255,0.06) 0%, rgba(190,1,255,0.06) 100%)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            <div className="flex items-center gap-3.5">
              {/* Circular progress ring — the Ive signature element */}
              <div className="relative w-11 h-11 flex-shrink-0">
                <svg viewBox="0 0 40 40" className="w-11 h-11 -rotate-90">
                  {/* Track */}
                  <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
                  {/* Progress arc */}
                  <circle
                    cx="20" cy="20" r="18" fill="none"
                    stroke="url(#missionGrad)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                    style={{ transition: "stroke-dasharray 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
                  />
                  <defs>
                    <linearGradient id="missionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1473FF" />
                      <stop offset="100%" stopColor="#BE01FF" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Target className="w-4 h-4 text-[#1473FF]" />
                </div>
              </div>

              {/* Mission info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-semibold text-white tracking-tight truncate">{m.missionName}</p>
                  <Award className="w-3 h-3 text-[#BE01FF] flex-shrink-0" />
                </div>
                <p className="text-[11px] text-zinc-500 leading-tight mt-0.5 truncate">{m.matchReason}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: "linear-gradient(90deg, #1473FF, #BE01FF)",
                        transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 tabular-nums flex-shrink-0">
                    {m.currentProgress}/{m.targetValue}
                  </span>
                  <span className="text-[10px] font-medium text-[#BE01FF] flex-shrink-0">
                    +{m.xpReward} XP
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOS COMPACT GAUGES — Minimal in-trip HOS awareness
// Three thin arc gauges: Drive | Duty | Cycle
// Break warning if approaching 8h threshold
// ═══════════════════════════════════════════════════════════════

function HOSCompactPanel() {
  const { data: hos } = (trpc as any).drivers?.getMyHOS?.useQuery?.(undefined, {
    refetchInterval: 60000,
  }) || { data: null };

  if (!hos) return null;

  const gauges = [
    { label: "Drive", used: hos.drivingHours || 0, max: 11, color: "#10b981" },
    { label: "Duty", used: hos.onDutyHours || 0, max: 14, color: "#3b82f6" },
    { label: "Cycle", used: hos.cycleHours || 0, max: 70, color: "#8b5cf6" },
  ];

  const hasViolation = (hos.violations || []).some((v: any) => v.severity === "violation");
  const hasWarning = hos.breakRequired || (hos.violations || []).some((v: any) => v.severity === "warning");

  return (
    <div className="rounded-2xl border border-zinc-800 p-4"
      style={{
        background: hasViolation
          ? "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.03) 100%)"
          : hasWarning
          ? "linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(245,158,11,0.02) 100%)"
          : "rgba(24,24,27,0.6)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Gauge className="w-4 h-4 text-zinc-400" />
        <span className="text-zinc-300 font-medium text-sm">HOS Status</span>
        {hos.status && (
          <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium ${
            hos.status === "driving" ? "bg-emerald-500/20 text-emerald-300" :
            hos.status === "on_duty" ? "bg-blue-500/20 text-blue-300" :
            hos.status === "sleeper" ? "bg-purple-500/20 text-purple-300" :
            "bg-zinc-700/50 text-zinc-400"
          }`}>
            {(hos.status || "off_duty").replace(/_/g, " ").toUpperCase()}
          </span>
        )}
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
                  <circle
                    cx="22" cy="22" r="19" fill="none"
                    stroke={isLow ? "#ef4444" : g.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${(pct / 100) * 119.4} ${119.4 - (pct / 100) * 119.4}`}
                    opacity={0.8}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-[11px] font-bold tabular-nums ${isLow ? "text-red-400" : "text-white"}`}>
                    {remaining.toFixed(remaining < 10 ? 1 : 0)}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">{g.label}</p>
              <p className="text-[9px] text-zinc-600">{g.used.toFixed(1)}h/{g.max}h</p>
            </div>
          );
        })}
      </div>

      {/* Break warning */}
      {hos.breakRequired && (
        <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Coffee className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-amber-300 text-xs font-medium">30-min break required</p>
            <p className="text-amber-400/60 text-[10px]">49 CFR 395.3(a)(3)(ii)</p>
          </div>
        </div>
      )}

      {/* Active violations */}
      {hasViolation && (
        <div className="mt-2 flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-300 text-xs font-medium">HOS Violation Active</p>
            <p className="text-red-400/60 text-[10px]">{(hos.violations || [])[0]?.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN ACTIVE TRIP DASHBOARD
// ═══════════════════════════════════════════════════════════════

export default function ActiveTrip() {
  const [, navigate] = useLocation();

  // Auto-detect driver's current active load
  const { data: activeLoad, isLoading: loadingActive } = trpc.interstate.getMyActiveLoad.useQuery(
    undefined,
    { refetchInterval: 10000 }
  );

  // Get full trip data once we have a load
  const { data: tripData, refetch: refetchTrip } = trpc.interstate.getActiveTrip.useQuery(
    { loadId: activeLoad?.id || 0 },
    { enabled: !!activeLoad?.id, refetchInterval: 15000 }
  );

  if (loadingActive) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
          <p className="text-zinc-400 text-sm">Detecting active trip...</p>
        </div>
      </div>
    );
  }

  if (!activeLoad) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-sm">
          <Truck className="w-12 h-12 text-zinc-600 mx-auto" />
          <h2 className="text-xl font-semibold text-zinc-300">No Active Trip</h2>
          <p className="text-zinc-500 text-sm">
            Your active trip dashboard will appear here when you have an in-progress load assigned to you.
          </p>
          <button
            onClick={() => navigate("/loads")}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            View My Loads
          </button>
        </div>
      </div>
    );
  }

  const pickup = activeLoad.pickupLocation as any || {};
  const delivery = activeLoad.deliveryLocation as any || {};

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-8">
      {/* Trip Header */}
      <div className="rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Active Trip</p>
            <p className="text-lg font-bold text-white">{activeLoad.loadNumber}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            activeLoad.status === "in_transit" ? "bg-blue-500/20 text-blue-300" :
            activeLoad.status === "at_pickup" || activeLoad.status === "loading" ? "bg-amber-500/20 text-amber-300" :
            activeLoad.status === "at_delivery" || activeLoad.status === "unloading" ? "bg-emerald-500/20 text-emerald-300" :
            "bg-zinc-700/50 text-zinc-400"
          }`}>
            {activeLoad.status.replace(/_/g, " ").toUpperCase()}
          </div>
        </div>

        {/* Origin → Destination */}
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <p className="text-xs text-zinc-500">Origin</p>
            </div>
            <p className="text-sm font-medium text-zinc-200 truncate">
              {pickup.city}, {pickup.state}
            </p>
          </div>

          <ArrowRight className="w-5 h-5 text-zinc-600 flex-shrink-0" />

          <div className="flex-1 min-w-0 text-right">
            <div className="flex items-center gap-1.5 justify-end mb-0.5">
              <p className="text-xs text-zinc-500">Destination</p>
              <div className="w-2 h-2 rounded-full bg-red-400" />
            </div>
            <p className="text-sm font-medium text-zinc-200 truncate">
              {delivery.city}, {delivery.state}
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-zinc-800/50">
          <div className="flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-400">{Number(activeLoad.distance || 0).toFixed(0)} mi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-400">{Number(activeLoad.weight || 0).toLocaleString()} lbs</span>
          </div>
          {activeLoad.hazmatClass && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-amber-300">HAZMAT {activeLoad.hazmatClass}</span>
            </div>
          )}
          <button onClick={() => refetchTrip()} className="ml-auto p-1 rounded-lg hover:bg-zinc-800 transition-colors">
            <RefreshCw className="w-3.5 h-3.5 text-zinc-600" />
          </button>
        </div>
      </div>

      {/* Active SOS Banner */}
      <ActiveSOSBanner loadId={activeLoad.id} />

      {/* SOS Emergency Button */}
      <SOSButton loadId={activeLoad.id} onAlert={() => refetchTrip()} />

      {/* Mission Progress — Jony Ive-inspired frosted glass indicator */}
      <MissionProgressIndicator loadId={activeLoad.id} />

      {/* HOS Compact Gauges — Real-time driving/duty/cycle awareness */}
      <HOSCompactPanel />

      {/* State Crossing Tracker */}
      {tripData && (
        <StateCrossingTracker
          origin={tripData.origin}
          destination={tripData.destination}
          statesCrossed={tripData.statesCrossed}
          currentState={tripData.currentState}
        />
      )}

      {/* ZEUN Vehicle Health */}
      <ZeunMechanicsPanel loadId={activeLoad.id} />

      {/* Compliance Panel */}
      {tripData?.routeCompliance && (
        <CompliancePanel compliance={tripData.routeCompliance} />
      )}

      {/* IFTA Mileage */}
      {tripData?.stateMiles && (
        <IFTAMileageLog stateMiles={tripData.stateMiles} />
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => navigate(`/loads/${activeLoad.id}`)}
          className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3 flex items-center gap-2 hover:bg-zinc-800/60 transition-colors"
        >
          <FileText className="w-4 h-4 text-zinc-500" />
          <span className="text-sm text-zinc-300">Load Details</span>
        </button>
        <button
          onClick={() => navigate("/zeun")}
          className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3 flex items-center gap-2 hover:bg-zinc-800/60 transition-colors"
        >
          <Wrench className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-zinc-300">ZEUN Portal</span>
        </button>
        <button
          onClick={() => navigate("/tracking")}
          className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3 flex items-center gap-2 hover:bg-zinc-800/60 transition-colors"
        >
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-zinc-300">Live Map</span>
        </button>
        <button
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition((pos) => {
                window.open(`tel:911`, "_self");
              });
            }
          }}
          className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3 flex items-center gap-2 hover:bg-zinc-800/60 transition-colors"
        >
          <Phone className="w-4 h-4 text-red-400" />
          <span className="text-sm text-zinc-300">Call 911</span>
        </button>
      </div>
    </div>
  );
}
