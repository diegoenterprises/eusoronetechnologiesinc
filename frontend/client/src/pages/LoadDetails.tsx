/**
 * LOAD DETAILS PAGE — State Machine v2.0
 *
 * Unified load detail view integrating all lifecycle components:
 * - LoadStatusBadge (Lucide icons, pulse animation)
 * - LoadProgressTimeline (horizontal journey visualization)
 * - StatePanel (context-aware content per lifecycle phase)
 * - PrimaryActionButton (role-aware state transitions)
 * - DetentionTimer (real-time financial countdowns)
 * - FinancialSummaryCard (full financial breakdown)
 *
 * Theme-aware | Brand gradient | Role-aware actions | Trailer-type compliance
 */

import React, { useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Package, MapPin, Truck, DollarSign, Calendar, ArrowLeft,
  Phone, Navigation, Clock, User, AlertTriangle, CheckCircle, Shield,
  Building2, Scale, FileText, Loader2, ChevronRight, Info,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLocation, useParams } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import SpectraMatchWidget from "@/components/SpectraMatchWidget";
import LoadStatusTimeline from "@/components/tracking/LoadStatusTimeline";
import { useAuth } from "@/_core/hooks/useAuth";

import LoadStatusBadge from "@/components/load/LoadStatusBadge";
import LoadProgressTimeline from "@/components/load/LoadProgressTimeline";
import StatePanel from "@/components/load/StatePanel";
import PrimaryActionButton from "@/components/load/PrimaryActionButton";
import DetentionTimer from "@/components/financial/DetentionTimer";
import FinancialSummaryCard from "@/components/financial/FinancialSummaryCard";
import { useLoadSocket } from "@/hooks/useLoadSocket";
import ApprovalGateCard, { ApprovalBadge } from "@/components/load/ApprovalGateCard";
import GuardChecklist from "@/components/load/GuardChecklist";
import ConvoySyncDashboard from "@/components/convoy/ConvoySyncDashboard";
import HazmatRouteRestrictions from "@/components/HazmatRouteRestrictions";

const SPECTRA_CARGO_TYPES = ["hazmat", "liquid", "gas", "chemicals", "petroleum"];
const SPECTRA_KEYWORDS = ["crude", "oil", "petroleum", "condensate", "bitumen", "naphtha", "diesel", "gasoline", "kerosene", "fuel", "lpg", "propane", "butane", "ethanol", "methanol"];
function isSpectraQualified(cargoType?: string, commodity?: string, hazmatClass?: string): boolean {
  if (cargoType && SPECTRA_CARGO_TYPES.includes(cargoType)) return true;
  if (["2", "3"].includes(hazmatClass || "")) return true;
  if (cargoType && ["refrigerated", "oversized", "general"].includes(cargoType)) return false;
  const c = (commodity || "").toLowerCase();
  if (SPECTRA_KEYWORDS.some(k => c.includes(k))) return true;
  return false;
}

// States considered "active" (en route, at facility, loading/unloading)
const EXECUTION_STATES = new Set([
  "en_route_pickup", "at_pickup", "pickup_checkin", "loading", "loading_exception", "loaded",
  "in_transit", "transit_hold", "transit_exception",
  "at_delivery", "delivery_checkin", "unloading", "unloading_exception", "unloaded",
]);
const FINANCIAL_STATES = new Set(["invoiced", "disputed", "paid", "complete"]);

