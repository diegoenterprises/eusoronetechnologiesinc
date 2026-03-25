/**
 * ELD CONNECTION PANEL
 * ═══════════════════════════════════════════════════════════════
 * 
 * Symbiotic ELD integration — lets companies connect their ELD provider
 * for live GPS tracking, HOS compliance, DVIR, and fleet intelligence.
 * 
 * Supports all 11 major ELD providers:
 * Samsara (84%), Geotab (76%), Powerfleet (74%), Zonar (71%), Motive (70%),
 * Lytx (68%), Netradyne (68%), Verizon Connect (67%), Azuga (64%),
 * Solera (60%), Trimble/PeopleNet (55%)
 * 
 * Used in: ELDIntegration page, Settings, ActiveTrip, Fleet Command Center
 */

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Radio, CheckCircle2, AlertTriangle, Wifi, WifiOff, Truck, Shield,
  ChevronRight, Star, Zap, Eye, EyeOff, ExternalLink, RefreshCw,
  Satellite, MapPin, Clock, Activity, X, Loader2, Lock,
} from "lucide-react";

interface ELDProvider {
  name: string;
  slug: string;
  satisfaction: number;
  logoColor: string;
  features: string[];
}

interface ELDConnectionPanelProps {
  compact?: boolean;    // Compact mode for embedding in ActiveTrip etc.
  onConnected?: () => void;
}

