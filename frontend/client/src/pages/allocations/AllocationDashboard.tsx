import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Droplets, ChevronLeft, ChevronRight, Plus, RefreshCw,
  TrendingUp, AlertTriangle, CheckCircle, Clock, Truck,
  BarChart3, X, Package, Download, Eye, Gauge, MapPin,
  Calendar, DollarSign, ArrowRight, Layers, Zap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Status config                                                      */
/* ------------------------------------------------------------------ */
const STATUS_CFG: Record<string, { bg: string; bgL: string; text: string; textL: string; label: string; icon: any }> = {
  pending:   { bg: "bg-slate-500/20",   bgL: "bg-slate-100",    text: "text-slate-400",   textL: "text-slate-600",   label: "Pending",   icon: Clock },
  on_track:  { bg: "bg-green-500/20",   bgL: "bg-green-50",     text: "text-green-400",   textL: "text-green-700",   label: "On Track",  icon: CheckCircle },
  behind:    { bg: "bg-red-500/20",     bgL: "bg-red-50",       text: "text-red-400",     textL: "text-red-700",     label: "Behind",    icon: AlertTriangle },
  ahead:     { bg: "bg-blue-500/20",    bgL: "bg-blue-50",      text: "text-blue-400",    textL: "text-blue-700",    label: "Ahead",     icon: TrendingUp },
  completed: { bg: "bg-emerald-500/20", bgL: "bg-emerald-50",   text: "text-emerald-400", textL: "text-emerald-700", label: "Completed", icon: CheckCircle },
};

const PRODUCT_COLORS: Record<string, { bg: string; bgL: string; text: string; textL: string }> = {
  "Crude Oil":  { bg: "bg-amber-500/15",  bgL: "bg-amber-100",  text: "text-amber-400",  textL: "text-amber-700" },
  "Water":      { bg: "bg-sky-500/15",    bgL: "bg-sky-100",    text: "text-sky-400",    textL: "text-sky-700" },
  "Diesel":     { bg: "bg-orange-500/15", bgL: "bg-orange-100", text: "text-orange-400", textL: "text-orange-700" },
  "Natural Gas":{ bg: "bg-violet-500/15", bgL: "bg-violet-100", text: "text-violet-400", textL: "text-violet-700" },
};
const DEFAULT_PRODUCT = { bg: "bg-cyan-500/15", bgL: "bg-cyan-100", text: "text-cyan-400", textL: "text-cyan-700" };

type Filter = "all" | "active" | "behind" | "completed";

