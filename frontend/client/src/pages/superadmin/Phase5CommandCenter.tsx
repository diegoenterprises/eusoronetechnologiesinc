import { useState, lazy, Suspense } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FlaskConical, Shield, Globe, Ship, Languages, Bot, Building2, Link2,
  Atom, Fingerprint, Leaf, Plane, Wrench, Route, GitBranch, BarChart3,
} from "lucide-react";

const InnovationLab = lazy(() => import("./InnovationLab"));
const BlockchainAudit = lazy(() => import("./BlockchainAuditPage"));
const ADRCompliance = lazy(() => import("./ADRCompliancePage"));
const IMDGCode = lazy(() => import("./IMDGCodePage"));
const AutonomousFleet = lazy(() => import("./AutonomousFleetPage"));
const TenantManager = lazy(() => import("./TenantManagerPage"));
const BrandingManager = lazy(() => import("./BrandingManagerPage"));

type TabId = "lab" | "blockchain" | "adr" | "imdg" | "av" | "tenants" | "branding" | "future";

const TABS: { id: TabId; label: string; icon: any; color: string }[] = [
  { id: "lab", label: "Innovation Lab", icon: FlaskConical, color: "text-purple-400" },
  { id: "blockchain", label: "Blockchain Audit", icon: Link2, color: "text-cyan-400" },
  { id: "adr", label: "EU ADR", icon: Globe, color: "text-emerald-400" },
  { id: "imdg", label: "IMDG Code", icon: Ship, color: "text-blue-400" },
  { id: "av", label: "AV Fleet", icon: Bot, color: "text-amber-400" },
  { id: "tenants", label: "PaaS Tenants", icon: Building2, color: "text-pink-400" },
  { id: "branding", label: "White-Label", icon: Fingerprint, color: "text-orange-400" },
  { id: "future", label: "Future Vision", icon: Atom, color: "text-slate-400" },
];

const FUTURE_GAPS = [
  { id: "GAP-443", name: "Quantum-Ready Encryption", icon: Shield, status: "design", priority: "low" },
  { id: "GAP-442", name: "Digital Twin Fleet Simulation", icon: GitBranch, status: "design", priority: "medium" },
  { id: "GAP-441", name: "Carbon Credit Marketplace", icon: Leaf, status: "research", priority: "medium" },
  { id: "GAP-440", name: "Drone Last-Mile Hazmat Delivery", icon: Plane, status: "research", priority: "low" },
  { id: "GAP-439", name: "Predictive Maintenance AI", icon: Wrench, status: "research", priority: "medium" },
  { id: "GAP-438", name: "Genetic Algorithm Route Optimization", icon: Route, status: "research", priority: "high" },
  { id: "GAP-437", name: "Supply Chain Visibility Blockchain", icon: Link2, status: "design", priority: "medium" },
  { id: "GAP-436", name: "Advanced Predictive Analytics", icon: BarChart3, status: "design", priority: "high" },
];

function FutureVisionPanel() {
  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Future Vision (Months 31-36)</h2>
        <p className="text-xs text-slate-400 mt-0.5">GAP-436 through GAP-443 — Research & design phase</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {FUTURE_GAPS.map(g => {
          const Icon = g.icon;
          const statusColor = g.status === "research" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-blue-400 bg-blue-500/10 border-blue-500/20";
          const prioColor = g.priority === "high" ? "text-red-400" : g.priority === "medium" ? "text-amber-400" : "text-slate-500";
          return (
            <div key={g.id} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white/[0.04]">
                  <Icon className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{g.name}</span>
                    <span className={cn("text-xs font-bold uppercase px-1.5 py-0.5 rounded-full border", statusColor)}>{g.status}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{g.id}</span>
                    <span className={cn("text-xs font-semibold capitalize", prioColor)}>{g.priority} priority</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const Loading = () => (
  <div className="p-6 space-y-4">
    <Skeleton className="h-8 w-48 bg-white/[0.04]" />
    <Skeleton className="h-40 w-full bg-white/[0.04]" />
    <Skeleton className="h-60 w-full bg-white/[0.04]" />
  </div>
);

export default function Phase5CommandCenter() {
  const [tab, setTab] = useState<TabId>("lab");

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-1 overflow-x-auto border-b border-white/[0.06] bg-slate-900/50">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-semibold transition-all whitespace-nowrap",
                active ? "bg-white/[0.06] text-white border-b-2 border-purple-500" : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]")}>
              <Icon className={cn("w-3.5 h-3.5", active ? t.color : "text-slate-600")} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Suspense fallback={<Loading />}>
          {tab === "lab" && <InnovationLab />}
          {tab === "blockchain" && <BlockchainAudit />}
          {tab === "adr" && <ADRCompliance />}
          {tab === "imdg" && <IMDGCode />}
          {tab === "av" && <AutonomousFleet />}
          {tab === "tenants" && <TenantManager />}
          {tab === "branding" && <BrandingManager />}
          {tab === "future" && <FutureVisionPanel />}
        </Suspense>
      </div>
    </div>
  );
}
