/**
 * DETENTION TIME TRACKING & AUTO-BILLING PAGE — GAP-122
 * 100% Dynamic - No mock data
 * Uses: accessorial.getDashboardStats, accessorial.getClaims, accessorial.updateClaimStatus,
 *       accessorial.submitClaim, accessorial.calculateDetention, accessorial.getFeeSchedule,
 *       billing.getDetentions, billing.getDetentionStats
 * UI Style: Gradient headers, stat cards with icons, rounded cards, tabbed interface
 */

import React, { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Clock, DollarSign, AlertTriangle, MapPin, CheckCircle, XCircle,
  Plus, Calculator, FileText, TrendingUp, RefreshCw, Eye,
  ThumbsUp, ThumbsDown, MessageSquare, CreditCard, Timer,
  Building2, Truck, Shield, ChevronDown, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

export default function DetentionTracking() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState("dashboard");
  const [statusFilter, setStatusFilter] = useState("all");
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "ytd">("30d");
  const [expandedClaim, setExpandedClaim] = useState<number | null>(null);

  // ── New Claim Form State ──
  const [showNewClaim, setShowNewClaim] = useState(false);
  const [newClaim, setNewClaim] = useState({
    loadId: "",
    locationType: "pickup" as "pickup" | "delivery",
    facilityName: "",
    arrivalTime: "",
    departureTime: "",
    freeTimeMinutes: 120,
    description: "",
  });

  // ── Calculator State ──
  const [calcArrival, setCalcArrival] = useState("");
  const [calcDeparture, setCalcDeparture] = useState("");
  const [calcFreeTime, setCalcFreeTime] = useState(120);
  const [calcRate, setCalcRate] = useState(75);

  // ── Data Queries ──
  const dashStats = (trpc as any).accessorial?.getDashboardStats?.useQuery?.({ period }) || { data: null, isLoading: false };
  const claimsQuery = (trpc as any).accessorial?.getClaims?.useQuery?.(
    statusFilter === "all" ? {} : { status: statusFilter === "pending" ? "pending_review" : statusFilter }
  ) || { data: { claims: [], total: 0 }, isLoading: false };
  const feeScheduleQuery = (trpc as any).accessorial?.getFeeSchedule?.useQuery?.() || { data: null, isLoading: false };
  const legacyStats = (trpc as any).billing?.getDetentionStats?.useQuery?.() || { data: null, isLoading: false };
  const legacyDetentions = (trpc as any).billing?.getDetentions?.useQuery?.(
    statusFilter === "all" ? {} : { status: statusFilter }
  ) || { data: [], isLoading: false };

  const calcQuery = (trpc as any).accessorial?.calculateDetention?.useQuery?.(
    { arrivalTime: calcArrival, departureTime: calcDeparture || undefined, freeTimeMinutes: calcFreeTime, ratePerHour: calcRate },
    { enabled: !!calcArrival }
  ) || { data: null, isLoading: false };

  // ── Mutations ──
  const submitClaimMutation = (trpc as any).accessorial?.submitClaim?.useMutation?.({
    onSuccess: () => {
      toast.success("Detention claim submitted");
      setShowNewClaim(false);
      setNewClaim({ loadId: "", locationType: "pickup", facilityName: "", arrivalTime: "", departureTime: "", freeTimeMinutes: 120, description: "" });
      claimsQuery.refetch?.();
      dashStats.refetch?.();
    },
    onError: (e: any) => toast.error("Failed to submit claim", { description: e.message }),
  }) || { mutate: () => {}, isPending: false };

  const reviewMutation = (trpc as any).accessorial?.updateClaimStatus?.useMutation?.({
    onSuccess: (_: any, vars: any) => {
      toast.success(`Claim ${vars.action}${vars.action === "pay" ? "d" : vars.action === "deny" ? "ied" : "d"}`);
      claimsQuery.refetch?.();
      dashStats.refetch?.();
    },
    onError: (e: any) => toast.error("Action failed", { description: e.message }),
  }) || { mutate: () => {}, isPending: false };

  // ── Merged stats ──
  const stats = useMemo(() => {
    const d = dashStats.data;
    const l = legacyStats.data;
    return {
      totalClaims: d?.totalClaims || l?.total || 0,
      pendingClaims: d?.pendingClaims || l?.pending || 0,
      approvedClaims: d?.approvedClaims || 0,
      paidClaims: d?.paidClaims || 0,
      disputedClaims: d?.disputedClaims || 0,
      totalAmount: d?.totalAmount || l?.totalAmount || 0,
      platformRevenue: d?.platformRevenue || 0,
      avgClaimAmount: d?.avgClaimAmount || 0,
      active: l?.active || 0,
      pendingAmount: l?.pendingAmount || 0,
      collected: l?.collected || 0,
      avgHours: l?.avgHours || 0,
      byType: d?.byType || [],
    };
  }, [dashStats.data, legacyStats.data]);

  // ── Claims list: merge accessorial claims + legacy billing detentions ──
  const claims: any[] = useMemo(() => {
    const acc = claimsQuery.data?.claims || [];
    return acc;
  }, [claimsQuery.data]);

  const isLoading = dashStats.isLoading || legacyStats.isLoading;

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");

  const handleSubmitClaim = useCallback(() => {
    if (!newClaim.loadId || !newClaim.arrivalTime) {
      toast.error("Load ID and arrival time are required");
      return;
    }
    const freeTime = newClaim.freeTimeMinutes || 120;
    const hourlyRate = 75;
    const totalMinutes = newClaim.departureTime
      ? Math.floor((new Date(newClaim.departureTime).getTime() - new Date(newClaim.arrivalTime).getTime()) / 60000)
      : 0;
    const billableMinutes = Math.max(0, totalMinutes - freeTime);
    const amount = (billableMinutes / 60) * hourlyRate;

    submitClaimMutation.mutate({
      loadId: parseInt(newClaim.loadId),
      type: "detention",
      amount: amount > 0 ? amount : 1,
      arrivalTime: new Date(newClaim.arrivalTime).toISOString(),
      departureTime: newClaim.departureTime ? new Date(newClaim.departureTime).toISOString() : undefined,
      freeTimeMinutes: freeTime,
      locationType: newClaim.locationType,
      facilityName: newClaim.facilityName || undefined,
      description: newClaim.description || undefined,
    });
  }, [newClaim, submitClaimMutation]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_review": case "accruing": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><ThumbsUp className="w-3 h-3 mr-1" />Approved</Badge>;
      case "paid": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case "disputed": return <Badge className="bg-orange-500/20 text-orange-400 border-0"><MessageSquare className="w-3 h-3 mr-1" />Disputed</Badge>;
      case "denied": return <Badge className="bg-red-500/20 text-red-400 border-0"><XCircle className="w-3 h-3 mr-1" />Denied</Badge>;
      case "voided": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Voided</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Detention Tracking & Auto-Billing
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            GAP-122 — Real-time detention timers, claim management, and automated billing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className={cn("w-28 rounded-lg", isLight ? "border-slate-200" : "bg-slate-700/50 border-slate-600/50")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="ytd">YTD</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className={cn("rounded-lg", isLight ? "border-slate-200" : "bg-slate-700/50 border-slate-600/50")} onClick={() => { dashStats.refetch?.(); claimsQuery.refetch?.(); legacyStats.refetch?.(); }}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-lg" onClick={() => { setActiveTab("claims"); setShowNewClaim(true); }}>
            <Plus className="w-4 h-4 mr-1" />Submit Claim
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { icon: <FileText className="w-5 h-5 text-blue-400" />, bg: "bg-blue-500/15", value: String(stats.totalClaims), label: "Total Claims", color: "text-blue-400" },
            { icon: <Clock className="w-5 h-5 text-yellow-400" />, bg: "bg-yellow-500/15", value: String(stats.pendingClaims), label: "Pending Review", color: "text-yellow-400" },
            { icon: <ThumbsUp className="w-5 h-5 text-cyan-400" />, bg: "bg-cyan-500/15", value: String(stats.approvedClaims), label: "Approved", color: "text-cyan-400" },
            { icon: <CheckCircle className="w-5 h-5 text-green-400" />, bg: "bg-green-500/15", value: String(stats.paidClaims), label: "Paid", color: "text-green-400" },
            { icon: <DollarSign className="w-5 h-5 text-emerald-400" />, bg: "bg-emerald-500/15", value: `$${stats.totalAmount.toLocaleString()}`, label: "Total Billed", color: "text-emerald-400" },
            { icon: <TrendingUp className="w-5 h-5 text-purple-400" />, bg: "bg-purple-500/15", value: `$${stats.avgClaimAmount.toLocaleString()}`, label: "Avg Claim", color: "text-purple-400" },
          ].map((s) => (
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
          <TabsTrigger value="dashboard"><TrendingUp className="w-4 h-4 mr-1.5" />Dashboard</TabsTrigger>
          <TabsTrigger value="claims"><FileText className="w-4 h-4 mr-1.5" />Claims</TabsTrigger>
          <TabsTrigger value="calculator"><Calculator className="w-4 h-4 mr-1.5" />Calculator</TabsTrigger>
          <TabsTrigger value="rates"><Shield className="w-4 h-4 mr-1.5" />Fee Schedule</TabsTrigger>
        </TabsList>

        {/* ═══ DASHBOARD TAB ═══ */}
        <TabsContent value="dashboard">
          <div className="space-y-6">
            {/* Active Timers from legacy billing */}
            <Card className={cc}>
              <CardHeader className="pb-3">
                <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                  <Timer className="w-5 h-5 text-red-400" />Active Detention Events
                  {stats.active > 0 && <Badge className="bg-red-500/20 text-red-400 border-0 ml-2">{stats.active} active</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {legacyDetentions.isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
                ) : !legacyDetentions.data?.length ? (
                  <div className="text-center py-12">
                    <div className={cn("w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
                      <Clock className="w-7 h-7 text-slate-400" />
                    </div>
                    <p className={cn("font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No Active Detention Events</p>
                    <p className={cn("text-sm mt-1", isLight ? "text-slate-400" : "text-slate-500")}>Detention timers will appear here when drivers dwell at facilities</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(legacyDetentions.data as any[]).map((d: any) => (
                      <div key={d.id} className={cn("p-4 rounded-xl border flex items-center justify-between",
                        d.status === "active" ? (isLight ? "bg-red-50 border-red-200" : "bg-red-500/5 border-red-500/30") :
                        d.status === "paid" ? (isLight ? "bg-green-50 border-green-200" : "bg-green-500/5 border-green-500/30") :
                        (isLight ? "bg-slate-50 border-slate-200" : "bg-slate-700/30 border-slate-600/30")
                      )}>
                        <div className="flex items-center gap-4">
                          <div className={cn("p-3 rounded-xl",
                            d.status === "active" ? "bg-red-500/20" : d.status === "paid" ? "bg-green-500/20" : "bg-yellow-500/20"
                          )}>
                            <Clock className={cn("w-5 h-5",
                              d.status === "active" ? "text-red-400" : d.status === "paid" ? "text-green-400" : "text-yellow-400"
                            )} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className={cn("font-bold", isLight ? "text-slate-800" : "text-white")}>Load #{d.loadNumber}</p>
                              <Badge className={cn("border-0",
                                d.status === "active" ? "bg-red-500/20 text-red-400" :
                                d.status === "paid" ? "bg-green-500/20 text-green-400" :
                                "bg-yellow-500/20 text-yellow-400"
                              )}>{d.status}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <MapPin className="w-3 h-3" /><span>{d.location || d.locationType || "Facility"}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                              <span>{d.type || "Detention"}</span>
                              <span>Started: {d.startTime || d.arrivalTime || "—"}</span>
                              {(d.endTime || d.departureTime) && <span>Ended: {d.endTime || d.departureTime}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-cyan-400">{d.hours || d.totalDwellMinutes ? `${Math.round((d.totalDwellMinutes || 0) / 60)}h` : "—"}</p>
                          <p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-medium">
                            ${d.amount || d.detentionCharge || 0}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Breakdown by Type */}
            {stats.byType?.length > 0 && (
              <Card className={cc}>
                <CardHeader className="pb-3">
                  <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                    <Building2 className="w-5 h-5 text-blue-400" />Claims by Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.byType.map((t: any) => (
                      <div key={t.type} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={cn("border-0 capitalize",
                            t.type === "detention" ? "bg-red-500/20 text-red-400" :
                            t.type === "lumper" ? "bg-purple-500/20 text-purple-400" :
                            t.type === "tonu" ? "bg-orange-500/20 text-orange-400" :
                            "bg-blue-500/20 text-blue-400"
                          )}>{t.type}</Badge>
                          <span className={cn("text-sm", isLight ? "text-slate-600" : "text-slate-300")}>{t.count} claims</span>
                        </div>
                        <span className={cn("font-bold tabular-nums", isLight ? "text-slate-800" : "text-white")}>${t.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ═══ CLAIMS TAB ═══ */}
        <TabsContent value="claims">
          <div className="space-y-4">
            {/* Filter + New Claim toggle */}
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={cn("w-[170px] rounded-lg", isLight ? "border-slate-200" : "bg-slate-700/50 border-slate-600/50")}>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                </SelectContent>
              </Select>
              <Button variant={showNewClaim ? "destructive" : "outline"} size="sm" className="rounded-lg" onClick={() => setShowNewClaim(!showNewClaim)}>
                {showNewClaim ? <XCircle className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                {showNewClaim ? "Cancel" : "New Claim"}
              </Button>
            </div>

            {/* New Claim Form */}
            {showNewClaim && (
              <Card className={cn(cc, "border-2", isLight ? "border-blue-200" : "border-blue-500/30")}>
                <CardHeader className="pb-3">
                  <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                    <Plus className="w-5 h-5 text-blue-400" />Submit Detention Claim
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Load ID *</label>
                      <Input placeholder="e.g. 42" value={newClaim.loadId} onChange={(e) => setNewClaim(p => ({ ...p, loadId: e.target.value }))} className="rounded-lg" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Location Type</label>
                      <Select value={newClaim.locationType} onValueChange={(v: any) => setNewClaim(p => ({ ...p, locationType: v }))}>
                        <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pickup">Pickup</SelectItem>
                          <SelectItem value="delivery">Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Facility Name</label>
                      <Input placeholder="e.g. Shell Terminal" value={newClaim.facilityName} onChange={(e) => setNewClaim(p => ({ ...p, facilityName: e.target.value }))} className="rounded-lg" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Arrival Time *</label>
                      <Input type="datetime-local" value={newClaim.arrivalTime} onChange={(e) => setNewClaim(p => ({ ...p, arrivalTime: e.target.value }))} className="rounded-lg" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Departure Time</label>
                      <Input type="datetime-local" value={newClaim.departureTime} onChange={(e) => setNewClaim(p => ({ ...p, departureTime: e.target.value }))} className="rounded-lg" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Free Time (min)</label>
                      <Input type="number" value={newClaim.freeTimeMinutes} onChange={(e) => setNewClaim(p => ({ ...p, freeTimeMinutes: parseInt(e.target.value) || 120 }))} className="rounded-lg" />
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Notes</label>
                      <Input placeholder="Description or additional context..." value={newClaim.description} onChange={(e) => setNewClaim(p => ({ ...p, description: e.target.value }))} className="rounded-lg" />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-lg" onClick={handleSubmitClaim} disabled={submitClaimMutation.isPending}>
                      {submitClaimMutation.isPending ? "Submitting..." : "Submit Detention Claim"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Claims List */}
            <Card className={cc}>
              <CardHeader className="pb-3">
                <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                  <FileText className="w-5 h-5 text-cyan-400" />
                  Accessorial Claims
                  <Badge className="bg-slate-500/20 text-slate-400 border-0 ml-2">{claimsQuery.data?.total || 0}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {claimsQuery.isLoading ? (
                  <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
                ) : !claims.length ? (
                  <div className="text-center py-16">
                    <div className={cn("w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
                      <FileText className="w-7 h-7 text-slate-400" />
                    </div>
                    <p className={cn("font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No Claims Found</p>
                    <p className={cn("text-sm mt-1", isLight ? "text-slate-400" : "text-slate-500")}>Submit a detention claim to get started</p>
                  </div>
                ) : (
                  <div className={cn("divide-y", isLight ? "divide-slate-100" : "divide-slate-700/50")}>
                    {claims.map((c: any) => (
                      <div key={c.id} className={cn("transition-colors", isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/20")}>
                        <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedClaim(expandedClaim === c.id ? null : c.id)}>
                          <div className="flex items-center gap-4">
                            <div className={cn("p-3 rounded-xl",
                              c.accessorialType === "detention" ? "bg-red-500/15" :
                              c.accessorialType === "lumper" ? "bg-purple-500/15" :
                              "bg-blue-500/15"
                            )}>
                              {c.accessorialType === "detention" ? <Clock className="w-5 h-5 text-red-400" /> :
                               c.accessorialType === "lumper" ? <Truck className="w-5 h-5 text-purple-400" /> :
                               <DollarSign className="w-5 h-5 text-blue-400" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className={cn("font-bold", isLight ? "text-slate-800" : "text-white")}>
                                  Claim #{c.id} — Load #{c.loadId}
                                </p>
                                {getStatusBadge(c.status)}
                                <Badge className="bg-slate-500/15 text-slate-400 border-0 capitalize text-xs">{c.accessorialType}</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-400">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.facilityName || c.locationType || "—"}</span>
                                {c.claimedByName && <span>by {c.claimedByName}</span>}
                                {c.createdAt && <span>{new Date(c.createdAt).toLocaleDateString()}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
                                ${c.totalAmount?.toLocaleString() || 0}
                              </p>
                              {c.billableMinutes > 0 && (
                                <p className="text-xs text-slate-500">{c.billableMinutes} billable min</p>
                              )}
                            </div>
                            {expandedClaim === c.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </div>
                        </div>

                        {/* Expanded Detail + Actions */}
                        {expandedClaim === c.id && (
                          <div className={cn("px-4 pb-4 pt-0 border-t", isLight ? "border-slate-100 bg-slate-50/50" : "border-slate-700/30 bg-slate-800/30")}>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3">
                              <div>
                                <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Arrival</p>
                                <p className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-200")}>
                                  {c.arrivalTime ? new Date(c.arrivalTime).toLocaleString() : "—"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Departure</p>
                                <p className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-200")}>
                                  {c.departureTime ? new Date(c.departureTime).toLocaleString() : "Still on-site"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Free Time</p>
                                <p className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-200")}>{c.freeTimeMinutes || 120} min</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Rate</p>
                                <p className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-200")}>${c.hourlyRate || 75}/hr</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Total Dwell</p>
                                <p className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-200")}>{c.totalDwellMinutes || 0} min</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Billable</p>
                                <p className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-200")}>{c.billableMinutes || 0} min</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Platform Fee</p>
                                <p className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-200")}>${(c.platformFee || 0).toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Net to Carrier</p>
                                <p className="text-sm font-bold text-green-400">${((c.totalAmount || 0) - (c.platformFee || 0)).toFixed(2)}</p>
                              </div>
                            </div>
                            {c.notes && (
                              <p className={cn("text-sm mb-3 p-2 rounded-lg", isLight ? "bg-slate-100 text-slate-600" : "bg-slate-700/30 text-slate-300")}>{c.notes}</p>
                            )}

                            {/* Review Actions */}
                            {(c.status === "pending_review" || c.status === "approved") && (
                              <div className="flex items-center gap-2 pt-2">
                                {c.status === "pending_review" && (
                                  <>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-lg" disabled={reviewMutation.isPending}
                                      onClick={() => reviewMutation.mutate({ claimId: c.id, action: "approve" })}>
                                      <ThumbsUp className="w-3.5 h-3.5 mr-1" />Approve
                                    </Button>
                                    <Button size="sm" variant="destructive" className="rounded-lg" disabled={reviewMutation.isPending}
                                      onClick={() => reviewMutation.mutate({ claimId: c.id, action: "deny", reason: "Denied by reviewer" })}>
                                      <ThumbsDown className="w-3.5 h-3.5 mr-1" />Deny
                                    </Button>
                                    <Button size="sm" variant="outline" className="rounded-lg" disabled={reviewMutation.isPending}
                                      onClick={() => reviewMutation.mutate({ claimId: c.id, action: "dispute", reason: "Under review" })}>
                                      <MessageSquare className="w-3.5 h-3.5 mr-1" />Dispute
                                    </Button>
                                  </>
                                )}
                                {c.status === "approved" && (
                                  <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg" disabled={reviewMutation.isPending}
                                    onClick={() => reviewMutation.mutate({ claimId: c.id, action: "pay" })}>
                                    <CreditCard className="w-3.5 h-3.5 mr-1" />Mark Paid
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ CALCULATOR TAB ═══ */}
        <TabsContent value="calculator">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className={cc}>
              <CardHeader>
                <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                  <Calculator className="w-5 h-5 text-blue-400" />Detention Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Arrival Time</label>
                  <Input type="datetime-local" value={calcArrival} onChange={(e) => setCalcArrival(e.target.value)} className="rounded-lg" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Departure Time (leave blank for current time)</label>
                  <Input type="datetime-local" value={calcDeparture} onChange={(e) => setCalcDeparture(e.target.value)} className="rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Free Time (min)</label>
                    <Input type="number" value={calcFreeTime} onChange={(e) => setCalcFreeTime(parseInt(e.target.value) || 120)} className="rounded-lg" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Rate ($/hr)</label>
                    <Input type="number" value={calcRate} onChange={(e) => setCalcRate(parseInt(e.target.value) || 75)} className="rounded-lg" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={cc}>
              <CardHeader>
                <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                  <DollarSign className="w-5 h-5 text-green-400" />Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!calcArrival ? (
                  <div className="text-center py-8">
                    <Calculator className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className={cn("text-sm", isLight ? "text-slate-400" : "text-slate-500")}>Enter an arrival time to calculate detention</p>
                  </div>
                ) : calcQuery.isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                ) : calcQuery.data ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Total Time", value: `${calcQuery.data.totalMinutes} min`, sub: `${(calcQuery.data.totalMinutes / 60).toFixed(1)} hours` },
                        { label: "Free Time", value: `${calcQuery.data.freeTimeMinutes} min` },
                        { label: "Billable Time", value: `${calcQuery.data.billableMinutes} min`, sub: `${calcQuery.data.billableHours} hours`, highlight: calcQuery.data.billableMinutes > 0 },
                        { label: "Rate", value: `$${calcQuery.data.ratePerHour}/hr` },
                      ].map((item) => (
                        <div key={item.label} className={cn("p-3 rounded-xl", isLight ? "bg-slate-50" : "bg-slate-700/30")}>
                          <p className="text-xs uppercase tracking-wider text-slate-500">{item.label}</p>
                          <p className={cn("text-lg font-bold", item.highlight ? "text-red-400" : (isLight ? "text-slate-800" : "text-white"))}>{item.value}</p>
                          {item.sub && <p className="text-xs text-slate-500">{item.sub}</p>}
                        </div>
                      ))}
                    </div>
                    <div className={cn("p-4 rounded-xl border-2", calcQuery.data.isDetentionActive ? (isLight ? "border-red-200 bg-red-50" : "border-red-500/30 bg-red-500/5") : (isLight ? "border-green-200 bg-green-50" : "border-green-500/30 bg-green-500/5"))}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-500">Total Charge</p>
                          <p className="text-3xl font-black bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${calcQuery.data.charge.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Platform Fee: ${calcQuery.data.platformFee.toFixed(2)}</p>
                          <p className="text-sm font-bold text-green-400">Net to Carrier: ${calcQuery.data.netToCarrier.toFixed(2)}</p>
                        </div>
                      </div>
                      {!calcQuery.data.isDetentionActive && (
                        <p className="text-xs text-green-500 mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Within free time — no detention charge</p>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">Billed in {calcQuery.data.billingIncrement}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ FEE SCHEDULE TAB ═══ */}
        <TabsContent value="rates">
          <Card className={cc}>
            <CardHeader>
              <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Shield className="w-5 h-5 text-purple-400" />Accessorial Fee Schedule
                {feeScheduleQuery.data?.platformFeePercent && (
                  <Badge className="bg-purple-500/20 text-purple-400 border-0 ml-2">{feeScheduleQuery.data.platformFeePercent}% platform fee</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {feeScheduleQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : !feeScheduleQuery.data ? (
                <p className="text-slate-400 text-center py-8">Fee schedule unavailable</p>
              ) : (
                <div className="space-y-6">
                  {[
                    { title: "Core Accessorials", keys: ["detention", "lumper", "tonu", "layover", "driverAssist", "reweigh", "reconsignment", "stopOff"] },
                    { title: "Dry Van / General", keys: ["insideDelivery", "liftgate", "tailGate", "palletExchange", "residentialDelivery", "limitedAccess", "dryRun"] },
                    { title: "Flatbed / Oversize", keys: ["tarping", "escort", "securement", "permitPassThrough"] },
                    { title: "Reefer", keys: ["preCool", "reeferFuel"] },
                    { title: "Tanker", keys: ["tankWashout", "pumpTime", "heelDisposal"] },
                    { title: "Hopper / Pneumatic", keys: ["blowOff"] },
                  ].map((section) => {
                    const schedule = feeScheduleQuery.data.schedule as Record<string, any>;
                    const items = section.keys.filter(k => schedule[k]);
                    if (!items.length) return null;
                    return (
                      <div key={section.title}>
                        <h3 className={cn("text-sm font-bold mb-2", isLight ? "text-slate-700" : "text-slate-200")}>{section.title}</h3>
                        <div className={cn("rounded-xl border overflow-hidden", isLight ? "border-slate-200" : "border-slate-700/50")}>
                          {items.map((key, idx) => {
                            const fee = schedule[key];
                            const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s: string) => s.toUpperCase());
                            const details: string[] = [];
                            if (fee.freeTimeMinutes !== undefined) details.push(`Free: ${fee.freeTimeMinutes}min`);
                            if (fee.ratePerHour) details.push(`$${fee.ratePerHour}/hr`);
                            if (fee.flatRate) details.push(`$${fee.flatRate} flat`);
                            if (fee.dailyRate) details.push(`$${fee.dailyRate}/day`);
                            if (fee.perStopRate) details.push(`$${fee.perStopRate}/stop`);
                            if (fee.perPalletRate) details.push(`$${fee.perPalletRate}/pallet`);
                            if (fee.perTarpRate) details.push(`$${fee.perTarpRate}/tarp`);
                            if (fee.minFee) details.push(`Min: $${fee.minFee}`);
                            if (fee.maxFee) details.push(`Max: $${fee.maxFee}`);
                            if (fee.maxHours) details.push(`Max: ${fee.maxHours}h`);
                            if (fee.maxDays) details.push(`Max: ${fee.maxDays}d`);
                            if (fee.requiresReceipt) details.push("Receipt req.");
                            if (fee.requiresPhoto) details.push("Photo req.");

                            return (
                              <div key={key} className={cn("flex items-center justify-between px-4 py-3",
                                idx > 0 && (isLight ? "border-t border-slate-100" : "border-t border-slate-700/30")
                              )}>
                                <span className={cn("font-medium text-sm", isLight ? "text-slate-700" : "text-slate-200")}>{label}</span>
                                <span className="text-xs text-slate-500">{details.join(" · ")}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {feeScheduleQuery.data.note && (
                    <p className={cn("text-xs p-3 rounded-lg", isLight ? "bg-blue-50 text-blue-600" : "bg-blue-500/10 text-blue-400")}>
                      {feeScheduleQuery.data.note}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
