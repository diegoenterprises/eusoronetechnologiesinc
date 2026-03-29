/**
 * VESSEL OPERATOR DASHBOARD — Fleet Operations Center
 * For VESSEL_OPERATOR role: fleet status, voyage schedules, bunker fuel,
 * crew overview, revenue analytics, compliance & inspections
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Anchor, Ship, Container, DollarSign, Gauge,
  Navigation, Fuel, Users, Shield, Clock,
  AlertTriangle, TrendingUp, BarChart3, MapPin,
  ChevronRight, RefreshCw, CheckCircle2, XCircle,
  Thermometer, Eye, Globe, Calendar, Activity,
  Wrench, FileCheck, ArrowUpRight, ArrowDownRight,
  Timer, Award, Search, Waves,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

/* ─── KPI Card ─── */
function KpiCard({ icon, label, value, sub, isLight, accent = "cyan" }: {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; isLight: boolean; accent?: string;
}) {
  const accentMap: Record<string, string> = {
    cyan: isLight ? "bg-cyan-50 text-cyan-600" : "bg-cyan-500/10 text-cyan-400",
    blue: isLight ? "bg-blue-50 text-blue-600" : "bg-blue-500/10 text-blue-400",
    emerald: isLight ? "bg-emerald-50 text-emerald-600" : "bg-emerald-500/10 text-emerald-400",
    amber: isLight ? "bg-amber-50 text-amber-600" : "bg-amber-500/10 text-amber-400",
    red: isLight ? "bg-red-50 text-red-600" : "bg-red-500/10 text-red-400",
    purple: isLight ? "bg-purple-50 text-purple-600" : "bg-purple-500/10 text-purple-400",
    teal: isLight ? "bg-teal-50 text-teal-600" : "bg-teal-500/10 text-teal-400",
  };
  return (
    <div className={cn(
      "rounded-xl border p-4 transition-all hover:scale-[1.02]",
      isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50 hover:border-cyan-500/30"
    )}>
      <div className={cn("p-2 rounded-lg w-fit mb-2", accentMap[accent])}>{icon}</div>
      <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>{value}</div>
      <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>{label}</div>
      {sub && <div className={cn("text-[10px] mt-0.5", isLight ? "text-slate-400" : "text-slate-500")}>{sub}</div>}
    </div>
  );
}

/* ─── Status Maps ─── */
const VESSEL_STATUS: Record<string, { bg: string; lightBg: string; label: string }> = {
  at_sea: { bg: "bg-emerald-500/20 text-emerald-400", lightBg: "bg-emerald-100 text-emerald-700", label: "At Sea" },
  in_port: { bg: "bg-blue-500/20 text-blue-400", lightBg: "bg-blue-100 text-blue-700", label: "In Port" },
  anchored: { bg: "bg-amber-500/20 text-amber-400", lightBg: "bg-amber-100 text-amber-700", label: "Anchored" },
  loading: { bg: "bg-purple-500/20 text-purple-400", lightBg: "bg-purple-100 text-purple-700", label: "Loading" },
  discharging: { bg: "bg-orange-500/20 text-orange-400", lightBg: "bg-orange-100 text-orange-700", label: "Discharging" },
  dry_dock: { bg: "bg-red-500/20 text-red-400", lightBg: "bg-red-100 text-red-700", label: "Dry Dock" },
  bunkering: { bg: "bg-teal-500/20 text-teal-400", lightBg: "bg-teal-100 text-teal-700", label: "Bunkering" },
  laid_up: { bg: "bg-slate-500/20 text-slate-400", lightBg: "bg-slate-200 text-slate-600", label: "Laid Up" },
};

const AUDIT_STATUS: Record<string, { bg: string; lightBg: string }> = {
  passed: { bg: "bg-green-500/20 text-green-400", lightBg: "bg-green-100 text-green-700" },
  pending: { bg: "bg-yellow-500/20 text-yellow-400", lightBg: "bg-yellow-100 text-yellow-700" },
  overdue: { bg: "bg-red-500/20 text-red-400", lightBg: "bg-red-100 text-red-700" },
  in_progress: { bg: "bg-blue-500/20 text-blue-400", lightBg: "bg-blue-100 text-blue-700" },
  deficiency: { bg: "bg-orange-500/20 text-orange-400", lightBg: "bg-orange-100 text-orange-700" },
  no_deficiency: { bg: "bg-green-500/20 text-green-400", lightBg: "bg-green-100 text-green-700" },
};

/* ─── Empty Defaults ─── */
const EMPTY_VESSELS: any[] = [];
const EMPTY_VOYAGES_SCHEDULE: any[] = [];
const EMPTY_BUNKER: any[] = [];
const EMPTY_CREW: any[] = [];
const EMPTY_REVENUE: any[] = [];
const EMPTY_COMPLIANCE: any[] = [];

