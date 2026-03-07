/**
 * DISPATCH COMMAND CENTER — The dispatcher's single-screen nerve center
 * 3-column layout: Driver Roster | Kanban Board | Activity Feed + Quick Actions
 * Replaces the old DispatchDashboard as the dispatcher landing page
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  RefreshCw, AlertTriangle, Wifi, WifiOff,
  LayoutDashboard, ChevronLeft, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useDispatchBoard } from "@/hooks/useRealtimeEvents";

import DriverRoster, { type RosterDriver } from "@/components/dispatch/DriverRoster";
import KanbanBoard, { type KanbanLoad } from "@/components/dispatch/KanbanBoard";
import ActivityFeed, { type ActivityEvent } from "@/components/dispatch/ActivityFeed";
import QuickLoadDialog, { type QuickLoadData } from "@/components/dispatch/QuickLoadDialog";
import BroadcastDialog from "@/components/dispatch/BroadcastDialog";

export default function DispatchCommandCenter() {
  const [, navigate] = useLocation();
  const [showQuickLoad, setShowQuickLoad] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);

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

  // ── WebSocket real-time dispatch events ──
  const companyId = (statsQuery.data as any)?.companyId || null;
  const { updates: wsUpdates, exceptions: wsExceptions } = useDispatchBoard(
    companyId ? String(companyId) : null
  );
  const wsUpdateCountRef = useRef(0);

  // Auto-refetch queries when WS events arrive
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
    onError: (err: any) => {
      toast.error("Assignment failed", { description: err.message });
    },
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

  const kanbanLoads: KanbanLoad[] = useMemo(() => {
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

  const activityEvents: ActivityEvent[] = useMemo(() => {
    const events: ActivityEvent[] = [];
    const issues = (issuesQuery.data as any[]) || [];
    issues.forEach((issue: any) => {
      events.push({
        id: issue.id || `issue-${Math.random()}`,
        type: "exception",
        message: issue.description || "Issue reported",
        timestamp: issue.reportedAt || new Date().toISOString(),
        severity: issue.type === "breakdown" ? "critical" : "warning",
        loadNumber: issue.loadNumber,
        driverName: issue.driver,
      });
    });

    // Generate recent activity from board data
    const boardData = boardQuery.data as any;
    if (boardData?.loads) {
      const recentLoads = boardData.loads
        .filter((l: any) => l.status === "delivered" || l.status === "in_transit" || l.status === "assigned")
        .slice(0, 10);
      recentLoads.forEach((l: any) => {
        const typeMap: Record<string, ActivityEvent["type"]> = {
          delivered: "delivery",
          in_transit: "status",
          assigned: "assignment",
        };
        events.push({
          id: `load-event-${l.id}`,
          type: typeMap[l.status] || "status",
          message: l.status === "delivered"
            ? `Load ${l.loadNumber} delivered to ${l.destination}`
            : l.status === "in_transit"
            ? `Load ${l.loadNumber} in transit to ${l.destination}`
            : `Load ${l.loadNumber} assigned`,
          timestamp: l.pickupDate || l.deliveryDate || new Date().toISOString(),
          loadNumber: l.loadNumber,
        });
      });
    }

    // Inject real-time WebSocket events
    wsUpdates.slice(0, 10).forEach((ws: any) => {
      events.push({
        id: `ws-${ws.loadId || ''}-${ws.timestamp}`,
        type: ws.priority === 'urgent' ? 'exception' : 'status',
        message: ws.message || `Dispatch update: ${ws.eventType}`,
        timestamp: ws.timestamp || new Date().toISOString(),
        severity: ws.priority === 'urgent' ? 'critical' : undefined,
        loadNumber: ws.loadNumber,
      });
    });

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 25);
  }, [issuesQuery.data, boardQuery.data, wsUpdates]);

  const stats = statsQuery.data as any;
  const exceptionCount = (issuesQuery.data as any[])?.length || 0;

  // ── Move Load mutation (drag between lanes) ──
  const moveLoadMutation = (trpc as any).dispatch.updateLoadStatus.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Load moved to ${data.status || "new status"}`);
      boardQuery.refetch();
      driversQuery.refetch();
    },
    onError: (err: any) => {
      toast.error("Move failed", { description: err.message });
    },
  });

  // ── Handlers ──
  const handleAssignDriver = useCallback((loadId: string, driverId: string) => {
    assignMutation.mutate({ loadId, driverId });
  }, [assignMutation]);

  // Map Kanban lane keys to the first logical status for that lane
  const LANE_TO_STATUS: Record<string, string> = {
    unassigned: "posted",
    assigned: "assigned",
    in_transit: "in_transit",
    delivered: "delivered",
  };

  const handleMoveLoad = useCallback((loadId: string, targetLane: string) => {
    const targetStatus = LANE_TO_STATUS[targetLane];
    if (!targetStatus) return;
    moveLoadMutation.mutate({ loadId, status: targetStatus });
  }, [moveLoadMutation]);

  const quickLoadMutation = (trpc as any).dispatch.quickCreateLoad.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Load ${data.loadNumber} created`, { description: "Load is now in the Unassigned lane" });
      boardQuery.refetch();
    },
    onError: (err: any) => {
      toast.error("Failed to create load", { description: err.message });
    },
  });

  const handleQuickLoadSubmit = useCallback((data: QuickLoadData) => {
    quickLoadMutation.mutate({
      originCity: data.originCity,
      originState: data.originState,
      destinationCity: data.destinationCity,
      destinationState: data.destinationState,
      cargoType: data.cargoType,
      rate: data.rate,
      trailerType: data.trailerType,
      pickupDate: data.pickupDate,
      specialInstructions: data.specialInstructions,
      hazmatClass: data.hazmatClass,
    });
    setShowQuickLoad(false);
  }, [quickLoadMutation]);

  const handleRefresh = () => {
    boardQuery.refetch();
    driversQuery.refetch();
    statsQuery.refetch();
    issuesQuery.refetch();
    toast.success("Refreshed");
  };

  const isLoading = boardQuery.isLoading || driversQuery.isLoading;
  const isConnected = !boardQuery.isError && !driversQuery.isError;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Top Bar */}
      <div className="shrink-0 px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-cyan-400" aria-hidden="true" />
            Command Center
          </h1>
          <div className="flex items-center gap-1.5 ml-2">
            {isConnected ? (
              <Badge className="bg-green-500/20 text-green-400 border-0 text-[10px] gap-1">
                <Wifi className="w-3 h-3" aria-hidden="true" />Live
              </Badge>
            ) : (
              <Badge className="bg-red-500/20 text-red-400 border-0 text-[10px] gap-1">
                <WifiOff className="w-3 h-3" aria-hidden="true" />Offline
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Summary Stats */}
          <div className="hidden md:flex items-center gap-3 mr-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-slate-400">Unassigned:</span>
              <span className="text-red-400 font-semibold">{stats?.unassigned || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-cyan-500" />
              <span className="text-slate-400">In Transit:</span>
              <span className="text-cyan-400 font-semibold">{stats?.inTransit || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-slate-400">Drivers:</span>
              <span className="text-green-400 font-semibold">{stats?.availableDrivers || 0}/{stats?.totalDrivers || 0}</span>
            </div>
            {exceptionCount > 0 && (
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-red-400" aria-hidden="true" />
                <span className="text-red-400 font-semibold">{exceptionCount} issues</span>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.06] rounded-md"
            onClick={handleRefresh}
            aria-label="Refresh all data"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1", isLoading && "animate-spin")} aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </div>

      {/* FMCSA Safety Alert Banner */}
      {stats?.fmcsaSafety?.outOfService && (
        <div className="shrink-0 px-4 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" aria-hidden="true" />
          <span className="text-xs text-red-400 font-medium">
            FMCSA Alert: Carrier has active Out-of-Service order (DOT# {stats.fmcsaSafety.dotNumber}).
            {stats.fmcsaSafety.oosReason && ` Reason: ${stats.fmcsaSafety.oosReason}`}
          </span>
        </div>
      )}
      {stats?.fmcsaSafety?.basicAlerts > 0 && !stats?.fmcsaSafety?.outOfService && (
        <div className="shrink-0 px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" aria-hidden="true" />
          <span className="text-xs text-yellow-400">
            {stats.fmcsaSafety.basicAlerts} FMCSA BASIC alert{stats.fmcsaSafety.basicAlerts > 1 ? "s" : ""}:
            {stats.fmcsaSafety.unsafeDrivingAlert && " Unsafe Driving"}
            {stats.fmcsaSafety.hosAlert && " HOS"}
            {stats.fmcsaSafety.vehicleMaintenanceAlert && " Vehicle Maintenance"}
            {stats.fmcsaSafety.crashIndicatorAlert && " Crash Indicator"}
          </span>
        </div>
      )}

      {/* 3-Column Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* LEFT: Driver Roster */}
        <div className={cn(
          "shrink-0 border-r border-white/[0.06] transition-all duration-300 relative",
          leftCollapsed ? "w-10" : "w-[260px]"
        )}>
          <button
            onClick={() => setLeftCollapsed(!leftCollapsed)}
            className="absolute -right-3 top-4 z-10 w-6 h-6 rounded-full bg-slate-800 border border-white/[0.1] flex items-center justify-center hover:bg-slate-700 transition-colors"
            aria-label={leftCollapsed ? "Expand driver roster" : "Collapse driver roster"}
          >
            {leftCollapsed ? <ChevronRight className="w-3 h-3 text-slate-400" /> : <ChevronLeft className="w-3 h-3 text-slate-400" />}
          </button>
          {!leftCollapsed && (
            <DriverRoster
              drivers={rosterDrivers}
              loading={driversQuery.isLoading}
              onDriverSelect={(d) => setSelectedDriverId(d.id)}
              selectedDriverId={selectedDriverId}
            />
          )}
        </div>

        {/* CENTER: Kanban Board */}
        <div className="flex-1 min-w-0 p-3 overflow-auto">
          <KanbanBoard
            loads={kanbanLoads}
            loading={boardQuery.isLoading}
            onAssignDriver={handleAssignDriver}
            onMoveLoad={handleMoveLoad}
            onLoadClick={(load) => {
              if (load.id) navigate(`/load/${load.id}`);
            }}
            onCreateLoad={() => setShowQuickLoad(true)}
          />
        </div>

        {/* RIGHT: Activity Feed + Quick Actions */}
        <div className={cn(
          "shrink-0 border-l border-white/[0.06] transition-all duration-300 relative",
          rightCollapsed ? "w-10" : "w-[240px]"
        )}>
          <button
            onClick={() => setRightCollapsed(!rightCollapsed)}
            className="absolute -left-3 top-4 z-10 w-6 h-6 rounded-full bg-slate-800 border border-white/[0.1] flex items-center justify-center hover:bg-slate-700 transition-colors"
            aria-label={rightCollapsed ? "Expand activity feed" : "Collapse activity feed"}
          >
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
              onViewExceptions={() => navigate("/dispatch/exceptions")}
            />
          )}
        </div>
      </div>

      {/* Quick Load Dialog */}
      <QuickLoadDialog
        open={showQuickLoad}
        onClose={() => setShowQuickLoad(false)}
        onSubmit={handleQuickLoadSubmit}
      />

      {/* Broadcast Dialog */}
      <BroadcastDialog
        open={showBroadcast}
        onClose={() => setShowBroadcast(false)}
      />
    </div>
  );
}
