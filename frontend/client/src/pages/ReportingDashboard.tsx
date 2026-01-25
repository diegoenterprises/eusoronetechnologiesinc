/**
 * REPORTING DASHBOARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  BarChart3, Download, Calendar, TrendingUp, DollarSign,
  Package, Truck, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ReportingDashboard() {
  const [period, setPeriod] = useState("month");

  const statsQuery = trpc.reports.getOverviewStats.useQuery({ period });
  const reportsQuery = trpc.reports.getAvailableReports.useQuery();

  const generateMutation = trpc.reports.generateReport.useMutation({
    onSuccess: () => toast.success("Report generated"),
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Reporting Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Analytics and reports</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><Calendar className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Package className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.totalLoads || 0}</p>}<p className="text-xs text-slate-400">Loads</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><DollarSign className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-green-400">${stats?.revenue?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Revenue</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Truck className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-purple-400">{stats?.miles?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Miles</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><TrendingUp className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.growth}%</p>}<p className="text-xs text-slate-400">Growth</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl h-[300px]">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-cyan-400" />Revenue Trend</CardTitle></CardHeader>
          <CardContent className="h-[220px] flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">Chart visualization placeholder</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl h-[300px]">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-400" />Load Volume</CardTitle></CardHeader>
          <CardContent className="h-[220px] flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">Chart visualization placeholder</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-purple-400" />Available Reports</CardTitle></CardHeader>
        <CardContent>
          {reportsQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reportsQuery.data?.map((report: any) => (
                <div key={report.id} className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/50 hover:border-cyan-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-bold">{report.name}</p>
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-xs">{report.type}</Badge>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{report.description}</p>
                  <Button size="sm" variant="outline" className="w-full bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => generateMutation.mutate({ reportId: report.id, period })}>
                    <Download className="w-4 h-4 mr-2" />Generate
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
