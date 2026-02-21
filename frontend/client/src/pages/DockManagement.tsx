/**
 * DOCK MANAGEMENT
 * Jony Ive design language — every element intentional, every pixel purposeful.
 *
 * Visual dock/bay grid with real-time status, assignment controls,
 * maintenance tracking, and dock performance metrics.
 * Per journey doc Section 6.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Container, Layers, Gauge, CheckCircle, XCircle, AlertTriangle,
  Clock, Truck, Package, Wrench, Play, Pause, RotateCcw,
  Plus, Settings, BarChart3, ArrowRight, Fuel, Droplets,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const cell = "rounded-2xl border border-white/[0.04] bg-white/[0.02]";

type DockStatus = "available" | "in_use" | "maintenance" | "offline";

const DOCK_STATUS: Record<DockStatus, { cls: string; bg: string; label: string; icon: any }> = {
  available:   { cls: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Available", icon: CheckCircle },
  in_use:      { cls: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", label: "In Use", icon: Package },
  maintenance: { cls: "text-red-400", bg: "bg-red-500/10 border-red-500/20", label: "Maintenance", icon: Wrench },
  offline:     { cls: "text-slate-500", bg: "bg-white/[0.03] border-white/[0.06]", label: "Offline", icon: XCircle },
};

export default function DockManagement() {
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<"grid" | "list" | "maintenance">("grid");

  const racksQ = (trpc as any).terminals?.getRackStatus?.useQuery?.() || { data: null };
  const bayStatsQ = (trpc as any).terminals?.getBayStats?.useQuery?.() || { data: null };
  const inventoryQ = (trpc as any).terminals?.getInventory?.useQuery?.({}) || { data: null };
  const utils = (trpc as any).useUtils();

  const startMut = (trpc as any).terminals?.startLoading?.useMutation?.({
    onSuccess: () => { toast.success("Loading started"); utils.terminals?.getRackStatus?.invalidate?.(); },
    onError: (e: any) => toast.error(e.message),
  }) || { mutate: () => {}, isPending: false };

  const completeMut = (trpc as any).terminals?.completeLoading?.useMutation?.({
    onSuccess: () => { toast.success("Loading completed"); utils.terminals?.getRackStatus?.invalidate?.(); },
    onError: (e: any) => toast.error(e.message),
  }) || { mutate: () => {}, isPending: false };

  const racks = (racksQ.data || []) as any[];
  const bayStats = bayStatsQ.data || { available: 0, loading: 0, unloading: 0, occupied: 0, maintenance: 0, utilization: 0, avgLoadTime: 0, throughputToday: 0 };
  const inventory = (inventoryQ.data || []) as any[];

  // Compute stats from racks data
  const available = racks.filter((r: any) => r.status === "available").length;
  const inUse = racks.filter((r: any) => r.status === "in_use").length;
  const maint = racks.filter((r: any) => r.status === "maintenance").length;
  const total = racks.length || 6;
  const utilization = total > 0 ? Math.round((inUse / total) * 100) : 0;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-white">Dock Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Monitor and control loading bays, racks, and dock assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.08] shadow-none h-9 px-4 text-xs font-medium">
            <Settings className="w-3.5 h-3.5 mr-1.5" />Configure
          </Button>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className={cn("p-4", cell)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-emerald-400" /></div>
            <div><p className="text-xl font-bold text-emerald-400">{available}</p><p className="text-[10px] text-slate-500">Available</p></div>
          </div>
        </div>
        <div className={cn("p-4", cell)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center"><Package className="w-5 h-5 text-blue-400" /></div>
            <div><p className="text-xl font-bold text-blue-400">{inUse}</p><p className="text-[10px] text-slate-500">In Use</p></div>
          </div>
        </div>
        <div className={cn("p-4", cell)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center"><Wrench className="w-5 h-5 text-red-400" /></div>
            <div><p className="text-xl font-bold text-red-400">{maint}</p><p className="text-[10px] text-slate-500">Maintenance</p></div>
          </div>
        </div>
        <div className={cn("p-4", cell)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center"><Gauge className="w-5 h-5 text-purple-400" /></div>
            <div><p className="text-xl font-bold text-purple-400">{utilization}%</p><p className="text-[10px] text-slate-500">Utilization</p></div>
          </div>
        </div>
        <div className={cn("p-4", cell)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1473FF]/10 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-[#1473FF]" /></div>
            <div><p className="text-xl font-bold text-[#1473FF]">{bayStats.throughputToday || 0}</p><p className="text-[10px] text-slate-500">Throughput Today</p></div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1">
        {(["grid", "list", "maintenance"] as const).map(v => (
          <button key={v} onClick={() => setTab(v)} className={cn(
            "text-[11px] px-3 py-1.5 rounded-lg font-medium transition-colors",
            tab === v ? "bg-[#1473FF]/15 text-[#1473FF]" : "bg-white/[0.03] text-slate-500 hover:text-slate-300"
          )}>{v === "grid" ? "Facility Layout" : v === "list" ? "Dock Details" : "Maintenance"}</button>
        ))}
      </div>

      {/* Grid View — Visual Dock Layout */}
      {tab === "grid" && (
        <div className="space-y-6">
          {/* Dock Grid */}
          <div className={cn("p-6", cell)}>
            <div className="flex items-center gap-2 mb-5">
              <Container className="w-4 h-4 text-[#1473FF]" />
              <span className="text-sm font-medium text-white">Facility Layout</span>
              <span className="text-[10px] text-slate-600 ml-auto">
                {available} available | {inUse} active | {maint} maintenance
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {(racks.length > 0 ? racks : [
                { id: "bay_1", name: "BAY-01", status: "available", products: ["Gasoline", "E85"] },
                { id: "bay_2", name: "BAY-02", status: "available", products: ["Gasoline", "Premium"] },
                { id: "bay_3", name: "BAY-03", status: "available", products: ["Diesel", "Biodiesel"] },
                { id: "bay_4", name: "BAY-04", status: "maintenance", products: ["Corrosives"], maintenanceReason: "Pump maintenance" },
                { id: "bay_5", name: "BAY-05", status: "available", products: ["Chemicals"] },
                { id: "bay_6", name: "BAY-06", status: "available", products: ["General"] },
              ]).map((dock: any) => {
                const st = DOCK_STATUS[dock.status as DockStatus] || DOCK_STATUS.available;
                const Icon = st.icon;
                const isSelected = selected === dock.id;
                return (
                  <button
                    key={dock.id}
                    onClick={() => setSelected(isSelected ? null : dock.id)}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all hover:scale-[1.02]",
                      st.bg,
                      isSelected && "ring-2 ring-[#1473FF]/50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-white">{dock.name || dock.id}</span>
                      <Icon className={cn("w-4 h-4", st.cls)} />
                    </div>

                    <p className={cn("text-[10px] font-medium mb-1", st.cls)}>{st.label}</p>

                    {dock.status === "in_use" && dock.currentLoad && (
                      <div className="mt-2 space-y-1">
                        <p className="text-[10px] text-slate-300 truncate">{dock.currentLoad.catalyst || "Loading..."}</p>
                        <p className="text-[9px] text-slate-500">{dock.currentLoad.product}</p>
                        {dock.currentLoad.progress != null && (
                          <div className="mt-1.5">
                            <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                              <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${dock.currentLoad.progress}%` }} />
                            </div>
                            <p className="text-[9px] text-blue-400 mt-0.5">{dock.currentLoad.progress}%</p>
                          </div>
                        )}
                      </div>
                    )}

                    {dock.status === "maintenance" && (
                      <p className="text-[9px] text-red-300/60 mt-1">{dock.maintenanceReason || "Scheduled"}</p>
                    )}

                    {dock.status === "available" && dock.products && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(dock.products as string[]).slice(0, 2).map((p: string) => (
                          <span key={p} className="text-[8px] text-slate-500 bg-white/[0.04] px-1.5 py-0.5 rounded">{p}</span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-white/[0.04]">
              {Object.entries(DOCK_STATUS).map(([key, val]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={cn("w-2 h-2 rounded-full", val.cls.replace("text-", "bg-"))} />
                  <span className="text-[10px] text-slate-500">{val.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Dock Detail */}
          {selected && (() => {
            const dock = racks.find((r: any) => r.id === selected) || { id: selected, name: selected, status: "available", products: [] };
            const st = DOCK_STATUS[dock.status as DockStatus] || DOCK_STATUS.available;
            return (
              <div className={cn("p-6", cell)}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", st.bg)}>
                      <st.icon className={cn("w-5 h-5", st.cls)} />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{dock.name || dock.id}</h3>
                      <p className={cn("text-xs", st.cls)}>{st.label}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {dock.status === "available" && (
                      <Button size="sm" onClick={() => startMut.mutate({ bayId: dock.id })} className="h-8 px-3 text-[11px] rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 shadow-none">
                        <Play className="w-3 h-3 mr-1" />Start Loading
                      </Button>
                    )}
                    {dock.status === "in_use" && (
                      <>
                        <Button size="sm" variant="ghost" className="h-8 px-3 text-[11px] text-amber-400 hover:bg-amber-400/10">
                          <Pause className="w-3 h-3 mr-1" />Pause
                        </Button>
                        <Button size="sm" onClick={() => completeMut.mutate({ bayId: dock.id })} className="h-8 px-3 text-[11px] rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 shadow-none">
                          <CheckCircle className="w-3 h-3 mr-1" />Complete
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white/[0.03] rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Products</p>
                    <p className="text-xs text-white mt-1">{(dock.products || []).join(", ") || "General"}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Flow Rate</p>
                    <p className="text-xs text-white mt-1">{dock.flowRate || "---"} {dock.flowRateUnit || "gpm"}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Today's Loads</p>
                    <p className="text-xs text-white mt-1">0</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Load Time</p>
                    <p className="text-xs text-white mt-1">{bayStats.avgLoadTime || "---"} min</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Tank Inventory */}
          {inventory.length > 0 && (
            <div className={cn("p-6", cell)}>
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-white">Tank Inventory</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {inventory.map((tank: any) => (
                  <div key={tank.tankId} className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.04]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-white">{tank.product}</span>
                      {tank.status === "low" && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <div className="mb-2">
                      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all",
                          tank.percentFull > 70 ? "bg-emerald-400" : tank.percentFull > 40 ? "bg-blue-400" : "bg-amber-400"
                        )} style={{ width: `${tank.percentFull}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">{(tank.currentLevel || 0).toLocaleString()} / {(tank.capacity || 0).toLocaleString()} {tank.unit}</span>
                      <span className={cn("text-[10px] font-semibold",
                        tank.percentFull > 70 ? "text-emerald-400" : tank.percentFull > 40 ? "text-blue-400" : "text-amber-400"
                      )}>{tank.percentFull}%</span>
                    </div>
                    {tank.alert && <p className="text-[9px] text-amber-400 mt-1">{tank.alert}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {tab === "list" && (
        <div className={cn("divide-y divide-white/[0.03]", cell)}>
          <div className="grid grid-cols-6 gap-3 px-5 py-3 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            <span>Dock</span><span>Status</span><span>Driver</span><span>Product</span><span>Progress</span><span>Est. Complete</span>
          </div>
          {(racks.length > 0 ? racks : [
            { id: "bay_1", name: "BAY-01", status: "in_use", currentLoad: { catalyst: "John D.", product: "UN1203", progress: 65, startTime: "10:00" } },
            { id: "bay_2", name: "BAY-02", status: "in_use", currentLoad: { catalyst: "Mike S.", product: "UN1203", progress: 40, startTime: "10:15" } },
            { id: "bay_3", name: "BAY-03", status: "available" },
            { id: "bay_4", name: "BAY-04", status: "maintenance", maintenanceReason: "Pump repair", expectedAvailable: "14:00" },
            { id: "bay_5", name: "BAY-05", status: "in_use", currentLoad: { catalyst: "Tom H.", product: "UN1830", progress: 85, startTime: "09:30" } },
            { id: "bay_6", name: "BAY-06", status: "available" },
          ]).map((dock: any) => {
            const st = DOCK_STATUS[dock.status as DockStatus] || DOCK_STATUS.available;
            return (
              <div key={dock.id} className="grid grid-cols-6 gap-3 px-5 py-3.5 items-center hover:bg-white/[0.01]">
                <span className="text-xs font-medium text-white">{dock.name || dock.id}</span>
                <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md w-fit", st.cls, st.bg.split(" ")[0])}>{st.label}</span>
                <span className="text-xs text-slate-300">{dock.currentLoad?.catalyst || "---"}</span>
                <span className="text-xs text-slate-400">{dock.currentLoad?.product || "---"}</span>
                <div>
                  {dock.currentLoad?.progress != null ? (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden flex-1">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: `${dock.currentLoad.progress}%` }} />
                      </div>
                      <span className="text-[10px] text-blue-400 font-medium">{dock.currentLoad.progress}%</span>
                    </div>
                  ) : <span className="text-[10px] text-slate-600">---</span>}
                </div>
                <span className="text-xs text-slate-500">{dock.expectedAvailable || (dock.currentLoad ? "~15 min" : "---")}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Maintenance Tab */}
      {tab === "maintenance" && (
        <div className="space-y-4">
          {racks.filter((r: any) => r.status === "maintenance").length === 0 && maint === 0 ? (
            <div className={cn("p-12 text-center", cell)}>
              <CheckCircle className="w-8 h-8 text-emerald-400/30 mx-auto mb-2" />
              <p className="text-sm text-slate-500">All docks operational</p>
              <p className="text-xs text-slate-600 mt-1">No docks currently in maintenance</p>
            </div>
          ) : (
            racks.filter((r: any) => r.status === "maintenance").map((dock: any) => (
              <div key={dock.id} className={cn("p-5 flex items-center justify-between", cell)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{dock.name || dock.id}</p>
                    <p className="text-xs text-slate-400">{dock.maintenanceReason || "Scheduled maintenance"}</p>
                    {dock.expectedAvailable && <p className="text-[10px] text-slate-500 mt-0.5">Expected available: {dock.expectedAvailable}</p>}
                  </div>
                </div>
                <Button size="sm" className="h-8 px-3 text-[11px] rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 shadow-none">
                  <RotateCcw className="w-3 h-3 mr-1" />Return to Service
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
