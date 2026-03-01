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

import { useState, useEffect, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  Shield, AlertTriangle, Navigation, MapPin, Truck, Phone,
  Radio, Fuel, Scale, FileText, ChevronRight, Activity,
  Siren, CheckCircle2, Clock, Zap, ArrowRight, Globe,
  Wrench, Heart, Flame, Car, CloudLightning, HelpCircle,
  X, Loader2, RefreshCw, Target, Award, Coffee, Gauge,
  Moon, Play, Pause,
  Thermometer, Snowflake, FlaskConical, ShieldAlert,
  Camera, Eye, ImageIcon, ChevronDown, ChevronUp, Lock, Package,
} from "lucide-react";
import { toast } from "sonner";

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
  const { data: zeunData } = (trpc as any).zeunMechanics?.getVehicleHealth?.useQuery?.(
    { loadId },
    { refetchInterval: 30000, retry: false }
  ) || { data: null };

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
// ZEUN VISUAL INTELLIGENCE — Photo-based AI verification panel
// Gauge reading, Seal verification, DVIR, Cargo condition
// ═══════════════════════════════════════════════════════════════

const VIGA_MODES = [
  { key: "gauge", label: "Gauge Reading", icon: Gauge, desc: "Photo of tank gauge → extract readings", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { key: "seal", label: "Seal Check", icon: Lock, desc: "Photo of seal → verify number & integrity", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { key: "dvir", label: "DVIR Assist", icon: Shield, desc: "Photo of inspection point → AI check", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { key: "cargo", label: "Cargo Check", icon: Package, desc: "Photo of cargo → condition & securement", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
] as const;

type VigaMode = typeof VIGA_MODES[number]["key"];

function VIGAVisualPanel({ loadId }: { loadId: number }) {
  const [expanded, setExpanded] = useState(false);
  const [activeMode, setActiveMode] = useState<VigaMode | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [sealInput, setSealInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const gaugeRead = (trpc as any).visualIntelligence?.readGauge?.useMutation?.() || { mutate: () => {}, isPending: false };
  const sealVerify = (trpc as any).visualIntelligence?.verifySeal?.useMutation?.() || { mutate: () => {}, isPending: false };
  const dvirInspect = (trpc as any).visualIntelligence?.inspectDVIR?.useMutation?.() || { mutate: () => {}, isPending: false };
  const cargoAssess = (trpc as any).visualIntelligence?.assessCargo?.useMutation?.() || { mutate: () => {}, isPending: false };

  const handleCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhotoPreview(dataUrl);
      setPhotoBase64(dataUrl);
      setResult(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyze = useCallback(() => {
    if (!photoBase64 || !activeMode) return;
    setAnalyzing(true);
    setResult(null);

    const onSuccess = (r: any) => { setResult(r); setAnalyzing(false); };
    const onError = () => { setAnalyzing(false); toast.error("Analysis failed. Try again."); };

    switch (activeMode) {
      case "gauge":
        gaugeRead.mutate({ imageBase64: photoBase64, mimeType: "image/jpeg" }, { onSuccess, onError });
        break;
      case "seal":
        sealVerify.mutate({ imageBase64: photoBase64, mimeType: "image/jpeg", expectedSealNumber: sealInput || undefined }, { onSuccess, onError });
        break;
      case "dvir":
        dvirInspect.mutate({ imageBase64: photoBase64, mimeType: "image/jpeg" }, { onSuccess, onError });
        break;
      case "cargo":
        cargoAssess.mutate({ imageBase64: photoBase64, mimeType: "image/jpeg" }, { onSuccess, onError });
        break;
    }
  }, [photoBase64, activeMode, sealInput]);

  const resetPanel = () => {
    setPhotoPreview(null);
    setPhotoBase64(null);
    setResult(null);
    setActiveMode(null);
    setSealInput("");
  };

  return (
    <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-2 p-4 hover:bg-zinc-800/30 transition-colors">
        <div className="p-1.5 rounded-lg bg-gradient-to-r from-[#1473FF] to-[#BE01FF]">
          <Camera className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="text-left flex-1">
          <span className="text-zinc-200 font-medium text-sm">Zeun Visual Intelligence</span>
          <p className="text-[10px] text-zinc-500">Photo-based AI verification & diagnostics</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {!activeMode ? (
            <div className="grid grid-cols-2 gap-2">
              {VIGA_MODES.map((m) => {
                const Icon = m.icon;
                return (
                  <button key={m.key} onClick={() => setActiveMode(m.key)}
                    className={`rounded-xl p-3 border text-left transition-all hover:scale-[1.02] ${m.bg}`}>
                    <Icon className={`w-5 h-5 mb-1.5 ${m.color}`} />
                    <p className="text-xs font-semibold text-zinc-200">{m.label}</p>
                    <p className="text-[9px] text-zinc-500 mt-0.5">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => { const m = VIGA_MODES.find(v => v.key === activeMode); if (!m) return null; const Icon = m.icon; return <><Icon className={`w-4 h-4 ${m.color}`} /><span className="text-sm font-medium text-zinc-200">{m.label}</span></>; })()}
                </div>
                <button onClick={resetPanel} className="text-xs text-zinc-500 hover:text-zinc-300">Back</button>
              </div>

              {activeMode === "seal" && !photoPreview && (
                <input value={sealInput} onChange={e => setSealInput(e.target.value)} placeholder="Expected seal # from BOL (optional)"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-sm text-zinc-200 placeholder:text-zinc-600" />
              )}

              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapture} />

              {!photoPreview ? (
                <button onClick={() => fileRef.current?.click()}
                  className="w-full p-5 rounded-xl border-2 border-dashed border-zinc-700 hover:border-purple-500/50 hover:bg-purple-500/5 flex flex-col items-center gap-2 transition-all">
                  <ImageIcon className="w-7 h-7 text-zinc-600" />
                  <span className="text-xs text-zinc-400">Tap to capture photo</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <img src={photoPreview} alt="Captured" className="w-full rounded-xl max-h-40 object-cover" />
                    <button onClick={() => { setPhotoPreview(null); setPhotoBase64(null); setResult(null); }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {!result && !analyzing && (
                    <button onClick={handleAnalyze}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                      <Eye className="w-4 h-4" />Analyze with VIGA
                    </button>
                  )}

                  {analyzing && (
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                      <RefreshCw className="w-4 h-4 mx-auto mb-1 text-purple-400 animate-spin" />
                      <p className="text-xs text-purple-300">VIGA analyzing...</p>
                    </div>
                  )}

                  {/* ── Gauge Reading Results ── */}
                  {result?.data && activeMode === "gauge" && (
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-semibold text-blue-300">Gauge Reading</span>
                        <span className="ml-auto text-[10px] text-blue-400/70">{((result.data.confidence || 0) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="bg-zinc-900/50 rounded-lg p-3">
                        <p className="text-2xl font-bold text-white">{result.data.reading} <span className="text-sm text-zinc-400">{result.data.unit}</span></p>
                        <p className="text-[10px] text-zinc-500 mt-1">{result.data.gaugeType}</p>
                      </div>
                      {result.data.additionalReadings?.length > 0 && (
                        <div className="grid grid-cols-2 gap-1.5">
                          {result.data.additionalReadings.map((r: any, i: number) => (
                            <div key={i} className="bg-zinc-900/30 rounded-lg p-2">
                              <p className="text-[9px] text-zinc-500">{r.label}</p>
                              <p className="text-sm font-medium text-zinc-200">{r.value} <span className="text-[10px] text-zinc-500">{r.unit}</span></p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className={`flex items-center gap-1.5 text-[10px] ${result.data.isWithinNormal ? "text-emerald-400" : "text-amber-400"}`}>
                        {result.data.isWithinNormal ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {result.data.isWithinNormal ? "Within normal range" : "Outside normal range"} ({result.data.normalRange})
                      </div>
                    </div>
                  )}

                  {/* ── Seal Verification Results ── */}
                  {result?.data && activeMode === "seal" && (
                    <div className={`p-3 rounded-xl border space-y-2 ${
                      result.data.condition === "INTACT" ? "bg-emerald-500/10 border-emerald-500/20" :
                      result.data.condition === "TAMPERED" || result.data.condition === "BROKEN" ? "bg-red-500/10 border-red-500/20" :
                      "bg-amber-500/10 border-amber-500/20"
                    }`}>
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-semibold text-zinc-200">Seal Verification</span>
                        <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          result.data.condition === "INTACT" ? "bg-emerald-500/20 text-emerald-400" :
                          result.data.condition === "TAMPERED" || result.data.condition === "BROKEN" ? "bg-red-500/20 text-red-400" :
                          "bg-amber-500/20 text-amber-400"
                        }`}>{result.data.condition}</span>
                      </div>
                      <div className="bg-zinc-900/50 rounded-lg p-3">
                        <p className="text-[10px] text-zinc-500">Seal Number</p>
                        <p className="text-lg font-bold text-white font-mono">{result.data.sealNumber || "Unreadable"}</p>
                        <p className="text-[10px] text-zinc-500 mt-1">Type: {result.data.sealType}</p>
                      </div>
                      {result.data.matchesBOL !== null && (
                        <div className={`flex items-center gap-1.5 text-xs font-medium ${result.data.matchesBOL ? "text-emerald-400" : "text-red-400"}`}>
                          {result.data.matchesBOL ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          {result.data.matchesBOL ? "Matches BOL" : "Does NOT match BOL"}
                        </div>
                      )}
                      {result.data.tamperEvidence && (
                        <div className="flex items-start gap-1.5 text-xs text-red-400 bg-red-500/10 rounded-lg p-2">
                          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <span>{result.data.tamperDetails}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── DVIR Inspection Results ── */}
                  {result?.data && activeMode === "dvir" && (
                    <div className={`p-3 rounded-xl border space-y-2 ${
                      result.data.condition === "PASS" ? "bg-emerald-500/10 border-emerald-500/20" :
                      result.data.condition === "FAIL" ? "bg-red-500/10 border-red-500/20" :
                      "bg-amber-500/10 border-amber-500/20"
                    }`}>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-semibold text-zinc-200">DVIR: {result.data.inspectionPoint}</span>
                        <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          result.data.condition === "PASS" ? "bg-emerald-500/20 text-emerald-400" :
                          result.data.condition === "FAIL" ? "bg-red-500/20 text-red-400" :
                          "bg-amber-500/20 text-amber-400"
                        }`}>{result.data.condition}</span>
                      </div>
                      {result.data.defectsFound?.length > 0 ? (
                        <div className="space-y-1">
                          {result.data.defectsFound.map((d: any, i: number) => (
                            <div key={i} className="flex items-start gap-2 bg-zinc-900/50 rounded-lg p-2">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0 ${
                                d.severity === "CRITICAL_OOS" ? "bg-red-500/20 text-red-400" :
                                d.severity === "MAJOR" ? "bg-orange-500/20 text-orange-400" :
                                "bg-yellow-500/20 text-yellow-400"
                              }`}>{d.severity}</span>
                              <span className="text-xs text-zinc-300">{d.description}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-emerald-400 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" />No defects found</p>
                      )}
                      {result.data.regulatoryNotes?.length > 0 && (
                        <div className="text-[10px] text-zinc-500">
                          {result.data.regulatoryNotes.map((n: string, i: number) => <p key={i}>{n}</p>)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Cargo Condition Results ── */}
                  {result?.data && activeMode === "cargo" && (
                    <div className={`p-3 rounded-xl border space-y-2 ${
                      result.data.condition === "SECURE" ? "bg-emerald-500/10 border-emerald-500/20" :
                      result.data.condition === "LEAKING" || result.data.condition === "DAMAGED" ? "bg-red-500/10 border-red-500/20" :
                      "bg-amber-500/10 border-amber-500/20"
                    }`}>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-semibold text-zinc-200">Cargo: {result.data.cargoType}</span>
                        <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          result.data.condition === "SECURE" ? "bg-emerald-500/20 text-emerald-400" :
                          result.data.condition === "LEAKING" || result.data.condition === "DAMAGED" ? "bg-red-500/20 text-red-400" :
                          "bg-amber-500/20 text-amber-400"
                        }`}>{result.data.condition}</span>
                      </div>
                      <div className="bg-zinc-900/50 rounded-lg p-2">
                        <p className="text-[10px] text-zinc-500">Securement</p>
                        <p className="text-xs text-zinc-300">{result.data.securementStatus}</p>
                      </div>
                      {result.data.issues?.length > 0 && (
                        <div className="space-y-1">
                          {result.data.issues.map((issue: any, i: number) => (
                            <div key={i} className="flex items-start gap-2 bg-zinc-900/50 rounded-lg p-2">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0 ${
                                issue.severity === "CRITICAL" || issue.severity === "HIGH" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                              }`}>{issue.severity}</span>
                              <span className="text-xs text-zinc-300">{issue.description}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {result.data.hazmatVisible && result.data.placardInfo && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Placard: {result.data.placardInfo}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
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
// CARGO EXCEPTION BANNER — Urgent alert when load is in a cargo exception state
// ═══════════════════════════════════════════════════════════════

const CARGO_EXCEPTION_META: Record<string, { icon: React.ElementType; label: string; desc: string }> = {
  temp_excursion:       { icon: Thermometer,  label: "Temperature Excursion",  desc: "Reefer temperature outside acceptable range. Cold chain breach documented." },
  reefer_breakdown:     { icon: Snowflake,    label: "Reefer Breakdown",       desc: "Refrigeration unit failure. Layover timer active. Emergency transfer may be needed." },
  contamination_reject: { icon: FlaskConical,  label: "Contamination Reject",   desc: "Product rejected — contamination detected. Lab results required." },
  seal_breach:          { icon: ShieldAlert,   label: "Seal Breach",            desc: "Seal broken or tampered. Full cargo inspection required before unloading." },
  weight_violation:     { icon: Scale,         label: "Weight Violation",       desc: "Load exceeds legal weight limits. Reweigh required. Scale ticket must be uploaded." },
};

function CargoExceptionBanner({ status }: { status: string }) {
  const meta = CARGO_EXCEPTION_META[status];
  if (!meta) return null;
  const Icon = meta.icon;

  return (
    <div className="rounded-2xl bg-red-500/15 border-2 border-red-500/40 p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-red-500/20 flex-shrink-0">
          <Icon className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <p className="text-red-300 font-bold">{meta.label}</p>
          <p className="text-red-400/80 text-xs mt-0.5 leading-relaxed">{meta.desc}</p>
          <p className="text-red-500/60 text-[10px] mt-1.5">Resolve this exception to continue the load lifecycle.</p>
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
            className="rounded-2xl border border-slate-200 dark:border-white/[0.08] p-4"
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
                  <div className="flex-1 h-[3px] rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
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
// HOS COMPACT GAUGES + ORGANIC DUTY CONTROLS
// Three thin arc gauges: Drive | Duty | Cycle
// Inline duty status toggle — trip events set this automatically,
// but driver can manually override (break, sleeper, etc.)
// ═══════════════════════════════════════════════════════════════

const DUTY_BUTTONS = [
  { status: "off_duty" as const, label: "Off Duty", icon: Pause, color: "bg-zinc-600", text: "text-zinc-300", active: "bg-zinc-500/30 border-zinc-500 text-zinc-200" },
  { status: "sleeper" as const, label: "Sleeper", icon: Moon, color: "bg-purple-600", text: "text-purple-300", active: "bg-purple-500/30 border-purple-400 text-purple-200" },
  { status: "on_duty" as const, label: "On Duty", icon: Play, color: "bg-blue-600", text: "text-blue-300", active: "bg-blue-500/30 border-blue-400 text-blue-200" },
  { status: "driving" as const, label: "Driving", icon: Truck, color: "bg-emerald-600", text: "text-emerald-300", active: "bg-emerald-500/30 border-emerald-400 text-emerald-200" },
];

function HOSCompactPanel() {
  const { data: hos, refetch: refetchHOS } = (trpc as any).drivers?.getMyHOSStatus?.useQuery?.(undefined, {
    refetchInterval: 30000,
  }) || { data: null, refetch: () => {} };

  const changeStatusMut = (trpc as any).hos?.changeStatus?.useMutation?.({
    onSuccess: (data: any) => {
      refetchHOS();
      toast.success(`Duty status: ${(data?.newStatus || "").replace(/_/g, " ").toUpperCase()}`, {
        description: data?.canDrive ? "You are cleared to drive" : "Not in driving status",
      });
    },
    onError: (err: any) => toast.error("Status change failed", { description: err?.message }),
  });

  const handleDutyChange = useCallback((newStatus: string) => {
    if (!changeStatusMut?.mutate) return;
    // Get location for the HOS log entry
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          changeStatusMut.mutate({
            newStatus,
            location: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          });
        },
        () => changeStatusMut.mutate({ newStatus, location: "Unknown" }),
        { enableHighAccuracy: false, timeout: 3000 }
      );
    } else {
      changeStatusMut.mutate({ newStatus, location: "Unknown" });
    }
  }, [changeStatusMut]);

  if (!hos) return null;

  const gauges = [
    { label: "Drive", used: hos.drivingUsed || hos.drivingHours || 0, max: 11, color: "#10b981" },
    { label: "Duty", used: hos.onDutyUsed || hos.onDutyHours || 0, max: 14, color: "#3b82f6" },
    { label: "Cycle", used: hos.cycleUsed || hos.cycleHours || 0, max: 70, color: "#8b5cf6" },
  ];

  const hasViolation = (hos.violations || []).some((v: any) => v.severity === "violation");
  const hasWarning = hos.breakRequired || (hos.violations || []).some((v: any) => v.severity === "warning");
  const currentStatus = hos.status || "off_duty";

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
        <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium ${
          currentStatus === "driving" ? "bg-emerald-500/20 text-emerald-300" :
          currentStatus === "on_duty" ? "bg-blue-500/20 text-blue-300" :
          currentStatus === "sleeper" ? "bg-purple-500/20 text-purple-300" :
          "bg-zinc-700/50 text-zinc-400"
        }`}>
          {currentStatus.replace(/_/g, " ").toUpperCase()}
        </span>
      </div>

      {/* Organic Duty Status Controls */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {DUTY_BUTTONS.map((btn) => {
          const Icon = btn.icon;
          const isActive = currentStatus === btn.status;
          return (
            <button
              key={btn.status}
              onClick={() => !isActive && handleDutyChange(btn.status)}
              disabled={isActive || changeStatusMut?.isPending}
              className={`rounded-xl py-2 px-1 flex flex-col items-center gap-1 transition-all text-center border ${
                isActive ? btn.active + " border" : "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/60"
              } ${changeStatusMut?.isPending ? "opacity-50" : ""}`}
            >
              <Icon className={`w-4 h-4 ${isActive ? btn.text : "text-zinc-500"}`} />
              <span className={`text-[9px] font-medium leading-tight ${isActive ? btn.text : "text-zinc-500"}`}>
                {btn.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Organic indicator */}
      <div className="flex items-center gap-1.5 mb-3 px-1">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[9px] text-zinc-500">Trip events auto-update duty status</span>
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
          <div className="flex-1">
            <p className="text-amber-300 text-xs font-medium">30-min break required</p>
            <p className="text-amber-400/60 text-[10px]">49 CFR 395.3(a)(3)(ii)</p>
          </div>
          <button
            onClick={() => handleDutyChange("off_duty")}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-medium hover:bg-amber-500/30 transition-colors"
          >
            Take Break
          </button>
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
            CARGO_EXCEPTION_META[activeLoad.status] ? "bg-red-500/20 text-red-300" :
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

      {/* Cargo Exception Banner */}
      <CargoExceptionBanner status={activeLoad.status} />

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

      {/* Zeun Visual Intelligence — Photo-based AI verification */}
      <VIGAVisualPanel loadId={activeLoad.id} />

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
