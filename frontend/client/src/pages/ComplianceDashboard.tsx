/**
 * COMPLIANCE DASHBOARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Shield, CheckCircle, AlertTriangle, Clock, FileText,
  User, Truck, TestTube
} from "lucide-react";
import { cn } from "@/lib/utils";

function IRPComplianceSection() {
  const irpStatusQuery = (trpc as any).compliance.getIRPStatus.useQuery();
  const irpRegsQuery = (trpc as any).compliance.getIRPRegistrations.useQuery({ limit: 10 });
  const status = irpStatusQuery.data || { cabCardStatus: "unknown", registeredStates: 0, renewalDue: null, totalFees: 0 };
  const regs: any[] = irpRegsQuery.data || [];

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Truck className="w-5 h-5 text-cyan-400" />
          IRP Compliance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-slate-400 mb-4">International Registration Plan — apportioned vehicle registrations across jurisdictions</p>
        {irpStatusQuery.isLoading ? (
          <div className="space-y-3"><Skeleton className="h-20 w-full rounded-lg" /><Skeleton className="h-20 w-full rounded-lg" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 rounded-lg bg-slate-700/30">
                <p className="text-xs text-slate-400">Cab Card Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {status.cabCardStatus === "active" ? <CheckCircle className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                  <span className={status.cabCardStatus === "active" ? "text-green-400 font-bold" : "text-yellow-400 font-bold"}>
                    {status.cabCardStatus === "active" ? "Active" : status.cabCardStatus === "inactive" ? "Inactive" : "No Data"}
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-700/30">
                <p className="text-xs text-slate-400">Registered States</p>
                <p className="text-2xl font-bold text-white mt-1">{status.registeredStates}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-700/30">
                <p className="text-xs text-slate-400">Renewal Due</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-bold">
                    {status.renewalDue ? new Date(status.renewalDue).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "N/A"}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {regs.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-sm">No IRP registrations found</div>
              ) : (
                regs.map((reg: any) => (
                  <div key={reg.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-700/20 hover:bg-slate-700/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">{reg.state}</span>
                      <div>
                        <span className="text-white text-sm font-medium">Max Weight: {(reg.maxWeight || 80000).toLocaleString()} lbs</span>
                        <p className="text-xs text-slate-500">Distance %: {reg.distancePercent}%</p>
                      </div>
                    </div>
                    <Badge className={cn("border-0 text-xs", reg.status === "active" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400")}>{reg.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function ComplianceDashboard() {
  const statsQuery = (trpc as any).compliance.getDashboardStats.useQuery();
  const expiringQuery = (trpc as any).compliance.getExpiringItems.useQuery({ limit: 5 });
  const violationsQuery = (trpc as any).compliance.getRecentViolations.useQuery({ limit: 5 });
  const scoresQuery = (trpc as any).compliance.getComplianceScores.useQuery();

  const stats = statsQuery.data;
  const scores = scoresQuery.data;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return "bg-green-500/20";
    if (score >= 70) return "bg-yellow-500/20";
    return "bg-red-500/20";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Compliance Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Overview of compliance status</p>
        </div>
      </div>

      {statsQuery.isLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : (
        <Card className={cn("rounded-xl", (stats?.overallScore ?? 0) >= 90 ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30" : (stats?.overallScore ?? 0) >= 70 ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30" : "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30")}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Overall Compliance Score</p>
                <p className={cn("text-5xl font-bold", getScoreColor(stats?.overallScore || 0))}>{stats?.overallScore}%</p>
                <p className="text-sm text-slate-400 mt-1">{stats?.trend === "up" ? "Improving" : stats?.trend === "down" ? "Declining" : "Stable"} from last month</p>
              </div>
              <div className={cn("p-4 rounded-full", getScoreBg(stats?.overallScore || 0))}>
                <Shield className={cn("w-12 h-12", getScoreColor(stats?.overallScore || 0))} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.violations || 0}</p>}<p className="text-xs text-slate-400">Violations</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Clock className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.expiring || 0}</p>}<p className="text-xs text-slate-400">Expiring</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20"><FileText className="w-6 h-6 text-blue-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-blue-400">{stats?.pendingAudits || 0}</p>}<p className="text-xs text-slate-400">Audits</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.compliant || 0}</p>}<p className="text-xs text-slate-400">Compliant</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-cyan-400" />Compliance by Category</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {scoresQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3, 4, 5, 6].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : (
              scores?.categories?.map((cat: any) => (
                <div key={cat.name} className="p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {cat.name === "DQ Files" && <User className="w-4 h-4 text-cyan-400" />}
                      {cat.name === "HOS" && <Clock className="w-4 h-4 text-purple-400" />}
                      {cat.name === "D&A Testing" && <TestTube className="w-4 h-4 text-green-400" />}
                      {cat.name === "Vehicle" && <Truck className="w-4 h-4 text-blue-400" />}
                      {cat.name === "Hazmat" && <AlertTriangle className="w-4 h-4 text-orange-400" />}
                      {cat.name === "Documents" && <FileText className="w-4 h-4 text-yellow-400" />}
                      <span className="text-white font-medium">{cat.name}</span>
                    </div>
                    <span className={cn("font-bold", getScoreColor(cat.score))}>{cat.score}%</span>
                  </div>
                  <Progress value={cat.score} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-yellow-400" />Expiring Soon</CardTitle></CardHeader>
            <CardContent className="p-0">
              {expiringQuery.isLoading ? (
                <div className="p-4 space-y-2">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
              ) : (expiringQuery.data as any)?.length === 0 ? (
                <div className="p-4 text-center text-slate-400">No items expiring soon</div>
              ) : (
                <div className="divide-y divide-yellow-500/20">
                  {(expiringQuery.data as any)?.map((item: any) => (
                    <div key={item.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.type} | {item.entity}</p>
                      </div>
                      <Badge className={cn("border-0", item.daysRemaining <= 7 ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400")}>{item.daysRemaining} days</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" />Recent Violations</CardTitle></CardHeader>
            <CardContent className="p-0">
              {violationsQuery.isLoading ? (
                <div className="p-4 space-y-2">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
              ) : (violationsQuery.data as any)?.length === 0 ? (
                <div className="p-4 text-center text-green-400 flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5" />No recent violations</div>
              ) : (
                <div className="divide-y divide-red-500/20">
                  {(violationsQuery.data as any)?.map((v: any) => (
                    <div key={v.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{v.type}</p>
                        <p className="text-xs text-slate-500">{v.entity} | {v.date}</p>
                      </div>
                      <Badge className={cn("border-0", v.severity === "critical" ? "bg-red-500 text-white" : "bg-orange-500/20 text-orange-400")}>{v.severity}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* IRP Compliance Section (C-073) — Real DB data */}
      <IRPComplianceSection />
    </div>
  );
}
