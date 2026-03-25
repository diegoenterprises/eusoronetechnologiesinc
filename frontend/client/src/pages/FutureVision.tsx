/**
 * FUTURE VISION & INNOVATION HUB
 * Next-generation logistics technology dashboard featuring:
 * - Technology readiness radar overview
 * - Autonomous vehicle fleet management
 * - EV/Hydrogen fleet operations
 * - Blockchain smart contracts
 * - AI/ML predictions & model performance
 * - ESG/Sustainability & carbon tracking
 * - Digital twin visualization
 * - Innovation roadmap timeline
 * - Drone delivery operations
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Cpu,
  Zap,
  Truck,
  Shield,
  Leaf,
  BarChart3,
  GitBranch,
  Satellite,
  BatteryCharging,
  Atom,
  Eye,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Gauge,
  RefreshCw,
  Activity,
  Layers,
  Box,
  Workflow,
  FileCheck,
  Flame,
  Droplets,
  Wind,
  ChevronRight,
  Signal,
  Radio,
  CircleDot,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

type TabKey =
  | "overview"
  | "autonomous"
  | "ev-fleet"
  | "blockchain"
  | "ai-predictions"
  | "esg"
  | "carbon"
  | "digital-twin"
  | "roadmap"
  | "drone";

// ═══════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

function GlowCard({
  children,
  className = "",
  glowColor = "cyan",
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: "cyan" | "teal" | "emerald" | "violet" | "amber" | "rose";
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const glowMap = {
    cyan: "shadow-cyan-500/10 hover:shadow-cyan-500/20 border-cyan-500/20",
    teal: "shadow-teal-500/10 hover:shadow-teal-500/20 border-teal-500/20",
    emerald: "shadow-emerald-500/10 hover:shadow-emerald-500/20 border-emerald-500/20",
    violet: "shadow-violet-500/10 hover:shadow-violet-500/20 border-violet-500/20",
    amber: "shadow-amber-500/10 hover:shadow-amber-500/20 border-amber-500/20",
    rose: "shadow-rose-500/10 hover:shadow-rose-500/20 border-rose-500/20",
  };
  return (
    <Card
      className={`${isLight ? "bg-white" : "bg-zinc-900/80"} border transition-shadow duration-300 shadow-lg ${glowMap[glowColor]} ${className}`}
    >
      {children}
    </Card>
  );
}

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  color = "cyan",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "stable";
  color?: "cyan" | "teal" | "emerald" | "violet" | "amber" | "rose";
}) {
  const colorMap = {
    cyan: "text-cyan-400",
    teal: "text-teal-400",
    emerald: "text-emerald-400",
    violet: "text-violet-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
  };
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <GlowCard glowColor={color} className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} uppercase tracking-wider`}>{label}</p>
          <p className={`text-2xl font-bold mt-1 ${colorMap[color]}`}>{value}</p>
          {sub && <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} mt-0.5`}>{sub}</p>}
        </div>
        <div className={`p-2 rounded-lg ${isLight ? "bg-slate-100" : "bg-zinc-800/80"} ${colorMap[color]}`}>
          <Icon size={18} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center mt-2 gap-1">
          {trend === "up" && <TrendingUp size={12} className="text-emerald-400" />}
          {trend === "down" && <TrendingDown size={12} className="text-rose-400" />}
          {trend === "stable" && <Activity size={12} className="text-amber-400" />}
          <span className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"}`}>{trend === "up" ? "Improving" : trend === "down" ? "Declining" : "Stable"}</span>
        </div>
      )}
    </GlowCard>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const neutralText = isLight ? "text-slate-500" : "text-zinc-400";
  const map: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    in_progress: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    completed: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    planned: `bg-zinc-500/20 ${neutralText} border-zinc-500/30`,
    pilot: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    research: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    at_risk: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    on_track: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    compliant: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    preparing: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    monitoring: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    confirmed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    disputed: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    en_route: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    available: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    charging: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    maintenance: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    docked: `bg-zinc-500/20 ${neutralText} border-zinc-500/30`,
    refueling: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    in_flight: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    standby: `bg-zinc-500/20 ${neutralText} border-zinc-500/30`,
    returning: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    running: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    experimental: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    operational: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    in_compliance: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    shadow: `bg-zinc-500/20 ${neutralText} border-zinc-500/30`,
    production: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    testing: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    pending_approval: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    auto_approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    verified: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    critical: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    high: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    improving: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    stable: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  };
  const cls = map[status] || `bg-zinc-500/20 ${neutralText} border-zinc-500/30`;
  return (
    <Badge variant="outline" className={`text-xs uppercase ${cls}`}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

function RadarChart({ scores }: { scores: Record<string, number> }) {
  const keys = Object.keys(scores);
  const n = keys.length;
  const cx = 140;
  const cy = 140;
  const r = 110;

  const labels: Record<string, string> = {
    autonomousVehicles: "Autonomous",
    electricFleet: "EV Fleet",
    blockchain: "Blockchain",
    aiMl: "AI/ML",
    droneDelivery: "Drone",
    esgSustainability: "ESG",
    smartInfrastructure: "Smart Infra",
    digitalTwin: "Digital Twin",
  };

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const dist = (value / 100) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  };

  const rings = [25, 50, 75, 100];
  const dataPoints = keys.map((k, i) => getPoint(i, scores[k]));
  const pathD = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg viewBox="0 0 280 280" className="w-full max-w-[320px] mx-auto">
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={keys.map((_, i) => { const p = getPoint(i, ring); return `${p.x},${p.y}`; }).join(" ")}
          fill="none"
          stroke="rgba(100,116,139,0.2)"
          strokeWidth="1"
        />
      ))}
      {keys.map((_, i) => {
        const p = getPoint(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(100,116,139,0.15)" strokeWidth="1" />;
      })}
      <polygon points={dataPoints.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="none" />
      <path d={pathD} fill="rgba(6,182,212,0.15)" stroke="rgb(6,182,212)" strokeWidth="2" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="rgb(6,182,212)" stroke="rgb(8,145,178)" strokeWidth="1.5" />
      ))}
      {keys.map((k, i) => {
        const p = getPoint(i, 118);
        const label = labels[k] || k;
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" className="fill-zinc-400 text-xs">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

function ProgressBar({ value, max = 100, color = "cyan" }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const colorMap: Record<string, string> = {
    cyan: "bg-cyan-500",
    teal: "bg-teal-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    violet: "bg-violet-500",
  };
  return (
    <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${colorMap[color] || "bg-cyan-500"}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB PANELS
// ═══════════════════════════════════════════════════════════════════════

function OverviewPanel() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const dashboard = (trpc as any).futureVision.getInnovationDashboard.useQuery();
  const readiness = (trpc as any).futureVision.getTechnologyReadinessScore.useQuery();
  const d = dashboard.data as any;
  const r = readiness.data as any;

  if (dashboard.isLoading || readiness.isLoading) {
    return <div className="space-y-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Overall Readiness" value={`${d?.overallReadiness ?? 0}%`} icon={Gauge} color="cyan" trend="up" />
        <MetricCard label="Active Projects" value={d?.activeProjects ?? 0} icon={Layers} color="teal" />
        <MetricCard label="Budget Utilization" value={`${d ? Math.round((d.totalSpent / d.totalBudget) * 100) : 0}%`} sub={`$${((d?.totalSpent ?? 0) / 1_000_000).toFixed(1)}M / $${((d?.totalBudget ?? 0) / 1_000_000).toFixed(1)}M`} icon={BarChart3} color="emerald" />
        <MetricCard label="Milestones Completed" value={d?.completedMilestones ?? 0} sub={`${d?.upcomingMilestones ?? 0} upcoming`} icon={Target} color="violet" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <GlowCard className="p-5">
          <h3 className="text-sm font-semibold text-cyan-400 mb-4 flex items-center gap-2">
            <Atom size={16} /> Technology Readiness Radar
          </h3>
          {d?.radarScores && <RadarChart scores={d.radarScores} />}
        </GlowCard>

        {/* Readiness Categories */}
        <GlowCard className="p-5" glowColor="teal">
          <h3 className="text-sm font-semibold text-teal-400 mb-4 flex items-center gap-2">
            <BarChart3 size={16} /> Readiness by Category
          </h3>
          <ScrollArea className="h-[280px]">
            <div className="space-y-3 pr-3">
              {(r?.categories || []).map((cat: any) => (
                <div key={cat.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={isLight ? "text-slate-600" : "text-zinc-300"}>{cat.name}</span>
                    <span className="text-teal-400 font-mono">{cat.score}/100</span>
                  </div>
                  <ProgressBar value={cat.score} color={cat.score >= 70 ? "emerald" : cat.score >= 40 ? "amber" : "rose"} />
                </div>
              ))}
            </div>
          </ScrollArea>
          {r?.peerComparison && (
            <div className={`mt-4 pt-3 border-t ${isLight ? "border-slate-200" : "border-zinc-800"} flex justify-between text-xs ${isLight ? "text-slate-500" : "text-zinc-500"}`}>
              <span>Industry Avg: {r.peerComparison.industryAvg}</span>
              <span>Rank: #{r.peerComparison.ourRank} / {r.peerComparison.outOf}</span>
            </div>
          )}
        </GlowCard>
      </div>

      {/* Initiatives */}
      <GlowCard className="p-5" glowColor="cyan">
        <h3 className="text-sm font-semibold text-cyan-400 mb-4">All Innovation Initiatives</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={`${isLight ? "text-slate-500" : "text-zinc-500"} border-b ${isLight ? "border-slate-200" : "border-zinc-800"}`}>
                <th className="text-left py-2 px-2">Initiative</th>
                <th className="text-left py-2 px-2">Phase</th>
                <th className="text-left py-2 px-2">Readiness</th>
                <th className="text-left py-2 px-2">Status</th>
                <th className="text-right py-2 px-2">Budget</th>
              </tr>
            </thead>
            <tbody>
              {(d?.initiatives || []).map((init: any) => (
                <tr key={init.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="py-2 px-2 text-zinc-200">{init.name}</td>
                  <td className={`py-2 px-2 ${isLight ? "text-slate-500" : "text-zinc-400"}`}>{init.phase}</td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={init.readiness} color={init.readiness >= 70 ? "emerald" : init.readiness >= 40 ? "cyan" : "amber"} />
                      <span className={`${isLight ? "text-slate-500" : "text-zinc-400"} font-mono w-8`}>{init.readiness}%</span>
                    </div>
                  </td>
                  <td className="py-2 px-2"><StatusBadge status={init.status} /></td>
                  <td className={`py-2 px-2 text-right ${isLight ? "text-slate-500" : "text-zinc-400"} font-mono`}>${(init.budget / 1_000_000).toFixed(1)}M</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlowCard>
    </div>
  );
}

function AutonomousPanel() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const fleet = (trpc as any).futureVision.getAutonomousFleetStatus.useQuery();
  const routes = (trpc as any).futureVision.getAutonomousRoutes.useQuery();
  const safety = (trpc as any).futureVision.getAutonomousSafetyMetrics.useQuery();
  const f = fleet.data as any;
  const rt = routes.data as any;
  const s = safety.data as any;

  if (fleet.isLoading) return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total AV Fleet" value={f?.totalVehicles ?? 0} icon={Truck} color="cyan" />
        <MetricCard label="Safety Score" value={`${s?.overallSafetyScore ?? 0}%`} icon={Shield} color="emerald" trend="up" />
        <MetricCard label="Autonomous Miles" value={`${((f?.fleetMetrics?.totalMilesAutonomous ?? 0) / 1000).toFixed(1)}K`} icon={MapPin} color="teal" />
        <MetricCard label="Cost Savings" value={`$${((f?.fleetMetrics?.costSavingsVsManual ?? 0) / 1000).toFixed(0)}K`} icon={TrendingUp} color="emerald" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Autonomy Levels */}
        <GlowCard className="p-5">
          <h3 className="text-sm font-semibold text-cyan-400 mb-4">Fleet by Autonomy Level</h3>
          <div className="space-y-3">
            {(f?.byLevel || []).map((level: any) => (
              <div key={level.level} className={`flex items-center justify-between p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-zinc-800/50"}`}>
                <div>
                  <span className="text-cyan-400 font-mono font-bold">{level.level}</span>
                  <span className={`${isLight ? "text-slate-500" : "text-zinc-400"} text-xs ml-2`}>{level.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"}`}>{level.operational}/{level.count} operational</span>
                  <StatusBadge status={level.status} />
                </div>
              </div>
            ))}
          </div>
        </GlowCard>

        {/* Safety Trend */}
        <GlowCard className="p-5" glowColor="emerald">
          <h3 className="text-sm font-semibold text-emerald-400 mb-4">Safety Trend (6 months)</h3>
          <div className="space-y-2">
            {(s?.monthlyTrend || []).map((m: any) => (
              <div key={m.month} className="flex items-center gap-3">
                <span className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} w-16 font-mono`}>{m.month}</span>
                <div className="flex-1"><ProgressBar value={m.safetyScore} color="emerald" /></div>
                <span className="text-xs text-emerald-400 font-mono w-12 text-right">{m.safetyScore}%</span>
                <span className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} w-10 text-right`}>{m.disengagements}d</span>
              </div>
            ))}
          </div>
          {s?.topDisengagementReasons && (
            <div className="mt-4 pt-3 border-t border-zinc-800">
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} uppercase mb-2`}>Top Disengagement Reasons</p>
              {s.topDisengagementReasons.slice(0, 3).map((r: any, i: number) => (
                <div key={i} className="flex justify-between text-xs py-1">
                  <span className={isLight ? "text-slate-500" : "text-zinc-400"}>{r.reason}</span>
                  <span className={isLight ? "text-slate-500" : "text-zinc-500"}>{r.count}x</span>
                </div>
              ))}
            </div>
          )}
        </GlowCard>
      </div>

      {/* Vehicles */}
      <GlowCard className="p-5">
        <h3 className="text-sm font-semibold text-cyan-400 mb-4">Active Autonomous Vehicles</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {(f?.vehicles || []).map((v: any) => (
            <div key={v.id} className={`p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-zinc-800/50"} border ${isLight ? "border-slate-200" : "border-zinc-700/50"} flex justify-between items-center`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-mono text-sm font-bold">{v.unitNumber}</span>
                  <Badge variant="outline" className="text-xs bg-zinc-800 border-cyan-500/30 text-cyan-400">{v.level}</Badge>
                  <StatusBadge status={v.status} />
                </div>
                {v.destination && <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} mt-1`}>To: {v.destination} (ETA: {v.eta})</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-emerald-400">Safety: {v.safetyScore}%</p>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"}`}>{v.milesDriven.toLocaleString()} mi</p>
              </div>
            </div>
          ))}
        </div>
      </GlowCard>

      {/* Approved Corridors */}
      <GlowCard className="p-5" glowColor="teal">
        <h3 className="text-sm font-semibold text-teal-400 mb-4">Approved Corridors & Geofenced Zones</h3>
        <div className="space-y-2">
          {(rt?.approvedCorridors || []).map((c: any) => (
            <div key={c.id} className="flex items-center justify-between p-2 rounded bg-zinc-800/30 text-xs">
              <div className="flex items-center gap-2">
                <MapPin size={12} className="text-teal-400" />
                <span className={isLight ? "text-slate-600" : "text-zinc-300"}>{c.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={isLight ? "text-slate-500" : "text-zinc-500"}>{c.distance} mi</span>
                <Badge variant="outline" className="text-xs border-teal-500/30 text-teal-400">{c.levelRequired}</Badge>
                <StatusBadge status={c.status} />
              </div>
            </div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
}

function EvFleetPanel() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const ev = (trpc as any).futureVision.getEvFleetManagement.useQuery();
  const charging = (trpc as any).futureVision.getChargingStationNetwork.useQuery();
  const h2 = (trpc as any).futureVision.getHydrogenFleetStatus.useQuery();
  const e = ev.data as any;
  const cs = charging.data as any;
  const h = h2.data as any;

  if (ev.isLoading) return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="EV Fleet" value={`${e?.totalEvs ?? 0} vehicles`} sub={`${e?.operational ?? 0} operational`} icon={Zap} color="emerald" />
        <MetricCard label="Avg Charge" value={`${e?.fleetMetrics?.avgChargeLevel ?? 0}%`} icon={BatteryCharging} color="cyan" />
        <MetricCard label="CO2 Reduced" value={`${(e?.fleetMetrics?.co2ReductionTons ?? 0).toFixed(1)}t`} icon={Leaf} color="emerald" trend="up" />
        <MetricCard label="Monthly Savings" value={`$${((e?.fleetMetrics?.monthlyFuelSavings ?? 0) / 1000).toFixed(1)}K`} sub={`$${e?.fleetMetrics?.avgCostPerMile ?? 0}/mi vs $${e?.fleetMetrics?.dieselCostPerMile ?? 0}/mi`} icon={TrendingUp} color="teal" />
      </div>

      {/* EV Vehicles */}
      <GlowCard className="p-5" glowColor="emerald">
        <h3 className="text-sm font-semibold text-emerald-400 mb-4 flex items-center gap-2">
          <Zap size={16} /> Electric Vehicle Fleet
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {(e?.vehicles || []).map((v: any) => (
            <div key={v.id} className={`p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-zinc-800/50"} border ${isLight ? "border-slate-200" : "border-zinc-700/50"}`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-emerald-400 font-mono font-bold">{v.unitNumber}</span>
                  <span className={`${isLight ? "text-slate-500" : "text-zinc-500"} text-xs ml-2`}>{v.make} {v.model}</span>
                </div>
                <StatusBadge status={v.status} />
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className={isLight ? "text-slate-500" : "text-zinc-500"}>Battery</span>
                  <span className="text-emerald-400 font-mono">{v.currentCharge}% ({v.rangeRemaining} mi)</span>
                </div>
                <ProgressBar value={v.currentCharge} color={v.currentCharge > 50 ? "emerald" : v.currentCharge > 20 ? "amber" : "rose"} />
              </div>
              {v.estimatedArrival && <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} mt-2`}>ETA: {v.estimatedArrival}</p>}
            </div>
          ))}
        </div>
      </GlowCard>

      {/* Charging Stations */}
      <GlowCard className="p-5" glowColor="cyan">
        <h3 className="text-sm font-semibold text-cyan-400 mb-4 flex items-center gap-2">
          <BatteryCharging size={16} /> Charging Station Network
          <span className={`${isLight ? "text-slate-500" : "text-zinc-500"} font-normal ml-auto`}>{cs?.available ?? 0}/{cs?.totalStations ?? 0} available</span>
        </h3>
        <div className="space-y-2">
          {(cs?.stations || []).map((s: any) => (
            <div key={s.id} className="flex items-center justify-between p-2 rounded bg-zinc-800/30 text-xs">
              <div className="flex items-center gap-2">
                <BatteryCharging size={12} className="text-cyan-400" />
                <span className={isLight ? "text-slate-600" : "text-zinc-300"}>{s.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={isLight ? "text-slate-500" : "text-zinc-500"}>{s.power}kW</span>
                <span className={isLight ? "text-slate-500" : "text-zinc-500"}>{s.available}/{s.ports} ports</span>
                <span className="text-cyan-400 font-mono">${s.pricePerKwh}/kWh</span>
              </div>
            </div>
          ))}
        </div>
      </GlowCard>

      {/* Hydrogen */}
      <GlowCard className="p-5" glowColor="violet">
        <h3 className="text-sm font-semibold text-violet-400 mb-4 flex items-center gap-2">
          <Flame size={16} /> Hydrogen Fuel Cell Fleet
          <Badge variant="outline" className="text-xs border-violet-500/30 text-violet-400 ml-2">PILOT</Badge>
        </h3>
        <div className="grid md:grid-cols-3 gap-3">
          {(h?.vehicles || []).map((v: any) => (
            <div key={v.id} className={`p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-zinc-800/50"} border ${isLight ? "border-slate-200" : "border-zinc-700/50"}`}>
              <div className="flex justify-between">
                <span className="text-violet-400 font-mono font-bold text-sm">{v.unitNumber}</span>
                <StatusBadge status={v.status} />
              </div>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} mt-1`}>{v.make} {v.model}</p>
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className={isLight ? "text-slate-500" : "text-zinc-500"}>H2 Tank</span>
                  <span className="text-violet-400 font-mono">{v.currentFuel}%</span>
                </div>
                <ProgressBar value={v.currentFuel} color="violet" />
              </div>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} mt-1`}>Range: {v.rangeRemaining} mi</p>
            </div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
}

function BlockchainPanel() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const bc = (trpc as any).futureVision.getBlockchainFreight.useQuery();
  const sc = (trpc as any).futureVision.getSmartContractStatus.useQuery();
  const b = bc.data as any;
  const s = sc.data as any;

  if (bc.isLoading) return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Network" value={b?.networkStatus === "operational" ? "Online" : "Offline"} icon={GitBranch} color="cyan" />
        <MetricCard label="Transactions" value={(b?.totalTransactions ?? 0).toLocaleString()} icon={FileCheck} color="teal" />
        <MetricCard label="Smart Contracts" value={b?.smartContractsActive ?? 0} sub="Active" icon={Workflow} color="emerald" />
        <MetricCard label="Cost Savings" value={`$${((b?.verificationMetrics?.costSavingsFromAutomation ?? 0) / 1000).toFixed(0)}K`} icon={TrendingUp} color="violet" />
      </div>

      {/* Recent Transactions */}
      <GlowCard className="p-5" glowColor="cyan">
        <h3 className="text-sm font-semibold text-cyan-400 mb-4 flex items-center gap-2">
          <GitBranch size={16} /> Recent Blockchain Transactions
        </h3>
        <div className="space-y-2">
          {(b?.recentTransactions || []).map((tx: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-cyan-400 font-mono text-xs">{tx.txHash}</span>
                <Badge variant="outline" className={`text-xs border-zinc-600 ${isLight ? "text-slate-500" : "text-zinc-400"}`}>{tx.type.replace(/_/g, " ")}</Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className={isLight ? "text-slate-500" : "text-zinc-500"}>{tx.loadId}</span>
                <StatusBadge status={tx.status} />
              </div>
            </div>
          ))}
        </div>
      </GlowCard>

      {/* Smart Contracts */}
      <GlowCard className="p-5" glowColor="teal">
        <h3 className="text-sm font-semibold text-teal-400 mb-4 flex items-center gap-2">
          <Workflow size={16} /> Smart Contracts
          <span className={`${isLight ? "text-slate-500" : "text-zinc-500"} font-normal ml-auto`}>{s?.active ?? 0} active / {s?.totalContracts ?? 0} total</span>
        </h3>
        <div className="space-y-3">
          {(s?.contracts || []).map((c: any) => (
            <div key={c.id} className={`p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-zinc-800/50"} border ${isLight ? "border-slate-200" : "border-zinc-700/50"}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-teal-400 font-mono font-bold">{c.id}</span>
                    <Badge variant="outline" className={`text-xs border-zinc-600 ${isLight ? "text-slate-500" : "text-zinc-400"}`}>{c.type.replace(/_/g, " ")}</Badge>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} mt-1`}>{c.parties.join(" <-> ")}</p>
                </div>
                <span className="text-teal-400 font-mono">${c.value.toLocaleString()}</span>
              </div>
              <div className="flex gap-2 mt-3">
                {c.milestones.map((m: any, i: number) => (
                  <div key={i} className="flex items-center gap-1">
                    {m.completed ? (
                      <CheckCircle size={12} className="text-emerald-400" />
                    ) : (
                      <CircleDot size={12} className="text-zinc-600" />
                    )}
                    <span className={`text-xs ${m.completed ? (isLight ? "text-slate-500" : "text-zinc-400") : "text-zinc-600"}`}>{m.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
}

function AiPredictionsPanel() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const predictions = (trpc as any).futureVision.getAiPredictions.useQuery();
  const models = (trpc as any).futureVision.getAiModelPerformance.useQuery();
  const maintenanceAi = (trpc as any).futureVision.getPredictiveMaintenanceAi.useQuery();
  const p = predictions.data as any;
  const m = models.data as any;
  const ma = maintenanceAi.data as any;

  if (predictions.isLoading) return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Avg Model Accuracy" value={`${m?.aggregateMetrics?.avgAccuracy ?? 0}%`} icon={Target} color="cyan" trend="up" />
        <MetricCard label="Predictions (24h)" value={(m?.aggregateMetrics?.totalPredictions24h ?? 0).toLocaleString()} icon={Activity} color="teal" />
        <MetricCard label="Prevented Breakdowns" value={ma?.preventedBreakdowns30d ?? 0} sub="Last 30 days" icon={Shield} color="emerald" />
        <MetricCard label="Demand Next Week" value={p?.demandForecast?.nextWeek?.totalLoads ?? 0} sub={`${p?.demandForecast?.nextWeek?.confidence ?? 0}% confidence`} icon={BarChart3} color="violet" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Model Performance */}
        <GlowCard className="p-5" glowColor="cyan">
          <h3 className="text-sm font-semibold text-cyan-400 mb-4 flex items-center gap-2">
            <Cpu size={16} /> AI Model Performance
          </h3>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2 pr-3">
              {(m?.models || []).map((model: any) => (
                <div key={model.name} className="p-2 rounded bg-zinc-800/30 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-zinc-200">{model.name}</span>
                    <span className="text-zinc-600 ml-2">v{model.version}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-cyan-400 font-mono">{model.accuracy}%</span>
                    <span className={isLight ? "text-slate-500" : "text-zinc-500"}>{model.latencyMs}ms</span>
                    <StatusBadge status={model.status} />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </GlowCard>

        {/* Demand Forecast */}
        <GlowCard className="p-5" glowColor="violet">
          <h3 className="text-sm font-semibold text-violet-400 mb-4 flex items-center gap-2">
            <BarChart3 size={16} /> Demand Forecast
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-zinc-800/50"}`}>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} uppercase`}>Next Week</p>
              <p className="text-xl font-bold text-violet-400">{p?.demandForecast?.nextWeek?.totalLoads ?? 0}</p>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"}`}>{p?.demandForecast?.nextWeek?.confidence}% confidence</p>
            </div>
            <div className={`p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-zinc-800/50"}`}>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} uppercase`}>Next Month</p>
              <p className="text-xl font-bold text-violet-400">{p?.demandForecast?.nextMonth?.totalLoads?.toLocaleString() ?? 0}</p>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"}`}>{p?.demandForecast?.nextMonth?.confidence}% confidence</p>
            </div>
          </div>
          <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} uppercase mb-2`}>Hot Lanes</p>
          {(p?.demandForecast?.hotLanes || []).map((lane: any, i: number) => (
            <div key={i} className="flex justify-between text-xs py-1.5 border-b border-zinc-800/50">
              <span className={isLight ? "text-slate-600" : "text-zinc-300"}>{lane.origin} → {lane.destination}</span>
              <span className="text-violet-400 font-mono">{lane.predictedVolume} loads</span>
            </div>
          ))}
        </GlowCard>
      </div>

      {/* Predictive Maintenance */}
      <GlowCard className="p-5" glowColor="amber">
        <h3 className="text-sm font-semibold text-amber-400 mb-4 flex items-center gap-2">
          <AlertTriangle size={16} /> AI Predictive Maintenance Alerts
          <span className={`${isLight ? "text-slate-500" : "text-zinc-500"} font-normal ml-auto`}>{ma?.alertsGenerated24h ?? 0} alerts today / ${((ma?.costSaved30d ?? 0) / 1000).toFixed(0)}K saved</span>
        </h3>
        <div className="space-y-2">
          {(ma?.predictions || []).map((pred: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30 text-xs">
              <div className="flex items-center gap-3">
                <StatusBadge status={pred.priority} />
                <div>
                  <span className="text-zinc-200">{pred.vehicleId}</span>
                  <span className={`${isLight ? "text-slate-500" : "text-zinc-500"} ml-2`}>{pred.component}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={isLight ? "text-slate-500" : "text-zinc-500"}>Health: {pred.healthScore}%</span>
                <span className="text-amber-400 font-mono">{pred.predictedFailure}</span>
                <span className={isLight ? "text-slate-500" : "text-zinc-500"}>${pred.estimatedCost.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
}

function EsgPanel() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const esg = (trpc as any).futureVision.getEsgDashboard.useQuery();
  const goals = (trpc as any).futureVision.getSustainabilityGoals.useQuery();
  const emissions = (trpc as any).futureVision.getEmissionsReporting.useQuery();
  const e = esg.data as any;
  const g = goals.data as any;
  const em = emissions.data as any;

  if (esg.isLoading) return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Overall ESG Score" value={`${e?.overallScore ?? 0}/100`} icon={Leaf} color="emerald" trend="up" />
        <MetricCard label="Environmental" value={`${e?.environmental?.score ?? 0}`} sub={e?.environmental?.trend} icon={Wind} color="teal" />
        <MetricCard label="Social" value={`${e?.social?.score ?? 0}`} sub={e?.social?.trend} icon={Target} color="cyan" />
        <MetricCard label="Governance" value={`${e?.governance?.score ?? 0}`} sub={e?.governance?.trend} icon={Shield} color="violet" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ESG Scores */}
        <GlowCard className="p-5" glowColor="emerald">
          <h3 className="text-sm font-semibold text-emerald-400 mb-4">ESG Performance</h3>
          <div className="space-y-4">
            {["environmental", "social", "governance"].map((dim) => {
              const data = e?.[dim];
              if (!data) return null;
              const metrics = data.metrics || {};
              return (
                <div key={dim}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`${isLight ? "text-slate-600" : "text-zinc-300"} capitalize`}>{dim}</span>
                    <span className="text-emerald-400 font-mono">{data.score}/100</span>
                  </div>
                  <ProgressBar value={data.score} color={data.score >= 70 ? "emerald" : data.score >= 50 ? "amber" : "rose"} />
                  <div className="grid grid-cols-2 gap-x-4 mt-2">
                    {Object.entries(metrics).map(([key, val]) => (
                      <div key={key} className="flex justify-between text-xs py-0.5">
                        <span className={`${isLight ? "text-slate-500" : "text-zinc-500"} capitalize`}>{key.replace(/([A-Z])/g, " $1")}</span>
                        <span className={isLight ? "text-slate-500" : "text-zinc-400"}>{typeof val === "number" && val > 1000 ? (val as number).toLocaleString() : String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {e?.industryBenchmark && (
            <div className={`mt-4 pt-3 border-t ${isLight ? "border-slate-200" : "border-zinc-800"} text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} flex justify-between`}>
              <span>Industry Rank: #{e.industryBenchmark.ourRank} / {e.industryBenchmark.outOf}</span>
              <span>Top Quartile: {e.industryBenchmark.topQuartile}</span>
            </div>
          )}
        </GlowCard>

        {/* Sustainability Goals */}
        <GlowCard className="p-5" glowColor="teal">
          <h3 className="text-sm font-semibold text-teal-400 mb-4">Sustainability Goals</h3>
          <div className="space-y-3">
            {(g?.goals || []).map((goal: any) => (
              <div key={goal.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={isLight ? "text-slate-600" : "text-zinc-300"}>{goal.name}</span>
                  <StatusBadge status={goal.status} />
                </div>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} mb-1`}>{goal.target}</p>
                <ProgressBar value={goal.current} max={goal.targetValue} color={goal.status === "on_track" ? "teal" : "amber"} />
                <div className={`flex justify-between text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} mt-0.5`}>
                  <span>{goal.current}{goal.unit === "percent" ? "%" : ` ${goal.unit}`}</span>
                  <span>Target: {goal.targetValue}{goal.unit === "percent" ? "%" : ` ${goal.unit}`}</span>
                </div>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>

      {/* Emissions Compliance */}
      <GlowCard className="p-5" glowColor="cyan">
        <h3 className="text-sm font-semibold text-cyan-400 mb-4">Emissions Reporting & Compliance</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className={`p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-zinc-800/50"}`}>
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} uppercase`}>Scope 1 (Direct)</p>
            <p className="text-lg font-bold text-cyan-400">{(em?.scope1?.tons ?? 0).toLocaleString()} t</p>
          </div>
          <div className={`p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-zinc-800/50"}`}>
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} uppercase`}>Scope 2 (Energy)</p>
            <p className="text-lg font-bold text-cyan-400">{(em?.scope2?.tons ?? 0).toLocaleString()} t</p>
          </div>
          <div className={`p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-zinc-800/50"}`}>
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} uppercase`}>Scope 3 (Indirect)</p>
            <p className="text-lg font-bold text-cyan-400">{(em?.scope3?.tons ?? 0).toLocaleString()} t</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className={isLight ? "text-slate-500" : "text-zinc-500"}>EPA:</span>
            <StatusBadge status={em?.epaCompliance?.status ?? "unknown"} />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={isLight ? "text-slate-500" : "text-zinc-500"}>CARB:</span>
            <StatusBadge status={em?.carbCompliance?.status ?? "unknown"} />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={isLight ? "text-slate-500" : "text-zinc-500"}>GHG Protocol:</span>
            {em?.ghgProtocolCompliant ? <CheckCircle size={12} className="text-emerald-400" /> : <AlertTriangle size={12} className="text-amber-400" />}
          </div>
          <div className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} ml-auto`}>
            Next report due: {em?.nextReportDue ?? "N/A"}
          </div>
        </div>
      </GlowCard>
    </div>
  );
}

function CarbonPanel() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const carbon = (trpc as any).futureVision.getCarbonFootprint.useQuery();
  const offsets = (trpc as any).futureVision.getCarbonOffsetProgram.useQuery();
  const c = carbon.data as any;
  const o = offsets.data as any;

  if (carbon.isLoading) return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Emissions" value={`${(c?.totalEmissionsTons ?? 0).toLocaleString()} t`} sub={`Target: ${(c?.targetTons ?? 0).toLocaleString()} t`} icon={Flame} color="amber" />
        <MetricCard label="Reduction" value={`${c?.reductionFromBaseline ?? 0}%`} sub="vs baseline" icon={TrendingDown} color="emerald" trend="up" />
        <MetricCard label="Per Load Avg" value={`${c?.perLoadAvg ?? 0} t`} icon={Box} color="teal" />
        <MetricCard label="Net Emissions" value={`${(o?.netEmissions ?? 0).toLocaleString()} t`} sub={`Carbon neutral: ${o?.carbonNeutralTarget ?? "N/A"}`} icon={Leaf} color="cyan" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Emissions by Source */}
        <GlowCard className="p-5" glowColor="amber">
          <h3 className="text-sm font-semibold text-amber-400 mb-4">Emissions by Source</h3>
          <div className="space-y-3">
            {(c?.bySource || []).map((s: any) => (
              <div key={s.source}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={isLight ? "text-slate-600" : "text-zinc-300"}>{s.source}</span>
                  <span className="text-amber-400 font-mono">{s.tons.toLocaleString()} t ({s.percent}%)</span>
                </div>
                <ProgressBar value={s.percent} color="amber" />
              </div>
            ))}
          </div>
        </GlowCard>

        {/* Monthly Trend */}
        <GlowCard className="p-5" glowColor="emerald">
          <h3 className="text-sm font-semibold text-emerald-400 mb-4">Monthly Emissions Trend</h3>
          <div className="space-y-2">
            {(c?.monthlyTrend || []).map((m: any) => (
              <div key={m.month} className="flex items-center gap-3">
                <span className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} w-16 font-mono`}>{m.month}</span>
                <div className="flex-1"><ProgressBar value={m.tons} max={600} color="emerald" /></div>
                <span className="text-xs text-emerald-400 font-mono w-14 text-right">{m.tons} t</span>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>

      {/* Carbon Offset Projects */}
      <GlowCard className="p-5" glowColor="teal">
        <h3 className="text-sm font-semibold text-teal-400 mb-4 flex items-center gap-2">
          <Leaf size={16} /> Carbon Offset Projects
          <span className={`${isLight ? "text-slate-500" : "text-zinc-500"} font-normal ml-auto`}>{o?.totalOffsetsPurchased ?? 0} tons offset / ${((o?.totalInvested ?? 0) / 1000).toFixed(0)}K invested</span>
        </h3>
        <div className="space-y-2">
          {(o?.projects || []).map((p: any) => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30 text-xs">
              <div className="flex items-center gap-3">
                <Leaf size={14} className="text-teal-400" />
                <div>
                  <span className="text-zinc-200">{p.name}</span>
                  <span className={`${isLight ? "text-slate-500" : "text-zinc-500"} ml-2`}>{p.type}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-teal-400 font-mono">{p.offsetTons} t</span>
                <span className={isLight ? "text-slate-500" : "text-zinc-500"}>${p.costPerTon}/t</span>
                <StatusBadge status={p.status} />
              </div>
            </div>
          ))}
        </div>
        {o?.progressToTarget !== undefined && (
          <div className="mt-4 pt-3 border-t border-zinc-800">
            <div className="flex justify-between text-xs mb-1">
              <span className={isLight ? "text-slate-500" : "text-zinc-500"}>Progress to Carbon Neutral</span>
              <span className="text-teal-400 font-mono">{o.progressToTarget}%</span>
            </div>
            <ProgressBar value={o.progressToTarget} color="teal" />
          </div>
        )}
      </GlowCard>
    </div>
  );
}

function DigitalTwinPanel() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const twin = (trpc as any).futureVision.getDigitalTwin.useQuery();
  const quantum = (trpc as any).futureVision.getQuantumOptimization.useQuery();
  const infra = (trpc as any).futureVision.getSmartInfrastructure.useQuery();
  const t = twin.data as any;
  const q = quantum.data as any;
  const inf = infra.data as any;

  if (twin.isLoading) return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Twin Accuracy" value={`${t?.accuracy ?? 0}%`} icon={Eye} color="cyan" trend="up" />
        <MetricCard label="Modeled Assets" value={t?.modeledAssets ? Object.values(t.modeledAssets).reduce((a: number, b: unknown) => a + (b as number), 0) : 0} icon={Layers} color="teal" />
        <MetricCard label="IoT Sensors" value={inf?.iotSensors?.totalDeployed ?? 0} icon={Signal} color="emerald" />
        <MetricCard label="Quantum Speedup" value={`${q?.benchmarks?.avgSpeedup ?? 0}x`} sub={q?.status} icon={Atom} color="violet" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Digital Twin */}
        <GlowCard className="p-5" glowColor="cyan">
          <h3 className="text-sm font-semibold text-cyan-400 mb-4 flex items-center gap-2">
            <Eye size={16} /> Digital Twin Status
            <span className="text-emerald-400 text-xs ml-auto">Synced {t?.syncFrequency ?? "N/A"}</span>
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {t?.modeledAssets && Object.entries(t.modeledAssets).map(([key, val]) => (
              <div key={key} className={`p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-zinc-800/50"} text-center`}>
                <p className="text-lg font-bold text-cyan-400">{String(val)}</p>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} uppercase`}>{key}</p>
              </div>
            ))}
          </div>
          <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} uppercase mb-2`}>Simulations</p>
          <div className="space-y-2">
            {(t?.simulations || []).map((sim: any) => (
              <div key={sim.id} className="flex items-center justify-between p-2 rounded bg-zinc-800/30 text-xs">
                <div className="flex items-center gap-2">
                  <StatusBadge status={sim.status} />
                  <span className={isLight ? "text-slate-600" : "text-zinc-300"}>{sim.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {sim.result && sim.result.costImpact !== undefined && (
                    <span className={`font-mono ${sim.result.costImpact < 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {sim.result.costImpact < 0 ? "-" : "+"}${Math.abs(sim.result.costImpact / 1000).toFixed(0)}K
                    </span>
                  )}
                  <span className={isLight ? "text-slate-500" : "text-zinc-500"}>{sim.runDate}</span>
                </div>
              </div>
            ))}
          </div>
        </GlowCard>

        {/* Smart Infrastructure */}
        <GlowCard className="p-5" glowColor="emerald">
          <h3 className="text-sm font-semibold text-emerald-400 mb-4 flex items-center gap-2">
            <Radio size={16} /> Smart Infrastructure
          </h3>
          <div className="space-y-4">
            <div className={`p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-zinc-800/50"}`}>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} uppercase mb-2`}>V2X Connections</p>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-400 font-bold">{inf?.v2xConnections?.active ?? 0} active</span>
                <span className={isLight ? "text-slate-500" : "text-zinc-500"}>/ {inf?.v2xConnections?.totalInfraPoints ?? 0} points ({inf?.v2xConnections?.coverage ?? 0}%)</span>
              </div>
            </div>
            <div>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} uppercase mb-2`}>IoT Sensor Categories</p>
              {(inf?.iotSensors?.categories || []).map((cat: any) => (
                <div key={cat.type} className="flex justify-between text-xs py-1.5 border-b border-zinc-800/50">
                  <span className={isLight ? "text-slate-600" : "text-zinc-300"}>{cat.type}</span>
                  <div className="flex items-center gap-3">
                    <span className={isLight ? "text-slate-500" : "text-zinc-500"}>{cat.count} sensors</span>
                    {cat.alerts24h > 0 && <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400">{cat.alerts24h} alerts</Badge>}
                  </div>
                </div>
              ))}
            </div>
            <div>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} uppercase mb-2`}>Smart Traffic Signals</p>
              {(inf?.smartTrafficSignals || []).map((s: any) => (
                <div key={s.id} className="flex justify-between text-xs py-1.5 border-b border-zinc-800/50">
                  <span className={isLight ? "text-slate-600" : "text-zinc-300"}>{s.location}</span>
                  <div className="flex items-center gap-2">
                    {s.avgTimeSaved && <span className="text-emerald-400">-{s.avgTimeSaved}</span>}
                    <StatusBadge status={s.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Quantum Optimization */}
      <GlowCard className="p-5" glowColor="violet">
        <h3 className="text-sm font-semibold text-violet-400 mb-4 flex items-center gap-2">
          <Atom size={16} /> Quantum-Inspired Optimization
          <StatusBadge status={q?.status ?? "unknown"} />
          <span className={`${isLight ? "text-slate-500" : "text-zinc-500"} text-xs font-normal ml-auto`}>{q?.provider ?? ""}</span>
        </h3>
        <div className="space-y-2">
          {(q?.problems || []).map((prob: any) => (
            <div key={prob.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30 text-xs">
              <div>
                <span className="text-zinc-200">{prob.name}</span>
                <span className="text-zinc-600 ml-2">{prob.variables.toLocaleString()} vars</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className={isLight ? "text-slate-500" : "text-zinc-500"}>Classical: {prob.classicalTime}</span>
                  <span className="text-violet-400 ml-3">Quantum: {prob.quantumTime}</span>
                </div>
                {prob.improvement && <span className="text-emerald-400 font-mono">+{prob.improvement}%</span>}
                <StatusBadge status={prob.status} />
              </div>
            </div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
}

function RoadmapPanel() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const roadmap = (trpc as any).futureVision.getInnovationRoadmap.useQuery();
  const regulations = (trpc as any).futureVision.getFutureRegulations.useQuery();
  const r = roadmap.data as any;
  const reg = regulations.data as any;

  if (roadmap.isLoading) return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div>;

  const statusColors: Record<string, string> = {
    completed: "border-emerald-500 bg-emerald-500/10",
    in_progress: "border-cyan-500 bg-cyan-500/10",
    planned: `border-zinc-600 ${isLight ? "bg-slate-100" : "bg-zinc-800/50"}`,
  };

  return (
    <div className="space-y-6">
      {/* Timeline */}
      <GlowCard className="p-5" glowColor="cyan">
        <h3 className="text-sm font-semibold text-cyan-400 mb-6 flex items-center gap-2">
          <Workflow size={16} /> Innovation Roadmap
        </h3>
        <div className="space-y-8">
          {(r?.phases || []).map((phase: any) => (
            <div key={phase.id} className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${statusColors[phase.status] || statusColors.planned}`}>
                  {phase.status === "completed" ? <CheckCircle size={14} className="text-emerald-400" /> : phase.status === "in_progress" ? <Activity size={14} className="text-cyan-400" /> : <Clock size={14} className={isLight ? "text-slate-500" : "text-zinc-500"} />}
                </div>
                <div>
                  <span className="text-sm font-semibold text-zinc-200">{phase.name}</span>
                  <span className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} ml-2`}>{phase.period}</span>
                </div>
                <StatusBadge status={phase.status} />
              </div>
              <div className="ml-4 pl-7 border-l-2 border-zinc-800 space-y-2">
                {phase.milestones.map((m: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    {m.status === "completed" ? (
                      <CheckCircle size={12} className="text-emerald-400 flex-shrink-0" />
                    ) : m.status === "in_progress" ? (
                      <Activity size={12} className="text-cyan-400 flex-shrink-0" />
                    ) : (
                      <CircleDot size={12} className="text-zinc-600 flex-shrink-0" />
                    )}
                    <span className={m.status === "completed" ? (isLight ? "text-slate-500" : "text-zinc-400") : m.status === "in_progress" ? "text-cyan-300" : (isLight ? "text-slate-500" : "text-zinc-500")}>{m.name}</span>
                    <span className="text-zinc-600 ml-auto">{m.date}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </GlowCard>

      {/* Regulatory Horizon */}
      <GlowCard className="p-5" glowColor="amber">
        <h3 className="text-sm font-semibold text-amber-400 mb-4 flex items-center gap-2">
          <FileCheck size={16} /> Regulatory Horizon
        </h3>
        <div className="space-y-2">
          {(reg?.upcoming || []).map((r: any) => (
            <div key={r.id} className="p-3 rounded-lg bg-zinc-800/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-200 text-sm">{r.name}</span>
                  <Badge variant="outline" className={`text-xs border-zinc-600 ${isLight ? "text-slate-500" : "text-zinc-400"}`}>{r.agency}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={r.complianceStatus} />
                  <span className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"}`}>{r.effectiveDate}</span>
                </div>
              </div>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} mt-1`}>{r.summary}</p>
              <div className="mt-2 flex items-center gap-4">
                <div className="flex-1"><ProgressBar value={r.readinessPercent} color={r.readinessPercent >= 70 ? "emerald" : r.readinessPercent >= 40 ? "amber" : "rose"} /></div>
                <span className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-400"} font-mono w-10`}>{r.readinessPercent}%</span>
                {r.estimatedCost > 0 && <span className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"}`}>${(r.estimatedCost / 1000).toFixed(0)}K</span>}
              </div>
            </div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
}

function DronePanel() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const drones = (trpc as any).futureVision.getDroneDeliveryStatus.useQuery();
  const flight = (trpc as any).futureVision.getDroneFlightPlan.useQuery();
  const d = drones.data as any;
  const fl = flight.data as any;

  if (drones.isLoading) return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Drones" value={d?.totalDrones ?? 0} sub={`${d?.active ?? 0} active`} icon={Satellite} color="cyan" />
        <MetricCard label="Deliveries" value={(d?.metrics?.totalDeliveries ?? 0).toLocaleString()} icon={Box} color="teal" />
        <MetricCard label="Success Rate" value={`${d?.metrics?.successRate ?? 0}%`} icon={Target} color="emerald" />
        <MetricCard label="Cost/Delivery" value={`$${d?.metrics?.costPerDelivery ?? 0}`} sub={`vs $${d?.metrics?.traditionalCostPerDelivery ?? 0} traditional`} icon={TrendingDown} color="violet" />
      </div>

      {/* Drone Fleet */}
      <GlowCard className="p-5" glowColor="cyan">
        <h3 className="text-sm font-semibold text-cyan-400 mb-4 flex items-center gap-2">
          <Satellite size={16} /> Drone Fleet Status
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {(d?.drones || []).map((drone: any) => (
            <div key={drone.id} className={`p-3 rounded-lg ${isLight ? "bg-slate-100" : "bg-zinc-800/50"} border ${isLight ? "border-slate-200" : "border-zinc-700/50"}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-mono font-bold">{drone.id}</span>
                    <span className={`${isLight ? "text-slate-500" : "text-zinc-500"} text-xs`}>{drone.model}</span>
                    <StatusBadge status={drone.status} />
                  </div>
                  {drone.currentMission && <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-400"} mt-1`}>{drone.currentMission}</p>}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className={isLight ? "text-slate-500" : "text-zinc-500"}>Battery</span>
                  <div className="mt-0.5"><ProgressBar value={drone.batteryLevel} color={drone.batteryLevel > 50 ? "emerald" : drone.batteryLevel > 20 ? "amber" : "rose"} /></div>
                  <span className={isLight ? "text-slate-500" : "text-zinc-400"}>{drone.batteryLevel}%</span>
                </div>
                <div>
                  <span className={isLight ? "text-slate-500" : "text-zinc-500"}>Speed</span>
                  <p className="text-cyan-400 text-xs font-mono mt-1">{drone.speed} mph</p>
                </div>
                <div>
                  <span className={isLight ? "text-slate-500" : "text-zinc-500"}>Altitude</span>
                  <p className="text-cyan-400 text-xs font-mono mt-1">{drone.location.altitude} ft</p>
                </div>
              </div>
              {drone.eta && <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"} mt-1`}>ETA: {drone.eta}</p>}
            </div>
          ))}
        </div>
      </GlowCard>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Flight Plan */}
        <GlowCard className="p-5" glowColor="teal">
          <h3 className="text-sm font-semibold text-teal-400 mb-4">Active Flight Plan</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs">
              <MapPin size={12} className="text-emerald-400" />
              <span className={isLight ? "text-slate-600" : "text-zinc-300"}>{fl?.flightPlan?.origin?.name ?? "N/A"}</span>
              <ChevronRight size={12} className="text-zinc-600" />
              <MapPin size={12} className="text-rose-400" />
              <span className={isLight ? "text-slate-600" : "text-zinc-300"}>{fl?.flightPlan?.destination?.name ?? "N/A"}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className={`p-2 rounded ${isLight ? "bg-slate-100" : "bg-zinc-800/50"}`}>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"}`}>Distance</p>
                <p className="text-sm text-teal-400 font-mono">{fl?.flightPlan?.distance ?? 0} mi</p>
              </div>
              <div className={`p-2 rounded ${isLight ? "bg-slate-100" : "bg-zinc-800/50"}`}>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"}`}>Est. Time</p>
                <p className="text-sm text-teal-400 font-mono">{fl?.flightPlan?.estimatedTime ?? "N/A"}</p>
              </div>
              <div className={`p-2 rounded ${isLight ? "bg-slate-100" : "bg-zinc-800/50"}`}>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"}`}>Max Alt</p>
                <p className="text-sm text-teal-400 font-mono">{fl?.flightPlan?.maxAltitude ?? 0} ft</p>
              </div>
            </div>
            <div className="text-xs">
              <span className={isLight ? "text-slate-500" : "text-zinc-500"}>Airspace: </span>
              <span className={isLight ? "text-slate-600" : "text-zinc-300"}>{fl?.airspaceStatus?.classification ?? "N/A"}</span>
              <span className={`${isLight ? "text-slate-500" : "text-zinc-500"} ml-3`}>Wind: </span>
              <span className={isLight ? "text-slate-600" : "text-zinc-300"}>{fl?.airspaceStatus?.windSpeed ?? 0} mph {fl?.airspaceStatus?.windDirection ?? ""}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"}`}>Approval:</span>
              <StatusBadge status={fl?.approvalStatus ?? "unknown"} />
            </div>
          </div>
        </GlowCard>

        {/* Regulatory Status */}
        <GlowCard className="p-5" glowColor="violet">
          <h3 className="text-sm font-semibold text-violet-400 mb-4">Drone Regulatory Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-xs p-2 rounded bg-zinc-800/30">
              <span className={isLight ? "text-slate-500" : "text-zinc-400"}>FAA Authorization</span>
              <span className="text-violet-400">{d?.regulatoryStatus?.faaPartNumber ?? "N/A"}</span>
            </div>
            <div className="flex justify-between text-xs p-2 rounded bg-zinc-800/30">
              <span className={isLight ? "text-slate-500" : "text-zinc-400"}>Approved Zones</span>
              <span className="text-emerald-400">{d?.regulatoryStatus?.approvedZones ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs p-2 rounded bg-zinc-800/30">
              <span className={isLight ? "text-slate-500" : "text-zinc-400"}>Pending Approvals</span>
              <span className="text-amber-400">{d?.regulatoryStatus?.pendingApprovals ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs p-2 rounded bg-zinc-800/30">
              <span className={isLight ? "text-slate-500" : "text-zinc-400"}>Max Altitude</span>
              <span className={isLight ? "text-slate-600" : "text-zinc-300"}>{d?.regulatoryStatus?.maxAltitude ?? 0} ft</span>
            </div>
            <div className="flex justify-between text-xs p-2 rounded bg-zinc-800/30">
              <span className={isLight ? "text-slate-500" : "text-zinc-400"}>Night Flight</span>
              {d?.regulatoryStatus?.nightFlightApproved ? (
                <CheckCircle size={14} className="text-emerald-400" />
              ) : (
                <AlertTriangle size={14} className="text-amber-400" />
              )}
            </div>
          </div>
        </GlowCard>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════

export default function FutureVisionPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: Gauge },
    { key: "autonomous", label: "Autonomous", icon: Truck },
    { key: "ev-fleet", label: "EV/H2 Fleet", icon: Zap },
    { key: "blockchain", label: "Blockchain", icon: GitBranch },
    { key: "ai-predictions", label: "AI/ML", icon: Cpu },
    { key: "esg", label: "ESG", icon: Leaf },
    { key: "carbon", label: "Carbon", icon: Flame },
    { key: "digital-twin", label: "Digital Twin", icon: Eye },
    { key: "roadmap", label: "Roadmap", icon: Workflow },
    { key: "drone", label: "Drones", icon: Satellite },
  ];

  return (
    <div className={`min-h-screen p-4 md:p-6 ${isLight ? "bg-slate-50 text-slate-900" : "bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950"}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/20">
            <Atom size={24} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Future Vision & Innovation Hub
            </h1>
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-500"}`}>Next-generation logistics technology command center</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="space-y-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className={`${isLight ? "bg-white border border-slate-200" : "bg-zinc-900/80 border border-zinc-800"} p-1 inline-flex w-auto min-w-full md:min-w-0`}>
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className={`data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-teal-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/30 data-[state=active]:border ${isLight ? "text-slate-500" : "text-zinc-500"} text-xs gap-1.5 px-3`}
              >
                <tab.icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview"><OverviewPanel /></TabsContent>
        <TabsContent value="autonomous"><AutonomousPanel /></TabsContent>
        <TabsContent value="ev-fleet"><EvFleetPanel /></TabsContent>
        <TabsContent value="blockchain"><BlockchainPanel /></TabsContent>
        <TabsContent value="ai-predictions"><AiPredictionsPanel /></TabsContent>
        <TabsContent value="esg"><EsgPanel /></TabsContent>
        <TabsContent value="carbon"><CarbonPanel /></TabsContent>
        <TabsContent value="digital-twin"><DigitalTwinPanel /></TabsContent>
        <TabsContent value="roadmap"><RoadmapPanel /></TabsContent>
        <TabsContent value="drone"><DronePanel /></TabsContent>
      </Tabs>
    </div>
  );
}
