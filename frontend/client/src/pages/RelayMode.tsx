/**
 * RELAY MODE — Multi-Driver Load Handoff (GAP-128)
 * 100% Dynamic - No mock data
 * Uses: relay.getStats, relay.getLegs, relay.createPlan, relay.assignDriver,
 *       relay.updateLegStatus, relay.confirmHandoff, relay.getMyLegs
 * UI Style: Gradient headers, stat cards with icons, rounded cards, tabbed interface
 */

import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  ArrowRightLeft, Truck, MapPin, Clock, Plus, CheckCircle, XCircle,
  ChevronDown, ChevronUp, RefreshCw, User, Route, Shield, DollarSign,
  Milestone, ArrowRight, Package, Lock, Unlock, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

export default function RelayMode() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState("overview");
  const [lookupLoadId, setLookupLoadId] = useState("");
  const [viewLoadId, setViewLoadId] = useState<number | null>(null);
  const [expandedLeg, setExpandedLeg] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // ── New Relay Plan State ──
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [planLoadId, setPlanLoadId] = useState("");
  const [newLegs, setNewLegs] = useState([
    { originFacility: "", originCity: "", originState: "", destFacility: "", destCity: "", destState: "", handoffType: "drop_and_hook" as const, legDistance: "", legRate: "", sealNumber: "", notes: "" },
    { originFacility: "", originCity: "", originState: "", destFacility: "", destCity: "", destState: "", handoffType: "drop_and_hook" as const, legDistance: "", legRate: "", sealNumber: "", notes: "" },
  ]);

  // ── Assign Driver State ──
  const [assignLegId, setAssignLegId] = useState<number | null>(null);
  const [assignDriverId, setAssignDriverId] = useState("");

  // ── Data Queries ──
  const statsQuery = (trpc as any).relay?.getStats?.useQuery?.() || { data: null, isLoading: false };
  const legsQuery = (trpc as any).relay?.getLegs?.useQuery?.(
    { loadId: viewLoadId! },
    { enabled: !!viewLoadId }
  ) || { data: [], isLoading: false };
  const myLegsQuery = (trpc as any).relay?.getMyLegs?.useQuery?.(
    statusFilter === "all" ? {} : { status: statusFilter }
  ) || { data: [], isLoading: false };

  // ── Mutations ──
  const createPlanMutation = (trpc as any).relay?.createPlan?.useMutation?.({
    onSuccess: (result: any) => {
      toast.success(`Relay plan created with ${result.legCount} legs`);
      setShowNewPlan(false);
      setViewLoadId(result.loadId);
      setActiveTab("load-view");
      statsQuery.refetch?.();
      legsQuery.refetch?.();
    },
    onError: (e: any) => toast.error("Failed to create relay plan", { description: e.message }),
  }) || { mutate: () => {}, isPending: false };

  const assignDriverMutation = (trpc as any).relay?.assignDriver?.useMutation?.({
    onSuccess: () => {
      toast.success("Driver assigned to leg");
      setAssignLegId(null);
      setAssignDriverId("");
      legsQuery.refetch?.();
    },
    onError: (e: any) => toast.error("Failed to assign driver", { description: e.message }),
  }) || { mutate: () => {}, isPending: false };

  const updateStatusMutation = (trpc as any).relay?.updateLegStatus?.useMutation?.({
    onSuccess: (_: any, vars: any) => {
      toast.success(`Leg status updated to ${vars.status}`);
      legsQuery.refetch?.();
      myLegsQuery.refetch?.();
      statsQuery.refetch?.();
    },
    onError: (e: any) => toast.error("Status update failed", { description: e.message }),
  }) || { mutate: () => {}, isPending: false };

  const confirmHandoffMutation = (trpc as any).relay?.confirmHandoff?.useMutation?.({
    onSuccess: () => {
      toast.success("Handoff confirmed — leg now en route");
      legsQuery.refetch?.();
      myLegsQuery.refetch?.();
      statsQuery.refetch?.();
    },
    onError: (e: any) => toast.error("Handoff failed", { description: e.message }),
  }) || { mutate: () => {}, isPending: false };

  const stats = statsQuery.data || { totalRelays: 0, activeLegs: 0, completedLegs: 0, pendingHandoffs: 0, totalDistance: 0, totalRevenue: 0 };

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");

  const addLeg = () => {
    setNewLegs(prev => [...prev, { originFacility: "", originCity: "", originState: "", destFacility: "", destCity: "", destState: "", handoffType: "drop_and_hook" as const, legDistance: "", legRate: "", sealNumber: "", notes: "" }]);
  };

  const removeLeg = (idx: number) => {
    if (newLegs.length <= 2) { toast.error("Minimum 2 legs required"); return; }
    setNewLegs(prev => prev.filter((_, i) => i !== idx));
  };

  const updateLeg = (idx: number, field: string, value: string) => {
    setNewLegs(prev => prev.map((leg, i) => i === idx ? { ...leg, [field]: value } : leg));
  };

  const handleCreatePlan = useCallback(() => {
    if (!planLoadId) { toast.error("Load ID is required"); return; }
    createPlanMutation.mutate({
      loadId: parseInt(planLoadId),
      legs: newLegs.map(l => ({
        originFacility: l.originFacility || undefined,
        originCity: l.originCity || undefined,
        originState: l.originState || undefined,
        destFacility: l.destFacility || undefined,
        destCity: l.destCity || undefined,
        destState: l.destState || undefined,
        handoffType: l.handoffType,
        legDistance: l.legDistance ? parseFloat(l.legDistance) : undefined,
        legRate: l.legRate ? parseFloat(l.legRate) : undefined,
        sealNumber: l.sealNumber || undefined,
        notes: l.notes || undefined,
      })),
    });
  }, [planLoadId, newLegs, createPlanMutation]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      planned: { bg: "bg-slate-500/20", text: "text-slate-400", icon: <Clock className="w-3 h-3 mr-1" /> },
      driver_assigned: { bg: "bg-blue-500/20", text: "text-blue-400", icon: <User className="w-3 h-3 mr-1" /> },
      en_route: { bg: "bg-cyan-500/20", text: "text-cyan-400", icon: <Truck className="w-3 h-3 mr-1" /> },
      at_handoff: { bg: "bg-yellow-500/20", text: "text-yellow-400", icon: <ArrowRightLeft className="w-3 h-3 mr-1" /> },
      handed_off: { bg: "bg-purple-500/20", text: "text-purple-400", icon: <CheckCircle className="w-3 h-3 mr-1" /> },
      completed: { bg: "bg-green-500/20", text: "text-green-400", icon: <CheckCircle className="w-3 h-3 mr-1" /> },
      cancelled: { bg: "bg-red-500/20", text: "text-red-400", icon: <XCircle className="w-3 h-3 mr-1" /> },
    };
    const s = map[status] || map.planned;
    return <Badge className={cn(s.bg, s.text, "border-0 capitalize")}>{s.icon}{status.replace(/_/g, " ")}</Badge>;
  };

  const getHandoffLabel = (type: string) => {
    const labels: Record<string, string> = {
      drop_and_hook: "Drop & Hook",
      live_transfer: "Live Transfer",
      yard_relay: "Yard Relay",
      terminal_swap: "Terminal Swap",
    };
    return labels[type] || type;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Relay Mode
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            GAP-128 — Multi-driver load handoff, relay leg management, and seal chain-of-custody
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className={cn("rounded-lg", isLight ? "border-slate-200" : "bg-slate-700/50 border-slate-600/50")}
            onClick={() => { statsQuery.refetch?.(); legsQuery.refetch?.(); myLegsQuery.refetch?.(); }}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-lg"
            onClick={() => { setShowNewPlan(true); setActiveTab("create"); }}>
            <Plus className="w-4 h-4 mr-1" />New Relay Plan
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      {statsQuery.isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { icon: <Route className="w-5 h-5 text-blue-400" />, bg: "bg-blue-500/15", value: String(stats.totalRelays), label: "Relay Loads", color: "text-blue-400" },
            { icon: <Truck className="w-5 h-5 text-cyan-400" />, bg: "bg-cyan-500/15", value: String(stats.activeLegs), label: "Active Legs", color: "text-cyan-400" },
            { icon: <CheckCircle className="w-5 h-5 text-green-400" />, bg: "bg-green-500/15", value: String(stats.completedLegs), label: "Completed", color: "text-green-400" },
            { icon: <ArrowRightLeft className="w-5 h-5 text-yellow-400" />, bg: "bg-yellow-500/15", value: String(stats.pendingHandoffs), label: "Pending Handoffs", color: "text-yellow-400" },
            { icon: <Milestone className="w-5 h-5 text-purple-400" />, bg: "bg-purple-500/15", value: `${stats.totalDistance.toLocaleString()} mi`, label: "Total Distance", color: "text-purple-400" },
            { icon: <DollarSign className="w-5 h-5 text-emerald-400" />, bg: "bg-emerald-500/15", value: `$${stats.totalRevenue.toLocaleString()}`, label: "Total Revenue", color: "text-emerald-400" },
          ].map(s => (
            <Card key={s.label} className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-lg", s.bg)}>{s.icon}</div>
                  <div>
                    <p className={cn("text-lg font-bold tabular-nums", s.color)}>{s.value}</p>
                    <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview"><TrendingUp className="w-4 h-4 mr-1.5" />Overview</TabsTrigger>
          <TabsTrigger value="load-view"><Route className="w-4 h-4 mr-1.5" />Load Relay</TabsTrigger>
          <TabsTrigger value="my-legs"><Truck className="w-4 h-4 mr-1.5" />My Legs</TabsTrigger>
          <TabsTrigger value="create"><Plus className="w-4 h-4 mr-1.5" />Create Plan</TabsTrigger>
        </TabsList>

        {/* ═══ OVERVIEW TAB ═══ */}
        <TabsContent value="overview">
          <Card className={cc}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Route className="w-5 h-5 text-blue-400" />Relay Load Lookup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-6">
                <Input placeholder="Enter Load ID to view relay legs..." value={lookupLoadId}
                  onChange={e => setLookupLoadId(e.target.value)} className="rounded-lg max-w-xs" />
                <Button size="sm" className="rounded-lg" onClick={() => {
                  if (!lookupLoadId) return;
                  setViewLoadId(parseInt(lookupLoadId));
                  setActiveTab("load-view");
                }}>View Relay</Button>
              </div>
              <div className="text-center py-10">
                <div className={cn("w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
                  <ArrowRightLeft className="w-8 h-8 text-slate-400" />
                </div>
                <p className={cn("font-semibold text-lg mb-1", isLight ? "text-slate-700" : "text-slate-200")}>Multi-Driver Load Handoff</p>
                <p className={cn("text-sm max-w-md mx-auto", isLight ? "text-slate-500" : "text-slate-400")}>
                  Relay mode splits long-haul loads into sequential legs, each handled by a different driver.
                  Handoffs occur at relay points with seal verification for chain-of-custody.
                </p>
                <div className="flex items-center justify-center gap-3 mt-6">
                  {["Leg 1", "Handoff", "Leg 2", "Handoff", "Leg 3"].map((step, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <ArrowRight className="w-4 h-4 text-slate-500" />}
                      <div className={cn("px-3 py-1.5 rounded-lg text-xs font-medium",
                        step === "Handoff" ? (isLight ? "bg-yellow-100 text-yellow-700" : "bg-yellow-500/15 text-yellow-400")
                          : (isLight ? "bg-blue-100 text-blue-700" : "bg-blue-500/15 text-blue-400")
                      )}>{step}</div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ LOAD RELAY VIEW TAB ═══ */}
        <TabsContent value="load-view">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Input placeholder="Load ID" value={lookupLoadId} onChange={e => setLookupLoadId(e.target.value)} className="rounded-lg max-w-[180px]" />
              <Button size="sm" className="rounded-lg" onClick={() => { if (lookupLoadId) setViewLoadId(parseInt(lookupLoadId)); }}>
                Load
              </Button>
              {viewLoadId && <Badge className="bg-blue-500/20 text-blue-400 border-0">Load #{viewLoadId}</Badge>}
            </div>

            {!viewLoadId ? (
              <Card className={cc}>
                <CardContent className="py-16 text-center">
                  <Route className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>Enter a Load ID to view its relay legs</p>
                </CardContent>
              </Card>
            ) : legsQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
            ) : !legsQuery.data?.length ? (
              <Card className={cc}>
                <CardContent className="py-16 text-center">
                  <Route className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className={cn("font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No Relay Legs</p>
                  <p className={cn("text-sm mt-1", isLight ? "text-slate-400" : "text-slate-500")}>This load doesn't have a relay plan yet</p>
                  <Button size="sm" className="mt-4 rounded-lg" onClick={() => { setPlanLoadId(String(viewLoadId)); setActiveTab("create"); setShowNewPlan(true); }}>
                    <Plus className="w-4 h-4 mr-1" />Create Relay Plan
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {/* Visual pipeline */}
                <Card className={cc}>
                  <CardContent className="p-4">
                    <div className="flex items-center overflow-x-auto gap-1 py-2">
                      {(legsQuery.data as any[]).map((leg: any, idx: number) => (
                        <React.Fragment key={leg.id}>
                          {idx > 0 && (
                            <div className="flex flex-col items-center mx-1 shrink-0">
                              <ArrowRightLeft className={cn("w-5 h-5", leg.status === "handed_off" || leg.status === "completed" ? "text-green-400" : "text-yellow-400")} />
                              <span className="text-xs text-slate-500 mt-0.5">{getHandoffLabel(leg.handoffType || "drop_and_hook")}</span>
                            </div>
                          )}
                          <div className={cn("flex flex-col items-center px-3 py-2 rounded-xl border min-w-[120px] shrink-0 cursor-pointer transition-colors",
                            leg.status === "completed" || leg.status === "handed_off" ? (isLight ? "bg-green-50 border-green-200" : "bg-green-500/5 border-green-500/30") :
                            leg.status === "en_route" ? (isLight ? "bg-cyan-50 border-cyan-200" : "bg-cyan-500/5 border-cyan-500/30") :
                            leg.status === "at_handoff" ? (isLight ? "bg-yellow-50 border-yellow-200" : "bg-yellow-500/5 border-yellow-500/30") :
                            (isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/30")
                          )} onClick={() => setExpandedLeg(expandedLeg === leg.id ? null : leg.id)}>
                            <span className={cn("text-xs font-bold", isLight ? "text-slate-700" : "text-slate-200")}>Leg {leg.legNumber}</span>
                            {getStatusBadge(leg.status)}
                            <span className="text-xs text-slate-500 mt-1">{leg.driverName || "Unassigned"}</span>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Leg detail cards */}
                {(legsQuery.data as any[]).map((leg: any) => (
                  <Card key={leg.id} className={cn(cc, "transition-colors", expandedLeg === leg.id && (isLight ? "ring-2 ring-blue-200" : "ring-2 ring-blue-500/30"))}>
                    <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedLeg(expandedLeg === leg.id ? null : leg.id)}>
                      <div className="flex items-center gap-4">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
                          leg.status === "completed" ? "bg-green-500/20 text-green-400" :
                          leg.status === "en_route" ? "bg-cyan-500/20 text-cyan-400" :
                          "bg-slate-500/20 text-slate-400"
                        )}>{leg.legNumber}</div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn("font-bold", isLight ? "text-slate-800" : "text-white")}>Leg {leg.legNumber}</span>
                            {getStatusBadge(leg.status)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <MapPin className="w-3 h-3" />
                            <span>{leg.originCity || leg.originFacility || "Origin"}{leg.originState ? `, ${leg.originState}` : ""}</span>
                            <ArrowRight className="w-3 h-3" />
                            <span>{leg.destCity || leg.destFacility || "Destination"}{leg.destState ? `, ${leg.destState}` : ""}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          {leg.driverName ? (
                            <p className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-200")}>{leg.driverName}</p>
                          ) : (
                            <p className="text-sm text-slate-500 italic">No driver</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            {leg.legDistance && <span>{leg.legDistance} mi</span>}
                            {leg.legRate && <span className="text-emerald-400">${leg.legRate}</span>}
                          </div>
                        </div>
                        {expandedLeg === leg.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expanded Detail */}
                    {expandedLeg === leg.id && (
                      <div className={cn("px-4 pb-4 pt-0 border-t", isLight ? "border-slate-100 bg-slate-50/50" : "border-slate-700/30 bg-slate-800/30")}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3">
                          <div>
                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Origin</p>
                            <p className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-200")}>
                              {leg.originFacility || "—"}
                            </p>
                            <p className="text-xs text-slate-500">{[leg.originCity, leg.originState].filter(Boolean).join(", ") || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Destination</p>
                            <p className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-200")}>
                              {leg.destFacility || "—"}
                            </p>
                            <p className="text-xs text-slate-500">{[leg.destCity, leg.destState].filter(Boolean).join(", ") || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Handoff Type</p>
                            <p className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-200")}>{getHandoffLabel(leg.handoffType || "drop_and_hook")}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Seal</p>
                            <div className="flex items-center gap-1">
                              {leg.sealVerified ? <Lock className="w-3.5 h-3.5 text-green-400" /> : <Unlock className="w-3.5 h-3.5 text-slate-400" />}
                              <p className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-200")}>{leg.sealNumber || "No seal"}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Planned Start</p>
                            <p className={cn("text-sm", isLight ? "text-slate-700" : "text-slate-200")}>
                              {leg.plannedStartAt ? new Date(leg.plannedStartAt).toLocaleString() : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Planned End</p>
                            <p className={cn("text-sm", isLight ? "text-slate-700" : "text-slate-200")}>
                              {leg.plannedEndAt ? new Date(leg.plannedEndAt).toLocaleString() : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Actual Start</p>
                            <p className={cn("text-sm", isLight ? "text-slate-700" : "text-slate-200")}>
                              {leg.actualStartAt ? new Date(leg.actualStartAt).toLocaleString() : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Actual End</p>
                            <p className={cn("text-sm", isLight ? "text-slate-700" : "text-slate-200")}>
                              {leg.actualEndAt ? new Date(leg.actualEndAt).toLocaleString() : "—"}
                            </p>
                          </div>
                        </div>
                        {leg.notes && <p className={cn("text-sm mb-3 p-2 rounded-lg", isLight ? "bg-slate-100 text-slate-600" : "bg-slate-700/30 text-slate-300")}>{leg.notes}</p>}
                        {leg.handoffNotes && <p className={cn("text-sm mb-3 p-2 rounded-lg", isLight ? "bg-yellow-50 text-yellow-700" : "bg-yellow-500/10 text-yellow-300")}>Handoff: {leg.handoffNotes}</p>}

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          {/* Assign driver */}
                          {leg.status === "planned" && (
                            assignLegId === leg.id ? (
                              <div className="flex items-center gap-2">
                                <Input placeholder="Driver ID" value={assignDriverId} onChange={e => setAssignDriverId(e.target.value)} className="w-28 rounded-lg h-8 text-sm" />
                                <Button size="sm" className="rounded-lg h-8 text-xs bg-blue-600" disabled={assignDriverMutation.isPending}
                                  onClick={() => { if (assignDriverId) assignDriverMutation.mutate({ legId: leg.id, driverId: parseInt(assignDriverId) }); }}>
                                  Assign
                                </Button>
                                <Button size="sm" variant="ghost" className="rounded-lg h-8 text-xs" onClick={() => setAssignLegId(null)}>Cancel</Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setAssignLegId(leg.id)}>
                                <User className="w-3.5 h-3.5 mr-1" />Assign Driver
                              </Button>
                            )
                          )}
                          {/* Start leg */}
                          {leg.status === "driver_assigned" && (
                            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg" disabled={updateStatusMutation.isPending}
                              onClick={() => updateStatusMutation.mutate({ legId: leg.id, status: "en_route" })}>
                              <Truck className="w-3.5 h-3.5 mr-1" />Start Leg
                            </Button>
                          )}
                          {/* Arrive at handoff */}
                          {leg.status === "en_route" && (
                            <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg" disabled={updateStatusMutation.isPending}
                              onClick={() => updateStatusMutation.mutate({ legId: leg.id, status: "at_handoff" })}>
                              <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />At Handoff
                            </Button>
                          )}
                          {/* Complete leg (last leg) */}
                          {(leg.status === "en_route" || leg.status === "at_handoff") && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-lg" disabled={updateStatusMutation.isPending}
                              onClick={() => updateStatusMutation.mutate({ legId: leg.id, status: "completed" })}>
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />Complete
                            </Button>
                          )}
                          {/* Confirm handoff (next driver confirms receipt) */}
                          {leg.status === "driver_assigned" && leg.legNumber > 1 && (
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg" disabled={confirmHandoffMutation.isPending}
                              onClick={() => confirmHandoffMutation.mutate({ legId: leg.id, sealVerified: true })}>
                              <Shield className="w-3.5 h-3.5 mr-1" />Confirm Handoff
                            </Button>
                          )}
                          {/* Cancel */}
                          {(leg.status === "planned" || leg.status === "driver_assigned") && (
                            <Button size="sm" variant="destructive" className="rounded-lg" disabled={updateStatusMutation.isPending}
                              onClick={() => updateStatusMutation.mutate({ legId: leg.id, status: "cancelled" })}>
                              <XCircle className="w-3.5 h-3.5 mr-1" />Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ═══ MY LEGS TAB ═══ */}
        <TabsContent value="my-legs">
          <div className="space-y-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={cn("w-[170px] rounded-lg", isLight ? "border-slate-200" : "bg-slate-700/50 border-slate-600/50")}>
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="driver_assigned">Assigned</SelectItem>
                <SelectItem value="en_route">En Route</SelectItem>
                <SelectItem value="at_handoff">At Handoff</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Card className={cc}>
              <CardHeader className="pb-3">
                <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                  <Truck className="w-5 h-5 text-cyan-400" />My Assigned Relay Legs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {myLegsQuery.isLoading ? (
                  <div className="p-4 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
                ) : !(myLegsQuery.data as any[])?.length ? (
                  <div className="text-center py-16">
                    <Truck className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className={cn("font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No Relay Legs Assigned</p>
                    <p className={cn("text-sm mt-1", isLight ? "text-slate-400" : "text-slate-500")}>You'll see your relay assignments here</p>
                  </div>
                ) : (
                  <div className={cn("divide-y", isLight ? "divide-slate-100" : "divide-slate-700/50")}>
                    {(myLegsQuery.data as any[]).map((leg: any) => (
                      <div key={leg.id} className={cn("p-4 flex items-center justify-between", isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/20")}>
                        <div className="flex items-center gap-4">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
                            leg.status === "en_route" ? "bg-cyan-500/20 text-cyan-400" :
                            leg.status === "completed" ? "bg-green-500/20 text-green-400" :
                            "bg-blue-500/20 text-blue-400"
                          )}>{leg.legNumber}</div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn("font-bold", isLight ? "text-slate-800" : "text-white")}>
                                Load #{leg.loadNumber || leg.loadId} — Leg {leg.legNumber}
                              </span>
                              {getStatusBadge(leg.status)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <MapPin className="w-3 h-3" />
                              <span>{leg.originCity || "Origin"}{leg.originState ? `, ${leg.originState}` : ""}</span>
                              <ArrowRight className="w-3 h-3" />
                              <span>{leg.destCity || "Dest"}{leg.destState ? `, ${leg.destState}` : ""}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            {leg.legDistance && <p className="text-sm text-slate-400">{leg.legDistance} mi</p>}
                            {leg.legRate && <p className="text-sm font-bold text-emerald-400">${leg.legRate}</p>}
                          </div>
                          {leg.status === "driver_assigned" && (
                            <Button size="sm" className="bg-cyan-600 text-white rounded-lg" disabled={updateStatusMutation.isPending}
                              onClick={() => updateStatusMutation.mutate({ legId: leg.id, status: "en_route" })}>
                              Start
                            </Button>
                          )}
                          {leg.status === "en_route" && (
                            <Button size="sm" className="bg-green-600 text-white rounded-lg" disabled={updateStatusMutation.isPending}
                              onClick={() => updateStatusMutation.mutate({ legId: leg.id, status: "completed" })}>
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ CREATE PLAN TAB ═══ */}
        <TabsContent value="create">
          <Card className={cn(cc, "border-2", isLight ? "border-blue-200" : "border-blue-500/30")}>
            <CardHeader>
              <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Plus className="w-5 h-5 text-blue-400" />Create Relay Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Load ID *</label>
                <Input placeholder="e.g. 42" value={planLoadId} onChange={e => setPlanLoadId(e.target.value)} className="rounded-lg max-w-[200px]" />
              </div>

              <div className="space-y-4">
                {newLegs.map((leg, idx) => (
                  <div key={idx} className={cn("p-4 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/20 border-slate-600/30")}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={cn("text-sm font-bold", isLight ? "text-slate-700" : "text-slate-200")}>Leg {idx + 1}</span>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-red-400" onClick={() => removeLeg(idx)}>Remove</Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs uppercase text-slate-500 mb-0.5 block">Origin Facility</label>
                        <Input value={leg.originFacility} onChange={e => updateLeg(idx, "originFacility", e.target.value)} className="rounded-lg h-8 text-sm" placeholder="Terminal name" />
                      </div>
                      <div>
                        <label className="text-xs uppercase text-slate-500 mb-0.5 block">Origin City</label>
                        <Input value={leg.originCity} onChange={e => updateLeg(idx, "originCity", e.target.value)} className="rounded-lg h-8 text-sm" placeholder="City" />
                      </div>
                      <div>
                        <label className="text-xs uppercase text-slate-500 mb-0.5 block">Origin State</label>
                        <Input value={leg.originState} onChange={e => updateLeg(idx, "originState", e.target.value)} className="rounded-lg h-8 text-sm" placeholder="TX" />
                      </div>
                      <div>
                        <label className="text-xs uppercase text-slate-500 mb-0.5 block">Dest Facility</label>
                        <Input value={leg.destFacility} onChange={e => updateLeg(idx, "destFacility", e.target.value)} className="rounded-lg h-8 text-sm" placeholder="Relay yard" />
                      </div>
                      <div>
                        <label className="text-xs uppercase text-slate-500 mb-0.5 block">Dest City</label>
                        <Input value={leg.destCity} onChange={e => updateLeg(idx, "destCity", e.target.value)} className="rounded-lg h-8 text-sm" placeholder="City" />
                      </div>
                      <div>
                        <label className="text-xs uppercase text-slate-500 mb-0.5 block">Dest State</label>
                        <Input value={leg.destState} onChange={e => updateLeg(idx, "destState", e.target.value)} className="rounded-lg h-8 text-sm" placeholder="OK" />
                      </div>
                      <div>
                        <label className="text-xs uppercase text-slate-500 mb-0.5 block">Handoff Type</label>
                        <Select value={leg.handoffType} onValueChange={v => updateLeg(idx, "handoffType", v)}>
                          <SelectTrigger className="rounded-lg h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="drop_and_hook">Drop & Hook</SelectItem>
                            <SelectItem value="live_transfer">Live Transfer</SelectItem>
                            <SelectItem value="yard_relay">Yard Relay</SelectItem>
                            <SelectItem value="terminal_swap">Terminal Swap</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs uppercase text-slate-500 mb-0.5 block">Distance (mi)</label>
                        <Input type="number" value={leg.legDistance} onChange={e => updateLeg(idx, "legDistance", e.target.value)} className="rounded-lg h-8 text-sm" placeholder="150" />
                      </div>
                      <div>
                        <label className="text-xs uppercase text-slate-500 mb-0.5 block">Leg Rate ($)</label>
                        <Input type="number" value={leg.legRate} onChange={e => updateLeg(idx, "legRate", e.target.value)} className="rounded-lg h-8 text-sm" placeholder="500" />
                      </div>
                      <div>
                        <label className="text-xs uppercase text-slate-500 mb-0.5 block">Seal #</label>
                        <Input value={leg.sealNumber} onChange={e => updateLeg(idx, "sealNumber", e.target.value)} className="rounded-lg h-8 text-sm" placeholder="SEAL-001" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" className="rounded-lg" onClick={addLeg}>
                  <Plus className="w-4 h-4 mr-1" />Add Leg
                </Button>
                <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-lg" onClick={handleCreatePlan} disabled={createPlanMutation.isPending}>
                  {createPlanMutation.isPending ? "Creating..." : `Create ${newLegs.length}-Leg Relay Plan`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
