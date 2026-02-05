/**
 * MVR REPORTS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  FileText, Search, CheckCircle, AlertTriangle,
  User, Plus, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function MVRReports() {
  const [search, setSearch] = useState("");

  const reportsQuery = (trpc as any).compliance.getMVRReports.useQuery({ search });
  const statsQuery = (trpc as any).compliance.getMVRStats.useQuery();

  const requestMutation = (trpc as any).compliance.requestMVR.useMutation({
    onSuccess: () => { toast.success("MVR requested"); reportsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "clear": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Clear</Badge>;
      case "violations": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Violations</Badge>;
      case "suspended": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Suspended</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">MVR Reports</h1>
          <p className="text-slate-400 text-sm mt-1">Motor Vehicle Records</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Request MVR
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><FileText className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Total</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.clear || 0}</p>}<p className="text-xs text-slate-400">Clear</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><AlertTriangle className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.violations || 0}</p>}<p className="text-xs text-slate-400">Violations</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Calendar className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.dueForRenewal || 0}</p>}<p className="text-xs text-slate-400">Due</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search MVRs..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-cyan-400" />MVR Reports</CardTitle></CardHeader>
        <CardContent className="p-0">
          {reportsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : (reportsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No MVRs found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(reportsQuery.data as any)?.map((report: any) => (
                <div key={report.id} className={cn("p-4 flex items-center justify-between", report.status === "violations" && "bg-yellow-500/5 border-l-2 border-yellow-500", report.status === "suspended" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", report.status === "clear" ? "bg-green-500/20" : report.status === "violations" ? "bg-yellow-500/20" : "bg-red-500/20")}>
                      <FileText className={cn("w-5 h-5", report.status === "clear" ? "text-green-400" : report.status === "violations" ? "text-yellow-400" : "text-red-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{report.driverName}</p>
                        {getStatusBadge(report.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <User className="w-3 h-3" /><span>License: {report.licenseNumber}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>State: {report.state}</span>
                        <span>Pulled: {report.pulledDate}</span>
                        <span>Points: {report.points}</span>
                        <span>Violations: {report.violationCount}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg">View</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
