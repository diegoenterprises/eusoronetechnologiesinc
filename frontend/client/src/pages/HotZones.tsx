import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, TrendingUp, TrendingDown, Truck, MapPin, Fuel, CloudRain,
  AlertTriangle, Shield, ChevronRight, Layers, Activity, Zap,
  BarChart3, RefreshCw, Clock, Navigation, Eye, Filter,
} from "lucide-react";

// ── DATA LAYER DEFINITIONS ──
const DATA_LAYERS: Record<string, { label: string; icon: typeof Flame; color: string }> = {
  freight_demand: { label: "Freight Demand", icon: Flame, color: "#EF4444" },
  carrier_capacity: { label: "Carrier Availability", icon: Truck, color: "#22C55E" },
  rate_heat: { label: "Rate Intelligence", icon: TrendingUp, color: "#F59E0B" },
  fuel_prices: { label: "Fuel Prices", icon: Fuel, color: "#A16207" },
  fuel_stations: { label: "Fuel Stations", icon: Fuel, color: "#84CC16" },
  weather_risk: { label: "Weather Risk", icon: CloudRain, color: "#3B82F6" },
  compliance_risk: { label: "Compliance Risk", icon: AlertTriangle, color: "#EF4444" },
  incident_history: { label: "Incident History", icon: Shield, color: "#7C3AED" },
  terminal_throughput: { label: "Facility Throughput", icon: BarChart3, color: "#06B6D4" },
  escort_corridors: { label: "Escort Demand", icon: Navigation, color: "#8B5CF6" },
  spread_opportunity: { label: "Margin Zones", icon: BarChart3, color: "#10B981" },
  factoring_risk: { label: "Credit Risk", icon: AlertTriangle, color: "#F97316" },
  safety_score: { label: "Safety Score", icon: Shield, color: "#22D3EE" },
  driver_hos: { label: "HOS Availability", icon: Clock, color: "#A855F7" },
};

const DEMAND_COLORS: Record<string, { bg: string; text: string; ring: string; glow: string }> = {
  CRITICAL: { bg: "bg-red-500/15", text: "text-red-400", ring: "ring-red-500/30", glow: "shadow-red-500/20" },
  HIGH: { bg: "bg-orange-500/15", text: "text-orange-400", ring: "ring-orange-500/30", glow: "shadow-orange-500/20" },
  ELEVATED: { bg: "bg-amber-500/15", text: "text-amber-400", ring: "ring-amber-500/30", glow: "shadow-amber-500/20" },
};

const DEMAND_COLORS_LIGHT: Record<string, { bg: string; text: string; ring: string }> = {
  CRITICAL: { bg: "bg-red-50", text: "text-red-600", ring: "ring-red-200" },
  HIGH: { bg: "bg-orange-50", text: "text-orange-600", ring: "ring-orange-200" },
  ELEVATED: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-200" },
};

