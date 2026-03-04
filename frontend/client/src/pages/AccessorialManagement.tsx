/**
 * ACCESSORIAL MANAGEMENT PAGE — Revenue Stream 12
 * Full lifecycle: submit claims, approve/deny, fee schedule, dashboard stats, auto-invoicing
 * Wired to: trpc.accessorial.* router
 * Roles: Driver (submit), Carrier/Fleet (review), Shipper (approve/pay), Dispatcher (monitor), Admin (override)
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Clock, DollarSign, AlertTriangle, CheckCircle, XCircle,
  FileText, TrendingUp, Receipt, Truck, Upload,
  Calculator, ArrowUpRight, BarChart3, Loader2,
  ChevronRight, Eye, ThumbsUp, ThumbsDown, Ban,
  Timer, MapPin, Package, Gavel,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

// ── Accessorial type labels ────────────────────────────────────────────────
const ACCESSORIAL_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  detention: { label: "Detention", icon: <Clock className="w-4 h-4" />, color: "text-red-400" },
  lumper: { label: "Lumper", icon: <Package className="w-4 h-4" />, color: "text-amber-400" },
  tonu: { label: "TONU", icon: <Ban className="w-4 h-4" />, color: "text-rose-400" },
  layover: { label: "Layover", icon: <Timer className="w-4 h-4" />, color: "text-purple-400" },
  driver_assist: { label: "Driver Assist", icon: <Truck className="w-4 h-4" />, color: "text-blue-400" },
  reweigh: { label: "Reweigh", icon: <Calculator className="w-4 h-4" />, color: "text-cyan-400" },
  reconsignment: { label: "Reconsignment", icon: <ArrowUpRight className="w-4 h-4" />, color: "text-indigo-400" },
  stop_off: { label: "Stop-Off", icon: <MapPin className="w-4 h-4" />, color: "text-teal-400" },
  tarping: { label: "Tarping", icon: <Package className="w-4 h-4" />, color: "text-orange-400" },
  tank_washout: { label: "Tank Washout", icon: <Package className="w-4 h-4" />, color: "text-sky-400" },
  pump_time: { label: "Pump Time", icon: <Timer className="w-4 h-4" />, color: "text-violet-400" },
  pre_cool: { label: "Pre-Cool", icon: <Package className="w-4 h-4" />, color: "text-cyan-400" },
  inside_delivery: { label: "Inside Delivery", icon: <Package className="w-4 h-4" />, color: "text-emerald-400" },
  liftgate: { label: "Liftgate", icon: <Package className="w-4 h-4" />, color: "text-lime-400" },
  dry_run: { label: "Dry Run", icon: <Ban className="w-4 h-4" />, color: "text-red-400" },
  escort_fee: { label: "Escort", icon: <Truck className="w-4 h-4" />, color: "text-fuchsia-400" },
  other: { label: "Other", icon: <FileText className="w-4 h-4" />, color: "text-slate-400" },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", bg: "bg-slate-500/20", text: "text-slate-400", icon: <FileText className="w-3 h-3" /> },
  submitted: { label: "Submitted", bg: "bg-blue-500/20", text: "text-blue-400", icon: <ArrowUpRight className="w-3 h-3" /> },
  pending_review: { label: "Pending Review", bg: "bg-amber-500/20", text: "text-amber-400", icon: <Clock className="w-3 h-3" /> },
  approved: { label: "Approved", bg: "bg-emerald-500/20", text: "text-emerald-400", icon: <CheckCircle className="w-3 h-3" /> },
  disputed: { label: "Disputed", bg: "bg-orange-500/20", text: "text-orange-400", icon: <AlertTriangle className="w-3 h-3" /> },
  denied: { label: "Denied", bg: "bg-red-500/20", text: "text-red-400", icon: <XCircle className="w-3 h-3" /> },
  paid: { label: "Paid", bg: "bg-green-500/20", text: "text-green-400", icon: <DollarSign className="w-3 h-3" /> },
  voided: { label: "Voided", bg: "bg-slate-500/20", text: "text-slate-500", icon: <Ban className="w-3 h-3" /> },
};

export default function AccessorialManagement() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState("dashboard");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedClaim, setSelectedClaim] = useState<number | null>(null);

  // ── Submit claim form state ──
  const [claimForm, setClaimForm] = useState({
    loadId: "",
    type: "detention" as string,
    amount: "",
    description: "",
    facilityName: "",
    arrivalTime: "",
    departureTime: "",
  });

  // ── Queries ──
  const statsQuery = trpc.accessorial.getDashboardStats.useQuery({ period: "30d" });
  const claimsQuery = trpc.accessorial.getClaims.useQuery(
    statusFilter === "all" ? undefined : { status: statusFilter as any }
  );
  const feeScheduleQuery = trpc.accessorial.getFeeSchedule.useQuery();
  const claimDetailQuery = trpc.accessorial.getClaimById.useQuery(
    { claimId: selectedClaim! },
    { enabled: !!selectedClaim }
  );

  // ── Mutations ──
  const submitClaim = trpc.accessorial.submitClaim.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.type} claim submitted`, {
        description: `Claim #${data.claimId} — $${data.amount?.toFixed(2)} (platform fee: $${data.platformFee?.toFixed(2)})`,
      });
      setClaimForm({ loadId: "", type: "detention", amount: "", description: "", facilityName: "", arrivalTime: "", departureTime: "" });
      claimsQuery.refetch();
      statsQuery.refetch();
    },
    onError: (err) => toast.error("Failed to submit claim", { description: err.message }),
  });

  const updateStatus = trpc.accessorial.updateClaimStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`Claim updated to ${data.newStatus}`);
      claimsQuery.refetch();
      statsQuery.refetch();
      if (selectedClaim) claimDetailQuery.refetch();
    },
    onError: (err) => toast.error("Failed to update claim", { description: err.message }),
  });

  const stats = statsQuery.data;
  const claims = claimsQuery.data;

  const handleSubmitClaim = () => {
    const loadId = parseInt(claimForm.loadId, 10);
    const amount = parseFloat(claimForm.amount);
    if (!loadId || !amount) {
      toast.error("Load ID and Amount are required");
      return;
    }
    submitClaim.mutate({
      loadId,
      type: claimForm.type as any,
      amount,
      description: claimForm.description || undefined,
      facilityName: claimForm.facilityName || undefined,
      arrivalTime: claimForm.arrivalTime || undefined,
      departureTime: claimForm.departureTime || undefined,
    });
  };

  // ── Stat card helper ──
  const StatCard = ({ icon, label, value, color, prefix = "" }: { icon: React.ReactNode; label: string; value: number | string; color: string; prefix?: string }) => (
    <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-full", color.replace("text-", "bg-").replace("400", "500/20"))}>{icon}</div>
          <div>
            {statsQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
              <p className={cn("text-2xl font-bold", color)}>{prefix}{typeof value === "number" ? value.toLocaleString() : value}</p>
            )}
            <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Accessorial & Lumper Management
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Revenue Stream 12 — Detention, lumper, TONU, layover & specialized fees · 3.5% platform facilitation
          </p>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs px-3 py-1">
          <TrendingUp className="w-3 h-3 mr-1" />
          Platform Fee: 3.5%
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={cn("w-full sm:w-auto", isLight ? "bg-slate-100" : "bg-slate-800/80")}>
          <TabsTrigger value="dashboard"><BarChart3 className="w-4 h-4 mr-1" />Dashboard</TabsTrigger>
          <TabsTrigger value="claims"><FileText className="w-4 h-4 mr-1" />Claims</TabsTrigger>
          <TabsTrigger value="submit"><Upload className="w-4 h-4 mr-1" />Submit Claim</TabsTrigger>
          <TabsTrigger value="fees"><Receipt className="w-4 h-4 mr-1" />Fee Schedule</TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 1: DASHBOARD
         ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={<FileText className="w-6 h-6 text-blue-400" />} label="Total Claims" value={stats?.totalClaims || 0} color="text-blue-400" />
            <StatCard icon={<Clock className="w-6 h-6 text-amber-400" />} label="Pending" value={stats?.pendingClaims || 0} color="text-amber-400" />
            <StatCard icon={<CheckCircle className="w-6 h-6 text-emerald-400" />} label="Approved" value={stats?.approvedClaims || 0} color="text-emerald-400" />
            <StatCard icon={<DollarSign className="w-6 h-6 text-green-400" />} label="Total Amount" value={`$${(stats?.totalAmount || 0).toLocaleString()}`} color="text-green-400" />
            <StatCard icon={<TrendingUp className="w-6 h-6 text-purple-400" />} label="Platform Revenue" value={`$${(stats?.platformRevenue || 0).toLocaleString()}`} color="text-purple-400" />
          </div>

          {/* By Type Breakdown */}
          <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-lg font-semibold", isLight ? "text-slate-800" : "text-white")}>Claims by Type</CardTitle>
            </CardHeader>
            <CardContent>
              {statsQuery.isLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : stats?.byType && stats.byType.length > 0 ? (
                <div className="space-y-3">
                  {stats.byType.sort((a, b) => b.amount - a.amount).map((item) => {
                    const config = ACCESSORIAL_LABELS[item.type] || ACCESSORIAL_LABELS.other;
                    const pct = stats.totalAmount > 0 ? (item.amount / stats.totalAmount) * 100 : 0;
                    return (
                      <div key={item.type} className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.color.replace("text-", "bg-").replace("400", "500/20"))}>
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-200")}>{config.label}</span>
                            <span className={cn("text-sm", config.color)}>{item.count} claims · ${item.amount.toLocaleString()}</span>
                          </div>
                          <div className={cn("h-2 rounded-full overflow-hidden", isLight ? "bg-slate-100" : "bg-slate-700")}>
                            <div className={cn("h-full rounded-full", config.color.replace("text-", "bg-"))} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className={cn("text-sm text-center py-8", isLight ? "text-slate-400" : "text-slate-500")}>No claims in this period</p>
              )}
            </CardContent>
          </Card>

          {/* Quick metrics row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
              <CardContent className="p-4 text-center">
                <p className={cn("text-2xl font-bold", isLight ? "text-slate-800" : "text-white")}>
                  ${stats?.avgClaimAmount?.toFixed(0) || 0}
                </p>
                <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>Avg Claim Amount</p>
              </CardContent>
            </Card>
            <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-amber-400">{stats?.disputedClaims || 0}</p>
                <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>Disputed</p>
              </CardContent>
            </Card>
            <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-400">{stats?.paidClaims || 0}</p>
                <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>Paid Out</p>
              </CardContent>
            </Card>
            <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
                  {stats?.totalClaims ? Math.round(((stats?.approvedClaims || 0) + (stats?.paidClaims || 0)) / stats.totalClaims * 100) : 0}%
                </p>
                <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>Approval Rate</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 2: CLAIMS LIST
         ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="claims" className="space-y-4">
          {/* Filter bar */}
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={cn("w-48", isLight ? "bg-white border-slate-200" : "bg-slate-800 border-slate-700")}>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            <span className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
              {claims?.total || 0} claims
            </span>
          </div>

          {/* Claims list + detail split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Claims list */}
            <div className="lg:col-span-2 space-y-2">
              {claimsQuery.isLoading ? (
                <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
              ) : claims?.claims && claims.claims.length > 0 ? (
                claims.claims.map((claim: any) => {
                  const typeConfig = ACCESSORIAL_LABELS[claim.accessorialType] || ACCESSORIAL_LABELS.other;
                  const statusConfig = STATUS_CONFIG[claim.status] || STATUS_CONFIG.draft;
                  const isSelected = selectedClaim === claim.id;
                  return (
                    <Card
                      key={claim.id}
                      onClick={() => setSelectedClaim(claim.id)}
                      className={cn(
                        "rounded-xl border cursor-pointer transition-all",
                        isSelected ? "ring-2 ring-blue-500 border-blue-500/50" : "",
                        isLight ? "bg-white border-slate-200 hover:border-slate-300" : "bg-slate-800/50 border-slate-700/50 hover:border-slate-600"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", typeConfig.color.replace("text-", "bg-").replace("400", "500/20"))}>
                              {typeConfig.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white")}>{typeConfig.label}</span>
                                <Badge className={cn("border-0 text-[10px]", statusConfig.bg, statusConfig.text)}>
                                  {statusConfig.icon}
                                  <span className="ml-1">{statusConfig.label}</span>
                                </Badge>
                              </div>
                              <p className={cn("text-xs mt-0.5", isLight ? "text-slate-500" : "text-slate-400")}>
                                Load #{claim.loadId} · {claim.facilityName || "N/A"} · {claim.claimedByName || `User #${claim.claimedByUserId}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>${claim.totalAmount?.toFixed(2)}</p>
                            <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>
                              Fee: ${claim.platformFee?.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
                  <CardContent className="p-12 text-center">
                    <FileText className={cn("w-12 h-12 mx-auto mb-3", isLight ? "text-slate-300" : "text-slate-600")} />
                    <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>No claims found</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Claim detail panel */}
            <div>
              {selectedClaim ? (
                <Card className={cn("rounded-xl border sticky top-4", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
                  <CardHeader className="pb-3">
                    <CardTitle className={cn("text-sm font-semibold", isLight ? "text-slate-800" : "text-white")}>
                      Claim #{selectedClaim}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {claimDetailQuery.isLoading ? (
                      <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
                    ) : claimDetailQuery.data ? (
                      <>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className={isLight ? "text-slate-500" : "text-slate-400"}>Type</span>
                            <span className={cn("font-medium", isLight ? "text-slate-800" : "text-white")}>
                              {(ACCESSORIAL_LABELS[claimDetailQuery.data.accessorialType] || ACCESSORIAL_LABELS.other).label}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={isLight ? "text-slate-500" : "text-slate-400"}>Amount</span>
                            <span className="font-bold text-green-400">${claimDetailQuery.data.totalAmount?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={isLight ? "text-slate-500" : "text-slate-400"}>Platform Fee</span>
                            <span className="text-purple-400">${claimDetailQuery.data.platformFee?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={isLight ? "text-slate-500" : "text-slate-400"}>Load</span>
                            <span className={isLight ? "text-slate-800" : "text-white"}>#{claimDetailQuery.data.loadId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={isLight ? "text-slate-500" : "text-slate-400"}>Facility</span>
                            <span className={isLight ? "text-slate-800" : "text-white"}>{claimDetailQuery.data.facilityName || "N/A"}</span>
                          </div>
                          {claimDetailQuery.data.billableMinutes && (
                            <div className="flex justify-between">
                              <span className={isLight ? "text-slate-500" : "text-slate-400"}>Billable Minutes</span>
                              <span className={isLight ? "text-slate-800" : "text-white"}>{claimDetailQuery.data.billableMinutes}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className={isLight ? "text-slate-500" : "text-slate-400"}>Status</span>
                            {(() => {
                              const sc = STATUS_CONFIG[claimDetailQuery.data.status] || STATUS_CONFIG.draft;
                              return <Badge className={cn("border-0 text-[10px]", sc.bg, sc.text)}>{sc.icon}<span className="ml-1">{sc.label}</span></Badge>;
                            })()}
                          </div>
                          {claimDetailQuery.data.notes && (
                            <div className="pt-2">
                              <span className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>Notes</span>
                              <p className={cn("text-xs mt-1 p-2 rounded-lg", isLight ? "bg-slate-50 text-slate-700" : "bg-slate-900/50 text-slate-300")}>
                                {claimDetailQuery.data.notes}
                              </p>
                            </div>
                          )}
                          {claimDetailQuery.data.disputeReason && (
                            <div className="pt-2">
                              <span className="text-xs text-orange-400">Dispute Reason</span>
                              <p className="text-xs mt-1 p-2 rounded-lg bg-orange-500/10 text-orange-300">{claimDetailQuery.data.disputeReason}</p>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        {(claimDetailQuery.data.status === "pending_review" || claimDetailQuery.data.status === "submitted") && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => updateStatus.mutate({ claimId: selectedClaim, action: "approve" })}
                              disabled={updateStatus.isPending}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                            >
                              <ThumbsUp className="w-3 h-3 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus.mutate({ claimId: selectedClaim, action: "dispute", reason: "Requires additional documentation" })}
                              disabled={updateStatus.isPending}
                              className="flex-1 border-orange-500/50 text-orange-400 hover:bg-orange-500/10 text-xs"
                            >
                              <Gavel className="w-3 h-3 mr-1" /> Dispute
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus.mutate({ claimId: selectedClaim, action: "deny", reason: "Claim denied" })}
                              disabled={updateStatus.isPending}
                              className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10 text-xs"
                            >
                              <ThumbsDown className="w-3 h-3 mr-1" /> Deny
                            </Button>
                          </div>
                        )}
                        {claimDetailQuery.data.status === "approved" && (
                          <Button
                            size="sm"
                            onClick={() => updateStatus.mutate({ claimId: selectedClaim, action: "pay" })}
                            disabled={updateStatus.isPending}
                            className="w-full bg-green-600 hover:bg-green-700 text-white text-xs"
                          >
                            <DollarSign className="w-3 h-3 mr-1" /> Mark as Paid
                          </Button>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">Claim not found</p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
                  <CardContent className="p-12 text-center">
                    <Eye className={cn("w-10 h-10 mx-auto mb-2", isLight ? "text-slate-300" : "text-slate-600")} />
                    <p className={cn("text-sm", isLight ? "text-slate-400" : "text-slate-500")}>Select a claim to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 3: SUBMIT CLAIM
         ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="submit" className="space-y-4">
          <Card className={cn("rounded-xl border max-w-2xl", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
            <CardHeader>
              <CardTitle className={cn("text-lg", isLight ? "text-slate-800" : "text-white")}>Submit Accessorial Claim</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn("text-xs font-medium mb-1 block", isLight ? "text-slate-600" : "text-slate-400")}>Load ID *</label>
                  <Input
                    type="number"
                    placeholder="e.g. 1234"
                    value={claimForm.loadId}
                    onChange={(e) => setClaimForm(f => ({ ...f, loadId: e.target.value }))}
                    className={isLight ? "bg-white border-slate-200" : "bg-slate-900/50 border-slate-700"}
                  />
                </div>
                <div>
                  <label className={cn("text-xs font-medium mb-1 block", isLight ? "text-slate-600" : "text-slate-400")}>Type *</label>
                  <Select value={claimForm.type} onValueChange={(v) => setClaimForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger className={isLight ? "bg-white border-slate-200" : "bg-slate-900/50 border-slate-700"}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="detention">Detention</SelectItem>
                      <SelectItem value="lumper">Lumper</SelectItem>
                      <SelectItem value="tonu">TONU (Truck Ordered Not Used)</SelectItem>
                      <SelectItem value="layover">Layover</SelectItem>
                      <SelectItem value="driver_assist">Driver Assist</SelectItem>
                      <SelectItem value="reweigh">Reweigh</SelectItem>
                      <SelectItem value="reconsignment">Reconsignment</SelectItem>
                      <SelectItem value="stop_off">Stop-Off</SelectItem>
                      <SelectItem value="tarping">Tarping</SelectItem>
                      <SelectItem value="tank_washout">Tank Washout</SelectItem>
                      <SelectItem value="pump_time">Pump Time</SelectItem>
                      <SelectItem value="pre_cool">Pre-Cool (Reefer)</SelectItem>
                      <SelectItem value="inside_delivery">Inside Delivery</SelectItem>
                      <SelectItem value="liftgate">Liftgate</SelectItem>
                      <SelectItem value="dry_run">Dry Run</SelectItem>
                      <SelectItem value="escort_fee">Escort</SelectItem>
                      <SelectItem value="blow_off">Blow-Off (Hopper)</SelectItem>
                      <SelectItem value="heel_disposal">Heel Disposal</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn("text-xs font-medium mb-1 block", isLight ? "text-slate-600" : "text-slate-400")}>Amount ($) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={claimForm.amount}
                    onChange={(e) => setClaimForm(f => ({ ...f, amount: e.target.value }))}
                    className={isLight ? "bg-white border-slate-200" : "bg-slate-900/50 border-slate-700"}
                  />
                </div>
                <div>
                  <label className={cn("text-xs font-medium mb-1 block", isLight ? "text-slate-600" : "text-slate-400")}>Facility Name</label>
                  <Input
                    placeholder="e.g. Terminal XYZ"
                    value={claimForm.facilityName}
                    onChange={(e) => setClaimForm(f => ({ ...f, facilityName: e.target.value }))}
                    className={isLight ? "bg-white border-slate-200" : "bg-slate-900/50 border-slate-700"}
                  />
                </div>
              </div>

              {claimForm.type === "detention" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={cn("text-xs font-medium mb-1 block", isLight ? "text-slate-600" : "text-slate-400")}>Arrival Time</label>
                    <Input
                      type="datetime-local"
                      value={claimForm.arrivalTime}
                      onChange={(e) => setClaimForm(f => ({ ...f, arrivalTime: e.target.value }))}
                      className={isLight ? "bg-white border-slate-200" : "bg-slate-900/50 border-slate-700"}
                    />
                  </div>
                  <div>
                    <label className={cn("text-xs font-medium mb-1 block", isLight ? "text-slate-600" : "text-slate-400")}>Departure Time</label>
                    <Input
                      type="datetime-local"
                      value={claimForm.departureTime}
                      onChange={(e) => setClaimForm(f => ({ ...f, departureTime: e.target.value }))}
                      className={isLight ? "bg-white border-slate-200" : "bg-slate-900/50 border-slate-700"}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className={cn("text-xs font-medium mb-1 block", isLight ? "text-slate-600" : "text-slate-400")}>Description / Notes</label>
                <Textarea
                  placeholder="Describe the accessorial charge..."
                  rows={3}
                  value={claimForm.description}
                  onChange={(e) => setClaimForm(f => ({ ...f, description: e.target.value }))}
                  className={isLight ? "bg-white border-slate-200" : "bg-slate-900/50 border-slate-700"}
                />
              </div>

              {/* Preview */}
              {claimForm.amount && (
                <div className={cn("rounded-lg p-3 text-sm", isLight ? "bg-blue-50 border border-blue-100" : "bg-blue-500/10 border border-blue-500/20")}>
                  <p className={cn("font-medium mb-1", isLight ? "text-blue-700" : "text-blue-400")}>Claim Preview</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className={isLight ? "text-blue-500" : "text-blue-300"}>Gross</span>
                      <p className={cn("font-bold", isLight ? "text-blue-800" : "text-white")}>${parseFloat(claimForm.amount || "0").toFixed(2)}</p>
                    </div>
                    <div>
                      <span className={isLight ? "text-blue-500" : "text-blue-300"}>Platform Fee (3.5%)</span>
                      <p className="font-bold text-purple-400">${(parseFloat(claimForm.amount || "0") * 0.035).toFixed(2)}</p>
                    </div>
                    <div>
                      <span className={isLight ? "text-blue-500" : "text-blue-300"}>Net to Carrier</span>
                      <p className="font-bold text-emerald-400">${(parseFloat(claimForm.amount || "0") * 0.965).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSubmitClaim}
                disabled={submitClaim.isPending || !claimForm.loadId || !claimForm.amount}
                className="w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white hover:opacity-90"
              >
                {submitClaim.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Submit Claim
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 4: FEE SCHEDULE
         ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="fees" className="space-y-4">
          <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className={cn("text-lg", isLight ? "text-slate-800" : "text-white")}>Accessorial Fee Schedule</CardTitle>
                <Badge className="bg-purple-500/20 text-purple-400 border-0 text-xs">
                  {feeScheduleQuery.data?.platformFeePercent || 3.5}% Platform Fee
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {feeScheduleQuery.isLoading ? (
                <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : feeScheduleQuery.data?.schedule ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(feeScheduleQuery.data.schedule).map(([key, schedule]: [string, any]) => {
                    const config = ACCESSORIAL_LABELS[key] || { label: key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim(), icon: <Receipt className="w-4 h-4" />, color: "text-slate-400" };
                    return (
                      <div
                        key={key}
                        className={cn("rounded-lg p-3 border", isLight ? "bg-slate-50 border-slate-100" : "bg-slate-900/30 border-slate-700/30")}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className={config.color}>{config.icon}</span>
                          <span className={cn("text-sm font-medium capitalize", isLight ? "text-slate-800" : "text-white")}>{config.label}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {schedule.flatRate !== undefined && (
                            <Badge variant="outline" className="text-[10px]">Flat: ${schedule.flatRate}</Badge>
                          )}
                          {schedule.ratePerHour !== undefined && (
                            <Badge variant="outline" className="text-[10px]">${schedule.ratePerHour}/hr</Badge>
                          )}
                          {schedule.dailyRate !== undefined && (
                            <Badge variant="outline" className="text-[10px]">${schedule.dailyRate}/day</Badge>
                          )}
                          {schedule.freeTimeMinutes !== undefined && (
                            <Badge variant="outline" className="text-[10px]">Free: {schedule.freeTimeMinutes}min</Badge>
                          )}
                          {schedule.freeTimeHours !== undefined && (
                            <Badge variant="outline" className="text-[10px]">Free: {schedule.freeTimeHours}hr</Badge>
                          )}
                          {schedule.maxHours !== undefined && (
                            <Badge variant="outline" className="text-[10px]">Max: {schedule.maxHours}hr</Badge>
                          )}
                          {schedule.maxDays !== undefined && (
                            <Badge variant="outline" className="text-[10px]">Max: {schedule.maxDays}d</Badge>
                          )}
                          {schedule.requiresReceipt && (
                            <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30">Receipt Required</Badge>
                          )}
                          {schedule.requiresPhoto && (
                            <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-500/30">Photo Required</Badge>
                          )}
                          {schedule.requiresScaleTicket && (
                            <Badge variant="outline" className="text-[10px] text-cyan-400 border-cyan-500/30">Scale Ticket</Badge>
                          )}
                          {schedule.perStopRate !== undefined && (
                            <Badge variant="outline" className="text-[10px]">${schedule.perStopRate}/stop</Badge>
                          )}
                          {schedule.perPalletRate !== undefined && (
                            <Badge variant="outline" className="text-[10px]">${schedule.perPalletRate}/pallet</Badge>
                          )}
                          {schedule.perTarpRate !== undefined && (
                            <Badge variant="outline" className="text-[10px]">${schedule.perTarpRate}/tarp</Badge>
                          )}
                          {schedule.minFee !== undefined && (
                            <Badge variant="outline" className="text-[10px]">Min: ${schedule.minFee}</Badge>
                          )}
                          {schedule.maxFee !== undefined && (
                            <Badge variant="outline" className="text-[10px]">Max: ${schedule.maxFee}</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Fee schedule unavailable</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
