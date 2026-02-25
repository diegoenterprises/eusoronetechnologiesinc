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
  CloudRain, Flame, Fuel, Radio, Activity, Receipt, Droplets, ArrowRight, Download,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLocation, useParams } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import SpectraMatchWidget from "@/components/SpectraMatchWidget";
import LoadStatusTimeline from "@/components/tracking/LoadStatusTimeline";
import { useAuth } from "@/_core/hooks/useAuth";
import { getEquipmentLabel, getLoadTitle } from "@/lib/loadUtils";

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
  const isInvolvedParty = isLoadOwner || isAssignedCatalyst || isAssignedDriver || isDispatchOrAdmin;
  const loadStatus = (load?.status || "").toLowerCase();
  const isPostAssignment = !["draft", "posted", "bidding", "awarded", "accepted", "declined", "lapsed", "expired"].includes(loadStatus);
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

  // ── Route Intelligence (HotZones corridor data) ──
  const oState = load?.origin?.state || load?.pickupLocation?.state || "";
  const dState = load?.destination?.state || load?.deliveryLocation?.state || "";
  const routeIntelQuery = (trpc as any).hotZones?.getRouteIntelligence?.useQuery?.(
    { originState: oState, destState: dState },
    { enabled: !!load && oState.length === 2 && dState.length === 2, staleTime: 5 * 60 * 1000 }
  );
  const routeIntel = routeIntelQuery?.data;

  // ── ML Engine Intelligence ──
  const mlRatePrediction = (trpc as any).ml?.predictRate?.useQuery?.(
    { originState: oState, destState: dState, distance: Number(load?.distance) || 0, weight: Number(load?.weight) || undefined, equipmentType: load?.equipmentType || "dry_van", cargoType: load?.cargoType || "general" },
    { enabled: !!load && oState.length >= 2 && dState.length >= 2 && Number(load?.distance) > 0, staleTime: 120_000 }
  ) || { data: null };
  const mlETA = (trpc as any).ml?.predictETA?.useQuery?.(
    { originState: oState, destState: dState, distance: Number(load?.distance) || 0, equipmentType: load?.equipmentType || "dry_van", cargoType: load?.cargoType || "general", pickupDate: load?.pickupDate },
    { enabled: !!load && oState.length >= 2 && dState.length >= 2 && Number(load?.distance) > 0, staleTime: 120_000 }
  ) || { data: null };
  const mlAnomalies = (trpc as any).ml?.detectAnomalies?.useQuery?.(
    { rate: Number(load?.rate) || undefined, distance: Number(load?.distance) || undefined, originState: oState || undefined, destState: dState || undefined, weight: Number(load?.weight) || undefined },
    { enabled: !!load && Number(load?.rate) > 0 && Number(load?.distance) > 0, staleTime: 60_000 }
  ) || { data: null };
  const mlDynamicPrice = (trpc as any).ml?.getDynamicPrice?.useQuery?.(
    { originState: oState, destState: dState, distance: Number(load?.distance) || 0, weight: Number(load?.weight) || undefined, equipmentType: load?.equipmentType || "dry_van", cargoType: load?.cargoType || "general", pickupDate: load?.pickupDate },
    { enabled: !!load && oState.length >= 2 && dState.length >= 2 && Number(load?.distance) > 0, staleTime: 120_000 }
  ) || { data: null };

  // ── EusoTicket: Schedule A Rate + Platform Fee + Documents ──
  const scheduleARateQuery = (trpc as any).rateSheet?.calculateRate?.useQuery?.(
    { netBarrels: Number(load?.quantity) || 180, oneWayMiles: Number(load?.distance) || 0, waitTimeHours: 0, isSplitLoad: false, isReject: false, travelSurchargeMiles: 0 },
    { enabled: !!load && Number(load?.distance) > 0 && ((load?.equipmentType || "").toLowerCase().includes("tank")), staleTime: 120_000 }
  ) || { data: null };
  const platformFeeQuery = (trpc as any).rateSheet?.previewPlatformFee?.useQuery?.(
    { grossAmount: Number(load?.rate) || 0 },
    { enabled: !!load && Number(load?.rate) > 0, staleTime: 60_000 }
  ) || { data: null };
  const eusoTicketDocsQuery = (trpc as any).rateSheet?.getEusoTicketDocuments?.useQuery?.(
    { type: "all", limit: 10 },
    { enabled: !!load, staleTime: 60_000 }
  ) || { data: null, isLoading: false };

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

  // ── Download EusoTicket document ──
  const downloadDocument = useCallback((doc: any) => {
    let meta: any = {};
    try { meta = typeof doc.fileUrl === "string" && doc.fileUrl.startsWith("{") ? JSON.parse(doc.fileUrl) : {}; } catch { meta = {}; }
    const date = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";
    const bg = "#0c1222"; const cardBg = "#111827"; const cardBorder = "rgba(255,255,255,0.06)";
    const textPrimary = "#f1f5f9"; const textMuted = "#64748b"; const accent = "#1473FF"; const accentPurple = "#BE01FF";
    const rowBorderColor = "rgba(255,255,255,0.06)";
    const logoSvg = `<svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1473FF"/><stop offset="100%" stop-color="#BE01FF"/></linearGradient></defs><path d="M50 5C50 5 30 25 25 45C20 65 30 85 50 95C70 85 80 65 75 45C70 25 50 5 50 5Z" fill="url(#lg)" opacity="0.9"/><path d="M50 25C50 25 40 38 37 50C34 62 40 75 50 82C60 75 66 62 63 50C60 38 50 25 50 25Z" fill="none" stroke="white" stroke-width="3"/><circle cx="50" cy="52" r="8" fill="none" stroke="white" stroke-width="2.5"/></svg>`;
    const row = (l: string, v: string) => `<tr><td style="padding:10px 16px;font-size:12px;color:${textMuted};border-bottom:1px solid ${rowBorderColor};width:200px">${l}</td><td style="padding:10px 16px;font-size:13px;color:${textPrimary};font-weight:500;border-bottom:1px solid ${rowBorderColor}">${v}</td></tr>`;
    const header = `<div style="text-align:center;padding:32px 0 24px;border-bottom:1px solid ${cardBorder};margin-bottom:28px"><div style="display:inline-block;margin-bottom:12px">${logoSvg}</div><h1 style="margin:0;font-size:28px;font-weight:800;color:transparent;font-size:0;line-height:0;overflow:hidden">.</h1><svg width="160" height="34" viewBox="0 0 160 34" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto"><defs><linearGradient id="etg2" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${accent}"/><stop offset="100%" stop-color="${accentPurple}"/></linearGradient></defs><text x="80" y="28" text-anchor="middle" fill="url(#etg2)" font-family="-apple-system,BlinkMacSystemFont,Inter,sans-serif" font-size="30" font-weight="800" letter-spacing="-0.5">EusoTrip</text></svg><p style="margin:4px 0 0;font-size:11px;color:${textMuted};letter-spacing:2px;text-transform:uppercase">EusoTicket Document System</p><div style="margin-top:16px;display:flex;justify-content:center;gap:24px"><span style="font-size:12px;color:${textMuted}">${date}</span><span style="font-size:12px;color:${textMuted}">Doc #${doc.id || "N/A"}</span></div></div>`;
    const footer = `<div style="position:fixed;bottom:0;left:0;right:0;text-align:center;padding:12px 0"><p style="font-size:8px;color:${textMuted}">Generated by EusoTrip EusoTicket &middot; ${new Date().toLocaleString()}</p><p style="font-size:7px;color:${textMuted};margin-top:2px">Designed by Eusorone Technologies, Inc.</p></div>`;
    let body = "";
    if (doc.type === "bol") {
      body = `<div style="background:${cardBg};border:1px solid ${cardBorder};border-radius:16px;padding:24px"><h2 style="margin:0 0 20px;font-size:20px;color:${textPrimary};font-weight:700">Bill of Lading</h2><table style="width:100%;border-collapse:collapse">${row("BOL Number", doc.name || "N/A")}${row("Shipper", meta.shipperName || "N/A")}${row("Carrier", meta.carrierName || "N/A")}${row("Driver", meta.driverName || "N/A")}${row("Origin", meta.origin || "N/A")}${row("Destination", meta.destination || "N/A")}${row("Product", meta.productType || "Crude Oil")}${row("Volume", (meta.grossBarrels || "N/A") + " BBL")}${row("Date", date)}</table></div>`;
    } else if (doc.type === "run_ticket") {
      body = `<div style="background:${cardBg};border:1px solid ${cardBorder};border-radius:16px;padding:24px"><h2 style="margin:0 0 20px;font-size:20px;color:${textPrimary};font-weight:700">Run Ticket</h2><table style="width:100%;border-collapse:collapse">${row("Ticket #", doc.name || "N/A")}${row("Driver", meta.driverName || "N/A")}${row("Origin", meta.origin || "N/A")}${row("Destination", meta.destination || "N/A")}${row("Product", meta.productType || "Petroleum")}${row("Gross BBL", String(meta.grossBarrels || "N/A"))}${row("Net BBL", String(meta.netBarrels || "N/A"))}${row("BS&W", (meta.bsw || "N/A") + "%")}${row("Date", date)}</table></div>`;
    } else if (doc.type === "rate_sheet") {
      const tiers = meta.rateTiers || [];
      const sc = meta.surcharges || {};
      // Build rate tier rows in a multi-column layout (4 columns of tier pairs)
      let tierRows = "";
      if (tiers.length > 0) {
        const colCount = 4;
        const perCol = Math.ceil(tiers.length / colCount);
        const cols: string[] = [];
        for (let c = 0; c < colCount; c++) {
          const slice = tiers.slice(c * perCol, (c + 1) * perCol);
          let colHtml = `<td style="vertical-align:top;padding:0 4px"><table style="width:100%;border-collapse:collapse;font-size:11px">`;
          colHtml += `<tr><th style="text-align:left;padding:4px 8px;color:${textMuted};font-weight:600;border-bottom:1px solid ${rowBorderColor}">Miles</th><th style="text-align:right;padding:4px 8px;color:${textMuted};font-weight:600;border-bottom:1px solid ${rowBorderColor}">$/BBL</th></tr>`;
          for (const t of slice) {
            colHtml += `<tr><td style="padding:3px 8px;color:${textPrimary}">${t.minMiles}-${t.maxMiles}</td><td style="text-align:right;padding:3px 8px;color:#10b981;font-weight:600;font-family:monospace">$${(t.ratePerBarrel ?? t.ratePerUnit ?? 0).toFixed(2)}</td></tr>`;
          }
          colHtml += `</table></td>`;
          cols.push(colHtml);
        }
        tierRows = `<table style="width:100%;border-collapse:collapse"><tr>${cols.join("")}</tr></table>`;
      }
      // Build surcharges grid
      const scItems: [string, string][] = [];
      if (sc.fscEnabled !== undefined) scItems.push(["Fuel Surcharge", sc.fscEnabled ? "Enabled" : "Disabled"]);
      if (sc.fscBaselineDieselPrice) scItems.push(["FSC Baseline", `$${Number(sc.fscBaselineDieselPrice).toFixed(2)}/gal`]);
      if (sc.fscMilesPerGallon) scItems.push(["FSC MPG", `${sc.fscMilesPerGallon} mpg`]);
      if (sc.waitTimeRatePerHour) scItems.push(["Wait Time", `$${sc.waitTimeRatePerHour}/hr`]);
      if (sc.waitTimeFreeHours !== undefined) scItems.push(["Free Hours", `${sc.waitTimeFreeHours} hr`]);
      if (sc.splitLoadFee) scItems.push(["Split Load Fee", `$${sc.splitLoadFee}`]);
      if (sc.rejectFee) scItems.push(["Reject Fee", `$${sc.rejectFee}`]);
      if (sc.minimumBarrels) scItems.push(["Minimum BBL", `${sc.minimumBarrels} BBL`]);
      if (sc.travelSurchargePerMile) scItems.push(["Travel Surcharge", `$${Number(sc.travelSurchargePerMile).toFixed(2)}/mi`]);
      let scHtml = "";
      if (scItems.length > 0) {
        scHtml = `<div style="margin-top:20px"><h3 style="font-size:14px;color:${textPrimary};font-weight:600;margin:0 0 12px">Surcharges &amp; Fees</h3><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${scItems.map(([l, v]) => `<div style="background:rgba(255,255,255,0.03);border:1px solid ${rowBorderColor};border-radius:8px;padding:8px 12px"><div style="font-size:10px;color:${textMuted};text-transform:uppercase;letter-spacing:0.5px">${l}</div><div style="font-size:14px;color:${textPrimary};font-weight:600;margin-top:2px">${v}</div></div>`).join("")}</div></div>`;
      }
      body = `<div style="background:${cardBg};border:1px solid ${cardBorder};border-radius:16px;padding:24px"><h2 style="margin:0 0 20px;font-size:20px;color:${textPrimary};font-weight:700">Rate Sheet &mdash; Schedule A</h2><table style="width:100%;border-collapse:collapse">${row("Name", meta.name || doc.name || "N/A")}${row("Region", meta.region || "N/A")}${row("Product Type", meta.productType || "Crude Oil")}${row("Trailer Type", (meta.trailerType || "Tanker").replace(/^\w/, (c: string) => c.toUpperCase()))}${row("Rate Unit", (meta.rateUnit || "per_barrel").replace(/_/g, " "))}${meta.effectiveDate ? row("Effective", meta.effectiveDate) : ""}${meta.expirationDate ? row("Expires", meta.expirationDate) : ""}${row("Date", date)}</table></div>${tiers.length > 0 ? `<div style="background:${cardBg};border:1px solid ${cardBorder};border-radius:16px;padding:24px;margin-top:16px"><h3 style="font-size:14px;color:${textPrimary};font-weight:600;margin:0 0 12px">Mileage Rate Tiers (${tiers.length} bands)</h3>${tierRows}</div>` : ""}${scHtml ? `<div style="background:${cardBg};border:1px solid ${cardBorder};border-radius:16px;padding:24px;margin-top:16px">${scHtml}</div>` : ""}${meta.notes ? `<div style="background:${cardBg};border:1px solid ${cardBorder};border-radius:16px;padding:24px;margin-top:16px"><h3 style="font-size:14px;color:${textPrimary};font-weight:600;margin:0 0 8px">Notes</h3><p style="font-size:12px;color:${textMuted};line-height:1.6;margin:0">${meta.notes}</p></div>` : ""}`;
    } else {
      body = `<div style="background:${cardBg};border:1px solid ${cardBorder};border-radius:16px;padding:24px"><h2 style="margin:0 0 20px;font-size:20px;color:${textPrimary};font-weight:700">${doc.name || "Document"}</h2><pre style="font-size:11px;background:rgba(255,255,255,0.03);padding:16px;border-radius:8px;overflow:auto;color:#94a3b8">${JSON.stringify(meta, null, 2)}</pre></div>`;
    }
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${doc.name || "EusoTicket"}</title><style>@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}button,.no-print{display:none!important}}*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:900px;margin:0 auto;padding:32px 24px;background:${bg};color:${textPrimary}}</style></head><body>${header}${body}${footer}<div class="no-print" style="text-align:center;margin-top:28px"><button onclick="window.print()" style="background:linear-gradient(135deg,${accent},${accentPurple});color:white;border:none;padding:12px 32px;border-radius:10px;font-size:13px;cursor:pointer;font-weight:600">Print / Save as PDF</button></div></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); } else toast.error("Pop-up blocked");
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
              <p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>{getEquipmentLabel(load.equipmentType, load.cargoType, load.hazmatClass)}</p>
              <p className="text-xs text-slate-400 mt-0.5">{getLoadTitle(load)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ ML INTELLIGENCE ═══════════ */}
      {(mlRatePrediction.data || mlETA.data || (mlAnomalies.data && Array.isArray(mlAnomalies.data) && mlAnomalies.data.length > 0)) && (
        <div className={cn("rounded-2xl border p-4 space-y-3", isLight ? "bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200" : "bg-gradient-to-r from-purple-500/5 to-blue-500/5 border-purple-500/20")}>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <span className={cn("text-xs font-bold uppercase tracking-wider", isLight ? "text-purple-600" : "bg-gradient-to-r from-[#BE01FF] to-[#1473FF] bg-clip-text text-transparent")}>ESANG AI Intelligence</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {mlRatePrediction.data && (
              <div className={cn("p-3 rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/40")}>
                <p className="text-[10px] text-slate-400 uppercase mb-1">ML Rate Prediction</p>
                <div className="flex items-baseline gap-2">
                  <span className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>${mlRatePrediction.data.predictedSpotRate.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400">${(mlRatePrediction.data.predictedSpotRate / Math.max(distance, 1)).toFixed(2)}/mi</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${mlRatePrediction.data.marketCondition === "SELLER" ? "bg-red-500/15 text-red-400" : mlRatePrediction.data.marketCondition === "BUYER" ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                    {mlRatePrediction.data.marketCondition}
                  </span>
                  <span className="text-[10px] text-slate-500">{mlRatePrediction.data.confidence}% conf</span>
                </div>
              </div>
            )}
            {mlETA.data && (
              <div className={cn("p-3 rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/40")}>
                <p className="text-[10px] text-slate-400 uppercase mb-1">ML Transit Estimate</p>
                <div className="flex items-baseline gap-2">
                  <span className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>{mlETA.data.estimatedDays}d</span>
                  <span className="text-[10px] text-slate-400">{mlETA.data.estimatedHours}h</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${mlETA.data.riskLevel === "HIGH" ? "bg-red-500/15 text-red-400" : mlETA.data.riskLevel === "MODERATE" ? "bg-amber-500/15 text-amber-400" : "bg-green-500/15 text-green-400"}`}>
                    {mlETA.data.riskLevel} RISK
                  </span>
                  <span className="text-[10px] text-slate-500">{Math.round(mlETA.data.range.bestCase)}h - {Math.round(mlETA.data.range.worstCase)}h</span>
                </div>
              </div>
            )}
            {mlDynamicPrice.data && (
              <div className={cn("p-3 rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/40")}>
                <p className="text-[10px] text-slate-400 uppercase mb-1">Dynamic Pricing</p>
                <div className="flex items-baseline gap-2">
                  <span className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>${mlDynamicPrice.data.recommendedRate.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400">${mlDynamicPrice.data.ratePerMile}/mi</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${mlDynamicPrice.data.competitivePosition === "BELOW_MARKET" ? "bg-green-500/15 text-green-400" : mlDynamicPrice.data.competitivePosition === "ABOVE_MARKET" ? "bg-red-500/15 text-red-400" : "bg-blue-500/15 text-blue-400"}`}>
                    {mlDynamicPrice.data.competitivePosition.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            )}
          </div>
          {/* Anomaly Alerts */}
          {mlAnomalies.data && Array.isArray(mlAnomalies.data) && mlAnomalies.data.length > 0 && (
            <div className="space-y-2">
              {mlAnomalies.data.map((a: any, i: number) => (
                <div key={i} className={cn("p-2.5 rounded-lg border flex items-start gap-2", a.severity === "CRITICAL" ? (isLight ? "border-red-200 bg-red-50" : "border-red-500/30 bg-red-500/10") : a.severity === "WARNING" ? (isLight ? "border-amber-200 bg-amber-50" : "border-amber-500/30 bg-amber-500/10") : (isLight ? "border-blue-200 bg-blue-50" : "border-blue-500/30 bg-blue-500/10"))}>
                  <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${a.severity === "CRITICAL" ? "text-red-400" : a.severity === "WARNING" ? "text-amber-400" : "text-blue-400"}`} />
                  <div>
                    <p className={cn("text-xs font-semibold", a.severity === "CRITICAL" ? (isLight ? "text-red-700" : "text-red-300") : a.severity === "WARNING" ? (isLight ? "text-amber-700" : "text-amber-300") : (isLight ? "text-blue-700" : "text-blue-300"))}>{a.message}</p>
                    <p className={cn("text-[10px] mt-0.5", isLight ? "text-slate-500" : "text-slate-500")}>{a.suggestedAction}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

      {/* ═══════════ GATE ACCESS CARD (Driver/Catalyst — present to access controller) ═══════════ */}
      {isInExecution && (isAssignedDriver || isAssignedCatalyst) && (
        <Card className={cn("rounded-2xl border overflow-hidden", isLight ? "bg-white border-cyan-200 shadow-md" : "bg-slate-800/60 border-cyan-500/30")}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  <span className={cn("text-xs font-bold uppercase tracking-wider", isLight ? "text-cyan-600" : "text-cyan-400")}>Gate Access Card</span>
                </div>
                <p className="text-[10px] text-slate-400">Present this Load ID to the gate controller at the terminal</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black tracking-wider bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
                  {load.id}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">LOAD ID</p>
              </div>
            </div>
            <div className={cn("mt-3 p-3 rounded-xl flex items-center justify-between", isLight ? "bg-slate-50 border border-slate-200" : "bg-slate-900/50 border border-slate-700/30")}>
              <div className="grid grid-cols-3 gap-4 w-full text-center">
                <div>
                  <p className="text-[10px] text-slate-400">Origin</p>
                  <p className={cn("text-xs font-medium", isLight ? "text-slate-700" : "text-slate-200")}>{originCity}, {originState}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Destination</p>
                  <p className={cn("text-xs font-medium", isLight ? "text-slate-700" : "text-slate-200")}>{destCity}, {destState}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Status</p>
                  <p className={cn("text-xs font-medium capitalize", isLight ? "text-slate-700" : "text-slate-200")}>{(load.status || "").replace(/_/g, " ")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

        {/* ── Route Intelligence (HotZones Corridor Data) ── */}
        {routeIntel && (
          <Card className={cardCls}>
            <CardHeader className="pb-3">
              <CardTitle className={cn(titleCls, "flex items-center gap-2")}>
                <Activity className="w-5 h-5 text-[#1473FF]" />
                Route Intelligence
                <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className={cn("text-[10px] uppercase tracking-wider font-medium mb-2", isLight ? "text-slate-400" : "text-slate-500")}>
                {originState} to {destState} Corridor
              </p>

              {/* Weather Alerts */}
              {(routeIntel.weatherAlerts || []).length > 0 && (
                <div className={cn("p-3 rounded-xl border", isLight ? "bg-amber-50 border-amber-200" : "bg-amber-500/10 border-amber-500/20")}>
                  <div className="flex items-center gap-2 mb-2">
                    <CloudRain className="w-4 h-4 text-amber-500" />
                    <span className={cn("text-xs font-semibold", isLight ? "text-amber-700" : "text-amber-300")}>
                      {routeIntel.weatherAlerts.length} Weather Alert{routeIntel.weatherAlerts.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {routeIntel.weatherAlerts.slice(0, 3).map((wa: any, i: number) => (
                      <div key={wa.id || i} className="flex items-start gap-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                          wa.severity === "Extreme" ? "bg-red-500" : wa.severity === "Severe" ? "bg-orange-500" : "bg-amber-400"
                        )} />
                        <p className={cn("text-xs leading-snug", isLight ? "text-amber-700/80" : "text-amber-300/80")}>
                          {wa.headline || `${wa.event} (${wa.severity})`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fuel + Hazmat + Fire + Seismic grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Fuel Prices */}
                {(routeIntel.fuelPrices || []).length > 0 && (
                  <div className={cellCls}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Fuel className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[10px] text-slate-400 uppercase">Diesel</span>
                    </div>
                    {routeIntel.fuelPrices.map((fp: any) => (
                      <div key={fp.state} className="flex items-center justify-between">
                        <span className={cn("text-xs", isLight ? "text-slate-600" : "text-slate-300")}>{fp.state}</span>
                        <span className={cn("text-sm font-bold", isLight ? "text-slate-800" : "text-white")}>
                          ${fp.price.toFixed(2)}
                          {fp.change !== 0 && (
                            <span className={cn("text-[10px] ml-1", fp.change > 0 ? "text-red-400" : "text-emerald-400")}>
                              {fp.change > 0 ? "+" : ""}{fp.change.toFixed(2)}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hazmat Incidents */}
                <div className={cellCls}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Radio className="w-3.5 h-3.5 text-purple-500" />
                    <span className="text-[10px] text-slate-400 uppercase">Hazmat (90d)</span>
                  </div>
                  <p className={cn("text-lg font-bold", routeIntel.hazmatIncidents > 5 ? "text-red-400" : isLight ? "text-slate-800" : "text-white")}>
                    {routeIntel.hazmatIncidents}
                  </p>
                  <p className="text-[10px] text-slate-400">incidents on route</p>
                </div>

                {/* Wildfires */}
                {routeIntel.wildfires > 0 && (
                  <div className={cellCls}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-[10px] text-slate-400 uppercase">Wildfires</span>
                    </div>
                    <p className={cn("text-lg font-bold text-orange-400")}>{routeIntel.wildfires}</p>
                    <p className="text-[10px] text-slate-400">active in corridor</p>
                  </div>
                )}

                {/* Earthquakes */}
                {routeIntel.earthquakes > 0 && (
                  <div className={cellCls}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Activity className="w-3.5 h-3.5 text-cyan-500" />
                      <span className="text-[10px] text-slate-400 uppercase">Seismic</span>
                    </div>
                    <p className={cn("text-lg font-bold text-cyan-400")}>{routeIntel.earthquakes}</p>
                    <p className="text-[10px] text-slate-400">M2.5+ (30d)</p>
                  </div>
                )}
              </div>

              {/* FEMA Disasters */}
              {(routeIntel.femaDisasters || []).length > 0 && (
                <div className={cn("p-3 rounded-xl border", isLight ? "bg-red-50 border-red-200" : "bg-red-500/10 border-red-500/20")}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className={cn("text-xs font-semibold", isLight ? "text-red-700" : "text-red-300")}>
                      FEMA Disaster Declarations
                    </span>
                  </div>
                  {routeIntel.femaDisasters.slice(0, 2).map((d: any, i: number) => (
                    <p key={i} className={cn("text-[11px] leading-snug", isLight ? "text-red-600/80" : "text-red-300/80")}>
                      {d.state}: {d.title || d.type}
                    </p>
                  ))}
                </div>
              )}

              {/* No alerts — all clear */}
              {(routeIntel.weatherAlerts || []).length === 0 && routeIntel.wildfires === 0 && (routeIntel.femaDisasters || []).length === 0 && (
                <div className={cn("flex items-center gap-2 p-3 rounded-xl border", isLight ? "bg-emerald-50 border-emerald-200" : "bg-emerald-500/10 border-emerald-500/20")}>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className={cn("text-xs font-medium", isLight ? "text-emerald-700" : "text-emerald-300")}>
                    No active weather, fire, or disaster alerts on this route
                  </span>
                </div>
              )}

              <p className="text-[9px] text-slate-400 mt-1">
                Sources: NWS, EIA, PHMSA, NIFC, USGS, FEMA, FMCSA
              </p>
            </CardContent>
          </Card>
        )}

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
                { label: "Equipment", value: getEquipmentLabel(load.equipmentType, load.cargoType, load.hazmatClass), icon: <Truck className="w-4 h-4 text-blue-500" /> },
                { label: "Weight", value: `${Number(load.weight || 0).toLocaleString()} ${load.weightUnit || "Lbs"}`, icon: <Package className="w-4 h-4 text-purple-500" /> },
                { label: "Commodity", value: getLoadTitle(load), icon: <Package className="w-4 h-4 text-orange-500" /> },
                { label: "Cargo Type", value: (load.cargoType || "general").charAt(0).toUpperCase() + (load.cargoType || "general").slice(1), icon: <FileText className="w-4 h-4 text-cyan-500" /> },
              ].map((item) => (
                <div key={item.label} className={cellCls}>
                  <div className="flex items-center gap-2 mb-1">{item.icon}<span className="text-[10px] text-slate-400 uppercase">{item.label}</span></div>
                  <p className={valCls}>{item.value}</p>
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

        {/* ═══════════ EUSOTICKET RECEIPT ═══════════ */}
        <Card className={cn("lg:col-span-2 rounded-2xl border overflow-hidden", isLight ? "bg-white border-slate-200 shadow-md" : "bg-slate-800/60 border-slate-700/50")}>
          <CardHeader className="pb-3">
            <CardTitle className={cn(titleCls, "flex items-center gap-2")}>
              <Receipt className="w-5 h-5 text-emerald-500" />EusoTicket Receipt
              <Badge className="ml-auto bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 text-[10px]">
                {load.loadNumber || `#${String(load.id).slice(0, 8)}`}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Rate & Settlement Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={cellCls}>
                <div className="flex items-center gap-1.5 mb-1"><DollarSign className="w-3.5 h-3.5 text-emerald-500" /><span className="text-[10px] text-slate-400 uppercase">Agreed Rate</span></div>
                <p className="text-lg font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${rate.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400">${ratePerMile}/mi</p>
              </div>
              {isInvolvedParty && <div className={cellCls}>
                <div className="flex items-center gap-1.5 mb-1"><Scale className="w-3.5 h-3.5 text-purple-500" /><span className="text-[10px] text-slate-400 uppercase">Platform Fee</span></div>
                {platformFeeQuery.data ? (
                  <>
                    <p className={cn("text-lg font-bold", isLight ? "text-purple-600" : "text-purple-400")}>${platformFeeQuery.data.platformFeeAmount?.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-400">{platformFeeQuery.data.platformFeePercent}% + ${platformFeeQuery.data.paymentProcessingFee?.toFixed(2)} processing</p>
                  </>
                ) : (
                  <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>--</p>
                )}
              </div>}
              {isInvolvedParty && <div className={cellCls}>
                <div className="flex items-center gap-1.5 mb-1"><ArrowRight className="w-3.5 h-3.5 text-emerald-500" /><span className="text-[10px] text-slate-400 uppercase">Carrier Receives</span></div>
                {platformFeeQuery.data ? (
                  <p className="text-lg font-bold text-emerald-500">${platformFeeQuery.data.carrierReceives?.toFixed(2)}</p>
                ) : (
                  <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>--</p>
                )}
              </div>}
              {isInvolvedParty && <div className={cellCls}>
                <div className="flex items-center gap-1.5 mb-1"><DollarSign className="w-3.5 h-3.5 text-red-500" /><span className="text-[10px] text-slate-400 uppercase">Shipper Owes</span></div>
                {platformFeeQuery.data ? (
                  <p className={cn("text-lg font-bold", isLight ? "text-red-600" : "text-red-400")}>${platformFeeQuery.data.shipperPays?.toFixed(2)}</p>
                ) : (
                  <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>--</p>
                )}
              </div>}
            </div>

            {/* Schedule A Rate Reference (tanker/barrel loads) */}
            {scheduleARateQuery.data && distance > 0 && (
              <div className={cn("p-4 rounded-xl border", isLight ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200" : "bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-amber-500/20")}>
                <div className="flex items-center gap-2 mb-2">
                  <Scale className="w-4 h-4 text-amber-500" />
                  <span className={cn("text-xs font-bold uppercase tracking-wider", isLight ? "text-amber-700" : "text-amber-300")}>Schedule A Reference Rate</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase">Rate/BBL</p>
                    <p className={cn("text-sm font-bold", isLight ? "text-slate-800" : "text-white")}>${scheduleARateQuery.data.ratePerBarrel?.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase">Base</p>
                    <p className={cn("text-sm font-bold", isLight ? "text-amber-600" : "text-amber-300")}>${scheduleARateQuery.data.baseAmount?.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase">FSC</p>
                    <p className={cn("text-sm font-bold", isLight ? "text-slate-800" : "text-white")}>{scheduleARateQuery.data.fsc > 0 ? `$${scheduleARateQuery.data.fsc.toFixed(2)}` : "$0"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase">Sched A Total</p>
                    <p className="text-sm font-bold text-emerald-500">${scheduleARateQuery.data.totalAmount?.toFixed(2)}</p>
                  </div>
                </div>
                {rate > 0 && scheduleARateQuery.data.totalAmount > 0 && (
                  <div className={cn("mt-2 text-[10px] flex items-center gap-1", rate >= scheduleARateQuery.data.totalAmount ? (isLight ? "text-emerald-600" : "text-emerald-400") : (isLight ? "text-red-600" : "text-red-400"))}>
                    <CheckCircle className="w-3 h-3" />
                    Agreed rate ${rate.toLocaleString()} is {rate >= scheduleARateQuery.data.totalAmount ? "at or above" : "below"} Schedule A reference (${scheduleARateQuery.data.totalAmount.toFixed(2)})
                  </div>
                )}
              </div>
            )}

            {/* Product Requirement Verification */}
            <div className={cn("p-4 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/40 border-slate-700/30")}>
              <p className={cn("text-[10px] font-semibold uppercase tracking-wider mb-2", isLight ? "text-slate-500" : "text-slate-400")}>Product & Equipment Verification</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className={cn("w-3.5 h-3.5", load.commodity ? "text-emerald-500" : "text-slate-400")} />
                  <span className={cn("text-xs", isLight ? "text-slate-600" : "text-slate-300")}>{load.commodity || "Product TBD"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={cn("w-3.5 h-3.5", load.equipmentType ? "text-emerald-500" : "text-slate-400")} />
                  <span className={cn("text-xs capitalize", isLight ? "text-slate-600" : "text-slate-300")}>{load.equipmentType || "Equipment TBD"}</span>
                </div>
                <div className="flex items-center gap-2">
                  {load.hazmatClass ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                  <span className={cn("text-xs", isLight ? "text-slate-600" : "text-slate-300")}>{load.hazmatClass ? `Hazmat Class ${load.hazmatClass}` : "Non-Hazmat"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={cn("w-3.5 h-3.5", Number(load.weight) > 0 ? "text-emerald-500" : "text-slate-400")} />
                  <span className={cn("text-xs", isLight ? "text-slate-600" : "text-slate-300")}>{Number(load.weight || 0).toLocaleString()} {load.weightUnit || "lbs"}</span>
                </div>
              </div>
            </div>

            {/* EusoTicket Documents — only for involved parties */}
            {isInvolvedParty && eusoTicketDocsQuery.data?.documents?.length > 0 && (
              <div>
                <p className={cn("text-[10px] font-semibold uppercase tracking-wider mb-2", isLight ? "text-slate-500" : "text-slate-400")}>Related Documents</p>
                <div className="space-y-1.5">
                  {eusoTicketDocsQuery.data.documents.slice(0, 5).map((doc: any) => {
                    const typeIcon: Record<string, React.ReactNode> = {
                      bol: <FileText className="w-3.5 h-3.5 text-blue-500" />,
                      run_ticket: <Droplets className="w-3.5 h-3.5 text-amber-500" />,
                      rate_sheet: <Scale className="w-3.5 h-3.5 text-purple-500" />,
                      reconciliation: <Receipt className="w-3.5 h-3.5 text-emerald-500" />,
                    };
                    const typeLabel: Record<string, string> = { bol: "BOL", run_ticket: "Run Ticket", rate_sheet: "Rate Sheet", reconciliation: "Reconciliation" };
                    return (
                      <div key={doc.id} className={cn("flex items-center justify-between px-3 py-2 rounded-lg border", isLight ? "bg-white border-slate-200 hover:bg-slate-50" : "bg-slate-800/50 border-slate-700/30 hover:bg-slate-700/20")}>
                        <div className="flex items-center gap-2">
                          {typeIcon[doc.type] || <FileText className="w-3.5 h-3.5 text-slate-400" />}
                          <span className={cn("text-xs", isLight ? "text-slate-700" : "text-slate-300")}>{doc.name}</span>
                          <Badge className={cn("text-[8px] border-0", doc.type === "bol" ? "bg-blue-500/15 text-blue-500" : doc.type === "run_ticket" ? "bg-amber-500/15 text-amber-500" : doc.type === "rate_sheet" ? "bg-purple-500/15 text-purple-500" : "bg-emerald-500/15 text-emerald-500")}>
                            {typeLabel[doc.type] || doc.type}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-white" onClick={() => downloadDocument(doc)}><Download className="w-3 h-3" /></Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Settlement Flow — only for involved parties */}
            {isInvolvedParty && platformFeeQuery.data && rate > 0 && (
              <div className={cn("p-3 rounded-xl border", isLight ? "bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-blue-200/50" : "bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-blue-500/20")}>
                <p className={cn("text-[10px] font-semibold uppercase tracking-wider mb-2", isLight ? "text-slate-500" : "text-slate-400")}>Settlement Flow</p>
                <div className="flex items-center justify-between text-xs">
                  <div className="text-center">
                    <p className={cn("font-semibold", isLight ? "text-slate-700" : "text-slate-300")}>Shipper</p>
                    <p className={cn("text-[10px]", isLight ? "text-red-600" : "text-red-400")}>${platformFeeQuery.data.shipperPays?.toFixed(2)}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <div className="text-center">
                    <p className="font-semibold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">EusoTrip</p>
                    <p className={cn("text-[10px]", isLight ? "text-purple-600" : "text-purple-400")}>${platformFeeQuery.data.platformFeeAmount?.toFixed(2)} fee</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <div className="text-center">
                    <p className={cn("font-semibold", isLight ? "text-slate-700" : "text-slate-300")}>Carrier</p>
                    <p className="text-[10px] text-emerald-500">${platformFeeQuery.data.carrierReceives?.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions — only for involved parties on assigned+ loads */}
            {isInvolvedParty && isPostAssignment && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className={cn("rounded-lg text-xs", isLight ? "border-slate-200 hover:bg-slate-50" : "border-slate-700 hover:bg-slate-700")} onClick={() => setLocation("/docks")}>
                  <FileText className="w-3.5 h-3.5 mr-1.5" />Generate BOL
                </Button>
                <Button variant="outline" size="sm" className={cn("rounded-lg text-xs", isLight ? "border-slate-200 hover:bg-slate-50" : "border-slate-700 hover:bg-slate-700")} onClick={() => setLocation("/docks")}>
                  <Droplets className="w-3.5 h-3.5 mr-1.5" />Create Run Ticket
                </Button>
                <Button variant="outline" size="sm" className={cn("rounded-lg text-xs", isLight ? "border-slate-200 hover:bg-slate-50" : "border-slate-700 hover:bg-slate-700")} onClick={() => setLocation("/rate-sheet")}>
                  <Receipt className="w-3.5 h-3.5 mr-1.5" />Reconciliation
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

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