export default function HotZones() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeLayers, setActiveLayers] = useState<string[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [equipFilter, setEquipFilter] = useState<string>("");
  const [showLayers, setShowLayers] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, refetch } = trpc.hotZones.getRateFeed.useQuery(
    { equipment: equipFilter || undefined, layers: activeLayers.length > 0 ? activeLayers : undefined },
    { refetchInterval: 10000 }
  );

  const zones = data?.zones || [];
  const coldZones = data?.coldZones || [];
  const roleCtx = data?.roleContext;
  const pulse = data?.marketPulse;

  useEffect(() => {
    if (roleCtx?.defaultLayers && activeLayers.length === 0) {
      setActiveLayers(roleCtx.defaultLayers);
    }
  }, [roleCtx?.defaultLayers]);

  const toggleLayer = (id: string) => {
    setActiveLayers(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };

  const sortedZones = useMemo(() => {
    return [...zones].sort((a, b) => {
      const order: Record<string, number> = { CRITICAL: 3, HIGH: 2, ELEVATED: 1 };
      return (order[b.demandLevel] || 0) - (order[a.demandLevel] || 0);
    });
  }, [zones]);

  return (
    <div className={`min-h-screen ${isLight ? "bg-slate-50" : "bg-[#0a0a0f]"}`}>
      {/* ── HEADER — frosted glass, brand gradient accent ── */}
      <div className={`sticky top-0 z-30 backdrop-blur-2xl border-b ${isLight ? "bg-white/80 border-slate-200/60" : "bg-[#0a0a0f]/80 border-white/[0.04]"}`}>
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1473FF] to-[#BE01FF] flex items-center justify-center shadow-lg shadow-[#1473FF]/20">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-semibold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                  {roleCtx?.perspective === "freight_demand" ? "Demand Intelligence" :
                   roleCtx?.perspective === "carrier_availability" ? "Carrier Intelligence" :
                   roleCtx?.perspective === "spread_opportunity" ? "Margin Intelligence" :
                   roleCtx?.perspective === "driver_opportunity" ? "Driver Opportunities" :
                   roleCtx?.perspective === "dispatch_intelligence" ? "Dispatch Intelligence" :
                   roleCtx?.perspective === "oversized_demand" ? "Escort Intelligence" :
                   roleCtx?.perspective === "facility_throughput" ? "Facility Intelligence" :
                   roleCtx?.perspective === "invoice_intelligence" ? "Invoice Intelligence" :
                   roleCtx?.perspective === "compliance_risk" ? "Compliance Intelligence" :
                   roleCtx?.perspective === "safety_risk" ? "Safety Intelligence" :
                   roleCtx?.perspective === "platform_health" ? "Platform Intelligence" :
                   roleCtx?.perspective === "executive_intelligence" ? "Executive Intelligence" :
                   "Hot Zones"}
                </h1>
                <p className={`text-xs mt-0.5 ${isLight ? "text-slate-500" : "text-white/40"}`}>
                  {roleCtx?.description || "Geographic demand intelligence"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowLayers(!showLayers)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${showLayers
                  ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-lg shadow-[#1473FF]/25"
                  : isLight ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-white/[0.06] text-white/60 hover:bg-white/[0.1]"
                }`}>
                <Layers className="w-3.5 h-3.5" /> Layers
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${showLayers ? "bg-white/20" : isLight ? "bg-slate-200" : "bg-white/10"}`}>
                  {activeLayers.length}
                </span>
              </button>
              <button onClick={() => refetch()}
                className={`p-2 rounded-xl transition-all ${isLight ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-white/[0.06] text-white/40 hover:bg-white/[0.1]"}`}>
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── MARKET PULSE — minimal stat row ── */}
          {pulse && (
            <div className={`flex items-center gap-6 mt-4 pt-3 border-t ${isLight ? "border-slate-100" : "border-white/[0.04]"}`}>
              {[
                { label: roleCtx?.primaryMetric || "Loads", value: pulse.totalLoads.toLocaleString(), icon: Flame },
                { label: "Avg Rate", value: `$${pulse.avgRate}/mi`, icon: TrendingUp },
                { label: "L:T Ratio", value: `${pulse.avgRatio}x`, icon: BarChart3 },
                { label: "Critical", value: String(pulse.criticalZones), icon: Zap },
                ...(pulse.avgFuelPrice ? [{ label: "Diesel", value: `$${pulse.avgFuelPrice}`, icon: Fuel }] : []),
                ...(pulse.activeWeatherAlerts > 0 ? [{ label: "Alerts", value: String(pulse.activeWeatherAlerts), icon: CloudRain }] : []),
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <s.icon className={`w-3.5 h-3.5 ${isLight ? "text-slate-400" : "text-white/30"}`} />
                  <span className={`text-xs ${isLight ? "text-slate-500" : "text-white/40"}`}>{s.label}</span>
                  <span className={`text-sm font-semibold tabular-nums ${isLight ? "text-slate-800" : "text-white/90"}`}>{s.value}</span>
                </div>
              ))}
              <div className={`ml-auto text-[10px] ${isLight ? "text-slate-400" : "text-white/20"}`}>
                {data?.feedSource}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── LAYER TOGGLES — expandable pill row ── */}
      <AnimatePresence>
        {showLayers && roleCtx && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={`overflow-hidden border-b ${isLight ? "bg-white/60 border-slate-200/60" : "bg-white/[0.02] border-white/[0.04]"}`}
          >
            <div className="max-w-[1600px] mx-auto px-6 py-3 flex flex-wrap gap-2">
              {(roleCtx.defaultLayers || Object.keys(DATA_LAYERS)).map(layerId => {
                const layer = DATA_LAYERS[layerId];
                if (!layer) return null;
                const Icon = layer.icon;
                const active = activeLayers.includes(layerId);
                return (
                  <button key={layerId} onClick={() => toggleLayer(layerId)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${active
                      ? `text-white shadow-sm` : isLight ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-white/[0.05] text-white/40 hover:bg-white/[0.08]"
                    }`}
                    style={active ? { backgroundColor: layer.color + "22", color: layer.color, border: `1px solid ${layer.color}44` } : {}}>
                    <Icon className="w-3 h-3" />
                    {layer.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INTERACTIVE HEATMAP ── */}
      {!isLoading && zones.length > 0 && (
        <div className="max-w-[1600px] mx-auto px-6 pt-6">
          <div
            ref={mapRef}
            className={`relative rounded-2xl border overflow-hidden ${isLight ? "bg-slate-100/50 border-slate-200/80" : "bg-white/[0.02] border-white/[0.06]"}`}
            style={{ height: 340 }}
          >
            <svg viewBox="0 0 960 340" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
              {/* US outline hint — subtle grid lines */}
              <defs>
                <radialGradient id="hotGlow">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="warmGlow">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="coldGlow">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Cold zones — subtle blue dots */}
              {coldZones.map((cz: any) => {
                const x = ((cz.center?.lng || -95) + 125) * (960 / 62);
                const y = (50 - (cz.center?.lat || 40)) * (340 / 26) + 20;
                return (
                  <g key={cz.id}>
                    <circle cx={x} cy={y} r={18} fill="url(#coldGlow)" />
                    <circle cx={x} cy={y} r={4} fill={isLight ? "#93C5FD" : "#3B82F6"} opacity={0.5} />
                  </g>
                );
              })}

              {/* Hot zones — sized by ratio, colored by demand */}
              {sortedZones.map((zone) => {
                const x = ((zone.center?.lng || -95) + 125) * (960 / 62);
                const y = (50 - (zone.center?.lat || 40)) * (340 / 26) + 20;
                const r = Math.max(6, Math.min(18, zone.liveRatio * 5));
                const isSel = selectedZone === zone.zoneId;
                const demandColor = zone.demandLevel === "CRITICAL" ? "#EF4444" : zone.demandLevel === "HIGH" ? "#F97316" : "#F59E0B";
                const glowId = zone.demandLevel === "CRITICAL" ? "hotGlow" : "warmGlow";
                return (
                  <g
                    key={zone.zoneId}
                    onClick={(e) => { e.stopPropagation(); setSelectedZone(isSel ? null : zone.zoneId); }}
                    className="cursor-pointer"
                  >
                    {/* Glow */}
                    <circle cx={x} cy={y} r={r * 3} fill={`url(#${glowId})`}>
                      {zone.demandLevel === "CRITICAL" && (
                        <animate attributeName="r" values={`${r * 2.5};${r * 3.5};${r * 2.5}`} dur="2s" repeatCount="indefinite" />
                      )}
                    </circle>
                    {/* Ring */}
                    {isSel && (
                      <circle cx={x} cy={y} r={r + 4} fill="none" stroke="#1473FF" strokeWidth="1.5" opacity="0.6">
                        <animate attributeName="r" values={`${r + 3};${r + 6};${r + 3}`} dur="1.5s" repeatCount="indefinite" />
                      </circle>
                    )}
                    {/* Dot */}
                    <circle cx={x} cy={y} r={r} fill={demandColor} opacity={0.85} stroke={isSel ? "#1473FF" : "none"} strokeWidth={isSel ? 2 : 0} />
                    {/* Label */}
                    <text x={x} y={y - r - 5} textAnchor="middle" className="select-none pointer-events-none" fill={isLight ? "#334155" : "#ffffff"} fontSize="8" fontWeight="600" opacity={isSel ? 1 : 0.7}>
                      {zone.zoneName.split("/")[0].split(",")[0].trim()}
                    </text>
                    {/* Rate badge */}
                    <text x={x} y={y + 3} textAnchor="middle" className="select-none pointer-events-none" fill="white" fontSize="7" fontWeight="700">
                      ${zone.liveRate}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Map legend */}
            <div className={`absolute bottom-3 left-4 flex items-center gap-4 text-[10px] ${isLight ? "text-slate-500" : "text-white/40"}`}>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Critical
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500" /> High
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Elevated
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-400 opacity-50" /> Cold
              </div>
            </div>

            {/* Map subtitle */}
            <div className={`absolute top-3 left-4 text-[10px] font-medium ${isLight ? "text-slate-400" : "text-white/25"}`}>
              Interactive Demand Heatmap — click zones to inspect
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN BODY ── */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 rounded-full border-2 border-[#1473FF]/30 border-t-[#1473FF] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedZones.map((zone, idx) => {
              const dc = isLight ? DEMAND_COLORS_LIGHT[zone.demandLevel] : DEMAND_COLORS[zone.demandLevel];
              const isSelected = selectedZone === zone.zoneId;
              return (
                <motion.div
                  key={zone.zoneId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => setSelectedZone(isSelected ? null : zone.zoneId)}
                  className={`group relative cursor-pointer rounded-2xl border transition-all duration-300 ${isSelected
                    ? isLight ? "border-[#1473FF]/30 bg-white shadow-xl shadow-[#1473FF]/10 ring-1 ring-[#1473FF]/20" : "border-[#1473FF]/40 bg-white/[0.06] shadow-xl shadow-[#1473FF]/10 ring-1 ring-[#1473FF]/20"
                    : isLight ? "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-lg" : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.1]"
                  }`}
                >
                  <div className="p-5">
                    {/* Zone header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold tracking-wide uppercase ring-1 ${dc?.bg} ${dc?.text} ${dc?.ring}`}>
                            {zone.demandLevel}
                          </span>
                          {zone.weatherRiskLevel !== "LOW" && (
                            <CloudRain className={`w-3.5 h-3.5 ${zone.weatherRiskLevel === "HIGH" ? "text-red-400" : "text-amber-400"}`} />
                          )}
                        </div>
                        <h3 className={`text-base font-semibold tracking-tight truncate ${isLight ? "text-slate-900" : "text-white"}`}>
                          {zone.zoneName}
                        </h3>
                        <p className={`text-xs mt-0.5 ${isLight ? "text-slate-500" : "text-white/40"}`}>
                          {zone.state} · {zone.peakHours}
                        </p>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <div className={`text-lg font-bold tabular-nums ${isLight ? "text-slate-900" : "text-white"}`}>
                          ${zone.liveRate}
                          <span className={`text-xs font-normal ${isLight ? "text-slate-400" : "text-white/30"}`}>/mi</span>
                        </div>
                        <div className={`flex items-center justify-end gap-0.5 text-xs font-medium tabular-nums ${zone.rateChange >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                          {zone.rateChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {zone.rateChange >= 0 ? "+" : ""}{zone.rateChangePercent}%
                        </div>
                      </div>
                    </div>

                    {/* Metrics row */}
                    <div className={`grid grid-cols-3 gap-3 py-3 border-t ${isLight ? "border-slate-100" : "border-white/[0.06]"}`}>
                      <div>
                        <div className={`text-[10px] uppercase tracking-wider ${isLight ? "text-slate-400" : "text-white/30"}`}>Loads</div>
                        <div className={`text-sm font-semibold tabular-nums ${isLight ? "text-slate-800" : "text-white/90"}`}>{zone.liveLoads}</div>
                      </div>
                      <div>
                        <div className={`text-[10px] uppercase tracking-wider ${isLight ? "text-slate-400" : "text-white/30"}`}>Trucks</div>
                        <div className={`text-sm font-semibold tabular-nums ${isLight ? "text-slate-800" : "text-white/90"}`}>{zone.liveTrucks}</div>
                      </div>
                      <div>
                        <div className={`text-[10px] uppercase tracking-wider ${isLight ? "text-slate-400" : "text-white/30"}`}>L:T Ratio</div>
                        <div className={`text-sm font-semibold tabular-nums ${zone.liveRatio > 2.5 ? "text-red-400" : zone.liveRatio > 1.8 ? "text-amber-400" : isLight ? "text-slate-800" : "text-white/90"}`}>
                          {zone.liveRatio}x
                        </div>
                      </div>
                    </div>

                    {/* Equipment pills */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {zone.topEquipment.map(eq => (
                        <span key={eq} className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${isLight ? "bg-slate-100 text-slate-500" : "bg-white/[0.06] text-white/40"}`}>
                          {eq.replace("_", " ")}
                        </span>
                      ))}
                      {zone.fuelPrice && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${isLight ? "bg-amber-50 text-amber-600" : "bg-amber-500/10 text-amber-400"}`}>
                          Diesel ${zone.fuelPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className={`mt-3 pt-3 border-t space-y-3 ${isLight ? "border-slate-100" : "border-white/[0.06]"}`}>
                            {/* Reasons */}
                            <div>
                              <div className={`text-[10px] uppercase tracking-wider mb-1.5 ${isLight ? "text-slate-400" : "text-white/30"}`}>Why it's hot</div>
                              <div className="space-y-1">
                                {zone.reasons.map((r, i) => (
                                  <div key={i} className={`flex items-center gap-2 text-xs ${isLight ? "text-slate-600" : "text-white/60"}`}>
                                    <div className="w-1 h-1 rounded-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
                                    {r}
                                  </div>
                                ))}
                              </div>
                            </div>
                            {/* Weather alerts */}
                            {zone.weatherAlerts.length > 0 && (
                              <div>
                                <div className={`text-[10px] uppercase tracking-wider mb-1.5 ${isLight ? "text-slate-400" : "text-white/30"}`}>Weather Alerts</div>
                                {zone.weatherAlerts.map((a, i) => (
                                  <div key={i} className={`flex items-center gap-2 text-xs ${a.severity === "Extreme" ? "text-red-400" : "text-amber-400"}`}>
                                    <CloudRain className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{a.event}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Hazmat + Compliance */}
                            {(zone.hazmatClasses?.length || 0) > 0 && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] uppercase tracking-wider ${isLight ? "text-slate-400" : "text-white/30"}`}>Hazmat:</span>
                                {zone.hazmatClasses?.map(c => (
                                  <span key={c} className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${isLight ? "bg-red-50 text-red-500" : "bg-red-500/10 text-red-400"}`}>
                                    Class {c}
                                  </span>
                                ))}
                              </div>
                            )}
                            {zone.complianceRiskScore !== undefined && (
                              <div className={`flex items-center gap-2 text-xs ${isLight ? "text-slate-600" : "text-white/50"}`}>
                                <Shield className="w-3.5 h-3.5" />
                                Compliance Risk Score: <span className={`font-semibold ${zone.complianceRiskScore > 50 ? "text-red-400" : "text-amber-400"}`}>{zone.complianceRiskScore}</span>
                              </div>
                            )}
                            {/* Role actions */}
                            {roleCtx?.zoneActions && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {roleCtx.zoneActions.map(action => (
                                  <button key={action}
                                    className="px-3 py-1.5 rounded-xl text-[11px] font-medium bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-sm shadow-[#1473FF]/20 hover:shadow-md hover:shadow-[#1473FF]/30 transition-all">
                                    {action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Surge indicator bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] transition-all duration-500"
                      style={{ width: `${Math.min(zone.liveSurge / 2, 1) * 100}%`, opacity: zone.liveSurge > 1.1 ? 1 : 0.3 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── COLD ZONES — subtle footer ── */}
        {coldZones.length > 0 && (
          <div className="mt-8">
            <h2 className={`text-sm font-medium mb-3 ${isLight ? "text-slate-400" : "text-white/20"}`}>
              Cold Zones — Excess Capacity
            </h2>
            <div className="flex flex-wrap gap-2">
              {coldZones.map((cz: any) => (
                <div key={cz.id} className={`px-3 py-2 rounded-xl text-xs ${isLight ? "bg-blue-50/50 text-slate-500 border border-blue-100" : "bg-blue-500/[0.04] text-white/30 border border-blue-500/10"}`}>
                  <span className="font-medium">{cz.name}</span>
                  <span className={`ml-2 tabular-nums ${isLight ? "text-blue-500" : "text-blue-400/60"}`}>${cz.liveRate}/mi</span>
                  <span className="ml-1 opacity-60">· {cz.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
