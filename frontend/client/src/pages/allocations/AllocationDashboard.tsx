import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Droplets, ChevronLeft, ChevronRight, Plus, RefreshCw,
  TrendingUp, AlertTriangle, CheckCircle, Clock, Truck,
  Factory, BarChart3, Zap, X, Package,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: any }> = {
  pending: { color: "bg-slate-500/20 text-slate-400", label: "Pending", icon: Clock },
  on_track: { color: "bg-green-500/20 text-green-400", label: "On Track", icon: CheckCircle },
  behind: { color: "bg-red-500/20 text-red-400", label: "Behind", icon: AlertTriangle },
  ahead: { color: "bg-blue-500/20 text-blue-400", label: "Ahead", icon: TrendingUp },
  completed: { color: "bg-emerald-500/20 text-emerald-400", label: "Completed", icon: CheckCircle },
};

export default function AllocationDashboard() {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [showCreate, setShowCreate] = useState(false);
  const [createLoadsContract, setCreateLoadsContract] = useState<number | null>(null);
  const [loadCount, setLoadCount] = useState(1);

  // Create form state
  const [form, setForm] = useState({
    shipperId: 0, contractName: "", buyerName: "", originTerminalId: 0,
    destinationTerminalId: 0, product: "", dailyNominationBbl: 0,
    effectiveDate: "", expirationDate: "", ratePerBbl: 0,
  });

  const dashboardQuery = (trpc as any).allocationTracker.getDailyDashboard.useQuery(
    { date },
    { refetchInterval: 30000 }
  );
  const dashboard = dashboardQuery.data as any;

  const createMut = (trpc as any).allocationTracker.createContract.useMutation({
    onSuccess: () => { toast.success("Contract created"); setShowCreate(false); dashboardQuery.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const createLoadsMut = (trpc as any).allocationTracker.createLoadsFromAllocation.useMutation({
    onSuccess: (data: any) => {
      toast.success(`${data.createdLoadIds.length} loads created`);
      setCreateLoadsContract(null);
      dashboardQuery.refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const shiftDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split("T")[0]);
  };

  const summary = dashboard?.summaryBar || { totalNominated: 0, totalLoaded: 0, totalDelivered: 0, fulfillmentPercent: 0 };
  const contracts: any[] = dashboard?.contracts || [];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <Droplets className="w-5 h-5 text-cyan-400" />
          <h1 className="text-lg font-bold">Allocation Tracker</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => shiftDate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="h-7 w-36 text-xs bg-white/[0.04] border-white/[0.08] text-white text-center"
          />
          <Button variant="ghost" size="sm" className="h-7 px-1" onClick={() => shiftDate(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-400" onClick={() => dashboardQuery.refetch()}>
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1", dashboardQuery.isFetching && "animate-spin")} />Refresh
          </Button>
          <Button size="sm" className="h-7 px-3 text-xs bg-cyan-600 hover:bg-cyan-700" onClick={() => setShowCreate(!showCreate)}>
            <Plus className="w-3.5 h-3.5 mr-1" />New Contract
          </Button>
        </div>
      </div>

      {/* Create Contract Panel */}
      {showCreate && (
        <div className="px-4 py-3 border-b border-white/[0.06] bg-slate-900/80 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">New Allocation Contract</h3>
            <button className="text-slate-500 hover:text-white" onClick={() => setShowCreate(false)}><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: "Contract Name", key: "contractName", type: "text" },
              { label: "Buyer Name", key: "buyerName", type: "text" },
              { label: "Product", key: "product", type: "text" },
              { label: "Daily Nomination (BBL)", key: "dailyNominationBbl", type: "number" },
              { label: "Rate/BBL", key: "ratePerBbl", type: "number" },
              { label: "Shipper ID", key: "shipperId", type: "number" },
              { label: "Origin Terminal ID", key: "originTerminalId", type: "number" },
              { label: "Dest Terminal ID", key: "destinationTerminalId", type: "number" },
              { label: "Effective Date", key: "effectiveDate", type: "date" },
              { label: "Expiration Date", key: "expirationDate", type: "date" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] text-slate-500 uppercase mb-1 block">{f.label}</label>
                <Input
                  type={f.type}
                  value={(form as any)[f.key] || ""}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                  className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white"
                />
              </div>
            ))}
          </div>
          <Button size="sm" className="h-8 px-4 text-xs bg-cyan-600 hover:bg-cyan-700" onClick={() => createMut.mutate(form)} disabled={createMut.isPending}>
            {createMut.isPending ? "Creating..." : "Create Contract"}
          </Button>
        </div>
      )}

      {/* Summary Bar */}
      <div className="grid grid-cols-4 gap-3 px-4 py-3 border-b border-white/[0.06] bg-slate-900/30">
        {[
          { label: "Nominated", value: `${summary.totalNominated.toLocaleString()} BBL`, icon: Package, color: "text-blue-400" },
          { label: "Loaded", value: `${summary.totalLoaded.toLocaleString()} BBL`, icon: Truck, color: "text-green-400" },
          { label: "Delivered", value: `${summary.totalDelivered.toLocaleString()} BBL`, icon: Factory, color: "text-orange-400" },
          { label: "Fulfillment", value: `${summary.fulfillmentPercent}%`, icon: BarChart3, color: summary.fulfillmentPercent >= 100 ? "text-emerald-400" : summary.fulfillmentPercent >= 80 ? "text-green-400" : "text-red-400" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <s.icon className={cn("w-5 h-5", s.color)} />
            <div>
              <div className="text-[10px] text-slate-500 uppercase">{s.label}</div>
              <div className={cn("text-lg font-bold", s.color)}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Contract Cards */}
      <div className="flex-1 overflow-y-auto p-4">
        {dashboardQuery.isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading allocations...</div>
        ) : contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-sm">
            <Droplets className="w-10 h-10 mb-3 opacity-30" />
            No allocation contracts for this date
            <p className="text-xs mt-1 text-slate-600">Create a contract to start tracking</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {contracts.map((c: any) => {
              const sc = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
              const StatusIcon = sc.icon;
              const pct = c.nominatedBbl > 0 ? Math.round((c.deliveredBbl / c.nominatedBbl) * 100) : 0;
              const loadedPct = c.nominatedBbl > 0 ? Math.round((c.loadedBbl / c.nominatedBbl) * 100) : 0;

              return (
                <Card key={c.contractId} className="bg-white/[0.02] border-white/[0.06] p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">{c.contractName}</div>
                      {c.buyerName && <div className="text-[10px] text-slate-500">{c.buyerName}</div>}
                    </div>
                    <Badge className={cn("text-[10px] border-0 gap-1", sc.color)}>
                      <StatusIcon className="w-3 h-3" />{sc.label}
                    </Badge>
                  </div>

                  {/* Product + Terminals */}
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Badge className="bg-amber-500/10 text-amber-400 border-0 text-[10px]">{c.product}</Badge>
                    <span>Terminal #{c.originTerminalId} → #{c.destinationTerminalId}</span>
                  </div>

                  {/* Volume stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded bg-blue-500/5 border border-blue-500/10 py-1">
                      <div className="text-[10px] text-slate-500">Nominated</div>
                      <div className="text-sm font-bold text-blue-400">{c.nominatedBbl}</div>
                    </div>
                    <div className="rounded bg-green-500/5 border border-green-500/10 py-1">
                      <div className="text-[10px] text-slate-500">Loaded</div>
                      <div className="text-sm font-bold text-green-400">{c.loadedBbl}</div>
                    </div>
                    <div className="rounded bg-orange-500/5 border border-orange-500/10 py-1">
                      <div className="text-[10px] text-slate-500">Delivered</div>
                      <div className="text-sm font-bold text-orange-400">{c.deliveredBbl}</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">Fulfillment</span>
                      <span className={pct >= 100 ? "text-emerald-400" : pct >= 80 ? "text-green-400" : "text-red-400"}>{pct}%</span>
                    </div>
                    <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden relative">
                      <div className="absolute inset-y-0 left-0 bg-green-500/30 rounded-full transition-all" style={{ width: `${Math.min(loadedPct, 100)}%` }} />
                      <div className="absolute inset-y-0 left-0 bg-orange-500/50 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                    <div className="text-[10px] text-slate-500">
                      <span className="text-white font-medium">{c.remainingBbl}</span> BBL remaining · <span className="text-white font-medium">{c.loadsNeeded}</span> loads needed
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px] text-cyan-400 hover:text-cyan-300"
                      onClick={() => setCreateLoadsContract(c.contractId)}
                    >
                      <Zap className="w-3 h-3 mr-0.5" />Create Loads
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Loads Modal */}
      {createLoadsContract && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setCreateLoadsContract(null)}>
          <div className="bg-slate-900 border border-white/[0.08] rounded-xl p-6 w-80 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-white">Create Loads from Allocation</h3>
            <div>
              <label className="text-[10px] text-slate-500 uppercase mb-1 block">Number of Loads</label>
              <Input
                type="number"
                min={1}
                max={50}
                value={loadCount}
                onChange={e => setLoadCount(Number(e.target.value))}
                className="h-8 text-xs bg-white/[0.04] border-white/[0.08] text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs" onClick={() => setCreateLoadsContract(null)}>Cancel</Button>
              <Button
                size="sm"
                className="flex-1 h-8 text-xs bg-cyan-600 hover:bg-cyan-700"
                onClick={() => createLoadsMut.mutate({ allocationContractId: createLoadsContract, trackingDate: date, count: loadCount })}
                disabled={createLoadsMut.isPending}
              >
                {createLoadsMut.isPending ? "Creating..." : `Create ${loadCount} Load${loadCount > 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06] bg-slate-900/50 text-xs shrink-0">
        <div className="flex gap-4 text-slate-400">
          <span><span className="text-green-400 font-medium">{contracts.filter((c: any) => c.status === "on_track").length}</span> on track</span>
          <span><span className="text-red-400 font-medium">{contracts.filter((c: any) => c.status === "behind").length}</span> behind</span>
          <span><span className="text-emerald-400 font-medium">{contracts.filter((c: any) => c.status === "completed" || c.status === "ahead").length}</span> ahead/done</span>
        </div>
        <div className="text-slate-400">
          {contracts.length} active contract{contracts.length !== 1 ? "s" : ""} · {date}
        </div>
      </div>
    </div>
  );
}
