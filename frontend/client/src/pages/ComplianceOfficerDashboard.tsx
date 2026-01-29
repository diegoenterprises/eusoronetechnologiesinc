/**
 * COMPLIANCE OFFICER DASHBOARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Shield, FileText, Clock, AlertTriangle, User,
  CheckCircle, TestTube, Truck
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ComplianceOfficerDashboard() {
  const statsQuery = trpc.compliance.getDashboardStats.useQuery();
  const scoresQuery = trpc.compliance.getComplianceScores.useQuery();
  const expiringQuery = trpc.compliance.getExpiringItems.useQuery({ limit: 5 });
  const violationsQuery = trpc.compliance.getRecentViolations.useQuery({ limit: 5 });

  const stats = statsQuery.data;
  const scores = scoresQuery.data;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Compliance Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Regulatory compliance overview</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <FileText className="w-4 h-4 mr-2" />Run Audit
        </Button>
      </div>

      {statsQuery.isLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : (
        <Card className={cn("rounded-xl", (stats?.overallScore ?? 0) >= 90 ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30" : (stats?.overallScore ?? 0) >= 70 ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30" : "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30")}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Compliance Score</p>
                <p className={cn("text-5xl font-bold", getScoreColor(stats?.overallScore || 0))}>{stats?.overallScore}%</p>
              </div>
              <div className={cn("p-4 rounded-full", (stats?.overallScore ?? 0) >= 90 ? "bg-green-500/20" : (stats?.overallScore ?? 0) >= 70 ? "bg-yellow-500/20" : "bg-red-500/20")}>
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
              <div className="p-3 rounded-full bg-yellow-500/20"><Clock className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.expiringDocs || 0}</p>}<p className="text-xs text-slate-400">Expiring</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.overdueItems || 0}</p>}<p className="text-xs text-slate-400">Overdue</p></div>
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
              <div className="p-3 rounded-full bg-purple-500/20"><AlertTriangle className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.violations || 0}</p>}<p className="text-xs text-slate-400">Violations</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl lg:col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-cyan-400" />Score Breakdown</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {scoresQuery.isLoading ? (
              [1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
            ) : (
              scores?.categories?.map((cat: any) => (
                <div key={cat.name} className="p-4 rounded-lg bg-slate-700/30">
                  <div className="flex items-center gap-2 mb-2">
                    {cat.name === "DQ Files" && <User className="w-4 h-4 text-cyan-400" />}
                    {cat.name === "HOS" && <Clock className="w-4 h-4 text-purple-400" />}
                    {cat.name === "D&A Testing" && <TestTube className="w-4 h-4 text-green-400" />}
                    {cat.name === "Vehicle" && <Truck className="w-4 h-4 text-blue-400" />}
                    {cat.name === "Hazmat" && <AlertTriangle className="w-4 h-4 text-orange-400" />}
                    {cat.name === "Documents" && <FileText className="w-4 h-4 text-yellow-400" />}
                    <span className="text-white font-medium text-sm">{cat.name}</span>
                  </div>
                  <p className={cn("text-2xl font-bold mb-1", getScoreColor(cat.score))}>{cat.score}%</p>
                  <Progress value={cat.score} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-yellow-400" />Expiring Soon</CardTitle></CardHeader>
            <CardContent className="p-0">
              {expiringQuery.isLoading ? (
                <div className="p-3 space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
              ) : (
                <div className="divide-y divide-yellow-500/20">
                  {expiringQuery.data?.map((item: any) => (
                    <div key={item.id} className="p-2 flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.entity}</p>
                      </div>
                      <Badge className={cn("border-0 text-xs", item.daysRemaining <= 7 ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400")}>{item.daysRemaining}d</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" />Violations</CardTitle></CardHeader>
            <CardContent className="p-0">
              {violationsQuery.isLoading ? (
                <div className="p-3 space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
              ) : violationsQuery.data?.length === 0 ? (
                <div className="p-3 text-center text-green-400 text-sm flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4" />No violations</div>
              ) : (
                <div className="divide-y divide-red-500/20">
                  {violationsQuery.data?.map((v: any) => (
                    <div key={v.id} className="p-2 flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm">{v.type}</p>
                        <p className="text-xs text-slate-500">{v.entity}</p>
                      </div>
                      <Badge className={cn("border-0 text-xs", v.severity === "critical" ? "bg-red-500 text-white" : "bg-orange-500/20 text-orange-400")}>{v.severity}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