/* ------------------------------------------------------------------ */
/*  Sparkline (7 data points)                                          */
/* ------------------------------------------------------------------ */
function Sparkline({ data, L }: { data: number[]; L: boolean }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 60},${30 - (v / max) * 26}`).join(" ");
  return (
    <svg width="60" height="30" viewBox="0 0 60 30" className="shrink-0">
      <polyline
        points={pts}
        fill="none"
        stroke={L ? "#3b82f6" : "#60a5fa"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function AllocationDashboard() {
  const { theme } = useTheme();
  const L = theme === "light";

  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [createLoadsContract, setCreateLoadsContract] = useState<number | null>(null);
  const [loadCount, setLoadCount] = useState(1);
  const [viewLoadsContract, setViewLoadsContract] = useState<number | null>(null);

  // Form state + validation
  const [form, setForm] = useState({
    shipperId: 0, contractName: "", buyerName: "", originTerminalId: 0,
    destinationTerminalId: 0, product: "", dailyNominationBbl: 0,
    effectiveDate: "", expirationDate: "", ratePerBbl: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  /* ---- tRPC wiring (unchanged) ---- */
  const dashboardQuery = (trpc as any).allocationTracker.getDailyDashboard.useQuery(
    { date },
    { refetchInterval: 30000 }
  );
  const dashboard = dashboardQuery.data as any;

  const createMut = (trpc as any).allocationTracker.createContract.useMutation({
    onSuccess: () => {
      toast.success("Contract created successfully");
      setShowCreate(false);
      resetForm();
      dashboardQuery.refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const createLoadsMut = (trpc as any).allocationTracker.createLoadsFromAllocation.useMutation({
    onSuccess: (data: any) => {
      toast.success(`${data.createdLoadIds.length} loads created successfully`);
      setCreateLoadsContract(null);
      dashboardQuery.refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  /* ---- helpers ---- */
  const shiftDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split("T")[0]);
  };

  const resetForm = () => {
    setForm({ shipperId: 0, contractName: "", buyerName: "", originTerminalId: 0, destinationTerminalId: 0, product: "", dailyNominationBbl: 0, effectiveDate: "", expirationDate: "", ratePerBbl: 0 });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.contractName.trim()) errs.contractName = "Required";
    if (!form.buyerName.trim()) errs.buyerName = "Required";
    if (!form.product.trim()) errs.product = "Required";
    if (form.dailyNominationBbl <= 0) errs.dailyNominationBbl = "Must be > 0";
    if (form.ratePerBbl <= 0) errs.ratePerBbl = "Must be > 0";
    if (!form.effectiveDate) errs.effectiveDate = "Required";
    if (!form.expirationDate) errs.expirationDate = "Required";
    if (form.effectiveDate && form.expirationDate && form.expirationDate < form.effectiveDate) errs.expirationDate = "Must be after effective date";
    if (form.shipperId <= 0) errs.shipperId = "Required";
    if (form.originTerminalId <= 0) errs.originTerminalId = "Required";
    if (form.destinationTerminalId <= 0) errs.destinationTerminalId = "Required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = () => {
    if (!validateForm()) return;
    createMut.mutate(form);
  };

  const handleExport = () => {
    toast.success("Report exported");
  };

  const summary = dashboard?.summaryBar || { totalNominated: 0, totalLoaded: 0, totalDelivered: 0, fulfillmentPercent: 0 };
  const allContracts: any[] = dashboard?.contracts || [];

  const contracts = useMemo(() => {
    switch (filter) {
      case "active": return allContracts.filter((c: any) => c.status === "on_track" || c.status === "ahead" || c.status === "pending");
      case "behind": return allContracts.filter((c: any) => c.status === "behind");
      case "completed": return allContracts.filter((c: any) => c.status === "completed");
      default: return allContracts;
    }
  }, [allContracts, filter]);

  const fulfillColor = summary.fulfillmentPercent >= 95 ? (L ? "text-green-700" : "text-green-400")
    : summary.fulfillmentPercent >= 80 ? (L ? "text-amber-700" : "text-amber-400")
    : (L ? "text-red-700" : "text-red-400");

  const fulfillBg = summary.fulfillmentPercent >= 95 ? (L ? "from-green-50 to-green-100 border-green-200" : "from-green-500/10 to-green-500/5 border-green-500/20")
    : summary.fulfillmentPercent >= 80 ? (L ? "from-amber-50 to-amber-100 border-amber-200" : "from-amber-500/10 to-amber-500/5 border-amber-500/20")
    : (L ? "from-red-50 to-red-100 border-red-200" : "from-red-500/10 to-red-500/5 border-red-500/20");

  /* ---- filter chip counts ---- */
  const chipCounts = {
    all: allContracts.length,
    active: allContracts.filter((c: any) => ["on_track", "ahead", "pending"].includes(c.status)).length,
    behind: allContracts.filter((c: any) => c.status === "behind").length,
    completed: allContracts.filter((c: any) => c.status === "completed").length,
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className={cn("flex flex-col h-[calc(100vh-64px)] overflow-hidden transition-colors duration-200",
      L ? "bg-slate-50 text-slate-900" : "bg-slate-950 text-white"
    )}>

      {/* ============================================================ */}
      {/*  HEADER                                                       */}
      {/* ============================================================ */}
      <div className={cn("shrink-0 px-4 sm:px-6 py-4 border-b",
        L ? "bg-white border-slate-200" : "bg-slate-900/60 border-white/[0.06]"
      )}>
        {/* Top row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-xl", L ? "bg-cyan-100" : "bg-cyan-500/15")}>
              <Droplets className={cn("w-6 h-6", L ? "text-cyan-700" : "text-cyan-400")} />
            </div>
            <div>
              <h1 className={cn("text-xl font-bold tracking-tight", L ? "text-slate-900" : "text-white")}>
                Allocation Tracker
              </h1>
              <p className={cn("text-sm", L ? "text-slate-500" : "text-slate-400")}>
                {allContracts.length} contract{allContracts.length !== 1 ? "s" : ""} &middot; {summary.fulfillmentPercent}% fulfilled today
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Date nav */}
            <div className={cn("flex items-center rounded-lg border", L ? "border-slate-200 bg-white" : "border-white/[0.08] bg-white/[0.03]")}>
              <Button variant="ghost" size="sm" className={cn("h-8 px-2 rounded-r-none", L ? "hover:bg-slate-100" : "hover:bg-white/[0.06]")} onClick={() => shiftDate(-1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className={cn("h-8 w-36 text-xs text-center border-x rounded-none focus-visible:ring-0",
                  L ? "bg-white border-slate-200 text-slate-900" : "bg-transparent border-white/[0.08] text-white"
                )}
              />
              <Button variant="ghost" size="sm" className={cn("h-8 px-2 rounded-l-none", L ? "hover:bg-slate-100" : "hover:bg-white/[0.06]")} onClick={() => shiftDate(1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              className={cn("h-8 px-3 text-xs gap-1.5",
                L ? "border-slate-200 text-slate-600 hover:bg-slate-100" : "border-white/[0.08] text-slate-300 hover:bg-white/[0.06]"
              )}
              onClick={() => dashboardQuery.refetch()}
            >
              <RefreshCw className={cn("w-3.5 h-3.5", dashboardQuery.isFetching && "animate-spin")} />
              Refresh
            </Button>

            <Button
              variant="outline"
              size="sm"
              className={cn("h-8 px-3 text-xs gap-1.5",
                L ? "border-slate-200 text-slate-600 hover:bg-slate-100" : "border-white/[0.08] text-slate-300 hover:bg-white/[0.06]"
              )}
              onClick={handleExport}
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>

            <Button
              size="sm"
              className="h-8 px-4 text-xs gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white"
              onClick={() => { setShowCreate(true); resetForm(); }}
            >
              <Plus className="w-3.5 h-3.5" />
              New Contract
            </Button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 mt-3">
          {([
            { key: "all" as Filter, label: "All" },
            { key: "active" as Filter, label: "Active" },
            { key: "behind" as Filter, label: "Behind Schedule" },
            { key: "completed" as Filter, label: "Completed" },
          ]).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                filter === f.key
                  ? "bg-cyan-600 text-white shadow-sm"
                  : L
                    ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    : "bg-white/[0.06] text-slate-400 hover:bg-white/[0.1]"
              )}
            >
              {f.label}
              <span className={cn("ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]",
                filter === f.key
                  ? "bg-white/20 text-white"
                  : L ? "bg-slate-200 text-slate-500" : "bg-white/[0.08] text-slate-500"
              )}>
                {chipCounts[f.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  SCROLLABLE CONTENT                                           */}
      {/* ============================================================ */}
      <div className="flex-1 overflow-y-auto">

        {/* ---------------------------------------------------------- */}
        {/*  KPI SUMMARY CARDS                                          */}
        {/* ---------------------------------------------------------- */}
        <div className="px-4 sm:px-6 py-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Nominated */}
            <div className={cn("rounded-xl border p-4 bg-gradient-to-br transition-all",
              L ? "from-blue-50 to-blue-100 border-blue-200" : "from-blue-500/10 to-blue-500/5 border-blue-500/20"
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn("text-xs font-medium uppercase tracking-wider", L ? "text-blue-600" : "text-blue-400")}>Nominated</span>
                <div className={cn("p-1.5 rounded-lg", L ? "bg-blue-200/60" : "bg-blue-500/20")}>
                  <Package className={cn("w-4 h-4", L ? "text-blue-700" : "text-blue-400")} />
                </div>
              </div>
              <div className={cn("text-2xl font-bold", L ? "text-blue-900" : "text-blue-300")}>
                {summary.totalNominated.toLocaleString()}
              </div>
              <div className={cn("text-xs mt-0.5", L ? "text-blue-600/70" : "text-blue-400/60")}>BBL</div>
            </div>

            {/* Loaded */}
            <div className={cn("rounded-xl border p-4 bg-gradient-to-br transition-all",
              L ? "from-amber-50 to-amber-100 border-amber-200" : "from-amber-500/10 to-amber-500/5 border-amber-500/20"
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn("text-xs font-medium uppercase tracking-wider", L ? "text-amber-600" : "text-amber-400")}>Loaded</span>
                <div className={cn("p-1.5 rounded-lg", L ? "bg-amber-200/60" : "bg-amber-500/20")}>
                  <Truck className={cn("w-4 h-4", L ? "text-amber-700" : "text-amber-400")} />
                </div>
              </div>
              <div className={cn("text-2xl font-bold", L ? "text-amber-900" : "text-amber-300")}>
                {summary.totalLoaded.toLocaleString()}
              </div>
              <div className={cn("text-xs mt-0.5", L ? "text-amber-600/70" : "text-amber-400/60")}>BBL</div>
            </div>

            {/* Delivered */}
            <div className={cn("rounded-xl border p-4 bg-gradient-to-br transition-all",
              L ? "from-green-50 to-green-100 border-green-200" : "from-green-500/10 to-green-500/5 border-green-500/20"
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn("text-xs font-medium uppercase tracking-wider", L ? "text-green-600" : "text-green-400")}>Delivered</span>
                <div className={cn("p-1.5 rounded-lg", L ? "bg-green-200/60" : "bg-green-500/20")}>
                  <CheckCircle className={cn("w-4 h-4", L ? "text-green-700" : "text-green-400")} />
                </div>
              </div>
              <div className={cn("text-2xl font-bold", L ? "text-green-900" : "text-green-300")}>
                {summary.totalDelivered.toLocaleString()}
              </div>
              <div className={cn("text-xs mt-0.5", L ? "text-green-600/70" : "text-green-400/60")}>BBL</div>
            </div>

            {/* Fulfillment % */}
            <div className={cn("rounded-xl border p-4 bg-gradient-to-br transition-all", fulfillBg)}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn("text-xs font-medium uppercase tracking-wider", fulfillColor)}>Fulfillment</span>
                <div className={cn("p-1.5 rounded-lg",
                  summary.fulfillmentPercent >= 95 ? (L ? "bg-green-200/60" : "bg-green-500/20")
                    : summary.fulfillmentPercent >= 80 ? (L ? "bg-amber-200/60" : "bg-amber-500/20")
                    : (L ? "bg-red-200/60" : "bg-red-500/20")
                )}>
                  <Gauge className={cn("w-4 h-4", fulfillColor)} />
                </div>
              </div>
              <div className={cn("text-2xl font-bold", fulfillColor)}>
                {summary.fulfillmentPercent}%
              </div>
              <div className={cn("text-xs mt-0.5", fulfillColor, "opacity-60")}>of target</div>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className={cn("mt-3 rounded-xl border p-4",
            L ? "bg-white border-slate-200" : "bg-white/[0.02] border-white/[0.06]"
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className={cn("text-xs font-medium", L ? "text-slate-600" : "text-slate-400")}>Daily Progress</span>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Loaded
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Delivered
                </span>
                <span className="flex items-center gap-1.5">
                  <span className={cn("w-2.5 h-2.5 rounded-full", L ? "bg-slate-200" : "bg-slate-700")} /> Remaining
                </span>
              </div>
            </div>
            <div className={cn("h-4 rounded-full overflow-hidden flex",
              L ? "bg-slate-100" : "bg-white/[0.04]"
            )}>
              {summary.totalNominated > 0 && (
                <>
                  <div
                    className="h-full bg-green-500 transition-all duration-500 rounded-l-full"
                    style={{ width: `${Math.min((summary.totalDelivered / summary.totalNominated) * 100, 100)}%` }}
                  />
                  <div
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${Math.min(((summary.totalLoaded - summary.totalDelivered) / summary.totalNominated) * 100, 100)}%` }}
                  />
                </>
              )}
            </div>
            <div className="flex justify-between mt-1.5 text-[11px]">
              <span className={L ? "text-slate-400" : "text-slate-500"}>0 BBL</span>
              <span className={L ? "text-slate-400" : "text-slate-500"}>{summary.totalNominated.toLocaleString()} BBL</span>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------- */}
        {/*  CONTRACT CARDS                                             */}
        {/* ---------------------------------------------------------- */}
        <div className="px-4 sm:px-6 pb-6">
          {dashboardQuery.isLoading ? (
            /* Loading skeletons */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className={cn("rounded-xl border p-5 space-y-4",
                  L ? "bg-white border-slate-200" : "bg-white/[0.02] border-white/[0.06]"
                )}>
                  <div className="flex justify-between">
                    <div className="space-y-2">
                      <Skeleton className={cn("h-4 w-32", L ? "bg-slate-200" : "bg-white/[0.06]")} />
                      <Skeleton className={cn("h-3 w-20", L ? "bg-slate-200" : "bg-white/[0.06]")} />
                    </div>
                    <Skeleton className={cn("h-6 w-20 rounded-full", L ? "bg-slate-200" : "bg-white/[0.06]")} />
                  </div>
                  <Skeleton className={cn("h-3 w-48", L ? "bg-slate-200" : "bg-white/[0.06]")} />
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map(j => <Skeleton key={j} className={cn("h-14 rounded-lg", L ? "bg-slate-200" : "bg-white/[0.06]")} />)}
                  </div>
                  <Skeleton className={cn("h-3 w-full", L ? "bg-slate-200" : "bg-white/[0.06]")} />
                  <Skeleton className={cn("h-8 w-full rounded-lg", L ? "bg-slate-200" : "bg-white/[0.06]")} />
                </div>
              ))}
            </div>
          ) : contracts.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-24">
              <div className={cn("p-6 rounded-full mb-6", L ? "bg-slate-100" : "bg-white/[0.03]")}>
                <Droplets className={cn("w-16 h-16", L ? "text-slate-300" : "text-slate-700")} />
              </div>
              <h3 className={cn("text-lg font-semibold mb-2", L ? "text-slate-700" : "text-slate-300")}>
                No allocation contracts {filter !== "all" ? "match this filter" : "yet"}
              </h3>
              <p className={cn("text-sm mb-6 text-center max-w-sm", L ? "text-slate-500" : "text-slate-500")}>
                {filter !== "all"
                  ? "Try changing the filter or date to see more contracts."
                  : "Create your first contract to start tracking daily barrel nominations, loads, and deliveries."}
              </p>
              {filter === "all" && (
                <Button
                  size="sm"
                  className="h-10 px-6 text-sm gap-2 bg-cyan-600 hover:bg-cyan-700 text-white"
                  onClick={() => { setShowCreate(true); resetForm(); }}
                >
                  <Plus className="w-4 h-4" />
                  Create Contract
                </Button>
              )}
            </div>
          ) : (
            /* Contract grid */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {contracts.map((c: any) => {
                const sc = STATUS_CFG[c.status] || STATUS_CFG.pending;
                const StatusIcon = sc.icon;
                const pct = c.nominatedBbl > 0 ? Math.round((c.deliveredBbl / c.nominatedBbl) * 100) : 0;
                const loadedPct = c.nominatedBbl > 0 ? Math.round((c.loadedBbl / c.nominatedBbl) * 100) : 0;
                const remainingPct = Math.max(0, 100 - loadedPct);
                const loadedOnlyPct = Math.max(0, loadedPct - pct);
                const pc = PRODUCT_COLORS[c.product] || DEFAULT_PRODUCT;

                // Mock sparkline data (7 days)
                const sparkData = Array.from({ length: 7 }, (_, i) => {
                  const base = c.deliveredBbl || 0;
                  return Math.max(0, base * (0.6 + Math.random() * 0.8) * ((i + 3) / 9));
                });

                return (
                  <Card
                    key={c.contractId}
                    className={cn(
                      "rounded-xl border p-5 space-y-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
                      L ? "bg-white border-slate-200 hover:border-slate-300 hover:shadow-slate-200/50"
                        : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] hover:shadow-black/20"
                    )}
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className={cn("text-sm font-semibold truncate", L ? "text-slate-900" : "text-white")}>
                          {c.contractName}
                        </h3>
                        {c.buyerName && (
                          <p className={cn("text-xs mt-0.5", L ? "text-slate-500" : "text-slate-400")}>{c.buyerName}</p>
                        )}
                      </div>
                      <Badge className={cn("text-[11px] border-0 gap-1 shrink-0 px-2 py-0.5",
                        L ? cn(sc.bgL, sc.textL) : cn(sc.bg, sc.text)
                      )}>
                        <StatusIcon className="w-3 h-3" />
                        {sc.label}
                      </Badge>
                    </div>

                    {/* Product + route + sparkline */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge className={cn("text-[11px] border-0 shrink-0 px-2 py-0.5",
                          L ? cn(pc.bgL, pc.textL) : cn(pc.bg, pc.text)
                        )}>
                          {c.product}
                        </Badge>
                        <div className={cn("flex items-center gap-1 text-xs truncate", L ? "text-slate-500" : "text-slate-400")}>
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">#{c.originTerminalId}</span>
                          <ArrowRight className="w-3 h-3 shrink-0" />
                          <span className="truncate">#{c.destinationTerminalId}</span>
                        </div>
                      </div>
                      <Sparkline data={sparkData} L={L} />
                    </div>

                    {/* Rate + date */}
                    <div className="flex items-center gap-3 text-xs">
                      {c.ratePerBbl != null && (
                        <span className={cn("flex items-center gap-1", L ? "text-slate-500" : "text-slate-400")}>
                          <DollarSign className="w-3 h-3" />
                          ${Number(c.ratePerBbl).toFixed(2)}/BBL
                        </span>
                      )}
                      {(c.effectiveDate || c.expirationDate) && (
                        <span className={cn("flex items-center gap-1", L ? "text-slate-500" : "text-slate-400")}>
                          <Calendar className="w-3 h-3" />
                          {c.effectiveDate?.slice(0, 10) || "?"} - {c.expirationDate?.slice(0, 10) || "?"}
                        </span>
                      )}
                    </div>

                    {/* Volume stats — 3 mini boxes */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className={cn("rounded-lg p-2.5 text-center border",
                        L ? "bg-blue-50 border-blue-100" : "bg-blue-500/5 border-blue-500/10"
                      )}>
                        <div className={cn("text-[10px] font-medium uppercase tracking-wider mb-0.5", L ? "text-blue-500" : "text-blue-400/70")}>Nominated</div>
                        <div className={cn("text-sm font-bold", L ? "text-blue-700" : "text-blue-400")}>{Number(c.nominatedBbl).toLocaleString()}</div>
                        <div className={cn("text-[10px]", L ? "text-blue-400" : "text-blue-500/50")}>BBL</div>
                      </div>
                      <div className={cn("rounded-lg p-2.5 text-center border",
                        L ? "bg-amber-50 border-amber-100" : "bg-amber-500/5 border-amber-500/10"
                      )}>
                        <div className={cn("text-[10px] font-medium uppercase tracking-wider mb-0.5", L ? "text-amber-500" : "text-amber-400/70")}>Loaded</div>
                        <div className={cn("text-sm font-bold", L ? "text-amber-700" : "text-amber-400")}>{Number(c.loadedBbl).toLocaleString()}</div>
                        <div className={cn("text-[10px]", L ? "text-amber-400" : "text-amber-500/50")}>BBL</div>
                      </div>
                      <div className={cn("rounded-lg p-2.5 text-center border",
                        L ? "bg-green-50 border-green-100" : "bg-green-500/5 border-green-500/10"
                      )}>
                        <div className={cn("text-[10px] font-medium uppercase tracking-wider mb-0.5", L ? "text-green-500" : "text-green-400/70")}>Delivered</div>
                        <div className={cn("text-sm font-bold", L ? "text-green-700" : "text-green-400")}>{Number(c.deliveredBbl).toLocaleString()}</div>
                        <div className={cn("text-[10px]", L ? "text-green-400" : "text-green-500/50")}>BBL</div>
                      </div>
                    </div>

                    {/* Segmented progress bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className={cn("font-medium", L ? "text-slate-600" : "text-slate-400")}>Fulfillment</span>
                        <span className={cn("font-bold",
                          pct >= 95 ? (L ? "text-green-700" : "text-green-400")
                            : pct >= 80 ? (L ? "text-amber-700" : "text-amber-400")
                            : (L ? "text-red-700" : "text-red-400")
                        )}>
                          {pct}%
                        </span>
                      </div>
                      <div className={cn("h-3 rounded-full overflow-hidden flex",
                        L ? "bg-slate-100" : "bg-white/[0.04]"
                      )}>
                        <div
                          className="h-full bg-green-500 transition-all duration-500"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                        <div
                          className="h-full bg-amber-500 transition-all duration-500"
                          style={{ width: `${Math.min(loadedOnlyPct, 100 - pct)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className={L ? "text-green-600" : "text-green-400/60"}>Delivered {pct}%</span>
                        {loadedOnlyPct > 0 && <span className={L ? "text-amber-600" : "text-amber-400/60"}>Loaded +{loadedOnlyPct}%</span>}
                        {remainingPct > 0 && <span className={L ? "text-slate-400" : "text-slate-500"}>Remaining {remainingPct}%</span>}
                      </div>
                    </div>

                    {/* Behind schedule warning */}
                    {c.status === "behind" && c.remainingBbl > 0 && (
                      <div className={cn("flex items-center gap-2 p-2.5 rounded-lg text-xs",
                        L ? "bg-red-50 border border-red-200 text-red-700" : "bg-red-500/10 border border-red-500/20 text-red-400"
                      )}>
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span><strong>{Number(c.remainingBbl).toLocaleString()} BBL</strong> behind schedule</span>
                      </div>
                    )}

                    {/* Footer actions */}
                    <div className={cn("flex items-center justify-between pt-3 border-t",
                      L ? "border-slate-100" : "border-white/[0.04]"
                    )}>
                      <div className={cn("flex items-center gap-1.5 text-xs", L ? "text-slate-500" : "text-slate-400")}>
                        <Layers className="w-3.5 h-3.5" />
                        <span><strong className={L ? "text-slate-700" : "text-white"}>{c.loadsNeeded}</strong> loads needed</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn("h-7 px-2.5 text-xs gap-1",
                            L ? "text-slate-500 hover:text-slate-700 hover:bg-slate-100" : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                          )}
                          onClick={() => setViewLoadsContract(viewLoadsContract === c.contractId ? null : c.contractId)}
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 px-3 text-xs gap-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                          onClick={() => { setCreateLoadsContract(c.contractId); setLoadCount(c.loadsNeeded || 1); }}
                        >
                          <Zap className="w-3 h-3" />
                          Create Loads
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  CREATE CONTRACT MODAL                                        */}
      {/* ============================================================ */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4 overflow-y-auto" onClick={() => setShowCreate(false)}>
          <div
            className={cn("w-full max-w-2xl rounded-2xl border shadow-2xl p-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-200",
              L ? "bg-white border-slate-200" : "bg-slate-900 border-white/[0.1]"
            )}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", L ? "bg-cyan-100" : "bg-cyan-500/15")}>
                  <Plus className={cn("w-5 h-5", L ? "text-cyan-700" : "text-cyan-400")} />
                </div>
                <div>
                  <h2 className={cn("text-lg font-bold", L ? "text-slate-900" : "text-white")}>New Allocation Contract</h2>
                  <p className={cn("text-xs", L ? "text-slate-500" : "text-slate-400")}>Set up a new daily barrel allocation</p>
                </div>
              </div>
              <button
                className={cn("p-2 rounded-lg transition-colors", L ? "hover:bg-slate-100 text-slate-400" : "hover:bg-white/[0.06] text-slate-500")}
                onClick={() => setShowCreate(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section: Contract Info */}
            <div className="space-y-5">
              <div>
                <h4 className={cn("text-xs font-semibold uppercase tracking-wider mb-3", L ? "text-slate-400" : "text-slate-500")}>Contract Info</h4>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Contract Name" error={formErrors.contractName} L={L}>
                    <Input
                      value={form.contractName}
                      onChange={e => setForm(p => ({ ...p, contractName: e.target.value }))}
                      placeholder="e.g., Eagle Ford Basin Q1"
                      className={cn("h-9 text-sm", inputStyle(L), formErrors.contractName && "border-red-500")}
                    />
                  </FormField>
                  <FormField label="Buyer Name" error={formErrors.buyerName} L={L}>
                    <Input
                      value={form.buyerName}
                      onChange={e => setForm(p => ({ ...p, buyerName: e.target.value }))}
                      placeholder="e.g., Acme Energy"
                      className={cn("h-9 text-sm", inputStyle(L), formErrors.buyerName && "border-red-500")}
                    />
                  </FormField>
                </div>
              </div>

              {/* Section: Product & Volume */}
              <div>
                <h4 className={cn("text-xs font-semibold uppercase tracking-wider mb-3", L ? "text-slate-400" : "text-slate-500")}>Product & Volume</h4>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Product" error={formErrors.product} L={L}>
                    <Input
                      value={form.product}
                      onChange={e => setForm(p => ({ ...p, product: e.target.value }))}
                      placeholder="e.g., Crude Oil, Water"
                      className={cn("h-9 text-sm", inputStyle(L), formErrors.product && "border-red-500")}
                    />
                  </FormField>
                  <FormField label="Daily Nomination (BBL)" error={formErrors.dailyNominationBbl} L={L}>
                    <Input
                      type="number"
                      min={0}
                      value={form.dailyNominationBbl || ""}
                      onChange={e => setForm(p => ({ ...p, dailyNominationBbl: Number(e.target.value) }))}
                      placeholder="e.g., 5000"
                      className={cn("h-9 text-sm", inputStyle(L), formErrors.dailyNominationBbl && "border-red-500")}
                    />
                  </FormField>
                </div>
              </div>

              {/* Section: Terminals */}
              <div>
                <h4 className={cn("text-xs font-semibold uppercase tracking-wider mb-3", L ? "text-slate-400" : "text-slate-500")}>Terminals</h4>
                <div className="grid grid-cols-3 gap-3">
                  <FormField label="Shipper ID" error={formErrors.shipperId} L={L}>
                    <Input
                      type="number"
                      min={0}
                      value={form.shipperId || ""}
                      onChange={e => setForm(p => ({ ...p, shipperId: Number(e.target.value) }))}
                      className={cn("h-9 text-sm", inputStyle(L), formErrors.shipperId && "border-red-500")}
                    />
                  </FormField>
                  <FormField label="Origin Terminal ID" error={formErrors.originTerminalId} L={L}>
                    <Input
                      type="number"
                      min={0}
                      value={form.originTerminalId || ""}
                      onChange={e => setForm(p => ({ ...p, originTerminalId: Number(e.target.value) }))}
                      className={cn("h-9 text-sm", inputStyle(L), formErrors.originTerminalId && "border-red-500")}
                    />
                  </FormField>
                  <FormField label="Destination Terminal ID" error={formErrors.destinationTerminalId} L={L}>
                    <Input
                      type="number"
                      min={0}
                      value={form.destinationTerminalId || ""}
                      onChange={e => setForm(p => ({ ...p, destinationTerminalId: Number(e.target.value) }))}
                      className={cn("h-9 text-sm", inputStyle(L), formErrors.destinationTerminalId && "border-red-500")}
                    />
                  </FormField>
                </div>
              </div>

              {/* Section: Pricing & Schedule */}
              <div>
                <h4 className={cn("text-xs font-semibold uppercase tracking-wider mb-3", L ? "text-slate-400" : "text-slate-500")}>Pricing & Schedule</h4>
                <div className="grid grid-cols-3 gap-3">
                  <FormField label="Rate per BBL ($)" error={formErrors.ratePerBbl} L={L}>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.ratePerBbl || ""}
                      onChange={e => setForm(p => ({ ...p, ratePerBbl: Number(e.target.value) }))}
                      className={cn("h-9 text-sm", inputStyle(L), formErrors.ratePerBbl && "border-red-500")}
                    />
                  </FormField>
                  <FormField label="Effective Date" error={formErrors.effectiveDate} L={L}>
                    <Input
                      type="date"
                      value={form.effectiveDate}
                      onChange={e => setForm(p => ({ ...p, effectiveDate: e.target.value }))}
                      className={cn("h-9 text-sm", inputStyle(L), formErrors.effectiveDate && "border-red-500")}
                    />
                  </FormField>
                  <FormField label="Expiration Date" error={formErrors.expirationDate} L={L}>
                    <Input
                      type="date"
                      value={form.expirationDate}
                      onChange={e => setForm(p => ({ ...p, expirationDate: e.target.value }))}
                      className={cn("h-9 text-sm", inputStyle(L), formErrors.expirationDate && "border-red-500")}
                    />
                  </FormField>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className={cn("flex items-center justify-end gap-3 mt-6 pt-5 border-t",
              L ? "border-slate-200" : "border-white/[0.06]"
            )}>
              <Button
                variant="outline"
                size="sm"
                className={cn("h-9 px-4 text-sm",
                  L ? "border-slate-200 text-slate-600 hover:bg-slate-50" : "border-white/[0.08] text-slate-400 hover:bg-white/[0.06]"
                )}
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-9 px-6 text-sm gap-2 bg-cyan-600 hover:bg-cyan-700 text-white"
                onClick={handleCreate}
                disabled={createMut.isPending}
              >
                {createMut.isPending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Create Contract
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  CREATE LOADS MODAL                                           */}
      {/* ============================================================ */}
      {createLoadsContract && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={() => setCreateLoadsContract(null)}>
          <div
            className={cn("w-full max-w-sm rounded-2xl border shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200",
              L ? "bg-white border-slate-200" : "bg-slate-900 border-white/[0.1]"
            )}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className={cn("p-2 rounded-lg", L ? "bg-cyan-100" : "bg-cyan-500/15")}>
                <Zap className={cn("w-5 h-5", L ? "text-cyan-700" : "text-cyan-400")} />
              </div>
              <div>
                <h3 className={cn("text-base font-bold", L ? "text-slate-900" : "text-white")}>Create Loads</h3>
                <p className={cn("text-xs", L ? "text-slate-500" : "text-slate-400")}>Generate loads from this allocation</p>
              </div>
            </div>

            <FormField label="Number of Loads" L={L}>
              <Input
                type="number"
                min={1}
                max={50}
                value={loadCount}
                onChange={e => setLoadCount(Number(e.target.value))}
                className={cn("h-9 text-sm", inputStyle(L))}
              />
            </FormField>

            <div className={cn("flex gap-3 mt-5 pt-4 border-t",
              L ? "border-slate-200" : "border-white/[0.06]"
            )}>
              <Button
                variant="outline"
                size="sm"
                className={cn("flex-1 h-9 text-sm",
                  L ? "border-slate-200 text-slate-600 hover:bg-slate-50" : "border-white/[0.08] text-slate-400 hover:bg-white/[0.06]"
                )}
                onClick={() => setCreateLoadsContract(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 h-9 text-sm gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white"
                onClick={() => createLoadsMut.mutate({ allocationContractId: createLoadsContract, trackingDate: date, count: loadCount })}
                disabled={createLoadsMut.isPending}
              >
                {createLoadsMut.isPending ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Creating...</>
                ) : (
                  <>Create {loadCount} Load{loadCount > 1 ? "s" : ""}</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  FOOTER STATUS BAR                                            */}
      {/* ============================================================ */}
      <div className={cn("flex items-center justify-between px-4 sm:px-6 py-2.5 border-t text-xs shrink-0",
        L ? "bg-white border-slate-200 text-slate-500" : "bg-slate-900/60 border-white/[0.06] text-slate-400"
      )}>
        <div className="flex gap-4">
          <span>
            <span className={cn("font-semibold", L ? "text-green-700" : "text-green-400")}>
              {allContracts.filter((c: any) => c.status === "on_track").length}
            </span> on track
          </span>
          <span>
            <span className={cn("font-semibold", L ? "text-red-700" : "text-red-400")}>
              {allContracts.filter((c: any) => c.status === "behind").length}
            </span> behind
          </span>
          <span>
            <span className={cn("font-semibold", L ? "text-emerald-700" : "text-emerald-400")}>
              {allContracts.filter((c: any) => c.status === "completed" || c.status === "ahead").length}
            </span> ahead/done
          </span>
        </div>
        <div>
          {allContracts.length} contract{allContracts.length !== 1 ? "s" : ""} &middot; {date}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Helper: Form Field                                                 */
/* ================================================================== */
function FormField({ label, error, L, children }: { label: string; error?: string; L: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={cn("text-xs font-medium mb-1.5 block", L ? "text-slate-600" : "text-slate-400")}>
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

/* ================================================================== */
/*  Helper: Input styling                                              */
/* ================================================================== */
function inputStyle(L: boolean) {
  return L
    ? "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
    : "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-600";
}
