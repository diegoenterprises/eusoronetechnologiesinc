import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import HotZoneMap from "@/components/HotZoneMap";
import {
  Flame, TrendingUp, TrendingDown, Truck, MapPin, Fuel, CloudRain,
  AlertTriangle, Shield, ChevronRight, Layers, Activity, Zap,
  BarChart3, RefreshCw, Clock, Navigation, Eye, Filter,
} from "lucide-react";

// ── ZONE ACTION → ROUTE MAPPING (all 12 user types) ──
const ACTION_ROUTES: Record<string, string> = {
  // SHIPPER
  post_load: "/loads/create",
  view_catalysts: "/catalysts",
  set_rate_alert: "/market-pricing",
  // BROKER
  find_catalysts: "/catalyst-vetting",
  post_counter: "/loads/create",
  calc_margin: "/tools/rate-calculator",
  // DRIVER
  accept_load: "/marketplace",
  navigate_zone: "/navigation",
  find_fuel: "/fuel",
  // ESCORT
  bid_escort: "/escort/marketplace",
  view_requirements: "/escort/permits",
  check_clearances: "/escort/permits",
  // DISPATCH
  assign_driver: "/dispatch/board",
  reposition_fleet: "/dispatch/fleet-map",
  view_hos: "/driver/hos",
  // TERMINAL_MANAGER
  manage_appointments: "/terminal/appointments",
  alert_catalysts: "/messages",
  view_docks: "/loading-bays",
  // FACTORING
  view_invoices: "/wallet",
  assess_credit: "/catalyst-vetting",
  adjust_rate: "/tools/rate-calculator",
  // COMPLIANCE_OFFICER
  view_non_compliant: "/violations",
  generate_audit: "/audits",
  send_cap: "/messages",
  // SAFETY_MANAGER
  issue_alert: "/notifications",
  schedule_meeting: "/messages",
  investigate: "/safety/incidents",
  // ADMIN
  view_users: "/admin/users",
  manage_zones: "/hot-zones",
  generate_report: "/admin/analytics",
  // SUPER_ADMIN
  platform_overview: "/super-admin",
  adjust_pricing: "/admin/platform-fees",
  export_data: "/admin/analytics",
  // DEFAULT (CATALYST)
  view_loads: "/marketplace",
  route_fleet: "/fleet",
  set_demand_alert: "/market-pricing",
};