export default function ELDConnectionPanel({ compact = false, onConnected }: ELDConnectionPanelProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [selectedProvider, setSelectedProvider] = useState<ELDProvider | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const providersQuery = (trpc as any).eld?.getAllProviders?.useQuery?.(undefined, { staleTime: 300000 });
  const connectionQuery = (trpc as any).eld?.getConnectionStatus?.useQuery?.(undefined, { refetchInterval: 60000 });
  const connectMutation = (trpc as any).eld?.connectProvider?.useMutation?.({
    onSuccess: () => {
      toast.success(`Connected to ${selectedProvider?.name}!`);
      setConnecting(false);
      setApiKey("");
      setSelectedProvider(null);
      connectionQuery?.refetch?.();
      onConnected?.();
    },
    onError: (err: any) => {
      toast.error(`Connection failed: ${err.message}`);
      setConnecting(false);
    },
  });

  const providers: ELDProvider[] = providersQuery?.data || [];
  const connection = connectionQuery?.data;
  const isConnected = connection?.connected;

  const handleConnect = useCallback(() => {
    if (!selectedProvider || !apiKey.trim()) {
      toast.error("Please enter your API key");
      return;
    }
    setConnecting(true);
    connectMutation?.mutate?.({
      providerSlug: selectedProvider.slug,
      authType: "bearer",
      apiKey: apiKey.trim(),
    });
  }, [selectedProvider, apiKey, connectMutation]);

  // Style helpers
  const card = cn("rounded-2xl border backdrop-blur-sm", isLight ? "bg-white/80 border-slate-200/60 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");
  const subcard = cn("rounded-xl border p-4", isLight ? "bg-slate-50/80 border-slate-100" : "bg-white/[0.02] border-white/[0.04]");
  const heading = cn("font-semibold", isLight ? "text-slate-900" : "text-white");
  const muted = cn("text-sm", isLight ? "text-slate-500" : "text-slate-400");
  const label = cn("text-xs font-medium tracking-wide uppercase", isLight ? "text-slate-400" : "text-slate-500");

  // ── COMPACT MODE: Just show connection status badge ──
  if (compact) {
    return (
      <div className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-white/[0.03] border-white/[0.06]")}>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isConnected ? (isLight ? "bg-emerald-50" : "bg-emerald-500/10") : (isLight ? "bg-amber-50" : "bg-amber-500/10"))}>
          {isConnected ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-amber-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className={cn("text-sm font-semibold", heading)}>
            {isConnected ? `ELD: ${connection?.providers?.[0]?.name || "Connected"}` : "ELD Not Connected"}
          </div>
          <div className={cn("text-xs", muted)}>
            {isConnected ? "Live GPS & HOS syncing" : "Connect your ELD for live tracking"}
          </div>
        </div>
        {isConnected ? (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-500">LIVE</span>
          </div>
        ) : (
          <button
            onClick={() => window.location.href = "/eld"}
            className="text-xs font-semibold text-[#1473FF] hover:underline flex items-center gap-1"
          >
            Connect <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  // ── FULL MODE: Provider picker + connection flow ──
  return (
    <div className="space-y-6">
      {/* ── CONNECTION STATUS ── */}
      {isConnected && (
        <div className={cn(card, "p-5")}>
          <div className="flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", isLight ? "bg-emerald-50" : "bg-emerald-500/10")}>
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="flex-1">
              <div className={cn("text-lg font-bold", heading)}>ELD Connected</div>
              <div className={muted}>
                {connection?.providers?.map((p: any) => p.name).join(", ") || "Provider connected"} — Live GPS & HOS syncing
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className={cn("text-xs font-bold", isLight ? "text-emerald-600" : "text-emerald-400")}>LIVE</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { icon: MapPin, label: "GPS Tracking", desc: "Real-time fleet locations" },
              { icon: Clock, label: "HOS Compliance", desc: "49 CFR 395 monitoring" },
              { icon: Activity, label: "Diagnostics", desc: "Vehicle health data" },
            ].map(f => (
              <div key={f.label} className={subcard}>
                <f.icon className="w-4 h-4 text-emerald-500 mb-2" />
                <div className={cn("text-xs font-semibold", heading)}>{f.label}</div>
                <div className={cn("text-xs", muted)}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PROVIDER SELECTION ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={cn("text-lg font-bold", heading)}>
              {isConnected ? "Switch Provider" : "Connect Your ELD"}
            </h3>
            <p className={muted}>
              {isConnected ? "Change or add another ELD provider" : "Select your ELD provider to enable live fleet tracking, HOS compliance, and diagnostics"}
            </p>
          </div>
          <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold", isLight ? "border-slate-200 text-slate-500" : "border-white/[0.08] text-white/40")}>
            <Shield className="w-3 h-3" /> Read-Only Access
          </div>
        </div>

        {providersQuery?.isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={cn(card, "h-28 animate-pulse")} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {providers.map((p) => {
              const isSelected = selectedProvider?.slug === p.slug;
              const isAlreadyConnected = connection?.providers?.some((cp: any) => cp.slug === p.slug);
              return (
                <button
                  key={p.slug}
                  onClick={() => setSelectedProvider(isSelected ? null : p)}
                  className={cn(
                    "relative text-left p-4 rounded-xl border transition-all duration-200",
                    isSelected
                      ? "border-[#1473FF] ring-2 ring-[#1473FF]/20 " + (isLight ? "bg-blue-50/50" : "bg-[#1473FF]/[0.06]")
                      : isAlreadyConnected
                        ? (isLight ? "border-emerald-200 bg-emerald-50/30" : "border-emerald-500/20 bg-emerald-500/[0.04]")
                        : (isLight ? "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm" : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"),
                  )}
                >
                  {isAlreadyConnected && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: p.logoColor + "18" }}>
                      <Radio className="w-4 h-4" style={{ color: p.logoColor }} />
                    </div>
                    <div>
                      <div className={cn("text-sm font-semibold leading-tight", heading)}>{p.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: isLight ? "#e2e8f0" : "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${p.satisfaction}%`,
                        background: p.satisfaction >= 80 ? "#22C55E" : p.satisfaction >= 70 ? "#3B82F6" : p.satisfaction >= 65 ? "#F97316" : "#EF4444",
                      }} />
                    </div>
                    <span className={cn("text-xs font-bold tabular-nums", isLight ? "text-slate-500" : "text-white/50")}>
                      {p.satisfaction}%
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {p.features.slice(0, 3).map(f => (
                      <span key={f} className={cn("text-xs px-1.5 py-0.5 rounded-md font-medium",
                        isLight ? "bg-slate-100 text-slate-500" : "bg-white/[0.04] text-white/30"
                      )}>{f}</span>
                    ))}
                    {p.features.length > 3 && (
                      <span className={cn("text-xs px-1.5 py-0.5 rounded-md font-medium",
                        isLight ? "bg-slate-100 text-slate-400" : "bg-white/[0.04] text-white/25"
                      )}>+{p.features.length - 3}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── API KEY INPUT ── */}
      {selectedProvider && (
        <div className={cn(card, "p-5 space-y-4")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: selectedProvider.logoColor + "18" }}>
              <Radio className="w-5 h-5" style={{ color: selectedProvider.logoColor }} />
            </div>
            <div className="flex-1">
              <div className={cn("text-base font-bold", heading)}>Connect {selectedProvider.name}</div>
              <div className={cn("text-xs", muted)}>Enter your {selectedProvider.name} API key to enable read-only data sync</div>
            </div>
            <button onClick={() => setSelectedProvider(null)} className={cn("p-1.5 rounded-lg", isLight ? "hover:bg-slate-100" : "hover:bg-white/[0.06]")}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className={cn("block mb-1.5", label)}>API Key / Access Token</label>
            <div className="relative">
              <Lock className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isLight ? "text-slate-400" : "text-white/30")} />
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter your ${selectedProvider.name} API key...`}
                className={cn(
                  "w-full pl-10 pr-10 py-3 rounded-xl border text-sm font-mono transition-all",
                  isLight
                    ? "bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 focus:border-[#1473FF] focus:ring-2 focus:ring-[#1473FF]/10"
                    : "bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20 focus:border-[#1473FF] focus:ring-2 focus:ring-[#1473FF]/10",
                )}
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className={cn("absolute right-3 top-1/2 -translate-y-1/2", isLight ? "text-slate-400 hover:text-slate-600" : "text-white/30 hover:text-white/50")}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className={cn("flex items-start gap-2 p-3 rounded-xl", isLight ? "bg-blue-50/50 border border-blue-100" : "bg-[#1473FF]/[0.04] border border-[#1473FF]/10")}>
            <Shield className="w-4 h-4 text-[#1473FF] mt-0.5 flex-shrink-0" />
            <div>
              <div className={cn("text-xs font-semibold", isLight ? "text-blue-900" : "text-[#1473FF]")}>Read-Only Symbiotic Connection</div>
              <div className={cn("text-xs mt-0.5", isLight ? "text-blue-700/70" : "text-[#1473FF]/50")}>
                EusoTrip only reads GPS locations, HOS status, and vehicle diagnostics. We never modify your ELD data or write to your device. Your API key is encrypted at rest.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleConnect}
              disabled={connecting || !apiKey.trim()}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all",
                apiKey.trim()
                  ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white hover:shadow-lg hover:shadow-[#1473FF]/20"
                  : (isLight ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-white/[0.04] text-white/20 cursor-not-allowed"),
              )}
            >
              {connecting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
              ) : (
                <><Zap className="w-4 h-4" /> Connect {selectedProvider.name}</>
              )}
            </button>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(selectedProvider.name + " API documentation")}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("flex items-center gap-1.5 px-4 py-3 rounded-xl border text-xs font-medium transition-all",
                isLight ? "border-slate-200 text-slate-500 hover:bg-slate-50" : "border-white/[0.08] text-white/40 hover:bg-white/[0.04]"
              )}
            >
              <ExternalLink className="w-3.5 h-3.5" /> Docs
            </a>
          </div>
        </div>
      )}

      {/* ── WHAT YOU GET ── */}
      {!isConnected && !selectedProvider && (
        <div className={cn(card, "p-5")}>
          <h4 className={cn("text-sm font-bold mb-3", heading)}>What ELD Integration Unlocks</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Satellite, label: "Live Fleet Map", desc: "Real-time driver positions on satellite map", color: "#1473FF" },
              { icon: Clock, label: "Auto HOS Sync", desc: "Drive/duty clocks pulled from your ELD", color: "#22C55E" },
              { icon: Truck, label: "Active Trip Intel", desc: "Speed, heading, road name during hauls", color: "#F97316" },
              { icon: Shield, label: "FMCSA Compliance", desc: "49 CFR 395 violation monitoring", color: "#8B5CF6" },
            ].map(f => (
              <div key={f.label} className={subcard}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: f.color + "15" }}>
                  <f.icon className="w-4 h-4" style={{ color: f.color }} />
                </div>
                <div className={cn("text-xs font-semibold mb-0.5", heading)}>{f.label}</div>
                <div className={cn("text-xs leading-tight", muted)}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