export default function LoadDetails() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const loadId = (params.loadId || params.id) as string;

  const { user: authUser } = useAuth();
  const loadQuery = (trpc as any).loads.getById.useQuery({ id: loadId });
  const load = loadQuery.data;

  // ── Role & permission checks ──
  const isLoadOwner = load?.shipperId && authUser?.id && Number(load.shipperId) === Number(authUser.id);
  const userRole = (authUser?.role || "").toUpperCase();
  const isShipper = isLoadOwner || userRole === "SHIPPER";
  const canBid = !isLoadOwner && ["CATALYST", "BROKER", "DISPATCH"].includes(userRole);
  const isAssignedCatalyst = load?.catalystId && authUser?.id && Number(load.catalystId) === Number(authUser.id);
  const isAssignedDriver = load?.driverId && authUser?.id && Number(load.driverId) === Number(authUser.id);
  const isDispatchOrAdmin = ["DISPATCH", "ADMIN", "SUPER_ADMIN"].includes(userRole);
  const canUpdateStatus = isAssignedCatalyst || isAssignedDriver || isDispatchOrAdmin;
  const isInExecution = EXECUTION_STATES.has(load?.status || "");
  const isInFinancial = FINANCIAL_STATES.has(load?.status || "");

  // ── Lifecycle State Machine queries ──
  const transitionsQuery = (trpc as any).loadLifecycle.getAvailableTransitions.useQuery(
    { loadId },
    { enabled: !!loadId && !!load && canUpdateStatus }
  );
  const stateHistoryQuery = (trpc as any).loadLifecycle.getStateHistory.useQuery(
    { loadId },
    { enabled: !!loadId && !!load }
  );
  const activeTimersQuery = (trpc as any).loadLifecycle.getActiveTimers.useQuery(
    { loadId },
    { enabled: !!loadId && !!load && isInExecution }
  );
  const financialSummaryQuery = (trpc as any).loadLifecycle.getFinancialSummary.useQuery(
    { loadId },
    { enabled: !!loadId && !!load && (isInExecution || isInFinancial || load?.status === "delivered") }
  );

  const pendingApprovalsQuery = (trpc as any).loadLifecycle.getPendingApprovals.useQuery(
    undefined,
    { enabled: isDispatchOrAdmin }
  );
  const convoyQuery = (trpc as any).convoy.getConvoy.useQuery(
    { loadId: Number(loadId) || 0 },
    { enabled: !!loadId && !!load && isInExecution }
  );
  const convoyData = convoyQuery.data as any;

  const availableTransitions = (transitionsQuery.data || []) as any[];
  const stateHistory = (stateHistoryQuery.data || []) as any[];
  const activeTimers = (activeTimersQuery.data || []) as any[];
  const financialSummary = financialSummaryQuery.data as any;
  const allPendingApprovals = (pendingApprovalsQuery.data || []) as any[];
  const loadApprovals = allPendingApprovals.filter((a: any) => String(a.loadId) === String(loadId));

  // ── Approval mutations ──
  const approveMutation = (trpc as any).loadLifecycle.approveRequest.useMutation({
    onSuccess: (data: any) => {
      if (data.success) {
        toast.success("Approval granted");
        pendingApprovalsQuery.refetch();
        loadQuery.refetch();
      } else {
        toast.error("Approval failed", { description: data.error });
      }
    },
    onError: (err: any) => toast.error("Approval error", { description: err.message }),
  });
  const denyMutation = (trpc as any).loadLifecycle.denyRequest.useMutation({
    onSuccess: (data: any) => {
      if (data.success) {
        toast.success("Request denied");
        pendingApprovalsQuery.refetch();
      } else {
        toast.error("Deny failed", { description: data.error });
      }
    },
    onError: (err: any) => toast.error("Deny error", { description: err.message }),
  });

  // ── Real-time WebSocket subscription ──
  const refetchAll = useCallback(() => {
    loadQuery.refetch();
    transitionsQuery.refetch();
    stateHistoryQuery.refetch();
    activeTimersQuery.refetch();
    financialSummaryQuery.refetch();
    pendingApprovalsQuery.refetch();
  }, []);
  const { isConnected: wsConnected, lastEvent: wsLastEvent } = useLoadSocket(loadId, {
    onStateChange: refetchAll,
    onTimerUpdate: refetchAll,
    onApprovalUpdate: refetchAll,
    enabled: !!loadId,
  });

  // Build timeline data from state history
  const timelineTimestamps = useMemo(() => {
    const ts: Record<string, string> = {};
    for (const h of stateHistory) {
      ts[h.toState] = h.createdAt;
    }
    return ts;
  }, [stateHistory]);
  const timelineActors = useMemo(() => {
    const a: Record<string, string> = {};
    for (const h of stateHistory) {
      a[h.toState] = h.actorName;
    }
    return a;
  }, [stateHistory]);

  // ── Lifecycle transition mutation (v2 — typed transition IDs) ──
  const executeTransitionMutation = (trpc as any).loadLifecycle.executeTransition.useMutation({
    onSuccess: (data: any) => {
      if (data.success) {
        toast.success(`Transitioned to ${(data.newState || "").replace(/_/g, " ")}`);
        loadQuery.refetch();
        transitionsQuery.refetch();
        stateHistoryQuery.refetch();
        activeTimersQuery.refetch();
        financialSummaryQuery.refetch();
      } else {
        toast.error("Transition failed", { description: data.error || data.errors?.join(", ") });
      }
    },
    onError: (err: any) => toast.error("Transition error", { description: err.message }),
  });

  // ── Legacy v1 mutation (backward compat for simple status updates) ──
  const updateStatusMutation = (trpc as any).loadLifecycle.transitionState.useMutation({
    onSuccess: (data: any) => {
      if (data.success) {
        toast.success(`Status updated to ${(data.newState || "").replace(/_/g, " ")}`);
        loadQuery.refetch();
        transitionsQuery.refetch();
        stateHistoryQuery.refetch();
      } else {
        toast.error("Update failed", { description: data.error });
      }
    },
    onError: (err: any) => toast.error("Failed to update status", { description: err.message }),
  });

  // Trailer-type-aware status progression chain per contract Articles 7, 9, 10
  // Provides specific labels, compliance hints, and procedural checklists per trailer/equipment type
  const equipType = (load?.equipmentType || load?.cargoType || "").toLowerCase();
  const isHazmatLoad = !!(load?.hazmatClass || load?.unNumber);
  const isReeferLoad = equipType.includes("reefer") || equipType.includes("refrigerat");
  const isFlatbedLoad = equipType.includes("flatbed");
  const isTankerLoad = equipType.includes("tank") || equipType.includes("tanker");
  const isBulkLoad = equipType.includes("hopper") || equipType.includes("bulk") || equipType.includes("pneumatic");
  const isFoodGradeLoad = equipType.includes("food") || (load?.commodity || "").toLowerCase().match(/milk|juice|oil|wine|sugar|edible/);
  const isWaterLoad = equipType.includes("water");

  type StatusStep = { next: string; label: string; icon: React.ReactNode; color: string; hint?: string };
  const STATUS_CHAIN: Record<string, StatusStep> = (() => {
    // Base chain — every load type uses this structure
    const base: Record<string, StatusStep> = {
      assigned: { next: 'en_route_pickup', label: 'Start Route to Pickup', icon: <Truck className="w-4 h-4" />, color: 'from-blue-500 to-cyan-500' },
      en_route_pickup: { next: 'at_pickup', label: 'Arrived at Pickup', icon: <MapPin className="w-4 h-4" />, color: 'from-blue-500 to-cyan-500' },
      at_pickup: { next: 'loading', label: 'Start Loading', icon: <Package className="w-4 h-4" />, color: 'from-cyan-500 to-emerald-500' },
      loading: { next: 'in_transit', label: 'Loading Complete — Depart', icon: <Navigation className="w-4 h-4" />, color: 'from-emerald-500 to-green-500' },
      in_transit: { next: 'at_delivery', label: 'Arrived at Delivery', icon: <MapPin className="w-4 h-4" />, color: 'from-green-500 to-emerald-600' },
      at_delivery: { next: 'unloading', label: 'Start Unloading', icon: <Package className="w-4 h-4" />, color: 'from-emerald-600 to-teal-500' },
      unloading: { next: 'delivered', label: 'Unloading Complete — Delivered', icon: <CheckCircle className="w-4 h-4" />, color: 'from-[#1473FF] to-[#BE01FF]' },
    };

    // Hazmat overlay (49 CFR 172-177)
    if (isHazmatLoad) {
      base.assigned.hint = "Verify placards, shipping papers (49 CFR 172.200), tanker endorsement";
      base.at_pickup.label = "Begin Hazmat Loading";
      base.at_pickup.hint = "Confirm placard placement, seal integrity, emergency info packet";
      base.loading.label = "Loading Complete — Verify Seals & Depart";
      base.loading.hint = "Confirm seal numbers, check for leaks, verify shipping papers match cargo";
      base.in_transit.hint = "Monitor for spills/leaks, keep shipping papers accessible, avoid tunnels/restrictions";
      base.at_delivery.hint = "Present shipping papers, confirm consignee identity";
      base.unloading.label = "Hazmat Unloading Complete — Delivered";
      base.unloading.hint = "Verify all product discharged, remove placards if empty, retain shipping papers";
    }

    // Reefer overlay (FSMA 21 CFR 1.908)
    if (isReeferLoad) {
      base.assigned.hint = "Pre-cool unit to required temperature before loading";
      base.at_pickup.label = "Begin Temperature-Controlled Loading";
      base.at_pickup.hint = "Verify reefer temp is within range, record pre-load temp reading (FSMA)";
      base.loading.label = "Loading Complete — Confirm Temp & Depart";
      base.loading.hint = "Record post-load temp, verify door seals, activate continuous temp monitoring";
      base.in_transit.hint = "Monitor reefer temp continuously, log any alarm events (FSMA 21 CFR 1.908)";
      base.at_delivery.hint = "Record arrival temp before opening doors, present temp log to consignee";
      base.unloading.label = "Reefer Unloading Complete — Delivered";
      base.unloading.hint = "Record final temp, retain temp log for 2 years (FSMA compliance)";
    }

    // Flatbed overlay (49 CFR 393.100-136)
    if (isFlatbedLoad) {
      base.assigned.hint = "Inspect chains, binders, straps, and tarps before departing";
      base.at_pickup.label = "Begin Flatbed Loading";
      base.at_pickup.hint = "Position cargo per 49 CFR 393.100, ensure proper blocking and bracing";
      base.loading.label = "Securement Complete — Depart";
      base.loading.hint = "Verify tiedowns meet 49 CFR 393.106 (1 per 10ft + 2 minimum), tarp if required";
      base.in_transit.hint = "Re-check securement within first 50 miles, then every 150 miles or 3 hours";
      base.at_delivery.hint = "Do not remove securement until receiver is ready to unload";
      base.unloading.label = "Flatbed Unloading Complete — Delivered";
    }

    // Tanker overlay (liquid tank, cryogenic, food-grade, water)
    if (isTankerLoad) {
      base.assigned.hint = "Verify tanker endorsement, inspect valves, gaskets, and manhole covers";
      base.at_pickup.label = "Begin Tanker Loading";
      base.at_pickup.hint = "Ground trailer, connect loading arms, open valves, verify compartment sequence";
      base.loading.label = "Loading Complete — Seal & Depart";
      base.loading.hint = "Record gauge readings, seal all valves, verify ullage, check for leaks";
      base.in_transit.hint = "Monitor for surge, maintain safe speed on curves, check valve seals at stops";
      base.at_delivery.label = "Arrived at Delivery";
      base.at_delivery.hint = "Ground trailer, connect unloading lines, confirm receiving tank compatibility";
      base.unloading.label = "Tanker Discharge Complete — Delivered";
      base.unloading.hint = "Verify all product discharged, drain lines, close valves, record final gauge";
    }

    // Food-grade overlay (FSMA, PMO, 3-A Sanitary)
    if (isFoodGradeLoad) {
      base.assigned.hint = "Verify wash ticket from last 3 loads, confirm food-grade certification";
      base.at_pickup.label = "Begin Food-Grade Loading";
      base.at_pickup.hint = "Present wash ticket to shipper, verify no prohibited prior cargo (FSMA)";
      base.loading.label = "Loading Complete — Seal & Depart";
      base.loading.hint = "Apply tamper-evident seals, record seal numbers, temp if applicable";
      base.in_transit.hint = "Maintain product integrity, no stops at non-food facilities (FSMA)";
      base.unloading.label = "Food-Grade Discharge Complete — Delivered";
      base.unloading.hint = "Verify product quality at delivery, retain wash ticket + seal records";
    }

    // Water tank overlay (EPA Safe Drinking Water Act)
    if (isWaterLoad) {
      base.assigned.hint = "Verify tank is NSF 61 certified for potable water, inspect for contamination";
      base.at_pickup.label = "Begin Water Loading";
      base.at_pickup.hint = "Verify water source quality, connect sanitary hoses, record chlorine levels if potable";
      base.loading.label = "Loading Complete — Seal & Depart";
      base.loading.hint = "Seal fill ports, record volume and water quality readings";
      base.in_transit.hint = "Protect from contamination, no mixing with non-potable equipment";
      base.unloading.label = "Water Discharge Complete — Delivered";
      base.unloading.hint = "Verify delivery volume, record final quality readings";
    }

    // Bulk/Hopper overlay (pneumatic)
    if (isBulkLoad) {
      base.assigned.hint = "Inspect pneumatic lines, pressure relief valves, hopper gates";
      base.at_pickup.label = "Begin Pneumatic Loading";
      base.at_pickup.hint = "Position under silo/hopper, connect pneumatic lines, verify product grade";
      base.loading.label = "Loading Complete — Seal & Depart";
      base.loading.hint = "Verify weight (80,000 lb GVW max), seal hopper gates, check dust containment";
      base.in_transit.hint = "Monitor for shifting load, maintain pressure, weigh at certified scale";
      base.unloading.label = "Pneumatic Discharge Complete — Delivered";
      base.unloading.hint = "Verify complete discharge, clean residual product, close all valves";
    }

    return base;
  })();

  // Fetch bids for this load (shipper view)
  const bidsQuery = (trpc as any).bids.getByLoad.useQuery(
    { loadId: loadId! },
    { enabled: !!loadId && isShipper }
  );
  const bids = (bidsQuery.data as any[]) || [];
  const pendingBids = bids.filter((b: any) => b.status === "pending");

  const acceptBidMutation = (trpc as any).bids.accept.useMutation({
    onSuccess: () => { bidsQuery.refetch(); loadQuery.refetch(); },
  });
  const rejectBidMutation = (trpc as any).bids.reject.useMutation({
    onSuccess: () => { bidsQuery.refetch(); },
  });

  // ── Primary transition (first executable transition for PrimaryActionButton) ──
  const primaryTransition = availableTransitions.find((t: any) => t.canExecute);

  if (loadQuery.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
        <Skeleton className={cn("h-10 w-64 rounded-xl", isLight ? "bg-slate-200" : "")} />
        <Skeleton className={cn("h-4 w-96 rounded-xl", isLight ? "bg-slate-200" : "")} />
        <Skeleton className={cn("h-20 w-full rounded-2xl", isLight ? "bg-slate-200" : "")} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className={cn("h-64 w-full rounded-2xl lg:col-span-2", isLight ? "bg-slate-200" : "")} />
          <Skeleton className={cn("h-64 w-full rounded-2xl", isLight ? "bg-slate-200" : "")} />
        </div>
      </div>
    );
  }

  if (!load) {
    return (
      <div className="p-4 md:p-6 max-w-[1100px] mx-auto">
        <div className={cn("text-center py-16 rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
          <div className={cn("p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
            <Package className="w-10 h-10 text-slate-400" />
          </div>
          <p className={cn("text-lg font-medium", isLight ? "text-slate-800" : "text-white")}>Load not found</p>
          <p className="text-sm text-slate-400 mt-1">This load may have been removed or is no longer available.</p>
          <Button className="mt-6 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />Go Back
          </Button>
        </div>
      </div>
    );
  }

  const originCity = load.origin?.city || load.pickupLocation?.city || "Origin";
  const originState = load.origin?.state || load.pickupLocation?.state || "";
  const destCity = load.destination?.city || load.deliveryLocation?.city || "Destination";
  const destState = load.destination?.state || load.deliveryLocation?.state || "";
  const distance = Number(load.distance) || 0;
  const rate = Number(load.rate) || 0;
  const ratePerMile = distance > 0 && rate > 0 ? (rate / distance).toFixed(2) : "0.00";

  const cardCls = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const titleCls = cn("text-lg font-semibold", isLight ? "text-slate-800" : "text-white");
  const cellCls = cn("p-3 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");
  const valCls = cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white");

  // Shape load data for StatePanel
  const statePanelLoad = {
    id: loadId,
    loadNumber: load.loadNumber,
    origin: load.origin || load.pickupLocation,
    destination: load.destination || load.deliveryLocation,
    rate, weight: Number(load.weight) || 0, distance,
    hazmatClass: load.hazmatClass,
    carrierName: load.catalystName || undefined,
    driverName: load.driverName || undefined,
    pickupDate: load.pickupDate,
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto pb-28">

      {/* ═══════════ HEADER ═══════════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className={cn("rounded-xl", isLight ? "text-slate-500 hover:text-slate-800 hover:bg-slate-100" : "text-slate-400 hover:text-white hover:bg-slate-800")} onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
                {load.loadNumber || `Load #${String(load.id).slice(0, 8)}`}
              </h1>
              <LoadStatusBadge state={load.status} size="md" />
              {wsConnected && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
              {originCity} → {destCity}{distance > 0 ? ` · ${distance} mi` : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" className={cn("rounded-xl text-sm", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-700")} onClick={() => setLocation("/messages")}>
            <Phone className="w-4 h-4 mr-2" />Contact
          </Button>
          {(load.status === "posted" || load.status === "bidding") && (isLoadOwner || userRole === "SHIPPER") && (
            <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-sm" onClick={() => setLocation(`/loads/${loadId}/bids`)}>
              <Scale className="w-4 h-4 mr-2" />Review Bids
            </Button>
          )}
          {(load.status === "posted" || load.status === "bidding") && canBid && (
            <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold text-sm" onClick={() => setLocation(`/bids/submit/${loadId}`)}>
              <Scale className="w-4 h-4 mr-2" />Place Bid
            </Button>
          )}
          {isInExecution && (
            <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-xl text-white text-sm" onClick={() => setLocation("/tracking")}>
              <Navigation className="w-4 h-4 mr-2" />Track
            </Button>
          )}
        </div>
      </div>

      {/* ── Rate & Stats Summary ── */}
      <div className={cn("rounded-2xl border overflow-hidden", isLight ? "bg-white border-slate-200 shadow-md" : "bg-slate-800/60 border-slate-700/50")}>
        <div className="bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 px-6 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Load Rate</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${rate.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-0.5">${ratePerMile}/mi</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Distance</p>
              <p className={cn("text-3xl font-bold", isLight ? "text-slate-800" : "text-white")}>{distance}</p>
              <p className="text-xs text-slate-400 mt-0.5">miles</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Weight</p>
              <p className={cn("text-3xl font-bold", isLight ? "text-slate-800" : "text-white")}>{Number(load.weight || 0).toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-0.5">{load.weightUnit || "lbs"}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Equipment</p>
              <p className={cn("text-2xl font-bold capitalize", isLight ? "text-slate-800" : "text-white")}>{load.equipmentType || "—"}</p>
              <p className="text-xs text-slate-400 mt-0.5">{load.commodity || "General"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ LIFECYCLE JOURNEY ═══════════ */}
      <Card className={cardCls}>
        <CardContent className="p-5">
          <LoadProgressTimeline
            currentState={load.status}
            stateHistory={stateHistory}
            variant="horizontal"
            compact={false}
          />
        </CardContent>
      </Card>

      {/* ═══════════ STATE CONTEXT + ACTIVE TIMERS ═══════════ */}
      {(isInExecution || canUpdateStatus) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <StatePanel
              currentState={load.status}
              load={statePanelLoad}
              activeTimers={activeTimers}
            />
            {/* Trailer-type compliance hint */}
            {STATUS_CHAIN[load.status]?.hint && (
              <div className={cn("flex items-start gap-2.5 p-4 rounded-xl border", isLight ? "bg-amber-50 border-amber-200" : "bg-amber-500/10 border-amber-500/20")}>
                <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className={cn("text-xs font-semibold mb-1", isLight ? "text-amber-700" : "text-amber-300")}>
                    {isHazmatLoad ? "Hazmat Compliance" : isTankerLoad ? "Tanker Procedure" : isReeferLoad ? "Temperature Protocol" : "Compliance"}
                  </p>
                  <p className={cn("text-xs leading-relaxed", isLight ? "text-amber-700/80" : "text-amber-300/80")}>{STATUS_CHAIN[load.status].hint}</p>
                </div>
              </div>
            )}
          </div>
          {/* Active financial timers */}
          <div className="space-y-4">
            {activeTimers.length > 0 ? activeTimers.map((timer: any, i: number) => (
              <DetentionTimer
                key={i}
                type={timer.type}
                status={timer.status}
                startedAt={timer.startedAt}
                freeTimeMinutes={timer.freeTimeMinutes || 120}
                hourlyRate={timer.hourlyRate}
                currentCharge={timer.currentCharge}
              />
            )) : (
              <Card className={cardCls}>
                <CardContent className="p-4 text-center">
                  <Clock className={cn("w-8 h-8 mx-auto mb-2", isLight ? "text-slate-300" : "text-slate-600")} />
                  <p className="text-xs text-slate-400">No active timers</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ CONVOY SYNC DASHBOARD ═══════════ */}
      {convoyData && (
        <ConvoySyncDashboard
          convoy={{
            id: convoyData.id,
            loadId: convoyData.loadId,
            loadNumber: load.loadNumber,
            status: convoyData.status,
            primaryDriverName: convoyData.loadVehicle?.name,
            escortDriverName: convoyData.lead?.name,
            leadDistance: convoyData.currentLeadDistance,
            rearDistance: convoyData.currentRearDistance,
            formationTime: convoyData.startedAt,
          }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Route Card ── */}
        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(titleCls, "flex items-center gap-2")}>
              <Navigation className="w-5 h-5 text-blue-500" />Route
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("p-5 rounded-xl", isLight ? "bg-slate-50" : "bg-slate-900/40")}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-[#1473FF]" />
                </div>
                <div>
                  <p className={valCls}>{originCity}{originState ? `, ${originState}` : ""}</p>
                  <p className="text-xs text-slate-400">{load.origin?.address || ""}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span className="text-[11px] text-slate-400">Pickup: {String(load.pickupDate || "TBD")}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center my-3 ml-5">
                <div className={cn("w-0.5 h-8", isLight ? "bg-slate-200" : "bg-slate-700")} />
                <div className="ml-4 px-3 py-1 rounded-full bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border border-[#BE01FF]/20">
                  <span className="text-xs font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">{distance} miles</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#BE01FF]/20 to-[#1473FF]/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-[#BE01FF]" />
                </div>
                <div>
                  <p className={valCls}>{destCity}{destState ? `, ${destState}` : ""}</p>
                  <p className="text-xs text-slate-400">{load.destination?.address || ""}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span className="text-[11px] text-slate-400">Delivery: {String(load.deliveryDate || "TBD")}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Load Information ── */}
        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(titleCls, "flex items-center gap-2")}>
              <Package className="w-5 h-5 text-purple-500" />Load Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Equipment", value: load.equipmentType || "N/A", icon: <Truck className="w-4 h-4 text-blue-500" /> },
                { label: "Weight", value: `${Number(load.weight || 0).toLocaleString()} ${load.weightUnit || "lbs"}`, icon: <Package className="w-4 h-4 text-purple-500" /> },
                { label: "Commodity", value: load.commodity || "General Freight", icon: <Package className="w-4 h-4 text-orange-500" /> },
                { label: "Cargo Type", value: load.cargoType || "General", icon: <FileText className="w-4 h-4 text-cyan-500" /> },
              ].map((item) => (
                <div key={item.label} className={cellCls}>
                  <div className="flex items-center gap-2 mb-1">{item.icon}<span className="text-[10px] text-slate-400 uppercase">{item.label}</span></div>
                  <p className={cn(valCls, "capitalize")}>{item.value}</p>
                </div>
              ))}
            </div>
            {load.notes && !String(load.notes).includes("[WARNING]") && (
              <div className={cellCls}>
                <p className="text-[10px] text-slate-400 uppercase mb-1">Notes</p>
                <p className={cn("text-sm", isLight ? "text-slate-700" : "text-slate-300")}>{load.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── ERG Hazmat Classification ── */}
        {(load.hazmatClass || load.unNumber) && (
          <Card className={cardCls}>
            <CardHeader className="pb-3">
              <CardTitle className={cn(titleCls, "flex items-center gap-2")}>
                <Shield className="w-5 h-5 text-cyan-500" />
                ERG Hazmat Classification
                {load.spectraMatchVerified && (
                  <Badge variant="outline" className="text-[10px] border-emerald-500/30 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent ml-auto">
                    <CheckCircle className="w-3 h-3 mr-1" />SPECTRA-MATCH Verified
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {load.commodity && (
                  <div className={cellCls}>
                    <p className="text-[10px] text-slate-400 uppercase">Product</p>
                    <p className={valCls}>{load.commodity}</p>
                  </div>
                )}
                {load.unNumber && (
                  <div className={cellCls}>
                    <p className="text-[10px] text-slate-400 uppercase">UN Number</p>
                    <p className="text-cyan-500 font-bold text-sm">{load.unNumber}</p>
                  </div>
                )}
                {load.hazmatClass && (
                  <div className={cellCls}>
                    <p className="text-[10px] text-slate-400 uppercase">Hazmat Class</p>
                    <p className="text-purple-500 font-medium text-sm">Class {load.hazmatClass}</p>
                  </div>
                )}
                {load.ergGuide && (
                  <div className={cellCls}>
                    <p className="text-[10px] text-slate-400 uppercase">ERG Guide</p>
                    <p className={valCls}>Guide {load.ergGuide}</p>
                  </div>
                )}
              </div>
              {load.notes && String(load.notes).includes("[WARNING]") && (
                <div className="flex flex-wrap gap-2">
                  {String(load.notes).includes("Toxic Inhalation") && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/15 border border-red-500/30">
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                      <span className="text-red-500 text-xs font-bold">TOXIC INHALATION HAZARD</span>
                    </div>
                  )}
                  {String(load.notes).includes("Water-Reactive") && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30">
                      <AlertTriangle className="w-3 h-3 text-blue-500" />
                      <span className="text-blue-500 text-xs font-bold">WATER-REACTIVE</span>
                    </div>
                  )}
                </div>
              )}
              <p className="text-[10px] text-slate-400">Classification data from U.S. DOT ERG 2020 Emergency Response Guidebook</p>
            </CardContent>
          </Card>
        )}

        {/* ── Hazmat Route Restrictions ── */}
        {isHazmatLoad && originState && destState && (
          <HazmatRouteRestrictions
            hazmatClass={load.hazmatClass || "3"}
            unNumber={load.unNumber}
            originState={originState}
            destinationState={destState}
            isTIH={String(load.notes || "").includes("Toxic Inhalation")}
            isRadioactive={load.hazmatClass === "7"}
            weight={Number(load.weight) || undefined}
            compact
          />
        )}

        {/* ── SPECTRA-MATCH™ Oil Identification ── */}
        {isSpectraQualified(load.equipmentType || load.cargoType, load.commodity, load.hazmatClass) && (
          <Card className={cardCls}>
            <CardContent className="p-4">
              <SpectraMatchWidget
                compact={true}
                loadId={loadId}
                showSaveButton={true}
                productName={load.commodity}
                onIdentify={(result) => {
                  console.log("SpectraMatch result:", result);
                  loadQuery.refetch();
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* ── Assigned Driver ── */}
        {load.driver && (
          <Card className={cardCls}>
            <CardHeader className="pb-3">
              <CardTitle className={cn(titleCls, "flex items-center gap-2")}>
                <User className="w-5 h-5 text-cyan-500" />Assigned Driver
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-[#1473FF]" />
                </div>
                <div>
                  <p className={valCls}>{load.driver.name}</p>
                  <p className="text-sm text-slate-400">{load.driver.phone}</p>
                  <p className="text-xs text-slate-400">Truck: {load.driver.truckNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Timeline ── */}
        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(titleCls, "flex items-center gap-2")}>
              <Clock className="w-5 h-5 text-blue-500" />Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {load.timeline?.map((event: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0", event.completed ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" : isLight ? "bg-slate-300" : "bg-slate-600")} />
                  <div>
                    <p className={cn("font-medium text-sm", event.completed ? (isLight ? "text-slate-800" : "text-white") : "text-slate-400")}>{event.title}</p>
                    <p className="text-xs text-slate-400">{event.date}</p>
                  </div>
                </div>
              )) || (
                <div className={cn("text-center py-6 rounded-xl", isLight ? "bg-slate-50" : "bg-slate-900/30")}>
                  <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No timeline events yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Incoming Bids Section (Shipper View) ── */}
      {isShipper && (
        <Card className={cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
              <Scale className="w-5 h-5 text-purple-400" />
              Incoming Bids
              {pendingBids.length > 0 && (
                <Badge className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white text-xs ml-2">
                  {pendingBids.length} pending
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bidsQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : bids.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className={cn("w-12 h-12 mx-auto mb-3", isLight ? "text-slate-300" : "text-slate-600")} />
                <p className={cn("font-medium", isLight ? "text-slate-500" : "text-slate-400")}>No bids yet</p>
                <p className="text-sm text-slate-500 mt-1">Catalysts will bid on your load once it's visible in the marketplace.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bids.map((bid: any) => (
                  <div key={bid.id} className={cn(
                    "flex items-center justify-between p-4 rounded-xl border",
                    bid.status === "accepted" ? (isLight ? "bg-green-50 border-green-200" : "bg-green-500/10 border-green-500/30") :
                    bid.status === "rejected" ? (isLight ? "bg-red-50 border-red-200" : "bg-red-500/10 border-red-500/30") :
                    isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-700"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", isLight ? "bg-slate-200" : "bg-slate-700")}>
                        <Building2 className={cn("w-5 h-5", isLight ? "text-slate-500" : "text-slate-400")} />
                      </div>
                      <div>
                        <p className={cn("font-medium", isLight ? "text-slate-800" : "text-white")}>
                          {bid.catalystName || `Catalyst #${bid.catalystId}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {bid.createdAt ? new Date(bid.createdAt).toLocaleDateString() : ""}
                          {bid.notes ? ` · ${bid.notes}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold text-lg">
                          ${Number(bid.amount).toLocaleString()}
                        </p>
                      </div>
                      <Badge className={cn(
                        "text-xs font-bold border",
                        bid.status === "accepted" ? "bg-green-500/15 text-green-500 border-green-500/30" :
                        bid.status === "rejected" ? "bg-red-500/15 text-red-500 border-red-500/30" :
                        bid.status === "pending" ? "bg-yellow-500/15 text-yellow-500 border-yellow-500/30" :
                        "bg-slate-500/15 text-slate-400 border-slate-500/30"
                      )}>{bid.status}</Badge>
                      {bid.status === "pending" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                            onClick={() => rejectBidMutation.mutate({ bidId: bid.id })}
                            disabled={rejectBidMutation.isPending}>
                            Reject
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => acceptBidMutation.mutate({ bidId: bid.id })}
                            disabled={acceptBidMutation.isPending}>
                            Accept
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══════════ FINANCIAL SUMMARY ═══════════ */}
      {financialSummary && (isInFinancial || load.status === "delivered" || financialSummary.totalAccessorials > 0) && (
        <FinancialSummaryCard
          loadId={loadId}
          lineHaul={financialSummary.lineHaul}
          distance={financialSummary.distance || distance}
          fuelSurcharge={financialSummary.fuelSurcharge}
          hazmatSurcharge={financialSummary.hazmatSurcharge}
          detentionCharges={financialSummary.detentionCharges}
          demurrageCharges={financialSummary.demurrageCharges}
          layoverCharges={financialSummary.layoverCharges}
          totalAccessorials={financialSummary.totalAccessorials}
          totalCharges={financialSummary.totalCharges}
          activeTimers={financialSummary.activeTimers}
          timerHistory={financialSummary.timerHistory}
          currency={financialSummary.currency}
        />
      )}

      {/* ═══════════ APPROVAL GATES ═══════════ */}
      {isDispatchOrAdmin && loadApprovals.length > 0 && (
        <Card className={cardCls}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(titleCls, "flex items-center gap-2")}>
              <Shield className="w-5 h-5 text-amber-500" />
              Pending Approvals
              <ApprovalBadge count={loadApprovals.length} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadApprovals.map((approval: any) => (
              <ApprovalGateCard
                key={approval.id}
                approval={approval}
                onApprove={(id, notes) => approveMutation.mutate({ approvalId: id, notes })}
                onDeny={(id, reason) => denyMutation.mutate({ approvalId: id, reason })}
                loading={approveMutation.isPending || denyMutation.isPending}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* ═══════════ GEOTAG EVENT TIMELINE ═══════════ */}
      {load?.id && (isInExecution || load.status === "delivered" || load.status === "pod_pending") && (
        <LoadStatusTimeline loadId={Number(load.id)} />
      )}

      {/* ═══════════ DELIVERED CONFIRMATION ═══════════ */}
      {load.status === "delivered" && (
        <Card className={cn("rounded-2xl border overflow-hidden", isLight ? "bg-green-50 border-green-200" : "bg-green-500/10 border-green-500/30")}>
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className={cn("text-lg font-bold", isLight ? "text-green-700" : "text-green-400")}>Load Delivered Successfully</p>
            <p className="text-sm text-slate-400 mt-1">Submit your documentation (BOL, POD) to receive payment per contract terms.</p>
            <div className="flex gap-3 justify-center mt-4">
              <Button variant="outline" className={cn("rounded-xl", isLight ? "border-green-200 text-green-700" : "border-green-500/30 text-green-400")} onClick={() => setLocation(`/documents`)}>
                <FileText className="w-4 h-4 mr-2" />Upload Documents
              </Button>
              <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" onClick={() => setLocation(`/invoices`)}>
                <DollarSign className="w-4 h-4 mr-2" />Submit Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══════════ BOTTOM BID CTA (posted loads, bidder roles) ═══════════ */}
      {(load.status === "posted" || load.status === "bidding") && canBid && (
        <div className={cn("rounded-2xl border p-6 flex flex-col sm:flex-row items-center justify-between gap-4", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
          <div>
            <p className={cn("font-bold text-lg", isLight ? "text-slate-800" : "text-white")}>Ready to haul this load?</p>
            <p className="text-sm text-slate-400">Submit a competitive bid and get assigned.</p>
          </div>
          <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold px-8 h-12 text-base" onClick={() => setLocation(`/bids/submit/${loadId}`)}>
            <Scale className="w-5 h-5 mr-2" />Place Bid Now
          </Button>
        </div>
      )}

      {/* ═══════════ GUARD CHECKLIST (blocked transitions) ═══════════ */}
      {canUpdateStatus && availableTransitions.filter((t: any) => !t.canExecute).length > 0 && (
        <GuardChecklist blockedTransitions={availableTransitions.filter((t: any) => !t.canExecute)} />
      )}

      {/* ═══════════ PRIMARY ACTION BUTTON (fixed bottom) ═══════════ */}
      {canUpdateStatus && primaryTransition && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
          <div className="max-w-[1100px] mx-auto pointer-events-auto">
            <PrimaryActionButton
              action={primaryTransition.uiAction || {
                component: "button",
                location: "bottom",
                label: `Advance to ${(primaryTransition.toMeta?.displayName || primaryTransition.to || "").replace(/_/g, " ")}`,
                icon: primaryTransition.toMeta?.icon || "ChevronRight",
                variant: "primary",
                requiresConfirmation: true,
                confirmationMessage: `Transition load to ${primaryTransition.toMeta?.displayName || primaryTransition.to}?`,
              }}
              transitionId={primaryTransition.transitionId}
              loading={executeTransitionMutation.isPending}
              onExecute={(tId) => {
                executeTransitionMutation.mutate({
                  loadId,
                  transitionId: tId,
                });
              }}
            />
            {/* Blocked transitions info */}
            {availableTransitions.filter((t: any) => !t.canExecute).length > 0 && (
              <div className="mt-2 text-center">
                <p className="text-[10px] text-slate-500">
                  {availableTransitions.filter((t: any) => !t.canExecute).length} transition(s) blocked — {
                    availableTransitions.filter((t: any) => !t.canExecute).flatMap((t: any) => t.blockedReasons).slice(0, 2).join(", ")
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
