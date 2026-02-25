import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Shield, TrendingUp, Leaf, Activity, Heart, Scale,
  AlertTriangle, ChevronRight, BarChart3, Zap, Eye,
  Calendar, ArrowUpRight, ArrowDownRight, Minus, Target,
  Truck, Globe, Clock, CheckCircle2, XCircle, Info,
  Thermometer, Wind, ShieldAlert, FileWarning, Lock,
  ArrowLeft,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// FUTURE-READY 2026 MARKET INTELLIGENCE DASHBOARD
// Sources: C.H. Robinson, WWEX Group, Magaya/Adelante
// ═══════════════════════════════════════════════════════════════

type Tab = "overview" | "theft" | "rates" | "emissions" | "resilience" | "wellness" | "tariffs" | "calendar";

export default function MarketIntelligence2026({ embedded }: { embedded?: boolean } = {}) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [laneOrigin, setLaneOrigin] = useState("TX");
  const [laneDest, setLaneDest] = useState("CA");
  const [commodity, setCommodity] = useState("general");
  const [distance, setDistance] = useState(1500);
  const [weight, setWeight] = useState(40000);
  const [equipment, setEquipment] = useState("dry_van");

  // Resilience — user-configurable inputs (company-specific)
  const [resNumCarriers, setResNumCarriers] = useState(3);
  const [resModesUsed, setResModesUsed] = useState(1);
  const [resLeadTime, setResLeadTime] = useState(5);
  const [resHasVisibility, setResHasVisibility] = useState(false);
  const [resContingency, setResContingency] = useState(false);
  const [resDigitalized, setResDigitalized] = useState(30);
  const [resSubmitted, setResSubmitted] = useState(false);

  // Wellness — driver-specific inputs
  const [wellHoursWorked, setWellHoursWorked] = useState(40);
  const [wellDaysOnRoad, setWellDaysOnRoad] = useState(5);
  const [wellSleepHours, setWellSleepHours] = useState(7);
  const [wellHadBreak, setWellHadBreak] = useState(true);
  const [wellConsecDays, setWellConsecDays] = useState(3);
  const [wellDistToday, setWellDistToday] = useState(200);
  const [wellSubmitted, setWellSubmitted] = useState(false);

  // Auto-populate from user's real load history
  const SUPPORTED_STATES = ["TX","CA","FL","IL","GA","OH","PA","NJ","NY","WA","LA","CO","AZ","NV","TN","NC"];
  const SUPPORTED_COMMODITIES = ["general","electronics","pharmaceuticals","auto parts","food and beverage","alcohol","clothing","building materials","metals"];
  const SUPPORTED_EQUIPMENT = ["dry_van","reefer","flatbed","tanker"];
  const laneDefaults = (trpc as any).marketIntelligence?.getMyLaneDefaults?.useQuery?.() || { data: null };
  useEffect(() => {
    const d = laneDefaults.data;
    if (!d) return;
    if (d.originState && SUPPORTED_STATES.includes(d.originState)) setLaneOrigin(d.originState);
    if (d.destinationState && SUPPORTED_STATES.includes(d.destinationState)) setLaneDest(d.destinationState);
    if (d.distance && d.distance > 0) setDistance(d.distance);
    if (d.weight && d.weight > 0) setWeight(d.weight);
    if (d.equipment && SUPPORTED_EQUIPMENT.includes(d.equipment)) setEquipment(d.equipment);
    if (d.commodity && SUPPORTED_COMMODITIES.includes(d.commodity)) setCommodity(d.commodity);
  }, [laneDefaults.data]);

  const outlook = (trpc as any).marketIntelligence?.get2026Outlook?.useQuery?.() || { data: null };
  const theftRisk = (trpc as any).marketIntelligence?.getTheftRisk?.useQuery?.(
    { originState: laneOrigin, destinationState: laneDest, commodity, weight },
    { enabled: activeTab === "theft" || activeTab === "overview" }
  ) || { data: null };
  const marketIntel = (trpc as any).marketIntelligence?.getMarketIntel?.useQuery?.(
    { originState: laneOrigin, destinationState: laneDest, equipmentType: equipment, distance },
    { enabled: activeTab === "rates" || activeTab === "overview" }
  ) || { data: null };
  const emissions = (trpc as any).marketIntelligence?.getEmissions?.useQuery?.(
    { distanceMiles: distance, weightLbs: weight, equipmentType: equipment },
    { enabled: activeTab === "emissions" || activeTab === "overview" }
  ) || { data: null };
  const resilience = (trpc as any).marketIntelligence?.getResilience?.useQuery?.(
    { numCarriers: resNumCarriers, modesUsed: resModesUsed, avgLeadTimeDays: resLeadTime, hasVisibility: resHasVisibility, hasContingencyRoutes: resContingency, digitalizedPct: resDigitalized },
    { enabled: activeTab === "resilience" && resSubmitted }
  ) || { data: null };
  const wellness = (trpc as any).marketIntelligence?.getDriverWellness?.useQuery?.(
    { hoursWorkedThisWeek: wellHoursWorked, daysOnRoad: wellDaysOnRoad, avgSleepHours: wellSleepHours, hasHadBreakToday: wellHadBreak, consecutiveDrivingDays: wellConsecDays, distanceTodayMiles: wellDistToday },
    { enabled: activeTab === "wellness" && wellSubmitted }
  ) || { data: null };
  const tariffs = (trpc as any).marketIntelligence?.getTariffImpact?.useQuery?.(
    { originCountry: "US", destCountry: "US", commodity },
    { enabled: activeTab === "tariffs" || activeTab === "overview" }
  ) || { data: null };
  const calendar = (trpc as any).marketIntelligence?.getSeasonalCalendar?.useQuery?.(undefined,
    { enabled: activeTab === "calendar" || activeTab === "overview" }
  ) || { data: null };

  const tabs: { id: Tab; label: string; icon: any; color: string }[] = [
    { id: "overview", label: "Overview", icon: BarChart3, color: "text-white" },
    { id: "theft", label: "Cargo Theft", icon: ShieldAlert, color: "text-red-400" },
    { id: "rates", label: "Rate Intel", icon: TrendingUp, color: "text-cyan-400" },
    { id: "emissions", label: "Emissions", icon: Leaf, color: "text-emerald-400" },
    { id: "resilience", label: "Resilience", icon: Shield, color: "text-violet-400" },
    { id: "wellness", label: "Wellness", icon: Heart, color: "text-pink-400" },
    { id: "tariffs", label: "Tariffs", icon: Globe, color: "text-amber-400" },
    { id: "calendar", label: "Calendar", icon: Calendar, color: "text-blue-400" },
  ];

  function ScoreRing({ score, size = 64, color = "#22d3ee", label }: { score: number; size?: number; color?: string; label: string }) {
    const r = (size - 8) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - Math.min(score, 100) / 100);
    return (
      <div className="flex flex-col items-center gap-1">
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
        </svg>
        <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
          <span className="text-lg font-bold text-white">{score}</span>
        </div>
        <span className="text-[10px] text-slate-400 mt-1">{label}</span>
      </div>
    );
  }

  function RiskBadge({ level }: { level: string }) {
    const colors: Record<string, string> = {
      LOW: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      MODERATE: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      CRITICAL: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors[level] || colors.MODERATE}`}>{level}</span>;
  }

  function TrendArrow({ trend }: { trend: string }) {
    if (trend === "RISING") return <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />;
    if (trend === "DECLINING") return <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />;
    return <Minus className="w-3.5 h-3.5 text-slate-400" />;
  }

  return (
    <div className={embedded ? "text-white" : "min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white"}>
      {/* Header — hidden when embedded inside Market Intelligence */}
      {!embedded && (
        <div className="border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => window.history.back()} className="p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors">
                  <ArrowLeft className="w-4 h-4 text-slate-400" />
                </button>
                <div>
                  <h1 className="text-lg font-semibold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-cyan-400" />
                    2026 Market Intelligence
                  </h1>
                  <p className="text-[11px] text-slate-500">Powered by C.H. Robinson, WWEX Group, Magaya industry data</p>
                </div>
              </div>
              {/* Lane & load parameters — these drive all scores */}
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <select value={laneOrigin} onChange={e => setLaneOrigin(e.target.value)} className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs" title="Origin state">
                  {["TX","CA","FL","IL","GA","OH","PA","NJ","NY","WA","LA","CO","AZ","NV","TN","NC"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronRight className="w-3 h-3 text-slate-500" />
                <select value={laneDest} onChange={e => setLaneDest(e.target.value)} className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs" title="Destination state">
                  {["CA","TX","FL","IL","GA","OH","PA","NJ","NY","WA","LA","CO","AZ","NV","TN","NC"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input type="number" value={distance} onChange={e => setDistance(Number(e.target.value))} className="w-16 bg-slate-800/60 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs" title="Distance (mi)" />
                <span className="text-slate-500">mi</span>
                <span className="text-slate-600">|</span>
                <select value={equipment} onChange={e => setEquipment(e.target.value)} className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs" title="Equipment type">
                  <option value="dry_van">Dry Van</option>
                  <option value="reefer">Reefer</option>
                  <option value="flatbed">Flatbed</option>
                  <option value="tanker">Tanker</option>
                </select>
                <select value={commodity} onChange={e => setCommodity(e.target.value)} className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs" title="Commodity type">
                  <option value="general">General Freight</option>
                  <option value="electronics">Electronics</option>
                  <option value="pharmaceuticals">Pharmaceuticals</option>
                  <option value="auto parts">Auto Parts</option>
                  <option value="food and beverage">Food & Beverage</option>
                  <option value="alcohol">Alcohol</option>
                  <option value="clothing">Clothing</option>
                  <option value="building materials">Building Materials</option>
                  <option value="metals">Metals</option>
                </select>
                <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} className="w-20 bg-slate-800/60 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs" title="Weight (lbs)" />
                <span className="text-slate-500">lbs</span>
              </div>
            </div>
            {/* Tabs */}
            <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === t.id ? "bg-slate-700/60 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/40"}`}>
                  <t.icon className={`w-3.5 h-3.5 ${activeTab === t.id ? t.color : ""}`} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Embedded compact header: lane & load parameters + tabs */}
      {embedded && (
        <div className="mb-4">
          <div className="mb-3">
            <p className="text-[11px] text-slate-500 mb-2">C.H. Robinson, WWEX Group, Magaya industry data</p>
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <select value={laneOrigin} onChange={e => setLaneOrigin(e.target.value)} className="bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white/80">
                {["TX","CA","FL","IL","GA","OH","PA","NJ","NY","WA","LA","CO","AZ","NV","TN","NC"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronRight className="w-3 h-3 text-white/30" />
              <select value={laneDest} onChange={e => setLaneDest(e.target.value)} className="bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white/80">
                {["CA","TX","FL","IL","GA","OH","PA","NJ","NY","WA","LA","CO","AZ","NV","TN","NC"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input type="number" value={distance} onChange={e => setDistance(Number(e.target.value))} className="w-16 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white/80" />
              <span className="text-white/30">mi</span>
              <span className="text-white/10">|</span>
              <select value={equipment} onChange={e => setEquipment(e.target.value)} className="bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white/80">
                <option value="dry_van">Dry Van</option>
                <option value="reefer">Reefer</option>
                <option value="flatbed">Flatbed</option>
                <option value="tanker">Tanker</option>
              </select>
              <select value={commodity} onChange={e => setCommodity(e.target.value)} className="bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white/80">
                <option value="general">General Freight</option>
                <option value="electronics">Electronics</option>
                <option value="pharmaceuticals">Pharmaceuticals</option>
                <option value="auto parts">Auto Parts</option>
                <option value="food and beverage">Food & Beverage</option>
                <option value="alcohol">Alcohol</option>
                <option value="clothing">Clothing</option>
                <option value="building materials">Building Materials</option>
                <option value="metals">Metals</option>
              </select>
              <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} className="w-20 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white/80" />
              <span className="text-white/30">lbs</span>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === t.id ? "bg-slate-200 dark:bg-white/[0.08] text-white" : "text-white/40 hover:text-white/70 hover:bg-slate-50 dark:hover:bg-white/[0.04]"}`}>
                <t.icon className={`w-3.5 h-3.5 ${activeTab === t.id ? t.color : ""}`} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={embedded ? "space-y-6" : "max-w-7xl mx-auto px-4 py-6 space-y-6"}>

        {/* ══════════ OVERVIEW TAB ══════════ */}
        {activeTab === "overview" && (
          <>
            {/* Key Themes Grid */}
            {outlook.data && (
              <div>
                <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  2026 Industry Outlook
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {outlook.data.keyThemes?.slice(0, 6).map((t: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/40 transition-all">
                      <p className="text-xs font-semibold text-white mb-1">{t.theme}</p>
                      <p className="text-[10px] text-slate-400 leading-relaxed">{t.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lane-Specific Estimates — driven by the parameters above */}
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Estimates for {laneOrigin} → {laneDest} · {distance} mi · {equipment === "dry_van" ? "Dry Van" : equipment === "reefer" ? "Reefer" : equipment === "flatbed" ? "Flatbed" : "Tanker"} · {commodity === "general" ? "General Freight" : commodity} · {weight.toLocaleString()} lbs</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 flex flex-col items-center relative">
                  <ScoreRing score={theftRisk.data?.overallScore || 0} color={theftRisk.data?.overallScore > 50 ? "#f87171" : theftRisk.data?.overallScore > 25 ? "#fbbf24" : "#34d399"} label="Theft Risk" />
                  {theftRisk.data && <RiskBadge level={theftRisk.data.riskLevel} />}
                  <p className="text-[9px] text-slate-600 mt-1">Route + commodity + value</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 text-center">
                  <div className="text-2xl font-bold text-cyan-400">${marketIntel.data?.laneIntel?.avgSpotRate?.toFixed(2) || "—"}</div>
                  <p className="text-[10px] text-slate-400">Spot Rate/mi</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <TrendArrow trend={marketIntel.data?.spotRateTrend || "FLAT"} />
                    <span className="text-[10px] text-slate-500">{marketIntel.data?.spotRateTrend}</span>
                  </div>
                  <p className="text-[9px] text-slate-600 mt-1">Lane + equipment avg</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 text-center">
                  <div className="text-2xl font-bold text-emerald-400">{emissions.data?.co2Tons?.toFixed(1) || "—"}</div>
                  <p className="text-[10px] text-slate-400">CO2 Tons</p>
                  <p className="text-[10px] text-emerald-500 mt-1">{emissions.data?.smartwayRating || "—"}</p>
                  <p className="text-[9px] text-slate-600 mt-1">Distance + weight + equip</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 text-center">
                  <div className="text-2xl font-bold text-amber-400">{tariffs.data?.tariffAlerts?.length || 0}</div>
                  <p className="text-[10px] text-slate-400">Policy Alerts</p>
                  <p className="text-[10px] text-amber-500 mt-1">{tariffs.data?.crossBorderRisk === "DOMESTIC" ? "Domestic" : "Cross-border"}</p>
                  <p className="text-[9px] text-slate-600 mt-1">Trade policy + EPA rules</p>
                </div>
              </div>
            </div>

            {/* Action Items */}
            {outlook.data?.actionItems && (
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
                <h3 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  Recommended Actions for 2026
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {outlook.data.actionItems.map((a: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-700/20">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span className="text-[11px] text-slate-300">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Disruptions */}
            {calendar.data?.events && (
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
                <h3 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  Seasonal Disruption Calendar
                </h3>
                <div className="space-y-2">
                  {calendar.data.events.slice(0, 5).map((e: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-700/20">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${e.impact === "HIGH" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>{e.impact}</span>
                      <span className="text-[10px] text-slate-500 w-16">{e.month}</span>
                      <span className="text-[11px] text-white font-medium flex-1">{e.event}</span>
                      <span className="text-[10px] text-slate-400">{e.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════ CARGO THEFT TAB ══════════ */}
        {activeTab === "theft" && theftRisk.data && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  Cargo Theft Risk Assessment: {laneOrigin} to {laneDest}
                </h2>
                <RiskBadge level={theftRisk.data.riskLevel} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {theftRisk.data.factors.map((f: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-700/30">
                    <p className="text-[10px] text-slate-400 mb-1">{f.factor}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-600/40 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${f.score > 60 ? "bg-red-400" : f.score > 30 ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${f.score}%` }} />
                      </div>
                      <span className="text-xs font-bold text-white">{Math.round(f.score)}</span>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1">{f.description}</p>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Source: FreightWaves Q3 2025 — 645 incidents, +29% YoY. Top targets: Electronics, F&B, Auto Parts.
              </div>
            </div>

            {/* Custody Chain */}
            <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/30">
              <h3 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                Custody Chain Verification Protocol
              </h3>
              <div className="space-y-2">
                {theftRisk.data.custodyChain.map((c: any) => (
                  <div key={c.step} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-700/20">
                    <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">{c.step}</span>
                    <div className="flex-1">
                      <p className="text-xs text-white font-medium">{c.action}</p>
                      <p className="text-[10px] text-slate-400">{c.verification}</p>
                    </div>
                    {c.required ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <span className="text-[9px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-700">OPT</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/30">
              <h3 className="text-xs font-semibold text-slate-300 mb-3">Theft Prevention Recommendations</h3>
              <div className="space-y-1.5">
                {theftRisk.data.recommendations.map((r: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                    <Shield className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════ RATE INTEL TAB ══════════ */}
        {activeTab === "rates" && marketIntel.data && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Lane Intelligence: {laneOrigin} to {laneDest}
                </h2>
                <div className="flex items-center gap-2">
                  {marketIntel.data.keyInsights?.some((k: string) => k.includes("ML Engine")) && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">ML ENGINE</span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">{marketIntel.data.currentPhase}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                  <p className="text-[10px] text-slate-400">Spot Rate</p>
                  <p className="text-xl font-bold text-cyan-400">${marketIntel.data.laneIntel.avgSpotRate}</p>
                  <div className="flex items-center justify-center gap-1"><TrendArrow trend={marketIntel.data.spotRateTrend} /><span className="text-[10px] text-slate-500">{marketIntel.data.spotRateTrend}</span></div>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                  <p className="text-[10px] text-slate-400">Contract Rate</p>
                  <p className="text-xl font-bold text-blue-400">${marketIntel.data.laneIntel.avgContractRate}</p>
                  <div className="flex items-center justify-center gap-1"><TrendArrow trend={marketIntel.data.contractRateTrend} /><span className="text-[10px] text-slate-500">{marketIntel.data.contractRateTrend}</span></div>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                  <p className="text-[10px] text-slate-400">Demand Index</p>
                  <p className="text-xl font-bold text-amber-400">{marketIntel.data.laneIntel.demandIndex}</p>
                  <p className="text-[10px] text-slate-500">/ 100</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                  <p className="text-[10px] text-slate-400">Capacity Index</p>
                  <p className="text-xl font-bold text-emerald-400">{marketIntel.data.laneIntel.capacityIndex}</p>
                  <p className="text-[10px] text-slate-500">/ 100</p>
                </div>
              </div>
            </div>

            {/* Quarterly Forecast */}
            <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/30">
              <h3 className="text-xs font-semibold text-slate-300 mb-3">2026 Quarterly Rate Forecast</h3>
              <div className="grid grid-cols-4 gap-3">
                {marketIntel.data.quarterlyForecast.map((q: any) => (
                  <div key={q.quarter} className="p-3 rounded-lg bg-slate-700/30 text-center">
                    <p className="text-[10px] text-slate-400 font-medium">{q.quarter}</p>
                    <p className="text-sm font-bold text-white mt-1">+{q.spotChange}%</p>
                    <p className="text-[9px] text-slate-500">spot YoY</p>
                    <p className={`text-[9px] mt-1 px-1.5 py-0.5 rounded ${q.capacity === "SURPLUS" ? "bg-emerald-500/20 text-emerald-400" : q.capacity === "TIGHTENING" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>{q.capacity}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Seasonal Alerts */}
            <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/30">
              <h3 className="text-xs font-semibold text-slate-300 mb-3">Seasonal Rate Disruptions</h3>
              <div className="space-y-2">
                {marketIntel.data.seasonalAlerts.map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-700/20">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${a.impact === "HIGH" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>{a.impact}</span>
                    <span className="text-[10px] text-slate-500 w-20">{a.date}</span>
                    <span className="text-[11px] text-white font-medium flex-1">{a.event}</span>
                    <span className="text-[10px] text-cyan-400">{a.action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Insights */}
            <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/30">
              <h3 className="text-xs font-semibold text-slate-300 mb-3">Key Market Insights</h3>
              <div className="space-y-1.5">
                {marketIntel.data.keyInsights.map((k: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                    <Zap className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span>{k}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════ EMISSIONS TAB ══════════ */}
        {activeTab === "emissions" && emissions.data && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/30">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
                <Leaf className="w-4 h-4 text-emerald-400" />
                Emissions & Sustainability Report
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                  <p className="text-[10px] text-slate-400">CO2 Emissions</p>
                  <p className="text-xl font-bold text-emerald-400">{emissions.data.co2Tons.toFixed(2)}</p>
                  <p className="text-[10px] text-slate-500">metric tons</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                  <p className="text-[10px] text-slate-400">Fuel Consumed</p>
                  <p className="text-xl font-bold text-blue-400">{emissions.data.fuelGallons.toFixed(0)}</p>
                  <p className="text-[10px] text-slate-500">gallons</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                  <p className="text-[10px] text-slate-400">Fuel Cost</p>
                  <p className="text-xl font-bold text-amber-400">${emissions.data.fuelCost.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500">@ $3.85/gal</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30 text-center">
                  <p className="text-[10px] text-slate-400">SmartWay Rating</p>
                  <p className={`text-xl font-bold ${emissions.data.smartwayRating === "SUPERIOR" ? "text-emerald-400" : emissions.data.smartwayRating === "GOOD" ? "text-cyan-400" : "text-amber-400"}`}>{emissions.data.smartwayRating}</p>
                  <p className="text-[10px] text-slate-500">EPA SmartWay</p>
                </div>
              </div>

              {/* Modal Comparison */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] text-slate-400">Truck (current)</span>
                  </div>
                  <p className="text-sm font-bold text-white">{emissions.data.co2Kg.toFixed(0)} kg CO2</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400">Intermodal</span>
                  </div>
                  <p className="text-sm font-bold text-emerald-400">{emissions.data.vsIntermodalPct}% less</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400">Rail</span>
                  </div>
                  <p className="text-sm font-bold text-emerald-400">{emissions.data.vsRailPct}% less</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-700/20 flex items-center gap-2 text-[10px]">
                <Leaf className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-400">Carbon offset cost: <span className="text-emerald-400 font-medium">${emissions.data.carbonOffsetCost}</span> | NOx: {emissions.data.noxGrams.toFixed(0)}g | PM2.5: {emissions.data.pm25Grams.toFixed(1)}g</span>
              </div>
            </div>

            {/* Recommendations */}
            <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/30">
              <h3 className="text-xs font-semibold text-slate-300 mb-3">Sustainability Recommendations</h3>
              <div className="space-y-1.5">
                {emissions.data.recommendations.map((r: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                    <Leaf className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════ RESILIENCE TAB ══════════ */}
        {activeTab === "resilience" && (
          <div className="space-y-4">
            {/* Input Form */}
            <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/30">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-violet-400" />
                Supply Chain Resilience Assessment
              </h2>
              <p className="text-[11px] text-slate-500 mb-4">Enter your actual operational data to get an accurate resilience score.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Active Carriers</label>
                  <input type="number" min={1} max={100} value={resNumCarriers} onChange={e => { setResNumCarriers(Number(e.target.value)); setResSubmitted(false); }} className="w-full bg-slate-700/40 border border-slate-600/40 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Transport Modes Used</label>
                  <input type="number" min={1} max={5} value={resModesUsed} onChange={e => { setResModesUsed(Number(e.target.value)); setResSubmitted(false); }} className="w-full bg-slate-700/40 border border-slate-600/40 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Avg Lead Time (days)</label>
                  <input type="number" min={1} max={30} value={resLeadTime} onChange={e => { setResLeadTime(Number(e.target.value)); setResSubmitted(false); }} className="w-full bg-slate-700/40 border border-slate-600/40 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Digitalized (%)</label>
                  <input type="number" min={0} max={100} value={resDigitalized} onChange={e => { setResDigitalized(Number(e.target.value)); setResSubmitted(false); }} className="w-full bg-slate-700/40 border border-slate-600/40 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={resHasVisibility} onChange={e => { setResHasVisibility(e.target.checked); setResSubmitted(false); }} className="rounded" />
                    <span className="text-[10px] text-slate-300">Real-time visibility</span>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={resContingency} onChange={e => { setResContingency(e.target.checked); setResSubmitted(false); }} className="rounded" />
                    <span className="text-[10px] text-slate-300">Contingency routes</span>
                  </label>
                </div>
              </div>
              <button onClick={() => setResSubmitted(true)} className="mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-semibold hover:shadow-lg hover:shadow-violet-500/20 transition-all">
                Calculate Resilience Score
              </button>
            </div>

            {/* Results — only shown after user submits */}
            {resSubmitted && resilience.data && (
              <>
                <div className="p-5 rounded-xl bg-slate-800/40 border border-violet-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-300">Your Resilience Score</h3>
                    <span className="text-2xl font-bold text-violet-400">{resilience.data.overall}/100</span>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {[
                      { label: "Carrier Diversity", value: resilience.data.carrierDiversification, color: "#8b5cf6" },
                      { label: "Modal Flexibility", value: resilience.data.modalFlexibility, color: "#06b6d4" },
                      { label: "Route Redundancy", value: resilience.data.routeRedundancy, color: "#f59e0b" },
                      { label: "Inventory Position", value: resilience.data.inventoryPositioning, color: "#ec4899" },
                      { label: "Tech Readiness", value: resilience.data.technologyReadiness, color: "#10b981" },
                    ].map((m, i) => (
                      <div key={i} className="p-3 rounded-lg bg-slate-700/30 text-center">
                        <div className="relative flex items-center justify-center">
                          <ScoreRing score={m.value} size={56} color={m.color} label="" />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/30">
                  <h3 className="text-xs font-semibold text-slate-300 mb-3">Resilience Improvement Actions</h3>
                  <div className="space-y-1.5">
                    {resilience.data.recommendations.map((r: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                        <Shield className="w-3 h-3 text-violet-400 mt-0.5 flex-shrink-0" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════ WELLNESS TAB ══════════ */}
        {activeTab === "wellness" && (
          <div className="space-y-4">
            {/* Input Form */}
            <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/30">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-1">
                <Heart className="w-4 h-4 text-pink-400" />
                Driver Wellness Assessment
              </h2>
              <p className="text-[11px] text-slate-500 mb-4">Enter your current driving data for a personalized wellness check. Best used by drivers on active trips.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Hours Worked This Week</label>
                  <input type="number" min={0} max={80} value={wellHoursWorked} onChange={e => { setWellHoursWorked(Number(e.target.value)); setWellSubmitted(false); }} className="w-full bg-slate-700/40 border border-slate-600/40 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Days on Road</label>
                  <input type="number" min={0} max={14} value={wellDaysOnRoad} onChange={e => { setWellDaysOnRoad(Number(e.target.value)); setWellSubmitted(false); }} className="w-full bg-slate-700/40 border border-slate-600/40 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Avg Sleep (hours/night)</label>
                  <input type="number" min={0} max={12} step={0.5} value={wellSleepHours} onChange={e => { setWellSleepHours(Number(e.target.value)); setWellSubmitted(false); }} className="w-full bg-slate-700/40 border border-slate-600/40 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Consecutive Driving Days</label>
                  <input type="number" min={0} max={14} value={wellConsecDays} onChange={e => { setWellConsecDays(Number(e.target.value)); setWellSubmitted(false); }} className="w-full bg-slate-700/40 border border-slate-600/40 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Miles Driven Today</label>
                  <input type="number" min={0} max={700} value={wellDistToday} onChange={e => { setWellDistToday(Number(e.target.value)); setWellSubmitted(false); }} className="w-full bg-slate-700/40 border border-slate-600/40 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={wellHadBreak} onChange={e => { setWellHadBreak(e.target.checked); setWellSubmitted(false); }} className="rounded" />
                    <span className="text-[10px] text-slate-300">Had a break today</span>
                  </label>
                </div>
              </div>
              <button onClick={() => setWellSubmitted(true)} className="mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 text-white text-xs font-semibold hover:shadow-lg hover:shadow-pink-500/20 transition-all">
                Assess Wellness
              </button>
            </div>

            {/* Results — only shown after user submits */}
            {wellSubmitted && wellness.data && (
              <div className="p-5 rounded-xl bg-slate-800/40 border border-pink-500/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-300">Your Wellness Score</h3>
                  <span className="text-2xl font-bold text-pink-400">{wellness.data.overall}/100</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Fatigue Level", value: wellness.data.fatigue, color: "#f87171", icon: Activity },
                    { label: "Rest Quality", value: wellness.data.restQuality, color: "#60a5fa", icon: Clock },
                    { label: "Work-Life Balance", value: wellness.data.workLifeBalance, color: "#34d399", icon: Heart },
                  ].map((m, i) => (
                    <div key={i} className="p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-2 mb-2">
                        <m.icon className="w-4 h-4" style={{ color: m.color }} />
                        <span className="text-[10px] text-slate-400">{m.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-slate-600/40 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${m.value}%`, backgroundColor: m.color }} />
                        </div>
                        <span className="text-xs font-bold text-white">{m.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {wellness.data.alerts.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {wellness.data.alerts.map((a: any, i: number) => (
                      <div key={i} className={`p-3 rounded-lg flex items-center gap-2 ${a.severity === "critical" ? "bg-red-500/10 border border-red-500/20" : "bg-amber-500/10 border border-amber-500/20"}`}>
                        <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${a.severity === "critical" ? "text-red-400" : "text-amber-400"}`} />
                        <span className={`text-xs ${a.severity === "critical" ? "text-red-300" : "text-amber-300"}`}>{a.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5">
                  {wellness.data.recommendations.map((r: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                      <Heart className="w-3 h-3 text-pink-400 mt-0.5 flex-shrink-0" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════ TARIFFS TAB ══════════ */}
        {activeTab === "tariffs" && tariffs.data && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/30">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-amber-400" />
                Tariff & Trade Policy Impact
              </h2>
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tariffs.data.affectedByTariffs ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"}`}>
                  {tariffs.data.affectedByTariffs ? "Tariff Exposure Detected" : "No Direct Tariff Exposure"}
                </span>
                <span className="text-xs text-slate-400">{tariffs.data.estimatedCostImpact}</span>
              </div>
              <div className="space-y-2">
                {tariffs.data.tariffAlerts.map((a: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-700/20 border border-slate-700/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white font-semibold">{a.policy}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{a.status}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-1">{a.impact}</p>
                    <p className="text-[10px] text-cyan-400">{a.action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════ CALENDAR TAB ══════════ */}
        {activeTab === "calendar" && calendar.data && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/30">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-blue-400" />
                2026 Seasonal Disruption Calendar
              </h2>
              <div className="space-y-2">
                {calendar.data.events.map((e: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/20 hover:bg-slate-700/30 transition-colors">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold min-w-[50px] text-center ${e.impact === "HIGH" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>{e.impact}</span>
                    <span className="text-[10px] text-slate-500 w-20 font-medium">{e.month}</span>
                    <div className="flex-1">
                      <p className="text-xs text-white font-medium">{e.event}</p>
                      <p className="text-[10px] text-slate-400">{e.description}</p>
                    </div>
                    <span className="text-[10px] text-cyan-400 max-w-[160px] text-right">{e.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
