/**
 * BROKER & 3PL MANAGEMENT PAGE
 * Comprehensive broker operations: scorecard, carrier pool, double-brokering detection,
 * commission tracking, 3PL SLA performance, carrier relationships, margin analysis.
 * Dark theme with orange/amber broker accents.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, TrendingUp, Users, Truck, Shield, AlertTriangle,
  CheckCircle, XCircle, Clock, BarChart3, Target, Percent,
  ArrowUpRight, ArrowDownRight, Building2, FileText, Scale,
  Eye, Star, Handshake, PieChart, CreditCard, ShieldAlert,
  UserCheck, Award, Layers, Activity, Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

// ── Accent utilities ──
const amber = (isLight: boolean) => isLight ? "text-amber-600" : "text-amber-400";
const amberBg = (isLight: boolean) => isLight ? "bg-amber-50" : "bg-amber-500/10";
const orangeBg = (isLight: boolean) => isLight ? "bg-orange-50" : "bg-orange-500/10";
const orange = (isLight: boolean) => isLight ? "text-orange-600" : "text-orange-400";

function KpiCard({ icon, label, value, trend, isLight, accent }: {
  icon: React.ReactNode; label: string; value: string | number; trend?: number; isLight: boolean; accent?: string;
}) {
  const cc = cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  return (
    <div className={cc}>
      <div className="flex items-center justify-between mb-2">
        <div className={cn("p-2 rounded-lg", accent || amberBg(isLight))}>{icon}</div>
        {trend !== undefined && (
          <div className={cn("flex items-center text-xs font-medium", trend >= 0 ? "text-emerald-500" : "text-red-400")}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>{value}</div>
      <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>{label}</div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

// ── Tab: Dashboard Overview ──
function DashboardTab({ isLight }: { isLight: boolean }) {
  const dashQ = (trpc as any).brokerManagement?.getBrokerDashboard?.useQuery?.({ period: "30d" }) || { data: null, isLoading: false };
  const d = dashQ.data;
  const cc = cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");

  if (dashQ.isLoading) return <SectionSkeleton />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Package className={cn("w-5 h-5", amber(isLight))} />} label="Active Loads" value={d?.activeLoads || 0} isLight={isLight} />
        <KpiCard icon={<DollarSign className={cn("w-5 h-5", orange(isLight))} />} label="Revenue" value={`$${((d?.totalRevenue || 0) / 1000).toFixed(1)}k`} trend={8} isLight={isLight} accent={orangeBg(isLight)} />
        <KpiCard icon={<Percent className={cn("w-5 h-5", amber(isLight))} />} label="Avg Margin" value={`${d?.avgMargin || 0}%`} trend={2} isLight={isLight} />
        <KpiCard icon={<Truck className={cn("w-5 h-5", orange(isLight))} />} label="Carrier Pool" value={d?.carrierPoolSize || 0} isLight={isLight} accent={orangeBg(isLight)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={cc}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" />Delivered</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{d?.deliveredLoads || 0}</div></CardContent>
        </Card>
        <Card className={cc}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" />Pending Bids</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{d?.pendingBids || 0}</div></CardContent>
        </Card>
        <Card className={cc}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><XCircle className="w-4 h-4 text-red-400" />Cancelled</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{d?.cancelledLoads || 0}</div></CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Tab: Broker Scorecard ──
function ScorecardTab({ isLight }: { isLight: boolean }) {
  const scQ = (trpc as any).brokerManagement?.getBrokerScorecard?.useQuery?.({ period: "90d" }) || { data: null, isLoading: false };
  const sc = scQ.data;
  const cc = cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");

  if (scQ.isLoading) return <SectionSkeleton />;
  if (!sc) return <div className={cn("text-center py-12", isLight ? "text-slate-500" : "text-slate-400")}>No scorecard data available</div>;

  const gradeColor = sc.overallGrade?.startsWith("A") ? "text-emerald-500" : sc.overallGrade?.startsWith("B") ? "text-amber-500" : "text-red-400";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={cn(cc, "col-span-1")}>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Overall Grade</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center py-4">
            <div className={cn("text-6xl font-black", gradeColor)}>{sc.overallGrade}</div>
            <div className={cn("text-sm mt-2", isLight ? "text-slate-500" : "text-slate-400")}>Score: {sc.overallScore}/100</div>
          </CardContent>
        </Card>

        <Card className={cn(cc, "col-span-1 md:col-span-2")}>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Performance Metrics</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {sc.metrics && Object.entries(sc.metrics).map(([key, m]: [string, any]) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className={isLight ? "text-slate-600" : "text-slate-300"}>{m.label}</span>
                  <span className="font-semibold">{m.value}%</span>
                </div>
                <Progress value={m.value} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Target className={cn("w-5 h-5", amber(isLight))} />} label="On-Time Rate" value={`${sc.onTimeRate}%`} isLight={isLight} />
        <KpiCard icon={<FileText className={cn("w-5 h-5", orange(isLight))} />} label="Total Loads" value={sc.totalLoads} isLight={isLight} accent={orangeBg(isLight)} />
        <KpiCard icon={<AlertTriangle className="w-5 h-5 text-red-400" />} label="Claim Rate" value={`${sc.claimRate}%`} isLight={isLight} accent="bg-red-500/10" />
        <KpiCard icon={<Clock className={cn("w-5 h-5", amber(isLight))} />} label="Avg Payment Days" value={sc.avgPaymentDays} isLight={isLight} />
      </div>
    </div>
  );
}

// ── Tab: Carrier Pool ──
function CarrierPoolTab({ isLight }: { isLight: boolean }) {
  const poolQ = (trpc as any).brokerManagement?.getCarrierPool?.useQuery?.({ status: "all", limit: 50 }) || { data: null, isLoading: false };
  const pool = poolQ.data;
  const cc = cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");

  if (poolQ.isLoading) return <SectionSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={cn("text-lg font-semibold", isLight ? "text-slate-800" : "text-white")}>Carrier Pool ({pool?.total || 0})</h3>
        <Button size="sm" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
          <UserCheck className="w-4 h-4 mr-1" />Vet New Carrier
        </Button>
      </div>

      <Card className={cc}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b", isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-slate-800/80")}>
                  <th className="text-left px-4 py-3 font-medium">Carrier</th>
                  <th className="text-left px-4 py-3 font-medium">Location</th>
                  <th className="text-center px-4 py-3 font-medium">Loads</th>
                  <th className="text-center px-4 py-3 font-medium">Completion</th>
                  <th className="text-right px-4 py-3 font-medium">Revenue</th>
                  <th className="text-center px-4 py-3 font-medium">Score</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(pool?.carriers || []).map((c: any, i: number) => (
                  <tr key={i} className={cn("border-b last:border-0", isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/30")}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.companyName}</div>
                      <div className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>MC# {c.mcNumber || "N/A"}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">{c.location || "—"}</td>
                    <td className="px-4 py-3 text-center">{c.totalLoads}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={c.completionRate >= 90 ? "default" : c.completionRate >= 70 ? "secondary" : "destructive"}
                        className={c.completionRate >= 90 ? "bg-emerald-500/20 text-emerald-400 border-0" : ""}>
                        {c.completionRate}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">${(c.totalRevenue || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className={cn("w-3 h-3", c.performanceScore >= 80 ? "text-amber-400 fill-amber-400" : "text-slate-400")} />
                        <span className="text-sm">{c.performanceScore}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">Vetted</Badge>
                    </td>
                  </tr>
                ))}
                {(!pool?.carriers || pool.carriers.length === 0) && (
                  <tr><td colSpan={7} className={cn("text-center py-8", isLight ? "text-slate-400" : "text-slate-500")}>No carriers in pool yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab: Double Brokering Detection ──
function DoubleBrokeringTab({ isLight }: { isLight: boolean }) {
  const dbQ = (trpc as any).brokerManagement?.getDoubleBrokeringDetection?.useQuery?.({ period: "30d", riskLevel: "all" }) || { data: null, isLoading: false };
  const data = dbQ.data;
  const cc = cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");

  if (dbQ.isLoading) return <SectionSkeleton />;

  const summary = data?.summary || { total: 0, high: 0, medium: 0, low: 0 };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<ShieldAlert className="w-5 h-5 text-red-400" />} label="Total Alerts" value={summary.total} isLight={isLight} accent="bg-red-500/10" />
        <KpiCard icon={<AlertTriangle className="w-5 h-5 text-red-500" />} label="High Risk" value={summary.high} isLight={isLight} accent="bg-red-500/10" />
        <KpiCard icon={<AlertTriangle className="w-5 h-5 text-amber-500" />} label="Medium Risk" value={summary.medium} isLight={isLight} />
        <KpiCard icon={<Shield className="w-5 h-5 text-emerald-500" />} label="Low Risk" value={summary.low} isLight={isLight} accent="bg-emerald-500/10" />
      </div>

      <Card className={cc}>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Eye className="w-4 h-4 text-amber-500" />Detection Alerts</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(data?.alerts || []).length === 0 ? (
            <div className="flex items-center gap-3 py-8 justify-center">
              <Shield className="w-8 h-8 text-emerald-500" />
              <span className={isLight ? "text-slate-500" : "text-slate-400"}>No double-brokering alerts detected. All clear.</span>
            </div>
          ) : (
            (data?.alerts || []).map((alert: any, i: number) => (
              <div key={i} className={cn("p-4 rounded-lg border", isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-slate-800/80")}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-xs border-0",
                      alert.riskLevel === "high" ? "bg-red-500/20 text-red-400" :
                        alert.riskLevel === "medium" ? "bg-amber-500/20 text-amber-400" :
                          "bg-blue-500/20 text-blue-400"
                    )}>{alert.riskLevel.toUpperCase()}</Badge>
                    <span className="font-medium text-sm">{alert.loadNumber}</span>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs h-7">
                    <Eye className="w-3 h-3 mr-1" />Investigate
                  </Button>
                </div>
                <p className={cn("text-sm", isLight ? "text-slate-600" : "text-slate-400")}>{alert.reason}</p>
                {alert.evidence?.map((e: string, j: number) => (
                  <div key={j} className={cn("text-xs mt-1 pl-3 border-l-2", isLight ? "border-amber-300 text-slate-500" : "border-amber-500 text-slate-500")}>{e}</div>
                ))}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab: Commissions ──
function CommissionsTab({ isLight }: { isLight: boolean }) {
  const commQ = (trpc as any).brokerManagement?.getCommissionTracking?.useQuery?.({ period: "30d" }) || { data: null, isLoading: false };
  const data = commQ.data;
  const cc = cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");

  if (commQ.isLoading) return <SectionSkeleton />;

  const summary = data?.summary || { totalEarned: 0, totalPending: 0, avgRate: 0, loadCount: 0 };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<DollarSign className={cn("w-5 h-5", amber(isLight))} />} label="Earned" value={`$${summary.totalEarned.toLocaleString()}`} isLight={isLight} />
        <KpiCard icon={<Clock className={cn("w-5 h-5", orange(isLight))} />} label="Pending" value={`$${summary.totalPending.toLocaleString()}`} isLight={isLight} accent={orangeBg(isLight)} />
        <KpiCard icon={<Percent className={cn("w-5 h-5", amber(isLight))} />} label="Avg Rate" value={`${summary.avgRate}%`} isLight={isLight} />
        <KpiCard icon={<FileText className={cn("w-5 h-5", orange(isLight))} />} label="Loads" value={summary.loadCount} isLight={isLight} accent={orangeBg(isLight)} />
      </div>

      <Card className={cc}>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><CreditCard className="w-4 h-4 text-amber-500" />Recent Commissions</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b", isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-slate-800/80")}>
                  <th className="text-left px-4 py-3 font-medium">Load</th>
                  <th className="text-right px-4 py-3 font-medium">Rate</th>
                  <th className="text-center px-4 py-3 font-medium">Comm %</th>
                  <th className="text-right px-4 py-3 font-medium">Commission</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.commissions || []).slice(0, 15).map((c: any, i: number) => (
                  <tr key={i} className={cn("border-b last:border-0", isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/30")}>
                    <td className="px-4 py-3 font-medium">{c.loadNumber}</td>
                    <td className="px-4 py-3 text-right">${c.loadRate.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">{c.commissionRate}%</td>
                    <td className="px-4 py-3 text-right font-semibold text-amber-500">${c.commissionAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={cn("text-xs border-0", c.status === "paid" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400")}>
                        {c.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {(!data?.commissions || data.commissions.length === 0) && (
                  <tr><td colSpan={5} className={cn("text-center py-8", isLight ? "text-slate-400" : "text-slate-500")}>No commissions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab: 3PL Management ──
function ThreePLTab({ isLight }: { isLight: boolean }) {
  const plQ = (trpc as any).brokerManagement?.get3plManagement?.useQuery?.() || { data: null, isLoading: false };
  const perfQ = (trpc as any).brokerManagement?.get3plPerformance?.useQuery?.({ period: "30d" }) || { data: null, isLoading: false };
  const data = plQ.data;
  const perf = perfQ.data;
  const cc = cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");

  if (plQ.isLoading) return <SectionSkeleton />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard icon={<Building2 className={cn("w-5 h-5", amber(isLight))} />} label="3PL Customers" value={data?.summary?.totalCustomers || 0} isLight={isLight} />
        <KpiCard icon={<FileText className={cn("w-5 h-5", orange(isLight))} />} label="Active Contracts" value={data?.summary?.activeContracts || 0} isLight={isLight} accent={orangeBg(isLight)} />
        <KpiCard icon={<Target className="w-5 h-5 text-emerald-500" />} label="Avg SLA Compliance" value={`${data?.summary?.avgSlaCompliance || 0}%`} isLight={isLight} accent="bg-emerald-500/10" />
      </div>

      {/* SLA Performance */}
      {perf?.performance && perf.performance.length > 0 && (
        <Card className={cc}>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-amber-500" />SLA Performance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {perf.performance.map((p: any, i: number) => {
              const met = p.unit === "%" ? p.value >= p.target : p.value <= p.target;
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={isLight ? "text-slate-600" : "text-slate-300"}>{p.metric}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{p.value}{p.unit}</span>
                      <span className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>target: {p.target}{p.unit}</span>
                      {met ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                    </div>
                  </div>
                  <Progress value={p.unit === "%" ? p.value : Math.min(100, (p.target / Math.max(p.value, 1)) * 100)} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Customer List */}
      <Card className={cc}>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Layers className="w-4 h-4 text-amber-500" />3PL Customers</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b", isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-slate-800/80")}>
                  <th className="text-left px-4 py-3 font-medium">Customer</th>
                  <th className="text-center px-4 py-3 font-medium">Loads</th>
                  <th className="text-center px-4 py-3 font-medium">SLA</th>
                  <th className="text-right px-4 py-3 font-medium">Revenue</th>
                  <th className="text-center px-4 py-3 font-medium">Health</th>
                </tr>
              </thead>
              <tbody>
                {(data?.customers || []).slice(0, 15).map((c: any, i: number) => (
                  <tr key={i} className={cn("border-b last:border-0", isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/30")}>
                    <td className="px-4 py-3 font-medium">{c.companyName}</td>
                    <td className="px-4 py-3 text-center">{c.totalLoads}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={cn("text-xs border-0", c.slaCompliance >= 95 ? "bg-emerald-500/20 text-emerald-400" : c.slaCompliance >= 85 ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400")}>
                        {c.slaCompliance}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">${(c.totalRevenue || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={cn("text-xs border-0",
                        c.healthScore === "excellent" ? "bg-emerald-500/20 text-emerald-400" :
                          c.healthScore === "good" ? "bg-blue-500/20 text-blue-400" :
                            c.healthScore === "fair" ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
                      )}>{c.healthScore}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab: Carrier Relationships ──
function RelationshipsTab({ isLight }: { isLight: boolean }) {
  const relQ = (trpc as any).brokerManagement?.getBrokerCarrierRelationships?.useQuery?.({ limit: 30 }) || { data: null, isLoading: false };
  const data = relQ.data;
  const cc = cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");

  if (relQ.isLoading) return <SectionSkeleton />;

  const tierColors: Record<string, string> = {
    gold: "bg-amber-500/20 text-amber-400",
    silver: "bg-slate-400/20 text-slate-300",
    bronze: "bg-orange-500/20 text-orange-400",
  };

  return (
    <div className="space-y-4">
      <Card className={cc}>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Handshake className="w-4 h-4 text-amber-500" />Carrier Relationships ({data?.total || 0})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b", isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-slate-800/80")}>
                  <th className="text-left px-4 py-3 font-medium">Carrier</th>
                  <th className="text-center px-4 py-3 font-medium">Loads</th>
                  <th className="text-center px-4 py-3 font-medium">Reliability</th>
                  <th className="text-center px-4 py-3 font-medium">Score</th>
                  <th className="text-center px-4 py-3 font-medium">Tier</th>
                  <th className="text-center px-4 py-3 font-medium">Tenure</th>
                  <th className="text-right px-4 py-3 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(data?.relationships || []).map((r: any, i: number) => (
                  <tr key={i} className={cn("border-b last:border-0", isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/30")}>
                    <td className="px-4 py-3 font-medium">{r.companyName}</td>
                    <td className="px-4 py-3 text-center">{r.totalLoads}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={cn("text-xs border-0", r.reliability >= 90 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400")}>
                        {r.reliability}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">{r.relationshipScore}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={cn("text-xs border-0 capitalize", tierColors[r.tier] || tierColors.bronze)}>
                        {r.tier}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-xs">{r.tenureDays}d</td>
                    <td className="px-4 py-3 text-right">${(r.totalRevenue || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab: Margin Analysis ──
function MarginAnalysisTab({ isLight }: { isLight: boolean }) {
  const marginQ = (trpc as any).brokerManagement?.getBrokerMarginAnalysis?.useQuery?.({ period: "90d" }) || { data: null, isLoading: false };
  const riskQ = (trpc as any).brokerManagement?.getBrokerRiskManagement?.useQuery?.({ period: "30d" }) || { data: null, isLoading: false };
  const data = marginQ.data;
  const risk = riskQ.data;
  const cc = cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50");

  if (marginQ.isLoading) return <SectionSkeleton />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<PieChart className={cn("w-5 h-5", amber(isLight))} />} label="Overall Margin" value={`${data?.overallMargin || 0}%`} isLight={isLight} />
        <KpiCard icon={<DollarSign className={cn("w-5 h-5", orange(isLight))} />} label="Total Revenue" value={`$${((data?.totalRevenue || 0) / 1000).toFixed(1)}k`} isLight={isLight} accent={orangeBg(isLight)} />
        <KpiCard icon={<TrendingUp className="w-5 h-5 text-emerald-500" />} label="Total Profit" value={`$${((data?.totalProfit || 0) / 1000).toFixed(1)}k`} isLight={isLight} accent="bg-emerald-500/10" />
        <KpiCard icon={<BarChart3 className={cn("w-5 h-5", amber(isLight))} />} label="Loads Analyzed" value={data?.totalLoads || 0} isLight={isLight} />
      </div>

      {/* Monthly Breakdown */}
      {data?.analysis && data.analysis.length > 0 && (
        <Card className={cc}>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-amber-500" />Monthly Margin Breakdown</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b", isLight ? "border-slate-200 bg-slate-50" : "border-slate-700 bg-slate-800/80")}>
                  <th className="text-left px-4 py-3 font-medium">Period</th>
                  <th className="text-right px-4 py-3 font-medium">Revenue</th>
                  <th className="text-right px-4 py-3 font-medium">Cost</th>
                  <th className="text-right px-4 py-3 font-medium">Profit</th>
                  <th className="text-center px-4 py-3 font-medium">Margin</th>
                  <th className="text-center px-4 py-3 font-medium">Loads</th>
                </tr>
              </thead>
              <tbody>
                {data.analysis.map((m: any, i: number) => (
                  <tr key={i} className={cn("border-b last:border-0", isLight ? "border-slate-100" : "border-slate-700/50")}>
                    <td className="px-4 py-3 font-medium">{m.period}</td>
                    <td className="px-4 py-3 text-right">${m.revenue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">${m.estimatedCost.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-emerald-500 font-medium">${m.profit.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center"><Badge className="bg-amber-500/20 text-amber-400 border-0 text-xs">{m.margin}%</Badge></td>
                    <td className="px-4 py-3 text-center">{m.loadCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Risk Overview */}
      {risk?.risks && risk.risks.length > 0 && (
        <Card className={cc}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-amber-500" />Risk Management</span>
              <Badge className={cn("text-xs border-0",
                risk.riskLevel === "low" ? "bg-emerald-500/20 text-emerald-400" :
                  risk.riskLevel === "medium" ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
              )}>Overall: {risk.riskLevel}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {risk.risks.map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <span className={cn("text-sm", isLight ? "text-slate-600" : "text-slate-300")}>{r.category}</span>
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>{r.detail}</span>
                  <Badge className={cn("text-xs border-0",
                    r.level === "low" ? "bg-emerald-500/20 text-emerald-400" :
                      r.level === "medium" ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
                  )}>{r.level}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══ MAIN COMPONENT ═══
export default function BrokerManagement() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            Broker & 3PL Management
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Operations, compliance, carrier relationships, margin analysis & 3PL SLAs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-amber-500/20 text-amber-400 border-0 px-3 py-1">
            <Scale className="w-3 h-3 mr-1" />Broker Module
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={cn("flex flex-wrap h-auto gap-1 p-1 rounded-xl", isLight ? "bg-slate-100" : "bg-slate-800/80")}>
          <TabsTrigger value="dashboard" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="scorecard" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white">
            Scorecard
          </TabsTrigger>
          <TabsTrigger value="carriers" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white">
            Carrier Pool
          </TabsTrigger>
          <TabsTrigger value="double-brokering" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white">
            Double-Brokering
          </TabsTrigger>
          <TabsTrigger value="commissions" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white">
            Commissions
          </TabsTrigger>
          <TabsTrigger value="3pl" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white">
            3PL
          </TabsTrigger>
          <TabsTrigger value="relationships" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white">
            Relationships
          </TabsTrigger>
          <TabsTrigger value="margins" className="text-xs sm:text-sm rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white">
            Margins & Risk
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><DashboardTab isLight={isLight} /></TabsContent>
        <TabsContent value="scorecard"><ScorecardTab isLight={isLight} /></TabsContent>
        <TabsContent value="carriers"><CarrierPoolTab isLight={isLight} /></TabsContent>
        <TabsContent value="double-brokering"><DoubleBrokeringTab isLight={isLight} /></TabsContent>
        <TabsContent value="commissions"><CommissionsTab isLight={isLight} /></TabsContent>
        <TabsContent value="3pl"><ThreePLTab isLight={isLight} /></TabsContent>
        <TabsContent value="relationships"><RelationshipsTab isLight={isLight} /></TabsContent>
        <TabsContent value="margins"><MarginAnalysisTab isLight={isLight} /></TabsContent>
      </Tabs>
    </div>
  );
}
