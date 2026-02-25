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
  Wifi, WifiOff, FileText, Zap, Database, Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import DatePicker from "@/components/DatePicker";

const cell = "rounded-2xl border border-slate-200/60 dark:border-white/[0.04] bg-white dark:bg-white/[0.02]";

type DockStatus = "available" | "in_use" | "maintenance" | "offline";

const DOCK_STATUS: Record<DockStatus, { cls: string; bg: string; label: string; icon: any }> = {
  available:   { cls: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Available", icon: CheckCircle },
  in_use:      { cls: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", label: "In Use", icon: Package },
  maintenance: { cls: "text-red-400", bg: "bg-red-500/10 border-red-500/20", label: "Maintenance", icon: Wrench },
  offline:     { cls: "text-slate-500", bg: "bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06]", label: "Offline", icon: XCircle },
};

export default function DockManagement() {
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<"grid" | "list" | "maintenance">("grid");
  const [showConfig, setShowConfig] = useState(false);
  const [showBOL, setShowBOL] = useState(false);
  const [bolForm, setBolForm] = useState({
    appointmentId: "",
    productType: "",
    productName: "",
    quantity: "",
    destination: "",
    bolType: "tanker" as "straight" | "order" | "hazmat" | "tanker" | "food_grade",
    unNumber: "",
    trailerNumber: "",
    sealNumber: "",
    freightCharges: "prepaid" as "prepaid" | "collect" | "third_party",
    poNumber: "",
    specialInstructions: "",
  });
  const [showRunTicket, setShowRunTicket] = useState(false);
  const [runTicketForm, setRunTicketForm] = useState({
    ticketDate: new Date().toISOString().split("T")[0],
    closingTime: "",
    driverName: "",
    driverNumber: "",
    transporterName: "",
    truckNumber: "",
    trailerNumber: "",
    // Origin (Lease/Plant)
    operatorLeasePlant: "",
    leasePlantName: "",
    forAccountOf: "",
    propertyNumber: "",
    propertyName: "",
    leaseNumber: "",
    county: "",
    stateProvince: "",
    operatorName: "",
    shipperName: "",
    // Tank / Meter
    tankNumber: "",
    tankSize: "",
    tankId: "",
    meterOff: "",
    meterOn: "",
    meterFactor: "",
    // Gauge readings
    openGaugeFt: "", openGaugeIn: "",
    closeGaugeFt: "", closeGaugeIn: "",
    highGaugeFt: "", highGaugeIn: "",
    lowGaugeFt: "", lowGaugeIn: "",
    openTemp: "", closeTemp: "",
    // Measurements
    obsGravity: "",
    obsTemperature: "",
    gravityAt60F: "",
    bsw: "",
    bswFeet: "", bswInches: "",
    startingGauge: "",
    endingGauge: "",
    grossBarrels: "",
    netBarrels: "",
    qualityNote: "",
    // Movement
    destinationStation: "",
    destinationMiles: "",
    nameOfCompany: "",
    rNumber: "",
    // Times
    driverOnTime: "",
    driverOffTime: "",
    // Product
    productType: "Crude Oil",
    destination: "",
    purchaserName: "",
    sealOn: "",
    sealOff: "",
    waitTimeHours: "",
    waitNotes: "",
    comment: "",
  });

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

  const pauseMut = (trpc as any).terminals?.pauseLoading?.useMutation?.({
    onSuccess: () => { toast.success("Loading paused"); utils.terminals?.getRackStatus?.invalidate?.(); },
    onError: (e: any) => toast.error(e.message),
  }) || { mutate: () => {}, isPending: false };

  const returnToServiceMut = (trpc as any).terminals?.returnToService?.useMutation?.({
    onSuccess: () => { toast.success("Dock returned to service"); utils.terminals?.getRackStatus?.invalidate?.(); },
    onError: (e: any) => toast.error(e.message),
  }) || { mutate: () => {}, isPending: false };

  // TAS connection status — which terminal automation system is connected
  const tasStatusQ = (trpc as any).terminals?.getTASConnectionStatus?.useQuery?.() || { data: null };
  const tasStatus = tasStatusQ.data as { provider: string; connected: boolean; lastSync?: string } | null;

  // BOL generation — uses bol.generate (enhanced with crude oil support)
  const bolMut = (trpc as any).bol?.generate?.useMutation?.({
    onSuccess: (d: any) => {
      toast.success(`BOL ${d?.bolNumber || ""} generated successfully`);
      setShowBOL(false);
    },
    onError: (e: any) => toast.error(e.message || "BOL generation failed"),
  }) || { mutate: () => {}, isPending: false };

  // Run Ticket generation — uses bol.generateRunTicket (enhanced with real-world fields)
  const runTicketMut = (trpc as any).bol?.generateRunTicket?.useMutation?.({
    onSuccess: (d: any) => {
      toast.success(`Run Ticket ${d?.ticketNumber || ""} generated`, { description: `Net: ${d?.ticket?.netBarrels || 0} BBL | Gross: ${d?.ticket?.grossBarrels || 0} BBL` });
      setShowRunTicket(false);
    },
    onError: (e: any) => toast.error(e.message || "Run ticket generation failed"),
  }) || { mutate: () => {}, isPending: false };

  const racks = (racksQ.data || []) as any[];
  const bayStats = bayStatsQ.data || { available: 0, loading: 0, unloading: 0, occupied: 0, maintenance: 0, utilization: 0, avgLoadTime: 0, throughputToday: 0 };
  const inventory = (inventoryQ.data || []) as any[];

  // Compute stats from racks data
  const available = racks.filter((r: any) => r.status === "available").length;
  const inUse = racks.filter((r: any) => r.status === "in_use").length;
  const maint = racks.filter((r: any) => r.status === "maintenance").length;
  const total = racks.length;
  const utilization = total > 0 ? Math.round((inUse / total) * 100) : 0;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-slate-800 dark:text-white">Dock Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Monitor and control loading bays, racks, and dock assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setShowConfig(true)} className="rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-white/[0.1] text-slate-800 dark:text-white border border-slate-200 dark:border-white/[0.08] shadow-none h-9 px-4 text-xs font-medium">
            <Settings className="w-3.5 h-3.5 mr-1.5" />Configure
          </Button>
        </div>
      </div>

      {/* ═══ TAS CONNECTION STATUS STRIP ═══ */}
      <div className={cn("flex items-center justify-between p-3.5 px-5 rounded-xl", cell)}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {tasStatus?.connected ? (
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Wifi className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">TAS Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-500">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">TAS Offline</span>
              </div>
            )}
            {tasStatus?.provider && (
              <span className={cn("text-[10px] px-2 py-0.5 rounded-md font-medium",
                tasStatus.provider === "DTN" ? "bg-blue-500/10 text-blue-400" :
                tasStatus.provider === "Buckeye" ? "bg-cyan-500/10 text-cyan-400" :
                tasStatus.provider === "Dearman" ? "bg-orange-500/10 text-orange-400" :
                "bg-slate-100 dark:bg-white/[0.04] text-slate-400"
              )}>
                {tasStatus.provider === "DTN" && <Zap className="w-2.5 h-2.5 inline mr-1" />}
                {tasStatus.provider === "Buckeye" && <Database className="w-2.5 h-2.5 inline mr-1" />}
                {tasStatus.provider === "Dearman" && <Radio className="w-2.5 h-2.5 inline mr-1" />}
                {tasStatus.provider}
              </span>
            )}
            {!tasStatus?.provider && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] text-slate-400">No TAS configured</span>
            )}
          </div>
          {tasStatus?.lastSync && (
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />Last sync: {new Date(tasStatus.lastSync).toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowRunTicket(true)}
            className="h-7 px-3 text-[10px] rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 shadow-none">
            <Droplets className="w-3 h-3 mr-1" />Run Ticket
          </Button>
          <Button size="sm" onClick={() => setShowBOL(true)}
            className="h-7 px-3 text-[10px] rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-white/[0.1] text-slate-800 dark:text-white border border-slate-200 dark:border-white/[0.08] shadow-none">
            <FileText className="w-3 h-3 mr-1" />Generate BOL
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
            tab === v ? "bg-[#1473FF]/15 text-[#1473FF]" : "bg-slate-50 dark:bg-white/[0.03] text-slate-500 hover:text-slate-300"
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
              <span className="text-sm font-medium text-slate-800 dark:text-white">Facility Layout</span>
              <span className="text-[10px] text-slate-600 ml-auto">
                {available} available | {inUse} active | {maint} maintenance
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {racks.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <Container className="w-10 h-10 text-slate-300 dark:text-white/10 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No loading bays configured</p>
                  <p className="text-xs text-slate-400 mt-1">Connect a TAS integration to populate your dock layout</p>
                </div>
              )}
              {racks.map((dock: any) => {
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
                      <span className="text-xs font-bold text-slate-800 dark:text-white">{dock.name || dock.id}</span>
                      <Icon className={cn("w-4 h-4", st.cls)} />
                    </div>

                    <p className={cn("text-[10px] font-medium mb-1", st.cls)}>{st.label}</p>

                    {dock.status === "in_use" && dock.currentLoad && (
                      <div className="mt-2 space-y-1">
                        <p className="text-[10px] text-slate-300 truncate">{dock.currentLoad.catalyst || "Loading..."}</p>
                        <p className="text-[9px] text-slate-500">{dock.currentLoad.product}</p>
                        {dock.currentLoad.progress != null && (
                          <div className="mt-1.5">
                            <div className="h-1 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
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
                          <span key={p} className="text-[8px] text-slate-500 bg-slate-50 dark:bg-white/[0.04] px-1.5 py-0.5 rounded">{p}</span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-slate-200/60 dark:border-white/[0.04]">
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
                      <h3 className="text-slate-800 dark:text-white font-semibold">{dock.name || dock.id}</h3>
                      <p className={cn("text-xs", st.cls)}>{st.label}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {dock.status === "available" && (
                      <Button size="sm" onClick={() => startMut.mutate({ bayId: dock.id })} className="h-8 px-3 text-[11px] rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-slate-800 dark:text-white border-0 shadow-none">
                        <Play className="w-3 h-3 mr-1" />Start Loading
                      </Button>
                    )}
                    {dock.status === "in_use" && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => pauseMut.mutate({ bayId: dock.id })} className="h-8 px-3 text-[11px] text-amber-400 hover:bg-amber-400/10">
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
                  <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Products</p>
                    <p className="text-xs text-slate-800 dark:text-white mt-1">{(dock.products || []).join(", ") || "General"}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Flow Rate</p>
                    <p className="text-xs text-slate-800 dark:text-white mt-1">{dock.flowRate || "---"} {dock.flowRateUnit || "gpm"}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Today's Loads</p>
                    <p className="text-xs text-slate-800 dark:text-white mt-1">0</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Load Time</p>
                    <p className="text-xs text-slate-800 dark:text-white mt-1">{bayStats.avgLoadTime || "---"} min</p>
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
                <span className="text-sm font-medium text-slate-800 dark:text-white">Tank Inventory</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {inventory.map((tank: any) => (
                  <div key={tank.tankId} className="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-4 border border-slate-200/60 dark:border-white/[0.04]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-800 dark:text-white">{tank.product}</span>
                      {tank.status === "low" && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <div className="mb-2">
                      <div className="h-2 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
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
        <div className={cn("divide-y divide-slate-200/60 dark:divide-white/[0.03]", cell)}>
          <div className="grid grid-cols-6 gap-3 px-5 py-3 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            <span>Dock</span><span>Status</span><span>Driver</span><span>Product</span><span>Progress</span><span>Est. Complete</span>
          </div>
          {racks.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <Container className="w-10 h-10 text-slate-300 dark:text-white/10 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No dock data available</p>
              <p className="text-xs text-slate-400 mt-1">Connect a TAS integration to see live dock details</p>
            </div>
          ) : null}
          {racks.map((dock: any) => {
            const st = DOCK_STATUS[dock.status as DockStatus] || DOCK_STATUS.available;
            return (
              <div key={dock.id} className="grid grid-cols-6 gap-3 px-5 py-3.5 items-center hover:bg-white/[0.01]">
                <span className="text-xs font-medium text-slate-800 dark:text-white">{dock.name || dock.id}</span>
                <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md w-fit", st.cls, st.bg.split(" ")[0])}>{st.label}</span>
                <span className="text-xs text-slate-300">{dock.currentLoad?.catalyst || "---"}</span>
                <span className="text-xs text-slate-400">{dock.currentLoad?.product || "---"}</span>
                <div>
                  {dock.currentLoad?.progress != null ? (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden flex-1">
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
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{dock.name || dock.id}</p>
                    <p className="text-xs text-slate-400">{dock.maintenanceReason || "Scheduled maintenance"}</p>
                    {dock.expectedAvailable && <p className="text-[10px] text-slate-500 mt-0.5">Expected available: {dock.expectedAvailable}</p>}
                  </div>
                </div>
                <Button size="sm" onClick={() => returnToServiceMut.mutate({ bayId: dock.id })} className="h-8 px-3 text-[11px] rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 shadow-none">
                  <RotateCcw className="w-3 h-3 mr-1" />Return to Service
                </Button>
              </div>
            ))
          )}
        </div>
      )}
      {/* ═══ CONFIGURE MODAL ═══ */}
      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowConfig(false)}>
          <div className={cn("w-full max-w-lg mx-4 rounded-2xl border p-6 space-y-5", cell, "bg-white dark:bg-[#0B1120] border-slate-200 dark:border-white/[0.08]")} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Dock Configuration</h2>
              <button onClick={() => setShowConfig(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-white"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">Active Bays</label>
                <Input type="number" defaultValue={racks.length || 6} placeholder="Number of bays" className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">Default Products</label>
                <Input defaultValue="Gasoline, Diesel, Biodiesel, Jet Fuel" placeholder="Comma-separated" className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">Operating Hours</label>
                <div className="flex gap-2">
                  <Input defaultValue="06:00" className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
                  <span className="text-slate-500 self-center">to</span>
                  <Input defaultValue="22:00" className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">TAS Provider</label>
                <Input defaultValue={tasStatus?.provider || ""} placeholder="DTN, Buckeye, Dearman..." className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" readOnly />
                <p className="text-[10px] text-slate-500 mt-1">Manage TAS connections in Integrations</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="ghost" onClick={() => setShowConfig(false)} className="h-9 px-4 text-xs rounded-xl">Cancel</Button>
              <Button size="sm" onClick={() => { toast.info("Dock configuration is managed through your TAS integration. Go to Integrations to connect DTN, Buckeye, or Dearman."); setShowConfig(false); }} className="h-9 px-4 text-xs rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ GENERATE BOL MODAL ═══ */}
      {showBOL && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8" onClick={() => setShowBOL(false)}>
          <div className={cn("w-full max-w-2xl mx-4 rounded-2xl border p-6 space-y-5", cell, "bg-white dark:bg-[#0B1120] border-slate-200 dark:border-white/[0.08]")} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Generate Bill of Lading</h2>
                <p className="text-xs text-slate-500 mt-0.5">AI-powered document generation with ESANG</p>
              </div>
              <button onClick={() => setShowBOL(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-white"><XCircle className="w-5 h-5" /></button>
            </div>
            
            {/* BOL Type Selector */}
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "tanker", label: "Tanker", icon: "🛢️" },
                { value: "hazmat", label: "Hazmat", icon: "☢️" },
                { value: "straight", label: "Standard", icon: "📦" },
                { value: "food_grade", label: "Food Grade", icon: "🥛" },
              ].map(t => (
                <button key={t.value} onClick={() => setBolForm(p => ({ ...p, bolType: t.value as any }))}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    bolForm.bolType === t.value 
                      ? "bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border-[#1473FF]/30 text-[#1473FF]" 
                      : "bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-400")}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">Appointment ID <span className="text-red-400">*</span></label>
                <Input value={bolForm.appointmentId} onChange={e => setBolForm(p => ({ ...p, appointmentId: e.target.value }))} placeholder="APT-2026-XXXX" className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">PO Number</label>
                <Input value={bolForm.poNumber} onChange={e => setBolForm(p => ({ ...p, poNumber: e.target.value }))} placeholder="Purchase order #" className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">Product <span className="text-red-400">*</span></label>
                {inventory.length > 0 ? (
                  <select value={bolForm.productName} onChange={e => setBolForm(p => ({ ...p, productName: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-slate-800 dark:text-white outline-none">
                    <option value="">Select product...</option>
                    {inventory.map((t: any) => (
                      <option key={t.tankId} value={t.product}>{t.product}</option>
                    ))}
                  </select>
                ) : (
                  <Input value={bolForm.productName} onChange={e => setBolForm(p => ({ ...p, productName: e.target.value }))} placeholder="e.g. Unleaded Gasoline, Diesel" className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
                )}
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">Quantity (gallons) <span className="text-red-400">*</span></label>
                <Input type="number" value={bolForm.quantity} onChange={e => setBolForm(p => ({ ...p, quantity: e.target.value }))} placeholder="e.g. 8500" className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">Trailer Number</label>
                <Input value={bolForm.trailerNumber} onChange={e => setBolForm(p => ({ ...p, trailerNumber: e.target.value }))} placeholder="e.g. TRL-1234" className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">Seal Number</label>
                <Input value={bolForm.sealNumber} onChange={e => setBolForm(p => ({ ...p, sealNumber: e.target.value }))} placeholder="e.g. SEAL-5678" className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
              </div>
              {bolForm.bolType === "hazmat" && (
                <div className="col-span-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">UN Number <span className="text-amber-500">(AI will auto-populate hazmat info)</span></label>
                  <Input value={bolForm.unNumber} onChange={e => setBolForm(p => ({ ...p, unNumber: e.target.value }))} placeholder="e.g. UN1203 (Gasoline)" className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30" />
                </div>
              )}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">Freight Charges</label>
                <select value={bolForm.freightCharges} onChange={e => setBolForm(p => ({ ...p, freightCharges: e.target.value as any }))} className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-slate-800 dark:text-white outline-none">
                  <option value="prepaid">Prepaid</option>
                  <option value="collect">Collect</option>
                  <option value="third_party">Third Party</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">Destination</label>
                <Input value={bolForm.destination} onChange={e => setBolForm(p => ({ ...p, destination: e.target.value }))} placeholder="Delivery address" className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">Special Instructions</label>
                <Input value={bolForm.specialInstructions} onChange={e => setBolForm(p => ({ ...p, specialInstructions: e.target.value }))} placeholder="Liftgate required, appointment time, freeze protect, etc." className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
              </div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <button onClick={() => setShowRunTicket(true)} className="text-xs text-slate-500 hover:text-[#1473FF] flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />Need Run Ticket instead?
              </button>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowBOL(false)} className="h-9 px-4 text-xs rounded-xl">Cancel</Button>
                <Button size="sm" disabled={!bolForm.appointmentId || !bolForm.productName || !bolForm.quantity || bolMut.isPending}
                  onClick={() => {
                    bolMut.mutate({
                      appointmentId: bolForm.appointmentId,
                      shipDate: new Date().toISOString().split("T")[0],
                      productType: bolForm.productType || bolForm.productName,
                      productName: bolForm.productName,
                      quantity: Number(bolForm.quantity),
                      bolType: bolForm.bolType,
                      unNumber: bolForm.unNumber || undefined,
                      trailerNumber: bolForm.trailerNumber || undefined,
                      sealNumber: bolForm.sealNumber || undefined,
                      freightCharges: bolForm.freightCharges,
                      poNumber: bolForm.poNumber || undefined,
                      specialInstructions: bolForm.specialInstructions || undefined,
                      tankerInfo: bolForm.bolType === "tanker" ? {
                        productType: bolForm.productType || bolForm.productName,
                        productName: bolForm.productName,
                        quantityGallons: Number(bolForm.quantity),
                        sealNumber: bolForm.sealNumber || undefined,
                      } : undefined,
                    });
                  }}
                  className="h-9 px-4 text-xs rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0">
                  <FileText className="w-3.5 h-3.5 mr-1.5" />{bolMut.isPending ? "Generating..." : "Generate BOL"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ EUSOTICKET RUN TICKET MODAL — Real-World Crude Oil Fields ═══ */}
      {showRunTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-4" onClick={() => setShowRunTicket(false)}>
          <div className={cn("w-full max-w-4xl mx-4 rounded-2xl border p-6 space-y-4 max-h-[92vh] overflow-y-auto", cell, "bg-white dark:bg-[#0B1120] border-slate-200 dark:border-white/[0.08]")} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">EusoTicket -- Run Ticket</h2>
                <p className="text-xs text-slate-500 mt-0.5">Industry-standard petroleum run ticket with API/ASTM volume calculations</p>
              </div>
              <button onClick={() => setShowRunTicket(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-white"><XCircle className="w-5 h-5" /></button>
            </div>

            {/* SECTION 1: Basic Info + Product */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">Ticket Date <span className="text-red-400">*</span></label>
                <DatePicker value={runTicketForm.ticketDate} onChange={(v) => setRunTicketForm(p => ({ ...p, ticketDate: v }))} />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">Product <span className="text-red-400">*</span></label>
                <select value={runTicketForm.productType} onChange={e => setRunTicketForm(p => ({ ...p, productType: e.target.value }))} className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-slate-800 dark:text-white outline-none h-9">
                  <option value="Crude Oil">UN1267 - Crude Oil</option>
                  <option value="Condensate">Condensate</option>
                  <option value="Natural Gas Liquids">NGL</option>
                  <option value="Produced Water">Produced Water</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">R Number</label>
                <Input value={runTicketForm.rNumber} onChange={e => setRunTicketForm(p => ({ ...p, rNumber: e.target.value }))} placeholder="e.g. 476875" className="rounded-xl bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06] h-9 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">Quality</label>
                <select value={runTicketForm.qualityNote} onChange={e => setRunTicketForm(p => ({ ...p, qualityNote: e.target.value }))} className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-slate-800 dark:text-white outline-none h-9">
                  <option value="">Select...</option>
                  <option value="Good Oil">Good Oil</option>
                  <option value="Reject">Reject</option>
                  <option value="High BS&W">High BS&W</option>
                </select>
              </div>
            </div>

            {/* SECTION 2: Driver / Equipment */}
            <div className={cn("rounded-xl border p-3", "bg-blue-50/50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/20")}>
              <h3 className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 mb-2 uppercase tracking-wider">Driver / Equipment</h3>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Driver Name</label>
                  <Input value={runTicketForm.driverName} onChange={e => setRunTicketForm(p => ({ ...p, driverName: e.target.value }))} placeholder="Jeff Black" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-blue-200 dark:border-blue-500/30" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Driver #</label>
                  <Input value={runTicketForm.driverNumber} onChange={e => setRunTicketForm(p => ({ ...p, driverNumber: e.target.value }))} placeholder="84" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-blue-200 dark:border-blue-500/30" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Truck #</label>
                  <Input value={runTicketForm.truckNumber} onChange={e => setRunTicketForm(p => ({ ...p, truckNumber: e.target.value }))} placeholder="3424 8085" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-blue-200 dark:border-blue-500/30" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Trailer #</label>
                  <Input value={runTicketForm.trailerNumber} onChange={e => setRunTicketForm(p => ({ ...p, trailerNumber: e.target.value }))} placeholder="1432" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-blue-200 dark:border-blue-500/30" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Trucked By</label>
                  <Input value={runTicketForm.transporterName} onChange={e => setRunTicketForm(p => ({ ...p, transporterName: e.target.value }))} placeholder="Carrier company" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-blue-200 dark:border-blue-500/30" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Driver ON Time</label>
                  <Input type="time" value={runTicketForm.driverOnTime} onChange={e => setRunTicketForm(p => ({ ...p, driverOnTime: e.target.value }))} className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-blue-200 dark:border-blue-500/30" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Driver OFF Time</label>
                  <Input type="time" value={runTicketForm.driverOffTime} onChange={e => setRunTicketForm(p => ({ ...p, driverOffTime: e.target.value }))} className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-blue-200 dark:border-blue-500/30" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Wait Time (hrs)</label>
                  <Input type="number" step="0.5" value={runTicketForm.waitTimeHours} onChange={e => setRunTicketForm(p => ({ ...p, waitTimeHours: e.target.value }))} placeholder="0" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-blue-200 dark:border-blue-500/30" />
                </div>
              </div>
            </div>

            {/* SECTION 3: Origin (Lease/Plant) */}
            <div className={cn("rounded-xl border p-3", "bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20")}>
              <h3 className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-2 uppercase tracking-wider">Origin (Lease / Plant)</h3>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Operator / Lease Plant</label>
                  <Input value={runTicketForm.operatorLeasePlant} onChange={e => setRunTicketForm(p => ({ ...p, operatorLeasePlant: e.target.value }))} placeholder="Hagerman" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-emerald-200 dark:border-emerald-500/30" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">For the Account Of</label>
                  <Input value={runTicketForm.forAccountOf} onChange={e => setRunTicketForm(p => ({ ...p, forAccountOf: e.target.value }))} placeholder="E.E.P" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-emerald-200 dark:border-emerald-500/30" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Lease #</label>
                  <Input value={runTicketForm.leaseNumber} onChange={e => setRunTicketForm(p => ({ ...p, leaseNumber: e.target.value }))} placeholder="HAGE0003" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-emerald-200 dark:border-emerald-500/30" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Operator</label>
                  <Input value={runTicketForm.operatorName} onChange={e => setRunTicketForm(p => ({ ...p, operatorName: e.target.value }))} placeholder="Somgas LP" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-emerald-200 dark:border-emerald-500/30" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Shipper</label>
                  <Input value={runTicketForm.shipperName} onChange={e => setRunTicketForm(p => ({ ...p, shipperName: e.target.value }))} placeholder="CP Energy" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-emerald-200 dark:border-emerald-500/30" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">County</label>
                  <Input value={runTicketForm.county} onChange={e => setRunTicketForm(p => ({ ...p, county: e.target.value }))} placeholder="Grayson" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-emerald-200 dark:border-emerald-500/30" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">State</label>
                  <Input value={runTicketForm.stateProvince} onChange={e => setRunTicketForm(p => ({ ...p, stateProvince: e.target.value }))} placeholder="TX" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-emerald-200 dark:border-emerald-500/30" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Customer</label>
                  <Input value={runTicketForm.nameOfCompany} onChange={e => setRunTicketForm(p => ({ ...p, nameOfCompany: e.target.value }))} placeholder="Company name" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-emerald-200 dark:border-emerald-500/30" />
                </div>
              </div>
            </div>

            {/* SECTION 4: Tank & Gauge Readings */}
            <div className={cn("rounded-xl border p-3", "bg-amber-50/50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20")}>
              <h3 className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 mb-2 uppercase tracking-wider">Tank / Gauge / Measurements</h3>
              <div className="grid grid-cols-6 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Tank #</label>
                  <Input value={runTicketForm.tankNumber} onChange={e => setRunTicketForm(p => ({ ...p, tankNumber: e.target.value }))} placeholder="3" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-amber-200 dark:border-amber-500/30" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Tank Size (BBL)</label>
                  <Input type="number" value={runTicketForm.tankSize} onChange={e => setRunTicketForm(p => ({ ...p, tankSize: e.target.value }))} placeholder="500" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-amber-200 dark:border-amber-500/30" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Meter OFF</label>
                  <Input type="number" value={runTicketForm.meterOff} onChange={e => setRunTicketForm(p => ({ ...p, meterOff: e.target.value }))} className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-amber-200 dark:border-amber-500/30" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Meter ON</label>
                  <Input type="number" value={runTicketForm.meterOn} onChange={e => setRunTicketForm(p => ({ ...p, meterOn: e.target.value }))} className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-amber-200 dark:border-amber-500/30" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Meter Factor</label>
                  <Input type="number" step="0.001" value={runTicketForm.meterFactor} onChange={e => setRunTicketForm(p => ({ ...p, meterFactor: e.target.value }))} className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-amber-200 dark:border-amber-500/30" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Seal ON / OFF</label>
                  <div className="flex gap-1">
                    <Input value={runTicketForm.sealOn} onChange={e => setRunTicketForm(p => ({ ...p, sealOn: e.target.value }))} placeholder="On" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-amber-200 dark:border-amber-500/30 w-1/2" />
                    <Input value={runTicketForm.sealOff} onChange={e => setRunTicketForm(p => ({ ...p, sealOff: e.target.value }))} placeholder="Off" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-amber-200 dark:border-amber-500/30 w-1/2" />
                  </div>
                </div>
              </div>
              {/* Gauge readings (FT / IN) + Temps */}
              <div className="grid grid-cols-6 gap-3 mt-3">
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-500 block mb-1">Open/High Gauge (FT' IN")</label>
                  <div className="flex gap-1">
                    <Input type="number" value={runTicketForm.openGaugeFt} onChange={e => setRunTicketForm(p => ({ ...p, openGaugeFt: e.target.value }))} placeholder="FT" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-amber-200 dark:border-amber-500/30 w-1/2" />
                    <Input type="number" value={runTicketForm.openGaugeIn} onChange={e => setRunTicketForm(p => ({ ...p, openGaugeIn: e.target.value }))} placeholder="IN" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-amber-200 dark:border-amber-500/30 w-1/2" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Open Temp (F)</label>
                  <Input type="number" value={runTicketForm.openTemp} onChange={e => setRunTicketForm(p => ({ ...p, openTemp: e.target.value }))} placeholder="60" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-amber-200 dark:border-amber-500/30" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-slate-500 block mb-1">Close/Low Gauge (FT' IN")</label>
                  <div className="flex gap-1">
                    <Input type="number" value={runTicketForm.closeGaugeFt} onChange={e => setRunTicketForm(p => ({ ...p, closeGaugeFt: e.target.value }))} placeholder="FT" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-amber-200 dark:border-amber-500/30 w-1/2" />
                    <Input type="number" value={runTicketForm.closeGaugeIn} onChange={e => setRunTicketForm(p => ({ ...p, closeGaugeIn: e.target.value }))} placeholder="IN" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-amber-200 dark:border-amber-500/30 w-1/2" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Close Temp (F)</label>
                  <Input type="number" value={runTicketForm.closeTemp} onChange={e => setRunTicketForm(p => ({ ...p, closeTemp: e.target.value }))} placeholder="58" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-amber-200 dark:border-amber-500/30" />
                </div>
              </div>
              {/* Observed Measurements */}
              <div className="grid grid-cols-6 gap-3 mt-3">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Obs Gravity <span className="text-red-400">*</span></label>
                  <Input type="number" step="0.1" value={runTicketForm.obsGravity} onChange={e => setRunTicketForm(p => ({ ...p, obsGravity: e.target.value }))} placeholder="29" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-amber-200 dark:border-amber-500/30" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Obs Temp (F) <span className="text-red-400">*</span></label>
                  <Input type="number" step="0.1" value={runTicketForm.obsTemperature} onChange={e => setRunTicketForm(p => ({ ...p, obsTemperature: e.target.value }))} placeholder="60" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-amber-200 dark:border-amber-500/30" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Gravity @60F</label>
                  <Input type="number" step="0.1" value={runTicketForm.gravityAt60F} onChange={e => setRunTicketForm(p => ({ ...p, gravityAt60F: e.target.value }))} placeholder="50.3" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-amber-200 dark:border-amber-500/30" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">BS&W % <span className="text-red-400">*</span></label>
                  <Input type="number" step="0.01" value={runTicketForm.bsw} onChange={e => setRunTicketForm(p => ({ ...p, bsw: e.target.value }))} placeholder="0.90" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-amber-200 dark:border-amber-500/30" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Gross BBL</label>
                  <Input type="number" step="0.01" value={runTicketForm.grossBarrels} onChange={e => setRunTicketForm(p => ({ ...p, grossBarrels: e.target.value }))} placeholder="182.20" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-amber-200 dark:border-amber-500/30" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Net BBL</label>
                  <Input type="number" step="0.01" value={runTicketForm.netBarrels} onChange={e => setRunTicketForm(p => ({ ...p, netBarrels: e.target.value }))} placeholder="150" className="rounded-lg h-8 text-sm bg-white dark:bg-white/[0.04] border-amber-200 dark:border-amber-500/30" />
                </div>
              </div>
            </div>

            {/* SECTION 5: Movement / Destination */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Destination Station</label>
                <Input value={runTicketForm.destinationStation} onChange={e => setRunTicketForm(p => ({ ...p, destinationStation: e.target.value }))} placeholder="Barcas - Cushing" className="rounded-lg h-8 text-sm bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">One-Way Miles</label>
                <Input type="number" value={runTicketForm.destinationMiles} onChange={e => setRunTicketForm(p => ({ ...p, destinationMiles: e.target.value }))} placeholder="350" className="rounded-lg h-8 text-sm bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Purchaser</label>
                <Input value={runTicketForm.purchaserName} onChange={e => setRunTicketForm(p => ({ ...p, purchaserName: e.target.value }))} placeholder="First purchaser" className="rounded-lg h-8 text-sm bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Comments</label>
                <Input value={runTicketForm.comment} onChange={e => setRunTicketForm(p => ({ ...p, comment: e.target.value }))} placeholder="29G 60F, Good Oil" className="rounded-lg h-8 text-sm bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]" />
              </div>
            </div>

            {/* ACTION BAR */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-white/[0.06]">
              <button onClick={() => { setShowRunTicket(false); setShowBOL(true); }} className="text-xs text-slate-500 hover:text-[#1473FF] flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />Need BOL instead?
              </button>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowRunTicket(false)} className="h-9 px-4 text-xs rounded-xl">Cancel</Button>
                <Button size="sm" disabled={!runTicketForm.ticketDate || !runTicketForm.obsGravity || !runTicketForm.obsTemperature || !runTicketForm.bsw || runTicketMut.isPending}
                  onClick={() => {
                    runTicketMut.mutate({
                      ticketDate: runTicketForm.ticketDate,
                      closingTime: runTicketForm.closingTime || undefined,
                      driverName: runTicketForm.driverName || undefined,
                      driverNumber: runTicketForm.driverNumber || undefined,
                      transporterName: runTicketForm.transporterName || undefined,
                      truckNumber: runTicketForm.truckNumber || undefined,
                      trailerNumber: runTicketForm.trailerNumber || undefined,
                      operatorLeasePlant: runTicketForm.operatorLeasePlant || undefined,
                      leasePlantName: runTicketForm.leasePlantName || undefined,
                      forAccountOf: runTicketForm.forAccountOf || undefined,
                      propertyNumber: runTicketForm.propertyNumber || undefined,
                      propertyName: runTicketForm.propertyName || undefined,
                      leaseNumber: runTicketForm.leaseNumber || undefined,
                      county: runTicketForm.county || undefined,
                      stateProvince: runTicketForm.stateProvince || undefined,
                      operatorName: runTicketForm.operatorName || undefined,
                      shipperName: runTicketForm.shipperName || undefined,
                      tankNumber: runTicketForm.tankNumber || undefined,
                      tankSize: runTicketForm.tankSize ? Number(runTicketForm.tankSize) : undefined,
                      tankId: runTicketForm.tankId || undefined,
                      meterOff: runTicketForm.meterOff ? Number(runTicketForm.meterOff) : undefined,
                      meterOn: runTicketForm.meterOn ? Number(runTicketForm.meterOn) : undefined,
                      meterFactor: runTicketForm.meterFactor ? Number(runTicketForm.meterFactor) : undefined,
                      openGauge: runTicketForm.openGaugeFt ? { feet: Number(runTicketForm.openGaugeFt), inches: Number(runTicketForm.openGaugeIn || 0), fraction: 0 } : undefined,
                      closeGauge: runTicketForm.closeGaugeFt ? { feet: Number(runTicketForm.closeGaugeFt), inches: Number(runTicketForm.closeGaugeIn || 0), fraction: 0 } : undefined,
                      openTemp: runTicketForm.openTemp ? Number(runTicketForm.openTemp) : undefined,
                      closeTemp: runTicketForm.closeTemp ? Number(runTicketForm.closeTemp) : undefined,
                      obsGravity: Number(runTicketForm.obsGravity),
                      obsTemperature: Number(runTicketForm.obsTemperature),
                      gravityAt60F: runTicketForm.gravityAt60F ? Number(runTicketForm.gravityAt60F) : undefined,
                      bsw: Number(runTicketForm.bsw),
                      bswFeet: runTicketForm.bswFeet ? Number(runTicketForm.bswFeet) : undefined,
                      bswInches: runTicketForm.bswInches ? Number(runTicketForm.bswInches) : undefined,
                      grossBarrels: runTicketForm.grossBarrels ? Number(runTicketForm.grossBarrels) : undefined,
                      netBarrels: runTicketForm.netBarrels ? Number(runTicketForm.netBarrels) : undefined,
                      startingGauge: runTicketForm.startingGauge ? Number(runTicketForm.startingGauge) : undefined,
                      endingGauge: runTicketForm.endingGauge ? Number(runTicketForm.endingGauge) : undefined,
                      qualityNote: runTicketForm.qualityNote || undefined,
                      destinationStation: runTicketForm.destinationStation || undefined,
                      destinationMiles: runTicketForm.destinationMiles ? Number(runTicketForm.destinationMiles) : undefined,
                      nameOfCompany: runTicketForm.nameOfCompany || undefined,
                      rNumber: runTicketForm.rNumber || undefined,
                      driverOnTime: runTicketForm.driverOnTime || undefined,
                      driverOffTime: runTicketForm.driverOffTime || undefined,
                      sealOn: runTicketForm.sealOn || undefined,
                      sealOff: runTicketForm.sealOff || undefined,
                      waitTimeHours: runTicketForm.waitTimeHours ? Number(runTicketForm.waitTimeHours) : undefined,
                      waitNotes: runTicketForm.waitNotes || undefined,
                      productType: runTicketForm.productType,
                      destination: runTicketForm.destinationStation || runTicketForm.destination || undefined,
                      purchaserName: runTicketForm.purchaserName || undefined,
                      comment: runTicketForm.comment || undefined,
                    });
                  }}
                  className="h-9 px-4 text-xs rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                  <FileText className="w-3.5 h-3.5 mr-1.5" />{runTicketMut.isPending ? "Generating..." : "Generate Run Ticket"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