/* ─── Helpers ─── */
function fmtCurrency(v: number) {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}
function fmtDate(d: string) {
  if (!d || d === "—") return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ────────────────────────────────────────────────── */
/*  MAIN COMPONENT                                    */
/* ────────────────────────────────────────────────── */
export default function VesselOperatorDashboard() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [vesselSearch, setVesselSearch] = useState("");
  const [mainTab, setMainTab] = useState("fleet");

  /* tRPC queries with graceful fallback */
  const fleetQuery = (trpc as any).vesselShipments?.getVesselFleet?.useQuery?.({ limit: 50 }) ?? { data: null, isLoading: false };
  const crewQuery = (trpc as any).vesselShipments?.getVesselCrew?.useQuery?.() ?? { data: null, isLoading: false };
  const complianceQuery = (trpc as any).vesselShipments?.getVesselCompliance?.useQuery?.() ?? { data: null, isLoading: false };
  const financialQuery = (trpc as any).vesselShipments?.getVesselFinancialSummary?.useQuery?.() ?? { data: null, isLoading: false };
  const berthQuery = (trpc as any).vesselShipments?.getBerthSchedule?.useQuery?.() ?? { data: null, isLoading: false };

  const vessels = fleetQuery.data?.vessels?.length ? fleetQuery.data.vessels : EMPTY_VESSELS;
  const crewData = crewQuery.data?.crew ?? EMPTY_CREW;
  const revenueData = financialQuery.data?.revenue ?? EMPTY_REVENUE;
  const complianceData = complianceQuery.data?.compliance ?? EMPTY_COMPLIANCE;
  const voyageScheduleData = berthQuery.data?.schedule ?? EMPTY_VOYAGES_SCHEDULE;
  const bunkerData = fleetQuery.data?.bunker ?? EMPTY_BUNKER;

  /* KPIs */
  const totalVessels = vessels.length;
  const activeVoyages = vessels.filter((v: any) => ["at_sea", "loading", "discharging", "anchored"].includes(v.status)).length;
  const totalTeu = vessels.reduce((s: number, v: any) => s + (v.teu || 0), 0);
  const avgUtil = vessels.filter((v: any) => v.cargoUtil > 0).length > 0
    ? Math.round(vessels.filter((v: any) => v.cargoUtil > 0).reduce((s: number, v: any) => s + v.cargoUtil, 0) / vessels.filter((v: any) => v.cargoUtil > 0).length)
    : 0;

  /* Filter vessels */
  const filteredVessels = useMemo(() => {
    if (!vesselSearch) return vessels;
    const q = vesselSearch.toLowerCase();
    return vessels.filter((v: any) =>
      v.name?.toLowerCase().includes(q) || v.imo?.includes(q) || v.voyage?.toLowerCase().includes(q)
    );
  }, [vessels, vesselSearch]);

  /* Theme vars */
  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn("border rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const text = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-slate-400";
  const tableBorder = isLight ? "border-slate-100" : "border-slate-700/50";
  const tableHover = isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/30";
  const inputBg = isLight
    ? "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
    : "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500";

  /* Crew totals */
  const totalCrew = crewData.reduce((s, c) => s + c.totalCrew, 0);
  const certsExpiring = crewData.reduce((s, c) => s + c.certExpiring30, 0);
  const stcwNonCompliant = crewData.filter(c => !c.stcwCompliant).length;

  /* Revenue totals */
  const totalMtdRevenue = revenueData.reduce((s, r) => s + r.mtdRevenue, 0);

  return (
    <div className={cn("min-h-screen p-6 space-y-6", bg)}>
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl",
            isLight ? "bg-gradient-to-br from-blue-100 to-cyan-100" : "bg-gradient-to-br from-blue-500/20 to-cyan-500/20"
          )}>
            <Anchor className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <h1 className={cn("text-2xl font-bold", text)}>Fleet Operations</h1>
            <p className={cn("text-sm", muted)}>
              Vessel management &amp; voyage control &bull; {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className={cn("absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4", muted)} />
            <Input
              placeholder="Search fleet..."
              value={vesselSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVesselSearch(e.target.value)}
              className={cn("pl-9 w-56 h-9 text-sm rounded-lg", inputBg)}
            />
          </div>
          <Button size="sm" variant="outline" onClick={() => fleetQuery.refetch?.()}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ─── KPIs ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={<Ship className="w-5 h-5" />} label="Vessels in Fleet" value={totalVessels} sub={`${vessels.filter((v: any) => v.status === "dry_dock").length} in dry dock`} isLight={isLight} accent="blue" />
        <KpiCard icon={<Navigation className="w-5 h-5" />} label="Active Voyages" value={activeVoyages} sub="Currently underway" isLight={isLight} accent="cyan" />
        <KpiCard icon={<Container className="w-5 h-5" />} label="TEU Capacity" value={totalTeu.toLocaleString()} sub="Total fleet" isLight={isLight} accent="emerald" />
        <KpiCard icon={<Gauge className="w-5 h-5" />} label="Fleet Utilization" value={`${avgUtil}%`} sub="Avg cargo fill" isLight={isLight} accent="amber" />
      </div>

      {/* ─── Vessel Status Grid ─── */}
      <div className={cn(cardBg, "overflow-hidden")}>
        <div className={cn("px-5 py-4 border-b flex items-center justify-between", tableBorder)}>
          <div className="flex items-center gap-2">
            <Ship className={cn("w-4 h-4", isLight ? "text-blue-600" : "text-blue-400")} />
            <h2 className={cn("text-base font-semibold", text)}>Vessel Status</h2>
            <Badge variant="secondary" className="text-xs">{filteredVessels.length}</Badge>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredVessels.map((v: any) => {
            const st = VESSEL_STATUS[v.status] || VESSEL_STATUS.at_sea;
            return (
              <div key={v.id} className={cn(
                "p-4 rounded-lg border transition-all cursor-pointer",
                isLight ? "bg-white border-slate-100 hover:border-blue-200 hover:shadow-md" : "bg-slate-800/40 border-slate-700/40 hover:border-cyan-500/30"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className={cn("text-sm font-bold", text)}>{v.name}</div>
                    <div className={cn("text-[10px] font-mono", muted)}>IMO {v.imo} &bull; {v.flag}</div>
                  </div>
                  <Badge className={cn("text-[10px]", isLight ? st.lightBg : st.bg)}>{st.label}</Badge>
                </div>
                {v.voyage !== "—" && (
                  <div className={cn("text-xs mb-2", muted)}>
                    <span className="font-medium">Voyage:</span> {v.voyage} &mdash; {v.route}
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <div className={cn("text-[10px]", muted)}>Next Port</div>
                    <div className={cn("text-xs font-medium", text)}>{v.nextPort || "—"}</div>
                  </div>
                  <div>
                    <div className={cn("text-[10px]", muted)}>Speed</div>
                    <div className={cn("text-xs font-medium", text)}>{v.speed > 0 ? `${v.speed} kn` : "—"}</div>
                  </div>
                  <div>
                    <div className={cn("text-[10px]", muted)}>Cargo</div>
                    <div className={cn("text-xs font-medium", text)}>{v.cargoUtil > 0 ? `${v.cargoUtil}%` : "—"}</div>
                  </div>
                </div>
                {v.cargoUtil > 0 && (
                  <div className="mt-2">
                    <div className={cn("w-full h-1.5 rounded-full", isLight ? "bg-slate-100" : "bg-slate-700")}>
                      <div
                        className={cn("h-full rounded-full", v.cargoUtil >= 85 ? "bg-emerald-500" : v.cargoUtil >= 60 ? "bg-blue-500" : "bg-amber-500")}
                        style={{ width: `${v.cargoUtil}%` }}
                      />
                    </div>
                  </div>
                )}
                {v.eta && v.eta !== "—" && (
                  <div className={cn("flex items-center gap-1 mt-2 text-[10px]", muted)}>
                    <Clock className="w-3 h-3" /> ETA: {fmtDate(v.eta)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Voyage Schedule ─── */}
      <div className={cn(cardBg, "overflow-hidden")}>
        <div className={cn("px-5 py-4 border-b flex items-center gap-2", tableBorder)}>
          <Calendar className={cn("w-4 h-4", isLight ? "text-cyan-600" : "text-cyan-400")} />
          <h2 className={cn("text-base font-semibold", text)}>Voyage Schedule</h2>
          <span className={cn("text-xs ml-auto", muted)}>Upcoming arrivals &amp; departures</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={cn("border-b text-left", tableBorder)}>
                {["Vessel", "Voyage", "Event", "Port", "Date/Time", "Berth"].map(h => (
                  <th key={h} className={cn("px-4 py-3 text-xs font-medium", muted)}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {voyageScheduleData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((s, i) => (
                <tr key={i} className={cn("border-b", tableBorder, tableHover)}>
                  <td className={cn("px-4 py-3 font-medium", text)}>{s.vessel}</td>
                  <td className={cn("px-4 py-3 font-mono text-xs", isLight ? "text-cyan-700" : "text-cyan-400")}>{s.voyage}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn(
                      "text-[10px]",
                      s.event === "Arrival"
                        ? (isLight ? "bg-green-100 text-green-700" : "bg-green-500/20 text-green-400")
                        : (isLight ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-400")
                    )}>
                      {s.event === "Arrival" ? <ArrowDownRight className="w-3 h-3 mr-1 inline" /> : <ArrowUpRight className="w-3 h-3 mr-1 inline" />}
                      {s.event}
                    </Badge>
                  </td>
                  <td className={cn("px-4 py-3", text)}>{s.port}</td>
                  <td className={cn("px-4 py-3 text-xs", muted)}>{new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} {new Date(s.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</td>
                  <td className={cn("px-4 py-3 font-mono text-xs", muted)}>{s.berth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Bunker Fuel + Crew Overview ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bunker Fuel */}
        <div className={cn(cardBg, "overflow-hidden")}>
          <div className={cn("px-5 py-4 border-b flex items-center gap-2", tableBorder)}>
            <Fuel className={cn("w-4 h-4", isLight ? "text-amber-600" : "text-amber-400")} />
            <h2 className={cn("text-base font-semibold", text)}>Bunker Fuel</h2>
          </div>
          <div className="p-4 space-y-3">
            {bunkerData.map(b => {
              const fillPct = Math.round((b.onboard / b.capacity) * 100);
              const isLow = b.daysRemaining < 20;
              return (
                <div key={b.vessel} className={cn(
                  "p-3 rounded-lg border",
                  isLow
                    ? (isLight ? "bg-amber-50 border-amber-200" : "bg-amber-500/10 border-amber-500/30")
                    : (isLight ? "bg-white border-slate-100" : "bg-slate-800/40 border-slate-700/40")
                )}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("text-sm font-medium", text)}>{b.vessel}</span>
                    <span className={cn("text-xs font-mono", muted)}>{b.fuelType}</span>
                  </div>
                  <div className="mt-2">
                    <div className={cn("w-full h-2 rounded-full", isLight ? "bg-slate-100" : "bg-slate-700")}>
                      <div
                        className={cn("h-full rounded-full", fillPct > 60 ? "bg-emerald-500" : fillPct > 30 ? "bg-amber-500" : "bg-red-500")}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className={cn("text-xs", muted)}>
                      {b.onboard.toLocaleString()} / {b.capacity.toLocaleString()} MT ({fillPct}%)
                    </div>
                    <div className={cn("text-xs font-medium", isLow ? (isLight ? "text-amber-700" : "text-amber-400") : muted)}>
                      {b.daysRemaining.toFixed(0)}d remaining
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className={cn("text-[10px]", muted)}>Consumption: {b.consumptionDay} MT/day</span>
                    <span className={cn("text-[10px]", muted)}>Last: {b.lastBunker} @ ${b.pricePerMT}/MT</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Crew Overview */}
        <div className={cn(cardBg, "overflow-hidden")}>
          <div className={cn("px-5 py-4 border-b flex items-center justify-between", tableBorder)}>
            <div className="flex items-center gap-2">
              <Users className={cn("w-4 h-4", isLight ? "text-purple-600" : "text-purple-400")} />
              <h2 className={cn("text-base font-semibold", text)}>Crew Overview</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn("text-xs", muted)}>{totalCrew} total crew</span>
              {certsExpiring > 0 && (
                <Badge className={cn("text-[10px]", isLight ? "bg-amber-100 text-amber-700" : "bg-amber-500/20 text-amber-400")}>
                  {certsExpiring} certs expiring
                </Badge>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b text-left", tableBorder)}>
                  {["Vessel", "Crew", "Officers", "Ratings", "Certs Exp.", "STCW", "Medical"].map(h => (
                    <th key={h} className={cn("px-3 py-2.5 text-xs font-medium whitespace-nowrap", muted)}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {crewData.filter(c => c.totalCrew > 0).map(c => (
                  <tr key={c.vessel} className={cn("border-b", tableBorder, tableHover)}>
                    <td className={cn("px-3 py-2.5 text-xs font-medium", text)}>{c.vessel}</td>
                    <td className={cn("px-3 py-2.5 text-xs font-bold", text)}>{c.totalCrew}</td>
                    <td className={cn("px-3 py-2.5 text-xs", muted)}>{c.officers}</td>
                    <td className={cn("px-3 py-2.5 text-xs", muted)}>{c.ratings}</td>
                    <td className="px-3 py-2.5">
                      {c.certExpiring30 > 0 ? (
                        <Badge className={cn("text-[10px]", isLight ? "bg-amber-100 text-amber-700" : "bg-amber-500/20 text-amber-400")}>
                          {c.certExpiring30}
                        </Badge>
                      ) : (
                        <span className={cn("text-xs", muted)}>0</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {c.stcwCompliant ? (
                        <CheckCircle2 className={cn("w-4 h-4", isLight ? "text-green-600" : "text-green-400")} />
                      ) : (
                        <XCircle className={cn("w-4 h-4", isLight ? "text-red-600" : "text-red-400")} />
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {c.medicalExpiring > 0 ? (
                        <Badge className={cn("text-[10px]", isLight ? "bg-red-100 text-red-700" : "bg-red-500/20 text-red-400")}>
                          {c.medicalExpiring}
                        </Badge>
                      ) : (
                        <CheckCircle2 className={cn("w-4 h-4", isLight ? "text-green-600" : "text-green-400")} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {stcwNonCompliant > 0 && (
            <div className={cn("px-5 py-3 border-t flex items-center gap-2", tableBorder)}>
              <AlertTriangle className={cn("w-3.5 h-3.5", isLight ? "text-red-600" : "text-red-400")} />
              <span className={cn("text-xs font-medium", isLight ? "text-red-700" : "text-red-400")}>
                {stcwNonCompliant} vessel(s) not STCW compliant — immediate action required
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Revenue + Compliance ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue */}
        <div className={cn(cardBg, "overflow-hidden")}>
          <div className={cn("px-5 py-4 border-b flex items-center justify-between", tableBorder)}>
            <div className="flex items-center gap-2">
              <DollarSign className={cn("w-4 h-4", isLight ? "text-emerald-600" : "text-emerald-400")} />
              <h2 className={cn("text-base font-semibold", text)}>Revenue</h2>
            </div>
            <span className={cn("text-xs font-medium", isLight ? "text-emerald-600" : "text-emerald-400")}>
              MTD: {fmtCurrency(totalMtdRevenue)}
            </span>
          </div>
          <div className="p-4 space-y-3">
            {revenueData.map(r => (
              <div key={r.vessel} className={cn(
                "p-3 rounded-lg border flex items-center justify-between",
                isLight ? "bg-white border-slate-100" : "bg-slate-800/40 border-slate-700/40"
              )}>
                <div>
                  <div className={cn("text-sm font-medium", text)}>{r.vessel}</div>
                  <div className={cn("text-[10px]", muted)}>Top lane: {r.topLane}</div>
                </div>
                <div className="text-right">
                  <div className={cn("text-sm font-bold", isLight ? "text-emerald-700" : "text-emerald-400")}>{fmtCurrency(r.mtdRevenue)}</div>
                  <div className={cn("text-[10px]", muted)}>YTD: {fmtCurrency(r.ytdRevenue)}</div>
                  <div className={cn("text-[10px]", muted)}>${r.freightPerTeu}/TEU avg</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance */}
        <div className={cn(cardBg, "overflow-hidden")}>
          <div className={cn("px-5 py-4 border-b flex items-center gap-2", tableBorder)}>
            <Shield className={cn("w-4 h-4", isLight ? "text-purple-600" : "text-purple-400")} />
            <h2 className={cn("text-base font-semibold", text)}>Compliance &amp; Inspections</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b text-left", tableBorder)}>
                  {["Vessel", "ISM Audit", "ISPS", "Last PSC", "PSC Port", "Detentions"].map(h => (
                    <th key={h} className={cn("px-3 py-2.5 text-xs font-medium whitespace-nowrap", muted)}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {complianceData.map(c => {
                  const ismSt = AUDIT_STATUS[c.ismAudit] || AUDIT_STATUS.pending;
                  const ispsSt = AUDIT_STATUS[c.ispsAudit] || AUDIT_STATUS.pending;
                  const pscSt = AUDIT_STATUS[c.lastPSC] || AUDIT_STATUS.pending;
                  return (
                    <tr key={c.vessel} className={cn("border-b", tableBorder, tableHover)}>
                      <td className={cn("px-3 py-2.5 text-xs font-medium", text)}>{c.vessel}</td>
                      <td className="px-3 py-2.5">
                        <Badge className={cn("text-[10px]", isLight ? ismSt.lightBg : ismSt.bg)}>{c.ismAudit}</Badge>
                        <div className={cn("text-[10px] mt-0.5", muted)}>{fmtDate(c.ismDate)}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge className={cn("text-[10px]", isLight ? ispsSt.lightBg : ispsSt.bg)}>{c.ispsAudit}</Badge>
                        <div className={cn("text-[10px] mt-0.5", muted)}>{fmtDate(c.ispsDate)}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge className={cn("text-[10px]", isLight ? pscSt.lightBg : pscSt.bg)}>{c.lastPSC.replace(/_/g, " ")}</Badge>
                        <div className={cn("text-[10px] mt-0.5", muted)}>{fmtDate(c.pscDate)}</div>
                      </td>
                      <td className={cn("px-3 py-2.5 text-xs", muted)}>{c.pscPort}</td>
                      <td className={cn("px-3 py-2.5 text-xs font-medium", c.detentions > 0 ? (isLight ? "text-red-600" : "text-red-400") : text)}>{c.detentions}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className={cn("px-5 py-3 border-t flex items-center gap-4", tableBorder)}>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className={cn("w-3.5 h-3.5", isLight ? "text-green-600" : "text-green-400")} />
              <span className={cn("text-xs", muted)}>
                {complianceData.filter(c => c.ismAudit === "passed" && c.ispsAudit === "passed").length}/{complianceData.length} fully compliant
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className={cn("w-3.5 h-3.5", isLight ? "text-amber-600" : "text-amber-400")} />
              <span className={cn("text-xs", muted)}>
                {complianceData.filter(c => c.ismAudit === "overdue" || c.ispsAudit === "overdue").length} overdue audits
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Fleet Performance Metrics ─── */}
      <div className={cn(cardBg, "overflow-hidden")}>
        <div className={cn("px-5 py-4 border-b flex items-center gap-2", tableBorder)}>
          <Activity className={cn("w-4 h-4", isLight ? "text-cyan-600" : "text-cyan-400")} />
          <h2 className={cn("text-base font-semibold", text)}>Fleet Performance Metrics</h2>
          <span className={cn("text-xs ml-auto", muted)}>Rolling 90 days</span>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
              { label: "Avg Speed", value: "19.2 kn", sub: "Eco speed: 16 kn", accent: isLight ? "text-blue-700" : "text-blue-400" },
              { label: "Port Turnaround", value: "2.4 days", sub: "Target: 2.0 days", accent: isLight ? "text-amber-700" : "text-amber-400" },
              { label: "Schedule Reliability", value: "87%", sub: "Industry avg: 72%", accent: isLight ? "text-emerald-700" : "text-emerald-400" },
              { label: "CO2 per TEU-km", value: "12.8g", sub: "IMO target: 15g", accent: isLight ? "text-green-700" : "text-green-400" },
            ].map(m => (
              <div key={m.label} className={cn("p-3 rounded-lg border", isLight ? "bg-slate-50 border-slate-100" : "bg-slate-800/40 border-slate-700/40")}>
                <div className={cn("text-lg font-bold", m.accent)}>{m.value}</div>
                <div className={cn("text-xs font-medium", text)}>{m.label}</div>
                <div className={cn("text-[10px]", muted)}>{m.sub}</div>
              </div>
            ))}
          </div>
          {/* Vessel-by-vessel performance */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b text-left", tableBorder)}>
                  {["Vessel", "Voyages (YTD)", "Avg Speed", "Port Days", "Utilization", "Revenue/Day", "CII Rating"].map(h => (
                    <th key={h} className={cn("px-3 py-2.5 text-xs font-medium whitespace-nowrap", muted)}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { vessel: "MSC AURORA", voyages: 8, avgSpeed: 18.2, portDays: 2.3, util: 91, revPerDay: 142000, cii: "B" },
                  { vessel: "CMA CGM MARCO POLO", voyages: 7, avgSpeed: 21.4, portDays: 2.8, util: 88, revPerDay: 178000, cii: "C" },
                  { vessel: "EVERGREEN TRITON", voyages: 9, avgSpeed: 19.8, portDays: 2.1, util: 82, revPerDay: 165000, cii: "B" },
                  { vessel: "MAERSK SENTOSA", voyages: 7, avgSpeed: 17.6, portDays: 2.5, util: 79, revPerDay: 128000, cii: "A" },
                  { vessel: "HAPAG BERLIN", voyages: 6, avgSpeed: 16.8, portDays: 2.0, util: 75, revPerDay: 98000, cii: "B" },
                  { vessel: "ZIM SAMSON", voyages: 8, avgSpeed: 19.6, portDays: 1.8, util: 84, revPerDay: 108000, cii: "B" },
                  { vessel: "ONE COMMITMENT", voyages: 5, avgSpeed: 17.0, portDays: 2.6, util: 70, revPerDay: 88000, cii: "C" },
                ].map(p => (
                  <tr key={p.vessel} className={cn("border-b", tableBorder, tableHover)}>
                    <td className={cn("px-3 py-2.5 text-xs font-medium", text)}>{p.vessel}</td>
                    <td className={cn("px-3 py-2.5 text-xs", text)}>{p.voyages}</td>
                    <td className={cn("px-3 py-2.5 text-xs", text)}>{p.avgSpeed} kn</td>
                    <td className={cn("px-3 py-2.5 text-xs", p.portDays > 2.5 ? (isLight ? "text-amber-600" : "text-amber-400") : muted)}>{p.portDays}d</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-12 h-1.5 rounded-full", isLight ? "bg-slate-100" : "bg-slate-700")}>
                          <div className={cn("h-full rounded-full", p.util >= 85 ? "bg-emerald-500" : p.util >= 70 ? "bg-blue-500" : "bg-amber-500")} style={{ width: `${p.util}%` }} />
                        </div>
                        <span className={cn("text-xs", text)}>{p.util}%</span>
                      </div>
                    </td>
                    <td className={cn("px-3 py-2.5 text-xs font-medium", isLight ? "text-emerald-700" : "text-emerald-400")}>{fmtCurrency(p.revPerDay)}</td>
                    <td className="px-3 py-2.5">
                      <Badge className={cn("text-[10px]",
                        p.cii === "A" ? (isLight ? "bg-green-100 text-green-700" : "bg-green-500/20 text-green-400")
                          : p.cii === "B" ? (isLight ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-400")
                            : (isLight ? "bg-amber-100 text-amber-700" : "bg-amber-500/20 text-amber-400")
                      )}>{p.cii}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── Alerts & Notifications ─── */}
      <div className={cn(cardBg, "overflow-hidden")}>
        <div className={cn("px-5 py-4 border-b flex items-center gap-2", tableBorder)}>
          <AlertTriangle className={cn("w-4 h-4", isLight ? "text-amber-600" : "text-amber-400")} />
          <h2 className={cn("text-base font-semibold", text)}>Active Alerts</h2>
        </div>
        <div className="p-4 space-y-2">
          {[
            { severity: "critical", message: "ONE COMMITMENT — ISPS audit overdue (last: Mar 2025)", vessel: "ONE COMMITMENT", time: "2h ago" },
            { severity: "warning", message: "ZIM SAMSON — bunker fuel below 40% capacity, next bunker port Antwerp", vessel: "ZIM SAMSON", time: "4h ago" },
            { severity: "warning", message: "MAERSK SENTOSA — 2 crew certifications expiring within 30 days", vessel: "MAERSK SENTOSA", time: "6h ago" },
            { severity: "info", message: "EVERGREEN TRITON — PSC inspection noted 1 deficiency at Felixstowe", vessel: "EVERGREEN TRITON", time: "12h ago" },
            { severity: "info", message: "COSCO HARMONY — dry dock maintenance on schedule, ETA completion May 15", vessel: "COSCO HARMONY", time: "1d ago" },
            { severity: "warning", message: "ONE COMMITMENT — STCW non-compliance detected, immediate review required", vessel: "ONE COMMITMENT", time: "1d ago" },
            { severity: "info", message: "CMA CGM MARCO POLO — mid-Atlantic weather advisory, minor route deviation expected", vessel: "CMA CGM MARCO POLO", time: "2d ago" },
            { severity: "info", message: "HAPAG BERLIN — ISM audit scheduled for April 15, preparation required", vessel: "HAPAG BERLIN", time: "3d ago" },
          ].map((alert, idx) => (
            <div key={idx} className={cn(
              "p-3 rounded-lg border flex items-start gap-3",
              alert.severity === "critical"
                ? (isLight ? "bg-red-50 border-red-200" : "bg-red-500/10 border-red-500/30")
                : alert.severity === "warning"
                  ? (isLight ? "bg-amber-50 border-amber-200" : "bg-amber-500/10 border-amber-500/30")
                  : (isLight ? "bg-blue-50 border-blue-200" : "bg-blue-500/10 border-blue-500/30")
            )}>
              <div className={cn(
                "p-1 rounded",
                alert.severity === "critical"
                  ? (isLight ? "text-red-600" : "text-red-400")
                  : alert.severity === "warning"
                    ? (isLight ? "text-amber-600" : "text-amber-400")
                    : (isLight ? "text-blue-600" : "text-blue-400")
              )}>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className={cn("text-sm", text)}>{alert.message}</div>
                <div className={cn("text-[10px] mt-0.5", muted)}>{alert.time}</div>
              </div>
              <Badge className={cn(
                "text-[10px] uppercase",
                alert.severity === "critical"
                  ? (isLight ? "bg-red-100 text-red-700" : "bg-red-500/20 text-red-400")
                  : alert.severity === "warning"
                    ? (isLight ? "bg-amber-100 text-amber-700" : "bg-amber-500/20 text-amber-400")
                    : (isLight ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-400")
              )}>
                {alert.severity}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Dry Dock & Maintenance Schedule ─── */}
      <div className={cn(cardBg, "overflow-hidden")}>
        <div className={cn("px-5 py-4 border-b flex items-center gap-2", tableBorder)}>
          <Wrench className={cn("w-4 h-4", isLight ? "text-orange-600" : "text-orange-400")} />
          <h2 className={cn("text-base font-semibold", text)}>Dry Dock &amp; Maintenance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={cn("border-b text-left", tableBorder)}>
                {["Vessel", "Type", "Shipyard", "Start Date", "Est. Completion", "Status", "Cost Est.", "Notes"].map(h => (
                  <th key={h} className={cn("px-4 py-2.5 text-xs font-medium whitespace-nowrap", muted)}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { vessel: "COSCO HARMONY", type: "Scheduled Dry Dock", yard: "Keppel FELS, Singapore", start: "2026-03-15", end: "2026-05-15", status: "in_progress", cost: 4200000, notes: "Hull cleaning, propeller polish, ballast system overhaul" },
                { vessel: "MSC AURORA", type: "Intermediate Survey", yard: "TBD — Shanghai/Busan", start: "2026-06-01", end: "2026-06-15", status: "scheduled", cost: 850000, notes: "Class survey due, underwater inspection" },
                { vessel: "MAERSK SENTOSA", type: "Engine Overhaul", yard: "Hyundai HI, Ulsan", start: "2026-07-10", end: "2026-07-28", status: "scheduled", cost: 1600000, notes: "Main engine piston & liner replacement" },
                { vessel: "ONE COMMITMENT", type: "ISPS Remediation", yard: "In-service", start: "2026-04-10", end: "2026-04-12", status: "planned", cost: 45000, notes: "Address overdue ISPS audit findings" },
                { vessel: "ZIM SAMSON", type: "Scrubber Retrofit", yard: "Sembcorp Marine, SG", start: "2026-08-01", end: "2026-09-10", status: "scheduled", cost: 3800000, notes: "Hybrid scrubber installation — IMO 2025 compliance" },
              ].map((m, idx) => {
                const statusColors: Record<string, { bg: string; lightBg: string }> = {
                  in_progress: { bg: "bg-blue-500/20 text-blue-400", lightBg: "bg-blue-100 text-blue-700" },
                  scheduled: { bg: "bg-slate-500/20 text-slate-400", lightBg: "bg-slate-200 text-slate-600" },
                  planned: { bg: "bg-amber-500/20 text-amber-400", lightBg: "bg-amber-100 text-amber-700" },
                  completed: { bg: "bg-green-500/20 text-green-400", lightBg: "bg-green-100 text-green-700" },
                };
                const st = statusColors[m.status] || statusColors.scheduled;
                return (
                  <tr key={idx} className={cn("border-b", tableBorder, tableHover)}>
                    <td className={cn("px-4 py-2.5 text-xs font-medium", text)}>{m.vessel}</td>
                    <td className={cn("px-4 py-2.5 text-xs", text)}>{m.type}</td>
                    <td className={cn("px-4 py-2.5 text-xs", muted)}>{m.yard}</td>
                    <td className={cn("px-4 py-2.5 text-xs", muted)}>{fmtDate(m.start)}</td>
                    <td className={cn("px-4 py-2.5 text-xs", muted)}>{fmtDate(m.end)}</td>
                    <td className="px-4 py-2.5">
                      <Badge className={cn("text-[10px]", isLight ? st.lightBg : st.bg)}>{m.status.replace(/_/g, " ")}</Badge>
                    </td>
                    <td className={cn("px-4 py-2.5 text-xs font-medium", text)}>{fmtCurrency(m.cost)}</td>
                    <td className={cn("px-4 py-2.5 text-xs max-w-[200px] truncate", muted)}>{m.notes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={cn("px-5 py-3 border-t flex items-center gap-4", tableBorder)}>
          <span className={cn("text-xs font-medium", text)}>
            Total maintenance budget: {fmtCurrency(10495000)}
          </span>
          <span className={cn("text-xs", isLight ? "text-blue-600" : "text-blue-400")}>
            1 in progress
          </span>
          <span className={cn("text-xs", muted)}>
            4 upcoming
          </span>
        </div>
      </div>

      {/* ─── Trade Lane Revenue Breakdown ─── */}
      <div className={cn(cardBg, "overflow-hidden")}>
        <div className={cn("px-5 py-4 border-b flex items-center gap-2", tableBorder)}>
          <Globe className={cn("w-4 h-4", isLight ? "text-teal-600" : "text-teal-400")} />
          <h2 className={cn("text-base font-semibold", text)}>Revenue by Trade Lane</h2>
          <span className={cn("text-xs ml-auto", muted)}>Month-to-date</span>
        </div>
        <div className="p-4 space-y-3">
          {[
            { lane: "USWC → East Asia", revenue: 3120000, voyages: 2, pctOfTotal: 26 },
            { lane: "USEC → North Europe", revenue: 3660000, voyages: 2, pctOfTotal: 30 },
            { lane: "USEC → UK / Ireland", revenue: 3100000, voyages: 1, pctOfTotal: 26 },
            { lane: "USEC → Mediterranean", revenue: 1820000, voyages: 1, pctOfTotal: 15 },
            { lane: "USGC → South America", revenue: 450000, voyages: 1, pctOfTotal: 3 },
          ].map(item => (
            <div key={item.lane} className={cn(
              "p-3 rounded-lg border flex items-center justify-between",
              isLight ? "bg-slate-50 border-slate-100" : "bg-slate-800/40 border-slate-700/40"
            )}>
              <div className="flex-1">
                <div className={cn("text-sm font-medium", text)}>{item.lane}</div>
                <div className={cn("text-[10px]", muted)}>{item.voyages} voyage{item.voyages !== 1 ? "s" : ""}</div>
                <div className="mt-1.5">
                  <div className={cn("w-full h-1.5 rounded-full", isLight ? "bg-slate-200" : "bg-slate-700")}>
                    <div className="h-full rounded-full bg-teal-500" style={{ width: `${item.pctOfTotal}%` }} />
                  </div>
                </div>
              </div>
              <div className="ml-4 text-right">
                <div className={cn("text-sm font-bold", isLight ? "text-emerald-700" : "text-emerald-400")}>{fmtCurrency(item.revenue)}</div>
                <div className={cn("text-[10px]", muted)}>{item.pctOfTotal}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Environmental & Emissions ─── */}
      <div className={cn(cardBg, "overflow-hidden")}>
        <div className={cn("px-5 py-4 border-b flex items-center gap-2", tableBorder)}>
          <Waves className={cn("w-4 h-4", isLight ? "text-green-600" : "text-green-400")} />
          <h2 className={cn("text-base font-semibold", text)}>Environmental &amp; Emissions</h2>
          <span className={cn("text-xs ml-auto", muted)}>IMO CII compliance tracking</span>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Fleet CII Rating", value: "B", sub: "Above required", color: isLight ? "text-blue-700" : "text-blue-400" },
            { label: "CO2 Emissions (MTD)", value: "42,800 MT", sub: "-8% vs last month", color: isLight ? "text-green-700" : "text-green-400" },
            { label: "SOx Compliance", value: "100%", sub: "All vessels compliant", color: isLight ? "text-emerald-700" : "text-emerald-400" },
            { label: "EEXI Status", value: "7/8 pass", sub: "1 vessel in dry dock", color: isLight ? "text-cyan-700" : "text-cyan-400" },
          ].map(m => (
            <div key={m.label} className={cn(
              "p-3 rounded-lg border",
              isLight ? "bg-slate-50 border-slate-100" : "bg-slate-800/40 border-slate-700/40"
            )}>
              <div className={cn("text-lg font-bold", m.color)}>{m.value}</div>
              <div className={cn("text-xs font-medium", text)}>{m.label}</div>
              <div className={cn("text-[10px]", muted)}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div className={cn("text-center text-xs py-4", muted)}>
        Fleet data refreshes every 30s &bull; Last updated: {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}