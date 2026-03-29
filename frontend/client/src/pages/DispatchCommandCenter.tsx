/**
 * DISPATCH COMMAND CENTER — The Cockpit (Task 4.1.1)
 * ══════════════════════════════════════════════════════════════
 * Absorbs: DispatchBoard + DispatchDashboard + DispatchAssignedLoads + DispatchELDIntelligence
 *
 * Layout:
 *   Header — title, live badge, view toggle, search, refresh
 *   Status Tabs — Unassigned | Assigned | In Transit | Delivered | Exceptions (with counts)
 *   3-Column — Driver Roster | Kanban OR List | Activity Feed
 *   ELD Bar — all drivers' HOS remaining at a glance (color-coded)
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  RefreshCw, AlertTriangle, Wifi, WifiOff, LayoutDashboard,
  ChevronLeft, ChevronRight, ChevronDown, List, Columns3,
  Package, MapPin, Clock, Truck, User, Search, Eye,
  Activity, Moon, Coffee, Shield, Timer, Zap, Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useLocale } from "@/hooks/useLocale";
import { useDispatchBoard } from "@/hooks/useRealtimeEvents";

import DriverRoster, { type RosterDriver } from "@/components/dispatch/DriverRoster";
import KanbanBoard, { type KanbanLoad } from "@/components/dispatch/KanbanBoard";
import ActivityFeed, { type ActivityEvent } from "@/components/dispatch/ActivityFeed";
import QuickLoadDialog, { type QuickLoadData } from "@/components/dispatch/QuickLoadDialog";
import BroadcastDialog from "@/components/dispatch/BroadcastDialog";

type ViewMode = "kanban" | "list";
type StatusTab = "all" | "unassigned" | "assigned" | "in_transit" | "delivered" | "exceptions";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-slate-500/15", text: "text-slate-400", label: "Pending" },
  posted: { bg: "bg-violet-500/15", text: "text-violet-400", label: "Posted" },
  bidding: { bg: "bg-amber-500/15", text: "text-amber-400", label: "Bidding" },
  assigned: { bg: "bg-blue-500/15", text: "text-blue-400", label: "Assigned" },
  en_route_pickup: { bg: "bg-cyan-500/15", text: "text-cyan-400", label: "En Route" },
  at_pickup: { bg: "bg-cyan-500/15", text: "text-cyan-400", label: "At Pickup" },
  loading: { bg: "bg-teal-500/15", text: "text-teal-400", label: "Loading" },
  in_transit: { bg: "bg-green-500/15", text: "text-green-400", label: "In Transit" },
  at_delivery: { bg: "bg-orange-500/15", text: "text-orange-400", label: "At Delivery" },
  unloading: { bg: "bg-orange-500/15", text: "text-orange-400", label: "Unloading" },
  delivered: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "Delivered" },
  cancelled: { bg: "bg-red-500/15", text: "text-red-400", label: "Cancelled" },
};

const HOS_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  driving: { label: "Driving", color: "text-green-400", bg: "bg-green-500" },
  onDuty: { label: "On Duty", color: "text-blue-400", bg: "bg-blue-500" },
  on_duty: { label: "On Duty", color: "text-blue-400", bg: "bg-blue-500" },
  sleeperBerth: { label: "Sleeper", color: "text-purple-400", bg: "bg-purple-500" },
  sleeper: { label: "Sleeper", color: "text-purple-400", bg: "bg-purple-500" },
  offDuty: { label: "Off Duty", color: "text-slate-400", bg: "bg-slate-500" },
  off_duty: { label: "Off Duty", color: "text-slate-400", bg: "bg-slate-500" },
};

export default function DispatchCommandCenter() {
  const { t } = useLocale();
  const [, navigate] = useLocation();
  const [showQuickLoad, setShowQuickLoad] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [loadSearch, setLoadSearch] = useState("");
  const [showELDBar, setShowELDBar] = useState(true);
  const [showSmartAssign, setShowSmartAssign] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<any[]>([]);
  const [selectedAssignments, setSelectedAssignments] = useState<Map<number, number>>(new Map());
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState("");
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkStep, setBulkStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [bulkPreview, setBulkPreview] = useState<any>(null);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const bulkFileRef = useRef<HTMLInputElement>(null);

  // Bulk import mutations
  const bulkUploadMutation = (trpc as any).bulkImport?.uploadCSV?.useMutation?.() || { mutateAsync: async () => null, isPending: false };
  const bulkValidateMutation = (trpc as any).bulkImport?.validateImport?.useMutation?.() || { mutateAsync: async () => null, isPending: false };
  const bulkExecuteMutation = (trpc as any).bulkImport?.executeImport?.useMutation?.() || { mutateAsync: async () => null, isPending: false };

  const handleBulkFileSelect = async (file: File) => {
    setBulkFile(file);
    const text = await file.text();
    setBulkCsvText(text);
  };

  const handleBulkUpload = async () => {
    if (!bulkCsvText.trim()) { toast.error("Please upload a CSV file or paste CSV data"); return; }
    try {
      const result = await bulkUploadMutation.mutateAsync({ csvText: bulkCsvText, fileName: bulkFile?.name || "paste.csv" });
      if (result) {
        setBulkPreview(result);
        setBulkStep("preview");
        // Auto-validate
        const validation = await bulkValidateMutation.mutateAsync({ jobId: result.jobId });
        setBulkPreview((prev: any) => ({ ...prev, ...validation }));
      }
    } catch (e: any) { toast.error(e.message || "Upload failed"); }
  };

  const handleBulkExecute = async () => {
    if (!bulkPreview?.jobId) return;
    setBulkStep("importing");
    try {
      const result = await bulkExecuteMutation.mutateAsync({ jobId: bulkPreview.jobId });
      setBulkResult(result);
      setBulkStep("done");
      toast.success(`${result?.createdCount || 0} loads imported successfully!`);
      boardQuery.refetch();
    } catch (e: any) { toast.error(e.message || "Import failed"); setBulkStep("preview"); }
  };

  const resetBulkImport = () => {
    setShowBulkImport(false);
    setBulkStep("upload");
    setBulkCsvText("");
    setBulkFile(null);
    setBulkPreview(null);
    setBulkResult(null);
  };

  // ── Data Queries ──
  const boardQuery = (trpc as any).dispatch.getBoard.useQuery(
    { status: undefined },
    { refetchInterval: 15000 }
  );
  const driversQuery = (trpc as any).dispatch.getAvailableDrivers.useQuery(
    {},
    { refetchInterval: 20000 }
  );
  const statsQuery = (trpc as any).dispatch.getDashboardStats.useQuery(
    undefined,
    { refetchInterval: 30000 }
  );
  const issuesQuery = (trpc as any).dispatch.getActiveIssues.useQuery(
    undefined,
    { refetchInterval: 60000 }
  );
  // ELD Intelligence (absorbed from DispatchELDIntelligence)
  const eldDriversQuery = (trpc as any).eld?.getDriverStatus?.useQuery?.(
    { filter: undefined },
    { refetchInterval: 60000 }
  );
  const eldStatsQuery = (trpc as any).eld?.getStats?.useQuery?.(
    {},
    { refetchInterval: 60000 }
  );

  // ── WebSocket real-time dispatch events ──
  const companyId = (statsQuery.data as any)?.companyId || null;
  const { updates: wsUpdates, exceptions: wsExceptions } = useDispatchBoard(
    companyId ? String(companyId) : null
  );
  const wsUpdateCountRef = useRef(0);

  useEffect(() => {
    if (wsUpdates.length > wsUpdateCountRef.current) {
      wsUpdateCountRef.current = wsUpdates.length;
      boardQuery.refetch();
      driversQuery.refetch();
      statsQuery.refetch();
    }
  }, [wsUpdates.length]);

  // ── Mutations ──
  const assignMutation = (trpc as any).dispatch.assignDriver.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Driver assigned to ${data.loadNumber || "load"}`);
      boardQuery.refetch();
      driversQuery.refetch();
    },
    onError: (err: any) => toast.error("Assignment failed", { description: err.message }),
  });

  const moveLoadMutation = (trpc as any).dispatch.updateLoadStatus.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Load moved to ${data.status || "new status"}`);
      boardQuery.refetch();
      driversQuery.refetch();
    },
    onError: (err: any) => toast.error("Move failed", { description: err.message }),
  });

  // Smart Assign mutations (GAP-075)
  const smartAssignMutation = (trpc as any).dispatch.suggestAssignments.useMutation({
    onSuccess: (data: any) => {
      setSmartSuggestions(data || []);
      setSelectedAssignments(new Map());
      setShowSmartAssign(true);
      toast.success(`${(data || []).length} load(s) analyzed`);
    },
    onError: (err: any) => toast.error("Smart Assign failed", { description: err.message }),
  });

  const bulkAssignMutation = (trpc as any).dispatch.smartBulkAssign.useMutation({
    onSuccess: (data: any) => {
      toast.success(`${data.assigned} driver(s) assigned`);
      if (data.failed > 0) toast.error(`${data.failed} assignment(s) failed`);
      setShowSmartAssign(false);
      setSmartSuggestions([]);
      setSelectedAssignments(new Map());
      boardQuery.refetch();
      driversQuery.refetch();
    },
    onError: (err: any) => toast.error("Bulk assign failed", { description: err.message }),
  });

  const quickLoadMutation = (trpc as any).dispatch.quickCreateLoad.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Load ${data.loadNumber} created`);
      boardQuery.refetch();
    },
    onError: (err: any) => toast.error("Failed to create load", { description: err.message }),
  });

  // ── Transform Data ──
  const rosterDrivers: RosterDriver[] = useMemo(() => {
    const available = (driversQuery.data as any[]) || [];
    return available.map((d: any) => ({
      id: d.id,
      userId: d.userId,
      name: d.name || "Unknown",
      phone: d.phone || "",
      status: d.status || "available",
      hazmatEndorsement: d.hazmatEndorsement || false,
      tankerEndorsement: d.tankerEndorsement || false,
      twicCard: d.twicCard || false,
      equipmentTypes: d.equipmentTypes || [],
      hosRemaining: d.hosRemaining || null,
      safetyScore: d.safetyScore ?? null,
      completedLoads: d.completedLoads || 0,
      onTimeRate: d.onTimeRate ?? null,
      currentLoad: null,
      truck: d.truck || "",
    }));
  }, [driversQuery.data]);

  const allLoads: KanbanLoad[] = useMemo(() => {
    const boardData = boardQuery.data as any;
    if (!boardData?.loads) return [];
    return boardData.loads.map((l: any) => ({
      id: l.id,
      loadNumber: l.loadNumber || `LD-${l.id}`,
      status: l.status || "posted",
      origin: l.origin || "Unknown",
      destination: l.destination || "Unknown",
      pickupDate: l.pickupDate || undefined,
      deliveryDate: l.deliveryDate || undefined,
      driverId: l.driverId || null,
      driverName: l.driverName || null,
      rate: l.rate || 0,
      commodity: l.commodity || l.cargoType || "",
      cargoType: l.cargoType || "",
      hazmatClass: l.hazmatClass || null,
      weight: l.weight || 0,
      equipmentType: l.equipmentType || null,
    }));
  }, [boardQuery.data]);

  const handleSmartAssign = useCallback(() => {
    const unassignedIds = allLoads
      .filter(l => ["posted", "pending", "bidding"].includes(l.status))
      .map(l => Number(l.id))
      .filter(id => !isNaN(id));
    if (unassignedIds.length === 0) { toast.error("No unassigned loads"); return; }
    smartAssignMutation.mutate({ loadIds: unassignedIds.slice(0, 50) });
  }, [allLoads, smartAssignMutation]);

  const handleConfirmBulkAssign = useCallback(() => {
    const assignments = Array.from(selectedAssignments.entries()).map(([loadId, driverId]) => ({ loadId, driverId }));
    if (assignments.length === 0) { toast.error("Select at least one driver"); return; }
    bulkAssignMutation.mutate({ assignments });
  }, [selectedAssignments, bulkAssignMutation]);

  // ── Status Counts ──
  const statusCounts = useMemo(() => {
    const unassigned = allLoads.filter(l => ["posted", "pending", "bidding"].includes(l.status)).length;
    const assigned = allLoads.filter(l => l.status === "assigned").length;
    const inTransit = allLoads.filter(l => ["in_transit", "en_route_pickup", "at_pickup", "loading", "at_delivery", "unloading"].includes(l.status)).length;
    const delivered = allLoads.filter(l => l.status === "delivered").length;
    const exceptions = (issuesQuery.data as any[])?.length || 0;
    return { all: allLoads.length, unassigned, assigned, in_transit: inTransit, delivered, exceptions };
  }, [allLoads, issuesQuery.data]);

  // ── Filtered Loads (by tab + search) ──
  const filteredLoads = useMemo(() => {
    let result = allLoads;
    if (statusTab === "unassigned") result = result.filter(l => ["posted", "pending", "bidding"].includes(l.status));
    else if (statusTab === "assigned") result = result.filter(l => l.status === "assigned");
    else if (statusTab === "in_transit") result = result.filter(l => ["in_transit", "en_route_pickup", "at_pickup", "loading", "at_delivery", "unloading"].includes(l.status));
    else if (statusTab === "delivered") result = result.filter(l => l.status === "delivered");
    // "exceptions" and "all" show everything
    if (loadSearch) {
      const q = loadSearch.toLowerCase();
      result = result.filter(l =>
        [l.loadNumber, l.origin, l.destination, l.cargoType, l.driverName].filter(Boolean).join(" ").toLowerCase().includes(q)
      );
    }
    return result;
  }, [allLoads, statusTab, loadSearch]);

  // ── Activity Events ──
  const activityEvents: ActivityEvent[] = useMemo(() => {
    const events: ActivityEvent[] = [];
    const issues = (issuesQuery.data as any[]) || [];
    issues.forEach((issue: any, index: number) => {
      events.push({
        id: issue.id || `issue-${index}`,
        type: "exception",
        message: issue.description || "Issue reported",
        timestamp: issue.reportedAt || new Date().toISOString(),
        severity: issue.type === "breakdown" ? "critical" : "warning",
        loadNumber: issue.loadNumber,
        driverName: issue.driver,
      });
    });
    const boardData = boardQuery.data as any;
    if (boardData?.loads) {
      boardData.loads
        .filter((l: any) => ["delivered", "in_transit", "assigned"].includes(l.status))
        .slice(0, 10)
        .forEach((l: any) => {
          const typeMap: Record<string, ActivityEvent["type"]> = { delivered: "delivery", in_transit: "status", assigned: "assignment" };
          events.push({
            id: `load-event-${l.id}`,
            type: typeMap[l.status] || "status",
            message: l.status === "delivered" ? `${l.loadNumber} delivered to ${l.destination}` : l.status === "in_transit" ? `${l.loadNumber} in transit` : `${l.loadNumber} assigned`,
            timestamp: l.pickupDate || l.deliveryDate || new Date().toISOString(),
            loadNumber: l.loadNumber,
          });
        });
    }
    wsUpdates.slice(0, 10).forEach((ws: any) => {
      events.push({
        id: `ws-${ws.loadId || ""}-${ws.timestamp}`,
        type: ws.priority === "urgent" ? "exception" : "status",
        message: ws.message || `Dispatch update: ${ws.eventType}`,
        timestamp: ws.timestamp || new Date().toISOString(),
        severity: ws.priority === "urgent" ? "critical" : undefined,
        loadNumber: ws.loadNumber,
      });
    });
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 25);
  }, [issuesQuery.data, boardQuery.data, wsUpdates]);

  // ── ELD Drivers (absorbed from DispatchELDIntelligence) ──
  const eldDrivers: any[] = useMemo(() => {
    const raw = (eldDriversQuery?.data as any[]) || [];
    return [...raw].sort((a, b) => {
      if (a.hasViolation && !b.hasViolation) return -1;
      if (!a.hasViolation && b.hasViolation) return 1;
      return (a.hosRemaining ?? 11) - (b.hosRemaining ?? 11);
    });
  }, [eldDriversQuery?.data]);

  const stats = statsQuery.data as any;
  const exceptionCount = statusCounts.exceptions;

  // ── Handlers ──
  const handleAssignDriver = useCallback((loadId: string, driverId: string) => {
    assignMutation.mutate({ loadId, driverId });
  }, [assignMutation]);

  const LANE_TO_STATUS: Record<string, string> = { unassigned: "posted", assigned: "assigned", in_transit: "in_transit", delivered: "delivered" };

  const handleMoveLoad = useCallback((loadId: string, targetLane: string) => {
    const targetStatus = LANE_TO_STATUS[targetLane];
    if (!targetStatus) return;
    moveLoadMutation.mutate({ loadId, status: targetStatus });
  }, [moveLoadMutation]);

  const handleQuickLoadSubmit = useCallback((data: QuickLoadData) => {
    quickLoadMutation.mutate({
      originCity: data.originCity, originState: data.originState,
      destinationCity: data.destinationCity, destinationState: data.destinationState,
      cargoType: data.cargoType, rate: data.rate, trailerType: data.trailerType,
      pickupDate: data.pickupDate, specialInstructions: data.specialInstructions, hazmatClass: data.hazmatClass,
    });
    setShowQuickLoad(false);
  }, [quickLoadMutation]);

  const handleRefresh = () => {
    boardQuery.refetch(); driversQuery.refetch(); statsQuery.refetch(); issuesQuery.refetch();
    eldDriversQuery?.refetch?.(); eldStatsQuery?.refetch?.();
    toast.success("Refreshed");
  };

  const isLoading = boardQuery.isLoading || driversQuery.isLoading;
  const isConnected = !boardQuery.isError && !driversQuery.isError;

  // ── Status Tab Config ──
  const tabs: { key: StatusTab; label: string; count: number; color: string }[] = [
    { key: "all", label: "All", count: statusCounts.all, color: "text-slate-300" },
    { key: "unassigned", label: "Unassigned", count: statusCounts.unassigned, color: "text-red-400" },
    { key: "assigned", label: "Assigned", count: statusCounts.assigned, color: "text-blue-400" },
    { key: "in_transit", label: "In Transit", count: statusCounts.in_transit, color: "text-green-400" },
    { key: "delivered", label: "Delivered", count: statusCounts.delivered, color: "text-emerald-400" },
    { key: "exceptions", label: "Exceptions", count: statusCounts.exceptions, color: "text-red-400" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* ═══ TOP BAR ═══ */}
      <div className="shrink-0 px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-cyan-400" />
            {t('dispatchCommandCenter.title')}
          </h1>
          {isConnected ? (
            <Badge className="bg-green-500/20 text-green-400 border-0 text-xs gap-1"><Wifi className="w-3 h-3" />Live</Badge>
          ) : (
            <Badge className="bg-red-500/20 text-red-400 border-0 text-xs gap-1"><WifiOff className="w-3 h-3" />Offline</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search loads..."
              value={loadSearch}
              onChange={e => setLoadSearch(e.target.value)}
              className="h-7 w-44 pl-8 text-xs bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-500"
            />
          </div>
          {/* View Toggle */}
          <div className="flex items-center border border-white/[0.08] rounded-md overflow-hidden">
            <button onClick={() => setViewMode("kanban")} className={cn("px-2 py-1 text-xs font-medium transition-colors", viewMode === "kanban" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-500 hover:text-slate-300")}>
              <Columns3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode("list")} className={cn("px-2 py-1 text-xs font-medium transition-colors", viewMode === "list" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-500 hover:text-slate-300")}>
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Smart Assign */}
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border-[#1473FF]/30 hover:border-[#BE01FF]/40 text-white"
            onClick={handleSmartAssign}
            disabled={smartAssignMutation.isPending}
          >
            <Zap className={cn("w-3.5 h-3.5 mr-1 text-amber-400", smartAssignMutation.isPending && "animate-pulse")} />
            {smartAssignMutation.isPending ? "Analyzing..." : "Smart Assign"}
          </Button>
          {/* ELD Toggle */}
          <button onClick={() => setShowELDBar(!showELDBar)} className={cn("px-2 py-1 rounded text-xs font-medium border border-white/[0.08] transition-colors", showELDBar ? "bg-purple-500/20 text-purple-400" : "text-slate-500 hover:text-slate-300")} title="Toggle ELD bar">
            <Activity className="w-3.5 h-3.5" />
          </button>
          <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-400/50 text-emerald-400" onClick={() => setShowBulkImport(true)}>
            <Upload className="w-3.5 h-3.5 mr-1" />Bulk Import
          </Button>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.06]" onClick={handleRefresh}>
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1", isLoading && "animate-spin")} />Refresh
          </Button>
        </div>
      </div>

      {/* ═══ FMCSA SAFETY BANNERS ═══ */}
      {stats?.fmcsaSafety?.outOfService && (
        <div className="shrink-0 px-4 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-xs text-red-400 font-medium">FMCSA Alert: Carrier has active Out-of-Service order (DOT# {stats.fmcsaSafety.dotNumber}).{stats.fmcsaSafety.oosReason && ` Reason: ${stats.fmcsaSafety.oosReason}`}</span>
        </div>
      )}
      {stats?.fmcsaSafety?.basicAlerts > 0 && !stats?.fmcsaSafety?.outOfService && (
        <div className="shrink-0 px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <span className="text-xs text-yellow-400">
            {stats.fmcsaSafety.basicAlerts} FMCSA BASIC alert{stats.fmcsaSafety.basicAlerts > 1 ? "s" : ""}:
            {stats.fmcsaSafety.unsafeDrivingAlert && " Unsafe Driving"}{stats.fmcsaSafety.hosAlert && " HOS"}{stats.fmcsaSafety.vehicleMaintenanceAlert && " Vehicle Maint."}{stats.fmcsaSafety.crashIndicatorAlert && " Crash"}
          </span>
        </div>
      )}

      {/* ═══ STATUS FILTER TABS ═══ */}
      <div className="shrink-0 flex items-center gap-1 px-4 py-1.5 border-b border-white/[0.06] bg-slate-900/30 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setStatusTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap",
              statusTab === t.key ? "bg-white/[0.08] text-white" : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
            )}
          >
            {t.label}
            <span className={cn("text-xs font-bold tabular-nums", statusTab === t.key ? t.color : "text-slate-600")}>
              {t.count}
            </span>
            {t.key === "exceptions" && t.count > 0 && (
              <AlertTriangle className="w-3 h-3 text-red-400 animate-pulse" />
            )}
          </button>
        ))}

        {/* Inline stats */}
        <div className="ml-auto hidden lg:flex items-center gap-3 text-xs">
          <span className="text-slate-500">Drivers: <span className="text-green-400 font-semibold">{stats?.availableDrivers || 0}</span>/<span className="text-slate-400">{stats?.totalDrivers || 0}</span></span>
        </div>
      </div>

      {/* ═══ 3-COLUMN MAIN AREA ═══ */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* LEFT: Driver Roster */}
        <div className={cn("shrink-0 border-r border-white/[0.06] transition-all duration-300 relative", leftCollapsed ? "w-10" : "w-[260px]")}>
          <button onClick={() => setLeftCollapsed(!leftCollapsed)} className="absolute -right-3 top-4 z-10 w-6 h-6 rounded-full bg-slate-800 border border-white/[0.1] flex items-center justify-center hover:bg-slate-700 transition-colors">
            {leftCollapsed ? <ChevronRight className="w-3 h-3 text-slate-400" /> : <ChevronLeft className="w-3 h-3 text-slate-400" />}
          </button>
          {!leftCollapsed && (
            <DriverRoster drivers={rosterDrivers} loading={driversQuery.isLoading} onDriverSelect={(d) => setSelectedDriverId(d.id)} selectedDriverId={selectedDriverId} />
          )}
        </div>

        {/* CENTER: Kanban OR List */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {statusTab === "exceptions" ? (
            /* ── Exception Queue Panel ── */
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <h2 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" /> Exception Queue ({statusCounts.exceptions})
              </h2>
              {((issuesQuery.data as any[]) || []).length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-12">No active exceptions</div>
              ) : (
                ((issuesQuery.data as any[]) || []).map((issue: any, idx: number) => (
                  <div key={issue.id || idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-red-500/20 transition-colors cursor-pointer" onClick={() => issue.loadId && navigate(`/load/${issue.loadId}`)}>
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", issue.type === "breakdown" ? "bg-red-500/15" : "bg-amber-500/15")}>
                      <AlertTriangle className={cn("w-4 h-4", issue.type === "breakdown" ? "text-red-400" : "text-amber-400")} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{issue.loadNumber || `Issue #${issue.id}`}</span>
                        <Badge className={cn("text-xs border-0", issue.type === "breakdown" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400")}>{issue.type || "exception"}</Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{issue.description || "No details"}</p>
                      {issue.driver && <span className="text-xs text-slate-500 mt-1 flex items-center gap-1"><User className="w-3 h-3" />{issue.driver}</span>}
                    </div>
                    <span className="text-xs text-slate-600 shrink-0">{issue.reportedAt ? new Date(issue.reportedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                  </div>
                ))
              )}
            </div>
          ) : viewMode === "kanban" ? (
            /* ── Kanban View ── */
            <div className="flex-1 p-3 overflow-auto">
              <KanbanBoard
                loads={filteredLoads}
                loading={boardQuery.isLoading}
                onAssignDriver={handleAssignDriver}
                onMoveLoad={handleMoveLoad}
                onLoadClick={(load) => { if (load.id) navigate(`/load/${load.id}`); }}
                onCreateLoad={() => setShowQuickLoad(true)}
              />
            </div>
          ) : (
            /* ── List View (absorbed from DispatchAssignedLoads) ── */
            <div className="flex-1 overflow-y-auto">
              {boardQuery.isLoading ? (
                <div className="p-4 space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg bg-white/[0.04]" />)}</div>
              ) : filteredLoads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <Package className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-semibold">No loads found</p>
                  <p className="text-xs mt-1">{loadSearch ? "Try a different search" : "No loads match this filter"}</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.03]">
                  {filteredLoads.map((load) => {
                    const ss = STATUS_STYLES[load.status] || STATUS_STYLES.pending;
                    return (
                      <div key={load.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => navigate(`/load/${load.id}`)}>
                        <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{load.loadNumber}</span>
                            <Badge className={cn("text-xs border-0", ss.bg, ss.text)}>{ss.label}</Badge>
                            {load.hazmatClass && <Badge className="bg-red-500/15 text-red-400 border-0 text-xs">HM-{load.hazmatClass}</Badge>}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                            <MapPin className="w-3 h-3" />{load.origin} → {load.destination}
                            {load.driverName && <><span className="text-slate-600 mx-1">•</span><User className="w-3 h-3" />{load.driverName}</>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {(load.rate ?? 0) > 0 && <div className="text-xs font-semibold text-emerald-400">${Number(load.rate).toLocaleString()}</div>}
                          {load.pickupDate && <div className="text-xs text-slate-500 flex items-center gap-1 justify-end"><Clock className="w-3 h-3" />{new Date(load.pickupDate).toLocaleDateString()}</div>}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Activity Feed + Quick Actions */}
        <div className={cn("shrink-0 border-l border-white/[0.06] transition-all duration-300 relative", rightCollapsed ? "w-10" : "w-[240px]")}>
          <button onClick={() => setRightCollapsed(!rightCollapsed)} className="absolute -left-3 top-4 z-10 w-6 h-6 rounded-full bg-slate-800 border border-white/[0.1] flex items-center justify-center hover:bg-slate-700 transition-colors">
            {rightCollapsed ? <ChevronLeft className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
          </button>
          {!rightCollapsed && (
            <ActivityFeed
              events={activityEvents}
              loading={issuesQuery.isLoading}
              exceptionCount={exceptionCount}
              onQuickLoad={() => setShowQuickLoad(true)}
              onBroadcast={() => setShowBroadcast(true)}
              onViewSettlements={() => navigate("/settlements")}
              onViewCheckCalls={() => navigate("/dispatch/assigned")}
              onViewExceptions={() => setStatusTab("exceptions")}
            />
          )}
        </div>
      </div>

      {/* ═══ ELD STATUS BAR (absorbed from DispatchELDIntelligence) ═══ */}
      {showELDBar && (
        <div className="shrink-0 border-t border-white/[0.06] bg-slate-900/50">
          <div className="flex items-center gap-2 px-4 py-1.5 overflow-x-auto">
            <div className="flex items-center gap-1.5 shrink-0">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase">ELD</span>
            </div>
            <div className="w-px h-4 bg-white/[0.06] shrink-0" />
            {eldDrivers.length === 0 ? (
              <span className="text-xs text-slate-600">No ELD data — connect provider to see driver HOS</span>
            ) : (
              eldDrivers.slice(0, 20).map((d: any) => {
                const hos = d.hosRemaining ?? d.hoursRemaining ?? null;
                const hosConfig = HOS_STATUS_CONFIG[d.currentStatus || d.status || "offDuty"] || HOS_STATUS_CONFIG.offDuty;
                const isWarning = hos !== null && hos <= 3;
                const isCritical = hos !== null && hos <= 1;
                return (
                  <div
                    key={d.id || d.driverId}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs shrink-0 transition-colors",
                      isCritical ? "bg-red-500/10 border-red-500/20" : isWarning ? "bg-amber-500/10 border-amber-500/20" : "bg-white/[0.02] border-white/[0.04]"
                    )}
                    title={`${d.name}: ${hos !== null ? `${hos}h remaining` : hosConfig.label}`}
                  >
                    <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", hosConfig.bg)} />
                    <span className="font-medium text-slate-300 max-w-[60px] truncate">{(d.name || "").split(" ")[0]}</span>
                    {hos !== null ? (
                      <span className={cn("font-bold tabular-nums", isCritical ? "text-red-400" : isWarning ? "text-amber-400" : "text-green-400")}>
                        {hos.toFixed(1)}h
                      </span>
                    ) : (
                      <span className={cn("text-xs", hosConfig.color)}>{hosConfig.label}</span>
                    )}
                    {d.hasViolation && <AlertTriangle className="w-3 h-3 text-red-400 animate-pulse" />}
                  </div>
                );
              })
            )}
            {eldDrivers.length > 20 && (
              <span className="text-xs text-slate-500 shrink-0">+{eldDrivers.length - 20} more</span>
            )}
          </div>
        </div>
      )}

      {/* ═══ SMART ASSIGN PANEL (GAP-075) ═══ */}
      {showSmartAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/[0.08] rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-bold text-white">Smart Assign Suggestions</h2>
                <Badge className="bg-amber-500/20 text-amber-400 border-0 text-xs">{smartSuggestions.length} loads</Badge>
              </div>
              <div className="flex items-center gap-2">
                {selectedAssignments.size > 0 && (
                  <Button size="sm" className="h-7 px-3 text-xs bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0" onClick={handleConfirmBulkAssign} disabled={bulkAssignMutation.isPending}>
                    {bulkAssignMutation.isPending ? "Assigning..." : `Confirm ${selectedAssignments.size} Assignment${selectedAssignments.size > 1 ? "s" : ""}`}
                  </Button>
                )}
                <button onClick={() => setShowSmartAssign(false)} className="text-slate-500 hover:text-white transition-colors">
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Suggestions */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {smartSuggestions.length === 0 ? (
                <div className="text-center text-slate-500 py-12 text-sm">No suggestions available</div>
              ) : (
                smartSuggestions.map((loadSugg: any) => (
                  <div key={loadSugg.loadId} className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                    {/* Load Header */}
                    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04] bg-white/[0.01]">
                      <Package className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-white">{loadSugg.loadNumber}</span>
                      <span className="text-xs text-slate-500"><MapPin className="w-3 h-3 inline mr-0.5" />{loadSugg.origin} → {loadSugg.destination}</span>
                      {loadSugg.hazmatClass && <Badge className="bg-red-500/15 text-red-400 border-0 text-xs">HM-{loadSugg.hazmatClass}</Badge>}
                      <span className="text-xs text-slate-500 ml-auto"><Clock className="w-3 h-3 inline mr-0.5" />{loadSugg.estimatedTripHours}h trip</span>
                    </div>
                    {/* Driver Suggestions */}
                    <div className="divide-y divide-white/[0.03]">
                      {(loadSugg.suggestedDrivers || []).length === 0 ? (
                        <div className="px-4 py-3 text-xs text-slate-500">No eligible drivers found</div>
                      ) : (
                        (loadSugg.suggestedDrivers || []).map((ds: any, idx: number) => {
                          const isSelected = selectedAssignments.get(loadSugg.loadId) === ds.driverId;
                          return (
                            <div
                              key={ds.driverId}
                              className={cn(
                                "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors",
                                isSelected ? "bg-[#1473FF]/10 border-l-2 border-l-[#1473FF]" : "hover:bg-white/[0.02]"
                              )}
                              onClick={() => {
                                const next = new Map(selectedAssignments);
                                if (isSelected) next.delete(loadSugg.loadId);
                                else next.set(loadSugg.loadId, ds.driverId);
                                setSelectedAssignments(next);
                              }}
                            >
                              <div className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                                idx === 0 ? "bg-amber-500/20 text-amber-400" : idx === 1 ? "bg-slate-500/20 text-slate-300" : "bg-orange-500/20 text-orange-400"
                              )}>
                                #{idx + 1}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-white">{ds.driverName}</span>
                                  <div className="flex items-center gap-1">
                                    <div className={cn(
                                      "h-1.5 rounded-full",
                                      ds.score >= 70 ? "bg-green-500" : ds.score >= 50 ? "bg-amber-500" : "bg-red-500"
                                    )} style={{ width: `${ds.score}px` }} />
                                    <span className={cn("text-xs font-bold tabular-nums", ds.score >= 70 ? "text-green-400" : ds.score >= 50 ? "text-amber-400" : "text-red-400")}>{ds.score}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {ds.reasons.slice(0, 3).map((r: string, ri: number) => (
                                    <span key={ri} className="text-xs text-slate-500">{r}{ri < 2 && ri < ds.reasons.length - 1 ? " ·" : ""}</span>
                                  ))}
                                </div>
                              </div>
                              <div className="text-right shrink-0 space-y-0.5">
                                <div className="text-xs text-slate-400">{ds.distanceMiles} mi deadhead</div>
                                <div className="text-xs text-slate-500">${ds.estimatedCost} est.</div>
                              </div>
                              <div className={cn(
                                "w-5 h-5 rounded-full border flex items-center justify-center shrink-0",
                                isSelected ? "bg-[#1473FF] border-[#1473FF]" : "border-white/[0.15]"
                              )}>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ DIALOGS ═══ */}
      <QuickLoadDialog open={showQuickLoad} onClose={() => setShowQuickLoad(false)} onSubmit={handleQuickLoadSubmit} />
      <BroadcastDialog open={showBroadcast} onClose={() => setShowBroadcast(false)} />

      {/* ═══ BULK IMPORT MODAL ═══ */}
      {showBulkImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/15"><FileSpreadsheet className="w-5 h-5 text-emerald-400" /></div>
                <div>
                  <h2 className="text-lg font-bold text-white">Bulk Import Loads</h2>
                  <p className="text-xs text-slate-400">Upload a CSV or spreadsheet to import multiple loads at once</p>
                </div>
              </div>
              <button onClick={resetBulkImport} className="p-1 rounded hover:bg-white/10"><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="p-6">
              {/* STEP: UPLOAD */}
              {bulkStep === "upload" && (
                <div className="space-y-4">
                  {/* Drag & Drop Zone */}
                  <div
                    className="border-2 border-dashed border-white/15 rounded-xl p-8 text-center hover:border-emerald-500/40 transition-colors cursor-pointer"
                    onClick={() => bulkFileRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("border-emerald-500/60"); }}
                    onDragLeave={e => { e.currentTarget.classList.remove("border-emerald-500/60"); }}
                    onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove("border-emerald-500/60"); const f = e.dataTransfer.files[0]; if (f) handleBulkFileSelect(f); }}
                  >
                    <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                    <p className="text-sm text-white font-medium">{bulkFile ? bulkFile.name : "Drop CSV/XLSX file here or click to browse"}</p>
                    <p className="text-xs text-slate-500 mt-1">Supports .csv, .xlsx, .tsv — up to 5,000 rows</p>
                    <input ref={bulkFileRef} type="file" accept=".csv,.xlsx,.tsv,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleBulkFileSelect(f); }} />
                  </div>

                  {/* Or Paste */}
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1 block">Or paste CSV data directly:</label>
                    <textarea
                      className="w-full h-32 p-3 text-xs font-mono bg-slate-800 border border-white/10 rounded-lg text-white placeholder:text-slate-600 resize-none"
                      placeholder={`pickupLocation,deliveryLocation,pickupDate,deliveryDate,cargoType,weight,rate\n"Houston, TX","Dallas, TX",2026-04-01,2026-04-02,crude_oil,42000,4500\n"Midland, TX","Houston, TX",2026-04-01,2026-04-03,refined_products,38000,3800`}
                      value={bulkCsvText}
                      onChange={e => setBulkCsvText(e.target.value)}
                    />
                  </div>

                  {/* Template Download */}
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-slate-300">Need a template? Download our CSV template with all supported columns</span>
                    </div>
                    <Button size="sm" variant="outline" className="h-6 text-xs border-blue-500/30 text-blue-400" onClick={() => {
                      const headers = "pickupLocation,deliveryLocation,pickupDate,deliveryDate,cargoType,hazmatClass,weight,weightUnit,volume,volumeUnit,rate,currency,specialInstructions,commodityName,unNumber";
                      const example = '"Houston, TX","Dallas, TX",2026-04-01,2026-04-02,crude_oil,3,42000,lbs,200,bbl,4500,USD,Temperature sensitive,WTI Crude,UN1267';
                      const blob = new Blob([headers + "\n" + example], { type: "text/csv" });
                      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "load_import_template.csv"; a.click();
                    }}>Download Template</Button>
                  </div>

                  {/* Required Fields */}
                  <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                    <p className="text-xs font-semibold text-blue-400 mb-1">Required columns:</p>
                    <p className="text-xs text-slate-400">pickupLocation, deliveryLocation, pickupDate, deliveryDate, cargoType</p>
                    <p className="text-xs font-semibold text-blue-400 mt-2 mb-1">Optional columns:</p>
                    <p className="text-xs text-slate-400">weight, weightUnit, volume, volumeUnit, rate, currency, hazmatClass, unNumber, specialInstructions, commodityName</p>
                  </div>

                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleBulkUpload} disabled={!bulkCsvText.trim() || bulkUploadMutation.isPending || bulkValidateMutation.isPending}>
                    {bulkUploadMutation.isPending || bulkValidateMutation.isPending ? "Processing..." : "Upload & Validate"}
                  </Button>
                </div>
              )}

              {/* STEP: PREVIEW & VALIDATE */}
              {bulkStep === "preview" && bulkPreview && (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-800 rounded-lg text-center">
                      <p className="text-2xl font-bold text-white">{bulkPreview.totalRows || 0}</p>
                      <p className="text-xs text-slate-400">Total Rows</p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-lg text-center">
                      <p className="text-2xl font-bold text-emerald-400">{bulkPreview.validRows || 0}</p>
                      <p className="text-xs text-slate-400">Valid</p>
                    </div>
                    <div className="p-3 bg-red-500/10 rounded-lg text-center">
                      <p className="text-2xl font-bold text-red-400">{bulkPreview.invalidRows || 0}</p>
                      <p className="text-xs text-slate-400">Invalid</p>
                    </div>
                  </div>

                  {/* AI Mapping Info */}
                  {bulkPreview.aiMapping && (
                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-3.5 h-3.5 text-purple-400" />
                        <p className="text-xs font-semibold text-purple-400">AI Column Mapping ({bulkPreview.aiMapping.confidence}% confidence)</p>
                      </div>
                      <p className="text-xs text-slate-400">{bulkPreview.aiMapping.notes}</p>
                    </div>
                  )}

                  {/* Error Details */}
                  {bulkPreview.invalidRows > 0 && bulkPreview.errors && (
                    <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg max-h-32 overflow-y-auto">
                      <p className="text-xs font-semibold text-red-400 mb-2">Validation Errors:</p>
                      {Object.entries(bulkPreview.errors || {}).slice(0, 10).map(([row, errs]: [string, any]) => (
                        <p key={row} className="text-xs text-slate-400 mb-1">
                          <span className="text-red-400">Row {row}:</span> {Array.isArray(errs) ? errs.join(", ") : String(errs)}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 text-xs" onClick={() => setBulkStep("upload")}>Back</Button>
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs" onClick={handleBulkExecute} disabled={!bulkPreview.validRows || bulkExecuteMutation.isPending}>
                      {bulkExecuteMutation.isPending ? "Importing..." : `Import ${bulkPreview.validRows} Loads`}
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP: IMPORTING */}
              {bulkStep === "importing" && (
                <div className="text-center py-8">
                  <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mx-auto mb-4" />
                  <p className="text-sm text-white font-medium">Importing loads into dispatch board...</p>
                  <p className="text-xs text-slate-400 mt-1">This may take a moment for large files</p>
                </div>
              )}

              {/* STEP: DONE */}
              {bulkStep === "done" && bulkResult && (
                <div className="text-center py-6 space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <div>
                    <p className="text-lg font-bold text-white">{bulkResult.createdCount} Loads Imported</p>
                    {bulkResult.failedCount > 0 && <p className="text-xs text-red-400 mt-1">{bulkResult.failedCount} failed — check errors for details</p>}
                  </div>
                  <p className="text-xs text-slate-400">Loads are now visible on your Kanban board under "Unassigned"</p>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 text-xs" onClick={() => { resetBulkImport(); }}>Close</Button>
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs" onClick={() => { resetBulkImport(); }}>
                      <Upload className="w-3.5 h-3.5 mr-1" />Import More
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
