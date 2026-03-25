/**
 * AUTOMATED DEMURRAGE CHARGE DASHBOARD (GAP-315)
 * Charge generation, batch review, approval workflow, analytics.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, Clock, AlertTriangle, CheckCircle, XCircle,
  TrendingUp, BarChart3, FileText, Timer, ArrowRight,
  Building2, Truck, Shield, Users, Calendar, Eye,
  ThumbsUp, ThumbsDown, Edit3, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "charges" | "analytics";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: "text-amber-400", bg: "bg-amber-500/10", label: "Pending Review" },
  approved: { color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Approved" },
  invoiced: { color: "text-blue-400", bg: "bg-blue-500/10", label: "Invoiced" },
  disputed: { color: "text-red-400", bg: "bg-red-500/10", label: "Disputed" },
  waived: { color: "text-slate-400", bg: "bg-slate-600/10", label: "Waived" },
  adjusted: { color: "text-purple-400", bg: "bg-purple-500/10", label: "Adjusted" },
};

const TYPE_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  DETENTION: { color: "text-amber-400", icon: <Timer className="w-3.5 h-3.5" />, label: "Detention" },
  DEMURRAGE: { color: "text-red-400", icon: <Clock className="w-3.5 h-3.5" />, label: "Demurrage" },
  LAYOVER: { color: "text-blue-400", icon: <Building2 className="w-3.5 h-3.5" />, label: "Layover" },
  PUMP_TIME: { color: "text-cyan-400", icon: <Zap className="w-3.5 h-3.5" />, label: "Pump Time" },
  BLOW_OFF: { color: "text-purple-400", icon: <Zap className="w-3.5 h-3.5" />, label: "Blow Off" },
};

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function DemurrageChargesPage() {
  const [tab, setTab] = useState<Tab>("charges");
  const [selectedCharges, setSelectedCharges] = useState<Set<string>>(new Set());

  const chargesQuery = (trpc as any).demurrageCharges?.generateCharges?.useQuery?.(
    {},
    { enabled: tab === "charges" }
  ) || { data: null, isLoading: false };

  const analyticsQuery = (trpc as any).demurrageCharges?.getAnalytics?.useQuery?.(
    { period: "30d" },
    { enabled: tab === "analytics" }
  ) || { data: null, isLoading: false };

  const approveMutation = (trpc as any).demurrageCharges?.approveCharge?.useMutation?.() || { mutate: () => {} };
  const disputeMutation = (trpc as any).demurrageCharges?.disputeCharge?.useMutation?.() || { mutate: () => {} };
  const batchApproveMutation = (trpc as any).demurrageCharges?.batchApprove?.useMutation?.() || { mutate: () => {} };

  const data = chargesQuery.data;
  const analytics = analyticsQuery.data;
  const charges = data?.charges || [];
  const batch = data?.batch;

  const toggleCharge = (id: string) => {
    setSelectedCharges(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedCharges.size === charges.length) {
      setSelectedCharges(new Set());
    } else {
      setSelectedCharges(new Set(charges.map((c: any) => c.id)));
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            Demurrage & Detention Charges
          </h1>
          <p className="text-slate-400 text-sm mt-1">Automated charge generation, review & approval workflow</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 w-fit">
        <Button
          size="sm"
          variant={tab === "charges" ? "default" : "ghost"}
          className={cn("rounded-md", tab === "charges" ? "bg-amber-600" : "text-slate-400")}
          onClick={() => setTab("charges")}
        >
          <FileText className="w-4 h-4 mr-1" />Charges
          {charges.length > 0 && (
            <span className="ml-1 bg-amber-500/30 text-amber-400 text-xs rounded-full px-1.5">
              {charges.length}
            </span>
          )}
        </Button>
        <Button
          size="sm"
          variant={tab === "analytics" ? "default" : "ghost"}
          className={cn("rounded-md", tab === "analytics" ? "bg-orange-600" : "text-slate-400")}
          onClick={() => setTab("analytics")}
        >
          <BarChart3 className="w-4 h-4 mr-1" />Analytics
        </Button>
      </div>

      {/* Loading */}
      {(chargesQuery.isLoading || analyticsQuery.isLoading) && (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full bg-slate-700/30 rounded-xl" />
          <Skeleton className="h-60 w-full bg-slate-700/30 rounded-xl" />
        </div>
      )}

      {/* ── Tab: Charges ── */}
      {tab === "charges" && batch && (
        <div className="space-y-4">
          {/* Batch Summary */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <DollarSign className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Charge Batch</p>
                    <p className="text-xs text-slate-500">
                      {batch.dateRange.from} — {batch.dateRange.to}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-slate-500 uppercase">Charges</p>
                    <p className="text-lg font-bold font-mono text-white">{batch.totalCharges}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500 uppercase">Total Amount</p>
                    <p className="text-lg font-bold font-mono text-amber-400">
                      ${batch.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {Object.entries(batch.byType || {}).map(([type, data]: [string, any]) => {
                      const tc = TYPE_CONFIG[type] || TYPE_CONFIG.DEMURRAGE;
                      return (
                        <Badge key={type} variant="outline" className={cn("text-xs", tc.color)}>
                          {tc.label}: {data.count} (${data.amount.toFixed(0)})
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Batch Actions */}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={selectAll} className="text-xs border-slate-600 text-slate-300">
              {selectedCharges.size === charges.length ? "Deselect All" : "Select All"}
            </Button>
            {selectedCharges.size > 0 && (
              <>
                <Button
                  size="sm"
                  className="bg-emerald-600 text-white text-xs"
                  onClick={() => batchApproveMutation.mutate({ chargeIds: Array.from(selectedCharges) })}
                >
                  <ThumbsUp className="w-3 h-3 mr-1" />Approve {selectedCharges.size}
                </Button>
                <span className="text-xs text-slate-500">{selectedCharges.size} selected</span>
              </>
            )}
          </div>

          {/* Charge Cards */}
          <div className="space-y-2">
            {charges.map((charge: any) => {
              const sc = STATUS_CONFIG[charge.status] || STATUS_CONFIG.pending;
              const tc = TYPE_CONFIG[charge.chargeType] || TYPE_CONFIG.DEMURRAGE;
              const isSelected = selectedCharges.has(charge.id);

              return (
                <Card
                  key={charge.id}
                  className={cn(
                    "bg-slate-800/50 rounded-xl border transition-all",
                    isSelected ? "border-amber-500/40 ring-1 ring-amber-500/20" : "border-slate-700/50",
                  )}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div
                        className={cn(
                          "w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer mt-0.5 transition-all",
                          isSelected ? "bg-amber-500 border-amber-500" : "border-slate-600 hover:border-amber-400",
                        )}
                        onClick={() => toggleCharge(charge.id)}
                      >
                        {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>

                      <div className="flex-1">
                        {/* Header Row */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={tc.color}>{tc.icon}</span>
                            <Badge variant="outline" className={cn("text-xs", tc.color)}>
                              {tc.label}
                            </Badge>
                            <span className="text-xs text-slate-400 font-mono">{charge.id}</span>
                            <Badge variant="outline" className={cn("text-xs", sc.color, sc.bg)}>
                              {sc.label}
                            </Badge>
                          </div>
                          <span className="text-lg font-bold font-mono text-amber-400">
                            ${charge.finalCharge.toFixed(2)}
                          </span>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          <div className="p-1.5 rounded-md bg-slate-900/30">
                            <p className="text-xs text-slate-500">Load</p>
                            <p className="text-xs text-white font-mono">{charge.loadReference}</p>
                          </div>
                          <div className="p-1.5 rounded-md bg-slate-900/30">
                            <p className="text-xs text-slate-500">Total Wait</p>
                            <p className="text-xs text-white font-mono">{formatMinutes(charge.totalWaitMinutes)}</p>
                          </div>
                          <div className="p-1.5 rounded-md bg-slate-900/30">
                            <p className="text-xs text-slate-500">Free Time</p>
                            <p className="text-xs text-emerald-400 font-mono">{formatMinutes(charge.freeTimeMinutes)}</p>
                          </div>
                          <div className="p-1.5 rounded-md bg-slate-900/30">
                            <p className="text-xs text-slate-500">Billable</p>
                            <p className="text-xs text-red-400 font-mono">{formatMinutes(charge.billableMinutes)}</p>
                          </div>
                          <div className="p-1.5 rounded-md bg-slate-900/30">
                            <p className="text-xs text-slate-500">Rate</p>
                            <p className="text-xs text-white font-mono">${charge.hourlyRate}/hr</p>
                          </div>
                        </div>

                        {/* Location & Parties */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              <span>{charge.locationType === "pickup" ? "Pickup" : "Delivery"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              <span>{charge.carrierName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{charge.shipperName}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs text-emerald-400 hover:bg-emerald-500/10"
                              onClick={() => approveMutation.mutate({ chargeId: charge.id })}
                            >
                              <ThumbsUp className="w-3 h-3 mr-0.5" />Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs text-red-400 hover:bg-red-500/10"
                              onClick={() => disputeMutation.mutate({ chargeId: charge.id, reason: "Under review" })}
                            >
                              <ThumbsDown className="w-3 h-3 mr-0.5" />Dispute
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {charges.length === 0 && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-emerald-400 font-semibold">No Pending Charges</p>
                <p className="text-xs text-slate-500 mt-1">All demurrage/detention events are within free time</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Tab: Analytics ── */}
      {tab === "analytics" && analytics && (
        <div className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Charges", value: analytics.totalCharges, icon: <FileText className="w-4 h-4" />, color: "text-amber-400" },
              { label: "Total Amount", value: `$${analytics.totalAmount.toLocaleString()}`, icon: <DollarSign className="w-4 h-4" />, color: "text-emerald-400" },
              { label: "Avg Wait Time", value: formatMinutes(analytics.avgWaitMinutes), icon: <Clock className="w-4 h-4" />, color: "text-blue-400" },
              { label: "Free Time Exceeded", value: `${analytics.freeTimeUtilization}%`, icon: <AlertTriangle className="w-4 h-4" />, color: "text-red-400" },
            ].map((kpi, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                <CardContent className="p-3 text-center">
                  <div className={cn("inline-flex p-2 rounded-lg bg-slate-900/30 mb-1", kpi.color)}>{kpi.icon}</div>
                  <p className="text-lg font-bold font-mono text-white">{kpi.value}</p>
                  <p className="text-xs text-slate-500">{kpi.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* By Type */}
          {analytics.byType?.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-400" />Charges by Type
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {analytics.byType.map((t: any) => {
                    const tc = TYPE_CONFIG[t.type] || TYPE_CONFIG.DEMURRAGE;
                    return (
                      <div key={t.type} className="p-2 rounded-lg bg-slate-900/30 border border-slate-700/30">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={tc.color}>{tc.icon}</span>
                          <span className={cn("text-xs font-semibold", tc.color)}>{tc.label}</span>
                        </div>
                        <p className="text-sm font-bold font-mono text-white">{t.count}</p>
                        <p className="text-xs text-slate-500">${t.totalAmount.toLocaleString()} • Avg {formatMinutes(t.avgMinutes)}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Offenders */}
          {analytics.topOffenders?.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />Top Wait-Time Locations
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-1.5">
                  {analytics.topOffenders.map((o: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/20">
                      <span className="text-xs font-bold text-slate-500 w-5">#{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{o.name || `Location ${i + 1}`}</span>
                          <Badge variant="outline" className="text-xs border-slate-600/50 text-slate-400">{o.type}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold font-mono text-amber-400">${o.totalAmount.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">{o.charges} charges • Avg {formatMinutes(o.avgWait)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trend */}
          {analytics.trend?.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />Daily Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-end gap-[3px] h-24">
                  {analytics.trend.map((d: any, i: number) => {
                    const maxAmt = Math.max(...analytics.trend.map((t: any) => t.amount));
                    const pct = maxAmt > 0 ? (d.amount / maxAmt) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <div
                          className="w-full rounded-t-sm bg-amber-500/60 transition-all"
                          style={{ height: `${Math.max(pct, 3)}%` }}
                          title={`${d.date}: $${d.amount} (${d.charges} charges)`}
                        />
                        {i % Math.max(1, Math.floor(analytics.trend.length / 6)) === 0 && (
                          <span className="text-xs text-slate-600">{d.date.substring(5)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-slate-500 uppercase">Avg Billable Time</p>
                <p className="text-2xl font-bold font-mono text-white">{formatMinutes(analytics.avgBillableMinutes)}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-slate-500 uppercase">Avg Charge</p>
                <p className="text-2xl font-bold font-mono text-amber-400">${analytics.avgChargeAmount.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
