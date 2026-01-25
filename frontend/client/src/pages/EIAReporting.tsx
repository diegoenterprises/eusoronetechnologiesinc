/**
 * EIA REPORTING PAGE
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
  FileText, Fuel, Building, Download, Calendar,
  CheckCircle, Clock, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function EIAReporting() {
  const [period, setPeriod] = useState("weekly");

  const reportQuery = trpc.terminals.getEIAReport.useQuery({ period });
  const statsQuery = trpc.terminals.getEIAStats.useQuery({ period });

  const submitMutation = trpc.terminals.submitEIAReport.useMutation({
    onSuccess: () => { toast.success("Report submitted"); reportQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;
  const report = reportQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">EIA Reporting</h1>
          <p className="text-slate-400 text-sm mt-1">Energy Information Administration</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => submitMutation.mutate({ period })}>
            <Download className="w-4 h-4 mr-2" />Submit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Fuel className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.totalVolume?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Total BBL</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><Building className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.terminals || 0}</p>}<p className="text-xs text-slate-400">Terminals</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><FileText className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.products || 0}</p>}<p className="text-xs text-slate-400">Products</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Calendar className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.pendingReports || 0}</p>}<p className="text-xs text-slate-400">Pending</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Fuel className="w-5 h-5 text-cyan-400" />Product Inventory</CardTitle></CardHeader>
        <CardContent className="p-0">
          {reportQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : report?.products?.length === 0 ? (
            <div className="text-center py-16"><Fuel className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No inventory data</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {report?.products?.map((product: any) => (
                <div key={product.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-cyan-500/20">
                      <Fuel className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold">{product.name}</p>
                      <p className="text-sm text-slate-400">{product.terminal}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>Grade: {product.grade}</span>
                        <span>Tank: {product.tank}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-cyan-400">{product.volume?.toLocaleString()} BBL</p>
                    <p className="text-xs text-slate-500">Capacity: {product.capacity?.toLocaleString()} BBL</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {report?.status && (
        <Card className={cn("rounded-xl", report.status === "submitted" ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30" : report.status === "pending" ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30" : "bg-slate-800/50 border-slate-700/50")}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {report.status === "submitted" ? <CheckCircle className="w-6 h-6 text-green-400" /> : report.status === "pending" ? <Clock className="w-6 h-6 text-yellow-400" /> : <AlertTriangle className="w-6 h-6 text-red-400" />}
              <div>
                <p className="text-white font-bold">Report Status: <span className="capitalize">{report.status}</span></p>
                <p className="text-sm text-slate-400">Period: {report.periodStart} - {report.periodEnd} | Due: {report.dueDate}</p>
              </div>
            </div>
            <Badge className={cn("border-0", report.status === "submitted" ? "bg-green-500/20 text-green-400" : report.status === "pending" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400")}>{report.status}</Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