// ── DATA LAYER DEFINITIONS ──
const DATA_LAYERS: Record<string, { label: string; icon: typeof Flame; color: string }> = {
  freight_demand: { label: "Freight Demand", icon: Flame, color: "#EF4444" },
  catalyst_capacity: { label: "Catalyst Availability", icon: Truck, color: "#22C55E" },
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

export default function HotZones({ embedded }: { embedded?: boolean } = {}) {
  const [, navigate] = useLocation();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeLayers, setActiveLayers] = useState<string[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [equipFilter, setEquipFilter] = useState<string>("");
  const [showLayers, setShowLayers] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, refetch } = trpc.hotZones.getRateFeed.useQuery(
    { equipment: equipFilter || undefined, layers: activeLayers.length > 0 ? activeLayers : undefined },
    { refetchInterval: 10000 }
  );

  const zones = data?.zones || [];
  const coldZones = data?.coldZones || [];
  const roleCtx = data?.roleContext;
  const pulse = data?.marketPulse;

  // Force refresh mutation — triggers server-side hot zones + market data sync
  const forceRefreshMutation = (trpc as any).hotZones?.forceRefresh?.useMutation?.({
    onSuccess: () => {
      refetch();
      toast.success("Hot Zones data refreshed", { description: "All zone intelligence sources updated" });
      setIsRefreshing(false);
    },
    onError: (err: any) => {
      refetch();
      toast.error("Refresh error", { description: err.message });
      setIsRefreshing(false);
    },
  });

  const handleForceRefresh = () => {
    setIsRefreshing(true);
    if (forceRefreshMutation?.mutate) {
      forceRefreshMutation.mutate({ dataType: "ZONE_INTELLIGENCE" });
    } else {
      refetch();
      toast.success("Data refreshed");
      setIsRefreshing(false);
    }
  };

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
      {/* ── HEADER — frosted glass, brand gradient accent (hidden when embedded) ── */}
      {!embedded && (
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
                   roleCtx?.perspective === "catalyst_availability" ? "Catalyst Intelligence" :
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
              {/* Equipment Filter */}
              <div className="relative">
                <select
                  value={equipFilter}
                  onChange={(e) => setEquipFilter(e.target.value)}
                  className={`appearance-none pl-7 pr-6 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all outline-none ${
                    equipFilter
                      ? "bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 text-white border border-[#1473FF]/30"
                      : isLight ? "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent" : "bg-white/[0.06] text-white/60 hover:bg-white/[0.1] border border-transparent"
                  }`}
                >
                  <option value="">All Equipment</option>
                  <option value="DRY_VAN">Dry Van</option>
                  <option value="REEFER">Reefer</option>
                  <option value="FLATBED">Flatbed</option>
                  <option value="TANKER">Tanker</option>
                  <option value="HAZMAT">Hazmat</option>
                </select>
                <Filter className={`absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${equipFilter ? "text-[#1473FF]" : isLight ? "text-slate-400" : "text-white/40"}`} />
              </div>
              <button onClick={handleForceRefresh} disabled={isRefreshing}
                className={`p-2 rounded-xl transition-all ${isRefreshing ? "opacity-60 cursor-wait" : ""} ${isLight ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-white/[0.06] text-white/40 hover:bg-white/[0.1]"}`}>
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* ── MARKET PULSE — minimal stat row ── */}
          {pulse && (
            <div className={`flex items-center gap-6 mt-4 pt-3 border-t ${isLight ? "border-slate-100" : "border-white/[0.04]"}`}>
              {(() => {
                const PIC: Record<string, typeof Flame> = { flame: Flame, trending_up: TrendingUp, truck: Truck, bar_chart: BarChart3, zap: Zap, fuel: Fuel, cloud_rain: CloudRain, shield: Shield, alert: AlertTriangle, navigation: Navigation, clock: Clock };
                const stats = pulse.rolePulseStats || [
                  { label: "Loads", value: String(pulse.totalLoads), icon: "flame" },
                  { label: "Avg Rate", value: `$${pulse.avgRate}/mi`, icon: "trending_up" },
                  { label: "L:T Ratio", value: `${pulse.avgRatio}x`, icon: "bar_chart" },
                  { label: "Critical", value: String(pulse.criticalZones), icon: "zap" },
                ];
                return stats.map((s: any, i: number) => {
                  const Icon = PIC[s.icon] || Flame;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${isLight ? "text-slate-400" : "text-white/30"}`} />
                      <span className={`text-xs ${isLight ? "text-slate-500" : "text-white/40"}`}>{s.label}</span>
                      <span className={`text-sm font-semibold tabular-nums ${isLight ? "text-slate-800" : "text-white/90"}`}>{s.value}</span>
                    </div>
                  );
                });
              })()}
              <div className={`ml-auto text-[10px] ${isLight ? "text-slate-400" : "text-white/20"}`}>
                {data?.feedSource}
              </div>
            </div>
          )}
        </div>
      </div>
      )}

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
          <HotZoneMap
            zones={sortedZones}
            coldZones={coldZones}
            roleCtx={roleCtx}
            selectedZone={selectedZone}
            onSelectZone={setSelectedZone}
            isLight={isLight}
            activeLayers={activeLayers}
          />
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
                          {Number(zone.rateChange) >= 0 ? "+" : ""}{zone.rateChangePercent || 0}%
                        </div>
                      </div>
                    </div>

                    {/* Metrics row — role-adaptive */}
                    <div className={`grid grid-cols-3 gap-3 py-3 border-t ${isLight ? "border-slate-100" : "border-white/[0.06]"}`}>
                      {(zone.roleMetrics || []).map((m: any, mi: number) => (
                        <div key={mi}>
                          <div className={`text-[10px] uppercase tracking-wider ${isLight ? "text-slate-400" : "text-white/30"}`}>{m.label}</div>
                          <div className={`text-sm font-semibold tabular-nums ${
                            m.color === "red" ? "text-red-400" : m.color === "amber" ? "text-amber-400" : m.color === "green" ? "text-emerald-400" : isLight ? "text-slate-800" : "text-white/90"
                          }`}>{m.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Equipment pills */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(zone.topEquipment || []).map((eq: string) => (
                        <span key={eq} className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${isLight ? "bg-slate-100 text-slate-500" : "bg-white/[0.06] text-white/40"}`}>
                          {eq.replace("_", " ")}
                        </span>
                      ))}
                      {zone.fuelPrice != null && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${isLight ? "bg-amber-50 text-amber-600" : "bg-amber-500/10 text-amber-400"}`}>
                          Diesel ${Number(zone.fuelPrice || 0).toFixed(2)}
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
                                {(zone.reasons || []).map((r: string, i: number) => (
                                  <div key={i} className={`flex items-center gap-2 text-xs ${isLight ? "text-slate-600" : "text-white/60"}`}>
                                    <div className="w-1 h-1 rounded-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
                                    {r}
                                  </div>
                                ))}
                              </div>
                            </div>
                            {/* Weather alerts */}
                            {(zone.weatherAlerts || []).length > 0 && (
                              <div>
                                <div className={`text-[10px] uppercase tracking-wider mb-1.5 ${isLight ? "text-slate-400" : "text-white/30"}`}>Weather Alerts</div>
                                {(zone.weatherAlerts || []).map((a: { severity: string; event: string }, i: number) => (
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
                                {zone.hazmatClasses?.map((c: string) => (
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
                            {/* Enriched intelligence from 25 data sources */}
                            <div className="flex flex-wrap gap-2">
                              {zone.safetyScore != null && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${zone.safetyScore > 70 ? isLight ? "bg-cyan-50 text-cyan-600" : "bg-cyan-500/10 text-cyan-400" : zone.safetyScore > 40 ? isLight ? "bg-amber-50 text-amber-600" : "bg-amber-500/10 text-amber-400" : isLight ? "bg-red-50 text-red-600" : "bg-red-500/10 text-red-400"}`}>
                                  <Shield className="w-3 h-3" /> Safety {Math.round(zone.safetyScore)}
                                </span>
                              )}
                              {(zone.recentHazmatIncidents || 0) > 0 && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${isLight ? "bg-purple-50 text-purple-600" : "bg-purple-500/10 text-purple-400"}`}>
                                  <AlertTriangle className="w-3 h-3" /> {zone.recentHazmatIncidents} Hazmat Incident{zone.recentHazmatIncidents !== 1 ? "s" : ""}
                                </span>
                              )}
                              {(zone.activeWildfires || 0) > 0 && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${isLight ? "bg-orange-50 text-orange-600" : "bg-orange-500/10 text-orange-400"}`}>
                                  <Flame className="w-3 h-3" /> {zone.activeWildfires} Wildfire{zone.activeWildfires !== 1 ? "s" : ""}
                                </span>
                              )}
                              {zone.femaDisasterActive && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${isLight ? "bg-red-50 text-red-600" : "bg-red-500/10 text-red-400"}`}>
                                  <AlertTriangle className="w-3 h-3" /> FEMA Disaster
                                </span>
                              )}
                              {zone.seismicRiskLevel && zone.seismicRiskLevel !== "Low" && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${zone.seismicRiskLevel === "High" ? isLight ? "bg-red-50 text-red-600" : "bg-red-500/10 text-red-400" : isLight ? "bg-amber-50 text-amber-600" : "bg-amber-500/10 text-amber-400"}`}>
                                  Seismic: {zone.seismicRiskLevel}
                                </span>
                              )}
                              {(zone.epaFacilitiesCount || 0) > 0 && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${isLight ? "bg-emerald-50 text-emerald-600" : "bg-emerald-500/10 text-emerald-400"}`}>
                                  {zone.epaFacilitiesCount} EPA Facilities
                                </span>
                              )}
                              {(zone.carriersWithViolations || 0) > 0 && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${isLight ? "bg-red-50 text-red-600" : "bg-red-500/10 text-red-400"}`}>
                                  {zone.carriersWithViolations} Carrier Violation{zone.carriersWithViolations !== 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                            {/* Role actions */}
                            {roleCtx?.zoneActions && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {roleCtx.zoneActions.map(action => (
                                  <button key={action}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const route = ACTION_ROUTES[action];
                                      if (!route) return;
                                      const q = new URLSearchParams();
                                      // Core zone context — always passed
                                      if (zone.zoneName) q.set("zone", zone.zoneName);
                                      if (zone.state) q.set("state", zone.state);
                                      if (zone.center?.lat) q.set("lat", String(zone.center.lat));
                                      if (zone.center?.lng) q.set("lng", String(zone.center.lng));
                                      // Action-specific enrichment
                                      if (action === "post_load" || action === "post_counter") {
                                        // Pre-fill origin city for load creation
                                        if (zone.zoneName) q.set("origin", `${zone.zoneName}, ${zone.state || ""}`);
                                        if (zone.liveRate) q.set("suggestedRate", String(zone.liveRate));
                                        if (zone.topEquipment?.[0]) q.set("equipment", zone.topEquipment[0]);
                                      }
                                      if (action === "set_rate_alert" || action === "set_demand_alert") {
                                        if (zone.liveRate) q.set("currentRate", String(zone.liveRate));
                                        if (zone.demandLevel) q.set("demandLevel", zone.demandLevel);
                                        q.set("alertType", action === "set_rate_alert" ? "rate" : "demand");
                                      }
                                      if (action === "view_catalysts" || action === "find_catalysts") {
                                        if (zone.topEquipment?.length) q.set("equipment", zone.topEquipment.join(","));
                                        if (zone.liveRate) q.set("maxRate", String(Math.round(Number(zone.liveRate) * 1.15)));
                                      }
                                      if (action === "view_loads" || action === "accept_load") {
                                        if (zone.topEquipment?.length) q.set("equipment", zone.topEquipment.join(","));
                                        if (zone.demandLevel) q.set("demand", zone.demandLevel);
                                      }
                                      if (action === "navigate_zone" || action === "find_fuel") {
                                        if (zone.fuelPrice) q.set("fuelPrice", String(zone.fuelPrice));
                                      }
                                      if (action === "assign_driver" || action === "reposition_fleet") {
                                        q.set("demandLevel", zone.demandLevel || "");
                                        if (zone.liveLoads) q.set("openLoads", String(zone.liveLoads));
                                      }
                                      const qs = q.toString();
                                      const shortZone = zone.zoneName?.split("/")[0]?.split(",")[0]?.trim() || zone.state || "zone";
                                      toast.info(`${action.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}`, {
                                        description: `${shortZone} · $${zone.liveRate}/mi · ${zone.demandLevel}`,
                                      });
                                      navigate(qs ? `${route}?${qs}` : route);
                                    }}
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
                      style={{ width: `${Math.min((zone.liveSurge || 1) / 2, 1) * 100}%`, opacity: (zone.liveSurge || 1) > 1.1 ? 1 : 0.3 }}
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
